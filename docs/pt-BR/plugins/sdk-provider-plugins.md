---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender autenticação do provedor, catálogos e hooks de runtime
sidebarTitle: Provider plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para o OpenClaw
title: Criar Plugins de provedor
x-i18n:
    generated_at: "2026-04-25T13:52:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Este guia mostra como criar um Plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw antes, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para entender a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar executar por um daemon nativo de agente que controla threads, Compaction
  ou eventos de ferramenta, combine o provedor com um [harness de agente](/pt-BR/plugins/sdk-agent-harness)
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
    credenciais sem carregar o runtime do seu Plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor precisar reutilizar o id de autenticação de outro provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu Plugin de provedor a partir de
    ids abreviados de modelo como `acme-large` antes que hooks de runtime existam. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios no `package.json`.

  </Step>

  <Step title="Registrar o provedor">
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

    Esse já é um provedor funcional. Agora os usuários podem usar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provedor upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
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
    transporte. `output` reescreve deltas de texto do assistente e o texto final antes de o
    OpenClaw interpretar seus próprios marcadores de controle ou a entrega por canal.

    Para provedores agrupados que registram apenas um provedor de texto com autenticação por
    chave de API mais um único runtime com suporte de catálogo, prefira o helper mais
    restrito `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` é o caminho do catálogo live usado quando o OpenClaw consegue resolver a autenticação real
    do provedor. Ele pode executar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline que sejam seguras de mostrar antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição atual `models list --all` do OpenClaw executa catálogos estáticos
    apenas para Plugins de provedor agrupados, com config vazia, env vazia e sem
    caminhos de agente/workspace.

    Se o seu fluxo de autenticação também precisar corrigir `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais restritos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferece suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar checks por id
    do provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam o suporte a partir do mapa de capacidades do
    endpoint, então endpoints nativos no estilo Moonshot/DashScope ainda participam
    mesmo quando um Plugin estiver usando um id de provedor personalizado.

  </Step>

  <Step title="Adicionar resolução dinâmica de modelo">
    Se o seu provedor aceitar ids arbitrários de modelo (como um proxy ou roteador),
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
    aquecimento assíncrono — `resolveDynamicModel` é executado novamente após a conclusão.

  </Step>

  <Step title="Adicionar hooks de runtime (conforme necessário)">
    A maioria dos provedores só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    de forma incremental conforme o seu provedor exigir.

    Builders de helper compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade
    de ferramentas, então os Plugins geralmente não precisam mais conectar manualmente cada hook um por um:

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

    | Família | O que ela conecta | Exemplos agrupados |
    | --- | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de id de chamada de ferramenta, correções de ordenação com assistente primeiro e validação genérica de turnos Gemini quando o transporte exige isso | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes de mensagem Anthropic recebam limpeza específica de blocos de thinking do Claude apenas quando o modelo resolvido for de fato um id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay do bootstrap e modo de saída de reasoning com marcação | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Saneamento de assinatura de thought do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita validação nativa de replay do Gemini nem reescritas de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagem Anthropic e compatíveis com OpenAI em um único Plugin; a remoção opcional de bloco de thinking apenas para Claude continua restrita ao lado Anthropic | `minimax` |

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta | Exemplos agrupados |
    | --- | --- | --- |
    | `google-thinking` | Normalização de payload de thinking do Gemini no caminho de stream compartilhado | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de reasoning do Kilo no caminho de stream compartilhado do proxy, com `kilo/auto` e ids de reasoning de proxy não suportados ignorando o thinking injetado | `kilocode` |
    | `moonshot-thinking` | Mapeamento do payload binário de native-thinking do Moonshot a partir da configuração + nível de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescrita do modelo de fast mode do MiniMax no caminho de stream compartilhado | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de OpenAI/Codex Responses: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, busca nativa na web do Codex, modelagem de payload compatível com reasoning e gerenciamento de contexto do Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de reasoning do OpenRouter para rotas proxy, com ignorar centralizado para modelos não suportados/`auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ligado por padrão para provedores como Z.AI que querem streaming de ferramenta, a menos que seja explicitamente desabilitado | `zai` |

    <Accordion title="Interfaces do SDK que sustentam os builders de família">
      Cada builder de família é composto por helpers públicos de nível inferior exportados pelo mesmo pacote, que você pode usar quando um provedor precisar sair do padrão comum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e os builders brutos de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Também exporta helpers de replay do Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helpers de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, além dos wrappers compartilhados de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) e wrappers compartilhados de proxy/provedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helpers subjacentes de schema do Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helpers de compatibilidade do xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). O Plugin xAI agrupado usa `normalizeResolvedModel` + `contributeResolvedModelCompat` com isso para manter regras do xAI sob controle do provedor.

      Alguns helpers de stream continuam locais do provedor de propósito. `@openclaw/anthropic-provider` mantém `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper de Anthropic de nível inferior em sua própria interface pública `api.ts` / `contract-api.ts`, porque eles codificam tratamento beta do OAuth do Claude e controle de `context1m`. O Plugin xAI, de forma semelhante, mantém a modelagem nativa de Responses do xAI em seu próprio `wrapStreamFn` (aliases `/fast`, `tool_stream` padrão, limpeza de strict-tool não suportado, remoção de payload de reasoning específico do xAI).

      O mesmo padrão de raiz de pacote também sustenta `@openclaw/openai-provider` (builders de provedor, helpers de modelo padrão, builders de provedor em realtime) e `@openclaw/openrouter-provider` (builder de provedor mais helpers de onboarding/configuração).
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
      | 1 | `catalog` | Catálogo de modelos ou padrões de `baseUrl` |
      | 2 | `applyConfigDefaults` | Padrões globais controlados pelo provedor durante a materialização da config |
      | 3 | `normalizeModelId` | Limpeza de aliases legados/de preview de id de modelo antes da busca |
      | 4 | `normalizeTransport` | Limpeza de família de provedor em `api` / `baseUrl` antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar a config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para provedores de config |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação controlada pelo provedor via marcador de env |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou baseada em config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado atrás de autenticação por env/config |
      | 10 | `resolveDynamicModel` | Aceitar ids arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática legada de capacidades; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta controlada pelo provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta controlados pelo provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de reasoning com marcação vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de cabeçalho/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativos / cool-down |
      | 23 | `formatApiKey` | Formato personalizado de token em runtime |
      | 24 | `refreshOAuth` | Atualização personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow controlada pelo provedor |
      | 27 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga controlada pelo provedor |
      | 28 | `isCacheTtlEligible` | Controle de TTL do cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade de thinking binário ligado/desligado |
      | 34 | `supportsXHighThinking` | Compatibilidade de suporte a reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade da política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embedding controlado pelo provedor para memória/busca |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction do transcript |
      | 42 | `sanitizeReplayHistory` | Reescritas específicas do provedor após a limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner embutido |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observações sobre fallback de runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente e depois outros Plugins de provedor compatíveis com hook, até que um realmente altere a config. Se nenhum hook de provedor reescrever uma entrada de config compatível da família Google, o normalizador agrupado de config do Google ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando exposto. O caminho agrupado `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env da AWS, embora a autenticação de runtime do Bedrock em si ainda use a cadeia padrão do SDK da AWS.
      - `resolveSystemPromptContribution` permite que um provedor injete orientação de prompt do sistema sensível a cache para uma família de modelos. Prefira isso a `before_prompt_build` quando o comportamento pertencer a uma família específica de provedor/modelo e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte [Internals: Provider Runtime Hooks](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    Um Plugin de provedor pode registrar fala, transcrição em realtime, voz em realtime,
    entendimento de mídia, geração de imagem, geração de vídeo, busca na web
    e pesquisa na web junto com inferência de texto. O OpenClaw classifica isso como um
    Plugin de **hybrid-capability** — o padrão recomendado para Plugins corporativos
    (um Plugin por fornecedor). Consulte
    [Internals: Capability Ownership](/pt-BR/plugins/architecture#capability-ownership-model).

    Registre cada capacidade dentro de `register(api)` ao lado da sua chamada
    existente `api.registerProvider(...)`. Escolha apenas as abas de que precisar:

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
        os plugins compartilhem leituras limitadas do corpo de erro, análise de erros JSON e
        sufixos de ID da requisição.
      </Tab>
      <Tab title="Transcrição em tempo real">
        Prefira `createRealtimeTranscriptionWebSocketSession(...)` — o helper
        compartilhado lida com captura de proxy, backoff de reconexão, esvaziamento no fechamento, handshakes de prontidão,
        enfileiramento de áudio e diagnósticos de eventos de fechamento. Seu plugin
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
        `openclaw/plugin-sdk/provider-http`. O helper normaliza
        nomes de arquivo de upload, incluindo uploads AAC que precisam de um nome de arquivo no estilo M4A para
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
      <Tab title="Entendimento de mídia">
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
        Os recursos de vídeo usam uma forma **orientada a modo**: `generate`,
        `imageToVideo` e `videoToVideo`. Campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` não são
        suficientes para anunciar suporte a modos de transformação ou modos desativados de forma limpa.
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

## Publicar no ClawHub

Plugins de provider publicam da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas para skill; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata de openclaw.providers
├── openclaw.plugin.json      # Manifest com metadata de autenticação do provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
providers integrados:

| Ordem     | Quando        | Caso de uso                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primeira fase | Providers simples com chave de API              |
| `profile` | Após simple   | Providers controlados por perfis de autenticação |
| `paired`  | Após profile  | Sintetizar múltiplas entradas relacionadas      |
| `late`    | Última fase   | Sobrescrever providers existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se o seu plugin também fornece um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, search, subagent)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Internals do Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks) — detalhes dos hooks e exemplos integrados

## Relacionado

- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
