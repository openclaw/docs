---
read_when:
    - Quieres un tablero de trabajo de estilo Kanban en la interfaz de control
    - Estás habilitando o deshabilitando el plugin Workboard incluido
    - Desea hacer un seguimiento del trabajo planificado del agente sin un gestor de proyectos externo
summary: Tablero de trabajo opcional para tarjetas gestionadas por agentes y transferencia de sesiones
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-12T14:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

El Plugin Workboard añade un tablero opcional de estilo Kanban a la
[interfaz de control](/es/web/control-ui): tarjetas de trabajo adaptadas a agentes, asignación a agentes
y un enlace a la tarea, la ejecución y la sesión del panel asociadas a la tarjeta.

Workboard es deliberadamente pequeño: realiza el seguimiento del trabajo operativo local de un
Gateway de OpenClaw. No sustituye a GitHub Issues, Linear, Jira ni a
otros sistemas de gestión de proyectos de equipos.

## Habilitarlo

Workboard viene incluido, pero está deshabilitado de forma predeterminada:

1. Abra **Plugins** en la interfaz de control o use `/settings/plugins` en relación con
   la ruta base configurada de la interfaz de control. Por ejemplo, una ruta base de `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Busque **Workboard** y elija **Enable**. Como Workboard está incluido con
   OpenClaw, no necesita la acción **Install**.
3. Si la interfaz indica que es necesario reiniciar, reinicie el Gateway.

La pestaña Workboard aparece en la navegación del panel después de que se carga el entorno de ejecución del plugin.
Mientras está deshabilitado, la pestaña permanece oculta en la navegación. Si se abre
directamente la ruta `/workboard` mientras el plugin está deshabilitado o bloqueado por
`plugins.allow`/`plugins.deny`, se muestra un estado de plugin no disponible en lugar de los datos
de las tarjetas.

El flujo de trabajo equivalente en la CLI es:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuración

Workboard no tiene una configuración específica del plugin. Habilítelo o deshabilítelo con la entrada
estándar del plugin:

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

| Campo       | Valores                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | cadenas de formato libre                                                                                      |
| `agentId`   | agente asignado opcional                                                                                      |
| referencias enlazadas | tarea, ejecución, sesión o URL de origen opcionales                                                 |
| `execution` | metadatos opcionales de una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, ejecución id., estado) |

Las tarjetas también contienen metadatos compactos de intentos, comentarios, enlaces, pruebas,
artefactos, ajustes de automatización, archivos adjuntos, registros del trabajador, estado del protocolo
del trabajador, reclamaciones, diagnósticos, notificaciones, identificador de plantilla, estado de archivado y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo se desplazó una tarjeta por el tablero sin abrir la sesión
enlazada; constituyen contexto operativo local, no un sustituto de las transcripciones
de sesiones ni del historial de incidencias de GitHub.

Las tarjetas se almacenan en el estado propio del Gateway del plugin y se trasladan junto con el resto del
estado de OpenClaw de ese Gateway (consulte [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas no enlazadas pueden iniciar trabajo directamente:

- **Run Codex** / **Run Claude** inicia una ejecución de agente con seguimiento de tareas y un
  motor explícito, envía la instrucción de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
  usan `openai/gpt-5.6-sol`; las de Claude usan `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** crea una sesión enlazada del panel sin
  enviar la instrucción de la tarjeta ni moverla, para realizar trabajo manual que permanece
  asociado al tablero.

Los inicios autónomos usan la ruta de ejecución de agentes con seguimiento de tareas del Gateway (el agente
y el modelo predeterminados, salvo que se elija explícitamente Codex/Claude); después, Workboard enlaza
la tarea resultante, el identificador de ejecución y la clave de sesión con la tarjeta. Cada
ejecución enlazada también registra un resumen del intento (motor, modo, modelo, identificador de ejecución,
marcas de tiempo, estado y recuento acumulado de errores) para mantener visibles los errores repetidos.

