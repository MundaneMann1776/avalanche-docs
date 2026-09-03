---
title: "HTTP/S flood family (vector: http)"
description: How the http vector runs GET and POST floods, HULK, GraphQL floods, and cache busting, plus its evasion and targeting options.
---

# HTTP/S flood family

The `http` vector runs the main HTTP and HTTPS application floods. It
produces five attack types: HTTP/S GET Flood, HTTP/S POST Flood, HULK,
GraphQL Query Flood, and Cache Busting / Random URL Flood. The vector works
at OSI layer 7. Use Avalanche only against systems you own or have written
permission to test.

## When to use

Use the vector for load and resilience tests against web servers, APIs,
and CDN-fronted origins.

Good test targets include:

- Your own application behind a content delivery network or WAF.
- A staging server for an API or a web front end.
- A GraphQL endpoint under realistic query load.

Choose the flood shape by the behavior you test. A GET flood stresses the
read path and the caches. A POST flood adds body parsing and application
logic. HULK probes cache-busting and per-request connection handling.
GraphQL mode stresses query execution. Random endpoints test how the server
treats unknown or un-cacheable URLs.

## How it works

The class `AdvancedHTTPFlood` in `vectors/http_flood.py` drives the vector.
It subclasses `BaseHTTPVector`, which supplies cookie extraction, WAF
response analysis, the proxy pool, the token bucket, and TLS fingerprinting.
The vector starts one asyncio worker task per unit of `concurrency`.

A worker picks an endpoint from a weighted distribution. Static asset paths
carry less weight than dynamic pages and API routes. When discovery or a
file supplies real paths, those replace the generic list. With a fixed
probability the worker adds `id`, `page`, or a cache-bust `_` parameter to
the query string. The retry loop treats blocks and challenges differently
from transport errors. A challenge is solved once on the same egress. A
hard block rotates the proxy once, then drops.

Mode flags change the request shape in the worker:

- GraphQL mode posts JSON to `/graphql`. It rotates introspection, alias
  amplification, and recursive query templates. `graphql_batch` adds a
  multi-operation batch request.
- HULK mode sends `Connection: close`, forces a fresh connection per
  request, and adds random un-cacheable URL paths. Header building stays on
  the shared path, so the request still gets a rotated user agent and a
  plausible referer.
- The body generator activates when `body_method` is not `GET` and
  `body_ratio` is above zero. A share of requests equal to `body_ratio`
  carries a generated body.

The vector sends bodies through `BodyGenerator` in `core/body_gen.py`. It
makes JSON objects, XML documents, URL-encoded forms, and multipart bodies.
Sizes range from 200 to 500 bytes (small), 1 to 5 kilobytes (medium), and
10 to 50 kilobytes (large). JSON is three times more likely than the other
types.

Every response feeds the stats collector and the WAF detector. The detector
classifies responses as clean, blocked, challenged, or bypassed. Responses
also update the endpoint tracker when per-endpoint stats or adaptive
targeting are active.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| HTTP/S GET Flood | L7 | Default behavior. GET requests; optionally a body when `body_method` and `body_ratio` are set. |
| HTTP/S POST Flood | L7 | Set `body_method` to `POST`. A share equal to `body_ratio` of requests sends a POST with a generated body; the rest stay GET. The dashboard preset writes `POST` with ratio `0.3`. |
| HULK | L7 | Set `hulk` to `True`. Random paths, `Connection: close`, fresh connection per request. |
| GraphQL Query Flood | L7 | Set `graphql` to `True`. JSON POSTs to `/graphql`. Add `graphql_batch` for batches. |
| Cache Busting / Random URL Flood | L7 | Set `random_endpoints` to `True` to add random paths to the endpoint mix. |

## Configuration

The typed model is `HttpVectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `http` key.

The typed model nests the proxy block under `proxies` and the TLS block
under `tls`. The engine and the CLI write the flat keys shown above, such
as `use_proxies` and `tls_randomize`. Both shapes coerce to the same model.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `True` | Start the vector in this run. |
| `concurrency` | `200` | Number of concurrent worker tasks. Range 1 to 10000. |
| `rps` | `0` | Token-bucket rate in requests per second. `0` means unlimited. |
| `bypass_waf` | `False` | Use browser-grade TLS and HTTP/2 fingerprints through curl_cffi. |
| `session_sticky` | `False` | Send a fixed `sessionid` cookie per worker. |
| `cookie_flood` | `False` | Merge a random cookie set into each request. |
| `random_endpoints` | `False` | Add random URL paths to the endpoint distribution. |
| `hulk` | `False` | HULK mode. Fresh connection and un-cacheable URLs per request. |
| `graphql` | `False` | Post GraphQL queries to `/graphql`. |
| `graphql_batch` | `False` | Include multi-operation batch requests in GraphQL mode. |
| `user_agent_rotation` | `True` | Rotate the user agent per request on the aiohttp path. |
| `compression_hints` | `True` | Send `Accept-Encoding: gzip, deflate, br`. |
| `use_proxies` | `False` | Enable the proxy pool. |
| `proxy_file` | `proxies.txt` | Proxy list file; the managed pool is used when the file is missing. |
| `fetch_proxies` | `False` | Fetch public proxy lists into the cache before validation. |
| `proxy_sticky` | `False` | Keep one proxy per worker until eviction or shutdown. |
| `tls_randomize` | `False` | Rotate TLS client settings per request on HTTPS. |
| `tls_pool_size` | `8` | Number of pre-built TLS contexts for rotation. |
| `solver_url` | `None` | URL that receives challenge HTML and returns cookies as JSON. |
| `solver_protocol` | `None` | `none`, `http`, or `tspd`. Chooses the solver path. |
| `solver_api_key` | `None` | API key for the native TSPD solver. |
| `solver_base_url` | `None` | Base URL for the TSPD solver service. |
| `browser_impersonate` | `""` | curl_cffi impersonation target. Empty means `chrome146`. |
| `human_timing` | `False` | Use heavy-tailed delays instead of uniform micro-jitter. |
| `body_method` | `GET` | Method for requests that carry a body. One of `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `mixed`. |
| `body_ratio` | `0.3` | Fraction of requests that include a body. Range 0.0 to 1.0. |
| `adaptive_targeting` | `False` | Rebalance endpoint weights from live availability metrics. |
| `adaptive_targeting_interval` | `30.0` | Seconds between adaptive rebalancing passes. |
| `endpoint_stats` | `False` | Track per-endpoint status codes and latency. |
| `tcp_connector_limit` | `None` | Max concurrent TCP connections. `None` means automatic from concurrency. |
| `timing_jitter_ms` | `0` | Add up to this many milliseconds of random delay between requests. |
| `extra_endpoints` | `[]` | Extra paths used instead of the generic endpoint list. |

