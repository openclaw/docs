---
read_when:
    - Diseño del comportamiento de descubrimiento, continuación o archivado de sesiones de Codex
    - Cambio de la interfaz de usuario nativa del catálogo de sesiones o de los RPC del Gateway
    - Ampliación de la supervisión de Codex entre nodos emparejados
summary: Arquitectura y límites del producto para supervisar sesiones nativas de Codex desde OpenClaw.
title: Supervisión de Codex
x-i18n:
    generated_at: "2026-07-12T14:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78528afd31c18fc84e0adb6479a688da7df6d0a5c04e539d253c84d3a17a5f53
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Supervisión de Codex

## Objetivo

La supervisión de Codex permite que un operador de OpenClaw descubra sesiones nativas de Codex y,
cuando sea seguro, cree una rama local mediante la interfaz normal de Chat de OpenClaw.
Codex App Server continúa siendo el propietario del hilo y del bucle del modelo. OpenClaw proporciona el
catálogo de la flota, la interfaz de operador autenticada, la vinculación de sesiones y la entrega por canales.

La función pertenece al Plugin oficial `codex`. No hay un Plugin
Supervisor independiente ni una segunda implementación del protocolo de Codex.

## Límite del producto

El catálogo se registra siempre que el Plugin de Codex está activo. Habilite las
herramientas de supervisión orientadas a agentes con:

```text
plugins.entries.codex.config.supervision.enabled = true
```

El producto inicial activo es intencionadamente más limitado que el plan de flota
a largo plazo:

- Enumerar únicamente los hilos de Codex no archivados.
- Agrupar las filas locales y de nodos emparejados que hayan aceptado participar según la identidad estable del host.
- Crear una rama de Chat normal y bloqueada al modelo a partir de un hilo almacenado o inactivo local al Gateway,
  iniciar su hilo completo del entorno de Codex en el primer turno o abrir el Chat
  creado para una rama anterior.
- Archivar un hilo almacenado o inactivo local al Gateway solo después de una confirmación explícita
  de que no hay otro ejecutor.
- Mostrar las fuentes locales activas sin controles para crear ramas nuevas ni archivar, pero permitir
  que se abra un Chat supervisado existente.
- Mostrar las filas más recientes de cada host en la barra lateral principal, mantener el catálogo completo en
  la página de sesiones y proporcionar lecturas de transcripciones limitadas y paginadas mediante cursor para
  las filas locales y de nodos emparejados.
- Aislar por host los fallos del catálogo.

El catálogo es la colección de elementos no archivados. Una fila de esta colección puede seguir teniendo un
estado de turno inactivo, activo, `notLoaded` o de error.

La supervisión orientada a agentes sigue siendo opcional. La incorporación guiada intenta instalarla y habilitarla
después de detectar correctamente una instalación nativa de Codex y de que el backend de inferencia
seleccionado supere su comprobación en vivo, independientemente del backend principal que
seleccione el usuario. La supervisión solo se activa cuando la configuración oportunista del Plugin
se completa correctamente. Un Plugin deshabilitado explícitamente, un bloqueo por políticas o
`supervision.enabled: false` siguen teniendo autoridad sobre las herramientas de supervisión, pero
no deshabilitan el catálogo de sesiones del operador.

## Propiedad

El Plugin `codex` es propietario de todo el comportamiento de Codex App Server:

- descubrimiento de endpoints y ciclo de vida de la conexión
- inicialización del protocolo y comprobaciones de versión
- listado, lectura, reanudación, archivado y gestión de eventos de hilos
- puentes de aprobación y entrada del usuario
- vinculaciones de hilos nativos con sesiones de OpenClaw
- aplicación del modelo y del entorno exclusivos de Codex después de la continuación

La interfaz de control y el Gateway consumen ese servicio propiedad del Plugin. No leen
directamente los archivos de despliegue de Codex ni implementan otro cliente de App Server.

La topología local predeterminada es:

