---
read_when:
    - Je moet weten uit welk SDK-subpad je moet importeren
    - Je wilt een referentie voor alle registratiemethoden van OpenClawPluginApi
    - Je zoekt een specifieke SDK-export op
sidebarTitle: SDK overview
summary: Importmap, registratie-API-referentie en SDK-architectuur
title: Overzicht van de Plugin SDK
x-i18n:
    generated_at: "2026-04-29T23:05:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7652c2be756dad14792f59f36fa2fc2becd1681454005cf391e401b89999b857
    source_path: plugins/sdk-overview.md
    workflow: 16
---

De Plugin-SDK is het getypeerde contract tussen plugins en core. Deze pagina is de
referentie voor **wat je moet importeren** en **wat je kunt registreren**.

<Tip>
Zoek je in plaats daarvan een handleiding? Begin met [Plugins bouwen](/nl/plugins/building-plugins), gebruik [Kanaalplugins](/nl/plugins/sdk-channel-plugins) voor kanaalplugins, [Providerplugins](/nl/plugins/sdk-provider-plugins) voor providerplugins en [Plugin-hooks](/nl/plugins/hooks) voor tool- of levenscyclus-hookplugins.
</Tip>

## Importconventie

Importeer altijd vanuit een specifiek subpad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Elk subpad is een kleine, zelfstandige module. Dit houdt het opstarten snel en
voorkomt problemen met circulaire afhankelijkheden. Geef voor kanaalspecifieke
entry-/build-helpers de voorkeur aan `openclaw/plugin-sdk/channel-core`; houd
`openclaw/plugin-sdk/core` voor de bredere overkoepelende surface en gedeelde
helpers zoals `buildChannelConfigSchema`.

Publiceer voor kanaalconfiguratie het kanaal-eigen JSON Schema via
`openclaw.plugin.json#channelConfigs`. Het subpad `plugin-sdk/channel-config-schema`
is bedoeld voor gedeelde schemaprimitieven en de generieke builder. De
meegeleverde plugins van OpenClaw gebruiken `plugin-sdk/bundled-channel-config-schema`
voor behouden schema's van meegeleverde kanalen. Verouderde compatibiliteitsexports
blijven beschikbaar op `plugin-sdk/channel-config-schema-legacy`; geen van beide
meegeleverde schema-subpaden is een patroon voor nieuwe plugins.

