---
read_when:
    - 你正在建置新的模型提供者 Plugin
    - 你想要將與 OpenAI 相容的代理或自訂 LLM 新增至 OpenClaw
    - 你需要了解供應商驗證、目錄與執行階段 hooks
sidebarTitle: Provider plugins
summary: 建置 OpenClaw 模型提供者 Plugin 的逐步指南
title: 建置提供者 Plugin
x-i18n:
    generated_at: "2026-05-02T02:57:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南逐步說明如何建立一個提供者 Plugin，為 OpenClaw 新增模型提供者
(LLM)。完成後，你會得到一個具備模型目錄、API 金鑰驗證，以及動態模型解析的提供者。

<Info>
  如果你以前沒有建立過任何 OpenClaw Plugin，請先閱讀
  [開始使用](/zh-TW/plugins/building-plugins)，了解基本套件
  結構與 manifest 設定。
</Info>

<Tip>
  提供者 Plugin 會將模型加入 OpenClaw 的一般推論迴圈。如果模型
  必須透過擁有執行緒、Compaction 或工具事件的原生代理常駐程式執行，
  請將提供者搭配[代理 harness](/zh-TW/plugins/sdk-agent-harness)，
  而不是把常駐程式通訊協定細節放進核心。
</Tip>

## 逐步教學

