---
read_when:
    - Je wilt Workboard-kaarten bekijken of maken vanuit de terminal
    - Je wilt Workboard-workeruitvoeringen starten vanuit de CLI
    - Je debugt het gedrag van de Workboard-CLI of slash-opdrachten
summary: CLI-referentie voor `openclaw workboard`-kaarten, dispatch en workeruitvoeringen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-16T15:26:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` is de terminalinterface voor de meegeleverde [Workboard-plugin](/nl/plugins/workboard). Hiermee kan een operator kaarten weergeven, een kaart maken, één kaart bekijken en de actieve Gateway vragen om gereed werk toe te wijzen aan subagent-workerruns.

Schakel de plugin in voordat je de opdracht gebruikt:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Gebruik

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

De opdracht leest en schrijft dezelfde SQLite-database die eigendom is van de plugin en die door het dashboard en de Workboard-agenttools wordt gebruikt. Kaart-id's zijn UUID's; opdrachten die een kaart-id accepteren, accepteren ook een eenduidig id-voorvoegsel (de compacte tekstuitvoer toont de eerste 8 tekens).

Geldige waarden voor `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Geldige waarden voor `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

De tekstuitvoer is compact:

```text
7f4a2c10  ready     high    default agent-a  Verouderde worker-heartbeat herstellen
```

De kolommen zijn het id-voorvoegsel, de status, de prioriteit, het bord-id, het optionele agent-id en de titel.

| Vlag                 | Doel                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Resultaten beperken tot één bordnaamruimte          |
| `--status <status>`  | Resultaten beperken tot één Workboard-status         |
| `--include-archived` | Gearchiveerde kaarten opnemen in compacte tekstuitvoer |
| `--json`             | De volledige kaartenlijst als machine-JSON weergeven      |

Compacte tekstuitvoer verbergt gearchiveerde kaarten standaard, zodat de CLI overeenkomt met `/workboard list`. Geef `--include-archived` door om ze weer te geven. JSON-uitvoer behoudt voor bestaande automatisering altijd de volledige kaartenlijst, inclusief gearchiveerde kaarten.

## `create`

```bash
openclaw workboard create "Verouderde worker-heartbeat herstellen" --priority high --labels bug,workboard
openclaw workboard create "Workboard-documentatie schrijven" --status ready --agent docs-agent --board docs --notes "Behandel de CLI, slash-opdracht, toewijzing en SQLite-status."
```

| Vlag                    | Doel                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Initiële kaartnotities                      |
| `--status <status>`     | Initiële status, standaard `todo`          |
| `--priority <priority>` | Prioriteit, standaard `normal`              |
| `--agent <id>`          | De kaart aan een agent- of eigenaar-id toewijzen |
| `--board <id>`          | De kaart in een bordnaamruimte opslaan     |
| `--labels <items>`      | Door komma's gescheiden labels                  |
| `--json`                | De gemaakte kaart als machine-JSON weergeven  |

`create` schrijft rechtstreeks naar de SQLite-status van Workboard. De kaart is onmiddellijk zichtbaar op het tabblad Workboard van de Control UI en voor Workboard-tools.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Tekstuitvoer toont de compacte kaartregel en notities. JSON-uitvoer retourneert de volledige kaartrecord, inclusief uitvoeringsmetadata, pogingen, opmerkingen, links, bewijs, artefacten, workerlogboeken, protocolstatus, diagnostiek en automatiseringsmetadata.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` wijzigt de status van de kaart via hetzelfde pad voor handmatige operators als wanneer een kaart in het dashboard wordt versleept. Het accepteert een volledig kaart-id of een eenduidig voorvoegsel. Actieve blokkeringen door afhankelijkheden en planningen blijven van toepassing. Operators mogen een geclaimde kaart verplaatsen zonder het claimtoken van de agent; claimtokens blijven beperkt tot mutaties door agenttools en worden uit JSON-uitvoer verwijderd.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` roept eerst de actieve Gateway-RPC-methode `workboard.cards.dispatch` aan, die dezelfde subagent-runtime gebruikt als de toewijzingsactie van het dashboard, zodat gereedstaande kaarten workerruns met taakregistratie en gekoppelde sessiesleutels worden. `--max-starts` gebruikt de additieve methode `workboard.cards.dispatchWithOptions`, zodat een oudere Gateway de optie afwijst voordat er workers worden gestart; start de Gateway na een upgrade opnieuw voordat je de vlag gebruikt. Kaarten met een toegewezen agent gebruiken agentspecifieke subagent-sessiesleutels; niet-toegewezen kaarten behouden een niet-gebonden subagent-sleutel, zodat de geconfigureerde standaardagent van de Gateway behouden blijft.

De toewijzingslus:

1. Bevordert kinderen waarvan de afhankelijkheden gereed zijn naar `ready`.
2. Blokkeert verlopen claims of workerruns waarvan de time-out is verstreken.
3. Registreert toewijzingsmetadata op gereedstaande kaarten.
4. Selecteert een kleine batch niet-geclaimde gereedstaande kaarten.
5. Claimt elke geselecteerde kaart voor de dispatcher of toegewezen agent.
6. Start een subagent-workerrun met begrensde kaartcontext en het claimtoken van de kaart.
7. Slaat het workerrun-id, de sessiesleutel, de taakkoppeling wanneer het Gateway-taakregister die rapporteert, de uitvoeringsstatus en het workerlogboek op de kaart op.

De selectie is behoudend: één toewijzing start standaard maximaal drie workers, slaat gearchiveerde of reeds geclaimde kaarten over en start in één doorgang slechts één kaart per eigenaar of agent. Kaarten die al eigendom zijn van actief lopend werk of werk in beoordeling, worden voor een latere toewijzing bewaard. Geef `--max-starts <count>` door met een positief geheel getal om de limiet per doorgang te wijzigen; de regel van één kaart per eigenaar blijft van toepassing, waardoor het effectieve aantal starts lager kan zijn.

Als het starten van een worker mislukt nadat een kaart is geclaimd, blokkeert Workboard die kaart, wist het de claim en registreert het de fout in de uitvoerings- en workerlogboekmetadata van de kaart. Zo blijven mislukte starts zichtbaar in plaats van dat de kaart ongemerkt naar de wachtrij terugkeert.

Als er geen expliciet Gateway-doel is opgegeven en de lokale Gateway niet beschikbaar is of de Workboard-toewijzingsmethode nog niet beschikbaar stelt, valt de CLI terug op een toewijzing die alleen gegevens verwerkt tegen de lokale Workboard-status. Een toewijzing die alleen gegevens verwerkt, kan nog steeds afhankelijkheden bevorderen, verouderde claims opruimen en workerruns met een time-out blokkeren, maar start geen workers. Authenticatie-, machtigings- en validatiefouten, en fouten voor een expliciet `--url`- of `--token`-doel, worden rechtstreeks gerapporteerd in plaats van de terugval te activeren.

Tekstuitvoer rapporteert gestarte workers:

```text
toewijzing voltooid: gestart=2 fouten=0
```

Terugvaluitvoer is expliciet:

```text
gateway niet beschikbaar; alleen gegevenstoewijzing: bevorderd=1 geblokkeerd=0
```

JSON-uitvoer bevat het toewijzingsresultaat. Toewijzing via de Gateway kan `started` en `startFailures` bevatten; terugval waarbij alleen gegevens worden verwerkt bevat `gatewayUnavailable: true`. Claimtokens worden uit de JSON-uitvoer van kaarten verwijderd.

In het dashboard wordt hetzelfde toewijzingsresultaat als een korte samenvatting weergegeven, zodat een operator kan zien hoeveel kaarten zijn gestart, bevorderd, geblokkeerd, opnieuw geclaimd of mislukt zonder de kaartdetails te openen.

## Gelijkwaardigheid van slash-opdrachten

Kanalen die opdrachten ondersteunen, kunnen de overeenkomstige slash-opdracht gebruiken:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Verouderde worker-heartbeat herstellen
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Toewijzing via een slash-opdracht gebruikt ook de Gateway-subagent-runtime en volgt dus hetzelfde claim-, workerstart- en foutgedrag als het dashboard en het Gateway-pad van de CLI.

`/workboard list` en `/workboard show` zijn leesopdrachten voor geautoriseerde afzenders van opdrachten. `/workboard create`, `/workboard move` en `/workboard dispatch` wijzigen de bordstatus en vereisen de status van eigenaar op chatinterfaces of een Gateway-client met `operator.write` of `operator.admin`.

## Machtigingen

Het CLI-toewijzingspad vraagt normaal gesproken om Gateway-bereiken `operator.write` en `operator.read`. Aan een werkruimte gebonden kaarten worden rechtstreeks uitgevoerd in een exact geconfigureerde agentwerkruimte; een worktree-aanvraag wordt beperkt tot die map in plaats van de host door de repository beheerde code te laten materialiseren. De geselecteerde worker moet beschrijfbare, niet-gedeelde toegang tot de Docker-sandbox hebben voor exact die werkruimte, een actieve containerhash die overeenkomt met de aangevraagde koppelingen en het beleid, en geen mogelijkheid hebben om aan de host te ontsnappen. Geef `--admin` door om expliciet `operator.admin` aan te vragen, een andere checkout op de host toe te staan en de normale installatie voor beheerde worktrees te gebruiken; de verbinding mislukt als dat bereik niet voor de client is goedgekeurd. Een alleen-lezen Gateway-token kan Workboard-gegevens via leesmethoden bekijken, maar kan geen kaarten maken of workers toewijzen. Werkruimtelimieten veranderen verder niets aan het handmatig verplaatsen van kaarten voor aanroepers met toestemming om Workboard te wijzigen.

Lokale opdrachten `list`, `create`, `show` en `move` werken op de lokale OpenClaw-statusmap die door het huidige profiel wordt gebruikt. Gebruik `--dev` of `--profile <name>` bij de opdracht `openclaw` op het hoogste niveau wanneer je een andere statushoofdmap nodig hebt.

## Probleemoplossing

### Er verschijnen geen kaarten

Controleer of de plugin is ingeschakeld voor hetzelfde profiel en dezelfde statushoofdmap:

```bash
openclaw plugins inspect workboard --runtime --json
```

Als het dashboard kaarten toont maar de CLI niet, controleer dan of beide opdrachten dezelfde instelling `--dev` of `--profile` gebruiken.

### Toewijzing meldt alleen gegevensverwerking

Start of herstart de Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Probeer daarna `openclaw workboard dispatch` opnieuw. Terugval waarbij alleen gegevens worden verwerkt is nuttig voor het opschonen van lokale status, maar voor workerruns is een actieve Gateway nodig.

### Toewijzing start niets

Controleer of er ten minste één kaart met `ready` zonder actieve claim is:

```bash
openclaw workboard list --status ready
```

Kaarten kunnen ook worden overgeslagen wanneer dezelfde eigenaar al lopend werk of werk in beoordeling heeft. Verplaats voltooid werk naar `done`, geef verouderde claims vrij via de Workboard-tools of voer de toewijzing opnieuw uit nadat de actieve worker is voltooid.

## Gerelateerd

- [Workboard-plugin](/nl/plugins/workboard)
- [CLI-referentie](/nl/cli)
- [Slash-opdrachten](/nl/tools/slash-commands)
- [Control UI](/nl/web/control-ui)
