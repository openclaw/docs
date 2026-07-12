---
read_when:
    - Ti serve il contratto di supporto del runtime dell'harness Codex
    - Stai eseguendo il debug degli strumenti nativi di Codex, degli hook, della Compaction o del caricamento dei feedback
    - Stai modificando il comportamento del Plugin nei turni dell'harness di OpenClaw e Codex
summary: Limiti del runtime, hook, strumenti, autorizzazioni e diagnostica per l'harness Codex
title: Runtime dell'harness Codex
x-i18n:
    generated_at: "2026-07-12T07:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contratto di runtime per i turni dell'harness Codex. Per la configurazione e l'instradamento, consulta
[Harness Codex](/it/plugins/codex-harness). Per i campi di configurazione, consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Panoramica

Codex gestisce il ciclo nativo del modello, la ripresa nativa dei thread, la
continuazione nativa degli strumenti e la Compaction nativa. OpenClaw gestisce
l'instradamento dei canali, i file di sessione, la consegna visibile dei messaggi,
gli strumenti dinamici di OpenClaw, le approvazioni, la consegna dei contenuti
multimediali e una copia speculare della trascrizione attorno a tale confine.

L'instradamento dei prompt segue il runtime selezionato, non soltanto la stringa
del provider. Un turno Codex nativo riceve le istruzioni per sviluppatori
dell'app-server Codex; una route di compatibilità OpenClaw esplicita mantiene il
normale prompt di sistema OpenClaw anche quando utilizza un'autenticazione o un
trasporto OpenAI in stile Codex.

OpenClaw avvia e riprende i thread Codex nativi con la personalità integrata di
Codex disabilitata (`personality: "none"`), affinché i file della personalità
dell'area di lavoro e l'identità dell'agente OpenClaw rimangano autorevoli. Per
il resto, Codex nativo mantiene le istruzioni di base e del modello gestite da
Codex, nonché il caricamento della documentazione del progetto. Le esecuzioni
leggere di OpenClaw (ad esempio cron) continuano a impedire il caricamento della
documentazione del progetto.

Le istruzioni per sviluppatori di OpenClaw riguardano gli aspetti del runtime
OpenClaw: consegna al canale di origine, strumenti dinamici di OpenClaw, delega
ACP, contesto dell'adattatore e file di profilo attivi dell'area di lavoro
dell'agente. I cataloghi delle Skills e i riferimenti a `MEMORY.md` instradati
tramite strumenti vengono proiettati come istruzioni per sviluppatori di
collaborazione limitate al turno. Quando gli strumenti di memoria non sono
disponibili, il contenuto attivo di `BOOTSTRAP.md` e l'intero `MEMORY.md`
vengono invece forniti come normale contesto di input del turno.

La maggior parte degli strumenti dinamici di OpenClaw utilizza lo spazio dei
nomi ricercabile `openclaw`. Gli strumenti contrassegnati con
`catalogMode: "direct-only"` utilizzano `openclaw_direct`, che Codex mantiene
direttamente visibile al modello come `DirectModelOnly`, anziché esporlo
all'esecuzione annidata in modalità codice.

## Associazioni dei thread e modifiche del modello

Quando una sessione OpenClaw è collegata a un thread Codex esistente, il turno
successivo invia nuovamente all'app-server il modello attualmente selezionato,
la politica di approvazione, la sandbox, il revisore delle approvazioni e il
livello di servizio. Il passaggio da `openai/gpt-5.5` a `openai/gpt-5.2`
mantiene l'associazione del thread, ma chiede a Codex di continuare con il nuovo
modello selezionato.

Le associazioni supervisionate costituiscono l'eccezione. Il selettore del
modello di OpenClaw rimane bloccato e le riprese omettono le sostituzioni di
modello e provider, affinché Codex ripristini il modello e il provider persistenti
del thread canonico. Un controllo Codex nativo separato può modificare questa
coppia persistente e lo snapshot iniziale può generare il normale avviso di
Codex relativo alla differenza di modello; il modello OpenClaw esterno e la
catena di ripiego non sostituiscono mai nessuno dei due.

## Supervisione e continuazione sicura

