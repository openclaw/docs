---
read_when:
    - Diseño del comportamiento de descubrimiento, continuación o archivo de sesiones de Codex
    - Cambiar la interfaz de usuario nativa del catálogo de sesiones o los RPC del Gateway
    - Ampliación de la supervisión de Codex entre nodos emparejados
summary: Arquitectura y límites del producto para supervisar sesiones nativas de Codex desde OpenClaw.
title: Supervisión de Codex
x-i18n:
    generated_at: "2026-07-19T02:13:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e259badc8f7fdec6fa093785a1dd04394e12287ae61f00474bcd45e7b95352d
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Supervisión de Codex

## Objetivo

La supervisión de Codex permite que un operador de OpenClaw descubra sesiones nativas de Codex y,
cuando sea seguro, cree una rama local mediante la superficie normal de Chat de OpenClaw.
Codex App Server sigue siendo el propietario del hilo y del bucle del modelo. OpenClaw proporciona el
catálogo de la flota, la interfaz de operador autenticada, la vinculación de sesiones y la entrega por canales.

La funcionalidad pertenece al Plugin oficial `codex`. No existe un Plugin
Supervisor independiente ni una segunda implementación del protocolo de Codex.

## Límite del producto

El catálogo se registra siempre que el Plugin de Codex está activo, salvo que el descubrimiento
de sesiones nativas se deshabilite explícitamente con:

```text
plugins.entries.codex.config.sessionCatalog.enabled = false
```

Habilite las herramientas de supervisión orientadas al agente con:

```text
plugins.entries.codex.config.supervision.enabled = true
```

El producto inicial activo es intencionadamente más limitado que el plan de flota
a largo plazo:

- Mostrar únicamente los hilos de Codex no archivados.
- Agrupar las filas locales y de nodos emparejados que hayan aceptado participar según una identidad de host estable.
- Crear una rama normal de Chat con el modelo bloqueado a partir de un hilo almacenado o inactivo local
  al Gateway, iniciar su hilo completo del entorno de Codex en el primer turno o abrir el Chat
  creado para una rama anterior.
- Archivar un hilo almacenado o inactivo local al Gateway únicamente después de confirmar explícitamente
  que no hay ningún otro ejecutor.
- Mostrar las fuentes locales activas sin controles para crear ramas ni archivar, pero seguir
  permitiendo abrir un Chat supervisado existente.
- Mostrar las filas más recientes de cada host en la barra lateral principal, mantener el catálogo completo en
  la página de sesiones y proporcionar lecturas de transcripciones acotadas y paginadas mediante cursor para
  filas locales y de nodos emparejados.
- Aislar por host los fallos del catálogo.

El catálogo es la colección de elementos no archivados. Una fila de este aún puede tener un
estado de turno inactivo, activo, `notLoaded` o de error.

La supervisión orientada al agente sigue siendo opcional. La incorporación guiada intenta instalarla y habilitarla
después de detectar correctamente la instalación nativa de Codex y de que el backend de inferencia
seleccionado supere su comprobación en vivo, independientemente del backend principal que seleccione
el usuario. La supervisión se activa únicamente cuando esa configuración oportunista del Plugin
se completa correctamente. Un Plugin deshabilitado explícitamente, un bloqueo por política o
`supervision.enabled: false` siguen prevaleciendo para las herramientas de supervisión, pero
no deshabilitan el catálogo de sesiones del operador. `sessionCatalog.enabled: false`
deshabilita el descubrimiento del operador y los comandos del catálogo de nodos emparejados; el
proveedor y el entorno de Codex permanecen activos.

## Propiedad

El Plugin `codex` es propietario de todo el comportamiento de Codex App Server:

- descubrimiento de endpoints y ciclo de vida de la conexión
- inicialización del protocolo y comprobaciones de versión
- listado, lectura, reanudación, archivado y gestión de eventos de hilos
- puentes de aprobación y entrada del usuario
- vinculaciones de hilos nativos con sesiones de OpenClaw
- aplicación obligatoria del modelo y el entorno exclusivos de Codex después de la continuación

La interfaz de control y el Gateway consumen ese servicio propiedad del Plugin. No leen
directamente los archivos de despliegue de Codex ni implementan otro cliente de App Server.

