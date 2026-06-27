---
read_when:
    - Je moet Gateway-logboeken op afstand volgen (zonder SSH)
    - Je wilt JSON-logregels voor tooling
summary: CLI-referentie voor `openclaw logs` (Gateway-logboeken volgen via RPC)
title: Logboeken
x-i18n:
    generated_at: "2026-06-27T17:19:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Volg Gateway-bestandslogs via RPC (werkt in externe modus).

Gerelateerd:

- Overzicht van logging: [Logging](/nl/logging)
- Gateway CLI: [gateway](/nl/cli/gateway)

## Opties

- `--limit <n>`: maximaal aantal logregels om te retourneren (standaard `200`)
- `--max-bytes <n>`: maximaal aantal bytes om uit het logbestand te lezen (standaard `250000`)
- `--follow`: volg de logstream
- `--interval <ms>`: pollinginterval tijdens volgen (standaard `1000`)
- `--json`: geef regelgescheiden JSON-events uit
- `--plain`: plattetekstuitvoer zonder gestileerde opmaak
- `--no-color`: schakel ANSI-kleuren uit
- `--local-time`: render tijdstempels in je lokale tijdzone (standaard)
- `--utc`: render tijdstempels in UTC

## Gedeelde Gateway RPC-opties

`openclaw logs` accepteert ook de standaard Gateway-clientvlaggen:

- `--url <url>`: Gateway WebSocket-URL
- `--token <token>`: Gateway-token
- `--timeout <ms>`: time-out in ms (standaard `30000`)
- `--expect-final`: wacht op een eindantwoord wanneer de Gateway-aanroep door een agent wordt ondersteund

Wanneer je `--url` doorgeeft, past de CLI configuratie- of omgevingsreferenties niet automatisch toe. Voeg `--token` expliciet toe als de doel-Gateway auth vereist.

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

- Tijdstempels worden standaard in je lokale tijdzone weergegeven. Gebruik `--utc` voor UTC-uitvoer.
- Als de impliciete local loopback Gateway om koppeling vraagt, tijdens het verbinden sluit, of een time-out bereikt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.
- `openclaw logs --follow` volgt geen geconfigureerde-bestandsfallbacks na impliciete lokale Gateway RPC-fouten. Op Linux gebruikt het, indien beschikbaar, het actieve user-systemd Gateway-journal op PID en drukt het de geselecteerde logbron af; anders blijft het de live Gateway opnieuw proberen in plaats van een mogelijk verouderd naastliggend bestand te volgen.
- Bij gebruik van `--follow` activeren tijdelijke Gateway-verbindingverbrekingen (WebSocket-sluiting, time-out, weggevallen verbinding) automatisch opnieuw verbinden met exponentiële backoff (tot 8 pogingen, begrensd op 30 s tussen pogingen). Bij elke nieuwe poging wordt een waarschuwing naar stderr geschreven, en er wordt een melding `[logs] gateway reconnected` afgedrukt zodra een poll slaagt. In `--json`-modus worden zowel de waarschuwing voor de nieuwe poging als de overgang naar opnieuw verbonden uitgegeven als `{"type":"notice"}`-records op stderr. Niet-herstelbare fouten (auth-fout, ongeldige configuratie) sluiten nog steeds onmiddellijk af.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-logging](/nl/gateway/logging)