La supervisione Codex è una funzionalità facoltativa dello stesso Plugin
`codex`. Rileva i thread nativi tramite una connessione separata e proietta nel
catalogo del Gateway soltanto le sessioni non archiviate. In assenza di
impostazioni di connessione `appServer` esplicite, tale connessione utilizza
stdio gestito nella directory home dell'utente, mentre l'harness ordinario
rimane circoscritto all'agente. L'elenco e le letture dei metadati sono passivi:
non riprendono un thread, non iscrivono OpenClaw ai suoi eventi in tempo reale e
non rispondono alle sue richieste di approvazione.

Per una sessione memorizzata o inattiva sul computer del Gateway, **Continua come ramo**
crea una normale chat con modello bloccato e replica una cronologia limitata di
utente e assistente fino all'ultimo turno terminale persistente dell'origine.
Il primo turno della chat normale installa i gestori di approvazione effettivi e
utilizza un fork nativo temporaneo per fissare lo snapshot senza sostituire il
modello o il provider. Codex App Server utilizza la configurazione nativa
corrente e restituisce la coppia selezionata; genera il normale avviso se tale
modello differisce dall'ultimo modello registrato dell'origine. Sulla stessa
connessione di supervisione, OpenClaw avvia il thread canonico dell'harness
Codex con origine `appServer`, nella relativa directory di lavoro e con la
relativa politica di runtime, usando esattamente il modello e il provider
restituiti per tale avvio iniziale, inserisce la cronologia visibile limitata e
archivia il fork temporaneo. L'origine non viene mai ripresa. Il thread canonico
dispone dell'intera superficie degli strumenti dell'harness OpenClaw; il
ragionamento, le chiamate agli strumenti e i relativi risultati dell'origine non
vengono clonati al suo interno. L'ambito della connessione privata permane negli
stati di associazione in sospeso e confermati, quindi ogni turno successivo
rimane su tale connessione con l'autenticazione nativa e la configurazione del
provider. La supervisione disabilitata o la divergenza dell'associazione o della
connessione provocano un arresto sicuro anziché il passaggio al normale harness
nella home dell'agente.

L'origine CLI o VS Code originale rimane idonea per entrambi i cataloghi. Il
ramo canonico è un thread Codex nativo, ma il tipo della sua origine è
`appServer`; i client nativi possono filtrare tale tipo di origine, pertanto la
sua visualizzazione in Codex Desktop non è garantita.

Le origini attive non possono avviare un nuovo ramo né essere archiviate; una
chat supervisionata esistente può comunque essere aperta. `notLoaded` indica
che l'attività è sconosciuta, non che la sessione è inattiva; OpenClaw consente
l'archiviazione di una riga locale `idle` o `notLoaded` soltanto dopo una
conferma esplicita dell'assenza di altri processi esecutori e una nuova lettura
dello stato locale al processo. Codex serializza le modifiche ai thread
all'interno di un singolo processo App Server, ma non fornisce un lease
esclusivo tra processi per l'esecutore o il titolare delle approvazioni, pertanto
tale lettura non può dimostrare che un altro processo non stia utilizzando il
thread. OpenClaw blocca un titolare noto dell'associazione attiva per la
destinazione esatta o per qualsiasi discendente generato non archiviato
restituito dalla query paginata dei discendenti di Codex. Gli errori di
enumerazione, i cicli e l'esaurimento del limite di sicurezza provocano un
arresto sicuro. L'archiviazione nativa può comunque entrare in conflitto con un
nuovo turno in un altro processo, quindi la conferma copre i client sconosciuti
e l'intervallo tra la lettura dello stato e l'archiviazione. Una chat
supervisionata con modello bloccato non può essere eliminata mentre protegge
l'associazione nativa.

Nella versione iniziale, i cataloghi dei nodi associati rimangono limitati ai
metadati. L'attuale confine di invocazione del Node è di tipo
richiesta/risposta e non può trasportare gli eventi di turno a lunga durata, le
richieste di approvazione o l'output in streaming necessari per una vera
associazione dell'harness Codex. Le operazioni remote **Continua** e
**Archivia** rimangono pertanto non disponibili anche quando la riga è inattiva.

Consulta [Supervisione Codex](/it/plugins/codex-supervision) per la configurazione
da parte dell'operatore e il comportamento visibile dell'interfaccia di
controllo.

## Risposte visibili e heartbeat

I turni di chat diretti o dall'origine tramite l'harness Codex utilizzano per
impostazione predefinita la consegna automatica della risposta finale
dell'assistente per le superfici WebChat interne, in conformità con il contratto
dell'harness Pi: l'agente risponde normalmente e OpenClaw pubblica il testo
finale nella conversazione di origine. Imposta
`messages.visibleReplies: "message_tool"` per mantenere privato il testo finale
dell'assistente, a meno che l'agente non chiami `message(action="send")`.

