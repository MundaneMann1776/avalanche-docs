---
title: Configuration Model
description: The typed Pydantic config hierarchy, dict compatibility, and how the example files are generated.
---

# Configuration Model

This page describes the configuration model in `core/config.py`. It explains the typed hierarchy, how legacy dicts still work, and where defaults come from.

Avalanche treats configuration as data. Every run starts from a plain dict, and the engine coerces that dict into a validated, immutable model. The full key-by-key reference lives in the [configuration reference](../reference/config-reference.md). This page stays structural.

## The typed hierarchy

`core/config.py` defines frozen Pydantic dataclasses. The models are immutable by design. The root model is `AttackConfig`.

```text
AttackConfig
├── target, port, scheme, duration
├── vectors: VectorsConfig
│   ├── http:      HttpVectorConfig
│   ├── http_flow: HttpFlowVectorConfig
│   ├── slowloris: SlowlorisConfig
│   ├── rudy:      RudyConfig
│   ├── smtp:      SmtpVectorConfig
│   ├── udp:       UdpVectorConfig
│   ├── icmp:      IcmpVectorConfig
│   ├── syn:       SynVectorConfig
│   ├── rawip:     RawIpVectorConfig
│   ├── slowread:  SlowReadConfig
│   ├── tls_churn: TlsChurnConfig
│   ├── sip:       SipVectorConfig
│   ├── dns:       DnsVectorConfig
│   ├── http2:     Http2VectorConfig
│   ├── websocket: WebSocketVectorConfig
│   └── http3:     Http3VectorConfig
├── limits: LimitsConfig
│   └── max_rps, max_bandwidth_mbps
├── runtime: RuntimeConfig
├── waf_bypass (method id, optional)
└── cookie_file (optional)
```

Every field carries a default. Numeric fields declare bounds through Pydantic constraints. For example, `concurrency` sits between 1 and 10,000, and worker counts between 1 and 1000.

Two nested models support the HTTP vectors.

- `ProxyConfig` holds proxy settings: `enabled`, `file`, `fetch_public`, `cache_path`, and `sticky`.
- `TlsFingerprintConfig` holds TLS randomization: `enabled` and `pool_size` (1 to 64).

## Top-level sections

The table lists the top-level sections of a config and their purpose.

| Section | Purpose |
|---|---|
| `target` | The host to test. A string such as `example.com`. |
| `port` | The target port. Default 80. |
| `scheme` | `auto`, `http`, or `https`. `auto` resolves from the port: 443 and 8443 mean `https`. |
| `duration` | Run length in seconds. Default 0, which means run until stopped. |
| `vectors` | One subsection per vector. Each subsection has an `enabled` flag and its tuning keys. |
| `limits` | Global caps enforced by the resource governor. Both default to 0, which means no cap. |
| `runtime` | Run behavior: canary, resume, metrics, discovery, and solver keys. |
| `waf_bypass` | The WAF bypass method id, chosen at launch. Optional. |
| `cookie_file` | Captured cookies to replay. Optional. When absent, the default capture store is used. |

### Vector sections

Each vector subsection holds that vector's tuning keys. The `http` section is the richest. It carries `concurrency` (200 default), `rps` (0 default), `bypass_waf`, `body_method`, `body_ratio`, proxy and TLS subsections, solver keys, and opt-in flags such as `adaptive_targeting` and `endpoint_stats`.

The `http_flow` section controls the flow player. It adds `flow_dir` and `flow_fuzz`. Sections such as `slowloris` and `rudy` are simpler: `workers`, timing jitter, and hold behavior. Raw packet sections carry `process_workers`, `spoof`, and packet-field keys.

## Legacy dict compatibility

The dict path and the typed path both work. Two functions bridge them.

- `config_from_dict(d)` coerces a plain dict into an `AttackConfig`. Unknown keys are silently dropped. Missing keys use model defaults.
- `config_to_dict(cfg)` converts a typed model back to a plain dict that v1 code paths expect.

The coercion layer is deliberate. It reads the flat v1 keys, such as `use_proxies` and `tls_randomize`, and maps them onto the nested models. It also maps the nested keys that `config_to_dict` emits for dashboard-launched runs. Both shapes reach the same model.

The tester keeps the original dict alongside the typed model. Some engine paths still read the dict directly, so the two must stay consistent.

## Field naming

Config keys are `snake_case`. Examples are `max_bandwidth_mbps`, `extra_endpoints`, and `body_ratio`. Command-line flags are `kebab-case`, such as `--max-bandwidth-mbps` and `--http-rps`. The CLI layer maps one to the other.

