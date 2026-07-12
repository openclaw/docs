---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK eseguire l'importazione
    - Vuoi un riferimento per tutti i metodi di registrazione di OpenClawPluginApi
    - Stai cercando un'esportazione specifica dell'SDK
sidebarTitle: Plugin SDK overview
summary: Mappa delle importazioni, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica dell’SDK per Plugin
x-i18n:
    generated_at: "2026-07-12T07:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

L'SDK dei plugin è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa è possibile registrare**.

<Note>
  Questa pagina è destinata agli autori di plugin che usano `openclaw/plugin-sdk/*`
  all'interno di OpenClaw. Per app esterne, script, dashboard, processi CI ed
  estensioni IDE che intendono eseguire agenti tramite il Gateway, usare invece
  [Integrazioni del Gateway per app esterne](/it/gateway/external-apps).
</Note>

<Tip>
Cerchi invece una guida pratica? Inizia da [Creazione di plugin](/it/plugins/building-plugins). Usa [Plugin per canali](/it/plugins/sdk-channel-plugins) per i canali, [Plugin per provider](/it/plugins/sdk-provider-plugins) per i provider di modelli, [Plugin backend CLI](/it/plugins/cli-backend-plugins) per i backend CLI di IA locali, [Plugin per infrastrutture degli agenti](/it/plugins/sdk-agent-harness) per gli esecutori nativi degli agenti e [Hook dei plugin](/it/plugins/hooks) per gli hook degli strumenti o del ciclo di vita.
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autonomo. Ciò mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per gli helper di ingresso/compilazione
specifici dei canali, preferisci `openclaw/plugin-sdk/channel-core`; riserva
`openclaw/plugin-sdk/core` alla superficie generale più ampia e agli helper
condivisi, come `buildChannelConfigSchema`.

Per la configurazione dei canali, pubblica lo schema JSON di proprietà del canale
tramite `openclaw.plugin.json#channelConfigs`. Il sottopercorso
`plugin-sdk/channel-config-schema` è destinato alle primitive di schema condivise
e al generatore generico. I plugin inclusi in OpenClaw usano
`plugin-sdk/bundled-channel-config-schema` per gli schemi conservati dei canali
inclusi. Le esportazioni di compatibilità deprecate rimangono in
`plugin-sdk/channel-config-schema-legacy`; nessuno dei sottopercorsi degli schemi
inclusi costituisce un modello per i nuovi plugin.

<Warning>
  Non importare interfacce pratiche con riferimenti specifici a provider o canali
  (ad esempio `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`,
  `.../whatsapp`). I plugin inclusi compongono sottopercorsi SDK generici nei
  propri barrel `api.ts` / `runtime-api.ts`; i consumer del core devono usare
  tali barrel locali al plugin oppure aggiungere un contratto SDK generico e
  circoscritto quando un'esigenza è realmente comune a più canali.

Un piccolo insieme di interfacce helper per i plugin inclusi continua ad apparire
nella mappa delle esportazioni generata quando ne viene monitorato l'uso da parte
del proprietario. Esistono esclusivamente per la manutenzione dei plugin inclusi
e non sono percorsi di importazione consigliati per i nuovi plugin di terze parti.

Anche `openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account`
vengono mantenuti come facciate di compatibilità deprecate per gli utilizzi
monitorati dai proprietari. Non copiare questi percorsi di importazione nei nuovi
plugin; usa invece gli helper di runtime inseriti e i sottopercorsi SDK generici
per i canali.
</Warning>

## Riferimento dei sottopercorsi

L'SDK dei plugin è esposto come un insieme di sottopercorsi circoscritti,
raggruppati per area (ingresso del plugin, canale, provider, autenticazione,
runtime, funzionalità, memoria e helper riservati ai plugin inclusi). Per il
catalogo completo, raggruppato e con collegamenti, consulta
[Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).

L'inventario dei punti di ingresso del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto vengono
generate dal sottoinsieme pubblico dopo aver sottratto i sottopercorsi di test e
interni locali al repository elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Esegui
`pnpm plugin-sdk:surface` per verificare il numero di esportazioni pubbliche. I
sottopercorsi pubblici deprecati sufficientemente vecchi e non usati dal codice
di produzione delle estensioni incluse sono monitorati in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; i barrel generali
deprecati di riesportazione sono monitorati in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API di registrazione

