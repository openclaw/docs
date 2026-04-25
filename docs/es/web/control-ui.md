---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso de Tailnet sin túneles SSH
summary: Interfaz de usuario de control basada en navegador para el Gateway (chat, nodes, configuración)
title: UI de control
x-i18n:
    generated_at: "2026-04-25T18:22:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

La UI de control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en la misma computadora, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no se carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el handshake del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del dashboard conserva un token para la sesión actual de la pestaña del navegador
y la URL del gateway seleccionada; las contraseñas no se guardan. El onboarding normalmente
genera un token de gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación
con contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la UI de control desde un navegador o dispositivo nuevo, el Gateway
requiere una **aprobación de emparejamiento de una sola vez**, incluso si estás en la misma Tailnet
con `gateway.auth.allowTailscale: true`. Esta es una medida de seguridad para evitar
acceso no autorizado.

**Lo que verás:** "disconnected (1008): pairing required"

**Para aprobar el dispositivo:**

```bash
# Lista solicitudes pendientes
openclaw devices list

# Aprueba por ID de solicitud
openclaw devices approve <requestId>
```

Si el navegador vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/scopes/clave
pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a
acceso de escritura/admin, esto se trata como una mejora de aprobación, no como una
reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión
más amplia y te pide que apruebes explícitamente el nuevo conjunto de scopes.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos
que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta
[CLI de dispositivos](/es/cli/devices) para rotación y revocación de tokens.

**Notas:**

- Las conexiones directas del navegador por local loopback (`127.0.0.1` / `localhost`) se
  aprueban automáticamente.
- Las conexiones del navegador por Tailnet y LAN siguen requiriendo aprobación explícita, incluso cuando
  provienen de la misma máquina.
- Cada perfil del navegador genera un id de dispositivo único, por lo que cambiar de navegador o
  borrar los datos del navegador requerirá volver a emparejar.

## Identidad personal (local del navegador)

La UI de control admite una identidad personal por navegador (nombre para mostrar y
avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Se
almacena en el navegador, está limitada al perfil actual del navegador y no se
sincroniza con otros dispositivos ni se guarda del lado del servidor más allá de los metadatos normales
de autoría en la transcripción de los mensajes que realmente envías. Borrar los datos del sitio o
cambiar de navegador la restablece a vacío.

El mismo patrón local del navegador se aplica a la anulación del avatar del asistente.
Los avatares del asistente cargados superponen la identidad resuelta por el gateway solo en el
navegador local y nunca pasan por `config.patch`. El campo compartido de configuración
`ui.assistant.avatar` sigue disponible para clientes no UI que escriben el campo directamente
(como gateways con scripts o dashboards personalizados).

## Endpoint de configuración de runtime

La UI de control obtiene su configuración de runtime desde
`/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma
autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden
obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válido,
identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idiomas

La UI de control puede localizarse en la primera carga según la configuración regional de tu navegador.
Para anularla más tarde, abre **Overview -> Gateway Access -> Language**. El
selector de idioma está en la tarjeta Gateway Access, no en Appearance.

- Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones que no están en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes usan inglés como respaldo.

## Qué puede hacer (hoy)

- Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Hablar directamente con OpenAI Realtime desde el navegador mediante WebRTC. El Gateway
  genera un secreto de cliente Realtime de corta duración con `talk.realtime.session`; el
  navegador envía audio del micrófono directamente a OpenAI y retransmite
  llamadas de herramientas `openclaw_agent_consult` a través de `chat.send` para el modelo
  OpenClaw configurado más grande.
- Transmitir llamadas de herramientas + tarjetas de salida en vivo de herramientas en Chat (eventos del agente)
- Canales: estado de canales integrados más canales de plugins empaquetados/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instancias: lista de presencia + actualización (`system-presence`)
- Sesiones: lista + anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: estado de Dreaming, interruptor de habilitar/deshabilitar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabajos Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecución (`cron.*`)
- Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de clave API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprobaciones de Exec: editar listas de permitidos del gateway o node + política ask para `exec host=gateway/node` (`exec.approvals.*`)
- Configuración: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuración: aplicar + reiniciar con validación (`config.apply`) y despertar la última sesión activa
- Las escrituras de configuración incluyen una protección base-hash para evitar sobrescribir ediciones concurrentes
- Las escrituras de configuración (`config.set`/`config.apply`/`config.patch`) también hacen una verificación previa de la resolución activa de SecretRef para refs en la carga útil de configuración enviada; las refs activas enviadas no resueltas se rechazan antes de la escritura
- Esquema de configuración + renderizado de formularios (`config.schema` / `config.schema.lookup`,
  incluyendo `title` / `description` del campo, sugerencias de UI coincidentes, resúmenes
  inmediatos de hijos, metadatos de documentación en nodos anidados de objeto/wildcard/arreglo/composición,
  además de esquemas de plugins + canales cuando están disponibles); el editor Raw JSON
  está disponible solo cuando la instantánea tiene un round-trip raw seguro
- Si una instantánea no puede hacer round-trip de texto raw de forma segura, la UI de control fuerza el modo Form y desactiva el modo Raw para esa instantánea
- El editor Raw JSON "Reset to saved" conserva la forma creada en raw (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, para que las ediciones externas sobrevivan a un restablecimiento cuando la instantánea puede hacer round-trip de forma segura
- Los valores de objeto Structured SecretRef se renderizan como solo lectura en entradas de texto de formulario para evitar corrupción accidental de objeto a cadena
- Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`)
- Logs: cola en vivo de logs de archivo del gateway con filtro/exportación (`logs.tail`)
- Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con un informe de reinicio

