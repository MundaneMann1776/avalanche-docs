---
title: Command-Line Interface
description: Build and run Avalanche from one line with flags.
---

# Command-Line Interface

The command line defines a run in one line. Every option has a flag. Run
`avalanche --help` for the complete list. Use Avalanche only against
systems you own or have written permission to test. This page explains the
main flag groups. The [CLI Flags reference](../reference/cli-flags.md)
lists them all.

## Target and connection

The base flags set the target and how Avalanche connects.

| Flag | Meaning |
| --- | --- |
| `-t, --target` | Target hostname or IP. |
| `-p, --port` | Target port. Default 80, or the port from the URL. |
| `--scheme` | `auto`, `http`, or `https`. Default `auto`. |
| `-d, --duration` | Run length in seconds. Default 0, which means until stopped. |

```bash
avalanche -t target.example -p 443 --scheme https -d 60
```

`auto` scheme means HTTPS on ports 443 and 8443, and HTTP elsewhere. You
can also pass a full URL as the target.

## Presets and config files

- `--preset NAME` applies a saved attack profile as the baseline.
- `-c, --config FILE` loads a YAML or JSON config file.
- `--playbook FILE` runs a phased playbook.
- `--wizard` starts the interactive wizard.

Flags you pass override the preset and the config file field by field. See
[Presets](presets.md), [Configuration](configuration.md), and
[Playbooks](playbooks.md).

## Vector flags

Each vector has an enable-and-scale flag and its specific flags. The vector
flags follow one pattern:

```bash
avalanche -t target.example --http 200 --http-rps 1000
avalanche -t target.example --slowloris 30
avalanche -t target.example --syn 4 --syn-flags SA
```

The HTTP flags include:

- `--http N` sets the HTTP concurrency.
- `--http-rps N` sets the target rate. 0 means unlimited.
- `--bypass-waf` enables browser-grade TLS and HTTP/2 fingerprints.
- `--browser-impersonate TARGET` selects a browser profile.
- `--session-sticky`, `--cookie-flood`, `--random-endpoints`, `--hulk`,
  `--graphql` switch the HTTP modes.
- `--use-proxies` routes HTTP through the proxy pool.

The full vector list with flags is in the
[CLI Flags reference](../reference/cli-flags.md). The
[Attack Vectors section](../attack-vectors/overview.md) explains each
vector's behavior.

## Raw-socket vectors

The raw-socket vectors need root. Their flags control packet fields:

```bash
sudo avalanche -t target.example --syn 4 --syn-spoof --syn-flags S
sudo avalanche -t target.example --icmp 2 --icmp-fragment --icmp-frag-size 24
sudo avalanche -t target.example --rawip 2 --rawip-proto 47
```

## Safety flags

- `--dry-run` prints and validates the config. It sends nothing.
- `--validate` validates and reports, then exits.
- `--canary-path PATH` and `--canary-interval SECONDS` tune the canary.
- `--slo` and the `--slo-*` flags enable the closed-loop SLO mode.
- `--compare A B` runs two configs and prints the diff.

```bash
avalanche -t target.example --http 200 --dry-run
avalanche --compare config_a.yaml config_b.yaml
```

## Modes and scale

- `--mode controller` and `--mode agent` start distributed roles.
- `--daemon [SOCKET]` starts the Unix-socket daemon.
- `--web-dashboard [PORT]` starts the dashboard.
- `--web-dashboard-only [PORT]` serves the dashboard without a run.

See [Modes of Operation](modes.md) and
[Distributed Mode](../distributed/overview.md).

## Reconnaissance and pipeline flags

The one-shot pipelines run and exit:

- `--subdomain-only` runs subdomain discovery for a domain.
- `--origin-only` runs the origin-IP finder.
- `--capture-cookie TARGET` captures WAF cookies.
- `--harvest-proxies`, `--scan-proxies` manage the proxy pool.
- `--harvest-reflectors`, `--scan-reflectors` manage the amplifier pool.
- `--harvest-spoof-sources`, `--scan-spoof-sources` manage spoof ranges.

See [Reconnaissance](../reconnaissance/overview.md) and
[Infrastructure](../infrastructure/overview.md).

## Output and logging flags

- `--json-logs` writes logs as JSON.
- `--metrics-port PORT` serves Prometheus metrics.
- `--export-json PATH` exports run data.
- `--debug-tls` adds TLS diagnostics.

## Next steps

- [Configuration](configuration.md) — put the same settings in a file.
- [CLI Flags reference](../reference/cli-flags.md) — every flag.
