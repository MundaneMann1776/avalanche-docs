---
title: "HTTP/2 attacks (vector: http2)"
description: How the http2 vector runs twelve frame-abuse attacks, including Rapid Reset and Continuation Flood.
---

# HTTP/2 attacks

The `http2` vector runs twelve HTTP/2 frame-abuse attacks over TCP. Each
attack has its own dashboard row, from HTTP/2 Rapid Reset through HPACK
Bomb. The vector works at OSI layer 7. Use Avalanche only against systems
you own or have written permission to test.

The class `Http2Flood` in `vectors/http2.py` runs one connection per worker
on its own thread. The `mode` key selects the frame abuse method.

## When to use

Use the vector against servers, proxies, and load balancers that speak
HTTP/2. The twelve modes test how a stack handles malformed, excessive, or
churned frame sequences.

Good targets include:

- Your own HTTP/2-enabled origin or edge.
- A load balancer that terminates HTTP/2.
- A reverse proxy with a configurable HTTP/2 timeout.

Many modes probe known HTTP/2 weaknesses. Rapid Reset is CVE-2023-44487.
Continuation Flood is CVE-2023-45288. Several others map to the 2019
HTTP/2 "request smuggling" research family (CVE-2019-9512 through
CVE-2019-9518). Validate the effect against a stack you control before you
draw conclusions.

## How it works

Each worker thread opens one TCP connection and negotiates HTTP/2. On
HTTPS the socket is wrapped in TLS with the `h2` ALPN protocol. The vector
requires the peer to select `h2` over ALPN; otherwise the connection is
closed. On cleartext HTTP the vector first sends the h2c prior-knowledge
preface. If the peer answers with HTTP/1.1, the worker falls back to the
HTTP/1.1 Upgrade handshake (RFC 9113 section 3.2).

Rapid Reset and Trailers drive the `h2` client state machine directly.
Rapid Reset cycles HEADERS plus RST_STREAM frames on fresh streams.
Trailers sends HEADERS, an empty DATA frame, and a trailer HEADERS with
END_STREAM. Reset Flood also drives the state machine, but it opens each
stream without END_STREAM and cancels it before the request completes.

The other modes send frame sequences that `h2` either validates away or
cannot emit, so they serialize raw frames with `hyperframe`. Raw-frame
modes send one pre-built byte string per cycle and drain inbound data on a
schedule. When the peer closes the connection, the worker reconnects after
a short delay.

Cleartext and encrypted behavior differ in one more way. HTTPS needs the
`h2` ALPN protocol from TLS. Cleartext h2c needs no TLS at all. Both the
`h2` connection layer and `hyperframe` come from the `h2` optional package.

The mode list maps one to one to the twelve dashboard attack rows:

- `rapid_reset`: HEADERS + RST_STREAM cycles.
- `continuation`: one endless header block on stream 1.
- `settings`: repeated SETTINGS frames with rotating wire-legal values.
- `window_update`: flow-control increments that rotate up to the 2^31-1
  boundary and past it.
- `priority`: PRIORITY churn on stream 1 to rework the peer priority tree.
- `ping`: unacknowledged PING frames.
- `reset_flood`: fresh streams canceled before the request completes.
- `empty_frames`: zero-length DATA frames on a held-open stream.
- `zero_length_headers`: header blocks with many zero-length values.
- `goaway`: client GOAWAY frames interleaved with fresh streams.
- `trailers`: every request ends with trailer headers after an empty DATA
  frame.
- `hpack_bomb`: seed the peer HPACK table once, then reference it with
  five-byte requests.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| HTTP/2 Rapid Reset | L7 | `mode=rapid_reset` (default). HEADERS plus RST_STREAM cycles. |
| HTTP/2 Continuation Flood | L7 | `mode=continuation`. Endless header block; size from `continuation_frame_size`. |
| HTTP/2 Settings Flood | L7 | `mode=settings`. Repeated SETTINGS frames with rotating values. |
| HTTP/2 Window Update Flood | L7 | `mode=window_update`. Flow-control increments, including the boundary and zero. |
| HTTP/2 Priority Churn | L7 | `mode=priority`. PRIORITY frames on stream 1. |
| HTTP/2 Ping Flood | L7 | `mode=ping`. Unacknowledged PING frames. |
| HTTP/2 Reset Flood | L7 | `mode=reset_flood`. Cancel fresh streams before the request completes. |
| HTTP/2 Empty Frames | L7 | `mode=empty_frames`. Zero-length DATA frames. |
| HTTP/2 Zero-Length Headers | L7 | `mode=zero_length_headers`. Requests with many empty header values. |
| HTTP/2 GOAWAY Churn | L7 | `mode=goaway`. Client GOAWAY frames between fresh streams. |
| HTTP/2 Trailers Abuse | L7 | `mode=trailers`. Trailer headers after an empty DATA frame. |
| HTTP/2 HPACK Bomb | L7 | `mode=hpack_bomb`. One seed request, then cheap references to the table. |

## Configuration

The typed model is `Http2VectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `http2` key.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `20` | Number of worker threads, one connection each. Range 1 to 1000. |
| `mode` | `rapid_reset` | Frame-abuse method. One of the twelve mode names above. |
| `continuation_frame_size` | `4096` | Filler bytes per CONTINUATION frame. Range 16 to 16384. |
| `browser_tls` | `True` | Build the TLS context from the browser TLS profile when HTTPS. |
| `timing_jitter_ms` | `0` | Randomize the reconnect delay, up to this many milliseconds. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--http2 N` | Enable the vector and set the worker count. Default 20. |
| `--http2-mode MODE` | Select the attack mode. Default `rapid_reset`. |

The `--http2-mode` choices are `rapid_reset`, `continuation`, `settings`,
`window_update`, `priority`, `ping`, `reset_flood`, `empty_frames`,
`zero_length_headers`, `goaway`, `trailers`, and `hpack_bomb`. The
dashboard exposes each mode as a separate attack type under the vector.

## Modifiers

The dashboard exposes one modifier for the http2 attack rows.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between reconnects. |

::: warning
Timing Jitter paces reconnects only. It does not pace frames inside a
connection. The modifier matrix records this caveat.
:::

The matrix hides TLS Randomize for this vector. The http2 engine does not
consume that modifier.

## Requirements

The vector needs the optional `h2` package. The `h2` install also brings
`hyperframe` and `hpack`, which the raw-frame modes import.

::: warning
Without `h2` the vector logs a warning and skips the run. The engine does
not fail loudly. Install the extra before you enable the vector:
:::

```bash
uv sync --extra h2
```

Cleartext h2c needs no TLS. HTTPS mode needs the standard `ssl` module and
works without root.

## Example

Run HTTP/2 Rapid Reset against an HTTPS target:

```bash
avalanche -t example.test -p 443 --scheme https --http2 20
```

Run a Continuation Flood with larger frames:

```bash
avalanche -t example.test -p 443 --scheme https --http2 20 --http2-mode continuation
```

Run an HPACK Bomb against a cleartext h2c listener:

```bash
avalanche -t example.test -p 80 --scheme http --http2 20 --http2-mode hpack_bomb
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S flood family (vector: http)](./vector-http.md)
- [HTTP/3 attacks (vector: http3)](./vector-http3.md)
- [WebSocket Flood (vector: websocket)](./vector-websocket.md)
