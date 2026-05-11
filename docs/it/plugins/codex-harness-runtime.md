---
read_when:
    - È necessario il contratto di supporto runtime dell'harness Codex
    - Stai eseguendo il debug di strumenti nativi di Codex, hook, Compaction o caricamento del feedback
    - Stai modificando il comportamento dei Plugin nei turni di Pi e dell'harness Codex
summary: Confini di runtime, hook, strumenti, autorizzazioni e diagnostica per l'harness Codex
title: Runtime dell'harness Codex
x-i18n:
    generated_at: "2026-05-11T20:32:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Questa pagina documenta il contratto di runtime per i turni dell'harness Codex. Per la configurazione e
il routing, inizia da [harness Codex](/it/plugins/codex-harness). Per i campi di configurazione,
vedi [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Panoramica

La modalità Codex non è PI con sotto una chiamata a un modello diverso. Codex possiede una parte maggiore
del ciclo nativo del modello, e OpenClaw adatta le sue superfici di plugin, strumenti, sessione e
diagnostica intorno a quel confine.

OpenClaw possiede ancora il routing dei canali, i file di sessione, la consegna dei messaggi visibili,
gli strumenti dinamici OpenClaw, le approvazioni, la consegna dei media e un mirror della trascrizione.
Codex possiede il thread nativo canonico, il ciclo nativo del modello, la continuazione nativa degli strumenti
e la Compaction nativa.

## Binding dei thread e cambi di modello

Quando una sessione OpenClaw è collegata a un thread Codex esistente, il turno successivo
invia di nuovo ad app-server il modello OpenAI attualmente selezionato, la policy di approvazione, la sandbox e il livello di servizio.
Il passaggio da `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene il binding del thread ma chiede a Codex di continuare con il
modello appena selezionato.

## Risposte visibili e Heartbeat

Quando un turno di chat sorgente passa attraverso l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento OpenClaw `message` se il deployment non ha configurato esplicitamente
`messages.visibleReplies`. L'agente può comunque terminare privatamente il proprio turno Codex;
pubblica sul canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali della chat diretta nel
percorso di consegna automatico legacy.

Anche i turni Heartbeat Codex ricevono per impostazione predefinita `heartbeat_respond` nel catalogo
ricercabile degli strumenti OpenClaw, così l'agente può registrare se il risveglio deve rimanere
silenzioso o notificare senza codificare quel flusso di controllo nel testo finale.

La guida di iniziativa specifica per Heartbeat viene inviata come istruzione sviluppatore in modalità collaborazione Codex
nel turno Heartbeat stesso. I turni di chat ordinari ripristinano invece la modalità Codex Default
anziché portare la filosofia Heartbeat nel normale prompt di runtime.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin bundled OpenClaw | Comportamento adattatore per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando le approvazioni app-server Codex sono abilitate, cioè `approvalPolicy` non è
`"never"`, la configurazione hook nativa iniettata predefinita omette `PermissionRequest` così
il revisore app-server di Codex e il bridge di approvazione di OpenClaw gestiscono le escalation reali
dopo la revisione. Gli operatori possono aggiungere esplicitamente `permission_request` a
`nativeHookRelay.events` quando hanno bisogno del relay di compatibilità.

Altri hook Codex come `SessionStart` e `UserPromptSubmit` rimangono
controlli a livello Codex. Non sono esposti come hook di plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha richiesto la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware che possiede
nell'adattatore dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può fare il mirror di eventi selezionati, ma non può riscrivere il thread Codex nativo
a meno che Codex esponga tale operazione tramite app-server o callback di hook nativi.

Le notifiche degli elementi app-server Codex forniscono anche osservazioni asincrone `after_tool_call`
per i completamenti di strumenti nativi che non sono già coperti dal relay nativo
`PostToolUse`. Queste osservazioni sono solo per telemetria e compatibilità dei plugin;
non possono bloccare, ritardare o mutare la chiamata dello strumento nativo.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche app-server Codex
e dallo stato dell'adattatore OpenClaw, non da comandi hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adattatore, non acquisizioni byte per byte
delle richieste interne o dei payload di Compaction di Codex.

Le notifiche app-server Codex native `hook/started` e `hook/completed` sono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook di plugin OpenClaw.

## Contratto di supporto V1

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                                                         | Perché                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo del modello OpenAI tramite Codex        | Supportato                                                                       | Codex app-server possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                         |
| Routing e consegna dei canali OpenClaw        | Supportato                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                         |
| Strumenti dinamici OpenClaw                   | Supportato                                                                       | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw rimane nel percorso di esecuzione.                                                                                                    |
| Plugin di prompt e contesto                   | Supportato                                                                       | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                       |
| Ciclo di vita del motore di contesto          | Supportato                                                                       | Assemblaggio, ingestione, manutenzione dopo il turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                           |
| Hook degli strumenti dinamici                 | Supportato                                                                       | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti intorno agli strumenti dinamici posseduti da OpenClaw.                                                |
| Hook del ciclo di vita                        | Supportati come osservazioni dell'adattatore                                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` si attivano con payload onesti in modalità Codex.                                                                         |
| Gate di revisione della risposta finale       | Supportato tramite relay hook nativo                                             | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un altro passaggio del modello prima della finalizzazione.                                                                 |
| Shell, patch e MCP nativi: blocco o osservazione | Supportato tramite relay hook nativo                                          | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici di strumenti nativi impegnate, inclusi i payload MCP su Codex app-server `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativi                    | Supportata tramite approvazioni app-server Codex e relay hook nativo di compatibilità | Le richieste di approvazione app-server Codex passano attraverso OpenClaw dopo la revisione Codex. Il relay hook nativo `PermissionRequest` è opt-in per le modalità di approvazione native perché Codex lo emette prima della revisione guardian. |
| Acquisizione della traiettoria app-server     | Supportata                                                                       | OpenClaw registra la richiesta inviata ad app-server e le notifiche app-server ricevute.                                                                                                                    |

Non supportato nel runtime Codex v1:

| Superficie                                          | Confine V1                                                                                                                                      | Percorso futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                      | Richiede supporto hook/schema Codex per input strumento sostitutivo.                       |
| Cronologia modificabile della trascrizione nativa Codex | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare contesto futuro, ma non dovrebbe mutare interni non supportati. | Aggiungere API app-server Codex esplicite se è necessaria chirurgia sul thread nativo.     |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma scritture della trascrizione possedute da OpenClaw, non record di strumenti nativi Codex.                                  | Potrebbe fare il mirror dei record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi della Compaction nativa             | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve un elenco stabile conservati/scartati, un delta dei token o un payload di riepilogo. | Servono eventi di Compaction Codex più ricchi.                                             |
| Intervento sulla Compaction                         | Gli hook di Compaction OpenClaw correnti sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post Compaction se i plugin devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.                | Serve un evento di tracing della richiesta modello Codex o un'API di debug.                |

## Permessi nativi ed elicitazioni MCP

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di autorizzazione o rifiuto
quando la policy decide. Un risultato senza decisione non è un'autorizzazione. Codex lo tratta come assenza di
decisione dell'hook e prosegue verso il proprio percorso guardian o di approvazione utente.

Le modalità di approvazione di Codex app-server omettono questo hook nativo per impostazione predefinita. Questo comportamento
si applica quando `permission_request` è incluso esplicitamente in
`nativeHookRelay.events` o quando un runtime di compatibilità lo installa.

Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione nativa di Codex,
OpenClaw ricorda l'impronta digitale esatta di provider/sessione/input dello strumento/cwd per una
finestra di sessione limitata. La decisione ricordata è intenzionalmente solo a
corrispondenza esatta: un comando, argomenti, payload dello strumento o cwd modificati creano una nuova
approvazione.

Le elicitazioni di approvazione degli strumenti MCP di Codex vengono instradate tramite il flusso di
approvazione Plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla
chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta del server
nativo invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitazione MCP
falliscono in modo chiuso.

## Instradamento della coda

L'instradamento della coda durante l'esecuzione attiva si mappa su `turn/steer` di Codex app-server. Con la
modalità predefinita `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda
per la finestra di quiete configurata e li invia come una singola richiesta `turn/steer` in
ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate.

I turni di revisione Codex e Compaction manuale possono rifiutare l'instradamento nello stesso turno. In tal
caso, OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback.
Vedi [Coda di instradamento](/it/concepts/queue-steering).

## Caricamento del feedback Codex

Quando `/diagnostics [note]` viene approvato per una sessione che usa l'harness Codex nativo,
OpenClaw chiama anche `feedback/upload` di Codex app-server per i thread Codex
pertinenti. Il caricamento chiede ad app-server di includere i log per ogni thread elencato
e per i sottothread Codex generati quando disponibili.

Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI. Se il feedback
Codex è disabilitato in quell'app-server, il comando restituisce l'errore di app-server.
La risposta di diagnostica completata elenca i canali, gli ID sessione OpenClaw,
gli ID thread Codex e i comandi locali `codex resume <thread-id>` per i thread
che sono stati inviati.

Se neghi o ignori l'approvazione, OpenClaw non stampa quegli ID Codex e
non invia feedback Codex. Il caricamento non sostituisce l'esportazione diagnostica locale del Gateway.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per l'approvazione, la privacy, il bundle locale
e il comportamento nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway.

## Compaction e mirror della trascrizione

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene
delegata a Codex app-server. OpenClaw mantiene un mirror della trascrizione per la cronologia del canale,
la ricerca, `/new`, `/reset` e il cambio futuro di modello o harness.

Il mirror include il prompt dell'utente, il testo finale dell'assistente e record leggeri di
ragionamento o piano di Codex quando app-server li emette. Oggi, OpenClaw registra solo
i segnali nativi di avvio e completamento della Compaction. Non espone ancora un
riepilogo della Compaction leggibile da una persona né un elenco verificabile delle voci che Codex
ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento nella trascrizione di sessione di proprietà di OpenClaw.

## Media e consegna

OpenClaw continua a possedere la consegna dei media e la selezione del provider media. Immagini,
video, musica, PDF, TTS e comprensione dei media usano impostazioni provider/modello
corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano
attraverso il normale percorso di consegna OpenClaw. La generazione di media non richiede PI.
Quando Codex emette un elemento nativo di generazione immagini con un `savedPath`, OpenClaw
inoltra quel file esatto tramite il normale percorso di risposta con media anche se il turno Codex
non contiene testo dell'assistente.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Hook Plugin](/it/plugins/hooks)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Esportazione traiettoria](/it/tools/trajectory)
