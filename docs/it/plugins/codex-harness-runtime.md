---
read_when:
    - È necessario il contratto di supporto runtime dell'harness Codex
    - Stai eseguendo il debug degli strumenti nativi di Codex, degli hook, di Compaction o del caricamento del feedback
    - Stai modificando il comportamento dei Plugin nei turni degli harness PI e Codex
summary: Confini di runtime, hook, strumenti, autorizzazioni e diagnostica per l'harness Codex
title: Ambiente di esecuzione dell’harness Codex
x-i18n:
    generated_at: "2026-05-10T19:42:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Questa pagina documenta il contratto di runtime per i turni dell'harness Codex. Per la configurazione e
il routing, inizia da [harness Codex](/it/plugins/codex-harness). Per i campi di configurazione,
vedi [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Panoramica

La modalità Codex non è PI con sotto una chiamata a un modello diverso. Codex possiede una parte maggiore
del loop nativo del modello, e OpenClaw adatta le sue superfici di plugin, strumenti, sessione e
diagnostica intorno a quel confine.

OpenClaw possiede ancora il routing dei canali, i file di sessione, la consegna dei messaggi visibili,
gli strumenti dinamici OpenClaw, le approvazioni, la consegna dei media e un mirror della trascrizione.
Codex possiede il thread nativo canonico, il loop nativo del modello, la continuazione nativa degli strumenti
e la Compaction nativa.

## Associazioni dei thread e modifiche del modello

Quando una sessione OpenClaw è collegata a un thread Codex esistente, il turno successivo
invia di nuovo ad app-server il modello OpenAI attualmente selezionato, la policy di approvazione, la sandbox e il livello
di servizio. Il passaggio da `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene l'associazione del thread ma chiede a Codex di continuare con il
nuovo modello selezionato.

## Risposte visibili e Heartbeat

Quando un turno di chat di origine passa attraverso l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se la distribuzione non ha configurato esplicitamente
`messages.visibleReplies`. L'agente può comunque completare privatamente il suo turno Codex;
pubblica sul canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette nel
percorso legacy di consegna automatica.

Anche i turni Heartbeat di Codex ricevono `heartbeat_respond` nel catalogo degli strumenti OpenClaw
ricercabile per impostazione predefinita, così l'agente può registrare se il risveglio deve restare
silenzioso o notificare senza codificare quel flusso di controllo nel testo finale.

La guida all'iniziativa specifica per Heartbeat viene inviata come istruzione developer in modalità collaborazione
di Codex nel turno Heartbeat stesso. I turni di chat ordinari ripristinano
la modalità Default di Codex invece di portare la filosofia di Heartbeat nel loro normale
prompt di runtime.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario              | Scopo                                                               |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                  | Compatibilità prodotto/plugin tra gli harness PI e Codex.           |
| Middleware di estensione app-server Codex | Plugin in bundle OpenClaw | Comportamento dell'adapter per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                     | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` di progetto o globali di Codex per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando le approvazioni app-server di Codex sono abilitate, cioè `approvalPolicy` non è
`"never"`, la configurazione predefinita degli hook nativi iniettati omette `PermissionRequest` così
il revisore app-server di Codex e il bridge di approvazione di OpenClaw gestiscono le reali
escalation dopo la revisione. Gli operatori possono aggiungere esplicitamente `permission_request` a
`nativeHookRelay.events` quando hanno bisogno del relay di compatibilità.

Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano
controlli a livello Codex. Non sono esposti come hook dei plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha richiesto la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware che possiede nell'adapter
dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può creare un mirror di eventi selezionati, ma non può riscrivere il thread nativo Codex
a meno che Codex non esponga quell'operazione tramite app-server o callback degli hook
nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche app-server di Codex
e dallo stato dell'adapter OpenClaw, non da comandi degli hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello di adapter, non acquisizioni byte per byte
della richiesta interna di Codex o dei payload di Compaction.

Le notifiche app-server native `hook/started` e `hook/completed` di Codex sono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook dei plugin OpenClaw.

## Contratto di supporto V1

Supportato in Codex runtime v1:

| Superficie                                    | Supporto                                                                         | Perché                                                                                                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop del modello OpenAI tramite Codex        | Supportato                                                                       | Codex app-server possiede il turno OpenAI, la ripresa del thread nativo e la continuazione nativa degli strumenti.                                                                                         |
| Routing e consegna dei canali OpenClaw       | Supportato                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                         |
| Strumenti dinamici OpenClaw                  | Supportato                                                                       | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                    |
| Plugin di prompt e contesto                  | Supportato                                                                       | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                      |
| Ciclo di vita del motore di contesto         | Supportato                                                                       | Assemblaggio, ingestione, manutenzione dopo il turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                           |
| Hook degli strumenti dinamici                | Supportato                                                                       | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti girano intorno agli strumenti dinamici di proprietà di OpenClaw.                                                        |
| Hook del ciclo di vita                       | Supportati come osservazioni dell'adapter                                        | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono emessi con payload onesti della modalità Codex.                                                                    |
| Gate di revisione della risposta finale      | Supportato tramite relay degli hook nativi                                       | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                             |
| Blocco o osservazione di shell, patch e MCP nativi | Supportato tramite relay degli hook nativi                                  | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi confermate, inclusi i payload MCP su Codex app-server `0.125.0` o successivo. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativi                   | Supportata tramite approvazioni app-server Codex e relay di compatibilità degli hook nativi | Le richieste di approvazione app-server Codex passano attraverso OpenClaw dopo la revisione di Codex. Il relay dell'hook nativo `PermissionRequest` è opt-in per le modalità di approvazione native perché Codex lo emette prima della revisione guardian. |
| Acquisizione della traiettoria app-server    | Supportata                                                                       | OpenClaw registra la richiesta inviata ad app-server e le notifiche app-server che riceve.                                                                                                                 |

Non supportato in Codex runtime v1:

| Superficie                                          | Confine V1                                                                                                                                     | Percorso futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                    | Richiede supporto hook/schema di Codex per la sostituzione dell'input dello strumento.      |
| Cronologia della trascrizione nativa Codex modificabile | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare contesto futuro, ma non dovrebbe mutare internals non supportati. | Aggiungere API app-server Codex esplicite se è necessaria chirurgia sul thread nativo.      |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma scritture di trascrizione di proprietà di OpenClaw, non record di strumenti nativi Codex.                              | Potrebbe creare un mirror dei record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati avanzati della Compaction nativa           | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve una lista stabile di elementi mantenuti/scartati, token delta o payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                             |
| Intervento sulla Compaction                         | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                          | Aggiungere hook Codex pre/post Compaction se i plugin devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.             | Richiede un evento di tracciamento della richiesta del modello Codex o una API di debug.    |

## Permessi nativi ed elicitazioni MCP

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di allow o deny solo
quando la policy decide. Un risultato senza decisione non è un allow. Codex lo tratta come assenza di
decisione dell'hook e prosegue verso il proprio percorso guardian o di approvazione utente.

Le modalità di approvazione app-server Codex omettono questo hook nativo per impostazione predefinita. Questo comportamento
si applica quando `permission_request` è incluso esplicitamente in
`nativeHookRelay.events` o quando un runtime di compatibilità lo installa.

Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione nativa di Codex,
OpenClaw ricorda l'impronta esatta di provider/sessione/input dello strumento/cwd per una
finestra di sessione limitata. La decisione ricordata è intenzionalmente solo a corrispondenza esatta:
un comando, argomenti, payload dello strumento o cwd modificati creano una nuova
approvazione.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate tramite il flusso di
approvazione dei Plugin di OpenClaw quando Codex imposta `_meta.codex_approval_kind` su
`"mcp_tool_call"`. I prompt `request_user_input` di Codex vengono rimandati alla
chat di origine, e il messaggio di follow-up successivo in coda risponde a quella richiesta nativa
del server invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitazione
MCP falliscono in modo chiuso.

## Indirizzamento della coda

L'indirizzamento della coda durante l'esecuzione attiva si mappa su `turn/steer` dell'app-server di Codex. Con la
modalità predefinita `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda
per la finestra di silenzio configurata e li invia come un'unica richiesta `turn/steer` in
ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate.

I turni di revisione Codex e di Compaction manuale possono rifiutare lo steering nello stesso turno. In quel
caso, OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback.
Vedi [Coda di steering](/it/concepts/queue-steering).

## Caricamento del feedback Codex

Quando `/diagnostics [note]` viene approvato per una sessione che usa l'harness nativo di Codex,
OpenClaw chiama anche `feedback/upload` dell'app-server di Codex per i thread Codex pertinenti.
Il caricamento chiede all'app-server di includere i log per ogni thread elencato
e per i sottothread Codex generati, quando disponibili.

Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI. Se il feedback
Codex è disabilitato in quell'app-server, il comando restituisce l'errore dell'app-server.
La risposta diagnostica completata elenca i canali, gli id sessione OpenClaw,
gli id thread Codex e i comandi locali `codex resume <thread-id>` per i thread
che sono stati inviati.

Se neghi o ignori l'approvazione, OpenClaw non stampa quegli id Codex e
non invia feedback Codex. Il caricamento non sostituisce l'esportazione diagnostica del Gateway
locale. Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il comportamento di
approvazione, privacy, bundle locale e chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback
Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway.

## Compaction e mirror della trascrizione

Quando il modello selezionato usa l'harness Codex, la Compaction nativa del thread viene
delegata all'app-server di Codex. OpenClaw mantiene un mirror della trascrizione per la cronologia
del canale, la ricerca, `/new`, `/reset` e il futuro cambio di modello o harness.

Il mirror include il prompt dell'utente, il testo finale dell'assistente e record leggeri di
ragionamento o piano Codex quando l'app-server li emette. Oggi OpenClaw registra solo
i segnali di avvio e completamento della Compaction nativa. Non espone ancora un
riepilogo della Compaction leggibile da un essere umano o un elenco verificabile di quali voci Codex
ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` al momento non
riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato strumento della trascrizione di sessione di proprietà di OpenClaw.

## Media e consegna

OpenClaw continua a possedere la consegna dei media e la selezione del provider media. Immagini,
video, musica, PDF, TTS e comprensione dei media usano impostazioni provider/modello
corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano
attraverso il normale percorso di consegna di OpenClaw. La generazione di media non richiede PI.
Quando Codex emette un elemento nativo di generazione immagini con un `savedPath`, OpenClaw
inoltra quel file esatto tramite il normale percorso di risposta-media anche se il turno Codex
non ha testo dell'assistente.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento harness Codex](/it/plugins/codex-harness-reference)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Hook dei Plugin](/it/plugins/hooks)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Esportazione traiettoria](/it/tools/trajectory)
