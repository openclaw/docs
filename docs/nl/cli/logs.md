---
read_when:
    - Je moet Gateway-logboeken op afstand volgen (zonder SSH)
    - Je wilt JSON-logregels voor hulpprogramma's
summary: CLI-referentie voor `openclaw logs` (Gateway-logboeken volgen via RPC)
title: Logboeken
x-i18n:
    generated_at: "2026-05-03T11:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Volg Gateway-bestandslogs live via RPC (werkt in externe modus).

Gerelateerd:

- Overzicht van logregistratie: [Logregistratie](/nl/logging)
- Gateway-CLI: [gateway](/nl/cli/gateway)

## Opties

- `--limit <n>`: maximaal aantal logregels om terug te geven (standaard `200`)
- `--max-bytes <n>`: maximaal aantal bytes om uit het logbestand te lezen (standaard `250000`)
- `--follow`: volg de logstream
- `--interval <ms>`: pollinginterval tijdens volgen (standaard `1000`)
- `--json`: geef regelgescheiden JSON-gebeurtenissen uit
- `--plain`: plattetekstuitvoer zonder gestileerde opmaak
- `--no-color`: schakel ANSI-kleuren uit
- `--local-time`: geef tijdstempels weer in je lokale tijdzone

## Gedeelde Gateway-RPC-opties

`openclaw logs` accepteert ook de standaard Gateway-clientvlaggen:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-token
- `--timeout <ms>`: time-out in ms (standaard `30000`)
- `--expect-final`: wacht op een definitieve reactie wanneer de Gateway-aanroep door een agent wordt ondersteund

Wanneer je `--url` meegeeft, past de CLI configuratie- of omgevingsreferenties niet automatisch toe. Voeg `--token` expliciet toe als de doel-Gateway authenticatie vereist.

## Voorbeelden

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Opmerkingen

- Gebruik `--local-time` om tijdstempels weer te geven in je lokale tijdzone.
- Als de impliciete local loopback-Gateway om koppeling vraagt, sluit tijdens het verbinden, of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.
- Bij gebruik van `--follow` leiden tijdelijke gateway-verbindingsverbrekingen (WebSocket sluiten, time-out, wegvallende verbinding) tot automatische herverbinding met exponentiële back-off (tot 8 nieuwe pogingen, begrensd op 30 s tussen pogingen). Bij elke nieuwe poging wordt een waarschuwing naar stderr geschreven, en zodra een poll slaagt wordt een melding `[logs] gateway reconnected` geschreven. In `--json`-modus worden zowel de waarschuwing voor de nieuwe poging als de overgang naar herverbinding als `{"type":"notice"}`-records naar stderr uitgevoerd. Niet-herstelbare fouten (authenticatiefout, ongeldige configuratie) sluiten nog steeds onmiddellijk af.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-logregistratie](/nl/gateway/logging)