Il callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle funzionalità

| Metodo                                           | Cosa registra                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)                                                                      |
| `api.registerWorkerProvider(...)`                | Lease del ciclo di vita dei worker cloud                                                      |
| `api.registerModelCatalogProvider(...)`          | Righe del catalogo dei modelli per la generazione di testo e contenuti multimediali            |
| `api.registerAgentHarness(...)`                  | Esecutore nativo degli agenti [sperimentale](/it/plugins/sdk-agent-harness) (Codex, Copilot)       |
| `api.registerCliBackend(...)`                    | Backend locale di inferenza CLI                                                               |
| `api.registerChannel(...)`                       | Canale di messaggistica                                                                        |
| `api.registerEmbeddingProvider(...)`             | Provider riutilizzabile di incorporamenti vettoriali                                           |
| `api.registerSpeechProvider(...)`                | Sintesi vocale da testo / STT                                                                  |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione in tempo reale in streaming                                                       |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali duplex in tempo reale                                                          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video                                                                |
| `api.registerTranscriptSourceProvider(...)`      | Fonte di trascrizioni di riunioni in diretta o importate                                       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini                                                                        |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                                                                           |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                                                                              |
| `api.registerWebFetchProvider(...)`              | Provider per recupero / scraping Web                                                           |
| `api.registerWebSearchProvider(...)`             | Ricerca Web                                                                                    |
| `api.registerCompactionProvider(...)`            | Backend collegabile per la Compaction delle trascrizioni                                       |

I provider di worker devono inoltre dichiarare il proprio ID in `contracts.workerProviders`.
Il core rende persistente l'intento durevole prima di `provision(profile, operationId)`. I provider convalidano le impostazioni prima dell'allocazione esterna e generano `WorkerProviderError` in caso di rifiuto permanente del profilo. `provision` deve adottare lo stesso lease quando l'ID operazione si ripete.
Il core rende persistenti le impostazioni convalidate del profilo insieme al lease e fornisce tale snapshot a `destroy({ leaseId, profile })`, che deve essere idempotente, e a `inspect({ leaseId, profile })`, che restituisce `active`, `destroyed` o `unknown`. Ciò consente ai provider di instradare le chiamate del ciclo di vita dopo il riavvio di un Gateway o la rimozione di un profilo denominato. Gli endpoint SSH usano un `SecretRef` per `keyRef`, mai materiale della chiave incorporato, e includono un `hostKey` proveniente da un output di provisioning attendibile, nel formato esatto `algorithm base64`, senza nome host né commento. Il core fissa `hostKey` e non considera mai attendibile una chiave ricevuta dalla prima connessione. Un provider che genera dinamicamente un `keyRef` può implementare `resolveSshIdentity({ leaseId, profile, keyRef })`; quando presente, tale resolver è autoritativo, mentre i provider che ne sono privi usano il resolver generico dei segreti configurato.
I provider con lease rinnovabili possono anche implementare `renew(leaseId)`.
`inspect` deve generare un'eccezione in caso di errori transitori o indeterminati; restituisce `unknown` solo in caso di assenza accertata. Il core contrassegna come orfano un record locale attivo oppure considera l'assenza come completamento della dismissione dopo una richiesta di eliminazione resa persistente.

