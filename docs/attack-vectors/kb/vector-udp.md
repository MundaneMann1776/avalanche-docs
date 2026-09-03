---
title: "UDP attacks (vector: udp)"
description: The udp vector runs the plain UDP storm and the UDP amplification attacks against reflector endpoints.
---

# UDP attacks (vector: `udp`)

The `udp` vector is the engine module for raw UDP datagram traffic at OSI
layer 4. It produces the plain UDP Flood storm and the five amplification
attack types: NTP Amplification, SSDP Amplification, Memcached
Amplification, Chargen Amplification, and DNS Amplification. Use Avalanche
only against systems you own or have written permission to test.

## When to use

Use `udp_flood` to saturate a UDP service or the link in front of it. It
works for authorized resilience tests of DNS, NTP, VoIP, gaming, and other
UDP-based services. The storm fills the channel with datagrams. It does not
need root.

Use the amplification family when a target consumes UDP and you can supply
a validated reflector pool. A reflector is a third-party server that answers
a small request with a large reply. Avalanche sends the small request with
the target address as the source, so the large reply lands on the target.
This multiplies the traffic the attacker must send. Use amplification only
for authorized assessments, because third-party reflectors carry the reply
traffic.

## How it works

The vector has two engine classes in `src/avalanche/vectors/udp.py`. The
tester selects the class from one config key. When `reflector_file` is
empty, it starts `UDPStorm`. When the file is set, it starts
`UDPAmplification` instead.

`UDPStorm` sends continuous datagrams to one target. A worker opens a UDP
socket, picks a payload, and sends it to the resolved target IP and port.
The engine clamps any payload size to the legal UDP range. The kernel picks
an ephemeral source port unless you configure `src_port_min` and
`src_port_max`. When you enable `dont_fragment`, the engine caps payload
size at 1,400 bytes so the datagram fits under the common 1,500-byte MTU.

The storm can move worker threads into child processes. Set
`process_workers` to 2 or more. Each child builds its own storm slice and
pushes counter deltas to the parent once per second. This mode exists
because the Python GIL limits a single process. The reflector path
(`UDPAmplification`) always uses threads. `ShardGroup` in
`src/avalanche/core/emit_shards.py` owns the child processes. Children start
with the `spawn` method, never `fork`. When the platform refuses the
process semaphores, the storm falls back to in-process threads and logs a
warning.

`UDPAmplification` loads `ip:port:protocol` lines from the reflector file
into a `ReflectorPool`. The protocol field is one of `dns`, `ntp`, `cldap`,
`ssdp`, `memcached`, or `chargen`. Before the run, the vector UDP-probes
every reflector and keeps the responders as the live set. Each worker picks
a live reflector at random and sends the matching protocol probe.

Without `amplify_spoof`, the worker sends the probe through a normal socket
and reads any reply to measure the amplification ratio. With
`amplify_spoof`, the worker builds a Scapy packet that carries the target
address as the IPv4 source and sends it to the reflector. The spoofed path
needs root and the Scapy library. The spoof path honors `dont_fragment`,
`bad_checksum`, and the `src_port_min`/`src_port_max` range. The non-spoof
path ignores these keys.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| UDP Flood | L4 | Plain storm, no reflector. Set `reflector_file` empty. |
| NTP Amplification | L4 | Select `ntp` reflectors in the file. Probe: mode-7 monlist-style request. |
| SSDP Amplification | L4 | Select `ssdp` reflectors. Probe: M-SEARCH discovery request. |
| Memcached Amplification | L4 | Select `memcached` reflectors. Probe: `stats` request. |
| Chargen Amplification | L4 | Select `chargen` reflectors. Probe: single-byte RFC 864 trigger. |
| DNS Amplification | L7 | Select `dns` reflectors. Probe: DNS ANY query for `example.com`. |

The amplification engine does not expose one mode per attack. The protocol
comes from the reflector file lines, so the file must contain only the
protocol you want to test. The engine also amplifies through `cldap`
reflectors, but the dashboard catalog has no separate CLDAP attack type.
Use the other five protocols when you need a catalog attack type.

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `enabled` | true | Start the UDP vector when the run begins. |
| `workers` | 2 | Number of worker threads that send datagrams. |
| `payload_size` | 8192 | Base datagram payload size in bytes for the storm. Valid 1 to 65507. |
| `payload_mode` | random | Storm content mode: `random`, `pattern`, `zero`, or `ascii`. |
| `payload_bytes` | None | Fixed payload size. Overrides `payload_size` and size jitter. Valid 1 to 65507. |
| `payload_min` | None | Lower bound for uniform payload size. Needs `payload_max`. Valid 1 to 65507. |
| `payload_max` | None | Upper bound for uniform payload size. Needs `payload_min`. |
| `src_port_min` | None | Lower bound of the random source-port range. Valid 1 to 65535. |
| `src_port_max` | None | Upper bound of the random source-port range. Valid 1 to 65535. |
| `dport_rotation` | false | Cycle destination ports per datagram instead of the fixed target port. |
| `dport_list` | [53, 123, 161, 389, 1900] | Ports the storm cycles when `dport_rotation` is on. |
| `dont_fragment` | false | Set the don't-fragment bit. Caps payload size at 1,400 bytes. |
| `bad_checksum` | false | Send an intentionally wrong IPv4 header checksum. Spoof path only. |
| `random_payload` | false | Use fresh random payload bytes each datagram instead of the cached pool. |
| `size_jitter_pct` | 0 | Percent spread of the payload size around `payload_size`. Valid 0 to 100. |
| `timing_jitter_ms` | 0 | Uniform jitter, in milliseconds, added to the inter-datagram delay. Valid 0 to 5000. |
| `reflector_file` | None | Path to the reflector pool. Setting it switches the storm to amplification. |
| `amplify_spoof` | false | Spoof the target address as the UDP source toward reflectors. Needs root and Scapy. |
| `process_workers` | 0 | Child processes for the storm. 0 uses threads. Valid 0 to 16. |

