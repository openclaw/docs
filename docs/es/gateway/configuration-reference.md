---
read_when:
    - Necesitas semántica exacta de configuración a nivel de campo o valores predeterminados
    - Está validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración de Gateway para las claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-06T21:49:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a3dd1660e23a898ecc3610985a6dcdf0b7a0dee0fbe5e8fb3d1c475ddb0cae6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia a nivel de campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más profundas de subsistemas. Para orientación de configuración orientada a tareas, consulta [Configuración](/es/gateway/configuration). Los catálogos de comandos propiedad de canales y plugins, y los ajustes avanzados de memoria/QMD, viven en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw usa valores predeterminados seguros cuando se omiten.

La verdad del código prevalece sobre esta página:

- `openclaw config schema` imprime el JSON Schema en vivo usado para validación y Control UI, con metadatos de paquetes incluidos/plugins/canales fusionados.
- Los agentes deben llamar a la acción de herramienta `gateway` `config.schema.lookup` para obtener un nodo de esquema exacto y acotado por ruta antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento contra la superficie de esquema actual.

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de dreaming bajo `plugins.entries.memory-core.config.dreaming`.
- [Comandos slash](/es/tools/slash-commands) para el catálogo actual de comandos integrados + incluidos.
- Páginas propietarias de canales/plugins para superficies de comandos específicas de canal.

---

## Canales