I provider di incorporamenti registrati con `api.registerEmbeddingProvider(...)`
devono essere elencati anche in `contracts.embeddingProviders` nel manifesto del
plugin. Questa è la superficie generica per gli incorporamenti, destinata alla
generazione riutilizzabile di vettori. La ricerca in memoria può utilizzare
questa superficie generica dei provider. La precedente interfaccia
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` costituisce una compatibilità deprecata
durante la migrazione dei provider esistenti specifici per la memoria.

I provider specifici per la memoria che espongono ancora un `batchEmbed(...)` di
runtime rimangono sul contratto di elaborazione in batch esistente per singolo
file, a meno che il loro runtime non imposti esplicitamente
`sourceWideBatchEmbed: true`. Questa adesione facoltativa consente all'host della
memoria di inviare segmenti provenienti da più file di memoria modificati e da
fonti abilitate in una singola chiamata `batchEmbed(...)`, fino ai limiti di batch
dell'host. Gli adattatori batch che caricano file di richiesta JSONL devono
suddividere i processi del provider prima di raggiungere sia il limite delle
dimensioni di caricamento sia quello del numero di richieste. Il provider deve
restituire un incorporamento per ogni segmento di input, nello stesso ordine di
`batch.chunks`; ometti il flag quando il provider prevede batch locali ai file o
non può conservare l'ordine degli input in un processo più ampio esteso
all'intera fonte.

### Strumenti e comandi

Usa [`defineToolPlugin`](/it/plugins/tool-plugins) per semplici plugin che includono
solo strumenti con nomi fissi. Usa direttamente `api.registerTool(...)` per i
plugin misti o per la registrazione completamente dinamica degli strumenti.

| Metodo                                 | Cosa registra                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Strumento dell'agente (obbligatorio oppure `{ optional: true }`)                                                                                        |
| `api.registerCommand(def)`             | Comando personalizzato (ignora l'LLM)                                                                                                                   |
| `api.registerNodeHostCommand(command)` | Comando gestito da `openclaw node run`; i metadati facoltativi `agentTool` possono esporlo come strumento visibile all'agente mentre il Node è connesso |

I comandi dei plugin possono impostare `agentPromptGuidance` quando l'agente
necessita di una breve indicazione di instradamento appartenente al comando.
Limita il testo al comando stesso; non aggiungere criteri specifici per provider
o plugin ai generatori dei prompt del core.

Le voci delle indicazioni possono essere stringhe legacy, che si applicano a ogni
superficie dei prompt, oppure voci strutturate:

```ts
agentPromptGuidance: [
  "Indicazione globale per il comando.",
  { text: "Mostra questo solo nel prompt principale di OpenClaw.", surfaces: ["openclaw_main"] },
];
```

Le `surfaces` strutturate possono includere `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` rimane un alias deprecato
di `openclaw_main`. Ometti `surfaces` per le indicazioni intenzionalmente
applicabili a tutte le superfici. Non passare un array `surfaces` vuoto: viene
rifiutato affinché una perdita accidentale dell'ambito non trasformi il testo in
un prompt globale.

Le istruzioni native per sviluppatori del server applicativo Codex sono più
rigorose rispetto alle altre superfici dei prompt: solo le indicazioni il cui
ambito è esplicitamente `codex_app_server` vengono promosse in quel canale a
priorità più elevata. Le indicazioni sotto forma di stringhe legacy e le
indicazioni strutturate senza ambito rimangono disponibili alle superfici dei
prompt diverse da Codex per compatibilità.

I comandi dell'host Node vengono eseguiti sull'host Node connesso, non all'interno del processo Gateway. Se `agentTool` è presente, il Node pubblica un descrittore dopo una connessione riuscita al Gateway; il Gateway lo espone alle esecuzioni dell'agente solo mentre quel Node è connesso e solo se il valore `command` del descrittore rientra nell'insieme di comandi approvati del Node. Impostare `agentTool.defaultPlatforms` per includere un comando non pericoloso nella allowlist predefinita dei comandi del Node; in caso contrario, è necessario configurare esplicitamente `gateway.nodes.allowCommands` o una policy di invocazione del Node. `agentTool.name` deve essere sicuro per il provider: deve iniziare con una lettera, utilizzare solo lettere, cifre, trattini bassi o trattini e non superare i 64 caratteri. Gli strumenti Node basati su MCP possono impostare i metadati `agentTool.mcp` affinché il catalogo e le superfici di ricerca degli strumenti possano mostrare l'identità del server/strumento MCP remoto, ma l'esecuzione avviene comunque tramite il comando Node pubblicizzato.

### Infrastruttura

| Metodo                                          | Cosa registra                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook di evento                                                                |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                                     |
| `api.registerGatewayMethod(name, handler)`      | Metodo RPC del Gateway                                                        |
| `api.registerGatewayDiscoveryService(service)`  | Annunciatore del servizio di rilevamento del Gateway locale                   |
| `api.registerCli(registrar, opts?)`             | Sottocomando CLI                                                              |
| `api.registerNodeCliFeature(registrar, opts?)`  | Funzionalità CLI del Node in `openclaw nodes`                                 |
| `api.registerService(service)`                  | Servizio in background                                                        |
| `api.registerInteractiveHandler(registration)`  | Gestore interattivo                                                           |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware di runtime per i risultati degli strumenti                         |
| `api.registerMemoryPromptSupplement(builder)`   | Sezione aggiuntiva del prompt adiacente alla memoria                          |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aggiuntivo per la ricerca e la lettura della memoria                   |
| `api.registerHostedMediaResolver(resolver)`     | Risolutore per URL di contenuti multimediali ospitati in stile browser        |
| `api.registerTextTransforms(transforms)`        | Riscritture testuali di compatibilità di prompt/messaggi gestite dal Plugin   |
| `api.registerConfigMigration(migrate)`          | Migrazione leggera della configurazione eseguita prima del caricamento del runtime del Plugin |
| `api.registerMigrationProvider(provider)`       | Importatore per `openclaw migrate`                                            |
| `api.registerAutoEnableProbe(probe)`            | Verifica della configurazione che può abilitare automaticamente questo Plugin |
| `api.registerReload(registration)`              | Policy di prefisso della configurazione per la gestione del ricaricamento tramite riavvio/hot/noop |
| `api.registerNodeHostCommand(command)`          | Gestore di comandi esposto ai Node associati                                  |
| `api.registerNodeInvokePolicy(policy)`          | Policy di allowlist/approvazione per i comandi invocati dal Node              |
| `api.registerSecurityAuditCollector(collector)` | Raccoglitore dei risultati per `openclaw security audit`                      |

I builder dei supplementi del prompt di memoria ricevono il contesto facoltativo `agentId`, `agentSessionKey` e `sandboxed`. Le chiamate `search` e `get` del supplemento del corpus di memoria ricevono il contesto facoltativo `agentId` e `sandboxed`. I Plugin con archiviazione appartenente all'agente devono risolvere tale archiviazione per ogni chiamata, anziché acquisire un unico percorso globale durante la registrazione. Se un ID agente è obbligatorio ma manca in un'operazione multi-agente, rifiutare l'operazione in modo sicuro anziché scegliere un agente arbitrario.

I gestori interattivi di Telegram possono restituire `{ submitText }` per instradare il testo attraverso il normale percorso in ingresso dell'agente di Telegram dopo l'esito positivo del gestore. OpenClaw mantiene il pulsante di callback quando la policy in ingresso ignora il testo o l'elaborazione non riesce, affinché l'utente possa riprovare dopo la modifica della condizione bloccante. Questo campo del risultato è specifico di Telegram; gli altri canali mantengono i propri contratti per i risultati interattivi.

### Hook dell'host per i Plugin di flusso di lavoro

Gli hook dell'host sono i punti di integrazione dell'SDK per i Plugin che devono partecipare al ciclo di vita dell'host, anziché limitarsi ad aggiungere un provider, un canale o uno strumento. Sono contratti generici; possono essere utilizzati dalla modalità di pianificazione, ma anche da flussi di lavoro di approvazione, controlli delle policy dello spazio di lavoro, monitor in background, procedure guidate di configurazione e Plugin complementari per l'interfaccia utente.

| Metodo                                                                               | Contratto di cui è responsabile                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stato della sessione appartenente al Plugin e compatibile con JSON, proiettato attraverso le sessioni del Gateway                                                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contesto persistente elaborato esattamente una volta e inserito nel turno successivo dell'agente per una sessione                                                         |
| `api.registerTrustedToolPolicy(...)`                                                 | Policy attendibile degli strumenti precedente ai Plugin e vincolata dal manifesto, in grado di bloccare o riscrivere i parametri degli strumenti                         |
| `api.registerToolMetadata(...)`                                                      | Metadati di visualizzazione del catalogo degli strumenti senza modificare l'implementazione dello strumento                                                               |
| `api.registerCommand(...)`                                                           | Comandi del Plugin con ambito definito; i risultati dei comandi possono impostare `continueAgent: true` o `suppressReply: true`; i comandi nativi di Discord supportano `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descrittori dei contributi alla UI di controllo per le superfici di sessione, strumento, esecuzione, impostazioni o scheda                                                 |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback di pulizia per le risorse di runtime appartenenti al Plugin nei percorsi di reimpostazione/eliminazione/ricaricamento                                              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Sottoscrizioni agli eventi sanificate per lo stato del flusso di lavoro e i monitor                                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Stato temporaneo del Plugin per esecuzione, eliminato al termine del ciclo di vita dell'esecuzione                                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadati di pulizia per i processi dello scheduler appartenenti al Plugin; non pianifica attività né crea record di attività                                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Consegna di file allegati mediata dall'host, riservata ai componenti inclusi, verso il percorso diretto in uscita della sessione attiva                                    |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turni di sessione pianificati e basati su Cron, riservati ai componenti inclusi, con pulizia basata sui tag                                                                |
| `api.session.controls.registerSessionAction(...)`                                    | Azioni di sessione tipizzate che i client possono inviare tramite il Gateway                                                                                              |

