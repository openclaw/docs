---
read_when:
    - Quieres un tablero de trabajo de estilo Kanban en la interfaz de control
    - Estás habilitando o deshabilitando el Plugin Workboard incluido
    - Quieres hacer un seguimiento del trabajo planificado del agente sin un gestor de proyectos externo
summary: Tablero de trabajo opcional para tarjetas gestionadas por agentes y transferencia de sesiones
title: Plugin de tablero de trabajo
x-i18n:
    generated_at: "2026-07-11T23:25:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

El Plugin Workboard añade un tablero opcional de estilo Kanban a la
[interfaz de control](/es/web/control-ui): tarjetas de trabajo dimensionadas para agentes, asignación a agentes
y un enlace a la tarea, la ejecución y la sesión del panel de la tarjeta.

Workboard es intencionadamente pequeño: realiza el seguimiento del trabajo operativo local de un
Gateway de OpenClaw. No sustituye a GitHub Issues, Linear, Jira ni
a otros sistemas de gestión de proyectos en equipo.

## Habilitarlo

Workboard viene incluido, pero está deshabilitado de forma predeterminada:

1. Abra **Plugins** en la interfaz de control o use `/settings/plugins` en relación con
   la ruta base configurada de la interfaz de control. Por ejemplo, una ruta base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Busque **Workboard** y seleccione **Habilitar**. Como Workboard se incluye con
   OpenClaw, no requiere una acción de **Instalación**.
3. Si la interfaz indica que es necesario reiniciar, reinicie el Gateway.

La pestaña Workboard aparece en la navegación del panel después de que se cargue el entorno de ejecución del Plugin.
Mientras está deshabilitada, la pestaña permanece oculta en la navegación. Si se abre directamente la ruta
`/workboard` mientras el Plugin está deshabilitado o bloqueado por
`plugins.allow`/`plugins.deny`, se muestra un estado de Plugin no disponible en lugar de los datos
de las tarjetas.

El flujo de trabajo equivalente mediante la CLI es:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuración

Workboard no tiene configuración específica del Plugin. Habilítelo o deshabilítelo con la entrada
estándar del Plugin:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Campos de las tarjetas

| Campo                | Valores                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `status`             | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`           | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`             | cadenas de formato libre                                                                                      |
| `agentId`            | agente asignado opcional                                                                                      |
| referencias enlazadas | tarea, ejecución, sesión o URL de origen opcionales                                                           |
| `execution`          | metadatos opcionales de una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, id. de ejecución, estado) |

Las tarjetas también contienen metadatos compactos de intentos, comentarios, enlaces, pruebas,
artefactos, ajustes de automatización, archivos adjuntos, registros de los trabajadores, estado del protocolo
de los trabajadores, reclamaciones, diagnósticos, notificaciones, id. de plantilla, estado de archivado y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo se desplazó una tarjeta por el tablero sin abrir la sesión
enlazada; constituyen contexto operativo local, no sustituyen las transcripciones de las
sesiones ni el historial de incidencias de GitHub.

