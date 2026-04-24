---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso por Tailnet sin túneles SSH
summary: UI de control del Gateway basada en navegador (chat, nodes, configuración)
title: UI de control
x-i18n:
    generated_at: "2026-04-24T09:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

La UI de control es una pequeña app de una sola página construida con **Vite + Lit** y servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se suministra durante el handshake de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de trusted-proxy cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del dashboard mantiene un token para la sesión actual
de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente
genera un token de gateway para autenticación de secreto compartido en la primera conexión, pero la autenticación
por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la UI de control desde un navegador o dispositivo nuevo, el Gateway
requiere una **aprobación de emparejamiento de una sola vez**, incluso si estás en la misma Tailnet
con `gateway.auth.allowTailscale: true`. Esta es una medida de seguridad para evitar
accesos no autorizados.

**Lo que verás:** "disconnected (1008): pairing required"

**Para aprobar el dispositivo:**

```bash
# Listar solicitudes pendientes
openclaw devices list

# Aprobar por ID de solicitud
openclaw devices approve <requestId>
```

Si el navegador vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/scopes/clave
pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y cambias su acceso de lectura a
acceso de escritura/admin, esto se trata como una ampliación de aprobación, no como una
reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión
más amplia y te pide que apruebes explícitamente el nuevo conjunto de permisos.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos
que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta
[Devices CLI](/es/cli/devices) para rotación y revocación de tokens.

**Notas:**

- Las conexiones directas del navegador por loopback local (`127.0.0.1` / `localhost`) se
  aprueban automáticamente.
- Las conexiones del navegador por Tailnet y LAN siguen requiriendo aprobación explícita, incluso cuando
  se originan en la misma máquina.
- Cada perfil de navegador genera un ID de dispositivo único, así que cambiar de navegador o
  borrar los datos del navegador requerirá volver a emparejar.

## Identidad personal (local del navegador)

La UI de control admite una identidad personal por navegador (nombre para mostrar y
avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Se
guarda en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se
sincroniza con otros dispositivos ni se conserva del lado del servidor más allá de los metadatos normales
de autoría en la transcripción de los mensajes que realmente envías. Borrar los datos del sitio o
cambiar de navegador la restablece a vacío.

## Endpoint de configuración en tiempo de ejecución

La UI de control obtiene su configuración en tiempo de ejecución desde
`/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma
autenticación del gateway que el resto de la superficie HTTP: los navegadores sin autenticar no pueden
obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válidos,
identidad de Tailscale Serve o identidad de trusted-proxy.

## Compatibilidad de idioma

La UI de control puede localizarse en la primera carga según el idioma de tu navegador.
Para cambiarlo después, abre **Overview -> Gateway Access -> Language**. El
selector de idioma está en la tarjeta Gateway Access, no en Appearance.

- Idiomas admitidos: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones que no están en inglés se cargan de forma diferida en el navegador.
- El idioma seleccionado se guarda en el almacenamiento del navegador y se reutiliza en futuras visitas.
- Las claves de traducción faltantes vuelven al inglés.

## Qué puede hacer (hoy)

- Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Hablar con OpenAI Realtime directamente desde el navegador mediante WebRTC. El Gateway
  genera un secreto de cliente Realtime de corta duración con `talk.realtime.session`; el
  navegador envía el audio del micrófono directamente a OpenAI y retransmite
  las llamadas a herramienta `openclaw_agent_consult` a través de `chat.send` para el modelo OpenClaw
  configurado más grande.
- Transmitir llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente)
- Channels: estado de canales integrados más canales de Plugin incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances: lista de presencia + actualización (`system-presence`)
- Sessions: lista + overrides por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: estado de Dreaming, interruptor de habilitar/deshabilitar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabajos de Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`)
- Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de claves API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprobaciones de ejecución: editar listas de permitidos del gateway o node + política de pregunta para `exec host=gateway/node` (`exec.approvals.*`)
- Configuración: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuración: aplicar + reiniciar con validación (`config.apply`) y activar la última sesión activa
- Las escrituras de configuración incluyen una protección base-hash para evitar sobrescribir ediciones concurrentes
- Las escrituras de configuración (`config.set`/`config.apply`/`config.patch`) también verifican previamente la resolución activa de SecretRef para refs en la carga útil de configuración enviada; los refs activos enviados sin resolver se rechazan antes de la escritura
- Esquema de configuración + renderizado de formularios (`config.schema` / `config.schema.lookup`,
  incluidos `title` / `description` del campo, pistas de UI coincidentes, resúmenes inmediatos de hijos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición,
  más esquemas de Plugin + channel cuando están disponibles); el editor Raw JSON está
  disponible solo cuando la instantánea tiene un round-trip raw seguro
