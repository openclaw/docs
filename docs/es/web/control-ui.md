---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a la red Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-22T10:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2beffc6df93c0b4fa76bb73e8d45a17b34f033a84820fe160f9a64f700d7afad
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de página única de **Vite + Lit** servida por el Gateway:

- valor predeterminado: `http://<host>:18789/`
- prefijo opcional: establezca `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

Mientras se observa una sesión en ejecución, el Gateway puede usar el modelo auxiliar de ese agente para generar un resumen compacto del estado. El chat lo muestra como una insignia de estado de una línea que se expande para formar una tarjeta con la evaluación, el progreso del plan, los pull requests y el tiempo transcurrido. La tarjeta puede expandirse una vez cuando una ejecución se atasca o necesita intervención; el chat lateral de `/btw` tiene prioridad sobre la tarjeta expandida.

La tarjeta expandida también admite preguntas breves sobre la ejecución. Las respuestas usan únicamente el resumen actual del observador y notas acotadas y depuradas, permanecen en el navegador durante esa sesión y nunca entran en la ejecución del agente principal ni la interrumpen. Si las observaciones no contienen la respuesta, el observador indica que no puede saberla.

Cuando llega el primer resumen, este pasa a controlar el subtítulo de la sesión en la barra lateral en lugar de la actividad en vivo heurística. Un resumen final completado o fallido permanece visible mientras la sesión no se haya leído; después, la fila vuelve a mostrar su subtítulo de trabajo habitual.

La observación de sesiones está habilitada de forma predeterminada. En **Settings > Appearance > Sidebar**, se puede desactivar en todo el Gateway, consultar el modelo pequeño resuelto y su procedencia, elegir el enrutamiento automático, deshabilitar las tareas auxiliares o seleccionar un `agents.defaults.utilityModel` explícito. Los controles de configuración equivalentes son `gateway.controlUi.sessionObserver: false` y `agents.defaults.utilityModel: ""`.

## Apertura rápida (local)

Si el Gateway se ejecuta en el mismo equipo, abra [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no se carga, inicie primero el Gateway: `openclaw gateway`.

<Note>
En enlaces LAN nativos de Windows, el Firewall de Windows o una directiva de grupo administrada por la organización pueden seguir bloqueando la URL de LAN anunciada, incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecute `openclaw gateway status --deep` en el host de Windows; informa de puertos probablemente bloqueados, discrepancias de perfiles y reglas del firewall local que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración conserva un token para la sesión de la pestaña actual del navegador y la URL del Gateway seleccionada; las contraseñas no se conservan. La incorporación suele generar un token del Gateway para la autenticación mediante secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

La conexión desde un navegador o dispositivo nuevo suele requerir una **aprobación de emparejamiento única**, mostrada como `disconnected (1008): pairing required`.

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

Si el navegador vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`; vuelva a ejecutar `openclaw devices list` antes de aprobarlo.

Cambiar un navegador ya emparejado del acceso de lectura al acceso de escritura/administración se trata como una ampliación de la aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con permisos más amplios y solicita que se apruebe explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requiere una nueva aprobación, salvo que se revoque mediante `openclaw devices revoke --device <id> --role <role>`. Consulte la [CLI de dispositivos](/es/cli/devices) para obtener información sobre la rotación y revocación de tokens, así como sobre el flujo de aprobación inicial de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas desde un navegador mediante la interfaz de bucle invertido local (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el proceso de emparejamiento para las sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, se verifica la identidad de Tailscale y el navegador presenta la identidad de su dispositivo. Los navegadores sin identidad de dispositivo y las conexiones con rol de Node siguen las comprobaciones de dispositivos habituales.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar sus datos requiere volver a realizar el emparejamiento.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión para iOS/Android sin abrir una terminal:

<Steps>
  <Step title="Abrir el emparejamiento móvil">
    Seleccione **Devices** y haga clic en **Pair mobile device** en la tarjeta **Devices**.
  </Step>
  <Step title="Conectar el teléfono">
    En la aplicación móvil de OpenClaw, abra **Settings** → **Gateway** y escanee el código QR. Como alternativa, puede copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La aplicación oficial para iOS/Android se conecta automáticamente. Si **Pending approval** muestra una solicitud, revise su rol y sus ámbitos antes de aprobarla.
  </Step>
</Steps>

La creación de un código de configuración requiere `operator.admin`; el botón está deshabilitado en las sesiones que no lo tienen. Un código de configuración contiene una credencial de arranque de corta duración, así que trate el QR y el código copiado como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); el `ws://` simple se limita a las direcciones de bucle invertido y de LAN privada. Consulte [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para obtener todos los detalles de seguridad y respaldo.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) que se adjunta a los mensajes salientes para atribuirlos en sesiones compartidas. Se almacena en el navegador, limitada al perfil de navegador actual, y no se sincroniza con otros dispositivos ni se conserva en el servidor más allá de los metadatos habituales de autoría de la transcripción en los mensajes enviados. Al borrar los datos del sitio o cambiar de navegador, vuelve a quedar vacía.

La sustitución del avatar del asistente sigue el mismo patrón local del navegador: las sustituciones cargadas se superponen localmente a la identidad resuelta por el Gateway y nunca realizan un recorrido de ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para los clientes ajenos a la interfaz de usuario que escriben directamente en él.

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene su configuración en tiempo de ejecución de `/control-ui-config.json`, resuelto en relación con la ruta base de la interfaz de control del Gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Este endpoint está protegido por la misma autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una solicitud correcta requiere un token o una contraseña válidos del Gateway, una identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abra **Settings → General** para ver la tarjeta **Gateway Host**, que muestra la máquina del Gateway, la dirección LAN, el sistema operativo, el entorno de ejecución, el tiempo de actividad, la carga de CPU, la memoria y el espacio en disco del volumen de estado. Mientras está visible, la tarjeta se actualiza cada 10 segundos mediante el RPC `system.info` del Gateway, que requiere el ámbito `operator.read`. Los Gateways antiguos y las conexiones que no tienen ese ámbito omiten la tarjeta.

## Compatibilidad con idiomas