Un descrittore `surface: "tab"` aggiunge una scheda nella barra laterale della UI di controllo. I descrittori delle schede dei Plugin attivi vengono comunicati ai client della dashboard nel messaggio hello del Gateway (`controlUiTabs`), quindi la scheda viene visualizzata solo mentre il Plugin è abilitato. I Plugin inclusi possono fornire una vista della dashboard di prima classe per la propria scheda; gli altri Plugin possono impostare `path` su una route HTTP del Plugin (vedere `api.registerHttpRoute(...)`) che la dashboard visualizza in un frame con sandbox. `icon` è un suggerimento per il nome dell'icona della dashboard, `group` seleziona la sezione della barra laterale (`control` o `agent`), `order` determina l'ordinamento tra le schede dei Plugin e `requiredScopes` nasconde la scheda alle connessioni prive di tali ambiti operatore:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Utilizzare gli spazi dei nomi raggruppati per il nuovo codice dei Plugin:

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

I metodi piatti equivalenti rimangono disponibili come alias di compatibilità deprecati per i Plugin esistenti. Non aggiungere nuovo codice di Plugin che chiami direttamente `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` o `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` è una funzione di utilità con ambito di sessione basata sullo scheduler Cron del Gateway. Cron gestisce la temporizzazione e crea il record dell'attività in background quando il turno viene eseguito; l'SDK del Plugin limita soltanto la sessione di destinazione, la denominazione appartenente al Plugin e la pulizia. Utilizzare `api.runtime.tasks.managedFlows` all'interno del turno pianificato quando il lavoro stesso richiede uno stato Task Flow persistente e articolato in più passaggi.

