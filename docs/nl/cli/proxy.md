---
read_when:
    - Je moet door operators beheerde proxyrouting valideren vóór implementatie
    - U moet OpenClaw-transportverkeer lokaal vastleggen voor debugging
    - Je wilt debugproxy-sessies, blobs of ingebouwde querypresets inspecteren
summary: CLI-referentie voor `openclaw proxy`, inclusief door de operator beheerde proxyvalidatie en de lokale inspectietool voor debug-proxy-opnamen
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valideer door de operator beheerde proxyrouting, of voer de lokale expliciete debugproxy uit
en inspecteer vastgelegd verkeer.

Gebruik `validate` om een door de operator beheerde forward proxy vooraf te controleren voordat
OpenClaw-proxyrouting wordt ingeschakeld. De andere opdrachten zijn debuggingtools voor
onderzoek op transportniveau: ze kunnen een lokale proxy starten, een child-opdracht uitvoeren
met capture ingeschakeld, capturesessies weergeven, veelvoorkomende verkeerspatronen opvragen, vastgelegde
blobs lezen en lokale capturegegevens opschonen.

## Opdrachten

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Valideren

`openclaw proxy validate` controleert de effectieve door de operator beheerde proxy-URL uit
`--proxy-url`, configuratie of `OPENCLAW_PROXY_URL`. Beheerde proxy-URL's kunnen
`http://` gebruiken voor een gewone forward-proxylistener of `https://` wanneer OpenClaw
TLS naar het proxy-eindpunt moet openen voordat proxyverzoeken worden verzonden. Het rapporteert een
configuratieprobleem wanneer geen proxy is ingeschakeld en geconfigureerd; gebruik `--proxy-url` voor een
eenmalige preflight voordat de configuratie wordt gewijzigd. Voeg `--proxy-ca-file` toe om een
private CA te vertrouwen voor de TLS-verbinding naar een HTTPS-proxy-eindpunt. Standaard
controleert het of een publieke bestemming via de proxy slaagt en of de proxy
geen tijdelijke loopback-canary kan bereiken. Aangepaste geweigerde bestemmingen zijn
fail-closed: HTTP-antwoorden en ambigue transportfouten falen allebei tenzij
u een implementatiespecifiek weigeringssignaal afzonderlijk kunt verifiëren. Voeg
`--apns-reachable` toe om ook een APNs HTTP/2 CONNECT-tunnel via de proxy te openen
en te bevestigen dat sandbox-APNs reageert; de probe gebruikt een opzettelijk ongeldig
providertoken, dus een APNs-antwoord `403 InvalidProviderToken` is een geslaagd
bereikbaarheidssignaal.

Opties:

- `--json`: print machineleesbare JSON.
- `--proxy-url <url>`: valideer deze `http://`- of `https://`-proxy-URL in plaats van configuratie of env.
- `--proxy-ca-file <path>`: vertrouw dit PEM-CA-bestand voor TLS-verificatie van een HTTPS-proxy-eindpunt.
- `--allowed-url <url>`: voeg een bestemming toe die naar verwachting via de proxy slaagt. Herhaal om meerdere bestemmingen te controleren.
- `--denied-url <url>`: voeg een bestemming toe die naar verwachting door de proxy wordt geblokkeerd. Herhaal om meerdere bestemmingen te controleren.
- `--apns-reachable`: controleer ook of sandbox-APNs HTTP/2 via de proxy bereikbaar is.
- `--apns-authority <url>`: APNs-authority om te testen met `--apns-reachable` (standaard `https://api.sandbox.push.apple.com`; productie is `https://api.push.apple.com`).
- `--timeout-ms <ms>`: timeout per verzoek in milliseconden.

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
- `run` start een lokale debugproxy en voert daarna de opdracht na `--` uit.
- De directe upstream-forwarding van de debugproxy opent upstream-sockets voor diagnostiek. Wanneer de door OpenClaw beheerde proxymodus actief is, is directe forwarding voor proxyverzoeken en CONNECT-tunnels standaard uitgeschakeld; stel `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` alleen in voor goedgekeurde lokale diagnostiek.
- `validate` sluit af met code 1 wanneer proxyconfiguratie of bestemmingscontroles mislukken.
- Captures zijn lokale debugginggegevens; gebruik `openclaw proxy purge` wanneer u klaar bent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Netwerkproxy](/nl/security/network-proxy)
- [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth)
