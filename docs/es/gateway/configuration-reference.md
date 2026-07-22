---
read_when:
    - Necesita la semántica exacta de configuración a nivel de campo o los valores predeterminados
    - Está validando bloques de configuración de canales, modelos, Gateway o herramientas
summary: Referencia de configuración del Gateway para las claves principales de OpenClaw, los valores predeterminados y los enlaces a referencias específicas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-22T13:19:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 399836d1064ddddaef828d2e1a702ec7f303e05b0f0721f9080daf93ba8a1395
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia a nivel de campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más detalladas de los subsistemas. Para obtener orientación de configuración orientada a tareas, consulte [Configuración](/es/gateway/configuration). Los catálogos de comandos propiedad de canales y plugins, así como las opciones avanzadas de memoria/QMD, se encuentran en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw usa valores predeterminados seguros cuando se omiten.

El código prevalece sobre esta página:

- `openclaw config schema` imprime el esquema JSON activo utilizado para la validación y la interfaz de control, con los metadatos de paquetes, plugins y canales combinados.
- Los agentes deben llamar a la acción de herramienta `gateway` `config.schema.lookup` para obtener un único nodo exacto del esquema limitado por ruta antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento con respecto a la superficie actual del esquema.

Los `uiHints` del esquema también incluyen un booleano `advanced` resuelto para cada ruta.
La interfaz de control lo usa para mostrar primero los campos comunes y contraer los campos avanzados por
sección; la búsqueda sigue abarcando ambos niveles. Los metadatos de nivel son solo de presentación.
Al añadir una clave, declare su nivel en la hoja o permita que herede la declaración del
ancestro más cercano. Una ruta sin ningún ancestro declarado se considera avanzada de forma predeterminada.

