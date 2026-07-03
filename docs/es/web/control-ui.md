---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-03T09:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de página única **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: configura `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

<Note>
En enlaces LAN nativos de Windows, Firewall de Windows o la directiva de grupo administrada por la organización aún pueden bloquear la URL LAN anunciada incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecuta `openclaw gateway status --deep` en el host de Windows; informa puertos probablemente bloqueados, discrepancias de perfil y reglas de firewall locales que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el handshake de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del panel conserva un token para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada; las contraseñas no se persisten. La incorporación normalmente genera un token de gateway para la autenticación con secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la interfaz de control desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para impedir el acceso no autorizado.

**Lo que verás:** "desconectado (1008): se requiere emparejamiento"

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

Si el navegador reintenta el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y cambias su acceso de lectura a acceso de escritura/administrador, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide aprobar explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

Los agentes Paperclip que se conectan mediante el adaptador `openclaw_gateway` usan el mismo flujo de aprobación de primer uso. Después del intento de conexión inicial, ejecuta `openclaw devices approve --latest` para previsualizar la solicitud pendiente y, luego, vuelve a ejecutar el comando impreso `openclaw devices approve <requestId>` para aprobarla. Pasa valores explícitos de `--url` y `--token` para un gateway remoto. Para mantener aprobaciones estables entre reinicios, configura un `adapterConfig.devicePrivateKeyPem` persistente en Paperclip en lugar de dejar que genere una nueva identidad de dispositivo efímera en cada ejecución.

<Note>
- Las conexiones directas del navegador por local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el viaje de ida y vuelta de emparejamiento para sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo aún requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la anulación del avatar del asistente. Los avatares de asistente cargados superponen la identidad resuelta por el gateway solo en el navegador local y nunca realizan ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes que no son de la interfaz y que escriben el campo directamente (como gateways con scripts o paneles personalizados).

## Endpoint de configuración de tiempo de ejecución

La interfaz de control obtiene su configuración de tiempo de ejecución desde `/control-ui-config.json`, resuelto relativo a la ruta base de la interfaz de control del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` cuando la interfaz se sirve bajo `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación de gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o identidad de proxy de confianza.

## Compatibilidad de idioma

La interfaz de control puede localizarse en la primera carga según la configuración regional de tu navegador. Para anularla después, abre **Resumen -> Acceso al Gateway -> Idioma**. El selector de configuración regional vive en la tarjeta de Acceso al Gateway, no bajo Apariencia.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son al inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales que no son inglés, pero el selector de idioma integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) aún se genera en el repositorio de publicación; es posible que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre [editor tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace de tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL de editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Apariencia también incluye una configuración local del navegador de Tamaño del texto. La configuración se almacena con el resto de las preferencias de la interfaz de control, se aplica al texto del chat, al texto del compositor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automático al enfocar.

Los temas importados se almacenan solo en el perfil actual del navegador. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo cambia el tema activo de vuelta a Claw si el tema importado estaba seleccionado.

## Lo que puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje para que las sesiones grandes no obliguen al navegador a renderizar una carga de transcripción completa antes de que el chat sea utilizable.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso por WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo OpenClaw configurado más grande, y enruta la dirección de voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmite llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos de agente).
    - Pestaña Actividad con resúmenes locales del navegador y con redacción primero de la actividad de herramientas en vivo desde la entrega existente de eventos `session.tool` / herramienta.

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins incluidos/externos, inicio de sesión con QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y las instantáneas parciales se etiquetan cuando un sondeo o auditoría excede su presupuesto de interfaz.
    - Instancias: lista de presencia + actualización (`system-presence`).
    - Sesiones: lista sesiones de agentes configurados de forma predeterminada, recurre desde claves obsoletas de sesión de agente no configurado y aplica anulaciones por sesión de modelo/pensamiento/rápido/detallado/traza/razonamiento (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, interruptor de activación/desactivación y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodos, aprobaciones de ejecución">
    - Trabajos Cron: listar/agregar/editar/ejecutar/activar/desactivar + historial de ejecuciones (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: lista + capacidades (`node.list`).
    - Aprobaciones de ejecución: editar listas de permitidos del gateway o nodo + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtro/paralelo, comandos comunes de operador y el editor de configuración `mcp` con alcance.
    - Aplicar + reiniciar con validación (`config.apply`) y despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) hacen una comprobación previa de resolución activa de SecretRef para las referencias en la carga útil de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de escribir.
    - Los guardados de formulario descartan marcadores de posición redactados obsoletos que no pueden restaurarse desde la configuración guardada mientras preservan valores redactados que aún se asignan a secretos guardados.
    - Esquema + renderizado de formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de interfaz coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/arreglo/composición, además de esquemas de plugin + canal cuando estén disponibles); el editor de JSON sin procesar está disponible solo cuando la instantánea tiene una ida y vuelta sin procesar segura.
    - Si una instantánea no puede hacer ida y vuelta segura de texto sin procesar, la interfaz de control fuerza el modo Formulario y deshabilita el modo Sin procesar para esa instantánea.
    - "Restablecer a guardado" del editor de JSON sin procesar conserva la forma escrita sin procesar (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer ida y vuelta de forma segura.
    - Los valores de objeto SecretRef estructurados se renderizan como solo lectura en entradas de texto del formulario para evitar corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de la interfaz de control, tiempos de renderizado lento de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en vivo de registros de archivo del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con un informe de reinicio y, luego, sondear `update.status` después de reconectar para verificar la versión del gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega predeterminada anuncia un resumen. Puedes cambiarla a none si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona announce.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar anulación de agente, opciones de cron exactas/escalonadas, anulaciones de modelo/razonamiento del agente y conmutadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores por campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Fallback obsoleto: ejecuta `openclaw doctor --fix` para migrar trabajos heredados almacenados con `notify: true` de `cron.webhook` a webhook explícito por trabajo o entrega al completar.

  </Accordion>
</AccordionGroup>

## Página MCP

La página dedicada de MCP es una vista de operador para servidores MCP gestionados por OpenClaw bajo `mcp.servers`. No inicia transportes MCP por sí misma; úsala para inspeccionar y editar la configuración guardada, y luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Revisa las tarjetas de resumen para ver los recuentos de servidores totales, habilitados, OAuth y filtrados.
3. Revisa cada fila de servidor para ver transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Activa o desactiva la habilitación cuando un servidor deba permanecer configurado pero quedar fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con alcance para definiciones de servidor, encabezados, rutas TLS/mTLS, metadatos de OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para escribir la configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde una terminal cuando el proceso editado necesite diagnósticos estáticos, prueba en vivo o descarte de tiempo de ejecución en caché.

La página redacta valores con apariencia de URL que contienen credenciales antes de renderizarlos y entrecomilla los nombres de servidores en fragmentos de comando para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. La referencia completa de CLI y configuración está en [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para actividad de herramientas en vivo. Se deriva del mismo flujo de eventos Gateway `session.tool` / herramienta que alimenta las tarjetas de herramientas de Chat; no agrega otra familia de eventos Gateway, endpoint, almacén de actividad duradero, feed de métricas ni flujo de observador externo.

Las entradas de Actividad conservan solo resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la IU muestra que los argumentos están ocultos y registra solo el recuento de campos de argumento. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de la IU de Control y se restablece al recargar la página, cambiar de sesión o pulsar **Borrar**.

## Comportamiento de Chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de la IU de Control de confianza también pueden recibir metadatos opcionales de temporización de ACK para diagnósticos locales.
    - Las cargas de Chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios gestionados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen tamaño acotado para la seguridad de la IU. Cuando las entradas de transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se truncó en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, `agentId` activo cuando sea necesario y `messageId` de transcripción. Si el Gateway sigue sin poder devolver más, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas por el asistente se persisten como referencias de medios gestionados y se sirven de vuelta mediante URL de medios Gateway autenticadas, por lo que las recargas no dependen de que las cargas útiles de imágenes base64 sin procesar permanezcan en la respuesta de historial de chat.
    - Al renderizar `chat.history`, la IU de Control elimina del texto visible del asistente las etiquetas de directivas en línea solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control de modelo ASCII/de ancho completo filtrados, y omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales cuando el historial de Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción duradera de la sesión. Después de eventos finales de herramientas, la IU de Control recarga el historial y fusiona solo una pequeña cola optimista; el límite de transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` agrega una nota de asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de IU (sin ejecución de agente, sin entrega de canal).
    - La barra lateral lista sesiones recientes con una acción Nueva sesión, un enlace Todas las sesiones y un botón de búsqueda de sesiones que abre el selector completo de sesiones (con alcance por el agente seleccionado, búsqueda y paginación). Cambiar de agente muestra solo las sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - En anchos de escritorio, los controles de chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo en la transcripción; al desplazarse hacia arriba, volver al inicio o llegar al final, se restauran los controles.
    - Los mensajes consecutivos duplicados de solo texto se renderizan como una sola burbuja con una insignia de conteo. Los mensajes que incluyen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo no se contraen.
    - Los selectores de modelo y razonamiento del encabezado de chat parchean la sesión activa inmediatamente mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío solo para un turno.
    - Si envías un mensaje mientras un cambio del selector de modelo para la misma sesión aún se está guardando, el compositor espera a ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` en la IU de Control crea y cambia a la misma sesión nueva de panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; en ese caso restablece la sesión principal en el lugar. Escribir `/reset` conserva el restablecimiento explícito en el lugar del Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.models` está presente, esa lista permitida impulsa el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos con alcance de proveedor. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` además de proveedores con autenticación usable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión del Gateway incluyen tokens de contexto actuales, la barra de herramientas del compositor de chat muestra un pequeño anillo de uso de contexto con el porcentaje usado; el detalle completo de tokens está en su tooltip. El anillo cambia a estilo de advertencia con alta presión de contexto y, en niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que el Gateway vuelva a informar uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real del navegador)">
    El modo de conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de autenticación con clave de API `openai`, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`; los perfiles OAuth de OpenAI no configuran voz Realtime. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor. OpenAI recibe un secreto de cliente Realtime efímero para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con instrucciones y declaraciones de herramientas fijadas en el token por el Gateway. Los proveedores que solo exponen un puente de tiempo real de backend se ejecutan mediante el transporte de retransmisión del Gateway, de modo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticados del Gateway. El prompt de sesión Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un botón de opciones de conversación junto al botón de iniciar/detener conversación. Las opciones se aplican a la siguiente sesión de conversación y pueden anular proveedor, transporte, modelo, voz, esfuerzo de razonamiento, umbral de VAD, duración de silencio y relleno de prefijo. Cuando una opción está en blanco, el Gateway usa los valores predeterminados configurados cuando están disponibles o el valor predeterminado del proveedor. Seleccionar retransmisión de Gateway fuerza la ruta de retransmisión de backend; seleccionar WebRTC mantiene la sesión propiedad del cliente y falla en lugar de recurrir silenciosamente a retransmisión si el proveedor no puede crear una sesión de navegador.

    En el compositor de Chat, el control de conversación es el botón de ondas junto al botón de dictado por micrófono. Cuando la conversación empieza, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Smoke en vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC del navegador de OpenAI, la configuración WebSocket del navegador con token restringido de Google Live y el adaptador de navegador de retransmisión del Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se encolan. Haz clic en **Dirigir** en un mensaje encolado para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases independientes de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la IU.
    - Gateway persiste el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas persistidas incluyen metadatos de aborto para que los consumidores de transcripción puedan distinguir parciales abortados de salidas de finalización normales.

  </Accordion>
