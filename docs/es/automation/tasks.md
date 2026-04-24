---
read_when:
    - Inspeccionar trabajo en segundo plano en curso o completado recientemente
    - Depuración de fallos de entrega en ejecuciones desacopladas de agentes
    - Comprender cómo las ejecuciones en segundo plano se relacionan con las sesiones, Cron y Heartbeat
summary: Seguimiento de tareas en segundo plano para ejecuciones de ACP, subagentes, trabajos de Cron aislados y operaciones de CLI
title: Tareas en segundo plano
x-i18n:
    generated_at: "2026-04-24T05:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10f16268ab5cce8c3dfd26c54d8d913c0ac0f9bfb4856ed1bb28b085ddb78528
    source_path: automation/tasks.md
    workflow: 15
---

> **¿Buscas programación?** Consulta [Automatización y tareas](/es/automation) para elegir el mecanismo correcto. Esta página cubre el **seguimiento** del trabajo en segundo plano, no su programación.

Las tareas en segundo plano registran trabajo que se ejecuta **fuera de tu sesión principal de conversación**:
ejecuciones de ACP, creación de subagentes, ejecuciones aisladas de trabajos de Cron y operaciones iniciadas por la CLI.

Las tareas **no** sustituyen a las sesiones, los trabajos de Cron ni los Heartbeats; son el **registro de actividad** que documenta qué trabajo desacoplado ocurrió, cuándo y si tuvo éxito.

<Note>
No todas las ejecuciones de agentes crean una tarea. Los turnos de Heartbeat y el chat interactivo normal no lo hacen. Todas las ejecuciones de Cron, las creaciones de ACP, las creaciones de subagentes y los comandos de agente desde la CLI sí lo hacen.
</Note>

## Resumen rápido

- Las tareas son **registros**, no planificadores: Cron y Heartbeat deciden _cuándo_ se ejecuta el trabajo, las tareas registran _qué ocurrió_.
- ACP, los subagentes, todos los trabajos de Cron y las operaciones de la CLI crean tareas. Los turnos de Heartbeat no.
- Cada tarea pasa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled o lost).
- Las tareas de Cron siguen activas mientras el runtime de Cron siga siendo propietario del trabajo; las tareas de CLI respaldadas por chat solo siguen activas mientras su contexto de ejecución propietario siga activo.
- La finalización está impulsada por notificaciones push: el trabajo desacoplado puede notificar directamente o activar la sesión solicitante/el Heartbeat cuando termina, por lo que los bucles de sondeo de estado normalmente no son el enfoque adecuado.
- Las ejecuciones aisladas de Cron y las finalizaciones de subagentes limpian, en el mejor esfuerzo posible, las pestañas/procesos de navegador rastreados para su sesión hija antes de la contabilidad final de limpieza.
- La entrega de Cron aislado suprime respuestas provisionales obsoletas del padre mientras el trabajo descendiente de subagentes aún se está drenando, y prefiere la salida final descendiente cuando esta llega antes de la entrega.
- Las notificaciones de finalización se entregan directamente a un canal o se ponen en cola para el siguiente Heartbeat.
- `openclaw tasks list` muestra todas las tareas; `openclaw tasks audit` muestra problemas.
- Los registros terminales se conservan durante 7 días y luego se eliminan automáticamente.

## Inicio rápido

