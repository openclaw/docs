---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - Je wilt een referentie voor alle registratiemethoden van OpenClawPluginApi
    - U zoekt een specifieke SDK-export
sidebarTitle: Plugin SDK overview
summary: Importmap, registratie-API-referentie en SDK-architectuur
title: Overzicht van de Plugin SDK
x-i18n:
    generated_at: "2026-05-02T11:24:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin SDK is het getypte contract tussen plugins en core. Deze pagina is de
referentie voor **wat je importeert** en **wat je kunt registreren**.

<Note>
  Deze pagina is voor auteurs van plugins die `openclaw/plugin-sdk/*` binnen
  OpenClaw gebruiken. Voor externe apps, scripts, dashboards, CI-jobs en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik je in plaats daarvan de
  [OpenClaw App SDK](/nl/concepts/openclaw-sdk) en het pakket `@openclaw/sdk`.
</Note>

<Tip>
Zoek je in plaats daarvan een handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins en [Plugin-hooks](/nl/plugins/hooks) voor tool- of lifecycle-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, op zichzelf staande module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Geef voor kanaalspecifieke entry-/buildhelpers
de voorkeur aan `openclaw/plugin-sdk/channel-core`; houd `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde helpers zoals
`buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het door het kanaal beheerde JSON Schema via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De gebundelde
plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
schema's van gebundelde kanalen. Verouderde compatibiliteitsexports blijven op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schema-subpaden is een
patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgemerkte gemaksnaden (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde plugins combineren generieke SDK-subpaden binnen hun eigen `api.ts`- /
  `runtime-api.ts`-barrels; core-consumenten moeten ofwel die plugin-lokale
  barrels gebruiken, of een smal generiek SDK-contract toevoegen wanneer een behoefte echt
  kanaaloverschrijdend is.

Een kleine set helpernaden voor gebundelde plugins verschijnt nog steeds in de gegenereerde exportmap
wanneer ze bijgehouden eigenaarsgebruik hebben. Ze bestaan alleen voor onderhoud van gebundelde plugins
en zijn geen aanbevolen importpaden voor nieuwe plugins van derden.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden eigenaarsgebruik. Kopieer
die importpaden niet naar nieuwe plugins; gebruik in plaats daarvan geïnjecteerde runtimehelpers en
generieke SDK-subpaden voor kanalen.
</Warning>

## Subpadreferentie

De plugin SDK wordt aangeboden als een set smalle subpaden, gegroepeerd per gebied (plugin-
entry, kanaal, provider, auth, runtime, capability, memory en gereserveerde
helpers voor gebundelde plugins). Zie voor de volledige catalogus, gegroepeerd en gelinkt,
[Plugin SDK-subpaden](/nl/plugins/sdk-subpaths).

De gegenereerde lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registratie-API

De callback `register(api)` ontvangt een object `OpenClawPluginApi` met deze
methoden:

### Registratie van capabilities

| Methode                                          | Wat deze registreert                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                 |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentexecutor |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend          |
| `api.registerChannel(...)`                       | Berichtkanaal                         |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese      |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime stemsessies           |
| `api.registerMediaUnderstandingProvider(...)`    | Afbeeldings-/audio-/videoanalyse      |
| `api.registerImageGenerationProvider(...)`       | Afbeeldingsgeneratie                  |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                       |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                        |
| `api.registerWebFetchProvider(...)`              | Provider voor web-fetching / scraping |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                        |

### Tools en opdrachten

| Methode                         | Wat deze registreert                          |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)   |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)          |

Plugin-opdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
door de opdracht beheerde routeringshint nodig heeft. Houd die tekst gericht op de opdracht zelf; voeg geen
provider- of pluginspecifiek beleid toe aan core-promptbuilders.

### Infrastructuur

| Methode                                        | Wat deze registreert                              |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                                        |
| `api.registerHttpRoute(params)`                | Gateway HTTP-eindpunt                            |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                              |
| `api.registerGatewayDiscoveryService(service)` | Advertiser voor lokale Gateway-discovery         |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                                  |
| `api.registerService(service)`                 | Achtergrondservice                               |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                             |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-middleware voor toolresultaten           |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve promptsectie naast memory              |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additief zoek-/leescorpus voor memory            |

### Host-hooks voor workflowplugins

