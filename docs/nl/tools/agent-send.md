---
read_when:
    - Je wilt agentruns activeren vanuit scripts of via de opdrachtregel
    - Je moet antwoorden van de agent programmatisch naar een chatkanaal sturen
summary: Voer agentbeurten uit vanuit de CLI en lever antwoorden optioneel af bij kanalen
title: Agent verzenden
x-i18n:
    generated_at: "2026-07-12T09:27:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` voert één agentbeurt uit vanaf de opdrachtregel zonder een
inkomend chatbericht. Gebruik dit voor gescripte workflows, tests en
programmatische aflevering. Volledige referentie voor vlaggen en gedrag:
[Agent-CLI-referentie](/nl/cli/agent).

## Snel aan de slag

<Steps>
  <Step title="Een eenvoudige agentbeurt uitvoeren">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Verstuurt het bericht via de Gateway en geeft het antwoord weer.

  </Step>

  <Step title="Een prompt met meerdere regels vanuit een bestand verzenden">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Leest een geldig UTF-8-bestand als de berichttekst voor de agent.

  </Step>

  <Step title="Een specifieke agent of sessie kiezen">
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

  <Step title="Het antwoord bij een kanaal afleveren">
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

| Vlag                        | Beschrijving                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Inlinebericht om te verzenden                                        |
| `--message-file <path>`     | Lees het bericht uit een geldig UTF-8-bestand                        |
| `--to <dest>`               | Leid de sessiesleutel af van een doel (telefoon, chat-id)            |
| `--session-key <key>`       | Gebruik een expliciete sessiesleutel                                 |
| `--agent <id>`              | Kies een geconfigureerde agent (gebruikt diens `main`-sessie)        |
| `--session-id <id>`         | Hergebruik een bestaande sessie op basis van id                      |
| `--model <id>`              | Modeloverschrijving voor deze uitvoering (`provider/model` of model-id) |
| `--local`                   | Dwing de lokale ingebedde runtime af (sla Gateway over)              |
| `--deliver`                 | Verzend het antwoord naar een chatkanaal                             |
| `--channel <name>`          | Afleverkanaal; met `--agent` + `--to` geldt dit ook voor het DM-bereik |
| `--reply-to <target>`       | Overschrijving van het afleverdoel                                   |
| `--reply-channel <name>`    | Overschrijving van het afleverkanaal                                 |
| `--reply-account <id>`      | Overschrijving van de afleveraccount-id                              |
| `--thinking <level>`        | Stel het denkniveau in voor het geselecteerde modelprofiel           |
| `--verbose <on\|full\|off>` | Sla het detailniveau voor de sessie op (`full` logt ook tooluitvoer) |
| `--timeout <seconds>`       | Overschrijf de agenttime-out (standaard 600 of de configuratiewaarde) |
| `--json`                    | Voer gestructureerde JSON uit                                        |

## Gedrag

- Standaard gaat de CLI **via de Gateway**. Voeg `--local` toe om de ingebedde
  runtime op de huidige machine af te dwingen.
- Geef precies één van `--message` of `--message-file` door. Bestandsberichten
  behouden inhoud met meerdere regels nadat een optionele UTF-8-BOM is verwijderd.
- Als het Gateway-verzoek mislukt, **valt de CLI terug** op de lokale ingebedde
  uitvoering; bij een Gateway-time-out wordt teruggevallen met een nieuwe sessie
  in plaats van de oorspronkelijke transcriptie gelijktijdig voort te zetten.
- Sessieselectie: `--to` leidt de sessiesleutel af (groeps-/kanaaldoelen
  behouden isolatie; directe chats worden samengevoegd tot `main`). Wanneer
  `--agent`, `--channel` en `--to` samen worden gebruikt, volgt de routering de
  canonieke ontvanger van het kanaal en `session.dmScope`. Stabiele identiteiten
  die alleen voor uitgaande berichten worden gebruikt, gebruiken een sessie die
  eigendom is van de provider en is geïsoleerd van de hoofdsessie van de agent.
- `--session-key` selecteert een expliciete sleutel. Sleutels met een agentvoorvoegsel
  moeten `agent:<agent-id>:<session-key>` gebruiken, en `--agent` moet overeenkomen
  met die agent-id wanneer beide zijn opgegeven. Kale sleutels die geen sentinel zijn,
  worden, indien opgegeven, beperkt tot `--agent`; `--agent ops --session-key incident-42`
  routeert bijvoorbeeld naar `agent:ops:incident-42`. Zonder `--agent` worden kale
  sleutels die geen sentinel zijn, beperkt tot de geconfigureerde standaardagent.
  De letterlijke waarden `global` en `unknown` blijven alleen buiten een bereik
  wanneer geen `--agent` is opgegeven; het ingebedde terugvalpad koppelt deze
  sentinelsessies aan de geconfigureerde standaardagent.
- `--reply-channel` en `--reply-account` beïnvloeden alleen de aflevering.
- Vlaggen voor denkniveau en detailniveau worden opgeslagen in de sessieopslag.
- Uitvoer: standaard platte tekst, of `--json` voor een gestructureerde payload
  met metagegevens.
- Met `--json --deliver` bevat de JSON de afleverstatus voor verzonden,
  onderdrukte, gedeeltelijke en mislukte verzendingen. Zie
  [JSON-afleverstatus](/nl/cli/agent#json-delivery-status).

## Voorbeelden

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

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Agent-CLI-referentie" href="/nl/cli/agent" icon="terminal">
    Volledige referentie voor vlaggen en opties van `openclaw agent`.
  </Card>
  <Card title="Subagents" href="/nl/tools/subagents" icon="users">
    Subagents op de achtergrond starten.
  </Card>
  <Card title="Sessies" href="/nl/concepts/session" icon="comments">
    Hoe sessiesleutels werken en hoe `--to`, `--agent` en `--session-id` deze omzetten.
  </Card>
  <Card title="Slash-opdrachten" href="/nl/tools/slash-commands" icon="slash">
    Catalogus met systeemeigen opdrachten die binnen agentsessies wordt gebruikt.
  </Card>
</CardGroup>
