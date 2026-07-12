---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - U wilt een naslagwerk voor alle registratiemethoden op OpenClawPluginApi
    - U zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Importmap, API-referentie voor registratie en SDK-architectuur
title: Overzicht van de Plugin-SDK
x-i18n:
    generated_at: "2026-07-12T09:15:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin-SDK is het getypeerde contract tussen plugins en de kern. Deze pagina is het
naslagwerk voor **wat u kunt importeren** en **wat u kunt registreren**.

<Note>
  Deze pagina is bedoeld voor pluginauteurs die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, moeten in plaats daarvan
  [Gateway-integraties voor externe apps](/nl/gateway/external-apps) gebruiken.
</Note>

<Tip>
Zoekt u in plaats daarvan een praktische handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins). Gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanalen, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor modelproviders, [CLI-backendplugins](/nl/plugins/cli-backend-plugins) voor lokale AI-CLI-backends, [Agent-harnasplugins](/nl/plugins/sdk-agent-harness) voor native agentuitvoerders en [Plugin-hooks](/nl/plugins/hooks) voor tool- of levenscyclushooks.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Hierdoor blijft het opstarten snel en
worden problemen met circulaire afhankelijkheden voorkomen. Geef voor kanaalspecifieke invoer-/bouwhulpmiddelen
de voorkeur aan `openclaw/plugin-sdk/channel-core`; gebruik `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde hulpmiddelen zoals
`buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het JSON Schema waarvan het kanaal eigenaar is via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de algemene bouwer. De meegeleverde
plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
schema's van meegeleverde kanalen. Verouderde compatibiliteitsexports blijven beschikbaar via
`plugin-sdk/channel-config-schema-legacy`; geen van beide subpaden voor meegeleverde schema's is een
patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgebonden gemaksinterfaces (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Meegeleverde plugins combineren algemene SDK-subpaden binnen hun eigen `api.ts`- /
  `runtime-api.ts`-barrels; kerngebruikers moeten deze pluginlokale
  barrels gebruiken of een nauw afgebakend algemeen SDK-contract toevoegen wanneer een behoefte daadwerkelijk
  kanaaloverschrijdend is.

Een kleine groep hulpinterfaces voor meegeleverde plugins verschijnt nog steeds in de gegenereerde export-
toewijzing wanneer het gebruik door de eigenaar wordt bijgehouden. Ze bestaan uitsluitend voor het onderhoud van
meegeleverde plugins en worden niet aanbevolen als importpaden voor nieuwe externe
plugins.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden gebruik door de eigenaar. Neem
deze importpaden niet over in nieuwe plugins; gebruik in plaats daarvan geïnjecteerde runtimehulpmiddelen en
algemene SDK-subpaden voor kanalen.
</Warning>

## Naslagwerk voor subpaden

De plugin-SDK wordt aangeboden als een verzameling nauw afgebakende subpaden, gegroepeerd per gebied (plugin-
invoer, kanaal, provider, authenticatie, runtime, capaciteit, geheugen en gereserveerde
hulpmiddelen voor meegeleverde plugins). Zie voor de volledige catalogus — gegroepeerd en met koppelingen —
[Subpaden van de plugin-SDK](/nl/plugins/sdk-subpaths).

De inventaris van compilerinvoerpunten staat in
`scripts/lib/plugin-sdk-entrypoints.json`; pakketexports worden gegenereerd vanuit
de openbare deelverzameling nadat de repo-lokale subpaden voor tests/intern gebruik uit
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` zijn verwijderd. Voer
`pnpm plugin-sdk:surface` uit om het aantal openbare exports te controleren. Verouderde openbare
subpaden die oud genoeg zijn en niet worden gebruikt door productiecode van meegeleverde extensies, worden
bijgehouden in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; brede
verouderde barrels voor herexport worden bijgehouden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## Registratie-API

De callback `register(api)` ontvangt een object `OpenClawPluginApi` met deze
methoden:

### Registratie van capaciteiten

| Methode                                          | Wat deze registreert                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Leases voor de levenscyclus van cloudworkers                                       |
| `api.registerModelCatalogProvider(...)`          | Modelcatalogusregels voor tekst- en mediageneratie                                 |
| `api.registerAgentHarness(...)`                  | [Experimentele](/nl/plugins/sdk-agent-harness) native agentuitvoerder (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend                                                       |
| `api.registerChannel(...)`                       | Berichtenkanaal                                                                    |
| `api.registerEmbeddingProvider(...)`             | Herbruikbare provider voor vector-embeddings                                       |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak-/STT-synthese                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | Realtime streamingtranscriptie                                                     |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies                                                      |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse van afbeeldingen/audio/video                                               |
| `api.registerTranscriptSourceProvider(...)`      | Bron voor live of geïmporteerde vergadertranscripten                               |
| `api.registerImageGenerationProvider(...)`       | Afbeeldingsgeneratie                                                               |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                                                                    |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                                                                     |
| `api.registerWebFetchProvider(...)`              | Provider voor ophalen/scrapen van webinhoud                                        |
| `api.registerWebSearchProvider(...)`             | Zoeken op het web                                                                  |
| `api.registerCompactionProvider(...)`            | Verwisselbare backend voor transcript-Compaction                                   |

Workerproviders moeten hun id ook declareren in `contracts.workerProviders`.
De kern slaat duurzame intentie op vóór `provision(profile, operationId)`. Providers valideren instellingen vóór externe toewijzing en werpen `WorkerProviderError` op bij permanente afwijzing van een profiel. `provision` moet dezelfde lease overnemen wanneer de bewerkings-id wordt herhaald.
De kern slaat de gevalideerde profielinstellingen samen met de lease op en levert die momentopname aan `destroy({ leaseId, profile })`, dat idempotent moet zijn, en `inspect({ leaseId, profile })`, dat `active`, `destroyed` of `unknown` retourneert. Hierdoor kunnen providers levenscyclusaanroepen routeren na een herstart van de Gateway of verwijdering van een benoemd profiel. SSH-eindpunten gebruiken een `SecretRef` voor `keyRef`, nooit rechtstreeks opgenomen sleutelmateriaal, en bevatten een `hostKey` uit vertrouwde provisioneringsuitvoer in exact de vorm `algorithm base64`, zonder hostnaam of opmerking. De kern legt `hostKey` vast en vertrouwt nooit een sleutel uit de eerste verbinding. Een provider die een dynamische `keyRef` aanmaakt, kan `resolveSshIdentity({ leaseId, profile, keyRef })` implementeren; indien aanwezig is die resolver gezaghebbend, terwijl providers zonder deze resolver de geconfigureerde algemene geheimresolver gebruiken.
Providers met verlengbare leases kunnen ook `renew(leaseId)` implementeren.
`inspect` moet een fout opwerpen bij tijdelijke of onbepaalde fouten; retourneer `unknown` uitsluitend bij gezaghebbende afwezigheid. De kern markeert een actieve lokale record als verweesd, of behandelt de afwezigheid als voltooiing van de afbraak na een opgeslagen vernietigingsverzoek.

Embeddingproviders die met `api.registerEmbeddingProvider(...)` zijn geregistreerd, moeten
ook worden vermeld in `contracts.embeddingProviders` in het pluginmanifest. Dit
is het algemene embeddingoppervlak voor herbruikbare vectorgeneratie. Geheugenzoeken
kan dit algemene provideroppervlak gebruiken. De oudere interface
`api.registerMemoryEmbeddingProvider(...)` en
`contracts.memoryEmbeddingProviders` is verouderde compatibiliteit terwijl
bestaande geheugenspecifieke providers worden gemigreerd.

Geheugenspecifieke providers die nog steeds een runtime-`batchEmbed(...)` aanbieden, blijven werken volgens
het bestaande batchcontract per bestand, tenzij hun runtime expliciet
`sourceWideBatchEmbed: true` instelt. Met deze opt-in kan de geheugenhost fragmenten uit
meerdere gewijzigde geheugenbestanden en ingeschakelde bronnen in één `batchEmbed(...)`-aanroep indienen,
tot aan de batchlimieten van de host. Batchadapters die JSONL-aanvraagbestanden uploaden, moeten
providertaken splitsen vóór zowel hun limiet voor uploadgrootte als hun limiet voor
het aantal aanvragen. De provider moet voor elk invoerfragment één embedding retourneren, in dezelfde volgorde als
`batch.chunks`; laat de vlag weg wanneer de provider batches per bestand verwacht of
de invoervolgorde niet kan behouden binnen een grotere bronbrede taak.

### Tools en opdrachten

Gebruik [`defineToolPlugin`](/nl/plugins/tool-plugins) voor eenvoudige plugins met alleen tools
en vaste toolnamen. Gebruik `api.registerTool(...)` rechtstreeks voor gemengde plugins
of volledig dynamische toolregistratie.

| Methode                                | Wat deze registreert                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Agenttool (vereist of `{ optional: true }`)                                                                                                    |
| `api.registerCommand(def)`             | Aangepaste opdracht (omzeilt de LLM)                                                                                                           |
| `api.registerNodeHostCommand(command)` | Opdracht die door `openclaw node run` wordt afgehandeld; optionele `agentTool`-metadata kan deze als een voor de agent zichtbare tool aanbieden terwijl de Node verbonden is |

Pluginopdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
door de opdracht beheerde routeringshint nodig heeft. Laat die tekst over de opdracht zelf gaan; voeg geen
provider- of pluginspecifiek beleid toe aan de promptbouwers van de kern.

Instructievermeldingen kunnen verouderde tekenreeksen zijn, die op elk promptoppervlak van toepassing zijn, of
gestructureerde vermeldingen:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Gestructureerde `surfaces` kunnen `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` of `subagent` bevatten. `pi_main` blijft een verouderde alias
voor `openclaw_main`. Laat `surfaces` weg voor instructies die bewust voor alle oppervlakken gelden. Geef
geen lege `surfaces`-array door; deze wordt afgewezen, zodat onbedoeld verlies van afbakening
niet leidt tot algemene prompttekst.

Native ontwikkelaarsinstructies voor de Codex-appserver zijn strenger dan andere prompt-
oppervlakken: alleen instructies die expliciet zijn afgebakend tot `codex_app_server` worden naar
die baan met hogere prioriteit gepromoveerd. Verouderde tekenreeksinstructies en niet-afgebakende gestructureerde
instructies blijven voor compatibiliteit beschikbaar voor promptoppervlakken die niet van Codex zijn.

Node-hostopdrachten worden uitgevoerd op de verbonden Node-host, niet binnen het Gateway-proces. Als `agentTool` aanwezig is, publiceert de Node na een geslaagde verbinding met de Gateway een descriptor; de Gateway stelt deze alleen beschikbaar aan agentuitvoeringen zolang die Node verbonden is en alleen als de `command` van de descriptor deel uitmaakt van het goedgekeurde opdrachtoppervlak van de Node. Stel `agentTool.defaultPlatforms` in om een niet-gevaarlijke opdracht toe te voegen aan de standaardtoelatingslijst voor Node-opdrachten; anders is een expliciete `gateway.nodes.allowCommands` of een Node-aanroepbeleid vereist. `agentTool.name` moet veilig zijn voor providers: begin met een letter, gebruik uitsluitend letters, cijfers, underscores of koppeltekens en blijf binnen 64 tekens. Door MCP ondersteunde Node-tools kunnen `agentTool.mcp`-metadata instellen, zodat catalogus- en toolzoekoppervlakken de identiteit van de externe MCP-server/tool kunnen tonen, maar de uitvoering verloopt nog steeds via de aangekondigde Node-opdracht.

### Infrastructuur

| Methode                                         | Wat deze registreert                                                |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Gebeurtenishook                                                     |
| `api.registerHttpRoute(params)`                 | HTTP-eindpunt van de Gateway                                        |
| `api.registerGatewayMethod(name, handler)`      | RPC-methode van de Gateway                                          |
| `api.registerGatewayDiscoveryService(service)`  | Lokale adverteerder voor Gateway-detectie                            |
| `api.registerCli(registrar, opts?)`             | CLI-subopdracht                                                      |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI voor Node-functionaliteit onder `openclaw nodes`                 |
| `api.registerService(service)`                  | Achtergrondservice                                                  |
| `api.registerInteractiveHandler(registration)`  | Interactieve handler                                                |
| `api.registerAgentToolResultMiddleware(...)`    | Runtime-middleware voor toolresultaten                               |
| `api.registerMemoryPromptSupplement(builder)`   | Aanvullende promptsectie naast het geheugen                          |
| `api.registerMemoryCorpusSupplement(adapter)`   | Aanvullend corpus voor zoeken/lezen in het geheugen                  |
| `api.registerHostedMediaResolver(resolver)`     | Resolver voor browserachtige URL's van gehoste media                 |
| `api.registerTextTransforms(transforms)`        | Door de Plugin beheerde compatibiliteitsherschrijvingen van prompt-/berichttekst |
| `api.registerConfigMigration(migrate)`          | Lichtgewicht configuratiemigratie die wordt uitgevoerd voordat de Plugin-runtime wordt geladen |
| `api.registerMigrationProvider(provider)`       | Importfunctie voor `openclaw migrate`                                |
| `api.registerAutoEnableProbe(probe)`            | Configuratiecontrole die deze Plugin automatisch kan inschakelen     |
| `api.registerReload(registration)`              | Beleid per configuratieprefix voor herstart/hot/noop bij herladen    |
| `api.registerNodeHostCommand(command)`          | Opdrachthandler die aan gekoppelde Nodes wordt aangeboden            |
| `api.registerNodeInvokePolicy(policy)`          | Toelatingslijst-/goedkeuringsbeleid voor door Nodes aangeroepen opdrachten |
| `api.registerSecurityAuditCollector(collector)` | Bevindingenverzamelaar voor `openclaw security audit`                |

Builders voor geheugenpromptaanvullingen ontvangen optionele context voor `agentId`, `agentSessionKey` en `sandboxed`. Aanroepen van `search` en `get` voor aanvullingen op het geheugencorpus ontvangen optionele context voor `agentId` en `sandboxed`. Plugins met door agents beheerde opslag moeten die opslag voor elke aanroep bepalen in plaats van tijdens de registratie één globaal pad vast te leggen. Als een agent-id vereist is maar ontbreekt bij een multi-agentbewerking, moet de bewerking gesloten mislukken in plaats van een willekeurige agent te kiezen.

Interactieve handlers van Telegram kunnen `{ submitText }` retourneren om tekst na een geslaagde handler via het normale inkomende agentpad van Telegram te routeren. OpenClaw behoudt de terugbelknop wanneer het beleid voor inkomende berichten de tekst overslaat of de verwerking mislukt, zodat de gebruiker het opnieuw kan proberen nadat de blokkerende omstandigheid is gewijzigd. Dit resultaatveld is specifiek voor Telegram; andere kanalen behouden hun eigen contracten voor interactieve resultaten.

### Hosthooks voor workflow-Plugins

Hosthooks zijn de SDK-aansluitpunten voor Plugins die aan de levenscyclus van de host moeten deelnemen in plaats van alleen een provider, kanaal of tool toe te voegen. Het zijn generieke contracten; Plan Mode kan ze gebruiken, maar dat geldt ook voor goedkeuringsworkflows, beleidscontroles voor werkruimten, achtergrondmonitors, installatiewizards en aanvullende UI-Plugins.

| Methode                                                                              | Contract waarvoor deze verantwoordelijk is                                                                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Door de Plugin beheerde, JSON-compatibele sessiestatus die via Gateway-sessies wordt geprojecteerd                                                          |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Duurzame, exact eenmaal in de volgende agentbeurt geïnjecteerde context voor één sessie                                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | Door het manifest afgeschermd, vertrouwd toolbeleid vóór Plugins dat toolparameters kan blokkeren of herschrijven                                           |
| `api.registerToolMetadata(...)`                                                      | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                                              |
| `api.registerCommand(...)`                                                           | Afgebakende Plugin-opdrachten; opdrachtresultaten kunnen `continueAgent: true` of `suppressReply: true` instellen; native Discord-opdrachten ondersteunen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bijdragedescriptors voor de Control UI voor sessie-, tool-, uitvoerings-, instellingen- of tabbladoppervlakken                                              |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Opschooncallbacks voor door Plugins beheerde runtimebronnen bij reset-, verwijderings- en herlaadpaden                                                      |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Opgeschoonde gebeurtenisabonnementen voor workflowstatus en monitors                                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Tijdelijke Plugin-status per uitvoering die wordt gewist bij de terminale levenscyclus van de uitvoering                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Opschoonmetadata voor door Plugins beheerde schedulertaken; plant geen werk en maakt geen taakrecords                                                       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Alleen voor gebundelde Plugins beschikbare, door de host bemiddelde levering van bestandsbijlagen aan de actieve directe uitgaande sessieroute              |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Alleen voor gebundelde Plugins beschikbare, door Cron ondersteunde geplande sessiebeurten met opschoning op basis van tags                                  |
| `api.session.controls.registerSessionAction(...)`                                    | Getypeerde sessieacties die clients via de Gateway kunnen uitvoeren                                                                                        |

Een descriptor met `surface: "tab"` voegt een zijbalktabblad toe aan de Control UI. Tabbladdescriptors van actieve Plugins worden in de hello van de Gateway (`controlUiTabs`) aangekondigd aan dashboardclients, zodat het tabblad alleen verschijnt wanneer de Plugin is ingeschakeld. Gebundelde Plugins kunnen een volwaardige dashboardweergave voor hun tabblad leveren; andere Plugins kunnen `path` instellen op een HTTP-route van de Plugin (zie `api.registerHttpRoute(...)`) die het dashboard in een gesandboxed frame weergeeft. `icon` is een hint voor de naam van een dashboardpictogram, `group` kiest de zijbalksectie (`control` of `agent`), `order` bepaalt de sortering tussen Plugin-tabbladen en `requiredScopes` verbergt het tabblad voor verbindingen zonder die operatorbereiken:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Gebruik de gegroepeerde naamruimten voor nieuwe Plugin-code:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

De gelijkwaardige platte methoden blijven beschikbaar als verouderde compatibiliteitsaliassen voor bestaande Plugins. Voeg geen nieuwe Plugin-code toe die rechtstreeks `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` of `api.unscheduleSessionTurnsByTag` aanroept.

`scheduleSessionTurn(...)` is een sessiegebonden gemakslaag boven op de Cron-planner van de Gateway. Cron beheert de timing en maakt het achtergrondtaakrecord wanneer de beurt wordt uitgevoerd; de Plugin SDK beperkt alleen de doelsessie, de door de Plugin beheerde naamgeving en de opschoning. Gebruik `api.runtime.tasks.managedFlows` binnen de geplande beurt wanneer het werk zelf duurzame Task Flow-status met meerdere stappen vereist.

De contracten scheiden de bevoegdheden bewust:

- Externe Plugins kunnen sessie-uitbreidingen, UI-descriptors, opdrachten, toolmetadata, injecties voor de volgende beurt en normale hooks beheren.
- Vertrouwd toolbeleid wordt vóór gewone `before_tool_call`-hooks uitgevoerd en wordt door de host vertrouwd. Gebundeld beleid wordt eerst uitgevoerd; beleid van geïnstalleerde Plugins vereist expliciete inschakeling plus de bijbehorende lokale id's in `contracts.trustedToolPolicies` en wordt daarna uitgevoerd in de laadvolgorde van de Plugins. Beleids-id's zijn afgebakend tot de registrerende Plugin.
- Eigendom van gereserveerde opdrachten is uitsluitend voor gebundelde Plugins. Externe Plugins moeten hun eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptwijzigende hooks uit, waaronder `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, promptvelden van de verouderde `before_agent_start` en `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-gebruikers:

| Pluginarchetype               | Gebruikte hooks                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Goedkeuringsworkflow          | Sessie-uitbreiding, voortzetting van opdrachten, injectie in de volgende beurt, UI-descriptor                                              |
| Beleidscontrole voor budget/werkruimte | Beleid voor vertrouwde tools, toolmetadata, sessieprojectie                                                                      |
| Levenscyclusmonitor op de achtergrond | Opschoning van de runtimelevenscyclus, abonnement op agentgebeurtenissen, eigendom/opschoning van de sessieplanner, bijdrage aan Heartbeat-prompt, UI-descriptor |
| Configuratie- of onboardingwizard | Sessie-uitbreiding, bereikgebonden opdrachten, descriptor voor de Control UI                                                          |

<Note>
  Gereserveerde kernnaamruimten voor beheer (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een Plugin probeert een
  beperkter bereik voor een Gateway-methode toe te wijzen. Geef voorrang aan
  Plugin-specifieke voorvoegsels voor methoden die eigendom zijn van een Plugin.
</Note>

<Accordion title="Wanneer middleware voor toolresultaten gebruiken">
  Meegeleverde Plugins en expliciet ingeschakelde geïnstalleerde Plugins met
  overeenkomende manifestcontracten kunnen
  `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze een
  toolresultaat na uitvoering en voordat de runtime dat resultaat aan het model
  teruggeeft, moeten herschrijven. Dit is het vertrouwde, runtimeneutrale
  koppelvlak voor asynchrone uitvoerreducers zoals tokenjuice.

Plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
beoogde runtime, bijvoorbeeld `["openclaw", "codex"]`. Geïnstalleerde Plugins
zonder dat contract, of zonder expliciete inschakeling, kunnen deze middleware
niet registreren; gebruik de normale OpenClaw-Pluginhooks voor werk waarvoor
timing van toolresultaten vóór het model niet nodig is. Het oude
registratiepad voor uitbreidingsfactory's dat uitsluitend voor de ingebedde
runner bestemd was, is verwijderd.
</Accordion>

### Gateway-discoveryregistratie

Met `api.registerGatewayDiscoveryService(...)` kan een Plugin de actieve
Gateway adverteren via een lokaal discoverytransport zoals mDNS/Bonjour.
OpenClaw roept de service aan tijdens het opstarten van de Gateway wanneer
lokale discovery is ingeschakeld, geeft de huidige Gateway-poorten en
niet-geheime TXT-hintgegevens door en roept tijdens het afsluiten van de
Gateway de geretourneerde `stop`-handler aan.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway-discoveryplugins mogen geadverteerde TXT-waarden niet als geheimen of
authenticatie behandelen. Discovery is een routeringshint; Gateway-authenticatie
en TLS-pinning blijven verantwoordelijk voor vertrouwen.

### Metadata voor CLI-registratie

`api.registerCli(registrar, opts?)` accepteert twee soorten opdrachtmetadata:

- `commands`: expliciete opdrachtnamen waarvan de registrar eigenaar is
- `descriptors`: opdrachtdescriptors voor de parsefase, gebruikt voor CLI-help,
  routering en luie registratie van de Plugin-CLI
- `parentPath`: optioneel pad naar de bovenliggende opdracht voor geneste
  opdrachtgroepen, zoals `["nodes"]`

Geef voor functies voor gekoppelde Nodes de voorkeur aan
`api.registerNodeCliFeature(registrar, opts?)`. Dit is een kleine wrapper rond
`api.registerCli(..., { parentPath: ["nodes"] })` die opdrachten zoals
`openclaw nodes canvas` expliciet als Node-functies van een Plugin markeert.

Als een Plugin-opdracht lui geladen moet blijven in het normale hoofdpad van de
CLI, geef dan `descriptors` op die elke hoofdopdracht op het hoogste niveau
dekken die door die registrar wordt beschikbaar gesteld.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix-accounts, verificatie, apparaten en profielstatus beheren",
        hasSubcommands: true,
      },
    ],
  },
);
```

Geneste opdrachten ontvangen de gevonden bovenliggende opdracht als `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Canvasinhoud vastleggen of renderen vanaf een gekoppelde Node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gebruik alleen `commands` wanneer luie registratie van de hoofd-CLI niet nodig
is. Dat gretige compatibiliteitspad blijft ondersteund, maar installeert geen
door descriptors ondersteunde tijdelijke aanduidingen voor lui laden tijdens
de parsefase.

