---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - U wilt een naslagwerk voor alle registratiemethoden van OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Importmap, API-referentie voor registratie en SDK-architectuur
title: Overzicht van de Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin-SDK is het getypeerde contract tussen plugins en core. Deze pagina is de
referentie voor **wat je moet importeren** en **wat je kunt registreren**.

<Note>
  Deze pagina is bedoeld voor pluginauteurs die `openclaw/plugin-sdk/*` gebruiken binnen
  OpenClaw. Voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik je in plaats daarvan de
  [OpenClaw App SDK](/nl/concepts/openclaw-sdk) en het pakket `@openclaw/sdk`.
</Note>

<Tip>
Zoek je in plaats daarvan een praktische handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins en [Pluginhooks](/nl/plugins/hooks) voor tool- of lifecycle-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Geef voor kanaalspecifieke entry/build-helpers
de voorkeur aan `openclaw/plugin-sdk/channel-core`; houd `openclaw/plugin-sdk/core` voor
het bredere overkoepelende oppervlak en gedeelde helpers zoals
`buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het JSON Schema dat eigendom is van het kanaal via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De gebundelde
plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema` voor behouden
gebundelde kanaalschema's. Verouderde compatibiliteitsexports blijven beschikbaar op
`plugin-sdk/channel-config-schema-legacy`; geen van beide gebundelde schema-subpaden is een
patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgebonden convenience-seams (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebundelde plugins stellen generieke SDK-subpaden samen binnen hun eigen `api.ts` /
  `runtime-api.ts`-barrels; core-consumenten moeten ofwel die pluginlokale
  barrels gebruiken, of een smal generiek SDK-contract toevoegen wanneer een behoefte echt
  kanaaloverstijgend is.

Een kleine set helper-seams voor gebundelde plugins verschijnt nog steeds in de gegenereerde exportmap
wanneer ze bijgehouden eigenaargebruik hebben. Ze bestaan alleen voor onderhoud van gebundelde plugins
en worden niet aanbevolen als importpaden voor nieuwe externe
plugins.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden eigenaargebruik. Kopieer
die importpaden niet naar nieuwe plugins; gebruik in plaats daarvan geïnjecteerde runtime-helpers en
generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De plugin-SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd per gebied (plugin
entry, kanaal, provider, auth, runtime, capability, memory en gereserveerde
helpers voor gebundelde plugins). Zie voor de volledige catalogus, gegroepeerd en gelinkt,
[Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).

De gegenereerde lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat deze registreert                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                 |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentexecutor |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend          |
| `api.registerChannel(...)`                       | Berichtenkanaal                       |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese      |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies         |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse            |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                        |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                       |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                        |
| `api.registerWebFetchProvider(...)`              | Webfetch-/scrapeprovider              |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                        |

### Tools en opdrachten

| Methode                         | Wat deze registreert                          |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)   |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)          |

Pluginopdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een korte,
opdrachtgebonden routinghint nodig heeft. Houd die tekst bij de opdracht zelf; voeg geen
provider- of pluginspecifiek beleid toe aan core-promptbuilders.

### Infrastructuur

| Methode                                        | Wat deze registreert                          |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Eventhook                                     |
| `api.registerHttpRoute(params)`                | Gateway HTTP-endpoint                         |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                           |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discovery-advertiser           |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                               |
| `api.registerService(service)`                 | Achtergrondservice                            |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                          |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result-middleware                |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve promptsectie naast memory           |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additieve memory-zoek-/leescorpus             |

### Hosthooks voor workflowplugins

Hosthooks zijn de SDK-seams voor plugins die moeten deelnemen aan de host-
lifecycle in plaats van alleen een provider, kanaal of tool toe te voegen. Het zijn
generieke contracten; Plan Mode kan ze gebruiken, maar dat geldt ook voor goedkeuringsworkflows,
workspace-beleidsgates, achtergrondmonitors, setupwizards en UI-begeleidende
plugins.

