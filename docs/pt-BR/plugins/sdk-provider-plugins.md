---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender a autenticação de provedores, catálogos e hooks de runtime
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para o OpenClaw
title: Construindo plugins de provedor
x-i18n:
    generated_at: "2026-06-27T17:58:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Este guia mostra como criar um plugin de provedor que adiciona um provedor de modelos
(LLM) ao OpenClaw. Ao final, você terá um provedor com um catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura básica do pacote
  e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop de inferência normal do OpenClaw. Se o modelo
  precisar ser executado por meio de um daemon de agente nativo que controla threads, compaction ou eventos de ferramentas, combine o provedor com um [harness de agente](/pt-BR/plugins/sdk-agent-harness)
  em vez de colocar detalhes do protocolo do daemon no núcleo.
</Tip>

## Passo a passo

<Steps>
  <Step title="Pacote e manifesto">
    ### Etapa 1: Pacote e manifesto

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
      "description": "Provedor de modelos Acme AI",
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

    O manifesto declara `setup.providers[].envVars` para que o OpenClaw possa detectar
    credenciais sem carregar o runtime do plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor deve reutilizar a autenticação do id de outro provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu plugin de provedor a partir de ids abreviados
    de modelo, como `acme-large`, antes que existam hooks de runtime. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    serão obrigatórios em `package.json`.

  </Step>

  <Step title="Registre o provedor">
    Um provedor de texto mínimo precisa de um `id`, `label`, `auth` e `catalog`.
    `catalog` é o hook de runtime/configuração controlado pelo provedor; ele pode chamar APIs
    ao vivo do fornecedor e retorna entradas `models.providers`.

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

    `registerModelCatalogProvider` é a superfície de catálogo mais nova do plano de controle
    para IU de listagem/ajuda/seletor. Use-a para linhas de texto, geração de imagens,
    geração de vídeo e geração de música. Mantenha as chamadas ao endpoint do fornecedor e
    o mapeamento de respostas no plugin; o OpenClaw controla o formato de linha compartilhado, os rótulos
    de origem e a renderização da ajuda.

    Esse é um provedor funcional. Agora os usuários podem
    executar `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    ### Descoberta de modelos ao vivo

    Se o seu provedor expõe uma API no estilo `/models`, mantenha o endpoint específico do provedor
    e a projeção de linhas no seu plugin e use
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para o ciclo de vida de busca
    compartilhado. O helper fornece buscas HTTP protegidas, cabeçalhos de autenticação de provedor,
    erros HTTP estruturados, cache com TTL e comportamento de fallback estático sem
    colocar política de provedor no núcleo do OpenClaw.

    Use `buildLiveModelProviderConfig` quando a API ao vivo só informa quais
    linhas do catálogo estático controlado pelo provedor estão disponíveis no momento:

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

    Use `getCachedLiveProviderModelRows` quando a API do provedor retorna metadados mais ricos
    e o plugin precisa projetar as linhas para definições de modelo do OpenClaw
    por conta própria:

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

    `run` deve permanecer protegido por autenticação e retornar `null` quando nenhuma credencial utilizável estiver
    disponível. Mantenha um `staticRun` offline ou fallback estático para que setup, documentação,
    testes e superfícies de seletor não dependam de acesso à rede ao vivo. Use um TTL
    apropriado para a atualização da lista de modelos, evite polling do sistema de arquivos em tempo de requisição
    e passe `readRows` / `readModelId` específicos do provedor somente quando a
    resposta upstream não tiver um formato compatível com OpenAI `{ data: [{ id, object }] }`.

    Se o provedor upstream usa tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação de texto bidirecional em vez de substituir o caminho do stream:

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

    `input` reescreve o prompt final do sistema e o conteúdo das mensagens de texto antes
    do transporte. `output` reescreve deltas de texto do assistente e o texto final antes
    de o OpenClaw analisar seus próprios marcadores de controle ou entrega de canal.

    Para provedores empacotados que registram apenas um provedor de texto com autenticação por chave de API
    mais um único runtime baseado em catálogo, prefira o helper mais restrito
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

    `buildProvider` é o caminho de catálogo ao vivo usado quando o OpenClaw consegue resolver a autenticação real do
    provedor. Ele pode realizar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline que sejam seguras de mostrar antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição `models list --all` do OpenClaw atualmente executa catálogos estáticos
    apenas para plugins de provedor incluídos, com configuração vazia, ambiente vazio e sem
    caminhos de agente/workspace.

    Se o seu fluxo de autenticação também precisar corrigir `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers de preset de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor der suporte a blocos de uso transmitidos em streaming no
    transporte normal `openai-completions`, prefira os helpers de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar
    verificações de id de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam o suporte a partir do
    mapa de capacidades do endpoint, então endpoints nativos no estilo Moonshot/DashScope ainda
    optam por isso mesmo quando um Plugin está usando um id de provedor personalizado.

    Os exemplos de descoberta ao vivo acima cobrem APIs de provedor no estilo `/models`. Mantenha
    essa descoberta dentro de `catalog.run`, condicionada a autenticação utilizável, e mantenha
    `staticRun` sem rede para geração de catálogo offline.

  </Step>

  <Step title="Add dynamic model resolution">
    Se o seu provedor aceita IDs de modelo arbitrários (como um proxy ou roteador),
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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para aquecimento
    assíncrono - `resolveDynamicModel` é executado novamente depois que ele termina.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    A maioria dos provedores precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    incrementalmente conforme o seu provedor exigir.

    Os builders de helpers compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade
    de ferramentas, então os plugins geralmente não precisam conectar cada hook manualmente, um por um:

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

    | Família | O que ela conecta | Exemplos incluídos |
    | --- | --- | --- |
    | `openai-compatible` | Política de replay compartilhada no estilo OpenAI para transportes compatíveis com OpenAI, incluindo sanitização de tool-call-id, correções de ordenação com assistant primeiro e validação genérica de turno Gemini onde o transporte precisa disso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay ciente de Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza de blocos de pensamento específica de Claude apenas quando o modelo resolvido for realmente um id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política de replay nativa do Gemini mais sanitização de replay de bootstrap. A família compartilhada mantém o Gemini CLI com saída de texto em raciocínio marcado; o provedor direto `google` substitui `resolveReasoningOutputMode` para `native` porque o pensamento da Gemini API chega como partes de pensamento nativas. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitização de assinatura de pensamento Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não ativa validação de replay nativa do Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um Plugin; a remoção opcional de blocos de pensamento apenas de Claude permanece limitada ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta | Exemplos incluídos |
    | --- | --- | --- |
    | `google-thinking` | Normalização de payload de pensamento Gemini no caminho de stream compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raciocínio Kilo no caminho de stream de proxy compartilhado, com `kilo/auto` e ids de raciocínio de proxy sem suporte ignorando o pensamento injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento de payload binário de pensamento nativo Moonshot a partir da configuração + nível `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita de modelo de modo rápido MiniMax no caminho de stream compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de Responses OpenAI/Codex: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, busca na web nativa do Codex, formatação de payload de compatibilidade de raciocínio e gerenciamento de contexto de Responses | `openai` |
    | `openrouter-thinking` | Wrapper de raciocínio OpenRouter para rotas proxy, com ignoros de modelo sem suporte/`auto` tratados centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramentas a menos que seja explicitamente desativado | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Cada builder de família é composto a partir de helpers públicos de nível mais baixo exportados pelo mesmo pacote, que você pode usar quando um provedor precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os builders de replay brutos (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta helpers de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper DeepSeek V4 compatível com OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), limpeza de preenchimento de pensamento Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compatibilidade de tool-call em texto simples (`createPlainTextToolCallCompatWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrappers leves de payload e evento para caminhos quentes de provedor, incluindo `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` e `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` e helpers subjacentes de esquema de provedor.

      Para provedores da família Gemini, mantenha o modo de saída de raciocínio alinhado com
      o transporte. Provedores diretos da Google Gemini API devem usar saída de raciocínio
      `native` para que o OpenClaw consuma partes de pensamento nativas sem adicionar
      diretivas de prompt `<think>` / `<final>`. Backends Gemini no estilo CLI apenas texto
      que analisam uma resposta final JSON/texto podem manter o contrato marcado
      `google-gemini` compartilhado.

      Alguns helpers de stream permanecem locais ao provedor de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper Anthropic de nível mais baixo em sua própria interface pública `api.ts` / `contract-api.ts` porque eles codificam o tratamento de beta OAuth do Claude e o controle de `context1m`. O Plugin xAI também mantém a formatação nativa de Responses xAI em seu próprio `wrapStreamFn` (aliases `/fast`, `tool_stream` padrão, limpeza de ferramenta estrita sem suporte, remoção de payload de raciocínio específica do xAI).

      O mesmo padrão de raiz de pacote também dá suporte a `@openclaw/openai-provider` (builders de provedor, helpers de modelo padrão, builders de provedor realtime) e `@openclaw/openrouter-provider` (builder de provedor mais helpers de onboarding/configuração).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Para provedores que precisam de uma troca de token antes de cada chamada de inferência:

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
        Para provedores que precisam de cabeçalhos de requisição personalizados ou modificações no corpo:

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
        Para provedores que precisam de cabeçalhos ou metadados nativos de requisição/sessão em
        transportes HTTP ou WebSocket genéricos:

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
        Para provedores que expõem dados de uso/cobrança:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` tem três resultados. Retorne `{ token, accountId? }`
        quando o provedor tiver uma credencial de uso/cobrança. Retorne
        `{ handled: true }` somente quando o provedor tiver lidado definitivamente com a autenticação de uso
        mas não tiver nenhum token de uso utilizável, e o OpenClaw deve ignorar o fallback genérico
        de chave de API/OAuth. Retorne `null` ou `undefined` quando o provedor
        não tiver lidado com a solicitação e o OpenClaw deve continuar com o fallback genérico.
      </Tab>
    </Tabs>

    <Accordion title="Todos os hooks de provedor disponíveis">
      O OpenClaw chama hooks nesta ordem. A maioria dos provedores usa apenas 2-3:
      campos de provedor apenas para compatibilidade que o OpenClaw não chama mais, como
      `ProviderPlugin.capabilities` e `suppressBuiltInModel`, não estão listados
      aqui.

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de URL base |
      | 2 | `applyConfigDefaults` | Padrões globais pertencentes ao provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de alias de ID de modelo legado/preview antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família de provedores antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso de streaming nativo para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação de marcador de env pertencente ao provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/auto-hospedada ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado atrás de autenticação por env/configuração |
      | 10 | `resolveDynamicModel` | Aceitar IDs arbitrários de modelos upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do executor |
      | 13 | `normalizeToolSchemas` | Limpeza de schema de ferramenta pertencente ao provedor antes do registro |
      | 14 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta pertencentes ao provedor |
      | 15 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio etiquetada vs nativa |
      | 16 | `prepareExtraParams` | Parâmetros padrão de solicitação |
      | 17 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 19 | `wrapStreamFn` | Wrappers personalizados de cabeçalhos/corpo no caminho normal de stream |
      | 20 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 21 | `resolveWebSocketSessionPolicy` | Cabeçalhos/cool-down nativos de sessão WS |
      | 22 | `formatApiKey` | Formato personalizado de token em runtime |
      | 23 | `refreshOAuth` | Atualização OAuth personalizada |
      | 24 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 25 | `matchesContextOverflowError` | Detecção de estouro pertencente ao provedor |
      | 26 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga pertencente ao provedor |
      | 27 | `isCacheTtlEligible` | Gate de TTL do cache de prompt |
      | 28 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 29 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 30 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 31 | `isBinaryThinking` | Compatibilidade de raciocínio binário ativado/desativado |
      | 32 | `supportsXHighThinking` | Compatibilidade com suporte a raciocínio `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilidade de política padrão de `/think` |
      | 34 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 35 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 36 | `resolveUsageAuth` | Análise personalizada de credencial de uso |
      | 37 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 38 | `createEmbeddingProvider` | Adaptador de embedding pertencente ao provedor para memória/busca |
      | 39 | `buildReplayPolicy` | Política personalizada de replay/compaction de transcrição |
      | 40 | `sanitizeReplayHistory` | Reescritas de replay específicas do provedor após a limpeza genérica |
      | 41 | `validateReplayTurns` | Validação estrita de turnos de replay antes do executor incorporado |
      | 42 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações de fallback em runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente, depois outros plugins de provedor com suporte a hooks até que um realmente altere a configuração. Se nenhum hook de provedor reescrever uma entrada de configuração compatível da família Google, o normalizador de configuração Google incluído ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando exposto. Amazon Bedrock mantém a resolução de marcadores de env da AWS em seu Plugin de provedor; a própria autenticação de runtime ainda usa a cadeia padrão do AWS SDK quando configurada com `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recebe o `provider`, `modelId`, a dica opcional mesclada do catálogo `reasoning` e os fatos opcionais mesclados de `compat` do modelo. Use `compat` apenas para selecionar a UI/perfil de pensamento do provedor.
      - `resolveSystemPromptContribution` permite que um provedor injete orientação de prompt de sistema ciente de cache para uma família de modelos. Prefira-o em vez de `before_prompt_build` quando o comportamento pertencer a uma família de provedor/modelo e deve preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte [Internos: hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    ### Etapa 5: Adicionar capacidades extras

    Um Plugin de provedor pode registrar embeddings, fala, transcrição em tempo real,
    voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo,
    busca web e pesquisa web junto com inferência de texto. O OpenClaw classifica isso como um
    Plugin de **capacidade híbrida** - o padrão recomendado para plugins de empresas
    (um Plugin por fornecedor). Consulte
    [Internos: propriedade de capacidades](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` junto com sua chamada existente
    `api.registerProvider(...)`. Escolha apenas as abas de que você precisa:

    <Tabs>
      <Tab title="Fala (TTS)">
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

        Use `assertOkOrThrowProviderError(...)` para falhas HTTP do provedor, para que
        plugins compartilhem leituras limitadas de corpo de erro, análise de erro JSON e
        sufixos de ID de solicitação.
      </Tab>
      <Tab title="Transcrição em tempo real">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` - o helper compartilhado
        lida com captura de proxy, backoff de reconexão, flush ao fechar, handshakes de prontidão,
        enfileiramento de áudio e diagnósticos de eventos de fechamento. Seu Plugin
        apenas mapeia eventos upstream.

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

        Provedores de STT em lote que enviam áudio multipart por POST devem usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. O helper normaliza nomes de arquivos de upload,
        incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
        APIs de transcrição compatíveis.
      </Tab>
      <Tab title="Voz em tempo real">
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
            // Defina isto apenas se o provedor aceitar várias respostas de ferramenta para
            // uma chamada, por exemplo uma resposta imediata "working" seguida pelo
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

        Declare `capabilities` para que `talk.catalog` possa expor modos,
        transportes, formatos de áudio e sinalizadores de recurso válidos para clientes Talk
        de navegador e nativos. Implemente `handleBargeIn` quando um transporte puder detectar que um
        humano está interrompendo a reprodução do assistente e o provedor oferecer suporte a
        truncar ou limpar a resposta de áudio ativa.
      </Tab>
      <Tab title="Compreensão de mídia">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Provedores de mídia locais ou auto-hospedados que intencionalmente não exigem
        credenciais podem expor `resolveAuth` e retornar `kind: "none"`.
        O OpenClaw ainda mantém a barreira normal de autenticação para provedores que não
        optam explicitamente por isso. Provedores existentes podem continuar lendo `req.apiKey`;
        novos provedores devem preferir `req.auth`.

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

        Declare o mesmo id em `contracts.embeddingProviders`. Este é o
        contrato geral de embeddings para geração reutilizável de vetores, incluindo
        busca em memória. `registerMemoryEmbeddingProvider(...)` é compatibilidade
        obsoleta para adaptadores existentes específicos de memória.
      </Tab>
      <Tab title="Geração de imagem e vídeo">
        Recursos de vídeo usam um formato **ciente de modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados simples como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não são
        suficientes para anunciar suporte a modos de transformação ou modos desativados de forma clara.
        A geração de música segue o mesmo padrão com blocos explícitos `generate` /
        `edit`.

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
      <Tab title="Busca e coleta na Web">
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

  <Step title="Testar">
    ### Etapa 6: Testar

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

Plugins de provedor são publicados da mesma forma que qualquer outro Plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use o alias legado de publicação exclusivo de skill aqui; pacotes de Plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referência de ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos provedores
integrados:

| Ordem     | Quando        | Caso de uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primeira passagem | Provedores simples com chave de API             |
| `profile` | Após simple   | Provedores bloqueados por perfis de autenticação |
| `paired`  | Após profile  | Sintetizar várias entradas relacionadas          |
| `late`    | Última passagem | Substituir provedores existentes (vence em colisões) |

## Próximas etapas

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - se seu Plugin também fornece um canal
- [Runtime do SDK](/pt-BR/plugins/sdk-runtime) - auxiliares de `api.runtime` (TTS, busca, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação por subcaminho
- [Componentes internos de Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) - detalhes dos hooks e exemplos integrados

## Relacionado

- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Criação de plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
