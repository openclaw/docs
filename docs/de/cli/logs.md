---
read_when:
    - Sie müssen Gateway-Logs aus der Ferne live mitverfolgen (ohne SSH)
    - Sie möchten JSON-Logzeilen für Werkzeuge
summary: CLI-Referenz für `openclaw logs` (Gateway-Logs per RPC fortlaufend anzeigen)
title: Protokolle
x-i18n:
    generated_at: "2026-05-03T21:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateilogs über RPC verfolgen (funktioniert im Remote-Modus).

Verwandt:

- Logging-Überblick: [Logging](/de/logging)
- Gateway-CLI: [gateway](/de/cli/gateway)

## Optionen

- `--limit <n>`: maximale Anzahl zurückzugebender Logzeilen (Standard `200`)
- `--max-bytes <n>`: maximale Anzahl von Bytes, die aus der Logdatei gelesen werden (Standard `250000`)
- `--follow`: dem Logstream folgen
- `--interval <ms>`: Abfrageintervall während des Folgens (Standard `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Klartextausgabe ohne gestaltete Formatierung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen

## Gemeinsame Gateway-RPC-Optionen

`openclaw logs` akzeptiert auch die standardmäßigen Gateway-Client-Flags:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Timeout in ms (Standard `30000`)
- `--expect-final`: auf eine finale Antwort warten, wenn der Gateway-Aufruf agentengestützt ist

Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungsanmeldedaten nicht automatisch an. Geben Sie `--token` ausdrücklich an, wenn das Ziel-Gateway Authentifizierung erfordert.

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
- Wenn das implizite lokale local loopback-Gateway nach Pairing fragt, während der Verbindung geschlossen wird oder vor der Antwort von `logs.tail` einen Timeout erreicht, fällt `openclaw logs` automatisch auf das konfigurierte Gateway-Dateilog zurück. Ausdrückliche `--url`-Ziele verwenden diesen Fallback nicht.
- Bei Verwendung von `--follow` lösen vorübergehende Gateway-Verbindungsabbrüche (WebSocket-Schließung, Timeout, Verbindungsabbruch) eine automatische erneute Verbindung mit exponentiellem Backoff aus (bis zu 8 Wiederholungen, begrenzt auf 30 s zwischen Versuchen). Bei jedem Wiederholungsversuch wird eine Warnung auf stderr ausgegeben, und ein Hinweis `[logs] gateway reconnected` wird ausgegeben, sobald eine Abfrage erfolgreich ist. Im Modus `--json` werden sowohl die Wiederholungswarnung als auch der Übergang zur erneuten Verbindung als `{"type":"notice"}`-Datensätze auf stderr ausgegeben. Nicht behebbare Fehler (Authentifizierungsfehler, fehlerhafte Konfiguration) beenden weiterhin sofort.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Logging](/de/gateway/logging)
