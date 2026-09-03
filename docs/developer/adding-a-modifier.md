---
title: Adding or Wiring a Modifier
description: The four layers that must change to add a modifier.
---

# Adding or Wiring a Modifier

This page explains how to add a modifier or wire one into the engine. A
modifier is an attack knob, for example Timing Jitter or Fragmentation. The
engine reads a config key for it. The dashboard exposes it as a switch per
attack type.

The rule from `AGENTS.md` is strict. The attack matrix must never claim a
modifier is implemented when it is not. It must never hide a modifier that
the engine just wired. Keep both sides in the same commit.

## The four layers

A modifier is wired only when all four layers change in the same commit.

### 1. Engine

Implement the config key in the vector under `src/avalanche/vectors/`.

Follow the existing design. Packet-field helpers live in `core/packet.py`. Pacing helpers live in `core/pacing.py`.

Add the field to the typed config model in `core/config.py` and to the dict defaults in `core/vector_defaults.py`. See [Adding a config field](adding-a-config-field.md) and [Adding a vector](adding-a-vector.md).

### 2. Dashboard data

Add the label to `MODIFIER_MAP` in `frontend/src/data/engineMapping.ts`. `MODIFIER_MAP` maps each vector name to its modifier labels and config keys. Add the label only for the vectors that support it.

Add the matching rows to `frontend/src/data/attackSwitchMatrix.ts` for every attack whose vector supports the label. The per-attack matrix is hand-maintained. It is not auto-generated. A modifier wired in the engine does not appear in the attack matrix until its rows exist.

::: warning
Never add a matrix row for a modifier that is not wired. Never mark a modifier as Ready or Default on unless the engine consumes its config key for that attack's vector.
:::

### 3. Documentation

Update `docs/ATTACK_TYPE_MODIFIER_MATRIX.md`. Add the SHOW rows and set the status for every affected attack type.

Set the registry verdict in `docs/research/modifiers/registry.tsv` to `EXISTS` when the engine behavior is complete.

### 4. Verification

Run the frontend build:

```bash
cd frontend && npm run build
```

The `validate-matrix` gate runs inside the build. It fails in two cases:

- A matrix row is not supported by its attack's vector.
- A wired modifier has no row in the matrix for any attack of that vector.

Keep `npm run build` green.

## Matrix status labels

`docs/ATTACK_TYPE_MODIFIER_MATRIX.md` uses these status labels:

- `AVAILABLE`: the engine reads the config key, and the behavior has a real effect for this attack type.
- `AVAILABLE_IMPLICIT`: the behavior exists and applies, it is hardcoded, and it has no toggleable config key.
- `ENGINE_READY`: the engine behavior exists and applies, and the modifier panel does not expose it as a toggle.
- `NO_EFFECT`: the engine accepts the key, and the attack path ignores it.
- `UI_MISMATCH`: the UI advertises a switch, and the engine does not consume it for this attack type. Do not show it.
- `NOT_APPLICABLE`: the attack type cannot use this switch.
- `PLANNED`: the catalog row is not wired. Do not show it for any attack type.

The per-attack matrix keeps a SHOW list and a HIDE list per attack type. SHOW is the list of features the dashboard renders. HIDE is the list of features the dashboard hides, with the reason.

The registry verdict in `docs/research/modifiers/registry.tsv` records whether the engine behavior exists. `EXISTS` means the behavior is complete. `GO` and `MODIFY` mean the row is planned.

## The honesty rule

Never claim a modifier is implemented when it is not. Do not show a planned modifier in the per-attack matrix. Do not wire a modifier without matrix rows and matrix-doc rows in the same commit.

## Related pages

- [Adding a vector](adding-a-vector.md)
- [Adding a config field](adding-a-config-field.md)
- [Testing](testing.md)
- [Project layout](project-layout.md)
