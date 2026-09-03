---
title: Infrastructure
description: The three managed pools that supply egresses, amplifiers, and spoof sources for runs.
---

# Infrastructure

Avalanche manages three pools of network resources. Each pool stores its
data under `~/.avalanche/`. Each pool is per-machine.

The pools are:

- [Proxy Pipeline](proxies.md). A validated set of HTTP, SOCKS4, and SOCKS5
  proxies for HTTP runs.
- [Reflector Pipeline](reflectors.md). A validated set of UDP amplifiers for
  the amplification attack types.
- [Spoof Sources](spoof-sources.md). A store of CIDR ranges for spoofed
  source addresses.

## How the pools feed runs

Each pipeline follows the same shape. Avalanche harvests candidates from
public sources. It validates each candidate with real probes. It writes only
the passing entries to an atomic pool file. A run reads that file when you
enable the feature.

The settings page of the web dashboard controls every pool. It can run a
harvest, check the pool, import lists, and export the result. The command
line exposes the same operations.

Validation happens on the machine that runs the pool. A pool proves
reachability from that machine only. Build or revalidate each pool on the
machine that will send traffic.

## Authorized use

Use Avalanche only against systems you own or have written permission to
test. The pools feed stress traffic. Never point a run at a system that is
not in scope.

## Data storage

All pools keep their files under `~/.avalanche/`. The table shows the main
paths.

| Pool | Directory |
| --- | --- |
| Proxy pipeline | `~/.avalanche/proxies/` |
| Reflector pipeline | `~/.avalanche/reflectors/` |
| Spoof sources | `~/.avalanche/spoof/` |

You can relocate the data directory with the `AVALANCHE_DATA_DIR`
environment variable.

## Related pages

- [Proxy Pipeline](proxies.md). Build and use the proxy pool.
- [Reflector Pipeline](reflectors.md). Build and use the amplifier pool.
- [Spoof Sources](spoof-sources.md). Manage ranges for spoofed sources.
- [Reconnaissance overview](../reconnaissance/overview.md). Find targets
  and endpoints.
- [Attack vectors overview](../attack-vectors/overview.md). See the attack
  types that consume these pools.
