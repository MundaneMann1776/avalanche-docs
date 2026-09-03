---
title: Canary and Kill Switch
description: The independent health probe and the global stop control.
---

# Canary and Kill Switch

This page explains the two main safety controls: the canary and the kill
switch. Use Avalanche only against systems you own or have written
permission to test.

## Canary

The canary is an independent health probe. It runs alongside the attack. It
sends clean traffic to a path on the target and measures the response. Its
purpose is to tell you whether real users can still reach the target while
the attack runs.

### How the canary works

The canary probes the target on an interval. It records the outcome of each
probe. From the outcomes it produces a health verdict. The verdict has four
states:

| Verdict | Meaning |
| --- | --- |
| Up | Clean traffic reaches the target and returns normally. |
| Slow | Clean traffic reaches the target but responds slowly. |
| Blocked | The edge blocks or challenges the canary traffic. |
| Down | The target does not respond to the canary. |

The engine feeds the verdict to the run. You can read it live on the
dashboard. SLO mode uses the same verdict to drive the load. See
[SLO Mode](../controls/slo.md).

### Canary settings

The canary has two main settings:

- `runtime.canary_path` — the path the canary requests. Default `/`.
- `runtime.canary_interval` — the interval between probes in seconds.
  Default 10.

CLI flags:

```bash
avalanche -t target.example --canary-path /health --canary-interval 5
```

A preset can disable the canary. The `brute-force` preset runs with no
canary because its short, high-volume runs drown clean traffic.

## Kill switch

The kill switch stops a run from any process. It is a file. Create it and
the engine stops the run.

```bash
touch /tmp/aval_stop
```

The engine polls for the file during the run. High-rate vectors poll less
often to keep the hot path fast. Slow connection-hold vectors poll every
loop, so stop latency stays low.

Remove the file before your next run.

```bash
rm /tmp/aval_stop
```

::: warning
The kill switch stops a run. It does not undo traffic already sent. Stop
early enough to respect the target and the engagement window.
:::

## Next steps

- [Safety and Authorized Use](safety.md) — the rules of use.
- [SLO Mode](../controls/slo.md) — the closed-loop ramp that uses the
  canary verdict.