Host-hooks zijn de SDK-naden voor plugins die moeten deelnemen aan de host-
lifecycle, in plaats van alleen een provider, kanaal of tool toe te voegen. Het zijn
generieke contracten; Plan Mode kan ze gebruiken, maar ook goedkeuringsworkflows,
workspace-beleidsgates, achtergrondmonitors, installatiewizards en UI-companion-
plugins.

| Methode                                                                  | Contract waarvan deze eigenaar is                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-beheerde, JSON-compatibele sessiestatus die via Gateway-sessies wordt geprojecteerd                                         |
| `api.enqueueNextTurnInjection(...)`                                      | Duurzame exactly-once context die in de volgende agentbeurt voor één sessie wordt geïnjecteerd                                     |
| `api.registerTrustedToolPolicy(...)`                                     | Gebundeld/vertrouwd pre-plugin toolbeleid dat toolparameters kan blokkeren of herschrijven                                         |
| `api.registerToolMetadata(...)`                                          | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                     |
| `api.registerCommand(...)`                                               | Gescopeerde pluginopdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen; Discord-native opdrachten ondersteunen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control UI-bijdragebeschrijvers voor sessie-, tool-, run- of instellingenoppervlakken                                              |
| `api.registerRuntimeLifecycle(...)`                                      | Opruimcallbacks voor plugin-beheerde runtime-resources op reset-/delete-/reloadpaden                                               |
| `api.registerAgentEventSubscription(...)`                                | Gesaneerde eventabonnementen voor workflowstatus en monitors                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-scratchstatus per run die wordt gewist bij de terminale run-lifecycle                                                       |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-beheerde records voor sessieplannerjobs met deterministische opruiming                                                     |

De contracten splitsen autoriteit bewust op:

- Externe plugins kunnen eigenaar zijn van sessie-extensies, UI-beschrijvers, opdrachten, tool-
  metadata, injecties voor de volgende beurt en normale hooks.
- Vertrouwde toolbeleidsregels draaien vóór gewone `before_tool_call`-hooks en zijn
  alleen gebundeld omdat ze deelnemen aan hostveiligheidsbeleid.
- Gereserveerd opdracht-eigenaarschap is alleen gebundeld. Externe plugins moeten hun
  eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptmuterende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden van legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Plugin-archetype            | Gebruikte hooks                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Goedkeuringsworkflow        | Sessie-extensie, opdrachtvervolg, injectie voor de volgende beurt, UI-beschrijver                                                         |
| Budget-/workspace-beleidsgate | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                                       |
| Achtergrond-lifecyclemonitor | Runtime-lifecycle-opruiming, agent-eventabonnement, eigenaarschap/opruiming van sessieplanner, Heartbeat-promptbijdrage, UI-beschrijver |
| Installatie- of onboardingwizard | Sessie-extensie, gescopeerde opdrachten, Control UI-beschrijver                                                                      |

<Note>
  Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin probeert een
  smallere Gateway-methodescope toe te wijzen. Geef de voorkeur aan pluginspecifieke prefixen voor
  plugin-beheerde methoden.
</Note>

<Accordion title="When to use tool-result middleware">
  Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer
  ze een toolresultaat na uitvoering en voordat de runtime
  dat resultaat terugvoert naar het model moeten herschrijven. Dit is de vertrouwde runtime-neutrale
  naad voor asynchrone uitvoerreducers zoals tokenjuice.

Gebundelde plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
gerichte runtime, bijvoorbeeld `["pi", "codex"]`. Externe plugins
kunnen deze middleware niet registreren; houd normale OpenClaw-pluginhooks aan voor werk
dat geen timing van toolresultaten vóór het model nodig heeft. Het oude Pi-only ingesloten
registratiepad voor extension factories is verwijderd.
</Accordion>

### Registratie van Gateway-discovery

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve
Gateway adverteren op een lokaal discovery-transport zoals mDNS/Bonjour. OpenClaw roept de
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
blijven eigenaar van vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten metadata op topniveau:

- `commands`: expliciete commandoroots die eigendom zijn van de registrar
- `descriptors`: commandodescriptors tijdens het parsen die worden gebruikt voor root-CLI-hulp,
  routering en luie CLI-registratie van plugins

Als je wilt dat een plugincommando lui geladen blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke commandoroot op topniveau dekken die door die
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

