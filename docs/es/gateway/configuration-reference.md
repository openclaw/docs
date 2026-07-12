---
read_when:
    - Necesita la semántica exacta de la configuración a nivel de campo o los valores predeterminados
    - Está validando bloques de configuración de canales, modelos, Gateway o herramientas
summary: Referencia de configuración del Gateway para las claves principales de OpenClaw, los valores predeterminados y los enlaces a referencias específicas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-12T21:23:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia a nivel de campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más detalladas de los subsistemas. Para obtener instrucciones de configuración orientadas a tareas, consulta [Configuración](/es/gateway/configuration). Los catálogos de comandos administrados por canales y plugins, así como las opciones avanzadas de memoria/QMD, se encuentran en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw utiliza valores predeterminados seguros cuando se omiten.

El código prevalece sobre esta página:

- `openclaw config schema` muestra el esquema JSON activo que se utiliza para la validación y la interfaz de control, con los metadatos integrados, de plugins y de canales combinados.
- Los agentes deben invocar la acción `config.schema.lookup` de la herramienta `gateway` para obtener un único nodo exacto del esquema, limitado a una ruta, antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento con respecto a la superficie actual del esquema.

Referencias detalladas específicas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`.
- [Comandos con barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados y empaquetados.
- Las páginas del canal o plugin propietario para las superficies de comandos específicas de cada canal.

---

## Canales

Las claves de configuración de cada canal se encuentran en [Configuración: canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales incluidos (autenticación, control de acceso, varias cuentas y restricción mediante menciones).

## Valores predeterminados de los agentes, varios agentes, sesiones y mensajes

Consulte [Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, contenido multimedia, Skills, entorno aislado)
- `multiAgent.*` (enrutamiento y vinculaciones multiagente)
- `session.*` (ciclo de vida de la sesión, Compaction, depuración)
- `messages.*` (entrega de mensajes, TTS, renderizado de Markdown)
- `talk.*` (modo de conversación)
  - `talk.consultThinkingLevel`: anulación del nivel de razonamiento para la ejecución completa del agente de OpenClaw que sustenta las consultas en tiempo real de Talk en la interfaz de control
  - `talk.consultFastMode`: anulación puntual del modo rápido para consultas en tiempo real de Talk en la interfaz de control
  - `talk.speechLocale`: identificador de configuración regional BCP 47 opcional para el reconocimiento de voz de Talk en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, Talk mantiene el intervalo de pausa predeterminado de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: mecanismo alternativo de retransmisión del Gateway para las transcripciones en tiempo real finalizadas de Talk que omiten `openclaw_agent_consult`

## Herramientas y proveedores personalizados

La política de herramientas, las opciones experimentales, la configuración de herramientas respaldadas por proveedores y la configuración de proveedores personalizados o URL base se encuentran en
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
- `models.providers`: mapa de proveedores personalizados indexado por el identificador del proveedor.
- `models.providers.*.localService`: administrador opcional de procesos bajo demanda para
  servidores de modelos locales. OpenClaw sondea el endpoint de estado configurado, inicia
  el `command` absoluto cuando es necesario, espera hasta que esté listo y luego envía la solicitud
  del modelo. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla la inicialización de precios en segundo plano que
  comienza después de que los procesos auxiliares y los canales alcanzan la ruta de disponibilidad del Gateway. Cuando es `false`,
  el Gateway omite las consultas de los catálogos de precios de OpenRouter y LiteLLM; los valores
  configurados en `models.providers.*.models[].cost` siguen funcionando para las estimaciones de costes locales.

## MCP

Las definiciones de servidores MCP administrados por OpenClaw se encuentran en `mcp.servers` y las
consumen OpenClaw integrado y otros adaptadores de entorno de ejecución. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` administran este bloque sin conectarse al
servidor de destino durante las modificaciones de configuración.

```json5
{
  mcp: {
    // Opcional. Valor predeterminado: 600000 ms (10 minutos). Establezca 0 para deshabilitar la expulsión por inactividad.
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
        // Controles opcionales de proyección del servidor de aplicaciones Codex.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definiciones con nombre de servidores MCP stdio o remotos para entornos de ejecución que
  exponen las herramientas MCP configuradas.
  Las entradas remotas utilizan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.servers.<name>.enabled`: establézcalo en `false` para conservar una definición de servidor guardada
  y excluirla al mismo tiempo del descubrimiento de MCP y la proyección de herramientas de OpenClaw integrado.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: tiempo de espera de solicitudes MCP por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: tiempo de espera de conexión por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicación opcional de concurrencia para
  adaptadores que pueden decidir si realizan llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: establézcalo en `"oauth"` para los servidores MCP HTTP que requieran
  OAuth. Ejecute `openclaw mcp login <name>` para almacenar los tokens en el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: anulaciones opcionales del ámbito de OAuth, la URL de redirección y la URL de
  metadatos del cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS de HTTP
  para endpoints privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP descubiertas a los nombres coincidentes; `exclude` oculta los nombres
  coincidentes. Las entradas son nombres exactos de herramientas MCP o patrones glob simples con `*`. Los servidores con
  recursos o instrucciones también generan nombres de herramientas auxiliares (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres utilizan el
  mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del servidor de aplicaciones Codex.
  Este bloque contiene metadatos de OpenClaw únicamente para hilos del servidor de aplicaciones Codex; no
  afecta a las sesiones ACP, la configuración genérica del entorno Codex ni otros adaptadores de entorno de ejecución.
  Un valor no vacío de `codex.agents` limita el servidor a los identificadores de agentes de OpenClaw indicados.
  La validación de configuración rechaza las listas de agentes con ámbito vacías, en blanco o no válidas,
  y la ruta de proyección del entorno de ejecución las omite en lugar de convertirlas en globales.
  `codex.defaultToolsApprovalMode` emite el valor nativo de Codex
  `default_tools_approval_mode` para ese servidor. OpenClaw elimina el bloque `codex`
  antes de pasar la configuración nativa `mcp_servers` a Codex. Omita el bloque para
  mantener el servidor proyectado para todos los agentes del servidor de aplicaciones Codex con el
  comportamiento predeterminado de aprobación de MCP de Codex.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para entornos MCP incluidos cuyo ámbito es la sesión.
  Las ejecuciones integradas únicas solicitan una limpieza al finalizar la ejecución; este TTL sirve como respaldo para
  sesiones de larga duración y futuros consumidores.
- Los cambios en `mcp.*` se aplican en caliente mediante la eliminación de los entornos MCP de sesión almacenados en caché.
  El siguiente descubrimiento o uso de herramientas vuelve a crearlos a partir de la nueva configuración, por lo que las entradas
  eliminadas de `mcp.servers` se descartan inmediatamente en lugar de esperar al TTL de inactividad.
- El descubrimiento en tiempo de ejecución también respeta las notificaciones de cambios en la lista de herramientas MCP eliminando
  el catálogo almacenado en caché de esa sesión. Los servidores que anuncian recursos o
  instrucciones obtienen herramientas auxiliares para enumerar y leer recursos, así como para enumerar y obtener
  instrucciones. Los fallos reiterados de llamadas a herramientas pausan brevemente el servidor afectado antes de
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o una cadena de texto sin formato
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista opcional de elementos permitidos solo para Skills incluidos (no afecta a los Skills administrados o del espacio de trabajo).
- `load.extraDirs`: raíces adicionales de Skills compartidos (menor precedencia).
- `load.allowSymlinkTargets`: raíces de destino reales de confianza en las que pueden
  resolverse los enlaces simbólicos de Skills cuando el enlace se encuentra fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que la aplicación de Skill Workshop escriba
  a través de destinos de enlaces simbólicos que ya son de confianza (valor predeterminado: false).
- `install.preferBrew`: cuando es true, da preferencia a los instaladores de Homebrew si `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia del instalador de Node para las especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que los clientes del Gateway `operator.admin` de confianza
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (valor predeterminado: false). Esto solo habilita la ruta de archivos cargados; las instalaciones normales de ClawHub
  no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita un Skill incluso si está incluido o instalado.
- `entries.<skillKey>.apiKey`: opción práctica para los Skills que declaran una variable de entorno principal (cadena de texto sin formato u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitan el descubrimiento de Skills y el mensaje de Skills destinado al modelo.
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

- Se cargan desde directorios de paquetes o bundles en `~/.openclaw/extensions` y `<workspace>/.openclaw/extensions`, además de los archivos o directorios indicados en `plugins.load.paths`.
- Coloque los archivos de Plugin independientes en `plugins.load.paths`; las raíces de extensiones detectadas automáticamente ignoran los archivos `.js`, `.mjs` y `.ts` de nivel superior para que los scripts auxiliares de esas raíces no bloqueen el inicio.
- La detección admite plugins nativos de OpenClaw, además de bundles compatibles de Codex y Claude, incluidos los bundles de Claude sin manifiesto que usan la disposición predeterminada.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins incluidos). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo práctico de clave de API a nivel de Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito del Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que modifican el prompt de la versión heredada de `before_agent_start`, mientras conserva los valores heredados `modelOverride` y `providerOverride`. Se aplica a los hooks de plugins nativos y a los directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins de confianza no incluidos en el bundle pueden leer el contenido sin procesar de la conversación desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para solicitar anulaciones de `provider` y `model` por ejecución en ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones de subagentes de confianza. Use `"*"` solo si desea permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este Plugin para solicitar anulaciones de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones de finalización de LLM de plugins de confianza. Use `"*"` solo si desea permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este Plugin para ejecutar `api.runtime.llm.complete` con un identificador de agente distinto del predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado mediante el esquema del Plugin nativo de OpenClaw cuando esté disponible).
- La configuración de cuenta y tiempo de ejecución de los plugins de canal se encuentra en `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del Plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del arnés de Codex

El Plugin `codex` incluido es propietario de la configuración del arnés nativo del servidor de aplicaciones de Codex en
`plugins.entries.codex.config`. Consulte la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference) para conocer toda la superficie de configuración
y [Arnés de Codex](/es/plugins/codex-harness) para conocer el modelo de tiempo de ejecución.

