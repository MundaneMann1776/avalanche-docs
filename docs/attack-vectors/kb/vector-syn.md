---
title: "TCP SYN flood and related attacks (vector: syn)"
description: How the syn vector sends raw TCP packets with chosen flags and its fragmentation and out-of-state modes.
---

# TCP SYN flood and related attacks

The `syn` vector sends raw TCP packets with Scapy. One packet builder serves
the whole TCP flag family. The `flags` key selects the TCP control flags, so
the vector produces the SYN, Reset, ACK, SARFU, SYN ACK, Push-ACK, and FIN
flood attack types. Two further modes, fragmentation and out-of-state, share
the same builder. The vector works at OSI layer 4, the transport layer. Use
Avalanche only against systems you own or have written permission to test.

## When to use

Use the vector to test how a TCP service copes with a high rate of raw
packets. The packets carry no valid connection state, so a stateful
firewall, a load balancer, or a server must spend resources on each one.

The attack types map to realistic tests:

- TCP SYN Flood opens the connection backlog with half-open connections.
- TCP Reset Flood sends resets that can tear down live sessions.
- TCP ACK Flood and TCP Push-ACK Flood force state lookups.
- TCP SARFU Flood sends a rarely used combination of flags.
- TCP SYN ACK Flood and TCP FIN Flood probe unusual handshake states.
- TCP Fragmentation Flood forces IP reassembly work.
- TCP Out-of-State Flood sends random flags with random sequence numbers.

Run the vector against your own TCP service or an edge device you manage.
The target port matters because the packets address a real TCP port. Set
the port with `-p` or the equivalent URL syntax.

## How it works

The `TCPSynFlood` class in `vectors/syn.py` extends `AttackVector` from
`vectors/base.py`. Each worker builds one TCP packet and sends it with
Scapy's `send` function. The vector sends from a raw socket, not from a
normal connection.

The default flags value is `S`, the SYN flag. That default keeps older
runs unchanged. The valid flag characters are `S`, `A`, `R`, `F`, `P`, `U`,
`E`, and `C`. The flags are Scapy-compatible, so combinations such as `SA`,
`PA`, or `SARFU` all build. An invalid value falls back to `S`.

Each packet picks a random source port from the range 32768 to 65535. The
destination port is the target port. The sequence number is random when
`isn_randomize` is on, which is the default. When it is off, the sequence
number is 0.

In out-of-state mode, the builder ignores `flags`. Each packet picks a
random flag set from a fixed list that includes `R`, `A`, `RA`, `PA`, `FA`,
`SA`, `F`, and `U`. The packet also carries a random acknowledgment number.
This mode sends packets that no valid session would produce.

`random_payload` appends 8 random bytes after the TCP header. `tcp_options`
adds TCP options such as MSS, window scale, and timestamps.

Over IPv4, the packet carries the normal IP fields. TTL randomization,
DSCP, ECN, the don't-fragment bit, and the reserved bit come from their
config keys. With `spoof` on, the source address comes from the spoof pool.
Over IPv6, DSCP and ECN map to the traffic-class field, and the flow label
is random per packet. `hop_limit` sets the hop limit.

Fragmentation splits each packet into IPv4 fragments. The split works on the
serialized payload bytes, so the TCP header and payload stay intact across
Scapy versions. `frag_size` sets the fragment size, with a minimum of 8
bytes. Fragmentation stays IPv4-only.

`bad_checksum` corrupts the IPv4 header checksum. The Linux raw-socket path
would fill a zero checksum, so the vector writes a fixed wrong value instead.
The corruption applies to each fragment when fragmentation is on.

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
| TCP SYN Flood | L4 | Default flags `S`. |
| TCP Reset Flood | L4 | Set `flags=R`. |
| TCP ACK Flood | L4 | Set `flags=A`. |
| TCP SARFU Flood | L4 | Set `flags=SARFU`. |
| TCP SYN ACK Flood | L4 | Set `flags=SA`. |
| TCP Push-ACK Flood | L4 | Set `flags=PA`. |
| TCP FIN Flood | L4 | Set `flags=F`. |
| TCP Fragmentation Flood | L4 | Set `fragment=true`; the preset also sets `flags=S` and `frag_size=24`. |
| TCP Out-of-State Flood | L4 | Set `out_of_state=true`; flags and sequence numbers are random. |

The seven flag attacks share one builder. The flag preset is the only
difference between them. On the command line, `--syn-flags` selects the
combination.

## Configuration

