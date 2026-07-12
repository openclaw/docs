---
read_when:
    - Estás creando un nuevo plugin de proveedor de modelos
    - Quieres añadir un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Debes comprender la autenticación de proveedores, los catálogos y los hooks de ejecución
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedores
x-i18n:
    generated_at: "2026-07-11T23:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Crea un plugin de proveedor para añadir un proveedor de modelos (LLM) a OpenClaw: un catálogo de modelos, autenticación mediante clave de API y resolución dinámica de modelos.

<Info>
  ¿Es tu primera vez con los plugins de OpenClaw? Lee primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los plugins de proveedor añaden modelos al bucle de inferencia normal de OpenClaw. Si el
  modelo debe ejecutarse mediante un demonio de agente nativo que administra hilos, Compaction
  o eventos de herramientas, combina el proveedor con un [entorno de ejecución de
  agentes](/es/plugins/sdk-agent-harness), en lugar de incluir en el núcleo los detalles del
  protocolo del demonio.
</Tip>

## Guía paso a paso

<Steps>
  <Step title="Paquete y manifiesto">
    ### Paso 1: Paquete y manifiesto

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Proveedor de modelos de Acme AI",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Clave de API de Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Clave de API de Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` permite que OpenClaw detecte las credenciales sin
    cargar el entorno de ejecución de tu plugin. Añade `providerAuthAliases` cuando una variante
    de proveedor deba reutilizar la autenticación del identificador de otro proveedor. `modelSupport` es
    opcional y permite que OpenClaw cargue automáticamente tu plugin de proveedor a partir de
    identificadores abreviados de modelos, como `acme-large`, antes de que existan los enlaces de
    ejecución. `openclaw.compat` y `openclaw.build` en `package.json` son obligatorios para
    publicar en ClawHub (`openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`
    son los dos campos obligatorios; `minGatewayVersion` usa
    `openclaw.install.minHostVersion` como valor alternativo cuando se omite).

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor de texto mínimo necesita un `id`, una `label`, `auth` y un `catalog`.
    `catalog` es el enlace de ejecución/configuración propiedad del proveedor; puede llamar a las API
    activas del proveedor y devuelve entradas de `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` es la interfaz de catálogo más reciente del plano de control
    para la interfaz de usuario de listas, ayuda y selectores; abarca filas de `text`, `voice`, `image_generation`,
    `video_generation` y `music_generation`. Mantén en el plugin las llamadas a los
    puntos de conexión del proveedor y la asignación de respuestas; OpenClaw administra la forma
    compartida de las filas, las etiquetas de origen y la presentación de la ayuda.

    Esto constituye un proveedor funcional. Los usuarios ahora pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como modelo.

    ### Detección activa de modelos

    Si tu proveedor expone una API de tipo `/models`, mantén en tu plugin el
    punto de conexión específico del proveedor y la proyección de filas, y usa
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para el ciclo de vida compartido
    de las solicitudes. El auxiliar proporciona solicitudes HTTP protegidas, encabezados de autenticación
    del proveedor, errores HTTP estructurados, almacenamiento en caché con TTL y comportamiento alternativo
    estático, sin introducir políticas del proveedor en el núcleo de OpenClaw.

    Usa `buildLiveModelProviderConfig` cuando la API activa solo indique cuáles
    de las filas del catálogo estático propiedad del proveedor están disponibles actualmente:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
      {
        id: "acme-large",
        name: "Acme Large",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 32768,
      },
      {
        id: "acme-small",
        name: "Acme Small",
        reasoning: false,
        input: ["text"],
        cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Usa `getCachedLiveProviderModelRows` cuando la API del proveedor devuelva metadatos
    más detallados y el plugin deba proyectar por sí mismo las filas en definiciones de
    modelos de OpenClaw:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` debe seguir condicionado a la autenticación y devolver `null` cuando no haya ninguna credencial
    utilizable disponible. Mantén un `staticRun` sin conexión o una alternativa estática para que la configuración,
    la documentación, las pruebas y las interfaces de selección no dependan del acceso activo a la red. Usa un TTL
    adecuado para la vigencia de la lista de modelos, evita consultar el sistema de archivos durante cada solicitud
    y proporciona un `readRows` / `readModelId` específico del proveedor solo cuando la
    respuesta del servicio de origen no tenga una estructura compatible con OpenAI de tipo `{ data: [{ id, object }] }`.

    Si el proveedor de origen usa tokens de control distintos de los de OpenClaw, añade una
    pequeña transformación bidireccional de texto en lugar de sustituir la ruta de transmisión:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` reescribe el prompt final del sistema y el contenido de los mensajes de texto antes
    del transporte. `output` reescribe los fragmentos de texto del asistente y el texto final antes de que
    OpenClaw analice sus propios marcadores de control o realice la entrega al canal.

    Para los proveedores incluidos que solo registran un proveedor de texto con autenticación mediante
    clave de API y un único entorno de ejecución respaldado por un catálogo, usa preferentemente el auxiliar
    más específico `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` es la ruta del catálogo en vivo que se utiliza cuando OpenClaw puede resolver la
    autenticación real del proveedor. Puede realizar un descubrimiento específico del proveedor. Usa
    `buildStaticProvider` únicamente para filas sin conexión que sea seguro mostrar antes de configurar
    la autenticación; no debe requerir credenciales ni realizar solicitudes de red.
    Actualmente, la visualización de `models list --all` de OpenClaw ejecuta catálogos estáticos
    únicamente para plugins de proveedor incluidos, con una configuración vacía, un entorno vacío y sin
    rutas de agente ni de espacio de trabajo.

    Si tu flujo de autenticación también necesita modificar `models.providers.*`, los alias y
    el modelo predeterminado del agente durante la incorporación, usa los asistentes de preajustes de
    `openclaw/plugin-sdk/provider-onboard`. Los asistentes más específicos son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso transmitidos en el
    transporte normal `openai-completions`, prefiere los asistentes de catálogo compartidos de
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar de forma fija
    comprobaciones del identificador del proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan la compatibilidad a partir del
    mapa de capacidades del endpoint, por lo que los endpoints nativos del estilo Moonshot/DashScope
    siguen habilitándola incluso cuando un plugin utiliza un identificador de proveedor personalizado.

    Los ejemplos de descubrimiento en vivo anteriores abarcan las API de proveedores del estilo `/models`. Mantén
    ese descubrimiento dentro de `catalog.run`, condicionado a que haya una autenticación utilizable, y mantén
    `staticRun` sin acceso a la red para generar catálogos sin conexión.

  </Step>

  <Step title="Add dynamic model resolution">
    Si tu proveedor acepta identificadores de modelo arbitrarios (como un proxy o enrutador),
    añade `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Si la resolución requiere una llamada de red, usa `prepareDynamicModel` para el
    calentamiento asíncrono; `resolveDynamicModel` vuelve a ejecutarse cuando termina.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añade hooks
    de forma incremental a medida que tu proveedor los necesite.

    Los constructores de asistentes compartidos ahora cubren las familias más comunes de compatibilidad
    con repetición y herramientas, por lo que los plugins normalmente no necesitan conectar manualmente cada hook uno por uno:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Familias de repetición disponibles actualmente:

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política compartida de repetición al estilo OpenAI para transportes compatibles con OpenAI, incluida la depuración de identificadores de llamadas a herramientas, las correcciones del orden que sitúan primero al asistente y la validación genérica de turnos de Gemini cuando el transporte la necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de repetición compatible con Claude seleccionada mediante `modelId`, para que los transportes de mensajes de Anthropic solo reciban la limpieza específica de bloques de razonamiento de Claude cuando el modelo resuelto sea realmente un identificador de Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | La misma política de Claude por modelo que `anthropic-by-model`, además de la depuración de identificadores de llamadas a herramientas y la conservación de identificadores nativos de uso de herramientas de Anthropic para transportes que deben mantener los identificadores nativos del proveedor | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Política nativa de repetición de Gemini más depuración de la repetición de arranque. La familia compartida mantiene la CLI de Gemini con salida de texto usando razonamiento etiquetado; el proveedor directo `google` sobrescribe `resolveReasoningOutputMode` con `native` porque el razonamiento de la API de Gemini llega como partes de pensamiento nativas. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Depuración de firmas de pensamiento de Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita la validación de repetición nativa de Gemini ni las reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que combinan superficies de modelos de mensajes de Anthropic y compatibles con OpenAI en un solo plugin; la eliminación opcional de bloques de razonamiento exclusiva de Claude permanece limitada al lado de Anthropic | `minimax` |

    Familias de transmisión disponibles actualmente:

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de la carga útil de razonamiento de Gemini en la ruta de transmisión compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Contenedor de razonamiento de Kilo en la ruta de transmisión proxy compartida, donde `kilo/auto` y los identificadores de razonamiento proxy no compatibles omiten el razonamiento insertado | `kilocode` |
    | `moonshot-thinking` | Asignación de la carga útil binaria de razonamiento nativo de Moonshot a partir de la configuración y el nivel de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura del modelo de modo rápido de MiniMax en la ruta de transmisión compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Contenedores compartidos nativos de Responses de OpenAI/Codex: encabezados de atribución, `/fast`/`serviceTier`, verbosidad del texto, búsqueda web nativa de Codex, conformación de la carga útil para compatibilidad con el razonamiento y gestión del contexto de Responses | `openai` |
    | `openrouter-thinking` | Contenedor de razonamiento de OpenRouter para rutas proxy, con omisiones para modelos no compatibles y `auto` gestionadas de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Contenedor `tool_stream` habilitado de forma predeterminada para proveedores como Z.AI que desean transmitir herramientas salvo que se deshabilite explícitamente | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Cada constructor de familia se compone de asistentes públicos de nivel inferior exportados desde el mismo paquete, que puedes utilizar cuando un proveedor necesite apartarse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared`: `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores de repetición sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta asistentes de repetición de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y asistentes de endpoints/modelos (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream`: `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los contenedores compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), el contenedor de DeepSeek V4 compatible con OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), la limpieza del prellenado de razonamiento de Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilidad con llamadas a herramientas en texto sin formato (`createPlainTextToolCallCompatWrapper`) y los contenedores compartidos de proxies/proveedores (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared`: contenedores ligeros de cargas útiles y eventos para rutas activas de proveedores, incluidos `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` y `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools`: `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` y los asistentes subyacentes de esquemas de proveedores.

      Para los proveedores de la familia Gemini, mantén el modo de salida del razonamiento alineado con
      el transporte. Los proveedores directos de la API de Google Gemini deben usar la salida de razonamiento
      `native` para que OpenClaw consuma las partes de pensamiento nativas sin añadir
      directivas de prompt `<think>` / `<final>`. Los backends al estilo de la CLI de Gemini
      que solo manejan texto y analizan una respuesta final JSON/de texto pueden conservar el contrato etiquetado
      compartido `google-gemini`.

      Algunos asistentes de transmisión permanecen locales al proveedor de forma intencionada. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de contenedores de Anthropic de nivel inferior en su propia interfaz pública `api.ts` / `contract-api.ts`, porque codifican la gestión de betas de OAuth de Claude y el condicionamiento de `context1m`. De forma similar, el plugin de xAI mantiene la conformación nativa de Responses de xAI en su propio `wrapStreamFn` (alias de `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no compatibles y eliminación de cargas útiles de razonamiento específica de xAI).

      El mismo patrón basado en la raíz del paquete también sustenta `@openclaw/openai-provider` (constructores de proveedores, asistentes de modelos predeterminados y constructores de proveedores en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedor más asistentes de incorporación/configuración).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Para proveedores que necesitan intercambiar un token antes de cada llamada de inferencia:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Custom headers">
        Para proveedores que necesitan encabezados de solicitud personalizados o modificaciones del cuerpo:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native transport identity">
        Para proveedores que necesitan encabezados o metadatos nativos de solicitud/sesión en
        transportes HTTP genéricos o WebSocket:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Uso y facturación">
        Para los proveedores que exponen datos de uso y facturación:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` tiene tres resultados posibles. Devuelva
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` cuando el
        proveedor tenga una credencial de uso o facturación (los campos opcionales
        transfieren metadatos no secretos del plan desde el perfil resuelto hasta
        `fetchUsageSnapshot`). Devuelva
        `{ handled: true }` solo cuando el proveedor haya gestionado de forma
        definitiva la autenticación de uso, pero no disponga de un token de uso
        válido, y OpenClaw deba omitir el mecanismo alternativo genérico de clave
        de API u OAuth. Devuelva `null` o `undefined` cuando el proveedor no haya
        gestionado la solicitud y OpenClaw deba continuar con el mecanismo
        alternativo genérico.

        Declare el identificador del proveedor en `contracts.usageProviders`. Cuando
        estén presentes ese contrato del manifiesto y **ambos** hooks, OpenClaw
        incluirá automáticamente al proveedor en la recopilación de uso sin cargar
        plugins de proveedores no relacionados. No es necesario actualizar ninguna
        lista de permitidos del núcleo.
        `fetchUsageSnapshot` devuelve la estructura compartida independiente del
        proveedor:

        - `plan`: suscripción o etiqueta de clave informada por el proveedor
        - `windows`: ventanas de cuota restablecibles expresadas como porcentajes utilizados
        - `billing`: entradas tipadas de `balance`, `spend` o `budget`; `unit` puede ser
          una moneda ISO o una unidad del proveedor, como `credits`
        - `summary`: contexto compacto específico del proveedor que no encaja en esos
          campos estructurados

        Mantenga exacta la semántica de las monedas. Un crédito del proveedor no
        equivale a USD salvo que el contrato del servicio de origen así lo indique.
        Un plugin que implemente únicamente `fetchUsageSnapshot` seguirá estando
        disponible para llamadores explícitos o sintéticos, pero no se descubrirá
        automáticamente, porque OpenClaw no puede resolver su credencial de uso.
      </Tab>
    </Tabs>

    <Accordion title="Hooks comunes de proveedores">
      OpenClaw llama a los hooks aproximadamente en este orden para los plugins
      de modelos o proveedores. La mayoría de los proveedores solo utilizan entre
      dos y tres. Este no es el contrato completo de `ProviderPlugin`; consulte
      [Aspectos internos: hooks del entorno de ejecución de
      proveedores](/es/plugins/architecture-internals#provider-runtime-hooks) para
      ver la lista completa y actualizada de hooks y las notas sobre mecanismos
      alternativos.
      Los campos de proveedor exclusivos para compatibilidad que OpenClaw ya no
      invoca, como `ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se
      incluyen aquí.

      | Hook | Cuándo utilizarlo |
      | --- | --- |
      | `catalog` | Catálogo de modelos o valores predeterminados de la URL base |
      | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | `normalizeModelId` | Limpieza de alias de identificadores de modelos heredados o preliminares antes de la búsqueda |
      | `normalizeTransport` | Limpieza de `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo |
      | `normalizeConfig` | Normalizar la configuración de `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Reescrituras nativas de compatibilidad del uso en transmisión para proveedores de configuración |
      | `resolveConfigApiKey` | Resolución de autenticación mediante marcadores de entorno propiedad del proveedor |
      | `resolveSyntheticAuth` | Autenticación sintética local, autoalojada o respaldada por la configuración |
      | `resolveExternalAuthProfiles` | Superponer perfiles de autenticación externos propiedad del proveedor para credenciales administradas por la CLI o la aplicación |
      | `shouldDeferSyntheticProfileAuth` | Situar los marcadores de posición sintéticos de perfiles almacenados por detrás de la autenticación del entorno o la configuración |
      | `resolveDynamicModel` | Aceptar identificadores arbitrarios de modelos del servicio de origen |
      | `prepareDynamicModel` | Obtener metadatos de forma asíncrona antes de la resolución |
      | `normalizeResolvedModel` | Reescrituras del transporte antes del ejecutor |
      | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado frente a nativo |
      | `prepareExtraParams` | Parámetros predeterminados de la solicitud |
      | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | `wrapStreamFn` | Envoltorios personalizados de encabezados o cuerpo en la ruta normal de transmisión |
      | `resolveTransportTurnState` | Encabezados y metadatos nativos por turno |
      | `resolveWebSocketSessionPolicy` | Encabezados y período de espera de la sesión WS nativa |
      | `formatApiKey` | Estructura personalizada del token en tiempo de ejecución |
      | `refreshOAuth` | Renovación personalizada de OAuth |
      | `buildAuthDoctorHint` | Orientación para reparar la autenticación |
      | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | `classifyFailoverReason` | Clasificación de límites de velocidad o sobrecarga propiedad del proveedor |
      | `isCacheTtlEligible` | Control del TTL de la caché de instrucciones |
      | `buildMissingAuthMessage` | Sugerencia personalizada para la falta de autenticación |
      | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura (obsoleto; se recomienda `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Conjunto de opciones de `/think` específico del modelo |
      | `isBinaryThinking` | Compatibilidad para activar o desactivar el pensamiento binario (obsoleto; se recomienda `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilidad con el razonamiento `xhigh` (obsoleto; se recomienda `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilidad con la política predeterminada de `/think` (obsoleto; se recomienda `resolveThinkingProfile`) |
      | `isModernModelRef` | Correspondencia de modelos en vivo o de prueba de humo |
      | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria o búsqueda |
      | `buildReplayPolicy` | Política personalizada de reproducción o Compaction de transcripciones |
      | `sanitizeReplayHistory` | Reescrituras de reproducción específicas del proveedor tras la limpieza genérica |
      | `validateReplayTurns` | Validación estricta de los turnos reproducidos antes del ejecutor integrado |
      | `onModelSelected` | Función de retorno tras la selección (por ejemplo, telemetría) |

      Notas sobre los mecanismos alternativos del entorno de ejecución:

      - `normalizeConfig` resuelve un plugin propietario por identificador de proveedor (primero los proveedores incluidos y, después, el plugin del entorno de ejecución coincidente) e invoca únicamente ese hook; no examina otros proveedores. El propio hook `normalizeConfig` de Google es el que normaliza las entradas de configuración de `google` / `google-vertex` / `google-antigravity`; no se trata de un mecanismo alternativo independiente del núcleo.
      - `resolveConfigApiKey` utiliza el hook del proveedor cuando está disponible. Amazon Bedrock mantiene la resolución de marcadores de entorno de AWS en su plugin de proveedor; la autenticación en tiempo de ejecución continúa utilizando la cadena predeterminada del SDK de AWS cuando se configura con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recibe el `provider` seleccionado, el `modelId`, una sugerencia opcional combinada del catálogo de `reasoning` y datos opcionales combinados de `compat` del modelo. Utilice `compat` únicamente para seleccionar la interfaz o el perfil de pensamiento del proveedor.
      - `resolveSystemPromptContribution` permite que un proveedor inyecte orientación para las instrucciones del sistema compatible con la caché de una familia de modelos. Se recomienda usarlo en lugar del hook heredado `before_prompt_build`, que se aplica a todo el plugin, cuando el comportamiento pertenezca a una única familia de proveedor o modelo y deba conservar la división estable y dinámica de la caché.

    </Accordion>

  </Step>

  <Step title="Añadir capacidades adicionales (opcional)">
    ### Paso 5: Añadir capacidades adicionales

    Un plugin de proveedor puede registrar embeddings, voz, transcripción en
    tiempo real, voz en tiempo real, comprensión multimedia, generación de
    imágenes, generación de vídeo, obtención web y búsqueda web junto con la
    inferencia de texto. OpenClaw lo clasifica como un plugin de
    **capacidades híbridas**, el patrón recomendado para los plugins de empresas
    (un plugin por proveedor). Consulte
    [Aspectos internos: propiedad de las capacidades](/es/plugins/architecture#capability-ownership-model).

    Registre cada capacidad dentro de `register(api)` junto a su llamada existente
    a `api.registerProvider(...)`. Elija únicamente las pestañas que necesite:

    <Tabs>
      <Tab title="Voz (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Utilice `assertOkOrThrowProviderError(...)` para los fallos HTTP del
        proveedor, de modo que los plugins compartan lecturas limitadas del cuerpo
        del error, análisis de errores JSON y sufijos de identificadores de
        solicitud.
      </Tab>
      <Tab title="Transcripción en tiempo real">
        Se recomienda `createRealtimeTranscriptionWebSocketSession(...)`: el
        auxiliar compartido gestiona la captura del proxy, el retraso progresivo
        de reconexión, el vaciado al cerrar, los protocolos de disponibilidad,
        la puesta en cola del audio y los diagnósticos de eventos de cierre. Su
        plugin solo asigna los eventos del servicio de origen.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Los proveedores STT por lotes que envían audio multipart mediante POST deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. La función auxiliar normaliza los nombres
        de archivo de las cargas, incluidas las cargas AAC que necesitan un nombre
        de archivo con formato M4A para las API de transcripción compatibles.
      </Tab>
      <Tab title="Voz en tiempo real">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Declara `capabilities` para que `talk.catalog` pueda exponer modos,
        transportes, formatos de audio e indicadores de funciones válidos a los
        clientes web y nativos de Talk. Implementa `handleBargeIn` cuando un
        transporte pueda detectar que una persona está interrumpiendo la reproducción
        del asistente y el proveedor permita truncar o borrar la respuesta de audio
        activa.
        `submitToolResult` puede devolver `void` para un envío síncrono o
        `Promise<void>` para un límite de finalización asíncrona que el puente del
        proveedor pueda exponer. Las sesiones de retransmisión del Gateway esperan
        esa promesa antes de confirmar un resultado final o borrar la ejecución
        vinculada; recházala cuando falle el envío.
        Establece `supportsToolResultSuppression: false` cuando el proveedor no pueda
        respetar `options.suppressResponse`. OpenClaw evita entonces la supresión en
        los resultados internos de consulta forzada y cancelación, y rechaza las
        solicitudes directas de resultados suprimidos en lugar de iniciar
        silenciosamente una respuesta.
        Del mismo modo, los consumidores de `createRealtimeVoiceBridgeSession` pueden
        devolver una promesa desde `onToolCall`; las excepciones síncronas y los
        rechazos se dirigen a la función de retorno `onError` de la sesión.
        Establece `handlesInputAudioBargeIn` únicamente cuando el VAD del proveedor
        confirme una interrupción llamando a `onClearAudio("barge-in")`. Los
        proveedores que omitan el indicador usan la detección alternativa local de
        audio de entrada de OpenClaw.
      </Tab>
      <Tab title="Comprensión multimedia">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Los proveedores multimedia locales o autoalojados que intencionadamente no
        requieran credenciales pueden exponer `resolveAuth` y devolver
        `kind: "none"`.
        OpenClaw sigue manteniendo la comprobación de autenticación normal para los
        proveedores que no acepten explícitamente este comportamiento. Los
        proveedores existentes pueden seguir leyendo `req.apiKey`; los proveedores
        nuevos deben preferir `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Incrustaciones">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Declara el mismo identificador en `contracts.embeddingProviders`. Este es el
        contrato general de incrustaciones para generar vectores reutilizables,
        incluida la búsqueda en memoria. `registerMemoryEmbeddingProvider(...)` es
        una compatibilidad obsoleta para los adaptadores existentes específicos de
        memoria.
      </Tab>
      <Tab title="Generación de imágenes y vídeos">
        Las funciones de imágenes y vídeos usan una estructura **específica del
        modo**. Los proveedores de imágenes declaran los bloques de capacidades
        obligatorios `generate` y `edit`; los proveedores de vídeo declaran
        `generate`, `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no bastan para
        anunciar correctamente la compatibilidad con modos de transformación o los
        modos deshabilitados. La generación de música sigue el mismo patrón
        `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` es obligatorio en ambos tipos de proveedor; `edit` y los
        bloques de transformación de vídeo (`imageToVideo`, `videoToVideo`) siempre
        necesitan un indicador `enabled` explícito.

        Usa `catalogByModel` cuando los modos estáticos o las capacidades de un
        modelo de la lista difieran de los valores predeterminados del proveedor.
        Estos metadatos mantienen actualizados `video_generate action=list` y los
        catálogos de modelos sin invocar código del proveedor. La consulta y
        aplicación de capacidades en el momento de la solicitud siguen
        correspondiendo a `resolveModelCapabilities` y `generateVideo`; reutiliza la
        misma constante de capacidades en ambas rutas cuando sea posible.
      </Tab>
      <Tab title="Obtención y búsqueda web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Ambos tipos de proveedor comparten la misma estructura de conexión de
        credenciales: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` y `createTool`
        son obligatorios.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Prueba">
    ### Paso 6: Prueba

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publicar en ClawHub

Los plugins de proveedores se publican de la misma manera que cualquier otro
plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` es un comando diferente para publicar una carpeta
de Skills, no un paquete de plugin; no lo uses aquí.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referencia del orden del catálogo

`catalog.order` controla cuándo se combina tu catálogo en relación con los
proveedores integrados:

| Orden    | Cuándo             | Caso de uso                                                    |
| -------- | ------------------ | -------------------------------------------------------------- |
| `simple` | Primera pasada     | Proveedores simples con clave de API                           |
| `profile` | Después de simple | Proveedores condicionados a perfiles de autenticación          |
| `paired` | Después de profile | Sintetizar varias entradas relacionadas                        |
| `late`   | Última pasada      | Sobrescribir proveedores existentes (prevalece si hay colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) - si tu plugin también proporciona un canal
- [Entorno de ejecución del SDK](/es/plugins/sdk-runtime) - auxiliares de `api.runtime` (TTS, búsqueda, subagente)
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Funcionamiento interno de los plugins](/es/plugins/architecture-internals#provider-runtime-hooks) - detalles de los hooks y ejemplos incluidos

## Temas relacionados

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Creación de plugins de canal](/es/plugins/sdk-channel-plugins)
