---
read_when:
    - U wilt begrijpen hoe TaskFlow zich verhoudt tot achtergrondtaken
    - Je komt TaskFlow of OpenClaw-takenstroom tegen in releaseopmerkingen of documentatie
    - Je wilt duurzame flowstatus inspecteren of beheren
summary: Task Flow-orkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-07-02T08:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow is het substraat voor floworkestratie dat boven [achtergrondtaken](/nl/automation/tasks) zit. Het beheert duurzame flows met meerdere stappen, elk met hun eigen status, revisietracking en synchronisatiesemantiek, terwijl afzonderlijke taken de eenheid van losgekoppeld werk blijven.

## Wanneer Task Flow gebruiken

Gebruik Task Flow wanneer werk meerdere opeenvolgende of vertakkende stappen omvat en je duurzame voortgangstracking over Gateway-herstarts heen nodig hebt. Voor enkelvoudige achtergrondbewerkingen volstaat een gewone [taak](/nl/automation/tasks).

| Scenario                              | Gebruik              |
| ------------------------------------- | -------------------- |
| Enkele achtergrondtaak                | Gewone taak          |
| Pijplijn met meerdere stappen (A dan B dan C) | Task Flow (beheerd)  |
| Extern gemaakte taken observeren      | Task Flow (gespiegeld) |
| Eenmalige herinnering                 | Cron-taak            |

## Betrouwbaar patroon voor geplande workflows

Voor terugkerende workflows zoals briefings voor marktinformatie behandel je de planning, orkestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Geplande taken](/nl/automation/cron-jobs) voor timing.
2. Gebruik een persistente cron-sessie wanneer de workflow moet voortbouwen op eerdere context.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattokens.
4. Gebruik Task Flow om de uitvoering met meerdere stappen te volgen over onderliggende taken, wachttijden, pogingen opnieuw en Gateway-herstarts heen.

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
- Netwerkbereikbaarheid voor vereiste eindpunten.
- Vereiste tools ingeschakeld voor de agent, zoals `lobster`, `browser` en `llm-task`.
- Foutbestemming geconfigureerd voor Cron zodat preflight-fouten zichtbaar zijn. Zie [Geplande taken](/nl/automation/cron-jobs#delivery-and-output).

Aanbevolen herkomstvelden voor gegevens voor elk verzameld item:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Laat de workflow verouderde items afwijzen of markeren vóór de samenvatting. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet worden gevraagd om `sourceUrl`, `retrievedAt` en `asOf` in de uitvoer te behouden. Gebruik [LLM-taak](/nl/tools/llm-task) wanneer je binnen de workflow een modelstap met schemavalidatie nodig hebt.

Voor herbruikbare team- of communityworkflows verpak je de CLI, `.lobster`-bestanden en eventuele setupnotities als een skill of plugin en publiceer je die via [ClawHub](/clawhub). Houd workflow-specifieke vangrails in dat pakket, tenzij de plugin-API een benodigde generieke mogelijkheid mist.

## Synchronisatiemodi

### Beheerde modus

Task Flow is eigenaar van de levenscyclus van begin tot eind. Het maakt taken als flowstappen, brengt ze tot voltooiing en zet de flowstatus automatisch voort.

Voorbeeld: een wekelijkse rapportflow die (1) gegevens verzamelt, (2) het rapport genereert en (3) het aflevert. Task Flow maakt elke stap als achtergrondtaak, wacht op voltooiing en gaat daarna naar de volgende stap.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelde modus

Task Flow observeert extern gemaakte taken en houdt de flowstatus gesynchroniseerd zonder eigenaar te worden van het maken van taken. Dit is nuttig wanneer taken afkomstig zijn van Cron-taken, CLI-opdrachten of andere bronnen en je een eenduidige weergave van hun voortgang als flow wilt.

Voorbeeld: drie onafhankelijke Cron-taken die samen een routine voor "morning ops" vormen. Een gespiegelde flow volgt hun gezamenlijke voortgang zonder te bepalen wanneer of hoe ze worden uitgevoerd.

## Duurzame status en revisietracking

Elke flow bewaart zijn eigen status persistent en volgt revisies zodat voortgang Gateway-herstarts overleeft. Revisietracking maakt conflictdetectie mogelijk wanneer meerdere bronnen dezelfde flow gelijktijdig proberen voort te zetten.
Het flowregister gebruikt SQLite met begrensd write-ahead-log-onderhoud, inclusief
periodieke checkpoints en checkpoints bij afsluiten, zodat langlopende Gateways geen
onbegrensde `registry.sqlite-wal`-sidecarbestanden behouden.

## Annuleringsgedrag

`openclaw tasks flow cancel` stelt een blijvende annuleringsintentie in op de flow. Actieve taken binnen de flow worden geannuleerd en er worden geen nieuwe stappen gestart. De annuleringsintentie blijft bestaan over herstarts heen, zodat een geannuleerde flow geannuleerd blijft, zelfs als de Gateway opnieuw start voordat alle onderliggende taken zijn beëindigd.

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
| `openclaw tasks flow show <id>`   | Inspecteer één flow op flow-id of opzoeksleutel |
| `openclaw tasks flow cancel <id>` | Annuleer een actieve flow en de actieve taken ervan |

## Hoe flows zich verhouden tot taken

Flows coördineren taken, ze vervangen ze niet. Eén flow kan tijdens zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om afzonderlijke taakrecords te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — het losgekoppelde werkregister dat flows coördineren
- [CLI: taken](/nl/cli/tasks) — CLI-opdrachtreferentie voor `openclaw tasks flow`
- [Automatiseringsoverzicht](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cron-taken](/nl/automation/cron-jobs) — geplande taken die flows kunnen voeden
