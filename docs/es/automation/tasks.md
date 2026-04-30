---
read_when:
    - Inspeccionar tareas en segundo plano en curso o completadas recientemente
    - Depuración de fallos de entrega en ejecuciones de agentes separadas
    - Comprender cómo las ejecuciones en segundo plano se relacionan con las sesiones, Cron y Heartbeat
sidebarTitle: Background tasks
summary: Seguimiento de tareas en segundo plano para ejecuciones de ACP, subagentes, trabajos de Cron aislados y operaciones de CLI
title: Tareas en segundo plano
x-i18n:
    generated_at: "2026-04-30T16:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 999653c9360323d5135e33193c76458cba8c288227de46a6217f1ccbed2a6d34
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
¿Buscas programación? Consulta [Automatización y tareas](/es/automation) para elegir el mecanismo adecuado. Esta página es el registro de actividad del trabajo en segundo plano, no el programador.
</Note>

Las tareas en segundo plano rastrean el trabajo que se ejecuta **fuera de tu sesión de conversación principal**: ejecuciones de ACP, generación de subagentes, ejecuciones aisladas de trabajos Cron y operaciones iniciadas por CLI.

Las tareas **no** sustituyen sesiones, trabajos Cron ni Heartbeats: son el **registro de actividad** que registra qué trabajo desacoplado ocurrió, cuándo y si se completó correctamente.

<Note>
No todas las ejecuciones de agente crean una tarea. Los turnos de Heartbeat y el chat interactivo normal no lo hacen. Todas las ejecuciones Cron, generaciones ACP, generaciones de subagentes y comandos de agente de CLI sí lo hacen.
</Note>

## Resumen rápido

- Las tareas son **registros**, no programadores: Cron y Heartbeat deciden _cuándo_ se ejecuta el trabajo; las tareas rastrean _qué ocurrió_.
- ACP, los subagentes, todos los trabajos Cron y las operaciones de CLI crean tareas. Los turnos de Heartbeat no.
- Cada tarea avanza por `queued → running → terminal` (succeeded, failed, timed_out, cancelled o lost).
- Las tareas Cron permanecen activas mientras el runtime de Cron aún es dueño del trabajo; si el estado del runtime en memoria desaparece, el mantenimiento de tareas primero comprueba el historial durable de ejecuciones Cron antes de marcar una tarea como perdida.
- La finalización se impulsa por inserción: el trabajo desacoplado puede notificar directamente o activar la sesión/Heartbeat solicitante cuando termina, por lo que los bucles de sondeo de estado suelen ser el enfoque equivocado.
- Las ejecuciones Cron aisladas y las finalizaciones de subagentes intentan, en la medida de lo posible, limpiar las pestañas/procesos de navegador rastreados para su sesión hija antes de la contabilidad de limpieza final.
- La entrega Cron aislada suprime respuestas intermedias obsoletas del padre mientras el trabajo de subagentes descendientes aún se está agotando, y prefiere la salida final descendiente cuando llega antes de la entrega.
- Las notificaciones de finalización se entregan directamente a un canal o se ponen en cola para el siguiente Heartbeat.
- `openclaw tasks list` muestra todas las tareas; `openclaw tasks audit` expone problemas.
- Los registros terminales se conservan durante 7 días y luego se depuran automáticamente.

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
    # Show details for a specific task (by ID, run ID, or session key)
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

| Origen                 | Tipo de runtime | Cuándo se crea un registro de tarea                    | Política de notificación predeterminada |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| Ejecuciones en segundo plano de ACP | `acp`        | Al generar una sesión hija de ACP                      | `done_only`           |
| Orquestación de subagentes | `subagent`   | Al generar un subagente mediante `sessions_spawn`      | `done_only`           |
| Trabajos Cron (todos los tipos) | `cron`       | Cada ejecución Cron (sesión principal y aislada)       | `silent`              |
| Operaciones de CLI     | `cli`        | Comandos `openclaw agent` que se ejecutan a través del Gateway | `silent`              |
| Trabajos multimedia del agente | `cli`        | Ejecuciones `video_generate` respaldadas por sesión    | `silent`              |

