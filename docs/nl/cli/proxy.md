---
read_when:
    - Je moet door operators beheerde proxyrouting vóór implementatie valideren
    - Je moet OpenClaw-transportverkeer lokaal vastleggen voor foutopsporing
    - Je wilt debug-proxysessies, blobs of ingebouwde queryvoorinstellingen inspecteren
summary: CLI-referentie voor `openclaw proxy`, inclusief door de operator beheerde proxyvalidatie en de lokale inspecteur voor debugproxy-opnamen
title: Proxy
x-i18n:
    generated_at: "2026-05-01T11:16:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valideer door de operator beheerde proxyrouting, of voer de lokale expliciete debugproxy uit
en inspecteer vastgelegd verkeer.

Gebruik `validate` om een door de operator beheerde forward-proxy vooraf te controleren voordat
OpenClaw-proxyrouting wordt ingeschakeld. De andere commando's zijn debugtools voor
onderzoek op transportniveau: ze kunnen een lokale proxy starten, een onderliggend commando uitvoeren
met vastlegging ingeschakeld, vastleggingssessies tonen, veelvoorkomende verkeerspatronen opvragen, vastgelegde
blobs lezen en lokale vastleggingsgegevens opschonen.

## Commando's

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
`--proxy-url`, config of `OPENCLAW_PROXY_URL`. Het meldt een configuratieprobleem wanneer
geen proxy is ingeschakeld en geconfigureerd; gebruik `--proxy-url` voor een eenmalige voorafcontrole
voordat je de configuratie wijzigt. Standaard verifieert het dat een openbare bestemming slaagt
via de proxy en dat de proxy geen tijdelijke loopback-canary kan bereiken.
Aangepaste geweigerde bestemmingen zijn fail-closed: HTTP-reacties en ambigu
transportfalen mislukken beide, tenzij je een implementatiespecifiek weigeringssignaal
afzonderlijk kunt verifiëren.

Opties:

- `--json`: druk machineleesbare JSON af.
- `--proxy-url <url>`: valideer deze proxy-URL in plaats van config of env.
- `--allowed-url <url>`: voeg een bestemming toe die naar verwachting via de proxy slaagt. Herhaal om meerdere bestemmingen te controleren.
- `--denied-url <url>`: voeg een bestemming toe die naar verwachting door de proxy wordt geblokkeerd. Herhaal om meerdere bestemmingen te controleren.
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

## Opmerkingen

- `start` gebruikt standaard `127.0.0.1`, tenzij `--host` is ingesteld.
- `run` start een lokale debugproxy en voert daarna het commando na `--` uit.
- `validate` sluit af met code 1 wanneer de proxyconfiguratie of bestemmingscontroles mislukken.
- Vastleggingen zijn lokale debuggegevens; gebruik `openclaw proxy purge` wanneer je klaar bent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Netwerkproxy](/nl/security/network-proxy)
- [Vertrouwde proxyauthenticatie](/nl/gateway/trusted-proxy-auth)
