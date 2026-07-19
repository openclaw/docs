---
read_when:
    - Quieres un tablero de trabajo estilo Kanban en la interfaz de control
    - Está habilitando o deshabilitando el plugin Workboard incluido
    - Se desea hacer un seguimiento del trabajo planificado del agente sin un gestor de proyectos externo
summary: Panel de trabajo opcional para tarjetas gestionadas por agentes y transferencia de sesiones
title: Plugin de tablero de trabajo
x-i18n:
    generated_at: "2026-07-19T13:38:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38f138584fed2d052ed45798c38a342fd9fe08eddf4fef9f73c52353f4b0ded2
    source_path: plugins/workboard.md
    workflow: 16
---

El Plugin Workboard añade un tablero opcional de estilo Kanban a la
[interfaz de control](/es/web/control-ui): tarjetas de trabajo del tamaño adecuado para agentes, asignación a agentes
y un enlace de vuelta a la tarea, la ejecución y la sesión del panel de la tarjeta.

Workboard es deliberadamente pequeño: realiza el seguimiento del trabajo operativo local de un
Gateway de OpenClaw. No sustituye a GitHub Issues, Linear, Jira ni a
otros sistemas de gestión de proyectos en equipo.

## Habilitarlo

Workboard está incluido, pero deshabilitado de forma predeterminada:

1. Abra **Plugins** en la interfaz de control o use `/settings/plugins` en relación con
   la ruta base configurada de la interfaz de control. Por ejemplo, una ruta base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Busque **Workboard** y seleccione **Habilitar**. Como Workboard está incluido con
   OpenClaw, no necesita una acción **Instalar**.
3. Si la interfaz indica que es necesario reiniciar, reinicie el Gateway.

La pestaña Workboard aparece en la navegación del panel después de que se carga el entorno de ejecución del Plugin.
Mientras está deshabilitada, la pestaña permanece oculta en la navegación. Al abrir directamente la
ruta `/workboard` mientras el Plugin está deshabilitado o bloqueado por
`plugins.allow`/`plugins.deny`, se muestra un estado de Plugin no disponible en lugar de los datos de las
tarjetas.

El flujo de trabajo equivalente de la CLI es:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuración

Workboard no tiene ninguna configuración específica del Plugin. Habilítelo o deshabilítelo con la entrada
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

| Campo       | Valores                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | cadenas de formato libre                                                                                             |
| `agentId`   | agente asignado opcional                                                                                       |
| referencias vinculadas | tarea, ejecución, sesión o URL de origen opcionales                                                                    |
| `execution` | metadatos opcionales de una ejecución de Codex/Claude iniciada desde la tarjeta (motor, modo, modelo, sesión, id. de ejecución, estado) |

Las tarjetas también contienen metadatos compactos sobre intentos, comentarios, enlaces, pruebas,
artefactos, ajustes de automatización, archivos adjuntos, registros de trabajadores, estado del protocolo
del trabajador, reclamaciones, diagnósticos, notificaciones, id. de plantilla, estado de archivado y
detección de sesiones obsoletas, además de una lista de eventos recientes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Estos metadatos permiten que un
operador vea cómo se desplazó una tarjeta por el tablero sin abrir la sesión
vinculada; se trata de contexto operativo local, no de un sustituto de las transcripciones de
sesiones ni del historial de incidencias de GitHub.

El Plugin y la interfaz de control usan un único contrato de tarjeta de Workboard. Por lo tanto, las actualizaciones del
panel conservan la procedencia y la autoridad del espacio de trabajo, el estado de reclamación, las acciones
de diagnóstico y los números de secuencia de las notificaciones, en lugar de proyectar una copia reducida
de la tarjeta solo para la interfaz. Los tipos de diagnóstico, las gravedades de diagnóstico y los
tipos de notificación desconocidos se ignoran hasta que ambas superficies los admitan; nunca se
reescriben como otro estado válido.

El panel abierto se actualiza a partir de las invalidaciones de `plugin.workboard.changed`. Cada
evento contiene únicamente una época y una revisión del almacén; después, la interfaz vuelve a leer las tarjetas
canónicas mediante el RPC `operator.read` normal. Varias revisiones se agrupan en
una única lectura posterior. Workboard aplaza esa lectura mientras se arrastra,
edita o escribe una tarjeta y la reanuda cuando finaliza la interacción local. Una
reconexión siempre realiza una recarga canónica. No hay un sondeo completo rutinario de las
tarjetas, y **Actualizar** sigue disponible como recuperación manual.

