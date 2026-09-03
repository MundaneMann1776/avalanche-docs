---
title: Playbooks
description: Sequence timed attack phases with a YAML playbook.
---

# Playbooks

A playbook sequences timed attack phases in one run. Each phase runs a
configuration slice for a set time. Use a playbook when an assessment needs
several steps in order. Use Avalanche only against systems you own or have
written permission to test.

## Playbook format

A playbook is a YAML file. It has a target, a port, and a list of phases.

```yaml
target: "127.0.0.1"
port: 8080
phases:
  - name: "smoke"
    duration_s: 2
    rps: 10
    vector_proportions:
      http: 1
  - name: "dwell"
    duration_s: 1
    rps: 5
    vector_proportions:
      http: 1
```

Each phase has these fields:

| Field | Meaning |
| --- | --- |
| `name` | The phase name. It appears in logs and reports. |
| `duration_s` | The phase length in seconds. |
| `rps` | The target requests per second for the phase. |
| `vector_proportions` | How the load splits across vectors. A mapping of vector name to weight. |

The engine feeds each phase to the load tester. Between phases it applies
the new phase configuration.

## Run a playbook

Pass the file with `--playbook`.

```bash
avalanche --playbook my_playbook.yml
```

You can override the target and duration from the command line. Those
values win over the file.

```bash
avalanche --playbook my_playbook.yml -t target.example -d 120
```

## Playbooks and presets

A playbook owns its vector configuration. When you pass both `--preset` and
`--playbook`, the preset is ignored. The tool prints a note about it.

## Phases and the SLO

A playbook runs its phases through the engine loop. You can combine phases
with a smooth RPS ramp inside each phase. The playbook executor drives the
phase sequence until it completes or you stop the run.

## Next steps

- [Configuration](configuration.md). The config file format.
- [Presets](presets.md). The built-in profiles.
- [Distributed Mode](../distributed/overview.md). Scale a run across
  machines.