## Command-line flags

The flags below enable and shape the `http` vector. Spell them exactly as
`ui/cli.py` defines them.

| Flag | Meaning |
|---|---|
| `--http N` | Enable the vector and set the concurrency. |
| `--http-rps N` | Target rate in requests per second. `0` means unlimited. |
| `--bypass-waf` | Use browser-grade Chrome TLS and HTTP/2 fingerprints. Needs the `browser` extra. |
| `--browser-impersonate TARGET` | curl_cffi impersonation target for browser-grade mode. Default `chrome146`. |
| `--session-sticky` | Send a fixed session cookie per worker. |
| `--cookie-flood` | Add random cookie sets to requests. |
| `--random-endpoints` | Generate random endpoint paths. |
| `--hulk` | HULK mode. Un-cacheable URLs, fresh connection per request. UA rotation stays on by default. |
| `--graphql` | Post GraphQL queries to `/graphql`. |
| `--graphql-batch` | Include multi-operation GraphQL batches. |
| `--use-proxies` | Enable proxy rotation. |
| `--proxy-file PATH` | Proxy list file. |
| `--fetch-proxies` | Download public proxy lists into the cache. |
| `--proxy-cache PATH` | Cache path for fetched proxies. |
| `--proxy-sticky` | Keep one proxy per HTTP worker. |
| `--tls-randomize` | Rotate TLS client settings per request on HTTPS. |
| `--tls-pool-size N` | Number of pre-built TLS contexts. Default `8`. |
| `--solver-url URL` | Post challenge HTML to this URL; expect JSON `{"cookies": {...}}`. |
| `--human-timing` | Use heavy-tailed delays between bursts. |
| `--body-method METHOD` | Method for body-inclusive requests. |
| `--body-ratio RATIO` | Fraction of requests that include a body. |
| `--tcp-connector-limit N` | Cap on concurrent TCP connections. |
| `--adaptive-targeting` | Rebalance endpoint weights from live metrics. |
| `--endpoint-stats` | Track per-endpoint response codes and latency. |
| `--auto-discover` | Crawl the target and load real paths into the vector. |
| `--endpoints-file FILE` | Load endpoints from a file, one path per line. |
| `--warm-clearance` | Solve the target once per top proxy egress before workers start. |
| `--warm-cap N` | How many egresses to warm. Default `10`. |

The solver flags `--solver-mode`, `--solver-provider`, and `--solver-buffer`
control the pre-flight challenge gate for the whole run.

## Modifiers

The dashboard exposes these toggles for the `http` vector attack types. The
matrix in `docs/ATTACK_TYPE_MODIFIER_MATRIX.md` lists the status per attack.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between requests. |
| Cookie Rotation | `cookie_flood` | Merge random cookie sets into requests. |
| User Agent Rotation | `user_agent_rotation` | Default on. Vary the user agent per request. |
| Compression Hints | `compression_hints` | Default on. Advertise `gzip, deflate, br`. |
| TLS Randomize | `tls_randomize`, `tls_pool_size` | Rotate TLS client settings per request on HTTPS. |
| Body Type Rotation | `body_method`, `body_ratio` | Choose the body method and share. |

The matrix hides Body Type Rotation for the GET-based presets. The GET
preset sends no body. For GraphQL mode, the matrix treats body rotation as
GraphQL template rotation; `body_method` does not apply on the GraphQL
path.

## Requirements

The vector needs no optional library for plain HTTP and HTTPS floods. It
uses aiohttp with the standard `ssl` module.

::: warning
`--bypass-waf` gives browser-grade fingerprints only when the `browser`
extra is installed. Without curl_cffi the vector warns and stays on the
cipher-only aiohttp TLS path.
:::

The headless challenge solver needs the `headless` extra. The TSPD solver
path needs a paid API key. Neither is required for a plain flood.

## Example

Run a browser-grade HTTPS GET flood at a fixed rate:

```bash
avalanche -t example.test -p 443 --scheme https --http 200 --http-rps 1000 --bypass-waf
```

Run HULK mode:

```bash
avalanche -t example.test -p 443 --scheme https --http 200 --hulk
```

Run a GraphQL query flood:

```bash
avalanche -t example.test -p 443 --scheme https --http 100 --graphql --graphql-batch
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP flow player (vector: http_flow)](./vector-http-flow.md)
- [HTTP/2 attacks (vector: http2)](./vector-http2.md)
- [HTTP/3 attacks (vector: http3)](./vector-http3.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
