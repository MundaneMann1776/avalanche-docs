---
title: Safety and Authorized Use
description: The rules and controls that keep Avalanche use lawful and safe.
---

# Safety and Authorized Use

Avalanche is a stress-testing tool for authorized availability
assessments. It is a private, intra-company tool. Use Avalanche only
against systems you own or have written permission to test.

This page is the most important page in this guide. Read it before you run
any attack.

## Rules of use

- Test only systems you own or have written permission to test.
- Keep written permission for every target and every window.
- Do not use spoofed source addresses outside your authorized lab or
  engagement.
- Stop a run when the target shows real distress beyond the test goal.
- Do not point Avalanche at systems you do not own. You are responsible for
  the traffic it sends.

::: warning
Amplification, raw-socket, and spoofing vectors send traffic that is hard to
attribute to you. Use them only in a controlled, authorized environment.
:::

## The safety controls

Avalanche provides independent safety controls. You, the operator, always
decide when to stop. The controls are:

- The [canary](canary-killswitch.md). A light independent probe that checks
  whether clean traffic still gets through.
- The [kill switch](canary-killswitch.md). A file that stops a run.
- The resource governor. It caps total requests per second and bandwidth.
- The dry-run validator. It checks the configuration before you send any
  traffic.
- The scope gate. It refuses runs outside your allow-list.

## Prepare before a run

Follow these steps before you start:

1. Confirm the target is in scope and you have permission.
2. Review the configuration with `--dry-run`.
3. Set global caps when you need them. Use `limits.max_rps` and
   `limits.max_bandwidth_mbps` in the config, or the resource governor
   settings.
4. Keep the canary on for real engagements.
5. Tell the kill-switch file path to the person who monitors the run.

```bash
avalanche -t target.example --http 200 --dry-run
```

## During a run

Watch the dashboard. Watch the canary verdict. The verdict can be up,
slow, blocked, or down. When the canary shows the target is down or
blocked, decide whether to continue. The tool does not decide for you.

Stop a run with `Ctrl+C` or the kill switch:

```bash
touch /tmp/aval_stop
```

Remove the file before your next run.

## After a run

Export the report. The report records the outcome for the engagement. Store
it with the permission record. See [Engagements and Reports]
(engagements-reports.md).

## Next steps

- [Canary and Kill Switch](canary-killswitch.md). How the controls work.
- [Quick Start](../getting-started/quickstart.md). Your first runs.
