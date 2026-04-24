---
read_when:
    - Ti serve una spiegazione precisa del loop dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture della trascrizione o il comportamento del lock di scrittura della sessione
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: Loop dell'agente
x-i18n:
    generated_at: "2026-04-24T08:35:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop dell'agente (OpenClaw)

Un loop agentico è l'intera esecuzione “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → streaming delle risposte → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette l'output in streaming. Questo documento spiega come quel loop autentico sia
collegato end-to-end.

## Punti di ingresso

- RPC Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (panoramica)

1. L'RPC `agent` convalida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione e restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve i valori predefiniti di modello + thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **lifecycle end/error** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione e globali
   - risolve modello + profilo auth e costruisce la sessione pi
   - si sottoscrive agli eventi pi e trasmette i delta assistant/tool
   - applica il timeout -> interrompe l'esecuzione se superato
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi pi-agent-core allo stream OpenClaw `agent`:
   - eventi tool => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - eventi lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **lifecycle end/error** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e facoltativamente tramite una corsia globale.
- Questo previene race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Command Queue](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file della sessione. Il lock è
  consapevole del processo e basato su file, quindi intercetta gli scrittori che bypassano la coda in-process o provengono
  da un altro processo.
- I lock di scrittura della sessione non sono rientranti per impostazione predefinita. Se un helper annida intenzionalmente l'acquisizione
  dello stesso lock preservando un unico writer logico, deve attivarlo esplicitamente con
  `allowReentrant: true`.

## Preparazione della sessione + dello spazio di lavoro

- Lo spazio di lavoro viene risolto e creato; le esecuzioni sandbox possono reindirizzare a una radice dello spazio di lavoro sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e inserite in env e nel prompt.
- I file bootstrap/contesto vengono risolti e inseriti nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  successivo percorso di riscrittura, Compaction o troncamento della trascrizione deve acquisire lo stesso lock prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito a partire dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per la Compaction.
- Vedi [System prompt](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script guidati da eventi per comandi ed eventi di ciclo di vita.
- **Hook del Plugin**: punti di estensione all'interno del ciclo di vita dell'agente/degli strumenti e della pipeline del Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file bootstrap prima che il prompt di sistema sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi il documento Hooks).

Vedi [Hooks](/it/automation/hooks) per configurazione ed esempi.

### Hook del Plugin (ciclo di vita dell'agente + del Gateway)

Questi vengono eseguiti all'interno del loop dell'agente o della pipeline del Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per inserire `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che dovrebbero stare nello spazio del prompt di sistema.
- **`before_agent_start`**: hook legacy di compatibilità che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, permettendo a un Plugin di reclamare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e può facoltativamente bloccare installazioni di skill o Plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione posseduta da OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook per messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del Gateway.

Regole decisionali degli hook per guardie su uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e ferma i gestori a priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma i gestori a priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma i gestori a priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una precedente cancellazione.

Vedi [Plugin hooks](/it/plugins/architecture-internals#provider-runtime-hooks) per l'API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L'harness app-server di Codex mantiene
gli hook del Plugin OpenClaw come contratto di compatibilità per le superfici documentate con mirroring,
mentre gli hook nativi di Codex restano un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta assistant vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per chunking e comportamento delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di inizio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload di immagini prima di essere registrati/emessi.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme assistant duplicate.

## Modellazione della risposta + soppressione

- I payload finali vengono assemblati da:
  - testo assistant (e ragionamento facoltativo)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore assistant quando il modello produce un errore
- Il token esatto di silenzio `NO_REPLY` / `no_reply` viene filtrato dai
  payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non restano payload renderizzabili e uno strumento ha prodotto un errore, viene emessa
  una risposta fallback di errore dello strumento (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compaction + retry

- La Compaction automatica emette eventi stream `compaction` e può attivare un retry.
- Al retry, i buffer in memoria e i riepiloghi degli strumenti vengono azzerati per evitare output duplicati.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi strumenti in streaming da pi-agent-core

## Gestione del canale chat

- I delta assistant vengono bufferizzati in messaggi chat `delta`.
- Un `final` della chat viene emesso su **lifecycle end/error**.

## Timeout

- Predefinito `agent.wait`: 30s (solo l'attesa). Il parametro `timeoutMs` esegue l'override.
- Runtime dell'agente: predefinito `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Timeout di inattività dell'LLM: `agents.defaults.llm.idleTimeoutSeconds` interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. Impostalo esplicitamente per modelli locali lenti o provider con ragionamento/chiamate strumenti; impostalo a 0 per disattivarlo. Se non è impostato, OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, altrimenti 120s. Le esecuzioni attivate da Cron senza timeout LLM o agente esplicito disattivano il watchdog di inattività e si affidano al timeout esterno di Cron.

## Dove le cose possono terminare prima

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non ferma l'agente)

## Correlati

- [Strumenti](/it/tools) — strumenti disponibili per l'agente
- [Hooks](/it/automation/hooks) — script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riepilogate le conversazioni lunghe
- [Approvazioni exec](/it/tools/exec-approvals) — punti di approvazione per i comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/ragionamento
