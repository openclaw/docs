---
read_when:
    - Je maakt een nieuwe aangepaste skill aan in je werkruimte
    - Je hebt een snelle startworkflow nodig voor op SKILL.md gebaseerde Skills
summary: Aangepaste werkruimte-Skills bouwen en testen met SKILL.md
title: Skills aanmaken
x-i18n:
    generated_at: "2026-05-11T20:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills leren de agent hoe en wanneer tools te gebruiken. Elke skill is een directory
met een `SKILL.md`-bestand met YAML-frontmatter en markdown-instructies.

Zie [Skills](/nl/tools/skills) voor hoe Skills worden geladen en geprioriteerd.

## Maak je eerste skill

<Steps>
  <Step title="Maak de skill-directory">
    Skills staan in je werkruimte. Maak een nieuwe map:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Schrijf SKILL.md">
    Maak `SKILL.md` in die directory. De frontmatter definieert metadata,
    en de markdown-body bevat instructies voor de agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Gebruik hyphen-case met kleine letters, cijfers en koppeltekens voor de skill
    `name`. Houd de mapnaam en frontmatter-`name` gelijk.

  </Step>

  <Step title="Voeg tools toe (optioneel)">
    Je kunt aangepaste toolschema's definiëren in de frontmatter of de agent instrueren
    bestaande systeemtools te gebruiken (zoals `exec` of `browser`). Skills kunnen ook
    binnen plugins worden meegeleverd naast de tools die ze documenteren.

  </Step>

  <Step title="Laad de skill">
    Start een nieuwe sessie zodat OpenClaw de skill oppikt:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Controleer of de skill is geladen:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test het">
    Stuur een bericht dat de skill zou moeten triggeren:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Of chat gewoon met de agent en vraag om een begroeting.

  </Step>
</Steps>

## Referentie voor skill-metadata

De YAML-frontmatter ondersteunt deze velden:

| Veld                                | Vereist | Beschrijving                                                   |
| ----------------------------------- | ------- | -------------------------------------------------------------- |
| `name`                              | Ja      | Unieke identifier met kleine letters, cijfers en koppeltekens  |
| `description`                       | Ja      | Eénregelige beschrijving die aan de agent wordt getoond        |
| `metadata.openclaw.os`              | Nee     | OS-filter (`["darwin"]`, `["linux"]`, enz.)                    |
| `metadata.openclaw.requires.bins`   | Nee     | Vereiste binaries op PATH                                      |
| `metadata.openclaw.requires.config` | Nee     | Vereiste config-sleutels                                       |

## Best practices

- **Wees beknopt** — instrueer het model over _wat_ het moet doen, niet hoe het een AI moet zijn
- **Veiligheid eerst** — als je skill `exec` gebruikt, zorg er dan voor dat prompts geen willekeurige command-injectie vanuit onvertrouwde invoer toestaan
- **Test lokaal** — gebruik `openclaw agent --message "..."` om te testen voordat je deelt
- **Gebruik ClawHub** — blader door en draag Skills bij op [ClawHub](https://clawhub.ai)

## Waar Skills staan

| Locatie                         | Voorrang   | Scope                  |
| ------------------------------- | ---------- | ---------------------- |
| `\<workspace\>/skills/`         | Hoogst     | Per agent              |
| `\<workspace\>/.agents/skills/` | Hoog       | Per werkruimte-agent   |
| `~/.agents/skills/`             | Gemiddeld  | Gedeeld agentprofiel   |
| `~/.openclaw/skills/`           | Gemiddeld  | Gedeeld (alle agents)  |
| Gebundeld (meegeleverd met OpenClaw) | Laag   | Globaal                |
| `skills.load.extraDirs`         | Laagst     | Aangepaste gedeelde mappen |

## Gerelateerd

- [Skills-referentie](/nl/tools/skills) — laad-, voorrangs- en gatingregels
- [Skills-config](/nl/tools/skills-config) — `skills.*`-configschema
- [ClawHub](/nl/clawhub) — openbaar skill-register
- [Plugins bouwen](/nl/plugins/building-plugins) — plugins kunnen Skills meeleveren
