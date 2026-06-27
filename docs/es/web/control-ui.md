---
read_when:
    - Quiere operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-06-27T13:15:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: configura `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se suministra durante el protocolo de enlace WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del panel de control conserva un token para la sesión de la pestaña actual del navegador y la URL del gateway seleccionada; las contraseñas no se persisten. El onboarding normalmente genera un token de gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la Control UI desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para impedir el acceso no autorizado.

**Lo que verás:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si el navegador reintenta el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administración, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide aprobar explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para rotación y revocación de tokens.

Los agentes Paperclip que se conectan mediante el adaptador `openclaw_gateway` usan el mismo flujo de aprobación de primera ejecución. Después del intento de conexión inicial, ejecuta `openclaw devices approve --latest` para previsualizar la solicitud pendiente y, luego, vuelve a ejecutar el comando `openclaw devices approve <requestId>` mostrado para aprobarla. Pasa valores explícitos de `--url` y `--token` para un gateway remoto. Para mantener las aprobaciones estables entre reinicios, configura un `adapterConfig.devicePrivateKeyPem` persistente en Paperclip en lugar de dejar que genere una nueva identidad de dispositivo efímera en cada ejecución.

<Note>
- Las conexiones directas del navegador mediante local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir la ida y vuelta de emparejamiento para sesiones de operador de la Control UI cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones del navegador en LAN y los perfiles de navegador sin identidad de dispositivo aún requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La Control UI admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se persiste en el servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la sustitución del avatar del asistente. Los avatares del asistente cargados se superponen a la identidad resuelta por el gateway solo en el navegador local y nunca hacen un viaje de ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes no UI que escriben el campo directamente (como gateways con scripts o paneles de control personalizados).

## Endpoint de configuración de runtime

La Control UI obtiene su configuración de runtime desde `/control-ui-config.json`, resuelto en relación con la ruta base de la Control UI del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` cuando la UI se sirve bajo `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Soporte de idioma

La Control UI puede localizarse automáticamente en la primera carga según la configuración regional de tu navegador. Para cambiarla más tarde, abre **Resumen -> Acceso al Gateway -> Idioma**. El selector de configuración regional está en la tarjeta Acceso al Gateway, no en Apariencia.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes vuelven a inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales que no son en inglés, pero el selector de idioma integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) aún se genera en el repositorio de publicación; es posible que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, más un espacio de importación tweakcn local del navegador. Para importar un tema, abre [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace del tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Apariencia también incluye una configuración local del navegador de tamaño de texto. La configuración se almacena con el resto de preferencias de la Control UI, se aplica al texto del chat, al texto del compositor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automático al enfocar.

Los temas importados se almacenan solo en el perfil actual del navegador. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza el único espacio local; borrarlo cambia el tema activo de vuelta a Claw si el tema importado estaba seleccionado.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje para que las sesiones grandes no obliguen al navegador a renderizar una carga útil completa de transcripción antes de que el chat pueda usarse.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso sobre WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo OpenClaw configurado más grande, y enruta la dirección por voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmite llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente).
    - Pestaña de actividad con resúmenes locales del navegador y con redacción primero de la actividad de herramientas en vivo desde la entrega existente de `session.tool` / eventos de herramientas.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canales: estado de canales integrados más canales de plugin incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y las instantáneas parciales se etiquetan cuando un sondeo o una auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia + actualización (`system-presence`).
    - Sesiones: lista sesiones de agentes configurados de forma predeterminada, vuelve desde claves obsoletas de sesiones de agentes no configurados y aplica sustituciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sueños: estado de dreaming, alternador de habilitar/deshabilitar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Trabajos Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`).
    - Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de claves API (`skills.*`).
    - Nodos: listar + capacidades (`node.list`).
    - Aprobaciones de ejecución: editar listas de permitidos del gateway o nodo + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtro/paralelo, comandos comunes de operador y el editor de configuración `mcp` acotado.
    - Aplicar + reiniciar con validación (`config.apply`) y reactivar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para impedir sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) hacen una comprobación previa de la resolución activa de SecretRef para referencias en la carga útil de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de escribir.
    - Los guardados de formularios descartan marcadores de posición redactados obsoletos que no se pueden restaurar desde la configuración guardada, a la vez que conservan valores redactados que aún se asignan a secretos guardados.
    - Renderizado de esquema + formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición, más esquemas de plugin + canal cuando estén disponibles); el editor JSON sin procesar solo está disponible cuando la instantánea tiene una ida y vuelta sin procesar segura.
    - Si una instantánea no puede hacer una ida y vuelta segura de texto sin procesar, la Control UI fuerza el modo Formulario y deshabilita el modo Sin procesar para esa instantánea.
    - El editor JSON sin procesar "Restablecer a guardado" conserva la forma creada como texto sin procesar (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer una ida y vuelta segura.
    - Los valores de objeto SecretRef estructurados se renderizan como solo lectura en entradas de texto de formulario para impedir la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de la Control UI, tiempos lentos de renderizado de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada PerformanceObserver.
    - Registros: seguimiento en vivo de registros de archivo del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reiniciar (`update.run`) con un informe de reinicio y, luego, sondear `update.status` después de reconectar para verificar la versión del gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega predeterminada es anunciar un resumen. Puedes cambiarla a none si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando announce está seleccionado.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar anulación de agente, opciones de cron exactas/escalonadas, anulaciones de modelo/razonamiento del agente y conmutadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos deshabilitan el botón de guardar hasta que se corrijan.
    - Configura `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Fallback obsoleto: ejecuta `openclaw doctor --fix` para migrar trabajos heredados almacenados con `notify: true` desde `cron.webhook` a entrega explícita por webhook por trabajo o por finalización.

  </Accordion>
</AccordionGroup>

## Página MCP

La página MCP dedicada es una vista de operador para servidores MCP administrados por OpenClaw bajo `mcp.servers`. No inicia transportes MCP por sí misma; úsala para inspeccionar y editar la configuración guardada, y luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Revisa las tarjetas de resumen para ver los recuentos de servidores totales, habilitados, OAuth y filtrados.
3. Revisa cada fila de servidor para ver transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Activa o desactiva la habilitación cuando un servidor debe permanecer configurado pero quedar fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con alcance para definiciones de servidores, encabezados, rutas TLS/mTLS, metadatos OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para escribir la configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde una terminal cuando el proceso editado necesite diagnósticos estáticos, prueba en vivo o descarte de runtime en caché.

La página redacta los valores con aspecto de URL que contienen credenciales antes de renderizarlos y cita los nombres de servidor en los fragmentos de comando para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. La referencia completa de CLI y configuración está en [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para actividad de herramientas en vivo. Se deriva del mismo flujo de eventos Gateway `session.tool` / herramienta que alimenta las tarjetas de herramientas de Chat; no agrega otra familia de eventos del Gateway, endpoint, almacén duradero de actividad, feed de métricas ni flujo de observador externo.

Las entradas de actividad solo conservan resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la interfaz muestra que los argumentos están ocultos y registra solo el recuento de campos de argumentos. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de la Control UI y se restablece al recargar la página, cambiar de sesión o pulsar **Borrar**.

## Comportamiento de Chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma de inmediato con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de Control UI confiables también pueden recibir metadatos opcionales de tiempos de ACK para diagnósticos locales.
    - Las cargas de Chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; otros archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño para la seguridad de la interfaz. Cuando las entradas de transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente fue truncado en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, `agentId` activo cuando sea necesario y `messageId` de transcripción. Si el Gateway todavía no puede devolver más, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas por el asistente se persisten como referencias de medios administrados y se sirven de vuelta mediante URL de medios autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial de chat.
    - Al renderizar `chat.history`, la Control UI elimina del texto visible del asistente las etiquetas de directiva en línea solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens filtrados de control de modelo ASCII/de ancho completo, y omite entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes optimistas locales de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción duradera de la sesión. Después de eventos finales de herramienta, la Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de interfaz (sin ejecución de agente, sin entrega de canal).
    - El encabezado de chat muestra el filtro de agente antes del selector de sesión, y el selector de sesión queda limitado al agente seleccionado. Cambiar de agente muestra solo sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando todavía no tiene sesiones de panel guardadas.
    - En anchos de escritorio, los controles de chat permanecen en una sola fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados solo de texto se renderizan como una burbuja con una insignia de recuento. Los mensajes que llevan imágenes, adjuntos, salida de herramientas o vistas previas de lienzo no se contraen.
    - Los selectores de modelo y razonamiento del encabezado de chat parchean la sesión activa inmediatamente mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
    - Si envías un mensaje mientras un cambio del selector de modelo para la misma sesión todavía se está guardando, el compositor espera a que ese parche de sesión termine antes de llamar a `chat.send`, para que el envío use el modelo seleccionado.
    - Escribir `/new` en la Control UI crea y cambia a la misma sesión nueva de panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; en ese caso restablece la sesión principal en el mismo lugar. Escribir `/reset` conserva el restablecimiento explícito en el mismo lugar del Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.models` está presente, esa lista permitida impulsa el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos con alcance de proveedor. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` más proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión del Gateway incluyen tokens de contexto actuales, el área del compositor de chat muestra un indicador compacto de uso de contexto. Cambia a estilo de advertencia bajo alta presión de contexto y, en niveles de Compaction recomendados, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que el Gateway vuelva a informar uso reciente.

  </Accordion>
  <Accordion title="Modo Talk (tiempo real en navegador)">
    El modo Talk usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de autenticación con clave API `openai`, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`; los perfiles OAuth de OpenAI no configuran voz Realtime. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave API estándar de proveedor. OpenAI recibe un secreto de cliente Realtime efímero para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket de navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por el Gateway. Los proveedores que solo exponen un puente realtime de backend se ejecutan mediante el transporte relay del Gateway, de modo que las credenciales y sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticados del Gateway. El prompt de sesión Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un botón de opciones de Talk junto al botón de iniciar/detener Talk. Las opciones se aplican a la siguiente sesión de Talk y pueden anular proveedor, transporte, modelo, voz, esfuerzo de razonamiento, umbral VAD, duración del silencio y relleno de prefijo. Cuando una opción está en blanco, el Gateway usa los valores predeterminados configurados cuando estén disponibles o el valor predeterminado del proveedor. Seleccionar relay del Gateway fuerza la ruta relay de backend; seleccionar WebRTC mantiene la sesión propiedad del cliente y falla en lugar de volver silenciosamente a relay si el proveedor no puede crear una sesión de navegador.

    En el compositor de Chat, el control de Talk es el botón de ondas junto al botón de dictado por micrófono. Cuando Talk inicia, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Smoke en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC de navegador de OpenAI, la configuración WebSocket de navegador con token restringido de Google Live y el adaptador de navegador relay del Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando una ejecución se aborta, el texto parcial del asistente todavía puede mostrarse en la interfaz.
    - Gateway persiste el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas persistidas incluyen metadatos de aborto para que los consumidores de transcripción puedan distinguir parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación PWA y Web Push

La Control UI incluye un `manifest.webmanifest` y un service worker, de modo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y fuerza la actualización de la página. Si todavía falla, borra los datos del sitio para el origen del panel o prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de Control UI anterior a la actualización contra el Gateway más nuevo.

| Superficie                                           | Qué hace                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                     | Manifiesto PWA. Los navegadores ofrecen "Instalar app" una vez que está disponible. |
| `ui/public/sw.js`                                    | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (en el dir de estado de OpenClaw) | Par de claves VAPID autogenerado que se usa para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                   | Endpoints de suscripción del navegador persistidos.               |

Sobrescribe el par de claves VAPID mediante variables de entorno en el proceso Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `https://openclaw.ai`)

