---
read_when:
    - Inspeccionar el trabajo en segundo plano en curso o completado recientemente
    - Depuración de fallos de entrega para ejecuciones de agente desacopladas
    - Comprender cómo las ejecuciones en segundo plano se relacionan con las sesiones, Cron y Heartbeat
sidebarTitle: Background tasks
summary: Seguimiento de tareas en segundo plano para ejecuciones de ACP, subagentes, ejecuciones de Cron y operaciones de CLI
title: Tareas en segundo plano
x-i18n:
    generated_at: "2026-07-06T21:46:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 839c7ed9b199288ab577ab10cfad1dd6eba7054fef43d1dacc2d3a4483b4edf0
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
¿Buscas programación? Consulta [Automatización](/es/automation) para elegir el mecanismo adecuado. Esta página es el registro de actividad del trabajo en segundo plano, no el programador.
</Note>

Las tareas en segundo plano rastrean el trabajo que se ejecuta **fuera de tu sesión de conversación principal**: ejecuciones ACP, creaciones de subagentes, ejecuciones de trabajos cron y operaciones iniciadas por la CLI.

Las tareas **no** reemplazan las sesiones, los trabajos cron ni los Heartbeat: son el **registro de actividad** que registra qué trabajo desacoplado ocurrió, cuándo y si se completó correctamente.

<Note>
No todas las ejecuciones de agentes crean una tarea. Los turnos de Heartbeat y el chat interactivo normal no lo hacen. Todas las ejecuciones cron, creaciones ACP, creaciones de subagentes y comandos de agente CLI despachados por el Gateway sí lo hacen.
</Note>

## TL;DR

- Las tareas son **registros**, no programadores: cron y Heartbeat deciden _cuándo_ se ejecuta el trabajo; las tareas rastrean _qué ocurrió_.
- ACP, subagentes, todos los trabajos cron y operaciones CLI crean tareas. Los turnos de Heartbeat no.
- Cada tarea avanza por `queued → running → terminal` (succeeded, failed, timed_out, cancelled o lost).
- Las tareas cron permanecen activas mientras el runtime de cron todavía posea el trabajo; si el estado del runtime en memoria desaparece, el mantenimiento de tareas primero revisa el historial duradero de ejecuciones cron antes de marcar una tarea como perdida.
- La finalización se impulsa por push: el trabajo desacoplado puede notificar directamente o despertar la sesión solicitante/Heartbeat cuando termina, por lo que los bucles de sondeo de estado suelen tener una forma incorrecta.
- Las ejecuciones cron aisladas y las finalizaciones de subagentes hacen una limpieza de mejor esfuerzo de pestañas/procesos de navegador rastreados para su sesión hija antes de la contabilidad final de limpieza.
- La entrega cron aislada suprime las respuestas principales intermedias obsoletas mientras el trabajo de subagentes descendientes aún se está drenando, y prefiere la salida final descendiente cuando llega antes de la entrega.
- Las notificaciones de finalización se entregan directamente a un canal o se ponen en cola para el siguiente Heartbeat.
- `openclaw tasks list` muestra todas las tareas; `openclaw tasks audit` expone problemas.
- Los registros terminales se conservan durante 7 días (los registros `lost` durante 24 horas) y luego se depuran automáticamente.

## Inicio rápido

