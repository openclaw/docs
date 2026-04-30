---
read_when:
    - 你正在建立新的模型供應商 Plugin
    - 你想將與 OpenAI 相容的代理或自訂 LLM 新增至 OpenClaw
    - 您需要了解提供者身分驗證、目錄和執行階段掛鉤
sidebarTitle: Provider plugins
summary: 建構 OpenClaw 模型提供者 Plugin 的逐步指南
title: 建置供應商 Plugin
x-i18n:
    generated_at: "2026-04-30T03:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南逐步說明如何建置一個為 OpenClaw 新增模型提供者
（LLM）的 provider Plugin。完成後，你將擁有一個包含模型目錄、
API 金鑰驗證，以及動態模型解析的 provider。

<Info>
  如果你先前尚未建置過任何 OpenClaw Plugin，請先閱讀
  [開始使用](/zh-TW/plugins/building-plugins)，了解基本套件
  結構與 manifest 設定。
</Info>

<Tip>
  Provider Plugin 會將模型加入 OpenClaw 的一般推論迴圈。如果模型
  必須透過擁有執行緒、Compaction 或工具事件的原生代理常駐程式執行，
  請將 provider 搭配 [代理 harness](/zh-TW/plugins/sdk-agent-harness)，
  而不是把常駐程式協定細節放進 core。
</Tip>

