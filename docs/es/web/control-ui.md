---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-07-04T17:49:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

La UI de control es una pequeña aplicación de página única de **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: define `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

<Note>
En enlaces LAN nativos de Windows, Windows Firewall o una directiva de grupo administrada por la organización aún puede bloquear la URL LAN anunciada incluso cuando `127.0.0.1` funciona en el host del Gateway. Ejecuta `openclaw gateway status --deep` en el host Windows; informa puertos probablemente bloqueados, desajustes de perfil y reglas de firewall locales que la directiva podría ignorar.
</Note>

La autenticación se suministra durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del panel de control conserva un token para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se persisten. El onboarding normalmente genera un token de gateway para la autenticación por secreto compartido en la primera conexión, pero la autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la UI de control desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para impedir el acceso no autorizado.

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

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administrador, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con más privilegios y te pide que apruebes explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

Los agentes Paperclip que se conectan mediante el adaptador `openclaw_gateway` usan el mismo flujo de aprobación de primera ejecución. Después del intento de conexión inicial, ejecuta `openclaw devices approve --latest` para previsualizar la solicitud pendiente y, a continuación, vuelve a ejecutar el comando impreso `openclaw devices approve <requestId>` para aprobarla. Pasa valores explícitos de `--url` y `--token` para un gateway remoto. Para mantener las aprobaciones estables entre reinicios, configura un `adapterConfig.devicePrivateKeyPem` persistente en Paperclip en lugar de dejar que genere una identidad de dispositivo efímera nueva en cada ejecución.

<Note>
- Las conexiones directas de navegador por local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir la ida y vuelta de emparejamiento para sesiones de operador de la UI de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión de iOS/Android sin
abrir una terminal:

<Steps>
  <Step title="Abrir emparejamiento móvil">
    Selecciona **Nodos** y luego haz clic en **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.
  </Step>
  <Step title="Conectar el teléfono">
    En la app móvil de OpenClaw, abre **Configuración** → **Gateway** y escanea el código QR. En su lugar, puedes copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirmar la conexión">
    La app oficial de iOS/Android se conecta automáticamente. Si **Dispositivos** muestra una solicitud pendiente, revisa su rol y alcances antes de aprobarla.
  </Step>
</Steps>

Crear un código de configuración requiere `operator.admin`; el botón está deshabilitado para
sesiones que no lo tengan. Un código de configuración contiene una credencial de arranque de corta duración,
así que trata el QR y el código copiado como una contraseña mientras sean válidos. Para el emparejamiento
remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale
Serve/Funnel); `ws://` sin cifrar se limita a loopback y direcciones LAN privadas.
Consulta [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para ver los
detalles completos de seguridad y alternativas.

## Identidad personal (local del navegador)

La UI de control admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, se limita al perfil de navegador actual y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la sustitución del avatar del asistente. Los avatares de asistente cargados se superponen a la identidad resuelta por el gateway solo en el navegador local y nunca hacen ida y vuelta por `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes que no son la UI que escriben el campo directamente (como gateways con scripts o paneles de control personalizados).

## Endpoint de configuración en tiempo de ejecución

La UI de control obtiene su configuración en tiempo de ejecución desde `/control-ui-config.json`, resuelta en relación con la ruta base de la UI de control del gateway (por ejemplo, `/__openclaw__/control-ui-config.json` cuando la UI se sirve bajo `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación de gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idiomas

La UI de control puede localizarse en la primera carga según la configuración regional de tu navegador. Para cambiarla más tarde, abre **Resumen -> Acceso al Gateway -> Idioma**. El selector de configuración regional está en la tarjeta Acceso al Gateway, no en Apariencia.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son al inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales no inglesas, pero el selector de idioma integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) sigue generándose en el repositorio de publicación; es posible que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, más un espacio de importación tweakcn local del navegador. Para importar un tema, abre [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace de tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin formato y nombres de tema predeterminados como `amethyst-haze`.

Apariencia también incluye una opción local del navegador de tamaño de texto. La opción se almacena con el resto de las preferencias de la UI de control, se aplica al texto del chat, el texto del compositor, las tarjetas de herramientas y las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automáticamente al enfocar.

Los temas importados se almacenan solo en el perfil de navegador actual. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza el único espacio local; borrarlo cambia el tema activo de nuevo a Claw si el tema importado estaba seleccionado.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y voz">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje para que las sesiones grandes no obliguen al navegador a renderizar una carga completa de transcripción antes de que el chat sea usable.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador limitado de un solo uso por WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente empiezan con `talk.client.create`; las sesiones de retransmisión del Gateway empiezan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas a herramientas de proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo OpenClaw configurado más grande, y enruta la dirección por voz de ejecuciones activas mediante `talk.client.steer` o `talk.session.steer`.
    - Transmite llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos de agente).
    - Pestaña Actividad con resúmenes locales del navegador y con redacción primero de actividad de herramientas en vivo desde la entrega existente de eventos `session.tool` / herramienta.

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados más canales de plugins incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y las instantáneas parciales se etiquetan cuando un sondeo o auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia + actualizar (`system-presence`).
    - Sesiones: lista de sesiones de agentes configurados de forma predeterminada, alternativa desde claves de sesión de agentes no configurados obsoletas, y aplica sobrescrituras por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: estado de dreaming, interruptor de activar/desactivar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodos, aprobaciones de exec">
    - Trabajos Cron: listar/agregar/editar/ejecutar/activar/desactivar + historial de ejecución (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: listar + capacidades (`node.list`), crear códigos de configuración móvil y aprobar emparejamiento de dispositivos (`device.pair.*`).
    - Aprobaciones de exec: editar listas de permitidos del gateway o nodo + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtros/paralelismo, comandos comunes de operador y el editor de configuración `mcp` con alcance.
    - Aplicar + reiniciar con validación (`config.apply`) y activar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) comprueban previamente la resolución de SecretRef activos para las referencias en la carga útil de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de escribir.
    - Los guardados de formularios descartan marcadores de posición redactados obsoletos que no se pueden restaurar desde la configuración guardada, mientras conservan valores redactados que todavía se asignan a secretos guardados.
    - Esquema + renderizado de formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de UI coincidentes, resúmenes inmediatos de hijos, metadatos de documentación en nodos anidados de objeto/comodín/arreglo/composición, además de esquemas de plugin + canal cuando estén disponibles); el editor JSON sin procesar solo está disponible cuando la instantánea tiene un recorrido de ida y vuelta sin procesar seguro.
    - Si una instantánea no puede hacer de forma segura un recorrido de ida y vuelta de texto sin procesar, Control UI fuerza el modo Formulario y deshabilita el modo Sin procesar para esa instantánea.
    - El editor JSON sin procesar "Restablecer a guardado" conserva la forma escrita sin procesar (formato, comentarios, disposición de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer de forma segura el recorrido de ida y vuelta.
    - Los valores de objetos SecretRef estructurados se renderizan como de solo lectura en las entradas de texto del formulario para evitar la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de Control UI, tiempos lentos de renderizado de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada PerformanceObserver.
    - Registros: seguimiento en vivo de registros de archivo de gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reiniciar (`update.run`) con un informe de reinicio, luego consultar `update.status` después de reconectar para verificar la versión de gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega usa de forma predeterminada anunciar resumen. Puedes cambiarla a ninguna si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y ninguna.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar anulación de agente, opciones cron exactas/escalonadas, anulaciones de modelo/pensamiento de agente y alternadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos deshabilitan el botón de guardar hasta que se corrijan.
    - Configura `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Alternativa obsoleta: ejecuta `openclaw doctor --fix` para migrar trabajos heredados almacenados con `notify: true` desde `cron.webhook` a webhook explícito por trabajo o entrega de finalización.

  </Accordion>
</AccordionGroup>

## Página de MCP

La página dedicada de MCP es una vista de operador para servidores MCP gestionados por OpenClaw en `mcp.servers`. No inicia transportes MCP por sí misma; úsala para inspeccionar y editar la configuración guardada, luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Revisa las tarjetas de resumen para ver los recuentos de servidores totales, habilitados, OAuth y filtrados.
3. Revisa cada fila de servidor para transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Alterna la habilitación cuando un servidor deba permanecer configurado pero mantenerse fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con alcance para definiciones de servidores, encabezados, rutas TLS/mTLS, metadatos OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para una escritura de configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración cambiada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` u `openclaw mcp reload` desde una terminal cuando el proceso editado necesite diagnósticos estáticos, prueba en vivo o descarte del runtime en caché.

La página redacta valores similares a URL que contienen credenciales antes de renderizarlos y pone entre comillas los nombres de servidores en fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. La referencia completa de CLI y configuración está en [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para actividad de herramientas en vivo. Se deriva del mismo flujo de eventos `session.tool` / herramienta del Gateway que alimenta las tarjetas de herramientas de Chat; no añade otra familia de eventos del Gateway, endpoint, almacén duradero de actividad, feed de métricas ni flujo de observador externo.

Las entradas de Actividad conservan solo resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la UI muestra que los argumentos están ocultos y registra solo el recuento de campos de argumentos. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de Control UI y se restablece al recargar la página, cambiar de sesión o usar **Borrar**.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes confiables de Control UI también pueden recibir metadatos opcionales de tiempos de ACK para diagnósticos locales.
    - Las cargas de chat aceptan imágenes además de archivos que no sean de video. Las imágenes conservan la ruta nativa de imagen; otros archivos se almacenan como medios gestionados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño por seguridad de la UI. Cuando las entradas de transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se truncó en `chat.history`, el lector lateral puede obtener bajo demanda la entrada completa de transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, `agentId` activo cuando sea necesario, y `messageId` de transcripción. Si el Gateway todavía no puede devolver más, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas/por el asistente se conservan como referencias de medios gestionados y se devuelven mediante URL de medios autenticadas del Gateway, de modo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial de chat.
    - Al renderizar `chat.history`, Control UI elimina etiquetas de directivas en línea solo para visualización del texto visible del asistente (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens filtrados de control de modelo ASCII/de ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea más antigua; la transcripción canónica reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción duradera de la sesión. Después de eventos finales de herramienta, Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` agrega una nota de asistente a la transcripción de sesión y transmite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega de canal).
    - La barra lateral enumera sesiones recientes con una acción Nueva sesión, un enlace Todas las sesiones y un botón de búsqueda de sesión que abre el selector completo de sesiones (con alcance por el agente seleccionado, con búsqueda y paginación). Cambiar de agente muestra solo sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - En anchos de escritorio, los controles de chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados de solo texto se renderizan como una sola burbuja con una insignia de recuento. Los mensajes que contienen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo se dejan sin contraer.
    - Los selectores de modelo y razonamiento del encabezado de chat parchean la sesión activa inmediatamente mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío solo de un turno.
    - Si envías un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el compositor espera ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` en Control UI crea y cambia a la misma sesión nueva de panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; en ese caso restablece la sesión principal en su lugar. Escribir `/reset` mantiene el restablecimiento explícito en el lugar del Gateway para la sesión actual.
    - El selector de modelo del chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.models` está presente, esa lista de permitidos impulsa el selector, incluidas entradas `provider/*` que mantienen dinámicos los catálogos con alcance de proveedor. De lo contrario, el selector muestra entradas explícitas `models.providers.*.models` además de proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando informes recientes de uso de sesión del Gateway incluyen tokens de contexto actuales, la barra de herramientas del compositor de chat muestra un pequeño anillo de uso de contexto con el porcentaje usado; el detalle completo de tokens está en su tooltip. El anillo cambia a estilo de advertencia con alta presión de contexto y, en niveles de Compaction recomendados, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo hablar (tiempo real del navegador)">
    El modo hablar usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de autenticación de clave de API `openai`, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`; los perfiles OAuth de OpenAI no configuran voz en tiempo real. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar de proveedor. OpenAI recibe un secreto efímero de cliente Realtime para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por el Gateway. Los proveedores que solo exponen un puente de tiempo real de backend se ejecutan mediante el transporte de retransmisión del Gateway, por lo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticadas del Gateway. El prompt de sesión Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un botón de opciones de Talk junto al botón de inicio/detención de Talk. Las opciones se aplican a la siguiente sesión de Talk y pueden anular el proveedor, el transporte, el modelo, la voz, el esfuerzo de razonamiento, el umbral de VAD, la duración del silencio y el relleno de prefijo. Cuando una opción está en blanco, el Gateway usa los valores predeterminados configurados donde estén disponibles o el valor predeterminado del proveedor. Seleccionar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; seleccionar WebRTC mantiene la sesión en propiedad del cliente y falla en lugar de recurrir silenciosamente a la retransmisión si el proveedor no puede crear una sesión de navegador.

    En el compositor de Chat, el control de Talk es el botón de ondas junto al botón de dictado por micrófono. Cuando Talk se inicia, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Prueba de humo en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC de navegador de OpenAI, la configuración WebSocket de navegador con tokens restringidos de Google Live y el adaptador de navegador de retransmisión del Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz de usuario.
    - El Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y web push

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y fuerza la actualización de la página. Si sigue fallando, borra los datos del sitio para el origen del panel o prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de interfaz de control anterior a la actualización contra el Gateway más nuevo.

| Superficie                                             | Qué hace                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto PWA. Los navegadores ofrecen "Instalar aplicación" cuando es accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el dir. de estado de OpenClaw) | Par de claves VAPID autogenerado usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción de navegador persistidos.                 |

Anula el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando quieras fijar claves (para despliegues multihost, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (por defecto `https://openclaw.ai`)

La interfaz de control usa estos métodos del Gateway restringidos por alcance para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método `push.test` existente, que apuntan al emparejamiento móvil nativo.
</Note>

## Inserciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Deshabilita la ejecución de scripts dentro de inserciones alojadas.
  </Tab>
  <Tab title="scripts (predeterminado)">
    Permite inserciones interactivas manteniendo el aislamiento de origen; este es el valor predeterminado y suele ser suficiente para juegos/widgets de navegador autónomos.
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
Usa `trusted` solo cuando el documento incrustado realmente necesite comportamiento de mismo origen. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL de inserción externas absolutas `http(s)` permanecen bloqueadas por defecto. Si quieres intencionalmente que `[embed url="https://..."]` cargue páginas de terceros, configura `gateway.controlUi.allowExternalEmbedUrls: true`.

## Anchura de mensajes de Chat

Los mensajes de Chat agrupados usan un ancho máximo predeterminado legible. Los despliegues con monitores anchos pueden anularlo sin parchear el CSS incluido configurando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los valores compatibles incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de anchura restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso Tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    Por defecto, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen pasando por las comprobaciones normales de dispositivo. Configura `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para el tráfico Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo alcance de autenticación se serializan antes de las escrituras de límite de tasa. Por tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token presupone que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Luego abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en la configuración de la interfaz (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP plano (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. Por defecto, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la interfaz localmente:

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

    - Permite que las sesiones de la interfaz de control en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
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
    `dangerouslyDisableDeviceAuth` deshabilita las comprobaciones de identidad de dispositivo de la interfaz de control y es una degradación de seguridad grave. Reviértelo rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota de proxy de confianza">
    - La autenticación correcta mediante proxy de confianza puede admitir sesiones **operator** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de la interfaz de control con rol de nodo.
    - Los proxies inversos de loopback en el mismo host aún no satisfacen la autenticación de proxy de confianza; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación de configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control se distribuye con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. Las URL de imagen remotas `http(s)` y relativas al protocolo son rechazadas por el navegador y no emiten solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL en línea `data:image/...` siguen renderizándose (útiles para cargas útiles dentro del protocolo).
- Las URL `blob:` locales creadas por la interfaz de control siguen renderizándose.
- Las URL de avatar remotas emitidas por metadatos de canales se eliminan en los helpers de avatar de la interfaz de control y se reemplazan con el logotipo/insignia incorporado, por lo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la interfaz de control requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (coincidiendo con la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que de otro modo están protegidos.
- La propia interfaz de control reenvía el token del gateway como encabezado bearer al obtener avatares, y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta del avatar también queda sin autenticación, en línea con el resto del Gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del Gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la UI de control. El navegador envía el token del Gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, video y documentos renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la renderización normal de medios compatible con los elementos multimedia nativos del navegador sin poner credenciales reutilizables del Gateway en URL de medios visibles.

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

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de la UI de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la aplicación de módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no se registra después del inicio.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Desactiva las extensiones que inyectan contenido en todas las páginas, especialmente extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil limpio del navegador u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto resulta útil cuando quieres usar el servidor de desarrollo de Vite localmente, pero el Gateway se ejecuta en otro lugar.

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

    Autenticación opcional de un solo uso (si es necesario):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica para URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la UI no vuelve a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues públicos de la UI de control que no sean local loopback deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas de LAN/Tailnet con el mismo origen desde local loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin activar la alternativa del encabezado Host.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir de la dirección de enlace y el puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con cualquier host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo alternativo de origen por encabezado Host, pero es un modo de seguridad peligroso.

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
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