El panel actualiza el estado de las tareas desde el registro de tareas del Gateway y
asocia las tareas con las tarjetas mediante el identificador de tarea, el identificador de ejecución o la clave de sesión enlazada. Una tarea en cola o en ejecución
mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, con errores, que agotó el tiempo de espera o
cancelada desplaza la tarjeta hacia `review` o `blocked` mediante la misma regla de sincronización
que las sesiones enlazadas (consulte [Sincronización del ciclo de vida de las sesiones](#session-lifecycle-sync)).

## Herramientas de agentes

| Herramienta                                                                                                                                      | Propósito                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Enumera tarjetas compactas con el estado de reclamación/diagnóstico; filtro opcional por tablero.                                                                                                   |
| `workboard_read`                                                                                                                                 | Devuelve una tarjeta junto con contexto acotado del trabajador (notas, intentos, comentarios, enlaces, pruebas, artefactos, resultados principales, trabajo reciente del asignado, diagnósticos activos). |
| `workboard_create`                                                                                                                               | Crea una tarjeta con elementos principales, inquilino, Skills, tablero, metadatos del espacio de trabajo, clave de idempotencia, límite de ejecución y presupuesto de reintentos opcionales.          |
| `workboard_link`                                                                                                                                 | Vincula una tarjeta principal con una secundaria. Las secundarias permanecen en `todo` hasta que todos los elementos principales llegan a `done`; después, la promoción del despacho las mueve a `ready`. |
| `workboard_claim`                                                                                                                                | Reclama una tarjeta para el agente que realiza la llamada; mueve `backlog`/`todo`/`ready` a `running`.                                                                                               |
| `workboard_heartbeat`                                                                                                                            | Actualiza el Heartbeat de la reclamación durante una ejecución prolongada.                                                                                                                           |
| `workboard_release`                                                                                                                              | Libera la reclamación tras completarla, pausarla o transferirla; puede mover la tarjeta a un estado posterior.                                                                                       |
| `workboard_complete` / `workboard_block`                                                                                                         | Herramientas estructuradas del ciclo de vida para resúmenes finales, pruebas, artefactos y manifiestos de tarjetas creadas (deben hacer referencia a tarjetas vinculadas con la tarjeta completada) o motivos de bloqueo. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Almacena pequeños archivos adjuntos de tarjetas en el estado SQLite del Plugin, los indexa en la tarjeta y los expone en el contexto del trabajador.                                                |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra líneas del registro del trabajador y bloquea una tarjeta cuando un trabajador automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                                 |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestiona los metadatos persistentes del tablero (nombre para mostrar, descripción, estado de archivado, espacio de trabajo predeterminado).                                                          |
| `workboard_runs`                                                                                                                                 | Devuelve el historial persistente de intentos de ejecución de una tarjeta.                                                                                                                           |
| `workboard_specify`                                                                                                                              | Convierte una tarjeta preliminar de clasificación/trabajo pendiente en una tarjeta `todo` aclarada; registra el resumen de la especificación en la tarjeta.                                         |
| `workboard_decompose`                                                                                                                            | Divide una tarjeta principal de orquestación en tarjetas secundarias vinculadas, que heredan los metadatos de tablero/inquilino; puede completar la principal con un manifiesto de tarjetas creadas. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestiona las suscripciones a notificaciones. Las lecturas de eventos permiten repeticiones seguras; `advance` mueve el cursor duradero para que los llamadores reanuden sin perder ni leer dos veces eventos de tarjetas completadas, fallidas u obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecciona los espacios de nombres de los tableros y las estadísticas de las colas.                                                                                                                |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera o transfiere trabajo atascado.                                                                                                                                                              |
| `workboard_comment` / `workboard_proof`                                                                                                          | Añade notas de transferencia o adjunta referencias de pruebas/artefactos.                                                                                                                           |
| `workboard_unblock`                                                                                                                              | Devuelve el trabajo bloqueado a `todo`.                                                                                                                                                              |
| `workboard_dispatch`                                                                                                                             | Activa la promoción de dependencias o la limpieza de reclamaciones obsoletas.                                                                                                                       |

Las tarjetas reclamadas rechazan las modificaciones mediante herramientas de agente realizadas por otros agentes, salvo que el llamador
posea el token de reclamación devuelto por `workboard_claim`. Todas las tarjetas devueltas por una
herramienta de agente o una llamada RPC del Gateway ocultan `metadata.claim.token` como `[redacted]`
(el propio token se devuelve una sola vez, en el nivel superior y únicamente desde `workboard_claim`),
por lo que los operadores del panel y otros agentes pueden inspeccionar el estado de la reclamación sin
ver nunca un token utilizable. La recuperación se realiza mediante
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no
requieren el token.

## Despacho

El despacho es local al Gateway: no genera procesos arbitrarios del sistema operativo. Las sesiones
normales de subagentes de OpenClaw siguen siendo responsables de la ejecución. Una pasada de despacho:

1. Promueve las tarjetas cuyas dependencias están listas.
2. Registra los metadatos de despacho en las tarjetas listas.
3. Bloquea las reclamaciones vencidas o las ejecuciones que han agotado el tiempo.
4. Marca las tarjetas de clasificación configuradas en el tablero como candidatas para la orquestación.
5. Reclama un pequeño lote de tarjetas listas e inicia ejecuciones de trabajadores mediante el
   entorno de ejecución de subagentes del Gateway.

Los trabajadores reciben un contexto acotado de la tarjeta, además del token de reclamación necesario para enviar Heartbeats,
completar o bloquear la tarjeta mediante las herramientas de Workboard.

### Selección de trabajadores

Cada pasada inicia **como máximo 3 trabajadores de forma predeterminada**. Las tarjetas listas se ordenan por
prioridad, luego por posición y después por hora de creación. Una pasada inicia solo una tarjeta por
propietario/agente y omite a los propietarios que ya tienen trabajo en ejecución o revisión en el
tablero. Las tarjetas archivadas, las tarjetas con una reclamación activa y las tarjetas que no tienen el estado `ready`
nunca se seleccionan para iniciar trabajadores (aun así, pueden verse afectadas por la
parte de datos del despacho: limpieza de reclamaciones obsoletas, promoción de dependencias y limpieza
por tiempo de espera agotado).

Las claves de sesión son deterministas para cada tablero/tarjeta, por lo que los despachos repetidos vuelven
a la misma vía de trabajador en lugar de crear sesiones no relacionadas:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve
  el agente predeterminado configurado)

Si no se puede iniciar un trabajador después de reclamar una tarjeta, Workboard bloquea la
tarjeta, borra la reclamación, registra el fallo de inicio de la ejecución y añade una línea al registro del
trabajador, visible en el panel, el JSON de la CLI, las herramientas de agente y los
diagnósticos de la tarjeta.

### Puntos de entrada

- Acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal que admita comandos

Los tres utilizan el entorno de ejecución de subagentes del Gateway cuando este está disponible. La
CLI dispone de una alternativa para operadores: si la llamada al Gateway falla con un error de
conexión/no disponibilidad (o un error `unknown method` en Gateways
anteriores), y no se aplica ningún destino explícito `--url`/`--token` ni ningún Gateway remoto
configurado (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta
un despacho solo de datos sobre el estado SQLite local: puede promover dependencias,
limpiar reclamaciones obsoletas y bloquear ejecuciones que hayan agotado el tiempo, pero no puede iniciar trabajadores. Los fallos de autenticación,
permisos y validación de un Gateway accesible no se consideran
falta de disponibilidad; se muestran como errores del comando, al igual que cualquier fallo del Gateway
cuando se ha proporcionado un destino explícito `--url`/`--token`.

Los metadatos del tablero pueden establecer `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y
la expone en el contexto del trabajador; la especificación/descomposición real sigue ejecutándose
mediante las herramientas normales de Workboard.

## CLI y comando de barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Corregir el ciclo de vida de tarjetas obsoletas" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta de forma predeterminada las tarjetas archivadas (`--include-archived`
lo anula); `--json` siempre incluye las tarjetas archivadas, de acuerdo con el contrato de tarjeta completa
utilizado por los scripts existentes. `show` acepta un prefijo de identificador inequívoco.
`list`, `create` y `show` siempre leen/escriben directamente el estado local del Plugin.
Solo `dispatch` llama al Gateway en ejecución, con la alternativa descrita anteriormente.

Consulte [CLI de Workboard](/es/cli/workboard) para conocer todos los indicadores, la salida JSON, el comportamiento alternativo del Gateway,
la gestión de prefijos de identificadores, las reglas de selección del despacho y la
solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
y `/workboard dispatch` reflejan la CLI. Listar y mostrar son operaciones de lectura
para cualquier remitente de comandos autorizado. Crear y despachar requieren estado de propietario en
las superficies de chat, o un cliente del Gateway con `operator.write`/`operator.admin`.

## Sincronización del ciclo de vida de la sesión

Las tarjetas pueden vincularse a una sesión existente del panel, o a una creada al
iniciar el trabajo desde la tarjeta. Las tarjetas vinculadas muestran el ciclo de vida de la sesión en línea:
en ejecución, obsoleta, vinculada e inactiva, finalizada, fallida o ausente. También se puede capturar una
sesión existente desde la pestaña Sessions con **Add to Workboard**; la tarjeta
se vincula a esa sesión, utiliza como título la etiqueta de la sesión o la solicitud reciente del usuario
y rellena las notas con la solicitud reciente del usuario más la respuesta más reciente del asistente,
cuando estén disponibles.

Si la sesión vinculada desaparece, la tarjeta permanece vinculada para conservar el contexto y
sigue ofreciendo controles de inicio para reiniciar en una sesión nueva. Si una sesión vinculada
activa deja de informar actividad reciente, Workboard marca la tarjeta como
`stale` y lo almacena como metadatos hasta que el ciclo de vida lo borra.

Mientras una tarjeta se encuentra en un estado de trabajo activo, Workboard sigue la sesión vinculada:

| Estado de la sesión vinculada              | Estado de la tarjeta |
| ------------------------------------------ | -------------------- |
| activa                                     | `running`            |
| completada                                 | `review`             |
| fallida, terminada, agotada o interrumpida | `blocked`            |

**Los estados de revisión manual tienen prioridad.** Mover una tarjeta a `review`, `blocked` o `done`
detiene la sincronización automática de esa tarjeta hasta que se vuelva a mover a `todo` o `running`.

Al iniciar una tarjeta se utilizan sesiones normales del Gateway; Workboard solo almacena los
metadatos y vínculos de la tarjeta. La transcripción de la conversación, la selección del modelo y el
ciclo de vida de la ejecución siguen siendo responsabilidad del sistema de sesiones habitual. Use **Stop** en una tarjeta
vinculada activa para interrumpir la ejecución en curso; Workboard marca esa tarjeta como `blocked` para que
permanezca visible y pueda hacerse un seguimiento.

Las tarjetas nuevas pueden iniciarse a partir de plantillas de Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Las plantillas rellenan previamente el título, las notas, las etiquetas y la prioridad;
el id de la plantilla se almacena como metadatos de la tarjeta.

## Flujo de trabajo del panel

1. Abra la pestaña Workboard en la interfaz de control.
2. Cree una tarjeta con un título, notas, prioridad, etiquetas, un agente opcional y
   una sesión vinculada opcional, o abra Sessions y elija **Add to Workboard**
   para una sesión existente.
3. Arrastre la tarjeta entre columnas, o enfoque su control compacto de estado y utilice
   el menú o ArrowLeft/ArrowRight.
4. Inicie el trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abra la sesión vinculada desde la tarjeta mientras el agente trabaja.
6. Permita que la sincronización del ciclo de vida mueva el trabajo en ejecución a `review`/`blocked` y, después, mueva
   manualmente la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de las tarjetas. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `stranded_ready`            | Tarjeta asignada con estado `todo`/`backlog`/`ready` sin actualizar durante más de 1 hora.       |
| `running_without_heartbeat` | Tarjeta `running` sin Heartbeat de reclamación ni actualización de ejecución durante más de 20 minutos. |
| `blocked_too_long`          | Tarjeta `blocked` sin actualizar durante más de 24 horas.                                       |
| `repeated_failures`         | El recuento de fallos registrado de la tarjeta alcanza 2 o más.                                 |
| `missing_proof`             | Tarjeta `done` sin pruebas, artefactos ni archivos adjuntos.                                    |
| `orphaned_session`          | Tarjeta `running` con una `sessionKey`, pero sin metadatos de `execution`.                       |

## Permisos

Los métodos RPC del Gateway se encuentran bajo `workboard.*`:

| Ámbito           | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listado/obtención de archivos adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                          |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/vincular/vincular dependencia/prueba/artefacto, añadir/eliminar archivos adjuntos, registro del trabajador, infracción del protocolo, reclamar/Heartbeat/liberar/promover/reasignar/recuperar/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificaciones |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de operador
de solo lectura pueden consultar el tablero, pero no modificar las tarjetas.

## Almacenamiento

Workboard almacena los datos persistentes en una base de datos SQLite relacional propiedad del Plugin
dentro del directorio de estado de OpenClaw: los tableros, las tarjetas, las etiquetas, los eventos del ciclo de vida,
los intentos de ejecución, los comentarios, los vínculos de dependencia, las pruebas, las referencias a artefactos,
los metadatos y blobs de los archivos adjuntos, los diagnósticos, las notificaciones, los registros de trabajadores,
el estado del protocolo y las suscripciones se almacenan en tablas de Workboard (no en
entradas de clave-valor del Plugin). La exportación de una tarjeta conserva la narrativa del tablero
sin insertar el contenido de los blobs de los archivos adjuntos.

Las instalaciones que utilizaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres heredados del estado del Plugin distribuido
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

Compruebe el id del agente y la sesión vinculada de la tarjeta; después, abra Sessions o Chat para
consultar el estado real de la ejecución.

**El despacho no inicia un trabajador**

Confirme que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa de un despacho que solo procesa datos, inicie o reinicie el Gateway y
vuelva a intentarlo: el despacho que solo procesa datos actualiza el estado local del tablero, pero no puede iniciar
ejecuciones de trabajadores de subagentes. También se pueden omitir tarjetas cuando otra tarjeta del
mismo propietario o agente ya esté en ejecución o a la espera de revisión; complete,
bloquee o libere ese trabajo activo antes de despachar más trabajo para el mismo
propietario.

## Contenido relacionado

- [Interfaz de control](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Gestionar Plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
