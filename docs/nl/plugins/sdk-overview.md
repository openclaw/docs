---
read_when:
    - U moet weten uit welk SDK-subpad u moet importeren
    - U wilt een naslag voor alle registratiemethoden op OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Referentie voor import map, registratie-API en SDK-architectuur
title: Overzicht van de Plugin SDK
x-i18n:
    generated_at: "2026-07-01T18:16:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin SDK is het getypeerde contract tussen plugins en de kern. Deze pagina is de
referentie voor **wat je moet importeren** en **wat je kunt registreren**.

<Note>
  Deze pagina is bedoeld voor pluginauteurs die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik in plaats daarvan
  [Gateway-integraties voor externe apps](/nl/gateway/external-apps).
</Note>

<Tip>
Zoek je in plaats daarvan een praktische handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins, [CLI-backendplugins](/nl/plugins/cli-backend-plugins) voor lokale AI CLI-backends, en [Plugin hooks](/nl/plugins/hooks) voor tool- of levenscyclus-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Voor kanaalspecifieke entry/build-helpers
geef je de voorkeur aan `openclaw/plugin-sdk/channel-core`; bewaar `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde helpers zoals
`buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het JSON Schema dat eigendom is van het kanaal via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De gebundelde
plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
gebundelde-kanaalschema's. Verouderde compatibiliteitsexports blijven beschikbaar op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schemasubpaden is een
patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgebonden gemaksnaden (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde plugins stellen generieke SDK-subpaden samen binnen hun eigen `api.ts` /
  `runtime-api.ts` barrels; kernconsumenten moeten die pluginlokale
  barrels gebruiken of een smal generiek SDK-contract toevoegen wanneer een behoefte echt
  kanaaloverstijgend is.

Een kleine set helpernaden voor gebundelde plugins verschijnt nog steeds in de gegenereerde exportmap
wanneer ze bijgehouden eigenaargebruik hebben. Ze bestaan alleen voor onderhoud van gebundelde plugins
en worden niet aanbevolen als importpaden voor nieuwe plugins van derden.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden eigenaargebruik. Kopieer
die importpaden niet naar nieuwe plugins; gebruik in plaats daarvan geïnjecteerde runtimehelpers en
generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De plugin SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd per gebied (plugin
entry, kanaal, provider, auth, runtime, capability, geheugen en gereserveerde
helpers voor gebundelde plugins). Zie voor de volledige catalogus, gegroepeerd en gelinkt,
[Plugin SDK-subpaden](/nl/plugins/sdk-subpaths).

De compiler-entrypoint-inventaris staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset nadat repo-lokale test-/interne subpaden zijn afgetrokken die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` staan. Voer
`pnpm plugin-sdk:surface` uit om het publieke exportaantal te controleren. Verouderde publieke
subpaden die oud genoeg zijn en niet worden gebruikt door productiecode van gebundelde extensies, worden
bijgehouden in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; brede
verouderde re-exportbarrels worden bijgehouden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat ermee wordt geregistreerd          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentuitvoerder |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend           |
| `api.registerChannel(...)`                       | Berichtenkanaal                        |
| `api.registerEmbeddingProvider(...)`             | Herbruikbare vector-embeddingprovider  |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies          |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                         |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                        |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                         |
| `api.registerWebFetchProvider(...)`              | Webfetch-/scrapeprovider               |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                         |

Embeddingproviders die met `api.registerEmbeddingProvider(...)` zijn geregistreerd, moeten
ook worden vermeld in `contracts.embeddingProviders` in het pluginmanifest. Dit
is het generieke embeddingoppervlak voor herbruikbare vectorgeneratie. Geheugenzoekopdrachten
kunnen dit generieke provideroppervlak gebruiken. De oudere naad
`api.registerMemoryEmbeddingProvider(...)` en
`contracts.memoryEmbeddingProviders` is verouderde compatibiliteit terwijl
bestaande geheugenspecifieke providers migreren.

Geheugenspecifieke providers die nog steeds een runtime `batchEmbed(...)` aanbieden, blijven op
het bestaande batchingcontract per bestand, tenzij hun runtime expliciet
`sourceWideBatchEmbed: true` instelt. Die opt-in laat de geheugenhost chunks uit
meerdere gewijzigde geheugenbestanden en ingeschakelde bronnen in één `batchEmbed(...)`-aanroep indienen,
tot aan de hostbatchlimieten. Batchadapters die JSONL-aanvraagbestanden uploaden, moeten
providertaken splitsen vóór zowel hun uploadgroottelimiet als hun aanvraag-aantallimiet.
De provider moet één embedding per invoerchunk teruggeven in dezelfde volgorde als
`batch.chunks`; laat de vlag weg wanneer de provider bestandslokale batches verwacht of
de invoervolgorde niet kan behouden over een grotere bronbrede taak.

### Tools en opdrachten

Gebruik [`defineToolPlugin`](/nl/plugins/tool-plugins) voor eenvoudige plugins met alleen tools
en vaste toolnamen. Gebruik `api.registerTool(...)` rechtstreeks voor gemengde plugins
of volledig dynamische toolregistratie.

| Methode                         | Wat ermee wordt geregistreerd                    |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)      |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)             |

Pluginopdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
opdracht-eigen routeringshint nodig heeft. Houd die tekst gericht op de opdracht zelf; voeg geen
provider- of pluginspecifiek beleid toe aan kernpromptbuilders.

Guidance-items kunnen legacy-strings zijn, die op elk promptoppervlak van toepassing zijn, of
gestructureerde items:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Gestructureerde `surfaces` kunnen `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` of `subagent` bevatten. `pi_main` blijft een verouderd alias
voor `openclaw_main`. Laat `surfaces` weg voor bewuste guidance voor alle oppervlakken. Geef
geen lege `surfaces`-array door; die wordt geweigerd zodat onbedoeld scopeverlies geen
globale prompttekst wordt.

Native ontwikkelaarsinstructies voor de Codex app-server zijn strikter dan andere promptoppervlakken:
alleen guidance die expliciet is gescoped naar `codex_app_server` wordt gepromoveerd naar
die lane met hogere prioriteit. Legacy-stringguidance en ongescopede gestructureerde
guidance blijven om compatibiliteitsredenen beschikbaar voor niet-Codex-promptoppervlakken.

### Infrastructuur

| Methode                                        | Wat ermee wordt geregistreerd             |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                                |
| `api.registerHttpRoute(params)`                | Gateway HTTP-eindpunt                     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                       |
| `api.registerGatewayDiscoveryService(service)` | Advertiser voor lokale Gateway-discovery  |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                           |
| `api.registerNodeCliFeature(registrar, opts?)` | Node feature-CLI onder `openclaw nodes`   |
| `api.registerService(service)`                 | Achtergrondservice                        |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                      |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-middleware voor toolresultaten    |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve promptsectie naast geheugen     |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additieve corpus voor geheugenzoek-/leesacties |

### Host hooks voor workflowplugins

Host hooks zijn de SDK-naden voor plugins die moeten deelnemen aan de hostlevenscyclus
in plaats van alleen een provider, kanaal of tool toe te voegen. Het zijn
generieke contracten; Plan Mode kan ze gebruiken, maar goedkeuringsworkflows,
workspace-beleidscontroles, achtergrondmonitors, setupwizards en bijbehorende UI-plugins
kunnen dat ook.

| Methode                                                                               | Contract waarvan deze eigenaar is                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigen, JSON-compatibele sessiestatus die via Gateway-sessies wordt geprojecteerd                                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Duurzame exact-eenmaal-context die in de volgende agent-turn voor een sessie wordt geïnjecteerd                                                            |
| `api.registerTrustedToolPolicy(...)`                                                 | Door manifest afgeschermd vertrouwd pre-plugin-toolbeleid dat toolparameters kan blokkeren of herschrijven                                                  |
| `api.registerToolMetadata(...)`                                                      | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                                              |
| `api.registerCommand(...)`                                                           | Gescopeerde pluginopdrachten; opdrachtresultaten kunnen `continueAgent: true` of `suppressReply: true` instellen; native Discord-opdrachten ondersteunen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bijdragebeschrijvingen voor de Control UI voor sessie-, tool-, run- of instellingenoppervlakken                                                            |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup-callbacks voor plugin-eigen runtimebronnen op reset-/delete-/reload-paden                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Gesaneerde eventabonnementen voor workflowstatus en monitors                                                                                               |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Plugin-scratchstatus per run die wordt gewist bij de terminale run-levenscyclus                                                                            |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanupmetadata voor plugin-eigen schedulerjobs; plant geen werk en maakt geen taakrecords aan                                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Alleen gebundelde, host-gemedieerde levering van bestandsbijlagen aan de actieve direct-uitgaande sessieroute                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Alleen gebundelde, door Cron ondersteunde geplande sessie-turns plus taggebaseerde cleanup                                                                 |
| `api.session.controls.registerSessionAction(...)`                                    | Getypte sessieacties die clients via de Gateway kunnen dispatchen                                                                                          |

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

`scheduleSessionTurn(...)` is sessiegescopeerd gemak boven op de Gateway
Cron-scheduler. Cron is eigenaar van timing en maakt het achtergrondtaakrecord aan wanneer de
turn wordt uitgevoerd; de Plugin SDK beperkt alleen de doelsessie, plugin-eigen
naamgeving en cleanup. Gebruik `api.runtime.tasks.managedFlows` binnen de geplande
turn wanneer het werk zelf duurzame meerstaps Task Flow-status nodig heeft.

De contracten splitsen autoriteit bewust op:

- Externe plugins kunnen eigenaar zijn van sessie-extensies, UI-beschrijvingen, opdrachten, toolmetadata, next-turn-injecties en normale hooks.
- Vertrouwde toolbeleidsregels draaien vóór gewone `before_tool_call`-hooks en zijn door de host vertrouwd. Gebundelde beleidsregels draaien eerst; beleidsregels van geïnstalleerde plugins vereisen expliciete inschakeling plus hun lokale ids in
  `contracts.trustedToolPolicies`, en draaien daarna in pluginlaadvolgorde. Beleids-id's
  zijn gescopeerd tot de registrerende plugin.
- Gereserveerd opdrachteigenaarschap is alleen gebundeld. Externe plugins moeten hun
  eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptmuterende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden uit legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Pluginarchetype             | Gebruikte hooks                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Goedkeuringsworkflow         | Sessie-extensie, opdrachtvoortzetting, next-turn-injectie, UI-beschrijving                                                             |
| Budget-/werkruimtebeleidshek | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                                    |
| Achtergrondlevenscyclusmonitor | Runtimelevenscyclus-cleanup, agent-eventabonnement, eigenaarschap/cleanup van sessiescheduler, heartbeat-promptbijdrage, UI-beschrijving |
| Setup- of onboardingwizard   | Sessie-extensie, gescopeerde opdrachten, Control UI-beschrijving                                                                       |

<Note>
  Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin probeert een
  smallere gateway-methodescope toe te wijzen. Geef de voorkeur aan pluginspecifieke prefixen voor
  plugin-eigen methoden.
</Note>

<Accordion title="Wanneer tool-result-middleware gebruiken">
  Gebundelde plugins en expliciet ingeschakelde geïnstalleerde plugins met overeenkomende
  manifestcontracten kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer
  ze een toolresultaat na uitvoering en voordat de runtime
  dat resultaat terugvoert naar het model moeten herschrijven. Dit is de vertrouwde runtime-neutrale
  naad voor asynchrone outputreducers zoals tokenjuice.

Plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke beoogde
runtime, bijvoorbeeld `["openclaw", "codex"]`. Geïnstalleerde plugins zonder dat
contract, of zonder expliciete inschakeling, kunnen deze middleware niet registreren; houd
normale OpenClaw-pluginhooks aan voor werk waarvoor geen pre-model tool-result-
timing nodig is. Het oude
registratiepad voor extensiefabrieken dat alleen voor embedded runner gold, is verwijderd.
</Accordion>

### Gateway-discoveryregistratie

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve
Gateway adverteren op een lokaal discoverytransport zoals mDNS/Bonjour. OpenClaw roept de
service aan tijdens het opstarten van de Gateway wanneer lokale discovery is ingeschakeld, geeft de
huidige Gateway-poorten en niet-geheime TXT-hintdata door, en roept de geretourneerde
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
authenticatie. Discovery is een routinghint; Gateway-auth en TLS-pinning blijven
eigenaar van vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten opdrachtmetadata:

- `commands`: expliciete opdrachtnamen waarvan de registrar eigenaar is
- `descriptors`: opdrachtbeschrijvingen voor parse-tijd die worden gebruikt voor CLI-help,
  routing en lazy plugin-CLI-registratie
- `parentPath`: optioneel bovenliggend opdrachtpad voor geneste opdrachtgroepen, zoals
  `["nodes"]`

Voor paired-node-functies geef je de voorkeur aan
`api.registerNodeCliFeature(registrar, opts?)`. Dit is een kleine wrapper rond
`api.registerCli(..., { parentPath: ["nodes"] })` en maakt opdrachten zoals
`openclaw nodes canvas` expliciete plugin-eigen node-functies.

Als je wilt dat een pluginopdracht lazy-loaded blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke top-level opdrachtroot dekken die door die
registrar wordt blootgesteld.

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

Gebruik `commands` op zichzelf alleen wanneer je geen lazy root-CLI-registratie nodig hebt.
Dat eager compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lazy loading op parse-tijd.

### CLI-backendregistratie

`api.registerCliBackend(...)` laat een plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI-CLI-backend zoals `claude-cli` of `my-cli`.

- De backend-`id` wordt het providerprefix in modelreferenties zoals `my-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen over de
  Plugin-standaard heen voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen nodig heeft na het samenvoegen
  (bijvoorbeeld het normaliseren van oude vlagvormen).
- Gebruik `resolveExecutionArgs` voor aanvraaggebonden argv-herschrijvingen die bij
  het CLI-dialect horen, zoals het mappen van OpenClaw-denkniveaus naar een native effort-
  vlag. De hook ontvangt `ctx.executionMode`; gebruik `"side-question"` om
  backend-native isolatievlaggen toe te voegen voor vluchtige `/btw`-aanroepen. Als die vlaggen
  native tools betrouwbaar uitschakelen voor een anders altijd actieve CLI, declareer dan
  ook `sideQuestionToolMode: "disabled"`.

Zie voor een end-to-end auteurshandleiding
[CLI-backend-Plugins](/nl/plugins/cli-backend-plugins).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-engine (één tegelijk actief). Lifecycle-callbacks ontvangen `runtimeSettings` wanneer de host model-/provider-/modusdiagnostiek kan leveren; oudere strikte engines worden opnieuw geprobeerd zonder die sleutel. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugen-capability                                                                                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugen-flushplan                                                                                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Adapter voor geheugenruntime                                                                                                                                                                                                       |

### Verouderde adapters voor geheugen-embeddings

| Methode                                        | Wat deze registreert                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter voor geheugen-embeddings voor de actieve Plugin |

- `registerMemoryCapability` is de aanbevolen exclusieve geheugen-Plugin-API.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen,
  zodat begeleidende Plugins geëxporteerde geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de private indeling van een specifieke
  geheugen-Plugin te reiken.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele exclusieve geheugen-Plugin-API's.
- `MemoryFlushPlan.model` kan de flush-beurt vastpinnen op een exacte `provider/model`-
  referentie, zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- `registerMemoryEmbeddingProvider` is verouderd. Nieuwe embedding-providers
  moeten `api.registerEmbeddingProvider(...)` en
  `contracts.embeddingProviders` gebruiken.
- Bestaande geheugenspecifieke providers blijven werken tijdens het migratievenster,
  maar Plugin-inspectie rapporteert dit als compatibiliteitsschuld voor
  niet-gebundelde Plugins.

### Gebeurtenissen en lifecycle

| Methode                                      | Wat deze doet                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook           |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding    |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, algemene hooknamen en guard-
semantiek.

### Semantiek van hook-beslissingen

`before_install` is een lifecycle-hook van de Plugin-runtime, niet het oppervlak voor operatorinstallatiebeleid. Gebruik `security.installPolicy` wanneer een toestaan/blokkeren-beslissing
CLI- en Gateway-ondersteunde installatie- of updatepaden moet dekken.

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaardpad voor model-dispatch overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je routering van inkomende threads/topics nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor Gateway-startupstatus in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer lifecycle-wijzigingen van gateway-owned Cron. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` wanneer je externe wekschedulers synchroniseert, en houd OpenClaw als de bron van waarheid voor vervalcontroles en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                         |
| `api.name`               | `string`                  | Weergavenaam                                                                                      |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                         |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                                   |
| `api.source`             | `string`                  | Bronpad van de Plugin                                                                             |
| `api.rootDir`            | `string?`                 | Hoofdmap van de Plugin (optioneel)                                                                |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve in-memory runtimesnapshot wanneer beschikbaar)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-specifieke configuratie uit `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                           |
| `api.logger`             | `PluginLogger`            | Gescoopt logger (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte startup-/setupvenster vóór volledige entry      |
| `api.resolvePath(input)` | `(string) => string`      | Pad relatief aan Plugin-root oplossen                                                             |

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
  vanuit productiecode. Routeer interne imports via `./api.ts` of
  `./runtime-api.ts`. Het SDK-pad is alleen het externe contract.
</Warning>

Via facade geladen gebundelde openbare Plugin-oppervlakken (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare openbare entry-bestanden) geven de voorkeur aan de
actieve runtime-configuratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Facades van verpakte gebundelde Plugins moeten worden geladen via OpenClaw's Plugin-
facade-loaders; directe imports uit `dist/extensions/...` omzeilen de manifest-
en runtime-sidecarcontroles die verpakte installaties gebruiken voor Plugin-owned code.

Provider-Plugins kunnen een smalle Plugin-lokale contract-barrel blootstellen wanneer een
helper bewust provider-specifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: openbare `api.ts` / `contract-api.ts`-naad voor Claude
  beta-header- en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert provider-builders,
  standaardmodelhelpers en realtime provider-builders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de provider-builder
  plus onboarding-/configuratiehelpers.

<Warning>
  Productiecode van extensies moet ook imports van `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer deze dan naar een neutraal SDK-subpad
  zoals `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  capability-georiënteerd oppervlak in plaats van twee Plugins aan elkaar te koppelen.
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
    Packaging, manifests en configuratieschema's.
  </Card>
  <Card title="Testing" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en lintregels.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/nl/plugins/architecture">
    Diepgaande architectuur en capability-model.
  </Card>
</CardGroup>
