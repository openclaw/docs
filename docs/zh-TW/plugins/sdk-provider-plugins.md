---
read_when:
    - 你正在建立新的模型提供者 Plugin
    - 你想要將 OpenAI 相容代理或自訂 LLM 加入 OpenClaw
    - 你需要了解提供者身份驗證、目錄和執行階段鉤子
sidebarTitle: Provider plugins
summary: 建置 OpenClaw 模型提供者 Plugin 的逐步指南
title: 建置提供者 Plugin
x-i18n:
    generated_at: "2026-05-06T02:54:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56e29767710ee2e027830787aa5671a31cb161c027284561fe25e1c07c34ae9
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南逐步說明如何建置一個 provider Plugin，將模型供應商
（LLM）新增到 OpenClaw。完成後，你將擁有一個具備模型目錄、
API key 驗證，以及動態模型解析的 provider。

<Info>
  如果你之前尚未建置過任何 OpenClaw Plugin，請先閱讀
  [快速開始](/zh-TW/plugins/building-plugins)，了解基本的套件
  結構與 manifest 設定。
</Info>

<Tip>
  Provider Plugin 會將模型加入 OpenClaw 的一般推論迴圈。如果模型
  必須透過擁有 threads、Compaction 或工具事件的原生代理程式 daemon
  執行，請將 provider 搭配 [agent harness](/zh-TW/plugins/sdk-agent-harness)
  使用，而不是把 daemon protocol 細節放進 core。
</Tip>

## 逐步指南

