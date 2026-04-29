---
read_when:
    - Je wilt agentuitvoeringen starten vanuit scripts of de opdrachtregel
    - Je moet agentantwoorden programmatisch naar een chatkanaal sturen
summary: Voer agentbeurten uit vanuit de CLI en lever reacties optioneel af aan kanalen
title: Agent verzenden
x-i18n:
    generated_at: "2026-04-29T23:20:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` voert een enkele agentbeurt uit vanaf de opdrachtregel zonder dat
een inkomend chatbericht nodig is. Gebruik het voor gescripte workflows, testen en
programmatische levering.

## Snelstart

<Steps>
  <Step title="Voer een eenvoudige agentbeurt uit">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dit verstuurt het bericht via de Gateway en drukt het antwoord af.

  </Step>

  <Step title="Richt op een specifieke agent of sessie">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Lever het antwoord af bij een kanaal">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Vlaggen

| Vlag                          | Beschrijving                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | Te versturen bericht (vereist)                               |
| `--to \<dest\>`               | Leid de sessiesleutel af van een doel (telefoon, chat-id)    |
| `--agent \<id\>`              | Richt op een geconfigureerde agent (gebruikt de `main`-sessie) |
| `--session-id \<id\>`         | Hergebruik een bestaande sessie op id                        |
| `--local`                     | Forceer lokale ingebedde runtime (sla Gateway over)          |
| `--deliver`                   | Stuur het antwoord naar een chatkanaal                       |
| `--channel \<name\>`          | Leveringskanaal (whatsapp, telegram, discord, slack, enz.)   |
| `--reply-to \<target\>`       | Overschrijving van leveringsdoel                             |
| `--reply-channel \<name\>`    | Overschrijving van leveringskanaal                           |
| `--reply-account \<id\>`      | Overschrijving van leveringsaccount-id                       |
| `--thinking \<level\>`        | Stel het denkniveau in voor het geselecteerde modelprofiel   |
| `--verbose \<on\|full\|off\>` | Stel het verbose-niveau in                                   |
| `--timeout \<seconds\>`       | Overschrijf de agent-time-out                                |
| `--json`                      | Voer gestructureerde JSON uit                                |

## Gedrag

- Standaard gaat de CLI **via de Gateway**. Voeg `--local` toe om de
  ingebedde runtime op de huidige machine te forceren.
- Als de Gateway onbereikbaar is, **valt de CLI terug** op de lokale ingebedde uitvoering.
- Sessieselectie: `--to` leidt de sessiesleutel af (groep-/kanaaldoelen
  behouden isolatie; directe chats vallen samen tot `main`).
- Thinking- en verbose-vlaggen blijven bewaard in de sessieopslag.
- Uitvoer: standaard platte tekst, of `--json` voor gestructureerde payload + metadata.

## Voorbeelden

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Gerelateerd

- [Agent CLI-referentie](/nl/cli/agent)
- [Subagents](/nl/tools/subagents) — subagent-spawning op de achtergrond
- [Sessies](/nl/concepts/session) — hoe sessiesleutels werken
