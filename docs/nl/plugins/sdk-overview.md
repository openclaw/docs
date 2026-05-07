---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - Je wilt een referentie voor alle registratiemethoden van OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: Plugin SDK overview
summary: Importmap, registratie-API-referentie en SDK-architectuur
title: Overzicht van de Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De plugin-SDK is het getypeerde contract tussen plugins en core. Deze pagina is de
referentie voor **wat je moet importeren** en **wat je kunt registreren**.

<Note>
  Deze pagina is voor plugin-auteurs die `openclaw/plugin-sdk/*` gebruiken binnen
  OpenClaw. Voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
  die agents via de Gateway willen uitvoeren, gebruik je in plaats daarvan de
  [OpenClaw App SDK](/nl/concepts/openclaw-sdk) en het pakket `@openclaw/sdk`.
</Note>

<Tip>
Zoek je in plaats daarvan een handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins, [CLI-backendplugins](/nl/plugins/cli-backend-plugins) voor lokale AI-CLI-backends, en [Plugin-hooks](/nl/plugins/hooks) voor tool- of levenscyclus-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Voor kanaalspecifieke
entry-/build-helpers geef je de voorkeur aan `openclaw/plugin-sdk/channel-core`;
houd `openclaw/plugin-sdk/core` voor het bredere overkoepelende oppervlak en
gedeelde helpers zoals `buildChannelConfigSchema`.

Voor kanaalconfiguratie publiceer je het kanaaleigen JSON Schema via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De
meegeleverde plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema`
voor behouden schema's van meegeleverde kanalen. Verouderde compatibiliteitsexports
blijven op `plugin-sdk/channel-config-schema-legacy`; geen van beide meegeleverde
schemasubpaden is een patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgemerkte convenience-seams (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Meegeleverde plugins stellen generieke SDK-subpaden samen binnen hun eigen
  `api.ts`- / `runtime-api.ts`-barrels; core-consumenten moeten die pluginlokale
  barrels gebruiken of een smal generiek SDK-contract toevoegen wanneer een
  behoefte echt kanaaloverstijgend is.

Een kleine set helper-seams voor meegeleverde plugins verschijnt nog steeds in
de gegenereerde export-map wanneer ze bijgehouden eigenaargebruik hebben. Ze
bestaan alleen voor onderhoud van meegeleverde plugins en worden niet aanbevolen
als importpaden voor nieuwe plugins van derden.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` worden
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden eigenaargebruik.
Kopieer die importpaden niet naar nieuwe plugins; gebruik in plaats daarvan
geinjecteerde runtime-helpers en generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De plugin-SDK wordt beschikbaar gesteld als een set smalle subpaden, gegroepeerd
per gebied (plugin-entry, kanaal, provider, auth, runtime, capability, memory en
gereserveerde helpers voor meegeleverde plugins). Zie
[Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths) voor de volledige catalogus,
gegroepeerd en met links.

De gegenereerde lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat dit registreert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentexecutor  |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend           |
| `api.registerChannel(...)`                       | Messagingkanaal                        |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak / STT-synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies          |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                         |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                        |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                         |
| `api.registerWebFetchProvider(...)`              | Web-fetch-/scrapeprovider              |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                         |

### Tools en opdrachten

| Methode                         | Wat dit registreert                              |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)      |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)             |

Plugin-opdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een
korte, opdrachteigen routinghint nodig heeft. Houd die tekst gericht op de
opdracht zelf; voeg geen provider- of pluginspecifiek beleid toe aan core
prompt-builders.

### Infrastructuur

| Methode                                        | Wat dit registreert                       |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                                |
| `api.registerHttpRoute(params)`                | Gateway HTTP-eindpunt                     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC-methode                       |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discovery-adverteerder     |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                           |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-functie-CLI onder `openclaw nodes`   |
| `api.registerService(service)`                 | Achtergrondservice                        |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                      |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-middleware voor toolresultaten    |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve promptsectie naast memory       |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additieve zoek-/leescorpus voor memory    |

### Host-hooks voor workflowplugins

Host-hooks zijn de SDK-seams voor plugins die moeten deelnemen aan de
hostlevenscyclus in plaats van alleen een provider, kanaal of tool toe te voegen.
Het zijn generieke contracten; Plan Mode kan ze gebruiken, maar dat geldt ook voor
approval-workflows, workspace-beleidscontroles, achtergrondmonitors,
setupwizards en UI-companionplugins.

