---
title: Adding a Vector
description: The step-by-step procedure for adding a new attack vector.
---

# Adding a Vector

This page explains how to add a new attack vector to Avalanche. A vector is one attack engine module, for example `http` or `smtp`. The 16 vectors are the modules the tester can start.

The procedure has six steps. Each step names the exact file to change. The `http3` and `smtp` vectors are worked examples of the same checklist.

## 1. Subclass the right base class

Create the vector module at `src/avalanche/vectors/<name>.py`.

Choose the base class from `src/avalanche/vectors/base.py` and `base_http.py`:

- `AttackVector` is the abstract base. Subclass it directly for non-HTTP vectors. Implement `start()` and `stop()`.
- `BaseHTTPVector` is the shared base for HTTP vectors. It wires up cookie extraction, WAF analysis, the proxy pool, the token bucket, and the TLS fingerprinter.
- `SlowSocketVector` is the base for slow connection-hold vectors. `smtp` subclasses it.

Write one instruction in one sentence in your code comments.

## 2. Add the config model

Add a typed config model to `src/avalanche/core/config.py`. The models are frozen dataclasses with Pydantic `Field` constraints.

Follow the naming pattern. `smtp` adds `SmtpVectorConfig`; `http3` adds `Http3VectorConfig`.

Add coercion for the legacy dict shape. Each vector has a coercion helper inside `_coerce_vectors`, named after the vector. `smtp` uses `_smtp`; `http3` uses `_http3`. Register the helper in the `VectorsConfig` constructor call at the end of `_coerce_vectors`.

Config keys are `snake_case`.

## 3. Register the name and defaults

Add the vector name to `SUPPORTED_VECTOR_NAMES` in `src/avalanche/core/vector_defaults.py`. The tuple sets the canonical order for vector configs.

Add an entry to `VECTOR_DEFAULTS` in the same file. The entry holds the v1-compatible dict defaults for the vector, including `enabled` and the worker or concurrency count.

::: warning
Keep the dict defaults in sync with the typed config model. A parity test in `tests/test_validator.py` fails when the HTTP model gains a field that the dict defaults lack. The same pattern covers the other typed vectors.
:::

## 4. Register construction in the tester

Add a branch to `_build_vectors_from_config` in `src/avalanche/core/tester.py`. The method reads `self.config["vectors"]`, checks the `enabled` flag for the vector, and appends the vector instance to `self.vectors`.

Follow the existing branches. Pass the vector name, the target host, the target port, the stats collector, and the merged config dict.

For a vector that needs an optional library, guard the import with `try/except ImportError` and set an availability flag. The `http3` branch imports `HTTP3Flood` and `AIOQUIC_AVAILABLE` from `..vectors.http3`. When `aioquic` is missing, it logs a warning and skips the vector. The `http2` branch does the same for `h2`.

When the optional library is required for a valid run, reject the run in the dry-run validator. `core/validator.py` appends an error when `http3` is enabled without `aioquic`, and the same for `http2` without `h2`.

## 5. Add the CLI flags and the wizard branch

Add the CLI flags to `src/avalanche/ui/cli.py`. Flags are `kebab-case`. The `smtp` flags are `--smtp`, `--smtp-mode`, `--smtp-workers`, and `--smtp-port`. The `http3` flags are `--http3` and `--http3-rps`.

Apply the flags in the config builder of the same file. When a flag is set, start from `vector_defaults("<name>")`, overlay the flag values, and store the result in the `vectors` dict.

Add the wizard branch to `src/avalanche/ui/setup.py` for interactive use. `_configure_vectors` dispatches per vector name. The `http` and `http_flow` vectors have dedicated prompt functions. Other vectors go through `_prompt_other_vector`. Add a dedicated prompt function when your vector needs custom questions. The wizard derives its prompt defaults from `VECTOR_DEFAULTS` and the chosen preset.

## 6. Write tests

Add tests in `tests/test_<name>.py`. Test the vector behavior, the CLI wiring, and the config coercion.

Local integration fixtures use the servers in `tests/`. `smtp` has a local fixture in `tests/integration/test_smtp_local.py`.

Mark network tests with the `slow` or `integration` markers. See [Testing](testing.md).

## Worked examples

`http3` is the worked example for an HTTP-based vector with an optional dependency. It adds `Http3VectorConfig` in `core/config.py` and the `http3` entry in `core/vector_defaults.py`. The tester branch warns and skips when `aioquic` is missing. The dry-run validator rejects an enabled HTTP/3 vector without `aioquic`. The CLI adds `--http3` and `--http3-rps`.

`smtp` is the worked example for a non-HTTP vector. It subclasses `SlowSocketVector`, adds `SmtpVectorConfig`, and adds the `smtp` entry in `core/vector_defaults.py`. The tester branch targets the `-p` port unless `smtp.port` overrides it. The dashboard registers the `smtp_slow_attack` attack type with its modifiers and settings rows.

## Related pages

- [Adding a config field](adding-a-config-field.md)
- [Adding a preset](adding-a-preset.md)
- [Adding or wiring a modifier](adding-a-modifier.md)
- [Testing](testing.md)
