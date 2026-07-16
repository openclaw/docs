---
read_when:
    - Se busca un tablero de trabajo estilo Kanban en la interfaz de control
    - Está habilitando o deshabilitando el plugin Workboard incluido
    - Quiere realizar un seguimiento del trabajo planificado del agente sin un gestor de proyectos externo
summary: Panel de trabajo opcional para tarjetas gestionadas por agentes y transferencia de sesiones
title: Plugin de Workboard
x-i18n:
    generated_at: "2026-07-16T12:02:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

El plugin Workboard añade un tablero opcional de estilo Kanban a la
[interfaz de control](/es/web/control-ui): tarjetas de trabajo dimensionadas para agentes, asignación a agentes
y un enlace a la tarea, la ejecución y la sesión del panel de la tarjeta.

Workboard es intencionadamente pequeño: realiza un seguimiento del trabajo operativo local para un
Gateway de OpenClaw. No sustituye a GitHub Issues, Linear, Jira ni a
otros sistemas de gestión de proyectos en equipo.

## Activarlo

Workboard viene incluido, pero está desactivado de forma predeterminada:

1. Abra **Plugins** en la interfaz de control o use `/settings/plugins` con respecto a
   la ruta base configurada de la interfaz de control. Por ejemplo, una ruta base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Busque **Workboard** y seleccione **Enable**. Como Workboard está incluido con
   OpenClaw, no necesita una acción **Install**.
3. Si la interfaz indica que es necesario reiniciar, reinicie el Gateway.

La pestaña Workboard aparece en la navegación del panel después de que se cargue el entorno de ejecución del plugin.
Mientras está desactivada, la pestaña permanece oculta en la navegación. Al abrir directamente la
ruta `/workboard` mientras el plugin está desactivado o bloqueado por
`plugins.allow`/`plugins.deny`, se muestra un estado de plugin no disponible en lugar de los datos
de las tarjetas.

El flujo de trabajo equivalente con la CLI es:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuración

Workboard no tiene ninguna configuración específica del plugin. Actívelo o desactívelo con la entrada
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
| `labels`    | cadenas de formato libre                                                                                             |
| `agentId`   | agente asignado opcional                                                                                       |
| referencias vinculadas | tarea, ejecución, sesión o URL de origen opcionales                                                                    |
| `execution` | metadatos opcionales para una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, id. de ejecución, estado) |

Las tarjetas también contienen metadatos compactos sobre intentos, comentarios, enlaces, pruebas,
artefactos, ajustes de automatización, archivos adjuntos, registros de procesos de trabajo, estado del protocolo
de procesos de trabajo, reclamaciones, diagnósticos, notificaciones, id. de plantilla, estado de archivado y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo se desplazó una tarjeta por el tablero sin abrir la sesión
vinculada; son contexto operativo local, no un sustituto de las transcripciones
de las sesiones ni del historial de incidencias de GitHub.

El plugin y la interfaz de control usan un único contrato de tarjeta de Workboard. Por tanto, las actualizaciones del panel
conservan la procedencia y la autoridad del espacio de trabajo, el estado de reclamación, las acciones
de diagnóstico y los números de secuencia de las notificaciones, en lugar de proyectar una copia más pequeña
de la tarjeta destinada únicamente a la interfaz. Los tipos de diagnóstico, las gravedades de diagnóstico y
los tipos de notificación desconocidos se ignoran hasta que ambas superficies los admitan; nunca
se reescriben como otro estado válido.

El panel abierto se actualiza a partir de las invalidaciones `plugin.workboard.changed`. Cada
evento contiene únicamente una época y una revisión del almacén; después, la interfaz vuelve a leer las tarjetas
canónicas mediante la RPC `operator.read` normal. Varias revisiones se agrupan en
una única lectura posterior. Workboard aplaza esa lectura mientras se arrastra,
edita o escribe una tarjeta y la reanuda cuando termina la interacción local. Una
reconexión siempre realiza una recarga canónica. No hay un sondeo completo rutinario
de las tarjetas, y **Refresh** sigue disponible como recuperación manual.

