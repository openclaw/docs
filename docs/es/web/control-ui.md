---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso de Tailnet sin túneles SSH
summary: UI de control basada en navegador para el Gateway (chat, Nodes, configuración)
title: UI de control
x-i18n:
    generated_at: "2026-04-24T05:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

La UI de control es una pequeña app de una sola página con **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: configura `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Habla **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se suministra durante el handshake del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de ajustes del dashboard conserva un token para la sesión de la pestaña actual del navegador
y la URL del gateway seleccionada; las contraseñas no se persisten. El onboarding normalmente
genera un token de gateway para autenticación por secreto compartido en la primera conexión, pero la
autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la UI de control desde un navegador o dispositivo nuevo, el Gateway
requiere una **aprobación de emparejamiento de una sola vez**, incluso si estás en el mismo Tailnet
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

Si el navegador reintenta el emparejamiento con detalles de autenticación cambiados (rol/scopes/clave
pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y cambias de acceso de lectura a acceso de
escritura/admin, esto se trata como una mejora de aprobación, no como una reconexión
silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión más amplia
y te pide aprobar explícitamente el nuevo conjunto de scopes.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación salvo
que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta
[CLI de Devices](/es/cli/devices) para rotación de tokens y revocación.

**Notas:**

- Las conexiones directas del navegador por local loopback (`127.0.0.1` / `localhost`) se
  aprueban automáticamente.
- Las conexiones del navegador por Tailnet y LAN siguen requiriendo aprobación explícita, incluso cuando
  se originan desde la misma máquina.
- Cada perfil del navegador genera un ID de dispositivo único, así que cambiar de navegador o
  borrar los datos del navegador requerirá volver a emparejar.

## Identidad personal (local del navegador)

La UI de control admite una identidad personal por navegador (nombre para mostrar y
avatar) asociada a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se persiste en el servidor más allá de los metadatos normales de autoría del transcript en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

## Endpoint de configuración de runtime

La UI de control obtiene su configuración de runtime desde
`/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma
autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden
obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válidos,
identidad de Tailscale Serve o identidad de proxy de confianza.

## Compatibilidad de idiomas

La UI de control puede localizarse en la primera carga según la configuración regional de tu navegador.
Para cambiarla más tarde, abre **Overview -> Gateway Access -> Language**. El
selector de idioma está en la tarjeta Gateway Access, no en Appearance.

- Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones que no son inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción ausentes recurren al inglés.

## Qué puede hacer (hoy)

- Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Hablar con OpenAI Realtime directamente desde el navegador mediante WebRTC. El Gateway
  genera un secreto de cliente Realtime de corta duración con `talk.realtime.session`; el
  navegador envía audio del micrófono directamente a OpenAI y retransmite las llamadas a herramientas
  `openclaw_agent_consult` a través de `chat.send` para el modelo OpenClaw configurado más grande.
- Transmitir llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente)
- Canales: estado de canales integrados más canales Plugin empaquetados/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instancias: lista de presencia + actualización (`system-presence`)
- Sesiones: lista + sobrescrituras por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: estado de Dreaming, interruptor para habilitar/deshabilitar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabajos de Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`)
- Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de API key (`skills.*`)
- Nodes: lista + caps (`node.list`)
- Aprobaciones de exec: editar allowlists del gateway o Node + política ask para `exec host=gateway/node` (`exec.approvals.*`)
- Configuración: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuración: aplicar + reiniciar con validación (`config.apply`) y reactivar la última sesión activa
- Las escrituras de configuración incluyen una protección por hash base para evitar sobrescribir ediciones concurrentes
- Las escrituras de configuración (`config.set`/`config.apply`/`config.patch`) también realizan una comprobación previa de resolución activa de SecretRef para referencias incluidas en la carga útil de configuración enviada; las referencias activas enviadas no resueltas se rechazan antes de escribir
- Esquema de configuración + renderizado de formularios (`config.schema` / `config.schema.lookup`,
  incluidos `title` / `description` del campo, sugerencias de UI coincidentes, resúmenes inmediatos de hijos, metadatos de documentación en nodos anidados de objeto/comodín/arreglo/composición,
  además de esquemas de Plugin + canal cuando están disponibles); el editor Raw JSON
  solo está disponible cuando el snapshot tiene un round-trip raw seguro
- Si un snapshot no puede hacer round-trip de texto raw con seguridad, la UI de control fuerza el modo Form y desactiva el modo Raw para ese snapshot
- En el editor Raw JSON, "Reset to saved" conserva la forma creada en raw (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar un snapshot aplanado, de modo que las ediciones externas sobreviven a un reset cuando el snapshot puede hacer round-trip con seguridad
- Los valores de objetos SecretRef estructurados se renderizan como solo lectura en las entradas de texto del formulario para evitar corrupción accidental de objeto a cadena
- Depuración: snapshots de estado/health/models + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`)
- Registros: tail en vivo de logs de archivo del gateway con filtro/exportación (`logs.tail`)
- Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con informe de reinicio

