---
title: Origin IP Finder
description: Find the backend origin IP behind a CDN or WAF with scored, validated candidates.
---

# Origin IP Finder

The origin finder locates the backend origin IP that sits behind a CDN or
WAF. It takes one domain and returns candidate IPs with a confidence tier
and the evidence behind each one. Use Avalanche only against systems you own
or have written permission to test.

The tool is report-only. It collects candidates, scores them, and prints a
ranked list. It never sends attack traffic and never injects results into a
vector. The CLI help for the report-only mode states this directly:
nothing is injected or attacked.

## How a hunt works

The service runs these phases in order:

1. Gather candidate hits from the selected sources.
2. Score every candidate by ASN and CDN-range signals.
3. Validate the strongest candidates against the live target.
4. Assign a confidence tier to every candidate.
5. Cache the results in the local dataset.

A candidate hit is one observed mapping between a hostname and an IP. Each
hit records the source that produced it and the first-seen date when
available.

### Self-sufficient DNS

The finder always resolves the apex and a list of common labels directly.
The labels include `origin`, `direct`, `backend`, `internal`, `www`, `api`,
`mail`, `cdn`, and legacy names such as `old` and `legacy`. This path needs
no third-party source. It still works when every passive source is blocked
or rate-limited.

## Sources

The finder supports eight sources. Seven of them need no API key:

| Source | What it provides |
| --- | --- |
| `crtname` | Certificate Transparency names resolved to IPs |
| `certspotter` | Certificate issuances resolved to IPs |
| `wayback` | Wayback CDX hostnames resolved to IPs |
| `hackertarget` | Direct hostname-to-IP history pairs |
| `otx` | Passive DNS hostname-to-IP pairs |
| `viewdns` | IP history table from viewdns.info |
| `dnsdumpster` | Hostname-to-IP rows from DNSDumpster |
| `shodan` | Certificate and favicon matches from Shodan |

Shodan is the only keyed source. It needs an API key configured in the
settings. The default selection uses every non-keyed source and adds Shodan
only when a key is present.

The sources fail soft. When one source errors or rate-limits, the hunt
records the error and continues. The result includes a source status map.

## Scoring

Every candidate receives a numeric score. The score adds and subtracts
points from these signals:

- A successful ASN lookup outside the known provider ASNs adds 40 points.
  The provider list covers WAF and CDN operators.
- An ASN inside a known provider ASN subtracts 20 points.
- An IP inside a CDN range subtracts 20 points. CDN ranges are a negative
  signal: an edge IP is almost never the origin.
- Historical DNS data adds 30 points, because it pre-dates the current edge.
- A hostname that matches the apex adds 10 points.
- A hostname that hints at an origin server adds 15 points. The hint tokens
  are `origin`, `backend`, `direct`, and `internal`.
- Each additional observing source adds 5 points.

ASN lookups use the keyless ipinfo.io service. CDN ranges come from a
committed list in `data/cdn_ranges.json`. Provider ASNs come from
`data/waf_asn.yaml`.

## Validation against the live baseline

Scoring only guesses. Validation asks the direct question: does this IP,
queried with the target Host header, serve the target content?

First the finder captures a baseline of the live site. The baseline holds
the status, the page title, the body, the favicon hash, the TLS certificate
SANs, and any CDN markers.

Then it probes the top 50 candidates. Each probe sends a request to the
candidate IP with the target Host header. The finder compares the response
with the baseline on four signals:

- The page title matches the baseline.
- The stripped body is at least 85 percent similar.
- The certificate SAN covers the target or shares a SAN with the baseline.
- The favicon hash matches the baseline.

Two findings mark a candidate as not the origin. A CDN marker in the
response means the probe still hits an edge. A managed challenge page means
the probe hit a WAF, not the backend.

Validation is on by default. Disable it with `--no-origin-validate` when
you want a passive hunt only. The validation cap is 50 candidates.

## Confidence tiers

Every candidate ends with one of four tiers:

| Tier | Meaning |
| --- | --- |
| `confirmed` | Validation matched, and the score is at least 40 or the ASN is outside provider ranges |
| `likely` | Validation matched, or the score is at least 60 with no CDN or provider-ASN signal |
| `inconclusive` | The active probe returned CDN markers or a managed challenge |
| `weak` | No strong evidence; often an IP in a CDN range or provider ASN |

The result lists candidates in confidence order. `confirmed` comes first and
`weak` last.

## The local dataset

A completed hunt is cached in the local dataset. The cache lives in
`~/.avalanche/origin_dataset.json`. A repeat hunt for the same domain within
7 days returns the cached candidates with no network traffic. This mirrors
the subdomain dataset, and the finder also reads the subdomain dataset when
you leave dataset use on. Every subdomain record with resolved IPs becomes a
candidate hit.

## How you run a hunt

The dashboard starts hunts in the background:

- `POST /api/origin/discover` starts a hunt and returns a `scan_id`.
- `GET /api/origin/discover/status/{scan_id}` shows its progress.
- `POST /api/origin/discover/cancel` stops a running hunt.
- `GET /api/origin/dataset` reports the dataset statistics.
- `GET /api/origin/scans` and `PUT /api/origin/scans` list and save scans.
- `GET /api/origin/scans/export` exports a saved scan as CSV.

The command line runs one hunt and prints a table. Use `--origin-only` with
`--target`:

```bash
avalanche --origin-only --target example.com
```

The command reports the dataset status, the candidate count, and the source
counts. It prints a table with the IP, hostname, confidence, score, ASN, and
sources for every candidate.

### Hunt flags

The relevant flags are:

- `--origin-only` runs the hunt and exits without attacking.
- `--origin-source SOURCE` includes one source. Repeat the flag to select
  several.
- `--origin-validate` probes candidates against the live target. Use
  `--no-origin-validate` to disable probing.
- `--origin-use-dataset` enriches and caches results in the local dataset.
  Use `--no-origin-use-dataset` to disable it.
- `--origin-shodan` includes the Shodan source. It requires a configured
  API key.

## CSV export

A saved scan exports to CSV. The columns are `ip`, `hostname`, `confidence`,
`score`, `asn`, `asn_name`, `in_cdn_range`, `cdn_provider`, `validated`, and
the dated sources.

## Related pages

- [Subdomain Discovery](subdomains.md) — the dataset the finder reads for
  candidates.
- [Cookie Capture](cookie-capture.md) — pass the edge when you act on the
  results.
- [Reconnaissance Overview](overview.md) — report-only versus run-feeding
  recon.
