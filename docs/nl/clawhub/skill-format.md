---
read_when:
    - Skills publiceren
    - Publicatiefouten debuggen
summary: Indeling van de Skills-map, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-07-02T14:06:02Z"
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

De GitHub-importeur op het web is strenger dan lokaal publiceren/synchroniseren. Deze ontdekt alleen
`SKILL.md`- of verouderde `skills.md`-bestanden in openbare, niet-geforkte repositories die eigendom zijn van
het aangemelde GitHub-account. Privérepo's, forks,
gearchiveerde/uitgeschakelde repo's of openbare repo's van derden worden niet geïmporteerd.

Lokale installatiemetagegevens (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (verouderd `.clawdhub`)

Installatiestatus van workdir (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (verouderd `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt tijdens het publiceren metadata uit frontmatter.
- `description` wordt gebruikt als skillsamenvatting in de UI/zoekfunctie.

## Frontmatter-metadata

Skillmetadata wordt gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Dit vertelt de registry (en beveiligingsanalyse) wat je skill nodig heeft om te draaien.

### Basisfrontmatter

```yaml
---
name: my-skill
description: Korte samenvatting van wat deze skill doet.
version: 1.0.0
---
```

### Runtimemetadata (`metadata.openclaw`)

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

| Veld               | Type       | Beschrijving                                                                                                                                                   |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Vereiste omgevingsvariabelen die je skill verwacht.                                                                                                            |
| `requires.bins`    | `string[]` | CLI-binaire bestanden die allemaal geïnstalleerd moeten zijn.                                                                                                  |
| `requires.anyBins` | `string[]` | CLI-binaire bestanden waarvan er minstens één moet bestaan.                                                                                                    |
| `requires.config`  | `string[]` | Paden naar configbestanden die je skill leest.                                                                                                                 |
| `primaryEnv`       | `string`   | De belangrijkste credential-env-var voor je skill.                                                                                                            |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele env-vars.            |
| `always`           | `boolean`  | Als `true` is de skill altijd actief (geen expliciete installatie nodig).                                                                                       |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                                    |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                                  |
| `homepage`         | `string`   | URL naar de homepage of docs van de skill.                                                                                                                     |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                                               |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                                                |
| `nix`              | `object`   | Nix-pluginspecificatie (zie README).                                                                                                                          |
| `config`           | `object`   | Clawdbot-configspecificatie (zie README).                                                                                                                      |

### Installatiespecificaties

Als je skill geïnstalleerde afhankelijkheden nodig heeft, declareer ze dan in de `install`-array:

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

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele vermeldingen toe aan `requires.env`, omdat `requires.env` betekent dat de skill niet zonder deze variabelen kan draaien.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API-token dat wordt gebruikt voor geauthenticeerde verzoeken.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionele standaardproject-ID wanneer de gebruiker er geen opgeeft.
```

### Waarom dit belangrijk is

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat die daadwerkelijk doet. Als je code verwijst naar `TODOIST_API_KEY`, maar je frontmatter dit niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als een metadatamismatch. Nauwkeurige declaraties helpen je skill door de review te komen en helpen gebruikers te begrijpen wat ze installeren.

### Voorbeeld: volledige frontmatter

```yaml
---
name: todoist-cli
description: Beheer Todoist-taken, -projecten en -labels vanaf de opdrachtregel.
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

Alleen “tekstgebaseerde” bestanden worden geaccepteerd door publiceren.

- De extensie-allowlist staat in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Scriptbestanden worden na upload nog steeds gescand; PowerShell-bestanden `.ps1`, `.psm1` en `.psd1` worden als tekst geaccepteerd.
- Contenttypes die beginnen met `text/` worden als tekst behandeld; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (serverzijde):

- Totale bundelgrootte: 50MB.
- Embeddingtekst omvat `SKILL.md` + maximaal ~40 niet-`.md`-bestanden (best-effort limiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Packagescopes moeten exact overeenkomen met de ClawHub-uitgevershandle. Uitgevershandles mogen kleine letters, cijfers, koppeltekens, punten en underscores gebruiken; ze moeten beginnen en eindigen met een kleine letter of cijfer.
- Packageslugs moeten kleine letters gebruiken en npm-safe zijn, bijvoorbeeld `@example.tools/demo-plugin` of `demo-plugin`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle skills die op ClawHub worden gepubliceerd, vallen onder de licentie `MIT-0`.
- Iedereen mag gepubliceerde skills gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde skills

- ClawHub ondersteunt geen betaalde skills, prijzen per skill, betaalmuren of omzetdeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en zal een gepubliceerde skill niet betaald maken.
- Als je skill integreert met een betaalde dienst van derden, documenteer dan duidelijk de externe kosten en het vereiste account in de skillinstructies en env-declaraties (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
