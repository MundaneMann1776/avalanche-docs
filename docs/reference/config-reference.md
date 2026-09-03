---
title: Configuration Reference
description: Every config key of Avalanche with its default value.
---

# Configuration Reference

This page lists every configuration key of Avalanche. The config keys map
one-to-one to the typed models in the engine. This page gives the key, the
default, and the meaning. Config keys use `snake_case`. The CLI flags use
`kebab-case`.

The example files in the repository generate from the same typed models:

- `examples/config.example.yaml`
- `examples/config.example.json`
- `examples/config.schema.json`

Where a value is `null` and the model has a default, this page gives the
model default in the Default column.

Use Avalanche only against systems you own or have written permission to
test.

::: tip
Unknown keys are dropped at load. Partial files are completed against the
canonical defaults. Use `--dry-run` or `--validate` to review the resolved
config.
:::

## Top-level keys

The top level of a config file holds the target and the main sections.

| Key | Default | Meaning |
| --- | --- | --- |
| `target` | `""` | Host to test. You set it. The sample file uses `example.com`. |
| `port` | `80` | Target port. |
| `scheme` | `auto` | Request scheme: `auto`, `http`, or `https`. `auto` means HTTPS on ports 443 and 8443. |
| `duration` | `0` | Run length in seconds. `0` means run until stopped. |
| `vectors` | (section) | Per-vector configuration. One key per vector. |
| `limits` | (section) | Global caps enforced by the resource governor. |
| `runtime` | (section) | Operational settings for the run. |
| `waf_bypass` | `null` | WAF bypass method id applied at launch. |
| `cookie_file` | `null` | Captured-cookie file to replay. It falls back to `~/.avalanche/cookies.json`. |

## The vectors section

The `vectors` section holds one key per vector. The order is fixed. A partial
file is completed against the canonical defaults. This page lists each vector
in that order: `http`, `http_flow`, `slowloris`, `rudy`, `smtp`, `udp`,
`icmp`, `syn`, `rawip`, `slowread`, `tls_churn`, `sip`, `dns`, `http2`,
`websocket`, `http3`.

The user guide explains the configuration conventions. See
[Configuration](../user-guide/configuration.md).

### http

The HTTP flood vector.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Start this vector. |
| `concurrency` | `200` | Concurrent HTTP workers. |
| `rps` | `0.0` | Target requests per second. `0` means unlimited. |
| `bypass_waf` | `false` | Use browser-grade TLS and HTTP/2 fingerprints. |
| `session_sticky` | `false` | Keep the session across requests. |
| `cookie_flood` | `false` | Flood with cookies. |
| `random_endpoints` | `false` | Generate random endpoints. |
| `hulk` | `false` | HULK mode with unique user agents and uncacheable URLs. |
| `graphql` | `false` | POST JSON to `/graphql` with rotating query templates. |
| `graphql_batch` | `false` | Include multi-operation batch requests in GraphQL mode. |
| `user_agent_rotation` | `true` | Rotate the user agent. |
| `compression_hints` | `true` | Send compression headers. |
| `proxies.enabled` | `false` | Route requests through the proxy pool. |
| `proxies.file` | `proxies.txt` | Proxy pool file. |
| `proxies.fetch_public` | `false` | Fetch public proxy lists before validation. |
| `proxies.cache_path` | `null` | Path for fetched proxies. It uses `~/.avalanche/public_proxies.cache.txt`. |
| `proxies.sticky` | `false` | Keep one proxy per worker until eviction. |
| `tls.enabled` | `false` | Rotate TLS fingerprints per request. HTTPS only. |
| `tls.pool_size` | `8` | Number of pre-built TLS contexts. |
| `solver_url` | `null` | External challenge solver URL. |
| `solver_protocol` | `null` | Solver protocol: `none`, `http`, or `tspd`. |
| `solver_api_key` | `null` | API key for the solver service. |
| `solver_base_url` | `null` | Base URL for the solver API. |
| `browser_impersonate` | `""` | Browser profile to impersonate. Empty means the engine default, `chrome146`. |
| `human_timing` | `false` | Use heavy-tailed delays between bursts. |
| `body_method` | `GET` | Method for body-inclusive requests: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, or `mixed`. |
| `body_ratio` | `0.3` | Fraction of requests that include a body. Range `0.0` to `1.0`. |
| `adaptive_targeting` | `false` | Rebalance endpoint weights from live metrics. |
| `adaptive_targeting_interval` | `30.0` | Seconds between rebalance passes. |
| `endpoint_stats` | `false` | Track per-endpoint response codes and latency. |
| `tcp_connector_limit` | `null` | Maximum concurrent TCP connections. `null` means automatic. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |
| `extra_endpoints` | `[]` | Extra endpoints to attack. |

