---
title: Data Files and Stores
description: The files and stores Avalanche keeps under the data directory.
---

# Data Files and Stores

Avalanche keeps its state under the per-machine data directory. The default
is `~/.avalanche`. It stores cookies, presets, checkpoints, reports, and the
forged-source pools. This page lists each file, its purpose, its format, and
who reads and writes it.

Use Avalanche only against systems you own or have written permission to
test.

::: tip
You can redirect the data directory. Set the `AVALANCHE_DATA_DIR`
environment variable to another path. The engine then reads and writes every
file from that directory instead of `~/.avalanche`.
:::

## The directory layout

The data directory holds flat files and a few subdirectories.

```
~/.avalanche/
├── checkpoint.json
├── presets.json
├── cookies.json
├── waf_bypass.json
├── settings.json          (mode 600)
├── teams.json             (mode 600)
├── endpoints.json
├── subdomain_dataset.db   (SQLite)
├── origin_dataset.json
├── origin_scans.json
├── probes/                (mutation-probe winners)
├── proxies/
│   ├── proxies.txt
│   ├── candidates.txt
│   └── proxies-report.json
├── reflectors/
│   ├── reflectors.txt
│   ├── candidates.txt
│   └── reflectors-report.json
├── spoof/
│   ├── ranges.txt
│   ├── ranges.jsonl
│   └── spoof-report.json
├── waf_signatures/        (custom signature YAMLs)
├── engagements/           (reporting store)
└── logs/                  (JSON run logs)
```

## checkpoint.json

The checkpoint file stores the run state for resume. It carries the state
between runs.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/checkpoint.json` |
| Format | JSON, versioned |
| Purpose | Persist cookies, proxy scores, token buckets, stats, and the scrubbed config. |
| Writer | The engine autosaves it every 30 seconds. |
| Reader | The engine hydrates it with `--resume`. |

The file stores the cookie jar in its own `cookie_store` field. The copy of
the config inside the file is scrubbed. The scrub drops the cookie jar, the
distributed secret, the webhook URL, and the solver API key from that copy.
The file uses mode 600.

## presets.json

The presets file stores the user profiles.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/presets.json` |
| Format | Versioned JSON, written atomically |
| Purpose | Persist the saved attack profiles. |
| Writer | The preset store and the CLI. |
| Reader | The preset store and the CLI. |

The five built-in presets seed into this file on first use. The preset store
completes each profile against the canonical vector defaults.

## cookies.json

The cookies file stores the captured WAF cookies.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/cookies.json` |
| Format | Versioned JSON, written atomically |
| Purpose | Replay captured cookies for a target. |
| Writer | The cookie capture, import, and solve commands. |
| Reader | The HTTP vectors and the cookie verification commands. |

Entries are keyed by `fqdn::egress`. A capture carries its expiry. The store
drops expired captures when it reads the file. You can point the CLI at
another file with `--cookie-file`.

## waf_bypass.json

The WAF bypass file stores the user-managed bypass methods.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/waf_bypass.json` |
| Format | Versioned JSON, written atomically |
| Purpose | Persist the WAF bypass methods and their parameters. |
| Writer | The bypass store and the CLI. |
| Reader | The bypass store and the CLI. |

The engine seeds the curated catalog into this file on first use. The file
prunes methods removed from the catalog. It never touches user-created
records.

## settings.json

The settings file holds the per-machine secrets and solver configuration.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/settings.json` |
| Format | JSON, mode 600 |
| Purpose | Store the Shodan API key and the solver defaults. |
| Writer | The settings store. |
| Reader | The settings store and the service layers. |

The file holds keys such as `shodan_api_key`, `solver_api_key`,
`solver_base_url`, `solver_flare_url`, and `solver_self_url`. The proxy and
reflector services store their settings here too. The file uses mode 600 so
only the owner can read it. API responses expose masked suffixes only.

## teams.json

The teams file stores the team profiles.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/teams.json` |
| Format | JSON, mode 600 |
| Purpose | Persist the multi-team profiles. |
| Writer | The team store. |
| Reader | The team store and the capture flow. |

The shape is `{"teams": [{"id", "name", "created_at"}], "active_id"}`.
Exactly one team is active at a time. The file uses mode 600.

## endpoints.json

The endpoints file stores saved endpoint lists.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/endpoints.json` |
| Format | Versioned JSON, written atomically |
| Purpose | Persist the saved endpoint lists per FQDN. |
| Writer | The endpoint store and discovery. |
| Reader | The endpoint store and the engine. |

The shape is `{"version": 1, "lists": [...]}`. The engine loads a saved list
for a target when `endpoint_source` selects it.

## subdomain_dataset.db

The subdomain dataset is a SQLite database.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/subdomain_dataset.db` |
| Format | SQLite, in-place migration |
| Purpose | Cache discovered subdomains so repeat scans are instant and safe from third-party rate limits. |
| Writer | The subdomain scan and import commands. |
| Reader | The subdomain service and the origin finder. |

Each row holds the domain, name, sources, IPs, and the first and last time it
was seen. Rows older than 7 days are not treated as fresh. The service
refetches a stale row from the network.

## origin_dataset.json

The origin dataset caches completed origin scans.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/origin_dataset.json` |
| Format | JSON, keyed by domain, written atomically |
| Purpose | Serve repeat origin hunts without re-querying the passive sources. |
| Writer | The origin finder. |
| Reader | The origin finder. |

Each record holds the stored time and the candidate list. Records older than
7 days are not treated as fresh.

## origin_scans.json

The origin scans file stores the saved origin-IP scans.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/origin_scans.json` |
| Format | Versioned JSON, written atomically |
| Purpose | Keep the history of saved origin scans for later review. |
| Writer | The origin scan store. |
| Reader | The origin scan store. |

