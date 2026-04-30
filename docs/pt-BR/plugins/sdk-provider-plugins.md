---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender a autenticação de provedores, catálogos e ganchos de tempo de execução
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para o OpenClaw
title: Criando Plugins de provedor
x-i18n:
    generated_at: "2026-04-30T10:01:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Este guia percorre a criação de um Plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com um catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura básica do pacote
  e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao ciclo normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por meio de um daemon de agente nativo que controla threads, compaction ou eventos de ferramenta,
  combine o provedor com um [arnês de agente](/pt-BR/plugins/sdk-agent-harness)
  em vez de colocar detalhes do protocolo do daemon no core.
</Tip>

## Passo a passo

<Steps>
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

    O manifesto declara `providerAuthEnvVars` para que o OpenClaw consiga detectar
    credenciais sem carregar o runtime do seu Plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor deve reutilizar a autenticação do id de outro provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu Plugin de provedor a partir de ids de modelo
    abreviados, como `acme-large`, antes que hooks de runtime existam. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    serão obrigatórios em `package.json`.

  </Step>

  <Step title="Registre o provedor">
    Um provedor mínimo precisa de `id`, `label`, `auth` e `catalog`:

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

    Esse é um provedor funcional. Agora os usuários podem executar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provedor upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação de texto bidirecional em vez de substituir o caminho de stream:

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

    `input` reescreve o prompt final do sistema e o conteúdo de mensagens de texto antes
    do transporte. `output` reescreve deltas de texto do assistente e o texto final antes que
    o OpenClaw analise seus próprios marcadores de controle ou a entrega do canal.

    Para provedores empacotados que registram apenas um provedor de texto com autenticação
    por chave de API mais um único runtime baseado em catálogo, prefira o helper mais específico
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

    `buildProvider` é o caminho de catálogo ativo usado quando o OpenClaw consegue resolver
    autenticação real do provedor. Ele pode executar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline que sejam seguras para exibir antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição `models list --all` do OpenClaw atualmente executa catálogos estáticos
    apenas para Plugins de provedor empacotados, com configuração vazia, env vazio e sem
    caminhos de agente/workspace.

    Se seu fluxo de autenticação também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers de preset de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferecer suporte a blocos de uso transmitidos no
    transporte normal `openai-completions`, prefira os helpers de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações
    de id de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do
    mapa de capacidades do endpoint, então endpoints nativos no estilo Moonshot/DashScope ainda
    aderem mesmo quando um Plugin está usando um id de provedor personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelos">
    Se seu provedor aceitar IDs de modelo arbitrários (como um proxy ou roteador),
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
    assíncrono — `resolveDynamicModel` é executado novamente depois que ele termina.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos provedores precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    incrementalmente conforme seu provedor exigir.

    Builders de helpers compartilhados agora cobrem as famílias mais comuns de compatibilidade
    de replay/ferramentas, então Plugins normalmente não precisam conectar cada hook manualmente, um por um:

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

    | Família | O que ela conecta | Exemplos empacotados |
    | --- | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay ciente de Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza de blocos de thinking específica de Claude apenas quando o modelo resolvido for de fato um id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política de replay nativa Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio marcado | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Saneamento de thought-signature Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita validação de replay nativa Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um Plugin; o descarte opcional de blocos de thinking somente para Claude permanece limitado ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis hoje:

    | Família | O que conecta | Exemplos incluídos |
    | --- | --- | --- |
    | `google-thinking` | Normalização do payload de pensamento do Gemini no caminho de stream compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raciocínio Kilo no caminho de stream de proxy compartilhado, com `kilo/auto` e ids de raciocínio de proxy incompatíveis ignorando o pensamento injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento de payload de pensamento nativo binário do Moonshot a partir da configuração + nível `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita de modelo em modo rápido do MiniMax no caminho de stream compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de Responses da OpenAI/Codex: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa na web nativa do Codex, modelagem de payload compatível com raciocínio e gerenciamento de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas de proxy, com ignoros de modelo incompatível/`auto` tratados centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramentas salvo quando explicitamente desativado | `zai` |

    <Accordion title="Interfaces do SDK que impulsionam os construtores de família">
      Cada construtor de família é composto por auxiliares públicos de nível inferior exportados pelo mesmo pacote, aos quais você pode recorrer quando um provedor precisa sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os construtores brutos de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta auxiliares de replay do Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e auxiliares de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados da OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper compatível com OpenAI do DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), limpeza de prefill de pensamento do Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, auxiliares de esquema subjacentes do Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e auxiliares de compatibilidade da xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). O plugin xAI incluído usa `normalizeResolvedModel` + `contributeResolvedModelCompat` com eles para manter as regras da xAI sob propriedade do provedor.

      Alguns auxiliares de stream permanecem locais ao provedor de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os construtores de wrapper Anthropic de nível inferior na sua própria interface pública `api.ts` / `contract-api.ts`, porque eles codificam o tratamento de beta do OAuth do Claude e o controle de `context1m`. O plugin xAI, de forma semelhante, mantém a modelagem nativa de Responses da xAI no seu próprio `wrapStreamFn` (aliases de `/fast`, `tool_stream` padrão, limpeza de ferramentas estritas incompatíveis, remoção de payload de raciocínio específica da xAI).

      O mesmo padrão de raiz de pacote também sustenta `@openclaw/openai-provider` (construtores de provedor, auxiliares de modelo padrão, construtores de provedor realtime) e `@openclaw/openrouter-provider` (construtor de provedor mais auxiliares de onboarding/configuração).
    </Accordion>

    <Tabs>
      <Tab title="Troca de token">
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
      <Tab title="Cabeçalhos personalizados">
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
      <Tab title="Identidade de transporte nativa">
        Para provedores que precisam de cabeçalhos de requisição/sessão nativos ou metadados em
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
      </Tab>
    </Tabs>

    <Accordion title="Todos os hooks de provedor disponíveis">
      O OpenClaw chama hooks nesta ordem. A maioria dos provedores usa apenas 2 a 3:
      Campos de provedor somente de compatibilidade que o OpenClaw não chama mais, como
      `ProviderPlugin.capabilities` e `suppressBuiltInModel`, não estão listados
      aqui.

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de URL base |
      | 2 | `applyConfigDefaults` | Padrões globais de propriedade do provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de alias de id de modelo legado/preview antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família de provedores antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas nativas de compatibilidade de uso de streaming para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de ambiente de propriedade do provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/auto-hospedada ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado atrás de autenticação por ambiente/configuração |
      | 10 | `resolveDynamicModel` | Aceitar IDs arbitrários de modelos upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |
      | 13 | `contributeResolvedModelCompat` | Sinalizadores de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `normalizeToolSchemas` | Limpeza de esquema de ferramenta de propriedade do provedor antes do registro |
      | 15 | `inspectToolSchemas` | Diagnósticos de esquema de ferramenta de propriedade do provedor |
      | 16 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio marcada versus nativa |
      | 17 | `prepareExtraParams` | Parâmetros de requisição padrão |
      | 18 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 19 | `wrapStreamFn` | Wrappers de cabeçalhos/corpo personalizados no caminho de stream normal |
      | 20 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 21 | `resolveWebSocketSessionPolicy` | Cabeçalhos/cool-down nativos de sessão WS |
      | 22 | `formatApiKey` | Formato personalizado de token em runtime |
      | 23 | `refreshOAuth` | Atualização OAuth personalizada |
      | 24 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 25 | `matchesContextOverflowError` | Detecção de estouro de contexto de propriedade do provedor |
      | 26 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga de propriedade do provedor |
      | 27 | `isCacheTtlEligible` | Controle de TTL do cache de prompt |
      | 28 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 29 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 30 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 31 | `isBinaryThinking` | Compatibilidade de pensamento binário ligado/desligado |
      | 32 | `supportsXHighThinking` | Compatibilidade de suporte a raciocínio `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilidade de política `/think` padrão |
      | 34 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 35 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 36 | `resolveUsageAuth` | Análise personalizada de credenciais de uso |
      | 37 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 38 | `createEmbeddingProvider` | Adaptador de embeddings de propriedade do provedor para memória/pesquisa |
      | 39 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcrição |
      | 40 | `sanitizeReplayHistory` | Reescritas de replay específicas do provedor após a limpeza genérica |
      | 41 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner embutido |
      | 42 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações de fallback em runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente e, depois, outros plugins de provedor com suporte a hooks até que um deles realmente altere a configuração. Se nenhum hook de provedor reescrever uma entrada de configuração compatível da família Google, o normalizador de configuração Google incluído ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando exposto. O caminho `amazon-bedrock` incluído também tem um resolvedor integrado de marcador de ambiente AWS aqui, embora a própria autenticação em runtime do Bedrock ainda use a cadeia padrão do AWS SDK.
      - `resolveSystemPromptContribution` permite que um provedor injete orientação de prompt de sistema sensível a cache para uma família de modelos. Prefira-o em vez de `before_prompt_build` quando o comportamento pertence a uma família de provedor/modelo e deve preservar a divisão estável/dinâmica de cache.

      Para descrições detalhadas e exemplos reais, consulte [Internos: Hooks de Runtime de Provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    Um plugin de provedor pode registrar fala, transcrição realtime, voz realtime,
    compreensão de mídia, geração de imagens, geração de vídeo, busca na web,
    e pesquisa na web junto com inferência de texto. O OpenClaw classifica isso como um
    plugin de **capacidade híbrida** — o padrão recomendado para plugins de empresa
    (um plugin por fornecedor). Veja
    [Internos: Propriedade de Capacidades](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` junto da sua chamada existente
    a `api.registerProvider(...)`. Escolha apenas as abas de que você precisa:

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

        Use `assertOkOrThrowProviderError(...)` para falhas HTTP de provedores, para que
        os plugins compartilhem leituras limitadas do corpo de erro, análise de erros JSON e
        sufixos de ID da solicitação.
      </Tab>
      <Tab title="Transcrição em tempo real">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper compartilhado
        lida com captura de proxy, backoff de reconexão, esvaziamento ao fechar, handshakes de prontidão,
        enfileiramento de áudio e diagnósticos de evento de fechamento. Seu plugin
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
        `openclaw/plugin-sdk/provider-http`. O helper normaliza nomes de arquivo de upload,
        incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
        APIs de transcrição compatíveis.
      </Tab>
      <Tab title="Voz em tempo real">
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
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
      </Tab>
      <Tab title="Geração de imagem e vídeo">
        Recursos de vídeo usam uma estrutura **ciente de modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não são
        suficientes para anunciar suporte a modo de transformação ou modos desativados de forma clara.
        A geração de música segue o mesmo padrão, com blocos explícitos `generate` /
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
      <Tab title="Busca e obtenção na Web">
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

  <Step title="Teste">
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

## Publique no ClawHub

Plugins de provedor são publicados da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use o alias legado de publicação somente para skill aqui; pacotes de plugin devem usar
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
| `profile` | Após simple   | Provedores controlados por perfis de autenticação |
| `paired`  | Após profile  | Sintetizar várias entradas relacionadas          |
| `late`    | Última passagem | Substituir provedores existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se seu plugin também fornece um canal
- [Runtime do SDK](/pt-BR/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, busca, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Elementos internos do Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) — detalhes de hooks e exemplos integrados

## Relacionado

- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