### http_flow

The HTTP flow player. It replays YAML flow scenarios from a directory.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `concurrency` | `50` | Concurrent flow-player workers. |
| `rps` | `0.0` | Target requests per second. `0` means unlimited. |
| `flow_dir` | `null` | Directory of YAML flow definitions. |
| `flow_fuzz` | `false` | Fuzz duplicate parameters, JSON, and XML. |
| `proxies.enabled` | `false` | Route flow requests through the proxy pool. |
| `proxies.file` | `proxies.txt` | Proxy pool file. |
| `proxies.fetch_public` | `false` | Fetch public proxy lists before validation. |
| `proxies.cache_path` | `null` | Path for fetched proxies. |
| `proxies.sticky` | `false` | Keep one proxy per worker until eviction. |
| `tls.enabled` | `false` | Rotate TLS fingerprints per request. HTTPS only. |
| `tls.pool_size` | `8` | Number of pre-built TLS contexts. |
| `human_timing` | `false` | Use heavy-tailed delays between bursts. |
| `tcp_connector_limit` | `null` | Maximum concurrent TCP connections. `null` means automatic. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### slowloris

The HTTP slowloris vector. It opens sockets and holds them open.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Start this vector. |
| `workers` | `30` | Number of slowloris workers. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |
| `hold_only` | `false` | Hold the connection without sending headers. |
| `hold_seconds` | `60` | How long one worker holds a socket. |

### rudy

The RUDY vector. It sends a slow HTTP POST body.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Start this vector. |
| `workers` | `10` | Number of RUDY workers. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |
| `hold_no_body` | `false` | Hold the connection without a body. |
| `hold_seconds` | `60` | How long one worker holds a socket. |

### smtp

The SMTP slow-attack vector. It needs no optional library.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `10` | Number of SMTP workers. |
| `mode` | `command_drip` | Attack mode: `banner_hold`, `command_drip`, or `data_drip`. |
| `helo_domain` | `relay.test` | HELO domain in the greeting. |
| `mail_from` | `sender@relay.test` | Sender address in `MAIL FROM`. |
| `rcpt_to` | `recipient@relay.test` | Recipient address in `RCPT TO`. |
| `drip_seconds` | `1.0` | Seconds between drip bytes. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |
| `port` | `null` | SMTP port. `null` means it follows the top-level `port`. |

### udp

The UDP storm and amplification vector.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Start this vector. |
| `workers` | `2` | Number of UDP workers. |
| `payload_size` | `8192` | Payload size in bytes. |
| `process_workers` | `0` | Child-process shards. `0` means in-process threads. |
| `reflector_file` | `null` | Amplifier list. Lines use `ip:port:proto`. It enables amplification. |
| `amplify_spoof` | `false` | Spoof the victim source toward reflectors. Needs root. |
| `dont_fragment` | `false` | Set the do-not-fragment bit. |
| `bad_checksum` | `false` | Send packets with a bad checksum. |
| `random_payload` | `false` | Send a random payload. |
| `size_jitter_pct` | `0` | Payload size jitter as a percentage. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |
| `src_port_min` | `null` | Lower bound of the random source-port range. |
| `src_port_max` | `null` | Upper bound of the random source-port range. |
| `dport_rotation` | `false` | Cycle the destination port per datagram. |
| `dport_list` | `[53, 123, 161, 389, 1900]` | Destination ports for rotation. |
| `payload_bytes` | `null` | Fixed payload size that overrides `payload_size`. |
| `payload_min` | `null` | Lower bound of the uniform payload-size range. |
| `payload_max` | `null` | Upper bound of the uniform payload-size range. |
| `payload_mode` | `random` | Payload content: `random`, `pattern`, `zero`, or `ascii`. |

