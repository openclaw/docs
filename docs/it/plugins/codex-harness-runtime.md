---
read_when:
    - Hai bisogno del contratto di supporto runtime dell'harness Codex
    - Stai eseguendo il debug di strumenti nativi di Codex, hook, Compaction o caricamento del feedback
    - Stai modificando il comportamento dei plugin nei turni dell'harness OpenClaw e Codex
summary: Limiti di runtime, hook, strumenti, autorizzazioni e diagnostica per l'harness Codex
title: Runtime dell'harness Codex
x-i18n:
    generated_at: "2026-07-04T20:34:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Questa pagina documenta il contratto di runtime per i turni dell'harness Codex. Per configurazione e
routing, inizia da [harness Codex](/it/plugins/codex-harness). Per i campi di configurazione,
vedi [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Panoramica

La modalità Codex non è OpenClaw con una chiamata a un modello diverso sottostante. Codex controlla una parte maggiore
del ciclo del modello nativo, e OpenClaw adatta le sue superfici di plugin, strumenti, sessioni e
diagnostica intorno a quel confine.

OpenClaw controlla ancora il routing dei canali, i file di sessione, la consegna dei messaggi visibili,
gli strumenti dinamici OpenClaw, le approvazioni, la consegna dei media e uno specchio della trascrizione.
Codex controlla il thread nativo canonico, il ciclo del modello nativo, la continuazione degli strumenti nativi
e la compaction nativa.

Il routing del prompt segue il runtime selezionato, non solo la stringa del provider. Un
turno Codex nativo riceve le istruzioni per sviluppatori dell'app-server Codex, mentre una
rotta esplicita di compatibilità OpenClaw mantiene il normale prompt di sistema OpenClaw anche
quando usa autenticazione o trasporto OpenAI in stile Codex.

Codex nativo mantiene le istruzioni base/modello di proprietà di Codex e il comportamento dei documenti di progetto
in base alla configurazione del thread Codex attiva. OpenClaw avvia e riprende i thread Codex nativi
con la personalità integrata di Codex disabilitata, così i file di personalità del workspace
e l'identità dell'agente OpenClaw restano autoritativi. Le esecuzioni leggere di
OpenClaw preservano ancora la loro soppressione esistente dei documenti di progetto. Le istruzioni per sviluppatori di
OpenClaw coprono aspetti del runtime OpenClaw come la consegna al canale sorgente,
gli strumenti dinamici OpenClaw, la delega ACP, il contesto dell'adapter e i
file del profilo del workspace dell'agente attivo. I cataloghi Skills di OpenClaw e i puntatori
`MEMORY.md` instradati tramite strumenti sono proiettati come istruzioni per sviluppatori di collaborazione con ambito di turno
per Codex nativo. Il contenuto attivo di `BOOTSTRAP.md` e l'iniezione di fallback completa di
`MEMORY.md` usano ancora il contesto di riferimento dell'input del turno.

## Associazioni di thread e modifiche del modello

Quando una sessione OpenClaw viene collegata a un thread Codex esistente, il turno successivo
invia di nuovo all'app-server il modello OpenAI, la policy di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene l'associazione del thread ma chiede a Codex di continuare con il
modello appena selezionato.

## Risposte visibili e Heartbeat

Quando un turno di chat diretto/sorgente passa attraverso l'harness Codex, le risposte visibili
usano per impostazione predefinita la consegna automatica finale dell'assistente per le superfici WebChat interne.
Questo mantiene Codex allineato al contratto di prompt dell'harness Pi: gli agenti rispondono
normalmente, e OpenClaw pubblica il testo finale nella conversazione sorgente. Imposta
`messages.visibleReplies: "message_tool"` quando una chat diretta/sorgente deve
mantenere intenzionalmente privato il testo finale dell'assistente, a meno che l'agente non chiami
`message(action="send")`.

I turni Heartbeat Codex ricevono anche `heartbeat_respond` nel catalogo strumenti OpenClaw
ricercabile per impostazione predefinita, così l'agente può registrare se il risveglio deve restare
silenzioso o notificare senza codificare quel flusso di controllo nel testo finale.

La guida all'iniziativa specifica per Heartbeat viene inviata come istruzione per sviluppatori in modalità collaborazione
Codex sul turno Heartbeat stesso. I normali turni di chat ripristinano
la modalità Default di Codex invece di portare la filosofia Heartbeat nel loro normale
prompt di runtime. Quando esiste un `HEARTBEAT.md` non vuoto, le istruzioni in modalità collaborazione
Heartbeat indirizzano Codex al file invece di incorporarne il contenuto.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/plugin tra gli harness OpenClaw e Codex.     |
| Middleware di estensione dell'app-server Codex | Plugin in bundle OpenClaw | Comportamento dell'adapter per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato degli strumenti nativi e dei permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando le approvazioni dell'app-server Codex sono abilitate, cioè `approvalPolicy` non è
`"never"`, la configurazione predefinita degli hook nativi iniettati omette `PermissionRequest`, così
il revisore dell'app-server di Codex e il bridge di approvazione di OpenClaw gestiscono le escalation reali
dopo la revisione. Gli operatori possono aggiungere esplicitamente `permission_request` a
`nativeHookRelay.events` quando hanno bisogno del relay di compatibilità.

Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano
controlli a livello Codex. Non sono esposti come hook dei plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento dei plugin e del middleware che possiede nell'
adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record dello strumento canonico.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex
nativo a meno che Codex non esponga quell'operazione tramite l'app-server o callback di hook
nativi.

Gli eventi `PreToolUse` in modalità report dell'app-server Codex rinviano le richieste di approvazione dei plugin
all'approvazione app-server corrispondente. Se un hook OpenClaw `before_tool_call`
restituisce `requireApproval` mentre il payload nativo imposta la modalità di approvazione report
(`openclaw_approval_mode` è `"report"`), il relay degli hook nativi registra il
requisito di approvazione del plugin e non restituisce alcuna decisione nativa. Quando Codex invia la
richiesta di approvazione dell'app-server per lo stesso uso dello strumento, OpenClaw apre il prompt di approvazione del plugin
e mappa la decisione di nuovo a Codex. Gli eventi Codex `PermissionRequest`
sono un percorso di approvazione separato e possono ancora passare attraverso le approvazioni OpenClaw
quando il runtime è configurato per quel bridge.

Le notifiche degli elementi dell'app-server Codex forniscono anche osservazioni asincrone `after_tool_call`
per completamenti degli strumenti nativi che non sono già coperti dal relay nativo
`PostToolUse`. Queste osservazioni servono solo per telemetria e compatibilità dei plugin;
non possono bloccare, ritardare o modificare la chiamata dello strumento nativo.

Le proiezioni della Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex
e dallo stato dell'adapter OpenClaw, non dai comandi degli hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello di adapter, non acquisizioni byte per byte
delle richieste interne o dei payload di compaction di Codex.

Le notifiche app-server Codex native `hook/started` e `hook/completed` sono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook dei plugin OpenClaw.

## Contratto di supporto V1

Supportato nel runtime Codex v1:

| Ambito                                        | Supporto                                                                         | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo del modello OpenAI tramite Codex         | Supportato                                                                       | Codex app-server possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Routing e consegna dei canali OpenClaw         | Supportati                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Strumenti dinamici OpenClaw                    | Supportati                                                                       | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                                                                                                                                                                                                                                                                                                                           |
| Plugin di prompt e contesto                    | Supportati                                                                       | OpenClaw proietta prompt/contesto specifici di OpenClaw nel turno Codex lasciando i prompt di base, del modello e dei documenti di progetto configurati posseduti da Codex nella corsia nativa di Codex. OpenClaw disabilita la personalità integrata di Codex per i thread nativi, così i file di personalità dell'area di lavoro dell'agente restano autorevoli. Le istruzioni sviluppatore native di Codex accettano solo indicazioni sui comandi esplicitamente limitate a `codex_app_server`; i suggerimenti di comando globali legacy restano per le superfici di prompt non Codex. |
| Ciclo di vita del motore di contesto           | Supportato                                                                       | Assemblaggio, ingestione e manutenzione post-turno vengono eseguiti attorno ai turni Codex. I motori di contesto non sostituiscono la Compaction nativa di Codex.                                                                                                                                                                                                                                                                                                                                                |
| Hook degli strumenti dinamici                  | Supportati                                                                       | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici posseduti da OpenClaw.                                                                                                                                                                                                                                                                                                                                                       |
| Hook del ciclo di vita                         | Supportati come osservazioni dell'adattatore                                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono emessi con payload veritieri in modalità Codex.                                                                                                                                                                                                                                                                                                                                                                           |
| Gate di revisione della risposta finale        | Supportato tramite relay di hook nativi                                          | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                                                                                                                                                                                                                                                                                                                                    |
| Shell, patch e MCP nativi bloccati o osservati | Supportati tramite relay di hook nativi                                          | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi sottoposte a commit, inclusi i payload MCP su Codex app-server `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no.                                                                                                                                                                                                                                                                  |
| Policy dei permessi nativi                     | Supportata tramite approvazioni di Codex app-server e relay di hook nativi di compatibilità | Le richieste di approvazione di Codex app-server passano attraverso OpenClaw dopo la revisione di Codex. Il relay dell'hook nativo `PermissionRequest` è opt-in per le modalità di approvazione native perché Codex lo emette prima della revisione del sistema di protezione.                                                                                                                                                                                                                                      |
| Cattura della traiettoria dell'app-server      | Supportata                                                                       | OpenClaw registra la richiesta inviata all'app-server e le notifiche dell'app-server che riceve.                                                                                                                                                                                                                                                                                                                                                                                                                  |

Non supportato nel runtime Codex v1:

| Ambito                                                | Confine V1                                                                                                                                      | Percorso futuro                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi      | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.                | Richiede supporto Codex per hook/schema per l'input sostitutivo dello strumento.          |
| Cronologia del transcript nativo Codex modificabile   | Codex possiede la cronologia canonica dei thread nativi. OpenClaw possiede un mirror e può proiettare contesto futuro, ma non deve mutare internals non supportati. | Aggiungere API esplicite di Codex app-server se è necessaria chirurgia sui thread nativi. |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma le scritture del transcript possedute da OpenClaw, non i record di strumenti nativi Codex.                                | Potrebbe rispecchiare i record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi della Compaction nativa               | OpenClaw può richiedere la Compaction nativa, ma non riceve un elenco stabile di elementi conservati/scartati, delta di token, riepilogo di completamento o payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                          |
| Intervento sulla Compaction                           | OpenClaw non consente ai plugin o ai motori di contesto di porre veto, riscrivere o sostituire la Compaction nativa di Codex.                  | Aggiungere hook Codex pre/post Compaction se i plugin devono porre veto o riscrivere la Compaction nativa. |
| Cattura byte per byte della richiesta API del modello  | OpenClaw può catturare richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta finale all'API OpenAI.       | Richiede un evento di tracciamento della richiesta modello Codex o un'API di debug.       |

## Permessi nativi ed elicitazioni MCP

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di
consenso o rifiuto quando la policy decide. Un risultato senza decisione non è
un consenso. Codex lo tratta come assenza di decisione dell'hook e prosegue con
il proprio percorso di protezione o di approvazione dell'utente.

Le modalità di approvazione di Codex app-server omettono questo hook nativo per
impostazione predefinita. Questo comportamento si applica quando
`permission_request` è incluso esplicitamente in
`nativeHookRelay.events` o quando un runtime di compatibilità lo installa.

Quando un operatore sceglie `allow-always` per una richiesta di permesso nativa
Codex, OpenClaw ricorda l'esatta impronta provider/sessione/input dello
strumento/cwd per una finestra di sessione limitata. La decisione ricordata è
intenzionalmente solo a corrispondenza esatta: un comando, argomenti, payload
dello strumento o cwd modificati creano una nuova approvazione.

Le elicitazioni di approvazione degli strumenti MCP di Codex vengono instradate
attraverso il flusso di approvazione dei Plugin di OpenClaw quando Codex marca
`_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex
`request_user_input` vengono inviati alla chat di origine, e il messaggio di
follow-up successivo in coda risponde a quella richiesta del server nativo
invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di
elicitazione MCP falliscono in modo conservativo.

Per il flusso generale di approvazione dei Plugin che trasporta questi prompt,
vedi [Richieste di permesso dei Plugin](/it/plugins/plugin-permission-requests).

## Indirizzamento della coda

L'indirizzamento della coda per un'esecuzione attiva si mappa su `turn/steer`
di Codex app-server. Con l'impostazione predefinita
`messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi di chat in
modalità steer per la finestra di quiete configurata e li invia come una singola
richiesta `turn/steer` in ordine di arrivo.

La revisione Codex e i turni di Compaction manuale possono rifiutare l’indirizzamento nello stesso turno. In quel
caso, OpenClaw attende il completamento dell’esecuzione attiva prima di avviare il prompt.
Usa `/queue followup` o `/queue collect` quando i messaggi devono essere accodati per impostazione predefinita
invece di essere indirizzati. Vedi [Coda di indirizzamento](/it/concepts/queue-steering).

## Caricamento del feedback Codex

Quando `/diagnostics [note]` viene approvato per una sessione che usa l’harness Codex
nativo, OpenClaw chiama anche `feedback/upload` dell’app-server Codex per i thread
Codex pertinenti. Il caricamento chiede all’app-server di includere i log per ogni thread elencato
e per i sottothread Codex generati, quando disponibili.

Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI. Se il feedback
Codex è disabilitato in quell’app-server, il comando restituisce l’errore dell’app-server.
La risposta diagnostica completata elenca i canali, gli ID sessione OpenClaw,
gli ID thread Codex e i comandi locali `codex resume <thread-id>` per i thread
che sono stati inviati.

Se neghi o ignori l’approvazione, OpenClaw non stampa quegli ID Codex e
non invia feedback Codex. Il caricamento non sostituisce l’esportazione diagnostica locale del Gateway.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per l’approvazione, la privacy,
il bundle locale e il comportamento nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback
Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway.

## Compaction e mirror della trascrizione

Quando il modello selezionato usa l’harness Codex, la Compaction del thread nativo appartiene
all’app-server Codex. OpenClaw non esegue una Compaction preliminare per i turni Codex,
non sostituisce la Compaction Codex con la Compaction del motore di contesto e non
ripiega sulla riepilogazione OpenClaw o OpenAI pubblica quando la Compaction Codex
nativa non può essere avviata. OpenClaw mantiene un mirror della trascrizione per la cronologia
del canale, la ricerca, `/new`, `/reset` e cambi futuri di modello o harness.

Le richieste esplicite di Compaction, come `/compact` o un’operazione di Compaction manuale
richiesta da un plugin, avviano la Compaction Codex nativa con `thread/compact/start`.
OpenClaw mantiene aperti la richiesta e il lease del client condiviso finché Codex emette
l’elemento di completamento `contextCompaction` corrispondente e quindi segnala il turno di Compaction
come completato. Se quel turno terminale supera il timeout di Compaction configurato,
OpenClaw richiede un’interruzione del turno nativo. Il lease e il fence di Compaction
per thread restano trattenuti finché Codex segnala lo stato terminale o conferma l’RPC di interruzione.
Se Codex non conferma entro il periodo di grazia dell’interruzione, OpenClaw ritira
la connessione prima di rilasciare il fence. Le connessioni remote scollegano anche il binding
del thread corrispondente, così il lavoro successivo non può sovrapporsi a un turno remoto
non confermato. Gli altri turni su una connessione ritirata falliscono e possono riprovare su un nuovo client.
La chiusura del client, l’annullamento della richiesta o un turno di Compaction non riuscito restituisce
un’operazione non riuscita.

Quando un motore di contesto richiede la proiezione di bootstrap del thread Codex, OpenClaw
proietta i nomi e gli ID delle chiamate agli strumenti, le forme di input e il contenuto redatto dei risultati
degli strumenti nel nuovo thread Codex. Non copia i valori grezzi degli argomenti delle chiamate agli strumenti
in quella proiezione.

Il mirror include il prompt dell’utente, il testo finale dell’assistente e i record leggeri di ragionamento
o piano Codex quando l’app-server li emette. OpenClaw registra l’avvio della Compaction
nativa e lo stato terminale, ma non espone un riepilogo di Compaction leggibile da una persona
né un elenco verificabile delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento nella trascrizione di una sessione di proprietà di OpenClaw.

## Media e consegna

OpenClaw continua a possedere la consegna dei media e la selezione del provider media. Immagini,
video, musica, PDF, TTS e comprensione dei media usano impostazioni provider/modello
corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano
attraverso il normale percorso di consegna OpenClaw. La generazione di media non richiede il runtime legacy.
Quando Codex emette un elemento nativo di generazione immagini con un `savedPath`, OpenClaw
inoltra quel file esatto attraverso il normale percorso dei media di risposta anche se il turno Codex
non contiene testo dell’assistente.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell’harness Codex](/it/plugins/codex-harness-reference)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Hook dei Plugin](/it/plugins/hooks)
- [Plugin di harness agente](/it/plugins/sdk-agent-harness)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Esportazione traiettoria](/it/tools/trajectory)