<Tabs>
  <Tab title="Listar y filtrar">
    ```bash
    # List all tasks (newest first)
    openclaw tasks list

    # Filter by runtime or status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Inspeccionar">
    ```bash
    # Show details for a specific task (by task ID, run ID, or session key)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Cancelar y notificar">
    ```bash
    # Cancel a running task (kills the child session)
    openclaw tasks cancel <lookup>

    # Change notification policy for a task
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Auditoría y mantenimiento">
    ```bash
    # Run a health audit
    openclaw tasks audit

    # Preview or apply maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Flujo de tareas">
    ```bash
    # Inspect TaskFlow state
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## Qué crea una tarea

| Origen                 | Tipo de runtime | Cuándo se crea un registro de tarea                                    | Política de notificación predeterminada |
| ---------------------- | ------------ | ---------------------------------------------------------------------- | --------------------- |
| Ejecuciones en segundo plano ACP | `acp`        | Al crear una sesión ACP hija                                           | `done_only`           |
| Orquestación de subagentes | `subagent`   | Al crear un subagente mediante `sessions_spawn`                        | `done_only`           |
| Trabajos cron (todos los tipos)  | `cron`       | Cada ejecución cron (sesión principal y aislada)                       | `silent`              |
| Operaciones CLI         | `cli`        | Comandos `openclaw agent` que se ejecutan a través del Gateway         | `silent`              |
| Trabajos de medios del agente | `cli`        | Ejecuciones respaldadas por sesión de `image_generate`/`music_generate`/`video_generate` | `silent`              |

<AccordionGroup>
  <Accordion title="Valores predeterminados de notificación para cron y medios">
    Las tareas cron (sesión principal y aisladas) usan la política de notificación `silent`: crean registros para seguimiento, pero no generan notificaciones de tarea propias; cron posee su ruta de entrega.

    Las ejecuciones respaldadas por sesión de `image_generate`, `music_generate` y `video_generate` también usan la política de notificación `silent`. Siguen creando registros de tareas, pero la finalización se devuelve a la sesión del agente original como un despertar interno para que el agente pueda escribir el mensaje de seguimiento y adjuntar él mismo los medios terminados. El agente solicitante sigue su contrato normal de respuesta visible: respuesta final automática cuando está configurada, o `message(action="send")` más `NO_REPLY` cuando la sesión requiere respuestas con herramienta de mensajes. Si la sesión solicitante ya no está activa o su despertar activo falla, y el agente de finalización omite algunos o todos los medios generados, OpenClaw envía una alternativa directa idempotente con solo los medios faltantes al destino de canal original.

  </Accordion>
  <Accordion title="Protección contra generación concurrente de medios">
    Mientras una tarea de generación de medios respaldada por sesión sigue activa, `image_generate`, `music_generate` y `video_generate` protegen contra reintentos accidentales: repetir la llamada para el mismo prompt/solicitud devuelve el estado de la tarea activa correspondiente en lugar de iniciar un duplicado, mientras que un prompt distinto puede iniciar su propia tarea. Usa `action: "status"` cuando quieras una búsqueda explícita de progreso/estado desde el lado del agente.
  </Accordion>
  <Accordion title="Qué no crea tareas">
    - Turnos de Heartbeat: sesión principal; consulta [Heartbeat](/es/gateway/heartbeat)
    - Turnos normales de chat interactivo
    - Respuestas directas de `/command`

  </Accordion>
</AccordionGroup>

## Ciclo de vida de la tarea

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    queued --> cancelled : operator cancels
    running --> cancelled : operator cancels
    queued --> lost : backing state gone > 5 min
    running --> lost : backing state gone > 5 min
```

| Estado      | Qué significa                                                               |
| ----------- | --------------------------------------------------------------------------- |
| `queued`    | Creada, esperando a que el agente inicie                                    |
| `running`   | El turno del agente se está ejecutando activamente                          |
| `succeeded` | Completada correctamente                                                    |
| `failed`    | Completada con un error                                                     |
| `timed_out` | Superó el tiempo de espera configurado                                      |
| `cancelled` | Detenida por el operador mediante `openclaw tasks cancel`, o la ejecución se abortó |
| `lost`      | El runtime perdió el estado de respaldo autoritativo después de un período de gracia de 5 minutos |

Las transiciones ocurren automáticamente: los eventos del ciclo de vida de ejecución del agente (inicio, fin, error) actualizan el estado de la tarea; no lo gestionas manualmente.

