---
read_when:
    - Desea inspeccionar, auditar o cancelar registros de tareas en segundo plano
    - Estás documentando los comandos de flujo de tareas en `openclaw tasks flow`
summary: Referencia de CLI para `openclaw tasks` (registro de tareas en segundo plano y estado de Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Inspecciona tareas en segundo plano duraderas y el estado de Task Flow. Sin subcomando,
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

- `--json`: emite JSON.
- `--runtime <name>`: filtra por tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra por estado: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Enumera las tareas en segundo plano registradas, de la más reciente a la más antigua.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Muestra una tarea por ID de tarea, ID de ejecución o clave de sesión.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Cambia la política de notificaciones para una tarea en ejecución.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela una tarea en segundo plano en ejecución.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Muestra registros obsoletos, perdidos, con entrega fallida o incoherentes de otro modo para tareas y Task Flow. Las tareas perdidas retenidas hasta `cleanupAfter` son advertencias; las tareas perdidas vencidas o sin marca de tiempo son errores.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Previsualiza o aplica la reconciliación, el marcado de limpieza y la purga de tareas y Task Flow.
Para tareas cron, la reconciliación usa los registros de ejecución/estado de trabajo persistidos antes de marcar una tarea activa antigua como `lost`, de modo que las ejecuciones cron completadas no se conviertan en falsos errores de auditoría solo porque el estado del runtime de Gateway en memoria ya no exista. La auditoría de CLI sin conexión no es autoritativa para el conjunto de trabajos cron activos locales al proceso de Gateway. Las tareas de CLI con un ID de ejecución/ID de origen se marcan como `lost` cuando su contexto de ejecución de Gateway en vivo desaparece, aunque permanezca una fila antigua de sesión secundaria.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecciona o cancela el estado duradero de Task Flow bajo el registro de tareas.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas en segundo plano](/es/automation/tasks)
