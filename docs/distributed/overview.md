---
title: Distributed Mode
description: When and how to run one controller with many agents across machines.
---

# Distributed Mode

Distributed mode spreads one availability test across many machines. One
controller coordinates the run. Many agents generate the load. Use Avalanche
only against systems you own or have written permission to test.

## When to use distributed mode

One machine has limits. Its CPU, open sockets, and network bandwidth bound the
load it can generate. A single egress IP is also easy for the edge to throttle.

Distributed mode removes those limits. Each agent runs on its own machine with
its own egress. The fleet can hold more connections and send more requests or
packets than any one host could.

Run distributed mode when you need this scale. For a short check on one target,
run Avalanche in [standalone mode](../user-guide/modes.md) instead.

## How the fleet works

The controller and agents speak TCP. Each message is one JSON object followed
by a newline. This framing is called newline-delimited JSON.

The flow of a distributed run has five steps:

1. The controller opens a listener and waits for agents to join.
2. Each agent connects and declares its vectors and capacity.
3. The controller runs the capacity benchmark and measures each agent.
4. The controller slices the config and sends one slice to each agent.
5. The agents run until the duration ends or you create the kill switch.

The controller drives the whole run. See [Controller](controller.md).

Each agent runs the load slice it receives. It streams its stats back to the
controller. See [Agent](agent.md).

## Measured capacity

An agent does not guess how much load it can produce. It measures the load.

Before the run starts, each capable agent runs a short self-benchmark. The
benchmark measures sustainable rate per vector family. It never contacts the
run target. See [Capacity Benchmark](benchmark.md).

The controller uses those measurements to slice the load. A faster agent
gets a larger share of each vector. A slower agent gets a smaller share.
Each vector's share sums to the full intensity across the agents that
support it.

## Optional secret handshake

The control channel carries no secrets by default. Anyone who can reach the
listener can join as an agent.

Set `--dist-secret` on both sides when you want protection. The controller
then sends a random nonce to each new agent. The agent returns an HMAC-SHA256
of that nonce under the shared secret. The controller accepts the agent only
when the value matches.

Use a strong secret on an untrusted network. Both sides must use the same
value.

## Config slicing

Each agent supports a set of vectors. The controller keeps only the vectors an
agent can run. It scales the numeric intensity of each vector by the measured
capacity share.

The slice also scales the global limits. Each agent enforces its share of the
`limits.max_rps` and `limits.max_bandwidth_mbps` caps. The controller strips
the canary path from every slice because the controller runs the one shared
canary itself.

## Start a distributed run

Start the controller on the machine you control. Give it the target and the
full run config.

```bash
avalanche --mode controller -t target.example --dist-secret "$SECRET"
```

Start each agent on a separate machine. Point each agent at the controller.

```bash
avalanche --mode agent --dist-controller 203.0.113.10:9753 --dist-secret "$SECRET"
```

The controller waits 10 seconds for agents to join. If no agent connects, it
falls back to a standalone local run. Start the agents before that window
closes.

## Related pages

- [Controller](controller.md). The listener that slices and aggregates.
- [Agent](agent.md). The machine that runs a load slice.
- [Capacity Benchmark](benchmark.md). How agents measure their own capacity.
- [Modes of Operation](../user-guide/modes.md). Other ways to run Avalanche.
- [User Guide Overview](../user-guide/overview.md). Plan a full assessment.
- [Architecture Overview](../architecture/overview.md). How the engine fits
  together.
