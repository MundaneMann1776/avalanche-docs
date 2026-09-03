---
title: Layer 4 (TCP/UDP) Attacks
description: A categorized guide to the fifteen TCP and UDP attack types in Avalanche, with the vector that runs each one.
---

# Layer 4 (TCP/UDP) Attacks

This page describes the fifteen attack types that flood the TCP and UDP
transport layer. Use Avalanche only against systems you own or have written
permission to test.

The layer 4 catalog divides into four families:

- Nine TCP attacks from the `syn` vector: seven flag floods plus the
  fragmentation and out-of-state modes.
- UDP Flood from the `udp` vector.
- Four UDP amplification attacks from the `udp` vector.
- QUIC Flood from the `http3` vector.

## TCP flag floods

These seven attacks come from the `syn` vector in
`src/avalanche/vectors/syn.py`. They share one packet builder. The TCP flag
combination is the only difference. See
[the SYN knowledge base page](kb/vector-syn.md).

::: warning
The `syn` vector needs root. Avalanche builds the packets with Scapy raw
sockets, so start the run with sudo.
:::

### TCP SYN Flood

The `syn` vector sends TCP packets with the SYN flag set. A half-open
connection consumes a listen-backlog slot on the target. Use it to test
listen queues and SYN-cookie defenses. The attack selects flags `S`.

### TCP Reset Flood

The `syn` vector sends TCP packets with the RST flag set. A reset tears
down an active connection. Use it to test connection-state tables. Select
flags `R`.

### TCP ACK Flood

The `syn` vector sends TCP packets with only the ACK flag set. The target
searches its connection table for each ACK. Use it to test the state-table
lookup path. Select flags `A`.

### TCP SARFU Flood

The `syn` vector sends TCP packets with the SARFU flag set. This unusual
combination forces deep parsing in middleboxes. Use it to test
signature-based filters. Select flags `SARFU`.

### TCP SYN ACK Flood

The `syn` vector sends TCP packets with the SYN and ACK flags set. The
target treats each packet as a reply to a connection it never opened. Use
it to test stateless challenge paths. Select flags `SA`.

### TCP Push-ACK Flood

The `syn` vector sends TCP packets with the PUSH and ACK flags set. The
target must deliver the data immediately to the application. Use it to test
receive-buffer pressure. Select flags `PA`.

### TCP FIN Flood

The `syn` vector sends TCP packets with the FIN flag set. A FIN closes a
connection in the target state table. Use it to test connection teardown
paths. Select flags `F`.

## TCP fragmentation and out-of-state attacks

These two attacks also come from the `syn` vector. They do not select a
flag preset. Each has its own mode.

### TCP Fragmentation Flood

The `syn` vector splits TCP packets into small IPv4 fragments. The target
reassembles each connection attempt from fragments. Use it to test
reassembly buffers under connection load. The attack uses fragment mode
with a 24-byte default fragment payload.

### TCP Out-of-State Flood

The `syn` vector sends TCP packets with random sequence, acknowledgment,
and flag values that match no open session. The target cannot match the
packets to a connection. Use it to test stateless-drop paths. The attack
uses out-of-state mode.

## UDP flood

### UDP Flood

The `udp` vector sends a continuous stream of datagrams to the target when
no reflector file is configured. It works without root. The storm offers
payload-size, payload-content, source-port, and destination-port controls.
Use it to saturate a UDP service or the link in front of it. See
[the UDP knowledge base page](kb/vector-udp.md).

## UDP amplification attacks

These four attacks come from the `udp` vector. Each one needs a reflector
file with `ip:port:protocol` lines. The protocol in each line selects the
probe payload. The engine fires at every reflector in the file, so keep
only the protocol you want to test. See
[the UDP knowledge base page](kb/vector-udp.md).

### NTP Amplification

The `udp` vector sends an NTP mode-7 monlist-style request to NTP
reflectors on UDP port 123. Many NTP servers no longer answer monlist, so
live reflectors are rare. Select `ntp` reflectors in the file.

### SSDP Amplification

The `udp` vector sends an SSDP M-SEARCH discovery request to reflectors on
UDP port 1900. Each UPnP device answers with a discovery response. Select
`ssdp` reflectors in the file.

### Memcached Amplification

The `udp` vector sends a `stats` request to memcached reflectors on UDP
port 11211. A misconfigured memcached instance answers with a large stats
blob. Select `memcached` reflectors in the file.

### Chargen Amplification

The `udp` vector sends a single-byte trigger to chargen reflectors on UDP
port 19. The chargen service answers with a continuous character cycle.
Select `chargen` reflectors in the file. Live chargen servers are nearly
extinct.

Amplification attacks can spoof the target address as the source. Enable
`amplify_spoof` for that path. It needs root and Scapy.

## QUIC flood

### QUIC Flood

The `http3` vector opens QUIC connections and sends requests over UDP port
443. QUIC is the transport for HTTP/3. Use it to test QUIC endpoints that
sit in front of an HTTP/3 stack. The vector needs the optional `aioquic`
library. See [the HTTP/3 knowledge base page](kb/vector-http3.md).

## Layer 4 attack summary

| Attack type | Vector | What it does | Typical use |
|---|---|---|---|
| TCP SYN Flood | `syn` | SYN flag flood | Test listen queues and SYN cookies |
| TCP Reset Flood | `syn` | RST flag flood | Test connection-state tables |
| TCP ACK Flood | `syn` | ACK flag flood | Test state-table lookups |
| TCP SARFU Flood | `syn` | SARFU flag flood | Test signature filters |
| TCP SYN ACK Flood | `syn` | SYN-ACK flag flood | Test challenge paths |
| TCP Push-ACK Flood | `syn` | Push-ACK flag flood | Test receive-buffer pressure |
| TCP FIN Flood | `syn` | FIN flag flood | Test teardown paths |
| TCP Fragmentation Flood | `syn` | Fragmented TCP packets | Test reassembly buffers |
| TCP Out-of-State Flood | `syn` | Packets outside session state | Test stateless-drop paths |
| UDP Flood | `udp` | Continuous datagram storm | Saturate a UDP service or link |
| NTP Amplification | `udp` | NTP monlist request to reflectors | Multiply traffic through NTP servers |
| SSDP Amplification | `udp` | M-SEARCH to reflectors | Multiply traffic through UPnP devices |
| Memcached Amplification | `udp` | `stats` request to reflectors | Multiply traffic through memcached |
| Chargen Amplification | `udp` | Single-byte trigger to reflectors | Multiply traffic through chargen |
| QUIC Flood | `http3` | QUIC connection flood | Test QUIC and HTTP/3 endpoints |

## Related pages

- [Attack Vectors overview](overview.md)
- [Layer 3 (Network) attacks](layer3.md)
- [Layer 7 (Application) attacks](layer7.md)
- [Vector Reference](reference.md)
- [Knowledge base: SYN vector](kb/vector-syn.md)
- [Knowledge base: UDP vector](kb/vector-udp.md)
- [Knowledge base: HTTP/3 vector](kb/vector-http3.md)