Referencias detalladas específicas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `memory.search.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`.
- [Comandos con barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados y empaquetados.
- Páginas del canal/plugin propietario para superficies de comandos específicas del canal.

---

## Canales

Las claves de configuración de cada canal se encuentran en [Configuración: canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales empaquetados (autenticación, control de acceso, varias cuentas y restricción por menciones).

## Valores predeterminados de los agentes, varios agentes, sesiones y mensajes

Consulte [Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, contenido multimedia, Skills y entorno aislado)
- `multiAgent.*` (enrutamiento y vinculaciones de varios agentes)
- `session.*` (ciclo de vida de las sesiones, Compaction y depuración)
- `messages.*` (entrega de mensajes, TTS y renderizado de Markdown)
- `talk.*` (modo de conversación)
  - `talk.consultThinkingLevel`: anulación del nivel de razonamiento para la ejecución completa del agente OpenClaw que sustenta las consultas en tiempo real del modo de conversación de la interfaz de control
  - `talk.consultFastMode`: anulación puntual del modo rápido para las consultas en tiempo real del modo de conversación de la interfaz de control
  - `talk.speechLocale`: identificador de configuración regional BCP 47 opcional para el reconocimiento de voz del modo de conversación en Android, iOS y macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, el modo de conversación conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: alternativa de retransmisión del Gateway para transcripciones en tiempo real finalizadas del modo de conversación que omiten `openclaw_agent_consult`

## Herramientas y proveedores personalizados

La política de herramientas, las opciones experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de
proveedores personalizados/URL base se encuentran en
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, las listas de modelos permitidos y la configuración de proveedores personalizados se encuentran en
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
La raíz `models` también controla el comportamiento global del catálogo de modelos.

```json5
{
  models: {
    // Opcional. Valor predeterminado: true. Requiere reiniciar el Gateway cuando se modifica.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por identificador de proveedor.
- `models.providers.*.localService`: gestor de procesos opcional bajo demanda para
  servidores de modelos locales. OpenClaw sondea el punto de conexión de estado configurado, inicia
  el `command` absoluto cuando es necesario, espera a que esté listo y, después, envía la solicitud
  del modelo. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla la inicialización de precios en segundo plano que
  comienza después de que los procesos auxiliares y los canales alcanzan la ruta de disponibilidad del Gateway. Cuando `false`,
  el Gateway omite la obtención de los catálogos de precios de OpenRouter y LiteLLM; los valores
  `models.providers.*.models[].cost` configurados siguen funcionando para las estimaciones de costes locales.

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw se encuentran en `mcp.servers` y las
utilizan OpenClaw integrado y otros adaptadores de entorno de ejecución. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` gestionan este bloque sin conectarse al
servidor de destino durante las ediciones de configuración.

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
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
        // Controles opcionales de proyección del servidor de aplicaciones de Codex.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definiciones de servidores MCP con nombre, locales mediante stdio o remotos, para entornos de ejecución que
  exponen las herramientas MCP configuradas.
  Las entradas remotas usan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.servers.<name>.enabled`: establezca `false` para conservar una definición de servidor guardada
  y excluirla de la detección de MCP y la proyección de herramientas de OpenClaw integrado.
- `mcp.servers.<name>.requestTimeoutMs`: tiempo de espera de las solicitudes MCP por servidor, en milisegundos.
- `mcp.servers.<name>.connectionTimeoutMs`: tiempo de espera de conexión por servidor, en milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicación opcional de simultaneidad para
  adaptadores que pueden decidir si realizan llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: establezca `"oauth"` para servidores MCP HTTP que requieran
  OAuth. Ejecute `openclaw mcp login <name>` para almacenar los tokens en el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: anulaciones opcionales del ámbito de OAuth, la URL de redirección y la URL
  de metadatos del cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS de HTTP
  para puntos de conexión privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP detectadas a los nombres coincidentes; `exclude` oculta los nombres
  coincidentes. Las entradas son nombres exactos de herramientas MCP o patrones glob `*` sencillos. Los servidores con
  recursos o indicaciones también generan nombres de herramientas auxiliares (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres usan el
  mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del servidor de aplicaciones de Codex.
  Este bloque contiene metadatos de OpenClaw solo para los hilos del servidor de aplicaciones de Codex; no
  afecta a las sesiones ACP, la configuración genérica del entorno de Codex ni otros adaptadores de entorno de ejecución.
  Un valor `codex.agents` no vacío limita el servidor a los identificadores de agentes OpenClaw enumerados.
  Las listas de agentes con ámbito vacías, en blanco o no válidas se rechazan durante la validación de la configuración
  y la ruta de proyección del entorno de ejecución las omite, en lugar de convertirlas en globales.
  `codex.defaultToolsApprovalMode` emite el valor nativo de Codex
  `default_tools_approval_mode` para ese servidor. OpenClaw elimina el bloque `codex`
  antes de transferir la configuración nativa `mcp_servers` a Codex. Omita el bloque para
  mantener el servidor proyectado para todos los agentes del servidor de aplicaciones de Codex con el
  comportamiento predeterminado de aprobación de MCP de Codex.
- Los entornos de ejecución MCP empaquetados y limitados a la sesión usan un TTL de inactividad integrado de 10 minutos.
  Las ejecuciones integradas puntuales solicitan una limpieza al finalizar la ejecución; el TTL actúa como protección para las sesiones de larga duración y los futuros invocadores.
- Los cambios en `mcp.*` se aplican en caliente descartando los entornos de ejecución MCP almacenados en caché de la sesión.
  La siguiente detección o utilización de herramientas los recrea a partir de la nueva configuración, por lo que las entradas
  `mcp.servers` eliminadas se depuran de inmediato, en vez de esperar al TTL de inactividad.
- La detección en tiempo de ejecución también respeta las notificaciones de cambios en la lista de herramientas MCP descartando
  el catálogo almacenado en caché para esa sesión. Los servidores que anuncian recursos o
  indicaciones obtienen herramientas auxiliares para enumerar y leer recursos, y para enumerar y obtener
  indicaciones. Los fallos reiterados en las llamadas a herramientas pausan brevemente el servidor afectado antes
  de intentar otra llamada.

Consulte [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[Backends de CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para conocer el comportamiento en tiempo de ejecución.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena de texto sin formato
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista opcional de elementos permitidos solo para las Skills empaquetadas (no afecta a las Skills gestionadas o del espacio de trabajo).
- `load.extraDirs`: raíces adicionales de Skills compartidas (precedencia mínima).
- `load.allowSymlinkTargets`: raíces de destino reales de confianza en las que pueden
  resolverse los enlaces simbólicos de Skills cuando el enlace se encuentra fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que la aplicación de Skill Workshop escriba
  a través de destinos de enlaces simbólicos que ya sean de confianza (valor predeterminado: false).
- `install.preferBrew`: cuando es true, se prefieren los instaladores de Homebrew si `brew` está
  disponible antes de recurrir a otros tipos de instaladores.
- `install.nodeManager`: preferencia del instalador de Node para las especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que los clientes de confianza del Gateway `operator.admin`
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (valor predeterminado: false). Esto solo habilita la ruta de archivos cargados; las instalaciones
  normales de ClawHub no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita una Skill aunque esté empaquetada o instalada.
- `entries.<skillKey>.apiKey`: opción práctica para Skills que declaran una variable de entorno principal (cadena de texto sin formato u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitan la detección de Skills y la indicación de Skills dirigida al modelo.
- La configuración de autonomía y aprobación de Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) se documenta en [Configuración de Skills](/es/tools/skills-config).

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

- Se carga desde directorios de paquetes o bundles bajo `~/.openclaw/extensions` y `<workspace>/.openclaw/extensions`, además de los archivos o directorios enumerados en `plugins.load.paths`.
- Coloque los archivos de Plugin independientes en `plugins.load.paths`; las raíces de extensiones detectadas automáticamente ignoran los archivos `.js`, `.mjs` y `.ts` de nivel superior para que los scripts auxiliares de esas raíces no bloqueen el inicio.
- La detección admite plugins nativos de OpenClaw, además de bundles compatibles de Codex y Claude, incluidos los bundles de Claude sin manifiesto que usan la disposición predeterminada.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins enumerados). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo práctico para la clave de API a nivel de Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito de Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea hooks que modifican el prompt, como `before_prompt_build`. Se aplica a hooks de plugins nativos y a los directorios de hooks compatibles proporcionados por bundles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins de confianza no incluidos en el bundle pueden leer el contenido sin procesar de la conversación desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para solicitar reemplazos de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos de `provider/model` para reemplazos de subagentes de confianza. Use `"*"` solo cuando desee permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este Plugin para solicitar reemplazos de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos de `provider/model` para reemplazos de finalización LLM de plugins de confianza. Use `"*"` solo cuando desee permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este Plugin para ejecutar `api.runtime.llm.complete` con un id de agente que no sea el predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado mediante el esquema de Plugin nativo de OpenClaw cuando esté disponible).
- La configuración de cuenta y tiempo de ejecución de los plugins de canal reside bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del Plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del Plugin del entorno de ejecución de Codex

El Plugin incluido `codex` gestiona la configuración del entorno de ejecución nativo del servidor de aplicaciones de Codex bajo
`plugins.entries.codex.config`. Consulte la
[referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference) para conocer toda la superficie de configuración
y [Entorno de ejecución de Codex](/es/plugins/codex-harness) para conocer el modelo de tiempo de ejecución.

`codexPlugins` se aplica únicamente a las sesiones que seleccionan el entorno de ejecución nativo de Codex.
No habilita los plugins de Codex para las ejecuciones de proveedores de OpenClaw, los enlaces de
conversación ACP ni ningún entorno de ejecución que no sea de Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita la compatibilidad nativa con
  plugins/aplicaciones de Codex para el entorno de ejecución de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expone todas las
  aplicaciones accesibles actualmente conectadas a la cuenta autenticada de Codex en
  cada nuevo hilo nativo de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para las solicitudes de aplicaciones de plugins configuradas.
  Use `true` para aceptar esquemas seguros de aprobación de Codex sin preguntar, `false`
  para rechazarlos, `"auto"` para dirigir las aprobaciones requeridas por Codex a través de las
  aprobaciones de plugins de OpenClaw, o `"ask"` para solicitar confirmación por cada acción de
  escritura/destructiva de un Plugin sin aprobación persistente. El modo `"ask"` borra los
  reemplazos persistentes de aprobación por herramienta de Codex para la aplicación afectada y selecciona al
  revisor humano de aprobaciones para esa aplicación antes de que se inicie el hilo de Codex.
  Valor predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una
  entrada de Plugin configurada cuando el valor global `codexPlugins.enabled` también es verdadero.
  Valor predeterminado: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace, requerida junto con `pluginName` para cada entrada
  resuelta. Admite `"openai-curated"` y `"workspace-directory"`. Se ignoran las entradas
  a las que les falte cualquiera de los campos de identidad.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad estable
  del Plugin de Codex, requerida junto con `marketplaceName`. Una
  entrada `workspace-directory` debe usar el `summary.id` exacto, calificado por el marketplace,
  que devuelve `plugin/list`, por ejemplo
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  reemplazo de acciones destructivas por Plugin. Cuando se omite, se usa el valor global
  `allow_destructive_actions`. El valor por Plugin acepta las mismas políticas
  `true`, `false`, `"auto"` o `"ask"`.

Cada aplicación de Plugin admitida que usa `"ask"` dirige las solicitudes de aprobación
de esa aplicación al revisor humano. Las demás aplicaciones y las aprobaciones de hilos no relacionadas con aplicaciones conservan su
revisor configurado, por lo que las políticas mixtas de plugins no heredan el comportamiento de `"ask"`.

`codexPlugins.enabled` es la directiva global de habilitación. Las entradas explícitas de plugins
escritas por la migración constituyen el conjunto persistente seleccionado de elegibilidad para instalación y reparación.
Las entradas `workspace-directory` configuradas manualmente ya deben estar
instaladas y habilitadas, y sus aplicaciones propias deben ser accesibles; OpenClaw
no las instala ni las autentica. Si Codex rechaza la solicitud explícita del catálogo del espacio de trabajo,
las entradas habilitadas del espacio de trabajo se cierran de forma segura con
`marketplace_missing`, mientras que las entradas seleccionadas del catálogo predeterminado permanecen
disponibles. `plugins["*"]` no es compatible, no existe ningún interruptor `install` y
los valores locales `marketplacePath` no son intencionadamente campos de configuración porque son
específicos del host. Consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins) para conocer los requisitos de versión y
disponibilidad del servidor de aplicaciones.

Las comprobaciones de disponibilidad de `app/list` se almacenan en caché durante una hora y se actualizan
de forma asíncrona cuando quedan obsoletas. La configuración de aplicaciones del hilo de Codex se calcula al establecer
la sesión del entorno de ejecución de Codex, no en cada turno; use `/new`, `/reset` o reinicie el Gateway
después de cambiar la configuración nativa de plugins.

`codexPlugins.allow_all_plugins` incluye una instantánea de cada aplicación de cuenta accesible actualmente
en cada nuevo hilo nativo de Codex. No instala plugins ni aplicaciones, y
las aplicaciones inaccesibles permanecen excluidas. Las aplicaciones de cuenta usan la política global
`codexPlugins.allow_destructive_actions`. Las entradas explícitas de plugins tienen
prioridad cuando la misma aplicación está presente en ambas rutas. Si no se puede leer `app/list`,
la exposición en toda la cuenta se cierra de forma segura.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web Firecrawl.
  - `apiKey`: clave de API opcional de Firecrawl para límites superiores (acepta SecretRef). Recurre a la variable de entorno `plugins.entries.firecrawl.config.webSearch.apiKey` o `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; los reemplazos autoalojados deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extrae únicamente el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de la caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (p. ej., `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de la memoria. Consulte [Dreaming](/es/concepts/dreaming) para conocer las fases y los umbrales.
  - `enabled`: interruptor principal de Dreaming (valor predeterminado: `false`).
  - `frequency`: frecuencia de Cron para cada ciclo completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: reemplazo opcional del modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínelo con `allowedModels` para restringir los destinos. Los errores de modelo no disponible se reintentan una vez con el modelo predeterminado de la sesión; los fallos de confianza o de la lista de permitidos no recurren silenciosamente a otro modelo.
  - La política de fases y los umbrales son detalles de implementación (no son claves de configuración orientadas al usuario).
- La configuración completa de la memoria se encuentra en la [referencia de configuración de memoria](/es/reference/memory-config):
  - `memory.search.*`
  - `agents.entries.*.memory.search.*` para reemplazos por agente
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins habilitados de bundles de Claude también pueden aportar valores predeterminados integrados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración saneada del agente, no como parches sin procesar de la configuración de OpenClaw.
- `plugins.slots.memory`: selecciona el id del Plugin de memoria activo, o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: selecciona el id del Plugin activo del motor de contexto; el valor predeterminado es `"legacy"`, a menos que se instale y seleccione otro motor.

Consulte [Plugins](/es/tools/plugin).

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
- `tabCleanup` controla la limpieza periódica de mejor esfuerzo de las pestañas
  rastreadas del agente principal tras un período de inactividad o cuando una sesión supera su límite. El rastreo se aplica únicamente
  a las pestañas creadas por la herramienta de navegador `action: "open"`; las pestañas abiertas por el usuario o
  cuya propiedad se desconoce nunca se adoptan. Deshabilitar `tabCleanup` no deshabilita la limpieza explícita del ciclo de vida de la sesión.
- Las aperturas locales del host con un destino CDP nativo estable y una identidad de navegador
  se almacenan en el estado SQLite compartido y siguen siendo aptas tras los reinicios del Gateway para
  `/new` y la limpieza del ciclo de vida de la sesión. Los destinos CDP nativos orientados a herramientas también
  siguen siendo aptos para la limpieza por inactividad y por límite tras el reinicio. Chrome MCP utiliza
  identificadores de destino locales al proceso, por lo que los registros inactivos de sesiones existentes esperan a la
  limpieza del ciclo de vida en lugar de arriesgarse a un barrido por inactividad sobre actividad posterior al reinicio
  que no pueda atribuirse. OpenClaw verifica el perfil y la instancia del navegador
  antes de cerrarla. La conexión automática de Chrome MCP, la ausencia de identidad de navegador
  `/json/version` y los destinos nativos sin resolver permanecen totalmente locales al proceso, por lo que
  no se cierran automáticamente tras un reinicio. Las pestañas antiguas sin rastrear requieren
  cierre manual. Los errores transitorios permanecen pendientes para un reintento posterior. Consulte
  [Propiedad de la limpieza de pestañas](/es/tools/browser#tab-cleanup-ownership).
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se define, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Establezca `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` únicamente cuando confíe intencionadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad y detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, utilice `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos solo permiten adjuntarse (inicio, detención y restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Utilice HTTP(S) cuando quiera que OpenClaw detecte `/json/version`; utilice WS(S)
  cuando su proveedor le proporcione una URL directa de WebSocket de DevTools.
- Si se puede acceder a un servicio CDP administrado externamente mediante loopback, establezca
  el valor `attachOnly: true` de ese perfil; de lo contrario, OpenClaw trata el puerto de loopback como un
  perfil de navegador local administrado y puede informar de errores de propiedad del puerto local.
- Los perfiles `existing-session` utilizan Chrome MCP en lugar de CDP y pueden adjuntarse en
  el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para dirigirse a un perfil
  específico de un navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden establecer `cdpUrl` cuando Chrome ya se está ejecutando
  detrás de un endpoint de detección HTTP(S) de DevTools o un endpoint directo WS(S). En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de utilizar la conexión automática;
  `userDataDir` se ignora en los argumentos de inicio de Chrome MCP.
- Los perfiles `existing-session` mantienen los límites actuales de las rutas de Chrome MCP:
  acciones basadas en instantáneas y referencias en lugar de dirigirse a selectores CSS, enlaces de carga
  de un solo archivo, sin anulaciones del tiempo de espera de diálogos, sin `wait --load networkidle` y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles locales administrados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; establezca
  `cdpUrl` explícitamente solo para perfiles CDP remotos o para adjuntarse al endpoint
  de una sesión existente.
- Los perfiles locales administrados pueden establecer `executablePath` para sustituir el valor global
  `browser.executablePath` en ese perfil. Utilícelo para ejecutar un perfil en
  Chrome y otro en Brave.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Tanto `browser.executablePath` como `browser.profiles.<name>.executablePath`
  aceptan `~` y `~/...` para el directorio principal del sistema operativo antes de iniciar Chromium.
  El valor `userDataDir` por perfil en los perfiles `existing-session` también expande la tilde.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, valor predeterminado `18791`).
- `extraArgs` añade indicadores de inicio adicionales al arranque local de Chromium (por ejemplo,
  `--disable-gpu`, dimensiones de la ventana o indicadores de depuración).

---

## Interfaz de usuario

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto corto, URL de imagen o URI de datos
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // Conserva los comentarios tras las ejecuciones en la interfaz de control; no los entrega a los canales
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; omítalo para utilizar el modo de cola del servidor
      showAdvancedSettings: false, // Expande todos los grupos de opciones avanzadas en Configuración
    },
  },
}
```

- `seamColor`: color de énfasis para los elementos visuales de la interfaz de usuario de la aplicación nativa (tono de la burbuja del modo de conversación, etc.).
- `assistant`: sustitución de la identidad de la interfaz de control. Si no se define, se utiliza la identidad del agente activo.
- `prefs`: preferencias de visualización del operador. Esta es la ubicación canónica para que los agentes puedan
  cambiarlas mediante la puerta de aprobación y todos los clientes de la interfaz de control permanezcan
  sincronizados; los navegadores replican los valores en el almacenamiento local para un inicio instantáneo y conservan
  una copia local del dispositivo cuando no pueden escribir la configuración (ámbito de visualizador, sin conexión).
  El valor predeterminado de `chatPersistCommentary` es `true`. Establecerlo en `false` mantiene visibles los
  comentarios en directo durante una ejecución, pero los elimina al finalizar e impide que nuevos
  comentarios de Codex entren en la réplica persistente de la transcripción. La entrega a los canales de
  mensajería permanece separada y sin cambios.
  El valor predeterminado de `showAdvancedSettings` es `false`; la búsqueda de Configuración puede abrir
  temporalmente un grupo avanzado coincidente sin cambiar esta preferencia.
  Los clientes conectados aplican en directo los cambios del servidor: el Gateway difunde un
  evento `config.changed` que solo contiene el hash después de cada escritura persistente de la configuración y
  los clientes actualizan su instantánea (se omite mientras un borrador local de configuración tenga
  cambios sin guardar). Los clientes que vuelven a conectarse se reconcilian al conectarse.

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
      // password: "your-password", // o OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; consulte /gateway/trusted-proxy-auth
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
      // toolTitles: false, // títulos opcionales del propósito de la IA para las llamadas a herramientas (consume tokens del modelo auxiliar)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // peligroso: permite URL http(s) externas absolutas para contenido incrustado
      // chatMessageMaxWidth: "min(1280px, 82%)", // ancho máximo opcional de la transcripción centrada del chat
      // allowedOrigins: ["https://control.example.com"], // obligatorio para una interfaz de control fuera de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // peligroso modo alternativo de origen basado en el encabezado Host
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
    // Opcional. Valor predeterminado: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Sin definir/deshabilitado de forma predeterminada.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Aprobación automática verificada mediante SSH. Valor predeterminado: habilitada (true).
        // Establezca false para deshabilitar solo la verificación mediante SSH; esto no afecta a
        // autoApproveCidrs de arriba. Para emparejar nodos solo manualmente, establezca false Y
        // deje autoApproveCidrs sin definir. Pase un objeto para ajustar: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      commands: {
        allow: ["canvas.navigate"],
        deny: ["system.run"],
      },
    },
    tools: {
      // Denegaciones HTTP adicionales para /tools/invoke
      deny: ["browser"],
      // Elimina herramientas de la lista predeterminada de denegación HTTP para solicitantes propietarios/administradores
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

<Accordion title="Detalles de los campos del Gateway">

- `mode`: `local` (ejecutar el Gateway) o `remote` (conectarse a un Gateway remoto). El Gateway se niega a iniciarse a menos que `local`.
- `port`: un único puerto multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (IPv4 de Tailscale cuando esté disponible; de lo contrario, loopback) o `custom` (una dirección IPv4). Una dirección `tailnet` resuelta y cualquier dirección `custom` distinta de `127.0.0.1` o `0.0.0.0` requieren `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los listeners no puede vincularse. La exposición fuera de loopback permanece limitada a la interfaz seleccionada.
- **Alias de vinculación heredados**: use valores de modo de vinculación en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: la vinculación predeterminada `loopback` escucha en `127.0.0.1` dentro del contenedor. Con la red de puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que no se puede acceder al Gateway. Use `--network host` o establezca `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: obligatoria de forma predeterminada. Las vinculaciones fuera de loopback requieren autenticación del Gateway. En la práctica, esto implica un token o una contraseña compartidos, o un proxy inverso basado en identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` (incluidas las SecretRefs), establezca `gateway.auth.mode` explícitamente en `token` o `password`. El inicio y los flujos de instalación o reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úselo solo en configuraciones locales de loopback de confianza; no se ofrece intencionadamente en las indicaciones de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador o del usuario en un proxy inverso basado en identidad y confía en los encabezados de identidad procedentes de `gateway.trustedProxies` (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)). De forma predeterminada, este modo espera que el proxy proceda de una fuente **fuera de loopback**; los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como alternativa local directa; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo de proxy de confianza.
- `gateway.auth.allowTailscale`: cuando `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de la interfaz de control/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** utilizan esa autenticación mediante encabezados de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token presupone que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de intentos de autenticación fallidos. Se aplica por IP de cliente y por ámbito de autenticación (el secreto compartido y el token de dispositivo se registran de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por tanto, los intentos incorrectos simultáneos del mismo cliente pueden activar el limitador en la segunda solicitud, en lugar de que ambos compitan y pasen como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establezca `false` cuando se quiera limitar intencionadamente también la tasa del tráfico de localhost (para configuraciones de prueba o despliegues de proxy estrictos).
- Los intentos de autenticación WS con origen en el navegador siempre están sujetos a limitación, con la exención de loopback deshabilitada (defensa en profundidad contra ataques de fuerza bruta a localhost desde el navegador).
- En loopback, esos bloqueos con origen en el navegador se aíslan por cada valor normalizado de `Origin`,
  por lo que los fallos repetidos desde un origen de localhost no bloquean automáticamente
  un origen diferente.
- `tailscale.mode`: `serve` (solo tailnet, vinculación de loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre de servicio opcional de Tailscale para el modo Serve, como
  `svc:openclaw`. Cuando se establece, OpenClaw lo pasa a `tailscale serve
