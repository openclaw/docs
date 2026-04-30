---
read_when:
    - Modifica dell'esecuzione o della concorrenza della risposta automatica
    - Spiegazione delle modalità di /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, valori predefiniti e sostituzioni per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-04-30T08:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per evitare collisioni tra più esecuzioni dell'agente, consentendo comunque parallelismo sicuro tra le sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per lane non configurate; main è predefinita a 4, subagent a 8).
- `runEmbeddedPiAgent` mette in coda per **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi messa in coda in una **lane globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging dettagliato è abilitato, le esecuzioni in coda emettono un breve avviso se hanno atteso più di circa 2s prima di iniziare.
- Gli indicatori di digitazione vengono comunque attivati immediatamente all'inserimento in coda (quando supportati dal canale), quindi l'esperienza utente resta invariata mentre si attende il proprio turno.

## Valori predefiniti

Quando non impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` è il valore predefinito perché mantiene reattivo il turno del modello attivo senza
avviare una seconda esecuzione di sessione. Svuota tutti i messaggi di steering arrivati
prima del limite successivo del modello. Se l'esecuzione corrente non può accettare steering,
OpenClaw ripiega su una voce di coda followup.

## Modalità della coda

I messaggi in ingresso possono guidare l'esecuzione corrente, attendere un turno followup, oppure fare entrambe le cose:

- `steer`: accoda messaggi di steering nel runtime attivo. Pi consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente termina l'esecuzione delle chiamate agli strumenti**, prima della chiamata LLM successiva; l'app-server Codex riceve un unico `turn/steer` in batch. Se l'esecuzione non sta trasmettendo attivamente in streaming o lo steering non è disponibile, OpenClaw ripiega su una voce di coda followup.
- `queue` (legacy): vecchio steering uno alla volta. Pi consegna un messaggio di steering in coda a ogni limite del modello; l'app-server Codex riceve richieste `turn/steer` separate. Preferisci `steer` salvo necessità del comportamento serializzato precedente.
- `followup`: accoda ogni messaggio per un turno agente successivo dopo la fine dell'esecuzione corrente.
- `collect`: aggrega i messaggi in coda in un **singolo** turno followup dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati singolarmente per preservare il routing.
- `steer-backlog` (alias `steer+backlog`): guida ora **e** conserva lo stesso messaggio per un turno followup.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.

Steer-backlog significa che puoi ottenere una risposta followup dopo l'esecuzione guidata, quindi
le superfici di streaming possono apparire come duplicati. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.

Per il timing specifico del runtime e il comportamento delle dipendenze, vedi
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

- `debounceMs`: finestra di quiete prima di svuotare i followup in coda. I numeri senza unità sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni `/queue`.
- `cap`: numero massimo di messaggi in coda per sessione. I valori sotto `1` vengono ignorati.
- `drop: "summarize"`: predefinito. Elimina le voci in coda più vecchie secondo necessità, conserva riassunti compatti e li inserisce come prompt followup sintetico.
- `drop: "old"`: elimina le voci in coda più vecchie secondo necessità, senza conservare riassunti.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Valori predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o memorizzato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` predefinito.

Per le opzioni, le opzioni `/queue` inline o memorizzate prevalgono sulla configurazione. Poi vengono applicati
debounce specifico per canale (`messages.queue.debounceMsByChannel`), valori predefiniti di debounce del plugin,
opzioni globali `messages.queue` e valori predefiniti integrati. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione per canale.

## Override per sessione

- Invia `/queue <mode>` come comando autonomo per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni agente di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è a livello di processo per messaggi in ingresso + heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`) così i job in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni isolati degli agenti cron occupano uno slot `cron` mentre la loro esecuzione interna dell'agente usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non cron mantengono il proprio comportamento di lane. Queste esecuzioni distaccate sono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che una sola esecuzione agente tocchi una data sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; solo TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca righe “queued for …ms” per confermare che la coda si sta svuotando.
- Se ti serve la profondità della coda, abilita i log dettagliati e osserva le righe di timing della coda.
- Quando la diagnostica è abilitata, le sessioni che restano in `processing` oltre `diagnostics.stuckSessionWarnMs` registrano un avviso di sessione bloccata. Esecuzioni embedded attive, operazioni di risposta attive e attività di lane attive restano solo avvisi per impostazione predefinita; la contabilità di avvio obsoleta senza lavoro di sessione attivo può rilasciare la lane della sessione interessata così il lavoro in coda viene svuotato.

## Correlati

- [Gestione sessione](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Criterio di ripetizione](/it/concepts/retry)
