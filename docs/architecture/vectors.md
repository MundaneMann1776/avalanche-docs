---
title: Vector Architecture
description: The vector class hierarchy, the shared HTTP base, and the emission helpers vectors reuse.
---

# Vector Architecture

This page explains how attack vectors are structured. A vector is one attack engine module in Avalanche. It sends traffic for one or more attack types.

Avalanche has 16 vectors. They split into three families by their base class. See the [vector overview](../attack-vectors/overview.md) for the catalog of attack types.

## The class hierarchy

All vectors inherit from one of three base classes.

```text
AttackVector (ABC)  -- vectors/base.py
├── BaseHTTPVector  -- vectors/base_http.py
│   ├── AdvancedHTTPFlood
│   └── HTTPFlowPlayer
├── SlowSocketVector -- vectors/base.py
│   ├── Slowloris
│   ├── RUDY
│   ├── HTTPSlowRead
│   └── SmtpFlood
└── (concrete vectors)
    ├── UDPStorm, UDPAmplification
    ├── ICMPFlood, TCPSynFlood, RawIpFlood
    ├── SipFlood, DnsWaterTorture, TlsChurnFlood
    ├── Http2Flood, HTTP3Flood, WebSocketFlood
    └── ...
```

`AttackVector` in `vectors/base.py` is the abstract contract. It defines the constructor and two abstract methods, `start()` and `stop()`. Every vector receives its name, target host, target port, the shared `StatsCollector`, and its config dict.

The base class also exposes read-only state.

| Property | Meaning |
|---|---|
| `is_running` | True while the vector is started |
| `token_bucket` | The vector rate limiter, or `None` |
| `proxy_pool` | The vector proxy pool, or `None` |

`_acquire_governor()` reserves a global slot through the resource governor before a send. Worker error logs go through `_log_worker_error()`, which rate-limits to one line per 5 s.

## The start and stop contract

`start()` and `stop()` are async. The tester starts every vector in sequence and stops them all in teardown.

`start()` does the setup for the vector. It resolves state, prepares shared objects, and launches the worker loops. `stop()` flips the running flag, sets the stop event, and joins or cancels the workers.

The worker pattern differs by family.

- HTTP vectors run async workers as asyncio tasks. `AdvancedHTTPFlood.start()` creates one task per concurrency slot, up to 200 by default.
- Slow-socket vectors run blocking threads. `SlowSocketVector.start()` creates daemon threads, one per worker.
- Raw packet vectors run threads for each worker, or child processes when sharding is on.

Every worker loop checks the running flag and the stop event. High-rate workers also poll the kill switch through `KillswitchPoller`.

## The slow-socket pattern

`SlowSocketVector` is the threaded plaintext-socket base. It holds connections open by dripping bytes.

Subclasses supply the opening request and the drip behavior. The four abstract methods are `_opening_request()`, `_drip_payload()`, `_drip_count()`, and `_drip_interval()`. The base owns the thread lifecycle and keeps the active-connection counter balanced under any error.

A subclass can override `_hold_open()` to keep a connection without sending body bytes, or `_hold_seconds()` to hold for a fixed window. The socket wraps in TLS when the target scheme is `https`. Class defaults: timeout 5 s, reconnect delay 0.3 s, and 30 default workers. Worker counts come from the config.

The slow-socket worker checks the kill switch directly on every loop. A direct check keeps stop latency low when connections hold for seconds.

## The shared HTTP base

`BaseHTTPVector` in `vectors/base_http.py` is the base for `AdvancedHTTPFlood` and `HTTPFlowPlayer`. It extracts the behavior the two HTTP vectors share, so one fix benefits both.

The base provides response analysis. `_analyze()` classifies a response into blocked, challenged, or bypassed. It uses the module-level `WafDetector`, whose signature database builds once. `_response_cookies()` parses `Set-Cookie` lines, and `_extract_set_cookie_headers()` collects them from a response. Byte estimation helpers reconstruct the L7 request and response size, since aiohttp exposes no wire counters.

The base also provides four async setup helpers. The vector calls them in its prepare step before the workers launch.

### Proxy pool setup

