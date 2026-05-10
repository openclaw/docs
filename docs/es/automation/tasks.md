---
read_when:
    - Inspeccionar trabajo en segundo plano en curso o completado recientemente
    - Depuración de fallos de entrega en ejecuciones de agente desvinculadas
    - Comprender cómo las ejecuciones en segundo plano se relacionan con las sesiones, Cron y Heartbeat
sidebarTitle: Background tasks
summary: Seguimiento de tareas en segundo plano para ejecuciones de ACP, subagentes, trabajos Cron aislados y operaciones de CLI
title: Tareas en segundo plano
x-i18n:
    generated_at: "2026-05-10T19:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5764a89634f90181d826ff3990ec8dac9538239074934d30fd446c1eb4564869
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
¿Buscas programación? Consulta [Automatización y tareas](/es/automation) para elegir el mecanismo adecuado. Esta página es el registro de actividad del trabajo en segundo plano, no el programador.
</Note>

Las tareas en segundo plano hacen seguimiento del trabajo que se ejecuta **fuera de tu sesión de conversación principal**: ejecuciones de ACP, inicios de subagentes, ejecuciones aisladas de trabajos Cron y operaciones iniciadas por la CLI.

Las tareas **no** sustituyen a las sesiones, los trabajos Cron ni los Heartbeats: son el **registro de actividad** que documenta qué trabajo separado ocurrió, cuándo y si tuvo éxito.

<Note>
No toda ejecución de agente crea una tarea. Los turnos de Heartbeat y el chat interactivo normal no lo hacen. Todas las ejecuciones Cron, inicios de ACP, inicios de subagentes y comandos de agente de la CLI sí lo hacen.
</Note>

## TL;DR

- Las tareas son **registros**, no programadores: Cron y Heartbeat deciden _cuándo_ se ejecuta el trabajo; las tareas registran _qué ocurrió_.
- ACP, los subagentes, todos los trabajos Cron y las operaciones de la CLI crean tareas. Los turnos de Heartbeat no.
- Cada tarea avanza por `queued → running → terminal` (succeeded, failed, timed_out, cancelled o lost).
- Las tareas Cron permanecen activas mientras el runtime de Cron siga siendo dueño del trabajo; si el
  estado del runtime en memoria desaparece, el mantenimiento de tareas primero revisa el historial durable de
  ejecuciones Cron antes de marcar una tarea como perdida.
- La finalización se impulsa por notificaciones push: el trabajo separado puede notificar directamente o despertar la
  sesión/Heartbeat solicitante cuando termina, por lo que los bucles de sondeo de estado
  suelen tener una forma equivocada.
- Las ejecuciones aisladas de Cron y las finalizaciones de subagentes hacen una limpieza de mejor esfuerzo de las pestañas/procesos de navegador rastreados para su sesión secundaria antes de la contabilidad de limpieza final.
- La entrega aislada de Cron suprime respuestas principales intermedias obsoletas mientras el trabajo de subagentes descendientes todavía se está drenando, y prefiere la salida descendiente final cuando llega antes de la entrega.
- Las notificaciones de finalización se entregan directamente a un canal o se ponen en cola para el siguiente Heartbeat.
- `openclaw tasks list` muestra todas las tareas; `openclaw tasks audit` expone problemas.
- Los registros terminales se conservan durante 7 días y luego se eliminan automáticamente.

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
| Ejecuciones en segundo plano de ACP | `acp`        | Al iniciar una sesión ACP secundaria                   | `done_only`           |
| Orquestación de subagentes | `subagent`   | Al iniciar un subagente mediante `sessions_spawn`      | `done_only`           |
| Trabajos Cron (todos los tipos) | `cron`       | Cada ejecución Cron (de sesión principal y aislada)    | `silent`              |
| Operaciones de la CLI  | `cli`        | Comandos `openclaw agent` que se ejecutan a través del Gateway | `silent`              |
| Trabajos multimedia del agente | `cli`        | Ejecuciones respaldadas por sesión de `music_generate`/`video_generate` | `silent`              |

