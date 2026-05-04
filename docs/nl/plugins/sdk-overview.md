---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - Je wilt een naslagwerk voor alle registratiemethoden op OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Importmap, registratie-API-referentie en SDK-architectuur
title: Plugin SDK-overzicht
x-i18n:
    generated_at: "2026-05-04T18:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin SDK is het getypte contract tussen Plugins en de kern. Deze pagina is de
referentie voor **wat je moet importeren** en **wat je kunt registreren**.

<Note>
  Deze pagina is bedoeld voor Plugin-auteurs die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik je in plaats daarvan de
  [OpenClaw App SDK](/nl/concepts/openclaw-sdk) en het pakket `@openclaw/sdk`.
</Note>

<Tip>
Zoek je in plaats daarvan een praktische gids? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins) voor kanaal-Plugins, [Provider-Plugins](/nl/plugins/sdk-provider-plugins) voor provider-Plugins en [Plugin hooks](/nl/plugins/hooks) voor tool- of lifecycle-hook-Plugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Voor kanaalspecifieke entry-/build-helpers
geef je de voorkeur aan `openclaw/plugin-sdk/channel-core`; bewaar `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde helpers zoals
`buildChannelConfigSchema`.

Voor kanaalconfiguratie publiceer je het kanaal-eigen JSON Schema via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De
gebundelde Plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
gebundelde-kanaalschema's. Verouderde compatibiliteitsexports blijven beschikbaar op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schemasubpaden is een
patroon voor nieuwe Plugins.

<Warning>
  Importeer geen provider- of kanaalmerkspecifieke convenience-seams (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde Plugins stellen generieke SDK-subpaden samen binnen hun eigen `api.ts` /
  `runtime-api.ts` barrels; kernconsumenten moeten ofwel die Plugin-lokale
  barrels gebruiken of een smal generiek SDK-contract toevoegen wanneer een behoefte echt
  kanaaloverstijgend is.

Een kleine set helper-seams voor gebundelde Plugins verschijnt nog steeds in de gegenereerde export
map wanneer ze bijgehouden eigenaarsgebruik hebben. Ze bestaan alleen voor onderhoud van gebundelde Plugins
en worden niet aanbevolen als importpaden voor nieuwe externe
Plugins.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden eigenaarsgebruik. Kopieer
die importpaden niet naar nieuwe Plugins; gebruik in plaats daarvan geïnjecteerde runtime-helpers en
generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De plugin SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd per gebied (Plugin
entry, kanaal, provider, auth, runtime, capability, memory en gereserveerde
helpers voor gebundelde Plugins). Zie voor de volledige catalogus, gegroepeerd en gelinkt,
[Plugin SDK-subpaden](/nl/plugins/sdk-subpaths).

De gegenereerde lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                           | Wat het registreert                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agent-executor |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend           |
| `api.registerChannel(...)`                       | Berichtenkanaal                        |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies          |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                         |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                        |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                         |
| `api.registerWebFetchProvider(...)`              | Webfetch-/scrape-provider              |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                         |

### Tools en opdrachten

| Methode                         | Wat het registreert                            |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-tool (vereist of `{ optional: true }`) |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)          |

Plugin-opdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
opdracht-eigen routinghint nodig heeft. Houd die tekst gericht op de opdracht zelf; voeg geen
provider- of Plugin-specifiek beleid toe aan kernpromptbuilders.

### Infrastructuur

| Methode                                       | Wat het registreert                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP-endpoint                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                     |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discovery-adverteerder   |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                         |
| `api.registerService(service)`                 | Achtergrondservice                      |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                    |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve, memory-aangrenzende promptsectie |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additief corpus voor memory zoeken/lezen |

### Host hooks voor workflow-Plugins

Host hooks zijn de SDK-seams voor Plugins die moeten deelnemen aan de host-
lifecycle, in plaats van alleen een provider, kanaal of tool toe te voegen. Het zijn
generieke contracten; Plan Mode kan ze gebruiken, maar approval-workflows,
werkruimtebeleids-gates, achtergrondmonitors, installatiewizards en UI companion-
Plugins ook.

| Methode                                                                  | Contract dat het beheert                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-eigen, JSON-compatibele sessiestatus die via Gateway-sessies wordt geprojecteerd                                            |
| `api.enqueueNextTurnInjection(...)`                                      | Duurzame exact-once context die in de volgende agent-turn voor één sessie wordt geïnjecteerd                                       |
| `api.registerTrustedToolPolicy(...)`                                     | Gebundeld/vertrouwd pre-Plugin toolbeleid dat toolparams kan blokkeren of herschrijven                                             |
| `api.registerToolMetadata(...)`                                          | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                     |
| `api.registerCommand(...)`                                               | Gescopeerde Plugin-opdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen; Discord native commands ondersteunen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control UI-bijdragebeschrijvingen voor sessie-, tool-, run- of instellingenoppervlakken                                            |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-callbacks voor Plugin-eigen runtime-resources op reset-/delete-/reload-paden                                               |
| `api.registerAgentEventSubscription(...)`                                | Gesaneerde eventabonnementen voor workflowstatus en monitors                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-scratchstatus per run, gewist bij terminale run-lifecycle                                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigen sessiescheduler-taakrecords met deterministische cleanup                                                              |

De contracten splitsen bevoegdheden bewust op:

- Externe Plugins kunnen sessie-extensies, UI-descriptors, opdrachten, tool
  metadata, next-turn injections en normale hooks beheren.
- Trusted tool policies draaien vóór gewone `before_tool_call`-hooks en zijn
  alleen gebundeld omdat ze deelnemen aan het veiligheidsbeleid van de host.
- Gereserveerd opdrachtbeheer is alleen gebundeld. Externe Plugins moeten hun
  eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptmuterende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden uit legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-gebruikers:

| Plugin-archetype             | Gebruikte hooks                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Approval-workflow            | Sessie-extensie, opdrachtvoortzetting, next-turn injection, UI descriptor                                                          |
| Budget-/werkruimtebeleids-gate | Trusted tool policy, tool metadata, sessieprojectie                                                                               |
| Achtergrond-lifecyclemonitor | Runtime lifecycle cleanup, agent-eventabonnement, eigenaarschap/cleanup van sessiescheduler, Heartbeat-promptbijdrage, UI descriptor |
| Installatie- of onboardingwizard | Sessie-extensie, gescopeerde opdrachten, Control UI descriptor                                                                  |

<Note>
  Gereserveerde kernbeheernamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een Plugin een
  smallere gateway method scope probeert toe te wijzen. Geef de voorkeur aan Plugin-specifieke prefixes voor
  Plugin-eigen methoden.
</Note>

<Accordion title="Wanneer tool-result middleware gebruiken">
  Gebundelde Plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer
  ze een toolresultaat na uitvoering en voordat de runtime
  dat resultaat terugvoert naar het model moeten herschrijven. Dit is de vertrouwde runtime-neutrale
  seam voor async output reducers zoals tokenjuice.

Gebundelde Plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
gerichte runtime, bijvoorbeeld `["pi", "codex"]`. Externe Plugins
kunnen deze middleware niet registreren; gebruik normale OpenClaw Plugin hooks voor werk
dat geen pre-model tool-result timing nodig heeft. Het oude Pi-only embedded
extension factory registratiepad is verwijderd.
</Accordion>

### Gateway discovery-registratie

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve
Gateway adverteren op een lokaal detectietransport zoals mDNS/Bonjour. OpenClaw roept de
service aan tijdens het opstarten van de Gateway wanneer lokale detectie is ingeschakeld, geeft de
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

Gateway-detectieplugins mogen geadverteerde TXT-waarden niet behandelen als geheimen of
authenticatie. Detectie is een routeringshint; Gateway-authenticatie en TLS-pinning blijven
verantwoordelijk voor vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten metadata op topniveau:

- `commands`: expliciete opdrachtroots die eigendom zijn van de registrar
- `descriptors`: opdrachtbeschrijvers voor parse-tijd die worden gebruikt voor root-CLI-hulp,
  routering en luie CLI-registratie van plugins

Als je wilt dat een pluginopdracht lui geladen blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke rootopdracht op topniveau dekken die door die
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

Gebruik `commands` op zichzelf alleen wanneer je geen luie root-CLI-registratie nodig hebt.
Dat enthousiaste compatibiliteitspad blijft ondersteund, maar het installeert geen
descriptor-ondersteunde plaatshouders voor lui laden tijdens parse-tijd.

### CLI-backendregistratie

`api.registerCliBackend(...)` laat een plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI CLI-backend zoals `codex-cli`.

- De backend-`id` wordt het providerprefix in modelrefs zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen bovenop de
  pluginstandaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend na het samenvoegen compatibiliteitsherschrijvingen nodig heeft
  (bijvoorbeeld het normaliseren van oude flag-vormen).
- Gebruik `resolveExecutionArgs` voor request-gebonden argv-herschrijvingen die bij
  het CLI-dialect horen, zoals het mappen van OpenClaw-denkniveaus naar een native effort-
  flag.

### Exclusieve slots

| Methode                                    | Wat het registreert                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Contextengine (een tegelijk actief). De `assemble()`-callback ontvangt `availableTools` en `citationsMode`, zodat de engine prompttoevoegingen kan afstemmen. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapaciteit                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adapter voor geheugenruntime                                                                                                                                  |

### Adapters voor geheugenembeddings

| Methode                                        | Wat het registreert                              |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugenembeddingadapter voor de actieve plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen,
  zodat companion-plugins geëxporteerde geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de private lay-out van een specifieke
  geheugenplugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastzetten op een exacte `provider/model`-
  referentie, zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- `registerMemoryEmbeddingProvider` laat de actieve geheugenplugin een of meer
  embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste
  door de plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Gebeurtenissen en levenscyclus

| Methode                                      | Wat het doet                   |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook         |
| `api.onConversationBindingResolved(handler)` | Callback voor conversiebinding |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, gangbare hooknamen en guard-
semantiek.

### Beslissingssemantiek van hooks

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een overschrijving.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaardmodel-dispatchpad overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een overschrijving.
- `message_received`: gebruik het getypte `threadId`-veld wanneer je routering van inkomende threads/topics nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor gateway-eigen opstartstatus in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer wijzigingen in de gateway-eigen cronlevenscyclus. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` wanneer je externe wekschedulers synchroniseert, en houd OpenClaw als bron van waarheid voor vervalcontroles en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                                  |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                     |
| `api.name`               | `string`                  | Weergavenaam                                                                                  |
| `api.version`            | `string?`                 | Pluginversie (optioneel)                                                                      |
| `api.description`        | `string?`                 | Pluginbeschrijving (optioneel)                                                                |
| `api.source`             | `string`                  | Bronpad van plugin                                                                            |
| `api.rootDir`            | `string?`                 | Rootdirectory van plugin (optioneel)                                                          |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve in-memory runtimesnapshot wanneer beschikbaar)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspecifieke configuratie uit `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Gescopeerde logger (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór volledige entry |
| `api.resolvePath(input)` | `(string) => string`      | Pad oplossen relatief aan pluginroot                                                          |

## Interne moduleconventie

Gebruik binnen je plugin lokale barrelbestanden voor interne imports:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Importeer je eigen plugin nooit via `openclaw/plugin-sdk/<your-plugin>`
  vanuit productiecode. Leid interne imports via `./api.ts` of
  `./runtime-api.ts`. Het SDK-pad is alleen het externe contract.
</Warning>

Publieke oppervlakken van via facade geladen gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entrybestanden) geven de voorkeur aan de
actieve runtimeconfiguratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Verpakte facades van gebundelde plugins moeten worden geladen via de plugin-
facadeloaders van OpenClaw; directe imports uit `dist/extensions/...` omzeilen het manifest
en de runtime-sidecarcontroles die verpakte installaties gebruiken voor plugin-eigen code.

Providerplugins kunnen een smalle plugin-lokale contractbarrel blootstellen wanneer een
helper opzettelijk provider-specifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: publieke `api.ts` / `contract-api.ts`-seam voor Claude-
  beta-header en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert providerbuilders,
  helpers voor standaardmodellen en realtime providerbuilders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de providerbuilder
  plus onboarding-/configuratiehelpers.

<Warning>
  Productiecode van extensies moet ook imports van `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer deze dan naar een neutraal SDK-subpad
  zoals `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  capaciteitsgericht oppervlak in plaats van twee plugins aan elkaar te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Ingangspunten" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    `definePluginEntry`- en `defineChannelPluginEntry`-opties.
  </Card>
  <Card title="Runtime-hulpfuncties" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige referentie voor de `api.runtime`-namespace.
  </Card>
  <Card title="Installatie en configuratie" icon="sliders" href="/nl/plugins/sdk-setup">
    Packaging, manifesten en configuratieschema's.
  </Card>
  <Card title="Testen" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en lintregels.
  </Card>
  <Card title="SDK-migratie" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde interfaces.
  </Card>
  <Card title="Interne Plugin-werking" icon="diagram-project" href="/nl/plugins/architecture">
    Diepgaande architectuur en capability-model.
  </Card>
</CardGroup>
