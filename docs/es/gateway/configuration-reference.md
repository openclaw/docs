---
read_when:
    - Necesita la semántica exacta de la configuración a nivel de campo o los valores predeterminados
    - Está validando bloques de configuración de canales, modelos, el Gateway o herramientas.
summary: Referencia de configuración del Gateway para las claves principales de OpenClaw, los valores predeterminados y los enlaces a referencias específicas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-07-12T14:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8a9141db733a6513778a7218933ee5989c62db11472ec6e1e70bd8bf3fcbac8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referencia a nivel de campo para `~/.openclaw/openclaw.json`: claves, valores predeterminados y enlaces a páginas más detalladas de los subsistemas. Para obtener orientación sobre la configuración orientada a tareas, consulte [Configuración](/es/gateway/configuration). Los catálogos de comandos propiedad de canales y plugins, así como las opciones avanzadas de memoria/QMD, se encuentran en sus propias páginas, no aquí.

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales; OpenClaw utiliza valores predeterminados seguros cuando se omiten.

El código prevalece sobre esta página:

- `openclaw config schema` imprime el esquema JSON activo utilizado para la validación y la interfaz de control, con los metadatos de paquetes, plugins y canales combinados.
- Los agentes deben invocar la acción `config.schema.lookup` de la herramienta `gateway` para obtener un único nodo de esquema correspondiente a una ruta exacta antes de editar la configuración.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de referencia de este documento con respecto a la superficie actual del esquema.

Referencias específicas detalladas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de dreaming en `plugins.entries.memory-core.config.dreaming`.
- [Comandos de barra diagonal](/es/tools/slash-commands) para consultar el catálogo actual de comandos integrados y empaquetados.
- Las páginas de los canales o plugins propietarios para las superficies de comandos específicas de cada canal.

---

## Canales

Las claves de configuración de cada canal se encuentran en [Configuración: canales](/es/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros canales empaquetados (autenticación, control de acceso, varias cuentas y activación mediante menciones).

## Valores predeterminados de los agentes, varios agentes, sesiones y mensajes

Consulte [Configuración: agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, contenido multimedia, Skills y entorno aislado)
- `multiAgent.*` (enrutamiento y vinculaciones de varios agentes)
- `session.*` (ciclo de vida de las sesiones, Compaction y depuración)
- `messages.*` (entrega de mensajes, TTS y renderizado de Markdown)
- `talk.*` (modo Conversación)
  - `talk.consultThinkingLevel`: sustitución del nivel de razonamiento para la ejecución completa del agente OpenClaw que sustenta las consultas en tiempo real de Conversación de la interfaz de control
  - `talk.consultFastMode`: sustitución puntual del modo rápido para las consultas en tiempo real de Conversación de la interfaz de control
  - `talk.speechLocale`: identificador de configuración regional BCP 47 opcional para el reconocimiento de voz de Conversación en iOS/macOS
  - `talk.silenceTimeoutMs`: cuando no se establece, Conversación conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: alternativa de retransmisión del Gateway para las transcripciones en tiempo real finalizadas de Conversación que omiten `openclaw_agent_consult`

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
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por identificador de proveedor.
- `models.providers.*.localService`: gestor de procesos opcional y bajo demanda para
  servidores de modelos locales. OpenClaw sondea el punto de conexión de estado configurado, inicia
  el `command` absoluto cuando es necesario, espera a que esté listo y, a continuación, envía la
  solicitud al modelo. Consulte [Servicios de modelos locales](/es/gateway/local-model-services).
- `models.pricing.enabled`: controla la inicialización de precios en segundo plano que
  comienza después de que los procesos auxiliares y los canales alcanzan el estado listo del Gateway. Cuando es `false`,
  el Gateway omite las consultas a los catálogos de precios de OpenRouter y LiteLLM; los valores
  `models.providers.*.models[].cost` configurados siguen funcionando para las estimaciones de costes locales.

## MCP

Las definiciones de servidores MCP administradas por OpenClaw se encuentran en `mcp.servers` y las
utilizan OpenClaw integrado y otros adaptadores de entorno de ejecución. Los comandos `openclaw mcp list`,
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

- `mcp.servers`: definiciones con nombre de servidores MCP stdio o remotos para entornos de ejecución que
  exponen las herramientas MCP configuradas.
  Las entradas remotas utilizan `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` es un alias nativo de la CLI que `openclaw mcp set` y
  `openclaw doctor --fix` normalizan en el campo canónico `transport`.
- `mcp.servers.<name>.enabled`: establezca `false` para conservar una definición de servidor guardada
  y excluirla a la vez del descubrimiento de MCP y de la proyección de herramientas de OpenClaw integrado.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: tiempo de espera de las solicitudes MCP por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: tiempo de espera de conexión por servidor
  en segundos o milisegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicación opcional de concurrencia para
  adaptadores que pueden decidir si realizan llamadas paralelas a herramientas MCP.
- `mcp.servers.<name>.auth`: establezca `"oauth"` para los servidores MCP HTTP que requieren
  OAuth. Ejecute `openclaw mcp login <name>` para almacenar los tokens en el estado de OpenClaw.
- `mcp.servers.<name>.oauth`: sustituciones opcionales del ámbito de OAuth, la URL de redirección y la URL
  de metadatos del cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS HTTP
  para puntos de conexión privados y TLS mutuo.
- `mcp.servers.<name>.toolFilter`: selección opcional de herramientas por servidor. `include`
  limita las herramientas MCP descubiertas a los nombres coincidentes; `exclude` oculta los nombres
  coincidentes. Las entradas son nombres exactos de herramientas MCP o patrones glob simples con `*`. Los servidores con
  recursos o indicaciones también generan nombres de herramientas auxiliares (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), y esos nombres utilizan el
  mismo filtro.
- `mcp.servers.<name>.codex`: controles opcionales de proyección del servidor de aplicaciones Codex.
  Este bloque contiene metadatos de OpenClaw únicamente para los hilos del servidor de aplicaciones Codex; no
  afecta a las sesiones ACP, la configuración genérica del entorno de Codex ni otros adaptadores de entorno de ejecución.
  Un valor no vacío de `codex.agents` limita el servidor a los identificadores de agentes OpenClaw indicados.
  Las listas de agentes dentro del ámbito que estén vacías, en blanco o no sean válidas se rechazan durante la validación
  de la configuración y se omiten en la ruta de proyección del entorno de ejecución, en lugar de convertirse en globales.
  `codex.defaultToolsApprovalMode` emite el valor nativo
  `default_tools_approval_mode` de Codex para ese servidor. OpenClaw elimina el bloque `codex`
  antes de pasar la configuración nativa `mcp_servers` a Codex. Omita el bloque para
  mantener el servidor proyectado para todos los agentes del servidor de aplicaciones Codex con el
  comportamiento predeterminado de aprobación de MCP de Codex.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para entornos de ejecución MCP empaquetados y asociados a sesiones.
  Las ejecuciones integradas puntuales solicitan la limpieza al finalizar la ejecución; este TTL sirve como respaldo para
  sesiones de larga duración y futuros invocadores.
- Los cambios en `mcp.*` se aplican en caliente mediante la eliminación de los entornos de ejecución MCP de sesión almacenados en caché.
  El siguiente descubrimiento o uso de herramientas los vuelve a crear a partir de la nueva configuración, por lo que las entradas
  eliminadas de `mcp.servers` se retiran inmediatamente en lugar de esperar al TTL de inactividad.
- El descubrimiento en tiempo de ejecución también respeta las notificaciones de cambios en la lista de herramientas MCP mediante la eliminación
  del catálogo almacenado en caché para esa sesión. Los servidores que anuncian recursos o
  indicaciones obtienen herramientas auxiliares para enumerar y leer recursos, así como para enumerar y recuperar
  indicaciones. Los fallos reiterados de llamadas a herramientas pausan brevemente el servidor afectado antes
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista opcional de elementos permitidos solo para Skills empaquetadas (no afecta a las Skills administradas o del espacio de trabajo).
- `load.extraDirs`: raíces adicionales de Skills compartidas (precedencia más baja).
- `load.allowSymlinkTargets`: raíces de destino reales y de confianza en las que pueden
  resolverse los enlaces simbólicos de Skills cuando el enlace se encuentra fuera de su raíz de origen configurada.
- `workshop.allowSymlinkTargetWrites`: permite que la aplicación del Taller de Skills escriba
  a través de destinos de enlaces simbólicos que ya sean de confianza (valor predeterminado: false).
- `install.preferBrew`: cuando es true, da preferencia a los instaladores de Homebrew si `brew` está
  disponible antes de recurrir a otros tipos de instaladores.
- `install.nodeManager`: preferencia del instalador de Node para las especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que los clientes de Gateway `operator.admin` de confianza
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (valor predeterminado: false). Esto solo habilita la ruta de archivos cargados; las instalaciones
  normales de ClawHub no lo requieren.
- `entries.<skillKey>.enabled: false` deshabilita una Skill aunque esté empaquetada o instalada.
- `entries.<skillKey>.apiKey`: opción práctica para las Skills que declaran una variable de entorno principal (cadena de texto sin formato u objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitan el descubrimiento de Skills y la indicación de Skills dirigida al modelo.
- La configuración de autonomía y aprobación del Taller de Skills (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) se documenta en [Configuración de Skills](/es/tools/skills-config).

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
- Coloque los archivos de plugins independientes en `plugins.load.paths`; las raíces de extensiones detectadas automáticamente omiten los archivos `.js`, `.mjs` y `.ts` de nivel superior para que los scripts auxiliares de esas raíces no bloqueen el inicio.
- La detección admite plugins nativos de OpenClaw, además de bundles compatibles de Codex y Claude, incluidos los bundles de Claude sin manifiesto con la disposición predeterminada.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins incluidos). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo práctico para la clave de API del plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que modifican el prompt del `before_agent_start` heredado, mientras conserva los valores heredados `modelOverride` y `providerOverride`. Se aplica a los hooks de plugins nativos y a los directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los plugins de confianza no incluidos en el bundle pueden leer el contenido sin procesar de la conversación desde hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar reemplazos de `provider` y `model` por ejecución en las ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para reemplazos de subagentes de confianza. Use `"*"` solo cuando desee permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confía explícitamente en este plugin para solicitar reemplazos de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para reemplazos de finalización LLM de plugins de confianza. Use `"*"` solo cuando desee permitir intencionadamente cualquier modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confía explícitamente en este plugin para ejecutar `api.runtime.llm.complete` con un identificador de agente no predeterminado.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado mediante el esquema del plugin nativo de OpenClaw cuando esté disponible).
- La configuración de cuentas y del entorno de ejecución de los plugins de canal se encuentra en `channels.<id>` y debe describirse mediante los metadatos `channelConfigs` del manifiesto del plugin propietario, no mediante un registro central de opciones de OpenClaw.