La finalización de la ejecución del agente es autoritativa para los registros de tareas activos. Una ejecución desacoplada correcta finaliza como `succeeded`, los errores ordinarios de ejecución finalizan como `failed`, los tiempos de espera finalizan como `timed_out`, y los resultados de cancelación/aborto finalizan como `cancelled`. Una vez que una tarea es terminal, las señales posteriores del ciclo de vida no la degradan: una tarea cancelada por el operador o ya marcada como `failed`/`timed_out`/`lost` permanece así aunque llegue después una señal de éxito.

`lost` es consciente del runtime:

- Tareas ACP: solo un turno ACP en proceso y activo en el Gateway prueba que la ejecución está viva; los metadatos de sesión persistidos por sí solos no lo hacen. La auditoría CLI sin conexión se mantiene conservadora y nunca reclama tareas ACP.
- Tareas de subagentes: la sesión hija de respaldo desapareció del almacén del agente de destino (o contiene una lápida de recuperación tras reinicio).
- Tareas cron: el runtime de cron ya no rastrea el trabajo como activo y el historial duradero de ejecuciones cron no muestra un resultado terminal para esa ejecución. La auditoría CLI sin conexión no trata su propio estado vacío de runtime cron en proceso como autoridad.
- Tareas CLI: las tareas con un id de ejecución/id de origen usan el contexto de ejecución activo, por lo que las filas persistentes de sesión hija o sesión de chat no las mantienen vivas después de que desaparece la ejecución propiedad del Gateway. Las tareas CLI heredadas sin identidad de ejecución aún recurren a la sesión hija. Las ejecuciones `openclaw agent` respaldadas por Gateway también finalizan a partir de su resultado de ejecución, por lo que las ejecuciones completadas no permanecen activas hasta que el barrendero las marca como `lost`.

## Entrega y notificaciones

Cuando una tarea alcanza un estado terminal, OpenClaw te notifica. Hay dos rutas de entrega:

**Entrega directa**: si la tarea tiene un destino de canal (el `requesterOrigin`), el mensaje de finalización va directamente a ese canal (Discord, Slack, Telegram, etc.). Las finalizaciones de tareas de grupo y canal se enrutan en cambio a través de la sesión solicitante para que el agente principal pueda escribir la respuesta visible. Para finalizaciones de subagentes, OpenClaw también conserva el enrutamiento enlazado de hilo/tema cuando está disponible y puede completar un `to` / cuenta faltante desde la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de renunciar a la entrega directa.

**Entrega en cola de sesión**: si la entrega directa falla o no se establece ningún origen, la actualización se encola como evento del sistema en la sesión del solicitante y aparece en el siguiente Heartbeat.

<Tip>
Las finalizaciones de tareas en cola de sesión disparan un despertar inmediato de Heartbeat, por lo que ves el resultado rápidamente: no tienes que esperar al siguiente tick programado de Heartbeat.
</Tip>

Eso significa que el flujo de trabajo habitual se basa en push: inicia el trabajo desacoplado una vez y luego deja que el runtime te despierte o notifique al finalizar. Sondea el estado de la tarea solo cuando necesites depuración, intervención o una auditoría explícita.

### Políticas de notificación

Controla cuánto oyes sobre cada tarea:

| Política                | Qué se entrega                                       |
| --------------------- | ------------------------------------------------------- |
| `done_only` (predeterminada) | Solo estado terminal (succeeded, failed, etc.)      |
| `state_changes`       | Cada transición de estado y actualización de progreso   |
| `silent`              | Nada en absoluto (predeterminada para tareas cron, CLI y de medios) |

