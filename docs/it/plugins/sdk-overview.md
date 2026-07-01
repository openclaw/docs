---
read_when:
    - È necessario sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica dell'SDK per Plugin
x-i18n:
    generated_at: "2026-07-01T18:14:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK Plugin è il contratto tipizzato tra i Plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Note>
  Questa pagina è per gli autori di Plugin che usano `openclaw/plugin-sdk/*` dentro
  OpenClaw. Per app esterne, script, dashboard, job CI ed estensioni IDE
  che vogliono eseguire agenti tramite il Gateway, usa invece
  [Integrazioni Gateway per app esterne](/it/gateway/external-apps).
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia con [Creare Plugin](/it/plugins/building-plugins), usa [Plugin di canale](/it/plugins/sdk-channel-plugins) per i Plugin di canale, [Plugin provider](/it/plugins/sdk-provider-plugins) per i Plugin provider, [Plugin backend CLI](/it/plugins/cli-backend-plugins) per backend CLI AI locali e [Hook dei Plugin](/it/plugins/hooks) per Plugin di strumenti o hook del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici dei canali,
preferisci `openclaw/plugin-sdk/channel-core`; tieni `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione del canale, pubblica lo JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
è per primitive di schema condivise e per il builder generico. I Plugin inclusi in
OpenClaw usano `plugin-sdk/bundled-channel-config-schema` per gli schemi dei canali inclusi
mantenuti. Gli export di compatibilità deprecati restano su
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi di schema inclusi è un
modello per nuovi Plugin.

<Warning>
  Non importare seam di utilità con branding di provider o canale (per esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I Plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel `api.ts` /
  `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali al Plugin
  oppure aggiungere un contratto SDK generico ristretto quando un'esigenza è davvero
  cross-channel.

Un piccolo insieme di seam helper per Plugin inclusi appare ancora nella mappa degli export
generata quando ha utilizzi del proprietario tracciati. Esistono solo per la manutenzione
dei Plugin inclusi e non sono percorsi di importazione consigliati per nuovi Plugin
di terze parti.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` sono
mantenuti anche come facciate di compatibilità deprecate per utilizzi del proprietario
tracciati. Non copiare quei percorsi di importazione in nuovi Plugin; usa invece helper
runtime iniettati e sottopercorsi SDK di canale generici.
</Warning>

## Riferimento dei sottopercorsi

L'SDK Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
del Plugin, canale, provider, auth, runtime, capability, memoria e helper riservati
ai Plugin inclusi). Per il catalogo completo, raggruppato e collegato, vedi
[Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).

L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono generati dal
sottoinsieme pubblico dopo aver sottratto i sottopercorsi repo-local di test/interni elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Esegui
`pnpm plugin-sdk:surface` per verificare il numero di export pubblici. I sottopercorsi pubblici
deprecati abbastanza vecchi e inutilizzati dal codice di produzione delle estensioni incluse sono
tracciati in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; i barrel di re-export
deprecati ampi sono tracciati in
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
| `api.registerEmbeddingProvider(...)`             | Provider di embedding vettoriale riutilizzabile |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione in tempo reale in streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali in tempo reale duplex |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione di musica                 |
| `api.registerVideoGenerationProvider(...)`       | Generazione di video                  |
| `api.registerWebFetchProvider(...)`              | Provider di recupero / scraping Web   |
| `api.registerWebSearchProvider(...)`             | Ricerca Web                           |

I provider di embedding registrati con `api.registerEmbeddingProvider(...)` devono
essere elencati anche in `contracts.embeddingProviders` nel manifest del Plugin. Questa
è la superficie di embedding generica per la generazione vettoriale riutilizzabile. La ricerca in memoria
può consumare questa superficie provider generica. La seam precedente
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` è compatibilità deprecata mentre
i provider esistenti specifici per la memoria migrano.

I provider specifici per la memoria che espongono ancora un runtime `batchEmbed(...)` restano sul
contratto di batching per file esistente, a meno che il loro runtime imposti esplicitamente
`sourceWideBatchEmbed: true`. Questa opzione consente all'host della memoria di inviare chunk da
più file di memoria dirty e sorgenti abilitate in una sola chiamata `batchEmbed(...)` fino
ai limiti di batch dell'host. Gli adapter di batch che caricano file di richiesta JSONL devono
dividere i job del provider prima del limite di dimensione di upload oltre che del limite
del numero di richieste. Il provider deve restituire un embedding per ogni chunk di input
nello stesso ordine di `batch.chunks`; ometti il flag quando il provider si aspetta batch locali
al file o non può preservare l'ordinamento dell'input in un job più ampio su tutta la sorgente.

