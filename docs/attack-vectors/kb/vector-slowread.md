---
title: "HTTP Slow Read (vector: slowread)"
description: How the slowread vector reads responses at a crawl to occupy server socket buffers.
---

# HTTP Slow Read

The `slowread` vector runs the HTTP Slow Read attack. The technique comes
from Shekyan's Slow Read method, the same one used by slowhttptest. The
attack sends a complete, valid request and then reads the response very
slowly. The attack works at OSI layer 7, the application layer. Use
Avalanche only against systems you own or have written permission to test.

## When to use

Use the vector when a complete-request attack does not work against the
target. Some servers and proxies reject partial requests such as Slowloris.
A complete request looks legitimate, so the server accepts it.

Good test targets include:

- Your own web server behind a reverse proxy.
- A staging application that serves large responses.
- An origin server you manage, to test its connection policy.

Slow Read occupies the server's socket buffers and connection slots. The
client never drains the response, so the server cannot reuse the
connection.

## How it works

The `HTTPSlowRead` class in `vectors/slowread.py` extends
`SlowSocketVector` from `vectors/base.py`. Each worker thread owns one TCP
connection.

A worker sends a complete HTTP request. The request asks for `GET /` and
includes a `Host` header, a rotating `User-Agent`, and `Connection:
keep-alive`. The request ends with the final empty line, so the server sees
it as valid. The worker chooses the user agent from the shared pool that
all vectors use.

The server then writes the response. The worker reads the response at a
crawl. It reads one byte at a time. Between reads it waits a random 0.5 to
2.0 seconds.

The socket buffer between the client and the server fills up. The server
cannot write the rest of the response, so it keeps the connection and the
buffer occupied. Slow readers fill many connections this way. The read
window stays tiny even when the response is large.

Each request asks the resource governor for a token before the send. When
the governor denies a token, the worker stops. The worker checks the kill
switch on every read cycle. When you stop the run, the reads stop at the
next pause boundary.

The worker never sends an application drip. The read itself is the hold
mechanism. When the server closes the connection, the worker waits a short
delay and starts a new request.

Every open connection adds to the live active-connection count that the
dashboard shows. Each sent request counts as one request in the stats
collector. The worker keeps the count balanced under every error path.

The vector records real transport failures honestly. A failure to connect
or to send records an error and logs at debug level. A timeout, a reset, or
a closed socket during the read is the expected end of a held connection.
The worker closes that connection, waits the reconnect delay, and sends a
fresh request.

The class default is 30 workers. Each worker waits 15.0 seconds on a socket
timeout and 1.0 second before it reconnects.

The pause between reads comes from the class, not from a config key. The
base wait is a random 0.5 to 2.0 seconds per byte. The `timing_jitter_ms`
key spreads that pause so the reads do not line up.

When the target uses HTTPS, the vector wraps each socket in TLS before it
sends. The `scheme` value decides this. The request advertises
`Accept-Encoding: identity` so the server does not compress the response.
Compression would shrink the response and reduce the buffer pressure.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| HTTP Slow Read | L7 | The vector has one behavior. Worker count is the main control. |

## Configuration

The vector reads these keys from its config section. The typed model is
`SlowReadConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `30` | Number of slow-read threads. Range 1 to 1000. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between response reads. |

The internal pacing constants are not configuration keys. The socket
timeout is 15.0 seconds and the reconnect delay is 1.0 second. The read
pause is a random 0.5 to 2.0 seconds per byte.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--slow-read N` | Enable the vector and set the worker count. |

`--slow-read` is the only vector-specific flag. The flag uses a hyphen after
`slow`, unlike the vector name. Set `timing_jitter_ms` in a config file or a
playbook.

## Modifiers

The dashboard exposes one toggle for HTTP Slow Read.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the pause between response reads. |

The Slowread workers row in the dashboard maps to `workers`. The engine
consumes this key.

## Requirements

The vector needs no optional library and no root access. It uses plain TCP
sockets. HTTPS support needs only the Python standard `ssl` module.

::: warning
Slow Read fills socket buffers on the server. A target with small buffers
can degrade quickly. Start with a low worker count and watch the canary.
:::

## Example

```bash
avalanche -t example.test -p 80 --slow-read 30 -d 300
```

This command runs 30 slow-read workers against `example.test` for 300
seconds.

For an HTTPS target, set the scheme and port:

```bash
avalanche -t example.test -p 443 --scheme https --slow-read 30 -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S Slowloris (vector: slowloris)](./vector-slowloris.md)
- [HTTP Slow Post (vector: rudy)](./vector-rudy.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
