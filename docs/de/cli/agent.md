---
read_when:
    - Sie möchten einen Agent-Turn aus Skripten ausführen (optional mit Antwortzustellung)
summary: CLI-Referenz für `openclaw agent` (einen Agent-Turn über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-04-23T06:25:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Führen Sie einen Agent-Turn über das Gateway aus (verwenden Sie `--local` für eingebettet).
Verwenden Sie `--agent <id>`, um direkt einen konfigurierten Agent anzusprechen.

Geben Sie mindestens einen Sitzungsselektor an:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Agent-Sendetool: [Agent send](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zum Ableiten des Sitzungsschlüssels verwendet wird
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--thinking <level>`: Thinking-Stufe des Agent (`off`, `minimal`, `low`, `medium`, `high` sowie providerunterstützte benutzerdefinierte Stufen wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: ausführliche Stufe für die Sitzung persistent speichern
- `--channel <channel>`: Zustellungskanal; weglassen, um den Hauptsitzungskanal zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellungsziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: den eingebetteten Agent direkt ausführen (nach dem Vorladen der Plugin-Registrierung)
- `--deliver`: die Antwort an den ausgewählten Kanal bzw. das ausgewählte Ziel zurücksenden
- `--timeout <seconds>`: Agent-Timeout überschreiben (Standard 600 oder Konfigurationswert)
- `--json`: JSON ausgeben

## Beispiele

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Hinweise

- Der Gateway-Modus fällt auf den eingebetteten Agent zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von vornherein zu erzwingen.
- `--local` lädt weiterhin zuerst die Plugin-Registrierung vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle bei eingebetteten Ausführungen verfügbar bleiben.
- `--channel`, `--reply-channel` und `--reply-account` wirken sich auf die Antwortzustellung aus, nicht auf das Sitzungsrouting.
- Wenn dieser Befehl die Neugenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als Nicht-Geheimnis-Markierungen persistent gespeichert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster Geheimtext.
- Markierungsschreibvorgänge sind an der Quelle autoritativ: OpenClaw persistiert Markierungen aus dem aktiven Konfigurations-Snapshot der Quelle, nicht aus aufgelösten Laufzeit-Geheimniswerten.
