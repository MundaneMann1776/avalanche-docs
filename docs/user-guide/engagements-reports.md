---
title: Engagements and Reports
description: Record runs as engagements and export HTML and CSV reports.
---

# Engagements and Reports

Avalanche records runs and produces reports. This page explains engagements,
scopes, runs, and the report formats. Use Avalanche only against systems
you own or have written permission to test.

## Engagements

An engagement is a named unit of work. It groups runs under a name and an
optional scope. Engagement recording is on by default.

You name an engagement from the command line:

```bash
avalanche -t target.example --engagement "acme-q3-resilience"
```

You can attach a scope and a list of FQDNs:

```bash
avalanche -t target.example --engagement acme-q3 --scope prod --fqdns app.example,api.example
```

### Scope gate

The scope gate is a fail-closed control. When you enable `require_scope`,
the tool refuses to run without an allow-list or outside it. Use it to make
sure a run stays inside the authorized targets.

```bash
avalanche -t target.example --scope prod --require-scope
```

The FQDN list defines what the run may target. A run outside the list
stops at the gate.

## Runs

A run is one test execution. The recorder writes a per-second sample of the
run to a JSONL file. The dashboard lists runs and their reports. A campaign
sweep creates one engagement run per target.

## Reports

You can export a report for a run, a scope, or an engagement. The report
formats are:

- HTML. A self-contained assessment report with server-side SVG charts,
  selectable metric tabs, and collapsible sections.
- CSV. Tabular data for spreadsheets and archives.

The report prose has two languages: English (`en`) and Turkish (`tr`).
Choose the language when you generate the report.

### Report contents

The report derives findings from the run telemetry. The findings builder
classifies severity from signals such as:

- Outage intervals.
- High error ratios.
- Dead air or probe-down periods.
- Block and mitigation counters.

The report shows the risk level, severity counts, and the outage timeline.
It also carries the canary verdict history, so the reader can compare the
target's behavior against the attack load.

### Find the reports

The dashboard serves reports under the Engagements area. The report files
are stored under the data directory with the engagement records. The
campaign flow also exports `report.csv` per campaign.

## Disable recording

For quick tests you may not want a recorded engagement. Disable it:

```bash
avalanche -t target.example --no-record-engagement
```

## Next steps

- [Web Dashboard](dashboard.md) — run and view engagements in the browser.
- [Campaigns](../reconnaissance/campaigns.md) — run multi-target sweeps.
