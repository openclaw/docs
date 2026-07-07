---
read_when:
    - Quieres un tablero de trabajo de estilo Kanban en la interfaz de Control
    - Está activando o desactivando el Plugin Workboard incluido
    - Quieres hacer seguimiento del trabajo planificado del agente sin un gestor de proyectos externo
summary: Tablero de trabajo opcional del panel para tarjetas propiedad del agente y traspaso de sesión
title: Plugin de tablero de trabajo
x-i18n:
    generated_at: "2026-07-06T21:51:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e76d9f64d6117b1a9486270e385d79334a11b2658853473beaf9fb23f8327b00
    source_path: plugins/workboard.md
    workflow: 16
---

El plugin Workboard añade un tablero opcional de estilo Kanban a la
[UI de Control](/es/web/control-ui): tarjetas de trabajo dimensionadas para agentes, asignación a agentes
y un enlace de vuelta a la tarea, ejecución y sesión del panel de la tarjeta.

Workboard es intencionadamente pequeño: rastrea el trabajo operativo local para un
OpenClaw Gateway. No sustituye a GitHub Issues, Linear, Jira ni a
otros sistemas de gestión de proyectos de equipo.

## Habilitarlo

Workboard está incluido, pero deshabilitado de forma predeterminada:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

La pestaña Workboard aparece en la navegación del panel una vez que el plugin está habilitado;
mientras está deshabilitado, la pestaña permanece oculta en la navegación. Abrir la
ruta `/workboard` directamente mientras el plugin está deshabilitado o bloqueado por
`plugins.allow`/`plugins.deny` muestra un estado de plugin no disponible en lugar de
datos de tarjetas.

## Configuración

Workboard no tiene configuración específica del plugin. Habilítalo/deshabilítalo con la entrada
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

## Campos de tarjeta

| Campo            | Valores                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `status`         | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`       | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`         | cadenas de formato libre                                                                                      |
| `agentId`        | agente asignado opcional                                                                                      |
| refs enlazadas   | tarea, ejecución, sesión o URL de origen opcional                                                             |
| `execution`      | metadatos opcionales para una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, id de ejecución, estado) |

Las tarjetas también llevan metadatos compactos para intentos, comentarios, enlaces, prueba,
artefactos, ajustes de automatización, adjuntos, registros de worker, estado del protocolo
del worker, reclamaciones, diagnósticos, notificaciones, id de plantilla, estado de archivo y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo se movió una tarjeta por el tablero sin abrir la sesión enlazada;
son contexto operativo local, no un sustituto de las transcripciones de sesión
ni del historial de incidencias de GitHub.

