---
title: Installation
description: Install, update, and verify Avalanche on macOS or Linux.
---

# Installation

Avalanche is a Python tool that installs with `uv`. The tool works on macOS
and Linux. It does not support Windows.

## One-command install

The installer installs `uv` when needed and puts `avalanche` on your PATH.

```bash
curl -LsSf https://raw.githubusercontent.com/MundaneMann1776/Avalanche/main/install.sh | sh
```

Pin a specific release when you need one. Set the version before you run
the installer.

```bash
AVALANCHE_VERSION=3.1.0
curl -LsSf https://raw.githubusercontent.com/MundaneMann1776/Avalanche/main/install.sh | sh
```

For private mirrors, the installer honors these environment variables:
`AVALANCHE_GITHUB_TOKEN`, `GH_TOKEN`, and `gh auth token`.

## Development install

Clone the repository and sync the runtime features.

```bash
git clone https://github.com/MundaneMann1776/Avalanche.git
cd Avalanche
uv sync --extra metrics --extra aioquic --extra browser --extra h2 --extra headless
source .venv/bin/activate
```

The `uv sync` command installs the core only when you pass no extras. The
extras enable the optional features:

- `metrics` adds Prometheus client support for `/metrics`.
- `aioquic` adds the HTTP/3 vector.
- `browser` adds browser-grade TLS and HTTP/2 fingerprints.
- `h2` adds the HTTP/2 vector.
- `headless` adds the built-in Chromium challenge solver.
- `--all-extras` adds the test and lint toolchain for development.

Run commands without activating the environment. Prefix them with `uv run`
and repeat the extras.

```bash
uv run --extra metrics avalanche --preset quick-health -t example.com
```

## Update

Avalanche updates in place.

```bash
avalanche update
```

For a release install, the update fetches the latest GitHub release. For a
git checkout, it runs `git pull` and `uv sync` in place.

## Verify the install

Check the version.

```bash
avalanche --version
```

Start the dashboard to confirm the tool runs.

```bash
avalanche
```

## Next steps

- [Quick Start](quickstart.md). Run your first checks.
- [System Requirements](requirements.md). Privileges and libraries.