Cambia la política mientras una tarea se ejecuta:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referencia CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Columnas de salida: Tarea, Tipo, Estado, Entrega, Ejecución, Sesión hija, Resumen. `openclaw tasks` sin argumentos se comporta como `openclaw tasks list`.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup> [--json]
    ```

    El token de búsqueda acepta un ID de tarea, ID de ejecución o clave de sesión. Muestra el registro completo, incluidos tiempos, estado de entrega, error y resumen terminal.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Para tareas ACP y de subagentes, esto mata la sesión hija; las cancelaciones ACP y cron se enrutan a través del Gateway en ejecución (`tasks.cancel`). Para tareas rastreadas por CLI, la cancelación se registra en el registro de tareas (no hay un identificador de runtime hijo separado). El estado cambia a `cancelled` y se envía una notificación de entrega cuando corresponde.

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
    ```

    Expone problemas operativos para tareas **y** TaskFlows en un solo informe. Los hallazgos también aparecen en `openclaw status` cuando se detectan problemas.

    Hallazgos de tareas:

    | Hallazgo                 | Gravedad   | Activador                                                                                                           |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
    | `stale_queued`            | warn       | En cola durante más de 10 minutos                                                                                    |
    | `stale_running`           | error      | En ejecución durante más de 30 minutos                                                                               |
    | `lost`                    | warn/error | La propiedad de la tarea respaldada por el runtime desapareció; las tareas perdidas retenidas advierten hasta `cleanupAfter` y luego se convierten en errores |
    | `delivery_failed`         | warn       | La entrega falló y la política de notificación no es `silent`                                                        |
    | `missing_cleanup`         | warn       | Tarea terminal sin marca de tiempo de limpieza                                                                       |
    | `inconsistent_timestamps` | warn       | Infracción de la línea de tiempo (por ejemplo, finalizó antes de comenzar)                                           |

    Hallazgos de TaskFlow:

    | Hallazgo               | Gravedad   | Activador                                                                    |
    | ---------------------- | ---------- | ----------------------------------------------------------------------------- |
    | `restore_failed`       | error      | Falló la restauración del registro de flujos desde SQLite                     |
    | `stale_running`        | error      | El flujo en ejecución no ha avanzado durante más de 30 minutos                |
    | `stale_waiting`        | warn       | El flujo en espera no ha avanzado durante más de 30 minutos                   |
    | `stale_blocked`        | warn       | El flujo bloqueado no ha avanzado durante más de 30 minutos                   |
    | `cancel_stuck`         | warn       | Cancelación solicitada hace más de 5 minutos, sin tareas hijas activas, aún no terminal |
    | `missing_linked_tasks` | warn/error | Flujo administrado obsoleto sin tareas enlazadas ni estado de espera          |
    | `blocked_task_missing` | warn       | El flujo bloqueado apunta a un id de tarea que ya no existe                   |

  </Accordion>
  <Accordion title="mantenimiento de tareas">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Usa esto para previsualizar o aplicar reconciliación, marcado de limpieza y poda para tareas, estado de TaskFlow y filas obsoletas del registro de sesiones de ejecución de cron.

    La reconciliación tiene en cuenta el runtime:

    - Las tareas ACP requieren un turno en proceso activo en el Gateway; las tareas de subagente verifican su sesión hija subyacente.
    - Las tareas de subagente cuya sesión hija tiene una lápida de recuperación tras reinicio se marcan como perdidas en lugar de tratarse como sesiones subyacentes recuperables.
    - Las tareas Cron verifican si el runtime de cron aún posee el trabajo, luego recuperan el estado terminal desde los registros persistidos de ejecución de cron/estado del trabajo antes de recurrir a `lost`. Solo el proceso Gateway es autoritativo para el conjunto en memoria de trabajos activos de cron; la auditoría CLI sin conexión usa historial durable, pero no marca una tarea cron como perdida solo porque ese conjunto local esté vacío.
    - Las tareas CLI con identidad de ejecución verifican el contexto de ejecución activo propietario, no solo las filas de sesión hija o sesión de chat.

    La limpieza de finalización también tiene en cuenta el runtime:

    - La finalización de subagente cierra con el mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión hija antes de que continúe la limpieza del anuncio.
    - La finalización de cron aislado cierra con el mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión cron antes de que la ejecución se desmonte por completo.
    - La entrega de cron aislado espera el seguimiento de subagentes descendientes cuando es necesario y suprime el texto obsoleto de acuse del padre en lugar de anunciarlo.
    - La entrega de finalización de subagente usa solo el texto de asistente visible más reciente del hijo. La salida tool/toolResult no se promociona a texto de resultado del hijo. Las ejecuciones terminales fallidas anuncian el estado de fallo sin reproducir el texto de respuesta capturado.
    - Los fallos de limpieza no ocultan el resultado real de la tarea.

    Al aplicar mantenimiento, OpenClaw también elimina filas obsoletas del registro de sesiones `cron:<jobId>:run:<runId>` con más de 7 días de antigüedad, mientras conserva las filas de trabajos cron actualmente en ejecución y deja intactas las filas de sesiones que no son cron.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    El token de búsqueda de flujo acepta un id de flujo o una clave de propietario. Usa estos comandos cuando lo que te importa es el [Task Flow](/es/automation/taskflow) orquestador y no un registro individual de tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Tablero de tareas de chat (`/tasks`)

