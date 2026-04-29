---
read_when:
    - Je moet Gateway-logboeken op afstand volgen (zonder SSH)
    - Je wilt JSON-logregels voor tooling
summary: CLI-referentie voor `openclaw logs` (Gateway-logs volgen via RPC)
title: Logboeken
x-i18n:
    generated_at: "2026-04-29T22:32:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Volg Gateway-bestandslogs via RPC (werkt in externe modus).

Gerelateerd:

- Loggingoverzicht: [Logging](/nl/logging)
- Gateway-CLI: [gateway](/nl/cli/gateway)

## Opties

- `--limit <n>`: maximum aantal logregels om te retourneren (standaard `200`)
- `--max-bytes <n>`: maximum aantal bytes om uit het logbestand te lezen (standaard `250000`)
- `--follow`: volg de logstream
- `--interval <ms>`: pollinginterval tijdens volgen (standaard `1000`)
- `--json`: geef regelgescheiden JSON-gebeurtenissen uit
- `--plain`: uitvoer als platte tekst zonder gestileerde opmaak
- `--no-color`: schakel ANSI-kleuren uit
- `--local-time`: geef tijdstempels weer in je lokale tijdzone

## Gedeelde Gateway RPC-opties

`openclaw logs` accepteert ook de standaard Gateway-clientflags:

- `--url <url>`: Gateway WebSocket-URL
- `--token <token>`: Gateway-token
- `--timeout <ms>`: time-out in ms (standaard `30000`)
- `--expect-final`: wacht op een definitieve reactie wanneer de Gateway-aanroep door een agent wordt ondersteund

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Opmerkingen

- Gebruik `--local-time` om tijdstempels weer te geven in je lokale tijdzone.
- Als de impliciete local loopback Gateway om koppeling vraagt, sluit tijdens verbinden, of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-logging](/nl/gateway/logging)
