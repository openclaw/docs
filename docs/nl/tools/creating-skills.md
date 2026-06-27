---
read_when:
    - Je maakt een nieuwe aangepaste skill
    - Je hebt een snelle starterworkflow nodig voor op SKILL.md gebaseerde Skills
    - Je wilt Skill Workshop gebruiken om een skill voor agentbeoordeling voor te stellen
sidebarTitle: Creating skills
summary: Bouw, test en publiceer aangepaste SKILL.md-werkruimte-Skills voor je OpenClaw-agenten.
title: Skills maken
x-i18n:
    generated_at: "2026-06-27T18:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills leren de agent hoe en wanneer tools te gebruiken. Elke skill is een directory
met een `SKILL.md`-bestand met YAML-frontmatter en markdown-instructies.
OpenClaw laadt Skills uit meerdere roots in een gedefinieerde [volgorde van prioriteit](/nl/tools/skills#loading-order).

## Maak je eerste skill

<Steps>
  <Step title="Maak de skilldirectory">
    Skills staan in de map `skills/` van je workspace. Maak een directory voor je
    nieuwe skill:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Je kunt Skills groeperen in submappen voor organisatie — de skill wordt nog
    steeds benoemd door de `SKILL.md`-frontmatter, niet door het mappad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Schrijf SKILL.md">
    Maak `SKILL.md` aan in de directory. De frontmatter definieert metadata;
    de body geeft de agent instructies.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Naamgevingsregels:
    - Gebruik kleine letters, cijfers en koppeltekens voor `name`.
    - Houd de directorynaam en frontmatter-`name` op elkaar afgestemd.
    - `description` wordt getoond aan de agent en in slash-command-detectie —
      houd deze op één regel en onder 160 tekens.

  </Step>

  <Step title="Controleer of de skill is geladen">
    ```bash
    openclaw skills list
    ```

    OpenClaw bewaakt standaard `SKILL.md`-bestanden onder skillroots. Als de
    watcher is uitgeschakeld of je een bestaande sessie voortzet, start dan een
    nieuwe zodat de agent de vernieuwde lijst ontvangt:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test het">
    Stuur een bericht dat de skill zou moeten activeren:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Of open een chat en vraag het rechtstreeks aan de agent. Gebruik `/skill hello-world` om
    deze expliciet op naam aan te roepen.

  </Step>
</Steps>

## SKILL.md-referentie

### Vereiste velden

| Veld          | Beschrijving                                                  |
| ------------- | ------------------------------------------------------------- |
| `name`        | Unieke slug met kleine letters, cijfers en koppeltekens       |
| `description` | Beschrijving van één regel die aan de agent en in detectie-uitvoer wordt getoond |

### Optionele frontmatter-sleutels

| Veld                       | Standaard | Beschrijving                                                                      |
| -------------------------- | --------- | --------------------------------------------------------------------------------- |
| `user-invocable`           | `true`    | Stel de skill beschikbaar als slash-command voor gebruikers                       |
| `disable-model-invocation` | `false`   | Houd de skill buiten de systeemprompt van de agent (draait nog steeds via `/skill`) |
| `command-dispatch`         | —         | Stel in op `tool` om het slash-command direct naar een tool te routeren, buiten het model om |
| `command-tool`             | —         | Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld           |
| `command-arg-mode`         | `raw`     | Stuurt bij tooldispatch de raw args string door naar de tool                      |
| `homepage`                 | —         | URL die als "Website" wordt getoond in de macOS Skills UI                         |

Zie voor gatevelden (`requires.bins`, `requires.env`, enz.)
[Skills — gating](/nl/tools/skills#gating).

### `{baseDir}` gebruiken

Gebruik `{baseDir}` in de skillbody om te verwijzen naar bestanden binnen de
skilldirectory zonder paden hard te coderen:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Voorwaardelijke activatie toevoegen

Gate je skill zodat deze alleen laadt wanneer de afhankelijkheden beschikbaar zijn:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gateopties">
    | Sleutel | Beschrijving |
    | --- | --- |
    | `requires.bins` | Alle binaries moeten bestaan op `PATH` |
    | `requires.anyBins` | Minstens één binary moet bestaan op `PATH` |
    | `requires.env` | Elke env var moet bestaan in het proces of de configuratie |
    | `requires.config` | Elk `openclaw.json`-pad moet truthy zijn |
    | `os` | Platformfilter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Stel in op `true` om alle gates over te slaan en de skill altijd op te nemen |

    Volledige referentie: [Skills — gating](/nl/tools/skills#gating).

  </Accordion>
  <Accordion title="Omgeving en API-sleutels">
    Koppel een API-sleutel aan een skillitem in `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    De sleutel wordt alleen voor die agentbeurt in het hostproces geïnjecteerd.
    Deze bereikt de sandbox niet — zie
    [sandboxed env vars](/nl/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Voorstellen via Skill Workshop

Gebruik voor door agents opgestelde Skills, of wanneer je operatorbeoordeling wilt voordat een skill
live gaat, voorstellen van [Skill Workshop](/nl/tools/skill-workshop) in plaats van
`SKILL.md` rechtstreeks te schrijven.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Gebruik `--proposal-dir` wanneer het voorstel ondersteunende bestanden bevat:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

De directory moet `PROPOSAL.md` bevatten. Ondersteunende bestanden kunnen in `assets/`,
`examples/`, `references/`, `scripts/` of `templates/`.

Na beoordeling:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus van voorstellen.

## Publiceren naar ClawHub

<Steps>
  <Step title="Zorg dat je SKILL.md compleet is">
    Zorg dat `name`, `description` en eventuele `metadata.openclaw`-gatevelden
    zijn ingesteld. Voeg een `homepage`-URL toe als je een projectpagina hebt.
  </Step>
  <Step title="Installeer de ClawHub-skill">
    De ClawHub-skill documenteert de huidige vorm van het publish-command en vereiste
    metadata:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publiceer">
    ```bash
    clawhub publish
    ```

    Zie [ClawHub — publiceren](/nl/clawhub/publishing) voor de volledige flow.

  </Step>
</Steps>

## Best practices

<Tip>
  - **Wees beknopt** — instrueer het model over *wat* het moet doen, niet hoe het een AI moet zijn.
  - **Veiligheid eerst** — als je skill `exec` gebruikt, zorg er dan voor dat prompts geen
    willekeurige commando-injectie vanuit niet-vertrouwde invoer toestaan.
  - **Test lokaal** — gebruik `openclaw agent --message "..."` voordat je deelt.
  - **Gebruik ClawHub** — blader door community-Skills op [clawhub.ai](https://clawhub.ai)
    voordat je vanaf nul bouwt.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills-referentie" href="/nl/tools/skills" icon="puzzle-piece">
    Laadvolgorde, gating, allowlists en SKILL.md-formaat.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstelwachtrij voor door agents opgestelde Skills.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="cloud">
    Blader door Skills en publiceer ze in het openbare register.
  </Card>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="plug">
    Plugins kunnen Skills meeleveren naast de tools die ze documenteren.
  </Card>
</CardGroup>
