---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione di OpenClawPluginApi
    - Stai cercando un'esportazione SDK specifica
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica dell'SDK per Plugin
x-i18n:
    generated_at: "2026-05-10T19:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK dei plugin è il contratto tipizzato tra plugin e core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è destinata agli autori di plugin che usano `openclaw/plugin-sdk/*` dentro
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i plugin provider, [Plugin di backend CLI](/it/plugins/cli-backend-plugins) per i backend CLI AI locali e [Hook dei plugin](/it/plugins/hooks) per i plugin di hook degli strumenti o del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; conserva `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione del canale, pubblica il JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
serve per primitive di schema condivise e il builder generico. I plugin inclusi in
OpenClaw usano `plugin-sdk/bundled-channel-config-schema` per gli schemi dei canali inclusi
mantenuti. Gli export di compatibilità deprecati restano in
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi di schema inclusi è un
modello per nuovi plugin.

<Warning>
  Non importare seam di comodità con brand di provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel `api.ts` /
  `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali al plugin oppure
  aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  cross-channel.

Un piccolo insieme di seam helper dei plugin inclusi appare ancora nella mappa degli export
generata quando ha uso tracciato da parte degli owner. Esistono solo per la manutenzione dei
plugin inclusi e non sono percorsi di importazione consigliati per nuovi plugin di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facade di compatibilità deprecate per uso tracciato da parte degli owner.
Non copiare questi percorsi di importazione nei nuovi plugin; usa invece helper runtime iniettati e
sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK dei plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
del plugin, canale, provider, autenticazione, runtime, capability, memoria e helper riservati
per plugin inclusi). Per il catalogo completo, raggruppato e con link, consulta
[Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).

L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono generati dal
sottoinsieme pubblico dopo aver sottratto i sottopercorsi repo-locali di test/interni elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Esegui
`pnpm plugin-sdk:surface` per verificare il conteggio degli export pubblici. I sottopercorsi pubblici
deprecati sufficientemente vecchi e non usati dal codice di produzione delle estensioni incluse sono
tracciati in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; i barrel ampi
di re-export deprecati sono tracciati in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                                  |
| ------------------------------------------------ | ---------------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)                       |
| `api.registerAgentHarness(...)`                  | Esecutore agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend locale di inferenza CLI                |
| `api.registerChannel(...)`                       | Canale di messaggistica                        |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT                   |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione in tempo reale in streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali in tempo reale duplex          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video                |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini                        |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                          |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                           |
| `api.registerWebFetchProvider(...)`              | Provider di fetch / scrape web                 |
| `api.registerWebSearchProvider(...)`             | Ricerca web                                    |

### Strumenti e comandi

| Metodo                          | Cosa registra                                      |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)             |

I comandi dei plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un
breve suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche del provider o del plugin ai builder del prompt core.

### Infrastruttura

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                                    |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                      |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                         |
| `api.registerGatewayDiscoveryService(service)` | Advertiser di discovery del Gateway locale     |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                               |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI di funzionalità Node sotto `openclaw nodes` |
| `api.registerService(service)`                 | Servizio in background                         |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                            |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime dei risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione di prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura della memoria |

### Hook host per plugin di workflow

Gli hook host sono i seam SDK per i plugin che devono partecipare al ciclo di vita dell'host
anziché limitarsi ad aggiungere un provider, un canale o uno strumento. Sono contratti
generici; Plan Mode può usarli, ma possono farlo anche workflow di approvazione,
gate di policy del workspace, monitor in background, wizard di configurazione e plugin companion
dell'interfaccia utente.

| Metodo                                                                   | Contratto che possiede                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stato di sessione di proprietà del plugin, compatibile con JSON, proiettato tramite le sessioni Gateway                         |
| `api.enqueueNextTurnInjection(...)`                                      | Contesto durevole exactly-once iniettato nel turno agente successivo per una sessione                                           |
| `api.registerTrustedToolPolicy(...)`                                     | Policy degli strumenti pre-plugin inclusa/attendibile che può bloccare o riscrivere parametri degli strumenti                   |
| `api.registerToolMetadata(...)`                                          | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                           |
| `api.registerCommand(...)`                                               | Comandi plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descrittori di contributo Control UI per superfici di sessione, strumento, esecuzione o impostazioni                            |
| `api.registerRuntimeLifecycle(...)`                                      | Callback di cleanup per risorse runtime di proprietà del plugin nei percorsi di reset/delete/reload                             |
| `api.registerAgentEventSubscription(...)`                                | Sottoscrizioni a eventi sanificate per stato del workflow e monitor                                                             |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stato temporaneo del plugin per esecuzione cancellato al ciclo di vita terminale dell'esecuzione                                |
| `api.registerSessionSchedulerJob(...)`                                   | Record di job dello scheduler di sessione di proprietà del plugin con cleanup deterministico                                    |

I contratti separano intenzionalmente l'autorità:

- I plugin esterni possono possedere estensioni di sessione, descrittori UI, comandi, metadati degli strumenti, iniezioni nel turno successivo e hook normali.
- Le policy degli strumenti attendibili vengono eseguite prima degli hook ordinari `before_tool_call` e sono solo per plugin inclusi perché partecipano alla policy di sicurezza dell'host.
- La proprietà dei comandi riservati è solo per plugin inclusi. I plugin esterni dovrebbero usare i propri nomi comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal legacy `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumer non-Plan:

| Archetipo di plugin            | Hook usati                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow di approvazione       | Estensione di sessione, continuazione del comando, iniezione nel turno successivo, descrittore UI                                    |
| Gate di policy budget/workspace | Policy degli strumenti attendibili, metadati degli strumenti, proiezione della sessione                                             |
| Monitor del ciclo di vita in background | Cleanup del ciclo di vita runtime, sottoscrizione a eventi agente, proprietà/cleanup dello scheduler di sessione, contributo al prompt Heartbeat, descrittore UI |
| Wizard di configurazione o onboarding | Estensione di sessione, comandi con ambito, descrittore Control UI                                                                 |

<Note>
  Gli spazi dei nomi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare uno
  scope di metodo gateway più ristretto. Preferisci prefissi specifici del plugin per
  metodi di proprietà del plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  I plugin in bundle possono usare `api.registerAgentToolResultMiddleware(...)` quando
  devono riscrivere il risultato di uno strumento dopo l'esecuzione e prima che il runtime
  reimmetta quel risultato nel modello. Questa è la seam runtime-neutral affidabile
  per riduttori di output asincroni come tokenjuice.

I plugin in bundle devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime di destinazione, per esempio `["pi", "codex"]`. I plugin esterni
non possono registrare questo middleware; mantieni i normali hook dei plugin OpenClaw per il lavoro
che non richiede il timing del risultato dello strumento prima del modello. Il vecchio percorso di registrazione
della factory di estensioni incorporata solo per Pi è stato rimosso.
</Accordion>

### Registrazione del rilevamento del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un plugin di pubblicizzare il Gateway attivo
su un trasporto di rilevamento locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando il rilevamento locale è abilitato, passa le
porte correnti del Gateway e dati di suggerimento TXT non segreti, e chiama l'handler
`stop` restituito durante l'arresto del Gateway.

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

I plugin di rilevamento del Gateway non devono trattare i valori TXT pubblicizzati come segreti o
autenticazione. Il rilevamento è un suggerimento di instradamento; l'autenticazione del Gateway e il pinning TLS
continuano a possedere la fiducia.

### Metadati di registrazione della CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di comando:

- `commands`: nomi di comando espliciti posseduti dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'aiuto della CLI,
  l'instradamento e la registrazione lazy della CLI del plugin
- `parentPath`: percorso opzionale del comando padre per gruppi di comandi annidati, come
  `["nodes"]`

Per le funzionalità di nodi accoppiati, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper attorno a
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità di nodo esplicitamente possedute dal plugin.

Se vuoi che un comando del plugin resti caricato in modo lazy nel normale percorso della CLI root,
fornisci `descriptors` che coprano ogni root di comando di primo livello esposta da quel
registrar.

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

I comandi annidati ricevono il comando padre risolto come `program`:

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

Usa `commands` da solo solo quando non hai bisogno della registrazione lazy della CLI root.
Quel percorso di compatibilità eager resta supportato, ma non installa
segnaposto supportati da descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la configurazione predefinita per un backend
CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente continua a prevalere. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra la
  configurazione predefinita del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio normalizzando vecchie forme di flag).
- Usa `resolveExecutionArgs` per riscritture argv con ambito della richiesta che appartengono al
  dialetto della CLI, come mappare i livelli di ragionamento di OpenClaw a un flag nativo
  di effort.

Per una guida alla creazione end-to-end, consulta
[Plugin backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt di memoria                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adattatore runtime di memoria                                                                                                                                    |

### Adattatori di embedding della memoria

| Metodo                                         | Cosa registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  affinché i plugin companion possano consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatible per i plugin di memoria.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento esatto `provider/model`
  come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più ID di adattatori di embedding (per esempio `openai`, `gemini` o un ID personalizzato
  definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` si risolve rispetto a quegli ID di adattatori
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato          |
| `api.onConversationBindingResolved(handler)` | Callback di associazione della conversazione |

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi, nomi comuni di hook e semantiche
di guardia.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` è trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` è trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Dopo che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch del modello predefinito vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` è trattato come nessuna decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando hai bisogno di instradamento inbound di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di instradamento tipizzati `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio posseduto dal Gateway invece di fare affidamento sugli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita Cron posseduto dal Gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                   |
| `api.name`               | `string`                  | Nome visualizzato                                                                                |
| `api.version`            | `string?`                 | Versione del plugin (opzionale)                                                                   |
| `api.description`        | `string?`                 | Descrizione del plugin (opzionale)                                                               |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directory root del plugin (opzionale)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime in memoria attivo quando disponibile)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del plugin                                                        |

## Convenzione dei moduli interni

All'interno del tuo plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Non importare mai il tuo plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei plugin in bundle caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di ingresso pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
alcuno snapshot runtime, ripiegano sul file di configurazione risolto su disco.
Le facade dei plugin in bundle pacchettizzati dovrebbero essere caricate tramite i loader di facade
dei plugin di OpenClaw; gli import diretti da `dist/extensions/...` aggirano il manifest
e i controlli del sidecar runtime che le installazioni pacchettizzate usano per il codice di proprietà del plugin.

I plugin provider possono esporre un barrel contrattuale ristretto e locale al plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempi in bundle:

- **Anthropic**: superficie pubblica `api.ts` / `contract-api.ts` per gli helper di streaming
  dell'header beta Claude e di `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper per il modello predefinito e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare gli import
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo allo spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Configurazione iniziale e config" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Test" icon="vial" href="/it/plugins/sdk-testing">
    Utility di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione dalle superfici deprecate.
  </Card>
  <Card title="Elementi interni dei plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capability.
  </Card>
</CardGroup>
