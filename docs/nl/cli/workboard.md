---
read_when:
    - Je wilt Workboard-kaarten bekijken of maken vanuit de terminal
    - Je wilt Workboard-workeruitvoeringen starten vanuit de CLI
    - Je debugt het gedrag van de Workboard-CLI of slashopdrachten
summary: CLI-referentie voor `openclaw workboard`-kaarten, taaktoewijzing en workeruitvoeringen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-12T08:45:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` is de terminalinterface voor de meegeleverde [Workboard-Plugin](/nl/plugins/workboard). Hiermee kan een operator kaarten weergeven, een kaart maken, één kaart bekijken en de actieve Gateway vragen gereed werk toe te wijzen aan subagent-workerruns.

Schakel de Plugin in voordat u de opdracht gebruikt:

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

De opdracht leest en schrijft dezelfde SQLite-database die eigendom is van de Plugin en die door het dashboard en de Workboard-agenttools wordt gebruikt. Kaart-id's zijn UUID's; opdrachten die een kaart-id accepteren, accepteren ook een ondubbelzinnig id-voorvoegsel (de compacte tekstuitvoer toont de eerste 8 tekens).

Geldige waarden voor `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Geldige waarden voor `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

De tekstuitvoer is compact:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

De kolommen zijn het id-voorvoegsel, de status, de prioriteit, het bord-id, het optionele agent-id en de titel.

| Vlag                 | Doel                                                        |
| -------------------- | ----------------------------------------------------------- |
| `--board <id>`       | Resultaten beperken tot één bordnaamruimte                  |
| `--status <status>`  | Resultaten beperken tot één Workboard-status                |
| `--include-archived` | Gearchiveerde kaarten opnemen in de compacte tekstuitvoer   |
| `--json`             | De volledige kaartenlijst als machineleesbare JSON afdrukken |

De compacte tekstuitvoer verbergt gearchiveerde kaarten standaard, zodat de CLI overeenkomt met `/workboard list`. Geef `--include-archived` door om ze weer te geven. JSON-uitvoer behoudt altijd de volledige kaartenlijst, inclusief gearchiveerde kaarten, voor bestaande automatisering.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Vlag                    | Doel                                           |
| ----------------------- | ---------------------------------------------- |
| `--notes <text>`        | Aanvankelijke kaartnotities                    |
| `--status <status>`     | Aanvankelijke status, standaard `todo`         |
| `--priority <priority>` | Prioriteit, standaard `normal`                 |
| `--agent <id>`          | De kaart aan een agent- of eigenaar-id toewijzen |
| `--board <id>`          | De kaart in een bordnaamruimte opslaan         |
| `--labels <items>`      | Door komma's gescheiden labels                 |
| `--json`                | De gemaakte kaart als machineleesbare JSON afdrukken |

`create` schrijft rechtstreeks naar de SQLite-status van Workboard. De kaart is onmiddellijk zichtbaar op het Workboard-tabblad in de Control UI en voor Workboard-tools.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

De tekstuitvoer toont de compacte kaartregel en notities. JSON-uitvoer retourneert de volledige kaartrecord, inclusief uitvoeringsmetadata, pogingen, opmerkingen, koppelingen, bewijs, artefacten, workerlogboeken, protocolstatus, diagnostiek en automatiseringsmetadata.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` roept eerst de RPC-methode `workboard.cards.dispatch` van de actieve Gateway aan. Deze gebruikt dezelfde subagent-runtime als de dispatchactie van het dashboard, zodat gereedstaande kaarten workerruns met taakregistratie en gekoppelde sessiesleutels worden. Kaarten met een toegewezen agent gebruiken agentspecifieke subagent-sessiesleutels; niet-toegewezen kaarten behouden een niet-gescopeerde subagent-sleutel, zodat de geconfigureerde standaardagent van de Gateway behouden blijft.

De dispatchlus:

1. Bevordert kinderen waarvan de afhankelijkheden gereed zijn naar `ready`.
2. Blokkeert verlopen claims of workerruns waarvan de time-out is verstreken.
3. Registreert dispatchmetadata op gereedstaande kaarten.
4. Selecteert een kleine groep niet-geclaimde gereedstaande kaarten.
5. Claimt elke geselecteerde kaart voor de dispatcher of toegewezen agent.
6. Start een subagent-workerrun met begrensde kaartcontext en het claimtoken van de kaart.
7. Slaat het workerrun-id, de sessiesleutel, de taakkoppeling wanneer het taaktboek van de Gateway deze meldt, de uitvoeringsstatus en het workerlogboek op de kaart op.

