---
title: Developer Guide
description: What a contributor needs to build, test, and change Avalanche.
---

# Developer Guide

This section is for contributors who change the Avalanche source code. It covers the repository layout, the contribution workflow, and the rules for adding vectors, presets, modifiers, config fields, and WAF bypass methods. It also covers the test suite and the verification gate.

Use Avalanche only against systems you own or have written permission to test.

## What you need

Avalanche is a Python project managed with uv. You need:

- Python 3.10 or newer.
- `uv` for dependency management.
- A clone of the repository.
- An active virtual environment at `.venv`.

Create the environment and install the dependencies:

```bash
uv sync
source .venv/bin/activate
```

Install the test tooling and the optional runtime libraries when you need them:

```bash
uv sync --extra metrics --extra aioquic --extra browser --extra h2 --extra headless --extra test
```

The optional extras enable HTTP/3 (`aioquic`), HTTP/2 (`h2`), browser-grade TLS (`browser`), the built-in challenge solver (`headless`), and `/metrics` (`metrics`). The `test` extra installs pytest and ruff.

## How the project works

The architecture section explains how the engine, the vectors, and the stores fit together. See [Architecture overview](../architecture/overview.md).

The entry point is the `avalanche` console script, defined in `pyproject.toml` as `avalanche.main:main`. `LocalLoadTester` in `src/avalanche/core/tester.py` is the main orchestrator. Attack behavior lives in vector modules under `src/avalanche/vectors/`.

## Project philosophy

The rules in `CLAUDE.md` set the direction for every change. Follow them:

- **Correctness over output.** The purpose is to maximize correctness, clarity, and longevity. It is not to maximize output.
- **Simplicity.** Between two correct implementations, choose the one with fewer concepts.
- **Erasure.** Deleting obsolete code, dead config, and stale docs is first-class work. When X replaces Y, delete X.
- **Documentation reflects reality.** Never document future or nonexistent behavior. Close roadmap items by deleting them.
- **Simplified Technical English.** Write all project text in ASD-STE100. Keep descriptions under 25 words. Keep instructions under 20 words. Use the active voice.

Read `CLAUDE.md` at the repository root before you start a change.

## Developer workflow

Follow this order for every change:

1. Read the surrounding code and reuse the existing design.
2. Make the change. Keep every changed line in support of the change.
3. Run the relevant tests. Fix what fails.
4. Run `./scripts/verify.sh` as the full gate before you finish.
5. Update the docs when the change affects behavior.

The verification gate runs pytest, ruff, the config-example check, and the frontend build. Keep it green.

The contribution rules in `AGENTS.md` are mandatory. They cover the modifier matrix and the WAF fingerprinting rule. Follow them in the same commit as the code change.

## Change procedures

The following pages describe the procedures in detail:

- [Project layout](project-layout.md): where every part of the repository lives.
- [Adding a vector](adding-a-vector.md): how to add a new attack engine module.
- [Adding a preset](adding-a-preset.md): how to add a built-in profile.
- [Adding or wiring a modifier](adding-a-modifier.md): how to add an attack modifier across the engine, the dashboard, and the docs.
- [Adding a config field](adding-a-config-field.md): how to extend the typed config model.
- [WAF bypass methods](waf-bypass-methods.md): how the bypass catalog and fingerprinting work.
- [Testing](testing.md): how to run the test suite and the verification gate.

## Related pages

- [Architecture overview](../architecture/overview.md)
- [Installation](../getting-started/installation.md)
- [Configuration reference](../reference/config-reference.md)
