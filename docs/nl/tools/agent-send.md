---
read_when:
    - Je wilt agentuitvoeringen starten vanuit scripts of de opdrachtregel
    - Je moet antwoorden van agents programmatisch naar een chatkanaal verzenden
summary: Voer agentbeurten uit vanaf de CLI en lever antwoorden optioneel af aan kanalen
title: Agent verzenden
x-i18n:
    generated_at: "2026-06-27T18:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` voert één agentbeurt uit vanaf de opdrachtregel zonder dat er
een inkomend chatbericht nodig is. Gebruik het voor gescripte workflows, tests en
programmatische levering.

## Snelstart

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Dit stuurt het bericht via de Gateway en drukt het antwoord af.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Dit leest een geldig UTF-8-bestand als berichttekst voor de agent.

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

| Flag                          | Beschrijving                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Inlinebericht om te verzenden                               |
| `--message-file \<path\>`     | Lees het bericht uit een geldig UTF-8-bestand               |
| `--to \<dest\>`               | Leid de sessiesleutel af van een doel (telefoon, chat-id)   |
| `--session-key \<key\>`       | Gebruik een expliciete sessiesleutel                        |
| `--agent \<id\>`              | Richt op een geconfigureerde agent (gebruikt de `main`-sessie) |
| `--session-id \<id\>`         | Hergebruik een bestaande sessie op id                       |
| `--local`                     | Forceer lokale ingebedde runtime (sla Gateway over)         |
| `--deliver`                   | Stuur het antwoord naar een chatkanaal                      |
| `--channel \<name\>`          | Leveringskanaal (whatsapp, telegram, discord, slack, enz.)  |
| `--reply-to \<target\>`       | Overschrijving van leveringsdoel                            |
| `--reply-channel \<name\>`    | Overschrijving van leveringskanaal                          |
| `--reply-account \<id\>`      | Overschrijving van leveringsaccount-id                      |
| `--thinking \<level\>`        | Stel het denkniveau in voor het geselecteerde modelprofiel  |
| `--verbose \<on\|full\|off\>` | Stel het verbose-niveau in                                  |
| `--timeout \<seconds\>`       | Overschrijf de agent-time-out                               |
| `--json`                      | Geef gestructureerde JSON uit                               |

## Gedrag

- Standaard gaat de CLI **via de Gateway**. Voeg `--local` toe om de
  ingebedde runtime op de huidige machine te forceren.
- Geef precies één van `--message` of `--message-file` door. Bestandsberichten behouden
  meerregelige inhoud nadat een optionele UTF-8-BOM is verwijderd.
- Als de Gateway niet bereikbaar is, **valt de CLI terug** op de lokale ingebedde uitvoering.
- Sessieselectie: `--to` leidt de sessiesleutel af (groep-/kanaaldoelen
  behouden isolatie; directe chats vallen samen naar `main`).
- `--session-key` selecteert een expliciete sleutel. Agent-voorvoegde sleutels moeten
  `agent:<agent-id>:<session-key>` gebruiken, en `--agent` moet met die agent-id overeenkomen wanneer
  beide zijn opgegeven. Kale niet-sentinel-sleutels worden binnen het bereik van `--agent` geplaatst wanneer
  opgegeven; bijvoorbeeld `--agent ops --session-key incident-42` routeert naar
  `agent:ops:incident-42`. Zonder `--agent` worden kale niet-sentinel-sleutels binnen het bereik
  van de geconfigureerde standaardagent geplaatst. Letterlijke `global` en `unknown` blijven
  alleen zonder bereik wanneer geen `--agent` is opgegeven; in dat geval gebruiken ingebedde fallback
  en store-eigenaarschap de geconfigureerde standaardagent.
- Thinking- en verbose-flags blijven behouden in de sessiestore.
- Uitvoer: standaard platte tekst, of `--json` voor gestructureerde payload + metadata.
- Met `--json --deliver` bevat de JSON de leveringsstatus voor verzonden,
  onderdrukte, gedeeltelijke en mislukte verzendingen. Zie
  [JSON-leveringsstatus](/nl/cli/agent#json-delivery-status).

## Voorbeelden

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

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/nl/cli/agent" icon="terminal">
    Volledige referentie voor flags en opties van `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/nl/tools/subagents" icon="users">
    Sub-agents op de achtergrond starten.
  </Card>
  <Card title="Sessions" href="/nl/concepts/session" icon="comments">
    Hoe sessiesleutels werken en hoe `--to`, `--agent` en `--session-id` ze oplossen.
  </Card>
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="slash">
    Native opdrachtcatalogus die binnen agentsessies wordt gebruikt.
  </Card>
</CardGroup>
