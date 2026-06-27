---
read_when:
    - Broadcastgroepen configureren
    - Fouten opsporen in multi-agent-antwoorden in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Stuur een WhatsApp-bericht naar meerdere agents
title: Broadcastgroepen
x-i18n:
    generated_at: "2026-06-27T17:09:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimenteel. Toegevoegd in 2026.1.9.
</Note>

## Overzicht

Broadcastgroepen maken het mogelijk dat meerdere agents hetzelfde bericht tegelijk verwerken en beantwoorden. Hiermee kun je gespecialiseerde agentteams maken die samenwerken in één WhatsApp-groep of DM — allemaal met één telefoonnummer.

Huidige scope: **alleen WhatsApp** (webkanaal).

Broadcastgroepen worden geëvalueerd na kanaal-toestemmingslijsten en regels voor groepsactivering. In WhatsApp-groepen betekent dit dat broadcasts plaatsvinden wanneer OpenClaw normaal zou antwoorden (bijvoorbeeld: bij een vermelding, afhankelijk van je groepsinstellingen).

## Gebruikssituaties

<AccordionGroup>
  <Accordion title="1. Gespecialiseerde agentteams">
    Zet meerdere agents in met afgebakende, gerichte verantwoordelijkheden:

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
  <Accordion title="2. Ondersteuning voor meerdere talen">
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

### Basisconfiguratie

Voeg een top-level `broadcast`-sectie toe (naast `bindings`). Sleutels zijn WhatsApp-peer-id's:

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
    Alle agents verwerken tegelijk:

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
  <Step title="Binnenkomend bericht komt aan">
    Er komt een WhatsApp-groepsbericht of DM-bericht binnen.
  </Step>
  <Step title="Routering en toelating">
    OpenClaw past kanaal-toestemmingslijsten, regels voor groepsactivering en geconfigureerd eigenaarschap van ACP-bindingen toe.
  </Step>
  <Step title="Broadcastcontrole">
    Als geen geconfigureerde ACP-binding eigenaar is van de route, controleert OpenClaw of de peer-ID in `broadcast` staat.
  </Step>
  <Step title="Als broadcast van toepassing is">
    - Alle vermelde agents verwerken het bericht.
    - Elke agent heeft zijn eigen sessiesleutel en geïsoleerde context.
    - Agents verwerken parallel (standaard) of sequentieel.

  </Step>
  <Step title="Als broadcast niet van toepassing is">
    OpenClaw dispatcht de gewone route of de geconfigureerde ACP-sessieroute die tijdens de routering is geselecteerd.
  </Step>
</Steps>

<Note>
Broadcastgroepen omzeilen kanaal-toestemmingslijsten of regels voor groepsactivering (vermeldingen/commando's/enz.) niet. Ze veranderen alleen _welke agents worden uitgevoerd_ wanneer een bericht in aanmerking komt voor verwerking.
</Note>

### Sessie-isolatie

Elke agent in een broadcastgroep onderhoudt volledig gescheiden:

- **Sessiesleutels** (`agent:alfred:whatsapp:group:120363...` versus `agent:baerbel:whatsapp:group:120363...`)
- **Gespreksgeschiedenis** (agent ziet berichten van andere agents niet)
- **Werkruimte** (afzonderlijke sandboxes indien geconfigureerd)
- **Toegang tot tools** (verschillende allow/deny-lijsten)
- **Geheugen/context** (afzonderlijke IDENTITY.md, SOUL.md, enz.)
- **Groepscontextbuffer** (recente groepsberichten die voor context worden gebruikt) wordt per peer gedeeld, zodat alle broadcastagents dezelfde context zien wanneer ze worden geactiveerd

Hierdoor kan elke agent beschikken over:

- Verschillende persoonlijkheden
- Verschillende toegang tot tools (bijv. alleen-lezen versus lezen-schrijven)
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
  <Accordion title="3. Configureer verschillende toegang tot tools">
    Geef agents alleen de tools die ze nodig hebben:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` is alleen-lezen. `fixer` kan lezen en schrijven.

  </Accordion>
  <Accordion title="4. Monitor prestaties">
    Overweeg bij veel agents:

    - `"strategy": "parallel"` (standaard) te gebruiken voor snelheid
    - Broadcastgroepen te beperken tot 5-10 agents
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

Broadcastgroepen werken momenteel met:

- ✅ WhatsApp (geïmplementeerd)
- 🚧 Telegram (gepland)
- 🚧 Discord (gepland)
- 🚧 Slack (gepland)

### Routering

Broadcastgroepen werken naast bestaande routering:

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
**Voorrang:** `broadcast` heeft prioriteit boven gewone routebindingen. Geconfigureerde ACP-bindingen (`bindings[].type="acp"`) zijn exclusief: wanneer er één overeenkomt, dispatcht OpenClaw naar de geconfigureerde ACP-sessie in plaats van fan-out-broadcast.
</Note>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Agents antwoorden niet">
    **Controleer:**

    1. Agent-ID's bestaan in `agents.list`.
    2. De peer-ID-indeling is correct (bijv. `120363403215116621@g.us`).
    3. Agents staan niet in deny-lijsten.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Slechts één agent antwoordt">
    **Oorzaak:** De peer-ID staat mogelijk in gewone routebindingen maar niet in `broadcast`, of komt mogelijk overeen met een exclusieve geconfigureerde ACP-binding.

    **Oplossing:** Voeg peers met gewone routebindingen toe aan de broadcastconfiguratie, of verwijder/wijzig de geconfigureerde ACP-binding als fan-out-broadcast gewenst is.

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

    **Gebruiker stuurt:** Codefragment.

    **Antwoorden:**

    - code-formatter: "Inspringing gecorrigeerd en typehints toegevoegd"
    - security-scanner: "⚠️ SQL-injectiekwetsbaarheid op regel 12"
    - test-coverage: "Dekking is 45%, tests voor foutgevallen ontbreken"
    - docs-checker: "Ontbrekende docstring voor functie `process_data`"

  </Accordion>
  <Accordion title="Voorbeeld 2: Ondersteuning voor meerdere talen">
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
  Hoe agents worden verwerkt. `parallel` voert alle agents tegelijk uit; `sequential` voert ze uit in arrayvolgorde.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-groeps-JID, E.164-nummer of andere peer-ID. De waarde is de array met agent-ID's die berichten moeten verwerken.
</ParamField>

## Beperkingen

1. **Maximaal aantal agenten:** Geen harde limiet, maar 10+ agenten kunnen traag zijn.
2. **Gedeelde context:** Agenten zien elkaars antwoorden niet (bewust zo ontworpen).
3. **Berichtvolgorde:** Parallelle antwoorden kunnen in willekeurige volgorde aankomen.
4. **Ratelimieten:** Alle agenten tellen mee voor de WhatsApp-ratelimieten.

## Toekomstige verbeteringen

Geplande functies:

- [ ] Modus voor gedeelde context (agenten zien elkaars antwoorden)
- [ ] Agentcoördinatie (agenten kunnen signalen naar elkaar sturen)
- [ ] Dynamische agentselectie (kies agenten op basis van berichtinhoud)
- [ ] Agentprioriteiten (sommige agenten antwoorden vóór andere)

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepen](/nl/channels/groups)
- [Multi-agent-sandboxtools](/nl/tools/multi-agent-sandbox-tools)
- [Koppeling](/nl/channels/pairing)
- [Sessiebeheer](/nl/concepts/session)
