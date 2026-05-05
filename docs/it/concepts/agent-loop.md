---
read_when:
    - Ti serve una guida passo passo precisa del ciclo dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture della trascrizione o il comportamento del blocco di scrittura della sessione
summary: Ciclo di vita del ciclo dell'agente, flussi e semantica dell'attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-05-05T06:16:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un loop agentico è l’esecuzione completa “reale” di un agente: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico sia
collegato end-to-end.

## Punti di ingresso

- RPC Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (ad alto livello)

1. L’RPC `agent` valida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione, restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l’agente:
   - risolve modello + impostazioni predefinite di thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **fine/errore del ciclo di vita** se il loop integrato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve modello + profilo di autenticazione e costruisce la sessione Pi
   - si sottoscrive agli eventi Pi e trasmette delta assistente/strumento
   - applica il timeout -> interrompe l’esecuzione se viene superato
   - per i turni dell’app-server Codex, interrompe un turno accettato che smette di produrre avanzamento app-server prima di un evento terminale
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi pi-agent-core allo stream OpenClaw `agent`:
   - eventi strumento => `stream: "tool"`
   - delta assistente => `stream: "assistant"`
   - eventi di ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **fine/errore del ciclo di vita** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e, opzionalmente, tramite una corsia globale.
- Questo previene race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/it/concepts/queue).
- Le scritture della trascrizione sono inoltre protette da un blocco di scrittura della sessione sul file di sessione. Il blocco è
  consapevole del processo e basato su file, quindi rileva writer che bypassano la coda in-process o provengono
  da un altro processo. I writer della trascrizione di sessione attendono fino a `session.writeLock.acquireTimeoutMs`
  prima di segnalare la sessione come occupata; il valore predefinito è `60000` ms.
- I blocchi di scrittura della sessione sono non rientranti per impostazione predefinita. Se un helper annida intenzionalmente l’acquisizione dello
  stesso blocco preservando un singolo writer logico, deve abilitarlo esplicitamente con
  `allowReentrant: true`.

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono reindirizzare a una radice di workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell’ambiente e nel prompt.
- I file di bootstrap/contesto vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un blocco di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  successivo percorso di riscrittura, Compaction o troncamento della trascrizione deve acquisire lo stesso blocco prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito dal prompt di base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per la Compaction.
- Vedi [Prompt di sistema](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script basati su eventi per comandi ed eventi del ciclo di vita.
- **Hook Plugin**: punti di estensione all’interno del ciclo di vita agente/strumento e della pipeline Gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la creazione dei file di bootstrap prima che il prompt di sistema sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto di bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi documento sugli hook).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook Plugin (ciclo di vita agente + gateway)

Questi vengono eseguiti all’interno del loop dell’agente o della pipeline Gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell’invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che devono risiedere nello spazio del prompt di sistema.
- **`before_agent_start`**: hook legacy di compatibilità che può essere eseguito in una delle due fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, consentendo a un Plugin di rivendicare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l’elenco finale dei messaggi e i metadati dell’esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e, opzionalmente, blocca installazioni di Skills o Plugin.
- **`tool_result_persist`**: trasforma in modo sincrono i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà di OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook per messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del Gateway.

Regole decisionali degli hook per protezioni in uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non rimuove un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non rimuove un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non rimuove una cancellazione precedente.

Vedi [Hook Plugin](/it/plugins/hooks) per l’API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L’harness app-server Codex mantiene
gli hook Plugin di OpenClaw come contratto di compatibilità per le superfici documentate replicate,
mentre gli hook nativi Codex restano un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta assistente vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` oppure su `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di suddivisione in chunk e delle risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima di logging/emissione.
- Gli invii tramite strumenti di messaggistica vengono tracciati per sopprimere conferme assistente duplicate.

## Modellazione + soppressione delle risposte

