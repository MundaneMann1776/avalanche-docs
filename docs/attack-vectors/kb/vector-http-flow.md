---
title: "HTTP flow player (vector: http_flow)"
description: How the http_flow vector replays multi-step YAML journeys with variable extraction and fuzzing.
---

# HTTP flow player

The `http_flow` vector replays YAML flow files. A flow is a sequence of
HTTP steps that models a real user journey, such as login, browse, and
submit. The class `HTTPFlowPlayer` in `vectors/http_flow.py` drives the
vector. It works at OSI layer 7. Use Avalanche only against systems you own
or have written permission to test.

The vector has no single attack type in the dashboard catalog. It is the
flow player, and it is enabled when you point it at a flow directory.

## When to use

Use the vector when a plain request flood is not realistic enough. Flows
are useful for:

- Multi-step API journeys that need one request to follow another.
- Tests that must carry a value from one response into the next request.
- Scenario-driven load where each worker repeats a realistic path.
- Stressing stateful endpoints that a GET flood never touches.

The built-in `api-stress` preset uses this vector. The preset expects the
operator to supply realistic flow files under a flows directory.

## How it works

`HTTPFlowPlayer` loads every `*.yml` and `*.yaml` file from `flow_dir`.
PyYAML parses each document. A top-level mapping with a `steps` key becomes
one flow. A YAML list of such mappings becomes several flows. A file that
parses with an error is skipped with a warning. If the directory holds no
valid flows, the worker sends a fallback GET to `/`.

Each worker gets its own aiohttp session and a dummy cookie jar. Real
cookies flow through the shared `CookieStore`, scoped by egress. On every
iteration the worker picks a random flow and runs its steps in order.

A step is a mapping with these keys: `url`, `method`, `headers`, `body`,
and `extract`. The player substitutes `{{var}}` placeholders in the URL,
the header values, and the body from variables captured earlier in the
flow. A relative URL is joined onto the target origin. The player rejects a
step whose resolved URL leaves the target origin or changes scheme, host,
or port. After substitution the request is sent with the configured proxy
and TLS settings.

Response handling mirrors the `http` vector. Each response feeds the stats
collector, the endpoint tracker, and the WAF analysis. `Set-Cookie` headers
merge into the shared cookie store under the current egress scope.

Variable extraction runs after each step. The `extract` mapping pairs a
variable name with a regular expression. The player searches the response
text with the pattern. The first capture group becomes the variable value.
When the pattern has no group, the whole match is used. The variables then
feed the later steps of the same flow run. Invalid patterns are dropped
with a warning at load time.

With `flow_fuzz` enabled, the player mutates requests. With 30 percent
probability it appends duplicate `id`, `page`, `q`, or `_` query
parameters. A body is fuzzed with 25 percent probability. A JSON body gets
a random extra key. A non-JSON body is wrapped in a synthetic XML element
with 50 percent probability. The mutations give the flow a
parameter-pollution probe flavor.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| (No catalog row) | L7 | The vector replays YAML flows. No single attack type in the dashboard selector. |

## Configuration

The typed model is `HttpFlowVectorConfig` in `core/config.py`. The flat v1
defaults live in `core/vector_defaults.py` under the `http_flow` key. The
typed model nests the proxy and TLS blocks. The engine and CLI write the
flat keys shown below. Both shapes coerce to the same model.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `concurrency` | `50` | Number of concurrent worker tasks. |
| `rps` | `0` | Token-bucket rate in requests per second. `0` means unlimited. |
| `flow_dir` | `flows` | Directory that holds `*.yml` and `*.yaml` flow files. |
| `flow_fuzz` | `False` | Add duplicate query parameters or mutate JSON and XML bodies. |
| `use_proxies` | `False` | Enable the proxy pool. |
| `proxy_file` | `proxies.txt` | Proxy list file. |
| `fetch_proxies` | `False` | Fetch public proxy lists into the cache before validation. |
| `proxy_sticky` | `False` | Keep one proxy per worker until eviction or shutdown. |
| `tls_randomize` | `False` | Rotate TLS client settings per request on HTTPS. |
| `tls_pool_size` | `8` | Number of pre-built TLS contexts for rotation. |
| `human_timing` | `False` | Use heavy-tailed delays instead of uniform micro-jitter. |
| `tcp_connector_limit` | `None` | Max concurrent TCP connections. `None` means automatic from concurrency. |
| `timing_jitter_ms` | `0` | Add up to this many milliseconds of random delay between steps. |

