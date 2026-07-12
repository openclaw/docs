---
read_when:
    - Quieres inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando los comandos de TaskFlow en `openclaw tasks flow`
summary: Referencia de la CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-11T23:02:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Inspecciona las tareas duraderas en segundo plano y el estado de Task Flow. Sin un subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Tareas en segundo plano](/es/automation/tasks) para conocer el ciclo de vida y el modelo
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

| Indicador          | Descripción                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Genera la salida en formato JSON.                                                                  |
| `--runtime <name>` | Filtra por tipo: `subagent`, `acp`, `cron` o `cli`.                                                |
| `--status <name>`  | Filtra por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`. |

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Enumera las tareas en segundo plano registradas, comenzando por las más recientes.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Muestra una tarea por su identificador de tarea, identificador de ejecución o clave de sesión.

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

Muestra registros de tareas y Task Flow obsoletos, perdidos, con errores de entrega
o que presentan otras incoherencias. Las tareas perdidas conservadas hasta `cleanupAfter`
son advertencias; las tareas perdidas caducadas o sin marca de tiempo son errores.

`--code` acepta códigos de tareas (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) y códigos de Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Consulta
[Tareas en segundo plano](/es/automation/tasks) para obtener información detallada sobre la gravedad
y las condiciones de activación de cada código.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica la conciliación de tareas y Task Flow, el marcado para
limpieza, la depuración y la limpieza del registro de sesiones de ejecuciones de Cron obsoletas.

Para las tareas de Cron, la conciliación utiliza los registros persistentes de ejecución y el estado de los trabajos antes
de marcar una tarea activa antigua como `lost`, de modo que las ejecuciones de Cron completadas no se conviertan
en falsos errores de auditoría solo porque haya desaparecido el estado de ejecución en memoria del Gateway.
La auditoría sin conexión de la CLI no es la fuente autoritativa para el conjunto de trabajos activos de Cron
local al proceso del Gateway. Las tareas de la CLI con un identificador de ejecución o de origen se marcan como `lost` cuando
desaparece su contexto de ejecución activo en el Gateway, aunque permanezca un registro antiguo de sesión secundaria.

Cuando se aplica, el mantenimiento también depura los registros de sesiones
`cron:<jobId>:run:<uuid>` con más de 7 días de antigüedad, al tiempo que conserva los trabajos de Cron
actualmente en ejecución y no modifica los registros de sesiones que no pertenecen a Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de Task Flow en el registro de tareas.
`flow list --status` acepta `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` o `lost`.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
