---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, nodos, configuración)
title: Interfaz de usuario de control
x-i18n:
    generated_at: "2026-05-07T13:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

La UI de Control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no se carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el intercambio inicial de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del panel de control conserva un token para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente genera un token de gateway para la autenticación con secreto compartido en la primera conexión, pero la autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la UI de Control desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para evitar el acceso no autorizado.

**Lo que verás:** "disconnected (1008): pairing required"

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

Si el navegador reintenta el emparejamiento con detalles de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administrador, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide que apruebes explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

<Note>
- Las conexiones directas de navegador por local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir la ida y vuelta de emparejamiento para sesiones de operador de la UI de Control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo aún requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La UI de Control admite una identidad personal por navegador (nombre visible y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se conserva del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la anulación del avatar del asistente. Los avatares de asistente cargados superponen la identidad resuelta por el gateway solo en el navegador local y nunca hacen ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue estando disponible para clientes que no son UI y escriben el campo directamente (como gateways con scripts o paneles de control personalizados).

## Endpoint de configuración en tiempo de ejecución

La UI de Control obtiene su configuración en tiempo de ejecución desde `/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idioma

La UI de Control puede localizarse en la primera carga según la configuración regional de tu navegador. Para cambiarla más tarde, abre **Overview -> Gateway Access -> Language**. El selector de configuración regional está en la tarjeta Gateway Access, no en Appearance.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en futuras visitas.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales que no son en inglés, pero el selector de idioma integrado de Mintlify del sitio de documentación está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) aún se genera en el repositorio de publicación; puede que no aparezcan en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Appearance conserva los temas integrados Claw, Knot y Dash, además de un espacio de importación tweakcn local del navegador. Para importar un tema, abre [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Share** y pega el enlace de tema copiado en Appearance. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil actual del navegador. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza el único espacio local; borrarlo cambia el tema activo de vuelta a Claw si el tema importado estaba seleccionado.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y Talk">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente delimitada con límites de texto por mensaje para que las sesiones grandes no obliguen al navegador a renderizar una carga completa de transcripción antes de que el chat sea utilizable.
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso sobre WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente empiezan con `talk.client.create`; las sesiones de retransmisión del Gateway empiezan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio` y reenvía llamadas de herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo de OpenClaw configurado más grande.
    - Transmite llamadas de herramientas y tarjetas de salida de herramientas en vivo en Chat (eventos del agente).

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canales mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas de proveedores, y las instantáneas parciales se etiquetan cuando un sondeo o una auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia y actualización (`system-presence`).
    - Sesiones: lista sesiones de agentes configurados de forma predeterminada, recurre desde claves obsoletas de sesión de agentes no configurados y aplica anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, interruptor de activación/desactivación y lector de Diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodos, aprobaciones de exec">
    - Trabajos Cron: listar/agregar/editar/ejecutar/activar/desactivar e historial de ejecución (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Nodos: lista y capacidades (`node.list`).
    - Aprobaciones de exec: editar listas de permitidos de gateway o nodo y política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar y reiniciar con validación (`config.apply`) y despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) verifican previamente la resolución activa de SecretRef para referencias en la carga de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de escribir.
    - Renderización de esquema y formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/arreglo/composición, además de esquemas de Plugin y canal cuando están disponibles); el editor JSON sin procesar está disponible solo cuando la instantánea tiene una ida y vuelta sin procesar segura.
    - Si una instantánea no puede hacer una ida y vuelta segura de texto sin procesar, la UI de Control fuerza el modo Formulario y desactiva el modo Sin procesar para esa instantánea.
    - El editor JSON sin procesar "Reset to saved" conserva la forma creada sin procesar (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer ida y vuelta de forma segura.
    - Los valores estructurados de objeto SecretRef se renderizan como de solo lectura en entradas de texto del formulario para evitar la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de la UI de Control, tiempos lentos de renderización de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada PerformanceObserver.
    - Registros: seguimiento en vivo de registros de archivos del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecuta una actualización de paquete/git y reinicia (`update.run`) con un informe de reinicio; luego sondea `update.status` después de reconectar para verificar la versión del gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega tiene como valor predeterminado anunciar resumen. Puedes cambiarla a none si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar anulación de agente, opciones cron exacto/escalonado, anulaciones de modelo/thinking del agente y conmutadores de entrega de mejor esfuerzo.
    - La validación de formulario es inline con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token de portador dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Alternativa obsoleta: los trabajos heredados almacenados con `notify: true` aún pueden usar `cron.webhook` hasta que se migren.

  </Accordion>
</AccordionGroup>

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos de `chat`.
    - Las cargas de chat aceptan imágenes además de archivos que no sean video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño por seguridad de la UI. Cuando las entradas de la transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Las imágenes del asistente/generadas se conservan como referencias de medios administrados y se devuelven mediante URL de medios autenticadas de Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen en base64 sin procesar permanezcan en la respuesta del historial de chat.
    - Al renderizar `chat.history`, la Control UI elimina del texto visible del asistente las etiquetas de directivas en línea solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control de modelo ASCII/de ancho completo filtrados, y omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de acuse de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales una vez que el historial de Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción duradera de la sesión. Después de los eventos finales de herramientas, la Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de la transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega por canal).
    - El encabezado del chat muestra el filtro de agente antes del selector de sesión, y el selector de sesión queda acotado al agente seleccionado. Al cambiar de agente se muestran solo las sesiones vinculadas a ese agente y se recurre a la sesión principal de ese agente cuando todavía no tiene sesiones de panel guardadas.
    - En anchos de escritorio, los controles de chat permanecen en una sola fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al inicio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados que solo contienen texto se renderizan como una única burbuja con una insignia de recuento. Los mensajes que contienen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo no se contraen.
    - Los selectores de modelo y razonamiento del encabezado de chat aplican parches a la sesión activa inmediatamente mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
    - Escribir `/new` en la Control UI crea y cambia a la misma sesión nueva de panel que Nuevo chat. Escribir `/reset` mantiene el restablecimiento explícito in situ de Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelos configurada de Gateway. Si `agents.defaults.models` está presente, esa lista permitida controla el selector. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` además de proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión de Gateway incluyen tokens de contexto actuales, el área del compositor de chat muestra un indicador compacto de uso de contexto. Cambia a estilo de advertencia con alta presión de contexto y, en los niveles de Compaction recomendados, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo conversación (tiempo real en navegador)">
    El modo conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más `talk.realtime.providers.openai.apiKey`, o configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API estándar del proveedor. OpenAI recibe un secreto efímero de cliente Realtime para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por Gateway. Los proveedores que solo exponen un puente backend en tiempo real se ejecutan mediante el transporte de retransmisión de Gateway, por lo que las credenciales y sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticados de Gateway. El prompt de sesión Realtime lo ensambla Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    En el compositor de Chat, el control de conversación es el botón de ondas junto al botón de dictado por micrófono. Cuando se inicia Talk, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Prueba de humo en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el intercambio SDP de WebRTC del navegador con OpenAI, la configuración de WebSocket del navegador con token restringido de Google Live y el adaptador de navegador de retransmisión de Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y cancelar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para cancelar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para cancelar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial tras cancelación">
    - Cuando se cancela una ejecución, el texto parcial del asistente todavía puede mostrarse en la UI.
    - Gateway conserva el texto parcial cancelado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores de la transcripción puedan distinguir los parciales cancelados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y web push

La Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

| Superficie                                             | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto de PWA. Los navegadores ofrecen "Instalar app" una vez que está accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID autogenerado usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador conservados.                |

Anula el par de claves VAPID mediante variables de entorno en el proceso de Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La Control UI usa estos métodos de Gateway restringidos por ámbito para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método existente `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Inserciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de las inserciones alojadas.
  </Tab>
  <Tab title="scripts (predeterminado)">
    Permite inserciones interactivas mientras mantiene el aislamiento de origen; es el valor predeterminado y suele bastar para juegos/widgets de navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` encima de `allow-scripts` para documentos del mismo sitio que intencionalmente necesitan privilegios más fuertes.
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
Usa `trusted` solo cuando el documento insertado realmente necesita comportamiento de mismo origen. Para la mayoría de juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL externas absolutas de inserción `http(s)` permanecen bloqueadas de forma predeterminada. Si intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, configura `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo legible predeterminado. Los despliegues en monitores anchos pueden anularlo sin parchear el CSS incluido configurando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Los valores admitidos incluyen longitudes y porcentajes simples como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso a tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo la acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el ciclo de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivo. Configura `gateway.auth.allowTailscale: false` si quieres requerir credenciales explícitas de secreto compartido incluso para tráfico Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host de gateway es de confianza. Si código local no confiable puede ejecutarse en ese host, exige autenticación con token/contraseña.
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

