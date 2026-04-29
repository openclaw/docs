---
read_when:
    - Je wilt begrijpen hoe taakstroom zich verhoudt tot achtergrondtaken
    - Je komt Task Flow of openclaw-takenstroom tegen in release-opmerkingen of documentatie
    - Je wilt persistente flowstatus inspecteren of beheren
summary: Task Flow-floworkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-04-29T22:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow is het flow-orchestratiesubstraat dat boven [achtergrondtaken](/nl/automation/tasks) zit. Het beheert duurzame flows met meerdere stappen met hun eigen status, revisietracking en synchronisatiesemantiek, terwijl afzonderlijke taken de eenheid van losgekoppeld werk blijven.

## Wanneer Task Flow gebruiken

Gebruik Task Flow wanneer werk meerdere opeenvolgende of vertakkende stappen omvat en je duurzame voortgangstracking nodig hebt over Gateway-herstarts heen. Voor afzonderlijke achtergrondbewerkingen is een gewone [taak](/nl/automation/tasks) voldoende.

| Scenario                              | Gebruik               |
| ------------------------------------- | --------------------- |
| Afzonderlijke achtergrondtaak         | Gewone taak           |
| Pipeline met meerdere stappen (A dan B dan C) | Task Flow (beheerd)  |
| Extern aangemaakte taken observeren   | Task Flow (gespiegeld) |
| Eenmalige herinnering                 | Cron-taak             |

## Betrouwbaar gepland workflowpatroon

Behandel voor terugkerende workflows, zoals briefings over marktinzichten, de planning, orkestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Scheduled Tasks](/nl/automation/cron-jobs) voor timing.
2. Gebruik een permanente cron-sessie wanneer de workflow moet voortbouwen op eerdere context.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattingstokens.
4. Gebruik Task Flow om de run met meerdere stappen te volgen over child tasks, wachttijden, nieuwe pogingen en Gateway-herstarts heen.

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

- Beschikbaarheid van de browser en profielkeuze, bijvoorbeeld `openclaw` voor beheerde status of `user` wanneer een ingelogde Chrome-sessie vereist is. Zie [Browser](/nl/tools/browser).
- API-referenties en quota voor elke bron.
- Netwerkbereikbaarheid voor vereiste endpoints.
- Vereiste tools ingeschakeld voor de agent, zoals `lobster`, `browser` en `llm-task`.
- Faalbestemming geconfigureerd voor cron, zodat preflight-fouten zichtbaar zijn. Zie [Scheduled Tasks](/nl/automation/cron-jobs#delivery-and-output).

Aanbevolen velden voor gegevensherkomst voor elk verzameld item:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Laat de workflow verouderde items weigeren of markeren vóór de samenvatting. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet worden gevraagd om `sourceUrl`, `retrievedAt` en `asOf` in de uitvoer te behouden. Gebruik [LLM Task](/nl/tools/llm-task) wanneer je binnen de workflow een modelstap met schemavalidatie nodig hebt.

Voor herbruikbare team- of communityworkflows verpak je de CLI, `.lobster`-bestanden en eventuele setupnotities als skill of Plugin en publiceer je die via [ClawHub](/nl/tools/clawhub). Houd workflow-specifieke guardrails in dat pakket, tenzij de plugin-API een benodigde generieke mogelijkheid mist.

## Synchronisatiemodi

### Beheerde modus

Task Flow beheert de levenscyclus van begin tot eind. Het maakt taken aan als flowstappen, stuurt ze naar voltooiing en werkt de flowstatus automatisch bij.

Voorbeeld: een wekelijkse rapportflow die (1) gegevens verzamelt, (2) het rapport genereert en (3) het bezorgt. Task Flow maakt elke stap aan als achtergrondtaak, wacht op voltooiing en gaat daarna door naar de volgende stap.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelde modus

Task Flow observeert extern aangemaakte taken en houdt de flowstatus gesynchroniseerd zonder eigenaar te worden van het aanmaken van taken. Dit is nuttig wanneer taken afkomstig zijn van cron-taken, CLI-opdrachten of andere bronnen en je één uniforme weergave van hun voortgang als flow wilt.

Voorbeeld: drie onafhankelijke cron-taken die samen een "morning ops"-routine vormen. Een gespiegelde flow volgt hun gezamenlijke voortgang zonder te bepalen wanneer of hoe ze worden uitgevoerd.

## Duurzame status en revisietracking

Elke flow bewaart zijn eigen status en volgt revisies, zodat voortgang Gateway-herstarts overleeft. Revisietracking maakt conflictdetectie mogelijk wanneer meerdere bronnen dezelfde flow gelijktijdig proberen vooruit te brengen.
Het flowregister gebruikt SQLite met begrensd write-ahead-log-onderhoud, inclusief periodieke checkpoints en checkpoints bij afsluiten, zodat langlopende Gateways geen onbeperkte `registry.sqlite-wal`-sidecarbestanden behouden.

## Annuleringsgedrag

`openclaw tasks flow cancel` stelt een blijvende annuleringsintentie in op de flow. Actieve taken binnen de flow worden geannuleerd en er worden geen nieuwe stappen gestart. De annuleringsintentie blijft bestaan over herstarts heen, zodat een geannuleerde flow geannuleerd blijft, zelfs als de Gateway herstart voordat alle child tasks zijn beëindigd.

## CLI-opdrachten

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Opdracht                          | Beschrijving                                  |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Toont gevolgde flows met status en synchronisatiemodus |
| `openclaw tasks flow show <id>`   | Inspecteer één flow op flow-ID of opzoeksleutel |
| `openclaw tasks flow cancel <id>` | Annuleer een draaiende flow en de actieve taken ervan |

## Hoe flows zich verhouden tot taken

Flows coördineren taken, ze vervangen ze niet. Eén flow kan gedurende zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om afzonderlijke taakrecords te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Background Tasks](/nl/automation/tasks) — het losgekoppelde werkregister dat flows coördineren
- [CLI: tasks](/nl/cli/tasks) — CLI-opdrachtreferentie voor `openclaw tasks flow`
- [Automation Overview](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cron Jobs](/nl/automation/cron-jobs) — geplande taken die flows kunnen voeden