```bash
# Lista todas las tareas (las más recientes primero)
openclaw tasks list

# Filtra por runtime o estado
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Muestra detalles de una tarea específica (por ID, ID de ejecución o clave de sesión)
openclaw tasks show <lookup>

# Cancela una tarea en ejecución (termina la sesión hija)
openclaw tasks cancel <lookup>

# Cambia la política de notificación de una tarea
openclaw tasks notify <lookup> state_changes

# Ejecuta una auditoría de estado
openclaw tasks audit

# Previsualiza o aplica mantenimiento
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Inspecciona el estado de TaskFlow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Qué crea una tarea

| Origen                 | Tipo de runtime | Cuándo se crea un registro de tarea                    | Política de notificación predeterminada |
| ---------------------- | --------------- | ------------------------------------------------------ | --------------------------------------- |
| Ejecuciones en segundo plano de ACP | `acp`        | Al crear una sesión hija de ACP                        | `done_only`                             |
| Orquestación de subagentes | `subagent`   | Al crear un subagente mediante `sessions_spawn`        | `done_only`                             |
| Trabajos de Cron (todos los tipos) | `cron`       | Cada ejecución de Cron (sesión principal y aislada)    | `silent`                                |
| Operaciones de la CLI  | `cli`           | Comandos `openclaw agent` que se ejecutan mediante el Gateway | `silent`                          |
| Trabajos multimedia del agente | `cli`     | Ejecuciones `video_generate` respaldadas por sesión    | `silent`                                |

Las tareas de Cron de sesión principal usan la política de notificación `silent` de forma predeterminada: crean registros para seguimiento, pero no generan notificaciones. Las tareas de Cron aisladas también usan `silent` de forma predeterminada, pero son más visibles porque se ejecutan en su propia sesión.

Las ejecuciones `video_generate` respaldadas por sesión también usan la política de notificación `silent`. Siguen creando registros de tarea, pero la finalización se devuelve a la sesión original del agente como una activación interna para que el agente pueda escribir el mensaje de seguimiento y adjuntar el video terminado por sí mismo. Si optas por `tools.media.asyncCompletion.directSend`, las finalizaciones asíncronas de `music_generate` y `video_generate` intentan primero la entrega directa al canal antes de recurrir a la activación de la sesión solicitante.

Mientras una tarea `video_generate` respaldada por sesión siga activa, la herramienta también actúa como medida de protección: las llamadas repetidas a `video_generate` en esa misma sesión devuelven el estado de la tarea activa en lugar de iniciar una segunda generación concurrente. Usa `action: "status"` cuando quieras una consulta explícita de progreso/estado desde el lado del agente.

**Qué no crea tareas:**

- Turnos de Heartbeat: sesión principal; consulta [Heartbeat](/es/gateway/heartbeat)
- Turnos normales de chat interactivo
- Respuestas directas de `/command`

## Ciclo de vida de la tarea

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Estado      | Qué significa                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Creada, esperando a que el agente comience                                 |
| `running`   | El turno del agente se está ejecutando activamente                         |
| `succeeded` | Completada con éxito                                                       |
| `failed`    | Completada con un error                                                    |
| `timed_out` | Superó el tiempo de espera configurado                                     |
| `cancelled` | Detenida por el operador mediante `openclaw tasks cancel`                  |
| `lost`      | El runtime perdió el estado de respaldo autoritativo tras un período de gracia de 5 minutos |

Las transiciones ocurren automáticamente: cuando finaliza la ejecución de agente asociada, el estado de la tarea se actualiza para coincidir.

`lost` depende del runtime:

- Tareas de ACP: desaparecieron los metadatos de respaldo de la sesión hija de ACP.
- Tareas de subagente: la sesión hija de respaldo desapareció del almacén del agente de destino.
- Tareas de Cron: el runtime de Cron ya no rastrea el trabajo como activo.
- Tareas de CLI: las tareas aisladas de sesión hija usan la sesión hija; las tareas de CLI respaldadas por chat usan en su lugar el contexto de ejecución activo, por lo que las filas persistentes de sesión de canal/grupo/directa no las mantienen activas.

## Entrega y notificaciones

Cuando una tarea alcanza un estado terminal, OpenClaw te notifica. Hay dos rutas de entrega:

**Entrega directa**: si la tarea tiene un destino de canal (el `requesterOrigin`), el mensaje de finalización va directamente a ese canal (Telegram, Discord, Slack, etc.). Para las finalizaciones de subagentes, OpenClaw también conserva el enrutamiento de hilo/tema vinculado cuando está disponible y puede completar un `to` / cuenta faltante desde la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de renunciar a la entrega directa.

**Entrega en cola de sesión**: si la entrega directa falla o no hay un origen establecido, la actualización se pone en cola como un evento del sistema en la sesión del solicitante y aparece en el siguiente Heartbeat.

<Tip>
La finalización de una tarea activa un Heartbeat inmediato para que veas el resultado rápidamente; no tienes que esperar al siguiente tick programado de Heartbeat.
</Tip>

Eso significa que el flujo de trabajo habitual se basa en notificaciones push: inicia una vez el trabajo desacoplado y luego deja que el runtime te active o notifique al completarse. Sondea el estado de la tarea solo cuando necesites depuración, intervención o una auditoría explícita.

### Políticas de notificación

Controla cuánto recibes sobre cada tarea:

| Política              | Qué se entrega                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (predeterminada) | Solo el estado terminal (succeeded, failed, etc.) — **este es el valor predeterminado** |
| `state_changes`       | Cada transición de estado y actualización de progreso                  |
| `silent`              | Nada en absoluto                                                       |

Cambia la política mientras una tarea está en ejecución:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referencia de CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Columnas de salida: ID de tarea, tipo, estado, entrega, ID de ejecución, sesión hija, resumen.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

El token de búsqueda acepta un ID de tarea, ID de ejecución o clave de sesión. Muestra el registro completo, incluido el tiempo, el estado de entrega, el error y el resumen terminal.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

Para tareas de ACP y de subagente, esto termina la sesión hija. Para tareas rastreadas por la CLI, la cancelación se registra en el registro de tareas (no hay un identificador separado del runtime hijo). El estado pasa a `cancelled` y se envía una notificación de entrega cuando corresponde.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Muestra problemas operativos. Los hallazgos también aparecen en `openclaw status` cuando se detectan problemas.

| Hallazgo                  | Severidad | Desencadenante                                        |
| ------------------------- | --------- | ----------------------------------------------------- |
| `stale_queued`            | warn      | En cola durante más de 10 minutos                     |
| `stale_running`           | error     | En ejecución durante más de 30 minutos                |
| `lost`                    | error     | Desapareció la propiedad respaldada por runtime de la tarea |
| `delivery_failed`         | warn      | La entrega falló y la política de notificación no es `silent` |
| `missing_cleanup`         | warn      | Tarea terminal sin marca de tiempo de limpieza        |
| `inconsistent_timestamps` | warn      | Violación de la línea temporal (por ejemplo, terminó antes de empezar) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Usa esto para previsualizar o aplicar reconciliación, marcado de limpieza y depuración para tareas y el estado de TaskFlow.

La reconciliación depende del runtime:

- Las tareas de ACP/subagente comprueban su sesión hija de respaldo.
- Las tareas de Cron comprueban si el runtime de Cron sigue siendo propietario del trabajo.
- Las tareas de CLI respaldadas por chat comprueban el contexto activo de ejecución propietario, no solo la fila de sesión de chat.

La limpieza al completarse también depende del runtime:

- La finalización de subagentes cierra, en el mejor esfuerzo posible, las pestañas/procesos de navegador rastreados para la sesión hija antes de que continúe la limpieza del anuncio.
- La finalización de Cron aislado cierra, en el mejor esfuerzo posible, las pestañas/procesos de navegador rastreados para la sesión de Cron antes de que la ejecución se desmonte por completo.
- La entrega de Cron aislado espera, cuando es necesario, a que termine el seguimiento descendiente de subagentes y suprime texto obsoleto de confirmación del padre en lugar de anunciarlo.
- La entrega al completarse del subagente prefiere el texto visible más reciente del asistente; si está vacío, recurre al texto más reciente saneado de tool/toolResult, y las ejecuciones con llamada de herramienta solo por tiempo de espera pueden reducirse a un breve resumen de progreso parcial. Las ejecuciones terminales fallidas anuncian el estado de fallo sin reproducir el texto de respuesta capturado.
- Los fallos de limpieza no ocultan el resultado real de la tarea.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Usa estos comandos cuando lo que te interesa es el TaskFlow de orquestación, en lugar de un único registro de tarea en segundo plano.

## Panel de tareas del chat (`/tasks`)

Usa `/tasks` en cualquier sesión de chat para ver las tareas en segundo plano vinculadas a esa sesión. El panel muestra tareas activas y completadas recientemente con runtime, estado, tiempos y detalles de progreso o error.

Cuando la sesión actual no tiene tareas vinculadas visibles, `/tasks` recurre a recuentos de tareas locales del agente
para que sigas teniendo una visión general sin filtrar detalles de otras sesiones.

Para el registro completo del operador, usa la CLI: `openclaw tasks list`.

## Integración de estado (presión de tareas)

`openclaw status` incluye un resumen de tareas de un vistazo:

```
Tasks: 3 queued · 2 running · 1 issues
```

El resumen informa:

- **active**: recuento de `queued` + `running`
- **failures**: recuento de `failed` + `timed_out` + `lost`
- **byRuntime**: desglose por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` como la herramienta `session_status` usan una instantánea de tareas con reconocimiento de limpieza: se priorizan las tareas activas, se ocultan las filas completadas obsoletas y los fallos recientes solo aparecen cuando ya no queda trabajo activo. Esto mantiene la tarjeta de estado centrada en lo que importa en este momento.

