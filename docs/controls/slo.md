---
title: SLO Mode
description: Closed-loop ramp to the origin's breaking point from the canary verdict.
---

# SLO Mode

SLO mode finds the load where the origin starts to break. It runs in a
closed loop. A canary verdict drives the HTTP rate up, and the loop holds
when the origin crosses the target reach time. Use Avalanche only against
systems you own or have written permission to test.

This page uses "knee" for the breaking point. The knee is the rate just
before the origin fails your service objective. The phrase comes from the
SLO code, which names the search "knee search".

## When to use SLO mode

Use SLO mode when the question is capacity, not attack. It answers this
question: how much HTTP load can the origin serve before it stops meeting
the target reach time?

SLO mode needs three preconditions. The run fails with a clear error when
any of them is missing:

- The canary path is set with `--canary-path`. The search reads the canary
  health signal.
- The `http` vector is enabled. SLO mode drives the HTTP vector.
- No playbook is active. A playbook and SLO mode both drive the rate, so
  you cannot use them together.

## The feedback signal

The search does not trust the flood's own latency. Attack traffic can be
blocked, rate-limited, or answered from the edge. Those results say nothing
about the origin.

The search trusts the canary instead. The canary sends clean traffic to the
origin and returns a calibrated verdict. The verdict is one of `UP`, `SLOW`,
`BLOCKED`, `PROBE_ERROR`, or `DOWN`. See the canary page for the verdict
definitions.

A `BLOCKED` or `PROBE_ERROR` verdict measures the edge, not the origin. The
search pauses the ramp on these verdicts. It keeps the current rate and
waits for the next probe. A paused ramp never records a false knee.

## The knee search

The search is an AIMD loop. AIMD means additive-increase, multiplicative-
decrease. The code states the behavior plainly: multiply the rate up while
healthy, and on a breach record the knee, back off, and shrink the step.

The loop runs at the canary interval. Each tick the loop reads the freshest
canary probe and applies one decision:

- A healthy probe clears the breach streak. While searching, the loop
  multiplies the rate by `1.5`, up to the configured maximum. When the rate
  is already at the ceiling, the loop holds because no knee exists up to
  `max_rps`.
- A breach is a `DOWN` verdict or a reach time above the target. One breach
  does not move the rate. The loop backs off only after 2 breaches in a
  row, so one noisy probe never moves the rate.
- On a confirmed breach, the loop records the current rate as the knee. It
  backs the rate off toward the minimum and shrinks the raise factor toward
  `1.0`. When the factor is within `0.05` of `1.0`, the loop holds.

The loop applies every new rate to the vector's token bucket. The dashboard
shows the live phase, current rate, and knee. The report records the knee,
the reason, and the ramp timeline.

## Hold at the knee

The search has two phases. The code exposes them as `searching` and
`holding`.

While searching, the loop climbs and backs off. Once the step is small
enough, the phase becomes `holding`. A hold means the search found the
knee and stays near it. The loop keeps reading probes but no longer climbs.

A run can hold without a knee. This happens when the origin stays healthy
all the way to the configured `max_rps` ceiling. The loop reports no knee
in that case.

## Config keys

Set SLO mode in the runtime section of the config. The relevant keys are:

| Config key | Default |
| --- | --- |
| `runtime.slo_enabled` | `false` |
| `runtime.slo_target_ttfb_ms` | `1800` |
| `runtime.slo_start_rps` | `50` |
| `runtime.slo_min_rps` | `10` |
| `runtime.slo_max_rps` | `100000` |

The runtime also needs `canary_path`. The search interval comes from
`canary_interval`, whose default is 10 seconds.

## CLI flags

The CLI maps one flag to each SLO key. Enable SLO mode with `--slo`. Then
set the bounds you need.

```bash
avalanche -t target.example --http 200 --canary-path /health \
  --slo --slo-target-ttfb 1500 --slo-start-rps 50 \
  --slo-min-rps 10 --slo-max-rps 20000
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--slo` | off | Enable closed-loop SLO mode. |
| `--slo-target-ttfb` | `1800` ms | A canary TTFB above this is a breach. |
| `--slo-start-rps` | `50` | The rate where the ramp starts. |
| `--slo-min-rps` | `10` | The lower bound for backing off. |
| `--slo-max-rps` | `100000` | The upper bound; the search stops here. |

::: tip
A target TTFB over the ceiling is the breach reason `ttfb_over_target`.
A `DOWN` verdict is the reason `down`. The report shows the reason at the
knee.
:::

## Related pages

- [Rate Limiting and the Resource Governor](governor.md). The bucket the
  search drives.
- [Controls and Observability](overview.md). The whole control section.
- [Canary and Kill Switch](../user-guide/canary-killswitch.md). The canary
  verdict in detail.
