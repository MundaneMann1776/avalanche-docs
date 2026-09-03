---
title: Modes of Operation
description: Every way to run Avalanche, from dashboard to distributed agents.
---

# Modes of Operation

Avalanche has several modes of operation. This page explains them and when
to use each one. Use Avalanche only against systems you own or have written
permission to test.

## Run modes

The top-level modes are:

| Mode | Command | Use it for |
| --- | --- | --- |
| Web dashboard | `avalanche` | The primary interface. Plan, start, and watch runs in a browser. |
| Command line | `avalanche -t target ...` | One-line runs and scripting. |
| Interactive wizard | `avalanche --wizard` | Guided configuration. |
| Playbook | `avalanche --playbook file.yml` | Sequenced timed phases. |
| Distributed controller | `avalanche --mode controller ...` | Coordinate agents. |
| Distributed agent | `avalanche --mode agent ...` | Run a load slice on one machine. |
| Daemon | `avalanche --daemon /tmp/avalanche.sock` | Control runs over a Unix socket. |
| Web dashboard only | `avalanche --web-dashboard-only` | Serve the dashboard without a run. |
| One-shot pipelines | `avalanche --harvest-proxies` etc. | Build managed pools and recon data. |

## Web dashboard

A bare `avalanche` command starts the dashboard on port 8787 and opens a
browser. The dashboard is the primary interface. You can configure attacks
with the attack-type selector and modifier switches, start runs, and watch
live charts.

The dashboard binds to `127.0.0.1`. To view a remote run, tunnel the port.

```bash
avalanche
```

## Command line

The command line defines a full run in one line. The `--help` text lists
every flag.

```bash
avalanche -t target.example -p 443 --scheme https --http 200 --http-rps 1000 --bypass-waf
```

The command-line mode reads the [preset](presets.md) baseline when you pass
`--preset`.

## Interactive wizard

The wizard asks for the same settings in a guided flow. It is useful when
you are new to the tool or when you want to review each option.

```bash
avalanche --wizard
```

## Playbook

A playbook sequences attack phases. Each phase runs one configuration for a
set time. See [Playbooks](playbooks.md).

```bash
avalanche --playbook my_playbook.yml
```

## Distributed mode

Distributed mode spreads one test across machines. A controller accepts
agents, benchmarks them, and slices the load by measured capacity. See the
[Distributed section](../distributed/overview.md).

```bash
avalanche --mode controller -t target.example --dist-secret "$SECRET"
avalanche --mode agent --dist-controller controller-host:9753 --dist-secret "$SECRET"
```

## Daemon

The daemon exposes a control plane over a Unix socket. It is useful for
automation. The socket file has mode `0600`.

```bash
avalanche --daemon /tmp/avalanche.sock --daemon-token "$TOKEN"
```

## One-shot pipelines

Several commands do one job and exit. They build or scan the managed pools
and recon data:

- `--harvest-proxies` and `--scan-proxies` build the proxy pool.
- `--harvest-reflectors` and `--scan-reflectors` build the amplifier pool.
- `--harvest-spoof-sources`, `--spoof-generate`, and `--scan-spoof-sources`
  manage spoof ranges.
- `--subdomain-only` runs subdomain discovery.
- `--origin-only` runs the origin-IP finder.
- `--capture-cookie` captures WAF cookies for a target.

See [Reconnaissance](../reconnaissance/overview.md) and
[Infrastructure](../infrastructure/overview.md).

## Next steps

- [Command-Line Interface](cli.md) — the flags in detail.
- [Web Dashboard](dashboard.md) — the browser interface.
- [Safety and Authorized Use](safety.md) — read before a real run.