## Default sources

A default has two sources, and they must agree.

- The typed model declares the default in `core/config.py`.
- `core/vector_defaults.py` declares the same default in the v1-compatible dict.

A parity test keeps the HTTP vector defaults in sync across both sources. Call `vector_defaults(name)` to get an independent copy of one default dict. Call `complete_vector_configs()` to merge partial vector configs onto the canonical defaults.

The generated example config is the source of truth for every current default.

## The generated example config

`scripts/generate_config_examples.py` regenerates three committed files from the typed models.

| Output | Content |
|---|---|
| `examples/config.example.yaml` | One full example config with every default |
| `examples/config.example.json` | The same example as JSON |
| `examples/config.schema.json` | The JSON Schema for `AttackConfig` |

Run the script to regenerate the files.

```bash
uv run python scripts/generate_config_examples.py
```

Run the same command with `--check` to verify the committed files are current. The script sets `checkpoint_path` to `null` in the outputs, because the real default contains a machine-specific home path.

The top level of the YAML example looks like this.

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
  slowloris:
    enabled: true
    workers: 30
  rudy:
    enabled: true
    workers: 10
  udp:
    enabled: true
    workers: 2
  icmp:
    enabled: false
  ...
limits:
  max_rps: 0.0
  max_bandwidth_mbps: 0.0
runtime:
  resume: false
  canary_path: null
  canary_interval: 10.0
  ...
waf_bypass: null
cookie_file: null
```

Values set to `null` use the model default at runtime.

## Runtime keys

`runtime` carries run behavior, not vector tuning. The list shows each key with its default.

| Key | Default | Purpose |
|---|---|---|
| `resume` | `false` | Resume a run from the checkpoint |
| `checkpoint_path` | `~/.avalanche/checkpoint.json` | Where the checkpoint is written |
| `webhook_url` | `null` | POST the final report to this URL |
| `export_json_path` | `null` | Copy the final report to this path |
| `canary_path` | `null` | Path the canary probes |
| `canary_interval` | `10.0` | Seconds between canary probes |
| `canary_proxy` | `null` | Clean egress for the canary |
| `preset` | `null` | Name of the profile in use |
| `engagement` | `null` | Name of the engagement for this run |
| `scope` | `null` | Name of the scope for this run |
| `scope_fqdns` | `[]` | Allow-list of domains |
| `record_engagement` | `true` | Record the run into an engagement |
| `require_scope` | `false` | Fail closed when the target is not in the allow-list |
| `metrics_port` | `null` | Port for the Prometheus `/metrics` endpoint |
| `web_dashboard_port` | `null` | Port for the live web dashboard |
| `auto_discover` | `false` | Discover endpoints before the run |
| `crawl_depth` | `2` | Crawl depth for discovery |
| `max_urls` | `200` | URL cap for discovery |
| `discover_js` | `false` | Render pages with Playwright during discovery |
| `discover_js_max_pages` | `25` | Page cap for the renderer |
| `probe_mutations` | `false` | Run the mutation probe before the run |
| `probe_max_variants` | `64` | Variant cap for the mutation probe |
| `probe_mutations_only` | `false` | Exit after the mutation probe |
| `find_origin` | `false` | Run the report-only origin hunt |
| `find_origin_only` | `false` | Exit after the origin hunt |
| `endpoint_source` | `manual` | Where endpoints come from: `manual`, `file`, or `discovery` |
| `json_logs` | `false` | Print console logs as JSON lines |
| `debug_tls` | `false` | Enable TLS debugging on the HTTP vector |
| `dist_secret` | `null` | Shared secret for distributed mode |
| `slo_enabled` | `false` | Enable the closed-loop SLO knee search |
| `slo_target_ttfb_ms` | `1800.0` | TTFB target for the knee search |
| `slo_start_rps` | `50.0` | Starting HTTP rate for the search |
| `slo_min_rps` | `10.0` | Lower bound for the search |
| `slo_max_rps` | `100000.0` | Upper bound for the search |
| `warm_clearance` | `false` | Warm each egress before the run |
| `warm_cap` | `10` | Egress cap for warm-up |
| `solver_mode` | `none` | `none`, `headless`, `manual`, `self_hosted`, or `tspd` |
| `solver_provider` | `""` | `byhand` or `flare` |
| `solver_buffer_seconds` | `15.0` | Buffer after pre-flight solving |

## Related pages

- [Architecture](overview.md)
- [Configuration reference](../reference/config-reference.md)
- [Adding a config field](../developer/adding-a-config-field.md)
- [Presets](../user-guide/presets.md)
