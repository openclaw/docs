---
read_when:
    - Sie möchten Agent-Ausführungen aus Skripten oder über die Befehlszeile auslösen
    - Sie müssen Agentenantworten programmgesteuert an einen Chatkanal übermitteln
summary: Agent-Turns über die CLI ausführen und Antworten optional an Kanäle übermitteln
title: Agent senden
x-i18n:
    generated_at: "2026-05-06T07:04:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` führt eine einzelne Agent-Ausführung über die Befehlszeile aus, ohne
dass eine eingehende Chatnachricht erforderlich ist. Verwenden Sie es für skriptgesteuerte Workflows, Tests und
programmatische Zustellung.

## Schnellstart

<Steps>
  <Step title="Einfache Agent-Ausführung starten">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dadurch wird die Nachricht über das Gateway gesendet und die Antwort ausgegeben.

  </Step>

  <Step title="Bestimmten Agent oder bestimmte Sitzung ansteuern">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Antwort an einen Kanal zustellen">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Beschreibung                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Zu sendende Nachricht (erforderlich)                        |
| `--to \<dest\>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefon, Chat-ID) |
| `--agent \<id\>`              | Konfigurierten Agent ansteuern (verwendet dessen `main`-Sitzung) |
| `--session-id \<id\>`         | Vorhandene Sitzung anhand der ID wiederverwenden            |
| `--local`                     | Lokale eingebettete Laufzeit erzwingen (Gateway überspringen) |
| `--deliver`                   | Antwort an einen Chatkanal senden                           |
| `--channel \<name\>`          | Zustellungskanal (whatsapp, telegram, discord, slack usw.)  |
| `--reply-to \<target\>`       | Zustellungsziel überschreiben                               |
| `--reply-channel \<name\>`    | Zustellungskanal überschreiben                              |
| `--reply-account \<id\>`      | ID des Zustellungskontos überschreiben                      |
| `--thinking \<level\>`        | Denkstufe für das ausgewählte Modellprofil festlegen        |
| `--verbose \<on\|full\|off\>` | Ausführlichkeitsstufe festlegen                             |
| `--timeout \<seconds\>`       | Agent-Timeout überschreiben                                 |
| `--json`                      | Strukturiertes JSON ausgeben                                |

## Verhalten

- Standardmäßig läuft die CLI **über das Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Laufzeit auf dem aktuellen Rechner zu erzwingen.
- Wenn das Gateway nicht erreichbar ist, **fällt die CLI auf** die lokale eingebettete Ausführung zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  behalten die Isolation bei; direkte Chats werden auf `main` zusammengeführt).
- Thinking- und Verbose-Flags werden im Sitzungsspeicher beibehalten.
- Ausgabe: standardmäßig Nur-Text oder `--json` für strukturierte Nutzdaten und Metadaten.

## Beispiele

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Agent-CLI-Referenz" href="/de/cli/agent" icon="terminal">
    Vollständige Referenz zu Flags und Optionen von `openclaw agent`.
  </Card>
  <Card title="Sub-Agents" href="/de/tools/subagents" icon="users">
    Erzeugen von Sub-Agents im Hintergrund.
  </Card>
  <Card title="Sitzungen" href="/de/concepts/session" icon="comments">
    Wie Sitzungsschlüssel funktionieren und wie `--to`, `--agent` und `--session-id` sie auflösen.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="slash">
    Nativer Befehlskatalog, der innerhalb von Agent-Sitzungen verwendet wird.
  </Card>
</CardGroup>
