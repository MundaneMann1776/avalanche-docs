---
title: "HTTP/3 attacks (vector: http3)"
description: How the http3 vector floods a QUIC endpoint with HTTP/3 GET requests over UDP 443.
---

# HTTP/3 attacks

The `http3` vector runs the QUIC Flood attack. The vector opens QUIC
connections and pipelines HTTP/3 GET requests over them. The class
`HTTP3Flood` in `vectors/http3.py` drives the vector. QUIC runs over UDP,
usually port 443. The dashboard catalog groups QUIC Flood with the Layer 4
(TCP/UDP) attacks because of the UDP transport. Use Avalanche only against
systems you own or have written permission to test.

## When to use

Use the vector against HTTP/3 endpoints and QUIC listeners that you
control. QUIC runs over UDP, so the target must accept QUIC on the
configured port.

Good targets include:

- Your own HTTP/3-capable origin or CDN edge.
- A load balancer that terminates QUIC.
- A staging server with a QUIC listener for capacity checks.

The vector suits tests that other HTTP vectors cannot reach. TCP floods do
not touch a QUIC-only listener. Use this vector when the service under test
answers on UDP 443.

The engine warns before a run when a TCP-based vector cannot reach the
target port. That check does not apply to QUIC. Use a QUIC-capable client
to confirm that the target answers before you start the run.

## How it works

Each worker opens one QUIC connection and sends HTTP/3 requests through it.
The aioquic library supplies the QUIC stack. The worker builds a request
with `:method` GET, the target as `:authority`, and headers for the user
agent, accept, and language. The `:path` rotates among `/`,
`/robots.txt`, and `/favicon.ico` at random.

The handshake runs with `wait_connected=True` and a 5-second deadline. A
dead or filtered QUIC endpoint can hang forever, so the timeout covers only
the handshake. When the handshake does not finish in 5 seconds, the worker
records an error, closes the connection, and reconnects. After a failed
session the worker waits 0.5 seconds before it retries.

Inside a session, a custom protocol subclass routes QUIC events into an
`H3Connection`. Each request waits for the response headers with a 5-second
deadline. When the status arrives, the worker records the request with the
estimated bytes sent, the bytes received, and the latency. When no response
arrives in time, the worker records one error, not a fake success. A
terminated QUIC connection raises on the pending request, and the worker
records an error before it reconnects.

The vector estimates the request size from the header field sizes. It does
not count QPACK compression or QUIC framing overhead. The byte totals in
the stats are estimates, not exact wire counts.

A token bucket paces the requests when `rps` is above zero. The worker
reconnects after `max_streams_per_conn` requests so a fresh stream budget
starts each session. Timing jitter adds delay between requests.

HTTP/3 always carries TLS. The request headers fix the `:scheme` to
`https`. A plain `http` scheme does not stop the vector, but it logs a
warning, because the target must listen for QUIC on the configured port.
The default port follows `-p`; choose 443 when the endpoint serves QUIC
there.

The vector stops itself when the run ends or the kill switch appears.
Workers cancel cleanly, and the vector restores the event-loop exception
handler it installed for quiet cleanup of canceled aioquic handshakes.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| QUIC Flood | L4 (catalog) | GET requests over HTTP/3 and QUIC. The catalog lists QUIC Flood under Layer 4 in the dashboard. The vector itself is one behavior with no mode switch. |

## Configuration

The typed model is `Http3VectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `http3` key.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `concurrency` | `50` | Number of concurrent worker connections. |
| `rps` | `0` | Token-bucket rate in requests per second. `0` means unlimited. |
| `max_streams_per_conn` | `50` | Requests per connection before the worker reconnects. |
| `timing_jitter_ms` | `0` | Add up to this many milliseconds of random delay between requests. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--http3 N` | Enable the vector and set the concurrency. |
| `--http3-rps RPS` | Requests per second cap. |

The engine reads `concurrency` as the worker count. The CLI spells the flag
`--http3` with the count, matching the worker style of the other
connection-based vectors.

## Modifiers

The dashboard exposes one modifier for QUIC Flood.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between requests. |

## Requirements

The vector needs the optional `aioquic` package. Without it the vector logs
a warning and skips the run. The engine does not fail loudly.

::: warning
QUIC runs over UDP and no TCP handshake confirms the listener. Confirm that
the target answers QUIC before you start. A quiet endpoint produces
repeated 5-second handshake timeouts, and each timeout records an error.
Install the extra first:
:::

```bash
uv sync --extra aioquic
```

The vector works without root. It uses only user-space UDP sockets through
aioquic.

## Example

Run a QUIC flood against an HTTP/3 endpoint on UDP 443:

```bash
avalanche -t example.test -p 443 --scheme https --http3 50
```

Cap the request rate:

```bash
avalanche -t example.test -p 443 --scheme https --http3 50 --http3-rps 2000
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 4 (TCP/UDP) attacks](../layer4.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/2 attacks (vector: http2)](./vector-http2.md)
- [HTTP/S flood family (vector: http)](./vector-http.md)
