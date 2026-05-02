---
read_when:
    - 你正在建置新的模型供應商 Plugin
    - 你想要為 OpenClaw 新增 OpenAI 相容代理或自訂大型語言模型
    - 你需要了解提供者身分驗證、目錄與執行階段掛鉤
sidebarTitle: Provider plugins
summary: 建構 OpenClaw 模型提供者 Plugin 的逐步指南
title: 建構提供者 Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南會逐步說明如何建置一個 provider Plugin，為 OpenClaw 新增模型提供者
(LLM)。完成後，你將擁有一個具備模型目錄、API 金鑰驗證，以及動態模型解析的提供者。

<Info>
  如果你以前沒有建置過任何 OpenClaw Plugin，請先閱讀
  [入門](/zh-TW/plugins/building-plugins)，了解基本的套件
  結構與 manifest 設定。
</Info>

<Tip>
  Provider Plugin 會將模型加入 OpenClaw 的一般推論迴圈。如果模型
  必須透過擁有 threads、Compaction 或工具
  事件的原生 agent daemon 執行，請將提供者搭配 [agent harness](/zh-TW/plugins/sdk-agent-harness)
  使用，而不是把 daemon 協定細節放進 core。
</Tip>

## 逐步指南

<Steps>
  <Step title="套件與 manifest">
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

    manifest 會宣告 `providerAuthEnvVars`，讓 OpenClaw 可以在不載入
    你的 Plugin runtime 的情況下偵測認證。當某個提供者變體應重用另一個提供者 id 的驗證時，加入 `providerAuthAliases`。
    `modelSupport` 是選用項目，可讓 OpenClaw 在 runtime hooks 存在之前，
    從像 `acme-large` 這樣的簡寫
    模型 id 自動載入你的 provider Plugin。如果你在 ClawHub 上發布
    提供者，`package.json` 中必須包含這些 `openclaw.compat` 與 `openclaw.build` 欄位。

  </Step>

  <Step title="註冊提供者">
    最小可用的提供者需要 `id`、`label`、`auth` 與 `catalog`：

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

    這就是一個可運作的提供者。使用者現在可以
    `openclaw onboard --acme-ai-api-key <key>`，並選擇
    `acme-ai/acme-large` 作為他們的模型。

    如果上游提供者使用的控制 token 與 OpenClaw 不同，請加入
    小型雙向文字轉換，而不是取代串流路徑：

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

    `input` 會在傳輸前改寫最終 system prompt 與文字訊息內容。
    `output` 會在 OpenClaw 解析自己的控制標記或 channel delivery 前，
    改寫 assistant 文字 delta 與最終文字。

    對於只註冊一個具備 API-key 驗證與單一目錄支援 runtime 的文字提供者的 bundled providers，
    請優先使用範圍較窄的
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

    `buildProvider` 是 OpenClaw 可以解析真實
    提供者驗證時使用的 live catalog 路徑。它可以執行特定提供者的探索。只有在離線列項目可在驗證
    設定前安全顯示時，才使用
    `buildStaticProvider`；它不得需要認證或發出網路請求。
    OpenClaw 目前的 `models list --all` 顯示只會針對 bundled provider plugins 執行 static catalogs，
    並使用空 config、空 env，且沒有
    agent/workspace 路徑。

    如果你的驗證流程也需要在 onboarding 期間修補 `models.providers.*`、aliases 與
    agent 預設模型，請使用
    `openclaw/plugin-sdk/provider-onboard` 中的 preset helpers。範圍最窄的 helpers 是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 與
    `createModelCatalogPresetAppliers(...)`。

    當提供者的原生端點在一般
    `openai-completions` 傳輸上支援 streamed usage blocks 時，請優先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享 catalog helpers，而不是硬編碼
    provider-id checks。`supportsNativeStreamingUsageCompat(...)` 與
    `applyProviderNativeStreamingUsageCompat(...)` 會從
    endpoint capability map 偵測支援，因此原生 Moonshot/DashScope 風格端點即使 Plugin 使用自訂提供者 id，
    仍然會選擇加入。

  </Step>

  <Step title="新增動態模型解析">
    如果你的提供者接受任意模型 ID（例如 proxy 或 router），
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
    warm-up — `resolveDynamicModel` 會在完成後再次執行。

  </Step>

  <Step title="視需要新增 runtime hooks">
    大多數提供者只需要 `catalog` + `resolveDynamicModel`。請依照你的提供者需求，逐步加入 hooks。

    共享 helper builders 現在涵蓋最常見的 replay/tool-compat
    系列，因此 Plugins 通常不需要逐一手動接線每個 hook：

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

    | 系列 | 它會接入的內容 | Bundled 範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI-compatible transports 的共享 OpenAI 風格 replay policy，包含 tool-call-id 清理、assistant-first ordering 修正，以及 transport 需要時的通用 Gemini-turn 驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude-aware replay policy，因此 Anthropic-message transports 只有在解析出的模型實際上是 Claude id 時，才會套用 Claude-specific thinking-block cleanup | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini replay policy，加上 bootstrap replay sanitation 與 tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 透過 OpenAI-compatible proxy transports 執行的 Gemini models 所用的 Gemini thought-signature sanitation；不啟用原生 Gemini replay validation 或 bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 用於在單一 Plugin 中混用 Anthropic-message 與 OpenAI-compatible model surfaces 的 hybrid policy；選用的 Claude-only thinking-block dropping 仍只限於 Anthropic 端 | `minimax` |

    現今可用的串流系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共用串流路徑上的 Gemini thinking 承載資料正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共用 Proxy 串流路徑上的 Kilo 推理包裝器，且 `kilo/auto` 與不支援的 Proxy 推理 ID 會略過注入式 thinking | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 等級對應 Moonshot 二進位原生 thinking 承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共用原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容承載資料塑形，以及 Responses 上下文管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy 路由的 OpenRouter 推理包裝器，集中處理不支援模型/`auto` 的略過邏輯 | `openrouter` |
    | `tool-stream-default-on` | 給 Z.AI 這類供應商使用的預設開啟 `tool_stream` 包裝器，除非明確停用，否則啟用工具串流 | `zai` |

    <Accordion title="支援系列建構器的 SDK 接縫">
      每個系列建構器都由同一套套件匯出的較低階公用輔助工具組成；當供應商需要偏離常見模式時，你可以直接使用這些工具：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也匯出 Gemini 重播輔助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端點/模型輔助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，加上共用 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking 預填清理（`createAnthropicThinkingPrefillPayloadWrapper`），以及共用 Proxy/供應商包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底層 Gemini 結構描述輔助工具（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 相容性輔助工具（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。內建 xAI Plugin 會搭配使用 `normalizeResolvedModel` + `contributeResolvedModelCompat` 與這些工具，讓 xAI 規則由供應商擁有。

      有些串流輔助工具刻意保留在供應商本地。`@openclaw/anthropic-provider` 會把 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階的 Anthropic 包裝器建構器保留在自己的公用 `api.ts` / `contract-api.ts` 接縫中，因為它們會編碼 Claude OAuth beta 處理與 `context1m` 閘控。xAI Plugin 也同樣把原生 xAI Responses 塑形保留在自己的 `wrapStreamFn` 中（`/fast` 別名、預設 `tool_stream`、不支援嚴格工具清理、xAI 專屬推理承載資料移除）。

      同樣的套件根目錄模式也支援 `@openclaw/openai-provider`（供應商建構器、預設模型輔助工具、即時供應商建構器）和 `@openclaw/openrouter-provider`（供應商建構器加上入門/設定輔助工具）。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        對於每次推理呼叫前都需要交換權杖的供應商：

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
        對於需要自訂請求標頭或修改本文的供應商：

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
        對於需要在通用 HTTP 或 WebSocket 傳輸上提供原生請求/工作階段標頭或中繼資料的供應商：

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
      <Tab title="Usage and billing">
        對於公開使用量/計費資料的供應商：

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

    <Accordion title="所有可用的供應商 Hook">
      OpenClaw 會依照以下順序呼叫 Hook。多數供應商只會使用 2-3 個：
      OpenClaw 已不再呼叫的僅相容性供應商欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列於此處。

      | # | Hook | 使用時機 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目錄或基礎 URL 預設值 |
      | 2 | `applyConfigDefaults` | 設定具體化期間由供應商擁有的全域預設值 |
      | 3 | `normalizeModelId` | 查找前清理舊版/預覽模型 ID 別名 |
      | 4 | `normalizeTransport` | 通用模型組裝前清理供應商系列 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定供應商的原生串流使用量相容性重寫 |
      | 7 | `resolveConfigApiKey` | 由供應商擁有的環境標記驗證解析 |
      | 8 | `resolveSyntheticAuth` | 本機/自架或設定支援的合成驗證 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 將合成的已儲存設定檔預留位置降到環境/設定驗證之後 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | 12 | `normalizeResolvedModel` | 執行器前的傳輸重寫 |
      | 13 | `contributeResolvedModelCompat` | 另一個相容傳輸背後供應商模型的相容性旗標 |
      | 14 | `normalizeToolSchemas` | 註冊前由供應商擁有的工具結構描述清理 |
      | 15 | `inspectToolSchemas` | 由供應商擁有的工具結構描述診斷 |
      | 16 | `resolveReasoningOutputMode` | 標記式與原生推理輸出合約 |
      | 17 | `prepareExtraParams` | 預設請求參數 |
      | 18 | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | 19 | `wrapStreamFn` | 一般串流路徑上的自訂標頭/本文包裝器 |
      | 20 | `resolveTransportTurnState` | 原生每回合標頭/中繼資料 |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭/冷卻 |
      | 22 | `formatApiKey` | 自訂執行階段權杖形狀 |
      | 23 | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | 24 | `buildAuthDoctorHint` | 驗證修復指引 |
      | 25 | `matchesContextOverflowError` | 由供應商擁有的溢位偵測 |
      | 26 | `classifyFailoverReason` | 由供應商擁有的速率限制/過載分類 |
      | 27 | `isCacheTtlEligible` | Prompt 快取 TTL 閘控 |
      | 28 | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | 29 | `augmentModelCatalog` | 合成前向相容列 |
      | 30 | `resolveThinkingProfile` | 模型專屬 `/think` 選項集 |
      | 31 | `isBinaryThinking` | 二進位 thinking 開/關相容性 |
      | 32 | `supportsXHighThinking` | `xhigh` 推理支援相容性 |
      | 33 | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性 |
      | 34 | `isModernModelRef` | 即時/煙霧測試模型比對 |
      | 35 | `prepareRuntimeAuth` | 推理前交換權杖 |
      | 36 | `resolveUsageAuth` | 自訂使用量憑證剖析 |
      | 37 | `fetchUsageSnapshot` | 自訂使用量端點 |
      | 38 | `createEmbeddingProvider` | 供記憶體/搜尋使用的供應商自有嵌入配接器 |
      | 39 | `buildReplayPolicy` | 自訂逐字稿重播/Compaction 政策 |
      | 40 | `sanitizeReplayHistory` | 通用清理後的供應商專屬重播重寫 |
      | 41 | `validateReplayTurns` | 嵌入式執行器前的嚴格重播回合驗證 |
      | 42 | `onModelSelected` | 選取後回呼（例如遙測） |

      執行階段備援注意事項：

      - `normalizeConfig` 會先檢查相符的供應商，接著檢查其他具備 Hook 能力的供應商 Plugin，直到其中一個實際變更設定為止。如果沒有供應商 Hook 重寫受支援的 Google 系列設定項目，仍會套用內建 Google 設定正規化器。
      - `resolveConfigApiKey` 會在公開時使用供應商 Hook。內建 `amazon-bedrock` 路徑在這裡也有內建 AWS 環境標記解析器，雖然 Bedrock 執行階段驗證本身仍使用 AWS SDK 預設鏈。
      - `resolveSystemPromptContribution` 可讓供應商為模型系列注入具快取感知能力的系統 Prompt 指引。當行為屬於單一供應商/模型系列，且應保留穩定/動態快取分割時，請優先使用它而不是 `before_prompt_build`。

      如需詳細描述與真實範例，請參閱[內部機制：供應商執行階段 Hook](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="新增額外能力（選用）">
    ### 步驟 5：新增額外能力

    供應商 Plugin 可以在文字推理之外，同時註冊語音、即時轉錄、即時
    語音、媒體理解、影像生成、影片生成、網頁擷取，
    以及網頁搜尋。OpenClaw 會將此分類為
    **混合能力** Plugin，這是公司 Plugin 的建議模式
    （每個供應商一個 Plugin）。請參閱
    [內部機制：能力擁有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，與既有的
    `api.registerProvider(...)` 呼叫一併註冊每項能力。只選擇你需要的分頁：

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

        針對提供者 HTTP 失敗使用 `assertOkOrThrowProviderError(...)`，如此
        Plugin 就能共用有上限的錯誤本文讀取、JSON 錯誤解析，以及
        request-id 後綴。
      </Tab>
      <Tab title="Realtime transcription">
        建議使用 `createRealtimeTranscriptionWebSocketSession(...)`，共用
        輔助程式會處理代理擷取、重新連線退避、關閉時清空、就緒
        交握、音訊佇列，以及關閉事件診斷。你的 Plugin
        只需要對應上游事件。

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

        會以 POST 傳送 multipart 音訊的批次 STT 提供者，應使用
        來自 `openclaw/plugin-sdk/provider-http` 的
        `buildAudioTranscriptionFormData(...)`。此輔助程式會標準化上傳
        檔名，包括需要 M4A 風格檔名才能相容轉錄 API 的 AAC 上傳。
      </Tab>
      <Tab title="Realtime voice">
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
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        當傳輸可以偵測到真人正在打斷助理播放，且提供者支援截斷或
        清除作用中的音訊回應時，請實作 `handleBargeIn`。
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
        影片能力使用**模式感知**形狀：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，
        不足以乾淨地公告轉換模式支援或停用的模式。
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

## 發布到 ClawHub

Provider Plugin 的發布方式與任何其他外部程式碼 Plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

請勿在此使用舊版僅限 skill 的發布別名；Plugin 套件應使用
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

## 目錄順序參考

`catalog.order` 控制你的目錄相對於內建
提供者的合併時機：

| 順序      | 時機          | 使用情境                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 單純 API 金鑰提供者                             |
| `profile` | simple 之後   | 受驗證設定檔限制的提供者                        |
| `paired`  | profile 之後  | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫現有提供者（衝突時勝出）                    |

## 後續步驟

- [Channel Plugin](/zh-TW/plugins/sdk-channel-plugins) — 如果你的 Plugin 也提供通道
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) — `api.runtime` 輔助程式（TTS、搜尋、子代理）
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [Plugin 內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) — hook 詳細資訊與內建範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [建置通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)
