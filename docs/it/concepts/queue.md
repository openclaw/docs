---
read_when:
    - Modificare l'esecuzione o la concorrenza della risposta automatica
    - Spiegazione delle modalità /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, valori predefiniti e override per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-05-06T08:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per impedire collisioni tra più esecuzioni dell'agente, consentendo comunque parallelismo sicuro tra sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono collidere quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per lane non configurate; main predefinita a 4, subagent a 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **lane globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando la registrazione dettagliata è abilitata, le esecuzioni accodate emettono un breve avviso se hanno atteso più di ~2 s prima dell'avvio.
- Gli indicatori di digitazione vengono comunque attivati immediatamente all'accodamento (quando supportati dal canale), quindi l'esperienza utente resta invariata mentre si attende il proprio turno.

## Valori predefiniti

Quando non impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` è il valore predefinito perché mantiene reattivo il turno del modello attivo senza
avviare una seconda esecuzione di sessione. Svuota tutti i messaggi di steering arrivati
prima del successivo confine del modello. Se l'esecuzione corrente non può accettare steering,
OpenClaw ripiega su una voce di coda di followup.

## Modalità della coda

I messaggi in ingresso possono indirizzare l'esecuzione corrente, attendere un turno di followup o fare entrambe le cose:

- `steer`: accoda messaggi di steering nel runtime attivo. Pi consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente ha terminato di eseguire le sue chiamate agli strumenti**, prima della chiamata LLM successiva; Codex app-server riceve un solo `turn/steer` in batch. Se l'esecuzione non è in streaming attivo o lo steering non è disponibile, OpenClaw ripiega su una voce di coda di followup.
- `queue` (legacy): vecchio steering uno alla volta. Pi consegna un messaggio di steering accodato a ogni confine del modello; Codex app-server riceve richieste `turn/steer` separate. Preferisci `steer` salvo necessità del precedente comportamento serializzato.
- `followup`: accoda ogni messaggio per un turno agente successivo dopo la fine dell'esecuzione corrente.
- `collect`: combina i messaggi accodati in un **singolo** turno di followup dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare il routing.
- `steer-backlog` (alias `steer+backlog`): indirizza ora **e** conserva lo stesso messaggio per un turno di followup.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.

Steer-backlog significa che puoi ottenere una risposta di followup dopo l'esecuzione indirizzata, quindi
le superfici in streaming possono apparire come duplicati. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.

Per comportamento di timing e dipendenze specifico del runtime, vedi
[Coda di steering](/it/concepts/queue-steering). Per il comando esplicito `/steer <message>`,
vedi [Steer](/it/tools/steer).

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

- `debounceMs`: finestra di quiete prima di svuotare i followup accodati. I numeri senza unità sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni di `/queue`.
- `cap`: numero massimo di messaggi accodati per sessione. I valori inferiori a `1` vengono ignorati.
- `drop: "summarize"`: predefinito. Scarta le voci accodate più vecchie quando necessario, conserva riepiloghi compatti e li inietta come prompt di followup sintetico.
- `drop: "old"`: scarta le voci accodate più vecchie quando necessario, senza preservare riepiloghi.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Valori predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o memorizzato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` predefinito.

Per le opzioni, le opzioni `/queue` inline o memorizzate prevalgono sulla configurazione. Poi vengono
applicati debounce specifico del canale (`messages.queue.debounceMsByChannel`), valori predefiniti di debounce del plugin,
opzioni globali di `messages.queue` e valori predefiniti integrati. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione per canale.

## Override per sessione

- Invia `/queue <mode>` come comando autonomo per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override di sessione.

## Ambito e garanzie

- Si applica alle esecuzioni dell'agente di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è a livello di processo per messaggi in ingresso + heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`) così i job in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni agente cron isolati occupano uno slot `cron` mentre la loro esecuzione agente interna usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non cron mantengono il proprio comportamento di lane. Queste esecuzioni distaccate sono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che una sola esecuzione agente tocchi una data sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; solo TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca righe "queued for ...ms" per confermare che la coda si stia svuotando.
- Se hai bisogno della profondità della coda, abilita i log dettagliati e osserva le righe di timing della coda.
- Le esecuzioni di Codex app-server che accettano un turno e poi smettono di emettere avanzamento vengono interrotte dall'adapter Codex, così la lane della sessione attiva può essere rilasciata invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che rimangono in `processing` oltre `diagnostics.stuckSessionWarnMs` senza alcun progresso osservato di risposta, strumento, stato, blocco o ACP vengono classificate in base all'attività corrente. Il lavoro attivo viene registrato come `session.long_running`; il lavoro attivo senza avanzamento recente viene registrato come `session.stalled`; `session.stuck` è riservato alla contabilità di sessioni obsolete senza lavoro attivo, e solo quel percorso può rilasciare la lane della sessione interessata così il lavoro accodato può svuotarsi. Le diagnostiche `session.stuck` ripetute applicano un backoff finché la sessione resta invariata.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Steer](/it/tools/steer)
- [Policy di ripetizione](/it/concepts/retry)
