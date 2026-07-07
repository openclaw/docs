---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-06T21:52:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: faa16914b33348ae5bc194936453ce822d740c6369e005c1a16c0de399ed45a5
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

<Note>
En vinculaciones LAN nativas de Windows, el Firewall de Windows o la Directiva de grupo gestionada por la organización todavía pueden bloquear la URL LAN anunciada incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecuta `openclaw gateway status --deep` en el host de Windows; informa puertos probablemente bloqueados, discrepancias de perfil y reglas de firewall locales que la política puede ignorar.
</Note>

La autenticación se suministra durante el protocolo de enlace del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de ajustes del panel de control mantiene un token para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada; las contraseñas no se persisten. La incorporación normalmente genera un token de gateway para autenticación de secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Conectarse desde un navegador o dispositivo nuevo normalmente requiere una **aprobación de emparejamiento de un solo uso**, mostrada como `disconnected (1008): pairing required`.

<Steps>
  <Step title="Listar solicitudes pendientes">
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

Si el navegador reintenta el emparejamiento con detalles de autenticación cambiados (rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`; vuelve a ejecutar `openclaw devices list` antes de aprobar.

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura/administración se trata como una actualización de aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide aprobar explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para rotación de tokens, revocación y el flujo de aprobación de primera ejecución de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas del navegador por local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el recorrido de emparejamiento para sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo. Los navegadores sin dispositivo y las conexiones con rol de nodo siguen usando las comprobaciones normales de dispositivo.
- Las vinculaciones directas de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo todavía requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requiere volver a emparejar.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión iOS/Android sin abrir una terminal:

<Steps>
  <Step title="Abrir emparejamiento móvil">
    Selecciona **Nodos** y luego haz clic en **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.
  </Step>
  <Step title="Conectar el teléfono">
    En la aplicación móvil de OpenClaw, abre **Configuración** → **Gateway** y escanea el código QR. También puedes copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La aplicación oficial de iOS/Android se conecta automáticamente. Si **Dispositivos** muestra una solicitud pendiente, revisa su rol y alcances antes de aprobarla.
  </Step>
</Steps>

Crear un código de configuración requiere `operator.admin`; el botón se deshabilita para sesiones que no lo tengan. Un código de configuración contiene una credencial de arranque de corta duración, así que trata el QR y el código copiado como una contraseña mientras sean válidos. Para emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin cifrar se limita a local loopback y direcciones LAN privadas. Consulta [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para ver todos los detalles de seguridad y respaldo.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes, para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, limitada al perfil de navegador actual, y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

La anulación del avatar del asistente sigue el mismo patrón local del navegador: las anulaciones cargadas se superponen localmente a la identidad resuelta por el gateway y nunca hacen ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes que no sean de la interfaz de usuario y escriban el campo directamente.

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene sus ajustes en tiempo de ejecución desde `/control-ui-config.json`, resuelto en relación con la ruta base de la interfaz de control del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación de gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abre **Configuración** en la vista Simple para ver la tarjeta **Host del Gateway** con la máquina del Gateway, dirección LAN, sistema operativo, runtime, tiempo de actividad, carga de CPU, memoria y espacio en disco del volumen de estado. La tarjeta se actualiza cada 10 segundos mientras está visible mediante el RPC de Gateway `system.info`, que requiere el alcance `operator.read`. Los Gateways antiguos y las conexiones sin ese alcance omiten la tarjeta.

## Compatibilidad de idiomas

La interfaz de control se localiza automáticamente en la primera carga según la configuración regional de tu navegador. Para reemplazarla más adelante, abre **Resumen -> Acceso al Gateway -> Idioma** (el selector está en la tarjeta Acceso al Gateway, no en Apariencia).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones que no son al inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes vuelven al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales no inglesas, pero el selector de idioma integrado del sitio de documentación de Mintlify solo enumera los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) todavía se genera en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia tiene los temas integrados Claw, Knot y Dash (Claw es el predeterminado), además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre el [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL de editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil de navegador actual; no se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo vuelve a Claw si el tema importado estaba activo.

Apariencia también tiene un ajuste local del navegador de tamaño de texto, almacenado con el resto de las preferencias de la interfaz de control. Se aplica al texto del chat, el texto del compositor, las tarjetas de herramientas y las barras laterales de chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automático al enfocar.

## Navegación de la barra lateral

La barra lateral fija la navegación encima de una lista desplazable de sesiones recientes dividida en **Fijadas**, una sección por cada grupo personalizado (la `category` de la sesión, ordenada alfabéticamente) y **Sin agrupar** para el resto. Cada sesión fijada permanece visible, mientras que las sesiones no fijadas mantienen un presupuesto reciente independiente de nueve elementos. Abrir una sesión visible mueve el resaltado de selección sin reordenar las filas; un enlace profundo fuera de la lista aparece en la parte superior. Las sesiones con actividad nueva desde su última lectura muestran un punto de no leído, y abrir una la marca como leída. Cada fila de sesión tiene un menú contextual (botón de tres puntos verticales o clic derecho) con Fijar/Desfijar, Marcar como no leída/leída, Renombrar, Bifurcar, Mover a grupo (incluidos Nuevo grupo y Quitar del grupo), Archivar y Eliminar; los diseños táctiles mantienen visibles los controles directos de fijar y menú. Las configuraciones multiagente muestran un control de alcance compacto en el encabezado Sin agrupar. **Resumen** es el único destino fijado de forma predeterminada; expande **Más** para llegar a todos los demás destinos. Selecciona **Personalizar barra lateral** en Más, o haz clic derecho en el área de navegación, para fijar o desfijar destinos y restaurar los valores predeterminados. El conjunto fijado y el estado de expansión de Más se almacenan en el perfil de navegador actual y sobreviven a las recargas.

El pie compacto mantiene juntos el estado de conexión, **Configuración**, **Documentación**, el emparejamiento móvil y el conmutador para contraer la barra lateral. Al contraer, la barra lateral se reduce a una barra de iconos con el botón de expandir en la parte superior de la pila del pie. En puntos de corte de cajón, el botón de menú de la barra superior reemplaza ese control.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje, para que las sesiones grandes no obliguen al navegador a renderizar una carga completa de transcripción antes de que el chat sea utilizable.
    - Al pasar el cursor o enfocar con el teclado un enlace público de incidencia o solicitud de extracción de GitHub, se muestra su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché metadatos públicos sin cambiar el destino del enlace, incluso cuando la interfaz de usuario usa un Gateway remoto. El Gateway usa `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, después de confirmar que el repositorio es público; de lo contrario, usa la API anónima de GitHub con una caché más larga.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso mediante WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente empiezan con `talk.client.create`; las sesiones de retransmisión del Gateway empiezan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas de herramienta del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo de OpenClaw configurado más grande, y enruta la dirección por voz de ejecuciones activas mediante `talk.client.steer` o `talk.session.steer`.
    - Transmite llamadas de herramientas y tarjetas de salida de herramientas en vivo en Chat (eventos de agente).
    - Pestaña de actividad con resúmenes locales del navegador, con redacción primero, de la actividad de herramientas en vivo desde la entrega existente de eventos `session.tool` / herramienta.

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de Plugin incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas de proveedores, y etiquetan las instantáneas parciales cuando un sondeo o una auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia y actualización (`system-presence`).
    - Sesiones: lista de sesiones de agentes configurados de forma predeterminada, fijar sesiones frecuentes, renombrarlas, archivar o restaurar sesiones inactivas, recurrir desde claves obsoletas de sesiones de agentes no configurados y aplicar anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan por encima de las sesiones recientes no fijadas; las sesiones archivadas viven en la vista archivada de la página Sesiones y conservan sus transcripciones. Las filas muestran un punto de no leído para las sesiones con actividad desde su última lectura, con acciones de marcar como no leído/marcar como leído (`sessions.patch { unread }`) y una acción Bifurcar que ramifica la transcripción en una nueva sesión (`sessions.create { parentSessionKey, fork: true }`).
    - Agrupación de sesiones: un control Agrupar por organiza la tabla de sesiones en secciones por grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados persisten por sesión mediante `sessions.patch` (`category`), por lo que las sesiones iniciadas desde canales de mensajería (Discord, Telegram, WhatsApp, ...) también pueden categorizarse; asigna grupos arrastrando filas a una sección, o con el selector de grupo por fila, y crea grupos con la acción Nuevo grupo.
    - Sueños: estado de Dreaming, conmutador de activar/desactivar y lector de Diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, tareas, Skills, nodos, aprobaciones de exec">
    - Trabajos Cron: listar/añadir/editar/ejecutar/activar/desactivar más historial de ejecuciones (`cron.*`).
    - Tareas: registro en vivo de tareas en segundo plano activas y recientes con sesiones vinculadas y cancelación (`tasks.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: lista más capacidades (`node.list`), crear códigos de configuración móvil y aprobar emparejamiento de dispositivos (`device.pair.*`).
    - Aprobaciones de exec: editar listas de permitidos de Gateway o nodo y política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtros/paralelismo, comandos comunes de operador y el editor de configuración `mcp` con ámbito.
    - Aplicar y reiniciar con validación (`config.apply`), luego despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución activa de SecretRef para las refs en la carga de configuración enviada; las refs enviadas activas no resueltas se rechazan antes de escribir.
    - Los guardados de formulario descartan marcadores de posición redactados obsoletos que no pueden restaurarse desde la configuración guardada, mientras conservan los valores redactados que aún se asignan a secretos guardados.
    - El esquema y la renderización de formularios provienen de `config.schema` / `config.schema.lookup`, incluidos `title`/`description` de campo, sugerencias de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición, más esquemas de Plugin y canal cuando están disponibles. El editor JSON sin procesar solo está disponible cuando la instantánea tiene una ida y vuelta sin procesar segura; de lo contrario, Control UI fuerza el modo Formulario.
    - El editor JSON sin procesar "Restablecer a guardado" conserva la forma escrita en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, de modo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer la ida y vuelta de forma segura.
    - Los valores de objeto SecretRef estructurados se renderizan como de solo lectura en entradas de texto de formulario, para evitar corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens derivados de sesiones y de coste estimado permanece separado de la facturación del proveedor.
    - Las tarjetas de proveedor llaman a `usage.status` y muestran nombres de planes en vivo, ventanas de cuota, saldos, gasto y presupuestos informados por los plugins de proveedor configurados.
    - Un fallo de uso de proveedor no bloquea el panel de sesión/coste; las tarjetas de proveedor no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de Control UI, tiempos de renderización lenta de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada PerformanceObserver.
    - Registros: seguimiento en vivo de registros de archivo de Gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git más reinicio (`update.run`) con un informe de reinicio, luego sondear `update.status` tras reconectar para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega predeterminada es anunciar resumen; cambia a ninguno para ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, los modos de entrega webhook y ninguno están disponibles.
    - Los controles de edición avanzada incluyen eliminar tras ejecutar, borrar anulación de agente, opciones cron exactas/escalonadas, anulaciones de modelo/thinking de agente y conmutadores de entrega de mejor esfuerzo.
    - La validación de formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - `cron.webhook` es una alternativa heredada obsoleta: ejecuta `openclaw doctor --fix` para migrar trabajos almacenados que aún usan `notify: true` a webhook explícito por trabajo o entrega de finalización.

  </Accordion>
</AccordionGroup>

## Página MCP

La página MCP dedicada es una vista de operador para servidores MCP gestionados por OpenClaw bajo `mcp.servers`. No inicia transportes MCP por sí sola; úsala para inspeccionar y editar la configuración guardada, y luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Comprueba las tarjetas de resumen para los recuentos total, habilitados, OAuth y de servidores filtrados.
3. Revisa cada fila de servidor para transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Alterna la habilitación cuando un servidor deba permanecer configurado pero quedar fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con ámbito para definiciones de servidor, encabezados, rutas TLS/mTLS, metadatos de OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para una escritura de configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración cambiada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde una terminal para diagnósticos estáticos, prueba en vivo o descarte de runtime en caché.

La página redacta valores similares a URL que contienen credenciales antes de renderizarlos y cita nombres de servidor en fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. Referencia completa de CLI y configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para la actividad de herramientas en vivo, derivado del mismo flujo de eventos de Gateway `session.tool` / herramienta que impulsa las tarjetas de herramientas de Chat. No añade otra familia de eventos de Gateway, endpoint, almacén de actividad duradero, feed de métricas ni flujo de observador externo.

Las entradas de Actividad conservan solo resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la UI muestra que los argumentos están ocultos y registra solo el recuento de campos de argumentos. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de Control UI y se restablece al recargar la página, cambiar de sesión o usar **Borrar**.

## Terminal de operador

La terminal de operador acoplable está deshabilitada de forma predeterminada. Para habilitarla, establece `gateway.terminal.enabled: true` y reinicia el Gateway. La terminal requiere una conexión `operator.admin` y abre un PTY de host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
La terminal es un shell de host sin confinamiento y hereda el entorno del proceso Gateway. Habilítala solo para despliegues de operador de confianza. OpenClaw rechaza sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Usa **Ctrl + acento grave** para alternar el acoplamiento. El diseño admite acoplamiento inferior y derecho, cambia de tamaño con el viewport del navegador y mantiene varias pestañas de shell. Consulta [Configuración de Gateway](/es/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Las sesiones sobreviven a desconexiones: una recarga de página, suspensión del portátil o corte de red desacopla la sesión en el Gateway en lugar de terminarla, y la misma pestaña del navegador se vuelve a adjuntar al reconectar con salida reciente reproducida. Las sesiones desacopladas se terminan después de `gateway.terminal.detachedSessionTimeoutSeconds` (predeterminado 300 segundos; `0` restaura terminar al desconectar). `terminal.list` muestra sesiones adjuntables, `terminal.attach` adopta una (toma de control al estilo tmux), y `terminal.text` lee la salida reciente de una sesión como texto plano sin adjuntarse - una prestación para agentes/herramientas.

La terminal también está disponible como documento de pantalla completa solo de terminal en `/?view=terminal`. Las apps iOS y Android incrustan esta página en sus pantallas Terminal, reutilizando las credenciales de gateway almacenadas; la disponibilidad sigue la misma puerta `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece la terminal.

## Comportamiento de chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de confianza de Control UI también pueden recibir metadatos opcionales de temporización de ACK para diagnósticos locales.
    - Las cargas de chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño para proteger la UI. Cuando las entradas de la transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se truncó en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de la transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, el `agentId` activo cuando sea necesario, y el `messageId` de la transcripción. Si Gateway aún no puede devolver más contenido, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes del asistente/generadas se conservan como referencias de medios administrados y se devuelven mediante URL de medios autenticadas de Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial de chat.
    - Al renderizar `chat.history`, Control UI elimina del texto visible del asistente las etiquetas de directivas en línea solo para visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control de modelo filtrados en ASCII/ancho completo. Omite las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes optimistas locales de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales una vez que el historial de Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción durable de la sesión. Después de eventos finales de herramientas, Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de la transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` agrega una nota del asistente a la transcripción de la sesión y transmite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente ni entrega de canal).
    - La barra lateral lista sesiones recientes por sección fijada/personalizada/sin agrupar, con una acción Nueva sesión y un enlace Todas las sesiones. Las sesiones fijadas siempre permanecen visibles; las sesiones no fijadas mantienen un presupuesto de nueve elementos y un orden de recencia estable, por lo que abrir una fila visible solo mueve el resaltado. Una nueva sesión del panel obtiene de forma asíncrona un título generado conciso a partir de su primer mensaje que no sea un comando; los nombres explícitos nunca se reemplazan. Define `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para enrutar esta llamada de modelo separada a un modelo de menor costo. Cambiar el alcance compacto del agente muestra solo las sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - La búsqueda de sesiones vive en la paleta de comandos (⌘K, o el botón de búsqueda en la barra superior): escribir una consulta sigue un número acotado de páginas coincidentes entre agentes, filtra filas internas hijas/cron, y lista coincidencias visibles junto a comandos de navegación. La página Todas las sesiones mantiene la lista exhaustiva buscable con filtros.
    - Cada fila de la barra lateral mantiene acceso directo para fijar, además de un menú contextual completo para estado no leído, renombrar, bifurcar, agrupar, archivar y eliminar. Una ejecución activa y la sesión principal de un agente no se pueden archivar. Archivar o eliminar la sesión seleccionada actualmente cambia Chat de vuelta a la sesión principal de ese agente.
    - En la app de macOS, la marca de OpenClaw usa la franja de la barra de título nativa que de otro modo estaría vacía junto a los controles de ventana, en lugar de consumir una fila de la barra lateral.
    - En anchos de escritorio, los controles de chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados de solo texto se renderizan como una sola burbuja con una insignia de conteo. Los mensajes que llevan imágenes, adjuntos, salida de herramientas o vistas previas de canvas no se contraen.
    - Los selectores de modelo y razonamiento del encabezado de chat aplican parches inmediatamente a la sesión activa mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
    - **Vista dividida:** ábrela desde los controles del compositor y luego divide cualquier panel a la derecha o hacia abajo para tener tantos paneles como quepan. Cada panel tiene su propia sesión, transcripción, compositor y flujo de herramientas.
    - El panel dividido activo controla la selección de la barra lateral y la URL. Los divisores redimensionan columnas y paneles apilados, y el navegador almacena el diseño localmente entre recargas.
    - En pantallas estrechas, la vista dividida conserva el diseño pero renderiza solo el panel activo; su encabezado de panel aún ofrece controles para cambiar de sesión y cerrar.
    - Si envías un mensaje mientras un cambio del selector de modelo para la misma sesión aún se está guardando, el compositor espera a ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` crea y cambia a la misma sesión nueva de panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; entonces restablece la sesión principal en el mismo lugar. Escribir `/reset` conserva el restablecimiento explícito en el mismo lugar de Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelos configurada de Gateway. Si `agents.defaults.models` está presente, esa lista de permitidos controla el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos con alcance de proveedor. De lo contrario, el selector muestra entradas explícitas `models.providers.*.models` más proveedores con autenticación utilizable. El catálogo completo permanece disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes frescos de uso de sesión de Gateway incluyen tokens de contexto actuales, la barra de herramientas del compositor de chat muestra un pequeño anillo de uso de contexto con el porcentaje usado. Abre el anillo para ver la ventana de contexto actual, los conteos de tokens de la ejecución más reciente y el costo total estimado, la identidad de proveedor/modelo, y el desglose de costo de entrada/salida/caché de la respuesta más reciente del proveedor cuando se informa. El anillo cambia a estilo de advertencia con alta presión de contexto y, en niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas de tokens obsoletas se ocultan hasta que Gateway vuelve a informar uso fresco.

  </Accordion>
  <Accordion title="Modo Talk (tiempo real en navegador)">
    El modo Talk usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de clave de API/OAuth `openai`, un inicio de sesión externo de Codex, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`. Las fuentes configuradas de clave de API tienen prioridad y Codex OAuth es la alternativa automática. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor ni un token OAuth: OpenAI recibe un secreto efímero de cliente Realtime para WebRTC, y Google Live recibe un token de autenticación Live API restringido de un solo uso para una sesión WebSocket de navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por Gateway. Los proveedores que solo exponen un puente realtime de backend se ejecutan mediante el transporte de retransmisión de Gateway, por lo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticados de Gateway. El prompt de la sesión Realtime lo ensambla Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    Los valores predeterminados persistentes de proveedor, modelo, voz, transporte, esfuerzo de razonamiento, umbral VAD exacto, duración del silencio y relleno de prefijo viven en **Configuración → Comunicaciones → Talk**; cambiarlos requiere acceso `operator.admin`. Configurar la retransmisión de Gateway fuerza la ruta de retransmisión de backend; configurar WebRTC mantiene la sesión en propiedad del cliente y falla en lugar de volver silenciosamente a la retransmisión si el proveedor no puede crear una sesión de navegador.

    El control de Talk en sí es el botón de micrófono en la barra de herramientas del compositor. Su caret lista **Predeterminado del sistema** y todos los micrófonos expuestos por el navegador, incluidos USB, Bluetooth y entradas virtuales. El ID del dispositivo seleccionado permanece local del navegador y nunca se envía a Gateway; si ese dispositivo exacto desaparece, Talk te pide elegir otra entrada en lugar de grabar silenciosamente desde un micrófono diferente. Cuando Talk comienza, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Smoke en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC de navegador de OpenAI, la configuración de WebSocket de navegador con token restringido de Google Live, y el adaptador de navegador de retransmisión de Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se encolan. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando una ejecución se aborta, el texto parcial del asistente aún puede mostrarse en la UI.
    - Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripción puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, una conexión caída de Gateway no cierra tu sesión. El panel
permanece visible con un banner ámbar "Conexión con Gateway perdida — reconectando…" mientras el cliente
reintenta automáticamente con backoff (de 800 ms hasta 15 s). Las actualizaciones y acciones en vivo se pausan hasta que la
conexión vuelve; **Reintentar ahora** en el banner fuerza un intento inmediato.

La puerta de inicio de sesión solo aparece cuando aún no hay una sesión establecida (primera apertura, recarga de página
antes de conectar) o cuando Gateway rechaza activamente las credenciales (token/contraseña incorrectos, emparejamiento
revocado), estados que necesitan tu intervención en lugar de esperar.

## Instalación PWA y web push

Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Si la página muestra **Protocol mismatch** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y fuerza una actualización. Si aún falla, borra los datos del sitio para el origen del panel o prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de Control UI anterior a la actualización contra el Gateway más nuevo.

| Superficie                                           | Qué hace                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | Manifiesto PWA. Los navegadores ofrecen "Instalar app" una vez que está accesible. |
| `ui/public/sw.js`                                    | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (en el directorio de estado de OpenClaw) | Par de claves VAPID autogenerado usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                   | Endpoints de suscripción del navegador persistidos.                |

Sobrescribe el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando quieras fijar claves (despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (por defecto `https://openclaw.ai`)

La Control UI usa estos métodos del Gateway limitados por alcance para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Inserciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de las inserciones alojadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite inserciones interactivas mientras mantiene el aislamiento de origen; suele ser suficiente para juegos/widgets de navegador autónomos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` sobre `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más fuertes.
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
Usa `trusted` solo cuando el documento insertado realmente necesite comportamiento de mismo origen. Para la mayoría de los juegos y lienzos interactivos generados por agentes, `scripts` es la opción más segura.
</Warning>

Las URL absolutas externas de inserción `http(s)` permanecen bloqueadas por defecto. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo predeterminado legible. Los despliegues en monitores anchos pueden sobrescribirlo sin parchear el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Las formas admitidas incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso a tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado).

    Por defecto, las solicitudes de Serve de Control UI/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para tráfico Serve, y luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo alcance de autenticación se serializan antes de escribir los límites de tasa. Por eso, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abre `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado).

    Pega el secreto compartido correspondiente en la configuración de la UI (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP plano (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. Por defecto, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del gateway).

<AccordionGroup>
  <Accordion title="Comportamiento del interruptor de autenticación insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es solo un interruptor de compatibilidad local:

    - Permite que las sesiones de Control UI de localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remotos (no localhost).

  </Accordion>
  <Accordion title="Solo emergencia">
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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y es una degradación grave de seguridad. Revierte rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota de proxy de confianza">
    - La autenticación trusted-proxy correcta puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de Control UI con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para orientación de configuración de HTTPS.

## Política de seguridad de contenido

La Control UI incluye una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y nunca emite solicitudes de red.

En la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL en línea `data:image/...` siguen renderizándose.
- Las URL `blob:` locales creadas por la Control UI siguen renderizándose.
- Los avatares de vista previa de enlaces de GitHub los obtiene el Gateway desde el host fijo de avatares de GitHub y se devuelven como URL `data:` acotadas; el navegador del operador nunca contacta con el host remoto de avatares.
- Las URL de avatar remotas emitidas por metadatos de canal se eliminan en los helpers de avatar de la Control UI y se sustituyen por el logotipo/insignia integrados, por lo que un canal comprometido o malicioso no puede forzar cargas arbitrarias de imágenes remotas desde el navegador de un operador.

Esto siempre está activado y no es configurable.

## Autenticación de ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la Control UI exige el mismo token de gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana assistant-media), por lo que la ruta de avatar no puede filtrar la identidad del agente en hosts que por lo demás están protegidos.
- La Control UI reenvía el token del gateway como encabezado bearer al obtener avatares, y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también queda sin autenticación, en línea con el resto del gateway.

## Autenticación de ruta de medios del asistente

Cuando la autenticación del gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige la autenticación normal de operador de Control UI; el navegador envía el token del gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imagen, audio, vídeo y documento renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del gateway. El ticket caduca rápidamente y no puede autorizar un origen distinto.

Esto mantiene el renderizado de medios compatible con elementos multimedia nativos del navegador sin poner credenciales reutilizables del gateway en URL de medios visibles.

## Construir la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`:

```bash
pnpm ui:build
```

Base absoluta opcional (URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página de Control UI en blanco

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la app de módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no está registrado después del inicio.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Desactiva las extensiones que se inyectan en todas las páginas, especialmente extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La Control UI son archivos estáticos; el destino WebSocket es configurable y puede diferir del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo Vite localmente pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Inicia el servidor de desarrollo de la UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abre con gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticación opcional de una sola vez (si es necesario):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` se almacena en localStorage después de cargar y se elimina de la URL.
    - Si pasas un endpoint completo `ws://` o `wss://` mediante `gatewayUrl`, codifica el valor como URL para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita fugas en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la IU no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente; la falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para evitar clickjacking.
    - Los despliegues públicos no loopback de la IU de Control deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas LAN/Tailnet privadas del mismo origen desde loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa por encabezado Host.
    - El inicio del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` desde el enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos aún necesitan entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen de navegador, no "coincidir con el host que estoy usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo alternativo de origen por encabezado Host, pero es un modo de seguridad peligroso.

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

Detalles de configuración de acceso remoto: [Acceso remoto](/es/gateway/remote).

## Relacionado

- [Panel de control](/es/web/dashboard) — panel de control del gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión de estado del gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
