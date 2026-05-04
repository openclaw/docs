---
read_when:
    - È necessario sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione di OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento API di registrazione e architettura dell'SDK
title: Panoramica dell'SDK Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK per plugin è il contratto tipizzato tra i plugin e il nucleo. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è destinata agli autori di plugin che usano `openclaw/plugin-sdk/*` dentro
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i plugin provider e [Hook dei plugin](/it/plugins/hooks) per i plugin di hook di strumenti o ciclo di vita.
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
è per le primitive di schema condivise e il builder generico. I plugin inclusi in
OpenClaw usano `plugin-sdk/bundled-channel-config-schema` per gli schemi dei canali inclusi
mantenuti. Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi degli schemi inclusi è un
modello per nuovi plugin.

<Warning>
  Non importare seam di comodità marcati provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel `api.ts` /
  `runtime-api.ts`; i consumer del nucleo dovrebbero usare quei barrel locali al plugin
  oppure aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  trasversale ai canali.

Un piccolo insieme di seam helper dei plugin inclusi compare ancora nella mappa degli export
generata quando ha un utilizzo tracciato dal proprietario. Esistono solo per la manutenzione
dei plugin inclusi e non sono percorsi di importazione consigliati per nuovi plugin
di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
anche mantenuti come facade di compatibilità deprecate per l'utilizzo tracciato dal proprietario. Non
copiare questi percorsi di importazione in nuovi plugin; usa invece helper runtime iniettati e
sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK per plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
del plugin, canale, provider, auth, runtime, capacità, memoria e helper riservati
ai plugin inclusi). Per il catalogo completo, raggruppato e con link, vedi
[Sottopercorsi dell'SDK per plugin](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Metodo                                           | Cosa registra                        |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)             |
| `api.registerAgentHarness(...)`                  | Esecutore agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend locale di inferenza CLI      |
| `api.registerChannel(...)`                       | Canale di messaggistica              |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video      |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini              |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                 |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping     |
| `api.registerWebSearchProvider(...)`             | Ricerca web                          |

### Strumenti e comandi

| Metodo                         | Cosa registra                                      |
| ------------------------------ | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)             |

I comandi dei plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche del provider o del plugin ai builder dei prompt del nucleo.

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                |
| `api.registerGatewayDiscoveryService(service)` | Inserzionista di discovery del Gateway locale |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultato strumento |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura memoria |

### Hook host per plugin di workflow

Gli hook host sono i seam SDK per i plugin che devono partecipare al ciclo di vita dell'host
invece di limitarsi ad aggiungere un provider, un canale o uno strumento. Sono
contratti generici; Plan Mode può usarli, ma possono farlo anche workflow di approvazione,
gate di policy workspace, monitor in background, wizard di configurazione e plugin companion
UI.

| Metodo                                                                   | Contratto che possiede                                                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stato sessione di proprietà del plugin, compatibile con JSON, proiettato tramite le sessioni Gateway                               |
| `api.enqueueNextTurnInjection(...)`                                      | Contesto durevole exactly-once iniettato nel prossimo turno dell'agente per una sessione                                           |
| `api.registerTrustedToolPolicy(...)`                                     | Policy strumenti pre-plugin inclusa/attendibile che può bloccare o riscrivere i parametri degli strumenti                         |
| `api.registerToolMetadata(...)`                                          | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                              |
| `api.registerCommand(...)`                                               | Comandi scoped del plugin; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descrittori di contributo della Control UI per superfici sessione, strumento, esecuzione o impostazioni                           |
| `api.registerRuntimeLifecycle(...)`                                      | Callback di cleanup per risorse runtime di proprietà del plugin sui percorsi reset/delete/reload                                   |
| `api.registerAgentEventSubscription(...)`                                | Sottoscrizioni evento sanificate per stato workflow e monitor                                                                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stato scratch del plugin per esecuzione cancellato sul ciclo di vita terminale dell'esecuzione                                     |
| `api.registerSessionSchedulerJob(...)`                                   | Record di job dello scheduler sessione di proprietà del plugin con cleanup deterministico                                          |

I contratti dividono intenzionalmente l'autorità:

- I plugin esterni possono possedere estensioni sessione, descrittori UI, comandi, metadati degli strumenti, iniezioni next-turn e hook normali.
- Le policy strumenti attendibili vengono eseguite prima degli hook ordinari `before_tool_call` e sono
  solo per plugin inclusi perché partecipano alla policy di sicurezza dell'host.
- La proprietà dei comandi riservati è solo per plugin inclusi. I plugin esterni dovrebbero usare i propri
  nomi o alias di comando.
