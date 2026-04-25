---
read_when:
    - Sie möchten einen Agent-Turn aus Skripten ausführen (optional mit Zustellung der Antwort).
summary: CLI-Referenz für `openclaw agent` (einen Agent-Turn über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-04-25T13:42:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Einen Agent-Turn über das Gateway ausführen (für eingebettete Ausführung `--local` verwenden).
Verwenden Sie `--agent <id>`, um direkt einen konfigurierten Agenten anzusprechen.

Geben Sie mindestens einen Session-Selektor an:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Agent-Send-Tool: [Agent send](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zur Ableitung des Session-Schlüssels verwendet wird
- `--session-id <id>`: explizite Session-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--thinking <level>`: Thinking-Level des Agenten (`off`, `minimal`, `low`, `medium`, `high` sowie vom Anbieter unterstützte benutzerdefinierte Level wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: Verbose-Level für die Session persistent speichern
- `--channel <channel>`: Zustell-Channel; weglassen, um den Haupt-Session-Channel zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellziels
- `--reply-channel <channel>`: Überschreibung des Zustell-Channels
- `--reply-account <id>`: Überschreibung des Zustellkontos
- `--local`: den eingebetteten Agenten direkt ausführen (nach dem Vorladen der Plugin-Registry)
- `--deliver`: die Antwort an den ausgewählten Channel/das ausgewählte Ziel zurücksenden
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

- Der Gateway-Modus greift auf den eingebetteten Agenten zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von vornherein zu erzwingen.
- `--local` lädt dennoch zuerst die Plugin-Registry vor, sodass von Plugins bereitgestellte Anbieter, Tools und Channels auch bei eingebetteten Ausführungen verfügbar bleiben.
- Jeder Aufruf von `openclaw agent` wird als einmaliger Lauf behandelt. Gebündelte oder benutzerkonfigurierte MCP-Server, die für diesen Lauf geöffnet werden, werden nach der Antwort wieder beendet, selbst wenn der Befehl den Gateway-Pfad verwendet, sodass `stdio`-MCP-Child-Prozesse zwischen skriptgesteuerten Aufrufen nicht aktiv bleiben.
- `--channel`, `--reply-channel` und `--reply-account` beeinflussen die Antwortzustellung, nicht das Session-Routing.
- `--json` hält stdout für die JSON-Antwort reserviert. Diagnosen zu Gateway, Plugin und eingebettetem Fallback werden an stderr weitergeleitet, damit Skripte stdout direkt parsen können.
- Wenn dieser Befehl die Regenerierung von `models.json` auslöst, werden von SecretRef verwaltete Anbieter-Anmeldedaten als Nicht-Geheimnis-Markierungen persistent gespeichert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster Klartext von Geheimnissen.
- Markierungsschreibvorgänge sind von der Quelle autoritativ: OpenClaw speichert Markierungen aus dem aktiven Quellkonfigurations-Snapshot, nicht aus aufgelösten Laufzeit-Geheimniswerten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agent-Laufzeit](/de/concepts/agent)
