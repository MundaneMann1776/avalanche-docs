---
title: "SMTP Slow Hold (vector: smtp)"
description: How the smtp vector holds SMTP server sessions open over banner, command, or data phases.
---

# SMTP Slow Hold

The `smtp` vector runs the SMTP Slow Hold attack. The attack opens many
SMTP sessions and keeps each one from finishing. It is a non-HTTP worked
example of the same slow-connection pattern as the HTTP slow vectors. The
attack works at OSI layer 7, the application layer. Use Avalanche only
against systems you own or have written permission to test.

## When to use

Use the vector to test how a mail server copes with many slow, incomplete
SMTP sessions. SMTP servers hold a session until the client finishes the
dialog or the server times out.

Good test targets include:

- Your own SMTP relay or mail gateway.
- A staging mail server you manage.
- A server that limits concurrent SMTP sessions.

The vector runs over TCP, typically on port 25 or 587. Set the port with
`-p` or with `--smtp-port`.

## How it works

The `SmtpFlood` class in `vectors/smtp.py` extends `SlowSocketVector` from
`vectors/base.py`. It overrides the generic worker loop because SMTP
servers speak first. Each worker opens one connection and reads the 220
greeting banner before it sends anything. A connection that closes before
the banner counts as an error, not as a silent skip.

The vector replaces the abstract drip hooks with an empty payload. The
session flow owns the byte stream instead. Each completed session records
its bytes in the stats collector and keeps the active-connection count
balanced under every error path.

The attack shape comes from the `mode` key. The valid modes are
`banner_hold`, `command_drip`, and `data_drip`. An unknown mode falls back
to `command_drip`.

In `banner_hold` mode, the worker reads the banner and sends nothing else.
It keeps the connection open until the run stops.

In `command_drip` mode, the worker sends the `EHLO` verb and then drips the
rest of the line in 2-byte groups. The line never gains its final `CRLF`,
so the server cannot parse a complete command. The drip cycle repeats until
the run stops.

In `data_drip` mode, the worker completes the envelope. It sends `EHLO`,
`MAIL FROM`, `RCPT TO`, and `DATA`, and reads the reply to each one. Then
it drips body bytes without the terminating dot. This is the slow-POST
analog for SMTP. The server waits for the dot that ends the message body.

Between byte groups, the worker waits the drip interval. The interval comes
from the `drip_seconds` key. Timing jitter randomizes this cadence. The
worker asks the resource governor for a token before every send. When the
governor denies a token, the session records zero bytes for that send.

The worker checks the kill switch on every session cycle. When you stop
the run, a session ends at its next drip boundary. A session in
`banner_hold` mode waits 0.25 seconds between stop-state checks, so it
ends within a quarter second of the stop.

The worker reads the server replies as it goes. A reply can span multiple
lines, such as the `250-` continuations after `EHLO`. The worker consumes
each reply line until the line that ends with a space. A server that closes
the connection mid-handshake raises a reset error, which the vector records
and backs off from.

The class default is 10 workers. Each worker waits 8.0 seconds on a socket
timeout and 1.0 second before it reconnects.

The envelope values come from config keys. The HELO domain, the sender, and
the recipient each have a default. They are protocol-valid by default, so
the session stays parseable.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| SMTP Slow Hold | L7 | Set `mode=banner_hold`, `mode=command_drip`, or `mode=data_drip`. The default is `command_drip`. |

## Configuration

The vector reads these keys from its config section. The typed model is
`SmtpVectorConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `10` | Number of SMTP session threads. Range 1 to 1000. |
| `mode` | `command_drip` | Attack shape: `banner_hold`, `command_drip`, or `data_drip`. |
| `helo_domain` | `relay.test` | Domain the client sends in the `EHLO` command. |
| `mail_from` | `sender@relay.test` | Sender address in the `MAIL FROM` command. |
| `rcpt_to` | `recipient@relay.test` | Recipient address in the `RCPT TO` command. |
| `drip_seconds` | `1.0` | Seconds between byte groups in a drip. Range 0.05 to 60.0. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, to the drip cadence. |
| `port` | `None` | Target port for this vector. When unset, the run port `-p` applies. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--smtp` | Enable the SMTP slow-hold vector. |
| `--smtp-mode {banner_hold,command_drip,data_drip}` | Set the attack mode. The default is `command_drip`. |
| `--smtp-workers N` | Set the worker count. The default is 10. |
| `--smtp-port PORT` | Set the target port when it differs from `-p`. |

## Modifiers

The dashboard exposes these rows for SMTP Slow Hold.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the drip cadence between byte groups. |
| SMTP workers | `workers` | Set the worker count from the Load section. |

The matrix marks TCP Hold as not applicable. The hold is intrinsic to every
mode. Each mode keeps the connection open without a toggle.

## Requirements

The vector needs no optional library and no root access. It opens
plaintext TCP sessions only. The connection carries no cookies and uses no
proxy pool.

::: warning
SMTP servers can react slowly when many sessions stall at once. Some
servers blacklist a client that opens too many incomplete sessions. Keep
the worker count low on your first run.
:::

## Example

```bash
avalanche -t example.test -p 25 --smtp --smtp-mode data_drip -d 300
```

This command runs data-drip sessions against `example.test` on port 25 for
300 seconds. The worker count stays at the default of 10.

For a banner hold on a submission port with more workers:

```bash
avalanche -t example.test --smtp --smtp-mode banner_hold --smtp-workers 15 --smtp-port 587 -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [HTTP Slow Post (vector: rudy)](./vector-rudy.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
