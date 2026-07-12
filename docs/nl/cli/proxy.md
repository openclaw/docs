---
read_when:
    - U moet door de operator beheerde proxyrouting valideren vóór de implementatie
    - Je moet OpenClaw-transportverkeer lokaal vastleggen voor foutopsporing
    - U wilt debugproxysessies, blobs of ingebouwde queryvoorinstellingen inspecteren
summary: CLI-referentie voor `openclaw proxy`, inclusief door de operator beheerde proxyvalidatie en de lokale inspectietool voor vastgelegde debugproxygegevens
title: Proxy
x-i18n:
    generated_at: "2026-07-12T08:43:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valideer door de operator beheerde proxyrouting, of voer de lokale expliciete debugproxy uit en inspecteer vastgelegd verkeer.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` voert een voorbereidende controle uit op een door de operator beheerde forward proxy. De overige opdrachten zijn debughulpmiddelen voor onderzoek op transportniveau: start een lokale proxy die verkeer vastlegt, voer er een onderliggende opdracht door uit, geef vastleggingssessies weer, bevraag verkeerspatronen, lees vastgelegde blobs en wis lokale vastleggingsgegevens.

## Valideren

Controleert de effectieve URL van de door de operator beheerde proxy uit `--proxy-url`, de configuratie (`proxy.proxyUrl`) of `OPENCLAW_PROXY_URL`, in die volgorde van prioriteit. Meldt een configuratieprobleem als er geen proxy is ingeschakeld en geconfigureerd; geef `--proxy-url` door voor een eenmalige voorbereidende controle zonder de configuratie te wijzigen.

Beheerde proxy-URL's gebruiken `http://` voor een niet-versleutelde forward-proxylistener, of `https://` wanneer OpenClaw eerst een TLS-verbinding met het proxyeindpunt moet openen voordat proxyverzoeken worden verzonden. Gebruik `--proxy-ca-file` om een privé-CA voor die TLS-verbinding te vertrouwen.

Standaard worden de volgende controles uitgevoerd:

- één **toegestane** controle voor `https://example.com/` (overschrijven/toevoegen met `--allowed-url`, herhaalbaar)
- één **geweigerde** controle voor een tijdelijke loopback-kanarie (overschrijven met `--denied-url`, herhaalbaar)

Aangepaste `--denied-url`-doelen hanteren een gesloten foutafhandeling: zowel HTTP-antwoorden als ambigue transportfouten gelden als mislukkingen, tenzij u onafhankelijk een implementatiespecifiek weigeringssignaal kunt verifiëren. De ingebouwde loopback-kanarie is het enige doel waarbij een transportfout als bewijs van blokkering geldt.

Voeg `--apns-reachable` toe om ook via de proxy een APNs HTTP/2 CONNECT-tunnel te openen en te bevestigen dat de APNs-sandbox antwoordt. De test verzendt opzettelijk een ongeldig providertoken, waardoor een APNs-antwoord `403 InvalidProviderToken` geldt als een geslaagd bereikbaarheidssignaal (niet als een fout).

### Opties

| Vlag                     | Effect                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | machineleesbare JSON afdrukken                                                                                             |
| `--proxy-url <url>`      | deze `http://`/`https://`-proxy-URL valideren in plaats van de configuratie of omgevingsvariabele                           |
| `--proxy-ca-file <path>` | dit PEM-CA-bestand vertrouwen voor TLS-verificatie van een HTTPS-proxyeindpunt                                              |
| `--allowed-url <url>`    | bestemming die naar verwachting via de proxy bereikbaar is (herhaalbaar)                                                   |
| `--denied-url <url>`     | bestemming die naar verwachting door de proxy wordt geblokkeerd (herhaalbaar)                                               |
| `--apns-reachable`       | ook verifiëren dat APNs HTTP/2 voor de sandbox via de proxy bereikbaar is                                                   |
| `--apns-authority <url>` | te testen APNs-authoriteit (standaard `https://api.sandbox.push.apple.com`; productie is `https://api.push.apple.com`)      |
| `--timeout-ms <ms>`      | time-out per verzoek                                                                                                       |

Wordt afgesloten met code 1 wanneer de proxyconfiguratie of bestemmingscontroles mislukken.

Zie [Netwerkproxy](/nl/security/network-proxy) voor implementatierichtlijnen en de semantiek van weigeringen.

## Debugproxy

`start` start een lokale proxy die verkeer vastlegt en drukt de URL, het pad naar het CA-certificaat en het pad naar de vastleggingsdatabase af; stop met Ctrl+C. Standaard wordt aan `127.0.0.1` gebonden, tenzij `--host` is ingesteld.

`run` start een lokale debugproxy en voert vervolgens `<cmd...>` (na `--`) uit met de proxyomgevingsvariabelen toegepast, binnen een eigen vastleggingssessie.

De directe upstream-doorsturing van de debugproxy opent upstream-sockets voor diagnose. Wanneer de beheerde proxymodus van OpenClaw actief is, is directe doorsturing voor proxyverzoeken en CONNECT-tunnels standaard uitgeschakeld; stel `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` alleen in voor goedgekeurde lokale diagnostiek.

`coverage` drukt een JSON-rapport af (`summary` en `entries` per transport) waarin staat welke transporten worden vastgelegd, uitsluitend via een proxy verlopen of niet worden gedekt.

`sessions` geeft recente vastleggingssessies weer (`--limit`, standaard 20).

`query --preset <name>` voert een ingebouwde query uit op vastgelegd verkeer, eventueel beperkt tot `--session <id>`. Voorinstellingen:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` drukt de onbewerkte inhoud van een vastgelegde payloadblob af.

`purge` verwijdert alle metagegevens en blobs van vastgelegd verkeer. Vastleggingen zijn lokale debuggegevens; wis ze wanneer u klaar bent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Netwerkproxy](/nl/security/network-proxy)
- [Verificatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)