Per impostazione predefinita, i turni Heartbeat di Codex ricevono
`heartbeat_respond` nel catalogo ricercabile degli strumenti OpenClaw, affinché
l'agente possa registrare se il risveglio debba rimanere silenzioso o inviare
una notifica. Le indicazioni sull'iniziativa dell'Heartbeat vengono inviate come
istruzione per sviluppatori della modalità di collaborazione Codex, limitata al
turno Heartbeat; i normali turni di chat rimangono nella modalità predefinita di
Codex. Quando `HEARTBEAT.md` non è vuoto, le istruzioni dell'Heartbeat indicano
a Codex il file anziché includerne direttamente il contenuto.

## Confini degli hook

| Livello                               | Titolare                 | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei Plugin OpenClaw              | OpenClaw                 | Compatibilità di prodotto e Plugin tra gli harness OpenClaw e Codex. |
| Middleware di estensione dell'app-server Codex | Plugin inclusi in OpenClaw | Comportamento dell'adattatore per turno attorno agli strumenti dinamici di OpenClaw. |
| Hook nativi di Codex                  | Codex                    | Ciclo di vita Codex di basso livello e politica degli strumenti nativi dalla configurazione Codex. |

OpenClaw non utilizza i file `hooks.json` di progetto o globali di Codex per
instradare il comportamento dei Plugin. Per il ponte degli strumenti nativi e
delle autorizzazioni, OpenClaw inserisce una configurazione Codex per thread per
`PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`.

Quando le approvazioni dell'app-server Codex sono abilitate (`approvalPolicy`
non è `"never"`), la configurazione predefinita degli hook nativi inserita
omette `PermissionRequest`, affinché il revisore dell'app-server Codex e il
ponte di approvazione di OpenClaw gestiscano le effettive richieste di
escalation dopo la revisione. Aggiungi `permission_request` a
`nativeHookRelay.events` per forzare comunque il relay di compatibilità. Gli
altri hook Codex, come `SessionStart` e `UserPromptSubmit`, rimangono controlli
a livello di Codex; nel contratto v1 non vengono esposti come hook dei Plugin
OpenClaw.

Per gli strumenti dinamici di OpenClaw, OpenClaw esegue lo strumento dopo che
Codex ne richiede la chiamata, quindi il comportamento dei Plugin e del
middleware viene eseguito nell'adattatore dell'harness. Per gli strumenti nativi
di Codex, Codex gestisce il record canonico dello strumento; OpenClaw può
replicare eventi selezionati, ma non può riscrivere il thread nativo a meno che
Codex non esponga tale possibilità tramite callback dell'app-server o degli
hook nativi.

Gli eventi `PreToolUse` in modalità di segnalazione dell'app-server Codex
rimandano l'approvazione del Plugin alla corrispondente approvazione
dell'app-server. Se un hook OpenClaw `before_tool_call` restituisce
`requireApproval` mentre il payload nativo imposta `openclaw_approval_mode:
"report"`, il relay degli hook nativi registra il requisito di approvazione del
Plugin e non restituisce alcuna decisione nativa. Quando Codex invia in seguito
la richiesta di approvazione dell'app-server per lo stesso utilizzo dello
strumento, OpenClaw apre la richiesta di approvazione del Plugin e riconduce la
decisione a Codex. Gli eventi Codex `PermissionRequest` costituiscono un
percorso di approvazione separato e possono comunque essere instradati tramite
le approvazioni OpenClaw quando configurati per tale ponte.

Le notifiche degli elementi dell'app-server Codex forniscono inoltre
osservazioni asincrone `after_tool_call` per i completamenti degli strumenti
nativi non già coperti dal relay nativo `PostToolUse`. Queste servono soltanto
per telemetria e compatibilità; non possono bloccare, ritardare o modificare la
chiamata nativa allo strumento.

Le proiezioni della Compaction e del ciclo di vita dell'LLM provengono dalle
notifiche dell'app-server Codex e dallo stato dell'adattatore OpenClaw, non dai
comandi degli hook nativi Codex. `before_compaction`, `after_compaction`,
`llm_input` e `llm_output` sono osservazioni a livello dell'adattatore, non
acquisizioni byte per byte della richiesta interna o dei payload di Compaction
di Codex.