<Steps>
  <Step title="套件與 manifest">
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

    manifest 會宣告 `providerAuthEnvVars`，讓 OpenClaw 可以在不載入你的 Plugin 執行階段時偵測
    憑證。當某個提供者變體應重用另一個提供者 id 的驗證時，請加入 `providerAuthAliases`。
    `modelSupport`
    是選用項，可讓 OpenClaw 在執行階段 hook 存在前，從像
    `acme-large` 這類簡寫模型 id 自動載入你的提供者 Plugin。如果你在
    ClawHub 上發布此提供者，`package.json` 中必須包含那些 `openclaw.compat` 與 `openclaw.build` 欄位。

  </Step>

  <Step title="註冊提供者">
    最小提供者需要 `id`、`label`、`auth` 與 `catalog`：

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
    `acme-ai/acme-large` 作為其模型。

    如果上游提供者使用的控制權杖與 OpenClaw 不同，請加入一個
    小型雙向文字轉換，而不是替換串流路徑：

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

    `input` 會在傳輸前改寫最終系統提示與文字訊息內容。
    `output` 會在 OpenClaw 解析自己的控制標記或頻道遞送之前，改寫助理文字增量與最終文字。

    對於只註冊一個具備 API 金鑰驗證、且由單一目錄支援執行階段的文字提供者的內建提供者，
    請優先使用範圍較窄的
    `defineSingleProviderPluginEntry(...)` 輔助函式：

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
    提供者驗證時使用的即時目錄路徑。它可以執行提供者特定的探索。只有在驗證
    尚未設定前可安全顯示的離線列，才使用
    `buildStaticProvider`；它不得需要憑證或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會針對內建提供者 Plugin 執行靜態目錄，
    並使用空設定、空環境，且沒有代理或工作區路徑。

    如果你的驗證流程也需要在入門設定期間修補 `models.providers.*`、別名與
    代理預設模型，請使用
    `openclaw/plugin-sdk/provider-onboard` 的預設輔助函式。範圍最窄的輔助函式是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 與
    `createModelCatalogPresetAppliers(...)`。

    當提供者的原生端點在一般
    `openai-completions` 傳輸上支援串流使用量區塊時，請優先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助函式，而不是硬編碼
    提供者 id 檢查。`supportsNativeStreamingUsageCompat(...)` 與
    `applyProviderNativeStreamingUsageCompat(...)` 會從
    端點能力對應中偵測支援，因此原生 Moonshot/DashScope 風格端點即使使用自訂提供者 id 的 Plugin，
    仍會選擇加入。

  </Step>

  <Step title="加入動態模型解析">
    如果你的提供者接受任意模型 ID（例如代理或路由器），
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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步
    暖身，`resolveDynamicModel` 會在完成後再次執行。

  </Step>

  <Step title="加入執行階段 hook（視需要）">
    大多數提供者只需要 `catalog` + `resolveDynamicModel`。請隨著提供者需求逐步加入 hook。

    共用輔助建構器現在涵蓋最常見的重播與工具相容
    系列，因此 Plugin 通常不需要逐一手動接上每個 hook：

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

    目前可用的重播系列：

    | 系列 | 會接入的內容 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 相容傳輸的共用 OpenAI 風格重播政策，包含工具呼叫 id 清理、助理優先排序修正，以及傳輸需要時的通用 Gemini 回合驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude 感知重播政策，因此 Anthropic 訊息傳輸只有在解析後的模型實際上是 Claude id 時，才會取得 Claude 專用思考區塊清理 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini 重播政策，加上 bootstrap 重播清理與標記化推理輸出模式 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 透過 OpenAI 相容代理傳輸執行 Gemini 模型時的 Gemini 思考簽章清理；不啟用原生 Gemini 重播驗證或 bootstrap 改寫 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 供在單一 Plugin 中混合 Anthropic 訊息與 OpenAI 相容模型表面的提供者使用的混合政策；選用的僅 Claude 思考區塊丟棄會保持限定在 Anthropic 側 | `minimax` |

    目前可用的串流系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共享串流路徑上的 Gemini thinking payload 正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享代理串流路徑上的 Kilo reasoning wrapper，並針對 `kilo/auto` 和不支援的代理 reasoning id 略過注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 層級對應 Moonshot 二進位原生 thinking payload | `moonshot` |
    | `minimax-fast-mode` | 共享串流路徑上的 MiniMax fast-mode 模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses wrapper：歸因標頭、`/fast`/`serviceTier`、文字詳略程度、原生 Codex 網頁搜尋、reasoning 相容 payload shaping，以及 Responses context 管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 代理路由的 OpenRouter reasoning wrapper，集中處理不支援模型/`auto` 的略過情況 | `openrouter` |
    | `tool-stream-default-on` | 給 Z.AI 這類提供者使用的預設啟用 `tool_stream` wrapper，除非明確停用，否則會使用工具串流 | `zai` |

    <Accordion title="支援系列建構器的 SDK 接縫">
      每個系列建構器都由同一套套件匯出的較低階公開 helper 組成；當提供者需要偏離常見模式時，你可以使用這些 helper：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始 replay 建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也匯出 Gemini replay helper（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和 endpoint/model helper（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享的 OpenAI/Codex wrapper（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容 wrapper（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking prefill 清理（`createAnthropicThinkingPrefillPayloadWrapper`），以及共享的代理/提供者 wrapper（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底層 Gemini schema helper（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 相容 helper（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。內建的 xAI Plugin 會搭配使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，讓 xAI 規則由提供者擁有。

      有些串流 helper 會刻意保留在提供者本地。`@openclaw/anthropic-provider` 會在自己的公開 `api.ts` / `contract-api.ts` 接縫中保留 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階的 Anthropic wrapper 建構器，因為它們編碼了 Claude OAuth beta 處理和 `context1m` 閘控。xAI Plugin 也同樣將原生 xAI Responses shaping 保留在自己的 `wrapStreamFn` 中（`/fast` 別名、預設 `tool_stream`、不支援的 strict-tool 清理、xAI 專屬 reasoning-payload 移除）。

      相同的套件根目錄模式也支援 `@openclaw/openai-provider`（提供者建構器、預設模型 helper、即時提供者建構器）和 `@openclaw/openrouter-provider`（提供者建構器，以及 onboarding/config helper）。
    </Accordion>

    <Tabs>
      <Tab title="權杖交換">
        對於每次推論呼叫前都需要權杖交換的提供者：

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
        對於需要自訂請求標頭或修改 body 的提供者：

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
        對於需要在通用 HTTP 或 WebSocket 傳輸上使用原生請求/工作階段標頭或中繼資料的提供者：

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
      <Tab title="用量與計費">
        對於公開用量/計費資料的提供者：

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

    <Accordion title="所有可用的提供者 hook">
      OpenClaw 會依照此順序呼叫 hook。大多數提供者只會使用 2-3 個：
      OpenClaw 不再呼叫、僅用於相容性的提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，不會列在
      這裡。

      | # | Hook | 使用時機 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型型錄或基底 URL 預設值 |
      | 2 | `applyConfigDefaults` | 設定具體化期間由提供者擁有的全域預設值 |
      | 3 | `normalizeModelId` | 查找前清理舊版/預覽 model-id 別名 |
      | 4 | `normalizeTransport` | 泛用模型組裝前清理提供者系列 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定提供者的原生 streaming-usage 相容性重寫 |
      | 7 | `resolveConfigApiKey` | 由提供者擁有的 env-marker auth 解析 |
      | 8 | `resolveSyntheticAuth` | 本機/自託管或設定支援的合成 auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | 將合成儲存設定檔 placeholder 排到 env/config auth 後面 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | 12 | `normalizeResolvedModel` | Runner 前的傳輸重寫 |
      | 13 | `contributeResolvedModelCompat` | 另一個相容傳輸背後的供應商模型相容旗標 |
      | 14 | `normalizeToolSchemas` | 註冊前由提供者擁有的工具 schema 清理 |
      | 15 | `inspectToolSchemas` | 由提供者擁有的工具 schema 診斷 |
      | 16 | `resolveReasoningOutputMode` | 標記式與原生 reasoning-output 合約 |
      | 17 | `prepareExtraParams` | 預設請求參數 |
      | 18 | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | 19 | `wrapStreamFn` | 一般串流路徑上的自訂標頭/body wrapper |
      | 20 | `resolveTransportTurnState` | 原生每回合標頭/中繼資料 |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭/cool-down |
      | 22 | `formatApiKey` | 自訂執行階段權杖形狀 |
      | 23 | `refreshOAuth` | 自訂 OAuth refresh |
      | 24 | `buildAuthDoctorHint` | Auth 修復指引 |
      | 25 | `matchesContextOverflowError` | 由提供者擁有的 overflow 偵測 |
      | 26 | `classifyFailoverReason` | 由提供者擁有的 rate-limit/overload 分類 |
      | 27 | `isCacheTtlEligible` | Prompt cache TTL 閘控 |
      | 28 | `buildMissingAuthMessage` | 自訂缺少 auth 提示 |
      | 29 | `augmentModelCatalog` | 合成的 forward-compat 資料列 |
      | 30 | `resolveThinkingProfile` | 模型專屬 `/think` 選項集 |
      | 31 | `isBinaryThinking` | 二進位 thinking 開/關相容性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning 支援相容性 |
      | 33 | `resolveDefaultThinkingLevel` | 預設 `/think` policy 相容性 |
      | 34 | `isModernModelRef` | Live/smoke 模型比對 |
      | 35 | `prepareRuntimeAuth` | 推論前的權杖交換 |
      | 36 | `resolveUsageAuth` | 自訂用量憑證剖析 |
      | 37 | `fetchUsageSnapshot` | 自訂用量 endpoint |
      | 38 | `createEmbeddingProvider` | 由提供者擁有、供記憶體/搜尋使用的 embedding adapter |
      | 39 | `buildReplayPolicy` | 自訂 transcript replay/compaction policy |
      | 40 | `sanitizeReplayHistory` | 泛用清理後的提供者專屬 replay 重寫 |
      | 41 | `validateReplayTurns` | 內嵌 runner 前的嚴格 replay-turn 驗證 |
      | 42 | `onModelSelected` | 選取後 callback（例如 telemetry） |

      執行階段 fallback 注意事項：

      - `normalizeConfig` 會先檢查相符的提供者，接著檢查其他具備 hook 能力的提供者 Plugin，直到其中一個實際變更設定為止。如果沒有任何提供者 hook 重寫受支援的 Google 系列設定項目，內建的 Google 設定正規化器仍會套用。
      - `resolveConfigApiKey` 會在公開時使用提供者 hook。內建的 `amazon-bedrock` 路徑在這裡也有內建的 AWS env-marker resolver，即使 Bedrock 執行階段 auth 本身仍使用 AWS SDK 預設鏈。
      - `resolveSystemPromptContribution` 可讓提供者為模型系列注入具備 cache 感知能力的 system-prompt 指引。當行為屬於單一提供者/模型系列，且應保留穩定/動態 cache 分割時，請優先使用它，而不是 `before_prompt_build`。

      如需詳細描述與實務範例，請參閱[內部機制：提供者執行階段 Hook](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="新增額外能力（選用）">
    提供者 Plugin 可以在文字推論之外，同時註冊語音、即時轉錄、即時
    語音、媒體理解、影像生成、影片生成、網頁擷取、
    和網頁搜尋。OpenClaw 將這分類為
    **hybrid-capability** Plugin，也就是公司 Plugin 的建議模式
    （每個供應商一個 Plugin）。請參閱
    [內部機制：能力所有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    請在 `register(api)` 內，與現有的
    `api.registerProvider(...)` 呼叫一起註冊每項能力。只挑選你需要的分頁：

    <Tabs>
      <Tab title="語音 (TTS)">
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

        對供應商 HTTP 失敗使用 `assertOkOrThrowProviderError(...)`，讓
        plugins 共用受限的錯誤主體讀取、JSON 錯誤解析，以及
        請求 ID 後綴。
      </Tab>
      <Tab title="即時轉錄">
        偏好使用 `createRealtimeTranscriptionWebSocketSession(...)` —— 共用的
        輔助工具會處理代理擷取、重新連線退避、關閉時排清、就緒
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

        以 multipart 音訊 POST 的批次 STT 供應商，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助工具會正規化上傳
        檔名，包括需要 M4A 樣式檔名以相容轉錄 API 的 AAC 上傳。
      </Tab>
      <Tab title="即時語音">
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

        當傳輸層能偵測到真人正在打斷助理播放，且供應商支援截斷或
        清除作用中的音訊回應時，請實作 `handleBargeIn`。
      </Tab>
      <Tab title="媒體理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="影像與影片生成">
        影片功能使用**模式感知**的結構：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平的彙總欄位，
        不足以清楚宣告轉換模式支援或停用的模式。
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
      <Tab title="網頁擷取與搜尋">
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

  <Step title="測試">
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

供應商 plugins 的發佈方式與任何其他外部程式碼 plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

請勿在此使用舊版僅限 skill 的發佈別名；plugin 套件應使用
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

`catalog.order` 控制你的目錄相對於內建供應商合併的時機：

| 順序      | 時機          | 使用案例                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API 金鑰供應商                             |
| `profile` | 在 simple 後  | 受驗證設定檔限制的供應商                        |
| `paired`  | 在 profile 後 | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫既有供應商（發生衝突時勝出）                |

## 後續步驟

- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) — 如果你的 plugin 也提供頻道
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) — `api.runtime` 輔助工具（TTS、搜尋、子代理）
- [SDK Overview](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [Plugin Internals](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) — hook 詳細資訊與內建範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [建置頻道 plugins](/zh-TW/plugins/sdk-channel-plugins)
