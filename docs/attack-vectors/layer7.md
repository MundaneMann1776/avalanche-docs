---
title: Layer 7 (Application) Attacks
description: A categorized guide to the thirty application-layer attack types in Avalanche, with the vector that runs each one.
---

# Layer 7 (Application) Attacks

This page describes the thirty attack types that abuse application
protocols. They work on top of TCP and UDP transport. Use Avalanche only
against systems you own or have written permission to test.

The catalog groups by technique and protocol. HTTP floods and slow HTTP
attacks push or hold plain TCP connections. The other families abuse the
HTTP/2, WebSocket, SIP, TLS, DNS, SMTP, and GraphQL protocols. Each section
below links to the vector knowledge base page that runs its attacks.

## HTTP floods

The `http` vector in `src/avalanche/vectors/http_flood.py` runs these
attacks. They send valid HTTP requests through the aiohttp client stack.
The vector also owns cookie capture, WAF analysis, proxy rotation, and TLS
fingerprinting. See [the HTTP knowledge base page](kb/vector-http.md).

### HTTP/S GET Flood

The `http` vector sends a continuous stream of GET requests to the target.
The attack presets the body method to GET. Use it to test static content,
caches, and CDN origin offload. Select `http_get_flood`.

### HTTP/S POST Flood

The `http` vector sends a stream of POST requests with a request body. A
POST forces the server to allocate and process the body. The attack presets
the body method to POST with a 0.3 body ratio. Use it to test dynamic
handlers and body-buffer limits. Select `http_post_flood`.

### HULK

The `http` vector sends GET requests with unique user agents and referers,
uncacheable URLs, and a fresh connection per request. Each request bypasses
the shared cache, so the origin rebuilds every response. Use it to test
cache-hit ratios under load. Select HULK mode (`hulk: true`).

### Cache Busting / Random URL Flood

The `http` vector generates random endpoint paths for each request. Random
paths defeat CDN and browser caching at the edge. Use it to test origin
capacity when the cache cannot absorb the traffic. The attack presets
random-endpoint mode.

## Slow HTTP attacks

These attacks hold HTTP connections open for a long time with a small
traffic rate. They exhaust connection slots rather than bandwidth.

### HTTP/S Slowloris

The `slowloris` vector opens many connections and sends HTTP request
headers slowly. Each open connection occupies a server slot. Use it to test
connection limits and request-timeout settings. See
[the Slowloris knowledge base page](kb/vector-slowloris.md).

### HTTP Slow Read

The `slowread` vector sends a complete request but reads the response at a
crawl. The server keeps the response buffer full while the client stalls.
Use it to test response-buffer and timeout limits. See
[the Slow Read knowledge base page](kb/vector-slowread.md).

### HTTP Slow Post

The `rudy` vector sends the request headers, then drips the body one byte
group at a time. The server waits for a body that never finishes. Use it to
test request-body timeout limits. See
[the RUDY knowledge base page](kb/vector-rudy.md).

## SMTP slow hold

### SMTP Slow Hold

The `smtp` vector holds SMTP sessions open over TCP. It offers three modes:
hold the banner, drip the EHLO command, or drip the DATA body. Use it to
test mail-server session limits. The `smtp` vector needs no optional
library. See [the SMTP knowledge base page](kb/vector-smtp.md).

## HTTP/2 frame attacks

The `http2` vector in `src/avalanche/vectors/http2.py` runs twelve attack
types. Each one abuses a different HTTP/2 frame or connection behavior. The
vector needs the optional `h2` library. See
[the HTTP/2 knowledge base page](kb/vector-http2.md).

### HTTP/2 Rapid Reset

The `http2` vector opens connections and immediately resets each stream.
The server churns through stream state at a high rate. Use it to test
stream-limit handling. Select mode `rapid_reset`.

### HTTP/2 Continuation Flood

The `http2` vector sends an endless stream of CONTINUATION frames for one
header block. The server buffers header data until the block ends. Use it
to test header-buffer limits. Select mode `continuation`.

### HTTP/2 Settings Flood

The `http2` vector floods the connection with SETTINGS frames. Each frame
forces the server to acknowledge and apply settings. Use it to test
settings-processing cost. Select mode `settings`.

