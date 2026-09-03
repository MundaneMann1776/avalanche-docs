---
title: "SIP floods (vector: sip)"
description: How the sip vector floods INVITE, BYE, REGISTER, and OPTIONS requests over SIP transports.
---

# SIP floods

The `sip` vector runs SIP request floods built to RFC 3261. The vector
covers five attack types: SIP Invite Flood, SIP Bye Flood, SIP Register
Flood, SIP Options Flood, and SIP Multi Attribute Flood. The `method` key
selects the request type. The attack works at OSI layer 7, the application
layer. Use Avalanche only against systems you own or have written
permission to test.

## When to use

Use the vector when you want to test how a SIP proxy, registrar, or session
border controller copes with a high rate of requests.

Good test targets include:

- Your own SIP proxy or registrar.
- A staging voice-over-IP service you manage.
- An SBC that ends SIP signaling.

The attack targets CPU and memory in the SIP server. Each request forces
the server to parse headers, allocate transaction state, and look up
dialogs or credentials.

## How it works

The `SipFlood` class in `vectors/sip.py` extends `AttackVector` directly.
It is a high-rate request vector. Each worker thread builds one RFC 3261
request and sends it.

The request shape comes from the `method` key. The valid methods are
`invite`, `bye`, `register`, and `options`. An unknown method falls back to
`invite` with a warning.

Each method stresses the server in a different way:

- `invite` creates a server transaction. A stateful proxy allocates dialog
  state and parses the SDP body.
- `bye` forces the proxy to look up and tear down a dialog.
- `register` with random user names forces digest challenges and
  credential lookups.
- `options` is answered by nearly every SIP element, even without a user.

The builder randomizes the wire values. It generates a random user name, a
random branch value, a random tag, a random Call-ID, and a random CSeq.
The `sip_entropy` key turns this randomization on and off.

Each message is valid RFC 3261. The `Via` branch starts with the magic
cookie `z9hG4bK`. The request has the required core headers and an exact
`Content-Length`. The builder strips CR and LF from every interpolated
value to prevent header injection.

INVITE carries an SDP body with a random session. REGISTER carries
`Contact` and `Expires`. OPTIONS carries `Accept`.

### The multi_attr mode

The `multi_attr` flag stacks extra headers onto the message. The builder
adds 15 extra `Via` headers, 15 `Record-Route` headers, and 15 `Contact`
headers. It also replaces the display name with a 512-character name.

The extra headers maximize header-parsing cost per packet. The parser must
walk every header while the client sends many copies. The multi-attribute
attack uses `method=invite` with `multi_attr=true`.

### Transport

The transport key selects UDP, TCP, or TLS. The default is UDP. UDP sends
each message as one datagram through a fresh socket. TCP and TLS open a
fresh connection per message. SIP over a stream transport is
message-delimited by `Content-Length`, so each message is self-contained.

The worker puts a random public IPv4 address in the `Via` and `Contact`
headers. The server replies to that address. The message source port is
random on each build.

The class default is 2 workers. Between messages, a worker waits only the
`timing_jitter_ms` jitter window. The base delay is zero.

### Worker sharding

Set `process_workers` to 2 or more to run the flood in child processes.
Each child carries a slice of the workers. When child processes are not
available, the vector logs a warning and falls back to in-process threads.

## Attack types

| Attack type | Layer | Notes |
|---|---|---|
| SIP Invite Flood | L7 | Set `method=invite`. |
| SIP Bye Flood | L7 | Set `method=bye`. |
| SIP Register Flood | L7 | Set `method=register`. |
| SIP Options Flood | L7 | Set `method=options`. |
| SIP Multi Attribute Flood | L7 | Set `method=invite` with `multi_attr=true`. |

## Configuration

The vector reads these keys from its config section. The typed model is
`SipVectorConfig` in `core/config.py`. The same defaults live in
`core/vector_defaults.py`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `False` | Start the vector in this run. |
| `workers` | `2` | Number of request threads. Range 1 to 1000. |
| `process_workers` | `0` | Number of child processes. 0 means in-process threads; 2 or more shards the workers. Range 0 to 16. |
| `method` | `invite` | Request method: `invite`, `bye`, `register`, or `options`. |
| `multi_attr` | `False` | Stack extra `Via`, `Record-Route`, and `Contact` headers. |
| `sip_entropy` | `True` | Randomize user, branch, tag, Call-ID, and CSeq values. |
| `transport` | `udp` | Message transport: `udp`, `tcp`, or `tls`. |
| `timing_jitter_ms` | `0` | Add random delay, up to this many milliseconds, between messages. |

## Command-line flags

| Flag | Meaning |
|---|---|
| `--sip N` | Enable the vector and set the worker count. |
| `--sip-method {invite,bye,register,options}` | Set the request method. The default is `invite`. |
| `--sip-multi-attr` | Enable multi-attribute mode. |
| `--sip-transport {udp,tcp,tls}` | Set the transport. The default is `udp`. |

Pass `-p 5060` for UDP or TCP, or `-p 5061` for TLS. The CLI does not
change the port for this vector.

The `sip_entropy` key has no CLI flag. It defaults to on. Set it to `false`
in a config file to send deterministic wire values.

## Modifiers

The dashboard exposes these controls for the SIP attack rows.

| Modifier | Config key | Effect |
|---|---|---|
| Timing Jitter | `timing_jitter_ms` | Randomize the pause between messages. |
| SIP Entropy | `sip_entropy` | Toggle the randomization of SIP wire values. Default on. |

The matrix marks Spoof Via as hidden. The engine has no separate spoof
gate. The vector always fills `Via` and `Contact` with a random public IPv4
address.

## Requirements

The vector needs no optional library and no root access. It uses plain
sockets. The TLS transport needs only the Python standard `ssl` module.

::: warning
SIP requests carry a random public IPv4 source in `Via` and `Contact`.
Server replies to those requests go to that address. In a lab, this can
send reply traffic to an address you do not control. Use the vector only
against systems you own or have written permission to test.
:::

## Example

```bash
avalanche -t sip-proxy.example -p 5060 --sip 50 --sip-method invite -d 300
```

This command runs 50 INVITE workers against `sip-proxy.example` on port
5060 for 300 seconds.

For the multi-attribute variant over UDP:

```bash
avalanche -t sip-proxy.example -p 5060 --sip 50 --sip-method invite --sip-multi-attr -d 300
```

For REGISTER floods over TLS:

```bash
avalanche -t sip-proxy.example -p 5061 --sip 50 --sip-method register --sip-transport tls -d 300
```

## Related pages

- [Attack vectors overview](../overview.md)
- [Vector reference](../reference.md)
- [Layer 7 (application) attacks](../layer7.md)
- [UDP amplification attacks (vector: udp)](./vector-udp.md)
- [Canary and kill switch](../../user-guide/canary-killswitch.md)
