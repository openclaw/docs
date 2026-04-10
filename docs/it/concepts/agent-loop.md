---
read_when:
    - Hai bisogno di una guida dettagliata esatta del loop dell'agente o degli eventi del ciclo di vita
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: Loop dell'agente
x-i18n:
    generated_at: "2026-04-10T08:13:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6831a5b11e9100e49f650feca51ab44a2bef242ce1b5db2766d0b3b5c5ba729
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop dell'agente (OpenClaw)

Un loop agentico è l'esecuzione completa e “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello elabora, chiama strumenti e trasmette l'output in streaming. Questo documento spiega come questo loop autentico è
collegato end-to-end.

## Punti di ingresso

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (panoramica)

1. L'RPC `agent` convalida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione e restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve i valori predefiniti di model + thinking/verbose
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime di pi-agent-core)
   - emette **lifecycle end/error** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per-sessione e globali
   - risolve il profilo model + auth e costruisce la sessione pi
   - si sottoscrive agli eventi pi e trasmette in streaming i delta assistant/tool
   - applica il timeout -> interrompe l'esecuzione se superato
   - restituisce payload e metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi di pi-agent-core allo stream `agent` di OpenClaw:
   - eventi degli strumenti => `stream: "tool"`
   - delta dell'assistente => `stream: "assistant"`
   - eventi del ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **lifecycle end/error** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e facoltativamente tramite una corsia globale.
- Questo previene race condition tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Command Queue](/it/concepts/queue).

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni sandboxed possono reindirizzare a una radice workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell'env e nel prompt.
- I file bootstrap/context vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito a partire dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per la compattazione.
- Vedi [System prompt](/it/concepts/system-prompt) per sapere cosa vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook del Gateway): script guidati da eventi per comandi ed eventi del ciclo di vita.
- **Hook plugin**: punti di estensione all'interno del ciclo di vita dell'agente/degli strumenti e della pipeline del gateway.

### Hook interni (hook del Gateway)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file bootstrap prima che il prompt di sistema venga finalizzato.
  Usalo per aggiungere/rimuovere file di contesto bootstrap.
- **Hook di comando**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi il documento Hooks).

Vedi [Hooks](/it/automation/hooks) per configurazione ed esempi.

### Hook plugin (ciclo di vita di agente + gateway)

Questi vengono eseguiti all'interno del loop dell'agente o della pipeline del gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/model prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per-turno e i campi di contesto di sistema per indicazioni stabili che dovrebbero stare nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in una delle due fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, permettendo a un plugin di prendere in carico il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di compattazione.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e può facoltativamente bloccare installazioni di skill o plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti nella trascrizione della sessione.
- **`message_received` / `message_sending` / `message_sent`**: hook per messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del gateway.

Regole decisionali degli hook per le protezioni su uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e interrompe gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una cancellazione precedente.

Vedi [Plugin hooks](/it/plugins/architecture#provider-runtime-hooks) per l'API degli hook e i dettagli di registrazione.

## Streaming + risposte parziali

- I delta dell'assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima della registrazione/emissione.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell'assistente.

## Modellazione della risposta + soppressione

- I payload finali vengono assemblati da:
  - testo dell'assistente (e ragionamento facoltativo)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore dell'assistente quando il modello genera un errore
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai
  payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non rimangono payload renderizzabili e uno strumento ha generato un errore, viene emessa una risposta di fallback per l'errore dello strumento
  (a meno che uno strumento di messaggistica abbia già inviato una risposta visibile all'utente).

## Compattazione + retry

- La compattazione automatica emette eventi di stream `compaction` e può attivare un retry.
- Al retry, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di compattazione.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi degli strumenti in streaming da pi-agent-core

## Gestione del canale chat

- I delta dell'assistente vengono bufferizzati in messaggi chat `delta`.
- Un `final` della chat viene emesso su **lifecycle end/error**.

## Timeout

- Valore predefinito di `agent.wait`: 30s (solo per l'attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime dell'agente: valore predefinito `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Timeout di inattività LLM: `agents.defaults.llm.idleTimeoutSeconds` interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. Impostalo esplicitamente per modelli locali lenti o provider di ragionamento/chiamata strumenti; impostalo a 0 per disabilitarlo. Se non è impostato, OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, altrimenti 120s. Le esecuzioni attivate da cron senza timeout LLM o dell'agente esplicito disabilitano il watchdog di inattività e si affidano al timeout esterno del cron.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non ferma l'agente)

## Correlati

- [Tools](/it/tools) — strumenti dell'agente disponibili
- [Hooks](/it/automation/hooks) — script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riepilogate le conversazioni lunghe
- [Exec Approvals](/it/tools/exec-approvals) — controlli di approvazione per i comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/ragionamento
