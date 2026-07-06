---
read_when:
    - Estás creando un nuevo plugin de proveedor de modelos
    - Quieres añadir un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas comprender la autenticación de proveedores, los catálogos y los hooks de runtime
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedor
x-i18n:
    generated_at: "2026-07-06T10:51:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7318081368f79acd46d09b07c52341977d3d7b0f5c187e428c38db2241bbdf0a
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Crea un Plugin proveedor para agregar un proveedor de modelos (LLM) a OpenClaw: un catálogo de modelos, autenticación con clave de API y resolución dinámica de modelos.

<Info>
  ¿Nuevo en los plugins de OpenClaw? Lee primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los plugins proveedores agregan modelos al bucle normal de inferencia de OpenClaw. Si el
  modelo debe ejecutarse mediante un demonio de agente nativo que posee hilos, Compaction
  o eventos de herramientas, combina el proveedor con un [arnés de
  agente](/es/plugins/sdk-agent-harness) en lugar de poner detalles del protocolo del demonio
  en el núcleo.
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
      "description": "Acme AI model provider",
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
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` permite que OpenClaw detecte credenciales sin
    cargar el runtime de tu Plugin. Agrega `providerAuthAliases` cuando una variante
    de proveedor deba reutilizar la autenticación de otro id de proveedor. `modelSupport` es
    opcional y permite que OpenClaw cargue automáticamente tu Plugin proveedor a partir de ids
    de modelo abreviados como `acme-large` antes de que existan los hooks de runtime. `openclaw.compat`
    y `openclaw.build` en `package.json` son obligatorios para la publicación en ClawHub
    (`openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`
    son los dos campos obligatorios; `minGatewayVersion` recurre a
    `openclaw.install.minHostVersion` cuando se omite).

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor de texto mínimo necesita un `id`, `label`, `auth` y `catalog`.
    `catalog` es el hook de runtime/configuración propiedad del proveedor; puede llamar a APIs
    del proveedor en vivo y devuelve entradas `models.providers`.

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

    `registerModelCatalogProvider` es la superficie de catálogo del plano de control más reciente
    para la IU de listas/ayuda/selector, y cubre filas `text`, `voice`, `image_generation`,
    `video_generation` y `music_generation`. Mantén las llamadas a endpoints del proveedor
    y el mapeo de respuestas en el Plugin; OpenClaw posee la forma compartida de las filas,
    las etiquetas de origen y el renderizado de ayuda.

    Ese es un proveedor funcional. Los usuarios ahora pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    ### Descubrimiento de modelos en vivo

    Si tu proveedor expone una API de estilo `/models`, mantén el endpoint específico
    del proveedor y la proyección de filas en tu Plugin, y usa
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para el ciclo de vida compartido
    de fetch. El helper te da fetches HTTP protegidos, encabezados de autenticación del proveedor,
    errores HTTP estructurados, caché con TTL y comportamiento de fallback estático sin
    poner política de proveedor en el núcleo de OpenClaw.

    Usa `buildLiveModelProviderConfig` cuando la API en vivo solo te indica qué
    filas del catálogo estático propiedad del proveedor están disponibles actualmente:

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
    más completos y el Plugin necesite proyectar las filas a definiciones de modelos de
    OpenClaw por sí mismo:

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

    `run` debe permanecer condicionado por autenticación y devolver `null` cuando no haya
    ninguna credencial utilizable disponible. Mantén un `staticRun` sin conexión o un fallback
    estático para que la configuración, la documentación, las pruebas y las superficies de selector
    no dependan del acceso a la red en vivo. Usa un TTL apropiado para la frescura de la lista
    de modelos, evita el sondeo del sistema de archivos en tiempo de solicitud y pasa un
    `readRows` / `readModelId` específico del proveedor solo cuando la respuesta upstream
    no tenga una forma compatible con OpenAI `{ data: [{ id, object }] }`.

    Si el proveedor upstream usa tokens de control distintos de OpenClaw, agrega una
    pequeña transformación de texto bidireccional en lugar de reemplazar la ruta de streaming:

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
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes de que
    OpenClaw analice sus propios marcadores de control o la entrega por canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación
    por clave de API más un único runtime respaldado por catálogo, prefiere el helper más acotado
    `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` es la ruta del catálogo en vivo que se usa cuando OpenClaw puede resolver la autenticación real del proveedor. Puede realizar descubrimiento específico del proveedor. Usa `buildStaticProvider` solo para filas sin conexión que sean seguras de mostrar antes de configurar la autenticación; no debe requerir credenciales ni realizar solicitudes de red. La visualización actual de `models list --all` de OpenClaw ejecuta catálogos estáticos solo para Plugins de proveedor incluidos, con una configuración vacía, un entorno vacío y sin rutas de agente/espacio de trabajo.

    Si tu flujo de autenticación también necesita aplicar parches a `models.providers.*`, alias y el modelo predeterminado del agente durante la incorporación, usa los helpers predefinidos de `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)` y `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso transmitidos en el transporte normal `openai-completions`, prefiere los helpers de catálogo compartidos en `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones de id de proveedor. `supportsNativeStreamingUsageCompat(...)` y `applyProviderNativeStreamingUsageCompat(...)` detectan la compatibilidad a partir del mapa de capacidades del endpoint, de modo que los endpoints nativos de estilo Moonshot/DashScope sigan participando incluso cuando un Plugin use un id de proveedor personalizado.

    Los ejemplos de descubrimiento en vivo anteriores cubren APIs de proveedor de estilo `/models`. Mantén ese descubrimiento dentro de `catalog.run`, protegido por autenticación utilizable, y mantén `staticRun` sin red para la generación de catálogos sin conexión.

  </Step>

  <Step title="Add dynamic model resolution">
    Si tu proveedor acepta IDs de modelo arbitrarios (como un proxy o enrutador), agrega `resolveDynamicModel`:

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

    Si resolverlo requiere una llamada de red, usa `prepareDynamicModel` para el calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo cuando termina.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Agrega hooks de forma incremental a medida que tu proveedor los requiera.

    Los constructores de helpers compartidos ahora cubren las familias de reproducción/compatibilidad con herramientas más comunes, por lo que normalmente los Plugins no necesitan cablear cada hook uno por uno:

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

    Familias de reproducción disponibles hoy:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política de reproducción compartida de estilo OpenAI para transportes compatibles con OpenAI, incluida la limpieza de ids de llamadas a herramientas, correcciones de orden con el asistente primero y validación genérica de turnos de Gemini cuando el transporte la necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de reproducción consciente de Claude elegida por `modelId`, de modo que los transportes de mensajes de Anthropic solo reciban limpieza de bloques de pensamiento específica de Claude cuando el modelo resuelto sea realmente un id de Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | La misma política Claude por modelo que `anthropic-by-model`, además de limpieza de ids de llamadas a herramientas y preservación nativa de ids de uso de herramientas de Anthropic para transportes que deben conservar ids nativos del proveedor | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Política de reproducción nativa de Gemini más limpieza de reproducción de arranque. La familia compartida mantiene la CLI de Gemini con salida de texto en razonamiento etiquetado; el proveedor directo `google` sobrescribe `resolveReasoningOutputMode` a `native` porque el pensamiento de la API de Gemini llega como partes de pensamiento nativas. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Limpieza de firmas de pensamiento de Gemini para modelos Gemini que se ejecutan a través de transportes proxy compatibles con OpenAI; no habilita validación de reproducción nativa de Gemini ni reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes de Anthropic y compatibles con OpenAI en un Plugin; la eliminación opcional de bloques de pensamiento solo de Claude permanece limitada al lado de Anthropic | `minimax` |

    Familias de transmisión disponibles hoy:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de la carga útil de pensamiento de Gemini en la ruta de transmisión compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Envoltura de razonamiento de Kilo en la ruta de transmisión proxy compartida, con `kilo/auto` e ids de razonamiento proxy no compatibles omitiendo el pensamiento inyectado | `kilocode` |
    | `moonshot-thinking` | Mapeo de carga útil binaria de pensamiento nativo de Moonshot desde configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura del modelo de modo rápido de MiniMax en la ruta de transmisión compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Envolturas compartidas nativas de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, conformación de carga útil de compatibilidad de razonamiento y gestión de contexto de Responses | `openai` |
    | `openrouter-thinking` | Envoltura de razonamiento de OpenRouter para rutas proxy, con omisiones de modelos no compatibles/`auto` manejadas de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Envoltura `tool_stream` activada de forma predeterminada para proveedores como Z.AI que quieren transmisión de herramientas salvo que se deshabilite explícitamente | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Cada constructor de familia se compone a partir de helpers públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita salirse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores de reproducción sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta helpers de reproducción de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de las envolturas compartidas de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), la envoltura DeepSeek V4 compatible con OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), la limpieza de precarga de pensamiento de Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilidad de llamadas a herramientas en texto plano (`createPlainTextToolCallCompatWrapper`) y las envolturas compartidas de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - envolturas ligeras de carga útil y eventos para rutas calientes de proveedor, incluidas `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` y `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` y helpers subyacentes de esquema de proveedor.

      Para proveedores de la familia Gemini, mantén el modo de salida de razonamiento alineado con el transporte. Los proveedores directos de la API Google Gemini deben usar salida de razonamiento `native` para que OpenClaw consuma partes de pensamiento nativas sin agregar directivas de prompt `<think>` / `<final>`. Los backends de estilo CLI de Gemini solo de texto que analizan una respuesta final JSON/texto pueden mantener el contrato etiquetado compartido `google-gemini`.

      Algunos helpers de transmisión permanecen locales al proveedor a propósito. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de envolturas de Anthropic de nivel inferior en su propia unión pública `api.ts` / `contract-api.ts` porque codifican el manejo de beta de OAuth de Claude y la protección de `context1m`. El Plugin xAI conserva de forma similar la conformación nativa de xAI Responses en su propio `wrapStreamFn` (alias `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no compatibles, eliminación de carga útil de razonamiento específica de xAI).

      El mismo patrón de raíz de paquete también respalda `@openclaw/openai-provider` (constructores de proveedor, helpers de modelo predeterminado, constructores de proveedor en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedor más helpers de incorporación/configuración).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Para proveedores que necesitan un intercambio de token antes de cada llamada de inferencia:

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
        Para proveedores que necesitan encabezados o metadatos nativos de solicitud/sesión en transportes HTTP genéricos o WebSocket:

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
        Para proveedores que exponen datos de uso/facturación:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` tiene tres resultados. Devuelve `{ token, accountId? }`
        cuando el proveedor tiene una credencial de uso/facturación. Devuelve
        `{ handled: true }` solo cuando el proveedor ha gestionado definitivamente la
        autenticación de uso, pero no tiene ningún token de uso utilizable, y OpenClaw debe omitir la alternativa genérica
        de clave de API/OAuth. Devuelve `null` o `undefined` cuando el proveedor no
        gestionó la solicitud y OpenClaw debe continuar con la alternativa genérica.

        Declara el id del proveedor en `contracts.usageProviders`. Cuando ese contrato
        de manifiesto y **ambos** hooks están presentes, OpenClaw incluye automáticamente
        al proveedor en la recopilación de uso sin cargar plugins de proveedor
        no relacionados. No se requiere actualizar la lista de permitidos del núcleo.
        `fetchUsageSnapshot` devuelve la forma compartida neutral respecto al proveedor:

        - `plan`: suscripción o etiqueta de clave informada por el proveedor
        - `windows`: ventanas de cuota restablecibles como porcentajes usados
        - `billing`: entradas tipadas de `balance`, `spend` o `budget`; `unit` puede ser
          una moneda ISO o una unidad del proveedor como `credits`
        - `summary`: contexto compacto específico del proveedor que no encaja en esos
          campos estructurados

        Mantén exacta la semántica de moneda. Un crédito de proveedor no es USD a menos que el
        contrato upstream lo indique. Un plugin que implementa solo
        `fetchUsageSnapshot` sigue disponible para llamadores explícitos/sintéticos, pero
        no se descubre automáticamente, porque OpenClaw no puede resolver su credencial de uso.
      </Tab>
    </Tabs>

    <Accordion title="Hooks comunes de proveedor">
      OpenClaw llama a los hooks aproximadamente en este orden para plugins de modelo/proveedor.
      La mayoría de los proveedores solo usan 2 o 3. Este no es el contrato completo de
      `ProviderPlugin`; consulta [Internos: Hooks de runtime de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks) para ver la
      lista de hooks completa y actualmente precisa, así como las notas de alternativa.
      Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
      `ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se enumeran
      aquí.

      | Hook | Cuándo usarlo |
      | --- | --- |
      | `catalog` | Catálogo de modelos o valores predeterminados de URL base |
      | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de configuración |
      | `normalizeModelId` | Limpieza de alias de id de modelo heredado/vista previa antes de la búsqueda |
      | `normalizeTransport` | Limpieza de `api` / `baseUrl` de familia de proveedor antes del ensamblaje genérico del modelo |
      | `normalizeConfig` | Normalizar la configuración de `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso de streaming nativo para proveedores de configuración |
      | `resolveConfigApiKey` | Resolución de autenticación de marcador env propiedad del proveedor |
      | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | `resolveExternalAuthProfiles` | Superponer perfiles de autenticación externos propiedad del proveedor para credenciales gestionadas por CLI/app |
      | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores de posición de perfiles almacenados sintéticos detrás de autenticación env/config |
      | `resolveDynamicModel` | Aceptar IDs arbitrarios de modelos upstream |
      | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |
      | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetada frente a nativa |
      | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | `wrapStreamFn` | Envoltorios personalizados de encabezados/cuerpo en la ruta normal de stream |
      | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | `resolveWebSocketSessionPolicy` | Encabezados/cool-down de sesión WS nativos |
      | `formatApiKey` | Forma personalizada de token de runtime |
      | `refreshOAuth` | Actualización OAuth personalizada |
      | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | `classifyFailoverReason` | Clasificación de límite de tasa/sobrecarga propiedad del proveedor |
      | `isCacheTtlEligible` | Control de elegibilidad de TTL de caché de prompts |
      | `buildMissingAuthMessage` | Indicación personalizada de autenticación faltante |
      | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura (obsoleto; prefiere `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | `isBinaryThinking` | Compatibilidad de razonamiento binario activado/desactivado (obsoleto; prefiere `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilidad de razonamiento `xhigh` (obsoleto; prefiere `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilidad de política `/think` predeterminada (obsoleto; prefiere `resolveThinkingProfile`) |
      | `isModernModelRef` | Coincidencia de modelo en vivo/smoke |
      | `prepareRuntimeAuth` | Intercambio de token antes de la inferencia |
      | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | `buildReplayPolicy` | Política personalizada de repetición/Compaction de transcripción |
      | `sanitizeReplayHistory` | Reescrituras de repetición específicas del proveedor después de la limpieza genérica |
      | `validateReplayTurns` | Validación estricta de turnos de repetición antes del runner incrustado |
      | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Notas de alternativa de runtime:

      - `normalizeConfig` resuelve un plugin propietario por id de proveedor (primero proveedores incluidos, luego el plugin de runtime coincidente) y llama solo a ese hook; no hay escaneo entre otros proveedores. El propio hook `normalizeConfig` de Google es el que normaliza las entradas de configuración de `google` / `google-vertex` / `google-antigravity`; no es una alternativa separada del núcleo.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. Amazon Bedrock mantiene la resolución de marcadores env de AWS en su plugin de proveedor; la autenticación de runtime en sí sigue usando la cadena predeterminada del SDK de AWS cuando se configura con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recibe el `provider` seleccionado, `modelId`, la pista opcional fusionada del catálogo `reasoning` y los datos opcionales fusionados de `compat` del modelo. Usa `compat` solo para seleccionar la UI/el perfil de pensamiento del proveedor.
      - `resolveSystemPromptContribution` permite que un proveedor inyecte guía de prompt del sistema consciente de caché para una familia de modelos. Prefiérelo al hook heredado `before_prompt_build` de todo el plugin cuando el comportamiento pertenece a una familia de proveedor/modelo y debe preservar la división estable/dinámica de la caché.

    </Accordion>

  </Step>

  <Step title="Agregar capacidades adicionales (opcional)">
    ### Paso 5: Agregar capacidades adicionales

    Un plugin de proveedor puede registrar embeddings, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web y búsqueda web junto con la inferencia de texto. OpenClaw clasifica esto como un
    plugin de **capacidad híbrida**: el patrón recomendado para plugins de empresa
    (un plugin por proveedor). Consulta
    [Internos: Propiedad de capacidades](/es/plugins/architecture#capability-ownership-model).

    Registra cada capacidad dentro de `register(api)` junto con tu llamada existente a
    `api.registerProvider(...)`. Elige solo las pestañas que necesites:

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

        Usa `assertOkOrThrowProviderError(...)` para fallos HTTP del proveedor, de modo que
        los plugins compartan lecturas acotadas del cuerpo de error, análisis de errores JSON y
        sufijos de request-id.
      </Tab>
      <Tab title="Transcripción en tiempo real">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el helper compartido
        gestiona captura de proxy, backoff de reconexión, vaciado al cerrar, handshakes de
        preparación, cola de audio y diagnósticos de eventos de cierre. Tu plugin
        solo mapea eventos upstream.

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

        Los proveedores de STT por lotes que envían audio multipart mediante POST deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. El helper normaliza los nombres de archivo de carga,
        incluidas las cargas AAC que necesitan un nombre de archivo de estilo M4A para
        API de transcripción compatibles.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
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
        transportes, formatos de audio y marcas de función válidos a clientes Talk
        del navegador y nativos. Implementa `handleBargeIn` cuando un transporte pueda detectar que una
        persona está interrumpiendo la reproducción del asistente y el proveedor admita
        truncar o borrar la respuesta de audio activa.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Los proveedores de medios locales o autoalojados que intencionalmente no requieren
        credenciales pueden exponer `resolveAuth` y devolver `kind: "none"`.
        OpenClaw conserva la compuerta de autenticación normal para proveedores que no
        optan explícitamente por este comportamiento. Los proveedores existentes pueden seguir leyendo `req.apiKey`;
        los proveedores nuevos deben preferir `req.auth`.

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
      <Tab title="Embeddings">
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

        Declara el mismo id en `contracts.embeddingProviders`. Este es el
        contrato general de embeddings para generación reutilizable de vectores, incluida
        la búsqueda en memoria. `registerMemoryEmbeddingProvider(...)` es compatibilidad
        obsoleta para adaptadores existentes específicos de memoria.
      </Tab>
      <Tab title="Image and video generation">
        Las capacidades de imagen y video usan una forma **consciente del modo**. Los
        proveedores de imagen declaran bloques de capacidad `generate` y `edit` obligatorios;
        los proveedores de video declaran `generate`, `imageToVideo` y
        `videoToVideo`. Los campos agregados planos como `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` no son suficientes para anunciar
        soporte de modo de transformación ni modos deshabilitados de forma limpia. La generación de música
        sigue el mismo patrón `generate` / `edit`.

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
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` es obligatorio en ambos tipos de proveedor; `edit` y los
        bloques de transformación de video (`imageToVideo`, `videoToVideo`) siempre necesitan una
        marca `enabled` explícita.
      </Tab>
      <Tab title="Web fetch and search">
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

        Ambos tipos de proveedor comparten la misma forma de cableado de credenciales:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` y `createTool` son todos
        obligatorios.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### Paso 6: Probar

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

Los plugins de proveedor se publican igual que cualquier otro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` es un comando distinto para publicar una carpeta de skill,
no un paquete de plugin; no lo uses aquí.

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

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los proveedores
integrados:

| Orden     | Cuándo             | Caso de uso                                      |
| --------- | ------------------ | ----------------------------------------------- |
| `simple`  | Primera pasada     | Proveedores simples con clave de API             |
| `profile` | Después de simple  | Proveedores restringidos por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas          |
| `late`    | Última pasada      | Sobrescribir proveedores existentes (gana en caso de colisión) |

## Próximos pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) - si tu plugin también proporciona un canal
- [Runtime del SDK](/es/plugins/sdk-runtime) - helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones por subruta
- [Internos del plugin](/es/plugins/architecture-internals#provider-runtime-hooks) - detalles de hooks y ejemplos integrados

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Crear plugins de canal](/es/plugins/sdk-channel-plugins)
