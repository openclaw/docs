---
read_when:
    - Je wilt begrijpen hoe Task Flow zich verhoudt tot achtergrondtaken
    - Je komt Task Flow of openclaw tasks flow tegen in releaseopmerkingen of documentatie
    - U wilt duurzame flowstatus inspecteren of beheren
summary: Task Flow-orkestratielaag boven achtergrondtaken
title: Taakstroom
x-i18n:
    generated_at: "2026-07-12T08:34:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow is de orkestratielaag boven [achtergrondtaken](/nl/automation/tasks). Een flow is een duurzame registratie van werk met meerdere stappen, met een eigen status, JSON-toestand, revisieteller en gekoppelde taakregistraties. Flows blijven behouden wanneer de Gateway opnieuw wordt gestart; afzonderlijke taken blijven de eenheid voor losgekoppeld werk.

## Wanneer Task Flow gebruiken

| Scenario                                      | Gebruiken                                      |
| --------------------------------------------- | ---------------------------------------------- |
| Eén achtergrondtaak                           | Gewone taak                                    |
| Meerfasige pijplijn aangestuurd door plugincode | Task Flow (beheerd)                          |
| Losgekoppelde ACP- of subagentstart            | Task Flow (gespiegeld, automatisch aangemaakt) |
| Eenmalige herinnering                         | Cron-taak                                      |

## Synchronisatiemodi

### Beheerde modus

Een beheerde flow heeft een controller: plugincode die de flow via de Task Flow-API van de pluginruntime aanmaakt met een doel en een verplichte controller-id, en deze vervolgens expliciet aanstuurt.

- Elke stap wordt uitgevoerd als een achtergrondtaak die onder de flow wordt aangemaakt; de eigenaarsleutel en oorsprong van de aanvrager van de flow worden overgenomen door onderliggende taken.
- De controller laat de flow overgaan tussen `running`, `waiting` en eindstatussen, en slaat willekeurige JSON-staptoestand op in de flowregistratie.
- Elke wijziging geeft de verwachte revisie van de flow door. Een verouderde schrijfactie wordt afgewezen als revisieconflict in plaats van een nieuwere toestand te overschrijven.
- Zodra annulering is aangevraagd, worden nieuwe onderliggende taken geweigerd en wordt de flow afgerond als `cancelled` wanneer geen onderliggende taak meer actief is.

Voorbeeld: een wekelijkse rapportflow die (1) gegevens verzamelt, (2) het rapport genereert en (3) het aflevert, met één achtergrondtaak per stap:

```
Flow: weekly-report
  Stap 1: gather-data     → taak aangemaakt → geslaagd
  Stap 2: generate-report → taak aangemaakt → geslaagd
  Stap 3: deliver         → taak aangemaakt → actief
```

### Gespiegelde modus

OpenClaw maakt automatisch een gespiegelde flow met één taak aan wanneer een losgekoppelde ACP- of subagentuitvoering start (sessiegebonden taken met afleverbare voltooiing). De flowregistratie weerspiegelt de ene onderliggende taak — status, doel en timing — zodat losgekoppelde starts zonder controller een stabiele flowreferentie krijgen voor status- en herhaalfuncties. Gespiegelde flows tonen in de CLI de synchronisatiemodus `task_mirrored`.

## Flowstatussen

| Status      | Betekenis                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| `queued`    | Aangemaakt, maar de voortgang is nog niet begonnen                               |
| `running`   | De flow maakt actief voortgang                                                   |
| `waiting`   | De beheerde flow wacht op wachtmetagegevens (timer, externe gebeurtenis)         |
| `blocked`   | Een stap is voltooid zonder bruikbaar resultaat; `blockedTaskId`/samenvatting geeft aan welke |
| `succeeded` | Met succes voltooid                                                              |
| `failed`    | Voltooid met een fout                                                            |
| `cancelled` | Annulering aangevraagd en alle onderliggende taken zijn afgehandeld               |
| `lost`      | De flow is zijn gezaghebbende onderliggende toestand kwijtgeraakt                 |

## Duurzame toestand en revisiebeheer

Flowregistraties blijven samen met taakregistraties bewaard in de gedeelde SQLite-toestandsdatabase (`~/.openclaw/state/openclaw.sqlite`, tabel `flow_runs`), zodat de voortgang behouden blijft wanneer de Gateway opnieuw wordt gestart. Elke schrijfactie verhoogt de `revision` van de flow; gelijktijdige schrijvers die een verouderde verwachte revisie doorgeven, krijgen een conflict en moeten de gegevens opnieuw lezen. De groei van WAL wordt begrensd door automatische SQLite-checkpoints plus periodieke passieve checkpoints, met truncate-checkpoints bij het afsluiten. De verouderde sidecar `flows/registry.sqlite` uit oudere installaties wordt geïmporteerd door `openclaw doctor`.

