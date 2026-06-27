---
read_when:
    - Vuoi comprendere l’instradamento e l’isolamento delle sessioni
    - Vuoi configurare l'ambito dei DM per configurazioni multiutente
    - Stai eseguendo il debug dei reset giornalieri o delle sessioni inattive
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-06-27T17:28:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua provenienza: messaggi diretti, chat di gruppo, processi cron e così via.

## Come vengono instradati i messaggi

| Origine          | Comportamento                  |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo     | Isolata per gruppo        |
| Stanze/canali  | Isolata per stanza         |
| Processi Cron       | Nuova sessione a ogni esecuzione     |
| Webhook        | Isolato per hook         |

## Isolamento dei messaggi diretti

Per impostazione predefinita, tutti i messaggi diretti condividono una sessione per garantire continuità. Va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento dei messaggi diretti. Senza di esso, tutti
gli utenti condividono lo stesso contesto della conversazione: i messaggi privati di Alice sarebbero
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

- `main` (predefinita) -- tutti i messaggi diretti condividono una sessione.
- `per-peer` -- isola per mittente (su più canali).
- `per-channel-peer` -- isola per canale + mittente (consigliata).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sola sessione.
</Tip>

### Ancorare canali collegati

I comandi di ancoraggio consentono a un utente di spostare il percorso di risposta della sessione corrente di chat diretta su
un altro canale collegato senza avviare una nuova sessione. Vedi
[Ancoraggio dei canali](/it/concepts/channel-docking) per esempi, configurazione e
risoluzione dei problemi.

Verifica la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Ripristino giornaliero** (predefinito) -- nuova sessione alle 4:00 ora locale sull'host del Gateway.
  La freschezza giornaliera si basa su quando è iniziato il `sessionId` corrente, non
  su successive scritture di metadati.
- **Ripristino per inattività** (opzionale) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`. La freschezza per inattività si basa sull'ultima
  interazione reale utente/canale, quindi gli eventi di sistema Heartbeat, Cron ed exec non
  mantengono attiva la sessione.
- **Ripristino manuale** -- digita `/new` o `/reset` in chat. Anche `/new <model>`
  cambia il modello.

Quando sono configurati sia il ripristino giornaliero sia quello per inattività, prevale quello che scade per primo.
I turni di eventi di sistema Heartbeat, Cron, exec e altri possono scrivere metadati di sessione,
ma tali scritture non estendono la freschezza del ripristino giornaliero o per inattività. Quando un ripristino
fa avanzare la sessione, gli avvisi di eventi di sistema in coda per la vecchia sessione vengono
scartati, così gli aggiornamenti in background obsoleti non vengono anteposti al primo prompt nella
nuova sessione.

Le sessioni con una sessione CLI attiva di proprietà del provider non vengono interrotte dall'impostazione predefinita
giornaliera implicita. Usa `/reset` o configura esplicitamente `session.reset` quando queste
sessioni devono scadere in base a un timer.

## Dove risiede lo stato

Tutto lo stato delle sessioni è di proprietà del **Gateway**. I client UI interrogano il Gateway per
i dati di sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene timestamp del ciclo di vita separati:

- `sessionStartedAt`: quando è iniziato il `sessionId` corrente; il ripristino giornaliero usa questo valore.
- `lastInteractionAt`: ultima interazione utente/canale che estende la durata per inattività.
- `updatedAt`: ultima mutazione della riga dell'archivio; utile per elencare e potare, ma non
  autorevole per la freschezza del ripristino giornaliero/per inattività.

Le righe più vecchie senza `sessionStartedAt` vengono risolte dall'intestazione di sessione JSONL della trascrizione
quando disponibile. Se una riga più vecchia manca anche di `lastInteractionAt`,
la freschezza per inattività ripiega all'ora di inizio di quella sessione, non alle successive scritture
di contabilità.

## Manutenzione delle sessioni

OpenClaw limita automaticamente nel tempo l'archiviazione delle sessioni. Per impostazione predefinita, viene eseguito
in modalità `enforce` e applica la pulizia durante la manutenzione. Imposta
`session.maintenance.mode` su `"warn"` per segnalare cosa verrebbe pulito senza modificare l'archivio/i file:

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

Per limiti `maxEntries` di dimensioni di produzione, le scritture runtime del Gateway usano un piccolo buffer high-water e riportano l'archivio al limite configurato in batch. Le letture dell'archivio delle sessioni non potano né limitano le voci durante l'avvio del Gateway. Questo evita di eseguire una pulizia completa dell'archivio a ogni avvio o sessione Cron isolata. `openclaw sessions cleanup --enforce` applica il limite immediatamente.

Le sessioni di probe di esecuzione modello del Gateway sono di breve durata per impostazione predefinita. Le righe corrispondenti con
chiavi esplicite rigorose come `agent:*:explicit:model-run-<uuid>` usano una conservazione fissa di `24h`,
ma la pulizia è vincolata alla pressione: rimuove le righe di probe obsolete solo quando
viene raggiunta la pressione di manutenzione/limite delle voci di sessione. Quando la pulizia delle esecuzioni modello viene eseguita,
viene eseguita prima del taglio per età delle voci obsolete più ampio e del limite delle voci. Le normali sessioni dirette,
di gruppo, thread, Cron, hook, Heartbeat, ACP e sub-agente non ereditano
questa conservazione di 24 ore.

La manutenzione preserva i puntatori durevoli alle conversazioni esterne, incluse le sessioni di gruppo
e le sessioni chat con ambito thread, pur consentendo alle voci sintetiche Cron,
hook, Heartbeat, ACP e sub-agente di invecchiare e scadere.

Se in precedenza hai usato l'isolamento dei messaggi diretti e in seguito hai riportato
`session.dmScope` a `main`, visualizza in anteprima le righe di messaggi diretti obsolete con chiave peer tramite
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Applicando lo stesso flag,
quelle vecchie righe di messaggi diretti vengono ritirate e le loro trascrizioni vengono mantenute come archivi
eliminati.

Visualizza l'anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

- `openclaw status` -- percorso dell'archivio delle sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- utilizzo del contesto, modello e opzioni.
- `/context list` -- cosa contiene il prompt di sistema.

## Ulteriori letture

- [Potatura delle sessioni](/it/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riassunto di conversazioni lunghe
- [Strumenti di sessione](/it/concepts/session-tool) -- strumenti agente per lavoro tra sessioni
- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, policy di invio, metadati di origine e configurazione avanzata
- [Multi-agente](/it/concepts/multi-agent) — instradamento e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro scollegato crea record di attività con riferimenti alla sessione
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni

## Correlati

- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Strumenti di sessione](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
