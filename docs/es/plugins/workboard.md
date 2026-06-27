---
read_when:
    - Quieres un tablero de trabajo de estilo Kanban en la interfaz de control
    - Estás activando o desactivando el plugin Workboard incluido
    - Quieres dar seguimiento al trabajo planificado del agente sin un gestor de proyectos externo
summary: Tablero de trabajo opcional del panel para tarjetas propiedad de agentes y traspaso de sesión
title: Plugin Workboard
x-i18n:
    generated_at: "2026-06-27T12:33:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

El Plugin Workboard agrega un tablero opcional de estilo Kanban a la
[IU de control](/es/web/control-ui). Úsalo para recopilar tarjetas de trabajo del tamaño de un agente, asignarlas
a agentes y hacer seguimiento de la tarea en segundo plano, la ejecución y la sesión del panel
vinculadas desde una sola tarjeta.

Workboard es intencionalmente pequeño. Hace seguimiento del trabajo operativo local para un
Gateway de OpenClaw; no es un reemplazo de GitHub Issues, Linear, Jira ni
otros sistemas de gestión de proyectos de equipo.

## Estado predeterminado

Workboard es un Plugin incluido y está deshabilitado de forma predeterminada salvo que lo habilites
en la configuración de plugins.

Habilítalo con:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Luego abre el panel:

```bash
openclaw dashboard
```

La pestaña Workboard aparece en la navegación del panel. Si la pestaña está visible
pero el Plugin está deshabilitado o bloqueado por `plugins.allow` / `plugins.deny`, la
vista muestra un estado de Plugin no disponible en lugar de datos de tarjetas locales.

## Qué contienen las tarjetas

Cada tarjeta almacena:

- título y notas
- estado: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` o `done`
- prioridad: `low`, `normal`, `high` o `urgent`
- etiquetas
- id de agente opcional
- tarea, ejecución, sesión o URL de origen vinculada opcional
- metadatos de ejecución opcionales para una ejecución de Codex o Claude iniciada desde la tarjeta
- metadatos compactos para intentos, comentarios, enlaces, pruebas, artefactos, automatización,
  adjuntos, registros de trabajador, estado de protocolo de trabajador, reclamaciones, diagnósticos,
  notificaciones, plantillas, estado de archivo y detección de sesiones obsoletas
- eventos recientes de tarjeta, como cambios creados, movidos, vinculados, reclamados, Heartbeat,
  intento, prueba, artefacto, diagnóstico, notificación, despacho, archivo, obsoleto
  o actualizados por agente

Las tarjetas se almacenan en el estado de Gateway del Plugin. Son locales al directorio
de estado del Gateway y se mueven con el resto del estado de OpenClaw de ese Gateway.

Workboard conserva metadatos compactos por tarjeta para que los operadores puedan ver cómo una tarjeta se movió
por el tablero sin abrir la sesión vinculada. Eventos, resúmenes de intentos,
fragmentos de prueba, enlaces relacionados, comentarios, marcadores de archivo y marcadores de sesiones obsoletas
son metadatos locales intencionalmente; no reemplazan las transcripciones de sesión
ni el historial de incidencias de GitHub.

## Ejecuciones y tareas de tarjetas

Las tarjetas no vinculadas pueden iniciar trabajo desde la tarjeta. Los inicios autónomos usan la
ruta de ejecución de agente con seguimiento de tareas del Gateway; luego Workboard vincula la tarea resultante,
el id de ejecución y la clave de sesión de vuelta a la tarjeta. El inicio usa el agente y el modelo
predeterminados configurados del Gateway. Las acciones de Codex y Claude son opciones explícitas opcionales
de modelo:

- Ejecutar Codex o Ejecutar Claude inicia una ejecución de agente respaldada por tarea, envía el prompt de la tarjeta
  y marca la tarjeta como `running`.
- Abrir Codex o Abrir Claude crea una sesión de panel vinculada sin enviar
  el prompt de la tarjeta ni mover la tarjeta, para que puedas trabajar manualmente mientras permanece
  adjunta al tablero.

Los metadatos de ejecución almacenan el motor, el modo, la referencia de modelo, la clave de sesión,
el id de ejecución, el id de tarea cuando está disponible y el estado del ciclo de vida seleccionados en la tarjeta. Las ejecuciones de Codex
usan `openai/gpt-5.5`; las ejecuciones de Claude usan
`anthropic/claude-sonnet-4-6`.

Cada ejecución vinculada también registra un resumen de intento en el mismo registro de tarjeta.
El resumen de intento conserva el motor, el modo, el modelo, el id de ejecución, las marcas de tiempo, el estado
y el recuento acumulado de fallos para que los fallos repetidos sigan visibles en el tablero.

El panel actualiza el estado de las tareas desde el libro mayor de tareas del Gateway y empareja
las tareas con las tarjetas por id de tarea, id de ejecución o clave de sesión vinculada. Si una tarea está
en cola o en ejecución, el ciclo de vida de la tarjeta muestra el estado activo de la tarea. Si la tarea
termina, falla, agota el tiempo de espera o se cancela, el ciclo de vida de la tarjeta avanza hacia
el estado de revisión o bloqueado usando la misma sincronización de ciclo de vida que las sesiones vinculadas.

## Coordinación de agentes

Workboard también expone herramientas de agente opcionales para flujos de trabajo conscientes del tablero:

- `workboard_list` enumera tarjetas compactas con estado de reclamación y diagnóstico, con un
  filtro de tablero opcional.
- `workboard_read` devuelve una tarjeta más contexto de trabajador limitado creado a partir de notas,
  intentos, comentarios, enlaces, pruebas, artefactos, resultados principales, trabajo reciente del asignado
  y diagnósticos activos.
- `workboard_create` crea una tarjeta con padres opcionales, tenant, skills,
  tablero, metadatos de espacio de trabajo, clave de idempotencia, límite de tiempo de ejecución y presupuesto de reintentos.
- `workboard_link` vincula una tarjeta principal a una tarjeta secundaria. Las secundarias permanecen en `todo`
  hasta que todos los padres alcanzan `done`; entonces la promoción de despacho las mueve a
  `ready`.
- `workboard_claim` reclama una tarjeta para el agente llamante y mueve tarjetas de backlog, todo
  o ready a `running`.
- `workboard_heartbeat` actualiza el Heartbeat de la reclamación durante ejecuciones más largas.
- `workboard_release` libera la reclamación tras completarse, pausarse o transferirse, y
  puede mover la tarjeta a un estado siguiente.
- `workboard_complete` y `workboard_block` son herramientas estructuradas de ciclo de vida para
  resúmenes finales, pruebas, artefactos, manifiestos de tarjetas creadas y motivos de bloqueo.
  Los manifiestos de tarjetas creadas deben referenciar tarjetas vinculadas de vuelta a la
  tarjeta completada, lo que mantiene a las tarjetas secundarias fantasma fuera de los resúmenes.
- `workboard_attachment_add`, `workboard_attachment_read` y
  `workboard_attachment_delete` almacenan pequeños adjuntos de tarjeta en el estado SQLite del Plugin,
  los indexan en la tarjeta y los exponen en el contexto del trabajador.
- `workboard_worker_log` y `workboard_protocol_violation` registran líneas de registro de trabajador
  y bloquean tarjetas cuando un trabajador automatizado se detiene sin llamar a
  `workboard_complete` o `workboard_block`.
- `workboard_board_create`, `workboard_board_archive` y
  `workboard_board_delete` gestionan metadatos de tablero persistidos, como nombre para mostrar,
  descripción, estado de archivo y espacio de trabajo predeterminado.
- `workboard_runs` devuelve el historial persistido de intentos de ejecución almacenado en una tarjeta.
- `workboard_specify` convierte una tarjeta aproximada de triage o backlog en una tarjeta `todo`
  aclarada y registra el resumen de especificación en la tarjeta.
- `workboard_decompose` despliega una tarjeta principal de orquestación en secundarias vinculadas,
  hereda metadatos de tablero y tenant, y puede completar la principal con un
  manifiesto de tarjetas creadas.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` y
  `workboard_notify_unsubscribe` gestionan suscripciones de notificación en el estado del Plugin.
  Las lecturas de eventos son seguras para reproducción; la herramienta de avance mueve el cursor durable
  para que los llamantes puedan reanudar sin perder ni leer dos veces eventos de tarjetas completadas, fallidas u
  obsoletas.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` y `workboard_dispatch` permiten que un agente
  inspeccione espacios de nombres de tableros, vea estadísticas de colas, recupere trabajo atascado, agregue notas de transferencia,
  adjunte referencias de prueba o artefacto, mueva trabajo bloqueado de vuelta a `todo`
  y empuje la promoción de dependencias o la limpieza de reclamaciones obsoletas.

Las tarjetas reclamadas rechazan mutaciones de herramientas de agente de otros agentes salvo que el llamante
tenga el token de reclamación devuelto por `workboard_claim`. Los operadores del panel siguen usando
la superficie RPC normal del Gateway y pueden recuperar o reasignar tarjetas.

Workboard almacena datos duraderos de tablero en una base de datos relacional SQLite propiedad del Plugin
bajo el directorio de estado de OpenClaw. Tableros, tarjetas, etiquetas, eventos de ciclo de vida,
intentos de ejecución, comentarios, enlaces de dependencia, pruebas, referencias de artefactos,
metadatos y blobs de adjuntos, diagnósticos, notificaciones, registros de trabajador,
estado de protocolo y suscripciones persisten en tablas de Workboard en lugar de
entradas clave-valor del Plugin. Una exportación de tarjeta sigue preservando la narrativa del tablero
sin incrustar el contenido de blobs de adjuntos.

Las instalaciones que usaron Workboard en la versión `.28` pueden ejecutar
`openclaw doctor --fix` para migrar los espacios de nombres de estado de Plugin heredados enviados
(`workboard.cards`, `workboard.boards` y `workboard.notify`) a la
base de datos relacional. Si hay un espacio de nombres heredado `workboard.attachments`, presente,
doctor también migra esos blobs de adjuntos.

Los diagnósticos de Workboard se calculan a partir de metadatos de tarjetas locales. Las comprobaciones integradas
marcan tarjetas asignadas que esperan demasiado, tarjetas en ejecución sin Heartbeat reciente,
tarjetas bloqueadas que necesitan atención, fallos repetidos, tarjetas terminadas sin prueba
y tarjetas en ejecución que solo tienen un enlace de sesión laxo.

El despacho es intencionalmente local al Gateway. No genera procesos arbitrarios del sistema
operativo; las sesiones normales de subagente de OpenClaw siguen siendo dueñas de la ejecución. La
acción de despacho promueve tarjetas listas por dependencias, registra metadatos de despacho en
tarjetas listas, bloquea reclamaciones expiradas o ejecuciones con tiempo agotado, marca tarjetas de triage configuradas por el tablero
como candidatas de orquestación, luego reclama un pequeño lote de tarjetas listas
e inicia ejecuciones de trabajadores a través del runtime de subagentes del Gateway. Las tarjetas asignadas
usan claves de sesión de trabajador `agent:<id>:subagent:workboard-*`; las tarjetas no asignadas
usan claves sin ámbito `subagent:workboard-*` para que el Gateway siga resolviendo el
agente predeterminado configurado. Los trabajadores reciben contexto de tarjeta limitado más el token de reclamación
que necesitan para enviar Heartbeat, completar o bloquear la tarjeta a través de las herramientas de Workboard.

### Selección de trabajadores de despacho

Cada pasada de despacho inicia como máximo tres trabajadores de forma predeterminada. Las tarjetas listas se
ordenan por prioridad, posición y hora de creación, y luego se filtran para evitar
propiedad activa duplicada. Un despacho inicia solo una tarjeta para un propietario o
agente determinado en la misma pasada, y omite propietarios que ya tienen trabajo en ejecución o en revisión
en el tablero.

Las tarjetas archivadas, las tarjetas con reclamaciones activas y las tarjetas sin estado `ready` no se
seleccionan para inicios de trabajadores. Aun así, pueden verse afectadas por el lado de datos del
despacho cuando se aplican reclamaciones obsoletas, promoción de dependencias o limpieza de tiempos de espera.

### Prompt y ciclo de vida del trabajador

El prompt del trabajador incluye el título de la tarjeta, notas y contexto limitados, el
tablero asignado y el protocolo de trabajador de Workboard. También incluye el propietario de la reclamación
y el token de reclamación para que el trabajador pueda llamar a `workboard_heartbeat`,
`workboard_complete` o `workboard_block` sin que otro actor tome el control de la
tarjeta.

Cuando un trabajador se inicia correctamente, Workboard almacena la clave de sesión, el id de ejecución,
el motor, el modo, la etiqueta de modelo, el estado y el registro de trabajador en la tarjeta. La clave de sesión
es determinista para el tablero y la tarjeta, lo que hace que los despachos repetidos se enruten
de vuelta al mismo carril de trabajador en lugar de crear sesiones no relacionadas.

Si un trabajador no puede iniciarse después de reclamar una tarjeta, Workboard bloquea la
tarjeta, borra la reclamación, registra el fallo de inicio de ejecución y agrega una línea de registro de trabajador.
Ese fallo es visible en el panel, JSON de CLI, herramientas de agente y diagnósticos de tarjeta.

### Puntos de entrada de despacho

Los inicios de trabajadores de tarjetas listas pueden ocurrir desde:

- la acción de despacho del panel
- `openclaw workboard dispatch`
- `/workboard dispatch` en un canal compatible con comandos

Los tres puntos de entrada usan el runtime de subagentes del Gateway cuando el Gateway está
disponible. La CLI tiene un respaldo adicional para operadores: si el Gateway está sin conexión o
no expone el método de despacho de Workboard y no se proporcionó ningún destino explícito `--url` o
`--token`, ejecuta despacho solo de datos contra el estado SQLite local.
Ese respaldo puede promover dependencias, limpiar reclamaciones obsoletas y bloquear
ejecuciones con tiempo agotado, pero no puede iniciar trabajadores.

Los metadatos del tablero pueden incluir ajustes de orquestación como `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee` y `orchestratorProfile`.
OpenClaw registra la intención de orquestación y la expone en el contexto de trabajador; la
especificación y descomposición reales siguen ocurriendo a través de las herramientas normales de
Workboard.

## CLI y comando slash

El Plugin registra un comando CLI raíz:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` llama al Gateway en ejecución para que los inicios de workers usen el
mismo runtime de subagente que el panel. Si el Gateway no está disponible, recurre
a un dispatch solo de datos para que la promoción de dependencias, la limpieza de claims obsoletos y el
bloqueo por timeout puedan seguir ejecutándose. Los fallos de autenticación, permisos y validación siguen
apareciendo como errores de comando, al igual que los fallos para destinos explícitos `--url` o `--token`.

