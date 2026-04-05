---
read_when:
    - Vuoi comprendere l'instradamento e l'isolamento delle sessioni
    - Vuoi configurare l'ambito dei DM per configurazioni multiutente
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-04-05T13:50:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Gestione delle sessioni

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua origine -- DM, chat di gruppo, job cron, ecc.

## Come vengono instradati i messaggi

| Origine         | Comportamento               |
| --------------- | --------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo  | Isolata per gruppo          |
| Stanze/canali   | Isolata per stanza          |
| Job cron        | Sessione nuova per ogni esecuzione |
| Webhook         | Isolata per hook            |

## Isolamento dei DM

Per impostazione predefinita, tutti i DM condividono una sessione per garantire continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento dei DM. Senza di esso, tutti gli
utenti condividono lo stesso contesto di conversazione -- i messaggi privati di Alice sarebbero
visibili a Bob.
</Warning>

**La soluzione:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isola per canale + mittente
  },
}
```

Altre opzioni:

- `main` (predefinito) -- tutti i DM condividono una sessione.
- `per-peer` -- isola per mittente (tra i vari canali).
- `per-channel-peer` -- isola per canale + mittente (consigliato).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sola sessione.
</Tip>

Verifica la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reimpostazione giornaliera** (predefinita) -- nuova sessione alle 4:00 ora locale sull'host
  del gateway.
- **Reimpostazione per inattività** (facoltativa) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`.
- **Reimpostazione manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia anche
  il modello.

Quando sono configurate sia la reimpostazione giornaliera sia quella per inattività, prevale quella che scade per prima.

## Dove risiede lo stato

Tutto lo stato della sessione appartiene al **gateway**. I client UI interrogano il gateway per ottenere
i dati della sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenzione delle sessioni

OpenClaw limita automaticamente nel tempo l'archiviazione delle sessioni. Per impostazione predefinita, viene eseguito
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

- `openclaw status` -- percorso dell'archivio delle sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- utilizzo del contesto, modello e toggle.
- `/context list` -- cosa è presente nel prompt di sistema.

## Ulteriori letture

- [Potatura delle sessioni](/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compattazione](/concepts/compaction) -- riepilogo delle conversazioni lunghe
- [Strumenti di sessione](/concepts/session-tool) -- strumenti dell'agente per il lavoro tra sessioni
- [Approfondimento sulla gestione delle sessioni](/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, criterio di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/concepts/multi-agent) — instradamento e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro separato crea record di attività con riferimenti di sessione
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi in entrata vengono instradati alle sessioni
