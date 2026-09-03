---
title: A/B Comparison
description: Run two configs and compare their throughput, errors, and latency.
---

# A/B Comparison

A/B comparison answers a simple question: which of two configs performs
better against the same target? Avalanche runs config A, then config B, and
prints a side-by-side report. Use Avalanche only against systems you own or
have written permission to test.

## Run two configs back to back

Pass the two config files to `--compare`. The flag takes two file paths in
order. Each file is a full YAML config. The command needs the `PyYAML`
library.

```bash
avalanche --compare config-a.yml config-b.yml
```

::: warning
`--compare` needs the `PyYAML` library. Install it when it is missing.
The command exits with an error otherwise.
:::

The runner does not run the two configs at the same time. It runs config A
to completion, then config B. A cooldown of 2 seconds separates the two
runs. The code logs "running config A then config B" at the start.

`--compare` only works when the command line also carries `--target`,
`--config`, or `--playbook`. Use one of them as the config source for the
CLI even though the comparison ignores it. The two files you compare stand
alone. Each one must carry its own target, port, and duration. Put the same
target in both configs so the comparison measures the config, not the
network.

## The report fields

Each run produces a `RunResult`. The runner records the total requests,
total errors, average RPS, average latency, peak RPS, bandwidth, blocked and
challenged counts, and the duration. The error rate is computed from the
total errors divided by the total requests.

The comparison report shows the deltas from A to B:

| Field | Meaning |
| --- | --- |
| RPS delta | Average RPS of B minus average RPS of A, with a percentage. |
| Error rate delta | Error rate of B minus error rate of A. |
| Latency delta | Average latency of B minus average latency of A, with a percentage. |
| Block rate delta | Block plus challenge rate of B minus that of A. |
| Winner | The config that scored higher, or `tie`. |

The percentage deltas use config A as the base. A positive RPS delta means
config B was faster.

## The winner

The winner is not decided by a single metric. Each config gets a score:

```text
score = average_rps * (1.0 - error_rate)
```

A config that pushes more requests through with fewer errors scores higher.
The decision rules are:

- When both scores are zero, or the scores differ by less than 5 percent,
  the winner is `tie`.
- Otherwise the higher score wins. That winner is `A` or `B`.

The report also prints a recommendation line. A winner with a higher RPS
gets a recommendation that names the percentage gain. A winner with a lower
RPS but a better error rate gets a recommendation that says so. A tie gets
the text "no significant difference between configs".

## A failed run

A config that fails to run still produces a `RunResult`. The result carries
zero counts and the elapsed time. The runner logs the failure and continues
with the next config. The report then compares the empty result against the
other config.

## Run the report

The console output prints the deltas and the winner:

```bash
avalanche --compare baseline.yml tuned.yml
```

Output lines show the RPS delta, the error rate delta, the latency delta,
the block rate delta, the winner, and the recommendation.

## Related pages

- [Controls and Observability](overview.md). The whole observability
  section.
- [Configuration](../user-guide/configuration.md). How to write the two
  config files.
- [User Guide Overview](../user-guide/overview.md). Plan a full assessment.
