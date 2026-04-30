---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione di OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento API di registrazione e architettura SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:05:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK dei Plugin è il contratto tipizzato tra i Plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di Plugin che usano `openclaw/plugin-sdk/*` dentro
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [OpenClaw App SDK](/it/concepts/openclaw-sdk) e il pacchetto `@openclaw/sdk`.
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia da [Creare Plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i Plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i Plugin provider e [hook dei Plugin](/it/plugins/hooks) per Plugin di strumenti o hook del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene l'avvio rapido e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; conserva `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e per gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione del canale, pubblica il JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
serve per primitive di schema condivise e per il builder generico. I Plugin
inclusi in OpenClaw usano `plugin-sdk/bundled-channel-config-schema` per gli
schemi di canale incluso mantenuti. Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi degli schemi inclusi è un
modello per nuovi Plugin.

<Warning>
  Non importare seam di comodità con branding provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I Plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel
  `api.ts` / `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali al Plugin
  oppure aggiungere un contratto SDK generico e ristretto quando l'esigenza è davvero
  trasversale ai canali.

Un piccolo insieme di seam helper per Plugin inclusi compare ancora nella mappa degli export generata
quando hanno uso tracciato da parte del proprietario. Esistono solo per la manutenzione
dei Plugin inclusi e non sono percorsi di importazione consigliati per nuovi Plugin
di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facade di compatibilità deprecate per uso tracciato da parte del proprietario. Non
copiare quei percorsi di importazione nei nuovi Plugin; usa invece helper runtime iniettati e
sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK dei Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry del Plugin,
canale, provider, autenticazione, runtime, capacità, memoria e helper riservati
per Plugin inclusi). Per il catalogo completo, raggruppato e con link, vedi
[sottopercorsi SDK dei Plugin](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Executor agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend di inferenza CLI locale       |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                 |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                  |
| `api.registerWebFetchProvider(...)`              | Provider di recupero web / scraping   |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                         | Cosa registra                                      |
| ------------------------------ | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento dell'agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)             |

I comandi dei Plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche di provider o Plugin ai builder di prompt core.

### Infrastruttura

| Metodo                                         | Cosa registra                               |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook di evento                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Advertiser di discovery del Gateway locale  |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                            |
| `api.registerService(service)`                 | Servizio in background                      |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                         |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt aggiuntiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aggiuntivo di ricerca/lettura memoria |

### Hook host per Plugin di workflow

Gli hook host sono i seam SDK per i Plugin che devono partecipare al ciclo di vita
dell'host anziché limitarsi ad aggiungere un provider, un canale o uno strumento. Sono
contratti generici; Plan Mode può usarli, ma possono farlo anche workflow di approvazione,
gate di policy del workspace, monitor in background, procedure guidate di configurazione e Plugin companion
dell'interfaccia utente.

| Metodo                                                                   | Contratto che possiede                                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stato sessione di proprietà del Plugin, compatibile con JSON, proiettato tramite sessioni Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Contesto durevole exactly-once iniettato nel prossimo turno dell'agente per una sessione |
| `api.registerTrustedToolPolicy(...)`                                     | Policy strumenti pre-Plugin inclusa/attendibile che può bloccare o riscrivere parametri degli strumenti |
| `api.registerToolMetadata(...)`                                          | Metadati di visualizzazione del catalogo strumenti senza cambiare l'implementazione dello strumento |
| `api.registerCommand(...)`                                               | Comandi Plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Descrittori di contributo Control UI per superfici sessione, strumento, esecuzione o impostazioni |
| `api.registerRuntimeLifecycle(...)`                                      | Callback di pulizia per risorse runtime di proprietà del Plugin nei percorsi reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Sottoscrizioni eventi sanificate per stato workflow e monitor                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stato scratch del Plugin per esecuzione cancellato al ciclo di vita terminale dell'esecuzione |
| `api.registerSessionSchedulerJob(...)`                                   | Record job dello scheduler sessione di proprietà del Plugin con pulizia deterministica |

I contratti separano intenzionalmente l'autorità:

- I Plugin esterni possono possedere estensioni di sessione, descrittori UI, comandi, metadati degli strumenti, iniezioni del turno successivo e hook normali.
- Le policy degli strumenti attendibili vengono eseguite prima degli hook ordinari `before_tool_call` e sono solo per Plugin inclusi perché partecipano alla policy di sicurezza dell'host.
- La proprietà dei comandi riservati è solo per Plugin inclusi. I Plugin esterni dovrebbero usare i propri nomi di comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal legacy `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumer non Plan:

| Archetipo di Plugin          | Hook usati                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione     | Estensione di sessione, continuazione comando, iniezione del turno successivo, descrittore UI                                      |
| Gate di policy budget/workspace | Policy strumenti attendibili, metadati degli strumenti, proiezione sessione                                                        |
| Monitor del ciclo di vita in background | Pulizia ciclo di vita runtime, sottoscrizione eventi agente, proprietà/pulizia scheduler sessione, contributo prompt heartbeat, descrittore UI |
| Procedura guidata di setup o onboarding | Estensione di sessione, comandi con ambito, descrittore Control UI                                                                 |

<Note>
  Gli spazi dei nomi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un Plugin prova ad assegnare un
  ambito del metodo Gateway più ristretto. Preferisci prefissi specifici del Plugin per
  i metodi di proprietà del Plugin.
</Note>

<Accordion title="Quando usare il middleware per risultati degli strumenti">
  I Plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
  devono riscrivere il risultato di uno strumento dopo l'esecuzione e prima che il runtime
  reinserisca quel risultato nel modello. Questo è il seam attendibile e neutrale rispetto al runtime
  per reducer di output asincroni come tokenjuice.

I Plugin inclusi devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime di destinazione, per esempio `["pi", "codex"]`. I Plugin esterni
non possono registrare questo middleware; mantieni i normali hook dei Plugin OpenClaw per il lavoro
che non richiede timing pre-modello del risultato dello strumento. Il vecchio percorso di registrazione
della factory estensione incorporata solo Pi è stato rimosso.
</Accordion>

### Registrazione della discovery del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di pubblicizzare il Gateway attivo
su un trasporto di discovery locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando la discovery locale è abilitata, passa le
porte Gateway correnti e dati hint TXT non segreti, e chiama l'handler
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

I plugin di discovery del Gateway non devono trattare i valori TXT annunciati come segreti o
autenticazione. La discovery è un suggerimento di routing; l'autenticazione del Gateway e il pinning TLS restano
responsabili della fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite di proprietà del registrar
- `descriptors`: descrittori dei comandi in fase di parsing usati per l'aiuto della CLI radice,
  il routing e la registrazione lazy della CLI del plugin

Se vuoi che un comando del plugin rimanga caricato in modo lazy nel normale percorso della CLI radice,
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
Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder basati su descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la configurazione predefinita per un backend
CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti di modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente ha comunque la precedenza. OpenClaw fonde `agents.defaults.cliBackends.<id>` sopra la
  configurazione predefinita del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo la fusione
  (per esempio normalizzando vecchie forme dei flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). Il callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione del prompt di memoria                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adattatore runtime della memoria                                                                                                                        |

### Adattatori di embedding della memoria

| Metodo                                         | Cosa registra                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive per plugin di memoria compatibili con il legacy.
- `MemoryFlushPlan.model` può vincolare il turno di flush a un riferimento `provider/model`
  esatto, come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più ID di adattatori di embedding (per esempio `openai`, `gemini` o un ID personalizzato
  definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli ID di adattatori
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica delle guardie.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come un override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come un override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch predefinito del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come un override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve il routing inbound di thread/argomento. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ripiegare su `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del gateway invece di affidarti agli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita del cron di proprietà del gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del plugin (opzionale)                                                             |
| `api.description`        | `string?`                 | Descrizione del plugin (opzionale)                                                          |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory radice del plugin (opzionale)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla radice del plugin                                         |

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

Le superfici pubbliche dei plugin bundled caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora alcuno
snapshot runtime, ripiegano sul file di configurazione risolto su disco.
Le facade dei plugin bundled pacchettizzati devono essere caricate tramite i loader delle facade dei plugin di OpenClaw;
gli import diretti da `dist/extensions/...` aggirano i mirror delle dipendenze runtime staged
che le installazioni pacchettizzate usano per le dipendenze di proprietà del plugin.

I plugin provider possono esporre un barrel di contratto locale al plugin e ristretto quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempi bundled:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per gli helper di streaming
  beta-header e `service_tier` di Claude.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper per modelli predefiniti e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due plugin.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo del namespace `api.runtime`.
  </Card>
  <Card title="Setup e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Test" icon="vial" href="/it/plugins/sdk-testing">
    Utility di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Interni dei Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello delle capability.
  </Card>
</CardGroup>