Las claves de configuración por canal viven en [Configuración - canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales incluidos (autenticación, control de acceso, múltiples cuentas, activación por mención).

## Valores predeterminados de agentes, multiagente, sesiones y mensajes

Consulta [Configuración - agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, razonamiento, Heartbeat, memoria, medios, Skills, sandbox)
- `multiAgent.*` (enrutamiento y enlaces multiagente)
- `session.*` (ciclo de vida de sesión, Compaction, poda)
- `messages.*` (entrega de mensajes, TTS, renderizado de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: anulación del nivel de razonamiento para la ejecución completa del agente OpenClaw detrás de las consultas en tiempo real de Control UI Talk
  - `talk.consultFastMode`: anulación única de modo rápido para consultas en tiempo real de Control UI Talk
  - `talk.speechLocale`: id de configuración regional BCP 47 opcional para el reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: alternativa de retransmisión de Gateway para transcripciones finales en tiempo real de Talk que omiten `openclaw_agent_consult`

## Herramientas y proveedores personalizados

La política de herramientas, los conmutadores experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de proveedores personalizados / URL base viven en
[Configuración - herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, las listas de modelos permitidos y la configuración de proveedores personalizados viven en
[Configuración - herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers.*.localService`: gestor de procesos opcional bajo demanda para
  servidores de modelos locales. OpenClaw sondea el endpoint de salud configurado, inicia
  el `command` absoluto cuando es necesario, espera a que esté listo y luego envía la solicitud
  del modelo. Consulta [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla el arranque de precios en segundo plano que
  comienza después de que los sidecars y canales alcanzan la ruta lista del Gateway. Cuando es `false`,
  el Gateway omite las obtenciones de catálogos de precios de OpenRouter y LiteLLM; los valores
  configurados de `models.providers.*.models[].cost` siguen funcionando para estimaciones locales de coste.

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw viven bajo `mcp.servers` y son
consumidas por OpenClaw embebido y otros adaptadores de runtime. Los comandos `openclaw mcp list`,
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

- `mcp.servers`: definiciones con nombre de servidores MCP stdio o remotos para runtimes que
  exponen herramientas MCP configuradas.
  Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan al campo canónico `transport`.
- `mcp.servers.<name>.enabled`: establece `false` para conservar una definición de servidor guardada
  mientras se excluye del descubrimiento MCP de OpenClaw embebido y de la proyección de herramientas.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: tiempo de espera de solicitud MCP por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: tiempo de espera de conexión por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicación de concurrencia opcional para
  adaptadores que pueden elegir si emitir llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: establece `"oauth"` para servidores MCP HTTP que requieren
  OAuth. Ejecuta `openclaw mcp login <name>` para almacenar tokens bajo el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: anulaciones opcionales de alcance OAuth, URL de redirección y URL de metadatos
  de cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS HTTP
  para endpoints privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP descubiertas a nombres coincidentes; `exclude` oculta nombres
  coincidentes. Las entradas son nombres exactos de herramientas MCP o globs simples con `*`. Los servidores con
  recursos o prompts también generan nombres de herramientas de utilidad (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres usan el
  mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del app-server de Codex.
  Este bloque son metadatos de OpenClaw solo para hilos de app-server de Codex; no
  afecta a sesiones ACP, configuración genérica de arnés Codex ni otros adaptadores de runtime.
  `codex.agents` no vacío limita el servidor a los ids de agentes OpenClaw listados.
  Las listas de agentes acotadas vacías, en blanco o inválidas son rechazadas por la validación de configuración
  y omitidas por la ruta de proyección de runtime en lugar de volverse globales.
  `codex.defaultToolsApprovalMode` emite el
  `default_tools_approval_mode` nativo de Codex para ese servidor. OpenClaw elimina el bloque `codex`
  antes de pasar la configuración nativa `mcp_servers` a Codex. Omite el bloque para
  mantener el servidor proyectado para todos los agentes de app-server de Codex con el comportamiento
  predeterminado de aprobación MCP de Codex.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP incluidos con alcance de sesión.
  Las ejecuciones embebidas únicas solicitan limpieza al final de la ejecución; este TTL es el respaldo para
  sesiones de larga duración y futuros llamadores.
- Los cambios bajo `mcp.*` se aplican en caliente descartando runtimes MCP de sesión en caché.
  El siguiente descubrimiento/uso de herramientas los recrea desde la nueva configuración, por lo que las entradas
  `mcp.servers` eliminadas se recogen de inmediato en lugar de esperar al TTL de inactividad.
- El descubrimiento de runtime también respeta las notificaciones de cambio de lista de herramientas MCP descartando
  el catálogo en caché para esa sesión. Los servidores que anuncian recursos o
  prompts obtienen herramientas de utilidad para listar/leer recursos y listar/obtener
  prompts. Los fallos repetidos de llamadas a herramientas pausan brevemente el servidor afectado antes de
  intentar otra llamada.

Consulta [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[Backends de CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para el comportamiento de runtime.

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

- `allowBundled`: lista de permitidos opcional solo para skills incluidas (skills gestionadas/de workspace no afectadas).
- `load.extraDirs`: raíces compartidas adicionales de skills (menor precedencia).
- `load.allowSymlinkTargets`: raíces de destino reales de confianza en las que los symlinks de skills pueden
  resolverse cuando el enlace vive fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que Skill Workshop apply escriba
  a través de destinos de symlink ya confiables (predeterminado: false).
- `install.preferBrew`: cuando es true, prefiere instaladores de Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador de Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes Gateway `operator.admin` de confianza
  instalen archivos zip privados preparados a través de `skills.upload.*`
  (predeterminado: false). Esto solo habilita la ruta de archivos cargados; las instalaciones normales de ClawHub
  no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita una skill incluso si está incluida/instalada.
- `entries.<skillKey>.apiKey`: comodidad para skills que declaran una variable de entorno principal (cadena de texto plano u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitan el descubrimiento de skills y el prompt de skills orientado al modelo.
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

- Cargados desde directorios de paquetes o bundles bajo `~/.openclaw/extensions` y `<workspace>/.openclaw/extensions`, además de archivos o directorios enumerados en `plugins.load.paths`.
- Coloca los archivos de Plugin independientes en `plugins.load.paths`; las raíces de extensiones descubiertas automáticamente ignoran los archivos `.js`, `.mjs` y `.ts` de nivel superior para que los scripts auxiliares en esas raíces no bloqueen el inicio.
- El descubrimiento acepta Plugins nativos de OpenClaw además de bundles compatibles de Codex y bundles de Claude, incluidos bundles de Claude sin manifiesto con diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los Plugins enumerados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo práctico de clave API a nivel de Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con alcance de Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que mutan el prompt desde el `before_agent_start` heredado, mientras conserva los `modelOverride` y `providerOverride` heredados. Se aplica a hooks de Plugins nativos y a directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los Plugins de confianza no incluidos en bundles pueden leer contenido sin procesar de conversaciones desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para solicitar sobrescrituras de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras de subagentes de confianza. Usa `"*"` solo cuando quieras permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este Plugin para solicitar sobrescrituras de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras de finalización LLM de Plugins de confianza. Usa `"*"` solo cuando quieras permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este Plugin para ejecutar `api.runtime.llm.complete` contra un id de agente no predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado por el esquema de Plugin nativo de OpenClaw cuando esté disponible).
- La configuración de cuenta/tiempo de ejecución del Plugin de canal vive bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del Plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del Plugin de arnés de Codex

El Plugin incluido `codex` es propietario de la configuración nativa del arnés del servidor de aplicaciones de Codex bajo
`plugins.entries.codex.config`. Consulta la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference) para ver toda la superficie de configuración
y [arnés de Codex](/es/plugins/codex-harness) para el modelo de tiempo de ejecución.

`codexPlugins` se aplica solo a sesiones que seleccionan el arnés nativo de Codex.
No habilita Plugins de Codex para ejecuciones del proveedor de OpenClaw, enlaces de conversación de ACP
ni ningún arnés que no sea Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita la compatibilidad nativa de Plugins/aplicaciones de Codex para el arnés de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expone cada aplicación actualmente accesible conectada a la cuenta de Codex autenticada en cada nuevo hilo nativo de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para solicitudes de aplicaciones de Plugin migradas.
  Usa `true` para aceptar esquemas seguros de aprobación de Codex sin preguntar, `false`
  para rechazarlos, `"auto"` para enrutar las aprobaciones requeridas por Codex a través de aprobaciones de Plugins de OpenClaw,
  o `"ask"` para preguntar por cada acción de escritura/destructiva de Plugin
  sin aprobación duradera. El modo `"ask"` borra las sobrescrituras duraderas de aprobación por herramienta de Codex para la aplicación afectada y selecciona el revisor humano de aprobaciones para esa aplicación antes de que empiece el hilo de Codex.
  Valor predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una entrada de Plugin migrada cuando `codexPlugins.enabled` global también es true.
  Valor predeterminado: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace. V1 solo admite `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad estable del Plugin de Codex desde la migración, por ejemplo `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  sobrescritura de acción destructiva por Plugin. Cuando se omite, se usa el valor global
  `allow_destructive_actions`. El valor por Plugin acepta las mismas políticas
  `true`, `false`, `"auto"` o `"ask"`.

Cada aplicación de Plugin admitida que usa `"ask"` enruta las solicitudes de aprobación de esa aplicación
al revisor humano. Otras aplicaciones y aprobaciones de hilos que no son de aplicación conservan su
revisor configurado, por lo que las políticas mixtas de Plugins no heredan el comportamiento de `"ask"`.

`codexPlugins.enabled` es la directiva global de habilitación. Las entradas explícitas de Plugin
escritas por la migración son el conjunto duradero de instalación y elegibilidad para reparación.
`plugins["*"]` no es compatible, no hay interruptor `install`, y los valores locales
`marketplacePath` no son campos de configuración intencionadamente porque son
específicos del host.

Las comprobaciones de preparación de `app/list` se almacenan en caché durante una hora y se actualizan
de forma asíncrona cuando quedan obsoletas. La configuración de aplicaciones del hilo de Codex se calcula al establecer la sesión del arnés de Codex, no en cada turno; usa `/new`, `/reset` o un reinicio del Gateway después de cambiar la configuración nativa de Plugins.

`codexPlugins.allow_all_plugins` captura una instantánea de cada aplicación de cuenta actualmente accesible
en cada nuevo hilo nativo de Codex. No instala Plugins ni aplicaciones, y
las aplicaciones inaccesibles permanecen excluidas. Las aplicaciones de cuenta usan la política global
`codexPlugins.allow_destructive_actions`. Las entradas explícitas de Plugin tienen
precedencia cuando la misma aplicación está presente en ambas rutas. Si `app/list` no se puede
leer, la exposición de toda la cuenta falla cerrada.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web de Firecrawl.
  - `apiKey`: clave API opcional de Firecrawl para límites más altos (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, el heredado `tools.web.fetch.firecrawl.apiKey` o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (p. ej. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de dreaming (valor predeterminado `false`).
  - `frequency`: cadencia cron para cada barrido completo de dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: sobrescritura opcional de modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínalo con `allowedModels` para restringir destinos. Los errores de modelo no disponible se reintentan una vez con el modelo predeterminado de la sesión; los fallos de confianza o lista de permitidos no recurren a otro valor silenciosamente.
  - la política de fases y los umbrales son detalles de implementación (no claves de configuración orientadas al usuario).
- La configuración completa de memoria vive en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los Plugins de bundles de Claude habilitados también pueden aportar valores predeterminados incrustados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración saneada del agente, no como parches de configuración sin procesar de OpenClaw.
- `plugins.slots.memory`: elige el id del Plugin de memoria activo, o `"none"` para deshabilitar los Plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del Plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.

Consulta [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria de seguimiento inferida: OpenClaw puede detectar comprobaciones desde turnos de conversación y entregarlas mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción LLM oculta, el almacenamiento y la entrega por Heartbeat para compromisos de seguimiento inferidos. Valor predeterminado: `false`.
- `commitments.maxPerDay`: número máximo de compromisos de seguimiento inferidos entregados por sesión de agente en un día móvil. Valor predeterminado: `3`.

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
- `tabCleanup` recupera las pestañas rastreadas del agente principal después de un tiempo de inactividad o cuando una
  sesión supera su límite. Configura `idleMinutes: 0` o `maxTabsPerSession: 0` para
  deshabilitar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se define, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Configura `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionalmente en la navegación del navegador por red privada.
- En modo estricto, los endpoints de perfil CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de alcanzabilidad/descubrimiento.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de adjunción (inicio/detención/restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL WebSocket de DevTools directa.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la alcanzabilidad CDP remota y
  `attachOnly`, además de las solicitudes de apertura de pestañas. Los perfiles de local loopback
  gestionados conservan los valores predeterminados locales de CDP. La enumeración persistente de pestañas
  remotas de Playwright usa el valor mayor como fecha límite de operación.
- Si un servicio CDP gestionado externamente es alcanzable a través de loopback, configura
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto loopback como un
  perfil de navegador gestionado localmente y puede informar errores de propiedad del puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden adjuntarse en
  el host seleccionado o a través de un nodo de navegador conectado.
- Los perfiles `existing-session` pueden configurar `userDataDir` para apuntar a un perfil
  específico de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden configurar `cdpUrl` cuando Chrome ya se está ejecutando
  detrás de un endpoint de descubrimiento HTTP(S) de DevTools o un endpoint WS(S) directo. En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de usar conexión automática;
  `userDataDir` se ignora para los argumentos de inicio de Chrome MCP.
- Los perfiles `existing-session` conservan los límites de ruta actuales de Chrome MCP:
  acciones basadas en snapshot/ref en lugar de selección por CSS, hooks de carga de un solo archivo,
  sin anulaciones de tiempo de espera de diálogos, sin `wait --load networkidle` y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles locales gestionados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; configura
  `cdpUrl` explícitamente solo para perfiles CDP remotos o adjunción a endpoint de existing-session.
- Los perfiles locales gestionados pueden configurar `executablePath` para anular el
  `browser.executablePath` global de ese perfil. Usa esto para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles locales gestionados usan `browser.localLaunchTimeoutMs` para el descubrimiento HTTP de Chrome CDP
  después del inicio del proceso y `browser.localCdpReadyTimeoutMs` para la disponibilidad del websocket CDP
  posterior al inicio. Auméntalos en hosts más lentos donde Chrome se inicia correctamente
  pero las comprobaciones de disponibilidad compiten con el arranque. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; los valores de configuración no válidos se rechazan.
- Orden de autodetección: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` y `browser.profiles.<name>.executablePath` aceptan
  `~` y `~/...` para el directorio de inicio de tu sistema operativo antes del inicio de Chromium.
  `userDataDir` por perfil en perfiles `existing-session` también expande la tilde.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega indicadores de inicio adicionales al arranque local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o indicadores de depuración).

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

- `seamColor`: color de acento para el marco de UI de la aplicación nativa (tinte de burbuja de Talk Mode, etc.).
- `assistant`: anulación de identidad de Control UI. Recurre a la identidad del agente activo.

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

<Accordion title="Detalles de campos de Gateway">

- `mode`: `local` (ejecutar Gateway) o `remote` (conectarse a un Gateway remoto). Gateway se niega a iniciar a menos que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias de bind heredados**: usa valores de modo bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el bind `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con redes bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que el Gateway no es accesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: requerida de forma predeterminada. Los binds que no son loopback requieren autenticación de Gateway. En la práctica, eso significa un token/contraseña compartidos o un proxy inverso con identidad y `gateway.auth.mode: "trusted-proxy"`. El asistente de onboarding genera un token de forma predeterminada.
- Si `gateway.auth.token` y `gateway.auth.password` están configurados (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones local loopback de confianza; intencionadamente, no se ofrece en las indicaciones de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador/usuario a un proxy inverso con identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada un origen de proxy **que no sea loopback**; los proxies inversos loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como fallback directo local; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de la UI de control/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación de encabezado de Tailscale; en su lugar, siguen el modo de autenticación HTTP normal del Gateway. Este flujo sin token asume que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (shared-secret y device-token se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la UI de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por lo tanto, los intentos malos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en vez de pasar ambos en carrera como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establécelo en `false` cuando quieras intencionadamente que el tráfico de localhost también tenga límite de tasa (para configuraciones de prueba o despliegues de proxy estrictos).
- Los intentos de autenticación WS con origen de navegador siempre se limitan con la exención de loopback deshabilitada (defensa en profundidad contra fuerza bruta de localhost basada en navegador).
- En loopback, esos bloqueos por origen de navegador se aíslan por valor `Origin`
  normalizado, por lo que los fallos repetidos de un origen localhost no bloquean
  automáticamente un origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre opcional de servicio de Tailscale para modo Serve, como
  `svc:openclaw`. Cuando se establece, OpenClaw lo pasa a `tailscale serve
--service` para que la UI de control pueda exponerse mediante un servicio con nombre en vez
  del hostname del dispositivo. El valor debe usar el formato de nombre de servicio
  `svc:<dns-label>` de Tailscale; el inicio informa la URL de servicio derivada.
- `tailscale.preserveFunnel`: cuando es `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve al inicio y lo omite
  si una ruta Funnel configurada externamente ya cubre el puerto del Gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: lista de permitidos explícita de orígenes de navegador para conexiones WebSocket de Gateway. Requerida para orígenes de navegador públicos que no sean loopback. Las cargas de UI privadas del mismo origen en LAN/Tailnet desde loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar el fallback de encabezado Host.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para mensajes de chat agrupados de la UI de control. Acepta valores de ancho CSS restringidos como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el fallback de origen de encabezado Host para despliegues que dependen intencionadamente de una política de origen basada en encabezado Host.
- `terminal.enabled`: opta por habilitar la terminal de operador con ámbito de administrador. Valor predeterminado: `false`. La terminal inicia un PTY del host en el espacio de trabajo del agente seleccionado, hereda el entorno del proceso Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítala solo para despliegues de operadores de confianza; cambiarla reinicia el Gateway y actualiza la política de seguridad de contenido de la UI de control.
- `terminal.shell`: ejecutable de shell opcional. Cuando no está establecido, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: cuánto tiempo sobrevive una sesión de terminal después de que se cae su conexión (recarga de página, suspensión del portátil), manteniéndose reconectable mediante `terminal.attach` con su salida reciente reproducida. Valor predeterminado: `300`. Establece `0` para terminar las sesiones en el momento en que se cae su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, así que acorta esto en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` para hosts públicos; el texto plano `ws://` se acepta solo para loopback, LAN, link-local, `.local`, `.ts.net` y hosts CGNAT de Tailscale.
- `remote.remotePort`: puerto del Gateway en el host SSH remoto. Valor predeterminado: `18789`; usa esto cuando el puerto del túnel local difiere del puerto del Gateway remoto.
- `remote.sshHostKeyPolicy`: política de clave de host del túnel SSH de macOS. `strict` es el valor predeterminado y requiere una clave ya confiable. `openssh` es una adhesión explícita a la configuración efectiva de OpenSSH para alias administrados; revisa la configuración SSH de usuario y sistema coincidente antes de usarlo. La app de macOS y `configure-remote` restablecen esta política a `strict` al cambiar objetivos, a menos que se opte explícitamente de nuevo.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran la autenticación del Gateway por sí mismos.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relay APNs externo usado después de que las compilaciones iOS respaldadas por relay publiquen registros en el Gateway. Las compilaciones públicas de App Store usan el relay alojado de OpenClaw. Las URL de relay personalizadas deben coincidir con una ruta de compilación/despliegue iOS deliberadamente separada cuya URL de relay apunte a ese relay.
- `gateway.push.apns.relay.timeoutMs`: timeout de envío de Gateway a relay en milisegundos. Valor predeterminado: `10000`.
- Los registros respaldados por relay se delegan a una identidad específica del Gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al Gateway una concesión de envío con ámbito de registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrides temporales de env para la configuración de relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo de desarrollo para URL de relay HTTP loopback. Las URL de relay de producción deben permanecer en HTTPS.
- `gateway.handshakeTimeoutMs`: timeout del handshake WebSocket de Gateway previo a autenticación, en milisegundos. Valor predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando está establecido. Auméntalo en hosts cargados o de baja potencia donde los clientes locales pueden conectarse mientras el calentamiento de inicio todavía se estabiliza.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de salud del canal en minutos. Establece `0` para deshabilitar globalmente los reinicios del monitor de salud. Valor predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén esto mayor o igual que `gateway.channelHealthCheckMinutes`. Valor predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: reinicios máximos del monitor de salud por canal/cuenta en una hora móvil. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de salud mientras el monitor global permanece habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override por cuenta para canales multi-cuenta. Cuando se establece, tiene precedencia sobre el override a nivel de canal.
- Las rutas de llamada de Gateway local pueden usar `gateway.remote.*` como fallback solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento por fallback remoto).
- `trustedProxies`: IP de proxy inverso que terminan TLS o inyectan encabezados de cliente reenviado. Lista solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de proxy/detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean elegibles para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Valor predeterminado `false` para comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de permitidos CIDR/IP para aprobar automáticamente el emparejamiento por primera vez de dispositivos de nodo sin ámbitos solicitados. Está deshabilitada cuando no está establecida. Esto no aprueba automáticamente emparejamientos de operador/navegador/UI de control/WebChat, y no aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: conformación global de permitir/denegar para comandos de nodo declarados después del emparejamiento y la evaluación de la lista de permitidos de la plataforma. Usa `allowCommands` para optar por comandos de nodo peligrosos como `camera.snap`, `camera.clip`, `screen.record`, `sms.search` y `sms.send`; `denyCommands` elimina un comando incluso si un valor predeterminado de plataforma o una autorización explícita lo incluiría de otro modo. El permiso SMS de Android y la autorización de comandos de Gateway son independientes. Después de que un nodo cambie su lista de comandos declarados, rechaza y vuelve a aprobar ese emparejamiento de dispositivo para que el Gateway almacene la instantánea de comandos actualizada.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (extiende la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada para
  llamadores owner/admin. Esto no eleva llamadores con identidad `operator.write`
  a acceso owner/admin; `cron`, `gateway` y `nodes` siguen
  no disponibles para llamadores que no sean owner, incluso cuando están en la lista de permitidos.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administrador: desactivado de forma predeterminada como el Plugin `admin-http-rpc`. Habilita el Plugin para registrar `POST /api/v1/admin/rpc`. Consulta [RPC HTTP de administrador](/es/plugins/admin-http-rpc).
- Chat Completions: deshabilitado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimiento de entrada URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no establecidas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención de URL.
- Encabezado opcional de endurecimiento de respuesta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establécelo solo para orígenes HTTPS que controles; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento multiinstancia

Ejecuta varios gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Banderas de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

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
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantenla con permisos restringidos.
- `caPath`: ruta opcional del paquete de CA para verificación de clientes o cadenas de confianza personalizadas.

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
  - `"restart"`: reinicia siempre el proceso del Gateway ante cambios de configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero la recarga en caliente; si es necesario, vuelve a reiniciar.
- `debounceMs`: ventana de debounce en ms antes de aplicar los cambios de configuración (entero no negativo; predeterminado: `300`).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítelo para usar la espera limitada predeterminada (`300000`); establécelo en `0` para esperar indefinidamente y registrar advertencias periódicas de elementos aún pendientes.

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
- `hooks.token` debe ser distinto de la autenticación active shared-secret del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); el arranque registra una advertencia de seguridad no fatal cuando detecta reutilización.
- `openclaw security audit` marca la reutilización de autenticación hook/Gateway como un hallazgo crítico, incluida la autenticación con contraseña del Gateway proporcionada solo en el momento de la auditoría (`--auth password --password <password>`). Ejecuta `openclaw doctor --fix` para rotar un `hooks.token` persistido y reutilizado, y luego actualiza los emisores externos de hooks para usar el nuevo token de hook.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si un mapeo o preset usa un `sessionKey` con plantilla, configura `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de mapeo estáticas no requieren esa habilitación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El `sessionKey` del payload de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → resuelto mediante `hooks.mappings`
  - Los valores de `sessionKey` de mapeo renderizados por plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de mapeo">

- `match.path` coincide con la subruta después de `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo del payload para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen del payload.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanece dentro de `hooks.transformsDir` (se rechazan rutas absolutas y traversal).
  - Mantén `hooks.transformsDir` bajo `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del workspace. Si `openclaw doctor` informa que esta ruta no es válida, mueve el módulo de transformación al directorio de transformaciones de hooks o elimina `hooks.transformsDir`.
- `agentId` enruta a un agente específico; los ID desconocidos vuelven al agente predeterminado.
- `allowedAgentIds`: restringe el enrutamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agentes de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de mapeo basadas en plantillas establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista opcional de prefijos permitidos para valores explícitos de `sessionKey` (solicitud + mapeo), p. ej., `["hook:"]`. Se vuelve obligatoria cuando cualquier mapeo o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` sobrescribe el LLM para esta ejecución de hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración con Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y limita `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
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

- Sirve HTML/CSS/JS editables por agentes y A2UI por HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Enlaces que no son loopback: las rutas de canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), igual que otras superficies HTTP del Gateway.
- Las WebViews de Node normalmente no envían encabezados de autenticación; después de que un nodo se empareja y conecta, el Gateway anuncia URL de capacidad con alcance de nodo para acceso a canvas/A2UI.
- Las URL de capacidad están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se usa fallback basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
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
- `full`: incluye `cliPath` + `sshPort`; la publicidad multicast de LAN aún requiere que el Plugin `bonjour` incluido esté habilitado.
- `off`: suprime la publicidad multicast de LAN sin cambiar la habilitación del Plugin.
- El Plugin `bonjour` incluido se inicia automáticamente en hosts macOS y es opcional en Linux, Windows y despliegues de Gateway en contenedores.
- El nombre de host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida, con reserva a `openclaw`. Sobrescríbelo con `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita por completo la publicidad mDNS y anula `discovery.mdns.mode`.

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

- Las variables de entorno en línea solo se aplican si falta la clave en el entorno del proceso.
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
- Las variables faltantes/vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores de texto sin formato siguen funcionando.

### `SecretRef`

Usa una forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- Patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores estilo AWS `secret#json_key`)
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por barras `.` ni `..` (por ejemplo, `a/../b` se rechaza)

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
- Las rutas de los proveedores File y exec fallan en modo cerrado cuando la verificación de ACL de Windows no está disponible. Establece `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta absoluta de `command` y usa cargas de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos con enlaces simbólicos. Establece `allowSymlinkCommand: true` para permitir rutas con enlaces simbólicos mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación del directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno del proceso hijo de `exec` es mínimo de forma predeterminada; pasa explícitamente las variables requeridas con `passEnv`.
- Las referencias a secretos se resuelven en el momento de la activación en una instantánea en memoria; después, las rutas de solicitud solo leen la instantánea.
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
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de runtime; `openclaw doctor --fix` los reescribe como perfiles de clave de API canónicos `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de runtime provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se limpian cuando se descubren.
- Las importaciones OAuth heredadas provienen de `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: backoff base en horas cuando un perfil falla por errores reales de facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación aún puede llegar aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos del proveedor permanecen limitados al proveedor al que pertenecen (por ejemplo, OpenRouter `Key limit exceeded`). Los mensajes reintentables HTTP `402` de ventana de uso o límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit` en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de backoff de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del backoff de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: backoff base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del backoff `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de backoff (predeterminado: `24`).
- `overloadedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al fallback de modelo (predeterminado: `1`). Las formas de proveedor ocupado como `ModelNotReadyException` llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al fallback de modelo (predeterminado: `1`). Esa categoría de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Auditoría

```json5
{
  audit: {
    enabled: true,
  },
}
```

El Gateway registra eventos de auditoría **solo de metadatos** para ejecuciones de agentes y acciones de herramientas en la base de datos de estado compartida: identidad, tiempos, nombres de herramientas y resultados finales; nunca prompts, mensajes, argumentos de herramientas, resultados ni texto de error sin procesar. Los registros caducan después de 30 días y el libro mayor tiene un límite de 100 000 filas. Consúltalos con [`openclaw audit`](/es/cli/audit) o con el RPC de Gateway [`audit.list`](/es/gateway/protocol#audit-ledger-rpc).

- `enabled`: registra eventos de auditoría nuevos (predeterminado: `true`). El libro mayor está activado de forma predeterminada porque una pista de auditoría habilitada solo después de un incidente no puede explicar el incidente. Establecerlo en `false` detiene de inmediato las escrituras nuevas; los registros existentes permanecen legibles hasta que caduquen. Volver a activarlo reanuda el registro desde ese punto; el hueco no se rellena retroactivamente.

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
- `redactSensitive` / `redactPatterns`: enmascaramiento de mejor esfuerzo para la salida de consola, registros de archivo, registros de log OTLP y texto persistido de transcripciones de sesión. `redactSensitive: "off"` solo deshabilita esta política general de registros/transcripciones; las superficies de seguridad de UI/herramientas/diagnóstico siguen redactando secretos antes de emitirlos.

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

- `enabled`: interruptor maestro para la salida de instrumentación (predeterminado: `true`).
- `flags`: arreglo de cadenas de indicadores que habilitan salida de registro dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de edad sin progreso en ms para clasificar sesiones de procesamiento de larga duración como `session.long_running`, `session.stalled` o `session.stuck` (predeterminado: `120000`). Las respuestas, herramientas, estados, bloques y progreso ACP reinician el temporizador; los diagnósticos repetidos `session.stuck` aplican backoff mientras no haya cambios.
- `stuckSessionAbortMs`: umbral de edad sin progreso en ms antes de que el trabajo activo detenido elegible pueda abortarse y drenarse para recuperación. Cuando no está definido, OpenClaw usa la ventana de ejecución embebida extendida más segura de al menos 5 minutos y 3 veces `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura una instantánea de estabilidad redactada previa a OOM cuando la presión de memoria alcanza `critical` (predeterminado: `false`). Establécelo en `true` para añadir el escaneo/escritura del archivo del paquete de estabilidad mientras se mantienen los eventos normales de presión de memoria.
- `otel.enabled`: habilita el pipeline de exportación OpenTelemetry (predeterminado: `false`). Para la configuración completa, el catálogo de señales y el modelo de privacidad, consulta [Exportación OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del collector para exportación OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de señal. Cuando se establecen, anulan `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con las solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recursos.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita la exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (predeterminado), `"stdout"` para un objeto JSON por línea de stdout, o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas `0`-`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para atributos de spans OTEL. Desactivado de forma predeterminada. El booleano `true` captura contenido de mensajes/herramientas que no sea del sistema; la forma de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions` explícitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para la forma de span de inferencia GenAI experimental más reciente, incluidos nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. De forma predeterminada, los spans mantienen `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas GenAI usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK OpenTelemetry global. OpenClaw omite entonces el inicio/apagado del SDK propiedad del Plugin, pero mantiene activos los listeners de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoint específicas de señal usadas cuando la clave de configuración correspondiente no está definida.
- `cacheTrace.enabled`: registra instantáneas de traza de caché para ejecuciones embebidas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de traza de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controla qué se incluye en la salida de traza de caché (todos predeterminados: `true`).

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

- `channel`: canal de lanzamiento: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. Extended-stable es un canal solo de paquetes, en primer plano/bajo demanda; se omite en las comprobaciones de inicio y en la actualización automática en segundo plano.
- `checkOnStart`: comprueba actualizaciones de npm cuando el gateway se inicia (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de la aplicación automática del canal estable (predeterminado: `6`; máx.: `168`).
- `auto.stableJitterHours`: ventana adicional de distribución del despliegue del canal estable en horas (predeterminado: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frecuencia con la que se ejecutan las comprobaciones del canal beta en horas (predeterminado: `1`; máx.: `24`).

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

- `enabled`: puerta de activación global de la función ACP (predeterminado: `true`; establece `false` para ocultar el despacho de ACP y las facilidades de generación).
- `dispatch.enabled`: puerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establece `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id del backend de runtime ACP predeterminado (debe coincidir con un plugin de runtime ACP registrado).
  Instala primero el plugin de backend y, si `plugins.allow` está definido, incluye el id del plugin de backend (por ejemplo, `acpx`) o el backend ACP no se cargará.
- `fallbacks`: lista ordenada de ids de backend ACP de respaldo que se prueban cuando el backend principal falla temprano con un error de apariencia transitoria (no disponible, limitado por tasa, cuota agotada o sobrecargado) antes de producir cualquier salida. Cada entrada debe coincidir con un backend de plugin de runtime ACP registrado.
- `defaultAgent`: id del agente de destino ACP de respaldo cuando las generaciones no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agente autorizados para sesiones de runtime ACP; vacío significa que no hay restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloque transmitido.
- `stream.repeatSuppression`: suprime líneas de estado/herramienta repetidas por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos de herramienta ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas de estado/actualización ACP proyectadas.
- `stream.tagVisibility`: registro de nombres de etiquetas a anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de que sean elegibles para limpieza.
- `runtime.installCommand`: comando de instalación opcional para ejecutar al inicializar un entorno de runtime ACP.

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
  - `"random"` (predeterminado): eslóganes graciosos/estacionales rotativos.
  - `"default"`: eslogan neutral fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título/la versión del banner aún se muestran).
- Para ocultar el banner completo (no solo los eslóganes), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

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

Consulta los campos de identidad de `agents.list` en [Valores predeterminados de agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan a través del WebSocket de Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración de puente heredada (referencia histórica)">

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

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones cron aisladas antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones cron eliminadas archivadas. Predeterminado: `24h`; establece `false` para desactivar.
- `runLog.maxBytes`: aceptado por compatibilidad con registros de ejecución cron antiguos respaldados por archivos. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: filas más recientes del historial de ejecución de SQLite conservadas por trabajo. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST de Webhook de cron (`delivery.mode = "webhook"`); si se omite, no se envía ningún encabezado de autenticación.
- `webhook`: URL de Webhook de respaldo heredada y obsoleta (http/https) usada por `openclaw doctor --fix` para migrar trabajos almacenados que todavía tienen `notify: true`; la entrega en runtime usa `delivery.mode="webhook"` por trabajo más `delivery.to`, o `delivery.completionDestination` al conservar la entrega de anuncio.

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

- `maxAttempts`: reintentos máximos para trabajos cron ante errores transitorios (predeterminado: `3`; intervalo: `0`-`10`).
- `backoffMs`: arreglo de demoras de retroceso en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1-10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Los trabajos de una sola ejecución permanecen habilitados hasta que se agotan los intentos de reintento, luego se desactivan mientras conservan el estado de error final. Los trabajos recurrentes usan la misma política de reintentos transitorios para ejecutarse nuevamente después del retroceso antes de su siguiente intervalo programado; los errores permanentes o los reintentos transitorios agotados vuelven al calendario recurrente normal con retroceso de error.

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
- `includeSkipped`: cuenta ejecuciones omitidas consecutivas para el umbral de alerta (predeterminado: `false`). Las ejecuciones omitidas se rastrean por separado y no afectan el retroceso por errores de ejecución.
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

- Destino predeterminado para notificaciones de fallo de cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen datos de destino suficientes.
- `channel`: anulación de canal para entrega de anuncio. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino de anuncio explícito o URL de Webhook. Obligatorio para el modo Webhook.
- `accountId`: anulación opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se define un destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` vuelven a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo se admite para trabajos `sessionTarget="isolated"` a menos que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones cron aisladas se rastrean como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla de modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones de grupo quitadas            |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador de destino                          |
| `{{MessageSid}}`   | id de mensaje del canal                           |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una nueva sesión          |
| `{{MediaUrl}}`     | Pseudo-URL de multimedia entrante                 |
| `{{MediaPath}}`    | Ruta local de multimedia                          |
| `{{MediaType}}`    | Tipo de multimedia (imagen/audio/documento/…)     |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Prompt multimedia resuelto para entradas de CLI   |
| `{{MaxChars}}`     | Caracteres máximos de salida resueltos para entradas de CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Asunto del grupo (mejor esfuerzo)                 |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | Nombre para mostrar del remitente (mejor esfuerzo) |
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

**Comportamiento de fusión:**

- Archivo único: reemplaza el objeto contenedor.
- Arreglo de archivos: se fusionan en profundidad en orden (los posteriores anulan los anteriores).
- Claves hermanas: se fusionan después de las inclusiones (anulan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` solo se permiten cuando aún se resuelven dentro de ese límite. Establece `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución; cada archivo incluido está limitado a 2 MB.
- Las escrituras propiedad de OpenClaw que cambian solo una sección de nivel superior respaldada por una inclusión de archivo único escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, los arreglos de inclusión y las inclusiones con anulaciones hermanas son de solo lectura para escrituras propiedad de OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis, inclusiones circulares, formato de ruta no válido y longitud excesiva.

---

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Doctor](/es/gateway/doctor)
