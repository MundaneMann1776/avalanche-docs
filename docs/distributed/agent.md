---
title: Agent
description: The agent connects to a controller, receives a config slice, and runs it.
---

# Agent

The agent is the load-generating side of distributed mode. It connects to a
controller, receives its config slice, and runs that slice with
`LocalLoadTester`. Use Avalanche only against systems you own or have written
permission to test.

Run one agent per machine. Start it with `--mode agent` and point it at the
controller.

```bash
avalanche --mode agent --dist-controller 203.0.113.10:9753
```

## Connect to the controller

The agent opens a TCP connection to the controller address. The default
address is `127.0.0.1:9753`. Use `--dist-controller` to set the address in
`HOST:PORT` form.

```bash
avalanche --mode agent --dist-controller 203.0.113.10:9753
```

An agent with a secret set waits for the controller nonce. It returns the
HMAC of that nonce under the shared secret. Pass the same secret on both
sides with `--dist-secret`.

The agent then sends a `hello` message. The message declares its `max_rps`
and the list of vectors it supports. When benchmarking is allowed, the hello
also declares benchmark support.

## Receive the config slice

After the hello, the agent waits for commands from the controller. The
controller sends one of these messages:

- A `start` command carries the config slice.
- A `benchmark` command asks for a self-benchmark.
- A `stop` command ends the session.

When a `start` arrives, the agent parses the config slice. It builds a
`LocalLoadTester` from the slice and runs it. A malformed slice stops the
agent with an error.

The tester runs until the slice duration elapses, or until the controller
closes the connection or sends `stop`. The agent then shuts down the
tester. In either case the agent sends a `bye` message before it closes.

## Stream stats

While the tester runs, the agent streams telemetry to the controller. A stats
message carries a full `StatsCollector` snapshot once per second. The agent
also sends a heartbeat message every 5 seconds.

## Declared capacity

The agent declares its capacity to the controller in the hello. The declared
value is `agent_max_rps`. The controller uses it for slicing when no measured
capacity exists.

The default for `--agent-max-rps` is `0`. A value of `0` enables the
self-benchmark. The agent then benchmarks on connect and reports measured
capacity instead.

Give an explicit value to skip the benchmark. Use an explicit value when you
already know the machine's capacity from an earlier run.

```bash
avalanche --mode agent --dist-controller 203.0.113.10:9753 --agent-max-rps 15000
```

## Benchmark discovery

With `agent_max_rps` left at `0`, the agent benchmarks itself. The controller
sends the benchmark command with parameters such as the timeout, warm-up
period, and safety margin.

The agent runs the benchmark and sends back a `capacity_report`. The report
holds the measured capacity per vector family. When the benchmark fails, the
agent logs the failure and sends an empty report. The controller then uses
the declared capacity.

An agent that is not benchmark-capable skips this phase. The controller
sends the benchmark command only to agents that declared support in the
hello. The non-capable agent waits for `start`, and the controller uses the
declared capacity.

## Benchmark targets

The benchmark never contacts the run target by default. Each vector measures
against a local loopback sink. Raw packet vectors such as `syn`, `icmp`, and
`rawip` need no sink at all.

Use `--agent-benchmark-targets` when loopback is not a realistic measure.
Give comma-separated `HOST:PORT` pairs. The benchmark then sends its load to
those endpoints instead of the local sink.

```bash
avalanche --mode agent --dist-controller 203.0.113.10:9753 --agent-benchmark-targets 192.0.2.50:8080
```

::: warning
Benchmark targets receive real load. Point them only at systems you own or
have written permission to test.
:::

See [Capacity Benchmark](benchmark.md) for what the benchmark measures.

## Vector selection

The agent supports the vectors that are enabled in its own config. When no
vector is enabled, the agent falls back to the `http` vector. The controller
keeps only supported vectors in the slice it sends back.

## Related pages

- [Distributed Mode](overview.md). The fleet model.
- [Controller](controller.md). The listener the agent joins.
- [Capacity Benchmark](benchmark.md). How capacity is measured.
- [Modes of Operation](../user-guide/modes.md). The `--mode` flag in context.
