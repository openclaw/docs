---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quiere acceder a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-05-04T05:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99a40ab77276fbc3180aefb103c2dd46804829c7b1b6966a8456ed35b85ed644
    source_path: web/control-ui.md
    workflow: 16
---

La interfaz de control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: define `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no se carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el protocolo de enlace de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del tablero conserva un token para la sesión actual de la pestaña del navegador y la URL del Gateway seleccionada; las contraseñas no se persisten. La incorporación normalmente genera un token del Gateway para autenticación por secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la interfaz de control desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para evitar el acceso no autorizado.

**Qué verás:** "desconectado (1008): se requiere emparejamiento"

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

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administración, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide que apruebes explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

<Note>
- Las conexiones directas del navegador mediante local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir la ida y vuelta de emparejamiento para sesiones de operador de la interfaz de control cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La interfaz de control admite una identidad personal por navegador (nombre visible y avatar) adjunta a los mensajes salientes para la atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil de navegador actual y no se sincroniza con otros dispositivos ni se persiste en el servidor más allá de los metadatos normales de autoría de la transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la sustitución del avatar del asistente. Los avatares del asistente cargados se superponen a la identidad resuelta por el Gateway solo en el navegador local y nunca hacen un viaje de ida y vuelta mediante `config.patch`. El campo de configuración compartida `ui.assistant.avatar` sigue estando disponible para clientes que no son de la interfaz de usuario que escriben el campo directamente (como gateways con scripts o tableros personalizados).

## Endpoint de configuración en tiempo de ejecución

La interfaz de control obtiene su configuración en tiempo de ejecución desde `/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña del Gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idiomas

La interfaz de control puede localizarse en la primera carga según la configuración regional de tu navegador. Para sobrescribirla más tarde, abre **Resumen -> Acceso al Gateway -> Idioma**. El selector de configuración regional vive en la tarjeta Acceso al Gateway, no en Apariencia.

