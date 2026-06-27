---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - Je wilt een referentie voor alle registratiemethoden op OpenClawPluginApi
    - Je zoekt een specifieke SDK-export
sidebarTitle: Plugin SDK overview
summary: Importmap, referentie voor registratie-API en SDK-architectuur
title: Plugin SDK-overzicht
x-i18n:
    generated_at: "2026-06-27T18:06:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De Plugin SDK is het getypeerde contract tussen plugins en core. Deze pagina is de
referentie voor **wat je importeert** en **wat je kunt registreren**.

<Note>
  Deze pagina is bedoeld voor pluginauteurs die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Gebruik voor externe apps, scripts, dashboards, CI-taken
  en IDE-extensies die agents via de Gateway willen uitvoeren in plaats daarvan
  [Gateway-integraties voor externe apps](/nl/gateway/external-apps).
</Note>

<Tip>
Zoek je in plaats hiervan een praktische handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins, [CLI-backendplugins](/nl/plugins/cli-backend-plugins) voor lokale AI CLI-backends, en [Plugin hooks](/nl/plugins/hooks) voor tool- of lifecycle-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanaf een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Geef voor kanaalspecifieke
entry-/buildhelpers de voorkeur aan `openclaw/plugin-sdk/channel-core`; bewaar
`openclaw/plugin-sdk/core` voor het bredere overkoepelende oppervlak en gedeelde
helpers zoals `buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het JSON Schema dat eigendom is van het kanaal
via `openclaw.plugin.json#channelConfigs`. Het subpad
`plugin-sdk/channel-config-schema` is bedoeld voor gedeelde schemaprimitieven en
de generieke builder. De gebundelde plugins van OpenClaw gebruiken
`plugin-sdk/bundled-channel-config-schema` voor behouden gebundelde
kanaalschema's. Verouderde compatibiliteitsexports blijven beschikbaar op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schemapaden
is een patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgebonden gemaksovergangen (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde plugins stellen generieke SDK-subpaden samen binnen hun eigen
  `api.ts`- / `runtime-api.ts`-barrels; core-consumers moeten die pluginlokale
  barrels gebruiken of een smal generiek SDK-contract toevoegen wanneer een
  behoefte werkelijk kanaaloverstijgend is.

Een kleine set helperovergangen voor gebundelde plugins verschijnt nog steeds in
de gegenereerde exportmap wanneer ze bijgehouden owner-gebruik hebben. Ze
bestaan alleen voor onderhoud van gebundelde plugins en worden niet aanbevolen
als importpaden voor nieuwe plugins van derden.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden
owner-gebruik. Kopieer die importpaden niet naar nieuwe plugins; gebruik in
plaats daarvan geinjecteerde runtimehelpers en generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De Plugin SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd
per gebied (plugin-entry, kanaal, provider, auth, runtime, capability, memory en
gereserveerde helpers voor gebundelde plugins). Zie voor de volledige catalogus,
gegroepeerd en gelinkt, [Plugin SDK-subpaden](/nl/plugins/sdk-subpaths).

De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset nadat repo-lokale test-/interne subpaden uit
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` zijn afgetrokken. Voer
`pnpm plugin-sdk:surface` uit om het aantal publieke exports te auditen.
Verouderde publieke subpaden die oud genoeg zijn en niet worden gebruikt door
productiecode van gebundelde extensies worden bijgehouden in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; brede verouderde
re-exportbarrels worden bijgehouden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat deze registreert                    |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                   |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentexecutor   |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend            |
| `api.registerChannel(...)`                       | Berichtenkanaal                         |
| `api.registerEmbeddingProvider(...)`             | Herbruikbare provider voor vectorembeddings |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak- / STT-synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie         |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies           |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                          |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                         |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                          |
| `api.registerWebFetchProvider(...)`              | Provider voor webfetching / scraping    |
| `api.registerWebSearchProvider(...)`             | Webzoekopdracht                         |

Embeddingproviders die met `api.registerEmbeddingProvider(...)` zijn
geregistreerd, moeten ook worden vermeld in `contracts.embeddingProviders` in
het pluginmanifest. Dit is het generieke embeddingoppervlak voor herbruikbare
vectorgeneratie. Memory-zoeken kan dit generieke provideroppervlak gebruiken. De
oudere overgang `api.registerMemoryEmbeddingProvider(...)` en
`contracts.memoryEmbeddingProviders` is verouderde compatibiliteit terwijl
bestaande memoryspecifieke providers migreren.

Memoryspecifieke providers die nog steeds een runtime `batchEmbed(...)` bieden,
blijven op het bestaande batchcontract per bestand, tenzij hun runtime expliciet
`sourceWideBatchEmbed: true` instelt. Die opt-in laat de memoryhost chunks uit
meerdere vuile memorybestanden en ingeschakelde bronnen in een enkele
`batchEmbed(...)`-aanroep indienen tot aan de batchlimieten van de host.
Batchadapters die JSONL-aanvraagbestanden uploaden, moeten providertaken splitsen
vóór zowel hun uploadgroottelimiet als hun aanvraaglimiet. De provider moet één
embedding per invoerchunk retourneren in dezelfde volgorde als `batch.chunks`;
laat de vlag weg wanneer de provider bestandslokale batches verwacht of de
invoervolgorde over een grotere bronbrede taak niet kan behouden.

### Tools en opdrachten

Gebruik [`defineToolPlugin`](/nl/plugins/tool-plugins) voor eenvoudige plugins met
alleen tools en vaste toolnamen. Gebruik `api.registerTool(...)` rechtstreeks
voor gemengde plugins of volledig dynamische toolregistratie.

| Methode                         | Wat deze registreert                          |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)   |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)          |

Pluginopdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een
korte, opdrachtgebonden routinghint nodig heeft. Houd die tekst gericht op de
opdracht zelf; voeg geen provider- of pluginspecifiek beleid toe aan
core-promptbuilders.

Guidance-items kunnen legacy-strings zijn, die op elk promptoppervlak van
toepassing zijn, of gestructureerde items:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Gestructureerde `surfaces` mogen `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` of `subagent` bevatten. `pi_main` blijft een
verouderde alias voor `openclaw_main`. Laat `surfaces` weg voor bewust
alle-oppervlakken-guidance. Geef geen lege `surfaces`-array door; die wordt
geweigerd zodat onbedoeld scopeverlies geen globale prompttekst wordt.

Native Codex app-server ontwikkelaarsinstructies zijn strenger dan andere
promptoppervlakken: alleen guidance die expliciet is gescopet naar
`codex_app_server` wordt naar die baan met hogere prioriteit gepromoveerd.
Legacy-stringguidance en ongescopete gestructureerde guidance blijven voor
compatibiliteit beschikbaar voor niet-Codex-promptoppervlakken.

### Infrastructuur

| Methode                                        | Wat deze registreert                    |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP-eindpunt                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                     |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discovery-adverteerder   |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                         |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-functie-CLI onder `openclaw nodes` |
| `api.registerService(service)`                 | Achtergrondservice                      |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                    |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve promptsectie naast memory     |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additieve memory-zoek-/leescorpus       |

### Host hooks voor workflowplugins

Host hooks zijn de SDK-overgangen voor plugins die moeten deelnemen aan de
host-lifecycle in plaats van alleen een provider, kanaal of tool toe te voegen.
Het zijn generieke contracten; Plan-modus kan ze gebruiken, maar dat geldt ook
voor goedkeuringsworkflows, workspace-beleidscontroles, achtergrondmonitors,
setupwizards en begeleidende UI-plugins.

| Methode                                                                              | Contract dat deze beheert                                                                                                         |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Door Plugin beheerde, JSON-compatibele sessiestatus geprojecteerd via Gateway-sessies                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Duurzame, exact-eenmalige context die in de volgende agentbeurt voor één sessie wordt geïnjecteerd                                |
| `api.registerTrustedToolPolicy(...)`                                                 | Door manifest afgeschermd vertrouwd pre-plugin-toolbeleid dat toolparameters kan blokkeren of herschrijven                        |
| `api.registerToolMetadata(...)`                                                      | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                    |
| `api.registerCommand(...)`                                                           | Afgebakende pluginopdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen; Discord-native opdrachten ondersteunen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Control UI-bijdragedescriptors voor sessie-, tool-, run- of instellingenoppervlakken                                              |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup-callbacks voor door Plugin beheerde runtimebronnen op reset-/delete-/reload-paden                                        |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Geschoonde gebeurtenisabonnementen voor workflowstatus en monitors                                                                |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Per-run plugin-scratchstatus die wordt gewist tijdens de terminale run-levenscyclus                                               |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanup-metadata voor door Plugin beheerde schedulertaken; plant geen werk en maakt geen taakrecords aan                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Alleen gebundelde, door host bemiddelde aflevering van bestandsbijlagen naar de actieve direct-uitgaande sessieroute              |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Alleen gebundelde, door Cron ondersteunde geplande sessiebeurten plus taggebaseerde cleanup                                       |
| `api.session.controls.registerSessionAction(...)`                                    | Getypte sessieacties die clients via de Gateway kunnen dispatchen                                                                 |

Gebruik de gegroepeerde namespaces voor nieuwe plugincode:

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

De equivalente platte methoden blijven beschikbaar als verouderde compatibiliteitsaliassen
voor bestaande plugins. Voeg geen nieuwe plugincode toe die
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` of
`api.unscheduleSessionTurnsByTag` rechtstreeks aanroept.

`scheduleSessionTurn(...)` is een sessiegebonden hulpmethode boven op de Gateway
Cron-scheduler. Cron beheert timing en maakt het achtergrondtaakrecord aan wanneer de
beurt wordt uitgevoerd; de Plugin SDK beperkt alleen de doelsessie, door Plugin beheerde
naamgeving en cleanup. Gebruik `api.runtime.tasks.managedFlows` binnen de geplande
beurt wanneer het werk zelf duurzame meerstaps Task Flow-status nodig heeft.

De contracten splitsen bevoegdheden bewust op:

- Externe plugins kunnen eigenaar zijn van sessie-uitbreidingen, UI-descriptors, opdrachten, toolmetadata, injecties voor de volgende beurt en normale hooks.
- Vertrouwd toolbeleid wordt uitgevoerd vóór gewone `before_tool_call`-hooks en wordt
  door de host vertrouwd. Gebundeld beleid wordt eerst uitgevoerd; beleid van geïnstalleerde plugins vereist
  expliciete inschakeling plus hun lokale id's in
  `contracts.trustedToolPolicies`, en wordt daarna uitgevoerd in plugin-laadvolgorde. Beleids-id's
  zijn afgebakend tot de registrerende Plugin.
- Gereserveerd opdrachteigendom is alleen voor gebundelde plugins. Externe plugins moeten hun
  eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptwijzigende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden uit legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Plugin-archetype           | Gebruikte hooks                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Goedkeuringsworkflow       | Sessie-uitbreiding, opdrachtvoortzetting, injectie voor volgende beurt, UI-descriptor                                               |
| Budget-/workspace-beleidshek | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                               |
| Achtergrondlevenscyclusmonitor | Runtimelevenscyclus-cleanup, agentgebeurtenisabonnement, eigendom/cleanup van sessiescheduler, Heartbeat-promptbijdrage, UI-descriptor |
| Setup- of onboardingwizard | Sessie-uitbreiding, afgebakende opdrachten, Control UI-descriptor                                                                   |

<Note>
  Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een Plugin probeert een
  smallere gateway-methodescope toe te wijzen. Geef de voorkeur aan plugin-specifieke prefixes voor
  door Plugin beheerde methoden.
</Note>

<Accordion title="When to use tool-result middleware">
  Gebundelde plugins en expliciet ingeschakelde geïnstalleerde plugins met overeenkomende
  manifestcontracten kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer
  ze een toolresultaat moeten herschrijven na uitvoering en voordat de runtime
  dat resultaat terugvoert naar het model. Dit is de vertrouwde, runtime-neutrale
  naad voor async-uitvoerreducers zoals tokenjuice.

Plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke beoogde
runtime, bijvoorbeeld `["openclaw", "codex"]`. Geïnstalleerde plugins zonder dat
contract, of zonder expliciete inschakeling, kunnen deze middleware niet registreren; gebruik
normale OpenClaw-pluginhooks voor werk dat geen timing van toolresultaten vóór het model
nodig heeft. Het oude
registratiepad voor extensiefabrieken dat alleen voor de embedded runner gold, is verwijderd.
</Accordion>

### Registratie voor Gateway-discovery

`api.registerGatewayDiscoveryService(...)` laat een Plugin de actieve
Gateway adverteren via een lokaal discovery-transport zoals mDNS/Bonjour. OpenClaw roept de
service aan tijdens het opstarten van de Gateway wanneer lokale discovery is ingeschakeld, geeft de
huidige Gateway-poorten en niet-geheime TXT-hintgegevens door, en roept de geretourneerde
`stop`-handler aan tijdens het afsluiten van de Gateway.

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

Gateway-discoveryplugins mogen geadverteerde TXT-waarden niet behandelen als geheimen of
authenticatie. Discovery is een routeringshint; Gateway-authenticatie en TLS-pinning blijven
eigenaar van vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten opdrachtmetadata:

- `commands`: expliciete opdrachtnamen die eigendom zijn van de registrar
- `descriptors`: opdrachtbeschrijvingen tijdens parse-tijd die worden gebruikt voor CLI-help,
  routering en luie CLI-registratie van plugins
- `parentPath`: optioneel bovenliggend opdrachtpad voor geneste opdrachtgroepen, zoals
  `["nodes"]`

Geef voor gekoppelde-nodefuncties de voorkeur aan
`api.registerNodeCliFeature(registrar, opts?)`. Dit is een kleine wrapper rond
`api.registerCli(..., { parentPath: ["nodes"] })` en maakt opdrachten zoals
`openclaw nodes canvas` expliciete door Plugin beheerde nodefuncties.

Als je wilt dat een pluginopdracht lui geladen blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke top-level opdrachtroot dekken die door die
registrar wordt aangeboden.

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Geneste opdrachten ontvangen de opgeloste bovenliggende opdracht als `program`:

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gebruik `commands` op zichzelf alleen wanneer je geen luie root-CLI-registratie nodig hebt.
Dat eager compatibiliteitspad blijft ondersteund, maar installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens parse-tijd.

### Registratie van CLI-backend

`api.registerCliBackend(...)` laat een Plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI CLI-backend zoals `claude-cli` of `my-cli`.

- De backend-`id` wordt de providerprefix in modelreferenties zoals `my-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen over de
  pluginstandaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend na samenvoeging compatibiliteitsherschrijvingen nodig heeft
  (bijvoorbeeld het normaliseren van oude flagvormen).
- Gebruik `resolveExecutionArgs` voor aanvraaggebonden argv-herschrijvingen die bij
  het CLI-dialect horen, zoals het mappen van OpenClaw-denkniveaus naar een native effort-
  flag. De hook ontvangt `ctx.executionMode`; gebruik `"side-question"` om
  backend-native isolatieflags toe te voegen voor vluchtige `/btw`-aanroepen. Als die flags
  native tools betrouwbaar uitschakelen voor een CLI die anders altijd aan staat, declareer dan
  ook `sideQuestionToolMode: "disabled"`.

Zie voor een end-to-end auteurshandleiding
[CLI-backendplugins](/nl/plugins/cli-backend-plugins).

### Exclusieve slots

| Methode                                    | Wat het registreert                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-engine (één tegelijk actief). Lifecycle-callbacks ontvangen `runtimeSettings` wanneer de host model-/provider-/modusdiagnostiek kan leveren; oudere strict engines worden opnieuw geprobeerd zonder die sleutel. |
| `api.registerMemoryCapability(capability)` | Unified memory capability                                                                                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Builder voor memory prompt section                                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor memory flush plan                                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter voor memory runtime                                                                                                                                                                                             |

### Verouderde memory embedding-adapters

| Methode                                        | Wat het registreert                         |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory embedding-adapter voor de actieve Plugin |

- `registerMemoryCapability` is de aanbevolen exclusieve API voor memory-plugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)`
  beschikbaar maken, zodat companion-plugins geëxporteerde memory-artifacts kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de private indeling van een specifieke
  memory-plugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele exclusieve API's voor memory-plugins.
- `MemoryFlushPlan.model` kan de flush-turn vastzetten op een exacte `provider/model`
  referentie, zoals `ollama/qwen3:8b`, zonder de actieve fallback-keten over te nemen.
- `registerMemoryEmbeddingProvider` is verouderd. Nieuwe embedding-providers
  moeten `api.registerEmbeddingProvider(...)` en
  `contracts.embeddingProviders` gebruiken.
- Bestaande memory-specifieke providers blijven tijdens de migratieperiode
  werken, maar Plugin-inspectie rapporteert dit als compatibiliteitsschuld voor
  niet-gebundelde plugins.

### Events en lifecycle

| Methode                                      | Wat het doet                    |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook          |
| `api.onConversationBindingResolved(handler)` | Conversation-binding-callback   |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, algemene hooknamen en guard-semantiek.

### Semantiek voor hookbeslissingen

`before_install` is een lifecycle-hook van de Plugin-runtime, niet het operator-installatiebeleid
oppervlak. Gebruik `security.installPolicy` wanneer een allow/block-beslissing
CLI- en Gateway-ondersteunde installatie- of updatepaden moet dekken.

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaard model-dispatchpad overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je inbound thread-/topic-routing nodig hebt. Houd `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routingvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor startup-state die eigendom is van de Gateway, in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer lifecycle-wijzigingen van cron die eigendom zijn van de Gateway. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als bron van waarheid voor due checks en uitvoering.

### Velden van het API-object

| Veld                     | Type                      | Beschrijving                                                                                               |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                                  |
| `api.name`               | `string`                  | Weergavenaam                                                                                               |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                                  |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                                            |
| `api.source`             | `string`                  | Bronpad van de Plugin                                                                                      |
| `api.rootDir`            | `string?`                 | Rootdirectory van de Plugin (optioneel)                                                                    |
| `api.config`             | `OpenClawConfig`          | Huidige config-snapshot (actieve in-memory runtime-snapshot wanneer beschikbaar)                           |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-specifieke config uit `plugins.entries.<id>.config`                                                 |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                                    |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte startup-/setupvenster vóór de volledige entry           |
| `api.resolvePath(input)` | `(string) => string`      | Los pad op relatief aan de Plugin-root                                                                     |

## Conventie voor interne modules

Gebruik binnen je Plugin lokale barrel-bestanden voor interne imports:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Importeer je eigen Plugin nooit via `openclaw/plugin-sdk/<your-plugin>`
  vanuit productiecode. Leid interne imports via `./api.ts` of
  `./runtime-api.ts`. Het SDK-pad is alleen het externe contract.
</Warning>

Publieke oppervlakken van facade-geladen gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entry-bestanden) geven de voorkeur aan de
actieve runtime-config-snapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configbestand op schijf.
Facades van verpakte gebundelde plugins moeten worden geladen via OpenClaw's Plugin
facade-loaders; directe imports uit `dist/extensions/...` omzeilen de manifest-
en runtime-sidecar-controles die verpakte installaties gebruiken voor Plugin-eigen code.

Provider-plugins kunnen een smalle Plugin-lokale contract-barrel beschikbaar maken wanneer een
helper bewust provider-specifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: publieke `api.ts` / `contract-api.ts`-naad voor Claude
  beta-header- en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert provider-builders,
  default-model-helpers en realtime provider-builders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de provider-builder
  plus onboarding-/confighelpers.

<Warning>
  Productiecode van extensies moet ook imports uit `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer die dan naar een neutraal SDK-subpad
  zoals `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  capability-georiënteerd oppervlak in plaats van twee plugins aan elkaar te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    Opties voor `definePluginEntry` en `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige referentie voor de `api.runtime`-namespace.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/nl/plugins/sdk-setup">
    Packaging, manifests en configschema's.
  </Card>
  <Card title="Testing" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en lintregels.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/nl/plugins/architecture">
    Diepe architectuur en capability-model.
  </Card>
</CardGroup>
