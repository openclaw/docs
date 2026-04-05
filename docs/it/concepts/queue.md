---
read_when:
    - Modifica dell'esecuzione della risposta automatica o della concorrenza
summary: Progettazione della coda dei comandi che serializza le esecuzioni di risposta automatica in entrata
title: Coda dei comandi
x-i18n:
    generated_at: "2026-04-05T13:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Coda dei comandi (2026-01-16)

Serializziamo le esecuzioni di risposta automatica in entrata (tutti i canali) tramite una piccola coda in-process per impedire che più esecuzioni dell'agente entrino in conflitto, consentendo comunque un parallelismo sicuro tra le sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in conflitto quando arrivano più messaggi in entrata a breve distanza l'uno dall'altro.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di limiti di velocità upstream.

## Come funziona

- Una coda FIFO consapevole delle corsie svuota ogni corsia con un limite di concorrenza configurabile (predefinito 1 per le corsie non configurate; `main` è predefinita a 4, `subagent` a 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (corsia `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene quindi accodata in una **corsia globale** (`main` per impostazione predefinita) in modo che il parallelismo complessivo sia limitato da `agents.defaults.maxConcurrent`.
- Quando il logging verbose è abilitato, le esecuzioni accodate emettono un breve avviso se hanno atteso più di ~2s prima di iniziare.
- Gli indicatori di digitazione continuano comunque a essere attivati immediatamente all'accodamento (quando supportati dal canale), quindi l'esperienza utente resta invariata mentre si attende il proprio turno.

## Modalità della coda (per canale)

I messaggi in entrata possono indirizzare l'esecuzione corrente, attendere un turno di followup o fare entrambe le cose:

- `steer`: inserisce immediatamente nell'esecuzione corrente (annulla le chiamate agli strumenti in sospeso dopo il successivo limite dello strumento). Se non c'è streaming, ripiega su followup.
- `followup`: accoda per il turno successivo dell'agente dopo la fine dell'esecuzione corrente.
- `collect`: unisce tutti i messaggi accodati in un **singolo** turno di followup (predefinito). Se i messaggi hanno come destinazione canali/thread diversi, vengono svuotati singolarmente per preservare l'instradamento.
- `steer-backlog` (alias `steer+backlog`): indirizza ora **e** conserva il messaggio per un turno di followup.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, quindi esegue il messaggio più recente.
- `queue` (alias legacy): uguale a `steer`.

Steer-backlog significa che puoi ottenere una risposta di followup dopo l'esecuzione indirizzata, quindi
le superfici di streaming possono sembrare duplicati. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in entrata.
Invia `/queue collect` come comando standalone (per sessione) oppure imposta `messages.queue.byChannel.discord: "collect"`.

Valori predefiniti (quando non impostati nella configurazione):

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

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` quando ripiega su followup):

- `debounceMs`: attende una pausa di quiete prima di avviare un turno di followup (evita “continue, continue”).
- `cap`: numero massimo di messaggi accodati per sessione.
- `drop`: criterio di overflow (`old`, `new`, `summarize`).

Summarize mantiene un breve elenco puntato dei messaggi scartati e lo inserisce come prompt sintetico di followup.
Valori predefiniti: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sessione

- Invia `/queue <mode>` come comando standalone per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` o `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni dell'agente con risposta automatica in tutti i canali in entrata che usano la pipeline di risposta del gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La corsia predefinita (`main`) è a livello di processo per i messaggi in entrata + heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere corsie aggiuntive (ad esempio `cron`, `subagent`) in modo che i job in background possano essere eseguiti in parallelo senza bloccare le risposte in entrata. Queste esecuzioni separate sono tracciate come [attività in background](/it/automation/tasks).
- Le corsie per sessione garantiscono che solo un'esecuzione dell'agente alla volta tocchi una determinata sessione.
- Nessuna dipendenza esterna o thread worker in background; solo TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log verbose e cerca le righe “queued for …ms” per confermare che la coda si stia svuotando.
- Se hai bisogno della profondità della coda, abilita i log verbose e osserva le righe relative ai tempi della coda.
