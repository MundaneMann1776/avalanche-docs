---
title: Campaigns
description: Group target hostnames into one workspace and run sweeps across them.
---

# Campaigns

A campaign is a named group of target FQDNs. It holds the target workspace
for one company or one assessment. You add targets, manage their metadata,
and run bulk operations across all of them. Use Avalanche only against
systems you own or have written permission to test.

The campaign store keeps every campaign in `~/.avalanche/campaigns.json`.
Each campaign has a name, an optional company, notes, and a list of targets.
Each target carries its FQDN and the metadata `label`, `edge`, `status`, and
`notes`. The status is free text and defaults to `new`. The dashboard
rollup groups the counts under `new`, `ready`, `tested`, `blocked`, and
`other`.

The source field records where a target came from. The possible sources are
`manual`, `import`, `subdomain`, and `api`.

## Create a campaign

You create a campaign with a name and optional company and notes. The name
must be unique. You can add targets at creation time or later.

The dashboard routes are:

- `GET /api/campaigns` lists all campaigns with their target counts.
- `POST /api/campaigns` creates a campaign.
- `GET /api/campaigns/{id}` and `PUT /api/campaigns/{id}` read and update
  one campaign.
- `DELETE /api/campaigns/{id}` removes one campaign.

## Add and remove targets

You can add one target at a time. The FQDN is normalized to lowercase
without a trailing dot. You can pass URLs as targets; the scheme and path
are stripped. Each target may carry a label, an edge, a status, and notes.

The target routes are:

- `POST /api/campaigns/{id}/targets` adds one target.
- `PUT /api/campaigns/{id}/targets` edits one target's metadata.
- `DELETE /api/campaigns/{id}/targets` removes one target.

Adding a target that already exists merges the new values. The merge keeps
the original `added_at` date. Empty incoming metadata never overwrites
saved values. An incoming status replaces the saved one only when it is not
`new`.

## Import and export CSV

You can bulk-import targets as pasted text. The import accepts one target
per line. Each line is a plain FQDN or a CSV row in this column order:
`fqdn`, `label`, `edge`, `status`, `notes`. A header row that starts with
`fqdn` is skipped. Blank lines and comment lines that start with `#` are
ignored. Invalid lines are reported without stopping the import.
Duplicates inside the input are removed.

The route `POST /api/campaigns/{id}/import` performs the import. The route
`GET /api/campaigns/{id}/export` returns the targets as CSV with the columns
`fqdn`, `label`, `edge`, `status`, `notes`, `source`, and `added_at`.

## Merge subdomains

You can move subdomain discovery results straight into a campaign. The
merge accepts records for one scanned domain. Only names that end with that
domain are accepted. Each new name becomes a target with the source
`subdomain` and a note that records how it was found.

Existing targets are deduplicated by FQDN. The result reports how many
targets were added and how many were updated. The route is
`POST /api/campaigns/{id}/merge-subdomains`. When you do not pass records,
the merge reads the saved subdomain list for the domain instead.

See [Subdomain Discovery](subdomains.md) for how to produce those records.

## Per-target status rollup

The status route reads only local stores. It generates no network traffic.
For each target it reports:

- Whether a cookie capture exists and which provider it came from.
- How many endpoints are saved for the FQDN.
- How many subdomains are known for the FQDN.
- How many engagement runs exist and the latest one.

The route is `GET /api/campaigns/{id}/status`. It returns the counts grouped
by target status. Use the rollup to see which targets are ready to test.

## Campaign operations

A campaign operation runs one worker per target. The operation tracks every
target through the states `pending`, `running`, `done`, `error`, and
`skipped`. You can run operations concurrently with a limit between 1 and 8.
The default concurrency is 2.

The operation routes are:

- `GET /api/campaigns/{id}/ops` lists the operations for a campaign.
- `GET /api/campaign-op/{op_id}` shows one operation's live state.
- `POST /api/campaign-op/{op_id}/cancel` stops a running operation.

### Endpoint sweep

An endpoint sweep discovers endpoints for every selected target. Each target
runs the discovery options: the source mode, the crawl depth, the URL cap,
and the JS-render toggles. The sweep saves the result per FQDN. The route is
`POST /api/campaigns/{id}/sweep/endpoints`.

See [Endpoint Discovery](endpoints.md) for the discovery details.

### Cookie sweep

A cookie sweep captures WAF cookies for every selected target. Each capture
runs the browserless capture and saves the cookies to the store. The sweep
reports the detected provider and the cookie count per target. The route is
`POST /api/campaigns/{id}/sweep/cookies`.

See [Cookie Capture](cookie-capture.md) for the capture details.

### Multi-target attack sweep

An attack sweep runs a full tester against many targets from one attack
config. You supply a config object and a mode:

- `sequential` runs one target at a time.
- `concurrent` runs parallel testers, bounded by the concurrency limit.

The config is validated and cloned once, then cloned again per target. Each
target gets its own tester and its own engagement run. The single-run slot
in the dashboard stays untouched. The route is
`POST /api/campaigns/{id}/attack`.

::: warning
An attack sweep sends real load to every selected target. Only start a
sweep when you have written permission for each target. The campaign attack
needs the same authorization as any single run.
:::

One attack operation may run at a time. Starting a second one while the
first runs is refused. Each target records its total requests, errors,
average RPS, peak RPS, and the blocked and challenged counts.

ICMP and SYN floods need root inside a campaign sweep too. The sweep rejects
a config that enables them without root access.

## Run history as CSV

The report route groups run history by target. It reads the engagement
store only; it never modifies it. The CSV has the columns `company`,
`campaign`, `fqdn`, `run_id`, `started_at`, `status`, and `scope_id`.
Targets with no runs still appear with empty run fields. The route is
`GET /api/campaigns/{id}/report.csv`.

## Related pages

- [Subdomain Discovery](subdomains.md) — the source for a campaign merge.
- [Endpoint Discovery](endpoints.md) — what an endpoint sweep runs.
- [Cookie Capture](cookie-capture.md) — what a cookie sweep runs.
- [Engagements and Reports](../user-guide/engagements-reports.md) — how
  campaign runs are recorded.
- [Reconnaissance Overview](overview.md) — where campaigns fit.
