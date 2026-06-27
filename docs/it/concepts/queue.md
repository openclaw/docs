---
read_when:
    - Modificare l'esecuzione o la concorrenza della risposta automatica
    - Spiegazione delle modalità /queue o del comportamento di instradamento dei messaggi
summary: Modalità della coda di risposta automatica, impostazioni predefinite e override per sessione
title: Coda dei comandi
x-i18n:
    generated_at: "2026-06-27T17:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per impedire collisioni tra più esecuzioni dell'agente, consentendo comunque parallelismo sicuro tra sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a breve distanza.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di frequenza upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per le lane non configurate; `main` predefinita a 4, `subagent` a 8).
- `runEmbeddedAgent` accoda per **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **lane globale** (`main` per impostazione predefinita), così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging dettagliato è abilitato, le esecuzioni in coda emettono un breve avviso se hanno atteso più di circa 2 s prima di iniziare.
- Gli indicatori di digitazione partono comunque subito all'accodamento (quando supportati dal canale), quindi l'esperienza utente resta invariata mentre attendiamo il nostro turno.

## Valori predefiniti

Quando non impostate, tutte le superfici dei canali in ingresso usano:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Lo steering nello stesso turno è il valore predefinito. Un prompt che arriva a metà esecuzione viene iniettato
nel runtime attivo quando l'esecuzione può accettare steering, quindi non viene avviata una seconda esecuzione
di sessione. Se l'esecuzione attiva non può accettare steering, OpenClaw attende che
l'esecuzione attiva termini prima di avviare il prompt.

## Modalità della coda

`/queue` controlla cosa fanno i normali messaggi in ingresso mentre una sessione ha già
un'esecuzione attiva:

- `steer`: inietta i messaggi nel runtime attivo. OpenClaw consegna tutti i messaggi di steering in sospeso **dopo che il turno corrente dell'assistente ha terminato di eseguire le sue chiamate agli strumenti**, prima della chiamata LLM successiva; l'app-server Codex riceve un unico `turn/steer` in batch. Se l'esecuzione non sta trasmettendo attivamente in streaming o lo steering non è disponibile, OpenClaw attende la fine dell'esecuzione attiva prima di avviare il prompt.
- `followup`: non esegue steering. Accoda ogni messaggio per un turno dell'agente successivo dopo la fine dell'esecuzione corrente.
- `collect`: non esegue steering. Unisce i messaggi accodati in un **singolo** turno di follow-up dopo la finestra di quiete. Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare il routing.
- `interrupt`: interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.

Per il timing specifico del runtime e il comportamento delle dipendenze, consulta
[Coda di steering](/it/concepts/queue-steering). Per il comando esplicito `/steer <message>`,
consulta [Steer](/it/tools/steer).

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

Le opzioni si applicano alla consegna accodata. `debounceMs` imposta anche la finestra di quiete
dello steering Codex in modalità `steer`:

- `debounceMs`: finestra di quiete prima di svuotare follow-up accodati o batch collect; in modalità Codex `steer`, finestra di quiete prima dell'invio del batch `turn/steer`. I numeri senza unità sono millisecondi; le unità `ms`, `s`, `m`, `h` e `d` sono accettate dalle opzioni di `/queue`.
- `cap`: massimo di messaggi accodati per sessione. I valori inferiori a `1` vengono ignorati.
- `drop: "summarize"`: predefinito. Elimina le voci accodate più vecchie quando necessario, conserva riassunti compatti e li inietta come prompt di follow-up sintetico.
- `drop: "old"`: elimina le voci accodate più vecchie quando necessario, senza preservare riassunti.
- `drop: "new"`: rifiuta il messaggio più recente quando la coda è già piena.

Predefiniti: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steer e streaming

Quando lo streaming del canale è `partial` o `block`, lo steering può apparire come diverse
brevi risposte visibili mentre l'esecuzione attiva raggiunge i confini del runtime:

- `partial`: l'anteprima può finalizzarsi in anticipo, poi una nuova anteprima inizia dopo
  l'accettazione dello steering.
- `block`: blocchi delle dimensioni di una bozza possono creare lo stesso aspetto sequenziale.
- Senza streaming, lo steering ripiega su un follow-up dopo l'esecuzione attiva quando
  il runtime non può accettare steering nello stesso turno.

`steer` non interrompe gli strumenti in corso. Usa `/queue interrupt` quando il messaggio più recente
deve interrompere l'esecuzione corrente.

## Precedenza

Per la selezione della modalità, OpenClaw risolve:

1. Override `/queue` inline o memorizzato per sessione.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Predefinito `steer`.

Per le opzioni, le opzioni `/queue` inline o memorizzate prevalgono sulla configurazione. Poi
vengono applicati debounce specifico del canale (`messages.queue.debounceMsByChannel`), valori predefiniti
di debounce del Plugin, opzioni globali `messages.queue` e valori predefiniti integrati. `cap` e `drop` sono opzioni globali/di sessione, non chiavi di configurazione per canale.

## Override per sessione

- Invia `/queue <steer|followup|collect|interrupt>` come comando autonomo per memorizzare la modalità della coda per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni dell'agente di risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è a livello di processo per messaggi in ingresso + Heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (ad es. `cron`, `cron-nested`, `nested`, `subagent`) affinché i job in background possano essere eseguiti in parallelo senza bloccare le risposte in ingresso. I turni di agenti cron isolati occupano uno slot `cron` mentre la loro esecuzione interna dell'agente usa `cron-nested`; entrambi usano `cron.maxConcurrentRuns`. I flussi `nested` condivisi non cron mantengono il proprio comportamento di lane. Queste esecuzioni distaccate sono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che una sola esecuzione dell'agente tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; solo TypeScript + promises.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log dettagliati e cerca le righe "queued for ...ms" per confermare che la coda si stia svuotando.
- Se ti serve la profondità della coda, abilita i log dettagliati e osserva le righe di timing della coda.
- Le esecuzioni app-server Codex che accettano un turno e poi smettono di emettere avanzamento vengono interrotte dall'adapter Codex, così la lane della sessione attiva può essere rilasciata invece di attendere il timeout dell'esecuzione esterna.
- Quando la diagnostica è abilitata, le sessioni che restano in `processing` oltre `diagnostics.stuckSessionWarnMs` senza risposta, strumento, stato, blocco o avanzamento ACP osservati vengono classificate in base all'attività corrente. Il lavoro attivo viene registrato come `session.long_running`; anche le chiamate modello silenziose con proprietario restano `session.long_running` fino a `diagnostics.stuckSessionAbortMs`, così provider lenti o non in streaming non vengono segnalati come bloccati troppo presto. Il lavoro attivo senza avanzamento recente viene registrato come `session.stalled`; le chiamate modello con proprietario passano a `session.stalled` alla soglia di interruzione o dopo, e l'attività modello/strumento obsoleta senza proprietario non viene nascosta come long-running. `session.stuck` è riservato alla contabilità recuperabile di sessioni obsolete, incluse sessioni accodate inattive con attività modello/strumento obsoleta senza proprietario, e solo quel percorso può rilasciare la lane della sessione interessata affinché il lavoro accodato venga svuotato. Le diagnostiche `session.stuck` ripetute applicano un backoff finché la sessione rimane invariata.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Coda di steering](/it/concepts/queue-steering)
- [Steer](/it/tools/steer)
- [Criterio di ripetizione](/it/concepts/retry)
