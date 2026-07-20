---
read_when:
    - Necesita la semántica exacta de la configuración a nivel de campo o los valores predeterminados
    - Está validando bloques de configuración de canales, modelos, Gateway o herramientas
summary: Referencia de configuración del Gateway para las claves principales de OpenClaw, los valores predeterminados y los enlaces a referencias específicas de los subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-20T11:43:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc847d29653f3457b44ba6d3b7059329ac760e039f858ef7df5e081586b2e6f6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia por campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más detalladas de los subsistemas. Para obtener orientación sobre la configuración orientada a tareas, consulte [Configuración](/es/gateway/configuration). Los catálogos de comandos propios de canales y plugins, así como los ajustes avanzados de memoria/QMD, se encuentran en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw utiliza valores predeterminados seguros cuando se omiten.

El código prevalece sobre esta página:

- `openclaw config schema` muestra el esquema JSON activo utilizado para la validación y la Control UI, con los metadatos de paquetes, plugins y canales integrados.
- Los agentes deben llamar a la acción de herramienta `gateway` `config.schema.lookup` para obtener un nodo exacto del esquema limitado a una ruta antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento frente a la superficie actual del esquema.

Referencias detalladas específicas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`.
- [Comandos de barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados y empaquetados.
- Páginas de los canales/plugins propietarios para las superficies de comandos específicas de cada canal.

---

## Canales

Las claves de configuración por canal se encuentran en [Configuración: canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales empaquetados (autenticación, control de acceso, múltiples cuentas y activación mediante menciones).

## Valores predeterminados de agentes, múltiples agentes, sesiones y mensajes

Consulte [Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, contenido multimedia, Skills y entorno aislado)
- `multiAgent.*` (enrutamiento y vinculaciones de múltiples agentes)
- `session.*` (ciclo de vida de las sesiones, Compaction y depuración)
- `messages.*` (entrega de mensajes, TTS y representación de Markdown)
- `talk.*` (modo de conversación)
  - `talk.consultThinkingLevel`: anulación del nivel de razonamiento para la ejecución completa del agente OpenClaw que sustenta las consultas en tiempo real del modo de conversación de la Control UI
  - `talk.consultFastMode`: anulación puntual del modo rápido para las consultas en tiempo real del modo de conversación de la Control UI
  - `talk.speechLocale`: identificador de configuración regional BCP 47 opcional para el reconocimiento de voz del modo de conversación en Android, iOS y macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, el modo de conversación mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: alternativa de retransmisión del Gateway para las transcripciones finalizadas en tiempo real del modo de conversación que omiten `openclaw_agent_consult`

## Herramientas y proveedores personalizados

La política de herramientas, las opciones experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de proveedores personalizados o URL base se encuentran en [Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools).

## Modelos

Las definiciones de proveedores, las listas de modelos permitidos y la configuración de proveedores personalizados se encuentran en [Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers.*.localService`: gestor opcional de procesos bajo demanda para
  servidores de modelos locales. OpenClaw sondea el endpoint de estado configurado, inicia
  el `command` absoluto cuando es necesario, espera a que esté listo y, a continuación, envía la solicitud
  del modelo. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla la inicialización de precios en segundo plano que
  comienza después de que los procesos auxiliares y los canales alcanzan la ruta de disponibilidad del Gateway. Cuando es `false`,
  el Gateway omite las consultas de los catálogos de precios de OpenRouter y LiteLLM; los valores
  `models.providers.*.models[].cost` configurados siguen funcionando para las estimaciones de costes locales.

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw se encuentran en `mcp.servers` y son
utilizadas por OpenClaw integrado y otros adaptadores de entorno de ejecución. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` gestionan este bloque sin conectarse al
servidor de destino durante las modificaciones de la configuración.

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
  Las entradas remotas utilizan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.servers.<name>.enabled`: establezca `false` para conservar la definición guardada de un servidor
  y excluirla del descubrimiento MCP y de la proyección de herramientas de OpenClaw integrado.
