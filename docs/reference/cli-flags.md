---
title: CLI Flags
description: Every command-line flag of Avalanche, grouped by purpose.
---

# CLI Flags

This page lists every command-line flag of `avalanche`. The flags are
grouped by purpose. Each table shows the flag and its meaning. Where the
help gives a default, the table includes it.

Use Avalanche only against systems you own or have written permission to
test.

::: tip
`avalanche --help` is always current. When a flag or default differs from
this page, trust the help output.
:::

## Target and connection

These flags set the target and how Avalanche connects to it.

| Flag | Meaning |
| --- | --- |
| `-h, --help` | Show the help message and exit. |
| `-t, --target` | Target hostname or IP. |
| `-p, --port` | Target port (default: 80, or the URL port). |
| `--scheme` | Request scheme: `auto`, `http`, or `https` (default: `auto`). `auto` means HTTPS on ports 443 and 8443, and HTTP elsewhere. |
| `-d, --duration` | Run length in seconds. Default 0 means run until stopped. |

## Presets and config

These flags choose a configuration baseline for the run.

| Flag | Meaning |
| --- | --- |
| `--preset` | Use a saved attack profile as the baseline. Other flags override its fields. Available: `api-stress`, `brute-force`, `cdn-bypass`, `quick-health`, `stealth`. |
| `-c, --config` | Load a YAML or JSON config file. |

## WAF bypass and cookie actions

These flags select a WAF bypass method and manage captured cookies.

| Flag | Meaning |
| --- | --- |
| `--waf-bypass` | Apply a saved WAF bypass method on top of the config. Accepts a method id or display name. Run `avalanche --help` for the full catalog. |
| `--cookie-file` | Replay captured WAF cookies from this file for the run target (default: `~/.avalanche/cookies.json`). |
| `--capture-cookie` | Perform one browserless WAF cookie capture for a target, save it, print the result as JSON, and exit. |
| `--capture-proxy` | Egress proxy for `--capture-cookie`. The captured cookies bind to this egress. |
| `--list-cookies` | List saved cookie captures as JSON, newest first, and exit. |
| `--delete-cookie` | Delete the saved cookie capture for a target, print JSON, and exit. |
| `--open-browser` | Open a target in the default real browser for a manual challenge solve, print the URL as JSON, and exit. |
| `--import-cookies` | Read pasted cookies from stdin for a target, save them, verify one replay request, and exit. |
| `--verify-cookies` | Send one benign replay request with the saved cookies for a target and print the verdict as JSON. |
| `--probe-edge` | Real-edge check: HEAD, `/cdn-cgi/trace`, and cookie replay. It proves fingerprint acceptance without flood traffic. |
| `--warm-clearance` | Solve the target once per top-N proxy egress before workers start. |
| `--warm-cap` | Number of egresses to warm (default: 10). |
| `--solve-headless` | Clear a target once in headless Chromium, save and verify. Needs the `headless` extra. |
| `--solve-flare` | Solve a target through a FlareSolverr service, save the cookies, verify one replay request, and exit. Uses `--solver-url` (default: `http://localhost:8191/v1`). |

## Solver flags

These flags control the challenge solver for the pre-flight gate.

| Flag | Meaning |
| --- | --- |
| `--solver-mode` | Challenge solver mode: `none`, `headless`, `manual`, `self_hosted`, or `tspd`. Default `none`. |
| `--solver-provider` | Provider for the manual solver mode: `byhand` (real browser) or `flare` (FlareSolverr). |
| `--solver-buffer` | Seconds to wait after a successful pre-flight solve before vectors start. |
| `--solver-url` | POST challenge page HTML and headers to this URL. The service returns JSON in the form `{"cookies": {...}}`. |

## HTTP vector

These flags tune the HTTP flood vector.