- Si una instantánea no puede hacer round-trip seguro del texto raw, la UI de control fuerza el modo Form y deshabilita el modo Raw para esa instantánea
- "Reset to saved" del editor Raw JSON conserva la forma escrita en raw (formato, comentarios, diseño `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer round-trip seguro
- Los valores estructurados de objeto SecretRef se renderizan como solo lectura en entradas de texto del formulario para evitar corrupción accidental de objeto a cadena
- Depuración: instantáneas de status/health/models + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`)
- Logs: seguimiento en vivo de logs de archivo del gateway con filtrado/exportación (`logs.tail`)
- Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con informe de reinicio

Notas del panel de trabajos de Cron:

- Para trabajos aislados, la entrega predeterminada es anunciar un resumen. Puedes cambiar a none si quieres ejecuciones solo internas.
- Los campos channel/target aparecen cuando se selecciona announce.
- El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL Webhook HTTP(S) válida.
- Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
- Los controles avanzados de edición incluyen eliminar tras ejecutar, borrar override de agente, opciones exact/stagger de cron,
  overrides de modelo/thinking del agente y toggles de entrega de mejor esfuerzo.
- La validación del formulario es inline con errores a nivel de campo; los valores no válidos deshabilitan el botón de guardar hasta corregirlos.
- Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
- Respaldo obsoleto: los trabajos heredados almacenados con `notify: true` aún pueden usar `cron.webhook` hasta migrarse.

## Comportamiento del chat

- `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
- Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución y `{ status: "ok" }` después de completarse.
- Las respuestas de `chat.history` tienen tamaño limitado por seguridad de UI. Cuando las entradas de la transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador (`[chat.history omitted: message too large]`).
- Las imágenes generadas por el asistente se conservan como referencias de medios administrados y se sirven de vuelta mediante URL de medios autenticadas del Gateway, de modo que las recargas no dependen de que las cargas útiles raw de imagen base64 permanezcan en la respuesta del historial del chat.
- `chat.history` también elimina etiquetas inline de directivas solo para visualización del texto visible del asistente (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens de control del modelo filtrados en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
- `chat.inject` agrega una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones solo de UI (sin ejecución del agente, sin entrega por canal).
- Los selectores de modelo y thinking del encabezado del chat aplican el parche a la sesión activa inmediatamente mediante `sessions.patch`; son overrides persistentes de la sesión, no opciones de envío de un solo turno.
- El modo Talk usa un proveedor de voz realtime registrado que admite sesiones WebRTC en navegador. Configura OpenAI con `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o reutiliza la configuración del proveedor realtime de Voice Call. El navegador nunca recibe la clave API estándar de OpenAI; recibe
  solo el secreto efímero del cliente Realtime. La voz realtime de Google Live es
  compatible para Voice Call de backend y puentes de Google Meet, pero aún no para esta ruta
  WebRTC del navegador. El prompt de la sesión Realtime lo ensambla el Gateway;
  `talk.realtime.session` no acepta overrides de instrucciones proporcionados por el llamador.
- En el compositor de Chat, el control Talk es el botón de ondas junto al
  botón de dictado por micrófono. Cuando Talk comienza, la fila de estado del compositor muestra
  `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o
  `Asking OpenClaw...` mientras una llamada de herramienta realtime consulta el
  modelo configurado más grande a través de `chat.send`.
- Detener:
  - Haz clic en **Stop** (llama a `chat.abort`)
  - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
  - Escribe `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para cancelar fuera de banda
  - `chat.abort` admite `{ sessionKey }` (sin `runId`) para cancelar todas las ejecuciones activas de esa sesión
- Conservación parcial al cancelar:
  - Cuando una ejecución se cancela, el texto parcial del asistente aún puede mostrarse en la UI
  - Gateway conserva el texto parcial cancelado del asistente en el historial de transcripción cuando existe salida en búfer
  - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores de la transcripción puedan distinguir las partes parciales canceladas de la salida normal completada

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado inline con el shortcode `[embed ...]`.
La política de sandbox del iframe se controla mediante
`gateway.controlUi.embedSandbox`:

- `strict`: deshabilita la ejecución de scripts dentro de embeds alojados
- `scripts`: permite embeds interactivos mientras mantiene el aislamiento de origen; este es
  el valor predeterminado y normalmente es suficiente para juegos/widgets del navegador autocontenidos