```text
Codex Desktop -> App Server privado mediante stdio -> directorio de inicio de Codex del usuario
                                                     ^
Plugin de Codex de OpenClaw -> conexión de App Server de supervisión
  (de forma predeterminada, stdio administrado del directorio de inicio del usuario; se respetan los ajustes explícitos de appServer)
  -> catálogo pasivo de fuentes y lectura
  -> fijación de instantánea -> rama canónica de origen appServer
  -> inyección del historial visible y cada turno posterior del Chat supervisado

Sesiones ordinarias de Codex de OpenClaw -> stdio administrado del directorio de inicio del agente de forma predeterminada
  -> hilos ordinarios del entorno completo -> Chat de OpenClaw y entrega por canales
```

Habilitar la supervisión no cambia el entorno ordinario de Codex: sigue estando
limitado al agente de forma predeterminada. La conexión de supervisión independiente utiliza de forma predeterminada
stdio administrado del directorio de inicio del usuario, por lo que sus operaciones de catálogo e instantáneas ven los hilos nativos
almacenados. Se respetan los ajustes explícitos de conexión de `appServer`. Cuando
`homeScope` no está definido, la conexión de supervisión lo resuelve como `"user"` para stdio
o Unix y como `"agent"` para WebSocket. Establezca `appServer.homeScope: "user"`
explícitamente solo cuando el entorno ordinario también deba compartir el directorio de inicio nativo de Codex.
Un Chat adoptado desde el grupo de Codex de la barra lateral es la excepción: su vinculación privada
de supervisión mantiene las lecturas de la fuente, la creación de la rama canónica y los turnos
posteriores en la conexión de supervisión. El estado en vivo y la propiedad siguen siendo
locales al proceso; un hilo desconocido para el proceso de supervisión de OpenClaw es `notLoaded`
aunque Codex Desktop lo esté ejecutando activamente.

Codex tiene un daemon local canónico experimental con un contrato de arranque independiente
administrado por el instalador. Esta función no debe arrancar, reclamar
ni asumir implícitamente ese daemon.

## Flujo del catálogo

El método genérico del Gateway `sessions.catalog.list` delega en el proveedor de catálogo `codex`,
que siempre solicita `archived: false` y los tipos de fuente interactivos `cli` y `vscode`. Combina:

1. Los resultados de `thread/list` locales al Gateway procedentes del App Server de supervisión,
   que utiliza de forma predeterminada stdio administrado del directorio de inicio del usuario.
2. Los resultados de `codex.appServer.threads.list.v1` de cada nodo conectado que haya aceptado participar.

La selección de transcripciones utiliza `thread/turns/list` con `itemsView: "full"` localmente o
el comando con versión `codex.appServer.thread.turns.list.v1` en el nodo
seleccionado. Cada respuesta contiene como máximo 20 turnos persistidos, además de cursores opacos
hacia delante y hacia atrás. La interfaz de control solicita las páginas de la más reciente a la más antigua, representa cada página en
orden cronológico y antepone las páginas anteriores. Nunca recurre a una
lectura `thread/read` sin límites. OpenClaw también rechaza cualquier página de elementos serializada que supere
20 MiB antes de que pueda atravesar el transporte del nodo o del Gateway.

La implementación nativa de nodos emparejados de macOS solo admite un valor no definido/predeterminado o
un valor explícito `appServer.transport: "stdio"` con un ámbito de supervisión no definido/predeterminado o
un valor explícito `appServer.homeScope: "user"`. Transmite `command`, `args`
y `clearEnv` normalizado configurados al proceso secundario. Con `"unix"`, `"websocket"`
o un valor explícito `homeScope: "agent"`, no anuncia ni la capacidad del catálogo
ni el comando; la invocación directa también se cierra de forma segura. Nunca debe exponer el directorio de inicio de Codex del usuario
para una configuración limitada al agente ni sustituir un endpoint explícito por stdio local.

