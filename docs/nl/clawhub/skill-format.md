---
read_when:
    - Skills publiceren
    - Publicatie-/synchronisatiefouten debuggen
summary: Mapindeling voor Skills, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-05-12T00:57:41Z"
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

- eventuele ondersteunende _tekstgebaseerde_ bestanden (zie “Toegestane bestanden”)
- `.clawhubignore` (negeerpatronen voor publiceren/synchroniseren, legacy `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

Metadata van lokale installatie (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Installatiestatus van workdir (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt tijdens het publiceren metadata uit de frontmatter.
- `description` wordt gebruikt als de samenvatting van de skill in de UI/zoekfunctie.

## Frontmatter-metadata

Skill-metadata wordt gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Dit vertelt het register (en de beveiligingsanalyse) wat je skill nodig heeft om te draaien.

### Basis-frontmatter

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

| Veld               | Type       | Beschrijving                                                                                                                                           |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Vereiste omgevingsvariabelen die je skill verwacht.                                                                                                    |
| `requires.bins`    | `string[]` | CLI-binaries die allemaal geïnstalleerd moeten zijn.                                                                                                   |
| `requires.anyBins` | `string[]` | CLI-binaries waarvan er minstens één moet bestaan.                                                                                                     |
| `requires.config`  | `string[]` | Paden naar configuratiebestanden die je skill leest.                                                                                                   |
| `primaryEnv`       | `string`   | De belangrijkste omgevingsvariabele voor credentials voor je skill.                                                                                    |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required`, en optioneel `description`. Stel `required: false` in voor optionele env-vars. |
| `always`           | `boolean`  | Als `true`, is de skill altijd actief (geen expliciete installatie nodig).                                                                              |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                            |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                          |
| `homepage`         | `string`   | URL naar de homepage of documentatie van de skill.                                                                                                     |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                                       |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                                        |
| `nix`              | `object`   | Nix-plugin-specificatie (zie README).                                                                                                                  |
| `config`           | `object`   | Clawdbot-configuratiespecificatie (zie README).                                                                                                       |

### Installatiespecificaties

Als je skill geïnstalleerde afhankelijkheden nodig heeft, declareer ze dan in de array `install`:

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

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele items toe aan `requires.env`, omdat `requires.env` betekent dat de skill zonder deze variabelen niet kan draaien.

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

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat die daadwerkelijk doet. Als je code naar `TODOIST_API_KEY` verwijst, maar je frontmatter die niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als een metadata-mismatch. Nauwkeurige declaraties helpen je skill door de beoordeling te komen en helpen gebruikers te begrijpen wat ze installeren.

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
- Scriptbestanden worden na uploaden nog steeds gescand; PowerShell-bestanden `.ps1`, `.psm1` en `.psd1` worden geaccepteerd als tekst.
- Contenttypen die beginnen met `text/` worden behandeld als tekst; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (server-side):

- Totale bundelgrootte: 50 MB.
- Embedding-tekst omvat `SKILL.md` + maximaal ongeveer 40 niet-`.md`-bestanden (best-effort-limiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet uit kleine letters bestaan en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie (semver).
- Tags zijn stringwijzers naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle skills die op ClawHub worden gepubliceerd, hebben een licentie onder `MIT-0`.
- Iedereen mag gepubliceerde skills gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde skills

- ClawHub ondersteunt geen betaalde skills, prijzen per skill, betaalmuren of omzetdeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en maakt een gepubliceerde skill niet betaald.
- Als je skill integreert met een betaalde externe service, documenteer dan de externe kosten en het vereiste account duidelijk in de instructies en env-declaraties van de skill (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
