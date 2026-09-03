---
title: WAF Cookie Capture
description: Capture WAF challenge cookies, store them per target and egress, and replay them in runs.
---

# WAF Cookie Capture

A WAF or CDN can challenge a request before it reaches the backend. The
challenge often sets a cookie that marks the request as trusted. Cookie
capture obtains those cookies, stores them, and replays them so a run can
pass the edge. Use Avalanche only against systems you own or have written
permission to test.

The capture flow has four parts:

- The browserless capture sends one Chrome-impersonated GET request.
- The edge fingerprint names the provider that answered.
- The cookie store keeps the result, keyed by `fqdn::egress`.
- The pre-flight gate and warm-up make the cookies available to a run.

## The browserless capture

The capture needs the `browser` extra, which provides curl_cffi. It opens a
transport that impersonates a real Chrome TLS and HTTP/2 fingerprint. The
default impersonation target is `chrome146`. The transport sends one GET
request to the target and reads the `Set-Cookie` headers.

::: warning
The browserless capture needs the `browser` extra. Install it with
`uv sync --extra browser`. The capture raises an error when curl_cffi is
not available.
:::

Cookie expiry is honored. `Max-Age` and `Expires` set the expiry time. A
cookie without either value falls back to a default lifetime of 3600
seconds. Malformed `Set-Cookie` lines are skipped.

A blocked or challenged response is still useful. The capture returns a
record with an empty cookie list and a diagnosis that explains the result.
A challenge may need a real-browser solve when the WAF sets its cookies
through JavaScript.

The captured cookies stay bound to the fingerprint that won them. The
impersonation target must match the run's `browser_impersonate` value, or
the edge may reject the replay.

## Edge fingerprinting

The function `detect_edge` names the provider behind a response. It reads
header, cookie, body, and final-URL markers. It recognizes these providers:

| Provider | Typical markers |
| --- | --- |
| F5 | `ts` challenge cookies, `bigip` cookies, F5 ASM block phrases |
| Cloudflare | `cf-ray`, `cf-cache-status`, `__cf_bm`, `cf_clearance` |
| Akamai | `_abck`, `ak_bmsc`, `bm_sz`, Akamai headers |
| AWS | `x-amz-*` headers, `cloudfront` server values |
| DataDome | `datadome` cookies, DataDome challenge text |
| PerimeterX | `_px*` cookies |
| Imperva | `incap_ses_*`, `visid_incap_*` cookies |
| Kasada | `ksd-session` cookie |
| Azure | `x-azure-ref`, `x-msedge-ref` headers |
| Fastly | `x-served-by`, `x-timer`, Fastly `via` values |
| Palo Alto | GlobalProtect URL and page markers |

The fingerprint is advisory. It labels the capture for diagnostics. The
separate `WafDetector` class classifies a response as blocked, challenged,
or clean. Both results are stored on the capture record.

## The cookie store

The store persists captures in `~/.avalanche/cookies.json`. Each record is
keyed by the scope `fqdn::egress`. The `egress` is `direct` by default. A
capture through a proxy binds the cookies to that proxy egress, because the
edge may issue different clearance per exit IP.

The store prunes expired records when it lists them. A record stores the
cookies, the WAF cookie names, the status, the HTTP version, the provider,
the diagnosis, and the expiry time.

The engine reads the same store at run start. Captured cookies for the run
target merge into the shared cookie jar under `host::direct`. The HTTP
flood then applies them to its requests without vector changes.

## Manual import

A challenge that needs a real browser has a manual path:

1. Run `--open-browser TARGET` to open the target in your default browser.
2. Solve the challenge by hand in that browser.
3. Copy the cookies from the browser.
4. Run `--import-cookies TARGET` and paste the cookies into stdin.

The import accepts three paste formats:

- A cookie header string such as `a=1; b=2`.
- A JSON object such as `{"a": "1"}` or `{"cookies": {...}}`.
- A JSON array of `{name, value, domain?, path?, expires?}` objects.

The import saves the cookies under the scope `target::direct`, tags the
record with the provider `manual`, and gives it a default expiry of 3600
seconds. Cookie attributes such as `path` and `domain` are ignored as
cookies. After saving, the import sends one replay request and reports the
verdict.

