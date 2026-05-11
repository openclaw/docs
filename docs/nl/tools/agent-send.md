---
read_when:
    - Je wilt agentuitvoeringen starten vanuit scripts of de opdrachtregel
    - Je moet antwoorden van agents programmatisch afleveren aan een chatkanaal
summary: Voer agentbeurten uit vanuit de CLI en lever antwoorden optioneel af bij kanalen
title: Agent verzenden
x-i18n:
    generated_at: "2026-05-11T20:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` voert een enkele agentbeurt uit vanaf de opdrachtregel zonder dat
er een inkomend chatbericht nodig is. Gebruik dit voor gescripte workflows, testen en
programmatische aflevering.

## Snel aan de slag

<Steps>
  <Step title="Voer een eenvoudige agentbeurt uit">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dit stuurt het bericht via de Gateway en drukt het antwoord af.

  </Step>

  <Step title="Richt je op een specifieke agent of sessie">
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
| `--to \<dest\>`               | Leid sessiesleutel af van een doel (telefoon, chat-id)      |
| `--agent \<id\>`              | Richt je op een geconfigureerde agent (gebruikt zijn `main`-sessie) |
| `--session-id \<id\>`         | Hergebruik een bestaande sessie op id                       |
| `--local`                     | Forceer lokale embedded runtime (sla Gateway over)          |
| `--deliver`                   | Stuur het antwoord naar een chatkanaal                      |
| `--channel \<name\>`          | Afleverkanaal (whatsapp, telegram, discord, slack, enz.)    |
| `--reply-to \<target\>`       | Overschrijving van afleverdoel                              |
| `--reply-channel \<name\>`    | Overschrijving van afleverkanaal                            |
| `--reply-account \<id\>`      | Overschrijving van afleveraccount-id                        |
| `--thinking \<level\>`        | Stel denkniveau in voor het geselecteerde modelprofiel      |
| `--verbose \<on\|full\|off\>` | Stel verbose-niveau in                                      |
| `--timeout \<seconds\>`       | Overschrijf agenttime-out                                   |
| `--json`                      | Geef gestructureerde JSON uit                               |

## Gedrag

- Standaard gaat de CLI **via de Gateway**. Voeg `--local` toe om de
  embedded runtime op de huidige machine te forceren.
- Als de Gateway onbereikbaar is, **valt de CLI terug** op de lokale embedded uitvoering.
- Sessieselectie: `--to` leidt de sessiesleutel af (groep-/kanaaldoelen
  behouden isolatie; directe chats vallen samen tot `main`).
- Thinking- en verbose-vlaggen blijven behouden in de sessieopslag.
- Uitvoer: standaard platte tekst, of `--json` voor gestructureerde payload + metadata.
- Met `--json --deliver` bevat de JSON afleverstatus voor verzonden,
  onderdrukte, gedeeltelijke en mislukte verzendingen. Zie
  [JSON-afleverstatus](/nl/cli/agent#json-delivery-status).

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
  <Card title="Agent CLI-naslag" href="/nl/cli/agent" icon="terminal">
    Volledige naslag voor vlaggen en opties van `openclaw agent`.
  </Card>
  <Card title="Subagents" href="/nl/tools/subagents" icon="users">
    Subagents op de achtergrond starten.
  </Card>
  <Card title="Sessies" href="/nl/concepts/session" icon="comments">
    Hoe sessiesleutels werken en hoe `--to`, `--agent` en `--session-id` ze oplossen.
  </Card>
  <Card title="Slash-commando's" href="/nl/tools/slash-commands" icon="slash">
    Native opdrachtencatalogus die binnen agentsessies wordt gebruikt.
  </Card>
</CardGroup>
