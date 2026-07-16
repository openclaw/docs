---
read_when:
    - Je wilt een werkbord in Kanban-stijl in de Control UI
    - Je schakelt de gebundelde Workboard-plugin in of uit
    - Je wilt gepland agentwerk bijhouden zonder een externe projectmanager
summary: Optioneel dashboardwerkbord voor kaarten in beheer van agents en sessieoverdracht
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-07-16T16:10:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

De Workboard-plugin voegt een optioneel bord in Kanban-stijl toe aan de
[Control UI](/nl/web/control-ui): werkkaarten op agentniveau, toewijzing aan agents
en een koppeling terug naar de taak, uitvoering en dashboardsessie van de kaart.

Workboard is bewust klein gehouden: het volgt lokaal operationeel werk voor één
OpenClaw Gateway. Het is geen vervanging voor GitHub Issues, Linear, Jira of
andere projectbeheersystemen voor teams.

## Inschakelen

Workboard is meegeleverd, maar standaard uitgeschakeld:

1. Open **Plugins** in de Control UI, of gebruik `/settings/plugins` relatief ten opzichte van
   het geconfigureerde basispad van de Control UI. Een basispad van `/openclaw`
   gebruikt bijvoorbeeld `/openclaw/settings/plugins`.
2. Zoek **Workboard** en kies **Enable**. Omdat Workboard met
   OpenClaw wordt meegeleverd, is de actie **Install** niet nodig.
3. Als de UI meldt dat opnieuw opstarten vereist is, start je de Gateway opnieuw op.

Het tabblad Workboard verschijnt in de dashboardnavigatie nadat de Plugin-runtime is geladen.
Zolang deze is uitgeschakeld, blijft het tabblad verborgen in de navigatie. Als je de
route `/workboard` rechtstreeks opent terwijl de Plugin is uitgeschakeld of geblokkeerd door
`plugins.allow`/`plugins.deny`, wordt een status weergegeven waarin de Plugin niet beschikbaar is, in plaats van kaartgegevens.

De equivalente CLI-workflow is:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuratie

Workboard heeft geen Plugin-specifieke configuratie. Schakel het in of uit met de standaard
Plugin-vermelding:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Kaartvelden

| Veld        | Waarden                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | vrije tekenreeksen                                                                                            |
| `agentId`   | optioneel toegewezen agent                                                                                    |
| gekoppelde verwijzingen | optionele taak, uitvoering, sessie of bron-URL                                                             |
| `execution` | optionele metadata voor een Codex-/Claude-uitvoering die vanaf de kaart is gestart (engine, modus, model, sessie, uitvoerings-id, status) |

