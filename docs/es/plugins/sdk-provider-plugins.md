---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres añadir un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas entender la autenticación del proveedor, los catálogos y los hooks de runtime
sidebarTitle: Provider Plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de Plugins de proveedor
x-i18n:
    generated_at: "2026-04-21T13:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creación de Plugins de proveedor

Esta guía explica cómo crear un Plugin de proveedor que añade un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación con clave de API y resolución dinámica de modelos.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Getting Started](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los Plugins de proveedor añaden modelos al bucle normal de inferencia de OpenClaw. Si el modelo
  debe ejecutarse a través de un daemon nativo de agente que controla hilos,
  Compaction o eventos de herramientas, empareja el proveedor con un [agent harness](/es/plugins/sdk-agent-harness)
  en lugar de poner detalles del protocolo del daemon en el núcleo.
</Tip>

## Recorrido guiado

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
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
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
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

    El manifiesto declara `providerAuthEnvVars` para que OpenClaw pueda detectar
    credenciales sin cargar el runtime de tu Plugin. Añade `providerAuthAliases`
    cuando una variante del proveedor deba reutilizar la autenticación del id de otro proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor a partir de ids abreviados
    de modelo como `acme-large` antes de que existan hooks de runtime. Si publicas el
    proveedor en ClawHub, esos campos `openclaw.compat` y `openclaw.build`
    son obligatorios en `package.json`.

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor mínimo necesita un `id`, `label`, `auth` y `catalog`:

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
      },
    });
    ```

    Ese es un proveedor funcional. Ahora los usuarios pueden
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como modelo.

    Si el proveedor upstream usa tokens de control distintos de los de OpenClaw, añade una
    pequeña transformación bidireccional de texto en lugar de reemplazar la ruta de stream:

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

    `input` reescribe el prompt final del sistema y el contenido de mensajes de texto antes
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes
    de que OpenClaw procese sus propios marcadores de control o la entrega al canal.

    Para proveedores integrados que solo registran un proveedor de texto con autenticación
    por clave de API y un único runtime respaldado por catálogo, prefiere el helper más
    específico `defineSingleProviderPluginEntry(...)`:

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
        },
      },
    });
    ```

    Si tu flujo de autenticación también necesita aplicar cambios en `models.providers.*`, alias y
    el modelo predeterminado del agente durante onboarding, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming en el
    transporte normal `openai-completions`, prefiere los helpers compartidos de catálogo de
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones de id de proveedor.
    `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan la compatibilidad a partir del mapa de capacidades del endpoint,
    de modo que los endpoints nativos estilo Moonshot/DashScope sigan optando por ello incluso cuando un Plugin usa un id de proveedor personalizado.

  </Step>

  <Step title="Añadir resolución dinámica de modelos">
    Si tu proveedor acepta ids de modelo arbitrarios (como un proxy o router),
    añade `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog de arriba

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
    calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo después de que este termine.

  </Step>

  <Step title="Añadir hooks de runtime (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añade hooks
    de forma incremental según lo requiera tu proveedor.

    Los builders de helpers compartidos ahora cubren las familias más comunes de
    repetición/compatibilidad de herramientas, por lo que normalmente los Plugins no necesitan cablear manualmente cada hook uno por uno:

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

    | Family | What it wires in |
    | --- | --- |
    | `openai-compatible` | Política compartida de repetición estilo OpenAI para transportes compatibles con OpenAI, incluida la depuración de `tool-call-id`, correcciones del orden con asistente primero y validación genérica de turnos Gemini cuando el transporte la necesita |
    | `anthropic-by-model` | Política de repetición compatible con Claude elegida por `modelId`, de modo que los transportes de mensajes Anthropic solo reciban limpieza específica de bloques de pensamiento de Claude cuando el modelo resuelto sea realmente un id de Claude |
    | `google-gemini` | Política nativa de repetición de Gemini más depuración de repetición de arranque y modo de salida de razonamiento etiquetado |
    | `passthrough-gemini` | Depuración de firma de pensamiento de Gemini para modelos Gemini ejecutados a través de transportes proxy compatibles con OpenAI; no habilita validación nativa de repetición de Gemini ni reescrituras de arranque |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un solo Plugin; la eliminación opcional de bloques de pensamiento solo para Claude sigue limitada al lado Anthropic |

    Ejemplos reales integrados:

    - `google` y `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` y `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` y `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` y `zai`: `openai-compatible`

    Familias de stream disponibles actualmente:

    | Family | What it wires in |
    | --- | --- |
    | `google-thinking` | Normalización del payload de pensamiento de Gemini en la ruta de stream compartida |
    | `kilocode-thinking` | Envoltorio de razonamiento de Kilo en la ruta de stream proxy compartida, con `kilo/auto` e ids de razonamiento proxy no compatibles omitiendo el pensamiento inyectado |
    | `moonshot-thinking` | Mapeo del payload binario nativo de pensamiento de Moonshot desde la configuración + nivel `/think` |
    | `minimax-fast-mode` | Reescritura de modelos de modo rápido de MiniMax en la ruta de stream compartida |
    | `openai-responses-defaults` | Envoltorios compartidos nativos de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, conformación de payload compatible con razonamiento y gestión de contexto de Responses |
    | `openrouter-thinking` | Envoltorio de razonamiento de OpenRouter para rutas proxy, con omisiones de modelos no compatibles/`auto` gestionadas de forma centralizada |
    | `tool-stream-default-on` | Envoltorio `tool_stream` activado por defecto para proveedores como Z.AI que quieren transmisión de herramientas salvo que se desactive explícitamente |

    Ejemplos reales integrados:

    - `google` y `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` y `minimax-portal`: `minimax-fast-mode`
    - `openai` y `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` también exporta el enum de
    familias de repetición junto con los helpers compartidos a partir de los que se construyen esas familias. Entre las exportaciones públicas
    habituales se incluyen:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders compartidos de repetición como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` y
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de repetición de Gemini como `sanitizeGoogleGeminiReplayHistory(...)`
      y `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` y
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expone tanto el builder de familias como
    los helpers públicos de envoltorio que reutilizan esas familias. Entre las exportaciones públicas
    habituales se incluyen:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - envoltorios compartidos de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` y
      `createCodexNativeWebSearchWrapper(...)`
    - envoltorios compartidos de proxy/proveedor como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` y `createMinimaxFastModeWrapper(...)`

    Algunos helpers de stream permanecen locales al proveedor de forma intencionada. Ejemplo
    integrado actual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los
    builders de envoltorio de Anthropic de nivel inferior desde su superficie pública `api.ts` /
    `contract-api.ts`. Esos helpers siguen siendo específicos de Anthropic porque
    también codifican el manejo beta de OAuth de Claude y el control de `context1m`.

    Otros proveedores integrados también mantienen envoltorios específicos del transporte como locales cuando
    el comportamiento no se comparte limpiamente entre familias. Ejemplo actual: el
    Plugin integrado de xAI mantiene en su propio
    `wrapStreamFn` la conformación nativa de Responses de xAI, incluida la reescritura de alias `/fast`, `tool_stream` predeterminado,
    limpieza de herramientas estrictas no compatibles y eliminación de payload
    específica de razonamiento de xAI.

    `openclaw/plugin-sdk/provider-tools` actualmente expone una familia compartida de
    esquemas de herramientas junto con helpers compartidos de esquema/compatibilidad:

    - `ProviderToolCompatFamily` documenta hoy el inventario de familias compartidas.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta la
      limpieza de esquemas de Gemini + diagnósticos para proveedores que necesitan esquemas de herramientas seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      son los helpers públicos subyacentes de esquemas de Gemini.
    - `resolveXaiModelCompatPatch()` devuelve el parche de compatibilidad integrado de xAI:
      `toolSchemaProfile: "xai"`, palabras clave de esquema no compatibles, compatibilidad nativa con
      `web_search` y decodificación de argumentos de llamada a herramientas con entidades HTML.
    - `applyXaiModelCompat(model)` aplica ese mismo parche de compatibilidad de xAI a un
      modelo resuelto antes de que llegue al runner.

    Ejemplo real integrado: el Plugin de xAI usa `normalizeResolvedModel` más
    `contributeResolvedModelCompat` para mantener esos metadatos de compatibilidad bajo responsabilidad del
    proveedor en lugar de codificar reglas de xAI en el núcleo.

    El mismo patrón de raíz de paquete también respalda otros proveedores integrados:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de proveedor,
      helpers de modelo predeterminado y builders de proveedor realtime
    - `@openclaw/openrouter-provider`: `api.ts` exporta el builder de proveedor
      junto con helpers de onboarding/configuración

    <Tabs>
      <Tab title="Intercambio de token">
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
      <Tab title="Encabezados personalizados">
        Para proveedores que necesitan encabezados de solicitud personalizados o modificaciones del cuerpo:

        ```typescript
        // wrapStreamFn devuelve un StreamFn derivado de ctx.streamFn
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
        Para proveedores que necesitan encabezados o metadatos nativos de solicitud/sesión en
        transportes HTTP o WebSocket genéricos:

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
      </Tab>
    </Tabs>

    <Accordion title="Todos los hooks de proveedor disponibles">
      OpenClaw llama a los hooks en este orden. La mayoría de los proveedores solo usan 2 o 3:

      | # | Hook | Cuándo usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos o valores predeterminados de `baseUrl` |
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de alias de id de modelo heredados/de vista previa antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de familia de proveedor antes del ensamblado genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso en streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación de marcadores de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/alojada por uno mismo o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores sintéticos de perfil almacenado detrás de autenticación de entorno/configuración |
      | 10 | `resolveDynamicModel` | Aceptar ids arbitrarios de modelo upstream |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |

    Notas sobre fallback de runtime:

    - `normalizeConfig` primero comprueba el proveedor coincidente y después otros
      Plugins de proveedor con capacidad de hook hasta que uno realmente cambie la configuración.
      Si ningún hook de proveedor reescribe una entrada de configuración compatible de familia Google, sigue aplicándose
      el normalizador integrado de configuración de Google.
    - `resolveConfigApiKey` usa el hook del proveedor cuando se expone. La ruta integrada de
      `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS,
      aunque la autenticación de runtime de Bedrock sigue usando la cadena predeterminada del SDK de AWS.
      | 13 | `contributeResolvedModelCompat` | Indicadores de compatibilidad para modelos de proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa heredada de capacidades estáticas; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado frente a nativo |
      | 18 | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Envoltorios personalizados de encabezados/cuerpo en la ruta normal de stream |
      | 21 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Encabezados nativos de sesión WS/período de enfriamiento |
      | 23 | `formatApiKey` | Forma personalizada del token de runtime |
      | 24 | `refreshOAuth` | Actualización personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Guía para reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación de límite de tasa/sobrecarga propiedad del proveedor |
      | 28 | `isCacheTtlEligible` | Control de TTL de caché de prompt |
      | 29 | `buildMissingAuthMessage` | Sugerencia personalizada para autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 33 | `isBinaryThinking` | Compatibilidad de pensamiento binario activado/desactivado |
      | 34 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidad de política predeterminada de `/think` |
      | 36 | `isModernModelRef` | Coincidencia de modelos live/smoke |
      | 37 | `prepareRuntimeAuth` | Intercambio de token antes de la inferencia |
      | 38 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 41 | `buildReplayPolicy` | Política personalizada de repetición/Compaction de transcripción |
      | 42 | `sanitizeReplayHistory` | Reescrituras de repetición específicas del proveedor tras la limpieza genérica |
      | 43 | `validateReplayTurns` | Validación estricta de turnos de repetición antes del runner integrado |
      | 44 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Nota sobre ajuste de prompts:

      - `resolveSystemPromptContribution` permite que un proveedor inyecte
        instrucciones del prompt del sistema conscientes de caché para una familia de modelos. Prefiérelo en lugar de
        `before_prompt_build` cuando el comportamiento pertenece a una familia de proveedor/modelo
        y debe conservar la división estable/dinámica de la caché.

      Para descripciones detalladas y ejemplos del mundo real, consulta
      [Internals: Provider Runtime Hooks](/es/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Añadir capacidades extra (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin de proveedor puede registrar voz, transcripción realtime, voz realtime,
    comprensión de medios, generación de imágenes, generación de video, recuperación web
    y búsqueda web junto con la inferencia de texto:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw clasifica esto como un Plugin de **hybrid-capability**. Este es el
    patrón recomendado para Plugins de empresa (un Plugin por proveedor). Consulta
    [Internals: Capability Ownership](/es/plugins/architecture#capability-ownership-model).

    Para la generación de video, prefiere la forma de capacidades con reconocimiento de modo mostrada arriba:
    `generate`, `imageToVideo` y `videoToVideo`. Campos agregados planos como
    `maxInputImages`, `maxInputVideos` y `maxDurationSeconds` no son
    suficientes para anunciar claramente la compatibilidad con modos de transformación o modos deshabilitados.

    Los proveedores de generación de música deben seguir el mismo patrón:
    `generate` para generación solo con prompt y `edit` para generación
    basada en imagen de referencia. Campos agregados planos como `maxInputImages`,
    `supportsLyrics` y `supportsFormat` no son suficientes para anunciar
    compatibilidad con edición; los bloques explícitos `generate` / `edit` son el contrato esperado.

  </Step>

  <Step title="Probar">
    <a id="step-6-test"></a>
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

Los Plugins de proveedor se publican igual que cualquier otro Plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

No uses aquí el alias heredado de publicación solo para Skills; los paquetes de Plugin deben usar
`clawhub package publish`.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata de openclaw.providers
├── openclaw.plugin.json      # Manifiesto con metadata de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pruebas
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referencia del orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los
proveedores integrados:

| Order     | When          | Use case                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primera pasada | Proveedores simples con clave de API            |
| `profile` | Después de simple  | Proveedores condicionados por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar múltiples entradas relacionadas      |
| `late`    | Última pasada     | Sobrescribir proveedores existentes (gana en colisión) |

## Siguientes pasos

- [Channel Plugins](/es/plugins/sdk-channel-plugins) — si tu Plugin también proporciona un canal
- [SDK Runtime](/es/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, búsqueda, subagente)
- [SDK Overview](/es/plugins/sdk-overview) — referencia completa de importaciones de subrutas
- [Plugin Internals](/es/plugins/architecture#provider-runtime-hooks) — detalles de hooks y ejemplos integrados
