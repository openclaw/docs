---
read_when:
    - Sie müssen Gateway-Protokolle aus der Ferne fortlaufend anzeigen (ohne SSH)
    - Sie möchten JSON-Protokollzeilen für Tools.
summary: CLI-Referenz für `openclaw logs` (Gateway-Protokolle per RPC fortlaufend anzeigen)
title: Protokolle
x-i18n:
    generated_at: "2026-07-12T01:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateiprotokolle über RPC fortlaufend ausgeben. Funktioniert im Remote-Modus.

## Optionen

- `--limit <n>`: maximale Anzahl zurückzugebender Protokollzeilen (Standard: `200`)
- `--max-bytes <n>`: maximale Anzahl aus der Protokolldatei zu lesender Bytes (Standard: `250000`)
- `--follow`: dem Protokolldatenstrom folgen
- `--interval <ms>`: Abfrageintervall beim Folgen (Standard: `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: reine Textausgabe ohne formatierte Darstellung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen (Standard)
- `--utc`: Zeitstempel in UTC darstellen

## Gemeinsame Gateway-RPC-Optionen

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Zeitüberschreitung in ms (Standard: `30000`)
- `--expect-final`: auf eine abschließende Antwort warten, wenn der Gateway-Aufruf durch einen Agenten gestützt wird

Durch die Angabe von `--url` werden automatisch angewendete Anmeldedaten aus der Konfiguration übersprungen. Geben Sie `--token` ausdrücklich an, wenn das Ziel-Gateway eine Authentifizierung erfordert.

## Beispiele

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

## Fallback- und Wiederherstellungsverhalten

- Wenn das implizite local loopback Gateway eine Kopplung anfordert, während des Verbindungsaufbaus geschlossen wird oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, greift `openclaw logs` automatisch auf das konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden diesen Fallback niemals.
- `--follow` greift nach einem impliziten lokalen Gateway-RPC-Fehler nicht auf diese konfigurierte Datei zurück – eine veraltete parallel vorhandene Datei könnte bei der fortlaufenden Live-Ausgabe irreführend sein. Unter Linux verwendet es stattdessen, sofern verfügbar, anhand der PID das aktive Benutzer-systemd-Journal des Gateways (die ausgewählte Quelle wird ausgegeben); andernfalls versucht es weiterhin, die Verbindung zum aktiven Gateway herzustellen.
- Während `--follow` lösen vorübergehende Verbindungsabbrüche (Schließen des WebSockets, Zeitüberschreitung, Verbindungsverlust) eine automatische Wiederverbindung mit exponentiellem Backoff aus: bis zu 8 Wiederholungsversuche, mit maximal 30 Sekunden zwischen den Versuchen. Bei jedem Wiederholungsversuch wird eine Warnung auf stderr ausgegeben, und sobald eine Abfrage erfolgreich ist, wird einmal der Hinweis `[logs] gateway reconnected` ausgegeben. Im Modus `--json` werden beide als Datensätze vom Typ `{"type":"notice"}` auf stderr ausgegeben. Nicht behebbare Fehler (Authentifizierungsfehler, fehlerhafte Konfiguration) führen weiterhin zum sofortigen Beenden.
- Im Modus `--follow --json` werden Wechsel der Protokollquelle als Datensätze vom Typ `{"type":"meta"}` ausgegeben. Verfolgen Sie Cursor getrennt nach `sourceKind`: Ein Datenstrom kann von der Gateway-Dateiausgabe (`sourceKind: "file"`) zum lokalen Journal-Fallback (`sourceKind: "journal"`, `localFallback: true`, mit `service.pid`/`service.unit`) und nach der Wiederherstellung zurück zur Gateway-Dateiausgabe wechseln. Gehen Sie nicht von einer einzigen stabilen Quelle oder einem einzigen Cursor für die gesamte Sitzung aus, und tolerieren Sie sich überschneidende Zeilen, wenn bei der Wiederherstellung der Cursor der Gateway-Datei erneut wiedergegeben wird.

## Verwandte Themen

- [Übersicht zur Protokollierung](/de/logging)
- [Gateway-CLI](/de/cli/gateway)
- [CLI-Referenz](/de/cli)
- [Gateway-Protokollierung](/de/gateway/logging)
