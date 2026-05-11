---
read_when:
    - Sie möchten ein Systemereignis in die Warteschlange einreihen, ohne einen Cron-Job zu erstellen
    - Sie müssen Heartbeats aktivieren oder deaktivieren
    - Sie möchten System-Präsenz-Einträge einsehen
summary: CLI-Referenz für `openclaw system` (Systemereignisse, Heartbeat, Präsenz)
title: System
x-i18n:
    generated_at: "2026-05-11T20:26:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Systemweite Helfer für den Gateway: Systemereignisse einreihen, Heartbeats steuern
und Präsenz anzeigen.

Alle `system`-Unterbefehle verwenden Gateway-RPC und akzeptieren die gemeinsamen Client-Flags:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Häufige Befehle

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Reiht standardmäßig ein Systemereignis in der **Haupt**-Sitzung ein. Der nächste Heartbeat
fügt es als `System:`-Zeile in den Prompt ein. Verwenden Sie `--mode now`, um
den Heartbeat sofort auszulösen; `next-heartbeat` wartet auf den nächsten geplanten Tick.

Übergeben Sie `--session-key`, um eine bestimmte Sitzung anzusteuern (zum Beispiel, um den
Abschluss einer asynchronen Aufgabe an den Kanal zurückzumelden, der sie gestartet hat).

> **Timing-Ausnahme mit `--session-key`:** Wenn `--session-key` angegeben wird,
> wird `--mode next-heartbeat` zu einem sofortigen gezielten Wake, statt
> auf den nächsten geplanten Tick zu warten. Gezielte Wakes verwenden die Heartbeat-Absicht
> `immediate`, sodass sie die Noch-nicht-fällig-Sperre des Runners umgehen, die andernfalls
> einen Wake mit `event`-Absicht verzögern (und effektiv verwerfen) würde. Wenn Sie eine verzögerte
> Zustellung wünschen, lassen Sie `--session-key` weg, sodass das Ereignis in der Hauptsitzung landet und
> mit dem nächsten regulären Heartbeat mitläuft.

Flags:

- `--text <text>`: erforderlicher Systemereignistext.
- `--mode <mode>`: `now` oder `next-heartbeat` (Standard).
- `--session-key <sessionKey>`: optional; steuert eine bestimmte Agent-Sitzung an
  statt der Hauptsitzung des Agenten. Schlüssel, die nicht zum
  aufgelösten Agenten gehören, fallen auf die Hauptsitzung des Agenten zurück.
- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system heartbeat last|enable|disable`

Heartbeat-Steuerung:

- `last`: zeigt das letzte Heartbeat-Ereignis an.
- `enable`: schaltet Heartbeats wieder ein (verwenden Sie dies, wenn sie deaktiviert wurden).
- `disable`: pausiert Heartbeats.

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system presence`

Listet die aktuellen Systempräsenz-Einträge auf, die dem Gateway bekannt sind (Nodes,
Instanzen und ähnliche Statuszeilen).

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## Hinweise

- Erfordert einen laufenden Gateway, der über Ihre aktuelle Konfiguration erreichbar ist (lokal oder remote).
- Systemereignisse sind flüchtig und bleiben über Neustarts hinweg nicht erhalten.

## Verwandt

- [CLI-Referenz](/de/cli)
