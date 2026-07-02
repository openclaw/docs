---
read_when:
    - Je wilt begrijpen hoe Task Flow zich verhoudt tot achtergrondtaken
    - U komt Task Flow of openclaw tasks flow tegen in releaseopmerkingen of documentatie
    - Je wilt persistente flowstatus inspecteren of beheren
summary: TaskFlow-orkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-07-02T01:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Taakstroom is de floworkestratiesubstraatlaag boven [achtergrondtaken](/nl/automation/tasks). Het beheert duurzame meerstapsflows met hun eigen status, revisietracking en synchronisatiesemantiek, terwijl individuele taken de eenheid van losgekoppeld werk blijven.

## Wanneer je Taakstroom gebruikt

Gebruik Taakstroom wanneer werk meerdere opeenvolgende of vertakkende stappen omvat en je duurzame voortgangstracking nodig hebt bij herstarts van de Gateway. Voor losse achtergrondbewerkingen is een gewone [taak](/nl/automation/tasks) voldoende.

| Scenario                              | Gebruik                    |
| ------------------------------------- | -------------------------- |
| Enkele achtergrondtaak                | Gewone taak                |
| Meerstapspijplijn (A dan B dan C)     | Taakstroom (beheerd)       |
| Extern aangemaakte taken observeren   | Taakstroom (gespiegeld)    |
| Eenmalige herinnering                 | Cron-taak                  |

## Betrouwbaar patroon voor geplande workflows

Behandel voor terugkerende workflows, zoals briefings voor marktinformatie, de planning, orkestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Geplande taken](/nl/automation/cron-jobs) voor timing.
2. Sla eerdere context op in de eigen bestanden, database of toolstatus van de workflow.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattingstokens.
4. Gebruik Taakstroom om de meerstapsrun over onderliggende taken, wachttijden, nieuwe pogingen en Gateway-herstarts heen te volgen.

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

Gebruik `session:<id>` wanneer de taak een bekende chat/sessie moet targeten voor aflevercontext of het veilig vooraf vullen van voorkeuren. Cron voert elke run nog steeds uit in een losgekoppelde sessie, dus zet samenvattingen van vorige runs en vaste workflowstatus in expliciete opslag die de taak kan lezen.

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

- Browserbeschikbaarheid en profielkeuze, bijvoorbeeld `openclaw` voor beheerde status of `user` wanneer een aangemelde Chrome-sessie vereist is. Zie [Browser](/nl/tools/browser).
- API-referenties en quota voor elke bron.
- Netwerkbereikbaarheid voor vereiste eindpunten.
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

Laat de workflow verouderde items weigeren of markeren vóór samenvatting. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet worden gevraagd `sourceUrl`, `retrievedAt` en `asOf` in de uitvoer te behouden. Gebruik [LLM-taak](/nl/tools/llm-task) wanneer je een schemagevalideerde modelstap binnen de workflow nodig hebt.

Verpak voor herbruikbare team- of communityworkflows de CLI, `.lobster`-bestanden en eventuele setupnotities als skill of plugin en publiceer deze via [ClawHub](/clawhub). Houd workflow-specifieke guardrails in dat pakket, tenzij de plugin-API een benodigde generieke capability mist.

## Synchronisatiemodi

### Beheerde modus

Taakstroom beheert de lifecycle end-to-end. Het maakt taken aan als flowstappen, stuurt ze naar voltooiing en werkt de flowstatus automatisch bij.

Voorbeeld: een wekelijkse rapportflow die (1) data verzamelt, (2) het rapport genereert en (3) het aflevert. Taakstroom maakt elke stap aan als achtergrondtaak, wacht op voltooiing en gaat dan door naar de volgende stap.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelde modus

Taakstroom observeert extern aangemaakte taken en houdt de flowstatus gesynchroniseerd zonder eigenaar te worden van het aanmaken van taken. Dit is nuttig wanneer taken afkomstig zijn van cron-taken, CLI-commando's of andere bronnen en je een uniform overzicht van hun voortgang als flow wilt.

Voorbeeld: drie onafhankelijke cron-taken die samen een routine voor "morning ops" vormen. Een gespiegelde flow volgt hun gezamenlijke voortgang zonder te bepalen wanneer of hoe ze worden uitgevoerd.

## Duurzame status en revisietracking

Elke flow bewaart zijn eigen status en houdt revisies bij, zodat voortgang Gateway-herstarts overleeft. Revisietracking maakt conflictdetectie mogelijk wanneer meerdere bronnen dezelfde flow gelijktijdig proberen voort te zetten.
Het flowregister gebruikt SQLite met begrensd write-ahead-log-onderhoud, inclusief
periodieke checkpoints en shutdown-checkpoints, zodat langlopende gateways geen
onbegrensde `registry.sqlite-wal`-sidecarbestanden behouden.

## Annuleringsgedrag

`openclaw tasks flow cancel` stelt een blijvende annuleringsintentie in op de flow. Actieve taken binnen de flow worden geannuleerd en er worden geen nieuwe stappen gestart. De annuleringsintentie blijft behouden na herstarts, dus een geannuleerde flow blijft geannuleerd, zelfs als de Gateway opnieuw start voordat alle onderliggende taken zijn beëindigd.

## CLI-commando's

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commando                          | Beschrijving                                  |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Toont gevolgde flows met status en synchronisatiemodus |
| `openclaw tasks flow show <id>`   | Inspecteer één flow op flow-id of opzoeksleutel |
| `openclaw tasks flow cancel <id>` | Annuleer een lopende flow en de actieve taken ervan |

## Hoe flows zich verhouden tot taken

Flows coördineren taken, ze vervangen ze niet. Eén flow kan gedurende zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om individuele taakrecords te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — het losgekoppelde werklogboek dat flows coördineren
- [CLI: taken](/nl/cli/tasks) — CLI-commandoreferentie voor `openclaw tasks flow`
- [Automatiseringsoverzicht](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cron-taken](/nl/automation/cron-jobs) — geplande taken die flows kunnen voeden