I contratti separano intenzionalmente l'autorità:

- I Plugin esterni possono gestire estensioni di sessione, descrittori dell'interfaccia utente, comandi, metadati degli strumenti, inserimenti nel turno successivo e hook normali.
- Le policy attendibili degli strumenti vengono eseguite prima dei normali hook `before_tool_call` e sono considerate attendibili dall'host. Le policy incluse vengono eseguite per prime; quelle dei Plugin installati richiedono l'abilitazione esplicita e l'inclusione dei relativi ID locali in `contracts.trustedToolPolicies`, quindi vengono eseguite nell'ordine di caricamento dei Plugin. Gli ID delle policy hanno come ambito il Plugin che le registra.
- La titolarità dei comandi riservati è limitata ai componenti inclusi. I Plugin esterni devono utilizzare nomi di comando o alias propri.
- `allowPromptInjection=false` disabilita gli hook che modificano il prompt, inclusi `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, i campi del prompt provenienti dal precedente `before_agent_start` e `enqueueNextTurnInjection`.

Esempi di utilizzatori non legati alla modalità di pianificazione:

| Archetipo di Plugin                 | Hook utilizzati                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flusso di approvazione              | Estensione della sessione, continuazione del comando, inserimento nel turno successivo, descrittore dell'interfaccia utente                                  |
| Controllo dei criteri di budget/area di lavoro | Criteri degli strumenti attendibili, metadati degli strumenti, proiezione della sessione                                                          |
| Monitoraggio del ciclo di vita in background | Pulizia del ciclo di vita del runtime, sottoscrizione agli eventi dell'agente, proprietà/pulizia dello scheduler di sessione, contributo al prompt Heartbeat, descrittore dell'interfaccia utente |
| Procedura guidata di configurazione o onboarding | Estensione della sessione, comandi con ambito definito, descrittore dell'interfaccia utente di controllo                                          |

<Note>
  Gli spazi dei nomi amministrativi riservati del core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) rimangono sempre `operator.admin`, anche se un Plugin tenta di assegnare un
  ambito più ristretto al metodo del Gateway. Per i metodi di proprietà dei Plugin,
  preferisci prefissi specifici del Plugin.
</Note>

<Accordion title="Quando utilizzare il middleware dei risultati degli strumenti">
  I Plugin inclusi e i Plugin installati esplicitamente abilitati con contratti
  di manifesto corrispondenti possono utilizzare `api.registerAgentToolResultMiddleware(...)`
  quando devono riscrivere il risultato di uno strumento dopo l'esecuzione e prima che il runtime
  lo restituisca al modello. Questo è il punto di integrazione attendibile e indipendente dal runtime
  per i riduttori di output asincroni come tokenjuice.

I Plugin devono dichiarare `contracts.agentToolResultMiddleware` per ogni runtime
di destinazione, ad esempio `["openclaw", "codex"]`. I Plugin installati privi di tale
contratto, o non esplicitamente abilitati, non possono registrare questo middleware; utilizza
i normali hook dei Plugin OpenClaw per le operazioni che non richiedono una temporizzazione
del risultato dello strumento precedente al modello. Il vecchio percorso di registrazione
della factory di estensione riservato al runner incorporato è stato rimosso.
</Accordion>

### Registrazione del rilevamento del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di annunciare il
Gateway attivo su un trasporto di rilevamento locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando il rilevamento locale è abilitato, passa le
porte correnti del Gateway e dati di suggerimento TXT non segreti, quindi chiama il gestore
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

I Plugin di rilevamento del Gateway non devono considerare segreti o dati di
autenticazione i valori TXT annunciati. Il rilevamento è un suggerimento per l'instradamento;
l'autenticazione del Gateway e il pinning TLS continuano a determinare l'attendibilità.

### Metadati di registrazione della CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati dei comandi:

- `commands`: nomi espliciti dei comandi di proprietà del registratore
- `descriptors`: descrittori dei comandi usati durante l'analisi per la guida della CLI,
  l'instradamento e la registrazione differita della CLI del Plugin
- `parentPath`: percorso facoltativo del comando padre per gruppi di comandi annidati, come
  `["nodes"]`

Per le funzionalità dei nodi associati, preferisci
`api.registerNodeCliFeature(registrar, opts?)`. È un piccolo wrapper di
`api.registerCli(..., { parentPath: ["nodes"] })` e rende comandi come
`openclaw nodes canvas` funzionalità dei nodi esplicitamente di proprietà del Plugin.

Se vuoi che un comando del Plugin rimanga caricato in modo differito nel normale percorso
radice della CLI, fornisci `descriptors` che coprano ogni radice di comando di primo livello
esposta dal registratore.

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
        description: "Gestisci account Matrix, verifica, dispositivi e stato del profilo",
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
        description: "Acquisisci o visualizza il contenuto del canvas da un nodo associato",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilizza solo `commands` esclusivamente quando non ti serve la registrazione differita
della CLI radice. Questo percorso di compatibilità con caricamento immediato rimane supportato,
ma non installa segnaposto basati su descrittori per il caricamento differito durante l'analisi.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un Plugin di gestire la configurazione predefinita
per un backend CLI di IA locale come `claude-cli` o `my-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli come `my-cli/gpt-5`.
- La `config` del backend usa la stessa struttura di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente continua ad avere la precedenza. OpenClaw sovrappone
  `agents.defaults.cliBackends.<id>` alla configurazione predefinita del Plugin prima di eseguire la CLI.