El comando slash `/workboard` admite la misma ruta compacta de operador:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` y
`/workboard dispatch`. List y show son operaciones de lectura para remitentes de comandos
autorizados. Create y dispatch requieren estado de propietario en superficies de chat o un cliente de Gateway
con `operator.write` u `operator.admin`.

Consulta [CLI de Workboard](/es/cli/workboard) para las flags de comando, salida JSON, comportamiento de
fallback del Gateway, manejo inequívoco de prefijos de id, reglas de selección de dispatch y
solución de problemas.

## Sincronización del ciclo de vida de la sesión

Las tarjetas pueden vincularse a sesiones existentes del panel o a la sesión creada
cuando inicias trabajo desde una tarjeta. Las tarjetas vinculadas muestran el ciclo de vida de la sesión en línea:
en ejecución, obsoleta, vinculada inactiva, finalizada, fallida o ausente.

Si falta la sesión vinculada, la tarjeta permanece vinculada para contexto y sigue
ofreciendo controles de inicio para que puedas reiniciar el trabajo en una sesión nueva del panel.
Si una sesión vinculada activa deja de informar actividad reciente, Workboard marca la
tarjeta como obsoleta y almacena el marcador como metadatos de la tarjeta hasta que el ciclo de vida lo borre.

También puedes capturar una sesión existente del panel desde la pestaña Sessions con
Add to Workboard. La tarjeta se vincula a esa sesión, usa la etiqueta de sesión o el
prompt reciente del usuario como título, y rellena notas a partir del prompt reciente del usuario más
la última respuesta del asistente cuando el historial de chat está disponible.

Workboard sigue la sesión vinculada mientras la tarjeta aún está en un estado de trabajo
activo:

- sesión vinculada activa -> `running`
- sesión vinculada completada -> `review`
- sesión vinculada fallida, detenida, agotada por timeout o abortada -> `blocked`

Los estados de revisión manual prevalecen. Si mueves una tarjeta a `review`, `blocked` o `done`,
Workboard deja de mover automáticamente esa tarjeta hasta que la devuelvas a `todo` o
`running`.

## Flujo de trabajo del panel

1. Abre la pestaña Workboard en la Control UI.
2. Crea una tarjeta con título, notas, prioridad, etiquetas, agente opcional y
   sesión vinculada opcional.
3. O abre Sessions y elige Add to Workboard para una sesión existente.
4. Arrastra la tarjeta entre columnas o enfoca el control de estado compacto en la tarjeta
   y usa su menú o ArrowLeft/ArrowRight.
5. Inicia trabajo desde la tarjeta para crear o reutilizar una sesión del panel.
6. Abre la sesión vinculada desde la tarjeta mientras el agente trabaja.
7. Deja que la sincronización del ciclo de vida mueva el trabajo en ejecución a revisión o bloqueado, luego mueve manualmente
   la tarjeta a finalizado cuando se acepte.

Iniciar una tarjeta usa sesiones normales de Gateway. El Plugin Workboard solo almacena
metadatos y vínculos de tarjetas; la transcripción de la conversación, la selección de modelo y el ciclo de vida de la ejecución
siguen perteneciendo al sistema de sesiones normal.

Usa Stop en una tarjeta vinculada en vivo para abortar la ejecución de la sesión activa. Workboard marca
esa tarjeta como `blocked` para que siga visible para el seguimiento.

Las tarjetas nuevas pueden comenzar desde plantillas de Workboard para correcciones de errores, documentación, releases, revisiones de PR
o trabajo de plugin. Las plantillas prerrellenan título, notas, etiquetas y prioridad,
y el id de la plantilla seleccionada se almacena como metadatos de la tarjeta.

## Permisos

El plugin registra métodos RPC de Gateway bajo el namespace `workboard.*`:

- `workboard.cards.list` requiere `operator.read`
- `workboard.cards.export` requiere `operator.read`
- `workboard.cards.diagnostics` requiere `operator.read`
- `workboard.cards.diagnostics.refresh` requiere `operator.write`
- las lecturas de lista/obtención de adjuntos y de eventos de notificación requieren `operator.read`
- el avance del cursor de notificaciones requiere `operator.write`
- los métodos para crear, actualizar, mover, eliminar, comentar, vincular, enlace de dependencia, prueba, artefacto,
  añadir/eliminar adjunto, log de worker, infracción de protocolo, claim, heartbeat,
  release, completar, bloquear, desbloquear, dispatch, operaciones masivas y archivar requieren
  `operator.write`

Los navegadores conectados con acceso de operador de solo lectura pueden inspeccionar el tablero, pero
no pueden mutar tarjetas.

## Configuración

Workboard no tiene configuración específica de plugin actualmente. Actívalo o desactívalo con la entrada de plugin estándar:

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

Vuelve a desactivarlo con:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Solución de problemas

### La pestaña indica que Workboard no está disponible

Comprueba la política de plugins:

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` está configurado, añade `workboard` a esa lista de permitidos. Si `plugins.deny` contiene `workboard`, elimínalo antes de activar el plugin.

### Las tarjetas no se guardan

Confirma que la conexión del navegador tenga acceso `operator.write`. Las sesiones de operador de solo lectura pueden listar tarjetas, pero no pueden crearlas, editarlas, moverlas ni eliminarlas.

### Iniciar una tarjeta no abre la sesión esperada

Workboard crea enlaces a sesiones normales del panel. Comprueba el id de agente de la tarjeta y la sesión vinculada; luego abre la vista Sesiones o Chat para inspeccionar el estado real de la ejecución.

### El despacho no inicia un trabajador

Confirma que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Si la CLI informa despacho solo de datos, inicia o reinicia el Gateway y vuelve a intentarlo. El despacho solo de datos actualiza el estado del tablero local, pero no puede iniciar ejecuciones de trabajadores subagentes.

Las tarjetas también pueden omitirse cuando otra tarjeta del mismo propietario o agente ya está en ejecución o esperando revisión. Completa, bloquea o libera ese trabajo activo antes de despachar más trabajo para el mismo propietario.

## Relacionado

- [Control UI](/es/web/control-ui)
- [CLI de Workboard](/es/cli/workboard)
- [Plugins](/es/tools/plugin)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Sesiones](/es/concepts/session)
