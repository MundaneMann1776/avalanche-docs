---
title: Adding a Config Field
description: How to extend the typed config model and keep the examples fresh.
---

# Adding a Config Field

This page explains how to add a new config field to Avalanche. Config flows through the typed Pydantic models in `core/config.py`. The legacy dict shape still works through `config_from_dict` and `config_to_dict`.

Follow the procedure to add a field.

## Procedure

1. Add the field to the correct Pydantic model in `core/config.py`. Choose the model that owns the setting. Vector settings live in the vector config models, for example `HttpVectorConfig` or `SmtpVectorConfig`. Run-level settings live in `AttackConfig` or the runtime model.

2. Update the coercion helper. Helpers such as `_http()`, `_proxy()`, `_smtp()`, and `_coerce_attack_config()` translate the legacy dict shape into the typed models. Give the helper a default that matches the model default.

3. Add validation in `core/validator.py` when the dry run should catch bad values. The validator checks each vector and setting without sending traffic.

4. Regenerate the examples and the schema:

```bash
uv run python scripts/generate_config_examples.py
```

5. Commit the refreshed files. The generator writes `examples/config.example.yaml`, `examples/config.example.json`, and `examples/config.schema.json`.

## The drift test

The config example files are committed. A drift test in `tests/test_config_examples.py` fails when they are stale. The test parses the committed examples, compares them with the typed models, and runs the generator in check mode.

Run the generator with `--check` to verify the files without writing them:

```bash
uv run python scripts/generate_config_examples.py --check
```

`scripts/verify.sh` runs that check as part of the full gate. Keep the committed examples current in every commit that changes a model.

## Dict defaults and parity

A vector config field also needs an entry in `VECTOR_DEFAULTS` in `core/vector_defaults.py`. The parity test in `tests/test_validator.py` fails when the typed model gains a field that the dict defaults lack. Add both sides in the same commit.

Config keys are `snake_case`. CLI flags are `kebab-case`.

## Related pages

- [Adding a vector](adding-a-vector.md)
- [Adding a preset](adding-a-preset.md)
- [Testing](testing.md)
- [Configuration reference](../reference/config-reference.md)
