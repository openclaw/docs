---
read_when:
    - Je wilt agentuitvoeringen starten vanuit scripts of de opdrachtregel
    - Je moet programmatisch agentreacties aan een chatkanaal leveren
summary: Voer agentbeurten uit vanuit de CLI en stuur antwoorden optioneel naar kanalen
title: Agent verzenden
x-i18n:
    generated_at: "2026-05-06T09:33:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` voert één agentbeurt uit vanaf de opdrachtregel zonder dat er
een inkomend chatbericht nodig is. Gebruik het voor gescripte workflows, testen en
programmatische levering.

## Snel aan de slag

<Steps>
  <Step title="Voer een eenvoudige agentbeurt uit">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dit stuurt het bericht via de Gateway en drukt het antwoord af.

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

| Vlag                          | Beschrijving                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Te verzenden bericht (vereist)                              |
| `--to \<dest\>`               | Leid de sessiesleutel af van een doel (telefoon, chat-id)   |
| `--agent \<id\>`              | Richt op een geconfigureerde agent (gebruikt de `main`-sessie) |
| `--session-id \<id\>`         | Hergebruik een bestaande sessie op id                       |
| `--local`                     | Forceer de lokale ingebedde runtime (sla Gateway over)      |
| `--deliver`                   | Stuur het antwoord naar een chatkanaal                      |
| `--channel \<name\>`          | Afleveringskanaal (whatsapp, telegram, discord, slack, enz.) |
| `--reply-to \<target\>`       | Overschrijving van afleveringsdoel                          |
| `--reply-channel \<name\>`    | Overschrijving van afleveringskanaal                        |
| `--reply-account \<id\>`      | Overschrijving van afleveringsaccount-id                    |
| `--thinking \<level\>`        | Stel het denkniveau in voor het geselecteerde modelprofiel  |
| `--verbose \<on\|full\|off\>` | Stel het uitgebreide niveau in                              |
| `--timeout \<seconds\>`       | Overschrijf de agent-time-out                               |
| `--json`                      | Voer gestructureerde JSON uit                               |

## Gedrag

- Standaard gaat de CLI **via de Gateway**. Voeg `--local` toe om de
  ingebedde runtime op de huidige machine te forceren.
- Als de Gateway onbereikbaar is, **valt de CLI terug** op de lokale ingebedde uitvoering.
- Sessieselectie: `--to` leidt de sessiesleutel af (groep-/kanaaldoelen
  behouden isolatie; directe chats vouwen samen naar `main`).
- Denk- en uitgebreide vlaggen blijven behouden in de sessieopslag.
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

<CardGroup cols={2}>
  <Card title="Agent-CLI-referentie" href="/nl/cli/agent" icon="terminal">
    Volledige referentie voor vlaggen en opties van `openclaw agent`.
  </Card>
  <Card title="Subagents" href="/nl/tools/subagents" icon="users">
    Subagents op de achtergrond starten.
  </Card>
  <Card title="Sessies" href="/nl/concepts/session" icon="comments">
    Hoe sessiesleutels werken en hoe `--to`, `--agent` en `--session-id` ze oplossen.
  </Card>
  <Card title="Slash-opdrachten" href="/nl/tools/slash-commands" icon="slash">
    Systeemeigen opdrachtencatalogus die binnen agentsessies wordt gebruikt.
  </Card>
</CardGroup>
