---
read_when:
    - Broadcastgroepen configureren
    - Multi-agent-antwoorden in WhatsApp debuggen
sidebarTitle: Broadcast groups
status: experimental
summary: Een WhatsApp-bericht uitzenden naar meerdere agenten
title: Broadcastgroepen
x-i18n:
    generated_at: "2026-04-29T22:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimenteel. Toegevoegd in 2026.1.9.
</Note>

## Overzicht

Broadcast Groups laten meerdere agents hetzelfde bericht gelijktijdig verwerken en beantwoorden. Hiermee kun je gespecialiseerde agentteams maken die samenwerken in een enkele WhatsApp-groep of DM — allemaal met één telefoonnummer.

Huidige scope: **alleen WhatsApp** (webkanaal).

Broadcast-groepen worden geëvalueerd na kanaal-allowlists en groepsactiveringsregels. In WhatsApp-groepen betekent dit dat broadcasts plaatsvinden wanneer OpenClaw normaal zou antwoorden (bijvoorbeeld: bij vermelding, afhankelijk van je groepsinstellingen).

## Gebruiksscenario's

<AccordionGroup>
  <Accordion title="1. Gespecialiseerde agentteams">
    Implementeer meerdere agents met atomaire, gerichte verantwoordelijkheden:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Elke agent verwerkt hetzelfde bericht en geeft zijn gespecialiseerde perspectief.

  </Accordion>
  <Accordion title="2. Meertalige ondersteuning">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Workflows voor kwaliteitsborging">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Taakautomatisering">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Configuratie

### Basisinstelling

Voeg een `broadcast`-sectie op topniveau toe (naast `bindings`). Sleutels zijn WhatsApp-peer-id's:

- groepschats: groeps-JID (bijv. `120363403215116621@g.us`)
- DM's: E.164-telefoonnummer (bijv. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultaat:** Wanneer OpenClaw in deze chat zou antwoorden, voert het alle drie agents uit.

### Verwerkingsstrategie

Bepaal hoe agents berichten verwerken:

<Tabs>
  <Tab title="parallel (standaard)">
    Alle agents verwerken gelijktijdig:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequentieel">
    Agents verwerken op volgorde (één wacht tot de vorige klaar is):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Volledig voorbeeld

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Hoe het werkt

### Berichtstroom

<Steps>
  <Step title="Binnenkomend bericht arriveert">
    Een WhatsApp-groep- of DM-bericht arriveert.
  </Step>
  <Step title="Broadcast-controle">
    Het systeem controleert of de peer-ID in `broadcast` staat.
  </Step>
  <Step title="Als deze in de broadcast-lijst staat">
    - Alle vermelde agents verwerken het bericht.
    - Elke agent heeft zijn eigen sessiesleutel en geïsoleerde context.
    - Agents verwerken parallel (standaard) of sequentieel.

  </Step>
  <Step title="Als deze niet in de broadcast-lijst staat">
    Normale routering is van toepassing (eerste overeenkomende binding).
  </Step>
</Steps>

<Note>
Broadcast-groepen omzeilen geen kanaal-allowlists of groepsactiveringsregels (vermeldingen/opdrachten/enz.). Ze wijzigen alleen _welke agents worden uitgevoerd_ wanneer een bericht in aanmerking komt voor verwerking.
</Note>

### Sessie-isolatie

Elke agent in een broadcast-groep behoudt volledig afzonderlijke:

- **Sessiesleutels** (`agent:alfred:whatsapp:group:120363...` versus `agent:baerbel:whatsapp:group:120363...`)
- **Gespreksgeschiedenis** (agent ziet de berichten van andere agents niet)
- **Werkruimte** (afzonderlijke sandboxes indien geconfigureerd)
- **Tooltoegang** (verschillende allow/deny-lijsten)
- **Geheugen/context** (afzonderlijke IDENTITY.md, SOUL.md, enz.)
- **Groepscontextbuffer** (recente groepsberichten die voor context worden gebruikt) wordt per peer gedeeld, zodat alle broadcast-agents dezelfde context zien wanneer ze worden geactiveerd

Hierdoor kan elke agent het volgende hebben:

- Verschillende persoonlijkheden
- Verschillende tooltoegang (bijv. alleen-lezen versus lezen-schrijven)
- Verschillende modellen (bijv. opus versus sonnet)
- Verschillende Skills geïnstalleerd