- Utilizza `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo l'unione
  (ad esempio, per normalizzare vecchie strutture dei flag).
- Utilizza `resolveExecutionArgs` per le riscritture di argv relative alla richiesta che appartengono
  al dialetto della CLI, come la mappatura dei livelli di ragionamento di OpenClaw a un flag nativo
  di intensità. L'hook riceve `ctx.executionMode`; utilizza `"side-question"` per aggiungere
  flag di isolamento nativi del backend per le chiamate temporanee `/btw`. Se tali flag
  disabilitano in modo affidabile gli strumenti nativi per una CLI altrimenti sempre attiva, dichiara
  anche `sideQuestionToolMode: "disabled"`.
- I backend in grado di disabilitare tutti gli strumenti nativi per un'esecuzione specifica possono
  dichiarare `nativeToolMode: "selectable"`. Le chiamate con restrizioni passano una tupla
  `ctx.toolAvailability.native` vuota insieme a una lista di autorizzazioni MCP esatta e isolata dall'host;
  `resolveExecutionArgs` deve applicarle entrambe all'argv finale di una nuova esecuzione o di una ripresa.
  OpenClaw interrompe l'operazione in modo sicuro se il backend non è in grado di farlo.

Per una guida completa alla creazione, consulta
[i Plugin per backend CLI](/it/plugins/cli-backend-plugins).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). Le callback del ciclo di vita ricevono `runtimeSettings` quando l'host può fornire diagnostica su modello/provider/modalità; i motori rigorosi meno recenti vengono riprovati senza tale chiave. |
| `api.registerMemoryCapability(capability)` | Funzionalità di memoria unificata                                                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Generatore della sezione di memoria del prompt                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Risolutore del piano di scaricamento della memoria                                                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adattatore del runtime di memoria                                                                                                                                                                              |

### Adattatori di embedding della memoria deprecati

| Metodo                                         | Cosa registra                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding della memoria per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i Plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  affinché i Plugin complementari possano utilizzare gli artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core`, invece di accedere alla struttura privata di uno
  specifico Plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive per Plugin di memoria compatibili con le versioni precedenti.
