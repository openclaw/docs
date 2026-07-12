---
read_when:
    - Sie möchten ein Systemereignis in die Warteschlange einreihen, ohne einen Cron-Job zu erstellen.
    - Sie müssen Heartbeats aktivieren oder deaktivieren
    - Sie möchten die Systemanwesenheitseinträge überprüfen
summary: CLI-Referenz für `openclaw system` (Systemereignisse, Heartbeat, Anwesenheit)
title: System
x-i18n:
    generated_at: "2026-07-12T15:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Hilfsfunktionen auf Systemebene für den Gateway: Systemereignisse in die Warteschlange einreihen, Heartbeats steuern und Anwesenheitsinformationen anzeigen.

Alle `system`-Unterbefehle verwenden Gateway-RPC und akzeptieren die gemeinsamen Client-Flags:

| Flag              | Standardwert                         | Beschreibung                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url`, sofern konfiguriert | Gateway-WebSocket-URL.                                                                                                                                                                                                                        |
| `--token <token>` | keiner                               | Gateway-Token (falls erforderlich).                                                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                              | RPC-Zeitüberschreitung in Millisekunden.                                                                                                                                                                                                      |
| `--expect-final`  | deaktiviert                          | Auf die endgültige Antwort warten (Agent).                                                                                                                                                                                                    |
| `--json`          | deaktiviert                          | JSON ausgeben. `heartbeat last/enable/disable` und `system presence` geben unabhängig von diesem Flag immer die unverarbeitete JSON-Nutzlast des RPC aus; `system event` wechselt damit zwischen JSON und einer einfachen `ok`-Zeile. |

## Häufig verwendete Befehle

```bash
openclaw system event --text "Auf dringende Folgemaßnahmen prüfen" --mode now
openclaw system event --text "Auf dringende Folgemaßnahmen prüfen" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Reiht standardmäßig ein Systemereignis in die **Hauptsitzung** ein. Der nächste Heartbeat fügt es als `System:`-Zeile in den Prompt ein. Verwenden Sie `--mode now`, um den Heartbeat sofort auszulösen; `next-heartbeat` (Standardwert) wartet auf den nächsten geplanten Durchlauf.

Übergeben Sie `--session-key`, um eine bestimmte Sitzung anzusprechen, beispielsweise um den Abschluss einer asynchronen Aufgabe an den Kanal zurückzumelden, der sie gestartet hat.

<Note>
**Zeitsteuerungsausnahme mit `--session-key`:** Wenn `--session-key` angegeben wird, führt `--mode next-heartbeat` zu einem sofortigen gezielten Aufwecken, statt auf den nächsten geplanten Durchlauf zu warten. Gezieltes Aufwecken verwendet die Heartbeat-Absicht `immediate` und umgeht dadurch die „noch nicht fällig“-Sperre des Runners, die andernfalls ein Aufwecken mit der Absicht `event` verzögern (und faktisch verwerfen) würde. Wenn Sie eine verzögerte Zustellung wünschen, lassen Sie `--session-key` weg, damit das Ereignis in der Hauptsitzung landet und mit dem nächsten regulären Heartbeat übermittelt wird.
</Note>

Flags:

- `--text <text>`: erforderlicher Text des Systemereignisses.
- `--mode <mode>`: `now` oder `next-heartbeat` (Standardwert).
- `--session-key <sessionKey>`: optional; richtet das Ereignis an eine bestimmte Agent-Sitzung statt an die Hauptsitzung des Agents. Schlüssel, die nicht zum ermittelten Agent gehören, greifen auf die Hauptsitzung des Agents zurück.

## `system heartbeat last|enable|disable`

- `last`: zeigt das letzte Heartbeat-Ereignis an.
- `enable`: aktiviert Heartbeats wieder (verwenden Sie dies, wenn sie deaktiviert wurden).
- `disable`: pausiert Heartbeats.

## `system presence`

Listet die aktuellen Einträge zur Systemanwesenheit auf, die dem Gateway bekannt sind (Nodes, Instanzen und ähnliche Statuszeilen).

## Hinweise

- Erfordert einen laufenden Gateway, der über Ihre aktuelle Konfiguration erreichbar ist (lokal oder remote).
- Systemereignisse sind flüchtig und bleiben bei Neustarts nicht erhalten.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
