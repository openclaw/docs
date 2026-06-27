---
read_when:
    - È necessario il contratto di supporto del runtime dell'harness Codex
    - Stai eseguendo il debug di strumenti Codex nativi, hook, compaction o caricamento del feedback
    - Stai modificando il comportamento dei Plugin nei turni di OpenClaw e dell'harness Codex
summary: Confini di runtime, hook, strumenti, autorizzazioni e diagnostica per l'harness Codex
title: Runtime dell'harness Codex
x-i18n:
    generated_at: "2026-06-27T17:48:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Questa pagina documenta il contratto di runtime per i turni dell'harness Codex. Per la configurazione e
il routing, inizia con [harness Codex](/it/plugins/codex-harness). Per i campi di configurazione,
vedi [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Panoramica

La modalità Codex non è OpenClaw con sotto una diversa chiamata al modello. Codex possiede una parte maggiore
del loop nativo del modello, e OpenClaw adatta le proprie superfici di Plugin, strumenti, sessione e
diagnostica attorno a quel confine.

OpenClaw possiede ancora il routing dei canali, i file di sessione, la consegna dei messaggi visibili,
gli strumenti dinamici OpenClaw, le approvazioni, la consegna dei media e un mirror della trascrizione.
Codex possiede il thread nativo canonico, il loop nativo del modello, la continuazione nativa degli strumenti
e la Compaction nativa.

Il routing dei prompt segue il runtime selezionato, non solo la stringa del provider. Un
turno Codex nativo riceve le istruzioni per sviluppatori dell'app-server Codex, mentre una
route esplicita di compatibilità OpenClaw mantiene il normale prompt di sistema OpenClaw anche
quando usa autenticazione o trasporto OpenAI in stile Codex.

Codex nativo mantiene le istruzioni base/modello di proprietà di Codex e il comportamento dei documenti di progetto
secondo la configurazione attiva del thread Codex. OpenClaw avvia e riprende i thread
Codex nativi con la personalità integrata di Codex disabilitata, in modo che i file di personalità
dello workspace e l'identità dell'agente OpenClaw restino autorevoli. Le esecuzioni leggere
di OpenClaw preservano comunque la soppressione esistente dei documenti di progetto. Le istruzioni per sviluppatori
OpenClaw coprono aspetti del runtime OpenClaw come la consegna del canale sorgente,
gli strumenti dinamici OpenClaw, la delega ACP, il contesto dell'adapter e i
file del profilo workspace dell'agente attivo. I cataloghi Skills di OpenClaw e i puntatori
`MEMORY.md` instradati tramite strumenti vengono proiettati come istruzioni per sviluppatori di collaborazione
con ambito di turno per Codex nativo. Il contenuto attivo di `BOOTSTRAP.md` e l'iniezione di fallback completa
di `MEMORY.md` continuano a usare il contesto di riferimento dell'input del turno.

## Binding dei thread e modifiche del modello

Quando una sessione OpenClaw è collegata a un thread Codex esistente, il turno successivo
invia di nuovo all'app-server il modello OpenAI, la policy di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene il binding del thread ma chiede a Codex di continuare con il
modello appena selezionato.

## Risposte visibili e Heartbeat

Quando un turno di chat diretto/sorgente passa attraverso l'harness Codex, le risposte visibili
usano per impostazione predefinita la consegna automatica dell'assistente finale per le superfici WebChat interne.
Questo mantiene Codex allineato al contratto di prompt dell'harness Pi: gli agenti rispondono
normalmente e OpenClaw pubblica il testo finale nella conversazione sorgente. Imposta
`messages.visibleReplies: "message_tool"` quando una chat diretta/sorgente deve
mantenere intenzionalmente privato il testo finale dell'assistente a meno che l'agente chiami
`message(action="send")`.

Anche i turni Heartbeat di Codex ricevono `heartbeat_respond` nel catalogo strumenti OpenClaw
ricercabile per impostazione predefinita, così l'agente può registrare se il risveglio deve restare
silenzioso o notificare senza codificare quel flusso di controllo nel testo finale.

La guida all'iniziativa specifica per Heartbeat viene inviata come istruzione per sviluppatori in modalità collaborazione
Codex nel turno Heartbeat stesso. I normali turni di chat ripristinano
la modalità Default di Codex invece di portare la filosofia Heartbeat nel loro normale
prompt di runtime. Quando esiste un `HEARTBEAT.md` non vuoto, le istruzioni
in modalità collaborazione Heartbeat indirizzano Codex al file invece di includerne inline i
contenuti.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario            | Scopo                                                               |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                | Compatibilità prodotto/Plugin tra gli harness OpenClaw e Codex.     |
| Middleware di estensione app-server Codex | Plugin in bundle OpenClaw | Comportamento dell'adapter per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                   | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` di progetto o globali Codex per instradare
il comportamento dei Plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando le approvazioni dell'app-server Codex sono abilitate, cioè `approvalPolicy` non è
`"never"`, la configurazione hook nativa iniettata predefinita omette `PermissionRequest` così
il revisore dell'app-server Codex e il bridge di approvazione di OpenClaw gestiscono le
escalation reali dopo la revisione. Gli operatori possono aggiungere esplicitamente `permission_request` a
`nativeHookRelay.events` quando hanno bisogno del relay di compatibilità.

Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano
controlli a livello Codex. Non sono esposti come hook Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento Plugin e middleware che possiede nell'
adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può riflettere eventi selezionati, ma non può riscrivere il thread Codex
nativo a meno che Codex esponga quell'operazione tramite app-server o callback degli hook
nativi.

Gli eventi `PreToolUse` in modalità report dell'app-server Codex rinviano le richieste di approvazione Plugin
all'approvazione app-server corrispondente. Se un hook OpenClaw `before_tool_call`
restituisce `requireApproval` mentre il payload nativo imposta la modalità di approvazione report
(`openclaw_approval_mode` è `"report"`), il relay degli hook nativi registra il
requisito di approvazione Plugin e non restituisce alcuna decisione nativa. Quando Codex invia la
richiesta di approvazione app-server per lo stesso uso dello strumento, OpenClaw apre il prompt di
approvazione Plugin e mappa la decisione di nuovo su Codex. Gli eventi Codex `PermissionRequest`
sono un percorso di approvazione separato e possono comunque passare attraverso le approvazioni OpenClaw
quando il runtime è configurato per quel bridge.

Le notifiche degli elementi dell'app-server Codex forniscono anche osservazioni asincrone `after_tool_call`
per completamenti di strumenti nativi che non sono già coperti dal relay
nativo `PostToolUse`. Queste osservazioni servono solo per telemetria e compatibilità
Plugin; non possono bloccare, ritardare o mutare la chiamata nativa dello strumento.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex
e dallo stato dell'adapter OpenClaw, non dai comandi degli hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adapter, non acquisizioni byte per byte
della richiesta interna o dei payload di Compaction di Codex.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook Plugin OpenClaw.

## Contratto di supporto V1

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                                                         | Perché                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ciclo del modello OpenAI tramite Codex        | Supportato                                                                       | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                                                                                                                                                                                                                                                                                                       |
| Routing e consegna dei canali OpenClaw        | Supportato                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                                                                                                                                                                                                                                                                                                         |
| Strumenti dinamici OpenClaw                   | Supportato                                                                       | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                                                                                                                                                                                                                                                                                                     |
| Plugin di prompt e contesto                   | Supportato                                                                       | OpenClaw proietta prompt/contesto specifici di OpenClaw nel turno Codex lasciando i prompt di base, del modello e dei documenti di progetto configurati di proprietà di Codex nel percorso nativo Codex. OpenClaw disabilita la personalità integrata di Codex per i thread nativi, così i file di personalità dell'area di lavoro dell'agente restano autorevoli. Le istruzioni sviluppatore native di Codex accettano solo indicazioni di comando esplicitamente limitate a `codex_app_server`; i suggerimenti di comando globali legacy restano per le superfici di prompt non Codex. |
| Ciclo di vita del motore di contesto          | Supportato                                                                       | Assemblaggio, ingestione e manutenzione post-turno vengono eseguiti attorno ai turni Codex. I motori di contesto non sostituiscono la compattazione nativa di Codex.                                                                                                                                                                                                                                                                                                                       |
| Hook degli strumenti dinamici                 | Supportato                                                                       | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici di proprietà di OpenClaw.                                                                                                                                                                                                                                                                                                                              |
| Hook del ciclo di vita                        | Supportato come osservazioni dell'adattatore                                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono emessi con payload sinceri in modalità Codex.                                                                                                                                                                                                                                                                                                                                                       |
| Gate di revisione della risposta finale       | Supportato tramite inoltro di hook nativi                                        | `Stop` di Codex viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un altro passaggio del modello prima della finalizzazione.                                                                                                                                                                                                                                                                                                                                                |
| Shell, patch e MCP nativi: blocco o osservazione | Supportato tramite inoltro di hook nativi                                     | `PreToolUse` e `PostToolUse` di Codex vengono inoltrati per le superfici di strumenti nativi impegnate, inclusi i payload MCP su app-server Codex `0.125.0` o successivo. Il blocco è supportato; la riscrittura degli argomenti no.                                                                                                                                                                                                                                                        |
| Policy di autorizzazione nativa               | Supportata tramite approvazioni dell'app-server Codex e inoltro compatibile di hook nativi | Le richieste di approvazione dell'app-server Codex passano tramite OpenClaw dopo la revisione Codex. L'inoltro dell'hook nativo `PermissionRequest` è opt-in per le modalità di approvazione native perché Codex lo emette prima della revisione guardian.                                                                                                                                                                                                                                   |
| Acquisizione della traiettoria dell'app-server | Supportata                                                                      | OpenClaw registra la richiesta inviata all'app-server e le notifiche dell'app-server che riceve.                                                                                                                                                                                                                                                                                                                                                                                            |

Non supportato nel runtime Codex v1:

| Superficie                                           | Confine V1                                                                                                                                      | Percorso futuro                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi     | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                   | Richiede supporto Codex di hook/schema per sostituire l'input dello strumento.           |
| Cronologia della trascrizione nativa Codex modificabile | Codex possiede la cronologia canonica dei thread nativi. OpenClaw possiede una copia e può proiettare contesto futuro, ma non dovrebbe mutare internals non supportati. | Aggiungere API esplicite dell'app-server Codex se serve intervenire sui thread nativi.   |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma le scritture di trascrizione di proprietà di OpenClaw, non i record di strumenti nativi Codex.                          | Potrebbe rispecchiare record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi di compattazione nativa              | OpenClaw può richiedere la compattazione nativa, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta di token, riepilogo di completamento o payload di riepilogo. | Servono eventi di compattazione Codex più ricchi.                                        |
| Intervento sulla Compaction                          | OpenClaw non consente a Plugin o motori di contesto di porre veto, riscrivere o sostituire la compattazione nativa Codex.                       | Aggiungere hook Codex pre/post compattazione se i Plugin devono porre veto o riscrivere la compattazione nativa. |
| Acquisizione byte-per-byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta finale all'API OpenAI.       | Serve un evento di tracciamento della richiesta del modello Codex o un'API di debug.     |

## Autorizzazioni native ed elicitazioni MCP

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di consenso o rifiuto
quando la policy decide. Un risultato senza decisione non è un consenso. Codex lo tratta come assenza di
decisione dell'hook e passa al proprio percorso guardian o di approvazione utente.

Le modalità di approvazione dell'app-server Codex omettono questo hook nativo per impostazione predefinita. Questo comportamento
si applica quando `permission_request` è incluso esplicitamente in
`nativeHookRelay.events` o quando un runtime di compatibilità lo installa.

Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione nativa Codex,
OpenClaw ricorda l'esatta impronta provider/sessione/input dello strumento/cwd per una
finestra di sessione limitata. La decisione ricordata è intenzionalmente a corrispondenza esatta
solo: un comando, argomenti, payload dello strumento o cwd modificati creano una nuova
approvazione.

Le elicitazioni di approvazione degli strumenti MCP di Codex vengono instradate tramite il flusso di
approvazione Plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt `request_user_input` di Codex vengono rimandati alla chat
di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta del server
nativo invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitazione MCP
falliscono in modo chiuso.

Per il flusso generale di approvazione Plugin che trasporta questi prompt, vedere
[Richieste di autorizzazione Plugin](/it/plugins/plugin-permission-requests).

## Instradamento della coda

L'instradamento della coda durante un'esecuzione attiva si mappa su `turn/steer` dell'app-server Codex. Con la
modalità predefinita `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi di chat in modalità steer
per la finestra di quiete configurata e li invia come una singola richiesta `turn/steer`
nell'ordine di arrivo.

I turni di revisione Codex e di Compaction manuale possono rifiutare l'indirizzamento nello stesso turno. In quel
caso, OpenClaw attende che l'esecuzione attiva termini prima di avviare il prompt.
Usa `/queue followup` o `/queue collect` quando i messaggi devono essere accodati per impostazione predefinita
invece di indirizzare. Vedi [Coda di indirizzamento](/it/concepts/queue-steering).

## Caricamento del feedback Codex

Quando `/diagnostics [note]` viene approvato per una sessione che usa l'harness Codex
nativo, OpenClaw chiama anche `feedback/upload` dell'app-server Codex per i thread
Codex pertinenti. Il caricamento chiede all'app-server di includere i log per ogni thread
elencato e per i sottothread Codex generati, quando disponibili.

Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI. Se il
feedback Codex è disabilitato in quell'app-server, il comando restituisce l'errore
dell'app-server. La risposta diagnostica completata elenca i canali, gli ID delle sessioni OpenClaw,
gli ID dei thread Codex e i comandi locali `codex resume <thread-id>` per i thread
che sono stati inviati.

Se neghi o ignori l'approvazione, OpenClaw non stampa quegli ID Codex e
non invia feedback Codex. Il caricamento non sostituisce l'esportazione diagnostica locale del Gateway.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il comportamento di
approvazione, privacy, pacchetto locale e chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il pacchetto diagnostico Gateway
completo.

## Compaction e mirror della trascrizione

Quando il modello selezionato usa l'harness Codex, la Compaction nativa del thread appartiene
all'app-server Codex. OpenClaw non esegue la Compaction preflight per i turni Codex,
non sostituisce la Compaction Codex con la Compaction del motore di contesto e non
ripiega sulla riepilogazione OpenClaw o pubblica di OpenAI quando non è possibile avviare la
Compaction Codex nativa. OpenClaw mantiene un mirror della trascrizione per la cronologia
dei canali, la ricerca, `/new`, `/reset` e il futuro cambio di modello o harness.

Le richieste esplicite di Compaction, come `/compact` o un'operazione di Compaction manuale
richiesta da un Plugin, avviano la Compaction Codex nativa con `thread/compact/start`.
OpenClaw ritorna dopo aver avviato quell'operazione nativa. Non attende il
completamento, non impone un timeout OpenClaw separato, non riavvia l'app-server Codex
condiviso e non registra l'operazione come Compaction completata da OpenClaw.

Quando un motore di contesto richiede la proiezione di bootstrap del thread Codex, OpenClaw
proietta i nomi e gli ID delle chiamate agli strumenti, le forme di input e il contenuto oscurato
dei risultati degli strumenti nel nuovo thread Codex. Non copia i valori grezzi degli argomenti
delle chiamate agli strumenti in quella proiezione.

Il mirror include il prompt dell'utente, il testo finale dell'assistente e i record leggeri di
ragionamento o piano Codex quando l'app-server li emette. Oggi, OpenClaw registra solo
i segnali espliciti di avvio della Compaction nativa quando richiede la Compaction. Non
espone un riepilogo della Compaction leggibile da una persona né un elenco verificabile
delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento della trascrizione di una sessione di proprietà di OpenClaw.

## Media e recapito

OpenClaw continua a possedere il recapito dei media e la selezione del provider di media. Immagini,
video, musica, PDF, TTS e comprensione dei media usano impostazioni provider/modello
corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano
attraverso il normale percorso di recapito OpenClaw. La generazione di media non richiede il runtime legacy.
Quando Codex emette un elemento nativo di generazione immagini con un `savedPath`, OpenClaw
inoltra quel file esatto attraverso il normale percorso dei media di risposta anche se il turno Codex
non contiene testo dell'assistente.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Hook dei Plugin](/it/plugins/hooks)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Esportazione della traiettoria](/it/tools/trajectory)