| Flag | Meaning |
| --- | --- |
| `--http` | HTTP concurrency. |
| `--http-rps` | HTTP target requests per second. 0 means unlimited. |
| `--bypass-waf` | Browser-grade mode: real Chrome TLS and HTTP/2 fingerprints. Needs the `browser` extra. |
| `--browser-impersonate` | curl_cffi impersonation target for browser-grade mode. Default is the engine default, `chrome146`. Example: `chrome131`. |
| `--session-sticky` | Enable session stickiness. |
| `--cookie-flood` | Enable cookie flooding. |
| `--random-endpoints` | Generate random endpoints. |
| `--hulk` | HULK mode: unique user agent and referer, uncacheable URLs, and a fresh connection per request. |
| `--graphql` | GraphQL flood mode: JSON POSTs to `/graphql` with rotating query templates. |
| `--graphql-batch` | GraphQL mode: include multi-operation batch requests. |
| `--use-proxies` | Enable proxy rotation for the HTTP vector. |
| `--proxy-file` | Proxy file. |
| `--fetch-proxies` | Download merged public HTTP proxy lists into `--proxy-cache` before validation. |
| `--proxy-cache` | Path for fetched proxies (default: `~/.avalanche/public_proxies.cache.txt`). |
| `--proxy-sticky` | Keep one proxy per HTTP worker until eviction or shutdown. |
| `--tls-randomize` | Rotate TLS client settings per request, correlated with browser profiles. HTTPS only. |
| `--tls-pool-size` | Number of pre-built TLS contexts when `--tls-randomize` is set (default: 8). |
| `--human-timing` | Use heavy-tailed delays between bursts instead of uniform micro-jitter. |

## HTTP flow

These flags control the HTTP flow player.

| Flag | Meaning |
| --- | --- |
| `--http-flow-dir` | Directory of YAML HTTP flow definitions. Enables the `http_flow` vector. |
| `--http-flow` | HTTP flow player worker count. Default 100 when `--http-flow-dir` is set. |
| `--http-flow-rps` | Token-bucket RPS for the flow player. 0 means unlimited. Default comes from the preset or is 0. |
| `--flow-fuzz` | Enable duplicate query parameter, JSON, and XML fuzzing in the flow player. |

## Slow and protocol vectors

These flags enable and tune the slow and protocol vectors. Each vector has
its own subsection.

::: warning
The `icmp`, `syn`, and `rawip` vectors need root and Scapy. The `http3`
vector needs the `aioquic` library. The `http2` vector needs the `h2`
library. Start with `sudo` when you use raw sockets.
:::

### Slowloris

| Flag | Meaning |
| --- | --- |
| `--slowloris` | Slowloris worker count. |

### RUDY

| Flag | Meaning |
| --- | --- |
| `--rudy` | RUDY worker count. |

### UDP storm and amplification

| Flag | Meaning |
| --- | --- |
| `--udp` | UDP worker count. |
| `--udp-payload-size` | UDP storm payload size in bytes. Default 8192, maximum 65507. It is clamped to 1400 when `dont_fragment` is enabled. |
| `--reflector-file` | UDP amplifier list. Lines use the form `ip:port:proto` with `dns`, `ntp`, `cldap`, or `ssdp`. It enables UDP amplification instead of a UDP storm. |
| `--amplify-spoof` | Spoof the victim IPv4 as the UDP source toward reflectors. Needs root and Scapy. |

### Reflector pipeline

| Flag | Meaning |
| --- | --- |
| `--scan-reflectors` | Probe `--reflector-file` once each, print the amplification table, and exit. |
| `--harvest-reflectors` | Fetch DNS resolver lists, probe them, and write a validated pool. |
| `--harvest-only` | With `--harvest-reflectors`: write candidates and exit before probing. |
| `--probe-only` | Probe an existing candidates file and write a validated pool. It skips fetching. |
| `--reflector-out` | Validated pool output path (default: `~/.avalanche/reflectors/reflectors.txt`). |
| `--candidates-out` | Harvest candidates output path (default: `~/.avalanche/reflectors/candidates.txt`). |
| `--max-per-proto` | Cap the candidate count per protocol before probing. |
| `--probe-repeats` | UDP probes per reflector. Default 3. A pass needs 2 of 3. |
| `--probe-timeout` | Per-probe UDP timeout in seconds (default: 2.0). |
| `--shodan-key` | Shodan API key (default: `$SHODAN_API_KEY`). |
| `--shodan-pages` | Shodan result pages per protocol. About 100 results per page. Default 1. |
| `--factor-dns` | Minimum amplification factor for DNS reflectors. |
| `--factor-ntp` | Minimum amplification factor for NTP reflectors. |
| `--factor-cldap` | Minimum amplification factor for CLDAP reflectors. |
| `--factor-ssdp` | Minimum amplification factor for SSDP reflectors. |
| `--factor-memcached` | Minimum amplification factor for memcached reflectors. |
| `--factor-chargen` | Minimum amplification factor for chargen reflectors. |
| `--factor-proto` | Minimum amplification factor override for any registered UDP protocol. Repeatable. Example: `--factor-proto coap=30`. |

