---
read_when:
    - È necessario sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK dei plugin è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di plugin che usano `openclaw/plugin-sdk/*`
  dentro OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i plugin provider, [Plugin backend CLI](/it/plugins/cli-backend-plugins) per backend CLI AI locali e [Hook dei plugin](/it/plugins/hooks) per plugin di hook degli strumenti o del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene l'avvio rapido e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione del canale, pubblica il JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
è per le primitive di schema condivise e il builder generico. I plugin inclusi in OpenClaw
usano `plugin-sdk/bundled-channel-config-schema` per gli schemi di canale inclusi mantenuti.
Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi degli schemi inclusi è un
modello per nuovi plugin.

<Warning>
  Non importare interfacce di comodità con marchio provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel
  `api.ts` / `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali al plugin
  oppure aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  trasversale ai canali.

Un piccolo insieme di interfacce helper per plugin inclusi compare ancora nella mappa degli export generata
quando hanno un utilizzo tracciato dal proprietario. Esistono solo per la manutenzione dei plugin inclusi
e non sono percorsi di importazione consigliati per nuovi plugin di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facade di compatibilità deprecate per utilizzi tracciati dal proprietario. Non
copiare quei percorsi di importazione in nuovi plugin; usa invece gli helper runtime iniettati e
i sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK dei plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry del plugin, canale, provider, auth, runtime, capability, memoria e helper riservati per plugin inclusi). Per il catalogo completo, raggruppato e collegato, consulta
[Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).

L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono generati dal
sottoinsieme pubblico dopo aver sottratto i sottopercorsi repo-locali di test/interni elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Esegui
`pnpm plugin-sdk:surface` per controllare il conteggio degli export pubblici. I sottopercorsi pubblici deprecati
abbastanza vecchi e non usati dal codice di produzione delle estensioni incluse sono
tracciati in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; i barrel ampi
di re-export deprecati sono tracciati in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API di registrazione

Il callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)               |
| `api.registerAgentHarness(...)`                  | Executor agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend di inferenza CLI locale        |
| `api.registerChannel(...)`                       | Canale di messaggistica                |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming     |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex        |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini                |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                  |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                   |
| `api.registerWebFetchProvider(...)`              | Provider di recupero / scraping web    |
| `api.registerWebSearchProvider(...)`             | Ricerca web                            |

### Strumenti e comandi

| Metodo                          | Cosa registra                                      |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento dell'agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (aggira l'LLM)              |

I comandi dei plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche del provider o del plugin ai builder di prompt core.

### Infrastruttura

| Metodo                                         | Cosa registra                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                             |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | Inserzionista di discovery del Gateway locale |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                       |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI della funzionalità Node sotto `openclaw nodes` |
| `api.registerService(service)`                 | Servizio in background                 |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura della memoria |

### Hook host per plugin di workflow

Gli hook host sono le interfacce SDK per i plugin che devono partecipare al ciclo di vita dell'host
invece di aggiungere soltanto un provider, un canale o uno strumento. Sono
contratti generici; la Modalità piano può usarli, ma possono farlo anche workflow di approvazione,
gate di policy del workspace, monitor in background, procedure guidate di configurazione e plugin companion UI.

| Metodo                                                                               | Contratto di cui è proprietario                                                                                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stato di sessione di proprietà del plugin, compatibile con JSON, proiettato tramite le sessioni Gateway                           |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contesto durevole exactly-once iniettato nel turno successivo dell'agente per una sessione                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | Policy degli strumenti pre-plugin inclusi/attendibili che può bloccare o riscrivere i parametri degli strumenti                   |
| `api.registerToolMetadata(...)`                                                      | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                             |
| `api.registerCommand(...)`                                                           | Comandi plugin con scope; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descrittori di contributo UI di controllo per superfici di sessione, strumento, esecuzione o impostazioni                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback di pulizia per risorse runtime di proprietà del plugin nei percorsi di reset/delete/reload                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Sottoscrizioni a eventi sanificate per stato del workflow e monitor                                                               |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Stato scratch per plugin per singola esecuzione, cancellato al ciclo di vita terminale dell'esecuzione                            |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadati di pulizia per job dello scheduler di proprietà del plugin; non pianifica lavoro né crea record task                     |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Consegna di file allegati mediata dall'host, solo per plugin inclusi, verso la route direct-outbound attiva della sessione        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turni di sessione pianificati basati su Cron, solo per plugin inclusi, più pulizia basata su tag                                  |
| `api.session.controls.registerSessionAction(...)`                                    | Azioni di sessione tipizzate che i client possono inviare tramite il Gateway                                                      |

Usa i namespace raggruppati per il nuovo codice plugin:

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

I metodi flat equivalenti restano disponibili come alias di compatibilità
deprecati per i plugin esistenti. Non aggiungere nuovo codice plugin che chiami
direttamente `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` o
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` è una convenienza con ambito di sessione sopra lo scheduler Cron del Gateway. Cron possiede la temporizzazione e crea il record dell'attività in background quando il turn viene eseguito; il Plugin SDK vincola solo la sessione di destinazione, la denominazione di proprietà del plugin e la pulizia. Usa `api.runtime.tasks.managedFlows` all'interno del turn pianificato quando il lavoro stesso richiede uno stato Task Flow durevole e in più passaggi.

I contratti dividono intenzionalmente l'autorità:

- I plugin esterni possono possedere estensioni di sessione, descrittori UI, comandi, metadati degli strumenti, iniezioni del turn successivo e hook normali.
- Le policy degli strumenti attendibili vengono eseguite prima degli hook ordinari `before_tool_call` e sono solo bundled perché partecipano alla policy di sicurezza dell'host.
- La proprietà dei comandi riservati è solo bundled. I plugin esterni devono usare i propri nomi di comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, i campi prompt del legacy `before_agent_start` ed
  `enqueueNextTurnInjection`.

Esempi di consumer non Plan:

| Archetipo di plugin         | Hook usati                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione    | Estensione di sessione, continuazione del comando, iniezione del turn successivo, descrittore UI                                       |
| Gate di policy budget/workspace | Policy dello strumento attendibile, metadati dello strumento, proiezione di sessione                                               |
| Monitor del ciclo di vita in background | Pulizia del ciclo di vita runtime, sottoscrizione a eventi agente, proprietà/pulizia dello scheduler di sessione, contributo al prompt Heartbeat, descrittore UI |
| Wizard di configurazione o onboarding | Estensione di sessione, comandi con ambito, descrittore UI di controllo                                                          |

<Note>
  Gli spazi dei nomi di amministrazione core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un plugin tenta di assegnare un ambito di metodo gateway più ristretto. Preferisci prefissi specifici del plugin per i metodi di proprietà del plugin.
</Note>

<Accordion title="Quando usare il middleware dei risultati degli strumenti">
  I plugin bundled possono usare `api.registerAgentToolResultMiddleware(...)` quando devono riscrivere un risultato di uno strumento dopo l'esecuzione e prima che il runtime restituisca quel risultato al modello. Questa è la cucitura attendibile e neutrale rispetto al runtime per riduttori di output asincroni come tokenjuice.

I plugin bundled devono dichiarare `contracts.agentToolResultMiddleware` per ogni runtime di destinazione, per esempio `["pi", "codex"]`. I plugin esterni non possono registrare questo middleware; mantieni i normali hook dei plugin OpenClaw per il lavoro che non richiede temporizzazione dei risultati degli strumenti prima del modello. Il vecchio percorso di registrazione della factory di estensioni incorporata solo Pi è stato rimosso.
</Accordion>

### Registrazione della discovery del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un plugin di pubblicizzare il Gateway attivo su un trasporto di discovery locale come mDNS/Bonjour. OpenClaw chiama il servizio durante l'avvio del Gateway quando la discovery locale è abilitata, passa le porte correnti del Gateway e dati di suggerimento TXT non segreti, e chiama l'handler `stop` restituito durante l'arresto del Gateway.

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

I plugin di discovery del Gateway non devono trattare i valori TXT pubblicizzati come segreti o autenticazione. La discovery è un suggerimento di routing; l'autenticazione del Gateway e il pinning TLS possiedono ancora la fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di comando:

- `commands`: nomi di comando espliciti posseduti dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'aiuto CLI,
  il routing e la registrazione CLI lazy del plugin
- `parentPath`: percorso opzionale del comando padre per gruppi di comandi annidati, come
  `["nodes"]`

Per le funzionalità di nodi accoppiati, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper attorno a
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità di nodo esplicite di proprietà del plugin.

Se vuoi che un comando di plugin resti caricato in modo lazy nel normale percorso CLI root, fornisci `descriptors` che coprano ogni radice di comando di primo livello esposta da quel registrar.

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

Usa `commands` da solo solo quando non hai bisogno della registrazione CLI root lazy. Quel percorso di compatibilità eager resta supportato, ma non installa placeholder basati su descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la configurazione predefinita per un backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il default del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio normalizzando vecchie forme di flag).
- Usa `resolveExecutionArgs` per riscritture argv con ambito di richiesta che appartengono al dialetto CLI, come mappare i livelli di ragionamento OpenClaw a un flag di effort nativo.

Per una guida end-to-end alla creazione, vedi
[Plugin di backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). Il callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capability di memoria unificata                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt della memoria                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria                                                                                                                              |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  affinché i plugin companion possano consumare artifact di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive per plugin di memoria compatibili con il legacy.
- `MemoryFlushPlan.model` può fissare il turn di flush a un riferimento esatto `provider/model`,
  come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più id di adapter di embedding (per esempio `openai`, `gemini` o un id personalizzato
  definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adapter
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipizzato del ciclo di vita |
| `api.onConversationBindingResolved(handler)` | Callback di associazione della conversazione |

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica delle guardie.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch predefinito del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve il routing di thread/topic in ingresso. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ripiegare su `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del gateway invece di affidarti agli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita cron di proprietà del gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di wake esterni, e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                                |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del Plugin (opzionale)                                                             |
| `api.description`        | `string?`                 | Descrizione del Plugin (opzionale)                                                          |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory radice del Plugin (opzionale)                                                      |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria, quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla radice del Plugin                                          |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per le importazioni interne:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Non importare mai il tuo Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada le importazioni interne tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin in bundle caricate tramite facciata (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
uno snapshot runtime, usano come fallback il file di configurazione risolto su disco.
Le facciate dei Plugin in bundle pacchettizzati devono essere caricate tramite i loader di facciate
dei Plugin di OpenClaw; le importazioni dirette da `dist/extensions/...` aggirano il manifest
e i controlli sidecar runtime che le installazioni pacchettizzate usano per il codice di proprietà del Plugin.

I Plugin provider possono esporre un barrel di contratto ristretto e locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempi in bundle:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per gli helper di streaming
  beta-header e `service_tier` di Claude.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper per il modello predefinito e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare importazioni
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability, invece di accoppiare due Plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Entry point" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo al namespace `api.runtime`.
  </Card>
  <Card title="Setup e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utility di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Interni del Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capability.
  </Card>
</CardGroup>