<AccordionGroup>
  <Accordion title="Valores predeterminados de notificación para Cron y multimedia">
    Las tareas Cron de sesión principal usan la política de notificación `silent` de forma predeterminada: crean registros para seguimiento, pero no generan notificaciones. Las tareas Cron aisladas también usan `silent` de forma predeterminada, pero son más visibles porque se ejecutan en su propia sesión.

    Las ejecuciones `video_generate` respaldadas por sesión también usan la política de notificación `silent`. Aun así crean registros de tareas, pero la finalización se devuelve a la sesión de agente original como una activación interna para que el agente pueda escribir el mensaje de seguimiento y adjuntar por sí mismo el video terminado. Si habilitas `tools.media.asyncCompletion.directSend`, las finalizaciones asíncronas de `music_generate` y `video_generate` intentan primero la entrega directa al canal antes de recurrir a la ruta de activación de la sesión solicitante.

  </Accordion>
  <Accordion title="Medida de seguridad de video_generate concurrente">
    Mientras una tarea `video_generate` respaldada por sesión sigue activa, la herramienta también actúa como medida de seguridad: las llamadas repetidas a `video_generate` en esa misma sesión devuelven el estado de la tarea activa en lugar de iniciar una segunda generación concurrente. Usa `action: "status"` cuando quieras una consulta explícita de progreso/estado desde el lado del agente.
  </Accordion>
  <Accordion title="Qué no crea tareas">
    - Turnos de Heartbeat: sesión principal; consulta [Heartbeat](/es/gateway/heartbeat)
    - Turnos normales de chat interactivo
    - Respuestas directas de `/command`

  </Accordion>
</AccordionGroup>

## Ciclo de vida de las tareas

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

| Estado      | Qué significa                                                             |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Creada, esperando a que el agente inicie                                  |
| `running`   | El turno del agente se está ejecutando activamente                        |
| `succeeded` | Se completó correctamente                                                  |
| `failed`    | Se completó con un error                                                   |
| `timed_out` | Superó el tiempo de espera configurado                                     |
| `cancelled` | Detenida por el operador mediante `openclaw tasks cancel`                 |
| `lost`      | El runtime perdió el estado de respaldo autoritativo después de un periodo de gracia de 5 minutos |

Las transiciones ocurren automáticamente: cuando termina la ejecución del agente asociada, el estado de la tarea se actualiza para coincidir.

La finalización de la ejecución del agente es autoritativa para los registros de tareas activos. Una ejecución desacoplada correcta finaliza como `succeeded`, los errores ordinarios de ejecución finalizan como `failed`, y los resultados de tiempo de espera o anulación finalizan como `timed_out`. Si un operador ya canceló la tarea, o el runtime ya registró un estado terminal más fuerte como `failed`, `timed_out` o `lost`, una señal posterior de éxito no degrada ese estado terminal.

`lost` tiene en cuenta el runtime:

- Tareas ACP: desaparecieron los metadatos de respaldo de la sesión hija ACP.
- Tareas de subagente: la sesión hija de respaldo desapareció del almacén del agente de destino.
- Tareas Cron: el runtime de Cron ya no rastrea el trabajo como activo y el historial durable de ejecuciones Cron no muestra un resultado terminal para esa ejecución. La auditoría de CLI sin conexión no trata su propio estado vacío del runtime Cron en proceso como autoridad.
- Tareas de CLI: las tareas de sesión hija aislada usan la sesión hija; las tareas de CLI respaldadas por chat usan en cambio el contexto de ejecución en vivo, por lo que las filas persistentes de sesión de canal/grupo/directa no las mantienen activas. Las ejecuciones `openclaw agent` respaldadas por Gateway también finalizan a partir de su resultado de ejecución, por lo que las ejecuciones completadas no permanecen activas hasta que el barrido las marca como `lost`.

## Entrega y notificaciones

Cuando una tarea alcanza un estado terminal, OpenClaw te notifica. Hay dos rutas de entrega:

**Entrega directa**: si la tarea tiene un destino de canal (el `requesterOrigin`), el mensaje de finalización va directamente a ese canal (Telegram, Discord, Slack, etc.). Para las finalizaciones de subagentes, OpenClaw también conserva el enrutamiento de hilo/tema enlazado cuando está disponible y puede rellenar un `to` / cuenta faltante desde la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de renunciar a la entrega directa.

**Entrega en cola de sesión**: si falla la entrega directa o no se definió ningún origen, la actualización se pone en cola como un evento del sistema en la sesión del solicitante y aparece en el siguiente Heartbeat.

<Tip>
La finalización de una tarea activa una activación inmediata de Heartbeat para que veas el resultado rápidamente; no tienes que esperar al siguiente tick programado de Heartbeat.
</Tip>

Eso significa que el flujo de trabajo habitual se basa en inserción: inicia el trabajo desacoplado una vez y deja que el runtime te active o notifique al finalizar. Sondea el estado de la tarea solo cuando necesites depuración, intervención o una auditoría explícita.

### Políticas de notificación

