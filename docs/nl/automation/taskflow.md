---
read_when:
    - U wilt begrijpen hoe Taakstroom zich verhoudt tot achtergrondtaken
    - Je komt Task Flow of openclaw tasks flow tegen in release-opmerkingen of documentatie
    - Je wilt duurzame flowstatus inspecteren of beheren
summary: Taakstroom-orkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-06-27T17:09:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow is het orkestratiesubstraat voor flows dat boven [achtergrondtaken](/nl/automation/tasks) ligt. Het beheert duurzame meerstapsflows met hun eigen status, revisietracking en synchronisatiesemantiek, terwijl afzonderlijke taken de eenheid van losgekoppeld werk blijven.

## Wanneer Task Flow gebruiken

Gebruik Task Flow wanneer werk meerdere opeenvolgende of vertakkende stappen omvat en je duurzame voortgangstracking over gateway-herstarts heen nodig hebt. Voor afzonderlijke achtergrondbewerkingen is een gewone [taak](/nl/automation/tasks) voldoende.

| Scenario                                      | Gebruik                 |
| --------------------------------------------- | ----------------------- |
| Afzonderlijke achtergrondtaak                 | Gewone taak             |
| Meerstapspijplijn (A, dan B, dan C)           | Task Flow (beheerd)     |
| Extern gemaakte taken observeren              | Task Flow (gespiegeld)  |
| Eenmalige herinnering                         | Cron-taak               |

## Betrouwbaar patroon voor geplande workflows

Behandel voor terugkerende workflows, zoals briefings over marktinformatie, de planning, orkestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Geplande taken](/nl/automation/cron-jobs) voor timing.
2. Gebruik een persistente cron-sessie wanneer de workflow moet voortbouwen op eerdere context.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattingstokens.
4. Gebruik Task Flow om de meerstapsuitvoering te volgen over onderliggende taken, wachttijden, retries en gateway-herstarts heen.

Voorbeeld van een cron-vorm:

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

Gebruik `session:<id>` in plaats van `isolated` wanneer de terugkerende workflow bewuste geschiedenis, samenvattingen van eerdere uitvoeringen of vaste context nodig heeft. Gebruik `isolated` wanneer elke uitvoering schoon moet starten en alle vereiste status expliciet in de workflow staat.

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

- Beschikbaarheid van de browser en profielkeuze, bijvoorbeeld `openclaw` voor beheerde status of `user` wanneer een ingelogde Chrome-sessie vereist is. Zie [Browser](/nl/tools/browser).
- API-referenties en quota voor elke bron.
- Netwerkbereikbaarheid voor vereiste endpoints.
- Vereiste tools ingeschakeld voor de agent, zoals `lobster`, `browser` en `llm-task`.
- Faalbestemming geconfigureerd voor cron zodat preflight-fouten zichtbaar zijn. Zie [Geplande taken](/nl/automation/cron-jobs#delivery-and-output).

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

Laat de workflow verouderde items weigeren of markeren vóór de samenvatting. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet worden gevraagd om `sourceUrl`, `retrievedAt` en `asOf` in de uitvoer te behouden. Gebruik [LLM-taak](/nl/tools/llm-task) wanneer je een schemagevalideerde modelstap binnen de workflow nodig hebt.

Verpak voor herbruikbare team- of communityworkflows de CLI, `.lobster`-bestanden en eventuele installatienotities als een skill of Plugin en publiceer deze via [ClawHub](/nl/clawhub). Houd workflowspecifieke guardrails in dat pakket, tenzij de Plugin-API een benodigde generieke capability mist.

## Synchronisatiemodi

### Beheerde modus

Task Flow bezit de lifecycle end-to-end. Het maakt taken als flowstappen, stuurt ze naar voltooiing en werkt de flowstatus automatisch bij.

Voorbeeld: een wekelijkse rapportflow die (1) data verzamelt, (2) het rapport genereert en (3) het bezorgt. Task Flow maakt elke stap als achtergrondtaak, wacht op voltooiing en gaat dan door naar de volgende stap.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelde modus

Task Flow observeert extern gemaakte taken en houdt de flowstatus gesynchroniseerd zonder eigenaar te worden van het maken van taken. Dit is nuttig wanneer taken afkomstig zijn van cron-jobs, CLI-opdrachten of andere bronnen en je één uniform overzicht van hun voortgang als flow wilt.

Voorbeeld: drie onafhankelijke cron-jobs die samen een "morning ops"-routine vormen. Een gespiegelde flow volgt hun gezamenlijke voortgang zonder te bepalen wanneer of hoe ze worden uitgevoerd.

## Duurzame status en revisietracking

Elke flow bewaart zijn eigen status persistent en houdt revisies bij, zodat voortgang gateway-herstarts overleeft. Revisietracking maakt conflictdetectie mogelijk wanneer meerdere bronnen tegelijk dezelfde flow proberen vooruit te zetten.
Het flowregister gebruikt SQLite met begrensd onderhoud van de write-ahead-log, inclusief
periodieke checkpoints en checkpoints bij afsluiten, zodat lang draaiende gateways geen
onbegrensde `registry.sqlite-wal`-sidecarbestanden behouden.

## Annuleergedrag

`openclaw tasks flow cancel` zet een blijvende annuleerintentie op de flow. Actieve taken binnen de flow worden geannuleerd en er worden geen nieuwe stappen gestart. De annuleerintentie blijft behouden over herstarts heen, zodat een geannuleerde flow geannuleerd blijft, zelfs als de gateway herstart voordat alle onderliggende taken zijn beëindigd.

## CLI-opdrachten

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Opdracht                          | Beschrijving                                         |
| --------------------------------- | ---------------------------------------------------- |
| `openclaw tasks flow list`        | Toont gevolgde flows met status en synchronisatiemodus |
| `openclaw tasks flow show <id>`   | Inspecteer één flow op flow-id of lookup-sleutel     |
| `openclaw tasks flow cancel <id>` | Annuleer een actieve flow en de actieve taken ervan  |

## Hoe flows zich verhouden tot taken

Flows coördineren taken, ze vervangen ze niet. Een enkele flow kan gedurende zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om afzonderlijke taakrecords te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — het losgekoppelde werkregister dat flows coördineren
- [CLI: taken](/nl/cli/tasks) — CLI-opdrachtreferentie voor `openclaw tasks flow`
- [Overzicht van automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cron-jobs](/nl/automation/cron-jobs) — geplande taken die flows kunnen voeden
