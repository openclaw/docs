---
read_when:
    - Ti serve una guida dettagliata precisa del ciclo dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture della trascrizione o il comportamento del blocco di scrittura della sessione
summary: Ciclo di vita del ciclo operativo dell'agente, flussi e semantica di attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-04-30T08:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un ciclo agentico è l'esecuzione “reale” completa di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un ciclo è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel ciclo autentico è
collegato end-to-end.

## Punti di ingresso

- RPC Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (panoramica)

1. L'RPC `agent` convalida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione, restituisce subito `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve il modello + i valori predefiniti di thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **fine/errore del ciclo di vita** se il ciclo incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve il modello + il profilo di autenticazione e costruisce la sessione Pi
   - si sottoscrive agli eventi Pi e trasmette in streaming delta di assistente/strumenti
   - applica il timeout -> interrompe l'esecuzione se superato
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi di pi-agent-core allo stream `agent` di OpenClaw:
   - eventi degli strumenti => `stream: "tool"`
   - delta dell'assistente => `stream: "assistant"`
   - eventi del ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **fine/errore del ciclo di vita** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia della sessione) e facoltativamente attraverso una corsia globale.
- Questo evita race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file di sessione. Il lock è
  consapevole del processo e basato su file, quindi intercetta gli scrittori che aggirano la coda in-process o provengono da
  un altro processo.
- I lock di scrittura della sessione sono non rientranti per impostazione predefinita. Se un helper nidifica intenzionalmente l'acquisizione dello
  stesso lock preservando un singolo scrittore logico, deve aderire esplicitamente con
  `allowReentrant: true`.

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono essere reindirizzate a una radice di workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell'ambiente e nel prompt.
- I file di bootstrap/contesto vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  percorso successivo di riscrittura, Compaction o troncamento della trascrizione deve acquisire lo stesso lock prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per Compaction.
- Vedi [Prompt di sistema](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script guidati da eventi per comandi ed eventi del ciclo di vita.
- **Hook dei Plugin**: punti di estensione dentro il ciclo di vita agente/strumento e la pipeline Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file di bootstrap prima che il prompt di sistema venga finalizzato.
  Usalo per aggiungere/rimuovere file di contesto di bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi il documento sugli Hook).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook dei Plugin (ciclo di vita agente + Gateway)

Questi vengono eseguiti dentro il ciclo dell'agente o la pipeline Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere deterministamente provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che devono stare nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, permettendo a un Plugin di rivendicare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e opzionalmente blocca installazioni di Skill o Plugin.
- **`tool_result_persist`**: trasforma sincronicamente i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà di OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook per messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita Gateway.

Regole decisionali degli hook per protezioni in uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e interrompe gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Vedi [Hook dei Plugin](/it/plugins/hooks) per l'API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L'harness app-server di Codex mantiene
gli hook Plugin di OpenClaw come contratto di compatibilità per le superfici rispecchiate documentate,
mentre gli hook nativi di Codex restano un meccanismo Codex di livello inferiore separato.

## Streaming + risposte parziali

- I delta dell'assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima di logging/emissione.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell'assistente.

## Modellazione + soppressione delle risposte

- I payload finali vengono assemblati da:
  - testo dell'assistente (e ragionamento opzionale)
  - riepiloghi inline degli strumenti (quando verbose + consentiti)
  - testo di errore dell'assistente quando il modello genera errori
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai payload
  in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non rimangono payload renderizzabili e uno strumento ha generato un errore, viene emessa una risposta di errore dello strumento di fallback
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compaction + nuovi tentativi

- La Compaction automatica emette eventi dello stream `compaction` e può attivare un nuovo tentativo.
- Al nuovo tentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi degli strumenti in streaming da pi-agent-core

## Gestione dei canali chat

- I delta dell'assistente vengono bufferizzati in messaggi chat `delta`.
- Un `final` chat viene emesso su **fine/errore del ciclo di vita**.

## Timeout

- Predefinito di `agent.wait`: 30s (solo l'attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime agente: valore predefinito di `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` del turno agente isolato è di proprietà di cron. Lo scheduler avvia quel timer quando inizia l'esecuzione, interrompe l'esecuzione sottostante alla scadenza configurata, quindi esegue una pulizia limitata prima di registrare il timeout, così una sessione figlia obsoleta non può tenere bloccata la corsia.
- Ripristino da sessione bloccata: con diagnostica abilitata, `diagnostics.stuckSessionWarnMs` rileva sessioni `processing` lunghe. Esecuzioni incorporate attive, operazioni di risposta attive e attività della corsia di sessione attive restano solo di avviso per impostazione predefinita; se la diagnostica non mostra lavoro attivo per la sessione, il watchdog rilascia la corsia di sessione interessata così il lavoro di avvio accodato può svuotarsi.
- Timeout di inattività del modello: OpenClaw interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per provider locali/self-hosted lenti; altrimenti OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, con limite predefinito a 120s. Le esecuzioni attivate da Cron senza timeout esplicito del modello o dell'agente disabilitano il watchdog di inattività e si affidano al timeout esterno di Cron.
- Timeout delle richieste HTTP del provider: `models.providers.<id>.timeoutSeconds` si applica alle fetch HTTP del modello di quel provider, inclusi connessione, header, corpo, timeout della richiesta SDK, gestione dell'abort totale della guarded-fetch e watchdog di inattività dello stream del modello. Usalo per provider locali/self-hosted lenti come Ollama prima di aumentare il timeout dell'intero runtime agente.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (abort)
- AbortSignal (cancel)
- Disconnessione Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non ferma l'agente)

## Correlati

- [Strumenti](/it/tools) — strumenti agente disponibili
- [Hook](/it/automation/hooks) — script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riassunte le conversazioni lunghe
- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/ragionamento
