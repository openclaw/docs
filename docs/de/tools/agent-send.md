---
read_when:
    - Sie möchten Agent-Ausführungen aus Skripten oder über die Befehlszeile auslösen
    - Sie müssen Agentenantworten programmgesteuert an einen Chat-Kanal übermitteln
summary: Führen Sie Agentendurchläufe über die CLI aus und stellen Sie Antworten optional an Kanäle zu
title: Agent senden
x-i18n:
    generated_at: "2026-05-10T19:53:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` führt einen einzelnen Agent-Turn über die Befehlszeile aus, ohne dass
eine eingehende Chatnachricht erforderlich ist. Verwenden Sie es für skriptgesteuerte Workflows, Tests und
programmatische Auslieferung.

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agent-Turn ausführen">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dies sendet die Nachricht über den Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen bestimmten Agent oder eine bestimmte Sitzung ansteuern">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Die Antwort an einen Kanal zustellen">
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
| `--agent \<id\>`              | Einen konfigurierten Agent ansteuern (verwendet dessen `main`-Sitzung) |
| `--session-id \<id\>`         | Eine vorhandene Sitzung nach ID wiederverwenden             |
| `--local`                     | Lokale eingebettete Runtime erzwingen (Gateway überspringen) |
| `--deliver`                   | Die Antwort an einen Chatkanal senden                       |
| `--channel \<name\>`          | Zustellungskanal (whatsapp, telegram, discord, slack usw.)  |
| `--reply-to \<target\>`       | Überschreibung des Zustellungsziels                         |
| `--reply-channel \<name\>`    | Überschreibung des Zustellungskanals                        |
| `--reply-account \<id\>`      | Überschreibung der Zustellungskonto-ID                      |
| `--thinking \<level\>`        | Thinking-Level für das ausgewählte Modellprofil festlegen   |
| `--verbose \<on\|full\|off\>` | Verbose-Level festlegen                                     |
| `--timeout \<seconds\>`       | Agent-Timeout überschreiben                                 |
| `--json`                      | Strukturiertes JSON ausgeben                                |

## Verhalten

- Standardmäßig läuft die CLI **über den Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Runtime auf dem aktuellen Computer zu erzwingen.
- Wenn der Gateway nicht erreichbar ist, **fällt die CLI** auf die lokale eingebettete Ausführung zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  behalten die Isolation bei; direkte Chats fallen auf `main` zusammen).
- Thinking- und Verbose-Flags bleiben im Sitzungsspeicher erhalten.
- Ausgabe: standardmäßig Klartext oder `--json` für strukturierte Nutzdaten + Metadaten.
- Mit `--json --deliver` enthält das JSON den Zustellungsstatus für gesendete,
  unterdrückte, teilweise und fehlgeschlagene Sendungen. Siehe
  [JSON-Zustellungsstatus](/de/cli/agent#json-delivery-status).

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
    Vollständige Referenz zu Flags und Optionen für `openclaw agent`.
  </Card>
  <Card title="Sub-Agents" href="/de/tools/subagents" icon="users">
    Starten von Sub-Agents im Hintergrund.
  </Card>
  <Card title="Sitzungen" href="/de/concepts/session" icon="comments">
    Wie Sitzungsschlüssel funktionieren und wie `--to`, `--agent` und `--session-id` sie auflösen.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="slash">
    Nativer Befehlskatalog, der innerhalb von Agent-Sitzungen verwendet wird.
  </Card>
</CardGroup>
