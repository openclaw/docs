---
read_when:
    - Sie möchten Agent-Ausführungen über Skripte oder die Befehlszeile auslösen.
    - Sie müssen Agent-Antworten programmgesteuert an einen Chat-Channel zustellen.
summary: Führen Sie Agent-Züge über die CLI aus und stellen Sie Antworten optional an Channels zu.
title: Agent Send
x-i18n:
    generated_at: "2026-04-21T13:37:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` führt einen einzelnen Agent-Zug über die Befehlszeile aus, ohne dass
eine eingehende Chat-Nachricht erforderlich ist. Verwenden Sie ihn für skriptgesteuerte Workflows, Tests und
programmgesteuerte Zustellung.

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agent-Zug ausführen">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dies sendet die Nachricht über das Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen bestimmten Agenten oder eine bestimmte Sitzung ansprechen">
    ```bash
    # Einen bestimmten Agenten ansprechen
    openclaw agent --agent ops --message "Summarize logs"

    # Eine Telefonnummer ansprechen (leitet den Sitzungsschlüssel ab)
    openclaw agent --to +15555550123 --message "Status update"

    # Eine vorhandene Sitzung wiederverwenden
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Die Antwort an einen Channel zustellen">
    ```bash
    # An WhatsApp zustellen (Standard-Channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # An Slack zustellen
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Beschreibung                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Zu sendende Nachricht (erforderlich)                        |
| `--to \<dest\>`               | Leitet den Sitzungsschlüssel aus einem Ziel ab (Telefon, Chat-ID) |
| `--agent \<id\>`              | Spricht einen konfigurierten Agenten an (verwendet dessen `main`-Sitzung) |
| `--session-id \<id\>`         | Verwendet eine vorhandene Sitzung anhand ihrer ID wieder    |
| `--local`                     | Erzwingt die lokal eingebettete Runtime (Gateway überspringen) |
| `--deliver`                   | Sendet die Antwort an einen Chat-Channel                    |
| `--channel \<name\>`          | Zustell-Channel (whatsapp, telegram, discord, slack usw.)   |
| `--reply-to \<target\>`       | Überschreibung des Zustellziels                             |
| `--reply-channel \<name\>`    | Überschreibung des Zustell-Channels                         |
| `--reply-account \<id\>`      | Überschreibung der Zustell-Konto-ID                         |
| `--thinking \<level\>`        | Setzt die Thinking-Stufe für das ausgewählte Modellprofil   |
| `--verbose \<on\|full\|off\>` | Setzt die Verbose-Stufe                                     |
| `--timeout \<seconds\>`       | Überschreibt das Agent-Timeout                              |
| `--json`                      | Gibt strukturiertes JSON aus                                |

## Verhalten

- Standardmäßig läuft die CLI **über das Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Runtime auf dem aktuellen Rechner zu erzwingen.
- Wenn das Gateway nicht erreichbar ist, fällt die CLI **auf die lokale eingebettete Ausführung** zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Channel-Ziele
  behalten die Isolation bei; direkte Chats werden zu `main` zusammengeführt).
- Thinking- und Verbose-Flags werden im Sitzungsspeicher persistiert.
- Ausgabe: standardmäßig Klartext oder mit `--json` strukturierte Payload + Metadaten.

## Beispiele

```bash
# Einfacher Zug mit JSON-Ausgabe
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Zug mit Thinking-Stufe
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# An einen anderen Channel als die Sitzung zustellen
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandt

- [Agent-CLI-Referenz](/cli/agent)
- [Unter-Agenten](/de/tools/subagents) — Spawn von Hintergrund-Unter-Agenten
- [Sitzungen](/de/concepts/session) — wie Sitzungsschlüssel funktionieren
