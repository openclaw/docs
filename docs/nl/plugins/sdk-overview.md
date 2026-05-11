---
read_when:
    - U moet weten uit welk SDK-subpad u moet importeren
    - Je wilt een referentie voor alle registratiemethoden van OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Importmap, registratie-API-referentie en SDK-architectuur
title: Plugin SDK-overzicht
x-i18n:
    generated_at: "2026-05-11T20:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De Plugin SDK is het getypeerde contract tussen Plugins en core. Deze pagina is de
referentie voor **wat je importeert** en **wat je kunt registreren**.

<Note>
  Deze pagina is voor Plugin-auteurs die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik je in plaats daarvan de
  [OpenClaw App SDK](/nl/concepts/openclaw-sdk) en het pakket `@openclaw/sdk`.
</Note>

<Tip>
Zoek je in plaats daarvan een handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Channel-Plugins](/nl/plugins/sdk-channel-plugins) voor Channel-Plugins, [Provider-Plugins](/nl/plugins/sdk-provider-plugins) voor Provider-Plugins, [CLI-backend-Plugins](/nl/plugins/cli-backend-plugins) voor lokale AI CLI-backends en [Plugin hooks](/nl/plugins/hooks) voor tool- of lifecycle-hook-Plugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Voor channel-specifieke entry/build-helpers
heeft `openclaw/plugin-sdk/channel-core` de voorkeur; houd `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde helpers zoals
`buildChannelConfigSchema`.

Voor channel-configuratie publiceer je het JSON Schema dat eigendom is van de channel via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De gebundelde
Plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
gebundelde-channel-schema's. Verouderde compatibiliteitsexports blijven beschikbaar op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schemasubpaden is een
patroon voor nieuwe Plugins.

<Warning>
  Importeer geen provider- of channel-gebonden convenience seams (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde Plugins combineren generieke SDK-subpaden binnen hun eigen `api.ts` /
  `runtime-api.ts` barrels; core-consumers moeten ofwel die Plugin-lokale
  barrels gebruiken, of een smal generiek SDK-contract toevoegen wanneer een behoefte echt
  channel-overstijgend is.

Een kleine set gebundelde-Plugin-helperseams verschijnt nog steeds in de gegenereerde exportmap
wanneer ze bijgehouden owner-gebruik hebben. Ze bestaan alleen voor onderhoud van gebundelde Plugins
en zijn geen aanbevolen importpaden voor nieuwe externe
Plugins.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden owner-gebruik. Kopieer
die importpaden niet naar nieuwe Plugins; gebruik in plaats daarvan geïnjecteerde runtime-helpers en
generieke channel-SDK-subpaden.
</Warning>

## Subpadreferentie

De Plugin SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd per gebied (Plugin
entry, channel, provider, auth, runtime, capability, memory en gereserveerde
gebundelde-Plugin-helpers). Zie voor de volledige catalogus, gegroepeerd en gelinkt,
[Plugin SDK-subpaden](/nl/plugins/sdk-subpaths).

De compiler-entrypoint-inventaris staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset na aftrek van repo-lokale test/interne subpaden die staan vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Voer
`pnpm plugin-sdk:surface` uit om het aantal publieke exports te controleren. Verouderde publieke
subpaden die oud genoeg zijn en niet worden gebruikt door productiecode van gebundelde extensies worden
bijgehouden in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; brede
verouderde re-export-barrels worden bijgehouden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat deze registreert                 |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agent executor |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend         |
| `api.registerChannel(...)`                       | Messaging-channel                    |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese     |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime-transcriptie      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime-spraaksessies        |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse           |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                       |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                      |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                       |
| `api.registerWebFetchProvider(...)`              | Webfetch-/scrape-provider            |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                       |

### Tools en opdrachten

| Methode                         | Wat deze registreert                              |
| ------------------------------- | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-tool (vereist of `{ optional: true }`)      |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)              |

Plugin-opdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
opdracht-eigen routinghint nodig heeft. Houd die tekst gericht op de opdracht zelf; voeg geen
provider- of Plugin-specifiek beleid toe aan core-promptbuilders.

### Infrastructuur

| Methode                                        | Wat deze registreert                         |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                                   |
| `api.registerHttpRoute(params)`                | Gateway HTTP-eindpunt                        |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                          |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discovery-adverteerder        |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                              |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-feature-CLI onder `openclaw nodes`      |
| `api.registerService(service)`                 | Achtergrondservice                           |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                         |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-toolresultaatmiddleware              |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve memory-aangrenzende promptsectie   |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additief memory-zoek-/leescorpus             |

### Host-hooks voor workflow-Plugins

Host-hooks zijn de SDK-seams voor Plugins die moeten deelnemen aan de host-
lifecycle in plaats van alleen een provider, channel of tool toe te voegen. Het zijn
generieke contracten; Plan Mode kan ze gebruiken, maar dat geldt ook voor approval-workflows,
workspace-policy-gates, achtergrondmonitors, setupwizards en UI-companion-
Plugins.

| Methode                                                                              | Contract waarvan deze eigenaar is                                                                                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigen, JSON-compatibele sessiestatus geprojecteerd via Gateway-sessies                                                     |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Duurzame exactly-once-context geïnjecteerd in de volgende agent-turn voor één sessie                                               |
| `api.registerTrustedToolPolicy(...)`                                                 | Gebundeld/vertrouwd pre-Plugin-toolbeleid dat toolparameters kan blokkeren of herschrijven                                        |
| `api.registerToolMetadata(...)`                                                      | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                     |
| `api.registerCommand(...)`                                                           | Scoped Plugin-opdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen; Discord-native opdrachten ondersteunen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Control-UI-contributiedescriptors voor sessie-, tool-, run- of instellingenoppervlakken                                            |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup-callbacks voor Plugin-eigen runtime-resources op reset-/delete-/reload-paden                                              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Gesaniteerde event-abonnementen voor workflowstatus en monitors                                                                   |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Plugin-scratchstatus per run, opgeschoond bij terminale run-lifecycle                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanupmetadata voor Plugin-eigen scheduler-jobs; plant geen werk en maakt geen taakrecords aan                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Alleen gebundeld: door de host bemiddelde bestandsbijlagelevering aan de actieve direct-outbound-sessieroute                      |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Alleen gebundeld: door Cron ondersteunde geplande sessie-turns plus taggebaseerde cleanup                                         |
| `api.session.controls.registerSessionAction(...)`                                    | Getypeerde sessieacties die clients via de Gateway kunnen dispatchen                                                              |

Gebruik de gegroepeerde namespaces voor nieuwe Plugin-code:

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
voor bestaande Plugins. Voeg geen nieuwe Plugin-code toe die
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` of
`api.unscheduleSessionTurnsByTag` rechtstreeks aanroept.

