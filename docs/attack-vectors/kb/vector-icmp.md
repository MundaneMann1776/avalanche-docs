---
title: "ICMP attacks (vector: icmp)"
description: How the icmp vector floods a target with ICMP echo requests and its fragment, smurf, and ping-of-death modes.
---

# ICMP attacks

The `icmp` vector sends raw ICMP echo requests with Scapy. It produces the
ICMP Flood, IP/ICMP Fragmented, Smurf Attack, and Ping of Death attack
types. The vector works at OSI layer 3, the network layer. Use Avalanche
only against systems you own or have written permission to test.

## When to use

Use the vector to test how a network device or a host copes with a high rate
of ICMP echo requests. A router, a firewall, or a server can saturate its
control plane when the requests arrive faster than it can answer.

The four attack types fit different tests:

- ICMP Flood checks basic echo handling under load.
- IP/ICMP Fragmented checks how the device reassembles fragmented packets.
- Smurf Attack checks a subnet that answers directed broadcasts.
- Ping of Death checks reassembly of an oversized packet.

The vector targets a host or an IP address. For smurf mode, the target is
the directed broadcast address of a subnet that you control. The source
address you spoof is the address that receives the replies.

## How it works

The `ICMPFlood` class in `vectors/icmp.py` extends `AttackVector` from
`vectors/base.py`. Each worker builds one echo request and sends it with
Scapy's `send` function. The vector does not open a normal socket.

Over IPv4, the packet is an ICMP echo request with type 8 and code 0. Over
IPv6, the vector sends an ICMPv6 echo request, which is type 128. The
`ip_version` key selects the family. A value of 6 changes the packet shape.

The echo payload has a base size of 64 bytes. It repeats the letter `X`
unless `random_payload` is on, in which case the payload is random bytes.
`size_jitter_pct` varies the payload size around the base by a percentage.

The worker waits a random time between 0.02 and 0.15 seconds after each
packet. `timing_jitter_ms` adds more random delay on top of that wait. Each
packet must pass the resource governor before the vector sends it.

Three boolean keys select the special modes. `fragment` splits each packet
into IPv4 fragments. `smurf` spoofs the source address of each echo.
`ping_of_death` builds one oversized fragmented echo.

In smurf mode, the source address comes from `smurf_src` when you set it.
Otherwise it comes from the spoof pool or a random public IPv4 address.
The target must be a directed broadcast address for the amplification to
happen.

In ping-of-death mode, the payload is fixed at 65,508 bytes. After the IPv4
header, the reassembled packet is 65,516 bytes. That is one byte over the
IPv4 maximum of 65,515. The vector sends the payload as fragments so that
the stack attempts the reassembly.

`frag_size` sets the fragment payload size for both fragment mode and
ping-of-death mode. The minimum is 8 bytes. The vector rounds the value down
to a multiple of 8. Offsets use 8-byte units, as the IP fragmentation
specification requires.

The IPv6 path cannot run every mode. Smurf needs an IPv4 directed broadcast.
Ping of death depends on IPv4 reassembly limits. Fragmenting IPv6 needs
extension headers. Over IPv6, the vector disables these modes and logs a
warning. `bad_checksum` also corrupts only the IPv4 header, so the vector
skips it over IPv6.

The TTL, DSCP, ECN, IP flags, and IP options knobs apply to IPv4 packets.
Over IPv6, DSCP and ECN map to the traffic-class field, and `hop_limit`
sets the hop limit. `ttl_min` and `ttl_max` have no effect over IPv6.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| ICMP Flood | L3 | Plain echo flood. Default mode; fragmentation is off. |
| IP/ICMP Fragmented | L3 | Set `fragment=true`; the preset also sets `frag_size=24`. |
| Smurf Attack | L3 | Set `smurf=true`; spoof the source with `smurf_src`. |
| Ping of Death | L3 | Set `ping_of_death=true`; the payload is fixed at 65,508 bytes. |

The dashboard presets select these modes through the attack-type selector.
On the command line, `--icmp-fragment`, `--icmp-smurf`, and `--icmp-pod`
turn the modes on.

## Configuration

