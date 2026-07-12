---
read_when:
    - Sie möchten Agent-Ausführungen über Skripte oder die Befehlszeile auslösen
    - Sie müssen Agentenantworten programmgesteuert an einen Chatkanal zustellen
summary: Agent-Durchläufe über die CLI ausführen und Antworten optional an Kanäle senden
title: Agent senden
x-i18n:
    generated_at: "2026-07-12T16:02:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` führt einen einzelnen Agentendurchlauf über die Befehlszeile aus, ohne dass eine
eingehende Chatnachricht vorliegt. Verwenden Sie den Befehl für skriptgesteuerte Workflows, Tests und
programmatische Zustellung. Vollständige Referenz zu Flags und Verhalten:
[Agenten-CLI-Referenz](/de/cli/agent).

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agentendurchlauf ausführen">
    ```bash
    openclaw agent --agent main --message "Wie ist das Wetter heute?"
    ```

    Sendet die Nachricht über den Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen mehrzeiligen Prompt aus einer Datei senden">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Liest eine gültige UTF-8-Datei als Nachrichtentext für den Agenten ein.

  </Step>

  <Step title="Einen bestimmten Agenten oder eine bestimmte Sitzung auswählen">
    ```bash
    # Einen bestimmten Agenten auswählen
    openclaw agent --agent ops --message "Protokolle zusammenfassen"

    # Eine Telefonnummer auswählen (leitet den Sitzungsschlüssel ab)
    openclaw agent --to +15555550123 --message "Statusaktualisierung"

    # Eine vorhandene Sitzung wiederverwenden
    openclaw agent --session-id abc123 --message "Aufgabe fortsetzen"

    # Einen exakten Sitzungsschlüssel auswählen
    openclaw agent --session-key agent:ops:incident-42 --message "Status zusammenfassen"
    ```

  </Step>

  <Step title="Die Antwort an einen Kanal zustellen">
    ```bash
    # An WhatsApp zustellen (Standardkanal)
    openclaw agent --to +15555550123 --message "Bericht ist fertig" --deliver

    # An Slack zustellen
    openclaw agent --agent ops --message "Bericht erstellen" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                        | Beschreibung                                                                 |
| --------------------------- | ---------------------------------------------------------------------------- |
| `--message <text>`          | Zu sendende Inline-Nachricht                                                  |
| `--message-file <path>`     | Nachricht aus einer gültigen UTF-8-Datei lesen                                |
| `--to <dest>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefonnummer, Chat-ID)            |
| `--session-key <key>`       | Einen expliziten Sitzungsschlüssel verwenden                                  |
| `--agent <id>`              | Einen konfigurierten Agenten auswählen (verwendet dessen `main`-Sitzung)      |
| `--session-id <id>`         | Eine vorhandene Sitzung anhand ihrer ID wiederverwenden                       |
| `--model <id>`              | Modellüberschreibung für diesen Durchlauf (`provider/model` oder Modell-ID)   |
| `--local`                   | Lokale eingebettete Laufzeit erzwingen (Gateway überspringen)                 |
| `--deliver`                 | Antwort an einen Chatkanal senden                                             |
| `--channel <name>`          | Zustellungskanal; mit `--agent` + `--to` gilt er auch für den DM-Geltungsbereich |
| `--reply-to <target>`       | Zustellungsziel überschreiben                                                 |
| `--reply-channel <name>`    | Zustellungskanal überschreiben                                                |
| `--reply-account <id>`      | ID des Zustellungskontos überschreiben                                        |
| `--thinking <level>`        | Denkstufe für das ausgewählte Modellprofil festlegen                          |
| `--verbose <on\|full\|off>` | Ausführlichkeitsstufe für die Sitzung speichern (`full` protokolliert auch Werkzeugausgaben) |
| `--timeout <seconds>`       | Agenten-Timeout überschreiben (Standardwert 600 oder Konfigurationswert)      |
| `--json`                    | Strukturiertes JSON ausgeben                                                  |

## Verhalten

- Standardmäßig wird die CLI **über den Gateway** ausgeführt. Fügen Sie `--local` hinzu, um die
  eingebettete Laufzeit auf dem aktuellen Rechner zu erzwingen.