--service` para que la interfaz de control pueda exponerse mediante un servicio con nombre en lugar
  del nombre de host del dispositivo. El valor debe usar el formato de nombre de servicio `svc:<dns-label>`
  de Tailscale; el inicio informa de la URL de servicio derivada.
- `tailscale.preserveFunnel`: cuando `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve durante el inicio y lo omite
  si una ruta de Funnel configurada externamente ya cubre el puerto del Gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: lista explícita de orígenes permitidos para las conexiones WebSocket del Gateway. Es obligatoria para orígenes públicos de navegador fuera de loopback. Las cargas privadas de la interfaz de usuario desde el mismo origen en LAN/Tailnet procedentes de loopback, RFC1918/enlace local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
- `controlUi.toolTitles`: permite activar títulos de propósito generados por IA para las llamadas a herramientas en el chat de la interfaz de control. Valor predeterminado: `false` (la representación de herramientas sigue siendo totalmente determinista, sin llamadas al modelo en segundo plano). Cuando se habilita, el método `chat.toolTitles` asigna etiquetas a las llamadas complejas mediante el enrutamiento estándar del modelo auxiliar: el `utilityModel` del agente (una decisión del operador que puede enviar argumentos acotados de herramientas al proveedor elegido, como en cualquier tarea auxiliar) o el modelo pequeño predeterminado declarado por el proveedor de la sesión (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); además, almacena los resultados en caché en la base de datos de estado de cada agente para que las visualizaciones repetidas nunca vuelvan a generar cargos. `utilityModel: \"\"` deshabilita los títulos como cualquier otra tarea auxiliar; los títulos nunca recurren al modelo principal como alternativa.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para la transcripción centrada del chat de la interfaz de control. Acepta valores de ancho CSS restringidos, como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita la alternativa de origen basada en el encabezado Host para despliegues que dependen intencionadamente de una política de origen basada en dicho encabezado.
- `terminal.enabled`: permite activar la terminal del operador con ámbito de administrador. Valor predeterminado: `false`. La terminal inicia una PTY del host en el espacio de trabajo del agente seleccionado, hereda el entorno del proceso del Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítela solo en despliegues con operadores de confianza; cambiarla reinicia el Gateway y actualiza la política de seguridad de contenido de la interfaz de control.
- `terminal.shell`: ejecutable de shell opcional. Cuando no está establecido, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: tiempo durante el que una sesión de terminal sobrevive después de que se interrumpa su conexión (recarga de la página, suspensión del portátil), permaneciendo disponible para volver a conectarse mediante `terminal.attach` con la reproducción de su salida reciente. Valor predeterminado: `300`. Establezca `0` para terminar las sesiones en cuanto se interrumpa su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, por lo que se recomienda reducir este valor en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` en hosts públicos; `ws://` sin cifrar solo se acepta para loopback, LAN, enlace local, `.local`, `.ts.net` y hosts CGNAT de Tailscale.
- `remote.remotePort`: puerto del Gateway en el host SSH remoto. El valor predeterminado es `18789`; úselo cuando el puerto del túnel local sea distinto del puerto del Gateway remoto.
- `remote.tlsFingerprint`: huella digital SHA-256 esperada del certificado de un Gateway remoto `wss://`. La aplicación para macOS la aplica tanto a las conexiones de operador/control como a las de nodos complementarios. Sin un valor explícito, macOS registra una fijación en el primer uso solo después de que la confianza normal del sistema se valide correctamente.
- `remote.sshHostKeyPolicy`: política de claves de host del túnel SSH de macOS. `strict` es el valor predeterminado y requiere una clave que ya sea de confianza. `openssh` es una activación explícita de la configuración efectiva de OpenSSH para los alias administrados; revise la configuración SSH correspondiente del usuario y del sistema antes de usarla. La aplicación para macOS y `configure-remote` restablecen esta política a `strict` al cambiar de destino, salvo que se vuelva a activar explícitamente.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. Por sí solos, no configuran la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del retransmisor APNs externo que se utiliza después de que las compilaciones de iOS respaldadas por el retransmisor publiquen registros en el Gateway. Las compilaciones públicas de App Store usan el retransmisor alojado de OpenClaw. Las URL de retransmisores personalizados deben corresponder a una ruta de compilación y despliegue de iOS deliberadamente independiente cuya URL de retransmisor apunte a dicho retransmisor.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del Gateway al retransmisor en milisegundos. El valor predeterminado es `10000`.
- Los registros respaldados por el retransmisor se delegan a una identidad específica del Gateway. La aplicación de iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del retransmisor y reenvía al Gateway una concesión de envío limitada al registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales mediante variables de entorno para la configuración del retransmisor anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape exclusiva para desarrollo destinada a las URL HTTP de retransmisores en loopback. Las URL de retransmisores de producción deben seguir usando HTTPS.
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: anulación opcional mediante variable de entorno del tiempo de espera integrado para el protocolo de enlace WebSocket del Gateway previo a la autenticación.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando se establece, tiene precedencia sobre la anulación a nivel de canal.
- Las rutas de llamadas al Gateway local solo pueden usar `gateway.remote.*` como alternativa cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que una alternativa remota lo oculte).
- `trustedProxies`: IP de proxies inversos que terminan TLS o insertan encabezados de cliente reenviado. Incluya solo los proxies que controle. Las entradas de loopback siguen siendo válidas para configuraciones de proxy o detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes de loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Valor predeterminado: `false` para un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidas para aprobar automáticamente el primer emparejamiento de un dispositivo de nodo sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento del operador, navegador, interfaz de control o WebChat, ni las actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.pairing.sshVerify`: aprobación automática verificada mediante SSH para el emparejamiento inicial de dispositivos Node (valor predeterminado: habilitada). El Gateway se conecta por SSH al host de emparejamiento (BatchMode, claves de host estrictas) y aprueba únicamente cuando la clave del dispositivo coincide exactamente con `openclaw node identity`. Se aplica el mismo umbral de elegibilidad que para `autoApproveCidrs`; las sondas se limitan a direcciones de origen privadas/CGNAT, salvo que `cidrs` las anule. Establezca `false` para deshabilitarla o `{ user, identity, timeoutMs, cidrs }` para ajustarla. Consulte [Emparejamiento de Node](/es/gateway/pairing#ssh-verified-device-auto-approval-default).
- `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny`: configuración global de permisos y denegaciones para los comandos declarados de Node tras el emparejamiento y la evaluación de la lista de permitidos de la plataforma. Use `commands.allow` para habilitar comandos peligrosos de Node, como `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` y `sms.send`; `commands.deny` elimina un comando aunque, de otro modo, un valor predeterminado de la plataforma o un permiso explícito lo incluyeran. El permiso de Salud de iOS, el permiso de SMS de Android y la autorización de comandos del Gateway son independientes. Después de que un Node cambie su lista de comandos declarados, rechace y vuelva a aprobar el emparejamiento de ese dispositivo para que el Gateway almacene la instantánea actualizada de los comandos.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para `POST /tools/invoke` HTTP (amplía la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada para
  llamantes propietarios/administradores. Esto no concede acceso de propietario/administrador a los llamantes `operator.write`
  que portan identidad; `cron`, `gateway` y `nodes` siguen sin estar
  disponibles para llamantes que no sean propietarios, aunque estén incluidos en la lista de permitidos.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administración: desactivado de forma predeterminada como el plugin `admin-http-rpc`. Habilite el plugin para registrar `POST /api/v1/admin/rpc`. Consulte [RPC HTTP de administración](/es/plugins/admin-http-rpc).
- Chat Completions: desactivado de forma predeterminada. Habilítelo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de la entrada de URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se consideran no configuradas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    o `gateway.http.endpoints.responses.images.allowUrl=false`, o ambos, para deshabilitar la obtención de URL.
- Encabezado opcional de refuerzo de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúrelo solo para orígenes HTTPS bajo su control; consulte [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de varias instancias

Ejecute varios gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Opciones prácticas: `--dev` (usa `~/.openclaw-dev` + el puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Varios gateways](/es/gateway/multiple-gateways).

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

- `enabled`: habilita la terminación TLS en el listener del gateway (HTTPS/WSS) (valor predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado y clave autofirmados cuando no se configuran archivos explícitos; solo para uso local o de desarrollo.
- `certPath`: ruta del sistema de archivos al archivo del certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de la clave privada TLS; mantenga sus permisos restringidos.
- `caPath`: ruta opcional al paquete de CA para la verificación de clientes o cadenas de confianza personalizadas.

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

- `mode`: controla cómo se aplican en tiempo de ejecución las modificaciones de la configuración.
  - `"off"`: ignora las modificaciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: reinicia siempre el proceso del gateway cuando cambia la configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciarlo.
  - `"hybrid"` (valor predeterminado): intenta primero la recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de antirrebote en ms antes de aplicar los cambios de configuración (entero no negativo; valor predeterminado: `300`).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar a que finalicen las operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítalo para usar la espera limitada predeterminada (`300000`); establezca `0` para esperar indefinidamente y registrar periódicamente advertencias de que aún hay operaciones pendientes.

---

## Entornos de trabajadores en la nube

Los trabajadores en la nube son opcionales. Si `cloudWorkers` no está presente o `profiles` está vacío, OpenClaw no acepta la creación de nuevos trabajadores. Los registros duraderos creados anteriormente siguen reconciliándose y permanecen visibles; la proyección existente del gateway/node no cambia.

Cada proveedor de trabajadores debe devolver una `hostKey` SSH desde la salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El arranque escribe esa clave en un archivo `known_hosts` aislado, usa `StrictHostKeyChecking=yes` y falla antes de abrir una conexión cuando el proveedor la omite. No existe un mecanismo alternativo de confianza en el primer uso.

El túnel se configura bajo demanda, en lugar de como parte del aprovisionamiento. Cuando se inicia, el gateway reenvía de forma inversa un socket Unix local del trabajador a su endpoint WebSocket de loopback. El socket reside en un directorio remoto asignado aleatoriamente y accesible solo por el propietario; a diferencia de un puerto TCP de loopback, otras cuentas de un trabajador multiusuario no pueden acceder a él y no puede colisionar con el puerto de otro entorno. Los keepalives de SSH y el retardo de reconexión exponencial limitado solo se ejecutan mientras el propietario del túnel siga siendo el vigente. Al detener el túnel, se bloquean las reconexiones antes de cerrar el proceso SSH.

El tráfico de control y la transferencia del espacio de trabajo usan conexiones SSH independientes. Ambos reutilizan la misma identidad resuelta y el mismo archivo `known_hosts` fijado y aislado, pero la transferencia del espacio de trabajo no comparte la multiplexación de conexiones SSH con el túnel de larga duración, por lo que rsync no puede bloquear el tráfico de control.

### Perfil de Crabbox

El proveedor `crabbox` incluido aprovisiona una concesión compatible con SSH mediante la CLI local de Crabbox. El `settings.provider` interno selecciona el backend de Crabbox; es independiente del id del proveedor externo de OpenClaw.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Predeterminado; use "npm" solo para una versión publicada del gateway.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Ruta absoluta opcional. Valor predeterminado: el ../crabbox/bin/crabbox contiguo y, después, PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (obligatorio): backend de Crabbox que se pasa mediante `--provider`. Use un backend cuya salida de inspección incluya un endpoint SSH; `aws` selecciona el backend directo de AWS.
- `settings.class` (obligatorio): clase de máquina de Crabbox que se pasa a `--class`.
- `settings.ttl` y `settings.idleTimeout` (obligatorios): cadenas de duración Go positivas que se pasan a `--ttl` y `--idle-timeout`. Estos mecanismos de seguridad del lado del proveedor son distintos de la política `lifetime` almacenada por OpenClaw que se describe a continuación.
- `settings.binary`: ruta absoluta opcional al ejecutable de Crabbox. Si no se especifica, OpenClaw comprueba primero el checkout contiguo de Crabbox, después las entradas ejecutables de `PATH` y, por último, invoca `crabbox` para que la ausencia de la CLI siga siendo un error visible del proveedor.

Se rechazan las opciones desconocidas. Las credenciales de Crabbox y la configuración de cuentas específica del backend siguen siendo propiedad de Crabbox; no las incluya en `settings`. OpenClaw solo invoca la CLI local y no realiza llamadas de red al proveedor desde este plugin. El aprovisionamiento siempre pasa `--keep=true`; OpenClaw controla el ciclo de vida externo y destruye la concesión con `crabbox stop`.

<Note>
  OpenClaw resuelve la ruta `sshKey` local de la concesión de Crabbox mediante el resolvedor de secretos propiedad del proveedor y fija el `sshHostKey` autoritativo devuelto por `crabbox inspect --json`. La admisión de AWS también requiere `providerMetadata.instanceProfileAttached`. Instale Crabbox 0.38.1 o una versión posterior para este contrato de inspección cerrado.
</Note>

### Perfil de desarrollo SSH estático

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: perfiles de trabajadores con nombre e ids no vacíos y sin espacios en blanco iniciales ni finales. Cada perfil selecciona un proveedor registrado por un plugin.
- `provider`: id no vacío del proveedor de trabajadores. Los ejemplos usan el proveedor `crabbox` incluido y el proveedor `static-ssh` de QA Lab.
- `install`: método de instalación del trabajador. `"bundle"` (valor predeterminado) transfiere un paquete con hash de contenido de la compilación instalada del gateway y admite versiones publicadas, de desarrollo y no publicadas. `"npm"` es una optimización opcional para una versión empaquetada sin modificaciones; instala `openclaw@<exact gateway version>` desde el registro público de npm y nunca instala `latest`.
- Los plugins de proveedores incluidos se seleccionan automáticamente cuando están configurados, pero las deshabilitaciones explícitas y `plugins.allow` siguen siendo aplicables. Incluya el id del proveedor (por ejemplo, `crabbox`) cuando se configure una lista de permitidos. Los plugins de proveedores externos también deben estar instalados y habilitados explícitamente.
- `settings`: JSON limitado propiedad del proveedor. El plugin seleccionado define y valida sus claves; use [objetos SecretRef](/es/gateway/secrets) para los valores que contengan secretos. El proveedor SSH estático requiere `host`, `user`, `hostKey` y `keyRef`; el valor predeterminado de `port` es `22`. `hostKey` debe ser una línea de clave de host pública OpenSSH (`algorithm base64`) obtenida del host conocido o de otro canal de confianza, sin prefijo de opciones.
- `lifetime.idleTimeoutMinutes`: minutos expresados como entero positivo y almacenados para la política posterior de recuperación por inactividad.
- `lifetime.maxLifetimeMinutes`: minutos expresados como entero positivo y almacenados para la política posterior de ciclo de vida.

En el trabajador ya debe estar instalado un entorno de ejecución de Node compatible (22.22.3+, 24.15+ o 25.9+) con SQLite seguro para el restablecimiento de WAL. El método opcional `"npm"` también requiere `npm` y acceso HTTPS saliente al registro público de npm. La configuración de cadenas de herramientas en red es una política del proveedor; el arranque informa de un error procesable en lugar de instalar por sí mismo las cadenas de herramientas.

Esta base instala y verifica la compilación del gateway y proporciona el ciclo de vida de inicio y detención del túnel, pero no inicia la CLI general de OpenClaw. La entrada autónoma del trabajador y el bucle se incorporarán en el siguiente hito de trabajadores en la nube.

Cada registro duradero de entorno conserva sus opciones validadas del proveedor, el método de instalación resuelto y la política de duración en una instantánea del perfil tomada en el momento de la creación. Cambiar o eliminar un perfil con nombre afecta a las nuevas creaciones; los registros existentes continúan la reconciliación del ciclo de vida con esa instantánea, siempre que el plugin propietario siga disponible.

Los valores de duración son solo datos en la primera versión de trabajadores en la nube; la aplicación automática se incorporará con el trabajo posterior del ciclo de vida. Los cambios de perfil requieren reiniciar el gateway.

<Warning>
  El proveedor `static-ssh` es un entorno de desarrollo de QA Lab basado en el árbol de código fuente y está excluido de las distribuciones empaquetadas. Un trabajador que se ejecute en su host compartido puede leer datos no relacionados del host, por lo que no se debe usar este proveedor como límite de aislamiento para producción.
  Su operador debe proporcionar el `hostKey` esperado; OpenClaw no aprenderá ni aceptará una clave de la primera conexión.
  Destruir su concesión solo libera el registro lógico de OpenClaw; no detiene ni limpia el host.
</Warning>

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
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
        messageTemplate: "De: {{messages[0].from}}\nAsunto: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Autenticación: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Se rechazan los tokens de hooks en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un valor `hooks.token` no vacío.
- `hooks.token` debe ser distinto de la autenticación activa mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); al iniciarse, se registra una advertencia de seguridad no fatal cuando se detecta su reutilización.
- `openclaw security audit` señala la reutilización de la autenticación del hook/Gateway como un hallazgo crítico, incluida la autenticación mediante contraseña del Gateway proporcionada únicamente durante la auditoría (`--auth password --password <password>`). Ejecute `openclaw doctor --fix` para rotar un valor `hooks.token` reutilizado y persistente; después, actualice los emisores externos de hooks para que usen el nuevo token del hook.
- `hooks.path` no puede ser `/`; use una subruta dedicada, como `/hooks`.
- Si se establece `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si una asignación o configuración predefinida usa un valor `sessionKey` basado en plantilla, establezca `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esta habilitación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` de la carga útil de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (valor predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores `sessionKey` de asignaciones renderizadas mediante plantillas se consideran proporcionados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de la asignación">

- `match.path` coincide con la subruta posterior a `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen datos de la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan las rutas absolutas y el recorrido de directorios).
  - Mantenga `hooks.transformsDir` bajo `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` indica que esta ruta no es válida, mueva el módulo de transformación al directorio de transformaciones de hooks o elimine `hooks.transformsDir`.
- `agentId` dirige la ejecución a un agente específico; los identificadores desconocidos recurren al agente predeterminado.
- `allowedAgentIds`: restringe el enrutamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agentes mediante hooks sin un valor `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los invocadores de `/hooks/agent` y las claves de sesión de asignaciones basadas en plantillas establezcan `sessionKey` (valor predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista opcional de prefijos permitidos para valores `sessionKey` explícitos (solicitud + asignación), p. ej., `["hook:"]`. Pasa a ser obligatoria cuando alguna asignación o configuración predefinida usa un valor `sessionKey` basado en plantilla.
- `deliver: true` envía la respuesta final a un canal; el valor predeterminado de `channel` es `last`.
- `model` sustituye el LLM para esta ejecución del hook (debe estar permitido si se ha establecido el catálogo de modelos).

</Accordion>

### Integración con Gmail

- La configuración predefinida integrada de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Esta clave por mensaje aísla el contexto de la conversación, no las herramientas ni el acceso al espacio de trabajo. Sin una asignación personalizada que establezca `agentId`, la configuración predefinida usa el agente predeterminado.
- Para bandejas de entrada que no sean de confianza, dirija Gmail a un agente lector dedicado y restrinja ese agente mediante la [política de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools). Si el lector debe notificar al agente principal, restrinja la transferencia mediante [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent). Consulte [Inyección de prompts](/es/gateway/security#prompt-injection) para conocer el modelo de amenazas y el nivel de modelo recomendados.
- Si mantiene ese enrutamiento por mensaje, establezca `hooks.allowRequestSessionKey: true` y restrinja `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo, `["hook:", "hook:gmail:"]`.
- Si necesita `hooks.allowRequestSessionKey: false`, sustituya la configuración predefinida por un valor `sessionKey` estático en lugar del valor predeterminado basado en plantilla.

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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- El Gateway inicia automáticamente `gog gmail watch serve` durante el arranque cuando está configurado. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecute un proceso `gog gmail watch serve` independiente junto al Gateway.

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
            // enabled: false, // o OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Sirve HTML/CSS/JS editables por agentes y A2UI mediante HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantenga `gateway.bind: "loopback"` (valor predeterminado).
- Enlaces que no sean de bucle invertido: las rutas de Canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), igual que las demás superficies HTTP del Gateway.
- Normalmente, las WebViews de Node no envían encabezados de autenticación; después de emparejar y conectar un nodo, el Gateway anuncia URL de capacidad con ámbito de nodo para acceder a Canvas/A2UI.
- Las URL de capacidad están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se usa un mecanismo alternativo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un archivo inicial `index.html` cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Deshabilite la recarga en vivo para directorios grandes o si se producen errores `EMFILE`.

---

## Detección

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

- `minimal` (valor predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`; la publicidad por multidifusión en la LAN sigue requiriendo que esté habilitado el Plugin integrado `bonjour`.
- `off`: suprime la publicidad por multidifusión en la LAN sin cambiar la habilitación del Plugin.
- El Plugin integrado `bonjour` se inicia automáticamente en hosts macOS y requiere habilitación explícita en Linux, Windows y despliegues del Gateway en contenedores.
- El nombre de host usa de manera predeterminada el nombre de host del sistema cuando este es una etiqueta DNS válida y, en caso contrario, recurre a `openclaw`. Sustitúyalo mediante `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita por completo la publicidad mDNS, con prioridad sobre `discovery.mdns.mode`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD de unidifusión bajo `~/.openclaw/dns/`. Para la detección entre redes, combínela con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

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
- Archivos `.env`: `.env` del directorio de trabajo actual + `~/.openclaw/.env` (ninguno sustituye las variables existentes).
- `shellEnv`: importa las claves esperadas que falten desde el perfil del shell de inicio de sesión.
- Consulte [Entorno](/es/help/environment) para conocer la precedencia completa.

### Sustitución de variables de entorno

Haga referencia a variables de entorno en cualquier cadena de configuración mediante `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo se aceptan nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables ausentes o vacías provocan un error al cargar la configuración.
- Use la secuencia de escape `$${VAR}` para obtener un valor `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores de texto sin formato siguen funcionando.

### `SecretRef`

Use una única estructura de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de identificador de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Identificador de `source: "file"`: puntero JSON absoluto (por ejemplo, `"/providers/openai/apiKey"`)
- Patrón de identificador de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores `secret#json_key` con el estilo de AWS)
- Los identificadores `source: "exec"` no deben contener segmentos de ruta delimitados por barras `.` o `..` (por ejemplo, se rechaza `a/../b`)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` se dirige a rutas de credenciales `openclaw.json` compatibles.
- Las referencias `auth-profiles.json` se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.

### Configuración de proveedores de secretos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // proveedor de entorno explícito opcional
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
- Las rutas de los proveedores de archivos y ejecución adoptan un cierre seguro cuando no está disponible la verificación de ACL de Windows. Establezca `allowInsecurePath: true` únicamente para rutas de confianza que no puedan verificarse.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo en la entrada/salida estándar.
- De forma predeterminada, se rechazan las rutas de comandos con enlaces simbólicos. Establezca `allowSymlinkCommand: true` para permitir rutas con enlaces simbólicos y validar al mismo tiempo la ruta de destino resuelta.
- Si se configura `trustedDirs`, la comprobación del directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno secundario de `exec` es mínimo de forma predeterminada; pase explícitamente las variables necesarias mediante `passEnv`.
- Las referencias a secretos se resuelven durante la activación en una instantánea en memoria; después, las rutas de solicitud solo leen esa instantánea.
- El filtrado de superficies activas se aplica durante la activación: las referencias sin resolver en superficies habilitadas hacen que falle el inicio o la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

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
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) en los modos de credenciales estáticas.
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no constituyen un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe como perfiles canónicos de clave de API de `provider:default` con una copia de seguridad en `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfiles de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de tiempo de ejecución proceden de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se eliminan al detectarse.
- Las importaciones OAuth heredadas proceden de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/es/concepts/oauth).
- Comportamiento de los secretos en tiempo de ejecución y herramientas de `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

---

## Auditoría

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

El Gateway registra eventos de auditoría **solo de metadatos** para las ejecuciones de agentes y las acciones de herramientas en la base de datos de estado compartida. Los metadatos del ciclo de vida de los mensajes constituyen una opción independiente que debe habilitarse explícitamente. El registro almacena identidad, tiempos, nombres de herramientas y resultados normalizados, pero nunca prompts, cuerpos de mensajes, argumentos de herramientas, resultados ni texto de error sin procesar. Las filas de mensajes no almacenan identificadores sin procesar de cuentas de plataforma, conversaciones, mensajes ni destinos. Las claves de sesión de ejecuciones y herramientas siguen disponibles para correlación y pueden contener a su vez identificadores de cuentas de plataforma o pares. Los registros caducan después de 30 días y el registro está limitado a 100,000 filas. Consúltelos con [`openclaw audit`](/es/cli/audit) o mediante el RPC del Gateway [`audit.activity.list`](/es/gateway/protocol#audit-ledger-rpc). Consulte [Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos completo, la semántica de privacidad y los límites de cobertura.

- `enabled`: registra nuevos eventos de auditoría (valor predeterminado: `true`). El registro está activado de forma predeterminada porque una pista de auditoría habilitada únicamente después de un incidente no puede explicar el incidente. Establecer `false` detiene la inserción de nuevos eventos después de reiniciar el Gateway; los registros existentes siguen siendo legibles hasta que caduquen. Al volver a activarlo, el registro se reanuda a partir de ese momento; el intervalo sin datos no se rellena de forma retroactiva.
- `messages`: ámbito de los metadatos de mensajes (valor predeterminado: `"off"`). `"direct"` registra únicamente las conversaciones directas conocidas. `"all"` también registra grupos, canales y tipos de conversación desconocidos. Ambos modos siguen sin incluir contenido y sustituyen los identificadores sin procesar por seudónimos con clave locales de la instalación cuando la correlación está disponible. Estos facilitan la correlación, pero no proporcionan anonimización; la base de datos de estado almacena la clave de derivación, pero las exportaciones de RPC y CLI no lo hacen.

El Gateway en ejecución captura `audit.enabled` y `audit.messages` al iniciarse; reinícielo después de modificar cualquiera de las opciones. Actualmente, la cobertura de mensajes incluye los mensajes entrantes aceptados que llegan al despacho del núcleo y una fila terminal por cada carga útil de respuesta saliente lógica original que llega a la entrega duradera compartida. Las rutas locales del Plugin y de envío directo que omiten esos límites compartidos aún no están cubiertas. El proceso de escritura en segundo plano y con capacidad limitada se ejecuta con el mejor esfuerzo; no es un archivo de cumplimiento sin pérdida de datos.

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
- Establezca `logging.file` para usar una ruta estable.
- `consoleLevel` aumenta a `debug` cuando `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro activo en bytes antes de la rotación (entero positivo; valor predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento con el mejor esfuerzo para la salida de consola, los registros de archivos, los registros OTLP y el texto persistente de las transcripciones de sesión. `redactSensitive: "off"` solo desactiva esta política general para registros y transcripciones; las superficies de seguridad de la interfaz de usuario, las herramientas y los diagnósticos siguen ocultando los secretos antes de emitirlos.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

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

- `enabled`: interruptor principal para la salida de instrumentación (valor predeterminado: `true`).
- `flags`: matriz de cadenas de indicadores que habilitan una salida de registro específica (admite comodines como `"telegram.*"` o `"*"`).
- `otel.enabled`: habilita el pipeline de exportación de OpenTelemetry (valor predeterminado: `false`). Para consultar la configuración completa, el catálogo de señales y el modelo de privacidad, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del recopilador para la exportación de OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de cada señal. Cuando se establecen, sustituyen a `otel.endpoint` únicamente para esa señal.
- `otel.protocol`: `"http/protobuf"` (valor predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con las solicitudes de exportación de OTel.
- `otel.serviceName`: nombre del servicio para los atributos de recursos.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (valor predeterminado), `"stdout"` para un objeto JSON por línea de stdout, o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas de `0` a `1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para los atributos de intervalos OTEL. Está desactivada de forma predeterminada. El valor booleano `true` captura contenido no perteneciente al sistema de mensajes y herramientas; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para la forma experimental más reciente de los intervalos de inferencia de GenAI, incluidos los nombres de intervalos `{gen_ai.operation.name} {gen_ai.request.model}`, el tipo de intervalo `CLIENT` y `gen_ai.provider.name` en lugar del valor heredado `gen_ai.system`. De forma predeterminada, los intervalos conservan `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas de GenAI utilizan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya han registrado un SDK global de OpenTelemetry. En ese caso, OpenClaw omite el inicio y el cierre del SDK propiedad del Plugin, pero mantiene activos los receptores de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoints específicas de cada señal que se utilizan cuando no está establecida la clave de configuración correspondiente.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones integradas (valor predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para el archivo JSONL de trazas de caché (valor predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de trazas de caché (todos con valor predeterminado: `true`).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`: canal de lanzamiento: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. Extended-stable solo está disponible como paquete: los comandos en primer plano gestionan la instalación, mientras que el Gateway puede emitir avisos de actualización de solo lectura.
- `checkOnStart`: comprueba si hay actualizaciones de npm cuando se inicia el Gateway (valor predeterminado: `true`). Las selecciones de extended-stable almacenadas utilizan el mismo aviso de solo lectura y una frecuencia de avisos de 24 horas.
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes estables y beta (valor predeterminado: `false`). Extended-stable nunca se aplica automáticamente.

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
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`: control global de la función ACP (valor predeterminado: `true`; establezca `false` para ocultar las opciones de despacho y creación de ACP).
- `dispatch.enabled`: control independiente para el despacho de turnos de sesiones ACP (valor predeterminado: `true`). Establezca `false` para mantener disponibles los comandos ACP y bloquear la ejecución.
- `backend`: identificador predeterminado del backend de tiempo de ejecución de ACP (debe coincidir con un Plugin registrado de tiempo de ejecución de ACP).
  Instale primero el Plugin del backend y, si está establecido `plugins.allow`, incluya el identificador del Plugin del backend (por ejemplo, `acpx`) o el backend de ACP no se cargará.
- `fallbacks`: lista ordenada de identificadores de backend de ACP alternativos que se prueban cuando el backend principal falla en una etapa temprana con un error aparentemente transitorio (no disponible, límite de frecuencia alcanzado, cuota agotada o sobrecarga) antes de producir cualquier salida. Cada entrada debe coincidir con el backend de un Plugin registrado de tiempo de ejecución de ACP.
- `defaultAgent`: identificador del agente de destino alternativo de ACP cuando las creaciones no especifican un destino explícito.
- `allowedAgents`: lista de identificadores de agentes permitidos para las sesiones de tiempo de ejecución de ACP; si está vacía, no se aplica ninguna restricción adicional.
- `stream.repeatSuppression`: suprime las líneas repetidas de estado o herramientas en cada turno (valor predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.tagVisibility`: registro de nombres de etiquetas y sustituciones booleanas de visibilidad para eventos transmitidos.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de tiempo de ejecución de ACP.

---

## Asistente

Comportamiento y metadatos para los flujos de configuración guiada de la CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`: consentimiento para la detección elegido al inicio de la incorporación guiada. `"full"` (recomendado) permite que la configuración busque automáticamente aplicaciones de IA, claves y entornos de ejecución locales; `"guarded"` hace que la configuración pregunte una vez antes de buscar y ofrezca en su lugar la configuración manual.

- `wizard.appRecommendations` tiene como valor predeterminado `true`. Establézcalo en `false` para desactivar las recomendaciones de aplicaciones instaladas durante la incorporación guiada o clásica y bloquear el acceso de Gateway a `device.apps`. Los hosts Node siguen necesitando su indicador independiente de uso compartido de aplicaciones instaladas, desactivado de forma predeterminada, antes de anunciar el comando.

---

## Identidad

Consulte los campos de identidad de `agents.entries` en [Valores predeterminados del agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan mediante el WebSocket de Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar las claves desconocidas).

<Accordion title="Configuración heredada del puente (referencia histórica)">

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
    webhook: "https://example.invalid/legacy", // alternativa heredada obsoleta para trabajos almacenados con notify:true
    webhookToken: "replace-with-dedicated-token", // token de portador opcional para la autenticación de webhooks salientes
    sessionRetention: "24h", // cadena de duración o false
  },
}
```

- `sessionRetention`: cuánto tiempo se conservan las sesiones de ejecuciones Cron aisladas completadas antes de depurar las filas de sesiones de SQLite. También controla la limpieza de las transcripciones archivadas de Cron eliminadas. Valor predeterminado: `24h`; establezca `false` para desactivarlo.
- El historial de ejecuciones conserva automáticamente las 2000 filas de terminal más recientes por trabajo. Las filas perdidas mantienen su plazo de limpieza de 24 horas.
- `webhookToken`: token de portador utilizado para la entrega mediante POST del Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía ningún encabezado de autenticación.
- `webhook`: URL de Webhook alternativa heredada y obsoleta (http/https) que utiliza `openclaw doctor --fix` para migrar trabajos almacenados que aún tienen `notify: true`; la entrega en tiempo de ejecución utiliza `delivery.mode="webhook"` por trabajo junto con `delivery.to`, o `delivery.completionDestination` cuando se conserva la entrega de anuncios.

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

- `enabled`: activa las alertas de fallo para los trabajos de Cron (valor predeterminado: `false`).
- `after`: cantidad de fallos consecutivos antes de que se active una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: cantidad mínima de milisegundos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: contabiliza las ejecuciones omitidas consecutivas para alcanzar el umbral de alerta (valor predeterminado: `false`). Las ejecuciones omitidas se registran por separado y no afectan al retroceso por errores de ejecución.
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: identificador opcional de cuenta o canal para limitar el ámbito de entrega de las alertas.

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

- Destino predeterminado de las notificaciones de fallo de Cron para todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando hay suficientes datos del destino.
- `channel`: sustitución del canal para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito del anuncio o URL del Webhook. Es obligatorio para el modo Webhook.
- `accountId`: sustitución opcional de la cuenta para la entrega.
- `delivery.failureDestination` por trabajo sustituye este valor predeterminado global.
- Cuando no se establece ningún destino de fallo global ni por trabajo, los trabajos que ya realizan entregas mediante `announce` recurren a ese destino principal de anuncios en caso de fallo.
- `delivery.failureDestination` solo se admite para trabajos `sessionTarget="isolated"`, salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulte [Trabajos de Cron](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se registran como [tareas en segundo plano](/es/automation/tasks).

## Variables de plantilla del modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo sin las menciones de grupo                  |
| `{{From}}`         | Identificador del remitente                        |
| `{{To}}`           | Identificador del destino                          |
| `{{MessageSid}}`   | Identificador del mensaje del canal                |
| `{{SessionId}}`    | UUID de la sesión actual                           |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva |
| `{{MediaUrl}}`     | Pseudo-URL del contenido multimedia entrante       |
| `{{MediaPath}}`    | Ruta local del contenido multimedia                |
| `{{MediaType}}`    | Tipo de contenido multimedia (imagen/audio/documento/…) |
| `{{Transcript}}`   | Transcripción de audio                             |
| `{{Prompt}}`       | Petición multimedia resuelta para entradas de la CLI |
| `{{MaxChars}}`     | Máximo resuelto de caracteres de salida para entradas de la CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`           |
| `{{GroupSubject}}` | Asunto del grupo (en la medida de lo posible)      |
| `{{GroupMembers}}` | Vista previa de los miembros del grupo (en la medida de lo posible) |
| `{{SenderName}}`   | Nombre para mostrar del remitente (en la medida de lo posible) |
| `{{SenderE164}}`   | Número de teléfono del remitente (en la medida de lo posible) |
| `{{Provider}}`     | Indicación del proveedor (whatsapp, telegram, discord, etc.) |

---

## Inclusiones de configuración (`$include`)

Divida la configuración en varios archivos:

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

**Comportamiento de la combinación:**

- Archivo único: sustituye el objeto contenedor.
- Matriz de archivos: se combinan en profundidad en orden (los posteriores sustituyen a los anteriores).
- Claves del mismo nivel: se combinan después de las inclusiones (sustituyen los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven con respecto al archivo que realiza la inclusión, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Se permiten las formas absolutas/`../` únicamente cuando siguen resolviéndose dentro de ese límite. Establezca `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución; cada archivo incluido tiene un límite de 2 MB.
- Las escrituras propiedad de OpenClaw que cambian únicamente una sección de nivel superior respaldada por una inclusión de archivo único se escriben en dicho archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, las matrices de inclusiones y las inclusiones con sustituciones del mismo nivel son de solo lectura para las escrituras propiedad de OpenClaw; dichas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitud excesiva.

---

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Diagnóstico](/es/gateway/doctor)