### Proxy pipeline

| Flag | Meaning |
| --- | --- |
| `--scan-proxies` | Probe `--proxy-file` once each, print a proxy table, and exit. |
| `--harvest-proxies` | Fetch public proxy lists, probe them, and write a validated pool. |
| `--proxy-probe-only` | With `--harvest-proxies`: probe this candidates file and write the pool. |
| `--proxies-out` | Validated proxy pool output path (default: `~/.avalanche/proxies/proxies.txt`). |
| `--proxy-candidates-out` | Proxy candidates output path (default: `~/.avalanche/proxies/candidates.txt`). |
| `--proxy-validation-url` | Validation URL for proxy probes (default: `https://www.gstatic.com/generate_204`). |
| `--proxy-probe-timeout` | Per-proxy probe timeout in seconds (default: 5.0). |
| `--max-proxy-candidates` | Harvest candidate cap (default: 5000). |

### Spoof sources

| Flag | Meaning |
| --- | --- |
| `--harvest-spoof-sources` | Fetch the public BGP route table and write managed spoof ranges. |
| `--spoof-out` | Spoof ranges output path (default: `~/.avalanche/spoof/ranges.txt`). |
| `--spoof-max-ranges` | Maximum managed spoof ranges (default: 100000). |
| `--spoof-generate` | Generate N random public `/24` spoof ranges and write them. |
| `--spoof-import` | Import a plain-text or CAIDA CSV spoof-range file. |
| `--scan-spoof-sources` | Print the managed spoof-range summary and exit. |
| `--spoof-ranges-file` | Spoof-source CIDR file used by SYN, raw-IP, and ICMP spoofing. |

### ICMP

| Flag | Meaning |
| --- | --- |
| `--icmp` | ICMP worker count. |
| `--icmp-fragment` | Split ICMP packets into IPv4 fragments. Needs root and Scapy. |
| `--icmp-frag-size` | ICMP fragment payload size in bytes (default: 24). |
| `--icmp-smurf` | Smurf mode: ICMP echo with a spoofed source to a directed broadcast. |
| `--icmp-smurf-src` | Victim IP to spoof as the ICMP source. Default is a random public IP. |
| `--icmp-pod` | Ping of Death mode: an oversized fragmented ICMP echo. |

### SYN

| Flag | Meaning |
| --- | --- |
| `--syn` | TCP SYN worker count. Needs root and Scapy. |
| `--syn-spoof` | Spoof random source IPv4. Needs root and Scapy. |
| `--syn-ip-version` | IP family for the SYN family of attacks (default: 4). |
| `--syn-hop-limit` | IPv6 hop limit for SYN packets, 1 to 255. Default 64. IPv6 only. |
| `--syn-flags` | TCP flag combination. Example: `S`, `SA`, `R`, `PA`, `SARFU`. Default `S`. |
| `--syn-fragment` | Split TCP packets into IPv4 fragments. Needs root and Scapy. |
| `--syn-frag-size` | TCP fragment payload size in bytes (default: 24). |
| `--syn-out-of-state` | Send TCP packets with random sequence, acknowledgment, and flags outside any session. |

### Raw IP

| Flag | Meaning |
| --- | --- |
| `--rawip` | Raw IP protocol worker count. Needs root and Scapy. |
| `--rawip-proto` | IPv4 protocol number for the raw IP flood. Default 47 (GRE). |
| `--rawip-teardrop` | Teardrop mode: overlapping IP fragments. |

