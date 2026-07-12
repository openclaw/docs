---
read_when:
    - Você está criando um novo plugin de provedor de modelos
    - Você quer adicionar um proxy compatível com a OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender a autenticação de provedores, os catálogos e os hooks de runtime
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um plugin de provedor de modelos para o OpenClaw
title: Criando plugins de provedor
x-i18n:
    generated_at: "2026-07-12T00:14:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Crie um plugin de provedor para adicionar um provedor de modelos (LLM) ao OpenClaw: um
catálogo de modelos, autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Ainda não conhece os plugins do OpenClaw? Leia primeiro [Primeiros passos](/pt-BR/plugins/building-plugins)
  para entender a estrutura do pacote e a configuração do manifesto.
</Info>

<Tip>
  Os plugins de provedor adicionam modelos ao ciclo normal de inferência do OpenClaw. Se o
  modelo precisar ser executado por meio de um daemon de agente nativo que gerencie threads, Compaction
  ou eventos de ferramentas, combine o provedor com um [harness de
  agente](/pt-BR/plugins/sdk-agent-harness), em vez de colocar detalhes do protocolo do daemon
  no núcleo.
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

    `setup.providers[].envVars` permite que o OpenClaw detecte credenciais sem
    carregar o runtime do seu plugin. Adicione `providerAuthAliases` quando uma variante do provedor
    precisar reutilizar a autenticação do id de outro provedor. `modelSupport` é
    opcional e permite que o OpenClaw carregue automaticamente seu plugin de provedor com base em ids
    abreviados de modelos, como `acme-large`, antes que os hooks de runtime existam. `openclaw.compat`
    e `openclaw.build` em `package.json` são obrigatórios para a publicação no ClawHub
    (`openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`
    são os dois campos obrigatórios; `minGatewayVersion` usa
    `openclaw.install.minHostVersion` como alternativa quando omitido).

  </Step>

  <Step title="Registrar o provedor">
    Um provedor de texto mínimo precisa de `id`, `label`, `auth` e `catalog`.
    `catalog` é o hook de runtime/configuração pertencente ao provedor; ele pode chamar APIs
    ativas do fornecedor e retorna entradas de `models.providers`.

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

    `registerModelCatalogProvider` é a superfície mais recente do catálogo do plano de controle
    para interfaces de listagem, ajuda e seleção, abrangendo linhas de `text`, `voice`, `image_generation`,
    `video_generation` e `music_generation`. Mantenha as chamadas aos endpoints
    do fornecedor e o mapeamento das respostas no plugin; o OpenClaw gerencia o formato
    compartilhado das linhas, os rótulos de origem e a renderização da ajuda.

    Isso constitui um provedor funcional. Agora, os usuários podem executar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    ### Descoberta de modelos em tempo real

    Se o seu provedor expõe uma API no estilo `/models`, mantenha o
    endpoint específico do provedor e a projeção das linhas no seu plugin e use
    `openclaw/plugin-sdk/provider-catalog-live-runtime` para o ciclo de busca
    compartilhado. O auxiliar fornece buscas HTTP protegidas, cabeçalhos de autenticação do provedor,
    erros HTTP estruturados, cache com TTL e comportamento de fallback estático sem
    colocar políticas do provedor no núcleo do OpenClaw.

    Use `buildLiveModelProviderConfig` quando a API em tempo real informar apenas quais
    linhas do catálogo estático pertencentes ao provedor estão disponíveis no momento:

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

    Use `getCachedLiveProviderModelRows` quando a API do provedor retornar metadados
    mais detalhados e o plugin precisar projetar as linhas nas próprias definições de modelo
    do OpenClaw:

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

    `run` deve permanecer condicionado à autenticação e retornar `null` quando nenhuma credencial utilizável
    estiver disponível. Mantenha um `staticRun` offline ou um fallback estático para que a configuração, a documentação,
    os testes e as superfícies de seleção não dependam do acesso à rede em tempo real. Use um TTL
    adequado à atualização da lista de modelos, evite a sondagem do sistema de arquivos durante as solicitações
    e forneça `readRows` / `readModelId` específicos do provedor somente quando a
    resposta upstream não tiver um formato compatível com OpenAI `{ data: [{ id, object }] }`.

    Se o provedor upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação bidirecional de texto em vez de substituir o caminho de streaming:

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

    `input` reescreve o prompt de sistema final e o conteúdo das mensagens de texto antes
    do transporte. `output` reescreve os deltas de texto do assistente e o texto final antes
    que o OpenClaw analise seus próprios marcadores de controle ou realize a entrega pelo canal.

    Para provedores integrados que registram apenas um provedor de texto com autenticação por chave
    de API e um único runtime baseado em catálogo, prefira o auxiliar mais específico
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

    `buildProvider` é o caminho do catálogo ativo usado quando o OpenClaw consegue resolver
    a autenticação real do provedor. Ele pode realizar uma descoberta específica do provedor. Use
    `buildStaticProvider` somente para linhas offline que possam ser exibidas com segurança antes
    que a autenticação seja configurada; ele não deve exigir credenciais nem fazer solicitações de rede.
    Atualmente, a exibição de `models list --all` do OpenClaw executa catálogos estáticos
    somente para plugins de provedor integrados, com configuração vazia, ambiente vazio e sem
    caminhos de agente/espaço de trabalho.

    Se o seu fluxo de autenticação também precisar modificar `models.providers.*`, aliases e
    o modelo padrão do agente durante a integração, use os auxiliares de predefinição de
    `openclaw/plugin-sdk/provider-onboard`. Os auxiliares mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferecer suporte a blocos de uso transmitidos no
    transporte `openai-completions` normal, prefira os auxiliares de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar diretamente
    verificações de ID do provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam o suporte pelo
    mapa de recursos do endpoint, portanto endpoints nativos no estilo Moonshot/DashScope ainda
    optam por esse comportamento mesmo quando um plugin usa um ID de provedor personalizado.

    Os exemplos de descoberta ativa acima abrangem APIs de provedores no estilo `/models`. Mantenha
    essa descoberta dentro de `catalog.run`, condicionada à disponibilidade de autenticação utilizável, e mantenha
    `staticRun` sem acesso à rede para a geração offline do catálogo.

  </Step>

  <Step title="Add dynamic model resolution">
    Se o seu provedor aceitar IDs de modelo arbitrários (como um proxy ou roteador),
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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para o
    aquecimento assíncrono — `resolveDynamicModel` será executado novamente após a conclusão.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    A maioria dos provedores precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    gradualmente conforme as necessidades do seu provedor.

    Os construtores de auxiliares compartilhados agora abrangem as famílias mais comuns de
    compatibilidade de repetição/ferramentas, portanto os plugins geralmente não precisam conectar
    manualmente cada hook individualmente:

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

    Famílias de repetição disponíveis atualmente:

    | Família | O que ela conecta | Exemplos integrados |
    | --- | --- | --- |
    | `openai-compatible` | Política de repetição compartilhada no estilo OpenAI para transportes compatíveis com OpenAI, incluindo sanitização de IDs de chamadas de ferramentas, correções de ordenação que colocam o assistente primeiro e validação genérica de turnos do Gemini quando o transporte exige isso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de repetição compatível com Claude, escolhida por `modelId`, para que transportes de mensagens da Anthropic recebam a limpeza de blocos de raciocínio específica do Claude somente quando o modelo resolvido for realmente um ID do Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | A mesma política do Claude por modelo que `anthropic-by-model`, além de sanitização de IDs de chamadas de ferramentas e preservação de IDs nativos de uso de ferramentas da Anthropic para transportes que precisam manter IDs nativos do fornecedor | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Política de repetição nativa do Gemini, além de sanitização da repetição de inicialização. A família compartilhada mantém a CLI do Gemini com saída de texto usando raciocínio marcado; o provedor direto `google` substitui `resolveReasoningOutputMode` por `native`, pois o raciocínio da API Gemini chega como partes nativas de pensamento. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitização de assinaturas de pensamento do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita a validação de repetição nativa do Gemini nem reescritas de inicialização | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que combinam superfícies de modelos de mensagens da Anthropic e compatíveis com OpenAI em um único plugin; a remoção opcional de blocos de raciocínio somente do Claude permanece restrita ao lado da Anthropic | `minimax` |

    Famílias de transmissão disponíveis atualmente:

    | Família | O que ela conecta | Exemplos integrados |
    | --- | --- | --- |
    | `google-thinking` | Normalização da carga útil de raciocínio do Gemini no caminho de transmissão compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raciocínio do Kilo no caminho de transmissão proxy compartilhado, com `kilo/auto` e IDs de raciocínio proxy sem suporte ignorando o raciocínio injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento da carga útil binária de raciocínio nativo do Moonshot com base na configuração + nível de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita de modelo do modo rápido do MiniMax no caminho de transmissão compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de Responses do OpenAI/Codex: cabeçalhos de atribuição, `/fast`/`serviceTier`, nível de detalhes do texto, pesquisa nativa na web do Codex, formatação de carga útil para compatibilidade de raciocínio e gerenciamento de contexto de Responses | `openai` |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas proxy, com omissões de modelos sem suporte/`auto` tratadas centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper de `tool_stream` habilitado por padrão para provedores como Z.AI que desejam transmissão de ferramentas, a menos que ela seja explicitamente desabilitada | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Cada construtor de família é composto por auxiliares públicos de nível inferior exportados pelo mesmo pacote, que você pode usar quando um provedor precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os construtores de repetição brutos (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta auxiliares de repetição do Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e auxiliares de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados do OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper do DeepSeek V4 compatível com OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), limpeza do preenchimento prévio de raciocínio de mensagens da Anthropic (`createAnthropicThinkingPrefillPayloadWrapper`), compatibilidade de chamadas de ferramentas em texto simples (`createPlainTextToolCallCompatWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — wrappers leves de carga útil e eventos para caminhos críticos de provedores, incluindo `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` e `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` e os auxiliares subjacentes de esquema do provedor.

      Para provedores da família Gemini, mantenha o modo de saída de raciocínio alinhado
      ao transporte. Provedores diretos da API Google Gemini devem usar a saída de raciocínio
      `native` para que o OpenClaw consuma partes nativas de pensamento sem adicionar
      diretivas de prompt `<think>` / `<final>`. Backends no estilo da CLI do Gemini,
      somente de texto, que analisam uma resposta final em JSON/texto podem manter o contrato
      marcado compartilhado `google-gemini`.

      Alguns auxiliares de transmissão permanecem locais ao provedor propositalmente. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os construtores de wrappers da Anthropic de nível inferior em sua própria interface pública `api.ts` / `contract-api.ts`, pois eles codificam o tratamento de betas do OAuth do Claude e a restrição de `context1m`. De forma semelhante, o plugin xAI mantém a formatação nativa de Responses da xAI em seu próprio `wrapStreamFn` (aliases de `/fast`, `tool_stream` padrão, limpeza de ferramentas estritas sem suporte e remoção de carga útil de raciocínio específica da xAI).

      O mesmo padrão de raiz de pacote também sustenta `@openclaw/openai-provider` (construtores de provedores, auxiliares de modelo padrão e construtores de provedores em tempo real) e `@openclaw/openrouter-provider` (construtor de provedor, além de auxiliares de integração/configuração).
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
        Para provedores que precisam de cabeçalhos de solicitação personalizados ou modificações no corpo:

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
        Para provedores que precisam de cabeçalhos ou metadados nativos de solicitação/sessão em
        transportes HTTP genéricos ou WebSocket:

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

        `resolveUsageAuth` tem três resultados possíveis. Retorne
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` quando o
        provedor tiver uma credencial de uso/cobrança (os campos opcionais
        levam metadados não secretos do plano do perfil resolvido para
        `fetchUsageSnapshot`). Retorne
        `{ handled: true }` somente quando o provedor tiver processado
        definitivamente a autenticação de uso, mas não tiver um token de uso
        utilizável, e o OpenClaw precisar ignorar o fallback genérico de chave de
        API/OAuth. Retorne `null` ou `undefined` quando o provedor não tiver
        processado a solicitação e o OpenClaw precisar continuar com o fallback
        genérico.

        Declare o ID do provedor em `contracts.usageProviders`. Quando esse contrato
        de manifesto e **ambos** os hooks estiverem presentes, o OpenClaw incluirá
        automaticamente o provedor na coleta de uso sem carregar plugins de
        provedores não relacionados. Não é necessário atualizar nenhuma lista de
        permissões do núcleo.
        `fetchUsageSnapshot` retorna o formato compartilhado e neutro em relação ao provedor:

        - `plan`: assinatura ou rótulo da chave informado pelo provedor
        - `windows`: janelas de cota redefiníveis como percentuais usados
        - `billing`: entradas tipadas de `balance`, `spend` ou `budget`; `unit` pode ser
          uma moeda ISO ou uma unidade do provedor, como `credits`
        - `summary`: contexto compacto específico do provedor que não se encaixa
          nesses campos estruturados

        Mantenha a semântica monetária exata. Um crédito do provedor não equivale
        a USD, a menos que o contrato upstream determine isso. Um plugin que
        implemente apenas `fetchUsageSnapshot` continuará disponível para
        chamadores explícitos/sintéticos, mas não será descoberto automaticamente,
        porque o OpenClaw não consegue resolver sua credencial de uso.
      </Tab>
    </Tabs>

    <Accordion title="Hooks comuns de provedores">
      O OpenClaw chama os hooks aproximadamente nesta ordem para plugins de modelo/provedor.
      A maioria dos provedores usa apenas 2 ou 3. Este não é o contrato completo de
      `ProviderPlugin` — consulte [Aspectos internos: hooks de runtime do
      provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) para ver a
      lista completa e atualmente correta de hooks e as observações sobre fallback.
      Campos de provedor mantidos apenas para compatibilidade que o OpenClaw não
      chama mais, como `ProviderPlugin.capabilities` e `suppressBuiltInModel`, não
      estão listados aqui.

      | Hook | Quando usar |
      | --- | --- |
      | `catalog` | Catálogo de modelos ou padrões da URL base |
      | `applyConfigDefaults` | Padrões globais pertencentes ao provedor durante a materialização da configuração |
      | `normalizeModelId` | Limpeza de alias legados/de prévia de ID de modelo antes da busca |
      | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo |
      | `normalizeConfig` | Normalizar a configuração `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Regravações nativas de compatibilidade do uso em streaming para provedores de configuração |
      | `resolveConfigApiKey` | Resolução de autenticação por marcador de variável de ambiente pertencente ao provedor |
      | `resolveSyntheticAuth` | Autenticação sintética local/auto-hospedada ou baseada em configuração |
      | `resolveExternalAuthProfiles` | Sobrepor perfis externos de autenticação pertencentes ao provedor para credenciais gerenciadas pela CLI/aplicativo |
      | `shouldDeferSyntheticProfileAuth` | Colocar placeholders sintéticos de perfis armazenados abaixo da autenticação por ambiente/configuração |
      | `resolveDynamicModel` | Aceitar IDs arbitrários de modelos upstream |
      | `prepareDynamicModel` | Buscar metadados de forma assíncrona antes da resolução |
      | `normalizeResolvedModel` | Regravações de transporte antes do executor |
      | `normalizeToolSchemas` | Limpeza de esquemas de ferramentas pertencente ao provedor antes do registro |
      | `inspectToolSchemas` | Diagnósticos de esquemas de ferramentas pertencentes ao provedor |
      | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tags versus nativo |
      | `prepareExtraParams` | Parâmetros padrão da solicitação |
      | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | `wrapStreamFn` | Wrappers personalizados de cabeçalhos/corpo no caminho normal de streaming |
      | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | `resolveWebSocketSessionPolicy` | Cabeçalhos/intervalo de espera da sessão WS nativa |
      | `formatApiKey` | Formato personalizado do token de runtime |
      | `refreshOAuth` | Renovação personalizada de OAuth |
      | `buildAuthDoctorHint` | Orientação para reparar a autenticação |
      | `matchesContextOverflowError` | Detecção de estouro pertencente ao provedor |
      | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga pertencente ao provedor |
      | `isCacheTtlEligible` | Controle de TTL do cache de prompts |
      | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura (obsoleto — prefira `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Conjunto de opções de `/think` específico do modelo |
      | `isBinaryThinking` | Compatibilidade de ativação/desativação do pensamento binário (obsoleto — prefira `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilidade com raciocínio `xhigh` (obsoleto — prefira `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilidade com a política padrão de `/think` (obsoleto — prefira `resolveThinkingProfile`) |
      | `isModernModelRef` | Correspondência de modelo para execução ao vivo/teste rápido |
      | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | `resolveUsageAuth` | Análise personalizada da credencial de uso |
      | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | `createEmbeddingProvider` | Adaptador de embeddings pertencente ao provedor para memória/pesquisa |
      | `buildReplayPolicy` | Política personalizada de reprodução/Compaction da transcrição |
      | `sanitizeReplayHistory` | Regravações de reprodução específicas do provedor após a limpeza genérica |
      | `validateReplayTurns` | Validação rigorosa dos turnos de reprodução antes do executor incorporado |
      | `onModelSelected` | Callback após a seleção (por exemplo, telemetria) |

      Observações sobre fallback de runtime:

      - `normalizeConfig` resolve um plugin proprietário por ID de provedor (primeiro os provedores integrados e depois o plugin de runtime correspondente) e chama apenas esse hook — não há varredura entre outros provedores. O próprio hook `normalizeConfig` do Google é responsável por normalizar as entradas de configuração `google` / `google-vertex` / `google-antigravity`; ele não é um fallback separado do núcleo.
      - `resolveConfigApiKey` usa o hook do provedor quando ele é exposto. O Amazon Bedrock mantém a resolução de marcadores de variáveis de ambiente da AWS em seu plugin de provedor; a autenticação de runtime em si continua usando a cadeia padrão do AWS SDK quando configurada com `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` recebe o `provider` selecionado, o `modelId`, a dica opcional mesclada de catálogo `reasoning` e os fatos opcionais mesclados de `compat` do modelo. Use `compat` somente para selecionar a interface/perfil de pensamento do provedor.
      - `resolveSystemPromptContribution` permite que um provedor injete orientações de prompt do sistema sensíveis ao cache para uma família de modelos. Prefira-o ao hook legado `before_prompt_build` de todo o plugin quando o comportamento pertencer a uma família de provedor/modelo e precisar preservar a divisão estável/dinâmica do cache.

    </Accordion>

  </Step>

  <Step title="Adicionar recursos extras (opcional)">
    ### Etapa 5: adicionar recursos extras

    Um plugin de provedor pode registrar embeddings, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeos,
    busca de conteúdo web e pesquisa na web junto à inferência de texto. O OpenClaw
    classifica isso como um plugin de **recursos híbridos** — o padrão recomendado
    para plugins de empresas (um plugin por fornecedor). Consulte
    [Aspectos internos: propriedade dos recursos](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada recurso dentro de `register(api)` junto à chamada existente
    `api.registerProvider(...)`. Escolha apenas as abas necessárias:

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

        Use `assertOkOrThrowProviderError(...)` para falhas HTTP do provedor, de
        modo que os plugins compartilhem leituras limitadas do corpo do erro,
        análise de erros JSON e sufixos de ID da solicitação.
      </Tab>
      <Tab title="Transcrição em tempo real">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper
        compartilhado lida com captura de proxy, espera progressiva para reconexão,
        liberação no fechamento, handshakes de prontidão, enfileiramento de áudio e
        diagnósticos de eventos de fechamento. Seu plugin apenas mapeia os eventos
        upstream.

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

        Provedores de STT em lote que fazem POST de áudio multipart devem usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. O auxiliar normaliza os nomes dos
        arquivos enviados, incluindo envios AAC que precisam de um nome de
        arquivo no estilo M4A para APIs de transcrição compatíveis.
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
            handlesInputAudioBargeIn: true,
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

        Declare `capabilities` para que `talk.catalog` possa expor modos,
        transportes, formatos de áudio e sinalizadores de recursos válidos aos
        clientes Talk para navegador e nativos. Implemente `handleBargeIn`
        quando um transporte puder detectar que uma pessoa está interrompendo
        a reprodução do assistente e o provedor oferecer suporte para truncar
        ou limpar a resposta de áudio ativa.
        `submitToolResult` pode retornar `void` para envio síncrono ou uma
        `Promise<void>` para um limite de conclusão assíncrona que a ponte do
        provedor possa expor. As sessões de retransmissão do Gateway aguardam
        essa promessa antes de confirmar um resultado final ou limpar a
        execução vinculada; rejeite-a quando o envio falhar.
        Defina `supportsToolResultSuppression: false` quando o provedor não
        puder respeitar `options.suppressResponse`. Assim, o OpenClaw evita a
        supressão para resultados internos de consulta forçada e cancelamento
        e rejeita solicitações diretas de resultado suprimido em vez de iniciar
        silenciosamente uma resposta.
        Os consumidores de `createRealtimeVoiceBridgeSession` também podem
        retornar uma promessa de `onToolCall`; exceções síncronas e rejeições
        são encaminhadas ao retorno de chamada `onError` da sessão.
        Defina `handlesInputAudioBargeIn` somente quando o VAD do provedor
        confirmar uma interrupção chamando `onClearAudio("barge-in")`.
        Provedores que omitem o sinalizador usam a detecção alternativa local
        de áudio de entrada do OpenClaw.
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

        Provedores de mídia locais ou auto-hospedados que intencionalmente não
        exigem credenciais podem expor `resolveAuth` e retornar `kind: "none"`.
        O OpenClaw ainda mantém a verificação normal de autenticação para
        provedores que não aderem explicitamente. Os provedores existentes
        podem continuar lendo `req.apiKey`; novos provedores devem preferir
        `req.auth`.

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

        Declare o mesmo identificador em `contracts.embeddingProviders`. Esse é
        o contrato geral de embeddings para geração reutilizável de vetores,
        incluindo busca na memória. `registerMemoryEmbeddingProvider(...)` é
        uma compatibilidade obsoleta para adaptadores existentes específicos
        de memória.
      </Tab>
      <Tab title="Geração de imagens e vídeos">
        Os recursos de imagem e vídeo usam uma estrutura **consciente do
        modo**. Provedores de imagem declaram blocos obrigatórios dos recursos
        `generate` e `edit`; provedores de vídeo declaram `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados simples como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não são
        suficientes para anunciar corretamente o suporte a modos de
        transformação ou modos desativados. A geração de música segue o mesmo
        padrão de `generate` / `edit`.

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

        `capabilities` é obrigatório em ambos os tipos de provedor; `edit` e os
        blocos de transformação de vídeo (`imageToVideo`, `videoToVideo`)
        sempre precisam de um sinalizador `enabled` explícito.

        Use `catalogByModel` quando os modos estáticos ou recursos de um modelo
        listado forem diferentes dos padrões do provedor. Esses metadados
        mantêm `video_generate action=list` e os catálogos de modelos precisos
        sem invocar o código do provedor. A consulta e a aplicação dos recursos
        durante a solicitação ainda pertencem a `resolveModelCapabilities` e
        `generateVideo`; reutilize a mesma constante de recursos nos dois
        caminhos quando possível.
      </Tab>
      <Tab title="Busca e obtenção na web">
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

        Ambos os tipos de provedor compartilham a mesma estrutura de conexão
        de credenciais: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` e
        `createTool` são todos obrigatórios.
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

Plugins de provedor são publicados da mesma forma que qualquer outro Plugin
externo de código:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` é um comando diferente para publicar uma pasta
de skill, não um pacote de Plugin — não o use aqui.

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

## Referência da ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
provedores integrados:

| Ordem    | Quando        | Caso de uso                                                     |
| -------- | ------------- | --------------------------------------------------------------- |
| `simple` | Primeira etapa | Provedores simples com chave de API                             |
| `profile` | Após simple  | Provedores condicionados a perfis de autenticação               |
| `paired` | Após profile  | Sintetizar várias entradas relacionadas                         |
| `late`   | Última etapa  | Substituir provedores existentes (prevalece em caso de conflito) |

## Próximas etapas

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - se o seu plugin também fornece um canal
- [Runtime do SDK](/pt-BR/plugins/sdk-runtime) - auxiliares de `api.runtime` (TTS, pesquisa, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação de subcaminhos
- [Detalhes internos de plugins](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) - detalhes dos hooks e exemplos incluídos

## Relacionado

- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Criação de plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
