---
title: Engine Pipeline
description: The run lifecycle inside LocalLoadTester, from scope gate to final report.
---

# Engine Pipeline

This page describes the run lifecycle inside `LocalLoadTester` in `core/tester.py`. It is the sequence every run follows, whether a CLI run, a dashboard run, or a distributed run.

`LocalLoadTester` is the single orchestrator. It receives a typed `AttackConfig` and a plain dict. It builds vectors, runs background tasks, and stops them again.

## Startup order

The constructor runs the first checks before any socket opens.

1. The scope gate runs. `enforce_scope()` compares the target against the scope allow-list and raises before any socket exists. The check is fail-closed when `runtime.require_scope` is set.
2. The checkpoint path defaults to `~/.avalanche/checkpoint.json`.
3. A `StatsCollector` is created.
4. A `ResourceGovernor` is created from `limits`, when a typed config exists.
5. A `MetricsExporter` is created when `runtime.metrics_port` is set. The exporter starts later in `run()`.
6. A `WebDashboard` is created when `runtime.web_dashboard_port` is set. The dashboard starts later in `run()`.
7. When `runtime.resume` is set, the tester restores state from the checkpoint file.
8. The cookie file loads. See the next section.

## Cookie file load

The tester replays captured cookies when the HTTP or flow vector is enabled.

The load uses the default capture store at `~/.avalanche/cookies.json`, unless `cookie_file` overrides it. A record for the target must exist. Cookies land in the shared `CookieStore` under the scope `target::direct`, with a TTL derived from the record expiry. The load skips silently when no store or record exists.

## The typed config and its validation

`main.py` coerces every config dict through `config_from_dict()` before the run starts. That call builds an `AttackConfig` and drops unknown keys. Config keys are `snake_case`.

`ConfigValidator` in `core/validator.py` validates a typed config without sending traffic. It runs DNS and TCP checks, proxy and reflector file checks, flow-directory parsing, TLS and Scapy availability checks, and range checks for TTL, DSCP, IP-ID mode, and TCP options. Errors mean the test would likely fail at startup. Warnings are non-fatal. The `--dry-run` and `--validate` flags run this validator and print a Rich table.

The scope gate also runs in the constructor of the tester. It is the first thing in `LocalLoadTester.__init__`.

## Pre-flight solver gate

`_preflight_solver_gate()` blocks a run when `runtime.solver_mode` is set but no valid capture exists.

The gate reads the same cookie store as the cookie load. It needs a non-expired record for `target::direct` when an HTTP-family vector is enabled. When no record exists, the gate can solve through the provider in two cases: `manual` mode with the `flare` provider, or `self_hosted` mode. The gate saves the capture and verifies the replay. A solve that fails verification raises a `RuntimeError`. A `solver_buffer_seconds` delay follows a successful gate.

Modes `none` and `tspd` return immediately. TSPD solving happens mid-run inside the flood vector. Warm-up mode for proxy-pool runs sleeps and returns.

## Warm clearance

When `runtime.warm_clearance` is on, the HTTP vector warms each egress before workers start. The map in `_warm_provider()` chooses the provider from the solver mode. Mode `headless` maps to the headless provider, and mode `self_hosted` maps to the self-hosted provider. The `byhand` provider never warms egresses.

The tester passes the warm flags into the HTTP vector config. `clearance_warmup.py` then solves the challenge once per egress and seeds the cookie store.

## Vector construction

`_build_vectors_from_config()` turns every enabled vector entry into one object.

The tester appends one vector per enabled name. It merges the per-vector config with shared handles: `cookie_store`, `governor`, and `scheme`. The HTTP vector also receives the warm-up flags and, on resume, the saved proxy scores and token bucket. Optional vectors check their library first. `http2` requires the `h2` library, and `http3` requires `aioquic`. The tester skips the vector with a warning when the library is missing.

The UDP vector branches on `reflector_file`. A reflector file produces a `UDPAmplification` vector with a loaded `ReflectorPool`; otherwise the tester builds a `UDPStorm`.

## Pre-run warnings

Several probes warn without failing the run.

- `_warn_raw_worker_fd_limits()` warns when raw-socket worker counts risk the `FD_SETSIZE` limit.
- `_warn_if_tcp_unreachable()` warns when a TCP vector cannot reach the target port.
- `_warn_if_h2_unsupported()` warns when an HTTP/2 vector targets a TLS port that does not negotiate `h2`.

A blocked target would otherwise look like a vector bug.

## Endpoint auto-discovery

`_maybe_auto_discover()` runs before vectors start. It needs `runtime.auto_discover` and an enabled HTTP vector.

The method builds an `EndpointDiscoverer` that crawls the target with BFS. It reads the crawl depth and URL cap from the runtime config. Paths with a status below 400 become `extra_endpoints` on the HTTP vector. An optional Playwright renderer harvests JavaScript-rendered pages when `runtime.discover_js` is set. Auto-discovery results feed the flood.

The report-only origin hunt (`_maybe_find_origin()`) runs next. It aggregates certificate-transparency and DNS evidence and logs ranked candidates. It never injects results into a vector. In `find_origin_only` mode, it requests shutdown after the report.

## Mutation probe

`_maybe_probe_mutations()` runs a bounded encoding-and-method matrix against the HTTP endpoints. It needs `runtime.probe_mutations` and an enabled HTTP vector.

