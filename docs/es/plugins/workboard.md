---
read_when:
    - Quieres un tablero de trabajo de estilo Kanban en la UI de Control
    - Estás habilitando o deshabilitando el Plugin Workboard incluido
    - Quiere realizar un seguimiento del trabajo planificado de agentes sin un gestor de proyectos externo
summary: Panel de trabajo opcional del dashboard para tarjetas propiedad del agente y traspaso de sesión
title: Plugin de Workboard
x-i18n:
    generated_at: "2026-07-05T11:35:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70ac13ef747af38e49eb49866a9bae7a06f53b8b0b5765f47d0d0cfd2d7b4bc1
    source_path: plugins/workboard.md
    workflow: 16
---

El Plugin Workboard añade un tablero opcional de estilo Kanban a la
[IU de control](/es/web/control-ui): tarjetas de trabajo dimensionadas para agentes, asignación a agentes,
y un enlace de vuelta a la tarea, ejecución y sesión de panel de la tarjeta.

Workboard es intencionalmente pequeño: rastrea trabajo operativo local para un
Gateway de OpenClaw. No reemplaza a GitHub Issues, Linear, Jira u
otros sistemas de gestión de proyectos de equipo.

## Habilitarlo

Workboard viene incluido, pero está deshabilitado de forma predeterminada:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

La pestaña Workboard aparece en la navegación del panel. Si la pestaña está visible pero el
plugin está deshabilitado o bloqueado por `plugins.allow`/`plugins.deny`, la pestaña muestra
un estado de plugin no disponible en lugar de datos de tarjetas.

## Configuración

Workboard no tiene configuración específica del plugin. Habilítalo o deshabilítalo con la entrada
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

| Campo       | Valores                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | cadenas de formato libre                                                                                      |
| `agentId`   | agente asignado opcional                                                                                      |
| referencias vinculadas | tarea, ejecución, sesión o URL de origen opcional                                                                    |
| `execution` | metadatos opcionales para una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, id de ejecución, estado) |

Las tarjetas también contienen metadatos compactos para intentos, comentarios, enlaces, pruebas,
artefactos, ajustes de automatización, adjuntos, registros de trabajadores, estado del protocolo de trabajadores,
reclamaciones, diagnósticos, notificaciones, id de plantilla, estado de archivo y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo una tarjeta se movió por el tablero sin abrir la sesión vinculada;
son contexto operativo local, no un reemplazo de las transcripciones de sesión
ni del historial de incidencias de GitHub.

