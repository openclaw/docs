---
read_when:
    - Você está criando um novo plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender autenticação de provedor, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um plugin de provedor de modelo para o OpenClaw
title: Criando plugins de provedor
x-i18n:
    generated_at: "2026-04-11T02:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Criando plugins de provedor

Este guia mostra passo a passo como criar um plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelo.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw antes, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para entender a estrutura básica
  do pacote e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por meio de um daemon nativo de agente que controla threads, compactação ou
  eventos de ferramenta, combine o provedor com um [harness de agente](/pt-BR/plugins/sdk-agent-harness)
  em vez de colocar detalhes do protocolo do daemon no core.
</Tip>

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
    quando uma variante de provedor precisar reutilizar a autenticação de outro id de provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu plugin de provedor a partir de ids curtos
    de modelo como `acme-large` antes de existirem hooks de runtime. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios no `package.json`.

  </Step>

  <Step title="Registre o provedor">
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
              hint: "Chave de API do seu painel da Acme AI",
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

    Isso já é um provedor funcional. Os usuários agora podem executar
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

    `input` reescreve o prompt final de sistema e o conteúdo de texto da mensagem antes do
    transporte. `output` reescreve deltas de texto do assistente e o texto final antes que o
    OpenClaw analise seus próprios marcadores de controle ou faça a entrega ao canal.

    Para provedores empacotados que registram apenas um provedor de texto com autenticação
    por chave de API mais um único runtime baseado em catálogo, prefira o helper mais específico
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
            hint: "Chave de API do seu painel da Acme AI",
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
        },
      },
    });
    ```

    Se o seu fluxo de autenticação também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferece suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por id de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades do endpoint,
    para que endpoints nativos no estilo Moonshot/DashScope também façam opt-in, mesmo quando um plugin estiver usando um id de provedor personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelo">
    Se o seu provedor aceitar ids arbitrários de modelo (como um proxy ou roteador),
    adicione `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog de acima

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
    aquecimento assíncrono — `resolveDynamicModel` é executado novamente após a conclusão.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos provedores só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    gradualmente, à medida que seu provedor precisar deles.

    Os builders de helper compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade
    com ferramentas, então os plugins normalmente não precisam conectar cada hook manualmente:

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

    | Família | O que ela conecta |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes de mensagens da Anthropic recebam limpeza específica de blocos de raciocínio do Claude apenas quando o modelo resolvido for realmente um id Claude |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio com tag |
    | `passthrough-gemini` | Saneamento de assinatura de pensamento do Gemini para modelos Gemini executados por transportes de proxy compatíveis com OpenAI; não habilita validação nativa de replay do Gemini nem regravações de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens da Anthropic e compatíveis com OpenAI em um único plugin; a remoção opcional de blocos de raciocínio apenas do Claude continua restrita ao lado Anthropic |

    Exemplos empacotados reais:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis atualmente:

    | Família | O que ela conecta |
    | --- | --- |
    | `google-thinking` | Normalização de payload de raciocínio do Gemini no caminho de stream compartilhado |
    | `kilocode-thinking` | Wrapper de raciocínio do Kilo no caminho de stream de proxy compartilhado, com ids de raciocínio `kilo/auto` e de proxy sem suporte pulando o raciocínio injetado |
    | `moonshot-thinking` | Mapeamento de payload binário nativo de raciocínio do Moonshot a partir da configuração + nível de `/think` |
    | `minimax-fast-mode` | Regravação de modelo em modo rápido do MiniMax no caminho de stream compartilhado |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de Responses do OpenAI/Codex: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex, formatação de payload compatível com raciocínio e gerenciamento de contexto de Responses |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas de proxy, com pulos de modelos sem suporte/`auto` tratados centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramentas, a menos que seja desativado explicitamente |

    Exemplos empacotados reais:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum da família
    de replay, além dos helpers compartilhados a partir dos quais essas famílias são construídas. Exportações públicas comuns
    incluem:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders compartilhados de replay, como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Helpers de replay do Gemini, como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - Helpers de endpoint/modelo, como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o builder de família quanto
    os helpers públicos de wrapper que essas famílias reutilizam. Exportações públicas comuns
    incluem:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados do OpenAI/Codex, como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provedor, como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream permanecem locais ao provedor de propósito. Exemplo empacotado
    atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    builders de wrapper Anthropic de nível mais baixo por meio de seu seam público `api.ts` /
    `contract-api.ts`. Esses helpers continuam específicos da Anthropic porque
    também codificam o tratamento beta do Claude OAuth e o gating de `context1m`.

    Outros provedores empacotados também mantêm wrappers específicos de transporte localmente quando
    o comportamento não é compartilhado de forma limpa entre famílias. Exemplo atual: o
    plugin xAI empacotado mantém a formatação nativa de Responses do xAI em seu próprio
    `wrapStreamFn`, incluindo regravações de alias `/fast`, `tool_stream` padrão,
    limpeza de strict-tool sem suporte e remoção de payload de raciocínio
    específica do xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada
    de schema de ferramentas, além de helpers compartilhados de schema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário de famílias compartilhadas.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta a limpeza de schema do Gemini
      + diagnósticos para provedores que precisam de schemas de ferramentas seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de schema do Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade empacotado do xAI:
      `toolSchemaProfile: "xai"`, palavras-chave de schema sem suporte, suporte
      nativo a `web_search` e decodificação de argumentos de chamada de ferramenta com entidades HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade do xAI a um
      modelo resolvido antes de ele chegar ao runner.

    Exemplo empacotado real: o plugin xAI usa `normalizeResolvedModel` mais
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade sob responsabilidade do
    provedor em vez de codificar regras de xAI no core.

    O mesmo padrão de raiz de pacote também dá suporte a outros provedores empacotados:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
      helpers de modelo padrão e builders de provedor realtime
    - `@openclaw/openrouter-provider`: `api.ts` exporta o builder de provedor
      além de helpers de onboarding/configuração

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
        Para provedores que precisam de cabeçalhos personalizados de requisição ou modificações no body:

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
      <Tab title="Identidade nativa de transporte">
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
      O OpenClaw chama os hooks nesta ordem. A maioria dos provedores usa apenas 2 ou 3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de base URL |
      | 2 | `applyConfigDefaults` | Padrões globais de propriedade do provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de aliases legados/prévia de ids de modelo antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar a configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Regravações de compatibilidade de uso em streaming nativo para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de env de propriedade do provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado em favor de autenticação por env/configuração |
      | 10 | `resolveDynamicModel` | Aceitar ids arbitrários de modelos upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Regravações de transporte antes do runner |

    Observações sobre fallback de runtime:

    - `normalizeConfig` verifica primeiro o provedor correspondente e depois outros
      plugins de provedor com suporte a hooks até que um realmente altere a configuração.
      Se nenhum hook de provedor regravar uma entrada de configuração compatível com a família Google, o
      normalizador de configuração Google empacotado ainda será aplicado.
    - `resolveConfigApiKey` usa o hook do provedor quando exposto. O caminho empacotado de
      `amazon-bedrock` também tem aqui um resolvedor interno de marcador de env da AWS,
      mesmo que a autenticação de runtime do Bedrock ainda use a cadeia padrão do AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível |
      | 14 | `capabilities` | Bag estática legada de capacidades; somente compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramentas de propriedade do provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramentas de propriedade do provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tag vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers de cabeçalho/body personalizados no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativos / resfriamento |
      | 23 | `formatApiKey` | Formato personalizado de token de runtime |
      | 24 | `refreshOAuth` | Renovação personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow de contexto de propriedade do provedor |
      | 27 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga de propriedade do provedor |
      | 28 | `isCacheTtlEligible` | Gating de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream desatualizadas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `isBinaryThinking` | Raciocínio binário ligado/desligado |
      | 33 | `supportsXHighThinking` | Suporte a raciocínio `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Política padrão de `/think` |
      | 35 | `isModernModelRef` | Correspondência de modelo para live/smoke |
      | 36 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 37 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 38 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 39 | `createEmbeddingProvider` | Adaptador de embeddings de propriedade do provedor para memória/busca |
      | 40 | `buildReplayPolicy` | Política personalizada de replay/compactação da transcrição |
      | 41 | `sanitizeReplayHistory` | Regravações específicas do provedor no replay após a limpeza genérica |
      | 42 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner incorporado |
      | 43 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observação sobre ajuste de prompt:

      - `resolveSystemPromptContribution` permite que um provedor injete
        orientação de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira-o em vez de
        `before_prompt_build` quando o comportamento pertencer a uma família de provedor/modelo
        e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internals: Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um plugin de provedor pode registrar fala, transcrição em tempo real, voz em tempo real,
    compreensão de mídia, geração de imagem, geração de vídeo, web fetch
    e web search juntamente com a inferência de texto:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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
        describeImage: async (req) => ({ text: "Uma foto de..." }),
        transcribeAudio: async (req) => ({ text: "Transcrição..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* resultado de imagem */ }),
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
        hint: "Busque páginas por meio do backend de renderização da Acme.",
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

    O OpenClaw classifica isso como um plugin de **capacidade híbrida**. Esse é o
    padrão recomendado para plugins de empresa (um plugin por fornecedor). Consulte
    [Internals: Capability Ownership](/pt-BR/plugins/architecture#capability-ownership-model).

    Para geração de vídeo, prefira o formato de capacidades com reconhecimento de modo mostrado acima:
    `generate`, `imageToVideo` e `videoToVideo`. Campos agregados planos como
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` não
    são suficientes para anunciar suporte a modo de transformação ou modos desabilitados com clareza.

    Provedores de geração de música devem seguir o mesmo padrão:
    `generate` para geração somente por prompt e `edit` para geração baseada em imagem de referência.
    Campos agregados planos como `maxInputImages`,
    `supportsLyrics` e `supportsFormat` não são suficientes para anunciar suporte a edição;
    blocos explícitos `generate` / `edit` são o contrato esperado.

  </Step>

  <Step title="Teste">
    <a id="step-6-test"></a>
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

Plugins de provedor são publicados da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas para Skills; pacotes de plugin devem usar
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

## Referência da ordem do catálogo

`catalog.order` controla quando o seu catálogo é mesclado em relação aos
provedores integrados:

| Ordem     | Quando        | Caso de uso                                    |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Primeira passada | Provedores simples com chave de API         |
| `profile` | Após `simple` | Provedores condicionados a perfis de autenticação |
| `paired`  | Após `profile` | Sintetizar várias entradas relacionadas      |
| `late`    | Última passada | Substituir provedores existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se o seu plugin também fornecer um canal
- [Runtime do SDK](/pt-BR/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, busca, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subpath
- [Internals de plugins](/pt-BR/plugins/architecture#provider-runtime-hooks) — detalhes de hooks e exemplos empacotados