- `mcp.servers.<name>.requestTimeoutMs`: tiempo de espera de las solicitudes MCP por servidor, en milisegundos.
- `mcp.servers.<name>.connectionTimeoutMs`: tiempo de espera de conexión por servidor, en milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicación opcional de concurrencia para
  los adaptadores que pueden elegir si realizan llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: establezca `"oauth"` para los servidores MCP HTTP que requieran
  OAuth. Ejecute `openclaw mcp login <name>` para almacenar los tokens en el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: anulaciones opcionales del ámbito de OAuth, la URL de redirección y la URL
  de metadatos del cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS de HTTP
  para endpoints privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP descubiertas a los nombres coincidentes; `exclude` oculta los nombres
  coincidentes. Las entradas son nombres exactos de herramientas MCP o patrones glob `*` simples. Los servidores con
  recursos o instrucciones también generan nombres de herramientas auxiliares (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres utilizan el
  mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del servidor de aplicaciones de Codex.
  Este bloque contiene metadatos de OpenClaw únicamente para los hilos del servidor de aplicaciones de Codex; no
  afecta a las sesiones ACP, a la configuración genérica del entorno de Codex ni a otros adaptadores de entorno de ejecución.
  Un valor `codex.agents` no vacío limita el servidor a los identificadores de agentes OpenClaw indicados.
  La validación de la configuración rechaza las listas de agentes con ámbito vacías, en blanco o no válidas,
  y la ruta de proyección del entorno de ejecución las omite en lugar de convertirlas en globales.
  `codex.defaultToolsApprovalMode` emite el valor nativo de Codex
  `default_tools_approval_mode` para ese servidor. OpenClaw elimina el bloque `codex`
  antes de pasar la configuración nativa `mcp_servers` a Codex. Omita el bloque para
  mantener el servidor proyectado para todos los agentes del servidor de aplicaciones de Codex con el
  comportamiento predeterminado de aprobación de MCP de Codex.
- Los entornos de ejecución MCP empaquetados y limitados a una sesión utilizan un TTL de inactividad integrado de 10 minutos.
  Las ejecuciones integradas puntuales solicitan la limpieza al finalizar la ejecución; el TTL actúa como respaldo para las sesiones de larga duración y las futuras entidades que realicen llamadas.
- Los cambios en `mcp.*` se aplican en caliente mediante la eliminación de los entornos de ejecución MCP de sesión almacenados en caché.
  El siguiente descubrimiento o uso de herramientas los vuelve a crear a partir de la nueva configuración, por lo que las entradas
  `mcp.servers` eliminadas se depuran inmediatamente en lugar de esperar al TTL de inactividad.
- El descubrimiento en tiempo de ejecución también respeta las notificaciones de cambios en la lista de herramientas MCP mediante la eliminación
  del catálogo almacenado en caché para esa sesión. Los servidores que anuncian recursos o
  instrucciones obtienen herramientas auxiliares para enumerar y leer recursos, así como para enumerar y recuperar
  instrucciones. Los fallos repetidos en las llamadas a herramientas ponen en pausa brevemente el servidor afectado antes de
  intentar otra llamada.

Consulte [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[Backends de la CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para conocer el comportamiento en tiempo de ejecución.

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

- `allowBundled`: lista opcional de Skills empaquetadas permitidas únicamente (no afecta a las Skills gestionadas o del espacio de trabajo).
- `load.extraDirs`: raíces adicionales de Skills compartidas (precedencia mínima).
- `load.allowSymlinkTargets`: raíces de destino reales de confianza en las que pueden
  resolverse los enlaces simbólicos de Skills cuando el enlace se encuentra fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que la aplicación de Skill Workshop escriba
  a través de destinos de enlaces simbólicos que ya sean de confianza (valor predeterminado: false).
- `install.preferBrew`: cuando es true, da preferencia a los instaladores de Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instaladores.
- `install.nodeManager`: preferencia del instalador de Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que los clientes de Gateway `operator.admin` de confianza
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (valor predeterminado: false). Esto solo habilita la ruta de archivos cargados; las instalaciones
  normales de ClawHub no lo requieren.
- `entries.<skillKey>.enabled: false` desactiva una Skill aunque esté empaquetada o instalada.
- `entries.<skillKey>.apiKey`: opción práctica para las Skills que declaran una variable de entorno principal (cadena de texto sin formato u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitan el descubrimiento de Skills y las instrucciones de Skills visibles para el modelo.
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
- La detección admite plugins nativos de OpenClaw, además de bundles compatibles de Codex y Claude, incluidos los bundles de Claude sin manifiesto con el diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins enumerados). Prevalece `deny`.
- `plugins.entries.<id>.apiKey`: campo práctico para la clave de API en el nivel del Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito del Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea los hooks que modifican el prompt, como `before_prompt_build`. Se aplica a los hooks de plugins nativos y a los directorios de hooks compatibles proporcionados por bundles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins de confianza no incluidos en el bundle pueden leer el contenido sin procesar de las conversaciones desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para que solicite anulaciones de `provider` y `model` por ejecución para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones de subagentes de confianza. Use `"*"` solo cuando se quiera permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este Plugin para que solicite anulaciones de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones de finalización de LLM de plugins de confianza. Use `"*"` solo cuando se quiera permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este Plugin para ejecutar `api.runtime.llm.complete` con un id de agente no predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado por el esquema del Plugin nativo de OpenClaw cuando esté disponible).
- La configuración de cuenta y tiempo de ejecución del Plugin de canal se encuentra bajo `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del Plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del Plugin del arnés de Codex

El Plugin `codex` incluido en el bundle gestiona la configuración del arnés nativo del servidor de aplicaciones de Codex bajo
`plugins.entries.codex.config`. Consulte la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference) para conocer toda la superficie de configuración
y [Arnés de Codex](/es/plugins/codex-harness) para conocer el modelo de tiempo de ejecución.

`codexPlugins` solo se aplica a las sesiones que seleccionan el arnés nativo de Codex.
No habilita plugins de Codex para ejecuciones de proveedores de OpenClaw, enlaces de
conversaciones ACP ni ningún arnés que no sea de Codex.

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
  plugins y aplicaciones de Codex para el arnés de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expone todas las
  aplicaciones actualmente accesibles conectadas a la cuenta de Codex autenticada en
  cada hilo nativo nuevo de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para las solicitudes de interacción de aplicaciones de plugins configuradas.
  Use `true` para aceptar esquemas seguros de aprobación de Codex sin solicitar confirmación, `false`
  para rechazarlos, `"auto"` para encaminar las aprobaciones requeridas por Codex mediante las
  aprobaciones de plugins de OpenClaw o `"ask"` para solicitar confirmación para cada acción
  destructiva o de escritura de un Plugin sin aprobación persistente. El modo `"ask"` borra las
  anulaciones persistentes de aprobación por herramienta de Codex para la aplicación afectada y selecciona al revisor humano
  de aprobaciones para esa aplicación antes de que se inicie el hilo de Codex.
  Valor predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una
  entrada de Plugin configurada cuando el valor global `codexPlugins.enabled` también es verdadero.
  Valor predeterminado: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace, requerida junto con `pluginName` para cada entrada
  resuelta. Admite `"openai-curated"` y `"workspace-directory"`. Se ignoran las entradas
  que carezcan de cualquiera de los campos de identidad.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad estable
  del Plugin de Codex, requerida junto con `marketplaceName`. Una entrada
  `workspace-directory` debe usar el `summary.id` exacto y calificado por el marketplace
  que devuelve `plugin/list`, por ejemplo,
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  anulación de acciones destructivas por Plugin. Si se omite, se utiliza el valor global
  `allow_destructive_actions`. El valor por Plugin acepta las mismas políticas
  `true`, `false`, `"auto"` o `"ask"`.

Cada aplicación de Plugin admitida que usa `"ask"` encamina las solicitudes de aprobación
de esa aplicación al revisor humano. Las demás aplicaciones y las aprobaciones de hilos que no pertenecen a aplicaciones conservan
su revisor configurado, por lo que las políticas mixtas de plugins no heredan el comportamiento de `"ask"`.

`codexPlugins.enabled` es la directiva de habilitación global. Las entradas explícitas de plugins
escritas por la migración son el conjunto persistente de elegibilidad para instalaciones y reparaciones
seleccionadas. Las entradas `workspace-directory` configuradas manualmente ya deben
estar instaladas y habilitadas, y sus aplicaciones propias deben ser accesibles; OpenClaw
no las instala ni las autentica. Si Codex rechaza la solicitud explícita del catálogo del espacio de trabajo,
las entradas habilitadas del espacio de trabajo fallan de forma cerrada con
`marketplace_missing`, mientras que las entradas seleccionadas del catálogo predeterminado permanecen
disponibles. `plugins["*"]` no es compatible, no existe ningún interruptor `install` y
los valores locales `marketplacePath` no son intencionadamente campos de configuración porque son
específicos del host. Consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins) para conocer los requisitos de versión y
preparación del servidor de aplicaciones.

Las comprobaciones de preparación de `app/list` se almacenan en caché durante una hora y se actualizan
de forma asíncrona cuando quedan obsoletas. La configuración de aplicaciones del hilo de Codex se calcula al establecer
la sesión del arnés de Codex, no en cada turno; use `/new`, `/reset` o reinicie el Gateway
después de cambiar la configuración nativa de plugins.

`codexPlugins.allow_all_plugins` incluye una instantánea de todas las aplicaciones de cuenta
accesibles en cada hilo nativo nuevo de Codex. No instala plugins ni aplicaciones, y
las aplicaciones inaccesibles permanecen excluidas. Las aplicaciones de cuenta usan la política global
`codexPlugins.allow_destructive_actions`. Las entradas explícitas de plugins tienen
prioridad cuando la misma aplicación está presente en ambas rutas. Si no se puede leer `app/list`,
la exposición de toda la cuenta falla de forma cerrada.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web Firecrawl.
  - `apiKey`: clave de API de Firecrawl opcional para límites superiores (acepta SecretRef). Recurre a la variable de entorno `plugins.entries.firecrawl.config.webSearch.apiKey` o `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; las anulaciones autoalojadas deben apuntar a endpoints privados o internos).
  - `onlyMainContent`: extrae únicamente el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de la caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (p. ej., `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memoria. Consulte [Dreaming](/es/concepts/dreaming) para conocer las fases y los umbrales.
  - `enabled`: interruptor principal de Dreaming (valor predeterminado: `false`).
  - `frequency`: cadencia de Cron para cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: anulación opcional del modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínelo con `allowedModels` para restringir los destinos. Los errores de modelo no disponible vuelven a intentarse una vez con el modelo predeterminado de la sesión; los fallos de confianza o de la lista de permitidos no recurren silenciosamente a otro modelo.
  - La política de fases y los umbrales son detalles de implementación (no claves de configuración visibles para el usuario).
- La configuración completa de memoria se encuentra en la [referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins habilitados de bundles de Claude también pueden aportar valores predeterminados integrados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración saneada del agente, no como parches de configuración sin procesar de OpenClaw.
- `plugins.slots.memory`: selecciona el id del Plugin de memoria activo o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: selecciona el id del Plugin del motor de contexto activo; el valor predeterminado es `"legacy"`, a menos que se instale y seleccione otro motor.

Consulte [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria inferida de seguimiento: OpenClaw puede detectar seguimientos a partir de los turnos de conversación y entregarlos mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción oculta mediante LLM, el almacenamiento y la entrega por Heartbeat de los compromisos inferidos de seguimiento. Valor predeterminado: `false`.
- `commitments.maxPerDay`: número máximo de compromisos inferidos de seguimiento entregados por sesión de agente en un día móvil. Valor predeterminado: `3`.

Consulte [Compromisos inferidos](/es/concepts/commitments).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilitar solo para acceso de confianza a redes privadas
      // allowPrivateNetwork: true, // alias heredado
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
  rastreadas del agente principal tras un período de inactividad o cuando una sesión supera
  su límite. El rastreo se aplica únicamente a las pestañas creadas por la herramienta de navegador
  `action: "open"`; las pestañas abiertas por el usuario o cuya propiedad se desconoce
  nunca se adoptan. Deshabilitar `tabCleanup` no deshabilita la limpieza explícita del ciclo de vida de las sesiones.
- Las aperturas locales del host con un destino CDP nativo estable y una identidad
  de navegador se almacenan en el estado SQLite compartido y siguen siendo aptas tras los
  reinicios del Gateway para `/new` y la limpieza del ciclo de vida de las sesiones.
  Los destinos CDP nativos expuestos a herramientas también siguen siendo aptos para la limpieza
  por inactividad y por límite tras un reinicio. Chrome MCP utiliza identificadores de destino
  locales al proceso, por lo que los registros inactivos de sesiones existentes esperan la
  limpieza del ciclo de vida en lugar de arriesgarse a un barrido por inactividad sobre actividad
  posterior al reinicio que no pueda atribuirse. OpenClaw verifica el perfil y la instancia
  del navegador antes de cerrarlos. La conexión automática de Chrome MCP, la ausencia de una
  identidad de navegador `/json/version` y los destinos nativos sin resolver permanecen
  totalmente locales al proceso, por lo que no se cierran automáticamente tras un reinicio.
  Las pestañas antiguas sin rastrear requieren cierre manual. Los errores transitorios permanecen
  pendientes para un reintento posterior. Consulte
  [Propiedad de la limpieza de pestañas](/es/tools/browser#tab-cleanup-ownership).
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se define, por lo que la navegación del navegador permanece estricta de forma predeterminada.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` únicamente cuando confíe deliberadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad y detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, utilice `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para establecer excepciones explícitas.
- Los perfiles remotos solo permiten adjuntarse a ellos (inicio, detención y restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Utilice HTTP(S) cuando quiera que OpenClaw detecte `/json/version`; utilice WS(S)
  cuando el proveedor proporcione una URL WebSocket directa de DevTools.
- Si se puede acceder a un servicio CDP administrado externamente mediante loopback,
  defina el `attachOnly: true` de ese perfil; de lo contrario, OpenClaw tratará el puerto
  loopback como un perfil de navegador local administrado y podría informar de errores de
  propiedad del puerto local.
- Los perfiles `existing-session` utilizan Chrome MCP en lugar de CDP y pueden adjuntarse
  en el host seleccionado o mediante un Node de navegador conectado.
- Los perfiles `existing-session` pueden definir `userDataDir` para seleccionar un
  perfil específico de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden definir `cdpUrl` cuando Chrome ya se esté ejecutando
  detrás de un endpoint de detección HTTP(S) de DevTools o un endpoint WS(S) directo. En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de utilizar la conexión automática;
  `userDataDir` se ignora en los argumentos de inicio de Chrome MCP.
- Los perfiles `existing-session` mantienen las limitaciones actuales de las rutas de Chrome MCP:
  acciones basadas en instantáneas y referencias en lugar de seleccionar mediante selectores CSS,
  enlaces de carga de un solo archivo, sin anulaciones del tiempo de espera de los cuadros de diálogo,
  sin `wait --load networkidle` y sin `responsebody`, exportación a PDF, interceptación de descargas
  ni acciones por lotes.
- Los perfiles locales administrados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; defina
  `cdpUrl` explícitamente solo para perfiles CDP remotos o para adjuntar un endpoint
  de una sesión existente.
- Los perfiles locales administrados pueden definir `executablePath` para anular el valor global
  `browser.executablePath` en ese perfil. Utilice esta opción para ejecutar un perfil en
  Chrome y otro en Brave.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Tanto `browser.executablePath` como `browser.profiles.<name>.executablePath`
  aceptan `~` y `~/...` para el directorio principal del sistema operativo antes de iniciar Chromium.
  También se expande la virgulilla en el valor `userDataDir` de cada perfil `existing-session`.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, valor predeterminado `18791`).
- `extraArgs` agrega indicadores de inicio adicionales al iniciar Chromium localmente (por ejemplo,
  `--disable-gpu`, dimensiones de la ventana o indicadores de depuración).

---

## Interfaz de usuario

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto breve, URL de imagen o URI de datos
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // Conserva los comentarios después de las ejecuciones en la interfaz de control; no los envía a los canales
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; omítalo para utilizar el modo de cola del servidor
    },
  },
}
```

- `seamColor`: color de énfasis para los elementos visuales de la interfaz de usuario de la aplicación nativa (tinte de la burbuja del modo de conversación, etc.).
- `assistant`: anulación de la identidad de la interfaz de control. Utiliza como alternativa la identidad del agente activo.
- `prefs`: preferencias de visualización del operador. Esta es la ubicación canónica para que los agentes
  puedan modificarlas mediante la puerta de aprobación y todos los clientes de la interfaz de control
  permanezcan sincronizados; los navegadores replican los valores en el almacenamiento local para
  un inicio instantáneo y conservan una copia local del dispositivo cuando no pueden escribir en la
  configuración (ámbito de visualización, sin conexión).
  `chatPersistCommentary` tiene como valor predeterminado `true`. Establecerlo en `false` mantiene visibles
  los comentarios en tiempo real durante una ejecución, pero los elimina al finalizar e impide que
  nuevos comentarios de Codex entren en la réplica duradera de la transcripción. La entrega a los canales
  de mensajería permanece separada y sin cambios.
  Los clientes conectados aplican en tiempo real los cambios del servidor: el Gateway difunde un evento
  `config.changed` que contiene únicamente un hash después de cada escritura persistente de la configuración,
  y los clientes actualizan su instantánea (se omite mientras un borrador local de configuración tenga
  cambios sin guardar). Los clientes que se vuelven a conectar se reconcilian al conectarse.

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
      // toolTitles: false, // títulos de propósito generados por IA opcionales para las llamadas a herramientas (consume tokens del modelo auxiliar)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // peligroso: permite URL http(s) externas absolutas para contenido insertado
      // chatMessageMaxWidth: "min(1280px, 82%)", // ancho máximo opcional de la transcripción centrada del chat
      // allowedOrigins: ["https://control.example.com"], // obligatorio para una interfaz de control que no use loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // peligroso modo alternativo de origen basado en el encabezado Host
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
    // Opcional. Valor predeterminado: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Sin definir/deshabilitado de forma predeterminada.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Aprobación automática verificada por SSH. Valor predeterminado: habilitado (true).
        // Establezca false para deshabilitar únicamente la verificación SSH; esto no afecta a
        // autoApproveCidrs indicado anteriormente. Para emparejar nodos solo manualmente, establezca false Y
        // deje autoApproveCidrs sin definir. Pase un objeto para ajustar: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
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

- `mode`: `local` (ejecutar el Gateway) o `remote` (conectarse al Gateway remoto). El Gateway se niega a iniciarse a menos que `local`.
- `port`: puerto único multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (IPv4 de Tailscale cuando esté disponible; de lo contrario, loopback) o `custom` (una dirección IPv4). Una dirección `tailnet` resuelta y cualquier dirección `custom` distinta de `127.0.0.1` o `0.0.0.0` requieren `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los listeners no puede enlazarse. La exposición fuera de loopback sigue limitada a la interfaz seleccionada.
- **Alias de enlace heredados**: use valores de modo de enlace en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el enlace `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con la red puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que no se puede acceder al Gateway. Use `--network host` o establezca `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: obligatoria de forma predeterminada. Los enlaces fuera de loopback requieren autenticación del Gateway. En la práctica, esto implica un token o una contraseña compartidos, o un proxy inverso con reconocimiento de identidad y `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` (incluidas las SecretRefs), establezca `gateway.auth.mode` explícitamente en `token` o `password`. El inicio y los flujos de instalación o reparación del servicio fallan cuando ambos están configurados y no se ha establecido el modo.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úselo solo para configuraciones locales de loopback de confianza; no se ofrece intencionadamente en las indicaciones de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador o usuario a un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)). De forma predeterminada, este modo espera un origen de proxy **fuera de loopback**; los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como alternativa local directa; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo de proxy de confianza.
- `gateway.auth.allowTailscale`: cuando `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de la interfaz de control/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación mediante encabezados de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token presupone que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (el secreto compartido y el token de dispositivo se controlan de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de registrar el fallo. Por lo tanto, los intentos incorrectos simultáneos del mismo cliente pueden activar el limitador en la segunda solicitud, en lugar de que ambos compitan y pasen como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establezca `false` cuando se desee intencionadamente limitar también la tasa del tráfico de localhost (para configuraciones de prueba o implementaciones de proxy estrictas).
- Los intentos de autenticación WS originados en el navegador siempre se limitan, con la exención de loopback desactivada (defensa en profundidad contra ataques de fuerza bruta a localhost desde el navegador).
- En loopback, esos bloqueos originados en el navegador se aíslan por cada valor normalizado de `Origin`, por lo que los fallos repetidos desde un origen de localhost no bloquean automáticamente un origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, enlace de loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre opcional del servicio Tailscale para el modo Serve, como
  `svc:openclaw`. Cuando se establece, OpenClaw lo pasa a `tailscale serve
--service` para que la interfaz de control pueda exponerse mediante un servicio con nombre en lugar
  del nombre de host del dispositivo. El valor debe usar el formato de nombre de servicio `svc:<dns-label>`
  de Tailscale; el inicio muestra la URL derivada del servicio.
- `tailscale.preserveFunnel`: cuando `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve durante el inicio y lo omite
  si una ruta de Funnel configurada externamente ya abarca el puerto del Gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: lista explícita de orígenes permitidos para las conexiones WebSocket del Gateway. Es obligatoria para orígenes públicos del navegador fuera de loopback. Las cargas privadas de la interfaz de usuario del mismo origen en LAN/Tailnet procedentes de loopback, RFC1918/local de enlace, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
- `controlUi.toolTitles`: habilita los títulos de finalidad generados por IA para las llamadas a herramientas en el chat de la interfaz de control. Valor predeterminado: `false` (la representación de herramientas sigue siendo totalmente determinista, sin llamadas al modelo en segundo plano). Cuando se habilita, el método `chat.toolTitles` asigna etiquetas a las llamadas complejas mediante el enrutamiento estándar del modelo auxiliar: el `utilityModel` del agente (una decisión del operador que puede enviar argumentos acotados de las herramientas al proveedor elegido, como cualquier tarea auxiliar) o el modelo pequeño predeterminado declarado por el proveedor de la sesión (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); además, almacena los resultados en caché en la base de datos de estado por agente para que las visualizaciones repetidas nunca vuelvan a generar cargos. `utilityModel: \"\"` desactiva los títulos como cualquier otra tarea auxiliar; los títulos nunca recurren al modelo principal.
- `controlUi.chatMessageMaxWidth`: anchura máxima opcional para la transcripción centrada del chat de la interfaz de control. Acepta valores restringidos de anchura CSS, como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita la alternativa de origen basada en el encabezado Host para implementaciones que dependen intencionadamente de una política de origen basada en dicho encabezado.
- `terminal.enabled`: habilita el terminal de operador con ámbito de administrador. Valor predeterminado: `false`. El terminal inicia una PTY del host en el espacio de trabajo del agente seleccionado, hereda el entorno del proceso del Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítelo solo en implementaciones con operadores de confianza; cambiarlo reinicia el Gateway y actualiza la política de seguridad de contenido de la interfaz de control.
- `terminal.shell`: ejecutable de shell opcional. Cuando no se establece, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: tiempo durante el que una sesión de terminal sobrevive tras interrumpirse su conexión (recarga de página, suspensión del portátil), de modo que puede volver a adjuntarse mediante `terminal.attach` y reproducir su salida reciente. Valor predeterminado: `300`. Establezca `0` para finalizar las sesiones en cuanto se interrumpa su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, por lo que conviene reducir este valor en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` en hosts públicos; `ws://` sin cifrar solo se acepta para loopback, LAN, local de enlace, `.local`, `.ts.net` y hosts CGNAT de Tailscale.
- `remote.remotePort`: puerto del Gateway en el host SSH remoto. El valor predeterminado es `18789`; use esta opción cuando el puerto del túnel local sea distinto del puerto del Gateway remoto.
- `remote.sshHostKeyPolicy`: política de claves de host para túneles SSH de macOS. `strict` es el valor predeterminado y requiere una clave que ya sea de confianza. `openssh` habilita explícitamente la configuración efectiva de OpenSSH para alias administrados; revise la configuración SSH correspondiente del usuario y del sistema antes de usarlo. La aplicación de macOS y `configure-remote` restablecen esta política a `strict` al cambiar de destino, a menos que se vuelva a habilitar explícitamente.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. No configuran por sí mismos la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relé APNs externo que se usa después de que las compilaciones de iOS respaldadas por el relé publiquen registros en el Gateway. Las compilaciones públicas de App Store usan el relé alojado de OpenClaw. Las URL de relé personalizadas deben corresponder a una ruta de compilación o implementación de iOS deliberadamente independiente cuya URL de relé apunte a dicho relé.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del Gateway al relé, en milisegundos. El valor predeterminado es `10000`.
- Los registros respaldados por el relé se delegan a una identidad específica del Gateway. La aplicación de iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relé y reenvía al Gateway una concesión de envío limitada al registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales mediante variables de entorno para la configuración del relé anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: mecanismo de escape exclusivo para desarrollo que permite URL HTTP de relé en loopback. Las URL de relé de producción deben seguir usando HTTPS.
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: anulación opcional mediante variable de entorno del tiempo de espera integrado para el protocolo de enlace WebSocket del Gateway previo a la autenticación.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando se establece, tiene precedencia sobre la anulación a nivel de canal.
- Las rutas de llamadas del Gateway local solo pueden usar `gateway.remote.*` como alternativa cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que una alternativa remota oculte el fallo).
- `trustedProxies`: direcciones IP de proxies inversos que terminan TLS o insertan encabezados reenviados del cliente. Incluya únicamente proxies bajo su control. Las entradas de loopback siguen siendo válidas para configuraciones de proxy o detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes de loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. El valor predeterminado es `false` para aplicar un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidos para aprobar automáticamente el primer emparejamiento de un dispositivo Node sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador, navegador, interfaz de control o WebChat, ni las actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.pairing.sshVerify`: aprobación automática verificada mediante SSH para el primer emparejamiento de un dispositivo Node (valor predeterminado: habilitada). El Gateway se conecta mediante SSH al host que solicita el emparejamiento (BatchMode, claves de host estrictas) y solo lo aprueba cuando la clave del dispositivo coincide exactamente con `openclaw node identity`. Se aplica el mismo umbral de elegibilidad que para `autoApproveCidrs`; las comprobaciones se limitan a direcciones de origen privadas/CGNAT, a menos que `cidrs` las anule. Establezca `false` para deshabilitarlo o `{ user, identity, timeoutMs, cidrs }` para ajustarlo. Consulte [Emparejamiento de Node](/es/gateway/pairing#ssh-verified-device-auto-approval-default).
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: configuración global de permisos y denegaciones para los comandos de Node declarados después del emparejamiento y de evaluar la lista de permitidos de la plataforma. Use `allowCommands` para habilitar comandos peligrosos de Node como `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` y `sms.send`; `denyCommands` elimina un comando incluso si, de otro modo, un valor predeterminado de la plataforma o un permiso explícito lo incluyeran. El permiso de Salud de iOS, el permiso de SMS de Android y la autorización de comandos del Gateway son independientes. Después de que un Node cambie su lista de comandos declarados, rechace y vuelva a aprobar el emparejamiento de ese dispositivo para que el Gateway almacene la instantánea actualizada de los comandos.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para `POST /tools/invoke` HTTP (amplía la lista de denegación predeterminada).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada para
  los solicitantes propietarios/administradores. Esto no eleva a los solicitantes `operator.write`
  con identidad asociada al acceso de propietario/administrador; `cron`, `gateway` y `nodes` siguen
  sin estar disponibles para los solicitantes que no sean propietarios, aunque estén incluidos en la lista de permitidos.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administración: desactivado de forma predeterminada como el plugin `admin-http-rpc`. Active el plugin para registrar `POST /api/v1/admin/rpc`. Consulte [RPC HTTP de administración](/es/plugins/admin-http-rpc).
- Chat Completions: desactivado de forma predeterminada. Actívelo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Protección de la entrada de URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se consideran no configuradas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    o `gateway.http.endpoints.responses.images.allowUrl=false`, o ambos, para desactivar la obtención de URLs.
- Encabezado opcional de protección de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúrelo solo para orígenes HTTPS bajo su control; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: activa la terminación TLS en el proceso de escucha del gateway (HTTPS/WSS) (valor predeterminado: `false`).
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
  - `"hot"`: aplica los cambios en el proceso sin reiniciarlo.
  - `"hybrid"` (valor predeterminado): intenta primero la recarga en caliente; si es necesario, recurre al reinicio.
- `debounceMs`: intervalo de supresión de rebotes en ms antes de aplicar los cambios de configuración (entero no negativo; valor predeterminado: `300`).
- `deferralTimeoutMs`: tiempo máximo opcional en ms que se espera a que finalicen las operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítalo para usar la espera limitada predeterminada (`300000`); establezca `0` para esperar indefinidamente y registrar periódicamente advertencias de que aún hay operaciones pendientes.

---

## Entornos de trabajadores en la nube

Los trabajadores en la nube son opcionales. Si `cloudWorkers` no está presente o `profiles` está vacío, OpenClaw no acepta la creación de nuevos trabajadores. Los registros duraderos creados anteriormente siguen conciliándose y permanecen visibles; la proyección existente del gateway/Node no cambia.

Cada proveedor de trabajadores debe devolver una `hostKey` SSH desde una salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El arranque escribe esa clave en un archivo `known_hosts` aislado, usa `StrictHostKeyChecking=yes` y falla antes de abrir una conexión cuando el proveedor la omite. No existe ningún mecanismo alternativo de confianza en el primer uso.

El túnel se configura bajo demanda, no como parte del aprovisionamiento. Al iniciarse, el gateway reenvía de forma inversa un socket Unix local del trabajador a su endpoint WebSocket de bucle invertido. El socket reside en un directorio remoto asignado aleatoriamente y accesible solo por el propietario; a diferencia de un puerto TCP de bucle invertido, otras cuentas de un trabajador multiusuario no pueden acceder a él y no puede entrar en conflicto con el puerto de otro entorno. Los mensajes de mantenimiento de conexión SSH y el retroceso de reconexión limitado solo se ejecutan mientras el propietario del túnel siga siendo el actual. Al detener el túnel, se bloquean las reconexiones antes de cerrar el proceso SSH.

El tráfico de control y la transferencia del espacio de trabajo usan conexiones SSH separadas. Ambas reutilizan la misma identidad resuelta y el mismo archivo `known_hosts` fijado y aislado, pero la transferencia del espacio de trabajo no comparte la multiplexación de conexiones SSH con el túnel de larga duración, por lo que rsync no puede bloquear el tráfico de control.

### Perfil de Crabbox

El proveedor `crabbox` incluido aprovisiona una concesión compatible con SSH mediante la CLI local de Crabbox. El `settings.provider` interno selecciona el backend de Crabbox; es independiente del id. de proveedor externo de OpenClaw.

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
          // Ruta absoluta opcional. Valor predeterminado: ../crabbox/bin/crabbox adyacente y después PATH.
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
- `settings.ttl` y `settings.idleTimeout` (obligatorios): cadenas positivas de duración de Go que se pasan a `--ttl` y `--idle-timeout`. Estos mecanismos de seguridad del proveedor son distintos de la política `lifetime` almacenada por OpenClaw que aparece a continuación.
- `settings.binary`: ruta absoluta opcional al ejecutable de Crabbox. Sin ella, OpenClaw comprueba primero el checkout adyacente de Crabbox, después las entradas ejecutables de `PATH` y, por último, invoca `crabbox` para que la ausencia de la CLI siga siendo un error visible del proveedor.

Las opciones de configuración desconocidas se rechazan. Las credenciales de Crabbox y la configuración de cuenta específica del backend siguen siendo responsabilidad de Crabbox; no las incluya en `settings`. OpenClaw solo invoca la CLI local y este plugin no realiza llamadas de red al proveedor. El aprovisionamiento siempre pasa `--keep=true`; OpenClaw controla el ciclo de vida externo y destruye la concesión con `crabbox stop`.

<Note>
  OpenClaw resuelve la ruta `sshKey` local de la concesión de Crabbox mediante el solucionador de secretos propiedad del proveedor y fija el `sshHostKey` autoritativo devuelto por `crabbox inspect --json`. La admisión en AWS también requiere `providerMetadata.instanceProfileAttached`. Instale Crabbox 0.38.1 o una versión posterior para este contrato cerrado de inspección.
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

- `profiles`: perfiles de trabajadores con nombre e identificadores no vacíos sin espacios en blanco al principio ni al final. Cada perfil selecciona un proveedor registrado por un plugin.
- `provider`: id. no vacío del proveedor de trabajadores. Los ejemplos usan el proveedor `crabbox` incluido y el proveedor `static-ssh` de QA Lab.
- `install`: método de instalación del trabajador. `"bundle"` (valor predeterminado) transfiere un paquete identificado por el hash del contenido de la compilación instalada del gateway y admite versiones publicadas, de desarrollo y no publicadas. `"npm"` es una optimización opcional para una versión empaquetada sin modificaciones; instala `openclaw@<exact gateway version>` desde el registro público de npm y nunca instala `latest`.
- Los plugins de proveedor incluidos se seleccionan automáticamente cuando están configurados, pero las desactivaciones explícitas y `plugins.allow` siguen aplicándose. Incluya el id. del proveedor (por ejemplo, `crabbox`) cuando haya una lista de permitidos configurada. Los plugins de proveedores externos también deben estar instalados y activados explícitamente.
- `settings`: JSON limitado propiedad del proveedor. El plugin seleccionado define y valida sus claves; use [objetos SecretRef](/es/gateway/secrets) para los valores que contengan secretos. El proveedor SSH estático requiere `host`, `user`, `hostKey` y `keyRef`; el valor predeterminado de `port` es `22`. `hostKey` debe ser una línea de clave pública de host OpenSSH (`algorithm base64`) obtenida del host conocido o de otro canal de confianza, sin prefijo de opciones.
- `lifetime.idleTimeoutMinutes`: minutos expresados como un entero positivo que se almacenan para la política posterior de recuperación por inactividad.
- `lifetime.maxLifetimeMinutes`: minutos expresados como un entero positivo que se almacenan para la política posterior del ciclo de vida.

El trabajador debe tener ya instalado un entorno de ejecución de Node compatible (22.22.3+, 24.15+ o 25.9+) con SQLite seguro frente al restablecimiento de WAL. El método opcional `"npm"` también requiere `npm` y acceso HTTPS saliente al registro público de npm. La configuración de cadenas de herramientas conectadas a la red es una política del proveedor; el arranque informa de un error accionable en lugar de instalar por sí mismo las cadenas de herramientas.

Esta base instala y verifica la compilación del gateway y proporciona el ciclo de vida de inicio y detención del túnel, pero no inicia la CLI general de OpenClaw. La entrada autocontenida del trabajador y el bucle se incorporarán en el siguiente hito de los trabajadores en la nube.

Cada registro duradero de entorno conserva las opciones de configuración validadas del proveedor, el método de instalación resuelto y la política de duración en una instantánea del perfil tomada en el momento de su creación. Cambiar o eliminar un perfil con nombre afecta a las nuevas creaciones; los registros existentes continúan conciliando su ciclo de vida con esa instantánea, siempre que el plugin propietario siga disponible.

Los valores de duración son solo datos en la primera versión de los trabajadores en la nube; la aplicación automática se incorporará con el trabajo posterior sobre el ciclo de vida. Los cambios de perfil requieren reiniciar el gateway.

<Warning>
  El proveedor `static-ssh` es un entorno de desarrollo de QA Lab basado en el árbol de fuentes y no se incluye en las distribuciones empaquetadas. Un trabajador que se ejecute en su host compartido puede leer datos no relacionados del host, por lo que no debe usarse este proveedor como límite de aislamiento de producción.
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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
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

- `hooks.enabled=true` requiere un valor `hooks.token` que no esté vacío.
- `hooks.token` debe ser distinto de la autenticación activa mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); al iniciarse, se registra una advertencia de seguridad no fatal cuando se detecta su reutilización.
- `openclaw security audit` señala la reutilización de la autenticación del hook/Gateway como un hallazgo crítico, incluida la autenticación mediante contraseña del Gateway proporcionada únicamente durante la auditoría (`--auth password --password <password>`). Ejecute `openclaw doctor --fix` para rotar un `hooks.token` persistido y reutilizado; después, actualice los emisores externos de hooks para que usen el nuevo token del hook.
- `hooks.path` no puede ser `/`; utilice una subruta específica, como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si una asignación o un preajuste utiliza un `sessionKey` basado en plantilla, establezca `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esta aceptación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` de la carga útil de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (valor predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores `sessionKey` de asignaciones generados mediante plantillas se consideran proporcionados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de la asignación">

- `match.path` coincide con la subruta posterior a `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen datos de la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan las rutas absolutas y el recorrido de directorios).
  - Mantenga `hooks.transformsDir` dentro de `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueva el módulo de transformación al directorio de transformaciones de hooks o elimine `hooks.transformsDir`.
- `agentId` dirige a un agente específico; los identificadores desconocidos recurren al agente predeterminado.
- `allowedAgentIds`: restringe el enrutamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agentes mediante hooks sin un `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los invocadores de `/hooks/agent` y las claves de sesión de asignaciones basadas en plantillas establezcan `sessionKey` (valor predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos de prefijos opcional para valores `sessionKey` explícitos (solicitud + asignación), p. ej., `["hook:"]`. Pasa a ser obligatoria cuando alguna asignación o preajuste utiliza un `sessionKey` basado en plantilla.
- `deliver: true` envía la respuesta final a un canal; el valor predeterminado de `channel` es `last`.
- `model` sustituye el LLM para esta ejecución del hook (debe estar permitido si se ha establecido el catálogo de modelos).

</Accordion>

### Integración con Gmail

- El preajuste integrado de Gmail utiliza `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Esta clave por mensaje aísla el contexto de la conversación, no las herramientas ni el acceso al espacio de trabajo. Sin una asignación personalizada que establezca `agentId`, el preajuste utiliza el agente predeterminado.
- Para bandejas de entrada que no sean de confianza, dirija Gmail a un agente lector específico y restrinja ese agente mediante la [zona protegida y la política de herramientas por agente](/es/tools/multi-agent-sandbox-tools). Si el lector debe notificar al agente principal, restrinja la transferencia mediante [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent). Consulte [Inyección de instrucciones](/es/gateway/security#prompt-injection) para conocer el modelo de amenazas y el nivel de modelo recomendados.
- Si mantiene ese enrutamiento por mensaje, establezca `hooks.allowRequestSessionKey: true` y restrinja `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo, `["hook:", "hook:gmail:"]`.
- Si necesita `hooks.allowRequestSessionKey: false`, sustituya el preajuste por un `sessionKey` estático en lugar del valor predeterminado basado en plantilla.

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

- El Gateway inicia automáticamente `gog gmail watch serve` durante el arranque cuando está configurado. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.
- No ejecute un `gog gmail watch serve` independiente junto con el Gateway.

---

## Host del plugin Canvas

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

- Sirve HTML/CSS/JS editables por el agente y A2UI mediante HTTP en el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantenga `gateway.bind: "loopback"` (valor predeterminado).
- Enlaces que no son de bucle invertido: las rutas de Canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), al igual que las demás superficies HTTP del Gateway.
- Las vistas web de Node normalmente no envían encabezados de autenticación; después de que un Node se empareja y se conecta, el Gateway anuncia URL de capacidades con ámbito de Node para acceder a Canvas/A2UI.
- Las URL de capacidades están vinculadas a la sesión WS activa del Node y caducan rápidamente. No se utiliza un mecanismo alternativo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Desactive la recarga en vivo para directorios grandes o si se producen errores `EMFILE`.

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

- `minimal` (valor predeterminado): omite `cliPath` y `sshPort` de los registros TXT.
- `full`: incluye `cliPath` y `sshPort`; la difusión mediante multidifusión en la LAN aún requiere que el plugin `bonjour` incluido esté habilitado.
- `off`: suprime la difusión mediante multidifusión en la LAN sin cambiar la habilitación del plugin.
- El plugin `bonjour` incluido se inicia automáticamente en hosts macOS y requiere activación explícita en Linux, Windows y despliegues del Gateway en contenedores.
- El nombre de host utiliza de forma predeterminada el nombre de host del sistema cuando este es una etiqueta DNS válida y recurre a `openclaw` en caso contrario. Sustitúyalo mediante `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` desactiva por completo la difusión mDNS, con prioridad sobre `discovery.mdns.mode`.

### Área extensa (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD de unidifusión bajo `~/.openclaw/dns/`. Para la detección entre redes, combínela con un servidor DNS (se recomienda CoreDNS) y DNS dividido de Tailscale.

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
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sustituye las variables existentes).
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