Controla cuánto recibes sobre cada tarea:

| Política                | Qué se entrega                                                         |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (predeterminada) | Solo estado terminal (succeeded, failed, etc.): **esta es la opción predeterminada** |
| `state_changes`       | Cada transición de estado y actualización de progreso                   |
| `silent`              | Nada en absoluto                                                        |

Cambia la política mientras una tarea se está ejecutando:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referencia de CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Columnas de salida: ID de tarea, Tipo, Estado, Entrega, ID de ejecución, Sesión hija, Resumen.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    El token de búsqueda acepta un ID de tarea, ID de ejecución o clave de sesión. Muestra el registro completo, incluidos tiempos, estado de entrega, error y resumen terminal.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Para tareas ACP y de subagentes, esto elimina la sesión hija. Para tareas rastreadas por CLI, la cancelación se registra en el registro de tareas (no hay un identificador de runtime hijo separado). El estado pasa a `cancelled` y se envía una notificación de entrega cuando corresponde.

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--json]
    ```

    Expone problemas operativos. Los hallazgos también aparecen en `openclaw status` cuando se detectan problemas.

    | Hallazgo                   | Gravedad   | Desencadenante                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | En cola durante más de 10 minutos                                                                              |
    | `stale_running`           | error      | En ejecución durante más de 30 minutos                                                                             |
    | `lost`                    | warn/error | La propiedad de la tarea respaldada por runtime desapareció; las tareas perdidas retenidas advierten hasta `cleanupAfter`, luego se convierten en errores |
    | `delivery_failed`         | warn       | La entrega falló y la política de notificación no es `silent`                                                            |
    | `missing_cleanup`         | warn       | Tarea terminal sin marca de tiempo de limpieza                                                                      |
    | `inconsistent_timestamps` | warn       | Infracción de la línea de tiempo (por ejemplo, terminó antes de empezar)                                                        |

  </Accordion>
  <Accordion title="mantenimiento de tareas">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Usa esto para previsualizar o aplicar conciliación, marcado de limpieza y poda para tareas y el estado de Task Flow.

    La conciliación tiene en cuenta el runtime:

    - Las tareas ACP/subagente comprueban su sesión secundaria subyacente.
    - Las tareas de subagente cuya sesión secundaria tiene una lápida de recuperación de reinicio se marcan como perdidas en lugar de tratarse como sesiones subyacentes recuperables.
    - Las tareas Cron comprueban si el runtime de cron aún posee el trabajo y luego recuperan el estado terminal de los registros persistidos de ejecuciones de cron/estado de trabajos antes de recurrir a `lost`. Solo el proceso Gateway es autoritativo para el conjunto de trabajos activos de cron en memoria; la auditoría CLI sin conexión usa historial duradero, pero no marca una tarea de cron como perdida solo porque ese Set local esté vacío.
    - Las tareas CLI respaldadas por chat comprueban el contexto de ejecución en vivo propietario, no solo la fila de sesión de chat.

    La limpieza de finalización también tiene en cuenta el runtime:

    - La finalización de subagente cierra en modo de mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión secundaria antes de que continúe la limpieza del anuncio.
    - La finalización de cron aislada cierra en modo de mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión de cron antes de que la ejecución se desmonte por completo.
    - La entrega de cron aislada espera el seguimiento de subagentes descendientes cuando es necesario y suprime el texto de acuse de recibo obsoleto del padre en lugar de anunciarlo.
    - La entrega de finalización de subagente prefiere el texto visible más reciente del asistente; si está vacío, recurre al texto saneado más reciente de herramienta/toolResult, y las ejecuciones de llamadas a herramientas que solo agotan el tiempo de espera pueden compactarse en un breve resumen de progreso parcial. Las ejecuciones terminales fallidas anuncian el estado de fallo sin reproducir el texto de respuesta capturado.
    - Los fallos de limpieza no enmascaran el resultado real de la tarea.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Usa estos comandos cuando lo que te importa es el Task Flow orquestador, en lugar de un registro individual de tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Tablero de tareas de chat (`/tasks`)

Usa `/tasks` en cualquier sesión de chat para ver tareas en segundo plano vinculadas a esa sesión. El tablero muestra tareas activas y completadas recientemente con runtime, estado, tiempos y detalles de progreso o error.

Cuando la sesión actual no tiene tareas vinculadas visibles, `/tasks` recurre a recuentos de tareas locales del agente para que aun así obtengas una vista general sin filtrar detalles de otras sesiones.

Para el libro mayor completo del operador, usa la CLI: `openclaw tasks list`.

## Integración de estado (presión de tareas)

`openclaw status` incluye un resumen de tareas de un vistazo:

```
Tasks: 3 queued · 2 running · 1 issues
```

El resumen informa:

- **active** — recuento de `queued` + `running`
- **failures** — recuento de `failed` + `timed_out` + `lost`
- **byRuntime** — desglose por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` como la herramienta `session_status` usan una instantánea de tareas con conocimiento de limpieza: se prefieren las tareas activas, se ocultan las filas completadas obsoletas y los fallos recientes solo aparecen cuando no queda trabajo activo. Esto mantiene la tarjeta de estado centrada en lo que importa ahora.