## Verification

Verification asks whether the saved cookies still pass. The function
`verify_profile` runs a fresh capture, then sends one benign replay request
with the captured cookies. The replay compares the negotiated HTTP version
with the expected one when an expectation is set, and it checks the status
and the challenge kind.

The possible expected versions are `HTTP/1.1`, `HTTP/2`, and `HTTP/3`. A
status of 400 or above is a problem. Any challenge kind on the replay is a
problem. The verdict returns `ok` when no problem exists.

The replay is the single shared path. Profile verification, the CLI
one-shots, and the dashboard all use it.

## The pre-flight solver gate

A run with a solver mode set must hold a valid capture before the vectors
start. The gate runs after the cookie file loads and before the vectors
start. When any HTTP-family vector is enabled and the solver mode is not
`none`, the gate requires a non-expired capture for `target::direct`.

The gate behavior depends on the mode:

- With mode `manual` and the provider `flare`, or with mode `self_hosted`,
  the gate solves the target through that provider when no capture exists.
- With mode `headless` or `manual` with the provider `byhand`, the gate
  requires an existing capture. Create it first with `--solve-headless`, a
  real-browser capture, or the dashboard.
- With mode `tspd`, the gate does not run. TSPD solving happens inside the
  flood vector during the run.
- With mode `none`, the gate does not run.

When the gate needs a capture and none is valid, the run aborts with a clear
error. It names the target and the egress. After a successful solve, the
gate seeds the cookie jar and waits for the buffer time before the vectors
start. The default buffer is 15 seconds.

The solver mode applies per machine and per run. The runtime keys are
`solver_mode`, `solver_provider`, and `solver_buffer_seconds`. Machine-level
defaults live in the settings file and can be changed in the dashboard
settings.

## Per-egress clearance warm-up

A proxy-pool run can warm every egress before the workers start. The warm-up
solves the target once per proxy exit. Each solve runs through its own
proxy. One replay request verifies the cookies through the same proxy.
Successful cookies seed the shared cookie jar under the scope
`host::proxy`.

Warming makes the first real request from each egress already pass the
challenge. A failed egress simply starts cold. Quality scoring handles it
from there.

Enable the warm-up with the runtime keys `warm_clearance` and `warm_cap`.
The default cap is 10 egresses. The provider follows the solver mode. The
provider `byhand` never warms, because manual solving cannot be proxy-
pinned. Solves run with bounded concurrency.

## CLI actions

The one-shot cookie actions print a single JSON document on stdout. Agents
can parse them without log noise.

- `--capture-cookie TARGET` runs one browserless capture, saves it, prints
  the result, and exits.
- `--list-cookies` lists the saved captures, newest first, and exits.
- `--delete-cookie TARGET` deletes the saved capture for the target and
  exits.
- `--open-browser TARGET` opens the target in your default browser and
  prints the URL.
- `--import-cookies TARGET` reads pasted cookies from stdin, saves them,
  verifies one replay, and prints the result.
- `--verify-cookies TARGET` sends one benign replay request with the saved
  cookies and prints the verdict.
- `--warm-clearance` solves the target once per proxy egress before the
  workers start.
- `--warm-cap N` sets how many egresses to warm. The default is 10.
- `--solver-mode MODE` sets the pre-flight solver mode. The choices are
  `none`, `headless`, `manual`, `self_hosted`, and `tspd`.

The capture flags accept a scheme and a port. Use `--capture-proxy URL` to
route the capture through a proxy and bind the cookies to that egress.

```bash
avalanche --capture-cookie example.com
avalanche --verify-cookies example.com
avalanche --list-cookies
```

The run-side flags apply to a normal run:

```bash
avalanche -t example.com --http 200 --solver-mode headless --warm-clearance --warm-cap 5
```

## Related pages

- [Campaigns](campaigns.md). Sweep every target for cookies.
- [Endpoint Discovery](endpoints.md). Find the paths the run will use.
- [Reconnaissance Overview](overview.md). How cookie capture feeds runs.
- [Infrastructure Overview](../infrastructure/overview.md). The proxy pool
  that warm-up operates on.
