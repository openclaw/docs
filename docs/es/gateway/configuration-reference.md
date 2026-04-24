---
read_when:
    - Necesitas semántica o valores predeterminados exactos a nivel de campo de configuración
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración del Gateway para claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-04-24T05:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dc3b920ada38951086908713e9347141d8b11faa007df23a90a2532ac6f3bb2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referencia de configuración principal para `~/.openclaw/openclaw.json`. Para una visión general orientada a tareas, consulta [Configuración](/es/gateway/configuration).

Esta página cubre las superficies principales de configuración de OpenClaw y enlaza a referencias externas cuando un subsistema tiene su propia referencia más profunda. **No** intenta incluir en una sola página todos los catálogos de comandos controlados por canales/Plugins ni todas las opciones profundas de memoria/QMD.

Fuente de verdad del código:

- `openclaw config schema` imprime el JSON Schema en vivo usado para validación y la interfaz de usuario Control, con metadatos de plugins/canales incluidos fusionados cuando están disponibles
- `config.schema.lookup` devuelve un nodo de esquema limitado a una ruta para herramientas de exploración detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de documentación de configuración frente a la superficie actual del esquema

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/es/tools/slash-commands) para el catálogo actual de comandos integrados + incluidos
- páginas del canal/Plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Las claves de configuración por canal se movieron a una página dedicada; consulta
[Configuración — canales](/es/gateway/config-channels) para `channels.*`,
incluidos Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros
canales incluidos (autenticación, control de acceso, varias cuentas, restricción por mención).

## Valores predeterminados del agente, multiagente, sesiones y mensajes

Se movieron a una página dedicada; consulta
[Configuración — agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, thinking, Heartbeat, memoria, medios, Skills, sandbox)
- `multiAgent.*` (enrutamiento y enlaces multiagente)
- `session.*` (ciclo de vida de la sesión, Compaction, pruning)
- `messages.*` (entrega de mensajes, TTS, renderizado de Markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: cuando no está configurado, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)

## Herramientas y proveedores personalizados

La política de herramientas, toggles experimentales, configuración de herramientas respaldadas por proveedor y configuración de proveedor / URL base personalizada se movieron a una página dedicada; consulta
[Configuración — herramientas y proveedores personalizados](/es/gateway/config-tools).

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

