---
read_when:
    - Quieres inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando comandos de TaskFlow bajo `openclaw tasks flow`
summary: Referencia de CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Inspecciona tareas en segundo plano duraderas y el estado de TaskFlow. Sin subcomando,
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

Muestra registros de tareas y TaskFlow obsoletos, perdidos, con errores de entrega o incoherentes por otros motivos. Las tareas perdidas conservadas hasta `cleanupAfter` son advertencias; las tareas perdidas caducadas o sin marca son errores.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica reconciliación, marcado de limpieza y poda de tareas y TaskFlow.
Para las tareas de cron, la reconciliación usa registros de ejecución/estado de trabajo persistidos antes de marcar una
tarea activa antigua como `lost`, para que las ejecuciones de cron completadas no se conviertan en falsos errores de auditoría
solo porque el estado de runtime en memoria del Gateway ya no exista. La auditoría de CLI sin conexión
no es autoritativa para el conjunto de trabajos activos de cron local al proceso del Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de TaskFlow dentro del registro de tareas.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
