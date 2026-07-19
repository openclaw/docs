---
read_when:
    - 你正在建置新的模型供應商外掛
    - 你想要將 OpenAI 相容的代理伺服器或自訂 LLM 新增至 OpenClaw
    - 你需要了解提供者驗證、目錄和執行階段掛鉤
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建立模型供應商外掛的逐步指南
title: 建置供應商外掛
x-i18n:
    generated_at: "2026-07-19T13:55:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

建置提供者外掛，為 OpenClaw 新增模型提供者（LLM）：模型
目錄、API 金鑰驗證，以及動態模型解析。

<Info>
  第一次使用 OpenClaw 外掛嗎？請先閱讀[開始使用](/zh-TW/plugins/building-plugins)，
  了解套件結構與資訊清單設定。
</Info>

<Tip>
  提供者外掛會將模型新增至 OpenClaw 的一般推論迴圈。如果模型必須透過擁有執行緒、壓縮、
  或工具事件的原生代理程式常駐程式執行，請將提供者搭配[代理程式
  控制框架](/zh-TW/plugins/sdk-agent-harness)，而不要將常駐程式協定
  細節放入核心。
</Tip>

## 操作指南

<Steps>
  <Step title="套件與資訊清單">
    ### 步驟 1：套件與資訊清單

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
      "description": "Acme AI 模型提供者",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API 金鑰",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API 金鑰"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` 可讓 OpenClaw 在不載入外掛執行階段的情況下偵測認證資訊。
    當提供者變體應重複使用另一個提供者 ID 的驗證時，請新增 `providerAuthAliases`。`modelSupport`
    為選用項目，可讓 OpenClaw 在執行階段掛鉤尚未存在前，從 `acme-large` 這類簡寫
    模型 ID 自動載入你的提供者外掛。`package.json` 中的 `openclaw.compat`
    與 `openclaw.build` 是發佈至 ClawHub 的必要項目
    （`openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion`
    是兩個必要欄位；若省略 `minGatewayVersion`，則會退回使用
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="註冊提供者">
    最基本的文字提供者需要 `id`、`label`、`auth` 與 `catalog`。
    `catalog` 是由提供者擁有的執行階段／設定掛鉤；它可以呼叫即時
    供應商 API，並傳回 `models.providers` 項目。

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` 是較新的控制平面目錄介面，
    用於清單／說明／選擇器 UI，涵蓋 `text`、`voice`、`image_generation`、
    `video_generation` 與 `music_generation` 資料列。請將供應商端點
    呼叫與回應對應保留在外掛中；OpenClaw 負責共用資料列
    結構、來源標籤與說明呈現。

    這樣就完成了一個可運作的提供者。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選擇
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果你的提供者公開 `/models` 風格的 API，請將提供者專用的
    端點與資料列投影保留在外掛中，並使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 處理共用擷取
    生命週期。此輔助工具提供受防護的 HTTP 擷取、提供者驗證標頭、
    結構化 HTTP 錯誤、TTL 快取與靜態備援行為，而不會
    將提供者政策放入 OpenClaw 核心。

    當即時 API 只會告訴你目前有哪些由提供者擁有的
    靜態目錄資料列可用時，請使用 `buildLiveModelProviderConfig`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    當提供者 API 傳回更豐富的中繼資料，且外掛需要自行將資料列
    投影為 OpenClaw 模型定義時，請使用 `getCachedLiveProviderModelRows`：

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` 應維持驗證閘控，且在沒有可用認證資訊時傳回 `null`。
    請保留離線 `staticRun` 或靜態備援，讓設定、文件、
    測試與選擇器介面不依賴即時網路存取。使用適合模型清單
    新鮮度的 TTL、避免在請求期間輪詢檔案系統，且僅在
    上游回應不是 OpenAI 相容的 `{ data: [{ id, object }] }`
    結構時，才傳入提供者專用的 `readRows`／`readModelId`。

    如果上游提供者使用的控制權杖與 OpenClaw 不同，請新增
    小型雙向文字轉換，而不要取代串流路徑：

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

    `input` 會在傳輸前改寫最終系統提示詞與文字訊息內容。
    `output` 會在 OpenClaw 解析自身的控制標記或傳遞至頻道前，
    改寫助理文字增量與最終文字。

    對於僅註冊一個文字提供者，並使用 API 金鑰
    驗證及單一目錄支援執行階段的內建提供者，請優先使用範圍較窄的
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

    `buildProvider` 是 OpenClaw 能解析實際供應商
    認證時使用的即時目錄路徑。它可以執行供應商專屬的探索。僅將
    `buildStaticProvider` 用於設定認證前可安全顯示的離線項目；
    它不得要求認證資訊或發出網路請求。
    OpenClaw 的 `models list --all` 顯示功能目前僅會對內建供應商外掛
    執行靜態目錄，並使用空白設定、空白環境及不含任何
    代理程式／工作區路徑。

    如果你的認證流程還需要在新手引導期間修補 `models.providers.*`、
    別名及代理程式的預設模型，請使用
    `openclaw/plugin-sdk/provider-onboard` 中的預設集輔助函式。範圍最小的輔助函式是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 及
    `createModelCatalogPresetAppliers(...)`。

    當供應商的原生端點在一般 `openai-completions` 傳輸上支援串流用量區塊時，
    請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助函式，
    而非將供應商 ID 檢查寫死。
    `supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應表偵測支援情況，
    因此即使外掛使用自訂供應商 ID，原生 Moonshot／DashScope 風格的端點
    仍可選擇啟用。

    上述即時探索範例涵蓋 `/models` 風格的供應商 API。請將
    該探索保留在 `catalog.run` 內，並以可用的認證作為條件；
    同時讓 `staticRun` 不使用網路，以產生離線目錄。

  </Step>

  <Step title="新增動態模型解析">
    如果你的供應商接受任意模型 ID（例如 Proxy 或 Router），
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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步
    暖機；完成後會再次執行 `resolveDynamicModel`。

  </Step>

  <Step title="新增執行階段掛鉤（視需要）">
    大多數供應商只需要 `catalog` + `resolveDynamicModel`。請依照
    供應商的需求逐步新增掛鉤。

    共用輔助建構器目前已涵蓋最常見的重播／工具相容性
    系列，因此外掛通常不需要逐一手動連接每個掛鉤：

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

    | 系列 | 連接的功能 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | 適用於 OpenAI 相容傳輸的共用 OpenAI 風格重播政策，包括工具呼叫 ID 清理、先由助理開始的排序修正，以及傳輸需要時的一般 Gemini 輪次驗證 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude 感知重播政策，因此只有在解析出的模型確實是 Claude ID 時，Anthropic 訊息傳輸才會取得 Claude 專屬的思考區塊清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 與 `anthropic-by-model` 相同的依模型套用 Claude 政策，另加上工具呼叫 ID 清理，以及為必須保留供應商原生 ID 的傳輸保留原生 Anthropic 工具使用 ID | `anthropic-vertex`、`clawrouter` |
    | `google-gemini` | 原生 Gemini 重播政策加上啟動重播清理。共用系列讓文字輸出的 Gemini 命令列介面使用標記式推理；直接的 `google` 供應商會將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 的思考內容會以原生思考部分送達。 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 為透過 OpenAI 相容 Proxy 傳輸執行的 Gemini 模型清理 Gemini 思考簽章；不會啟用原生 Gemini 重播驗證或啟動重寫 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在單一外掛中混合 Anthropic 訊息與 OpenAI 相容模型介面的供應商之混合政策；選用的僅限 Claude 思考區塊捨棄功能仍僅作用於 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 連接的功能 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 在共用串流路徑上正規化 Gemini 思考承載資料 | `google`、`google-gemini-cli` |
    | `kilocode-thinking` | 共用 Proxy 串流路徑上的 Kilo 推理包裝器，其中 `kilo-auto/balanced` 及不支援的 Proxy 推理 ID 會略過注入的思考內容 | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 層級對應 Moonshot 二進位原生思考承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`、`minimax-portal` |
    | `openai-responses-defaults` | 共用的原生 OpenAI／Codex Responses 包裝器：歸屬標頭、`/fast`／`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容性承載資料塑形，以及 Responses 情境管理 | `openai` |
    | `openrouter-thinking` | 適用於 Proxy 路由的 OpenRouter 推理包裝器，集中處理不支援的模型／`auto` 略過行為 | `openrouter` |
    | `tool-stream-default-on` | 預設啟用的 `tool_stream` 包裝器，適用於 Z.AI 等除非明確停用、否則需要工具串流的供應商 | `zai` |

    <Accordion title="支援系列建構器的 SDK 介面">
      每個系列建構器皆由同一套件匯出的較低階公開輔助函式組成；當供應商需要偏離常見模式時，可以使用這些函式：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。另匯出 Gemini 重播輔助函式（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）及端點／模型輔助函式（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用的 OpenAI／Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容性（`createPlainTextToolCallCompatWrapper`），以及共用 Proxy／供應商包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 適用於高頻供應商路徑的輕量承載資料與事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 及 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層供應商結構描述輔助函式。

      對於 Gemini 系列供應商，請讓推理輸出模式與
      傳輸保持一致。直接使用 Google Gemini API 的供應商應使用 `native`
      推理輸出，讓 OpenClaw 不必新增
      `<think>`／`<final>` 提示詞指令即可取用原生思考部分。解析最終 JSON／文字回應的
      純文字 Gemini 命令列介面風格後端可以繼續使用共用的
      `google-gemini` 標記式合約。

      有些串流輔助函式會刻意保留在供應商本機。`@openclaw/anthropic-provider` 將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 及較低階的 Anthropic 包裝器建構器保留在自身公開的 `api.ts`／`contract-api.ts` 介面中，因為它們會編碼 Claude OAuth Beta 處理及 `context1m` 限制。xAI 外掛同樣將原生 xAI Responses 塑形保留在自身的 `wrapStreamFn` 中（`/fast` 別名、預設 `tool_stream`、不支援的嚴格工具清理、xAI 專屬推理承載資料移除）。

      相同的套件根目錄模式也支援 `@openclaw/openai-provider`（供應商建構器、預設模型輔助函式、即時供應商建構器）及 `@openclaw/openrouter-provider`（供應商建構器加上新手引導／設定輔助函式）。
    </Accordion>

    <Tabs>
      <Tab title="權杖交換">
        對於每次推論呼叫前都需要交換權杖的供應商：

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
      <Tab title="原生傳輸身分">
        對於需要在一般 HTTP 或 WebSocket 傳輸上使用原生請求／工作階段標頭或中繼資料的供應商：

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
        對於公開用量／計費資料的供應商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` 有三種結果。當提供者具有用量／帳務認證資訊時，回傳
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用欄位會將已解析設定檔中的
        非機密方案中繼資料帶入
        `fetchUsageSnapshot`）。只有在提供者已明確處理用量
        驗證但沒有可用的用量權杖，且 OpenClaw 必須略過一般
        API 金鑰／OAuth 後援時，才回傳
        `{ handled: true }`。當提供者未處理要求，且 OpenClaw 應繼續使用一般後援時，回傳 `null` 或 `undefined`。

        在 `contracts.usageProviders` 中宣告提供者 ID。當該資訊清單
        合約和**兩個**鉤子都存在時，OpenClaw 會自動將
        該提供者納入用量收集，而不載入無關的提供者
        外掛。不需要更新核心允許清單。
        `fetchUsageSnapshot` 會回傳共用且與提供者無關的形式：

        - `plan`：提供者回報的訂閱或金鑰標籤
        - `windows`：以已用百分比表示的可重設配額視窗
        - `billing`：具型別的 `balance`、`spend` 或 `budget` 項目；`unit` 可以是
          ISO 貨幣，或 `credits` 之類的提供者單位
        - `summary`：無法納入這些結構化欄位的精簡
          提供者特定情境

        請精確保留貨幣語意。除非上游合約如此規定，
        否則提供者額度並非 USD。僅實作
        `fetchUsageSnapshot` 的外掛仍可供明確／合成呼叫端使用，
        但不會被自動探索，因為 OpenClaw 無法解析其用量認證資訊。
      </Tab>
    </Tabs>

    <Accordion title="常見提供者鉤子">
      對於模型／提供者外掛，OpenClaw 大致會依照以下順序呼叫鉤子。
      多數提供者只會使用其中 2 至 3 個。這並非完整的 `ProviderPlugin`
      合約；如需完整且目前準確的鉤子清單與後援說明，請參閱[內部機制：提供者執行階段
      鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
      此處不列出 OpenClaw 已不再呼叫、僅供相容性使用的提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

      | 鉤子 | 使用時機 |
      | --- | --- |
      | `catalog` | 模型目錄或基底 URL 預設值 |
      | `applyConfigDefaults` | 在設定具體化期間套用提供者擁有的全域預設值 |
      | `normalizeModelId` | 查找前清理舊版／預覽版模型 ID 別名 |
      | `normalizeTransport` | 在一般模型組裝前清理提供者系列的 `api`／`baseUrl` |
      | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | `applyNativeStreamingUsageCompat` | 針對設定提供者進行原生串流用量相容性重寫 |
      | `resolveConfigApiKey` | 解析提供者擁有的環境標記驗證 |
      | `resolveSyntheticAuth` | 本機／自行託管或設定支援的合成驗證 |
      | `resolveExternalAuthProfiles` | 為命令列介面／應用程式管理的認證資訊疊加提供者擁有的外部驗證設定檔 |
      | `shouldDeferSyntheticProfileAuth` | 將合成的已儲存設定檔預留位置降至環境／設定驗證之後 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | `normalizeResolvedModel` | 在執行器之前重寫傳輸 |
      | `normalizeToolSchemas` | 註冊前清理提供者擁有的工具結構描述 |
      | `inspectToolSchemas` | 提供者擁有的工具結構描述診斷 |
      | `resolveReasoningOutputMode` | 標記式與原生推理輸出合約 |
      | `prepareExtraParams` | 預設要求參數 |
      | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | `wrapStreamFn` | 一般串流路徑上的自訂標頭／本文包裝器 |
      | `resolveTransportTurnState` | 原生的每回合標頭／中繼資料 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭／冷卻 |
      | `formatApiKey` | 自訂執行階段權杖形式 |
      | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | `buildAuthDoctorHint` | 驗證修復指引 |
      | `matchesContextOverflowError` | 提供者擁有的溢位偵測 |
      | `classifyFailoverReason` | 提供者擁有的速率限制／過載分類 |
      | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | `augmentModelCatalog` | 合成的向前相容資料列（已棄用，建議使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 選項集 |
      | `isBinaryThinking` | 二元思考開啟／關閉相容性（已棄用，建議使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支援相容性（已棄用，建議使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性（已棄用，建議使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 即時／煙霧測試模型比對 |
      | `prepareRuntimeAuth` | 推論前交換權杖 |
      | `resolveUsageAuth` | 自訂用量認證資訊剖析 |
      | `fetchUsageSnapshot` | 自訂用量端點 |
      | `createEmbeddingProvider` | 提供者擁有、用於記憶／搜尋的嵌入轉接器 |
      | `buildReplayPolicy` | 自訂逐字稿重播／壓縮政策 |
      | `sanitizeReplayHistory` | 一般清理後的提供者特定重播重寫 |
      | `validateReplayTurns` | 嵌入式執行器之前的嚴格重播回合驗證 |
      | `onModelSelected` | 選取後回呼（例如遙測） |

      執行階段後援說明：

      - `normalizeConfig` 會為每個提供者 ID 解析一個所屬外掛（先是內建提供者，再來是相符的執行階段外掛），且只呼叫該鉤子，不會掃描其他提供者。Google 自己的 `normalizeConfig` 鉤子負責正規化 `google`／`google-vertex`／`google-antigravity` 設定項目；它不是獨立的核心後援。
      - `resolveConfigApiKey` 會在提供者公開鉤子時使用該鉤子。Amazon Bedrock 會將 AWS 環境標記解析保留在其提供者外掛中；當設定為 `auth: "aws-sdk"` 時，執行階段驗證本身仍使用 AWS SDK 預設鏈。
      - `resolveThinkingProfile(ctx)` 會接收所選的 `provider`、`modelId`、選用的合併 `reasoning` 目錄提示，以及選用的合併模型 `compat` 事實。僅使用 `compat` 選取提供者的思考 UI／設定檔。
      - `resolveSystemPromptContribution` 允許提供者為某個模型系列注入可感知快取的系統提示指引。當行為屬於單一提供者／模型系列，且應保留穩定／動態快取分割時，請優先使用它，而非舊版的全外掛 `before_prompt_build` 鉤子。

    </Accordion>

  </Step>

  <Step title="新增額外功能（選用）">
    ### 步驟 5：新增額外功能

    提供者外掛可在文字推論之外註冊嵌入、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取與網頁搜尋。OpenClaw 將其歸類為
    **混合功能**外掛，這是公司外掛的建議模式
    （每個供應商一個外掛）。請參閱
    [內部機制：功能所有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，於現有的
    `api.registerProvider(...)` 呼叫旁註冊各項功能。只選擇需要的分頁：

    <Tabs>
      <Tab title="語音（TTS）">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
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

        對提供者 HTTP 失敗使用 `assertOkOrThrowProviderError(...)`，讓
        各外掛共用有上限的錯誤本文讀取、JSON 錯誤剖析和
        要求 ID 後綴。
      </Tab>
      <Tab title="即時轉錄">
        建議使用 `createRealtimeTranscriptionWebSocketSession(...)`；共用
        輔助程式會處理 Proxy 擷取、重新連線退避、關閉排空、就緒
        交握、音訊佇列，以及關閉事件診斷。你的外掛
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

        批次 STT 提供者若以 POST 傳送 multipart 音訊，應使用
        來自 `openclaw/plugin-sdk/provider-http` 的
        `buildAudioTranscriptionFormData(...)`。此輔助函式會正規化上傳
        檔名，包括需要使用 M4A 樣式檔名才能相容於
        轉錄 API 的 AAC 上傳。
      </Tab>
      <Tab title="即時語音">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme 即時語音",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // 僅當提供者接受單次工具呼叫的多個回應時才設定此項，
            // 例如先立即回應「處理中」，之後再傳送最終結果。
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
        用戶端公開有效的模式、傳輸方式、音訊格式及功能旗標。
        當傳輸方式可偵測到真人正在打斷助理播放，且提供者支援
        截斷或清除目前音訊回應時，請實作 `handleBargeIn`。
        `submitToolResult` 可針對同步提交回傳 `void`，或回傳
        `Promise<void>`，作為提供者橋接器可公開的非同步完成邊界。
        閘道轉送工作階段會等待該 promise，之後才確認最終結果或
        清除連結的執行；提交失敗時應拒絕該 promise。
        當提供者無法遵守 `options.suppressResponse` 時，請設定
        `supportsToolResultSuppression: false`。OpenClaw 隨後將不會抑制內部強制諮詢
        與取消結果，並會拒絕直接要求抑制結果，而非無提示地開始回應。
        `createRealtimeVoiceBridgeSession` 的使用者同樣可從 `onToolCall`
        回傳 promise；同步擲回與拒絕會路由至工作階段的
        `onError` 回呼。
        僅在提供者 VAD 透過呼叫 `onClearAudio("barge-in")` 確認
        發生打斷時，才設定 `handlesInputAudioBargeIn`。未提供此
        旗標的提供者會使用 OpenClaw 的本機輸入音訊備援偵測。
      </Tab>
      <Tab title="媒體理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "一張……的照片" }),
          transcribeAudio: async (req) => ({ text: "轉錄文字……" }),
        });
        ```

        刻意不需要認證資訊的本機或自架媒體提供者，可以公開
        `resolveAuth` 並回傳 `kind: "none"`。
        對於未明確選擇加入的提供者，OpenClaw 仍會保留一般的
        驗證閘門。現有提供者可繼續讀取 `req.apiKey`；
        新提供者應優先使用 `req.auth`。

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio 外掛無驗證",
          }),
          transcribeAudio: async (req) => ({ text: "轉錄文字……" }),
        });
        ```
      </Tab>
      <Tab title="嵌入">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        在 `contracts.embeddingProviders` 中宣告相同的 id。這是
        用於可重複使用向量產生的一般嵌入合約，包括
        記憶搜尋。`registerMemoryEmbeddingProvider(...)` 是為現有記憶專用配接器
        保留的已棄用相容機制。
      </Tab>
      <Tab title="圖片與影片生成">
        圖片與影片功能使用**模式感知**結構。圖片
        提供者須宣告必要的 `generate` 與 `edit` 功能區塊；
        影片提供者須宣告 `generate`、`imageToVideo` 及
        `videoToVideo`。`maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 等扁平彙總欄位，不足以清楚表明
        轉換模式支援或停用的模式。音樂生成
        遵循相同的 `generate` / `edit` 模式。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme 圖片",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme 影片",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        兩種提供者類型都必須提供 `capabilities`；`edit` 及
        影片轉換區塊（`imageToVideo`、`videoToVideo`）一律需要
        明確的 `enabled` 旗標。

        當列出的模型之靜態模式或功能與提供者預設值
        不同時，請使用 `catalogByModel`。此中繼資料能在
        不叫用提供者程式碼的情況下，確保 `video_generate action=list`
        與模型目錄正確。請求時的功能查詢與強制執行
        仍應由 `resolveModelCapabilities` 與 `generateVideo` 負責；
        可行時，請在兩條路徑重複使用相同的功能常數。
      </Tab>
      <Tab title="網頁擷取與搜尋">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme 擷取",
          hint: "透過 Acme 的轉譯後端擷取頁面。",
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
            description: "透過 Acme 擷取來擷取頁面。",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme 搜尋",
          hint: "透過 Acme 的搜尋後端搜尋網路。",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "透過 Acme 搜尋來搜尋網路。",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        兩種提供者類型共用相同的認證資訊接線結構：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 及 `createTool`
        全部都是必要項目。
      </Tab>
    </Tabs>

  </Step>

  <Step title="測試">
    ### 步驟 6：測試

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 從 index.ts 或專用檔案匯出你的提供者設定物件
    import { acmeProvider } from "./provider.js";

    describe("acme-ai 提供者", () => {
      it("解析動態模型", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("有金鑰可用時回傳目錄", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("沒有金鑰時回傳 null 目錄", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 發佈至 ClawHub

提供者外掛的發佈方式與任何其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用於發佈 Skills
資料夾的另一個命令，而非外掛套件；請勿在此使用。

## 檔案結構

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 中繼資料
├── openclaw.plugin.json      # 含提供者驗證中繼資料的資訊清單
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 測試
    └── usage.ts              # 用量端點（選用）
```

## 目錄順序參考

`catalog.order` 控制你的目錄相對於內建
提供者的合併時機：

| 順序     | 時機          | 使用案例                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一階段    | 純 API 金鑰供應商                         |
| `profile` | 簡易項目之後  | 受認證設定檔限制的供應商                |
| `paired`  | 設定檔之後 | 彙整多個相關項目             |
| `late`    | 最後階段     | 覆寫現有供應商（衝突時優先） |

## 後續步驟

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果你的外掛也提供頻道
- [SDK 執行階段](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助工具（TTS、搜尋、子代理程式）
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [外掛內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - 鉤子詳細資訊與內建範例

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