De selectie is behoudend: één dispatch start standaard maximaal drie workers, slaat gearchiveerde of reeds geclaimde kaarten over en start in één doorgang slechts één kaart per eigenaar of agent. Kaarten die al eigendom zijn van actief uitgevoerd of beoordeeld werk, blijven staan voor een latere dispatch.

Als het starten van een worker mislukt nadat een kaart is geclaimd, blokkeert Workboard die kaart, wist het de claim en registreert het de fout in de uitvoerings- en workerlogmetadata van de kaart. Zo blijven mislukte starts zichtbaar in plaats van dat de kaart ongemerkt naar de wachtrij terugkeert.

Als geen expliciet Gateway-doel is opgegeven en de lokale Gateway niet beschikbaar is of de Workboard-dispatchmethode nog niet aanbiedt, valt de CLI terug op dispatch van uitsluitend gegevens voor de lokale Workboard-status. Dispatch van uitsluitend gegevens kan nog steeds afhankelijkheden bevorderen, verouderde claims opschonen en workerruns met een verlopen time-out blokkeren, maar start geen workers. Authenticatie-, machtigings- en validatiefouten, en fouten voor een expliciet `--url`- of `--token`-doel, worden rechtstreeks gemeld in plaats van de terugval te activeren.

De tekstuitvoer meldt gestarte workers:

```text
dispatch complete: started=2 failures=0
```

De terugvaluitvoer is expliciet:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON-uitvoer bevat het dispatchresultaat. Door de Gateway ondersteunde dispatch kan `started` en `startFailures` bevatten; de terugval naar uitsluitend gegevens bevat `gatewayUnavailable: true`. Claimtokens worden uit de JSON-uitvoer van kaarten verwijderd.

In het dashboard wordt hetzelfde dispatchresultaat als een korte samenvatting weergegeven, zodat een operator kan zien hoeveel kaarten zijn gestart, bevorderd, geblokkeerd, opnieuw geclaimd of mislukt zonder de kaartdetails te openen.

## Gelijkwaardigheid van slash-opdrachten

Kanalen die opdrachten ondersteunen, kunnen de overeenkomstige slash-opdracht gebruiken:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Dispatch via slash-opdrachten gebruikt ook de subagent-runtime van de Gateway en volgt daarom hetzelfde gedrag voor claims, het starten van workers en fouten als het dashboard en het Gateway-pad van de CLI.

`/workboard list` en `/workboard show` zijn leesopdrachten voor geautoriseerde afzenders van opdrachten. `/workboard create` en `/workboard dispatch` wijzigen de bordstatus en vereisen de eigenaarstatus op chatinterfaces of een Gateway-client met `operator.write` of `operator.admin`.

## Machtigingen

Het CLI-dispatchpad roept Gateway-RPC aan met de bereiken `operator.read` en `operator.write`. Een alleen-lezen Gateway-token kan Workboard-gegevens via leesmethoden bekijken, maar kan geen kaarten maken of workers dispatchen.

Lokale opdrachten `list`, `create` en `show` werken op de lokale OpenClaw-statusmap die door het huidige profiel wordt gebruikt. Gebruik `--dev` of `--profile <name>` bij de `openclaw`-opdracht op het hoogste niveau wanneer u een andere statush hoofdmap nodig hebt.

## Problemen oplossen

### Er verschijnen geen kaarten

Controleer of de Plugin is ingeschakeld voor hetzelfde profiel en dezelfde statushoofdmap:

```bash
openclaw plugins inspect workboard --runtime --json
```

Als het dashboard kaarten toont maar de CLI niet, controleer dan of beide opdrachten dezelfde instelling voor `--dev` of `--profile` gebruiken.

### Dispatch meldt uitsluitend gegevens

Start of herstart de Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Probeer daarna `openclaw workboard dispatch` opnieuw. De terugval naar uitsluitend gegevens is nuttig voor het opschonen van lokale status, maar voor workerruns is een actieve Gateway nodig.

### Dispatch start niets

Controleer of er minstens één `ready`-kaart zonder actieve claim is:

```bash
openclaw workboard list --status ready
```

Kaarten kunnen ook worden overgeslagen wanneer dezelfde eigenaar al uitgevoerd of beoordeeld werk heeft. Verplaats voltooid werk naar `done`, geef verouderde claims vrij via de Workboard-tools of voer dispatch opnieuw uit nadat de actieve worker is voltooid.

## Gerelateerd

- [Workboard-Plugin](/nl/plugins/workboard)
- [CLI-referentie](/nl/cli)
- [Slash-opdrachten](/nl/tools/slash-commands)
- [Control UI](/nl/web/control-ui)