## Almacenamiento y mantenimiento

### Dónde viven las tareas

Los registros de tareas persisten en SQLite en:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

El registro se carga en memoria al iniciar el Gateway y sincroniza las escrituras en SQLite para ofrecer durabilidad entre reinicios.

### Mantenimiento automático

Un proceso de limpieza se ejecuta cada **60 segundos** y gestiona tres cosas:

1. **Reconciliación**: comprueba si las tareas activas aún tienen un respaldo autoritativo del runtime. Las tareas de ACP/subagente usan el estado de la sesión hija, las tareas de Cron usan la propiedad del trabajo activo y las tareas de CLI respaldadas por chat usan el contexto de ejecución propietario. Si ese estado de respaldo desaparece durante más de 5 minutos, la tarea se marca como `lost`.
2. **Marcado de limpieza**: establece una marca de tiempo `cleanupAfter` en las tareas terminales (`endedAt + 7 days`).
3. **Depuración**: elimina registros cuya fecha `cleanupAfter` ya pasó.

**Retención**: los registros de tareas terminales se conservan durante **7 días** y luego se eliminan automáticamente. No se necesita configuración.

## Cómo se relacionan las tareas con otros sistemas

### Tareas y TaskFlow

[TaskFlow](/es/automation/taskflow) es la capa de orquestación de flujos por encima de las tareas en segundo plano. Un solo flujo puede coordinar múltiples tareas a lo largo de su vida útil usando modos de sincronización administrados o reflejados. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo de orquestación.

