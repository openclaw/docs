---
read_when:
    - Você está criando um novo plugin de provider de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou uma LLM personalizada ao OpenClaw
    - Você precisa entender autenticação de provider, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um plugin de provider de modelo para o OpenClaw
title: Criando plugins de provider
x-i18n:
    generated_at: "2026-04-06T03:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69500f46aa2cfdfe16e85b0ed9ee3c0032074be46f2d9c9d2940d18ae1095f47
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Criando plugins de provider

Este guia mostra como criar um plugin de provider que adiciona um provider de modelo
(LLM) ao OpenClaw. Ao final, você terá um provider com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para ver a estrutura básica
  de pacote e a configuração do manifesto.
</Info>

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
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
      "description": "Provider de modelo Acme AI",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Chave de API da Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chave de API da Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    O manifesto declara `providerAuthEnvVars` para que o OpenClaw possa detectar
    credenciais sem carregar o runtime do seu plugin. `modelSupport` é opcional
    e permite que o OpenClaw carregue automaticamente seu plugin de provider a partir de IDs resumidos de modelo
    como `acme-large` antes que os hooks de runtime existam. Se você publicar o
    provider no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios no `package.json`.

  </Step>

  <Step title="Registrar o provider">
    Um provider mínimo precisa de `id`, `label`, `auth` e `catalog`:

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

    Esse é um provider funcional. Agora os usuários podem
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Para providers integrados que registram apenas um provider de texto com
    autenticação por chave de API e um único runtime baseado em catálogo, prefira o helper
    mais restrito `defineSingleProviderPluginEntry(...)`:

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

    Se o seu fluxo de autenticação também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers de preset de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais restritos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provider oferecer suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações de ID de
    provider de forma rígida. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam o suporte a partir do mapa
    de capacidades do endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda
    possam aderir mesmo quando um plugin estiver usando um ID de provider personalizado.

  </Step>

  <Step title="Adicionar resolução dinâmica de modelos">
    Se o seu provider aceitar IDs arbitrários de modelo (como um proxy ou roteador),
    adicione `resolveDynamicModel`:

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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para
    aquecimento assíncrono — `resolveDynamicModel` será executado novamente após a conclusão.

  </Step>

  <Step title="Adicionar hooks de runtime (conforme necessário)">
    A maioria dos providers precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    de forma incremental conforme o seu provider precisar deles.

    Builders de helpers compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade de ferramentas,
    então os plugins normalmente não precisam mais configurar cada hook manualmente um a um:

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

    Famílias de replay disponíveis hoje:

    | Family | O que ela configura |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso |
    | `anthropic-by-model` | Política de replay com reconhecimento de Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza específica de blocos de thinking do Claude apenas quando o modelo resolvido realmente for um ID Claude |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio marcado |
    | `passthrough-gemini` | Saneamento de assinatura de pensamento do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não ativa validação nativa de replay do Gemini nem reescritas de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para providers que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um único plugin; a remoção opcional de blocos de thinking apenas para Claude continua restrita ao lado Anthropic |

    Exemplos reais integrados:

    - `google`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis hoje:

    | Family | O que ela configura |
    | --- | --- |
    | `google-thinking` | Normalização do payload de thinking do Gemini no caminho compartilhado de stream |
    | `kilocode-thinking` | Wrapper de raciocínio Kilo no caminho compartilhado de stream por proxy, com `kilo/auto` e IDs de raciocínio de proxy não compatíveis ignorando o thinking injetado |
    | `moonshot-thinking` | Mapeamento binário de payload nativo de thinking do Moonshot a partir da configuração + nível `/think` |
    | `minimax-fast-mode` | Reescrita de modelo fast-mode do MiniMax no caminho compartilhado de stream |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de OpenAI/Codex Responses: headers de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex, formatação de payload de compatibilidade de raciocínio e gerenciamento de contexto de Responses |
    | `openrouter-thinking` | Wrapper de raciocínio OpenRouter para rotas de proxy, com ignorar `auto`/modelo não compatível tratado de forma centralizada |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para providers como Z.AI que querem streaming de ferramentas, a menos que seja explicitamente desativado |

    Exemplos reais integrados:

    - `google`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum da família
    de replay, além dos helpers compartilhados com os quais essas famílias são construídas. Exportações
    públicas comuns incluem:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders compartilhados de replay como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de replay do Gemini como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o builder de família quanto
    os helpers públicos de wrapper reutilizados por essas famílias. Exportações
    públicas comuns incluem:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provider como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream permanecem locais ao provider de propósito. Exemplo
    integrado atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    builders de wrapper Anthropic de nível inferior a partir de sua costura pública `api.ts` /
    `contract-api.ts`. Esses helpers permanecem específicos da Anthropic porque
    também codificam o tratamento beta do OAuth Claude e o gating de `context1m`.

    Outros providers integrados também mantêm wrappers específicos do transporte localmente quando
    o comportamento não é compartilhado de forma limpa entre as famílias. Exemplo atual: o
    plugin integrado xAI mantém a formatação nativa de xAI Responses em seu próprio
    `wrapStreamFn`, incluindo reescritas de alias `/fast`, `tool_stream` padrão,
    limpeza de strict-tool não compatível e remoção de payload de raciocínio
    específica de xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada
    de schema de ferramenta, além de helpers compartilhados de schema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário compartilhado de famílias.
    - `buildProviderToolCompatFamilyHooks("gemini")` configura
      limpeza + diagnósticos de schema Gemini para providers que precisam de schemas de ferramenta seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de schema Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade integrado do xAI:
      `toolSchemaProfile: "xai"`, palavras-chave de schema não compatíveis, suporte nativo a
      `web_search` e decodificação de argumentos de chamada de ferramenta com entidades HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade xAI a um
      modelo resolvido antes de ele chegar ao runner.

    Exemplo real integrado: o plugin xAI usa `normalizeResolvedModel` mais
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade sob posse do
    provider em vez de codificar regras xAI de forma rígida no core.

    O mesmo padrão de raiz de pacote também sustenta outros providers integrados:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de provider,
      helpers de modelo padrão e builders de provider em tempo real
    - `@openclaw/openrouter-provider`: `api.ts` exporta o builder de provider
      mais helpers de onboarding/configuração

    <Tabs>
      <Tab title="Troca de token">
        Para providers que precisam de uma troca de token antes de cada chamada de inferência:

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
      <Tab title="Headers personalizados">
        Para providers que precisam de headers personalizados de requisição ou modificações no corpo:

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
      <Tab title="Identidade de transporte nativo">
        Para providers que precisam de headers nativos de requisição/sessão ou metadados em
        transportes genéricos HTTP ou WebSocket:

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
      <Tab title="Uso e cobrança">
        Para providers que expõem dados de uso/cobrança:

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

    <Accordion title="Todos os hooks de provider disponíveis">
      O OpenClaw chama os hooks nesta ordem. A maioria dos providers usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de base URL |
      | 2 | `applyConfigDefaults` | Padrões globais de posse do provider durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de aliases de ID de modelo legado/prévia antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provider antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar a configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para providers de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de env de posse do provider |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou apoiada por configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado em relação à autenticação por env/configuração |
      | 10 | `resolveDynamicModel` | Aceitar IDs arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |

    Observações sobre fallback de runtime:

    - `normalizeConfig` verifica primeiro o provider correspondente, depois outros
      plugins de provider com hooks até que um realmente altere a configuração.
      Se nenhum hook de provider reescrever uma entrada de configuração compatível
      da família Google, o normalizador de configuração Google integrado ainda se aplica.
    - `resolveConfigApiKey` usa o hook do provider quando ele é exposto. O caminho integrado
      `amazon-bedrock` também possui aqui um resolvedor embutido de marcador de env AWS,
      embora a autenticação de runtime do Bedrock em si ainda use a cadeia padrão do AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática legada de capacidades; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta de posse do provider antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta de posse do provider |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio marcado vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de header/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Headers/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Headers de sessão WS/cooldown nativos |
      | 23 | `formatApiKey` | Formato personalizado de token em runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizado |
      | 25 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow de posse do provider |
      | 27 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga de posse do provider |
      | 28 | `isCacheTtlEligible` | Gating de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `isBinaryThinking` | Thinking binário ativado/desativado |
      | 33 | `supportsXHighThinking` | Suporte a raciocínio `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Política padrão de `/think` |
      | 35 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 36 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 37 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 38 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 39 | `createEmbeddingProvider` | Adaptador de embeddings de posse do provider para memória/pesquisa |
      | 40 | `buildReplayPolicy` | Política personalizada de replay/compactação de transcrição |
      | 41 | `sanitizeReplayHistory` | Reescritas específicas do provider após a limpeza genérica |
      | 42 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner incorporado |
      | 43 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observação sobre ajuste de prompt:

      - `resolveSystemPromptContribution` permite que um provider injete
        orientações de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira isso em vez de
        `before_prompt_build` quando o comportamento pertencer a um provider/família de modelos
        e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internals: Provider Runtime Hooks](/pt-BR/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um plugin de provider pode registrar speech, transcrição em tempo real, voz em tempo
    real, entendimento de mídia, geração de imagem, geração de vídeo, web fetch
    e web search junto com inferência de texto:

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Busque páginas pelo backend de renderização da Acme.",
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
          description: "Busque uma página por meio do Acme Fetch.",
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

    O OpenClaw classifica isso como um plugin de **capacidade híbrida**. Este é o
    padrão recomendado para plugins de empresa (um plugin por fornecedor). Consulte
    [Internals: Capability Ownership](/pt-BR/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Testar">
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

## Publicar no ClawHub

Plugins de provider são publicados da mesma forma que qualquer outro plugin externo de código:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas de skill; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifesto com providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem de catálogo

`catalog.order` controla quando o seu catálogo é mesclado em relação aos
providers integrados:

| Order     | Quando         | Caso de uso                                    |
| --------- | -------------- | ---------------------------------------------- |
| `simple`  | Primeira etapa | Providers simples com chave de API             |
| `profile` | Após simple    | Providers condicionados a perfis de autenticação |
| `paired`  | Após profile   | Sintetizar várias entradas relacionadas        |
| `late`    | Última etapa   | Sobrescrever providers existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se o seu plugin também fornecer um canal
- [Runtime do SDK](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação de subpaths
- [Internals de plugin](/pt-BR/plugins/architecture#provider-runtime-hooks) — detalhes de hooks e exemplos integrados
