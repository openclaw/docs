---
read_when:
    - Ti serve una guida passo passo precisa sul ciclo dell'agente o sugli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture della trascrizione o il comportamento del blocco di scrittura della sessione
summary: Ciclo di vita del loop dell'agente, flussi e semantica di attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-05-02T08:20:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un loop agentico è l’intera esecuzione “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico è
collegato end-to-end.

## Punti di ingresso

- RPC Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (ad alto livello)

1. L’RPC `agent` valida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione, restituisce subito `{ runId, acceptedAt }`.
2. `agentCommand` esegue l’agente:
   - risolve il modello + i valori predefiniti di thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **fine/errore del ciclo di vita** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve modello + profilo di autenticazione e costruisce la sessione Pi
   - sottoscrive gli eventi Pi e trasmette in streaming i delta di assistente/strumento
   - applica il timeout -> interrompe l’esecuzione se viene superato
   - per i turni dell’app-server Codex, interrompe un turno accettato che smette di produrre avanzamento dell’app-server prima di un evento terminale
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi pi-agent-core allo stream `agent` di OpenClaw:
   - eventi degli strumenti => `stream: "tool"`
   - delta dell’assistente => `stream: "assistant"`
   - eventi del ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **fine/errore del ciclo di vita** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e, facoltativamente, tramite una corsia globale.
- Questo evita race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file di sessione. Il lock è
  consapevole del processo e basato su file, quindi intercetta writer che aggirano la coda in-process o provengono da
  un altro processo.
- I lock di scrittura della sessione sono non rientranti per impostazione predefinita. Se un helper annida intenzionalmente l’acquisizione dello
  stesso lock preservando un unico writer logico, deve aderire esplicitamente con
  `allowReentrant: true`.

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono essere reindirizzate a una radice di workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell’ambiente e nel prompt.
- I file di bootstrap/contesto vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  percorso successivo di riscrittura, Compaction o troncamento della trascrizione deve acquisire lo stesso lock prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per la Compaction.
- Vedi [Prompt di sistema](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script basati su eventi per comandi ed eventi del ciclo di vita.
- **Hook dei Plugin**: punti di estensione dentro il ciclo di vita agente/strumento e la pipeline del Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito mentre si costruiscono i file di bootstrap prima che il prompt di sistema venga finalizzato.
  Usalo per aggiungere/rimuovere file di contesto di bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi il documento Hook).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook dei Plugin (ciclo di vita agente + Gateway)

Questi vengono eseguiti dentro il loop dell’agente o la pipeline del Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell’invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che dovrebbero risiedere nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, consentendo a un plugin di rivendicare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l’elenco finale dei messaggi e i metadati dell’esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e opzionalmente blocca installazioni di skill o plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà di OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook dei messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del Gateway.

Regole decisionali degli hook per guard in uscita/strumento:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità più bassa.
- `before_tool_call`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità più bassa.
- `before_install`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità più bassa.
- `message_sending`: `{ cancel: false }` è un no-op e non elimina una cancellazione precedente.

Vedi [Hook dei Plugin](/it/plugins/hooks) per l’API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L’harness app-server Codex mantiene
gli hook dei plugin OpenClaw come contratto di compatibilità per le superfici mirrorate documentate,
mentre gli hook nativi Codex restano un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta dell’assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` oppure su `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e risposta a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanitizzati per dimensione e payload di immagini prima di essere registrati/emessi.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell’assistente.

## Modellazione + soppressione della risposta

- I payload finali vengono assemblati da:
  - testo dell’assistente (e ragionamento opzionale)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore dell’assistente quando il modello genera un errore
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai payload
  in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall’elenco finale dei payload.
- Se non restano payload renderizzabili e uno strumento ha generato un errore, viene emessa una risposta di errore dello strumento di fallback
  (a meno che uno strumento di messaggistica abbia già inviato una risposta visibile all’utente).

## Compaction + tentativi

- La Compaction automatica emette eventi stream `compaction` e può attivare un nuovo tentativo.
- Al nuovo tentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicati.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi degli strumenti in streaming da pi-agent-core

## Gestione dei canali chat

- I delta dell’assistente vengono bufferizzati in messaggi chat `delta`.
- Un `final` chat viene emesso su **fine/errore del ciclo di vita**.

## Timeout

- Valore predefinito di `agent.wait`: 30s (solo l’attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime agente: valore predefinito di `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Runtime Cron: il `timeoutSeconds` del turno agente isolato è di proprietà di cron. Lo scheduler avvia quel timer quando l’esecuzione comincia, interrompe l’esecuzione sottostante alla scadenza configurata, poi esegue una pulizia limitata prima di registrare il timeout, così una sessione figlia obsoleta non può mantenere bloccata la corsia.
- Diagnostica di liveness della sessione: con la diagnostica abilitata, `diagnostics.stuckSessionWarnMs` classifica le sessioni `processing` lunghe che non hanno risposte, strumenti, stati, blocchi o avanzamento ACP osservati. Esecuzioni incorporate attive, chiamate al modello e chiamate agli strumenti vengono riportate come `session.long_running`; lavoro attivo senza avanzamento recente viene riportato come `session.stalled`; `session.stuck` è riservato alla contabilità di sessioni obsolete senza lavoro attivo, e solo quel percorso rilascia la corsia di sessione interessata così il lavoro di avvio accodato può svuotarsi. Le diagnostiche `session.stuck` ripetute applicano backoff mentre la sessione resta invariata.
- Timeout di inattività del modello: OpenClaw interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per provider locali/self-hosted lenti; altrimenti OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, con limite predefinito a 120s. Le esecuzioni attivate da Cron senza timeout esplicito del modello o dell’agente disabilitano il watchdog di inattività e si affidano al timeout esterno di Cron.
- Timeout della richiesta HTTP del provider: `models.providers.<id>.timeoutSeconds` si applica alle fetch HTTP del modello di quel provider, inclusi connessione, header, body, timeout della richiesta SDK, gestione totale dell’abort della fetch protetta e watchdog di inattività dello stream del modello. Usalo per provider locali/self-hosted lenti come Ollama prima di aumentare il timeout dell’intero runtime agente.

## Dove le cose possono finire in anticipo

- Timeout dell’agente (abort)
- AbortSignal (cancel)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non ferma l’agente)

## Correlati

- [Strumenti](/it/tools) — strumenti agente disponibili
- [Hook](/it/automation/hooks) — script basati su eventi attivati da eventi del ciclo di vita dell’agente
- [Compaction](/it/concepts/compaction) — come vengono riassunte le conversazioni lunghe
- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di pensiero/ragionamento
