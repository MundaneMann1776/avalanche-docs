---
title: "HTTP/2 attacks (vector: http2)"
description: How the http2 vector runs four HTTP/2 frame-abuse modes: Rapid Reset, Continuation Flood, Stream Multiplex, and Connection Hold.
---

# HTTP/2 attacks

The `http2` vector runs four HTTP/2 frame-abuse modes over TCP. Each mode
maps to a separate dashboard attack type. The vector works at OSI layer 7,
the application layer. Use Avalanche only against systems you own or have
written permission to test.

The class `Http2Flood` in `vectors/http2.py` runs one connection per worker
on its own thread. The `mode` config key selects the frame abuse method.

## When to use

Use the vector against servers, proxies, and load balancers that speak
HTTP/2. The four modes test how a stack handles rapid stream churn, endless
header blocks, stream multiplexing pressure, and long-held incomplete
requests.

Good targets include:

- Your own HTTP/2-enabled origin or edge.
- A load balancer that terminates HTTP/2.
- A reverse proxy with a configurable HTTP/2 timeout.

Rapid Reset targets CVE-2023-44487. Continuation Flood targets
CVE-2023-45288. Validate the effect against a stack you control before you
draw conclusions.

## How it works

Each worker thread opens one TCP connection and negotiates HTTP/2. On HTTPS
the socket is wrapped in TLS with the `h2` ALPN protocol. The vector
requires the peer to select `h2` over ALPN. If the peer does not, the
connection closes. On cleartext HTTP the vector sends the h2c
prior-knowledge preface first. If the peer answers with HTTP/1.1, the
worker falls back to the HTTP/1.1 Upgrade handshake (RFC 9113 section 3.2).

Rapid Reset and multiplex drive the `h2` client state machine directly.
Rapid Reset cycles HEADERS plus RST_STREAM frames on fresh streams.
Multiplex opens N concurrent streams and drains ended ones to make room for
new requests.

Continuation and connection hold use raw frame serialization from
`hyperframe`. Continuation sends one HEADERS frame without END_HEADERS,
then endless CONTINUATION frames. Connection hold sends incomplete HEADERS
and keeps the stream alive with periodic WINDOW_UPDATE frames.

When the peer closes the connection, the worker reconnects after a short
delay. Each reconnect delay includes optional timing jitter.

## Attack types

| Attack type | Mode | Notes |
|---|---|---|
| HTTP/2 Rapid Reset | `rapid_reset` | HEADERS plus RST_STREAM cycles. Default mode. |
| HTTP/2 Continuation Flood | `continuation` | Endless header block. Frame size from `continuation_frame_size`. |
| HTTP/2 Stream Multiplex | `multiplex` | N concurrent streams per connection. Count from `max_concurrent_streams`. |
| HTTP/2 Connection Hold | `connection_hold` | Incomplete HEADERS held open with WINDOW_UPDATE. Duration from `hold_seconds`. |

## Modes

### Rapid Reset

CVE-2023-44487. This mode opens a stream with HEADERS and END_STREAM, then
immediately cancels it with RST_STREAM using error code 8 (cancel). The
server must process the HEADERS and then handle the reset. Repeating this
cycle at high speed forces the server to allocate and deallocate stream
state continuously.

Each iteration sends one HEADERS frame and one RST_STREAM frame. The `h2`
library builds both frames. Every 100 iterations the worker drains inbound
data to prevent TCP backpressure from stalling the connection.

Default settings: 20 workers, no timing jitter.

```bash
avalanche -t example.test -p 443 --scheme https --http2 20
```

Use this mode to test how a server handles rapid stream creation and
cancellation. It targets the CVE-2023-44487 weakness in HTTP/2
implementations.

### Continuation Flood

CVE-2023-45288. This mode sends one HEADERS frame without the END_HEADERS
flag, then streams endless CONTINUATION frames. The server must buffer the
entire header block until it sees END_HEADERS. The buffer grows without
bound.

The HEADERS frame carries a valid HPACK-encoded request. The CONTINUATION
frames carry filler bytes (`0x82` repeated). Each frame has the size that
`continuation_frame_size` sets. The mode uses raw `hyperframe` serialization
because the `h2` library cannot emit an incomplete header block.

Every 100 frames the worker drains inbound data. The worker sends frames
continuously until the peer closes the connection or the run stops.

