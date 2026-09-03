---
title: Metrics
description: Prometheus-compatible metrics served on a local HTTP endpoint.
---

# Metrics

Avalanche can expose live run metrics on a local HTTP endpoint. The endpoint
serves the Prometheus text format. Scrape it with Prometheus or any tool
that reads that format. Use Avalanche only against systems you own or have
written permission to test.

## Enable the endpoint

The exporter runs when the runtime config sets `metrics_port`. On the
command line, pass `--metrics-port` with a port number.

```bash
avalanche -t target.example --http 200 --metrics-port 9100
```

The endpoint is `http://127.0.0.1:9100/metrics`. The exporter binds to
`127.0.0.1`, so only local processes can reach it.

::: warning
The metrics endpoint needs the optional `prometheus-client` library.
Install the `metrics` extra with `uv sync --extra metrics`. Without the
library the exporter logs a warning and stays off.
:::

A port value of `0` makes the exporter choose a free port. The exporter
logs the port it binds.

## Metric names

Every metric name starts with `avalanche_`. The exporter uses the
prometheus-client counters, gauges, and histograms:

| Kind | Name | Labels |
| --- | --- | --- |
| Counter | `avalanche_requests_total` | `vector`, `result` |
| Counter | `avalanche_responses_total` | `status_code` |
| Counter | `avalanche_bypassed_total` | `vector` |
| Counter | `avalanche_errors_total` | `vector` |
| Counter | `avalanche_challenge_solved_total` | `vector` |
| Counter | `avalanche_challenge_failed_total` | `vector` |
| Gauge | `avalanche_rps` | none |
| Gauge | `avalanche_wire_pps` | none |
| Gauge | `avalanche_wire_bw_mbps` | none |
| Gauge | `avalanche_active_connections` | none |
| Gauge | `avalanche_canary_status` | none |
| Histogram | `avalanche_latency_ms` | `vector` |

The `result` label of `avalanche_requests_total` takes the outcome class,
such as `clean` or `blocked`. Legacy labels `success` and `error` are
incremented too, so old dashboards keep working.

## What the exporter exposes

The exporter reads a stats snapshot on each update. The `update` runs from
the same background tick that samples the history at 1 Hz.

From the snapshot it sets the gauges:

- `avalanche_rps` is the current requests per second.
- `avalanche_wire_pps` is the current network packets per second. The value
  is machine-wide and excludes loopback.
- `avalanche_wire_bw_mbps` is the current egress bandwidth in megabits per
  second. The value is machine-wide and excludes loopback.
- `avalanche_active_connections` is the current number of active
  connections.
- `avalanche_canary_status` maps the canary state to a number. The map is
  `waiting` = 0, `healthy` = 1, `probe_error` = 2, and `down` = 3.

The exporter drains the latency sample queue into the latency histogram
with the label `vector="total"`. It then walks the status-code map and the
per-vector stats.

## Delta counting

The counters do not reset each scrape. The exporter keeps the previous
snapshot and increments each Prometheus counter by the delta since the last
update. A gauge that is already absolute, such as `avalanche_rps`, is set
directly.

The outcome deltas come from the per-vector outcome classes. Bypassed,
error, and challenge counters use the same delta method. The exporter skips
a label when its delta is zero.

## Related pages

- [Controls and Observability](overview.md). The whole observability
  section.
- [Checkpoint and Resume](checkpoint.md). Another way to read run state.
- [Installation](../getting-started/installation.md). How to install the
  `metrics` extra.
