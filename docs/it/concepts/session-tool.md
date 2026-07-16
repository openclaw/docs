---
read_when:
    - Si desidera comprendere quali strumenti di sessione sono disponibili per l'agente
    - Si desidera configurare l'accesso tra sessioni o la creazione di sub-agenti
    - Si desidera controllare lo stato dei sottoagenti avviati
summary: Strumenti dell’agente per stato tra sessioni, richiamo, messaggistica e orchestrazione dei sottoagenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-07-16T14:20:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw fornisce agli agenti strumenti per operare tra sessioni, esaminare lo stato e orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento          | Funzione                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri facoltativi (tipo, etichetta, agente, archivio, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e, facoltativamente, attende         |
| `sessions_spawn`   | Avvia una sessione isolata di un sotto-agente per attività in background    |
| `sessions_yield`   | Termina il turno corrente e attende i risultati successivi dei sotto-agenti |
| `subagents`        | Elenca lo stato dei sotto-agenti avviati per questa sessione                |
| `session_status`   | Mostra una scheda in stile `/status` e, facoltativamente, imposta una sostituzione del modello per sessione |

Questi strumenti restano soggetti al profilo degli strumenti attivo e ai criteri di autorizzazione/esclusione. `tools.profile: "coding"` include l'intero insieme di orchestrazione delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e `subagents`. `tools.profile: "messaging"` include gli strumenti di messaggistica tra sessioni (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ma non include l'avvio di sotto-agenti. Per mantenere un profilo di messaggistica consentendo comunque la delega nativa, aggiungere:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

I criteri di gruppo, provider, sandbox e per agente possono comunque rimuovere questi strumenti dopo la fase del profilo. Usare `/tools` dalla sessione interessata per esaminare l'elenco effettivo degli strumenti.

## Elenco e lettura delle sessioni

`sessions_list` restituisce le sessioni con chiave, agentId, tipo, canale, modello, conteggi dei token e timestamp. È possibile filtrare per `kinds` (array; valori accettati: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` esatto, `agentId` esatto, testo `search` o recenza (`activeMinutes`). Per impostazione predefinita vengono restituite le sessioni attive; passare `archived: true` per esaminare invece quelle archiviate. Le righe includono lo stato `pinned` e `archived`. Impostare `includeDerivedTitles`, `includeLastMessage` o `messageLimit` (con limite massimo di 20) quando occorre una valutazione in stile casella di posta: un titolo derivato con visibilità limitata all'ambito, un frammento di anteprima dell'ultimo messaggio o un numero limitato di messaggi recenti in ciascuna riga. I titoli derivati e le anteprime vengono prodotti solo per le sessioni che il chiamante può già vedere in base ai criteri di visibilità configurati per gli strumenti di sessione, quindi le sessioni non correlate rimangono nascoste. Quando la visibilità è limitata, `sessions_list` restituisce metadati facoltativi `visibility` che mostrano la modalità effettiva e un avviso che i risultati potrebbero essere limitati dall'ambito.

`sessions_history` recupera la trascrizione della conversazione per una sessione specifica. Per impostazione predefinita, i risultati degli strumenti sono esclusi; passare `includeTools: true` per visualizzarli. Usare `limit` per la parte finale più recente con dimensione limitata. Passare `offset: 0` quando occorrono metadati di paginazione, quindi passare i valori `nextOffset` restituiti per scorrere all'indietro le finestre precedenti della trascrizione OpenClaw senza leggere i file di trascrizione non elaborati. Le pagine con offset esplicito non integrano le importazioni di ripiego dalla CLI esterna; usare la vista predefinita della parte finale più recente (senza `offset`) quando occorre la cronologia di visualizzazione integrata.

La vista restituita è intenzionalmente limitata e filtrata per la sicurezza:

- il testo dell'assistente viene normalizzato prima del recupero:
  - i tag di ragionamento vengono rimossi
  - i blocchi di struttura `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML delle chiamate agli strumenti in testo semplice, come `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e `<function_calls>...</function_calls>`, vengono rimossi, inclusi i payload troncati che non si chiudono correttamente
  - le strutture degradate di chiamata/risultato degli strumenti, come `[Tool Call: ...]`, `[Tool Result ...]` e `[Historical context ...]`, vengono rimosse
  - i token di controllo del modello trapelati, come `<|assistant|>`, altri token ASCII `<|...|>` e le varianti a larghezza intera `<｜...｜>`, vengono rimossi
  - il codice XML non valido delle chiamate agli strumenti di MiniMax, come `<invoke ...>` / `</minimax:tool_call>`, viene rimosso
- il testo simile a credenziali/token viene oscurato prima della restituzione
- i blocchi di testo lunghi vengono troncati
- le cronologie molto grandi possono omettere le righe meno recenti o sostituire una riga eccessivamente grande con `[sessions_history omitted: message too large]`
- lo strumento riporta indicatori riepilogativi come `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` e metadati di paginazione

Entrambi gli strumenti accettano una **chiave di sessione** (come `"main"`) oppure un **ID sessione** ottenuto da una precedente chiamata di elenco.

Se occorre la trascrizione non elaborata esatta, esaminare le righe della trascrizione SQLite limitate all'ambito anziché considerare `sessions_history` un dump non filtrato.

## Invio di messaggi tra sessioni

`sessions_send` recapita un messaggio a un'altra sessione e, facoltativamente, attende la risposta:

- **Invio senza attesa:** impostare `timeoutSeconds: 0` per accodare il messaggio e restituire immediatamente il controllo.
- **Attesa della risposta:** impostare un timeout e ottenere la risposta direttamente.

Le sessioni di chat limitate a un thread, come le chiavi che terminano con `:thread:<id>`, non sono destinazioni `sessions_send` valide. Per il coordinamento tra agenti, usare la chiave della sessione del canale principale, in modo che i messaggi instradati tramite strumenti non compaiano in un thread attivo rivolto agli utenti.

I messaggi e le risposte successive A2A sono contrassegnati come dati tra sessioni nel prompt ricevente (`[Inter-session message ... isUser=false]`) e nella provenienza della trascrizione. L'agente ricevente deve considerarli dati instradati tramite strumenti, non istruzioni scritte direttamente dall'utente finale.

Dopo la risposta della destinazione, OpenClaw può eseguire un **ciclo di risposta reciproca** in cui gli agenti si alternano nell'invio dei messaggi (fino a `session.agentToAgent.maxPingPongTurns`, intervallo 0-20, valore predefinito 5). L'agente di destinazione può rispondere `REPLY_SKIP` per interrompere anticipatamente.

Passare `watch: true` per registrare anche il mittente come osservatore delle modifiche di stato della destinazione: quando successivamente un altro attore invia alla destinazione un messaggio umano diretto o ne modifica l'obiettivo, il mittente riceve una notifica di sistema che rimanda a `session_status` `changesSince`. La registrazione avviene dopo l'invio riuscito, riguarda la sessione che ha effettivamente ricevuto il messaggio e inizia dalla versione corrente del suo stato, quindi solo le modifiche successive producono notifiche. Il risultato riporta `watched: true` quando la registrazione è riuscita. Consultare [Consapevolezza dello stato della sessione](/concepts/session-state).

## Strumenti ausiliari di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione corrente o un'altra sessione visibile. Riporta utilizzo, tempo, stato del modello/runtime e, se presente, il contesto delle attività in background collegate. Come `/status`, può integrare i contatori incompleti di token/cache usando l'ultima voce di utilizzo della trascrizione, mentre `model=default` rimuove una sostituzione specifica della sessione. Usare `sessionKey="current"` per la sessione corrente del chiamante; le etichette visibili del client, come `openclaw-tui`, non sono chiavi di sessione.

Quando sono disponibili i metadati di instradamento, `session_status` include anche un blocco JSON visibile `Route context` e i corrispondenti campi strutturati `details`. Questi campi distinguono la chiave della sessione dall'instradamento che sta attualmente gestendo l'esecuzione attiva:

- `origin` indica dove è stata creata la sessione oppure il provider dedotto dal prefisso di una chiave di sessione recapitabile quando negli stati meno recenti mancano i metadati di origine memorizzati.
- `active` è l'instradamento dell'esecuzione attiva corrente. Viene riportato solo per la sessione attiva o corrente gestita in questo momento.
- `deliveryContext` è l'instradamento di recapito persistente memorizzato nella sessione, che OpenClaw può riutilizzare per recapiti successivi anche quando la superficie attiva è diversa.

## Modifiche dello stato della sessione

OpenClaw conserva un registro persistente dei segnali relativi alle modifiche sostanziali dello stato delle sessioni (messaggi umani diretti alle sessioni osservate, esiti delle esecuzioni figlie, modifiche degli obiettivi, Compaction). Le righe `sessions_list` e `session_status` espongono il valore `stateVersion` della sessione, mentre `session_status` accetta `changesSince: <version>` per restituire gli eventi tipizzati successivi a quella versione, con `historyGap` che segnala esattamente quando la versione richiesta è precedente alla cronologia conservata. Gli osservatori — automaticamente i genitori che avviano sotto-agenti, esplicitamente `sessions_send watch: true` — ricevono un'unica notifica aggregata di stato obsoleto quando un altro attore modifica una sessione osservata.

Consultare [Consapevolezza dello stato della sessione](/concepts/session-state) per il modello completo: tipi di evento, registrazione degli osservatori, protocollo di notifica anti-spam, flusso di riconciliazione e limiti attuali.

`sessions_yield` termina intenzionalmente il turno corrente affinché il messaggio successivo possa essere l'evento di follow-up atteso. Usarlo dopo aver avviato sotto-agenti quando si desidera che i risultati del completamento arrivino come messaggio successivo, anziché creare cicli di polling.

`subagents` è lo strumento ausiliario di visibilità per i sotto-agenti OpenClaw già avviati. Supporta `action: "list"` per esaminare le esecuzioni attive/recenti.

## Avvio di sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per un'attività in background. È sempre non bloccante: restituisce immediatamente un `runId` e un `childSessionKey`. Le esecuzioni native dei sotto-agenti ricevono l'attività delegata nel primo messaggio visibile `[Subagent Task]` della sessione figlia, mentre il prompt di sistema contiene solo le regole di runtime dei sotto-agenti e il contesto di instradamento.

Opzioni principali:

- `runtime: "subagent"` (valore predefinito) oppure `"acp"` per gli agenti con harness esterno.
- Sostituzioni `model` e `thinking` per la sessione figlia.
- `thread: true` per associare l'avvio a un thread di chat (Discord, Slack e così via).
- `sandbox: "require"` per imporre il sandboxing alla sessione figlia.
- `context: "fork"` per i sotto-agenti nativi quando la sessione figlia necessita della trascrizione del richiedente corrente; ometterlo o usare `context: "isolated"` per una sessione figlia pulita. `context: "fork"` è valido solo con `runtime: "subagent"`. Per impostazione predefinita, i sotto-agenti nativi associati a un thread usano `context: "fork"`, salvo diversa indicazione di `threadBindings.defaultSpawnContext`.

I sotto-agenti foglia predefiniti non ricevono gli strumenti di sessione. Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così da poter gestire i propri figli. Le esecuzioni foglia continuano a non ricevere strumenti di orchestrazione ricorsiva.

Al termine, una fase di annuncio pubblica il risultato nel canale del richiedente. Il recapito del completamento conserva, quando disponibile, l'instradamento del thread/argomento associato; se l'origine del completamento identifica solo un canale, OpenClaw può comunque riutilizzare l'instradamento memorizzato nella sessione del richiedente (`lastChannel` / `lastTo`) per il recapito diretto.

Per il comportamento specifico di ACP, consultare [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione sono limitati per circoscrivere ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sotto-agenti avviati |
| `agent` | Tutte le sessioni di questo agente       |
| `all`   | Tutte le sessioni (tra agenti, se configurato) |

Il valore predefinito è `tree`. Le sessioni in sandbox sono limitate a `tree` indipendentemente dalla configurazione.

## Ulteriori letture

- [Gestione delle sessioni](/it/concepts/session): instradamento, ciclo di vita, manutenzione
- [Sottoagenti](/it/tools/subagents): ciclo di vita e consegna delle sessioni figlie
- [Agenti ACP](/it/tools/acp-agents): avvio tramite harness esterno
- [Multi-agente](/it/concepts/multi-agent): architettura multi-agente
- [Configurazione del Gateway](/it/gateway/configuration): opzioni di configurazione dello strumento per le sessioni

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Sfoltimento delle sessioni](/it/concepts/session-pruning)