### Voorbeeld: geïsoleerde sessies

In groep `120363403215116621@g.us` met agents `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfreds context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbels context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Best practices

<AccordionGroup>
  <Accordion title="1. Houd agents gefocust">
    Ontwerp elke agent met één duidelijke verantwoordelijkheid:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Goed:** Elke agent heeft één taak. ❌ **Slecht:** Eén generieke "dev-helper"-agent.

  </Accordion>
  <Accordion title="2. Gebruik beschrijvende namen">
    Maak duidelijk wat elke agent doet:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Configureer verschillende tooltoegang">
    Geef agents alleen de tools die ze nodig hebben:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Bewaak prestaties">
    Overweeg bij veel agents:

    - `"strategy": "parallel"` (standaard) te gebruiken voor snelheid
    - Broadcast-groepen te beperken tot 5-10 agents
    - Snellere modellen te gebruiken voor eenvoudigere agents

  </Accordion>
  <Accordion title="5. Handel fouten netjes af">
    Agents falen onafhankelijk. De fout van één agent blokkeert de andere niet:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Compatibiliteit

### Providers

Broadcast-groepen werken momenteel met:

- ✅ WhatsApp (geïmplementeerd)
- 🚧 Telegram (gepland)
- 🚧 Discord (gepland)
- 🚧 Slack (gepland)

### Routering

Broadcast-groepen werken naast bestaande routering:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Alleen alfred antwoordt (normale routering).
- `GROUP_B`: agent1 EN agent2 antwoorden (broadcast).

<Note>
**Voorrang:** `broadcast` heeft prioriteit boven `bindings`.
</Note>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Agents reageren niet">
    **Controleer:**

    1. Agent-ID's bestaan in `agents.list`.
    2. De peer-ID-indeling is correct (bijv. `120363403215116621@g.us`).
    3. Agents staan niet in deny-lijsten.

    **Debuggen:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Slechts één agent reageert">
    **Oorzaak:** Peer-ID staat mogelijk in `bindings`, maar niet in `broadcast`.

    **Oplossing:** Voeg toe aan de broadcast-configuratie of verwijder uit bindings.

  </Accordion>
  <Accordion title="Prestatieproblemen">
    Als het traag is met veel agents:

    - Verminder het aantal agents per groep.
    - Gebruik lichtere modellen (sonnet in plaats van opus).
    - Controleer de opstarttijd van de sandbox.

  </Accordion>
</AccordionGroup>

## Voorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld 1: Code-reviewteam">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **Gebruiker verzendt:** Codefragment.

    **Antwoorden:**

    - code-formatter: "Inspringing gecorrigeerd en typehints toegevoegd"
    - security-scanner: "⚠️ SQL-injectiekwetsbaarheid op regel 12"
    - test-coverage: "Dekking is 45%, tests voor foutgevallen ontbreken"
    - docs-checker: "Docstring ontbreekt voor functie `process_data`"

  </Accordion>
  <Accordion title="Voorbeeld 2: Meertalige ondersteuning">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API-referentie

### Configuratieschema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Velden

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Hoe agents moeten worden verwerkt. `parallel` voert alle agents gelijktijdig uit; `sequential` voert ze uit in arrayvolgorde.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-groeps-JID, E.164-nummer of andere peer-ID. De waarde is de array met agent-ID's die berichten moeten verwerken.
</ParamField>

## Beperkingen

1. **Max. agents:** Geen harde limiet, maar meer dan 10 agents kan traag zijn.
2. **Gedeelde context:** Agents zien elkaars antwoorden niet (zo ontworpen).
3. **Berichtvolgorde:** Parallelle antwoorden kunnen in willekeurige volgorde arriveren.
4. **Rate limits:** Alle agents tellen mee voor WhatsApp-rate limits.

## Toekomstige verbeteringen

Geplande functies:

- [ ] Modus voor gedeelde context (agents zien elkaars antwoorden)
- [ ] Agentcoördinatie (agents kunnen elkaar signalen sturen)
- [ ] Dynamische agentselectie (agents kiezen op basis van berichtinhoud)
- [ ] Agentprioriteiten (sommige agents antwoorden vóór andere)

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepen](/nl/channels/groups)
- [Sandboxtools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
- [Koppelen](/nl/channels/pairing)
- [Sessiebeheer](/nl/concepts/session)
