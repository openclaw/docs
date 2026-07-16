---
read_when:
    - Skills publiceren
    - Publicatiefouten opsporen
summary: Indeling van de Skills-map, vereiste bestanden, toegestane bestandstypen en limieten.
x-i18n:
    generated_at: "2026-07-16T15:17:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill-indeling

## Op schijf

Een skill is een map.

Vereist:

- `SKILL.md` (of `skill.md`; de verouderde `skills.md` wordt ook geaccepteerd)

Optioneel:

- eventuele ondersteunende _tekstgebaseerde_ bestanden (zie ‘Toegestane bestanden’)
- `.clawhubignore` (negeerpatronen voor publicatie, verouderd: `.clawdhubignore`)
- `.gitignore` (wordt ook gerespecteerd)

## Importeren vanuit GitHub

De GitHub-importfunctie op het web is strenger dan lokaal publiceren/synchroniseren. Deze detecteert alleen
`SKILL.md`- of verouderde `skills.md`-bestanden in openbare repositories die geen fork zijn en eigendom zijn van
het ingelogde GitHub-account. Privérepositories, forks,
gearchiveerde/uitgeschakelde repositories en openbare repositories van derden worden niet geïmporteerd.

Metadata van lokale installatie (geschreven door de CLI):

- `<skill>/.clawhub/origin.json` (verouderd: `.clawdhub`)

Installatiestatus van de werkmap (geschreven door de CLI):

- `<workdir>/.clawhub/lock.json` (verouderd: `.clawdhub`)

## `SKILL.md`

- Markdown met optionele YAML-frontmatter.
- De server extraheert tijdens het publiceren metadata uit de frontmatter.
- `description` wordt gebruikt als samenvatting van de skill in de gebruikersinterface/zoekfunctie.

Voor overdraagbare Agent Skills moet `name` overeenkomen met de bovenliggende map en
1–64 kleine letters, cijfers of koppeltekens bevatten. ClawHub houdt de routeerbare slug en
de weergavenaam in de catalogus gescheiden, zodat bestaande namen uit andere clients
publiceerbaar blijven en niet stilzwijgend worden herschreven. In cataloguslijsten kunnen lange namen
visueel worden ingekort zonder de opgeslagen naam te wijzigen.

## Frontmatter-metadata

Skillmetadata wordt gedeclareerd in de YAML-frontmatter bovenaan je `SKILL.md`. Hiermee weet het register (en de beveiligingsanalyse) wat je skill nodig heeft om te kunnen worden uitgevoerd.

### Basisfrontmatter

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
description: Beheer taken via de Todoist-API.
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

Gebruik `requires.env` voor omgevingsvariabelen die aanwezig moeten zijn voordat de skill kan worden uitgevoerd. Gebruik `envVars` wanneer je metadata per variabele nodig hebt, waaronder optionele variabelen met `required: false`.

### Volledig veldenoverzicht

| Veld               | Type       | Beschrijving                                                                                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Vereiste omgevingsvariabelen die je skill verwacht.                                                                                          |
| `requires.bins`    | `string[]` | CLI-programma's die allemaal geïnstalleerd moeten zijn.                                                                                      |
| `requires.anyBins` | `string[]` | CLI-programma's waarvan er ten minste één beschikbaar moet zijn.                                                                             |
| `requires.config`  | `string[]` | Paden van configuratiebestanden die je skill leest.                                                                                          |
| `primaryEnv`       | `string`   | De belangrijkste omgevingsvariabele voor referenties van je skill.                                                                           |
| `envVars`          | `array`    | Declaraties van omgevingsvariabelen met `name`, optioneel `required` en optioneel `description`. Stel `required: false` in voor optionele omgevingsvariabelen. |
| `always`           | `boolean`  | Als `true`, is de skill altijd actief (geen expliciete installatie nodig).                                                       |
| `skillKey`         | `string`   | Overschrijf de aanroepsleutel van de skill.                                                                                                  |
| `emoji`            | `string`   | Weergave-emoji voor de skill.                                                                                                                |
| `homepage`         | `string`   | URL naar de homepage of documentatie van de skill.                                                                                           |
| `os`               | `string[]` | Besturingssysteembeperkingen (bijvoorbeeld `["macos"]`, `["linux"]`).                                                         |
| `install`          | `array`    | Installatiespecificaties voor afhankelijkheden (zie hieronder).                                                                              |
| `nix`              | `object`   | Specificatie voor de Nix-plugin (zie README).                                                                                                |
| `config`           | `object`   | Clawdbot-configuratiespecificatie (zie README).                                                                                              |

