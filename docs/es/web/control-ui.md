---
read_when:
    - Quiere operar el Gateway desde un navegador
    - Se desea acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-19T13:40:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6d17673b0a2f02ddf4f6fa0b33ccd1e5db9967833961260d93a1f141dc95981
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de página única de **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establezca `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abra [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no se carga, inicie primero el Gateway: `openclaw gateway`.

<Note>
En enlaces de LAN nativos de Windows, el Firewall de Windows o la directiva de grupo administrada por la organización aún pueden bloquear la URL de LAN anunciada, incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecute `openclaw gateway status --deep` en el host de Windows; informa de puertos probablemente bloqueados, discrepancias de perfiles y reglas del firewall local que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del cuadro de mando conserva un token para la sesión de la pestaña actual del navegador y la URL del gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente genera un token del gateway para la autenticación con secreto compartido en la primera conexión, pero la autenticación mediante contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

La conexión desde un navegador o dispositivo nuevo normalmente requiere una **aprobación de emparejamiento única**, que se muestra como `disconnected (1008): pairing required`.

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

Si el navegador vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior queda sustituida y se crea un nuevo `requestId`; vuelva a ejecutar `openclaw devices list` antes de aprobar.

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura/administración se trata como una ampliación de la aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con permisos más amplios y solicita que se apruebe explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requiere una nueva aprobación, salvo que se revoque con `openclaw devices revoke --device <id> --role <role>`. Consulte la [CLI de dispositivos](/es/cli/devices) para obtener información sobre la rotación y revocación de tokens, así como sobre el flujo de aprobación de la primera ejecución de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas del navegador mediante el bucle invertido local (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el recorrido de ida y vuelta del emparejamiento para las sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, se verifica la identidad de Tailscale y el navegador presenta la identidad de su dispositivo. Los navegadores sin dispositivo y las conexiones con rol de Node siguen sometiéndose a las comprobaciones normales de dispositivos.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo una aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requiere volver a realizar el emparejamiento.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el código QR de conexión para iOS/Android sin abrir una terminal:

<Steps>
  <Step title="Abrir el emparejamiento móvil">
    Seleccione **Devices** y, a continuación, haga clic en **Pair mobile device** en la tarjeta **Devices**.
  </Step>
  <Step title="Conectar el teléfono">
    En la aplicación móvil de OpenClaw, abra **Settings** → **Gateway** y escanee el código QR. Como alternativa, puede copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La aplicación oficial para iOS/Android se conecta automáticamente. Si **Pending approval** muestra una solicitud, revise su rol y sus ámbitos antes de aprobarla.
  </Step>
</Steps>

La creación de un código de configuración requiere `operator.admin`; el botón está deshabilitado en las sesiones que no disponen de él. Un código de configuración contiene una credencial de arranque de corta duración, por lo que el QR y el código copiado deben tratarse como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin protección se limita al bucle invertido y a las direcciones de LAN privada. Consulte [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para obtener todos los detalles de seguridad y de las alternativas.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) asociada a los mensajes salientes para permitir la atribución en sesiones compartidas. Se almacena en el navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se conserva en el servidor, aparte de los metadatos normales de autoría de la transcripción en los mensajes enviados. Al borrar los datos del sitio o cambiar de navegador, vuelve a quedar vacía.

La sustitución del avatar del asistente sigue el mismo patrón local del navegador: las sustituciones cargadas se superponen localmente a la identidad resuelta por el gateway y nunca realizan un recorrido de ida y vuelta a través de `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue estando disponible para los clientes que no usan la interfaz de usuario y escriben directamente en el campo.

## Endpoint de configuración del entorno de ejecución

La interfaz de control obtiene su configuración del entorno de ejecución desde `/control-ui-config.json`, resuelto en relación con la ruta base de la interfaz de control del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y para obtenerlo correctamente se requiere un token o una contraseña válidos del gateway, una identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abra **Settings → General** para ver la tarjeta **Gateway Host** con el equipo del Gateway, la dirección LAN, el sistema operativo, el entorno de ejecución, el tiempo de actividad, la carga de CPU, la memoria y el espacio en disco del volumen de estado. La tarjeta se actualiza cada 10 segundos mientras está visible mediante la RPC `system.info` del Gateway, que requiere el ámbito `operator.read`. Los Gateway más antiguos y las conexiones sin ese ámbito omiten la tarjeta.

## Compatibilidad de idiomas

