---
read_when:
    - È necessario sapere da quale sottopercorso dell'SDK importare
    - Vuoi una documentazione di riferimento per tutti i metodi di registrazione per OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-05-02T08:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK Plugin è il contratto tipizzato tra plugin e core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di plugin che usano `openclaw/plugin-sdk/*` dentro
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i plugin provider e [Hook dei Plugin](/it/plugins/hooks) per plugin di hook degli strumenti o del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per gli helper di entry/build specifici
del canale, preferisci `openclaw/plugin-sdk/channel-core`; mantieni
`openclaw/plugin-sdk/core` per la superficie ombrello più ampia e gli helper
condivisi come `buildChannelConfigSchema`.

Per la configurazione del canale, pubblica lo JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
serve per primitive di schema condivise e per il builder generico. I plugin
inclusi in OpenClaw usano `plugin-sdk/bundled-channel-config-schema` per gli
schemi di canale incluso mantenuti. Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi di schema incluso è un
modello per nuovi plugin.

<Warning>
  Non importare seam di praticità con brand di provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel
  `api.ts` / `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali
  al plugin oppure aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  trasversale ai canali.

Un piccolo insieme di seam helper per plugin inclusi appare ancora nella mappa degli export
generata quando ha utilizzo tracciato da parte degli owner. Esistono solo per la
manutenzione dei plugin inclusi e non sono percorsi di importazione consigliati per nuovi
plugin di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
anche mantenuti come facade di compatibilità deprecate per utilizzo tracciato degli owner. Non
copiare quei percorsi di importazione in nuovi plugin; usa invece helper runtime iniettati e
sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
plugin, canale, provider, auth, runtime, capability, memoria e helper riservati
ai plugin inclusi). Per il catalogo completo, raggruppato e collegato, consulta
[Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

Il callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza di testo (LLM)              |
| `api.registerAgentHarness(...)`                  | Executor agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend di inferenza CLI locale       |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                  |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                     |
| `api.registerWebFetchProvider(...)`              | Provider di fetch / scrape web        |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                          | Cosa registra                                    |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)           |

I comandi dei plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di instradamento di proprietà del comando. Mantieni quel testo sul comando stesso; non aggiungere
policy specifiche di provider o plugin ai builder di prompt core.

### Infrastruttura

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                                    |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                      |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                         |
| `api.registerGatewayDiscoveryService(service)` | Inserzionista di discovery del Gateway locale  |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                               |
| `api.registerService(service)`                 | Servizio in background                         |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                            |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura memoria     |

### Hook host per plugin di workflow

Gli hook host sono i seam SDK per plugin che devono partecipare al ciclo di vita
dell'host invece di aggiungere solo un provider, un canale o uno strumento. Sono
contratti generici; Plan Mode può usarli, ma anche workflow di approvazione,
gate di policy del workspace, monitor in background, wizard di configurazione e plugin companion
dell'interfaccia utente.

| Metodo                                                                   | Contratto che possiede                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stato sessione di proprietà del plugin, compatibile con JSON, proiettato tramite sessioni Gateway                                 |
| `api.enqueueNextTurnInjection(...)`                                      | Contesto durabile exactly-once iniettato nel prossimo turno agente per una sessione                                               |
| `api.registerTrustedToolPolicy(...)`                                     | Policy strumenti pre-plugin inclusa/attendibile che può bloccare o riscrivere i parametri degli strumenti                        |
| `api.registerToolMetadata(...)`                                          | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                             |
| `api.registerCommand(...)`                                               | Comandi plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descrittori di contributo Control UI per superfici di sessione, strumento, run o impostazioni                                    |
| `api.registerRuntimeLifecycle(...)`                                      | Callback di pulizia per risorse runtime di proprietà del plugin nei percorsi di reset/delete/reload                              |
| `api.registerAgentEventSubscription(...)`                                | Sottoscrizioni a eventi sanificate per stato e monitor dei workflow                                                               |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stato scratch del plugin per run cancellato sul ciclo di vita terminale della run                                                 |
| `api.registerSessionSchedulerJob(...)`                                   | Record di job dello scheduler di sessione di proprietà del plugin con pulizia deterministica                                      |

I contratti separano intenzionalmente l'autorità:

- I plugin esterni possono possedere estensioni di sessione, descrittori UI, comandi, metadati degli strumenti, iniezioni nel turno successivo e hook normali.
- Le policy strumenti attendibili vengono eseguite prima degli hook ordinari `before_tool_call` e sono solo incluse perché partecipano alla policy di sicurezza dell'host.
- La proprietà dei comandi riservati è solo inclusa. I plugin esterni dovrebbero usare i propri nomi comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal legacy `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumer non Plan:

| Archetipo di plugin          | Hook usati                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione     | Estensione di sessione, continuazione comando, iniezione nel turno successivo, descrittore UI                                      |
| Gate di policy budget/workspace | Policy strumenti attendibile, metadati strumenti, proiezione sessione                                                            |
| Monitor del ciclo di vita in background | Pulizia ciclo di vita runtime, sottoscrizione eventi agente, proprietà/pulizia scheduler di sessione, contributo prompt heartbeat, descrittore UI |
| Wizard di configurazione o onboarding | Estensione di sessione, comandi con ambito, descrittore Control UI                                                           |

<Note>
  Gli spazi dei nomi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare un
  ambito metodo gateway più ristretto. Preferisci prefissi specifici del plugin per i
  metodi di proprietà del plugin.
</Note>

<Accordion title="Quando usare il middleware dei risultati degli strumenti">
  I plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
  devono riscrivere il risultato di uno strumento dopo l'esecuzione e prima che il runtime
  reinserisca quel risultato nel modello. Questo è il seam attendibile e neutrale rispetto al runtime
  per riduttori di output asincroni come tokenjuice.

I plugin inclusi devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime target, per esempio `["pi", "codex"]`. I plugin esterni
non possono registrare questo middleware; mantieni gli hook normali dei Plugin OpenClaw per il lavoro
che non richiede timing del risultato dello strumento prima del modello. Il vecchio percorso di
registrazione factory di estensione incorporata solo Pi è stato rimosso.
</Accordion>

### Registrazione della discovery del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di pubblicizzare il Gateway attivo su un trasporto di discovery locale come mDNS/Bonjour. OpenClaw chiama il servizio durante l'avvio del Gateway quando la discovery locale è abilitata, passa le porte correnti del Gateway e dati di suggerimento TXT non segreti, e chiama il gestore `stop` restituito durante l'arresto del Gateway.

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

I Plugin di discovery del Gateway non devono trattare i valori TXT pubblicizzati come segreti o autenticazione. La discovery è un suggerimento di routing; l'autenticazione del Gateway e il pinning TLS rimangono responsabili della fiducia.

### Metadati di registrazione della CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite possedute dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'aiuto della CLI radice,
  il routing e la registrazione lazy della CLI del Plugin

Se vuoi che un comando di Plugin resti caricato in modo lazy nel normale percorso della CLI radice, fornisci `descriptors` che coprano ogni radice di comando di primo livello esposta da quel registrar.

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

Usa `commands` da solo solo quando non ti serve la registrazione lazy della CLI radice. Quel percorso di compatibilità eager rimane supportato, ma non installa placeholder basati su descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un Plugin di possedere la configurazione predefinita per un backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il valore predefinito del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo l'unione
  (per esempio normalizzando vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). Il callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capability di memoria unificata                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Builder di sezione del prompt di memoria                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime di memoria                                                                                                                                          |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i Plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i Plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  Plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive per Plugin di memoria compatibili con il legacy.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento esatto `provider/model`
  come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al Plugin di memoria attivo di registrare uno
  o più id di adapter di embedding (per esempio `openai`, `gemini` o un id personalizzato
  definito dal Plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adapter
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding conversazione |

Vedi [Hook dei Plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica delle guardie.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Quando un gestore lo imposta, i gestori con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Quando un gestore lo imposta, i gestori con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Quando un gestore rivendica il dispatch, i gestori con priorità inferiore e il percorso di dispatch predefinito del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Quando un gestore lo imposta, i gestori con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve il routing di thread/topic in entrata. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ricorrere ai `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio posseduto dal Gateway invece di fare affidamento sugli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita Cron possedute dal Gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come fonte di verità per i controlli delle scadenze e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                     |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del Plugin                                                                                   |
| `api.name`               | `string`                  | Nome visualizzato                                                                               |
| `api.version`            | `string?`                 | Versione del Plugin (opzionale)                                                                 |
| `api.description`        | `string?`                 | Descrizione del Plugin (opzionale)                                                              |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                    |
| `api.rootDir`            | `string?`                 | Directory radice del Plugin (opzionale)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile)  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                            |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                          |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-ingresso completo |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla radice del Plugin                                             |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Non importare mai il tuo Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin bundled caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di ingresso pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
alcuno snapshot runtime, usano come fallback il file di configurazione risolto su disco.
Le facade dei Plugin bundled pacchettizzati devono essere caricate tramite i loader facade dei Plugin
di OpenClaw; gli import diretti da `dist/extensions/...` aggirano il manifest
e i controlli sidecar runtime che le installazioni pacchettizzate usano per il codice posseduto dai Plugin.

I Plugin provider possono esporre un barrel di contratto ristretto e locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico. Esempi bundled:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per gli helper Claude
  beta-header e stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper per modelli predefiniti e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder di provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import da `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due Plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper di runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo dello spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Installazione e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole di lint.
  </Card>
  <Card title="Migrazione dell'SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Internals dei Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capability.
  </Card>
</CardGroup>
