---
title: Configuration
description: Configure Avalanche with YAML or JSON config files.
---

# Configuration

You can define a run in a config file. Avalanche reads YAML and JSON. The
command line and the dashboard build the same config internally. Use
Avalanche only against systems you own or have written permission to test.

## Top-level structure

A config file has these top-level sections:

```yaml
target: example.com
port: 80
scheme: auto
duration: 0
vectors:
  http:
    enabled: true
    concurrency: 200
    rps: 0.0
limits:
  max_rps: 0.0
  max_bandwidth_mbps: 0.0
runtime:
  canary_path: /
  canary_interval: 10.0
waf_bypass: null
cookie_file: null
```

| Section | Purpose |
| --- | --- |
| `target`, `port`, `scheme`, `duration` | The target and the run length. |
| `vectors` | The per-vector configuration. One key per vector. |
| `limits` | The global caps enforced by the resource governor. |
| `runtime` | Canary, checkpoint, discovery, solver, and SLO settings. |
| `waf_bypass` | The WAF bypass method id applied at launch. |
| `cookie_file` | A captured-cookie file to replay. |

The engine coerces the file into its typed models at load. Unknown keys are
dropped. Missing keys use the model defaults. For strict validation, run
`--dry-run` or `--validate`.

## The vectors section

The `vectors` section holds one key per vector. The order is fixed and
every vector is present when the file is generated. You can write a partial
file: the loader completes it against the canonical defaults.

```yaml
vectors:
  http:
    enabled: true
    concurrency: 300
    bypass_waf: true
    session_sticky: true
  slowloris:
    enabled: true
    workers: 20
  udp:
    enabled: true
    workers: 4
```

Each vector model carries its own keys. See the [Configuration Reference]
(../reference/config-reference.md) for the full key list with defaults, and
the vector knowledge-base pages for what each key does.

## The runtime section

The `runtime` section carries the operational settings:

```yaml
runtime:
  resume: false
  checkpoint_path: ~/.avalanche/checkpoint.json
  canary_path: /
  canary_interval: 10.0
  auto_discover: false
  crawl_depth: 2
  max_urls: 200
  metrics_port: null
  solver_mode: none
  solver_buffer_seconds: 15.0
  slo_enabled: false
  require_scope: false
  json_logs: false
```

## Load a config file

```bash
avalanche -c my_config.yaml
avalanche -c my_config.json
```

A config file is a full run definition. You can still override fields with
flags. See [Command-Line Interface](cli.md).

## Validate a config

Check a config without sending traffic.

```bash
avalanche -c my_config.yaml --dry-run
```

The validator checks the DNS, TCP reachability, proxy and reflector files,
flow files, and optional dependencies. It reports problems and exits with a
non-zero code when the config is invalid.

## Example files

The repository ships generated examples:

- `examples/config.example.yaml`
- `examples/config.example.json`
- `examples/config.schema.json`

These come from the typed models. The schema file documents every field.
Do not edit them by hand. The drift test fails when they are stale.

## Config from other interfaces

- The wizard writes the config it builds.
- The dashboard sends a run payload with the same shape.
- The daemon `start` command accepts a partial config and merges it over a
  preset baseline.

All paths share the same typed models, so the behavior is identical.

## Next steps

- [Configuration Reference](../reference/config-reference.md) — every key
  and default.
- [Presets](presets.md) — saved profiles that fill the same config.
- [Playbooks](playbooks.md) — sequence configs over time.
