---
read_when:
    - Modifica dell'esecuzione o della concorrenza delle risposte automatiche
    - Spiegazione delle modalità di /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, valori predefiniti e sostituzioni per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-07-12T06:58:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializza le esecuzioni di risposta automatica in ingresso (su tutti i canali) tramite una piccola coda interna al processo, per impedire collisioni tra più esecuzioni dell'agente, consentendo comunque un parallelismo sicuro tra le sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in conflitto quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per le risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di incorrere nei limiti di frequenza dei servizi upstream.

## Funzionamento

- Una coda FIFO sensibile alle corsie smaltisce ogni corsia con un limite di concorrenza configurabile (valore predefinito 1 per le corsie non configurate; `main` ha come valore predefinito 4, `subagent` 8).
- `runEmbeddedAgent` accoda in base alla **chiave di sessione** (corsia `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene quindi accodata in una **corsia globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando la registrazione dettagliata è abilitata, le esecuzioni accodate emettono un breve avviso se attendono più di circa 2 secondi prima di iniziare.
- Gli indicatori di digitazione si attivano comunque immediatamente all'accodamento (se supportati dal canale), quindi l'esperienza utente rimane invariata mentre l'esecuzione attende il proprio turno.

## Valori predefiniti

Quando non sono impostati, tutte le superfici dei canali in ingresso utilizzano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

L'indirizzamento nello stesso turno è il comportamento predefinito. Un prompt che arriva durante un'esecuzione viene inserito nel runtime attivo quando questo può accettare l'indirizzamento, evitando di avviare una seconda esecuzione della sessione. Se l'esecuzione attiva non può accettarlo, OpenClaw attende che termini prima di avviare il prompt.

## Modalità della coda

`/queue` controlla il comportamento dei normali messaggi in ingresso quando una sessione ha già un'esecuzione attiva:

- `steer`: inserisce i messaggi nel runtime attivo. OpenClaw recapita tutti i messaggi di indirizzamento in sospeso **dopo che il turno corrente dell'assistente ha terminato di eseguire le chiamate agli strumenti**, prima della chiamata LLM successiva; il server dell'app Codex riceve un unico `turn/steer` aggregato. Se l'esecuzione non sta trasmettendo attivamente o l'indirizzamento non è disponibile, OpenClaw attende che l'esecuzione attiva termini prima di avviare il prompt.
- `followup`: non indirizza. Accoda ogni messaggio per un turno successivo dell'agente, dopo il termine dell'esecuzione corrente.
- `collect`: non indirizza. Raggruppa i messaggi accodati in un **unico** turno successivo dopo la finestra di inattività. Se i messaggi sono destinati a canali/thread diversi, vengono smaltiti singolarmente per preservare l'instradamento.
- `interrupt`: interrompe l'esecuzione attiva per quella sessione, quindi esegue il messaggio più recente.

Per la temporizzazione specifica del runtime e il comportamento delle dipendenze, consulta [Coda di indirizzamento](/it/concepts/queue-steering). Per il comando esplicito `/steer <message>`, consulta [Indirizzamento](/it/tools/steer).

Configura globalmente o per canale tramite `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opzioni della coda

Le opzioni si applicano al recapito degli elementi accodati. `debounceMs` imposta anche la finestra di inattività per l'indirizzamento di Codex in modalità `steer`:

- `debounceMs`: finestra di inattività prima di smaltire i turni successivi accodati o i batch raccolti; nella modalità `steer` di Codex, finestra di inattività prima dell'invio di un `turn/steer` aggregato. I numeri senza unità sono espressi in millisecondi; le opzioni di `/queue` accettano le unità `ms`, `s`, `m`, `h` e `d`.
- `cap`: numero massimo di messaggi accodati per sessione. I valori inferiori a `1` vengono ignorati.
- `drop: "summarize"` (predefinito): elimina le voci accodate meno recenti secondo necessità, conserva riepiloghi compatti e li inserisce come prompt successivo sintetico.
- `drop: "old"`: elimina le voci accodate meno recenti secondo necessità, senza conservarne i riepiloghi.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Valori predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Indirizzamento e streaming

Quando lo streaming del canale è `partial` o `block`, l'indirizzamento può apparire come una serie di brevi risposte visibili mentre l'esecuzione attiva raggiunge i confini del runtime:

- `partial`: l'anteprima può concludersi anticipatamente, quindi ne viene avviata una nuova dopo l'accettazione dell'indirizzamento.
- `block`: blocchi delle dimensioni di una bozza possono produrre lo stesso aspetto sequenziale.
- Senza streaming, quando il runtime non può accettare l'indirizzamento nello stesso turno, questo viene convertito in un turno successivo dopo l'esecuzione attiva.

`steer` non interrompe gli strumenti in esecuzione. Usa `/queue interrupt` quando il messaggio più recente deve interrompere l'esecuzione corrente.

## Precedenza

Per selezionare la modalità, OpenClaw applica il seguente ordine:

1. Sostituzione `/queue` inline o memorizzata per la sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valore predefinito `steer`.

Per le opzioni, quelle di `/queue` inline o memorizzate hanno la precedenza sulla configurazione. Vengono quindi applicati, nell'ordine, il debounce specifico del canale (`messages.queue.debounceMsByChannel`), i valori predefiniti del debounce del Plugin, le opzioni globali di `messages.queue` e i valori predefiniti integrati. `cap` e `drop` sono opzioni globali o di sessione, non chiavi di configurazione per canale.

## Sostituzioni per sessione

- Invia `/queue <steer|followup|collect|interrupt>` come comando autonomo per memorizzare la modalità della coda per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` elimina la sostituzione della sessione.

## Annullamento dei turni accodati

Mentre un prompt rimane nella coda `followup`/`collect` (ad esempio un `chat.send` della TUI o della chat web che arriva mentre è attivo un altro turno), il Gateway mantiene un'**identità di annullamento gestita dal Gateway** per il `runId` del client finché il contenuto accodato non viene eseguito o eliminato. L'identità segue il contenuto incorporato in un riepilogo di eccedenza.

- `chat.abort` con un `runId` specifico annulla quel turno mentre è ancora accodato, se il richiedente è autorizzato (secondo le stesse regole di proprietà delle esecuzioni attive).
- `chat.abort` per una sessione senza `runId` annulla **prima i turni accodati autorizzati**, quindi interrompe le esecuzioni attive autorizzate. Quest'ordine impedisce che lo smaltimento della coda promuova del lavoro in una sessione interrotta solo parzialmente.
- La cancellazione dell'intera coda della sessione senza verifiche per richiedente non costituisce il percorso di arresto per le sessioni con più proprietari.
- Le attese in coda non vengono rappresentate come esecuzioni attive dell'agente in `sessions.list` e non possiedono la semantica di timeout delle esecuzioni attive; solo la fase attiva la possiede.

I client (inclusa la TUI) inoltrano i prompt ricevuti durante l'esecuzione e lasciano che il Gateway applichi la modalità della coda. Esc/`/stop` usa un'interruzione con ambito di sessione, così la perdita degli handle locali non può lasciare in esecuzione un prompt ancora accodato.

## Ambito e garanzie

- Si applica alle esecuzioni di risposta automatica dell'agente su tutti i canali in ingresso che utilizzano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web e così via).
- La corsia predefinita (`main`) è condivisa dall'intero processo per i messaggi in ingresso e gli heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire l'esecuzione parallela di più sessioni.
- Possono esistere corsie aggiuntive (ad esempio `cron`, `cron-nested`, `nested`, `subagent`), così i processi in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni isolati dell'agente Cron occupano uno slot `cron`, mentre la loro esecuzione interna dell'agente usa `cron-nested`; entrambi utilizzano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non Cron mantengono il comportamento della propria corsia. Queste esecuzioni disaccoppiate vengono monitorate come [attività in background](/it/automation/tasks).
- Le corsie per sessione garantiscono che una sola esecuzione dell'agente alla volta acceda a una determinata sessione.
- Nessuna dipendenza esterna né thread di lavoro in background; solo TypeScript e promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca le righe "queued for ...ms" per verificare che la coda venga smaltita.
- Le esecuzioni del server dell'app Codex che accettano un turno e poi smettono di emettere avanzamenti vengono interrotte dall'adattatore Codex, così la corsia della sessione attiva può essere rilasciata invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che rimangono in `processing` oltre `diagnostics.stuckSessionWarnMs` senza alcun avanzamento osservato relativo a risposta, strumento, stato, blocco o ACP vengono classificate in base all'attività corrente:
  - Il lavoro attivo con avanzamenti recenti viene registrato come `session.long_running`. Anche le chiamate silenziose al modello con un proprietario rimangono `session.long_running` fino a `diagnostics.stuckSessionAbortMs`, affinché i provider lenti o senza streaming non vengano segnalati prematuramente come bloccati.
  - Il lavoro attivo senza avanzamenti recenti viene registrato come `session.stalled`; le chiamate al modello con un proprietario, le chiamate agli strumenti bloccate e le esecuzioni incorporate bloccate passano a `session.stalled` al raggiungimento o al superamento della soglia di interruzione. L'attività obsoleta di modelli o strumenti senza proprietario non viene nascosta come esecuzione prolungata.
  - `session.stuck` è riservato ai dati amministrativi obsoleti e recuperabili della sessione, incluse le sessioni accodate inattive con attività obsoleta di modelli o strumenti senza proprietario.
  - `session.stuck` attiva sempre un ripristino che può rilasciare la corsia della sessione interessata. Anche una classificazione `session.stalled` che supera `diagnostics.stuckSessionAbortMs` (chiamata a uno strumento bloccata, chiamata al modello bloccata o esecuzione incorporata bloccata) può attivare un ripristino con interruzione attiva; entrambe le classificazioni possono quindi sbloccare una coda, non soltanto `session.stuck`.
  - Le righe di avviso ripetute nei log per `session.stuck` e `session.long_running` applicano un backoff esponenziale finché la sessione rimane invariata; i tentativi di ripristino continuano comunque a essere eseguiti a ogni impulso dell'heartbeat, indipendentemente dal backoff.

## Contenuti correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Coda di indirizzamento](/it/concepts/queue-steering)
- [Indirizzamento](/it/tools/steer)
- [Criteri per i nuovi tentativi](/it/concepts/retry)