The vector reads these keys from its config section. The typed model is
`IcmpVectorConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `1` | Number of packet-sending threads. |
| `ip_version` | `4` | IP family: `4` or `6`. A value of 6 sends ICMPv6 echoes. |
| `hop_limit` | `64` | IPv6 hop limit. Range 1 to 255. IPv6 only. |
| `ttl_min` | `None` | Lower bound of the random IPv4 TTL. Needs `ttl_max`. |
| `ttl_max` | `None` | Upper bound of the random IPv4 TTL. Needs `ttl_min`. |
| `dscp_min` | `None` | Lower bound of the random DSCP value. Range 0 to 63. |
| `dscp_max` | `None` | Upper bound of the random DSCP value. Range 0 to 63. |
| `ecn_randomize` | `False` | Randomize the ECN bits of each packet. |
| `ip_id_mode` | `None` | IP ID behavior: `random`, `fixed`, or `increment`. |
| `ip_reserved_flag` | `False` | Set the reserved bit in the IPv4 flags field. |
| `dont_fragment` | `False` | Set the don't-fragment bit on IPv4 packets. |
| `bad_checksum` | `False` | Send a wrong, non-zero IPv4 header checksum. |
| `random_payload` | `False` | Fill the payload with random bytes instead of `X`. |
| `ip_options` | `[]` | IPv4 header options: `record_route`, `timestamp`, `nop`, `eol`. |
| `fragment` | `False` | Split each IPv4 packet into fragments. |
| `frag_size` | `24` | Fragment payload size in bytes. Minimum 8. |
| `smurf` | `False` | Smurf mode: spoof the source of each echo request. |
| `smurf_src` | `None` | Source address to spoof in smurf mode. The default is a random public IP. |
| `ping_of_death` | `False` | Ping-of-death mode: oversized fragmented echo. |
| `spoof_ranges_file` | `None` | Path to the CIDR file for spoof sources. |
| `size_jitter_pct` | `0` | Vary the payload size by up to this percentage. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between packets. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--icmp N` | Enable the vector with `N` workers. |
| `--icmp-fragment` | Split ICMP packets into IPv4 fragments. |
| `--icmp-frag-size N` | Set the fragment payload size in bytes. The default is 24. |
| `--icmp-smurf` | Smurf mode: echo request with a spoofed source. |
| `--icmp-smurf-src IP` | Source address to spoof. The default is a random public IP. |
| `--icmp-pod` | Ping-of-death mode: oversized fragmented echo. |
| `--spoof-ranges-file PATH` | CIDR file used for ICMP spoof sources. |

## Modifiers

The dashboard exposes these modifiers for the ICMP attack types.

| Modifier | Config key | Effect |
|---|---|---|
| Fragmentation | `fragment`, `frag_size` | Split each packet into IPv4 fragments. |
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between packets. |
| Size Jitter | `size_jitter_pct` | Vary the echo payload size. |
| TTL Randomization | `ttl_min`, `ttl_max` | Randomize the IPv4 TTL per packet. |
| Don't Fragment | `dont_fragment` | Set the don't-fragment bit. |
| Random Payload | `random_payload` | Send random payload bytes. |
| DSCP Randomization | `dscp_min`, `dscp_max` | Randomize the DSCP field. |
| ECN Randomization | `ecn_randomize` | Randomize the ECN bits. |
| IP ID Mode | `ip_id_mode` | Set the IP ID behavior per packet. |
| IP Reserved Flag | `ip_reserved_flag` | Set the reserved bit. |
| Bad Checksum | `bad_checksum` | Corrupt the IPv4 header checksum. |
| IP Options | `ip_options` | Add IPv4 header options. |

The matrix lists two exceptions for Ping of Death. Fragmentation has no
effect because the attack always fragments. Size Jitter has no effect
because the payload is fixed at 65,508 bytes.

Source spoofing is implicit to the smurf preset. There is no IP Spoofing
switch for the `icmp` vector. The smurf mode always spoofs the source.

::: warning
Don't Fragment combined with Fragmentation creates a crafted packet. The
packet carries both the DF bit and the more-fragments bit. That combination
does not follow RFC 791 semantics. Leave one of the two modifiers off.
:::

## Requirements

The vector needs root access and Scapy. It writes raw IP packets, which the
operating system allows only for a privileged process. Start Avalanche with
sudo.

::: warning
Without root, Scapy raises a permission error and the vector disables
itself. Without Scapy installed, the vector logs a warning and sends
nothing. The failure is silent otherwise.
:::

Smurf mode needs a subnet that answers directed broadcasts. Most modern
networks disable directed broadcast. Test smurf mode only on a subnet that
you control and that you know answers.

The vector does not need a reflector file or an optional Python library.
The IPv6 path needs a target with a resolvable AAAA record.

## Example

```bash
sudo avalanche -t example.test --icmp 4 -d 60
```

This command floods `example.test` with plain ICMP echo requests for 60
seconds. Four workers send the packets. Replace `example.test` with the IP
address or hostname of the system you test.

For ping of death against the same target:

```bash
sudo avalanche -t example.test --icmp 4 --icmp-pod -d 30
```

For smurf mode, target the directed broadcast address of a subnet you own
and set the address you want to test:

```bash
sudo avalanche -t 203.0.113.255 --icmp-smurf --icmp-smurf-src 203.0.113.7 -d 30
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 3 (network) attacks](../layer3.md)
- [TCP SYN flood and related attacks (vector: syn)](./vector-syn.md)
- [Raw IP protocol attacks (vector: rawip)](./vector-rawip.md)
- [Safety and authorized use](../../user-guide/safety.md)