<AccordionGroup>
  <Accordion title="Valores predeterminados de notificación para Cron y multimedia">
    Las tareas Cron de sesión principal usan la política de notificación `silent` de forma predeterminada: crean registros para seguimiento, pero no generan notificaciones. Las tareas Cron aisladas también usan `silent` de forma predeterminada, pero son más visibles porque se ejecutan en su propia sesión.

    Las ejecuciones respaldadas por sesión de `music_generate` y `video_generate` también usan la política de notificación `silent`. Siguen creando registros de tareas, pero la finalización se devuelve a la sesión de agente original como un despertar interno para que el agente pueda escribir el mensaje de seguimiento y adjuntar el contenido multimedia terminado por sí mismo. Las finalizaciones de grupo/canal siguen la política normal de respuesta visible, por lo que el agente usa la herramienta de mensajes cuando la entrega de origen lo requiere. Si el agente de finalización no produce evidencia de entrega con herramienta de mensajes en una ruta solo de herramientas, OpenClaw envía la reserva de finalización directamente al canal original en lugar de dejar el contenido multimedia privado.

  </Accordion>
  <Accordion title="Barrera de seguridad para video_generate concurrente">
    Mientras una tarea `video_generate` respaldada por sesión siga activa, la herramienta también actúa como barrera de seguridad: las llamadas repetidas a `video_generate` en esa misma sesión devuelven el estado de la tarea activa en lugar de iniciar una segunda generación concurrente. Usa `action: "status"` cuando quieras una consulta explícita de progreso/estado desde el lado del agente.
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

| Estado      | Qué significa                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Creada, esperando a que el agente se inicie                                |
| `running`   | El turno del agente se está ejecutando activamente                         |
| `succeeded` | Completada correctamente                                                   |
| `failed`    | Completada con un error                                                    |
| `timed_out` | Superó el tiempo de espera configurado                                     |
| `cancelled` | Detenida por el operador mediante `openclaw tasks cancel`                  |
| `lost`      | El runtime perdió el estado de respaldo autoritativo tras un periodo de gracia de 5 minutos |

Las transiciones ocurren automáticamente: cuando la ejecución de agente asociada termina, el estado de la tarea se actualiza para coincidir.

La finalización de la ejecución del agente es autoritativa para los registros de tareas activos. Una ejecución separada exitosa finaliza como `succeeded`, los errores ordinarios de ejecución finalizan como `failed`, y los resultados de tiempo agotado o aborto finalizan como `timed_out`. Si un operador ya canceló la tarea, o el runtime ya registró un estado terminal más fuerte como `failed`, `timed_out` o `lost`, una señal de éxito posterior no rebaja ese estado terminal.

`lost` es consciente del runtime:

- Tareas ACP: desaparecieron los metadatos de respaldo de la sesión ACP secundaria.
- Tareas de subagente: la sesión secundaria de respaldo desapareció del almacén del agente de destino.
- Tareas Cron: el runtime de Cron ya no rastrea el trabajo como activo y el historial durable de
  ejecuciones Cron no muestra un resultado terminal para esa ejecución. La auditoría de la CLI
  sin conexión no trata su propio estado vacío de runtime Cron en proceso como autoridad.
- Tareas de la CLI: las tareas con un id. de ejecución/id. de origen usan el contexto de ejecución en vivo, por lo que
  las filas persistentes de sesión secundaria o sesión de chat no las mantienen vivas después de que
  desaparece la ejecución propiedad del Gateway. Las tareas heredadas de la CLI sin identidad de ejecución aún recurren
  a la sesión secundaria. Las ejecuciones `openclaw agent` respaldadas por Gateway también finalizan
  a partir de su resultado de ejecución, por lo que las ejecuciones completadas no permanecen activas hasta que el barrido
  las marca como `lost`.

## Entrega y notificaciones

Cuando una tarea alcanza un estado terminal, OpenClaw te notifica. Hay dos rutas de entrega:

**Entrega directa**: si la tarea tiene un destino de canal (el `requesterOrigin`), el mensaje de finalización va directamente a ese canal (Telegram, Discord, Slack, etc.). En cambio, las finalizaciones de tareas de grupo y canal se enrutan a través de la sesión solicitante para que el agente principal pueda escribir la respuesta visible. Para las finalizaciones de subagentes, OpenClaw también conserva el enrutamiento de hilo/tema vinculado cuando está disponible y puede completar un `to` / cuenta faltante desde la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de renunciar a la entrega directa.

**Entrega en cola de sesión**: si la entrega directa falla o no se estableció ningún origen, la actualización se pone en cola como evento del sistema en la sesión del solicitante y aparece en el siguiente Heartbeat.

<Tip>
La finalización de tareas activa un despertar inmediato de Heartbeat para que veas el resultado rápidamente: no tienes que esperar al siguiente tick programado de Heartbeat.
</Tip>

Eso significa que el flujo de trabajo habitual se basa en push: inicia el trabajo separado una vez y luego deja que el runtime te despierte o notifique al finalizar. Sondea el estado de la tarea solo cuando necesites depuración, intervención o una auditoría explícita.

### Políticas de notificación

Controla cuánto escuchas sobre cada tarea:

| Política             | Qué se entrega                                                        |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (predeterminada) | Solo estado terminal (succeeded, failed, etc.): **este es el valor predeterminado** |
| `state_changes`       | Cada transición de estado y actualización de progreso                   |
| `silent`              | Nada en absoluto                                                        |

