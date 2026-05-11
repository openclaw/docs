---
read_when:
    - Necesitas la semántica o los valores predeterminados exactos de la configuración a nivel de campo
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración de Gateway para las claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-05-11T20:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia de configuración principal para `~/.openclaw/openclaw.json`. Para una descripción general orientada a tareas, consulta [Configuración](/es/gateway/configuration).

Cubre las superficies principales de configuración de OpenClaw y enlaza a otras páginas cuando un subsistema tiene su propia referencia más profunda. Los catálogos de comandos propiedad de canales y plugins, y los controles profundos de memoria/QMD, viven en sus propias páginas en lugar de esta.

Fuente de verdad del código:

- `openclaw config schema` imprime el JSON Schema en vivo usado para validación y Control UI, con metadatos de incluidos/plugins/canales fusionados cuando están disponibles
- `config.schema.lookup` devuelve un nodo de esquema con alcance de ruta para herramientas de inspección detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash base de la documentación de configuración frente a la superficie de esquema actual

Ruta de consulta del agente: usa la acción de herramienta `gateway` `config.schema.lookup` para
obtener documentación y restricciones exactas a nivel de campo antes de editar. Usa
[Configuración](/es/gateway/configuration) para orientación orientada a tareas y esta página
para el mapa de campos más amplio, los valores predeterminados y los enlaces a referencias de subsistemas.

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de dreaming en `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/es/tools/slash-commands) para el catálogo actual de comandos incorporados + incluidos
- páginas del canal/plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios + comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Las claves de configuración por canal se movieron a una página dedicada; consulta
[Configuración: canales](/es/gateway/config-channels) para `channels.*`,
incluidos Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros
canales incluidos (autenticación, control de acceso, varias cuentas, control de menciones).

## Valores predeterminados del agente, multiagente, sesiones y mensajes

Se movió a una página dedicada; consulta
[Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, pensamiento, heartbeat, memoria, medios, skills, sandbox)
- `multiAgent.*` (enrutamiento y vinculaciones multiagente)
- `session.*` (ciclo de vida de sesión, compaction, depuración)
- `messages.*` (entrega de mensajes, TTS, renderizado de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: anulación de nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de las consultas en tiempo real de Talk de Control UI
  - `talk.consultFastMode`: anulación de modo rápido de un solo uso para las consultas en tiempo real de Talk de Control UI
  - `talk.speechLocale`: id de locale BCP 47 opcional para reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)

## Herramientas y proveedores personalizados

La política de herramientas, los conmutadores experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de
proveedor personalizado / URL base se movieron a una página dedicada; consulta
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, las listas de modelos permitidos y la configuración de proveedores personalizados viven en
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: mapa de proveedores personalizados con clave por id de proveedor.
- `models.providers.*.localService`: gestor de procesos bajo demanda opcional para
  servidores de modelos locales. OpenClaw comprueba el endpoint de salud configurado, inicia
  el `command` absoluto cuando es necesario, espera a que esté listo y luego envía la solicitud
  del modelo. Consulta [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla la inicialización de precios en segundo plano que
  comienza después de que sidecars y canales alcanzan la ruta lista del Gateway. Cuando es `false`,
  el Gateway omite las obtenciones de catálogos de precios de OpenRouter y LiteLLM; los valores
  configurados de `models.providers.*.models[].cost` siguen funcionando para estimaciones de costo locales.

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw viven bajo `mcp.servers` y son
consumidas por Pi integrado y otros adaptadores de runtime. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` gestionan este bloque sin conectarse al
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

- `mcp.servers`: definiciones de servidores MCP remotos o stdio con nombre para runtimes que
  exponen herramientas MCP configuradas.
  Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP incluidos con alcance de sesión.
  Las ejecuciones integradas de un solo uso solicitan limpieza al final de la ejecución; este TTL es el respaldo para
  sesiones de larga duración y futuros llamadores.
- Los cambios bajo `mcp.*` se aplican en caliente al desechar runtimes MCP de sesión en caché.
  La siguiente detección/uso de herramientas los recrea desde la nueva configuración, por lo que las entradas
  eliminadas de `mcp.servers` se recolectan de inmediato en lugar de esperar al TTL de inactividad.

