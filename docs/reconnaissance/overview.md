---
title: Reconnaissance
description: "Find the attack surface before you run: subdomains, origin IPs, endpoints, campaigns, and cookies."
---

# Reconnaissance

Reconnaissance builds the target picture before you start a run. Avalanche
provides five recon tools. Each tool gathers one type of information:

- [Subdomain Discovery](subdomains.md) finds the hostnames below a domain.
- [Origin IP Finder](origin-finder.md) finds the backend IP behind a CDN or
  WAF.
- [Endpoint Discovery](endpoints.md) finds the live paths of a site.
- [Campaigns](campaigns.md) groups target hostnames into one workspace.
- [Cookie Capture](cookie-capture.md) captures and replays WAF challenge
  cookies.

Use Avalanche only against systems you own or have written permission to
test.

## Report-only recon and recon that feeds runs

The recon tools fall into two groups. The difference matters for safety.

The origin finder is report-only. It collects candidates and prints a ranked
list. It never sends attack traffic and never injects its results into a
vector. Use its output as intelligence for your next decisions.

The other tools feed runs directly. Subdomain discovery fills campaigns and
endpoint discovery can seed a run automatically. Endpoint discovery feeds
the HTTP flood through `extra_endpoints`. Cookie capture gives the run
clearance to pass the edge. These tools change what a later run sends, so
check their output before you attack.

## How the tools work together

The tools share data stores under `~/.avalanche/`. Subdomain discovery
writes a local dataset. The origin finder reads that same dataset to enrich
its candidates. Endpoint discovery reads the saved subdomain list when you
ask it to include subdomains. Campaigns merge subdomain records and run
sweeps that call endpoint discovery and cookie capture for every target.

The run engine uses these outputs in three places:

- The HTTP vector consumes `extra_endpoints`, which can come from endpoint
  discovery or an endpoint file. See [Endpoint Discovery](endpoints.md).
- The cookie store feeds the pre-flight solver gate and per-egress
  clearance. See [Cookie Capture](cookie-capture.md).
- The proxy pool and reflectors are separate infrastructure. See
  [Infrastructure Overview](../infrastructure/overview.md) when a run needs
  managed egress or amplification sources.

## Where to start

Start with subdomain discovery to find the scope. Then run the origin finder
on the apex domain. Then discover endpoints on the hosts that matter. Build
a campaign to hold the results, and capture cookies for any host that shows
a challenge. The pages in this section explain each step.

## Related pages

- [Subdomain Discovery](subdomains.md) — find hostnames below a domain.
- [Origin IP Finder](origin-finder.md) — find the backend IP behind the edge.
- [Endpoint Discovery](endpoints.md) — find live paths for the HTTP flood.
- [Campaigns](campaigns.md) — group and manage target hostnames.
- [Cookie Capture](cookie-capture.md) — capture WAF cookies for replay.
- [Infrastructure Overview](../infrastructure/overview.md) — proxy pools,
  reflectors, and spoof sources.
- [User Guide Overview](../user-guide/overview.md) — the wider workflow.
- [Safety and Authorized Use](../user-guide/safety.md) — the rules of use.