`codexPlugins` se aplica únicamente a las sesiones que seleccionan el arnés nativo de Codex.
No habilita los plugins de Codex para las ejecuciones de proveedores de OpenClaw, las
vinculaciones de conversaciones ACP ni ningún arnés que no sea de Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita la compatibilidad nativa de
  plugins y aplicaciones de Codex para el arnés de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expone todas las
  aplicaciones accesibles actualmente conectadas a la cuenta de Codex autenticada en
  cada nuevo hilo nativo de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para las solicitudes de intervención de las aplicaciones de plugins configuradas.
  Use `true` para aceptar los esquemas seguros de aprobación de Codex sin preguntar, `false`
  para rechazarlos, `"auto"` para enrutar las aprobaciones requeridas por Codex mediante las
  aprobaciones de plugins de OpenClaw, o `"ask"` para solicitar confirmación en cada acción
  de escritura o destructiva del Plugin sin una aprobación persistente. El modo `"ask"`
  borra las anulaciones persistentes de aprobación por herramienta de Codex para la
  aplicación afectada y selecciona al revisor humano de aprobaciones para esa aplicación
  antes de que se inicie el hilo de Codex.
  Valor predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una
  entrada de Plugin configurada cuando el valor global `codexPlugins.enabled` también es true.
  Valor predeterminado: `true` para las entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace, obligatoria junto con `pluginName` para cada
  entrada resuelta. Admite `"openai-curated"` y `"workspace-directory"`. Se ignoran
  las entradas a las que les falte cualquiera de los campos de identidad.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad
  estable del Plugin de Codex, obligatoria junto con `marketplaceName`. Una entrada
  `workspace-directory` debe usar el valor `summary.id` exacto y cualificado por el
  marketplace que devuelve `plugin/list`, por ejemplo,
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  anulación de la acción destructiva por Plugin. Cuando se omite, se usa el valor global
  `allow_destructive_actions`. El valor por Plugin acepta las mismas políticas
  `true`, `false`, `"auto"` o `"ask"`.

Cada aplicación de Plugin admitida que use `"ask"` dirige las solicitudes de aprobación
de esa aplicación al revisor humano. Las demás aplicaciones y las aprobaciones de hilos
que no sean de aplicaciones conservan su revisor configurado, por lo que las políticas
mixtas de plugins no heredan el comportamiento de `"ask"`.

`codexPlugins.enabled` es la directiva de habilitación global. Las entradas explícitas
de plugins escritas por la migración constituyen el conjunto persistente y seleccionado
de elegibilidad para instalación y reparación. Las entradas `workspace-directory`
configuradas manualmente ya deben estar instaladas y habilitadas, y sus aplicaciones
propias deben ser accesibles; OpenClaw no las instala ni las autentica. Si Codex rechaza
la solicitud explícita del catálogo del espacio de trabajo, las entradas habilitadas
del espacio de trabajo se cierran de forma segura con `marketplace_missing`, mientras
que las entradas seleccionadas del catálogo predeterminado siguen disponibles.
`plugins["*"]` no es compatible, no existe ningún interruptor `install` y los valores
locales `marketplacePath` no son intencionadamente campos de configuración porque son
específicos del host. Consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins) para conocer los requisitos de
versión y disponibilidad del servidor de aplicaciones.

Las comprobaciones de disponibilidad de `app/list` se almacenan en caché durante una hora
y se actualizan de forma asíncrona cuando quedan obsoletas. La configuración de aplicaciones
del hilo de Codex se calcula cuando se establece la sesión del arnés de Codex, no en cada
turno; use `/new`, `/reset` o reinicie el Gateway después de cambiar la configuración
nativa de plugins.

