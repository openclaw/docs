---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceder a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-06T10:54:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c17497942b55a1b886948f7c3f0685b4fac29da0b755530f18230e59eb2b412
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de una sola página de **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no se carga, inicia primero el Gateway: `openclaw gateway`.

<Note>
En enlaces LAN nativos de Windows, el Firewall de Windows o una directiva de grupo administrada por la organización aún puede bloquear la URL LAN anunciada incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecuta `openclaw gateway status --deep` en el host de Windows; informa puertos probablemente bloqueados, incompatibilidades de perfil y reglas de firewall locales que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el protocolo de enlace WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del tablero conserva un token para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se persisten. La incorporación normalmente genera un token de gateway para autenticación de secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Conectarse desde un navegador o dispositivo nuevo normalmente requiere una **aprobación de emparejamiento de una sola vez**, mostrada como `disconnected (1008): pairing required`.

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

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura/administración se trata como una actualización de aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide que apruebes explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación de tokens, revocación y el flujo de aprobación de primer uso de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas local loopback del navegador (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el recorrido de ida y vuelta de emparejamiento para sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo. Los navegadores sin dispositivo y las conexiones con rol de nodo siguen usando las comprobaciones normales de dispositivo.
- Los enlaces directos a Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo aún requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requiere volver a emparejar.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión de iOS/Android sin abrir una terminal:

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

Crear un código de configuración requiere `operator.admin`; el botón está deshabilitado para sesiones que no lo tengan. Un código de configuración contiene una credencial de arranque de corta duración, así que trata el QR y el código copiado como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin cifrar está limitado a direcciones local loopback y LAN privadas. Consulta [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para ver todos los detalles de seguridad y alternativas.

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre visible y avatar) adjunta a los mensajes salientes, para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

La anulación del avatar del asistente sigue el mismo patrón local del navegador: las anulaciones cargadas se superponen localmente a la identidad resuelta por el gateway y nunca hacen un viaje de ida y vuelta mediante `config.patch`. El campo de configuración compartida `ui.assistant.avatar` sigue disponible para clientes que no son de la interfaz de usuario y que escriben el campo directamente.

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene su configuración en tiempo de ejecución de `/control-ui-config.json`, resuelta en relación con la ruta base de la interfaz de control del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Estado del host del Gateway

Abre **Configuración** en la vista simple para ver la tarjeta **Host del Gateway** con la máquina del Gateway, dirección LAN, sistema operativo, tiempo de ejecución, tiempo activo, carga de CPU, memoria y espacio en disco del volumen de estado. La tarjeta se actualiza cada 10 segundos mientras está visible mediante la RPC `system.info` del Gateway, que requiere el alcance `operator.read`. Los Gateways antiguos y las conexiones sin ese alcance omiten la tarjeta.

## Compatibilidad de idioma

La interfaz de control se localiza a sí misma en la primera carga según la configuración regional de tu navegador. Para anularla más tarde, abre **Resumen -> Acceso al Gateway -> Idioma** (el selector está en la tarjeta Acceso al Gateway, no en Apariencia).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones que no son en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales no inglesas, pero el selector de idioma integrado del sitio de documentación de Mintlify solo lista los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; es posible que no aparezcan en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia incluye los temas integrados Claw, Knot y Dash (Claw es el predeterminado), además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre el [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil actual del navegador; no se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo vuelve a Claw si el tema importado estaba activo.

Apariencia también tiene una configuración local del navegador Tamaño de texto, almacenada con el resto de preferencias de la interfaz de control. Se aplica al texto del chat, al texto del compositor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automático al enfocar.

## Navegación de la barra lateral

La barra lateral mantiene primero las sesiones, divididas en grupos **Fijadas** y **Sesiones**. Cada sesión fijada permanece visible, mientras que las sesiones no fijadas conservan un presupuesto reciente independiente de nueve elementos. **Resumen** es el único destino fijado de forma predeterminada; expande **Más** para llegar a cualquier otro destino. Selecciona **Personalizar barra lateral** en Más, o haz clic derecho en el área de navegación, para fijar o desfijar destinos y restaurar los valores predeterminados. El conjunto fijado y el estado de expansión de Más se almacenan en el perfil actual del navegador y sobreviven a las recargas.

El pie de página compacto mantiene juntos el estado de conexión, **Configuración**, **Documentación** y el emparejamiento móvil. En escritorio, usa el botón de la barra superior junto al control de terminal para contraer o expandir la barra lateral. En puntos de corte de cajón, el botón de hamburguesa reemplaza ese control.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje, de modo que las sesiones grandes no obliguen al navegador a renderizar una carga completa de transcripción antes de que el chat sea utilizable.
    - Al pasar el cursor o enfocar con el teclado un enlace público de issue o pull request de GitHub, se muestra su estado, título, autor, actividad reciente, comentarios y estadísticas de cambios. El Gateway conectado obtiene y almacena en caché metadatos públicos sin cambiar el destino del enlace, incluso cuando la interfaz de usuario usa un Gateway remoto. El Gateway usa `GH_TOKEN` o `GITHUB_TOKEN` cuando están disponibles, después de confirmar que el repositorio es público; de lo contrario, usa la API anónima de GitHub con una caché más larga.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso sobre WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo de OpenClaw configurado más grande, y enruta la orientación por voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmite llamadas a herramientas y tarjetas de salida de herramientas en vivo en Chat (eventos del agente).
    - Pestaña de actividad con resúmenes locales del navegador y priorizados para redacción de la actividad de herramientas en vivo a partir de la entrega existente de eventos `session.tool` / herramientas.

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de los canales integrados y de Plugin agrupados/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y etiquetan las instantáneas parciales cuando un sondeo o una auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia y actualización (`system-presence`).
    - Sesiones: lista las sesiones de agentes configurados de forma predeterminada, fija sesiones frecuentes, cámbiales el nombre, archiva o restaura sesiones inactivas, recurre a claves obsoletas de sesiones de agentes no configurados y aplica anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan por encima de las sesiones recientes no fijadas; las sesiones archivadas viven en la vista archivada de la página Sesiones y conservan sus transcripciones.
    - Agrupación de sesiones: un control Agrupar por organiza la tabla de sesiones en secciones por grupos personalizados, canal, tipo, agente o fecha. Los grupos personalizados persisten por sesión mediante `sessions.patch` (`category`), por lo que las sesiones iniciadas desde canales de mensajes (Discord, Telegram, WhatsApp, ...) también se pueden categorizar; asigna grupos arrastrando filas a una sección, o con el selector de grupo por fila, y crea grupos con la acción Nuevo grupo.
    - Sueños: estado de Dreaming, alternancia de activar/desactivar y lector del diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodos, aprobaciones de exec">
    - Trabajos de Cron: listar/agregar/editar/ejecutar/activar/desactivar, además del historial de ejecuciones (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: lista más capacidades (`node.list`), crear códigos de configuración móvil y aprobar emparejamiento de dispositivos (`device.pair.*`).
    - Aprobaciones de exec: edita listas de permitidos de Gateway o Node y la política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtros/paralelismo, comandos habituales de operador y el editor de configuración `mcp` con alcance.
    - Aplica y reinicia con validación (`config.apply`), luego despierta la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución de SecretRef activos para las referencias en la carga útil de configuración enviada; las referencias enviadas activas sin resolver se rechazan antes de escribir.
    - Los guardados de formulario descartan marcadores redactados obsoletos que no se pueden restaurar desde la configuración guardada, mientras preservan valores redactados que todavía se asignan a secretos guardados.
    - El esquema y la renderización del formulario provienen de `config.schema` / `config.schema.lookup`, incluidos `title`/`description` de campo, sugerencias de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/matriz/composición, además de esquemas de Plugin y canal cuando estén disponibles. El editor JSON sin procesar solo está disponible cuando la instantánea tiene una ida y vuelta sin procesar segura; de lo contrario, Control UI fuerza el modo Formulario.
    - En el editor JSON sin procesar, "Restablecer a guardado" preserva la forma escrita en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer una ida y vuelta de forma segura.
    - Los valores de objeto SecretRef estructurados se renderizan como solo lectura en las entradas de texto del formulario, para evitar corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Uso">
    - El análisis de tokens derivados de la sesión y de coste estimado permanece separado de la facturación del proveedor.
    - Las tarjetas de proveedor llaman a `usage.status` y muestran nombres de planes en vivo, ventanas de cuota, saldos, gasto y presupuestos informados por los plugins de proveedor configurados.
    - Un fallo de uso de proveedor no bloquea el panel de sesión/coste; las tarjetas de proveedor no disponibles muestran su propio estado de error.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de Control UI, tiempos lentos de renderización de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: cola en vivo de registros de archivo del Gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecuta una actualización de paquete/git más reinicio (`update.run`) con un informe de reinicio, luego consulta `update.status` después de reconectar para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos de Cron">
    - Para trabajos aislados, la entrega usa de forma predeterminada anunciar resumen; cambia a ninguno para ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y ninguno.
    - Los controles de edición avanzada incluyen eliminar tras ejecutar, borrar anulación de agente, opciones de Cron exacto/escalonado, anulaciones de modelo/thinking de agente y alternancias de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - `cron.webhook` es una alternativa heredada obsoleta: ejecuta `openclaw doctor --fix` para migrar trabajos almacenados que todavía usan `notify: true` a webhook explícito por trabajo o entrega de finalización.

  </Accordion>
</AccordionGroup>

## Página MCP

La página MCP dedicada es una vista de operador para servidores MCP administrados por OpenClaw bajo `mcp.servers`. No inicia transportes MCP por sí misma; úsala para inspeccionar y editar la configuración guardada, luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Revisa las tarjetas de resumen para los recuentos de servidores totales, habilitados, OAuth y filtrados.
3. Revisa cada fila de servidor para transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Alterna la habilitación cuando un servidor deba seguir configurado pero quedar fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con alcance para definiciones de servidor, encabezados, rutas TLS/mTLS, metadatos OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para una escritura de configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración cambiada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` u `openclaw mcp reload` desde una terminal para diagnósticos estáticos, prueba en vivo o descarte de runtime en caché.

La página redacta valores similares a URL que contienen credenciales antes de renderizarlos y entrecomilla nombres de servidor en fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. Referencia completa de CLI y configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para la actividad de herramientas en vivo, derivado del mismo flujo de eventos `session.tool` / herramienta del Gateway que alimenta las tarjetas de herramientas de Chat. No agrega otra familia de eventos del Gateway, endpoint, almacén de actividad duradero, feed de métricas ni flujo de observador externo.

Las entradas de Actividad conservan solo resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la UI muestra que los argumentos están ocultos y registra solo el recuento de campos de argumentos. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de Control UI y se restablece al recargar la página, cambiar de sesión o usar **Borrar**.

## Terminal de operador

La terminal de operador acoplable está deshabilitada de forma predeterminada. Para habilitarla, establece `gateway.terminal.enabled: true` y reinicia el Gateway. La terminal requiere una conexión `operator.admin` y abre un PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
La terminal es una shell del host sin confinamiento y hereda el entorno del proceso del Gateway. Habilítala solo para despliegues de operadores de confianza. OpenClaw rechaza sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Usa **Ctrl + acento grave** para alternar el dock. El diseño admite acoplamiento inferior y derecho, cambia de tamaño con el viewport del navegador y conserva varias pestañas de shell. Consulta [Configuración del Gateway](/es/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Las sesiones sobreviven a desconexiones: una recarga de página, suspensión del portátil o interrupción de red separa la sesión en el Gateway en lugar de matarla, y la misma pestaña del navegador se vuelve a adjuntar al reconectar con la salida reciente reproducida. Las sesiones separadas se matan después de `gateway.terminal.detachedSessionTimeoutSeconds` (predeterminado 300 segundos; `0` restaura matar al desconectar). `terminal.list` muestra sesiones adjuntables, `terminal.attach` adopta una (toma de control estilo tmux) y `terminal.text` lee la salida reciente de una sesión como texto plano sin adjuntarse: una facilidad para agentes/herramientas.

La terminal también está disponible como un documento de pantalla completa solo de terminal en `/?view=terminal`. Las aplicaciones iOS y Android incrustan esta página en sus pantallas Terminal, reutilizando las credenciales almacenadas del gateway; la disponibilidad sigue la misma puerta `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece la terminal.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma de inmediato con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de Control UI de confianza también pueden recibir metadatos opcionales de temporización de ACK para diagnósticos locales.
    - Las cargas de chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios gestionados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño por seguridad de la UI. Cuando las entradas de la transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y sustituir mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se truncó en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, `agentId` activo cuando sea necesario y `messageId` de transcripción. Si Gateway aún no puede devolver más, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes del asistente/generadas se conservan como referencias de medios gestionados y se sirven de vuelta mediante URLs de medios autenticadas de Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen en base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al renderizar `chat.history`, Control UI elimina del texto visible del asistente las etiquetas de directivas en línea solo para visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens filtrados de control del modelo en ASCII/ancho completo. Omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de acuse de recibo de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas del usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica sustituye esos mensajes locales una vez que el historial de Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción duradera de la sesión. Después de eventos finales de herramientas, Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de la transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega de canal).
    - La barra lateral enumera sesiones recientes con una acción Nueva sesión, un enlace Todas las sesiones y un botón de búsqueda de sesiones que abre el selector completo de sesiones (limitado al agente seleccionado, con búsqueda y paginación). Una nueva sesión del panel obtiene de forma asíncrona un título generado y conciso a partir de su primer mensaje que no sea de comando; los nombres explícitos nunca se sustituyen. Configura `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para dirigir esta llamada separada al modelo a un modelo de menor costo. Cambiar de agente muestra solo las sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - Cada fila del selector de sesiones puede renombrar, fijar o archivar la sesión. Una ejecución activa y la sesión principal de un agente no pueden archivarse. Archivar la sesión seleccionada actualmente devuelve Chat a la sesión principal de ese agente.
    - En anchos de escritorio, los controles de chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados de solo texto se renderizan como una burbuja con una insignia de recuento. Los mensajes que incluyen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo se dejan sin contraer.
    - Los selectores de modelo y razonamiento del encabezado de chat aplican parches a la sesión activa de inmediato mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío solo para un turno.
    - Si envías un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el compositor espera a ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` crea y cambia a la misma sesión nueva de panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; entonces restablece la sesión principal en el mismo lugar. Escribir `/reset` mantiene el restablecimiento explícito en el mismo lugar de Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelos configurada de Gateway. Si `agents.defaults.models` está presente, esa lista permitida impulsa el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos limitados al proveedor. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` más proveedores con autenticación utilizable. El catálogo completo permanece disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión de Gateway incluyen tokens de contexto actuales, la barra de herramientas del compositor de chat muestra un pequeño anillo de uso de contexto con el porcentaje usado. Abre el anillo para ver la ventana de contexto actual, los recuentos de tokens de la última ejecución y el costo total estimado, la identidad de proveedor/modelo y el desglose de costo de entrada/salida/caché de la última respuesta del proveedor cuando se informe. El anillo cambia a estilo de advertencia con presión alta de contexto y, en niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real del navegador)">
    El modo de conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de clave de API/OAuth `openai`, un inicio de sesión externo de Codex, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`. Las fuentes de clave de API configuradas tienen prioridad y Codex OAuth es la alternativa automática. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor ni un token OAuth: OpenAI recibe un secreto efímero de cliente Realtime para WebRTC, y Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con las instrucciones y declaraciones de herramientas bloqueadas en el token por Gateway. Los proveedores que solo exponen un puente backend en tiempo real se ejecutan mediante el transporte de retransmisión de Gateway, por lo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve por RPC autenticados de Gateway. El prompt de la sesión Realtime lo ensambla Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un desplegable de opciones de Conversación junto al botón de iniciar/detener Conversación. Su panel compacto conserva solo Voz, Modelo y Sensibilidad para la próxima sesión de Conversación. **Más en Configuración** abre **Configuración → Comunicaciones → Conversación**, donde residen los valores predeterminados persistentes de proveedor, transporte, esfuerzo de razonamiento, umbral VAD exacto, duración del silencio y relleno de prefijo; cambiar esos valores predeterminados requiere acceso `operator.admin`. Los valores en blanco del compositor recurren a esos valores predeterminados configurados o al valor predeterminado del proveedor. Configurar la retransmisión de Gateway fuerza la ruta de retransmisión backend; configurar WebRTC mantiene la sesión como propiedad del cliente y falla en lugar de recurrir silenciosamente a la retransmisión si el proveedor no puede crear una sesión de navegador.

    El control de Conversación en sí es el botón de micrófono en la barra de herramientas del compositor, con un pequeño desplegable al lado que abre las opciones de Conversación. Cuando Conversación se inicia, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Prueba en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket backend de OpenAI, el intercambio SDP de WebRTC de navegador de OpenAI, la configuración de WebSocket de navegador con token restringido de Google Live y el adaptador de navegador de retransmisión de Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial tras aborto">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la UI.
    - Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripción puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Pérdida de conexión y reconexión

Una vez establecida una sesión, una conexión caída con Gateway no cierra tu sesión. El panel
permanece visible con un aviso ámbar "Conexión con Gateway perdida — reconectando…" mientras el cliente
reintenta automáticamente con retroceso (800 ms hasta 15 s). Las actualizaciones en vivo y las acciones se pausan hasta que la
conexión vuelve; **Reintentar ahora** en el aviso fuerza un intento inmediato.

La puerta de inicio de sesión solo aparece cuando aún no hay una sesión establecida (primera apertura, recarga de página
antes de conectar) o cuando Gateway rechaza activamente las credenciales (token/contraseña incorrectos, emparejamiento revocado),
estados que necesitan tu intervención en lugar de esperar.

## Instalación PWA y Web Push

Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y haz una actualización forzada. Si aún falla, borra los datos del sitio para el origen del panel o prueba en una ventana de navegador privada; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de Control UI anterior a la actualización contra el Gateway más nuevo.

| Superficie                                            | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto PWA. Los navegadores ofrecen "Instalar app" cuando es accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics de notificación. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador conservados.                |

Anula el par de claves VAPID mediante variables de entorno en el proceso de Gateway cuando quieras fijar claves (despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (por defecto `https://openclaw.ai`)

Control UI usa estos métodos de Gateway limitados por alcance para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` junto con `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Incrustaciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Deshabilita la ejecución de scripts dentro de las incrustaciones alojadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite incrustaciones interactivas mientras mantiene el aislamiento de origen; normalmente es suficiente para juegos/widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` encima de `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más amplios.
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
Usa `trusted` solo cuando el documento incrustado necesite realmente comportamiento de mismo origen. Para la mayoría de los juegos y lienzos interactivos generados por agentes, `scripts` es la opción más segura.
</Warning>

Las URL de incrustación externas absolutas `http(s)` permanecen bloqueadas de forma predeterminada. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo predeterminado legible. Las implementaciones en monitores anchos pueden sobrescribirlo sin parchear el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Las formas admitidas incluyen longitudes y porcentajes simples como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso tailnet (recomendado)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado).

    De forma predeterminada, las solicitudes Serve de Control UI/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para tráfico Serve, y luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token presupone que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abre `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado).

    Pega el secreto compartido correspondiente en la configuración de la UI (se envía como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del gateway).

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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

    - Permite que las sesiones de Control UI en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remotos (no localhost).

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` deshabilita las comprobaciones de identidad de dispositivo de Control UI y supone una degradación grave de seguridad. Reviértelo rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - La autenticación trusted-proxy correcta puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de Control UI con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

Control UI incluye una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imagen remotas `http(s)` y relativas al protocolo, y nunca realiza solicitudes de red.

En la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatares autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose.
- Las URL `blob:` locales creadas por Control UI siguen renderizándose.
- Los avatares de vista previa de enlaces de GitHub los obtiene el Gateway desde el host fijo de avatares de GitHub y se devuelven como URL `data:` acotadas; el navegador del operador nunca contacta con el host remoto de avatares.
- Las URL de avatares remotas emitidas por metadatos de canales se eliminan en los auxiliares de avatar de Control UI y se sustituyen por el logotipo/insignia integrados, por lo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

Esto siempre está activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de Control UI requiere el mismo token de gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana assistant-media), por lo que la ruta de avatar no puede filtrar la identidad del agente en hosts que de otro modo están protegidos.
- Control UI reenvía el token del gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si deshabilitas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también deja de requerir autenticación, de acuerdo con el resto del gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de Control UI; el navegador envía el token del gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imagen, audio, vídeo y documento renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

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

Luego apunta la UI a la URL WS de tu Gateway (p. ej., `ws://127.0.0.1:18789`).

## Página en blanco de Control UI

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la aplicación del módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no está registrado después del inicio.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Deshabilita las extensiones que se inyectan en todas las páginas, especialmente extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

Control UI son archivos estáticos; el destino WebSocket es configurable y puede diferir del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo Vite localmente pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica el valor para URL para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la UI no recurre a las credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente; la falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para evitar clickjacking.
    - Los despliegues públicos de la UI de control que no sean de loopback deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas de LAN/Tailnet del mismo origen desde loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos todavía necesitan entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen de navegador, no "coincidir con cualquier host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de alternativa de origen basada en el encabezado Host, pero es un modo de seguridad peligroso.

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

- [Panel](/es/web/dashboard) — panel de Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
