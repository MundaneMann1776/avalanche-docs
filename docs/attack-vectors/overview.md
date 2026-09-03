---
title: Attack Vectors
description: An overview of the 16 attack vectors, the 54 attack types, and how the knowledge base organizes them by OSI layer.
---

# Attack Vectors

This page explains what an attack vector is in Avalanche and how the attack
types organize into three OSI layers. It also shows how to read the vector
knowledge base. Use Avalanche only against systems you own or have written
permission to test.

## What is a vector

A vector is one attack engine module. Each vector lives in its own file
under `src/avalanche/vectors/`. A vector produces one or more attack types.
For example, the `syn` vector produces nine TCP attack types, and the `udp`
vector produces the plain UDP storm and the amplification family.

Avalanche has 16 vectors. They share a small set of base classes:

- `AttackVector` in `vectors/base.py` is the abstract base for every vector.
  It owns the thread lifecycle, the governor handshake, and the stop
  events.
- `BaseHTTPVector` in `vectors/base_http.py` extends `AttackVector`. It
  provides cookie capture, WAF analysis, proxy pools, token buckets, and
  TLS fingerprinting to the HTTP-based vectors.
- `SlowSocketVector` in `vectors/base.py` extends `AttackVector`. It owns
  the connection-hold loop for the slow attack vectors.

The vector reference lists every vector with its module file, base class,
and attack types.

## Attack types and layers

The catalog has 54 attack types. The dashboard groups them by OSI layer:

- Layer 3 (network) has 9 attack types. They craft IP packets directly.
- Layer 4 (TCP/UDP) has 15 attack types. They flood TCP or UDP transport.
- Layer 7 (application) has 30 attack types. They abuse application
  protocols.

The layer label follows the attack type, not the vector. Most vectors work
at one layer. The `udp` vector is the exception: it produces `udp_flood`
and the four UDP amplification attacks at layer 4, and `dns_amplification`
at layer 7.

| Vector | Attack types | Layer |
|---|---|---|
| `icmp` | ICMP Flood, IP/ICMP Fragmented, Smurf Attack, Ping of Death | Layer 3 |
| `rawip` | Other IP Flood, GRE Flood, ESP Flood, IGMP Flood, Teardrop Attack | Layer 3 |
| `syn` | TCP SYN Flood, TCP Reset Flood, TCP ACK Flood, TCP SARFU Flood, TCP SYN ACK Flood, TCP Push-ACK Flood, TCP FIN Flood, TCP Fragmentation Flood, TCP Out-of-State Flood | Layer 4 |
| `udp` | UDP Flood, NTP Amplification, SSDP Amplification, Memcached Amplification, Chargen Amplification, DNS Amplification | Layers 4 and 7 |
| `http3` | QUIC Flood | Layer 4 |
| `http` | HTTP/S GET Flood, HTTP/S POST Flood, HULK, GraphQL Query Flood, Cache Busting / Random URL Flood | Layer 7 |
| `slowloris` | HTTP/S Slowloris | Layer 7 |
| `slowread` | HTTP Slow Read | Layer 7 |
| `rudy` | HTTP Slow Post | Layer 7 |
| `smtp` | SMTP Slow Hold | Layer 7 |
| `tls_churn` | TLS/SSL Exhaustion | Layer 7 |
| `sip` | SIP Invite Flood, SIP Bye Flood, SIP REGISTER Flood, SIP OPTIONS Flood, SIP Multi Attribute Flood | Layer 7 |
| `dns` | DNS Water Torture | Layer 7 |
| `http2` | HTTP/2 Rapid Reset, HTTP/2 Continuation Flood, HTTP/2 Settings Flood, HTTP/2 Window Update Flood, HTTP/2 Priority Churn, HTTP/2 Ping Flood, HTTP/2 Reset Flood, HTTP/2 Empty Frames, HTTP/2 Zero-Length Headers, HTTP/2 GOAWAY Churn, HTTP/2 Trailers Abuse, HTTP/2 HPACK Bomb | Layer 7 |
| `websocket` | WebSocket Flood | Layer 7 |
| `http_flow` | No catalog attack type. Replays YAML flow scenarios as the flow player. | None (flow player) |

The layer pages describe every attack type on that layer. Layer 3 has its
own page because it uses raw IP, and the traffic shape differs from the
TCP/UDP transport attacks on layer 4. The `http_flow` vector has no layer
row because it replays scenarios instead of a named attack.

## How to read the knowledge base

The knowledge base has one page per vector under the `kb/` directory. Each
page follows the same shape:

- An opening that names the vector and its attack types.
- When to use the vector for authorized assessments.
- How the vector works in the engine.
- An attack types table with the exact catalog labels.
- A configuration table with the real config keys and defaults.
- A command-line flags table as `ui/cli.py` spells them.
- The modifiers the engine consumes for the vector.
- Requirements, including root and optional libraries.
- One realistic command example.

Start from the layer page that matches your target service. Follow the
link to the vector page that produces the attack you need.

## Related pages

- [Layer 3 (Network) attacks](layer3.md)
- [Layer 4 (TCP/UDP) attacks](layer4.md)
- [Layer 7 (Application) attacks](layer7.md)
- [Vector Reference](reference.md)
- [Knowledge base: UDP vector](kb/vector-udp.md)
