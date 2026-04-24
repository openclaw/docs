---
read_when:
    - Vuoi capire l'instradamento e l'isolamento delle sessioni
    - Vuoi configurare l'ambito DM per configurazioni multiutente
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-04-24T08:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato verso una
sessione in base alla sua origine: DM, chat di gruppo, processi Cron e così via.

## Come vengono instradati i messaggi

| Source          | Behavior                  |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo  | Isolate per gruppo        |
| Stanze/canali   | Isolate per stanza        |
| Processi Cron   | Nuova sessione per ogni esecuzione |
| Webhook         | Isolati per hook          |

## Isolamento DM

Per impostazione predefinita, tutti i DM condividono una sessione per mantenere la continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento DM. Senza di esso, tutti gli
utenti condividono lo stesso contesto di conversazione: i messaggi privati di Alice sarebbero
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
- `per-peer` -- isola per mittente (tra canali).
- `per-channel-peer` -- isola per canale + mittente (consigliato).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità così condivideranno una sola sessione.
</Tip>

Verifica la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reset giornaliero** (predefinito) -- nuova sessione alle 4:00 ora locale sull'host
  Gateway.
- **Reset per inattività** (facoltativo) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`.
- **Reset manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia
  anche il modello.

Quando sono configurati sia il reset giornaliero sia quello per inattività, prevale quello che scade per primo.

Le sessioni con una sessione CLI attiva posseduta dal provider non vengono interrotte dal valore predefinito giornaliero implicito. Usa `/reset` o configura `session.reset` esplicitamente quando queste
sessioni devono scadere in base a un timer.

## Dove si trova lo stato

Tutto lo stato della sessione è di proprietà del **Gateway**. I client UI interrogano il Gateway per i
dati della sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenzione delle sessioni

OpenClaw limita automaticamente l'archiviazione delle sessioni nel tempo. Per impostazione predefinita, viene eseguito
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

Anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezionare le sessioni

- `openclaw status` -- percorso dell'archivio sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- utilizzo del contesto, modello e toggle.
- `/context list` -- cosa è presente nel prompt di sistema.

## Per approfondire

- [Session Pruning](/it/concepts/session-pruning) -- riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riepilogo delle conversazioni lunghe
- [Session Tools](/it/concepts/session-tool) -- strumenti dell'agente per il lavoro cross-session
- [Session Management Deep Dive](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, policy di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/it/concepts/multi-agent) — instradamento e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro scollegato crea record delle attività con riferimenti di sessione
- [Instradamento del canale](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni

## Correlati

- [Session pruning](/it/concepts/session-pruning)
- [Session tools](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