Default settings: 20 workers, 4096 bytes per CONTINUATION frame, no timing
jitter.

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode continuation
```

Use this mode to test how a server handles unbounded header block buffering.
It targets the CVE-2023-45288 weakness.

### Stream Multiplex

This mode opens multiple concurrent streams on one connection. Each stream
carries a complete GET request with HEADERS and END_STREAM. The worker
keeps opening new streams until it reaches the `max_concurrent_streams`
limit. When a stream ends, the worker opens a replacement.

The `h2` library manages stream state. The worker reads inbound data with a
short timeout to detect ended streams. It tracks open stream IDs and
removes them when the server signals StreamEnded.

Default settings: 20 workers, 10 concurrent streams per connection, no
timing jitter.

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode multiplex
```

Use this mode to test how a server handles sustained multiplexing pressure.
It fills the server's concurrent stream quota on each connection.

### Connection Hold

This mode sends an incomplete HEADERS frame (without END_STREAM) and holds
the connection open. The worker sends periodic WINDOW_UPDATE frames to
prevent the server from timing out the connection due to flow control
inactivity.

The worker increments the flow control window by 1 byte every second. It
continues for `hold_seconds` or until the peer closes the connection. The
server must keep the stream and connection state alive for the full
duration.

Default settings: 20 workers, 60 seconds hold time, no timing jitter.

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode connection_hold
```

Use this mode to test how a server handles long-lived incomplete streams.
It targets connection slot exhaustion.

## Configuration

The typed model is `Http2VectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `http2` key.

| Key | Default | Range | Meaning |
|---|---|---|---|
| `enabled` | `False` | | Start the vector in this run. |
| `workers` | `20` | 1 to 1000 | Number of worker threads. Each owns one connection. |
| `mode` | `rapid_reset` | | Frame abuse method: `rapid_reset`, `continuation`, `multiplex`, or `connection_hold`. |
| `continuation_frame_size` | `4096` | 16 to 16384 | Filler bytes per CONTINUATION frame. Used by `continuation` mode only. |
| `max_concurrent_streams` | `10` | 1 to 100 | Concurrent streams per connection. Used by `multiplex` mode only. |
| `hold_seconds` | `60` | 1 to 3600 | How long to hold a connection open. Used by `connection_hold` mode only. |
| `timing_jitter_ms` | `0` | 0 to 5000 | Randomize the reconnect delay, up to this many milliseconds. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--http2 N` | Enable the vector and set the worker count. Default 20. |
| `--http2-mode MODE` | Select the attack mode. Default `rapid_reset`. |

The `--http2-mode` choices are `rapid_reset`, `continuation`, `multiplex`,
and `connection_hold`. The dashboard exposes each mode as a separate attack
type under the vector.

## Modifiers

The dashboard exposes modifiers per attack type.

| Modifier | Config key | Applies to | Status |
|---|---|---|---|
| Timing Jitter | `timing_jitter_ms` | All four modes | AVAILABLE |
| Max Concurrent Streams | `max_concurrent_streams` | `multiplex` | ENGINE_READY |
| Hold Seconds | `hold_seconds` | `connection_hold` | ENGINE_READY |

::: warning
Timing Jitter paces reconnects only. It does not pace frames inside a
connection.
:::

The matrix hides TLS Randomize for this vector. The http2 engine does not
consume that modifier.

## Requirements

The vector needs the optional `h2` package. The `h2` install also brings
`hyperframe` and `hpack`, which the raw-frame modes import.

::: warning
Without `h2` the vector logs a warning and skips the run. Install the
extra before you enable the vector:
:::

```bash
uv sync --extra h2
```

Cleartext h2c needs no TLS. HTTPS mode needs the standard `ssl` module and
works without root.

## Examples

Run HTTP/2 Rapid Reset against an HTTPS target:

```bash
avalanche -t example.test -p 443 --scheme https --http2 20
```

Run a Continuation Flood with larger frames:

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode continuation
```

Run Stream Multiplex with 50 concurrent streams per connection:

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode multiplex
```

Run Connection Hold for 120 seconds against a cleartext h2c listener:

```bash
avalanche -t example.test -p 80 --scheme http --http2 20 --http2-mode connection_hold
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S flood family (vector: http)](./vector-http.md)
- [HTTP/3 attacks (vector: http3)](./vector-http3.md)
- [WebSocket Flood (vector: websocket)](./vector-websocket.md)
