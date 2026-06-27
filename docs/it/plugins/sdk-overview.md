---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando un'esportazione SDK specifica
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento API di registrazione e architettura dell'SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK dei Plugin è il contratto tipizzato tra i Plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di Plugin che usano `openclaw/plugin-sdk/*` all'interno di
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [Integrazioni Gateway per app esterne](/it/gateway/external-apps).
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare Plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i Plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i Plugin provider, [Plugin backend CLI](/it/plugins/cli-backend-plugins) per i backend CLI AI locali e [Hook dei Plugin](/it/plugins/hooks) per i Plugin di strumenti o hook del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene l'avvio veloce e
previene problemi di dipendenze circolari. Per gli helper di entry/build specifici dei canali,
preferisci `openclaw/plugin-sdk/channel-core`; tieni `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione dei canali, pubblica lo schema JSON di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
è per le primitive di schema condivise e il builder generico. I Plugin inclusi in bundle di OpenClaw
usano `plugin-sdk/bundled-channel-config-schema` per gli schemi dei canali in bundle mantenuti.
Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi degli schemi in bundle è un
modello per nuovi Plugin.

<Warning>
  Non importare seam di utilità con branding del provider o del canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I Plugin inclusi in bundle compongono sottopercorsi SDK generici nei propri barrel `api.ts` /
  `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali al Plugin
  oppure aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  trasversale ai canali.

Un piccolo insieme di seam helper per Plugin inclusi in bundle compare ancora nella mappa degli export generata
quando ha utilizzi del proprietario tracciati. Esistono solo per la
manutenzione dei Plugin inclusi in bundle e non sono percorsi di importazione consigliati per nuovi Plugin
di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facade di compatibilità deprecate per utilizzi del proprietario tracciati. Non
copiare quei percorsi di importazione in nuovi Plugin; usa invece gli helper runtime iniettati e
i sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK dei Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry del Plugin,
canale, provider, auth, runtime, capability, memoria e helper riservati ai
Plugin inclusi in bundle). Per il catalogo completo, raggruppato e collegato, vedi
[Sottopercorsi dell'SDK dei Plugin](/it/plugins/sdk-subpaths).

L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono generati dal
sottoinsieme pubblico dopo aver sottratto i sottopercorsi di test/interni locali al repo elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Esegui
`pnpm plugin-sdk:surface` per controllare il conteggio degli export pubblici. I sottopercorsi pubblici
deprecati sufficientemente vecchi e non usati dal codice di produzione delle estensioni in bundle sono
tracciati in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; i barrel ampi
di re-export deprecati sono tracciati in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Esecutore agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend di inferenza CLI locale       |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerEmbeddingProvider(...)`             | Provider riutilizzabile di embedding vettoriali |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                 |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                  |
| `api.registerWebFetchProvider(...)`              | Provider di fetch / scrape Web        |
| `api.registerWebSearchProvider(...)`             | Ricerca Web                           |

I provider di embedding registrati con `api.registerEmbeddingProvider(...)` devono
essere elencati anche in `contracts.embeddingProviders` nel manifest del Plugin. Questa
è la superficie di embedding generica per la generazione vettoriale riutilizzabile. La ricerca in memoria
può consumare questa superficie provider generica. Il seam più vecchio
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` è una compatibilità deprecata mentre
i provider specifici della memoria esistenti migrano.

I provider specifici della memoria che espongono ancora un runtime `batchEmbed(...)` restano sul
contratto di batching per file esistente, a meno che il loro runtime imposti esplicitamente
`sourceWideBatchEmbed: true`. Questo opt-in consente all'host di memoria di inviare chunk da
più file di memoria modificati e fonti abilitate in una chiamata `batchEmbed(...)`
fino ai limiti di batch dell'host. Gli adattatori batch che caricano file di richiesta JSONL devono
suddividere i job del provider prima del limite di dimensione di upload oltre che del limite
del numero di richieste. Il provider deve restituire un embedding per ogni chunk di input nello stesso ordine di
`batch.chunks`; ometti il flag quando il provider si aspetta batch locali al file o
non può preservare l'ordinamento degli input in un job più ampio sull'intera fonte.

### Strumenti e comandi

Usa [`defineToolPlugin`](/it/plugins/tool-plugins) per Plugin semplici solo strumenti
con nomi di strumenti fissi. Usa direttamente `api.registerTool(...)` per Plugin misti
o registrazione di strumenti completamente dinamica.

| Metodo                          | Cosa registra                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)        |

