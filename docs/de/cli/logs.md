---
read_when:
    - Sie müssen Gateway-Protokolle aus der Ferne verfolgen (ohne SSH)
    - Sie möchten JSON-Protokollzeilen für Tools
summary: CLI-Referenz für `openclaw logs` (Gateway-Protokolle per RPC verfolgen)
title: Protokolle
x-i18n:
    generated_at: "2026-07-24T03:42:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7c8dc40e70f2eb4f8d6ba8b75b91a33337786a146abbe401079ee374daa5a0c6
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway-Dateiprotokolle über RPC fortlaufend anzeigen. Funktioniert im Remote-Modus.

## Optionen

- `--limit <n>`: maximale Anzahl zurückzugebender Protokollzeilen (Standard: `200`)
- `--max-bytes <n>`: maximale Anzahl aus der Protokolldatei zu lesender Bytes (Standard: `250000`)
- `--follow`: dem Protokollstream folgen
- `--interval <ms>`: Abfrageintervall beim Folgen (Standard: `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Nur-Text-Ausgabe ohne formatierte Darstellung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen (Standard)
- `--utc`: Zeitstempel in UTC darstellen

## Gemeinsame Gateway-RPC-Optionen

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Zeitüberschreitung in ms (Standard: `30000`)
- `--expect-final`: bei einem agentengestützten Gateway-Aufruf auf eine abschließende Antwort warten

Durch die Übergabe von `--url` werden automatisch angewendete Anmeldedaten aus der Konfiguration übersprungen. Geben Sie `--token` ausdrücklich an, wenn das Ziel-Gateway eine Authentifizierung erfordert.

## Beispiele

```bash
openclaw logs
openclaw logs --follow
openclaw --dev logs --follow
openclaw --profile work logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Das ausgewählte Stammprofil entspricht der rotierenden Datei des Gateways: Das Standardprofil
verwendet `openclaw-YYYY-MM-DD.log`, benannte Profile hingegen
`openclaw-<profile>-YYYY-MM-DD.log` (zum Beispiel
`openclaw-dev-YYYY-MM-DD.log`).

## Fallback- und Wiederherstellungsverhalten

- Wenn das implizite lokale Loopback-Gateway eine Kopplung anfordert, die Verbindung beim Aufbau schließt oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, greift `openclaw logs` automatisch auf das konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden diesen Fallback niemals.
- `--follow` greift nach einem RPC-Fehler des impliziten lokalen Gateways nicht auf diese konfigurierte Datei zurück – eine veraltete, parallel vorhandene Datei könnte bei der fortlaufenden Live-Anzeige irreführend sein. Unter Linux wird stattdessen, sofern verfügbar, anhand der PID das aktive benutzerspezifische systemd-Journal des Gateways verwendet (die ausgewählte Quelle wird ausgegeben); andernfalls werden die Verbindungsversuche zum aktiven Gateway fortgesetzt.
- Während `--follow` lösen vorübergehende Verbindungsabbrüche (WebSocket-Schließung, Zeitüberschreitung, Verbindungsabbruch) eine automatische Neuverbindung mit exponentiellem Backoff aus: bis zu 8 Wiederholungsversuche mit maximal 30s zwischen den Versuchen. Bei jedem erneuten Versuch wird eine Warnung auf stderr ausgegeben, und sobald eine Abfrage erfolgreich ist, wird einmalig ein Hinweis vom Typ `[logs] gateway reconnected` ausgegeben. Im Modus `--json` werden beide als `{"type":"notice"}`-Datensätze auf stderr ausgegeben. Nicht behebbare Fehler (Authentifizierungsfehler, ungültige Konfiguration) führen weiterhin zum sofortigen Beenden.
- Im Modus `--follow --json` werden Übergänge zwischen Protokollquellen als `{"type":"meta"}`-Datensätze ausgegeben. Verfolgen Sie Cursor getrennt nach `sourceKind`: Ein Stream kann von der Gateway-Dateiausgabe (`sourceKind: "file"`) zum Fallback auf das lokale Journal (`sourceKind: "journal"`, `localFallback: true`, mit `service.pid`/`service.unit`) und nach der Wiederherstellung zurück zur Gateway-Dateiausgabe wechseln. Gehen Sie nicht davon aus, dass während der gesamten Sitzung eine einzige stabile Quelle oder ein einziger Cursor verwendet wird, und berücksichtigen Sie überlappende Zeilen, wenn bei der Wiederherstellung der Cursor der Gateway-Datei erneut abgespielt wird.

## Verwandte Themen

- [Protokollierungsübersicht](/de/logging)
- [Gateway-CLI](/de/cli/gateway)
- [CLI-Referenz](/de/cli)
- [Gateway-Protokollierung](/de/gateway/logging)