La interfaz de control se localiza en la primera carga según la configuración regional del navegador. Para cambiarla más adelante, abra **Settings -> General -> Language** (el selector se encuentra en la página General, no en Appearance).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones distintas del inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción ausentes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales distintas del inglés, pero el selector de idiomas integrado del sitio de documentación de Mintlify solo muestra los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Appearance incluye los temas Claw, Knot y Dash (Claw es el predeterminado), además de un espacio de importación de tweakcn local del navegador. Para importar un tema, abra el [editor de tweakcn](https://tweakcn.com/editor/theme), elija o cree un tema, haga clic en **Share** y pegue el enlace copiado en Appearance. El importador también admite URL del registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de temas sin procesar y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan únicamente en el perfil de navegador actual; no se escriben en la configuración del Gateway ni se sincronizan entre dispositivos. Al reemplazar el tema importado, se actualiza el único espacio local; al borrarlo, se vuelve a Claw si el tema importado estaba activo.

Appearance también incluye la opción Text size. Se aplica al texto del chat, el texto del redactor, las tarjetas de herramientas y las barras laterales del chat, y mantiene los campos de texto en al menos 16px para que Safari móvil no aplique zoom automáticamente al enfocarlos.

El tema, el modo del tema, el tamaño del texto, el idioma y las preferencias de visualización del chat se sincronizan mediante la configuración del Gateway (`ui.prefs`), por lo que se mantienen entre dispositivos y los agentes pueden cambiarlos mediante la puerta de aprobación; los clientes conectados aplican los cambios en vivo mediante el aviso `config.changed` del Gateway. Cada navegador conserva una copia local para el arranque instantáneo; los clientes que no pueden escribir en la configuración (ámbito de visualizador, sin conexión) mantienen los cambios únicamente en el dispositivo. Consulte la [Referencia de configuración](/es/gateway/configuration-reference#ui).

## Mantenimiento del sistema OpenClaw

Abra **Settings → Ask OpenClaw** para hablar con el agente de configuración y reparación del sistema. Fuera de la incorporación, esta página puede mostrar como máximo una insignia de evento descartable por visita. Permanece en silencio durante el tráfico habitual del Gateway y solo reacciona a las instantáneas de estado que informan de un recargador de configuración deshabilitado, la desconexión o degradación de un canal configurado, un sondeo de canal fallido o credenciales de canal no disponibles. Un evento más reciente solo reemplaza la insignia pendiente cuando es más grave; descartar o usar la insignia silencia los avisos de eventos durante esa visita. Al hacer clic en la insignia, su pregunta de diagnóstico se envía como un mensaje `openclaw.chat` real, por lo que la transcripción registra la solicitud y OpenClaw realiza el diagnóstico. La incorporación nunca muestra estas insignias de eventos.

## Gestionar plugins

Abra **Plugins** en la barra lateral o use `/settings/plugins` en relación con la
ruta base configurada de la interfaz de control para explorar y gestionar plugins sin salir de
la interfaz de control. Por ejemplo, una ruta base `/openclaw` usa
`/openclaw/settings/plugins`. La página está siempre disponible, incluso cuando todos los
plugins opcionales están deshabilitados.

Plugins es un centro con cuatro pestañas: **Installed** y **Discover** gestionan el código de los plugins
en `/settings/plugins`, **Skills** aloja el gestor de habilidades por agente en
`/skills` y **Workshop** aloja la revisión de propuestas de Skill Workshop en
`/skills/workshop`. Cada pestaña conserva su propia URL y la barra lateral muestra la
entrada única Plugins para todas ellas.

La pestaña **Instalados** muestra el inventario local completo agrupado por categoría, con
recuentos generales. Cada fila abre una vista detallada; su menú de opciones (`…`)
permite activar o desactivar el plugin y ofrece **Eliminar** para los plugins instalados externamente.
También enumera los [servidores MCP](/es/cli/mcp) configurados y permite añadirlos, desactivarlos
y eliminarlos directamente. Los mismos controles de servidor están disponibles en **Configuración → MCP**.
La pestaña **Descubrir** es la tienda: plugins destacados incluidos con OpenClaw,
plugins externos oficiales y conectores MCP con un solo clic para servicios populares.
Al escribir en el cuadro de búsqueda, se consulta
[ClawHub](https://clawhub.ai/plugins) directamente y se añade una sección **Desde ClawHub**
con recuentos de descargas e insignias de verificación del origen. Los enlaces profundos pueden
apuntar directamente a la tienda mediante `/settings/plugins?tab=discover`.

La pestaña **Skills** conserva el informe de estado de las Skills, los controles para activarlas o desactivarlas, la introducción de
claves de API y la búsqueda integrada de Skills en ClawHub, todo ello limitado al agente seleccionado. La
pestaña **Taller** conserva el tablero del Taller de Skills y el flujo de revisión de Hoy para
[propuestas de Skills](/es/tools/skill-workshop). **Buscar ideas para Skills** revisa una ventana acotada
de sesiones sustanciales desde la más reciente hasta la más antigua y deja los resultados como
propuestas pendientes. El panel muestra la cobertura acumulada; **Analizar trabajo anterior**
continúa desde el cursor persistente y después pasa a ser **Analizar trabajo nuevo** cuando se
agota el historial anterior. La revisión manual del historial funciona mientras el autoaprendizaje
autónomo está desactivado y utiliza el modelo configurado del agente seleccionado.

Los plugins incluidos ya están presentes en el Gateway y muestran **Activar** o
**Desactivar** en lugar de **Instalar**. Por ejemplo, Workboard está incluido con
OpenClaw, pero está desactivado de forma predeterminada, por lo que su acción es **Activar**. Los plugins
incluidos no se pueden eliminar, solo desactivar.

Para leer el catálogo y buscar en ClawHub se requiere `operator.read`. Para instalar,
activar, desactivar o eliminar un plugin y cambiar los servidores MCP se requiere
`operator.admin`; estas acciones permanecen desactivadas para los operadores de solo lectura.

Las instalaciones desde ClawHub se ejecutan mediante el Gateway y mantienen las mismas comprobaciones
de confianza, integridad y políticas de instalación de plugins que otras instalaciones gestionadas
por el Gateway. Instalar o eliminar código de plugins requiere reiniciar el Gateway. Activar o desactivar
un plugin instalado puede aplicarse sin reiniciar cuando el plugin y el entorno de ejecución actual
del Gateway lo permiten; de lo contrario, la interfaz indica que es necesario
reiniciar. Los conectores MCP respaldados por OAuth necesitan ejecutar una vez
`openclaw mcp login <name>` desde la CLI después de añadirlos.

La página se centra deliberadamente en el inventario, el descubrimiento, la instalación, la activación
y la eliminación. Utilice [`openclaw plugins`](/es/cli/plugins) para fuentes arbitrarias de npm, git o
rutas locales, actualizaciones y configuración avanzada de plugins.

## Aplicaciones y extensiones

Abra **Aplicaciones** desde el menú **Más** de la barra lateral, la paleta de comandos o el
menú del agente de la barra lateral (**Obtener las aplicaciones**), o utilice `/apps` en relación con la
ruta base configurada de la interfaz de control. La página reúne enlaces de instalación para todas las
superficies complementarias de OpenClaw: las aplicaciones para [iOS](/es/platforms/ios) y
[Android](/es/platforms/android), los complementos para Apple Watch y Wear OS
incluidos con ellas, las aplicaciones de escritorio para [macOS](/es/platforms/macos), [Windows](/es/platforms/windows)
y [Linux](/es/platforms/linux), la
[extensión de Chrome](/es/tools/chrome-extension), el centro de Plugins integrado en la aplicación con
[ClawHub](https://clawhub.ai), y la comunidad de Discord y la documentación.

## Navegación de la barra lateral

La barra lateral organiza todo en torno al agente. La fila de identidad de la parte superior corresponde al agente activo; debajo, la sección **Páginas** comienza con **Inicio** —la sesión principal continua del agente, con una insignia que muestra su estado no leído o en ejecución— seguida de los destinos fijados (**Uso**, **Automatizaciones** y **Plugins** de forma predeterminada). El control de personalización del encabezado de Páginas abre un menú con todos los demás destinos, incluidas las pestañas proporcionadas por plugins, además de **Editar elementos fijados**; al hacer clic con el botón derecho en el área de navegación, se abre directamente el editor de elementos fijados. La lista de sesiones inferior se divide en zonas: **Hilos** para las sesiones de chat del agente (la sesión principal permanece detrás de Inicio; las sesiones que genera aparecen aquí como hilos de nivel superior y los hilos con nombre se muestran sin prefijo de tipo), **Grupos** para conversaciones grupales y de salas, y **Programación** para las sesiones vinculadas a un árbol de trabajo administrado o a un nodo de ejecución (las filas muestran una línea `repo ⎇ branch` además del host del nodo), las sesiones de entornos de ejecución respaldadas por ACP y los catálogos de CLI de Codex/Claude. Programación aparece contraída en la primera ejecución y recuerda la elección; su encabezado contraído conserva el recuento real y muestra un indicador de ejecución mientras trabajan las sesiones contenidas. Los grupos personalizados (la sesión `category`) y las filas **Fijadas** aparecen encima de Hilos, y asignar una sesión a un grupo personalizado siempre prevalece sobre la clasificación automática por zonas. El encabezado de Hilos contiene el control de ordenación (Creación o Última actualización, Agrupar por y un filtro persistente de **Estado** con Activas, Archivadas o Todas) y el botón **+** que abre la página Nueva sesión. Las filas archivadas permanecen integradas, atenuadas y con un glifo de archivo; no contribuyen al estado no leído o de atención y quedan fuera de la promoción de linaje. Abrir una sesión mueve el resaltado de selección sin reordenar las filas. Las sesiones principales con ejecuciones secundarias recientes muestran un control de despliegue y el número de sesiones secundarias; expándalo para inspeccionar las sesiones secundarias anidadas, su estado activo o terminal y el entorno de ejecución sin salir de la barra lateral. Al seleccionar una sesión secundaria, se abre su chat y se revela automáticamente la ruta de sus antecesores. Las filas secundarias quedan fuera de la agrupación raíz, la fijación, el arrastre, la selección múltiple y la paginación; las zonas contraídas no consumen el límite de páginas visibles. Las sesiones con actividad nueva desde la última lectura muestran un punto de no leído, y abrir una las marca como leídas. Un agente también puede publicar una breve línea de estado con caducidad y solicitar opcionalmente atención mediante un icono ámbar seleccionado; esa declaración se borra al abrir la sesión, enviar el siguiente mensaje, borrarla explícitamente o cuando caduca su TTL. Los estados del ciclo de vida de los trabajadores en la nube utilizan una insignia de globo; las sesiones locales y recuperadas omiten la insignia de ubicación porque la ejecución local es la opción predeterminada. Cada fila de sesión raíz tiene un menú contextual (botón de tres puntos o clic derecho) con Fijar/Dejar de fijar, Marcar como no leída/leída, Cambiar nombre, Bifurcar, Mover al grupo (incluidos Nuevo grupo y Quitar del grupo), Archivar o Desarchivar y Eliminar; los diseños táctiles mantienen visibles los controles directos de fijación y del menú. Cmd/Ctrl-clic alterna las filas raíz dentro de una selección múltiple y Mayús-clic la amplía siguiendo el orden visible; al abrir el menú en una fila seleccionada, se ofrecen acciones por lotes (Marcar N como no leídas/leídas, Mover N al grupo, Archivar N, Eliminar N) que se aplican a todas las sesiones seleccionadas, con una sola confirmación para la eliminación por lotes. Arrastre una sesión raíz a **Fijadas** para fijarla o a un grupo personalizado para moverla. Los encabezados de grupos personalizados se pueden contraer, expandir o arrastrar para reordenarlos; los nombres de los grupos y su orden se almacenan en el gateway (`sessions.groups.*`), por lo que se conservan entre navegadores, mientras que el estado contraído permanece en el perfil del navegador. Los encabezados de grupo también tienen un menú (botón de tres puntos o clic derecho) con Cambiar nombre del grupo, Nuevo grupo y Eliminar grupo; cambiar el nombre o eliminar un grupo actualiza todas las sesiones que contiene en el servidor, incluidas las archivadas, y eliminar un grupo conserva sus sesiones y las devuelve a Hilos.

## Página Nueva sesión

El botón **+** del encabezado de la lista de sesiones de la barra lateral abre un borrador de página completa en `/new`: no se crea nada hasta que se envía el primer mensaje. Un selector unificado de **Lugar** elige la carpeta de trabajo y, para los operadores administradores, el destino de ejecución: **Gateway · local**, un nodo emparejado que exponga `system.run` o un perfil de nube disponible. La carpeta predeterminada es el espacio de trabajo del agente; otra ruta absoluta del Gateway requiere `operator.admin`, pero se puede ejecutar directamente sin ser un repositorio de Git. Cuando la carpeta seleccionada del Gateway es un repositorio de Git, el mismo selector ofrece aislamiento opcional mediante **Árbol de trabajo**, con un selector de rama base respaldado por `worktrees.branches` (sin recuperación) y un nombre opcional para el árbol de trabajo (la rama pasa a ser `openclaw/<name>`). Los trabajadores en la nube requieren esa ruta de árbol de trabajo administrado; los nodos emparejados nunca la muestran. El pie del redactor selecciona el modelo y el nivel de razonamiento de la nueva sesión, y los inicios en la nube conservan ambas opciones antes de enviar la sesión a su trabajador.

**Explorar carpetas** abre el explorador de directorios integrado del selector Lugar, respaldado por el método `fs.listDir` exclusivo para administradores y limitado al Gateway o nodo seleccionado. El Gateway y los nodos compatibles con la exploración enumeran su sistema de archivos; un nodo compatible con la ejecución que no disponga de `fs.listDir` sigue aceptando una ruta absoluta escrita. Los lugares recientes pueden restaurar conjuntamente una carpeta y su nodo propietario sin transferir rutas entre hosts. Al enviar, se llama a `sessions.create` con el primer mensaje, por lo que la ejecución comienza en el mismo intercambio y la interfaz salta al chat de la nueva sesión. Si el Gateway crea la sesión, pero rechaza ese primer envío, el chat conserva el mensaje y el error después de recargar; **Reintentar** lo envía mediante la sesión ya creada en lugar de crear otra.

Dentro de **Configuración**, la barra lateral específica incluye **Preguntar a OpenClaw** y comienza con un campo **Buscar configuración** para encontrar rápidamente las secciones de configuración.

Un campo **Buscar** en la parte superior de la barra lateral abre la paleta de comandos (⌘K). Al hacer clic en la fila de identidad del agente en la parte superior de la barra lateral, se abre el menú del agente; **Inicio** abre la sesión principal. Cuando algo requiere una acción —tareas cron fallidas o atrasadas, autenticación del modelo próxima a caducar o caducada— aparecen chips compactos de atención encima del pie de la barra lateral que enlazan con la página correspondiente. La fila de identidad muestra el avatar del agente (imagen de identidad o emoji), el nombre, el punto de conexión y un subtítulo en tiempo real. Al hacer clic, se abre el menú del agente: un selector de agentes (en configuraciones multiagente), «¿Qué puede hacer este agente?», **Configuración del agente**, **Configuración**, emparejamiento móvil, **Documentación**, el chip de compilación y el selector del modo de color. Las listas con más de diez agentes incorporan un campo de filtro y muestran primero los agentes fijados; los agentes se pueden fijar o dejar de fijar desde la página de configuración Agentes, y el conjunto fijado se almacena en el perfil del navegador. Al elegir un agente, Chat, Uso, Automatizaciones, Tareas, Workboard y Sesiones quedan limitados a ese agente. Cada página limitada incluye un control **Agente** con **Todos los agentes** como salida; esto amplía el ámbito de la página compartida sin cambiar el agente concreto del chat, mientras que los enlaces directos a sesiones siguen abriendo su destino. La página de configuración Agentes conserva su propia selección `?agent=` y no sigue el ámbito de página compartido. La barra del pie contiene el logotipo del producto, el chip de compilación, un punto de conexión al gateway y un acceso directo a Configuración. Cuando el gateway se ejecuta desde un repositorio de código fuente en una rama distinta de `main`, el pie también muestra el nombre de esa rama en rojo para que resulte evidente de un vistazo que el gateway no es una versión de lanzamiento (las instalaciones de lanzamiento nunca lo muestran). Mayús-Comando-Coma abre **Configuración** sin anular el atajo Comando-Coma del navegador. El encabezado de la barra lateral también contiene el control para contraerla (⌘B); al contraerla, la barra lateral queda totalmente oculta para disponer de un espacio de trabajo de ancho completo, y un control flotante para expandirla (o ⌘B) la recupera; en su lugar, la aplicación para macOS aloja ese control de forma nativa en la barra de título. La barra lateral es el único elemento de navegación en el escritorio, sin barra superior. En ventanas estrechas, la barra lateral se sustituye por un panel deslizable detrás de una fila de encabezado compacta que contiene el control del panel, la marca y la búsqueda de la paleta de comandos; en teléfonos, Chat integra esa fila de navegación en su barra de título, con los controles del menú y la búsqueda junto al título de la sesión. En la aplicación para macOS, la fila de encabezado independiente integra el espacio de la barra de título en una única franja compacta junto a los controles de la ventana. La navegación utiliza el historial normal del navegador, por lo que sus botones de retroceso y avance permiten recorrerla; la aplicación para macOS añade un control nativo de la barra lateral junto a los controles de la ventana y gestos de deslizamiento en el panel táctil, con botones de retroceso y avance en el borde derecho de la barra lateral mientras está expandida, y botones nativos de búsqueda (paleta de comandos) y nueva sesión mientras está contraída.

Las aprobaciones pendientes también contribuyen a una insignia de atención sobre el pie de la barra lateral;
selecciónela para abrir la página de Aprobaciones correspondiente.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatee con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`). Las sesiones archivadas mantienen deshabilitado el cuadro de redacción y muestran un banner con una acción **Desarchivar** antes de que pueda continuar la conversación.
    - Las actualizaciones del historial de chat solicitan una ventana reciente limitada con topes de texto por mensaje, de modo que las sesiones grandes no obliguen al navegador a renderizar la carga útil de una transcripción completa antes de que el chat pueda utilizarse.
    - Al pasar el cursor o enfocar con el teclado un enlace público a una incidencia o un pull request de GitHub, se muestran su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché los metadatos públicos sin cambiar el destino del enlace, incluso cuando la interfaz de usuario utiliza un Gateway remoto. El Gateway utiliza `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, después de confirmar que el repositorio es público; de lo contrario, utiliza la API anónima de GitHub con una caché más prolongada.
    - Converse mediante sesiones en tiempo real del navegador. OpenAI utiliza WebRTC directo, Google Live utiliza un token restringido de un solo uso para el navegador mediante WebSocket y los plugins de voz en tiempo real exclusivos del backend utilizan el transporte de retransmisión del Gateway. Las sesiones del navegador con capacidad de vídeo pueden elegir una cámara local del dispositivo en Configuración o cambiar de cámara desde la vista previa en directo; el navegador captura fotogramas JPEG para el proveedor en tiempo real sin transmitir el vídeo de la cámara a través del Gateway. Las sesiones del proveedor gestionadas por el cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión conserva las credenciales del proveedor en el Gateway mientras el navegador transmite el PCM del micrófono mediante `talk.session.appendAudio`, reenvía las llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para aplicar la política del Gateway y usar el modelo de OpenClaw configurado de mayor tamaño, y dirige el control por voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmita las llamadas a herramientas y las tarjetas de salida de herramientas en directo en el Chat (eventos del agente). La actividad de las herramientas se muestra como filas adaptadas al tipo: los comandos del shell muestran el comando con resaltado de sintaxis y una salida de estilo terminal; las llamadas de edición y escritura compatibles muestran diferencias en línea limitadas, números de línea cuando están disponibles y estadísticas de `+added -removed`; y las llamadas consecutivas se contraen en un resumen como «Se ejecutaron 13 comandos, se leyeron 6 archivos y se editaron 9 archivos». Mientras una ejecución está activa, la llamada en curso más reciente da nombre al encabezado del grupo. Expanda una fila para examinar sus argumentos restantes y la salida sin procesar.
    - Títulos opcionales de finalidad generados por IA para llamadas a herramientas complejas (comandos de shell largos y herramientas de plugins con muchos argumentos), habilitados con `gateway.controlUi.toolTitles: true` (desactivados de forma predeterminada). Los títulos proceden del método por lotes `chat.toolTitles` mediante el enrutamiento estándar del modelo auxiliar: un `utilityModel` explícito (proveedor elegido por el operador, como en otras tareas auxiliares) o, en su defecto, el modelo pequeño predeterminado declarado por el proveedor de la sesión, y se almacenan en caché en el Gateway por agente. Cuando la opción voluntaria está desactivada o no se puede utilizar ningún modelo económico, las filas conservan sus etiquetas deterministas y no se realiza ninguna llamada al modelo.
    - Inicie o descarte tareas de seguimiento efímeras sugeridas por el modelo; las sugerencias aceptadas abren una nueva sesión de árbol de trabajo gestionado con el prompt propuesto.
    - Pestaña Actividad con resúmenes locales del navegador y centrados primero en la ocultación de datos de la actividad de herramientas en directo procedente de la entrega existente de `session.tool` o de eventos de herramientas.

  </Accordion>
  <Accordion title="Canales, sesiones y memoria">
    - Canales: estado de los canales integrados y de plugins incluidos o externos, inicio de sesión mediante QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la captura anterior mientras terminan las comprobaciones lentas del proveedor, y etiquetan las capturas parciales cuando un sondeo o una auditoría supera el tiempo asignado por la interfaz de usuario.
    - Hilos (una página del espacio de trabajo en `/sessions`, con una pestaña **Árboles de trabajo** a su lado): enumera de forma predeterminada las sesiones de los agentes configurados, permite fijar las sesiones frecuentes, cambiarles el nombre, archivar o restaurar sesiones inactivas, recuperarse de claves obsoletas de sesiones de agentes no configurados y aplicar anulaciones por sesión de modelo, pensamiento, modo rápido, nivel de detalle, seguimiento y razonamiento (`sessions.list`, `sessions.patch`). Un filtro de tres opciones, **Activas / Archivadas / Todas**, controla tanto esta página como la barra lateral; Todas atenúa las filas archivadas y las etiqueta explícitamente. Las sesiones archivadas conservan sus transcripciones, nunca se eliminan automáticamente y permanecen guardadas hasta que se desarchivan o eliminan de forma explícita. Las filas muestran un punto de no leído en las sesiones activas con actividad desde la última lectura, con acciones para marcar como no leídas o leídas (`sessions.patch { unread }`), y una acción Bifurcar que ramifica la transcripción en una nueva sesión (`sessions.create { parentSessionKey, fork: true }`). Los mosaicos de resumen situados sobre la tabla resumen el conjunto cargado (cantidad de sesiones, ejecuciones activas, sesiones no leídas, total de tokens y cantidad archivada cuando está disponible); cada fila incluye un glifo del tipo con un punto de ejecución activa, el estado se muestra como un punto sencillo acompañado de una etiqueta y la columna Tokens muestra un medidor de uso de la ventana de contexto cuando la sesión informa de los tamaños de tokens y contexto. Las acciones de gestión de las filas se encuentran en un menú por fila (botón de tres puntos verticales o clic derecho) que reproduce el menú de sesiones de la barra lateral, y el panel de la fila incluye el entorno de ejecución del agente y la duración de la ejecución junto con los demás detalles de la sesión.
    - Los catálogos nativos de Claude y Codex de la barra lateral transmiten un host a la vez y después se reconcilian tras los cambios de conectividad del Node, cuando la página recibe el foco y como máximo cada 30 segundos mientras está visible. Los cambios del catálogo activan una pasada de seguimiento más rápida, por lo que las sesiones creadas en las herramientas nativas aparecen sin volver a cargar la interfaz de control. Las filas de Claude Desktop también conservan la etiqueta de su grupo personalizado local cuando está presente; OpenClaw lee esa asignación del almacén local de Desktop y nunca escribe en él.
    - Agrupación de sesiones: un control Agrupar por organiza la tabla de sesiones en secciones por grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados persisten por sesión mediante `sessions.patch` (`category`), por lo que también se pueden categorizar las sesiones iniciadas desde canales de mensajes (Discord, Telegram, WhatsApp, ...); asigne grupos arrastrando filas hasta una sección o mediante el selector de grupo de cada fila, y cree grupos con la acción Nuevo grupo.
    - Memoria (una pestaña de la página Agentes, limitada al agente seleccionado): estado de Dreaming, control para habilitar o deshabilitar y lector del Diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Importar memoria (`/memory-import`, accesible desde la pestaña Memoria de la página Agentes): obtenga una vista previa y copie la memoria automática local de Claude Code, la memoria consolidada de Codex o los archivos de memoria de Hermes en el espacio de trabajo del agente seleccionado (`migrations.memory.plan`, `migrations.memory.apply`).
    - Oferta de memoria durante la incorporación: cuando la interfaz de control se abre en modo de incorporación (`?onboarding=1`, utilizado por la aplicación complementaria para Linux después de su instalación inicial), un diálogo de una página ofrece importar las memorias detectadas con el mismo flujo de planificación y aplicación; si se omite, la página de configuración queda como punto de entrada posterior.

  </Accordion>
  <Accordion title="Cron, tareas, plugins, Skills, dispositivos y aprobaciones de ejecución">
    - Automatizaciones (trabajos de Cron): tarjetas de estadísticas (cantidad de automatizaciones, cantidad con errores, estado del programador y próxima activación) sobre un selector de pestañas Automatizaciones/Historial de ejecuciones; la pestaña Automatizaciones enumera los trabajos en una tabla filtrable (Todos/Activos/En pausa, búsqueda, filtros de programación y última ejecución, menú de acciones por fila) con sugerencias iniciales debajo, y la pestaña Historial de ejecuciones muestra las ejecuciones recientes de todas las automatizaciones (`cron.*`).
    - Tareas: registro en directo de tareas en segundo plano activas y recientes, con sesiones vinculadas y cancelación (`tasks.*`). El panel Tareas en segundo plano del Chat agrupa el trabajo en curso y finalizado; seleccione una fila para examinar su prompt limitado y el resumen de la salida o del error.
    - Plugins: explore el inventario instalado y la tienda seleccionada, busque en ClawHub, instale y elimine código de plugins, y habilite o deshabilite los plugins instalados (`plugins.*`); las filas de servidores MCP editan `mcp.servers` mediante los métodos de configuración.
    - Skills: estado, habilitación o deshabilitación, instalación y actualización de claves de API (`skills.*`).
    - Dispositivos: un único inventario combina los registros de dispositivos emparejados, el catálogo de Node y la presencia en directo (`device.pair.list`, `node.list`, `system-presence`). El host del Gateway permanece fijado en primer lugar; los clientes emparejados muestran el estado de conexión, los roles, los tokens, las capacidades y los comandos. Los emparejamientos duplicados se contraen en un grupo expandible y **Limpiar N obsoletos** elimina en bloque los duplicados sin conexión confirmados por un administrador que se aprobaron automáticamente (locales silenciosos, de CIDR de confianza o verificados mediante SSH) o que son anteriores a la procedencia de la aprobación. Las entradas pueden eliminarse (`node.pair.remove`, `device.pair.remove`), el emparejamiento de dispositivos y las nuevas aprobaciones de Node se gestionan en línea (`device.pair.*`, `node.pair.approve`/`reject`), y los códigos de configuración para dispositivos móviles se crean desde la misma tarjeta.
    - Aprobaciones de ejecución: edite las listas de permitidos del Gateway o del Node y la política de consulta para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - La navegación de configuración comienza con Preguntar a OpenClaw y después agrupa las páginas según su prioridad: General, Apariencia y Notificaciones en la parte superior; Conexiones (Conexión, Canales, Comunicaciones, Dispositivos); Agentes y herramientas (Agentes, IA y agentes, Proveedores de modelos, MCP, Automatización, Laboratorios); Privacidad y seguridad (Seguridad, Aprobaciones); y Sistema (Infraestructura, Avanzado, Depuración, Registros, Acerca de). General es un centro conciso con los valores predeterminados de los modelos, el idioma y las estadísticas del host del Gateway; cada uno de los demás ajustes se encuentra en una sola página.
    - Privacidad y seguridad: filas seleccionadas para la autenticación del Gateway, la política de ejecución, la habilitación del navegador, el perfil de herramientas, la autenticación de dispositivos y el emparejamiento móvil, encima de las secciones `security`/`approvals` respaldadas por el esquema.
    - Aprobaciones incluye un historial de 30 días, ordenado del más reciente al más antiguo, de las solicitudes resueltas de ejecución, plugins y agentes del sistema. Filtre por tipo o recorra páginas con filas anteriores para revisar la decisión, el motivo, la sesión de origen y la atribución del responsable de la resolución registradas por el Gateway.
    - Laboratorios expone los controles experimentales publicados. Modo de código y Enjambre son las opciones actuales y guardan `tools.codeMode.enabled` y `tools.swarm.enabled` inmediatamente; los experimentos no publicados no aparecen ni escriben claves de configuración especulativas.
    - Notificaciones: estado de las notificaciones web push del navegador, suscripción/cancelación de la suscripción y envío de una prueba.
    - Avanzado: todas las secciones de configuración sin una ubicación específica, además del editor JSON5 sin procesar (anteriormente, el modo Avanzado de la página General).
    - Configuración del modelo (`/settings/model-setup`) es una subpágina de Proveedores de modelos, a la que se accede desde su encabezado.
    - Agentes: una página de configuración (**Configuración → Agentes**, `/settings/agents`) con pestañas por agente (Vista general, Archivos, Herramientas, Skills, Canales, Automatizaciones, Memoria). La pestaña Vista general permite editar la identidad del agente: nombre para mostrar, emoji y una imagen de avatar que se reduce y limita por tamaño en el navegador antes de `agents.update`. Al guardar, se almacenan los campos de identidad configurados y se replican en `IDENTITY.md` del espacio de trabajo; los valores configurados tienen prioridad sobre las ediciones manuales de los mismos campos del archivo.
    - Perfil: una página de configuración que muestra la identidad del agente predeterminado con estadísticas de uso acumuladas: tokens totales, día de mayor actividad, sesión más larga, rachas de actividad, un mapa de calor de tokens de un año, herramientas principales y aspectos destacados de los canales (`usage.cost`, `sessions.usage`).
    - MCP tiene una página de configuración dedicada con filas de servidores (transporte, habilitación y resúmenes de OAuth/filtros/paralelismo), controles directos para añadir/habilitar/deshabilitar/eliminar, comandos habituales para operadores y el editor de configuración `mcp` con ámbito específico. La página Plugins sigue siendo la ubicación de los conectores con un clic y la detección.
    - Proveedores de modelos: una página de configuración que enumera todos los proveedores de modelos configurados con su icono de marca, estado de autenticación (`models.authStatus`), disponibilidad de modelos (`models.list`), datos en tiempo real del plan, la cuota y la facturación cuando el proveedor los comunica (`usage.status`), y el gasto de las sesiones locales durante los últimos 30 días (`sessions.usage`). La acción Actualizar vuelve a consultar el estado de las credenciales y el uso del proveedor.
    - Conexión: una página de configuración (en **Conexiones**) que gestiona el enlace del propio panel con el Gateway —URL de WebSocket, token del Gateway, contraseña y clave de sesión predeterminada—, además de la instantánea del protocolo de enlace más reciente (estado, tiempo de actividad, intervalo de pulsos y última actualización de los canales). La pantalla de inicio de sesión sin conexión gestiona el caso de desconexión; esta página permite editar la conexión mientras está conectado.
    - Aplicar y reiniciar con validación (`config.apply`) y, a continuación, reactivar la última sesión activa.
    - Las escrituras incluyen una protección mediante hash base para evitar sobrescribir ediciones simultáneas.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución de SecretRef activas para las referencias de la carga de configuración enviada; las referencias activas enviadas que no se puedan resolver se rechazan antes de escribir.
    - Al guardar formularios, se descartan los marcadores de posición censurados obsoletos que no puedan restaurarse desde la configuración guardada, mientras se conservan los valores censurados que todavía correspondan a secretos guardados.
    - El esquema y la representación del formulario proceden de `config.schema` / `config.schema.lookup`, incluidos `title`/`description` de los campos, las sugerencias de interfaz coincidentes, los resúmenes inmediatos de elementos secundarios, los metadatos de documentación en nodos anidados de objeto/comodín/matriz/composición, además de los esquemas de plugins y canales cuando están disponibles. El editor JSON sin procesar solo está disponible cuando la instantánea admite una conversión de ida y vuelta segura de los datos sin procesar; de lo contrario, la interfaz de control fuerza el modo Formulario.
    - La opción "Restablecer a lo guardado" del editor JSON sin procesar conserva la estructura creada en el editor sin procesar (formato, comentarios y disposición de `$include`) en lugar de volver a representar una instantánea aplanada, por lo que las ediciones externas sobreviven al restablecimiento cuando la instantánea admite una conversión de ida y vuelta segura.
    - Los valores de objeto SecretRef estructurados se muestran como de solo lectura en las entradas de texto del formulario para evitar que un objeto se convierta accidentalmente en una cadena y se dañe.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens y costes estimados derivado de las sesiones se mantiene separado de la facturación de los proveedores.
    - Las tarjetas de proveedores llaman a `usage.status` y muestran los nombres de los planes, los periodos de cuota, los saldos, el gasto y los presupuestos en tiempo real comunicados por los plugins de proveedores configurados.
    - Un fallo en el uso de un proveedor no bloquea el panel de sesiones/costes; las tarjetas de proveedores no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros y actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye los tiempos de actualización/RPC de la interfaz de control, los tiempos de representación lentos del chat y la configuración, y entradas de capacidad de respuesta del navegador para fotogramas de animación o tareas prolongados cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en tiempo real de los registros de archivo del Gateway con filtrado/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización del paquete/repositorio Git y reiniciar (`update.run`) con un informe del reinicio; después, consultar periódicamente `update.status` tras volver a conectarse para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de automatizaciones">
    - Al seleccionar una fila, se abre una vista de detalles a página completa con un interruptor Activa/En pausa y Ejecutar ahora en el encabezado (ejecutar si corresponde, clonar y eliminar en su menú); la pestaña Configuración permite editar la automatización en línea (instrucción, detalles, frecuencia y reemplazos avanzados), y la pestaña Historial de ejecuciones muestra las ejecuciones de esa automatización.
    - Las automatizaciones iniciales situadas bajo la tabla rellenan previamente el formulario de creación con una instrucción y una programación editables.
    - Para las tareas aisladas, la entrega predeterminada es anunciar el resumen; cambie a ninguna para las ejecuciones exclusivamente internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de Webhook HTTP(S) válida.
    - Para las tareas de la sesión principal, están disponibles los modos de entrega Webhook y ninguna.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar el reemplazo del agente, opciones de Cron exacto/escalonado, reemplazos del modelo/razonamiento del agente y controles de entrega con el mejor esfuerzo.
    - La validación del formulario aparece en línea con errores por campo; los valores no válidos deshabilitan el botón de guardar hasta que se corrijan.
    - Establezca `cron.webhookToken` para enviar un token bearer específico; si se omite, el Webhook se envía sin un encabezado de autenticación.
    - `cron.webhook` es un mecanismo alternativo heredado y retirado que la validación de configuración actual rechaza. Ejecute `openclaw doctor --fix` para migrar los trabajos almacenados que aún usan `notify: true` a una entrega explícita por Webhook o al completarse para cada trabajo y eliminar la clave anterior.

  </Accordion>
</AccordionGroup>

## Importar la memoria del asistente

Abra **Configuración** → **Importar memoria** para incorporar la memoria local de Codex o Claude Code
a un agente de OpenClaw. El Gateway detecta por sí mismo la memoria local compatible en su propio
host, por lo que una interfaz de control remota importa desde el equipo del Gateway y no desde el
equipo del navegador.

1. Elija el agente de destino.
2. Revise las colecciones de origen detectadas y los nombres de archivo Markdown. El contenido de los archivos
   no se envía en la respuesta del plan ni se muestra en la página.
3. Seleccione las colecciones que se importarán y confirme. Al aplicar, se reconstruye el plan antes
   de escribir para que las selecciones obsoletas fallen de forma segura.
4. Si los archivos ya existen, habilite **Reemplazar importaciones existentes**, actualice la
   vista previa y confirme el reemplazo.

Codex solo importa sus archivos consolidados `MEMORY.md` y `memory_summary.md`. Claude
Code importa Markdown desde los directorios de memoria automática de los proyectos y un
`autoMemoryDirectory` configurado; no importa sesiones, ajustes, instrucciones ni
credenciales mediante esta página. Los archivos se copian debajo de `memory/imports/` en el
espacio de trabajo seleccionado, donde el plugin de memoria activo puede indexarlos. Las fuentes
nunca se modifican.

La planificación y la aplicación requieren `operator.admin`. Cada aplicación crea una copia de seguridad
verificada de OpenClaw cuando existe un estado, escribe un informe de migración censurado y conserva
copias de seguridad por elemento antes de reemplazar los archivos de destino existentes. Consulte
[Descripción general de la memoria](/es/concepts/memory#import-from-coding-assistants) para conocer las rutas y el
comportamiento de recuperación.

## Página de MCP

La página dedicada de MCP es una vista para operadores de los servidores MCP administrados por OpenClaw en `mcp.servers`. No inicia los transportes MCP por sí sola; utilícela para inspeccionar y editar la configuración guardada y después use `openclaw mcp doctor --probe` cuando necesite una comprobación del servidor en tiempo real.

Flujo de trabajo habitual:

1. Abra **MCP** desde la barra lateral.
2. Compruebe las tarjetas de resumen para conocer el número total de servidores, los habilitados, los que usan OAuth y los filtrados.
3. Revise cada fila de servidor para consultar el transporte, la habilitación, la autenticación, los filtros, los tiempos de espera y las sugerencias de comandos.
4. Añada, habilite, deshabilite o elimine servidores directamente en la página MCP. Elija explícitamente HTTP transmitible, SSE o stdio; las líneas de comandos de stdio aceptan argumentos entre comillas, como rutas con espacios. Use la página **Plugins** para los conectores con un clic y la detección.
5. Edite la sección de configuración `mcp` con ámbito específico para los campos avanzados del servidor, como variables de entorno, directorios de trabajo, encabezados, rutas TLS/mTLS, metadatos de OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Use **Guardar** para escribir la configuración o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde un terminal para realizar diagnósticos estáticos, comprobaciones en tiempo real o descartar el entorno de ejecución almacenado en caché.

La página censura los valores similares a URL que contienen credenciales antes de representarlos y pone entre comillas los nombres de los servidores en los fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres del shell. Referencia completa de la CLI y la configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad se encuentra en **Configuración › Sistema**, junto a Registros y Depuración. Es un observador efímero y local del navegador para la actividad de herramientas en tiempo real, derivado del mismo flujo de eventos de `session.tool` / herramientas del Gateway que alimenta las tarjetas de herramientas del Chat. No añade otra familia de eventos del Gateway, endpoint, almacén duradero de actividad, fuente de métricas ni flujo externo para observadores.

Las entradas de Actividad solo conservan resúmenes saneados y vistas previas censuradas y truncadas de la salida. Los valores de los argumentos de las herramientas no se almacenan en el estado de Actividad; la interfaz indica que los argumentos están ocultos y registra únicamente el número de campos de argumentos. La lista en memoria sigue la pestaña actual del navegador, se conserva al navegar por la interfaz de control y se restablece al recargar la página, cambiar de sesión o seleccionar **Borrar**.

## Terminal del operador

El terminal acoplable del operador está deshabilitado de forma predeterminada. Para habilitarlo, establezca `gateway.terminal.enabled: true` y reinicie el Gateway. El terminal requiere una conexión `operator.admin` y abre una PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
El terminal es un shell del host sin confinamiento y hereda el entorno del proceso del Gateway. Habilítelo únicamente en implementaciones con operadores de confianza. OpenClaw rechaza las sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Use **Ctrl + acento grave** para alternar el panel acoplable. El diseño permite acoplarlo en la parte inferior y derecha, cambia de tamaño con el área visible del navegador y mantiene varias pestañas de shell. Consulte la [configuración del Gateway](/es/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Los agentes autorizados por el propietario y sin aislamiento pueden usar la herramienta `terminal` para trabajos prolongados o interactivos que el operador deba supervisar. Cada llamada a la herramienta puede abrir, leer, escribir, cambiar el tamaño, cerrar o enumerar las PTY del Gateway propias del agente. De forma predeterminada, las sesiones nuevas abren una pestaña de la interfaz de control conectada simultáneamente, por lo que el agente y el operador comparten la salida y ambos pueden escribir o cambiar el tamaño. El acceso del agente se limita exactamente a la sesión: un agente no puede leer ni controlar terminales creados por el operador ni terminales abiertos por otra sesión de agente.

Arrastre uno o más archivos al terminal activo o use el botón del clip para elegir archivos. OpenClaw prepara cada archivo en la máquina propietaria de la PTY y pega en el cursor las rutas absolutas entrecomilladas para el shell; nunca pulsa Intro ni ejecuta la entrada. Un indicador compacto de lote muestra el archivo actual y el número de archivos completados. Cancelar detiene el resto del lote sin pegar rutas; una transferencia fallida permanece visible para poder reintentar desde ese archivo sin volver a cargar los archivos completados. Se aceptan imágenes, PDF, archivos comprimidos y otros tipos de archivo de hasta 16 MiB por archivo. Los archivos preparados utilizan un directorio temporal privado del sistema en hosts POSIX (modo de directorio `0700`, modo de archivo `0600`) o un directorio dentro del límite de ACL del perfil de usuario en Windows, además de un temporizador de limpieza de 24 horas, por lo que debe mover o copiar todo lo que necesite conservar.

La inserción de rutas admite PowerShell, `cmd.exe` y shells POSIX reconocidos (`sh`, Bash, Dash, Ash, Ksh, Zsh y Fish), incluido Git Bash en Windows. Se rechazan otras anulaciones de shell porque no es posible deducir con seguridad sus reglas de entrecomillado; ejecute el Gateway dentro de WSL para obtener un terminal WSL nativo y rutas de carga de Linux. También se rechazan las rutas `cmd.exe` que contienen `%` o `!`, porque ese shell expande esos caracteres incluso dentro de comillas dobles.

Las sesiones de Codex y Claude Code detectadas en la barra lateral de sesiones pueden abrirse en su CLI nativa dentro del mismo panel de terminal. En **Settings › Chat**, establezca **Open Codex/Claude threads in** en **Terminal** para que al hacer clic normalmente en una fila se abra `codex resume` o `claude --resume`; el visor de solo lectura de OpenClaw sigue siendo la opción predeterminada. El menú contextual o de tres puntos de una fila siempre ofrece ambas opciones, y el encabezado del visor incluye **Open in terminal** cuando la sesión cumple los requisitos.

La elegibilidad se determina por sesión y por host. Las sesiones locales del Gateway inician el comando de reanudación propiedad del proveedor en el host del Gateway. Las sesiones de nodos emparejados inician un comando del proveedor incluido en la lista de permitidos en el nodo propietario y solo retransmiten la salida, la entrada y los eventos de cambio de tamaño de esa PTY; esto no expone un shell general del nodo ni acepta comandos proporcionados por el navegador. Las cargas de archivos utilizan el comando de nodo independiente `terminal.upload`, con tamaño limitado, y permanecen vinculadas a la sesión de terminal ya abierta. Apruebe la actualización del emparejamiento del nodo cuando ese comando aparezca por primera vez. Los nodos que no anuncian el comando de reanudación de terminal correspondiente, incluidos los puentes de trabajadores integrados sin transmisión dúplex, mantienen disponible el visor y muestran la apertura del terminal como no disponible; los nodos antiguos todavía pueden ejecutar un terminal, pero no pueden recibir archivos arrastrados.

Las sesiones propiedad de la conexión sobreviven a las desconexiones: al recargar una página, suspender el portátil o sufrir una interrupción de red, la sesión se desconecta del Gateway en lugar de finalizar, y la misma pestaña del navegador vuelve a conectarse al restablecerse la conexión y reproduce la salida reciente. Las sesiones desconectadas propiedad de la conexión finalizan después de `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300 segundos; `0` restaura la finalización al desconectarse). Conectarse a una de estas sesiones sigue comportándose como una toma de control al estilo de tmux.

Las sesiones propiedad del agente no están vinculadas a una conexión del navegador. `terminal.attach` añade cada navegador como visor sin transferirle la propiedad, y cerrar una pestaña del visor desconecta únicamente ese navegador. La PTY permanece hasta que el agente propietario la cierra, su proceso termina, la política la deshabilita o el Gateway se apaga. `terminal.list` marca cada entrada como propiedad de la conexión o del agente, y `terminal.text` permite que una conexión de administrador lea la salida reciente en texto sin formato sin conectarse.

El terminal también está disponible como documento de pantalla completa dedicado exclusivamente al terminal en `/?view=terminal`. Las aplicaciones para iOS y Android integran esta página en sus pantallas de terminal y reutilizan las credenciales almacenadas del Gateway; la disponibilidad se rige por las mismas condiciones `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece el terminal.

## Panel del navegador

La interfaz de control incluye un panel acoplable del navegador que representa el navegador controlado por el Gateway (el mismo que manejan los agentes mediante la [herramienta de navegador](/es/tools/browser-control)) en cualquier navegador web convencional, sin necesidad de una vista web nativa. Aparece cuando el Gateway conectado anuncia `browser.request` a una conexión `operator.admin`; el botón del globo en la barra lateral del espacio de trabajo del hilo lo alterna. El panel muestra una instantánea en tiempo real de la página con pestañas, una barra de URL editable, controles para retroceder, avanzar y recargar, y una opción para abrirla en el navegador; se acopla a la derecha o en la parte inferior y reenvía los clics, el desplazamiento con la rueda y la escritura básica a la página remota.

Dos modos de captura recopilan el contexto de la página para el agente:

- **Anotar (lápiz)**: dibuje marcas a mano alzada sobre la página. **Enviar al chat** combina los trazos con la captura de pantalla, adjunta la imagen al editor del chat activo y completa previamente una instrucción que describe la URL y el título de la página, así como cada región marcada, para que el agente sepa exactamente qué se ha rodeado.
- **Inspeccionar (puntero)**: pase el cursor para ver el elemento situado debajo (selector, nombre accesible, rol y tamaño); haga clic para enviar los detalles de ese elemento junto con una captura de pantalla resaltada mediante el mismo flujo del editor. La inspección, el desplazamiento con la rueda y los controles para retroceder y avanzar requieren `browser.evaluateEnabled` (activado de forma predeterminada).

La aplicación para macOS mantiene su barra lateral nativa de navegación de enlaces para los enlaces pulsados en el panel de control; el panel del navegador también funciona allí y es el medio para anotar páginas en todas las demás plataformas.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de confianza de la interfaz de control también pueden recibir metadatos opcionales sobre los tiempos de confirmación para diagnósticos locales.
    - Las cargas del chat admiten imágenes y archivos que no sean vídeos. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como contenido multimedia gestionado y se muestran en el historial como enlaces de archivos adjuntos.
    - Volver a enviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` tras finalizar.
    - Las respuestas de `chat.history` tienen un límite de tamaño para proteger la interfaz de usuario. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y sustituir los mensajes demasiado grandes por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se ha truncado en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de la transcripción normalizada para su visualización mediante `chat.message.get`, usando `sessionKey`, el `agentId` activo cuando sea necesario y el `messageId` de la transcripción. Si el Gateway sigue sin poder devolver más contenido, el lector muestra un estado explícito de indisponibilidad en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas o procedentes del asistente se conservan como referencias de contenido multimedia gestionado y se sirven de nuevo mediante URL de contenido multimedia autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imágenes base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al renderizar `chat.history`, la interfaz de control elimina del texto visible del asistente las etiquetas de directivas insertadas que solo afectan a la visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y los bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en formato ASCII o de ancho completo. Omite las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista del chat mantiene visibles los mensajes locales optimistas del usuario y del asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica sustituye esos mensajes locales una vez que el historial del Gateway se pone al día.
    - Los eventos `chat` en directo representan el estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción persistente de la sesión. Tras los eventos finales de herramientas, la interfaz de control vuelve a cargar el historial y combina únicamente una pequeña cola optimista; el límite de la transcripción se documenta en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones exclusivas de la interfaz de usuario (sin ejecución del agente ni entrega al canal).
    - La barra lateral enumera todas las sesiones activas cargadas por sección de agente y en los grupos de fijadas, canal, trabajo, personalizados y Chats, con una única acción Nueva sesión que abre el cuadro de diálogo de borrador. Abrir una fila visible solo desplaza el resaltado. Las sesiones pueden soltarse en Fijadas para fijarlas o en un grupo personalizado o en Chats para moverlas; los grupos personalizados se pueden contraer y reordenar mediante arrastre, los nombres y el orden de los grupos se sincronizan mediante el Gateway y el estado contraído permanece en el navegador. Una nueva sesión del panel obtiene de forma asíncrona un título conciso generado a partir de su primer mensaje que no sea un comando; los nombres explícitos y la identidad autenticada del remitente permanecen separados, por lo que los nombres de las cuentas nunca se utilizan como títulos generados. Configure `agents.defaults.utilityModel` (o `agents.entries.*.utilityModel`) para dirigir esta llamada independiente a un modelo de menor coste; si ese modelo distinto falla, la generación del título vuelve a intentarse una vez con el modelo principal. Expandir la sección de otro agente permite explorar las sesiones de ese agente sin salir del chat abierto.
    - La búsqueda de hilos se encuentra en la paleta de comandos (⌘K o el campo Buscar de la parte superior de la barra lateral): al escribir una consulta, se recorren hasta un número limitado de páginas coincidentes entre los agentes, se filtran las filas internas secundarias o de Cron y se enumeran las coincidencias visibles junto a los comandos de navegación. La página Hilos conserva la lista exhaustiva con búsqueda y filtros.
    - Cada fila de la barra lateral mantiene acceso directo a la función de fijado, además de un menú contextual completo para el estado de lectura, el cambio de nombre, la bifurcación, la agrupación, el archivado y la eliminación. Las filas seleccionadas conjuntamente (Cmd/Ctrl-clic y Mayús-clic para seleccionar intervalos) disponen de un menú de acciones por lotes que incluye el estado de lectura, la agrupación, el archivado y la eliminación; el archivado y la eliminación por lotes permanecen deshabilitados salvo que todas las sesiones seleccionadas puedan archivarse. No se pueden archivar una ejecución activa ni la sesión principal de un agente. Al archivar o eliminar la sesión seleccionada actualmente, Chat vuelve a la sesión principal de ese agente.
    - En la aplicación para macOS, la marca de OpenClaw utiliza la franja vacía de la barra de título nativa situada junto a los controles de la ventana, en lugar de ocupar una fila de la barra lateral.
    - Con anchos de escritorio, los controles del chat permanecen en una única fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al principio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados que solo contienen texto se renderizan como una sola burbuja con una insignia de cantidad. Los mensajes que contienen imágenes, archivos adjuntos, resultados de herramientas o vistas previas del lienzo no se contraen.
    - Las burbujas de mensajes del usuario incluyen acciones de transcripción: un botón para retroceder que aparece al pasar el puntero (ventana emergente de confirmación con la opción «No volver a preguntar»), además de **Retroceder hasta aquí** y **Bifurcar desde aquí** mediante clic derecho. Retroceder devuelve la sesión al estado inmediatamente anterior a ese mensaje y devuelve su texto al editor para modificarlo y reenviarlo (`sessions.rewind`, `operator.admin`); bifurcar crea una nueva sesión a partir del prefijo de la ruta activa anterior al mensaje, la abre y rellena su editor con el mismo texto (`sessions.fork`, `operator.write`). Ambas acciones se deshabilitan con una descripción emergente explicativa mientras el agente está trabajando, solo se aplican a mensajes persistentes del usuario y se rechazan en sesiones cuya conversación pertenece a un entorno externo de agentes. Retroceder solo desplaza el contexto del chat: los archivos y otros efectos secundarios de las herramientas no se revierten, y la transcripción anterior al retroceso permanece conservada en el almacén de sesiones de solo anexado. Cuando ese almacén contiene varias ramas de la transcripción, la barra de título del chat muestra un menú de ramas con el mensaje más reciente, la cantidad de mensajes y la antigüedad de cada rama; seleccionar una rama inactiva devuelve la sesión actual a esa ruta conservada (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). Tampoco se puede cambiar de rama mientras el agente está trabajando, y seleccionar la rama ya activa produce un error tipado de operación nula en el límite RPC. La acción independiente para ocultar de las burbujas del usuario oculta un mensaje únicamente en el navegador actual; el mensaje permanece en la transcripción y el agente continúa viéndolo.
    - Cuando el checkout de una sesión está en una rama no predeterminada de un repositorio de GitHub, la vista del chat fija indicadores de pull requests encima del editor: número del PR, repositorio, rama, cantidades de diferencias, un indicador de CI y el estado de borrador, fusionado o cerrado, cada uno con un enlace al PR. La fila muestra como máximo dos indicadores —primero los PR activos (abiertos o en borrador)— y un botón «Mostrar más» revela el historial contraído de PR fusionados o cerrados. El indicador de CI abre una pequeña ventana emergente de supervisión de CI con las cantidades de comprobaciones superadas, fallidas, en ejecución y omitidas, además de un enlace a la página de comprobaciones del PR. La detección se ejecuta en el servidor mediante `controlUi.sessionPullRequests`, que reutiliza `GH_TOKEN`/`GITHUB_TOKEN` del Gateway cuando están configurados. Cuando se alcanza el límite de solicitudes de la API de GitHub, los indicadores conservan el último estado conocido y muestran una advertencia de que el estado podría estar desactualizado; descartar un indicador lo oculta para esa sesión en el perfil actual del navegador. Antes de que exista ningún PR, la fila muestra la propia rama: repositorio, nombre de la rama y tamaño +/− de las diferencias respecto a la base de fusión de la rama predeterminada (trabajo confirmado y sin confirmar). Cuando la rama enviada contiene confirmaciones que se pueden comparar, la fila añade un botón Crear PR que abre la página de GitHub para crear un pull request; antes de eso, una sesión con archivos modificados (confirmados, sin confirmar o sin seguimiento) sigue mostrando la fila, pero sin el botón. La fila se oculta mientras exista un PR abierto o en borrador. La fila de la rama solo utiliza el repositorio git local, por lo que sigue disponible mientras GitHub limita las solicitudes y muestra la misma advertencia de estado obsoleto, ya que no se puede confiar en «no se encontró ningún PR» hasta que se restablezca el límite.
    - El panel de diferencias de la sesión muestra lo que realmente ha cambiado el checkout de una sesión: el botón de la rama en el panel del espacio de trabajo o en la barra de título del chat abre el panel de detalles con las diferencias por archivo del trabajo de la rama, sin confirmar y sin seguimiento respecto a la base de fusión de la rama predeterminada del checkout: punto de estado, flecha de cambio de nombre, cantidades +/− por archivo, archivos contraíbles y marcadores «N líneas sin modificar» entre fragmentos. Las diferencias se calculan en el servidor mediante el método `sessions.diff` del Gateway (ámbito `operator.read`); los archivos binarios y demasiado grandes se reducen a entradas que solo muestran estadísticas, y el botón solo aparece cuando el Gateway conectado anuncia `sessions.diff`.
    - Cada panel de Chat tiene una barra de título. Haga clic en el título de la sesión para cambiarle el nombre; el indicador del espacio de trabajo copia la ruta o la rama del checkout y puede mostrar los espacios de trabajo del Gateway local en el gestor de archivos del sistema anfitrión. Las sesiones remotas y de nodos de ejecución mantienen las acciones de copia, pero ocultan la acción para mostrar.
    - El panel del espacio de trabajo del hilo de cada panel de Chat enumera los archivos del hilo, los archivos del proyecto y los artefactos. De forma predeterminada, se acopla al borde derecho del panel; arrastre su encabezado (o utilice el botón de acoplamiento) para moverlo a la parte inferior, y la elección se almacenará en el perfil actual del navegador. Un panel contraído no ocupa espacio alguno: vuelva a abrirlo con ⇧⌘B o con el conmutador de archivos de la barra de título, que muestra una insignia con la cantidad de archivos modificados. El panel independiente de detalles de archivos, herramientas y Canvas no se ve afectado.
    - Al hacer clic en una referencia a un archivo del chat, en una ruta de archivo de una tarjeta expandida de una herramienta de lectura, edición o escritura, o en una fila de archivo del panel del espacio de trabajo, se abre el panel de detalles del archivo: una vista de código basada en CodeMirror con resaltado de sintaxis, números de línea, salto a una línea, búsqueda dentro del archivo, acciones de copia y un menú para abrirlo en un editor externo. Cuando el Gateway anuncia `sessions.files.set` a una conexión `operator.admin`, el panel añade un modo Editar con seguimiento de cambios sin guardar y guardado mediante Cmd/Ctrl-S; los borradores sin guardar sobreviven a la navegación entre archivos, paneles y sesiones en la pestaña actual del navegador hasta que se guardan o descartan explícitamente. Los guardados utilizan una operación de comparación e intercambio basada en un hash del contenido devuelto por `sessions.files.get`: si el archivo ha cambiado en el disco desde que se cargó (por ejemplo, porque el agente siguió trabajando), el panel muestra un aviso de conflicto con las acciones Recargar (usar el contenido más reciente) y Sobrescribir (conservar la edición local). Las escrituras pasan por las mismas protecciones seguras del sistema de archivos del espacio de trabajo que las lecturas —contención de rutas, rechazo de enlaces simbólicos o físicos y un límite UTF-8 de 256 KB— y solo sobrescriben archivos existentes; el editor nunca los crea ni los elimina.
    - El panel de tareas en segundo plano de cada panel de Chat enumera las tareas en segundo plano y los subagentes del agente actual (`tasks.list` limitado por agente y actualizado en directo mediante eventos `task`): el trabajo en ejecución muestra un temporizador en directo del tiempo transcurrido, la cantidad de usos de herramientas, la herramienta en uso y un control para detenerlo; la sección contraíble de tareas finalizadas añade la duración de las ejecuciones; y un enlace Ver transcripción abre en el panel la sesión secundaria de la tarea. Ábralo con el conmutador de actividad de la barra de título; la instantánea de las tareas se carga de forma anticipada, por lo que muestra una insignia con la cantidad de tareas en ejecución sin necesidad de abrir primero el panel. La página Tareas sigue siendo el registro completo de todos los agentes.
    - La barra de espacios de trabajo, la barra de tareas en segundo plano y el panel de detalles se adaptan al ancho de cada panel, en lugar de al de la ventana: en un panel estrecho o una ventana compacta, ambas barras aparecen como franjas inferiores (los controles de acoplamiento lateral se ocultan hasta que el panel se ensancha; la barra de espacios de trabajo tiene prioridad para ocupar la posición lateral cuando solo cabe una columna), y el panel de detalles se apila debajo del hilo con un controlador de redimensionamiento horizontal en lugar de compartir la misma fila. En las áreas de visualización del tamaño de un teléfono, el panel de detalles sigue abriéndose a pantalla completa.
    - Los selectores de modelo y razonamiento del encabezado del chat actualizan inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío aplicables a un solo turno.
    - **Vista dividida:** ábrala desde la barra de título del chat (junto a los conmutadores de diferencias del hilo, tareas en segundo plano y archivos del hilo) y, a continuación, divida el panel activo hacia la derecha o hacia abajo para crear tantos paneles como quepan. Cada panel tiene su propio hilo, transcripción, cuadro de redacción y flujo de herramientas.
    - Los agentes que disponen de la herramienta `screen` pueden solicitar los mismos cambios de panel, barra lateral, terminal, navegador, foco y navegación mientras haya una interfaz de control compatible conectada. La versión 1 del protocolo aplica el comando a todas las interfaces de control compatibles conectadas; consulte [Pantalla](/es/tools/screen).
    - Arrastre una sesión desde la barra lateral hasta el chat para abrirla en un panel. Una vista previa animada de la colocación se desliza entre las zonas y etiqueta el resultado —«Dividir» sobre la mitad exacta que ocupará un nuevo panel, «Abrir aquí» sobre un panel completo—; también es posible soltar elementos desde el modo de panel único.
    - El panel dividido activo determina la selección de la barra lateral y la URL. Su barra de título incorpora controles para dividirlo y cerrarlo; los separadores permiten redimensionar las columnas y los paneles apilados, y el navegador guarda el diseño localmente entre recargas.
    - En pantallas estrechas, la vista dividida conserva el diseño, pero solo representa el panel activo, incluido su encabezado con el control para cerrarlo.
    - Si se envía un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el cuadro de redacción espera a que se complete la actualización de esa sesión antes de llamar a `chat.send`, de modo que el envío utilice el modelo seleccionado.
    - Al escribir `/new`, se crea y se cambia a la misma sesión nueva del panel de control que con Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y la sesión principal del agente es la sesión superior actual; en ese caso, la sesión principal se restablece sin sustituirla. Al escribir `/reset`, se mantiene el restablecimiento explícito sin sustitución del Gateway para la sesión actual.
    - El selector de modelo del chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.modelPolicy.allow` no está vacío, esa política determina el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos específicos de cada proveedor. De lo contrario, el selector muestra las entradas configuradas, además de los proveedores con una autenticación utilizable; los alias y ajustes de `agents.defaults.models` no lo restringen. El catálogo completo sigue estando disponible mediante la RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de la sesión del Gateway incluyen los tokens de contexto actuales, la barra de herramientas del cuadro de redacción del chat muestra un pequeño indicador circular del uso del contexto con el porcentaje utilizado. Abra el indicador para consultar la ventana de contexto actual, los recuentos de tokens de la ejecución más reciente y el coste total estimado, la identidad del proveedor y del modelo, y el desglose más reciente de los costes de entrada, salida y caché de la respuesta del proveedor, cuando se notifiquen. El indicador adopta un estilo de advertencia cuando la presión sobre el contexto es alta y, al alcanzar los niveles de Compaction recomendados, muestra un botón compacto que ejecuta la ruta normal de Compaction de la sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelve a notificar datos de uso recientes.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en el navegador)">
    El modo de conversación utiliza un proveedor de voz en tiempo real registrado. Configure OpenAI con `talk.realtime.provider: "openai"` y un perfil de clave de API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`. OpenAI Realtime utiliza la API pública de Platform y requiere una clave de API de Platform; un inicio de sesión OAuth de Codex no sirve para esta interfaz. Configure Google con `talk.realtime.provider: "google"` y `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor: OpenAI recibe un secreto efímero de cliente de Realtime para WebRTC, y Google Live recibe un token de autenticación restringido y de un solo uso de la API Live para una sesión WebSocket del navegador, con las instrucciones y las declaraciones de herramientas fijadas en el token por el Gateway. Los proveedores que solo ofrecen un puente de tiempo real de backend funcionan mediante el transporte de retransmisión del Gateway, de modo que las credenciales y los sockets del proveedor permanecen en el servidor mientras el audio del navegador se transmite mediante RPC autenticadas del Gateway. El prompt de la sesión de Realtime lo compone el Gateway; `talk.client.create` no acepta sustituciones de instrucciones proporcionadas por el llamador.

    Los valores predeterminados persistentes de proveedor, modelo, voz, transporte, esfuerzo de razonamiento, umbral exacto de VAD, duración del silencio y relleno de prefijo se encuentran en **Configuración → Comunicaciones → Conversación**; para cambiarlos se requiere acceso a `operator.admin`. Configurar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; configurar WebRTC mantiene la sesión bajo el control del cliente y genera un error, en lugar de recurrir silenciosamente a la retransmisión, si el proveedor no puede crear una sesión de navegador.

    El control de conversación es el botón del micrófono en la barra de herramientas del cuadro de redacción. Su desplegable muestra **Predeterminado del sistema** y todos los micrófonos que expone el navegador, incluidas las entradas USB, Bluetooth y virtuales. El identificador del dispositivo seleccionado permanece en el navegador y nunca se envía al Gateway; si ese dispositivo exacto desaparece, el modo de conversación solicita elegir otra entrada en lugar de grabar silenciosamente desde otro micrófono. Mientras el modo de conversación está activo, el botón del micrófono se convierte en una pastilla que muestra el medidor del nivel de entrada en tiempo real; al hacer clic en ella se detiene la entrada de voz y, al pasar el cursor, se muestra el icono de detención. Los lectores de pantalla anuncian `Connecting voice input...`, `Listening...` o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta el modelo de mayor tamaño configurado mediante `talk.client.toolCall`. Detener una respuesta del agente en curso sigue siendo una acción independiente mediante el control cuadrado **Detener** situado junto a la pastilla.

    **Conversación por vídeo** está disponible para las sesiones de navegador de OpenAI Realtime WebRTC y Google Live. Haga clic en el botón de la cámara, permita el acceso a la cámara y al micrófono y confirme la vista previa local. OpenAI envía un único fotograma JPEG de tamaño limitado por su canal de datos del navegador cuando `describe_view` solicita contexto visual. Google Live envía fotogramas JPEG de tamaño limitado directamente desde el navegador al proveedor, con el máximo admitido de un fotograma por segundo, y responde a las llamadas de función `describe_view` con el estado de la transmisión de la cámara. Los fotogramas de la cámara nunca pasan por el Gateway. Al detener el modo de conversación, se cierra la vista previa y se liberan ambas pistas multimedia. Consulte las [capacidades de la API Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) y la [guía de llamadas a funciones](https://ai.google.dev/gemini-api/docs/live-api/tools) de Google para conocer los contratos de comunicación del proveedor.

    Prueba de humo en vivo para responsables de mantenimiento: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket del backend de OpenAI, el intercambio SDP de WebRTC en el navegador de OpenAI, la configuración de Google Live en el navegador mediante un token restringido, con un fotograma JPEG y un ciclo completo de función `describe_view`, y el adaptador de retransmisión del Gateway para el navegador con medios de micrófono simulados. El comando solo muestra el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haga clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales utilizan el modo efectivo `messages.queue` del Gateway. `steer` los inyecta en el turno en curso; los demás modos mantienen la entrega en cola persistente del navegador. Si se rechaza la redirección, también se recurre a esa cola. Haga clic en **Redirigir** en un mensaje en cola para inyectarlo manualmente.
    - **Configuración → Apariencia → Chat → Seguimientos mientras el agente está trabajando** permite sustituir ese valor predeterminado del servidor para el navegador actual. La página indica explícitamente que existe una sustitución y ofrece **Restablecer al valor predeterminado del servidor**. `Steer into the active run` envía los seguimientos inmediatamente, mientras que `Queue until the run ends` los retiene hasta que finaliza la ejecución.
    - Escriba `/stop` (o frases independientes para abortar, como `stop`, `stop action`, `stop run`, `stop openclaw` o `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Conservación de contenido parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz.
    - El Gateway conserva en el historial de la transcripción el texto parcial abortado del asistente cuando existe una salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de la transcripción puedan distinguir el contenido parcial abortado de la salida de una finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, la pérdida de la conexión con el Gateway no cierra la sesión. El panel
permanece visible con una pastilla flotante de color ámbar que muestra «Conexión con el Gateway perdida — Reconectando…» debajo de la barra
superior mientras el cliente reintenta la conexión automáticamente con espera incremental (de 800 ms a 15 s). Las actualizaciones en vivo y
las acciones de tiempo real o de sesión se pausan hasta que vuelve la conexión; **Reintentar ahora** en la pastilla fuerza un
intento inmediato. El chat sigue siendo editable: los envíos de texto ordinario y archivos adjuntos se conservan en el
almacenamiento del navegador de la pestaña actual, limitado al Gateway y a la sesión, se muestran como pendientes de reconexión y se envían
automáticamente cuando vuelve el Gateway. Los controles en vivo y los comandos con barra siguen sin estar disponibles mientras
no hay conexión.

Cuando este navegador ya contiene credenciales (un token o una contraseña configurados, o un token de dispositivo
aprobado), en la primera apertura y al recargar se muestra una pequeña marca animada de OpenClaw mientras se
establece la conexión, en lugar de mostrar brevemente la pantalla de inicio de sesión. La pantalla de inicio de sesión solo aparece cuando aún no hay credenciales
almacenadas o cuando el Gateway las rechaza activamente (token o contraseña incorrectos, emparejamiento revocado);
estos estados requieren intervención en lugar de esperar.

## Instalación de la PWA y Web Push

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway active la PWA instalada mediante notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Dentro de la aplicación para macOS, la página de configuración de Notificaciones muestra el permiso de notificaciones nativo de la aplicación en lugar de las notificaciones push del navegador, porque la aplicación entrega las notificaciones de forma nativa.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelva a abrir el panel con `openclaw dashboard` y realice una actualización forzada. Si el error persiste, borre los datos del sitio correspondientes al origen del panel o pruebe en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador pueden seguir ejecutando un paquete de la interfaz de control anterior a la actualización contra el Gateway más reciente.

| Superficie                                         | Función                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | Manifiesto de la PWA. Los navegadores ofrecen «Install app» cuando está accesible. |
| `ui/public/sw.js`                                  | Service worker que gestiona los eventos `push` y los clics en las notificaciones. |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Par de claves VAPID generado automáticamente que se utiliza para firmar las cargas útiles de Web Push. |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Endpoints, claves y marcas de tiempo de registro conservados de las suscripciones del navegador. |

Las actualizaciones desde los almacenes retirados `push/vapid-keys.json` y `push/web-push-subscriptions.json` se importan mediante `openclaw doctor --fix`. Detenga el Gateway antes de ejecutar esa reparación para impedir que un proceso antiguo vuelva a crear el estado retirado durante la importación. Ejecute la reparación antes de usar Web Push tras una actualización; el registro, la entrega, la eliminación y la resolución de claves se niegan a continuar mientras permanezca alguna fuente retirada o una reclamación interrumpida de Doctor. El entorno de ejecución del Gateway solo lee y escribe SQLite.

Sustituya el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando se desee fijar las claves (implementaciones en varios hosts, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (el valor predeterminado es `https://openclaw.ai`)

La interfaz de control utiliza estos métodos del Gateway, restringidos por ámbito, para registrar y probar las suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` junto con `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulte [Configuración](/es/gateway/configuration) para obtener información sobre las notificaciones push respaldadas por retransmisión) y del método `push.test`, destinado al emparejamiento nativo de dispositivos móviles.
</Note>

## Contenido alojado incrustado

Los mensajes del asistente pueden representar contenido web alojado en línea mediante el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

La herramienta principal [`show_widget`](/es/tools/show-widget) representa SVG o HTML autocontenido directamente desde una llamada de herramienta. El navegador y los clientes de chat nativos compatibles anuncian la capacidad `inline-widgets` del Gateway, y el documento de Canvas resultante permanece disponible cuando se vuelve a cargar el historial del chat. Las actividades de Discord proporcionan el mismo nombre de herramienta en Discord; las ejecuciones originadas en otros canales no la reciben.

<Tabs>
  <Tab title="estricto">
    Desactiva la ejecución de scripts dentro del contenido alojado incrustado.
  </Tab>
  <Tab title="scripts (predeterminado)">
    Permite contenido incrustado interactivo y mantiene el aislamiento del origen; suele bastar para juegos y widgets autocontenidos del navegador.
  </Tab>
  <Tab title="de confianza">
    Añade `allow-same-origin` además de `allow-scripts` para los documentos del mismo sitio que necesitan intencionadamente privilegios más amplios.
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

Las URL externas absolutas de contenido incrustado `http(s)` permanecen bloqueadas de forma predeterminada. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, configure `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de los mensajes del chat

La transcripción del chat utiliza un marco centrado y legible, alineado con el cuadro de redacción. La salida del asistente y de las herramientas permanece alineada a la izquierda, mientras que las burbujas del usuario permanecen alineadas a la derecha dentro de ese marco. Las implementaciones con monitores anchos pueden sustituir el ancho de la transcripción sin modificar el CSS incluido mediante la configuración de `ui.prefs.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los formatos compatibles incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso a la tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenga el Gateway en la interfaz de bucle invertido y permita que Tailscale Serve actúe como proxy mediante HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra `https://<magicdns>/` (o el `gateway.controlUi.basePath` configurado).

    De forma predeterminada, las solicitudes de Serve de la interfaz de control/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a la interfaz de bucle invertido con los encabezados `x-forwarded-*` de Serve de Tailscale. Para las sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite el intercambio de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales del dispositivo. Establezca `gateway.auth.allowTailscale: false` si desea exigir credenciales explícitas de secreto compartido incluso para el tráfico de Serve y, a continuación, use `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos de la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de escribir los límites de frecuencia. Por tanto, los reintentos incorrectos simultáneos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud, en lugar de que dos discrepancias simples compitan en paralelo.

    <Warning>
    La autenticación de Serve sin token presupone que el host del Gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exija autenticación mediante token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a la tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abra `http://<tailscale-ip>:18789/` (o su `gateway.controlUi.basePath` configurado).

    Pegue el secreto compartido correspondiente en la configuración de la interfaz (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP no seguro

Si abre el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

La excepción compatible sin dispositivo es una autenticación correcta del operador de la interfaz de control
mediante `gateway.auth.mode: "trusted-proxy"`. No existe ningún modificador de configuración persistente
que desactive la identidad del dispositivo.

**Solución recomendada:** use HTTPS (Serve de Tailscale) o abra la interfaz localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del Gateway).

<AccordionGroup>
  <Accordion title="Nota sobre el proxy de confianza">
    - Una autenticación correcta mediante un proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se aplica a las sesiones de la interfaz de control con rol de nodo.
    - Los proxies inversos de bucle invertido en el mismo host tampoco satisfacen la autenticación mediante proxy de confianza; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/es/gateway/tailscale) para obtener instrucciones sobre la configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control incluye una política estricta de `img-src`: solo se permiten recursos del **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes `http(s)` remotas y relativas al protocolo, y nunca realiza solicitudes de red para ellas.

En la práctica:

- Los avatares y las imágenes servidos mediante rutas relativas (por ejemplo, `/avatars/<id>`) siguen mostrándose, incluidas las rutas de avatares autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` insertadas directamente siguen mostrándose.
- Las URL `blob:` locales creadas por la interfaz de control siguen mostrándose.
- El Gateway obtiene de GitHub los avatares de las vistas previas de enlaces de GitHub desde su host fijo de avatares y los devuelve como URL `data:` acotadas; el navegador del operador nunca se pone en contacto con el host remoto de avatares.
- Las URL de avatares remotos emitidas por los metadatos del canal se eliminan en los auxiliares de avatares de la interfaz de control y se sustituyen por el logotipo/distintivo integrado, por lo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

Esta opción está siempre activada y no se puede configurar.

## Autenticación de la ruta de avatares

Cuando se configura la autenticación del Gateway, el punto de conexión de avatares de la interfaz de control requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar únicamente a solicitantes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar conforme a la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (al igual que en la ruta relacionada de contenido multimedia del asistente), por lo que la ruta de avatares no puede filtrar la identidad del agente en hosts que, por lo demás, están protegidos.
- La interfaz de control reenvía el token del Gateway como encabezado de portador al obtener avatares y utiliza URL de blob autenticadas para que la imagen siga mostrándose en los paneles.

Si desactiva la autenticación del Gateway (no se recomienda en hosts compartidos), la ruta de avatares también deja de requerir autenticación, de acuerdo con el resto del Gateway.

## Autenticación de la ruta de contenido multimedia del asistente

Cuando se configura la autenticación del Gateway, las vistas previas de contenido multimedia local del asistente utilizan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la interfaz de control; el navegador envía el token del Gateway como encabezado de portador al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, vídeo y documentos representadas por el navegador utilizan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la representación de contenido multimedia compatible con los elementos multimedia nativos del navegador sin incluir credenciales reutilizables del Gateway en URL de contenido multimedia visibles.

## Enlaces de aprobación

Las notificaciones de aprobación del operador pueden enlazar directamente con un documento de aprobación independiente servido bajo el espacio de nombres reservado `${controlUiBasePath}/approve/{approvalId}` (por ejemplo, `/approve/<approvalId>`, o `/openclaw/approve/<approvalId>` con una ruta base configurada). La URL permanece estable durante la vigencia de la aprobación y puede reenviarse de forma segura entre sus propios dispositivos: identifica la aprobación, pero nunca la autoriza.

- El Gateway reserva el espacio de nombres de un segmento `/approve/<approvalId>` antes que las rutas HTTP de los plugins para **todos** los métodos HTTP, por lo que una ruta de un plugin nunca puede suplantar ni interceptar un documento de aprobación.
- Abrir un documento de aprobación requiere la misma autenticación del Gateway que el resto de la interfaz de control (token/contraseña, identidad de Serve de Tailscale o identidad de proxy de confianza); las credenciales nunca forman parte de la URL de aprobación.
- Cuando el servicio de la interfaz de control está desactivado, las solicitudes al espacio de nombres devuelven `404` en lugar de pasar a los controladores de plugins.
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

A continuación, dirija la interfaz a la URL de WebSocket de su Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de la interfaz de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, es posible que una extensión o un script de contenido ejecutado al principio haya impedido evaluar la aplicación de módulos JavaScript. La página estática incluye un panel de recuperación HTML sencillo que aparece cuando `<openclaw-app>` no está registrado después del inicio.

Use la acción **Volver a intentarlo** del panel después de cambiar el entorno del navegador, o recargue manualmente tras realizar estas comprobaciones:

- Desactive las extensiones que se inyectan en todas las páginas, especialmente las extensiones con scripts de contenido `<all_urls>`.
- Pruebe una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantenga el Gateway en ejecución y compruebe la misma URL del panel después de cambiar el navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La interfaz de control consta de archivos estáticos; el destino de WebSocket es configurable y puede diferir del origen HTTP. Esto resulta útil cuando se desea ejecutar el servidor de desarrollo de Vite localmente, pero el Gateway se ejecuta en otro lugar.

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
    - Si se pasa un punto de conexión `ws://` o `wss://` completo mediante `gatewayUrl`, codifique el valor como URL para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones mediante los registros de solicitudes y Referer. Los parámetros de consulta `?token=` heredados aún se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` solo se conserva en memoria.
    - Cuando se establece `gatewayUrl`, la interfaz no recurre a las credenciales de configuración ni del entorno. Proporcione `token` (o `password`) explícitamente; la ausencia de credenciales explícitas constituye un error.
    - Use `wss://` cuando el Gateway esté detrás de TLS (Serve de Tailscale, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para evitar el clickjacking.
    - Las implementaciones públicas de la interfaz de control fuera de la interfaz de bucle invertido deben establecer `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas del mismo origen en la LAN/tailnet desde la interfaz de bucle invertido, RFC1918/enlace local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin activar la alternativa basada en el encabezado Host.
    - El inicio del Gateway puede preconfigurar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir de la vinculación y el puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen requiriendo entradas explícitas.
    - No use `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen del navegador, no «hacer coincidir cualquier host que se esté utilizando».
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

## Relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