I comandi dei Plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche di provider o Plugin ai builder dei prompt core.

Le voci di guidance possono essere stringhe legacy, che si applicano a ogni superficie di prompt, oppure
voci strutturate:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Le `surfaces` strutturate possono includere `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` resta un alias deprecato
per `openclaw_main`. Ometti `surfaces` per una guidance intenzionalmente su tutte le superfici. Non
passare un array `surfaces` vuoto; viene rifiutato in modo che una perdita accidentale di ambito non
diventi testo di prompt globale.

Le istruzioni developer native del server app Codex sono più rigorose delle altre superfici di prompt:
solo la guidance esplicitamente limitata a `codex_app_server` viene promossa in
quella corsia a priorità più alta. La guidance legacy come stringa e la guidance strutturata senza ambito
restano disponibili per le superfici di prompt non Codex per compatibilità.

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Advertiser di discovery Gateway locale |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerNodeCliFeature(registrar, opts?)` | Feature CLI Node sotto `openclaw nodes` |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione di prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura memoria |

### Hook host per Plugin di workflow

Gli hook host sono i seam SDK per i Plugin che devono partecipare al ciclo di vita
dell'host invece di aggiungere solo un provider, un canale o uno strumento. Sono
contratti generici; Plan Mode può usarli, ma anche workflow di approvazione,
gate di policy dell'area di lavoro, monitor in background, wizard di configurazione e Plugin companion
dell'interfaccia utente.

| Metodo                                                                               | Contratto di cui è responsabile                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stato di sessione di proprietà del Plugin, compatibile con JSON, proiettato tramite le sessioni del Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contesto durevole esattamente una volta iniettato nel turno agente successivo per una sessione                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Policy pre-plugin per strumenti attendibili, controllata dal manifest, che può bloccare o riscrivere i parametri dello strumento                                               |
| `api.registerToolMetadata(...)`                                                      | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                                                            |
| `api.registerCommand(...)`                                                           | Comandi Plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descrittori dei contributi della Control UI per superfici di sessione, strumento, esecuzione o impostazioni                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback di pulizia per risorse runtime di proprietà del Plugin nei percorsi di reset/eliminazione/ricaricamento                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Sottoscrizioni agli eventi sanificate per stato del workflow e monitor                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Stato scratch del Plugin per esecuzione, cancellato nel ciclo di vita terminale dell'esecuzione                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadati di pulizia per job dello scheduler di proprietà del Plugin; non pianifica lavoro né crea record di attività                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Consegna di allegati file mediata dall'host, solo per bundle, alla rotta di sessione diretta in uscita attiva                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turni di sessione pianificati basati su Cron, solo per bundle, più pulizia basata su tag                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Azioni di sessione tipizzate che i client possono inviare tramite il Gateway                                                                    |

Usa i namespace raggruppati per il nuovo codice Plugin:

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

I metodi flat equivalenti restano disponibili come alias di compatibilità deprecati
per i plugin esistenti. Non aggiungere nuovo codice Plugin che chiami direttamente
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` o
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` è una comodità con ambito di sessione sopra lo scheduler
Cron del Gateway. Cron è responsabile della temporizzazione e crea il record
dell'attività in background quando il turno viene eseguito; il Plugin SDK limita
solo la sessione di destinazione, la denominazione di proprietà del plugin e la
pulizia. Usa `api.runtime.tasks.managedFlows` all'interno del turno pianificato
quando il lavoro stesso richiede uno stato TaskFlow durevole a più passaggi.

I contratti separano intenzionalmente l'autorità:

- I plugin esterni possono possedere estensioni di sessione, descrittori UI, comandi,
  metadati degli strumenti, iniezioni nel turno successivo e hook normali.
- Le policy per strumenti attendibili vengono eseguite prima degli hook ordinari
  `before_tool_call` e sono considerate attendibili dall'host. Le policy in bundle
  vengono eseguite per prime; le policy dei plugin installati richiedono
  l'abilitazione esplicita più i rispettivi id locali in
  `contracts.trustedToolPolicies`, e vengono eseguite dopo in ordine di caricamento
  dei plugin. Gli id delle policy hanno ambito nel Plugin che li registra.
- La proprietà dei comandi riservati è solo per i bundle. I plugin esterni dovrebbero
  usare i propri nomi di comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  i campi prompt dal legacy `before_agent_start` e
  `enqueueNextTurnInjection`.

Esempi di consumatori non-Plan:

| Archetipo di Plugin             | Hook usati                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione            | Estensione di sessione, continuazione del comando, iniezione nel turno successivo, descrittore UI                                                            |
| Gate di policy budget/workspace | Policy per strumenti attendibili, metadati degli strumenti, proiezione della sessione                                                                                 |
| Monitor del ciclo di vita in background | Pulizia del ciclo di vita runtime, sottoscrizione a eventi agente, proprietà/pulizia dello scheduler di sessione, contributo al prompt Heartbeat, descrittore UI |
| Procedura guidata di setup o onboarding   | Estensione di sessione, comandi con ambito, descrittore della Control UI                                                                              |

<Note>
  I namespace riservati di amministrazione core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un Plugin prova ad assegnare un
  ambito di metodo Gateway più ristretto. Preferisci prefissi specifici del Plugin per
  i metodi di proprietà del Plugin.
</Note>

<Accordion title="Quando usare il middleware dei risultati degli strumenti">
  I plugin in bundle e i plugin installati abilitati esplicitamente con contratti
  manifest corrispondenti possono usare `api.registerAgentToolResultMiddleware(...)` quando
  devono riscrivere il risultato di uno strumento dopo l'esecuzione e prima che il runtime
  reinserisca quel risultato nel modello. Questa è la cucitura attendibile e neutrale rispetto
  al runtime per riduttori di output asincroni come tokenjuice.

I plugin devono dichiarare `contracts.agentToolResultMiddleware` per ogni runtime di destinazione,
per esempio `["openclaw", "codex"]`. I plugin installati senza quel
contratto, o senza abilitazione esplicita, non possono registrare questo middleware; mantieni
i normali hook Plugin di OpenClaw per il lavoro che non richiede la temporizzazione del
risultato dello strumento prima del modello. Il vecchio percorso di registrazione della factory
di estensioni solo embedded runner è stato rimosso.
</Accordion>

### Registrazione del rilevamento Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di pubblicizzare il Gateway
attivo su un trasporto di rilevamento locale come mDNS/Bonjour. OpenClaw chiama il servizio
durante l'avvio del Gateway quando il rilevamento locale è abilitato, passa le porte Gateway
correnti e dati di suggerimento TXT non segreti, e chiama l'handler `stop` restituito
durante lo spegnimento del Gateway.

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

I plugin di rilevamento Gateway non devono trattare i valori TXT pubblicizzati come segreti o
autenticazione. Il rilevamento è un suggerimento di instradamento; l'autenticazione Gateway e il pinning TLS
restano responsabili della fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati comando:

- `commands`: nomi di comando espliciti posseduti dal registrar
- `descriptors`: descrittori comando al momento del parsing usati per l'aiuto CLI,
  l'instradamento e la registrazione lazy della CLI del Plugin
- `parentPath`: percorso opzionale del comando padre per gruppi di comandi annidati, come
  `["nodes"]`

Per le funzionalità a nodi accoppiati, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper intorno a
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità nodo esplicite di proprietà del Plugin.

Se vuoi che un comando Plugin resti caricato in modo lazy nel normale percorso CLI root,
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
placeholder supportati da descrittori per il caricamento lazy al momento del parsing.

### Registrazione backend CLI

`api.registerCliBackend(...)` consente a un Plugin di possedere la configurazione predefinita per un backend CLI
AI locale come `claude-cli` o `my-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti modello come `my-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente vince comunque. OpenClaw fonde `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio normalizzando vecchie forme di flag).
- Usa `resolveExecutionArgs` per riscritture argv con ambito richiesta che appartengono
  al dialetto CLI, come mappare i livelli di pensiero OpenClaw a un flag nativo di effort.
  L'hook riceve `ctx.executionMode`; usa `"side-question"` per aggiungere
  flag di isolamento nativi del backend per chiamate `/btw` effimere. Se quei flag
  disabilitano in modo affidabile gli strumenti nativi per una CLI altrimenti sempre attiva, dichiara
  anche `sideQuestionToolMode: "disabled"`.

