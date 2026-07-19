---
read_when:
    - Está creando un nuevo plugin de proveedor de modelos
    - Quiere añadir un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Es necesario comprender la autenticación de proveedores, los catálogos y los hooks de tiempo de ejecución
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedores
x-i18n:
    generated_at: "2026-07-19T02:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Crea un Plugin de proveedor para añadir un proveedor de modelos (LLM) a OpenClaw: un catálogo de
modelos, autenticación mediante clave de API y resolución dinámica de modelos.

<Info>
  ¿Es la primera vez que trabaja con plugins de OpenClaw? Lea primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los plugins de proveedor añaden modelos al bucle de inferencia normal de OpenClaw. Si el
  modelo debe ejecutarse mediante un daemon de agente nativo que gestiona hilos, Compaction
  o eventos de herramientas, combine el proveedor con un [entorno de
  agente](/es/plugins/sdk-agent-harness) en lugar de incluir detalles del protocolo del daemon
  en el núcleo.
</Tip>

## Tutorial

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

    `setup.providers[].envVars` permite que OpenClaw detecte credenciales sin
    cargar el entorno de ejecución del Plugin. Añada `providerAuthAliases` cuando una variante del proveedor
    deba reutilizar la autenticación del id de otro proveedor. `modelSupport` es
    opcional y permite que OpenClaw cargue automáticamente el Plugin de proveedor a partir de identificadores
    abreviados de modelos como `acme-large` antes de que existan enlaces de entorno de ejecución. `openclaw.compat`
    y `openclaw.build` en `package.json` son obligatorios para publicar en ClawHub
    (`openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`
    son los dos campos obligatorios; `minGatewayVersion` utiliza
    `openclaw.install.minHostVersion` como valor de reserva cuando se omite).

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor de texto mínimo necesita `id`, `label`, `auth` y `catalog`.
    `catalog` es el enlace de entorno de ejecución/configuración propiedad del proveedor; puede llamar a API
    activas del proveedor y devuelve entradas `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Proveedor de modelos de Acme AI",
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
              label: "Clave de API de Acme AI",
              hint: "Clave de API del panel de Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Introduzca su clave de API de Acme AI",
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
    para la interfaz de lista/ayuda/selector, que abarca filas `text`, `voice`, `image_generation`,
    `video_generation` y `music_generation`. Mantenga las llamadas a los endpoints
    del proveedor y la asignación de respuestas en el Plugin; OpenClaw gestiona la forma
    compartida de las filas, las etiquetas de origen y la representación de la ayuda.

    Con esto ya se dispone de un proveedor funcional. Ahora los usuarios pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como modelo.

    ### Detección de modelos activos

    Si el proveedor expone una API de estilo `/models`, mantenga el
    endpoint específico del proveedor y la proyección de filas en el Plugin, y utilice
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para el ciclo de vida
    compartido de obtención. El auxiliar proporciona solicitudes HTTP protegidas, encabezados de autenticación
    del proveedor, errores HTTP estructurados, almacenamiento en caché con TTL y comportamiento de reserva estático sin
    introducir políticas del proveedor en el núcleo de OpenClaw.

    Utilice `buildLiveModelProviderConfig` cuando la API activa solo indique qué
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

    Utilice `getCachedLiveProviderModelRows` cuando la API del proveedor devuelva metadatos
    más completos y el propio Plugin deba proyectar las filas en definiciones de modelos
    de OpenClaw:

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
    credenciales válidas disponibles. Mantenga un `staticRun` sin conexión o una reserva estática para que la configuración, la documentación,
    las pruebas y las superficies de selección no dependan del acceso activo a la red. Utilice un TTL
    adecuado para la actualización de la lista de modelos, evite sondear el sistema de archivos durante las solicitudes
    y proporcione un `readRows` / `readModelId` específico del proveedor solo cuando la
    respuesta del servicio ascendente no tenga una estructura `{ data: [{ id, object }] }`
    compatible con OpenAI.

    Si el proveedor ascendente utiliza tokens de control distintos de los de OpenClaw, añada una
    pequeña transformación de texto bidireccional en lugar de reemplazar la ruta de transmisión:

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
    de que OpenClaw analice sus propios marcadores de control o realice la entrega al canal.

    Para proveedores integrados que solo registren un proveedor de texto con autenticación mediante
    clave de API y un único entorno de ejecución respaldado por catálogo, utilice preferentemente el auxiliar
    más específico `defineSingleProviderPluginEntry(...)`:

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
            label: "Clave de API de Acme AI",
            hint: "Clave de API del panel de Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Introduzca la clave de API de Acme AI",
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

    `buildProvider` es la ruta del catálogo activo que se utiliza cuando OpenClaw puede resolver la
    autenticación real del proveedor. Puede realizar una detección específica del proveedor. Use
    `buildStaticProvider` solo para filas sin conexión que sea seguro mostrar antes de configurar
    la autenticación; no debe requerir credenciales ni realizar solicitudes de red.
    La visualización `models list --all` de OpenClaw actualmente ejecuta catálogos estáticos
    solo para plugins de proveedores incluidos, con una configuración vacía, un entorno vacío y sin
    rutas de agente ni de espacio de trabajo.

    Si el flujo de autenticación también necesita modificar `models.providers.*`, los alias y
    el modelo predeterminado del agente durante la incorporación, use las funciones auxiliares de preajustes de
    `openclaw/plugin-sdk/provider-onboard`. Las funciones auxiliares más específicas son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admita bloques de uso transmitidos mediante el
    transporte `openai-completions` normal, prefiera las funciones auxiliares de catálogo compartidas de
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar de forma rígida
    comprobaciones del id del proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan la compatibilidad a partir del
    mapa de capacidades del endpoint, de modo que los endpoints nativos del tipo Moonshot/DashScope
    sigan habilitándose incluso cuando un plugin utilice un id de proveedor personalizado.

    Los ejemplos de detección activa anteriores abarcan las API de proveedores del tipo `/models`. Mantenga
    esa detección dentro de `catalog.run`, condicionada a una autenticación utilizable, y mantenga
    `staticRun` sin acceso a la red para generar catálogos sin conexión.

  </Step>

  <Step title="Añadir resolución dinámica de modelos">
    Si el proveedor acepta identificadores de modelo arbitrarios (como un proxy o enrutador),
    añada `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, etiqueta, autenticación y catálogo anteriores

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

    Si la resolución requiere una llamada de red, use `prepareDynamicModel` para el
    calentamiento asíncrono; `resolveDynamicModel` vuelve a ejecutarse cuando finaliza.

  </Step>

  <Step title="Añadir hooks de tiempo de ejecución (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añada hooks
    progresivamente a medida que el proveedor los requiera.

    Los constructores auxiliares compartidos ahora abarcan las familias más comunes de compatibilidad
    con reproducción y herramientas, por lo que los plugins normalmente no necesitan conectar manualmente cada hook por separado:

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

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política de reproducción compartida del tipo OpenAI para transportes compatibles con OpenAI, incluida la depuración de identificadores de llamadas a herramientas, las correcciones del orden que sitúa primero al asistente y la validación genérica de turnos de Gemini cuando el transporte la necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de reproducción compatible con Claude seleccionada por `modelId`, para que los transportes de mensajes de Anthropic solo reciban la limpieza de bloques de pensamiento específica de Claude cuando el modelo resuelto sea realmente un id de Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | La misma política de Claude según el modelo que `anthropic-by-model`, además de la depuración de identificadores de llamadas a herramientas y la conservación de los identificadores nativos de uso de herramientas de Anthropic para los transportes que deban conservar los identificadores nativos del proveedor | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Política de reproducción nativa de Gemini más depuración de la reproducción de arranque. La familia compartida mantiene la CLI de Gemini con salida de texto en el razonamiento etiquetado; el proveedor directo `google` sustituye `resolveReasoningOutputMode` por `native` porque el pensamiento de la API de Gemini llega como partes de pensamiento nativas. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Depuración de firmas de pensamiento de Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita la validación de reproducción nativa de Gemini ni las reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que combinan superficies de modelos de mensajes de Anthropic y compatibles con OpenAI en un solo plugin; la eliminación opcional de bloques de pensamiento exclusiva de Claude permanece limitada al lado de Anthropic | `minimax` |

    Familias de transmisión disponibles actualmente:

    | Familia | Qué conecta | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de la carga útil de pensamiento de Gemini en la ruta de transmisión compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Envoltorio de razonamiento de Kilo en la ruta compartida de transmisión mediante proxy, donde `kilo-auto/balanced` y los identificadores de razonamiento de proxy no compatibles omiten el pensamiento inyectado | `kilocode` |
    | `moonshot-thinking` | Asignación de la carga útil binaria de pensamiento nativo de Moonshot a partir de la configuración + nivel `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura del modelo de modo rápido de MiniMax en la ruta de transmisión compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Envoltorios compartidos nativos de Responses de OpenAI/Codex: encabezados de atribución, `/fast`/`serviceTier`, nivel de detalle del texto, búsqueda web nativa de Codex, adaptación de la carga útil para compatibilidad con razonamiento y gestión del contexto de Responses | `openai` |
    | `openrouter-thinking` | Envoltorio de razonamiento de OpenRouter para rutas proxy, con las omisiones de modelos no compatibles/`auto` gestionadas de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Envoltorio `tool_stream` activado de forma predeterminada para proveedores como Z.AI que desean transmisión de herramientas salvo que se deshabilite explícitamente | `zai` |

    <Accordion title="Interfaces del SDK que sustentan los constructores de familias">
      Cada constructor de familia se compone de funciones auxiliares públicas de nivel inferior exportadas desde el mismo paquete, a las que se puede recurrir cuando un proveedor necesita apartarse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores de reproducción sin procesar (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta funciones auxiliares de reproducción de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y funciones auxiliares de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los envoltorios compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), el envoltorio de DeepSeek V4 compatible con OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), la limpieza del prellenado de pensamiento de Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilidad de llamadas a herramientas en texto sin formato (`createPlainTextToolCallCompatWrapper`) y los envoltorios compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - envoltorios ligeros de cargas útiles y eventos para rutas críticas de proveedores, incluidos `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` y `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` y funciones auxiliares subyacentes del esquema del proveedor.

      Para los proveedores de la familia Gemini, mantenga el modo de salida de razonamiento alineado con
      el transporte. Los proveedores directos de la API de Google Gemini deben usar la salida de razonamiento
      `native` para que OpenClaw consuma partes de pensamiento nativas sin añadir
      directivas de prompt `<think>` / `<final>`. Los backends del tipo
      CLI de Gemini solo de texto que analizan una respuesta final JSON/de texto pueden conservar el contrato
      etiquetado compartido `google-gemini`.

      Algunas funciones auxiliares de transmisión se mantienen locales al proveedor deliberadamente. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de envoltorios de Anthropic de nivel inferior en su propia interfaz pública `api.ts` / `contract-api.ts`, porque codifican la gestión de la beta de OAuth de Claude y el control de acceso `context1m`. Del mismo modo, el plugin de xAI mantiene la adaptación nativa de Responses de xAI en su propio `wrapStreamFn` (alias `/fast`, valor predeterminado `tool_stream`, limpieza estricta de herramientas no compatibles y eliminación de cargas útiles de razonamiento específica de xAI).

      El mismo patrón de raíz de paquete también sustenta `@openclaw/openai-provider` (constructores de proveedores, funciones auxiliares de modelos predeterminados y constructores de proveedores en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedores más funciones auxiliares de incorporación/configuración).
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
        // wrapStreamFn devuelve una StreamFn derivada de ctx.streamFn
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

        `resolveUsageAuth` tiene tres resultados. Devuelva
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` cuando el
        proveedor tenga una credencial de uso/facturación (los campos opcionales transfieren
        metadatos no secretos del plan desde el perfil resuelto hasta
        `fetchUsageSnapshot`). Devuelva
        `{ handled: true }` solo cuando el proveedor haya gestionado definitivamente la
        autenticación de uso, pero no disponga de un token de uso válido, y OpenClaw deba omitir
        el mecanismo de reserva genérico de clave de API/OAuth. Devuelva `null` o `undefined` cuando el proveedor
        no haya gestionado la solicitud y OpenClaw deba continuar con el mecanismo de reserva genérico.

        Declare el identificador del proveedor en `contracts.usageProviders`. Cuando ese contrato
        de manifiesto y **ambos** hooks estén presentes, OpenClaw incluye automáticamente
        al proveedor en la recopilación de uso sin cargar plugins de proveedores
        no relacionados. No es necesario actualizar la lista de permitidos del núcleo.
        `fetchUsageSnapshot` devuelve la estructura compartida independiente del proveedor:

        - `plan`: etiqueta de suscripción o clave indicada por el proveedor
        - `windows`: períodos de cuota restablecibles como porcentajes utilizados
        - `billing`: entradas con tipo `balance`, `spend` o `budget`; `unit` puede ser
          una moneda ISO o una unidad del proveedor, como `credits`
        - `summary`: contexto compacto específico del proveedor que no cabe en esos
          campos estructurados

        Mantenga exacta la semántica de las monedas. Un crédito del proveedor no equivale a USD salvo que el
        contrato de origen así lo indique. Un plugin que implemente únicamente
        `fetchUsageSnapshot` seguirá estando disponible para llamadores explícitos/sintéticos, pero
        no se detectará automáticamente, porque OpenClaw no puede resolver su credencial de uso.
      </Tab>
    </Tabs>

    <Accordion title="Hooks comunes de proveedores">
      OpenClaw llama a los hooks aproximadamente en este orden para los plugins de modelos/proveedores.
      La mayoría de los proveedores solo utilizan 2-3. Este no es el contrato completo de `ProviderPlugin`:
      consulte [Aspectos internos: hooks del entorno de ejecución del
      proveedor](/es/plugins/architecture-internals#provider-runtime-hooks) para ver la
      lista completa y actualmente vigente de hooks y las notas sobre mecanismos de reserva.
      Los campos de proveedores destinados únicamente a la compatibilidad que OpenClaw ya no invoca, como
      `ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se incluyen
      aquí.

      | Hook | Cuándo utilizarlo |
      | --- | --- |
      | `catalog` | Catálogo de modelos o valores predeterminados de la URL base |
      | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | `normalizeModelId` | Limpieza de alias de identificadores de modelos heredados o en vista previa antes de la búsqueda |
      | `normalizeTransport` | Limpieza de `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo |
      | `normalizeConfig` | Normalizar la configuración de `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad del uso nativo en streaming para proveedores de configuración |
      | `resolveConfigApiKey` | Resolución de autenticación mediante marcadores de entorno propiedad del proveedor |
      | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | `resolveExternalAuthProfiles` | Superponer perfiles de autenticación externos propiedad del proveedor para credenciales gestionadas por la CLI/aplicación |
      | `shouldDeferSyntheticProfileAuth` | Colocar los marcadores sintéticos de perfiles almacenados por debajo de la autenticación de entorno/configuración |
      | `resolveDynamicModel` | Aceptar identificadores arbitrarios de modelos de origen |
      | `prepareDynamicModel` | Obtener metadatos de forma asíncrona antes de la resolución |
      | `normalizeResolvedModel` | Reescrituras de transporte antes del ejecutor |
      | `normalizeToolSchemas` | Limpieza del esquema de herramientas propiedad del proveedor antes del registro |
      | `inspectToolSchemas` | Diagnósticos del esquema de herramientas propiedad del proveedor |
      | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetada frente a nativa |
      | `prepareExtraParams` | Parámetros predeterminados de solicitud |
      | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | `wrapStreamFn` | Encapsuladores personalizados de encabezados/cuerpo en la ruta normal de streaming |
      | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | `resolveWebSocketSessionPolicy` | Encabezados/tiempo de espera de sesión WS nativa |
      | `formatApiKey` | Estructura personalizada del token del entorno de ejecución |
      | `refreshOAuth` | Renovación personalizada de OAuth |
      | `buildAuthDoctorHint` | Orientación para reparar la autenticación |
      | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | `classifyFailoverReason` | Clasificación de limitación de frecuencia/sobrecarga propiedad del proveedor |
      | `isCacheTtlEligible` | Control mediante TTL de la caché de prompts |
      | `buildMissingAuthMessage` | Sugerencia personalizada para autenticación ausente |
      | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura (obsoleto: se prefiere `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Conjunto de opciones de `/think` específico del modelo |
      | `isBinaryThinking` | Compatibilidad binaria para activar/desactivar el pensamiento (obsoleto: se prefiere `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilidad con el razonamiento de `xhigh` (obsoleto: se prefiere `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilidad con la política predeterminada de `/think` (obsoleto: se prefiere `resolveThinkingProfile`) |
      | `isModernModelRef` | Correspondencia de modelos para pruebas en vivo/de humo |
      | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | `buildReplayPolicy` | Política personalizada de reproducción/Compaction de transcripciones |
      | `sanitizeReplayHistory` | Reescrituras de reproducción específicas del proveedor después de la limpieza genérica |
      | `validateReplayTurns` | Validación estricta de turnos reproducidos antes del ejecutor integrado |
      | `onModelSelected` | Retrollamada posterior a la selección (p. ej., telemetría) |

      Notas sobre los mecanismos de reserva del entorno de ejecución:

      - `normalizeConfig` resuelve un plugin propietario por identificador de proveedor (primero los proveedores incluidos y después el plugin del entorno de ejecución coincidente) y llama únicamente a ese hook; no se examinan otros proveedores. El propio hook `normalizeConfig` de Google es el que normaliza las entradas de configuración `google` / `google-vertex` / `google-antigravity`; no es un mecanismo de reserva independiente del núcleo.
      - `resolveConfigApiKey` utiliza el hook del proveedor cuando está expuesto. Amazon Bedrock mantiene la resolución mediante marcadores de entorno de AWS en su plugin de proveedor; la autenticación del entorno de ejecución sigue utilizando la cadena predeterminada del SDK de AWS cuando se configura con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recibe los elementos seleccionados `provider`, `modelId`, la sugerencia de catálogo `reasoning` combinada opcional y los datos `compat` combinados opcionales del modelo. Utilice `compat` únicamente para seleccionar la interfaz/el perfil de pensamiento del proveedor.
      - `resolveSystemPromptContribution` permite que un proveedor inserte orientación para el prompt del sistema sensible a la caché para una familia de modelos. Se prefiere al hook heredado `before_prompt_build` de todo el plugin cuando el comportamiento pertenece a una única familia de proveedor/modelos y debe conservar la separación entre caché estable y dinámica.

    </Accordion>

  </Step>

  <Step title="Añadir capacidades adicionales (opcional)">
    ### Paso 5: Añadir capacidades adicionales

    Un plugin de proveedor puede registrar embeddings, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión multimedia, generación de imágenes, generación de vídeo,
    obtención web y búsqueda web junto con la inferencia de texto. OpenClaw lo clasifica como un
    plugin de **capacidad híbrida**, el patrón recomendado para plugins de empresas
    (un plugin por proveedor). Consulte
    [Aspectos internos: propiedad de las capacidades](/es/plugins/architecture#capability-ownership-model).

    Registre cada capacidad dentro de `register(api)` junto con la llamada existente a
    `api.registerProvider(...)`. Elija solo las pestañas que necesite:

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

        Utilice `assertOkOrThrowProviderError(...)` para los fallos HTTP del proveedor, de modo que
        los plugins compartan lecturas limitadas del cuerpo de los errores, análisis de errores JSON y
        sufijos de identificadores de solicitud.
      </Tab>
      <Tab title="Transcripción en tiempo real">
        Se prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el asistente
        compartido gestiona la captura del proxy, la espera incremental para reconexiones, el vaciado al cerrar, los intercambios
        de preparación, la puesta en cola de audio y los diagnósticos de eventos de cierre. El plugin
        solo asigna los eventos de origen.

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

        Los proveedores de STT por lotes que envíen audio multipart mediante POST deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. La función auxiliar normaliza los nombres
        de archivo de las cargas, incluidas las cargas AAC que necesitan un nombre de archivo de estilo M4A para
        las API de transcripción compatibles.
      </Tab>
      <Tab title="Voz en tiempo real">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Voz en tiempo real de Acme",
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
            // Establezca esto únicamente si el proveedor acepta varias respuestas de herramientas para
            // una llamada, por ejemplo, una respuesta inmediata de "procesando" seguida del
            // resultado final.
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

        Declare `capabilities` para que `talk.catalog` pueda exponer modos,
        transportes, formatos de audio e indicadores de funciones válidos a los clientes de Talk
        web y nativos. Implemente `handleBargeIn` cuando un transporte pueda detectar que una
        persona está interrumpiendo la reproducción del asistente y el proveedor admita
        truncar o borrar la respuesta de audio activa.
        `submitToolResult` puede devolver `void` para un envío síncrono o una
        `Promise<void>` para un límite de finalización asíncrona que pueda exponer el puente
        del proveedor. Las sesiones de retransmisión del Gateway esperan esa promesa antes de
        confirmar un resultado final o borrar la ejecución vinculada; rechácela cuando
        falle el envío.
        Establezca `supportsToolResultSuppression: false` cuando el proveedor no pueda
        respetar `options.suppressResponse`. OpenClaw evita entonces la supresión de los
        resultados internos de consulta forzada y cancelación, y rechaza las solicitudes directas
        de resultados suprimidos en lugar de iniciar silenciosamente una respuesta.
        Los consumidores de `createRealtimeVoiceBridgeSession` también pueden devolver una
        promesa desde `onToolCall`; los errores síncronos y los rechazos se dirigen
        a la función de retorno `onError` de la sesión.
        Establezca `handlesInputAudioBargeIn` únicamente cuando el VAD del proveedor confirme una
        interrupción llamando a `onClearAudio("barge-in")`. Los proveedores que omitan
        el indicador utilizan la detección alternativa local de audio de entrada de OpenClaw.
      </Tab>
      <Tab title="Comprensión multimedia">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Una foto de..." }),
          transcribeAudio: async (req) => ({ text: "Transcripción..." }),
        });
        ```

        Los proveedores multimedia locales o autoalojados que intencionadamente no requieran
        credenciales pueden exponer `resolveAuth` y devolver `kind: "none"`.
        OpenClaw sigue manteniendo la comprobación de autenticación normal para los proveedores que no
        opten por ello explícitamente. Los proveedores existentes pueden seguir leyendo `req.apiKey`;
        los nuevos proveedores deben preferir `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "plugin local-audio sin autenticación",
          }),
          transcribeAudio: async (req) => ({ text: "Transcripción..." }),
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

        Declare el mismo identificador en `contracts.embeddingProviders`. Este es el
        contrato general de embeddings para la generación reutilizable de vectores, incluida
        la búsqueda en memoria. `registerMemoryEmbeddingProvider(...)` es compatibilidad
        obsoleta para los adaptadores existentes específicos de memoria.
      </Tab>
      <Tab title="Generación de imágenes y vídeos">
        Las capacidades de imágenes y vídeos utilizan una estructura **adaptada al modo**. Los proveedores de
        imágenes declaran los bloques de capacidades obligatorios `generate` y `edit`;
        los proveedores de vídeos declaran `generate`, `imageToVideo` y
        `videoToVideo`. Los campos agregados planos como `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` no bastan para anunciar
        claramente la compatibilidad con el modo de transformación o los modos deshabilitados. La generación de música
        sigue el mismo patrón `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Imágenes de Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Vídeo de Acme",
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

        `capabilities` es obligatorio en ambos tipos de proveedores; `edit` y los
        bloques de transformación de vídeo (`imageToVideo`, `videoToVideo`) siempre necesitan un
        indicador `enabled` explícito.

        Utilice `catalogByModel` cuando los modos estáticos o las capacidades de un modelo incluido
        difieran de los valores predeterminados del proveedor. Estos metadatos mantienen
        `video_generate action=list` y los catálogos de modelos precisos sin
        invocar el código del proveedor. La consulta y la aplicación de las capacidades en el momento de la solicitud
        siguen correspondiendo a `resolveModelCapabilities` y `generateVideo`; reutilice
        la misma constante de capacidad para ambas rutas cuando sea posible.
      </Tab>
      <Tab title="Obtención y búsqueda web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Obtención de Acme",
          hint: "Obtenga páginas mediante el backend de renderizado de Acme.",
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
            description: "Obtenga una página mediante la obtención de Acme.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Búsqueda de Acme",
          hint: "Busque en la web mediante el backend de búsqueda de Acme.",
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
            description: "Busque en la web mediante la búsqueda de Acme.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Ambos tipos de proveedores comparten la misma estructura de conexión de credenciales:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` y `createTool` son
        obligatorios.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Probar">
    ### Paso 6: Probar

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporte el objeto de configuración del proveedor desde index.ts o un archivo específico
    import { acmeProvider } from "./provider.js";

    describe("proveedor acme-ai", () => {
      it("resuelve modelos dinámicos", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("devuelve el catálogo cuando la clave está disponible", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("devuelve un catálogo nulo cuando no hay ninguna clave", async () => {
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

Los plugins de proveedores se publican de la misma forma que cualquier otro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` es un comando diferente para publicar una carpeta de Skills,
no un paquete de plugin; no lo utilice aquí.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Metadatos de openclaw.providers
├── openclaw.plugin.json      # Manifiesto con metadatos de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pruebas
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referencia del orden del catálogo

`catalog.order` controla cuándo se combina el catálogo en relación con los proveedores
integrados:

| Orden     | Cuándo          | Caso de uso                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primera pasada    | Proveedores simples con clave de API                         |
| `profile` | Después de los simples  | Proveedores condicionados a perfiles de autenticación                |
| `paired`  | Después del perfil | Sintetizar varias entradas relacionadas             |
| `late`    | Última pasada     | Sobrescribir proveedores existentes (prevalece en caso de colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) - si el plugin también proporciona un canal
- [Entorno de ejecución del SDK](/es/plugins/sdk-runtime) - ayudantes de `api.runtime` (TTS, búsqueda, subagente)
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Componentes internos de los plugins](/es/plugins/architecture-internals#provider-runtime-hooks) - detalles de los hooks y ejemplos incluidos

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Creación de plugins de canal](/es/plugins/sdk-channel-plugins)
