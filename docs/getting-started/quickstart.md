---
title: Quick Start
description: Run your first Avalanche checks in minutes.
---

# Quick Start

This page gets you from install to your first runs. It assumes a macOS or
Linux machine and Python 3.10 or newer. Use Avalanche only against systems
you own or have written permission to test.

## Start the web dashboard

A bare command starts the web dashboard and opens a browser.

```bash
avalanche
```

The dashboard runs on `http://127.0.0.1:8787`. You can plan a run, start
it, and watch it live from the browser.

## Run a preset check

A preset is a saved attack profile. The `quick-health` preset is a light
probe. Use it to confirm a target is up.

```bash
avalanche --preset quick-health -t example.com
```

The preset runs for 30 seconds. It sends a low HTTP rate and keeps the
canary on.

## Run a direct command-line check

One line defines a full run. This example sends 1,000 HTTP requests per
second to a target on port 443 over HTTPS:

```bash
avalanche -t target.example -p 443 --scheme https --http 200 --http-rps 1000
```

The `--http 200` value sets the HTTP vector concurrency. The `--http-rps
1000` value sets the target rate.

## Preview a run without sending traffic

The `--dry-run` flag builds the full configuration and validates it. It
sends no traffic.

```bash
avalanche -t target.example --http 200 --dry-run
```

Review the printed JSON. Fix anything the validator reports.

## Use the interactive wizard

Run the wizard when you want guided configuration:

```bash
avalanche --wizard
```

The wizard walks you through target, vectors, rates, and runtime options.
It writes the final configuration for the run.

## Stop a run

You have two ways to stop a run:

- Press `Ctrl+C` in the terminal that runs it.
- Create the kill-switch file. The engine checks it and stops.

```bash
touch /tmp/aval_stop
```

Remove the file before your next run.

## Next steps

- [Modes of Operation](../user-guide/modes.md). Every way to run the tool.
- [Web Dashboard](../user-guide/dashboard.md). Plan and watch runs.
- [Safety and Authorized Use](../user-guide/safety.md). Read this before a
  real run.