The typed model default for `concurrency` is 50. A resolved run keeps this
value when `--http-flow-dir` starts the vector without a worker count. The
`api-stress` preset overrides it to 100.

## Flow file format

A flow file is YAML. The minimal shape is a mapping with a `name` and a
`steps` list. Each step accepts `url`, `method`, `headers`, `body`, and
`extract`.

The `url` is a path or a full URL. A full URL must use the configured
target origin. The `method` defaults to `GET` and is uppercased. The `body`
may be a string, a mapping, or a list. A mapping or list is serialized to
JSON.

The `extract` value maps a variable name to a regular expression. The regex
should capture the value you want to reuse. This sample shows the shape,
based on the fixture in `tests/fixtures/sample_flow.yaml`:

```yaml
name: echo-test-flow
steps:
  - url: /echo/test
    method: GET
    headers:
      Accept: application/json
  - url: /echo/submit
    method: POST
    headers:
      Content-Type: application/json
    body:
      key: "value_from_flow"
    extract:
      echoed_key: '"key": "([^"]+)"'
```

A flow directory can hold many files. A YAML list of step-bearing mappings
defines several flows in one file. The player picks a flow at random per
iteration.

## Command-line flags

| Flag | Meaning |
|---|---|
| `--http-flow-dir DIR` | Directory of YAML flow files. Enables the vector. |
| `--http-flow N` | Worker count. The resolved default is 50 when `--http-flow-dir` is set and no count is given. |
| `--http-flow-rps N` | Token-bucket rate in requests per second. `0` means unlimited. |
| `--flow-fuzz` | Enable duplicate query parameters and JSON or XML body fuzzing. |
| `--use-proxies` | Enable proxy rotation for the flow player. |
| `--proxy-file PATH` | Proxy list file. |
| `--fetch-proxies` | Download public proxy lists into the cache. |
| `--proxy-sticky` | Keep one proxy per worker. |
| `--tls-randomize` | Rotate TLS client settings per request on HTTPS. |
| `--tls-pool-size N` | Number of pre-built TLS contexts. Default `8`. |
| `--human-timing` | Use heavy-tailed delays between bursts. |

The vector starts when `--http-flow-dir` is set, or when a preset enables
`http_flow` and you pass one of the flow options. The flow options then
override the preset values. Without a directory and without an enabled
preset, the flags alone do not start the vector.

## Modifiers

The dashboard exposes one modifier for the flow player.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the delay between flow steps. |

## Requirements

The vector needs PyYAML to load flow files. The project already depends on
PyYAML, so the loader is present in a normal install.

::: warning
A flow directory with no parseable files produces a silent fallback. Each
worker then sends a plain GET to `/`, which can distort the test. Confirm
that `flow_dir` holds valid YAML before the run.
:::

The vector consumes no optional library and no root access.

## Example

Run the flow player against a flow directory:

```bash
avalanche -t example.test -p 443 --scheme https --http-flow-dir ./flows --http-flow 100 --http-flow-rps 500
```

Run with fuzzing and human timing:

```bash
avalanche -t example.test -p 443 --scheme https --http-flow-dir ./flows --flow-fuzz --human-timing
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP/S flood family (vector: http)](./vector-http.md)
- [WebSocket Flood (vector: websocket)](./vector-websocket.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
