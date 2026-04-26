---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender auth de provedor, catálogos e hooks de runtime
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para o OpenClaw
title: Criando plugins de provedor
x-i18n:
    generated_at: "2026-04-26T11:34:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Este guia mostra como criar um Plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
auth por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para a estrutura básica
  do pacote e configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por um daemon nativo de agente que seja dono de threads,
  Compaction ou eventos de ferramenta, combine o provedor com um [agent harness](/pt-BR/plugins/sdk-agent-harness)
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
    credenciais sem carregar o runtime do seu plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor precisar reutilizar a auth de outro ID de provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu Plugin de provedor a partir
    de IDs abreviados de modelo como `acme-large` antes que hooks de runtime existam. Se você publicar o
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

    Isso é um provedor funcional. Os usuários agora podem executar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provedor upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação de texto bidirecional em vez de substituir o caminho de streaming:

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
    transporte. `output` reescreve deltas de texto do assistente e texto final antes que o
    OpenClaw analise seus próprios marcadores de controle ou faça a entrega pelo canal.

    Para provedores incluídos que registram apenas um provedor de texto com
    auth por chave de API mais um único runtime com suporte em catálogo, prefira o helper
    mais restrito `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` é o caminho de catálogo ativo usado quando o OpenClaw consegue resolver
    a auth real do provedor. Ele pode realizar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline que sejam seguras para exibir antes que a auth
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição atual de `models list --all` do OpenClaw executa catálogos estáticos
    apenas para plugins de provedor incluídos, com config vazia, env vazio e sem
    caminhos de agente/workspace.

    Se seu fluxo de auth também precisar corrigir `models.providers.*`, aliases e
    o modelo padrão do agente durante a integração inicial, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais restritos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferece suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de fixar verificações por ID do
    provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades
    do endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda façam opt-in mesmo quando um plugin estiver usando um ID de provedor personalizado.

  </Step>

  <Step title="Adicionar resolução dinâmica de modelo">
    Se o seu provedor aceitar IDs de modelo arbitrários (como um proxy ou roteador),
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
    aquecimento assíncrono — `resolveDynamicModel` será executado novamente depois que ele terminar.

  </Step>

  <Step title="Adicionar hooks de runtime (quando necessário)">
    A maioria dos provedores precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    de forma incremental conforme o seu provedor exigir.

    Builders auxiliares compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade
    de ferramentas, então plugins normalmente não precisam conectar manualmente cada hook um a um:

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
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza de blocos de thinking específicos do Claude apenas quando o modelo resolvido for realmente um ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio com tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Saneamento de thought-signature do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não ativa validação nativa de replay do Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um único plugin; descarte opcional de blocos de thinking apenas para Claude permanece delimitado ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta | Exemplos incluídos |
    | --- | --- | --- |
    | `google-thinking` | Normalização do payload de thinking do Gemini no caminho compartilhado de stream | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de reasoning do Kilo no caminho compartilhado de stream por proxy, com `kilo/auto` e IDs de reasoning de proxy não compatíveis ignorando thinking injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento do payload nativo binário de thinking do Moonshot a partir da config + nível de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita de modelo em fast-mode do MiniMax no caminho compartilhado de stream | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de OpenAI/Codex Responses: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex, modelagem de payload compatível com reasoning e gerenciamento de contexto do Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de reasoning do OpenRouter para rotas de proxy, com ignorar centralizado para modelos não compatíveis/`auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramenta, a menos que seja explicitamente desativado | `zai` |

    <Accordion title="Seams do SDK que dão suporte aos family builders">
      Cada family builder é composto por helpers públicos de nível mais baixo exportados pelo mesmo pacote, que você pode usar quando um provedor precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os builders brutos de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta helpers de replay do Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper compatível com OpenAI do DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers subjacentes de schema do Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helpers de compatibilidade do xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). O plugin xAI incluído usa `normalizeResolvedModel` + `contributeResolvedModelCompat` com isso para manter regras do xAI pertencentes ao provedor.

      Alguns helpers de stream permanecem locais ao provedor de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de nível mais baixo de wrapper Anthropic em seu próprio seam público `api.ts` / `contract-api.ts`, porque eles codificam o tratamento de beta de OAuth do Claude e o gating de `context1m`. O plugin xAI, de forma semelhante, mantém a modelagem nativa de Responses do xAI em seu próprio `wrapStreamFn` (aliases `/fast`, `tool_stream` padrão, limpeza de strict-tool não compatível, remoção de payload de reasoning específica do xAI).

      O mesmo padrão de raiz de pacote também dá suporte a `@openclaw/openai-provider` (builders de provedor, helpers de modelo padrão, builders de provedor realtime) e `@openclaw/openrouter-provider` (builder de provedor mais helpers de onboarding/config).
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
        Para provedores que precisam de cabeçalhos personalizados de requisição ou modificações no corpo:

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
      <Tab title="Identidade de transporte nativo">
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
      <Tab title="Uso e faturamento">
        Para provedores que expõem dados de uso/faturamento:

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
      O OpenClaw chama os hooks nesta ordem. A maioria dos provedores usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de base URL |
      | 2 | `applyConfigDefaults` | Padrões globais pertencentes ao provedor durante a materialização da config |
      | 3 | `normalizeModelId` | Limpeza de aliases legados/prévia de model-id antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normaliza config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para provedores de config |
      | 7 | `resolveConfigApiKey` | Resolução de auth por marcador env pertencente ao provedor |
      | 8 | `resolveSyntheticAuth` | Auth sintética local/self-hosted ou baseada em config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos de perfil armazenado atrás de auth env/config |
      | 10 | `resolveDynamicModel` | Aceita IDs arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática legada de capacidades; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta pertencente ao provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta pertencentes ao provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de reasoning com tag vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de cabeçalho/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativa/cool-down |
      | 23 | `formatApiKey` | Formato personalizado de token em runtime |
      | 24 | `refreshOAuth` | Atualização personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação de reparo de auth |
      | 26 | `matchesContextOverflowError` | Detecção de overflow pertencente ao provedor |
      | 27 | `classifyFailoverReason` | Classificação de rate-limit/sobrecarga pertencente ao provedor |
      | 28 | `isCacheTtlEligible` | Gating de TTL do cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada para auth ausente |
      | 30 | `suppressBuiltInModel` | Oculta linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade de thinking binário ligado/desligado |
      | 34 | `supportsXHighThinking` | Compatibilidade com reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade com política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings pertencente ao provedor para memória/busca |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcrição |
      | 42 | `sanitizeReplayHistory` | Reescritas de replay específicas do provedor após limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner incorporado |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações de fallback de runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente, depois outros plugins de provedor com hooks até que um realmente altere a config. Se nenhum hook de provedor reescrever uma entrada compatível da família Google, o normalizador de config do Google incluído ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando ele é exposto. O caminho incluído de `amazon-bedrock` também tem aqui um resolvedor integrado de marcador env da AWS, embora a auth de runtime do Bedrock ainda use a cadeia padrão do SDK da AWS.
      - `resolveSystemPromptContribution` permite que um provedor injete orientação de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira-o a `before_prompt_build` quando o comportamento pertencer a uma família específica de provedor/modelo e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte [Internos: Hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    Um Plugin de provedor pode registrar fala, transcrição realtime, voz
    realtime, compreensão de mídia, geração de imagem, geração de vídeo, web fetch
    e web search juntamente com inferência de texto. O OpenClaw classifica isso como um
    Plugin de **capacidade híbrida** — o padrão recomendado para plugins corporativos
    (um plugin por fornecedor). Consulte
    [Internos: Propriedade de capacidade](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` ao lado da sua chamada existente
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
              await assertOkOrThrowProviderError(response, "Erro da API Acme Speech");
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
        plugins compartilhem leituras limitadas do corpo de erro, parsing de erro JSON e
        sufixos de request-id.
      </Tab>
      <Tab title="Transcrição realtime">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper compartilhado
        cuida da captura de proxy, backoff de reconexão, flush no fechamento, handshakes
        de prontidão, enfileiramento de áudio e diagnósticos de evento de fechamento. Seu plugin
        só mapeia eventos upstream.

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

        Provedores STT em lote que fazem POST de áudio multipart devem usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. O helper normaliza nomes de arquivo
        de upload, incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
        APIs de transcrição compatíveis.
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
        Capacidades de vídeo usam um formato **sensível ao modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não
        são suficientes para anunciar com clareza suporte a modo de transformação ou modos desativados.
        A geração de música segue o mesmo padrão com blocos explícitos `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* resultado de imagem */ }),
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
            description: "Buscar uma página por Acme Fetch.",
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
    // Exporte seu objeto de configuração do provedor de index.ts ou de um arquivo dedicado
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

Plugins de provedor são publicados da mesma forma que qualquer outro Plugin externo de código:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas de Skills; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifesto com metadados de auth do provedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência da ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
provedores incluídos:

| Ordem      | Quando        | Caso de uso                                    |
| ---------- | ------------- | ---------------------------------------------- |
| `simple`   | Primeira passagem | Provedores simples com chave de API         |
| `profile`  | Após simple   | Provedores condicionados a perfis de auth      |
| `paired`   | Após profile  | Sintetizar múltiplas entradas relacionadas     |
| `late`     | Última passagem | Substituir provedores existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se seu plugin também fornecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Internos de Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) — detalhes de hooks e exemplos incluídos

## Relacionado

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