### Registratie van CLI-backends

Met `api.registerCliBackend(...)` kan een Plugin eigenaar zijn van de
standaardconfiguratie voor een lokale AI-CLI-backend zoals `claude-cli` of
`my-cli`.

- De `id` van de backend wordt het providervoorvoegsel in modelverwijzingen
  zoals `my-cli/gpt-5`.
- De `config` van de backend gebruikt dezelfde vorm als
  `agents.defaults.cliBackends.<id>`.
- De gebruikersconfiguratie heeft nog steeds voorrang. OpenClaw voegt
  `agents.defaults.cliBackends.<id>` samen over de standaardwaarde van de
  Plugin voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend na het samenvoegen
  compatibiliteitsherschrijvingen nodig heeft (bijvoorbeeld voor het
  normaliseren van oude vlagvormen).
- Gebruik `resolveExecutionArgs` voor verzoekgebonden herschrijvingen van argv
  die bij het CLI-dialect horen, zoals het omzetten van OpenClaw-denkniveaus
  naar een systeemeigen inspanningsvlag. De hook ontvangt `ctx.executionMode`;
  gebruik `"side-question"` om systeemeigen isolatievlaggen van de backend toe
  te voegen voor tijdelijke `/btw`-aanroepen. Als die vlaggen systeemeigen tools
  betrouwbaar uitschakelen voor een CLI waarop ze anders altijd actief zijn,
  declareer dan ook `sideQuestionToolMode: "disabled"`.
