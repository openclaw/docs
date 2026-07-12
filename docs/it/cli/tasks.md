---
read_when:
    - Vuoi esaminare, controllare o annullare i record delle attività in background
    - Stai documentando i comandi di TaskFlow in `openclaw tasks flow`
summary: Riferimento della CLI per `openclaw tasks` (registro delle attività in background e stato di TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T06:58:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Esamina le attività in background persistenti e lo stato di Task Flow. Senza sottocomandi,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Attività in background](/it/automation/tasks) per il modello del ciclo di vita e di recapito
e la relativa sezione `tasks audit` per le descrizioni complete dei risultati.

## Utilizzo

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Opzioni principali

| Flag               | Descrizione                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Genera l'output in formato JSON.                                                                   |
| `--runtime <name>` | Filtra per tipo: `subagent`, `acp`, `cron` o `cli`.                                                |
| `--status <name>`  | Filtra per stato: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.   |

## Sottocomandi

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Elenca le attività in background monitorate, dalla più recente.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra una singola attività in base all'ID attività, all'ID esecuzione o alla chiave di sessione.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifica la politica di notifica per un'attività in esecuzione.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annulla un'attività in background in esecuzione.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Segnala record di attività e Task Flow obsoleti, persi, con recapito non riuscito
o altrimenti incoerenti. Le attività perse conservate fino a `cleanupAfter` generano avvisi;
le attività perse scadute o prive di marcatura generano errori.

`--code` accetta codici attività (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) e codici di Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Consulta
[Attività in background](/it/automation/tasks) per i dettagli sulla gravità e sulle condizioni di attivazione di ciascun
codice.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mostra un'anteprima o applica la riconciliazione delle attività e di Task Flow, la marcatura
per la pulizia, l'eliminazione e la pulizia del registro delle sessioni di esecuzione Cron obsolete.

Per le attività Cron, la riconciliazione utilizza i log di esecuzione persistenti e lo stato del processo prima
di contrassegnare una vecchia attività attiva come `lost`, affinché le esecuzioni Cron completate non diventino
falsi errori di controllo solo perché lo stato di runtime del Gateway in memoria non è più disponibile.
Il controllo offline della CLI non è autorevole per l'insieme di processi Cron attivi
locale al processo del Gateway. Le attività CLI con un ID esecuzione/ID origine vengono contrassegnate come `lost` quando
il relativo contesto di esecuzione attivo del Gateway non è più disponibile, anche se rimane una vecchia riga
della sessione figlia.

Quando viene applicata, la manutenzione elimina inoltre le righe del registro delle sessioni
`cron:<jobId>:run:<uuid>` più vecchie di 7 giorni, preservando i processi Cron attualmente in esecuzione
e lasciando inalterate le righe delle sessioni non Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Esamina o annulla lo stato persistente di Task Flow nel registro delle attività.
`flow list --status` accetta `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` o `lost`.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Attività in background](/it/automation/tasks)
