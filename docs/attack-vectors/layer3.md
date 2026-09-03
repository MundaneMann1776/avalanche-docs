---
title: Layer 3 (Network) Attacks
description: A categorized guide to the nine layer 3 network attack types in Avalanche, with the vector that runs each one.
---

# Layer 3 (Network) Attacks

This page describes the nine attack types that craft network-layer packets.
They use the IP protocols directly and carry no transport port. Use
Avalanche only against systems you own or have written permission to test.

These attacks need root. Avalanche builds the packets with Scapy raw
sockets, so start the run with sudo. Two vectors produce the nine attack
types: `icmp` and `rawip`.

## ICMP flood family

These four attack types use the `icmp` vector in
`src/avalanche/vectors/icmp.py`. Modes inside the vector select the attack.
The plain flood sends ICMP echo requests.

### ICMP Flood

The `icmp` vector sends a stream of ICMP echo request packets to the target.
It measures how the target handles a continuous ICMP load. Use it to test
firewall rules and rate limits on ICMP. Select `icmp_flood` in the
dashboard.

### IP/ICMP Fragmented

The `icmp` vector sends echo requests split into small IPv4 fragments.
Fragmentation forces the target to reassemble each packet. Use it to test
reassembly buffers and fragment-handling paths. The vector uses fragment
mode with a 24-byte default fragment payload. See
[the ICMP knowledge base page](kb/vector-icmp.md).

### Smurf Attack

The `icmp` vector spoofs the target address as the source of an echo
request to a directed broadcast. Every host on the broadcast network
replies to the target. Use it to test broadcast amplification only on
networks you control. Select smurf mode. Smurf mode needs root.

### Ping of Death

The `icmp` vector sends an oversized ICMP echo request that crosses the
IPv4 fragment limit. A vulnerable host fails when it reassembles the
packet. Use it to test patched and hardened stacks. Select ping-of-death
mode.

## Raw IP flood family

These five attack types use the `rawip` vector in
`src/avalanche/vectors/rawip.py`. A protocol number selects the attack
because raw IP has no ports.

### Other IP Flood

The `rawip` vector sends packets with an arbitrary IP protocol number. The
default preset uses protocol 55, the IP-in-IP encapsulation protocol. Use
it to test whether middleboxes filter unknown protocols. Set `--rawip-proto
N` for a different number. See
[the Raw IP knowledge base page](kb/vector-rawip.md).

### GRE Flood

The `rawip` vector sends packets with IP protocol 47, the GRE tunneling
protocol. Use it to test VPN and tunneling endpoints that must handle GRE.

### ESP Flood

The `rawip` vector sends packets with IP protocol 50, the Encapsulating
Security Payload protocol. Use it to test IPsec gateways that must decrypt
or discard ESP traffic.

### IGMP Flood

The `rawip` vector sends packets with IP protocol 2, the Internet Group
Management Protocol. Use it to test multicast-aware switches and routers
under load.

### Teardrop Attack

The `rawip` vector sends overlapping IP fragments with malformed offset
fields. A vulnerable host crashes when it reassembles the fragments. Use it
to test modern reassembly engines. The dashboard presets protocol 17 (UDP)
with teardrop mode on. The CLI keeps the GRE protocol default when you
enable `--rawip-teardrop` without setting `--rawip-proto`.

## Layer 3 attack summary

| Attack type | Vector | What it does | Typical use |
|---|---|---|---|
| ICMP Flood | `icmp` | Flood of ICMP echo requests | Test ICMP rate limits and firewall rules |
| IP/ICMP Fragmented | `icmp` | Fragmented echo requests | Test reassembly paths |
| Smurf Attack | `icmp` | Spoofed echo to a broadcast | Test broadcast amplification on owned networks |
| Ping of Death | `icmp` | Oversized fragmented echo | Test patched stacks |
| Other IP Flood | `rawip` | Arbitrary protocol packets (55 preset) | Test unknown-protocol filtering |
| GRE Flood | `rawip` | Protocol 47 packets | Test GRE and VPN endpoints |
| ESP Flood | `rawip` | Protocol 50 packets | Test IPsec gateways |
| IGMP Flood | `rawip` | Protocol 2 packets | Test multicast infrastructure |
| Teardrop Attack | `rawip` | Overlapping IP fragments | Test reassembly engines |

## Related pages

- [Attack Vectors overview](overview.md)
- [Layer 4 (TCP/UDP) attacks](layer4.md)
- [Layer 7 (Application) attacks](layer7.md)
- [Vector Reference](reference.md)
- [Knowledge base: ICMP vector](kb/vector-icmp.md)
- [Knowledge base: Raw IP vector](kb/vector-rawip.md)
