---
title: Controls and Observability
description: The mechanisms that pace, protect, measure, and compare your runs.
---

# Controls and Observability

Avalanche gives you control over how a run behaves and visibility into what
the run does. This section covers both. Use Avalanche only against systems
you own or have written permission to test.

Control means pacing and protecting. Observability means measuring and
comparing.

## The control mechanisms

A run must respect the rates and limits you set. Four mechanisms enforce
that:

- **Rate limiting** paces each vector with a token bucket. Each bucket
  allows a steady rate of requests or packets with room for short bursts.
- **The resource governor** enforces global caps across all vectors. It
  throttles every vector together when the run exceeds the total RPS or
  bandwidth you allowed.
- **SLO mode** is a closed-loop search. It raises the HTTP rate while the
  origin stays healthy, then holds at the load where the origin starts to
  break.
- **Adaptive targeting** reweights HTTP endpoints from live per-path stats.
  It shifts load away from endpoints that error or slow down.

See [Rate Limiting and the Resource Governor](governor.md), [SLO Mode](slo.md),
and [Adaptive Targeting](adaptive-targeting.md).

## The observability mechanisms

A run produces state you can read while it runs and after it stops. Three
mechanisms expose that state:

- **Metrics** serve Prometheus-compatible counters and gauges on a local
  HTTP endpoint.
- **Checkpoints** save run state as versioned JSON so a later run can
  resume from where the last one stopped.
- **A/B comparison** runs two configs and reports which one performed
  better.

See [Metrics](metrics.md), [Checkpoint and Resume](checkpoint.md), and
[A/B Comparison](comparison.md).

## Safety first

These controls support safe use. They do not replace judgment.

The independent [canary](../user-guide/canary-killswitch.md) probes the
target with clean traffic. The [kill switch](../user-guide/canary-killswitch.md)
file stops a run immediately. Read the safety rules in the
[User Guide](../user-guide/overview.md) before a real run.

## Related pages

- [Rate Limiting and the Resource Governor](governor.md)
- [SLO Mode](slo.md)
- [Adaptive Targeting](adaptive-targeting.md)
- [Metrics](metrics.md)
- [Checkpoint and Resume](checkpoint.md)
- [A/B Comparison](comparison.md)
- [Architecture Overview](../architecture/overview.md) — where these
  components live in the engine.
- [Attack Vectors Overview](../attack-vectors/overview.md) — what the
  vectors do under load.
