---
read_when:
    - Se desea operar el Gateway desde un navegador
    - Se desea acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-14T14:03:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4974d8b0e6f2db068632b2aa31c3712d6a86d52516653f2c311c6cdf856e8989
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
En enlaces de LAN nativos de Windows, el Firewall de Windows o la directiva de grupo administrada por la organización pueden seguir bloqueando la URL de LAN anunciada incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecute `openclaw gateway status --deep` en el host de Windows; informa de puertos probablemente bloqueados, discrepancias de perfiles y reglas del firewall local que la directiva podría ignorar.
</Note>

La autenticación se proporciona durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración conserva un token para la sesión de la pestaña actual del navegador y la URL del Gateway seleccionada; las contraseñas no se conservan. La incorporación suele generar un token del Gateway para la autenticación mediante secreto compartido en la primera conexión, pero la autenticación mediante contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

La conexión desde un navegador o dispositivo nuevo suele requerir una **aprobación de emparejamiento única**, mostrada como `disconnected (1008): pairing required`.

<Steps>
  <Step title="Enumerar las solicitudes pendientes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprobar por ID de solicitud">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si el navegador vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`; vuelva a ejecutar `openclaw devices list` antes de aprobar.

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura/administración se trata como una ampliación de la aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con permisos más amplios y solicita que se apruebe explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos que se revoque mediante `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/es/cli/devices) para obtener información sobre la rotación y revocación de tokens y el flujo de aprobación inicial de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas del navegador mediante el bucle invertido local (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el proceso de ida y vuelta del emparejamiento para las sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, se verifica la identidad de Tailscale y el navegador presenta la identidad de su dispositivo. Los navegadores sin identidad de dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivos.
- Los enlaces directos de Tailnet, las conexiones de navegadores mediante LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil del navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar sus datos requiere volver a realizar el emparejamiento.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión de iOS/Android sin abrir un terminal:

<Steps>
  <Step title="Abrir el emparejamiento móvil">
    Seleccione **Dispositivos** y, a continuación, haga clic en **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.
  </Step>
  <Step title="Conectar el teléfono">
    En la aplicación móvil de OpenClaw, abra **Configuración** → **Gateway** y escanee el código QR. También puede copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La aplicación oficial para iOS/Android se conecta automáticamente. Si **Aprobación pendiente** muestra una solicitud, revise su rol y sus ámbitos antes de aprobarla.
  </Step>
</Steps>

La creación de un código de configuración requiere `operator.admin`; el botón está deshabilitado para las sesiones que no lo tengan. Un código de configuración contiene una credencial de arranque de corta duración, por lo que el QR y el código copiado deben tratarse como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin protección está limitado al bucle invertido y a las direcciones de LAN privadas. Consulte [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para obtener todos los detalles de seguridad y mecanismo alternativo.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribuirlos en sesiones compartidas. Se almacena en el navegador, está limitada al perfil actual y no se sincroniza con otros dispositivos ni se conserva en el servidor más allá de los metadatos normales de autoría de la transcripción de los mensajes enviados. Al borrar los datos del sitio o cambiar de navegador, vuelve a quedar vacía.

La sustitución del avatar del asistente sigue el mismo patrón local del navegador: las sustituciones cargadas se superponen localmente a la identidad resuelta por el Gateway y nunca realizan un viaje de ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para los clientes que no usan la interfaz y escriben directamente en él.

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene su configuración en tiempo de ejecución de `/control-ui-config.json`, resuelto con relación a la ruta base de la interfaz de control del Gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo y, para obtenerlo correctamente, se requiere un token o una contraseña válidos del Gateway, una identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abra **Configuración** en la vista simple para ver la tarjeta **Host del Gateway**, que muestra el equipo del Gateway, la dirección LAN, el sistema operativo, el entorno de ejecución, el tiempo de actividad, la carga de CPU, la memoria y el espacio en disco del volumen de estado. Mientras está visible, la tarjeta se actualiza cada 10 segundos mediante el RPC `system.info` del Gateway, que requiere el ámbito `operator.read`. Los Gateways antiguos y las conexiones sin ese ámbito omiten la tarjeta.

## Compatibilidad de idiomas

La interfaz de control se localiza en la primera carga según la configuración regional del navegador. Para cambiarla más adelante, abra **Configuración -> General -> Idioma** (el selector se encuentra en la tarjeta de configuración rápida General, no en Apariencia).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones a idiomas distintos del inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción que falten recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales distintas del inglés, pero el selector de idiomas integrado de Mintlify en el sitio de documentación solo enumera los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia incluye los temas integrados Claw, Knot y Dash (Claw es el predeterminado), además de una ranura de importación de tweakcn local del navegador. Para importar un tema, abra el [editor de tweakcn](https://tweakcn.com/editor/theme), elija o cree un tema, haga clic en **Share** y pegue el enlace copiado en Apariencia. El importador también acepta URL del registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan únicamente en el perfil actual del navegador; no se escriben en la configuración del Gateway ni se sincronizan entre dispositivos. Al sustituir el tema importado se actualiza la única ranura local; al borrarlo se vuelve a Claw si el tema importado estaba activo.

Apariencia también tiene una opción Tamaño del texto local del navegador, almacenada junto con el resto de las preferencias de la interfaz de control. Se aplica al texto del chat, al texto del redactor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no amplíe automáticamente la vista al enfocarlas.

## Gestionar plugins

Abra **Plugins** en la barra lateral o use `/settings/plugins` con relación a la
ruta base configurada de la interfaz de control para explorar y gestionar plugins sin salir
de la interfaz de control. Por ejemplo, una ruta base `/openclaw` usa
`/openclaw/settings/plugins`. La página está siempre disponible, incluso cuando todos los
plugins opcionales están deshabilitados.

Plugins es un centro con cuatro pestañas: **Instalados** y **Descubrir** gestionan el código de los plugins
en `/settings/plugins`, **Skills** aloja el gestor de Skills por agente en
`/skills` y **Taller** aloja la revisión de propuestas del Taller de Skills en
`/skills/workshop`. Cada pestaña conserva su propia URL y la barra lateral muestra la
única entrada Plugins para todas ellas.

La pestaña **Instalados** muestra el inventario local completo agrupado por categoría, con
recuentos generales. Cada fila abre una vista de detalles; su menú de desbordamiento (`…`)
habilita o deshabilita el plugin y ofrece **Eliminar** para los plugins instalados externamente.
También enumera los [servidores MCP](/es/cli/mcp) configurados y permite añadirlos, deshabilitarlos
y eliminarlos directamente. La pestaña **Descubrir** es la tienda: plugins destacados
incluidos con OpenClaw, plugins externos oficiales y conectores MCP con un solo clic
para servicios populares. Al escribir en el cuadro de búsqueda, se consulta
[ClawHub](https://clawhub.ai/plugins) directamente y se añade una sección **De ClawHub**
con recuentos de descargas e insignias de verificación del origen. Los enlaces profundos pueden
dirigirse directamente a la tienda mediante `/settings/plugins?tab=discover`.

La pestaña **Skills** conserva el informe de estado de Skills, los controles para habilitarlas o deshabilitarlas, la introducción de claves
de API y la búsqueda integrada de Skills en ClawHub, todo ello limitado al agente seleccionado. La
pestaña **Taller** conserva el tablero del Taller de Skills y el flujo de revisión de Hoy para las
[propuestas de Skills](/es/tools/skill-workshop). **Buscar ideas de Skills** revisa una ventana limitada
de sesiones sustanciales desde la más reciente hasta la más antigua y deja los resultados como
propuestas pendientes. El panel muestra la cobertura acumulada; **Analizar trabajo anterior**
continúa desde el cursor conservado y después se convierte en **Analizar trabajo nuevo** cuando se
agota el historial anterior. La revisión manual del historial funciona mientras el autoaprendizaje autónomo
está deshabilitado y usa el modelo configurado del agente seleccionado.

Los plugins incluidos ya están presentes en el Gateway y muestran **Habilitar** o
**Deshabilitar** en lugar de **Instalar**. Por ejemplo, Workboard está incluido con
OpenClaw, pero está deshabilitado de forma predeterminada, por lo que su acción es **Habilitar**. Los plugins
integrados no se pueden eliminar, solo deshabilitar.

La lectura del catálogo y la búsqueda en ClawHub requieren `operator.read`. Instalar,
habilitar, deshabilitar o eliminar un plugin y cambiar servidores MCP requieren
`operator.admin`; esas acciones permanecen deshabilitadas para los operadores con acceso de solo lectura.

Las instalaciones desde ClawHub se ejecutan mediante el Gateway y mantienen las mismas comprobaciones de confianza, integridad
y directivas de instalación de plugins que otras instalaciones mediadas por el Gateway. Instalar
o eliminar código de plugins requiere reiniciar el Gateway. Habilitar o deshabilitar un
plugin instalado puede aplicarse sin reiniciar cuando el plugin y el entorno de ejecución actual del
Gateway lo admiten; de lo contrario, la interfaz informa de que es necesario
reiniciar. Los conectores MCP respaldados por OAuth necesitan una ejecución única de
`openclaw mcp login <name>` desde la CLI después de añadirlos.

La página se centra intencionadamente en el inventario, el descubrimiento, la instalación, la habilitación
y la eliminación. Use [`openclaw plugins`](/es/cli/plugins) para fuentes npm, git o
de rutas locales arbitrarias, actualizaciones y configuración avanzada de plugins.

## Navegación por la barra lateral

La barra lateral fija la navegación encima de una lista desplazable de sesiones. En configuraciones multiagente, cada agente aparece como una sección de nivel superior contraíble; al expandir un agente, se pueden explorar sus sesiones sin salir del chat abierto, y los agentes contraídos muestran un indicador de contenido no leído. Dentro de un agente, la lista se divide en **Fijadas**, una sección integrada por cada canal conectado (Telegram, Slack, WhatsApp, ...), una sección integrada **Trabajo** para las sesiones vinculadas a un árbol de trabajo administrado o a un nodo de ejecución (las filas muestran una línea `repo ⎇ branch` junto con el host del nodo), grupos personalizados (la sesión `category`) y **Chats** para el resto. Las secciones de canales y Trabajo clasifican las filas automáticamente; asignar una sesión a un grupo personalizado siempre tiene prioridad. Al abrir una sesión, el resaltado de selección se desplaza sin reordenar las filas. Las sesiones con actividad nueva desde la última vez que se leyeron muestran un punto de contenido no leído, y abrirlas las marca como leídas. Cada fila de sesión tiene un menú contextual (botón de tres puntos verticales o clic derecho) con Fijar/Desfijar, Marcar como no leída/leída, Cambiar nombre, Bifurcar, Mover al grupo (incluidos Nuevo grupo y Quitar del grupo), Archivar y Eliminar; en los diseños táctiles, los controles directos de fijación y menú permanecen visibles. Cmd/Ctrl-clic activa o desactiva filas en una selección múltiple y Mayús-clic amplía la selección siguiendo el orden visible; al abrir el menú de una fila seleccionada, se ofrecen acciones por lotes (Marcar N como no leídas/leídas, Mover N al grupo, Archivar N, Eliminar N) que se aplican a todas las sesiones seleccionadas, con una única confirmación para la eliminación por lotes. Arrastre una sesión a un grupo personalizado o a **Chats** para moverla. Los encabezados de grupos personalizados se pueden contraer, expandir o arrastrar para reordenarlos; los nombres de los grupos y su orden se guardan en el Gateway (`sessions.groups.*`), por lo que se mantienen entre navegadores, mientras que el estado contraído permanece en el perfil del navegador. Los encabezados de grupo también tienen un menú (botón de tres puntos verticales o clic derecho) con Cambiar nombre del grupo, Nuevo grupo y Eliminar grupo; cambiar el nombre o eliminar un grupo actualiza en el servidor todas las sesiones que lo integran, incluidas las archivadas, y eliminar un grupo conserva sus sesiones y las devuelve a Chats. El único **+** del encabezado de la lista de sesiones abre la página Nueva sesión (consulte más adelante). El control de ordenación también incluye la opción Agrupar por: Agrupadas (valor predeterminado) o Ninguna para mostrar una única lista plana (Fijadas permanece separada); la elección se guarda en el perfil actual del navegador. **Uso**, **Automatizaciones** y **Plugins** están fijados de forma predeterminada; la fila **Más** abre un menú con todos los demás destinos, incluidas las pestañas proporcionadas por Plugins. Seleccione **Editar elementos fijados** en ese menú, o haga clic derecho en el área de navegación, para fijar o desfijar destinos y restaurar los valores predeterminados. El conjunto fijado se guarda en el perfil actual del navegador y se conserva tras las recargas.

## Página de nueva sesión

El **+** del encabezado de la lista de sesiones de la barra lateral abre un borrador de página completa en `/new`: no se crea nada hasta que se envía el primer mensaje. Una fila de destino situada encima del cuadro de mensaje permite elegir dónde trabaja la sesión: el agente (en configuraciones multiagente), dónde se ejecutan los procesos (**Gateway · local** o un nodo emparejado que exponga `system.run`; requiere `operator.admin`), la carpeta (el valor predeterminado es el espacio de trabajo del agente; otras rutas absolutas del Gateway requieren `operator.admin` y un árbol de trabajo) y una opción **Árbol de trabajo** opcional con un selector de rama base (respaldado por `worktrees.branches`, por lo que no se realiza ninguna obtención) y un nombre opcional para el árbol de trabajo (la rama pasa a ser `openclaw/<name>`). El botón de exploración de la ficha de carpeta abre un selector de directorios en línea respaldado por el método exclusivo para administradores `fs.listDir`. Su nivel superior muestra el Gateway y todos los nodos conocidos; los nodos sin conexión y los que no admiten la exploración de directorios permanecen visibles, pero deshabilitados. Al seleccionar el Gateway, se comienza desde la carpeta actual o desde el directorio de inicio del Gateway. Al seleccionar un nodo compatible, se explora el sistema de archivos del host de ese nodo, se vincula la ejecución a él y se usa directamente la ruta absoluta seleccionada del nodo (los árboles de trabajo administrados siguen estando disponibles únicamente en el Gateway). Al enviar, se llama a `sessions.create` con el primer mensaje, por lo que la ejecución comienza en el mismo ciclo de solicitud y respuesta, y la interfaz salta al chat de la nueva sesión. Si el Gateway crea la sesión, pero rechaza ese primer envío, el chat conserva el mensaje y el error entre recargas; **Reintentar** lo envía mediante la sesión ya creada en lugar de crear otra.

Dentro de **Configuración**, la barra lateral específica comienza con un campo **Buscar en la configuración** para encontrar rápidamente secciones de configuración.

Un campo **Buscar** en la parte superior de la barra lateral abre la paleta de comandos (⌘K). Al hacer clic en la marca OpenClaw del encabezado de la barra lateral, se abre la pantalla inicial limpia de Nueva sesión. Cuando algo requiere atención —tareas Cron fallidas o atrasadas, autenticación de modelos próxima a caducar o caducada—, aparecen fichas compactas de atención encima del pie de la barra lateral que, al hacer clic, llevan a la página correspondiente. El pie muestra el agente activo como una ficha —avatar (imagen de identidad o emoji), nombre, punto de conexión y un subtítulo en tiempo real— con un **+** para iniciar una sesión nueva. Al hacer clic en la ficha, se abre el menú del agente: un selector de agentes (en configuraciones multiagente), "¿Qué puede hacer este agente?", **Configuración del agente**, **Configuración**, emparejamiento móvil, **Documentación**, la ficha de compilación y el selector del modo de color. Las listas de más de diez agentes incluyen un campo de filtro y muestran primero los agentes fijados; los agentes se pueden fijar o desfijar desde la página de configuración de Agentes, y el conjunto fijado se guarda en el perfil del navegador. Al elegir un agente, Chat, Uso, Automatizaciones, Tareas, Panel de trabajo y Sesiones quedan restringidos a ese agente. Cada página restringida incluye un control **Agente** con **Todos los agentes** como opción para salir de ese ámbito; esto amplía el ámbito de la página compartida sin cambiar el agente concreto del chat, mientras que los enlaces directos a sesiones siguen abriendo su destino. La página de configuración de Agentes mantiene su propia selección `?agent=` y no adopta el ámbito compartido de la página. Cuando el Gateway se ejecuta desde una copia del código fuente en una rama distinta de `main`, el pie también muestra el nombre de esa rama en rojo para que resulte evidente a simple vista que el Gateway no corresponde a una versión publicada (las instalaciones de versiones publicadas nunca lo muestran). Mayús-Comando-Coma abre **Configuración** sin sustituir el atajo Comando-Coma del navegador. El encabezado de la barra lateral también contiene el control para contraerla (⌘B); al contraerla, se oculta por completo para ofrecer un espacio de trabajo de ancho completo, y un control flotante para expandirla (o ⌘B) permite recuperarla; en su lugar, la aplicación para macOS aloja ese control de forma nativa en la barra de título. La barra lateral es el único elemento de navegación en el escritorio; no hay una barra superior. En ventanas estrechas, la barra lateral se sustituye por un panel deslizable situado detrás de una fila de encabezado compacta que contiene el control del panel, la marca y la búsqueda de la paleta de comandos; en la aplicación para macOS, esa fila de encabezado integra el espacio reservado para la barra de título en una única franja compacta junto a los controles de la ventana. La navegación usa el historial normal del navegador, por lo que sus botones Atrás y Adelante permiten recorrerla; la aplicación para macOS añade un control nativo para la barra lateral junto a los controles de la ventana, además de gestos de deslizamiento en el panel táctil, con botones Atrás y Adelante en el borde derecho de la barra lateral cuando está expandida, y botones nativos de búsqueda (paleta de comandos) y nueva sesión cuando está contraída.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatear con el modelo mediante el WS del Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial del chat solicitan una ventana reciente limitada con límites de texto por mensaje, por lo que las sesiones grandes no obligan al navegador a representar la carga completa de la transcripción antes de que el chat pueda utilizarse.
    - Al pasar el cursor o enfocar con el teclado un enlace público de GitHub a una incidencia o solicitud de incorporación de cambios, se muestran su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché los metadatos públicos sin modificar el destino del enlace, incluso cuando la interfaz usa un Gateway remoto. El Gateway usa `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, tras confirmar que el repositorio es público; de lo contrario, usa la API anónima de GitHub con una caché de mayor duración.
    - Conversar mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido y de un solo uso mediante WebSocket, y los Plugins de voz en tiempo real exclusivos del backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor gestionadas por el cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite audio PCM del micrófono mediante `talk.session.appendAudio`, reenvía las llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para aplicar la política del Gateway y usar el modelo OpenClaw configurado de mayor tamaño, y dirige las indicaciones de voz durante una ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmitir llamadas a herramientas y tarjetas con resultados de herramientas en tiempo real en Chat (eventos del agente). La actividad de las herramientas se representa mediante filas adaptadas a cada tipo: los comandos de shell muestran el comando con resaltado de sintaxis y una salida con estilo de terminal; las llamadas compatibles de edición y escritura muestran diferencias en línea limitadas, números de línea cuando están disponibles y estadísticas de `+added -removed`; y las llamadas consecutivas se contraen en un resumen como "Se ejecutaron 13 comandos, se leyeron 6 archivos y se editaron 9 archivos". Mientras una ejecución está activa, la llamada en curso más reciente da nombre al encabezado del grupo. Expanda una fila para consultar los argumentos restantes y la salida sin procesar.
    - Títulos de propósito opcionales generados por IA para llamadas complejas a herramientas (comandos de shell largos, herramientas de Plugins con muchos argumentos), habilitados mediante `gateway.controlUi.toolTitles: true` (desactivados de forma predeterminada). Los títulos proceden del método por lotes `chat.toolTitles` mediante el enrutamiento estándar de modelos auxiliares —un `utilityModel` explícito (proveedor elegido por el operador, como en otras tareas auxiliares) o, en su defecto, el modelo pequeño predeterminado declarado por el proveedor de la sesión— y se almacenan en caché en el Gateway por agente. Cuando la opción no está habilitada o no se puede usar ningún modelo económico, las filas conservan sus etiquetas deterministas y no se realiza ninguna llamada a un modelo.
    - Iniciar o descartar tareas de seguimiento efímeras sugeridas por el modelo; las sugerencias aceptadas abren una sesión nueva con un árbol de trabajo administrado y el mensaje propuesto.
    - Pestaña Actividad con resúmenes locales del navegador, diseñados para priorizar la ocultación de datos, de la actividad en tiempo real de las herramientas procedente de la entrega existente de eventos `session.tool` / de herramientas.

  </Accordion>
  <Accordion title="Canales, sesiones, memoria">
    - Canales: estado de los canales integrados y de los canales de plugins incluidos/externos, inicio de sesión mediante QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras finalizan las comprobaciones lentas de los proveedores y etiquetan las instantáneas parciales cuando un sondeo o una auditoría supera el tiempo asignado en la interfaz.
    - Sesiones (una página de configuración en **Agentes y herramientas**, `/settings/sessions`): muestra de forma predeterminada las sesiones de los agentes configurados, permite fijar las sesiones frecuentes, cambiarles el nombre, archivar o restaurar sesiones inactivas, recurrir a una alternativa ante claves obsoletas de sesiones de agentes no configurados y aplicar anulaciones por sesión de modelo, pensamiento, modo rápido, nivel de detalle, seguimiento y razonamiento (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan por encima de las sesiones recientes no fijadas; las sesiones archivadas se encuentran en la vista de archivadas de la página Sesiones y conservan sus transcripciones. Las filas muestran un punto de no leído en las sesiones con actividad desde su última lectura, con acciones para marcar como no leído o leído (`sessions.patch { unread }`), y una acción de bifurcación que ramifica la transcripción en una sesión nueva (`sessions.create { parentSessionKey, fork: true }`). Los mosaicos de resumen situados sobre la tabla sintetizan el conjunto cargado (cantidad de sesiones, ejecuciones activas, sesiones no leídas y total de tokens); cada fila incluye un glifo de tipo con un punto de ejecución activa, el estado se representa mediante un punto sencillo y una etiqueta, y la columna Tokens muestra un medidor del uso de la ventana de contexto cuando la sesión informa de las cantidades de tokens y contexto. Las acciones de administración de las filas se encuentran en un menú por fila (botón de tres puntos verticales o clic derecho) que reproduce el menú de sesiones de la barra lateral, y el panel de la fila incluye el entorno de ejecución del agente y la duración de la ejecución junto con los demás detalles de la sesión.
    - Agrupación de sesiones: un control de agrupación organiza la tabla de sesiones en secciones por grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados se conservan por sesión mediante `sessions.patch` (`category`), por lo que también pueden clasificarse las sesiones iniciadas desde canales de mensajería (Discord, Telegram, WhatsApp, ...); para asignar grupos, se pueden arrastrar filas a una sección o utilizar el selector de grupo de cada fila, y los grupos se crean mediante la acción de nuevo grupo.
    - Memoria (una pestaña de la página Agentes, limitada al agente seleccionado): estado de Dreaming, control para activarlo o desactivarlo y lector del diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Importar memoria (una página de configuración en **Agentes y herramientas**, `/settings/memory-import`): permite previsualizar y copiar la memoria consolidada local de Codex o la memoria automática de Claude Code al espacio de trabajo del agente seleccionado (`migrations.memory.plan`, `migrations.memory.apply`).

  </Accordion>
  <Accordion title="Cron, tareas, plugins, Skills, dispositivos, aprobaciones de ejecución">
    - Automatizaciones (trabajos de Cron): tarjetas de estadísticas (cantidad de automatizaciones, cantidad con errores, estado del programador y próxima activación) sobre un selector de pestañas entre automatizaciones e historial de ejecuciones; la pestaña de automatizaciones enumera los trabajos en una tabla que se puede filtrar (todos/activos/en pausa, búsqueda, filtros de programación y última ejecución, y menú de acciones por fila), con sugerencias iniciales debajo, mientras que la pestaña de historial de ejecuciones muestra las ejecuciones recientes de todas las automatizaciones (`cron.*`).
    - Tareas: registro en tiempo real de tareas en segundo plano activas y recientes, con sesiones vinculadas y opción de cancelación (`tasks.*`).
    - Plugins: permite explorar el inventario instalado y la tienda seleccionada, buscar en ClawHub, instalar y eliminar código de plugins, y activar o desactivar los plugins instalados (`plugins.*`); las filas de servidores MCP editan `mcp.servers` mediante los métodos de configuración.
    - Skills: estado, activación/desactivación, instalación y actualización de claves de API (`skills.*`).
    - Dispositivos: un único inventario reúne los registros de dispositivos emparejados, el catálogo de Node y la presencia en tiempo real (`device.pair.list`, `node.list`, `system-presence`). El host del Gateway aparece fijado en primer lugar; los clientes emparejados muestran el estado de conexión, los roles, los tokens, las capacidades y los comandos. Los emparejamientos duplicados se agrupan en un grupo desplegable, y **Limpiar N obsoletos** elimina en bloque los duplicados sin conexión confirmados por el administrador que se aprobaron automáticamente (local silencioso, CIDR de confianza o verificación mediante SSH) o que son anteriores al registro de procedencia de la aprobación. Las entradas se pueden eliminar (`node.pair.remove`, `device.pair.remove`), el emparejamiento de dispositivos y las nuevas aprobaciones de Node se gestionan en línea (`device.pair.*`, `node.pair.approve`/`reject`), y los códigos de configuración para dispositivos móviles se crean desde la misma tarjeta.
    - Aprobaciones de ejecución: permite editar las listas de permitidos del Gateway o de Node y la política de consulta para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Permite ver y editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Agentes: una página de configuración (**Configuración → Agentes**, `/settings/agents`) con pestañas por agente (resumen, archivos, herramientas, Skills, canales, automatizaciones y memoria). La pestaña de resumen permite editar la identidad del agente —nombre visible, emoji y una imagen de avatar cuyo tamaño y resolución se reducen en el navegador antes de `agents.update`. Al guardar, se almacenan los campos de identidad configurados y se reflejan en el `IDENTITY.md` del espacio de trabajo; los valores configurados tienen prioridad sobre las modificaciones manuales de los mismos campos del archivo.
    - Perfil: una página de configuración que muestra la identidad del agente predeterminado junto con estadísticas históricas de uso: tokens acumulados, día de máxima actividad, sesión más larga, rachas de actividad, un mapa de calor anual de tokens, herramientas más utilizadas y aspectos destacados de los canales (`usage.cost`, `sessions.usage`).
    - MCP dispone de una página de configuración específica con filas de servidores de solo lectura (transporte, activación y resúmenes de OAuth, filtros y paralelismo), comandos habituales para operadores y el editor de configuración limitado a `mcp`; los servidores se añaden, activan, desactivan y eliminan en la página Plugins.
    - Proveedores de modelos: una página de configuración que enumera todos los proveedores de modelos configurados con su icono de marca, estado de autenticación (`models.authStatus`), disponibilidad de modelos (`models.list`), datos en tiempo real sobre el plan, la cuota y la facturación cuando el proveedor los comunica (`usage.status`), y el gasto de las sesiones locales durante los últimos 30 días (`sessions.usage`). Una acción de actualización vuelve a consultar el estado de las credenciales y el uso del proveedor.
    - Conexión: una página de configuración (en **Conexiones**) que controla el enlace propio del panel con el Gateway: URL de WebSocket, token del Gateway, contraseña y clave de sesión predeterminada; también muestra la instantánea más reciente del protocolo de enlace (estado, tiempo de actividad, intervalo de pulsos y última actualización de los canales). La pantalla de inicio de sesión sin conexión se encarga del caso en que no hay conexión; esta página permite modificar la conexión mientras está activa.
    - Aplica y reinicia con validación (`config.apply`) y, a continuación, reactiva la última sesión activa.
    - Las escrituras incluyen una comprobación del hash base para evitar sobrescribir modificaciones simultáneas.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución de las referencias SecretRef activas del contenido de configuración enviado; las referencias activas enviadas que no puedan resolverse se rechazan antes de la escritura.
    - Al guardar formularios, se descartan los marcadores de redacción obsoletos que no se pueden restaurar desde la configuración guardada, y se conservan los valores redactados que todavía corresponden a secretos guardados.
    - El esquema y la representación del formulario proceden de `config.schema` / `config.schema.lookup`, e incluyen `title`/`description` de los campos, indicaciones de interfaz coincidentes, resúmenes inmediatos de los elementos secundarios, metadatos de documentación en nodos anidados de objeto, comodín, matriz y composición, además de los esquemas de plugins y canales cuando están disponibles. El editor de JSON sin procesar solo está disponible cuando la instantánea permite una conversión de ida y vuelta segura del formato sin procesar; de lo contrario, la interfaz de control obliga a usar el modo de formulario.
    - La opción "Restablecer a lo guardado" del editor de JSON sin procesar conserva la estructura creada en formato sin procesar (formato, comentarios y disposición de `$include`) en lugar de volver a representar una instantánea aplanada, de modo que las modificaciones externas sobreviven al restablecimiento cuando la instantánea puede realizar una conversión de ida y vuelta de forma segura.
    - Los valores de objetos SecretRef estructurados se muestran como de solo lectura en los campos de texto del formulario para evitar que un objeto se convierta accidentalmente en una cadena y quede dañado.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens y costes estimados derivado de las sesiones se mantiene separado de la facturación del proveedor.
    - Las tarjetas de proveedores llaman a `usage.status` y muestran los nombres de los planes en tiempo real, los períodos de cuota, los saldos, los gastos y los presupuestos comunicados por los plugins de proveedores configurados.
    - Un error en el uso de un proveedor no bloquea el panel de sesiones y costes; las tarjetas de proveedores no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado, mantenimiento y modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye los tiempos de actualización y RPC de la interfaz de control, los tiempos de representación lenta del chat y la configuración, y entradas sobre la capacidad de respuesta del navegador para fotogramas de animación o tareas prolongados cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en tiempo real de los registros de archivo del Gateway, con opciones de filtrado y exportación (`logs.tail`).
    - Actualización: ejecuta una actualización del paquete o de Git junto con un reinicio (`update.run`) y un informe de reinicio; después consulta periódicamente `update.status` tras volver a conectarse para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de automatizaciones">
    - Al seleccionar una fila, se abre una vista detallada a página completa con un selector de activación/pausa y una opción para ejecutar ahora en el encabezado (ejecutar si corresponde, clonar y eliminar se encuentran en su menú); la pestaña de configuración permite editar la automatización en línea (instrucción, detalles, frecuencia y anulaciones avanzadas), y la pestaña de historial de ejecuciones muestra las ejecuciones de esa automatización.
    - Las automatizaciones iniciales situadas debajo de la tabla rellenan previamente el formulario de creación con una instrucción y una programación editables.
    - Para las tareas aisladas, la entrega utiliza de forma predeterminada un resumen de anuncio; se debe cambiar a ninguna para las ejecuciones exclusivamente internas.
    - Los campos de canal y destino aparecen cuando se selecciona el anuncio.
    - El modo Webhook utiliza `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de Webhook HTTP(S) válida.
    - Para las tareas de la sesión principal, están disponibles los modos de entrega mediante Webhook y sin entrega.
    - Los controles de edición avanzada incluyen eliminación después de la ejecución, eliminación de la anulación del agente, opciones de Cron exactas o escalonadas, anulaciones del modelo y el pensamiento del agente, y controles de entrega de mejor esfuerzo.
    - La validación del formulario se realiza en línea con errores por campo; los valores no válidos desactivan el botón de guardado hasta que se corrijan.
    - Establezca `cron.webhookToken` para enviar un token de portador específico; si se omite, el Webhook se envía sin encabezado de autenticación.
    - `cron.webhook` es un mecanismo alternativo heredado y obsoleto: ejecute `openclaw doctor --fix` para migrar los trabajos almacenados que todavía utilizan `notify: true` a una entrega explícita por trabajo mediante Webhook o al finalizar.

  </Accordion>
</AccordionGroup>

## Importar memoria del asistente

Abra **Settings** → **Import Memory** para incorporar memoria local de Codex o Claude Code
a un agente de OpenClaw. El Gateway detecta por sí mismo la memoria local compatible
en su host, por lo que una interfaz de control remota importa desde el equipo del Gateway y no desde el
equipo del navegador.

1. Elija el agente de destino.
2. Revise las colecciones de origen detectadas y los nombres de archivo Markdown. El contenido de los archivos
   no se envía en la respuesta del plan ni se muestra en la página.
3. Seleccione las colecciones que se importarán y confirme. Al aplicar, se vuelve a generar el plan antes de
   escribir, de modo que las selecciones obsoletas fallen de forma segura.
4. Si ya existen archivos, active **Replace existing imports**, actualice la
   vista previa y confirme la sustitución.

Codex solo importa sus archivos consolidados `MEMORY.md` y `memory_summary.md`. Claude
Code importa Markdown desde los directorios de memoria automática del proyecto y un
`autoMemoryDirectory` configurado; no importa sesiones, configuración, instrucciones ni
credenciales mediante esta página. Los archivos se copian en `memory/imports/` dentro del
espacio de trabajo seleccionado, donde el plugin de memoria activo puede indexarlos. Las fuentes
nunca se modifican.

Planificar y aplicar requieren `operator.admin`. Cada aplicación crea una copia de seguridad verificada de
OpenClaw cuando existe un estado, escribe un informe de migración censurado y conserva
copias de seguridad de cada elemento antes de reemplazar los archivos de destino existentes. Consulte
[Descripción general de la memoria](/es/concepts/memory#import-from-coding-assistants) para conocer las rutas y
el comportamiento de recuperación.

## Página de MCP

La página dedicada a MCP es una vista para operadores de los servidores MCP administrados por OpenClaw en `mcp.servers`. No inicia por sí sola los transportes MCP; úsela para inspeccionar y editar la configuración guardada y, a continuación, use `openclaw mcp doctor --probe` cuando necesite una comprobación del servidor en vivo.

Flujo de trabajo habitual:

1. Abra **MCP** en la barra lateral.
2. Compruebe en las tarjetas de resumen los recuentos de servidores totales, habilitados, con OAuth y filtrados.
3. Revise cada fila de servidor para consultar el transporte, la habilitación, la autenticación, los filtros, los tiempos de espera y las sugerencias de comandos.
4. Administre los servidores (añadir, habilitar/deshabilitar y eliminar) en la página **Plugins**, que es el único editor interactivo de `mcp.servers`; la lista de filas de esta página contiene un enlace a ella.
5. Edite la sección de configuración delimitada `mcp` para las definiciones de servidores, encabezados, rutas TLS/mTLS, metadatos de OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Use **Guardar** para escribir la configuración o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde un terminal para realizar diagnósticos estáticos, comprobaciones en vivo o descartar el entorno de ejecución almacenado en caché.

La página censura los valores similares a URL que contienen credenciales antes de mostrarlos y entrecomilla los nombres de los servidores en los fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres del shell. Referencia completa de la CLI y la configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad se encuentra en **Configuración › Sistema**, junto a Registros y Depuración. Es un observador efímero y local del navegador para la actividad de herramientas en vivo, derivado del mismo flujo de eventos `session.tool` y de herramientas del Gateway que alimenta las tarjetas de herramientas del Chat. No añade otra familia de eventos del Gateway, punto de conexión, almacén de actividad persistente, fuente de métricas ni flujo de observación externo.

Las entradas de Actividad solo conservan resúmenes saneados y vistas previas censuradas y truncadas de la salida. Los valores de los argumentos de las herramientas no se almacenan en el estado de Actividad; la interfaz indica que los argumentos están ocultos y solo registra el número de campos de argumentos. La lista en memoria pertenece a la pestaña actual del navegador, persiste al navegar dentro de la interfaz de control y se restablece al recargar la página, cambiar de sesión o seleccionar **Borrar**.

## Terminal del operador

El terminal acoplable del operador está deshabilitado de forma predeterminada. Para habilitarlo, establezca `gateway.terminal.enabled: true` y reinicie el Gateway. El terminal requiere una conexión `operator.admin` y abre una PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
El terminal es un shell del host sin confinamiento y hereda el entorno del proceso del Gateway. Habilítelo únicamente en implementaciones con operadores de confianza. OpenClaw rechaza las sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Use **Ctrl + acento grave** para mostrar u ocultar el panel acoplable. El diseño permite acoplarlo en la parte inferior o derecha, cambia de tamaño con la ventana gráfica del navegador y mantiene varias pestañas de shell. Consulte [Configuración del Gateway](/es/gateway/configuration-reference#gateway) para conocer `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Las sesiones de Codex y Claude Code detectadas en la barra lateral de sesiones pueden abrirse en su CLI nativa dentro del mismo panel de terminal. En **Configuración › Chat**, establezca **Abrir sesiones de Codex/Claude en** en **Terminal** para que un clic normal en una fila abra `codex resume` o `claude --resume`; el visor de solo lectura de OpenClaw sigue siendo la opción predeterminada. El menú contextual o el menú de tres puntos de una fila siempre ofrece ambas opciones, y el encabezado del visor incluye **Abrir en terminal** cuando la sesión cumple los requisitos.

Los requisitos se evalúan por sesión y por host. Las sesiones locales del Gateway inician el comando de reanudación propiedad del proveedor en el host del Gateway. Las sesiones de nodos emparejados inician un comando del proveedor incluido en la lista de permitidos en el nodo propietario y retransmiten únicamente los eventos de salida, entrada y cambio de tamaño de esa PTY; esto no expone un shell general del nodo ni acepta comandos proporcionados por el navegador. Los nodos que no anuncian el comando correspondiente para reanudar el terminal, incluidos los puentes de trabajadores integrados sin transmisión bidireccional, mantienen disponible el visor e indican que la apertura del terminal no está disponible.

Las sesiones persisten tras las desconexiones: una recarga de la página, la suspensión del portátil o una interrupción breve de la red desvincula la sesión en el Gateway en lugar de terminarla, y la misma pestaña del navegador vuelve a vincularse al reconectar y reproduce la salida reciente. Las sesiones desvinculadas se terminan después de `gateway.terminal.detachedSessionTimeoutSeconds` (300 segundos de forma predeterminada; `0` restablece la terminación al desconectarse). `terminal.list` muestra las sesiones que se pueden vincular, `terminal.attach` adopta una (toma de control al estilo de tmux) y `terminal.text` lee la salida reciente de una sesión como texto sin formato sin vincularse, una función destinada a agentes y herramientas.

El terminal también está disponible como documento de pantalla completa dedicado exclusivamente al terminal en `/?view=terminal`. Las aplicaciones para iOS y Android integran esta página en sus pantallas de Terminal y reutilizan las credenciales almacenadas del Gateway; la disponibilidad depende de las mismas restricciones `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece el terminal.

## Panel del navegador

La interfaz de control incluye un panel del navegador acoplable que representa el navegador controlado por el Gateway (el mismo que los agentes manejan mediante la [herramienta de navegador](/es/tools/browser-control)) en cualquier navegador web convencional, sin necesidad de una vista web nativa. Aparece cuando el Gateway conectado anuncia `browser.request` a una conexión `operator.admin`; el botón del globo terráqueo en la barra del espacio de trabajo de la sesión permite mostrarlo u ocultarlo. El panel muestra una instantánea en vivo de la página con pestañas, una barra de URL editable, controles para retroceder, avanzar y recargar, y una opción para abrirla en el navegador; puede acoplarse a la derecha o en la parte inferior y reenvía los clics, el desplazamiento con la rueda y la escritura básica a la página remota.

Dos modos de captura preparan el contexto de la página para el agente:

- **Anotar (lápiz)**: dibuje marcas a mano alzada sobre la página. **Enviar al chat** combina los trazos con la captura de pantalla, adjunta la imagen al redactor del chat activo y rellena previamente una instrucción que describe la URL y el título de la página, así como cada región marcada, para que el agente sepa exactamente qué se ha rodeado.
- **Inspeccionar (puntero)**: pase el cursor para ver el elemento situado debajo (selector, nombre accesible, rol y tamaño); haga clic para enviar los detalles de ese elemento junto con una captura de pantalla resaltada mediante el mismo flujo del redactor. La inspección, el desplazamiento con la rueda y los controles de retroceso y avance requieren `browser.evaluateEnabled` (habilitado de forma predeterminada).

La aplicación para macOS conserva su barra lateral nativa de navegación de enlaces para los enlaces pulsados en el panel; el panel del navegador también funciona allí y permite anotar páginas en todas las demás plataformas.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma de inmediato con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de confianza de la interfaz de control también pueden recibir metadatos opcionales de temporización de confirmación para diagnósticos locales.
    - Las cargas del chat aceptan imágenes y archivos que no sean de vídeo. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como contenido multimedia administrado y aparecen en el historial como enlaces de archivos adjuntos.
    - Volver a enviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` tras completarse.
    - Las respuestas de `chat.history` tienen un tamaño limitado para proteger la interfaz. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y sustituir los mensajes de tamaño excesivo por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se ha truncado en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de la transcripción normalizada para su visualización mediante `chat.message.get`, usando `sessionKey`, el `agentId` activo cuando sea necesario y el `messageId` de la transcripción. Si el Gateway sigue sin poder devolver más contenido, el lector muestra un estado explícito de indisponibilidad en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas o producidas por el asistente se conservan como referencias de contenido multimedia administrado y vuelven a servirse mediante URL de contenido multimedia autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al representar `chat.history`, la interfaz de control elimina del texto visible del asistente las etiquetas de directivas insertadas únicamente para visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y los bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en formato ASCII o de ancho completo. Omite las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista del chat mantiene visibles los mensajes locales optimistas del usuario y del asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica sustituye esos mensajes locales cuando el historial del Gateway se pone al día.
    - Los eventos `chat` en directo representan el estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción persistente de la sesión. Después de los eventos finales de herramientas, la interfaz de control vuelve a cargar el historial y combina únicamente una pequeña cola optimista; el límite de la transcripción se documenta en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones exclusivas de la interfaz (sin ejecución del agente ni entrega al canal).
    - La barra lateral enumera todas las sesiones activas cargadas, organizadas por sección de agente y por grupos de sesiones fijadas, de canal, de trabajo, personalizadas y Chats, con una única acción New Session que abre el cuadro de diálogo de borrador. Abrir una fila visible solo desplaza el resaltado. Los grupos personalizados se pueden contraer y reordenar mediante arrastre, y las sesiones pueden soltarse en un grupo o en Chats; los nombres y el orden de los grupos se sincronizan mediante el Gateway, mientras que el estado contraído permanece en el navegador. Una sesión nueva del panel obtiene de forma asíncrona un título conciso generado a partir de su primer mensaje que no sea un comando; los nombres explícitos nunca se sustituyen. Configure `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para dirigir esta llamada independiente del modelo a un modelo de menor coste. Expandir la sección de otro agente permite explorar las sesiones de ese agente sin abandonar el chat abierto.
    - La búsqueda de sesiones se encuentra en la paleta de comandos (⌘K o el campo Search de la parte superior de la barra lateral): al escribir una consulta, se recorre un número limitado de páginas coincidentes entre agentes, se filtran las filas internas secundarias o de Cron y se muestran las coincidencias visibles junto a los comandos de navegación. La página Sessions conserva la lista exhaustiva con búsqueda y filtros.
    - Cada fila de la barra lateral mantiene acceso directo para fijarla, además de un menú contextual completo para el estado de lectura, el cambio de nombre, la bifurcación, la agrupación, el archivado y la eliminación. Las filas seleccionadas conjuntamente (Cmd/Ctrl-clic, Mayús-clic para intervalos) disponen de un menú por lotes que abarca el estado de lectura, la agrupación, el archivado y la eliminación; el archivado o la eliminación por lotes permanecen desactivados a menos que todas las sesiones seleccionadas puedan archivarse. No se pueden archivar una ejecución activa ni la sesión principal de un agente. Al archivar o eliminar la sesión seleccionada actualmente, Chat vuelve a la sesión principal de ese agente.
    - En la aplicación para macOS, la marca de OpenClaw utiliza la franja normalmente vacía de la barra de título nativa, junto a los controles de la ventana, en lugar de ocupar una fila de la barra lateral.
    - En anchuras de escritorio, los controles del chat permanecen en una sola fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver a la parte superior o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados que solo contienen texto se representan como una sola burbuja con una insignia de cantidad. Los mensajes que contienen imágenes, archivos adjuntos, resultados de herramientas o vistas previas de Canvas no se contraen.
    - Cuando el checkout de una sesión se encuentra en una rama no predeterminada de un repositorio de GitHub, la vista del chat fija chips de solicitudes de incorporación de cambios encima del editor: número de PR, repositorio, rama, recuentos de diferencias, una píldora de CI y estado de borrador, fusionada o cerrada, cada uno con un enlace a la PR. La fila muestra como máximo dos chips —primero las PR activas (abiertas o en borrador)— y un botón "Show more" revela el historial contraído de PR fusionadas o cerradas. La píldora de CI abre una pequeña ventana emergente de supervisión de CI con el número de comprobaciones superadas, fallidas, en ejecución y omitidas, además de un enlace a la página de comprobaciones de la PR. La detección se ejecuta en el servidor mediante `controlUi.sessionPullRequests`, que reutiliza los valores `GH_TOKEN`/`GITHUB_TOKEN` del Gateway cuando están configurados. Cuando se alcanza el límite de frecuencia de la API de GitHub, los chips conservan el último estado conocido y muestran una advertencia de que podría estar desactualizado; descartar un chip lo oculta para esa sesión en el perfil actual del navegador. Antes de que exista una PR, la fila muestra la propia rama: repositorio, nombre de la rama y tamaño +/− de la diferencia respecto a la base de fusión de la rama predeterminada (trabajo confirmado y sin confirmar). Cuando la rama enviada contiene confirmaciones que se pueden comparar, la fila añade un botón Create PR que abre la página de nueva solicitud de incorporación de cambios de GitHub; antes de eso, una sesión con archivos modificados (confirmados, sin confirmar o sin seguimiento) sigue mostrando la fila, pero sin el botón. La fila se oculta mientras existe una PR abierta o en borrador. La fila de la rama procede únicamente del repositorio git local, por lo que sigue disponible mientras GitHub limita la frecuencia y muestra la misma advertencia de estado desactualizado, ya que no se puede confiar en el resultado "no se encontró ninguna PR" hasta que se restablezca el límite.
    - El panel de diferencias de la sesión muestra lo que realmente ha cambiado el checkout de una sesión: el botón de la rama (en el encabezado del panel lateral del espacio de trabajo, en el encabezado del panel dividido o como botón flotante en el chat de un solo panel) abre el panel de detalles con las diferencias por archivo del trabajo de la rama, sin confirmar y sin seguimiento respecto a la base de fusión de la rama predeterminada del checkout: punto de estado, flecha de cambio de nombre, recuentos +/− por archivo, archivos contraíbles y marcadores de "N líneas sin modificar" entre bloques de cambios. Las diferencias se calculan en el servidor mediante el método `sessions.diff` del Gateway (ámbito `operator.read`); los archivos binarios y de tamaño excesivo se reducen a entradas únicamente estadísticas, y el botón solo aparece cuando el Gateway conectado anuncia `sessions.diff`.
    - El panel lateral del espacio de trabajo de la sesión en cada panel de Chat enumera los archivos de la sesión, los archivos del proyecto y los artefactos. De forma predeterminada, se acopla al borde derecho del panel; arrastre su encabezado (o utilice el botón de acoplamiento) para moverlo a la parte inferior, y la elección se almacena en el perfil actual del navegador. Un panel lateral contraído no ocupa ningún espacio: vuelva a abrirlo con ⇧⌘B, el selector de archivos del encabezado del panel dividido o el botón flotante de archivos del chat de un solo panel (ambos muestran una insignia con el número de archivos modificados). El panel independiente de detalles de archivos, herramientas y Canvas no se ve afectado.
    - Al hacer clic en una referencia de archivo del chat, una ruta de archivo de una tarjeta expandida de herramienta de lectura, edición o escritura, o una fila de archivo del panel lateral del espacio de trabajo, se abre el panel de detalles del archivo: una vista de código basada en CodeMirror con resaltado de sintaxis, números de línea, salto a línea, búsqueda en el archivo, acciones de copia y un menú para abrir en un editor externo. Cuando el Gateway anuncia `sessions.files.set` a una conexión `operator.admin`, el panel añade un modo Edit con seguimiento de modificaciones y guardado mediante Cmd/Ctrl-S; los borradores sin guardar sobreviven a la navegación entre archivos, paneles y sesiones en la pestaña actual del navegador hasta que se guardan o descartan explícitamente. Los guardados utilizan comparación e intercambio sobre un hash del contenido devuelto por `sessions.files.get`: si el archivo ha cambiado en el disco desde que se cargó (por ejemplo, porque el agente siguió trabajando), el panel muestra un aviso de conflicto con las acciones Reload (usar el contenido más reciente) y Overwrite (conservar la edición local). Las escrituras pasan por las mismas protecciones de seguridad del sistema de archivos del espacio de trabajo que las lecturas: confinamiento de rutas, rechazo de enlaces simbólicos o duros y un límite de 256 KB en UTF-8; además, solo sobrescriben archivos existentes. El editor nunca los crea ni los elimina.
    - El panel lateral de tareas en segundo plano de cada panel de Chat enumera las tareas en segundo plano y los subagentes del agente actual (`tasks.list` limitado por agente y actualizado en directo mediante eventos `task`): el trabajo en ejecución muestra un temporizador de tiempo transcurrido en directo, el número de usos de herramientas, la herramienta que se utiliza actualmente y un control para detenerlo; la sección contraíble de tareas finalizadas añade las duraciones de las ejecuciones; y un enlace View transcript abre la sesión secundaria de la tarea en el panel. Ábralo con el selector de actividad del encabezado del panel dividido o el botón flotante de actividad del chat de un solo panel; la instantánea de tareas se carga de forma anticipada, por lo que ambos muestran una insignia con el número de tareas en ejecución sin necesidad de abrir primero el panel lateral. La página Tasks sigue siendo el registro completo de todos los agentes.
    - El panel lateral del espacio de trabajo, el panel lateral de tareas en segundo plano y el panel de detalles se adaptan a la anchura propia de cada panel, en lugar de a la de la ventana: en un panel estrecho o una ventana compacta, ambos paneles laterales se presentan como franjas inferiores (los controles de acoplamiento lateral se ocultan hasta que el panel se ensancha; el panel lateral del espacio de trabajo tiene prioridad sobre la posición lateral cuando solo cabe una columna), y el panel de detalles se apila debajo del hilo con un control horizontal de cambio de tamaño, en lugar de compartir la fila. En ventanas gráficas del tamaño de un teléfono, el panel de detalles sigue abriéndose a pantalla completa.
    - Los selectores de modelo y razonamiento del encabezado del chat actualizan inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío para un solo turno.
    - **Vista dividida:** ábrala desde la fila de selectores flotantes de la esquina superior derecha (junto a los selectores de diferencias de la sesión, tareas en segundo plano y archivos de la sesión) y, a continuación, divida el panel activo hacia la derecha o hacia abajo para crear tantos paneles como quepan. Cada panel tiene su propia sesión, transcripción, editor y flujo de herramientas.
    - Arrastre una sesión desde la barra lateral hasta el chat para abrirla en un panel. Una vista previa animada del destino se desliza entre las zonas y etiqueta el resultado: "Split" sobre la mitad exacta que ocupará un panel nuevo y "Open here" sobre un panel completo. También se pueden soltar sesiones desde el modo de un solo panel.
    - El panel dividido activo determina la selección de la barra lateral y la URL. Cada panel contiene su propia fila de encabezado con el título de la sesión y controles para el panel lateral del espacio de trabajo, la división y el cierre; los separadores permiten cambiar el tamaño de las columnas y los paneles apilados, y el navegador almacena localmente la disposición entre recargas.
    - En pantallas estrechas, la vista dividida conserva la disposición, pero solo representa el panel activo, incluido su encabezado con el control de cierre.
    - Si se envía un mensaje mientras aún se está guardando un cambio del selector de modelo para la misma sesión, el editor espera a que finalice esa actualización de la sesión antes de llamar a `chat.send`, de modo que el envío utilice el modelo seleccionado.
    - Escribir `/new` crea y cambia a la misma sesión nueva del panel que New Chat, excepto cuando `session.dmScope: "main"` está configurado y la sesión superior actual es la sesión principal del agente; en ese caso, restablece la sesión principal en el mismo lugar. Escribir `/reset` mantiene el restablecimiento explícito en el mismo lugar del Gateway para la sesión actual.
    - El selector de modelos del chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.models` está presente, esa lista de permitidos determina el contenido del selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos limitados al proveedor. De lo contrario, el selector muestra las entradas `models.providers.*.models` explícitas, además de los proveedores con autenticación utilizable. El catálogo completo sigue estando disponible mediante la RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes de uso de sesiones recientes del Gateway incluyen los tokens del contexto actual, la barra de herramientas del editor de chat muestra un pequeño anillo de uso del contexto con el porcentaje utilizado. Abra el anillo para consultar la ventana de contexto actual, los recuentos de tokens de la ejecución más reciente y el coste total estimado, la identidad del proveedor y del modelo, y el desglose más reciente de los costes de entrada, salida y caché de la respuesta del proveedor, cuando se notifique. El anillo cambia al estilo de advertencia cuando la presión del contexto es alta y, al alcanzar los niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de la sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelve a informar de datos de uso recientes.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en el navegador)">
    El modo de conversación utiliza un proveedor de voz en tiempo real registrado. Configure OpenAI con `talk.realtime.provider: "openai"` más un perfil de clave de API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`. OpenAI Realtime utiliza la API pública de Platform y requiere una clave de API de Platform; un inicio de sesión OAuth de Codex no satisface esta interfaz. Configure Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor: OpenAI recibe un secreto de cliente efímero de Realtime para WebRTC, y Google Live recibe un token de autenticación restringido y de un solo uso de la API Live para una sesión WebSocket del navegador, con las instrucciones y las declaraciones de herramientas fijadas en el token por el Gateway. Los proveedores que solo exponen un puente de tiempo real de backend se ejecutan mediante el transporte de retransmisión del Gateway, de modo que las credenciales y los sockets del proveedor permanecen en el servidor mientras el audio del navegador se transmite mediante RPC autenticadas del Gateway. El prompt de la sesión de Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por quien realiza la llamada.

    Los valores predeterminados persistentes de proveedor, modelo, voz, transporte, esfuerzo de razonamiento, umbral VAD exacto, duración del silencio y relleno de prefijo se encuentran en **Settings → Communications → Talk**; cambiarlos requiere acceso a `operator.admin`. Configurar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; configurar WebRTC mantiene la sesión bajo el control del cliente y produce un error, en lugar de recurrir silenciosamente a la retransmisión, si el proveedor no puede crear una sesión de navegador.

    El propio control de conversación es el botón del micrófono de la barra de herramientas del editor. Su flecha desplegable muestra **System default** y todos los micrófonos que el navegador expone, incluidas las entradas USB, Bluetooth y virtuales. El identificador del dispositivo seleccionado permanece únicamente en el navegador y nunca se envía al Gateway; si ese dispositivo exacto desaparece, el modo de conversación solicita que se elija otra entrada en lugar de grabar silenciosamente desde otro micrófono. Mientras el modo de conversación está activo, el botón del micrófono se convierte en una pastilla que muestra el medidor de nivel de entrada en directo; al hacer clic se detiene la entrada de voz y, al pasar el cursor por encima, aparece el glifo de detención. Los lectores de pantalla anuncian `Connecting voice input...`, `Listening...` o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta el modelo de mayor tamaño configurado mediante `talk.client.toolCall`. Detener una respuesta del agente en curso sigue siendo un control cuadrado independiente **Stop** junto a la pastilla.

    Prueba de humo en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC del navegador de OpenAI, la configuración WebSocket del navegador con token restringido de Google Live y el adaptador de navegador de retransmisión del Gateway con medios de micrófono simulados. El comando solo imprime el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y cancelar">
    - Haga clic en **Stop** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haga clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en curso.
    - Escriba `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para cancelar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para cancelar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Conservación parcial al cancelar">
    - Cuando se cancela una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz de usuario.
    - El Gateway conserva el texto parcial cancelado del asistente en el historial de transcripción cuando existe salida almacenada en el búfer.
    - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores de la transcripción puedan distinguir los fragmentos parciales cancelados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, una interrupción de la conexión con el Gateway no cierra la sesión. El panel
permanece visible con una pastilla ámbar flotante "Gateway connection lost — Reconnecting…" debajo de la barra
superior mientras el cliente reintenta automáticamente con espera incremental (de 800 ms hasta 15 s). Las actualizaciones en directo y
las acciones de tiempo real o de sesión se pausan hasta que vuelve la conexión; **Retry now** en la pastilla fuerza un
intento inmediato. El chat sigue siendo editable: los envíos de texto ordinario y archivos adjuntos se conservan en el
almacenamiento del navegador de la pestaña actual, delimitado por Gateway y sesión, se muestran como pendientes de reconexión y se envían
automáticamente cuando vuelve el Gateway. Los controles en directo y los comandos con barra permanecen indisponibles mientras
no haya conexión.

Cuando este navegador ya contiene credenciales (un token o una contraseña configurados, o un token de dispositivo
aprobado), las primeras aperturas y las recargas muestran una pequeña marca animada de OpenClaw mientras se
establece la conexión, en lugar de mostrar brevemente la pantalla de inicio de sesión. Esta pantalla solo aparece cuando aún no hay credenciales
almacenadas o cuando el Gateway las rechaza activamente (token o contraseña incorrectos, vinculación revocada);
estos estados requieren intervención en lugar de esperar.

## Instalación de la PWA y notificaciones web push

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway active la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Si la página muestra **Protocol mismatch** justo después de una actualización de OpenClaw, primero vuelva a abrir el panel con `openclaw dashboard` y realice una actualización forzada. Si el problema persiste, borre los datos del sitio del origen del panel o pruebe en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador pueden seguir ejecutando un paquete de la interfaz de control anterior a la actualización contra el Gateway más reciente.

| Superficie                                            | Función                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto de la PWA. Los navegadores ofrecen "Install app" cuando está accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (en el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador conservados.                 |

Anule el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando desee fijar las claves (despliegues con varios hosts, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (el valor predeterminado es `https://openclaw.ai`)

La interfaz de control utiliza estos métodos del Gateway restringidos por ámbito para registrar y probar las suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción de quien realiza la llamada.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulte [Configuración](/es/gateway/configuration) para las notificaciones push respaldadas por retransmisión) y del método `push.test`, dirigido a la vinculación móvil nativa.
</Note>

## Contenido alojado incrustado

Los mensajes del asistente pueden mostrar contenido web alojado en línea con el shortcode `[embed ...]`. La política del sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

El Plugin Canvas incluido también proporciona [`show_widget`](/es/tools/show-widget) para representar SVG o HTML autocontenido directamente desde una llamada de herramienta. El navegador anuncia la capacidad `inline-widgets` del Gateway, y el documento de Canvas resultante sigue disponible cuando se vuelve a cargar el historial del chat. Las ejecuciones originadas en canales no reciben esta herramienta.

<Tabs>
  <Tab title="strict">
    Deshabilita la ejecución de scripts dentro del contenido alojado incrustado.
  </Tab>
  <Tab title="scripts (default)">
    Permite contenido incrustado interactivo y mantiene el aislamiento del origen; suele ser suficiente para juegos o widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan intencionadamente privilegios más amplios.
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
Utilice `trusted` solo cuando el documento incrustado necesite realmente un comportamiento del mismo origen. Para la mayoría de los juegos y lienzos interactivos generados por agentes, `scripts` es la opción más segura.
</Warning>

Las URL externas absolutas de contenido incrustado `http(s)` permanecen bloqueadas de forma predeterminada. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, establezca `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de los mensajes del chat

La transcripción del chat utiliza un marco centrado y legible alineado con el editor. La salida del asistente y de las herramientas permanece alineada a la izquierda, mientras que las burbujas del usuario permanecen alineadas a la derecha dentro de ese marco. Los despliegues con monitores anchos pueden anular el ancho de la transcripción sin modificar el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los formatos admitidos incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso mediante tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenga el Gateway en la interfaz de bucle invertido y permita que Tailscale Serve actúe como proxy mediante HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra `https://<magicdns>/` (o su `gateway.controlUi.basePath` configurado).

    De forma predeterminada, las solicitudes de Serve de la interfaz de control/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo la acepta cuando la solicitud llega por la interfaz de bucle invertido con los encabezados `x-forwarded-*` de Tailscale. En las sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite el intercambio de vinculación del dispositivo; los navegadores sin dispositivo y las conexiones con rol de Node continúan con las comprobaciones normales del dispositivo. Establezca `gateway.auth.allowTailscale: false` si desea exigir credenciales explícitas de secreto compartido incluso para el tráfico de Serve y, a continuación, utilice `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos de la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de escribir los límites de frecuencia. Por tanto, los reintentos incorrectos simultáneos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud, en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación de Serve sin token presupone que el host del gateway es de confianza. Si puede ejecutarse código local no fiable en ese host, exija autenticación mediante token o contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abra `http://<tailscale-ip>:18789/` (o su `gateway.controlUi.basePath` configurado).

    Pegue el secreto compartido correspondiente en la configuración de la interfaz de usuario (se envía como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP no seguro

Si abre el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP no seguro solo para localhost mediante `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta del operador en la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`
- mecanismo de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** utilice HTTPS (Tailscale Serve) o abra la interfaz de usuario localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del gateway).

<AccordionGroup>
  <Accordion title="Comportamiento del selector de autenticación no segura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es solo un selector de compatibilidad local:

    - Permite que las sesiones locales de la interfaz de control continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No reduce los requisitos de identidad del dispositivo remoto (no local).

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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad del dispositivo de la interfaz de control y supone una reducción grave de la seguridad. Reviértalo rápidamente después de usarlo en una emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre el proxy de confianza">
    - Una autenticación correcta mediante un proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se aplica a las sesiones de la interfaz de control con rol de Node.
    - Los proxies inversos de bucle invertido en el mismo host tampoco cumplen la autenticación mediante proxy de confianza; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/es/gateway/tailscale) para obtener instrucciones de configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control incluye una política `img-src` estricta: solo se permiten recursos del **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes `http(s)` remotas y relativas al protocolo, y nunca realiza solicitudes de red para ellas.

En la práctica:

- Los avatares y las imágenes servidos mediante rutas relativas (por ejemplo, `/avatars/<id>`) siguen mostrándose, incluidas las rutas de avatares autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` insertadas siguen mostrándose.
- Las URL `blob:` locales creadas por la interfaz de control siguen mostrándose.
- El Gateway obtiene los avatares de las vistas previas de enlaces de GitHub desde el host fijo de avatares de GitHub y los devuelve como URL `data:` acotadas; el navegador del operador nunca contacta con el host remoto de avatares.
- Las URL de avatares remotos emitidas por los metadatos del canal se eliminan en los auxiliares de avatares de la interfaz de control y se sustituyen por el logotipo o distintivo integrado, de modo que un canal comprometido o malicioso no pueda forzar la obtención de imágenes remotas arbitrarias desde el navegador de un operador.

Esta protección está siempre activa y no se puede configurar.

## Autenticación de la ruta de avatares

Cuando se configura la autenticación del Gateway, el punto de conexión de avatares de la interfaz de control requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a solicitantes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar conforme a la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (al igual que en la ruta relacionada de contenido multimedia del asistente), por lo que la ruta de avatares no puede filtrar la identidad del agente en hosts que, por lo demás, están protegidos.
- La interfaz de control reenvía el token del Gateway como encabezado de portador al obtener avatares y utiliza URL de blob autenticadas para que la imagen siga mostrándose en los paneles.

Si se desactiva la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatares también deja de requerir autenticación, en consonancia con el resto del Gateway.

## Autenticación de la ruta de contenido multimedia del asistente

Cuando se configura la autenticación del Gateway, las vistas previas de contenido multimedia local del asistente utilizan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la interfaz de control; el navegador envía el token del Gateway como encabezado de portador al comprobar la disponibilidad.
- Las respuestas correctas de metadatos incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, vídeo y documentos que muestra el navegador utilizan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la representación de contenido multimedia compatible con los elementos multimedia nativos del navegador sin incluir credenciales reutilizables del Gateway en URL de contenido multimedia visibles.

## Enlaces de aprobación

Las notificaciones de aprobación del operador pueden incluir enlaces directos a un documento de aprobación independiente servido bajo el espacio de nombres reservado `${controlUiBasePath}/approve/{approvalId}` (por ejemplo, `/approve/<approvalId>`, o `/openclaw/approve/<approvalId>` con una ruta base configurada). La URL permanece estable durante la vigencia de la aprobación y se puede reenviar de forma segura entre dispositivos propios: identifica la aprobación, pero nunca la autoriza.

- El espacio de nombres de un segmento `/approve/<approvalId>` está reservado por el Gateway antes que las rutas HTTP de los plugins para **todos** los métodos HTTP, por lo que una ruta de plugin nunca puede ocultar ni interceptar un documento de aprobación.
- Para abrir un documento de aprobación se requiere la misma autenticación del Gateway que para el resto de la interfaz de control (token/contraseña, identidad de Tailscale Serve o identidad de proxy de confianza); las credenciales nunca forman parte de la URL de aprobación.
- Cuando se desactiva el servicio de la interfaz de control, las solicitudes al espacio de nombres devuelven `404` en lugar de pasar a los controladores de plugins.
- El inicio de sesión en un documento de aprobación es efímero para esa página: no sobrescribe la selección ni la configuración del Gateway guardadas por la interfaz de control completa en el mismo navegador.

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

A continuación, configure la interfaz para que apunte a la URL WS del Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de la interfaz de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, es posible que una extensión o un script de contenido ejecutado en una fase temprana haya impedido evaluar la aplicación de módulos JavaScript. La página estática incluye un panel de recuperación HTML sencillo que aparece cuando `<openclaw-app>` no se registra tras el inicio.

Use la acción **Try again** del panel después de cambiar el entorno del navegador, o recargue manualmente después de realizar estas comprobaciones:

- Desactive las extensiones que insertan contenido en todas las páginas, especialmente las extensiones con scripts de contenido `<all_urls>`.
- Pruebe una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantenga el Gateway en ejecución y compruebe la misma URL del panel después de cambiar el navegador.

## Depuración y pruebas: servidor de desarrollo + Gateway remoto

La interfaz de control consta de archivos estáticos; el destino WebSocket se puede configurar y puede ser distinto del origen HTTP. Esto resulta útil cuando se desea ejecutar localmente el servidor de desarrollo de Vite, pero el Gateway se ejecuta en otro lugar.

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

    Autenticación opcional de un solo uso (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si se proporciona un punto de conexión `ws://` o `wss://` completo mediante `gatewayUrl`, codifique el valor para URL a fin de que el navegador analice correctamente la cadena de consulta.
    - `token` debe proporcionarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones mediante los registros de solicitudes y el encabezado Referer. Los parámetros de consulta `?token=` heredados aún se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se conserva únicamente en memoria.
    - Cuando se establece `gatewayUrl`, la interfaz no recurre a las credenciales de la configuración ni del entorno. Proporcione `token` (o `password`) explícitamente; la ausencia de credenciales explícitas es un error.
    - Use `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no insertada), para evitar el secuestro de clics.
    - Las implementaciones públicas de la interfaz de control fuera del bucle invertido deben establecer `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas del mismo origen en LAN/Tailnet desde hosts de bucle invertido, RFC1918/enlace local, `.local`, `.ts.net` o CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
    - El inicio del Gateway puede registrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir de la dirección de enlace y el puerto efectivos del entorno de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No use `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen del navegador, no «coincidir con cualquier host que esté usando».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de origen alternativo basado en el encabezado Host, pero es un modo de seguridad peligroso.

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

## Contenido relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [Chat web](/es/web/webchat) — interfaz de chat basada en navegador