La topología local predeterminada es:

```text
Codex Desktop -> App Server privado mediante stdio -> directorio principal de Codex del usuario
                                                        ^
Plugin de Codex de OpenClaw -> conexión de App Server para supervisión
  (de forma predeterminada, stdio administrado del directorio principal del usuario; se respetan los ajustes explícitos de appServer)
  -> catálogo pasivo de fuentes y lectura
  -> fijación de instantánea -> rama canónica de fuente appServer
  -> inyección del historial visible y todos los turnos posteriores del Chat supervisado

Sesiones ordinarias de Codex en OpenClaw -> stdio administrado del directorio principal del agente de forma predeterminada
  -> hilos ordinarios del entorno completo -> Chat de OpenClaw y entrega por canales
```

Habilitar la supervisión no cambia el entorno ordinario de Codex: sigue estando
asociado al agente de forma predeterminada. La conexión de supervisión independiente utiliza de forma predeterminada
el stdio administrado del directorio principal del usuario, por lo que sus operaciones de catálogo e instantáneas ven los hilos
nativos almacenados. Se respetan los ajustes de conexión explícitos de `appServer`. Cuando
`homeScope` no está definido, la conexión de supervisión lo resuelve como `"user"` para stdio
o Unix y como `"agent"` para WebSocket. Defina `appServer.homeScope: "user"`
explícitamente solo cuando el entorno ordinario también deba compartir el directorio principal nativo de Codex.
Un Chat adoptado desde el grupo de Codex de la barra lateral es la excepción: su vinculación
privada de supervisión mantiene las lecturas de la fuente, la creación de la rama canónica y los turnos
posteriores en la conexión de supervisión. El estado en vivo y la propiedad siguen siendo
locales al proceso; un hilo desconocido para el proceso de supervisión de OpenClaw es `notLoaded`
incluso cuando Codex Desktop lo está ejecutando activamente.

Codex dispone de un daemon local canónico experimental con un contrato de arranque
independiente administrado por el instalador. Esta funcionalidad no debe iniciar, atribuirse
ni presuponer implícitamente ese daemon.

## Flujo del catálogo

El método genérico `sessions.catalog.list` del Gateway envía la solicitud al proveedor de catálogo
`codex`, que siempre solicita `archived: false` y permite que App Server
aplique su valor predeterminado de fuentes interactivas: `cli`, `vscode`, Atlas y ChatGPT. Combina:

1. Los resultados de `thread/list` locales al Gateway procedentes del App Server de supervisión,
   que utiliza de forma predeterminada el stdio administrado del directorio principal del usuario.
2. Los resultados de `codex.appServer.threads.list.v1` de cada nodo conectado que haya aceptado participar.

La selección de transcripciones utiliza `thread/turns/list` con `itemsView: "full"` localmente o
el comando con versión `codex.appServer.thread.turns.list.v1` en el nodo
seleccionado. Cada respuesta contiene como máximo 20 turnos persistidos, además de cursores
opacos hacia delante y hacia atrás. La interfaz de control solicita primero las páginas más recientes, representa cada página en
orden cronológico y antepone las páginas más antiguas. Nunca recurre a un
`thread/read` sin límites. OpenClaw también rechaza cualquier página de elementos serializados que supere
20 MiB antes de que pueda atravesar el transporte del nodo o del Gateway.

La implementación nativa del nodo emparejado de macOS solo admite un valor no definido/predeterminado o
un `appServer.transport: "stdio"` explícito con un ámbito de supervisión no definido/predeterminado o
un `appServer.homeScope: "user"` explícito. Transfiere `command`, `args`
y el valor normalizado de `clearEnv` configurados al proceso secundario. Con `"unix"`, `"websocket"`
o un `homeScope: "agent"` explícito, no anuncia ni la capacidad del catálogo
ni el comando; la invocación directa también falla de forma segura. Nunca debe exponer el directorio principal
de Codex del usuario para una configuración asociada al agente ni sustituir un endpoint explícito
por stdio local.