La proyección del catálogo normaliza identificadores, título, cwd, estado, indicadores de espera activa,
marcas de tiempo, fuente, proveedor del modelo, versión de Codex y rama de Git. No
devuelve vistas previas de transcripciones, turnos, rutas de despliegue, rutas del directorio de inicio de Codex,
remotos de Git, SHA de commits, endpoints sin procesar ni errores sin procesar de App Server. Las respuestas de transcripciones
solo contienen la página de elementos de App Server solicitada explícitamente y sus
cursores opacos.

Los fallos de los hosts permanecen aislados en el resultado de cada host. Un nodo sin conexión o un
App Server local no disponible no elimina de la página los hosts en buen estado. La conectividad es una
propiedad del host, no un estado del hilo: el resultado de un host fallido no contiene filas de sesiones
recientes ni proyecta `offline` sobre los hilos nativos.

El descubrimiento del catálogo es pasivo. Listar o leer metadatos no debe llamar a
`thread/resume`, suscribir al cliente de OpenClaw a solicitudes de hilos en vivo ni
responder a una aprobación.

La búsqueda se realiza solo por título y no distingue entre mayúsculas y minúsculas. Para cada página del catálogo devuelta, el
Gateway y el Mac emparejado examinan un número limitado de páginas nativas sin pasar
la consulta a App Server, ya que la búsqueda nativa también puede encontrar coincidencias en vistas previas de transcripciones.
El cursor nativo devuelto permite que los llamadores continúen el examen.

## Límite de la CLI del operador