Notas del panel de trabajos de Cron:

- Para trabajos aislados, la entrega usa por defecto anuncio de resumen. Puedes cambiar a none si quieres ejecuciones solo internas.
- Los campos channel/target aparecen cuando se selecciona announce.
- El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` configurado como una URL Webhook HTTP(S) válida.
- Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
- Los controles avanzados de edición incluyen delete-after-run, clear agent override, opciones exact/stagger de cron,
  sobrescrituras de model/thinking del agente y toggles de entrega best-effort.
- La validación del formulario es inline con errores a nivel de campo; los valores no válidos desactivan el botón de guardado hasta corregirse.
- Configura `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
- Respaldo obsoleto: los trabajos heredados almacenados con `notify: true` todavía pueden usar `cron.webhook` hasta que se migren.

## Comportamiento del chat

- `chat.send` es **no bloqueante**: responde inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
- Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está ejecutándose, y `{ status: "ok" }` después de completarse.
- Las respuestas de `chat.history` están limitadas en tamaño por seguridad de la UI. Cuando las entradas del transcript son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y reemplazar mensajes sobredimensionados con un placeholder (`[chat.history omitted: message too large]`).
- Las imágenes del asistente/generadas se persisten como referencias de medios gestionadas y se vuelven a servir mediante URLs de medios autenticadas del Gateway, de modo que las recargas no dependan de que las cargas útiles de imágenes raw en base64 permanezcan en la respuesta de historial del chat.
- `chat.history` también elimina del texto visible del asistente las etiquetas inline solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluyendo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control del modelo filtrados en ASCII/full-width, y omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
- `chat.inject` agrega una nota del asistente al transcript de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega a canal).
- Los selectores del encabezado del chat para modelo y thinking modifican la sesión activa inmediatamente mediante `sessions.patch`; son sobrescrituras persistentes de sesión, no opciones de envío de un solo turno.
- El modo Talk usa el proveedor de voz realtime registrado. Configura OpenAI con
  `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o reutiliza la
  configuración del proveedor realtime de Voice Call. El navegador nunca recibe la API key estándar de OpenAI; recibe
  solo el secreto efímero del cliente Realtime. El prompt de la sesión Realtime lo ensambla el Gateway; `talk.realtime.session`
  no acepta sobrescrituras de instrucciones proporcionadas por el llamante.
- En el composer de Chat, el control Talk es el botón de ondas junto al botón
  de dictado por micrófono. Cuando empieza Talk, la fila de estado del composer muestra
  `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o
  `Asking OpenClaw...` mientras una llamada a herramienta realtime consulta el
  modelo OpenClaw configurado más grande mediante `chat.send`.
- Detener:
  - Haz clic en **Stop** (llama a `chat.abort`)
  - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
  - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda
  - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión
- Retención parcial en aborto:
  - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la UI
  - El Gateway persiste el texto parcial abortado del asistente en el historial del transcript cuando existe salida en búfer
  - Las entradas persistidas incluyen metadatos de aborto para que los consumidores del transcript puedan distinguir parciales abortados de salidas de finalización normal

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado inline con el shortcode `[embed ...]`.
La política de sandbox de iframe se controla mediante
`gateway.controlUi.embedSandbox`:

- `strict`: desactiva la ejecución de scripts dentro de embeds alojados
- `scripts`: permite embeds interactivos manteniendo el aislamiento de origen; este es
  el valor predeterminado y normalmente es suficiente para juegos/widgets de navegador autocontenidos
- `trusted`: añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio
  que intencionadamente necesitan privilegios más amplios

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

Usa `trusted` solo cuando el documento embebido realmente necesite
comportamiento same-origin. Para la mayoría de juegos generados por el agente y canvases interactivos, `scripts` es
la opción más segura.

