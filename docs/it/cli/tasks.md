---
read_when:
    - Vuoi ispezionare, verificare o annullare record di attività in background
    - Stai documentando i comandi di TaskFlow sotto `openclaw tasks flow`
summary: Riferimento CLI per `openclaw tasks` (registro delle attività in background e stato di TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T08:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Ispeziona attività durevoli in background e lo stato di TaskFlow. Senza sottocomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Vedi [Background Tasks](/it/automation/tasks) per il ciclo di vita e il modello di consegna.

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

## Opzioni root

- `--json`: output JSON.
- `--runtime <name>`: filtra per tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra per stato: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Sottocomandi

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Elenca le attività in background tracciate, dalla più recente alla meno recente.

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

Evidenzia record di attività e TaskFlow obsoleti, persi, con consegna fallita o altrimenti incoerenti.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mostra in anteprima o applica riconciliazione di attività e TaskFlow, marcatura di pulizia e potatura.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Ispeziona o annulla lo stato durevole di TaskFlow sotto il registro delle attività.
