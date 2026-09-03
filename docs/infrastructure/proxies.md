---
title: Proxy Pipeline
description: Build and use the managed HTTP and SOCKS proxy pool.
---

# Proxy Pipeline

The proxy pipeline builds the managed pool of online proxies. HTTP runs use
this pool to rotate their egress. The pool lives at
`~/.avalanche/proxies/proxies.txt`.

The pipeline has a harvest stage and a validate stage. A later check stage
re-probes an existing pool. The dashboard runs all three. The command line
does the same.

## The lifecycle

The pipeline moves proxies through clear stages.

1. Harvest. Avalanche downloads candidate lines from public proxy lists.
2. Normalize. Avalanche cleans each line to `scheme://ip:port`.
3. Validate. Avalanche probes each candidate against a validation URL.
4. Write. Avalanche writes the passing entries to the pool file.
5. Use. HTTP runs draw proxies from the pool at runtime.

The pool is atomic. The writer uses a temporary file, then replaces the
target with an OS-level rename. An empty validation never overwrites the
last good pool. When nothing passes, Avalanche keeps the old file.

Files under `~/.avalanche/proxies/`:

| File | Content |
| --- | --- |
| `candidates.txt` | Harvested candidates, before probing |
| `proxies.txt` | The validated proxy pool |
| `proxies-report.json` | Validation summary and per-proxy results |

## The managed pool

The URL sources are public lists. The defaults include proxyscrape,
proxy-list.download, and GitHub-hosted lists such as monosans and TheSpeedX.
You can supply your own source list in the dashboard. Leave the field empty
to keep the defaults.

Avalanche caps the harvest at 5000 candidates by default. Each source
contributes to the total until the cap is reached.

The validation URL defaults to `https://www.gstatic.com/generate_204`. This
endpoint returns no body, so it uses little bandwidth during probing. You can
change it in the dashboard.

Avalanche probes HTTP and HTTPS proxies through aiohttp. A proxy passes when
the validation URL answers with a status under `500`.

Avalanche probes SOCKS4 and SOCKS5 proxies with a raw CONNECT handshake.
Each handshake sends a no-auth greeting, then connects to the validation
host. A successful connect marks the proxy valid.

SOCKS proxies behave differently inside a run. The aiohttp transport cannot
route SOCKS. The browser transport routes them instead. A run does not
re-probe SOCKS entries at load time. It queues them and relies on live
quality scoring. The engine logs this behavior.

## Quality scoring

Each proxy gets a rolling quality record. The record tracks successes,
failures, latency, blocks, and challenges.

Avalanche combines these into a score in the range `0` to `1`. A higher score
is better. The score weighs three factors:

- Success rate. This contributes 55 percent.
- Block pressure. This contributes 25 percent.
- Latency. This contributes 20 percent.

Challenge pressure damps the final score. An egress stuck in perpetual
challenges carries no clean traffic. A healthy solvable pattern barely moves
the score.

The score is not a pass or fail test. It is a ranking. The engine uses it to
decide which proxies it keeps.

## Blocks versus challenges

The pool treats blocks and challenges as separate signals.

A block is a hard refusal. A blocked egress never passes a request. Avalanche
counts it in the block counter.

A challenge is a verification page. A challenged egress passes a request once
it holds valid clearance. Avalanche counts it in the challenge counter. A
solver can clear the page and restore the egress.

This distinction matters for eviction. A proxy that only receives challenges
never carries clean traffic. Avalanche evicts it. A proxy that passes after a
solver clears its challenge stays.

## Sticky sessions

By default, a worker borrows a proxy, uses it for one request, and returns
it. The `--proxy-sticky` flag changes this. A sticky worker keeps one proxy
for the whole run.

The pool tracks a binding per worker. The worker reuses that proxy until
eviction or shutdown. Evicted proxies drop their worker bindings. Sticky
behavior also applies to the `http_flow` vector.

Sticky removes the per-request proxy rotation. Use it when a target expects
a consistent source per session.

## Auto-eviction

The pool evicts a proxy when its quality falls too low.

A proxy needs at least 10 results before eviction. Weaker evidence cannot
trigger a decision. The pool drops a proxy when:

- Its score falls below `0.3`.
- The challenge count reaches `90` percent of its successes and failures.

Eviction is total. The pool removes the proxy from the queue and releases its
sticky bindings. It never returns the proxy to the pool.

## Warm-up snapshot

