---
read_when:
    - Skills publiceren
    - Publicatiefouten debuggen
summary: Indeling van de Skills-map, vereiste bestanden, toegestane bestandstypen, limieten.
x-i18n:
    generated_at: "2026-07-04T06:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Vaardigheidsindeling

## Op schijf

Een vaardigheid is een map.

Vereist:

- `SKILL.md` (of `skill.md`; legacy `skills.md` wordt ook geaccepteerd)

Optioneel:

- eventuele ondersteunende _tekstgebaseerde_ bestanden (zie “Toegestane bestanden”)
- `.clawhubignore` (negeerpatronen voor publiceren, legacy `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

## GitHub-import

De webimporter voor GitHub is strenger dan lokaal publiceren/synchroniseren. Deze ontdekt alleen
`SKILL.md`- of legacy `skills.md`-bestanden in openbare, niet-geforkte repositories die eigendom zijn van
het aangemelde GitHub-account. Deze importeert geen privérepositories, forks,
gearchiveerde/uitgeschakelde repositories of openbare repositories van derden.

Lokale installatiemetagegevens (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Installatiestatus van werkmap (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server extraheert metagegevens uit frontmatter tijdens het publiceren.
- `description` wordt gebruikt als vaardigheidssamenvatting in de UI/zoekfunctie.

## Frontmatter-metagegevens

Vaardigheidsmetagegevens worden gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Dit vertelt het register (en de beveiligingsanalyse) wat je vaardigheid nodig heeft om te draaien.

### Basisfrontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime-metagegevens (`metadata.openclaw`)

Declareer de runtimevereisten van je vaardigheid onder `metadata.openclaw` (aliassen: `metadata.clawdbot`, `metadata.clawdis`).

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

Gebruik `requires.env` voor omgevingsvariabelen die aanwezig moeten zijn voordat de vaardigheid kan draaien. Gebruik `envVars` wanneer je metagegevens per variabele nodig hebt, inclusief optionele variabelen met `required: false`.

### Volledige veldreferentie

| Veld               | Type       | Beschrijving                                                                                                                                              |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Vereiste omgevingsvariabelen die je vaardigheid verwacht.                                                                                                  |
| `requires.bins`    | `string[]` | CLI-binaries die allemaal geïnstalleerd moeten zijn.                                                                                                       |
| `requires.anyBins` | `string[]` | CLI-binaries waarvan er minstens één moet bestaan.                                                                                                         |
| `requires.config`  | `string[]` | Configbestandspaden die je vaardigheid leest.                                                                                                             |
| `primaryEnv`       | `string`   | De hoofdcredential-omgevingsvariabele voor je vaardigheid.                                                                                                 |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele omgevingsvariabelen. |
| `always`           | `boolean`  | Als `true`, is de vaardigheid altijd actief (geen expliciete installatie nodig).                                                                            |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de vaardigheid.                                                                                                         |
| `emoji`            | `string`   | Weergave-emoji voor de vaardigheid.                                                                                                                       |
| `homepage`         | `string`   | URL naar de homepage of documentatie van de vaardigheid.                                                                                                  |
| `os`               | `string[]` | OS-beperkingen (bijv. `["macos"]`, `["linux"]`).                                                                                                          |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                                           |
| `nix`              | `object`   | Nix-Plugin-specificatie (zie README).                                                                                                                     |
| `config`           | `object`   | Clawdbot-configspecificatie (zie README).                                                                                                                 |

### Installatiespecificaties

Als je vaardigheid geïnstalleerde afhankelijkheden nodig heeft, declareer ze dan in de array `install`:

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

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele items toe aan `requires.env`, omdat `requires.env` betekent dat de vaardigheid niet zonder die items kan draaien.

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

De beveiligingsanalyse van ClawHub controleert of wat je vaardigheid declareert overeenkomt met wat deze daadwerkelijk doet. Als je code verwijst naar `TODOIST_API_KEY`, maar je frontmatter deze niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als een metagegevensmismatch. Nauwkeurige declaraties helpen je vaardigheid door de review te komen en helpen gebruikers begrijpen wat ze installeren.

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
- Contenttypen die beginnen met `text/` worden behandeld als tekst; plus een kleine allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (serverzijde):

- Totale bundelgrootte: 50 MB.
- Inbeddingstekst omvat `SKILL.md` + maximaal ongeveer 40 niet-`.md`-bestanden (best-effortlimiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Pakketscopes moeten exact overeenkomen met de ClawHub-publisherhandle. Publisherhandles mogen kleine letters, cijfers, koppeltekens, punten en underscores gebruiken; ze moeten beginnen en eindigen met een kleine letter of cijfer.
- Pakketslugs moeten lowercase en npm-veilig zijn, bijvoorbeeld `@example.tools/demo-plugin` of `demo-plugin`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie (semver).
- Tags zijn tekenreeksverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle vaardigheden die op ClawHub worden gepubliceerd, krijgen een licentie onder `MIT-0`.
- Iedereen mag gepubliceerde vaardigheden gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen conflicterende licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per vaardigheid.

## Betaalde vaardigheden

- ClawHub ondersteunt geen betaalde vaardigheden, prijzen per vaardigheid, paywalls of winstdeling.
- Voeg geen prijsmetagegevens toe aan `SKILL.md`; dit maakt geen deel uit van de vaardigheidsindeling en maakt een gepubliceerde vaardigheid niet betaald.
- Als je vaardigheid integreert met een betaalde externe dienst, documenteer dan duidelijk de externe kosten en het vereiste account in de vaardigheidsinstructies en omgevingsdeclaraties (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