- `allowBundled`: lista de permitidos opcional solo para Skills incluidos (no afecta a los Skills gestionados/del espacio de trabajo).
- `load.extraDirs`: raíces compartidas adicionales de Skills (precedencia más baja).
- `install.preferBrew`: cuando es `true`, prefiere instaladores Homebrew cuando `brew` está disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador de Node para especificaciones `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deshabilita un Skill incluso si está incluido/instalado.
- `entries.<skillKey>.apiKey`: campo de conveniencia para la clave API de Skills que declaran una variable de entorno principal (cadena en texto plano u objeto SecretRef).

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

- Se cargan desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, más `plugins.load.paths`.
- El descubrimiento acepta Plugins nativos de OpenClaw además de paquetes Codex compatibles y paquetes Claude, incluidos paquetes Claude sin manifiesto con el diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los Plugins listados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniencia de clave API a nivel de Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con alcance del Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos de mutación de prompt de `before_agent_start` heredado, al tiempo que conserva `modelOverride` y `providerOverride` heredados. Se aplica a Hooks nativos de Plugins y a directorios de Hooks proporcionados por paquetes compatibles.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para solicitar sobrescrituras por ejecución de `provider` y `model` para ejecuciones en segundo plano de subagentes.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras confiables de subagentes. Usa `"*"` solo cuando realmente quieras permitir cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado por el esquema nativo del Plugin de OpenClaw cuando está disponible).
- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de web fetch de Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` heredado o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminado: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: timeout de solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo Grok que se usará para la búsqueda (por ejemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para las fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (predeterminado `false`).
  - `frequency`: cadencia Cron para cada barrido completo de Dreaming (predeterminado `"0 3 * * *"`).
  - la política de fases y los umbrales son detalles de implementación (no son claves de configuración orientadas al usuario).
- La configuración completa de memoria está en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los Plugins de paquetes Claude habilitados también pueden aportar valores predeterminados integrados de Pi desde `settings.json`; OpenClaw los aplica como configuraciones saneadas del agente, no como parches sin procesar de configuración de OpenClaw.
- `plugins.slots.memory`: elige el id del Plugin de memoria activo, o `"none"` para deshabilitar Plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del Plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.
- `plugins.installs`: metadatos de instalación gestionados por la CLI usados por `openclaw plugins update`.
  - Incluye `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trata `plugins.installs.*` como estado gestionado; prefiere comandos CLI en lugar de ediciones manuales.

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
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se configura, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionalmente en la navegación del navegador por red privada.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de accesibilidad/descubrimiento.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de conexión (inicio/detención/restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL directa de WebSocket de DevTools.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden conectarse en el host seleccionado o a través de un Node de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para apuntar a un perfil específico de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` mantienen los límites actuales de ruta de Chrome MCP:
  acciones basadas en snapshot/ref en lugar de direccionamiento por selectores CSS, Hooks de carga de un solo archivo, sin sobrescrituras de timeout de diálogos, sin `wait --load networkidle` y sin `responsebody`, exportación PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles locales gestionados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; establece `cdpUrl` explícitamente solo para CDP remoto.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega flags extra de lanzamiento al inicio local de Chromium (por ejemplo,
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

- `seamColor`: color de acento para el chrome de la interfaz de usuario de la app nativa (tono de la burbuja del modo Talk, etc.).
- `assistant`: sobrescritura de identidad de la interfaz de usuario Control. Recurre a la identidad del agente activo.

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

- `mode`: `local` (ejecutar gateway) o `remote` (conectarse a un Gateway remoto). El Gateway se niega a iniciarse salvo que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias heredados de bind**: usa valores de modo de bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el bind `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con red bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, así que el Gateway queda inaccesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: requerida de forma predeterminada. Los binds fuera de loopback requieren autenticación del Gateway. En la práctica eso significa un token/contraseña compartidos o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente como `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está definido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones locales confiables de loopback; intencionalmente no se ofrece en las indicaciones de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación a un proxy inverso con reconocimiento de identidad y confía en encabezados de identidad de `gateway.trustedProxies` (consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth)). Este modo espera una fuente de proxy **fuera de loopback**; los proxies inversos en loopback del mismo host no satisfacen la autenticación `trusted-proxy`.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificado mediante `tailscale whois`). Los endpoints HTTP API **no** usan esa autenticación por encabezado de Tailscale; siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token asume que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticación fallida. Se aplica por IP de cliente y por alcance de autenticación (se rastrean por separado secreto compartido y token de dispositivo). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de registrar el fallo. Por lo tanto, intentos incorrectos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de pasar ambas en carrera como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establece `false` cuando intencionalmente quieras limitar también el tráfico de localhost (para configuraciones de prueba o despliegues estrictos detrás de proxy).
- Los intentos de autenticación WS con origen de navegador siempre se limitan con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta desde navegador en localhost).
- En loopback, esos bloqueos por origen de navegador se aíslan por valor `Origin`
  normalizado, de modo que fallos repetidos desde un origen localhost no bloquean automáticamente
  a otro origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind en loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista explícita de permitidos de orígenes de navegador para conexiones WebSocket del Gateway. Requerida cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el fallback de origen basado en el encabezado Host para despliegues que dependen intencionalmente de una política de origen basada en Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: sobrescritura del lado del cliente para romper vidrio que permite `ws://` en texto plano hacia IP de red privada confiables; el valor predeterminado sigue siendo solo loopback para texto plano.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. No configuran por sí solos la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para el relay APNs externo usado por builds oficiales/TestFlight de iOS después de publicar registros respaldados por relay al Gateway. Esta URL debe coincidir con la URL del relay compilada en la build de iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout en milisegundos para el envío del Gateway al relay. El valor predeterminado es `10000`.
