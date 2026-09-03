---
title: Web Dashboard
description: Plan, start, and watch runs in the browser.
---

# Web Dashboard

The web dashboard is the primary interface of Avalanche. You start it with
a bare command. Use Avalanche only against systems you own or have written
permission to test.

```bash
avalanche
```

The dashboard serves on `http://127.0.0.1:8787` and opens in your browser.
It binds to `127.0.0.1`. To view a remote run, tunnel the port to your
machine.

## What the dashboard provides

The dashboard brings the whole workflow into one screen set. The main areas
are:

- Attack setup. Select an attack type and set its modifiers with switches.
- Live monitoring. Charts and per-vector statistics update during the run.
- Reconnaissance. Endpoint and subdomain discovery run from the browser.
- Origin-IP finder. Run a keyless origin hunt for a domain.
- Cookie capture. Capture and verify WAF cookies for a target.
- Engagements. Record runs under a named scope.
- Filterable logs. Follow the run log in the browser.
- Settings. Machine settings, solver defaults, teams, and WAF signatures.
- Campaigns. Manage target groups and run multi-target sweeps.

## Attack setup

The dashboard lists the 54 attack types in the attack-type selector. They
group by layer:

- Layer 3 (network): 9 types.
- Layer 4 (TCP/UDP): 15 types.
- Layer 7 (application): 30 types.

Select an attack type. The modifier panel shows the switches that the
engine consumes for that attack. Each switch maps to a config key. See the
[Attack Vectors section](../attack-vectors/overview.md) for what each switch
does.

## Start a run

Choose the attack type, set the modifiers, and press **Start attack**. The
dashboard sends the run payload to the Python server. The server starts the
engine through the dashboard controller. The run records an engagement when
recording is on.

You can stop a run from the dashboard at any time. The kill switch also
works from the terminal.

## Watch a run

During a run the dashboard shows:

- The canary verdict.
- Request and error rates per vector.
- Latency and block-rate statistics.
- The health of each proxy or egress in use.
- The log stream.

Use these views to decide whether to continue or stop.

## Settings and data

The Settings page manages machine-level values stored in
`~/.avalanche/settings.json`:

- Solver defaults. Captcha API key, base URL, FlareSolverr URL, and default
  solver mode.
- WAF signatures. Create, test, and reload custom signatures.
- Teams. Switch the active team profile.
- Managed pools. Proxy, reflector, and spoof-source controls.

API responses expose only a masked suffix of secret values.

## When the dashboard is not enough

For scripted runs, use the command line. For sequences, use a playbook. See
[Command-Line Interface](cli.md) and [Playbooks](playbooks.md).

## Next steps

- [Command-Line Interface](cli.md). Run from a terminal.
- [Engagements and Reports](engagements-reports.md). Record what you ran.
