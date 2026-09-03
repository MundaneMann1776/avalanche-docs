---
title: Vector Reference
description: A compact reference to all 16 Avalanche vectors with base class, attack types, config model, and key flags.
---

# Vector Reference

This page lists all 16 vectors in one table. It shows the module file, the
base class, the attack types, the config model, and the key flags. Use this
page to find the vector that runs a given attack. Use Avalanche only
against systems you own or have written permission to test.

Each vector subclasses `AttackVector` in `src/avalanche/vectors/base.py`.
The HTTP-based vectors subclass `BaseHTTPVector`. The slow vectors subclass
`SlowSocketVector`. Both `BaseHTTPVector` and `SlowSocketVector` extend
`AttackVector`.

## Vector table

| Vector | Module file | Base class | Attack types | Config model | Key flags | Optional deps / root |
|---|---|---|---|---|---|---|
| `http` | `vectors/http_flood.py` | `BaseHTTPVector` | `http_get_flood`, `http_post_flood`, `hulk`, `graphql_query_flood`, `cache_busting_random_url_flood` (5) | `HttpVectorConfig` | `--http`, `--http-rps`, `--bypass-waf`, `--hulk`, `--graphql`, `--use-proxies` | `browser` extra for bypass mode |
| `http_flow` | `vectors/http_flow.py` | `BaseHTTPVector` | Flow player, no catalog row | `HttpFlowVectorConfig` | `--http-flow-dir`, `--http-flow`, `--http-flow-rps`, `--flow-fuzz` | None |
| `slowloris` | `vectors/slowloris.py` | `SlowSocketVector` | `http_slowloris` (1) | `SlowlorisConfig` | `--slowloris` | None |
| `rudy` | `vectors/rudy.py` | `SlowSocketVector` | `http_slow_post` (1) | `RudyConfig` | `--rudy` | None |
| `slowread` | `vectors/slowread.py` | `SlowSocketVector` | `http_slow_read` (1) | `SlowReadConfig` | `--slow-read` | None |
| `smtp` | `vectors/smtp.py` | `SlowSocketVector` | `smtp_slow_attack` (1) | `SmtpVectorConfig` | `--smtp`, `--smtp-mode`, `--smtp-workers`, `--smtp-port` | None |
| `udp` | `vectors/udp.py` | `AttackVector` | `udp_flood`, `ntp_amplification`, `ssdp_amplification`, `memcached_amplification`, `chargen_amplification`, `dns_amplification` (6) | `UdpVectorConfig` | `--udp`, `--udp-payload-size`, `--reflector-file`, `--amplify-spoof` | `--amplify-spoof` needs root and Scapy |
| `icmp` | `vectors/icmp.py` | `AttackVector` | `icmp_flood`, `ip_icmp_fragmented`, `smurf_attack`, `ping_of_death` (4) | `IcmpVectorConfig` | `--icmp`, `--icmp-fragment`, `--icmp-smurf`, `--icmp-pod` | Needs root and Scapy |
| `syn` | `vectors/syn.py` | `AttackVector` | `tcp_syn_flood`, `tcp_reset_flood`, `tcp_ack_flood`, `tcp_sarfu_flood`, `tcp_syn_ack_flood`, `tcp_push_ack_flood`, `tcp_fin_flood`, `tcp_fragmentation_flood`, `tcp_out_of_state_flood` (9) | `SynVectorConfig` | `--syn`, `--syn-flags`, `--syn-spoof`, `--syn-fragment`, `--syn-out-of-state` | Needs root and Scapy |
| `rawip` | `vectors/rawip.py` | `AttackVector` | `other_ip_flood`, `gre_flood`, `esp_flood`, `igmp_flood`, `teardrop_attack` (5) | `RawIpVectorConfig` | `--rawip`, `--rawip-proto`, `--rawip-teardrop` | Needs root and Scapy |
| `http3` | `vectors/http3.py` | `AttackVector` | `quic_flood` (1) | `Http3VectorConfig` | `--http3`, `--http3-rps` | `aioquic` extra |
| `http2` | `vectors/http2.py` | `AttackVector` | Twelve `http2_*` attack types (12) | `Http2VectorConfig` | `--http2`, `--http2-mode` | `h2` extra |
| `websocket` | `vectors/websocket.py` | `AttackVector` | `websocket_flood` (1) | `WebSocketVectorConfig` | `--websocket`, `--websocket-mode`, `--websocket-path` | None |
| `tls_churn` | `vectors/tls_churn.py` | `AttackVector` | `tls_ssl_exhaustion` (1) | `TlsChurnConfig` | `--tls-churn`, `--tls-churn-mode` | None |
| `sip` | `vectors/sip.py` | `AttackVector` | `sip_invite_flood`, `sip_bye_flood`, `sip_register_flood`, `sip_options_flood`, `sip_multi_attribute_flood` (5) | `SipVectorConfig` | `--sip`, `--sip-method`, `--sip-multi-attr`, `--sip-transport` | None |
| `dns` | `vectors/dns.py` | `AttackVector` | `dns_water_torture` (1) | `DnsVectorConfig` | `--dns`, `--dns-transport`, `--dns-domain` | None |

## Attack type totals

The catalog names 54 attack types across the three layers. The per-vector
counts in the table add to 54. The `http_flow` vector contributes no row,
and `udp` contributes six attack types across two layers:

- Layer 3: 9 attack types, from `icmp` and `rawip`.
- Layer 4: 15 attack types, from `syn`, `udp`, and `http3`.
- Layer 7: 30 attack types, from the HTTP, slow, HTTP/2, WebSocket, SIP,
  TLS, DNS, and SMTP vectors.

The `http_flow` vector has no single catalog row. It replays YAML flow
scenarios. The `udp` vector produces both a layer 4 storm and layer 7 DNS
amplification.

## Related pages

- [Attack Vectors overview](overview.md)
- [Layer 3 (Network) attacks](layer3.md)
- [Layer 4 (TCP/UDP) attacks](layer4.md)
- [Layer 7 (Application) attacks](layer7.md)
- [Knowledge base: UDP vector](kb/vector-udp.md)