Consulta [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[backends de CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para el comportamiento en runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
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

- `allowBundled`: lista de permitidos opcional solo para skills incluidas (las skills gestionadas/de espacio de trabajo no se ven afectadas).
- `load.extraDirs`: raíces de skills compartidas adicionales (precedencia más baja).
- `load.allowSymlinkTargets`: raíces de destino real confiables en las que pueden
  resolverse los symlinks de skills cuando el enlace vive fuera de su raíz de origen configurada.
- `install.preferBrew`: cuando es true, prefiere instaladores de Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador de node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes Gateway confiables `operator.admin`
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (predeterminado: false). Esto solo habilita la ruta de archivos subidos; las instalaciones normales de ClawHub
  no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita una skill incluso si está incluida/instalada.
- `entries.<skillKey>.apiKey`: comodidad para skills que declaran una variable de entorno primaria (cadena de texto sin formato u objeto SecretRef).

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

- Se cargan desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, además de `plugins.load.paths`.
- La detección acepta plugins nativos de OpenClaw más bundles compatibles de Codex y bundles de Claude, incluidos bundles de diseño predeterminado de Claude sin manifiesto.
- **Los cambios de configuración requieren reiniciar el gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins listados). `deny` tiene prioridad.
- `bundledDiscovery`: el valor predeterminado es `"allowlist"` para configuraciones nuevas, por lo que un
  `plugins.allow` no vacío también controla plugins de proveedores incluidos, incluidos proveedores de runtime
  de búsqueda web. Doctor escribe `"compat"` para configuraciones de lista de permitidos heredadas migradas
  a fin de preservar el comportamiento existente de proveedores incluidos hasta que lo habilites.
- `plugins.entries.<id>.apiKey`: campo de comodidad de clave de API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con alcance de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, core bloquea `before_prompt_build` e ignora campos que mutan prompts de `before_agent_start` heredado, mientras preserva `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, plugins confiables no incluidos pueden leer contenido de conversación sin procesar desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar anulaciones de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones confiables de subagentes. Usa `"*"` solo cuando intencionalmente quieras permitir cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este plugin para solicitar anulaciones de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones confiables de finalización LLM de plugins. Usa `"*"` solo cuando intencionalmente quieras permitir cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este plugin para ejecutar `api.runtime.llm.complete` contra un id de agente no predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema nativo del plugin de OpenClaw cuando está disponible).
- La configuración de cuentas/runtime de plugins de canal vive bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del plugin propietario, no por un registro central de opciones de OpenClaw.

### Configuración del plugin de harness de Codex

El plugin incluido `codex` posee la configuración nativa del harness de servidor de aplicaciones de Codex bajo
`plugins.entries.codex.config`. Consulta
[Referencia del harness de Codex](/es/plugins/codex-harness-reference) para la superficie completa de configuración
y [Harness de Codex](/es/plugins/codex-harness) para el modelo de runtime.

`codexPlugins` se aplica solo a sesiones que seleccionan el harness nativo de Codex.
No habilita plugins de Codex para Pi, ejecuciones normales del proveedor OpenAI, vinculaciones de conversación
ACP ni ningún harness que no sea Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita la compatibilidad
  nativa con Plugin/app de Codex para el arnés de Codex. Valor predeterminado:
  `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para las elicitaciones de app
  de Plugin migradas. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita
  una entrada de Plugin migrada cuando `codexPlugins.enabled` global también es
  true. Valor predeterminado: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace. V1 solo admite `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`:
  identidad estable de Plugin de Codex procedente de la migración, por ejemplo
  `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  anulación de acciones destructivas por Plugin. Cuando se omite, se usa el
  valor global de `allow_destructive_actions`.

`codexPlugins.enabled` es la directiva global de habilitación. Las entradas
explícitas de plugins escritas por la migración son el conjunto duradero de
instalación y elegibilidad de reparación. `plugins["*"]` no es compatible, no
hay interruptor `install`, y los valores locales de `marketplacePath`
intencionalmente no son campos de configuración porque son específicos del host.

Las comprobaciones de preparación de `app/list` se almacenan en caché durante
una hora y se actualizan de forma asíncrona cuando quedan obsoletas. La
configuración de app de hilos de Codex se calcula al establecer la sesión del
arnés de Codex, no en cada turno; usa `/new`, `/reset` o un reinicio del Gateway
después de cambiar la configuración de Plugin nativo.

- `plugins.entries.firecrawl.config.webFetch`: ajustes del proveedor de
  obtención web de Firecrawl.
  - `apiKey`: clave de API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, al `tools.web.fetch.firecrawl.apiKey` heredado o a la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; las anulaciones autoalojadas deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extraer solo el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: ajustes de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilitar el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (p. ej., `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ajustes de Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (valor predeterminado `false`).
  - `frequency`: cadencia cron para cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: anulación opcional del modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínalo con `allowedModels` para restringir los destinos. Los errores de modelo no disponible se reintentan una vez con el modelo predeterminado de la sesión; los fallos de confianza o de lista de permitidos no recurren silenciosamente a otro modelo.
  - la política de fases y los umbrales son detalles de implementación (no claves de configuración visibles para el usuario).
- La configuración completa de memoria se encuentra en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins habilitados del paquete Claude también pueden aportar valores predeterminados de Pi embebidos desde `settings.json`; OpenClaw los aplica como ajustes de agente saneados, no como parches de configuración sin procesar de OpenClaw.
- `plugins.slots.memory`: elige el id del Plugin de memoria activo, o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del Plugin de motor de contexto activo; el valor predeterminado es `"legacy"` salvo que instales y selecciones otro motor.

Consulta [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria de seguimiento inferida: OpenClaw puede detectar comprobaciones de seguimiento desde turnos de conversación y entregarlas mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilitar la extracción oculta por LLM, el almacenamiento y la entrega por Heartbeat de compromisos de seguimiento inferidos. Valor predeterminado: `false`.
- `commitments.maxPerDay`: máximo de compromisos de seguimiento inferidos entregados por sesión de agente en un día móvil. Valor predeterminado: `3`.

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

- `evaluateEnabled: false` deshabilita `act:evaluate` y `wait --fn`.
- `tabCleanup` recupera pestañas rastreadas del agente principal tras el tiempo de inactividad o cuando una sesión supera su límite. Establece `idleMinutes: 0` o `maxTabsPerSession: 0` para deshabilitar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se define, por lo que la navegación del navegador se mantiene estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confías intencionalmente en la navegación del navegador por red privada.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de accesibilidad/descubrimiento.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de adjunción (inicio/detención/restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`; usa WS(S)
  cuando tu proveedor te entregue una URL directa de WebSocket de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad
  CDP remota y `attachOnly`, además de solicitudes de apertura de pestañas. Los
  perfiles de loopback gestionados mantienen los valores predeterminados locales de CDP.
- Si un servicio CDP gestionado externamente es accesible mediante loopback, configura
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de
  loopback como un perfil de navegador gestionado localmente y puede informar errores de propiedad de puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden adjuntarse
  en el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden configurar `userDataDir` para apuntar a un
  perfil específico de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` mantienen los límites actuales de ruta de Chrome MCP:
  acciones basadas en snapshot/ref en lugar de selección por selector CSS, hooks de
  carga de un solo archivo, sin anulaciones de tiempo de espera de diálogos, sin
  `wait --load networkidle`, y sin `responsebody`, exportación de PDF, intercepción
  de descargas ni acciones por lotes.
- Los perfiles `openclaw` gestionados localmente asignan automáticamente `cdpPort` y `cdpUrl`; solo
  configura `cdpUrl` explícitamente para CDP remoto.
- Los perfiles gestionados localmente pueden configurar `executablePath` para anular
  el `browser.executablePath` global de ese perfil. Usa esto para ejecutar un perfil
  en Chrome y otro en Brave.
- Los perfiles gestionados localmente usan `browser.localLaunchTimeoutMs` para el descubrimiento HTTP
  de Chrome CDP después de iniciar el proceso y `browser.localCdpReadyTimeoutMs` para la
  preparación de websocket CDP posterior al lanzamiento. Auméntalos en hosts más lentos donde Chrome
  arranca correctamente pero las comprobaciones de preparación compiten con el inicio. Ambos valores deben ser
  enteros positivos hasta `120000` ms; los valores de configuración inválidos se rechazan.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` y `browser.profiles.<name>.executablePath` aceptan
  `~` y `~/...` para el directorio de inicio de tu SO antes de iniciar Chromium.
  `userDataDir` por perfil en perfiles `existing-session` también expande la tilde.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega flags de lanzamiento adicionales al inicio local de Chromium (por ejemplo,
  `--disable-gpu`, tamaño de ventana o flags de depuración).

---

## UI

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

- `seamColor`: color de acento para el chrome de UI de la app nativa (tinte de burbuja de Modo Conversación, etc.).
- `assistant`: anulación de identidad de UI de Control. Recurre a la identidad del agente activo.

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

<Accordion title="Detalles de campos de Gateway">

- `mode`: `local` (ejecutar Gateway) o `remote` (conectarse a un Gateway remoto). Gateway se niega a iniciarse a menos que sea `local`.
- `port`: puerto único multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias de enlace heredados**: usa valores de modo de enlace en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota de Docker**: el enlace `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con redes de puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que no se puede acceder al Gateway. Usa `--network host`, o configura `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: requerida de forma predeterminada. Los enlaces que no son loopback requieren autenticación de Gateway. En la práctica, eso significa un token/contraseña compartidos o un proxy inverso con conocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones de local loopback confiables; intencionalmente no se ofrece en los prompts de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador/usuario a un proxy inverso con conocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulta [Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada un origen de proxy **que no sea loopback**; los proxies inversos loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como alternativa directa local; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de la UI de control/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación de encabezado de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token asume que el host del Gateway es confiable. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticación fallida. Se aplica por IP de cliente y por ámbito de autenticación (shared-secret y device-token se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la UI de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por lo tanto, los intentos incorrectos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos avancen en paralelo como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establécelo en `false` cuando intencionalmente quieras que el tráfico de localhost también esté limitado por tasa (para configuraciones de prueba o despliegues estrictos con proxy).
- Los intentos de autenticación WS con origen de navegador siempre se limitan por tasa con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta desde el navegador contra localhost).
- En loopback, esos bloqueos con origen de navegador se aíslan por valor
  normalizado de `Origin`, por lo que los fallos repetidos desde un origen
  localhost no bloquean automáticamente un origen diferente.
- `tailscale.mode`: `serve` (solo tailnet, enlace loopback) o `funnel` (público, requiere autenticación).
- `tailscale.preserveFunnel`: cuando es `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve al inicio y lo omite
  si una ruta Funnel configurada externamente ya cubre el puerto del Gateway.
  Valor predeterminado `false`.
- `controlUi.allowedOrigins`: lista de permitidos explícita de orígenes de navegador para conexiones WebSocket de Gateway. Requerida cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para mensajes de chat agrupados de la UI de control. Acepta valores de ancho CSS restringidos como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita la alternativa de origen basada en encabezado Host para despliegues que dependen intencionalmente de una política de origen basada en encabezado Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: anulación de emergencia del entorno de proceso
  del lado del cliente que permite `ws://` en texto plano a IPs de redes privadas
  confiables; el valor predeterminado sigue siendo solo loopback para texto plano. No hay un equivalente en `openclaw.json`, y la configuración de redes privadas del navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, no afecta a los clientes WebSocket
  de Gateway.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran por sí mismos la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relay APNs externo usado por las compilaciones oficiales/TestFlight de iOS después de que publican registros respaldados por relay en el Gateway. Esta URL debe coincidir con la URL del relay compilada en la compilación de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del Gateway al relay en milisegundos. Valor predeterminado `10000`.
- Los registros respaldados por relay se delegan a una identidad específica de Gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al Gateway una concesión de envío con alcance de registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales de entorno para la configuración de relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo para URLs de relay HTTP loopback. Las URLs de relay de producción deben permanecer en HTTPS.
- `gateway.handshakeTimeoutMs`: tiempo de espera del handshake WebSocket de Gateway antes de la autenticación, en milisegundos. Valor predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando está establecido. Auméntalo en hosts cargados o de baja potencia donde los clientes locales pueden conectarse mientras el calentamiento de inicio aún se estabiliza.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado del canal en minutos. Establece `0` para deshabilitar globalmente los reinicios del monitor de estado. Valor predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`. Valor predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicios del monitor de estado por canal/cuenta en una hora móvil. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando se establece, tiene precedencia sobre la anulación a nivel de canal.
- Las rutas de llamada del Gateway local pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin enmascaramiento mediante alternativa remota).
- `trustedProxies`: IPs de proxies inversos que terminan TLS o inyectan encabezados de cliente reenviado. Incluye solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de proxy/detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean elegibles para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Valor predeterminado `false` para un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista de permitidos CIDR/IP opcional para aprobar automáticamente el emparejamiento inicial de dispositivos de nodo sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador/navegador/UI de control/WebChat, y no aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: conformación global de permitidos/denegados para comandos de nodo declarados después del emparejamiento y la evaluación de la lista de permitidos de la plataforma. Usa `allowCommands` para optar por comandos de nodo peligrosos como `camera.snap`, `camera.clip` y `screen.record`; `denyCommands` elimina un comando aunque un valor predeterminado de plataforma o una autorización explícita lo incluyera. Después de que un nodo cambie su lista de comandos declarados, rechaza y vuelve a aprobar ese emparejamiento de dispositivo para que el Gateway almacene la instantánea de comandos actualizada.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (amplía la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: deshabilitado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimiento de entrada de URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no establecidas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención de URLs.
- Encabezado opcional de endurecimiento de respuesta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establécelo solo para orígenes HTTPS que controles; consulta [Autenticación de proxy confiable](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: habilita la terminación TLS en el listener del Gateway (HTTPS/WSS) (valor predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado/clave autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantén permisos restringidos.
- `caPath`: ruta opcional del paquete CA para verificación de clientes o cadenas de confianza personalizadas.

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
  - `"restart"`: siempre reinicia el proceso del Gateway cuando cambia la configuración.
  - `"hot"`: aplica cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítelo para usar la espera acotada predeterminada (`300000`); establécelo en `0` para esperar indefinidamente y registrar advertencias periódicas de pendientes.

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
Se rechazan los tokens de hook en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token del Gateway.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si una asignación o preset usa un `sessionKey` con plantilla, establece `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esa activación.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El `sessionKey` de la carga útil de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores de `sessionKey` de asignación renderizados desde plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de asignación">

- `match.path` coincide con la subruta después de `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen desde la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanece dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos de directorios).
  - Mantén `hooks.transformsDir` bajo `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueve el módulo de transformación al directorio de transformaciones de hooks o elimina `hooks.transformsDir`.
- `agentId` enruta a un agente específico; los ID desconocidos recurren al predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones del agente de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de asignación basadas en plantillas establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional de prefijos para valores explícitos de `sessionKey` (solicitud + asignación), p. ej. `["hook:"]`. Pasa a ser obligatoria cuando cualquier asignación o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` sustituye el LLM para esta ejecución de hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración de Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
- Si necesitas `hooks.allowRequestSessionKey: false`, sustituye el preset con un `sessionKey` estático en lugar del predeterminado con plantilla.

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

- Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecutes un `gog gmail watch serve` separado junto con el Gateway.

---

## Host del Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Sirve HTML/CSS/JS editable por agentes y A2UI mediante HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Enlaces que no son loopback: las rutas de Canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), igual que otras superficies HTTP del Gateway.
- Las WebViews de Node normalmente no envían encabezados de autenticación; después de que un nodo se empareja y conecta, el Gateway anuncia URL de capacidades con alcance de nodo para acceso a Canvas/A2UI.
- Las URL de capacidades están vinculadas a la sesión WS activa del nodo y expiran rápidamente. No se usa respaldo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el gateway.
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
- `full`: incluye `cliPath` + `sshPort`; la publicidad multicast en LAN aún requiere que el Plugin `bonjour` incluido esté habilitado.
- `off`: suprime la publicidad multicast en LAN sin cambiar la habilitación del Plugin.
- El Plugin `bonjour` incluido se inicia automáticamente en hosts macOS y es opcional en Linux, Windows e implementaciones del Gateway en contenedores.
- El nombre de host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida, con respaldo a `openclaw`. Sobrescríbelo con `OPENCLAW_MDNS_HOSTNAME`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast bajo `~/.openclaw/dns/`. Para descubrimiento entre redes, combínalo con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

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
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sobrescribe variables existentes).
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
- Las variables ausentes o vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias secretas son aditivas: los valores en texto plano siguen funcionando.

### `SecretRef`

Usa una forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- Patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
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
- Las rutas de proveedores file y exec fallan de forma cerrada cuando la verificación de ACL de Windows no está disponible. Establece `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos con symlink. Establece `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación de directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa las variables requeridas explícitamente con `passEnv`.
- Las referencias secretas se resuelven en el momento de la activación en una instantánea en memoria; luego las rutas de solicitud solo leen la instantánea.
- El filtrado de superficie activa se aplica durante la activación: las referencias sin resolver en superficies habilitadas hacen fallar el inicio o la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

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
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe a perfiles de clave API canónicos `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas en tiempo de ejecución provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se eliminan cuando se descubren.
- Las importaciones OAuth heredadas provienen de `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: espera base de reintento en horas cuando un perfil falla debido a errores reales de
  facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación puede
  llegar aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos del proveedor
  permanecen limitados al proveedor que los posee (por ejemplo OpenRouter
  `Key limit exceeded`). Los mensajes reintentables de HTTP `402` de ventana de uso o
  límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de espera de reintento por facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial de la espera de reintento por facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: espera base de reintento en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento de espera de reintento de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de espera de reintento (predeterminado: `24`).
- `overloadedProfileRotations`: máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al recurso de reserva de modelo (predeterminado: `1`). Formas de proveedor ocupado como `ModelNotReadyException` llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al recurso de reserva de modelo (predeterminado: `1`). Ese contenedor de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

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
- Establece `logging.file` para una ruta estable.
- `consoleLevel` sube a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro activo en bytes antes de la rotación (entero positivo; predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento de mejor esfuerzo para la salida de consola, registros de archivo, registros de log OTLP y texto persistido de transcripciones de sesión. `redactSensitive: "off"` solo desactiva esta política general de registros/transcripciones; las superficies de seguridad de UI/herramientas/diagnósticos todavía redactan secretos antes de emitirlos.

---

## Diagnósticos

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
- `stuckSessionWarnMs`: umbral de antigüedad sin progreso en ms para clasificar sesiones de procesamiento de larga duración como `session.long_running`, `session.stalled` o `session.stuck`. Respuestas, herramientas, estados, bloqueos y progreso ACP restablecen el temporizador; los diagnósticos `session.stuck` repetidos aplican espera de reintento mientras no haya cambios.
- `stuckSessionAbortMs`: umbral de antigüedad sin progreso en ms antes de que el trabajo activo atascado elegible pueda abortarse y drenarse para recuperación. Cuando no está establecido, OpenClaw usa la ventana de ejecución incrustada extendida más segura de al menos 10 minutos y 5x `stuckSessionWarnMs`.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`). Para la configuración completa, el catálogo de señales y el modelo de privacidad, consulta [exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del colector para exportación OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos por señal. Cuando se establecen, anulan `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con solicitudes de exportación OTel.
- `otel.serviceName`: nombre de servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita la exportación de trazas, métricas o registros.
- `otel.sampleRate`: tasa de muestreo de trazas `0`-`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para atributos de spans OTEL. Desactivado de forma predeterminada. El booleano `true` captura contenido de mensajes/herramientas no del sistema; la forma de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` y `systemPrompt` explícitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para los atributos experimentales más recientes del proveedor de spans GenAI. De forma predeterminada, los spans conservan el atributo heredado `gen_ai.system` por compatibilidad; las métricas GenAI usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK global de OpenTelemetry. OpenClaw omite entonces el arranque/apagado del SDK propiedad del plugin mientras mantiene activos los listeners de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoints específicas por señal usadas cuando la clave de configuración correspondiente no está establecida.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones incrustadas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de trazas de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de trazas de caché (todos predeterminados: `true`).

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
- `checkOnStart`: comprobar actualizaciones npm cuando se inicia el Gateway (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente el canal estable (predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional de distribución de despliegue del canal estable en horas (predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia con la que se ejecutan las comprobaciones del canal beta en horas (predeterminado: `1`; máximo: `24`).

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

- `enabled`: puerta global de la característica ACP (predeterminado: `true`; establece `false` para ocultar las facilidades de despacho y generación de ACP).
- `dispatch.enabled`: puerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establece `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id predeterminado del backend de tiempo de ejecución ACP (debe coincidir con un plugin registrado de tiempo de ejecución ACP).
  Instala primero el plugin de backend y, si `plugins.allow` está establecido, incluye el id del plugin de backend (por ejemplo `acpx`) o el backend ACP no se cargará.
- `defaultAgent`: id del agente objetivo ACP de reserva cuando las generaciones no especifican un objetivo explícito.
- `allowedAgents`: lista de permitidos de ids de agente autorizados para sesiones de tiempo de ejecución ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque transmitido.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramientas por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes de texto visible después de eventos de herramientas ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de que sean elegibles para limpieza.
- `runtime.installCommand`: comando de instalación opcional para ejecutar al inicializar un entorno de tiempo de ejecución ACP.

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
  - `"off"`: sin texto de eslogan (el título/versión del banner todavía se muestra).
- Para ocultar todo el banner (no solo los eslóganes), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente

Metadatos escritos por flujos guiados de configuración de la CLI (`onboard`, `configure`, `doctor`):

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

Consulta los campos de identidad `agents.list` en [Valores predeterminados de agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan mediante el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar claves desconocidas).

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

- `sessionRetention`: cuánto tiempo conservar las sesiones de ejecuciones Cron aisladas completadas antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones Cron eliminadas archivadas. Predeterminado: `24h`; establece `false` para deshabilitarlo.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de la poda. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes retenidas cuando se activa la poda del registro de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST de Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía encabezado de autenticación.
- `webhook`: URL de Webhook heredada obsoleta de respaldo (http/https) usada solo para trabajos almacenados que aún tienen `notify: true`.

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

- `maxAttempts`: reintentos máximos para trabajos de ejecución única ante errores transitorios (predeterminado: `3`; intervalo: `0`-`10`).
- `backoffMs`: arreglo de retrasos de backoff en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1-10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de ejecución única. Los trabajos recurrentes usan un manejo de fallos separado.

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

- `enabled`: habilita alertas de fallo para trabajos Cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: cuenta las ejecuciones omitidas consecutivas para el umbral de alerta (predeterminado: `false`). Las ejecuciones omitidas se rastrean por separado y no afectan el backoff de errores de ejecución.
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

- Destino predeterminado para notificaciones de fallos de Cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos de destino.
- `channel`: anulación de canal para la entrega de anuncio. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino de anuncio explícito o URL de Webhook. Obligatorio para el modo Webhook.
- `accountId`: anulación opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se establece ningún destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` recurren a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo se admite para trabajos `sessionTarget="isolated"`, salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones Cron aisladas se rastrean como [tareas en segundo plano](/es/automation/tasks).

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
| `{{MediaPath}}`    | Ruta local del medio                              |
| `{{MediaType}}`    | Tipo de medio (imagen/audio/documento/...)        |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Prompt de medios resuelto para entradas de CLI    |
| `{{MaxChars}}`     | Máximo de caracteres de salida resuelto para entradas de CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Asunto del grupo (mejor esfuerzo)                 |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | Nombre visible del remitente (mejor esfuerzo)     |
| `{{SenderE164}}`   | Número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | Pista del proveedor (whatsapp, telegram, discord, etc.) |

---

## Includes de configuración (`$include`)

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
- Arreglo de archivos: se combinan en profundidad en orden (los posteriores anulan a los anteriores).
- Claves hermanas: se combinan después de los includes (anulan los valores incluidos).
- Includes anidados: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` se permiten solo cuando aún se resuelven dentro de ese límite.
- Las escrituras realizadas por OpenClaw que cambian solo una sección de nivel superior respaldada por un include de archivo único escriben en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Los includes raíz, los arreglos de includes y los includes con anulaciones hermanas son de solo lectura para escrituras realizadas por OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis e includes circulares.

---

_Relacionado: [Configuración](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