Las URL de embed externas absolutas `http(s)` siguen bloqueadas por defecto. Si
intencionadamente quieres que `[embed url="https://..."]` cargue páginas de terceros, configura
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso de Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantén el Gateway en loopback y deja que Tailscale Serve lo proxyee con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

De forma predeterminada, las solicitudes de Control UI/WebSocket a través de Serve pueden autenticarse mediante encabezados de identidad de Tailscale
(`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw
verifica la identidad resolviendo la dirección `x-forwarded-for` con
`tailscale whois` y comparándola con el encabezado, y solo acepta esto cuando la
solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Configura
`gateway.auth.allowTailscale: false` si quieres requerir credenciales explícitas de secreto compartido
incluso para tráfico de Serve. Luego usa `gateway.auth.mode: "token"` o
`"password"`.
Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP de cliente
y el mismo ámbito de autenticación se serializan antes de las escrituras de rate limit. Por lo tanto,
reintentos erróneos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud
en lugar de dos simples discrepancias compitiendo en paralelo.
La autenticación de Serve sin token asume que el host del gateway es confiable. Si puede ejecutarse código local no confiable en ese host, exige autenticación por token/contraseña.

### Vincular a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Luego abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

Pega el secreto compartido correspondiente en los ajustes de la UI (se envía como
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP inseguro

Si abres el dashboard por HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`),
el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada,
OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad de HTTP inseguro solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Corrección recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

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

`allowInsecureAuth` es solo un toggle local de compatibilidad:

- Permite que las sesiones de Control UI en localhost continúen sin identidad de dispositivo en
  contextos HTTP no seguros.
- No omite las comprobaciones de emparejamiento.
- No relaja los requisitos de identidad de dispositivo remotos (no localhost).

**Solo para emergencia:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y supone una
grave reducción de seguridad. Reviértelo rápidamente después del uso de emergencia.

Nota sobre trusted-proxy:

- una autenticación correcta mediante trusted-proxy puede admitir sesiones de Control UI de **operator** sin
  identidad de dispositivo
- esto **no** se extiende a sesiones de Control UI con rol Node
- los proxies inversos loopback del mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta
  [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre configuración HTTPS.

## Política de seguridad de contenido

La UI de control incluye una política `img-src` estricta: solo se permiten recursos de **same-origin** y URLs `data:`. Las URLs remotas `http(s)` y relativas al protocolo son rechazadas por el navegador y no generan solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose.
- Las URLs inline `data:image/...` siguen renderizándose (útil para cargas útiles dentro del protocolo).
- Las URLs remotas de avatar emitidas por metadatos del canal se eliminan en los helpers de avatar de la Control UI y se sustituyen por el logo/badge integrado, de modo que un canal comprometido o malicioso no pueda forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activo y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la Control UI requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamantes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar con la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas se rechazan (igual que la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que por lo demás están protegidos.
- La propia Control UI reenvía el token del gateway como encabezado bearer al obtener avatares, y usa blob URLs autenticadas para que la imagen siga renderizándose en los dashboards.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también queda sin autenticación, en línea con el resto del gateway.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieres URLs de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo independiente):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el destino WebSocket es configurable y puede ser
distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite
localmente pero el Gateway se ejecuta en otro lugar.

1. Inicia el servidor de desarrollo de la UI: `pnpm ui:dev`
2. Abre una URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticación opcional de una sola vez (si hace falta):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notas:

- `gatewayUrl` se almacena en localStorage tras la carga y se elimina de la URL.
- `token` debería pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en logs de solicitudes y en Referer. Los parámetros heredados `?token=` siguen importándose una vez por compatibilidad, pero solo como respaldo, y se eliminan inmediatamente después del bootstrap.
- `password` se mantiene solo en memoria.
- Cuando `gatewayUrl` está configurado, la UI no recurre a credenciales de configuración ni del entorno.
  Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
- Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` solo se acepta en una ventana de nivel superior (no embebida) para evitar clickjacking.
- Los despliegues de Control UI que no sean loopback deben configurar explícitamente `gateway.controlUi.allowedOrigins`
  (orígenes completos). Esto incluye configuraciones remotas de desarrollo.
- No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo en pruebas locales muy controladas.
  Significa permitir cualquier origen del navegador, no “hacer coincidir cualquier host que esté
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen por encabezado Host, pero es un modo de seguridad peligroso.

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
- [Health Checks](/es/gateway/health) — monitorización de estado del gateway
