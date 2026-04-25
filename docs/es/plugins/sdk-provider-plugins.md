---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres añadir un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas comprender la autenticación del proveedor, los catálogos y los hooks de ejecución
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de Plugins de proveedor
x-i18n:
    generated_at: "2026-04-25T18:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Esta guía explica paso a paso cómo crear un Plugin de proveedor que añade un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación con clave de API y resolución dinámica de modelos.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los Plugins de proveedor añaden modelos al bucle de inferencia normal de OpenClaw. Si el modelo
  debe ejecutarse mediante un daemon de agente nativo que controla hilos,
  Compaction o eventos de herramientas, empareja el proveedor con un [agent harness](/es/plugins/sdk-agent-harness)
  en lugar de poner detalles del protocolo del daemon en el núcleo.
</Tip>

## Recorrido

<Steps>
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
      "description": "Proveedor de modelos Acme AI",
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

    El manifiesto declara `providerAuthEnvVars` para que OpenClaw pueda detectar
    credenciales sin cargar el entorno de ejecución de tu Plugin. Añade `providerAuthAliases`
    cuando una variante del proveedor deba reutilizar la autenticación de otro id de proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor a partir de IDs abreviados
    de modelo como `acme-large` antes de que existan hooks de ejecución. Si publicas el
    proveedor en ClawHub, esos campos `openclaw.compat` y `openclaw.build`
    son obligatorios en `package.json`.

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor mínimo necesita `id`, `label`, `auth` y `catalog`:

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

    Ese ya es un proveedor funcional. Ahora los usuarios pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    Si el proveedor upstream usa tokens de control distintos a los de OpenClaw, añade una
    pequeña transformación bidireccional de texto en lugar de reemplazar la ruta del stream:

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
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes
    de que OpenClaw analice sus propios marcadores de control o la entrega al canal.

    Para proveedores empaquetados que solo registran un proveedor de texto con autenticación
    por clave de API más un único entorno de ejecución respaldado por catálogo, prefiere el helper
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

    `buildProvider` es la ruta del catálogo en vivo usada cuando OpenClaw puede resolver autenticación real
    del proveedor. Puede realizar descubrimiento específico del proveedor. Usa
    `buildStaticProvider` solo para filas sin conexión que sea seguro mostrar antes de que la autenticación
    esté configurada; no debe requerir credenciales ni hacer solicitudes de red.
    La vista `models list --all` de OpenClaw actualmente ejecuta catálogos estáticos
    solo para Plugins de proveedor empaquetados, con una configuración vacía, un entorno vacío y sin
    rutas de agente ni de espacio de trabajo.

    Si tu flujo de autenticación también necesita corregir `models.providers.*`,
    alias y el modelo predeterminado del agente durante el onboarding, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming en el
    transporte normal `openai-completions`, prefiere los helpers compartidos de catálogo en
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones del id del proveedor.
    `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan compatibilidad a partir del mapa de capacidades del
    endpoint, por lo que los endpoints nativos de estilo Moonshot/DashScope siguen pudiendo activarse
    incluso cuando un Plugin usa un id de proveedor personalizado.

  </Step>

  <Step title="Añadir resolución dinámica de modelos">
    Si tu proveedor acepta IDs de modelo arbitrarios (como un proxy o router),
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
    calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo cuando termina.

  </Step>

  <Step title="Añadir hooks de ejecución (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añade hooks
    de forma incremental según lo requiera tu proveedor.

    Los builders de helpers compartidos ahora cubren las familias más comunes de reproducción y compatibilidad
    con herramientas, por lo que normalmente los Plugins no necesitan conectar manualmente cada hook uno por uno:

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

    Familias de reproducción disponibles actualmente:

    | Familia | Qué conecta | Ejemplos empaquetados |
    | --- | --- | --- |
    | `openai-compatible` | Política compartida de reproducción de estilo OpenAI para transportes compatibles con OpenAI, incluida la sanitización de `tool-call-id`, correcciones del orden con asistente primero y validación genérica de turnos Gemini cuando el transporte lo necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de reproducción con reconocimiento de Claude elegida por `modelId`, para que los transportes de mensajes Anthropic solo obtengan limpieza específica de bloques de pensamiento de Claude cuando el modelo resuelto realmente sea un id de Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de reproducción Gemini más sanitización de reproducción bootstrap y modo de salida de razonamiento etiquetado | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitización de firma de pensamiento Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita validación nativa de reproducción Gemini ni reescrituras bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un solo Plugin; la eliminación opcional de bloques de pensamiento solo de Claude sigue limitada al lado Anthropic | `minimax` |

    Familias de stream disponibles actualmente:

    | Familia | Qué conecta | Ejemplos empaquetados |
    | --- | --- | --- |
    | `google-thinking` | Normalización de cargas útiles de razonamiento de Gemini en la ruta de stream compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de razonamiento de Kilo en la ruta de stream de proxy compartida, con omisión del razonamiento inyectado para `kilo/auto` e IDs de razonamiento de proxy no admitidos | `kilocode` |
    | `moonshot-thinking` | Asignación de carga útil binaria de razonamiento nativo de Moonshot a partir de la configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura de modelo en modo rápido de MiniMax en la ruta de stream compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers nativos compartidos de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, conformación de cargas útiles compatibles con razonamiento y gestión de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de razonamiento de OpenRouter para rutas proxy, con omisiones de `auto` y modelos no compatibles gestionadas de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activado por defecto para proveedores como Z.AI que quieren streaming de herramientas salvo que se desactive explícitamente | `zai` |

    <Accordion title="Seams del SDK que impulsan los builders de familias">
      Cada builder de familia se compone de helpers públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita salirse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los builders de reproducción sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta helpers de reproducción de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los wrappers compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), el wrapper compatible con OpenAI para DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) y wrappers compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers subyacentes de esquemas Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) y helpers de compatibilidad con xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). El Plugin empaquetado de xAI usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con estos para mantener las reglas de xAI como responsabilidad del proveedor.

      Algunos helpers de stream permanecen locales al proveedor de forma intencional. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los builders de wrappers de Anthropic de nivel inferior en su propio seam público `api.ts` / `contract-api.ts` porque codifican el manejo beta de OAuth de Claude y la restricción `context1m`. El Plugin de xAI mantiene igualmente la conformación nativa de Responses de xAI en su propio `wrapStreamFn` (alias `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no admitidas y eliminación de cargas útiles de razonamiento específicas de xAI).

      El mismo patrón de raíz de paquete también respalda `@openclaw/openai-provider` (builders de proveedor, helpers de modelo predeterminado, builders de proveedor en tiempo real) y `@openclaw/openrouter-provider` (builder de proveedor más helpers de onboarding/configuración).
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
      <Tab title="Identidad del transporte nativo">
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
      OpenClaw llama a los hooks en este orden. La mayoría de los proveedores solo usan 2-3:

      | # | Hook | Cuándo usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos o valores predeterminados de `baseUrl` |
      | 2 | `applyConfigDefaults` | Valores globales predeterminados propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de alias heredados/de vista previa de IDs de modelo antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso nativo en streaming para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación con marcador de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar placeholders sintéticos de perfiles almacenados detrás de autenticación env/config |
      | 10 | `resolveDynamicModel` | Aceptar IDs de modelo upstream arbitrarios |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidad para modelos de proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa estática heredada de capacidades; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnóstico de esquemas de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetada frente a nativa |
      | 18 | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | 19 | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | 20 | `wrapStreamFn` | Wrappers de encabezados/cuerpo personalizados en la ruta normal de stream |
      | 21 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Encabezados/enfriamiento de sesión WS nativos |
      | 23 | `formatApiKey` | Forma personalizada del token en ejecución |
      | 24 | `refreshOAuth` | Renovación personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación de límite de velocidad/sobrecarga propiedad del proveedor |
      | 28 | `isCacheTtlEligible` | Restricción de TTL de caché de prompts |
      | 29 | `buildMissingAuthMessage` | Sugerencia personalizada para autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 33 | `isBinaryThinking` | Compatibilidad de razonamiento binario activado/desactivado |
      | 34 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidad de política `/think` predeterminada |
      | 36 | `isModernModelRef` | Coincidencia de modelo en vivo/smoke |
      | 37 | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | 38 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 41 | `buildReplayPolicy` | Política personalizada de reproducción/Compaction de transcripciones |
      | 42 | `sanitizeReplayHistory` | Reescrituras de reproducción específicas del proveedor después de la limpieza genérica |
      | 43 | `validateReplayTurns` | Validación estricta de turnos de reproducción antes del runner incrustado |
      | 44 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Notas de respaldo en ejecución:

      - `normalizeConfig` comprueba primero el proveedor coincidente y luego otros Plugins de proveedor con capacidad de hooks hasta que uno realmente cambia la configuración. Si ningún hook de proveedor reescribe una entrada de configuración compatible de la familia Google, se sigue aplicando el normalizador de configuración de Google empaquetado.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. La ruta empaquetada de `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS, aunque la autenticación en ejecución de Bedrock siga usando la cadena predeterminada del SDK de AWS.
      - `resolveSystemPromptContribution` permite que un proveedor inyecte guía de prompt del sistema consciente de caché para una familia de modelos. Préfierelo sobre `before_prompt_build` cuando el comportamiento pertenece a un proveedor o familia de modelos y debe preservar la división de caché estable/dinámica.

      Para descripciones detalladas y ejemplos reales, consulta [Internals: Hooks de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Añadir capacidades adicionales (opcional)">
    Un Plugin de proveedor puede registrar voz, transcripción en tiempo real, voz
    en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web
    y búsqueda web junto con la inferencia de texto. OpenClaw clasifica esto como un
    Plugin de **capacidad híbrida**, el patrón recomendado para Plugins de empresa
    (un Plugin por proveedor). Consulta
    [Internals: Propiedad de capacidades](/es/plugins/architecture#capability-ownership-model).

    Registra cada capacidad dentro de `register(api)` junto a tu llamada existente
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
        los Plugins compartan lecturas limitadas del cuerpo de error, análisis de errores JSON y
        sufijos de ID de solicitud.
      </Tab>
      <Tab title="Transcripción en tiempo real">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el helper
        compartido gestiona captura de proxy, retroceso de reconexión, vaciado al cerrar, handshakes de disponibilidad,
        cola de audio y diagnósticos de eventos de cierre. Tu Plugin
        solo asigna eventos upstream.

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

        Los proveedores STT por lotes que hacen POST de audio multipart deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. El helper normaliza los nombres de archivo
        de carga, incluidas las cargas AAC que necesitan un nombre de archivo estilo M4A para
        APIs de transcripción compatibles.
      </Tab>
      <Tab title="Voz en tiempo real">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Comprensión de medios">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Una foto de..." }),
          transcribeAudio: async (req) => ({ text: "Transcripción..." }),
        });
        ```
      </Tab>
      <Tab title="Generación de imágenes y video">
        Las capacidades de video usan una forma **consciente del modo**: `generate`,
        `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no son
        suficientes para anunciar limpiamente compatibilidad con modos de transformación o modos deshabilitados.
        La generación de música sigue el mismo patrón con bloques explícitos `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* resultado de imagen */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Obtención y búsqueda web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Obtén páginas mediante el backend de renderizado de Acme.",
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
            description: "Obtén una página mediante Acme Fetch.",
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

  <Step title="Probar">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporta tu objeto de configuración del proveedor desde index.ts o un archivo dedicado
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

No uses aquí el alias heredado de publicación solo para Skills; los paquetes de Plugins deben usar
`clawhub package publish`.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadatos de openclaw.providers
├── openclaw.plugin.json      # Manifiesto con metadatos de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pruebas
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referencia del orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo respecto a los
proveedores integrados:

| Orden     | Cuándo        | Caso de uso                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primera pasada | Proveedores simples con clave de API           |
| `profile` | Después de simple  | Proveedores restringidos por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas     |
| `late`    | Última pasada | Sobrescribir proveedores existentes (gana en colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) — si tu Plugin también proporciona un canal
- [SDK Runtime](/es/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Internals del Plugin](/es/plugins/architecture-internals#provider-runtime-hooks) — detalles de hooks y ejemplos empaquetados

## Relacionado

- [Configuración del Plugin SDK](/es/plugins/sdk-setup)
- [Creación de Plugins](/es/plugins/building-plugins)
- [Creación de Plugins de canal](/es/plugins/sdk-channel-plugins)
