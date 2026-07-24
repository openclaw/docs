---
read_when:
    - Sie möchten ein Systemereignis in die Warteschlange einreihen, ohne einen Cron-Job zu erstellen
    - Sie müssen Heartbeats aktivieren oder deaktivieren
    - Sie möchten die Systemanwesenheitseinträge prüfen
summary: CLI-Referenz für `openclaw system` (Systemereignisse, Heartbeat, Präsenz)
title: System
x-i18n:
    generated_at: "2026-07-24T04:51:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Hilfsfunktionen auf Systemebene für das Gateway: Systemereignisse in die Warteschlange einreihen, Heartbeats steuern und Präsenz anzeigen.

Alle Unterbefehle von `system` verwenden Gateway-RPC und akzeptieren die gemeinsamen Client-Flags:

| Flag              | Standardwert                         | Beschreibung                                                                                                                                                                                          |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | `gateway.remote.url`, wenn konfiguriert | Gateway-WebSocket-URL.                                                                                                                                                                                 |
| `--token <token>` | keiner                               | Gateway-Token (falls erforderlich).                                                                                                                                                                    |
| `--timeout <ms>`  | `30000`                              | RPC-Zeitüberschreitung in Millisekunden.                                                                                                                                                               |
| `--expect-final`  | aus                                  | Auf die endgültige Antwort warten (Agent).                                                                                                                                                             |
| `--json`          | aus                                  | JSON ausgeben. `heartbeat last/enable/disable` und `system presence` geben unabhängig von diesem Flag immer die rohe RPC-JSON-Nutzlast aus; `system event` verwendet es, um zwischen JSON und einer einfachen `ok`-Zeile umzuschalten. |

## Häufig verwendete Befehle

```bash
openclaw system event --text "Auf dringende Folgemaßnahmen prüfen" --mode now
openclaw system event --text "Auf dringende Folgemaßnahmen prüfen" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Standardmäßig wird ein Systemereignis in die **Hauptsitzung** eingereiht. Der nächste Heartbeat fügt es als `System:`-Zeile in den Prompt ein. Verwenden Sie `--mode now`, um den Heartbeat sofort auszulösen; `next-heartbeat` (Standardwert) wartet auf den nächsten geplanten Durchlauf.

Übergeben Sie `--session-key`, um eine bestimmte Sitzung anzusprechen, beispielsweise um den Abschluss einer asynchronen Aufgabe an den Channel zurückzumelden, der sie gestartet hat.

<Note>
**Zeitliche Ausnahme bei `--session-key`:** Wenn `--session-key` angegeben wird, wird `--mode next-heartbeat` zu einem sofortigen gezielten Aufwecken, statt auf den nächsten geplanten Durchlauf zu warten. Gezielte Aufweckvorgänge verwenden die Heartbeat-Absicht `immediate` und umgehen dadurch die „noch nicht fällig“-Sperre des Runners, die ein Aufwecken mit der Absicht `event` andernfalls verzögern (und praktisch verwerfen) würde. Wenn Sie eine verzögerte Zustellung wünschen, lassen Sie `--session-key` weg, damit das Ereignis in der Hauptsitzung landet und mit dem nächsten regulären Heartbeat übermittelt wird.
</Note>

Flags:

- `--text <text>`: erforderlicher Text des Systemereignisses.
- `--mode <mode>`: `now` oder `next-heartbeat` (Standardwert).
- `--session-key <sessionKey>`: optional; richtet sich an eine bestimmte Agentensitzung statt an die Hauptsitzung des Agenten. Schlüssel, die nicht zum aufgelösten Agenten gehören, greifen auf die Hauptsitzung des Agenten zurück.

## `system heartbeat last|enable|disable`

- `last`: letztes Heartbeat-Ereignis anzeigen.
- `enable`: Heartbeats wieder aktivieren (verwenden Sie dies, wenn sie deaktiviert wurden).
- `disable`: Heartbeats pausieren.

## `system presence`

Listet die aktuellen Systempräsenzeinträge auf, die dem Gateway bekannt sind (Nodes, Instanzen und ähnliche Statuszeilen).

## Hinweise

- Erfordert ein laufendes Gateway, das über Ihre aktuelle Konfiguration erreichbar ist (lokal oder remote).
- Systemereignisse sind flüchtig und bleiben nach Neustarts nicht erhalten.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
