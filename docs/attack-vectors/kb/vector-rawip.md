---
title: "Raw IP protocol attacks (vector: rawip)"
description: How the rawip vector floods a target with arbitrary IP protocols and its GRE, ESP, IGMP, and teardrop modes.
---

# Raw IP protocol attacks

The `rawip` vector sends raw IP packets with Scapy. One protocol selector
covers the Other IP Flood, GRE Flood, ESP Flood, and IGMP Flood attack
types. A separate mode produces the Teardrop Attack. The vector works at
OSI layer 3, the network layer. Use Avalanche only against systems you own
or have written permission to test.

## When to use

Use the vector to test how a network device handles traffic in protocols
other than TCP and UDP. Many firewalls and intrusion systems inspect TCP and
UDP closely but pass other protocols with less scrutiny.

The attack types fit different tests:

- Other IP Flood sends an arbitrary IP protocol, with 55 as the preset.
- GRE Flood sends protocol 47, the Generic Routing Encapsulation header.
- ESP Flood sends protocol 50, the Encapsulating Security Payload header.
- IGMP Flood sends protocol 2, an IGMP membership query.
- Teardrop Attack sends overlapping IPv4 fragments.

Run the vector against a router, a firewall, or a host that terminates these
protocols. The IP protocol number must match a protocol that the target
actually processes, or the target drops the packets at once.

## How it works

The `RawIpFlood` class in `vectors/rawip.py` extends `AttackVector` from
`vectors/base.py`. Each worker builds one IP packet and sends it with
Scapy's `send` function. The vector does not open a normal socket.

The `proto` key selects the IP protocol number. The default is 47, the GRE
protocol. The value ranges from 0 to 255. The generic branch sends any
protocol number that the other branches do not handle.

The vector builds the packet differently for each branch. GRE uses Scapy's
`GRE` layer class. ESP uses Scapy's `ESP` layer class. IGMP is crafted as a
raw payload that forms an 8-byte IGMPv2 membership query with type 0x11.
Every other protocol number sends a raw payload of repeated `X` bytes.

`random_payload` fills the generic payload with random bytes. `size_jitter_pct`
varies the payload size around a base of 32 bytes by a percentage.

The teardrop mode bypasses the normal builder. The vector sends two IPv4
fragments of one datagram. The first fragment carries bytes 0 to 799. The
second fragment starts at byte offset 720, so it overlaps the tail of the
first. The classic teardrop arithmetic uses that overlap to confuse the
reassembly logic. The payload is fixed at 1,600 bytes.

Teardrop uses the protocol from `proto`. It runs only over IPv4. The IPv6
path disables teardrop because the mode depends on IPv4 fragmentation
semantics.

Over IPv4, the packet carries the normal IP fields. TTL randomization, DSCP,
ECN, the reserved bit, and IP options come from their config keys. There is
no don't-fragment switch for this vector. With `spoof` on, the source
address comes from the spoof pool.

Over IPv6, the vector sends GRE, ESP, or a generic protocol payload. The
explicit next-header value keeps raw-protocol payloads off the no-next-header
default. `hop_limit` sets the hop limit. The vector disables IGMP over IPv6
because IGMP has no IPv6 analog. It logs a warning and does not start.

`bad_checksum` corrupts the IPv4 header checksum. The Linux raw-socket path
would fill a zero checksum, so the vector writes a fixed wrong value instead.
The corruption applies to both fragments in teardrop mode.

The vector runs its workers as threads. With `process_workers` set to 2 or
more, it runs the workers in child processes instead. Each child re-derives
the spoof state from the config.

The IPv6 path needs a target with a usable AAAA record. Without one, the
vector logs a warning and does not start. Spoofing over IPv6 works only when
the spoof-range file has IPv6 ranges. Without them, the vector warns and
sends unspoofed.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| Other IP Flood | L3 | Generic branch. Set `proto=55` as the preset, or any other protocol number. |
| GRE Flood | L3 | GRE branch. Set `proto=47`. |
| ESP Flood | L3 | ESP branch. Set `proto=50`. |
| IGMP Flood | L3 | IGMP branch. Set `proto=2`. IPv4 only. |
| Teardrop Attack | L3 | Set `teardrop=true`; send overlapping IPv4 fragments. |

On the command line, `--rawip-proto` selects the protocol number and
`--rawip-teardrop` turns the teardrop mode on.

## Configuration

