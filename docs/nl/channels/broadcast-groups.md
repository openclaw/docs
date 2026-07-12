---
read_when:
    - Broadcastgroepen configureren
    - Antwoorden van meerdere agents debuggen in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Stuur een WhatsApp-bericht naar meerdere agents tegelijk
title: Uitzendgroepen
x-i18n:
    generated_at: "2026-07-12T08:36:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimenteel. Toegevoegd in 2026.1.9. Alleen WhatsApp (webkanaal).
</Note>

## Overzicht

Broadcastgroepen voeren **meerdere agents** uit voor hetzelfde inkomende bericht. Elke agent verwerkt het bericht in een eigen geïsoleerde sessie en plaatst een eigen antwoord, zodat één WhatsApp-nummer in één groepschat of privébericht een team van gespecialiseerde agents kan huisvesten.

Broadcastgroepen worden geëvalueerd na de toestemmingslijsten van het kanaal en de activeringsregels voor groepen. In WhatsApp-groepen vinden broadcasts plaats wanneer OpenClaw normaal gesproken zou antwoorden (bijvoorbeeld bij een vermelding, afhankelijk van je groepsinstellingen). Ze veranderen alleen **welke agents worden uitgevoerd**, nooit of een bericht voor verwerking in aanmerking komt.

De live WhatsApp-QA-lane bevat `whatsapp-broadcast-group-fanout`, waarmee wordt gecontroleerd of één groepsbericht met een vermelding afzonderlijke zichtbare antwoorden van twee geconfigureerde agents kan opleveren.

## Configuratie

### Basisconfiguratie

Voeg een `broadcast`-sectie op het hoogste niveau toe (naast `bindings`). De sleutels zijn WhatsApp-peer-id's en de waarden zijn arrays met agent-id's:

- groepschats: groeps-JID (bijvoorbeeld `120363403215116621@g.us`)
- privéberichten: E.164-telefoonnummer van de afzender (bijvoorbeeld `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultaat:** wanneer OpenClaw in deze chat zou antwoorden, worden alle drie de agents uitgevoerd.

Elke vermelde agent-id moet bestaan in `agents.list`: configuratievalidatie meldt onbekende id's en de runtime slaat deze over met de waarschuwing `Broadcast agent <id> not found in agents.list; skipping`.

### Verwerkingsstrategie

`broadcast.strategy` bepaalt hoe agents het bericht verwerken:

| Strategie            | Gedrag                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `parallel` (standaard) | Alle agents verwerken het bericht gelijktijdig; antwoorden kunnen in elke volgorde aankomen. |
| `sequential`         | Agents verwerken het bericht in arrayvolgorde; elke agent wacht tot de vorige klaar is. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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

## Werking

### Berichtstroom

<Steps>
  <Step title="Inkomend bericht arriveert">
    Er komt een WhatsApp-groepsbericht of privébericht binnen.
  </Step>
  <Step title="Routering en toelating">
    OpenClaw past toestemmingslijsten voor kanalen, activeringsregels voor groepen en het geconfigureerde eigenaarschap van ACP-bindingen toe.
  </Step>
  <Step title="Broadcastcontrole">
    Als geen geconfigureerde ACP-binding eigenaar is van de route, controleert OpenClaw of de peer-id in `broadcast` staat.
  </Step>
  <Step title="Als broadcast van toepassing is">
    - Alle vermelde agents verwerken het bericht.
    - Elke agent heeft een eigen sessiesleutel en geïsoleerde context.
    - Agents verwerken het bericht parallel (standaard) of sequentieel.
    - Audiobijlagen worden vóór de fan-out één keer getranscribeerd, zodat agents één transcript delen in plaats van afzonderlijke STT-aanroepen uit te voeren.

  </Step>
  <Step title="Als broadcast niet van toepassing is">
    OpenClaw verzendt het bericht via de gewone route of de geconfigureerde ACP-sessieroute die tijdens de routering is geselecteerd.
  </Step>
</Steps>

<Note>
Broadcastgroepen omzeilen geen toestemmingslijsten voor kanalen of activeringsregels voor groepen (vermeldingen/opdrachten/enzovoort). Ze veranderen alleen _welke agents worden uitgevoerd_ wanneer een bericht voor verwerking in aanmerking komt.
</Note>

### Sessie-isolatie

Elke agent in een broadcastgroep onderhoudt volledig afzonderlijke:

- **Sessiesleutels** (`agent:alfred:whatsapp:group:120363...` tegenover `agent:baerbel:whatsapp:group:120363...`)
- **Gespreksgeschiedenis** (een agent ziet de antwoorden van andere agents niet)
- **Werkruimte** (afzonderlijke sandboxes, indien geconfigureerd)
- **Toegang tot tools** (verschillende lijsten voor toestaan/weigeren)
- **Geheugen/context** (afzonderlijke `IDENTITY.md`, `SOUL.md`, enzovoort)

Eén uitzondering wordt bewust gedeeld: de **groepscontextbuffer** (recente groepsberichten die als context worden gebruikt) wordt per peer gedeeld, zodat alle broadcastagents bij activering dezelfde context zien. Deze buffer wordt eenmaal gewist nadat de fan-out is voltooid.

Hierdoor kan elke agent een andere persoonlijkheid, andere modellen, andere Skills en andere toegang tot tools hebben (bijvoorbeeld alleen-lezen tegenover lezen en schrijven).

### Voorbeeld: geïsoleerde sessies

In groep `120363403215116621@g.us` met agents `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Context van Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Context van Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Gebruiksscenario's

- **Gespecialiseerde agentteams**: een ontwikkelaarsgroep waarin `code-reviewer`, `security-auditor`, `test-generator` en `docs-checker` hetzelfde bericht elk vanuit hun eigen invalshoek beantwoorden.
- **Meertalige ondersteuning**: één ondersteuningschat waarin `support-en`, `support-de` en `support-es` in hun eigen taal antwoorden.
- **Kwaliteitsborging**: `support-agent` antwoordt terwijl `qa-agent` het antwoord beoordeelt en alleen reageert als er problemen worden gevonden.
- **Taakautomatisering**: `task-tracker`, `time-logger` en `report-generator` verwerken allemaal dezelfde statusupdate.

## Aanbevolen werkwijzen

<AccordionGroup>
  <Accordion title="1. Houd agents gericht">
    Geef elke agent één duidelijke verantwoordelijkheid (`formatter`, `linter`, `tester`) in plaats van één algemene agent zoals "dev-helper".
  </Accordion>
  <Accordion title="2. Gebruik beschrijvende id's en namen">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configureer verschillende toegang tot tools">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` heeft alleen-lezen-toegang. `fixer` kan lezen en schrijven.

  </Accordion>
  <Accordion title="4. Bewaak de prestaties">
    Geef bij veel agents de voorkeur aan `"strategy": "parallel"` (standaard), beperk broadcastgroepen tot een handvol agents en gebruik snellere modellen voor eenvoudigere agents.
  </Accordion>
  <Accordion title="5. Fouten blijven geïsoleerd">
    Agents kunnen onafhankelijk mislukken. De fout van één agent wordt geregistreerd (`Broadcast agent <id> failed: ...`) en blokkeert de andere agents niet.
  </Accordion>
</AccordionGroup>

## Compatibiliteit

### Providers

Broadcastgroepen zijn momenteel alleen geïmplementeerd voor WhatsApp (webkanaal). Andere kanalen negeren de `broadcast`-configuratie.

### Routering

Broadcastgroepen werken naast de bestaande routering:

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

- `GROUP_A`: alleen alfred antwoordt (normale routering).
- `GROUP_B`: agent1 EN agent2 antwoorden (broadcast).

<Note>
**Prioriteit:** `broadcast` heeft voorrang op gewone routebindingen. Geconfigureerde ACP-bindingen (`bindings[].type="acp"`) zijn exclusief: wanneer er één overeenkomt, verzendt OpenClaw het bericht naar de geconfigureerde ACP-sessie in plaats van naar een fan-out-broadcast.
</Note>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Agents antwoorden niet">
    **Controleer:**

    1. Agent-id's bestaan in `agents.list` (configuratievalidatie weigert onbekende id's).
    2. De notatie van de peer-id is correct (een groeps-JID zoals `120363403215116621@g.us`, of E.164 zoals `+15551234567` voor privéberichten).
    3. Het bericht heeft de normale toelatingscontrole doorstaan (regels voor vermeldingen/activering blijven van toepassing).

    **Foutopsporing:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Een geslaagde fan-out registreert `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Slechts één agent antwoordt">
    **Oorzaak:** de peer-id staat mogelijk in gewone routebindingen, maar niet in `broadcast`, of komt mogelijk overeen met een exclusieve geconfigureerde ACP-binding.

    **Oplossing:** voeg peers die aan gewone routes zijn gebonden toe aan de broadcastconfiguratie, of verwijder/wijzig de geconfigureerde ACP-binding als een fan-out-broadcast gewenst is.

  </Accordion>
  <Accordion title="Prestatieproblemen">
    Als het systeem traag is bij veel agents: verminder het aantal agents per groep, gebruik lichtere modellen en controleer de opstarttijd van de sandbox.
  </Accordion>
</AccordionGroup>

## Voorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld 1: Team voor codebeoordeling">
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

    Eén codefragment in de groep levert vier antwoorden op: opmaakcorrecties, een beveiligingsbevinding, een hiaat in de testdekking en een kleine documentatieopmerking.

  </Accordion>
  <Accordion title="Voorbeeld 2: Meertalige pijplijn">
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
  Hoe agents worden verwerkt. `parallel` voert alle agents gelijktijdig uit; `sequential` voert ze in arrayvolgorde uit.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-groeps-JID of E.164-telefoonnummer. De waarde is de array met agent-id's die allemaal berichten van deze peer moeten verwerken.
</ParamField>

## Beperkingen

1. **Maximumaantal agents:** er is geen harde limiet, maar veel agents (10+) kunnen traag zijn.
2. **Gedeelde context:** agents zien elkaars antwoorden niet (bewust ontwerp).
3. **Berichtvolgorde:** parallelle antwoorden kunnen in elke volgorde aankomen.
4. **Snelheidslimieten:** alle antwoorden komen van één WhatsApp-account, dus het antwoord van elke agent telt mee voor dezelfde WhatsApp-snelheidslimieten.

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing)
- [Groepen](/nl/channels/groups)
- [Sandboxhulpmiddelen voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
- [Koppeling](/nl/channels/pairing)
- [Sessiebeheer](/nl/concepts/session)
