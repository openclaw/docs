---
read_when:
    - Je wilt een Kanban-achtig werkbord in de Control UI
    - Je schakelt de meegeleverde Workboard-Plugin in of uit
    - Je wilt gepland agentwerk bijhouden zonder externe projectmanager
summary: Optioneel dashboardwerkbord voor agent-eigen kaarten en sessieoverdracht
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

De Workboard-Plugin voegt een optioneel Kanban-achtig bord toe aan de
[Control UI](/nl/web/control-ui). Gebruik het om werkkaarten op agentformaat te verzamelen, ze aan agents toe te wijzen en de gekoppelde achtergrondtaak, run en dashboardsessie vanuit één kaart te volgen.

Workboard is bewust klein gehouden. Het volgt lokaal operationeel werk voor een
OpenClaw Gateway; het is geen vervanging voor GitHub Issues, Linear, Jira of
andere projectbeheersystemen voor teams.

## Standaardstatus

Workboard is een gebundelde Plugin en is standaard uitgeschakeld, tenzij je deze
inschakelt in de Plugin-configuratie.

Schakel deze in met:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Open daarna het dashboard:

```bash
openclaw dashboard
```

Het Workboard-tabblad verschijnt in de dashboardnavigatie. Als het tabblad zichtbaar is
maar de Plugin is uitgeschakeld of wordt geblokkeerd door `plugins.allow` / `plugins.deny`, toont de
weergave een status dat de Plugin niet beschikbaar is in plaats van lokale kaartgegevens.

## Wat kaarten bevatten

Elke kaart slaat op:

- titel en notities
- status: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` of `done`
- prioriteit: `low`, `normal`, `high` of `urgent`
- labels
- optionele agent-id
- optionele gekoppelde taak, run, sessie of bron-URL
- optionele uitvoeringsmetadata voor een Codex- of Claude-run die vanaf de kaart is gestart
- compacte metadata voor pogingen, opmerkingen, links, bewijs, artefacten, automatisering,
  bijlagen, workerlogboeken, workerprotocolstatus, claims, diagnostiek,
  meldingen, sjablonen, archiefstatus en detectie van verouderde sessies
- recente kaartgebeurtenissen zoals aangemaakt, verplaatst, gekoppeld, geclaimd, Heartbeat,
  poging, bewijs, artefact, diagnostiek, melding, dispatch, archief, verouderd,
  of door agent bijgewerkte wijzigingen

Kaarten worden opgeslagen in de Gateway-status van de Plugin. Ze zijn lokaal voor de Gateway-
statusmap en verplaatsen mee met de rest van de OpenClaw-status van die Gateway.

Workboard bewaart compacte metadata per kaart zodat operators kunnen zien hoe een kaart
door het bord is bewogen zonder de gekoppelde sessie te openen. Gebeurtenissen, pogingssamenvattingen,
bewijsfragmenten, gerelateerde links, opmerkingen, archiefmarkeringen en markeringen voor verouderde sessies
zijn bewust lokale metadata; ze vervangen geen sessietranscripten of GitHub-issuegeschiedenis.

## Kaartuitvoeringen en taken

Niet-gekoppelde kaarten kunnen werk starten vanaf de kaart. Autonome starts gebruiken het
door taken gevolgde agent-runpad van de Gateway, waarna Workboard de resulterende taak,
run-id en sessiesleutel terugkoppelt aan de kaart. Start gebruikt de geconfigureerde
standaardagent en het standaardmodel van de Gateway. Codex- en Claude-acties zijn optionele expliciete modelkeuzes:

- Codex uitvoeren of Claude uitvoeren start een taakgedragen agent-run, verzendt de kaartprompt
  en markeert de kaart als `running`.
- Codex openen of Claude openen maakt een gekoppelde dashboardsessie zonder de kaartprompt te verzenden
  of de kaart te verplaatsen, zodat je handmatig kunt werken terwijl deze aan het bord gekoppeld blijft.

Uitvoeringsmetadata slaat de geselecteerde engine, modus, modelreferentie, sessiesleutel,
run-id, taak-id wanneer beschikbaar, en levenscyclusstatus op de kaart op. Codex-
uitvoeringen gebruiken `openai/gpt-5.5`; Claude-uitvoeringen gebruiken
`anthropic/claude-sonnet-4-6`.

Elke gekoppelde uitvoering registreert ook een pogingssamenvatting op dezelfde kaartrecord.
De pogingssamenvatting bewaart de engine, modus, het model, de run-id, tijdstempels, status
en het lopende aantal mislukkingen, zodat herhaalde fouten zichtbaar blijven op het bord.

Het dashboard ververst de taakstatus vanuit het Gateway-taaklogboek en koppelt
taken terug aan kaarten op basis van taak-id, run-id of gekoppelde sessiesleutel. Als een taak
in de wachtrij staat of actief is, toont de kaartlevenscyclus de actieve taakstatus. Als de taak
voltooit, mislukt, een time-out krijgt of wordt geannuleerd, beweegt de kaartlevenscyclus richting
review- of blocked-status met dezelfde levenscyclussynchronisatie als gekoppelde sessies.

## Agentcoördinatie

Workboard stelt ook optionele agenttools beschikbaar voor bordbewuste workflows:

- `workboard_list` toont compacte kaarten met claim- en diagnostische status, met een
  optioneel bordfilter.
- `workboard_read` retourneert één kaart plus begrensde workercontext opgebouwd uit notities,
  pogingen, opmerkingen, links, bewijs, artefacten, bovenliggende resultaten, recent toegewezen
  werk en actieve diagnostiek.
- `workboard_create` maakt een kaart met optionele bovenliggende kaarten, tenant, Skills,
  bord, werkruimtemetadata, idempotentiesleutel, runtimelimiet en retrybudget.
- `workboard_link` koppelt een bovenliggende kaart aan een onderliggende kaart. Onderliggende kaarten blijven in `todo`
  totdat elke bovenliggende kaart `done` bereikt; daarna verplaatst dispatchpromotie ze naar
  `ready`.
- `workboard_claim` claimt een kaart voor de aanroepende agent en verplaatst backlog-, todo-
  of ready-kaarten naar `running`.
- `workboard_heartbeat` ververst de claim-Heartbeat tijdens langere runs.
- `workboard_release` geeft de claim vrij na voltooiing, pauze of overdracht en
  kan de kaart naar een volgende status verplaatsen.
- `workboard_complete` en `workboard_block` zijn gestructureerde levenscyclustools voor
  eindsamenvattingen, bewijs, artefacten, manifesten van aangemaakte kaarten en blocker-
  redenen. Manifesten van aangemaakte kaarten moeten verwijzen naar kaarten die teruggekoppeld zijn aan de
  voltooide kaart, waardoor fantoomkinderen uit samenvattingen blijven.
- `workboard_attachment_add`, `workboard_attachment_read` en
  `workboard_attachment_delete` slaan kleine kaartbijlagen op in de SQLite-
  status van de Plugin, indexeren ze op de kaart en stellen ze beschikbaar in workercontext.
- `workboard_worker_log` en `workboard_protocol_violation` registreren workerlog-
  regels en blokkeren kaarten wanneer een geautomatiseerde worker stopt zonder
  `workboard_complete` of `workboard_block` aan te roepen.
- `workboard_board_create`, `workboard_board_archive` en
  `workboard_board_delete` beheren persistente bordmetadata zoals weergavenaam,
  beschrijving, archiefstatus en standaardwerkruimte.
- `workboard_runs` retourneert de persistente run-pogingsgeschiedenis die op een kaart is opgeslagen.
- `workboard_specify` zet een ruwe triage- of backlogkaart om in een verduidelijkte
  `todo`-kaart en registreert de specificatiesamenvatting op de kaart.
- `workboard_decompose` verdeelt een bovenliggende orchestratiekaart in gekoppelde onderliggende kaarten,
  erft bord- en tenantmetadata en kan de bovenliggende kaart voltooien met een
  manifest van aangemaakte kaarten.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` en
  `workboard_notify_unsubscribe` beheren meldingsabonnementen in Plugin-
  status. Gebeurtenislezingen zijn veilig opnieuw af te spelen; de advance-tool verplaatst de duurzame cursor
  zodat aanroepers kunnen hervatten zonder voltooide, mislukte of
  verouderde kaartgebeurtenissen te verliezen of dubbel te lezen.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` en `workboard_dispatch` laten een agent
  bordnaamruimten inspecteren, wachtrijstatistieken bekijken, vastgelopen werk herstellen, overdrachts-
  notities toevoegen, bewijs- of artefactreferenties koppelen, geblokkeerd werk terugzetten naar `todo`,
  en afhankelijkheidspromotie of opruiming van verouderde claims aansturen.

Geclaimde kaarten weigeren agenttoolmutaties van andere agents, tenzij de aanroeper
het claimtoken heeft dat door `workboard_claim` is geretourneerd. Dashboardoperators gebruiken nog steeds
het normale Gateway-RPC-oppervlak en kunnen kaarten herstellen of opnieuw toewijzen.

Workboard slaat duurzame bordgegevens op in een door de Plugin beheerde relationele SQLite-database
onder de OpenClaw-statusmap. Borden, kaarten, labels, levenscyclusgebeurtenissen,
run-pogingen, opmerkingen, afhankelijkheidslinks, bewijs, artefactreferenties,
bijlagemetadata en blobs, diagnostiek, meldingen, workerlogboeken,
protocolstatus en abonnementen worden opgeslagen in Workboard-tabellen in plaats van
Plugin-sleutel-waarde-items. Een kaartexport behoudt nog steeds het bordverhaal
zonder de blobinhoud van bijlagen inline op te nemen.

Installaties die Workboard in de `.28`-release gebruikten, kunnen
`openclaw doctor --fix` uitvoeren om de uitgebrachte legacy Plugin-statusnaamruimten
(`workboard.cards`, `workboard.boards` en `workboard.notify`) naar de
relationele database te migreren. Als er een legacy `workboard.attachments`-naamruimte aanwezig is,
migreert doctor die bijlageblobs ook.

Workboard-diagnostiek wordt berekend uit lokale kaartmetadata. De ingebouwde controles
markeren toegewezen kaarten die te lang wachten, actieve kaarten zonder recente Heartbeat,
geblokkeerde kaarten die aandacht nodig hebben, herhaalde fouten, voltooide kaarten zonder bewijs,
en actieve kaarten die alleen een losse sessielink hebben.

Dispatch is bewust Gateway-lokaal. Het spawnt geen willekeurige besturingssysteemprocessen;
normale OpenClaw-subagentsessies blijven de uitvoering beheren. De
dispatchactie promoveert kaarten waarvan de afhankelijkheden klaar zijn, registreert dispatchmetadata op
ready-kaarten, blokkeert verlopen claims of runs met time-out, markeert door het bord geconfigureerde
triagekaarten als orchestratiekandidaten, claimt vervolgens een kleine batch ready-
kaarten en start workerruns via de Gateway-subagentruntime. Toegewezen
kaarten gebruiken `agent:<id>:subagent:workboard-*`-workersessiesleutels; niet-toegewezen
kaarten gebruiken niet-gescopete `subagent:workboard-*`-sleutels zodat de Gateway nog steeds de
geconfigureerde standaardagent oplost. Workers krijgen begrensde kaartcontext plus het claimtoken
dat ze nodig hebben om de kaart via de Workboard-tools te heartbeaten, te voltooien of te blokkeren.

### Selectie van dispatchworkers

Elke dispatchpassage start standaard maximaal drie workers. Ready-kaarten worden
geordend op prioriteit, positie en aanmaaktijd, en daarna gefilterd om
dubbel actief eigenaarschap te voorkomen. Een dispatch start in dezelfde passage slechts één kaart voor een bepaalde eigenaar of
agent, en slaat eigenaren over die al running- of reviewwerk op het bord hebben.

Gearchiveerde kaarten, kaarten met actieve claims en kaarten zonder `ready`-status worden
niet geselecteerd voor workerstarts. Ze kunnen nog steeds worden beïnvloed door de datakant van
dispatch wanneer verouderde claims, afhankelijkheidspromotie of time-outopruiming van toepassing is.

### Workerprompt en levenscyclus

De workerprompt bevat de kaarttitel, begrensde notities en context, het
toegewezen bord en het Workboard-workerprotocol. Deze bevat ook de claimeigenaar
en het claimtoken zodat de worker `workboard_heartbeat`,
`workboard_complete` of `workboard_block` kan aanroepen zonder dat een andere actor de
kaart overneemt.

Wanneer een worker succesvol start, slaat Workboard de sessiesleutel, run-id,
engine, modus, modellabel, status en het workerlogboek op de kaart op. De sessiesleutel
is deterministisch voor het bord en de kaart, waardoor herhaalde dispatches terug routeren
naar dezelfde workerlane in plaats van ongerelateerde sessies aan te maken.

Als een worker niet kan worden gestart nadat een kaart is geclaimd, blokkeert Workboard de
kaart, wist de claim, registreert de run-startfout en voegt een workerlog-
regel toe. Die fout is zichtbaar in het dashboard, CLI-JSON, agenttools en kaart-
diagnostiek.

### Dispatch-entrypoints

Workerstarts voor ready-kaarten kunnen plaatsvinden vanuit:

- de dashboarddispatchactie
- `openclaw workboard dispatch`
- `/workboard dispatch` op een kanaal dat commando's ondersteunt

Alle drie de entrypoints gebruiken de Gateway-subagentruntime wanneer de Gateway
beschikbaar is. De CLI heeft één extra operatorfallback: als de Gateway offline is of
de Workboard-dispatchmethode niet beschikbaar stelt en er geen expliciet `--url`- of
`--token`-doel is opgegeven, voert deze data-only dispatch uit tegen lokale SQLite-
status. Die fallback kan afhankelijkheden promoveren, verouderde claims opschonen en runs met
time-out blokkeren, maar kan geen workers starten.

Bordmetadata kan orchestratie-instellingen bevatten zoals `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee` en `orchestratorProfile`.
OpenClaw registreert de orchestratie-intentie en stelt deze beschikbaar in workercontext; de
daadwerkelijke specificatie en decompositie gebeurt nog steeds via de normale
Workboard-tools.

## CLI en slash-commando

De Plugin registreert een root-CLI-commando:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` roept de draaiende Gateway aan zodat worker-starts dezelfde subagent-runtime gebruiken als het dashboard. Als de Gateway niet beschikbaar is, valt de opdracht terug op dispatch alleen met data, zodat dependency-promotie, opschoning van verouderde claims en blokkering bij time-outs nog steeds kunnen worden uitgevoerd. Auth-, permissie- en validatiefouten verschijnen nog steeds als opdrachtfouten, net als fouten voor expliciete `--url`- of `--token`-doelen.

