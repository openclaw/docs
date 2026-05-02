---
read_when:
    - Vuoi comprendere il routing e l'isolamento delle sessioni
    - Vuoi configurare l'ambito dei DM per configurazioni multiutente
    - Stai diagnosticando i ripristini giornalieri o per inattività delle sessioni
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-05-02T08:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua provenienza: DM, chat di gruppo, job Cron, ecc.

## Come vengono instradati i messaggi

| Origine          | Comportamento                  |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo     | Isolata per gruppo        |
| Stanze/canali  | Isolata per stanza         |
| Job Cron       | Nuova sessione per esecuzione     |
| Webhook        | Isolata per hook         |

## Isolamento dei DM

Per impostazione predefinita, tutti i DM condividono una sessione per garantire continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento dei DM. Senza, tutti
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

- `main` (impostazione predefinita) -- tutti i DM condividono una sessione.
- `per-peer` -- isola per mittente (tra canali).
- `per-channel-peer` -- isola per canale + mittente (consigliato).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sessione.
</Tip>

### Agganciare canali collegati

I comandi di aggancio consentono a un utente di spostare la route di risposta della sessione di chat diretta corrente su
un altro canale collegato senza avviare una nuova sessione. Consulta
[Aggancio dei canali](/it/concepts/channel-docking) per esempi, configurazione e
risoluzione dei problemi.

Verifica la tua configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reimpostazione giornaliera** (impostazione predefinita) -- nuova sessione alle 4:00 AM ora locale sull'host
  Gateway. La freschezza giornaliera si basa su quando è iniziato il `sessionId` corrente, non
  su scritture successive dei metadati.
- **Reimpostazione per inattività** (facoltativa) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`. La freschezza per inattività si basa sull'ultima interazione reale
  utente/canale, quindi Heartbeat, Cron ed eventi di sistema exec non
  mantengono viva la sessione.
- **Reimpostazione manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia anche
  il modello.

Quando sono configurate sia la reimpostazione giornaliera sia quella per inattività, prevale quella che scade per prima.
Heartbeat, Cron, exec e altri turni di eventi di sistema possono scrivere metadati di sessione,
ma queste scritture non estendono la freschezza della reimpostazione giornaliera o per inattività. Quando una reimpostazione
sposta la sessione, le notifiche di eventi di sistema in coda per la vecchia sessione vengono
scartate, così gli aggiornamenti in background obsoleti non vengono anteposti al primo prompt nella
nuova sessione.

Le sessioni con una sessione CLI attiva di proprietà del provider non vengono tagliate dall'impostazione
giornaliera predefinita implicita. Usa `/reset` o configura esplicitamente `session.reset` quando queste
sessioni devono scadere con un timer.

## Dove risiede lo stato

Tutto lo stato della sessione è di proprietà del **Gateway**. I client UI interrogano il Gateway per
i dati della sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene timestamp separati del ciclo di vita:

- `sessionStartedAt`: quando è iniziato il `sessionId` corrente; la reimpostazione giornaliera usa questo valore.
- `lastInteractionAt`: ultima interazione utente/canale che estende la durata per inattività.
- `updatedAt`: ultima mutazione della riga dell'archivio; utile per elenchi e potatura, ma non
  autorevole per la freschezza della reimpostazione giornaliera/per inattività.

Le righe più vecchie senza `sessionStartedAt` vengono risolte dall'intestazione di sessione JSONL della trascrizione
quando disponibile. Se una riga più vecchia non ha nemmeno `lastInteractionAt`,
la freschezza per inattività ricade sull'ora di inizio di quella sessione, non sulle scritture successive
di bookkeeping.

## Manutenzione delle sessioni

OpenClaw limita automaticamente lo storage delle sessioni nel tempo. Per impostazione predefinita, viene eseguito
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

Per limiti `maxEntries` di dimensioni da produzione, le scritture runtime del Gateway usano un piccolo buffer high-water e ripuliscono in batch fino al limite configurato. Le letture dell'archivio sessioni non potano né limitano le voci durante l'avvio del Gateway. Questo evita di eseguire una pulizia completa dell'archivio a ogni avvio o sessione Cron isolata. `openclaw sessions cleanup --enforce` applica il limite immediatamente.

La manutenzione preserva i puntatori durevoli a conversazioni esterne, incluse le sessioni di gruppo
e le sessioni di chat con ambito thread, consentendo comunque alle voci sintetiche Cron,
hook, Heartbeat, ACP e sub-agent di scadere.

Visualizza l'anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

- `openclaw status` -- percorso dell'archivio sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- utilizzo del contesto, modello e toggle.
- `/context list` -- cosa c'è nel prompt di sistema.

## Ulteriori letture

- [Potatura delle sessioni](/it/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riepilogo delle conversazioni lunghe
- [Strumenti di sessione](/it/concepts/session-tool) -- strumenti dell'agente per lavoro tra sessioni
- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, policy di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/it/concepts/multi-agent) — routing e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro scollegato crea record di attività con riferimenti di sessione
- [Routing dei canali](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni

## Correlati

- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Strumenti di sessione](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
