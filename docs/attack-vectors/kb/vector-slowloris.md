---
title: "HTTP/S Slowloris (vector: slowloris)"
description: How the slowloris vector holds incomplete HTTP requests to exhaust server connections.
---

# HTTP/S Slowloris

The `slowloris` vector runs the HTTP/S Slowloris attack. The attack opens
many TCP connections to the web server and keeps each request incomplete.
The attack works at OSI layer 7, the application layer. Use Avalanche only
against systems you own or have written permission to test.

## When to use

Use the vector when you want to test how a web server handles a slow-header
exhaustion attack. The attack targets servers that keep a worker thread or a
connection slot busy while it waits for the rest of a request.

Good test targets include:

- Your own web server that limits concurrent connections.
- A staging server behind your load balancer.
- A reverse proxy you manage, before a change in timeout policy.

Slowloris sends little traffic. It is a suitable vector for long, quiet
runs. Combine it with a [canary](../../user-guide/canary-killswitch.md) so
you can watch whether clean traffic still reaches the server.

## How it works

Each worker thread owns one TCP connection. The base class
`SlowSocketVector` in `vectors/base.py` owns the worker lifecycle. The
`Slowloris` class in `vectors/slowloris.py` supplies the wire behavior.

A worker sends a partial request. The request starts with a `GET` line and
a `Host` header, but it has no final empty line. A server cannot consider
the request complete without that line.

The worker then drips extra header lines one at a time. Each header has a
random name, random padding, and a random value. The drips arrive 5 to 15
seconds apart. The delay keeps the connection alive past the server's idle
timeout, but the request never finishes.

One connection carries 10 to 20 header drips. After the drip run ends, the
worker closes the connection and opens a fresh one. Each fresh connection
starts a new incomplete request.

The server keeps one connection slot and often one worker thread busy for
each held connection. Enough held connections fill the server's connection
pool. New legitimate clients then find no free slot.

Each worker repeats the cycle. When a connection ends, the worker waits a
short delay and opens another one. The class default is 30 workers.

Every open connection adds to the live active-connection count that the
dashboard shows. The count falls when a server closes the connection or
when the run stops.

Each drip asks the resource governor for a token before the send. When the
governor denies a token, the worker closes the connection and retries
after the reconnect delay. The worker checks the kill switch on every
cycle. When you stop the run, the held connections close at the next drip
boundary.

When the target uses HTTPS, the vector wraps each socket in TLS before it
sends. The `scheme` value decides this, as it does for all slow vectors.

The `hold_only` mode changes the behavior. In this mode the worker sends no
header drips. It keeps the connection open silently for the hold window,
then reconnects. Set `hold_seconds` to control the window.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| HTTP/S Slowloris | L7 | The vector has one behavior. Choose `hold_only` to hold without header drips. |

## Configuration

The vector reads these keys from its config section. The typed model is
`SlowlorisConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `True` | Start the vector in this run. |
| `workers` | `30` | Number of connection-holding threads. Range 1 to 1000. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, before each drip. |
| `hold_only` | `False` | Hold each connection open without header drips. |
| `hold_seconds` | `60` | Seconds to hold one connection in `hold_only` mode. Range 1 to 3600. |

The `slowloris` class also sets internal pacing constants. It waits 5.0
seconds on a socket timeout and 0.3 seconds before it reconnects. These are
not configuration keys.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--slowloris N` | Enable the vector and set the worker count. |

`--slowloris` is the only vector-specific flag. The config keys such as
`hold_only` and `hold_seconds` have no CLI flag. Set them in a config file
or a playbook. In the dashboard, the TCP Hold toggle writes `hold_only`.

The run-wide flags `-t`, `-p`, and `--scheme` decide the target. The
default port is 80 for HTTP and 443 for HTTPS.

## Modifiers

The dashboard exposes these toggles for HTTP/S Slowloris.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between header drips. |
| TCP Hold | `hold_only` | Hold connections open without header drips. Uses `hold_seconds` for the window. |

The Slowloris workers row in the dashboard maps to `workers`. The engine
consumes this key.

## Requirements

The vector needs no optional library and no root access. It uses plain TCP
sockets. HTTPS support needs only the Python standard `ssl` module.

::: warning
Slowloris holds server connections open. A server that lacks connection
limits can exhaust its process table. Keep the worker count low on your
first run.
:::

## Example

```bash
avalanche -t example.test -p 80 --slowloris 30 -d 300
```

This command runs 30 slow-header workers against `example.test` for 300
seconds.

For an HTTPS target, set the scheme and port:

```bash
avalanche -t example.test -p 443 --scheme https --slowloris 30 -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP Slow Post (vector: rudy)](./vector-rudy.md)
- [HTTP Slow Read (vector: slowread)](./vector-slowread.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