- Solo se buscan nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables ausentes o vacías provocan un error al cargar la configuración.
- Use `$${VAR}` como secuencia de escape para obtener un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores de texto sin formato siguen funcionando.

### `SecretRef`

Utilice una de estas estructuras de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de identificador de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Identificador de `source: "file"`: puntero JSON absoluto (por ejemplo, `"/providers/openai/apiKey"`)
- Patrón de identificador de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores `secret#json_key` al estilo de AWS)
- Los identificadores de `source: "exec"` no deben contener los segmentos de ruta delimitados por barras `.` ni `..` (por ejemplo, se rechaza `a/../b`)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas de credenciales `openclaw.json` compatibles.
- Las referencias de `auth-profiles.json` se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.

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
- El proveedor `exec` requiere una ruta `command` absoluta y utiliza cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos que sean enlaces simbólicos. Establezca `allowSymlinkCommand: true` para permitir rutas con enlaces simbólicos mientras se valida la ruta del destino resuelto.
- Si se configura `trustedDirs`, la comprobación del directorio de confianza se aplica a la ruta del destino resuelto.
- El entorno secundario de `exec` es mínimo de forma predeterminada; pase explícitamente las variables necesarias mediante `passEnv`.
- Las referencias a secretos se resuelven durante la activación en una instantánea en memoria; después, las rutas de solicitudes solo leen esa instantánea.
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
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para los modos de credenciales estáticas.
- Los mapas planos heredados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no constituyen un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe como perfiles canónicos de clave de API de `provider:default` con una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfiles de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de tiempo de ejecución proceden de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se eliminan al detectarse.
- Importaciones heredadas de OAuth desde `~/.openclaw/credentials/oauth.json`.
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