- `MemoryFlushPlan.model` può vincolare il turno di scaricamento a un riferimento esatto
  `provider/model`, come `ollama/qwen3:8b`, senza ereditare la catena di fallback attiva.
- `registerMemoryEmbeddingProvider` è deprecato. I nuovi provider di embedding
  devono utilizzare `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- I provider esistenti specifici della memoria continuano a funzionare durante la finestra
  di migrazione, ma l'ispezione dei Plugin segnala questa condizione come debito di compatibilità
  per i Plugin non inclusi.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                                  |
| -------------------------------------------- | ---------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipizzato del ciclo di vita         |
| `api.onConversationBindingResolved(handler)` | Callback di risoluzione dell'associazione della conversazione |

Consulta [Hook dei Plugin](/it/plugins/hooks) per esempi, nomi comuni degli hook e semantica
delle condizioni di protezione.

### Semantica decisionale degli hook

`before_install` è un hook del ciclo di vita del runtime del Plugin, non l'interfaccia
dei criteri di installazione dell'operatore. Utilizza `security.installPolicy` quando una
decisione di autorizzazione/blocco deve coprire i percorsi di installazione o aggiornamento
tramite CLI e Gateway.

- `before_tool_call`: la restituzione di `{ block: true }` è terminale. Quando un gestore la imposta, i gestori con priorità inferiore vengono ignorati.
- `before_tool_call`: la restituzione di `{ block: false }` viene trattata come nessuna decisione (come se `block` fosse omesso), non come una sostituzione.
- `before_install`: la restituzione di `{ block: true }` è terminale. Quando un gestore la imposta, i gestori con priorità inferiore vengono ignorati.
- `before_install`: la restituzione di `{ block: false }` viene trattata come nessuna decisione (come se `block` fosse omesso), non come una sostituzione.
- `reply_dispatch`: la restituzione di `{ handled: true, ... }` è terminale. Quando un gestore prende in carico l'invio, i gestori con priorità inferiore e il percorso predefinito di invio al modello vengono ignorati.
- `message_sending`: la restituzione di `{ cancel: true }` è terminale. Quando un gestore la imposta, i gestori con priorità inferiore vengono ignorati.
- `message_sending`: la restituzione di `{ cancel: false }` viene trattata come nessuna decisione (come se `cancel` fosse omesso), non come una sostituzione.
- `message_received`: usa il campo tipizzato `threadId` quando è necessario instradare thread o argomenti in ingresso. Mantieni `metadata` per i dati aggiuntivi specifici del canale.
- `message_sending`: usa i campi di instradamento tipizzati `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio gestito dal Gateway, invece di fare affidamento sugli hook interni `gateway:startup`. A questo punto Cron potrebbe essere ancora in fase di caricamento.
- `cron_reconciled`: ricostruisce una proiezione Cron esterna completa dopo l'avvio o il ricaricamento dello scheduler. Include `reason` e lo stato effettivo `enabled`, compreso `enabled: false`, mentre `ctx.getCron?.()` restituisce lo scheduler riconciliato esatto. Passa `ctx.abortSignal` alle operazioni di proiezione persistenti; l'operazione viene interrotta quando l'istantanea dello scheduler viene sostituita o il Gateway si chiude.
- `cron_changed`: osserva le modifiche al ciclo di vita di Cron gestito dal Gateway. Gli eventi `scheduled` e `removed` sono indicazioni di riconciliazione successive al commit, non un registro ordinato delle differenze. Il campo `event.nextRunAtMs` di un evento pianificato è assente quando l'attività non prevede una successiva riattivazione; un evento di rimozione contiene comunque l'istantanea dell'attività eliminata.

