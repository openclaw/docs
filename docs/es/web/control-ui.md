---
read_when:
    - Quiere operar el Gateway desde un navegador
    - Quieres acceder a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-12T14:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e9902cd8c2b7af0f47eaeec73cf365dd0f3963900b28880d4150939a1f447a2
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de página única de **Vite + Lit** servida por el Gateway:

- valor predeterminado: `http://<host>:18789/`
- prefijo opcional: establezca `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se ejecuta en el mismo equipo, abra [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no se carga, inicie primero el Gateway: `openclaw gateway`.

<Note>
En vinculaciones LAN nativas de Windows, el Firewall de Windows o una directiva de grupo administrada por la organización pueden seguir bloqueando la URL de LAN anunciada aunque `127.0.0.1` funcione en el host del Gateway. Ejecute `openclaw gateway status --deep` en el host de Windows; informa de puertos probablemente bloqueados, discrepancias de perfiles y reglas del firewall local que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del tablero conserva un token para la sesión de la pestaña actual del navegador y la URL del Gateway seleccionada; las contraseñas no se conservan. La incorporación suele generar un token del Gateway para la autenticación mediante secreto compartido en la primera conexión, pero la autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

La conexión desde un navegador o dispositivo nuevo suele requerir una **aprobación de emparejamiento única**, que se muestra como `disconnected (1008): pairing required`.

<Steps>
  <Step title="Enumerar las solicitudes pendientes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprobar mediante el ID de solicitud">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si el navegador vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`; vuelva a ejecutar `openclaw devices list` antes de aprobarla.

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura o administración se trata como una ampliación de la aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con permisos más amplios y solicita que se apruebe explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requiere una nueva aprobación, salvo que esta se revoque con `openclaw devices revoke --device <id> --role <role>`. Consulte la [CLI de dispositivos](/es/cli/devices) para obtener información sobre la rotación de tokens, la revocación y el flujo de aprobación de la primera ejecución de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas del navegador mediante bucle invertido local (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el recorrido de ida y vuelta del emparejamiento para las sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, se verifica la identidad de Tailscale y el navegador presenta su identidad de dispositivo. Los navegadores sin dispositivo y las conexiones con rol de nodo siguen sujetos a las comprobaciones normales de dispositivos.
- Las vinculaciones directas a Tailnet, las conexiones del navegador mediante LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar sus datos requiere volver a emparejarlo.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión para iOS/Android sin abrir un terminal:

<Steps>
  <Step title="Abrir el emparejamiento móvil">
    Seleccione **Devices** y, a continuación, haga clic en **Pair mobile device** en la tarjeta **Devices**.
  </Step>
  <Step title="Conectar el teléfono">
    En la aplicación móvil OpenClaw, abra **Settings** → **Gateway** y escanee el código QR. También puede copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La aplicación oficial para iOS/Android se conecta automáticamente. Si **Pending approval** muestra una solicitud, revise su rol y sus ámbitos antes de aprobarla.
  </Step>
</Steps>

La creación de un código de configuración requiere `operator.admin`; el botón está deshabilitado para las sesiones que no lo tengan. Un código de configuración contiene una credencial de arranque de corta duración, por lo que debe tratar el QR y el código copiado como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin cifrar está limitado al bucle invertido y a las direcciones LAN privadas. Consulte [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para obtener todos los detalles de seguridad y opciones alternativas.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) que se adjunta a los mensajes salientes para atribuirlos en sesiones compartidas. Se almacena en el navegador, se limita al perfil actual y no se sincroniza con otros dispositivos ni se conserva en el servidor más allá de los metadatos normales de autoría de la transcripción de los mensajes enviados. Al borrar los datos del sitio o cambiar de navegador, se restablece a un valor vacío.

La sustitución del avatar del asistente sigue el mismo patrón local del navegador: las sustituciones cargadas se superponen localmente a la identidad resuelta por el Gateway y nunca realizan un recorrido de ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue estando disponible para los clientes que no usan la interfaz y que escriben directamente en el campo.

## Punto de conexión de configuración en tiempo de ejecución

La interfaz de control obtiene su configuración de tiempo de ejecución de `/control-ui-config.json`, resuelta en relación con la ruta base de la interfaz de control del Gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Este punto de conexión está protegido por la misma autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y para obtenerlo correctamente se requiere un token o una contraseña válidos del Gateway, una identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abra **Settings** en la vista Simple para consultar la tarjeta **Gateway Host**, que muestra el equipo del Gateway, la dirección LAN, el sistema operativo, el entorno de ejecución, el tiempo de actividad, la carga de CPU, la memoria y el espacio en disco del volumen de estado. Mientras está visible, la tarjeta se actualiza cada 10 segundos mediante el RPC `system.info` del Gateway, que requiere el ámbito `operator.read`. Los Gateway antiguos y las conexiones sin ese ámbito omiten la tarjeta.

## Compatibilidad de idiomas

La interfaz de control se localiza durante la primera carga según la configuración regional del navegador. Para cambiarla posteriormente, abra **Settings -> General -> Language** (el selector se encuentra en la tarjeta de configuración rápida General, no en Appearance).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones a idiomas distintos del inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas posteriores.
- Las claves de traducción que faltan recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales distintas del inglés, pero el selector de idioma integrado de Mintlify en el sitio de documentación solo enumera los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Appearance incluye los temas integrados Claw, Knot y Dash (Claw es el predeterminado), además de un espacio de importación de tweakcn local del navegador. Para importar un tema, abra el [editor de tweakcn](https://tweakcn.com/editor/theme), elija o cree un tema, haga clic en **Share** y pegue el enlace copiado en Appearance. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin formato y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan únicamente en el perfil actual del navegador; no se escriben en la configuración del Gateway ni se sincronizan entre dispositivos. Al sustituir el tema importado, se actualiza el único espacio local; al borrarlo, se vuelve a Claw si el tema importado estaba activo.

Appearance también incluye una opción Text size local del navegador, almacenada con el resto de las preferencias de la interfaz de control. Se aplica al texto del chat, al texto del redactor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no amplíe automáticamente la vista al enfocarlas.

## Administrar plugins

Abra **Plugins** en la barra lateral o use `/settings/plugins` en relación con la
ruta base configurada de la interfaz de control para explorar y administrar
plugins sin salir de la interfaz de control. Por ejemplo, una ruta base de
`/openclaw` usa `/openclaw/settings/plugins`. La página está siempre disponible,
incluso cuando todos los plugins opcionales están deshabilitados.

Plugins es un centro con cuatro pestañas: **Installed** y **Discover** administran
el código de los plugins en `/settings/plugins`, **Skills** aloja el administrador
de habilidades por agente en `/skills` y **Workshop** aloja la revisión de
propuestas de Skill Workshop en `/skills/workshop`. Cada pestaña mantiene su
propia URL y la barra lateral muestra una única entrada Plugins para todas ellas.

La pestaña **Installed** muestra el inventario local completo agrupado por categoría,
con recuentos generales. Cada fila abre una vista detallada; su menú de desbordamiento
(`…`) permite habilitar o deshabilitar el plugin y ofrece **Remove** para los plugins
instalados externamente. También enumera los [servidores MCP](/es/cli/mcp) configurados y
permite añadirlos, deshabilitarlos y eliminarlos en línea. La pestaña **Discover** es
la tienda: plugins destacados incluidos con OpenClaw, plugins externos oficiales y
conectores MCP de un solo clic para servicios populares. Al escribir en el cuadro de
búsqueda, se consulta [ClawHub](https://clawhub.ai/plugins) en línea y se añade una
sección **From ClawHub** con recuentos de descargas e insignias de verificación de
origen. Los enlaces profundos pueden apuntar directamente a la tienda mediante
`/settings/plugins?tab=discover`.

La pestaña **Skills** conserva el informe de estado de habilidades, los interruptores
para habilitarlas o deshabilitarlas, la introducción de la clave de API y la búsqueda
en línea de habilidades de ClawHub, todo ello limitado al agente seleccionado. La
pestaña **Workshop** conserva el tablero de Skill Workshop y el flujo de revisión Today
para las [propuestas de habilidades](/es/tools/skill-workshop).

Los plugins incluidos ya están presentes en el Gateway y muestran **Enable** o
**Disable** en lugar de **Install**. Por ejemplo, Workboard se incluye con
OpenClaw, pero está deshabilitado de forma predeterminada, por lo que su acción es
**Enable**. Los plugins incluidos en el paquete no pueden eliminarse; solo pueden
deshabilitarse.

La lectura del catálogo y la búsqueda en ClawHub requieren `operator.read`. Instalar,
habilitar, deshabilitar o eliminar un plugin, así como modificar los servidores MCP,
requiere `operator.admin`; estas acciones permanecen deshabilitadas para los operadores
con acceso de solo lectura.

Las instalaciones desde ClawHub se ejecutan mediante el Gateway y mantienen las mismas
comprobaciones de confianza, integridad y directivas de instalación de plugins que
otras instalaciones mediadas por el Gateway. Instalar o eliminar código de plugins
requiere reiniciar el Gateway. Habilitar o deshabilitar un plugin instalado puede
aplicarse sin reiniciar cuando el plugin y el entorno de ejecución actual del Gateway
lo admiten; de lo contrario, la interfaz informa de que es necesario reiniciar. Los
conectores MCP respaldados por OAuth requieren ejecutar una sola vez
`openclaw mcp login <name>` desde la CLI después de añadirlos.

La página se centra intencionadamente en el inventario, la detección, la instalación,
la habilitación y la eliminación. Use [`openclaw plugins`](/es/cli/plugins) para fuentes
npm, git o de rutas locales arbitrarias, actualizaciones y configuración avanzada de
plugins.

## Navegación de la barra lateral

La barra lateral fija la navegación sobre una lista de sesiones desplazable. En configuraciones multiagente, cada agente aparece como una sección principal contraíble; al expandir un agente, se pueden explorar sus sesiones sin salir del chat abierto, y los agentes contraídos muestran un indicador de elementos no leídos. Dentro de un agente, la lista se divide en **Fijadas**, una sección integrada por cada canal conectado (Telegram, Slack, WhatsApp, ...), una sección integrada **Trabajo** para las sesiones vinculadas a un árbol de trabajo administrado o un nodo de ejecución (las filas muestran una línea `repo ⎇ branch` además del host del nodo), grupos personalizados (la `category` de la sesión) y **Chats** para el resto. Las secciones de canales y Trabajo clasifican las filas automáticamente; la asignación de una sesión a un grupo personalizado siempre tiene prioridad. Al abrir una sesión, se mueve el resaltado de selección sin reordenar las filas. Las sesiones con actividad nueva desde la última vez que se leyeron muestran un punto de no leído, y al abrir una se marcan como leídas. Cada fila de sesión tiene un menú contextual (botón de tres puntos verticales o clic con el botón derecho) con Fijar/Desfijar, Marcar como no leída/leída, Cambiar nombre, Bifurcar, Mover al grupo (incluidos Nuevo grupo y Quitar del grupo), Archivar y Eliminar; en los diseños táctiles, los controles directos de fijación y menú permanecen visibles. Cmd/Ctrl-clic alterna la inclusión de filas en una selección múltiple, y Mayús-clic la amplía según el orden visible; al abrir el menú en una fila seleccionada, se ofrecen acciones por lotes (Marcar N como no leídas/leídas, Mover N al grupo, Archivar N, Eliminar N) que se aplican a todas las sesiones seleccionadas, con una única confirmación para la eliminación por lotes. Arrastre una sesión hasta un grupo personalizado o **Chats** para moverla. Los encabezados de grupos personalizados se pueden contraer, expandir o arrastrar para reordenarlos; los nombres de los grupos y su orden se almacenan en el Gateway (`sessions.groups.*`), por lo que se conservan entre navegadores, mientras que el estado contraído permanece en el perfil del navegador. Los encabezados de grupo también tienen un menú (botón de tres puntos verticales o clic con el botón derecho) con Cambiar nombre del grupo, Nuevo grupo y Eliminar grupo; cambiar el nombre de un grupo o eliminarlo actualiza en el servidor todas las sesiones que pertenecen a él, incluidas las archivadas, y al eliminar un grupo se conservan sus sesiones y se devuelven a Chats. El único **+** del encabezado de la lista de sesiones abre la página Nueva sesión (véase más adelante). El control de ordenación también tiene una opción Agrupar por: Agrupadas (valor predeterminado) o Ninguno para mostrar una única lista plana (Fijadas permanece separada); la elección se almacena en el perfil actual del navegador. **Uso**, **Automatizaciones** y **Plugins** están fijados de forma predeterminada; expanda **Más** para acceder a todos los demás destinos. Seleccione **Editar elementos fijados** en Más, o haga clic con el botón derecho en el área de navegación, para fijar o desfijar destinos y restaurar los valores predeterminados. El conjunto de elementos fijados y el estado de expansión de Más se almacenan en el perfil actual del navegador y se conservan tras las recargas.

## Página Nueva sesión

El **+** del encabezado de la lista de sesiones de la barra lateral abre un borrador de página completa en `/new`: no se crea nada hasta que se envía el primer mensaje. Una fila de destino sobre el cuadro de mensaje permite elegir dónde funciona la sesión: el agente (en configuraciones multiagente), dónde se ejecutan los procesos (**Gateway · local** o un nodo emparejado que exponga `system.run`; requiere `operator.admin`), la carpeta (de forma predeterminada, el espacio de trabajo del agente; otras rutas absolutas del Gateway requieren `operator.admin` y un árbol de trabajo) y un control opcional **Árbol de trabajo** con un selector de rama base (respaldado por `worktrees.branches`, por lo que no se realiza ninguna obtención) y un nombre opcional para el árbol de trabajo (la rama se convierte en `openclaw/<name>`). El botón de exploración de la etiqueta de carpeta abre un selector de directorios en línea respaldado por el método `fs.listDir`, disponible solo para administradores. Su nivel superior muestra el Gateway y todos los nodos conocidos; los nodos sin conexión y aquellos que no admiten la exploración de directorios permanecen visibles, pero deshabilitados. Al seleccionar el Gateway, se comienza desde la carpeta actual o el directorio de inicio del Gateway. Al seleccionar un nodo compatible, se explora el sistema de archivos del host de ese nodo, se vincula la ejecución a él y se usa directamente la ruta absoluta seleccionada del nodo (los árboles de trabajo administrados siguen estando disponibles solo en el Gateway). Al enviar, se llama a `sessions.create` con el primer mensaje, por lo que la ejecución comienza en el mismo recorrido de ida y vuelta y la interfaz salta al chat de la nueva sesión. Si el Gateway crea la sesión, pero rechaza ese primer envío, el chat conserva el mensaje y el error tras las recargas; **Reintentar** lo envía mediante la sesión ya creada en lugar de crear otra.

Dentro de **Configuración**, la barra lateral específica comienza con un campo **Buscar en la configuración** para encontrar rápidamente las secciones de configuración.

  Un campo **Buscar** en la parte superior de la barra lateral abre la paleta de comandos (⌘K). Al hacer clic en la marca OpenClaw del encabezado de la barra lateral, se abre la pantalla inicial limpia de Nueva sesión. Cuando algo requiere atención —tareas Cron fallidas o atrasadas, autenticación de modelos próxima a caducar o caducada—, aparecen indicadores compactos de atención sobre el pie de la barra lateral que enlazan con la página responsable. El pie compacto mantiene juntos el estado de la conexión, **Configuración**, **Documentación**, el emparejamiento móvil y el selector de modo de color claro/oscuro/del sistema; cuando el Gateway se ejecuta desde un checkout del código fuente en una rama distinta de `main`, el pie también muestra el nombre de esa rama en rojo para que resulte evidente de un vistazo que el Gateway no corresponde a una versión publicada (nunca se muestra en instalaciones de versiones publicadas). Mayús-Comando-Coma abre **Configuración** sin sustituir el atajo Comando-Coma del navegador. El encabezado de la barra lateral también contiene el selector para contraerla (⌘B); al contraerla, la barra lateral se oculta por completo para disponer de un espacio de trabajo de ancho completo, y un control flotante para expandirla (o ⌘B) la restaura; en su lugar, la aplicación para macOS integra ese selector de forma nativa en la barra de título. La barra lateral es el único elemento visual de navegación en el escritorio, sin barra superior. En ventanas estrechas, la barra lateral se sustituye por un panel superpuesto deslizable detrás de una fila de encabezado compacta que contiene el selector del panel, la marca y la búsqueda de la paleta de comandos; en la aplicación para macOS, esa fila de encabezado integra el espacio reservado para la barra de título en una única franja compacta junto a los controles de la ventana. La navegación utiliza el historial normal del navegador, por lo que sus botones de retroceso y avance permiten recorrerla; la aplicación para macOS añade un selector nativo de la barra lateral junto a los controles de la ventana, además de gestos de deslizamiento en el trackpad, con botones de retroceso y avance en el borde derecho de la barra lateral mientras está expandida, y botones nativos de búsqueda (paleta de comandos) y nueva sesión mientras está contraída.

  ## Qué puede hacer (actualmente)

  <AccordionGroup>
  <Accordion title="Chat y conversación">
    - Conversar con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial del chat solicitan una ventana reciente limitada con límites de texto por mensaje, de modo que las sesiones grandes no obliguen al navegador a representar la carga completa de la transcripción antes de que el chat pueda utilizarse.
    - Al pasar el cursor o enfocar con el teclado un enlace público a una incidencia o solicitud de incorporación de cambios de GitHub, se muestran su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché los metadatos públicos sin cambiar el destino del enlace, incluso cuando la interfaz utiliza un Gateway remoto. El Gateway utiliza `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, tras confirmar que el repositorio es público; de lo contrario, utiliza la API anónima de GitHub con una caché de mayor duración.
    - Conversar mediante sesiones en tiempo real del navegador. OpenAI utiliza WebRTC directo, Google Live utiliza un token de navegador de un solo uso y con permisos restringidos mediante WebSocket, y los plugins de voz en tiempo real exclusivos del backend utilizan el transporte de retransmisión del Gateway. Las sesiones gestionadas por el cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite el audio PCM del micrófono mediante `talk.session.appendAudio`, reenvía las llamadas de herramientas `openclaw_agent_consult` del proveedor mediante `talk.client.toolCall` para aplicar las políticas del Gateway y usar el modelo OpenClaw configurado de mayor capacidad, y dirige el control por voz de las ejecuciones activas mediante `talk.client.steer` o `talk.session.steer`.
    - Transmitir llamadas de herramientas y tarjetas de salida de herramientas en tiempo real en el chat (eventos del agente). La actividad de las herramientas se representa en filas adaptadas a cada tipo: los comandos de shell muestran el comando con resaltado de sintaxis y una salida de estilo terminal; las llamadas de edición y escritura compatibles muestran diferencias en línea limitadas, números de línea cuando están disponibles y estadísticas de `+added -removed`; y las llamadas consecutivas se contraen en un resumen como «Se ejecutaron 13 comandos, se leyeron 6 archivos y se editaron 9 archivos». Mientras una ejecución está activa, la llamada en ejecución más reciente da nombre al encabezado del grupo. Expanda una fila para examinar los argumentos restantes y la salida sin procesar.
    - Títulos de propósito generados opcionalmente por IA para llamadas de herramientas complejas (comandos de shell largos y herramientas de plugins con muchos argumentos), habilitados con `gateway.controlUi.toolTitles: true` (desactivado de forma predeterminada). Los títulos proceden del método por lotes `chat.toolTitles` mediante el enrutamiento estándar de modelos auxiliares: un `utilityModel` explícito (proveedor elegido por el operador, como en otras tareas auxiliares) o, en su defecto, el modelo pequeño predeterminado declarado por el proveedor de la sesión, y se almacenan en caché en el Gateway por agente. Cuando la opción voluntaria está desactivada o no puede utilizarse ningún modelo económico, las filas conservan sus etiquetas deterministas y no se realiza ninguna llamada a un modelo.
    - Iniciar o descartar tareas de seguimiento efímeras sugeridas por el modelo; las sugerencias aceptadas abren una nueva sesión en un árbol de trabajo administrado con la instrucción propuesta.
    - Pestaña de actividad con resúmenes locales del navegador, redactados antes de mostrarse, sobre la actividad de herramientas en tiempo real procedente de la entrega existente de eventos `session.tool` / eventos de herramientas.

  </Accordion>
  <Accordion title="Canales, sesiones y memoria">
    - Canales: estado de los canales integrados y de los canales de plugins incluidos/externos, inicio de sesión mediante QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de comprobación de los canales mantienen visible la instantánea anterior mientras finalizan las comprobaciones lentas de los proveedores y etiquetan las instantáneas parciales cuando una comprobación o auditoría supera el tiempo asignado por la interfaz.
    - Sesiones: mostrar de forma predeterminada las sesiones de los agentes configurados, fijar las sesiones frecuentes, cambiarles el nombre, archivar o restaurar sesiones inactivas, recurrir a alternativas cuando las claves de sesión de agentes no configurados estén obsoletas y aplicar ajustes específicos por sesión para el modelo, el pensamiento, el modo rápido, el nivel de detalle, el seguimiento y el razonamiento (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan antes que las sesiones recientes no fijadas; las sesiones archivadas se encuentran en la vista de archivadas de la página Sesiones y conservan sus transcripciones. Las filas muestran un punto de no leído para las sesiones con actividad posterior a su última lectura, con acciones para marcar como no leído o leído (`sessions.patch { unread }`), y una acción Bifurcar que ramifica la transcripción en una sesión nueva (`sessions.create { parentSessionKey, fork: true }`). Los mosaicos de resumen situados sobre la tabla sintetizan el conjunto cargado (número de sesiones, ejecuciones activas, sesiones no leídas y total de tokens); cada fila incluye un glifo de tipo con un punto de ejecución activa, el estado se representa como un punto sencillo acompañado de una etiqueta y la columna Tokens muestra un medidor de uso de la ventana de contexto cuando la sesión informa de las cantidades de tokens y del contexto. Las acciones de administración de las filas se encuentran en un menú específico de cada fila (botón de tres puntos verticales o clic con el botón derecho) que reproduce el menú de sesiones de la barra lateral, y el panel de la fila incluye el entorno de ejecución del agente y la duración de la ejecución junto con los demás detalles de la sesión.
    - Agrupación de sesiones: un control Agrupar por organiza la tabla de sesiones en secciones según grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados se conservan por sesión mediante `sessions.patch` (`category`), por lo que también pueden clasificarse las sesiones iniciadas desde canales de mensajería (Discord, Telegram, WhatsApp, ...); asigne grupos arrastrando las filas a una sección o mediante el selector de grupo de cada fila, y cree grupos con la acción Nuevo grupo.
    - Memoria (una pestaña de la página Agentes, limitada al agente seleccionado): estado de Dreaming, selector para activar o desactivar y lector del Diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, tareas, plugins, skills, dispositivos, aprobaciones de ejecución">
    - Automatizaciones (trabajos cron): tarjetas de estadísticas (cantidad de automatizaciones, cantidad con errores, estado del planificador, próxima activación) encima de un selector de pestañas Automatizaciones/Historial de ejecuciones; la pestaña Automatizaciones muestra los trabajos en una tabla filtrable (Todos/Activos/En pausa, búsqueda, filtros de programación y última ejecución, menú de acciones por fila) con sugerencias iniciales debajo, y la pestaña Historial de ejecuciones muestra las ejecuciones recientes de todas las automatizaciones (`cron.*`).
    - Tareas: registro en vivo de las tareas en segundo plano activas y recientes, con sesiones vinculadas y cancelación (`tasks.*`).
    - Plugins: explora el inventario instalado y la tienda seleccionada, busca en ClawHub, instala y elimina código de plugins, y activa o desactiva los plugins instalados (`plugins.*`); las filas de servidores MCP editan `mcp.servers` mediante los métodos de configuración.
    - Skills: estado, activación/desactivación, instalación y actualización de claves de API (`skills.*`).
    - Dispositivos: un único inventario combina los registros de dispositivos emparejados, el catálogo de nodos y la presencia en vivo (`device.pair.list`, `node.list`, `system-presence`). El host del Gateway aparece fijado en primer lugar; los clientes emparejados muestran el estado de conexión, los roles, los tokens, las capacidades y los comandos. Los emparejamientos duplicados se agrupan en un grupo expandible, y **Limpiar N obsoletos** elimina en bloque, previa confirmación del administrador, los duplicados sin conexión que se aprobaron automáticamente (local silencioso, CIDR de confianza o verificado mediante SSH) o que son anteriores a la procedencia de la aprobación. Las entradas se pueden eliminar (`node.pair.remove`, `device.pair.remove`), el emparejamiento de dispositivos y las nuevas aprobaciones de nodos se gestionan en línea (`device.pair.*`, `node.pair.approve`/`reject`), y los códigos de configuración para dispositivos móviles se crean desde la misma tarjeta.
    - Aprobaciones de ejecución: edita las listas de permitidos del Gateway o del nodo y la política de consulta para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Consulta/edita `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Perfil: una página de configuración que muestra la identidad del agente predeterminado con estadísticas de uso históricas: tokens acumulados, día de mayor actividad, sesión más larga, rachas de actividad, un mapa de calor de tokens de un año, herramientas principales y aspectos destacados de los canales (`usage.cost`, `sessions.usage`).
    - MCP tiene una página de configuración dedicada con filas de servidores de solo lectura (transporte, activación, resúmenes de OAuth/filtros/paralelismo), comandos habituales para operadores y el editor de configuración `mcp` con ámbito limitado; los servidores se añaden, activan/desactivan y eliminan en la página Plugins.
    - Proveedores de modelos: una página de configuración que muestra todos los proveedores de modelos configurados con su icono de marca, estado de autenticación (`models.authStatus`), disponibilidad de modelos (`models.list`), datos en vivo del plan, la cuota y la facturación cuando el proveedor los comunica (`usage.status`), y el gasto de las sesiones locales durante los últimos 30 días (`sessions.usage`). La acción Actualizar vuelve a leer el estado de las credenciales y el uso del proveedor.
    - Conexión: una página de configuración (en **Conexiones**) que administra el propio enlace del panel con el Gateway: URL de WebSocket, token del Gateway, contraseña y clave de sesión predeterminada, además de la instantánea más reciente del protocolo de enlace (estado, tiempo de actividad, intervalo de pulsos y última actualización de canales). La pantalla de inicio de sesión sin conexión gestiona el caso de desconexión; esta página edita la conexión mientras está conectada.
    - Aplica y reinicia con validación (`config.apply`) y, a continuación, activa la última sesión activa.
    - Las escrituras incluyen una protección mediante hash base para evitar sobrescribir ediciones simultáneas.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución activa de SecretRef para las referencias incluidas en la carga útil de configuración enviada; las referencias activas enviadas que no se puedan resolver se rechazan antes de la escritura.
    - Al guardar formularios, se descartan los marcadores de posición censurados obsoletos que no se puedan restaurar desde la configuración guardada, mientras se conservan los valores censurados que todavía correspondan a secretos guardados.
    - El esquema y la representación del formulario proceden de `config.schema` / `config.schema.lookup`, incluidos los campos `title`/`description`, las indicaciones de interfaz coincidentes, los resúmenes de elementos secundarios inmediatos, los metadatos de documentación en nodos anidados de objeto/comodín/matriz/composición y, cuando estén disponibles, los esquemas de plugins y canales. El editor de JSON sin procesar solo está disponible cuando la instantánea permite una conversión de ida y vuelta segura del contenido sin procesar; en caso contrario, la interfaz de control impone el modo Formulario.
    - La opción "Restablecer a lo guardado" del editor de JSON sin procesar conserva la estructura creada directamente en el contenido sin procesar (formato, comentarios y disposición de `$include`) en lugar de volver a representar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede realizar de forma segura la conversión de ida y vuelta.
    - Los valores de objeto SecretRef estructurados se muestran como de solo lectura en las entradas de texto del formulario para evitar daños accidentales al convertir objetos en cadenas.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens y costes estimados derivado de las sesiones se mantiene separado de la facturación del proveedor.
    - Las tarjetas de proveedores llaman a `usage.status` y muestran los nombres de planes en vivo, los períodos de cuota, los saldos, los gastos y los presupuestos comunicados por los plugins de proveedores configurados.
    - Un error en el uso de un proveedor no bloquea el panel de sesiones/costes; las tarjetas de proveedores no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de la interfaz de control, tiempos de representación lentos del chat o la configuración y entradas de capacidad de respuesta del navegador correspondientes a fotogramas de animación prolongados o tareas largas cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en vivo de los registros de archivos del Gateway con filtrado/exportación (`logs.tail`).
    - Actualización: ejecuta una actualización del paquete/git y un reinicio (`update.run`) con un informe de reinicio y, después, consulta periódicamente `update.status` tras la reconexión para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de automatizaciones">
    - Al seleccionar una fila, se abre una vista detallada de página completa con un selector Activa/En pausa y Ejecutar ahora en el encabezado (ejecutar si corresponde, clonar y eliminar en su menú); la pestaña Configuración permite editar la automatización en línea (instrucción, detalles, frecuencia y ajustes avanzados), y la pestaña Historial de ejecuciones muestra las ejecuciones de esa automatización.
    - Las automatizaciones iniciales situadas debajo de la tabla rellenan previamente el formulario de creación con una instrucción y una programación editables.
    - Para las tareas aisladas, la entrega predeterminada consiste en anunciar un resumen; cambia a ninguna para las ejecuciones exclusivamente internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de Webhook HTTP(S) válida.
    - Para las tareas de la sesión principal, están disponibles los modos de entrega Webhook y ninguna.
    - Los controles de edición avanzada incluyen eliminar después de la ejecución, borrar la sustitución del agente, opciones exactas/escalonadas de cron, sustituciones del modelo/razonamiento del agente y selectores de entrega según el mejor esfuerzo.
    - La validación del formulario se muestra en línea con errores específicos de cada campo; los valores no válidos desactivan el botón de guardado hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token de portador dedicado; si se omite, el Webhook se envía sin un encabezado de autenticación.
    - `cron.webhook` es una alternativa heredada obsoleta: ejecuta `openclaw doctor --fix` para migrar los trabajos almacenados que todavía usan `notify: true` a una entrega explícita por Webhook o de finalización para cada trabajo.

  </Accordion>
</AccordionGroup>

## Página de MCP

La página dedicada de MCP es una vista para operadores de los servidores MCP administrados por OpenClaw en `mcp.servers`. No inicia por sí misma los transportes MCP; úsala para inspeccionar y editar la configuración guardada y, a continuación, usa `openclaw mcp doctor --probe` cuando necesites comprobar el servidor en vivo.

Flujo de trabajo habitual:

1. Abre **MCP** desde la barra lateral.
2. Consulta las tarjetas de resumen para conocer las cantidades total, de servidores activados, con OAuth y filtrados.
3. Revisa cada fila de servidor para comprobar el transporte, la activación, la autenticación, los filtros, los tiempos de espera y las sugerencias de comandos.
4. Administra los servidores (añadir, activar/desactivar, eliminar) en la página **Plugins**, que es el único editor interactivo de `mcp.servers`; la lista de filas de esta página enlaza con ella.
5. Edita la sección de configuración `mcp` con ámbito limitado para definir servidores, encabezados, rutas TLS/mTLS, metadatos de OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para escribir la configuración o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde un terminal para realizar diagnósticos estáticos, comprobaciones en vivo o descartar el entorno de ejecución almacenado en caché.

La página censura los valores similares a URL que contienen credenciales antes de representarlos y pone entre comillas los nombres de servidor en los fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres del shell. Referencia completa de la CLI y la configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad se encuentra en **Configuración › Sistema**, junto a Registros y Depuración. Es un observador efímero y local del navegador para la actividad de herramientas en vivo, derivado del mismo flujo de eventos `session.tool` / de herramientas del Gateway que alimenta las tarjetas de herramientas del Chat. No añade otra familia de eventos, otro endpoint, un almacén de actividad persistente, un canal de métricas ni un flujo de observación externo al Gateway.

Las entradas de Actividad solo conservan resúmenes saneados y vistas previas de salida censuradas y truncadas. Los valores de los argumentos de las herramientas no se almacenan en el estado de Actividad; la interfaz indica que los argumentos están ocultos y registra únicamente la cantidad de campos de argumentos. La lista en memoria corresponde a la pestaña actual del navegador, se conserva durante la navegación dentro de la interfaz de control y se restablece al recargar la página, cambiar de sesión o usar **Borrar**.

## Terminal del operador

El terminal acoplable del operador está desactivado de forma predeterminada. Para activarlo, establece `gateway.terminal.enabled: true` y reinicia el Gateway. El terminal requiere una conexión `operator.admin` y abre un PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas corresponden al agente de chat seleccionado actualmente.

<Warning>
El terminal es un shell del host sin confinamiento y hereda el entorno del proceso del Gateway. Actívalo únicamente en implementaciones con operadores de confianza. OpenClaw rechaza las sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Usa **Ctrl + acento grave** para alternar el panel acoplable. El diseño permite acoplarlo en la parte inferior o derecha, cambia de tamaño con el área visible del navegador y mantiene varias pestañas de shell. Consulta [Configuración del Gateway](/es/gateway/configuration-reference#gateway) para obtener información sobre `gateway.terminal.enabled` y la sustitución opcional `gateway.terminal.shell`.

Las sesiones sobreviven a las desconexiones: una recarga de página, la suspensión del portátil o una interrupción de red desvincula la sesión en el Gateway en lugar de finalizarla, y la misma pestaña del navegador vuelve a vincularla al reconectarse y reproduce la salida reciente. Las sesiones desvinculadas finalizan después de `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300 segundos; `0` restablece la finalización al desconectarse). `terminal.list` muestra las sesiones que se pueden vincular, `terminal.attach` adopta una (toma de control al estilo tmux) y `terminal.text` lee la salida reciente de una sesión como texto sin formato sin vincularse, una función destinada a agentes y herramientas.

El terminal también está disponible como documento de pantalla completa dedicado exclusivamente al terminal en `/?view=terminal`. Las aplicaciones para iOS y Android integran esta página en sus pantallas de Terminal y reutilizan las credenciales almacenadas del Gateway; la disponibilidad está sujeta a los mismos requisitos de `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece el terminal.

## Panel del navegador

La interfaz de control incluye un panel del navegador acoplable que representa el navegador controlado por el Gateway (el mismo que los agentes controlan mediante la [herramienta de navegador](/es/tools/browser-control)) en cualquier navegador web convencional, sin requerir una vista web nativa. Aparece cuando el Gateway conectado anuncia `browser.request` a una conexión `operator.admin`; el botón del globo terráqueo en la barra del espacio de trabajo de la sesión lo alterna. El panel muestra una instantánea de la página en vivo con pestañas, una barra de URL editable, botones de retroceso/avance/recarga y la opción de abrir en el navegador; puede acoplarse a la derecha o abajo, y transmite los clics, el desplazamiento con la rueda y la escritura básica a la página remota.

Dos modos de captura empaquetan el contexto de la página para el agente:

- **Anotar (lápiz)**: dibuje marcas a mano alzada sobre la página. **Enviar al chat** integra los trazos en la captura de pantalla, adjunta la imagen al redactor del chat activo y rellena previamente un mensaje que describe la URL y el título de la página, así como cada región marcada, para que el agente sepa exactamente qué se ha rodeado.
- **Inspeccionar (puntero)**: pase el cursor para ver el elemento situado debajo (selector, nombre accesible, rol y tamaño); haga clic para enviar los detalles de ese elemento y una captura de pantalla resaltada mediante el mismo flujo del redactor. La inspección, el desplazamiento con la rueda y la navegación hacia atrás o adelante requieren `browser.evaluateEnabled` (activado de forma predeterminada).

La aplicación para macOS mantiene su barra lateral nativa del navegador de enlaces para los enlaces en los que se hace clic desde el panel; el panel del navegador también funciona allí y permite anotar páginas en todas las demás plataformas.

## Comportamiento del chat

  <AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma la recepción inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de confianza de la interfaz de control también pueden recibir metadatos opcionales de temporización de la confirmación para diagnósticos locales.
    - Las cargas del chat aceptan imágenes y archivos que no sean de vídeo. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios administrados y se muestran en el historial como enlaces de archivos adjuntos.
    - Volver a enviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` tras completarse.
    - Las respuestas de `chat.history` tienen un límite de tamaño para proteger la interfaz. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y sustituir mensajes demasiado grandes por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se ha truncado en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de la transcripción normalizada para visualización mediante `chat.message.get`, usando `sessionKey`, el `agentId` activo cuando sea necesario y el `messageId` de la transcripción. Si el Gateway sigue sin poder devolver más contenido, el lector muestra un estado explícito de indisponibilidad en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas o del asistente se conservan como referencias a medios administrados y se vuelven a servir mediante URL de medios autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al representar `chat.history`, la interfaz de control elimina del texto visible del asistente las etiquetas de directivas insertadas que solo sirven para visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y los bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en formato ASCII o de ancho completo. Omite las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista del chat mantiene visibles los mensajes optimistas locales del usuario y del asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica sustituye esos mensajes locales cuando el historial del Gateway se pone al día.
    - Los eventos `chat` en directo representan el estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción duradera de la sesión. Después de los eventos finales de herramientas, la interfaz de control vuelve a cargar el historial y combina únicamente una pequeña cola optimista; el límite de la transcripción se documenta en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones exclusivas de la interfaz (sin ejecución del agente ni entrega al canal).
    - La barra lateral enumera todas las sesiones activas cargadas por sección de agente y por grupos de fijadas, canales, trabajo, personalizados y Chats, con una única acción Nueva sesión que abre el cuadro de diálogo de borrador. Abrir una fila visible solo mueve el resaltado. Los grupos personalizados se pueden contraer y reordenar arrastrándolos, y las sesiones se pueden soltar en un grupo o en Chats; los nombres y el orden de los grupos se sincronizan mediante el Gateway, mientras que el estado contraído permanece en el navegador. Una sesión nueva del panel obtiene de forma asíncrona un título generado y conciso a partir de su primer mensaje que no sea un comando; los nombres explícitos nunca se sustituyen. Configure `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para dirigir esta llamada de modelo independiente a un modelo de menor coste. Expandir la sección de otro agente permite explorar las sesiones de ese agente sin abandonar el chat abierto.
    - La búsqueda de sesiones se encuentra en la paleta de comandos (⌘K o el campo Buscar en la parte superior de la barra lateral): al escribir una consulta, se recorre un número limitado de páginas coincidentes entre agentes, se filtran las filas internas secundarias o de Cron y se enumeran las coincidencias visibles junto a los comandos de navegación. La página Sesiones conserva la lista exhaustiva que permite búsquedas y filtros.
    - Cada fila de la barra lateral mantiene acceso directo para fijarla y un menú contextual completo para el estado no leído, cambio de nombre, bifurcación, agrupación, archivado y eliminación. Las filas seleccionadas conjuntamente (Cmd/Ctrl-clic, Mayús-clic para intervalos) obtienen un menú por lotes que incluye el estado no leído, la agrupación, el archivado y la eliminación; archivar o eliminar por lotes permanece deshabilitado salvo que todas las sesiones seleccionadas se puedan archivar. No se pueden archivar una ejecución activa ni la sesión principal de un agente. Al archivar o eliminar la sesión seleccionada actualmente, Chat vuelve a la sesión principal de ese agente.
    - En la aplicación para macOS, la marca de OpenClaw utiliza la franja de la barra de título nativa que, de otro modo, estaría vacía junto a los controles de la ventana, en vez de ocupar una fila de la barra lateral.
    - En anchos de escritorio, los controles del chat permanecen en una única fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados que solo contienen texto se representan como una única burbuja con una insignia de cantidad. Los mensajes que incluyen imágenes, archivos adjuntos, resultados de herramientas o vistas previas de Canvas no se contraen.
    - Cuando el checkout de una sesión se encuentra en una rama no predeterminada de un repositorio de GitHub, la vista del chat fija fichas de solicitudes de incorporación de cambios encima del cuadro de redacción: número de PR, repositorio, rama, cantidades de diferencias, una píldora de CI y estado de borrador, fusionado o cerrado, cada uno con un enlace al PR. La fila muestra como máximo dos fichas —primero los PR activos (abiertos o en borrador)— y un botón «Mostrar más» revela el historial contraído de PR fusionados o cerrados. La píldora de CI abre una pequeña ventana emergente de supervisión de CI con las cantidades de comprobaciones superadas, fallidas, en ejecución y omitidas, además de un enlace a la página de comprobaciones del PR. La detección se ejecuta en el servidor mediante `controlUi.sessionPullRequests`, que reutiliza el `GH_TOKEN`/`GITHUB_TOKEN` del Gateway cuando está configurado. Cuando se alcanza el límite de solicitudes de la API de GitHub, las fichas conservan el último estado conocido y muestran una advertencia de que el estado puede estar desactualizado; descartar una ficha la oculta para esa sesión en el perfil actual del navegador.
    - El panel de diferencias de la sesión muestra lo que realmente ha cambiado el checkout de una sesión: el botón de rama (en el encabezado de la barra del espacio de trabajo, en el encabezado del panel dividido o en el botón flotante del chat de un solo panel) abre el panel de detalles con una diferencia por archivo del trabajo de la rama, sin confirmar y sin seguimiento respecto de la base de fusión de la rama predeterminada del checkout: punto de estado, flecha de cambio de nombre, cantidades +/− por archivo, archivos contraíbles y marcadores de «N líneas sin modificar» entre fragmentos. Las diferencias se calculan en el servidor mediante el método `sessions.diff` del Gateway (ámbito `operator.read`); los archivos binarios y demasiado grandes se reducen a entradas que solo muestran estadísticas, y el botón aparece únicamente cuando el Gateway conectado anuncia `sessions.diff`.
    - La barra del espacio de trabajo de la sesión de cada panel de Chat enumera los archivos de la sesión, los archivos del proyecto y los artefactos. De forma predeterminada, se acopla al borde derecho del panel; arrastre su encabezado (o use el botón de acoplamiento) para moverla a la parte inferior, y la elección se almacena en el perfil actual del navegador. Una barra contraída no ocupa espacio alguno: vuelva a abrirla con ⇧⌘B, con el conmutador de archivos del encabezado del panel dividido o con el botón flotante de archivos del chat de un solo panel (ambos muestran una insignia con la cantidad de archivos modificados). El panel independiente de detalles de archivos, herramientas y Canvas no se ve afectado.
    - Al hacer clic en una referencia de archivo del chat, una ruta de archivo de una tarjeta expandida de herramienta de lectura, edición o escritura, o una fila de archivo de la barra del espacio de trabajo, se abre el panel de detalles del archivo: una vista de código basada en CodeMirror con resaltado de sintaxis, números de línea, salto a línea, búsqueda dentro del archivo, acciones de copia y un menú para abrirlo en un editor externo. Cuando el Gateway anuncia `sessions.files.set` a una conexión `operator.admin`, el panel añade un modo Editar con seguimiento de cambios sin guardar y guardado mediante Cmd/Ctrl-S; los borradores sin guardar sobreviven a la navegación entre archivos, paneles y sesiones en la pestaña actual del navegador hasta que se guardan o descartan explícitamente. Los guardados usan comparación e intercambio con un hash de contenido devuelto por `sessions.files.get`: si el archivo cambió en el disco desde que se cargó (por ejemplo, porque el agente siguió trabajando), el panel muestra un aviso de conflicto con las acciones Recargar (usar el contenido más reciente) y Sobrescribir (conservar la edición local). Las escrituras pasan por las mismas protecciones seguras del sistema de archivos del espacio de trabajo que las lecturas —contención de rutas, rechazo de enlaces simbólicos o duros y un límite UTF-8 de 256 KB— y solo sobrescriben archivos existentes; el editor nunca los crea ni elimina.
    - La barra de tareas en segundo plano de cada panel de Chat enumera las tareas en segundo plano y los subagentes del agente actual (`tasks.list` limitado por agente y actualizado en directo mediante eventos `task`): el trabajo en ejecución muestra un temporizador de tiempo transcurrido en directo, la cantidad de usos de herramientas, la herramienta que se está usando y un control para detenerlo; la sección contraíble de tareas finalizadas añade las duraciones de las ejecuciones; y un enlace Ver transcripción abre la sesión secundaria de la tarea en el panel. Ábrala con el conmutador de actividad del encabezado del panel dividido o con el botón flotante de actividad del chat de un solo panel; la instantánea de tareas se carga de forma anticipada, por lo que ambos muestran una insignia con la cantidad de tareas en ejecución sin necesidad de abrir antes la barra. La página Tareas sigue siendo el registro completo entre agentes.
    - La barra del espacio de trabajo, la barra de tareas en segundo plano y el panel de detalles se adaptan al ancho propio de cada panel en vez de al de la ventana: en un panel estrecho o una ventana compacta, ambas barras se presentan como franjas inferiores (los controles de acoplamiento lateral permanecen ocultos hasta que el panel se ensancha; la barra del espacio de trabajo tiene prioridad sobre el espacio lateral cuando solo cabe una columna), y el panel de detalles se apila debajo del hilo con un controlador horizontal de cambio de tamaño en lugar de compartir la fila. En ventanas del tamaño de un teléfono, el panel de detalles sigue abriéndose a pantalla completa.
    - Los selectores de modelo y razonamiento del encabezado del chat actualizan inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío válidas para un solo turno.
    - **Vista dividida:** ábrala desde la fila de conmutadores flotante de la parte superior derecha (junto a los conmutadores de diferencias de la sesión, tareas en segundo plano y archivos de la sesión) y, después, divida el panel activo hacia la derecha o hacia abajo hasta crear tantos paneles como quepan. Cada panel tiene su propia sesión, transcripción, cuadro de redacción y flujo de herramientas.
    - Arrastre una sesión desde la barra lateral hasta el chat para abrirla en un panel. Una vista previa animada de colocación se desliza entre las zonas y etiqueta el resultado —«Dividir» sobre la mitad exacta que ocupará el panel nuevo, «Abrir aquí» sobre un panel completo—, y también se puede soltar desde el modo de un solo panel.
    - El panel dividido activo determina la selección de la barra lateral y la URL. Cada panel tiene su propia fila de encabezado con el título de la sesión y los controles de la barra del espacio de trabajo, división y cierre; los separadores permiten cambiar el tamaño de las columnas y los paneles apilados, y el navegador almacena localmente el diseño entre recargas.
    - En pantallas estrechas, la vista dividida conserva el diseño, pero representa únicamente el panel activo, incluido su encabezado con el control de cierre.
    - Si se envía un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el cuadro de redacción espera a que termine esa actualización de la sesión antes de llamar a `chat.send`, para que el envío use el modelo seleccionado.
    - Escribir `/new` crea y cambia a la misma sesión nueva del panel que Nuevo chat, excepto cuando está configurado `session.dmScope: "main"` y el elemento principal actual es la sesión principal del agente; en ese caso, restablece la sesión principal en el mismo lugar. Escribir `/reset` conserva el restablecimiento explícito en el mismo lugar que realiza el Gateway para la sesión actual.
    - El selector de modelos del chat solicita la vista de modelos configurada del Gateway. Si existe `agents.defaults.models`, esa lista de permitidos determina el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos limitados por proveedor. De lo contrario, el selector muestra las entradas explícitas de `models.providers.*.models` y los proveedores con autenticación utilizable. El catálogo completo sigue estando disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de la sesión del Gateway incluyen los tokens de contexto actuales, la barra de herramientas del cuadro de redacción del chat muestra un pequeño anillo de uso del contexto con el porcentaje utilizado. Abra el anillo para consultar la ventana de contexto actual, las cantidades de tokens de la ejecución más reciente y el coste total estimado, la identidad del proveedor y el modelo, y el desglose más reciente de los costes de entrada, salida y caché de la respuesta del proveedor cuando se informe. El anillo cambia al estilo de advertencia cuando la presión sobre el contexto es alta y, en los niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de la sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelve a informar de un uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en el navegador)">
    El modo de conversación utiliza un proveedor de voz en tiempo real registrado. Configure OpenAI con `talk.realtime.provider: "openai"` junto con un perfil de clave de API `openai`, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`. OpenAI Realtime utiliza la API pública de Platform y requiere una clave de API de Platform; un inicio de sesión OAuth de Codex no es válido para esta interfaz. Configure Google con `talk.realtime.provider: "google"` junto con `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor: OpenAI recibe un secreto efímero de cliente de Realtime para WebRTC, y Google Live recibe un token de autenticación restringido y de un solo uso de la API Live para una sesión WebSocket del navegador, con las instrucciones y las declaraciones de herramientas bloqueadas en el token por el Gateway. Los proveedores que solo ofrecen un puente de tiempo real de backend funcionan mediante el transporte de retransmisión del Gateway, por lo que las credenciales y los sockets del proveedor permanecen en el servidor mientras el audio del navegador circula mediante RPC autenticadas del Gateway. El prompt de la sesión de Realtime lo compone el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el invocador.

    Los valores predeterminados persistentes del proveedor, modelo, voz, transporte, esfuerzo de razonamiento, umbral exacto de VAD, duración del silencio y relleno de prefijo se encuentran en **Settings → Communications → Talk**; cambiarlos requiere acceso `operator.admin`. Configurar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; configurar WebRTC mantiene la sesión bajo el control del cliente y produce un error, en lugar de recurrir silenciosamente a la retransmisión, si el proveedor no puede crear una sesión de navegador.

    El control de conversación es el botón del micrófono de la barra de herramientas del cuadro de redacción. Su flecha desplegable muestra **System default** y todos los micrófonos expuestos por el navegador, incluidas las entradas USB, Bluetooth y virtuales. El identificador del dispositivo seleccionado permanece en el navegador y nunca se envía al Gateway; si ese dispositivo exacto desaparece, el modo de conversación solicita elegir otra entrada en lugar de grabar silenciosamente desde un micrófono diferente. Mientras el modo de conversación está activo, el botón del micrófono se convierte en una pastilla que muestra el medidor del nivel de entrada en tiempo real; al hacer clic se detiene la entrada de voz y, al pasar el puntero por encima, aparece el glifo de detención. Los lectores de pantalla anuncian `Connecting voice input...`, `Listening...` o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta el modelo de mayor tamaño configurado mediante `talk.client.toolCall`. Detener una respuesta del agente en curso sigue siendo una acción independiente mediante el control cuadrado **Stop** situado junto a la pastilla.

    Prueba rápida en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP de WebRTC de OpenAI en el navegador, la configuración de WebSocket de Google Live en el navegador mediante un token restringido y el adaptador de navegador para la retransmisión del Gateway con medios de micrófono simulados. El comando solo imprime el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y cancelar">
    - Haga clic en **Stop** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales quedan en cola. Haga clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en curso.
    - Escriba `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para cancelar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para cancelar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Conservación parcial tras la cancelación">
    - Cuando se cancela una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz de usuario.
    - El Gateway conserva en el historial de la transcripción el texto parcial cancelado del asistente cuando existe una salida almacenada en el búfer.
    - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores de la transcripción puedan distinguir los fragmentos parciales cancelados de la salida de una finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, la interrupción de la conexión con el Gateway no cierra la sesión. El panel
permanece visible con una pastilla ámbar flotante que muestra "Gateway connection lost — Reconnecting…" debajo de la
barra superior mientras el cliente reintenta la conexión automáticamente con espera progresiva (desde 800 ms hasta 15 s). Las actualizaciones en vivo y
las acciones en tiempo real o de sesión se pausan hasta que se restablece la conexión; **Retry now** en la pastilla fuerza un
intento inmediato. El chat permanece editable: los envíos normales de texto y archivos adjuntos se conservan en el
almacenamiento del navegador del ámbito del Gateway y de la sesión de la pestaña actual, se muestran a la espera de la reconexión y se envían
automáticamente cuando regresa el Gateway. Los controles en vivo y los comandos con barra permanecen deshabilitados mientras
no hay conexión.

Cuando este navegador ya contiene credenciales (un token o una contraseña configurados, o un token de dispositivo
aprobado), al abrirlo por primera vez y al recargarlo se muestra una pequeña marca animada de OpenClaw mientras se
establece la conexión, en lugar de mostrar brevemente la pantalla de inicio de sesión. La pantalla de inicio de sesión solo aparece cuando aún no hay credenciales
almacenadas o cuando el Gateway las rechaza activamente (token o contraseña incorrectos, emparejamiento revocado);
estos estados requieren una acción del usuario en lugar de esperar.

## Instalación de la PWA y notificaciones push web

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway active la PWA instalada mediante notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelva a abrir el panel con `openclaw dashboard` y fuerce una recarga completa. Si el problema persiste, borre los datos del sitio correspondientes al origen del panel o pruebe en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador pueden seguir ejecutando un paquete de la interfaz de control anterior a la actualización contra el Gateway más reciente.

| Superficie                                            | Función                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifiesto de la PWA. Los navegadores ofrecen "Install app" una vez que está disponible. |
| `ui/public/sw.js`                                     | Service worker que gestiona los eventos `push` y los clics en las notificaciones. |
| `push/vapid-keys.json` (en el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente que se utiliza para firmar las cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints persistentes de las suscripciones del navegador.            |

Sobrescriba el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando desee fijar las claves (implementaciones en varios hosts, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (el valor predeterminado es `https://openclaw.ai`)

La interfaz de control utiliza estos métodos del Gateway restringidos por ámbito para registrar y probar las suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` junto con `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del solicitante.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulte [Configuración](/es/gateway/configuration) para obtener información sobre las notificaciones push respaldadas por retransmisión) y del método `push.test`, que se dirige al emparejamiento móvil nativo.
</Note>

## Contenido alojado incrustado

Los mensajes del asistente pueden representar contenido web alojado en línea mediante el shortcode `[embed ...]`. La política de aislamiento del iframe se controla mediante `gateway.controlUi.embedSandbox`:

El Plugin Canvas incluido también proporciona [`show_widget`](/tools/show-widget) para representar SVG o HTML autónomo directamente desde una llamada de herramienta. El navegador anuncia la capacidad `inline-widgets` del Gateway, y el documento de Canvas resultante sigue disponible cuando se vuelve a cargar el historial de chat. Las ejecuciones originadas en canales no reciben esta herramienta.

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro del contenido alojado incrustado.
  </Tab>
  <Tab title="scripts (default)">
    Permite contenido incrustado interactivo mientras mantiene el aislamiento del origen; suele ser suficiente para juegos o widgets autónomos en el navegador.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan deliberadamente privilegios más amplios.
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Usa `trusted` solo cuando el documento incrustado necesite realmente un comportamiento del mismo origen. Para la mayoría de los juegos y lienzos interactivos generados por agentes, `scripts` es la opción más segura.
</Warning>

Las URL externas absolutas `http(s)` para contenido incrustado permanecen bloqueadas de forma predeterminada. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de los mensajes del chat

La transcripción del chat utiliza un marco centrado y legible, alineado con el editor de mensajes. La salida del asistente y de las herramientas permanece alineada a la izquierda, mientras que las burbujas del usuario permanecen alineadas a la derecha dentro de ese marco. Las implementaciones con monitores anchos pueden modificar el ancho de la transcripción sin aplicar parches al CSS incluido mediante la configuración de `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los formatos admitidos incluyen longitudes simples y porcentajes como `960px` u `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso a la tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en la interfaz de bucle invertido y permite que Tailscale Serve actúe como proxy mediante HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre `https://<magicdns>/` (o el valor configurado de `gateway.controlUi.basePath`).

    De forma predeterminada, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo los acepta cuando la solicitud llega a través de la interfaz de bucle invertido con los encabezados `x-forwarded-*` de Tailscale. Para las sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite el proceso de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales del dispositivo. Establece `gateway.auth.allowTailscale: false` si se deben exigir credenciales explícitas de secreto compartido incluso para el tráfico de Serve y, a continuación, usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos de la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de escribir los límites de frecuencia. Por lo tanto, los reintentos incorrectos simultáneos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud, en lugar de que dos discrepancias simples compitan en paralelo.

    <Warning>
    La autenticación de Serve sin token presupone que el host del Gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación mediante token o contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a la tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abre `http://<tailscale-ip>:18789/` (o el valor configurado de `gateway.controlUi.basePath`).

    Pega el secreto compartido correspondiente en la configuración de la interfaz de usuario (se envía como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP no seguro

Si se abre el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP no seguro solo para localhost mediante `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador en Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la interfaz de usuario localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del Gateway).

<AccordionGroup>
  <Accordion title="Comportamiento de la opción de autenticación insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es únicamente una opción de compatibilidad local:

    - Permite que las sesiones locales de la interfaz de control continúen sin identidad del dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No flexibiliza los requisitos de identidad del dispositivo para conexiones remotas (que no sean localhost).

  </Accordion>
  <Accordion title="Solo para emergencias">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad del dispositivo de la interfaz de control y supone una grave reducción de la seguridad. Revierta este cambio rápidamente después de usarlo en una emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxies de confianza">
    - Una autenticación correcta mediante un proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad del dispositivo.
    - Esto **no** se extiende a las sesiones de la interfaz de control con rol de nodo.
    - Los proxies inversos de bucle invertido del mismo host tampoco satisfacen la autenticación mediante proxy de confianza; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/es/gateway/tailscale) para obtener instrucciones sobre la configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control incluye una política `img-src` estricta: solo se permiten recursos del **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes `http(s)` remotas y relativas al protocolo, y nunca realiza solicitudes de red.

En la práctica:

- Los avatares y las imágenes servidos mediante rutas relativas (por ejemplo, `/avatars/<id>`) siguen mostrándose, incluidas las rutas de avatares autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen mostrándose.
- Las URL `blob:` locales creadas por la interfaz de control siguen mostrándose.
- El Gateway obtiene los avatares de las vistas previas de enlaces de GitHub desde el host fijo de avatares de GitHub y los devuelve como URL `data:` de tamaño limitado; el navegador del operador nunca contacta con el host remoto de avatares.
- Las URL remotas de avatares emitidas por los metadatos del canal se eliminan en los auxiliares de avatares de la interfaz de control y se sustituyen por el logotipo o distintivo integrado, por lo que un canal vulnerado o malicioso no puede forzar la obtención de imágenes remotas arbitrarias desde el navegador de un operador.

Esta función está siempre activa y no es configurable.

## Autenticación de la ruta de avatares

Cuando se configura la autenticación del gateway, el endpoint de avatares de la interfaz de control requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar únicamente a los clientes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar conforme a la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (al igual que en la ruta relacionada de contenido multimedia del asistente), por lo que la ruta de avatares no puede revelar la identidad del agente en hosts que, por lo demás, estén protegidos.
- La interfaz de control reenvía el token del gateway como encabezado de portador al obtener avatares y utiliza URL de blob autenticadas para que la imagen siga mostrándose en los paneles.

Si desactiva la autenticación del gateway (no se recomienda en hosts compartidos), la ruta de avatares también deja de requerir autenticación, al igual que el resto del gateway.

## Autenticación de la ruta de contenido multimedia del asistente

Cuando se configura la autenticación del gateway, las vistas previas de contenido multimedia local del asistente utilizan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la interfaz de control; el navegador envía el token del gateway como encabezado de portador al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, vídeo y documentos que muestra el navegador utilizan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la representación de contenido multimedia compatible con los elementos multimedia nativos del navegador sin incluir credenciales reutilizables del gateway en URL de contenido multimedia visibles.

## Enlaces de aprobación

Las notificaciones de aprobación del operador pueden incluir un enlace profundo a un documento de aprobación independiente servido bajo el espacio de nombres reservado `${controlUiBasePath}/approve/{approvalId}` (por ejemplo, `/approve/<approvalId>`, o `/openclaw/approve/<approvalId>` con una ruta base configurada). La URL permanece estable durante la vigencia de la aprobación y se puede reenviar de forma segura entre sus propios dispositivos: identifica la aprobación, pero nunca la autoriza.

- El espacio de nombres de un segmento `/approve/<approvalId>` está reservado por el Gateway antes que las rutas HTTP de los plugins para **todos** los métodos HTTP, por lo que una ruta de un plugin nunca puede ocultar ni interceptar un documento de aprobación.
- Abrir un documento de aprobación requiere la misma autenticación del gateway que el resto de la interfaz de control (token/contraseña, identidad de Tailscale Serve o identidad de proxy de confianza); las credenciales nunca forman parte de la URL de aprobación.
- Cuando el servicio de la interfaz de control está desactivado, las solicitudes al espacio de nombres devuelven `404` en lugar de pasar a los controladores de los plugins.
- El inicio de sesión en un documento de aprobación es efímero para esa página: no sobrescribe la selección ni la configuración del gateway guardadas por la interfaz de control completa en el mismo navegador.

El Gateway sirve archivos estáticos desde `dist/control-ui`:

```bash
pnpm ui:build
```

Base absoluta opcional (URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Desarrollo local (servidor de desarrollo independiente):

```bash
pnpm ui:dev
```

A continuación, dirija la interfaz a la URL de WebSocket de su Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de la interfaz de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, es posible que una extensión o un script de contenido ejecutado al inicio haya impedido la evaluación de la aplicación de módulos de JavaScript. La página estática incluye un panel de recuperación HTML sencillo que aparece cuando `<openclaw-app>` no se registra después del inicio.

Use la acción **Try again** del panel después de cambiar el entorno del navegador, o vuelva a cargar manualmente después de realizar estas comprobaciones:

- Desactive las extensiones que inyectan contenido en todas las páginas, especialmente las que tienen scripts de contenido `<all_urls>`.
- Pruebe una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantenga el Gateway en ejecución y verifique la misma URL del panel después de cambiar el navegador.

## Depuración y pruebas: servidor de desarrollo y Gateway remoto

La interfaz de control consta de archivos estáticos; el destino de WebSocket es configurable y puede ser distinto del origen HTTP. Esto resulta útil cuando se desea ejecutar localmente el servidor de desarrollo de Vite, pero el Gateway se ejecuta en otra ubicación.

<Steps>
  <Step title="Iniciar el servidor de desarrollo de la interfaz">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abrir con gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticación única opcional (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si proporciona un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifique el valor para URL a fin de que el navegador analice correctamente la cadena de consulta.
    - Siempre que sea posible, `token` debe proporcionarse mediante el fragmento de la URL (`#token=...`). Los fragmentos no se envían al servidor, lo que evita filtraciones mediante el registro de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como mecanismo alternativo, y se eliminan inmediatamente después de la inicialización.
    - `password` se conserva únicamente en memoria.
    - Cuando se establece `gatewayUrl`, la interfaz no recurre a las credenciales de la configuración ni del entorno. Proporcione `token` (o `password`) explícitamente; la ausencia de credenciales explícitas constituye un error.
    - Use `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para evitar el secuestro de clics.
    - Las implementaciones públicas de la interfaz de control que no sean de bucle invertido deben establecer explícitamente `gateway.controlUi.allowedOrigins` (orígenes completos). Las cargas LAN/Tailnet privadas del mismo origen desde hosts de bucle invertido, RFC1918/enlace local, `.local`, `.ts.net` o Tailscale CGNAT se aceptan sin activar el mecanismo alternativo basado en el encabezado Host.
    - El inicio del Gateway puede incorporar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir de la dirección de enlace y el puerto efectivos del entorno de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No use `gateway.controlUi.allowedOrigins: ["*"]` excepto para pruebas locales estrictamente controladas; significa permitir cualquier origen del navegador, no «hacer coincidir el host que estoy usando».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo alternativo de origen basado en el encabezado Host, pero es un modo de seguridad peligroso.

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalles de configuración del acceso remoto: [Acceso remoto](/es/gateway/remote).

## Temas relacionados

- [Panel](/es/web/dashboard) — panel del gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
