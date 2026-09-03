---
title: WAF Bypass Methods
description: How the WAF bypass catalog, fingerprinting, and solver registry work.
---

# WAF Bypass Methods

This page explains how WAF bypass methods work and how to add one. The catalog lives in `src/avalanche/waf_bypass/`. The rule from `AGENTS.md` is strict: a WAF bypass method is not implemented until its capture fingerprinting is implemented in the same commit.

Use Avalanche only against systems you own or have written permission to test.

## The method catalog

The seed methods live in `src/avalanche/waf_bypass/seeds.py`. Methods are created in code only. The WAF Bypass page does not create them. It can edit and delete existing methods.

Each method carries these fields:

- `id` and `name`.
- `category`, one value from `CATEGORIES` in `waf_bypass/models.py`.
- `vendor` tags and `best_for` vendor tags.
- `description` and `summary`.
- `how_it_works`, the step-by-step playbook text.
- `builtin`: true for seed methods.
- `implemented`: true when the engine behavior exists.
- `params`: the settings the method applies.

Two implemented methods ship in the seeds: `cloudflare` and `f5`. A `none` method means no bypass.

### Categories

`CATEGORIES` in `models.py` is the curated list of vendor and platform categories. It covers the providers that appear in PCI DSS and financial-sector engagements. China-domestic-only WAFs are intentionally not tracked. Adding a category is data-only. It needs no engine change.

### Implemented versus planned

Seed methods set `builtin: true`. The `_PLANNED_WAFS` tuple lists planned vendor methods. Planned methods ship with `implemented: false`. The catalog and the dropdowns show them so the vendor landscape is visible.

Planned methods behave differently:

- They are excluded from the selectors.
- `resolve_and_apply` rejects them at launch with an error.

The engine behavior for each vendor is added in later passes.

## Parameters and engine keys

`PARAM_SPECS` in `models.py` defines the supported method parameters and their types. `validate_params` coerces the values and rejects unknown parameters.

Each parameter maps onto an engine-backed key. `PARAM_TO_ENGINE` in `waf_bypass/apply.py` holds the mapping. For example, `browser_grade` maps to the `bypass_waf` vector key. `session_sticky`, `cookie_flood`, `random_endpoints`, `use_proxies`, and `human_timing` map to the same-named keys.

`apply_method` overlays the method params onto the `http` and `http_flow` vectors of the run config. Solver params such as `solver_mode`, `solver_provider`, and `solver_buffer_seconds` go into the run-level `runtime` config. Method params fill keys only when the CLI has not already set them. CLI wins.

## Storage and launch

Methods are stored at `~/.avalanche/waf_bypass.json`. The store file is versioned. The store upgrades older files on read:

- Planned seed methods are appended without touching user records.
- Built-in records whose seed id left the catalog are pruned.
- Built-in records are refreshed from the current seed definitions.

User-created records are never touched.

At launch, `resolve_and_apply` in `waf_bypass/apply.py` resolves `config["waf_bypass"]` and applies the method. It runs before validation. It raises `ValueError` when the method does not exist, so a run never starts silently without the selected bypass. It also raises when the method is not implemented.

The CLI path calls `resolve_and_apply` in `main.py`. The dashboard path calls it in `dashboard_controller.py` when a run starts.

Methods never modify preset definitions.

## The fingerprinting rule

Implementing a vendor-specific method means flipping it to `implemented: true` or adding engine behavior. That change requires fingerprinting in the same commit.

1. Add the provider to `detect_edge` in `src/avalanche/cookies/capture.py`. Use header, cookie, body, or URL markers. `detect_edge` fingerprints headers, cookies, body, and the final URL for providers such as Cloudflare, Akamai, Fastly, and F5.

2. Add a `WafSignature` to the generated vendor DB when the provider has a distinguishable block or challenge page. The source of truth is `data/waf_vendors.yaml`. Curated entries live in the `HAND_TUNED` list of `scripts/gen_waf_db.py`.

3. Regenerate the DB:

```bash
.venv/bin/python scripts/gen_waf_db.py
```

4. Commit the regenerated `src/avalanche/core/waf_db.py`.

::: danger
Never edit `waf_db.py` by hand. `WafDetector._builtin()` only imports it. Regenerate it from `scripts/gen_waf_db.py`.
:::

The signature can use `cookie_patterns` when cookies decide the classification, as with the F5 TSPD challenge. It can use `reason` when the reason phrase decides it.

The same commit must add:

- Unit tests for the new markers.
- A local WAF fixture in `tests/integration/test_cookie_capture_local.py`.
- An updated edge list in the user guide and the developer guide.

Never claim a provider is fingerprintable in the dashboard or the docs unless `detect_edge` or the WAF detector consumes its markers and a test covers it. Planned catalog entries with `implemented: false` need no fingerprinting.

## Custom WAF signatures

Operators can add custom signatures without touching the generated DB. A signature is a YAML file under `~/.avalanche/waf_signatures/`, managed from Settings, the dashboard API, or the CLI. Files are validated on load and published through the registry in `core/waf_signatures.py`. Every `WafDetector` instance consumes them.

The YAML schema fields are:

- `name`: a unique name, 3 to 64 characters.
- `provider`: the canonical provider id or a custom slug.
- `kind`: `blocked`, `rate-limit`, `managed-challenge`, `interactive`, or empty.
- `status_codes`: the status filter. Empty means any status.
- `body`, `headers`, `cookies`: the regex lists that identify the WAF.
- `exclude_cookies`: regexes that suppress the signature.
- `match`: `any` or `all`.
- `priority`: higher is checked first.
- `enabled`: skip the file when false.
- `tests`: embedded fixtures that verify the signature.

Every custom signature is self-verifying. `avalanche --validate-waf-signatures` and the Test action in the dashboard run the embedded fixtures.

## The solver provider registry

The provider registry lives in `src/avalanche/solvers/registry.py`. `SolveRequest` and `SolveResult` are the shared contracts. `SolverClient` is the adapter protocol. `resolve_solver(provider, config)` returns the adapter for the provider name.

The providers are:

- `headless`: the built-in Playwright Chromium adapter. It is the default pre-flight provider.
- `flare`: the FlareSolverr adapter. FlareSolverr is an operator-run service. It is never bundled.
- `tspd`: the adapter over the native TSPD challenge client.
- `self` and `self_hosted`: the client for the operator-run solver service. It posts `{html, headers, url}` to `/solve` and expects `{cookies, userAgent}`.
- `manual` and `byhand`: the interactive flow. It rejects automated solves because the by-hand flow is browser plus paste.

To add a provider, implement `SolverClient`, add a branch to `resolve_solver`, and wire the branch into the pre-flight gate or the mid-run solver path in `core/tester.py`. Add unit tests against a local mock service. Follow the fingerprinting rule for vendor-specific fingerprints.

## Related pages

- [Adding a vector](adding-a-vector.md)
- [Adding a config field](adding-a-config-field.md)
- [Testing](testing.md)
- [Cookie capture](../reconnaissance/cookie-capture.md)