| Methode                                                                  | Contract dat dit beheert                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugineigen, JSON-compatibele sessiestatus die via Gateway-sessies wordt geprojecteerd                                             |
| `api.enqueueNextTurnInjection(...)`                                      | Duurzame precies-eenmaal-context die in de volgende agentbeurt voor een sessie wordt geinjecteerd                                  |
| `api.registerTrustedToolPolicy(...)`                                     | Meegeleverd/vertrouwd pre-plugin toolbeleid dat toolparameters kan blokkeren of herschrijven                                      |
| `api.registerToolMetadata(...)`                                          | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen                                                     |
| `api.registerCommand(...)`                                               | Gescopeerde plugin-opdrachten; opdrachtresultaten kunnen `continueAgent: true` instellen; Discord-native opdrachten ondersteunen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control UI-contributiedescriptors voor sessie-, tool-, run- of instellingenoppervlakken                                           |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-callbacks voor plugineigen runtime-resources op reset-/delete-/reload-paden                                                |
| `api.registerAgentEventSubscription(...)`                                | Gesaneerde eventabonnementen voor workflowstatus en monitors                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Per-run plugin scratch state die wordt gewist bij de terminale runlevenscyclus                                                     |
| `api.registerSessionSchedulerJob(...)`                                   | Plugineigen sessieplanner-jobrecords met deterministische cleanup                                                                  |

De contracten splitsen autoriteit bewust op:

- Externe plugins kunnen sessie-extensies, UI-descriptors, opdrachten, toolmetadata, next-turn-injections en normale hooks beheren.
- Vertrouwd toolbeleid draait voor gewone `before_tool_call`-hooks en is alleen meegeleverd, omdat het deelneemt aan het veiligheidsbeleid van de host.
- Gereserveerd opdrachteigendom is alleen voor meegeleverde onderdelen. Externe plugins moeten hun eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptmuterende hooks uit, inclusief `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, promptvelden van legacy `before_agent_start` en `enqueueNextTurnInjection`.

Voorbeelden van niet-Plan-consumenten:

| Plugin-archetype            | Gebruikte hooks                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Approval-workflow           | Sessie-extensie, opdrachtcontinuatie, next-turn-injection, UI-descriptor                                                            |
| Budget-/workspace-beleidsgate | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                                 |
| Achtergrond-levenscyclusmonitor | Runtime-levenscyclus-cleanup, agent-eventabonnement, eigendom/cleanup van sessieplanner, Heartbeat-promptcontributie, UI-descriptor |
| Setup- of onboardingwizard  | Sessie-extensie, gescopeerde opdrachten, Control UI-descriptor                                                                      |

<Note>
  Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin probeert een
  smallere gateway-method scope toe te wijzen. Geef de voorkeur aan pluginspecifieke
  prefixes voor plugineigen methoden.
</Note>

<Accordion title="Wanneer toolresultaat-middleware gebruiken">
  Meegeleverde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken
  wanneer ze een toolresultaat moeten herschrijven na uitvoering en voordat de
  runtime dat resultaat terugvoert naar het model. Dit is de vertrouwde
  runtime-neutrale seam voor async-outputreducers zoals tokenjuice.

Gebundelde plugins moeten `contracts.agentToolResultMiddleware` declareren voor elke
beoogde runtime, bijvoorbeeld `["pi", "codex"]`. Externe plugins
kunnen deze middleware niet registreren; behoud normale OpenClaw-pluginhooks voor werk
dat geen toolresultaattiming vóór het model nodig heeft. Het oude, alleen voor Pi bedoelde pad voor registratie van ingebedde
extension-factory's is verwijderd.
</Accordion>

### Registratie van Gateway-detectie

Met `api.registerGatewayDiscoveryService(...)` kan een plugin de actieve
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
authenticatie. Detectie is een routeringshint; Gateway-authenticatie en TLS-pinning
blijven eigenaar van vertrouwen.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten opdrachtmetadata:

- `commands`: expliciete opdrachtnamen die eigendom zijn van de registrar
- `descriptors`: opdrachtbeschrijvingen tijdens het parsen die worden gebruikt voor CLI-help,
  routering en luie registratie van plugin-CLI's
- `parentPath`: optioneel pad van de bovenliggende opdracht voor geneste opdrachtgroepen, zoals
  `["nodes"]`

Voor paired-node-functies heeft
`api.registerNodeCliFeature(registrar, opts?)` de voorkeur. Dit is een kleine wrapper rond
`api.registerCli(..., { parentPath: ["nodes"] })` en maakt opdrachten zoals
`openclaw nodes canvas` expliciete node-functies die eigendom zijn van de plugin.

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
Dat gretige compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens het parsen.

### Registratie van CLI-backend

Met `api.registerCliBackend(...)` kan een plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI-CLI-backend zoals `codex-cli`.

- De backend-`id` wordt het providerprefix in modelreferenties zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen over de
  pluginstandaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen nodig heeft na het samenvoegen
  (bijvoorbeeld het normaliseren van oude flag-vormen).
- Gebruik `resolveExecutionArgs` voor request-scoped argv-herschrijvingen die bij
  het CLI-dialect horen, zoals het koppelen van OpenClaw-denkniveaus aan een native effort-
  flag.

Zie voor een end-to-end auteursgids
[CLI-backendplugins](/nl/plugins/cli-backend-plugins).

### Exclusieve slots

| Methode                                    | Wat deze registreert                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Contextengine (één tegelijk actief). De `assemble()`-callback ontvangt `availableTools` en `citationsMode` zodat de engine prompttoevoegingen kan aanpassen. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapaciteit                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Runtime-adapter voor geheugen                                                                                                                              |

### Adapters voor geheugenembeddings

| Methode                                        | Wat deze registreert                           |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugenembeddingadapter voor de actieve plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` beschikbaar maken
  zodat begeleidende plugins geëxporteerde geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de privé-indeling van een specifieke
  geheugenplugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastzetten op een exacte `provider/model`-
  referentie, zoals `ollama/qwen3:8b`, zonder de actieve fallback-
  keten te erven.