### HTTP/2 Window Update Flood

The `http2` vector sends a stream of WINDOW_UPDATE frames. Each frame grows
the flow-control window and prompts the server to send more data. Use it to
test flow-control accounting. Select mode `window_update`.

### HTTP/2 Priority Churn

The `http2` vector sends a stream of PRIORITY frames that reshuffle the
stream tree. The server rebuilds its scheduling state constantly. Use it to
test the priority scheduler. Select mode `priority`.

### HTTP/2 Ping Flood

The `http2` vector floods the connection with PING frames. The server must
answer each one with a PONG. Use it to test the acknowledgement path.
Select mode `ping`.

### HTTP/2 Reset Flood

The `http2` vector opens streams and resets them in a tight loop. Each
reset consumes server bookkeeping without any data transfer. Use it to test
stream-churn limits. Select mode `reset_flood`.

### HTTP/2 Empty Frames

The `http2` vector sends valid frames that carry no payload. The server
parses each one and finds nothing to do. Use it to test the frame-parsing
hot path. Select mode `empty_frames`.

### HTTP/2 Zero-Length Headers

The `http2` vector sends header blocks whose fields have zero length. The
server must handle empty header values correctly. Use it to test header
validation. Select mode `zero_length_headers`.

### HTTP/2 GOAWAY Churn

The `http2` vector sends GOAWAY frames that force the server to drain and
close the connection. The client reopens connections in a loop. Use it to
test connection-drain cost. Select mode `goaway`.

### HTTP/2 Trailers Abuse

The `http2` vector sends HEADERS frames that carry trailing fields after
the body. The server must process trailers for every stream. Use it to test
trailer handling. Select mode `trailers`.

### HTTP/2 HPACK Bomb

The `http2` vector sends header blocks that expand to a huge size through
HPACK compression. The server must decompress each block. Use it to test
the HPACK decompression budget. Select mode `hpack_bomb`.

## DNS amplification

### DNS Amplification

The `udp` vector sends a DNS ANY query for `example.com` to DNS reflectors
on port 53. An open resolver answers with a reply many times larger than
the query. The catalog places this attack at layer 7 because it drives the
DNS application protocol. It needs a reflector file with `dns` lines. See
[the UDP knowledge base page](kb/vector-udp.md).

## WebSocket floods

### WebSocket Flood

The `websocket` vector opens RFC 6455 connections and sends masked frames.
The mode selects the traffic: `connect` holds connections, `data` sends
text frames, and `ping` sends ping frames. Use it to test WebSocket proxy
and endpoint capacity. See
[the WebSocket knowledge base page](kb/vector-websocket.md).

## SIP floods

The `sip` vector in `src/avalanche/vectors/sip.py` runs five attack types
over UDP, TCP, or TLS on ports 5060 and 5061. A method value selects the
attack. See [the SIP knowledge base page](kb/vector-sip.md).

### SIP Invite Flood

The `sip` vector floods the target with INVITE requests that start call
sessions. Each invite makes the server allocate dialog state. Use it to
test call-setup capacity. Select method `invite`.

### SIP Bye Flood

The `sip` vector floods the target with BYE requests that tear down calls.
The server searches its dialog table for each bye. Use it to test dialog
lookup under load. Select method `bye`.

### SIP REGISTER Flood

The `sip` vector floods the target with REGISTER requests that bind
addresses to identities. The server updates its registration store for each
one. Use it to test registration capacity. Select method `register`.

### SIP OPTIONS Flood

The `sip` vector floods the target with OPTIONS requests that probe server
capabilities. The server answers each one. Use it to test the stateless
response path. Select method `options`.

### SIP Multi Attribute Flood

The `sip` vector sends INVITE requests that stack many Via, Contact, and
Record-Route headers in each message. The server must parse every header
attribute. Use it to test header-parsing cost. Select method `invite` with
multi-attribute mode on.

## TLS exhaustion

### TLS/SSL Exhaustion

The `tls_churn` vector opens TLS handshakes against the target. The mode
selects the traffic: `churn` completes handshakes in a loop, and `partial`
sends only part of a ClientHello. Each handshake costs the server a
full TLS state machine. Use it to test TLS-termination capacity. See
[the TLS Churn knowledge base page](kb/vector-tls-churn.md).

