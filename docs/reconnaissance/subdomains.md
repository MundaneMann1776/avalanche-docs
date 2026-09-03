---
title: Subdomain Discovery
description: Find the hostnames under a domain with passive sources, brute force, and a local dataset.
---

# Subdomain Discovery

Subdomain discovery enumerates the hostnames under one domain. The result
gives you the scope of an engagement. You can then add the names to a
campaign or probe them for live services. Use Avalanche only against systems
you own or have written permission to test.

The discovery engine merges results from three paths:

- Passive sources. These query public certificate and DNS history services.
- DNS brute force. This resolves wordlist names against the domain.
- The local dataset. This returns previously discovered names instantly.

Every name becomes a `SubdomainRecord`. A record carries its resolved IP
addresses, the source that found it, and a first-seen date when the source
provides one.

## Passive sources

The scanner queries nine keyless services in parallel. None of them needs an
API key:

| Source | What it provides |
| --- | --- |
| `crtname` | Certificate Transparency names from crt.name |
| `certspotter` | Certificate issuances from CertSpotter |
| `hackertarget` | Host search history from HackerTarget |
| `otx` | Passive DNS records from AlienVault OTX |
| `anubis` | Subdomain search from Anubis |
| `bufferover` | DNS records from BufferOver |
| `wayback` | Hostnames from the Wayback Machine CDX |
| `rapiddns` | Subdomain result pages from rapiddns.io |
| `urlscan` | Observed domains from urlscan.io |

A source can fail or rate-limit. Avalanche records the failure and continues
with the sources that answer. The result includes a source status map so
you can see which source produced what.

Several sources also report dates. The scanner keeps the earliest first-seen
date for each name across all sources.

## DNS brute force

Brute force resolves candidate names such as `api.example.com` against the
DNS. The default scan disables brute force to stay fast. Enable it when you
want deeper coverage.

Avalanche ships four bundled wordlists. Each one has a key:

| Key | Name | Size |
| --- | --- | --- |
| `top100` | Fast | 100 names |
| `top5k` | Balanced | 5,000 names |
| `top50k` | Deep | 50,000 names |
| `top110k` | Maximum | 110,000 names |

The default key is `top5k`. The scan limit follows the selected list size.
You can override the limit or supply your own wordlist file.

A wildcard DNS check runs after resolution. The scanner resolves a random
probe label. It then drops any name whose IPs are a subset of the wildcard
IPs. This filter removes false positives on domains that answer for every
label.

## The local subdomain dataset

The dataset is a persistent SQLite store at
`~/.avalanche/subdomain_dataset.db`. It caches the discovered names for each
domain.

The dataset serves two roles:

- Warm reads. When you scan a domain scanned within the last 7 days, the
  result comes from the dataset. No network request runs and no third-party
  rate limit applies.
- Write-back. Every live scan writes its records back into the dataset.
  Over time the dataset becomes the primary answer source.

The freshness window is 7 days. A scan older than that runs the live
pipeline again and refreshes the records.

### Bulk import

You can seed the dataset from bulk sources. The importer accepts:

- A ProjectDiscovery Chaos JSON archive.
- A plain text list with one hostname per line.

Imported names are scoped to the target domain. Wildcards and the bare apex
are dropped. Imported records carry the source tag `dataset`. The dashboard
imports files through `POST /api/subdomains/dataset/import`. A standalone
script `scripts/import_subdomain_dataset.py` does the same from the command
line.

## Per-source selection

You can choose the modules that run. The default runs all of them. The
module set includes the live source keys and the pseudo-source `dataset`.
An explicit selection names exactly the modules to run. Validation rejects
unknown names and empty selections.

The dataset rules change when you select modules explicitly:

- A selection of only `dataset` serves from the dataset without network.
- A mix of `dataset` and live sources runs every selected module. Each
  module contributes to the union of names.
- With no selection, a fresh dataset short-circuits the scan. Otherwise all
  live sources run and write back.

## Historical records

By default the scanner reports only names that resolve. The historical
toggle appends the unresolved names as takeover candidates. These records
have empty IP lists and the flag `historical` set to `true`. They keep their
first-seen dates. Use them to check whether a dead subdomain is
re-registrable or still points at a live service.

## How you run a scan

The dashboard runs scans in the background. The relevant routes are:

- `POST /api/subdomains/discover` starts a scan and returns a `scan_id`.
- `GET /api/subdomains/discover/status/{scan_id}` shows its progress.
- `POST /api/subdomains/discover/cancel` stops a running scan.
- `GET /api/subdomains/dataset` reports the dataset statistics.
- `GET /api/subdomains/wordlists` lists the bundled wordlists.
- `POST /api/subdomains/probe` head-probes up to 50 discovered hosts.
- `GET /api/subdomains` and `PUT /api/subdomains` list and save per-domain
  lists.
- `GET /api/subdomains/export` returns the saved list as CSV.

The scan options include the source set, the wordlist key, a custom
wordlist path, the brute-force limit, and the historical toggle.

The command line runs one scan and prints a table. Use `--subdomain-only`
with `--target`:

```bash
avalanche --subdomain-only --target example.com
```

The command returns a dataset hit when the stored scan is fresh. It reports
the source counts and prints any source errors.

### Scan flags

The relevant flags are:

- `--subdomain-only` runs discovery and exits without attacking.
- `--subdomain-brute` enables DNS brute force. Use
  `--no-subdomain-brute` to disable it.
- `--subdomain-brute-limit N` caps the brute-force names.
- `--subdomain-wordlist FILE` selects a custom wordlist.
- `--subdomain-wordlist-key KEY` selects a bundled wordlist.
- `--subdomain-source MODULE` includes one module. Repeat the flag to select
  several.
- `--subdomain-historical` includes unresolved names. Use
  `--no-subdomain-historical` to keep alive-only results.

## CSV export

The saved records export to CSV. The columns are `subdomain`, `ips`,
`source`, `sources`, `discovered_at`, `first_seen`, and `historical`. The
export carries the provenance and the dates that the dataset stores.

## Related pages

- [Campaigns](campaigns.md). Merge discovered subdomains into a target
  group.
- [Endpoint Discovery](endpoints.md). Seed a crawl from the discovered
  hosts.
- [Origin IP Finder](origin-finder.md). Reuse the dataset for origin
  candidates.
- [Reconnaissance Overview](overview.md). How the recon tools fit together.
