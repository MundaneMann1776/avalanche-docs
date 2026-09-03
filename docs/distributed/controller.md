---
title: Controller
description: The controller listens for agents, slices the config, and aggregates stats.
---

# Controller

The controller coordinates a distributed run. It accepts agents, measures their
capacity, slices the config, and sends each agent its slice. Use Avalanche only
against systems you own or have written permission to test.

The controller runs on the machine you control. Start it with `--mode
controller`. Give it the same config you would give a standalone run, with the
target and duration.

```bash
avalanche --mode controller -t target.example -p 443 --scheme https --http 1000
```

## Listener settings

The controller binds to a host and port. The default bind host is `0.0.0.0`.
The default bind port is `9753`.

Use `--dist-bind-host` to change the listen address. Use `--dist-bind-port`
to change the listen port.

```bash
avalanche --mode controller -t target.example --dist-bind-host 0.0.0.0 --dist-bind-port 9753
```

## The join window

The controller opens its listener and waits for agents. The wait lasts
10 seconds. Agents that connect during this window register and get a slot.

When the window closes, the controller stops accepting new agents. It ignores
any agent that connects later. Start every agent before the window closes.

If no agent connected, the controller warns and falls back to a standalone
[local run](../user-guide/modes.md). It runs the full config on the controller
machine instead.

## Secret handshake

Set `dist_secret` in the runtime section of the config, or pass `--dist-secret`.
Both sides must use the same value.

When the secret is set, the controller protects each join:

1. The controller sends a random nonce to the new agent.
2. The agent returns an HMAC-SHA256 of that nonce under the secret.
3. The controller compares the value with constant-time comparison.
4. The controller rejects the agent when the value is wrong.

The controller also rejects an agent whose `max_rps` value is not a number.
See [Distributed Mode](overview.md) for the full handshake description.

## The benchmark phase

After the join window, the controller checks for the kill switch. Then it
starts the benchmark phase. It sends a benchmark command to every agent that
declared benchmark support.

Each agent runs a short self-benchmark and reports its measured capacity.
The controller waits for those reports. The default wait is 25 seconds.
An agent that reports nothing in time falls back to its declared capacity.
The controller logs the missing reports.

Skip the benchmark phase with `--no-agent-benchmark`. The controller then
uses each agent's declared capacity. Change the wait time with
`--benchmark-timeout`. Its default is 25 seconds.

```bash
avalanche --mode controller -t target.example --no-agent-benchmark
```

## Slice the config

The controller computes how to divide the load. Measured sustainable capacity
wins per vector. An agent without a measurement falls back to its declared
`max_rps`. When all weights are zero, the load is split equally.

The controller prints a capacity table before the run starts. The table shows
one row per agent slot with its vectors, its source of capacity, measured
attempts, packets, and connections, and its declared value. The footer shows
the fleet totals.

For each agent the controller then builds one config slice:

- Keep only the vectors the agent declared.
- Scale each vector's numeric `rps`, `concurrency`, and `workers` by that
  agent's share of the vector.
- Scale the `limits.max_rps` and `limits.max_bandwidth_mbps` caps by the
  global share for that agent.
- Remove the canary path. The controller runs the single shared canary.

Each agent gets a copy. No agent sees the full config.

## The run loop

The controller sends a `start` command with the slice to every registered
agent. It then marks the run as started and aggregates the stream.

Every 0.25 seconds the controller merges the freshest stats snapshot from
each agent. It sums requests, errors, outcomes, bandwidth, and status codes
across the fleet. It keeps the highest peak RPS it has seen. Histories are
summed sample by sample at their longest length. The most recent canary
sample seen by any agent is surfaced for the dashboard.

The controller logs a status line every 3 seconds. The line shows the
aggregate RPS, the peak RPS, and the number of agents reporting.

The controller runs until one of these conditions is true:

- The configured duration has elapsed.
- The kill switch file is present.

The controller checks both conditions in its run loop. An agent that
disconnects mid-run is removed from the aggregation, but the run continues
with the agents that remain.

When the run ends, the controller sends a stop command to every agent and
closes their connections. Each agent answers with a `bye` message as it
shuts down.

## Related pages

- [Distributed Mode](overview.md) — the fleet model and when to use it.
- [Agent](agent.md) — the other side of the connection.
- [Capacity Benchmark](benchmark.md) — what each agent measures.
- [Modes of Operation](../user-guide/modes.md) — the `--mode` flag in context.
