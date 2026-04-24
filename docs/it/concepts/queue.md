---
read_when:
    - Modifica dell'esecuzione o della concorrenza delle risposte automatiche
summary: Progetto della coda dei comandi che serializza le esecuzioni di risposta automatica in ingresso
title: Coda dei comandi
x-i18n:
    generated_at: "2026-04-24T08:37:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Coda dei comandi (2026-01-16)

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per evitare collisioni tra più esecuzioni dell'agente, consentendo comunque un parallelismo sicuro tra sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a distanza ravvicinata.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin CLI) e riduce la probabilità di rate limit upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per le lane non configurate; `main` è predefinita a 4, `subagent` a 8).
- `runEmbeddedPiAgent` accoda in base alla **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **lane globale** (`main` per impostazione predefinita) così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging verbose è abilitato, le esecuzioni accodate emettono un breve avviso se hanno atteso più di ~2 secondi prima di iniziare.
- Gli indicatori di digitazione si attivano comunque subito all'accodamento (quando supportato dal canale), così l'esperienza utente non cambia mentre aspettiamo il nostro turno.

## Modalità della coda (per canale)

I messaggi in ingresso possono guidare l'esecuzione corrente, attendere un turno di follow-up o fare entrambe le cose:

- `steer`: inietta immediatamente nell'esecuzione corrente (annulla le chiamate di tool in sospeso dopo il successivo confine di tool). Se non c'è streaming, ripiega su follow-up.
- `followup`: accoda per il turno successivo dell'agente dopo la fine dell'esecuzione corrente.
- `collect`: unisce tutti i messaggi accodati in un **singolo** turno di follow-up (predefinito). Se i messaggi puntano a canali/thread diversi, vengono svuotati individualmente per preservare l'instradamento.
- `steer-backlog` (alias `steer+backlog`): guida ora **e** conserva il messaggio per un turno di follow-up.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.
- `queue` (alias legacy): uguale a `steer`.

Steer-backlog significa che puoi ottenere una risposta di follow-up dopo l'esecuzione guidata, quindi
le superfici di streaming possono sembrare duplicate. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.
Invia `/queue collect` come comando standalone (per sessione) oppure imposta `messages.queue.byChannel.discord: "collect"`.

Predefiniti (quando non impostati in configurazione):

- Tutte le superfici → `collect`

Configura globalmente o per canale tramite `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opzioni della coda

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` quando ripiega su follow-up):

- `debounceMs`: attende il silenzio prima di avviare un turno di follow-up (evita “continua, continua”).
- `cap`: numero massimo di messaggi accodati per sessione.
- `drop`: criterio di overflow (`old`, `new`, `summarize`).

Summarize conserva un breve elenco puntato dei messaggi scartati e lo inietta come prompt sintetico di follow-up.
Predefiniti: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sessione

- Invia `/queue <mode>` come comando standalone per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` oppure `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni di agente in risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è valida per tutto il processo per ingressi + Heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (per esempio `cron`, `subagent`) così i processi in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. Queste esecuzioni scollegate vengono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che solo un'esecuzione dell'agente tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; puro TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log verbose e cerca righe “queued for …ms” per confermare che la coda si stia svuotando.
- Se hai bisogno della profondità della coda, abilita i log verbose e osserva le righe relative ai tempi della coda.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Criteri di retry](/it/concepts/retry)
