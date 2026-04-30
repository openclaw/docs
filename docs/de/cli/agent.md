---
read_when:
    - Sie möchten eine Agentenrunde aus Skripten ausführen (optional eine Antwort zustellen)
summary: CLI-Referenz für `openclaw agent` (einen Agenten-Turn über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-04-30T06:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Führen Sie einen Agentendurchlauf über das Gateway aus (verwenden Sie `--local` für eingebettet).
Verwenden Sie `--agent <id>`, um direkt einen konfigurierten Agenten anzusteuern.

Übergeben Sie mindestens einen Sitzungsauswähler:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Tool zum Senden an Agenten: [Agent senden](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zum Ableiten des Sitzungsschlüssels verwendet wird
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--model <id>`: Modellüberschreibung für diesen Lauf (`provider/model` oder Modell-ID)
- `--thinking <level>`: Denkstufe des Agenten (`off`, `minimal`, `low`, `medium`, `high` sowie vom Provider unterstützte benutzerdefinierte Stufen wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: ausführliche Stufe für die Sitzung dauerhaft speichern
- `--channel <channel>`: Zustellungskanal; auslassen, um den Hauptkanal der Sitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellungsziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: den eingebetteten Agenten direkt ausführen (nach dem Vorladen der Plugin-Registry)
- `--deliver`: die Antwort an den ausgewählten Kanal/das ausgewählte Ziel zurücksenden
- `--timeout <seconds>`: Agenten-Timeout überschreiben (Standard 600 oder Konfigurationswert)
- `--json`: JSON ausgeben

## Beispiele

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Hinweise

- Der Gateway-Modus fällt auf den eingebetteten Agenten zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von Anfang an zu erzwingen.
- `--local` lädt weiterhin zuerst die Plugin-Registry vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle während eingebetteter Läufe verfügbar bleiben.
- `--local` und eingebettete Fallback-Läufe werden als einmalige Läufe behandelt. Gebündelte MCP-loopback-Ressourcen und warme Claude-stdio-Sitzungen, die für diesen lokalen Prozess geöffnet wurden, werden nach der Antwort beendet, sodass skriptgesteuerte Aufrufe keine lokalen Kindprozesse am Leben halten.
- Gateway-gestützte Läufe belassen Gateway-eigene MCP-loopback-Ressourcen im laufenden Gateway-Prozess; ältere Clients senden möglicherweise weiterhin das historische Cleanup-Flag, aber das Gateway akzeptiert es aus Kompatibilitätsgründen als No-op.
- `--channel`, `--reply-channel` und `--reply-account` wirken sich auf die Antwortzustellung aus, nicht auf das Sitzungsrouting.
- `--json` hält stdout für die JSON-Antwort reserviert. Gateway-, Plugin- und Embedded-Fallback-Diagnosen werden an stderr geleitet, damit Skripte stdout direkt parsen können.
- Embedded-Fallback-JSON enthält `meta.transport: "embedded"` und `meta.fallbackFrom: "gateway"`, damit Skripte Fallback-Läufe von Gateway-Läufen unterscheiden können.
- Wenn das Gateway einen Agentenlauf akzeptiert, die CLI jedoch beim Warten auf die endgültige Antwort eine Zeitüberschreitung erreicht, verwendet der eingebettete Fallback eine neue explizite `gateway-fallback-*`-Sitzungs-/Lauf-ID und meldet `meta.fallbackReason: "gateway_timeout"` sowie die Fallback-Sitzungsfelder. Dadurch wird vermieden, mit der Gateway-eigenen Transkript-Sperre zu konkurrieren oder die ursprüngliche geroutete Konversationssitzung stillschweigend zu ersetzen.
- Wenn dieser Befehl die Neugenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als nicht geheime Marker dauerhaft gespeichert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster geheimer Klartext.
- Marker-Schreibvorgänge sind quellautoritativ: OpenClaw speichert Marker aus dem aktiven Quellkonfigurations-Snapshot, nicht aus aufgelösten geheimen Laufzeitwerten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agentenlaufzeit](/de/concepts/agent)
