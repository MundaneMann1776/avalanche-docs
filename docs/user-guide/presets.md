---
title: Presets
description: The built-in attack profiles and how to use them.
---

# Presets

A preset is a saved attack profile. It provides a complete configuration
baseline. You select one, then override the fields you need. Use Avalanche
only against systems you own or have written permission to test.

## The built-in presets

Avalanche ships five presets. They cover the common assessment shapes.

| Preset | Description | Duration |
| --- | --- | --- |
| `quick-health` | Light probe for "is the site alive". No evasion. | 30 s |
| `cdn-bypass` | For Cloudflare, Fastly, or AWS Shield targets. Full bypass kit. | 60 s |
| `brute-force` | Unprotected servers. Maximum volume. | 60 s |
| `stealth` | Low-and-slow realistic browser traffic. | Unlimited (0) |
| `api-stress` | REST or GraphQL endpoint stress via flow replay. | 60 s |

### quick-health

A friendly smoke test. It sends a low HTTP rate and keeps the canary on so
you can see whether clean traffic gets through.

```bash
avalanche --preset quick-health -t example.com
```

### cdn-bypass

The bypass kit for targets behind a CDN or WAF. It enables browser-grade
TLS (`bypass_waf`), sticky sessions, proxy use with sticky egress, human
timing, and the low-and-slow companions Slowloris and RUDY.

```bash
avalanche --preset cdn-bypass -t target.example
```

### brute-force

Maximum concurrency with no evasion. Use it only for unprotected internal
or owned targets where you want to find the breaking point. It starts a UDP
storm by default. Supply a reflector file to upgrade the storm to
amplification. It runs with no canary.

```bash
avalanche --preset brute-force -t target.example
```

::: warning
This preset sends high volume with no evasion and no canary. Use it only
on targets you own or have written permission to test.
:::

### stealth

Long-running low-and-slow traffic with realistic browser behavior. It runs
HTTP at a very low rate plus the HTTP-flow player replaying YAML scenarios
from `./flows`. The canary watches real-user reachability.

```bash
avalanche --preset stealth -t target.example
```

The duration is 0, which means the run continues until you stop it.

### api-stress

Endpoint stress for REST and GraphQL services. The HTTP-flow player drives
realistic scenarios. The plain HTTP flood is disabled, so you supply the
scenarios in `./flows`.

```bash
avalanche --preset api-stress -t target.example
```

## Use a preset with overrides

Presets merge with the flags you pass. The flags override the preset fields
one by one.

```bash
avalanche --preset quick-health -t target.example -d 120 --http 100
```

This example runs the quick-health baseline, but for 120 seconds with an
HTTP concurrency of 100.

## Manage your own presets

The presets are seeded into `~/.avalanche/presets.json` on first use. You
can create, edit, duplicate, and delete presets at runtime:

- From the CLI with `--preset`.
- From the wizard.
- From the **Attack Presets** page in the dashboard.

All three read the same store. The seed presets regenerate when the store
is missing. Your changes persist in the store.

## Next steps

- [Configuration](configuration.md) — config files and keys.
- [Web Dashboard](dashboard.md) — plan a run in the browser.