### Configuración del plugin del arnés de Codex

El plugin `codex` incluido es propietario de la configuración del arnés nativo del servidor de aplicaciones de Codex en
`plugins.entries.codex.config`. Consulte la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference) para conocer toda la superficie de configuración
y [Arnés de Codex](/es/plugins/codex-harness) para conocer el modelo de ejecución.

`codexPlugins` solo se aplica a las sesiones que seleccionan el arnés nativo de Codex.
No habilita plugins de Codex para ejecuciones de proveedores de OpenClaw, vinculaciones
de conversaciones ACP ni ningún arnés que no sea de Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita la compatibilidad
  nativa con plugins y aplicaciones de Codex para el arnés de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expone todas las
  aplicaciones actualmente accesibles conectadas a la cuenta autenticada de Codex en
  cada nuevo hilo nativo de Codex. Valor predeterminado: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política predeterminada de acciones destructivas para las solicitudes de las aplicaciones
  de plugins configuradas. Use `true` para aceptar esquemas seguros de aprobación de Codex
  sin preguntar, `false` para rechazarlos, `"auto"` para dirigir las aprobaciones requeridas
  por Codex a través de las aprobaciones de plugins de OpenClaw o `"ask"` para solicitar
  confirmación con cada acción destructiva o de escritura del plugin sin una aprobación
  persistente. El modo `"ask"` elimina los reemplazos persistentes de aprobación por
  herramienta de Codex para la aplicación afectada y selecciona al revisor humano de
  aprobaciones para esa aplicación antes de que se inicie el hilo de Codex.
  Valor predeterminado: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita una
  entrada de plugin configurada cuando el valor global `codexPlugins.enabled` también es verdadero.
  Valor predeterminado: `true` para las entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidad estable del marketplace, obligatoria junto con `pluginName` para cada
  entrada resuelta. Admite `"openai-curated"` y `"workspace-directory"`. Se
  ignoran las entradas a las que les falte cualquiera de los campos de identidad.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidad
  estable del plugin de Codex, obligatoria junto con `marketplaceName`. Una
  entrada `workspace-directory` debe usar el `summary.id` exacto, cualificado
  por el marketplace, que devuelve `plugin/list`; por ejemplo,
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  reemplazo de la política de acciones destructivas por plugin. Cuando se omite,
  se usa el valor global `allow_destructive_actions`. El valor por plugin admite
  las mismas políticas `true`, `false`, `"auto"` o `"ask"`.

Cada aplicación de plugin admitida que usa `"ask"` dirige las solicitudes de
aprobación de esa aplicación al revisor humano. Las demás aplicaciones y las
aprobaciones de hilos no relacionadas con aplicaciones conservan el revisor
configurado, por lo que las políticas mixtas de plugins no heredan el comportamiento de `"ask"`.

`codexPlugins.enabled` es la directiva global de habilitación. Las entradas
explícitas de plugins escritas por la migración constituyen el conjunto persistente
seleccionado de instalaciones y de elementos aptos para reparación. Las entradas
`workspace-directory` configuradas manualmente ya deben estar instaladas y habilitadas,
y sus aplicaciones propias deben ser accesibles; OpenClaw no las instala ni las
autentica. Si Codex rechaza la solicitud explícita del catálogo del espacio de trabajo,
las entradas habilitadas del espacio de trabajo se cierran de forma segura con
`marketplace_missing`, mientras que las entradas seleccionadas del catálogo predeterminado
siguen disponibles. `plugins["*"]` no es compatible, no existe ningún selector `install`
y los valores locales `marketplacePath` no son campos de configuración de forma
intencionada porque dependen del host. Consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins) para conocer los requisitos de
versión y disponibilidad del servidor de aplicaciones.

Las comprobaciones de disponibilidad de `app/list` se almacenan en caché durante una
hora y se actualizan de forma asíncrona cuando quedan obsoletas. La configuración de
aplicaciones del hilo de Codex se calcula al establecer la sesión del arnés de Codex,
no en cada turno; use `/new`, `/reset` o reinicie el Gateway después de cambiar la
configuración de plugins nativos.

`codexPlugins.allow_all_plugins` captura todas las aplicaciones de la cuenta que estén
accesibles en ese momento en cada nuevo hilo nativo de Codex. No instala plugins ni
aplicaciones, y las aplicaciones inaccesibles quedan excluidas. Las aplicaciones de la
cuenta usan la política global `codexPlugins.allow_destructive_actions`. Las entradas
explícitas de plugins tienen prioridad cuando la misma aplicación está presente en
ambas rutas. Si no se puede leer `app/list`, la exposición de toda la cuenta se cierra
de forma segura.

- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web de Firecrawl.
  - `apiKey`: clave de API de Firecrawl opcional para obtener límites más altos (acepta SecretRef). Como alternativa, usa `plugins.entries.firecrawl.config.webSearch.apiKey`, el valor heredado `tools.web.fetch.firecrawl.apiKey` o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (valor predeterminado: `https://api.firecrawl.dev`; los reemplazos autoalojados deben apuntar a endpoints privados o internos).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (valor predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de la caché en milisegundos (valor predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de extracción en segundos (valor predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (p. ej., `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de la memoria. Consulte [Dreaming](/es/concepts/dreaming) para conocer las fases y los umbrales.
  - `enabled`: selector principal de Dreaming (valor predeterminado: `false`).
  - `frequency`: cadencia Cron de cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - `model`: reemplazo opcional del modelo del subagente Dream Diary. Requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`; combínelo con `allowedModels` para restringir los destinos. Los errores de modelo no disponible vuelven a intentarse una vez con el modelo predeterminado de la sesión; los fallos de confianza o de la lista de permitidos no recurren silenciosamente a una alternativa.
  - La política y los umbrales de las fases son detalles de implementación (no son claves de configuración visibles para el usuario).
- La configuración completa de la memoria se encuentra en la [referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins habilitados de bundles de Claude también pueden aportar valores predeterminados integrados de OpenClaw desde `settings.json`; OpenClaw los aplica como configuración saneada del agente, no como parches de configuración de OpenClaw sin procesar.
- `plugins.slots.memory`: elija el identificador del plugin de memoria activo o `"none"` para deshabilitar los plugins de memoria.
- `plugins.slots.contextEngine`: elija el identificador del plugin activo del motor de contexto; el valor predeterminado es `"legacy"`, a menos que instale y seleccione otro motor.

Consulte [Plugins](/es/tools/plugin).

---

## Compromisos

`commitments` controla la memoria inferida de seguimiento: OpenClaw puede detectar comprobaciones de seguimiento en los turnos de conversación y entregarlas mediante ejecuciones de Heartbeat.

- `commitments.enabled`: habilita la extracción oculta mediante LLM, el almacenamiento y la entrega mediante Heartbeat de los compromisos inferidos de seguimiento. Valor predeterminado: `false`.
- `commitments.maxPerDay`: cantidad máxima de compromisos inferidos de seguimiento entregados por sesión de agente durante un día móvil. Valor predeterminado: `3`.

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
- `tabCleanup` recupera las pestañas del agente principal que estén bajo seguimiento después de un período de inactividad o cuando una
  sesión supera su límite. Establezca `idleMinutes: 0` o `maxTabsPerSession: 0` para
  deshabilitar individualmente esos modos de limpieza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está deshabilitado cuando no se especifica, por lo que la navegación del navegador se mantiene estricta de forma predeterminada.
- Establezca `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíe intencionadamente en la navegación del navegador por redes privadas.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de redes privadas durante las comprobaciones de accesibilidad y detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, use `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos solo permiten la conexión (inicio, detención y restablecimiento deshabilitados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Use HTTP(S) cuando quiera que OpenClaw detecte `/json/version`; use WS(S)
  cuando su proveedor le proporcione una URL directa de WebSocket de DevTools.
- `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs` se aplican a la accesibilidad CDP remota y
  `attachOnly`, además de a las solicitudes para abrir pestañas. Los perfiles de bucle invertido
  administrados mantienen los valores predeterminados de CDP local. La enumeración persistente de pestañas
  remotas de Playwright usa el valor mayor como plazo límite de la operación.
- Si se puede acceder a un servicio CDP administrado externamente mediante el bucle invertido, establezca
  `attachOnly: true` en ese perfil; de lo contrario, OpenClaw trata el puerto de bucle invertido como un
  perfil de navegador administrado localmente y puede informar de errores locales de propiedad del puerto.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden conectarse en
  el host seleccionado o mediante un Node de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para dirigirse a un
  perfil específico de un navegador basado en Chromium, como Brave o Edge.
- Los perfiles `existing-session` pueden establecer `cdpUrl` cuando Chrome ya se está ejecutando
  detrás de un endpoint de detección HTTP(S) de DevTools o de un endpoint directo WS(S). En ese
  modo, OpenClaw pasa el endpoint a Chrome MCP en lugar de usar la conexión automática;
  `userDataDir` se ignora para los argumentos de inicio de Chrome MCP.
- Los perfiles `existing-session` mantienen las limitaciones actuales de las rutas de Chrome MCP:
  acciones basadas en instantáneas y referencias en lugar de selección mediante selectores CSS, enlaces
  de carga para un solo archivo, sin anulaciones del tiempo de espera de los cuadros de diálogo, sin
  `wait --load networkidle` y sin `responsebody`, exportación a PDF, interceptación
  de descargas ni acciones por lotes.
- Los perfiles `openclaw` locales administrados asignan automáticamente `cdpPort` y `cdpUrl`; establezca
  `cdpUrl` explícitamente solo para perfiles CDP remotos o para conectarse al endpoint de una sesión existente.
- Los perfiles locales administrados pueden establecer `executablePath` para anular el valor global
  `browser.executablePath` de ese perfil. Úselo para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles locales administrados usan `browser.localLaunchTimeoutMs` para la detección HTTP de Chrome CDP
  después del inicio del proceso y `browser.localCdpReadyTimeoutMs` para
  comprobar la disponibilidad del WebSocket CDP tras el inicio. Aumente estos valores en hosts más lentos donde Chrome
  se inicia correctamente, pero las comprobaciones de disponibilidad se adelantan a la inicialización. Ambos valores deben ser
  enteros positivos de hasta `120000` ms; los valores de configuración no válidos se rechazan.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Tanto `browser.executablePath` como `browser.profiles.<name>.executablePath`
  aceptan `~` y `~/...` para el directorio principal del sistema operativo antes de iniciar Chromium.
  También se expande la tilde de `userDataDir` por perfil en los perfiles `existing-session`.
- Servicio de control: solo bucle invertido (puerto derivado de `gateway.port`, valor predeterminado `18791`).
- `extraArgs` añade indicadores de inicio adicionales al arranque local de Chromium (por ejemplo,
  `--disable-gpu`, el dimensionamiento de ventanas o indicadores de depuración).

---

## IU

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

- `seamColor`: color de énfasis para los elementos visuales de la IU de la aplicación nativa (tinte de la burbuja del modo de conversación, etc.).
- `assistant`: anulación de la identidad en la IU de control. Si no se establece, se usa la identidad del agente activo.

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
      mode: "off", // desactivado | servir | embudo
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // activa títulos de propósito generados por IA para las llamadas a herramientas (consume tokens del modelo de utilidad)
      // embedSandbox: "scripts", // estricto | scripts | de confianza
      // allowExternalEmbedUrls: false, // peligroso: permite URL http(s) externas absolutas para contenido incrustado
      // chatMessageMaxWidth: "min(1280px, 82%)", // ancho máximo opcional de la transcripción centrada del chat
      // allowedOrigins: ["https://control.example.com"], // obligatorio para una IU de control fuera del bucle invertido
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo peligroso de reserva del origen mediante el encabezado Host
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
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Valor predeterminado: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. De forma predeterminada, no está establecido y está deshabilitado.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Aprobación automática verificada mediante SSH. Valor predeterminado: habilitada (true).
        // Establezca false para deshabilitar únicamente la verificación SSH; esto no afecta a
        // autoApproveCidrs más arriba. Para vincular nodos únicamente de forma manual, establezca false Y
        // quite autoApproveCidrs. Pase un objeto para ajustar: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Denegaciones HTTP adicionales de /tools/invoke
      deny: ["browser"],
      // Elimina herramientas de la lista de denegación HTTP predeterminada para solicitantes propietarios o administradores
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

- `mode`: `local` (ejecutar el gateway) o `remote` (conectarse a un gateway remoto). El Gateway se niega a iniciarse a menos que sea `local`.
- `port`: puerto único multiplexado para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (IPv4 de Tailscale cuando esté disponible; de lo contrario, loopback) o `custom` (una dirección IPv4). Una dirección `tailnet` resuelta y cualquier dirección `custom` distinta de `127.0.0.1` o `0.0.0.0` requieren `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los listeners no puede vincularse. La exposición fuera de loopback sigue limitada a la interfaz seleccionada.
- **Alias de vinculación heredados**: use valores de modo de vinculación en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: la vinculación `loopback` predeterminada escucha en `127.0.0.1` dentro del contenedor. Con la red puente de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que no se puede acceder al gateway. Use `--network host` o establezca `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: obligatoria de forma predeterminada. Las vinculaciones fuera de loopback requieren autenticación del gateway. En la práctica, esto significa un token o una contraseña compartidos, o un proxy inverso con reconocimiento de identidad y `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` (incluidos los SecretRefs), establezca `gateway.auth.mode` explícitamente en `token` o `password`. El inicio y los flujos de instalación o reparación del servicio fallan cuando ambos están configurados y no se ha establecido el modo.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úselo únicamente en configuraciones locales de loopback de confianza; se omite intencionalmente de las indicaciones de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación del navegador o del usuario en un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)). De forma predeterminada, este modo espera un origen de proxy **fuera de loopback**; los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícitamente. Los llamadores internos del mismo host pueden usar `gateway.auth.password` como mecanismo alternativo local directo; `gateway.auth.token` sigue siendo mutuamente excluyente con el modo de proxy de confianza.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de la interfaz de control o WebSocket (verificada mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación mediante encabezados de Tailscale; en su lugar, siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token presupone que el host del gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de intentos de autenticación fallidos. Se aplica por IP del cliente y por ámbito de autenticación (el secreto compartido y el token del dispositivo se registran de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de registrar el fallo. Por lo tanto, los intentos incorrectos simultáneos del mismo cliente pueden activar el limitador en la segunda solicitud, en lugar de que ambos se procesen simultáneamente como simples discrepancias.
  - El valor predeterminado de `gateway.auth.rateLimit.exemptLoopback` es `true`; establézcalo en `false` cuando también quiera limitar intencionalmente la tasa del tráfico de localhost (para configuraciones de prueba o implementaciones estrictas de proxy).
- Los intentos de autenticación WS originados en el navegador siempre se limitan, con la exención de loopback desactivada (defensa en profundidad contra ataques de fuerza bruta a localhost desde el navegador).
- En loopback, esos bloqueos originados en el navegador se aíslan por cada valor
  `Origin` normalizado, por lo que los fallos repetidos desde un origen de localhost
  no bloquean automáticamente un origen diferente.
- `tailscale.mode`: `serve` (solo tailnet, vinculación de loopback) o `funnel` (público, requiere autenticación).
- `tailscale.serviceName`: nombre de servicio opcional de Tailscale para el modo Serve, como
  `svc:openclaw`. Cuando se establece, OpenClaw lo pasa a `tailscale serve
--service` para que la interfaz de control pueda exponerse mediante un servicio con nombre en lugar
  del nombre de host del dispositivo. El valor debe usar el formato de nombre de servicio `svc:<dns-label>`
  de Tailscale; el inicio informa de la URL de servicio derivada.
- `tailscale.preserveFunnel`: cuando es `true` y `tailscale.mode = "serve"`, OpenClaw
  comprueba `tailscale funnel status` antes de volver a aplicar Serve durante el inicio y lo omite
  si una ruta de Funnel configurada externamente ya cubre el puerto del gateway.
  Valor predeterminado: `false`.
- `controlUi.allowedOrigins`: lista explícita de orígenes de navegador permitidos para conexiones WebSocket del Gateway. Es obligatoria para orígenes públicos de navegador fuera de loopback. Las cargas de la interfaz privada de LAN o Tailnet con el mismo origen desde hosts de loopback, RFC1918/enlace local, `.local`, `.ts.net` o CGNAT de Tailscale se aceptan sin habilitar el mecanismo alternativo basado en el encabezado Host.
- `controlUi.toolTitles`: permite generar mediante IA títulos de propósito para las llamadas a herramientas en el chat de la interfaz de control. Valor predeterminado: `false` (la representación de herramientas sigue siendo totalmente determinista, sin llamadas al modelo en segundo plano). Cuando está habilitado, el método `chat.toolTitles` etiqueta las llamadas complejas mediante el enrutamiento estándar del modelo de utilidades —el `utilityModel` del agente (una decisión del operador que puede enviar argumentos acotados de herramientas al proveedor elegido, como cualquier tarea de utilidad) o el modelo pequeño predeterminado declarado por el proveedor de la sesión (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`)— y almacena los resultados en caché en la base de datos de estado de cada agente, de modo que las visualizaciones repetidas nunca vuelvan a generar cargos. `utilityModel: \"\"` deshabilita los títulos como cualquier otra tarea de utilidad; los títulos nunca recurren al modelo principal.
- `controlUi.chatMessageMaxWidth`: ancho máximo opcional para la transcripción centrada del chat de la interfaz de control. Acepta valores restringidos de ancho CSS, como `960px`, `82%`, `min(1280px, 82%)` y `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el mecanismo alternativo de origen basado en el encabezado Host para implementaciones que dependen intencionalmente de una política de origen basada en dicho encabezado.
- `terminal.enabled`: permite el terminal del operador con ámbito administrativo. Valor predeterminado: `false`. El terminal inicia un PTY del host en el espacio de trabajo del agente seleccionado, hereda el entorno del proceso del Gateway y se rechaza para agentes con `sandbox.mode: "all"`. Habilítelo únicamente en implementaciones con operadores de confianza; cambiarlo reinicia el Gateway y actualiza la política de seguridad de contenido de la interfaz de control.
- `terminal.shell`: ejecutable de shell opcional. Cuando no se establece, OpenClaw usa `$SHELL` en Unix y `%ComSpec%` en Windows.
- `terminal.detachedSessionTimeoutSeconds`: cuánto tiempo sobrevive una sesión de terminal después de que se interrumpa su conexión (recarga de la página, suspensión del portátil), permaneciendo disponible para volver a conectarse mediante `terminal.attach`, con su salida reciente reproducida. Valor predeterminado: `300`. Establézcalo en `0` para finalizar las sesiones en cuanto se interrumpa su conexión. Las sesiones desconectadas siguen ejecutando sus comandos, por lo que conviene reducir este valor en hosts compartidos o expuestos.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `wss://` en hosts públicos; el texto sin cifrar `ws://` solo se acepta para hosts de loopback, LAN, enlace local, `.local`, `.ts.net` y CGNAT de Tailscale.
- `remote.remotePort`: puerto del gateway en el host SSH remoto. El valor predeterminado es `18789`; úselo cuando el puerto del túnel local difiera del puerto del gateway remoto.
- `remote.sshHostKeyPolicy`: política de claves de host del túnel SSH de macOS. `strict` es el valor predeterminado y requiere una clave que ya sea de confianza. `openssh` es una activación explícita de la configuración efectiva de OpenSSH para alias administrados; revise la configuración SSH correspondiente del usuario y del sistema antes de usarla. La aplicación de macOS y `configure-remote` restablecen esta política a `strict` al cambiar de destino, salvo que se vuelva a aceptar explícitamente.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. Por sí solos, no configuran la autenticación del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relé APNs externo que se usa después de que las compilaciones de iOS respaldadas por relé publiquen los registros en el gateway. Las compilaciones públicas de App Store usan el relé alojado de OpenClaw. Las URL de relé personalizadas deben corresponder a una ruta de compilación o implementación de iOS deliberadamente independiente cuya URL de relé apunte a ese relé.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío del gateway al relé en milisegundos. El valor predeterminado es `10000`.
- Los registros respaldados por relé se delegan a una identidad específica del gateway. La aplicación iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relé y reenvía al gateway una autorización de envío limitada al registro. Otro gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales mediante variables de entorno para la configuración del relé indicada anteriormente.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape exclusiva para desarrollo para las URL HTTP de relé de loopback. Las URL de relé de producción deben seguir usando HTTPS.
- `gateway.handshakeTimeoutMs`: tiempo de espera del protocolo de enlace WebSocket previo a la autenticación del Gateway, en milisegundos. Valor predeterminado: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tiene precedencia cuando está establecido. Auméntelo en hosts con mucha carga o de baja potencia donde los clientes locales puedan conectarse mientras la fase de preparación del inicio aún se está estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado del canal, en minutos. Establézcalo en `0` para deshabilitar globalmente los reinicios del monitor de estado. Valor predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto, en minutos. Mantenga este valor mayor o igual que `gateway.channelHealthCheckMinutes`. Valor predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicios del monitor de estado por canal o cuenta en un periodo móvil de una hora. Valor predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal de los reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con varias cuentas. Cuando se establece, tiene precedencia sobre la anulación del canal.
- Las rutas de llamadas al gateway local solo pueden usar `gateway.remote.*` como mecanismo alternativo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que un mecanismo alternativo remoto lo oculte).
- `trustedProxies`: IP de proxies inversos que terminan TLS o insertan encabezados del cliente reenviado. Incluya únicamente proxies que controle. Las entradas de loopback siguen siendo válidas para configuraciones de proxy o detección local en el mismo host (por ejemplo, Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes de loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. El valor predeterminado es `false` para un comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDR/IP permitidos para aprobar automáticamente el emparejamiento inicial de dispositivos Node sin ámbitos solicitados. Está deshabilitada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador, navegador, interfaz de control o WebChat, ni aprueba automáticamente actualizaciones de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.pairing.sshVerify`: aprobación automática verificada mediante SSH para el emparejamiento inicial de dispositivos Node (valor predeterminado: habilitada). El gateway se conecta por SSH al host de emparejamiento (BatchMode, claves de host estrictas) y solo aprueba si la clave del dispositivo coincide exactamente con `openclaw node identity`. Tiene el mismo umbral de elegibilidad que `autoApproveCidrs`; las comprobaciones se limitan a direcciones de origen privadas o CGNAT, salvo que `cidrs` las anule. Establézcalo en `false` para deshabilitarlo o en `{ user, identity, timeoutMs, cidrs }` para ajustarlo. Consulte [Emparejamiento de Node](/es/gateway/pairing#ssh-verified-device-auto-approval-default).
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: configuración global de permisos y denegaciones para los comandos declarados del Node después del emparejamiento y de evaluar la lista de permitidos de la plataforma. Use `allowCommands` para habilitar expresamente comandos peligrosos del Node, como `camera.snap`, `camera.clip`, `screen.record`, `sms.search` y `sms.send`; `denyCommands` elimina un comando aunque, de otro modo, un valor predeterminado de la plataforma o un permiso explícito lo incluyeran. El permiso de SMS de Android y la autorización de comandos del Gateway son independientes. Después de que un Node cambie su lista de comandos declarados, rechace y vuelva a aprobar el emparejamiento de ese dispositivo para que el Gateway almacene la instantánea actualizada de comandos.
  - `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para la solicitud HTTP `POST /tools/invoke` (amplía la lista de denegación predeterminada).
  - `gateway.tools.allow`: elimina nombres de herramientas de la lista de denegación HTTP predeterminada para
  los solicitantes propietarios/administradores. Esto no concede acceso de propietario/administrador a los
  solicitantes `operator.write` que portan una identidad; `cron`, `gateway` y `nodes` siguen
  sin estar disponibles para los solicitantes que no sean propietarios, incluso cuando figuren en la lista de permitidos.

</Accordion>

### Endpoints compatibles con OpenAI

- RPC HTTP de administración: desactivado de forma predeterminada como el plugin `admin-http-rpc`. Active el plugin para registrar `POST /api/v1/admin/rpc`. Consulte [RPC HTTP de administración](/es/plugins/admin-http-rpc).
- Finalizaciones de chat: desactivadas de forma predeterminada. Actívelas con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API de respuestas: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de seguridad de entradas URL de respuestas:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se consideran no definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    o `gateway.http.endpoints.responses.images.allowUrl=false`, o ambas, para desactivar la obtención desde URL.
- Encabezado opcional de refuerzo de seguridad de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defínalo únicamente para orígenes HTTPS que controle; consulte [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de múltiples instancias

Ejecute varios gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Opciones prácticas: `--dev` (usa `~/.openclaw-dev` + el puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Múltiples gateways](/es/gateway/multiple-gateways).

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

- `enabled`: activa la terminación TLS en el listener del gateway (HTTPS/WSS) (valor predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado y clave autofirmados cuando no se configuran archivos explícitos; solo para uso local o de desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos al archivo de clave privada TLS; mantenga sus permisos restringidos.
- `caPath`: ruta opcional al paquete de CA para verificar clientes o usar cadenas de confianza personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // desactivada | reinicio | en caliente | híbrida
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla cómo se aplican en tiempo de ejecución las modificaciones de configuración.
  - `"off"`: ignora las modificaciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: siempre reinicia el proceso del gateway cuando cambia la configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciarlo.
  - `"hybrid"` (valor predeterminado): primero intenta una recarga en caliente; si es necesario, recurre al reinicio.
- `debounceMs`: intervalo de estabilización en ms antes de aplicar los cambios de configuración (entero no negativo; valor predeterminado: `300`).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar a que terminen las operaciones en curso antes de forzar un reinicio o una recarga en caliente del canal. Omítalo para usar la espera limitada predeterminada (`300000`); defina `0` para esperar indefinidamente y registrar periódicamente advertencias de que aún hay operaciones pendientes.

---

## Entornos de workers en la nube

Los workers en la nube son opcionales. Si `cloudWorkers` está ausente o `profiles` está vacío, OpenClaw no acepta la creación de nuevos workers. Los registros duraderos creados anteriormente siguen reconciliándose y permanecen visibles; la proyección existente del gateway/Node no cambia.

Cada proveedor de workers debe devolver una `hostKey` SSH desde una salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El arranque escribe esa clave en un archivo `known_hosts` aislado, usa `StrictHostKeyChecking=yes` y falla antes de abrir una conexión cuando el proveedor la omite. No existe un mecanismo alternativo de confianza en el primer uso.

La configuración del túnel se realiza bajo demanda en lugar de formar parte del aprovisionamiento. Cuando se inicia, el gateway reenvía en sentido inverso un socket Unix local del worker a su endpoint WebSocket de loopback. El socket reside en un directorio remoto asignado aleatoriamente y accesible solo por su propietario; a diferencia de un puerto TCP de loopback, otras cuentas de un worker multiusuario no pueden acceder a él y no puede entrar en conflicto con el puerto de otro entorno. Los mensajes de mantenimiento de conexión SSH y el retroceso de reconexión limitado solo se ejecutan mientras el propietario del túnel siga siendo el actual. Al detener el túnel, se bloquean las reconexiones antes de cerrar el proceso SSH.

El tráfico de control y la transferencia del espacio de trabajo usan conexiones SSH independientes. Ambos reutilizan la misma identidad resuelta y el archivo `known_hosts` fijado y aislado, pero la transferencia del espacio de trabajo no comparte la multiplexación de conexiones SSH con el túnel de larga duración, por lo que rsync no puede bloquear el tráfico de control.

### Perfil de Crabbox

El proveedor `crabbox` incluido aprovisiona una concesión compatible con SSH mediante la CLI local de Crabbox. El `settings.provider` interno selecciona el backend de Crabbox; es independiente del id de proveedor externo de OpenClaw.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Valor predeterminado; use "npm" solo para una versión publicada del gateway.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Ruta absoluta opcional. Valor predeterminado: ../crabbox/bin/crabbox adyacente y, después, PATH.
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
- `settings.ttl` y `settings.idleTimeout` (obligatorios): cadenas positivas de duración de Go que se pasan a `--ttl` y `--idle-timeout`. Estos mecanismos de seguridad del proveedor son distintos de la política `lifetime` almacenada por OpenClaw que se describe a continuación.
- `settings.binary`: ruta absoluta opcional al ejecutable de Crabbox. Si no se especifica, OpenClaw comprueba el checkout adyacente de Crabbox, luego las entradas ejecutables de `PATH` y, por último, invoca `crabbox` para que la ausencia de la CLI siga siendo un error visible del proveedor.

Las opciones desconocidas se rechazan. Crabbox sigue siendo responsable de las credenciales y de la configuración de cuenta específica del backend; no las coloque en `settings`. OpenClaw solo invoca la CLI local y este plugin no realiza llamadas de red al proveedor. El aprovisionamiento siempre pasa `--keep=true`; OpenClaw controla el ciclo de vida externo y destruye la concesión con `crabbox stop`.

<Warning>
  OpenClaw resuelve la ruta `sshKey` local de la concesión de Crabbox mediante el mecanismo de resolución de secretos propiedad del proveedor. La salida actual de `crabbox inspect --json` no expone una `sshHostKey` aprovisionada, por lo que los workers respaldados por Crabbox todavía fallan de forma segura antes del arranque o de la configuración del túnel. Crabbox debe aprovisionar una clave de host autoritativa por concesión y devolver `sshHostKey` exactamente como `algorithm base64`, sin nombre de host ni comentario. Su caché local de la concesión `known_hosts` actual no constituye material de confianza de aprovisionamiento.
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

- `profiles`: perfiles de workers con nombre e ids no vacíos y sin espacios en blanco en los extremos. Cada perfil selecciona un proveedor registrado por un plugin.
- `provider`: id de proveedor de workers no vacío. Los ejemplos usan el proveedor `crabbox` incluido y el proveedor `static-ssh` del laboratorio de control de calidad.
- `install`: método de instalación del worker. `"bundle"` (valor predeterminado) transfiere un paquete con hash de contenido de la compilación instalada del gateway y admite versiones publicadas, de desarrollo y no publicadas. `"npm"` es una optimización opcional para una versión empaquetada sin modificar; instala `openclaw@<exact gateway version>` desde el registro público de npm y nunca instala `latest`.
- Los plugins de proveedores incluidos se seleccionan automáticamente cuando están configurados, pero las desactivaciones explícitas y `plugins.allow` siguen aplicándose. Incluya el id del proveedor (por ejemplo, `crabbox`) cuando se configure una lista de permitidos. Los plugins de proveedores externos también deben estar instalados y habilitados explícitamente.
- `settings`: JSON limitado y propiedad del proveedor. El plugin seleccionado define y valida sus claves; use [objetos SecretRef](/es/gateway/secrets) para los valores que contienen secretos. El proveedor SSH estático requiere `host`, `user`, `hostKey` y `keyRef`; el valor predeterminado de `port` es `22`. `hostKey` debe ser una línea de clave pública de host OpenSSH (`algorithm base64`) obtenida del host conocido o de otro canal de confianza, sin prefijo de opciones.
- `lifetime.idleTimeoutMinutes`: minutos expresados como entero positivo y almacenados para la política posterior de recuperación por inactividad.
- `lifetime.maxLifetimeMinutes`: minutos expresados como entero positivo y almacenados para la política posterior de ciclo de vida.

En el worker ya debe estar instalado un entorno de ejecución de Node compatible (22.19+, 23.11+ o 24+). El método opcional `"npm"` también requiere `npm` y acceso HTTPS saliente al registro público de npm. La configuración de cadenas de herramientas en red es una política del proveedor; el arranque informa de un error accionable en lugar de instalar las cadenas de herramientas por sí mismo.

Esta base instala y verifica la compilación del gateway y proporciona el ciclo de vida de inicio y detención del túnel, pero no inicia la CLI general de OpenClaw. El punto de entrada autónomo del worker y el bucle se incorporarán en el siguiente hito de workers en la nube.

Cada registro de entorno duradero conserva sus opciones de proveedor validadas, el método de instalación resuelto y la política de ciclo de vida en una instantánea del perfil tomada en el momento de la creación. Cambiar o eliminar un perfil con nombre afecta a las nuevas creaciones; los registros existentes continúan reconciliando su ciclo de vida con esa instantánea, siempre que el plugin propietario siga disponible.

Los valores de ciclo de vida son solo datos en la primera versión de workers en la nube; la aplicación automática se incorporará con trabajos posteriores sobre el ciclo de vida. Los cambios de perfil requieren reiniciar el gateway.

<Warning>
  El proveedor `static-ssh` es un entorno de desarrollo del laboratorio de control de calidad del árbol de código fuente y se excluye de las distribuciones empaquetadas. Un worker que se ejecute en su host compartido puede leer datos no relacionados del host, por lo que este proveedor no debe utilizarse como límite de aislamiento en producción.
  Su operador debe proporcionar la `hostKey` esperada; OpenClaw no aprenderá ni aceptará una clave de la primera conexión.
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
Se rechazan los tokens de hooks en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser distinto de la autenticación activa mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); al detectar su reutilización, el inicio registra una advertencia de seguridad no fatal.
- `openclaw security audit` marca la reutilización de la autenticación de hooks/Gateway como un hallazgo crítico, incluida la autenticación del Gateway mediante contraseña proporcionada únicamente durante la auditoría (`--auth password --password <password>`). Ejecute `openclaw doctor --fix` para rotar un `hooks.token` persistido que se haya reutilizado y, después, actualice los emisores externos de hooks para que usen el nuevo token de hook.
- `hooks.path` no puede ser `/`; use una subruta dedicada, como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por ejemplo, `["hook:"]`).
- Si una asignación o un preajuste usa un `sessionKey` basado en plantilla, establezca `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves de asignación estáticas no requieren esa habilitación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - El `sessionKey` de la carga útil de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (valor predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores de `sessionKey` de asignaciones renderizados mediante plantillas se consideran proporcionados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de las asignaciones">

- `match.path` coincide con la subruta posterior a `/hooks` (p. ej., `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen datos de la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan las rutas absolutas y el recorrido de directorios).
  - Mantenga `hooks.transformsDir` dentro de `~/.openclaw/hooks/transforms`; se rechazan los directorios de Skills del espacio de trabajo. Si `openclaw doctor` informa que esta ruta no es válida, mueva el módulo de transformación al directorio de transformaciones de hooks o elimine `hooks.transformsDir`.
- `agentId` dirige la solicitud a un agente específico; los identificadores desconocidos recurren al agente predeterminado.
- `allowedAgentIds`: restringe el direccionamiento efectivo de agentes, incluida la ruta del agente predeterminado cuando se omite `agentId` (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agentes mediante hooks sin un `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` y las claves de sesión de asignaciones controladas por plantillas establezcan `sessionKey` (valor predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de prefijos permitidos opcional para valores explícitos de `sessionKey` (solicitud + asignación), p. ej., `["hook:"]`. Pasa a ser obligatoria cuando cualquier asignación o preajuste usa un `sessionKey` basado en plantilla.
- `deliver: true` envía la respuesta final a un canal; el valor predeterminado de `channel` es `last`.
- `model` sustituye el LLM para esta ejecución del hook (debe estar permitido si se ha configurado el catálogo de modelos).

</Accordion>

### Integración con Gmail

- El preajuste integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantiene ese direccionamiento por mensaje, establezca `hooks.allowRequestSessionKey: true` y restrinja `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo, `["hook:", "hook:gmail:"]`.
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

- El Gateway inicia automáticamente `gog gmail watch serve` durante el arranque cuando está configurado. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para deshabilitarlo.
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
            // habilitado: false, // o OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Sirve HTML/CSS/JS editable por agentes y A2UI mediante HTTP en el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantenga `gateway.bind: "loopback"` (valor predeterminado).
- En enlaces que no sean de bucle invertido, las rutas de Canvas requieren autenticación del Gateway (token/contraseña/proxy de confianza), al igual que las demás superficies HTTP del Gateway.
- Normalmente, las WebViews de Node no envían encabezados de autenticación; después de que un Node se empareje y conecte, el Gateway anuncia URL de capacidades con ámbito de Node para acceder a Canvas/A2UI.
- Las URL de capacidades están vinculadas a la sesión WS activa del Node y caducan rápidamente. No se usa una alternativa basada en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un archivo inicial `index.html` cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Deshabilite la recarga en vivo para directorios grandes o errores `EMFILE`.

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
- `full`: incluye `cliPath` + `sshPort`; la difusión de anuncios de multidifusión en la LAN aún requiere que esté habilitado el plugin `bonjour` incluido.
- `off`: suprime la difusión de anuncios de multidifusión en la LAN sin cambiar la habilitación del plugin.
- El plugin `bonjour` incluido se inicia automáticamente en hosts macOS y requiere habilitación explícita en Linux, Windows y despliegues del Gateway en contenedores.
- El nombre del host usa de forma predeterminada el nombre de host del sistema cuando es una etiqueta DNS válida y recurre a `openclaw` en caso contrario. Sustitúyalo con `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita por completo los anuncios mDNS y prevalece sobre `discovery.mdns.mode`.

### Área extensa (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unidifusión en `~/.openclaw/dns/`. Para la detección entre redes, combínela con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

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

- Las variables de entorno en línea solo se aplican si la variable no está presente en el entorno del proceso.
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sustituye las variables existentes).
- `shellEnv`: importa las variables esperadas que falten desde el perfil del shell de inicio de sesión.
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

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables ausentes o vacías producen un error al cargar la configuración.
- Use `$${VAR}` como escape para obtener un `${VAR}` literal.
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
- Patrón de identificador para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores `secret#json_key` al estilo de AWS)
- Los identificadores de `source: "exec"` no deben contener segmentos de ruta `.` o `..` delimitados por barras (por ejemplo, se rechaza `a/../b`)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` se aplica a las rutas de credenciales compatibles de `openclaw.json`.
- Las referencias de `auth-profiles.json` se incluyen en la resolución durante la ejecución y en la cobertura de auditoría.

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
- Las rutas de los proveedores file y exec aplican un cierre seguro cuando la verificación de ACL de Windows no está disponible. Establezca `allowInsecurePath: true` únicamente para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comandos que sean enlaces simbólicos. Establezca `allowSymlinkCommand: true` para permitir rutas de enlaces simbólicos mientras se valida la ruta de destino resuelta.
- Si se configura `trustedDirs`, la comprobación de directorios de confianza se aplica a la ruta de destino resuelta.
- El entorno secundario de `exec` es mínimo de forma predeterminada; pase explícitamente las variables necesarias mediante `passEnv`.
- Las referencias a secretos se resuelven durante la activación en una instantánea en memoria y, después, las rutas de solicitudes solo leen esa instantánea.
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
- Las asignaciones planas heredadas de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, no son un formato de ejecución; `openclaw doctor --fix` las reescribe como perfiles canónicos de clave de API `provider:default` y crea una copia de seguridad `.legacy-flat.*.bak`.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfiles de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de ejecución proceden de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se eliminan al detectarse.
- Las importaciones heredadas de OAuth proceden de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/es/concepts/oauth).
- Comportamiento de los secretos durante la ejecución y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

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
  facturación/crédito insuficiente (valor predeterminado: `5`). El texto explícito de facturación puede
  seguir llegando aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos
  del proveedor permanecen limitados al proveedor al que pertenecen (por ejemplo,
  `Key limit exceeded` de OpenRouter). Los mensajes reintentables de HTTP `402` sobre ventanas de uso o
  límites de gasto de la organización/espacio de trabajo permanecen en la ruta `rate_limit`.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para las horas de espera por facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial de la espera por facturación (valor predeterminado: `24`).
- `authPermanentBackoffMinutes`: espera base en minutos para fallos `auth_permanent` de alta confianza (valor predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento de la espera de `auth_permanent` (valor predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas utilizada para los contadores de espera (valor predeterminado: `24`).
- `overloadedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al modelo alternativo (valor predeterminado: `1`). Los formatos de proveedor ocupado, como `ModelNotReadyException`, llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (valor predeterminado: `0`).
- `rateLimitedProfileRotations`: número máximo de rotaciones de perfiles de autenticación del mismo proveedor para errores de límite de frecuencia antes de cambiar al modelo alternativo (valor predeterminado: `1`). Ese grupo de límites de frecuencia incluye texto con formato específico del proveedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

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

El Gateway registra eventos de auditoría **solo de metadatos** para las ejecuciones del agente y las
acciones de herramientas en la base de datos de estado compartida. Los metadatos del ciclo de vida de
los mensajes son una opción independiente que debe habilitarse explícitamente. El registro almacena
identidad, tiempos, nombres de herramientas y resultados normalizados, pero nunca prompts, cuerpos de
mensajes, argumentos de herramientas, resultados ni texto de error sin procesar. Las filas de mensajes
no almacenan identificadores sin procesar de cuentas de plataforma, conversaciones, mensajes ni
destinos. Las claves de sesión de ejecuciones/herramientas siguen disponibles para correlación y pueden
contener identificadores de cuentas de plataforma o de interlocutores. Los registros caducan después
de 30 días y el registro está limitado a 100,000 filas. Consúltelos con
[`openclaw audit`](/es/cli/audit) o mediante el RPC de Gateway
[`audit.activity.list`](/es/gateway/protocol#audit-ledger-rpc). Consulte
[Historial de auditoría](/es/gateway/audit) para conocer el modelo de datos completo, la semántica de
privacidad y los límites de cobertura.

- `enabled`: registra nuevos eventos de auditoría (valor predeterminado: `true`). El registro está
  activado de forma predeterminada porque una pista de auditoría habilitada solo después de un incidente
  no puede explicar dicho incidente. Establecerlo en `false` detiene la inserción de nuevos eventos
  después de reiniciar el Gateway; los registros existentes permanecen legibles hasta que caducan.
  Volver a activarlo reanuda el registro desde ese momento; el intervalo sin datos no se rellena
  retroactivamente.
- `messages`: ámbito de los metadatos de mensajes (valor predeterminado: `"off"`). `"direct"` registra
  únicamente las conversaciones directas conocidas. `"all"` también registra grupos, canales y tipos
  de conversación desconocidos. Ambos modos permanecen libres de contenido y sustituyen los
  identificadores sin procesar por seudónimos con clave locales de la instalación cuando la correlación
  está disponible. Estos facilitan la correlación, pero no constituyen anonimización; la base de datos
  de estado almacena la clave de derivación, pero las exportaciones RPC y CLI no.

El Gateway en ejecución captura `audit.enabled` y `audit.messages` al iniciarse; reinícielo después de
cambiar cualquiera de los ajustes. Actualmente, la cobertura de mensajes incluye los mensajes entrantes
aceptados que alcanzan el despacho central y una fila terminal por cada carga útil lógica original de
respuesta saliente que alcanza la entrega duradera compartida. Las rutas locales de Plugin y de envío
directo que omiten esos límites compartidos todavía no están cubiertas. El escritor en segundo plano
acotado funciona según el mejor esfuerzo y no es un archivo de cumplimiento sin pérdidas.

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
- `consoleLevel` aumenta a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro activo en bytes antes de la rotación (entero positivo; valor predeterminado: `104857600` = 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al archivo activo.
- `redactSensitive` / `redactPatterns`: enmascaramiento según el mejor esfuerzo para la salida de consola, los registros de archivo, los registros OTLP y el texto persistente de las transcripciones de sesión. `redactSensitive: "off"` solo deshabilita esta política general de registros/transcripciones; las superficies de seguridad de la interfaz de usuario, herramientas y diagnósticos siguen ocultando los secretos antes de emitirlos.

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

- `enabled`: interruptor principal para la salida de instrumentación (valor predeterminado: `true`).
- `flags`: matriz de cadenas de indicadores que habilitan una salida de registro específica (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad sin progreso en ms para clasificar las sesiones de procesamiento de larga duración como `session.long_running`, `session.stalled` o `session.stuck` (valor predeterminado: `120000`). El progreso de respuestas, herramientas, estados, bloques y ACP reinicia el temporizador; los diagnósticos `session.stuck` repetidos aumentan su intervalo de espera mientras no haya cambios.
- `stuckSessionAbortMs`: umbral de antigüedad sin progreso en ms antes de que el trabajo activo bloqueado que cumpla los requisitos pueda drenarse mediante cancelación para su recuperación. Cuando no se establece, OpenClaw utiliza la ventana ampliada y más segura para ejecuciones integradas, de al menos 5 minutos y 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura una instantánea redactada de estabilidad previa a OOM cuando la presión de memoria alcanza `critical` (valor predeterminado: `false`). Establézcalo en `true` para añadir el escaneo y la escritura del archivo del paquete de estabilidad, manteniendo los eventos normales de presión de memoria.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (valor predeterminado: `false`). Para conocer la configuración completa, el catálogo de señales y el modelo de privacidad, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- `otel.endpoint`: URL del recopilador para la exportación de OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionales específicos de cada señal. Cuando se establecen, anulan `otel.endpoint` únicamente para esa señal.
- `otel.protocol`: `"http/protobuf"` (valor predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con las solicitudes de exportación de OTel.
- `otel.serviceName`: nombre del servicio para los atributos del recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o registros.
- `otel.logsExporter`: destino de exportación de registros: `"otlp"` (valor predeterminado), `"stdout"` para un objeto JSON por línea de salida estándar o `"both"`.
- `otel.sampleRate`: tasa de muestreo de trazas de `0` a `1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para los atributos de los intervalos OTEL. Está desactivada de forma predeterminada. El valor booleano `true` captura el contenido no perteneciente al sistema de mensajes/herramientas; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` y `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: variable de entorno para habilitar el formato experimental más reciente de los intervalos de inferencia GenAI, incluidos los nombres de intervalo `{gen_ai.operation.name} {gen_ai.request.model}`, el tipo de intervalo `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. De forma predeterminada, los intervalos conservan `openclaw.model.call` y `gen_ai.system` por compatibilidad; las métricas de GenAI utilizan atributos semánticos acotados.
- `OPENCLAW_OTEL_PRELOADED=1`: variable de entorno para hosts que ya han registrado un SDK global de OpenTelemetry. En ese caso, OpenClaw omite el inicio y el cierre del SDK propiedad del Plugin, pero mantiene activos los agentes de escucha de diagnóstico.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` y `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variables de entorno de endpoints específicas de cada señal utilizadas cuando no se ha establecido la clave de configuración correspondiente.
- `cacheTrace.enabled`: registra instantáneas de trazas de caché para ejecuciones integradas (valor predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para la traza de caché JSONL (valor predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan lo que se incluye en la salida de la traza de caché (todos tienen como valor predeterminado `true`).

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

- `channel`: canal de publicación: `"stable"`, `"extended-stable"`, `"beta"` o `"dev"`. La versión estable ampliada solo se aplica al paquete: los comandos en primer plano controlan la instalación, mientras que el Gateway puede emitir sugerencias de actualización de solo lectura.
- `checkOnStart`: comprueba si hay actualizaciones de npm cuando se inicia el Gateway (valor predeterminado: `true`). Las selecciones de versión estable ampliada almacenadas utilizan la misma sugerencia de solo lectura y el mismo calendario de sugerencias de 24 horas.
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes estables y beta (valor predeterminado: `false`). La versión estable ampliada nunca se aplica automáticamente.
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente el canal estable (valor predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional en horas para distribuir el despliegue del canal estable (valor predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia en horas con la que se ejecutan las comprobaciones del canal beta (valor predeterminado: `1`; máximo: `24`). Los ajustes de retraso/variación del canal estable y de sondeo beta no se aplican a la versión estable ampliada.

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

- `enabled`: puerta de activación global de la funcionalidad ACP (valor predeterminado: `true`; establezca `false` para ocultar las opciones de envío y creación de ACP).
- `dispatch.enabled`: puerta independiente para el envío de turnos de sesión ACP (valor predeterminado: `true`). Establezca `false` para mantener disponibles los comandos ACP y bloquear la ejecución.
- `backend`: id. predeterminado del backend de entorno de ejecución ACP (debe coincidir con un plugin de entorno de ejecución ACP registrado).
  Instale primero el plugin de backend y, si se establece `plugins.allow`, incluya el id. del plugin de backend (por ejemplo, `acpx`) o el backend ACP no se cargará.
- `fallbacks`: lista ordenada de id. de backends ACP alternativos que se prueban cuando el backend principal falla anticipadamente con un error aparentemente transitorio (no disponible, límite de solicitudes alcanzado, cuota agotada o sobrecarga) antes de producir cualquier salida. Cada entrada debe coincidir con el backend de un plugin de entorno de ejecución ACP registrado.
- `defaultAgent`: id. del agente de destino ACP alternativo cuando las creaciones no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de id. de agentes autorizados para las sesiones del entorno de ejecución ACP; si está vacía, no hay ninguna restricción adicional.
- `maxConcurrentSessions`: número máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: intervalo de vaciado por inactividad, en ms, para el texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección de bloques transmitidos.
- `stream.repeatSuppression`: suprime las líneas de estado/herramientas repetidas en cada turno (valor predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador que precede al texto visible después de eventos de herramientas ocultos (valor predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: número máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: número máximo de caracteres para las líneas proyectadas de estado/actualización de ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas y sus anulaciones booleanas de visibilidad para los eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad, en minutos, para los procesos de trabajo de sesiones ACP antes de que puedan limpiarse.
- `runtime.installCommand`: comando de instalación opcional que se ejecutará al inicializar un entorno de ejecución ACP.

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

Consulte los campos de identidad de `agents.list` en [Valores predeterminados del agente](/es/gateway/config-agents#agent-defaults).

---

## Puente (heredado, eliminado)

Las compilaciones actuales ya no incluyen el puente TCP. Los nodos se conectan mediante el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminan; `openclaw doctor --fix` puede quitar las claves desconocidas).

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
    maxConcurrentRuns: 8, // valor predeterminado; despacho de cron + ejecución aislada del turno del agente de cron
    webhook: "https://example.invalid/legacy", // alternativa obsoleta para trabajos almacenados con notify:true
    webhookToken: "replace-with-dedicated-token", // token de portador opcional para la autenticación de Webhook saliente
    sessionRetention: "24h", // cadena de duración o false
    runLog: {
      maxBytes: "2mb", // valor predeterminado: 2_000_000 bytes
      keepLines: 2000, // valor predeterminado: 2000
    },
  },
}
```

- `sessionRetention`: tiempo durante el cual se conservan las sesiones completadas de ejecuciones aisladas de cron antes de depurar las filas de sesión de SQLite. También controla la limpieza de las transcripciones archivadas de cron eliminadas. Valor predeterminado: `24h`; establezca `false` para deshabilitarla.
- `runLog.maxBytes`: se acepta por compatibilidad con los registros de ejecuciones de cron antiguos basados en archivos. Valor predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: filas más recientes del historial de ejecuciones de SQLite que se conservan por trabajo. Valor predeterminado: `2000`.
- `webhookToken`: token de portador utilizado para la entrega POST del Webhook de cron (`delivery.mode = "webhook"`); si se omite, no se envía ningún encabezado de autenticación.
- `webhook`: URL de Webhook alternativa heredada y obsoleta (http/https) utilizada por `openclaw doctor --fix` para migrar trabajos almacenados que aún tienen `notify: true`; la entrega en tiempo de ejecución usa `delivery.mode="webhook"` junto con `delivery.to` para cada trabajo, o `delivery.completionDestination` cuando se conserva la entrega de anuncios.

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

- `maxAttempts`: número máximo de reintentos para trabajos de cron en caso de errores transitorios (valor predeterminado: `3`; intervalo: `0`-`10`).
- `backoffMs`: matriz de demoras de espera en ms para cada intento de reintento (valor predeterminado: `[30000, 60000, 300000]`; de 1 a 10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítalo para reintentar todos los tipos transitorios.

Los trabajos de ejecución única permanecen habilitados hasta que se agotan los intentos de reintento; después se deshabilitan y conservan el estado de error final. Los trabajos recurrentes utilizan la misma política de reintentos transitorios para volver a ejecutarse después de la espera y antes de su siguiente intervalo programado; los errores permanentes o el agotamiento de los reintentos transitorios hacen que se vuelva a la programación recurrente normal con espera por errores.

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

- `enabled`: habilita las alertas de fallo para los trabajos de cron (valor predeterminado: `false`).
- `after`: número de fallos consecutivos antes de que se active una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: cantidad mínima de milisegundos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `includeSkipped`: contabiliza las ejecuciones omitidas consecutivas para el umbral de alerta (valor predeterminado: `false`). Las ejecuciones omitidas se registran por separado y no afectan a la espera por errores de ejecución.
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

- Destino predeterminado para las notificaciones de fallos de cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; el valor predeterminado es `"announce"` cuando existen suficientes datos del destino.
- `channel`: canal alternativo para la entrega de anuncios. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino de anuncio explícito o URL del Webhook. Obligatorio para el modo Webhook.
- `accountId`: cuenta alternativa opcional para la entrega.
- El valor de `delivery.failureDestination` de cada trabajo sustituye este valor predeterminado global.
- Cuando no se establece ningún destino de fallo global ni por trabajo, los trabajos que ya realizan entregas mediante `announce` recurren a ese destino de anuncio principal en caso de fallo.
- `delivery.failureDestination` solo se admite para trabajos con `sessionTarget="isolated"`, a menos que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulte [Trabajos de cron](/es/automation/cron-jobs). Las ejecuciones aisladas de cron se registran como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla del modelo multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                                   |
| ------------------ | ------------------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante                           |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente)   |
| `{{BodyStripped}}` | Cuerpo sin menciones de grupo                                  |
| `{{From}}`         | Identificador del remitente                                    |
| `{{To}}`           | Identificador del destino                                      |
| `{{MessageSid}}`   | Identificador del mensaje del canal                            |
| `{{SessionId}}`    | UUID de la sesión actual                                       |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva                       |
| `{{MediaUrl}}`     | Pseudo-URL del contenido multimedia entrante                   |
| `{{MediaPath}}`    | Ruta local del contenido multimedia                            |
| `{{MediaType}}`    | Tipo de contenido multimedia (imagen/audio/documento/…)        |
| `{{Transcript}}`   | Transcripción del audio                                        |
| `{{Prompt}}`       | Prompt multimedia resuelto para entradas de la CLI             |
| `{{MaxChars}}`     | Número máximo resuelto de caracteres de salida para la CLI     |
| `{{ChatType}}`     | `"direct"` o `"group"`                                         |
| `{{GroupSubject}}` | Asunto del grupo (en la medida de lo posible)                  |
| `{{GroupMembers}}` | Vista previa de los miembros del grupo (en la medida de lo posible) |
| `{{SenderName}}`   | Nombre visible del remitente (en la medida de lo posible)      |
| `{{SenderE164}}`   | Número de teléfono del remitente (en la medida de lo posible)  |
| `{{Provider}}`     | Indicación del proveedor (whatsapp, telegram, discord, etc.)   |

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

**Comportamiento de combinación:**

- Archivo único: sustituye el objeto contenedor.
- Matriz de archivos: se combinan en profundidad y en orden (los posteriores sustituyen a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (sustituyen los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven de forma relativa al archivo que realiza la inclusión, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas o con `../` solo se permiten cuando siguen resolviéndose dentro de ese límite. Establezca `OPENCLAW_INCLUDE_ROOTS` (rutas absolutas) para permitir raíces adicionales fuera del directorio de configuración.
- Límites: las rutas no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución; cada archivo incluido está limitado a 2 MB.
- Las escrituras propiedad de OpenClaw que solo modifican una sección de nivel superior respaldada por una inclusión de archivo único se escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja `openclaw.json` intacto.
- Las inclusiones raíz, las matrices de inclusiones y las inclusiones con sustituciones de claves hermanas son de solo lectura para las escrituras propiedad de OpenClaw; esas escrituras se cierran de forma segura en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitud excesiva.

---

## Temas relacionados

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Doctor](/es/gateway/doctor)