Gli scheduler di riattivazione esterni devono applicare il debounce o aggregare gli eventi `cron_changed`,
quindi rileggere la vista persistente completa dallo scheduler acquisito più di recente da
`cron_reconciled`. Non adottare lo scheduler dal contesto di `cron_changed`: un'indicazione
separata proveniente da uno scheduler precedente può sovrapporsi a un ricaricamento successivo.

Usa `cron_reconciled` come attivatore dell'istantanea completa per lo stato persistente caricato
all'avvio del Gateway o alla sostituzione dello scheduler. Non viene riprodotto durante un
ricaricamento a caldo del solo Plugin. I gestori di osservazione vengono eseguiti in parallelo e gli
invii asincroni senza attesa possono sovrapporsi, quindi i consumer non devono dipendere dall'ordine
di completamento degli eventi. Mantieni OpenClaw come fonte autorevole per i controlli delle scadenze
e l'esecuzione.

Per un adattatore a esecuzione singola con sostituzione persistente, nuovi tentativi/backoff e arresto
ordinato, consulta [Proiezione Cron esterna sicura](/it/plugins/hooks#safe-external-cron-projection).

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                         |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                                       |
| `api.name`               | `string`                  | Nome visualizzato                                                                                   |
| `api.version`            | `string?`                 | Versione del Plugin (facoltativa)                                                                   |
| `api.description`        | `string?`                 | Descrizione del Plugin (facoltativa)                                                                |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                        |
| `api.rootDir`            | `string?`                 | Directory radice del Plugin (facoltativa)                                                           |
| `api.config`             | `OpenClawConfig`          | Istantanea attuale della configurazione (istantanea di runtime attiva in memoria, quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper di runtime](/it/plugins/sdk-runtime)                                                           |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento attuale; `"setup-runtime"` è la finestra leggera di avvio/configurazione precedente al caricamento completo del punto di ingresso |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla radice del Plugin                                                 |

## Convenzione per i moduli interni

All'interno del Plugin, usa file barrel locali per le importazioni interne:

```text
my-plugin/
  api.ts            # Esportazioni pubbliche per consumer esterni
  runtime-api.ts    # Esportazioni di runtime esclusivamente interne
  index.ts          # Punto di ingresso del Plugin
  setup-entry.ts    # Punto di ingresso leggero per la sola configurazione (facoltativo)
```

<Warning>
  Non importare mai il tuo Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada le importazioni interne tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso dell'SDK costituisce esclusivamente il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin inclusi caricati tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di ingresso pubblici simili) preferiscono
l'istantanea della configurazione di runtime attiva quando OpenClaw è già in esecuzione. Se non esiste
ancora alcuna istantanea di runtime, ricorrono al file di configurazione risolto sul disco.
Le facade dei Plugin inclusi nel pacchetto devono essere caricate tramite i loader di facade dei Plugin
di OpenClaw; le importazioni dirette da `dist/extensions/...` aggirano i controlli del manifest
e del sidecar di runtime utilizzati dalle installazioni pacchettizzate per il codice di proprietà del Plugin.

I Plugin dei provider possono esporre un barrel di contratto locale e circoscritto al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso generico dell'SDK.
Esempi inclusi:

- **Anthropic**: interfaccia pubblica `api.ts` / `contract-api.ts` per gli helper delle
  intestazioni beta di Claude e del flusso `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta i costruttori dei provider,
  gli helper per il modello predefinito e i costruttori dei provider in tempo reale.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il costruttore del provider
  insieme agli helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle estensioni deve evitare le importazioni
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è realmente condiviso, spostalo in un
  sottopercorso neutrale dell'SDK, come `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` o un'altra superficie orientata alle funzionalità, invece di
  creare un accoppiamento tra due Plugin.
</Warning>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Punti di ingresso" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper di runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo dello spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Configurazione iniziale e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Pacchettizzazione, manifest e schemi di configurazione.
  </Card>
  <Card title="Test" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole di lint.
  </Card>
  <Card title="Migrazione dell'SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Componenti interni del Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello delle funzionalità.
  </Card>
</CardGroup>
