---
read_when:
    - Ti serve una panoramica esatta del ciclo dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture delle trascrizioni o il comportamento del blocco di scrittura della sessione
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: Ciclo dell'agente
x-i18n:
    generated_at: "2026-06-27T17:23:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un loop agentico è l'esecuzione completa "reale" di un agent: acquisizione → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questa documentazione spiega come quel loop autentico è
collegato end-to-end.

## Punti di ingresso

- RPC Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (ad alto livello)

1. L'RPC `agent` valida i parametri, risolve la sessione (sessionKey/sessionId), persiste i metadati della sessione, restituisce immediatamente `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agent:
   - risolve modello + valori predefiniti per thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedAgent` (runtime agent di OpenClaw)
   - emette **fine/errore del ciclo di vita** se il loop incorporato non ne emette uno
3. `runEmbeddedAgent`:
   - serializza le esecuzioni tramite code per sessione + globali
   - risolve modello + profilo di autenticazione e costruisce la sessione OpenClaw
   - si sottoscrive agli eventi runtime e trasmette in streaming delta di assistant/strumenti
   - applica il timeout -> interrompe l'esecuzione se superato
   - per i turni app-server di Codex, interrompe un turno accettato che smette di produrre avanzamento app-server prima di un evento terminale
   - restituisce payload + metadati di utilizzo
4. `subscribeEmbeddedAgentSession` collega gli eventi del runtime agent allo stream `agent` di OpenClaw:
   - eventi strumento => `stream: "tool"`
   - delta dell'assistant => `stream: "assistant"`
   - eventi di ciclo di vita => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **fine/errore del ciclo di vita** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e facoltativamente tramite una corsia globale.
- Questo impedisce race tra strumenti/sessioni e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (steer/followup/collect/interrupt) che alimentano questo sistema di corsie.
  Vedi [Coda dei comandi](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file di sessione. Il lock è
  consapevole del processo e basato su file, quindi intercetta writer che aggirano la coda in-process o provengono da
  un altro processo. I writer della trascrizione di sessione attendono fino a `session.writeLock.acquireTimeoutMs`
  prima di segnalare la sessione come occupata; il valore predefinito è `60000` ms.
- I lock di scrittura della sessione non sono rientranti per impostazione predefinita. Se un helper annida intenzionalmente l'acquisizione dello
  stesso lock preservando un unico writer logico, deve aderire esplicitamente con
  `allowReentrant: true`.

## Preparazione di sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni in sandbox possono reindirizzare a una radice workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell'env e nel prompt.
- I file di bootstrap/contesto vengono risolti e iniettati nel report del prompt di sistema.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  successivo percorso di riscrittura della trascrizione, compaction o troncamento deve acquisire lo stesso lock prima di aprire o
  mutare il file della trascrizione.

## Assemblaggio del prompt + prompt di sistema

- Il prompt di sistema viene costruito dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto di bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token di riserva per la compaction.
- Vedi [Prompt di sistema](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di hook (dove puoi intercettare)

OpenClaw ha due sistemi di hook:

- **Hook interni** (hook Gateway): script event-driven per comandi ed eventi di ciclo di vita.
- **Hook dei Plugin**: punti di estensione all'interno del ciclo di vita agent/strumento e della pipeline del gateway.

### Hook interni (hook Gateway)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file di bootstrap prima che il prompt di sistema sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto di bootstrap.
- **Hook di comando**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi la documentazione sugli hook).

Vedi [Hook](/it/automation/hooks) per configurazione ed esempi.

### Hook dei Plugin (ciclo di vita agent + gateway)

Questi vengono eseguiti all'interno del loop dell'agent o della pipeline del gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sovrascrivere in modo deterministico provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per turno e i campi di contesto di sistema per indicazioni stabili che devono stare nello spazio del prompt di sistema.
- **`before_agent_start`**: hook di compatibilità legacy che può essere eseguito in entrambe le fasi; preferisci gli hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, permettendo a un plugin di reclamare il turno e restituire una risposta sintetica o silenziare completamente il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona materiale di installazione Skill o plugin preparato dopo l'esecuzione della policy di installazione dell'operatore, quando gli hook dei plugin sono caricati nel processo OpenClaw corrente.
- **`tool_result_persist`**: trasforma sincronicamente i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà di OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook di messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: confini del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del gateway.

Regole decisionali degli hook per guardie in uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e arresta gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale e arresta gli handler con priorità inferiore.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- Usa `security.installPolicy`, non `before_install`, per decisioni allow/block di installazione di proprietà dell'operatore che devono coprire i percorsi CLI di installazione e aggiornamento.
- `message_sending`: `{ cancel: true }` è terminale e arresta gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Vedi [Hook dei Plugin](/it/plugins/hooks) per l'API degli hook e i dettagli di registrazione.

Gli harness possono adattare questi hook in modo diverso. L'harness app-server di Codex mantiene
gli hook dei plugin OpenClaw come contratto di compatibilità per le superfici documentate rispecchiate,
mentre gli hook nativi di Codex rimangono un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta dell'assistant vengono trasmessi in streaming dal runtime agent ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del ragionamento può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e risposta a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi di avvio/aggiornamento/fine degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima di essere registrati/emessi.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme duplicate dell'assistant.

## Modellazione + soppressione delle risposte

- I payload finali vengono assemblati da:
  - testo dell'assistant (e ragionamento facoltativo)
  - riepiloghi inline degli strumenti (quando verbose + consentito)
  - testo di errore dell'assistant quando il modello genera un errore
- Il token silenzioso esatto `NO_REPLY` / `no_reply` viene filtrato dai payload
  in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non restano payload renderizzabili e uno strumento ha generato un errore, viene emessa una risposta di fallback di errore strumento
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compaction + tentativi

- L'auto-compaction emette eventi stream `compaction` e può attivare un nuovo tentativo.
- Al nuovo tentativo, buffer in memoria e riepiloghi degli strumenti vengono reimpostati per evitare output duplicato.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedAgentSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming dal runtime agent
- `tool`: eventi strumento in streaming dal runtime agent

## Gestione dei canali chat

- I delta dell'assistant vengono accumulati in messaggi chat `delta`.
- Un `final` chat viene emesso su **fine/errore del ciclo di vita**.

## Timeout

- Predefinito di `agent.wait`: 30 s (solo l'attesa). Il parametro `timeoutMs` sovrascrive.
- Runtime agent: `agents.defaults.timeoutSeconds` predefinito 172800 s (48 ore); applicato nel timer di interruzione di `runEmbeddedAgent`.
- Runtime Cron: il `timeoutSeconds` isolato del turno agent è di proprietà di cron. Lo scheduler avvia quel timer quando l'esecuzione inizia, interrompe l'esecuzione sottostante alla scadenza configurata, quindi esegue una pulizia limitata prima di registrare il timeout, così una sessione figlia obsoleta non può mantenere bloccata la corsia.
- Diagnostica della vitalità della sessione: con la diagnostica abilitata, `diagnostics.stuckSessionWarnMs` classifica sessioni `processing` lunghe che non hanno risposta, strumento, stato, blocco o avanzamento ACP osservati. Esecuzioni incorporate attive, chiamate modello e chiamate strumento vengono riportate come `session.long_running`; anche le chiamate modello silenziose possedute restano `session.long_running` fino a `diagnostics.stuckSessionAbortMs`, così provider lenti o non in streaming non vengono segnalati come bloccati troppo presto. Il lavoro attivo senza avanzamento recente viene riportato come `session.stalled`; le chiamate modello possedute passano a `session.stalled` al raggiungimento o dopo la soglia di interruzione, e l'attività modello/strumento obsoleta senza proprietario non viene nascosta come long-running. `session.stuck` è riservato alla contabilità recuperabile di sessioni obsolete, incluse sessioni accodate inattive con attività modello/strumento obsoleta senza proprietario. La contabilità di sessione obsoleta rilascia la corsia della sessione interessata immediatamente dopo il superamento dei gate di recupero; le esecuzioni incorporate bloccate vengono drenate con interruzione solo dopo `diagnostics.stuckSessionAbortMs` (predefinito: almeno 5 minuti e 3x la soglia di avviso), così il lavoro accodato può riprendere senza interrompere esecuzioni semplicemente lente. Il recupero emette risultati strutturati richiesti/completati, e lo stato diagnostico viene marcato inattivo solo se la stessa generazione di processing è ancora corrente. Le diagnostiche `session.stuck` ripetute applicano backoff mentre la sessione resta invariata.
- Timeout di inattività del modello: OpenClaw interrompe una richiesta modello quando non arrivano chunk di risposta prima della finestra di inattività. `models.providers.<id>.timeoutSeconds` estende questo watchdog di inattività per provider locali/self-hosted lenti, ma resta comunque limitato da qualsiasi `agents.defaults.timeoutSeconds` inferiore o timeout specifico dell'esecuzione perché questi controllano l'intera esecuzione dell'agent. Altrimenti OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, con limite predefinito a 120 s. Le esecuzioni modello cloud attivate da Cron senza timeout modello o agent esplicito usano lo stesso watchdog di inattività predefinito; con un timeout di esecuzione cron esplicito, gli stalli dello stream del modello cloud sono limitati a 60 s così i fallback del modello configurati possono essere eseguiti prima della scadenza cron esterna. Le esecuzioni modello locali o self-hosted attivate da Cron disabilitano il watchdog implicito a meno che non sia configurato un timeout esplicito, e i timeout espliciti delle esecuzioni cron rimangono la finestra di inattività per provider locali/self-hosted, quindi i provider locali lenti dovrebbero impostare `models.providers.<id>.timeoutSeconds`.
- Timeout della richiesta HTTP del provider: `models.providers.<id>.timeoutSeconds` si applica ai fetch HTTP del modello di quel provider, inclusi connessione, header, corpo, timeout di richiesta SDK, gestione dell'interruzione guarded-fetch totale e watchdog di inattività dello stream del modello. Usalo per provider locali/self-hosted lenti come Ollama prima di aumentare il timeout dell'intero runtime agent, e mantieni il timeout agent/runtime almeno altrettanto alto quando la richiesta modello deve durare più a lungo.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non arresta l'agente)

## Correlato

- [Strumenti](/it/tools) — strumenti disponibili per l'agente
- [Hook](/it/automation/hooks) — script basati su eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riassunte le conversazioni lunghe
- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di pensiero/ragionamento