- Übergeben Sie genau eines von `--message` oder `--message-file`. Dateinachrichten behalten
  mehrzeilige Inhalte bei, nachdem eine optionale UTF-8-BOM entfernt wurde.
- Wenn die Gateway-Anfrage fehlschlägt, **weicht** die CLI auf den lokalen eingebetteten
  Durchlauf **aus**; bei einem Gateway-Timeout erfolgt der Ausweichvorgang mit einer neuen Sitzung,
  statt mit dem ursprünglichen Transkript zu konkurrieren.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  bleiben isoliert; Direktchats werden auf `main` zusammengeführt). Wenn `--agent`,
  `--channel` und `--to` gemeinsam verwendet werden, folgt das Routing dem kanonischen
  Empfänger des Kanals und `session.dmScope`. Stabile Identitäten, die ausschließlich für
  ausgehende Nachrichten verwendet werden, nutzen eine Provider-eigene Sitzung, die von der
  Hauptsitzung des Agenten isoliert ist.
- `--session-key` wählt einen expliziten Schlüssel aus. Schlüssel mit Agentenpräfix müssen
  `agent:<agent-id>:<session-key>` verwenden, und `--agent` muss mit dieser Agenten-ID
  übereinstimmen, wenn beide angegeben werden. Unqualifizierte Schlüssel, die keine Sentinel-Schlüssel
  sind, werden auf den mit `--agent` angegebenen Agenten beschränkt; beispielsweise leitet
  `--agent ops --session-key incident-42` an `agent:ops:incident-42` weiter. Ohne `--agent`
  werden unqualifizierte Schlüssel, die keine Sentinel-Schlüssel sind, auf den konfigurierten
  Standardagenten beschränkt. Die Literale `global` und `unknown` bleiben nur dann
  unbeschränkt, wenn kein `--agent` angegeben wird; der eingebettete Ausweichpfad
  ordnet diese Sentinel-Sitzungen dem konfigurierten Standardagenten zu.
- `--reply-channel` und `--reply-account` wirken sich nur auf die Zustellung aus.
- Denk- und Ausführlichkeits-Flags werden im Sitzungsspeicher dauerhaft gespeichert.
- Ausgabe: standardmäßig Klartext oder mit `--json` eine strukturierte Nutzlast samt Metadaten.
- Mit `--json --deliver` enthält das JSON den Zustellungsstatus für gesendete,
  unterdrückte, teilweise und fehlgeschlagene Zustellungen. Siehe
  [JSON-Zustellungsstatus](/de/cli/agent#json-delivery-status).

## Beispiele

```bash
# Einfacher Durchlauf mit JSON-Ausgabe
openclaw agent --to +15555550123 --message "Protokolle nachverfolgen" --verbose on --json

# Durchlauf mit einer Modellüberschreibung
openclaw agent --agent ops --model openai/gpt-5.4 --message "Protokolle zusammenfassen"

# Durchlauf mit Denkstufe
openclaw agent --session-id 1234 --message "Posteingang zusammenfassen" --thinking medium

# Mehrzeiliger Prompt aus einer Datei
openclaw agent --agent ops --message-file ./task.md

# Exakter Sitzungsschlüssel
openclaw agent --session-key agent:ops:incident-42 --message "Status zusammenfassen"

# Auf einen Agenten beschränkter Legacy-Schlüssel
openclaw agent --agent ops --session-key incident-42 --message "Status zusammenfassen"

# An einen anderen Kanal als den Sitzungskanal zustellen
openclaw agent --agent ops --message "Warnung" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Agenten-CLI-Referenz" href="/de/cli/agent" icon="terminal">
    Vollständige Referenz zu Flags und Optionen von `openclaw agent`.
  </Card>
  <Card title="Unteragenten" href="/de/tools/subagents" icon="users">
    Starten von Unteragenten im Hintergrund.
  </Card>
  <Card title="Sitzungen" href="/de/concepts/session" icon="comments">
    Funktionsweise von Sitzungsschlüsseln und wie `--to`, `--agent` und `--session-id` sie auflösen.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="slash">
    Nativer Befehlskatalog für die Verwendung innerhalb von Agentensitzungen.
  </Card>
</CardGroup>
