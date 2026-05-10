---
read_when:
    - Vuoi ispezionare, controllare o annullare i record delle attività in background
    - Stai documentando i comandi Task Flow in `openclaw tasks flow`
summary: Riferimento CLI per `openclaw tasks` (registro delle attività in background e stato del Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

Ispeziona le attività in background persistenti e lo stato di Task Flow. Senza sottocomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Vedi [Attività in background](/it/automation/tasks) per il ciclo di vita e il modello di consegna.

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

## Opzioni radice

- `--json`: restituisce JSON.
- `--runtime <name>`: filtra per tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra per stato: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Sottocomandi

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Elenca le attività in background tracciate, dalla più recente.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra una singola attività per ID attività, ID esecuzione o chiave di sessione.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifica la policy di notifica per un’attività in esecuzione.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annulla un’attività in background in esecuzione.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Fa emergere record di attività e Task Flow obsoleti, persi, con consegna non riuscita o altrimenti incoerenti. Le attività perse mantenute fino a `cleanupAfter` sono avvisi; le attività perse scadute o senza marcatura temporale sono errori.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mostra in anteprima o applica la riconciliazione di attività e Task Flow, la marcatura per la pulizia, la rimozione,
e la pulizia del registro delle sessioni di esecuzione Cron obsolete.
Per le attività Cron, la riconciliazione usa i log di esecuzione/lo stato dei job persistiti prima di contrassegnare una
vecchia attività attiva come `lost`, quindi le esecuzioni Cron completate non diventano falsi errori di audit
solo perché lo stato del runtime Gateway in memoria non è più presente. L’audit CLI offline non è
autoritativo per l’insieme dei job Cron attivi locali al processo del Gateway. Le attività CLI
con un ID esecuzione/ID sorgente vengono contrassegnate come `lost` quando il loro contesto di esecuzione Gateway attivo non è
più presente, anche se rimane una vecchia riga di sessione figlia.
Quando applicata, la manutenzione rimuove anche le righe del registro sessioni `cron:<jobId>:run:<uuid>`
più vecchie di 7 giorni, preservando i job Cron attualmente in esecuzione e lasciando
inalterate le righe di sessione non Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Ispeziona o annulla lo stato persistente di Task Flow nel registro delle attività.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività in background](/it/automation/tasks)
