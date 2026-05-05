---
read_when:
    - Necesitas la semántica exacta de configuración a nivel de campo o los valores predeterminados
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración de Gateway para claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-05-05T05:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd0b6bf9a77d91bcc240088e4be92e44b6e70910efe00f7ed99534fb70983479
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia de configuración principal para `~/.openclaw/openclaw.json`. Para una vista general orientada a tareas, consulta [Configuración](/es/gateway/configuration).

Cubre las superficies principales de configuración de OpenClaw y enlaza a otras páginas cuando un subsistema tiene su propia referencia más profunda. Los catálogos de comandos propiedad de canales y plugins, así como los ajustes avanzados de memoria/QMD, viven en sus propias páginas en lugar de esta.

Fuente de verdad del código:

- `openclaw config schema` imprime el JSON Schema activo usado para la validación y la Control UI, con metadatos de paquetes integrados/plugins/canales combinados cuando están disponibles
- `config.schema.lookup` devuelve un nodo de esquema limitado a una ruta para herramientas de inspección detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de la documentación de configuración frente a la superficie actual del esquema

Ruta de búsqueda para agentes: usa la acción de herramienta `gateway` `config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo antes de editar. Usa [Configuración](/es/gateway/configuration) para orientación orientada a tareas y esta página para el mapa de campos más amplio, los valores predeterminados y enlaces a referencias de subsistemas.

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y configuración de dreaming bajo `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/es/tools/slash-commands) para el catálogo actual de comandos integrados + empaquetados
- páginas del canal/plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Las claves de configuración por canal se movieron a una página dedicada; consulta [Configuración: canales](/es/gateway/config-channels) para `channels.*`, incluidos Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales empaquetados (autenticación, control de acceso, múltiples cuentas, activación por mención).

## Valores predeterminados de agente, multiagente, sesiones y mensajes

Se movió a una página dedicada; consulta [Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, medios, Skills, sandbox)
- `multiAgent.*` (enrutamiento y enlaces multiagente)
- `session.*` (ciclo de vida de sesión, Compaction, poda)
- `messages.*` (entrega de mensajes, TTS, renderizado de markdown)
- `talk.*` (modo Talk)
  - `talk.speechLocale`: id de locale BCP 47 opcional para reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, Talk conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)

## Herramientas y proveedores personalizados

