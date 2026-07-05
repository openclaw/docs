---
read_when:
    - Quieres inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando comandos de Task Flow en `openclaw tasks flow`
summary: Referencia de CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-05T11:11:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Inspecciona las tareas en segundo plano duraderas y el estado de TaskFlow. Sin subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Tareas en segundo plano](/es/automation/tasks) para el ciclo de vida y el modelo
de entrega, y su sección `tasks audit` para ver las descripciones completas de los hallazgos.

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

| Marca              | Descripción                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Genera JSON.                                                                                       |
| `--runtime <name>` | Filtra por tipo: `subagent`, `acp`, `cron` o `cli`.                                                |
| `--status <name>`  | Filtra por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`. |

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

Muestra registros de tareas y Task Flow obsoletos, perdidos, con entrega fallida o incoherentes de otro modo. Las tareas perdidas retenidas hasta `cleanupAfter` son advertencias; las tareas perdidas caducadas o sin marca de tiempo son errores.

`--code` acepta códigos de tareas (`stale_queued`, `stale_running`, `lost`, `delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) y códigos de Task Flow (`restore_failed`, `stale_waiting`, `stale_blocked`, `cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Consulta [Tareas en segundo plano](/es/automation/tasks) para ver el detalle de severidad y activación por código.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica reconciliación de tareas y Task Flow, marcado de limpieza, depuración y limpieza del registro de sesiones de ejecuciones cron obsoletas.

Para tareas cron, la reconciliación usa registros de ejecución persistidos/estado del trabajo antes de marcar una tarea activa antigua como `lost`, de modo que las ejecuciones cron completadas no se conviertan en falsos errores de auditoría solo porque el estado de ejecución en memoria del Gateway haya desaparecido. La auditoría offline de la CLI no es autoritativa para el conjunto de trabajos cron activos local al proceso del Gateway. Las tareas de la CLI con un id. de ejecución/id. de origen se marcan como `lost` cuando su contexto de ejecución del Gateway en vivo desaparece, incluso si queda una fila antigua de sesión secundaria.

Cuando se aplica, el mantenimiento también depura filas del registro de sesiones `cron:<jobId>:run:<uuid>` con más de 7 días de antigüedad, preservando los trabajos cron actualmente en ejecución y dejando intactas las filas de sesiones que no son cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de Task Flow bajo el libro mayor de tareas. `flow list --status` acepta `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled` o `lost`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