### icmp

The ICMP vector. It needs root and Scapy.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `1` | Number of ICMP workers. |
| `ip_version` | `4` | IP family. `6` sends ICMPv6 echo requests. |
| `hop_limit` | `64` | IPv6 hop limit. IPv6 only. |
| `ttl_min` | `null` | Lower bound of the random TTL range. |
| `ttl_max` | `null` | Upper bound of the random TTL range. |
| `dscp_min` | `null` | Lower bound of the random DSCP range. |
| `dscp_max` | `null` | Upper bound of the random DSCP range. |
| `ecn_randomize` | `false` | Randomize the ECN bits. |
| `ip_id_mode` | `null` | IP identification mode. |
| `ip_reserved_flag` | `false` | Set the reserved IP flag. |
| `dont_fragment` | `false` | Set the do-not-fragment bit. |
| `bad_checksum` | `false` | Send packets with a bad checksum. |
| `random_payload` | `false` | Send a random payload. |
| `ip_options` | `[]` | IP options to add. Allowed: `record_route`, `timestamp`, `nop`, `eol`. |
| `fragment` | `false` | Split packets into IPv4 fragments. |
| `frag_size` | `24` | Fragment payload size in bytes. |
| `smurf` | `false` | Smurf mode with a spoofed source. |
| `smurf_src` | `null` | Source IP to spoof. Default is a random public IP. |
| `spoof_ranges_file` | `null` | CIDR file for the spoofed source ranges. |
| `ping_of_death` | `false` | Ping of Death mode. |
| `size_jitter_pct` | `0` | Payload size jitter as a percentage. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### syn

The TCP SYN vector. It needs root and Scapy.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `1` | Number of SYN workers. |
| `process_workers` | `0` | Child-process shards. `0` means in-process threads. |
| `ip_version` | `4` | IP family. `6` selects the IPv6 path. |
| `hop_limit` | `64` | IPv6 hop limit. IPv6 only. |
| `ttl_min` | `null` | Lower bound of the random TTL range. |
| `ttl_max` | `null` | Upper bound of the random TTL range. |
| `dscp_min` | `null` | Lower bound of the random DSCP range. |
| `dscp_max` | `null` | Upper bound of the random DSCP range. |
| `ecn_randomize` | `false` | Randomize the ECN bits. |
| `ip_id_mode` | `null` | IP identification mode. |
| `ip_reserved_flag` | `false` | Set the reserved IP flag. |
| `dont_fragment` | `false` | Set the do-not-fragment bit. |
| `bad_checksum` | `false` | Send packets with a bad checksum. |
| `random_payload` | `false` | Send a random payload. |
| `isn_randomize` | `true` | Randomize the initial sequence number. |
| `spoof` | `false` | Spoof a random source IPv4. |
| `spoof_ranges_file` | `null` | CIDR file for the spoofed source ranges. |
| `flags` | `S` | TCP flag combination. Examples: `S`, `SA`, `SARFU`. |
| `fragment` | `false` | Split packets into IPv4 fragments. |
| `frag_size` | `24` | Fragment payload size in bytes. |
| `out_of_state` | `false` | Send packets outside any session. |
| `tcp_options` | `[]` | TCP options to add. Allowed: `mss`, `ws`, `sack_perm`, `timestamps`, `nop`, `eol`. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### rawip

