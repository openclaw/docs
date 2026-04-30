---
read_when:
    - Modifica dell'esecuzione o della concorrenza della risposta automatica
    - Spiegazione delle modalità /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, impostazioni predefinite e sovrascritture per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-04-30T18:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per evitare collisioni tra più esecuzioni dell'agente, consentendo comunque un parallelismo sicuro tra sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono collidere quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle corsie svuota ogni corsia con un limite di concorrenza configurabile (predefinito 1 per le corsie non configurate; main predefinito a 4, subagent a 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (corsia `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **corsia globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging dettagliato è abilitato, le esecuzioni in coda emettono un breve avviso se hanno atteso più di circa 2 s prima di iniziare.
- Gli indicatori di digitazione partono comunque immediatamente all'accodamento (quando supportati dal canale), quindi l'esperienza utente resta invariata mentre si attende il proprio turno.

## Impostazioni predefinite

Quando non impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` è il valore predefinito perché mantiene reattivo il turno del modello attivo senza
avviare una seconda esecuzione di sessione. Svuota tutti i messaggi di steering arrivati
prima del successivo confine del modello. Se l'esecuzione corrente non può accettare steering,
OpenClaw ripiega su una voce di coda di follow-up.

## Modalità della coda

I messaggi in ingresso possono guidare l'esecuzione corrente, attendere un turno di follow-up o fare entrambe le cose:

- `steer`: accoda i messaggi di steering nel runtime attivo. Pi consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente ha terminato di eseguire le sue chiamate agli strumenti**, prima della chiamata LLM successiva; Codex app-server riceve un unico `turn/steer` in batch. Se l'esecuzione non sta trasmettendo attivamente in streaming o lo steering non è disponibile, OpenClaw ripiega su una voce di coda di follow-up.
- `queue` (legacy): vecchio steering uno alla volta. Pi consegna un messaggio di steering accodato a ogni confine del modello; Codex app-server riceve richieste `turn/steer` separate. Preferisci `steer` a meno che non ti serva il precedente comportamento serializzato.
- `followup`: accoda ogni messaggio per un turno dell'agente successivo, dopo la fine dell'esecuzione corrente.
- `collect`: raggruppa i messaggi accodati in un **unico** turno di follow-up dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare il routing.
- `steer-backlog` (alias `steer+backlog`): esegue steering ora **e** preserva lo stesso messaggio per un turno di follow-up.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, quindi esegue il messaggio più recente.

Steer-backlog significa che puoi ottenere una risposta di follow-up dopo l'esecuzione guidata, quindi
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

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` o alla `queue` legacy quando lo steering ripiega su follow-up):

- `debounceMs`: finestra di quiete prima di svuotare i follow-up accodati. I numeri senza unità sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni di `/queue`.
- `cap`: numero massimo di messaggi accodati per sessione. I valori inferiori a `1` vengono ignorati.
- `drop: "summarize"`: predefinito. Elimina le voci accodate più vecchie secondo necessità, conserva riepiloghi compatti e li inietta come prompt sintetico di follow-up.
- `drop: "old"`: elimina le voci accodate più vecchie secondo necessità, senza preservare riepiloghi.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Impostazioni predefinite: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o memorizzato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valore predefinito `steer`.

Per le opzioni, le opzioni `/queue` inline o memorizzate prevalgono sulla configurazione. Poi
vengono applicati il debounce specifico del canale (`messages.queue.debounceMsByChannel`), i valori
predefiniti di debounce del Plugin, le opzioni globali di `messages.queue` e i valori predefiniti
integrati. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione per canale.

## Override per sessione

- Invia `/queue <mode>` come comando autonomo per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni degli agenti di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La corsia predefinita (`main`) è a livello di processo per inbound + heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere corsie aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`) affinché i job in background possano essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni isolati degli agenti cron mantengono uno slot `cron` mentre la loro esecuzione interna dell'agente usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non cron mantengono il proprio comportamento di corsia. Queste esecuzioni scollegate sono tracciate come [attività in background](/it/automation/tasks).
- Le corsie per sessione garantiscono che una sola esecuzione dell'agente tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; puro TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca righe “queued for …ms” per confermare che la coda si stia svuotando.
- Se ti serve la profondità della coda, abilita i log dettagliati e osserva le righe di timing della coda.
- Le esecuzioni di Codex app-server che accettano un turno e poi smettono di emettere avanzamento vengono interrotte dall'adapter Codex, così la corsia della sessione attiva può liberarsi invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che restano in `processing` oltre `diagnostics.stuckSessionWarnMs` registrano un avviso di sessione bloccata. Le esecuzioni embedded attive, le operazioni di risposta attive e le attività di corsia attive restano per impostazione predefinita solo avvisi; la contabilità di avvio obsoleta senza lavoro di sessione attivo può liberare la corsia della sessione interessata così il lavoro accodato viene svuotato.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Criterio di riprova](/it/concepts/retry)