### Slow read

| Flag | Meaning |
| --- | --- |
| `--slow-read` | HTTP Slow Read worker count. It sends the full request and reads the response at a crawl. |

### TLS churn

| Flag | Meaning |
| --- | --- |
| `--tls-churn` | TLS exhaustion worker count. It churns handshakes or floods partial ClientHello messages. |
| `--tls-churn-mode` | TLS exhaustion mode: `churn` or `partial`. Default `churn`. |

### SIP

| Flag | Meaning |
| --- | --- |
| `--sip` | SIP flood worker count. It runs over UDP, TCP, or TLS. |
| `--sip-method` | SIP method to flood: `invite`, `bye`, `register`, or `options`. Default `invite`. |
| `--sip-multi-attr` | SIP multi-attribute mode: stack Via, Contact, and Record-Route headers. |
| `--sip-transport` | SIP transport: `udp`, `tcp`, or `tls`. Default `udp`. |

### DNS

| Flag | Meaning |
| --- | --- |
| `--dns` | DNS Water Torture worker count. It sends random-label queries over UDP or TCP port 53. |
| `--dns-transport` | DNS transport: `udp` or `tcp`. Default `udp`. |
| `--dns-domain` | Base domain for random-label queries. Default is the target host. |

### HTTP/3

| Flag | Meaning |
| --- | --- |
| `--http3` | HTTP/3 (QUIC) worker count. |
| `--http3-rps` | HTTP/3 requests per second cap. |

### HTTP/2

| Flag | Meaning |
| --- | --- |
| `--http2` | HTTP/2 flood worker count. |
| `--http2-mode` | HTTP/2 attack mode. Default `rapid_reset`. Available: `rapid_reset`, `continuation`, `settings`, `window_update`, `priority`, `ping`, `reset_flood`, `empty_frames`, `zero_length_headers`, `goaway`, `trailers`, `hpack_bomb`. |

### WebSocket

| Flag | Meaning |
| --- | --- |
| `--websocket` | WebSocket flood worker count. It connects, sends data, or pings. |
| `--websocket-mode` | WebSocket attack mode: `connect`, `data`, or `ping`. Default `data`. |
| `--websocket-path` | WebSocket endpoint path (default: `/`). |

### SMTP

| Flag | Meaning |
| --- | --- |
| `--smtp` | Run slow SMTP attacks. Modes: `banner_hold`, `command_drip`, or `data_drip` over TCP 25 or 587. |
| `--smtp-mode` | SMTP attack mode: `banner_hold`, `command_drip`, or `data_drip`. Default `command_drip`. |
| `--smtp-workers` | SMTP slow-attack worker count (default: 10). |
| `--smtp-port` | SMTP target port when it differs from `-p`. Default follows `-p`. |

## Playbook and config

A playbook defines a target, port, and phases in one file.

| Flag | Meaning |
| --- | --- |
| `--playbook` | Load a YAML playbook with target, port, and phases. It takes precedence over `--config` when you set both. |

## Checkpoint and resume

These flags control run state persistence.

| Flag | Meaning |
| --- | --- |
| `--resume` | Hydrate cookies, stats, proxy scores, and token buckets from the checkpoint before the run. |
| `--checkpoint` | Checkpoint JSON path (default: `~/.avalanche/checkpoint.json`). |

## Distributed

These flags control the controller and agent roles.

| Flag | Meaning |
| --- | --- |
| `--mode` | Distributed role: `standalone`, `controller`, or `agent`. A controller listens for agents. An agent joins a controller. |
| `--dist-bind-host` | Controller listen address (default: `0.0.0.0`). |
| `--dist-bind-port` | Controller listen port (default: 9753). |
| `--dist-controller` | Agent: the controller address (default: `127.0.0.1:9753`). |
| `--agent-max-rps` | Agent: the declared `max_rps` for load slicing. 0 means self-benchmark on connect and report the measured capacity. Explicit values skip the benchmark. |
| `--agent-benchmark-targets` | Agent: explicit benchmark endpoints, comma-separated. Default is the local loopback sink. The run target is never benchmarked automatically. |
| `--no-agent-benchmark` | Controller: skip the agent self-benchmark phase and use the declared `max_rps`. |
| `--benchmark-timeout` | Controller: seconds to wait for capacity reports after the join window (default: 25). |
| `--dist-secret` | Shared secret for the controller and agent HMAC handshake. Both sides must match. |

