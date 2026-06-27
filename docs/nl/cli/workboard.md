---
read_when:
    - Je wilt Workboard-kaarten vanuit de terminal bekijken of maken
    - U wilt Workboard-worker-runs vanuit de CLI dispatchen
    - Je debugt gedrag van de Workboard-CLI of slash-command
summary: CLI-referentie voor `openclaw workboard`-kaarten, dispatch en worker-uitvoeringen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-06-27T17:24:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` is het terminaloppervlak voor de gebundelde
[Workboard Plugin](/nl/plugins/workboard). Hiermee kan een operator kaarten weergeven, een
kaart maken, één kaart inspecteren en de draaiende Gateway vragen om klaarstaand werk naar
subagent-worker-runs te sturen.

Schakel de Plugin in voordat je de opdracht gebruikt:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Gebruik

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

De opdracht leest en schrijft dezelfde Plugin-beheerde SQLite-database die door het
dashboard en de Workboard-agenttools wordt gebruikt. Kaart-id's kunnen worden doorgegeven als volledige id of als
eenduidig voorvoegsel wanneer een opdracht een kaart-id accepteert.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Tekstuitvoer is compact:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Kolommen zijn id-voorvoegsel, status, prioriteit, board-id, optionele agent-id en titel.

Vlaggen:

| Vlag                 | Doel                                          |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Beperk resultaten tot één board-naamruimte    |
| `--status <status>`  | Beperk resultaten tot één Workboard-status    |
| `--include-archived` | Neem gearchiveerde kaarten op in compacte tekstuitvoer |
| `--json`             | Druk de volledige kaartenlijst af als machine-JSON |

Compacte tekstuitvoer verbergt gearchiveerde kaarten standaard, zodat de CLI overeenkomt met de
opdracht `/workboard list`. Geef `--include-archived` mee om ze weer te geven. JSON-uitvoer
behoudt de volledige kaartenlijst, inclusief gearchiveerde kaarten, voor bestaande automatisering.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Vlaggen:

| Vlag                    | Doel                                      |
| ----------------------- | ----------------------------------------- |
| `--notes <text>`        | Initiële kaartnotities                    |
| `--status <status>`     | Initiële status, standaard `todo`         |
| `--priority <priority>` | Prioriteit, standaard `normal`            |
| `--agent <id>`          | Wijs de kaart toe aan een agent- of eigenaar-id |
| `--board <id>`          | Sla de kaart op in een board-naamruimte   |
| `--labels <items>`      | Door komma's gescheiden labels            |
| `--json`                | Druk de gemaakte kaart af als machine-JSON |

`create` schrijft rechtstreeks naar de Workboard SQLite-status. De kaart is direct
zichtbaar in het Workboard-tabblad van de Control UI en voor Workboard-tools.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Tekstuitvoer drukt de compacte kaartregel en notities af. JSON-uitvoer retourneert de volledige
kaartrecord, inclusief uitvoeringsmetadata, pogingen, opmerkingen, links, bewijs,
artefacten, worker-logs, protocolstatus, diagnostiek en automatiseringsmetadata.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` roept eerst de RPC-methode
`workboard.cards.dispatch` van de draaiende Gateway aan. Dat pad gebruikt dezelfde subagent-runtime als de
dispatch-actie in het dashboard, zodat ready-kaarten taakgevolgde worker-runs worden met
gekoppelde sessiesleutels. Kaarten met een toegewezen agent gebruiken agent-gebonden subagent-
sessiesleutels; niet-toegewezen kaarten behouden een niet-gebonden subagent-sleutel zodat de
geconfigureerde standaardagent van de Gateway behouden blijft.

De dispatchlus:

1. Promoveert dependency-ready kinderen naar `ready`.
2. Blokkeert verlopen claims of worker-runs met timeout.
3. Registreert dispatchmetadata op ready-kaarten.
4. Selecteert een kleine batch niet-geclaimde ready-kaarten.
5. Claimt elke geselecteerde kaart voor de dispatcher of toegewezen agent.
6. Start een subagent-worker-run met begrensde kaartcontext en het kaartclaim-
   token.
7. Slaat de worker-run-id, sessiesleutel, taakkoppeling wanneer het Gateway-taakregister
   die rapporteert, uitvoeringsstatus en worker-log op de kaart op.