## Almacenamiento y mantenimiento

### Dónde viven las tareas

Los registros de tareas persisten en SQLite en:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

El registro se carga en memoria al iniciar Gateway y sincroniza las escrituras con SQLite para durabilidad entre reinicios.
Gateway mantiene acotado el registro de escritura anticipada de SQLite usando el umbral predeterminado
de autocheckpoint de SQLite más checkpoints `TRUNCATE` periódicos y durante el apagado.

### Mantenimiento automático

Un barrido se ejecuta cada **60 segundos** y gestiona cuatro cosas:

<Steps>
  <Step title="Conciliación">
    Comprueba si las tareas activas todavía tienen respaldo autoritativo de runtime. Las tareas ACP/subagente usan el estado de sesión secundaria, las tareas de cron usan la propiedad de trabajos activos y las tareas CLI respaldadas por chat usan el contexto de ejecución propietario. Si ese estado subyacente desaparece durante más de 5 minutos, la tarea se marca como `lost`.
  </Step>
  <Step title="Reparación de sesión ACP">
    Cierra sesiones ACP de un solo uso, terminales o huérfanas, propiedad del padre, y cierra sesiones ACP persistentes terminales obsoletas o huérfanas solo cuando no queda ningún vínculo de conversación activo.
  </Step>
  <Step title="Marcado de limpieza">
    Establece una marca de tiempo `cleanupAfter` en tareas terminales (endedAt + 7 días). Durante la retención, las tareas perdidas todavía aparecen en la auditoría como advertencias; después de que expire `cleanupAfter` o cuando falten metadatos de limpieza, son errores.
  </Step>
  <Step title="Poda">
    Elimina registros posteriores a su fecha `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retención:** los registros de tareas terminales se conservan durante **7 días** y luego se podan automáticamente. No se necesita configuración.
</Note>

## Cómo se relacionan las tareas con otros sistemas

<AccordionGroup>
  <Accordion title="Tareas y Task Flow">
    [Task Flow](/es/automation/taskflow) es la capa de orquestación de flujos por encima de las tareas en segundo plano. Un solo flujo puede coordinar varias tareas a lo largo de su vida útil usando modos de sincronización gestionados o reflejados. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo orquestador.

    Consulta [Task Flow](/es/automation/taskflow) para más detalles.

  </Accordion>
  <Accordion title="Tareas y cron">
    Una **definición** de trabajo cron vive en `~/.openclaw/cron/jobs.json`; el estado de ejecución de runtime vive junto a ella en `~/.openclaw/cron/jobs-state.json`. **Cada** ejecución de cron crea un registro de tarea, tanto de sesión principal como aislada. Las tareas cron de sesión principal usan por defecto la política de notificación `silent` para que se rastreen sin generar notificaciones.

    Consulta [Trabajos Cron](/es/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tareas y Heartbeat">
    Las ejecuciones de Heartbeat son turnos de sesión principal; no crean registros de tareas. Cuando una tarea se completa, puede activar un despertar de Heartbeat para que veas el resultado rápidamente.

    Consulta [Heartbeat](/es/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tareas y sesiones">
    Una tarea puede hacer referencia a un `childSessionKey` (donde se ejecuta el trabajo) y a un `requesterSessionKey` (quien la inició). Las sesiones son contexto de conversación; las tareas son seguimiento de actividad por encima de eso.
  </Accordion>
  <Accordion title="Tareas y ejecuciones de agente">
    El `runId` de una tarea enlaza con la ejecución de agente que realiza el trabajo. Los eventos del ciclo de vida del agente (inicio, fin, error) actualizan automáticamente el estado de la tarea; no necesitas gestionar el ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [CLI: Tareas](/es/cli/tasks) — referencia de comandos CLI
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de sesión principal
- [Tareas programadas](/es/automation/cron-jobs) — programación de trabajo en segundo plano
- [Task Flow](/es/automation/taskflow) — orquestación de flujos por encima de las tareas
