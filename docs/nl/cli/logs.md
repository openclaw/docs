---
read_when:
    - Je moet Gateway-logboeken op afstand volgen (zonder SSH)
    - U wilt JSON-logregels voor tooling
summary: CLI-referentie voor `openclaw logs` (Gateway-logboeken volgen via RPC)
title: Logboeken
x-i18n:
    generated_at: "2026-07-12T08:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Volg Gateway-bestandslogboeken via RPC. Werkt in externe modus.

## Opties

- `--limit <n>`: maximaal aantal te retourneren logregels (standaard `200`)
- `--max-bytes <n>`: maximaal aantal bytes dat uit het logbestand wordt gelezen (standaard `250000`)
- `--follow`: volg de logboekstroom
- `--interval <ms>`: pollinginterval tijdens het volgen (standaard `1000`)
- `--json`: voer door regels gescheiden JSON-gebeurtenissen uit
- `--plain`: uitvoer als platte tekst zonder opgemaakte vormgeving
- `--no-color`: schakel ANSI-kleuren uit
- `--local-time`: geef tijdstempels weer in uw lokale tijdzone (standaard)
- `--utc`: geef tijdstempels weer in UTC

## Gedeelde RPC-opties voor de Gateway

- `--url <url>`: WebSocket-URL van de Gateway
- `--token <token>`: token van de Gateway
- `--timeout <ms>`: time-out in ms (standaard `30000`)
- `--expect-final`: wacht op een definitief antwoord wanneer de Gateway-aanroep door een agent wordt afgehandeld

Wanneer u `--url` opgeeft, worden configuratiereferenties niet automatisch toegepast. Neem `--token` expliciet op als de doel-Gateway authenticatie vereist.

## Voorbeelden

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Terugval- en herstelgedrag

- Als de impliciete lokale local loopback-Gateway om koppeling vraagt, tijdens het verbinden wordt gesloten of een time-out optreedt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het geconfigureerde Gateway-logbestand. Expliciete `--url`-doelen gebruiken deze terugval nooit.
- `--follow` valt na een RPC-fout van een impliciete lokale Gateway niet terug op dat geconfigureerde bestand: een verouderd bestand ernaast kan een live gevolgde logboekstroom misleidend maken. Op Linux wordt in plaats daarvan, indien beschikbaar, het actieve Gateway-journaal van de systemd-gebruikersservice op basis van PID gebruikt (de geselecteerde bron wordt weergegeven); anders blijft de live Gateway opnieuw worden geprobeerd.
- Tijdens `--follow` leiden tijdelijke verbrekingen (sluiten van WebSocket, time-out, wegvallen van verbinding) tot automatische herverbinding met exponentiële wachttijd: maximaal 8 pogingen, met maximaal 30 seconden tussen pogingen. Bij elke nieuwe poging wordt een waarschuwing naar stderr geschreven en zodra een pollingpoging slaagt, wordt eenmaal de melding `[logs] gateway reconnected` weergegeven. In de modus `--json` worden beide als `{"type":"notice"}`-records naar stderr geschreven. Niet-herstelbare fouten (mislukte authenticatie, onjuiste configuratie) beëindigen het proces nog steeds onmiddellijk.
- In de modus `--follow --json` worden overgangen tussen logboekbronnen als `{"type":"meta"}`-records uitgevoerd. Houd cursors per `sourceKind` bij: een stroom kan van uitvoer uit het Gateway-logbestand (`sourceKind: "file"`) overschakelen naar de terugval op het lokale journaal (`sourceKind: "journal"`, `localFallback: true`, met `service.pid`/`service.unit`) en na herstel terugkeren naar uitvoer uit het Gateway-logbestand. Ga niet uit van één stabiele bron of cursor voor de gehele sessie en sta overlappende regels toe wanneer tijdens herstel de cursor van het Gateway-logbestand opnieuw wordt afgespeeld.

## Gerelateerd

- [Overzicht van logboekregistratie](/nl/logging)
- [Gateway-CLI](/nl/cli/gateway)
- [CLI-referentie](/nl/cli)
- [Gateway-logboekregistratie](/nl/gateway/logging)