Notas del panel de trabajos Cron:

- Para trabajos aislados, la entrega usa de forma predeterminada un resumen de anuncio. Puedes cambiar a none si quieres ejecuciones solo internas.
- Los campos de canal/destino aparecen cuando se selecciona announce.
- El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL Webhook HTTP(S) válida.
- Para trabajos de sesión principal, los modos de entrega webhook y none están disponibles.
- Los controles avanzados de edición incluyen delete-after-run, borrar anulación del agente, opciones exact/stagger de cron,
  anulaciones del modelo/thinking del agente y toggles de entrega de best-effort.
- La validación del formulario es inline con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta corregirlos.
- Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
- Respaldo obsoleto: los trabajos heredados almacenados con `notify: true` aún pueden usar `cron.webhook` hasta migrarse.

## Comportamiento del chat

- `chat.send` es **no bloqueante**: confirma de inmediato con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
- Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` después de completarse.
- Las respuestas de `chat.history` están limitadas en tamaño por seguridad de la UI. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados con un marcador (`[chat.history omitted: message too large]`).
- Las imágenes del asistente/generadas se conservan como referencias de medios administradas y se sirven de vuelta mediante URLs autenticadas de medios del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial del chat.
- `chat.history` también elimina etiquetas inline de directivas solo de visualización del texto visible del asistente (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas útiles XML de llamadas a herramientas en texto plano (incluyendo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens de control de modelo filtrados en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
- Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes optimistas locales del usuario/asistente si `chat.history` devuelve brevemente una instantánea más antigua; la transcripción canónica reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
- `chat.inject` agrega una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones solo de la UI (sin ejecución del agente ni entrega por canal).
- Los selectores de modelo y thinking en el encabezado del chat aplican un parche a la sesión activa inmediatamente mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío de un solo turno.
- Cuando los informes recientes de uso de sesión del Gateway muestran alta presión de contexto, el área del compositor del chat muestra un aviso de contexto y, en niveles recomendados de Compaction, un botón de compactar que ejecuta la ruta normal de Compaction de sesión. Las instantáneas obsoletas de tokens se ocultan hasta que el Gateway informe nuevamente de uso reciente.
- El modo Talk usa un proveedor registrado de voz en tiempo real que admite sesiones WebRTC en el navegador. Configura OpenAI con `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o reutiliza la configuración del proveedor en tiempo real de Voice Call. El navegador nunca recibe la clave API estándar de OpenAI; recibe solo el secreto efímero del cliente Realtime. La voz en tiempo real de Google Live es compatible con el backend de Voice Call y puentes de Google Meet, pero todavía no con esta ruta WebRTC del navegador. El prompt de sesión Realtime lo ensambla el Gateway; `talk.realtime.session` no acepta anulaciones de instrucciones proporcionadas por quien llama.
- En el compositor del chat, el control Talk es el botón de ondas junto al botón de dictado por micrófono. Cuando Talk se inicia, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada de herramienta en tiempo real consulta al modelo configurado más grande mediante `chat.send`.
- Detener:
  - Haz clic en **Stop** (llama a `chat.abort`)
  - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
  - Escribe `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda
  - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión
- Conservación parcial al abortar:
  - Cuando una ejecución se aborta, el texto parcial del asistente aún puede mostrarse en la UI
  - El Gateway conserva en el historial de la transcripción el texto parcial abortado del asistente cuando existe salida en búfer
  - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de la transcripción puedan distinguir los parciales abortados de la salida de finalización normal

## Instalación como PWA y Web Push

La UI de control incluye `manifest.webmanifest` y un service worker, por lo que
los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el
Gateway active la PWA instalada con notificaciones incluso cuando la pestaña o la
ventana del navegador no está abierta.

| Superficie                                            | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto de PWA. Los navegadores ofrecen "Install app" una vez que es accesible. |
| `ui/public/sw.js`                                     | Service worker que maneja eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente y usado para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador conservados.                |

Anula el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando
quieras fijar claves (para implementaciones en varios hosts, rotación de secretos o
pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La UI de control usa estos métodos del Gateway limitados por scope para registrar y
probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción de quien llama.

Web Push es independiente de la ruta de relay APNS de iOS
(consulte [Configuración](/es/gateway/configuration) para push respaldado por relay) y
del método existente `push.test`, que apunta al emparejamiento móvil nativo.

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado inline con el shortcode `[embed ...]`.
La política sandbox del iframe se controla mediante
`gateway.controlUi.embedSandbox`:

- `strict`: desactiva la ejecución de scripts dentro de embeds alojados
- `scripts`: permite embeds interactivos manteniendo el aislamiento de origen; este es
  el valor predeterminado y suele ser suficiente para juegos/widgets autocontenidos en el navegador
- `trusted`: agrega `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio
  que intencionalmente necesitan privilegios más amplios

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