De slash-command `/workboard` ondersteunt hetzelfde compacte operatorpad:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` en
`/workboard dispatch`. List en show zijn leesbewerkingen voor geautoriseerde opdrachtverzenders. Create en dispatch vereisen eigenaarsstatus op chatoppervlakken of een Gateway-client met `operator.write` of `operator.admin`.

Zie [Workboard CLI](/nl/cli/workboard) voor opdrachtvlaggen, JSON-uitvoer, Gateway-fallbackgedrag, ondubbelzinnige verwerking van id-prefixes, selectieregels voor dispatch en probleemoplossing.

## Synchronisatie van sessielevenscyclus

Kaarten kunnen worden gekoppeld aan bestaande dashboardsessies of aan de sessie die wordt aangemaakt wanneer je werk start vanaf een kaart. Gekoppelde kaarten tonen de sessielevenscyclus inline:
actief, verouderd, gekoppeld inactief, klaar, mislukt of ontbrekend.

Als de gekoppelde sessie ontbreekt, blijft de kaart voor context gekoppeld en biedt deze nog steeds startbediening zodat je werk opnieuw kunt starten in een nieuwe dashboardsessie. Als een actieve gekoppelde sessie geen recente activiteit meer rapporteert, markeert Workboard de kaart als verouderd en slaat het de markering op als kaartmetadata totdat de levenscyclus deze wist.

Je kunt ook een bestaande dashboardsessie vastleggen vanaf het tabblad Sessies met Toevoegen aan Workboard. De kaart wordt aan die sessie gekoppeld, gebruikt het sessielabel of de recente gebruikersprompt als titel en vult notities vooraf op basis van de recente gebruikersprompt plus de nieuwste assistentreactie wanneer chatgeschiedenis beschikbaar is.

Workboard volgt de gekoppelde sessie zolang de kaart nog in een actieve werkstatus staat:

- actieve gekoppelde sessie -> `running`
- voltooide gekoppelde sessie -> `review`
- mislukte, beëindigde, verlopen of afgebroken gekoppelde sessie -> `blocked`

Handmatige reviewstatussen winnen. Als je een kaart naar `review`, `blocked` of `done` verplaatst, stopt Workboard met het automatisch verplaatsen van die kaart totdat je deze terugzet naar `todo` of `running`.

## Dashboardworkflow

1. Open het tabblad Workboard in de Control UI.
2. Maak een kaart met een titel, notities, prioriteit, labels, optionele agent en optionele gekoppelde sessie.
3. Of open Sessies en kies Toevoegen aan Workboard voor een bestaande sessie.
4. Sleep de kaart tussen kolommen of focus de compacte statusbediening op de kaart en gebruik het menu of ArrowLeft/ArrowRight.
5. Start werk vanaf de kaart om een dashboardsessie te maken of opnieuw te gebruiken.
6. Open de gekoppelde sessie vanaf de kaart terwijl de agent werkt.
7. Laat levenscyclussynchronisatie actief werk naar review of geblokkeerd verplaatsen en verplaats de kaart daarna handmatig naar klaar wanneer deze is geaccepteerd.

Het starten van een kaart gebruikt normale Gateway-sessies. De Workboard-plugin slaat alleen kaartmetadata en koppelingen op; het gesprekstranscript, de modelselectie en de runlevenscyclus blijven eigendom van het reguliere sessiesysteem.

Gebruik Stoppen op een live gekoppelde kaart om de actieve sessierun af te breken. Workboard markeert die kaart als `blocked`, zodat deze zichtbaar blijft voor opvolging.

Nieuwe kaarten kunnen starten vanuit Workboard-sjablonen voor bugfixes, docs, releases, PR-reviews of pluginwerk. Sjablonen vullen titel, notities, labels en prioriteit vooraf in, en het geselecteerde sjabloon-id wordt opgeslagen als kaartmetadata.

## Permissies

De plugin registreert Gateway-RPC-methoden onder de naamruimte `workboard.*`:

- `workboard.cards.list` vereist `operator.read`
- `workboard.cards.export` vereist `operator.read`
- `workboard.cards.diagnostics` vereist `operator.read`
- `workboard.cards.diagnostics.refresh` vereist `operator.write`
- lijst/ophalen van bijlagen en lezen van notificatie-events vereisen `operator.read`
- voortgang van de notificatiecursor vereist `operator.write`
- aanmaken, bijwerken, verplaatsen, verwijderen, reageren, koppelen, dependency koppelen, bewijs, artefact, bijlage toevoegen/verwijderen, workerlog, protocolschending, claim, heartbeat, vrijgave, voltooien, blokkeren, deblokkeren, dispatch, bulk- en archiefmethoden vereisen `operator.write`

Browsers die zijn verbonden met alleen-lezen operatortoegang kunnen het bord bekijken, maar kunnen kaarten niet wijzigen.

## Configuratie

Workboard heeft momenteel geen plugin-specifieke configuratie. Schakel het in of uit met de standaard plugin-vermelding:

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

Schakel het weer uit met:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Probleemoplossing

### Het tabblad zegt dat Workboard niet beschikbaar is

Controleer het pluginbeleid:

```bash
openclaw plugins inspect workboard --runtime --json
```

Als `plugins.allow` is geconfigureerd, voeg dan `workboard` toe aan die allowlist. Als `plugins.deny` `workboard` bevat, verwijder dit dan voordat je de plugin inschakelt.

### Kaarten worden niet opgeslagen

Controleer of de browserverbinding `operator.write`-toegang heeft. Alleen-lezen operatorsessies kunnen kaarten weergeven, maar kunnen ze niet maken, bewerken, verplaatsen of verwijderen.

### Het starten van een kaart opent niet de verwachte sessie

Workboard maakt koppelingen naar normale dashboardsessies. Controleer de agent-id en gekoppelde sessie van de kaart en open daarna de weergave Sessies of Chat om de daadwerkelijke runstatus te bekijken.

### Dispatch start geen worker

Controleer of er ten minste één `ready`-kaart is zonder actieve claim:

```bash
openclaw workboard list --status ready
```

Als de CLI dispatch alleen met data meldt, start of herstart dan de Gateway en probeer het opnieuw. Dispatch alleen met data werkt de lokale bordstatus bij, maar kan geen subagent-worker-runs starten.

Kaarten kunnen ook worden overgeslagen wanneer een andere kaart voor dezelfde eigenaar of agent al actief is of wacht op review. Voltooi, blokkeer of geef dat actieve werk vrij voordat je meer werk voor dezelfde eigenaar dispatched.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Workboard CLI](/nl/cli/workboard)
- [Plugins](/nl/tools/plugin)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Sessies](/nl/concepts/session)