Usa `/tasks` en cualquier sesión de chat para ver tareas en segundo plano enlazadas a esa sesión. El tablero muestra hasta cinco tareas activas y completadas recientemente con runtime, estado, tiempos y progreso o detalle de error.

Cuando la sesión actual no tiene tareas enlazadas visibles, `/tasks` recurre a los recuentos de tareas locales del agente para que aún tengas una vista general sin filtrar detalles de otras sesiones.

Para el libro mayor completo del operador, usa la CLI: `openclaw tasks list`.

### Control UI

La Control UI web tiene una página **Tareas** en la barra lateral con tareas en segundo plano activas y recientes en vivo. Úsala para inspeccionar el progreso, abrir sesiones enlazadas, actualizar el libro mayor o cancelar tareas en cola y en ejecución.

## Integración de estado (presión de tareas)

`openclaw status` incluye una línea de tareas de un vistazo:

```
Tasks    2 active · 1 queued · 1 running · 1 issue · audit clean · 6 tracked
```

El resumen cuenta el trabajo activo (`queued` + `running`), los fallos (`failed` + `timed_out` + `lost`), los hallazgos de auditoría y el total de registros rastreados; la carga JSON también desglosa los recuentos por runtime (`acp`, `subagent`, `cron`, `cli`).

Tanto `/status` como la herramienta `session_status` usan una instantánea de tareas consciente de la limpieza: se prefieren las tareas activas, se ocultan las filas expiradas y las tareas terminales solo aparecen durante una ventana reciente breve (5 minutos), con los fallos destacados cuando no queda trabajo activo. Esto mantiene la tarjeta de estado centrada en lo que importa ahora mismo.

## Almacenamiento y mantenimiento

### Dónde viven las tareas

Los registros de tareas y el estado de entrega persisten en la base de datos de estado SQLite compartida de OpenClaw:

```
~/.openclaw/state/openclaw.sqlite   (tables: task_runs, task_delivery_state, flow_runs)
```

Define `OPENCLAW_STATE_DIR` para mover toda la raíz de estado (por defecto `~/.openclaw`) a otro lugar; la ruta de la base de datos compartida se mueve con ella.

El registro se carga en memoria en el primer uso y persiste cada escritura de vuelta a SQLite, por lo que los registros sobreviven a reinicios del gateway. El crecimiento de WAL se mantiene acotado mediante el umbral de autocheckpoint predeterminado de SQLite más checkpoints `PASSIVE` periódicos; el apagado y los checkpoints de mantenimiento explícitos usan `TRUNCATE` para que los cierres normales recuperen espacio de WAL sin hacer que el barrido en segundo plano espere a lectores activos.

Los almacenes sidecar heredados de instalaciones anteriores (`tasks/runs.sqlite`, `flows/registry.sqlite`) son importados a la base de datos compartida por `openclaw doctor`.