El Plugin registra tres comandos de shell respaldados por el Gateway:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` corresponde a `--url <url>`, `--token <token>`, `--timeout <ms>` y
la opción heredada `--expect-final`. El listado de sesiones tiene un tiempo de espera predeterminado de 75,000 ms;
la continuación y el archivado tienen un valor predeterminado de 30,000 ms;
`--expect-final` no tiene ningún efecto adicional en estas RPC unarias. La búsqueda de sesiones
se realiza solo por título y no distingue entre mayúsculas y minúsculas; cada respuesta examina una cadena limitada de páginas nativas
y `--cursor` continúa con resultados más antiguos. El límite predeterminado es de 50 por host,
acepta valores de 1 a 100 y un cursor requiere un único destino `--host`
estable. Ningún comando acepta
una opción para elementos archivados o para incluirlos. Solo `sessions` puede dirigirse a hosts emparejados;
`continue` y `archive` siempre envían `hostId: "gateway:local"`, y el archivado
requiere la opción de confirmación explícita.

El espacio de nombres del shell no es el espacio de nombres de ejecución de `/codex` dentro del Chat. En
particular, `/codex sessions --host <node>` enumera los archivos de sesión de la CLI de Codex en un
nodo, `/codex threads` enumera los hilos de App Server de la conexión de la conversación
actual y `/codex resume` o `/codex bind` modifica la vinculación de esa conversación.
Esos comandos no sustituyen a `sessions.catalog.continue` y no existe ningún comando de ejecución
`/codex continue` ni `/codex archive`.

## Continuación local

Para una fila almacenada o inactiva local al Gateway, la interfaz llama a
`sessions.catalog.continue` con `catalogId: "codex"`, además de los identificadores del host y del hilo.
El Plugin:

1. Reutiliza el Chat supervisado existente cuando la fuente ya tiene uno.
2. De lo contrario, proyecta el historial limitado del usuario y del asistente hasta el último
   turno terminal persistido de la fuente (completado, interrumpido o fallido) en un nuevo
   Chat de OpenClaw y registra una rama pendiente del entorno.
3. Almacena la política pendiente de bloqueo exclusiva para modelos de Codex, no una selección concreta de
   modelo o proveedor, junto con el ámbito privado de la conexión de supervisión, y
   devuelve la `sessionKey` de OpenClaw.

La proyección del historial selecciona la parte final más reciente de los mensajes visibles del usuario y del asistente,
con límites estrictos de 200 mensajes, 512 KiB de texto UTF-8 en total y
64 KiB por mensaje. Sustituye las entradas de imagen e imagen local por
`[Image attachment]`, nunca copia cargas útiles ni rutas de imágenes y omite el razonamiento,
las llamadas a herramientas y los resultados de herramientas.

La interfaz navega al Chat normal con esa clave de sesión. Todavía no existe ningún hilo canónico
del entorno. En el primer turno normal del Chat, el entorno instala los gestores reales de
aprobación, obtención de información, eventos y entrega de Codex y, después:

1. Utiliza la conexión de supervisión para llamar a `thread/fork` nativo sin anular el modelo
   ni el proveedor y fijar la instantánea persistida de la fuente. El estado actual de
   `ConfigManager` de Codex selecciona el modelo y el proveedor, y la respuesta de la bifurcación
   informa de la pareja real. Si el modelo difiere del último modelo registrado
   en la fuente, Codex emite su advertencia normal de diferencia de modelo.
2. En esa misma conexión, inicia el hilo canónico del entorno completo de Codex con
   `threadSource: "appServer"`, el cwd, la política, la configuración y el entorno de OpenClaw, la
   superficie completa de herramientas del entorno de OpenClaw y exactamente el modelo y el proveedor
   devueltos por la bifurcación para este inicio inicial.
3. Inyecta mediante esa conexión el historial limitado visible del usuario y del asistente,
   confirma la vinculación canónica sin descartar su ámbito de supervisión,
   ejecuta el turno y archiva la bifurcación temporal.

Antes del primer turno, el Chat es una rama pendiente bloqueada con una copia visible
del historial; después, cada turno del modelo se ejecuta mediante el hilo canónico del entorno de Codex
en la conexión de supervisión. La rama no es un clon completo de un despliegue
nativo: el razonamiento, las llamadas a herramientas y los resultados de herramientas de la fuente se omiten
deliberadamente. Si falla la fijación de la instantánea o la creación del hilo canónico, la rama
pendiente permite volver a intentarlo. Una condición de carrera en la vinculación, la supervisión deshabilitada o una conexión
de supervisión no disponible o incompatible provoca un cierre seguro antes de ejecutar el turno,
en lugar de recurrir al entorno ordinario del directorio de inicio del agente.

Esto garantiza una selección propiedad de Codex, no la conservación del modelo
histórico de la fuente. La pareja devuelta por la bifurcación se utiliza para iniciar el hilo canónico
y Codex persiste el modelo y el proveedor nativos de ese hilo. Las reanudaciones posteriores
omiten las anulaciones de modelo y proveedor de OpenClaw, por lo que Codex restaura la pareja persistida.
Si un control nativo independiente de Codex cambia el hilo canónico, OpenClaw acepta
esa selección nativa persistida. El modelo externo de OpenClaw y la cadena de reserva
nunca la sustituyen.

Los cambios de modelo y las operaciones de eliminación, restablecimiento o creación de sesión fallan de forma segura
en el Chat supervisado con modelo bloqueado. Las operaciones mutantes `/codex model <model>`, `/codex
bind`, `/codex resume` (incluido `--bind here` del Node) y `/codex detach` o
`/codex unbind` también fallan de forma segura porque sustituyen o eliminan la vinculación. La
consulta `/codex model` y `/codex fast`, `/codex permissions` y `/codex
threads` siguen disponibles. La herramienta de agente `codex_threads` no puede adjuntar una bifurcación
nueva ni archivar el hilo nativo vinculado. La lectura de listas y solo metadatos sigue
disponible; los campos de transcripción requieren `supervision.allowRawTranscripts`, mientras que
cambiar el nombre, desarchivar, crear una bifurcación desvinculada y archivar un hilo no relacionado requieren
`supervision.allowWriteControls`. Ninguna opción puede sustituir la vinculación bloqueada.
De lo contrario, eliminar o restablecer la entrada de OpenClaw descartaría la
vinculación nativa y crearía o permitiría un hilo genérico detrás de una sesión con apariencia de Codex.
Por ello, el mantenimiento de retención conserva las entradas con modelo bloqueado incluso cuando
superan los límites habituales de antigüedad, cantidad o presupuesto de disco. Deshabilitar o desinstalar el
plugin propietario también conserva el bloqueo y el marcador de propiedad del plugin. El Chat permanece
no disponible y falla de forma segura hasta que se vuelve a habilitar el mismo plugin; la limpieza nunca
lo convierte en una sesión de modelo ordinaria.

Esta acción nunca reanuda ni modifica el origen. La bifurcación temporal fija una
instantánea; no es el hilo de continuación persistente. Iniciar un hilo distinto del
entorno canónico en el primer turno evita que OpenClaw se convierta en un
escritor de origen competidor solo porque el estado local del proceso no detectó un
turno propiedad de Desktop. El reflejo del historial visible y la instantánea fijada pueden omitir trabajo
que aún no haya finalizado en un origen activo. El origen original de la CLI o VS Code
sigue siendo apto para los catálogos nativo y de OpenClaw. La rama canónica
sigue siendo un hilo nativo de Codex en el almacén de supervisión, pero los clientes nativos
pueden filtrar su tipo de origen `appServer`, por lo que la visibilidad en Codex Desktop no es un
contrato.

## Comportamiento del archivado

Para una fila almacenada o inactiva local del Gateway, `sessions.catalog.archive` con
`catalogId: "codex"` requiere
`confirmNoOtherRunner: true` explícito, vuelve a leer el estado local actual del proceso,
continúa solo si es `idle` o `notLoaded`, llama a `thread/archive` nativo
y devuelve éxito solo después de que Codex acepte la operación. A continuación, la fila deja
el catálogo de elementos no archivados.

Un estado activo o de error de la lectura nueva rechaza el archivado. También lo hace una
rama supervisada en inicialización o pendiente procedente del origen: el primer turno del Chat
debe materializar su rama canónica antes de poder archivar el origen. Un
propietario de vinculación activo y conocido de OpenClaw para el destino exacto o cualquier descendiente
generado y no archivado también rechaza el archivado. OpenClaw pagina la relación experimental
`thread/list ancestorThreadId` de Codex y falla de forma segura ante errores de solicitud o respuesta,
ciclos de cursores o hilos y el agotamiento del límite de seguridad. El archivado nativo puede
detener el trabajo cargado del elemento principal y sus descendientes, por lo que el archivado no es un atajo
para interrumpir. Las llamadas de lectura, enumeración de descendientes y archivado no son atómicas.
Un cliente independiente aún puede poseer o iniciar trabajo en una fila que localmente parece inactiva o
`notLoaded`. La confirmación de que no hay otro ejecutor cubre a los clientes desconocidos y
esa condición de carrera hasta que Codex disponga de archivado condicional o un arrendamiento entre procesos.
El archivado de nodos emparejados está prohibido.

No hay una vista de elementos archivados en el catálogo de Codex. Un hilo restaurado mediante
`thread/unarchive` en otra superficie de Codex autorizada por el propietario vuelve a ser apto
para el catálogo de elementos no archivados.

## Seguridad de los hilos activos

Codex serializa las modificaciones de un hilo entre los clientes de un App Server, pero
no expone un arrendamiento exclusivo entre procesos para el ejecutor o el propietario de las aprobaciones.
Los App Servers de stdio independientes pueden añadir contenido al mismo despliegue, mientras cada uno ve
solo su propio estado en memoria. Las solicitudes de aprobación también pueden llegar a todos los suscriptores
de un servidor, y la primera respuesta válida completa la solicitud.

Por lo tanto:

- los clientes pasivos del catálogo no se suscriben a las aprobaciones ni las deniegan automáticamente
- las filas que se indican actualmente como activas no exponen ni una rama nueva ni la opción Archive
- un origen sin asignar se convierte en una rama de historial visible cuyo hilo canónico del entorno
  nunca reanuda el origen
- `notLoaded` se muestra como actividad desconocida y solo se puede archivar tras una
  confirmación informada de que no hay otro ejecutor
- el archivado local requiere esa confirmación junto con una lectura nueva `idle` o `notLoaded`,
  al tiempo que reconoce la condición de carrera del protocolo entre la lectura y el archivado

La interrupción y la transferencia entre varios clientes son decisiones futuras del producto. No están
implícitas por mostrar una fila activa.

## Límite de nodos emparejados

La invocación de Node actualmente solo admite solicitud y respuesta. Puede devolver de forma segura
metadatos acotados del catálogo y páginas de turnos de transcripción, pero no puede transportar el flujo de eventos de larga duración, las solicitudes de
aprobación, las llamadas a herramientas, la cancelación ni los incrementos del asistente necesarios para una ejecución del
entorno de Codex.

Por tanto, el contrato del Node admite listas y páginas de turnos de transcripción. Las
filas remotas siguen siendo legibles, pero **Continue** y **Archive** no están disponibles, independientemente del estado de inactividad. Una
continuación remota real requiere un ejecutor en el Node y un puente de transmisión que
conserve las mismas invariantes de aprobación y vinculación que el entorno local.

## Permisos

Cada equipo concede su aceptación localmente. Habilitar el Gateway no autoriza a otro
Node a leer sus metadatos de Codex. La capacidad del Node debe superar el emparejamiento normal
y la aprobación de la política de comandos.

El listado de la flota y la visualización de transcripciones usan el ámbito `operator.write` del Gateway
porque invocan nodos emparejados. La continuación y el archivado locales son
acciones autenticadas del operador y siguen sujetos a comprobaciones del host y del estado.

El acceso autónomo de agentes y el acceso independiente mediante MCP son ámbitos separados. Los contratos de herramientas
incluidos `codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` y `codex_session_interrupt` siguen siendo propiedad
del plugin `codex`. Con la supervisión habilitada, las lecturas de transcripciones sin procesar de `codex_threads`
y los campos de listas derivados de transcripciones también requieren
`supervision.allowRawTranscripts`; cada bifurcación, cambio de nombre, archivado
o desarchivado mediante `codex_threads` requiere `supervision.allowWriteControls`. Ambas políticas están
deshabilitadas de forma predeterminada.

## Compatibilidad

`openclaw doctor --fix` migra la configuración incluida de `plugins.entries.codex-supervisor`,
incluidos los extremos y las políticas de transcripción/escritura, además de las referencias de
permisión/denegación de plugins, a
`plugins.entries.codex.config.supervision`. Los valores canónicos explícitos de destino
prevalecen en caso de conflicto. El código en tiempo de ejecución usa únicamente la forma canónica
del plugin `codex` después de la migración.

El plugin oficial conserva exactamente cinco herramientas de compatibilidad de Supervisor:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` y `codex_session_interrupt`. De forma predeterminada, la lista de sesiones
solo incluye las cargadas; no hay ningún parámetro `loaded_only`. `include_stored: true` añade
filas no archivadas de la base de datos de estado, limitadas por extremo mediante `max_stored_sessions`
(valor predeterminado 200, intervalo aceptado de 1 a 1,000); las filas cargadas no están limitadas por esa
configuración. Los campos derivados de transcripciones y las lecturas siguen sujetos a
`allowRawTranscripts`; el envío y la interrupción siguen sujetos a `allowWriteControls`.

