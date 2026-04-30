---
read_when:
    - Quiere operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, nodos, configuración)
title: Interfaz de control
x-i18n:
    generated_at: "2026-04-30T06:07:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI es una pequeña aplicación de página única **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (p. ej. `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no se carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el handshake de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del panel conserva un token para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada; las contraseñas no se persisten. El onboarding suele generar un token de gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la Control UI desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación de emparejamiento de un solo uso**. Esta es una medida de seguridad para evitar accesos no autorizados.

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

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administración, esto se trata como una actualización de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia y te pide que apruebes explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo queda recordado y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para la rotación y revocación de tokens.

<Note>
- Las conexiones directas de navegador local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el ida y vuelta de emparejamiento para sesiones de operador de la Control UI cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.

</Note>

## Identidad personal (local del navegador)

La Control UI admite una identidad personal por navegador (nombre visible y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripciones en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la anulación del avatar del asistente. Los avatares de asistente cargados superponen la identidad resuelta por el gateway solo en el navegador local y nunca hacen ida y vuelta mediante `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes que no son UI y escriben el campo directamente (como gateways con scripts o paneles personalizados).

## Endpoint de configuración en tiempo de ejecución

La Control UI obtiene su configuración de tiempo de ejecución desde `/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idiomas

La Control UI puede localizarse en la primera carga según la configuración regional de tu navegador. Para cambiarlo más tarde, abre **Resumen -> Acceso al Gateway -> Idioma**. El selector de configuración regional está en la tarjeta de Acceso al Gateway, no en Apariencia.

- Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Las traducciones que no son en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales que no son en inglés, pero el selector de idioma integrado del sitio de documentación de Mintlify está limitado a los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) se sigue generando en el repositorio de publicación; es posible que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia conserva los temas integrados Claw, Knot y Dash, además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre [temas de tweakcn](https://tweakcn.com/themes), elige o crea un tema, haz clic en **Compartir** y pega el enlace de tema copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin procesar y nombres de temas predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil actual del navegador. No se escriben en la configuración del gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo cambia el tema activo de nuevo a Claw si el tema importado estaba seleccionado.

## Lo que puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y Hablar">
    - Chatea con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Habla mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso sobre WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante RPCs `talk.realtime.relay*` y envía llamadas de herramienta `openclaw_agent_consult` de vuelta mediante `chat.send` para el modelo OpenClaw configurado más grande.
    - Transmite llamadas de herramienta + tarjetas de salida de herramienta en vivo en Chat (eventos de agente).

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins incluidos/externos, inicio de sesión con QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instancias: lista de presencia + actualización (`system-presence`).
    - Sesiones: lista + anulaciones por sesión de modelo/pensamiento/rápido/detallado/traza/razonamiento (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, conmutador de activar/desactivar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, aprobaciones de exec">
    - Trabajos Cron: listar/agregar/editar/ejecutar/activar/desactivar + historial de ejecuciones (`cron.*`).
    - Skills: estado, activar/desactivar, instalar, actualizaciones de claves de API (`skills.*`).
    - Node: lista + capacidades (`node.list`).
    - Aprobaciones de exec: editar listas de permitidos de gateway o Node + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar + reiniciar con validación (`config.apply`) y despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) hacen una comprobación previa de resolución de SecretRef activos para las refs en la carga útil de configuración enviada; las refs activas enviadas que no se puedan resolver se rechazan antes de escribir.
    - Esquema + renderizado de formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` de campo, sugerencias de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición, además de esquemas de plugin + canal cuando están disponibles); el editor JSON sin procesar solo está disponible cuando la instantánea tiene un ida y vuelta sin procesar seguro.
    - Si una instantánea no puede hacer de forma segura el ida y vuelta de texto sin procesar, Control UI fuerza el modo Formulario y desactiva el modo Sin procesar para esa instantánea.
    - En el editor JSON sin procesar, "Restablecer a guardado" conserva la forma escrita sin procesar (formato, comentarios, disposición de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer de forma segura el ida y vuelta.
    - Los valores de objeto SecretRef estructurados se renderizan como de solo lectura en entradas de texto de formulario para evitar la corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - Registros: seguimiento en vivo de registros de archivo del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con un informe de reinicio, luego consultar `update.status` después de reconectar para verificar la versión del gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega predeterminada es anunciar resumen. Puedes cambiar a ninguno si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, los modos de entrega webhook y ninguno están disponibles.
    - Los controles de edición avanzados incluyen eliminar después de ejecutar, borrar anulación de agente, opciones exactas/escalonadas de cron, anulaciones de modelo/pensamiento de agente y conmutadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Alternativa obsoleta: los trabajos heredados almacenados con `notify: true` todavía pueden usar `cron.webhook` hasta que migren.

  </Accordion>
</AccordionGroup>

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
    - Las cargas del chat aceptan imágenes y archivos que no sean de video. Las imágenes conservan la ruta de imagen nativa; otros archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con el mismo `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño por seguridad de la UI. Cuando las entradas de transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes demasiado grandes por un marcador de posición (`[chat.history omitted: message too large]`).
    - Las imágenes asistente/generadas se conservan como referencias de medios administrados y se devuelven mediante URL de medios autenticadas de Gateway, por lo que las recargas no dependen de que las cargas útiles de imágenes base64 sin procesar permanezcan en la respuesta del historial de chat.
    - `chat.history` también elimina del texto visible del asistente las etiquetas de directivas en línea solo para visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control del modelo filtrados en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea anterior; la transcripción canónica reemplaza esos mensajes locales cuando el historial de Gateway se pone al día.
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente ni entrega por canal).
    - Los selectores de modelo y razonamiento del encabezado del chat aplican un parche inmediato a la sesión activa mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
    - El selector de modelo del chat solicita la vista de modelos configurada de Gateway. Si `agents.defaults.models` está presente, esa lista de permitidos dirige el selector. De lo contrario, el selector muestra entradas explícitas de `models.providers.*.models` y proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión de Gateway muestran alta presión de contexto, el área del compositor de chat muestra un aviso de contexto y, en niveles recomendados de compaction, un botón de compactar que ejecuta la ruta normal de compaction de sesión. Las instantáneas de tokens obsoletas se ocultan hasta que Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo de conversación (tiempo real en navegador)">
    El modo de conversación usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o configura Google con `talk.provider: "google"` más `talk.providers.google.apiKey`; la configuración del proveedor en tiempo real de Voice Call todavía puede reutilizarse como alternativa. El navegador nunca recibe una clave API estándar del proveedor. OpenAI recibe un secreto de cliente efímero de Realtime para WebRTC. Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket de navegador, con instrucciones y declaraciones de herramientas bloqueadas en el token por Gateway. Los proveedores que solo exponen un puente en tiempo real de backend se ejecutan mediante el transporte de retransmisión de Gateway, de modo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticados de Gateway. El prompt de sesión Realtime lo ensambla Gateway; `talk.realtime.session` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    En el compositor de Chat, el control de conversación es el botón de ondas junto al botón de dictado por micrófono. Cuando se inicia la conversación, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `chat.send`.

    Prueba en vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el intercambio SDP WebRTC del navegador con OpenAI, la configuración WebSocket de navegador con token restringido de Google Live y el adaptador de navegador de retransmisión de Gateway con medios de micrófono falsos. El comando imprime solo el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se encolan. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial tras aborto">
    - Cuando se aborta una ejecución, todavía puede mostrarse texto parcial del asistente en la UI.
    - Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y Web Push

La Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como PWA independiente. Web Push permite que Gateway active la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no está abierta.

| Superficie                                             | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto PWA. Los navegadores ofrecen "Instalar app" cuando está accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics de notificaciones. |
| `push/vapid-keys.json` (en el directorio de estado de OpenClaw) | Par de claves VAPID autogenerado usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción de navegador conservados.                 |

Anula el par de claves VAPID mediante variables de entorno en el proceso de Gateway cuando quieras fijar claves (para despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (el valor predeterminado es `mailto:openclaw@localhost`)

La Control UI usa estos métodos de Gateway restringidos por alcance para registrar y probar suscripciones de navegador:

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
  <Tab title="scripts (predeterminado)">
    Permite embeds interactivos y mantiene el aislamiento de origen; este es el valor predeterminado y suele bastar para juegos/widgets de navegador autónomos.
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
Usa `trusted` solo cuando el documento incrustado realmente necesite comportamiento de mismo origen. Para la mayoría de juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL absolutas externas de embeds `http(s)` permanecen bloqueadas de forma predeterminada. Si quieres permitir intencionalmente que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso a tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo de navegador, esta ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivo. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para tráfico Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad Serve, los intentos de autenticación fallidos para la misma IP de cliente y alcance de autenticación se serializan antes de las escrituras de límite de tasa. Por tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token presupone que el host de gateway es de confianza. Si código local no confiable puede ejecutarse en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Luego abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en los ajustes de la UI (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP plano (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Corrección recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host de gateway)

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

    - Permite que las sesiones de Control UI en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
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
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y supone una degradación grave de seguridad. Revierte el cambio rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - La autenticación de proxy de confianza correcta puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a las sesiones de Control UI con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación de proxy de confianza; consulta [autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

Control UI se distribuye con una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y no realiza solicitudes de red.

Lo que esto significa en la práctica:

- Los avatares y las imágenes servidos bajo rutas relativas (por ejemplo, `/avatars/<id>`) siguen representándose, incluidas las rutas de avatares autenticadas que la IU obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen representándose (útil para cargas en el protocolo).
- Las URL `blob:` locales creadas por Control UI siguen representándose.
- Las URL de avatares remotas emitidas por los metadatos del canal se eliminan en los auxiliares de avatar de Control UI y se reemplazan por el logotipo/distintivo integrado, por lo que un canal comprometido o malicioso no puede forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activo y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de Control UI requiere el mismo token de Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas se rechazan (igual que la ruta hermana de medios del asistente). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que, por lo demás, están protegidos.
- Control UI reenvía el token del Gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga representándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a no estar autenticada, en línea con el resto del Gateway.

## Compilar la IU

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

Luego apunta la IU a tu URL WS del Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

Control UI son archivos estáticos; el destino WebSocket es configurable y puede ser diferente del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite localmente, pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Iniciar el servidor de desarrollo de la IU">
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
    - Cuando `gatewayUrl` está definido, la IU no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway está detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues de Control UI que no sean de loopback deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Esto incluye configuraciones de desarrollo remotas.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no "coincidir con el host que estoy usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo de alternativa de origen por encabezado Host, pero es un modo de seguridad peligroso.

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

Detalles de configuración de acceso remoto: [acceso remoto](/es/gateway/remote).

## Relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión de estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
