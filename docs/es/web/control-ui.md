---
read_when:
    - Desea operar el Gateway desde un navegador
    - Quiere acceder a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-05-11T20:59:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el intercambio inicial del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de ajustes del panel de control conserva un token para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente genera un token de gateway para la autenticación con secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivo (primera conexión)

Cuando te conectas a la interfaz de control desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para evitar el acceso no autorizado.

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

Si el navegador reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administración, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide que apruebes explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación salvo que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

<Note>
- Las conexiones directas de navegador con local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el viaje de ida y vuelta de emparejamiento para sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Las vinculaciones directas de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo todavía requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se conserva en el servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la anulación del avatar del asistente. Los avatares del asistente cargados superponen la identidad resuelta por el gateway solo en el navegador local y nunca hacen ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue estando disponible para clientes que no son de interfaz de usuario y escriben el campo directamente (como gateways con scripts o paneles de control personalizados).

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene sus ajustes en tiempo de ejecución desde `/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, una identidad de Tailscale Serve o una identidad de proxy de confianza.

## Soporte de idiomas

La interfaz de control puede localizarse a sí misma en la primera carga según la configuración regional de tu navegador. Para sobrescribirla más tarde, abre **Vista general -> Acceso al Gateway -> Idioma**. El selector de configuración regional está en la tarjeta Acceso al Gateway, no en Apariencia.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales no inglesas, pero el selector de idioma integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) todavía se genera en el repositorio de publicación; es posible que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre el [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace del tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil actual del navegador. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo cambia el tema activo de vuelta a Claw si el tema importado estaba seleccionado.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación">
    - Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje para que las sesiones grandes no obliguen al navegador a renderizar una carga completa de transcripción antes de que el chat sea utilizable.
    - Hablar mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso sobre WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente comienzan con `talk.client.create`; las sesiones de retransmisión del Gateway comienzan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio` y reenvía llamadas de herramienta del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo OpenClaw configurado más grande.
    - Transmitir llamadas de herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos de agente).

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins empaquetados/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y las instantáneas parciales se etiquetan cuando un sondeo o auditoría supera su presupuesto de interfaz.
    - Instancias: lista de presencia + actualización (`system-presence`).
    - Sesiones: listar de forma predeterminada las sesiones de agentes configurados, recurrir desde claves obsoletas de sesión de agente no configurado y aplicar anulaciones por sesión de modelo/pensamiento/rápido/detallado/traza/razonamiento (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, conmutador de activación/desactivación y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodos, aprobaciones de ejecución">
    - Tareas Cron: listar/agregar/editar/ejecutar/activar/desactivar + historial de ejecuciones (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: lista + capacidades (`node.list`).
    - Aprobaciones de ejecución: editar listas de permitidos de gateway o nodo + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar + reiniciar con validación (`config.apply`) y despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) validan previamente la resolución activa de SecretRef para las referencias en la carga de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de la escritura.
    - Esquema + renderizado de formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de interfaz coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/arreglo/composición, además de esquemas de plugin + canal cuando están disponibles); el editor JSON sin procesar está disponible solo cuando la instantánea tiene una ida y vuelta sin procesar segura.
    - Si una instantánea no puede hacer ida y vuelta de texto sin procesar de forma segura, la interfaz de control fuerza el modo Formulario y desactiva el modo Sin procesar para esa instantánea.
    - El editor JSON sin procesar "Restablecer a guardado" conserva la forma escrita en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer ida y vuelta de forma segura.
    - Los valores de objeto SecretRef estructurados se renderizan como solo lectura en las entradas de texto del formulario para evitar la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de la interfaz de control, tiempos lentos de renderizado de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en vivo de los registros de archivo del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reiniciar (`update.run`) con un informe de reinicio, luego sondear `update.status` después de la reconexión para verificar la versión del gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de tareas Cron">
    - Para tareas aisladas, la entrega es de forma predeterminada anunciar resumen. Puedes cambiar a ninguna si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando anunciar está seleccionado.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para tareas de sesión principal, están disponibles los modos de entrega webhook y ninguno.
    - Los controles de edición avanzada incluyen eliminar tras ejecutar, borrar anulación de agente, opciones exactas/escalonadas de cron, anulaciones de modelo/pensamiento de agente y conmutadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores inválidos desactivan el botón de guardado hasta corregirse.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Alternativa obsoleta: las tareas heredadas almacenadas con `notify: true` todavía pueden usar `cron.webhook` hasta que migren.

  </Accordion>
