---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso por Tailnet sin túneles SSH
summary: Control UI basada en navegador para el Gateway (chat, nodes, configuración)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T14:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (navegador)

La Control UI es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Habla **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se suministra durante el handshake del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy confiable cuando `gateway.auth.mode: "trusted-proxy"`

El panel de ajustes del dashboard conserva un token para la sesión de pestaña actual del navegador
y la URL del Gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente
genera un token del Gateway para autenticación con secreto compartido en la primera conexión, pero la
autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la Control UI desde un navegador o dispositivo nuevo, el Gateway
requiere una **aprobación única de emparejamiento**; incluso si estás en la misma Tailnet
con `gateway.auth.allowTailscale: true`. Esta es una medida de seguridad para evitar
accesos no autorizados.

**Lo que verás:** "disconnected (1008): pairing required"

**Para aprobar el dispositivo:**

```bash
# Lista las solicitudes pendientes
openclaw devices list

# Aprueba por ID de solicitud
openclaw devices approve <requestId>
```

Si el navegador vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave
pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo
`requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a
acceso de escritura/admin, esto se trata como una ampliación de aprobación, no como una
reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión
más amplia y te pide que apruebes explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos
que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta
[CLI de dispositivos](/es/cli/devices) para rotación y revocación de tokens.

**Notas:**

- Las conexiones directas del navegador por local loopback (`127.0.0.1` / `localhost`) se
  aprueban automáticamente.
- Las conexiones del navegador por Tailnet y LAN siguen requiriendo aprobación explícita, incluso cuando
  se originan en la misma máquina.
- Cada perfil del navegador genera un ID de dispositivo único, por lo que cambiar de navegador o
  borrar los datos del navegador requerirá volver a emparejar.

## Identidad personal (local del navegador)

La Control UI admite una identidad personal por navegador (nombre para mostrar y
avatar) asociada a los mensajes salientes para atribución en sesiones compartidas. Vive
en el almacenamiento del navegador, tiene ámbito del perfil actual del navegador y no se
sincroniza con otros dispositivos ni se conserva en el servidor más allá de los metadatos normales
de autoría en la transcripción de los mensajes que realmente envías. Borrar los datos del sitio o
cambiar de navegador la restablece a vacío.

## Endpoint de configuración de runtime

La Control UI obtiene sus ajustes de runtime desde
`/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma
autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden
obtenerlo, y una obtención exitosa requiere un token/contraseña válidos del Gateway,
identidad de Tailscale Serve o identidad de proxy confiable.

## Compatibilidad de idiomas

La Control UI puede localizarse en la primera carga según la configuración regional de tu navegador.
Para cambiarla más tarde, abre **Overview -> Gateway Access -> Language**. El
selector de configuración regional está en la tarjeta Gateway Access, no en Appearance.

- Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones que no están en inglés se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción ausentes recurren al inglés.

## Qué puede hacer (hoy)

- Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Transmitir llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente)
- Canales: estado, inicio de sesión QR y configuración por canal para canales integrados y de Plugins integrados/externos (`channels.status`, `web.login.*`, `config.patch`)
- Instancias: lista de presencia + actualización (`system-presence`)
- Sesiones: lista + sobrescrituras por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: estado de Dreaming, interruptor de activación/desactivación y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabajos de Cron: listar/añadir/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`)
- Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de clave de API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprobaciones de exec: editar listas de permitidos del Gateway o del node + política ask para `exec host=gateway/node` (`exec.approvals.*`)
- Configuración: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuración: aplicar + reiniciar con validación (`config.apply`) y activar la última sesión activa
- Las escrituras de configuración incluyen una protección por hash base para evitar sobrescribir ediciones concurrentes
- Las escrituras de configuración (`config.set`/`config.apply`/`config.patch`) también comprueban previamente la resolución activa de SecretRef para referencias en la carga útil de configuración enviada; las referencias activas enviadas no resueltas se rechazan antes de escribir
- Esquema de configuración + renderizado de formularios (`config.schema` / `config.schema.lookup`,
  incluidos `title` / `description` del campo, indicios de UI coincidentes, resúmenes inmediatos
  de hijos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición,
  además de esquemas de Plugin + canal cuando están disponibles); el editor **Raw JSON** está
  disponible solo cuando la instantánea tiene un round-trip sin procesar seguro
- Si una instantánea no puede hacer un round-trip seguro de texto sin procesar, la Control UI fuerza el modo Form y desactiva el modo Raw para esa instantánea
- El botón "Reset to saved" del editor Raw JSON conserva la forma creada en raw (formato, comentarios, diseño `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un reset cuando la instantánea puede hacer round-trip con seguridad
- Los valores de objetos SecretRef estructurados se renderizan en modo de solo lectura en entradas de texto del formulario para evitar una corrupción accidental de objeto a cadena
- Depuración: instantáneas de status/health/models + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`)
- Registros: cola en vivo de los registros de archivo del Gateway con filtro/exportación (`logs.tail`)
- Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con informe de reinicio

Notas del panel de trabajos de Cron:

- Para trabajos aislados, la entrega usa por defecto un resumen anunciado. Puedes cambiarla a none si quieres ejecuciones solo internas.
- Los campos de canal/destino aparecen cuando se selecciona announce.
- El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL válida HTTP(S) de Webhook.
- Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
- Los controles avanzados de edición incluyen delete-after-run, limpiar sobrescritura de agente, opciones exact/stagger de Cron,
  sobrescrituras de modelo/thinking del agente y alternancias de entrega best-effort.
- La validación del formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta corregirlos.
- Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el Webhook se envía sin encabezado de autenticación.
- Alternativa obsoleta: los trabajos heredados almacenados con `notify: true` todavía pueden usar `cron.webhook` hasta que se migren.

## Comportamiento del chat

- `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
- Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
- Las respuestas de `chat.history` están limitadas por tamaño para la seguridad de la UI. Cuando las entradas de la transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados con un placeholder (`[chat.history omitted: message too large]`).
- `chat.history` también elimina etiquetas directivas en línea solo para visualización del texto visible del asistente (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens filtrados de control del modelo en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
- `chat.inject` añade una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución del agente ni entrega al canal).
- Los selectores de modelo y thinking del encabezado del chat modifican inmediatamente la sesión activa mediante `sessions.patch`; son sobrescrituras persistentes de sesión, no opciones de envío de un solo turno.
- Stop:
  - Haz clic en **Stop** (llama a `chat.abort`)
  - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda
  - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión
- Conservación parcial al abortar:
  - Cuando se aborta una ejecución, el texto parcial del asistente puede seguir mostrándose en la UI
  - El Gateway conserva en el historial de transcripción el texto parcial abortado del asistente cuando existe salida almacenada en buffer
  - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir parciales abortados de salidas normales completadas

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`.
La política de sandbox del iframe se controla mediante
`gateway.controlUi.embedSandbox`:

- `strict`: desactiva la ejecución de scripts dentro de embeds alojados
- `scripts`: permite embeds interactivos manteniendo el aislamiento de origen; este es
  el predeterminado y suele bastar para juegos/widgets de navegador autocontenidos
- `trusted`: añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio
  que intencionadamente necesiten privilegios más fuertes

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
comportamiento de mismo origen. Para la mayoría de juegos y canvases interactivos generados por el agente, `scripts` es
la opción más segura.

Las URL externas absolutas de embed `http(s)` siguen bloqueadas de forma predeterminada. Si
intencionadamente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso por Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

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
`gateway.auth.allowTailscale: false` si quieres requerir credenciales explícitas de secreto compartido
incluso para tráfico de Serve. Entonces usa `gateway.auth.mode: "token"` o
`"password"`.
Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP de cliente
y el mismo ámbito de autenticación se serializan antes de las escrituras del límite de tasa. Por ello, reintentos concurrentes erróneos
desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud
en lugar de dos desajustes simples compitiendo en paralelo.
La autenticación sin token de Serve asume que el host del Gateway es confiable. Si puede ejecutarse
código local no confiable en ese host, exige autenticación por token/contraseña.

### Bind a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Luego abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

Pega el secreto compartido correspondiente en los ajustes de la UI (enviado como
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP inseguro

Si abres el dashboard sobre HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`),
el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada,
OpenClaw **bloquea** las conexiones de la Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad de HTTP inseguro solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador en la Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- modo de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del Gateway)

**Comportamiento del interruptor de autenticación insegura:**

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

- Permite que las sesiones de la Control UI en localhost continúen sin identidad de dispositivo en
  contextos HTTP no seguros.
- No evita las comprobaciones de emparejamiento.
- No relaja los requisitos remotos (no localhost) de identidad de dispositivo.

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

`dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la Control UI y es una
degradación grave de seguridad. Revierte el cambio rápidamente después de usarlo en una emergencia.

Nota sobre proxy confiable:

- una autenticación correcta mediante proxy confiable puede admitir sesiones de **operator** en la Control UI sin
  identidad de dispositivo
- esto **no** se extiende a sesiones de la Control UI con rol node
- los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación de proxy confiable; consulta
  [Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth)

Consulta [Tailscale](/es/gateway/tailscale) para ver la guía de configuración de HTTPS.

## Política de seguridad de contenido

La Control UI se entrega con una política `img-src` estricta: solo se permiten recursos de **mismo origen** y URLs `data:`. Las URLs remotas `http(s)` y relativas al protocolo se rechazan por el navegador y no emiten solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen mostrándose.
- Las URLs en línea `data:image/...` siguen mostrándose (útiles para cargas útiles dentro del protocolo).
- Las URLs remotas de avatar emitidas por metadatos del canal se eliminan en los ayudantes de avatar de la Control UI y se sustituyen por el logo/insignia integrados, de modo que un canal comprometido o malicioso no pueda forzar solicitudes arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: está siempre activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de la Control UI requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamantes autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar con la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas se rechazan (igual que la ruta hermana de assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts protegidos por otros medios.
- La propia Control UI reenvía el token del Gateway como encabezado bearer al obtener avatares, y usa URLs blob autenticadas para que la imagen siga mostrándose en los dashboards.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a ser no autenticada, en línea con el resto del Gateway.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieras URLs fijas de recursos):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo independiente):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La Control UI son archivos estáticos; el destino del WebSocket es configurable y puede ser
distinto del origen HTTP. Esto resulta útil cuando quieres el servidor de desarrollo de Vite
en local pero el Gateway se ejecuta en otro lugar.

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

- `gatewayUrl` se guarda en localStorage después de cargar y se elimina de la URL.
- `token` debe pasarse mediante el fragmento de la URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita fugas en registros de solicitudes y Referer. Los parámetros heredados `?token=` siguen importándose una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
- `password` se conserva solo en memoria.
- Cuando `gatewayUrl` está establecido, la UI no recurre a credenciales de configuración o entorno.
  Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
- Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` solo se acepta en una ventana de nivel superior (no embebida) para evitar clickjacking.
- Las implementaciones de la Control UI que no sean loopback deben establecer `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Esto incluye configuraciones remotas de desarrollo.
- No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo en pruebas locales muy controladas.
  Significa permitir cualquier origen del navegador, no “coincidir con cualquier host que esté
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo alternativo de origen por encabezado Host, pero es un modo de seguridad peligroso.

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

- [Dashboard](/es/web/dashboard) — dashboard del Gateway
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [Comprobaciones de salud](/es/gateway/health) — supervisión de salud del Gateway