`_setup_proxy_pool()` initializes the proxy pool when `use_proxies` is set. The pool file comes from the config or from the managed path at `~/.avalanche/proxies/proxies.txt`.

The pool loads and validates its proxies against the target base URL. On resume, saved quality scores restore. An empty healthy pool logs a warning. In browser-grade mode the warning is severe, because all traffic would then leave from one host IP. The pool restores quality and, for the managed path, starts a 60 s auto-refresh.

### Token bucket setup

`_setup_token_bucket()` creates or destroys the vector rate limiter. The rate comes from the `rps` config value.

A rate of zero removes the bucket, so the vector floods as fast as the machine allows. A positive rate builds a `TokenBucket` with burst sized at 20% of the rate. On resume, a saved bucket rebuilds from its checkpoint dict. See [Rate limiting and governor](../controls/governor.md).

### TLS fingerprinter setup

`_setup_tls_fingerprinter()` builds the TLS context pool when TLS randomization is enabled. It accepts the flat `tls_randomize` keys and the nested `tls` mapping. The pool size defaults to 8. The fingerprinter is disabled with a warning when `ssl` is unavailable or construction fails.

### Endpoint tracker setup

`_setup_endpoint_tracker()` enables per-endpoint statistics when `endpoint_stats` or `adaptive_targeting` is set. The tracker records counters and latency per path.

## Vector config registration

Every vector has a typed config model and a canonical default dict. The registration flow has four parts.

1. `core/config.py` defines the frozen Pydantic models. `VectorsConfig` holds one model per vector, from `http` to `http3`.
2. `core/vector_defaults.py` lists the supported vector names and their v1-compatible default dicts. A parity test keeps the HTTP defaults in sync with the model.
3. The tester maps a config dict to typed models through `config_from_dict()`.
4. `_build_vectors_from_config()` in `core/tester.py` constructs the vector objects from the completed config.

New config keys go into both the typed models and `core/vector_defaults.py`. Keys are `snake_case`. See [Configuration Model](config-model.md).

## Packet-emission helpers

Thread-based vectors share one hot path: build a packet, send it, record statistics, loop. `core/emit.py` centralizes the helpers that keep that loop cheap at high rates.

| Helper | Purpose |
|---|---|
| `resolve_target()` | Resolve the hostname once per run. `sendto` and `connect` never re-resolve on each packet. |
| `KillswitchPoller` | Check the kill switch at most once every 100 loop iterations. |
| `classify_send_error()` | Classify an errno as transient or fatal. `ENOBUFS` and `EAGAIN` are transient buffer pressure. |
| `record_send_error()` | Record a send error. Transient errors increment `throttled`; fatal errors increment the error counter. |
| `ExpBackoff` | Bounded exponential backoff for transient errors, reset on success. |
| `set_send_buffer()` | Raise `SO_SNDBUF` so bursts are absorbed by the kernel. |

A worker routes every send `OSError` through `record_send_error()`. A transient error returns true, so the caller backs off and retries. A fatal error logs the errno at a rate-limited cadence.

## Multi-process emission

`core/emit_shards.py` moves whole worker slices into child processes. The Python GIL caps one process for thread-based packet vectors. Set `process_workers` to 2 or more on a packet vector to enable the mode.

The packet vectors that support sharding are `udp`, `syn`, `dns`, `sip`, and `rawip`. Each child builds its own storm with an equal slice of workers and a private `StatsCollector`. Children start with the `spawn` method on every platform. Fork would copy a running asyncio loop.

Each child pushes counter deltas over a `multiprocessing.Queue` at 1 Hz, plus a final batch at exit. The parent drains the queue several times a second and merges each batch through `StatsCollector.merge_shard_delta()`. One lock acquisition covers a whole batch.

Governor caps divide evenly across the shards before spawn. Each child paces itself at a static share through a local gate. When the platform refuses the semaphores, the vector falls back to in-process threads. See the [developer guide](../developer/overview.md) for the sharding details.

## Related pages

- [Vector overview](../attack-vectors/overview.md)
- [Architecture](overview.md)
- [Engine Pipeline](engine.md)
- [Adding a vector](../developer/adding-a-vector.md)
