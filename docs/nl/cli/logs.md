---
read_when:
    - Je moet Gateway-logboeken op afstand volgen (zonder SSH)
    - Je wilt JSON-logregels voor hulpmiddelen
summary: CLI-referentie voor `openclaw logs` (Gateway-logboeken volgen via RPC)
title: Logboeken
x-i18n:
    generated_at: "2026-07-01T15:28:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Volg Gateway-bestandslogs via RPC (werkt in externe modus).

Gerelateerd:

- Overzicht van logging: [Logging](/nl/logging)
- Gateway-CLI: [gateway](/nl/cli/gateway)

## Opties

- `--limit <n>`: maximaal aantal logregels om terug te geven (standaard `200`)
- `--max-bytes <n>`: maximaal aantal bytes om uit het logbestand te lezen (standaard `250000`)
- `--follow`: volg de logstream
- `--interval <ms>`: pollinginterval tijdens het volgen (standaard `1000`)
- `--json`: geef regelgescheiden JSON-gebeurtenissen uit
- `--plain`: uitvoer in platte tekst zonder gestileerde opmaak
- `--no-color`: schakel ANSI-kleuren uit
- `--local-time`: render tijdstempels in je lokale tijdzone (standaard)
- `--utc`: render tijdstempels in UTC

## Gedeelde Gateway-RPC-opties

`openclaw logs` accepteert ook de standaard Gateway-clientvlaggen:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-token
- `--timeout <ms>`: timeout in ms (standaard `30000`)
- `--expect-final`: wacht op een definitieve respons wanneer de Gateway-aanroep door een agent wordt ondersteund

Wanneer je `--url` meegeeft, past de CLI config- of omgevingsreferenties niet automatisch toe. Voeg `--token` expliciet toe als de doel-Gateway auth vereist.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Opmerkingen

- Tijdstempels worden standaard in je lokale tijdzone gerenderd. Gebruik `--utc` voor UTC-uitvoer.
- Als de impliciete local loopback Gateway om koppeling vraagt, tijdens het verbinden sluit, of een timeout krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.
- `openclaw logs --follow` volgt geen geconfigureerde-bestandsfallbacks na impliciete lokale Gateway-RPC-fouten. Op Linux gebruikt het, wanneer beschikbaar, het actieve user-systemd Gateway-journal per PID en print het de geselecteerde logbron; anders blijft het de live Gateway opnieuw proberen in plaats van een mogelijk verouderd naastgelegen bestand te volgen.
- Bij gebruik van `--follow` activeren tijdelijke Gateway-verbindingverbrekingen (WebSocket-sluiting, timeout, weggevallen verbinding) automatische herverbinding met exponentiële backoff (tot 8 nieuwe pogingen, begrensd op 30 s tussen pogingen). Bij elke nieuwe poging wordt een waarschuwing naar stderr geprint, en zodra een poll slaagt wordt een melding `[logs] gateway reconnected` geprint. In `--json`-modus worden zowel de waarschuwing voor de nieuwe poging als de herverbindingsovergang als `{"type":"notice"}`-records op stderr uitgegeven. Niet-herstelbare fouten (auth-fout, ongeldige configuratie) sluiten nog steeds direct af.
- In `--follow --json`-modus worden overgangen van logbron uitgegeven als `{"type":"meta"}`-records. Consumers moeten cursors per `sourceKind` bijhouden: een stream kan van Gateway-bestandsuitvoer (`sourceKind: "file"`) naar lokale journal-fallback (`sourceKind: "journal"`, `localFallback: true`, met `service.pid`/`service.unit`) gaan en na herstel terug naar Gateway-bestandsuitvoer. Ga niet uit van één stabiele bron of cursor voor de hele volgsessie, en tolereer overlappende regels wanneer herstel de Gateway-bestandscursor opnieuw afspeelt.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-logging](/nl/gateway/logging)
