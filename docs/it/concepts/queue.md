---
read_when:
    - Modifica dell'esecuzione o della concorrenza della risposta automatica
    - Spiegare le modalità /queue o il comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, impostazioni predefinite e sostituzioni per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-05-04T02:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per impedire collisioni tra più esecuzioni dell'agente, consentendo comunque un parallelismo sicuro tra le sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la contesa per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle corsie svuota ogni corsia con un limite di concorrenza configurabile (predefinito 1 per le corsie non configurate; `main` è predefinita a 4, `subagent` a 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (corsia `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **corsia globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando la registrazione dettagliata è abilitata, le esecuzioni accodate emettono un breve avviso se hanno atteso più di circa 2 secondi prima di iniziare.
- Gli indicatori di digitazione vengono comunque attivati subito all'accodamento (quando supportati dal canale), quindi l'esperienza utente rimane invariata mentre si attende il proprio turno.

## Valori predefiniti

Quando non impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` è l'impostazione predefinita perché mantiene reattivo il turno del modello attivo senza
avviare una seconda esecuzione di sessione. Svuota tutti i messaggi di steering arrivati
prima del successivo confine del modello. Se l'esecuzione corrente non può accettare steering,
OpenClaw ripiega su una voce di coda di followup.

## Modalità della coda

I messaggi in ingresso possono guidare l'esecuzione corrente, attendere un turno di followup, o fare entrambe le cose:

- `steer`: accoda i messaggi di steering nel runtime attivo. Pi consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente ha finito di eseguire le sue chiamate agli strumenti**, prima della successiva chiamata LLM; il server app Codex riceve un singolo `turn/steer` in batch. Se l'esecuzione non sta trasmettendo attivamente in streaming o lo steering non è disponibile, OpenClaw ripiega su una voce di coda di followup.
- `queue` (legacy): vecchio steering uno alla volta. Pi consegna un messaggio di steering accodato a ogni confine del modello; il server app Codex riceve richieste `turn/steer` separate. Preferisci `steer` a meno che non ti serva il comportamento serializzato precedente.
- `followup`: accoda ogni messaggio per un turno successivo dell'agente dopo la fine dell'esecuzione corrente.
- `collect`: combina i messaggi accodati in un **singolo** turno di followup dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare l'instradamento.
- `steer-backlog` (alias `steer+backlog`): esegue lo steering ora **e** conserva lo stesso messaggio per un turno di followup.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.

Steer-backlog significa che puoi ottenere una risposta di followup dopo l'esecuzione guidata, quindi
le superfici di streaming possono sembrare duplicate. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.

Per il comportamento di timing e dipendenze specifico del runtime, vedi
[Coda di steering](/it/concepts/queue-steering). Per il comando esplicito `/steer <message>`,
vedi [Steer](/tools/steer).

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

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` o al legacy `queue` quando lo steering ripiega su followup):

- `debounceMs`: finestra di quiete prima dello svuotamento dei followup accodati. I numeri senza unità sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni di `/queue`.
- `cap`: numero massimo di messaggi accodati per sessione. I valori inferiori a `1` vengono ignorati.
- `drop: "summarize"`: predefinito. Rimuove le voci accodate più vecchie secondo necessità, conserva riepiloghi compatti e li inserisce come prompt di followup sintetico.
- `drop: "old"`: rimuove le voci accodate più vecchie secondo necessità, senza conservare riepiloghi.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Valori predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o memorizzato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` predefinito.

Per le opzioni, le opzioni `/queue` inline o memorizzate prevalgono sulla configurazione. Poi
vengono applicati il debounce specifico del canale (`messages.queue.debounceMsByChannel`), i valori
predefiniti di debounce del Plugin, le opzioni globali `messages.queue` e i valori predefiniti
integrati. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione
per canale.

## Override per sessione

- Invia `/queue <mode>` come comando autonomo per memorizzare la modalità della sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override di sessione.

## Ambito e garanzie

- Si applica alle esecuzioni agent di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La corsia predefinita (`main`) è a livello di processo per ingressi + heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere corsie aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`), così i job in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni isolati degli agent cron mantengono uno slot `cron` mentre la loro esecuzione interna dell'agente usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non-cron mantengono il proprio comportamento di corsia. Queste esecuzioni distaccate vengono tracciate come [attività in background](/it/automation/tasks).
- Le corsie per sessione garantiscono che una sola esecuzione agent tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; solo TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca righe “queued for …ms” per confermare che la coda si stia svuotando.
- Se hai bisogno della profondità della coda, abilita i log dettagliati e osserva le righe di timing della coda.
- Le esecuzioni del server app Codex che accettano un turno e poi smettono di emettere avanzamento vengono interrotte dall'adapter Codex, così la corsia della sessione attiva può essere rilasciata invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che rimangono in `processing` oltre `diagnostics.stuckSessionWarnMs` senza risposta, strumento, stato, blocco o avanzamento ACP osservati vengono classificate in base all'attività corrente. Il lavoro attivo viene registrato come `session.long_running`; il lavoro attivo senza avanzamenti recenti viene registrato come `session.stalled`; `session.stuck` è riservato alla contabilità delle sessioni obsolete senza lavoro attivo, e solo quel percorso può rilasciare la corsia della sessione interessata in modo che il lavoro accodato venga svuotato. Le diagnostiche `session.stuck` ripetute applicano un backoff finché la sessione rimane invariata.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Steer](/tools/steer)
- [Criterio di retry](/it/concepts/retry)