<Warning>
  Importeer geen provider- of kanaalgebonden gemaksinterfaces (bijvoorbeeld
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Meegeleverde plugins stellen generieke SDK-subpaden samen binnen hun eigen
  `api.ts`- / `runtime-api.ts`-barrels; core-consumenten moeten die
  plugin-lokale barrels gebruiken of een smal generiek SDK-contract toevoegen
  wanneer een behoefte echt kanaaloverstijgend is.

Een kleine set helperinterfaces voor meegeleverde plugins verschijnt nog steeds
in de gegenereerde exportmap wanneer ze bijgehouden eigenaarsgebruik hebben. Ze
bestaan alleen voor onderhoud van meegeleverde plugins en zijn geen aanbevolen
importpaden voor nieuwe plugins van derden.

`openclaw/plugin-sdk/discord` en `openclaw/plugin-sdk/telegram-account` blijven
ook behouden als verouderde compatibiliteitsfacades voor bijgehouden
eigenaarsgebruik. Kopieer die importpaden niet naar nieuwe plugins; gebruik in
plaats daarvan geinjecteerde runtimehelpers en generieke kanaal-SDK-subpaden.
</Warning>

## Subpadreferentie

De Plugin-SDK wordt aangeboden als een set smalle subpaden gegroepeerd per
gebied (plugin-entry, kanaal, provider, auth, runtime, capability, memory en
gereserveerde helpers voor meegeleverde plugins). Zie voor de volledige
catalogus, gegroepeerd en gelinkt,
[Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).

De gegenereerde lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registratie-API

De callback `register(api)` ontvangt een `OpenClawPluginApi`-object met deze
methoden:

### Capability-registratie

| Methode                                          | Wat dit registreert                  |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Tekstinferentie (LLM)                |
| `api.registerAgentHarness(...)`                  | Experimentele low-level agentexecutor |
| `api.registerCliBackend(...)`                    | Lokale CLI-inferentiebackend         |
| `api.registerChannel(...)`                       | Berichtenkanaal                      |
| `api.registerSpeechProvider(...)`                | Tekst-naar-spraak- / STT-synthese    |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcriptie      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime spraaksessies        |
| `api.registerMediaUnderstandingProvider(...)`    | Beeld-/audio-/videoanalyse           |
| `api.registerImageGenerationProvider(...)`       | Beeldgeneratie                       |
| `api.registerMusicGenerationProvider(...)`       | Muziekgeneratie                      |
| `api.registerVideoGenerationProvider(...)`       | Videogeneratie                       |
| `api.registerWebFetchProvider(...)`              | Provider voor web-fetch/scraping     |
| `api.registerWebSearchProvider(...)`             | Webzoekfunctie                       |

### Tools en opdrachten

| Methode                         | Wat dit registreert                            |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agenttool (vereist of `{ optional: true }`)    |
| `api.registerCommand(def)`      | Aangepaste opdracht (omzeilt de LLM)           |

Plugin-opdrachten kunnen `agentPromptGuidance` instellen wanneer de agent een
korte, opdracht-eigen routinghint nodig heeft. Houd die tekst gericht op de
opdracht zelf; voeg geen provider- of plugin-specifiek beleid toe aan
core-promptbuilders.

### Infrastructuur

| Methode                                        | Wat dit registreert                          |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-hook                                   |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-eindpunt                        |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-methode                          |
| `api.registerGatewayDiscoveryService(service)` | Lokale Gateway-discoveryadvertiser           |
| `api.registerCli(registrar, opts?)`            | CLI-subopdracht                              |
| `api.registerService(service)`                 | Achtergrondservice                           |
| `api.registerInteractiveHandler(registration)` | Interactieve handler                         |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-middleware voor toolresultaten       |
| `api.registerMemoryPromptSupplement(builder)`  | Additieve geheugengerelateerde promptsectie  |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additief corpus voor geheugen zoeken/lezen   |

### Host-hooks voor workflowplugins

Host-hooks zijn de SDK-interfaces voor plugins die moeten deelnemen aan de
hostlevenscyclus in plaats van alleen een provider, kanaal of tool toe te voegen.
Het zijn generieke contracten; Planmodus kan ze gebruiken, maar dat geldt ook
voor goedkeuringsworkflows, werkruimtebeleidsgates, achtergrondmonitors,
setupwizards en UI-begeleidingsplugins.

| Methode                                                                  | Contract waarvan dit eigenaar is                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `api.registerSessionExtension(...)`                                      | Plugin-eigen, JSON-compatibele sessiestatus geprojecteerd via Gateway-sessies        |
| `api.enqueueNextTurnInjection(...)`                                      | Persistente exactly-once-context geinjecteerd in de volgende agentbeurt voor een sessie |
| `api.registerTrustedToolPolicy(...)`                                     | Meegeleverd/vertrouwd pre-plugin-toolbeleid dat toolparameters kan blokkeren of herschrijven |
| `api.registerToolMetadata(...)`                                          | Weergavemetadata voor de toolcatalogus zonder de toolimplementatie te wijzigen       |
| `api.registerCommand(...)`                                               | Pluginopdrachten met scope; opdrachtresultaten kunnen `continueAgent: true` instellen |
| `api.registerControlUiDescriptor(...)`                                   | Controle-UI-bijdragedescriptoren voor sessie-, tool-, run- of instellingenoppervlakken |
| `api.registerRuntimeLifecycle(...)`                                      | Opschooncallbacks voor plugin-eigen runtimebronnen op reset-/delete-/reload-paden    |
| `api.registerAgentEventSubscription(...)`                                | Gesaneerde eventabonnementen voor workflowstatus en monitors                         |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-scratchstatus per run gewist bij de terminale runlevenscyclus                 |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigen sessieplanner-jobrecords met deterministische cleanup                   |

De contracten splitsen bevoegdheden bewust op:

- Externe plugins kunnen eigenaar zijn van sessie-extensies, UI-descriptoren,
  opdrachten, toolmetadata, next-turn-injecties en normale hooks.
- Vertrouwd toolbeleid draait voor gewone `before_tool_call`-hooks en is alleen
  voor meegeleverde plugins, omdat het deelneemt aan het veiligheidsbeleid van
  de host.
- Gereserveerd opdrachteigendom is alleen voor meegeleverde plugins. Externe
  plugins moeten hun eigen opdrachtnamen of aliassen gebruiken.
- `allowPromptInjection=false` schakelt promptwijzigende hooks uit, waaronder
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  promptvelden uit legacy `before_agent_start` en
  `enqueueNextTurnInjection`.

Voorbeelden van consumenten buiten Planmodus:

| Pluginarchetype              | Gebruikte hooks                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Goedkeuringsworkflow         | Sessie-extensie, opdrachtcontinuatie, next-turn-injectie, UI-descriptor                                                              |
| Budget-/werkruimtebeleidsgate | Vertrouwd toolbeleid, toolmetadata, sessieprojectie                                                                                  |
| Achtergrondmonitor voor levenscyclus | Runtimelevenscyclus-cleanup, agent-eventabonnement, eigendom/cleanup van sessieplanner, Heartbeat-promptbijdrage, UI-descriptor |
| Setup- of onboardingwizard   | Sessie-extensie, opdrachten met scope, Controle-UI-descriptor                                                                        |

<Note>
  Gereserveerde core-beheerdersnaamruimten (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) blijven altijd `operator.admin`, zelfs als een plugin een
  smallere Gateway-methodescope probeert toe te wijzen. Geef de voorkeur aan
  plugin-specifieke prefixen voor plugin-eigen methoden.
</Note>

<Accordion title="Wanneer toolresultaat-middleware te gebruiken">
  Meegeleverde plugins kunnen `api.registerAgentToolResultMiddleware(...)`
  gebruiken wanneer ze een toolresultaat na uitvoering en voordat de runtime
  dat resultaat terug aan het model geeft moeten herschrijven. Dit is de
  vertrouwde runtime-neutrale interface voor async outputreducers zoals
  tokenjuice.

Meegeleverde plugins moeten `contracts.agentToolResultMiddleware` declareren
voor elke gerichte runtime, bijvoorbeeld `["pi", "codex"]`. Externe plugins
kunnen deze middleware niet registreren; gebruik normale OpenClaw plugin-hooks
voor werk dat geen pre-model timing voor toolresultaten nodig heeft. Het oude,
alleen voor Pi bedoelde ingebedde registratiepad voor de extensiefactory is
verwijderd.
</Accordion>

### Gateway-discoveryregistratie

`api.registerGatewayDiscoveryService(...)` laat een plugin de actieve Gateway
adverteren op een lokaal discoverytransport zoals mDNS/Bonjour. OpenClaw roept
de service aan tijdens het opstarten van de Gateway wanneer lokale discovery is
ingeschakeld, geeft de huidige Gateway-poorten en niet-geheime TXT-hintgegevens
door, en roept de geretourneerde `stop`-handler aan tijdens het afsluiten van de
Gateway.

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

Gateway-discoveryplugins mogen geadverteerde TXT-waarden niet behandelen als
geheimen of authenticatie. Discovery is een routinghint; Gateway-authenticatie
en TLS-pinning blijven de vertrouwensbasis beheren.

### CLI-registratiemetadata

`api.registerCli(registrar, opts?)` accepteert twee soorten metadata op topniveau:

- `commands`: expliciete commandoroots die eigendom zijn van de registrar
- `descriptors`: commandodescriptors voor parsetijd die worden gebruikt voor root-CLI-hulp,
  routering en luie CLI-registratie van plugins

Als je wilt dat een plugincommando lui geladen blijft in het normale root-CLI-pad,
geef dan `descriptors` op die elke commandoroot op het hoogste niveau dekken die door die
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
Dat gretige compatibiliteitspad blijft ondersteund, maar het installeert geen
door descriptors ondersteunde placeholders voor lui laden tijdens parsetijd.

### CLI-backendregistratie

Met `api.registerCliBackend(...)` kan een Plugin eigenaar zijn van de standaardconfiguratie voor een lokale
AI-CLI-backend zoals `codex-cli`.

- De backend-`id` wordt het providerprefix in modelreferenties zoals `codex-cli/gpt-5`.
- De backend-`config` gebruikt dezelfde vorm als `agents.defaults.cliBackends.<id>`.
- Gebruikersconfiguratie wint nog steeds. OpenClaw voegt `agents.defaults.cliBackends.<id>` samen boven op de
  pluginstandaard voordat de CLI wordt uitgevoerd.
- Gebruik `normalizeConfig` wanneer een backend compatibiliteitsherschrijvingen nodig heeft na het samenvoegen
  (bijvoorbeeld het normaliseren van oude flag-vormen).

### Exclusieve slots

| Methode                                    | Wat het registreert                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-engine (één tegelijk actief). De callback `assemble()` ontvangt `availableTools` en `citationsMode`, zodat de engine prompttoevoegingen kan aanpassen. |
| `api.registerMemoryCapability(capability)` | Geünificeerde geheugencapaciteit                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder voor geheugenpromptsectie                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver voor geheugenflushplan                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Runtime-adapter voor geheugen                                                                                                                             |

### Adapters voor geheugenembeddings

| Methode                                        | Wat het registreert                         |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Geheugenembeddingadapter voor de actieve Plugin |

- `registerMemoryCapability` is de voorkeurs-API voor exclusieve geheugenplugins.
- `registerMemoryCapability` kan ook `publicArtifacts.listArtifacts(...)` blootstellen,
  zodat begeleidende plugins geëxporteerde geheugenartefacten kunnen gebruiken via
  `openclaw/plugin-sdk/memory-host-core` in plaats van in de privélay-out van een specifieke
  geheugenplugin te grijpen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` en
  `registerMemoryRuntime` zijn legacy-compatibele API's voor exclusieve geheugenplugins.
- `MemoryFlushPlan.model` kan de flushbeurt vastzetten op een exacte `provider/model`-
  referentie, zoals `ollama/qwen3:8b`, zonder de actieve fallbackketen te erven.
- Met `registerMemoryEmbeddingProvider` kan de actieve geheugenplugin een of
  meer embeddingadapter-id's registreren (bijvoorbeeld `openai`, `gemini` of een aangepaste
  door de plugin gedefinieerde id).
- Gebruikersconfiguratie zoals `agents.defaults.memorySearch.provider` en
  `agents.defaults.memorySearch.fallback` wordt opgelost tegen die geregistreerde
  adapter-id's.

### Gebeurtenissen en levenscyclus

| Methode                                      | Wat het doet                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Getypte lifecycle-hook        |
| `api.onConversationBindingResolved(handler)` | Callback voor gespreksbinding |

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden, veelvoorkomende hooknamen en guard-semantiek.

### Semantiek van hookbeslissingen

- `before_tool_call`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_tool_call`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `before_install`: het retourneren van `{ block: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `before_install`: het retourneren van `{ block: false }` wordt behandeld als geen beslissing (hetzelfde als `block` weglaten), niet als een override.
- `reply_dispatch`: het retourneren van `{ handled: true, ... }` is terminaal. Zodra een handler de dispatch claimt, worden handlers met lagere prioriteit en het standaardpad voor modeldispatch overgeslagen.
- `message_sending`: het retourneren van `{ cancel: true }` is terminaal. Zodra een handler dit instelt, worden handlers met lagere prioriteit overgeslagen.
- `message_sending`: het retourneren van `{ cancel: false }` wordt behandeld als geen beslissing (hetzelfde als `cancel` weglaten), niet als een override.
- `message_received`: gebruik het getypte veld `threadId` wanneer je routering van inkomende threads/onderwerpen nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: gebruik getypte routeringsvelden `replyToId` / `threadId` voordat je terugvalt op kanaalspecifieke `metadata`.
- `gateway_start`: gebruik `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor door de gateway beheerde opstartstatus in plaats van te vertrouwen op interne `gateway:startup`-hooks.
- `cron_changed`: observeer door de Gateway beheerde wijzigingen in de Cron-levenscyclus. Gebruik `event.job?.state?.nextRunAtMs` en `ctx.getCron?.()` bij het synchroniseren van externe wekschedulers, en behoud OpenClaw als de bron van waarheid voor vervalcontroles en uitvoering.

### API-objectvelden

| Veld                     | Type                      | Beschrijving                                                                               |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin-id                                                                                  |
| `api.name`               | `string`                  | Weergavenaam                                                                               |
| `api.version`            | `string?`                 | Plugin-versie (optioneel)                                                                  |
| `api.description`        | `string?`                 | Plugin-beschrijving (optioneel)                                                            |
| `api.source`             | `string`                  | Bronpad van Plugin                                                                         |
| `api.rootDir`            | `string?`                 | Rootdirectory van Plugin (optioneel)                                                       |
| `api.config`             | `OpenClawConfig`          | Huidige configuratiesnapshot (actieve runtime-snapshot in geheugen wanneer beschikbaar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-specifieke configuratie uit `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-helpers](/nl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Gescopeerde logger (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór volledige invoer |
| `api.resolvePath(input)` | `(string) => string`      | Los pad op relatief aan pluginroot                                                         |

## Interne moduleconventie

Gebruik binnen je Plugin lokale barrelbestanden voor interne imports:

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

Facade-geladen openbare oppervlakken van gebundelde plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` en vergelijkbare openbare entrybestanden) geven de voorkeur aan de
actieve runtime-configuratiesnapshot wanneer OpenClaw al draait. Als er nog geen runtime-
snapshot bestaat, vallen ze terug op het opgeloste configuratiebestand op schijf.
Verpakte gebundelde pluginfacades moeten worden geladen via de OpenClaw SDK-
facadeladers; directe imports uit `dist/extensions/...` omzeilen gefaseerde runtime-
spiegels van afhankelijkheden die verpakte installaties gebruiken voor plugin-eigen afhankelijkheden.

Providerplugins kunnen een smalle pluginlokale contractbarrel blootstellen wanneer een
helper bewust providerspecifiek is en nog niet thuishoort in een generiek SDK-
subpad. Gebundelde voorbeelden:

- **Anthropic**: openbare `api.ts` / `contract-api.ts`-seam voor Claude-
  helpers voor beta-header en `service_tier`-streams.
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
  <Card title="Interne Plugin-details" icon="diagram-project" href="/nl/plugins/architecture">
    Diepe architectuur en capaciteitsmodel.
  </Card>
</CardGroup>