The vector reads these keys from its config section. The typed model is
`RawIpVectorConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `1` | Number of packet-sending threads. |
| `process_workers` | `0` | Shard worker processes. A value of 2 or more uses child processes. |
| `ip_version` | `4` | IP family: `4` or `6`. |
| `hop_limit` | `64` | IPv6 hop limit. Range 1 to 255. IPv6 only. |
| `ttl_min` | `None` | Lower bound of the random IPv4 TTL. Needs `ttl_max`. |
| `ttl_max` | `None` | Upper bound of the random IPv4 TTL. Needs `ttl_min`. |
| `dscp_min` | `None` | Lower bound of the random DSCP value. Range 0 to 63. |
| `dscp_max` | `None` | Upper bound of the random DSCP value. Range 0 to 63. |
| `ecn_randomize` | `False` | Randomize the ECN bits of each packet. |
| `ip_id_mode` | `None` | IP ID behavior: `random`, `fixed`, or `increment`. |
| `ip_reserved_flag` | `False` | Set the reserved bit in the IPv4 flags field. |
| `bad_checksum` | `False` | Send a wrong, non-zero IPv4 header checksum. |
| `random_payload` | `False` | Fill the generic payload with random bytes. |
| `spoof` | `False` | Spoof the source address from the spoof pool. |
| `spoof_ranges_file` | `None` | Path to the CIDR file for spoof sources. |
| `ip_options` | `[]` | IPv4 header options: `record_route`, `timestamp`, `nop`, `eol`. |
| `proto` | `47` | IP protocol number. Range 0 to 255. |
| `teardrop` | `False` | Teardrop mode: send overlapping IPv4 fragments. |
| `size_jitter_pct` | `0` | Vary the generic payload size by up to this percentage. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between packets. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--rawip N` | Enable the vector with `N` workers. |
| `--rawip-proto N` | Set the IPv4 protocol number. The default is 47 (GRE). |
| `--rawip-teardrop` | Teardrop mode: overlapping IP fragments. |
| `--spoof-ranges-file PATH` | CIDR file used for raw-IP spoof sources. |

## Modifiers

The dashboard exposes these modifiers for the raw IP attack types.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between packets. |
| Size Jitter | `size_jitter_pct` | Vary the generic payload size. |
| TTL Randomization | `ttl_min`, `ttl_max` | Randomize the IPv4 TTL per packet. |
| DSCP Randomization | `dscp_min`, `dscp_max` | Randomize the DSCP field. |
| ECN Randomization | `ecn_randomize` | Randomize the ECN bits. |
| IP ID Mode | `ip_id_mode` | Set the IP ID behavior per packet. |
| IP Reserved Flag | `ip_reserved_flag` | Set the reserved bit. |
| Bad Checksum | `bad_checksum` | Corrupt the IPv4 header checksum. |
| Random Payload | `random_payload` | Send random payload bytes. |
| IP Options | `ip_options` | Add IPv4 header options. |

The matrix lists exceptions by branch. GRE, ESP, and IGMP floods carry no
raw payload, so Size Jitter and Random Payload have no effect on them.
Teardrop mode hides Size Jitter: the payload is fixed at 1,600 bytes. The
dashboard filter also hides the IP ID Mode switch for Teardrop Attack. The
engine still reads `ip_id_mode` on the teardrop path when a config file
sets it. Both fragments then share one IP ID from the configured mode.

::: warning
Bad Checksum on the IGMP branch corrupts only the IPv4 header checksum.
The IGMP query checksum stays correct. Do not expect the target to reject
the packet on the IGMP checksum.
:::

## Requirements

The vector needs root access and Scapy. It writes raw IP packets, which the
operating system allows only for a privileged process. Start Avalanche with
sudo.

::: warning
Without root, the vector logs a warning and does not start. Without Scapy
installed, the vector logs a warning and sends nothing. Spoofing is ignored
without root and Scapy.
:::

IP Spoofing uses a spoof-range file when you provide one. Without a file,
the vector still spoofs over IPv4 and picks a random public IP as the
source. Over IPv6, spoofing works only when the file has IPv6 ranges.
Without them, the vector warns and sends unspoofed. `--spoof-ranges-file`
points to the file.

The IGMP branch is IPv4-only. Over IPv6, the vector disables itself because
IGMP has no IPv6 analog. Teardrop mode is also IPv4-only.

The vector does not need a reflector file or an optional Python library. The
IPv6 path needs a target with a usable AAAA record.

## Example

```bash
sudo avalanche -t example.test --rawip 4 --rawip-proto 47 -d 60
```

This command floods `example.test` with GRE packets, protocol 47, for 60
seconds. Four workers send the packets. The protocol number 47 is also the
default, so this command equals `--rawip 4` alone.

For the generic protocol 55 branch:

```bash
sudo avalanche -t example.test --rawip 4 --rawip-proto 55 -d 60
```

For the teardrop attack:

```bash
sudo avalanche -t example.test --rawip 2 --rawip-teardrop -d 30
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 3 (network) attacks](../layer3.md)
- [ICMP attacks (vector: icmp)](./vector-icmp.md)
- [TCP SYN flood and related attacks (vector: syn)](./vector-syn.md)
- [Safety and authorized use](../../user-guide/safety.md)