`codexPlugins.allow_all_plugins` captura todas las aplicaciones de la cuenta accesibles
actualmente en cada nuevo hilo nativo de Codex. No instala plugins ni aplicaciones, y las
aplicaciones inaccesibles permanecen excluidas. Las aplicaciones de la cuenta usan la
política global `codexPlugins.allow_destructive_actions`. Las entradas explícitas de
plugins tienen prioridad cuando la misma aplicación está presente en ambas rutas. Si no
se puede leer `app/list`, la exposición de toda la cuenta se cierra de forma segura.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web de Firecrawl.
  - `apiKey`: clave de API opcional de Firecrawl para límites superiores (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, al valor heredado `tools.web.fetch.firecrawl.apiKey` o a la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; las anulaciones con alojamiento propio deben apuntar a endpoints privados/internos).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de la caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (por ejemplo, `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de la memoria. Consulte [Dreaming](/es/concepts/dreaming) para conocer las fases y los umbrales.
  - `enabled`: interruptor principal de Dreaming (valor predeterminado: `false`).
  - `frequency`: frecuencia de cron para cada recorrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: anulación opcional del modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínelo con `allowedModels` para restringir los destinos. Los errores de modelo no disponible vuelven a intentarse una vez con el modelo predeterminado de la sesión; los fallos de confianza o de la lista de permitidos no recurren silenciosamente a otra opción.
  - la política de fases y los umbrales son detalles de implementación (no son claves de configuración orientadas al usuario).
- La configuración completa de la memoria se encuentra en la [referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins habilitados de bundles de Claude también pueden aportar valores predeterminados integrados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración saneada del agente, no como parches sin procesar de la configuración de OpenClaw.
- `plugins.slots.memory`: selecciona el identificador del Plugin de memoria activo o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: selecciona el identificador del Plugin activo del motor de contexto; el valor predeterminado es `"legacy"` a menos que instale y seleccione otro motor.

Consulte [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria inferida de seguimiento: OpenClaw puede detectar comprobaciones de seguimiento en los turnos de conversación y entregarlas mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción oculta mediante LLM, el almacenamiento y la entrega mediante Heartbeat de compromisos de seguimiento inferidos. Valor predeterminado: `false`.
- `commitments.maxPerDay`: número máximo de compromisos de seguimiento inferidos entregados por sesión de agente en un día móvil. Valor predeterminado: `3`.

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
- `tabCleanup` recupera las pestañas rastreadas del agente principal después de un periodo de inactividad o cuando una
  sesión supera su límite. Establezca `idleMinutes: 0` o `maxTabsPerSession: 0` para
  deshabilitar individualmente esos modos de limpieza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se establece, por lo que la navegación del navegador permanece restringida de forma predeterminada.
- Establezca `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíe intencionadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad y detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, use `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para definir excepciones explícitas.
- Los perfiles remotos solo permiten la conexión (inicio, detención y restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Use HTTP(S) cuando quiera que OpenClaw detecte `/json/version`; use WS(S)
  cuando su proveedor le proporcione una URL directa de WebSocket de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad CDP remota y
  `attachOnly`, así como a las solicitudes de apertura de pestañas. Los perfiles de bucle invertido
  administrados conservan los valores predeterminados de CDP local. La enumeración persistente de
  pestañas remotas de Playwright usa el valor mayor como plazo límite de la operación.
- Si un servicio CDP administrado externamente es accesible mediante el bucle invertido, establezca
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de bucle invertido como un
  perfil de navegador local administrado y puede informar errores de propiedad del puerto local.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden conectarse en
  el host seleccionado o mediante un Node de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para dirigirse a un
  perfil específico de navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden establecer `cdpUrl` cuando Chrome ya se está ejecutando
  detrás de un endpoint de detección HTTP(S) de DevTools o un endpoint directo WS(S). En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de usar la conexión automática;
  `userDataDir` se ignora en los argumentos de inicio de Chrome MCP.
- Los perfiles `existing-session` mantienen los límites actuales de las rutas de Chrome MCP:
  acciones basadas en instantáneas y referencias en lugar de selección mediante selectores CSS, enlaces
  de carga de un solo archivo, sin anulaciones del tiempo de espera de diálogos, sin `wait --load networkidle` y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles locales administrados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; establezca
  `cdpUrl` explícitamente solo para perfiles CDP remotos o para la conexión mediante endpoint de una sesión existente.
- Los perfiles locales administrados pueden establecer `executablePath` para sustituir el valor global
  `browser.executablePath` de ese perfil. Úselo para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles locales administrados usan `browser.localLaunchTimeoutMs` para la detección HTTP de Chrome CDP
  después de iniciar el proceso y `browser.localCdpReadyTimeoutMs` para
  comprobar la disponibilidad del websocket CDP después del inicio. Aumente estos valores en hosts más lentos donde Chrome
  se inicia correctamente, pero las comprobaciones de disponibilidad se adelantan al inicio. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; los valores de configuración no válidos se rechazan.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Tanto `browser.executablePath` como `browser.profiles.<name>.executablePath`
  aceptan `~` y `~/...` para el directorio de inicio de su sistema operativo antes de iniciar Chromium.
  El valor `userDataDir` por perfil de los perfiles `existing-session` también expande la virgulilla.
- Servicio de control: solo bucle invertido (puerto derivado de `gateway.port`, valor predeterminado `18791`).
- `extraArgs` añade indicadores de inicio adicionales al arranque local de Chromium (por ejemplo,
  `--disable-gpu`, dimensiones de ventana o indicadores de depuración).

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
  },
}
```

- `seamColor`: color de énfasis de los elementos de la interfaz de usuario de la aplicación nativa (tinte de la burbuja del modo de conversación, etc.).
- `assistant`: sustitución de identidad de la interfaz de control. Si no se establece, usa la identidad del agente activo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remoto
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // ninguno | token | contraseña | proxy de confianza
      token: "su-token",
      // password: "su-contraseña", // o OPENCLAW_GATEWAY_PASSWORD
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
      mode: "off", // desactivado | servir | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // títulos opcionales generados por IA sobre el propósito de las llamadas a herramientas (consume tokens del modelo de utilidad)
      // embedSandbox: "scripts", // estricto | scripts | de confianza
      // allowExternalEmbedUrls: false, // peligroso: permite URL http(s) externas absolutas para contenido incrustado
      // chatMessageMaxWidth: "min(1280px, 82%)", // anchura máxima opcional de la transcripción centrada del chat
      // allowedOrigins: ["https://control.example.com"], // obligatorio para una interfaz de control fuera del bucle invertido
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo peligroso de reserva de origen basado en la cabecera Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | directo
      token: "su-token",
      // password: "su-contraseña",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Valor predeterminado: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Sin establecer/deshabilitado de forma predeterminada.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Aprobación automática verificada mediante SSH. Valor predeterminado: habilitada (true).
        // Establezca false para deshabilitar únicamente la verificación SSH; esto no afecta a
        // autoApproveCidrs anteriormente. Para emparejar nodos solo de forma manual, establezca false Y
        // deje autoApproveCidrs sin establecer. Pase un objeto para ajustar: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Denegaciones HTTP adicionales de /tools/invoke
      deny: ["browser"],
      // Elimina herramientas de la lista predeterminada de denegación HTTP para invocadores propietarios/administradores
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

- `mode`: `local` (ejecutar el Gateway) o `remote` (conectarse a un Gateway remoto). El Gateway se niega a iniciarse a menos que sea `local`.
- `port`: puerto único multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (IPv4 de Tailscale cuando esté disponible; de lo contrario, loopback) o `custom` (una dirección IPv4). Una dirección `tailnet` resuelta y cualquier dirección `custom` distinta de `127.0.0.1` o `0.0.0.0` requieren `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si cualquiera de los listeners no puede enlazarse. La exposición fuera de loopback permanece limitada a la interfaz seleccionada.
- **Alias de bind heredados**: use valores de modo de bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el bind `loopback` predeterminado escucha en `127.0.0.1` dentro del contenedor. Con la red bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que el Gateway no es accesible. Use `--network host` o establezca `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: obligatoria de forma predeterminada. Los binds que no sean loopback requieren autenticación del Gateway. En la práctica, esto significa un token o una contraseña compartidos, o un proxy inverso con reconocimiento de identidad y `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` (incluidos SecretRefs), establezca `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio y de instalación o reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úselo solo para configuraciones loopback locales de confianza; intencionadamente, las indicaciones de incorporación no ofrecen esta opción.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador o del usuario en un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)). Este modo espera de forma predeterminada un origen de proxy **que no sea loopback**; los proxies inversos loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como alternativa local directa; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo de proxy de confianza.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación mediante encabezados de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token presupone que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de intentos de autenticación fallidos. Se aplica por IP de cliente y por ámbito de autenticación (el secreto compartido y el token de dispositivo se controlan de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de registrar el fallo. Por lo tanto, los intentos incorrectos simultáneos del mismo cliente pueden activar el limitador en la segunda solicitud, en lugar de que ambos avancen en una condición de carrera como simples discrepancias.
  - El valor predeterminado de `gateway.auth.rateLimit.exemptLoopback` es `true`; establézcalo en `false` cuando se quiera limitar intencionadamente también la tasa del tráfico de localhost (para configuraciones de prueba o implementaciones de proxy estrictas).
- Los intentos de autenticación WS con origen en el navegador siempre se limitan, con la exención de loopback desactivada (defensa en profundidad contra ataques de fuerza bruta a localhost desde el navegador).
- En loopback, esos bloqueos originados en el navegador se aíslan por cada valor normalizado de `Origin`,
  por lo que los fallos repetidos desde un origen de localhost no bloquean automáticamente
  otro origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre opcional de Tailscale Service para el modo Serve, como
  `svc:openclaw`. Cuando se establece, OpenClaw lo pasa a `tailscale serve
--service` para que Control UI pueda exponerse mediante un Service con nombre en lugar
  del nombre de host del dispositivo. El valor debe usar el formato de nombre de Service
  `svc:<dns-label>` de Tailscale; el inicio informa la URL de Service derivada.
- `tailscale.preserveFunnel`: cuando es `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve al inicio y lo omite
  si una ruta de Funnel configurada externamente ya cubre el puerto del Gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: lista explícita de orígenes de navegador permitidos para las conexiones WebSocket del Gateway. Es obligatoria para orígenes públicos de navegador que no sean loopback. Las cargas privadas de la interfaz de usuario en la misma procedencia LAN/Tailnet desde hosts loopback, RFC1918/link-local, `.local`, `.ts.net` o CGNAT de Tailscale se aceptan sin habilitar la alternativa basada en el encabezado Host.
- `controlUi.toolTitles`: permite opcionalmente títulos de propósito generados por IA para las llamadas a herramientas en el chat de Control UI. Valor predeterminado: `false` (la representación de herramientas permanece completamente determinista, sin llamadas a modelos en segundo plano). Cuando está habilitado, el método `chat.toolTitles` etiqueta las llamadas complejas mediante el enrutamiento estándar del modelo de utilidad: el `utilityModel` del agente (una decisión del operador que puede enviar argumentos acotados de herramientas al proveedor elegido, como cualquier tarea de utilidad) o el modelo pequeño predeterminado declarado por el proveedor de la sesión (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), y almacena los resultados en caché en la base de datos de estado de cada agente para que las visualizaciones repetidas nunca vuelvan a facturarse. `utilityModel: \"\"` deshabilita los títulos, como cualquier otra tarea de utilidad; los títulos nunca recurren al modelo principal como alternativa.
- `controlUi.chatMessageMaxWidth`: anchura máxima opcional para la transcripción centrada del chat de Control UI. Acepta valores de anchura CSS restringidos, como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita la alternativa de origen basada en el encabezado Host para implementaciones que dependen intencionadamente de la política de origen del encabezado Host.
- `terminal.enabled`: habilita opcionalmente la terminal del operador con ámbito de administración. Valor predeterminado: `false`. La terminal inicia un PTY del host en el espacio de trabajo del agente seleccionado, hereda el entorno del proceso del Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítela únicamente para implementaciones de operadores de confianza; cambiarla reinicia el Gateway y actualiza la política de seguridad de contenido de Control UI.
- `terminal.shell`: ejecutable de shell opcional. Cuando no se establece, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: tiempo durante el cual sobrevive una sesión de terminal después de perderse su conexión (recarga de página, suspensión del portátil), y durante el cual puede volver a conectarse mediante `terminal.attach` con su salida reciente reproducida. Valor predeterminado: `300`. Establezca `0` para finalizar las sesiones en cuanto se pierda su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, por lo que conviene reducir este valor en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` para hosts públicos; `ws://` sin cifrar solo se acepta para hosts loopback, LAN, link-local, `.local`, `.ts.net` y CGNAT de Tailscale.
- `remote.remotePort`: puerto del Gateway en el host SSH remoto. El valor predeterminado es `18789`; úselo cuando el puerto del túnel local difiera del puerto del Gateway remoto.
- `remote.sshHostKeyPolicy`: política de claves de host del túnel SSH de macOS. `strict` es el valor predeterminado y requiere una clave que ya sea de confianza. `openssh` es una activación explícita de la configuración efectiva de OpenSSH para alias administrados; revise los ajustes de SSH coincidentes del usuario y del sistema antes de usarla. La aplicación de macOS y `configure-remote` restablecen esta política a `strict` al cambiar de destino, salvo que se vuelva a activar explícitamente.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. No configuran por sí solos la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relé APNs externo que se usa después de que las compilaciones de iOS respaldadas por relé publiquen registros en el Gateway. Las compilaciones públicas de App Store usan el relé alojado de OpenClaw. Las URL de relé personalizadas deben corresponder a una ruta deliberadamente independiente de compilación o implementación de iOS cuya URL de relé apunte a dicho relé.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del Gateway al relé en milisegundos. El valor predeterminado es `10000`.
- Los registros respaldados por relé se delegan en una identidad específica del Gateway. La aplicación de iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relé y reenvía al Gateway una autorización de envío limitada al registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: sustituciones temporales mediante variables de entorno para la configuración del relé anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo destinada a URL de relé HTTP loopback. Las URL de relé de producción deben mantenerse en HTTPS.
- `gateway.handshakeTimeoutMs`: tiempo de espera en milisegundos para el protocolo de enlace WebSocket del Gateway antes de la autenticación. Valor predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando se establece. Aumente este valor en hosts con mucha carga o de baja potencia donde los clientes locales puedan conectarse mientras aún se estabiliza el calentamiento inicial.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado de los canales, en minutos. Establezca `0` para deshabilitar globalmente los reinicios del monitor de estado. Valor predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantenga este valor mayor o igual que `gateway.channelHealthCheckMinutes`. Valor predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicios del monitor de estado por canal o cuenta en una hora móvil. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sustitución por cuenta para canales con varias cuentas. Cuando se establece, tiene precedencia sobre la sustitución de nivel de canal.
- Las rutas de llamadas del Gateway local pueden usar `gateway.remote.*` como alternativa únicamente cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que una alternativa remota oculte el fallo).
- `trustedProxies`: IP de proxies inversos que terminan TLS o inyectan encabezados de cliente reenviado. Incluya únicamente proxies bajo su control. Las entradas loopback siguen siendo válidas para configuraciones de proxy o detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. El valor predeterminado es `false` para un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidas para aprobar automáticamente el emparejamiento inicial de dispositivos Node sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador, navegador, Control UI o WebChat, ni aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.pairing.sshVerify`: aprobación automática verificada mediante SSH para el emparejamiento inicial de dispositivos Node (valor predeterminado: habilitada). El Gateway se conecta por SSH al host que solicita el emparejamiento (BatchMode, claves de host estrictas) y solo lo aprueba si la clave del dispositivo coincide exactamente con la de `openclaw node identity`. Se aplica el mismo nivel mínimo de elegibilidad que en `autoApproveCidrs`; las comprobaciones se limitan a direcciones de origen privadas/CGNAT, salvo que `cidrs` las sustituya. Establezca `false` para deshabilitarla o `{ user, identity, timeoutMs, cidrs }` para ajustarla. Consulte [Emparejamiento de Node](/es/gateway/pairing#ssh-verified-device-auto-approval-default).
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: configuración global de permisos y denegaciones para los comandos de nodo declarados, después del emparejamiento y de evaluar la lista de permitidos de la plataforma. Use `allowCommands` para habilitar explícitamente comandos de nodo peligrosos como `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` y `sms.send`; `denyCommands` elimina un comando aunque, de otro modo, estuviera incluido por un valor predeterminado de la plataforma o por un permiso explícito. El permiso de Salud de iOS, el permiso de SMS de Android y la autorización de comandos del Gateway son independientes. Después de que un nodo cambie su lista de comandos declarados, rechace y vuelva a aprobar el emparejamiento de ese dispositivo para que el Gateway almacene la instantánea actualizada de los comandos.
  - `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para la solicitud HTTP `POST /tools/invoke` (amplía la lista de denegación predeterminada).
  - `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada para
  los solicitantes con rol de propietario o administrador. Esto no concede acceso de propietario o administrador a los solicitantes de `operator.write`
  que tienen una identidad asociada; `cron`, `gateway` y `nodes` siguen
  sin estar disponibles para los solicitantes que no sean propietarios, aunque estén en la lista de permitidos.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administración: desactivado de forma predeterminada como el plugin `admin-http-rpc`. Habilite el plugin para registrar `POST /api/v1/admin/rpc`. Consulte [RPC HTTP de administración](/es/plugins/admin-http-rpc).
- Chat Completions: deshabilitado de forma predeterminada. Habilítelo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de la entrada de URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no configuradas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para deshabilitar la obtención mediante URL.
- Encabezado opcional de refuerzo de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúrelo solo para orígenes HTTPS bajo su control; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de múltiples instancias

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
- `autoGenerate`: genera automáticamente un par de certificado y clave autofirmados locales cuando no se configuran archivos explícitos; solo para uso local o de desarrollo.
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
  - `"hybrid"` (valor predeterminado): primero intenta una recarga en caliente; si es necesario, recurre al reinicio.
- `debounceMs`: intervalo de antirrebote en ms antes de aplicar los cambios de configuración (entero no negativo; valor predeterminado: `300`).
- `deferralTimeoutMs`: tiempo máximo opcional en ms que se espera a que terminen las operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítalo para usar la espera limitada predeterminada (`300000`); configúrelo como `0` para esperar indefinidamente y registrar periódicamente advertencias de operaciones aún pendientes.

---

## Entornos de trabajadores en la nube

Los trabajadores en la nube son opcionales. Si `cloudWorkers` está ausente o `profiles` está vacío, OpenClaw no acepta la creación de trabajadores nuevos. Los registros duraderos creados anteriormente siguen conciliándose y permanecen visibles; la proyección existente de gateway/Node no cambia.

Cada proveedor de trabajadores debe devolver una `hostKey` SSH procedente de una salida de aprovisionamiento de confianza con el formato exacto `algorithm base64`, sin nombre de host ni comentario. El arranque escribe esa clave en un archivo `known_hosts` aislado, usa `StrictHostKeyChecking=yes` y falla antes de abrir una conexión cuando el proveedor la omite. No existe un mecanismo alternativo de confianza en el primer uso.

La configuración del túnel se realiza bajo demanda en lugar de formar parte del aprovisionamiento. Cuando se inicia, el gateway reenvía de forma inversa un socket Unix local del trabajador a su endpoint WebSocket de bucle local. El socket reside en un directorio remoto asignado aleatoriamente y accesible solo por su propietario; a diferencia de un puerto TCP de bucle local, otras cuentas de un trabajador multiusuario no pueden acceder a él y no puede entrar en conflicto con el puerto de otro entorno. Los mensajes de mantenimiento de SSH y el retroceso de reconexión limitado solo se ejecutan mientras el propietario actual del túnel siga siéndolo. Al detener el túnel, se bloquean las reconexiones antes de cerrar el proceso SSH.

El tráfico de control y la transferencia del espacio de trabajo usan conexiones SSH independientes. Ambas reutilizan la misma identidad resuelta y el archivo `known_hosts` fijado y aislado, pero la transferencia del espacio de trabajo no comparte la multiplexación de conexiones SSH con el túnel de larga duración, por lo que rsync no puede bloquear el tráfico de control.

### Perfil de Crabbox

El proveedor `crabbox` incluido aprovisiona una concesión compatible con SSH mediante la CLI local de Crabbox. El valor interno `settings.provider` selecciona el backend de Crabbox; es independiente del id de proveedor externo de OpenClaw.

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
          // Ruta absoluta opcional. Valor predeterminado: ../crabbox/bin/crabbox del directorio adyacente y, después, PATH.
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
- `settings.ttl` y `settings.idleTimeout` (obligatorios): cadenas de duración positivas de Go que se pasan a `--ttl` y `--idle-timeout`. Estos mecanismos de seguridad del lado del proveedor son distintos de la política `lifetime` almacenada por OpenClaw que aparece más adelante.
- `settings.binary`: ruta absoluta opcional al ejecutable de Crabbox. Si no se especifica, OpenClaw comprueba el checkout adyacente de Crabbox, después las entradas ejecutables de `PATH` y, por último, invoca `crabbox` para que la ausencia de la CLI siga siendo un error visible del proveedor.

Las opciones desconocidas se rechazan. Las credenciales de Crabbox y la configuración de cuenta específica del backend siguen siendo responsabilidad de Crabbox; no las incluya en `settings`. OpenClaw solo invoca la CLI local y este plugin no realiza llamadas de red al proveedor. El aprovisionamiento siempre pasa `--keep=true`; OpenClaw controla el ciclo de vida externo y destruye la concesión con `crabbox stop`.

<Warning>
  OpenClaw resuelve la ruta `sshKey` local de la concesión de Crabbox mediante el solucionador de secretos propiedad del proveedor. La salida actual de `crabbox inspect --json` no expone una `sshHostKey` aprovisionada, por lo que los trabajadores respaldados por Crabbox todavía generan un fallo seguro antes del arranque o la configuración del túnel. Crabbox debe aprovisionar una clave de host autoritativa para cada concesión y devolver `sshHostKey` con el formato exacto `algorithm base64`, sin nombre de host ni comentario. Su caché local de la concesión `known_hosts` actual no constituye material de confianza de aprovisionamiento.
</Warning>

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

- `profiles`: perfiles de trabajadores con nombre e ids no vacíos y sin espacios en blanco al principio ni al final. Cada perfil selecciona un proveedor registrado por un plugin.
- `provider`: id no vacío del proveedor de trabajadores. Los ejemplos usan el proveedor `crabbox` incluido y el proveedor `static-ssh` de QA Lab.
- `install`: método de instalación del trabajador. `"bundle"` (valor predeterminado) transfiere un paquete con hash de contenido de la compilación instalada del gateway y admite versiones publicadas, de desarrollo y no publicadas. `"npm"` es una optimización opcional para una versión empaquetada sin modificaciones; instala `openclaw@<exact gateway version>` desde el registro público de npm y nunca instala `latest`.
- Los plugins de proveedor incluidos se seleccionan automáticamente cuando están configurados, pero las deshabilitaciones explícitas y `plugins.allow` siguen aplicándose. Incluya el id del proveedor (por ejemplo, `crabbox`) cuando haya una lista de permitidos configurada. Los plugins de proveedores externos también deben instalarse y habilitarse explícitamente.
- `settings`: JSON limitado propiedad del proveedor. El plugin seleccionado define y valida sus claves; use [objetos SecretRef](/es/gateway/secrets) para los valores que contengan secretos. El proveedor SSH estático requiere `host`, `user`, `hostKey` y `keyRef`; el valor predeterminado de `port` es `22`. `hostKey` debe ser una línea de clave pública de host OpenSSH (`algorithm base64`) obtenida del host conocido o de otro canal de confianza, sin prefijo de opciones.
- `lifetime.idleTimeoutMinutes`: minutos expresados como entero positivo que se almacenan para una política posterior de recuperación por inactividad.
- `lifetime.maxLifetimeMinutes`: minutos expresados como entero positivo que se almacenan para una política posterior del ciclo de vida.

El trabajador debe tener ya instalado un entorno de ejecución de Node compatible (22.19+, 23.11+ o 24+). El método opcional `"npm"` también requiere `npm` y acceso HTTPS saliente al registro público de npm. La configuración de las cadenas de herramientas conectadas a la red es una política del proveedor; el arranque informa de un error accionable en lugar de instalar por sí mismo las cadenas de herramientas.

Esta base instala y verifica la compilación del gateway y proporciona el ciclo de vida de inicio y detención del túnel, pero no inicia la CLI general de OpenClaw. El punto de entrada autónomo del trabajador y el bucle se incorporarán en el siguiente hito de trabajadores en la nube.

Cada registro duradero de entorno conserva sus opciones de proveedor validadas, el método de instalación resuelto y la política de ciclo de vida en una instantánea del perfil tomada en el momento de la creación. Cambiar o eliminar un perfil con nombre afecta a las creaciones nuevas; los registros existentes continúan la conciliación del ciclo de vida con esa instantánea, siempre que el plugin propietario siga disponible.

Los valores de ciclo de vida son solo datos en la primera versión de trabajadores en la nube; la aplicación automática se incorporará con trabajos posteriores del ciclo de vida. Los cambios de perfil requieren reiniciar el gateway.

<Warning>
  El proveedor `static-ssh` es una herramienta de desarrollo de QA Lab del árbol de fuentes y está excluido de las distribuciones empaquetadas. Un trabajador que se ejecute en su host compartido puede leer datos del host que no estén relacionados, por lo que no debe usar este proveedor como límite de aislamiento en producción.
  Su operador debe proporcionar la `hostKey` esperada; OpenClaw no aprenderá ni aceptará una clave de la primera conexión.
  La destrucción de su concesión solo libera el registro lógico de OpenClaw; no detiene ni limpia el host.
</Warning>

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
        messageTemplate: "De: {{messages[0].from}}\nAsunto: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticación: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Se rechazan los tokens de hooks incluidos en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un valor no vacío para `hooks.token`.
- `hooks.token` debe ser distinto de la autenticación activa mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); al iniciarse, se registra una advertencia de seguridad no fatal cuando se detecta su reutilización.
- `openclaw security audit` señala la reutilización de la autenticación de hooks/Gateway como un hallazgo crítico, incluida la autenticación por contraseña del Gateway proporcionada únicamente durante la auditoría (`--auth password --password <password>`). Ejecute `openclaw doctor --fix` para rotar un `hooks.token` reutilizado que esté almacenado de forma persistente y, a continuación, actualice los emisores externos de hooks para que usen el nuevo token de hook.
- `hooks.path` no puede ser `/`; use una subruta dedicada, como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si una asignación o un preajuste usa un `sessionKey` basado en plantilla, configure `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esta habilitación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El valor de `sessionKey` de la carga útil de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (valor predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores de `sessionKey` de asignaciones renderizados desde plantillas se consideran proporcionados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de las asignaciones">

- `match.path` coincide con la subruta situada después de `/hooks` (por ejemplo, `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen datos de la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan las rutas absolutas y el recorrido de directorios).
  - Mantenga `hooks.transformsDir` dentro de `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueva el módulo de transformación al directorio de transformaciones de hooks o elimine `hooks.transformsDir`.
- `agentId` dirige la ejecución a un agente específico; los identificadores desconocidos recurren al agente predeterminado.
- `allowedAgentIds`: restringe el enrutamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones del agente mediante hooks sin un `sessionKey` explícito.
- `allowRequestSessionKey`: permite que quienes invocan `/hooks/agent` y las claves de sesión de asignaciones basadas en plantillas establezcan `sessionKey` (valor predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de prefijos permitidos opcional para valores de `sessionKey` explícitos (solicitud + asignación), por ejemplo, `["hook:"]`. Pasa a ser obligatoria cuando alguna asignación o preajuste usa un `sessionKey` basado en plantilla.
- `deliver: true` envía la respuesta final a un canal; el valor predeterminado de `channel` es `last`.
- `model` sustituye el LLM para esta ejecución del hook (debe estar permitido si se configuró el catálogo de modelos).

</Accordion>

### Integración con Gmail

- El preajuste integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantiene ese enrutamiento por mensaje, configure `hooks.allowRequestSessionKey: true` y restrinja `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail; por ejemplo, `["hook:", "hook:gmail:"]`.
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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- El Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
- No ejecute una instancia independiente de `gog gmail watch serve` junto con el Gateway.

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
            // habilitado: falso, // o OPENCLAW_SKIP_CANVAS_HOST=1
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
- Solo local: mantenga `gateway.bind: "loopback"` (valor predeterminado).
- Enlaces que no sean de bucle invertido: las rutas de Canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), al igual que las demás superficies HTTP del Gateway.
- Las WebViews de Node normalmente no envían encabezados de autenticación; después de que un nodo se empareje y conecte, el Gateway anuncia URL de capacidades con ámbito de nodo para acceder a Canvas/A2UI.
- Las URL de capacidades están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se utiliza un mecanismo alternativo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando el directorio está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Deshabilite la recarga en vivo para directorios grandes o errores `EMFILE`.

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

- `minimal` (valor predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`; el anuncio multidifusión en la LAN sigue requiriendo que el plugin `bonjour` incluido esté habilitado.
- `off`: suprime el anuncio multidifusión en la LAN sin cambiar la habilitación del plugin.
- El plugin `bonjour` incluido se inicia automáticamente en hosts macOS y requiere habilitación explícita en Linux, Windows y despliegues del Gateway en contenedores.
- El nombre de host utiliza de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida y recurre a `openclaw` en caso contrario. Sustitúyalo con `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita por completo el anuncio mDNS y prevalece sobre `discovery.mdns.mode`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unidifusión en `~/.openclaw/dns/`. Para el descubrimiento entre redes, combínela con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

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

- Solo se aceptan nombres en mayúsculas que coincidan con: `[A-Z_][A-Z0-9_]*`.
- Las variables ausentes o vacías generan un error al cargar la configuración.
- Use `$${VAR}` como secuencia de escape para obtener un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores de texto sin formato siguen funcionando.

### `SecretRef`

Use una de las siguientes estructuras de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- Patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Patrón de identificador para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Identificador para `source: "file"`: puntero JSON absoluto (por ejemplo, `"/providers/openai/apiKey"`)
- Patrón de identificador para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores de estilo AWS `secret#json_key`)
- Los identificadores de `source: "exec"` no deben contener segmentos de ruta `.` o `..` delimitados por barras (por ejemplo, se rechaza `a/../b`)

### Superficie de credenciales admitida

- Matriz canónica: [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` se aplica a las rutas de credenciales admitidas de `openclaw.json`.
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
- Las rutas de los proveedores de archivos y ejecución fallan de forma segura cuando no está disponible la verificación de ACL de Windows. Establezca `allowInsecurePath: true` únicamente para rutas de confianza que no puedan verificarse.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo mediante stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos que sean enlaces simbólicos. Establezca `allowSymlinkCommand: true` para permitir rutas de enlaces simbólicos mientras se valida la ruta de destino resuelta.
- Si se configura `trustedDirs`, la comprobación de directorios de confianza se aplica a la ruta de destino resuelta.
- De forma predeterminada, el entorno secundario de `exec` es mínimo; pase explícitamente las variables necesarias mediante `passEnv`.
- Las referencias a secretos se resuelven en el momento de la activación en una instantánea en memoria; después, las rutas de solicitud solo leen esa instantánea.
- El filtrado de superficies activas se aplica durante la activación: las referencias sin resolver en superficies habilitadas hacen que fallen el inicio o la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

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
- Las asignaciones planas heredadas de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de tiempo de ejecución; `openclaw doctor --fix` las reescribe como perfiles canónicos de clave de API `provider:default` y crea una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de tiempo de ejecución proceden de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se eliminan al detectarse.
- Las importaciones heredadas de OAuth proceden de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/es/concepts/oauth).
- Comportamiento de los secretos en tiempo de ejecución y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

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

- `billingBackoffHours`: espera base en horas cuando un perfil falla debido a errores reales
  de facturación/crédito insuficiente (valor predeterminado: `5`). El texto explícito de facturación puede
  terminar aquí incluso en respuestas `401`/`403`, pero los patrones de coincidencia de texto
  específicos del proveedor permanecen limitados al proveedor al que pertenecen (por ejemplo, en OpenRouter,
  `Key limit exceeded`). Los mensajes HTTP `402` reintentables sobre ventanas de uso o
  límites de gasto de la organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de espera por facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial de la espera por facturación (valor predeterminado: `24`).
- `authPermanentBackoffMinutes`: espera base en minutos para fallos `auth_permanent` de alta confianza (valor predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento de la espera `auth_permanent` (valor predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas utilizada para los contadores de espera (valor predeterminado: `24`).
- `overloadedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al modelo alternativo (valor predeterminado: `1`). Los formatos que indican que el proveedor está ocupado, como `ModelNotReadyException`, terminan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (valor predeterminado: `0`).
- `rateLimitedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de límite de frecuencia antes de cambiar al modelo alternativo (valor predeterminado: `1`). Ese grupo de límites de frecuencia incluye texto con formatos propios del proveedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Auditoría

```json5
{
  audit: {
    enabled: true,
    messages: "off", // desactivado | directos | todos
  },
}
```

El Gateway registra eventos de auditoría **solo de metadatos** para las ejecuciones del agente y las
acciones de herramientas en la base de datos de estado compartida. Los metadatos del ciclo de vida de
los mensajes requieren una activación independiente. El registro almacena la identidad, los tiempos, los nombres
de las herramientas y los resultados normalizados, pero nunca las instrucciones, los cuerpos de los mensajes,
los argumentos de las herramientas, los resultados ni el texto de error sin procesar. Las filas de mensajes no
almacenan los identificadores sin procesar de cuentas de plataforma, conversaciones, mensajes ni destinos. Las
claves de sesión de ejecución/herramienta siguen disponibles para correlación y pueden contener por sí mismas
identificadores de cuentas de plataforma o de pares. Los registros
caducan después de 30 días y el registro tiene un límite de 100,000 filas. Consúltelos con
[`openclaw audit`](/es/cli/audit) o mediante la RPC del Gateway
[`audit.activity.list`](/es/gateway/protocol#audit-ledger-rpc). Consulte
[Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos completo, la semántica de privacidad
y los límites de cobertura.

- `enabled`: registra nuevos eventos de auditoría (valor predeterminado: `true`). El registro está activado de forma
  predeterminada porque un historial de auditoría que se habilita solo después de un incidente no puede explicar
  el incidente. Establecerlo en `false` detiene la inserción de nuevos eventos después de reiniciar el Gateway;
  los registros existentes siguen siendo legibles hasta que caduquen. Volver a activarlo reanuda
  el registro desde ese momento; el intervalo no se rellena de forma retroactiva.
- `messages`: ámbito de los metadatos de mensajes (valor predeterminado: `"off"`). `"direct"` registra
  únicamente conversaciones directas conocidas. `"all"` también registra grupos, canales y
  tipos de conversación desconocidos. Ambos modos siguen sin incluir contenido y sustituyen los
  identificadores sin procesar por seudónimos con clave locales de la instalación cuando la correlación está
  disponible. Son ayudas para la correlación, no mecanismos de anonimización; la base de datos de
  estado almacena la clave de derivación, pero las exportaciones por RPC y CLI no la incluyen.

El Gateway en ejecución captura `audit.enabled` y `audit.messages` al iniciarse;
reinícielo después de cambiar cualquiera de estas opciones. Actualmente, la cobertura de mensajes incluye
los mensajes entrantes aceptados que llegan al despacho del núcleo y una fila terminal por
cada carga útil lógica original de respuesta saliente que llega a la entrega duradera compartida.
Las rutas locales de los Plugins y de envío directo que omiten esos límites compartidos aún no
están cubiertas. El escritor en segundo plano
con límites funciona según el mejor esfuerzo; no es un archivo de cumplimiento sin pérdidas.

---

## Registro

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // legible | compacto | json
    redactSensitive: "tools", // desactivado | herramientas
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Archivo de registro predeterminado: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Establezca `logging.file` para usar una ruta estable.
- `consoleLevel` aumenta a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro activo en bytes antes de la rotación (entero positivo; valor predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento según el mejor esfuerzo para la salida de la consola, los registros de archivos, los registros de log OTLP y el texto persistente de las transcripciones de sesión. `redactSensitive: "off"` solo desactiva esta política general para registros/transcripciones; las superficies de seguridad de la interfaz, las herramientas y los diagnósticos siguen ocultando los secretos antes de emitirlos.

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

- `enabled`: interruptor principal de la salida de instrumentación (valor predeterminado: `true`).
- `flags`: matriz de cadenas de indicadores que habilitan la salida de registro específica (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad sin progreso en ms para clasificar las sesiones de procesamiento prolongadas como `session.long_running`, `session.stalled` o `session.stuck` (valor predeterminado: `120000`). El progreso de respuestas, herramientas, estados, bloques y ACP reinicia el temporizador; los diagnósticos `session.stuck` repetidos aumentan el intervalo mientras no haya cambios.
- `stuckSessionAbortMs`: umbral de antigüedad sin progreso en ms antes de que el trabajo activo bloqueado que cumpla los requisitos pueda drenarse mediante cancelación para su recuperación. Cuando no se establece, OpenClaw usa la ventana extendida más segura para ejecuciones integradas, de al menos 5 minutos y 3 veces `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura una instantánea de estabilidad redactada previa a un OOM cuando la presión de memoria alcanza el nivel `critical` (valor predeterminado: `false`). Establézcalo en `true` para añadir el análisis y la escritura del archivo del paquete de estabilidad, manteniendo los eventos normales de presión de memoria.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (valor predeterminado: `false`). Para consultar la configuración completa, el catálogo de señales y el modelo de privacidad, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del recopilador para la exportación de OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de cada señal. Cuando se establecen, reemplazan `otel.endpoint` únicamente para esa señal.
- `otel.protocol`: `"http/protobuf"` (valor predeterminado) o `"grpc"`.
- `otel.headers`: encabezados adicionales de metadatos HTTP/gRPC enviados con las solicitudes de exportación de OTel.
- `otel.serviceName`: nombre del servicio para los atributos del recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (valor predeterminado), `"stdout"` para un objeto JSON por línea de la salida estándar o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas de `0` a `1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para los atributos de tramos OTEL. Está desactivada de forma predeterminada. El valor booleano `true` captura el contenido de mensajes/herramientas que no sea del sistema; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: selector de entorno para la forma experimental más reciente de los tramos de inferencia de IA generativa, incluidos los nombres de tramo `{gen_ai.operation.name} {gen_ai.request.model}`, el tipo de tramo `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. De forma predeterminada, los tramos mantienen `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas de IA generativa usan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: selector de entorno para hosts que ya han registrado un SDK global de OpenTelemetry. En ese caso, OpenClaw omite el inicio y el cierre del SDK propiedad del Plugin, pero mantiene activos los escuchas de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoints específicos de cada señal que se utilizan cuando no se ha establecido la clave de configuración correspondiente.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones integradas (valor predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para las trazas de caché JSONL (valor predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de trazas de caché (todos tienen como valor predeterminado `true`).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // estable | estable extendido | beta | desarrollo
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

- `channel`: canal de publicación: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. El canal estable extendido solo se aplica a paquetes: los comandos en primer plano controlan la instalación, mientras que el Gateway puede emitir indicaciones de actualización de solo lectura.
- `checkOnStart`: comprueba si hay actualizaciones de npm cuando se inicia el Gateway (valor predeterminado: `true`). Las selecciones almacenadas del canal estable extendido usan la misma indicación de solo lectura y el mismo programa de indicaciones cada 24 horas.
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes de los canales estable y beta (valor predeterminado: `false`). El canal estable extendido nunca se aplica automáticamente.
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente una actualización del canal estable (valor predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional en horas para distribuir el despliegue del canal estable (valor predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia en horas con la que se ejecutan las comprobaciones del canal beta (valor predeterminado: `1`; máximo: `24`). La demora y la variación del canal estable, así como la configuración de sondeo de beta, no se aplican al canal estable extendido.

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
      deliveryMode: "live", // en directo | solo final
      hiddenBoundarySeparator: "paragraph", // ninguno | espacio | nueva línea | párrafo
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: control global de la función ACP (valor predeterminado: `true`; establezca `false` para ocultar las opciones de envío e inicio de ACP).
- `dispatch.enabled`: control independiente para el envío de turnos de sesión de ACP (valor predeterminado: `true`). Establezca `false` para mantener disponibles los comandos de ACP y, al mismo tiempo, bloquear la ejecución.
- `backend`: id del backend de entorno de ejecución de ACP predeterminado (debe coincidir con un plugin de entorno de ejecución de ACP registrado).
  Instale primero el plugin del backend y, si se establece `plugins.allow`, incluya el id del plugin del backend (por ejemplo, `acpx`) o el backend de ACP no se cargará.
- `fallbacks`: lista ordenada de ids de backend de ACP alternativos que se prueban cuando el backend principal falla anticipadamente con un error aparentemente transitorio (no disponible, límite de solicitudes alcanzado, cuota agotada o sobrecarga) antes de producir cualquier salida. Cada entrada debe coincidir con el backend de un plugin de entorno de ejecución de ACP registrado.
- `defaultAgent`: id del agente de destino alternativo de ACP cuando los inicios no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agentes autorizados para sesiones del entorno de ejecución de ACP; si está vacía, no hay restricciones adicionales.
- `maxConcurrentSessions`: número máximo de sesiones de ACP activas simultáneamente.
- `stream.coalesceIdleMs`: intervalo de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloques transmitidos.
- `stream.repeatSuppression`: suprime las líneas repetidas de estado/herramientas por turno (valor predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible posterior a eventos de herramientas ocultos (valor predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: número máximo de caracteres de salida del asistente proyectados por turno de ACP.
- `stream.maxSessionUpdateChars`: número máximo de caracteres para las líneas proyectadas de estado/actualización de ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas con anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para los procesos de sesión de ACP antes de que puedan limpiarse.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de ejecución de ACP.

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
  - `"random"` (predeterminado): eslóganes divertidos o estacionales que van rotando.
  - `"default"`: eslogan neutro fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título y la versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo los eslóganes), establezca la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente

Metadatos escritos por los flujos de configuración guiada de la CLI (`onboard`, `configure`, `doctor`):

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

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los Nodes se conectan mediante el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar las claves desconocidas).

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
    maxConcurrentRuns: 8, // valor predeterminado; despacho de cron + ejecución aislada de turnos del agente de cron
    webhook: "https://example.invalid/legacy", // alternativa obsoleta para trabajos almacenados con notify:true
    webhookToken: "replace-with-dedicated-token", // token de portador opcional para autenticar webhooks salientes
    sessionRetention: "24h", // cadena de duración o false
    runLog: {
      maxBytes: "2mb", // valor predeterminado: 2_000_000 bytes
      keepLines: 2000, // valor predeterminado: 2000
    },
  },
}
```

- `sessionRetention`: cuánto tiempo se conservan las sesiones completadas de ejecuciones aisladas de cron antes de depurar las filas de sesión de SQLite. También controla la limpieza de las transcripciones archivadas de cron eliminadas. Valor predeterminado: `24h`; se establece en `false` para desactivarlo.
- `runLog.maxBytes`: se acepta por compatibilidad con registros de ejecuciones de cron antiguos respaldados por archivos. Valor predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: filas más recientes del historial de ejecuciones de SQLite que se conservan por trabajo. Valor predeterminado: `2000`.
- `webhookToken`: token de portador utilizado para la entrega mediante POST de webhooks de cron (`delivery.mode = "webhook"`); si se omite, no se envía ninguna cabecera de autenticación.
- `webhook`: URL de Webhook heredada y obsoleta (http/https) que utiliza `openclaw doctor --fix` para migrar trabajos almacenados que aún tienen `notify: true`; la entrega en tiempo de ejecución utiliza `delivery.mode="webhook"` por trabajo junto con `delivery.to`, o `delivery.completionDestination` cuando se conserva la entrega de anuncios.

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

- `maxAttempts`: número máximo de reintentos para los trabajos Cron ante errores transitorios (valor predeterminado: `3`; intervalo: `0`-`10`).
- `backoffMs`: matriz de retrasos de espera en ms para cada intento de reintento (valor predeterminado: `[30000, 60000, 300000]`; de 1 a 10 entradas).
- `retryOn`: tipos de error que activan los reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítalo para reintentar todos los tipos transitorios.

Los trabajos de ejecución única permanecen habilitados hasta que se agotan los intentos de reintento; después se deshabilitan y conservan el estado de error final. Los trabajos recurrentes usan la misma política de reintentos transitorios para volver a ejecutarse después de la espera y antes de su siguiente intervalo programado; los errores permanentes o el agotamiento de los reintentos transitorios hacen que se vuelva a la programación recurrente normal con espera tras errores.

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

- `enabled`: habilita las alertas de fallos para los trabajos Cron (valor predeterminado: `false`).
- `after`: número de fallos consecutivos antes de que se active una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: cantidad mínima de milisegundos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: cuenta las ejecuciones consecutivas omitidas para alcanzar el umbral de alerta (valor predeterminado: `false`). Las ejecuciones omitidas se registran por separado y no afectan a la espera tras errores de ejecución.
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

- Destino predeterminado de las notificaciones de fallos de Cron para todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos del destino.
- `channel`: anulación del canal para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito del anuncio o URL del Webhook. Es obligatorio para el modo Webhook.
- `accountId`: anulación opcional de la cuenta para la entrega.
- El valor `delivery.failureDestination` de cada trabajo anula este valor predeterminado global.
- Cuando no se establece ningún destino de fallos global ni por trabajo, los trabajos que ya realizan entregas mediante `announce` recurren a ese destino principal de anuncios en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"`, salvo que el valor principal de `delivery.mode` del trabajo sea `"webhook"`.

Consulte [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se registran como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                               |
| ------------------ | --------------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante                      |
| `{{RawBody}}`      | Cuerpo sin procesar (sin contenedores de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo sin menciones de grupo                             |
| `{{From}}`         | Identificador del remitente                               |
| `{{To}}`           | Identificador del destino                                 |
| `{{MessageSid}}`   | Identificador del mensaje del canal                       |
| `{{SessionId}}`    | UUID de la sesión actual                                  |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva                  |
| `{{MediaUrl}}`     | Pseudo-URL del contenido multimedia entrante              |
| `{{MediaPath}}`    | Ruta local del contenido multimedia                       |
| `{{MediaType}}`    | Tipo de contenido multimedia (imagen/audio/documento/…)   |
| `{{Transcript}}`   | Transcripción del audio                                   |
| `{{Prompt}}`       | Prompt multimedia resuelto para las entradas de la CLI    |
| `{{MaxChars}}`     | Máximo de caracteres de salida resuelto para las entradas de la CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                                    |
| `{{GroupSubject}}` | Asunto del grupo (según disponibilidad)                   |
| `{{GroupMembers}}` | Vista previa de los miembros del grupo (según disponibilidad) |
| `{{SenderName}}`   | Nombre visible del remitente (según disponibilidad)       |
| `{{SenderE164}}`   | Número de teléfono del remitente (según disponibilidad)   |
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

- Archivo único: reemplaza el objeto contenedor.
- Matriz de archivos: se combinan en profundidad y en orden (los posteriores anulan a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (anulan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven con respecto al archivo que realiza la inclusión, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas o con `../` solo se permiten cuando siguen resolviéndose dentro de ese límite. Establezca `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución; cada archivo incluido tiene un límite de 2 MB.
- Las escrituras propiedad de OpenClaw que solo cambian una sección de nivel superior respaldada por una inclusión de archivo único escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja intacto `openclaw.json`.
- Las inclusiones raíz, las matrices de inclusiones y las inclusiones con anulaciones de claves hermanas son de solo lectura para las escrituras propiedad de OpenClaw; esas escrituras fallan de forma segura en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos ausentes, errores de análisis, inclusiones circulares, formato de ruta no válido y longitud excesiva.

---

## Contenido relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Doctor](/es/gateway/doctor)