Cuando existe más de un tablero, la barra de herramientas incluye un filtro **Tablero** respaldado
por metadatos persistentes de los tableros, y no solo por las tarjetas visibles actualmente. Por lo tanto, los tableros vacíos
y archivados permanecen seleccionables. Las tarjetas sin un id. de tablero explícito
pertenecen al tablero canónico `default`. El tablero seleccionado se almacena
en el parámetro de consulta `?board=`, por lo que la URL filtrada de Workboard se puede guardar
en marcadores o compartir; al seleccionar **Todos los tableros**, se elimina el parámetro.

Las tarjetas se almacenan en el estado del Gateway propio del Plugin y se trasladan junto con el resto del
estado de OpenClaw de ese Gateway (consulte [Almacenamiento](#storage)).

## Iniciar trabajo desde una tarjeta

Las tarjetas no vinculadas pueden iniciar trabajo directamente:

- **Ejecutar Codex** / **Ejecutar Claude** inicia una ejecución de agente con seguimiento de tareas y un
  motor explícito, envía la instrucción de la tarjeta y marca la tarjeta como `running`. Las ejecuciones de Codex
  usan `openai/gpt-5.6-sol`; las ejecuciones de Claude usan `anthropic/claude-sonnet-4-6`.
- **Abrir Codex** / **Abrir Claude** crea una sesión vinculada del panel sin
  enviar la instrucción de la tarjeta ni moverla, para el trabajo manual que permanece
  asociado al tablero.

Los inicios autónomos usan la ruta de ejecución de agentes con seguimiento de tareas del Gateway (el agente
y el modelo predeterminados, a menos que se elija Codex/Claude explícitamente); después, Workboard vincula
la tarea resultante, el id. de ejecución y la clave de sesión a la tarjeta. Cada
ejecución vinculada también registra un resumen del intento (motor, modo, modelo, id. de ejecución,
marcas de tiempo, estado y recuento acumulado de fallos) para que los fallos repetidos sigan siendo visibles.

El panel actualiza el estado de las tareas desde el registro de tareas del Gateway y relaciona
las tareas con las tarjetas mediante el id. de tarea, el id. de ejecución o la clave de sesión vinculada. Una tarea en cola o en ejecución
mantiene activo el ciclo de vida de la tarjeta; una tarea finalizada, fallida, agotada por tiempo de espera o
cancelada desplaza la tarjeta hacia `review` o `blocked` mediante la misma regla de
sincronización que las sesiones vinculadas (consulte [Sincronización del ciclo de vida de las sesiones](#session-lifecycle-sync)).

## Herramientas de agentes

| Herramienta                                                                                                                                             | Propósito                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Enumera tarjetas compactas con el estado de reclamación/diagnóstico; filtro opcional por tablero.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Devuelve una tarjeta junto con contexto acotado del trabajador (notas, intentos, comentarios, enlaces, pruebas, artefactos, resultados principales, trabajo reciente del asignado, diagnósticos activos).                               |
| `workboard_create`                                                                                                                               | Crea una tarjeta con elementos principales, inquilino, Skills, tablero, metadatos del espacio de trabajo, clave de idempotencia, límite de ejecución y presupuesto de reintentos opcionales.                                                             |
| `workboard_link`                                                                                                                                 | Vincula un elemento principal con una tarjeta secundaria. Las tarjetas secundarias permanecen en `todo` hasta que todos los elementos principales alcanzan `done`; después, la promoción de despacho las mueve a `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Reclama una tarjeta para el agente que realiza la llamada; mueve `backlog`/`todo`/`ready` a `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Actualiza el Heartbeat de la reclamación durante una ejecución más larga.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Libera la reclamación tras completarla, pausarla o transferirla; puede mover la tarjeta a un estado siguiente.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Herramientas estructuradas del ciclo de vida para resúmenes finales, pruebas, artefactos y manifiestos de tarjetas creadas (deben hacer referencia a tarjetas vinculadas con la tarjeta completada) o motivos de bloqueo.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Almacena pequeños archivos adjuntos de tarjetas en el estado SQLite del Plugin, los indexa en la tarjeta y los expone en el contexto del trabajador.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra líneas del diario del trabajador y bloquea una tarjeta cuando un trabajador automatizado se detiene sin llamar a `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestiona los metadatos persistentes del tablero (nombre para mostrar, descripción, estado de archivado, espacio de trabajo predeterminado).                                                                                            |
| `workboard_runs`                                                                                                                                 | Devuelve el historial persistente de intentos de ejecución de una tarjeta.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Convierte una tarjeta preliminar de clasificación/trabajo pendiente en una tarjeta `todo` aclarada; registra el resumen de la especificación en la tarjeta.                                                                                      |
| `workboard_decompose`                                                                                                                            | Divide una tarjeta principal de orquestación en tarjetas secundarias vinculadas que heredan los metadatos del tablero/inquilino; puede completar la principal con un manifiesto de tarjetas creadas.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestiona las suscripciones a notificaciones. Las lecturas de eventos se pueden repetir de forma segura; `advance` mueve el cursor persistente para que quienes realizan llamadas reanuden sin perder ni leer dos veces los eventos de tarjetas completadas, fallidas u obsoletas. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecciona los espacios de nombres del tablero y las estadísticas de la cola.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera o transfiere trabajo atascado.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Añade notas de transferencia o adjunta referencias de pruebas/artefactos.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Devuelve el trabajo bloqueado a `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Mueve una tarjeta a otro estado; las tarjetas reclamadas requieren el ámbito de reclamación del agente que realiza la llamada.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Fuerza la promoción de dependencias o la limpieza de reclamaciones obsoletas sin iniciar trabajadores; el inicio de trabajadores utiliza el despacho del Gateway o mediante comandos con barra.                                                        |

Los estados de las pruebas son resultados notificados por los trabajadores, no una verificación independiente. Una entrada `passed`
significa que el trabajador informa que su comando o comprobación se ha ejecutado correctamente; los consumidores que necesiten
una puerta de calidad independiente deben inspeccionar el comando, la URL o el artefacto adjunto y
ejecutar su propio verificador. `workboard_proof` devuelve el `proofId` del nuevo registro. Cuando
`workboard_complete` notifique el estado terminal de esa misma prueba, se debe pasar `proofId` para que el
registro pendiente se resuelva en el mismo lugar sin perder su identidad ni su marca de tiempo. Una prueba que
ya tenga el mismo estado terminal se reutiliza sin cambios. La prueba de finalización sin
`proofId` conserva el comportamiento de solo adición, por lo que un reintento posterior no puede reescribir el historial anterior solo porque
su comando o nota sean idénticos.

Las tarjetas reclamadas rechazan las mutaciones mediante herramientas de agente realizadas por otros agentes, a menos que quien realiza la llamada
posea el token de reclamación devuelto por `workboard_claim`. Cada tarjeta devuelta por una
herramienta de agente o llamada RPC del Gateway oculta `metadata.claim.token` como `[redacted]`
(el propio token se devuelve una sola vez, en el nivel superior y únicamente desde `workboard_claim`),
de modo que los operadores del panel y otros agentes puedan inspeccionar el estado de la reclamación sin
ver nunca un token utilizable. La recuperación se realiza mediante
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que no
requieren el token.

## Despacho

El despacho es local al Gateway: no inicia procesos arbitrarios del sistema operativo. Las sesiones normales
de subagentes de OpenClaw siguen siendo responsables de la ejecución. Una pasada de despacho:

1. Promueve las tarjetas cuyas dependencias están listas.
2. Registra los metadatos de despacho en las tarjetas listas.
3. Bloquea las reclamaciones caducadas o las ejecuciones que han agotado el tiempo.
4. Marca las tarjetas de clasificación configuradas en el tablero como candidatas de orquestación.
5. Reclama un pequeño lote de tarjetas listas e inicia ejecuciones de trabajadores mediante el
   entorno de ejecución de subagentes del Gateway.

Los trabajadores reciben contexto acotado de la tarjeta junto con el token de reclamación necesario para enviar el Heartbeat,
completar o bloquear la tarjeta mediante las herramientas de Workboard.

Las rutas del espacio de trabajo respetan la autoridad existente del sistema de archivos de quien realiza la llamada. Los clientes del Gateway
con `operator.write` pueden utilizar los espacios de trabajo de agente configurados;
los clientes `operator.admin` pueden utilizar otros repositorios locales del host. Las herramientas de agente en entornos aislados utilizan
el acceso al espacio de trabajo de su entorno aislado, mientras que las herramientas no aisladas y limitadas al espacio de trabajo utilizan la
raíz configurada de su espacio de trabajo. Workboard registra esa autoridad cuando se asigna un espacio de trabajo
y vuelve a calcular su intersección con la autoridad actual de quien realiza la llamada durante el despacho,
por lo que una tarjeta persistente no puede ampliar el acceso de una llamada posterior. Las tarjetas antiguas con un
espacio de trabajo explícito en el host, pero sin una autoridad registrada, deben volver a guardar ese espacio de trabajo
antes de un despacho con acceso completo al host; las tarjetas sin una ruta del host adoptan la
autoridad actual de quien realiza la llamada cuando se despachan por primera vez.

El despacho vinculado a un espacio de trabajo solo acepta un directorio o repositorio Git cuando la
raíz de su repositorio coincide exactamente con el espacio de trabajo del agente de destino. Una solicitud de árbol de trabajo
se restringe a ese directorio y se conserva como espacio de trabajo de directorio, por lo que el
host no materializa el repositorio ni ejecuta código de configuración de este. El
trabajador de destino debe utilizar un entorno aislado Docker con permisos de escritura y no compartido para ese
espacio de trabajo exacto, sin ejecución con privilegios elevados, anulaciones persistentes de ejecución en el host/Node ni
herramientas de Plugin y MCP sin clasificar. Workboard enumera sus herramientas registradas
en lugar de confiar en un prefijo `workboard_*`, y el despacho rechaza un contenedor Docker
activo cuyo hash de montaje/configuración en ejecución esté obsoleto. El despacho informa de la
política de destino incompatible en lugar de iniciar un trabajador con menos restricciones.
El despacho con acceso completo al host puede dirigirse a otros repositorios locales y conserva la configuración normal
del árbol de trabajo gestionado.

La autoridad del espacio de trabajo no crea un segundo modelo de permisos para el ciclo de vida de las tarjetas.
Quienes pueden modificar tarjetas de Workboard pueden moverlas manualmente por los mismos
estados en todas las superficies; el acceso de solo lectura al espacio de trabajo únicamente impide el
despacho de trabajadores que requiere permisos de escritura.

### Selección de trabajadores

Cada pasada inicia **como máximo 3 trabajadores de forma predeterminada**. Las tarjetas listas se ordenan por
prioridad, luego por posición y después por hora de creación. Una pasada inicia solo una tarjeta por
propietario/agente y omite a los propietarios que ya tienen trabajo en ejecución o en revisión en el
tablero. Las tarjetas archivadas, las tarjetas con una reclamación activa y las tarjetas que no están en estado `ready`
nunca se seleccionan para iniciar trabajadores (aun así, pueden verse afectadas por el
lado de datos de la distribución: limpieza de reclamaciones obsoletas, promoción de dependencias y limpieza
por tiempo de espera).

Las claves de sesión son deterministas por tablero/tarjeta, por lo que las distribuciones repetidas se enrutan
de vuelta al mismo carril de trabajo en lugar de crear sesiones no relacionadas:

- Tarjetas asignadas: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Tarjetas sin asignar: `subagent:workboard-<boardId>-<cardId>` (el Gateway resuelve
  el agente predeterminado configurado)

Si no se puede iniciar un trabajador después de reclamar una tarjeta, Workboard bloquea la
tarjeta, borra la reclamación, registra el fallo de inicio de la ejecución y añade una línea al
registro del trabajador, visible en el panel, el JSON de la CLI, las herramientas del agente y los
diagnósticos de la tarjeta.

### Puntos de entrada

- Acción de distribución del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal con capacidad para ejecutar comandos

Los tres utilizan el entorno de ejecución de subagentes del Gateway cuando este está disponible. La
CLI tiene una alternativa para operadores: si la llamada al Gateway falla con un
error de conexión/no disponible (o un error `unknown method` en Gateways
anteriores), no se aplica ningún destino explícito `--url`/`--token` ni ningún Gateway remoto
configurado (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI ejecuta una
distribución solo de datos en el estado SQLite local: puede promover dependencias,
limpiar reclamaciones obsoletas y bloquear ejecuciones que superaron el tiempo de espera, pero no puede iniciar trabajadores. Los fallos de autenticación,
permisos y validación de un Gateway accesible no se tratan
como falta de disponibilidad; se muestran como errores de comando, al igual que cualquier fallo del Gateway
cuando se ha proporcionado un destino explícito `--url`/`--token`.

Los metadatos del tablero pueden establecer `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` y `orchestratorProfile`. OpenClaw registra esta intención y
la expone en el contexto del trabajador; la especificación/descomposición real sigue ejecutándose
mediante las herramientas normales de Workboard.

## CLI y comando de barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La salida de texto de `list` oculta las tarjetas archivadas de forma predeterminada (`--include-archived`
lo anula); `--json` siempre incluye las tarjetas archivadas, de acuerdo con el contrato de tarjetas completas
utilizado por los scripts existentes. `show` y `move` aceptan un prefijo de identificador
inequívoco. `list`, `create`, `show` y `move` siempre leen/escriben directamente
el estado local del plugin. Solo `dispatch` llama al Gateway en ejecución, con la alternativa
descrita anteriormente.

Consulte [CLI de Workboard](/es/cli/workboard) para conocer todas las opciones, la salida JSON, el comportamiento alternativo
del Gateway, el tratamiento de prefijos de identificador, las reglas de selección de distribución y la
solución de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` y `/workboard dispatch` reflejan
la CLI. Listar y mostrar son operaciones de lectura para cualquier remitente de comandos autorizado.
Crear, mover y distribuir requieren el estado de propietario en las superficies de chat, o un cliente
del Gateway con `operator.write`/`operator.admin`. Los movimientos manuales del operador utilizan el
mismo comportamiento de anulación de reclamaciones que la función de arrastrar y soltar del panel. Su acceso al árbol de trabajo
sigue estando sujeto al mismo límite del espacio de trabajo descrito anteriormente.

## Sincronización del ciclo de vida de las sesiones

Las tarjetas pueden vincularse a una sesión existente del panel o a una creada al
iniciar el trabajo desde la tarjeta. Las tarjetas vinculadas muestran el ciclo de vida de la sesión en línea:
en ejecución, obsoleta, vinculada e inactiva, completada, fallida o ausente. También se puede capturar una
sesión existente desde la pestaña Sesiones mediante **Añadir a Workboard**; la tarjeta
se vincula a esa sesión, utiliza la etiqueta de la sesión o la solicitud reciente del usuario como título
y rellena inicialmente las notas con la solicitud reciente del usuario más la respuesta más reciente del asistente,
cuando están disponibles.

Si la sesión vinculada deja de estar disponible, la tarjeta permanece vinculada para conservar el contexto y
sigue ofreciendo controles de inicio para reiniciar en una sesión nueva. Si una
sesión vinculada activa deja de informar actividad reciente, Workboard marca la tarjeta
como `stale` y lo almacena como metadatos hasta que el ciclo de vida lo elimina.

Mientras una tarjeta se encuentra en un estado de trabajo activo, Workboard sigue la sesión vinculada:

| Estado de la sesión vinculada         | Estado de la tarjeta |
| ------------------------------------- | -------------------- |
| activa                                | `running`   |
| completada                            | `review`    |
| fallida, terminada, con tiempo de espera agotado o cancelada | `blocked`   |

**Los estados de revisión manual tienen prioridad.** Mover una tarjeta a `review`, `blocked` o `done`
detiene la sincronización automática de esa tarjeta hasta que se vuelva a mover a `todo` o `running`.

Al iniciar una tarjeta se utilizan sesiones normales del Gateway; Workboard solo almacena los
metadatos y vínculos de la tarjeta. La transcripción de la conversación, la selección del modelo y el ciclo de vida
de la ejecución siguen siendo responsabilidad del sistema de sesiones habitual. Use **Detener** en una tarjeta
vinculada activa para cancelar la ejecución activa; Workboard marca esa tarjeta como `blocked` para que
permanezca visible para su seguimiento.

Las tarjetas nuevas pueden partir de plantillas de Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Las plantillas rellenan previamente el título, las notas, las etiquetas y la prioridad;
el identificador de la plantilla se almacena como metadatos de la tarjeta.

## Flujo de trabajo del panel

1. Abra la pestaña Workboard en la interfaz de control.
2. Cree una tarjeta con título, notas, prioridad, etiquetas, un agente opcional y
   una sesión vinculada opcional; o abra Sesiones y seleccione **Añadir a Workboard**
   para una sesión existente.
3. Arrastre la tarjeta entre columnas, o enfoque su control compacto de estado y utilice
   el menú o ArrowLeft/ArrowRight. Durante el arrastre, la tarjeta de origen se atenúa y
   las columnas de destino disponibles muestran un contorno.
4. Inicie el trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
5. Abra la sesión vinculada desde la tarjeta mientras trabaja el agente.
6. Permita que la sincronización del ciclo de vida mueva el trabajo en ejecución a `review`/`blocked` y, después,
   mueva manualmente la tarjeta a `done` cuando se acepte.

## Diagnósticos

Los diagnósticos se calculan a partir de los metadatos locales de las tarjetas. Las comprobaciones integradas señalan:

| Tipo                        | Condición                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Tarjeta asignada `todo`/`backlog`/`ready` sin actualizar durante más de 1 hora.             |
| `running_without_heartbeat` | Tarjeta `running` sin Heartbeat de reclamación ni actualización de ejecución durante más de 20 minutos. |
| `blocked_too_long`          | Tarjeta `blocked` sin actualizar durante más de 24 horas.                                   |
| `repeated_failures`         | El recuento de fallos registrados de la tarjeta alcanza 2 o más.                                |
| `missing_proof`             | Tarjeta `done` sin pruebas, artefactos ni archivos adjuntos.                          |
| `orphaned_session`          | Tarjeta `running` con un `sessionKey`, pero sin metadatos `execution`.                |

## Permisos

Los métodos RPC del Gateway se encuentran bajo `workboard.*`:

| Ámbito            | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obtener archivos adjuntos, lecturas de eventos de notificación, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, crear/actualizar/mover/eliminar/comentar/vincular/vincularDependencia/prueba/artefacto, añadir/eliminar archivos adjuntos, registro del trabajador, infracción del protocolo, reclamar/Heartbeat/liberar/promover/reasignar/recuperar/completar/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, archivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, suscribirse/eliminar/avanzar notificaciones |

Ningún método RPC requiere `operator.admin`. Los navegadores conectados con acceso de operador
de solo lectura pueden inspeccionar el tablero, pero no modificar las tarjetas. Un ámbito de administrador
amplía las rutas de host de Workboard aceptadas; no cambia los métodos disponibles.

## Almacenamiento

Workboard almacena los datos duraderos en una base de datos SQLite relacional propiedad del plugin
dentro del directorio de estado de OpenClaw: tableros, tarjetas, etiquetas, eventos del ciclo de vida,
intentos de ejecución, comentarios, vínculos de dependencias, pruebas, referencias a artefactos,
metadatos y blobs de archivos adjuntos, diagnósticos, notificaciones, registros de trabajadores,
estado del protocolo y suscripciones se almacenan en tablas de Workboard (no en
entradas de clave-valor del plugin). La exportación de una tarjeta conserva la narrativa del tablero
sin insertar en línea el contenido de los blobs de archivos adjuntos.

Las instalaciones que utilizaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres heredados del estado del plugin incluidos en esa versión
(`workboard.cards`, `workboard.boards`, `workboard.notify` y, si está presente,
`workboard.attachments`) a la base de datos relacional.

## Solución de problemas

**La pestaña indica que Workboard no está disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, añada `workboard`. Si `plugins.deny`
contiene `workboard`, elimínelo antes de habilitar el plugin.

**Las tarjetas no se guardan**

Confirme que la conexión del navegador tenga acceso `operator.write`. Las sesiones de operador
de solo lectura pueden listar tarjetas, pero no crearlas, editarlas, moverlas ni eliminarlas.

**Al iniciar una tarjeta no se abre la sesión esperada**

Compruebe el identificador de agente y la sesión vinculada de la tarjeta; después, abra Sesiones o Chat para
inspeccionar el estado real de la ejecución.

**La distribución no inicia un trabajador**

Confirme que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa de una distribución solo de datos, inicie o reinicie el Gateway y
vuelva a intentarlo: la distribución solo de datos actualiza el estado local del tablero, pero no puede iniciar
ejecuciones de trabajadores subagentes. También se pueden omitir tarjetas cuando otra tarjeta del
mismo propietario o agente ya está en ejecución o esperando revisión; complete,
bloquee o libere ese trabajo activo antes de distribuir más trabajo para el mismo
propietario.

## Contenido relacionado

- [Interfaz de control](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Administrar plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
