---
read_when:
    - Necesita la semántica exacta de configuración a nivel de campo o los valores predeterminados
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración de Gateway para claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-04-30T05:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia de configuración central para `~/.openclaw/openclaw.json`. Para una descripción orientada a tareas, consulta [Configuración](/es/gateway/configuration).

Cubre las principales superficies de configuración de OpenClaw y enlaza a otras páginas cuando un subsistema tiene su propia referencia más detallada. Los catálogos de comandos propios de canales y plugins, y los ajustes profundos de memoria/QMD, viven en sus propias páginas en lugar de esta.

Fuente de verdad del código:

- `openclaw config schema` imprime el esquema JSON activo usado para validación y la Control UI, con metadatos integrados de paquetes/plugins/canales fusionados cuando están disponibles
- `config.schema.lookup` devuelve un nodo de esquema limitado a una ruta para herramientas de exploración detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash base de la documentación de configuración contra la superficie de esquema actual

Ruta de consulta del agente: usa la acción de herramienta `gateway` `config.schema.lookup` para
documentación y restricciones exactas a nivel de campo antes de editar. Usa
[Configuración](/es/gateway/configuration) para orientación orientada a tareas y esta página
para el mapa de campos más amplio, los valores predeterminados y los enlaces a referencias de subsistemas.

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming bajo `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados + empaquetados
- páginas del canal/plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios + comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Las claves de configuración por canal se movieron a una página dedicada; consulta
[Configuración — canales](/es/gateway/config-channels) para `channels.*`,
incluidos Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros
canales empaquetados (autenticación, control de acceso, múltiples cuentas, control de menciones).

## Valores predeterminados de agente, múltiples agentes, sesiones y mensajes

Se movió a una página dedicada; consulta
[Configuración — agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, multimedia, Skills, sandbox)
- `multiAgent.*` (enrutamiento y vinculaciones de múltiples agentes)
- `session.*` (ciclo de vida de sesión, Compaction, poda)
- `messages.*` (entrega de mensajes, TTS, renderizado de markdown)
- `talk.*` (modo Talk)
  - `talk.speechLocale`: id de configuración regional BCP 47 opcional para reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no está configurado, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)

## Herramientas y proveedores personalizados

La política de herramientas, los interruptores experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de
proveedor / URL base personalizada se movieron a una página dedicada; consulta
[Configuración — herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, listas de modelos permitidos y configuración de proveedores personalizados viven en
[Configuración — herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
La raíz `models` también posee el comportamiento global del catálogo de modelos.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por id de proveedor.
- `models.pricing.enabled`: controla el arranque en segundo plano de precios. Cuando es
  `false`, el inicio del Gateway omite las cargas de catálogos de precios de OpenRouter y LiteLLM;
  los valores configurados de `models.providers.*.models[].cost` siguen funcionando para estimaciones de costo locales.

## MCP

Las definiciones de servidor MCP administradas por OpenClaw viven bajo `mcp.servers` y son
consumidas por Pi integrado y otros adaptadores de runtime. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` administran este bloque sin conectarse al
servidor de destino durante las ediciones de configuración.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definiciones con nombre de servidor MCP stdio o remoto para runtimes que
  exponen herramientas MCP configuradas.
  Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP empaquetados con alcance de sesión.
  Las ejecuciones integradas de una sola vez solicitan limpieza al final de la ejecución; este TTL es el respaldo para
  sesiones de larga duración y llamadores futuros.
- Los cambios bajo `mcp.*` se aplican en caliente descartando runtimes MCP de sesión en caché.
  El siguiente descubrimiento/uso de herramientas los recrea desde la nueva configuración, por lo que las entradas
  `mcp.servers` eliminadas se recolectan de inmediato en lugar de esperar al TTL de inactividad.

