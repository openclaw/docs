---
read_when:
    - Vuoi ispezionare, verificare o annullare i record delle attività in background
    - Stai documentando i comandi di TaskFlow sotto `openclaw tasks flow`
summary: Riferimento CLI per `openclaw tasks` (registro delle attività in background e stato di Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Ispeziona le attività in background durevoli e lo stato di Task Flow. Senza sottocomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Attività in background](/it/automation/tasks) per il ciclo di vita e il modello di consegna.

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

- `--json`: produce JSON.
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

Mostra una singola attività tramite ID attività, ID esecuzione o chiave di sessione.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifica la policy di notifica per un'attività in esecuzione.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annulla un'attività in background in esecuzione.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Evidenzia record di attività e Task Flow obsoleti, persi, con consegna non riuscita o comunque incoerenti. Le attività perse conservate fino a `cleanupAfter` sono avvisi; le attività perse scadute o senza timestamp sono errori.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualizza in anteprima o applica la riconciliazione di attività e Task Flow, l'applicazione dei timestamp di pulizia e la rimozione.
Per le attività cron, la riconciliazione usa i log di esecuzione/stato job persistiti prima di contrassegnare una vecchia attività attiva come `lost`, quindi le esecuzioni cron completate non diventano falsi errori di audit solo perché lo stato del runtime Gateway in memoria non è più presente. L'audit CLI offline non è autorevole per l'insieme dei job cron attivi locali al processo del Gateway. Le attività CLI con ID esecuzione/ID origine vengono contrassegnate come `lost` quando il relativo contesto di esecuzione Gateway live non è più presente, anche se rimane una vecchia riga di sessione figlia.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Ispeziona o annulla lo stato durevole di Task Flow nel registro delle attività.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività in background](/it/automation/tasks)
