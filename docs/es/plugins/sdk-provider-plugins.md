---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres agregar un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas comprender la autenticación de proveedores, los catálogos y los hooks de runtime
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedor
x-i18n:
    generated_at: "2026-06-27T12:28:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un plugin de proveedor que agrega un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación con clave de API y resolución dinámica de modelos.

<Info>
  Si aún no has creado ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los plugins de proveedor agregan modelos al bucle normal de inferencia de OpenClaw. Si el modelo
  debe ejecutarse mediante un demonio de agente nativo que posee hilos, compaction o eventos de
  herramientas, combina el proveedor con un [arnés de agente](/es/plugins/sdk-agent-harness)
  en lugar de poner detalles del protocolo del demonio en el núcleo.
</Tip>

## Tutorial

<Steps>
  <Step title="Package and manifest">
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

    El manifiesto declara `setup.providers[].envVars` para que OpenClaw pueda detectar
    credenciales sin cargar el runtime de tu plugin. Agrega `providerAuthAliases`
    cuando una variante de proveedor deba reutilizar la autenticación de otro id de proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu plugin de proveedor desde ids
    de modelo abreviados como `acme-large` antes de que existan hooks de runtime. Si publicas el
    proveedor en ClawHub, esos campos `openclaw.compat` y `openclaw.build`
    son obligatorios en `package.json`.

  </Step>

  <Step title="Register the provider">
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

    `registerModelCatalogProvider` es la superficie de catálogo más reciente del plano de control
    para la UI de lista/ayuda/selector. Úsala para filas de texto, generación de imágenes,
    generación de video y generación de música. Mantén las llamadas a endpoints del proveedor y
    el mapeo de respuestas en el plugin; OpenClaw posee la forma compartida de las filas, las
    etiquetas de origen y el renderizado de ayuda.

    Ese es un proveedor funcional. Los usuarios ahora pueden
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    ### Descubrimiento de modelos en vivo

    Si tu proveedor expone una API de estilo `/models`, mantén el endpoint específico
    del proveedor y la proyección de filas en tu plugin y usa
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para el ciclo de vida compartido
    de fetch. El helper te da fetches HTTP protegidos, encabezados de autenticación de proveedor,
    errores HTTP estructurados, caché TTL y comportamiento de fallback estático sin
    poner política de proveedor en el núcleo de OpenClaw.

    Usa `buildLiveModelProviderConfig` cuando la API en vivo solo te diga qué
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
    más ricos y el plugin necesite proyectar filas a definiciones de modelos de OpenClaw
    por sí mismo:

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

    `run` debe permanecer protegido por autenticación y devolver `null` cuando no haya
    una credencial utilizable disponible. Mantén un `staticRun` sin conexión o fallback estático para que las superficies de configuración, documentación,
    pruebas y selector no dependan del acceso a la red en vivo. Usa un TTL
    adecuado para la frescura de la lista de modelos, evita el sondeo del sistema de archivos en tiempo de solicitud
    y pasa un `readRows` / `readModelId` específico del proveedor solo cuando la
    respuesta upstream no tenga la forma compatible con OpenAI `{ data: [{ id, object }] }`.

    Si el proveedor upstream usa tokens de control diferentes a los de OpenClaw, agrega una
    pequeña transformación de texto bidireccional en lugar de reemplazar la ruta de stream:

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
    OpenClaw analice sus propios marcadores de control o la entrega del canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación por clave de API
    más un único runtime respaldado por catálogo, prefiere el helper más estrecho
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

    `buildProvider` es la ruta del catálogo en vivo que se usa cuando OpenClaw puede resolver la autenticación real del proveedor. Puede realizar descubrimiento específico del proveedor. Usa `buildStaticProvider` solo para filas sin conexión que sea seguro mostrar antes de configurar la autenticación; no debe requerir credenciales ni hacer solicitudes de red. La visualización `models list --all` de OpenClaw actualmente ejecuta catálogos estáticos solo para plugins de proveedor incluidos, con una configuración vacía, un entorno vacío y sin rutas de agente/espacio de trabajo.

    Si tu flujo de autenticación también necesita parchear `models.providers.*`, alias y el modelo predeterminado del agente durante la incorporación, usa los helpers predefinidos de `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)` y `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso transmitidos en el transporte normal `openai-completions`, prefiere los helpers de catálogo compartidos en `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones de id de proveedor. `supportsNativeStreamingUsageCompat(...)` y `applyProviderNativeStreamingUsageCompat(...)` detectan el soporte desde el mapa de capacidades del endpoint, por lo que los endpoints nativos de estilo Moonshot/DashScope siguen optando por participar incluso cuando un plugin usa un id de proveedor personalizado.

    Los ejemplos de descubrimiento en vivo anteriores cubren API de proveedor de estilo `/models`. Mantén ese descubrimiento dentro de `catalog.run`, protegido por autenticación utilizable, y mantén `staticRun` sin red para la generación de catálogos sin conexión.

  </Step>

  <Step title="Agregar resolución dinámica de modelos">
    Si tu proveedor acepta IDs de modelo arbitrarios (como un proxy o router), agrega `resolveDynamicModel`:

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

    Si resolverlo requiere una llamada de red, usa `prepareDynamicModel` para el calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo después de que termine.

  </Step>

  <Step title="Agregar hooks de runtime (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Agrega hooks de forma incremental a medida que tu proveedor los requiera.

    Los constructores de helpers compartidos ahora cubren las familias más comunes de replay/compatibilidad con herramientas, por lo que los plugins normalmente no necesitan cablear cada hook manualmente uno por uno:

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

    Familias de replay disponibles hoy:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política de replay compartida de estilo OpenAI para transportes compatibles con OpenAI, incluida la limpieza de tool-call-id, correcciones de ordenamiento assistant-first y validación genérica de turnos de Gemini cuando el transporte la necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatible con Claude elegida por `modelId`, de modo que los transportes de mensajes Anthropic solo reciben limpieza de bloques de pensamiento específica de Claude cuando el modelo resuelto es realmente un id de Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política de replay nativa de Gemini más limpieza de replay de arranque. La familia compartida mantiene el CLI de Gemini con salida de texto en razonamiento etiquetado; el proveedor directo `google` sobrescribe `resolveReasoningOutputMode` a `native` porque el pensamiento de la API de Gemini llega como partes de pensamiento nativas. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Limpieza de firmas de pensamiento de Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita la validación de replay nativa de Gemini ni las reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un plugin; la eliminación opcional de bloques de pensamiento solo de Claude permanece limitada al lado de Anthropic | `minimax` |

    Familias de stream disponibles hoy:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de payloads de pensamiento de Gemini en la ruta de stream compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de razonamiento de Kilo en la ruta de stream proxy compartida, con `kilo/auto` e ids de razonamiento proxy no admitidos omitiendo el pensamiento inyectado | `kilocode` |
    | `moonshot-thinking` | Mapeo de payloads binarios de pensamiento nativo de Moonshot desde configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura de modelos de modo rápido de MiniMax en la ruta de stream compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers compartidos de Responses nativas de OpenAI/Codex: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, modelado de payloads compatibles con razonamiento y gestión de contexto de Responses | `openai` |
    | `openrouter-thinking` | Wrapper de razonamiento de OpenRouter para rutas proxy, con omisiones de modelo no admitido/`auto` manejadas centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activado de forma predeterminada para proveedores como Z.AI que quieren streaming de herramientas salvo que se desactive explícitamente | `zai` |

    <Accordion title="Seams del SDK que impulsan los constructores de familias">
      Cada constructor de familia se compone a partir de helpers públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita salirse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores de replay sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta helpers de replay de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los wrappers compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), el wrapper compatible con OpenAI de DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), la limpieza de prefill de pensamiento de Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compatibilidad de llamadas de herramienta en texto plano (`createPlainTextToolCallCompatWrapper`) y wrappers compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrappers ligeros de payloads y eventos para rutas de proveedor críticas, incluidos `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` y `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` y los helpers de esquema de proveedor subyacentes.

      Para proveedores de la familia Gemini, mantén el modo de salida de razonamiento alineado con el transporte. Los proveedores directos de la API de Google Gemini deben usar salida de razonamiento `native` para que OpenClaw consuma partes de pensamiento nativas sin agregar directivas de prompt `<think>` / `<final>`. Los backends de estilo CLI de Gemini solo de texto que parsean una respuesta final JSON/texto pueden mantener el contrato etiquetado compartido `google-gemini`.

      Algunos helpers de stream permanecen locales al proveedor a propósito. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de wrappers de Anthropic de nivel inferior en su propio seam público `api.ts` / `contract-api.ts` porque codifican el manejo de betas de OAuth de Claude y la protección de `context1m`. El plugin de xAI conserva de forma similar el modelado nativo de Responses de xAI en su propio `wrapStreamFn` (alias `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no admitidas, eliminación de payloads de razonamiento específica de xAI).

      El mismo patrón de raíz de paquete también respalda `@openclaw/openai-provider` (constructores de proveedor, helpers de modelo predeterminado, constructores de proveedor en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedor más helpers de incorporación/configuración).
    </Accordion>

    <Tabs>
      <Tab title="Intercambio de tokens">
        Para proveedores que necesitan un intercambio de tokens antes de cada llamada de inferencia:

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
      <Tab title="Encabezados personalizados">
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
      <Tab title="Identidad de transporte nativo">
        Para proveedores que necesitan encabezados de solicitud/sesión nativos o metadatos en transportes HTTP o WebSocket genéricos:

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
      <Tab title="Usage and billing">
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
        `{ handled: true }` solo cuando el proveedor ha gestionado definitivamente
        la autenticación de uso, pero no tiene ningún token de uso utilizable, y
        OpenClaw debe omitir el respaldo genérico de clave de API/OAuth. Devuelve
        `null` o `undefined` cuando el proveedor no gestionó la solicitud y
        OpenClaw debe continuar con el respaldo genérico.
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw llama a los hooks en este orden. La mayoría de los proveedores solo usan 2 o 3:
      Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
      `ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se enumeran
      aquí.

      | # | Hook | Cuándo usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos o valores predeterminados de URL base |
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de alias de id de modelo heredado/vista previa antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de familia de proveedores antes del ensamblaje genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso en streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación de marcador de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reducir marcadores sintéticos de perfiles almacenados detrás de autenticación por entorno/configuración |
      | 10 | `resolveDynamicModel` | Aceptar IDs de modelos ascendentes arbitrarios |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del ejecutor |
      | 13 | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | 14 | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | 15 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetada frente a nativa |
      | 16 | `prepareExtraParams` | Parámetros predeterminados de solicitud |
      | 17 | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | 19 | `wrapStreamFn` | Contenedores personalizados de encabezados/cuerpo en la ruta normal de streaming |
      | 20 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 21 | `resolveWebSocketSessionPolicy` | Encabezados de sesión WS nativos/enfriamiento |
      | 22 | `formatApiKey` | Forma personalizada del token en tiempo de ejecución |
      | 23 | `refreshOAuth` | Actualización OAuth personalizada |
      | 24 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 25 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 26 | `classifyFailoverReason` | Clasificación de límites de tasa/sobrecarga propiedad del proveedor |
      | 27 | `isCacheTtlEligible` | Control de TTL de caché de prompts |
      | 28 | `buildMissingAuthMessage` | Sugerencia personalizada de autenticación faltante |
      | 29 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 30 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 31 | `isBinaryThinking` | Compatibilidad de pensamiento binario activado/desactivado |
      | 32 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilidad de política `/think` predeterminada |
      | 34 | `isModernModelRef` | Coincidencia de modelo en vivo/smoke |
      | 35 | `prepareRuntimeAuth` | Intercambio de token antes de la inferencia |
      | 36 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 37 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 38 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 39 | `buildReplayPolicy` | Política personalizada de reproducción/compaction de transcripción |
      | 40 | `sanitizeReplayHistory` | Reescrituras de reproducción específicas del proveedor después de la limpieza genérica |
      | 41 | `validateReplayTurns` | Validación estricta de turnos de reproducción antes del ejecutor integrado |
      | 42 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Notas de respaldo en tiempo de ejecución:

      - `normalizeConfig` comprueba primero el proveedor coincidente, luego otros plugins de proveedor con capacidad de hook hasta que uno cambie realmente la configuración. Si ningún hook de proveedor reescribe una entrada de configuración compatible de la familia Google, aún se aplica el normalizador de configuración de Google incluido.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. Amazon Bedrock mantiene la resolución de marcadores de entorno de AWS en su Plugin de proveedor; la autenticación en tiempo de ejecución en sí sigue usando la cadena predeterminada del SDK de AWS cuando se configura con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recibe el `provider` seleccionado, `modelId`, la sugerencia opcional combinada del catálogo `reasoning` y los datos opcionales combinados `compat` del modelo. Usa `compat` solo para seleccionar la UI/perfil de pensamiento del proveedor.
      - `resolveSystemPromptContribution` permite que un proveedor inyecte guía de prompt del sistema consciente de la caché para una familia de modelos. Prefiérelo sobre `before_prompt_build` cuando el comportamiento pertenece a una familia de proveedor/modelo y debe preservar la división estable/dinámica de la caché.

      Para descripciones detalladas y ejemplos reales, consulta [Internals: Provider Runtime Hooks](/es/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Paso 5: Agregar capacidades adicionales

    Un Plugin de proveedor puede registrar embeddings, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web y búsqueda web junto con inferencia de texto. OpenClaw clasifica esto como un
    Plugin de **capacidad híbrida**, el patrón recomendado para plugins de empresa
    (un Plugin por proveedor). Consulta
    [Internals: Capability Ownership](/es/plugins/architecture#capability-ownership-model).

    Registra cada capacidad dentro de `register(api)` junto con tu llamada existente
    `api.registerProvider(...)`. Elige solo las pestañas que necesites:

    <Tabs>
      <Tab title="Speech (TTS)">
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
        los plugins compartan lecturas limitadas del cuerpo de error, análisis de errores JSON y
        sufijos de id de solicitud.
      </Tab>
      <Tab title="Realtime transcription">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el helper compartido
        gestiona captura de proxy, espera exponencial de reconexión, vaciado al cerrar, handshakes
        de listo, encolado de audio y diagnósticos de eventos de cierre. Tu Plugin
        solo mapea eventos ascendentes.

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

        Los proveedores de STT por lotes que hacen POST de audio multipart deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. El helper normaliza los nombres de archivo
        de carga, incluidas cargas AAC que necesitan un nombre de archivo estilo M4A para
        APIs de transcripción compatibles.
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
        transportes, formatos de audio y marcas de características válidos a los
        clientes Talk de navegador y nativos. Implementa `handleBargeIn` cuando un transporte pueda detectar que un
        humano está interrumpiendo la reproducción del asistente y el proveedor admita
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
        OpenClaw conserva igualmente la puerta de autenticación normal para los proveedores que no
        optan por ello explícitamente. Los proveedores existentes pueden seguir leyendo `req.apiKey`;
        los proveedores nuevos deberían preferir `req.auth`.

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
        contrato general de embeddings para la generación reutilizable de vectores, incluida
        la búsqueda de memoria. `registerMemoryEmbeddingProvider(...)` es compatibilidad obsoleta
        para adaptadores existentes específicos de memoria.
      </Tab>
      <Tab title="Image and video generation">
        Las capacidades de video usan una forma **consciente del modo**: `generate`,
        `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no son
        suficientes para anunciar claramente la compatibilidad con modos de transformación o modos deshabilitados.
        La generación de música sigue el mismo patrón con bloques `generate` /
        `edit` explícitos.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
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
          search: async (req) => ({ content: [] }),
        });
        ```
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

No uses aquí el alias de publicación heredado solo para skills; los paquetes de plugins deben usar
`clawhub package publish`.

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

## Referencia de orden del catálogo

`catalog.order` controla cuándo se combina tu catálogo en relación con los
proveedores integrados:

| Orden     | Cuándo             | Caso de uso                                      |
| --------- | ------------------ | ----------------------------------------------- |
| `simple`  | Primera pasada     | Proveedores simples con clave de API            |
| `profile` | Después de simple  | Proveedores condicionados a perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas         |
| `late`    | Última pasada      | Anular proveedores existentes (gana en caso de colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) - si tu plugin también proporciona un canal
- [Runtime del SDK](/es/plugins/sdk-runtime) - helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importación por subruta
- [Elementos internos del plugin](/es/plugins/architecture-internals#provider-runtime-hooks) - detalles de hooks y ejemplos integrados

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Crear plugins de canal](/es/plugins/sdk-channel-plugins)
