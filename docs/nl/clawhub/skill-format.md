---
read_when:
    - Skills publiceren
    - Publicatiefouten debuggen
summary: Mapindeling voor Skills, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-07-02T17:42:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-indeling

## Op schijf

Een skill is een map.

Vereist:

- `SKILL.md` (of `skill.md`; verouderde `skills.md` wordt ook geaccepteerd)

Optioneel:

- alle ondersteunende _tekstgebaseerde_ bestanden (zie “Toegestane bestanden”)
- `.clawhubignore` (negeerpatronen voor publiceren, verouderde `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

## GitHub-import

De GitHub-importer op het web is strikter dan lokaal publiceren/synchroniseren. Deze ontdekt alleen
`SKILL.md`- of verouderde `skills.md`-bestanden in openbare, niet-geforkte repositories die eigendom zijn van
het aangemelde GitHub-account. Deze importeert geen privérepository's, forks,
gearchiveerde/uitgeschakelde repositories of openbare repositories van derden.

Lokale installatiemetadata (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (verouderde `.clawdhub`)

Installatiestatus van de werkmap (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (verouderde `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt metadata uit frontmatter tijdens het publiceren.
- `description` wordt gebruikt als de samenvatting van de skill in de UI/zoekfunctie.

## Frontmatter-metadata

Skill-metadata wordt gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Dit vertelt het register (en de beveiligingsanalyse) wat je skill nodig heeft om te draaien.

### Basisfrontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtimemetadata (`metadata.openclaw`)

Declareer de runtimevereisten van je skill onder `metadata.openclaw` (aliassen: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Gebruik `requires.env` voor omgevingsvariabelen die aanwezig moeten zijn voordat de skill kan draaien. Gebruik `envVars` wanneer je metadata per variabele nodig hebt, inclusief optionele variabelen met `required: false`.

### Volledige veldreferentie

| Veld               | Type       | Beschrijving                                                                                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Vereiste omgevingsvariabelen die je skill verwacht.                                                                                          |
| `requires.bins`    | `string[]` | CLI-binaries die allemaal geïnstalleerd moeten zijn.                                                                                         |
| `requires.anyBins` | `string[]` | CLI-binaries waarvan er ten minste één moet bestaan.                                                                                         |
| `requires.config`  | `string[]` | Paden naar configuratiebestanden die je skill leest.                                                                                         |
| `primaryEnv`       | `string`   | De belangrijkste omgevingsvariabele voor referenties voor je skill.                                                                          |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele omgevingsvariabelen. |
| `always`           | `boolean`  | Als dit `true` is, is de skill altijd actief (geen expliciete installatie nodig).                                                            |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                  |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                |
| `homepage`         | `string`   | URL naar de startpagina of documentatie van de skill.                                                                                        |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                              |
| `nix`              | `object`   | Nix Plugin-specificatie (zie README).                                                                                                        |
| `config`           | `object`   | Clawdbot-configuratiespecificatie (zie README).                                                                                              |

### Installatiespecificaties

Als je skill geïnstalleerde afhankelijkheden nodig heeft, declareer je deze in de `install`-array:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Ondersteunde installatiesoorten: `brew`, `node`, `go`, `uv`.

### Optionele omgevingsvariabelen

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele vermeldingen toe aan `requires.env`, omdat `requires.env` betekent dat de skill niet zonder deze kan draaien.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Waarom dit belangrijk is

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat deze daadwerkelijk doet. Als je code verwijst naar `TODOIST_API_KEY` maar je frontmatter deze niet declareert onder `requires.env`, `primaryEnv` of `envVars`, zal de analyse een mismatch in metadata markeren. Nauwkeurige declaraties helpen je skill door de beoordeling te komen en helpen gebruikers begrijpen wat ze installeren.

### Voorbeeld: volledige frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Toegestane bestanden

Alleen “tekstgebaseerde” bestanden worden geaccepteerd door publiceren.

- De allowlist voor extensies staat in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Scriptbestanden worden na upload nog steeds gescand; PowerShell-bestanden `.ps1`, `.psm1` en `.psd1` worden als tekst geaccepteerd.
- Contenttypen die beginnen met `text/` worden als tekst behandeld; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (serverzijde):

- Totale bundelgrootte: 50 MB.
- Insluitingstekst bevat `SKILL.md` + maximaal ongeveer 40 niet-`.md`-bestanden (best-effort limiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Package-scopes moeten exact overeenkomen met de ClawHub-uitgevershandle. Uitgevershandles mogen kleine letters, cijfers, koppeltekens, punten en underscores gebruiken; ze moeten beginnen en eindigen met een kleine letter of een cijfer.
- Package-slugs moeten lowercase en npm-veilig zijn, bijvoorbeeld `@example.tools/demo-plugin` of `demo-plugin`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle skills die op ClawHub worden gepubliceerd, vallen onder de `MIT-0`-licentie.
- Iedereen mag gepubliceerde skills gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde skills

- ClawHub ondersteunt geen betaalde skills, prijzen per skill, betaalmuren of winstdeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en maakt een gepubliceerde skill niet betaald.
- Als je skill integreert met een betaalde service van derden, documenteer dan de externe kosten en het vereiste account duidelijk in de skill-instructies en omgevingsdeclaraties (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
