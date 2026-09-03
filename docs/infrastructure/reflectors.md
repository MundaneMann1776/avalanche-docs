---
title: Reflector Pipeline
description: Build and use the managed pool of UDP amplifiers.
---

# Reflector Pipeline

The reflector pipeline builds the managed pool of UDP amplifiers. The `udp`
vector uses this pool for the amplification attack types. The pool lives at
`~/.avalanche/reflectors/reflectors.txt`.

An amplifier is a server that answers a small UDP query with a large reply.
This ratio is the amplification factor. In spoofed mode, Avalanche sends the
query with the target address as the source. The amplifier then sends its
reply to the target.

The pipeline has a harvest stage and a validate stage.

## The lifecycle

1. Harvest. Avalanche downloads candidate endpoints from public sources.
2. Normalize. Each endpoint becomes `ip:port:proto`.
3. Validate. Avalanche probes each endpoint with a UDP packet.
4. Write. Only the passing endpoints reach the pool file.
5. Use. The `udp` vector draws amplifiers from the pool.

Files under `~/.avalanche/reflectors/`:

| File | Content |
| --- | --- |
| `candidates.txt` | Harvested endpoints, before probing |
| `reflectors.txt` | The validated pool, ready for `--reflector-file` |
| `reflectors-report.json` | Provenance, thresholds, and per-protocol summary |

Every file starts with a provenance header. The header records the sources,
the generation time, and the per-protocol counts.

The pool is atomic. The writer replaces the target with an OS-level rename.
An empty validation never overwrites the last good pool.

## Candidate sources

The harvest stage has two source families.

DNS resolvers come from public lists. These lists update twice a day and
need no API key. The default sources are the pingproxies public DNS
directory plus two GitHub resolver lists.

The other protocols come from the Shodan search API. Shodan supplies NTP,
CLDAP, SSDP, memcached, and chargen candidates. Shodan membership gives 100
query credits per month. One page per protocol costs one credit. A default
harvest with a key uses five credits.

Set the key with `--shodan-key` or the `SHODAN_API_KEY` environment
variable. The dashboard stores it in `~/.avalanche/settings.json` with
600 permissions. The UI shows only the last four characters. The key never
appears in logs or reports.

Without a key, the pool is DNS-only.

The engine supports these amplification protocols: dns, ntp, cldap, ssdp,
memcached, and chargen. The registry also adds qotd, snmp, tftp, rip,
netbios, mdns, coap, wsd, and portmap probes. Each registry probe carries
its own canonical port and factor floor.

Avalanche caps candidates per protocol before probing. The defaults are:

| Protocol | Cap |
| --- | --- |
| dns | 5000 |
| ntp | 2000 |
| cldap | 2000 |
| ssdp | 2000 |
| memcached | 1500 |
| chargen | 1500 |

## Validation rules

Avalanche probes every candidate with the exact payload that the engine
sends. It does not invent a new payload for validation. A reflector that
passes validation will amplify during an attack.

The payload matches the protocol. DNS gets an ANY query for `example.com`.
SSDP gets an M-SEARCH. Memcached gets a `stats` request. Chargen gets one
byte. NTP gets a mode-7 style probe.

Avalanche repeats each probe. The default is three probes per candidate. The
amplification factor is the response size divided by the request size. A
probe counts as a pass when the response arrives and meets the protocol
factor floor. A candidate needs two passing probes.

The default floors are:

| Protocol | Minimum factor |
| --- | --- |
| dns | 10 |
| ntp | 50 |
| cldap | 20 |
| ssdp | 3 |
| memcached | 100 |
| chargen | 100 |

The registry probes carry their own floors from the probe table. These
include qotd at 100, snmp at 6.3, and coap at 25.

Override a floor with `--factor-proto PROTO=FACTOR`. The flag is repeatable.

```bash
avalanche --harvest-reflectors --factor-proto coap=30 --factor-proto qotd=150
```

The pool records an honest result. When a protocol returns no live
amplifiers, the report records zero. Avalanche does not fabricate entries.

## Reflector lines

Each reflector line has the form `ip:port:proto`. The optional fourth column
carries builder arguments for a registry probe.

```text
1.2.3.4:161:snmp:max_repetitions=80
```

Supported keys are snmp `community`, `oid`, and `max_repetitions`; wsd
`message_id`; portmap `xid`; netbios and mdns `txid`; and coap `msg_id`.
The other protocols send fixed payloads. Unknown keys are dropped with a
warning.

## How the vector uses the pool

The `udp` vector reads a reflector file at setup. The amplification attack
types require one. In the dashboard, an amplification run fills the file
from the managed pool when none is set. From the command line, pass
`--reflector-file`.

The vector probes the pool before it starts. The health check sends one
probe per amplifier and keeps the responders. A random pick prefers the live
set. When nothing responds, the vector logs the result and uses the full
list. The unspoofed path sends to the reflector and logs the measured
amplification on the reply.

You can re-probe an existing pool with the check action in the dashboard.
The check does not fetch new candidates and spends no Shodan credits.

## The settings page

The dashboard Settings page has a **Reflectors** section. It shows the state
of the pool. It provides these controls:

- **Update & Harvest**. Fetch fresh DNS lists and Shodan results, probe,
  and write the pool. The UI confirms before the run when Shodan credits
  will be spent.
- **Check pool**. Probe the existing pool without fetching or spending
  credits.
- **Cancel**. Cancel a running harvest.

The section stores the Shodan key. The key is per-machine and never leaves
the machine. JSON endpoints under `/api/reflectors` expose the same
operations.

## Command line

The pipeline runs from the command line.

```bash
avalanche --harvest-reflectors
```

This command fetches the DNS directory, queries Shodan when a key is set,
probes every candidate, and writes the pool and report.

Run only the harvest stage.

```bash
avalanche --harvest-reflectors --harvest-only
```

Probe an existing candidates file and write the pool.

```bash
avalanche --probe-only ~/.avalanche/reflectors/candidates.txt
```

Probe an existing pool once and print the results.

```bash
avalanche --scan-reflectors --reflector-file ~/.avalanche/reflectors/reflectors.txt
```

The main flags are:

| Flag | Purpose |
| --- | --- |
| `--harvest-reflectors` | Fetch candidates, probe, and write the pool |
| `--scan-reflectors` | Probe one reflector file and print the results |
| `--reflector-file PATH` | The reflector list for a scan or run |
| `--factor-proto PROTO=FACTOR` | Override a factor floor, repeatable |
| `--max-per-proto N` | Cap candidates per protocol before probing |
| `--probe-repeats N` | UDP probes per reflector, default 3 |
| `--probe-timeout SEC` | Per-probe timeout in seconds, default 2.0 |
| `--shodan-key KEY` | The Shodan API key |

## Validation scope

Validation happens from your machine. The probes measure reachability from
your network at probe time. They cannot predict a different network or a
later moment.

Real-world strength requires real tests. A validated pool is the starting
point, not the proof. Test the amplification from the same machine and
network that will run the attack. Revalidate a pool before an engagement.
Do not reuse a pool from a previous month.

Spoofed amplification adds its own condition. The reflectors must accept a
spoofed source address. Ingress filtering on the reflector network decides
this. No pool file can prove it. Test spoofed sends early and on the actual
egress.

Use Avalanche only against systems you own or have written permission to
test.

## Related pages

- [Infrastructure overview](overview.md). The three managed pools.
- [Proxy Pipeline](proxies.md). The HTTP and SOCKS proxy pool.
- [Spoof Sources](spoof-sources.md). Spoofed source ranges.
- [Attack vectors overview](../attack-vectors/overview.md). The
  amplification attack types.
