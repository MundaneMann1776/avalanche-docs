---
title: Testing
description: How to run the test suite and the verification gate.
---

# Testing

This page explains how to run the Avalanche test suite and the verification gate. Tests verify project behavior. They do not verify the language, the libraries, or the frameworks.

## Test layout

Tests live under `tests/`. The suite uses pytest. The config in `pyproject.toml` sets `asyncio_mode = "auto"`, so async tests need no decorator.

Tests carry markers:

- `slow`: tests that spawn subprocesses or hit the network.
- `integration`: tests that require a running local server.

The integration tests live in `tests/integration/`. They spin up local servers on loopback:

- `tests/echo_server.py` provides the aiohttp echo server used by the HTTP fixtures.
- `tests/h2_server.py` provides the local HTTP/2 server.
- `tests/conftest.py` exposes the `local_echo_server` fixture and finds a free port.

`tests/fixtures/` holds static data such as `presets.json` and the sample YAML files.

## Main commands

Run the fast suite. It skips the `slow` and `integration` markers:

```bash
python -m pytest tests/ -v -m "not slow and not integration"
```

Run the full suite:

```bash
python -m pytest tests/ -v
```

Run with coverage:

```bash
python -m pytest tests/ -v --cov=src --cov-report=term-missing
```

Run a single file:

```bash
python -m pytest tests/test_tokenbucket.py -v
```

Run a named group of integration tests, for example the cookie tests:

```bash
python -m pytest tests/test_cookie_capture.py tests/test_cookie_replay.py tests/integration/test_cookie_capture_local.py tests/integration/test_cookie_replay_local.py
```

Run the suite from the project `.venv`. The `test` extra installs pytest, pytest-asyncio, pytest-cov, and ruff:

```bash
uv sync --extra test
```

## The verification gate

`scripts/verify.sh` is the full gate. Run it before you finish a change:

```bash
./scripts/verify.sh
```

The script runs five stages:

1. The full pytest suite.
2. `ruff check` on `src/`, `tests/`, and `scripts/`.
3. `ruff format --check` on the same paths.
4. The config-example check via `generate_config_examples.py --check`.
5. The frontend build inside `frontend/`.

The gate exits non-zero when any stage fails. The rule from `AGENTS.md` is mandatory: keep `verify.sh` green.

## Ruff usage

Ruff is the linter and the formatter. Run the checks:

```bash
ruff check src/ tests/ scripts/
ruff format --check src/ tests/ scripts/
```

The ruff config lives in `pyproject.toml`. It targets Python 3.10 and uses a 100-character line length. The lint selection covers the rule groups `E`, `F`, `I`, `N`, `W`, `UP`, `B`, `C4`, and `SIM`. `E501` (line length) is ignored because the formatter handles it.

Apply the formatter when the check fails:

```bash
ruff format src/ tests/ scripts/
```

## Frontend tests

The frontend build runs the type-checker and the matrix validation. Run it from `frontend/`:

```bash
cd frontend
npm run build
```

Keep `npm run build` green. The matrix gate enforces the modifier matrix sync. See [Adding or wiring a modifier](adding-a-modifier.md).

## Related pages

- [Developer Guide overview](overview.md)
- [Project layout](project-layout.md)
- [Adding a config field](adding-a-config-field.md)
