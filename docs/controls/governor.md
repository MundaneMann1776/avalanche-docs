---
title: Rate Limiting and the Resource Governor
description: Per-vector token buckets and global RPS and bandwidth caps.
---

# Rate Limiting and the Resource Governor

Avalanche paces load at two levels. Each vector has its own token bucket. A
resource governor enforces global caps across all vectors. Use Avalanche
only against systems you own or have written permission to test.

## The token bucket

A vector that sets a request rate creates one token bucket. The bucket
limits how fast that vector can act.

The bucket refills at a fixed rate. Refills happen every 5 milliseconds,
which gives about 200 refill ticks per second. Each action, such as one HTTP
request or one packet send, consumes one token. When the bucket is empty,
the vector waits for the next refill.

The burst size defaults to 20 percent of the rate. It never falls below 1.
The burst lets a vector send a short burst above the steady rate, then the
bucket rebuilds its reserve.

The bucket wakes waiters fairly. It wakes only as many waiters as there are
whole tokens, so one refill tick does not wake every worker at once. The
consume operation refuses an amount larger than the burst capacity.

The rate can change while a vector runs. `set_rate` updates the steady rate
and rebuckets the burst to 20 percent of the new rate. This lets the governor
and SLO mode drive the rate live. A bucket can also snapshot its state and
rebuild from it, which is how [checkpoints](checkpoint.md) restore pacing.

### The per-vector rate

Set the per-vector rate with the `rps` key of that vector, or on the command
line with `--http-rps`.

```bash
avalanche -t target.example --http 200 --http-rps 1000
```

The value is requests per second. A value of `0` removes the bucket and runs
the vector unpaced.

## The resource governor

The token bucket limits one vector. The resource governor limits the whole
run. It enforces two caps from the `limits` section of the config:

| Config key | CLI flag | What it caps |
| --- | --- | --- |
| `limits.max_rps` | none | Total requests per second across all vectors |
| `limits.max_bandwidth_mbps` | none | Total egress bandwidth in megabits per second |

Set either cap to `0` to disable it. When both caps are `0`, the governor is
off.

```yaml
limits:
  max_rps: 5000
  max_bandwidth_mbps: 800
```

### Two enforcement paths

The governor enforces the caps in two ways.

The first path is a per-action reservation. Before a vector emits traffic,
it calls the governor with an estimated byte size for the action. The
governor reserves one request slot and a byte budget. It computes how long
the vector must wait to stay inside the caps. The vector sleeps for that
wait. When the wait is canceled, the governor releases the reservation.

The second path is proportional throttle. A background tick samples the
aggregate stats every second. When the measured RPS exceeds `max_rps`, the
governor scales every registered bucket down by the ratio of the cap to the
measured value. The bandwidth cap does the same when the measured bandwidth
exceeds it. The smaller of the two scales wins.

The governor stores each bucket's original rate as its baseline. When the
aggregate throughput falls back under both caps, the governor restores the
baseline rate. This releases the throttle.

The governor logs when throttling engages and when it releases. The live
dashboard shows the throttled state and the active cap, which is `rps` or
`bandwidth`.

## When the governor throttles

The governor engages when measured throughput crosses a cap. The tick
samples the live RPS and the live bandwidth. Live RPS above `max_rps`
engages the RPS scale. Live bandwidth above `max_bandwidth_mbps` engages
the bandwidth scale. Both can engage at once; the smaller scale wins.

The proportional path keeps every vector at the same relative scale. No
single vector starves. The per-request path smooths short-term spikes.

The caps are global. A run with several vectors shares the budget across
all of them.

## Related pages

- [SLO Mode](slo.md) — closed-loop rate control that drives the same buckets.
- [Checkpoint and Resume](checkpoint.md) — how bucket state survives a stop.
- [Controls and Observability](overview.md) — the whole control section.
- [Configuration](../user-guide/configuration.md) — config files and keys.