Cambia la política mientras una tarea se está ejecutando:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referencia de la CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Columnas de salida: id. de tarea, tipo, estado, entrega, id. de ejecución, sesión secundaria, resumen.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    El token de búsqueda acepta un id. de tarea, id. de ejecución o clave de sesión. Muestra el registro completo, incluidos tiempos, estado de entrega, error y resumen terminal.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Para tareas ACP y de subagente, esto termina la sesión secundaria. Para tareas rastreadas por la CLI, la cancelación se registra en el registro de tareas (no hay un identificador de runtime secundario independiente). El estado cambia a `cancelled` y se envía una notificación de entrega cuando corresponde.

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

    | Hallazgo                  | Gravedad   | Activador                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | En cola durante más de 10 minutos                                                                              |
    | `stale_running`           | error      | En ejecución durante más de 30 minutos                                                                             |
    | `lost`                    | warn/error | La propiedad de la tarea respaldada por el runtime desapareció; las tareas perdidas retenidas advierten hasta `cleanupAfter`, luego se convierten en errores |
    | `delivery_failed`         | warn       | La entrega falló y la política de notificación no es `silent`                                                            |
    | `missing_cleanup`         | warn       | Tarea terminal sin marca de tiempo de limpieza                                                                      |
    | `inconsistent_timestamps` | warn       | Infracción de la línea de tiempo (por ejemplo, finalizó antes de empezar)                                                        |

  </Accordion>
  <Accordion title="mantenimiento de tareas">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Usa esto para previsualizar o aplicar la reconciliación, el marcado de limpieza y la depuración de tareas, estado de Task Flow y filas obsoletas del registro de sesiones de ejecuciones cron.

    La reconciliación tiene en cuenta el runtime:

    - Las tareas ACP/subagent comprueban su sesión secundaria de respaldo.
    - Las tareas subagent cuya sesión secundaria tiene una lápida de recuperación tras reinicio se marcan como perdidas en lugar de tratarse como sesiones de respaldo recuperables.
    - Las tareas Cron comprueban si el runtime de cron todavía posee el trabajo y luego recuperan el estado terminal desde los registros persistidos de ejecuciones cron/estado del trabajo antes de recurrir a `lost`. Solo el proceso Gateway es autoritativo para el conjunto en memoria de trabajos cron activos; la auditoría offline de la CLI usa historial durable pero no marca una tarea cron como perdida solo porque ese Set local esté vacío.
    - Las tareas CLI con identidad de ejecución comprueban el contexto de ejecución activo propietario, no solo las filas de sesión secundaria o sesión de chat.

    La limpieza de finalización también tiene en cuenta el runtime:

    - La finalización de subagent cierra en modo de mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión secundaria antes de que continúe la limpieza del anuncio.
    - La finalización de cron aislado cierra en modo de mejor esfuerzo las pestañas/procesos de navegador rastreados para la sesión cron antes de que la ejecución se desmonte por completo.
    - La entrega de cron aislado espera el seguimiento de subagents descendientes cuando es necesario y suprime el texto obsoleto de acuse de recibo del padre en lugar de anunciarlo.
    - La entrega de finalización de subagent prefiere el texto visible más reciente del asistente; si está vacío, recurre al texto saneado más reciente de tool/toolResult, y las ejecuciones de llamadas a herramientas que solo agotan el tiempo pueden contraerse en un breve resumen de progreso parcial. Las ejecuciones terminales fallidas anuncian el estado de fallo sin reproducir el texto de respuesta capturado.
    - Los fallos de limpieza no ocultan el resultado real de la tarea.

    Al aplicar mantenimiento, OpenClaw también elimina filas obsoletas del registro de sesiones `cron:<jobId>:run:<uuid>` con más de 7 días de antigüedad, preservando las filas de trabajos cron actualmente en ejecución y dejando intactas las filas de sesiones no cron.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Usa estos comandos cuando el Task Flow orquestador sea lo que te interesa, en lugar de un registro individual de tarea en segundo plano.

  </Accordion>
</AccordionGroup>

## Tablero de tareas del chat (`/tasks`)

Usa `/tasks` en cualquier sesión de chat para ver las tareas en segundo plano vinculadas a esa sesión. El tablero muestra tareas activas y completadas recientemente con runtime, estado, tiempos y detalles de progreso o error.

Cuando la sesión actual no tiene tareas vinculadas visibles, `/tasks` recurre a los recuentos de tareas locales del agente para que sigas obteniendo una vista general sin filtrar detalles de otras sesiones.

Para el libro mayor completo del operador, usa la CLI: `openclaw tasks list`.

## Integración de estado (presión de tareas)

`openclaw status` incluye un resumen de tareas de un vistazo:

```
Tasks: 3 queued · 2 running · 1 issues
```

El resumen informa:

- **active** - recuento de `queued` + `running`
- **failures** - recuento de `failed` + `timed_out` + `lost`
- **byRuntime** - desglose por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` como la herramienta `session_status` usan una instantánea de tareas consciente de la limpieza: se prefieren las tareas activas, se ocultan las filas completadas obsoletas y los fallos recientes solo aparecen cuando no queda trabajo activo. Esto mantiene la tarjeta de estado centrada en lo que importa ahora mismo.

## Almacenamiento y mantenimiento

### Dónde viven las tareas

Los registros de tareas persisten en SQLite en:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

El registro se carga en memoria al iniciar el gateway y sincroniza escrituras con SQLite para garantizar durabilidad entre reinicios.
El Gateway mantiene acotado el registro de escritura anticipada de SQLite usando el umbral predeterminado de autocheckpoint de SQLite más puntos de control `TRUNCATE` periódicos y al apagarse.

### Mantenimiento automático

Un barredor se ejecuta cada **60 segundos** y se encarga de cuatro cosas:

<Steps>
  <Step title="Reconciliación">
    Comprueba si las tareas activas todavía tienen respaldo autoritativo del runtime. Las tareas ACP/subagent usan el estado de sesión secundaria, las tareas cron usan la propiedad de trabajo activo y las tareas CLI con identidad de ejecución usan el contexto de ejecución propietario. Si ese estado de respaldo desaparece durante más de 5 minutos, la tarea se marca como `lost`.
  </Step>
  <Step title="Reparación de sesión ACP">
    Cierra sesiones ACP one-shot terminales u huérfanas propiedad del padre, y cierra sesiones ACP persistentes terminales obsoletas u huérfanas solo cuando no queda ningún enlace de conversación activo.
  </Step>
  <Step title="Marcado de limpieza">
    Establece una marca de tiempo `cleanupAfter` en tareas terminales (endedAt + 7 días). Durante la retención, las tareas perdidas todavía aparecen en la auditoría como advertencias; después de que expire `cleanupAfter` o cuando falten metadatos de limpieza, son errores.
  </Step>
  <Step title="Depuración">
    Elimina registros posteriores a su fecha `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retención:** los registros de tareas terminales se conservan durante **7 días** y luego se depuran automáticamente. No se necesita configuración.
</Note>

## Cómo se relacionan las tareas con otros sistemas

<AccordionGroup>
  <Accordion title="Tareas y Task Flow">
    [Task Flow](/es/automation/taskflow) es la capa de orquestación de flujos por encima de las tareas en segundo plano. Un solo flujo puede coordinar varias tareas a lo largo de su vida útil mediante modos de sincronización gestionados o reflejados. Usa `openclaw tasks` para inspeccionar registros individuales de tareas y `openclaw tasks flow` para inspeccionar el flujo orquestador.

    Consulta [Task Flow](/es/automation/taskflow) para más detalles.

  </Accordion>
  <Accordion title="Tareas y cron">
    Una **definición** de trabajo cron vive en `~/.openclaw/cron/jobs.json`; el estado de ejecución del runtime vive junto a ella en `~/.openclaw/cron/jobs-state.json`. **Cada** ejecución cron crea un registro de tarea, tanto de sesión principal como aislada. Las tareas cron de sesión principal usan de forma predeterminada la política de notificación `silent` para que rastreen sin generar notificaciones.

    Consulta [Trabajos Cron](/es/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tareas y heartbeat">
    Las ejecuciones de Heartbeat son turnos de sesión principal: no crean registros de tareas. Cuando una tarea se completa, puede activar un despertar de heartbeat para que veas el resultado rápidamente.

    Consulta [Heartbeat](/es/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tareas y sesiones">
    Una tarea puede hacer referencia a un `childSessionKey` (donde se ejecuta el trabajo) y a un `requesterSessionKey` (quien la inició). Las sesiones son contexto de conversación; las tareas son seguimiento de actividad por encima de eso.
  </Accordion>
  <Accordion title="Tareas y ejecuciones de agente">
    El `runId` de una tarea enlaza con la ejecución del agente que realiza el trabajo. Los eventos del ciclo de vida del agente (inicio, fin, error) actualizan automáticamente el estado de la tarea; no necesitas gestionar el ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) - todos los mecanismos de automatización de un vistazo
- [CLI: tareas](/es/cli/tasks) - referencia de comandos de la CLI
- [Heartbeat](/es/gateway/heartbeat) - turnos periódicos de sesión principal
- [Tareas programadas](/es/automation/cron-jobs) - programación de trabajo en segundo plano
- [Task Flow](/es/automation/taskflow) - orquestación de flujos por encima de tareas