### Strumenti e comandi

Usa [`defineToolPlugin`](/it/plugins/tool-plugins) per Plugin semplici solo strumento
con nomi di strumenti fissi. Usa direttamente `api.registerTool(...)` per Plugin misti
o per la registrazione di strumenti completamente dinamica.

| Metodo                          | Cosa registra                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (richiesto o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)       |

I comandi dei Plugin possono impostare `agentPromptGuidance` quando l'agente ha bisogno di un breve
suggerimento di routing di proprietà del comando. Mantieni quel testo relativo al comando stesso; non aggiungere
policy specifiche di provider o Plugin ai builder dei prompt core.

Le voci di guida possono essere stringhe legacy, che si applicano a ogni superficie di prompt, oppure
voci strutturate:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Le `surfaces` strutturate possono includere `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` resta un alias deprecato
per `openclaw_main`. Ometti `surfaces` per una guida intenzionalmente valida su tutte le superfici. Non
passare un array `surfaces` vuoto; viene rifiutato affinché una perdita accidentale di ambito non
diventi testo di prompt globale.

Le istruzioni developer native dell'app-server Codex sono più rigorose rispetto alle altre superfici di prompt:
solo la guida esplicitamente limitata a `codex_app_server` viene promossa in
quel percorso a priorità più alta. La guida con stringhe legacy e la guida strutturata senza ambito
restano disponibili per le superfici di prompt non Codex per compatibilità.

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Advertiser di discovery Gateway locale |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerNodeCliFeature(registrar, opts?)` | Funzionalità CLI Node sotto `openclaw nodes` |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per risultati degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione di prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura memoria |

### Hook host per Plugin di workflow

Gli hook host sono le seam SDK per Plugin che devono partecipare al ciclo di vita
dell'host invece di limitarsi ad aggiungere un provider, un canale o uno strumento. Sono
contratti generici; Plan Mode può usarli, ma lo stesso vale per workflow di approvazione,
gate di policy del workspace, monitor in background, wizard di setup e Plugin companion
per l'interfaccia utente.

| Metodo                                                                               | Contratto di cui è responsabile                                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stato di sessione di proprietà del plugin, compatibile con JSON, proiettato tramite le sessioni Gateway                                                       |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contesto durevole exactly-once iniettato nel turno successivo dell'agente per una sessione                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Criterio attendibile pre-plugin per gli strumenti, vincolato dal manifesto, che può bloccare o riscrivere i parametri degli strumenti                         |
| `api.registerToolMetadata(...)`                                                      | Metadati di visualizzazione del catalogo strumenti senza modificare l'implementazione dello strumento                                                         |
| `api.registerCommand(...)`                                                           | Comandi plugin con ambito; i risultati dei comandi possono impostare `continueAgent: true` o `suppressReply: true`; i comandi nativi Discord supportano `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descrittori di contributo della UI di controllo per superfici di sessione, strumento, esecuzione o impostazioni                                               |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback di pulizia per risorse runtime di proprietà del plugin nei percorsi di reset/eliminazione/ricaricamento                                              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Sottoscrizioni agli eventi sanificate per stato del workflow e monitor                                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Stato scratch del plugin per esecuzione, cancellato nel ciclo di vita terminale dell'esecuzione                                                               |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadati di pulizia per job dello scheduler di proprietà del plugin; non pianifica lavoro né crea record di task                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Consegna di allegati file mediata dall'host, solo bundled, verso la rotta di sessione direct-outbound attiva                                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turni di sessione pianificati basati su Cron, solo bundled, più pulizia basata su tag                                                                         |
| `api.session.controls.registerSessionAction(...)`                                    | Azioni di sessione tipizzate che i client possono inviare tramite il Gateway                                                                                  |

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

`scheduleSessionTurn(...)` è una praticità con ambito di sessione sopra lo
scheduler Cron del Gateway. Cron è responsabile del timing e crea il record di
task in background quando il turno viene eseguito; il Plugin SDK limita solo la
sessione di destinazione, la denominazione di proprietà del plugin e la pulizia.
Usa `api.runtime.tasks.managedFlows` dentro il turno pianificato quando il lavoro
stesso richiede uno stato Task Flow durevole e multi-step.