La proyección del catálogo normaliza los identificadores, el título, el cwd, el estado, los indicadores
de espera activa, las marcas de tiempo, la fuente, el proveedor del modelo, la versión de Codex y la rama de Git. No
devuelve vistas previas de transcripciones, turnos, rutas de despliegue, rutas del directorio principal de Codex,
remotos de Git, SHA de commits, endpoints sin procesar ni errores sin procesar de App Server. Las respuestas de
transcripción solo contienen la página de elementos de App Server solicitada explícitamente y sus
cursores opacos.

Los fallos de los hosts se mantienen locales al resultado de cada host. Un nodo sin conexión o un
App Server local no disponible no eliminan de la página los hosts en buen estado. La conectividad es una
propiedad del host, no un estado del hilo: el resultado de un host con errores no contiene
filas de sesión recientes ni proyecta `offline` sobre los hilos nativos.

La interfaz de control solicita actualizaciones progresivas del catálogo. Cada host local o emparejado
aparece cuando finaliza su propio listado de App Server; la respuesta agregada sigue siendo
la instantánea de compatibilidad y recuperación. La página visible se reconcilia después de
cambios de conectividad, al recibir el foco y, como máximo, cada 30 segundos, con una pasada más rápida
después de los cambios. Por tanto, las sesiones nativas de Codex creadas en otro cliente
se descubren finalmente sin importarlas al almacenamiento de OpenClaw.

El descubrimiento del catálogo es pasivo. El listado o la lectura de metadatos no deben llamar a
`thread/resume`, suscribir el cliente de OpenClaw a solicitudes de hilos en vivo ni
responder a una aprobación.

La búsqueda se realiza solo por título y no distingue entre mayúsculas y minúsculas. Para cada página devuelta del catálogo, el
Gateway y el Mac emparejado examinan un número acotado de páginas nativas sin transferir
la consulta a App Server, ya que la búsqueda nativa también puede coincidir con vistas previas de
transcripciones. El cursor nativo devuelto permite que los solicitantes continúen el examen.

## Límite de la CLI del operador

