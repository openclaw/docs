---
read_when:
    - Sie möchten Agent-Ausführungen aus Skripten oder über die Befehlszeile auslösen
    - Sie müssen Agent-Antworten programmgesteuert an einen Chat-Kanal senden.
summary: Agent-Turns über die CLI ausführen und Antworten optional an Kanäle senden
title: Agent senden
x-i18n:
    generated_at: "2026-06-27T18:15:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` führt einen einzelnen Agent-Turn über die Befehlszeile aus, ohne
eine eingehende Chat-Nachricht zu benötigen. Verwenden Sie es für skriptgesteuerte Workflows, Tests und
programmgesteuerte Zustellung.

## Schnellstart

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Dadurch wird die Nachricht über den Gateway gesendet und die Antwort ausgegeben.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Dadurch wird eine gültige UTF-8-Datei als Nachrichtentext des Agent gelesen.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
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
| `--message \<text\>`          | Inline-Nachricht, die gesendet werden soll                  |
| `--message-file \<path\>`     | Nachricht aus einer gültigen UTF-8-Datei lesen              |
| `--to \<dest\>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefon, Chat-ID) |
| `--session-key \<key\>`       | Einen expliziten Sitzungsschlüssel verwenden                |
| `--agent \<id\>`              | Einen konfigurierten Agent ansprechen (verwendet dessen `main`-Sitzung) |
| `--session-id \<id\>`         | Eine vorhandene Sitzung per ID wiederverwenden              |
| `--local`                     | Lokale eingebettete Laufzeit erzwingen (Gateway überspringen) |
| `--deliver`                   | Antwort an einen Chat-Kanal senden                          |
| `--channel \<name\>`          | Zustellkanal (whatsapp, telegram, discord, slack usw.)      |
| `--reply-to \<target\>`       | Zustellziel überschreiben                                   |
| `--reply-channel \<name\>`    | Zustellkanal überschreiben                                  |
| `--reply-account \<id\>`      | ID des Zustellkontos überschreiben                          |
| `--thinking \<level\>`        | Thinking-Level für das ausgewählte Modellprofil festlegen   |
| `--verbose \<on\|full\|off\>` | Ausführlichkeitsstufe festlegen                             |
| `--timeout \<seconds\>`       | Agent-Timeout überschreiben                                 |
| `--json`                      | Strukturiertes JSON ausgeben                                |

## Verhalten

- Standardmäßig läuft die CLI **über den Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Laufzeit auf dem aktuellen Computer zu erzwingen.
- Übergeben Sie genau eine der Optionen `--message` oder `--message-file`. Dateinachrichten behalten
  mehrzeilige Inhalte bei, nachdem eine optionale UTF-8-BOM entfernt wurde.
- Wenn der Gateway nicht erreichbar ist, **fällt die CLI auf** die lokale eingebettete Ausführung zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  bleiben isoliert; direkte Chats werden auf `main` zusammengeführt).
- `--session-key` wählt einen expliziten Schlüssel aus. Schlüssel mit Agent-Präfix müssen
  `agent:<agent-id>:<session-key>` verwenden, und `--agent` muss mit dieser Agent-ID übereinstimmen, wenn
  beide angegeben werden. Bloße Nicht-Sentinel-Schlüssel werden auf `--agent` begrenzt, wenn
  angegeben; zum Beispiel leitet `--agent ops --session-key incident-42` an
  `agent:ops:incident-42` weiter. Ohne `--agent` werden bloße Nicht-Sentinel-Schlüssel auf
  den konfigurierten Standard-Agent begrenzt. Die Literale `global` und `unknown` bleiben
  nur dann unbegrenzt, wenn kein `--agent` angegeben ist; in diesem Fall verwenden eingebetteter Fallback
  und Speicherzuständigkeit den konfigurierten Standard-Agent.
- Thinking- und Verbose-Flags werden im Sitzungsspeicher beibehalten.
- Ausgabe: standardmäßig Klartext oder `--json` für strukturierte Nutzdaten + Metadaten.
- Mit `--json --deliver` enthält das JSON den Zustellstatus für gesendete,
  unterdrückte, teilweise und fehlgeschlagene Sendungen. Siehe
  [JSON-Zustellstatus](/de/cli/agent#json-delivery-status).

## Beispiele

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/de/cli/agent" icon="terminal">
    Vollständige Referenz zu Flags und Optionen von `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/de/tools/subagents" icon="users">
    Starten von Hintergrund-Sub-Agents.
  </Card>
  <Card title="Sessions" href="/de/concepts/session" icon="comments">
    Wie Sitzungsschlüssel funktionieren und wie `--to`, `--agent` und `--session-id` sie auflösen.
  </Card>
  <Card title="Slash commands" href="/de/tools/slash-commands" icon="slash">
    Nativer Befehlskatalog, der innerhalb von Agent-Sitzungen verwendet wird.
  </Card>
</CardGroup>