<Steps>
  <Step title="Package and manifest">
    ### 步驟 1：套件與 manifest

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

    manifest 宣告 `providerAuthEnvVars`，讓 OpenClaw 能在不載入你的
    Plugin runtime 的情況下偵測 credentials。當某個 provider 變體應該重用另一個
    provider id 的 auth 時，請加入 `providerAuthAliases`。`modelSupport`
    是選用項目，會讓 OpenClaw 在 runtime hooks 存在之前，就能從像
    `acme-large` 這樣的簡寫 model id 自動載入你的 provider Plugin。如果你在
    ClawHub 上發布這個 provider，`package.json` 中必須包含那些
    `openclaw.compat` 與 `openclaw.build` 欄位。

  </Step>

  <Step title="Register the provider">
    最小可用的 provider 需要 `id`、`label`、`auth` 與 `catalog`：

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

    這就是可運作的 provider。使用者現在可以
    `openclaw onboard --acme-ai-api-key <key>`，並選擇
    `acme-ai/acme-large` 作為他們的模型。

    如果上游 provider 使用與 OpenClaw 不同的控制 token，請加入一個
    小型雙向文字轉換，而不是替換 stream path：

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

    `input` 會在傳輸前重寫最終 system prompt 與文字訊息內容。
    `output` 會在 OpenClaw 解析自己的控制標記或 channel delivery 之前，
    重寫 assistant 文字 delta 與最終文字。

    對於只註冊一個具備 API-key auth 的文字 provider，加上單一以目錄為基礎的
    runtime 的 bundled provider，請優先使用更窄的
    `defineSingleProviderPluginEntry(...)` helper：

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

    `buildProvider` 是 OpenClaw 能解析真實 provider auth 時使用的 live catalog path。
    它可以執行 provider 專屬的 discovery。只有在離線列可安全地於設定 auth 前顯示時，
    才使用 `buildStaticProvider`；它不得要求 credentials 或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會對 bundled provider Plugin
    執行 static catalogs，且使用空 config、空 env，並且沒有 agent/workspace paths。

    如果你的 auth flow 也需要在 onboarding 期間修補 `models.providers.*`、
    aliases，以及 agent default model，請使用
    `openclaw/plugin-sdk/provider-onboard` 提供的 preset helpers。範圍最窄的 helpers 是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 與
    `createModelCatalogPresetAppliers(...)`。

    當 provider 的原生 endpoint 在一般 `openai-completions` transport 上支援
    streamed usage blocks 時，請優先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共用 catalog helpers，而不是硬編碼
    provider-id checks。`supportsNativeStreamingUsageCompat(...)` 與
    `applyProviderNativeStreamingUsageCompat(...)` 會從 endpoint capability map 偵測支援，
    因此即使 Plugin 使用自訂 provider id，原生 Moonshot/DashScope 風格的 endpoints
    仍會選擇啟用。

  </Step>

  <Step title="Add dynamic model resolution">
    如果你的 provider 接受任意 model ID（例如 proxy 或 router），
    請加入 `resolveDynamicModel`：

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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行 async
    warm-up — 完成後 `resolveDynamicModel` 會再次執行。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多數 provider 只需要 `catalog` + `resolveDynamicModel`。請依照
    provider 需求逐步加入 hooks。

    共用 helper builders 現在涵蓋最常見的 replay/tool-compat
    系列，因此 Plugin 通常不需要逐一手動接線每個 hook：

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

    目前可用的 replay families：

    | 系列 | 它接入的內容 | Bundled 範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI-compatible transports 的共用 OpenAI 風格 replay policy，包含 tool-call-id sanitation、assistant-first ordering fixes，以及 transport 需要時的 generic Gemini-turn validation | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude-aware replay policy，因此 Anthropic-message transports 只有在解析出的模型實際上是 Claude id 時，才會取得 Claude 專屬的 thinking-block cleanup | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini replay policy，加上 bootstrap replay sanitation 與 tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 針對透過 OpenAI-compatible proxy transports 執行的 Gemini 模型進行 Gemini thought-signature sanitation；不會啟用原生 Gemini replay validation 或 bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在同一 Plugin 中混合 Anthropic-message 與 OpenAI-compatible model surfaces 的 providers 的 hybrid policy；選用的 Claude-only thinking-block dropping 會維持限定在 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共享串流路徑上的 Gemini 思考 payload 正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享 proxy 串流路徑上的 Kilo 推理包裝器，並讓 `kilo/auto` 和不支援的 proxy 推理 ID 跳過注入的思考內容 | `kilocode` |
    | `moonshot-thinking` | 從 config + `/think` 等級對應 Moonshot 二進位原生思考 payload | `moonshot` |
    | `minimax-fast-mode` | 共享串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容 payload 形塑，以及 Responses context 管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | proxy 路由的 OpenRouter 推理包裝器，集中處理不支援模型/`auto` 的略過邏輯 | `openrouter` |
    | `tool-stream-default-on` | 給 Z.AI 這類預設需要工具串流、除非明確停用的 provider 使用的預設開啟 `tool_stream` 包裝器 | `zai` |

    <Accordion title="支援系列建構器的 SDK seam">
      每個系列建構器都由同一個套件匯出的較低層級 public helper 組成；當 provider 需要脫離通用模式時，你可以使用這些 helper：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始 replay 建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也匯出 Gemini replay helper（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和 endpoint/model helper（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，加上共享的 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考 prefill 清理（`createAnthropicThinkingPrefillPayloadWrapper`），以及共享的 proxy/provider 包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底層 Gemini schema helper（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 相容 helper（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。內建的 xAI Plugin 會搭配這些使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，讓 xAI 規則由 provider 自行擁有。

      有些串流 helper 會刻意保留在 provider 本地。`@openclaw/anthropic-provider` 將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低層級的 Anthropic 包裝器建構器保留在自己的 public `api.ts` / `contract-api.ts` seam 中，因為它們會編碼 Claude OAuth beta 處理和 `context1m` gating。xAI Plugin 同樣會把原生 xAI Responses 形塑保留在自己的 `wrapStreamFn`（`/fast` alias、預設 `tool_stream`、不支援的 strict-tool 清理、xAI 特定推理 payload 移除）中。

      同樣的套件根目錄模式也支援 `@openclaw/openai-provider`（provider 建構器、預設模型 helper、realtime provider 建構器）和 `@openclaw/openrouter-provider`（provider 建構器加上 onboarding/config helper）。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        針對每次 inference 呼叫前都需要 token exchange 的 provider：

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
      <Tab title="自訂標頭">
        針對需要自訂 request header 或 body 修改的 provider：

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
      <Tab title="原生傳輸身分">
        針對需要在 generic HTTP 或 WebSocket transport 上加入原生 request/session header 或 metadata 的 provider：

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
      <Tab title="使用量與計費">
        針對會公開使用量/計費資料的 provider：

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

    <Accordion title="所有可用的 provider hook">
      OpenClaw 會依照以下順序呼叫 hook。大多數 provider 只會使用 2 到 3 個：
      OpenClaw 不再呼叫的僅供相容 provider 欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列於此處。

      | # | Hook | 使用時機 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型 catalog 或 base URL 預設值 |
      | 2 | `applyConfigDefaults` | config materialization 期間 provider 擁有的全域預設值 |
      | 3 | `normalizeModelId` | lookup 前清理 legacy/preview model-id alias |
      | 4 | `normalizeTransport` | generic model assembly 前清理 provider-family `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 正規化 `models.providers.<id>` config |
      | 6 | `applyNativeStreamingUsageCompat` | config provider 的原生 streaming-usage 相容重寫 |
      | 7 | `resolveConfigApiKey` | provider 擁有的 env-marker auth 解析 |
      | 8 | `resolveSyntheticAuth` | 本機/self-hosted 或 config-backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | 將 synthetic stored-profile placeholder 降到 env/config auth 之後 |
      | 10 | `resolveDynamicModel` | 接受任意 upstream model ID |
      | 11 | `prepareDynamicModel` | 解析前進行 async metadata fetch |
      | 12 | `normalizeResolvedModel` | runner 前的 transport 重寫 |
      | 13 | `contributeResolvedModelCompat` | 另一個 compatible transport 後方 vendor model 的 compat flag |
      | 14 | `normalizeToolSchemas` | 註冊前由 provider 擁有的 tool-schema 清理 |
      | 15 | `inspectToolSchemas` | 由 provider 擁有的 tool-schema diagnostics |
      | 16 | `resolveReasoningOutputMode` | tagged vs native reasoning-output contract |
      | 17 | `prepareExtraParams` | 預設 request params |
      | 18 | `createStreamFn` | 完全自訂的 StreamFn transport |
      | 19 | `wrapStreamFn` | 一般串流路徑上的自訂 header/body 包裝器 |
      | 20 | `resolveTransportTurnState` | 原生 per-turn header/metadata |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS session header/cool-down |
      | 22 | `formatApiKey` | 自訂 runtime token shape |
      | 23 | `refreshOAuth` | 自訂 OAuth refresh |
      | 24 | `buildAuthDoctorHint` | auth 修復指引 |
      | 25 | `matchesContextOverflowError` | provider 擁有的 overflow 偵測 |
      | 26 | `classifyFailoverReason` | provider 擁有的 rate-limit/overload 分類 |
      | 27 | `isCacheTtlEligible` | prompt cache TTL gating |
      | 28 | `buildMissingAuthMessage` | 自訂 missing-auth 提示 |
      | 29 | `augmentModelCatalog` | synthetic forward-compat row |
      | 30 | `resolveThinkingProfile` | model-specific `/think` option set |
      | 31 | `isBinaryThinking` | binary thinking on/off 相容性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning support 相容性 |
      | 33 | `resolveDefaultThinkingLevel` | 預設 `/think` policy 相容性 |
      | 34 | `isModernModelRef` | live/smoke model matching |
      | 35 | `prepareRuntimeAuth` | inference 前的 token exchange |
      | 36 | `resolveUsageAuth` | 自訂 usage credential parsing |
      | 37 | `fetchUsageSnapshot` | 自訂 usage endpoint |
      | 38 | `createEmbeddingProvider` | provider 擁有、供 memory/search 使用的 embedding adapter |
      | 39 | `buildReplayPolicy` | 自訂 transcript replay/compaction policy |
      | 40 | `sanitizeReplayHistory` | generic cleanup 後的 provider-specific replay 重寫 |
      | 41 | `validateReplayTurns` | embedded runner 前的嚴格 replay-turn 驗證 |
      | 42 | `onModelSelected` | 選取後 callback（例如 telemetry） |

      Runtime fallback 備註：

      - `normalizeConfig` 會先檢查 matched provider，接著檢查其他支援 hook 的 provider Plugin，直到有一個實際變更 config 為止。如果沒有任何 provider hook 重寫支援的 Google-family config entry，內建的 Google config normalizer 仍會套用。
      - `resolveConfigApiKey` 會在公開時使用 provider hook。內建的 `amazon-bedrock` 路徑也在此處有 built-in AWS env-marker resolver，即使 Bedrock runtime auth 本身仍使用 AWS SDK default chain。
      - `resolveSystemPromptContribution` 讓 provider 為某個 model family 注入 cache-aware system-prompt 指引。當行為屬於單一 provider/model family 且應保留 stable/dynamic cache split 時，請優先使用它，而不是 `before_prompt_build`。

      如需詳細說明和實際範例，請參閱 [內部機制：Provider Runtime Hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="新增額外能力（選用）">
    ### 步驟 5：新增額外能力

    provider Plugin 可以在 text inference 之外，同時註冊 speech、realtime transcription、realtime
    voice、media understanding、image generation、video generation、web fetch
    和 web search。OpenClaw 將這歸類為
    **hybrid-capability** Plugin，也就是公司 Plugin 的建議模式
    （每個 vendor 一個 Plugin）。請參閱
    [內部機制：Capability Ownership](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，於既有的
    `api.registerProvider(...)` 呼叫旁註冊每項 capability。只選擇你需要的 tab：

    <Tabs>
      <Tab title="Speech (TTS)">
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

        針對提供者 HTTP 失敗，請使用 `assertOkOrThrowProviderError(...)`，讓
        plugins 共用有上限的錯誤本文讀取、JSON 錯誤剖析，以及
        請求 ID 後綴。
      </Tab>
      <Tab title="Realtime transcription">
        優先使用 `createRealtimeTranscriptionWebSocketSession(...)` — 這個共用
        輔助工具會處理代理擷取、重新連線退避、關閉時清空、ready
        握手、音訊佇列，以及關閉事件診斷。你的 plugin
        只需對應上游事件。

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

        以 POST multipart 音訊的批次 STT 提供者，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。這個輔助工具會正規化上傳
        檔名，包括需要 M4A 風格檔名才能相容於轉錄 API 的 AAC 上傳。
      </Tab>
      <Tab title="Realtime voice">
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

        宣告 `capabilities`，讓 `talk.catalog` 能向瀏覽器與原生 Talk
        用戶端公開有效模式、傳輸、音訊格式與功能旗標。當某個傳輸能偵測到
        人類正在打斷助理播放，且提供者支援截斷或清除作用中的音訊回應時，
        請實作 `handleBargeIn`。
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        影片能力使用**模式感知**的形狀：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，
        不足以清楚宣告轉換模式支援或已停用的模式。
        音樂生成也遵循相同模式，使用明確的 `generate` /
        `edit` 區塊。

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
      <Tab title="Web fetch and search">
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

  <Step title="Test">
    ### 步驟 6：測試

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

## 發佈到 ClawHub

提供者 plugins 的發佈方式與任何其他外部程式碼 plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

請勿在此使用舊版的僅限 skill 發佈別名；plugin 套件應使用
`clawhub package publish`。

## 檔案結構

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Catalog 順序參考

`catalog.order` 控制你的 catalog 相對於內建
提供者的合併時機：

| 順序      | 時機          | 使用情境                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API key 提供者                             |
| `profile` | 在 simple 後  | 受 auth profiles 管制的提供者                   |
| `paired`  | 在 profile 後 | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫既有提供者（衝突時勝出）                    |

## 下一步

- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) — 如果你的 plugin 也提供 channel
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) — `api.runtime` 輔助工具（TTS、搜尋、subagent）
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [Plugin 內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) — hook 細節與 bundled 範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [建置 channel plugins](/zh-TW/plugins/sdk-channel-plugins)