El envío de compatibilidad nunca inicia ni reanuda un hilo inactivo. `mode: "start"` se
rechaza siempre; `"auto"` y `"steer"` solo dirigen un turno activo legible.
La interrupción también requiere un turno activo legible. La continuación inactiva se dirige
al catálogo nativo de Codex para que el entorno completo sea propietario de las aprobaciones, las herramientas y la vinculación.
El adaptador MCP heredado independiente resuelve estas mismas herramientas desde el plugin oficial
y es la única ruta que respeta las variables de entorno de políticas heredadas que se conservan.

La interfaz de usuario del catálogo de julio, el método del Gateway, la capacidad del Node y el registro en la CLI no
se habían publicado con el identificador anterior del plugin. Pasan directamente a ser propiedad de `codex`
sin una segunda fachada de tiempo de ejecución.

## Trabajo futuro

- ejecutor de transmisión en el Node y puente de eventos para la continuación remota
- arrendamientos explícitos del ejecutor y del propietario de aprobaciones para la transferencia simultánea entre clientes
- archivado remoto una vez que exista un arrendamiento de propiedad del ejecutor o una protección equivalente
- interrupción y observación más completa de sesiones activas
- transferencia auditada entre Codex Desktop, la CLI y OpenClaw

La exploración de elementos archivados no forma parte de la barra lateral de supervisión planificada. Las superficies
nativas de Codex siguen siendo la ruta de recuperación de los hilos archivados.