Cuando existe más de un tablero, la barra de herramientas incluye un filtro **Board** respaldado
por metadatos persistentes de los tableros, no solo por las tarjetas visibles en ese momento. Por tanto, los tableros vacíos
y archivados siguen siendo seleccionables. Las tarjetas sin un id. de tablero explícito
pertenecen al tablero canónico `default`. El tablero seleccionado se almacena
en el parámetro de consulta `?board=`, por lo que la URL filtrada de Workboard puede guardarse
como marcador o compartirse; al seleccionar **All boards**, se elimina el parámetro.

Las tarjetas se almacenan en el estado propio del Gateway del plugin y se trasladan junto con el resto
del estado de OpenClaw de ese Gateway (consulte [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas no vinculadas pueden iniciar trabajo directamente:

- **Run Codex** / **Run Claude** inicia una ejecución de agente con seguimiento de tareas y un
motor explícito, envía la instrucción de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
usan `openai/gpt-5.6-sol`; las de Claude usan `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** crea una sesión vinculada del panel sin
enviar la instrucción de la tarjeta ni moverla, para realizar trabajo manual que permanece
asociado al tablero.

Los inicios autónomos usan la ruta de ejecución de agentes con seguimiento de tareas del Gateway (el agente
y el modelo predeterminados, salvo que se elija Codex/Claude explícitamente); a continuación, Workboard vincula
la tarea resultante, el id. de ejecución y la clave de sesión a la tarjeta. Cada ejecución
vinculada también registra un resumen del intento (motor, modo, modelo, id. de ejecución,
marcas de tiempo, estado y recuento acumulado de fallos) para que los fallos repetidos sigan visibles.

El panel actualiza el estado de las tareas desde el registro de tareas del Gateway y relaciona
las tareas con las tarjetas mediante el id. de tarea, el id. de ejecución o la clave de sesión vinculada. Una tarea
en cola o en ejecución mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, fallida, agotada por tiempo de espera o
cancelada desplaza la tarjeta hacia `review` o `blocked` mediante la misma regla de
sincronización que las sesiones vinculadas (consulte [Sincronización del ciclo de vida de las sesiones](#session-lifecycle-sync)).

## Herramientas de agente

| Herramienta                                                                                                                                       | Propósito                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Enumerar tarjetas compactas con el estado de reclamación/diagnóstico; filtro opcional por tablero.                                                                                       |
| `workboard_read`                                                                                                                                 | Devolver una tarjeta junto con contexto acotado del trabajador (notas, intentos, comentarios, enlaces, pruebas, artefactos, resultados principales, trabajo reciente del asignado y diagnósticos activos). |
| `workboard_create`                                                                                                                               | Crear una tarjeta con elementos principales, inquilino, Skills, tablero, metadatos del espacio de trabajo, clave de idempotencia, límite de ejecución y presupuesto de reintentos opcionales. |
| `workboard_link`                                                                                                                                 | Vincular un elemento principal con una tarjeta secundaria. Las secundarias permanecen en `todo` hasta que todos los elementos principales alcanzan `done`; entonces, la promoción de despacho las mueve a `ready`. |
| `workboard_claim`                                                                                                                                | Reclamar una tarjeta para el agente que realiza la llamada; mueve `backlog`/`todo`/`ready` a `running`.                                                                                  |
| `workboard_heartbeat`                                                                                                                            | Actualizar el Heartbeat de la reclamación durante una ejecución más larga.                                                                                                                |
| `workboard_release`                                                                                                                              | Liberar la reclamación después de completar, pausar o transferir el trabajo; puede mover la tarjeta a un estado posterior.                                                               |
| `workboard_complete` / `workboard_block`                                                                                                         | Herramientas estructuradas del ciclo de vida para resúmenes finales, pruebas, artefactos y manifiestos de tarjetas creadas (deben hacer referencia a tarjetas vinculadas con la tarjeta completada), o motivos de bloqueo. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Almacenar pequeños archivos adjuntos de tarjetas en el estado SQLite del Plugin, indexarlos en la tarjeta y exponerlos en el contexto del trabajador.                                    |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registrar líneas del registro del trabajador y bloquear una tarjeta cuando un trabajador automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                  |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestionar los metadatos persistentes del tablero (nombre mostrado, descripción, estado de archivo y espacio de trabajo predeterminado).                                                   |
| `workboard_runs`                                                                                                                                 | Devolver el historial persistente de intentos de ejecución de una tarjeta.                                                                                                               |
| `workboard_specify`                                                                                                                              | Convertir una tarjeta preliminar de clasificación/trabajo pendiente en una tarjeta `todo` aclarada; registra el resumen de la especificación en la tarjeta.                 |
| `workboard_decompose`                                                                                                                            | Dividir una tarjeta principal de orquestación en tarjetas secundarias vinculadas, heredando los metadatos de tablero/inquilino; puede completar la principal con un manifiesto de tarjetas creadas. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestionar las suscripciones a notificaciones. Las lecturas de eventos permiten una reproducción segura; `advance` mueve el cursor duradero para que quienes realizan llamadas reanuden la lectura sin perder ni leer dos veces eventos de tarjetas completadas, fallidas u obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspeccionar los espacios de nombres del tablero y las estadísticas de la cola.                                                                                                         |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recuperar o transferir trabajo atascado.                                                                                                                                                  |
| `workboard_comment` / `workboard_proof`                                                                                                          | Añadir notas de transferencia o adjuntar referencias a pruebas/artefactos.                                                                                                               |
| `workboard_unblock`                                                                                                                              | Devolver el trabajo bloqueado a `todo`.                                                                                                                                       |
| `workboard_move`                                                                                                                                 | Mover una tarjeta a otro estado; las tarjetas reclamadas requieren el ámbito de reclamación del agente que realiza la llamada.                                                           |
| `workboard_dispatch`                                                                                                                             | Activar la promoción de dependencias o la limpieza de reclamaciones obsoletas sin iniciar trabajadores; el inicio de trabajadores utiliza el Gateway o el despacho mediante comandos con barra. |

Las tarjetas reclamadas rechazan las modificaciones mediante herramientas de agente de otros agentes, salvo que quien realiza la llamada
posea el token de reclamación devuelto por `workboard_claim`. Cada tarjeta devuelta por una
herramienta de agente o una llamada RPC del Gateway oculta `metadata.claim.token` como `[redacted]`
(el propio token se devuelve una sola vez, en el nivel superior, únicamente desde `workboard_claim`),
de modo que los operadores del panel y otros agentes puedan inspeccionar el estado de reclamación sin
ver nunca un token utilizable. La recuperación se realiza mediante
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no
requieren el token.

## Despacho

El despacho es local al Gateway: no inicia procesos arbitrarios del sistema operativo. Las sesiones normales
de subagentes de OpenClaw siguen siendo responsables de la ejecución. Una pasada de despacho:

1. Promueve las tarjetas cuyas dependencias están listas.
2. Registra metadatos de despacho en las tarjetas listas.
3. Bloquea las reclamaciones caducadas o las ejecuciones que superaron el tiempo de espera.
4. Marca las tarjetas de clasificación configuradas en el tablero como candidatas para la orquestación.
5. Reclama un pequeño lote de tarjetas listas e inicia ejecuciones de trabajadores mediante el
   entorno de ejecución de subagentes del Gateway.

Los trabajadores reciben contexto acotado de la tarjeta junto con el token de reclamación necesario para enviar Heartbeats,
completar o bloquear la tarjeta mediante las herramientas de Workboard.

Las rutas del espacio de trabajo respetan la autoridad existente del sistema de archivos de quien realiza la llamada. Los clientes del Gateway
con `operator.write` pueden utilizar espacios de trabajo de agentes configurados;
los clientes `operator.admin` pueden utilizar otros repositorios del host. Las herramientas de agente aisladas utilizan
el acceso al espacio de trabajo de su entorno aislado, mientras que las herramientas sin aislamiento limitadas al espacio de trabajo utilizan la
raíz configurada de su espacio de trabajo. Workboard registra esa autoridad cuando se asigna un espacio de trabajo
y vuelve a intersectarla con la autoridad actual de quien realiza la llamada durante el despacho,
por lo que una tarjeta persistente no puede ampliar el acceso de quien realice una llamada posteriormente. Las tarjetas antiguas con un
espacio de trabajo explícito del host, pero sin una autoridad registrada, deben volver a guardar ese espacio de trabajo
antes de un despacho con acceso completo al host; las tarjetas sin una ruta del host adoptan la
autoridad actual de quien realiza la llamada cuando se despachan por primera vez.

El despacho vinculado al espacio de trabajo acepta un directorio o repositorio Git únicamente cuando la
raíz del repositorio coincide exactamente con el espacio de trabajo del agente de destino. Una solicitud de worktree
se limita a ese directorio y se conserva como espacio de trabajo de directorio, por lo que el
host no materializa el repositorio ni ejecuta código de configuración del repositorio. El
trabajador de destino debe utilizar un entorno aislado de Docker escribible y no compartido para ese
espacio de trabajo exacto, sin ejecución elevada, anulaciones persistentes de ejecución en host/Node ni
herramientas de Plugin y MCP sin clasificar. Workboard enumera sus herramientas registradas
en lugar de confiar en un prefijo `workboard_*`, y el despacho rechaza un contenedor Docker
activo cuyo hash de montaje/configuración en ejecución esté obsoleto. El despacho informa de la
política de destino incompatible en lugar de iniciar un trabajador con menos restricciones.
El despacho con acceso completo al host puede dirigirse a otros repositorios locales y conserva la configuración
normal de worktrees administrados.

La autoridad del espacio de trabajo no crea un segundo modelo de permisos para el ciclo de vida de las tarjetas.
Quienes pueden modificar tarjetas de Workboard pueden moverlas manualmente por los mismos
estados en todas las superficies; el acceso de solo lectura al espacio de trabajo únicamente impide el
despacho de trabajadores que necesitan realizar escrituras.

### Selección de trabajadores

Cada pasada inicia **como máximo 3 trabajadores de forma predeterminada**. Las tarjetas listas se ordenan por
prioridad, luego por posición y, por último, por hora de creación. Una pasada inicia solo una tarjeta por
propietario/agente y omite a los propietarios que ya tienen trabajo en ejecución o en revisión en el
tablero. Las tarjetas archivadas, las tarjetas con una reclamación activa y las tarjetas cuyo estado no sea `ready`
nunca se seleccionan para iniciar trabajadores (aun así, pueden verse afectadas por la
parte de datos del despacho: limpieza de reclamaciones obsoletas, promoción de dependencias y limpieza por
tiempo de espera).

Las claves de sesión son deterministas para cada tablero/tarjeta, por lo que los despachos repetidos se dirigen
de nuevo al mismo carril de trabajador en lugar de crear sesiones no relacionadas:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve
  el agente predeterminado configurado)

Si no se puede iniciar un trabajador después de reclamar una tarjeta, Workboard bloquea la
tarjeta, elimina la reclamación, registra el fallo de inicio de la ejecución y añade una línea al
registro del trabajador, visible en el panel, el JSON de la CLI, las herramientas de agente y los
diagnósticos de la tarjeta.

### Puntos de entrada

- Acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal compatible con comandos

Los tres usan el entorno de ejecución de subagentes del Gateway cuando este está disponible. La
CLI dispone de una alternativa para el operador: si la llamada al Gateway falla con un
error de conexión/no disponibilidad (o un error `unknown method` para
Gateways anteriores), y no se aplica ningún destino `--url`/`--token` explícito ni ningún Gateway
remoto configurado (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta
un despacho de solo datos sobre el estado SQLite local: puede promover dependencias,
limpiar reclamaciones obsoletas y bloquear ejecuciones que han agotado el tiempo de espera, pero no puede iniciar procesos de trabajo. Los fallos de autenticación,
permisos y validación de un Gateway accesible no se consideran
indisponibilidad; se presentan como errores del comando, al igual que cualquier fallo del Gateway
cuando se ha especificado un destino `--url`/`--token` explícito.

Los metadatos del tablero pueden establecer `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y
la expone en el contexto del proceso de trabajo; la especificación y descomposición efectivas siguen
ejecutándose mediante las herramientas normales de Workboard.

## CLI y comando con barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta de forma predeterminada las tarjetas archivadas (`--include-archived`
lo anula); `--json` siempre incluye las tarjetas archivadas, conforme al contrato de tarjetas completas
que usan los scripts existentes. `show` y `move` aceptan un prefijo de id
inequívoco. `list`, `create`, `show` y `move` siempre leen/escriben directamente el estado
local del plugin. Solo `dispatch` llama al Gateway en ejecución, con la alternativa
descrita anteriormente.

Consulte [CLI de Workboard](/es/cli/workboard) para conocer todas las opciones, la salida JSON, el comportamiento alternativo
del Gateway, el tratamiento de prefijos de id, las reglas de selección del despacho y la
solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` y `/workboard dispatch` replican
la CLI. Listar y mostrar son operaciones de lectura para cualquier remitente de comandos autorizado.
Crear, mover y despachar requieren el estado de propietario en las superficies de chat, o un cliente
del Gateway con `operator.write`/`operator.admin`. Los movimientos manuales del operador usan el
mismo comportamiento de anulación de reclamaciones que la función de arrastrar y soltar del panel. Su acceso al árbol de trabajo
sigue respetando el mismo límite del espacio de trabajo descrito anteriormente.

## Sincronización del ciclo de vida de la sesión

Las tarjetas pueden enlazarse con una sesión existente del panel o con una creada al
iniciar el trabajo desde la tarjeta. Las tarjetas enlazadas muestran el ciclo de vida de la sesión en línea:
en ejecución, obsoleta, enlazada e inactiva, finalizada, fallida o ausente. También es posible capturar una
sesión existente desde la pestaña Sessions mediante **Add to Workboard**; la tarjeta
se enlaza con esa sesión, usa la etiqueta de la sesión o el mensaje reciente del usuario como título
e inicializa las notas con el mensaje reciente del usuario y la respuesta más reciente del asistente
cuando estén disponibles.

Si la sesión enlazada desaparece, la tarjeta permanece enlazada para conservar el contexto y
sigue ofreciendo controles de inicio para reiniciar en una sesión nueva. Si una sesión enlazada
activa deja de informar actividad reciente, Workboard marca la tarjeta como
`stale` y lo almacena como metadatos hasta que el ciclo de vida lo elimine.

Mientras una tarjeta está en un estado de trabajo activo, Workboard sigue la sesión enlazada:

| Estado de la sesión enlazada          | Estado de la tarjeta |
| ------------------------------------- | ----------- |
| activa                                | `running`   |
| completada                            | `review`    |
| fallida, terminada, con tiempo de espera agotado o abortada | `blocked`   |

**Los estados de revisión manual tienen prioridad.** Mover una tarjeta a `review`, `blocked` o `done`
detiene la sincronización automática de esa tarjeta hasta que se vuelva a mover a `todo` o `running`.

Al iniciar una tarjeta se usan sesiones normales del Gateway; Workboard solo almacena los
metadatos y enlaces de la tarjeta. La transcripción de la conversación, la selección del modelo y el ciclo de vida
de la ejecución siguen siendo propiedad del sistema de sesiones habitual. Use **Stop** en una tarjeta enlazada
activa para abortar la ejecución en curso; Workboard marca esa tarjeta como `blocked` para que
permanezca visible y pueda realizarse un seguimiento.

Las tarjetas nuevas pueden partir de plantillas de Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Las plantillas rellenan previamente el título, las notas, las etiquetas y la prioridad;
el id de la plantilla se almacena como metadatos de la tarjeta.

## Flujo de trabajo del panel

1. Abra la pestaña Workboard en la interfaz de control.
2. Cree una tarjeta con título, notas, prioridad, etiquetas, un agente opcional y
   una sesión enlazada opcional; o abra Sessions y elija **Add to Workboard**
   para una sesión existente.
3. Arrastre la tarjeta entre columnas, o enfoque su control de estado compacto y use
   el menú o ArrowLeft/ArrowRight. Durante el arrastre, la tarjeta de origen se atenúa y
   las columnas de destino disponibles muestran un contorno.
4. Inicie el trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abra la sesión enlazada desde la tarjeta mientras trabaja el agente.
6. Permita que la sincronización del ciclo de vida mueva el trabajo en curso a `review`/`blocked` y, después, mueva manualmente
   la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de las tarjetas. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Tarjeta `todo`/`backlog`/`ready` asignada que no se ha actualizado en más de 1 hora.             |
| `running_without_heartbeat` | Tarjeta `running` sin Heartbeat de reclamación ni actualización de ejecución en más de 20 minutos. |
| `blocked_too_long`          | Tarjeta `blocked` que no se ha actualizado en más de 24 horas.                                   |
| `repeated_failures`         | El recuento de fallos registrados de la tarjeta alcanza 2 o más.                                |
| `missing_proof`             | Tarjeta `done` sin pruebas, artefactos ni archivos adjuntos.                          |
| `orphaned_session`          | Tarjeta `running` con un `sessionKey` pero sin metadatos `execution`.                |

## Permisos

Los métodos RPC del Gateway se encuentran bajo `workboard.*`:

| Ámbito            | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obtener archivos adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/enlazar/enlazarDependencia/prueba/artefacto, añadir/eliminar archivos adjuntos, registro del proceso de trabajo, infracción del protocolo, reclamar/Heartbeat/liberar/promover/reasignar/recuperar/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificación |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de
operador de solo lectura pueden consultar el tablero, pero no modificar tarjetas. Un ámbito de administrador
amplía las rutas de host de Workboard aceptadas; no cambia los métodos disponibles.

## Almacenamiento

Workboard almacena datos duraderos en una base de datos SQLite relacional propiedad del plugin,
dentro del directorio de estado de OpenClaw: los tableros, las tarjetas, las etiquetas, los eventos del ciclo de vida,
los intentos de ejecución, los comentarios, los enlaces de dependencias, las pruebas, las referencias de artefactos,
los metadatos y blobs de archivos adjuntos, los diagnósticos, las notificaciones, los registros de procesos de trabajo,
el estado del protocolo y las suscripciones residen en tablas de Workboard (no en
entradas de clave-valor del plugin). Una exportación de tarjetas conserva la narrativa del tablero
sin incluir en línea el contenido de los blobs de archivos adjuntos.

Las instalaciones que usaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres heredados del estado del plugin incluidos en esa versión
(`workboard.cards`, `workboard.boards`, `workboard.notify` y, si está presente,
`workboard.attachments`) a la base de datos relacional.

## Solución de problemas

**La pestaña indica que Workboard no está disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, añádale `workboard`. Si `plugins.deny`
contiene `workboard`, elimínelo antes de habilitar el plugin.

**Las tarjetas no se guardan**

Confirme que la conexión del navegador tenga acceso `operator.write`. Las sesiones de operador
de solo lectura pueden listar tarjetas, pero no crearlas, editarlas, moverlas ni eliminarlas.

**Al iniciar una tarjeta no se abre la sesión esperada**

Compruebe el id de agente y la sesión enlazada de la tarjeta y, después, abra Sessions o Chat para
consultar el estado real de la ejecución.

**El despacho no inicia un proceso de trabajo**

Confirme que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa de un despacho de solo datos, inicie o reinicie el Gateway y
vuelva a intentarlo: el despacho de solo datos actualiza el estado local del tablero, pero no puede iniciar
ejecuciones de procesos de trabajo de subagentes. También pueden omitirse tarjetas cuando otra tarjeta del
mismo propietario o agente ya está en ejecución o en espera de revisión; complete,
bloquee o libere ese trabajo activo antes de despachar más para el mismo
propietario.

## Relacionado

- [Interfaz de control](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
