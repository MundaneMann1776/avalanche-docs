---
title: Emission and Statistics
description: How a run records data, from the StatsCollector to metrics, history, logging, and run recording.
---

# Emission and Statistics

This page explains how a run records data. It covers the `StatsCollector`, the per-second history, the metrics exporter, endpoint statistics, the shard merge, logging, and the run recorder.

Avalanche routes all run data through one thread-safe hub: the `StatsCollector` in `core/stats.py`. Every vector and every background task writes to it. No module prints raw counters to the console.

## The StatsCollector

The `StatsCollector` is a thread-safe counter hub. A lock guards every mutation, so async workers and worker threads can record at the same time.

Vectors call two main methods on every event.

- `record_request()` records one completed request. It takes bytes sent and received, latency, status code, and the WAF markers `blocked`, `challenged`, and `bypassed`.
- `record_error()` records one transport error.

WAF markers take precedence over the status code in classification. A Cloudflare challenge can use status 503, but it is not an origin server error.

Every request maps to one outcome. The outcomes are `clean`, `blocked`, `challenged`, `server_error`, `transport_error`, and `sent_without_response`. The collector keeps an outcome count globally and per vector.

Per-vector counters live in `vector_stats`. Vectors register their name once through `add_vector()`. A fast-path mirror avoids a key-ensure loop on every event. Each vector carries counters for attempts, responses, transport errors, blocked, challenged, bypassed, solver results, throttled, and active connections.

`record_throttled()` records local kernel buffer pressure. It is a pacing signal, not a failure to reach the target. `record_solver_result()` records one challenge-solver attempt. `update_active_connections()` keeps the held-connection count balanced.

## The snapshot

`snapshot()` returns a deep, consistent view of the collector. Callers read the snapshot instead of touching the live counters.

The snapshot holds totals, live and average RPS, live and average bandwidth, wire counters, latency statistics, status classes, per-vector counters, and the ring-buffer histories. It also holds the derived rates such as `recent_error_rate`, `block_challenge_ratio`, and `classification_note`.

The dashboard polls this snapshot through the `WebDashboard`. The status line of a headless run reads it too.

## The per-second history

The history is a set of ring buffers. `record_history()` computes deltas since the last call and appends one sample per ring.

The tester drives the history at 1 Hz through `_history_tick()`. Each tick:

1. Calls `record_history()` on the collector.
2. Feeds a snapshot to the run recorder.
3. Registers token buckets with the governor and applies throttle.
4. Updates the metrics exporter.

Each sample reflects only the last tick window. RPS, bandwidth, and block ratio come from deltas, not from the cumulative average. The RPS history holds 120 samples, and the bandwidth histories hold 60.

The wire counters come from `psutil`. Each tick reads the non-loopback NIC counters and diffs them against the last read. Packet vectors can therefore report true wire packets per second instead of only L7 estimates.

## The metrics exporter

`core/metrics.py` exposes a Prometheus-compatible `/metrics` endpoint. It needs the optional `prometheus-client` library and a configured `metrics_port`.

`MetricsExporter` uses a factory pattern, `MetricsExporter.create()`, because the frozen dataclass cannot build mutable Prometheus objects in its constructor. When the library is missing, the exporter logs a warning and stays disabled.

The exporter serves these metric families.

| Metric | Type | Meaning |
|---|---|---|
| `avalanche_requests_total` | Counter | Requests by vector and outcome |
| `avalanche_responses_total` | Counter | Responses by HTTP status code |
| `avalanche_bypassed_total` | Counter | Requests that bypassed the WAF |
| `avalanche_errors_total` | Counter | Transport errors by vector |
| `avalanche_challenge_solved_total` | Counter | Solved challenge follow-ups |
| `avalanche_challenge_failed_total` | Counter | Failed solves or follow-ups |
| `avalanche_rps` | Gauge | Current requests per second |
| `avalanche_wire_pps` | Gauge | Machine-wide NIC packets per second |
| `avalanche_wire_bw_mbps` | Gauge | Machine-wide egress bandwidth |
| `avalanche_active_connections` | Gauge | Current active connections |
| `avalanche_canary_status` | Gauge | Canary state: 0 to 3 |
| `avalanche_latency_ms` | Histogram | Request latency with fixed buckets |

The exporter updates from each history snapshot. It tracks previous counts, so it increments counters by deltas, not by totals. Latency samples drain once through `drain_latency_samples()` and feed the histogram. The server binds to `127.0.0.1` only.

See [Metrics](../controls/metrics.md).

## Endpoint statistics

`core/endpoint_stats.py` is a lightweight companion to the collector. It tracks per-path metrics without coupling to the global machinery.

`EndpointTracker` keeps counters and latency per path under a single lock. Each path carries requests, outcomes, status codes, and average latency. The tracker exposes `top_slow()` and `top_error()` for the worst paths.

The HTTP vector creates a tracker when `endpoint_stats` or `adaptive_targeting` is set. Adaptive targeting reads the per-endpoint block ratio to shift load toward healthy paths.

## Shard merge

The sharded emission processes each run their own private `StatsCollector`. A parent thread merges their deltas into the main collector.

`merge_shard_delta()` adds one batch of counters in a single lock acquisition. One call covers the aggregate effect of many `record_request()` and `record_error()` calls. Each child pushes `sent`, `bytes`, `throttled`, and `errors` deltas at 1 Hz plus a final batch at exit.

See [Vector Architecture](vectors.md) for the emission side.

## Logging

`core/logging.py` configures structlog over stdlib logging. Every module shares one logger from `utils.py`.

The shared processor chain adds the level, an ISO timestamp, and a dashboard capture. The console stays pretty by default: plain message lines, with warnings and above prefixed. `json_mode=True` switches the console to JSON lines.

The run-log file is always newline-delimited JSON. Each line is one object with no ANSI codes. The file lands in `~/.avalanche/logs/run_<timestamp>.log` at debug level.

A dashboard capture mirrors INFO-and-above events into an in-memory ring. The web dashboard reads this ring through a cursor, so the log view does not re-send old entries. The ring holds 2000 entries.

## The run recorder

`reporting/recorder.py` records one run into an engagement. `RunRecorder.start()` creates a run row in the SQLite store and opens a JSONL sample file.

The tester calls `sample()` once per history tick. Each sample line holds the timestamp, RPS, bandwidth, block ratio, errors, requests, transport-error and 5xx deltas, the last canary probe, the classification note, wire counters, and the per-vector counters. The canary fields carry the status, TTFB, and verdict of that probe.

`finish()` closes the sample stream and writes the report JSON. It marks the run row `completed` with its end time, stats snapshot, and artifact paths. `abort()` marks the run `failed` with a reason. The main run loop calls `abort()` when a run fails and `finish()` when it completes.

See [Engagements and reports](../user-guide/engagements-reports.md).

## Related pages

- [Architecture](overview.md)
- [Metrics](../controls/metrics.md)
- [Engagements and reports](../user-guide/engagements-reports.md)
- [Canary and kill switch](../user-guide/canary-killswitch.md)