I contratti separano intenzionalmente l'autorità:

- I plugin esterni possono essere responsabili di estensioni di sessione,
  descrittori UI, comandi, metadati degli strumenti, iniezioni nel turno
  successivo e hook normali.
- I criteri attendibili per gli strumenti vengono eseguiti prima degli hook
  ordinari `before_tool_call` e sono considerati attendibili dall'host. I
  criteri bundled vengono eseguiti per primi; i criteri dei plugin installati
  richiedono abilitazione esplicita più i loro id locali in
  `contracts.trustedToolPolicies`, e vengono eseguiti poi nell'ordine di
  caricamento dei plugin. Gli id dei criteri hanno ambito nel plugin che li
  registra.
- La proprietà dei comandi riservati è solo bundled. I plugin esterni dovrebbero
  usare i propri nomi comando o alias.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt,
  inclusi `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, i campi prompt del legacy
  `before_agent_start` e `enqueueNextTurnInjection`.

Esempi di consumatori non Plan:

| Archetipo di plugin          | Hook usati                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow di approvazione     | Estensione di sessione, continuazione del comando, iniezione nel turno successivo, descrittore UI                                      |
| Gate di criterio budget/workspace | Criterio attendibile per strumenti, metadati degli strumenti, proiezione di sessione                                               |
| Monitor del ciclo di vita in background | Pulizia del ciclo di vita runtime, sottoscrizione agli eventi agente, proprietà/pulizia dello scheduler di sessione, contributo al prompt Heartbeat, descrittore UI |
| Procedura guidata di configurazione o onboarding | Estensione di sessione, comandi con ambito, descrittore UI di controllo                                              |

<Note>
  I namespace amministrativi core riservati (`config.*`, `exec.approvals.*`,
  `wizard.*`, `update.*`) restano sempre `operator.admin`, anche se un plugin
  tenta di assegnare un ambito di metodo Gateway più ristretto. Preferisci
  prefissi specifici del plugin per i metodi di proprietà del plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  I plugin bundled e i plugin installati abilitati esplicitamente con contratti
  manifesto corrispondenti possono usare `api.registerAgentToolResultMiddleware(...)`
  quando devono riscrivere il risultato di uno strumento dopo l'esecuzione e
  prima che il runtime reintroduca quel risultato nel modello. Questa è la
  superficie attendibile e neutrale rispetto al runtime per riduttori di output
  asincroni come tokenjuice.

I plugin devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime di destinazione, per esempio `["openclaw", "codex"]`. I plugin
installati senza quel contratto, o senza abilitazione esplicita, non possono
registrare questo middleware; mantieni i normali hook plugin OpenClaw per il
lavoro che non richiede il timing del risultato strumento prima del modello. Il
vecchio percorso di registrazione factory di estensioni solo per embedded-runner
è stato rimosso.
</Accordion>

### Registrazione della discovery Gateway

`api.registerGatewayDiscoveryService(...)` consente a un plugin di pubblicizzare
il Gateway attivo su un trasporto di discovery locale come mDNS/Bonjour.
OpenClaw chiama il servizio durante l'avvio del Gateway quando la discovery
locale è abilitata, passa le porte Gateway correnti e dati TXT di suggerimento
non segreti, e chiama l'handler `stop` restituito durante l'arresto del Gateway.

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

I plugin di discovery Gateway non devono trattare i valori TXT pubblicizzati
come segreti o autenticazione. La discovery è un suggerimento di routing;
l'autenticazione Gateway e il pinning TLS restano responsabili della fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati comando:

- `commands`: nomi comando espliciti di proprietà del registrar
- `descriptors`: descrittori comando in fase di parsing usati per help CLI,
  routing e registrazione CLI lazy del plugin
- `parentPath`: percorso comando padre opzionale per gruppi di comandi annidati,
  come `["nodes"]`

Per funzionalità paired-node, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper intorno a
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità nodo esplicite di proprietà del plugin.

Se vuoi che un comando plugin resti caricato in modo lazy nel normale percorso
CLI root, fornisci `descriptors` che coprano ogni root comando di primo livello
esposta da quel registrar.

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

Usa `commands` da solo solo quando non hai bisogno della registrazione CLI root
lazy. Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder basati su descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la configurazione
predefinita per un backend CLI AI locale come `claude-cli` o `my-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli come `my-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  default del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo l'unione
  (per esempio normalizzando vecchie forme dei flag).
- Usa `resolveExecutionArgs` per riscritture di argv con ambito di richiesta che appartengono al
  dialetto della CLI, come la mappatura dei livelli di ragionamento di OpenClaw a un flag nativo
  di effort. L'hook riceve `ctx.executionMode`; usa `"side-question"` per aggiungere
  flag di isolamento nativi del backend per chiamate effimere `/btw`. Se quei flag
  disabilitano in modo affidabile gli strumenti nativi per una CLI altrimenti sempre attiva, dichiara
  anche `sideQuestionToolMode: "disabled"`.

Per una guida di authoring end-to-end, consulta
[Plugin backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). I callback del ciclo di vita ricevono `runtimeSettings` quando l'host può fornire diagnostica di modello/provider/modalità; i vecchi motori strict vengono riprovati senza quella chiave. |
| `api.registerMemoryCapability(capability)` | Capability di memoria unificata                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione di prompt della memoria                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria                                                                                                                                                                             |

### Adapter deprecati per embedding della memoria

| Metodo                                         | Cosa registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i Plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i Plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno specifico
  Plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatible per i Plugin di memoria.
- `MemoryFlushPlan.model` può fissare il turno di flush a un riferimento esatto
  `provider/model`, come `ollama/qwen3:8b`, senza ereditare la catena di fallback
  attiva.
- `registerMemoryEmbeddingProvider` è deprecato. I nuovi provider di embedding
  dovrebbero usare `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- I provider specifici della memoria esistenti continuano a funzionare durante la finestra
  di migrazione, ma l'ispezione dei Plugin lo segnala come debito di compatibilità per
  i Plugin non bundled.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook del ciclo di vita tipizzato          |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

