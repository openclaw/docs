---
read_when:
    - Quieres inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando comandos de Task Flow en `openclaw tasks flow`
summary: Referencia de la CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T05:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Inspecciona tareas duraderas en segundo plano y el estado de TaskFlow. Sin subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Tareas en segundo plano](/es/automation/tasks) para el ciclo de vida y el modelo de entrega.

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

- `--json`: salida en JSON.
- `--runtime <name>`: filtrar por tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtrar por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Lista las tareas en segundo plano registradas, primero las más recientes.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Muestra una tarea por ID de tarea, ID de ejecución o clave de sesión.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Cambia la política de notificación de una tarea en ejecución.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela una tarea en segundo plano en ejecución.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Muestra registros de tareas y de TaskFlow obsoletos, perdidos, con entrega fallida o inconsistentes por otros motivos.

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

Inspecciona o cancela el estado duradero de TaskFlow dentro del registro de tareas.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