The raw IP vector. It needs root and Scapy.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `1` | Number of raw IP workers. |
| `process_workers` | `0` | Child-process shards. `0` means in-process threads. |
| `ip_version` | `4` | IP family. `6` selects the IPv6 path. |
| `hop_limit` | `64` | IPv6 hop limit. IPv6 only. |
| `ttl_min` | `null` | Lower bound of the random TTL range. |
| `ttl_max` | `null` | Upper bound of the random TTL range. |
| `dscp_min` | `null` | Lower bound of the random DSCP range. |
| `dscp_max` | `null` | Upper bound of the random DSCP range. |
| `ecn_randomize` | `false` | Randomize the ECN bits. |
| `ip_id_mode` | `null` | IP identification mode. |
| `ip_reserved_flag` | `false` | Set the reserved IP flag. |
| `bad_checksum` | `false` | Send packets with a bad checksum. |
| `random_payload` | `false` | Send a random payload. |
| `spoof` | `false` | Spoof the source address. |
| `spoof_ranges_file` | `null` | CIDR file for the spoofed source ranges. |
| `ip_options` | `[]` | IP options to add. Allowed: `record_route`, `timestamp`, `nop`, `eol`. |
| `proto` | `47` | IPv4 protocol number. `47` is GRE, `50` is ESP, `2` is IGMP. |
| `teardrop` | `false` | Teardrop mode with overlapping fragments. |
| `size_jitter_pct` | `0` | Payload size jitter as a percentage. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### slowread

The HTTP Slow Read vector. It sends a full request and reads the response at
a crawl.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `30` | Number of slow-read workers. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### tls_churn

The TLS exhaustion vector. It churns handshakes.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `20` | Number of TLS churn workers. |
| `mode` | `churn` | Attack mode: `churn` or `partial`. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### sip

The SIP flood vector. It runs over UDP, TCP, or TLS.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `2` | Number of SIP workers. |
| `process_workers` | `0` | Child-process shards. `0` means in-process threads. |
| `method` | `invite` | SIP method: `invite`, `bye`, `register`, or `options`. |
| `multi_attr` | `false` | Stack Via, Contact, and Record-Route headers. |
| `sip_entropy` | `true` | Add entropy to the SIP messages. |
| `transport` | `udp` | Transport: `udp`, `tcp`, or `tls`. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### dns

The DNS Water Torture vector. It sends random-label queries.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `2` | Number of DNS workers. |
| `process_workers` | `0` | Child-process shards. `0` means in-process threads. |
| `transport` | `udp` | Transport: `udp` or `tcp`. |
| `base_domain` | `null` | Base domain for random labels. It falls back to the target host. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### http2

The HTTP/2 flood vector. It needs the `h2` library.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `20` | Number of HTTP/2 workers. |
| `mode` | `rapid_reset` | Attack mode. See the `--http2-mode` flag for the full list. |
| `continuation_frame_size` | `4096` | Frame size for the continuation flood. |
| `browser_tls` | `true` | Use a browser-grade TLS fingerprint. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### websocket

The WebSocket flood vector.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `workers` | `20` | Number of WebSocket workers. |
| `mode` | `data` | Attack mode: `connect`, `data`, or `ping`. |
| `path` | `/` | WebSocket endpoint path. |
| `payload_size` | `32` | Payload size in bytes. |
| `browser_tls` | `true` | Use a browser-grade TLS fingerprint. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

### http3

The HTTP/3 vector. It needs the `aioquic` library.

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Start this vector. |
| `concurrency` | `50` | Concurrent QUIC connections. |
| `rps` | `0.0` | Target requests per second. `0` means unlimited. |
| `max_streams_per_conn` | `50` | Maximum streams per connection. |
| `timing_jitter_ms` | `0` | Maximum timing jitter in milliseconds. |

## The limits section

The resource governor enforces these caps.

| Key | Default | Meaning |
| --- | --- | --- |
| `max_rps` | `0.0` | Global request cap per second. `0` means no cap. |
| `max_bandwidth_mbps` | `0.0` | Global bandwidth cap in megabits per second. `0` means no cap. |

## The runtime section

The `runtime` section carries the operational settings.

