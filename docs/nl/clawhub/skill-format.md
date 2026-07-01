---
read_when:
    - Skills publiceren
    - Publicatiefouten debuggen
summary: Indeling van Skills-mappen, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-07-01T08:15:40Z"
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

- `SKILL.md` (of `skill.md`; verouderd `skills.md` wordt ook geaccepteerd)

Optioneel:

- eventuele ondersteunende _tekstgebaseerde_ bestanden (zie “Toegestane bestanden”)
- `.clawhubignore` (negeerpatronen voor publiceren, verouderd `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

## GitHub-import

De web-GitHub-importer is strenger dan lokaal publiceren/synchroniseren. Deze ontdekt alleen
`SKILL.md`- of verouderde `skills.md`-bestanden in openbare, niet-fork-repository's die eigendom zijn van
het aangemelde GitHub-account. Deze importeert geen privérepository's, forks,
gearchiveerde/uitgeschakelde repository's of openbare repository's van derden.

Lokale installatiemetadata (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (verouderd `.clawdhub`)

Installatiestatus van workdir (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (verouderd `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt tijdens publiceren metadata uit frontmatter.
- `description` wordt gebruikt als samenvatting van de skill in de UI/zoekfunctie.

## Frontmatter-metadata

Skill-metadata wordt gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Dit vertelt de registry (en beveiligingsanalyse) wat je skill nodig heeft om te draaien.

### Basis-frontmatter

```yaml
---
name: my-skill
description: Korte samenvatting van wat deze skill doet.
version: 1.0.0
---
```

### Runtime-metadata (`metadata.openclaw`)

Declareer de runtimevereisten van je skill onder `metadata.openclaw` (aliassen: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Beheer taken via de Todoist API.
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
| `requires.anyBins` | `string[]` | CLI-binaries waarvan er minimaal één moet bestaan.                                                                                           |
| `requires.config`  | `string[]` | Config-bestandspaden die je skill leest.                                                                                                     |
| `primaryEnv`       | `string`   | De belangrijkste credential-env-var voor je skill.                                                                                           |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele env-vars. |
| `always`           | `boolean`  | Als `true`, is de skill altijd actief (geen expliciete installatie nodig).                                                                    |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                  |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                |
| `homepage`         | `string`   | URL naar de homepage of docs van de skill.                                                                                                   |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                              |
| `nix`              | `object`   | Nix Plugin-specificatie (zie README).                                                                                                        |
| `config`           | `object`   | Clawdbot-configuratiespecificatie (zie README).                                                                                              |

### Installatiespecificaties

Als je skill geïnstalleerde afhankelijkheden nodig heeft, declareer die dan in de `install`-array:

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

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele items toe aan `requires.env`, omdat `requires.env` betekent dat de skill zonder die variabelen niet kan draaien.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API-token gebruikt voor geauthenticeerde verzoeken.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionele standaardproject-ID wanneer de gebruiker er geen opgeeft.
```

### Waarom dit belangrijk is

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat deze daadwerkelijk doet. Als je code naar `TODOIST_API_KEY` verwijst maar je frontmatter dit niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als een metadata-mismatch. Nauwkeurige declaraties helpen je skill door de review te komen en helpen gebruikers begrijpen wat ze installeren.

### Voorbeeld: complete frontmatter

```yaml
---
name: todoist-cli
description: Beheer Todoist-taken, -projecten en -labels vanaf de commandoregel.
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
        description: Todoist API-token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionele standaardproject-ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Toegestane bestanden

Alleen “tekstgebaseerde” bestanden worden door publiceren geaccepteerd.

- De extensie-allowlist staat in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Scriptbestanden worden na upload nog steeds gescand; PowerShell-`.ps1`-, `.psm1`- en `.psd1`-bestanden worden als tekst geaccepteerd.
- Contenttypes die beginnen met `text/` worden als tekst behandeld; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (server-side):

- Totale bundelgrootte: 50 MB.
- Embeddingtekst bevat `SKILL.md` + maximaal ongeveer 40 niet-`.md`-bestanden (best-effort-limiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Package-scopes moeten exact overeenkomen met de ClawHub-publisherhandle. Publisherhandles mogen kleine letters, cijfers, koppeltekens, punten en underscores gebruiken; ze moeten beginnen en eindigen met een kleine letter of cijfer.
- Package-slugs moeten kleine letters gebruiken en npm-safe zijn, bijvoorbeeld `@example.tools/demo-plugin` of `demo-plugin`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle skills die op ClawHub worden gepubliceerd, hebben een licentie onder `MIT-0`.
- Iedereen mag gepubliceerde skills gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde skills

- ClawHub ondersteunt geen betaalde skills, prijzen per skill, betaalmuren of omzetdeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en maakt een gepubliceerde skill niet betaald.
- Als je skill integreert met een betaalde externe dienst, documenteer dan de externe kosten en het vereiste account duidelijk in de skill-instructies en env-declaraties (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