Per una guida di authoring end-to-end, consulta
[plugin backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). I callback del ciclo di vita ricevono `runtimeSettings` quando l'host può fornire diagnostica su modello/provider/modalità; i motori strict più vecchi vengono ritentati senza quella chiave. |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata                                                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt di memoria                                                                                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adapter del runtime di memoria                                                                                                                                                                                                         |

### Adapter deprecati per embedding di memoria

| Metodo                                         | Cosa registra                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding di memoria per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per Plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  affinché i Plugin companion possano consumare gli artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  Plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive per Plugin di memoria compatibili con il comportamento legacy.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento esatto
  `provider/model`, come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` è deprecato. I nuovi provider di embedding
  devono usare `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- I provider esistenti specifici per la memoria continuano a funzionare durante la finestra di migrazione,
  ma l'ispezione del Plugin lo segnala come debito di compatibilità per
  i Plugin non inclusi nel bundle.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook del ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding conversazione |

Consulta [hook dei Plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica delle guardie.

### Semantica decisionale degli hook

`before_install` è un hook del ciclo di vita del runtime dei Plugin, non la superficie delle policy di installazione dell'operatore. Usa `security.installPolicy` quando una decisione di autorizzazione/blocco deve coprire percorsi di installazione o aggiornamento tramite CLI e Gateway.

- `before_tool_call`: la restituzione di `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: la restituzione di `{ block: false }` è trattata come assenza di decisione (come omettere `block`), non come override.
- `before_install`: la restituzione di `{ block: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: la restituzione di `{ block: false }` è trattata come assenza di decisione (come omettere `block`), non come override.
- `reply_dispatch`: la restituzione di `{ handled: true, ... }` è terminale. Dopo che un handler reclama il dispatch, gli handler con priorità inferiore e il percorso di dispatch del modello predefinito vengono saltati.
- `message_sending`: la restituzione di `{ cancel: true }` è terminale. Dopo che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: la restituzione di `{ cancel: false }` è trattata come assenza di decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve il routing in ingresso di thread/topic. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del Gateway invece di fare affidamento sugli hook interni `gateway:startup`.
- `cron_changed`: osserva le modifiche del ciclo di vita di Cron di proprietà del Gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di wake esterni e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                           |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                                         |
| `api.name`               | `string`                  | Nome visualizzato                                                                                     |
| `api.version`            | `string?`                 | Versione del Plugin (opzionale)                                                                       |
| `api.description`        | `string?`                 | Descrizione del Plugin (opzionale)                                                                    |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directory radice del Plugin (opzionale)                                                               |
| `api.config`             | `OpenClawConfig`          | Snapshot di configurazione corrente (snapshot del runtime in memoria attivo quando disponibile)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Helper di runtime](/it/plugins/sdk-runtime)                                                             |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla radice del Plugin                                                    |

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

Le superfici pubbliche dei Plugin inclusi nel bundle caricati tramite facciata (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) preferiscono lo
snapshot della configurazione del runtime attivo quando OpenClaw è già in esecuzione. Se non esiste ancora alcuno
snapshot del runtime, ripiegano sul file di configurazione risolto su disco.
Le facciate dei Plugin inclusi nel bundle pacchettizzati devono essere caricate tramite i loader di facciate dei Plugin di OpenClaw; gli import diretti da `dist/extensions/...` aggirano il manifest
e i controlli sidecar di runtime che le installazioni pacchettizzate usano per il codice di proprietà del Plugin.

I Plugin provider possono esporre un barrel di contratto ristretto e locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico.
Esempi inclusi nel bundle:

- **Anthropic**: seam pubblico `api.ts` / `contract-api.ts` per helper di stream
  beta-header Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder di provider,
  helper per modelli predefiniti e builder di provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alla capacità invece di accoppiare due Plugin.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Entry point" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper di runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo dello spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Setup e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole di lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione dalle superfici deprecate.
  </Card>
  <Card title="Interni dei Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capacità.
  </Card>
</CardGroup>