### Installatiespecificaties

Als je skill geïnstalleerde afhankelijkheden nodig heeft, declareer je deze in de array `install`:

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

Declareer optionele omgevingsvariabelen onder `metadata.openclaw.envVars` en stel `required: false` in. Voeg geen optionele vermeldingen toe aan `requires.env`, omdat `requires.env` betekent dat de skill zonder deze variabelen niet kan worden uitgevoerd.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist-API-token dat wordt gebruikt voor geauthenticeerde verzoeken.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionele standaardproject-ID wanneer de gebruiker er geen opgeeft.
```

### Waarom dit belangrijk is

De beveiligingsanalyse van ClawHub controleert of wat je skill declareert overeenkomt met wat deze daadwerkelijk doet. Als je code verwijst naar `TODOIST_API_KEY`, maar je frontmatter dit niet declareert onder `requires.env`, `primaryEnv` of `envVars`, markeert de analyse dit als niet-overeenkomende metadata. Door de declaraties nauwkeurig te houden, komt je skill gemakkelijker door de beoordeling en begrijpen gebruikers wat ze installeren.

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
        description: Todoist-API-token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optionele standaardproject-ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Toegestane bestanden

Alleen ‘tekstgebaseerde’ bestanden worden geaccepteerd bij het publiceren.

- De lijst met toegestane extensies staat in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Scriptbestanden worden na het uploaden nog steeds gescand; PowerShell-bestanden met `.ps1`, `.psm1` en `.psd1` worden als tekst geaccepteerd.
- Inhoudstypen die beginnen met `text/` worden als tekst behandeld, aangevuld met een kleine lijst toegestane typen (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limieten (serverzijde):

- Totale bundelgrootte: 50MB.
- Insluitingstekst omvat `SKILL.md` + maximaal circa 40 niet-`.md`-bestanden (inspanningslimiet).

## Slugs

- Standaard afgeleid van de mapnaam.
- Pakketbereiken moeten exact overeenkomen met de uitgevershandle op ClawHub. Uitgevershandles mogen kleine letters, cijfers, koppeltekens, punten en underscores bevatten; ze moeten beginnen en eindigen met een kleine letter of een cijfer.
- Pakketslugs moeten kleine letters bevatten en npm-veilig zijn, bijvoorbeeld `@example.tools/demo-plugin` of `demo-plugin`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie (semver).
- Tags zijn tekenreeksverwijzingen naar een versie; `latest` wordt vaak gebruikt.

## Licentie

- Alle op ClawHub gepubliceerde skills vallen onder de licentie `MIT-0`.
- Iedereen mag gepubliceerde skills gebruiken, wijzigen en herdistribueren, ook commercieel.
- Naamsvermelding is niet vereist.
- Voeg geen tegenstrijdige licentievoorwaarden toe in `SKILL.md`; ClawHub ondersteunt geen licentie-overschrijvingen per skill.

## Betaalde skills

- ClawHub ondersteunt geen betaalde skills, prijzen per skill, betaalmuren of omzetdeling.
- Voeg geen prijsmetadata toe aan `SKILL.md`; dit maakt geen deel uit van de skill-indeling en maakt een gepubliceerde skill niet betaald.
- Als je skill integreert met een betaalde service van derden, documenteer dan de externe kosten en het vereiste account duidelijk in de instructies en omgevingsdeclaraties van de skill (`requires.env` voor vereiste variabelen, of `envVars` met `required: false` voor optionele variabelen).
