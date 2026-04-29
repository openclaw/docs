---
read_when:
    - Je maakt een nieuwe aangepaste skill in je werkruimte
    - Je hebt een snelle startersworkflow nodig voor op SKILL.md gebaseerde Skills
summary: Aangepaste werkruimte-Skills bouwen en testen met SKILL.md
title: Skills maken
x-i18n:
    generated_at: "2026-04-29T23:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills leren de agent hoe en wanneer tools te gebruiken. Elke skill is een directory
met een `SKILL.md`-bestand met YAML-frontmatter en markdown-instructies.

Zie [Skills](/nl/tools/skills) voor hoe skills worden geladen en geprioriteerd.

## Maak je eerste skill

<Steps>
  <Step title="Maak de skilldirectory">
    Skills staan in je workspace. Maak een nieuwe map:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Schrijf SKILL.md">
    Maak `SKILL.md` aan binnen die directory. De frontmatter definieert metadata,
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

    Gebruik kebab-case met kleine letters, cijfers en koppeltekens voor de skill
    `name`. Houd de mapnaam en frontmatter-`name` gelijk.

  </Step>

  <Step title="Tools toevoegen (optioneel)">
    Je kunt aangepaste toolschema's in de frontmatter definiëren of de agent
    instrueren om bestaande systeemtools (zoals `exec` of `browser`) te gebruiken. Skills kunnen ook
    in plugins worden meegeleverd naast de tools die ze documenteren.

  </Step>

  <Step title="De skill laden">
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

  <Step title="Test hem">
    Stuur een bericht dat de skill zou moeten activeren:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Of chat gewoon met de agent en vraag om een begroeting.

  </Step>
</Steps>

## Referentie voor skillmetadata

De YAML-frontmatter ondersteunt deze velden:

| Veld                                | Vereist | Beschrijving                                                   |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | Ja       | Unieke identifier met kleine letters, cijfers en koppeltekens  |
| `description`                       | Ja       | Beschrijving van één regel die aan de agent wordt getoond      |
| `metadata.openclaw.os`              | Nee      | OS-filter (`["darwin"]`, `["linux"]`, enz.)                    |
| `metadata.openclaw.requires.bins`   | Nee      | Vereiste binaries op PATH                                      |
| `metadata.openclaw.requires.config` | Nee      | Vereiste configuratiesleutels                                  |

## Best practices

- **Wees beknopt** — instrueer het model over _wat_ het moet doen, niet hoe het een AI moet zijn
- **Veiligheid eerst** — als je skill `exec` gebruikt, zorg er dan voor dat prompts geen willekeurige command-injectie uit niet-vertrouwde invoer toestaan
- **Test lokaal** — gebruik `openclaw agent --message "..."` om te testen voordat je deelt
- **Gebruik ClawHub** — blader door skills en draag eraan bij op [ClawHub](https://clawhub.ai)

## Waar skills staan

| Locatie                         | Voorrang  | Bereik                |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | Hoogste    | Per agent             |
| `\<workspace\>/.agents/skills/` | Hoog       | Per workspace-agent   |
| `~/.agents/skills/`             | Gemiddeld  | Gedeeld agentprofiel  |
| `~/.openclaw/skills/`           | Gemiddeld  | Gedeeld (alle agents) |
| Gebundeld (meegeleverd met OpenClaw) | Laag       | Globaal               |
| `skills.load.extraDirs`         | Laagste    | Aangepaste gedeelde mappen |

## Gerelateerd

- [Skills-referentie](/nl/tools/skills) — laad-, voorrangs- en gatingregels
- [Skills-configuratie](/nl/tools/skills-config) — `skills.*`-configuratieschema
- [ClawHub](/nl/tools/clawhub) — openbaar skillregister
- [Plugins bouwen](/nl/plugins/building-plugins) — plugins kunnen skills meeleveren