## DNS water torture

### DNS Water Torture

The `dns` vector sends random-label queries under a base domain. Each query
has a unique name, so the target resolver and any upstream cache miss on
every one. Use it to test authoritative-server and cache behavior. The
vector uses the target host as the base domain unless you set one. See
[the DNS knowledge base page](kb/vector-dns.md).

## GraphQL floods

### GraphQL Query Flood

The `http` vector sends JSON POST requests to the `/graphql` endpoint. The
queries rotate through templates, and the attack can batch multiple
operations per request. Use it to test GraphQL resolvers and query-depth
limits. The attack presets GraphQL mode with the body method POST. See
[the HTTP knowledge base page](kb/vector-http.md).

## Layer 7 attack summary

| Attack type | Vector | What it does | Typical use |
|---|---|---|---|
| HTTP/S GET Flood | `http` | GET request stream | Test static content and caches |
| HTTP/S POST Flood | `http` | POST request stream with body | Test dynamic handlers |
| HULK | `http` | Unique uncacheable GET requests | Test cache-hit ratios |
| Cache Busting / Random URL Flood | `http` | Random endpoint paths | Test origin without cache help |
| HTTP/S Slowloris | `slowloris` | Slow header send | Test connection limits |
| HTTP Slow Read | `slowread` | Slow response read | Test response-buffer limits |
| HTTP Slow Post | `rudy` | Dripped request body | Test body-timeout limits |
| SMTP Slow Hold | `smtp` | Held SMTP sessions | Test mail-server session limits |
| HTTP/2 Rapid Reset | `http2` | Instant stream resets | Test stream-limit handling |
| HTTP/2 Continuation Flood | `http2` | Endless CONTINUATION frames | Test header-buffer limits |
| HTTP/2 Settings Flood | `http2` | SETTINGS frame flood | Test settings-processing cost |
| HTTP/2 Window Update Flood | `http2` | WINDOW_UPDATE flood | Test flow-control accounting |
| HTTP/2 Priority Churn | `http2` | PRIORITY frame churn | Test the priority scheduler |
| HTTP/2 Ping Flood | `http2` | PING frame flood | Test the ack path |
| HTTP/2 Reset Flood | `http2` | Rapid stream resets | Test stream-churn limits |
| HTTP/2 Empty Frames | `http2` | Payload-less frames | Test the frame-parsing path |
| HTTP/2 Zero-Length Headers | `http2` | Empty header values | Test header validation |
| HTTP/2 GOAWAY Churn | `http2` | Connection-drain churn | Test drain cost |
| HTTP/2 Trailers Abuse | `http2` | Trailing header abuse | Test trailer handling |
| HTTP/2 HPACK Bomb | `http2` | Expanding header blocks | Test HPACK budget |
| DNS Amplification | `udp` | DNS ANY query to reflectors | Multiply traffic through open resolvers |
| WebSocket Flood | `websocket` | Masked-frame flood | Test WebSocket capacity |
| SIP Invite Flood | `sip` | INVITE flood | Test call-setup capacity |
| SIP Bye Flood | `sip` | BYE flood | Test dialog lookup |
| SIP REGISTER Flood | `sip` | REGISTER flood | Test registration capacity |
| SIP OPTIONS Flood | `sip` | OPTIONS flood | Test the stateless path |
| SIP Multi Attribute Flood | `sip` | Header attribute stacking | Test header parsing |
| TLS/SSL Exhaustion | `tls_churn` | TLS handshake churn | Test TLS-termination capacity |
| DNS Water Torture | `dns` | Random-label queries | Test authoritative and cache behavior |
| GraphQL Query Flood | `http` | GraphQL POST queries | Test resolver limits |

## Related pages

- [Attack Vectors overview](overview.md)
- [Layer 3 (Network) attacks](layer3.md)
- [Layer 4 (TCP/UDP) attacks](layer4.md)
- [Vector Reference](reference.md)
- [Knowledge base: HTTP vector](kb/vector-http.md)
- [Knowledge base: HTTP/2 vector](kb/vector-http2.md)
- [Knowledge base: UDP vector](kb/vector-udp.md)
- [Knowledge base: HTTP flow player](kb/vector-http-flow.md)
