---
read_when:
    - Hai bisogno di una descrizione dettagliata esatta del loop dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento della sessione, le scritture della trascrizione o il comportamento del lock di scrittura della sessione
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: Loop dell'agente
x-i18n:
    generated_at: "2026-04-23T08:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop dell'agente (OpenClaw)

Un loop agentico è l'esecuzione completa e “reale” di un agente: intake → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e stream
mentre il modello elabora, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico è
collegato end-to-end.

## Punti di ingresso

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (panoramica)

1. La RPC `agent` valida i parametri, risolve la sessione (`sessionKey`/`sessionId`), persiste i metadati della sessione, restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve i valori predefiniti di modello + thinking/verbose/trace
   - carica lo snapshot di Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **lifecycle end/error** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione e globali
   - risolve il modello + il profilo auth e costruisce la sessione pi
   - si sottoscrive agli eventi pi e trasmette in streaming i delta assistant/tool
   - applica il timeout -> interrompe l'esecuzione se viene superato
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi di pi-agent-core allo stream OpenClaw `agent`:
   - eventi degli strumenti => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - eventi del ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **lifecycle end/error** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia della sessione) e facoltativamente tramite una corsia globale.
- Questo previene race su strumenti/sessione e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda comandi](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file della sessione. Il lock è
  file-based e consapevole dei processi, quindi intercetta writer che aggirano la coda in-process o arrivano
  da un altro processo.
- I lock di scrittura della sessione non sono reentrant per impostazione predefinita. Se un helper annida intenzionalmente l'acquisizione
  dello stesso lock preservando un singolo writer logico, deve attivarlo esplicitamente con
  `allowReentrant: true`.

## Preparazione della sessione + del workspace

- Il workspace viene risolto e creato; le esecuzioni sandboxed possono essere reindirizzate a una radice workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e inserite in env e prompt.
- I file bootstrap/contesto vengono risolti e inseriti nel report del system prompt.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  percorso successivo di riscrittura della trascrizione, compaction o troncamento deve acquisire lo stesso lock prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + system prompt

- Il system prompt viene costruito a partire dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto bootstrap e dagli override per esecuzione.
- I limiti specifici del modello e i token di riserva per la Compaction vengono applicati.
- Vedi [System prompt](/it/concepts/system-prompt) per ciò che vede il modello.

## Hook point (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script event-driven per comandi ed eventi del ciclo di vita.
- **Hook plugin**: punti di estensione all'interno del ciclo di vita dell'agente/degli strumenti e della pipeline Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito mentre vengono costruiti i file bootstrap prima che il system prompt sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi documento Hooks).

Vedi [Hooks](/it/automation/hooks) per configurazione ed esempi.

### Hook plugin (ciclo di vita di agente + gateway)

Questi vengono eseguiti dentro il loop dell'agente o nella pipeline Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per inserire `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi del contesto di sistema per indicazioni stabili che devono stare nello spazio del system prompt.
- **`before_agent_start`**: hook legacy di compatibilità che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, consentendo a un plugin di rivendicare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osservano o annotano i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercettano parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e può opzionalmente bloccare installazioni di Skills o plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti nella trascrizione della sessione.
- **`message_received` / `message_sending` / `message_sent`**: hook dei messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del Gateway.

Regole decisionali degli hook per guardie in uscita/degli strumenti:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_install`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` è una no-op e non annulla una cancellazione precedente.

Vedi [Hook plugin](/it/plugins/architecture#provider-runtime-hooks) per l'API degli hook e i dettagli di registrazione.

## Streaming + risposte parziali

- I delta assistant vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Il block streaming può emettere risposte parziali su `text_end` oppure `message_end`.
- Lo streaming del reasoning può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il chunking e il comportamento delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima del logging/dell'emissione.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme assistant duplicate.

## Modellazione della risposta + soppressione

- I payload finali vengono assemblati a partire da:
  - testo assistant (e reasoning opzionale)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore assistant quando il modello genera un errore
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai
  payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non restano payload renderizzabili e uno strumento ha restituito un errore, viene emessa
  una risposta fallback di errore dello strumento
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compaction + ritentativi

- La Compaction automatica emette eventi stream `compaction` e può attivare un ritentativo.
- In caso di ritentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi degli strumenti in streaming da pi-agent-core

## Gestione del canale chat

- I delta assistant vengono bufferizzati in messaggi chat `delta`.
- Un chat `final` viene emesso su **lifecycle end/error**.

## Timeout

- Valore predefinito di `agent.wait`: 30s (solo per l'attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime dell'agente: valore predefinito `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Timeout di inattività LLM: `agents.defaults.llm.idleTimeoutSeconds` interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. Impostalo esplicitamente per modelli locali lenti o provider di reasoning/tool-call; impostalo a 0 per disabilitarlo. Se non è impostato, OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, altrimenti 120s. Le esecuzioni attivate da Cron senza timeout LLM o dell'agente esplicito disabilitano il watchdog di inattività e si affidano al timeout esterno di Cron.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non ferma l'agente)

## Correlati

- [Tools](/it/tools) — strumenti dell'agente disponibili
- [Hooks](/it/automation/hooks) — script event-driven attivati da eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riepilogate le conversazioni lunghe
- [Exec Approvals](/it/tools/exec-approvals) — gate di approvazione per i comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/reasoning