Gebruik `commands` alleen op zichzelf wanneer je geen luie root-CLI-registratie nodig hebt.
Dat gretige compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens het parsen.

### CLI-backendregistratie

`api.registerCliBackend(...)` laat een plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI-CLI-backend zoals `codex-cli`.

- De backend-`id` wordt het providerprefix in modelverwijzingen zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen bovenop de
  standaard van de plugin voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen nodig heeft na het samenvoegen
  (bijvoorbeeld het normaliseren van oude flag-vormen).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-engine (één tegelijk actief). De `assemble()`-callback ontvangt `availableTools` en `citationsMode` zodat de engine prompttoevoegingen kan afstemmen. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapability                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Adapter voor geheugenruntime                                                                                                                                      |

### Geheugenembeddingadapters

| Methode                                        | Wat deze registreert                         |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugenembeddingadapter voor de actieve plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen
  zodat companion-plugins geëxporteerde geheugenartefacten kunnen consumeren via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de privélay-out van een specifieke
  geheugenplugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastzetten op een exacte `provider/model`-
  verwijzing, zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- `registerMemoryEmbeddingProvider` laat de actieve geheugenplugin één
  of meer embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste
  door de plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Events en lifecycle

| Methode                                      | Wat deze doet                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook           |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding    |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, veelvoorkomende hooknamen en guard-
semantiek.

### Semantiek van hookbeslissingen

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaard modeldispatchpad overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je routering voor inkomende threads/onderwerpen nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor opstartstatus die eigendom is van de Gateway, in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer wijzigingen in de Cron-lifecycle die eigendom is van de Gateway. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wekschedulers, en houd OpenClaw als bron van waarheid voor controles op verschuldigde taken en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                                         |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                            |
| `api.name`               | `string`                  | Weergavenaam                                                                                         |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                            |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                                      |
| `api.source`             | `string`                  | Bronpad van plugin                                                                                   |
| `api.rootDir`            | `string?`                 | Hoofdmap van plugin (optioneel)                                                                      |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve in-memory runtimesnapshot wanneer beschikbaar)                 |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-specifieke configuratie uit `plugins.entries.<id>.config`                                     |
| `api.runtime`            | `PluginRuntime`           | [Runtimehelpers](/nl/plugins/sdk-runtime)                                                               |
| `api.logger`             | `PluginLogger`            | Gescopeerde logger (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór de volledige entry     |
| `api.resolvePath(input)` | `(string) => string`      | Pad relatief aan pluginroot oplossen                                                                 |

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
  vanuit productiecode. Routeer interne imports via `./api.ts` of
  `./runtime-api.ts`. Het SDK-pad is alleen het externe contract.
</Warning>

Publieke oppervlakken van via facade geladen gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entrybestanden) geven de voorkeur aan de
actieve runtimeconfiguratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Facades van verpakte gebundelde plugins moeten worden geladen via OpenClaw's plugin-
facadeladers; directe imports uit `dist/extensions/...` omzeilen de manifest-
en runtime-sidecarcontroles die verpakte installaties gebruiken voor code die eigendom is van de plugin.

Providerplugins kunnen een smalle pluginlokale contractbarrel blootstellen wanneer een
helper opzettelijk providerspecifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: publieke `api.ts` / `contract-api.ts`-naad voor Claude-
  beta-header- en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert providerbuilders,
  standaardmodelhelpers en realtimeproviderbuilders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de providerbuilder
  plus onboarding-/configuratiehelpers.

<Warning>
  Productiecode van extensies moet ook imports uit `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer deze dan naar een neutraal SDK-subpad
  zoals `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  capability-georiënteerd oppervlak in plaats van twee plugins aan elkaar te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Ingangspunten" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    Opties voor `definePluginEntry` en `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-helpers" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige referentie voor de naamruimte `api.runtime`.
  </Card>
  <Card title="Setup en configuratie" icon="sliders" href="/nl/plugins/sdk-setup">
    Packaging, manifests en configuratieschema's.
  </Card>
  <Card title="Testen" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en lintregels.
  </Card>
  <Card title="SDK-migratie" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Plugin-internals" icon="diagram-project" href="/nl/plugins/architecture">
    Diepgaande architectuur en capabilitymodel.
  </Card>
</CardGroup>
