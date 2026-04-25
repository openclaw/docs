---
read_when:
    - Você está criando um novo plugin de provider de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou uma LLM personalizada ao OpenClaw
    - Você precisa entender autenticação do provider, catálogos e hooks de tempo de execução
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um plugin de provider de modelo para OpenClaw
title: Criando plugins de provider
x-i18n:
    generated_at: "2026-04-25T18:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Este guia apresenta o processo de criação de um plugin de provider que adiciona um provider de modelo
(LLM) ao OpenClaw. Ao final, você terá um provider com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw antes, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provider adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por meio de um daemon de agente nativo responsável por threads,
  Compaction ou eventos de ferramenta, combine o provider com um [agent harness](/pt-BR/plugins/sdk-agent-harness)
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

    O manifesto declara `providerAuthEnvVars` para que o OpenClaw possa detectar
    credenciais sem carregar o runtime do seu plugin. Adicione `providerAuthAliases`
    quando uma variante de provider precisar reutilizar a autenticação de outro id de provider. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu plugin de provider a partir de ids
    abreviados de modelo como `acme-large` antes de os hooks de runtime existirem. Se você publicar o
    provider no ClawHub, os campos `openclaw.compat` e `openclaw.build`
    são obrigatórios em `package.json`.

  </Step>

  <Step title="Registre o provider">
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

    Isso já é um provider funcional. Agora os usuários podem
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provider upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação bidirecional de texto em vez de substituir o caminho de stream:

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

    `input` reescreve o prompt final do sistema e o conteúdo das mensagens de texto antes do
    transporte. `output` reescreve deltas de texto do assistente e o texto final antes
    de o OpenClaw analisar seus próprios marcadores de controle ou a entrega no canal.

    Para providers incluídos no pacote que registram apenas um provider de texto com autenticação por chave de API
    mais um único runtime baseado em catálogo, prefira o helper mais específico
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

    `buildProvider` é o caminho de catálogo ativo usado quando o OpenClaw consegue resolver uma
    autenticação real do provider. Ele pode executar descoberta específica do provider. Use
    `buildStaticProvider` apenas para entradas offline que sejam seguras para mostrar antes de a autenticação
    estar configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição atual de `models list --all` do OpenClaw executa catálogos estáticos
    apenas para plugins de provider incluídos no pacote, com configuração vazia, ambiente vazio e sem
    caminhos de agente/workspace.

    Se seu fluxo de autenticação também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provider oferece suporte a blocos de uso em stream no
    transporte normal `openai-completions`, prefira os helpers de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações fixas
    por id de provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades
    do endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda façam opt-in
    mesmo quando um plugin estiver usando um id de provider personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelo">
    Se seu provider aceitar ids arbitrários de modelo (como um proxy ou roteador),
    adicione `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog acima

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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para um
    aquecimento assíncrono — `resolveDynamicModel` será executado novamente depois que ele terminar.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos providers só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    gradualmente conforme seu provider exigir.

    Builders de helper compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade com ferramentas,
    então normalmente os plugins não precisam conectar manualmente cada hook um por um:

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

    Famílias de replay disponíveis atualmente:

    | Família | O que ela conecta | Exemplos incluídos no pacote |
    | --- | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de ids de chamada de ferramenta, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte exige isso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes Anthropic-message recebam limpeza específica de blocos de thinking do Claude apenas quando o modelo resolvido for de fato um id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de reasoning com tags | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Saneamento de assinatura de thinking do Gemini para modelos Gemini executados por transportes de proxy compatíveis com OpenAI; não ativa validação nativa de replay do Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para providers que misturam superfícies de modelo Anthropic-message e OpenAI-compatible em um único plugin; a remoção opcional de blocos de thinking somente do Claude continua limitada ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis atualmente:

    | Família | O que ela conecta | Exemplos incluídos no pacote |
    | --- | --- | --- |
    | `google-thinking` | Normalização de payload de thinking do Gemini no caminho de stream compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de reasoning do Kilo no caminho de stream de proxy compartilhado, com `kilo/auto` e ids de reasoning de proxy sem suporte ignorando o thinking injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento de payload binário native-thinking do Moonshot a partir da configuração + nível de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita do modelo em modo rápido do MiniMax no caminho de stream compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de Responses do OpenAI/Codex: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa na web nativa do Codex, modelagem de payload compatível com reasoning e gerenciamento de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de reasoning do OpenRouter para rotas de proxy, com ignorar `auto`/modelo sem suporte tratado de forma centralizada | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para providers como Z.AI que querem streaming de ferramentas, a menos que seja explicitamente desativado | `zai` |

    <Accordion title="Interfaces do SDK que alimentam os builders de famílias">
      Cada builder de família é composto por helpers públicos de nível mais baixo exportados pelo mesmo pacote, aos quais você pode recorrer quando um provider precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os builders brutos de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta helpers de replay do Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), do wrapper compatível com OpenAI do DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) e dos wrappers compartilhados de proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers de schema subjacentes do Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helpers de compatibilidade do xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). O plugin xAI incluído no pacote usa `normalizeResolvedModel` + `contributeResolvedModelCompat` com esses helpers para manter as regras do xAI sob responsabilidade do provider.

      Alguns helpers de stream permanecem locais ao provider de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper Anthropic de nível mais baixo em sua própria interface pública `api.ts` / `contract-api.ts`, porque eles codificam o tratamento beta do Claude OAuth e o gating `context1m`. O plugin xAI, de modo semelhante, mantém a modelagem nativa de Responses do xAI em seu próprio `wrapStreamFn` (aliases `/fast`, `tool_stream` padrão, limpeza de strict-tool sem suporte, remoção de payload de reasoning específica do xAI).

      O mesmo padrão de raiz de pacote também sustenta `@openclaw/openai-provider` (builders de provider, helpers de modelo padrão, builders de provider em tempo real) e `@openclaw/openrouter-provider` (builder de provider mais helpers de onboarding/configuração).
    </Accordion>

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
      <Tab title="Cabeçalhos personalizados">
        Para providers que precisam de cabeçalhos de requisição personalizados ou modificações no corpo:

        ```typescript
        // wrapStreamFn retorna uma StreamFn derivada de ctx.streamFn
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
      <Tab title="Identidade do transporte nativo">
        Para providers que precisam de cabeçalhos ou metadados nativos de requisição/sessão em
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
      O OpenClaw chama os hooks nesta ordem. A maioria dos providers usa apenas 2 ou 3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de `baseUrl` |
      | 2 | `applyConfigDefaults` | Padrões globais sob responsabilidade do provider durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de aliases de id de modelo legado/preview antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provider antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar a configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas nativas de compatibilidade de uso em streaming para providers de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de ambiente sob responsabilidade do provider |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders de perfil armazenado sintético atrás da autenticação por env/configuração |
      | 10 | `resolveDynamicModel` | Aceitar ids arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `capabilities` | Conjunto estático legado de capacidades; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta sob responsabilidade do provider antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta sob responsabilidade do provider |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de reasoning com tag vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de cabeçalho/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativos/cooldown |
      | 23 | `formatApiKey` | Formato personalizado de token em tempo de execução |
      | 24 | `refreshOAuth` | Atualização personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação para reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow sob responsabilidade do provider |
      | 27 | `classifyFailoverReason` | Classificação de rate-limit/sobrecarga sob responsabilidade do provider |
      | 28 | `isCacheTtlEligible` | Gating de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada para autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade de thinking binário ligado/desligado |
      | 34 | `supportsXHighThinking` | Compatibilidade de suporte a reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade da política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo ao vivo/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embedding sob responsabilidade do provider para memória/pesquisa |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcrição |
      | 42 | `sanitizeReplayHistory` | Reescritas específicas do provider no replay após limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner embutido |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações sobre fallback de runtime:

      - `normalizeConfig` verifica primeiro o provider correspondente, depois outros plugins de provider com suporte a hook até que um realmente altere a configuração. Se nenhum hook de provider reescrever uma entrada de configuração suportada da família Google, o normalizador de configuração Google incluído no pacote ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provider quando exposto. O caminho incluído no pacote `amazon-bedrock` também tem aqui um resolvedor interno de marcador de ambiente AWS, embora a autenticação de runtime do Bedrock em si ainda use a cadeia padrão do SDK da AWS.
      - `resolveSystemPromptContribution` permite que um provider injete orientação de prompt do sistema com reconhecimento de cache para uma família de modelos. Prefira isso a `before_prompt_build` quando o comportamento pertencer a uma família específica de provider/modelo e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte [Internals: Hooks de runtime do provider](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicione capacidades extras (opcional)">
    Um plugin de provider pode registrar fala, transcrição em tempo real, voz em tempo real,
    compreensão de mídia, geração de imagem, geração de vídeo, busca na web
    e pesquisa na web junto com inferência de texto. O OpenClaw classifica isso como um plugin de
    **capacidade híbrida** — o padrão recomendado para plugins de empresa
    (um plugin por fornecedor). Consulte
    [Internals: Ownership de capacidades](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` junto com sua chamada
    `api.registerProvider(...)` existente. Escolha apenas as abas de que você precisa:

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

        Use `assertOkOrThrowProviderError(...)` para falhas HTTP do provider, para que
        os plugins compartilhem leituras limitadas do corpo de erro, parsing de erro JSON e
        sufixos de id de requisição.
      </Tab>
      <Tab title="Transcrição em tempo real">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper
        compartilhado gerencia captura de proxy, backoff de reconexão, flush no fechamento, handshakes
        de prontidão, enfileiramento de áudio e diagnósticos de evento de fechamento. Seu plugin
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

        Providers de STT em lote que fazem POST de áudio multipart devem usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. O helper normaliza nomes de
        arquivo de upload, incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
        APIs de transcrição compatíveis.
      </Tab>
      <Tab title="Voz em tempo real">
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
      <Tab title="Compreensão de mídia">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Uma foto de..." }),
          transcribeAudio: async (req) => ({ text: "Transcrição..." }),
        });
        ```
      </Tab>
      <Tab title="Geração de imagem e vídeo">
        Capacidades de vídeo usam uma forma **sensível ao modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não são
        suficientes para anunciar suporte a modo de transformação ou modos desativados de forma limpa.
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
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Busca e pesquisa na web">
        ```typescript
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
            description: "Busca uma página com Acme Fetch.",
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
    // Exporte seu objeto de configuração do provider de index.ts ou de um arquivo dedicado
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolve modelos dinâmicos", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("retorna catálogo quando a chave está disponível", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("retorna catálogo nulo quando não há chave", async () => {
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

Plugins de provider são publicados da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas de Skill; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifesto com metadados de autenticação do provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
providers internos:

| Ordem     | Quando         | Caso de uso                                      |
| --------- | -------------- | ------------------------------------------------ |
| `simple`  | Primeira etapa | Providers simples com chave de API               |
| `profile` | Após simple    | Providers controlados por perfis de autenticação |
| `paired`  | Após profile   | Sintetizar várias entradas relacionadas          |
| `late`    | Última etapa   | Substituir providers existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se seu plugin também fornecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, pesquisa, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importações por subcaminho
- [Internals de plugins](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) — detalhes dos hooks e exemplos incluídos no pacote

## Relacionado

- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