El Gateway registra eventos de auditoría **solo de metadatos** para las ejecuciones de agentes y las
acciones de herramientas en la base de datos de estado compartida. Los metadatos del ciclo de vida de los mensajes son una
opción independiente que debe habilitarse. El registro almacena la identidad, los tiempos, los nombres de herramientas y los
resultados normalizados, pero nunca los prompts, el contenido de los mensajes, los argumentos de herramientas, los resultados ni el texto
de error sin procesar. Las filas de mensajes no almacenan identificadores sin procesar de cuentas de plataforma, conversaciones,
mensajes ni destinos. Las claves de sesión de ejecuciones/herramientas permanecen disponibles para la correlación
y pueden contener por sí mismas identificadores de cuentas de plataforma o interlocutores. Los registros
caducan después de 30 días y el registro tiene un límite de 100,000 filas. Consúltelos con
[`openclaw audit`](/es/cli/audit) o mediante la RPC del Gateway
[`audit.activity.list`](/es/gateway/protocol#audit-ledger-rpc). Consulte
[Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos completo, la semántica de privacidad
y los límites de cobertura.

- `enabled`: registra nuevos eventos de auditoría (valor predeterminado: `true`). El registro está activado de forma
  predeterminada porque un rastro de auditoría habilitado solo después de un incidente no puede explicar
  el incidente. Establecer `false` detiene la inserción de nuevos eventos después de reiniciar el Gateway;
  los registros existentes siguen siendo legibles hasta que caducan. Volver a activarlo reanuda
  el registro desde ese punto; el intervalo no se rellena de forma retroactiva.
- `messages`: ámbito de los metadatos de mensajes (valor predeterminado: `"off"`). `"direct"` registra
  únicamente las conversaciones directas conocidas. `"all"` también registra grupos, canales y
  tipos de conversación desconocidos. Ambos modos siguen sin almacenar contenido y sustituyen los
  identificadores sin procesar por seudónimos con clave locales a la instalación cuando la correlación está
  disponible. Estos sirven como ayudas para la correlación, no como anonimización; la base de datos de estado
  almacena la clave de derivación, pero las exportaciones de RPC y CLI no la incluyen.

El Gateway en ejecución captura `audit.enabled` y `audit.messages` al iniciarse;
reinícielo después de cambiar cualquiera de estos ajustes. Actualmente, la cobertura de mensajes incluye
los mensajes entrantes aceptados que llegan al despacho central y una fila terminal por cada
carga útil lógica original de respuesta saliente que llega a la entrega duradera compartida.
Las rutas locales de Plugin y de envío directo que omiten esos límites compartidos aún no
están cubiertas. El escritor en segundo plano con capacidad limitada funciona con el mejor esfuerzo
y no constituye un archivo de cumplimiento sin pérdidas.

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
- Establezca `logging.file` para utilizar una ruta estable.
- `consoleLevel` aumenta a `debug` cuando `--verbose`.
- `maxFileBytes`: tamaño máximo en bytes del archivo de registro activo antes de la rotación (entero positivo; valor predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento con el mejor esfuerzo para la salida de consola, los registros de archivos, los registros OTLP y el texto persistente de las transcripciones de sesión. `redactSensitive: "off"` solo desactiva esta política general de registros/transcripciones; las superficies de seguridad de la interfaz de usuario, herramientas y diagnósticos siguen ocultando los secretos antes de emitirlos.

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
- `otel.enabled`: habilita el pipeline de exportación de OpenTelemetry (valor predeterminado: `false`). Para conocer la configuración completa, el catálogo de señales y el modelo de privacidad, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del recopilador para la exportación de OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de cada señal. Cuando se establecen, sustituyen a `otel.endpoint` solo para esa señal.
- `otel.protocol`: `"http/protobuf"` (valor predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con las solicitudes de exportación de OTel.
- `otel.serviceName`: nombre del servicio para los atributos de recursos.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (valor predeterminado), `"stdout"` para un objeto JSON por línea de stdout, o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas de `0` a `1`.
- `otel.flushIntervalMs`: intervalo de vaciado periódico de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para los atributos de intervalos de OTEL. Está desactivada de forma predeterminada. El valor booleano `true` captura contenido de mensajes/herramientas que no pertenece al sistema; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruptor de entorno para la forma más reciente y experimental de los intervalos de inferencia de GenAI, incluidos los nombres de intervalo `{gen_ai.operation.name} {gen_ai.request.model}`, el tipo de intervalo `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. De forma predeterminada, los intervalos conservan `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas de GenAI utilizan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya han registrado un SDK global de OpenTelemetry. En ese caso, OpenClaw omite el inicio y el cierre del SDK propiedad del Plugin, pero mantiene activos los receptores de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoints específicos de cada señal que se utilizan cuando no se ha establecido la clave de configuración correspondiente.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones integradas (valor predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para el archivo JSONL de trazas de caché (valor predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de las trazas de caché (todos tienen como valor predeterminado `true`).

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

- `channel`: canal de publicación: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. Extended-stable solo está disponible para paquetes: los comandos en primer plano administran la instalación, mientras que el Gateway puede emitir avisos de actualización de solo lectura.
- `checkOnStart`: comprueba si hay actualizaciones de npm cuando se inicia el Gateway (valor predeterminado: `true`). Las selecciones almacenadas de extended-stable utilizan el mismo aviso de solo lectura y el mismo intervalo de avisos de 24 horas.
- `auto.enabled`: habilita la actualización automática en segundo plano para las instalaciones de paquetes stable y beta (valor predeterminado: `false`). Extended-stable nunca se aplica automáticamente.

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

- `enabled`: control global de la función ACP (valor predeterminado: `true`; establezca `false` para ocultar las opciones de despacho y generación de ACP).
- `dispatch.enabled`: control independiente para el despacho de turnos de sesiones ACP (valor predeterminado: `true`). Establezca `false` para mantener disponibles los comandos de ACP mientras se bloquea la ejecución.
- `backend`: identificador predeterminado del backend de tiempo de ejecución de ACP (debe coincidir con un Plugin de tiempo de ejecución de ACP registrado).
  Instale primero el Plugin del backend y, si se establece `plugins.allow`, incluya el identificador del Plugin del backend (por ejemplo, `acpx`) o el backend de ACP no se cargará.
- `fallbacks`: lista ordenada de identificadores de backends de ACP alternativos que se prueban cuando el backend principal falla pronto con un error aparentemente transitorio (no disponible, límite de frecuencia alcanzado, cuota agotada o sobrecarga) antes de producir alguna salida. Cada entrada debe coincidir con el backend de un Plugin de tiempo de ejecución de ACP registrado.
- `defaultAgent`: identificador del agente de destino alternativo de ACP cuando las generaciones no especifican un destino explícito.
- `allowedAgents`: lista de identificadores de agentes permitidos para las sesiones de tiempo de ejecución de ACP; si está vacía, no hay ninguna restricción adicional.
- `stream.repeatSuppression`: suprime las líneas de estado/herramientas repetidas en cada turno (valor predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.tagVisibility`: registro de nombres de etiquetas con anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de tiempo de ejecución de ACP.

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
  - `"random"` (predeterminado): eslóganes divertidos o de temporada que van rotando.
  - `"default"`: eslogan neutro fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título y la versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo los eslóganes), configure la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente

Comportamiento y metadatos de los flujos de configuración guiada de la CLI (`onboard`, `configure`, `doctor`):

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

- `wizard.accessMode`: consentimiento para la detección elegido al inicio de la incorporación guiada. `"full"` (recomendado) permite que la configuración busque automáticamente aplicaciones de IA, claves y entornos de ejecución locales; `"guarded"` hace que la configuración solicite permiso una vez antes de buscar y ofrezca en su lugar la configuración manual.

- `wizard.appRecommendations` tiene como valor predeterminado `true`. Configúrelo como `false` para desactivar las recomendaciones de aplicaciones instaladas durante la incorporación guiada o clásica y bloquear el acceso de Gateway a `device.apps`. Los hosts Node siguen necesitando su indicador independiente, desactivado de forma predeterminada, para compartir aplicaciones instaladas antes de anunciar el comando.

---

## Identidad

Consulte los campos de identidad de `agents.list` en [Valores predeterminados del agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan mediante el WebSocket de Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar las claves desconocidas).

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
    webhook: "https://example.invalid/legacy", // alternativa obsoleta para trabajos almacenados con notify:true
    webhookToken: "replace-with-dedicated-token", // token de portador opcional para autenticar webhooks salientes
    sessionRetention: "24h", // cadena de duración o false
  },
}
```

- `sessionRetention`: cuánto tiempo se conservan las sesiones aisladas de ejecuciones de Cron completadas antes de depurar las filas de sesión de SQLite. También controla la limpieza de las transcripciones archivadas de Cron eliminadas. Valor predeterminado: `24h`; configure `false` para desactivarlo.
- El historial de ejecuciones conserva automáticamente las 2000 filas terminales más recientes por trabajo. Las filas perdidas mantienen su intervalo de limpieza de 24 horas.
- `webhookToken`: token de portador utilizado para la entrega mediante POST de webhooks de Cron (`delivery.mode = "webhook"`); si se omite, no se envía ninguna cabecera de autenticación.
- `webhook`: URL de Webhook alternativa heredada y obsoleta (http/https) que `openclaw doctor --fix` utiliza para migrar trabajos almacenados que aún tienen `notify: true`; la entrega en tiempo de ejecución utiliza `delivery.mode="webhook"` por trabajo junto con `delivery.to`, o `delivery.completionDestination` cuando se conserva la entrega de anuncios.

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

- `enabled`: habilita las alertas de fallos para los trabajos de Cron (valor predeterminado: `false`).
- `after`: cantidad de fallos consecutivos antes de activar una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: cantidad mínima de milisegundos entre alertas repetidas del mismo trabajo (entero no negativo).
- `includeSkipped`: contabiliza las ejecuciones omitidas consecutivas para alcanzar el umbral de alerta (valor predeterminado: `false`). Las ejecuciones omitidas se registran por separado y no afectan al retroceso por errores de ejecución.
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: identificador opcional de cuenta o canal para delimitar la entrega de alertas.

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

- Destino predeterminado de las notificaciones de fallos de Cron para todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos del destino.
- `channel`: sustitución del canal para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito del anuncio o URL del Webhook. Es obligatorio para el modo Webhook.
- `accountId`: sustitución opcional de la cuenta para la entrega.
- `delivery.failureDestination` por trabajo sustituye este valor predeterminado global.
- Cuando no se establece ningún destino de fallos global ni por trabajo, los trabajos que ya realizan entregas mediante `announce` recurren a ese destino principal de anuncios si se produce un fallo.
- `delivery.failureDestination` solo se admite para trabajos `sessionTarget="isolated"`, salvo que el valor principal de `delivery.mode` del trabajo sea `"webhook"`.

Consulte [Trabajos de Cron](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se registran como [tareas en segundo plano](/es/automation/tasks).

## Variables de plantilla del modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial o remitente) |
| `{{BodyStripped}}` | Cuerpo sin menciones de grupo                     |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador del destino                         |
| `{{MessageSid}}`   | Identificador del mensaje del canal               |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva          |
| `{{MediaUrl}}`     | Seudo-URL del contenido multimedia entrante       |
| `{{MediaPath}}`    | Ruta local del contenido multimedia               |
| `{{MediaType}}`    | Tipo de contenido multimedia (imagen/audio/documento/…) |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Instrucción multimedia resuelta para entradas de la CLI |
| `{{MaxChars}}`     | Máximo resuelto de caracteres de salida para entradas de la CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                           |
| `{{GroupSubject}}` | Tema del grupo (mejor aproximación posible)       |
| `{{GroupMembers}}` | Vista previa de los miembros del grupo (mejor aproximación posible) |
| `{{SenderName}}`   | Nombre visible del remitente (mejor aproximación posible) |
| `{{SenderE164}}`   | Número de teléfono del remitente (mejor aproximación posible) |
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
- Matriz de archivos: se combinan en profundidad y en orden (los posteriores sustituyen a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (sustituyen los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que realiza la inclusión, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` solo se permiten si se siguen resolviendo dentro de ese límite. Configure `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de su resolución; cada archivo incluido tiene un límite de 2 MB.
- Las escrituras propiedad de OpenClaw que modifican únicamente una sección de nivel superior respaldada por una inclusión de archivo único se escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, las matrices de inclusiones y las inclusiones con sustituciones mediante claves hermanas son de solo lectura para las escrituras propiedad de OpenClaw; esas escrituras fallan de forma segura en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitudes excesivas.

---

## Temas relacionados

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Doctor](/es/gateway/doctor)
