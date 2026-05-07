---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione in OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica dell'SDK per Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK per Plugin è il contratto tipizzato tra i Plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di Plugin che usano `openclaw/plugin-sdk/*`
  all'interno di OpenClaw. Per app esterne, script, dashboard, job CI ed
  estensioni IDE che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare Plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i Plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i Plugin provider, [Plugin backend CLI](/it/plugins/cli-backend-plugins) per i backend CLI AI locali e [Hook dei Plugin](/it/plugins/hooks) per i Plugin di hook di strumenti o ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene l'avvio rapido
e previene problemi di dipendenze circolari. Per gli helper di entry/build
specifici del canale, preferisci `openclaw/plugin-sdk/channel-core`; mantieni
`openclaw/plugin-sdk/core` per la superficie ombrello più ampia e per gli helper
condivisi come `buildChannelConfigSchema`.

Per la configurazione del canale, pubblica il JSON Schema di proprietà del canale
tramite `openclaw.plugin.json#channelConfigs`. Il sottopercorso
`plugin-sdk/channel-config-schema` è destinato alle primitive di schema condivise
e al builder generico. I Plugin in bundle di OpenClaw usano
`plugin-sdk/bundled-channel-config-schema` per gli schemi dei canali in bundle
mantenuti. Le esportazioni di compatibilità deprecate rimangono in
`plugin-sdk/channel-config-schema-legacy`; nessuno dei due sottopercorsi degli
schemi in bundle è un modello per nuovi Plugin.

<Warning>
  Non importare seam di utilità con branding di provider o canale, ad esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`.
  I Plugin in bundle compongono sottopercorsi SDK generici all'interno dei propri
  barrel `api.ts` / `runtime-api.ts`; i consumer core dovrebbero usare quei
  barrel locali al Plugin oppure aggiungere un contratto SDK generico ristretto
  quando un'esigenza è davvero cross-channel.

Un piccolo insieme di seam helper per Plugin in bundle appare ancora nella mappa
di esportazione generata quando ha un utilizzo tracciato dal proprietario. Esistono
solo per la manutenzione dei Plugin in bundle e non sono percorsi di importazione
consigliati per nuovi Plugin di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facciate di compatibilità deprecate per l'utilizzo tracciato
dal proprietario. Non copiare quei percorsi di importazione nei nuovi Plugin; usa
invece gli helper runtime iniettati e i sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK per Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati
per area (entry del Plugin, canale, provider, autenticazione, runtime, capacità,
memoria e helper riservati ai Plugin in bundle). Per il catalogo completo,
raggruppato e collegato, consulta [Sottopercorsi dell'SDK per Plugin](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Esecutore agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend CLI di inferenza locale       |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                 |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                  |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping      |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                          | Cosa registra                                      |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)             |

I comandi dei Plugin possono impostare `agentPromptGuidance` quando l'agente
ha bisogno di un breve suggerimento di instradamento di proprietà del comando.
Mantieni quel testo relativo al comando stesso; non aggiungere policy specifiche
di provider o Plugin ai builder dei prompt core.

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                |
| `api.registerGatewayDiscoveryService(service)` | Inserzionista di discovery del Gateway locale |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI di funzionalità Node sotto `openclaw nodes` |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Gestore interattivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo per ricerca/lettura in memoria |

### Hook host per Plugin di workflow

Gli hook host sono i seam SDK per i Plugin che devono partecipare al ciclo di
vita dell'host invece di aggiungere solo un provider, un canale o uno strumento.
Sono contratti generici; Plan Mode può usarli, ma anche workflow di approvazione,
gate di policy del workspace, monitor in background, wizard di configurazione e
Plugin companion dell'interfaccia utente.

| Metodo                                                                   | Contratto di cui è proprietario                                                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stato sessione di proprietà del Plugin, compatibile con JSON, proiettato tramite sessioni Gateway                                 |
| `api.enqueueNextTurnInjection(...)`                                      | Contesto durevole exactly-once iniettato nel turno agente successivo per una sessione                                             |
| `api.registerTrustedToolPolicy(...)`                                     | Policy di strumenti pre-Plugin in bundle/attendibile che può bloccare o riscrivere parametri dello strumento                     |
| `api.registerToolMetadata(...)`                                          | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                             |
| `api.registerCommand(...)`                                               | Comandi Plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descrittori di contributo alla Control UI per superfici di sessione, strumento, esecuzione o impostazioni                         |
| `api.registerRuntimeLifecycle(...)`                                      | Callback di pulizia per risorse runtime di proprietà del Plugin nei percorsi di reset/eliminazione/ricaricamento                  |
| `api.registerAgentEventSubscription(...)`                                | Sottoscrizioni a eventi sanificate per stato del workflow e monitor                                                               |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stato scratch del Plugin per esecuzione cancellato al ciclo di vita terminale dell'esecuzione                                     |
| `api.registerSessionSchedulerJob(...)`                                   | Record di job dello scheduler di sessione di proprietà del Plugin con pulizia deterministica                                      |

I contratti separano intenzionalmente l'autorità:

- I Plugin esterni possono possedere estensioni di sessione, descrittori UI,
  comandi, metadati degli strumenti, iniezioni del turno successivo e hook normali.
- Le policy di strumenti attendibili vengono eseguite prima degli hook ordinari
  `before_tool_call` e sono solo in bundle perché partecipano alla policy di
  sicurezza dell'host.
- La proprietà dei comandi riservati è solo in bundle. I Plugin esterni dovrebbero
  usare i propri nomi di comando o alias.
- `allowPromptInjection=false` disabilita gli hook che mutano il prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal legacy `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumer non Plan:

| Archetipo di Plugin          | Hook usati                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione     | Estensione di sessione, continuazione del comando, iniezione del turno successivo, descrittore UI                                   |
| Gate di policy budget/workspace | Policy di strumenti attendibili, metadati degli strumenti, proiezione della sessione                                                |
| Monitor del ciclo di vita in background | Pulizia del ciclo di vita runtime, sottoscrizione a eventi agente, proprietà/pulizia dello scheduler di sessione, contributo prompt Heartbeat, descrittore UI |
| Wizard di setup o onboarding | Estensione di sessione, comandi con ambito, descrittore Control UI                                                                    |

<Note>
  Gli spazi dei nomi admin core riservati (`config.*`, `exec.approvals.*`,
  `wizard.*`, `update.*`) rimangono sempre `operator.admin`, anche se un Plugin
  tenta di assegnare un ambito di metodo Gateway più ristretto. Preferisci
  prefissi specifici del Plugin per i metodi di proprietà del Plugin.
</Note>

<Accordion title="Quando usare il middleware per risultati degli strumenti">
  I Plugin in bundle possono usare `api.registerAgentToolResultMiddleware(...)`
  quando devono riscrivere il risultato di uno strumento dopo l'esecuzione e
  prima che il runtime reinserisca quel risultato nel modello. Questo è il seam
  attendibile e neutrale rispetto al runtime per reducer di output asincroni come
  tokenjuice.

I plugin in bundle devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime di destinazione, per esempio `["pi", "codex"]`. I plugin esterni
non possono registrare questo middleware; mantieni i normali hook dei plugin
OpenClaw per il lavoro che non richiede temporizzazione pre-modello dei risultati degli strumenti. Il vecchio percorso di registrazione della factory di estensione incorporata
solo per Pi è stato rimosso.
</Accordion>

### Registrazione di rilevamento del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un plugin di pubblicizzare il Gateway attivo
su un trasporto di rilevamento locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando il rilevamento locale è abilitato, passa le
porte correnti del Gateway e i dati di suggerimento TXT non segreti, e chiama l'handler
`stop` restituito durante lo spegnimento del Gateway.

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
autenticazione. Il rilevamento è un suggerimento di instradamento; l'autenticazione del Gateway e il pinning TLS continuano a
gestire l'attendibilità.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati dei comandi:

- `commands`: nomi di comando espliciti di proprietà del registrar
- `descriptors`: descrittori dei comandi in fase di parsing usati per l'aiuto CLI,
  l'instradamento e la registrazione CLI pigra dei plugin
- `parentPath`: percorso opzionale del comando padre per gruppi di comandi annidati, come
  `["nodes"]`

Per le funzionalità dei nodi associati, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper attorno a
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità di nodo esplicite di proprietà del plugin.

Se vuoi che un comando del plugin resti caricato in modo pigro nel normale percorso CLI root,
fornisci `descriptors` che coprano ogni radice di comando di primo livello esposta da quel
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

Usa `commands` da solo solo quando non ti serve la registrazione CLI root pigra.
Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder basati su descrittori per il caricamento pigro in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di gestire la configurazione predefinita per un backend
CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` con il
  valore predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio normalizzando vecchie forme dei flag).
- Usa `resolveExecutionArgs` per riscritture di argv con ambito sulla richiesta che appartengono al
  dialetto CLI, come la mappatura dei livelli di ragionamento OpenClaw a un flag di effort
  nativo.

Per una guida di authoring end-to-end, consulta
[Plugin di backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` in modo che il motore possa adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione di prompt della memoria                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | Adattatore runtime della memoria                                                                                                                          |

### Adattatori di embedding della memoria

| Metodo                                         | Cosa registra                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  in modo che i plugin companion possano consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatible per i plugin di memoria.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento esatto `provider/model`
  come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più id di adattatori di embedding (per esempio `openai`, `gemini` o un id personalizzato
  definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adattatore
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding conversazione |

Consulta [Hook dei plugin](/it/plugins/hooks) per esempi, nomi comuni degli hook e
semantica delle guardie.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come un override.
- `before_install`: restituire `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come un override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Dopo che un handler rivendica la dispatch, gli handler con priorità inferiore e il percorso di dispatch del modello predefinito vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come un override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve l'instradamento in ingresso di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di instradamento tipizzati `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del gateway invece di fare affidamento sugli hook interni `gateway:startup`.
- `cron_changed`: osserva i cambiamenti del ciclo di vita Cron di proprietà del gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come fonte di verità per controlli di scadenza ed esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del plugin (opzionale)                                                             |
| `api.description`        | `string?`                 | Descrizione del plugin (opzionale)                                                          |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory root del plugin (opzionale)                                                       |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del plugin                                           |

## Convenzione dei moduli interni

Nel tuo plugin, usa file barrel locali per gli import interni:

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

Le superfici pubbliche dei plugin in bundle caricate tramite facciata (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora alcuno snapshot
runtime, ripiegano sul file di configurazione risolto su disco.
Le facciate dei plugin in bundle pacchettizzati devono essere caricate tramite i loader di facciata dei plugin di OpenClaw;
gli import diretti da `dist/extensions/...` aggirano il manifest
e i controlli del sidecar runtime che le installazioni pacchettizzate usano per il codice di proprietà del plugin.

I Plugin provider possono esporre un barrel di contratto ristretto e locale al Plugin quando un helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico. Esempi inclusi:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per gli helper di stream Claude beta-header e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider, helper per modelli predefiniti e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due Plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo al namespace `api.runtime`.
  </Card>
  <Card title="Configurazione e setup" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifesti e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione dalle superfici deprecate.
  </Card>
  <Card title="Interni dei Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello delle capability.
  </Card>
</CardGroup>