| Methode                                                                  | Contract waarvan deze eigenaar is                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-eigendom, JSON-compatibele sessiestatus geprojecteerd via Gateway-sessies      |
| `api.enqueueNextTurnInjection(...)`                                      | Duurzame exactly-once context geïnjecteerd in de volgende agentbeurt voor één sessie   |
| `api.registerTrustedToolPolicy(...)`                                     | Gebundeld/vertrouwd pre-plugin toolbeleid dat toolparameters kan blokkeren of herschrijven |
| `api.registerToolMetadata(...)`                                          | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen         |
| `api.registerCommand(...)`                                               | Gescopecde pluginopdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen |
| `api.registerControlUiDescriptor(...)`                                   | Control UI-bijdragedescriptors voor sessie-, tool-, run- of instellingenoppervlakken   |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-callbacks voor runtime-resources in plugineigendom op reset/delete/reload-paden |
| `api.registerAgentEventSubscription(...)`                                | Gesanitiseerde eventabonnementen voor workflowstatus en monitors                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-scratchstatus per run, gewist bij terminale run-lifecycle                       |
| `api.registerSessionSchedulerJob(...)`                                   | Taakrecords van de sessieplanner in plugineigendom met deterministische cleanup        |

De contracten splitsen autoriteit bewust op:

- Externe plugins kunnen eigenaar zijn van sessie-extensies, UI-descriptors, opdrachten, tool-
  metadata, next-turn-injections en normale hooks.
- Vertrouwd toolbeleid draait vóór gewone `before_tool_call`-hooks en is
  alleen gebundeld omdat het deelneemt aan het veiligheidsbeleid van de host.
- Gereserveerd opdrachteigendom is alleen gebundeld. Externe plugins moeten hun
  eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptmuterende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden uit legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Pluginarchetype             | Gebruikte hooks                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Goedkeuringsworkflow        | Sessie-extensie, opdrachtvoortzetting, next-turn-injection, UI-descriptor                                                            |
| Budget-/workspace-beleidsgate | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                                  |
| Achtergrond-lifecyclemonitor | Runtime-lifecycle-cleanup, agenteventabonnement, eigendom/cleanup van sessieplanner, heartbeat-promptbijdrage, UI-descriptor       |
| Setup- of onboardingwizard  | Sessie-extensie, gescopecde opdrachten, Control UI-descriptor                                                                        |

<Note>
  Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin probeert een
  smallere scope voor de gatewaymethode toe te wijzen. Geef de voorkeur aan pluginspecifieke prefixes voor
  methoden in plugineigendom.
</Note>

<Accordion title="Wanneer tool-result-middleware gebruiken">
  Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer
  ze een toolresultaat na uitvoering en voordat de runtime
  dat resultaat terugvoert naar het model moeten herschrijven. Dit is de vertrouwde runtime-neutrale
  seam voor asynchrone outputreducers zoals tokenjuice.

Gebundelde plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
gerichte runtime, bijvoorbeeld `["pi", "codex"]`. Externe plugins
kunnen deze middleware niet registreren; houd normale OpenClaw-pluginhooks aan voor werk
dat geen pre-model tool-result-timing nodig heeft. Het oude, alleen voor Pi bedoelde ingebedde
registratiepad voor extension factories is verwijderd.
</Accordion>

### Gateway-discoveryregistratie

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve
Gateway adverteren op een lokaal discoverytransport zoals mDNS/Bonjour. OpenClaw roept de
service aan tijdens het opstarten van de Gateway wanneer lokale discovery is ingeschakeld, geeft de
huidige Gateway-poorten en niet-geheime TXT-hintgegevens door, en roept de teruggegeven
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
authenticatie. Discovery is een routeringshint; Gateway-auth en TLS-pinning blijven
verantwoordelijk voor vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten metadata op topniveau:

- `commands`: expliciete commandoroots die eigendom zijn van de registrar
- `descriptors`: commandodescriptors tijdens het parsen die worden gebruikt voor root-CLI-help,
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
Dat enthousiaste compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens het parsen.

### CLI-backendregistratie

`api.registerCliBackend(...)` laat een plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI-CLI-backend zoals `codex-cli`.