- `allowPromptInjection=false` disabilita gli hook che modificano i prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal vecchio `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumer non Plan:

| Archetipo di plugin         | Hook usati                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow di approvazione    | Estensione sessione, continuazione comando, iniezione next-turn, descrittore UI                                                       |
| Gate di policy budget/workspace | Policy strumenti attendibile, metadati strumenti, proiezione sessione                                                            |
| Monitor del ciclo di vita in background | Cleanup del ciclo di vita runtime, sottoscrizione eventi agente, proprietà/cleanup dello scheduler sessione, contributo prompt heartbeat, descrittore UI |
| Wizard di setup o onboarding | Estensione sessione, comandi scoped, descrittore Control UI                                                                          |

<Note>
  I namespace amministrativi riservati del nucleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare uno
  scope più ristretto al metodo gateway. Preferisci prefissi specifici del plugin per
  i metodi di proprietà del plugin.
</Note>

<Accordion title="Quando usare il middleware per risultato strumento">
  I plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
  devono riscrivere un risultato strumento dopo l'esecuzione e prima che il runtime
  rimandi quel risultato al modello. Questo è il seam attendibile e neutrale rispetto al runtime
  per reducer di output asincroni come tokenjuice.

I plugin inclusi devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime mirato, per esempio `["pi", "codex"]`. I plugin esterni
non possono registrare questo middleware; mantieni i normali hook plugin OpenClaw per il lavoro
che non richiede il timing del risultato strumento pre-modello. Il vecchio percorso di registrazione della factory
di estensione incorporata solo per Pi è stato rimosso.
</Accordion>

### Registrazione della discovery del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un plugin di pubblicizzare il Gateway attivo
su un trasporto di discovery locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando la discovery locale è abilitata, passa le
porte Gateway correnti e dati di suggerimento TXT non segreti, e chiama l'handler
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

I plugin di discovery Gateway non devono trattare i valori TXT pubblicizzati come segreti o
autenticazione. La discovery è un suggerimento di routing; l'autenticazione Gateway e il pinning TLS
rimangono responsabili della fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite di proprietà del registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'help della CLI radice,
  il routing e la registrazione lazy della CLI del plugin

Se vuoi che un comando plugin rimanga caricato in modo lazy nel normale percorso CLI radice,
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

Usa `commands` da solo solo quando non hai bisogno della registrazione lazy della CLI radice.
Quel percorso di compatibilità eager rimane supportato, ma non installa
segnaposto basati su descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la configurazione predefinita per un backend
CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend ha bisogno di riscritture di compatibilità dopo l'unione
  (per esempio normalizzando vecchie forme di flag).
- Usa `resolveExecutionArgs` per riscritture argv con ambito richiesta che appartengono al
  dialetto CLI, come la mappatura dei livelli di ragionamento OpenClaw a un flag effort
  nativo.

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). Il callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione del prompt di memoria                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria                                                                                                                                   |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare artifact di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatibili per i plugin di memoria.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento `provider/model`
  esatto, come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più id di adapter di embedding (per esempio `openai`, `gemini` o un id personalizzato
  definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adapter
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding conversazione |

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e
semantica delle guardie.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono ignorati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono ignorati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Quando un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch modello predefinito vengono ignorati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono ignorati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando hai bisogno del routing di thread/argomento in ingresso. Conserva `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ripiegare su `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del gateway invece di affidarti agli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita del cron di proprietà del gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del plugin (opzionale)                                                             |
| `api.description`        | `string?`                 | Descrizione del plugin (opzionale)                                                          |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory radice del plugin (opzionale)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup precedente all'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla radice del plugin                                         |

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
`index.ts`, `setup-entry.ts` e file entry pubblici simili) preferiscono lo
snapshot di configurazione runtime attivo quando OpenClaw è già in esecuzione. Se non esiste ancora alcuno snapshot
runtime, ripiegano sul file di configurazione risolto su disco.
Le facciate dei plugin in bundle pacchettizzati devono essere caricate tramite i loader di facciata
plugin di OpenClaw; gli import diretti da `dist/extensions/...` bypassano il manifest
e i controlli sidecar runtime che le installazioni pacchettizzate usano per il codice di proprietà del plugin.

I plugin provider possono esporre un barrel di contratto ristretto locale al plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempi in bundle:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per helper di stream
  beta-header Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper del modello predefinito e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder di provider
  più helper di onboarding/configurazione.

<Warning>
  Il codice di produzione delle estensioni dovrebbe anche evitare import `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alla capability invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper di runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo dello spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Configurazione e config" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di config.
  </Card>
  <Card title="Test" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Interni del Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capacità.
  </Card>
</CardGroup>