El Plugin registra tres comandos de shell respaldados por el Gateway:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` es `--url <url>`, `--token <token>`, `--timeout <ms>` y
el modificador heredado `--expect-final`. El listado de sesiones utiliza de forma predeterminada 75,000 ms;
la continuación y el archivado utilizan de forma predeterminada 30,000 ms;
`--expect-final` no tiene ningún efecto adicional para estas RPC unarias. La búsqueda de sesiones
se realiza solo por título y no distingue entre mayúsculas y minúsculas; cada respuesta examina una cadena acotada de páginas
nativas y `--cursor` continúa con los resultados más antiguos. El límite predeterminado es de 50 por host
y acepta valores de 1 a 100; un cursor requiere un destino `--host`
estable. Ningún comando acepta
una opción para incluir elementos archivados.
Solo `sessions` puede dirigirse a hosts emparejados;
`continue` y `archive` siempre envían `hostId: "gateway:local"`, y el archivado
requiere el indicador de confirmación explícito.

El espacio de nombres del shell no es el espacio de nombres del entorno `/codex` dentro del chat. En
particular, `/codex sessions --host <node>` enumera los archivos de sesión de la CLI de Codex en un
nodo, `/codex threads` enumera los hilos de App Server para la conexión de la conversación
actual y `/codex resume` o `/codex bind` modifica la vinculación de esa conversación.
Esos comandos no sustituyen a `sessions.catalog.continue`, y no existe ningún comando de entorno
`/codex continue` ni `/codex archive`.

## Continuación local

Para una fila almacenada o inactiva local al Gateway, la interfaz llama a
`sessions.catalog.continue` con `catalogId: "codex"` más los identificadores del host y del hilo.
El Plugin:

1. Reutiliza el Chat supervisado existente cuando la fuente ya tiene uno.
2. De lo contrario, proyecta un historial acotado del usuario y el asistente hasta el último
   turno terminal persistido de la fuente (completado, interrumpido o fallido) en un nuevo
   Chat de OpenClaw y registra una rama pendiente del entorno.
3. Almacena la política pendiente de bloqueo a modelos exclusivos de Codex, no una selección concreta
   de modelo o proveedor, además del ámbito privado de la conexión de supervisión, y
   devuelve el `sessionKey` de OpenClaw.

La proyección del historial selecciona la parte final más reciente de los mensajes visibles del usuario y del asistente,
con límites estrictos de 200 mensajes, 512 KiB de texto UTF-8 en total y
64 KiB por mensaje. Sustituye las entradas de imagen e imagen local por
`[Image attachment]`, nunca copia cargas útiles ni rutas de imágenes y omite el razonamiento,
las llamadas a herramientas y los resultados de herramientas.

La interfaz navega al Chat normal con esa clave de sesión. Todavía no existe ningún hilo
canónico del entorno. En el primer turno normal del Chat, el entorno instala los controladores reales
de aprobación, obtención de información, eventos y entrega de Codex y, a continuación:

1. Utiliza la conexión de supervisión para llamar al `thread/fork` nativo sin reemplazar el modelo
   ni el proveedor y fija la instantánea persistida de la fuente. El estado actual de
   `ConfigManager` de Codex selecciona el modelo y el proveedor, y la respuesta de la bifurcación
   informa del par real. Si el modelo difiere del último modelo registrado
   en la fuente, Codex emite su advertencia normal sobre la diferencia de modelo.
2. En esa misma conexión, inicia el hilo canónico del entorno completo de Codex con
   `threadSource: "appServer"`, el cwd, la política, la configuración y el entorno de OpenClaw, toda
   la superficie de herramientas del entorno de OpenClaw y exactamente el modelo y el proveedor
   devueltos por la bifurcación para este inicio inicial.
3. Inyecta el historial visible acotado del usuario y el asistente mediante esa
   conexión, confirma la vinculación canónica sin descartar su ámbito de supervisión,
   ejecuta el turno y archiva la bifurcación temporal.

Antes del primer turno, el Chat es una rama pendiente bloqueada con un reflejo
visible del historial; después, cada turno del modelo se ejecuta a través del hilo
canónico del arnés de Codex en la conexión de supervisión. La rama no es un clon
completo de una ejecución nativa: se omiten deliberadamente el razonamiento de
origen, las llamadas a herramientas y los resultados de las herramientas. Si falla
la fijación de la instantánea o la creación del hilo canónico, la rama pendiente
permanece disponible para reintentos. Una condición de carrera en la vinculación,
la supervisión deshabilitada o una conexión de supervisión no disponible o
incompatible provocan un cierre seguro antes de que se ejecute el turno, en vez de
recurrir al arnés ordinario del directorio principal del agente.

Esto garantiza la selección controlada por Codex, no la conservación del modelo
histórico del origen. El par devuelto por la bifurcación se utiliza para iniciar el
hilo canónico, y Codex conserva el modelo y el proveedor nativos de ese hilo. Las
reanudaciones posteriores omiten las anulaciones de modelo y proveedor de OpenClaw,
por lo que Codex restaura el par conservado. Si un control nativo independiente de
Codex cambia el hilo canónico, OpenClaw acepta esa selección nativa conservada. El
modelo externo de OpenClaw y la cadena de alternativas nunca lo sustituyen.

Los cambios de modelo, la eliminación de sesiones y las operaciones para
restablecer o crear una sesión fallan de forma segura para el Chat supervisado con
el modelo bloqueado. La modificación de `/codex model <model>`, `/codex
bind`, `/codex resume` (incluido el Node `--bind here`) y `/codex detach` o
`/codex unbind` también falla de forma segura porque estas operaciones reemplazan
o borran la vinculación. La consulta `/codex model` y `/codex fast`, `/codex permissions` y `/codex
threads` siguen disponibles. La herramienta del agente
`codex_threads` no puede adjuntar una nueva bifurcación ni archivar el hilo nativo
vinculado. La lectura de listas y únicamente de metadatos sigue disponible; los
campos de transcripción requieren `supervision.allowRawTranscripts`, mientras que cambiar el nombre,
desarchivar, crear una bifurcación desvinculada y archivar un hilo no relacionado
requieren `supervision.allowWriteControls`. Ninguna de las opciones puede reemplazar la vinculación
bloqueada.
De otro modo, eliminar o restablecer la entrada de OpenClaw descartaría la
vinculación nativa y crearía o permitiría un hilo genérico detrás de una sesión con
apariencia de Codex. Por tanto, el mantenimiento de la retención conserva las
entradas con el modelo bloqueado incluso cuando superan los límites ordinarios de
antigüedad, cantidad o presupuesto de disco. Deshabilitar o desinstalar el Plugin
propietario también conserva el bloqueo y el marcador de propiedad del Plugin. El
Chat permanece no disponible y falla de forma segura hasta que se vuelve a habilitar
el mismo Plugin; la limpieza nunca lo convierte en una sesión de modelo ordinaria.

Esta acción nunca reanuda ni modifica el origen. La bifurcación temporal fija una
instantánea; no es el hilo de continuación persistente. Iniciar un hilo distinto del
arnés canónico en el primer turno impide que OpenClaw se convierta en un escritor
competidor del origen solo porque el estado local del proceso no detectó un turno
controlado por Desktop. El reflejo del historial visible y la instantánea fijada
pueden omitir trabajo que aún no haya terminado en un origen activo. El origen
original de la CLI, VS Code, Atlas o ChatGPT sigue siendo apto tanto para los
catálogos nativos como para los de OpenClaw. La rama canónica sigue siendo un hilo
nativo de Codex en el almacén de supervisión, pero los clientes nativos pueden filtrar
su tipo de origen `appServer`, por lo que la visibilidad en Codex Desktop no es
un contrato.

## Comportamiento del archivado

Para una fila local del Gateway almacenada o inactiva, `sessions.catalog.archive` con
`catalogId: "codex"` requiere
`confirmNoOtherRunner: true` explícito, vuelve a leer el estado actual local del proceso,
solo continúa para `idle` o `notLoaded`, llama a `thread/archive`
nativo y devuelve un resultado correcto únicamente después de que Codex acepte la
operación. A continuación, la fila abandona el catálogo de elementos no archivados.

Un estado activo o de error procedente de la nueva lectura rechaza el archivado.
También lo rechaza una rama supervisada del origen que se esté inicializando o esté
pendiente: el primer turno del Chat debe materializar su rama canónica antes de que
se pueda archivar el origen. Un propietario conocido de una vinculación activa de
OpenClaw para el destino exacto o cualquier descendiente generado no archivado
también rechaza el archivado. OpenClaw pagina la relación experimental
`thread/list ancestorThreadId` de Codex y falla de forma segura ante errores de solicitud o
respuesta, ciclos de cursores o hilos y el agotamiento del límite de seguridad. El
archivado nativo puede cerrar el trabajo cargado del elemento padre y sus
descendientes, por lo que el archivado no es un atajo para interrumpir. Las llamadas
de lectura, enumeración de descendientes y archivado no son atómicas. Un cliente
independiente aún puede poseer o iniciar trabajo en una fila que parezca inactiva o
`notLoaded` localmente. La confirmación de que no existe otro ejecutor cubre a
los clientes desconocidos y esa condición de carrera hasta que Codex disponga de un
archivado condicional o un arrendamiento entre procesos.
Se prohíbe el archivado mediante un Node emparejado.

No existe una vista de elementos archivados en el catálogo de Codex. Un hilo
restaurado con `thread/unarchive` en otra superficie de Codex autorizada por el
propietario vuelve a ser apto para el catálogo de elementos no archivados.

## Seguridad de los hilos activos

Codex serializa las modificaciones de un hilo entre los clientes de un mismo App
Server, pero no proporciona un arrendamiento exclusivo entre procesos para el
ejecutor ni para el propietario de las aprobaciones. Los App Servers stdio
independientes pueden añadir contenido a la misma ejecución, mientras que cada uno
solo ve su propio estado en memoria. Las solicitudes de aprobación también pueden
llegar a todos los suscriptores de un servidor, y la primera respuesta válida
completa la solicitud.

Por tanto:

- los clientes pasivos del catálogo no se suscriben ni deniegan automáticamente las aprobaciones
- las filas que actualmente se notifican como activas no ofrecen una rama nueva ni la opción de archivar
- un origen sin asignar se convierte en una rama con historial visible cuyo hilo
  del arnés canónico nunca reanuda el origen
- `notLoaded` se muestra como actividad desconocida y solo puede archivarse tras
  una confirmación fundamentada de que no existe otro ejecutor
- el archivado local requiere esa confirmación, además de una nueva lectura de `idle` o `notLoaded`,
  y reconoce la condición de carrera del protocolo entre la lectura y el archivado

La interrupción y la transferencia entre varios clientes son decisiones de producto
futuras. No están implícitas por el hecho de mostrar una fila activa.

## Límite de los Nodes emparejados

Actualmente, la invocación de Node solo admite solicitud y respuesta. Puede devolver
de forma segura metadatos limitados del catálogo y páginas de turnos de transcripción,
pero no puede transportar el flujo de eventos de larga duración, las solicitudes de
aprobación, las llamadas a herramientas, la cancelación y los deltas del asistente
que requiere una ejecución del arnés de Codex.

Por tanto, el contrato del Node admite listas y páginas de turnos de transcripción.
Las filas remotas siguen siendo legibles, pero **Continuar** y **Archivar** no están
disponibles, independientemente de su estado de inactividad. Una continuación remota
real requiere un ejecutor en el Node y un puente de transmisión que conserve las
mismas invariantes de aprobación y vinculación que el arnés local.

## Permisos

Cada equipo habilita la función localmente. Habilitar el Gateway no autoriza a otro
Node a leer sus metadatos de Codex. La capacidad del Node debe superar el
emparejamiento normal y la aprobación de la política de comandos.

El listado de la flota y la visualización de transcripciones utilizan el ámbito
`operator.write` del Gateway porque invocan Nodes emparejados. La continuación y el
archivado locales son acciones autenticadas del operador y siguen sujetos a las
comprobaciones del host y del estado.

El acceso autónomo de agentes y el acceso independiente mediante MCP son aspectos
separados. Los contratos de herramientas distribuidos
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` y `codex_session_interrupt` siguen perteneciendo al Plugin
`codex`. Con la supervisión habilitada, las lecturas sin procesar de
transcripciones mediante `codex_threads` y los campos de lista derivados de
transcripciones también requieren
`supervision.allowRawTranscripts`; cada bifurcación, cambio de nombre, archivado o desarchivado
mediante `codex_threads` requiere `supervision.allowWriteControls`. Ambas políticas están
deshabilitadas de forma predeterminada.

