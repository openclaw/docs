---
read_when:
    - È necessaria una guida dettagliata e precisa sul ciclo dell'agente o sugli eventi del ciclo di vita
    - Si sta modificando l'accodamento delle sessioni, la scrittura delle trascrizioni o il comportamento del blocco di scrittura delle sessioni
summary: Ciclo di vita dell'agent loop, flussi e semantica dell'attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-07-16T14:13:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Il loop dell'agente è l'esecuzione serializzata per sessione che trasforma un messaggio in
azioni e una risposta: acquisizione, composizione del contesto, inferenza del modello, esecuzione
degli strumenti, streaming, persistenza.

## Punti di ingresso

- RPC del Gateway: `agent` e `agent.wait`.
- CLI: `openclaw agent`.

## Sequenza di esecuzione

1. L'RPC `agent` convalida i parametri, risolve la sessione (`sessionKey`/`sessionId`), rende persistenti i metadati della sessione e restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue il turno: risolve il modello e le impostazioni predefinite di ragionamento, verbosità e traccia, carica lo snapshot delle Skills, chiama `runEmbeddedAgent` ed emette un evento di ripiego **fine/errore del ciclo di vita** se il loop incorporato non ne ha già emesso uno.
3. `runEmbeddedAgent`: serializza le esecuzioni tramite code per sessione e globali, risolve il modello e il profilo di autenticazione, crea la sessione OpenClaw, sottoscrive gli eventi di runtime, trasmette in streaming i delta dell'assistente e degli strumenti, applica il timeout dell'esecuzione (interrompendola alla scadenza) e restituisce i payload insieme ai metadati di utilizzo. Per i turni dell'app server Codex, interrompe inoltre un turno accettato che smette di produrre avanzamenti dell'app server prima di un evento terminale.
4. `subscribeEmbeddedAgentSession` collega gli eventi di runtime al flusso `agent`: gli eventi degli strumenti a `stream: "tool"`, i delta dell'assistente a `stream: "assistant"`, gli eventi del ciclo di vita a `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) attende **fine/errore del ciclo di vita** su un `runId` e restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Accodamento e concorrenza

Le esecuzioni vengono serializzate per chiave di sessione (corsia di sessione) e, facoltativamente, tramite una corsia globale, evitando condizioni di competizione tra strumenti e sessioni. I canali di messaggistica scelgono una modalità di coda (steer/followup/collect/interrupt) che alimenta questo sistema di corsie; vedere [Coda dei comandi](/it/concepts/queue).