## Reporting and engagement

These flags control report output and engagement recording.

| Flag | Meaning |
| --- | --- |
| `--webhook` | POST the final JSON report to this URL after a run. Best-effort. Failures are logged only. |
| `--export-json` | Write the same JSON report to this path in addition to `~/.avalanche/report_*.json`. |
| `--engagement` | Attach this run to an engagement. It is created when missing. |
| `--scope` | Attach this run to a scope inside the engagement. |
| `--fqdns` | Comma-separated FQDNs for the scope. Use it with `--scope`. |
| `--no-record-engagement` | Disable automatic engagement and run recording. |
| `--require-scope` | Fail closed: the run needs `--fqdns`, and the target must be on that allow-list. |

## Canary and SLO

These flags control the health probe and the closed-loop SLO mode.

| Flag | Meaning |
| --- | --- |
| `--canary-path` | Periodic clean-traffic health probe. A path such as `/robots.txt` is appended to the target host and port. Absolute URLs are used as-is. The probe uses a fresh session, no proxy, and a random browser fingerprint. |
| `--canary-interval` | Seconds between canary probes. It must be greater than 0. Default 10. |
| `--canary-proxy` | Send canary probes through this proxy. It is a clean egress, not the attacking IP. The up or down verdict is proven, not inferred from a blocked IP. |
| `--slo` | Closed-loop SLO mode. Ramp the HTTP load until the canary crosses the target reach time, then hold at that knee. Needs `--canary-path`. The report records the knee. |
| `--slo-target-ttfb` | SLO reach-time ceiling in milliseconds. A canary TTFB above it is a breach (default: 1800). |
| `--slo-start-rps` | SLO ramp start rate (default: 50). |
| `--slo-min-rps` | SLO ramp lower bound (default: 10). |
| `--slo-max-rps` | SLO ramp upper bound. The search stops here if no knee appears (default: 100000). |

## Daemon

| Flag | Meaning |
| --- | --- |
| `--daemon` | Run as a Unix-socket JSON control plane. Commands: `start`, `stop`, `status`. Default socket: `/tmp/avalanche.sock`. |
| `--daemon-token` | Require this token in every daemon command. Omit it for local-trust mode. |

## Body and adaptive flags

| Flag | Meaning |
| --- | --- |
| `--body-method` | HTTP method for body-inclusive requests: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, or `mixed`. |
| `--body-ratio` | Fraction of requests that include a body. Range 0.0 to 1.0. |
| `--tcp-connector-limit` | Maximum concurrent TCP connections. Default is automatic, based on concurrency. |
| `--adaptive-targeting` | Dynamically rebalance endpoint weights from live metrics. Use `--no-adaptive-targeting` to disable it. |
| `--endpoint-stats` | Track per-endpoint response codes and latency. Use `--no-endpoint-stats` to disable it. |

## Metrics and dashboard

| Flag | Meaning |
| --- | --- |
| `--metrics-port` | Expose Prometheus metrics on this port. |
| `--web-dashboard` | Serve a live web dashboard on `127.0.0.1:PORT`. Default port 8787 when you give no port. |
| `--web-dashboard-only` | Serve the web dashboard alone and start no attack vectors. Default port 8787. |
| `--wizard` | Run the terminal setup wizard instead of the web dashboard. |
| `--json-logs` | Emit structured JSON log lines. Use `--no-json-logs` to disable them. |

## Discovery and recon