Consulta [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[backends de CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para el comportamiento de runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista opcional de permitidos solo para Skills empaquetadas (las Skills administradas/de espacio de trabajo no se ven afectadas).
- `load.extraDirs`: raíces compartidas adicionales de Skills (menor precedencia).
- `install.preferBrew`: cuando es true, prefiere instaladores Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desactiva una Skill aunque esté empaquetada/instalada.
- `entries.<skillKey>.apiKey`: conveniencia para Skills que declaran una variable de entorno primaria (cadena de texto plano u objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Se carga desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, además de `plugins.load.paths`.
- El descubrimiento acepta plugins nativos de OpenClaw más paquetes Codex compatibles y paquetes Claude, incluidos paquetes Claude de diseño predeterminado sin manifiesto.
- **Los cambios de configuración requieren reiniciar el gateway.**
- `allow`: lista opcional de permitidos (solo se cargan los plugins listados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniencia de clave API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con alcance de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora campos que mutan prompts desde el `before_agent_start` heredado, mientras conserva los `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y directorios de hooks proporcionados por paquetes compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, plugins confiables no empaquetados pueden leer contenido bruto de conversaciones desde hooks tipados como `llm_input`, `llm_output`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar anulaciones de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista opcional de permitidos de destinos canónicos `provider/model` para anulaciones confiables de subagentes. Usa `"*"` solo cuando quieras permitir intencionalmente cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema del plugin nativo de OpenClaw cuando está disponible).
- La configuración de cuenta/runtime del plugin de canal vive bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del plugin propietario, no mediante un registro central de opciones de OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, el `tools.web.fetch.firecrawl.apiKey` heredado o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminado: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: edad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web Grok).
  - `enabled`: activa el proveedor X Search.
  - `model`: modelo Grok que se usará para la búsqueda (p. ej. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (predeterminado `false`).
  - `frequency`: cadencia cron para cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: anulación opcional de modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínalo con `allowedModels` para restringir destinos. Los errores de modelo no disponible reintentan una vez con el modelo predeterminado de la sesión; los fallos de confianza o lista de permitidos no recurren silenciosamente.
  - la política de fases y los umbrales son detalles de implementación (no claves de configuración orientadas al usuario).
- La configuración completa de memoria vive en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins de paquete Claude activados también pueden contribuir valores predeterminados de Pi integrado desde `settings.json`; OpenClaw los aplica como configuraciones de agente saneadas, no como parches brutos de configuración de OpenClaw.
- `plugins.slots.memory`: elige el id del plugin de memoria activo, o `"none"` para desactivar plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.

Consulta [Plugins](/es/tools/plugin).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desactiva `act:evaluate` y `wait --fn`.
- `tabCleanup` recupera las pestañas de agente principal rastreadas después del tiempo de inactividad o cuando una
  sesión supera su límite. Establece `idleMinutes: 0` o `maxTabsPerSession: 0` para
  desactivar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado cuando no se establece, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfil CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad/detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de acoplamiento (inicio/detención/restablecimiento desactivados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw detecte `/json/version`; usa WS(S)
  cuando tu proveedor te proporcione una URL WebSocket directa de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad CDP remota y
  `attachOnly`, además de las solicitudes de apertura de pestañas. Los perfiles
  local loopback administrados conservan los valores predeterminados locales de CDP.
- Si se puede acceder a un servicio CDP administrado externamente mediante local loopback, establece
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de local loopback como un
  perfil de navegador local administrado y puede informar errores de propiedad de puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden acoplarse en
  el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para apuntar a un
  perfil de navegador basado en Chromium específico, como Brave o Edge.
- Los perfiles `existing-session` conservan los límites de ruta actuales de Chrome MCP:
  acciones basadas en instantáneas/referencias en lugar de segmentación por selector CSS, hooks de carga
  de un archivo, sin anulaciones de tiempo de espera de diálogos, sin `wait --load networkidle` y sin
  `responsebody`, exportación a PDF, intercepción de descargas ni acciones por lotes.
- Los perfiles `openclaw` locales administrados asignan automáticamente `cdpPort` y `cdpUrl`; solo
  establece `cdpUrl` explícitamente para CDP remoto.
- Los perfiles locales administrados pueden establecer `executablePath` para anular el
  `browser.executablePath` global para ese perfil. Usa esto para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles locales administrados usan `browser.localLaunchTimeoutMs` para la detección HTTP de Chrome CDP
  después del inicio del proceso y `browser.localCdpReadyTimeoutMs` para la
  disponibilidad del websocket CDP posterior al inicio. Auméntalos en hosts más lentos donde Chrome
  se inicia correctamente, pero las comprobaciones de disponibilidad compiten con el arranque. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; se rechazan los valores de configuración no válidos.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` y `browser.profiles.<name>.executablePath` aceptan
  `~` y `~/...` para el directorio de inicio de tu SO antes del inicio de Chromium.
  `userDataDir` por perfil en los perfiles `existing-session` también se expande con tilde.
- Servicio de control: solo local loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega flags de inicio adicionales al arranque local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o flags de depuración).

---

## IU

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: color de énfasis para el cromado de la IU de la app nativa (tinte de burbuja de Talk Mode, etc.).
- `assistant`: anulación de identidad de la IU de Control. Recurre a la identidad del agente activo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (ejecuta Gateway) o `remote` (se conecta a un Gateway remoto). Gateway se niega a iniciar a menos que sea `local`.
- `port`: puerto único multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale), o `custom`.
- **Alias de enlace heredados**: usa valores de modo de enlace en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el enlace `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con redes de puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que Gateway queda inaccesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: requerida de forma predeterminada. Los enlaces que no son loopback requieren autenticación de Gateway. En la práctica, eso significa un token/contraseña compartido o un proxy inverso con identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones de local loopback confiables; esto se omite intencionalmente en los avisos de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación de navegador/usuario a un proxy inverso con identidad y confía en las cabeceras de identidad de `gateway.trustedProxies` (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada una fuente de proxy **que no sea loopback**; los proxies inversos loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como alternativa directa local; `gateway.auth.token` sigue siendo mutuamente exclusivo con el modo trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, las cabeceras de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificada mediante `tailscale whois`). Los endpoints de API HTTP **no** usan esa autenticación de cabecera de Tailscale; en su lugar siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token asume que el host de Gateway es confiable. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (shared-secret y device-token se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por lo tanto, los intentos incorrectos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos pasen en carrera como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` de forma predeterminada; establécelo en `false` cuando también quieras limitar intencionalmente el tráfico de localhost (para configuraciones de prueba o despliegues de proxy estrictos).
- Los intentos de autenticación WS con origen de navegador siempre se limitan con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta de localhost basada en navegador).
- En loopback, esos bloqueos con origen de navegador se aíslan por valor
  `Origin` normalizado, de modo que fallos repetidos desde un origen localhost no bloquean automáticamente
  un origen diferente.
- `tailscale.mode`: `serve` (solo tailnet, enlace loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista de permitidos explícita de orígenes de navegador para conexiones WebSocket de Gateway. Requerida cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita la alternativa de origen basada en la cabecera Host para despliegues que dependen intencionalmente de la política de origen de cabecera Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: anulación de emergencia del entorno de proceso del lado del cliente
  que permite `ws://` en texto plano hacia IPs de red privada confiables;
  el valor predeterminado sigue siendo solo loopback para texto plano. No hay equivalente en `openclaw.json`,
  y la configuración de red privada del navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, no afecta a los clientes WebSocket de Gateway.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran por sí mismos la autenticación de Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relé APNs externo usado por las compilaciones oficiales/TestFlight de iOS después de publicar registros respaldados por relé en Gateway. Esta URL debe coincidir con la URL de relé compilada en la build de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío de Gateway al relé en milisegundos. Valor predeterminado: `10000`.
- Los registros respaldados por relé se delegan a una identidad específica de Gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relé y reenvía a Gateway una concesión de envío con ámbito de registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales de entorno para la configuración de relé anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo para URL de relé HTTP loopback. Las URL de relé de producción deben mantenerse en HTTPS.
- `gateway.handshakeTimeoutMs`: tiempo de espera del handshake WebSocket de Gateway antes de la autenticación, en milisegundos. Predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene prioridad cuando está establecido. Auméntalo en hosts cargados o de baja potencia donde los clientes locales pueden conectarse mientras el calentamiento de inicio aún se estabiliza.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de salud de canales en minutos. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicios del monitor de salud por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de salud manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando se establece, tiene prioridad sobre la anulación a nivel de canal.
- Las rutas de llamada de Gateway local pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla en modo cerrado (sin enmascaramiento por alternativa remota).
- `trustedProxies`: IPs de proxies inversos que terminan TLS o inyectan cabeceras de cliente reenviado. Enumera solo proxies que controlas. Las entradas loopback siguen siendo válidas para configuraciones de proxy/detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Valor predeterminado `false` para un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidos para aprobar automáticamente el emparejamiento inicial de dispositivos de nodo sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador/navegador/Control UI/WebChat, y no aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelado global de permitidos/denegados para comandos de nodo declarados después del emparejamiento y la evaluación de la lista de permitidos de la plataforma. Usa `allowCommands` para optar por comandos de nodo peligrosos como `camera.snap`, `camera.clip` y `screen.record`; `denyCommands` elimina un comando incluso si un valor predeterminado de plataforma o una autorización explícita lo incluiría de otro modo. Después de que un nodo cambie su lista de comandos declarados, rechaza y vuelve a aprobar ese emparejamiento de dispositivo para que Gateway almacene la instantánea de comandos actualizada.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (extiende la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: deshabilitado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimiento de entrada por URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no establecidas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención por URL.
- Cabecera opcional de endurecimiento de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establece solo para orígenes HTTPS que controles; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de varias instancias

Ejecuta varios Gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulta [Varios Gateways](/es/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: habilita la terminación TLS en el listener de Gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado/clave autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantenla con permisos restringidos.
- `caPath`: ruta opcional al paquete de CA para verificación de clientes o cadenas de confianza personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla cómo se aplican las ediciones de configuración en tiempo de ejecución.
  - `"off"`: ignora ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: reinicia siempre el proceso de Gateway ante cambios de configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar los cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar operaciones en curso antes de forzar un reinicio. Omítelo para usar la espera limitada predeterminada (`300000`); establece `0` para esperar indefinidamente y registrar advertencias periódicas de pendientes.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticación: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Los tokens de hook en la cadena de consulta se rechazan.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; reutilizar el token de Gateway se rechaza.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si una asignación o preajuste usa un `sessionKey` con plantilla, define `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esa habilitación.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El `sessionKey` de la carga útil de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → resuelto mediante `hooks.mappings`
  - Los valores de `sessionKey` de asignación renderizados con plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de asignación">

- `match.path` coincide con la subruta después de `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen desde la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (las rutas absolutas y el recorrido de directorios se rechazan).
- `agentId` enruta a un agente específico; los ID desconocidos recurren al valor predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agente de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de asignación basadas en plantillas definan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional de prefijos para valores explícitos de `sessionKey` (solicitud + asignación), p. ej. `["hook:"]`. Se vuelve obligatoria cuando cualquier asignación o preajuste usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` reemplaza el LLM para esta ejecución de hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración con Gmail

- El preajuste integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si conservas ese enrutamiento por mensaje, define `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
- Si necesitas `hooks.allowRequestSessionKey: false`, reemplaza el preajuste con un `sessionKey` estático en lugar del valor predeterminado con plantilla.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Define `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecutes un `gog gmail watch serve` separado junto con Gateway.

---

## Host de canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por agentes y A2UI por HTTP bajo el puerto de Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: conserva `gateway.bind: "loopback"` (predeterminado).
- Enlaces que no son loopback: las rutas de canvas requieren autenticación de Gateway (token/contraseña/proxy de confianza), igual que otras superficies HTTP de Gateway.
- Las WebViews de Node normalmente no envían encabezados de autenticación; después de emparejar y conectar un nodo, Gateway anuncia URL de capacidad con alcance de nodo para acceso a canvas/A2UI.
- Las URL de capacidad están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se usa respaldo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar Gateway.
- Deshabilita la recarga en vivo para directorios grandes o errores `EMFILE`.

---

## Descubrimiento

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`.
- El nombre de host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida, con respaldo a `openclaw`. Sobrescríbelo con `OPENCLAW_MDNS_HOSTNAME`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast en `~/.openclaw/dns/`. Para descubrimiento entre redes, combínalo con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

Configuración: `openclaw dns setup --apply`.

---

## Entorno

### `env` (variables de entorno en línea)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Las variables de entorno en línea solo se aplican si al entorno del proceso le falta la clave.
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sobrescribe las variables existentes).
- `shellEnv`: importa las claves esperadas que falten desde tu perfil de shell de inicio de sesión.
- Consulta [Entorno](/es/help/environment) para ver la precedencia completa.

### Sustitución de variables de entorno

Referencia variables de entorno en cualquier cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables faltantes/vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores en texto plano siguen funcionando.

### `SecretRef`

Usa una forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de id de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id de `source: "file"`: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- Patrón de id de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por barras `.` o `..` (por ejemplo, `a/../b` se rechaza)

### Superficie de credenciales admitida

- Matriz canónica: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas de credenciales admitidas de `openclaw.json`.
- Las referencias de `auth-profiles.json` se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.

### Configuración de proveedores de secretos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notas:

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (`id` debe ser `"value"` en modo singleValue).
- Las rutas de proveedores file y exec fallan de forma cerrada cuando la verificación de ACL de Windows no está disponible. Define `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas de protocolo en stdin/stdout.
- De forma predeterminada, las rutas de comandos con symlink se rechazan. Define `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación de directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa las variables requeridas explícitamente con `passEnv`.
- Las referencias a secretos se resuelven en el momento de la activación en una instantánea en memoria; después, las rutas de solicitud solo leen la instantánea.
- El filtrado de superficie activa se aplica durante la activación: las referencias no resueltas en superficies habilitadas hacen fallar el inicio/la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

---

## Almacenamiento de autenticación

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Los perfiles por agente se almacenan en `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciales estáticas.
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe como perfiles canónicos de clave de API `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas en tiempo de ejecución vienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se depuran cuando se descubren.
- Las importaciones heredadas de OAuth vienen de `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento en tiempo de ejecución de secretos y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: retroceso base en horas cuando un perfil falla por errores reales
  de facturación/créditos insuficientes (predeterminado: `5`). El texto explícito de facturación
  aún puede llegar aquí incluso en respuestas `401`/`403`, pero los comparadores de texto
  específicos de proveedor permanecen limitados al proveedor que los posee (por ejemplo, OpenRouter
  `Key limit exceeded`). Los mensajes reintentables HTTP `402` de ventana de uso o de
  límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de retroceso de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del retroceso de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: retroceso base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del retroceso `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de retroceso (predeterminado: `24`).
- `overloadedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al fallback de modelo (predeterminado: `1`). Formas de proveedor ocupado como `ModelNotReadyException` llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al fallback de modelo (predeterminado: `1`). Ese bloque de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Registro

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Archivo de registro predeterminado: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Define `logging.file` para una ruta estable.
- `consoleLevel` sube a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro activo en bytes antes de la rotación (entero positivo; predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento de mejor esfuerzo para la salida de consola, registros de archivo, registros de log OTLP y texto persistido de transcripción de sesión. `redactSensitive: "off"` solo desactiva esta política general de registros/transcripciones; las superficies de seguridad de UI/herramientas/diagnóstico siguen censurando secretos antes de emitirlos.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruptor maestro para la salida de instrumentación (predeterminado: `true`).
- `flags`: arreglo de cadenas de banderas que habilitan salida de registros dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad en ms para emitir advertencias de sesión atascada mientras una sesión permanece en estado de procesamiento.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`). Para ver la configuración completa, el catálogo de señales y el modelo de privacidad, consulta [exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del colector para exportación OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de señal. Cuando se definen, anulan `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con las solicitudes de exportación OTel.
- `otel.serviceName`: nombre de servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita la exportación de trazas, métricas o registros.
- `otel.sampleRate`: tasa de muestreo de trazas `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para atributos de span OTEL. Desactivado de forma predeterminada. El booleano `true` captura contenido de mensajes/herramientas que no sean del sistema; la forma de objeto te permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` y `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para los atributos experimentales más recientes del proveedor de spans GenAI. De forma predeterminada, los spans conservan el atributo heredado `gen_ai.system` por compatibilidad; las métricas GenAI usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK global de OpenTelemetry. OpenClaw omite entonces el inicio/apagado del SDK propiedad del plugin, pero mantiene activos los listeners de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoint específicas de señal usadas cuando la clave de configuración correspondiente no está definida.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones embebidas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de trazas de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controla qué se incluye en la salida de trazas de caché (todo predeterminado: `true`).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de lanzamiento para instalaciones npm/git: `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: busca actualizaciones de npm cuando se inicia el gateway (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente en el canal estable (predeterminado: `6`; máx.: `168`).
- `auto.stableJitterHours`: ventana adicional de distribución de despliegue del canal estable en horas (predeterminado: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frecuencia con la que se ejecutan las comprobaciones del canal beta, en horas (predeterminado: `1`; máx.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: compuerta global de la función ACP (predeterminado: `true`; define `false` para ocultar el envío ACP y las opciones de generación).
- `dispatch.enabled`: compuerta independiente para el envío de turnos de sesión ACP (predeterminado: `true`). Define `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id de backend de runtime ACP predeterminado (debe coincidir con un plugin de runtime ACP registrado).
  Si `plugins.allow` está definido, incluye el id del plugin de backend (por ejemplo `acpx`) o el plugin predeterminado incluido no se cargará.
- `defaultAgent`: id de agente ACP de destino de reserva cuando las generaciones no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agente autorizados para sesiones de runtime ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: número máximo de sesiones ACP activas concurrentemente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque transmitido.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramienta por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos de herramienta ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de ser elegibles para limpieza.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al preparar un entorno de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla el estilo del lema del banner:
  - `"random"` (predeterminado): lemas divertidos/estacionales rotativos.
  - `"default"`: lema neutral fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de lema (el título/versión del banner sigue mostrándose).
- Para ocultar todo el banner (no solo los lemas), define la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente

Metadatos escritos por los flujos guiados de configuración de la CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidad

Consulta los campos de identidad de `agents.list` en [valores predeterminados de agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan a través del WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración del puente heredado (referencia histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones cron aisladas antes de eliminarlas de `sessions.json`. También controla la limpieza de transcripciones cron archivadas eliminadas. Predeterminado: `24h`; define `false` para desactivarlo.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de la poda. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes conservadas cuando se activa la poda de registros de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST de webhook de cron (`delivery.mode = "webhook"`), si se omite no se envía encabezado de autenticación.
- `webhook`: URL de webhook heredada obsoleta de reserva (http/https), usada solo para trabajos almacenados que aún tienen `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: reintentos máximos para trabajos de ejecución única en errores transitorios (predeterminado: `3`; rango: `0`–`10`).
- `backoffMs`: arreglo de retrasos de backoff en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omite para reintentar todos los tipos transitorios.

Se aplica solo a trabajos cron de ejecución única. Los trabajos recurrentes usan gestión de fallos independiente.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de fallo para trabajos cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: cuenta ejecuciones omitidas consecutivas para el umbral de alerta (predeterminado: `false`). Las ejecuciones omitidas se rastrean por separado y no afectan el backoff de errores de ejecución.
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el webhook configurado.
- `accountId`: id opcional de cuenta o canal para acotar la entrega de alertas.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino predeterminado para notificaciones de fallo de Cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; se establece en `"announce"` de forma predeterminada cuando existen suficientes datos del destino.
- `channel`: anulación de canal para la entrega mediante anuncio. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino de anuncio explícito o URL de Webhook. Obligatorio para el modo Webhook.
- `accountId`: anulación de cuenta opcional para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se configura ningún destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` vuelven a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"`, a menos que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones Cron aisladas se rastrean como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo de medios

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin contenedores de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones de grupo eliminadas          |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador de destino                          |
| `{{MessageSid}}`   | Id. de mensaje del canal                          |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva          |
| `{{MediaUrl}}`     | Pseudo-URL de medios entrantes                    |
| `{{MediaPath}}`    | Ruta de medios local                              |
| `{{MediaType}}`    | Tipo de medio (imagen/audio/documento/…)          |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Prompt de medios resuelto para entradas de CLI    |
| `{{MaxChars}}`     | Caracteres máximos de salida resueltos para entradas de CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Asunto del grupo (mejor esfuerzo)                 |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | Nombre visible del remitente (mejor esfuerzo)     |
| `{{SenderE164}}`   | Número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | Indicio de proveedor (whatsapp, telegram, discord, etc.) |

---

## Inclusiones de configuración (`$include`)

Divide la configuración en varios archivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamiento de combinación:**

- Archivo único: reemplaza el objeto contenedor.
- Matriz de archivos: se combina en profundidad en orden (los posteriores anulan a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (anulan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` solo se permiten cuando todavía se resuelven dentro de ese límite.
- Las escrituras propiedad de OpenClaw que cambian solo una sección de nivel superior respaldada por una inclusión de archivo único escriben en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, las matrices de inclusión y las inclusiones con anulaciones hermanas son de solo lectura para las escrituras propiedad de OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuración](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
