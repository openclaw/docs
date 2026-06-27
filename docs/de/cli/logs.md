---
read_when:
    - Sie müssen Gateway-Protokolle remote verfolgen (ohne SSH)
    - Sie möchten JSON-Protokollzeilen für Werkzeuge.
summary: CLI-Referenz für `openclaw logs` (Gateway-Logs per RPC mitverfolgen)
title: Protokolle
x-i18n:
    generated_at: "2026-06-27T17:18:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateilogs per RPC fortlaufend ausgeben (funktioniert im Remote-Modus).

Verwandt:

- Logging-Übersicht: [Logging](/de/logging)
- Gateway-CLI: [gateway](/de/cli/gateway)

## Optionen

- `--limit <n>`: maximale Anzahl zurückzugebender Logzeilen (Standard `200`)
- `--max-bytes <n>`: maximale Anzahl von Bytes, die aus der Logdatei gelesen werden (Standard `250000`)
- `--follow`: dem Logstream folgen
- `--interval <ms>`: Abfrageintervall beim Folgen (Standard `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Klartextausgabe ohne gestaltete Formatierung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen (Standard)
- `--utc`: Zeitstempel in UTC darstellen

## Gemeinsam genutzte Gateway-RPC-Optionen

`openclaw logs` akzeptiert auch die Standard-Flags des Gateway-Clients:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Timeout in ms (Standard `30000`)
- `--expect-final`: auf eine finale Antwort warten, wenn der Gateway-Aufruf agentengestützt ist

Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungsanmeldedaten nicht automatisch an. Geben Sie `--token` explizit an, wenn der Ziel-Gateway Authentifizierung erfordert.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Hinweise

- Zeitstempel werden standardmäßig in Ihrer lokalen Zeitzone dargestellt. Verwenden Sie `--utc` für UTC-Ausgabe.
- Wenn der implizite local loopback-Gateway nach Pairing fragt, während der Verbindung geschlossen wird oder per Timeout abbricht, bevor `logs.tail` antwortet, fällt `openclaw logs` automatisch auf die konfigurierte Gateway-Dateilog zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.
- `openclaw logs --follow` folgt nach impliziten lokalen Gateway-RPC-Fehlern keinen konfigurierten Dateifallbacks. Unter Linux verwendet es, sofern verfügbar, das aktive Benutzer-systemd-Gateway-Journal nach PID und gibt die ausgewählte Logquelle aus; andernfalls wiederholt es den Live-Gateway, statt eine möglicherweise veraltete parallel liegende Datei zu verfolgen.
- Bei Verwendung von `--follow` lösen vorübergehende Gateway-Trennungen (WebSocket-Schließung, Timeout, Verbindungsabbruch) eine automatische Wiederverbindung mit exponentiellem Backoff aus (bis zu 8 Wiederholungen, begrenzt auf 30 s zwischen Versuchen). Bei jedem Wiederholungsversuch wird eine Warnung auf stderr ausgegeben, und ein Hinweis `[logs] gateway reconnected` wird ausgegeben, sobald eine Abfrage erfolgreich ist. Im Modus `--json` werden sowohl die Wiederholungswarnung als auch der Wiederverbindungsübergang als `{"type":"notice"}`-Datensätze auf stderr ausgegeben. Nicht behebbare Fehler (Authentifizierungsfehler, fehlerhafte Konfiguration) beenden den Prozess weiterhin sofort.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Logging](/de/gateway/logging)
