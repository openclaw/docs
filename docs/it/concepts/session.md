---
read_when:
    - Vuoi capire l'instradamento e l'isolamento delle sessioni
    - Vuoi configurare l'ambito DM per configurazioni multiutente
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-04-23T08:28:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Gestione delle sessioni

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua provenienza -- DM, chat di gruppo, processi cron e così via.

## Come vengono instradati i messaggi

| Sorgente        | Comportamento             |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo  | Isolata per gruppo        |
| Stanze/canali   | Isolata per stanza        |
| Processi cron   | Sessione nuova per ogni esecuzione |
| Webhook         | Isolata per hook          |

## Isolamento DM

Per impostazione predefinita, tutti i DM condividono una sessione per garantire continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento DM. Senza di esso, tutti gli
utenti condividono lo stesso contesto di conversazione -- i messaggi privati di Alice sarebbero visibili a Bob.
</Warning>

**La soluzione:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Altre opzioni:

- `main` (predefinito) -- tutti i DM condividono una sessione.
- `per-peer` -- isola per mittente (tra i canali).
- `per-channel-peer` -- isola per canale + mittente (consigliato).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sessione.
</Tip>

Verifica la tua configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reset giornaliero** (predefinito) -- nuova sessione alle 4:00 AM ora locale sull'host
  del gateway.
- **Reset per inattività** (facoltativo) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`.
- **Reset manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia anche
  il modello.

Quando sono configurati sia il reset giornaliero sia il reset per inattività, prevale quello che scade per primo.

Le sessioni con una sessione CLI del provider ancora attiva non vengono interrotte dal valore predefinito
giornaliero implicito. Usa `/reset` o configura esplicitamente `session.reset` quando queste
sessioni devono scadere in base a un timer.

## Dove si trova lo stato

Tutto lo stato della sessione è gestito dal **gateway**. I client UI interrogano il gateway per
ottenere i dati di sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenzione delle sessioni

OpenClaw limita automaticamente nel tempo lo spazio di archiviazione delle sessioni. Per impostazione predefinita, viene eseguito
in modalità `warn` (riporta cosa verrebbe pulito). Imposta `session.maintenance.mode`
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

Anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

- `openclaw status` -- percorso dell'archivio sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- uso del contesto, modello e toggle.
- `/context list` -- cosa si trova nel prompt di sistema.

## Per approfondire

- [Session Pruning](/it/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riepilogo delle conversazioni lunghe
- [Session Tools](/it/concepts/session-tool) -- strumenti dell'agente per lavoro tra sessioni
- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, policy di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/it/concepts/multi-agent) — routing e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro distaccato crea record attività con riferimenti di sessione
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni
