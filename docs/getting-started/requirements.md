---
title: System Requirements
description: The operating system, privileges, and optional libraries Avalanche needs.
---

# System Requirements

This page lists what Avalanche needs on the machine that runs it.

## Operating system and Python

Avalanche runs on macOS and Linux. It does not support Windows.

- Python 3.10 or newer. The installer manages Python through `uv`.
- The `uv` package manager. The installer installs it when it is missing.

## Privileges

Most HTTP and application vectors run without root. The raw-socket vectors
need root because they open raw sockets:

- `icmp` (ICMP flood and modes)
- `syn` (TCP SYN flood and flag variants)
- `rawip` (raw IP protocols and teardrop)
- Spoofed UDP amplification (`amplify_spoof`)

Start Avalanche with `sudo` to use those vectors. The dashboard still runs
without root. It refuses only the raw-socket vectors.

::: warning
Raw-socket vectors use Scapy. On macOS, a raw-socket binary built by Scapy
needs a code-signing exception the first time you run it. Expect an OS
prompt for that exception.
:::

## Optional libraries

The optional features map to the `uv` extras:

| Feature | Extra | Flag or vector |
| --- | --- | --- |
| Browser-grade TLS and HTTP/2 fingerprints | `browser` | `--bypass-waf`, `--browser-impersonate` |
| HTTP/3 (QUIC) vector | `aioquic` | `http3` |
| HTTP/2 vector | `h2` | `http2` |
| Built-in Chromium challenge solver | `headless` | `--solver-mode headless` |
| Prometheus `/metrics` | `metrics` | `--metrics-port` |

A dry run rejects an enabled vector whose library is missing. For example,
the validator rejects an enabled `http3` vector without `aioquic`.

## Network

Some features use public sources. The managed pools and discovery tools
reach public services:

- Proxy harvest reaches public proxy lists.
- Reflector harvest reaches public resolver lists and Shodan (with a key).
- Subdomain discovery reaches passive DNS sources such as crt.sh.
- Origin-IP discovery reaches CertSpotter, HackerTarget, and others.

Those features need outbound internet access. The rest of the tool does not.

## Data directory

Avalanche keeps its state in `~/.avalanche/`. You can redirect it with the
`AVALANCHE_DATA_DIR` environment variable. The directory holds presets,
captured cookies, settings, proxy and reflector pools, and reports.

## Next steps

- [Installation](installation.md). Install the tool.
- [Modes of Operation](../user-guide/modes.md). Choose how to run.
