---
title: Adding a Preset
description: How to add a new built-in attack profile.
---

# Adding a Preset

This page explains how to add a preset. A preset is a named attack profile that ships with the app. Avalanche ships five presets: `quick-health`, `cdn-bypass`, `brute-force`, `stealth`, and `api-stress`.

Follow the procedure to add a sixth preset.

## Procedure

1. Open `src/avalanche/presets/seeds.py`.
2. Add a key to `_PRESET_OVERRIDES`. The key is the preset id. Use `snake_case`.
3. Add a description for the key in `SEED_DESCRIPTIONS`. The description appears in the preset selector.
4. Set the preset fields. Each preset lists only the fields that differ from `_BASE_PRESET` or from the canonical vector defaults in `core/vector_defaults.py`.

A preset override has this shape:

```python
"my-preset": {
    "duration": 60,
    "vectors": {
        "http": {"concurrency": 200, "rps": 100},
    },
    "runtime": {"canary_interval": 10.0},
},
```

Include `duration` at the top level. Include only the vector and runtime fields that differ. The seeding code merges the override onto `_BASE_PRESET` and completes every vector against `VECTOR_DEFAULTS`. See `_merge_preset_with_config` and `SEED_PRESETS` in the same file.

## What happens next

The seed presets are copied into the user store at `~/.avalanche/presets.json` on first use. `presets/store.py` reads and writes that file. When the seed version changes, the store refreshes the built-in copies.

A new preset appears in three places without further code:

- The `--preset` flag on the command line.
- The interactive wizard profile list.
- The Attack Presets page in the web dashboard.

All three read the same store.

## Test the preset

Run the preset tests:

```bash
python -m pytest tests/test_presets_inheritance.py tests/test_preset_store.py -q
```

Update `tests/fixtures/presets.json` only for intentional seed changes. The tests compare stored presets with the seeded definitions.

## Runtime editing

Users can create, edit, duplicate, and delete presets at runtime. The CLI, the wizard, and the web dashboard operate on the same store. A preset you add as a seed behaves exactly like the built-in ones.

## Related pages

- [Adding a vector](adding-a-vector.md)
- [Adding a config field](adding-a-config-field.md)
- [Testing](testing.md)
- [Presets in the user guide](../user-guide/presets.md)