| Key | Default | Meaning |
| --- | --- | --- |
| `resume` | `false` | Restore state from the checkpoint before the run. |
| `checkpoint_path` | `null` | Checkpoint file. It uses `~/.avalanche/checkpoint.json`. |
| `webhook_url` | `null` | URL that receives the final JSON report. |
| `export_json_path` | `null` | Extra path for the JSON report. |
| `canary_path` | `null` | Path or URL for the canary probe. |
| `canary_interval` | `10.0` | Seconds between canary probes. |
| `canary_proxy` | `null` | Clean egress proxy for canary probes. |
| `preset` | `null` | Saved preset id used as the baseline. |
| `engagement` | `null` | Engagement that records this run. |
| `scope` | `null` | Scope inside the engagement. |
| `scope_fqdns` | `[]` | Allow-list of FQDNs for the scope. |
| `record_engagement` | `true` | Record the run as an engagement run. |
| `require_scope` | `false` | Fail closed when the target is outside the allow-list. |
| `metrics_port` | `null` | Port for the Prometheus metrics endpoint. |
| `web_dashboard_port` | `null` | Port for the live web dashboard. |
| `auto_discover` | `false` | Crawl the target before the attack. |
| `crawl_depth` | `2` | Maximum crawl depth. `0` means the seed page only. |
| `max_urls` | `200` | Maximum URLs to crawl. |
| `discover_js` | `false` | Render pages in headless Chromium. Needs the `headless` extra. |
| `discover_js_max_pages` | `25` | Maximum pages to render. |
| `probe_mutations` | `false` | Run the pre-flight mutation probe. |
| `probe_max_variants` | `64` | Maximum mutation requests per endpoint. |
| `probe_mutations_only` | `false` | Cache probe winners and exit without attacking. |
| `find_origin` | `false` | Hunt for origin IPs behind the WAF. |
| `find_origin_only` | `false` | Print the origin candidates and exit. |
| `endpoint_source` | `manual` | Endpoint source: `manual`, `file`, or `discovery`. |
| `json_logs` | `false` | Emit structured JSON log lines. |
| `debug_tls` | `false` | Log detailed TLS and JA3 diagnostics at startup. |
| `dist_secret` | `null` | Secret for the distributed HMAC handshake. |
| `slo_enabled` | `false` | Run the closed-loop SLO search. |
| `slo_target_ttfb_ms` | `1800.0` | Canary reach-time ceiling in milliseconds. |
| `slo_start_rps` | `50.0` | SLO ramp start rate. |
| `slo_min_rps` | `10.0` | SLO ramp lower bound. |
| `slo_max_rps` | `100000.0` | SLO ramp upper bound. |
| `warm_clearance` | `false` | Warm cookie clearance per proxy egress. |
| `warm_cap` | `10` | Maximum egresses to warm. |
| `solver_mode` | `none` | Challenge solver mode: `none`, `headless`, `manual`, `self_hosted`, or `tspd`. |
| `solver_provider` | `""` | Provider for manual mode: `byhand` or `flare`. |
| `solver_buffer_seconds` | `15.0` | Pause after a pre-flight solve. |

## waf_bypass and cookie_file

Two top-level keys select per-run data.

| Key | Default | Meaning |
| --- | --- | --- |
| `waf_bypass` | `null` | Method id or display name of the WAF bypass. |
| `cookie_file` | `null` | Captured-cookie file to replay for the run. It falls back to `~/.avalanche/cookies.json`. |

## Example partial config

The loader completes a partial file against the canonical defaults. This
example is valid:

```yaml
target: example.com
port: 443
scheme: https
duration: 120
vectors:
  http:
    enabled: true
    concurrency: 300
    bypass_waf: true
  slowloris:
    enabled: true
    workers: 20
  udp:
    enabled: true
    workers: 4
runtime:
  canary_path: /robots.txt
  canary_interval: 5.0
```

## Related pages

- [Configuration](../user-guide/configuration.md). How to write and load config files.
- [CLI Flags](cli-flags.md). The same settings as command-line flags.
- [User Guide Overview](../user-guide/overview.md). The whole user guide.