- Configuraciones regionales admitidas: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no están en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes vuelven al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales que no están en inglés, pero el selector de idiomas integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre el [editor tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace del tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL de editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de tema predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil de navegador actual. No se escriben en la configuración del Gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo cambia el tema activo de vuelta a Claw si el tema importado estaba seleccionado.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y voz">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso mediante WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante RPC `talk.realtime.relay*` y envía llamadas a la herramienta `openclaw_agent_consult` de vuelta mediante `chat.send` para el modelo OpenClaw configurado más grande.
    - Transmite llamadas a herramientas y tarjetas de salida de herramientas en vivo en el chat (eventos del agente).

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins incluidos/externos, inicio de sesión QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instancias: lista de presencia y actualización (`system-presence`).
    - Sesiones: lista y sustituciones por sesión de modelo/pensamiento/rápido/detallado/traza/razonamiento (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, alternancia para activar/desactivar y lector de diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodos, aprobaciones de exec">
    - Trabajos de Cron: listar/agregar/editar/ejecutar/activar/desactivar e historial de ejecución (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de clave de API (`skills.*`).
    - Nodos: lista y capacidades (`node.list`).
    - Aprobaciones de exec: editar listas de permitidos del Gateway o nodo y política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar y reiniciar con validación (`config.apply`) y activar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) realizan una comprobación previa de resolución de SecretRef activos para las referencias en la carga de configuración enviada; las referencias enviadas activas no resueltas se rechazan antes de escribir.
    - Esquema y renderizado de formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` del campo, pistas de interfaz coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos de objeto anidado/comodín/matriz/composición, además de esquemas de plugin y canal cuando están disponibles); el editor JSON sin procesar está disponible solo cuando la instantánea tiene una ida y vuelta sin procesar segura.
    - Si una instantánea no puede hacer una ida y vuelta segura del texto sin procesar, la interfaz de control fuerza el modo Formulario y desactiva el modo Sin procesar para esa instantánea.
    - "Restablecer a guardado" del editor JSON sin procesar conserva la forma creada en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer una ida y vuelta segura.
    - Los valores de objeto SecretRef estructurados se renderizan como de solo lectura en entradas de texto de formulario para evitar la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - Registros: seguimiento en vivo de los registros de archivo del Gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git y reiniciar (`update.run`) con un informe de reinicio; luego sondear `update.status` después de reconectar para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos de Cron">
    - Para trabajos aislados, la entrega predeterminada es anunciar resumen. Puedes cambiar a ninguno si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` definido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y ninguno.
    - Los controles de edición avanzados incluyen eliminar después de ejecutar, borrar sustitución de agente, opciones exactas/escalonadas de cron, sustituciones de modelo/pensamiento del agente y alternancias de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Define `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Alternativa obsoleta: los trabajos heredados almacenados con `notify: true` aún pueden usar `cron.webhook` hasta que se migren.

  </Accordion>
</AccordionGroup>

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
    - Las cargas del chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; los demás archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límites de tamaño para proteger la UI. Cuando las entradas de la transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y reemplazar mensajes demasiado grandes por un marcador de posición (`[chat.history omitted: message too large]`).
    - Las imágenes del asistente/generadas se conservan como referencias de medios administrados y se devuelven mediante URLs de medios autenticadas de Gateway, de modo que las recargas no dependan de que las cargas útiles de imágenes base64 sin procesar permanezcan en la respuesta del historial del chat.
    - `chat.history` también elimina del texto visible del asistente etiquetas de directivas en línea solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens de control de modelo ASCII/ancho completo filtrados, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales cuando el historial de Gateway se actualiza.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye a partir de la transcripción duradera de la sesión. Después de los eventos finales de herramienta, la Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` agrega una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente ni entrega por canal).
    - Los selectores de modelo y razonamiento del encabezado del chat aplican parches a la sesión activa inmediatamente mediante `sessions.patch`; son sobrescrituras persistentes de sesión, no opciones de envío de un solo turno.
    - Escribir `/new` en la Control UI crea y cambia a la misma sesión nueva del panel que New Chat. Escribir `/reset` mantiene el restablecimiento explícito in situ de Gateway para la sesión actual.
    - El selector de modelo del chat solicita la vista de modelos configurada de Gateway. Si `agents.defaults.models` está presente, esa lista permitida controla el selector. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` además de proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes nuevos de uso de sesión de Gateway muestran alta presión de contexto, el área del compositor de chat muestra un aviso de contexto y, en niveles de Compaction recomendados, un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas de tokens obsoletas se ocultan hasta que Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en navegador)">
    El modo de conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o configura Google con `talk.provider: "google"` más `talk.providers.google.apiKey`; la configuración del proveedor en tiempo real de Voice Call aún puede reutilizarse como reserva. El navegador nunca recibe una clave de API estándar del proveedor. OpenAI recibe un secreto de cliente Realtime efímero para WebRTC. Google Live recibe un token de autenticación Live API restringido de un solo uso para una sesión WebSocket del navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por Gateway. Los proveedores que solo exponen un puente en tiempo real de backend se ejecutan mediante el transporte de retransmisión de Gateway, por lo que las credenciales y sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPCs autenticados de Gateway. El prompt de sesión Realtime lo ensambla Gateway; `talk.realtime.session` no acepta sobrescrituras de instrucciones proporcionadas por el llamador.

    En el compositor de Chat, el control de conversación es el botón de ondas junto al botón de dictado con micrófono. Cuando se inicia la conversación, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `chat.send`.

    Prueba en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el intercambio SDP de WebRTC del navegador con OpenAI, la configuración WebSocket de navegador con token restringido de Google Live y el adaptador de navegador de retransmisión de Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Stop** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la UI.
    - Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y Web Push

La Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

| Superficie                                             | Qué hace                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                       | Manifiesto de PWA. Los navegadores ofrecen "Install app" cuando es accesible. |
| `ui/public/sw.js`                                      | Service worker que gestiona eventos `push` y clics de notificación. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente y usado para firmar cargas Web Push. |
| `push/web-push-subscriptions.json`                     | Endpoints de suscripción de navegador conservados.                 |

Sobrescribe el par de claves VAPID mediante variables de entorno en el proceso de Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La Control UI usa estos métodos de Gateway limitados por alcance para registrar y probar suscripciones de navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método existente `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Deshabilita la ejecución de scripts dentro de embeds alojados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interactivos mientras mantiene el aislamiento de origen; este es el valor predeterminado y suele bastar para juegos/widgets de navegador autónomos.
  </Tab>
  <Tab title="trusted">
    Agrega `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más fuertes.
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

Las URLs externas absolutas de embeds `http(s)` permanecen bloqueadas de forma predeterminada. Si intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes del chat

Los mensajes agrupados del chat usan un ancho máximo legible predeterminado. Los despliegues en monitores anchos pueden sobrescribirlo sin parchear el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

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
    Mantén Gateway en local loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a local loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite la ronda de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo aún siguen las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para tráfico Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y alcance de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos erróneos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

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

Si abres el panel mediante HTTP plano (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de Control UI de operador mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la interfaz de usuario localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del Gateway)

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

    `allowInsecureAuth` es solo un selector de compatibilidad local:

    - Permite que las sesiones de la interfaz de Control UI de localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remota (no localhost).

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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y supone una degradación grave de seguridad. Revierte el cambio rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Una autenticación de proxy confiable correcta puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a las sesiones de Control UI con rol de nodo.
    - Los proxies inversos de local loopback en el mismo host siguen sin satisfacer la autenticación de proxy confiable; consulta [autenticación de proxy confiable](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

Control UI se entrega con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y no emite solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la interfaz de usuario obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose (útil para cargas de protocolo).
- Las URL `blob:` locales creadas por Control UI siguen renderizándose.
- Las URL remotas de avatar emitidas por metadatos de canal se eliminan en los helpers de avatar de Control UI y se reemplazan por el logotipo/insignia integrado, por lo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de Control UI requiere el mismo token de Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (coincidiendo con la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que, por lo demás, están protegidos.
- Control UI reenvía el token del Gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a no requerir autenticación, en línea con el resto del Gateway.

## Compilar la interfaz de usuario

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

Luego apunta la interfaz de usuario a la URL WS de tu Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

Control UI consiste en archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto resulta práctico cuando quieres usar el servidor de desarrollo de Vite localmente, pero el Gateway se ejecuta en otro lugar.

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

    Autenticación opcional de un solo uso (si hace falta):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica en URL el valor de `gatewayUrl` para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` aún se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está configurado, la interfaz de usuario no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues de Control UI que no sean de loopback deben configurar `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Esto incluye configuraciones de desarrollo remotas.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del enlace y puerto efectivos en tiempo de ejecución, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no “coincidir con cualquier host que esté usando”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de reserva de origen por encabezado Host, pero es un modo de seguridad peligroso.

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

Detalles de configuración del acceso remoto: [acceso remoto](/es/gateway/remote).

## Relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