## Annuleringsgedrag

`openclaw tasks flow cancel` stelt een blijvend annuleringsverzoek in voor de flow, annuleert de actieve onderliggende taken en weigert nieuwe beheerde onderliggende taken. Zodra geen onderliggende taak meer actief is, wordt de flow afgerond als `cancelled` — onmiddellijk, of via de onderhoudsronde als het afhandelen van onderliggende taken langer duurt. Het verzoek wordt bewaard, zodat een geannuleerde flow geannuleerd blijft, zelfs als de Gateway opnieuw wordt gestart voordat alle onderliggende taken zijn beëindigd.

## CLI-opdrachten

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Opdracht                          | Beschrijving                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `openclaw tasks flow list`       | Bijgehouden flows met synchronisatiemodus, status, revisie, controller en taakaantallen |
| `openclaw tasks flow show <id>`  | Inspecteer één flow op flow-id of eigenaarsleutel, inclusief gekoppelde taken   |
| `openclaw tasks flow cancel <id>` | Annuleer een actieve flow en de actieve taken ervan                            |

Flows worden ook behandeld door `openclaw tasks audit` (bevindingen voor verouderde of defecte flows) en `openclaw tasks maintenance` (rondt vastgelopen annuleringen af en verwijdert flows met een eindstatus na 7 dagen).

## Patroon voor betrouwbare geplande workflows

Behandel bij terugkerende workflows, zoals briefings over marktinformatie, de planning, orkestratie en betrouwbaarheidscontroles als afzonderlijke lagen:

1. Gebruik [Geplande taken](/nl/automation/cron-jobs) voor de timing.
2. Gebruik een persistente Cron-sessie wanneer de workflow moet voortbouwen op eerdere context.
3. Gebruik [Lobster](/nl/tools/lobster) voor deterministische stappen, goedkeuringspoorten en hervattingstokens.
4. Gebruik Task Flow om de meerfasige uitvoering te volgen over onderliggende taken, wachttijden, herhalingen en herstarts van de Gateway heen.

Voorbeeld van een Cron-configuratie:

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

Gebruik `--session session:<id>` in plaats van `isolated` wanneer de terugkerende workflow doelbewust geschiedenis, samenvattingen van eerdere uitvoeringen of vaste context nodig heeft. Gebruik `isolated` wanneer elke uitvoering opnieuw moet beginnen en alle vereiste toestand expliciet in de workflow is vastgelegd.

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

Aanbevolen voorafgaande controles:

- Beschikbaarheid van de browser en profielkeuze, bijvoorbeeld `openclaw` voor beheerde toestand of `user` wanneer een aangemelde Chrome-sessie vereist is. Zie [Browser](/nl/tools/browser).
- API-aanmeldgegevens en quota voor elke bron.
- Netwerkbereikbaarheid van vereiste eindpunten.
- Vereiste hulpmiddelen die voor de agent zijn ingeschakeld, zoals `lobster`, `browser` en `llm-task`.
- Een foutbestemming die voor Cron is geconfigureerd, zodat fouten tijdens voorafgaande controles zichtbaar zijn. Zie [Geplande taken](/nl/automation/cron-jobs#delivery-and-output).

Aanbevolen herkomstvelden voor elk verzameld item:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Laat de workflow verouderde items vóór de samenvatting afwijzen of als verouderd markeren. De LLM-stap mag alleen gestructureerde JSON ontvangen en moet de opdracht krijgen om `sourceUrl`, `retrievedAt` en `asOf` in de uitvoer te behouden. Gebruik [LLM-taak](/nl/tools/llm-task) wanneer u binnen de workflow een modelstap met schemavalidatie nodig hebt.

Verpak voor herbruikbare team- of communityworkflows de CLI, `.lobster`-bestanden en eventuele installatie-instructies als een skill of plugin en publiceer deze via [ClawHub](/clawhub). Bewaar workflowspecifieke beveiligingsregels in dat pakket, tenzij in de plugin-API een benodigde generieke mogelijkheid ontbreekt.

## Hoe flows zich tot taken verhouden

Flows coördineren taken; ze vervangen ze niet. Eén flow kan gedurende zijn levensduur meerdere achtergrondtaken aansturen. Gebruik `openclaw tasks` om afzonderlijke taakregistraties te inspecteren en `openclaw tasks flow` om de orkestrerende flow te inspecteren.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — het register voor losgekoppeld werk dat door flows wordt gecoördineerd
- [CLI: taken](/nl/cli/tasks) — CLI-opdrachtenreferentie voor `openclaw tasks flow`
- [Overzicht van automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Cron-taken](/nl/automation/cron-jobs) — geplande taken die flows van invoer kunnen voorzien
