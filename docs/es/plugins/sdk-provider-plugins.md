---
read_when:
    - Estás creando un nuevo Plugin de proveedor de modelos
    - Quieres agregar un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas entender la autenticación del proveedor, los catálogos y los hooks de tiempo de ejecución
sidebarTitle: Provider Plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Crear Plugins de proveedor
x-i18n:
    generated_at: "2026-04-23T05:18:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Crear Plugins de proveedor

Esta guía explica paso a paso cómo crear un Plugin de proveedor que agregue un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación por clave API y resolución dinámica de modelos.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para ver la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los Plugins de proveedor agregan modelos al bucle de inferencia normal de OpenClaw. Si el modelo
  debe ejecutarse a través de un daemon de agente nativo que administra hilos, Compaction o eventos
  de herramientas, combina el proveedor con un [arnés de agente](/es/plugins/sdk-agent-harness)
  en lugar de poner detalles del protocolo del daemon en el núcleo.
</Tip>

## Tutorial

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
    cuando una variante de proveedor deba reutilizar la autenticación de otro ID de proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor a partir de IDs
    abreviados de modelo como `acme-large` antes de que existan hooks de tiempo de ejecución. Si publicas el
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
              promptMessage: "Ingresa tu clave API de Acme AI",
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

    Ese es un proveedor funcional. Los usuarios ahora pueden
    ejecutar `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    Si el proveedor upstream usa tokens de control distintos de los de OpenClaw, agrega una
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

    `input` reescribe el prompt final del sistema y el contenido de mensajes de texto antes
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes
    de que OpenClaw analice sus propios marcadores de control o haga la entrega por canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación
    por clave API más un único tiempo de ejecución respaldado por catálogo, prefiere el
    helper más acotado `defineSingleProviderPluginEntry(...)`:

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
            promptMessage: "Ingresa tu clave API de Acme AI",
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

    `buildProvider` es la ruta de catálogo en vivo usada cuando OpenClaw puede resolver una
    autenticación real del proveedor. Puede realizar descubrimiento específico del proveedor. Usa
    `buildStaticProvider` solo para filas sin conexión que sea seguro mostrar antes de que la autenticación
    esté configurada; no debe requerir credenciales ni hacer solicitudes de red.
    La vista `models list --all` de OpenClaw actualmente ejecuta catálogos estáticos
    solo para Plugins de proveedor incluidos, con una configuración vacía, entorno vacío y sin
    rutas de agente/workspace.

    Si tu flujo de autenticación también necesita aplicar cambios a `models.providers.*`, alias
    y el modelo predeterminado del agente durante la incorporación, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más acotados son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming sobre el
    transporte normal `openai-completions`, prefiere los helpers compartidos de catálogo en
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar verificaciones
    por ID de proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan compatibilidad a partir del mapa de capacidades del
    endpoint, por lo que endpoints nativos de estilo Moonshot/DashScope siguen pudiendo
    habilitarse incluso cuando un Plugin usa un ID de proveedor personalizado.

  </Step>

  <Step title="Agregar resolución dinámica de modelos">
    Si tu proveedor acepta IDs arbitrarios de modelo (como un proxy o router),
    agrega `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog del ejemplo anterior

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
    calentamiento asíncrono; `resolveDynamicModel` se ejecuta de nuevo después de completarse.

  </Step>

  <Step title="Agregar hooks de tiempo de ejecución (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Agrega hooks
    de forma incremental según lo requiera tu proveedor.

    Los builders de helpers compartidos ahora cubren las familias más comunes de
    repetición/compatibilidad con herramientas, por lo que normalmente los Plugins no necesitan
    conectar manualmente cada hook uno por uno:

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

    Familias de repetición disponibles hoy:

    | Familia | Qué conecta |
    | --- | --- |
    | `openai-compatible` | Política compartida de repetición estilo OpenAI para transportes compatibles con OpenAI, incluida la sanitización de IDs de llamadas de herramientas, correcciones de ordenamiento de asistente primero y validación genérica de turnos Gemini cuando el transporte la necesita |
    | `anthropic-by-model` | Política de repetición con reconocimiento de Claude elegida por `modelId`, para que los transportes de mensajes Anthropic solo reciban limpieza específica de bloques de pensamiento de Claude cuando el modelo resuelto sea realmente un ID de Claude |
    | `google-gemini` | Política nativa de repetición de Gemini más sanitización de repetición de arranque y modo de salida de razonamiento etiquetado |
    | `passthrough-gemini` | Sanitización de firma de pensamiento de Gemini para modelos Gemini que se ejecutan mediante transportes proxy compatibles con OpenAI; no habilita validación nativa de repetición de Gemini ni reescrituras de arranque |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un mismo Plugin; la eliminación opcional de bloques de pensamiento solo de Claude sigue limitada al lado Anthropic |

    Ejemplos reales incluidos:

    - `google` y `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` y `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` y `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` y `zai`: `openai-compatible`

    Familias de stream disponibles hoy:

    | Familia | Qué conecta |
    | --- | --- |
    | `google-thinking` | Normalización de cargas útiles de pensamiento de Gemini en la ruta de stream compartida |
    | `kilocode-thinking` | Wrapper de razonamiento de Kilo en la ruta de stream proxy compartida, con `kilo/auto` e IDs de razonamiento de proxy no compatibles que omiten el pensamiento inyectado |
    | `moonshot-thinking` | Mapeo de carga útil binaria de pensamiento nativo de Moonshot desde la configuración + nivel `/think` |
    | `minimax-fast-mode` | Reescritura de modelos de modo rápido de MiniMax en la ruta de stream compartida |
    | `openai-responses-defaults` | Wrappers nativos compartidos de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, conformación de carga útil de compatibilidad de razonamiento y gestión de contexto de Responses |
    | `openrouter-thinking` | Wrapper de razonamiento de OpenRouter para rutas proxy, con omisiones de `auto`/modelo no compatible gestionadas de forma centralizada |
    | `tool-stream-default-on` | Wrapper `tool_stream` activado de forma predeterminada para proveedores como Z.AI que quieren streaming de herramientas salvo que se deshabilite explícitamente |

    Ejemplos reales incluidos:

    - `google` y `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` y `minimax-portal`: `minimax-fast-mode`
    - `openai` y `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` también exporta el enum de
    familias de repetición más los helpers compartidos sobre los que se construyen esas familias. Las
    exportaciones públicas comunes incluyen:

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
    los helpers públicos de wrappers que esas familias reutilizan. Las exportaciones públicas comunes
    incluyen:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartidos de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` y
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartidos de proxy/proveedor como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` y `createMinimaxFastModeWrapper(...)`

    Algunos helpers de stream permanecen locales al proveedor intencionalmente. Ejemplo
    actual incluido: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los
    builders de wrappers Anthropic de nivel inferior desde su interfaz pública `api.ts` /
    `contract-api.ts`. Esos helpers siguen siendo específicos de Anthropic porque
    también codifican el manejo beta de OAuth de Claude y el gating de `context1m`.

    Otros proveedores incluidos también mantienen wrappers específicos del transporte de forma local cuando
    el comportamiento no se comparte limpiamente entre familias. Ejemplo actual: el
    Plugin xAI incluido mantiene la conformación nativa de Responses de xAI en su propio
    `wrapStreamFn`, incluida la reescritura de alias `/fast`, el valor predeterminado `tool_stream`,
    la limpieza de herramientas estrictas no compatibles y la eliminación de cargas útiles
    de razonamiento específicas de xAI.

    `openclaw/plugin-sdk/provider-tools` actualmente expone una familia compartida
    de esquemas de herramientas más helpers compartidos de esquema/compatibilidad:

    - `ProviderToolCompatFamily` documenta hoy el inventario de familias compartidas.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta la
      limpieza de esquemas Gemini + diagnósticos para proveedores que necesitan esquemas de herramientas seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` y `inspectGeminiToolSchemas(...)`
      son los helpers públicos subyacentes de esquema Gemini.
    - `resolveXaiModelCompatPatch()` devuelve el parche de compatibilidad xAI incluido:
      `toolSchemaProfile: "xai"`, palabras clave de esquema no compatibles, compatibilidad nativa con
      `web_search` y decodificación de argumentos de llamadas a herramientas con entidades HTML.
    - `applyXaiModelCompat(model)` aplica ese mismo parche de compatibilidad xAI a un
      modelo resuelto antes de que llegue al ejecutor.

    Ejemplo real incluido: el Plugin xAI usa `normalizeResolvedModel` más
    `contributeResolvedModelCompat` para mantener esos metadatos de compatibilidad bajo responsabilidad del
    proveedor en lugar de codificar reglas xAI en el núcleo.

    El mismo patrón de raíz de paquete también respalda otros proveedores incluidos:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de proveedor,
      helpers de modelos predeterminados y builders de proveedores en tiempo real
    - `@openclaw/openrouter-provider`: `api.ts` exporta el builder del proveedor
      más helpers de incorporación/configuración

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
      <Tab title="Identidad nativa del transporte">
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
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de alias heredados/de vista previa de IDs de modelo antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso de streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación con marcadores de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores sintéticos de perfil almacenado detrás de autenticación por entorno/configuración |
      | 10 | `resolveDynamicModel` | Aceptar IDs arbitrarios de modelo upstream |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del ejecutor |

    Notas sobre alternativas en tiempo de ejecución:

    - `normalizeConfig` comprueba primero el proveedor coincidente y luego otros
      Plugins de proveedor con hooks hasta que uno cambie realmente la configuración.
      Si ningún hook de proveedor reescribe una entrada de configuración compatible de la familia Google, sigue aplicándose el normalizador de configuración Google incluido.
    - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. La ruta
      incluida `amazon-bedrock` también tiene aquí un resolvedor incorporado de
      marcadores de entorno AWS, aunque la autenticación de tiempo de ejecución de Bedrock sigue usando la cadena predeterminada del SDK de AWS.
      | 13 | `contributeResolvedModelCompat` | Indicadores de compatibilidad para modelos de proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa estática heredada de capacidades; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquemas de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquemas de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado vs nativo |
      | 18 | `prepareExtraParams` | Parámetros predeterminados de solicitud |
      | 19 | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | 20 | `wrapStreamFn` | Wrappers de encabezados/cuerpo personalizados en la ruta normal de stream |
      | 21 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Encabezados de sesión WS nativos/período de enfriamiento |
      | 23 | `formatApiKey` | Forma personalizada del token en tiempo de ejecución |
      | 24 | `refreshOAuth` | Actualización OAuth personalizada |
      | 25 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación de límite de velocidad/sobrecarga propiedad del proveedor |
      | 28 | `isCacheTtlEligible` | Gating de TTL de caché de prompt |
      | 29 | `buildMissingAuthMessage` | Sugerencia personalizada de autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opciones `/think` específico del modelo |
      | 33 | `isBinaryThinking` | Compatibilidad de pensamiento binario activado/desactivado |
      | 34 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidad de política `/think` predeterminada |
      | 36 | `isModernModelRef` | Coincidencia de modelo en vivo/smoke |
      | 37 | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | 38 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 41 | `buildReplayPolicy` | Política personalizada de repetición/Compaction de transcripciones |
      | 42 | `sanitizeReplayHistory` | Reescrituras de repetición específicas del proveedor después de la limpieza genérica |
      | 43 | `validateReplayTurns` | Validación estricta de turnos de repetición antes del ejecutor integrado |
      | 44 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Nota sobre ajuste de prompts:

      - `resolveSystemPromptContribution` permite que un proveedor inyecte guía de prompt del sistema con reconocimiento de caché para una familia de modelos. Prefiérelo en lugar de `before_prompt_build` cuando el comportamiento pertenezca a una sola familia de proveedor/modelo y deba preservar la división estable/dinámica de la caché.

      Para descripciones detalladas y ejemplos del mundo real, consulta
      [Internals: Hooks de tiempo de ejecución de proveedor](/es/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Agregar capacidades adicionales (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin de proveedor puede registrar voz, transcripción en tiempo real, voz en tiempo real, comprensión de contenido multimedia, generación de imágenes, generación de video, obtención web y búsqueda web junto con la inferencia de texto:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Transcripción en tiempo real",
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

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Voz en tiempo real",
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
        describeImage: async (req) => ({ text: "Una foto de..." }),
        transcribeAudio: async (req) => ({ text: "Transcripción..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* resultado de imagen */ }),
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
        hint: "Obtén páginas a través del backend de renderizado de Acme.",
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
          description: "Obtén una página a través de Acme Fetch.",
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

    OpenClaw clasifica esto como un Plugin de **capacidades híbridas**. Este es el
    patrón recomendado para Plugins de empresa (un Plugin por proveedor). Consulta
    [Internals: Ownership de capacidades](/es/plugins/architecture#capability-ownership-model).

    Para generación de video, prefiere la forma de capacidades sensible al modo que se muestra arriba:
    `generate`, `imageToVideo` y `videoToVideo`. Los campos agregados planos como
    `maxInputImages`, `maxInputVideos` y `maxDurationSeconds` no son
    suficientes para anunciar de forma limpia compatibilidad con modo de transformación o modos deshabilitados.

    Prefiere el helper compartido de WebSocket para proveedores STT en streaming. Mantiene
    consistentes entre proveedores la captura de proxy, el backoff de reconexión, el vaciado al cerrar, los handshakes de disponibilidad, la cola de audio y los diagnósticos de eventos de cierre, mientras deja que el código del proveedor sea responsable solo del mapeo de eventos upstream.

    Los proveedores STT por lotes que hacen POST de audio multipart deben usar
    `buildAudioTranscriptionFormData(...)` de
    `openclaw/plugin-sdk/provider-http` junto con los helpers de solicitudes HTTP del proveedor. El helper de formularios normaliza los nombres de archivo de carga, incluidas las cargas AAC que necesitan un nombre de archivo estilo M4A para APIs de transcripción compatibles.

    Los proveedores de generación musical deben seguir el mismo patrón:
    `generate` para generación solo por prompt y `edit` para generación basada en imagen de referencia. Los campos agregados planos como `maxInputImages`,
    `supportsLyrics` y `supportsFormat` no son suficientes para anunciar compatibilidad con edición; se espera el contrato explícito con bloques `generate` / `edit`.

  </Step>

  <Step title="Probar">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporta tu objeto de configuración del proveedor desde index.ts o un archivo dedicado
    import { acmeProvider } from "./provider.js";

    describe("proveedor acme-ai", () => {
      it("resuelve modelos dinámicos", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("devuelve catálogo cuando hay clave disponible", async () => {
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
├── package.json              # metadatos openclaw.providers
├── openclaw.plugin.json      # Manifiesto con metadatos de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pruebas
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referencia del orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los
proveedores integrados:

| Orden     | Cuándo          | Caso de uso                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primer paso    | Proveedores simples con clave API                         |
| `profile` | Después de simple  | Proveedores condicionados por perfiles de autenticación                |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas             |
| `late`    | Último paso     | Sobrescribir proveedores existentes (gana en colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) — si tu Plugin también proporciona un canal
- [Tiempo de ejecución del SDK](/es/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones de subrutas
- [Internals de Plugins](/es/plugins/architecture#provider-runtime-hooks) — detalles de hooks y ejemplos incluidos
