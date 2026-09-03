---
title: "TLS/SSL Exhaustion (vector: tls_churn)"
description: How the tls_churn vector exhausts TLS handshake state through churn or partial handshakes.
---

# TLS/SSL Exhaustion

The `tls_churn` vector runs the TLS/SSL Exhaustion attack. The attack
forces the server through expensive TLS handshake work. The vector has two
modes: `churn` and `partial`. The attack works at OSI layer 7, the
application layer. Use Avalanche only against systems you own or have
written permission to test.

## When to use

Use the vector when you want to test how a TLS endpoint copes with many
handshakes. TLS handshakes cost the server CPU because of the asymmetric
cryptography.

Good test targets include:

- Your own HTTPS endpoint or TLS termination proxy.
- A staging load balancer that ends TLS sessions.
- A service that assigns work per handshake, such as mutual TLS.

Churn mode suits servers that complete handshakes quickly. Partial mode
suits servers that keep half-open handshake state.

## How it works

The `TlsChurnFlood` class in `vectors/tls_churn.py` extends `AttackVector`
directly. It is not a slow-hold vector. Each worker thread opens plain TCP
connections and builds a minimal TLS 1.2 `ClientHello` by hand. The hello
offers a fixed cipher-suite list and one null compression method. It sends
no server name in the extension block.

The worker opens a socket with a 5-second connect timeout. After the send
or handshake, the worker sleeps for the jittered idle window and starts the
next connection. The class polls the kill switch on every cycle.

In `churn` mode, a worker completes a full TLS handshake and then closes
the connection immediately. The server does the CPU-bound cryptographic
work for every handshake, but the client never uses the session. The worker
repeats the cycle.

In `partial` mode, a worker sends a bare `ClientHello` and abandons the
connection. The server keeps half-open handshake state and waits for the
rest of the exchange. Repeated partial handshakes accumulate state on the
server. The worker pauses for the idle window, closes the socket, and
starts the next connection.

Between connections, each worker waits a random 0.05 to 0.25 seconds. The
class default is 20 workers. The vector needs no root access because it
uses plain sockets.

Every handshake records one request in the stats collector. The mode value
comes from the config key `mode`. An unknown mode falls back to `churn`
with a warning. The error path uses exponential backoff. When the target
stops accepting connections, the worker backs off before it retries.

### The TLS preflight probe

Churn mode runs a preflight probe before any worker starts. The probe
performs one real TLS handshake against the target and waits up to 3
seconds.

The probe exists to surface a real problem early. A target that does not
speak TLS on this port makes churn mode record a transport error on every
try. The probe logs a clear warning instead of letting the error wall
be the first signal.

The probe resolves the target first. When the name does not resolve, the
vector logs a warning and connects to the hostname as it is. The probe
itself runs in a worker thread so the event loop stays free.

The probe runs only in `churn` mode. Partial mode still applies when the
probe fails.

A failed probe does not stop the vector. It changes the signal the
operator sees. Instead of a wall of transport errors, the log carries one
clear warning before the workers start.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| TLS/SSL Exhaustion | L7 | Set `mode=churn` or `mode=partial`. The default is `churn`. |

## Configuration

The vector reads these keys from its config section. The typed model is
`TlsChurnConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `20` | Number of handshake threads. Range 1 to 1000. |
| `mode` | `churn` | Attack shape: `churn` or `partial`. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between connections. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--tls-churn N` | Enable the vector and set the worker count. |
| `--tls-churn-mode {churn,partial}` | Set the exhaustion mode. The default is `churn`. |

You can pass `--tls-churn-mode` on its own. The vector then starts with the
default 20 workers.

## Modifiers

The dashboard exposes one toggle for TLS/SSL Exhaustion.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the pause between connection tries. |

## Requirements

The vector needs no optional library and no root access. It uses plain
sockets and the Python standard `ssl` module.

::: warning
The handshake `ClientHello` carries no server name. Some servers use
server-name-based routing and can fail to complete the handshake. The
preflight probe in churn mode warns when the target does not complete a
handshake.
:::

## Example

```bash
avalanche -t example.test -p 443 --tls-churn 20 --tls-churn-mode churn -d 300
```

This command runs 20 handshake-churn workers against `example.test` for 300
seconds.

For the partial-handshake variant:

```bash
avalanche -t example.test -p 443 --tls-churn 20 --tls-churn-mode partial -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S Slowloris (vector: slowloris)](./vector-slowloris.md)
- [HTTP/2 attacks (vector: http2)](./vector-http2.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
