---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres agregar un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas entender la autenticación del proveedor, los catálogos y los hooks de tiempo de ejecución
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedor
x-i18n:
    generated_at: "2026-04-24T05:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Esta guía te acompaña en la creación de un Plugin de proveedor que agrega un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación por clave API y resolución dinámica de modelos.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Getting Started](/es/plugins/building-plugins) para la estructura básica del
  paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los plugins de proveedor agregan modelos al bucle normal de inferencia de OpenClaw. Si el modelo
  debe ejecutarse mediante un daemon nativo de agente que sea propietario de hilos, Compaction o eventos
  de herramientas, combina el proveedor con un [agent harness](/es/plugins/sdk-agent-harness)
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
          "choiceLabel": "Clave API de Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Clave API de Acme AI"
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
    credenciales sin cargar el tiempo de ejecución de tu Plugin. Agrega `providerAuthAliases`
    cuando una variante del proveedor deba reutilizar la autenticación de otro id de proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor a partir de ids abreviados
    de modelo como `acme-large` antes de que existan hooks de tiempo de ejecución. Si publicas el
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
      description: "Proveedor de modelos Acme AI",
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
              label: "Clave API de Acme AI",
              hint: "Clave API de tu panel de Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Introduce tu clave API de Acme AI",
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

    Si el proveedor ascendente usa tokens de control diferentes a los de OpenClaw, agrega una
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

    `input` reescribe el prompt final del sistema y el contenido de mensajes de texto antes del
    transporte. `output` reescribe los deltas de texto del asistente y el texto final antes de que
    OpenClaw analice sus propios marcadores de control o haga la entrega al canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación
    por clave API más un único tiempo de ejecución respaldado por catálogo, prefiere el helper
    más limitado `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Proveedor de modelos Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Clave API de Acme AI",
            hint: "Clave API de tu panel de Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Introduce tu clave API de Acme AI",
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

    `buildProvider` es la ruta de catálogo en vivo usada cuando OpenClaw puede resolver autenticación real
    del proveedor. Puede realizar descubrimiento específico del proveedor. Usa
    `buildStaticProvider` solo para filas offline que sea seguro mostrar antes de que la autenticación
    esté configurada; no debe requerir credenciales ni hacer solicitudes de red.
    La visualización actual de `models list --all` de OpenClaw ejecuta catálogos estáticos
    solo para plugins de proveedor incluidos, con configuración vacía, entorno vacío y sin
    rutas de agente/espacio de trabajo.

    Si tu flujo de autenticación también necesita parchear `models.providers.*`, aliases y
    el modelo predeterminado del agente durante la incorporación, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más limitados son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming en el
    transporte normal `openai-completions`, prefiere los helpers de catálogo compartidos en
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones del id
    del proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan compatibilidad a partir del mapa de capacidades del endpoint, de modo que endpoints nativos estilo Moonshot/DashScope sigan participando incluso cuando un Plugin use un id de proveedor personalizado.

  </Step>

  <Step title="Agregar resolución dinámica de modelos">
    Si tu proveedor acepta ids de modelo arbitrarios (como un proxy o router),
    agrega `resolveDynamicModel`:

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
    calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo después de que termine.

  </Step>

  <Step title="Agregar hooks de tiempo de ejecución (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Agrega hooks
    de forma incremental según lo requiera tu proveedor.

    Los builders de helpers compartidos ahora cubren las familias más comunes de replay/compatibilidad
    con herramientas, por lo que los plugins normalmente no necesitan cablear manualmente
    cada hook uno por uno:

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
    | `openai-compatible` | Política compartida de replay estilo OpenAI para transportes compatibles con OpenAI, incluida la sanitización de ids de llamadas de herramientas, correcciones de orden de asistente primero y validación genérica de turnos Gemini cuando el transporte lo necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatible con Claude elegida por `modelId`, para que los transportes de mensajes Anthropic solo reciban limpieza específica de bloques de thinking de Claude cuando el modelo resuelto sea realmente un id de Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay Gemini más sanitización de bootstrap replay y modo etiquetado de salida de razonamiento | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitización de firmas de pensamiento Gemini para modelos Gemini ejecutados mediante transportes proxy compatibles con OpenAI; no habilita validación nativa de replay Gemini ni reescrituras de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un mismo Plugin; la eliminación opcional de bloques de thinking solo de Claude sigue limitada al lado Anthropic | `minimax` |

    Familias de stream disponibles hoy:

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de la carga útil de thinking de Gemini en la ruta compartida de stream | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Envoltorio de razonamiento de Kilo en la ruta compartida de stream del proxy, con `kilo/auto` e ids de razonamiento de proxy no compatibles omitiendo el thinking inyectado | `kilocode` |
    | `moonshot-thinking` | Asignación de carga útil binaria native-thinking de Moonshot a partir de configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura de modelo de modo rápido de MiniMax en la ruta compartida de stream | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Envoltorios compartidos nativos de OpenAI/Codex Responses: cabeceras de atribución, `/fast`/`serviceTier`, verbosidad de texto, web search nativo de Codex, conformación de cargas útiles de compatibilidad de razonamiento y gestión de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Envoltorio de razonamiento de OpenRouter para rutas de proxy, con omisiones de modelos no compatibles/`auto` gestionadas de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Envoltorio `tool_stream` activado por defecto para proveedores como z.ai que quieren streaming de herramientas salvo que se deshabilite explícitamente | `zai` |

    <Accordion title="Seams del SDK que impulsan los builders de familias">
      Cada builder de familia está compuesto a partir de helpers públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita salirse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los builders sin procesar de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta helpers de replay de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los envoltorios compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) y envoltorios compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers subyacentes de esquema Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) y helpers de compatibilidad de xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). El plugin incluido de xAI usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con estos para mantener las reglas de xAI como propiedad del proveedor.

      Algunos helpers de stream permanecen locales al proveedor intencionadamente. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los builders de envoltorio de Anthropic de nivel inferior en su propio seam público `api.ts` / `contract-api.ts` porque codifican el manejo beta de OAuth de Claude y la restricción `context1m`. El plugin de xAI mantiene de forma similar la conformación nativa de xAI Responses en su propio `wrapStreamFn` (aliases de `/fast`, `tool_stream` predeterminado, limpieza estricta de herramientas no compatibles, eliminación de cargas útiles de razonamiento específicas de xAI).

      El mismo patrón de raíz de paquete también respalda `@openclaw/openai-provider` (builders de proveedor, helpers de modelo predeterminado, builders de proveedor realtime) y `@openclaw/openrouter-provider` (builder de proveedor más helpers de incorporación/configuración).
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
      <Tab title="Cabeceras personalizadas">
        Para proveedores que necesitan cabeceras de solicitud personalizadas o modificaciones del cuerpo:

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
      <Tab title="Identidad nativa de transporte">
        Para proveedores que necesitan cabeceras nativas de solicitud/sesión o metadatos en
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
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de alias heredados/preview del id del modelo antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de familia de proveedor antes del ensamblado genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso en streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación con marcador de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autoalojada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores sintéticos de perfiles almacenados por debajo de la autenticación env/config |
      | 10 | `resolveDynamicModel` | Aceptar ids de modelo arbitrarios del upstream |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidad para modelos de un proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa heredada de capacidades estáticas; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquema de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquema de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado frente a nativo |
      | 18 | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Envoltorios personalizados de cabeceras/cuerpo en la ruta normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeceras/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeceras de sesión WS nativas / enfriamiento |
      | 23 | `formatApiKey` | Forma de token personalizada en tiempo de ejecución |
      | 24 | `refreshOAuth` | Renovación OAuth personalizada |
      | 25 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación propiedad del proveedor de límite de tasa/sobrecarga |
      | 28 | `isCacheTtlEligible` | Restricción de TTL de Prompt Caching |
      | 29 | `buildMissingAuthMessage` | Pista personalizada de autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas obsoletas del upstream |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad hacia delante |
      | 32 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 33 | `isBinaryThinking` | Compatibilidad thinking binario activado/desactivado |
      | 34 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidad con política predeterminada de `/think` |
      | 36 | `isModernModelRef` | Coincidencia de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | 38 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcripciones |
      | 42 | `sanitizeReplayHistory` | Reescrituras de replay específicas del proveedor después de la limpieza genérica |
      | 43 | `validateReplayTurns` | Validación estricta de turnos de replay antes del runner integrado |
      | 44 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Notas de alternativas en tiempo de ejecución:

      - `normalizeConfig` comprueba primero el proveedor coincidente y luego otros plugins de proveedor con hooks hasta que uno realmente cambia la configuración. Si ningún hook de proveedor reescribe una entrada compatible de configuración de la familia Google, sigue aplicándose el normalizador incluido de configuración de Google.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. La ruta incluida `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS, aunque la autenticación de tiempo de ejecución de Bedrock siga usando la cadena predeterminada del SDK de AWS.
      - `resolveSystemPromptContribution` permite que un proveedor inyecte orientación del prompt del sistema con reconocimiento de caché para una familia de modelos. Prefiérelo a `before_prompt_build` cuando el comportamiento pertenezca a un proveedor/familia de modelos y deba preservar la división estable/dinámica de caché.

      Para descripciones detalladas y ejemplos del mundo real, consulta [Internals: Provider Runtime Hooks](/es/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Agregar capacidades extra (opcional)">
    Un Plugin de proveedor puede registrar speech, transcripción realtime, voz realtime, comprensión de medios, generación de imágenes, generación de video, web fetch y web search junto con la inferencia de texto. OpenClaw clasifica esto como un plugin de **capacidad híbrida**: el patrón recomendado para plugins de empresa (un plugin por proveedor). Consulta
    [Internals: Capability Ownership](/es/plugins/architecture#capability-ownership-model).

    Registra cada capacidad dentro de `register(api)` junto a tu llamada existente
    `api.registerProvider(...)`. Elige solo las pestañas que necesites:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* datos PCM */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="Transcripción realtime">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el helper compartido
        gestiona captura de proxy, backoff de reconexión, vaciado al cerrar, handshakes de listo, cola de audio y diagnósticos de eventos de cierre. Tu Plugin
        solo asigna eventos del upstream.

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

        Los proveedores STT por lotes que hacen POST de audio multipart deberían usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. El helper normaliza los nombres
        de archivo subidos, incluidas las subidas AAC que necesitan un nombre de archivo estilo M4A para APIs de transcripción compatibles.
      </Tab>
      <Tab title="Voz realtime">
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
        Las capacidades de video usan una forma **con reconocimiento de modo**: `generate`,
        `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no son
        suficientes para anunciar compatibilidad con modo de transformación o modos deshabilitados de forma limpia.
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
      <Tab title="Web fetch y search">
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
    // Exporta tu objeto de configuración de proveedor desde index.ts o un archivo dedicado
    import { acmeProvider } from "./provider.js";

    describe("proveedor acme-ai", () => {
      it("resuelve modelos dinámicos", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("devuelve catálogo cuando la clave está disponible", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("devuelve catálogo nulo cuando no hay clave", async () => {
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

Los plugins de proveedor se publican igual que cualquier otro plugin externo de código:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

No uses aquí el alias heredado de publicación solo para Skills; los paquetes de plugins deberían usar
`clawhub package publish`.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadatos openclaw.providers
├── openclaw.plugin.json      # manifiesto con metadatos de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # pruebas
    └── usage.ts              # endpoint de uso (opcional)
```

## Referencia de orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los
proveedores integrados:

| Orden     | Cuándo         | Caso de uso                                      |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Primera pasada | Proveedores simples con clave API               |
| `profile` | Después de simple | Proveedores restringidos por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas      |
| `late`    | Última pasada  | Sobrescribir proveedores existentes (gana en colisión) |

## Siguientes pasos

- [Channel Plugins](/es/plugins/sdk-channel-plugins) — si tu Plugin también proporciona un canal
- [SDK Runtime](/es/plugins/sdk-runtime) — ayudas `api.runtime` (TTS, search, subagent)
- [SDK Overview](/es/plugins/sdk-overview) — referencia completa de importación de subrutas
- [Plugin Internals](/es/plugins/architecture-internals#provider-runtime-hooks) — detalles de hooks y ejemplos incluidos

## Relacionado

- [Configuración del Plugin SDK](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Creación de plugins de canal](/es/plugins/sdk-channel-plugins)
