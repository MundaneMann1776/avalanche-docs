---
title: User Guide Overview
description: How to plan, start, and watch Avalanche runs.
---

# User Guide Overview

This guide explains how to use Avalanche for authorized availability
assessments. Read it before your first real run.

The guide covers the tools you use to build and run a test:

- [Modes of Operation](modes.md) — the ways you can start Avalanche.
- [Command-Line Interface](cli.md) — flags that define a run in one line.
- [Web Dashboard](dashboard.md) — the browser interface.
- [Presets](presets.md) — saved attack profiles.
- [Configuration](configuration.md) — config files, YAML and JSON.
- [Playbooks](playbooks.md) — sequenced attack phases.
- [Canary and Kill Switch](canary-killswitch.md) — the safety controls.
- [Engagements and Reports](engagements-reports.md) — record runs and export
  results.

The [Safety page](safety.md) states the rules of use. It comes first in
importance. Use Avalanche only against systems you own or have written
permission to test.

## A typical workflow

A typical assessment follows these steps:

1. Prepare your machine. Install Avalanche and the extras you need.
2. Pick a target you may test. Start with the [Quick Start]
   (../getting-started/quickstart.md).
3. Do reconnaissance. Find subdomains, endpoints, and the origin IP.
4. Build the run. Use a preset, the wizard, a config file, or one CLI line.
5. Validate the run. Use `--dry-run` to review the full configuration.
6. Start the run. Watch the dashboard and the canary.
7. Stop at the planned time. Export the report.

## Where to go next

- [Modes of Operation](modes.md) — choose how to run.
- [Web Dashboard](dashboard.md) — start from the browser.
- [Attack Vectors](../attack-vectors/overview.md) — understand what each
  vector does.