- De backend-`id` wordt de providerprefix in modelverwijzingen zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie blijft winnen. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen bovenop de
  pluginstandaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen nodig heeft na het samenvoegen
  (bijvoorbeeld het normaliseren van oude vlagvormen).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context-engine (een tegelijk actief). De callback `assemble()` ontvangt `availableTools` en `citationsMode`, zodat de engine prompttoevoegingen kan afstemmen.          |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapability                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Runtime-adapter voor geheugen                                                                                                                                            |

### Adapters voor geheugen-embeddings

| Methode                                        | Wat deze registreert                             |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugen-embeddingadapter voor de actieve plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen
  zodat companionplugins geëxporteerde geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de private indeling van een specifieke
  geheugenplugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastpinnen op een exacte `provider/model`-
  verwijzing, zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- `registerMemoryEmbeddingProvider` laat de actieve geheugenplugin een of meer
  embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste
  door de plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Gebeurtenissen en levenscyclus

| Methode                                      | Wat deze doet                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook                |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding         |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, algemene hooknamen en guard-semantiek.

### Beslissingssemantiek van hooks

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `block`), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `block`), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler dispatch claimt, worden handlers met lagere prioriteit en het standaardpad voor modeldispatch overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `cancel`), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je routering voor inkomende threads/topics nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor opstartstatus die eigendom is van de gateway in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer lifecycle-wijzigingen van Cron die eigendom zijn van de gateway. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als bron van waarheid voor controles op verschuldigde taken en uitvoering.

### Velden van het API-object

| Veld                     | Type                      | Beschrijving                                                                                         |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                            |
| `api.name`               | `string`                  | Weergavenaam                                                                                         |
| `api.version`            | `string?`                 | Pluginversie (optioneel)                                                                             |
| `api.description`        | `string?`                 | Pluginbeschrijving (optioneel)                                                                       |
| `api.source`             | `string`                  | Bronpad van de plugin                                                                                |
| `api.rootDir`            | `string?`                 | Rootmap van de plugin (optioneel)                                                                    |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve runtime-snapshot in het geheugen wanneer beschikbaar)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspecifieke configuratie uit `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                              |
| `api.logger`             | `PluginLogger`            | Gescopeerde logger (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte startup/setup-venster voorafgaand aan full-entry  |
| `api.resolvePath(input)` | `(string) => string`      | Pad oplossen relatief aan pluginroot                                                                 |

## Interne moduleconventie

Gebruik binnen je plugin lokale barrel-bestanden voor interne imports:

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

Publieke oppervlakken van facade-geladen gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entry-bestanden) geven de voorkeur aan de
actieve runtime-configuratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Packaged facades van gebundelde plugins moeten worden geladen via de plugin-
facadeloaders van OpenClaw; directe imports uit `dist/extensions/...` omzeilen gestagede runtime-
dependency-mirrors die packaged installs gebruiken voor dependencies die eigendom zijn van plugins.

Providerplugins kunnen een smalle plugin-lokale contract-barrel blootstellen wanneer een
helper bewust providerspecifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: publieke `api.ts` / `contract-api.ts`-seam voor Claude-
  beta-header- en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert providerbuilders,
  helpers voor standaardmodellen en realtime-providerbuilders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de providerbuilder
  plus onboarding-/configuratiehelpers.

<Warning>
  Productiecode van extensies moet ook imports van `openclaw/plugin-sdk/<other-plugin>`
  vermijden. Als een helper echt gedeeld is, promoveer deze dan naar een neutraal SDK-subpad
  zoals `openclaw/plugin-sdk/speech`, `.../provider-model-shared` of een ander
  capability-georiënteerd oppervlak in plaats van twee plugins aan elkaar te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    Opties voor `definePluginEntry` en `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-helpers" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige referentie voor de namespace `api.runtime`.
  </Card>
  <Card title="Setup en configuratie" icon="sliders" href="/nl/plugins/sdk-setup">
    Packaging, manifests en configuratieschema's.
  </Card>
  <Card title="Testen" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpprogramma's en lintregels.
  </Card>
  <Card title="SDK-migratie" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Plugin-internals" icon="diagram-project" href="/nl/plugins/architecture">
    Diepgaand architectuur- en capabilitymodel.
  </Card>
</CardGroup>