- I payload finali sono assemblati da:
  - testo assistente (e ragionamento opzionale)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore assistente quando il modello genera un errore
- Il token esatto di silenzio `NO_REPLY` / `no_reply` viene filtrato dai payload
  in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall’elenco finale dei payload.
- Se non rimangono payload renderizzabili e uno strumento ha generato un errore, viene emessa una risposta di errore strumento di fallback
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all’utente).

## Compaction + retry

- La Compaction automatica emette eventi stream `compaction` e può attivare un retry.
- Al retry, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta trasmessi in streaming da pi-agent-core
- `tool`: eventi strumento trasmessi in streaming da pi-agent-core

## Gestione dei canali chat

- I delta assistente vengono bufferizzati in messaggi chat `delta`.
- Un chat `final` viene emesso su **fine/errore del ciclo di vita**.

## Timeout

- Valore predefinito di `agent.wait`: 30 s (solo l’attesa). Il parametro `timeoutMs` lo sovrascrive.
- Runtime dell’agente: valore predefinito di `agents.defaults.timeoutSeconds` 172800 s (48 ore); applicato nel timer di interruzione di `runEmbeddedPiAgent`.
- Runtime Cron: il `timeoutSeconds` del turno agente isolato è di proprietà di Cron. Lo scheduler avvia quel timer quando l’esecuzione inizia, interrompe l’esecuzione sottostante alla scadenza configurata, quindi esegue una pulizia limitata prima di registrare il timeout, così una sessione figlia obsoleta non può mantenere la corsia bloccata.
- Diagnostica di vitalità della sessione: con la diagnostica abilitata, `diagnostics.stuckSessionWarnMs` classifica sessioni `processing` lunghe che non hanno alcuna risposta, strumento, stato, blocco o avanzamento ACP osservato. Esecuzioni integrate attive, chiamate al modello e chiamate agli strumenti sono riportate come `session.long_running`; lavoro attivo senza avanzamento recente è riportato come `session.stalled`; `session.stuck` è riservato alla contabilità di sessioni obsolete senza lavoro attivo. La contabilità di sessioni obsolete rilascia immediatamente la corsia di sessione interessata; le esecuzioni integrate in stallo vengono interrotte e svuotate solo dopo `diagnostics.stuckSessionAbortMs` (predefinito: almeno 10 minuti e 5 volte la soglia di avviso), così il lavoro in coda può riprendere senza troncare esecuzioni semplicemente lente. Il ripristino emette esiti strutturati richiesti/completati, e lo stato diagnostico viene contrassegnato come inattivo solo se la stessa generazione di elaborazione è ancora corrente. Le diagnostiche `session.stuck` ripetute applicano backoff mentre la sessione rimane invariata.
- Timeout di inattività del modello: OpenClaw interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per provider locali/self-hosted lenti; altrimenti OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, con un limite predefinito di 120 s. Le esecuzioni avviate da Cron senza timeout esplicito del modello o dell’agente disabilitano il watchdog di inattività e si affidano al timeout esterno di Cron.
- Timeout della richiesta HTTP del provider: `models.providers.<id>.timeoutSeconds` si applica alle fetch HTTP del modello per quel provider, inclusi connessione, header, corpo, timeout richiesta SDK, gestione completa dell’interruzione guarded-fetch e watchdog di inattività dello stream del modello. Usalo per provider locali/self-hosted lenti come Ollama prima di aumentare il timeout dell’intero runtime dell’agente.

## Dove le cose possono terminare in anticipo

- Timeout agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione Gateway o timeout RPC
- Timeout `agent.wait` (solo attesa, non ferma l’agente)

## Correlati

- [Strumenti](/it/tools) — strumenti agente disponibili
- [Hook](/it/automation/hooks) — script basati su eventi attivati da eventi del ciclo di vita dell’agente
- [Compaction](/it/concepts/compaction) — come vengono riassunte le conversazioni lunghe
- [Approvazioni exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/ragionamento