- Backends die alle systeemeigen tools voor een specifieke uitvoering kunnen
  uitschakelen, mogen `nativeToolMode: "selectable"` declareren. Beperkte
  aanroepen geven een lege `ctx.toolAvailability.native`-tuple plus een exacte,
  door de host geïsoleerde MCP-toelatingslijst door; `resolveExecutionArgs`
  moet beide afdwingen op de uiteindelijke argv voor een nieuwe of hervatte
  uitvoering. OpenClaw weigert standaard als de backend dit niet kan doen.

Zie voor een volledige ontwerphandleiding
[Plugins voor CLI-backends](/nl/plugins/cli-backend-plugins).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Contextengine (één tegelijk actief). Levenscycluscallbacks ontvangen `runtimeSettings` wanneer de host model-/provider-/modusdiagnostiek kan leveren; oudere strikte engines worden opnieuw geprobeerd zonder die sleutel. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapaciteit                                                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Builder voor het geheugenpromptgedeelte                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor het geheugenflushplan                                                                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter voor de geheugenruntime                                                                                                                                                                               |

### Verouderde adapters voor geheugen-embeddings

| Methode                                        | Wat deze registreert                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter voor geheugen-embeddings voor de actieve Plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve
  geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)`
  beschikbaar stellen, zodat begeleidende Plugins geëxporteerde
  geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van toegang te zoeken tot de
  privé-indeling van een specifieke geheugenplugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn oudere, compatibele API's voor exclusieve
  geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastzetten op een exacte
  `provider/model`-verwijzing, zoals `ollama/qwen3:8b`, zonder de actieve
  fallbackketen over te nemen.
- `registerMemoryEmbeddingProvider` is verouderd. Nieuwe embeddingproviders
  moeten `api.registerEmbeddingProvider(...)` en
  `contracts.embeddingProviders` gebruiken.
- Bestaande geheugenspecifieke providers blijven tijdens de migratieperiode
  werken, maar Plugin-inspectie rapporteert dit als compatibiliteitsschuld voor
  niet-meegeleverde Plugins.

### Gebeurtenissen en levenscyclus

| Methode                                      | Wat deze doet                   |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte levenscyclushook        |
| `api.onConversationBindingResolved(handler)` | Callback voor gesprekskoppeling |

Zie [Pluginhooks](/nl/plugins/hooks) voor voorbeelden, algemene hooknamen en
bewakingssemantiek.

### Beslissingssemantiek van hooks

`before_install` is een levenscyclushook van de Plugin-runtime, niet het
installatiebeleidsoppervlak voor de operator. Gebruik `security.installPolicy`
wanneer een toestaan/blokkeren-beslissing zowel CLI- als door de Gateway
ondersteunde installatie- of updatepaden moet omvatten.

- `before_tool_call`: het retourneren van `{ block: true }` is definitief. Zodra een handler dit instelt, worden handlers met een lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `before_install`: het retourneren van `{ block: true }` is definitief. Zodra een handler dit instelt, worden handlers met een lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is definitief. Zodra een handler de verzending claimt, worden handlers met een lagere prioriteit en het standaardpad voor verzending naar het model overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is definitief. Zodra een handler dit instelt, worden handlers met een lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een overschrijving.
- `message_received`: gebruik het getypeerde veld `threadId` wanneer u routering van inkomende threads/onderwerpen nodig hebt. Gebruik `metadata` voor kanaalspecifieke aanvullingen.
- `message_sending`: gebruik eerst de getypeerde routeringsvelden `replyToId` / `threadId` voordat u terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor opstartstatus die door de Gateway wordt beheerd, in plaats van te vertrouwen op interne `gateway:startup`-hooks. Cron wordt op dit moment mogelijk nog geladen.
- `cron_reconciled`: bouw na het opstarten of opnieuw laden van de planner een volledige externe Cron-projectie opnieuw op. Deze bevat `reason` en de effectieve status `enabled`, inclusief `enabled: false`, terwijl `ctx.getCron?.()` de exact gereconcilieerde planner retourneert. Geef `ctx.abortSignal` door aan duurzame projectiewerkzaamheden; dit signaal wordt afgebroken wanneer die momentopname van de planner wordt vervangen of de Gateway wordt gesloten.
- `cron_changed`: observeer wijzigingen in de door de Gateway beheerde Cron-levenscyclus. Gebeurtenissen `scheduled` en `removed` zijn reconciliatieaanwijzingen na het vastleggen, geen geordend deltalogboek. Bij een geplande gebeurtenis ontbreekt `event.nextRunAtMs` wanneer de taak geen volgend wekmoment heeft; een verwijderde gebeurtenis bevat nog steeds de momentopname van de verwijderde taak.

Externe wekplanners moeten `cron_changed`-gebeurtenissen debouncen of samenvoegen
en vervolgens de volledige duurzame weergave opnieuw lezen uit de planner die
het laatst door `cron_reconciled` is vastgelegd. Neem de planner niet over uit
een `cron_changed`-context: een losgekoppelde aanwijzing van een oudere planner
kan overlappen met een latere herlaadbewerking.

Gebruik `cron_reconciled` als trigger voor een volledige momentopname van duurzame
status die wordt geladen bij het opstarten van de Gateway of bij vervanging van
de planner. Deze wordt niet opnieuw afgespeeld bij een hot-reload van uitsluitend
een Plugin. Observatiehandlers worden parallel uitgevoerd en fire-and-forget-
verzendingen kunnen overlappen, dus gebruikers mogen niet afhankelijk zijn van
de volgorde waarin gebeurtenissen worden voltooid. Houd OpenClaw als de
gezaghebbende bron voor controles op vervaldatums en uitvoering.

Zie [Veilige externe Cron-projectie](/nl/plugins/hooks#safe-external-cron-projection)
voor een single-flight-adapter met duurzame vervanging, opnieuw proberen/back-off
en netjes afsluiten.

### Velden van het API-object

| Veld                     | Type                      | Beschrijving                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                         |
| `api.name`               | `string`                  | Weergavenaam                                                                                      |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                         |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                                   |
| `api.source`             | `string`                  | Pad naar de Plugin-bron                                                                           |
| `api.rootDir`            | `string?`                 | Hoofdmap van de Plugin (optioneel)                                                                |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiemomentopname (actieve momentopname van de runtime in het geheugen, indien beschikbaar) |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspecifieke configuratie uit `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                           |
| `api.logger`             | `PluginLogger`            | Logger met beperkt bereik (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/installatievenster vóór de volledige invoer |
| `api.resolvePath(input)` | `(string) => string`      | Pad relatief ten opzichte van de hoofdmap van de Plugin omzetten                                  |

## Conventie voor interne modules

Gebruik binnen uw Plugin lokale barrel-bestanden voor interne imports:

```text
my-plugin/
  api.ts            # Openbare exports voor externe gebruikers
  runtime-api.ts    # Runtime-exports uitsluitend voor intern gebruik
  index.ts          # Ingangspunt van de Plugin
  setup-entry.ts    # Licht ingangspunt uitsluitend voor installatie (optioneel)
```

<Warning>
  Importeer uw eigen Plugin in productiecode nooit via
  `openclaw/plugin-sdk/<your-plugin>`. Leid interne imports via `./api.ts` of
  `./runtime-api.ts`. Het SDK-pad is uitsluitend het externe contract.
</Warning>

Openbare oppervlakken van gebundelde Plugins die via een facade worden geladen
(`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` en vergelijkbare
openbare invoerbestanden) geven de voorkeur aan de actieve momentopname van de
runtimeconfiguratie wanneer OpenClaw al actief is. Als er nog geen
runtime-momentopname bestaat, vallen ze terug op het opgeloste
configuratiebestand op schijf. Verpakte facades van gebundelde Plugins moeten
worden geladen via de Plugin-facadeladers van OpenClaw; rechtstreekse imports
uit `dist/extensions/...` omzeilen de manifest- en runtime-sidecarcontroles die
verpakte installaties gebruiken voor code die eigendom is van een Plugin.

Provider-Plugins kunnen een beperkt lokaal contract-barrelbestand van de Plugin
beschikbaar stellen wanneer een helper bewust providerspecifiek is en nog niet
thuishoort in een generiek SDK-subpad. Gebundelde voorbeelden:

- **Anthropic**: openbare scheiding via `api.ts` / `contract-api.ts` voor Claude-
  helpers voor betaheaders en `service_tier`-streams.
- **`@openclaw/openai-provider`**: `api.ts` exporteert providerbouwers,
  helpers voor standaardmodellen en bouwers voor realtimeproviders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de providerbouwer
  plus helpers voor onboarding/configuratie.

<Warning>
  Productiecode van extensies moet ook imports uit
  `openclaw/plugin-sdk/<other-plugin>` vermijden. Als een helper daadwerkelijk
  wordt gedeeld, promoveer deze dan naar een neutraal SDK-subpad, zoals
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  op mogelijkheden gericht oppervlak, in plaats van twee Plugins aan elkaar
  te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Ingangspunten" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    Opties voor `definePluginEntry` en `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-helpers" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige naslag voor de naamruimte `api.runtime`.
  </Card>
  <Card title="Installatie en configuratie" icon="sliders" href="/nl/plugins/sdk-setup">
    Verpakking, manifesten en configuratieschema's.
  </Card>
  <Card title="Testen" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en lintregels.
  </Card>
  <Card title="SDK-migratie" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Interne werking van Plugins" icon="diagram-project" href="/nl/plugins/architecture">
    Uitgebreide architectuur en het mogelijkhedenmodel.
  </Card>
</CardGroup>