## Compatibilidad

`openclaw doctor --fix` migra la configuración distribuida de `plugins.entries.codex-supervisor`,
incluidos los endpoints y las políticas de transcripción y escritura, además de las
referencias de permisos y denegaciones del Plugin, a
`plugins.entries.codex.config.supervision`. Los valores canónicos explícitos de destino prevalecen en caso de
conflicto. Tras la migración, el código en tiempo de ejecución solo utiliza la forma
canónica del Plugin `codex`.

El Plugin oficial conserva exactamente cinco herramientas de compatibilidad de
Supervisor:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` y `codex_session_interrupt`. De forma predeterminada, la lista de sesiones
solo incluye las cargadas; no existe el parámetro `loaded_only`.
`include_stored: true` añade filas no archivadas de la base de datos de estado, limitadas
por endpoint mediante `max_stored_sessions` (valor predeterminado: 200; intervalo
aceptado: de 1 a 1,000); las filas cargadas no están limitadas por esta configuración.
Los campos y las lecturas derivados de transcripciones siguen estando controlados por
`allowRawTranscripts`; el envío y la interrupción siguen estando controlados por
`allowWriteControls`.

El envío de compatibilidad nunca inicia ni reanuda un hilo inactivo.
`mode: "start"` siempre se rechaza; `"auto"` y `"steer"` solo
dirigen un turno activo legible. La interrupción también requiere un turno activo
legible. La continuación de un hilo inactivo se dirige al catálogo nativo de Codex
para que el arnés completo gestione las aprobaciones, las herramientas y la
vinculación. El adaptador MCP heredado e independiente resuelve estas mismas
herramientas desde el Plugin oficial y es la única vía que respeta las variables de
entorno heredadas de políticas que se han conservado.

La interfaz de usuario del catálogo de julio, el método del Gateway, la capacidad del
Node y el registro de la CLI no se habían distribuido con el identificador anterior
del Plugin. Pasan directamente a ser propiedad de `codex` sin una segunda
fachada en tiempo de ejecución.

## Trabajo futuro

- ejecutor de transmisión en el Node y puente de eventos para la continuación remota
- arrendamientos explícitos del ejecutor y del propietario de las aprobaciones para la transferencia simultánea entre clientes
- archivado remoto cuando exista un arrendamiento de propiedad del ejecutor o un mecanismo de exclusión equivalente
- interrupción y observación más completa de las sesiones activas
- transferencia auditada entre Codex Desktop, la CLI y OpenClaw

La exploración de elementos archivados no forma parte de la barra lateral de
supervisión prevista. Las superficies nativas de Codex siguen siendo la vía de
recuperación para los hilos archivados.

## Pruebas de aceptación

- Al habilitar la supervisión, se enumeran las sesiones locales no archivadas.
- Las sesiones archivadas nunca aparecen en la respuesta del catálogo ni en la interfaz de usuario.
- Los hosts en buen estado permanecen visibles cuando otro host falla; un host no disponible
  no devuelve filas nuevas, en lugar de inventar un estado de sesión sin conexión.
- Una fila local almacenada o inactiva crea un reflejo en el Chat con un bloqueo de
  modelo/runtime exclusivo de Codex; el primer turno fija una instantánea temporal e inicia el
  hilo canónico del arnés completo, y al repetir Continue se abre el Chat existente.
- El primer turno omite las anulaciones de modelo/proveedor en la bifurcación de la instantánea y fija
  el inicio canónico al par exacto devuelto por Codex, incluso cuando Codex advierte
  que su modelo actual difiere del último modelo registrado de la fuente.
- Las vinculaciones supervisadas pendientes y confirmadas usan la conexión de supervisión para
  acceder a la fuente, crear la rama canónica y efectuar todos los turnos posteriores; las sesiones
  normales de Codex permanecen limitadas al agente.
- Las reanudaciones posteriores omiten las anulaciones de modelo/proveedor de OpenClaw, conservan la
  selección canónica persistida de Codex, aceptan cambios nativos independientes en ese hilo
  y nunca sustituyen el modelo externo de OpenClaw ni la cadena de reserva.
- Al deshabilitar la supervisión o perder el ciclo de vida de la vinculación/conexión, se produce un cierre seguro
  en lugar de trasladar el Chat al arnés normal del directorio principal del agente.
- Un Chat supervisado y bloqueado a un modelo no puede eliminarse mientras proteja la
  vinculación nativa.
- El Chat refleja como máximo 200 mensajes del usuario y del asistente, 512 KiB en total y
  64 KiB por mensaje. Las imágenes se convierten en marcadores de posición; no se clonan el razonamiento
  de la fuente, las llamadas a herramientas, los resultados de herramientas, las cargas de imágenes ni las rutas locales.
- El flujo de la rama nunca reanuda el hilo de origen.
- La fuente original sigue siendo apta para ambos catálogos. La rama nativa canónica
  usa el tipo de fuente `appServer` y no se garantiza que aparezca en
  Codex Desktop.
- Las fuentes locales activas no pueden crear una rama ni archivarse; un Chat supervisado
  existente sí puede abrirse.
- Las filas cuya actividad se desconoce pueden crear ramas sin confirmación; el archivado requiere
  la confirmación explícita de que no hay ningún otro ejecutor.
- Una fuente con una rama supervisada en inicialización o pendiente no puede archivarse
  hasta que el primer turno del Chat materialice la rama canónica.
- Un propietario de vinculación activo conocido para el destino exacto o cualquier descendiente generado
  no archivado bloquea el archivado; los fallos al enumerar los descendientes provocan un cierre seguro, y
  la confirmación explícita sigue siendo responsable de los clientes desconocidos y de la
  condición de carrera entre el estado y el archivado.
- El archivado local confirmado de una fuente almacenada o inactiva elimina la fila tras completarse correctamente la operación nativa.
- Las filas de nodos emparejados permanecen visibles sin Continue ni Archive.
- La enumeración pasiva nunca se suscribe a las aprobaciones de hilos ni responde a ellas.
- La configuración heredada de Supervisor migra a la forma de configuración canónica de Codex.
- La lista heredada solo se carga de forma predeterminada, la enumeración almacenada respeta su límite por endpoint
  y el envío de compatibilidad nunca inicia ni reanuda un hilo inactivo.