Selectie is bewust conservatief. Eén dispatch start standaard maximaal drie
workers, slaat gearchiveerde of al geclaimde kaarten over en start slechts één
kaart per eigenaar of agent in één ronde. Kaarten die al eigendom zijn van actief lopend
of reviewwerk worden bewaard voor een latere dispatch.

Als het starten van een worker mislukt nadat een kaart is geclaimd, blokkeert Workboard die kaart,
wist de claim en registreert de fout in de uitvoerings- en worker-logmetadata
van de kaart. Zo blijven mislukte starts zichtbaar in plaats van de
kaart stilzwijgend terug te zetten in de wachtrij.

Als er geen expliciet Gateway-doel is opgegeven en de lokale Gateway niet beschikbaar is
of de Workboard-dispatchmethode nog niet blootstelt, valt de CLI terug op
data-only dispatch tegen lokale Workboard-status. Data-only dispatch kan nog steeds
dependencies promoveren, verouderde claims opschonen en runs met timeout blokkeren, maar start geen
workers. Authenticatie-, machtigings- en validatiefouten, en fouten voor een
expliciet `--url`- of `--token`-doel, worden rechtstreeks gerapporteerd.

Tekstuitvoer rapporteert worker-starts:

```text
dispatch complete: started=2 failures=0
```

Fallback-uitvoer is expliciet:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON-uitvoer bevat het dispatchresultaat. Gateway-ondersteunde dispatch kan
`started` en `startFailures` bevatten; data-only fallback bevat
`gatewayUnavailable: true`. Claimtokens worden geredigeerd uit kaart-JSON-uitvoer.

In het dashboard wordt hetzelfde dispatchresultaat getoond als een korte samenvatting, zodat een
operator kan zien hoeveel kaarten zijn gestart, gepromoveerd, geblokkeerd, teruggeclaimd of
mislukt zonder kaartdetails te openen.

## Pariteit van slash-commando's

Kanalen met opdrachtondersteuning kunnen het bijbehorende slash-commando gebruiken:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Slash-command dispatch gebruikt ook de Gateway-subagent-runtime, dus het volgt hetzelfde
claim-, worker-start- en foutgedrag als het dashboard en het Gateway-pad van de CLI.

`/workboard list` en `/workboard show` zijn leesopdrachten voor geautoriseerde opdrachtzenders.
`/workboard create` en `/workboard dispatch` wijzigen boardstatus en
vereisen eigenaarstatus op chatoppervlakken of een Gateway-client met `operator.write`
of `operator.admin`.

## Machtigingen

Het CLI-dispatchpad roept Gateway RPC aan met scopes `operator.read` en
`operator.write`. Een alleen-lezen Gateway-token kan Workboard-gegevens inspecteren
via leesmethoden, maar kan geen kaarten maken of workers dispatchen.

Lokale opdrachten `list`, `create` en `show` werken op de lokale OpenClaw-statusmap
die door het huidige profiel wordt gebruikt. Gebruik `--dev` of `--profile <name>` op de
top-level opdracht `openclaw` wanneer je een andere statusroot nodig hebt.

## Problemen oplossen

### Er verschijnen geen kaarten

Controleer of de Plugin is ingeschakeld voor hetzelfde profiel en dezelfde statusroot:

```bash
openclaw plugins inspect workboard --runtime --json
```

Als het dashboard kaarten toont maar de CLI niet, controleer dan of beide opdrachten
dezelfde instelling voor `--dev` of `--profile` gebruiken.

### Dispatch meldt Data-Only

Start of herstart de Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Probeer daarna `openclaw workboard dispatch` opnieuw. Data-only fallback is nuttig voor lokaal
opschonen van status, maar worker-runs hebben een live Gateway nodig.

### Dispatch start niets

Controleer of er minstens één `ready`-kaart zonder actieve claim is:

```bash
openclaw workboard list --status ready
```

Kaarten kunnen ook worden overgeslagen wanneer dezelfde eigenaar al lopend of review-
werk heeft. Verplaats voltooid werk naar `done`, geef verouderde claims vrij via de Workboard-
tools, of voer dispatch opnieuw uit nadat de actieve worker klaar is.

## Gerelateerd

- [Workboard Plugin](/nl/plugins/workboard)
- [CLI-referentie](/nl/cli)
- [Slash-commando's](/nl/tools/slash-commands)
- [Control UI](/nl/web/control-ui)
