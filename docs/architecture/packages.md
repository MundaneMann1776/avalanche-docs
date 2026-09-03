---
title: Package Map
description: Reference to every package under src/avalanche and the modules each package contains.
---

# Package Map

This page lists every package under `src/avalanche/` and the modules each one contains. Use it to find where a feature lives before you read its code.

The map is grounded in the real directory listing and in `docs/API_OVERVIEW.md` in the repository.

## Package table

| Package | Role | Key modules |
|---|---|---|
| `core/` | The engine: typed config, run orchestration, statistics, rate control, checkpoint, discovery, and shared infrastructure | `config.py`, `tester.py`, `stats.py`, `validator.py`, `checkpoint.py`, `governor.py`, `tokenbucket.py`, `metrics.py`, `emit.py`, `emit_shards.py`, `proxy.py`, `reflector.py` |
| `vectors/` | The attack engine modules; one class per vector | `base.py`, `base_http.py`, `http_flood.py`, `http_flow.py`, `slowloris.py`, `rudy.py`, `slowread.py`, `udp.py`, `icmp.py`, `syn.py`, `rawip.py`, `smtp.py`, `sip.py`, `dns.py`, `tls_churn.py`, `http2.py`, `http3.py`, `websocket.py` |
| `distributed/` | Controller and agent for multi-machine runs | `controller.py`, `agent.py`, `benchmark.py` |
| `presets/` | Built-in attack profiles and the user preset store | `seeds.py`, `store.py`, `schema.py` |
| `ui/` | CLI parser, wizard, scan runners, and web dashboard server | `cli.py`, `setup.py`, `web_dashboard.py`, `dashboard_controller.py`, `daemon.py`, `scan.py` |
| `campaigns/` | Named target groups for the target workspace | `models.py`, `store.py`, `service.py` |
| `cookies/` | WAF cookie capture, manual import, and replay verification | `capture.py`, `models.py`, `store.py`, `verify.py`, `manual.py` |
| `discovery/` | Shared keyless passive discovery sources | `sources.py` |
| `endpoints/` | Endpoint discovery and saved per-target endpoint lists | `models.py`, `service.py`, `store.py`, `js_render.py` |
| `origin/` | Report-only origin-IP finder behind a CDN or WAF | `models.py`, `service.py`, `sources.py`, `validate.py`, `store.py`, `dns.py` |
| `reporting/` | Engagement recording and report generation | `models.py`, `store.py`, `service.py`, `recorder.py`, `findings.py`, `html_report.py`, `csv_report.py`, `charts.py`, `outage.py`, `i18n.py` |
| `solvers/` | Pre-flight challenge solver registry and adapters | `registry.py`, `headless.py` |
| `subdomains/` | Subdomain reconnaissance: scanner, dataset, and export | `models.py`, `scanner.py`, `service.py`, `store.py`, `dataset.py`, `importers.py`, `sources.py`, `dns.py` |
| `waf_bypass/` | Independent catalog of WAF bypass methods | `models.py`, `store.py`, `seeds.py`, `apply.py`, `flare.py`, `tspd.py` |
| `utils.py` | Shared logger, user-agent pool, kill switch, and helpers | single module |

## `core/` — the engine

`core/` is the engine. It has no user interface and no attack logic of its own.

| Module group | Contents |
|---|---|
| Run lifecycle | `tester.py` (`LocalLoadTester`), `playbook.py` (phase sequences), `checkpoint.py` (state persistence) |
| Configuration | `config.py` (typed Pydantic models), `validator.py` (dry-run checks), `vector_defaults.py` (canonical vector defaults) |
| Statistics | `stats.py` (`StatsCollector`), `endpoint_stats.py` (per-path tracker), `metrics.py` (Prometheus export) |
| Rate and load | `tokenbucket.py`, `governor.py` (global caps), `pacing.py` (jitter), `slo.py` (closed-loop knee search) |
| HTTP infrastructure | `proxy.py`, `proxy_harvest.py`, `proxy_validate.py`, `proxy_service.py`, `cookiejar.py`, `tls.py`, `tls_profile.py`, `ja3.py`, `browser_transport.py` |
| Packet emission | `emit.py` (thread helpers), `emit_shards.py` (multi-process emission), `packet.py` (field helpers), `frag6.py` (IPv6 fragmentation) |
| Reconnaissance | `discovery.py` (HTML crawler), `mutation_probe.py`, `origin_hunt.py` (report-only), `edge_probe.py` |
| UDP reflectors | `reflector.py`, `reflector_harvest.py`, `reflector_validate.py`, `reflector_service.py`, `shodan_harvest.py` |
| Spoof sources | `spoof_source.py`, `spoof_service.py` |
| WAF detection | `waf_detector.py`, `waf_db.py` (generated), `waf_signatures.py` (user rules) |
| Other | `health.py` (canary verdicts), `scope_guard.py` (fail-closed scope), `body_gen.py`, `adaptive_targeting.py`, `comparison.py`, `clearance_warmup.py`, `logging.py`, `self_update.py`, `teams_store.py` |

