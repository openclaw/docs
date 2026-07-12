---
read_when:
    - U maakt een nieuwe aangepaste skill
    - Je hebt een snelle startworkflow nodig voor op SKILL.md gebaseerde Skills
    - Je wilt Skill Workshop gebruiken om een skill voor beoordeling door een agent voor te stellen
sidebarTitle: Creating skills
summary: Bouw, test en publiceer aangepaste SKILL.md-werkruimte-Skills voor je OpenClaw-agenten.
title: Skills maken
x-i18n:
    generated_at: "2026-07-12T09:21:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills leren de agent hoe en wanneer tools moeten worden gebruikt. Elke skill is een map
met een `SKILL.md`-bestand met YAML-frontmatter en Markdown-instructies.
OpenClaw laadt skills vanuit verschillende hoofdmappen in een vastgelegde [prioriteitsvolgorde](/nl/tools/skills#loading-order).

## Maak je eerste skill

<Steps>
  <Step title="Maak de skillmap">
    Skills bevinden zich in de map `skills/` van je werkruimte:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Je kunt skills ter ordening in submappen groeperen — de naam van de skill
    wordt nog steeds bepaald door de frontmatter van `SKILL.md`, niet door het mappad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # de naam van de skill is nog steeds "hello-world", aangeroepen als /hello-world
    ```

  </Step>

  <Step title="Schrijf SKILL.md">
    De frontmatter definieert de metagegevens; de inhoud bevat instructies voor de agent.

    ```markdown
    ---
    name: hello-world
    description: Een eenvoudige skill die een begroeting weergeeft.
    ---

    # Hallo wereld

    Wanneer de gebruiker om een begroeting vraagt, gebruik je de tool `exec` om het volgende uit te voeren:

    ```bash
    echo "Hallo vanuit je aangepaste skill!"
    ```
    ```

    Naamgevingsregels:
    - Gebruik kleine letters, cijfers en koppeltekens voor `name`.
    - Zorg dat de mapnaam en `name` in de frontmatter overeenkomen.
    - `description` wordt aan de agent en in de ontdekking van slash-opdrachten getoond —
      houd deze op één regel en korter dan 160 tekens.

  </Step>

  <Step title="Controleer of de skill is geladen">
    ```bash
    openclaw skills list
    ```

    OpenClaw bewaakt standaard `SKILL.md`-bestanden onder de hoofdmappen voor skills. Als de
    bewaking is uitgeschakeld of je doorgaat met een bestaande sessie, start je een nieuwe
    zodat de agent de vernieuwde lijst ontvangt:

    ```bash
    # Vanuit de chat — archiveer de huidige sessie en begin opnieuw
    /new

    # Of start de Gateway opnieuw
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test de skill">
    ```bash
    openclaw agent --message "geef me een begroeting"
    ```

    Je kunt ook een chat openen en het rechtstreeks aan de agent vragen. Gebruik `/skill hello-world` om
    de skill expliciet op naam aan te roepen.

  </Step>
</Steps>

## Naslag voor SKILL.md

### Verplichte velden

| Veld          | Beschrijving                                                               |
| ------------- | -------------------------------------------------------------------------- |
| `name`        | Unieke slug met kleine letters, cijfers en koppeltekens                    |
| `description` | Beschrijving van één regel die aan de agent en in de zoekresultaten wordt getoond |

### Optionele frontmatter-sleutels

| Veld                       | Standaardwaarde | Beschrijving                                                                      |
| -------------------------- | --------------- | --------------------------------------------------------------------------------- |
| `user-invocable`           | `true`          | Stel de skill beschikbaar als slash-opdracht voor gebruikers                      |
| `disable-model-invocation` | `false`         | Laat de skill weg uit de systeemprompt van de agent (werkt nog steeds via `/skill`) |
| `command-dispatch`         | —               | Stel in op `tool` om de slash-opdracht rechtstreeks naar een tool te leiden, zonder het model |
| `command-tool`             | —               | Naam van de tool die wordt aangeroepen wanneer `command-dispatch: tool` is ingesteld |
| `command-arg-mode`         | `raw`           | Stuurt bij toolroutering de onbewerkte tekenreeks met argumenten door naar de tool |
| `homepage`                 | —               | URL die als "Website" wordt getoond in de Skills-interface van macOS              |

Zie [Skills — Voorwaarden](/nl/tools/skills#gating) voor voorwaardevelden (`requires.bins`, `requires.env`, enzovoort).

### `{baseDir}` gebruiken

Verwijs naar bestanden in de skillmap zonder paden hard te coderen — de
agent herleidt `{baseDir}` tot de eigen map van de skill:

```markdown
Voer het helperscript op `{baseDir}/scripts/run.sh` uit.
```

## Voorwaardelijke activering toevoegen

Stel voorwaarden voor je skill in, zodat deze alleen wordt geladen wanneer de afhankelijkheden beschikbaar zijn:

```markdown
---
name: gemini-search
description: Zoeken met Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Voorwaardeopties">
    | Sleutel | Beschrijving |
    | --- | --- |
    | `requires.bins` | Alle uitvoerbare bestanden moeten op `PATH` bestaan |
    | `requires.anyBins` | Ten minste één uitvoerbaar bestand moet op `PATH` bestaan |
    | `requires.env` | Elke omgevingsvariabele moet in het proces of de configuratie bestaan |
    | `requires.config` | Elk pad in `openclaw.json` moet een waarheidswaarde hebben |
    | `os` | Platformfilter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Stel in op `true` om alle voorwaarden over te slaan en de skill altijd op te nemen |

    Volledige naslag: [Skills — Voorwaarden](/nl/tools/skills#gating).

  </Accordion>
  <Accordion title="Omgeving en API-sleutels">
    Koppel een API-sleutel aan een skillvermelding in `openclaw.json`:

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
    De sleutel bereikt de sandbox niet — zie
    [omgevingsvariabelen in de sandbox](/nl/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Voorstellen via Skill Workshop

Gebruik voor door agents opgestelde skills, of wanneer je beoordeling door een beheerder wilt voordat een skill
actief wordt, voorstellen van [Skill Workshop](/nl/tools/skill-workshop) in plaats van
`SKILL.md` rechtstreeks te schrijven.

```bash
# Stel een volledig nieuwe skill voor
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Een eenvoudige skill die een begroeting weergeeft." \
  --proposal ./PROPOSAL.md

# Stel een update van een bestaande skill voor
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Bijgewerkte begroetingsskill"
```

Gebruik `--proposal-dir` wanneer het voorstel ondersteunende bestanden bevat:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Een eenvoudige skill die een begroeting weergeeft." \
  --proposal-dir ./hello-world-proposal/
```

De hoofdmap moet `PROPOSAL.md` bevatten. Ondersteunende bestanden komen onder
`assets/`, `examples/`, `references/`, `scripts/` of `templates/`.

Na beoordeling:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus van voorstellen.

## Publiceren naar ClawHub

<Steps>
  <Step title="Zorg dat je SKILL.md volledig is">
    Zorg dat `name`, `description` en eventuele voorwaardevelden onder `metadata.openclaw`
    zijn ingesteld. Voeg een `homepage`-URL toe als je een projectpagina hebt.
  </Step>
  <Step title="Installeer de zelfstandige ClawHub CLI en meld je aan">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publiceer">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Voeg `--version <version>` of `--owner <owner>` toe om de afgeleide
    versie te overschrijven of onder een specifieke eigenaar te publiceren. Zie
    [ClawHub — Publiceren](/nl/clawhub/publishing) en
    [ClawHub CLI](/nl/clawhub/cli) voor de volledige procedure, afbakening per eigenaar en andere
    onderhoudsopdrachten (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Aanbevolen werkwijzen

<Tip>
  - **Wees beknopt** — instrueer het model over *wat* het moet doen, niet hoe het een AI moet zijn.
  - **Veiligheid voorop** — als je skill `exec` gebruikt, zorg er dan voor dat prompts geen
    willekeurige opdrachtinjectie vanuit niet-vertrouwde invoer toestaan.
  - **Test lokaal** — gebruik `openclaw agent --message "..."` voordat je de skill deelt.
  - **Gebruik ClawHub** — bekijk communityskills op [clawhub.ai](https://clawhub.ai)
    voordat je iets vanaf nul bouwt.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Naslag voor Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Laadvolgorde, voorwaarden, toestemmingslijsten en de indeling van SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstellenwachtrij voor door agents opgestelde skills.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig configuratieschema voor `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Bekijk en publiceer skills in het openbare register.
  </Card>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="plug">
    Plugins kunnen skills meeleveren naast de tools die ze documenteren.
  </Card>
</CardGroup>
