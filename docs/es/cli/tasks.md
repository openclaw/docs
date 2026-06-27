---
read_when:
    - Quieres inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando comandos de Task Flow en `openclaw tasks flow`
summary: Referencia de CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-11T20:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Inspecciona tareas en segundo plano duraderas y el estado de Task Flow. Sin subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Tareas en segundo plano](/es/automation/tasks) para ver el ciclo de vida y el modelo de entrega.

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

## Opciones Raíz

- `--json`: genera JSON.
- `--runtime <name>`: filtra por tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Enumera las tareas en segundo plano rastreadas, de la más reciente a la más antigua.

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

Expone registros de tareas y Task Flow obsoletos, perdidos, con entrega fallida o incoherentes de otro modo. Las tareas perdidas retenidas hasta `cleanupAfter` son advertencias; las tareas perdidas vencidas o sin marca de tiempo son errores.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica la reconciliación de tareas y Task Flow, el marcado de limpieza, la poda
y la limpieza del registro de sesiones de ejecuciones cron obsoletas.
Para las tareas cron, la reconciliación usa registros de ejecución persistidos/estado del trabajo antes de marcar una
tarea activa antigua como `lost`, por lo que las ejecuciones cron completadas no se convierten en falsos errores de auditoría
solo porque el estado en memoria del runtime de Gateway ya no exista. La auditoría de CLI sin conexión
no es autoritativa para el conjunto de trabajos cron activos local al proceso de Gateway. Las tareas de CLI
con un ID de ejecución/ID de origen se marcan como `lost` cuando su contexto de ejecución vivo de Gateway
desaparece, incluso si queda una fila antigua de sesión hija.
Cuando se aplica, el mantenimiento también poda las filas del registro de sesiones `cron:<jobId>:run:<uuid>`
con más de 7 días de antigüedad mientras conserva los trabajos cron actualmente en ejecución y deja
intactas las filas de sesiones que no son cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de Task Flow bajo el libro mayor de tareas.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