Usa `trusted` solo cuando el documento embebido realmente necesite comportamiento del mismo origen.
Para la mayoría de juegos generados por agentes y lienzos interactivos, `scripts` es
la opción más segura.

Las URLs absolutas externas de embed `http(s)` siguen bloqueadas de forma predeterminada. Si
intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso por Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantén el Gateway en loopback y deja que Tailscale Serve lo proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

De forma predeterminada, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale
(`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw
verifica la identidad resolviendo la dirección `x-forwarded-for` con
`tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la
solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Establece
`gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido
incluso para tráfico de Serve. Luego usa `gateway.auth.mode: "token"` o
`"password"`.
Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP de cliente
y el mismo scope de autenticación se serializan antes de las escrituras de límite de velocidad. Por lo tanto,
los reintentos simultáneos fallidos desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud
en lugar de dos discrepancias simples compitiendo en paralelo.
La autenticación de Serve sin token asume que el host del gateway es confiable. Si puede ejecutarse código local no confiable en ese host, exige autenticación por token/contraseña.

### Bind a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Luego abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

Pega el secreto compartido correspondiente en la configuración de la UI (enviado como
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP inseguro

Si abres el dashboard a través de HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`),
el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada,
OpenClaw **bloquea** las conexiones de la UI de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP inseguro solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador en la UI de control mediante `gateway.auth.mode: "trusted-proxy"`
- opción extrema `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

**Comportamiento de la opción de autenticación insegura:**

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

- Permite que las sesiones de la UI de control en localhost continúen sin identidad de dispositivo en
  contextos HTTP no seguros.
- No omite las comprobaciones de emparejamiento.
- No relaja los requisitos remotos (no localhost) de identidad de dispositivo.

**Solo para emergencias:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la UI de control y supone una
grave degradación de seguridad. Revierte el cambio rápidamente después de un uso de emergencia.

Nota sobre trusted-proxy:

- una autenticación correcta mediante trusted-proxy puede admitir sesiones de UI de control de **operador** sin
  identidad de dispositivo
- esto **no** se extiende a sesiones de UI de control con rol de node
- los proxies inversos loopback del mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta
  [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

Consulta [Tailscale](/es/gateway/tailscale) para orientación sobre la configuración HTTPS.

## Política de seguridad de contenido

La UI de control se distribuye con una política `img-src` estricta: solo se permiten recursos **del mismo origen**, URLs `data:` y URLs `blob:` generadas localmente. Las URLs remotas `http(s)` y las URLs de imagen relativas al protocolo son rechazadas por el navegador y no generan solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen mostrándose, incluidas las rutas autenticadas de avatares que la UI obtiene y convierte en URLs `blob:` locales.
- Las URLs inline `data:image/...` siguen mostrándose (útil para cargas útiles dentro del protocolo).
- Las URLs `blob:` locales creadas por la UI de control siguen mostrándose.
- Las URLs remotas de avatar emitidas por metadatos del canal se eliminan en los helpers de avatar de la UI de control y se reemplazan con el logo/insignia integrado, de modo que un canal comprometido o malicioso no pueda forzar solicitudes remotas arbitrarias de imágenes desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la UI de control requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a quienes están autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de estas rutas se rechazan (igual que la ruta hermana de medios del asistente). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que, por lo demás, están protegidos.
- La propia UI de control reenvía el token del gateway como encabezado bearer al obtener avatares, y usa URLs `blob:` autenticadas para que la imagen siga mostrándose en los dashboards.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta del avatar también pasa a no autenticada, en línea con el resto del gateway.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieras URLs de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo independiente):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el destino del WebSocket es configurable y puede ser
distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite
localmente pero el Gateway se ejecuta en otro lugar.

1. Inicia el servidor de desarrollo de la UI: `pnpm ui:dev`
2. Abre una URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticación opcional de una sola vez (si es necesaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notas:

- `gatewayUrl` se almacena en `localStorage` después de la carga y se elimina de la URL.
- `token` debe pasarse mediante el fragmento de la URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en logs de solicitudes y de Referer. Los parámetros heredados `?token=` en la query siguen importándose una vez por compatibilidad, pero solo como respaldo, y se eliminan inmediatamente después del arranque.
- `password` se conserva solo en memoria.
- Cuando se establece `gatewayUrl`, la UI no recurre a credenciales de configuración ni del entorno.
  Proporciona `token` (o `password`) explícitamente. La falta de credenciales explícitas es un error.
- Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` solo se acepta en una ventana de nivel superior (no embebida) para evitar clickjacking.
- Las implementaciones de UI de control que no usan loopback deben establecer `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Esto incluye configuraciones remotas de desarrollo.
- No uses `gateway.controlUi.allowedOrigins: ["*"]` excepto para pruebas locales
  estrictamente controladas. Significa permitir cualquier origen del navegador, no “hacer coincidir cualquier host que esté
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen basado en encabezado Host, pero es un modo de seguridad peligroso.

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

- [Dashboard](/es/web/dashboard) — dashboard del gateway
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del gateway