- Met `registerMemoryEmbeddingProvider` kan de actieve geheugenplugin één
  of meer embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste,
  door de plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Gebeurtenissen en lifecycle

| Methode                                      | Wat deze doet                  |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook         |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding  |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, veelvoorkomende hooknamen en guard-
semantiek.

### Beslissingssemantiek voor hooks

- `before_tool_call`: het retourneren van `{ block: true }` is terminal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `block`), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `block`), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminal. Zodra een handler de dispatch claimt, worden handlers met lagere prioriteit en het standaardpad voor modeldispatch overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als het weglaten van `cancel`), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je routering van inkomende threads/onderwerpen nodig hebt. Houd `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor opstartstatus die eigendom is van de gateway, in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer lifecycle-wijzigingen van cron die eigendom zijn van de gateway. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als bron van waarheid voor vervalcontroles en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-id                                                                                   |
| `api.name`               | `string`                  | Weergavenaam                                                                                |
| `api.version`            | `string?`                 | Pluginversie (optioneel)                                                                    |
| `api.description`        | `string?`                 | Pluginbeschrijving (optioneel)                                                              |
| `api.source`             | `string`                  | Bronpad van plugin                                                                          |
| `api.rootDir`            | `string?`                 | Hoofdmap van plugin (optioneel)                                                             |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve in-memory runtimesnapshot wanneer beschikbaar)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspecifieke configuratie uit `plugins.entries.<id>.config`                             |
| `api.runtime`            | `PluginRuntime`           | [Runtimehelpers](/nl/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór volledige entry |
| `api.resolvePath(input)` | `(string) => string`      | Los pad op relatief aan de pluginroot                                                       |

## Conventie voor interne modules

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

Publieke oppervlakken van via facades geladen gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare publieke entrybestanden) gebruiken bij voorkeur de
actieve runtimeconfiguratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Verpakte facades van gebundelde plugins moeten worden geladen via OpenClaw's plugin-
facadeladers; directe imports uit `dist/extensions/...` omzeilen de manifest-
en runtime-sidecarcontroles die verpakte installaties gebruiken voor code die eigendom is van plugins.

Provider-Plugins kunnen een smalle, Plugin-lokale contractbarrel beschikbaar maken wanneer een
helper bewust provider-specifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: openbare `api.ts` / `contract-api.ts`-seam voor Claude-
  beta-header en `service_tier`-streamhelpers.
- **`@openclaw/openai-provider`**: `api.ts` exporteert providerbuilders,
  standaardmodelhelpers en realtime-providerbuilders.
- **`@openclaw/openrouter-provider`**: `api.ts` exporteert de providerbuilder
  plus onboarding-/configuratiehelpers.

<Warning>
  Productiecode van extensies moet ook `openclaw/plugin-sdk/<other-plugin>`-
  imports vermijden. Als een helper echt gedeeld is, promoot deze dan naar een
  neutraal SDK-subpad zoals `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared`, of een ander capability-gericht oppervlak in
  plaats van twee Plugins aan elkaar te koppelen.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Toegangspunten" icon="door-open" href="/nl/plugins/sdk-entrypoints">
    Opties voor `definePluginEntry` en `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-helpers" icon="gears" href="/nl/plugins/sdk-runtime">
    Volledige referentie voor de `api.runtime`-naamruimte.
  </Card>
  <Card title="Setup en configuratie" icon="sliders" href="/nl/plugins/sdk-setup">
    Packaging, manifesten en configuratieschema's.
  </Card>
  <Card title="Testen" icon="vial" href="/nl/plugins/sdk-testing">
    Testhulpprogramma's en lintregels.
  </Card>
  <Card title="SDK-migratie" icon="arrows-turn-right" href="/nl/plugins/sdk-migration">
    Migreren vanaf verouderde oppervlakken.
  </Card>
  <Card title="Plugin-internals" icon="diagram-project" href="/nl/plugins/architecture">
    Diepgaande architectuur en capability-model.
  </Card>
</CardGroup>