The vector reads these keys from its config section. The typed model is
`SynVectorConfig` in `core/config.py`. The same defaults live in
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
| `dont_fragment` | `False` | Set the don't-fragment bit on IPv4 packets. |
| `bad_checksum` | `False` | Send a wrong, non-zero IPv4 header checksum. |
| `random_payload` | `False` | Append 8 random bytes to each packet. |
| `isn_randomize` | `True` | Randomize the TCP sequence number. |
| `spoof` | `False` | Spoof the source address from the spoof pool. |
| `spoof_ranges_file` | `None` | Path to the CIDR file for spoof sources. |
| `flags` | `S` | TCP flag combination. Example values: `R`, `A`, `SA`, `PA`, `SARFU`. |
| `fragment` | `False` | Split each IPv4 packet into fragments. |
| `frag_size` | `24` | Fragment payload size in bytes. Minimum 8. |
| `out_of_state` | `False` | Out-of-state mode: random flags, sequence, and acknowledgment numbers. |
| `tcp_options` | `[]` | TCP options: `mss`, `ws`, `sack_perm`, `timestamps`, `nop`, `eol`. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between packets. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--syn N` | Enable the vector with `N` workers. |
| `--syn-spoof` | Spoof a random source address. Requires root and Scapy. |
| `--syn-ip-version {4,6}` | Select the IP family. The default is 4. |
| `--syn-hop-limit N` | Set the IPv6 hop limit, 1 to 255. The default is 64. IPv6 only. |
| `--syn-flags FLAGS` | Set the TCP flag combination. The default is `S`. |
| `--syn-fragment` | Split TCP packets into IPv4 fragments. |
| `--syn-frag-size N` | Set the fragment payload size in bytes. The default is 24. |
| `--syn-out-of-state` | Send packets with random flags, sequence, and acknowledgment numbers. |
| `--spoof-ranges-file PATH` | CIDR file used for SYN spoof sources. |

## Modifiers

The dashboard exposes these modifiers for the TCP flood attack types.

| Modifier | Config key | Effect |
|---|---|---|
| IP Spoofing | `spoof` | Spoof the source address from the spoof pool. |
| Fragmentation | `fragment`, `frag_size` | Split each packet into IPv4 fragments. |
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between packets. |
| TTL Randomization | `ttl_min`, `ttl_max` | Randomize the IPv4 TTL per packet. |
| Don't Fragment | `dont_fragment` | Set the don't-fragment bit. |
| Random Payload | `random_payload` | Append random bytes to each packet. |
| DSCP Randomization | `dscp_min`, `dscp_max` | Randomize the DSCP field. |
| ECN Randomization | `ecn_randomize` | Randomize the ECN bits. |
| IP ID Mode | `ip_id_mode` | Set the IP ID behavior per packet. |
| IP Reserved Flag | `ip_reserved_flag` | Set the reserved bit. |
| Bad Checksum | `bad_checksum` | Corrupt the IPv4 header checksum. |
| TCP Options | `tcp_options` | Add TCP options to each packet. |
| ISN Randomize | `isn_randomize` | Randomize the TCP sequence number. Default on. |

IP Version and Hop Limit are engine-ready rows for this vector. The engine
uses `ip_version` and `hop_limit`. The dashboard does not expose them as
toggles.

::: warning
The entire `syn` vector needs root. IP Spoofing also needs root and Scapy.
On an IPv6 run, IP Spoofing warns and disables when no IPv6 ranges exist,
Fragmentation warns and disables, and Bad Checksum warns and skips. The run
continues with a different packet shape than you expect.
:::

## Requirements

The vector needs root access and Scapy. It writes raw IP packets, which the
operating system allows only for a privileged process. Start Avalanche with
sudo.

::: warning
Without root, the vector logs a warning and does not start. The `--syn-spoof`
flag is ignored without root and Scapy.
:::

IP Spoofing uses a spoof-range file when you provide one. Without a file,
the vector still spoofs over IPv4 and picks a random public IP as the
source. Over IPv6, spoofing works only when the file has IPv6 ranges.
Without them, the vector warns and sends unspoofed. `--spoof-ranges-file`
points to the file.

The vector does not need a reflector file or an optional Python library. The
IPv6 path needs a target with a usable AAAA record.

## Example

```bash
sudo avalanche -t example.test -p 443 --syn 8 -d 60
```

This command sends raw TCP SYN packets to port 443 on `example.test` for 60
seconds. Eight workers send the packets. The flags stay at the default `S`.

For a reset flood with spoofed sources:

```bash
sudo avalanche -t example.test -p 443 --syn 4 --syn-flags R --syn-spoof --spoof-ranges-file ~/.avalanche/spoof/ranges.txt -d 60
```

For the out-of-state flood:

```bash
sudo avalanche -t example.test -p 443 --syn 4 --syn-out-of-state -d 60
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 4 (TCP/UDP) attacks](../layer4.md)
- [ICMP attacks (vector: icmp)](./vector-icmp.md)
- [Raw IP protocol attacks (vector: rawip)](./vector-rawip.md)
- [Safety and authorized use](../../user-guide/safety.md)