Le scritture della trascrizione sono inoltre protette da un blocco di scrittura della sessione sul relativo file. Il blocco è basato su file e tiene conto dei processi, quindi intercetta gli autori di scritture che eludono la coda interna al processo o provengono da un altro processo. Gli autori attendono fino a `session.writeLock.acquireTimeoutMs` (valore predefinito `60000` ms; sostituibile tramite la variabile d'ambiente `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) prima di segnalare la sessione come occupata.

Per impostazione predefinita, i blocchi di scrittura della sessione non sono rientranti. Un helper che annida intenzionalmente l'acquisizione dello stesso blocco mantenendo un unico autore logico deve abilitarla esplicitamente con `allowReentrant: true`.

## Preparazione della sessione e dell'area di lavoro

- L'area di lavoro viene risolta e creata; le esecuzioni in sandbox possono essere reindirizzate alla radice di un'area di lavoro sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e inserite nell'ambiente e nel prompt.
- I file di bootstrap e di contesto vengono risolti e inseriti nel prompt di sistema.
- Prima dell'avvio dello streaming viene acquisito un blocco di scrittura della sessione e viene preparata la destinazione della trascrizione della sessione. Qualsiasi successivo percorso di riscrittura, Compaction o troncamento della trascrizione deve acquisire lo stesso blocco prima di modificare le righe della trascrizione SQLite.

## Composizione del prompt

Il prompt di sistema viene creato a partire dal prompt di base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dalle sostituzioni specifiche dell'esecuzione. Vengono applicati i limiti specifici del modello e i token di riserva per la Compaction. Vedere [Prompt di sistema](/it/concepts/system-prompt) per ciò che viene mostrato al modello.

## Hook

OpenClaw dispone di due sistemi di hook:

- **Hook interni** (hook del Gateway): script basati su eventi per comandi ed eventi del ciclo di vita.
- **Hook dei Plugin**: punti di estensione nel ciclo di vita dell'agente e degli strumenti e nella pipeline del Gateway.

### Hook interni (hook del Gateway)

- **`agent:bootstrap`**: viene eseguito durante la creazione dei file di bootstrap, prima che il prompt di sistema sia finalizzato. Utilizzarlo per aggiungere o rimuovere file di contesto di bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi dei comandi (vedere la documentazione sugli hook).

Vedere [Hook](/it/automation/hooks) per la configurazione e gli esempi.

### Hook dei Plugin

Questi vengono eseguiti nel loop dell'agente o nella pipeline del Gateway:

| Hook                                                    | Esecuzione                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Prima della sessione (senza `messages`), per sostituire in modo deterministico il provider/modello prima della risoluzione.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Dopo il caricamento della sessione (con `messages`), per inserire `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio. Utilizzare `prependContext` per il testo dinamico specifico del turno e i campi del contesto di sistema per le indicazioni stabili che appartengono allo spazio del prompt di sistema. |
| `before_agent_start`                                    | Hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferire gli hook espliciti indicati sopra.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Dopo le azioni inline, prima della chiamata all'LLM. Consente a un Plugin di acquisire il turno e restituire una risposta sintetica o di silenziarlo completamente.                                                                                                                                                                |
| `agent_end`                                             | Dopo il completamento, con l'elenco finale dei messaggi e i metadati dell'esecuzione.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Osserva o annota i cicli di Compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Intercetta i parametri/risultati degli strumenti.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Dopo l'applicazione dei criteri di installazione dell'operatore, sul materiale predisposto per l'installazione di Skill/Plugin, quando gli hook dei Plugin sono caricati nel processo corrente.                                                                                                                                                           |
| `tool_result_persist`                                   | Trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione gestita da OpenClaw.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hook dei messaggi in entrata e in uscita.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Limiti del ciclo di vita della sessione.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Eventi del ciclo di vita del Gateway.                                                                                                                                                                                                                                                                   |

Regole decisionali degli hook per le protezioni delle operazioni in uscita e degli strumenti:

- `before_tool_call`: `{ block: true }` è terminale e arresta i gestori con priorità inferiore. `{ block: false }` non esegue alcuna operazione e non annulla un blocco precedente.
- `before_install`: stesse semantiche terminali e di nessuna operazione indicate sopra. Utilizzare `security.installPolicy`, non `before_install`, per le decisioni di autorizzazione/blocco delle installazioni gestite dall'operatore che devono includere i percorsi di installazione e aggiornamento della CLI.
- `message_sending`: `{ cancel: true }` è terminale e arresta i gestori con priorità inferiore. `{ cancel: false }` non esegue alcuna operazione e non annulla una cancellazione precedente.

Vedere [Hook dei Plugin](/it/plugins/hooks) per l'API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook. L'harness dell'app server Codex mantiene gli hook dei Plugin OpenClaw come contratto di compatibilità per le superfici replicate documentate; gli hook nativi di Codex sono un meccanismo Codex separato e di livello inferiore.

## Streaming

- I delta dell'assistente vengono trasmessi in streaming dal runtime dell'agente come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere un flusso separato o bloccare le risposte.
- Vedere [Streaming](/it/concepts/streaming) per il comportamento della suddivisione in parti e delle risposte a blocchi.

## Esecuzione degli strumenti

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sul flusso `tool`.
- Prima della registrazione o dell'emissione, i risultati degli strumenti vengono ripuliti in base alle dimensioni e ai payload delle immagini.
- Gli invii degli strumenti di messaggistica vengono monitorati per evitare conferme duplicate da parte dell'assistente.

## Composizione della risposta

I payload finali vengono assemblati dal testo dell'assistente (più il ragionamento facoltativo), dai riepiloghi inline degli strumenti (quando la modalità dettagliata è attiva e consentita) e dal testo di errore dell'assistente quando il modello genera un errore.

- Il token esatto di silenzio `NO_REPLY` viene filtrato dai payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non rimane alcun payload visualizzabile e uno strumento ha generato un errore, viene emessa una risposta di ripiego relativa all'errore dello strumento, a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente.

## Compaction e nuovi tentativi

La Compaction automatica emette eventi del flusso `compaction` e può attivare un nuovo tentativo. Al nuovo tentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicati. Vedere [Compaction](/it/concepts/compaction).

## Flussi di eventi

- `lifecycle`: emessi da `subscribeEmbeddedAgentSession` (e come ripiego da `agentCommand`).
- `assistant`: delta trasmessi in streaming dal runtime dell'agente.
- `tool`: eventi degli strumenti trasmessi in streaming dal runtime dell'agente.

Il Gateway proietta gli eventi del ciclo di vita e gli eventi iniziali/terminali degli strumenti nel [registro di controllo](/it/cli/audit) limitato,
contenente solo metadati. Questa proiezione registra la provenienza e
i codici dei risultati senza copiare prompt, messaggi, argomenti degli strumenti, risultati degli strumenti
o errori non elaborati al di fuori del percorso della trascrizione e del runtime.

## Gestione del canale di chat

I delta dell'assistente vengono accumulati nei messaggi `delta` della chat. Un `final` della chat viene emesso al verificarsi di **fine/errore del ciclo di vita**.

## Timeout

| Timeout                                          | Valore predefinito                     | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Solo attesa; il parametro `timeoutMs` sovrascrive questo valore. Non arresta l'esecuzione sottostante.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Runtime dell'agente (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Applicato dal timer di interruzione di `runEmbeddedAgent`. Impostare `0` per un limite di esecuzione illimitato; i watchdog di attività del flusso del modello restano comunque attivi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Turno isolato dell'agente Cron                    | gestito da Cron                        | Lo scheduler avvia il proprio timer all'inizio dell'esecuzione, interrompe l'esecuzione alla scadenza configurata, quindi esegue una pulizia limitata prima di registrare il timeout, affinché una sessione figlia obsoleta non possa mantenere bloccata la corsia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Timeout di inattività del modello                 | Cloud 120s; self-hosted 300s           | OpenClaw interrompe una richiesta al modello se non arriva alcun frammento di risposta entro la finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per i provider locali/self-hosted lenti, ma resta limitato da qualsiasi valore finito inferiore di `agents.defaults.timeoutSeconds` o timeout specifico dell'esecuzione, poiché questi regolano l'intera esecuzione dell'agente. I limiti di esecuzione illimitati mantengono comunque il watchdog di inattività della classe di provider. Le esecuzioni di modelli cloud attivate da Cron senza un timeout esplicito del modello/agente usano lo stesso valore predefinito; con un timeout esplicito dell'esecuzione Cron, i blocchi del flusso del modello cloud sono limitati a 60s, affinché i fallback del modello configurati possano comunque essere eseguiti prima della scadenza Cron esterna. Le esecuzioni attivate da Cron su endpoint realmente locali (baseUrl loopback/privato) mantengono la disattivazione del timeout di inattività locale; i provider self-hosted su baseUrl di rete ricevono il watchdog implicito di 300s. Con un timeout esplicito dell'esecuzione Cron, i blocchi locali/self-hosted sono limitati a tale timeout. Impostare `models.providers.<id>.timeoutSeconds` per i provider locali lenti. |
| Timeout della richiesta HTTP del provider        | `models.providers.<id>.timeoutSeconds` | Comprende connessione, intestazioni, corpo, timeout della richiesta SDK, gestione dell'interruzione di guarded-fetch e watchdog di inattività del flusso del modello per tale provider. Utilizzarlo per provider locali/self-hosted lenti (ad esempio Ollama) prima di aumentare il timeout dell'intero runtime dell'agente; mantenere il timeout dell'agente/runtime almeno altrettanto elevato quando la richiesta al modello deve durare più a lungo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Diagnostica delle sessioni bloccate

Con la diagnostica abilitata, `diagnostics.stuckSessionWarnMs` (valore predefinito `120000` ms) classifica le sessioni `processing` di lunga durata senza alcun avanzamento osservato di risposta, strumento, stato, blocco o ACP:

- Le esecuzioni incorporate, le chiamate al modello e le chiamate agli strumenti attive vengono segnalate come `session.long_running`. Le chiamate silenziose al modello con un proprietario restano `session.long_running` fino a `diagnostics.stuckSessionAbortMs`, affinché i provider lenti o senza streaming non vengano contrassegnati come bloccati troppo presto.
- Il lavoro attivo senza avanzamenti recenti viene segnalato come `session.stalled`. Le chiamate al modello con un proprietario passano a `session.stalled` al raggiungimento o dopo la soglia di interruzione; le attività obsolete del modello/strumento senza proprietario non vengono occultate come operazioni di lunga durata.
- `session.stuck` è riservato alla gestione recuperabile di registrazioni obsolete delle sessioni, incluse le sessioni inattive in coda con attività obsolete del modello/strumento senza proprietario.

`diagnostics.stuckSessionAbortMs` ha come valore predefinito almeno 5 minuti e 3 volte la soglia di avviso. La gestione delle registrazioni obsolete delle sessioni libera la corsia della sessione interessata immediatamente dopo il superamento dei controlli di recupero; le esecuzioni incorporate bloccate vengono interrotte e svuotate solo dopo la soglia di interruzione, così il lavoro in coda riprende senza troncare esecuzioni semplicemente lente. Il recupero emette risultati strutturati per richiesta e completamento; lo stato diagnostico viene contrassegnato come inattivo solo se la stessa generazione di elaborazione è ancora quella corrente e le diagnostiche `session.stuck` ripetute applicano un backoff finché la sessione rimane invariata.

## Situazioni in cui le operazioni possono terminare anticipatamente

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non arresta l'agente)

## Argomenti correlati

- [Strumenti](/it/tools) - strumenti disponibili per l'agente
- [Hook](/it/automation/hooks) - script basati su eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) - come vengono riepilogate le conversazioni lunghe
- [Approvazioni di esecuzione](/it/tools/exec-approvals) - controlli di approvazione per i comandi della shell
- [Ragionamento](/it/tools/thinking) - configurazione del livello di ragionamento
