---
read_when:
    - Quiere inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Está documentando comandos de TaskFlow en `openclaw tasks flow`
summary: Referencia de CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T14:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Inspeccione tareas duraderas en segundo plano y el estado de TaskFlow. Sin subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulte [Tareas en segundo plano](/es/automation/tasks) para ver el ciclo de vida y el modelo de entrega.

## Uso

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

## Opciones raíz

- `--json`: genera salida JSON.
- `--runtime <name>`: filtra por tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Lista las tareas en segundo plano rastreadas, de la más reciente a la más antigua.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Muestra una tarea por ID de tarea, ID de ejecución o clave de sesión.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Cambia la política de notificaciones de una tarea en ejecución.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela una tarea en segundo plano en ejecución.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Muestra registros obsoletos, perdidos, con entrega fallida o inconsistentes de otro modo de tareas y de TaskFlow.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica reconciliación de tareas y de TaskFlow, marcado de limpieza y poda.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de TaskFlow en el registro de tareas.