Consulta [TaskFlow](/es/automation/taskflow) para más detalles.

### Tareas y Cron

Una **definición** de trabajo de Cron vive en `~/.openclaw/cron/jobs.json`; el estado de ejecución del runtime vive junto a ella en `~/.openclaw/cron/jobs-state.json`. **Cada** ejecución de Cron crea un registro de tarea, tanto en sesión principal como aislada. Las tareas de Cron de sesión principal usan la política de notificación `silent` de forma predeterminada, por lo que hacen seguimiento sin generar notificaciones.

Consulta [Trabajos de Cron](/es/automation/cron-jobs).

### Tareas y Heartbeat

Las ejecuciones de Heartbeat son turnos de sesión principal; no crean registros de tarea. Cuando una tarea se completa, puede activar un Heartbeat para que veas el resultado rápidamente.

Consulta [Heartbeat](/es/gateway/heartbeat).

### Tareas y sesiones

Una tarea puede hacer referencia a un `childSessionKey` (donde se ejecuta el trabajo) y a un `requesterSessionKey` (quién la inició). Las sesiones son el contexto de conversación; las tareas son el seguimiento de actividad por encima de ese contexto.

### Tareas y ejecuciones de agentes

El `runId` de una tarea enlaza con la ejecución del agente que realiza el trabajo. Los eventos del ciclo de vida del agente (inicio, fin, error) actualizan automáticamente el estado de la tarea; no necesitas gestionar el ciclo de vida manualmente.

## Relacionado

- [Automatización y tareas](/es/automation): todos los mecanismos de automatización de un vistazo
- [TaskFlow](/es/automation/taskflow): orquestación de flujos por encima de las tareas
- [Tareas programadas](/es/automation/cron-jobs): programación de trabajo en segundo plano
- [Heartbeat](/es/gateway/heartbeat): turnos periódicos de sesión principal
- [CLI: Tasks](/es/cli/tasks): referencia de comandos de CLI
