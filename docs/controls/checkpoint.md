---
title: Checkpoint and Resume
description: Versioned JSON state persistence with atomic writes and resume.
---

# Checkpoint and Resume

A checkpoint saves the state of a run to a JSON file. A later run can resume
from that state. Checkpoints make a stopped run cheaper to restart. Use
Avalanche only against systems you own or have written permission to test.

## What a checkpoint saves

A checkpoint payload has six parts:

- A version number and a timestamp.
- The proxy quality scores from every running vector.
- The cookie store contents.
- The token bucket state of each vector.
- A stats snapshot for history continuity.
- The sanitized run config.

The config is scrubbed before it is written. The scrubber removes values
that must not persist, such as the cookie store handle, the distributed
secret, the webhook URL, and the solver API key. Path objects become
strings. Everything else survives as plain JSON.

## Versioned format

Every checkpoint carries a version. The current version is `1`. The writer
sets the version in the payload. The reader rejects any file whose version
is not `1` with a clear error.

The version protects you from a silent mismatch. When the checkpoint format
changes, an old file cannot be mistaken for a new one.

## Atomic writes

The manager writes through a temporary file and replaces the target. The
steps are:

1. Create a temporary file in the same directory.
2. Write the JSON payload to the temporary file.
3. Set the file permissions to `0600`.
4. Replace the checkpoint file with the temporary file.

The replace is atomic on the same filesystem. A reader never sees a
half-written checkpoint. The temporary file is removed in all cases.

The write runs off the event loop in a worker thread. The autosave never
stalls the traffic.

## Autosave

A checkpoint writes automatically while a run is active. The autosave
interval is 30 seconds. Each autosave gathers the full payload and writes
it.

The default checkpoint path is `~/.avalanche/checkpoint.json`. Use
`--checkpoint` to set a different path.

```bash
avalanche -t target.example --http 200 --checkpoint /tmp/avalanche-state.json
```

## Resume

Resume hydrates the saved state into a new run. Pass `--resume` and the new
run loads the checkpoint before it builds its vectors.

```bash
avalanche -t target.example --http 200 --resume
```

The resume applies the payload in this order:

1. It compares the saved target with the current target. A mismatch logs a
   warning but does not stop the run.
2. It rebuilds the cookie store from the saved cookies.
3. It restores the stats snapshot, which continues the history.
4. It stores the proxy quality scores for the vector builds.
5. It stores each token bucket state for the vector builds.

The vectors consume the saved state during construction. The HTTP vector
restores its token bucket from the saved state. The token bucket rebuild
uses a fresh clock anchor, so the resumed rate has no stall or burst
glitch.

When the checkpoint file is missing or its version is wrong, resume logs a
warning and continues without it. A missing file is not a fatal error.

## Config keys

The two keys live in the runtime section of the config. Their defaults
match the CLI defaults.

| Config key | Default |
| --- | --- |
| `runtime.resume` | `false` |
| `runtime.checkpoint_path` | `~/.avalanche/checkpoint.json` |

```yaml
runtime:
  resume: true
  checkpoint_path: ~/.avalanche/checkpoint.json
```

## Related pages

- [Rate Limiting and the Resource Governor](governor.md). The token bucket
  state that resumes.
- [Metrics](metrics.md). Another way to read run state.
- [Controls and Observability](overview.md). The whole observability
  section.
- [Configuration](../user-guide/configuration.md). The config file format.