Kaarten bevatten ook compacte metadata voor pogingen, opmerkingen, koppelingen, bewijs,
artefacten, automatiseringsinstellingen, bijlagen, workerlogboeken, workerprotocolstatus,
claims, diagnostiek, meldingen, sjabloon-id, archiefstatus en
detectie van verouderde sessies, plus een lijst met recente gebeurtenissen (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Met deze metadata kan een
beheerder zien hoe een kaart door het bord is verplaatst zonder de gekoppelde
sessie te openen; dit is lokale operationele context, geen vervanging voor
sessietranscripten of de geschiedenis van GitHub-issues.

De Plugin en Control UI gebruiken één Workboard-kaartcontract. Dashboardverversingen
behouden daarom de herkomst en autoriteit van de werkruimte, claimstatus, diagnostische
acties en volgnummers van meldingen, in plaats van een kleinere
kopie van de kaart te projecteren die alleen voor de UI is bestemd. Onbekende diagnostische typen, diagnostische ernstniveaus en
meldingstypen worden genegeerd totdat beide oppervlakken ze ondersteunen; ze worden nooit
herschreven naar een andere geldige status.

Het geopende dashboard wordt bijgewerkt via invalidaties van `plugin.workboard.changed`. Elke
gebeurtenis bevat alleen een opslagepoch en revisie; de UI leest daarna de canonieke
kaarten opnieuw via de normale RPC `operator.read`. Meerdere revisies worden samengevoegd tot
één volgende leesbewerking. Workboard stelt die leesbewerking uit terwijl een kaart wordt versleept,
bewerkt of geschreven en hervat deze nadat de lokale interactie is voltooid. Bij
opnieuw verbinden wordt altijd een canonieke herlaadbewerking uitgevoerd. Er vindt geen routinematige volledige
poll van kaarten plaats en **Refresh** blijft beschikbaar voor handmatig herstel.

Wanneer er meer dan één bord bestaat, bevat de werkbalk een filter **Board**, ondersteund
door permanente bordmetadata en niet alleen door de momenteel zichtbare kaarten. Lege
en gearchiveerde borden blijven daarom selecteerbaar. Kaarten zonder expliciete
bord-id behoren tot het canonieke bord `default`. Het geselecteerde bord wordt opgeslagen
in de queryparameter `?board=`, zodat een bladwijzer kan worden gemaakt voor de gefilterde Workboard-URL
of deze kan worden gedeeld; als je **All boards** kiest, wordt de parameter verwijderd.

Kaarten worden opgeslagen in de eigen Gateway-status van de Plugin en worden samen met de rest van
de OpenClaw-status van die Gateway verplaatst (zie [Opslag](#storage)).

## Werk starten vanaf een kaart

Niet-gekoppelde kaarten kunnen rechtstreeks werk starten:

- **Run Codex** / **Run Claude** start een door een taak gevolgde agentuitvoering met een
  expliciete engine, verzendt de kaartprompt en markeert de kaart als `running`. Codex-
  uitvoeringen gebruiken `openai/gpt-5.6-sol`; Claude-uitvoeringen gebruiken `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** maakt een gekoppelde dashboardsessie zonder
  de kaartprompt te verzenden of de kaart te verplaatsen, voor handmatig werk dat
  aan het bord gekoppeld blijft.

Autonome starts gebruiken het pad van de Gateway voor door taken gevolgde agentuitvoeringen (standaardagent
en -model, tenzij Codex/Claude expliciet wordt gekozen); Workboard koppelt vervolgens de
resulterende taak, uitvoerings-id en sessiesleutel terug aan de kaart. Elke gekoppelde
uitvoering registreert ook een pogingsoverzicht (engine, modus, model, uitvoerings-id,
tijdstempels, status, doorlopend aantal fouten), zodat herhaalde fouten zichtbaar blijven.

Het dashboard ververst de taakstatus vanuit het taaktakenregister van de Gateway en koppelt
taken aan kaarten op basis van taak-id, uitvoerings-id of gekoppelde sessiesleutel. Een taak in de wachtrij of
een actieve taak houdt de levenscyclus van de kaart actief; een voltooide, mislukte, verlopen of
geannuleerde taak verplaatst de kaart richting `review` of `blocked` volgens dezelfde synchronisatieregel
als gekoppelde sessies (zie [Synchronisatie van de sessielevenscyclus](#session-lifecycle-sync)).

## Agenttools

| Tool                                                                                                                                             | Doel                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Compacte kaarten weergeven met claim-/diagnosestatus; optioneel bordfilter.                                                                                                               |
| `workboard_read`                                                                                                                                 | Eén kaart plus begrensde workercontext retourneren (notities, pogingen, opmerkingen, links, bewijs, artefacten, bovenliggende resultaten, recent werk van de toegewezene, actieve diagnoses). |
| `workboard_create`                                                                                                                               | Een kaart maken met optionele bovenliggende kaarten, tenant, Skills, bord, werkruimtemetadata, idempotentiesleutel, runtimelimiet en budget voor nieuwe pogingen.                          |
| `workboard_link`                                                                                                                                 | Een bovenliggende kaart aan een onderliggende kaart koppelen. Onderliggende kaarten blijven `todo` totdat elke bovenliggende kaart `done` bereikt; vervolgens verplaatst dispatchpromotie ze naar `ready`. |
| `workboard_claim`                                                                                                                                | Een kaart claimen voor de aanroepende agent; verplaatst `backlog`/`todo`/`ready` naar `running`.                                                 |
| `workboard_heartbeat`                                                                                                                            | De claim-Heartbeat tijdens een langere uitvoering vernieuwen.                                                                                                                             |
| `workboard_release`                                                                                                                              | De claim na voltooiing, pauzering of overdracht vrijgeven; kan de kaart naar een volgende status verplaatsen.                                                                             |
| `workboard_complete` / `workboard_block`                                                                                                         | Gestructureerde levenscyclustools voor eindsamenvattingen, bewijs, artefacten en manifesten van gemaakte kaarten (moeten verwijzen naar kaarten die aan de voltooide kaart zijn teruggekoppeld), of redenen voor blokkering. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Kleine kaartbijlagen opslaan in de SQLite-status van de Plugin, op de kaart indexeren en beschikbaar stellen in de workercontext.                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Workerlogregels vastleggen en een kaart blokkeren wanneer een geautomatiseerde worker stopt zonder `workboard_complete`/`workboard_block` aan te roepen.                                  |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Persistente bordmetadata beheren (weergavenaam, beschrijving, archiefstatus, standaardwerkruimte).                                                                                        |
| `workboard_runs`                                                                                                                                 | De persistente geschiedenis van uitvoeringspogingen voor een kaart retourneren.                                                                                                          |
| `workboard_specify`                                                                                                                              | Een ruwe triage-/backlogkaart omzetten in een verduidelijkte `todo`-kaart; legt de specsamenvatting vast op de kaart.                                                         |
| `workboard_decompose`                                                                                                                            | Een bovenliggende orkestratiekaart opsplitsen in gekoppelde onderliggende kaarten die bord-/tenantmetadata overnemen; kan de bovenliggende kaart voltooien met een manifest van gemaakte kaarten. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Meldingsabonnementen beheren. Gebeurtenissen kunnen veilig opnieuw worden gelezen; `advance` verplaatst de duurzame cursor, zodat aanroepers kunnen hervatten zonder gebeurtenissen van voltooide/mislukte/verouderde kaarten te verliezen of dubbel te lezen. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Bordnaamruimten en wachtrijstatistieken inspecteren.                                                                                                                                      |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Vastgelopen werk herstellen of overdragen.                                                                                                                                                |
| `workboard_comment` / `workboard_proof`                                                                                                          | Overdrachtsnotities toevoegen of verwijzingen naar bewijs/artefacten bijvoegen.                                                                                                          |
| `workboard_unblock`                                                                                                                              | Geblokkeerd werk terugzetten naar `todo`.                                                                                                                                     |
| `workboard_move`                                                                                                                                 | Een kaart naar een andere status verplaatsen; voor geclaimde kaarten is het agentclaimbereik van de aanroeper vereist.                                                                    |
| `workboard_dispatch`                                                                                                                             | Afhankelijkheidspromotie of het opschonen van verouderde claims stimuleren zonder workers te starten; workers worden gestart via Gateway- of slash-commanddispatch.                       |

Geclaimde kaarten weigeren mutaties via agenttools van andere agents, tenzij de aanroeper
het claimtoken bezit dat door `workboard_claim` is geretourneerd. Bij elke kaart die door een
agenttool of Gateway-RPC-aanroep wordt geretourneerd, wordt `metadata.claim.token` geredigeerd tot `[redacted]`
(het token zelf wordt slechts eenmaal, op het hoogste niveau, uitsluitend door `workboard_claim` geretourneerd),
zodat dashboardoperators en andere agents de claimstatus kunnen inspecteren zonder ooit
een bruikbaar token te zien. Herstel verloopt via
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, waarvoor
het token niet vereist is.

## Dispatch

Dispatch is lokaal voor de Gateway: er worden geen willekeurige OS-processen gestart. Normale
OpenClaw-subagentsessies blijven verantwoordelijk voor de uitvoering. Eén dispatchronde:

1. Promoveert kaarten waarvan de afhankelijkheden gereed zijn.
2. Legt dispatchmetadata vast op gereedstaande kaarten.
3. Blokkeert verlopen claims of uitvoeringen met een time-out.
4. Markeert via het bord geconfigureerde triagekaarten als orkestratiekandidaten.
5. Claimt een kleine batch gereedstaande kaarten en start workeruitvoeringen via de
   subagentruntime van de Gateway.

Workers krijgen begrensde kaartcontext plus het claimtoken dat nodig is om via
de Workboard-tools een Heartbeat te versturen of de kaart te voltooien of blokkeren.

Werkruimtepaden volgen de bestaande bestandssysteembevoegdheid van de aanroeper. Gateway-
clients met `operator.write` kunnen geconfigureerde agentwerkruimten gebruiken;
`operator.admin`-clients kunnen andere check-outs op de host gebruiken. Agenttools in een sandbox gebruiken
de werkruimtetoegang van hun sandbox, terwijl werkruimtegebonden tools zonder sandbox hun
geconfigureerde werkruimteroot gebruiken. Workboard legt die bevoegdheid vast wanneer een werkruimte wordt
toegewezen en neemt bij dispatch opnieuw de doorsnede met de bevoegdheid van de huidige aanroeper,
zodat een persistente kaart de toegang van een latere aanroeper niet kan verruimen. Bij oudere kaarten met een
expliciete hostwerkruimte maar zonder vastgelegde bevoegdheid moet die werkruimte
opnieuw worden opgeslagen vóór een dispatch met volledige hosttoegang; kaarten zonder hostpad nemen bij
hun eerste dispatch de bevoegdheid van de huidige aanroeper over.

Werkruimtegebonden dispatch accepteert een map of Git-check-out alleen wanneer de
repositoryroot exact overeenkomt met de werkruimte van de doelagent. Een worktree-aanvraag
wordt beperkt tot die map en opgeslagen als mapwerkruimte, zodat de
host de check-out niet materialiseert en geen repository-installatiecode uitvoert. De
doelworker moet voor exact die werkruimte een schrijfbare, niet-gedeelde Docker-sandbox gebruiken,
zonder uitvoering met verhoogde bevoegdheden, persistente overrides voor host-/Node-exec of
niet-geclassificeerde Plugin- en MCP-tools. Workboard somt de geregistreerde tools op
in plaats van een `workboard_*`-voorvoegsel te vertrouwen, en dispatch weigert een actieve Docker-
container waarvan de live mount-/configuratiehash verouderd is. Dispatch meldt het
incompatibele doelbeleid in plaats van een minder streng geïsoleerde worker te starten.
Dispatch met volledige hosttoegang kan andere lokale check-outs als doel gebruiken en behoudt de normale beheerde
worktree-installatie.

Werkruimtebevoegdheid creëert geen tweede toestemmingsmodel voor de levenscyclus van kaarten.
Aanroepers die Workboard-kaarten mogen muteren, kunnen ze op elk oppervlak handmatig door dezelfde
statussen verplaatsen; alleen-lezen toegang tot de werkruimte voorkomt uitsluitend worker-
dispatch waarvoor schrijftoegang nodig is.

### Workerselectie

Elke ronde start standaard **maximaal 3 workers**. Gereedstaande kaarten worden gesorteerd op
prioriteit, vervolgens positie en daarna aanmaaktijd. Een ronde start slechts één kaart per
eigenaar/agent en slaat eigenaren over die al actief werk of beoordelingswerk op het
bord hebben. Gearchiveerde kaarten, kaarten met een actieve claim en kaarten die niet de status `ready`
hebben, worden nooit geselecteerd om workers te starten (ze kunnen nog wel worden beïnvloed door de
gegevenszijde van dispatch: opschonen van verouderde claims, afhankelijkheidspromotie en opschonen
van time-outs).

Sessiesleutels zijn deterministisch per bord/kaart, zodat herhaalde dispatches
terugkeren naar dezelfde workerlane in plaats van niet-gerelateerde sessies te maken:

- Toegewezen kaarten: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Niet-toegewezen kaarten: `subagent:workboard-<boardId>-<cardId>` (Gateway bepaalt
  de geconfigureerde standaardagent)

Als een worker niet kan worden gestart nadat een kaart is geclaimd, blokkeert Workboard de
kaart, wist het de claim, legt het de mislukte start van de uitvoering vast en voegt het een worker-
logregel toe, die zichtbaar is in het dashboard, de CLI-JSON, agenttools en kaart-
diagnoses.

### Ingangen

- Dashboard-dispatchactie
- `openclaw workboard dispatch`
- `/workboard dispatch` op een kanaal dat opdrachten ondersteunt

Alle drie gebruiken de Gateway-subagentruntime wanneer de Gateway beschikbaar is. De
CLI heeft één terugvaloptie voor operators: als de Gateway-aanroep mislukt met een
verbindings-/niet-beschikbaarheidsfout (of een `unknown method`-fout voor oudere
Gateways), en er geen expliciet `--url`-/`--token`-doel en geen geconfigureerde externe
Gateway (`OPENCLAW_GATEWAY_URL` of `gateway.mode: remote`) van toepassing is, voert de CLI
een dispatch met alleen gegevens uit op de lokale SQLite-status. Deze kan afhankelijkheden promoveren,
verouderde claims opschonen en runs blokkeren waarvan de time-out is verstreken, maar kan geen workers starten. Authenticatie-,
toestemmings- en validatiefouten van een bereikbare Gateway worden niet als
niet-beschikbaar behandeld; ze worden als opdrachtfouten weergegeven. Hetzelfde geldt voor elke Gateway-
fout wanneer een expliciet `--url`-/`--token`-doel is opgegeven.

Metagegevens van het bord kunnen `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` en `orchestratorProfile` instellen. OpenClaw registreert deze intentie en
maakt die beschikbaar in de workercontext; de daadwerkelijke specificatie/opsplitsing verloopt nog steeds
via de normale Workboard-tools.

## CLI en slash-opdracht

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Verouderde levenscyclus van kaart herstellen" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

De tekstuitvoer van `list` verbergt gearchiveerde kaarten standaard (`--include-archived`
overschrijft dit); `--json` bevat altijd gearchiveerde kaarten, overeenkomstig het contract voor volledige kaarten
dat door bestaande scripts wordt gebruikt. `show` en `move` accepteren een ondubbelzinnig id-
voorvoegsel. `list`, `create`, `show` en `move` lezen/schrijven altijd rechtstreeks
de lokale Plugin-status. Alleen `dispatch` roept de actieve Gateway aan, met de hierboven
beschreven terugvaloptie.

Zie [Workboard-CLI](/nl/cli/workboard) voor alle vlaggen, JSON-uitvoer, het terugvalgedrag van de Gateway,
de verwerking van id-voorvoegsels, selectieregels voor dispatch en
probleemoplossing.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` en `/workboard dispatch` weerspiegelen
de CLI. Lijst- en weergavebewerkingen zijn leesbewerkingen voor elke geautoriseerde afzender van opdrachten.
Voor maken, verplaatsen en dispatch is op chatoppervlakken de status van eigenaar vereist, of een Gateway-
client met `operator.write`/`operator.admin`. Handmatige verplaatsingen door operators gebruiken hetzelfde
gedrag voor het overschrijven van claims als slepen en neerzetten op het dashboard. Hun toegang tot de worktree
volgt nog steeds dezelfde hierboven beschreven werkruimtegrens.

## Synchronisatie van de sessielevenscyclus

Kaarten kunnen worden gekoppeld aan een bestaande dashboardsessie, of aan een sessie die wordt gemaakt wanneer je
vanaf de kaart begint te werken. Gekoppelde kaarten tonen de sessielevenscyclus inline:
actief, verouderd, gekoppeld inactief, voltooid, mislukt of ontbrekend. Je kunt ook een
bestaande sessie vastleggen via het tabblad Sessions met **Add to Workboard**; de kaart
wordt aan die sessie gekoppeld, gebruikt het sessielabel of de recente gebruikersprompt als titel
en vult notities vooraf in op basis van de recente gebruikersprompt plus het laatste antwoord van de assistent,
indien beschikbaar.

Als de gekoppelde sessie ontbreekt, blijft de kaart voor context gekoppeld en
biedt deze nog steeds startbesturingselementen om opnieuw te beginnen in een nieuwe sessie. Als een actieve
gekoppelde sessie geen recente activiteit meer meldt, markeert Workboard de kaart als
`stale` en slaat dit op als metagegevens totdat de levenscyclus het wist.

Zolang een kaart een actieve werkstatus heeft, volgt Workboard de gekoppelde sessie:

| Status van gekoppelde sessie          | Kaartstatus |
| ------------------------------------- | ----------- |
| actief                                | `running`   |
| voltooid                              | `review`    |
| mislukt, beëindigd, time-out verstreken of afgebroken | `blocked`   |

**Handmatige beoordelingsstatussen hebben voorrang.** Als je een kaart naar `review`, `blocked` of `done`
verplaatst, stopt de automatische synchronisatie voor die kaart totdat je deze terugverplaatst naar `todo` of `running`.

Bij het starten van een kaart worden normale Gateway-sessies gebruikt; Workboard slaat alleen kaartmetagegevens
en koppelingen op. Het gesprekstranscript, de modelselectie en de runlevenscyclus
blijven eigendom van het reguliere sessiesysteem. Gebruik **Stop** op een actieve
gekoppelde kaart om de actieve run af te breken. Workboard markeert die kaart als `blocked`, zodat
deze zichtbaar blijft voor opvolging.

Nieuwe kaarten kunnen beginnen met Workboard-sjablonen (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Sjablonen vullen titel, notities, labels en prioriteit vooraf in;
de sjabloon-id wordt opgeslagen als kaartmetagegeven.

## Dashboardworkflow

1. Open het tabblad Workboard in de Control UI.
2. Maak een kaart met een titel, notities, prioriteit, labels, een optionele agent en
   een optionele gekoppelde sessie, of open Sessions en kies **Add to Workboard**
   voor een bestaande sessie.
3. Sleep de kaart tussen kolommen, of focus het compacte statusbesturingselement en gebruik
   het menu of ArrowLeft/ArrowRight. Tijdens het slepen wordt de bronkaart gedimd en
   krijgen beschikbare doelkolommen een omtrek.
4. Start het werk vanaf de kaart om een dashboardsessie te maken of opnieuw te gebruiken.
5. Open de gekoppelde sessie vanaf de kaart terwijl de agent werkt.
6. Laat de levenscyclussynchronisatie actief werk naar `review`/`blocked` verplaatsen en verplaats
   de kaart vervolgens handmatig naar `done` wanneer deze is geaccepteerd.

## Diagnostiek

Diagnostiek wordt berekend op basis van lokale kaartmetagegevens. Ingebouwde controles signaleren:

| Soort                       | Voorwaarde                                                                     |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Toegewezen `todo`-/`backlog`-/`ready`-kaart die al meer dan 1 uur niet is bijgewerkt.             |
| `running_without_heartbeat` | `running`-kaart zonder Heartbeat voor de claim of uitvoeringsupdate gedurende meer dan 20 minuten. |
| `blocked_too_long`          | `blocked`-kaart die al meer dan 24 uur niet is bijgewerkt.                                   |
| `repeated_failures`         | Het bijgehouden aantal mislukkingen van de kaart bedraagt 2 of meer.                                |
| `missing_proof`             | `done`-kaart zonder bewijs, artefacten of bijlagen.                          |
| `orphaned_session`          | `running`-kaart met een `sessionKey`, maar zonder `execution`-metagegevens.                |

## Toestemmingen

Gateway-RPC-methoden vallen onder `workboard.*`:

| Bereik           | Methoden                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, bijlagen weergeven/ophalen, gebeurtenissen van meldingen lezen, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, maken/bijwerken/verplaatsen/verwijderen/reageren/koppelen/linkDependency/bewijs/artefact, bijlage toevoegen/verwijderen, workerlogboek, protocolschending, claimen/Heartbeat/vrijgeven/promoveren/opnieuw toewijzen/terugvorderen/voltooien/blokkeren/deblokkeren, `cards.dispatch`, `cards.bulk`, archiveren, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, abonneren op/verwijderen/doorschuiven van meldingen |

Geen enkele RPC-methode vereist `operator.admin`. Browsers die zijn verbonden met alleen-lezen
operatortoegang kunnen het bord bekijken, maar geen kaarten wijzigen. Een beheerdersbereik
verruimt de geaccepteerde Workboard-hostpaden; het wijzigt de beschikbare methoden niet.

## Opslag

Workboard slaat duurzame gegevens op in een relationele SQLite-database die eigendom is van de Plugin
onder de statusmap van OpenClaw: borden, kaarten, labels, levenscyclusgebeurtenissen,
runpogingen, opmerkingen, afhankelijkheidskoppelingen, bewijs, artefactverwijzingen,
metagegevens en blobs van bijlagen, diagnostiek, meldingen, workerlogboeken,
protocolstatus en abonnementen bevinden zich allemaal in Workboard-tabellen (niet in
sleutel-waarde-items van de Plugin). Een kaartexport behoudt het verhaal van het bord
zonder de blobinhoud van bijlagen inline op te nemen.

Installaties die Workboard in de release `.28` gebruikten, kunnen
`openclaw doctor --fix` uitvoeren om de uitgebrachte verouderde naamruimten voor Plugin-status
(`workboard.cards`, `workboard.boards`, `workboard.notify` en, indien aanwezig,
`workboard.attachments`) naar de relationele database te migreren.

## Problemen oplossen

**Op het tabblad staat dat Workboard niet beschikbaar is**

```bash
openclaw plugins inspect workboard --runtime --json
```

Als `plugins.allow` is geconfigureerd, voeg je `workboard` eraan toe. Als `plugins.deny`
`workboard` bevat, verwijder je dit voordat je de Plugin inschakelt.

**Kaarten worden niet opgeslagen**

Controleer of de browserverbinding `operator.write`-toegang heeft. Alleen-lezen operator-
sessies kunnen kaarten weergeven, maar ze niet maken, bewerken, verplaatsen of verwijderen.

**Bij het starten van een kaart wordt niet de verwachte sessie geopend**

Controleer de agent-id en de gekoppelde sessie van de kaart en open vervolgens Sessions of Chat om
de daadwerkelijke runstatus te bekijken.

**Dispatch start geen worker**

Controleer of er ten minste één `ready`-kaart zonder actieve claim is:

```bash
openclaw workboard list --status ready
```

Als de CLI een dispatch met alleen gegevens meldt, start of herstart je de Gateway en
probeer je het opnieuw. Een dispatch met alleen gegevens werkt de lokale bordstatus bij, maar kan geen
subagent-workerruns starten. Kaarten kunnen ook worden overgeslagen wanneer een andere kaart voor
dezelfde eigenaar of agent al actief is of op beoordeling wacht; voltooi,
blokkeer of geef dat actieve werk vrij voordat je meer werk voor dezelfde
eigenaar dispatcht.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Workboard-CLI](/nl/cli/workboard)
- [Plugins](/nl/tools/plugin)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Sessies](/nl/concepts/session)
