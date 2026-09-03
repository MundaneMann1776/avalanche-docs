---
title: Capacity Benchmark
description: How an agent measures the load it can sustain before the run starts.
---

# Capacity Benchmark

The capacity benchmark measures how much load one machine can generate. Each
distributed agent runs it before the fleet starts. The controller uses the
results to slice the load. Use Avalanche only against systems you own or have
written permission to test.

The benchmark is a short self-test. It measures the local engine against a
local loopback sink. The run target is never contacted. The code comments
state this rule directly: the benchmark never benchmarks the run target
automatically.

## Vector families

Each vector belongs to one of three families. The family decides what the
benchmark measures:

| Family | What it measures | Unit |
| --- | --- | --- |
| Throughput | Requests or attempts per second | `attempts_per_sec` |
| Packet | Packets per second | `packets_per_sec` |
| Concurrency | Held connections | `connections` |

The throughput family covers `http`, `http_flow`, `http2`, `http3`,
`websocket`, `dns`, `sip`, and `tls_churn`. The packet family covers `syn`,
`udp`, `icmp`, and `rawip`. The concurrency family covers `slowloris`,
`rudy`, and `slowread`.

## What the benchmark does

The benchmark measures each enabled vector family. The packet family is
measured per vector: each of `syn`, `udp`, `icmp`, and `rawip` gets its own
ramp. The throughput and concurrency families run one ramp on a
representative vector, then copy the result to the other vectors in the
family.

Each ramp follows these steps:

1. The benchmark sends a warm-up round at the lowest level.
2. It runs one 1-second round at each level in a fixed ladder.
3. It reads the rate after each round.
4. It stops the ramp when the rate plateaus or drops under overload.
5. It repeats the peak level once for a confidence check.
6. It applies the safety margin to produce the sustainable value.

The throughput ladder climbs 1, 4, 16, 64, then 256 workers. The concurrency
ladder climbs 1, 4, 16, 64, 256, then 1024 connections.

The ramp stops early on two consecutive plateau rounds. A plateau round is
one whose gain is below 5 percent. An overload round is one whose rate drops
at least 10 percent below the previous round. The peak rate seen so far is
kept.

A raw packet vector that needs root reports a reason of `requires_root` when
it cannot start. A vector whose optional library is missing reports
`module_unavailable`. A vector that makes no attempts reports `no_attempts`.

## Safety margin

The measured value is not the raw ramp peak. It averages the ramp peak with
the confidence re-check at that same level. A re-check that differs from the
peak by more than 15 percent marks the result as unstable.

The benchmark applies a safety margin to every value. The sustainable value
is the measured value multiplied by `0.75`, rounded to an integer.

The margin keeps the fleet inside the measured envelope. Load peaks on real
networks and in real targets, and the margin absorbs that variance.

## Benchmark targets

Without explicit targets, every measurement runs against a local sink. The
sink types are:

- A loopback HTTP responder for throughput vectors.
- A connection holder for concurrency vectors.
- A datagram sink that discards packets for UDP-family vectors.
- No sink for `syn`, `icmp`, and `rawip`, which send raw packets.

Raw packet vectors need root. Without root, they report a capacity of zero
with a `requires_root` reason.

Explicit endpoints override the loopback sink. The operator passes them with
`--agent-benchmark-targets` or in the benchmark parameters. The benchmark
uses the first endpoint in the list for the HTTP-style families. A raw
packet vector takes the host from the first endpoint and sends its packets
there, with port 0.

::: warning
Explicit benchmark targets receive real load. Point them only at systems
you own or have written permission to test.
:::

## Limits and deadline

The controller bounds the whole phase. The agent must finish all of its
measurements inside a 20-second budget. Each ramp starts with a 2-second
warm-up at the lowest level, then runs 1-second rounds. The controller
waits up to 25 seconds for the report. The kill switch stops the phase when
it appears. A family that runs out of time reports a `time_budget` reason.

## The capacity report

Each vector family produces one capacity entry. The entry carries the family,
the measured value, the sustainable value after the margin, and the unit. The
`source` field is `measured` when the measured value is above zero and no
failure reason is set. Otherwise it is `declared`, and the entry carries the
reason.

The agent wraps the entries in a `capacity_report` message and sends it to
the controller. The controller keeps only valid entries and computes the
load split from them. See [Controller](controller.md).

## Related pages

- [Distributed Mode](overview.md). The fleet model.
- [Agent](agent.md). How the agent runs the benchmark.
- [Controller](controller.md). How the results slice the load.
