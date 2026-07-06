---
read_when:
    - Necesitas semántica o valores predeterminados exactos de configuración a nivel de campo
    - Está validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración de Gateway para claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-06T10:49:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e431290ad59b7b350150149ca603b014c5611751c62162913193a7c470ecd190
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia a nivel de campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más profundas de subsistemas. Para orientación de configuración orientada a tareas, consulta [Configuración](/es/gateway/configuration). Los catálogos de comandos propiedad de canales y plugins, y los controles profundos de memoria/QMD, viven en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw usa valores predeterminados seguros cuando se omiten.

La verdad del código prevalece sobre esta página:

- `openclaw config schema` imprime el JSON Schema en vivo usado para validación y Control UI, con los metadatos de paquetes integrados/plugins/canales combinados.
- Los agentes deben llamar a la acción de herramienta `gateway` `config.schema.lookup` para obtener un nodo de esquema exacto acotado por ruta antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento contra la superficie actual del esquema.

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de dreaming bajo `plugins.entries.memory-core.config.dreaming`.
- [Comandos slash](/es/tools/slash-commands) para el catálogo actual de comandos integrados + incluidos.
- Páginas del canal/plugin propietario para superficies de comandos específicas de canal.

---

## Canales

Las claves de configuración por canal viven en [Configuración - canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales incluidos (autenticación, control de acceso, varias cuentas, control de menciones).

## Valores predeterminados de agentes, multiagente, sesiones y mensajes

Consulta [Configuración - agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, heartbeat, memoria, medios, Skills, sandbox)
- `multiAgent.*` (enrutamiento y enlaces multiagente)
- `session.*` (ciclo de vida de sesión, compaction, poda)
- `messages.*` (entrega de mensajes, TTS, renderizado de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: anulación del nivel de razonamiento para la ejecución completa del agente de OpenClaw detrás de las consultas en tiempo real de Talk en Control UI
  - `talk.consultFastMode`: anulación puntual de modo rápido para consultas en tiempo real de Talk en Control UI
  - `talk.speechLocale`: id de locale BCP 47 opcional para el reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no está definido, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback de retransmisión del Gateway para transcripciones finalizadas de Talk en tiempo real que omiten `openclaw_agent_consult`

## Herramientas y proveedores personalizados

La política de herramientas, los toggles experimentales, la configuración de herramientas respaldadas por proveedor y la configuración de proveedor personalizado / URL base viven en [Configuración - herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, listas de modelos permitidos y configuración de proveedores personalizados viven en [Configuración - herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers.*.localService`: gestor opcional de procesos bajo demanda para servidores de modelos locales. OpenClaw sondea el endpoint de estado configurado, inicia el `command` absoluto cuando es necesario, espera a que esté listo y luego envía la solicitud del modelo. Consulta [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla el arranque de precios en segundo plano que comienza después de que los sidecars y canales alcanzan la ruta lista del Gateway. Cuando es `false`, el Gateway omite las obtenciones de catálogos de precios de OpenRouter y LiteLLM; los valores configurados en `models.providers.*.models[].cost` siguen funcionando para estimaciones de costo locales.

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw viven bajo `mcp.servers` y las consumen OpenClaw integrado y otros adaptadores de runtime. Los comandos `openclaw mcp list`, `show`, `set` y `unset` gestionan este bloque sin conectarse al servidor objetivo durante las ediciones de configuración.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definiciones de servidores MCP remotos o stdio con nombre para runtimes que exponen herramientas MCP configuradas.
  Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan al campo canónico `transport`.
- `mcp.servers.<name>.enabled`: define `false` para conservar una definición de servidor guardada mientras se excluye del descubrimiento MCP de OpenClaw integrado y de la proyección de herramientas.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout de solicitud MCP por servidor en segundos o milisegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout de conexión por servidor en segundos o milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicio opcional de concurrencia para adaptadores que pueden elegir si emiten llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: define `"oauth"` para servidores MCP HTTP que requieren OAuth. Ejecuta `openclaw mcp login <name>` para almacenar tokens bajo el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: anulaciones opcionales de alcance OAuth, URL de redirección y URL de metadatos del cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS HTTP para endpoints privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP descubiertas a nombres coincidentes; `exclude` oculta nombres coincidentes. Las entradas son nombres exactos de herramientas MCP o globs simples con `*`. Los servidores con recursos o prompts también generan nombres de herramientas utilitarias (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres usan el mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del servidor de aplicación de Codex.
  Este bloque es metadatos de OpenClaw solo para hilos del servidor de aplicación de Codex; no afecta sesiones ACP, configuración genérica del harness de Codex ni otros adaptadores de runtime.
  `codex.agents` no vacío limita el servidor a los ids de agente de OpenClaw listados.
  Las listas de agentes acotadas vacías, en blanco o inválidas se rechazan mediante validación de configuración y la ruta de proyección del runtime las omite en lugar de volverlas globales.
  `codex.defaultToolsApprovalMode` emite el
  `default_tools_approval_mode` nativo de Codex para ese servidor. OpenClaw elimina el bloque `codex`
  antes de pasar la configuración nativa `mcp_servers` a Codex. Omite el bloque para mantener el servidor proyectado para cada agente del servidor de aplicación de Codex con el comportamiento MCP predeterminado de aprobación de Codex.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP incluidos y acotados por sesión.
  Las ejecuciones integradas puntuales solicitan limpieza al final de la ejecución; este TTL es el respaldo para sesiones de larga duración y futuros llamadores.
- Los cambios bajo `mcp.*` se aplican en caliente al desechar runtimes MCP de sesión en caché.
  El siguiente descubrimiento/uso de herramienta los recrea desde la nueva configuración, por lo que las entradas eliminadas de `mcp.servers` se recolectan de inmediato en lugar de esperar al TTL de inactividad.
- El descubrimiento en runtime también respeta las notificaciones de cambios de lista de herramientas MCP al descartar el catálogo en caché de esa sesión. Los servidores que anuncian recursos o prompts obtienen herramientas utilitarias para listar/leer recursos y listar/obtener prompts. Los fallos repetidos de llamadas a herramientas pausan brevemente el servidor afectado antes de intentar otra llamada.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: allowlist opcional solo para Skills incluidas (Skills gestionadas/de espacio de trabajo no afectadas).
- `load.extraDirs`: raíces de Skills compartidas adicionales (menor precedencia).
- `load.allowSymlinkTargets`: raíces de destino reales de confianza a las que pueden resolver los symlinks de Skills cuando el enlace vive fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que la aplicación de Skill Workshop escriba a través de destinos de symlink ya confiables (predeterminado: false).
- `install.preferBrew`: cuando es true, prefiere instaladores Homebrew cuando `brew` está disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador de Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes Gateway `operator.admin` de confianza instalen archivos zip privados preparados mediante `skills.upload.*`
  (predeterminado: false). Esto solo habilita la ruta de archivos subidos; las instalaciones normales de ClawHub no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita una Skill incluso si está incluida/instalada.
- `entries.<skillKey>.apiKey`: comodidad para Skills que declaran una variable de entorno primaria (cadena de texto plano u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: acotan el descubrimiento de Skills y el prompt de Skills orientado al modelo.
- La configuración de autonomía/aprobación de Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) está documentada en [Configuración de Skills](/es/tools/skills-config).

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

- Cargados desde directorios de paquete o bundle bajo `~/.openclaw/extensions` y `<workspace>/.openclaw/extensions`, además de archivos o directorios listados en `plugins.load.paths`.
- Coloca archivos de plugin independientes en `plugins.load.paths`; las raíces de extensión autodetectadas ignoran archivos `.js`, `.mjs` y `.ts` de nivel superior para que los scripts auxiliares en esas raíces no bloqueen el inicio.
- El descubrimiento acepta plugins nativos de OpenClaw además de bundles compatibles de Codex y Claude, incluidos bundles de diseño predeterminado de Claude sin manifiesto.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins listados). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo práctico de clave API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con alcance de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que mutan prompts desde el `before_agent_start` heredado, a la vez que preserva los `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins confiables no incluidos en bundle pueden leer contenido bruto de conversación desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confiar explícitamente en este plugin para solicitar sobrescrituras de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras confiables de subagentes. Usa `"*"` solo cuando quieras permitir intencionalmente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confiar explícitamente en este plugin para solicitar sobrescrituras de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras confiables de finalización LLM de plugin. Usa `"*"` solo cuando quieras permitir intencionalmente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confiar explícitamente en este plugin para ejecutar `api.runtime.llm.complete` contra un id de agente no predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema de plugin nativo de OpenClaw cuando está disponible).
- La configuración de cuenta/runtime del plugin de canal vive bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del plugin de arnés Codex

El plugin `codex` incluido en bundle posee la configuración nativa del arnés de app-server de Codex bajo
`plugins.entries.codex.config`. Consulta la
[referencia del arnés Codex](/es/plugins/codex-harness-reference) para ver toda la superficie de configuración
y [arnés Codex](/es/plugins/codex-harness) para el modelo de runtime.

`codexPlugins` se aplica solo a sesiones que seleccionan el arnés nativo Codex.
No habilita plugins Codex para ejecuciones de proveedor de OpenClaw, enlaces de conversación
ACP ni ningún arnés que no sea Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita el soporte nativo de
  plugin/app de Codex para el arnés Codex. Predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para solicitudes de apps de plugin migradas.
  Usa `true` para aceptar esquemas seguros de aprobación Codex sin preguntar, `false`
  para rechazarlos, `"auto"` para enrutar las aprobaciones requeridas por Codex a través de las
  aprobaciones de plugin de OpenClaw, o `"ask"` para preguntar por cada acción de escritura/destructiva
  de plugin sin aprobación duradera. El modo `"ask"` borra las sobrescrituras duraderas de aprobación
  por herramienta de Codex para la app afectada y selecciona el revisor humano
  de aprobaciones para esa app antes de que comience el hilo de Codex.
  Predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una
  entrada de plugin migrada cuando `codexPlugins.enabled` global también es true.
  Predeterminado: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace. V1 solo admite `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad estable
  del plugin Codex desde la migración, por ejemplo `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  sobrescritura por plugin de acciones destructivas. Cuando se omite, se usa el valor global
  `allow_destructive_actions`. El valor por plugin acepta las mismas políticas
  `true`, `false`, `"auto"` o `"ask"`.

Cada app de plugin admitida que usa `"ask"` enruta las solicitudes de aprobación de esa app
al revisor humano. Otras apps y aprobaciones de hilo que no son de app mantienen su
revisor configurado, por lo que las políticas mixtas de plugin no heredan el comportamiento `"ask"`.

`codexPlugins.enabled` es la directiva global de habilitación. Las entradas explícitas de plugin
escritas por la migración son el conjunto duradero de instalación y elegibilidad de reparación.
`plugins["*"]` no es compatible, no hay interruptor `install`, y los valores locales
`marketplacePath` intencionalmente no son campos de configuración porque son
específicos del host.

Las comprobaciones de disponibilidad de `app/list` se almacenan en caché durante una hora y se actualizan
asíncronamente cuando quedan obsoletas. La configuración de apps de hilo Codex se calcula al establecer
la sesión del arnés Codex, no en cada turno; usa `/new`, `/reset` o reinicia el Gateway
después de cambiar la configuración nativa de plugins.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de recuperación web de Firecrawl.
  - `apiKey`: clave API opcional de Firecrawl para límites más altos (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, al heredado `tools.web.fetch.firecrawl.apiKey` o a la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminado: `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: timeout de solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo Grok que se usará para la búsqueda (p. ej., `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (predeterminado `false`).
  - `frequency`: cadencia cron para cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: sobrescritura opcional de modelo de subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínalo con `allowedModels` para restringir destinos. Los errores de modelo no disponible se reintentan una vez con el modelo predeterminado de la sesión; las fallas de confianza o lista de permitidos no recurren silenciosamente.
  - la política de fases y los umbrales son detalles de implementación (no claves de configuración orientadas al usuario).
- La configuración completa de memoria vive en [referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins de bundle de Claude habilitados también pueden aportar valores predeterminados integrados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración sanitizada de agente, no como parches brutos de configuración de OpenClaw.
- `plugins.slots.memory`: elige el id del plugin de memoria activo, o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.

Consulta [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria de seguimiento inferida: OpenClaw puede detectar comprobaciones desde turnos de conversación y entregarlas mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción LLM oculta, el almacenamiento y la entrega por Heartbeat para compromisos de seguimiento inferidos. Predeterminado: `false`.
- `commitments.maxPerDay`: cantidad máxima de compromisos de seguimiento inferidos entregados por sesión de agente en un día móvil. Predeterminado: `3`.

Consulta [compromisos inferidos](/es/concepts/commitments).

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
- `tabCleanup` recupera las pestañas del agente principal rastreadas después del tiempo de inactividad o cuando una
  sesión supera su límite. Establece `idleMinutes: 0` o `maxTabsPerSession: 0` para
  deshabilitar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se define, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfil CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de accesibilidad/detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de adjunción (inicio/detención/restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL directa de WebSocket de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad CDP remota y
  `attachOnly`, además de a las solicitudes de apertura de pestañas. Los perfiles gestionados de loopback
  conservan los valores predeterminados locales de CDP. La enumeración persistente de pestañas remotas de Playwright
  usa el valor mayor como plazo límite de la operación.
- Si un servicio CDP gestionado externamente es accesible mediante loopback, establece
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de loopback como un
  perfil de navegador gestionado localmente y puede informar errores de propiedad del puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden adjuntarse en
  el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para apuntar a un perfil específico
  de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden establecer `cdpUrl` cuando Chrome ya se ejecuta
  detrás de un endpoint de detección HTTP(S) de DevTools o de un endpoint directo WS(S). En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de usar la conexión automática;
  `userDataDir` se ignora para los argumentos de lanzamiento de Chrome MCP.
- Los perfiles `existing-session` conservan los límites actuales de ruta de Chrome MCP:
  acciones basadas en snapshot/ref en lugar de selección por selector CSS, hooks de carga
  de un archivo, sin anulaciones de tiempo de espera de diálogo, sin `wait --load networkidle` y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles `openclaw` gestionados localmente asignan automáticamente `cdpPort` y `cdpUrl`; establece
  `cdpUrl` explícitamente solo para perfiles CDP remotos o adjunción a endpoint de existing-session.
- Los perfiles gestionados localmente pueden establecer `executablePath` para anular el
  `browser.executablePath` global de ese perfil. Usa esto para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles gestionados localmente usan `browser.localLaunchTimeoutMs` para la detección HTTP
  de Chrome CDP después del inicio del proceso y `browser.localCdpReadyTimeoutMs` para la
  preparación del WebSocket CDP posterior al lanzamiento. Auméntalos en hosts más lentos donde Chrome
  se inicia correctamente pero las comprobaciones de preparación compiten con el arranque. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; los valores de configuración no válidos se rechazan.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` y `browser.profiles.<name>.executablePath` aceptan
  `~` y `~/...` para el directorio de inicio de tu sistema operativo antes del lanzamiento de Chromium.
  `userDataDir` por perfil en perfiles `existing-session` también se expande con tilde.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, valor predeterminado `18791`).
- `extraArgs` añade flags de lanzamiento adicionales al inicio local de Chromium (por ejemplo
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

- `seamColor`: color de acento para el cromado de la interfaz de usuario de la app nativa (tinte de burbuja de Talk Mode, etc.).
- `assistant`: anulación de identidad de la Control UI. Recurre a la identidad del agente activo.

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
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (ejecutar gateway) o `remote` (conectarse al gateway remoto). Gateway se niega a iniciar salvo que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias de bind heredados**: usa valores de modo de bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota de Docker**: el bind `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con la red bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que no se puede acceder al gateway. Usa `--network host`, o configura `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: requerida de forma predeterminada. Los binds que no son loopback requieren autenticación de gateway. En la práctica, eso significa un token/contraseña compartido o un proxy inverso con identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs), define `gateway.auth.mode` explícitamente como `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está definido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones de confianza de local loopback; esto no se ofrece intencionadamente en los prompts de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación de navegador/usuario a un proxy inverso con identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada un origen de proxy que **no sea loopback**; los proxies inversos loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como fallback local directo; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación de encabezado de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (shared-secret y device-token se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por lo tanto, los intentos incorrectos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos pasen en carrera como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene `true` como valor predeterminado; configúralo en `false` cuando también quieras intencionadamente limitar la tasa del tráfico localhost (para configuraciones de prueba o despliegues de proxy estrictos).
- Los intentos de autenticación WS originados en navegador siempre se limitan con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta desde navegador en localhost).
- En loopback, esos bloqueos originados en navegador se aíslan por valor de `Origin`
  normalizado, por lo que fallos repetidos desde un origen localhost no bloquean
  automáticamente otro origen.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre opcional de servicio de Tailscale para el modo Serve, como
  `svc:openclaw`. Cuando se define, OpenClaw lo pasa a `tailscale serve
--service` para que Control UI pueda exponerse mediante un servicio con nombre en lugar
  del nombre de host del dispositivo. El valor debe usar el formato de nombre de servicio
  `svc:<dns-label>` de Tailscale; el inicio informa la URL de servicio derivada.
- `tailscale.preserveFunnel`: cuando es `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve al iniciar y lo omite
  si una ruta Funnel configurada externamente ya cubre el puerto del gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: allowlist explícita de orígenes de navegador para conexiones WebSocket de Gateway. Requerida para orígenes de navegador públicos que no sean loopback. Las cargas privadas de UI del mismo origen LAN/Tailnet desde hosts loopback, RFC1918/link-local, `.local`, `.ts.net` o CGNAT de Tailscale se aceptan sin habilitar el fallback del encabezado Host.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para mensajes de chat agrupados de Control UI. Acepta valores de ancho CSS restringidos como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el fallback de origen del encabezado Host para despliegues que dependen intencionadamente de una política de origen basada en el encabezado Host.
- `terminal.enabled`: optar por habilitar el terminal de operador con ámbito de administración. Predeterminado: `false`. El terminal inicia un PTY del host en el workspace del agente seleccionado, hereda el entorno del proceso de Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítalo solo en despliegues de operador de confianza; cambiarlo reinicia Gateway y actualiza la política de seguridad de contenido de Control UI.
- `terminal.shell`: ejecutable de shell opcional. Cuando no se define, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: cuánto tiempo sobrevive una sesión de terminal después de que se corta su conexión (recarga de página, suspensión del portátil), permaneciendo reconectable mediante `terminal.attach` con su salida reciente reproducida. Predeterminado: `300`. Configura `0` para cerrar las sesiones en cuanto se corta su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, así que reduce esto en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` en hosts públicos; `ws://` sin cifrar solo se acepta para hosts loopback, LAN, link-local, `.local`, `.ts.net` y CGNAT de Tailscale.
- `remote.remotePort`: puerto del gateway en el host SSH remoto. Valor predeterminado: `18789`; usa esto cuando el puerto del túnel local difiere del puerto del gateway remoto.
- `remote.sshHostKeyPolicy`: política de clave de host de túnel SSH en macOS. `strict` es el valor predeterminado y requiere una clave ya confiable. `openssh` es una habilitación explícita de la configuración efectiva de OpenSSH para alias administrados; revisa la configuración SSH de usuario y sistema correspondiente antes de usarlo. La aplicación de macOS y `configure-remote` restablecen esta política a `strict` al cambiar objetivos salvo que se habilite explícitamente de nuevo.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran por sí mismos la autenticación del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relay APNs externo usado después de que compilaciones iOS respaldadas por relay publiquen registros en el gateway. Las compilaciones públicas de App Store usan el relay alojado de OpenClaw. Las URL de relay personalizadas deben corresponder a una ruta de compilación/despliegue iOS deliberadamente separada cuyo URL de relay apunte a ese relay.
- `gateway.push.apns.relay.timeoutMs`: timeout de envío del gateway al relay en milisegundos. Valor predeterminado: `10000`.
- Los registros respaldados por relay se delegan a una identidad específica del gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al gateway una concesión de envío con ámbito de registro. Otro gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: sobrescrituras temporales de entorno para la configuración de relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo para URL de relay HTTP loopback. Las URL de relay de producción deben permanecer en HTTPS.
- `gateway.handshakeTimeoutMs`: timeout del handshake WebSocket preautenticación de Gateway en milisegundos. Valor predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando está definido. Auméntalo en hosts cargados o de baja potencia donde los clientes locales pueden conectarse mientras el precalentamiento de inicio aún se estabiliza.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de salud de canales en minutos. Configura `0` para deshabilitar globalmente los reinicios del monitor de salud. Valor predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`. Valor predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: reinicios máximos del monitor de salud por canal/cuenta en una hora móvil. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de salud manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura por cuenta para canales con varias cuentas. Cuando se define, tiene precedencia sobre la sobrescritura de nivel de canal.
- Las rutas de llamada del gateway local pueden usar `gateway.remote.*` como fallback solo cuando `gateway.auth.*` no está definido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se puede resolver, la resolución falla de forma cerrada (sin enmascaramiento mediante fallback remoto).
- `trustedProxies`: IP de proxies inversos que terminan TLS o inyectan encabezados de cliente reenviado. Lista solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de proxy/detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Valor predeterminado `false` para comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opcional para aprobar automáticamente el emparejamiento de dispositivos de nodo por primera vez sin ámbitos solicitados. Está deshabilitada cuando no se define. Esto no aprueba automáticamente el emparejamiento de operador/navegador/Control UI/WebChat, y no aprueba automáticamente mejoras de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelado global de allow/deny para comandos de nodo declarados después del emparejamiento y la evaluación de la allowlist de plataforma. Usa `allowCommands` para optar por comandos de nodo peligrosos como `camera.snap`, `camera.clip` y `screen.record`; `denyCommands` elimina un comando incluso si un valor predeterminado de plataforma o una allow explícita lo incluiría de otro modo. Después de que un nodo cambie su lista de comandos declarados, rechaza y vuelve a aprobar ese emparejamiento de dispositivo para que el gateway almacene la instantánea de comandos actualizada.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (amplía la lista deny predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista deny HTTP predeterminada para
  llamadores owner/admin. Esto no eleva a los llamadores `operator.write` que llevan identidad
  a acceso owner/admin; `cron`, `gateway` y `nodes` siguen
  no disponibles para llamadores que no sean owner, incluso cuando estén en la allowlist.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administración: desactivado de forma predeterminada como el Plugin `admin-http-rpc`. Habilita el Plugin para registrar `POST /api/v1/admin/rpc`. Consulta [RPC HTTP de administración](/es/plugins/admin-http-rpc).
- Chat Completions: deshabilitado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de entrada URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las allowlists vacías se tratan como no definidas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención de URL.
- Encabezado opcional de refuerzo de respuesta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúralo solo para orígenes HTTPS que controles; consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de varias instancias

Ejecuta varios gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicadores de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

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
- `autoGenerate`: genera automáticamente un par certificado/clave local autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantenla con permisos restringidos.
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
  - `"off"`: ignora las ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: reinicia siempre el proceso del Gateway cuando cambia la configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de antirrebote en ms antes de aplicar los cambios de configuración (entero no negativo; predeterminado: `300`).
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
- `hooks.token` debe ser distinto de la autenticación shared-secret activa del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); el inicio registra una advertencia de seguridad no fatal cuando detecta reutilización.
- `openclaw security audit` marca la reutilización de autenticación hook/Gateway como un hallazgo crítico, incluida la autenticación con contraseña del Gateway suministrada solo en el momento de la auditoría (`--auth password --password <password>`). Ejecuta `openclaw doctor --fix` para rotar un `hooks.token` persistido reutilizado y luego actualiza los emisores de hooks externos para usar el nuevo token de hook.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si un mapeo o preset usa un `sessionKey` con plantilla, establece `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de mapeo estáticas no requieren esa aceptación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` de la carga útil de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores de `sessionKey` de mapeo renderizados desde plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` coincide con la subruta después de `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Plantillas como `{{messages[0].subject}}` leen desde la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos).
  - Mantén `hooks.transformsDir` bajo `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueve el módulo de transformación al directorio de transformaciones de hooks o elimina `hooks.transformsDir`.
- `agentId` enruta a un agente específico; los ID desconocidos recurren al agente predeterminado.
- `allowedAgentIds`: restringe el enrutamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agente de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de mapeo guiadas por plantilla establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional de prefijos para valores explícitos de `sessionKey` (solicitud + mapeo), p. ej. `["hook:"]`. Pasa a ser obligatoria cuando cualquier mapeo o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` sobrescribe el LLM para esta ejecución de hook (debe estar permitido si se establece el catálogo de modelos).

</Accordion>

### Integración con Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si conservas ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
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

- Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecutes un `gog gmail watch serve` separado junto al Gateway.

---

## Host del Plugin de Canvas

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

- Sirve HTML/CSS/JS editable por agentes y A2UI por HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Enlaces que no son loopback: las rutas de canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), igual que otras superficies HTTP del Gateway.
- Los WebViews de Node normalmente no envían encabezados de autenticación; después de que un nodo se empareja y conecta, el Gateway anuncia URL de capacidad con alcance de nodo para acceder a canvas/A2UI.
- Las URL de capacidad están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se usa fallback basado en IP.
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

- `minimal` (predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`; el anuncio multicast en LAN aún requiere que el plugin `bonjour` incluido esté habilitado.
- `off`: suprime el anuncio multicast en LAN sin cambiar la habilitación del plugin.
- El plugin `bonjour` incluido se inicia automáticamente en hosts macOS y es opcional en Linux, Windows e implementaciones de Gateway en contenedores.
- El nombre de host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida; si no, recurre a `openclaw`. Sobrescríbelo con `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita por completo el anuncio mDNS y reemplaza `discovery.mdns.mode`.

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
- `shellEnv`: importa las claves esperadas faltantes desde tu perfil de shell de inicio de sesión.
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
- Las variables faltantes o vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias de secretos son aditivas: los valores en texto plano siguen funcionando.

### `SecretRef`

Usa una forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- Patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores de estilo AWS `secret#json_key`)
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por barras `.` o `..` (por ejemplo, `a/../b` se rechaza)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
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

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (`id` debe ser `"value"` en el modo singleValue).
- Las rutas de los proveedores File y exec fallan de forma cerrada cuando la verificación de ACL de Windows no está disponible. Establece `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta absoluta de `command` y usa cargas de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos con symlink. Establece `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación de directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa explícitamente las variables requeridas con `passEnv`.
- Las referencias de secretos se resuelven en el momento de la activación en una instantánea en memoria; después, las rutas de solicitud solo leen la instantánea.
- El filtrado de superficies activas se aplica durante la activación: las referencias no resueltas en superficies habilitadas hacen fallar el inicio o la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

---

## Almacenamiento de autenticación

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Los perfiles por agente se almacenan en `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciales estáticas.
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de runtime; `openclaw doctor --fix` los reescribe a perfiles de clave de API canónicos `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de runtime provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se depuran cuando se descubren.
- Importaciones OAuth heredadas desde `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento de runtime de secretos y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

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

- `billingBackoffHours`: retroceso base en horas cuando un perfil falla por errores reales de facturación o crédito insuficiente (predeterminado: `5`). El texto explícito de facturación todavía puede caer aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos del proveedor permanecen limitados al proveedor que los posee (por ejemplo, OpenRouter `Key limit exceeded`). Los mensajes reintentables de ventana de uso HTTP `402` o de límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit` en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de retroceso de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del retroceso de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: retroceso base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del retroceso `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de retroceso (predeterminado: `24`).
- `overloadedProfileRotations`: máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al fallback del modelo (predeterminado: `1`). Formas de proveedor ocupado como `ModelNotReadyException` caen aquí.
- `overloadedBackoffMs`: demora fija antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al fallback del modelo (predeterminado: `1`). Ese contenedor de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: enmascaramiento de mejor esfuerzo para salida de consola, registros de archivo, registros de log OTLP y texto persistido de transcripciones de sesión. `redactSensitive: "off"` solo deshabilita esta política general de registros/transcripciones; las superficies de seguridad de UI/herramientas/diagnóstico siguen redactando secretos antes de emitirlos.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`: interruptor principal para la salida de instrumentación (predeterminado: `true`).
- `flags`: arreglo de cadenas de indicadores que habilitan salida de registro dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de edad sin progreso en ms para clasificar sesiones de procesamiento de larga duración como `session.long_running`, `session.stalled` o `session.stuck` (predeterminado: `120000`). Respuesta, herramienta, estado, bloque y progreso ACP reinician el temporizador; los diagnósticos repetidos `session.stuck` retroceden mientras no haya cambios.
- `stuckSessionAbortMs`: umbral de edad sin progreso en ms antes de que el trabajo activo atascado elegible pueda drenarse mediante aborto para la recuperación. Cuando no está establecido, OpenClaw usa la ventana más segura de ejecución incrustada extendida de al menos 5 minutos y 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura una instantánea de estabilidad redactada previa a OOM cuando la presión de memoria alcanza `critical` (predeterminado: `false`). Establécelo en `true` para agregar el escaneo/escritura del archivo del paquete de estabilidad mientras se mantienen los eventos normales de presión de memoria.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`). Para ver la configuración completa, el catálogo de señales y el modelo de privacidad, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del colector para la exportación OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos por señal. Cuando se establecen, anulan `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (predeterminado), `"stdout"` para un objeto JSON por línea de stdout o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas `0`-`1`.
- `otel.flushIntervalMs`: intervalo de vaciado periódico de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para atributos de spans OTEL. Deshabilitada de forma predeterminada. El booleano `true` captura contenido de mensajes/herramientas no del sistema; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para la forma experimental más reciente de spans de inferencia GenAI, incluidos nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. De forma predeterminada, los spans conservan `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas GenAI usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK global de OpenTelemetry. OpenClaw entonces omite el inicio/apagado del SDK propiedad del Plugin mientras mantiene activos los escuchas de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoint específicas por señal usadas cuando la clave de configuración correspondiente no está establecida.
- `cacheTrace.enabled`: registra instantáneas de traza de caché para ejecuciones incrustadas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de traza de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de traza de caché (todos predeterminados: `true`).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
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

- `channel`: canal de lanzamiento: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. Extended-stable es un canal solo de paquete, en primer plano/bajo demanda; las comprobaciones de inicio y la actualización automática en segundo plano lo omiten.
- `checkOnStart`: comprueba actualizaciones de npm cuando se inicia el gateway (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: demora mínima en horas antes de aplicar automáticamente en el canal estable (predeterminado: `6`; máx.: `168`).
- `auto.stableJitterHours`: ventana adicional de dispersión de despliegue del canal estable en horas (predeterminado: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frecuencia con que se ejecutan las comprobaciones del canal beta en horas (predeterminado: `1`; máx.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
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

- `enabled`: puerta global de la función ACP (predeterminado: `true`; establece `false` para ocultar el despacho ACP y las opciones de spawn).
- `dispatch.enabled`: puerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establece `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id del backend de runtime ACP predeterminado (debe coincidir con un plugin de runtime ACP registrado).
  Instala primero el plugin del backend y, si `plugins.allow` está definido, incluye el id del plugin del backend (por ejemplo `acpx`) o el backend ACP no se cargará.
- `fallbacks`: lista ordenada de ids de backend ACP de fallback que se prueban cuando el backend principal falla pronto con un error de apariencia transitoria (no disponible, con límite de tasa, cuota agotada o sobrecargado) antes de producir cualquier salida. Cada entrada debe coincidir con un backend de plugin de runtime ACP registrado.
- `defaultAgent`: id de agente ACP de destino de fallback cuando los spawns no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agente permitidos para sesiones de runtime ACP; vacío significa que no hay restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque transmitida.
- `stream.repeatSuppression`: suprime líneas de estado/herramienta repetidas por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos de herramienta ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas de estado/actualización ACP proyectadas.
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
  - `"random"` (predeterminado): eslóganes rotativos divertidos/de temporada.
  - `"default"`: eslogan neutro fijo (`Todos tus chats, un OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título/versión del banner aún se muestran).
- Para ocultar todo el banner (no solo los eslóganes), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente de configuración

Metadatos escritos por flujos de configuración guiada de CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identidad

Consulta los campos de identidad de `agents.list` en [Valores predeterminados del agente](/es/gateway/config-agents#agent-defaults).

---

## Bridge (heredado, eliminado)

Las compilaciones actuales ya no incluyen el bridge TCP. Los nodos se conectan por el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar claves desconocidas).

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: cuánto tiempo conservar las sesiones de ejecuciones aisladas de cron completadas antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones de cron eliminadas archivadas. Predeterminado: `24h`; establece `false` para deshabilitarlo.
- `runLog.maxBytes`: aceptado para compatibilidad con registros de ejecución de cron antiguos respaldados por archivos. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: filas más recientes del historial de ejecuciones de SQLite retenidas por trabajo. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST del Webhook de cron (`delivery.mode = "webhook"`); si se omite, no se envía ningún encabezado de autenticación.
- `webhook`: URL de Webhook de fallback heredada y obsoleta (http/https) usada por `openclaw doctor --fix` para migrar trabajos almacenados que aún tienen `notify: true`; la entrega en runtime usa `delivery.mode="webhook"` por trabajo más `delivery.to`, o `delivery.completionDestination` al preservar la entrega de anuncios.

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

- `maxAttempts`: reintentos máximos para trabajos de cron ante errores transitorios (predeterminado: `3`; rango: `0`-`10`).
- `backoffMs`: arreglo de retrasos de backoff en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1-10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Los trabajos de una sola ejecución permanecen habilitados hasta que se agotan los intentos de reintento, luego se deshabilitan mientras conservan el estado de error final. Los trabajos recurrentes usan la misma política de reintentos transitorios para ejecutarse de nuevo después del backoff antes de su siguiente intervalo programado; los errores permanentes o los reintentos transitorios agotados vuelven al calendario recurrente normal con backoff de error.

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

- `enabled`: habilita alertas de fallo para trabajos de cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de disparar una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: cuenta ejecuciones omitidas consecutivas hacia el umbral de alerta (predeterminado: `false`). Las ejecuciones omitidas se rastrean por separado y no afectan el backoff de errores de ejecución.
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: id opcional de cuenta o canal para limitar el alcance de la entrega de alertas.

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

- Destino predeterminado para notificaciones de fallo de cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos de destino.
- `channel`: anulación de canal para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino de anuncio explícito o URL de Webhook. Requerido para el modo Webhook.
- `accountId`: anulación opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se define un destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` vuelven a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo se admite para trabajos `sessionTarget="isolated"`, a menos que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos de Cron](/es/automation/cron-jobs). Las ejecuciones de cron aisladas se rastrean como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones de grupo eliminadas          |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador del destino                         |
| `{{MessageSid}}`   | id del mensaje de canal                           |
| `{{SessionId}}`    | UUID de sesión actual                             |
| `{{IsNewSession}}` | `"true"` cuando se crea una nueva sesión          |
| `{{MediaUrl}}`     | Pseudo-URL de medios entrantes                    |
| `{{MediaPath}}`    | Ruta local del medio                              |
| `{{MediaType}}`    | Tipo de medio (imagen/audio/documento/…)          |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Prompt multimedia resuelto para entradas de CLI   |
| `{{MaxChars}}`     | Caracteres máximos de salida resueltos para entradas de CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Asunto del grupo (mejor esfuerzo)                 |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | Nombre visible del remitente (mejor esfuerzo)     |
| `{{SenderE164}}`   | Número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | Indicio de proveedor (whatsapp, telegram, discord, etc.) |

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
- Rutas: se resuelven relativas al archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` se permiten solo cuando todavía se resuelven dentro de ese límite. Establece `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución; cada archivo incluido tiene un límite de 2 MB.
- Las escrituras propiedad de OpenClaw que cambian solo una sección de nivel superior respaldada por un include de archivo único escriben en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Los includes raíz, los arreglos de includes y los includes con anulaciones de claves hermanas son de solo lectura para escrituras propiedad de OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis, includes circulares, formato de ruta no válido y longitud excesiva.

---

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Doctor](/es/gateway/doctor)