La política de herramientas, los conmutadores experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de proveedor personalizado / URL base se movieron a una página dedicada; consulta [Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, las listas de modelos permitidos y la configuración de proveedores personalizados viven en [Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls). La raíz `models` también controla el comportamiento global del catálogo de modelos.

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
- `models.pricing.enabled`: controla el arranque en segundo plano de precios que comienza después de que los sidecars y canales alcanzan la ruta de Gateway listo. Cuando es `false`, el Gateway omite las solicitudes de catálogo de precios de OpenRouter y LiteLLM; los valores configurados en `models.providers.*.models[].cost` siguen funcionando para estimaciones de coste locales.

## MCP

Las definiciones de servidores MCP gestionados por OpenClaw viven bajo `mcp.servers` y son consumidas por Pi integrado y otros adaptadores de runtime. Los comandos `openclaw mcp list`, `show`, `set` y `unset` gestionan este bloque sin conectarse al servidor de destino durante las ediciones de configuración.

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

- `mcp.servers`: definiciones con nombre de servidores MCP stdio o remotos para runtimes que exponen herramientas MCP configuradas. Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`; `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP empaquetados con ámbito de sesión. Las ejecuciones integradas de un solo uso solicitan limpieza al final de la ejecución; este TTL es el respaldo para sesiones de larga duración y futuros invocadores.
- Los cambios bajo `mcp.*` se aplican en caliente al descartar runtimes MCP de sesión en caché. El siguiente descubrimiento/uso de herramientas los recrea desde la nueva configuración, por lo que las entradas eliminadas de `mcp.servers` se recolectan de inmediato en lugar de esperar al TTL de inactividad.

Consulta [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y [backends de CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para el comportamiento de runtime.

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

- `allowBundled`: lista opcional de permitidos solo para Skills empaquetadas (las Skills gestionadas/de espacio de trabajo no se ven afectadas).
- `load.extraDirs`: raíces de Skills compartidas adicionales (menor precedencia).
- `install.preferBrew`: cuando es true, prefiere instaladores Homebrew cuando `brew` está disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador de Node para especificaciones `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desactiva una Skill incluso si está empaquetada/instalada.
- `entries.<skillKey>.apiKey`: comodidad para Skills que declaran una variable de entorno principal (cadena de texto sin formato u objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Se cargan desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, más `plugins.load.paths`.
- El descubrimiento acepta plugins nativos de OpenClaw, además de paquetes Codex compatibles y paquetes Claude, incluidos paquetes Claude sin manifiesto con diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el gateway.**
- `allow`: lista opcional de permitidos (solo se cargan los plugins listados). `deny` tiene prioridad.
- `bundledDiscovery`: el valor predeterminado es `"allowlist"` para configuraciones nuevas, de modo que un `plugins.allow` no vacío también restringe plugins de proveedor empaquetados, incluidos proveedores de runtime de búsqueda web. Doctor escribe `"compat"` para configuraciones de listas de permitidos heredadas migradas con el fin de preservar el comportamiento existente de proveedores empaquetados hasta que optes por activarlo.
- `plugins.entries.<id>.apiKey`: campo de comodidad para clave API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, core bloquea `before_prompt_build` e ignora campos que mutan el prompt desde el `before_agent_start` heredado, mientras preserva `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y a directorios de hooks proporcionados por paquetes compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins confiables no empaquetados pueden leer contenido de conversación sin procesar desde hooks tipados como `llm_input`, `llm_output`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar sobrescrituras `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista opcional de permitidos de destinos canónicos `provider/model` para sobrescrituras confiables de subagentes. Usa `"*"` solo cuando quieras permitir intencionalmente cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema de plugin nativo de OpenClaw cuando está disponible).
- La configuración de cuentas/runtime de plugins de canal vive bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del plugin propietario, no mediante un registro central de opciones de OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` heredado o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminada: `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: edad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo Grok que se usará para la búsqueda (por ejemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de dreaming (predeterminado `false`).
  - `frequency`: cadencia cron para cada barrido completo de dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: sobrescritura opcional del modelo de subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínalo con `allowedModels` para restringir destinos. Los errores de modelo no disponible reintentan una vez con el modelo predeterminado de la sesión; los fallos de confianza o de lista de permitidos no hacen fallback silenciosamente.
  - la política de fases y los umbrales son detalles de implementación (no claves de configuración orientadas al usuario).
- La configuración completa de memoria vive en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins de paquete Claude habilitados también pueden aportar valores predeterminados de Pi integrado desde `settings.json`; OpenClaw los aplica como ajustes de agente saneados, no como parches de configuración sin procesar de OpenClaw.
- `plugins.slots.memory`: elige el id del plugin de memoria activo, o `"none"` para desactivar plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.

Consulta [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria de seguimiento inferida: OpenClaw puede detectar check-ins a partir de turnos de conversación y entregarlos mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción oculta con LLM, almacenamiento y entrega por Heartbeat de compromisos de seguimiento inferidos. Predeterminado: `false`.
- `commitments.maxPerDay`: número máximo de compromisos de seguimiento inferidos entregados por sesión de agente en un día móvil. Predeterminado: `3`.

Consulta [Compromisos inferidos](/es/concepts/commitments).

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
- `tabCleanup` recupera las pestañas rastreadas del agente principal tras el tiempo de inactividad o cuando una
  sesión supera su límite. Define `idleMinutes: 0` o `maxTabsPerSession: 0` para
  desactivar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado cuando no se define, por lo que la navegación del navegador se mantiene estricta de forma predeterminada.
- Define `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionalmente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad/detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de adjunción (inicio/detención/restablecimiento desactivados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw detecte `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL directa de WebSocket de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad CDP remota y
  `attachOnly`, además de a las solicitudes de apertura de pestañas. Los perfiles de loopback administrados
  mantienen los valores predeterminados de CDP local.
- Si un servicio CDP administrado externamente es accesible mediante loopback, define
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de loopback como un
  perfil de navegador administrado localmente y puede informar errores de propiedad del puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden adjuntarse en
  el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden definir `userDataDir` para apuntar a un
  perfil de navegador basado en Chromium específico, como Brave o Edge.
- Los perfiles `existing-session` conservan los límites actuales de la ruta de Chrome MCP:
  acciones guiadas por instantáneas/referencias en lugar de apuntado por selectores CSS, hooks de carga de un archivo,
  sin anulaciones de tiempo de espera de diálogos, sin `wait --load networkidle`, y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles `openclaw` administrados localmente asignan automáticamente `cdpPort` y `cdpUrl`; solo
  define `cdpUrl` explícitamente para CDP remoto.
- Los perfiles administrados localmente pueden definir `executablePath` para anular el
  `browser.executablePath` global de ese perfil. Usa esto para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles administrados localmente usan `browser.localLaunchTimeoutMs` para la detección HTTP de CDP de Chrome
  después del inicio del proceso y `browser.localCdpReadyTimeoutMs` para la
  preparación del WebSocket CDP posterior al inicio. Auméntalos en hosts más lentos donde Chrome
  se inicia correctamente pero las comprobaciones de preparación compiten con el arranque. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; los valores de configuración no válidos se rechazan.
- Orden de autodetección: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` y `browser.profiles.<name>.executablePath` aceptan
  `~` y `~/...` para el directorio de inicio de tu sistema operativo antes del inicio de Chromium.
  El `userDataDir` por perfil en perfiles `existing-session` también expande la virgulilla.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` añade flags de inicio adicionales al arranque local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o flags de depuración).

---

## Interfaz de usuario

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

- `seamColor`: color de acento para el cromo de la UI de la aplicación nativa (tinte de burbuja del modo de conversación, etc.).
- `assistant`: anulación de identidad de la UI de control. Recurre a la identidad del agente activo.

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
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
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

<Accordion title="Detalles de los campos de Gateway">

- `mode`: `local` (ejecutar gateway) o `remote` (conectarse al gateway remoto). Gateway se niega a iniciar a menos que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias de bind heredados**: usa valores de modo de bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota de Docker**: el bind `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con redes de puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que el gateway no es accesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Auth**: requerida de forma predeterminada. Los binds que no son loopback requieren autenticación del gateway. En la práctica, eso significa un token/contraseña compartido o un proxy inverso con identidad mediante `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si `gateway.auth.token` y `gateway.auth.password` están configurados (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones de local loopback de confianza; esto se omite intencionalmente en las indicaciones de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación de navegador/usuario a un proxy inverso con identidad y confía en las cabeceras de identidad de `gateway.trustedProxies` (consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada un origen de proxy **que no sea loopback**; los proxies inversos loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como respaldo directo local; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, las cabeceras de identidad de Tailscale Serve pueden satisfacer la autenticación de la UI de control/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación por cabecera de Tailscale; en su lugar siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticación fallida. Se aplica por IP de cliente y por ámbito de autenticación (shared-secret y device-token se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la UI de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por lo tanto, los intentos incorrectos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos avancen en carrera como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene `true` como valor predeterminado; establece `false` cuando intencionalmente también quieras limitar por tasa el tráfico de localhost (para configuraciones de prueba o despliegues de proxy estrictos).
- Los intentos de autenticación WS con origen de navegador siempre se limitan por tasa con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta de localhost basada en navegador).
- En loopback, esos bloqueos con origen de navegador se aíslan por valor `Origin`
  normalizado, por lo que los fallos repetidos desde un origen localhost no bloquean
  automáticamente un origen diferente.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista de permitidos explícita de orígenes de navegador para conexiones WebSocket de Gateway. Requerida cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para mensajes de chat agrupados de la UI de control. Acepta valores de ancho CSS restringidos como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el respaldo de origen por cabecera Host para despliegues que dependen intencionalmente de una política de origen basada en cabecera Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: anulación de emergencia del entorno de proceso
  del lado del cliente que permite `ws://` en texto claro hacia IPs de red privada
  de confianza; el valor predeterminado sigue siendo solo loopback para texto claro. No hay equivalente en `openclaw.json`,
  y la configuración de red privada del navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, no afecta a los clientes WebSocket de Gateway.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran la autenticación del gateway por sí solos.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relay externo de APNs usado por las compilaciones oficiales/TestFlight de iOS después de que publican registros respaldados por relay en el gateway. Esta URL debe coincidir con la URL del relay compilada en la compilación de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del gateway al relay en milisegundos. Valor predeterminado: `10000`.
- Los registros respaldados por relay se delegan a una identidad de gateway específica. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al gateway una concesión de envío con ámbito de registro. Otro gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales de entorno para la configuración del relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo para URLs de relay HTTP de loopback. Las URLs de relay de producción deben permanecer en HTTPS.
- `gateway.handshakeTimeoutMs`: tiempo de espera del handshake WebSocket de Gateway previo a la autenticación, en milisegundos. Predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando está establecido. Auméntalo en hosts cargados o de baja potencia donde los clientes locales pueden conectarse mientras el calentamiento de inicio aún se está estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado de canales en minutos. Establece `0` para deshabilitar globalmente los reinicios del monitor de estado. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: reinicios máximos del monitor de estado por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal para los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando está establecida, tiene precedencia sobre la anulación a nivel de canal.
- Las rutas de llamada al gateway local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin enmascaramiento mediante respaldo remoto).
- `trustedProxies`: IPs de proxy inverso que terminan TLS o inyectan cabeceras de cliente reenviado. Enumera solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de proxy/detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean elegibles para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. El valor predeterminado es `false` para comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidos para aprobar automáticamente el emparejamiento inicial de dispositivos Node sin ámbitos solicitados. Está deshabilitada cuando no está establecida. Esto no aprueba automáticamente el emparejamiento de operador/navegador/UI de control/WebChat, ni aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelado global de permitir/denegar para comandos Node declarados después del emparejamiento y de la evaluación de la lista de permitidos de la plataforma. Usa `allowCommands` para optar por comandos Node peligrosos como `camera.snap`, `camera.clip` y `screen.record`; `denyCommands` elimina un comando incluso si un valor predeterminado de plataforma o una autorización explícita lo incluiría de otro modo. Después de que un Node cambie su lista de comandos declarados, rechaza y vuelve a aprobar ese emparejamiento de dispositivo para que el gateway almacene la instantánea de comandos actualizada.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (amplía la lista de denegación predeterminada).
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
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención de URLs.
- Cabecera opcional de endurecimiento de respuesta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establécela solo para orígenes HTTPS que controles; consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de varias instancias

Ejecuta varios gateways en un host con puertos y directorios de estado únicos:

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

- `enabled`: habilita la terminación TLS en el listener del gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado/clave autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantén permisos restringidos.
- `caPath`: ruta opcional al paquete CA para verificación de cliente o cadenas de confianza personalizadas.

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
  - `"off"`: ignora las ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: reinicia siempre el proceso del gateway ante un cambio de configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar los cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar operaciones en curso antes de forzar un reinicio. Omítelo para usar la espera acotada predeterminada (`300000`); establece `0` para esperar indefinidamente y registrar advertencias periódicas de pendientes.

---

## Ganchos

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
Se rechazan los tokens de hooks en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token de Gateway.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si una asignación o preajuste usa un `sessionKey` con plantilla, configura `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esa adhesión explícita.

**Puntos de conexión:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El `sessionKey` de la carga útil de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores `sessionKey` de asignación renderizados con plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de asignación">

- `match.path` coincide con la subruta después de `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen desde la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan las rutas absolutas y el recorrido de directorios).
  - Mantén `hooks.transformsDir` dentro de `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del área de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueve el módulo de transformación al directorio de transformaciones de hooks o elimina `hooks.transformsDir`.
- `agentId` enruta a un agente específico; los ID desconocidos recurren al valor predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todo, `[]` = denegar todo).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agente de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de asignación basadas en plantillas establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permisos opcional de prefijos para valores `sessionKey` explícitos (solicitud + asignación), p. ej., `["hook:"]`. Se vuelve obligatoria cuando cualquier asignación o preajuste usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` anula el LLM para esta ejecución de hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración con Gmail

- El preajuste integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, configura `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
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

- Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Configura `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecutes un `gog gmail watch serve` separado junto con Gateway.

---

## Host de Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por agentes y A2UI mediante HTTP bajo el puerto de Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Enlaces que no sean loopback: las rutas de Canvas requieren autenticación de Gateway (token/contraseña/proxy de confianza), igual que otras superficies HTTP de Gateway.
- Las WebViews de Node normalmente no envían encabezados de autenticación; después de que un nodo se empareja y conecta, Gateway anuncia URL de capacidad con alcance de nodo para acceso a Canvas/A2UI.
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

- `minimal` (predeterminado cuando el Plugin `bonjour` incluido está habilitado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`; el anuncio multicast de LAN aún requiere que el Plugin `bonjour` incluido esté habilitado.
- `off`: suprime el anuncio multicast de LAN sin cambiar la habilitación del Plugin.
- El Plugin `bonjour` incluido se inicia automáticamente en hosts macOS y es opcional en Linux, Windows e implementaciones de Gateway en contenedores.
- El nombre de host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida, con respaldo a `openclaw`. Anúlalo con `OPENCLAW_MDNS_HOSTNAME`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast en `~/.openclaw/dns/`. Para el descubrimiento entre redes, combínalo con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

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

Las referencias de secretos son aditivas: los valores en texto sin formato siguen funcionando.

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
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por barras `.` ni `..` (por ejemplo, `a/../b` se rechaza)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas de credenciales compatibles de `openclaw.json`.
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
- Las rutas de proveedores file y exec fallan de forma cerrada cuando la verificación de ACL de Windows no está disponible. Configura `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta absoluta de `command` y usa cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos con symlink. Configura `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación de directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa explícitamente las variables necesarias con `passEnv`.
- Las referencias de secretos se resuelven en el momento de activación en una instantánea en memoria; luego las rutas de solicitud solo leen la instantánea.
- El filtrado de superficie activa se aplica durante la activación: las referencias no resueltas en superficies habilitadas hacen fallar el inicio/recarga, mientras que las superficies inactivas se omiten con diagnósticos.

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
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato en tiempo de ejecución; `openclaw doctor --fix` los reescribe como perfiles de clave API canónicos `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas en tiempo de ejecución provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se depuran al detectarse.
- Las importaciones OAuth heredadas provienen de `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento de secretos en tiempo de ejecución y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

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

- `billingBackoffHours`: espera base en horas cuando un perfil falla debido a errores reales de
  facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación puede
  seguir llegar aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos del proveedor
  permanecen limitados al proveedor que los posee (por ejemplo OpenRouter
  `Key limit exceeded`). Los mensajes HTTP `402` reintentables de ventana de uso o
  límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de espera por facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial de la espera por facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: espera base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento de espera de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de espera (predeterminado: `24`).
- `overloadedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar a la alternativa de modelo (predeterminado: `1`). Formas de proveedor ocupado como `ModelNotReadyException` llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar a la alternativa de modelo (predeterminado: `1`). Ese grupo de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: enmascaramiento de mejor esfuerzo para salida de consola, registros de archivo, registros de log OTLP y texto persistido de transcripción de sesión. `redactSensitive: "off"` solo desactiva esta política general de logs/transcripciones; las superficies de seguridad de UI/herramientas/diagnóstico siguen redactando secretos antes de emitirlos.

---

## Diagnóstico

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
- `flags`: arreglo de cadenas de marcas que habilitan salida de registro dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad sin progreso en ms para clasificar sesiones de procesamiento de larga duración como `session.long_running`, `session.stalled` o `session.stuck`. Las respuestas, herramientas, estados, bloques y el progreso de ACP reinician el temporizador; los diagnósticos repetidos de `session.stuck` aplican espera mientras no cambien.
- `stuckSessionAbortMs`: umbral de antigüedad sin progreso en ms antes de que el trabajo activo bloqueado elegible pueda abortarse y drenarse para recuperación. Si no se define, OpenClaw usa la ventana extendida más segura de ejecución embebida de al menos 10 minutos y 5 veces `stuckSessionWarnMs`.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`). Para la configuración completa, el catálogo de señales y el modelo de privacidad, consulta [exportación OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del colector para exportación OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos por señal. Cuando se definen, anulan `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o logs.
- `otel.sampleRate`: tasa de muestreo de trazas `0`-`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido bruto para atributos de spans OTEL. Desactivado de forma predeterminada. El booleano `true` captura contenido no sistémico de mensajes/herramientas; la forma de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` y `systemPrompt` explícitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para los atributos experimentales más recientes del proveedor de spans GenAI. De forma predeterminada, los spans conservan el atributo heredado `gen_ai.system` por compatibilidad; las métricas GenAI usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK global de OpenTelemetry. OpenClaw entonces omite el inicio/apagado del SDK propiedad del plugin mientras mantiene activos los escuchas de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoint específicas por señal usadas cuando la clave de configuración correspondiente no está definida.
- `cacheTrace.enabled`: registra instantáneas de traza de caché para ejecuciones embebidas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de traza de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de traza de caché (todos predeterminados: `true`).

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
- `checkOnStart`: comprueba actualizaciones npm cuando se inicia el gateway (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente en el canal estable (predeterminado: `6`; máx.: `168`).
- `auto.stableJitterHours`: ventana adicional en horas para distribuir el despliegue del canal estable (predeterminado: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frecuencia en horas de las comprobaciones del canal beta (predeterminado: `1`; máx.: `24`).

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

- `enabled`: compuerta global de la característica ACP (predeterminado: `true`; define `false` para ocultar el despacho ACP y las opciones de generación).
- `dispatch.enabled`: compuerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Define `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id predeterminado del backend de runtime ACP (debe coincidir con un plugin de runtime ACP registrado).
  Instala primero el plugin de backend y, si `plugins.allow` está definido, incluye el id del plugin de backend (por ejemplo `acpx`) o el backend ACP no se cargará.
- `defaultAgent`: id de agente ACP de respaldo cuando las generaciones no especifican un objetivo explícito.
- `allowedAgents`: lista de permitidos de ids de agentes autorizados para sesiones de runtime ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque transmitido.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramienta por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos de herramienta ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de que sean elegibles para limpieza.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de runtime ACP.

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

- `cli.banner.taglineMode` controla el estilo del eslogan del banner:
  - `"random"` (predeterminado): eslóganes rotativos divertidos/estacionales.
  - `"default"`: eslogan neutral fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título/la versión del banner aún se muestran).
- Para ocultar el banner completo (no solo los eslóganes), define la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente de configuración

Metadatos escritos por los flujos de configuración guiada de la CLI (`onboard`, `configure`, `doctor`):

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

Consulta los campos de identidad de `agents.list` en [Valores predeterminados de agente](/es/gateway/config-agents#agent-defaults).

---

## Bridge (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los Nodes se conectan mediante el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración de puente heredado (referencia histórica)">

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

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones Cron aisladas antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones Cron archivadas eliminadas. Valor predeterminado: `24h`; define `false` para desactivarlo.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de podarlo. Valor predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes que se conservan cuando se activa la poda del registro de ejecución. Valor predeterminado: `2000`.
- `webhookToken`: token portador usado para la entrega POST del Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía encabezado de autenticación.
- `webhook`: URL de Webhook heredada obsoleta de respaldo (http/https), usada solo para trabajos almacenados que todavía tienen `notify: true`.

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

- `maxAttempts`: reintentos máximos para trabajos de una sola ejecución ante errores transitorios (valor predeterminado: `3`; rango: `0`–`10`).
- `backoffMs`: arreglo de demoras de retroceso en ms para cada intento de reintento (valor predeterminado: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de una sola ejecución. Los trabajos recurrentes usan una gestión de fallos separada.

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

- `enabled`: habilita alertas de fallo para trabajos Cron (valor predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: cuenta las ejecuciones omitidas consecutivas para el umbral de alerta (valor predeterminado: `false`). Las ejecuciones omitidas se registran por separado y no afectan el retroceso por errores de ejecución.
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: id opcional de cuenta o canal para delimitar la entrega de alertas.

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
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos de destino.
- `channel`: anulación de canal para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito de anuncio o URL de Webhook. Obligatorio para el modo Webhook.
- `accountId`: anulación opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se define un destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` recurren a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones Cron aisladas se registran como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo de medios

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones de grupo eliminadas          |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador del destino                         |
| `{{MessageSid}}`   | id del mensaje del canal                          |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva          |
| `{{MediaUrl}}`     | pseudo-URL de medios entrantes                    |
| `{{MediaPath}}`    | ruta local de medios                              |
| `{{MediaType}}`    | tipo de medio (imagen/audio/documento/…)          |
| `{{Transcript}}`   | transcripción de audio                            |
| `{{Prompt}}`       | instrucción de medios resuelta para entradas de CLI |
| `{{MaxChars}}`     | caracteres máximos de salida resueltos para entradas de CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | asunto del grupo (mejor esfuerzo)                 |
| `{{GroupMembers}}` | vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | nombre visible del remitente (mejor esfuerzo)     |
| `{{SenderE164}}`   | número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | indicio de proveedor (whatsapp, telegram, discord, etc.) |

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
- Arreglo de archivos: se combina en profundidad en orden (los posteriores anulan los anteriores).
- Claves hermanas: se combinan después de las inclusiones (anulan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` solo se permiten cuando todavía se resuelven dentro de ese límite.
- Las escrituras propiedad de OpenClaw que cambian solo una sección de nivel superior respaldada por una inclusión de archivo único escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, los arreglos de inclusión y las inclusiones con anulaciones de claves hermanas son de solo lectura para escrituras propiedad de OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuración](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