| Flag | Meaning |
| --- | --- |
| `--auto-discover` | Crawl the target to discover endpoints before the attack. It uses a recursive HTML parser. Use `--no-auto-discover` to disable it. |
| `--crawl-depth` | Maximum crawl depth for `--auto-discover`. Default 2. 0 means the seed page only. |
| `--max-urls` | Maximum URLs to crawl for `--auto-discover` (default: 200). |
| `--discover-js` | Render discovered pages in headless Chromium during `--auto-discover`. Needs the `headless` extra. Use `--no-discover-js` to disable it. |
| `--discover-js-max-pages` | Maximum pages to render for `--discover-js` (default: 25). |
| `--probe-mutations` | Pre-flight mutation probe. It runs a bounded encoding-by-method matrix against endpoints and injects bypass candidates into the HTTP vector. Use `--no-probe-mutations` to disable it. |
| `--probe-max-variants` | Maximum mutation requests per endpoint for `--probe-mutations` (default: 64). |
| `--probe-mutations-only` | Run the mutation probe, cache the winners, and exit without attacking. |
| `--find-origin` | Report-only origin hunt. It finds candidate origin IPs behind the WAF. Nothing is injected or attacked. Use `--no-find-origin` to disable it. |
| `--find-origin-only` | Run the origin hunt, print the ranked candidates, and exit without attacking. |
| `--endpoints-file` | Load HTTP flood endpoints from a file. One path or URL per line. `#` comments and blank lines are skipped. |

## Subdomains

| Flag | Meaning |
| --- | --- |
| `--subdomain-only` | Run subdomain discovery for the target and exit without attacking. |
| `--subdomain-brute` | Enable DNS brute force during subdomain discovery. Use `--no-subdomain-brute` to disable it. Default is disabled for fast scans. |
| `--subdomain-brute-limit` | Maximum brute-force names per scan. Default is the selected wordlist size. |
| `--subdomain-wordlist` | Custom wordlist file for subdomain brute force. |
| `--subdomain-wordlist-key` | Bundled wordlist key. The repeat scan limit follows the list size. Known: `top100`, `top110k`, `top50k`, `top5k`. |
| `--subdomain-source` | Discovery module to include. Repeatable. Known: `anubis`, `bufferover`, `certspotter`, `crtname`, `dataset`, `hackertarget`, `otx`, `rapiddns`, `urlscan`, `wayback`. Default is all modules. |
| `--subdomain-historical` | Include historical (unresolved) names as takeover candidates. Use `--no-subdomain-historical` to disable it. Default is off, alive only. |

## Origin

| Flag | Meaning |
| --- | --- |
| `--origin-only` | Find the origin (backend) IP behind the CDN or WAF for the target and exit. |
| `--origin-source` | Origin source to include. Repeatable. Known: `certspotter`, `crtname`, `dnsdumpster`, `hackertarget`, `otx`, `shodan`, `viewdns`, `wayback`. Default is all non-keyed sources. Shodan is used only when a key is set. |
| `--origin-validate` | Probe candidate IPs to confirm they serve the target. Default is on. Use `--no-origin-validate` to disable it. |
| `--origin-use-dataset` | Enrich and cache results in the local origin dataset. Default is on. Use `--no-origin-use-dataset` to disable it. |
| `--origin-shodan` | Use Shodan reverse-DNS and IP history. Needs a configured API key. Use `--no-origin-shodan` to disable it. |

## WAF signatures

| Flag | Meaning |
| --- | --- |
| `--waf-signatures-dir` | WAF signature YAML directory (default: `~/.avalanche/waf_signatures`). |
| `--validate-waf-signatures` | Validate all WAF signatures and run their embedded fixtures. |
| `--list-waf-signatures` | List the loaded WAF signatures. |
| `--add-waf-signature` | Validate and add a WAF signature YAML file. |
| `--remove-waf-signature` | Remove a WAF signature by name. |

## Validation flags

| Flag | Meaning |
| --- | --- |
| `--validate` | Validate the config and exit. It sends no traffic. |
| `--dry-run` | Print the resolved config and exit. |
| `--debug-tls` | Log detailed TLS and JA3 cipher diagnostics at startup. |
| `--compare` | Run two configs back-to-back and print a comparison report. |

## Related pages

- [Command-Line Interface](../user-guide/cli.md) — how to build a run in one line.
- [Configuration Reference](config-reference.md) — the same settings as config keys.
- [User Guide Overview](../user-guide/overview.md) — the whole user guide.
