---
title: "DNS Water Torture (vector: dns)"
description: How the dns vector sends unique random-label queries to force resolver recursion.
---

# DNS Water Torture

The `dns` vector runs the DNS Water Torture attack. The attack sends a high
rate of unique DNS queries, each with a random subdomain label. The attack
works at OSI layer 7, the application layer. Use Avalanche only against
systems you own or have written permission to test.

## When to use

Use the vector when you want to test how a recursive resolver handles a
stream of cache-miss queries. The vector targets resolver CPU, the
recursion budget, and the cache.

Good test targets include:

- Your own recursive resolver.
- A staging DNS service you manage.
- An authoritative server you want to stress through recursion.

The vector differs from DNS Amplification. DNS Amplification is a `udp`
reflector protocol that needs a reflector file. See the attack catalog for
the difference. This vector sends direct queries from the client.

## How it works

The `DnsWaterTorture` class in `vectors/dns.py` extends `AttackVector`
directly. It is a high-rate query vector, not a slow-hold vector. Each
worker thread builds one query, sends it, and repeats. The worker opens a
fresh datagram socket for each UDP send.

Every query uses a fresh random subdomain. The worker builds a query name
from 1 to 4 random hex labels followed by the base domain. Each label is 8
to 12 characters. The resolver cannot serve the query from cache, because
it has never seen the name before. Each query is a cache miss.

A cache miss forces the resolver to recurse. The resolver walks the
authority chain toward the authoritative server, consuming CPU on the way.
Enough misses exhaust the resolver's recursion budget, fill its cache with
junk, and push the query rate past its limits.

The worker rotates the query type. The possible types are A, AAAA, ANY,
NS, and TXT. The query carries the recursion-desired flag.

The query name honors the RFC 1035 limits. Each label stays at or below 63
bytes. The total name stays at or below 253 bytes. When the base domain is
long, the worker drops labels until the name fits.

The default transport is UDP. One datagram carries one query. With the TCP
transport, the worker frames the query with a 2-byte length prefix and
sends it over a fresh connection. The TCP connection uses a 5-second
timeout.

Every send records one request in the stats collector. The error path uses
exponential backoff. When sends fail in a row, the worker backs off before
it retries. Each query asks the resource governor for a token before the
send.

The class default is 2 workers. Between queries, a worker waits only the
timing-jitter window. The base delay is zero.

### Worker sharding

Set `process_workers` to 2 or more to run the flood in child processes.
Each child carries a slice of the workers. When child processes are not
available, the vector logs a warning and falls back to in-process threads.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| DNS Water Torture | L7 | Random-label queries against `base_domain`. Set `transport=udp` or `transport=tcp`. |

## Configuration

The vector reads these keys from its config section. The typed model is
`DnsVectorConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `2` | Number of query threads. Range 1 to 1000. |
| `process_workers` | `0` | Number of child processes. 0 means in-process threads; 2 or more shards the workers. Range 0 to 16. |
| `transport` | `udp` | Query transport: `udp` or `tcp`. |
| `base_domain` | `None` | Domain the random labels attach to. When unset, the target host applies. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between queries. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--dns N` | Enable the vector and set the worker count. |
| `--dns-transport {udp,tcp}` | Set the query transport. The default is `udp`. |
| `--dns-domain DOMAIN` | Set the base domain. The default is the target host. |

Pass `-p 53` as the target port for a standard DNS resolver. The CLI does
not change the port for this vector.

## Modifiers

The dashboard exposes one toggle for DNS Water Torture.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the pause between queries. |

## Requirements

The vector needs no optional library and no root access. It uses plain
sockets. UDP queries use a datagram socket per send. TCP queries open a
short connection per query.

::: warning
The vector needs a working recursive resolver. When the resolver does not
recurse, the queries still arrive but the attack loses its effect. Confirm
the resolver recurses before you start the run.
:::

::: tip
Do not confuse this vector with DNS Amplification. Amplification sends
queries to open resolvers to bounce large replies at a victim. It runs on
the `udp` vector and needs a reflector file.
:::

## Example

```bash
avalanche -t resolver.example -p 53 --dns 50 --dns-domain example.test -d 300
```

This command runs 50 query workers against `resolver.example` on port 53.
Each query uses a random label under `example.test`.

For TCP transport:

```bash
avalanche -t resolver.example -p 53 --dns 50 --dns-transport tcp --dns-domain example.test -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [UDP amplification attacks (vector: udp)](./vector-udp.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