La interfaz de control se localiza en la primera carga según la configuración regional del navegador. Para cambiarla posteriormente, abra **Settings -> General -> Language** (el selector se encuentra en la página General, no en Appearance).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones distintas del inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción que faltan recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales distintas del inglés, pero el selector de idioma integrado de Mintlify en el sitio de documentación solo muestra los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Appearance incluye los temas Claw, Knot y Dash integrados (Claw es el predeterminado), además de una ranura local del navegador para importar desde tweakcn. Para importar un tema, abra el [editor de tweakcn](https://tweakcn.com/editor/theme), elija o cree un tema, haga clic en **Share** y pegue el enlace copiado en Appearance. El importador también acepta URL del registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de temas sin procesar y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan únicamente en el perfil actual del navegador; no se escriben en la configuración del gateway ni se sincronizan entre dispositivos. Al sustituir el tema importado, se actualiza la única ranura local; al borrarlo, se vuelve a Claw si el tema importado estaba activo.

Appearance también incluye una opción de tamaño del texto. Se aplica al texto del chat, al texto del redactor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no amplíe automáticamente la vista al obtener el foco.

El tema, el modo del tema, el tamaño del texto, el idioma y las preferencias de visualización del chat se sincronizan mediante la configuración del gateway (`ui.prefs`), por lo que se mantienen en todos los dispositivos y los agentes pueden modificarlos a través de la puerta de aprobación; los clientes conectados aplican los cambios en tiempo real mediante el aviso `config.changed` del gateway. Cada navegador conserva una copia local para el inicio inmediato; los clientes que no pueden escribir la configuración (ámbito de visualizador, sin conexión) mantienen los cambios de forma local en el dispositivo. Consulte la [Referencia de configuración](/es/gateway/configuration-reference#ui).

## Mantenimiento del sistema OpenClaw

Abra **OpenClaw** en la barra lateral para comunicarse con el agente de configuración y reparación del sistema. Fuera de la incorporación, esta página puede mostrar como máximo una etiqueta de evento descartable por visita. Permanece en silencio durante el tráfico rutinario del Gateway y solo reacciona ante instantáneas de estado que informan de un recargador de configuración deshabilitado, una desconexión o degradación de un canal configurado, una prueba de canal fallida o credenciales de canal no disponibles. Un evento más reciente sustituye la etiqueta pendiente únicamente si es más grave; descartar o utilizar la etiqueta silencia los avisos de eventos durante esa visita. Al hacer clic en la etiqueta, se envía su pregunta de diagnóstico como un mensaje `openclaw.chat` real, por lo que la transcripción registra la solicitud y OpenClaw realiza el diagnóstico. Durante la incorporación nunca se muestran estas etiquetas de eventos.

## Gestionar plugins

Abra **Plugins** en la barra lateral o utilice `/settings/plugins` en relación con la
ruta base configurada de la interfaz de control para explorar y gestionar plugins sin salir de
la interfaz de control. Por ejemplo, una ruta base de `/openclaw` utiliza
`/openclaw/settings/plugins`. La página está siempre disponible, incluso cuando todos los
plugins opcionales están deshabilitados.

Plugins es un centro con cuatro pestañas: **Installed** y **Discover** gestionan el código de los plugins
en `/settings/plugins`, **Skills** aloja el gestor de Skills por agente en
`/skills`, y **Workshop** aloja la revisión de propuestas de Skill Workshop en
`/skills/workshop`. Cada pestaña conserva su propia URL y la barra lateral muestra la
única entrada Plugins para todas ellas.

La pestaña **Installed** muestra el inventario local completo agrupado por categoría, con
recuentos generales. Cada fila abre una vista detallada; su menú adicional (`…`)
habilita o deshabilita el plugin y ofrece **Remove** para los plugins instalados externamente.
También enumera los [servidores MCP](/es/cli/mcp) configurados y permite añadirlos, deshabilitarlos
y eliminarlos en la misma vista. Los mismos controles de servidor se encuentran en **Settings → MCP**.
La pestaña **Discover** es la tienda: plugins destacados incluidos con OpenClaw,
plugins externos oficiales y conectores MCP con un solo clic para servicios populares.
Al escribir en el cuadro de búsqueda, se consulta
[ClawHub](https://clawhub.ai/plugins) en la misma vista y se añade una sección **From ClawHub**
con recuentos de descargas e insignias de verificación de origen. Los enlaces profundos pueden
dirigirse directamente a la tienda mediante `/settings/plugins?tab=discover`.

La pestaña **Skills** conserva el informe de estado de Skills, los controles para habilitar o deshabilitar, la introducción
de claves de API y la búsqueda integrada de Skills en ClawHub, todo limitado al agente seleccionado. La
pestaña **Workshop** conserva el tablero de Skill Workshop y el flujo de revisión de Today para
las [propuestas de Skills](/es/tools/skill-workshop). **Find skill ideas** revisa una ventana limitada
de sesiones sustanciales, de la más reciente a la más antigua, y deja los resultados como
propuestas pendientes. El panel muestra la cobertura acumulada; **Scan earlier work**
continúa desde el cursor conservado y después se convierte en **Scan new work** cuando se ha
agotado el historial anterior. La revisión manual del historial funciona mientras el autoaprendizaje autónomo
está deshabilitado y utiliza el modelo configurado del agente seleccionado.

Los plugins incluidos ya están presentes en el Gateway y muestran **Enable** o
**Disable** en lugar de **Install**. Por ejemplo, Workboard está incluido con
OpenClaw, pero está deshabilitado de forma predeterminada, por lo que su acción es **Enable**. Los plugins
incluidos en el paquete no se pueden eliminar, solo deshabilitar.

Leer el catálogo y buscar en ClawHub requieren `operator.read`. Instalar,
habilitar, deshabilitar o eliminar un plugin y cambiar los servidores MCP requieren
`operator.admin`; esas acciones permanecen deshabilitadas para los operadores de solo lectura.

Las instalaciones desde ClawHub se ejecutan a través del Gateway y mantienen las mismas
comprobaciones de confianza, integridad y políticas de instalación de plugins que las demás
instalaciones mediadas por el Gateway. Instalar o eliminar el código de un plugin requiere
reiniciar el Gateway. Habilitar o deshabilitar un plugin instalado puede aplicarse sin reiniciar
cuando el plugin y el entorno de ejecución actual del Gateway lo admiten; de lo contrario, la
interfaz indica que es necesario reiniciar. Los conectores MCP respaldados por OAuth necesitan
una ejecución única de `openclaw mcp login <name>` desde la CLI después de añadirse.

La página se centra intencionadamente en el inventario, el descubrimiento, la instalación,
la habilitación y la eliminación. Utilice [`openclaw plugins`](/es/cli/plugins) para fuentes
arbitrarias de npm, git o rutas locales, actualizaciones y configuración avanzada de plugins.

## Aplicaciones y extensiones

Abra **Aplicaciones** desde el menú **Más** de la barra lateral, la paleta de comandos o el
menú de agente de la barra lateral (**Obtener las aplicaciones**), o utilice
`/apps` en relación con la ruta base configurada de la interfaz de control. La
página reúne enlaces de instalación para todas las superficies complementarias de OpenClaw:
las aplicaciones para [iOS](/es/platforms/ios) y [Android](/es/platforms/android), los complementos
para Apple Watch y Wear OS incluidos con ellas, las aplicaciones de escritorio para
[macOS](/es/platforms/macos), [Windows](/es/platforms/windows) y [Linux](/es/platforms/linux), la
[extensión de Chrome](/es/tools/chrome-extension), el centro de Plugins integrado en la
aplicación con [ClawHub](https://clawhub.ai), y la comunidad de Discord y la documentación.

## Navegación de la barra lateral

La barra lateral organiza todo en torno al agente. La fila de identidad de la parte superior
corresponde al agente activo; debajo, la sección **Páginas** comienza con **Inicio** —la sesión
principal continua del agente, con un distintivo que muestra su estado no leído o en ejecución—,
seguida de los destinos fijados (**Uso**, **Automatizaciones** y **Plugins** de forma
predeterminada). El control de personalización del encabezado de Páginas abre un menú con todos
los demás destinos, incluidas las pestañas proporcionadas por plugins, además de **Editar
elementos fijados**; al hacer clic con el botón derecho en el área de navegación se abre
directamente el editor de elementos fijados. La lista de sesiones situada debajo se divide en
zonas: **Hilos** para las sesiones de chat del agente (la sesión principal permanece tras Inicio;
las sesiones que esta inició aparecen aquí como hilos de nivel superior y los hilos con nombre
se muestran sin prefijo de tipo), **Grupos** para conversaciones grupales y de sala, y
**Programación** para sesiones vinculadas a un árbol de trabajo administrado o un nodo de
ejecución (las filas muestran una línea `repo ⎇ branch` junto con el host del nodo), sesiones
de entornos de pruebas respaldadas por ACP y los catálogos de la CLI de Codex/Claude.
Programación comienza contraída en la primera ejecución y recuerda la elección; su encabezado
contraído conserva el recuento real y muestra un indicador de ejecución mientras trabajan las
sesiones que contiene. Los grupos personalizados (la `category` de la sesión) y las
filas **Fijadas** aparecen encima de Hilos, y asignar una sesión a un grupo personalizado
siempre prevalece sobre la clasificación automática por zonas. El encabezado de Hilos contiene
el control de ordenación (Creación o Última actualización, además de un conmutador Agrupar por)
y el **+** que abre la página Nueva sesión. Al abrir una sesión, se mueve el resaltado de
selección sin reordenar las filas. Las sesiones principales con ejecuciones secundarias recientes
muestran un control de despliegue y el número de sesiones secundarias; expándalo para examinar
las sesiones secundarias anidadas, su estado activo o terminal y el entorno de ejecución sin
salir de la barra lateral. Al seleccionar una sesión secundaria, se abre su chat y se revela
automáticamente su ruta de antecesores. Las filas secundarias quedan fuera de la agrupación de
raíces, el anclaje, el arrastre, la selección múltiple y la paginación; las zonas contraídas no
consumen el límite de elementos visibles de la página. Las sesiones con actividad nueva desde
la última vez que se leyeron muestran un punto de no leído, y abrirlas las marca como leídas.
Los estados del ciclo de vida de los trabajadores en la nube utilizan un distintivo de globo;
las sesiones locales y recuperadas omiten el distintivo de ubicación porque la ejecución local
es la opción predeterminada. Cada fila de sesión raíz tiene un menú contextual (botón de tres
puntos verticales o clic con el botón derecho) con Fijar/Desfijar, Marcar como no leída/leída,
Cambiar nombre, Bifurcar, Mover al grupo (incluidos Nuevo grupo y Eliminar del grupo), Archivar
y Eliminar; los diseños táctiles mantienen visibles los controles directos de fijación y menú.
Al hacer Cmd/Ctrl-clic se alternan las filas raíz dentro de una selección múltiple y al hacer
Mayús-clic se amplía esta selección a través del orden visible; al abrir el menú de una fila
seleccionada, se ofrecen acciones por lotes (Marcar N como no leídas/leídas, Mover N al grupo,
Archivar N, Eliminar N) que se aplican a todas las sesiones seleccionadas, con una única
confirmación para la eliminación por lotes. Arrastre una sesión raíz hasta **Fijadas** para
fijarla o hasta un grupo personalizado para moverla. Los encabezados de los grupos personalizados
se pueden contraer, expandir o arrastrar para reordenarlos; los nombres de los grupos y su orden
se guardan en el gateway (`sessions.groups.*`), por lo que se mantienen entre navegadores,
mientras que el estado contraído permanece en el perfil del navegador. Los encabezados de grupo
también tienen un menú (botón de tres puntos verticales o clic con el botón derecho) con Cambiar
nombre del grupo, Nuevo grupo y Eliminar grupo; cambiar el nombre o eliminar un grupo actualiza
en el servidor todas las sesiones que lo integran, incluidas las archivadas, y eliminar un grupo
conserva sus sesiones y las devuelve a Hilos.

## Página Nueva sesión

El **+** del encabezado de la lista de sesiones de la barra lateral abre un borrador de página
completa en `/new`: no se crea nada hasta que se envía el primer mensaje. Una fila
de destino situada encima del cuadro de mensaje elige dónde trabaja la sesión: el agente
(configuraciones multiagente), dónde se ejecuta exec (**Gateway · local** o un nodo emparejado
que exponga `system.run`; requiere `operator.admin`), la carpeta (de forma
predeterminada, el espacio de trabajo del agente; otras rutas absolutas del Gateway requieren
`operator.admin` y un árbol de trabajo) y un conmutador opcional **Árbol de trabajo** con un
selector de rama base (respaldado por `worktrees.branches`, por lo que no se realiza ninguna
obtención) y un nombre opcional del árbol de trabajo (la rama se convierte en
`openclaw/<name>`). El pie del redactor permite elegir el modelo y el nivel de razonamiento de
la nueva sesión, y los inicios en la nube conservan ambas opciones antes de enviar la sesión a
su trabajador. El botón de exploración de la etiqueta de carpeta abre un selector de directorios
integrado respaldado por el método `fs.listDir`, exclusivo para administradores. Su nivel
superior muestra el Gateway y todos los nodos conocidos; los nodos sin conexión y los que no
admiten la exploración de directorios permanecen visibles, pero deshabilitados. Al seleccionar
el Gateway, se comienza desde la carpeta actual o el directorio de inicio del Gateway. Al
seleccionar un nodo compatible, se explora el sistema de archivos del host de ese nodo, se
vincula exec a él y se utiliza directamente la ruta absoluta seleccionada del nodo (los árboles
de trabajo administrados siguen siendo exclusivos del Gateway). Al enviar, se llama a
`sessions.create` con el primer mensaje, por lo que la ejecución comienza en el mismo viaje de
ida y vuelta y la interfaz salta al chat de la nueva sesión. Si el Gateway crea la sesión pero
rechaza ese primer envío, el chat conserva el mensaje y el error tras las recargas; **Reintentar**
lo envía a través de la sesión ya creada en lugar de crear otra.

Dentro de **Configuración**, la barra lateral específica comienza con un campo **Buscar en la
configuración** para encontrar rápidamente las secciones de configuración.

Un campo **Buscar** en la parte superior de la barra lateral abre la paleta de comandos (⌘K).
Al hacer clic en la fila de identidad del agente en la parte superior de la barra lateral, se
abre el menú del agente; **Inicio** abre la sesión principal. Cuando algo requiere atención
—trabajos cron fallidos o atrasados, autenticación de modelos próxima a vencer o vencida—,
aparecen indicadores compactos de atención encima del pie de la barra lateral que llevan a la
página correspondiente al hacer clic. La fila de identidad muestra el avatar del agente (imagen
de identidad o emoji), el nombre, el punto de conexión y un subtítulo en tiempo real. Al hacer
clic, se abre el menú del agente: un selector de agentes (configuraciones multiagente), «¿Qué
puede hacer este agente?», **Configuración del agente**, **Configuración**, emparejamiento móvil,
**Documentación**, el indicador de compilación y el conmutador del modo de color. Las listas con
más de diez agentes incluyen un campo de filtro y muestran primero los agentes fijados; los
agentes se pueden fijar o desfijar desde la página de configuración de Agentes, y el conjunto
fijado se almacena en el perfil del navegador. Elegir un agente limita Chat, Uso,
Automatizaciones, Tareas, Panel de trabajo y Sesiones a ese agente. Cada página limitada incluye
un control **Agente** con **Todos los agentes** como vía de salida; esto amplía el ámbito de la
página compartida sin cambiar el agente concreto del chat, mientras que los enlaces directos a
sesiones siguen abriendo su destino. La página de configuración de Agentes mantiene su propia
selección `?agent=` y no sigue el ámbito de la página compartida. La barra del pie
contiene el logotipo del producto, el indicador de compilación, un punto de conexión del gateway
y un acceso directo a Configuración. Cuando el gateway se ejecuta desde un repositorio de código
fuente en una rama distinta de `main`, el pie también muestra el nombre de esa rama
en rojo para que resulte evidente de un vistazo que el gateway no es una versión de lanzamiento
(las instalaciones de lanzamiento nunca lo muestran). Mayús-Comando-Coma abre **Configuración**
sin reemplazar el atajo Comando-Coma del navegador. El encabezado de la barra lateral también
contiene el conmutador para contraerla (⌘B); al contraerla, se oculta por completo para disponer
de un espacio de trabajo de ancho completo, y un control flotante de expansión (o ⌘B) vuelve a
mostrarla; en su lugar, la aplicación para macOS aloja ese conmutador de forma nativa en la barra
de título. La barra lateral es el único elemento de navegación en el escritorio, sin barra
superior. En ventanas estrechas, la barra lateral se sustituye por un panel superpuesto
deslizante detrás de una fila de encabezado compacta que contiene el conmutador del panel, la
marca y la búsqueda de la paleta de comandos; en teléfonos, Chat integra esa fila de navegación
en su barra de título, con los controles de menú y búsqueda junto al título de la sesión. En la
aplicación para macOS, la fila de encabezado independiente integra el espacio libre de la barra
de título en una única franja compacta junto a los controles de la ventana. La navegación
utiliza el historial habitual del navegador, por lo que sus botones de retroceso y avance
permiten recorrerla; la aplicación para macOS añade un conmutador nativo de la barra lateral
junto a los controles de la ventana y gestos de deslizamiento en el panel táctil, con botones de
retroceso y avance en el borde derecho de la barra lateral mientras está expandida, y botones
nativos de búsqueda (paleta de comandos) y nueva sesión mientras está contraída.

Las aprobaciones pendientes también añaden un indicador de atención encima del pie de la barra
lateral; selecciónelo para abrir la página de Aprobaciones correspondiente.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chatee con el modelo mediante el WS del Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje, para que las sesiones grandes no obliguen al navegador a renderizar la carga completa de la transcripción antes de que el chat pueda utilizarse.
    - Al pasar el cursor o enfocar con el teclado un enlace público de GitHub a una incidencia o un pull request, se muestran su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché los metadatos públicos sin cambiar el destino del enlace, incluso cuando la interfaz de usuario utiliza un Gateway remoto. El Gateway usa `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, tras confirmar que el repositorio es público; de lo contrario, utiliza la API anónima de GitHub con una caché más prolongada.
    - Hable mediante sesiones en tiempo real en el navegador. OpenAI utiliza WebRTC directo, Google Live utiliza un token de navegador restringido y de un solo uso mediante WebSocket, y los plugins de voz en tiempo real exclusivos del backend utilizan el transporte de retransmisión del Gateway. Las sesiones de navegador con capacidad de vídeo pueden elegir una cámara local del dispositivo en Configuración o alternar entre cámaras desde la vista previa en directo; el navegador captura fotogramas JPEG para el proveedor en tiempo real sin transmitir el vídeo de la cámara a través del Gateway. Las sesiones de proveedor gestionadas por el cliente se inician con `talk.client.create`; las sesiones de retransmisión del Gateway se inician con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite el PCM del micrófono mediante `talk.session.appendAudio`, reenvía las llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para aplicar la política del Gateway y utilizar el modelo de OpenClaw configurado de mayor capacidad, y dirige el control por voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmita las llamadas a herramientas y las tarjetas de salida de herramientas en directo en el Chat (eventos del agente). La actividad de las herramientas se representa como filas adaptadas al tipo: los comandos del shell muestran el comando con resaltado de sintaxis y una salida al estilo de terminal; las llamadas de edición y escritura compatibles muestran diferencias en línea acotadas, números de línea cuando están disponibles y estadísticas de `+added -removed`; y las llamadas consecutivas se contraen en un resumen como «Se ejecutaron 13 comandos, se leyeron 6 archivos y se editaron 9 archivos». Mientras una ejecución está activa, la llamada en curso más reciente da nombre al encabezado del grupo. Expanda una fila para inspeccionar sus argumentos restantes y la salida sin procesar.
    - Títulos opcionales generados por IA que describen la finalidad de llamadas complejas a herramientas (comandos largos del shell y herramientas de plugins con muchos argumentos), habilitados con `gateway.controlUi.toolTitles: true` (desactivados de forma predeterminada). Los títulos proceden del método por lotes `chat.toolTitles` mediante el enrutamiento estándar de modelos auxiliares: un `utilityModel` explícito (proveedor elegido por el operador, como en otras tareas auxiliares) o, en su defecto, el modelo pequeño predeterminado declarado por el proveedor de la sesión; además, se almacenan en la caché del Gateway por agente. Cuando la opción no está habilitada o no puede utilizarse ningún modelo económico, las filas conservan sus etiquetas deterministas y no se realiza ninguna llamada al modelo.
    - Inicie o descarte tareas efímeras de seguimiento sugeridas por el modelo; las sugerencias aceptadas abren una nueva sesión de árbol de trabajo gestionado con el prompt propuesto.
    - Pestaña Actividad con resúmenes locales del navegador, diseñados para aplicar primero la redacción, de la actividad en directo de las herramientas procedente de la entrega existente de eventos de `session.tool` / herramientas.

  </Accordion>
  <Accordion title="Canales, sesiones, memoria">
    - Canales: estado de los canales integrados y de Plugin incluidos/externos, inicio de sesión mediante QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones del sondeo de canales mantienen visible la instantánea anterior mientras finalizan las comprobaciones lentas del proveedor y etiquetan las instantáneas parciales cuando un sondeo o una auditoría supera el tiempo asignado en la interfaz de usuario.
    - Hilos (una página del espacio de trabajo en `/sessions`, con una pestaña **Árboles de trabajo** junto a ella): muestra de forma predeterminada las sesiones de los agentes configurados, permite fijar las sesiones frecuentes, cambiarles el nombre, archivar o restaurar sesiones inactivas, recurrir a una alternativa para claves de sesión obsoletas de agentes no configurados y aplicar ajustes por sesión de modelo, reflexión, rapidez, nivel de detalle, rastreo y razonamiento (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan antes que las sesiones recientes no fijadas; las sesiones archivadas se conservan en la vista de elementos archivados de la página Hilos y mantienen sus transcripciones. Las filas muestran un punto de contenido no leído para las sesiones con actividad desde su última lectura, con acciones para marcar como no leído o como leído (`sessions.patch { unread }`), y una acción Bifurcar que ramifica la transcripción en una sesión nueva (`sessions.create { parentSessionKey, fork: true }`). Los mosaicos de resumen situados sobre la tabla sintetizan la lista cargada (número de sesiones, ejecuciones activas, sesiones no leídas y tokens totales); cada fila incluye un glifo de tipo con un punto de ejecución activa, el estado se representa mediante un punto sencillo y una etiqueta, y la columna Tokens muestra un medidor de uso de la ventana de contexto cuando la sesión informa del número de tokens y del tamaño del contexto. Las acciones de administración de cada fila se encuentran en un menú específico (botón de tres puntos verticales o clic con el botón derecho) que reproduce el menú de sesión de la barra lateral, y el panel de la fila incluye el entorno de ejecución del agente y la duración de la ejecución junto con los demás detalles de la sesión.
    - Los catálogos nativos de Claude y Codex de la barra lateral transmiten un host cada vez y después se reconcilian cuando cambia la conectividad de los nodos, cuando la página recibe el foco y, como máximo, cada 30 segundos mientras está visible. Los cambios en los catálogos activan una pasada posterior más rápida para que las sesiones creadas en las herramientas nativas aparezcan sin recargar la interfaz de control.
    - Agrupación de sesiones: un control Agrupar por organiza la tabla de sesiones en secciones según grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados persisten por sesión mediante `sessions.patch` (`category`), por lo que también se pueden categorizar las sesiones iniciadas desde canales de mensajería (Discord, Telegram, WhatsApp, ...); los grupos se asignan arrastrando filas a una sección o mediante el selector de grupo de cada fila, y se crean con la acción Nuevo grupo.
    - Memoria (una pestaña de la página Agentes, limitada al agente seleccionado): estado de Dreaming, control para activar o desactivar y lector del diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Importar memoria (`/memory-import`, accesible desde la pestaña Memoria de la página Agentes): permite previsualizar y copiar la memoria automática local de Claude Code, la memoria consolidada de Codex o los archivos de memoria de Hermes en el espacio de trabajo del agente seleccionado (`migrations.memory.plan`, `migrations.memory.apply`).
    - Oferta de memoria durante la incorporación: cuando la interfaz de control se abre en modo de incorporación (`?onboarding=1`, utilizado por la aplicación complementaria de Linux después de su instalación inicial), un diálogo de una sola página ofrece importar las memorias detectadas mediante el mismo flujo de planificación y aplicación; si se omite, la página de configuración queda disponible como punto de acceso posterior.

  </Accordion>
  <Accordion title="Cron, tareas, plugins, Skills, dispositivos, aprobaciones de ejecución">
    - Automatizaciones (tareas de Cron): tarjetas estadísticas (número de automatizaciones, número de fallos, estado del planificador y próxima activación) sobre un selector de pestañas Automatizaciones/Historial de ejecuciones; la pestaña Automatizaciones muestra las tareas en una tabla filtrable (Todas/Activas/En pausa, búsqueda, filtros de programación y última ejecución, menú de acciones por fila) con sugerencias iniciales debajo, y la pestaña Historial de ejecuciones muestra las ejecuciones recientes de todas las automatizaciones (`cron.*`).
    - Tareas: registro en directo de las tareas en segundo plano activas y recientes, con sesiones vinculadas y posibilidad de cancelación (`tasks.*`). El panel Tareas en segundo plano del chat agrupa el trabajo en curso y finalizado; seleccione una fila para consultar su instrucción acotada y el resumen de la salida o del error.
    - Plugins: permite explorar el inventario instalado y la tienda seleccionada, buscar en ClawHub, instalar y eliminar código de plugins, y activar o desactivar los plugins instalados (`plugins.*`); las filas de servidores MCP permiten editar `mcp.servers` mediante los métodos de configuración.
    - Skills: estado, activación o desactivación, instalación y actualizaciones de claves de API (`skills.*`).
    - Dispositivos: un único inventario reúne los registros de dispositivos emparejados, el catálogo de nodos y la presencia en directo (`device.pair.list`, `node.list`, `system-presence`). El host del Gateway aparece fijado en primer lugar; los clientes emparejados muestran el estado de conexión, los roles, los tokens, las capacidades y los comandos. Los emparejamientos duplicados se agrupan en un grupo expandible, y **Limpiar N obsoletos** elimina en bloque los duplicados sin conexión confirmados por un administrador que se aprobaron automáticamente (local silencioso, CIDR de confianza o verificado mediante SSH) o que son anteriores a la procedencia de la aprobación. Las entradas se pueden eliminar (`node.pair.remove`, `device.pair.remove`), el emparejamiento de dispositivos y las nuevas aprobaciones de nodos se gestionan en línea (`device.pair.*`, `node.pair.approve`/`reject`), y los códigos de configuración para dispositivos móviles se crean desde la misma tarjeta.
    - Aprobaciones de ejecución: permite editar las listas de permitidos del Gateway o de los nodos y la política de consulta para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - La navegación de Configuración agrupa las páginas según la atención requerida: General, Apariencia y Notificaciones en la parte superior; Conexiones (Conexión, Canales, Comunicaciones, Dispositivos); Agentes y herramientas (Agentes, IA y agentes, Proveedores de modelos, MCP, Automatización, Laboratorios); Privacidad y seguridad (Seguridad, Aprobaciones); y Sistema (Infraestructura, Avanzado, Depuración, Registros, Acerca de). General es un centro simplificado con los valores predeterminados de los modelos, el idioma y las estadísticas del host del Gateway; cada uno de los demás ajustes se encuentra en una única página.
    - Privacidad y seguridad: filas seleccionadas para la autenticación del Gateway, la política de ejecución, la habilitación del navegador, el perfil de herramientas, la autenticación de dispositivos y el emparejamiento móvil, por encima de las secciones `security`/`approvals` respaldadas por el esquema.
    - Aprobaciones incluye un historial de 30 días, ordenado del más reciente al más antiguo, de solicitudes resueltas de ejecución, plugins y agentes del sistema. Filtre por tipo o desplácese por páginas de filas anteriores para revisar la decisión, el motivo, la sesión de origen y la atribución de quien resolvió la solicitud, registrados por el Gateway.
    - Laboratorios muestra los interruptores experimentales incluidos. Modo de código es la opción actual y guarda `tools.codeMode.enabled` inmediatamente; los experimentos no incluidos no aparecen ni escriben claves de configuración especulativas.
    - Notificaciones: estado de las notificaciones push web del navegador, suscripción/cancelación de la suscripción y un envío de prueba.
    - Avanzado: todas las secciones de configuración sin una ubicación específica, además del editor JSON5 sin procesar (anteriormente, el modo Avanzado de la página General).
    - Configuración del modelo (`/settings/model-setup`) es una subpágina de Proveedores de modelos, que se abre desde su encabezado.
    - Agentes: una página de configuración (**Configuración → Agentes**, `/settings/agents`) con pestañas por agente (Resumen, Archivos, Herramientas, Skills, Canales, Automatizaciones, Memoria). La pestaña Resumen permite editar la identidad del agente: nombre para mostrar, emoji y una imagen de avatar cuya resolución y tamaño se reducen en el navegador antes de `agents.update`. Al guardar, se almacenan los campos de identidad configurados y se replican en el archivo `IDENTITY.md` del espacio de trabajo; los valores configurados tienen prioridad sobre las ediciones manuales de los mismos campos del archivo.
    - Perfil: una página de configuración que muestra la identidad del agente predeterminado con estadísticas de uso históricas: tokens acumulados, día de mayor actividad, sesión más larga, rachas de actividad, un mapa de calor anual de tokens, herramientas principales y aspectos destacados de los canales (`usage.cost`, `sessions.usage`).
    - MCP tiene una página de configuración dedicada con filas de servidores (transporte, habilitación y resúmenes de OAuth, filtros y paralelismo), controles directos para añadir, habilitar, deshabilitar y eliminar, comandos habituales para operadores y el editor de configuración `mcp` con alcance limitado. La página Plugins sigue siendo el lugar para los conectores de un solo clic y la detección.
    - Proveedores de modelos: una página de configuración que enumera todos los proveedores de modelos configurados con su icono de marca, estado de autenticación (`models.authStatus`), disponibilidad de modelos (`models.list`), datos actuales de plan, cuota y facturación cuando el proveedor los comunica (`usage.status`), y el gasto de las sesiones locales durante los últimos 30 días (`sessions.usage`). La acción Actualizar vuelve a leer el estado de las credenciales y el uso del proveedor.
    - Conexión: una página de configuración (en **Conexiones**) que gestiona el enlace del propio panel con el Gateway: URL de WebSocket, token del Gateway, contraseña y clave de sesión predeterminada, además de la instantánea del protocolo de enlace más reciente (estado, tiempo de actividad, intervalo de pulsos y última actualización de canales). La pantalla de inicio de sesión sin conexión gestiona el caso de desconexión; esta página permite editar la conexión cuando está conectada.
    - Aplicar y reiniciar con validación (`config.apply`) y, a continuación, reactivar la última sesión activa.
    - Las escrituras incluyen una protección mediante hash base para evitar sobrescribir ediciones simultáneas.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución de las SecretRef activas para las referencias de la carga de configuración enviada; las referencias activas enviadas que no se puedan resolver se rechazan antes de escribir.
    - Al guardar formularios, se descartan los marcadores de posición obsoletos y censurados que no se puedan restaurar desde la configuración guardada, mientras se conservan los valores censurados que todavía correspondan a secretos guardados.
    - El esquema y la representación del formulario proceden de `config.schema` / `config.schema.lookup`, incluidos `title`/`description` de los campos, las sugerencias de interfaz correspondientes, los resúmenes de elementos secundarios inmediatos, los metadatos de documentación en nodos anidados de objeto, comodín, matriz y composición, además de los esquemas de plugins y canales cuando están disponibles. El editor de JSON sin procesar solo está disponible cuando la instantánea permite una conversión de ida y vuelta segura en formato sin procesar; de lo contrario, la interfaz de control fuerza el modo Formulario.
    - La opción "Restablecer a lo guardado" del editor de JSON sin procesar conserva la estructura creada en formato sin procesar (formato, comentarios y disposición de `$include`) en lugar de volver a representar una instantánea aplanada, de modo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea permite una conversión de ida y vuelta segura.
    - Los valores de objetos SecretRef estructurados se muestran como de solo lectura en los campos de texto del formulario para evitar que un objeto se convierta accidentalmente en una cadena y se corrompa.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens y costes estimados derivado de las sesiones se mantiene separado de la facturación del proveedor.
    - Las tarjetas de proveedores llaman a `usage.status` y muestran los nombres actuales de los planes, los períodos de cuota, los saldos, los gastos y los presupuestos comunicados por los plugins de proveedores configurados.
    - Un fallo en el uso de un proveedor no bloquea el panel de sesiones y costes; las tarjetas de proveedores no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros y actualización">
    - Depuración: instantáneas de estado, mantenimiento y modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye los tiempos de actualización y RPC de la interfaz de control, los tiempos lentos de representación del chat y la configuración, y entradas de capacidad de respuesta del navegador para fotogramas de animación o tareas prolongados cuando el navegador expone esos tipos de entradas de PerformanceObserver.
    - Registros: seguimiento en tiempo real de los registros de archivos del Gateway con filtrado y exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete o git y reiniciar (`update.run`) con un informe de reinicio; después, consultar periódicamente `update.status` tras volver a conectarse para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de automatizaciones">
    - Al seleccionar una fila, se abre una vista detallada de página completa con un interruptor Activa/En pausa y Ejecutar ahora en el encabezado (ejecutar si corresponde, clonar y eliminar en su menú); la pestaña Configuración permite editar la automatización en línea (instrucción, detalles, frecuencia y anulaciones avanzadas), y la pestaña Historial de ejecuciones muestra las ejecuciones de esa automatización.
    - Las automatizaciones iniciales situadas debajo de la tabla rellenan previamente el formulario de creación con una instrucción y una programación editables.
    - Para las tareas aisladas, la entrega se establece de forma predeterminada en anunciar resumen; cambie a ninguna para las ejecuciones exclusivamente internas.
    - Los campos de canal y destino aparecen cuando se selecciona anunciar.
    - El modo Webhook utiliza `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de Webhook HTTP(S) válida.
    - Para las tareas de la sesión principal, están disponibles los modos de entrega Webhook y ninguna.
    - Los controles de edición avanzada incluyen eliminar después de la ejecución, borrar la anulación del agente, opciones de Cron exactas/escalonadas, anulaciones del modelo y el razonamiento del agente e interruptores de entrega según el mejor esfuerzo.
    - La validación del formulario se muestra en línea con errores por campo; los valores no válidos deshabilitan el botón Guardar hasta que se corrijan.
    - Establezca `cron.webhookToken` para enviar un token de portador específico; si se omite, el Webhook se envía sin encabezado de autenticación.
    - `cron.webhook` es una alternativa heredada retirada que la validación de configuración actual rechaza. Ejecute `openclaw doctor --fix` para migrar los trabajos almacenados que todavía utilizan `notify: true` a una entrega explícita por Webhook o al completarse para cada trabajo, y eliminar la clave antigua.

  </Accordion>
</AccordionGroup>

## Importar la memoria del asistente

Abra **Configuración** → **Importar memoria** para incorporar la memoria local de Codex o Claude Code
a un agente de OpenClaw. El Gateway detecta por sí mismo la memoria local compatible en su propio
host, por lo que una interfaz de control remota importa desde el equipo del Gateway en lugar del
equipo del navegador.

1. Elija el agente de destino.
2. Revise las colecciones de origen detectadas y los nombres de archivo Markdown. El contenido de los archivos
   no se envía en la respuesta del plan ni se muestra en la página.
3. Seleccione las colecciones que se van a importar y confirme. La aplicación vuelve a generar el plan antes de
   escribir, por lo que las selecciones obsoletas fallan de forma segura.
4. Si los archivos ya existen, habilite **Reemplazar importaciones existentes**, actualice la
   vista previa y confirme el reemplazo.

Codex solo importa sus archivos consolidados `MEMORY.md` y `memory_summary.md`. Claude
Code importa Markdown de los directorios de memoria automática del proyecto y de un
`autoMemoryDirectory` configurado; no importa sesiones, ajustes, instrucciones ni
credenciales mediante esta página. Los archivos se copian bajo `memory/imports/` en el
espacio de trabajo seleccionado, donde el plugin de memoria activo puede indexarlos. Las fuentes
nunca se modifican.

La planificación y la aplicación requieren `operator.admin`. Cada aplicación crea una copia de seguridad
verificada de OpenClaw cuando existe un estado, escribe un informe de migración censurado y conserva
copias de seguridad de cada elemento antes de reemplazar los archivos de destino existentes. Consulte
[Descripción general de la memoria](/es/concepts/memory#import-from-coding-assistants) para conocer las rutas y
el comportamiento de recuperación.

## Página de MCP

La página específica de MCP es una vista para operadores de los servidores MCP gestionados por OpenClaw en `mcp.servers`. No inicia los transportes MCP por sí misma; utilícela para inspeccionar y editar la configuración guardada y, a continuación, use `openclaw mcp doctor --probe` cuando necesite una prueba del servidor en funcionamiento.

Flujo de trabajo habitual:

1. Abra **MCP** desde la barra lateral.
2. Compruebe las tarjetas de resumen para ver el total y los recuentos de servidores habilitados, con OAuth y filtrados.
3. Revise cada fila de servidor para comprobar el transporte, la habilitación, la autenticación, los filtros, los tiempos de espera y las sugerencias de comandos.
4. Añada, habilite, deshabilite o elimine servidores directamente en la página de MCP. Utilice la página **Plugins** para los conectores de un solo clic y la detección.
5. Edite la sección de configuración `mcp` con alcance limitado para las definiciones de servidores, los encabezados, las rutas TLS/mTLS, los metadatos de OAuth, los filtros de herramientas y los metadatos de proyección de Codex.
6. Utilice **Guardar** para escribir la configuración o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde un terminal para realizar diagnósticos estáticos, obtener una prueba en funcionamiento o descartar el entorno de ejecución almacenado en caché.

La página censura los valores similares a URL que contienen credenciales antes de representarlos y entrecomilla los nombres de servidor en los fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres del shell. Referencia completa de la CLI y la configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad se encuentra en **Configuración › Sistema**, junto a Registros y Depuración. Es un observador efímero y local del navegador para la actividad de herramientas en tiempo real, derivado del mismo flujo de eventos de `session.tool` / herramientas del Gateway que alimenta las tarjetas de herramientas del Chat. No añade otra familia de eventos, punto de conexión, almacén de actividad persistente, fuente de métricas ni flujo de observadores externos al Gateway.

Las entradas de Actividad solo conservan resúmenes saneados y vistas previas de resultados censuradas y truncadas. Los valores de los argumentos de las herramientas no se almacenan en el estado de Actividad; la interfaz indica que los argumentos están ocultos y solo registra el número de campos de argumentos. La lista en memoria está vinculada a la pestaña actual del navegador, se conserva al navegar por la interfaz de control y se restablece al volver a cargar la página, cambiar de sesión o seleccionar **Borrar**.

## Terminal del operador

El terminal acoplable del operador está deshabilitado de forma predeterminada. Para habilitarlo, establezca `gateway.terminal.enabled: true` y reinicie el Gateway. El terminal requiere una conexión `operator.admin` y abre una PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
El terminal es un shell de host sin confinamiento y hereda el entorno del proceso del Gateway. Habilítelo solo en implementaciones de operadores de confianza. OpenClaw rechaza las sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Use **Ctrl + acento grave** para mostrar u ocultar el panel acoplable. El diseño permite acoplarlo en la parte inferior y a la derecha, cambia de tamaño con el área de visualización del navegador y mantiene varias pestañas de shell. Consulte [Configuración del Gateway](/es/gateway/configuration-reference#gateway) para conocer `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Los agentes autorizados por el propietario y sin entorno aislado pueden usar la herramienta `terminal` para trabajos prolongados o interactivos que el operador deba supervisar. Cada llamada a la herramienta puede abrir, leer, escribir, cambiar el tamaño, cerrar o enumerar las PTY del Gateway propias del agente. De forma predeterminada, las sesiones nuevas abren una pestaña de la interfaz de control conectada simultáneamente, de modo que el agente y el operador comparten la salida y ambos pueden escribir o cambiar el tamaño. El acceso del agente se limita a la sesión exacta: un agente no puede leer ni controlar terminales creados por el operador ni terminales abiertos por otra sesión de agente.

Arrastre uno o más archivos al terminal activo o use el botón del clip para elegirlos. OpenClaw almacena temporalmente cada archivo en la máquina propietaria de la PTY y pega en el cursor las rutas absolutas entrecomilladas para el shell; nunca pulsa Entrar ni ejecuta la entrada. Un indicador de lote compacto muestra el archivo actual y el número de archivos completados. Cancelar detiene el resto del lote sin pegar rutas; una transferencia fallida permanece visible para poder reintentar desde ese archivo sin volver a cargar los archivos completados. Se aceptan imágenes, archivos PDF, archivos comprimidos y otros tipos de archivo de hasta 16 MiB por archivo. Los archivos almacenados temporalmente usan un directorio temporal privado del sistema en hosts POSIX (modo del directorio `0700`, modo del archivo `0600`) o un directorio dentro del límite de ACL del perfil de usuario en Windows, además de un temporizador de limpieza de 24 horas, por lo que debe mover o copiar todo lo que necesite conservar.

La inserción de rutas es compatible con PowerShell, `cmd.exe` y shells POSIX reconocidos (`sh`, Bash, Dash, Ash, Ksh, Zsh y Fish), incluido Git Bash en Windows. Se rechazan otras anulaciones de shell porque no es posible inferir de forma segura sus reglas de entrecomillado; ejecute el Gateway dentro de WSL para disponer de un terminal WSL nativo y rutas de carga de Linux. También se rechazan las rutas `cmd.exe` que contienen `%` o `!`, ya que ese shell expande esos caracteres incluso dentro de comillas dobles.

Las sesiones de Codex y Claude Code detectadas en la barra lateral de sesiones pueden abrirse en su CLI nativa dentro del mismo panel de terminal. En **Settings › Chat**, configure **Open Codex/Claude threads in** como **Terminal** para que un clic normal en una fila abra `codex resume` o `claude --resume`; la opción predeterminada sigue siendo el visor de solo lectura de OpenClaw. El menú contextual o de tres puntos de una fila siempre ofrece ambas opciones, y el encabezado del visor incluye **Open in terminal** cuando la sesión cumple los requisitos.

Los requisitos se evalúan por sesión y por host. Las sesiones locales del Gateway inician el comando de reanudación propiedad del proveedor en el host del Gateway. Las sesiones de nodos emparejados inician un comando del proveedor incluido en la lista de permitidos en el nodo propietario y retransmiten únicamente la salida, la entrada y los eventos de cambio de tamaño de esa PTY; esto no expone un shell general del nodo ni acepta comandos proporcionados por el navegador. Las cargas de archivos usan el comando de nodo independiente y con tamaño limitado `terminal.upload`, y permanecen vinculadas a la sesión de terminal ya abierta. Apruebe la actualización del emparejamiento del nodo cuando aparezca ese comando por primera vez. Los nodos que no anuncian el comando de reanudación de terminal correspondiente, incluidos los puentes de procesos de trabajo integrados sin transmisión dúplex, mantienen disponible el visor y muestran la apertura del terminal como no disponible; los nodos antiguos aún pueden ejecutar un terminal, pero no pueden recibir archivos arrastrados.

Las sesiones propiedad de la conexión sobreviven a las desconexiones: al recargar una página, suspender el portátil o producirse una interrupción de red, la sesión se desconecta en el Gateway en lugar de finalizarse, y la misma pestaña del navegador vuelve a conectarse al restablecerse la conexión, reproduciendo la salida reciente. Las sesiones desconectadas propiedad de la conexión se finalizan después de `gateway.terminal.detachedSessionTimeoutSeconds` (valor predeterminado: 300 segundos; `0` restablece la finalización al desconectarse). Conectarse a una de estas sesiones sigue funcionando como una toma de control al estilo de tmux.

Las sesiones propiedad del agente no están vinculadas a una conexión del navegador. `terminal.attach` añade cada navegador como visor sin que asuma la propiedad, y cerrar una pestaña del visor desconecta únicamente ese navegador. La PTY permanece hasta que el agente propietario la cierra, su proceso termina, la política la deshabilita o el Gateway se apaga. `terminal.list` marca cada entrada como propiedad de la conexión o del agente, y `terminal.text` permite que una conexión de administrador lea la salida reciente en texto sin formato sin conectarse.

El terminal también está disponible como documento de pantalla completa y exclusivo del terminal en `/?view=terminal`. Las aplicaciones para iOS y Android integran esta página en sus pantallas de Terminal y reutilizan las credenciales almacenadas del Gateway; la disponibilidad está sujeta a los mismos controles `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece el terminal.

## Panel del navegador

La interfaz de control incluye un panel de navegador acoplable que representa el navegador controlado por el Gateway (el mismo que los agentes manejan mediante la [herramienta de navegador](/es/tools/browser-control)) en cualquier navegador web convencional, sin necesidad de una vista web nativa. Aparece cuando el Gateway conectado anuncia `browser.request` a una conexión `operator.admin`; el botón del globo terráqueo en la barra del espacio de trabajo del hilo permite mostrarlo u ocultarlo. El panel muestra una instantánea en directo de la página con pestañas, una barra de URL editable, controles para retroceder, avanzar y recargar, y una opción para abrirla en el navegador propio; se acopla a la derecha o en la parte inferior y reenvía los clics, el desplazamiento con la rueda y la escritura básica a la página remota.

Dos modos de captura empaquetan el contexto de la página para el agente:

- **Anotar (lápiz)**: dibuje marcas a mano alzada sobre la página. **Enviar al chat** combina los trazos con la captura de pantalla, adjunta la imagen al editor del chat activo y rellena previamente una indicación que describe la URL y el título de la página, así como cada región marcada, para que el agente sepa exactamente qué se ha rodeado.
- **Inspeccionar (puntero)**: coloque el cursor encima para ver el elemento situado bajo él (selector, nombre accesible, rol y tamaño); haga clic para enviar los detalles de ese elemento junto con una captura de pantalla resaltada mediante el mismo flujo del editor. La inspección, el desplazamiento con la rueda y los controles para retroceder y avanzar requieren `browser.evaluateEnabled` (activado de forma predeterminada).

La aplicación para macOS conserva su barra lateral nativa de navegación de enlaces para los enlaces en los que se hace clic desde el panel; el panel del navegador también funciona allí y es el medio para anotar páginas en todas las demás plataformas.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma la recepción inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de confianza de la interfaz de control también pueden recibir metadatos opcionales sobre los tiempos de confirmación para diagnósticos locales.
    - Las cargas del chat admiten imágenes y archivos que no sean de vídeo. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como contenido multimedia administrado y aparecen en el historial como enlaces a archivos adjuntos.
    - Volver a enviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` después de finalizar.
    - Las respuestas de `chat.history` tienen un tamaño limitado para proteger la interfaz de usuario. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar los campos de texto extensos, omitir bloques de metadatos pesados y sustituir los mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se ha truncado en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de la transcripción normalizada para su visualización mediante `chat.message.get`, usando `sessionKey`, el `agentId` activo cuando sea necesario y el `messageId` de la transcripción. Si el Gateway sigue sin poder devolver más contenido, el lector muestra un estado explícito de indisponibilidad en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas o del asistente se conservan como referencias a contenido multimedia administrado y se vuelven a servir mediante URL de contenido multimedia autenticadas del Gateway, por lo que las recargas no dependen de que las cargas de imágenes base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al renderizar `chat.history`, la interfaz de control elimina del texto visible del asistente las etiquetas de directivas insertadas que solo sirven para la visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas XML de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y los bloques de llamadas a herramientas truncados) y los tokens de control del modelo ASCII o de ancho completo filtrados. Omite las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista del chat mantiene visibles los mensajes locales provisionales del usuario y del asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica sustituye esos mensajes locales cuando el historial del Gateway se pone al día.
    - Los eventos `chat` en directo representan el estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción persistente de la sesión. Después de los eventos finales de las herramientas, la interfaz de control vuelve a cargar el historial y combina únicamente una pequeña cola provisional; el límite de la transcripción se documenta en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones exclusivas de la interfaz de usuario (sin ejecución del agente ni entrega al canal).
    - La barra lateral enumera todas las sesiones activas cargadas por sección de agente y en los grupos de fijadas, canal, trabajo, personalizados y Chats, con una única acción New Session que abre el diálogo de borrador. Abrir una fila visible solo desplaza el resaltado. Las sesiones pueden soltarse en Pinned para fijarlas o en un grupo personalizado o en Chats para moverlas; los grupos personalizados se pueden contraer y reordenar mediante arrastre, sus nombres y orden se sincronizan mediante el Gateway y el estado contraído permanece en el navegador. Una nueva sesión del panel obtiene de forma asíncrona un título breve generado a partir de su primer mensaje que no sea un comando; los nombres explícitos nunca se sustituyen. Configure `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para dirigir esta llamada independiente al modelo hacia un modelo de menor coste. Expandir la sección de otro agente permite explorar las sesiones de ese agente sin salir del chat abierto.
    - La búsqueda de hilos se encuentra en la paleta de comandos (⌘K o el campo Search de la parte superior de la barra lateral): al escribir una consulta, se recorre un número limitado de páginas coincidentes entre los agentes, se filtran las filas internas secundarias y de Cron y se enumeran las coincidencias visibles junto a los comandos de navegación. La página Threads conserva la lista completa con funciones de búsqueda y filtros.
    - Cada fila de la barra lateral conserva acceso directo para fijarla, además de un menú contextual completo para el estado de lectura, el cambio de nombre, la bifurcación, la agrupación, el archivado y la eliminación. Las filas seleccionadas de forma múltiple (Cmd/Ctrl-clic y Mayús-clic para seleccionar intervalos) disponen de un menú de acciones por lotes que incluye el estado de lectura, la agrupación, el archivado y la eliminación; el archivado y la eliminación por lotes permanecen deshabilitados salvo que todas las sesiones seleccionadas se puedan archivar. No se pueden archivar una ejecución activa ni la sesión principal de un agente. Al archivar o eliminar la sesión seleccionada actualmente, Chat vuelve a la sesión principal de ese agente.
    - En la aplicación para macOS, la marca de OpenClaw utiliza la franja de la barra de título nativa, que de otro modo estaría vacía, situada junto a los controles de la ventana, en lugar de ocupar una fila de la barra lateral.
    - En anchuras de escritorio, los controles del chat permanecen en una sola fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al principio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados que solo contienen texto se renderizan como una única burbuja con una insignia de cantidad. Los mensajes que contienen imágenes, archivos adjuntos, resultados de herramientas o vistas previas del lienzo no se contraen.
    - Las burbujas de mensajes del usuario incluyen acciones de transcripción: un botón para retroceder que aparece al pasar el cursor (un cuadro emergente de confirmación con la opción "Don't ask again"), además de **Retroceder hasta aquí** y **Bifurcar desde aquí** al hacer clic con el botón derecho. Retroceder redirige la sesión al estado inmediatamente anterior a ese mensaje y devuelve su texto al editor para modificarlo y volver a enviarlo (`sessions.rewind`, `operator.admin`); bifurcar crea una sesión nueva a partir del prefijo de la ruta activa anterior al mensaje, la abre y rellena su editor con el mismo texto (`sessions.fork`, `operator.write`). Ambas acciones se deshabilitan con una descripción emergente explicativa mientras el agente está trabajando, se aplican únicamente a mensajes persistentes del usuario y se rechazan en sesiones cuya conversación pertenece a un entorno externo de agentes. Retroceder solo desplaza el contexto del chat: los archivos y otros efectos secundarios de las herramientas no se revierten, y la transcripción anterior al retroceso se conserva en el almacén de sesiones de solo anexado. Cuando ese almacén contiene varias ramas de la transcripción, la barra de título del chat muestra un menú de ramas con el mensaje más reciente, la cantidad de mensajes y la antigüedad de cada rama; al seleccionar una rama inactiva, la sesión actual vuelve a esa ruta conservada (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). El cambio de rama tampoco está disponible mientras el agente está trabajando, y seleccionar la rama ya activa produce un error tipado de operación nula en el límite RPC. La acción independiente para ocultar en las burbujas del usuario oculta un mensaje únicamente en el navegador actual; el mensaje permanece en la transcripción y el agente sigue viéndolo.
    - Cuando el repositorio de trabajo de una sesión se encuentra en una rama no predeterminada de un repositorio de GitHub, la vista del chat fija indicadores de pull requests encima del editor: número del PR, repositorio, rama, recuentos del diff, un indicador de CI y el estado de borrador, fusionado o cerrado, cada uno con un enlace al PR. La fila muestra como máximo dos indicadores —primero los PR activos (abiertos o en borrador)— y un botón "Show more" revela el historial contraído de PR fusionados o cerrados. El indicador de CI abre un pequeño cuadro emergente de supervisión de CI con el número de comprobaciones aprobadas, fallidas, en ejecución y omitidas, y un enlace a la página de comprobaciones del PR. La detección se ejecuta en el servidor mediante `controlUi.sessionPullRequests`, que reutiliza los valores `GH_TOKEN`/`GITHUB_TOKEN` del Gateway cuando están configurados. Cuando se alcanza el límite de frecuencia de la API de GitHub, los indicadores conservan el último estado conocido y muestran una advertencia de que podría estar desactualizado; al descartar un indicador, este se oculta para esa sesión en el perfil actual del navegador. Antes de que exista cualquier PR, la fila muestra la propia rama: repositorio, nombre de la rama y tamaño +/− del diff respecto a la base de fusión de la rama predeterminada (trabajo confirmado y sin confirmar). Cuando la rama enviada contiene commits que se pueden comparar, la fila añade un botón Create PR que abre la página de nueva pull request de GitHub; antes de eso, una sesión con archivos modificados (confirmados, sin confirmar o sin seguimiento) sigue mostrando la fila, pero sin el botón. La fila se oculta mientras exista un PR abierto o en borrador. La fila de la rama procede únicamente del repositorio git local, por lo que sigue disponible mientras GitHub limita la frecuencia y muestra la misma advertencia de estado desactualizado, ya que no se puede confiar en que "no se encontró ningún PR" hasta que se restablezca el límite.
    - El panel de diferencias de la sesión muestra lo que realmente ha cambiado en el repositorio de trabajo de una sesión: el botón de la rama de la barra del espacio de trabajo o de la barra de título del chat abre el panel de detalles con un diff por archivo del trabajo de la rama, sin confirmar y sin seguimiento respecto a la base de fusión de la rama predeterminada del repositorio de trabajo: punto de estado, flecha de cambio de nombre, recuentos +/− por archivo, archivos contraíbles y marcadores de "N líneas sin modificar" entre fragmentos. Los diffs se calculan en el servidor mediante el método `sessions.diff` del Gateway (ámbito `operator.read`); los archivos binarios y sobredimensionados se reducen a entradas que solo contienen estadísticas, y el botón solo aparece cuando el Gateway conectado anuncia `sessions.diff`.
    - Cada panel de Chat tiene una barra de título. Haga clic en el título de la sesión para cambiarle el nombre; el indicador del espacio de trabajo copia la ruta o la rama del repositorio de trabajo y puede mostrar los espacios de trabajo locales del Gateway en el gestor de archivos del host. Las sesiones remotas y de nodos de ejecución conservan las acciones de copia, pero ocultan la opción para mostrar.
    - La barra del espacio de trabajo del hilo de cada panel de Chat enumera los archivos del hilo, los archivos del proyecto y los artefactos. De forma predeterminada, se acopla al borde derecho del panel; arrastre su encabezado (o use el botón de acoplamiento) para desplazarla a la parte inferior. La elección se almacena en el perfil actual del navegador. Una barra contraída no ocupa ningún espacio: vuelva a abrirla con ⇧⌘B o con el conmutador de archivos de la barra de título, que muestra una insignia con la cantidad de archivos modificados. El panel independiente de detalles de archivos, herramientas y Canvas no se ve afectado.
    - Al hacer clic en una referencia de archivo del chat, una ruta de archivo de una tarjeta expandida de herramienta de lectura, edición o escritura, o una fila de archivo de la barra del espacio de trabajo, se abre el panel de detalles del archivo: una vista de código basada en CodeMirror con resaltado de sintaxis, números de línea, salto a una línea, búsqueda dentro del archivo, acciones de copia y un menú para abrirlo en un editor externo. Cuando el Gateway anuncia `sessions.files.set` a una conexión `operator.admin`, el panel añade un modo Edit con seguimiento de modificaciones y guardado mediante Cmd/Ctrl-S; los borradores sin guardar sobreviven a la navegación entre archivos, paneles y sesiones en la pestaña actual del navegador hasta que se guardan o descartan explícitamente. Los guardados utilizan una operación de comparación e intercambio sobre un hash de contenido devuelto por `sessions.files.get`: si el archivo ha cambiado en el disco desde que se cargó (por ejemplo, porque el agente siguió trabajando), el panel muestra un aviso de conflicto con las acciones Reload (adoptar el contenido más reciente) y Overwrite (conservar la edición local). Las escrituras pasan por las mismas protecciones de seguridad del sistema de archivos del espacio de trabajo que las lecturas: contención de rutas, rechazo de enlaces simbólicos o enlaces físicos y un límite de 256 KB en UTF-8; además, solo sobrescriben archivos existentes. El editor nunca los crea ni elimina.
    - La barra de tareas en segundo plano de cada panel de Chat enumera las tareas en segundo plano y los subagentes del agente actual (`tasks.list` delimitado por agente y actualizado en directo mediante eventos `task`): el trabajo en ejecución muestra un temporizador de tiempo transcurrido en directo, el número de usos de herramientas, la herramienta que se está utilizando y un control para detenerlo; la sección contraíble de tareas finalizadas añade las duraciones de las ejecuciones; y un enlace View transcript abre la sesión secundaria de la tarea en el panel. Ábrala con el conmutador de actividad de la barra de título; la instantánea de tareas se carga de forma anticipada, por lo que muestra una insignia con la cantidad de tareas en ejecución sin necesidad de abrir primero la barra. La página Tasks sigue siendo el registro completo de todos los agentes.
    - La barra del espacio de trabajo, la barra de tareas en segundo plano y el panel de detalles se adaptan al ancho de cada panel, en lugar de al de la ventana: en un panel estrecho o una ventana compacta, ambas barras se presentan como franjas inferiores (los controles de acoplamiento lateral se ocultan hasta que el panel se ensancha; la barra del espacio de trabajo conserva la prioridad sobre la posición lateral cuando solo cabe una columna), y el panel de detalles se apila debajo del hilo con un controlador horizontal para cambiar su tamaño, en lugar de compartir la fila con él. En las áreas de visualización del tamaño de un teléfono, el panel de detalles se sigue abriendo a pantalla completa.
    - Los selectores de modelo y de razonamiento del encabezado del chat actualizan inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío para un solo turno.
    - **Vista dividida:** ábrala desde la barra de título del chat (junto a los controles para alternar la diferencia del hilo, las tareas en segundo plano y los archivos del hilo) y, a continuación, divida el panel activo hacia la derecha o hacia abajo para crear tantos paneles como quepan. Cada panel tiene su propio hilo, transcripción, compositor y flujo de herramientas.
    - Los agentes con la herramienta `screen` pueden solicitar los mismos cambios de panel, barra lateral, terminal, navegador, foco y navegación mientras haya una interfaz de control compatible conectada. El protocolo v1 aplica el comando a todas las interfaces de control compatibles conectadas; consulte [Pantalla](/es/tools/screen).
    - Arrastre una sesión desde la barra lateral hasta el chat para abrirla en un panel. Una vista previa animada del destino se desliza entre las zonas y etiqueta el resultado: «Split» sobre la mitad exacta que ocupará un panel nuevo y «Open here» sobre un panel completo. También se puede soltar desde el modo de panel único.
    - El panel dividido activo determina la selección de la barra lateral y la URL. Su barra de título añade controles para dividirlo y cerrarlo; los separadores permiten cambiar el tamaño de las columnas y los paneles apilados, y el navegador guarda localmente la disposición entre recargas.
    - En pantallas estrechas, la vista dividida conserva la disposición, pero solo muestra el panel activo, incluido su encabezado con el control de cierre.
    - Si se envía un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el compositor espera a que finalice esa actualización de la sesión antes de llamar a `chat.send`, de modo que el envío utilice el modelo seleccionado.
    - Al escribir `/new`, se crea la misma sesión nueva del panel de control que con New Chat y se cambia a ella, excepto cuando `session.dmScope: "main"` está configurado y la sesión superior actual es la sesión principal del agente; en ese caso, la sesión principal se restablece en el mismo lugar. Al escribir `/reset`, se conserva el restablecimiento explícito en el mismo lugar del Gateway para la sesión actual.
    - El selector de modelo del chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.modelPolicy.allow` no está vacío, esa política determina el contenido del selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos específicos de cada proveedor. De lo contrario, el selector muestra las entradas configuradas y los proveedores con autenticación utilizable; los alias y los ajustes de `agents.defaults.models` no lo restringen. El catálogo completo sigue estando disponible mediante la RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de la sesión del Gateway incluyen los tokens de contexto actuales, la barra de herramientas del compositor del chat muestra un pequeño anillo de uso del contexto con el porcentaje utilizado. Abra el anillo para consultar la ventana de contexto actual, los recuentos de tokens de la ejecución más reciente y el coste total estimado, la identidad del proveedor y del modelo, y el desglose más reciente de los costes de entrada, salida y caché de la respuesta del proveedor, cuando se notifique. El anillo cambia al estilo de advertencia cuando la presión del contexto es alta y, al alcanzar los niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de la sesión. Las instantáneas obsoletas de tokens se ocultan hasta que el Gateway vuelve a informar de datos de uso recientes.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en el navegador)">
    El modo de conversación utiliza un proveedor de voz en tiempo real registrado. Configure OpenAI con `talk.realtime.provider: "openai"` más un perfil de clave de API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`. OpenAI Realtime utiliza la API pública de la plataforma y requiere una clave de API de la plataforma; un inicio de sesión OAuth de Codex no satisface esta interfaz. Configure Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor: OpenAI recibe un secreto efímero de cliente de Realtime para WebRTC, y Google Live recibe un token de autenticación restringido y de un solo uso de la API Live para una sesión WebSocket del navegador, con las instrucciones y declaraciones de herramientas fijadas en el token por el Gateway. Los proveedores que solo ofrecen un puente de tiempo real de backend funcionan mediante el transporte de retransmisión del Gateway, por lo que las credenciales y los sockets del proveedor permanecen en el servidor mientras el audio del navegador se transmite mediante RPC autenticadas del Gateway. El prompt de la sesión de Realtime lo compone el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el invocador.

    Los valores predeterminados persistentes del proveedor, modelo, voz, transporte, esfuerzo de razonamiento, umbral exacto de VAD, duración del silencio y relleno de prefijo se encuentran en **Configuración → Comunicaciones → Conversación**; cambiarlos requiere acceso a `operator.admin`. Configurar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; configurar WebRTC mantiene la sesión bajo el control del cliente y produce un error, en lugar de recurrir silenciosamente a la retransmisión, si el proveedor no puede crear una sesión de navegador.

    El control de conversación es el botón del micrófono de la barra de herramientas del cuadro de redacción. Su flecha desplegable muestra **Valor predeterminado del sistema** y todos los micrófonos que el navegador expone, incluidas las entradas USB, Bluetooth y virtuales. El ID del dispositivo seleccionado permanece en el navegador y nunca se envía al Gateway; si ese dispositivo exacto desaparece, el modo de conversación solicita elegir otra entrada en lugar de grabar silenciosamente con un micrófono diferente. Mientras el modo de conversación está activo, el botón del micrófono se convierte en una pastilla que muestra el medidor del nivel de entrada en directo; al hacer clic se detiene la entrada de voz y, al pasar el cursor, aparece el glifo de detención. Los lectores de pantalla anuncian `Connecting voice input...`, `Listening...` o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta el modelo de mayor tamaño configurado mediante `talk.client.toolCall`. Detener una respuesta del agente en curso sigue siendo un control cuadrado **Detener** independiente junto a la pastilla.

    **Conversación por vídeo** está disponible para las sesiones de navegador de OpenAI Realtime WebRTC y Google Live. Haga clic en el botón de la cámara, permita el acceso a la cámara y al micrófono y confirme la vista previa local. OpenAI envía un fotograma JPEG de tamaño limitado mediante su canal de datos del navegador cuando `describe_view` solicita contexto visual. Google Live envía fotogramas JPEG de tamaño limitado directamente desde el navegador al proveedor con el máximo admitido de un fotograma por segundo y responde a las llamadas de función `describe_view` con el estado de la transmisión de la cámara. Los fotogramas de la cámara nunca pasan por el Gateway. Al detener el modo de conversación, se cierra la vista previa y se liberan ambas pistas multimedia. Consulte las [capacidades de la API Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) y la [guía de llamadas a funciones](https://ai.google.dev/gemini-api/docs/live-api/tools) de Google para conocer los contratos de comunicación del proveedor.

    Prueba rápida en vivo para responsables de mantenimiento: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket del backend de OpenAI, el intercambio SDP de WebRTC del navegador de OpenAI, la configuración del navegador de Google Live con token restringido, incluido un fotograma JPEG y una ida y vuelta de la función `describe_view`, y el adaptador de navegador de retransmisión del Gateway con medios de micrófono simulados. El comando solo imprime el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haga clic en **Detener** (invoca `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales utilizan el modo `messages.queue` efectivo del Gateway. `steer` se inyecta en el turno en curso; los demás modos mantienen la entrega en cola persistente del navegador. Si se rechaza la intervención, también se recurre a esa cola. Haga clic en **Intervenir** en un mensaje en cola para inyectarlo manualmente.
    - **Configuración → Apariencia → Chat → Seguimientos mientras el agente está trabajando** puede anular ese valor predeterminado del servidor para el navegador actual. La página marca explícitamente la anulación y ofrece **Restablecer al valor predeterminado del servidor**. `Steer into the active run` envía los seguimientos de inmediato, mientras que `Queue until the run ends` los retiene hasta que finaliza la ejecución.
    - Escriba `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Conservación de contenido parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz.
    - El Gateway conserva en el historial de la transcripción el texto parcial abortado del asistente cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de la transcripción puedan distinguir el contenido parcial abortado de la salida de una finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, la interrupción de la conexión con el Gateway no cierra la sesión. El panel
permanece visible con una pastilla flotante de color ámbar que indica «Se perdió la conexión con el Gateway — Reconectando…» debajo de la barra
superior mientras el cliente vuelve a intentarlo automáticamente con espera incremental (de 800 ms hasta 15 s). Las actualizaciones en directo y
las acciones en tiempo real o de sesión se pausan hasta que se restablece la conexión; **Reintentar ahora** en la pastilla fuerza un
intento inmediato. El chat sigue siendo editable: los envíos normales de texto y archivos adjuntos se conservan en el
almacenamiento del navegador de la pestaña actual, limitado al Gateway y la sesión, se muestran como pendientes de reconexión y se envían
automáticamente cuando vuelve el Gateway. Los controles en directo y los comandos con barra siguen sin estar disponibles mientras
no hay conexión.

Cuando este navegador ya tiene credenciales (un token o una contraseña configurados, o un token de dispositivo
aprobado), al abrir por primera vez y al recargar se muestra una pequeña marca animada de OpenClaw mientras se
establece la conexión, en lugar de mostrar brevemente la pantalla de inicio de sesión. Esta pantalla solo aparece cuando todavía no hay credenciales
almacenadas o cuando el Gateway las rechaza activamente (token o contraseña incorrectos, emparejamiento revocado);
estos estados requieren intervención en lugar de esperar.

## Instalación como PWA y Web Push

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como PWA independiente. Web Push permite que el Gateway active la PWA instalada mediante notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Dentro de la aplicación de macOS, la página de configuración de notificaciones muestra el permiso de notificaciones nativo de la aplicación en lugar de las notificaciones push del navegador, ya que la aplicación entrega las notificaciones de forma nativa.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelva a abrir el panel con `openclaw dashboard` y realice una recarga completa. Si el problema persiste, borre los datos del sitio del origen del panel o haga una prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador pueden seguir ejecutando un paquete de la interfaz de control anterior a la actualización contra el Gateway más reciente.

| Superficie                                         | Función                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | Manifiesto de la PWA. Los navegadores ofrecen «Instalar aplicación» cuando está accesible. |
| `ui/public/sw.js`                                  | Service worker que gestiona los eventos `push` y los clics en las notificaciones. |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Par de claves VAPID generado automáticamente que se utiliza para firmar las cargas útiles de Web Push. |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Endpoints, claves y marcas de tiempo de registro de las suscripciones del navegador conservados. |

Las actualizaciones desde los almacenes retirados `push/vapid-keys.json` y `push/web-push-subscriptions.json` se importan mediante `openclaw doctor --fix`. Detenga el Gateway antes de ejecutar esa reparación para que un proceso anterior no pueda volver a crear el estado retirado durante la importación. Ejecute la reparación antes de usar Web Push después de una actualización; el registro, la entrega, la eliminación y la resolución de claves se niegan a continuar mientras permanezca alguna fuente retirada o una reclamación interrumpida de Doctor. El entorno de ejecución del Gateway solo lee y escribe SQLite.

Anule el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando sea necesario fijar las claves (implementaciones en varios hosts, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (el valor predeterminado es `https://openclaw.ai`)

La interfaz de control utiliza estos métodos del Gateway limitados por ámbito para registrar y probar las suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` junto con `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del invocador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulte [Configuración](/es/gateway/configuration) para conocer las notificaciones push respaldadas por retransmisión) y del método `push.test`, que se dirige al emparejamiento móvil nativo.
</Note>

## Contenido alojado incrustado

Los mensajes del asistente pueden representar contenido web alojado en línea mediante el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

La herramienta principal [`show_widget`](/es/tools/show-widget) representa SVG o HTML autocontenido directamente desde una llamada de herramienta. El navegador y los clientes de chat nativos compatibles anuncian la capacidad `inline-widgets` del Gateway, y el documento de Canvas resultante permanece disponible cuando se vuelve a cargar el historial del chat. Las actividades de Discord proporcionan el mismo nombre de herramienta en Discord; las ejecuciones originadas en otros canales no la reciben.

<Tabs>
  <Tab title="estricto">
    Deshabilita la ejecución de scripts dentro del contenido alojado incrustado.
  </Tab>
  <Tab title="scripts (predeterminado)">
    Permite contenido incrustado interactivo mientras mantiene el aislamiento del origen; suele ser suficiente para juegos y widgets autocontenidos del navegador.
  </Tab>
  <Tab title="de confianza">
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

## Anchura de los mensajes del chat

La transcripción del chat utiliza un marco centrado y legible alineado con el cuadro de redacción. La salida del asistente y de las herramientas permanece alineada a la izquierda, mientras que las burbujas del usuario se mantienen alineadas a la derecha dentro del marco. Las implementaciones en monitores anchos pueden anular la anchura de la transcripción sin modificar el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los formatos admitidos incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de anchura restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso a Tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenga el Gateway en la interfaz de bucle invertido y permita que Tailscale Serve actúe como proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra `https://<magicdns>/` (o el `gateway.controlUi.basePath` configurado).

    De forma predeterminada, las solicitudes de Serve de la interfaz de control/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo los acepta cuando la solicitud llega a la interfaz de bucle invertido con los encabezados `x-forwarded-*` de Serve de Tailscale. Para las sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite el proceso de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de Node siguen sometiéndose a las comprobaciones normales del dispositivo. Establezca `gateway.auth.allowTailscale: false` si desea exigir credenciales explícitas de secreto compartido incluso para el tráfico de Serve y, a continuación, use `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos de la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de escribir los límites de frecuencia. Por tanto, los reintentos incorrectos simultáneos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud, en lugar de que dos discrepancias simples compitan en paralelo.

    <Warning>
    La autenticación de Serve sin token presupone que el host del Gateway es de confianza. Si puede ejecutarse código local no fiable en ese host, exija autenticación mediante token o contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abra `http://<tailscale-ip>:18789/` (o su `gateway.controlUi.basePath` configurado).

    Pegue el secreto compartido correspondiente en la configuración de la interfaz (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP no seguro

Si abre el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP no seguro solo para localhost mediante `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta del operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** use HTTPS (Serve de Tailscale) o abra la interfaz localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del Gateway).

<AccordionGroup>
  <Accordion title="Comportamiento de la opción de autenticación no segura">
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

    - Permite que las sesiones de la interfaz de control en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No flexibiliza los requisitos de identidad de dispositivo para conexiones remotas (que no sean localhost).

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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la interfaz de control y supone una degradación grave de la seguridad. Reviértalo rápidamente tras su uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxies de confianza">
    - Una autenticación correcta mediante un proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se aplica a las sesiones de la interfaz de control con rol de Node.
    - Los proxies inversos de bucle invertido en el mismo host siguen sin cumplir los requisitos de autenticación mediante proxy de confianza; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/es/gateway/tailscale) para obtener instrucciones de configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control incluye una política `img-src` estricta: solo se permiten recursos del **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes `http(s)` remotas y relativas al protocolo, y nunca realiza solicitudes de red para ellas.

En la práctica:

- Los avatares y las imágenes servidos mediante rutas relativas (por ejemplo, `/avatars/<id>`) siguen mostrándose, incluidas las rutas de avatares autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen mostrándose.
- Las URL `blob:` locales creadas por la interfaz de control siguen mostrándose.
- El Gateway obtiene de GitHub los avatares de las vistas previas de enlaces de GitHub mediante su host fijo de avatares y los devuelve como URL `data:` delimitadas; el navegador del operador nunca se comunica con el host remoto de avatares.
- Las URL remotas de avatares emitidas por los metadatos de los canales se eliminan en los auxiliares de avatares de la interfaz de control y se sustituyen por el logotipo o distintivo integrado, de modo que un canal vulnerado o malicioso no pueda forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

Esta función está siempre activa y no puede configurarse.

## Autenticación de la ruta de avatares

Cuando se configura la autenticación del Gateway, el endpoint de avatares de la interfaz de control requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar únicamente a quienes realizan solicitudes autenticadas. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar conforme a la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (al igual que en la ruta hermana de contenido multimedia del asistente), por lo que la ruta de avatares no puede revelar la identidad del agente en hosts que, por lo demás, están protegidos.
- La interfaz de control reenvía el token del Gateway como encabezado de portador al obtener avatares y usa URL de blobs autenticadas para que la imagen continúe mostrándose en los paneles.

Si desactiva la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatares también deja de requerir autenticación, de acuerdo con el resto del Gateway.

## Autenticación de la ruta de contenido multimedia del asistente

Cuando se configura la autenticación del Gateway, las vistas previas de contenido multimedia local del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la interfaz de control; el navegador envía el token del Gateway como encabezado de portador al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, vídeo y documentos que muestra el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la compatibilidad de la representación del contenido multimedia con los elementos multimedia nativos del navegador sin incluir credenciales reutilizables del Gateway en URL de contenido multimedia visibles.

## Enlaces de aprobación

Las notificaciones de aprobación del operador pueden incluir enlaces directos a un documento de aprobación independiente servido bajo el espacio de nombres reservado `${controlUiBasePath}/approve/{approvalId}` (por ejemplo, `/approve/<approvalId>`, o `/openclaw/approve/<approvalId>` con una ruta base configurada). La URL permanece estable durante la vigencia de la aprobación y puede reenviarse de forma segura entre sus propios dispositivos: identifica la aprobación, pero nunca la autoriza.

- El espacio de nombres de un segmento `/approve/<approvalId>` está reservado por el Gateway antes que las rutas HTTP de los plugins para **todos** los métodos HTTP, por lo que una ruta de Plugin nunca puede ocultar ni interceptar un documento de aprobación.
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

A continuación, dirija la interfaz a la URL WS de su Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de la interfaz de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, es posible que una extensión o un script de contenido ejecutado al principio haya impedido que la aplicación de módulos JavaScript se evaluara. La página estática incluye un panel de recuperación en HTML básico que aparece cuando `<openclaw-app>` no se registra tras el inicio.

Use la acción **Volver a intentarlo** del panel después de cambiar el entorno del navegador, o recargue manualmente tras realizar estas comprobaciones:

- Desactive las extensiones que se insertan en todas las páginas, especialmente las extensiones con scripts de contenido `<all_urls>`.
- Pruebe una ventana privada, un perfil limpio del navegador u otro navegador.
- Mantenga el Gateway en ejecución y verifique la misma URL del panel después de cambiar el navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La interfaz de control consta de archivos estáticos; el destino de WebSocket es configurable y puede ser diferente del origen HTTP. Esto resulta útil cuando se desea ejecutar localmente el servidor de desarrollo de Vite, pero el Gateway se ejecuta en otro lugar.

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
    - Si pasa un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifique el valor como URL para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de la URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones mediante los registros de solicitudes y Referer. Los parámetros de consulta `?token=` heredados todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se conserva únicamente en memoria.
    - Cuando se establece `gatewayUrl`, la interfaz no recurre a las credenciales de configuración ni del entorno. Proporcione `token` (o `password`) explícitamente; la ausencia de credenciales explícitas es un error.
    - Use `wss://` cuando el Gateway esté detrás de TLS (Serve de Tailscale, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para impedir el secuestro de clics.
    - Las implementaciones públicas de la interfaz de control fuera de la interfaz de bucle invertido deben establecer `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas del mismo origen en LAN/Tailnet desde la interfaz de bucle invertido, RFC1918/enlace local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
    - El inicio del Gateway puede definir orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir de la vinculación y el puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No use `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen de navegador, no «coincidir con cualquier host que esté usando».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo alternativo de origen basado en el encabezado Host, pero es un modo de seguridad peligroso.

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

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