Le notifiche dell'app-server Codex native `hook/started` e `hook/completed`
vengono proiettate come eventi dell'agente `codex_app_server.hook` per la
traiettoria e il debug. Non richiamano gli hook dei Plugin OpenClaw.

## Contratto di supporto v1

Supportato nel runtime Codex v1:

| Ambito                                        | Supporto                                                                                          | Motivazione                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ciclo del modello OpenAI tramite Codex        | Supportato                                                                                        | Il server applicativo Codex gestisce il turno OpenAI, la ripresa nativa del thread e la continuazione nativa degli strumenti.                                                                                                                                                                                                                                                                                                                                                                                             |
| Instradamento e consegna dei canali OpenClaw  | Supportato                                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage e gli altri canali rimangono esterni al runtime del modello.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Strumenti dinamici di OpenClaw                | Supportato                                                                                        | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw rimane nel percorso di esecuzione.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Plugin di prompt e contesto                   | Supportato                                                                                        | OpenClaw proietta nel turno Codex il prompt e il contesto specifici di OpenClaw, lasciando nel percorso nativo di Codex i prompt di base, del modello e dei documenti di progetto configurati, gestiti da Codex. OpenClaw disabilita la personalità integrata di Codex per i thread nativi, affinché i file della personalità dell'area di lavoro dell'agente rimangano autorevoli. Le istruzioni native per sviluppatori di Codex accettano solo indicazioni sui comandi esplicitamente limitate a `codex_app_server`; i suggerimenti globali legacy sui comandi rimangono per le superfici di prompt non Codex. |
| Ciclo di vita del motore di contesto          | Supportato                                                                                        | L'assemblaggio, l'acquisizione e la manutenzione successiva al turno vengono eseguiti attorno ai turni Codex. I motori di contesto non sostituiscono la Compaction nativa di Codex.                                                                                                                                                                                                                                                                                                                                       |
| Hook degli strumenti dinamici                 | Supportato                                                                                        | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici gestiti da OpenClaw.                                                                                                                                                                                                                                                                                                                                                                |
| Hook del ciclo di vita                        | Supportato come osservazioni dell'adattatore                                                      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono attivati con payload fedeli alla modalità Codex.                                                                                                                                                                                                                                                                                                                                                                                 |
| Punto di controllo per la revisione della risposta finale | Supportato tramite inoltro degli hook nativi                                                      | Il comando `Stop` di Codex viene inoltrato a `before_agent_finalize`; `revise` richiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                                                                                                                                                                                                                                                                                                                            |
| Blocco o osservazione nativi di shell, patch e MCP | Supportato tramite inoltro degli hook nativi                                                      | `PreToolUse` e `PostToolUse` di Codex vengono inoltrati per le superfici degli strumenti nativi confermate, inclusi i payload MCP nel server applicativo Codex `0.142.0` o versioni successive. Il blocco è supportato; la riscrittura degli argomenti no.                                                                                                                                                                                                                                                                     |
| Criteri delle autorizzazioni native           | Supportato tramite le approvazioni del server applicativo Codex e l'inoltro compatibile degli hook nativi | Le richieste di approvazione del server applicativo Codex vengono instradate tramite OpenClaw dopo la verifica di Codex. L'inoltro dell'hook nativo `PermissionRequest` è facoltativo per le modalità di approvazione native, poiché Codex lo emette prima della verifica del sistema di protezione.                                                                                                                                                                                                                          |
| Acquisizione della traiettoria del server applicativo | Supportato                                                                                        | OpenClaw registra la richiesta inviata al server applicativo e le notifiche ricevute da quest'ultimo.                                                                                                                                                                                                                                                                                                                                                                                                                     |

Non supportato nel runtime Codex v1:

| Ambito                                              | Limite della V1                                                                                                                                                               | Evoluzione futura                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Modifica degli argomenti degli strumenti nativi     | Gli hook nativi pre-strumento di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.                                             | Richiede il supporto degli hook o dello schema di Codex per sostituire l'input dello strumento.                                |
| Cronologia modificabile della trascrizione nativa di Codex | Codex gestisce la cronologia canonica dei thread nativi. OpenClaw gestisce una copia e può proiettare il contesto futuro, ma non deve modificare componenti interni non supportati. | Aggiungere API esplicite del server applicativo Codex se è necessario intervenire sui thread nativi.                           |
| `tool_result_persist` per i record degli strumenti nativi di Codex | Questo hook trasforma le scritture della trascrizione gestite da OpenClaw, non i record degli strumenti nativi di Codex.                                                     | È possibile replicare i record trasformati, ma la riscrittura canonica richiede il supporto di Codex.                          |
| Metadati avanzati della Compaction nativa           | OpenClaw può richiedere la Compaction nativa, ma non riceve un elenco stabile degli elementi mantenuti o eliminati, la variazione dei token, un riepilogo del completamento o il payload del riepilogo. | Richiede eventi di Compaction Codex più dettagliati.                                                                           |
| Intervento sulla Compaction                         | OpenClaw non consente ai Plugin o ai motori di contesto di impedire, riscrivere o sostituire la Compaction nativa di Codex.                                                  | Aggiungere hook Codex precedenti e successivi alla Compaction se i Plugin devono impedirla o riscriverla.                      |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire le richieste e le notifiche del server applicativo, ma il nucleo di Codex crea internamente la richiesta API OpenAI finale.                            | Richiede un evento di tracciamento delle richieste del modello Codex o un'API di debug.                                        |

## Autorizzazioni native e richieste di informazioni MCP

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di autorizzazione o rifiuto
solo quando i criteri prendono una decisione. L'assenza di una decisione non equivale a
un'autorizzazione: Codex la considera come l'assenza di una decisione dell'hook e passa
al proprio sistema di protezione o al percorso di approvazione dell'utente.

Le modalità di approvazione del server applicativo Codex omettono per impostazione predefinita
questo hook nativo. Ciò si applica a meno che `permission_request` non sia incluso esplicitamente
in `nativeHookRelay.events` o che non venga installato da un runtime di compatibilità.

Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione
nativa di Codex, OpenClaw memorizza l'esatta impronta digitale di
provider/sessione/input dello strumento/cwd per un intervallo limitato della sessione.
La decisione memorizzata si applica intenzionalmente solo alle corrispondenze esatte:
un comando, degli argomenti, un payload dello strumento o una directory
cwd differenti generano una nuova approvazione.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate tramite il flusso
di approvazione dei Plugin di OpenClaw quando Codex contrassegna
`_meta.codex_approval_kind` come `"mcp_tool_call"`. Le richieste
`request_user_input` di Codex vengono inviate alla chat di origine e il
successivo messaggio di follow-up in coda risponde a tale richiesta del server nativo,
anziché essere indirizzato come contesto aggiuntivo. Le altre richieste di informazioni MCP
vengono rifiutate per impostazione predefinita.

Per il flusso generale di approvazione dei Plugin che trasporta queste richieste, vedere
[Richieste di autorizzazione dei Plugin](/it/plugins/plugin-permission-requests).

## Indirizzamento della coda