The shape is `{"version": 1, "scans": [...]}`.

## probes directory

The probes directory stores the mutation-probe winners.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/probes/` |
| Format | One JSON file per target |
| Purpose | Persist probe winners for injection into the HTTP vector. |
| Writer | The mutation probe. |
| Reader | The HTTP vector. |

The file name uses the form `<target>_<port>.json`.

## The proxies directory

The proxy pipeline keeps three files under `~/.avalanche/proxies/`.

| File | Purpose | Format |
| --- | --- | --- |
| `proxies.txt` | The validated proxy pool. | Text, one `scheme://ip:port` per line, with a commenting header. |
| `candidates.txt` | The harvested proxy candidates. | Text, one proxy token per line, with a provenance header. |
| `proxies-report.json` | The validation report. | JSON with the summary and per-proxy results. |

The service writes the pool atomically and preserves the last good file when
nothing passes. The CLI flags set each path. Defaults are
`~/.avalanche/proxies/proxies.txt` and `~/.avalanche/proxies/candidates.txt`.
The pool becomes stale after 6 hours.

The shared settings file also stores the proxy settings. These include the
source list, the validation URL, and the auto-refresh flag.

## The reflectors directory

The reflector pipeline keeps three files under `~/.avalanche/reflectors/`.

| File | Purpose | Format |
| --- | --- | --- |
| `reflectors.txt` | The validated reflector pool. | Text, one `ip:port:proto` per line, with a commenting header. |
| `candidates.txt` | The harvested reflector candidates. | Text, one `ip:port:proto` per line, with a provenance header. |
| `reflectors-report.json` | The validation report. | JSON with the summary and per-reflector results. |

The service writes the pool atomically and preserves the last good file when
tests fail. The default paths are
`~/.avalanche/reflectors/reflectors.txt` and
`~/.avalanche/reflectors/candidates.txt`. The pool becomes stale after 24
hours.

## The spoof directory

The spoof-source pipeline keeps three files under `~/.avalanche/spoof/`.

| File | Purpose | Format |
| --- | --- | --- |
| `ranges.txt` | The enabled spoof ranges. | Text, one CIDR per line, with a provenance header. |
| `ranges.jsonl` | The canonical spoof-source store. | JSONL, one JSON record per range. |
| `spoof-report.json` | The harvest report. | JSON with the generated time and source counts. |

The vectors load `ranges.txt`. The store keeps CRUD state in `ranges.jsonl`.
The default path is `~/.avalanche/spoof/ranges.txt`.

## report_*.json

The engine writes a stand-alone JSON report at the end of each run.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/report_<unix-seconds>.json` |
| Format | JSON |
| Purpose | Capture the final summary of one run. |
| Writer | The run engine. |
| Reader | Operators and reports. |

The report holds the target, port, timestamp, duration, availability, SLO
results, and the cleaned stats. The `--export-json` flag writes the same
report to another path.

## The engagements directory and reporting store

The reporting store records engagements, runs, scopes, and report artifacts.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/engagements/` |
| Format | SQLite store in `engagements.sqlite3`, with per-run files |
| Purpose | Record engagements, scopes, runs, and report artifacts. |
| Writer | The engagement service and run recorder. |
| Reader | The engagement service, the dashboard, and reports. |

The SQLite store holds tables for `engagements`, `scopes`, `runs`, `reports`,
and `outage_intervals`. Each run writes its recorder data under
`~/.avalanche/engagements/<engagement>/runs/<run_id>/`. The recorder writes
`samples.jsonl` as the per-second sample stream and `report.json` as the
final report. The CSV and HTML report artifacts are stored under
`~/.avalanche/engagements/<engagement>/reports/`.

The engagement name defaults to `unassigned` when a run has no engagement.
The SQLite store lives at
`~/.avalanche/engagements/engagements.sqlite3`.

## The logs directory

The engine writes a JSON run log to the logs directory.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/logs/` |
| Format | Newline-delimited JSON |
| Purpose | Capture structured run logs. |
| Writer | The logger, when file logging is enabled. |
| Reader | Operators and diagnostics. |

The run-log file is always machine-parseable, regardless of the console log
mode. File logging is off by default.

## waf_signatures directory

The WAF signatures directory holds user-managed signature files.

| Item | Value |
| --- | --- |
| Path | `~/.avalanche/waf_signatures/` |
| Format | One YAML file per signature |
| Purpose | Extend the shared WAF detection with custom signatures. |
| Writer | The CLI and the signature store. |
| Reader | The signature store, the WAF detector, and every detector path. |

The engine validates each file on load and publishes it through the process
registry. A signature can carry an embedded `tests` block. The
`--validate-waf-signatures` flag validates every file and runs the fixtures.
The default directory is `~/.avalanche/waf_signatures`.

See the [CLI Flags](cli-flags.md) page for the signature commands.

## The kill-switch file

The kill switch is a global stop file.

| Item | Value |
| --- | --- |
| Path | `/tmp/aval_stop` |
| Format | Empty marker file |
| Purpose | Stop a running test immediately. |
| Writer | You, the operator. |
| Reader | The run engine. |

Create the file to stop a run. The engine checks for it during the run. The
kill switch is a global control, not per-machine data. See the
[Canary and Kill Switch](../user-guide/canary-killswitch.md) page.

## Related pages

- [CLI Flags](cli-flags.md) — the flags that set the store paths.
- [Configuration](../user-guide/configuration.md) — how the files map to config keys.
- [User Guide Overview](../user-guide/overview.md) — the whole user guide.