- Los registros respaldados por relay se delegan a una identidad específica de Gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al Gateway un permiso de envío con alcance del registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: sobrescrituras temporales por entorno para la configuración de relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo para desarrollo para URL de relay HTTP en loopback. Las URL de relay de producción deben permanecer en HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de salud de canales en minutos. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantenlo mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicios del monitor de salud por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal para reinicios del monitor de salud manteniendo el monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura por cuenta para canales con varias cuentas. Cuando está configurado, prevalece sobre la sobrescritura a nivel de canal.
- Las rutas locales de llamada al Gateway pueden usar `gateway.remote.*` como fallback solo cuando `gateway.auth.*` no está configurado.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se puede resolver, la resolución falla en modo cerrado (sin fallback remoto que enmascare el problema).
- `trustedProxies`: IP de proxy inverso que terminan TLS o inyectan encabezados del cliente reenviado. Lista solo proxies que controles. Las entradas de loopback siguen siendo válidas para configuraciones del mismo host de detección local/proxy (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes en loopback sean elegibles para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Predeterminado `false` para comportamiento de fallo cerrado.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (extiende la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: deshabilitado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimiento de entrada de URL para Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no configuradas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención por URL.
- Encabezado opcional de endurecimiento de respuesta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúralo solo para orígenes HTTPS que controles; consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de múltiples instancias

Ejecuta varios Gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulta [Múltiples Gateways](/es/gateway/multiple-gateways).

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

- `enabled`: habilita la terminación TLS en el listener del Gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado/clave autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos a la clave privada TLS; mantén permisos restringidos.
- `caPath`: ruta opcional del paquete CA para verificación de cliente o cadenas de confianza personalizadas.

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

- `mode`: controla cómo se aplican en runtime las ediciones de configuración.
  - `"off"`: ignora ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: siempre reinicia el proceso del Gateway cuando cambia la configuración.
  - `"hot"`: aplica cambios en proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; recurre a reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo en ms para esperar operaciones en curso antes de forzar un reinicio (predeterminado: `300000` = 5 minutos).

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
Se rechazan los tokens de Hook en query string.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token del Gateway.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si un mapping o preset usa un `sessionKey` con plantilla, establece `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves estáticas de mapping no requieren esa activación opcional.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` de la carga de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores `sessionKey` de mapping renderizados con plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de mapping">

- `match.path` coincide con la subruta después de `/hooks` (por ejemplo `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga para rutas genéricas.
- Plantillas como `{{messages[0].subject}}` leen desde la carga.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de Hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos de directorio).
- `agentId` enruta a un agente específico; los ids desconocidos recurren al predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agente de Hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de mapping dirigidas por plantilla establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional de prefijos para valores explícitos de `sessionKey` (solicitud + mapping), por ejemplo `["hook:"]`. Pasa a ser obligatoria cuando cualquier mapping o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` tiene como valor predeterminado `last`.
- `model` sobrescribe el LLM para esta ejecución de Hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración de Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
- Si necesitas `hooks.allowRequestSessionKey: false`, sobrescribe el preset con un `sessionKey` estático en lugar del valor predeterminado con plantilla.

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

- El Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecutes un `gog gmail watch serve` separado junto con el Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por el agente y A2UI mediante HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Binds fuera de loopback: las rutas de canvas requieren autenticación del Gateway (token/password/trusted-proxy), igual que otras superficies HTTP del Gateway.
- Los WebViews de Node normalmente no envían encabezados de autenticación; después de que un Node se empareja y conecta, el Gateway anuncia URL de capacidad con alcance del Node para acceso a canvas/A2UI.
- Las URL de capacidad están ligadas a la sesión WS activa del Node y caducan rápidamente. No se usa fallback basado en IP.
- Inyecta un cliente de live-reload en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Deshabilita live reload para directorios grandes o errores `EMFILE`.

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
- El hostname tiene como valor predeterminado `openclaw`. Sobrescríbelo con `OPENCLAW_MDNS_HOSTNAME`.

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

- Las variables de entorno en línea solo se aplican si el entorno del proceso no tiene la clave.
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sobrescribe variables existentes).
- `shellEnv`: importa claves esperadas que falten desde el perfil de tu shell de inicio de sesión.
- Consulta [Entorno](/es/help/environment) para ver la precedencia completa.

### Sustitución de variables de entorno

Haz referencia a variables de entorno en cualquier cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Variables faltantes/vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un literal `${VAR}`.
- Funciona con `$include`.

---

## Secrets

Las referencias de Secret son aditivas: los valores en texto plano siguen funcionando.

### `SecretRef`

Usa una única forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por `/` como `.` o `..` (por ejemplo se rechaza `a/../b`)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas compatibles de credenciales en `openclaw.json`.
- Las referencias de `auth-profiles.json` se incluyen en la resolución en runtime y en la cobertura de auditoría.

### Configuración de proveedores de Secret

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

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (en modo singleValue, `id` debe ser `"value"`).
- Las rutas de proveedores file y exec fallan en modo cerrado cuando la verificación ACL de Windows no está disponible. Establece `allowInsecurePath: true` solo para rutas de confianza que no puedan verificarse.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan rutas de comandos con symlink. Establece `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta del destino resuelto.
- Si `trustedDirs` está configurado, la comprobación de directorio confiable se aplica a la ruta del destino resuelto.
- El entorno del proceso hijo `exec` es mínimo de forma predeterminada; pasa explícitamente las variables necesarias con `passEnv`.
- Las referencias de Secret se resuelven en el momento de activación en una instantánea en memoria; luego las rutas de solicitud leen solo esa instantánea.
- El filtrado de superficies activas se aplica durante la activación: las referencias no resueltas en superficies habilitadas provocan fallo de inicio/recarga, mientras que las superficies inactivas se omiten con diagnósticos.

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
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credencial estáticos.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de runtime provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se depuran cuando se detectan.
- Importaciones OAuth heredadas desde `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento de runtime de Secrets y herramientas `audit/configure/apply`: [Gestión de Secrets](/es/gateway/secrets).

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

- `billingBackoffHours`: backoff base en horas cuando un perfil falla por errores reales de facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación aún puede caer aquí incluso en respuestas `401`/`403`, pero los matchers de texto específicos del proveedor siguen limitados al proveedor que los controla (por ejemplo, OpenRouter `Key limit exceeded`). Los mensajes reintentables de ventana de uso HTTP `402` o de límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`.
- `billingBackoffHoursByProvider`: sobrescrituras opcionales por proveedor para horas de backoff de facturación.
- `billingMaxHours`: límite máximo en horas para el crecimiento exponencial del backoff de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: backoff base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite máximo en minutos para el crecimiento del backoff de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de backoff (predeterminado: `24`).
- `overloadedProfileRotations`: máximo de rotaciones de perfil de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al fallback de modelo (predeterminado: `1`). Formas de proveedor ocupado como `ModelNotReadyException` caen aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: máximo de rotaciones de perfil de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al fallback de modelo (predeterminado: `1`). Ese bucket de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Registros

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
- `maxFileBytes`: tamaño máximo del archivo de registro en bytes antes de que se supriman las escrituras (entero positivo; predeterminado: `524288000` = 500 MB). Usa rotación de registros externa para despliegues de producción.

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
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
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
- `flags`: arreglo de cadenas de flags que habilitan salida de registro dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad en ms para emitir advertencias de sesión atascada mientras una sesión permanece en estado de procesamiento.
- `otel.enabled`: habilita la canalización de exportación OpenTelemetry (predeterminado: `false`).
- `otel.endpoint`: URL del colector para exportación OTel.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recursos.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o registros.
- `otel.sampleRate`: tasa de muestreo de trazas `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `cacheTrace.enabled`: registra instantáneas de seguimiento de caché para ejecuciones integradas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de seguimiento de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de seguimiento de caché (todos con valor predeterminado: `true`).

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

- `channel`: canal de lanzamiento para instalaciones npm/git — `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: comprueba actualizaciones npm cuando se inicia el Gateway (predeterminado: `true`).
- `auto.enabled`: habilita actualización automática en segundo plano para instalaciones por paquete (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente en el canal stable (predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional de dispersión de despliegue del canal stable en horas (predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia en horas con la que se ejecutan las comprobaciones del canal beta (predeterminado: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: flag global de función ACP (predeterminado: `false`).
- `dispatch.enabled`: flag independiente para el envío de turnos de sesión ACP (predeterminado: `true`). Establécelo en `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id predeterminado del backend de runtime ACP (debe coincidir con un Plugin de runtime ACP registrado).
- `defaultAgent`: id del agente ACP de fallback cuando los spawns no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agentes permitidos para sesiones de runtime ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto en streaming.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque en streaming.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramientas por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible tras eventos ocultos de herramientas (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a sobrescrituras booleanas de visibilidad para eventos en streaming.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de ser elegibles para limpieza.
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

- `cli.banner.taglineMode` controla el estilo de la frase del banner:
  - `"random"` (predeterminado): frases rotativas graciosas/estacionales.
  - `"default"`: frase neutral fija (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de frase (el título/versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo las frases), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

Consulta los campos de identidad de `agents.list` en [Valores predeterminados del agente](/es/gateway/config-agents#agent-defaults).

---

## Bridge (legado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los Nodes se conectan mediante WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración heredada de bridge (referencia histórica)">

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
    maxConcurrentRuns: 2,
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

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones Cron aisladas antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones archivadas de Cron eliminadas. Predeterminado: `24h`; establece `false` para deshabilitarlo.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de podarlo. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes retenidas cuando se activa la poda del registro de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST del Webhook de Cron (`delivery.mode = "webhook"`); si se omite no se envía ningún encabezado de autenticación.
- `webhook`: URL de Webhook de fallback heredada y obsoleta (http/https) usada solo para trabajos almacenados que aún tienen `notify: true`.

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

- `maxAttempts`: número máximo de reintentos para trabajos de una sola ejecución en errores transitorios (predeterminado: `3`; rango: `0`–`10`).
- `backoffMs`: arreglo de retrasos de backoff en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; de 1 a 10 entradas).
- `retryOn`: tipos de error que activan reintentos — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de una sola ejecución. Los trabajos recurrentes usan un manejo de fallos independiente.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de fallo para trabajos Cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `mode`: modo de entrega — `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
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
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existe suficiente información de destino.
- `channel`: sobrescritura de canal para entrega por announce. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito de announce o URL de Webhook. Obligatorio para el modo webhook.
- `accountId`: sobrescritura opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo sobrescribe este valor predeterminado global.
- Cuando no se establece ni un destino global ni uno por trabajo, los trabajos que ya entregan mediante `announce` recurren a ese destino principal de announce en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` a menos que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se registran como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo de medios

Marcadores de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones de grupo eliminadas          |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador del destino                         |
| `{{MessageSid}}`   | Id del mensaje del canal                          |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva          |
| `{{MediaUrl}}`     | pseudo-URL del medio entrante                     |
| `{{MediaPath}}`    | ruta local del medio                              |
| `{{MediaType}}`    | tipo de medio (imagen/audio/documento/…)          |
| `{{Transcript}}`   | transcripción de audio                            |
| `{{Prompt}}`       | prompt de medios resuelto para entradas CLI       |
| `{{MaxChars}}`     | máximo de caracteres de salida resuelto para entradas CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | asunto del grupo (best effort)                    |
| `{{GroupMembers}}` | vista previa de miembros del grupo (best effort)  |
| `{{SenderName}}`   | nombre visible del remitente (best effort)        |
| `{{SenderE164}}`   | número de teléfono del remitente (best effort)    |
| `{{Provider}}`     | sugerencia del proveedor (whatsapp, telegram, discord, etc.) |

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

**Comportamiento de fusión:**

- Archivo único: reemplaza el objeto contenedor.
- Arreglo de archivos: se fusionan en profundidad en orden (los posteriores sobrescriben a los anteriores).
- Claves hermanas: se fusionan después de las inclusiones (sobrescriben valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven relativas al archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Se permiten formas absolutas/`../` solo cuando aún se resuelven dentro de ese límite.
- Las escrituras controladas por OpenClaw que cambian solo una sección de nivel superior respaldada por una inclusión de archivo único se escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, los arreglos de inclusiones y las inclusiones con sobrescrituras hermanas son de solo lectura para escrituras controladas por OpenClaw; esas escrituras fallan en modo cerrado en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuración](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