Consulta [Hook dei Plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica
delle guardie.

### Semantica delle decisioni degli hook

`before_install` è un hook del ciclo di vita del runtime del Plugin, non la superficie della
policy di installazione dell'operatore. Usa `security.installPolicy` quando una decisione allow/block deve
coprire percorsi di installazione o aggiornamento supportati da CLI e Gateway.

- `before_tool_call`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (equivale a omettere `block`), non come un override.
- `before_install`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (equivale a omettere `block`), non come un override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Quando un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch predefinito del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Quando un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (equivale a omettere `cancel`), non come un override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve il routing inbound di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di routing tipizzati `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio di proprietà del Gateway invece di fare affidamento su hook interni `gateway:startup`.
- `cron_changed`: osserva i cambiamenti del ciclo di vita Cron di proprietà del Gateway. Usa `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` quando sincronizzi scheduler di wake esterni, e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del Plugin                                                                                   |
| `api.name`               | `string`                  | Nome visualizzato                                                                                |
| `api.version`            | `string?`                 | Versione del Plugin (opzionale)                                                                   |
| `api.description`        | `string?`                 | Descrizione del Plugin (opzionale)                                                               |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directory root del Plugin (opzionale)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del Plugin                                                        |

## Convenzione dei moduli interni

Dentro il tuo Plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumer esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Punto di ingresso del Plugin
  setup-entry.ts    # Punto di ingresso leggero solo per setup (opzionale)
```

<Warning>
  Non importare mai il tuo Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin bundled caricati tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di ingresso pubblici simili) preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora uno
snapshot runtime, ricadono sul file di configurazione risolto su disco.
Le facade dei Plugin bundled pacchettizzati dovrebbero essere caricate tramite i loader facade dei Plugin
di OpenClaw; gli import diretti da `dist/extensions/...` bypassano il manifesto
e i controlli sidecar runtime che le installazioni pacchettizzate usano per il codice di proprietà del Plugin.

I Plugin provider possono esporre un barrel di contratto stretto e locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempi bundled:

- **Anthropic**: superficie pubblica `api.ts` / `contract-api.ts` per helper Claude
  beta-header e stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder provider,
  helper per modello predefinito e builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due Plugin.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo del namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifesti e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utility di test e regole lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello delle capability.
  </Card>
</CardGroup>
