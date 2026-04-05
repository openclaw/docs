---
read_when:
    - Hai bisogno di una spiegazione esatta del loop dell'agente o degli eventi del ciclo di vita
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: Loop dell'agente
x-i18n:
    generated_at: "2026-04-05T13:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop dell'agente (OpenClaw)

Un loop agentico è l'esecuzione completa e “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, richiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico è
collegato end-to-end.

## Punti di ingresso

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (panoramica)

1. La RPC `agent` valida i parametri, risolve la sessione (sessionKey/sessionId), rende persistenti i metadati della sessione e restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve i valori predefiniti di modello + thinking/verbose
   - carica l'istantanea delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **lifecycle end/error** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve profilo di modello + autenticazione e costruisce la sessione pi
   - si sottoscrive agli eventi pi e trasmette i delta assistant/tool
   - applica il timeout -> interrompe l'esecuzione se viene superato
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi di pi-agent-core allo stream `agent` di OpenClaw:
   - eventi degli strumenti => `stream: "tool"`
   - delta dell'assistente => `stream: "assistant"`
   - eventi del ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **lifecycle end/error** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e facoltativamente tramite una corsia globale.
- Questo previene corse tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/concepts/queue).

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono reindirizzare a una radice del workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da un'istantanea) e inserite in env e prompt.
- I file bootstrap/di contesto vengono risolti e inseriti nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema è costruito a partire dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token riservati per la compattazione.
- Vedi [Prompt di sistema](/concepts/system-prompt) per sapere cosa vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script guidati da eventi per comandi ed eventi del ciclo di vita.
- **Hook dei plugin**: punti di estensione all'interno del ciclo di vita dell'agente/degli strumenti e della pipeline del gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la creazione dei file bootstrap prima che il prompt di sistema sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi la documentazione Hooks).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook dei plugin (ciclo di vita agente + gateway)

Questi vengono eseguiti all'interno del loop dell'agente o della pipeline del gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per inserire `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per linee guida stabili che dovrebbero trovarsi nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata all'LLM, consentendo a un plugin di prendere in carico il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati di esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di compattazione.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e facoltativamente blocca le installazioni di Skills o plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti nella trascrizione della sessione.
- **`message_received` / `message_sending` / `message_sent`**: hook per messaggi in entrata + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del gateway.

Regole decisionali degli hook per le protezioni in uscita/degli strumenti:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma gli handler con priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una cancellazione precedente.

Vedi [Hook dei plugin](/plugins/architecture#provider-runtime-hooks) per l'API degli hook e i dettagli di registrazione.

## Streaming + risposte parziali

- I delta dell'assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming dei blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/concepts/streaming) per il comportamento di chunking e delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di inizio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima della registrazione/emissione.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell'assistente.

## Modellazione della risposta + soppressione

- I payload finali vengono assemblati a partire da:
  - testo dell'assistente (e ragionamento facoltativo)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore dell'assistente quando il modello genera un errore
- Il token esatto di silenzio `NO_REPLY` / `no_reply` viene filtrato dai
  payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non rimangono payload renderizzabili e uno strumento ha generato un errore, viene emessa
  una risposta di fallback per l'errore dello strumento
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compattazione + tentativi ripetuti

- La compattazione automatica emette eventi di stream `compaction` e può attivare un nuovo tentativo.
- Al nuovo tentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compattazione](/concepts/compaction) per la pipeline di compattazione.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta trasmessi in streaming da pi-agent-core
- `tool`: eventi degli strumenti trasmessi in streaming da pi-agent-core

## Gestione del canale chat

- I delta dell'assistente vengono memorizzati nel buffer come messaggi chat `delta`.
- Un `final` della chat viene emesso su **lifecycle end/error**.

## Timeout

- `agent.wait` predefinito: 30s (solo l'attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime dell'agente: `agents.defaults.timeoutSeconds` predefinito 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non interrompe l'agente)

## Correlati

- [Strumenti](/tools) — strumenti disponibili per l'agente
- [Hook](/it/automation/hooks) — script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compattazione](/concepts/compaction) — come vengono riepilogate le conversazioni lunghe
- [Approvazioni Exec](/tools/exec-approvals) — controlli di approvazione per i comandi shell
- [Thinking](/tools/thinking) — configurazione del livello di thinking/ragionamento
