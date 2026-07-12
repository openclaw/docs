---
read_when:
    - 你正在建立新的模型供應商外掛
    - 你想要將與 OpenAI 相容的代理伺服器或自訂 LLM 新增至 OpenClaw
    - 你需要瞭解供應商驗證、目錄與執行階段掛鉤。
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建立模型供應商外掛的逐步指南
title: 建置供應商外掛
x-i18n:
    generated_at: "2026-07-12T14:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

建立供應商外掛，將模型供應商（LLM）新增至 OpenClaw：包括模型目錄、API 金鑰驗證，以及動態模型解析。

<Info>
  第一次接觸 OpenClaw 外掛？請先閱讀[入門指南](/zh-TW/plugins/building-plugins)，
  了解套件結構與資訊清單設定。
</Info>

<Tip>
  供應商外掛會將模型新增至 OpenClaw 的一般推論迴圈。如果模型必須透過
  原生代理程式常駐服務執行，且該服務負責執行緒、壓縮或工具事件，請將供應商
  搭配[代理程式框架](/zh-TW/plugins/sdk-agent-harness)，而不要將常駐服務的通訊協定
  細節放入核心。
</Tip>

## 操作說明

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
      "description": "Acme AI model provider",
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

    `setup.providers[].envVars` 可讓 OpenClaw 在不載入外掛執行階段的情況下
    偵測認證資訊。當某個供應商變體應重複使用另一個供應商 ID 的驗證時，
    請新增 `providerAuthAliases`。`modelSupport` 為選用項目，可讓 OpenClaw
    在執行階段掛鉤尚未存在前，透過 `acme-large` 之類的模型簡寫 ID
    自動載入你的供應商外掛。若要發佈至 ClawHub，`package.json` 中必須包含
    `openclaw.compat` 與 `openclaw.build`（兩個必要欄位為
    `openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion`；
    若省略 `minGatewayVersion`，則會退回使用
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="註冊供應商">
    最基本的文字供應商需要 `id`、`label`、`auth` 與 `catalog`。
    `catalog` 是由供應商擁有的執行階段／設定掛鉤；它可以呼叫即時供應商
    API，並傳回 `models.providers` 項目。

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
    用於清單／說明／選擇器 UI，涵蓋 `text`、`voice`、
    `image_generation`、`video_generation` 與 `music_generation` 資料列。
    請將供應商端點呼叫與回應對應保留在外掛中；OpenClaw 負責共用資料列
    格式、來源標籤與說明呈現。

    這樣就完成了一個可運作的供應商。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選取
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果你的供應商提供 `/models` 類型的 API，請將供應商專屬端點與資料列
    投影保留在外掛中，並使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 處理共用的擷取
    生命週期。此輔助工具提供受保護的 HTTP 擷取、供應商驗證標頭、
    結構化 HTTP 錯誤、TTL 快取及靜態退回行為，無須將供應商政策放入
    OpenClaw 核心。

    當即時 API 只會告知你目前有哪些由供應商擁有的靜態目錄資料列可用時，
    請使用 `buildLiveModelProviderConfig`：

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

    當供應商 API 傳回更豐富的中繼資料，而外掛需要自行將資料列投影成
    OpenClaw 模型定義時，請使用 `getCachedLiveProviderModelRows`：

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

    `run` 應維持驗證閘控，且在沒有可用認證資訊時傳回 `null`。請保留離線
    `staticRun` 或靜態退回機制，讓設定、文件、測試和選擇器介面不依賴即時
    網路存取。請使用符合模型清單新鮮度需求的 TTL、避免在要求處理期間輪詢
    檔案系統，且僅在上游回應不是與 OpenAI 相容的
    `{ data: [{ id, object }] }` 格式時，才傳入供應商專屬的
    `readRows`／`readModelId`。

    如果上游供應商使用的控制權杖與 OpenClaw 不同，請新增小型雙向文字轉換，
    而不是取代串流路徑：

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

    `input` 會在傳輸前改寫最終系統提示與文字訊息內容。`output` 會在
    OpenClaw 解析自身控制標記或傳遞至頻道前，改寫助理文字增量與最終文字。

    對於僅註冊一個文字供應商，並使用 API 金鑰驗證加上單一目錄型執行階段的
    內建供應商，建議使用範圍較窄的 `defineSingleProviderPluginEntry(...)`
    輔助工具：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型供應商",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API 金鑰",
            hint: "來自你的 Acme AI 儀表板的 API 金鑰",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "輸入你的 Acme AI API 金鑰",
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

    `buildProvider` 是 OpenClaw 能夠解析實際供應商驗證時所使用的即時目錄路徑。
    它可以執行供應商特定的探索。只有在設定驗證前可安全顯示的離線項目才使用
    `buildStaticProvider`；它不得要求認證資訊或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會對內建供應商外掛執行靜態目錄，
    並使用空白設定、空白環境，以及不提供代理程式／工作區路徑。

    如果你的驗證流程還需要在初始設定期間修補 `models.providers.*`、別名和
    代理程式預設模型，請使用 `openclaw/plugin-sdk/provider-onboard`
    提供的預設集輔助函式。範圍最小的輔助函式是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    當供應商的原生端點在一般 `openai-completions` 傳輸上支援串流用量區塊時，
    請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助函式，
    而不要硬編碼供應商 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應表偵測支援情況，
    因此即使外掛使用自訂供應商 ID，原生 Moonshot／DashScope 類型的端點仍可選擇啟用。

    上述即時探索範例涵蓋 `/models` 類型的供應商 API。請將該探索保留在
    `catalog.run` 內，並以可用的驗證作為執行條件；同時讓 `staticRun`
    不進行網路存取，以產生離線目錄。

  </Step>

  <Step title="新增動態模型解析">
    如果你的供應商接受任意模型 ID（例如 Proxy 或路由器），
    請新增 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ...上述的 id、label、auth、catalog

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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步預熱；
    完成後會再次執行 `resolveDynamicModel`。

  </Step>

  <Step title="新增執行階段掛鉤（視需要）">
    大多數供應商只需要 `catalog` + `resolveDynamicModel`。請依供應商需求
    逐步新增掛鉤。

    共用輔助建構器現在涵蓋最常見的重播／工具相容系列，因此外掛通常不需要
    逐一手動連接每個掛鉤：

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
    | `openai-compatible` | OpenAI 相容傳輸所使用的共用 OpenAI 風格重播原則，包括工具呼叫 ID 清理、助理優先順序修正，以及傳輸需要時的通用 Gemini 輪次驗證 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 依 `modelId` 選擇的 Claude 感知重播原則，因此只有在解析出的模型確實是 Claude ID 時，Anthropic 訊息傳輸才會套用 Claude 特定的思考區塊清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 與 `anthropic-by-model` 相同的依模型選擇 Claude 原則，並額外針對必須保留供應商原生 ID 的傳輸，加入工具呼叫 ID 清理與原生 Anthropic 工具使用 ID 保留 | `anthropic-vertex`、`clawrouter` |
    | `google-gemini` | 原生 Gemini 重播原則，加上啟動重播清理。共用系列會讓輸出文字的 Gemini 命令列介面維持標記式推理；直接的 `google` 供應商則會將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 的思考內容會以原生 thought parts 抵達。 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 針對透過 OpenAI 相容 Proxy 傳輸執行的 Gemini 模型進行 Gemini 思考簽章清理；不會啟用原生 Gemini 重播驗證或啟動重寫 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在單一外掛中混合 Anthropic 訊息與 OpenAI 相容模型介面的供應商；選用的僅限 Claude 思考區塊捨棄功能仍限定於 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 連接的功能 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 在共用串流路徑上正規化 Gemini 思考承載資料 | `google`、`google-gemini-cli` |
    | `kilocode-thinking` | 共用 Proxy 串流路徑上的 Kilo 推理包裝器；`kilo/auto` 和不支援的 Proxy 推理 ID 會略過注入的思考內容 | `kilocode` |
    | `moonshot-thinking` | 根據設定 + `/think` 層級對應 Moonshot 二進位原生思考承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`、`minimax-portal` |
    | `openai-responses-defaults` | 共用的原生 OpenAI／Codex Responses 包裝器：歸屬標頭、`/fast`／`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容承載資料塑形，以及 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 適用於 Proxy 路由的 OpenRouter 推理包裝器，集中處理不支援模型／`auto` 的略過行為 | `openrouter` |
    | `tool-stream-default-on` | 適用於 Z.AI 等除非明確停用、否則希望啟用工具串流之供應商的預設啟用 `tool_stream` 包裝器 | `zai` |

    <Accordion title="支援系列建構器的 SDK 接合面">
      每個系列建構器都由同一套件匯出的較低階公用輔助函式組成；當供應商需要偏離通用模式時，你可以直接使用這些函式：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也會匯出 Gemini 重播輔助函式（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端點／模型輔助函式（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用的 OpenAI／Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容功能（`createPlainTextToolCallCompatWrapper`），以及共用 Proxy／供應商包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 適用於高頻供應商路徑的輕量承載資料與事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層供應商結構描述輔助函式。

      對於 Gemini 系列供應商，請讓推理輸出模式與傳輸保持一致。
      直接使用 Google Gemini API 的供應商應使用 `native` 推理輸出，
      讓 OpenClaw 能在不加入 `<think>`／`<final>` 提示詞指令的情況下
      使用原生 thought parts。只輸出文字、並解析最終 JSON／文字回應的
      Gemini 命令列介面類型後端，可以繼續使用共用的 `google-gemini` 標記式合約。

      某些串流輔助函式刻意保留在供應商本地。`@openclaw/anthropic-provider`
      會將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
      `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 和較低階的
      Anthropic 包裝器建構器保留在其自身的公用 `api.ts`／`contract-api.ts`
      接合面中，因為它們編碼了 Claude OAuth Beta 處理和 `context1m` 門控。
      xAI 外掛同樣將原生 xAI Responses 塑形保留在自身的 `wrapStreamFn`
      中（`/fast` 別名、預設 `tool_stream`、不支援的嚴格工具清理、
      xAI 特定的推理承載資料移除）。

      同樣的套件根目錄模式也支援 `@openclaw/openai-provider`
      （供應商建構器、預設模型輔助函式、即時供應商建構器）和
      `@openclaw/openrouter-provider`（供應商建構器及初始設定／設定輔助函式）。
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
        對於需要自訂請求標頭或修改主體的供應商：

        ```typescript
        // wrapStreamFn 會傳回衍生自 ctx.streamFn 的 StreamFn
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
      <Tab title="原生傳輸識別資訊">
        對於需要在通用 HTTP 或 WebSocket 傳輸上使用原生請求／工作階段標頭
        或中繼資料的供應商：

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
        適用於提供用量／計費資料的供應商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` 有三種結果。當供應商具有用量／計費認證資訊時，回傳
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用欄位會將
        已解析設定檔中的非機密方案中繼資料傳入
        `fetchUsageSnapshot`）。只有當供應商已明確處理用量
        驗證，但沒有可用的用量權杖，且 OpenClaw 必須略過一般
        API 金鑰／OAuth 備援機制時，才回傳
        `{ handled: true }`。當供應商未處理該要求，且 OpenClaw 應繼續使用一般備援機制時，
        回傳 `null` 或 `undefined`。

        請在 `contracts.usageProviders` 中宣告供應商 ID。當該資訊清單
        合約和**兩個**鉤子都存在時，OpenClaw 會自動將
        該供應商納入用量收集，而不載入不相關的供應商
        外掛。不需要更新核心允許清單。
        `fetchUsageSnapshot` 會回傳共用且與供應商無關的格式：

        - `plan`：供應商回報的訂閱或金鑰標籤
        - `windows`：以已用百分比表示的可重設配額期間
        - `billing`：具型別的 `balance`、`spend` 或 `budget` 項目；`unit` 可以是
          ISO 貨幣或供應商單位，例如 `credits`
        - `summary`：無法納入上述結構化欄位的精簡供應商特定脈絡

        請精確保留貨幣語意。除非上游合約如此規定，否則供應商點數並非美元。
        僅實作 `fetchUsageSnapshot` 的外掛仍可供明確／合成呼叫端使用，但
        不會被自動探索，因為 OpenClaw 無法解析其用量認證資訊。
      </Tab>
    </Tabs>

    <Accordion title="常見供應商鉤子">
      對於模型／供應商外掛，OpenClaw 大致依下列順序呼叫鉤子。
      大多數供應商只會使用 2-3 個。這不是完整的 `ProviderPlugin`
      合約——如需完整且目前準確的鉤子清單與備援機制說明，請參閱
      [內部機制：供應商執行階段鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
      此處不會列出 OpenClaw 已不再呼叫、僅供相容性使用的供應商欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

      | 鉤子 | 使用時機 |
      | --- | --- |
      | `catalog` | 模型目錄或基底 URL 預設值 |
      | `applyConfigDefaults` | 具體化設定時，由供應商擁有的全域預設值 |
      | `normalizeModelId` | 查詢前清理舊版／預覽模型 ID 別名 |
      | `normalizeTransport` | 組裝一般模型前，清理供應商系列的 `api`／`baseUrl` |
      | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | `applyNativeStreamingUsageCompat` | 針對設定供應商進行原生串流用量相容性重寫 |
      | `resolveConfigApiKey` | 由供應商擁有的環境變數標記驗證解析 |
      | `resolveSyntheticAuth` | 本機／自行託管或由設定支援的合成驗證 |
      | `resolveExternalAuthProfiles` | 為命令列介面／應用程式管理的認證資訊疊加由供應商擁有的外部驗證設定檔 |
      | `shouldDeferSyntheticProfileAuth` | 將合成儲存設定檔預留位置的優先級降至環境變數／設定驗證之後 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前以非同步方式擷取中繼資料 |
      | `normalizeResolvedModel` | 執行器執行前重寫傳輸方式 |
      | `normalizeToolSchemas` | 註冊前清理由供應商擁有的工具結構描述 |
      | `inspectToolSchemas` | 由供應商擁有的工具結構描述診斷 |
      | `resolveReasoningOutputMode` | 標記式與原生推理輸出合約 |
      | `prepareExtraParams` | 預設要求參數 |
      | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | `wrapStreamFn` | 一般串流路徑上的自訂標頭／本文包裝器 |
      | `resolveTransportTurnState` | 原生的每回合標頭／中繼資料 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭／冷卻時間 |
      | `formatApiKey` | 自訂執行階段權杖格式 |
      | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | `buildAuthDoctorHint` | 驗證修復指引 |
      | `matchesContextOverflowError` | 由供應商擁有的溢位偵測 |
      | `classifyFailoverReason` | 由供應商擁有的速率限制／過載分類 |
      | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | `augmentModelCatalog` | 合成的向前相容資料列（已棄用——建議改用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 選項集 |
      | `isBinaryThinking` | 二元思考開啟／關閉相容性（已棄用——建議改用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支援相容性（已棄用——建議改用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性（已棄用——建議改用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 即時／冒煙測試模型比對 |
      | `prepareRuntimeAuth` | 推論前交換權杖 |
      | `resolveUsageAuth` | 自訂用量認證資訊剖析 |
      | `fetchUsageSnapshot` | 自訂用量端點 |
      | `createEmbeddingProvider` | 由供應商擁有、用於記憶／搜尋的嵌入配接器 |
      | `buildReplayPolicy` | 自訂文字記錄重播／壓縮政策 |
      | `sanitizeReplayHistory` | 一般清理後的供應商特定重播重寫 |
      | `validateReplayTurns` | 嵌入式執行器執行前進行嚴格的重播回合驗證 |
      | `onModelSelected` | 選擇後回呼（例如遙測） |

      執行階段備援機制說明：

      - `normalizeConfig` 會為每個供應商 ID 解析一個擁有此外掛的外掛（先處理隨附供應商，再處理相符的執行階段外掛），並且只呼叫該鉤子——不會掃描其他供應商。Google 自己的 `normalizeConfig` 鉤子會正規化 `google`／`google-vertex`／`google-antigravity` 設定項目；它並不是獨立的核心備援機制。
      - 當供應商公開 `resolveConfigApiKey` 鉤子時，系統會使用該鉤子。Amazon Bedrock 會在其供應商外掛中保留 AWS 環境變數標記解析；若設為 `auth: "aws-sdk"`，執行階段驗證本身仍會使用 AWS SDK 預設鏈。
      - `resolveThinkingProfile(ctx)` 會接收選定的 `provider`、`modelId`、選用的合併後 `reasoning` 目錄提示，以及選用的合併後模型 `compat` 資訊。僅使用 `compat` 選擇供應商的思考 UI／設定檔。
      - `resolveSystemPromptContribution` 可讓供應商針對模型系列注入具快取感知能力的系統提示指引。當行為屬於單一供應商／模型系列，且應保留穩定／動態快取分割時，請優先使用它，而非舊版的外掛全域 `before_prompt_build` 鉤子。

    </Accordion>

  </Step>

  <Step title="新增額外功能（選用）">
    ### 步驟 5：新增額外功能

    供應商外掛除了文字推論之外，還能註冊嵌入、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取和網頁搜尋。OpenClaw 將此歸類為
    **混合功能**外掛——這是公司外掛的建議模式
    （每家供應商一個外掛）。請參閱
    [內部機制：功能擁有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    請在 `register(api)` 中，於現有的
    `api.registerProvider(...)` 呼叫旁註冊每項功能。只選擇你需要的分頁：

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

        供應商 HTTP 失敗時請使用 `assertOkOrThrowProviderError(...)`，讓
        外掛共用有上限的錯誤本文讀取、JSON 錯誤剖析和
        要求 ID 後綴。
      </Tab>
      <Tab title="即時轉錄">
        建議使用 `createRealtimeTranscriptionWebSocketSession(...)`——此共用
        輔助函式會處理代理伺服器擷取、重新連線退避、關閉時排空、就緒
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

        透過 POST 傳送多部分音訊的批次 STT 提供者應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助函式會正規化上傳
        檔名，包括需要使用 M4A 格式檔名才能與轉錄 API
        相容的 AAC 上傳。
      </Tab>
      <Tab title="即時語音">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
        ```
        ```typescript
          label: "Acme 即時語音",
        ```
        ```typescript
          capabilities: {
        ```
        ```typescript
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
        ```
        ```typescript
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
        ```
        ```typescript
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
        ```
        ```typescript
            // 僅在提供者接受多個工具回應時才設定此項
        ```
        ```typescript
            // 單次呼叫，例如緊接著先回覆「處理中」再進行後續回覆
        ```
        ```typescript
            // 最終結果。
        ```
        ```typescript
            supportsToolResultContinuation: false,
            connect: async () => {},
        ```
        ```typescript
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
        ```
        ```typescript
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
        宣告 `capabilities`，讓 `talk.catalog` 能向瀏覽器和原生 Talk
        用戶端公開有效的模式、傳輸方式、音訊格式與功能旗標。當傳輸方式能偵測到
        使用者正在中斷助理播放，且提供者支援截斷或清除目前的音訊回應時，
        請實作 `handleBargeIn`。
        `submitToolResult` 可在同步提交時傳回 `void`，或傳回
        `Promise<void>`，作為提供者橋接層可公開的非同步完成邊界。閘道
        轉送工作階段會先等待該 promise，再確認最終結果或清除已連結的執行；
        提交失敗時，請拒絕該 promise。
        當提供者無法遵循 `options.suppressResponse` 時，請設定
        `supportsToolResultSuppression: false`。如此一來，OpenClaw 不會對
        內部強制諮詢與取消結果套用抑制，並會拒絕直接提出的結果抑制要求，
        而不是在未提示的情況下開始回應。
        `createRealtimeVoiceBridgeSession` 的使用者也可從 `onToolCall` 傳回
        promise；同步擲回的錯誤與遭拒絕的 promise 會路由至工作階段的
        `onError` 回呼。
        只有在提供者的 VAD 透過呼叫 `onClearAudio("barge-in")` 確認發生
        中斷時，才設定 `handlesInputAudioBargeIn`。省略此旗標的提供者會使用
        OpenClaw 的本機輸入音訊備援偵測。
      </Tab>
      <Tab title="媒體理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
        ```
        ```typescript
          describeImage: async (req) => ({ text: "一張……的照片" }),
        ```
        ```typescript
          transcribeAudio: async (req) => ({ text: "逐字稿..." }),
        ```
        ```typescript
        });
        ```
        本機或自行託管的媒體供應商若刻意不要求
        認證資訊，可以公開 `resolveAuth` 並回傳 `kind: "none"`。
        對於未明確選擇加入的供應商，OpenClaw 仍會保留一般的驗證閘門。
        現有供應商可以繼續讀取 `req.apiKey`；
        新供應商應優先使用 `req.auth`。

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
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

        請在 `contracts.embeddingProviders` 中宣告相同的 id。這是
        可重複使用向量產生的一般嵌入合約，也包括
        記憶搜尋。`registerMemoryEmbeddingProvider(...)` 是為現有
        記憶體專用配接器保留的已棄用相容性介面。
      </Tab>
      <Tab title="圖片與影片生成">
        圖片與影片功能採用**可感知模式**的結構。圖片
        供應商須宣告必要的 `generate` 與 `edit` 功能區塊；
        影片供應商則須宣告 `generate`、`imageToVideo` 和
        `videoToVideo`。像 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，不足以清楚表明
        是否支援轉換模式或停用哪些模式。音樂生成
        也遵循相同的 `generate` / `edit` 模式。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
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

        兩種提供者類型都必須設定 `capabilities`；`edit` 和
        影片轉換區塊（`imageToVideo`、`videoToVideo`）一律需要明確的
        `enabled` 旗標。

        當列出的模型之靜態模式或功能與提供者的預設值不同時，請使用 `catalogByModel`。
        此中繼資料可讓 `video_generate action=list` 和模型目錄保持正確，
        而無須叫用提供者程式碼。要求期間的功能查詢與強制執行
        仍應由 `resolveModelCapabilities` 和 `generateVideo` 負責；
        可行時，請為兩條路徑重複使用相同的功能常數。
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
          hint: "Search the web through Acme's search backend.",
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
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        兩種提供者類型共用相同的認證資訊接線結構：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 和 `createTool` 均為
        必填。
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

      it("有可用金鑰時傳回目錄", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("沒有金鑰時傳回 null 目錄", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 發布至 ClawHub

提供者外掛的發布方式與其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用於發布 skill
資料夾的不同命令，而不是外掛套件；請勿在此使用。

## 檔案結構

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 中繼資料
├── openclaw.plugin.json      # 包含提供者驗證中繼資料的資訊清單
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 測試
    └── usage.ts              # 用量端點（選用）
```

## 目錄順序參考

`catalog.order` 控制你的目錄相對於內建提供者的合併時機：

| 順序      | 執行時機          | 使用情境                               |
| --------- | ----------------- | -------------------------------------- |
| `simple`  | 第一輪            | 單純使用 API 金鑰的供應商              |
| `profile` | simple 之後       | 需要驗證設定檔的供應商                 |
| `paired`  | profile 之後      | 合成多個相關項目                       |
| `late`    | 最後一輪          | 覆寫現有供應商（衝突時優先）           |

## 後續步驟

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果你的外掛也提供頻道
- [SDK 執行階段](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助工具（TTS、搜尋、子代理）
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [外掛內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - 掛鉤詳細資訊與內建範例

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