### Mantenimiento automático

Un barrido se ejecuta cada **60 segundos** (primer pase unos 5 segundos después del inicio del gateway) y se encarga de cuatro cosas:

<Steps>
  <Step title="Reconciliación">
    Verifica si las tareas activas aún tienen respaldo autoritativo del runtime. Las tareas ACP requieren un turno en proceso activo, las tareas de subagente usan el estado de la sesión hija, las tareas cron usan propiedad de trabajo activo más historial de ejecución durable, y las tareas CLI con identidad de ejecución usan el contexto de ejecución propietario. Si el estado subyacente desaparece durante más de 5 minutos (30 minutos para tareas de subagente nativas sin hijos), la tarea se marca como `lost`.
  </Step>
  <Step title="Reparación de sesión ACP">
    Cierra sesiones ACP one-shot terminales o huérfanas propiedad del padre, y cierra sesiones ACP persistentes terminales obsoletas o huérfanas solo cuando no queda ningún enlace de conversación activo.
  </Step>
  <Step title="Marcado de limpieza">
    Establece una marca de tiempo `cleanupAfter` en tareas terminales (tiempo terminal + ventana de retención). Durante la retención, las tareas perdidas aún aparecen en la auditoría como advertencias; después de que expire `cleanupAfter` o cuando falten metadatos de limpieza, se convierten en errores.
  </Step>
  <Step title="Poda">
    Elimina registros posteriores a su fecha `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retención:** los registros de tareas terminales se conservan durante **7 días** (los registros `lost` durante **24 horas**) y luego se podan automáticamente. No se necesita configuración.
</Note>

## Cómo se relacionan las tareas con otros sistemas

<AccordionGroup>
  <Accordion title="Tareas y Task Flow">
    [Task Flow](/es/automation/taskflow) es la capa de orquestación de flujos por encima de las tareas en segundo plano. Un único flujo puede coordinar múltiples tareas durante su vida útil usando modos de sincronización administrados o reflejados. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo orquestador.

  </Accordion>
  <Accordion title="Tareas y cron">
    Las definiciones de trabajos Cron, el estado de ejecución del runtime y el historial de ejecución viven en la base de datos de estado SQLite compartida de OpenClaw. **Cada** ejecución de cron crea un registro de tarea, tanto de sesión principal como aislada, con política de notificación `silent`, por lo que las ejecuciones de cron se rastrean sin generar notificaciones de tarea propias.

    Consulta [Trabajos Cron](/es/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tareas y Heartbeat">
    Las ejecuciones de Heartbeat son turnos de sesión principal; no crean registros de tarea. Cuando una tarea se completa, puede activar un despertar de Heartbeat para que veas el resultado pronto.

    Consulta [Heartbeat](/es/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tareas y sesiones">
    Una tarea puede hacer referencia a una `childSessionKey` (donde se ejecuta el trabajo) y a una `requesterSessionKey` (quien la inició). Su `agentId` identifica al agente que ejecuta el trabajo, mientras que los campos de solicitante y propietario preservan el contexto de lanzamiento y control. Las sesiones son contexto de conversación; las tareas son seguimiento de actividad sobre eso.
  </Accordion>
  <Accordion title="Tareas y ejecuciones de agente">
    El `runId` de una tarea se enlaza con la ejecución de agente que realiza el trabajo. Los eventos del ciclo de vida del agente (inicio, fin, error) actualizan automáticamente el estado de la tarea; no necesitas administrar el ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización](/es/automation) - todos los mecanismos de automatización de un vistazo
- [CLI: Tareas](/es/cli/tasks) - referencia de comandos CLI
- [Heartbeat](/es/gateway/heartbeat) - turnos periódicos de sesión principal
- [Tareas programadas](/es/automation/cron-jobs) - programación de trabajo en segundo plano
- [Task Flow](/es/automation/taskflow) - orquestación de flujos por encima de tareas