Both engine classes read the same config keys, but each key shapes only
the path that consumes it. `payload_mode`, `payload_bytes`, `payload_min`,
`payload_max`, `random_payload`, and `size_jitter_pct` shape storm
datagrams only. The amplification path sends fixed, protocol-valid probe
payloads, so those keys have no effect there. `process_workers` applies to
the storm only. In amplification, `dont_fragment` sets the DF bit on both
paths. `bad_checksum` and `src_port_min`/`src_port_max` act on the Scapy
spoof path only; the non-spoof `sendto` path uses the kernel source port.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--udp N` | Start the UDP vector with `N` workers. |
| `--udp-payload-size BYTES` | Storm payload size. Default 8192, max 65507. Clamped to 1,400 with DF on. |
| `--reflector-file PATH` | Path to the amplifier list. Each line: `ip:port:proto`. Enables amplification. |
| `--amplify-spoof` | Spoof the target IPv4 as the UDP source toward reflectors. Needs root and Scapy. |
| `--scan-reflectors` | Probe each reflector once, print an amplification table, and exit. |
| `--harvest-reflectors` | Fetch resolver lists, probe candidates, and write a validated pool. |
| `--harvest-only` | With `--harvest-reflectors`, write candidates and exit before probing. |
| `--probe-only PATH` | Probe an existing candidates file and write a validated pool. |
| `--reflector-out PATH` | Validated pool output. Default `~/.avalanche/reflectors/reflectors.txt`. |
| `--candidates-out PATH` | Harvest candidates output. Default `~/.avalanche/reflectors/candidates.txt`. |
| `--max-per-proto N` | Cap candidate count per protocol before probing. |
| `--probe-repeats N` | Probes per reflector. Default 3. A reflector passes with 2 of 3. |
| `--probe-timeout SEC` | Per-probe UDP timeout. Default 2.0 seconds. |
| `--factor-<proto> F` | Minimum amplification factor per protocol, for example `--factor-dns 10`. |

## Modifiers

The engine consumes these modifier keys for the UDP vector. The dashboard
shows them per attack type. `udp_flood` exposes the full packet-field set.
The five amplification attacks expose only the field controls that act on
the spoofed path.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Spreads the inter-datagram delay. |
| Size Jitter | `size_jitter_pct` | Varies storm payload size. No effect on amplification. |
| Don't Fragment | `dont_fragment` | Sets the DF bit. Caps storm payloads at 1,400 bytes. |
| Random Payload | `random_payload` | Fresh random storm bytes per datagram. No effect on amplification. |
| Source Port Range | `src_port_min`, `src_port_max` | Random source port per datagram from the range. |
| DPort Rotation | `dport_rotation`, `dport_list` | Cycles storm destination ports. No effect on amplification. |
| Fixed Payload Size | `payload_bytes` | Fixed storm payload size. No effect on amplification. |
| Payload Bounds | `payload_min`, `payload_max` | Uniform storm size range. No effect on amplification. |
| Payload Mode | `payload_mode` | Storm content: `random`, `pattern`, `zero`, or `ascii`. No effect on amplification. |
| IP Spoofing | `amplify_spoof` | Spoofed-source amplification. Needs root, Scapy, and a reflector file. |
| Bad Checksum | `bad_checksum` | Wrong IPv4 checksum in the Scapy spoof path only. |

Source Port Range binds a fresh socket for each storm datagram. That costs
socket churn and needs free ports. Leave it off unless you need source-port
variance. Size Jitter has no visible effect while Random Payload is also on.

## Requirements

::: warning
The `icmp`, `syn`, `rawip`, and spoofed amplification paths need root raw
sockets. Start Avalanche with sudo to use them.
:::

- `amplify_spoof` needs root and the Scapy library.
- The amplification family needs a reflector file with `ip:port:protocol`
  lines. The pool must be validated from the network that will send the
  traffic.
- The plain storm needs no root and no optional library.
- Harvesting reflectors with `--harvest-reflectors` needs a `SHODAN_API_KEY`
  environment variable for the five non-DNS protocols. Without a key, the
  pipeline builds a DNS-only pool. The DNS directory source needs no key.
- Reflector pools go stale. Revalidate the pool 24 to 48 hours before an
  engagement. A stale pool silently reduces amplification strength.

## Example

```bash
avalanche -t example.test --udp 4 --udp-payload-size 1400
```

Start a plain UDP storm with 4 workers. The target service and its port
come from `-t` and `-p`. To rotate across common UDP ports, enable DPort
Rotation in the dashboard or a config file. The CLI exposes only the
payload size and the reflector controls.

Amplification example, run as root:

```bash
sudo avalanche -t example.test -p 53 --reflector-file ~/.avalanche/reflectors/reflectors.txt --amplify-spoof
```

The reflector file selects the protocol. Keep only `dns` reflectors in the
file for DNS Amplification. Revalidate the pool from the machine that sends
the traffic. Test `--amplify-spoof` on the VPS early, because some hosting
providers filter spoofed source addresses (BCP38).

## Related pages

- [Attack Vectors overview](../overview.md)
- [Layer 4 (TCP/UDP) attacks](../layer4.md)
- [Vector Reference](../reference.md)
- [Reflector pipeline](../../infrastructure/reflectors.md)
