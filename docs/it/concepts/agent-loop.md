---
read_when:
    - Ti serve una guida dettagliata precisa del ciclo dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture delle trascrizioni o il comportamento del blocco di scrittura delle sessioni
summary: Ciclo di vita del loop dell'agente, flussi e semantica di attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-05-02T20:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un loop agentico è l’esecuzione completa e “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autoritativo che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico sia
collegato end-to-end.

## Punti di ingresso

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (ad alto livello)

1. L’RPC `agent` convalida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione, restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l’agente:
   - risolve i valori predefiniti di modello + thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **fine/errore del ciclo di vita** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve il modello + profilo di autenticazione e costruisce la sessione Pi
   - si sottoscrive agli eventi Pi e trasmette in streaming delta di assistente/strumenti
   - applica il timeout -> interrompe l’esecuzione se superato
   - per i turni app-server di Codex, interrompe un turno accettato che smette di produrre avanzamento app-server prima di un evento terminale
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi pi-agent-core allo stream `agent` di OpenClaw:
   - eventi strumenti => `stream: "tool"`
   - delta dell’assistente => `stream: "assistant"`
   - eventi di ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **fine/errore del ciclo di vita** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e, opzionalmente, tramite una corsia globale.
- Questo evita race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/it/concepts/queue).
- Le scritture della trascrizione sono protette anche da un blocco di scrittura della sessione sul file di sessione. Il blocco è
  consapevole del processo e basato su file, quindi intercetta writer che aggirano la coda in-process o provengono
  da un altro processo. I writer della trascrizione di sessione attendono fino a `session.writeLock.acquireTimeoutMs`
  prima di segnalare la sessione come occupata; il valore predefinito è `60000` ms.
- I blocchi di scrittura della sessione non sono rientranti per impostazione predefinita. Se un helper annida intenzionalmente l’acquisizione
  dello stesso blocco preservando un unico writer logico, deve aderire esplicitamente con
  `allowReentrant: true`.

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono reindirizzare a una radice di workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell’ambiente e nel prompt.
- I file di bootstrap/contesto vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un blocco di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  percorso successivo di riscrittura della trascrizione, Compaction o troncamento deve acquisire lo stesso blocco prima di aprire o
  mutare il file di trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito dal prompt di base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva della Compaction.
- Vedi [Prompt di sistema](/it/concepts/system-prompt) per cosa vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script guidati da eventi per comandi ed eventi del ciclo di vita.
- **Hook Plugin**: punti di estensione all’interno del ciclo di vita agente/strumento e della pipeline Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file di bootstrap prima che il prompt di sistema sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto di bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi documento Hook).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook Plugin (ciclo di vita agente + Gateway)

Questi vengono eseguiti all’interno del loop agente o della pipeline Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere deterministicamente provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell’invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che dovrebbero trovarsi nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, consentendo a un Plugin di reclamare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l’elenco finale dei messaggi e i metadati di esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e, opzionalmente, blocca installazioni di skill o Plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà di OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook dei messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita Gateway.

Regole decisionali degli hook per protezioni in uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e arresta gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale e arresta gli handler a priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e arresta gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Vedi [Hook Plugin](/it/plugins/hooks) per l’API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L’harness app-server di Codex mantiene
gli hook Plugin di OpenClaw come contratto di compatibilità per le superfici replicate documentate,
mentre gli hook nativi di Codex restano un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta dell’assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` oppure su `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e risposta a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di inizio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensioni e payload immagine prima di essere registrati/emessi.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell’assistente.

## Modellazione + soppressione della risposta

- I payload finali vengono assemblati da:
  - testo dell’assistente (e ragionamento opzionale)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore dell’assistente quando il modello va in errore
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai payload
  in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall’elenco finale dei payload.
- Se non rimangono payload renderizzabili e uno strumento è andato in errore, viene emessa una risposta di fallback di errore dello strumento
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all’utente).

## Compaction + tentativi

- La Compaction automatica emette eventi stream `compaction` e può attivare un nuovo tentativo.
- Al nuovo tentativo, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta trasmessi in streaming da pi-agent-core
- `tool`: eventi strumenti trasmessi in streaming da pi-agent-core

## Gestione dei canali di chat

- I delta dell’assistente vengono bufferizzati in messaggi chat `delta`.
- Un `final` chat viene emesso su **fine/errore del ciclo di vita**.

## Timeout

- Valore predefinito di `agent.wait`: 30s (solo l’attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime agente: valore predefinito di `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` del turno agente isolato è di proprietà di cron. Lo scheduler avvia quel timer quando l’esecuzione inizia, interrompe l’esecuzione sottostante alla scadenza configurata, quindi esegue una pulizia limitata prima di registrare il timeout così che una sessione figlia obsoleta non possa mantenere bloccata la corsia.
- Diagnostica di vitalità della sessione: con la diagnostica abilitata, `diagnostics.stuckSessionWarnMs` classifica sessioni `processing` lunghe che non hanno alcuna risposta, strumento, stato, blocco o avanzamento ACP osservati. Le esecuzioni incorporate attive, le chiamate al modello e le chiamate agli strumenti vengono segnalate come `session.long_running`; il lavoro attivo senza avanzamento recente viene segnalato come `session.stalled`; `session.stuck` è riservato alla contabilità di sessione obsoleta senza lavoro attivo, e solo quel percorso rilascia la corsia di sessione interessata così che il lavoro di avvio in coda possa defluire. Le diagnostiche `session.stuck` ripetute applicano backoff mentre la sessione rimane invariata.
- Timeout di inattività del modello: OpenClaw interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per provider locali/autogestiti lenti; altrimenti OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, con limite predefinito a 120s. Le esecuzioni attivate da Cron senza timeout esplicito del modello o dell’agente disabilitano il watchdog di inattività e si affidano al timeout esterno di cron.
- Timeout richiesta HTTP del provider: `models.providers.<id>.timeoutSeconds` si applica ai fetch HTTP del modello di quel provider, inclusi connessione, header, corpo, timeout richiesta SDK, gestione totale dell’interruzione guarded-fetch e watchdog di inattività dello stream del modello. Usalo per provider locali/autogestiti lenti come Ollama prima di aumentare il timeout dell’intero runtime agente.

## Dove le cose possono terminare in anticipo

- Timeout agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione Gateway o timeout RPC
- Timeout `agent.wait` (solo attesa, non arresta l’agente)

## Correlati

- [Strumenti](/it/tools) — strumenti agente disponibili
- [Hook](/it/automation/hooks) — script guidati da eventi attivati da eventi del ciclo di vita dell’agente
- [Compaction](/it/concepts/compaction) — come vengono riassunte le conversazioni lunghe
- [Approvazioni exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/ragionamento
