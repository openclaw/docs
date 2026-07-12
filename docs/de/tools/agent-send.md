---
read_when:
    - Sie möchten Agent-Ausführungen über Skripte oder die Befehlszeile auslösen
    - Sie müssen Agentenantworten programmgesteuert an einen Chatkanal übermitteln
summary: Führen Sie Agent-Durchläufe über die CLI aus und senden Sie Antworten optional an Kanäle.
title: Agent senden
x-i18n:
    generated_at: "2026-07-12T02:13:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` führt einen einzelnen Agentendurchlauf über die Befehlszeile aus, ohne dass eine eingehende Chatnachricht vorliegt. Verwenden Sie den Befehl für skriptgesteuerte Workflows, Tests und die programmgesteuerte Zustellung. Vollständige Referenz zu Flags und Verhalten:
[Agent-CLI-Referenz](/de/cli/agent).

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agentendurchlauf ausführen">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Sendet die Nachricht über den Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen mehrzeiligen Prompt aus einer Datei senden">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Liest eine gültige UTF-8-Datei als Nachrichtentext des Agenten ein.

  </Step>

  <Step title="Einen bestimmten Agenten oder eine bestimmte Sitzung ansprechen">
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

| Flag                        | Beschreibung                                                                      |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--message <text>`          | Direkt angegebene zu sendende Nachricht                                           |
| `--message-file <path>`     | Nachricht aus einer gültigen UTF-8-Datei lesen                                    |
| `--to <dest>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefonnummer, Chat-ID)                 |
| `--session-key <key>`       | Einen expliziten Sitzungsschlüssel verwenden                                      |
| `--agent <id>`              | Einen konfigurierten Agenten ansprechen (verwendet dessen Sitzung `main`)          |
| `--session-id <id>`         | Eine vorhandene Sitzung anhand ihrer ID wiederverwenden                            |
| `--model <id>`              | Modellüberschreibung für diesen Durchlauf (`provider/model` oder Modell-ID)        |
| `--local`                   | Lokale eingebettete Laufzeit erzwingen (Gateway überspringen)                     |
| `--deliver`                 | Antwort an einen Chatkanal senden                                                  |
| `--channel <name>`          | Zustellungskanal; gilt mit `--agent` + `--to` auch für den Direktnachrichtenbereich |
| `--reply-to <target>`       | Zustellungsziel überschreiben                                                      |
| `--reply-channel <name>`    | Zustellungskanal überschreiben                                                     |
| `--reply-account <id>`      | ID des Zustellungskontos überschreiben                                             |
| `--thinking <level>`        | Denkstufe für das ausgewählte Modellprofil festlegen                               |
| `--verbose <on\|full\|off>` | Ausführlichkeitsstufe für die Sitzung speichern (`full` protokolliert auch Werkzeugausgaben) |
| `--timeout <seconds>`       | Zeitüberschreitung des Agenten überschreiben (Standardwert 600 oder Konfigurationswert) |
| `--json`                    | Strukturiertes JSON ausgeben                                                       |

## Verhalten

- Standardmäßig läuft die CLI **über den Gateway**. Fügen Sie `--local` hinzu, um die eingebettete Laufzeit auf dem aktuellen Rechner zu erzwingen.
- Übergeben Sie genau eine der Optionen `--message` oder `--message-file`. Dateinachrichten behalten mehrzeilige Inhalte bei, nachdem eine optionale UTF-8-BOM entfernt wurde.
- Wenn die Gateway-Anfrage fehlschlägt, **weicht** die CLI auf den lokalen eingebetteten Durchlauf **aus**. Bei einer Gateway-Zeitüberschreitung erfolgt der Ausweichvorgang mit einer neuen Sitzung, statt mit dem ursprünglichen Transkript zu konkurrieren.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen- und Kanalziele bleiben isoliert; direkte Chats werden unter `main` zusammengeführt). Wenn `--agent`, `--channel` und `--to` gemeinsam verwendet werden, folgt das Routing dem kanonischen Empfänger des Kanals und `session.dmScope`. Stabile Identitäten, die ausschließlich für ausgehende Nachrichten verwendet werden, nutzen eine vom Provider verwaltete Sitzung, die von der Hauptsitzung des Agenten isoliert ist.
- `--session-key` wählt einen expliziten Schlüssel aus. Mit einem Agentenpräfix versehene Schlüssel müssen das Format `agent:<agent-id>:<session-key>` verwenden, und `--agent` muss mit dieser Agenten-ID übereinstimmen, wenn beide angegeben werden. Unqualifizierte Schlüssel, die keine Sentinel-Werte sind, werden dem mit `--agent` angegebenen Agenten zugeordnet. Beispielsweise wird `--agent ops --session-key incident-42` an `agent:ops:incident-42` weitergeleitet. Ohne `--agent` werden unqualifizierte Schlüssel, die keine Sentinel-Werte sind, dem konfigurierten Standardagenten zugeordnet. Die Literalwerte `global` und `unknown` bleiben nur dann ohne Zuordnung, wenn kein `--agent` angegeben ist. Der eingebettete Ausweichpfad ordnet diese Sentinel-Sitzungen dem konfigurierten Standardagenten zu.
- `--reply-channel` und `--reply-account` wirken sich nur auf die Zustellung aus.
- Flags für die Denk- und Ausführlichkeitsstufe werden im Sitzungsspeicher beibehalten.
- Ausgabe: standardmäßig Klartext oder mit `--json` eine strukturierte Nutzlast einschließlich Metadaten.
- Mit `--json --deliver` enthält das JSON den Zustellungsstatus für gesendete, unterdrückte, teilweise und fehlgeschlagene Sendungen. Siehe
  [JSON-Zustellungsstatus](/de/cli/agent#json-delivery-status).

## Beispiele

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

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
  <Card title="Agent-CLI-Referenz" href="/de/cli/agent" icon="terminal">
    Vollständige Referenz zu Flags und Optionen von `openclaw agent`.
  </Card>
  <Card title="Unteragenten" href="/de/tools/subagents" icon="users">
    Starten von Unteragenten im Hintergrund.
  </Card>
  <Card title="Sitzungen" href="/de/concepts/session" icon="comments">
    Funktionsweise von Sitzungsschlüsseln und wie `--to`, `--agent` und `--session-id` sie auflösen.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="slash">
    Katalog nativer Befehle, die innerhalb von Agentensitzungen verwendet werden.
  </Card>
</CardGroup>