The `LocalLoadTester` orchestrates the run. It consumes a typed `AttackConfig`, runs pre-flight checks, and starts one vector per enabled entry. See [Engine Pipeline](engine.md).

## `vectors/` — the attack modules

`vectors/` holds the engine modules that send traffic. The term "vector" means one attack engine module in this documentation.

The package follows a small hierarchy.

- `AttackVector` in `base.py` is the abstract base.
- `BaseHTTPVector` in `base_http.py` shares HTTP behavior.
- `SlowSocketVector` in `base.py` shares threaded slow-socket behavior.
- Concrete vectors subclass one of the three.

Each concrete module has one class and one job. `http_flood.py` has `AdvancedHTTPFlood`, `udp.py` has `UDPStorm` and `UDPAmplification`, and `http_flow.py` has the `HTTPFlowPlayer`. See [Vector Architecture](vectors.md) and the [vector overview](../attack-vectors/overview.md).

## `distributed/` — controller and agent

`distributed/` runs the same engine from more than one machine.

- `controller.py` accepts agents, runs a benchmark phase, and slices the config by measured capacity.
- `agent.py` connects to the controller and streams statistics.
- `benchmark.py` measures per-vector capacity.

The controller falls back to a local `LocalLoadTester` when no agent connects.

## `presets/` — profiles

`presets/` supplies five built-in profiles: `quick-health`, `cdn-bypass`, `brute-force`, `stealth`, and `api-stress`. The seeds live in `seeds.py`. Users manage their own profiles through `~/.avalanche/presets.json`.

## `ui/` — interfaces

`ui/` is the only layer that touches the user.

- `cli.py` parses the command line and builds the config dict.
- `setup.py` is the interactive wizard.
- `web_dashboard.py` serves the web app and the live statistics endpoint.
- `dashboard_controller.py` owns one `LocalLoadTester` run started from the browser.
- `daemon.py` exposes a Unix-socket control plane.
- `scan.py` runs the recon and pipeline scan commands.

### The frontend

The `frontend/` directory holds a Vue 3 application. It is built with Vite and TypeScript. The compiled output lives in `ui/web/dist/` and is served by `ui/web_dashboard.py`. End users do not need Node.js. Frontend developers rebuild the bundle from `frontend/` and commit the output.

## `reporting/` — engagements and reports

`reporting/` records runs and renders reports.

- `store.py` keeps a SQLite metadata store for engagements, runs, and artifacts.
- `service.py` (`EngagementService`) is the facade used by the CLI, dashboard, and report API.
- `recorder.py` writes one JSON line per second for a run.
- `html_report.py`, `charts.py`, and `csv_report.py` build the report artifacts.
- `findings.py` and `outage.py` derive findings and outage intervals from run telemetry.

## Reconnaissance packages

Four packages support pre-attack reconnaissance. None of them sends attack traffic.

- `subdomains/` scans subdomains and stores results in a local dataset.
- `endpoints/` discovers and saves endpoint lists for a target.
- `origin/` finds the real origin behind a CDN or WAF and reports candidates only.
- `cookies/` captures and stores WAF challenge cookies for replay.

The `discovery/` package provides the shared passive sources that `subdomains/` and other features reuse. `campaigns/` groups targets into named workspaces.

## Bypass and solver support

`waf_bypass/` is a catalog of methods that modify HTTP vector behavior. Each method carries parameters that `apply.py` writes into the vector config before a run. `cookies/` captures the challenge cookies those methods need.

`solvers/` is the challenge solver registry. Providers such as `headless`, `flare`, and `self_hosted` resolve to adapters that share one interface.

## Related pages

- [Architecture](overview.md)
- [Developer guide](../developer/overview.md)
- [Configuration reference](../reference/config-reference.md)