L'indirizzamento della coda durante un'esecuzione attiva viene mappato su `turn/steer`
del server applicativo Codex. Con l'impostazione predefinita
`messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi della chat in modalità
steer per l'intervallo di inattività configurato e li invia come un'unica richiesta
`turn/steer` nell'ordine di arrivo.

Le revisioni di Codex e i turni di Compaction manuale possono rifiutare l'instradamento nello stesso turno. In
tal caso, OpenClaw attende il completamento dell'esecuzione attiva prima di avviare il
prompt. Usa `/queue followup` o `/queue collect` quando i messaggi devono essere accodati
per impostazione predefinita anziché instradati. Vedi [Coda di instradamento](/it/concepts/queue-steering).

## Caricamento del feedback di Codex

Quando `/diagnostics [note]` viene approvato per una sessione nell'harness Codex
nativo, OpenClaw chiama anche `feedback/upload` dell'app-server Codex per i thread
Codex pertinenti, includendo i log per ogni thread elencato e per i sottothread Codex
generati, quando disponibili.

Il caricamento avviene tramite il normale percorso di feedback di Codex verso i server OpenAI. Se
il feedback di Codex è disabilitato in tale app-server, il comando restituisce l'errore
dell'app-server. La risposta di diagnostica completata elenca i canali,
gli ID di sessione OpenClaw, gli ID dei thread Codex e i comandi locali `codex resume <thread-id>`
per i thread inviati.

Se neghi o ignori l'approvazione, OpenClaw non visualizza tali ID Codex
e non invia il feedback di Codex. Il caricamento non sostituisce l'esportazione locale
della diagnostica del Gateway. Vedi [Esportazione della diagnostica](/it/gateway/diagnostics) per
informazioni sull'approvazione, sulla privacy, sul pacchetto locale e sul comportamento nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando desideri caricare il feedback di Codex
per il thread attualmente collegato senza il pacchetto diagnostico completo del Gateway.

## Compaction e copia speculare della trascrizione

Quando il modello selezionato usa l'harness Codex, la Compaction nativa dei thread
è di competenza dell'app-server Codex. OpenClaw non esegue la Compaction preliminare per
i turni Codex, non sostituisce la Compaction di Codex con quella del motore di contesto e non
ricorre alla riepilogazione di OpenClaw o pubblica di OpenAI quando non è possibile
avviare la Compaction nativa. OpenClaw mantiene una copia speculare della trascrizione per la cronologia
dei canali, la ricerca, `/new`, `/reset` e il futuro cambio di modello o harness.

Le richieste esplicite di Compaction, come `/compact` o un'operazione di Compaction
manuale richiesta da un Plugin, avviano la Compaction nativa di Codex con `thread/compact/start`.
OpenClaw mantiene aperti la richiesta e il lease del client condiviso finché Codex non emette
l'elemento di completamento `contextCompaction` corrispondente, quindi segnala il turno di Compaction
come completato. Se tale turno terminale supera il timeout di Compaction
configurato, OpenClaw richiede un'interruzione nativa del turno. Il lease e il blocco di Compaction
per thread rimangono attivi finché Codex non segnala lo stato terminale o non conferma
l'RPC di interruzione. Se Codex non fornisce conferma entro il periodo di tolleranza
dell'interruzione, OpenClaw dismette la connessione prima di rilasciare il blocco. Le connessioni
remote scollegano anche l'associazione del thread corrispondente, affinché le attività successive non possano
sovrapporsi a un turno remoto non confermato. Gli altri turni su una connessione dismessa non riescono
e possono essere ritentati con un nuovo client. La chiusura del client, l'annullamento della richiesta o un
turno di Compaction non riuscito restituiscono un'operazione non riuscita. La Compaction automatica dovuta alla
pressione del contesto è compito di Codex; OpenClaw avvia la Compaction nativa solo per gli eventi
attivatori richiesti manualmente.

Quando un motore di contesto richiede la proiezione di inizializzazione di un thread Codex, OpenClaw
proietta nel nuovo thread Codex i nomi e gli ID delle chiamate agli strumenti, le strutture degli input
e il contenuto oscurato dei risultati degli strumenti. Non copia i valori grezzi degli argomenti
delle chiamate agli strumenti in tale proiezione.

La copia speculare include il prompt dell'utente, il testo finale dell'assistente e i record essenziali
di ragionamento o pianificazione di Codex quando l'app-server li emette. OpenClaw
registra l'avvio della Compaction nativa e lo stato terminale, ma non
espone un riepilogo della Compaction leggibile dalle persone né un elenco verificabile delle
voci mantenute da Codex dopo la Compaction.

Poiché Codex è responsabile del thread nativo canonico, `tool_result_persist` non
riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando OpenClaw
scrive il risultato di uno strumento nella trascrizione di una sessione di proprietà di OpenClaw.

## Contenuti multimediali e consegna

OpenClaw continua a gestire la consegna dei contenuti multimediali e la selezione del relativo provider. Immagini,
video, musica, PDF, TTS e comprensione dei contenuti multimediali usano le impostazioni
del provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` e `messages.tts`.

Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano
a essere trasmessi attraverso il normale percorso di consegna di OpenClaw; la generazione di contenuti multimediali non richiede
il runtime legacy. Quando Codex emette un elemento nativo di generazione delle immagini con un
`savedPath`, OpenClaw inoltra esattamente quel file tramite il normale percorso dei contenuti multimediali
di risposta, anche se il turno Codex non contiene testo dell'assistente.

## Argomenti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Supervisione di Codex](/it/plugins/codex-supervision)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Hook dei Plugin](/it/plugins/hooks)
- [Plugin dell'harness dell'agente](/it/plugins/sdk-agent-harness)
- [Esportazione della diagnostica](/it/gateway/diagnostics)
- [Esportazione della traiettoria](/it/tools/trajectory)