</AccordionGroup>

## Instalación PWA y web push

La IU de Control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y fuerza la actualización de la página. Si sigue fallando, borra los datos del sitio para el origen del panel o prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de Control UI anterior a la actualización contra el Gateway más reciente.

| Superficie                                            | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto PWA. Los navegadores ofrecen "Instalar app" cuando está accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente para firmar cargas Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador persistidos.                |

Sobrescribe el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (por defecto `https://openclaw.ai`)

La Control UI usa estos métodos del Gateway con ámbito restringido para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método `push.test` existente, que se dirige al emparejamiento móvil nativo.
</Note>

## Embeds alojados

Los mensajes del asistente pueden representar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de embeds alojados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interactivos manteniendo el aislamiento de origen; este es el valor predeterminado y suele bastar para juegos/widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más fuertes.
  </Tab>
</Tabs>

Ejemplo:

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
Usa `trusted` solo cuando el documento embebido necesite realmente comportamiento de mismo origen. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL de embed externas absolutas `http(s)` permanecen bloqueadas por defecto. Si intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de los mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo legible por defecto. Los despliegues en monitores anchos pueden sobrescribirlo sin parchear el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los valores compatibles incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    Por defecto, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para el tráfico Serve. Después usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos incompatibilidades simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Luego abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en la configuración de la UI (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. Por defecto, OpenClaw **bloquea** conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Corrección recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

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

    - Permite que las sesiones localhost de Control UI continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remota (no localhost).

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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y es una degradación grave de seguridad. Revierte rápidamente tras el uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - La autenticación trusted-proxy correcta puede admitir sesiones **operator** de Control UI sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de Control UI con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para orientación de configuración de HTTPS.

## Política de seguridad de contenido

La Control UI se distribuye con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y no emite solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL en línea `data:image/...` siguen renderizándose (útil para cargas dentro del protocolo).
- Las URL `blob:` locales creadas por la Control UI siguen renderizándose.
- Las URL de avatar remotas emitidas por metadatos de canal se eliminan en los helpers de avatar de la Control UI y se reemplazan por el logotipo/insignia integrados, de modo que un canal comprometido o malicioso no puede forzar cargas arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento — siempre está activo y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la Control UI requiere el mismo token de gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que por lo demás están protegidos.
- La propia Control UI reenvía el token de gateway como encabezado bearer al obtener avatares, y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también deja de requerir autenticación, en línea con el resto del gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de Control UI. El navegador envía el token de gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración con ámbito limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, video y documentos renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del gateway. El ticket caduca rápidamente y no puede autorizar un origen distinto.

Esto mantiene la renderización normal de medios compatible con elementos multimedia nativos del navegador sin poner credenciales reutilizables del gateway en URL de medios visibles.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieras URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a tu URL WS del Gateway (p. ej. `ws://127.0.0.1:18789`).

## Página de Control UI en blanco

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la app de módulos JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no se registra tras el arranque.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente tras estas comprobaciones:

- Desactiva extensiones que se inyectan en todas las páginas, especialmente extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La Control UI son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto resulta práctico cuando quieres el servidor de desarrollo Vite localmente pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Iniciar el servidor de desarrollo de la UI">
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
    - Si pasas un endpoint completo `ws://` o `wss://` mediante `gatewayUrl`, codifica para URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como fallback, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la UI no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Las implementaciones públicas no local loopback de Control UI deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas LAN/Tailnet privadas de mismo origen desde local loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar el fallback de encabezado Host.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos aún necesitan entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con cualquier host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de fallback de origen basado en el encabezado Host, pero es un modo de seguridad peligroso.

  </Accordion>
</AccordionGroup>

Ejemplo:

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

- [Dashboard](/es/web/dashboard) — panel del gateway
- [Comprobaciones de estado](/es/gateway/health) — monitoreo del estado del gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
