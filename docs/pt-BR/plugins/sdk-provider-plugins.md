---
read_when:
    - Você está criando um novo Plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou uma LLM personalizada ao OpenClaw
    - Você precisa entender autenticação de provedor, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um Plugin de provedor de modelo para o OpenClaw
title: Criando Plugins de provedor
x-i18n:
    generated_at: "2026-04-22T04:25:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Criando Plugins de provedor

Este guia apresenta o processo de criação de um Plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para entender a estrutura básica
  do pacote e a configuração do manifesto.
</Info>

<Tip>
  Plugins de provedor adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por um daemon nativo de agente que controla threads,
  Compaction ou eventos de ferramenta, combine o provedor com um [agent harness](/pt-BR/plugins/sdk-agent-harness)
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
          "choiceLabel": "Chave de API do Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chave de API do Acme AI"
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
    é opcional e permite que o OpenClaw carregue automaticamente seu Plugin de provedor a partir de IDs
    abreviados de modelo, como `acme-large`, antes que os hooks de runtime existam. Se você publicar o
    provedor no ClawHub, os campos `openclaw.compat` e `openclaw.build`
    são obrigatórios em `package.json`.

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

    Esse é um provedor funcional. Agora os usuários podem
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

    `input` reescreve o prompt de sistema final e o conteúdo da mensagem de texto antes
    do transporte. `output` reescreve deltas de texto do assistente e o texto final antes que o
    OpenClaw analise seus próprios marcadores de controle ou a entrega ao canal.

    Para provedores bundled que registram apenas um provedor de texto com autenticação por
    chave de API e um único runtime baseado em catálogo, prefira o helper mais restrito
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

    `buildProvider` é o caminho de catálogo ativo usado quando o OpenClaw consegue resolver a autenticação real
    do provedor. Ele pode executar descoberta específica do provedor. Use
    `buildStaticProvider` apenas para linhas offline seguras de exibir antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer solicitações de rede.
    A visualização atual de `models list --all` do OpenClaw executa catálogos estáticos
    apenas para plugins de provedor bundled, com configuração vazia, env vazio e sem
    caminhos de agente/workspace.

    Se o seu fluxo de autenticação também precisar aplicar patch em `models.providers.*`,
    aliases e no modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais restritos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferecer suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por ID
    de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades
    do endpoint, então endpoints nativos no estilo Moonshot/DashScope ainda
    participam mesmo quando um Plugin está usando um ID de provedor personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelos">
    Se o seu provedor aceitar IDs arbitrários de modelo (como um proxy ou roteador),
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
    aquecimento assíncrono — `resolveDynamicModel` é executado novamente depois que ele termina.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos provedores só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    de forma incremental, conforme o seu provedor exigir.

    Builders helper compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade de ferramentas,
    então normalmente os plugins não precisam mais conectar manualmente cada hook um a um:

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

    | Família | O que ela conecta |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo sanitização de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes de mensagem Anthropic recebam limpeza específica de blocos de reflexão do Claude apenas quando o modelo resolvido for realmente um ID Claude |
    | `google-gemini` | Política nativa de replay Gemini mais sanitização de replay de bootstrap e modo de saída de raciocínio com tags |
    | `passthrough-gemini` | Sanitização de assinatura de reflexão Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita validação nativa de replay Gemini nem reescritas de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagem Anthropic e compatíveis com OpenAI em um único Plugin; a remoção opcional de blocos de reflexão somente Claude permanece limitada ao lado Anthropic |

    Exemplos reais bundled:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta |
    | --- | --- |
    | `google-thinking` | Normalização da carga de reflexão do Gemini no caminho de stream compartilhado |
    | `kilocode-thinking` | Wrapper de raciocínio Kilo no caminho de stream proxy compartilhado, com `kilo/auto` e IDs de raciocínio de proxy sem suporte ignorando reflexão injetada |
    | `moonshot-thinking` | Mapeamento binário nativo de carga de native-thinking do Moonshot a partir da configuração + nível de `/think` |
    | `minimax-fast-mode` | Reescrita de modelo no fast-mode do MiniMax no caminho de stream compartilhado |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de OpenAI/Codex Responses: headers de atribuição, `/fast`/`serviceTier`, verbosidade de texto, busca nativa na web do Codex, modelagem de carga compatível com raciocínio e gerenciamento de contexto de Responses |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas proxy, com ignorar centralizado de modelo sem suporte/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` habilitado por padrão para provedores como Z.AI que querem streaming de ferramentas, a menos que seja explicitamente desabilitado |

    Exemplos reais bundled:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum da
    família de replay mais os helpers compartilhados a partir dos quais essas famílias são construídas. Exportações públicas comuns
    incluem:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders compartilhados de replay, como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de replay do Gemini, como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo, como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o builder de família quanto
    os helpers wrapper públicos reutilizados por essas famílias. Exportações públicas comuns
    incluem:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados de OpenAI/Codex, como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provedor, como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream continuam locais ao provedor de propósito. Exemplo
    bundled atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    builders de wrapper Anthropic de nível mais baixo a partir de sua interface pública `api.ts` /
    `contract-api.ts`. Esses helpers continuam específicos do Anthropic porque
    também codificam o tratamento beta de OAuth do Claude e o controle `context1m`.

    Outros provedores bundled também mantêm wrappers específicos de transporte localmente quando
    o comportamento não é compartilhado de forma limpa entre famílias. Exemplo atual: o
    Plugin bundled do xAI mantém a modelagem nativa de Responses do xAI em seu próprio
    `wrapStreamFn`, incluindo reescritas de alias de `/fast`, `tool_stream` padrão,
    limpeza de strict-tool sem suporte e remoção de carga de raciocínio
    específica do xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada
    de schema de ferramenta mais helpers compartilhados de schema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário compartilhado de famílias.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta limpeza de schema Gemini
      + diagnósticos para provedores que precisam de schemas de ferramenta seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de schema Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade bundled do xAI:
      `toolSchemaProfile: "xai"`, palavras-chave de schema sem suporte, suporte nativo a
      `web_search` e decodificação de argumentos de chamada de ferramenta com entidade HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade do xAI a um
      modelo resolvido antes que ele chegue ao executor.

    Exemplo real bundled: o Plugin do xAI usa `normalizeResolvedModel` mais
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade pertencentes ao
    provedor em vez de codificar regras de xAI no core.

    O mesmo padrão de raiz de pacote também sustenta outros provedores bundled:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
      helpers de modelo padrão e builders de provedor em tempo real
    - `@openclaw/openrouter-provider`: `api.ts` exporta o builder de provedor
      mais helpers de onboarding/configuração

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
      <Tab title="Headers personalizados">
        Para provedores que precisam de headers de solicitação personalizados ou modificações no corpo:

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
      <Tab title="Identidade nativa de transporte">
        Para provedores que precisam de headers ou metadados nativos de solicitação/sessão em
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
      O OpenClaw chama os hooks nesta ordem. A maioria dos provedores usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de base URL |
      | 2 | `applyConfigDefaults` | Padrões globais pertencentes ao provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de alias de ID de modelo legado/preview antes do lookup |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família de provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso de streaming nativo para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de env pertencente ao provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou respaldada por configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado atrás de autenticação por env/config |
      | 10 | `resolveDynamicModel` | Aceitar IDs arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do executor |

      Observações sobre fallback de runtime:

    - `normalizeConfig` verifica primeiro o provedor correspondente e, depois,
      outros plugins de provedor compatíveis com hook até que um deles realmente altere a configuração.
      Se nenhum hook de provedor reescrever uma entrada compatível com a família Google,
      o normalizador de configuração Google bundled ainda será aplicado.
    - `resolveConfigApiKey` usa o hook do provedor quando exposto. O caminho bundled
      `amazon-bedrock` também tem aqui um resolvedor embutido de marcador de env da AWS,
      embora a autenticação de runtime do Bedrock ainda use a cadeia padrão
      do SDK da AWS.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível |
      | 14 | `capabilities` | Conjunto estático legado de capacidades; somente compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta pertencente ao provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta pertencentes ao provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tags versus nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de solicitação |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de headers/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Headers/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Headers de sessão WS nativa/período de resfriamento |
      | 23 | `formatApiKey` | Formato personalizado de token em runtime |
      | 24 | `refreshOAuth` | Atualização personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação de reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow pertencente ao provedor |
      | 27 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga pertencente ao provedor |
      | 28 | `isCacheTtlEligible` | Controle de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade de reflexão binária ligada/desligada |
      | 34 | `supportsXHighThinking` | Compatibilidade de suporte a raciocínio `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade de política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Análise personalizada de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embedding pertencente ao provedor para memória/busca |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcrição |
      | 42 | `sanitizeReplayHistory` | Reescritas específicas do provedor para replay após a limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do executor embutido |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observação sobre ajuste de prompt:

      - `resolveSystemPromptContribution` permite que um provedor injete
        orientação de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira isso a
        `before_prompt_build` quando o comportamento pertencer a uma família específica de provedor/modelo
        e precisar preservar a divisão estável/dinâmica de cache.

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internos: Hooks de runtime de provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicione capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um Plugin de provedor pode registrar fala, transcrição em tempo real, voz em
    tempo real, compreensão de mídia, geração de imagem, geração de vídeo, web-fetch
    e busca na web junto com inferência de texto:

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
    }
    ```

    O OpenClaw classifica isso como um Plugin de **capacidade híbrida**. Esse é o
    padrão recomendado para plugins de empresa (um Plugin por fornecedor). Consulte
    [Internos: Propriedade de capacidades](/pt-BR/plugins/architecture#capability-ownership-model).

    Para geração de vídeo, prefira o formato de capacidade com reconhecimento de modo mostrado acima:
    `generate`, `imageToVideo` e `videoToVideo`. Campos agregados planos como
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` não são
    suficientes para anunciar suporte a modo de transformação ou modos desabilitados de forma limpa.

    Provedores de geração de música devem seguir o mesmo padrão:
    `generate` para geração apenas por prompt e `edit` para geração baseada em
    imagem de referência. Campos agregados planos como `maxInputImages`,
    `supportsLyrics` e `supportsFormat` não são suficientes para anunciar suporte a
    edição; blocos explícitos `generate` / `edit` são o contrato esperado.

  </Step>

  <Step title="Teste">
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

Plugins de provedor são publicados da mesma forma que qualquer outro Plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação somente para skill; pacotes de Plugin devem usar
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
provedores integrados:

| Ordem     | Quando         | Caso de uso                                     |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Primeira passagem | Provedores simples com chave de API          |
| `profile` | Após `simple`  | Provedores controlados por perfis de autenticação |
| `paired`  | Após `profile` | Sintetizar múltiplas entradas relacionadas     |
| `late`    | Última passagem | Substituir provedores existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se seu Plugin também fornecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, busca, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação de subcaminhos
- [Internos de Plugin](/pt-BR/plugins/architecture#provider-runtime-hooks) — detalhes de hooks e exemplos bundled