## Pruebas de aceptación

- Al habilitar la supervisión, se enumeran las sesiones locales no archivadas.
- Las sesiones archivadas nunca aparecen en la respuesta del catálogo ni en la interfaz de usuario.
- Los hosts en buen estado siguen visibles cuando otro host falla; un host no disponible
  no devuelve filas nuevas en lugar de inventar un estado de sesión sin conexión.
- Una fila local almacenada o inactiva crea un reflejo de Chat con un bloqueo de
  modelo/entorno exclusivo de Codex; el primer turno fija una instantánea temporal e inicia el
  hilo canónico del entorno completo, y repetir Continue abre el Chat existente.
- El primer turno omite las sustituciones del modelo/proveedor en la bifurcación de la instantánea y fija
  el inicio canónico al par exacto devuelto por Codex, incluso cuando Codex advierte
  que su modelo actual difiere del último modelo registrado del origen.
- Las vinculaciones supervisadas pendientes y confirmadas usan la conexión de supervisión para
  acceder al origen, crear la rama canónica y ejecutar cada turno posterior; las sesiones
  ordinarias de Codex siguen limitadas al agente.
- Las reanudaciones posteriores omiten las sustituciones de modelo/proveedor de OpenClaw, conservan la
  selección persistente canónica de Codex, aceptan cambios nativos independientes en ese hilo
  y nunca sustituyen el modelo externo de OpenClaw ni la cadena de reserva.
