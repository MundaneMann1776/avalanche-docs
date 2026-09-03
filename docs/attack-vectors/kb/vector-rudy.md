---
title: "HTTP Slow Post (vector: rudy)"
description: How the rudy vector drips a POST body to occupy server connections and buffers.
---

# HTTP Slow Post

The `rudy` vector runs the HTTP Slow Post attack. RUDY is the short name for
"R U Dead Yet". The attack sends the header of a POST request and then drips
the body slowly. The attack works at OSI layer 7, the application layer. Use
Avalanche only against systems you own or have written permission to test.

## When to use

Use the vector to test how a server handles requests whose body arrives very
slowly. The attack suits servers that parse the body before they free the
connection.

Good test targets include:

- Your own web application with large upload forms.
- A staging server behind a proxy with a read timeout.
- An API that buffers the whole request body in memory.

The attack is most effective when the server keeps the connection and its
buffers until the declared body length arrives. Web servers and proxies that
enforce a body timeout are less affected.

## How it works

Each worker thread owns one TCP connection. The `RUDY` class in
`vectors/rudy.py` extends `SlowSocketVector` from `vectors/base.py`. The
base class owns the thread lifecycle.

A worker sends a complete request header for `POST /`. The header declares a
`Content-Length` of almost 1 billion bytes. A server that trusts this value
waits for a body of that size. The header ends with a blank line, so the
server parses it as valid.

The `hold_no_body` mode changes the behavior. In this mode the worker sends
the header and then sends nothing at all. The connection stays open for the
hold window with no body bytes. The worker polls the stop state every 0.25
seconds during the hold. Set `hold_seconds` to control the window.

The worker then drips single `X` characters into the body. Each drip is one
byte. A worker sends 100 to 200 drips, one every 4 to 12 seconds. The
traffic stays very low, but the declared body never finishes. After the
drip run ends, the worker closes the connection and opens a fresh one.
Each fresh connection starts a new slow POST.

The server keeps the connection open while it waits for body bytes. Its
read buffers and any per-connection worker stay occupied. Many such
connections exhaust the pool that legitimate requests need.

Every open connection adds to the live active-connection count that the
dashboard shows. Each drip asks the resource governor for a token before
the send. The worker checks the kill switch on every cycle. When you stop
the run, the held connections close at the next drip boundary.

The class default is 10 workers. Each worker waits 8.0 seconds on a socket
timeout and 2.0 seconds before it reconnects.

When the target uses HTTPS, the vector wraps each socket in TLS before it
sends. The `scheme` value decides this. A target behind a reverse proxy
can buffer the request differently from an origin server. Run the vector
against each hop in turn to see where the slow body causes the most
pressure.

The drip cadence comes from the class, not from a config key. The base
class waits for the drip interval after each send. The `timing_jitter_ms`
key spreads that cadence so the sends do not line up.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| HTTP Slow Post | L7 | The vector has one behavior. Choose `hold_no_body` to hold without body drips. |

## Configuration

The vector reads these keys from its config section. The typed model is
`RudyConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `True` | Start the vector in this run. |
| `workers` | `10` | Number of slow-POST threads. Range 1 to 1000. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between body drips. |
| `hold_no_body` | `False` | Hold the connection open after the header, with no body bytes. |
| `hold_seconds` | `60` | Seconds to hold one connection in `hold_no_body` mode. Range 1 to 3600. |

The internal pacing constants are not configuration keys. The socket
timeout is 8.0 seconds and the reconnect delay is 2.0 seconds.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--rudy N` | Enable the vector and set the worker count. |

`--rudy` is the only vector-specific flag. The config keys such as
`hold_no_body` and `hold_seconds` have no CLI flag. Set them in a config
file or a playbook. In the dashboard, the TCP Hold Slow POST toggle writes
`hold_no_body`.

## Modifiers

The dashboard exposes these toggles for HTTP Slow Post.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between body drips. |
| TCP Hold Slow POST | `hold_no_body` | Send the header, then hold without body bytes. Uses `hold_seconds` for the window. |

The Rudy workers row in the dashboard maps to `workers`. The engine
consumes this key.

## Requirements

The vector needs no optional library and no root access. It uses plain TCP
sockets. HTTPS support needs only the Python standard `ssl` module.

::: warning
The vector declares a huge body length on purpose. Some servers allocate
memory for the declared size. Keep the worker count low on your first run.
:::

## Example

```bash
avalanche -t example.test -p 80 --rudy 10 -d 300
```

This command runs 10 slow-POST workers against `example.test` for 300
seconds.

For an HTTPS target, set the scheme and port:

```bash
avalanche -t example.test -p 443 --scheme https --rudy 10 -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S Slowloris (vector: slowloris)](./vector-slowloris.md)
- [HTTP Slow Read (vector: slowread)](./vector-slowread.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
