---
read_when:
    - Je wilt begrijpen hoe Task Flow zich verhoudt tot achtergrondtaken
    - Je komt TaskFlow of openclaw tasks flow tegen in releaseopmerkingen of documentatie
    - Je wilt de persistente stroomstatus inspecteren of beheren
summary: Task Flow-floworkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-05-10T19:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow is de flow-orchestratiesubstraatlaag die boven [achtergrondtaken](/nl/automation/tasks) ligt. Het beheert duurzame meerstapsflows met hun eigen status, revisietracking en synchronisatiesemantiek, terwijl afzonderlijke taken de eenheid van losgekoppeld werk blijven.

## Wanneer u Task Flow gebruikt

Gebruik Task Flow wanneer werk meerdere opeenvolgende of vertakkende stappen omvat en u duurzame voortgangstracking nodig hebt over gateway-herstarts heen. Voor enkele achtergrondbewerkingen is een gewone [taak](/nl/automation/tasks) voldoende.

| Scenario                                | Gebruik                    |
| --------------------------------------- | -------------------------- |
| Enkele achtergrondtaak                   | Gewone taak                |
| Meerstapspijplijn (A dan B dan C)        | Task Flow (beheerd)        |
| Extern aangemaakte taken observeren      | Task Flow (gespiegeld)     |
| Eenmalige herinnering                    | Cron-taak                  |

## Betrouwbaar patroon voor geplande workflows

Behandel voor terugkerende workflows, zoals marktinformatiebriefings, de planning, orchestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Geplande taken](/nl/automation/cron-jobs) voor timing.
2. Gebruik een persistente cron-sessie wanneer de workflow moet voortbouwen op eerdere context.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattingstokens.
4. Gebruik Task Flow om de meerstapsrun te volgen over child-taken, wachttijden, retries en gateway-herstarts heen.

Voorbeeld van cron-vorm:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Gebruik `session:<id>` in plaats van `isolated` wanneer de terugkerende workflow bewuste geschiedenis, samenvattingen van eerdere runs of vaste context nodig heeft. Gebruik `isolated` wanneer elke run vers moet beginnen en alle vereiste status expliciet in de workflow staat.

Plaats binnen de workflow betrouwbaarheidscontroles vóór de LLM-samenvattingsstap:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Aanbevolen preflight-controles:

- Beschikbaarheid van de browser en profielkeuze, bijvoorbeeld `openclaw` voor beheerde status of `user` wanneer een aangemelde Chrome-sessie vereist is. Zie [Browser](/nl/tools/browser).
- API-referenties en quota voor elke bron.
- Netwerkbereikbaarheid voor vereiste endpoints.
- Vereiste tools ingeschakeld voor de agent, zoals `lobster`, `browser` en `llm-task`.
- Foutbestemming geconfigureerd voor cron zodat preflight-fouten zichtbaar zijn. Zie [Geplande taken](/nl/automation/cron-jobs#delivery-and-output).

Aanbevolen velden voor dataherkomst voor elk verzameld item:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Laat de workflow verouderde items weigeren of markeren vóór de samenvatting. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet worden gevraagd om `sourceUrl`, `retrievedAt` en `asOf` in de output te behouden. Gebruik [LLM-taak](/nl/tools/llm-task) wanneer u een schemagevalideerde modelstap binnen de workflow nodig hebt.

Voor herbruikbare team- of communityworkflows verpakt u de CLI, `.lobster`-bestanden en eventuele setupnotities als een skill of plugin en publiceert u die via [ClawHub](/nl/clawhub). Bewaar workflowspecifieke guardrails in dat pakket, tenzij de plugin-API een benodigde generieke capability mist.

## Synchronisatiemodi

### Beheerde modus

Taakflow beheert de levenscyclus van begin tot eind. Het maakt taken aan als flowstappen, stuurt ze naar voltooiing en werkt de flowstatus automatisch bij.

Voorbeeld: een wekelijkse rapportageflow die (1) gegevens verzamelt, (2) het rapport genereert en (3) het aflevert. Taakflow maakt elke stap aan als achtergrondtaak, wacht op voltooiing en gaat daarna door naar de volgende stap.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelde modus

Taakflow observeert extern aangemaakte taken en houdt de flowstatus synchroon zonder eigenaar te worden van het aanmaken van taken. Dit is nuttig wanneer taken afkomstig zijn van cronjobs, CLI-opdrachten of andere bronnen en je een eenduidig overzicht wilt van hun voortgang als flow.

Voorbeeld: drie onafhankelijke cronjobs die samen een routine voor "morning ops" vormen. Een gespiegelde flow volgt hun gezamenlijke voortgang zonder te bepalen wanneer of hoe ze worden uitgevoerd.

## Duurzame status en revisietracking

Elke flow bewaart zijn eigen status en houdt revisies bij, zodat voortgang gateway-herstarts overleeft. Revisietracking maakt conflictdetectie mogelijk wanneer meerdere bronnen dezelfde flow gelijktijdig proberen voort te zetten.
Het flowregister gebruikt SQLite met begrensd onderhoud van het write-ahead-logboek, inclusief
periodieke checkpoints en checkpoints bij afsluiten, zodat langlopende gateways geen
onbegrensde `registry.sqlite-wal`-sidecarbestanden behouden.

## Annuleringsgedrag

`openclaw tasks flow cancel` stelt een blijvende annuleringsintentie in op de flow. Actieve taken binnen de flow worden geannuleerd en er worden geen nieuwe stappen gestart. De annuleringsintentie blijft behouden na herstarts, zodat een geannuleerde flow geannuleerd blijft, zelfs als de gateway herstart voordat alle onderliggende taken zijn beëindigd.

## CLI-opdrachten

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Opdracht                          | Beschrijving                                      |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Toont gevolgde flows met status en synchronisatiemodus |
| `openclaw tasks flow show <id>`   | Inspecteer één flow op flow-id of opzoeksleutel   |
| `openclaw tasks flow cancel <id>` | Annuleer een actieve flow en de actieve taken ervan |

## Hoe flows zich verhouden tot taken

Flows coördineren taken, ze vervangen ze niet. Eén flow kan gedurende zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om afzonderlijke taakrecords te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — het losgekoppelde werklogboek dat flows coördineren
- [CLI: taken](/nl/cli/tasks) — CLI-opdrachtenreferentie voor `openclaw tasks flow`
- [Automatiseringsoverzicht](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cronjobs](/nl/automation/cron-jobs) — geplande jobs die flows kunnen voeden