## 逐步指南

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

    manifest 會宣告 `providerAuthEnvVars`，讓 OpenClaw 不必載入你的 Plugin runtime
    就能偵測憑證。當 provider 變體應重用另一個 provider id 的驗證時，請新增 `providerAuthAliases`。
    `modelSupport` 是選用項，可讓 OpenClaw 在 runtime hook 存在前，先從像
    `acme-large` 這類簡寫模型 id 自動載入你的 provider Plugin。如果你在
    ClawHub 發佈 provider，`package.json` 中必須包含這些 `openclaw.compat` 和
    `openclaw.build` 欄位。

  </Step>

  <Step title="註冊 provider">
    最小 provider 需要 `id`、`label`、`auth` 和 `catalog`：

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

    如果上游 provider 使用的控制 token 與 OpenClaw 不同，請新增一個
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

    `input` 會在傳輸前改寫最終系統提示和文字訊息內容。`output` 會在
    OpenClaw 解析自己的控制標記或通道投遞前，改寫助理文字 delta 和最終文字。

    對於只註冊一個使用 API 金鑰驗證、並具有單一 catalog-backed runtime 的文字 provider 的
    內建 provider，請優先使用較窄的
    `defineSingleProviderPluginEntry(...)` 輔助工具：

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

    `buildProvider` 是 OpenClaw 能解析真實 provider 驗證時使用的即時 catalog 路徑。
    它可以執行 provider 特定的探索。`buildStaticProvider` 僅用於在驗證設定前
    顯示仍安全的離線列；它不得要求憑證或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會針對內建 provider Plugin 執行 static catalog，
    且使用空 config、空 env，並且沒有代理/工作區路徑。

    如果你的驗證流程也需要在 onboarding 期間修補 `models.providers.*`、別名，以及
    代理預設模型，請使用
    `openclaw/plugin-sdk/provider-onboard` 中的 preset 輔助工具。最窄的輔助工具是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    當 provider 的原生 endpoint 在一般 `openai-completions` 傳輸上支援 streamed usage blocks 時，
    請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用 catalog 輔助工具，
    而不是硬編碼 provider-id 檢查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 會從 endpoint capability map 偵測支援狀態，
    因此即使 Plugin 使用自訂 provider id，原生 Moonshot/DashScope 風格 endpoint 仍會選擇加入。

  </Step>

  <Step title="新增動態模型解析">
    如果你的 provider 接受任意模型 ID（例如 proxy 或 router），
    請新增 `resolveDynamicModel`：

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
    預熱，`resolveDynamicModel` 會在它完成後再次執行。

  </Step>

  <Step title="視需要新增 runtime hook">
    多數 provider 只需要 `catalog` + `resolveDynamicModel`。請隨著 provider 需求
    逐步新增 hook。

    共用輔助建構器現在涵蓋最常見的 replay/tool-compat
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

    目前可用的 replay 系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI-compatible 傳輸的共用 OpenAI 風格 replay policy，包括 tool-call-id 清理、assistant-first ordering 修正，以及傳輸需要時的通用 Gemini-turn 驗證 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 依 `modelId` 選擇的 Claude-aware replay policy，因此 Anthropic-message 傳輸只會在已解析模型實際上是 Claude id 時取得 Claude-specific thinking-block cleanup | `amazon-bedrock`、`anthropic-vertex` |
    | `google-gemini` | 原生 Gemini replay policy，加上 bootstrap replay sanitation 和 tagged reasoning-output mode | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 透過 OpenAI-compatible proxy 傳輸執行 Gemini 模型時的 Gemini thought-signature sanitation；不會啟用原生 Gemini replay validation 或 bootstrap rewrites | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 針對在一個 Plugin 中混合 Anthropic-message 和 OpenAI-compatible 模型介面的 provider 的混合 policy；選用的 Claude-only thinking-block dropping 會保持限縮在 Anthropic 端 | `minimax` |

    目前可用的 stream 系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共用串流路徑上的 Gemini thinking 承載資料正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共用代理串流路徑上的 Kilo reasoning 包裝器，並讓 `kilo/auto` 與不支援的代理 reasoning ID 略過注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 等級對應 Moonshot binary native-thinking 承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax fast-mode 模型改寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共用原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳略程度、原生 Codex 網頁搜尋、reasoning-compat 承載資料塑形，以及 Responses 上下文管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 代理路由的 OpenRouter reasoning 包裝器，集中處理不支援模型/`auto` 略過 | `openrouter` |
    | `tool-stream-default-on` | 預設開啟的 `tool_stream` 包裝器，適用於 Z.AI 這類除非明確停用否則需要工具串流的提供者 | `zai` |

    <Accordion title="SDK seams powering the family builders">
      每個系列建構器都由同一套套件匯出的較低階公開輔助工具組成；當某個提供者需要偏離共用模式時，你可以使用這些工具：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始 replay 建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也會匯出 Gemini replay 輔助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端點/模型輔助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，加上共用 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking prefill 清理（`createAnthropicThinkingPrefillPayloadWrapper`），以及共用代理/提供者包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底層 Gemini schema 輔助工具（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 相容性輔助工具（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。內建 xAI Plugin 會搭配這些工具使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，讓 xAI 規則由該提供者擁有。

      有些串流輔助工具刻意維持在提供者本地。`@openclaw/anthropic-provider` 會在自己的公開 `api.ts` / `contract-api.ts` seam 中保留 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階的 Anthropic 包裝器建構器，因為它們編碼了 Claude OAuth beta 處理和 `context1m` 閘控。xAI Plugin 同樣會在自己的 `wrapStreamFn` 中保留原生 xAI Responses 塑形（`/fast` 別名、預設 `tool_stream`、不支援的 strict-tool 清理、xAI 專屬 reasoning-payload 移除）。

      相同的套件根目錄模式也支援 `@openclaw/openai-provider`（提供者建構器、預設模型輔助工具、即時提供者建構器）和 `@openclaw/openrouter-provider`（提供者建構器加上上線導引/設定輔助工具）。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        對於每次推論呼叫前需要權杖交換的提供者：

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
        對於需要自訂請求標頭或修改本文的提供者：

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
        對於需要在通用 HTTP 或 WebSocket 傳輸上提供原生請求/工作階段標頭或中繼資料的提供者：

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

    <Accordion title="All available provider hooks">
      OpenClaw 會依照以下順序呼叫 hook。大多數提供者只會使用 2 到 3 個：
      OpenClaw 已不再呼叫的僅相容性提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列在此處。

      | # | Hook | 使用時機 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目錄或 base URL 預設值 |
      | 2 | `applyConfigDefaults` | 設定具體化期間，由提供者擁有的全域預設值 |
      | 3 | `normalizeModelId` | 查找前清理舊版/預覽模型 ID 別名 |
      | 4 | `normalizeTransport` | 通用模型組裝前，清理提供者系列的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定提供者的原生 streaming-usage 相容性改寫 |
      | 7 | `resolveConfigApiKey` | 由提供者擁有的 env-marker 驗證解析 |
      | 8 | `resolveSyntheticAuth` | 本機/自架或由設定支援的合成驗證 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 將合成的已儲存設定檔預留位置降到 env/config 驗證之後 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | 12 | `normalizeResolvedModel` | runner 前的傳輸改寫 |
      | 13 | `contributeResolvedModelCompat` | 另一個相容傳輸背後廠商模型的相容性旗標 |
      | 14 | `normalizeToolSchemas` | 註冊前由提供者擁有的工具 schema 清理 |
      | 15 | `inspectToolSchemas` | 由提供者擁有的工具 schema 診斷 |
      | 16 | `resolveReasoningOutputMode` | 已標記與原生 reasoning-output 合約 |
      | 17 | `prepareExtraParams` | 預設請求參數 |
      | 18 | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | 19 | `wrapStreamFn` | 一般串流路徑上的自訂標頭/本文包裝器 |
      | 20 | `resolveTransportTurnState` | 原生每回合標頭/中繼資料 |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭/冷卻 |
      | 22 | `formatApiKey` | 自訂執行階段權杖形狀 |
      | 23 | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | 24 | `buildAuthDoctorHint` | 驗證修復指引 |
      | 25 | `matchesContextOverflowError` | 由提供者擁有的溢位偵測 |
      | 26 | `classifyFailoverReason` | 由提供者擁有的速率限制/過載分類 |
      | 27 | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | 28 | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | 29 | `augmentModelCatalog` | 合成的前向相容列 |
      | 30 | `resolveThinkingProfile` | 模型專屬 `/think` 選項集 |
      | 31 | `isBinaryThinking` | Binary thinking 開/關相容性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning 支援相容性 |
      | 33 | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性 |
      | 34 | `isModernModelRef` | 即時/煙霧測試模型比對 |
      | 35 | `prepareRuntimeAuth` | 推論前的權杖交換 |
      | 36 | `resolveUsageAuth` | 自訂用量憑證剖析 |
      | 37 | `fetchUsageSnapshot` | 自訂用量端點 |
      | 38 | `createEmbeddingProvider` | 由提供者擁有、供記憶體/搜尋使用的 embedding 配接器 |
      | 39 | `buildReplayPolicy` | 自訂轉錄 replay/compaction 政策 |
      | 40 | `sanitizeReplayHistory` | 通用清理後，提供者專屬的 replay 改寫 |
      | 41 | `validateReplayTurns` | 嵌入式 runner 前的嚴格 replay-turn 驗證 |
      | 42 | `onModelSelected` | 選取後回呼（例如遙測） |

      執行階段備援注意事項：

      - `normalizeConfig` 會先檢查相符的提供者，接著檢查其他具備 hook 能力的提供者 Plugin，直到其中一個實際變更設定。如果沒有提供者 hook 改寫受支援的 Google 系列設定項目，內建 Google 設定正規化器仍會套用。
      - `resolveConfigApiKey` 會在公開時使用提供者 hook。內建的 `amazon-bedrock` 路徑在這裡也有內建 AWS env-marker 解析器，即使 Bedrock 執行階段驗證本身仍使用 AWS SDK 預設鏈。
      - `resolveSystemPromptContribution` 讓提供者可以為某個模型系列注入具快取感知的 system-prompt 指引。當行為屬於單一提供者/模型系列，且應保留穩定/動態快取分割時，請優先使用它，而不是 `before_prompt_build`。

      如需詳細描述與實際範例，請參閱[內部：提供者執行階段 Hook](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    提供者 Plugin 可以在文字推論之外，同時註冊語音、即時轉錄、即時語音、媒體理解、圖片生成、影片生成、網頁擷取和網頁搜尋。OpenClaw 將此分類為
    **混合能力** Plugin，也就是公司 Plugin 的建議模式（每個廠商一個 Plugin）。請參閱
    [內部：能力擁有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，於你現有的 `api.registerProvider(...)` 呼叫旁註冊每項能力。只選擇你需要的分頁：

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

        對於提供者 HTTP 失敗，請使用 `assertOkOrThrowProviderError(...)`，讓
        plugins 共用受限的錯誤本文讀取、JSON 錯誤解析，以及
        request-id 後綴。
      </Tab>
      <Tab title="即時轉錄">
        建議使用 `createRealtimeTranscriptionWebSocketSession(...)` — 這個共用
        輔助工具會處理代理擷取、重新連線退避、關閉時排清、ready
        交握、音訊佇列，以及關閉事件診斷。你的 plugin
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

        以 POST multipart 音訊的批次 STT 提供者，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。這個輔助工具會正規化上傳
        檔名，包括需要 M4A 風格檔名才能相容轉錄 API 的 AAC 上傳。
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
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
      <Tab title="圖片與影片生成">
        影片功能使用**模式感知**的形狀：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，
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

## 發布到 ClawHub

提供者 plugins 的發布方式與任何其他外部程式碼 plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

不要在這裡使用舊版僅限 skill 的發布別名；plugin 套件應使用
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

`catalog.order` 控制你的目錄相對於內建提供者合併的時機：

| 順序      | 時機          | 使用情境                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API key 提供者                             |
| `profile` | simple 之後   | 受 auth profiles 限制的提供者                   |
| `paired`  | profile 之後  | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫現有提供者（衝突時勝出）                    |

## 後續步驟

- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) — 如果你的 plugin 也提供通道
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) — `api.runtime` 輔助工具（TTS、搜尋、subagent）
- [SDK Overview](/zh-TW/plugins/sdk-overview) — 完整的子路徑匯入參考
- [Plugin Internals](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) — hook 詳細資料與 bundled 範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [建置通道 plugins](/zh-TW/plugins/sdk-channel-plugins)
