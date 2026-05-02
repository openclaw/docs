---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres agregar un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Debes comprender la autenticación de proveedores, los catálogos y los puntos de enlace de tiempo de ejecución
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedor
x-i18n:
    generated_at: "2026-05-02T22:21:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un Plugin de proveedor que añade un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación con clave de API y resolución dinámica de modelos.

<Info>
  Si aún no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los Plugins de proveedor añaden modelos al bucle de inferencia normal de OpenClaw. Si el modelo
  debe ejecutarse mediante un daemon de agente nativo que posee hilos, compaction o eventos de
  herramientas, combina el proveedor con un [arnés de agente](/es/plugins/sdk-agent-harness)
  en lugar de poner los detalles del protocolo del daemon en el núcleo.
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
    cuando una variante de proveedor deba reutilizar la autenticación de otro id de proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor desde ids
    de modelo abreviados como `acme-large` antes de que existan hooks de runtime. Si publicas el
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

    Ese es un proveedor funcional. Los usuarios ahora pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    Si el proveedor upstream usa tokens de control distintos a los de OpenClaw, añade una
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

    `input` reescribe el prompt del sistema final y el contenido de los mensajes de texto antes
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes de que
    OpenClaw analice sus propios marcadores de control o la entrega de canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación por clave
    de API más un único runtime respaldado por catálogo, prefiere el helper más específico
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

    `buildProvider` es la ruta de catálogo en vivo usada cuando OpenClaw puede resolver autenticación
    real del proveedor. Puede realizar descubrimiento específico del proveedor. Usa
    `buildStaticProvider` solo para filas sin conexión que sea seguro mostrar antes de configurar
    la autenticación; no debe requerir credenciales ni realizar solicitudes de red.
    La visualización actual de `models list --all` de OpenClaw ejecuta catálogos estáticos
    solo para Plugins de proveedor incluidos, con una configuración vacía, entorno vacío y sin
    rutas de agente/espacio de trabajo.

    Si tu flujo de autenticación también necesita aplicar parches a `models.providers.*`, alias y
    el modelo predeterminado del agente durante la incorporación, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming sobre el
    transporte normal `openai-completions`, prefiere los helpers de catálogo compartidos en
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de hardcodear
    comprobaciones de id de proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan la compatibilidad desde el
    mapa de capacidades del endpoint, de modo que los endpoints nativos de estilo Moonshot/DashScope
    siguen optando por ello incluso cuando un Plugin usa un id de proveedor personalizado.

  </Step>

  <Step title="Añadir resolución dinámica de modelos">
    Si tu proveedor acepta IDs de modelo arbitrarios (como un proxy o router),
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
    calentamiento asíncrono; `resolveDynamicModel` vuelve a ejecutarse después de completarse.

  </Step>

  <Step title="Añadir hooks de runtime (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añade hooks
    de forma incremental a medida que tu proveedor los requiera.

    Los builders de helpers compartidos ahora cubren las familias más comunes de compatibilidad
    con replay/herramientas, así que los Plugins normalmente no necesitan cablear cada hook uno por uno:

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

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política de replay compartida de estilo OpenAI para transportes compatibles con OpenAI, incluida la limpieza de ids de llamadas a herramientas, correcciones de ordenación con asistente primero y validación genérica de turnos de Gemini cuando el transporte la necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatible con Claude elegida por `modelId`, de modo que los transportes de mensajes Anthropic solo reciben limpieza de bloques de razonamiento específica de Claude cuando el modelo resuelto es realmente un id de Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política de replay nativa de Gemini más limpieza de replay de arranque y modo de salida de razonamiento etiquetado | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Limpieza de firmas de pensamiento de Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita la validación de replay nativa de Gemini ni las reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un solo Plugin; la eliminación opcional de bloques de pensamiento solo de Claude permanece limitada al lado Anthropic | `minimax` |

    Familias de flujo disponibles actualmente:

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de cargas útiles de pensamiento de Gemini en la ruta de flujo compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Envoltorio de razonamiento de Kilo en la ruta de flujo de proxy compartida, con `kilo/auto` y los identificadores de razonamiento de proxy no compatibles omitiendo el pensamiento inyectado | `kilocode` |
    | `moonshot-thinking` | Asignación de cargas útiles binarias de pensamiento nativo de Moonshot desde la configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura de modelo en modo rápido de MiniMax en la ruta de flujo compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Envoltorios compartidos de Responses nativas de OpenAI/Codex: encabezados de atribución, `/fast`/`serviceTier`, verbosidad del texto, búsqueda web nativa de Codex, conformación de cargas útiles compatibles con razonamiento y gestión de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Envoltorio de razonamiento de OpenRouter para rutas de proxy, con omisiones de modelos no compatibles/`auto` gestionadas centralmente | `openrouter` |
    | `tool-stream-default-on` | Envoltorio `tool_stream` activado de forma predeterminada para proveedores como Z.AI que quieren flujo de herramientas salvo que se desactive explícitamente | `zai` |

    <Accordion title="Puntos de extensión del SDK que impulsan los constructores de familias">
      Cada constructor de familia se compone a partir de ayudantes públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita apartarse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores de reproducción sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta ayudantes de reproducción de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y ayudantes de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los envoltorios compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), el envoltorio compatible con OpenAI de DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), la limpieza de precarga de pensamiento de Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) y los envoltorios compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, los ayudantes de esquema de Gemini subyacentes (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) y los ayudantes de compatibilidad de xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). El Plugin xAI incluido usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con estos para mantener las reglas de xAI en propiedad del proveedor.

      Algunos ayudantes de flujo permanecen locales al proveedor a propósito. `@openclaw/anthropic-provider` conserva `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de envoltorios de Anthropic de nivel inferior en su propio punto de extensión público `api.ts` / `contract-api.ts` porque codifican el manejo beta de OAuth de Claude y el control de `context1m`. El Plugin xAI conserva de forma similar la conformación nativa de xAI Responses en su propio `wrapStreamFn` (alias de `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no compatibles, eliminación de cargas útiles de razonamiento específica de xAI).

      El mismo patrón de raíz de paquete también respalda a `@openclaw/openai-provider` (constructores de proveedor, ayudantes de modelo predeterminado, constructores de proveedor en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedor más ayudantes de onboarding/configuración).
    </Accordion>

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
      <Tab title="Identidad de transporte nativa">
        Para proveedores que necesitan encabezados de solicitud/sesión nativos o metadatos en
        transportes genéricos HTTP o WebSocket:

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
      Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
      `ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se enumeran
      aquí.

      | # | Hook | Cuándo usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos o valores predeterminados de URL base |
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de configuración |
      | 3 | `normalizeModelId` | Limpieza de alias de identificador de modelo heredado/vista previa antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de familia de proveedor antes del ensamblaje genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso de streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación con marcador de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores de posición de perfil almacenado sintético por debajo de autenticación de entorno/configuración |
      | 10 | `resolveDynamicModel` | Aceptar identificadores de modelo upstream arbitrarios |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |
      | 13 | `contributeResolvedModelCompat` | Indicadores de compatibilidad para modelos de proveedor detrás de otro transporte compatible |
      | 14 | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | 15 | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | 16 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetada frente a nativa |
      | 17 | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | 18 | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | 19 | `wrapStreamFn` | Envoltorios personalizados de encabezados/cuerpo en la ruta de flujo normal |
      | 20 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 21 | `resolveWebSocketSessionPolicy` | Encabezados/enfriamiento de sesión WS nativos |
      | 22 | `formatApiKey` | Forma de token de runtime personalizada |
      | 23 | `refreshOAuth` | Actualización OAuth personalizada |
      | 24 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 25 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 26 | `classifyFailoverReason` | Clasificación de límite de tasa/sobrecarga propiedad del proveedor |
      | 27 | `isCacheTtlEligible` | Control de TTL de caché de prompts |
      | 28 | `buildMissingAuthMessage` | Indicación personalizada de autenticación faltante |
      | 29 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 30 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 31 | `isBinaryThinking` | Compatibilidad de activación/desactivación de pensamiento binario |
      | 32 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilidad de política `/think` predeterminada |
      | 34 | `isModernModelRef` | Coincidencia de modelos live/smoke |
      | 35 | `prepareRuntimeAuth` | Intercambio de token antes de la inferencia |
      | 36 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 37 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 38 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 39 | `buildReplayPolicy` | Política personalizada de reproducción/Compaction de transcript |
      | 40 | `sanitizeReplayHistory` | Reescrituras de reproducción específicas del proveedor tras la limpieza genérica |
      | 41 | `validateReplayTurns` | Validación estricta de turnos de reproducción antes del runner embebido |
      | 42 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Notas de fallback de runtime:

      - `normalizeConfig` revisa primero el proveedor coincidente y luego otros Plugins de proveedor con hooks hasta que uno realmente cambia la configuración. Si ningún hook de proveedor reescribe una entrada de configuración compatible con la familia Google, se sigue aplicando el normalizador de configuración de Google incluido.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. La ruta incluida `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS, aunque la autenticación de runtime de Bedrock sigue usando la cadena predeterminada del AWS SDK.
      - `resolveSystemPromptContribution` permite a un proveedor inyectar guía de system prompt consciente de caché para una familia de modelos. Prefiérelo sobre `before_prompt_build` cuando el comportamiento pertenece a un proveedor/familia de modelos y debe preservar la división de caché estable/dinámica.

      Para descripciones detalladas y ejemplos reales, consulta [Internos: hooks de runtime de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Añadir capacidades adicionales (opcional)">
    ### Paso 5: Añadir capacidades adicionales

    Un Plugin de proveedor puede registrar voz, transcripción en tiempo real, voz
    en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web
    y búsqueda web junto con la inferencia de texto. OpenClaw clasifica esto como un
    Plugin de **capacidad híbrida**: el patrón recomendado para Plugins de empresa
    (un Plugin por proveedor). Consulta
    [Internos: propiedad de capacidades](/es/plugins/architecture#capability-ownership-model).

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

        Usa `assertOkOrThrowProviderError(...)` para errores HTTP de proveedores, de modo que
        los plugins compartan lecturas limitadas del cuerpo de error, análisis de errores JSON y
        sufijos de ID de solicitud.
      </Tab>
      <Tab title="Realtime transcription">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el helper compartido
        gestiona la captura de proxy, el backoff de reconexión, el vaciado al cerrar, los
        handshakes de preparación, el encolado de audio y los diagnósticos de eventos de cierre.
        Tu plugin solo asigna los eventos upstream.

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
        `buildAudioTranscriptionFormData(...)` desde
        `openclaw/plugin-sdk/provider-http`. El helper normaliza los nombres de archivo de carga,
        incluidas las cargas AAC que necesitan un nombre de archivo con estilo M4A para
        APIs de transcripción compatibles.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        Implementa `handleBargeIn` cuando un transporte puede detectar que una persona está
        interrumpiendo la reproducción del asistente y el proveedor admite truncar o
        borrar la respuesta de audio activa.
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
      </Tab>
      <Tab title="Image and video generation">
        Las capacidades de video usan una forma **consciente del modo**: `generate`,
        `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no son
        suficientes para anunciar correctamente la compatibilidad con modos de transformación
        o modos deshabilitados. La generación de música sigue el mismo patrón con bloques
        explícitos `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
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

No uses aquí el alias de publicación heredado exclusivo de skill; los paquetes de plugin deben usar
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

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los proveedores
integrados:

| Orden     | Cuándo         | Caso de uso                                     |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Primera pasada | Proveedores simples con clave de API            |
| `profile` | Después de simple | Proveedores protegidos por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas       |
| `late`    | Última pasada  | Sobrescribir proveedores existentes (gana en caso de colisión) |

## Próximos pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins): si tu plugin también proporciona un canal
- [Runtime del SDK](/es/plugins/sdk-runtime): helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview): referencia completa de importación de subrutas
- [Internos de plugins](/es/plugins/architecture-internals#provider-runtime-hooks): detalles de hooks y ejemplos integrados

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Crear plugins de canal](/es/plugins/sdk-channel-plugins)