The probe diffs each variant against a clean baseline and classifies it with the WAF detector. Winners are cached under `~/.avalanche/probes/`. On later runs the cache skips the probe. Bypass paths join the HTTP `extra_endpoints` list. With `probe_mutations_only` set, the tester requests shutdown after caching.

## The canary loop

The canary is the independent health probe. It runs only when `runtime.canary_path` is set.

`_canary_loop()` probes the path on its own session with no bypass headers. The probe URL is the path against the local target, or an absolute URL when the path starts with `http://` or `https://`. Each probe picks headers from a random browser profile, so it looks like a fresh browser. When `runtime.canary_proxy` is set, the probe leaves from a clean egress that is not the attacking IP.

Every probe result goes through `classify()` in `core/health.py`. The verdict is one of five states.

| Verdict | Meaning |
|---|---|
| `UP` | The origin answers inside the good time band. |
| `SLOW` | The origin answers, but over the good time band. |
| `BLOCKED` | A WAF or rate limit refused the probe. The origin is not proven down. |
| `PROBE_ERROR` | The canary path failed before it could prove target health. |
| `DOWN` | A real origin failure, or no answer from a clean vantage point. |

Time bands follow the Google TTFB standard. Good is 800 ms or less; 1800 ms or more is poor. The loop records each probe into the stats collector and logs state changes between degraded and recovered.

## Kill switch

The kill switch is the global stop file `/tmp/aval_stop`. `check_killswitch()` in `utils.py` returns true when the file exists.

The main run loop polls the kill switch every 250 ms. On detection it logs `Kill-switch detected - aborting`, stops the run, and breaks. Slow-socket vectors check the file directly in their worker loop. High-rate packet vectors use `KillswitchPoller` in `core/emit.py` to check at most once every 100 packets. A run stops at most 100 packets after the file appears.

Create the file to stop a run.

```bash
touch /tmp/aval_stop
```

## SLO ramp

SLO mode is a closed-loop knee search. `_prepare_slo_if_enabled()` validates the preconditions before vectors build their buckets. SLO mode needs a canary path, an enabled HTTP vector, and no playbook. When a precondition fails, the tester raises `SLOConfigError`.

The HTTP rate starts at `runtime.slo_start_rps`. `SLOController` raises the offered rate while the canary verdict stays healthy and holds at the breaking point. A `BLOCKED` or `PROBE_ERROR` verdict pauses the ramp because it measures the edge, not the origin. The controller appends a timeline for the report. See [SLO mode](../controls/slo.md).

## The run loop

`run()` starts the metrics exporter and the dashboard, then calls `_start_and_drive()`.

Vectors start in sequence when no playbook drives them. Four background tasks run during the run.

| Task | Interval | Work |
|---|---|---|
| History tick | 1 s | Sample RPS and bandwidth into ring buffers; feed the recorder, governor, and metrics exporter |
| Cookie prune | 30 s | Drop expired cookie domains from the shared store |
| Checkpoint autosave | 30 s | Write the checkpoint file |
| Canary | per interval | Probe target health |

The main loop checks the kill switch, the playbook state, and the duration every 250 ms. Headless CLI runs get a status line every 3 s.

## Phase driving for playbooks

A playbook is a sequence of `PlaybookPhase` objects. `_playbook_drive_phases()` advances them in order.

`set_phase()` starts and stops vectors per phase. It splits the aggregate RPS across the vectors by weight. The HTTP and flow vectors scale their token bucket to the target rate. The ramp interpolates bucket rates over 5 s at 10 Hz and clamps to the phase duration when the phase is short. The run stops when the last phase finishes.

SLO mode and a playbook cannot run together. Both drive the rate.

## Teardown

`_teardown()` releases every resource. It runs from a `finally` block, so an interrupt during startup still cleans up.

The teardown order is:

1. Stop the SLO controller.
2. Cancel the playbook, autosave, history, prune, and canary tasks.
3. Save a final checkpoint.
4. Close the canary session.
5. Stop the metrics exporter and web dashboard.
6. Stop every vector with a 5 s timeout per vector.

## Checkpoint and resume

`CheckpointManager` in `core/checkpoint.py` writes versioned state as JSON.

The autosave loop writes every 30 s. The payload holds the cookie store, proxy quality scores, token buckets, a stats snapshot, and a scrubbed copy of the config. Secrets such as `dist_secret`, `webhook_url`, and `solver_api_key` never enter the checkpoint. The write is atomic: the manager writes a temp file, sets mode 600, and replaces the target.

Set `runtime.resume` to resume a run. The tester loads the checkpoint file and restores the cookie store, stats, proxy scores, and token buckets. A target mismatch logs a warning but does not fail. See [Checkpoint and resume](../controls/checkpoint.md).

## Final report

`_final_report()` prints the summary and writes the report. The report is a JSON document at `~/.avalanche/report_<timestamp>.json`.

The report holds the target, duration, availability evidence, SLO evidence, and a cleaned stats snapshot. The cleaning strips all-zero history arrays and vectors with no traffic. An optional `runtime.export_json_path` copies the report, and `runtime.webhook_url` receives it as a POST. When engagement recording is on, the recorder closes the run with the report.

## Related pages

- [Architecture](overview.md)
- [Vector Architecture](vectors.md)
- [Canary and kill switch](../user-guide/canary-killswitch.md)
- [SLO mode](../controls/slo.md)
- [Checkpoint and resume](../controls/checkpoint.md)