La Control UI usa estos métodos de Gateway protegidos por ámbito para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por relay) y del método `push.test` existente, que apunta al emparejamiento móvil nativo.
</Note>

## Incrustaciones hospedadas

Los mensajes del asistente pueden renderizar contenido web hospedado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla con `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de incrustaciones hospedadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite incrustaciones interactivas mientras mantiene el aislamiento de origen; este es el valor predeterminado y suele bastar para juegos/widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan intencionadamente privilegios más fuertes.
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
Usa `trusted` solo cuando el documento incrustado necesite realmente comportamiento de mismo origen. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL externas absolutas de incrustación `http(s)` permanecen bloqueadas de forma predeterminada. Si intencionadamente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

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

El valor se valida antes de llegar al navegador. Los valores admitidos incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso tailnet (recomendado)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes Serve de Control UI/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen pasando por las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres requerir credenciales explícitas de secreto compartido incluso para tráfico Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos desajustes simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host del gateway es confiable. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Luego abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en la configuración de la UI (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

<AccordionGroup>
  <Accordion title="Comportamiento del conmutador de autenticación insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es solo un conmutador local de compatibilidad:

    - Permite que sesiones de Control UI en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remoto (no localhost).

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
  <Accordion title="Nota de proxy confiable">
    - Una autenticación trusted-proxy correcta puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de Control UI con rol de nodo.
    - Los proxies inversos loopback del mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta [Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación de configuración HTTPS.

## Política de seguridad de contenido

La Control UI se entrega con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y no emite solicitudes de red.

Lo que esto significa en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL en línea `data:image/...` siguen renderizándose (útiles para cargas útiles dentro del protocolo).
- Las URL `blob:` locales creadas por la Control UI siguen renderizándose.
- Las URL de avatar remotas emitidas por metadatos de canales se eliminan en los helpers de avatar de la Control UI y se reemplazan por el logo/insignia integrado, de modo que un canal comprometido o malicioso no pueda forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activo y no es configurable.

## Autenticación de ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la Control UI requiere el mismo token de gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que de otro modo están protegidos.
- La propia Control UI reenvía el token de gateway como encabezado bearer al obtener avatares, y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también deja de requerir autenticación, en línea con el resto del gateway.

## Autenticación de ruta de medios del asistente

Cuando la autenticación del gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de Control UI. El navegador envía el token de gateway como encabezado bearer al comprobar disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración acotado a esa ruta de origen exacta.
- Las URL de imagen, audio, vídeo y documento renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o contraseña de gateway activos. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene el renderizado normal de medios compatible con elementos multimedia nativos del navegador sin poner credenciales reutilizables del gateway en URL de medios visibles.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieres URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a tu URL WS del Gateway (p. ej., `ws://127.0.0.1:18789`).

## Página en blanco de Control UI

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la aplicación de módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no está registrado después del inicio.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Desactiva extensiones que se inyectan en todas las páginas, especialmente extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil limpio del navegador u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La Control UI son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo Vite localmente pero el Gateway se ejecuta en otro lugar.

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

    Autenticación opcional de una sola vez (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica para URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` aún se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está configurado, la interfaz no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues públicos de Control UI que no sean loopback deben configurar `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas de LAN/Tailnet del mismo origen desde loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
    - El arranque del Gateway puede inicializar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos aún necesitan entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrechamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con cualquier host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de alternativa de origen basado en el encabezado Host, pero es un modo de seguridad peligroso.

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

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — monitorización de estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