Las tarjetas se almacenan en el propio estado de Gateway del plugin y se mueven con el resto del
estado de OpenClaw de ese Gateway (consulta [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas sin vincular pueden iniciar trabajo directamente:

- **Run Codex** / **Run Claude** inicia una ejecución de agente con seguimiento de tarea con un
  motor explícito, envía el prompt de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
  usan `openai/gpt-5.5`; las ejecuciones de Claude usan `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** crea una sesión de panel vinculada sin
  enviar el prompt de la tarjeta ni mover la tarjeta, para trabajo manual que permanece
  adjunto al tablero.

Los inicios autónomos usan la ruta de ejecución de agente con seguimiento de tarea del Gateway (agente
y modelo predeterminados, salvo que Codex/Claude se elija explícitamente); Workboard luego vincula la
tarea resultante, el id de ejecución y la clave de sesión de vuelta a la tarjeta. Cada
ejecución vinculada también registra un resumen de intento (motor, modo, modelo, id de ejecución,
marcas de tiempo, estado, contador acumulado de fallos) para que los fallos repetidos sigan siendo visibles.

El panel actualiza el estado de la tarea desde el libro de tareas del Gateway, haciendo coincidir
tareas con tarjetas por id de tarea, id de ejecución o clave de sesión vinculada. Una tarea en cola/en ejecución
mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, fallida, agotada por tiempo o
cancelada mueve la tarjeta hacia `review` o `blocked` usando la misma regla de sincronización
que las sesiones vinculadas (consulta [Sincronización del ciclo de vida de sesión](#session-lifecycle-sync)).

## Herramientas de agente

| Herramienta                                                                                                                                             | Propósito                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Lista tarjetas compactas con estado de reclamación/diagnóstico; filtro de tablero opcional.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Devuelve una tarjeta más contexto acotado del trabajador (notas, intentos, comentarios, enlaces, pruebas, artefactos, resultados padre, trabajo reciente del asignado, diagnósticos activos).                               |
| `workboard_create`                                                                                                                               | Crea una tarjeta con padres opcionales, tenant, Skills, tablero, metadatos de espacio de trabajo, clave de idempotencia, límite de tiempo de ejecución, presupuesto de reintentos.                                                             |
| `workboard_link`                                                                                                                                 | Vincula un padre a una tarjeta hija. Las hijas permanecen en `todo` hasta que todos los padres lleguen a `done`; luego la promoción de despacho las mueve a `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Reclama una tarjeta para el agente llamante; mueve `backlog`/`todo`/`ready` a `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Actualiza el Heartbeat de reclamación durante una ejecución más larga.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Libera la reclamación tras la finalización, pausa o transferencia; puede mover la tarjeta a un siguiente estado.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Herramientas estructuradas de ciclo de vida para resúmenes finales, pruebas, artefactos y manifiestos de tarjetas creadas (deben hacer referencia a tarjetas vinculadas de vuelta a la tarjeta completada) o motivos de bloqueo.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Almacena adjuntos pequeños de tarjetas en el estado SQLite del plugin, los indexa en la tarjeta y los expone en el contexto del trabajador.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra líneas de log del trabajador y bloquea una tarjeta cuando un trabajador automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestiona metadatos persistidos del tablero (nombre visible, descripción, estado de archivo, espacio de trabajo predeterminado).                                                                                            |
| `workboard_runs`                                                                                                                                 | Devuelve el historial persistido de intentos de ejecución para una tarjeta.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Convierte una tarjeta preliminar de triaje/backlog en una tarjeta `todo` aclarada; registra el resumen de especificación en la tarjeta.                                                                                      |
| `workboard_decompose`                                                                                                                            | Descompone una tarjeta padre de orquestación en hijas vinculadas, heredando metadatos de tablero/tenant; puede completar la tarjeta padre con un manifiesto de tarjetas creadas.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestiona suscripciones a notificaciones. Las lecturas de eventos son seguras para reproducción; `advance` mueve el cursor durable para que los llamantes reanuden sin perder ni leer dos veces eventos de tarjetas completadas/fallidas/obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecciona espacios de nombres de tableros y estadísticas de cola.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera o transfiere trabajo atascado.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Añade notas de transferencia o adjunta referencias de prueba/artefacto.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Mueve trabajo bloqueado de vuelta a `todo`.                                                                                                                                                         |
| `workboard_dispatch`                                                                                                                             | Impulsa la promoción de dependencias o la limpieza de reclamaciones obsoletas.                                                                                                                                        |

Las tarjetas reclamadas rechazan mutaciones de herramientas de agente desde otros agentes a menos que el llamador
tenga el token de reclamación devuelto por `workboard_claim`. Cada tarjeta devuelta por una
herramienta de agente o llamada RPC del Gateway redacta `metadata.claim.token` como `[redacted]`
(el token en sí se devuelve una vez, en el nivel superior, solo desde `workboard_claim`),
para que los operadores del panel y otros agentes puedan inspeccionar el estado de reclamación sin llegar
a ver nunca un token utilizable. La recuperación pasa por
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no
requieren el token.

## Despacho

El despacho es local al Gateway: no genera procesos arbitrarios del sistema operativo. Las sesiones normales de
subagentes de OpenClaw siguen siendo propietarias de la ejecución. Una pasada de despacho:

1. Promueve tarjetas cuyas dependencias están listas.
2. Registra metadatos de despacho en tarjetas listas.
3. Bloquea reclamaciones vencidas o ejecuciones agotadas por tiempo.
4. Marca las tarjetas de triaje configuradas por el tablero como candidatas de orquestación.
5. Reclama un lote pequeño de tarjetas listas e inicia ejecuciones de workers mediante el
   runtime de subagentes del Gateway.

Los workers reciben contexto acotado de la tarjeta más el token de reclamación necesario para enviar heartbeat,
completar o bloquear la tarjeta mediante las herramientas de Workboard.

### Selección de workers

Cada pasada inicia **como máximo 3 workers de forma predeterminada**. Las tarjetas listas se ordenan por
prioridad, luego posición y luego hora de creación. Una pasada inicia solo una tarjeta por
propietario/agente y omite propietarios que ya tienen trabajo en ejecución o en revisión en el
tablero. Las tarjetas archivadas, las tarjetas con una reclamación activa y las tarjetas que no están en estado
`ready` nunca se seleccionan para iniciar workers (aún pueden verse afectadas por el
lado de datos del despacho: limpieza de reclamaciones obsoletas, promoción de dependencias, limpieza de
tiempos agotados).

Las claves de sesión son deterministas por tablero/tarjeta, por lo que los despachos repetidos se enrutan
de vuelta al mismo carril de worker en lugar de crear sesiones no relacionadas:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve
  el agente predeterminado configurado)

Si no se puede iniciar un worker después de reclamar una tarjeta, Workboard bloquea la
tarjeta, borra la reclamación, registra el fallo de inicio de ejecución y agrega una línea de
registro de worker, visible en el panel, JSON de la CLI, herramientas de agente y
diagnósticos de tarjeta.

### Puntos de entrada

- Acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal con capacidad de comandos

Los tres usan el runtime de subagentes del Gateway cuando el Gateway está disponible. La
CLI tiene una alternativa para operadores: si la llamada al Gateway falla con un error de
conexión/no disponible (o un error `unknown method` para Gateways más antiguos),
y no se aplica ningún destino explícito `--url`/`--token` ni ningún Gateway remoto
configurado (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta
un despacho solo de datos contra el estado SQLite local: puede promover dependencias,
limpiar reclamaciones obsoletas y bloquear ejecuciones agotadas por tiempo, pero no puede iniciar workers. Los fallos de autenticación,
permisos y validación desde un Gateway alcanzable no se tratan
como no disponibles; aparecen como errores de comando, igual que cualquier fallo del Gateway
cuando se proporcionó un destino explícito `--url`/`--token`.

Los metadatos del tablero pueden definir `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y
la expone en el contexto del worker; la especificación/descomposición real sigue ejecutándose
mediante las herramientas normales de Workboard.

## CLI y comando de barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta las tarjetas archivadas de forma predeterminada (`--include-archived`
lo sobrescribe); `--json` siempre incluye las tarjetas archivadas, coincidiendo con el contrato de tarjeta completa
usado por scripts existentes. `show` acepta un prefijo de id no ambiguo.
`list`, `create` y `show` siempre leen/escriben directamente el estado local del plugin.
Solo `dispatch` llama al Gateway en ejecución, con la alternativa descrita arriba.

Consulta [CLI de Workboard](/es/cli/workboard) para ver todos los flags, salida JSON, comportamiento
de alternativa del Gateway, manejo de prefijos de id, reglas de selección de despacho y
solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
y `/workboard dispatch` reflejan la CLI. Listar y mostrar son operaciones de lectura
para cualquier remitente de comandos autorizado. Crear y despachar requieren estado de propietario en
superficies de chat, o un cliente Gateway con `operator.write`/`operator.admin`.

## Sincronización del ciclo de vida de sesión

Las tarjetas pueden vincularse a una sesión existente del panel, o a una creada cuando
inicias trabajo desde la tarjeta. Las tarjetas vinculadas muestran el ciclo de vida de la sesión en línea:
en ejecución, obsoleta, vinculada inactiva, completada, fallida o faltante. También puedes capturar una
sesión existente desde la pestaña Sessions con **Add to Workboard**; la tarjeta
se vincula a esa sesión, usa la etiqueta de sesión o el prompt de usuario reciente como título,
y rellena notas desde el prompt de usuario reciente más la última respuesta del assistant
cuando esté disponible.

Si la sesión vinculada desaparece, la tarjeta permanece vinculada por contexto y
sigue ofreciendo controles de inicio para reiniciar en una sesión nueva. Si una
sesión vinculada activa deja de informar actividad reciente, Workboard marca la tarjeta como
`stale` y lo almacena como metadatos hasta que el ciclo de vida lo borre.

Mientras una tarjeta está en un estado de trabajo activo, Workboard sigue la sesión vinculada:

| Estado de sesión vinculada             | Estado de tarjeta |
| -------------------------------------- | ----------------- |
| activa                                 | `running`         |
| completada                             | `review`          |
| fallida, terminada, agotada por tiempo o abortada | `blocked`         |

**Los estados de revisión manual tienen prioridad.** Mover una tarjeta a `review`, `blocked` o `done`
detiene la sincronización automática de esa tarjeta hasta que la muevas de nuevo a `todo` o `running`.

Iniciar una tarjeta usa sesiones normales del Gateway; Workboard solo almacena
metadatos y enlaces de tarjetas. La transcripción de conversación, la selección de modelo y el ciclo de vida
de ejecución siguen siendo propiedad del sistema de sesiones normal. Usa **Stop** en una tarjeta vinculada
activa para abortar la ejecución activa: Workboard marca esa tarjeta como `blocked` para que
permanezca visible para seguimiento.

Las tarjetas nuevas pueden partir de plantillas de Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Las plantillas prerrellenan título, notas, etiquetas y prioridad;
el id de plantilla se almacena como metadatos de tarjeta.

## Flujo de trabajo del panel

1. Abre la pestaña Workboard en la Control UI.
2. Crea una tarjeta con título, notas, prioridad, etiquetas, agente opcional y
   sesión vinculada opcional, o abre Sessions y elige **Add to Workboard**
   para una sesión existente.
3. Arrastra la tarjeta entre columnas, o enfoca su control de estado compacto y usa
   el menú o ArrowLeft/ArrowRight.
4. Inicia trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abre la sesión vinculada desde la tarjeta mientras el agente trabaja.
6. Deja que la sincronización del ciclo de vida mueva el trabajo en ejecución a `review`/`blocked`, luego mueve manualmente
   la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de la tarjeta. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Tarjeta `todo`/`backlog`/`ready` asignada sin actualizar durante más de 1 hora. |
| `running_without_heartbeat` | Tarjeta `running` sin heartbeat de reclamación ni actualización de ejecución durante más de 20 minutos. |
| `blocked_too_long`          | Tarjeta `blocked` sin actualizar durante más de 24 horas.                      |
| `repeated_failures`         | El recuento de fallos rastreados de la tarjeta llega a 2 o más.                |
| `missing_proof`             | Tarjeta `done` sin prueba, artefactos ni adjuntos.                             |
| `orphaned_session`          | Tarjeta `running` con una `sessionKey` pero sin metadatos `execution`.         |

## Permisos

Los métodos RPC del Gateway viven bajo `workboard.*`:

| Ámbito           | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obtener adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/vincular/vincularDependency/prueba/artefacto, agregar/eliminar adjunto, registro de worker, infracción de protocolo, reclamar/heartbeat/liberar/promover/reasignar/reclamar de nuevo/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificación |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de operador
de solo lectura pueden inspeccionar el tablero, pero no pueden mutar tarjetas.

## Almacenamiento

Workboard almacena datos duraderos en una base de datos SQLite relacional propiedad del plugin
bajo el directorio de estado de OpenClaw: tableros, tarjetas, etiquetas, eventos de ciclo de vida,
intentos de ejecución, comentarios, enlaces de dependencia, prueba, referencias de artefactos,
metadatos y blobs de adjuntos, diagnósticos, notificaciones, registros de workers,
estado de protocolo y suscripciones viven todos en tablas de Workboard (no en
entradas clave-valor del plugin). Una exportación de tarjeta preserva la narrativa del tablero
sin incrustar el contenido blob de los adjuntos.

Las instalaciones que usaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres de estado de plugin heredados enviados
(`workboard.cards`, `workboard.boards`, `workboard.notify` y, si está presente,
`workboard.attachments`) a la base de datos relacional.

## Solución de problemas

**La pestaña dice que Workboard no está disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, agrega `workboard` a esa lista. Si `plugins.deny`
contiene `workboard`, elimínalo antes de habilitar el plugin.

**Las tarjetas no se guardan**

Confirma que la conexión del navegador tiene acceso `operator.write`. Las sesiones de operador
de solo lectura pueden listar tarjetas, pero no pueden crearlas, editarlas, moverlas ni eliminarlas.

**Iniciar una tarjeta no abre la sesión esperada**

Comprueba el id de agente de la tarjeta y la sesión vinculada, luego abre Sessions o Chat para
inspeccionar el estado real de ejecución.

**El despacho no inicia un worker**

Confirma que hay al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa despacho solo de datos, inicia o reinicia el Gateway y
vuelve a intentarlo: el despacho solo de datos actualiza el estado local del tablero, pero no puede iniciar
ejecuciones de workers subagentes. Las tarjetas también pueden omitirse cuando otra tarjeta del
mismo propietario o agente ya está en ejecución o esperando revisión; completa,
bloquea o libera ese trabajo activo antes de despachar más para el mismo
propietario.

## Relacionado

- [Control UI](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Administrar plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