- Deshabilitar la supervisión o perder el ciclo de vida de la vinculación/conexión falla de forma segura
  en lugar de trasladar el Chat al entorno ordinario del directorio principal del agente.
- Un Chat supervisado con modelo bloqueado no se puede eliminar mientras protege la
  vinculación nativa.
- El Chat refleja como máximo 200 mensajes de usuario y del asistente, 512 KiB en total y
  64 KiB por mensaje. Las imágenes se convierten en marcadores de posición; no se clonan el razonamiento del origen, las llamadas a
  herramientas, los resultados de herramientas, las cargas de imágenes ni las rutas locales.
- El flujo de la rama nunca reanuda el hilo de origen.
- El origen original sigue siendo apto para ambos catálogos. La rama nativa canónica
  usa el tipo de origen `appServer` y no se garantiza que aparezca en Codex Desktop.
- Los orígenes locales activos no pueden crear una rama ni archivarse; un Chat supervisado
  existente aún se puede abrir.
- Las filas con actividad desconocida pueden crear una rama sin confirmación; el archivado requiere
  una confirmación explícita de que no hay otro ejecutor.
- Un origen con una rama supervisada en inicialización o pendiente no se puede archivar
  hasta que el primer turno del Chat materialice la rama canónica.
- Un propietario de vinculación activo y conocido para el destino exacto o cualquier descendiente generado
  y no archivado bloquea el archivado; los fallos de enumeración de descendientes fallan de forma segura y
  la confirmación explícita sigue siendo responsable de los clientes desconocidos y la
  condición de carrera entre el estado y el archivado.
- El archivado local confirmado de una fila almacenada o inactiva elimina la fila tras el éxito nativo.
- Las filas de nodos emparejados siguen visibles sin Continue ni Archive.
- El listado pasivo nunca se suscribe a las aprobaciones de hilos ni responde a ellas.
- La configuración heredada de Supervisor se migra a la forma canónica de configuración de Codex.
- La lista heredada solo incluye las sesiones cargadas de forma predeterminada, la enumeración de elementos almacenados respeta su límite por extremo
  y el envío de compatibilidad nunca inicia ni reanuda un hilo inactivo.
