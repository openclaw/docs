---
read_when:
    - Skills publiceren
    - Publicatie-/synchronisatiefouten debuggen
summary: Indeling van Skills-mappen, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-05-12T08:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-indeling

## Op schijf

Een skill is een map.

Vereist:

- `SKILL.md` (of `skill.md`)

Optioneel:

- alle ondersteunende _tekstgebaseerde_ bestanden (zie “Toegestane bestanden”)
- `.clawhubignore` (negeerpatronen voor publiceren/synchroniseren, legacy `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

Lokale installatiemetagegevens (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Installatiestatus van werkmap (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

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

### Runtime-metadata (`metadata.openclaw`)

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
| `requires.bins`    | `string[]` | CLI-binaries die allemaal geinstalleerd moeten zijn.                                                                                         |
| `requires.anyBins` | `string[]` | CLI-binaries waarvan er minstens een moet bestaan.                                                                                           |
| `requires.config`  | `string[]` | Paden naar configuratiebestanden die je skill leest.                                                                                         |
| `primaryEnv`       | `string`   | De belangrijkste credential-omgevingsvariabele voor je skill.                                                                                |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele omgevingsvariabelen. |
| `always`           | `boolean`  | Als `true`, is de skill altijd actief (geen expliciete installatie nodig).                                                                    |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                  |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                |
| `homepage`         | `string`   | URL naar de homepage of documentatie van de skill.                                                                                           |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                              |
| `nix`              | `object`   | Nix-Plugin-specificatie (zie README).                                                                                                        |
| `config`           | `object`   | Clawdbot-configuratiespecificatie (zie README).                                                                                              |

### Installatiespecificaties

Als je skill geinstalleerde afhankelijkheden nodig heeft, declareer die dan in de `install`-array:

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

Ondersteunde installatietypen: `brew`, `node`, `go`, `uv`.

### Optionele omgevingsvariabelen

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele vermeldingen toe aan `requires.env`, omdat `requires.env` betekent dat de skill niet zonder deze variabelen kan draaien.

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

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat deze daadwerkelijk doet. Als je code verwijst naar `TODOIST_API_KEY` maar je frontmatter dit niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als een metadata-mismatch. Nauwkeurige declaraties helpen je skill door de review te komen en helpen gebruikers begrijpen wat ze installeren.

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

Alleen “tekstgebaseerde” bestanden worden door publish geaccepteerd.

- De allowlist voor extensies staat in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Scriptbestanden worden na upload nog steeds gescand; PowerShell-bestanden `.ps1`, `.psm1` en `.psd1` worden als tekst geaccepteerd.
- Contenttypen die beginnen met `text/` worden behandeld als tekst; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (server-side):

- Totale bundelgrootte: 50 MB.
- Embedding-tekst bevat `SKILL.md` + maximaal ongeveer 40 niet-`.md`-bestanden (best-effort limiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet kleine letters gebruiken en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versionering + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle Skills die op ClawHub worden gepubliceerd, worden gelicentieerd onder `MIT-0`.
- Iedereen mag gepubliceerde Skills gebruiken, wijzigen en opnieuw distribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde Skills

- ClawHub ondersteunt geen betaalde Skills, prijzen per skill, paywalls of inkomstendeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en maakt een gepubliceerde skill niet betaald.
- Als je skill integreert met een betaalde externe service, documenteer dan duidelijk de externe kosten en het vereiste account in de skill-instructies en env-declaraties (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
