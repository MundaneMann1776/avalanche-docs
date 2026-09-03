---
title: "WebSocket Flood (vector: websocket)"
description: How the websocket vector runs connect, data, and ping floods over RFC 6455 connections.
---

# WebSocket Flood

The `websocket` vector runs the WebSocket Flood attack. The vector performs
the RFC 6455 Upgrade handshake and then floods frames over the open
WebSocket. The class `WebSocketFlood` in `vectors/websocket.py` drives the
vector. It works at OSI layer 7. Use Avalanche only against systems you own
or have written permission to test.

The vector has three modes: `connect`, `data`, and `ping`. The dashboard
exposes one attack type, WebSocket Flood, with a mode selector.

## When to use

Use the vector against WebSocket servers and proxies that you control. The
modes suit different questions:

- `connect`: does the server run out of connection capacity under many
  held-open sockets?
- `data`: does the server process a stream of masked text frames?
- `ping`: does the server survive a flood of masked ping frames?

WebSocket floods test real-time endpoints, chat back ends, notification
services, and any push channel that upgrades from HTTP.

## How it works

Each worker thread owns one WebSocket connection. The worker opens a TCP
socket. On an HTTPS scheme it wraps the socket in TLS first. The TLS context
uses the browser TLS profile with the `http/1.1` ALPN protocol, because
WebSocket runs over HTTP/1.1. A profile failure falls back to a plain TLS
context with a warning.

The worker then performs the RFC 6455 handshake. It sends a `GET` to the
configured path with an `Upgrade: websocket` header, a random
`Sec-WebSocket-Key`, and an Origin built from the target. The worker
validates the response. A status other than 101, a missing `Upgrade:
websocket` header, or a wrong `Sec-WebSocket-Accept` value ends the
connection with an error. The accept value check re-derives the expected
digest from the key and the RFC 6455 GUID.

After the handshake the mode decides the frame behavior:

- `connect` mode holds the connection open. The worker reads inbound data
  and answers server pings with pong frames.
- `data` mode sends one masked text frame repeatedly. The payload repeats
  the `avalanche-ws-` pattern up to `payload_size` bytes.
- `ping` mode sends masked ping frames with an empty payload.

Client frames must carry a 4-byte mask, and the vector generates one per
session. The vector builds each frame with the FIN bit set and the RFC 6455
length encoding. Inbound frames are parsed and consumed. A server ping
receives a pong. A server close frame ends the session cleanly. An inbound
buffer that exceeds 256 kilobytes raises an error that ends the connection.

A worker counts one active connection while its session is open. It records
the session bytes sent when the loop ends with traffic. When the connection
drops, the worker waits a short reconnect delay and starts a new session.
Each session generates a fresh random `Sec-WebSocket-Key`.

All workers share the selected mode. Each worker owns a separate socket, so
the loops run independently and never share a frame stream. Raise `workers`
to multiply the number of concurrent connections.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| WebSocket Flood | L7 | `mode=connect` holds connections open. `mode=data` sends masked text frames (default). `mode=ping` sends masked ping frames. |

## Configuration

The typed model is `WebSocketVectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `websocket` key.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `20` | Number of worker threads, one connection each. Range 1 to 1000. |
| `mode` | `data` | Frame behavior. One of `connect`, `data`, or `ping`. |
| `path` | `/` | WebSocket endpoint path for the Upgrade request. |
| `payload_size` | `32` | Size in bytes of the text payload in `data` mode. Range 1 to 65536. |
| `browser_tls` | `True` | Build the TLS context from the browser TLS profile when HTTPS. |
| `timing_jitter_ms` | `0` | Randomize the delay between frames, up to this many milliseconds. |

The dashboard preset for WebSocket Flood writes `workers` 20, `mode` `data`,
`path` `/`, and `payload_size` 32.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--websocket N` | Enable the vector and set the worker count. Default 20. |
| `--websocket-mode MODE` | Select the mode. Default `data`. |
| `--websocket-path PATH` | WebSocket endpoint path. Default `/`. |

The `--websocket-mode` choices are `connect`, `data`, and `ping`.

## Modifiers

The dashboard exposes one modifier for WebSocket Flood.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between frames. |

::: warning
The matrix caveat assumes the preset pins `data` mode. `connect` mode holds
the connection open and never paces frames, so Timing Jitter has no effect
there. `data` and `ping` modes pace each frame and do consume it.
:::

## Requirements

The vector needs no optional library and no root access. It uses plain
sockets plus the standard `ssl` module for secure connections. The browser
TLS profile is best-effort; a failure falls back to a plain TLS context
with a warning.

## Example

Run a WebSocket data flood over `wss`:

```bash
avalanche -t example.test -p 443 --scheme https --websocket 20
```

Run a connection-hold flood against a specific path:

```bash
avalanche -t example.test -p 443 --scheme https --websocket 50 --websocket-mode connect --websocket-path /socket
```

Run a ping flood over plain WebSocket:

```bash
avalanche -t example.test -p 80 --scheme http --websocket 20 --websocket-mode ping
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S flood family (vector: http)](./vector-http.md)
- [HTTP/2 attacks (vector: http2)](./vector-http2.md)
- [HTTP/3 attacks (vector: http3)](./vector-http3.md)