`scheduleSessionTurn(...)` is een sessiegebonden gemakslaag boven de Gateway
Cron-planner. Cron beheert de timing en maakt de achtergrondtaakrecord aan
wanneer de beurt wordt uitgevoerd; de Plugin SDK beperkt alleen de doelsessie,
Plugin-eigen naamgeving en opschoning. Gebruik `api.runtime.tasks.managedFlows`
binnen de geplande beurt wanneer het werk zelf duurzame meerstaps-Task Flow-status
nodig heeft.

De contracten splitsen de bevoegdheid bewust op:

- Externe plugins kunnen sessie-uitbreidingen, UI-descriptors, commando's,
  toolmetadata, injecties voor de volgende beurt en normale hooks beheren.
- Vertrouwde toolbeleidsregels worden uitgevoerd vóór gewone `before_tool_call`-hooks
  en zijn alleen gebundeld omdat ze deelnemen aan het veiligheidsbeleid van de host.
- Gereserveerd commando-eigenaarschap is alleen gebundeld. Externe plugins moeten hun
  eigen commandonamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptwijzigende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden van de verouderde `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Plugin-archetype            | Gebruikte hooks                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Goedkeuringsworkflow        | Sessie-uitbreiding, commandovoortzetting, injectie voor volgende beurt, UI-descriptor                                              |
| Beleidsgrens voor budget/werkruimte | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                         |
| Achtergrondmonitor voor levenscyclus | Opschoning van runtimelevenscyclus, abonnement op agentevents, eigenaarschap/opschoning van sessieplanner, bijdrage aan heartbeat-prompt, UI-descriptor |
| Installatie- of onboardingwizard | Sessie-uitbreiding, gescopete commando's, Control-UI-descriptor                                                               |

<Note>
  Gereserveerde kernbeheernamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin probeert een
  nauwere Gateway-methodescope toe te wijzen. Geef de voorkeur aan pluginspecifieke
  voorvoegsels voor Plugin-eigen methoden.
</Note>

<Accordion title="Wanneer toolresultaat-middleware gebruiken">
  Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken
  wanneer ze een toolresultaat na uitvoering en voordat de runtime dat resultaat
  terugvoert naar het model moeten herschrijven. Dit is de vertrouwde runtime-neutrale
  naad voor asynchrone uitvoerreducers zoals tokenjuice.

Gebundelde plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
gerichte runtime, bijvoorbeeld `["pi", "codex"]`. Externe plugins
kunnen deze middleware niet registreren; houd normale OpenClaw-pluginhooks aan voor werk
waarvoor geen timing van toolresultaten vóór het model nodig is. Het oude, alleen voor Pi
bedoelde registratiepad voor ingebedde uitbreidingsfabrieken is verwijderd.
</Accordion>

### Gateway-discoveryregistratie

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve
Gateway adverteren op een lokaal discoverytransport zoals mDNS/Bonjour. OpenClaw roept de
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
authenticatie. Discovery is een routeringshint; Gateway-authenticatie en TLS-pinning
beheren nog steeds vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten commandometadata:

- `commands`: expliciete commandonamen die eigendom zijn van de registrar
- `descriptors`: commandodescriptors tijdens het parsen die worden gebruikt voor CLI-help,
  routering en luie CLI-registratie van plugins
- `parentPath`: optioneel bovenliggend commandopad voor geneste commandogroepen, zoals
  `["nodes"]`

Voor gekoppelde-node-functies heeft
`api.registerNodeCliFeature(registrar, opts?)` de voorkeur. Dit is een kleine wrapper rond
`api.registerCli(..., { parentPath: ["nodes"] })` en maakt commando's zoals
`openclaw nodes canvas` expliciete Plugin-eigen node-functies.

Als je wilt dat een plugincommando lui geladen blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke root van een topniveaucommando dekken die door die
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

Geneste commando's ontvangen het opgeloste bovenliggende commando als `program`:

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
Dat gretige compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens het parsen.

### CLI-backendregistratie

`api.registerCliBackend(...)` laat een plugin de standaardconfiguratie beheren voor een lokale
AI-CLI-backend zoals `codex-cli`.

- De backend-`id` wordt het providervoorvoegsel in modelrefs zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen boven op de
  Plugin-standaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen na het samenvoegen nodig heeft
  (bijvoorbeeld het normaliseren van oude flagvormen).
- Gebruik `resolveExecutionArgs` voor aanvraaggebonden argv-herschrijvingen die bij
  het CLI-dialect horen, zoals het mappen van OpenClaw-denkniveaus naar een native effort-flag.

Zie voor een end-to-end auteurshandleiding
[CLI-backendplugins](/nl/plugins/cli-backend-plugins).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Contextengine (één tegelijk actief). De callback `assemble()` ontvangt `availableTools` en `citationsMode`, zodat de engine prompttoevoegingen kan afstemmen. |
| `api.registerMemoryCapability(capability)` | Uniforme geheugencapability                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Bouwer voor geheugenpromptsecties                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Geheugenruntime-adapter                                                                                                                                    |

### Adapters voor geheugenembeddings

| Methode                                        | Wat deze registreert                         |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugenembeddingadapter voor de actieve plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen,
  zodat begeleidende plugins geëxporteerde geheugenartefacten kunnen consumeren via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de privé-indeling van een specifieke
  geheugenplugin te reiken.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastpinnen op een exacte `provider/model`-referentie,
  zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- `registerMemoryEmbeddingProvider` laat de actieve geheugenplugin één of meer
  embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste
  door een plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Events en levenscyclus

| Methode                                      | Wat deze doet                |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypeerde levenscyclushook  |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, veelvoorkomende hooknamen en guard-semantiek.

### Semantiek van hookbeslissingen

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaarddispatchpad van het model overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een overschrijving.
- `message_received`: gebruik het getypeerde veld `threadId` wanneer je routering van inkomende threads/onderwerpen nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypeerde routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor Gateway-eigen opstartstatus in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer wijzigingen in de Gateway-eigen Cron-levenscyclus. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wekkerschedulers, en houd OpenClaw als de bron van waarheid voor vervalcontroles en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                   |
| `api.name`               | `string`                  | Weergavenaam                                                                                |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                   |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                             |
| `api.source`             | `string`                  | Bronpad van Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Hoofdmap van Plugin (optioneel)                                                             |
| `api.config`             | `OpenClawConfig`          | Huidige config-snapshot (actieve runtime-snapshot in het geheugen wanneer beschikbaar)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-specifieke config uit `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Runtimehelpers](/nl/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór volledige entry |
| `api.resolvePath(input)` | `(string) => string`      | Pad relatief aan de Plugin-root oplossen                                                    |

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

Door facade geladen publieke oppervlakken van gebundelde Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entrybestanden) geven de voorkeur aan de
actieve runtime-configsnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configbestand op schijf.
Verpakte facades van gebundelde Plugins moeten worden geladen via OpenClaw's Plugin-
facadeladers; directe imports uit `dist/extensions/...` omzeilen de manifest-
en runtime-sidecarcontroles die verpakte installaties gebruiken voor code die eigendom is van de Plugin.

Provider-Plugins kunnen een smalle, Plugin-lokale contract-barrel blootstellen wanneer een
helper bewust provider-specifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: publieke `api.ts` / `contract-api.ts`-seam voor Claude
  beta-header- en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert provider-builders,
  helpers voor standaardmodellen en realtime provider-builders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de provider-builder
  plus onboarding-/confighelpers.

<Warning>
  Productiecode van extensions moet ook imports uit `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer die dan naar een neutraal SDK-subpad
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
    Packaging, manifests en config-schema's.
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
