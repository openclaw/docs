---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender autenticação, catálogos e hooks de runtime de provedor
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para OpenClaw
title: Criando Plugins de provedor
x-i18n:
    generated_at: "2026-04-24T06:04:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Este guia explica passo a passo como criar um Plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para a estrutura básica do
  pacote e configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por um daemon nativo de agente que controla threads, Compaction ou eventos
  de ferramenta, combine o provedor com um [agent harness](/pt-BR/plugins/sdk-agent-harness)
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
      "description": "Provedor de modelo Acme AI",
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
          "choiceLabel": "Chave de API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chave de API Acme AI"
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
    credenciais sem carregar o runtime do seu Plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor precisar reutilizar a autenticação de outro ID de provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu Plugin de provedor a partir de
    IDs abreviados de modelo como `acme-large` antes de existirem hooks de runtime. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios em `package.json`.

  </Step>

  <Step title="Registrar o provedor">
    Um provedor mínimo precisa de `id`, `label`, `auth` e `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provedor de modelo Acme AI",
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
              label: "Chave de API Acme AI",
              hint: "Chave de API do seu painel Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Digite sua chave de API Acme AI",
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

    Esse é um provedor funcional. Os usuários agora podem executar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provedor upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação bidirecional de texto em vez de substituir o caminho do stream:

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

    `input` reescreve o prompt final do sistema e o conteúdo de mensagem de texto antes do
    transporte. `output` reescreve deltas de texto do assistente e o texto final antes que o
    OpenClaw analise seus próprios marcadores de controle ou entrega de canal.

    Para provedores empacotados que registram apenas um provedor de texto com
    autenticação por chave de API mais um único runtime com suporte de catálogo, prefira o helper mais estreito
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provedor de modelo Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Chave de API Acme AI",
            hint: "Chave de API do seu painel Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Digite sua chave de API Acme AI",
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

    `buildProvider` é o caminho de catálogo live usado quando o OpenClaw consegue resolver
    autenticação real do provedor. Ele pode executar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline que são seguras para exibir antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição atual de `models list --all` do OpenClaw executa catálogos estáticos
    apenas para Plugins de provedor empacotados, com configuração vazia, env vazio e sem
    caminhos de agente/workspace.

    Se o seu fluxo de autenticação também precisar corrigir `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers preset de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais estreitos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferece suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por ID de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades do endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda façam opt-in mesmo quando um Plugin usa um ID de provedor personalizado.

  </Step>

  <Step title="Adicionar resolução dinâmica de modelos">
    Se o seu provedor aceitar IDs arbitrários de modelo (como um proxy ou roteador),
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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para
    aquecimento assíncrono — `resolveDynamicModel` é executado novamente depois que ele for concluído.

  </Step>

  <Step title="Adicionar hooks de runtime (conforme necessário)">
    A maioria dos provedores precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    incrementalmente, conforme o seu provedor exigir.

    Builders de helper compartilhado agora cobrem as famílias mais comuns de replay/compatibilidade de ferramentas, então os Plugins normalmente não precisam mais conectar manualmente cada hook, um por um:

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
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo sanitização de ID de chamada de ferramenta, correções de ordenação assistant-first e validação genérica de turno Gemini quando o transporte precisa disso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay com reconhecimento de Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza de bloco de thinking específica de Claude apenas quando o modelo resolvido realmente for um ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay Gemini mais sanitização de replay de bootstrap e modo de saída de raciocínio com tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitização de assinatura de pensamento Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não ativa validação nativa de replay Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um único Plugin; o descarte opcional de bloco de thinking apenas para Claude permanece restrito ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta | Exemplos empacotados |
    | --- | --- | --- |
    | `google-thinking` | Normalização de payload de thinking do Gemini no caminho de stream compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raciocínio Kilo no caminho de stream proxy compartilhado, com `kilo/auto` e IDs de raciocínio proxy não compatíveis ignorando thinking injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento Moonshot de payload binário nativo de thinking a partir da configuração + nível de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita de modelo em fast mode do MiniMax no caminho de stream compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de OpenAI/Codex Responses: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, busca web nativa do Codex, formatação de payload compatível com raciocínio e gerenciamento de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raciocínio OpenRouter para rotas proxy, com pulos de `auto`/modelo não compatível tratados centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramenta a menos que seja explicitamente desativado | `zai` |

    <Accordion title="Seams de SDK que alimentam os builders de família">
      Cada builder de família é composto por helpers públicos de nível mais baixo exportados do mesmo pacote, que você pode usar quando um provedor precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os builders brutos de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta helpers de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, mais os wrappers compartilhados de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers subjacentes de schema Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helpers de compatibilidade xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). O Plugin empacotado xAI usa `normalizeResolvedModel` + `contributeResolvedModelCompat` com estes para manter regras de xAI sob controle do provedor.

      Alguns helpers de stream permanecem locais ao provedor de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper Anthropic de nível mais baixo em seu próprio seam público `api.ts` / `contract-api.ts` porque eles codificam tratamento de beta Claude OAuth e gating de `context1m`. O Plugin xAI, de forma semelhante, mantém a formatação nativa de xAI Responses em seu próprio `wrapStreamFn` (aliases de `/fast`, `tool_stream` padrão, limpeza de ferramenta estrita não compatível, remoção de payload de raciocínio específica de xAI).

      O mesmo padrão de raiz de pacote também sustenta `@openclaw/openai-provider` (builders de provedor, helpers de modelo padrão, builders de provedor realtime) e `@openclaw/openrouter-provider` (builder de provedor mais helpers de onboarding/configuração).
    </Accordion>

    <Tabs>
      <Tab title="Troca de token">
        Para provedores que precisam de troca de token antes de cada chamada de inferência:

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
        Para provedores que precisam de cabeçalhos de requisição personalizados ou modificações no body:

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
      <Tab title="Identidade de transporte nativa">
        Para provedores que precisam de cabeçalhos ou metadados nativos de requisição/sessão em
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
      O OpenClaw chama hooks nesta ordem. A maioria dos provedores usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de URL base |
      | 2 | `applyConfigDefaults` | Padrões globais controlados pelo provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de alias de ID de modelo legado/preview antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` por família de provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador env controlada pelo provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/auto-hospedada ou apoiada por configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders de perfil armazenado sintético atrás de autenticação env/config |
      | 10 | `resolveDynamicModel` | Aceitar IDs arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do executor |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível |
      | 14 | `capabilities` | Bag estática legada de capacidades; compatibilidade apenas |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta controlada pelo provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta controlados pelo provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tag vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de cabeçalho/body no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativos / cooldown |
      | 23 | `formatApiKey` | Formato de token de runtime personalizado |
      | 24 | `refreshOAuth` | Renovação de OAuth personalizada |
      | 25 | `buildAuthDoctorHint` | Orientação para reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow controlada pelo provedor |
      | 27 | `classifyFailoverReason` | Classificação de rate-limit/sobrecarga controlada pelo provedor |
      | 28 | `isCacheTtlEligible` | Gating TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade binária de thinking ligado/desligado |
      | 34 | `supportsXHighThinking` | Compatibilidade com raciocínio `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade da política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embedding controlado pelo provedor para memória/busca |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcrição |
      | 42 | `sanitizeReplayHistory` | Reescritas específicas de replay do provedor após limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do executor incorporado |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações sobre fallback de runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente e depois outros Plugins de provedor com suporte a hooks até que um realmente altere a configuração. Se nenhum hook de provedor reescrever uma entrada compatível da família Google, o normalizador de configuração Google empacotado ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando exposto. O caminho empacotado de `amazon-bedrock` também tem aqui um resolvedor interno de marcador env da AWS, embora a autenticação de runtime do Bedrock em si ainda use a cadeia padrão do SDK AWS.
      - `resolveSystemPromptContribution` permite que um provedor injete orientação de prompt do sistema sensível a cache para uma família de modelos. Prefira isso a `before_prompt_build` quando o comportamento pertencer a uma família específica de provedor/modelo e deva preservar a divisão estável/dinâmica de cache.

      Para descrições detalhadas e exemplos do mundo real, consulte [Internals: Hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    Um Plugin de provedor pode registrar fala, transcrição realtime, voz realtime,
    entendimento de mídia, geração de imagem, geração de vídeo, web fetch
    e web search junto com inferência de texto. O OpenClaw classifica isso como um
    Plugin de **capacidade híbrida** — o padrão recomendado para Plugins corporativos
    (um Plugin por fornecedor). Consulte
    [Internals: Ownership de capacidade](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` junto com a chamada
    existente `api.registerProvider(...)`. Escolha apenas as abas de que você precisar:

    <Tabs>
      <Tab title="Fala (TTS)">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* dados PCM */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="Transcrição realtime">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper compartilhado
        cuida de captura de proxy, backoff de reconexão, flush no fechamento, handshakes de prontidão,
        enfileiramento de áudio e diagnósticos de evento de fechamento. Seu Plugin
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

        Provedores de STT em lote que fazem POST de áudio multipart devem usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. O helper normaliza
        nomes de arquivo de upload, incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
        APIs compatíveis de transcrição.
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
      <Tab title="Entendimento de mídia">
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
        Capacidades de vídeo usam um formato **sensível ao modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não
        são suficientes para anunciar suporte a modo de transformação ou modos desativados de forma limpa.
        A geração de música segue o mesmo padrão com blocos explícitos `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* resultado da imagem */ }),
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
      <Tab title="Web fetch e search">
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
            description: "Buscar uma página via Acme Fetch.",
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
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporte o objeto de configuração do seu provedor de index.ts ou de um arquivo dedicado
    import { acmeProvider } from "./provider.js";

    describe("provedor acme-ai", () => {
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

Plugins de provedor são publicados da mesma forma que qualquer outro Plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas de Skill; pacotes de Plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifesto com metadados de autenticação do provedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem de catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
provedores internos:

| Ordem     | Quando          | Caso de uso                                     |
| --------- | --------------- | ----------------------------------------------- |
| `simple`  | Primeira passagem | Provedores simples com chave de API             |
| `profile` | Após simple     | Provedores controlados por perfis de autenticação |
| `paired`  | Após profile    | Sintetizar várias entradas relacionadas         |
| `late`    | Última passagem | Sobrescrever provedores existentes (vence em colisão) |

## Próximas etapas

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se o seu Plugin também fornecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Internals de Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) — detalhes de hooks e exemplos empacotados

## Relacionado

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Criando Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
