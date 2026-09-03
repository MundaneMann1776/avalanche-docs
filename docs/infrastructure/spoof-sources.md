---
title: Spoof Sources
description: Manage the CIDR ranges that raw vectors use for spoofed sources.
---

# Spoof Sources

Avalanche keeps a managed store of CIDR ranges. The raw packet vectors use
these ranges as spoofed source addresses. The `syn`, `rawip`, and `icmp`
vectors draw from this store.

Spoofed sending needs raw sockets. Start Avalanche with `sudo` to use it.

::: danger
Spoofing is only lawful in authorized environments. You are forging the
source address of network traffic. This is illegal against any system that
you do not own or do not have written permission to test. Avalanche is an
intra-company tool for authorized use only. Verify your written permission
before you enable spoofing.
:::

Use Avalanche only against systems you own or have written permission to
test.

## The source store

The store lives under `~/.avalanche/spoof/`. Ranges can come from four
sources:

- BGP. Avalanche fetches the APNIC BGP route table.
- CAIDA. You import the CAIDA Spoofer CSV as a file.
- Random. Avalanche generates random public `/24` ranges.
- Manual. You paste or import a plain CIDR list.

Every range has a source tag and an enabled flag. The store keeps the
records in `ranges.jsonl`. Only the enabled ranges reach `ranges.txt`. The
raw vectors load this file.

Files under `~/.avalanche/spoof/`:

| File | Content |
| --- | --- |
| `ranges.jsonl` | One JSON record per range with source and enabled flag |
| `ranges.txt` | The enabled ranges that raw vectors load |
| `spoof-report.json` | Generation time and per-source counts |

## The settings page

The dashboard Settings page has a **Spoof sources** section. It shows the
store totals and the per-source counts. It provides these controls:

- **Harvest BGP table**. Fetch the APNIC table and import the ranges.
- **Stop**. Cancel a running harvest.
- **Export**. Download `ranges.txt`.
- **Clear**. Remove the ranges.
- **Generate**. Create random public `/24` ranges. The default count is
  1000. The range accepts 1 to 50000.
- **Import**. Paste plain CIDRs or a CAIDA Spoofer CSV, then import.

A table lists every range. Each row shows the CIDR, the source, the add
time, and an enabled checkbox. You can remove a single row. JSON endpoints
under `/api/spoof` expose the same operations.

## Normalization

Avalanche normalizes every range before it stores it.

Only public IPv4 ranges pass. The filters drop private, loopback,
link-local, multicast, reserved, and unspecified space. They also drop
CGNAT and the documentation networks.

The BGP table parser skips host routes. It drops entries with a `/32`
prefix. IPv6 entries are accepted from manual lists. A picked source always
matches the packet family that the vector asks for.

Ranges are merged. Adjacent and overlapping ranges collapse into one. The
store caps the total at 100000 ranges.

## Import and harvest commands

Use `--harvest-spoof-sources` to fetch the BGP table.

```bash
avalanche --harvest-spoof-sources
```

Import a plain CIDR list. The `--spoof-import` flag parses one range per
line and appends it to the manual source.

```bash
avalanche --spoof-import ranges.txt
```

For a CAIDA Spoofer CSV, import it from the dashboard. Choose the **CAIDA
Spoofer CSV** format in the import field. The CLI import does not switch
parsers.

Generate random public `/24` ranges.

```bash
avalanche --spoof-generate 1000
```

Print the store summary.

```bash
avalanche --scan-spoof-sources
```

The pipeline flags are:

| Flag | Purpose |
| --- | --- |
| `--harvest-spoof-sources` | Fetch the BGP table and write the ranges |
| `--spoof-generate N` | Generate N random public `/24` ranges |
| `--spoof-import PATH` | Import a plain-text range file |
| `--scan-spoof-sources` | Print the managed store summary |
| `--spoof-ranges-file PATH` | The range file for `syn`, `rawip`, and `icmp` |
| `--spoof-out PATH` | Spoof ranges output path, default `~/.avalanche/spoof/ranges.txt` |
| `--spoof-max-ranges N` | Maximum managed spoof ranges, default 100000 |

The harvest and import commands write to the managed location under
`~/.avalanche/spoof/`. The store caps the total at 100000 ranges.

## Spoofing with raw vectors

Spoofing is a per-vector behavior. Enable it per run.

For the `syn` vector, set the spoof flag. The CLI form is `--syn-spoof`.
For the `udp` amplification family, spoofed sends use `--amplify-spoof`.
For `rawip`, set the `spoof` value in its configuration.

The vectors need a range file. The `spoof_ranges_file` config key points to
it. From the command line, pass `--spoof-ranges-file`. Pass that flag on the
same line as the vector flags.

```bash
sudo avalanche -t example.com --syn 100 --syn-spoof --spoof-ranges-file ~/.avalanche/spoof/ranges.txt
```

The pool loads the file and picks one random source per packet. It picks a
random range first, then a random address inside it. The family of the pick
matches the vector. A vector that runs over IPv6 uses the IPv6 ranges.

Without a range file, a spoofing `syn` or `rawip` vector still forges
sources. It uses a random public IPv4 per packet instead of the pool.

The ICMP smurf mode resolves its source in order. It uses the configured
`smurf_src` value when set, else a pick from the pool, else a random public
IPv4.

The vectors refuse to spoof without root. They also refuse without the Scapy
library. In those cases they log a warning and send with normal source
addresses.

Spoofed amplification has an extra mode. `--amplify-spoof` sends the UDP
query with the target as the source toward the reflectors. It needs root
and Scapy.

::: warning
Raw sockets need root. Start the command with `sudo`. A run without root
silently disables spoofing and sends from the host address instead.
:::

## Honest limits

No range list can prove spoofability. Whether a spoofed packet arrives
depends on the egress network and the path. Ingress filtering, described in
BCP 38, blocks spoofed packets on many networks.

A range that appears in the BGP table may still not be spoofable from your
network. Test spoofed sends early, from the machine that will run the
attack. A CAIDA entry is a hint, not a guarantee.

## Related pages

- [Infrastructure overview](overview.md) — the three managed pools.
- [Proxy Pipeline](proxies.md) — the HTTP and SOCKS proxy pool.
- [Reflector Pipeline](reflectors.md) — the UDP amplifier pool.
- [Attack vectors overview](../attack-vectors/overview.md) — the raw
  vectors and spoofed amplification.