</AccordionGroup>

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma de inmediato con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
    - Las cargas del chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño por seguridad de la UI. Cuando las entradas de transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Las imágenes del asistente o generadas se conservan como referencias de medios administrados y se vuelven a servir mediante URLs autenticadas de medios del Gateway, por lo que las recargas no dependen de que las cargas de imagen base64 sin procesar permanezcan en la respuesta del historial del chat.
    - Al renderizar `chat.history`, la UI de Control elimina del texto visible del asistente las etiquetas de directivas en línea solo de visualización (por ejemplo, `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control del modelo filtrados en ASCII o ancho completo, y omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea más antigua; la transcripción canónica reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción durable de la sesión. Después de los eventos finales de herramientas, la UI de Control recarga el historial y fusiona solo una pequeña cola optimista; el límite de transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` agrega una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones solo de UI (sin ejecución del agente ni entrega por canal).
    - El encabezado del chat muestra el filtro de agente antes del selector de sesión, y el selector de sesión se limita al agente seleccionado. Al cambiar de agente, solo se muestran las sesiones vinculadas a ese agente y se recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - En anchos de escritorio, los controles del chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo por la transcripción; al desplazarse hacia arriba, volver al inicio o llegar al final se restauran los controles.
    - Los mensajes consecutivos duplicados solo de texto se renderizan como una burbuja con una insignia de conteo. Los mensajes que contienen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo no se contraen.
    - Los selectores de modelo y razonamiento del encabezado del chat parchean la sesión activa de inmediato mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
    - Si envías un mensaje mientras todavía se está guardando un cambio del selector de modelo para la misma sesión, el compositor espera ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` en la UI de Control crea y cambia a la misma sesión de panel nueva que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; en ese caso restablece la sesión principal en su lugar. Escribir `/reset` mantiene el restablecimiento explícito en sitio del Gateway para la sesión actual.
    - El selector de modelo del chat solicita la vista de modelos configurada del Gateway. Si `agents.defaults.models` está presente, esa lista permitida controla el selector, incluidas las entradas `provider/*` que mantienen dinámicos los catálogos con alcance de proveedor. De lo contrario, el selector muestra las entradas explícitas de `models.providers.*.models` más los proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes de uso de sesión recientes del Gateway incluyen tokens de contexto actuales, el área del compositor del chat muestra un indicador compacto de uso de contexto. Cambia a estilo de advertencia ante alta presión de contexto y, en niveles de compaction recomendados, muestra un botón compacto que ejecuta la ruta normal de compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que el Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en navegador)">
    El modo de conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` o un perfil OAuth `openai-codex`; configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor. OpenAI recibe un secreto de cliente Realtime efímero para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por el Gateway. Los proveedores que solo exponen un puente en tiempo real de backend se ejecutan mediante el transporte de retransmisión del Gateway, por lo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPCs autenticados del Gateway. El prompt de la sesión Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un botón de opciones de conversación junto al botón de iniciar/detener conversación. Las opciones se aplican a la siguiente sesión de conversación y pueden anular proveedor, transporte, modelo, voz, esfuerzo de razonamiento, umbral de VAD, duración de silencio y relleno de prefijo. Cuando una opción está en blanco, el Gateway usa los valores predeterminados configurados cuando están disponibles o el valor predeterminado del proveedor. Seleccionar retransmisión de Gateway fuerza la ruta de retransmisión de backend; seleccionar WebRTC mantiene la sesión propiedad del cliente y falla en lugar de recurrir silenciosamente a la retransmisión si el proveedor no puede crear una sesión de navegador.

    En el compositor de Chat, el control de conversación es el botón de ondas junto al botón de dictado por micrófono. Cuando se inicia la conversación, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Smoke en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP WebRTC de navegador de OpenAI, la configuración WebSocket de navegador con token restringido de Google Live y el adaptador de navegador de retransmisión del Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la UI.
    - El Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y Web Push

La UI de Control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

| Superficie                                             | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto de PWA. Los navegadores ofrecen "Instalar app" una vez que es accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (en el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente que se usa para firmar cargas Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción de navegador conservados.                 |

Anula el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La UI de Control usa estos métodos del Gateway con alcance restringido para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método existente `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe la controla `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de embeds alojados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interactivos mientras mantiene el aislamiento de origen; este es el valor predeterminado y suele bastar para juegos/widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Agrega `allow-same-origin` encima de `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más fuertes.
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
Usa `trusted` solo cuando el documento embebido realmente necesite comportamiento de mismo origen. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URLs absolutas externas de embed `http(s)` permanecen bloqueadas de forma predeterminada. Si intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo predeterminado legible. Los despliegues en monitores anchos pueden anularlo sin parchear el CSS incluido configurando `gateway.controlUi.chatMessageMaxWidth`:

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

## Acceso a tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes de Serve de la interfaz de control/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo acepta estas solicitudes cuando llegan a loopback con los encabezados `x-forwarded-*` de Tailscale. Para las sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivos; los navegadores sin dispositivo y las conexiones con rol de nodo siguen pasando por las comprobaciones normales de dispositivo. Define `gateway.auth.allowTailscale: false` si quieres requerir credenciales explícitas de secreto compartido incluso para el tráfico de Serve. Después usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos incorrectos simultáneos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación de Serve sin token presupone que el host del Gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, requiere autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Después abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en los ajustes de la interfaz (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP inseguro solo para localhost mediante `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la interfaz localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del Gateway)

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

    `allowInsecureAuth` es solo un conmutador de compatibilidad local:

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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la interfaz de control y supone una degradación grave de seguridad. Revierte el cambio rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - Una autenticación correcta con proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de la interfaz de control con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación de proxy de confianza; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control se distribuye con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. Las URL de imagen remotas `http(s)` y relativas al protocolo son rechazadas por el navegador y no generan solicitudes de red.

Qué significa esto en la práctica:

- Los avatares y las imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la interfaz obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose (útil para cargas útiles dentro del protocolo).
- Las URL `blob:` locales creadas por la interfaz de control siguen renderizándose.
- Las URL de avatar remotas emitidas por metadatos de canales se eliminan en los helpers de avatar de la interfaz de control y se sustituyen por el logotipo/distintivo integrado, de modo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activo y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de la interfaz de control requiere el mismo token de Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen de avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana de medios del asistente). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que de otro modo están protegidos.
- La propia interfaz de control reenvía el token del Gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a no requerir autenticación, en línea con el resto del Gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del Gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la interfaz de control. El navegador envía el token del Gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imagen, audio, video y documento renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la renderización normal de medios compatible con los elementos multimedia nativos del navegador sin poner credenciales reutilizables del Gateway en URL de medios visibles.

## Compilar la interfaz

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

Después apunta la interfaz a tu URL WS del Gateway (p. ej., `ws://127.0.0.1:18789`).

## Página en blanco de la interfaz de control

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la aplicación del módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no está registrado después del arranque.

Usa la acción **Intentar de nuevo** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Desactiva las extensiones que se inyectan en todas las páginas, especialmente las extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La interfaz de control son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto es práctico cuando quieres ejecutar el servidor de desarrollo de Vite localmente pero el Gateway se ejecuta en otro lugar.

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
    - Si pasas un endpoint completo `ws://` o `wss://` mediante `gatewayUrl`, codifica como URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del bootstrap.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la interfaz no recurre a credenciales de configuración o de entorno. Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway está detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues no loopback de la interfaz de control deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Esto incluye configuraciones de desarrollo remotas.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del bind y el puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con el host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de fallback de origen por encabezado Host, pero es un modo de seguridad peligroso.

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

Detalles de configuración del acceso remoto: [Acceso remoto](/es/gateway/remote).

## Relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de salud](/es/gateway/health) — supervisión de salud del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
