---
read_when:
    - Je moet door de operator beheerde proxyrouting vóór de uitrol valideren
    - Je moet lokaal OpenClaw-transportverkeer vastleggen voor foutopsporing
    - Je wilt foutopsporingsproxysessies, binaire objecten of ingebouwde queryvoorinstellingen inspecteren
summary: CLI-referentie voor `openclaw proxy`, inclusief validatie van door de operator beheerde proxy's en de lokale inspectietool voor vastleggingen van de foutopsporingsproxy
title: Proxy
x-i18n:
    generated_at: "2026-05-04T07:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valideer door operators beheerde proxyrouting, of voer de lokale expliciete debugproxy uit
en inspecteer vastgelegd verkeer.

Gebruik `validate` om een door de operator beheerde forwardproxy vooraf te controleren voordat
OpenClaw-proxyrouting wordt ingeschakeld. De andere opdrachten zijn debughulpmiddelen voor
onderzoek op transportniveau: ze kunnen een lokale proxy starten, een child-opdracht uitvoeren
met vastlegging ingeschakeld, vastleggingssessies tonen, veelvoorkomende verkeerspatronen opvragen, vastgelegde blobs lezen
en lokale vastleggingsgegevens verwijderen.

## Opdrachten

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Valideren

`openclaw proxy validate` controleert de effectieve door de operator beheerde proxy-URL uit
`--proxy-url`, configuratie of `OPENCLAW_PROXY_URL`. Het meldt een configuratieprobleem wanneer
er geen proxy is ingeschakeld en geconfigureerd; gebruik `--proxy-url` voor een eenmalige voorafcontrole
voordat de configuratie wordt gewijzigd. Standaard wordt gecontroleerd of een openbare bestemming via
de proxy slaagt en of de proxy geen tijdelijke loopback-canary kan bereiken.
Aangepaste geweigerde bestemmingen zijn fail-closed: HTTP-antwoorden en dubbelzinnige
transportfouten mislukken allebei, tenzij je een implementatiespecifiek weigeringssignaal
afzonderlijk kunt verifiëren.

Opties:

- `--json`: druk machineleesbare JSON af.
- `--proxy-url <url>`: valideer deze proxy-URL in plaats van configuratie of env.
- `--allowed-url <url>`: voeg een bestemming toe die naar verwachting via de proxy slaagt. Herhaal dit om meerdere bestemmingen te controleren.
- `--denied-url <url>`: voeg een bestemming toe die naar verwachting door de proxy wordt geblokkeerd. Herhaal dit om meerdere bestemmingen te controleren.
- `--timeout-ms <ms>`: time-out per aanvraag in milliseconden.

Zie [Netwerkproxy](/nl/security/network-proxy) voor implementatierichtlijnen en weigeringssemantiek.

## Query-presets

`openclaw proxy query --preset <name>` accepteert:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notities

- `start` gebruikt standaard `127.0.0.1`, tenzij `--host` is ingesteld.
- `run` start een lokale debugproxy en voert vervolgens de opdracht na `--` uit.
- De directe upstream-forwarding van de debugproxy opent upstream-sockets voor diagnostiek. Wanneer de door OpenClaw beheerde proxymodus actief is, is directe forwarding voor proxy-aanvragen en CONNECT-tunnels standaard uitgeschakeld; stel `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` alleen in voor goedgekeurde lokale diagnostiek.
- `validate` sluit af met code 1 wanneer proxyconfiguratie of bestemmingscontroles mislukken.
- Vastleggingen zijn lokale debuggegevens; gebruik `openclaw proxy purge` wanneer je klaar bent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Netwerkproxy](/nl/security/network-proxy)
- [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth)