Las tarjetas se almacenan en el propio estado de Gateway del plugin y se mueven con el resto del
estado de OpenClaw de ese Gateway (consulta [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas no enlazadas pueden iniciar trabajo directamente:

- **Ejecutar Codex** / **Ejecutar Claude** inicia una ejecución de agente rastreada por tarea con un
  motor explícito, envía el prompt de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
  usan `openai/gpt-5.5`; las ejecuciones de Claude usan `anthropic/claude-sonnet-4-6`.
- **Abrir Codex** / **Abrir Claude** crea una sesión de panel enlazada sin
  enviar el prompt de la tarjeta ni mover la tarjeta, para trabajo manual que permanece
  adjunto al tablero.

Los inicios autónomos usan la ruta de ejecución de agente rastreada por tarea del Gateway (agente
y modelo predeterminados salvo que Codex/Claude se elija explícitamente); Workboard luego enlaza la
tarea resultante, el id de ejecución y la clave de sesión de vuelta a la tarjeta. Cada ejecución
enlazada también registra un resumen de intento (motor, modo, modelo, id de ejecución,
marcas de tiempo, estado, recuento acumulado de fallos) para que los fallos repetidos sigan visibles.

El panel actualiza el estado de tareas desde el registro de tareas del Gateway, haciendo coincidir
tareas con tarjetas por id de tarea, id de ejecución o clave de sesión enlazada. Una tarea en cola/en ejecución
mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, fallida, agotada por tiempo o
cancelada mueve la tarjeta hacia `review` o `blocked` usando la misma regla de sincronización
que las sesiones enlazadas (consulta [Sincronización del ciclo de vida de sesión](#session-lifecycle-sync)).

## Herramientas de agente

| Herramienta                                                                                                                                      | Propósito                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Lista tarjetas compactas con estado de reclamación/diagnóstico; filtro de tablero opcional.                                                                                              |
| `workboard_read`                                                                                                                                 | Devuelve una tarjeta más contexto acotado del worker (notas, intentos, comentarios, enlaces, prueba, artefactos, resultados padre, trabajo reciente del asignado, diagnósticos activos). |
| `workboard_create`                                                                                                                               | Crea una tarjeta con padres opcionales, inquilino, Skills, tablero, metadatos de espacio de trabajo, clave de idempotencia, límite de tiempo de ejecución, presupuesto de reintentos.    |
| `workboard_link`                                                                                                                                 | Enlaza una tarjeta padre con una hija. Las hijas permanecen en `todo` hasta que cada padre llega a `done`; luego la promoción por despacho las mueve a `ready`.                          |
| `workboard_claim`                                                                                                                                | Reclama una tarjeta para el agente llamante; mueve `backlog`/`todo`/`ready` a `running`.                                                                                                 |
| `workboard_heartbeat`                                                                                                                            | Actualiza el Heartbeat de reclamación durante una ejecución más larga.                                                                                                                   |
| `workboard_release`                                                                                                                              | Libera la reclamación tras completar, pausar o traspasar; puede mover la tarjeta a un estado siguiente.                                                                                  |
| `workboard_complete` / `workboard_block`                                                                                                         | Herramientas de ciclo de vida estructuradas para resúmenes finales, prueba, artefactos y manifiestos de tarjetas creadas (deben referenciar tarjetas enlazadas de vuelta a la tarjeta completada) o motivos de bloqueo. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Almacena pequeños adjuntos de tarjeta en el estado SQLite del plugin, los indexa en la tarjeta y los expone en el contexto del worker.                                                   |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra líneas de log del worker y bloquea una tarjeta cuando un worker automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                                    |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestiona metadatos persistidos de tablero (nombre visible, descripción, estado de archivo, espacio de trabajo predeterminado).                                                           |
| `workboard_runs`                                                                                                                                 | Devuelve el historial persistido de intentos de ejecución de una tarjeta.                                                                                                                |
| `workboard_specify`                                                                                                                              | Convierte una tarjeta aproximada de triaje/backlog en una tarjeta `todo` clarificada; registra el resumen de especificación en la tarjeta.                                               |
| `workboard_decompose`                                                                                                                            | Despliega una tarjeta de orquestación padre en hijas enlazadas, heredando metadatos de tablero/inquilino; puede completar el padre con un manifiesto de tarjetas creadas.                |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestiona suscripciones de notificación. Las lecturas de eventos son seguras para repetición; `advance` mueve el cursor duradero para que los llamantes reanuden sin perder ni leer dos veces eventos de tarjetas completadas/fallidas/obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecciona namespaces de tablero y estadísticas de cola.                                                                                                                                |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera o traspasa trabajo atascado.                                                                                                                                                    |
| `workboard_comment` / `workboard_proof`                                                                                                          | Añade notas de traspaso o adjunta referencias de prueba/artefactos.                                                                                                                      |
| `workboard_unblock`                                                                                                                              | Mueve el trabajo bloqueado de vuelta a `todo`.                                                                                                                                           |
| `workboard_dispatch`                                                                                                                             | Impulsa la promoción de dependencias o la limpieza de reclamaciones obsoletas.                                                                                                           |

Las tarjetas reclamadas rechazan mutaciones de herramientas de agente de otros agentes a menos que el llamador tenga el token de reclamo devuelto por `workboard_claim`. Todas las tarjetas devueltas por una herramienta de agente o una llamada RPC del Gateway redactan `metadata.claim.token` como `[redacted]` (el token en sí se devuelve una sola vez, en el nivel superior, solo desde `workboard_claim`), de modo que los operadores del panel y otros agentes puedan inspeccionar el estado del reclamo sin ver nunca un token utilizable. La recuperación pasa por `workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no requieren el token.

## Despacho

El despacho es local al Gateway: no genera procesos arbitrarios del sistema operativo. Las sesiones normales de subagente de OpenClaw siguen siendo dueñas de la ejecución. Una pasada de despacho:

1. Promueve las tarjetas cuyas dependencias están listas.
2. Registra metadatos de despacho en las tarjetas listas.
3. Bloquea reclamos expirados o ejecuciones agotadas por tiempo.
4. Marca las tarjetas de triaje configuradas por el tablero como candidatas de orquestación.
5. Reclama un lote pequeño de tarjetas listas e inicia ejecuciones de workers mediante el runtime de subagentes del Gateway.

Los workers reciben contexto acotado de la tarjeta más el token de reclamo necesario para enviar Heartbeat, completar o bloquear la tarjeta mediante las herramientas de Workboard.

### Selección de workers

Cada pasada inicia **como máximo 3 workers de forma predeterminada**. Las tarjetas listas se ordenan por prioridad, luego por posición y luego por hora de creación. Una pasada inicia solo una tarjeta por propietario/agente y omite propietarios que ya tienen trabajo en ejecución o en revisión en el tablero. Las tarjetas archivadas, las tarjetas con un reclamo activo y las tarjetas que no están en estado `ready` nunca se seleccionan para iniciar workers (aun así pueden verse afectadas por el lado de datos del despacho: limpieza de reclamos obsoletos, promoción de dependencias, limpieza de tiempos agotados).

Las claves de sesión son deterministas por tablero/tarjeta, por lo que los despachos repetidos vuelven a enrutar a la misma vía de worker en lugar de crear sesiones no relacionadas:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve el agente predeterminado configurado)

Si no se puede iniciar un worker después de reclamar una tarjeta, Workboard bloquea la tarjeta, borra el reclamo, registra el fallo de inicio de ejecución y agrega una línea de registro del worker, visible en el panel, el JSON de la CLI, las herramientas de agente y los diagnósticos de la tarjeta.

### Puntos de entrada

- Acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal compatible con comandos

Los tres usan el runtime de subagentes del Gateway cuando el Gateway está disponible. La CLI tiene un fallback de operador: si la llamada al Gateway falla con un error de conexión/no disponible (o un error `unknown method` para Gateways antiguos), y no aplica ningún destino explícito `--url`/`--token` ni ningún Gateway remoto configurado (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta un despacho solo de datos contra el estado SQLite local: puede promover dependencias, limpiar reclamos obsoletos y bloquear ejecuciones agotadas por tiempo, pero no puede iniciar workers. Los fallos de autenticación, permisos y validación de un Gateway alcanzable no se tratan como no disponibles; aparecen como errores de comando, igual que cualquier fallo del Gateway cuando se proporcionó un destino explícito `--url`/`--token`.

Los metadatos del tablero pueden definir `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y la expone en el contexto del worker; la especificación/descomposición real sigue ejecutándose mediante las herramientas normales de Workboard.

## CLI y comando slash

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta las tarjetas archivadas de forma predeterminada (`--include-archived` lo reemplaza); `--json` siempre incluye tarjetas archivadas, coincidiendo con el contrato de tarjeta completa usado por los scripts existentes. `show` acepta un prefijo de id inequívoco. `list`, `create` y `show` siempre leen/escriben directamente el estado local del Plugin. Solo `dispatch` llama al Gateway en ejecución, con el fallback descrito anteriormente.

Consulta [CLI de Workboard](/es/cli/workboard) para ver todas las flags, la salida JSON, el comportamiento de fallback del Gateway, el manejo de prefijos de id, las reglas de selección de despacho y la solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` y `/workboard dispatch` reflejan la CLI. Listar y mostrar son operaciones de lectura para cualquier remitente de comandos autorizado. Crear y despachar requieren estado de propietario en superficies de chat, o un cliente de Gateway con `operator.write`/`operator.admin`.

## Sincronización del ciclo de vida de sesiones

Las tarjetas pueden enlazarse a una sesión existente del panel, o a una creada cuando inicias trabajo desde la tarjeta. Las tarjetas enlazadas muestran el ciclo de vida de la sesión en línea: en ejecución, obsoleta, enlazada inactiva, terminada, fallida o ausente. También puedes capturar una sesión existente desde la pestaña Sessions con **Agregar a Workboard**; la tarjeta se enlaza a esa sesión, usa la etiqueta de sesión o el prompt reciente del usuario como título, y rellena notas a partir del prompt reciente del usuario más la última respuesta del asistente cuando está disponible.

Si la sesión enlazada desaparece, la tarjeta permanece enlazada para contexto y sigue ofreciendo controles de inicio para reiniciar en una sesión nueva. Si una sesión enlazada activa deja de informar actividad reciente, Workboard marca la tarjeta como `stale` y lo almacena como metadatos hasta que el ciclo de vida lo borre.

Mientras una tarjeta está en un estado de trabajo activo, Workboard sigue la sesión enlazada:

| Estado de la sesión enlazada          | Estado de la tarjeta |
| ------------------------------------- | -------------------- |
| activa                                | `running`            |
| completada                            | `review`             |
| fallida, terminada, agotada o abortada | `blocked`            |

**Los estados de revisión manual prevalecen.** Mover una tarjeta a `review`, `blocked` o `done` detiene la sincronización automática de esa tarjeta hasta que la devuelvas a `todo` o `running`.

Iniciar una tarjeta usa sesiones normales del Gateway; Workboard solo almacena metadatos y enlaces de tarjetas. La transcripción de la conversación, la selección del modelo y el ciclo de vida de la ejecución siguen siendo propiedad del sistema normal de sesiones. Usa **Detener** en una tarjeta enlazada activa para abortar la ejecución activa; Workboard marca esa tarjeta como `blocked` para que siga visible para seguimiento.

Las tarjetas nuevas pueden partir de plantillas de Workboard (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). Las plantillas rellenan previamente título, notas, etiquetas y prioridad; el id de plantilla se almacena como metadatos de la tarjeta.

## Flujo de trabajo del panel

1. Abre la pestaña Workboard en la interfaz de control.
2. Crea una tarjeta con título, notas, prioridad, etiquetas, agente opcional y sesión enlazada opcional, o abre Sessions y elige **Agregar a Workboard** para una sesión existente.
3. Arrastra la tarjeta entre columnas, o enfoca su control compacto de estado y usa el menú o ArrowLeft/ArrowRight.
4. Inicia trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abre la sesión enlazada desde la tarjeta mientras el agente trabaja.
6. Deja que la sincronización del ciclo de vida mueva el trabajo en ejecución a `review`/`blocked`, luego mueve manualmente la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de la tarjeta. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Tarjeta asignada `todo`/`backlog`/`ready` sin actualizar durante más de 1 hora. |
| `running_without_heartbeat` | Tarjeta `running` sin Heartbeat de reclamo ni actualización de ejecución durante más de 20 minutos. |
| `blocked_too_long`          | Tarjeta `blocked` sin actualizar durante más de 24 horas.                      |
| `repeated_failures`         | El recuento de fallos registrados de la tarjeta llega a 2 o más.               |
| `missing_proof`             | Tarjeta `done` sin prueba, artefactos ni adjuntos.                             |
| `orphaned_session`          | Tarjeta `running` con `sessionKey` pero sin metadatos `execution`.             |

## Permisos

Los métodos RPC del Gateway viven bajo `workboard.*`:

| Alcance          | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obtener adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/enlazar/linkDependency/proof/artifact, agregar/eliminar adjuntos, registro de worker, violación de protocolo, reclamar/Heartbeat/liberar/promover/reasignar/reclamar de nuevo/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificaciones |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de operador de solo lectura pueden inspeccionar el tablero, pero no pueden mutar tarjetas.

## Almacenamiento

Workboard almacena datos duraderos en una base de datos SQLite relacional propiedad del Plugin bajo el directorio de estado de OpenClaw: tableros, tarjetas, etiquetas, eventos de ciclo de vida, intentos de ejecución, comentarios, enlaces de dependencia, pruebas, referencias de artefactos, metadatos y blobs de adjuntos, diagnósticos, notificaciones, registros de workers, estado de protocolo y suscripciones viven todos en tablas de Workboard (no en entradas clave-valor del Plugin). Una exportación de tarjeta preserva la narrativa del tablero sin insertar el contenido blob de los adjuntos.

Las instalaciones que usaron Workboard en la versión `.28` pueden ejecutar `openclaw doctor --fix` para migrar los espacios de nombres de estado de Plugin heredados incluidos en esa versión (`workboard.cards`, `workboard.boards`, `workboard.notify` y, si está presente, `workboard.attachments`) a la base de datos relacional.

## Solución de problemas

**La pestaña indica que Workboard no está disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, agrega `workboard` a la lista. Si `plugins.deny` contiene `workboard`, elimínalo antes de habilitar el Plugin.

**Las tarjetas no se guardan**

Confirma que la conexión del navegador tenga acceso `operator.write`. Las sesiones de operador de solo lectura pueden listar tarjetas, pero no pueden crearlas, editarlas, moverlas ni eliminarlas.

**Iniciar una tarjeta no abre la sesión esperada**

Comprueba el id de agente de la tarjeta y la sesión enlazada, luego abre Sessions o Chat para inspeccionar el estado real de la ejecución.

**El despacho no inicia un worker**

Confirma que haya al menos una tarjeta `ready` sin un reclamo activo:

```bash
openclaw workboard list --status ready
```

Si la CLI informa despacho solo de datos, inicia o reinicia el Gateway y vuelve a intentarlo: el despacho solo de datos actualiza el estado local del tablero, pero no puede iniciar ejecuciones de workers de subagente. Las tarjetas también pueden omitirse cuando otra tarjeta del mismo propietario o agente ya está en ejecución o esperando revisión; completa, bloquea o libera ese trabajo activo antes de despachar más para el mismo propietario.

## Relacionado

- [Interfaz de control](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Administrar Plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
