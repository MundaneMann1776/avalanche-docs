---
title: Introduction
description: What Avalanche is, what it does, and the rules for its use.
---

# Introduction

Avalanche is an async availability-testing toolkit. You use it for
authorized load and resilience assessments. Use Avalanche only against
systems you own or have written permission to test.

Avalanche runs from a web dashboard, a command line, or an interactive
wizard. You can run it on a workstation for quick checks. You can run it on
a VPS for high-bandwidth engagements.

## What Avalanche provides

Avalanche covers the full assessment workflow. The main areas are:

- Attack vectors. The engine has 54 attack types across 16 vectors. The
  vectors work at Layer 3, Layer 4, and Layer 7.
- Evasion. Browser-grade TLS and HTTP/2 fingerprints, coherent headers, WAF
  and CDN detection, cookie capture and replay, and challenge solving.
- Managed pools. A proxy pool, a spoof-source store, and a reflector pool
  for UDP amplification.
- Control. Token-bucket rate limiting, a resource governor, a canary with a
  health verdict, and a global kill switch.
- Targeting. Endpoint discovery, per-endpoint statistics, and adaptive
  targeting.
- Scale. Distributed controller and agent mode with capacity benchmarking.
- Operations. Checkpoint and resume, Prometheus metrics, A/B config
  comparison, a Unix-socket daemon, engagement recording, and structured
  logging.

## How you use it

You can use the tool in several ways. The typical paths are:

- The web dashboard. A bare `avalanche` command starts it on
  `127.0.0.1:8787`.
- The command line. One line defines a full run.
- The interactive wizard. It guides you through the configuration.
- A YAML playbook. It sequences timed attack phases.
- Distributed mode. One controller slices the load across agents.
- The daemon. A Unix socket controls runs over JSON.

## Safety rules

Avalanche is a stress-testing tool. It sends high volumes of traffic. Use it
only where you have permission. Keep these rules:

- Test only systems you own or have written permission to test.
- Understand the canary and the kill switch before you start a run.
- Start with a preset or a dry run to review the configuration.
- Watch the live dashboard during a run. You decide when to stop.

Read the [Safety page](../user-guide/safety.md) before your first real run.

## Next steps

- [Quick Start](quickstart.md). Run your first check in minutes.
- [Installation](installation.md). Install or update Avalanche.
- [System Requirements](requirements.md). What the tool needs.
