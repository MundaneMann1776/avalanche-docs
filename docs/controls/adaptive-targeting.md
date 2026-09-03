---
title: Adaptive Targeting
description: Per-endpoint stats and shifting load toward endpoints that answer.
---

# Adaptive Targeting

Adaptive targeting reweights the HTTP endpoints of a run from live per-path
stats. It gives more load to endpoints that answer fast without transport
errors, and less to endpoints that fail. Use Avalanche only against systems
you own or have written permission to test.

## Per-endpoint stats

The HTTP vector tracks a counter set for each request path. The tracking is
thread-safe and separate from the global stats collector.

For each path the tracker records:

- The request count and the number of responses received.
- The number of transport errors and requests with no response.
- The number of blocked, challenged, and bypassed responses.
- A latency sum and count, which give the average latency.
- The HTTP status codes and the outcome classes.

The outcome classes are `clean`, `blocked`, `challenged`,
`server_error`, `transport_error`, and `sent_without_response`. The tracker
sorts a path as `blocked` when the response was marked blocked, and as
`challenged` when it was marked challenged. A status of 500 or above is a
`server_error`. Any other answered status is `clean`.

Note the two error paths. An exception or a timeout calls `record_error`,
which adds to `errors` and `transport_errors`. A blocked response with a
status code adds to `blocked` and `requests` instead. It does not add to
`errors`.

Two helpers rank the paths. `top_slow` returns the paths with the highest
average latency. `top_error` returns the paths with the highest error rate.
Each helper takes up to 10 paths.

## How tracking is enabled

The tracker is on when the `http` vector config sets `endpoint_stats` to
`true`. Adaptive targeting turns the tracker on implicitly, because it needs
the same data. See the CLI flags below.

## The health score

Adaptive targeting recomputes an endpoint distribution at a fixed interval.
The default interval is 30 seconds.

The targeting loop computes a health score for each endpoint. The score is
`1.0` minus a penalty. The penalty combines the error rate and the latency:

```text
health = 1.0 - (error_rate * 0.6 + latency_factor * 0.4)
```

The latency factor is the average latency divided by the maximum latency
the targeting loop accepts. The default maximum is 10000 milliseconds. A
higher transport error rate or a slower endpoint lowers the health.

The new weight of an endpoint is its base weight multiplied by its health.
The health is clamped at a floor of `0.1`. An endpoint keeps at least
10 percent of its base weight even when it looks unhealthy. The final
weights are normalized so they sum to `1.0`.

Workers reload the endpoint distribution every 20 requests. They pick each
next endpoint with weighted random choice. A heavy endpoint receives more
requests than a light one.

## Config keys

The three keys live in the `http` vector config. They are `adaptive_targeting`,
`adaptive_targeting_interval`, and `endpoint_stats`.

```yaml
vectors:
  http:
    enabled: true
    adaptive_targeting: true
    adaptive_targeting_interval: 30
    endpoint_stats: true
```

The defaults are `false` for the two switches and `30.0` seconds for the
interval.

## CLI flags

Two BooleanOptionalAction flags exist. Use `--adaptive-targeting` to turn
adaptive targeting on, and `--endpoint-stats` to turn per-endpoint tracking
on. Both accept a `--no-` prefix to turn them off.

```bash
avalanche -t target.example --http 200 --adaptive-targeting --endpoint-stats
```

There is no CLI flag for the interval. Change the interval in the config
with `adaptive_targeting_interval`.

## What the load moves away from

The design intent is clear in the code comments: dynamic content gets the
bulk of the traffic, and static assets are deprioritized. Static assets such
as images, fonts, CSS, and JavaScript come from the edge cache and add
nothing to an availability test.

The health score reads the transport error rate and the average latency.
It does not read the block ratio. An endpoint that blocks your path keeps
its share as long as its requests answer fast without transport errors.
Read the block counts per endpoint in the dashboard before you treat a
share change as a target signal.

## Related pages

- [Endpoint discovery](../user-guide/configuration.md) — where the endpoint
  list comes from.
- [Canary and Kill Switch](../user-guide/canary-killswitch.md) — the health
  verdict that measures the origin.
- [Controls and Observability](overview.md) — the whole control section.
- [Metrics](metrics.md) — how outcome counters feed the exporter.