Si abres el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la UI de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador en la UI de control mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del Gateway)

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

    `allowInsecureAuth` es solo una opción de compatibilidad local:

    - Permite que las sesiones de la UI de control en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la UI de control y supone una degradación grave de la seguridad. Revierte el cambio rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - Una autenticación correcta con proxy de confianza puede admitir sesiones de la UI de control de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de la UI de control con rol de Node.
    - Los proxies inversos de loopback del mismo host siguen sin satisfacer la autenticación con proxy de confianza; consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

La UI de control se distribuye con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y no realiza solicitudes de red.

Lo que esto significa en la práctica:

- Los avatares e imágenes servidos en rutas relativas (por ejemplo, `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatares autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose (útil para cargas útiles dentro del protocolo).
- Las URL `blob:` locales creadas por la UI de control siguen renderizándose.
- Las URL de avatares remotos emitidas por metadatos de canales se eliminan en los ayudantes de avatar de la UI de control y se sustituyen por el logotipo/distintivo integrado, de modo que un canal comprometido o malicioso no pueda forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de la UI de control requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen de avatar solo a llamantes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana de medios del asistente). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que, por lo demás, están protegidos.
- La propia UI de control reenvía el token del Gateway como encabezado bearer al obtener avatares, y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también queda sin autenticar, en línea con el resto del Gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del Gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal de operador de la UI de control. El navegador envía el token del Gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, vídeo y documentos renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar una fuente distinta.

Esto mantiene el renderizado normal de medios compatible con elementos multimedia nativos del navegador sin poner credenciales reutilizables del Gateway en URL de medios visibles.

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

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto resulta práctico cuando quieres ejecutar el servidor de desarrollo de Vite localmente pero el Gateway se ejecuta en otro lugar.

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

    Autenticación opcional de un solo uso (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica como URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como respaldo, y se eliminan inmediatamente después del arranque.
    - `password` se conserva solo en memoria.
    - Cuando `gatewayUrl` está definido, la UI no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues de la UI de control que no sean local loopback deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Esto incluye configuraciones de desarrollo remoto.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del bind y puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con el host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo de respaldo de origen por encabezado Host, pero es un modo de seguridad peligroso.

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