A run can solve clearance before the workers start. The `--warm-clearance`
flag triggers this. `--warm-cap` controls the count. The default is 10.

The pool serves a warm-up snapshot for this step. The snapshot is a read-only
view. It does not consume proxies or change their order. The solver clears
the top live egresses first. A failed warm-up leaves those egresses cold for
live scoring.

## Auto-refresh

A proxy pool grows stale. Staleness is six hours by default. A pool older
than this is stale.

The dashboard can auto-refresh. When enabled, a run on a stale pool starts a
background refresh. The refresh re-probes the managed file. New proxies merge
into the pool as they validate. The default refresh interval is 60 seconds.

Your scope matters. A pool is per-machine. Build or refresh the pool on the
machine that will send traffic.

## The settings page

The dashboard Settings page has a **Proxies** section. It shows the state of
the managed pool. It provides these controls:

- **Update & Harvest**. Fetch the configured sources, probe, and write the
  pool.
- **Check pool**. Probe the existing pool without fetching new candidates.
- **Stop**. Cancel a running harvest.
- **Export pool**. Download `proxies.txt`.
- **Clear**. Remove the candidates, the pool, and the report.

The section also edits the source list and the validation URL. A checkbox
turns the stale-pool auto-refresh on or off. A text area imports pasted
proxy lines; choose **Replace candidates** or **Append candidates**, then
press **Import & validate**.

The dashboard reaches the same service through JSON endpoints under
`/api/proxies`. The service and the CLI share the same core functions, so a
harvest behaves the same either way.

## Command line

The proxy pipeline runs from the command line. The operations are:

| Flag | Purpose |
| --- | --- |
| `--harvest-proxies` | Fetch public lists, probe, and write the pool |
| `--scan-proxies` | Probe one pool file and print a status table |
| `--proxy-file PATH` | The proxy file for an HTTP run or scan |
| `--proxy-probe-only PATH` | Probe a candidates file and write the pool |
| `--proxies-out PATH` | Validated pool output path (`~/.avalanche/proxies/proxies.txt`) |
| `--proxy-candidates-out PATH` | Candidates output path (`~/.avalanche/proxies/candidates.txt`) |
| `--use-proxies` | Enable proxy rotation in an HTTP run |
| `--proxy-sticky` | Keep one proxy per worker |
| `--fetch-proxies` | Download public lists into the proxy cache before validation |

Harvest and validate public lists in one command.

```bash
avalanche --harvest-proxies
```

Print a summary for an existing pool.

```bash
avalanche --scan-proxies --proxy-file ~/.avalanche/proxies/proxies.txt
```

Validate a candidates file that you already have.

```bash
avalanche --harvest-proxies --proxy-probe-only ~/.avalanche/proxies/candidates.txt
```

An HTTP run uses the managed pool automatically. Enable proxy rotation, and
leave the proxy file unset.

```bash
avalanche -t example.com --use-proxies --http 200
```

You can pin sticky sources per worker.

```bash
avalanche -t example.com --use-proxies --proxy-sticky --http 200
```

You can fetch fresh lists before a run.

```bash
avalanche -t example.com --use-proxies --fetch-proxies --http 200
```

Public lists are volatile. A proxy can die between a harvest and a run.
Validation proves reachability from this machine only, against the
configured URL, at harvest time. Build or refresh the pool on the machine
that will send traffic.

## HTTP run integration

HTTP runs read the proxy pool at setup. When `use_proxies` is set, the run
checks for the managed file. It uses that file when no explicit file is on
disk.

The run builds a `ProxyPool` from the file. It loads and validates the file
at startup. It refreshes from a managed file when configured. During the run,
each worker acquires a proxy, sends the request, reports the result, and
returns the proxy to the queue.

The engine records per-proxy results into the same quality system described
above. Blocks and challenges feed the counters. This keeps the pool healthy
across runs.

## Authorized use

Use Avalanche only against systems you own or have written permission to
test. External proxies are third-party infrastructure. Sending traffic
through them still counts as load against your target. Never use a run
against a system that is not in scope.

## Related pages

- [Infrastructure overview](overview.md). The three managed pools.
- [Reflector Pipeline](reflectors.md). The UDP amplifier pool.
- [Spoof Sources](spoof-sources.md). Spoofed source ranges.
- [Attack vectors overview](../attack-vectors/overview.md). The HTTP
  attacks that consume this pool.