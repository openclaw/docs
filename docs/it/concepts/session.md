---
read_when:
    - Vuoi comprendere il routing e l'isolamento delle sessioni
    - Vuoi configurare l'ambito dei DM per configurazioni multiutente
    - Stai eseguendo il debug dei reset giornalieri o per inattività delle sessioni
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-04-30T08:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua origine: DM, chat di gruppo, processi cron, ecc.

## Come vengono instradati i messaggi

| Origine          | Comportamento                  |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo     | Isolata per gruppo        |
| Stanze/canali  | Isolata per stanza         |
| Processi cron       | Nuova sessione per ogni esecuzione     |
| Webhook        | Isolata per hook         |

## Isolamento dei DM

Per impostazione predefinita, tutti i DM condividono una sessione per garantire continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agent, abilita l'isolamento dei DM. Senza, tutti
gli utenti condividono lo stesso contesto di conversazione: i messaggi privati di Alice sarebbero
visibili a Bob.
</Warning>

**La correzione:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Altre opzioni:

- `main` (predefinita) -- tutti i DM condividono una sessione.
- `per-peer` -- isola per mittente (tra canali).
- `per-channel-peer` -- isola per canale + mittente (consigliata).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sessione.
</Tip>

### Ancorare canali collegati

I comandi di ancoraggio consentono a un utente di spostare il percorso di risposta della sessione corrente di chat diretta a
un altro canale collegato senza avviare una nuova sessione. Vedi
[Ancoraggio dei canali](/it/concepts/channel-docking) per esempi, configurazione e
risoluzione dei problemi.

Verifica la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reimpostazione giornaliera** (predefinita) -- nuova sessione alle 4:00 AM ora locale sull'host del Gateway. La freschezza giornaliera si basa su quando è iniziato il `sessionId` corrente, non
  sulle scritture successive dei metadati.
- **Reimpostazione per inattività** (opzionale) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`. La freschezza per inattività si basa sull'ultima interazione reale
  utente/canale, quindi Heartbeat, cron ed eventi di sistema exec non
  mantengono viva la sessione.
- **Reimpostazione manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia anche
  il modello.

Quando sono configurate sia la reimpostazione giornaliera sia quella per inattività, vince quella che scade per prima.
Heartbeat, cron, exec e altri turni di eventi di sistema possono scrivere metadati di sessione,
ma tali scritture non estendono la freschezza della reimpostazione giornaliera o per inattività. Quando una reimpostazione
sposta la sessione, gli avvisi di eventi di sistema in coda per la vecchia sessione vengono
scartati, così gli aggiornamenti in background obsoleti non vengono anteposti al primo prompt nella
nuova sessione.

Le sessioni con una sessione CLI attiva di proprietà del provider non vengono interrotte dall'impostazione predefinita
giornaliera implicita. Usa `/reset` o configura `session.reset` esplicitamente quando quelle
sessioni devono scadere con un timer.

## Dove risiede lo stato

Tutto lo stato della sessione è di proprietà del **Gateway**. I client UI interrogano il Gateway per
i dati di sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene timestamp separati del ciclo di vita:

- `sessionStartedAt`: quando è iniziato il `sessionId` corrente; la reimpostazione giornaliera usa questo valore.
- `lastInteractionAt`: ultima interazione utente/canale che estende la durata per inattività.
- `updatedAt`: ultima mutazione della riga dell'archivio; utile per elenchi e pruning, ma non
  autorevole per la freschezza della reimpostazione giornaliera/per inattività.

Le righe più vecchie senza `sessionStartedAt` vengono risolte dall'intestazione di sessione JSONL della trascrizione
quando disponibile. Se una riga più vecchia non ha nemmeno `lastInteractionAt`,
la freschezza per inattività ripiega su quell'ora di avvio della sessione, non sulle successive scritture
di contabilità.

## Manutenzione della sessione

OpenClaw limita automaticamente l'archiviazione delle sessioni nel tempo. Per impostazione predefinita, viene eseguita
in modalità `warn` (segnala cosa verrebbe pulito). Imposta `session.maintenance.mode`
su `"enforce"` per la pulizia automatica:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Per limiti `maxEntries` di dimensioni di produzione, le scritture runtime del Gateway usano un piccolo buffer di soglia alta e ripuliscono a ritroso fino al limite configurato in batch. Questo evita di eseguire una pulizia completa dell'archivio per ogni sessione cron isolata. `openclaw sessions cleanup --enforce` applica subito il limite.

Visualizza un'anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

- `openclaw status` -- percorso dell'archivio sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- utilizzo del contesto, modello e toggle.
- `/context list` -- cosa contiene il prompt di sistema.

## Approfondimenti

- [Pruning delle sessioni](/it/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riepilogo di conversazioni lunghe
- [Strumenti di sessione](/it/concepts/session-tool) -- strumenti dell'agent per lavoro tra sessioni
- [Analisi approfondita della gestione delle sessioni](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, criterio di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/it/concepts/multi-agent) — routing e isolamento delle sessioni tra agent
- [Attività in background](/it/automation/tasks) — come il lavoro separato crea record di attività con riferimenti di sessione
- [Routing dei canali](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni

## Correlati

- [Pruning delle sessioni](/it/concepts/session-pruning)
- [Strumenti di sessione](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
