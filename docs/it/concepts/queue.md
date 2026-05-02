---
read_when:
    - Modificare l'esecuzione o la concorrenza della risposta automatica
    - Spiegazione delle modalità di /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, valori predefiniti e override per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-05-02T08:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per impedire che più esecuzioni dell'agente entrino in collisione, consentendo comunque parallelismo sicuro tra le sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per le lane non configurate; main usa 4 per impostazione predefinita, subagent 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **lane globale** (`main` per impostazione predefinita) così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging dettagliato è abilitato, le esecuzioni in coda emettono un breve avviso se hanno atteso più di ~2s prima di partire.
- Gli indicatori di digitazione vengono comunque inviati immediatamente all'accodamento (quando supportati dal canale), quindi l'esperienza utente rimane invariata mentre attendiamo il nostro turno.

## Impostazioni predefinite

Quando non sono impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` è l'impostazione predefinita perché mantiene reattivo il turno del modello attivo senza
avviare una seconda esecuzione di sessione. Svuota tutti i messaggi di steering arrivati
prima del limite successivo del modello. Se l'esecuzione corrente non può accettare steering,
OpenClaw ripiega su una voce di coda di followup.

## Modalità della coda

I messaggi in ingresso possono guidare l'esecuzione corrente, attendere un turno di followup, oppure fare entrambe le cose:

- `steer`: accoda i messaggi di steering nel runtime attivo. Pi consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente ha terminato di eseguire le sue chiamate agli strumenti**, prima della chiamata LLM successiva; Codex app-server riceve un unico `turn/steer` in batch. Se l'esecuzione non sta trasmettendo attivamente in streaming o lo steering non è disponibile, OpenClaw ripiega su una voce di coda di followup.
- `queue` (legacy): vecchio steering uno alla volta. Pi consegna un messaggio di steering accodato a ogni limite del modello; Codex app-server riceve richieste `turn/steer` separate. Preferisci `steer` salvo necessità del comportamento serializzato precedente.
- `followup`: accoda ogni messaggio per un turno agente successivo dopo la fine dell'esecuzione corrente.
- `collect`: aggrega i messaggi accodati in un **singolo** turno di followup dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare l'instradamento.
- `steer-backlog` (anche noto come `steer+backlog`): guida ora **e** conserva lo stesso messaggio per un turno di followup.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.

Steer-backlog significa che puoi ottenere una risposta di followup dopo l'esecuzione guidata, quindi
le superfici di streaming possono sembrare duplicate. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.

Per temporizzazione specifica del runtime e comportamento delle dipendenze, vedi
[Coda di steering](/it/concepts/queue-steering).

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

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` o al `queue` legacy quando lo steering ripiega su followup):

- `debounceMs`: finestra di quiete prima di svuotare i followup accodati. I numeri semplici sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni `/queue`.
- `cap`: numero massimo di messaggi accodati per sessione. I valori sotto `1` sono ignorati.
- `drop: "summarize"`: predefinito. Elimina le voci accodate più vecchie secondo necessità, conserva riassunti compatti e li inietta come prompt di followup sintetico.
- `drop: "old"`: elimina le voci accodate più vecchie secondo necessità, senza preservare riassunti.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o salvato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Predefinito `steer`.

Per le opzioni, le opzioni `/queue` inline o salvate prevalgono sulla configurazione. Poi
vengono applicati debounce specifico per canale (`messages.queue.debounceMsByChannel`), impostazioni predefinite di debounce del Plugin,
opzioni globali `messages.queue` e impostazioni predefinite integrate. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione
per canale.

## Override per sessione

- Invia `/queue <mode>` come comando autonomo per salvare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override di sessione.

## Ambito e garanzie

- Si applica alle esecuzioni dell'agente di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è a livello di processo per inbound + Heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`) così i job in background possono eseguire in parallelo senza bloccare le risposte in ingresso. I turni agente Cron isolati mantengono uno slot `cron` mentre la loro esecuzione agente interna usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non Cron mantengono il proprio comportamento di lane. Queste esecuzioni distaccate sono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che una sola esecuzione dell'agente tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; puro TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca le righe “queued for …ms” per confermare che la coda si stia svuotando.
- Se ti serve la profondità della coda, abilita i log dettagliati e osserva le righe di temporizzazione della coda.
- Le esecuzioni Codex app-server che accettano un turno e poi smettono di emettere progressi vengono interrotte dall'adapter Codex così la lane della sessione attiva può liberarsi invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che rimangono in `processing` oltre `diagnostics.stuckSessionWarnMs` senza risposta, strumento, stato, blocco o progresso ACP osservato vengono classificate in base all'attività corrente. Il lavoro attivo viene registrato come `session.long_running`; il lavoro attivo senza progressi recenti viene registrato come `session.stalled`; `session.stuck` è riservato alla gestione di sessioni obsolete senza lavoro attivo, e solo quel percorso può liberare la lane della sessione interessata così il lavoro accodato viene svuotato. Le diagnostiche `session.stuck` ripetute applicano un backoff mentre la sessione rimane invariata.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Criterio di retry](/it/concepts/retry)
