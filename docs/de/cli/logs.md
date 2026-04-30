---
read_when:
    - Sie müssen Gateway-Logs remote live verfolgen (ohne SSH)
    - Sie möchten JSON-Logzeilen für Werkzeuge
summary: CLI-Referenz für `openclaw logs` (Gateway-Logs per RPC fortlaufend anzeigen)
title: Protokolle
x-i18n:
    generated_at: "2026-04-30T06:45:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateilogs per RPC live verfolgen (funktioniert im Remote-Modus).

Verwandt:

- Protokollierungsübersicht: [Protokollierung](/de/logging)
- Gateway-CLI: [gateway](/de/cli/gateway)

## Optionen

- `--limit <n>`: maximale Anzahl der zurückzugebenden Logzeilen (Standard `200`)
- `--max-bytes <n>`: maximale Anzahl Bytes, die aus der Logdatei gelesen werden (Standard `250000`)
- `--follow`: dem Logstream folgen
- `--interval <ms>`: Polling-Intervall beim Folgen (Standard `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Klartextausgabe ohne gestaltete Formatierung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen

## Gemeinsame Gateway-RPC-Optionen

`openclaw logs` akzeptiert auch die Standard-Flags des Gateway-Clients:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Timeout in ms (Standard `30000`)
- `--expect-final`: auf eine abschließende Antwort warten, wenn der Gateway-Aufruf agentengestützt ist

Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungsanmeldedaten nicht automatisch an. Geben Sie `--token` explizit an, wenn das Ziel-Gateway Authentifizierung erfordert.

## Beispiele

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

## Hinweise

- Verwenden Sie `--local-time`, um Zeitstempel in Ihrer lokalen Zeitzone darzustellen.
- Wenn das implizite lokale local loopback-Gateway nach Pairing fragt, während der Verbindung schließt oder ein Timeout auftritt, bevor `logs.tail` antwortet, fällt `openclaw logs` automatisch auf die konfigurierte Gateway-Dateilogdatei zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Protokollierung](/de/gateway/logging)
