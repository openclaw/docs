---
read_when:
    - Sie müssen Gateway-Logs remote verfolgen (ohne SSH)
    - Sie möchten JSON-Protokollzeilen für Tooling
summary: CLI-Referenz für `openclaw logs` (Gateway-Logs per RPC verfolgen)
title: Protokolle
x-i18n:
    generated_at: "2026-07-01T15:23:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateilogs per RPC verfolgen (funktioniert im Remote-Modus).

Verwandt:

- Logging-Übersicht: [Logging](/de/logging)
- Gateway-CLI: [gateway](/de/cli/gateway)

## Optionen

- `--limit <n>`: maximale Anzahl der zurückzugebenden Logzeilen (Standard `200`)
- `--max-bytes <n>`: maximale Anzahl von Bytes, die aus der Logdatei gelesen werden (Standard `250000`)
- `--follow`: dem Logstream folgen
- `--interval <ms>`: Abfrageintervall während des Folgens (Standard `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Klartextausgabe ohne gestaltete Formatierung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen (Standard)
- `--utc`: Zeitstempel in UTC darstellen

## Gemeinsame Gateway-RPC-Optionen

`openclaw logs` akzeptiert außerdem die standardmäßigen Gateway-Client-Flags:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Timeout in ms (Standard `30000`)
- `--expect-final`: auf eine finale Antwort warten, wenn der Gateway-Aufruf agentengestützt ist

Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungs-Anmeldedaten nicht automatisch an. Geben Sie `--token` explizit an, wenn der Ziel-Gateway Authentifizierung erfordert.

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
- Wenn der implizite local loopback Gateway eine Kopplung anfordert, während der Verbindung schließt oder ein Timeout auftritt, bevor `logs.tail` antwortet, fällt `openclaw logs` automatisch auf das konfigurierte Gateway-Dateilog zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.
- `openclaw logs --follow` folgt konfigurierten Dateifallbacks nach impliziten lokalen Gateway-RPC-Fehlern nicht weiter. Unter Linux verwendet es das aktive user-systemd-Gateway-Journal per PID, sofern verfügbar, und gibt die ausgewählte Logquelle aus; andernfalls versucht es weiter, den Live-Gateway erneut zu erreichen, statt eine potenziell veraltete nebeneinanderliegende Datei zu verfolgen.
- Bei Verwendung von `--follow` lösen vorübergehende Gateway-Verbindungsabbrüche (WebSocket-Schließung, Timeout, Verbindungsabbruch) eine automatische Wiederverbindung mit exponentiellem Backoff aus (bis zu 8 Wiederholungen, begrenzt auf 30 s zwischen Versuchen). Bei jeder Wiederholung wird eine Warnung auf stderr ausgegeben, und ein Hinweis `[logs] gateway reconnected` wird ausgegeben, sobald eine Abfrage erfolgreich ist. Im Modus `--json` werden sowohl die Wiederholungswarnung als auch der Wiederverbindungsübergang als `{"type":"notice"}`-Datensätze auf stderr ausgegeben. Nicht behebbare Fehler (Authentifizierungsfehler, fehlerhafte Konfiguration) beenden den Prozess weiterhin sofort.
- Im Modus `--follow --json` werden Logquellen-Übergänge als `{"type":"meta"}`-Datensätze ausgegeben. Consumer sollten Cursor pro `sourceKind` verfolgen: Ein Stream kann von Gateway-Dateiausgabe (`sourceKind: "file"`) zu lokalem Journal-Fallback (`sourceKind: "journal"`, `localFallback: true`, mit `service.pid`/`service.unit`) wechseln und nach der Wiederherstellung zurück zur Gateway-Dateiausgabe. Gehen Sie nicht von einer stabilen Quelle oder einem stabilen Cursor für die gesamte Follow-Sitzung aus, und tolerieren Sie überlappende Zeilen, wenn die Wiederherstellung den Gateway-Dateicursor erneut abspielt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Logging](/de/gateway/logging)