Las tarjetas se almacenan en el estado propio del Gateway del Plugin y se trasladan junto con el resto del
estado de OpenClaw de ese Gateway (consulte [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas no enlazadas pueden iniciar trabajo directamente:

- **Ejecutar Codex** / **Ejecutar Claude** inicia una ejecución de agente con seguimiento de tareas y un
  motor explícito, envía la instrucción de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
  usan `openai/gpt-5.6-sol`; las de Claude usan `anthropic/claude-sonnet-4-6`.
- **Abrir Codex** / **Abrir Claude** crea una sesión enlazada del panel sin
  enviar la instrucción de la tarjeta ni moverla, para trabajo manual que permanece
  asociado al tablero.

Los inicios autónomos usan la ruta de ejecución de agentes con seguimiento de tareas del Gateway (el agente
y el modelo predeterminados, salvo que se elija Codex/Claude explícitamente); después, Workboard enlaza
la tarea resultante, el id. de ejecución y la clave de sesión con la tarjeta. Cada ejecución
enlazada también registra un resumen del intento (motor, modo, modelo, id. de ejecución,
marcas de tiempo, estado y recuento acumulado de errores) para que los errores repetidos sigan siendo visibles.

El panel actualiza el estado de las tareas a partir del registro de tareas del Gateway y
relaciona las tareas con las tarjetas mediante el id. de tarea, el id. de ejecución o la clave de sesión enlazada. Una tarea
en cola o en ejecución mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, fallida, que ha agotado el tiempo
o cancelada desplaza la tarjeta hacia `review` o `blocked` mediante la misma regla de sincronización
que las sesiones enlazadas (consulte [Sincronización del ciclo de vida de las sesiones](#session-lifecycle-sync)).

## Herramientas de agentes

| Herramienta                                                                                                                                       | Propósito                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `workboard_list`                                                                                                                                  | Enumera tarjetas compactas con el estado de reclamación/diagnóstico; filtro opcional por tablero.                                                                                                                                           |
| `workboard_read`                                                                                                                                  | Devuelve una tarjeta junto con un contexto acotado del trabajador (notas, intentos, comentarios, enlaces, pruebas, artefactos, resultados principales, trabajo reciente del asignado y diagnósticos activos).                                 |
| `workboard_create`                                                                                                                                | Crea una tarjeta con elementos principales, inquilino, Skills, tablero, metadatos del espacio de trabajo, clave de idempotencia, límite de ejecución y presupuesto de reintentos opcionales.                                                |
| `workboard_link`                                                                                                                                  | Vincula una tarjeta principal con una secundaria. Las secundarias permanecen en `todo` hasta que todas las principales alcanzan `done`; después, la promoción de despacho las mueve a `ready`.                                             |
| `workboard_claim`                                                                                                                                 | Reclama una tarjeta para el agente que realiza la llamada; mueve `backlog`/`todo`/`ready` a `running`.                                                                                                                                       |
| `workboard_heartbeat`                                                                                                                             | Actualiza el Heartbeat de la reclamación durante una ejecución prolongada.                                                                                                                                                                  |
| `workboard_release`                                                                                                                               | Libera la reclamación tras finalizar, pausar o transferir el trabajo; puede mover la tarjeta al estado siguiente.                                                                                                                           |
| `workboard_complete` / `workboard_block`                                                                                                          | Herramientas estructuradas del ciclo de vida para resúmenes finales, pruebas, artefactos y manifiestos de tarjetas creadas (deben hacer referencia a tarjetas vinculadas con la tarjeta completada), o para indicar motivos de bloqueo.      |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                          | Almacena pequeños archivos adjuntos de la tarjeta en el estado SQLite del Plugin, los indexa en la tarjeta y los expone en el contexto del trabajador.                                                                                      |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                           | Registra líneas del historial del trabajador y bloquea una tarjeta cuando un trabajador automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                                                                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                   | Administra los metadatos persistentes del tablero (nombre para mostrar, descripción, estado de archivado y espacio de trabajo predeterminado).                                                                                              |
| `workboard_runs`                                                                                                                                  | Devuelve el historial persistente de intentos de ejecución de una tarjeta.                                                                                                                                                                  |
| `workboard_specify`                                                                                                                               | Convierte una tarjeta preliminar de triaje o trabajo pendiente en una tarjeta `todo` aclarada; registra el resumen de la especificación en la tarjeta.                                                                                       |
| `workboard_decompose`                                                                                                                             | Divide una tarjeta principal de orquestación en tarjetas secundarias vinculadas que heredan los metadatos del tablero y del inquilino; puede completar la tarjeta principal con un manifiesto de tarjetas creadas.                          |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe`  | Administra las suscripciones a notificaciones. Las lecturas de eventos permiten una reproducción segura; `advance` mueve el cursor duradero para que quienes llaman reanuden sin perder ni leer dos veces eventos de tarjetas completadas, fallidas u obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                            | Inspecciona los espacios de nombres de los tableros y las estadísticas de las colas.                                                                                                                                                        |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                  | Recupera o transfiere trabajo atascado.                                                                                                                                                                                                     |
| `workboard_comment` / `workboard_proof`                                                                                                           | Añade notas de transferencia o adjunta referencias de pruebas o artefactos.                                                                                                                                                                 |
| `workboard_unblock`                                                                                                                               | Devuelve el trabajo bloqueado a `todo`.                                                                                                                                                                                                     |
| `workboard_dispatch`                                                                                                                              | Fuerza la promoción de dependencias o la limpieza de reclamaciones obsoletas.                                                                                                                                                               |

Las tarjetas reclamadas rechazan las modificaciones mediante herramientas de agente procedentes de otros agentes, salvo que quien realiza la llamada posea el token de reclamación devuelto por `workboard_claim`. Cada tarjeta devuelta por una herramienta de agente o una llamada RPC del Gateway oculta `metadata.claim.token` como `[redacted]` (el token se devuelve una sola vez, en el nivel superior y únicamente desde `workboard_claim`), por lo que los operadores del panel y otros agentes pueden inspeccionar el estado de la reclamación sin ver nunca un token utilizable. La recuperación se realiza mediante `workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no requieren el token.

## Despacho

El despacho es local al Gateway: no inicia procesos arbitrarios del sistema operativo. Las sesiones normales de subagentes de OpenClaw siguen siendo responsables de la ejecución. Una pasada de despacho:

1. Promueve las tarjetas cuyas dependencias están listas.
2. Registra los metadatos de despacho en las tarjetas listas.
3. Bloquea las reclamaciones vencidas o las ejecuciones que superaron el tiempo límite.
4. Marca las tarjetas de triaje configuradas en el tablero como candidatas de orquestación.
5. Reclama un pequeño lote de tarjetas listas e inicia ejecuciones de trabajadores mediante el entorno de ejecución de subagentes del Gateway.

Los trabajadores reciben un contexto acotado de la tarjeta, además del token de reclamación necesario para enviar el Heartbeat, completar o bloquear la tarjeta mediante las herramientas de Workboard.

### Selección de trabajadores

Cada pasada inicia **como máximo 3 trabajadores de forma predeterminada**. Las tarjetas listas se ordenan por prioridad, después por posición y, finalmente, por fecha de creación. Una pasada inicia únicamente una tarjeta por propietario/agente y omite a los propietarios que ya tengan trabajo en ejecución o revisión en el tablero. Las tarjetas archivadas, las tarjetas con una reclamación activa y las tarjetas cuyo estado no sea `ready` nunca se seleccionan para iniciar trabajadores (aun así, pueden verse afectadas por la parte de datos del despacho: limpieza de reclamaciones obsoletas, promoción de dependencias y limpieza por tiempo límite).

Las claves de sesión son deterministas para cada tablero/tarjeta, por lo que los despachos repetidos vuelven a dirigir el trabajo al mismo canal del trabajador, en lugar de crear sesiones sin relación:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve el agente predeterminado configurado)

Si no se puede iniciar un trabajador después de reclamar una tarjeta, Workboard bloquea la tarjeta, elimina la reclamación, registra el fallo de inicio de la ejecución y añade una línea al historial del trabajador, visible en el panel, el JSON de la CLI, las herramientas de agente y los diagnósticos de la tarjeta.

### Puntos de entrada

- Acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal que admite comandos

Los tres utilizan el entorno de ejecución de subagentes del Gateway cuando este está disponible. La CLI dispone de una alternativa para operadores: si la llamada al Gateway falla por un error de conexión o indisponibilidad (o por un error `unknown method` en versiones anteriores del Gateway), no se proporcionó un destino explícito mediante `--url`/`--token` y no hay configurado ningún Gateway remoto (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta un despacho solo de datos sobre el estado SQLite local: puede promover dependencias, limpiar reclamaciones obsoletas y bloquear ejecuciones que superaron el tiempo límite, pero no puede iniciar trabajadores. Los fallos de autenticación, permisos y validación de un Gateway accesible no se consideran casos de indisponibilidad; se muestran como errores del comando, al igual que cualquier fallo del Gateway cuando se proporciona un destino explícito mediante `--url`/`--token`.

Los metadatos del tablero pueden definir `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y la expone en el contexto del trabajador; la especificación o descomposición efectiva sigue ejecutándose mediante las herramientas normales de Workboard.

## CLI y comando con barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta de forma predeterminada las tarjetas archivadas (`--include-archived` lo anula); `--json` siempre incluye las tarjetas archivadas, de acuerdo con el contrato de tarjeta completa utilizado por los scripts existentes. `show` acepta un prefijo de identificador no ambiguo. `list`, `create` y `show` siempre leen o escriben directamente el estado local del Plugin. Solo `dispatch` llama al Gateway en ejecución, con la alternativa descrita anteriormente.

Consulta [CLI de Workboard](/es/cli/workboard) para conocer todas las opciones, la salida JSON, el comportamiento alternativo del Gateway, la gestión de prefijos de identificadores, las reglas de selección del despacho y la solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` y `/workboard dispatch` reflejan la CLI. Las operaciones de enumeración y visualización son operaciones de lectura disponibles para cualquier remitente de comandos autorizado. La creación y el despacho requieren el estado de propietario en las superficies de chat, o un cliente del Gateway con `operator.write`/`operator.admin`.

## Sincronización del ciclo de vida de la sesión

Las tarjetas pueden vincularse a una sesión existente del panel o a una que se crea al
iniciar el trabajo desde la tarjeta. Las tarjetas vinculadas muestran en línea el ciclo de vida de la sesión:
en ejecución, obsoleta, vinculada e inactiva, finalizada, fallida o ausente. También puede capturar una
sesión existente desde la pestaña Sessions con **Add to Workboard**; la tarjeta
se vincula a esa sesión, usa como título la etiqueta de la sesión o la solicitud reciente del usuario
e inicializa las notas con la solicitud reciente del usuario y la respuesta más reciente del asistente,
cuando están disponibles.

Si la sesión vinculada deja de estar disponible, la tarjeta permanece vinculada para conservar el contexto y
sigue ofreciendo controles de inicio para reiniciar el trabajo en una sesión nueva. Si una sesión vinculada
activa deja de informar actividad reciente, Workboard marca la tarjeta como
`stale` y almacena ese estado como metadatos hasta que el ciclo de vida lo borra.

Mientras una tarjeta se encuentra en un estado de trabajo activo, Workboard sigue la sesión vinculada:

| Estado de la sesión vinculada                  | Estado de la tarjeta |
| ---------------------------------------------- | -------------------- |
| activa                                         | `running`            |
| completada                                     | `review`             |
| fallida, terminada, agotó el tiempo o cancelada | `blocked`            |

**Los estados de revisión manual tienen prioridad.** Mover una tarjeta a `review`, `blocked` o `done`
detiene la sincronización automática de esa tarjeta hasta que vuelva a moverla a `todo` o `running`.

Al iniciar una tarjeta se usan sesiones normales del Gateway; Workboard solo almacena los
metadatos y vínculos de la tarjeta. La transcripción de la conversación, la selección del modelo y el
ciclo de vida de la ejecución siguen siendo responsabilidad del sistema de sesiones habitual. Use **Stop** en una tarjeta
vinculada activa para cancelar la ejecución activa; Workboard marca esa tarjeta como `blocked` para que
permanezca visible y pueda darle seguimiento.

Las tarjetas nuevas pueden iniciarse a partir de plantillas de Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Las plantillas rellenan previamente el título, las notas, las etiquetas y la prioridad;
el identificador de la plantilla se almacena como metadatos de la tarjeta.

## Flujo de trabajo del panel

1. Abra la pestaña Workboard en la interfaz de control.
2. Cree una tarjeta con un título, notas, prioridad, etiquetas, un agente opcional y
   una sesión vinculada opcional, o abra Sessions y elija **Add to Workboard**
   para una sesión existente.
3. Arrastre la tarjeta entre columnas o enfoque su control compacto de estado y use
   el menú o ArrowLeft/ArrowRight.
4. Inicie el trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abra la sesión vinculada desde la tarjeta mientras el agente trabaja.
6. Deje que la sincronización del ciclo de vida mueva el trabajo en ejecución a `review`/`blocked` y, después,
   mueva manualmente la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de las tarjetas. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `stranded_ready`            | Tarjeta asignada en `todo`/`backlog`/`ready` sin actualizar desde hace más de 1 hora.            |
| `running_without_heartbeat` | Tarjeta en `running` sin Heartbeat de asignación ni actualización de ejecución en más de 20 minutos. |
| `blocked_too_long`          | Tarjeta en `blocked` sin actualizar desde hace más de 24 horas.                                  |
| `repeated_failures`         | El recuento de fallos registrados de la tarjeta alcanza 2 o más.                                |
| `missing_proof`             | Tarjeta en `done` sin pruebas, artefactos ni archivos adjuntos.                                  |
| `orphaned_session`          | Tarjeta en `running` con una `sessionKey`, pero sin metadatos de `execution`.                     |

## Permisos

Los métodos RPC del Gateway se encuentran bajo `workboard.*`:

| Ámbito           | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obtener archivos adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/vincular/vincular dependencia/prueba/artefacto, añadir/eliminar archivos adjuntos, registro del trabajador, infracción del protocolo, reclamar/Heartbeat/liberar/promover/reasignar/recuperar/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificaciones |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de operador
de solo lectura pueden inspeccionar el tablero, pero no modificar las tarjetas.

## Almacenamiento

Workboard almacena los datos persistentes en una base de datos SQLite relacional propiedad del Plugin,
dentro del directorio de estado de OpenClaw: los tableros, las tarjetas, las etiquetas, los eventos del ciclo de vida,
los intentos de ejecución, los comentarios, los vínculos de dependencias, las pruebas, las referencias a artefactos,
los metadatos y contenidos binarios de los archivos adjuntos, los diagnósticos, las notificaciones, los registros de trabajadores,
el estado del protocolo y las suscripciones residen en tablas de Workboard (no en
entradas de clave-valor del Plugin). Una exportación de tarjetas conserva la narrativa del tablero
sin incluir en línea el contenido binario de los archivos adjuntos.

Las instalaciones que usaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres heredados del estado del Plugin incluidos en esa versión
(`workboard.cards`, `workboard.boards`, `workboard.notify` y, si está presente,
`workboard.attachments`) a la base de datos relacional.

## Solución de problemas

**La pestaña indica que Workboard no está disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, añada `workboard`. Si `plugins.deny`
contiene `workboard`, elimínelo antes de habilitar el Plugin.

**Las tarjetas no se guardan**

Confirme que la conexión del navegador tenga acceso `operator.write`. Las sesiones de operador
de solo lectura pueden enumerar tarjetas, pero no crearlas, editarlas, moverlas ni eliminarlas.

**Al iniciar una tarjeta no se abre la sesión esperada**

Compruebe el identificador del agente y la sesión vinculada de la tarjeta; después, abra Sessions o Chat para
inspeccionar el estado real de la ejecución.

**El envío no inicia un trabajador**

Confirme que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa de un envío limitado a datos, inicie o reinicie el Gateway y
vuelva a intentarlo; el envío limitado a datos actualiza el estado local del tablero, pero no puede iniciar
ejecuciones de trabajadores de subagentes. Las tarjetas también pueden omitirse cuando otra tarjeta del
mismo responsable o agente ya está en ejecución o esperando revisión; complete,
bloquee o libere ese trabajo activo antes de enviar más trabajo para el mismo
responsable.

## Contenido relacionado

- [Interfaz de control](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Administrar Plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
