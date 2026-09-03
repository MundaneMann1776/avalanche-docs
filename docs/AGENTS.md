# AGENTS.md — Avalanche Docs

This file is for any agent that works on this documentation site. Read it
before you change any page. It is the companion to `MAINTAINING.md`.

## Source of truth

This site documents the Avalanche toolkit. The source code lives in the
private repository `MundaneMann1776/Avalanche`. This docs repository is
public. Never copy source code into this repository.

The documentation must reflect the code at a specific revision. The file
`docs/.vitepress/config.mts` does not hold that revision. The review stamp
below does. Update it every time you sync the docs to a new code revision.

Current review stamp: code revision `50df495`, version 3.1.0, docs
reference revision 1, reviewed 2026-09-03.

## Accuracy rules

- Document only what the code does today. Never document a planned or
  future feature as real.
- Before you change facts, read the code in the Avalanche repository. Do
  not trust older repo docs over the code. The repo's own docs can be
  stale. Two known examples: the repo `ATTACK_MATRIX.md` says 43 attack
  types, and the frontend catalog says 54. The frontend catalog
  (`frontend/src/data/attackTypes.ts`) is authoritative. The repo
  `DEVELOPER_GUIDE.md` claims SQLite origin storage, but the code writes
  JSON (`origin_dataset.json`, `origin_scans.json`).
- When a feature is removed from the code, remove or rewrite the page that
  describes it. Documentation shrinks when the code shrinks.
- When a feature changes name, default, or flag, update every page that
  uses it in the same change.
- Keep the attack-type counts consistent. Current truth: 54 attack types,
  16 vectors. Layer 3 has 9. Layer 4 has 15. Layer 7 has 30.

## Style rules

- Write in ASD-STE100 Simplified Technical English combined with the
  Microsoft Style Guide. Short sentences, active voice, present tense, US
  spelling, sentence-case headings.
- Use the exact product terms: "vector", "attack type", "run",
  "engagement", "canary", "kill switch", "egress".
- Include the authorized-use sentence on every page that describes running
  an attack: "Use Avalanche only against systems you own or have written
  permission to test."
- Never write marketing claims. Never claim a capability the engine does
  not have.

## Structure rules

- A new vector needs a knowledge-base page under
  `docs/attack-vectors/kb/vector-<name>.md`, a row in the vector overview
  tables, and a sidebar entry in `docs/.vitepress/config.mts`.
- A removed vector needs the reverse: delete its KB page, its rows, and its
  sidebar entry.
- Use relative `.md` links between pages. Verify links resolve before you
  commit.

## Authorized-use notice

Avalanche is an authorized availability-testing tool. This public site must
keep that framing on every attack page. Do not soften it.

## Deploy

GitHub Actions builds and publishes the site on every push to `main`. The
workflow is `.github/workflows/deploy.yml`. A docs change is live about one
minute after the push. There is no per-version cost and no quota to manage.