- `trusted`: agrega `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio
  que intencionalmente necesitan privilegios más altos

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

Usa `trusted` solo cuando el documento embebido realmente necesite comportamiento
de mismo origen. Para la mayoría de los juegos generados por agentes y canvas interactivos, `scripts` es
la opción más segura.

Las URL de embed externas absolutas `http(s)` siguen bloqueadas de forma predeterminada. Si
intencionadamente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso por Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantén el Gateway en loopback y deja que Tailscale Serve haga de proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

De forma predeterminada, las solicitudes de Serve a la UI de control/WebSocket pueden autenticarse mediante encabezados de identidad de Tailscale
(`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw
verifica la identidad resolviendo la dirección `x-forwarded-for` con
`tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la
solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Establece
`gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido
incluso para el tráfico de Serve. Luego usa `gateway.auth.mode: "token"` o
`"password"`.
Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP de cliente
y el mismo ámbito de autenticación se serializan antes de escribir los límites de tasa. Por lo tanto, reintentos incorrectos concurrentes
desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud
en lugar de dos discrepancias simples compitiendo en paralelo.
La autenticación de Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable
en ese host, exige autenticación por token/contraseña.

### Enlazar a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Luego abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

Pega el secreto compartido correspondiente en la configuración de la UI (enviado como
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP inseguro

Si abres el dashboard por HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`),
el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada,
OpenClaw **bloquea** las conexiones de la UI de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad localhost-only con HTTP inseguro mediante `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de la UI de control de operador mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

**Comportamiento del toggle de autenticación insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` es solo un toggle de compatibilidad local:

- Permite que las sesiones localhost de la UI de control continúen sin identidad de dispositivo en
  contextos HTTP no seguros.
- No omite las comprobaciones de emparejamiento.
- No relaja los requisitos de identidad de dispositivo remota (no localhost).

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

`dangerouslyDisableDeviceAuth` deshabilita las comprobaciones de identidad de dispositivo de la UI de control y supone
una degradación grave de seguridad. Reviértelo rápidamente después de usarlo en una emergencia.

Nota sobre trusted-proxy:

- una autenticación correcta de trusted-proxy puede admitir sesiones **operator** de la UI de control sin
  identidad de dispositivo
- esto **no** se extiende a sesiones de la UI de control con rol node
- los proxies inversos loopback del mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta
  [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth)

Consulta [Tailscale](/es/gateway/tailscale) para orientación sobre la configuración HTTPS.

## Política de seguridad de contenido

La UI de control se entrega con una política `img-src` estricta: solo se permiten recursos de **mismo origen** y URL `data:`. Las URL de imágenes remotas `http(s)` y relativas a protocolo son rechazadas por el navegador y no generan solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen mostrándose.
- Las URL inline `data:image/...` siguen mostrándose (útiles para cargas útiles dentro del protocolo).
- Las URL remotas de avatar emitidas por metadatos del canal se eliminan en los helpers de avatar de la UI de control y se reemplazan por el logotipo/insignia integrado, de modo que un canal comprometido o malicioso no puede forzar solicitudes remotas arbitrarias de imágenes desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la UI de control requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas se rechazan (igual que la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que por lo demás están protegidos.
- La propia UI de control reenvía el token del gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga mostrándose en dashboards.

Si deshabilitas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a no autenticarse, en línea con el resto del gateway.

## Construir la UI

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

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el destino WebSocket es configurable y puede ser
distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite
en local, pero el Gateway se ejecuta en otra parte.

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

- `gatewayUrl` se guarda en `localStorage` después de cargar y se elimina de la URL.
- `token` debería pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita fugas en logs de solicitudes y en Referer. Los parámetros heredados `?token=` de query siguen importándose una vez por compatibilidad, pero solo como respaldo, y se eliminan inmediatamente después del bootstrap.
- `password` se mantiene solo en memoria.
- Cuando `gatewayUrl` está establecido, la UI no recurre a credenciales de configuración ni de entorno.
  Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
- Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` solo se acepta en una ventana de nivel superior (no embebida) para evitar clickjacking.
- Las implementaciones de la UI de control que no sean loopback deben establecer `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Esto incluye configuraciones de desarrollo remoto.
- No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo en pruebas locales muy controladas.
  Significa permitir cualquier origen del navegador, no “coincidir con cualquier host que esté
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen con encabezado Host, pero es un modo de seguridad peligroso.

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

Detalles de configuración del acceso remoto: [Remote access](/es/gateway/remote).

## Relacionado

- [Dashboard](/es/web/dashboard) — dashboard del gateway
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [Health Checks](/es/gateway/health) — supervisión del estado del gateway
