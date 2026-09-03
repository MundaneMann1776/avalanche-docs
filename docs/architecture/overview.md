---
title: Architecture
description: How Avalanche is layered and how one run flows through the engine, vectors, and statistics.
---

# Architecture

This page describes the layered design of Avalanche. It explains what each package does and how one run moves from the interface to the final report.

Avalanche is an async stress-testing toolkit for authorized availability assessments. Use Avalanche only against systems you own or have written permission to test.

## Package layers

The source tree splits into focused packages under `src/avalanche/`. Each package has one job.

| Package | Role |
|---|---|
| `core/` | The engine: config, tester, statistics, rate control, and shared helpers |
| `vectors/` | The attack engine modules, one class per vector |
| `distributed/` | Controller and agent for multi-machine runs |
| `presets/` | Built-in attack profiles and their user store |
| `ui/` | CLI parser, interactive wizard, and web dashboard |
| `utils.py` | Shared logger, user-agent pool, and kill switch |

The other layers depend on `core/`. Vectors depend on `core/` helpers but not on each other. The `ui/` package is the only layer that reads command-line input.

See [Package Map](packages.md) for the full inventory.

## How a run flows

A run has one orchestrator class: `LocalLoadTester` in `core/tester.py`. Every interface hands that class a typed config, and the class owns the run lifecycle.

The flow has six stages.

1. An interface produces a config dict. The interfaces are the CLI (`ui/cli.py`), the interactive wizard, the web dashboard (`DashboardController`), or a playbook file.
2. The config dict becomes a typed `AttackConfig` through `config_from_dict()`.
3. `LocalLoadTester` validates the target, loads cookies, and runs pre-flight checks.
4. The tester builds one vector per enabled entry in the config.
5. Each vector starts its worker loops and records every event into the shared `StatsCollector`.
6. The tester drives the run to its duration, runs the canary loop when configured, and writes the final report.

The run pipeline looks like this.

```text
CLI / dashboard / playbook
            |
            v
    config dict (YAML/JSON)
            |
            v
    config_from_dict() -> AttackConfig (typed, validated)
            |
            v
     LocalLoadTester (core/tester.py)
      |  scope gate + cookie load
      |  preflight solver gate
      |  auto-discovery + mutation probe
      |  build vectors from config
            |
            +----> vector workers (vectors/)
            |        each records into StatsCollector
            |
            +----> canary loop (clean-traffic health probe)
            |
            +----> history tick (1 Hz) -> StatsCollector.record_history()
            |
            v
    teardown -> checkpoint save -> final report
```

The run ends when the duration elapses, the kill switch appears, or a playbook finishes. See [Engine Pipeline](engine.md) for the full lifecycle.

## The engine core

`core/tester.py` contains `LocalLoadTester`. The class builds vectors, runs background tasks, and reads the kill switch. `core/config.py` defines the typed configuration model. `core/stats.py` holds the thread-safe `StatsCollector` that every vector records into.

The engine also enforces safety boundaries. `scope_guard.py` refuses a run whose target is not in the allow-list. The canary probe gives an independent health verdict, and the kill switch at `/tmp/aval_stop` stops any run.

## Vector workers

Each enabled vector becomes one object that subclasses `AttackVector`. The vector base defines `start()` and `stop()`. Slow-socket vectors subclass `SlowSocketVector`, and the HTTP vectors subclass `BaseHTTPVector`.

Vectors do not touch each other. They share the `StatsCollector`, the `CookieStore`, and a `TokenBucket` for rate control. See [Vector Architecture](vectors.md).

## Statistics and reporting

The `StatsCollector` is a thread-safe counter hub. Vectors call `record_request()` and `record_error()` on every event. A 1 Hz history tick computes RPS and bandwidth deltas and stores them in ring buffers.

The metrics exporter publishes those numbers as Prometheus metrics. The run recorder appends one JSON line per second for an engagement. See [Emission and Statistics](emission.md).

The final report is a JSON document written to the data directory. When engagement recording is on, the report and samples also land in the engagement store.

## Related pages

- [Package Map](packages.md)
- [Engine Pipeline](engine.md)
- [Vector Architecture](vectors.md)
- [Configuration Model](config-model.md)
- [Emission and Statistics](emission.md)
- [Developer guide](../developer/overview.md)
