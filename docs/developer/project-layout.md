---
title: Project Layout
description: Where every part of the Avalanche repository lives.
---

# Project Layout

This page is a reference to the repository layout. Use it to find the file you need to change. The paths in the table are relative to the repository root.

## Source packages

The Python package lives under `src/avalanche/`. Each subpackage has one responsibility.

| Path | Purpose |
| --- | --- |
| `src/avalanche/core/` | The engine. Holds config models, statistics, rate limiting, the governor, proxies, TLS, the checkpoint, the playbook, WAF detection, the validator, and the tester. |
| `src/avalanche/vectors/` | The attack vectors. Each module subclasses `AttackVector`, `BaseHTTPVector`, or `SlowSocketVector`. |
| `src/avalanche/distributed/` | The controller and agent for multi-machine runs. |
| `src/avalanche/presets/` | The built-in profiles and the preset store. |
| `src/avalanche/ui/` | The CLI parser, the interactive wizard, the web dashboard server, the daemon, and scan pipelines. |
| `src/avalanche/campaigns/` | Campaign definitions and the campaign store. |
| `src/avalanche/cookies/` | Browserless cookie capture, the capture store, and manual cookie import. |
| `src/avalanche/discovery/` | The passive sources shared by subdomain and endpoint discovery. |
| `src/avalanche/endpoints/` | Endpoint discovery service, store, and models. |
| `src/avalanche/origin/` | The origin IP finder, a report-only recon tool. |
| `src/avalanche/reporting/` | Reports: HTML, CSV, findings, charts, and engagement recording. |
| `src/avalanche/solvers/` | The solver provider registry and the headless adapter. |
| `src/avalanche/subdomains/` | Subdomain scanning, the dataset store, and wordlist handling. |
| `src/avalanche/waf_bypass/` | The WAF bypass method catalog, store, and apply logic. |
| `src/avalanche/utils.py` | Shared helpers: the logger, the user-agent pool, the kill switch, and the `~/.avalanche` helper. |
| `src/avalanche/main.py` | The console-script entry point. It dispatches to each run mode. |
| `src/avalanche/data/` | Bundled data files, including the subdomain wordlists. |

### Core engine highlights

The most important files inside `core/` are:

- `config.py`: the Pydantic-typed config models and the `config_from_dict` and `config_to_dict` coercion helpers.
- `tester.py`: `LocalLoadTester`, the main orchestrator. It builds the vectors from config.
- `vector_defaults.py`: `SUPPORTED_VECTOR_NAMES` and the per-vector defaults.
- `validator.py`: the dry-run validator.
- `waf_db.py`: the generated WAF vendor signature database. Never edit it by hand.

## Repository top level

| Path | Purpose |
| --- | --- |
| `frontend/` | The web dashboard source. It is a Vue 3, Vite, and TypeScript app. |
| `docs/` | The repository-level guides: `DEVELOPER_GUIDE.md`, `USER_GUIDE.md`, the attack matrices, and the roadmap. |
| `examples/` | The committed config examples and the JSON schema. |
| `data/` | Source data for generated artifacts. It holds `waf_vendors.yaml` and the CDN ranges. |
| `scripts/` | Development and operation scripts. They include `verify.sh` and `generate_config_examples.py`. |
| `tests/` | The pytest suite. |
| `pyproject.toml` | Package metadata, dependencies, and the ruff and pytest configuration. |
| `uv.lock` | The locked dependency resolution. It is committed. |
| `.github/workflows/` | The CI definitions. |

## The web dashboard

The dashboard source lives in `frontend/`. It uses Vue 3, Vite, TypeScript, Tailwind CSS, shadcn-vue, and uPlot.

`npm run build` type-checks the app and writes the compiled output to `src/avalanche/ui/web/dist/`. The Python server serves that directory.

Read `frontend/DESIGN_SYSTEM.md` before you change a screen. Follow the design rules on every screen.

Commit the compiled output in `src/avalanche/ui/web/dist/`. End users do not need Node.js. They receive the compiled app in the installed package. The server tests in `tests/test_web_dashboard.py` assert the compiled app shell, so rebuild the frontend before you run them.

## Related pages

- [Developer Guide overview](overview.md)
- [Adding a config field](adding-a-config-field.md)
- [Testing](testing.md)
