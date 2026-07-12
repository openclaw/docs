---
read_when:
    - 你正在建置新的模型提供者外掛
    - 你想要將相容於 OpenAI 的代理伺服器或自訂 LLM 新增至 OpenClaw
    - 你需要瞭解提供者驗證、目錄與執行階段掛鉤機制
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建立模型供應商外掛的逐步指南
title: 建置供應商外掛
x-i18n:
    generated_at: "2026-07-11T21:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

建立供應商外掛，為 OpenClaw 新增模型供應商（LLM）：模型目錄、API 金鑰驗證，以及動態模型解析。

<Info>
  第一次接觸 OpenClaw 外掛嗎？請先閱讀[入門指南](/zh-TW/plugins/building-plugins)，
  以瞭解套件結構與資訊清單設定。
</Info>

<Tip>
  供應商外掛會將模型新增至 OpenClaw 的一般推論迴圈。如果模型必須透過原生代理程式
  常駐服務執行，且該服務負責執行緒、壓縮或工具事件，請將供應商搭配
  [代理程式框架](/zh-TW/plugins/sdk-agent-harness)，而不要將常駐服務的通訊協定細節放入核心。
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

    `setup.providers[].envVars` 可讓 OpenClaw 在不載入外掛執行階段的情況下偵測憑證。
    當某個供應商變體應重複使用另一個供應商 ID 的驗證時，請新增
    `providerAuthAliases`。`modelSupport` 為選用設定，可讓 OpenClaw 在執行階段
    鉤子尚未存在前，根據 `acme-large` 這類簡寫模型 ID 自動載入供應商外掛。
    `package.json` 中的 `openclaw.compat` 與 `openclaw.build` 是發佈至 ClawHub
    的必要設定（兩個必填欄位為 `openclaw.compat.pluginApi` 與
    `openclaw.build.openclawVersion`；若省略 `minGatewayVersion`，則會退回使用
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="註冊供應商">
    最精簡的文字供應商需要 `id`、`label`、`auth` 與 `catalog`。
    `catalog` 是由供應商擁有的執行階段／設定鉤子；它可以呼叫即時供應商 API，
    並傳回 `models.providers` 項目。

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

    `registerModelCatalogProvider` 是較新的控制平面目錄介面，供清單、說明與選擇器
    UI 使用，涵蓋 `text`、`voice`、`image_generation`、`video_generation` 與
    `music_generation` 資料列。請將供應商端點呼叫與回應對應保留在外掛中；
    OpenClaw 負責共用資料列格式、來源標籤與說明呈現。

    至此即可得到可運作的供應商。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選取
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果供應商公開 `/models` 類型的 API，請將供應商專屬端點與資料列投影保留在
    外掛中，並使用 `openclaw/plugin-sdk/provider-catalog-live-runtime` 處理共用的
    擷取生命週期。此輔助工具提供受防護的 HTTP 擷取、供應商驗證標頭、結構化 HTTP
    錯誤、TTL 快取與靜態後援行為，無須將供應商策略放入 OpenClaw 核心。

    當即時 API 只會告知目前有哪些供應商所擁有的靜態目錄資料列可用時，請使用
    `buildLiveModelProviderConfig`：

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

    當供應商 API 傳回更豐富的中繼資料，而外掛需要自行將資料列投影為 OpenClaw
    模型定義時，請使用 `getCachedLiveProviderModelRows`：

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

    `run` 應維持受驗證控管，並在沒有可用憑證時傳回 `null`。請保留離線
    `staticRun` 或靜態後援，使設定、文件、測試與選擇器介面不會依賴即時網路存取。
    請依模型清單所需的新鮮度使用適當的 TTL、避免在要求處理期間輪詢檔案系統，
    並且僅在上游回應不是 OpenAI 相容的 `{ data: [{ id, object }] }` 格式時，
    才傳入供應商專屬的 `readRows`／`readModelId`。

    如果上游供應商使用的控制權杖與 OpenClaw 不同，請新增小型雙向文字轉換，
    而不要取代串流路徑：

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

    `input` 會在傳輸前重寫最終系統提示詞與文字訊息內容。`output` 會在 OpenClaw
    解析自身控制標記或傳遞至頻道前，重寫助理文字增量與最終文字。

    對於僅註冊一個文字供應商，並使用 API 金鑰驗證及單一目錄支援執行階段的內建
    供應商，請優先使用範圍更精簡的 `defineSingleProviderPluginEntry(...)` 輔助工具：

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
            hint: "來自 Acme AI 控制面板的 API 金鑰",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "輸入您的 Acme AI API 金鑰",
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

    `buildProvider` 是 OpenClaw 能解析真實供應商驗證資訊時所使用的即時目錄路徑。
    它可以執行供應商特定的探索。僅將 `buildStaticProvider` 用於在設定驗證資訊前可安全顯示的離線項目；
    它不得要求憑證或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會對內建供應商外掛執行靜態目錄，
    並使用空白設定、空白環境變數，且不提供代理程式／工作區路徑。

    如果您的驗證流程在初始設定期間還需要修補 `models.providers.*`、別名及
    代理程式預設模型，請使用 `openclaw/plugin-sdk/provider-onboard`
    提供的預設輔助函式。範圍最小的輔助函式為
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    當供應商的原生端點在一般 `openai-completions` 傳輸上支援串流用量區塊時，
    請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助函式，
    而非硬編碼供應商 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應表偵測支援情況，
    因此即使外掛使用自訂供應商 ID，原生 Moonshot／DashScope 類型的端點仍可選擇啟用。

    上述即時探索範例涵蓋 `/models` 類型的供應商 API。請將該探索保留在
    `catalog.run` 內，並以可用的驗證資訊為條件；同時讓 `staticRun`
    不使用網路，以便產生離線目錄。

  </Step>

  <Step title="新增動態模型解析">
    如果您的供應商接受任意模型 ID（例如代理或路由器），
    請新增 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 上述 id、label、auth、catalog

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
    大多數供應商只需要 `catalog` + `resolveDynamicModel`。請隨著供應商需求逐步新增掛鉤。

    共用輔助建構器現在涵蓋最常見的重播／工具相容性系列，
    因此外掛通常不需要逐一手動串接每個掛鉤：

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

    | 系列 | 串接的功能 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | 適用於 OpenAI 相容傳輸的共用 OpenAI 類型重播政策，包括工具呼叫 ID 清理、優先排列助理訊息的修正，以及傳輸需要時的通用 Gemini 輪次驗證 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 依 `modelId` 選擇的 Claude 感知重播政策，因此只有在解析出的模型確實為 Claude ID 時，Anthropic 訊息傳輸才會套用 Claude 特定的思考區塊清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 與 `anthropic-by-model` 相同的依模型選擇 Claude 政策，另加工具呼叫 ID 清理，以及為必須保留供應商原生 ID 的傳輸保留原生 Anthropic 工具使用 ID | `anthropic-vertex`、`clawrouter` |
    | `google-gemini` | 原生 Gemini 重播政策加上啟動重播清理。共用系列讓文字輸出的 Gemini 命令列介面使用標記式推理；直接的 `google` 供應商則將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 的思考內容會以原生思考部分送達。 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 為透過 OpenAI 相容代理傳輸執行的 Gemini 模型清理 Gemini 思考簽章；不會啟用原生 Gemini 重播驗證或啟動重寫 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在單一外掛中混用 Anthropic 訊息與 OpenAI 相容模型介面的供應商之混合政策；選用的僅限 Claude 思考區塊移除仍限定於 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 串接的功能 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 在共用串流路徑上正規化 Gemini 思考承載資料 | `google`、`google-gemini-cli` |
    | `kilocode-thinking` | 共用代理串流路徑上的 Kilo 推理包裝器，其中 `kilo/auto` 和不支援的代理推理 ID 會略過注入的思考內容 | `kilocode` |
    | `moonshot-thinking` | 依據設定 + `/think` 層級對應 Moonshot 二進位原生思考承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`、`minimax-portal` |
    | `openai-responses-defaults` | 共用的原生 OpenAI／Codex Responses 包裝器：來源標頭、`/fast`／`serviceTier`、文字詳細程度、原生 Codex 網路搜尋、推理相容承載資料塑形，以及 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 代理路由的 OpenRouter 推理包裝器，集中處理不支援的模型／`auto` 略過情況 | `openrouter` |
    | `tool-stream-default-on` | 適用於 Z.AI 等供應商的預設啟用 `tool_stream` 包裝器，除非明確停用，否則這些供應商會使用工具串流 | `zai` |

    <Accordion title="支援系列建構器的 SDK 接合介面">
      每個系列建構器都由同一套件匯出的較低階公開輔助函式組成；當供應商需要偏離常見模式時，您可以使用這些函式：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也會匯出 Gemini 重播輔助函式（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）及端點／模型輔助函式（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用 OpenAI／Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容包裝器（`createPlainTextToolCallCompatWrapper`），以及共用代理／供應商包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` — 適用於高頻供應商路徑的輕量承載資料與事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層供應商結構描述輔助函式。

      對於 Gemini 系列供應商，請讓推理輸出模式與傳輸保持一致。
      直接使用 Google Gemini API 的供應商應使用 `native`
      推理輸出，讓 OpenClaw 能取用原生思考部分，而不新增
      `<think>`／`<final>` 提示指令。僅限文字、會解析最終 JSON／文字回應的
      Gemini 命令列介面類型後端，可繼續使用共用的
      `google-gemini` 標記式合約。

      某些串流輔助函式刻意保留在供應商本地。`@openclaw/anthropic-provider` 將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 及較低階 Anthropic 包裝器建構器保留在自身公開的 `api.ts`／`contract-api.ts` 接合介面中，因為它們會編碼 Claude OAuth Beta 處理與 `context1m` 閘控。xAI 外掛同樣將原生 xAI Responses 塑形保留在自身的 `wrapStreamFn` 中（`/fast` 別名、預設 `tool_stream`、移除不支援的嚴格工具設定，以及移除 xAI 特定的推理承載資料）。

      相同的套件根目錄模式也支援 `@openclaw/openai-provider`（供應商建構器、預設模型輔助函式、即時供應商建構器）與 `@openclaw/openrouter-provider`（供應商建構器加上初始設定／配置輔助函式）。
    </Accordion>

    <Tabs>
      <Tab title="權杖交換">
        對於需要在每次推論呼叫前交換權杖的供應商：

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
        // wrapStreamFn 傳回衍生自 ctx.streamFn 的 StreamFn
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
        對於需要在通用 HTTP 或 WebSocket 傳輸上使用原生請求／工作階段標頭或中繼資料的供應商：

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

        `resolveUsageAuth` 有三種結果。當供應商具有用量／計費憑證時，回傳
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用欄位會將
        已解析設定檔中的非機密方案中繼資料傳入
        `fetchUsageSnapshot`）。只有當供應商已明確處理用量驗證，
        但沒有可用的用量權杖，而且 OpenClaw 必須略過通用
        API 金鑰／OAuth 備援時，才回傳
        `{ handled: true }`。當供應商未處理該請求，而 OpenClaw 應繼續使用
        通用備援時，回傳 `null` 或 `undefined`。

        在 `contracts.usageProviders` 中宣告供應商 ID。當該資訊清單
        合約與**兩個**鉤子都存在時，OpenClaw 會自動將
        該供應商納入用量收集，而不載入無關的供應商
        外掛。不需要更新核心允許清單。
        `fetchUsageSnapshot` 會回傳共用且不限定供應商的結構：

        - `plan`：供應商回報的訂閱或金鑰標籤
        - `windows`：以已使用百分比表示、可重設的配額區間
        - `billing`：具型別的 `balance`、`spend` 或 `budget` 項目；`unit` 可以是
          ISO 貨幣，或 `credits` 等供應商單位
        - `summary`：無法納入上述結構化欄位的精簡供應商特定內容

        請精確保留貨幣語意。除非上游合約如此規定，否則供應商點數並不等同於美元。
        僅實作 `fetchUsageSnapshot` 的外掛仍可供明確／合成呼叫者使用，
        但不會被自動探索，因為 OpenClaw 無法解析其用量憑證。
      </Tab>
    </Tabs>

    <Accordion title="常見供應商鉤子">
      對於模型／供應商外掛，OpenClaw 大致會依此順序呼叫鉤子。
      大多數供應商只會使用其中 2 至 3 個。這並非完整的 `ProviderPlugin`
      合約；如需完整且目前準確的鉤子清單與備援說明，請參閱[內部機制：供應商執行階段
      鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
      OpenClaw 不再呼叫、僅用於相容性的供應商欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，不會列於
      此處。

      | 鉤子 | 使用時機 |
      | --- | --- |
      | `catalog` | 模型目錄或基底 URL 預設值 |
      | `applyConfigDefaults` | 設定具現化期間由供應商擁有的全域預設值 |
      | `normalizeModelId` | 查詢前清理舊版／預覽版模型 ID 別名 |
      | `normalizeTransport` | 通用模型組裝前清理供應商系列的 `api`／`baseUrl` |
      | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | `applyNativeStreamingUsageCompat` | 針對設定供應商的原生串流用量相容性重寫 |
      | `resolveConfigApiKey` | 解析由供應商擁有的環境標記驗證 |
      | `resolveSyntheticAuth` | 本機／自行託管或由設定支援的合成驗證 |
      | `resolveExternalAuthProfiles` | 為命令列介面／應用程式管理的憑證疊加由供應商擁有的外部驗證設定檔 |
      | `shouldDeferSyntheticProfileAuth` | 將合成的已儲存設定檔預留位置排在環境／設定驗證之後 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前以非同步方式擷取中繼資料 |
      | `normalizeResolvedModel` | 執行器啟動前重寫傳輸方式 |
      | `normalizeToolSchemas` | 註冊前清理由供應商擁有的工具結構描述 |
      | `inspectToolSchemas` | 由供應商擁有的工具結構描述診斷 |
      | `resolveReasoningOutputMode` | 標記式與原生推理輸出合約 |
      | `prepareExtraParams` | 預設請求參數 |
      | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | `wrapStreamFn` | 一般串流路徑上的自訂標頭／主體包裝器 |
      | `resolveTransportTurnState` | 原生的每輪標頭／中繼資料 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭／冷卻時間 |
      | `formatApiKey` | 自訂執行階段權杖結構 |
      | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | `buildAuthDoctorHint` | 驗證修復指引 |
      | `matchesContextOverflowError` | 由供應商擁有的溢位偵測 |
      | `classifyFailoverReason` | 由供應商擁有的速率限制／過載分類 |
      | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | `augmentModelCatalog` | 合成的向前相容資料列（已棄用，建議改用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 選項集 |
      | `isBinaryThinking` | 二元思考開啟／關閉相容性（已棄用，建議改用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支援相容性（已棄用，建議改用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性（已棄用，建議改用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 即時／冒煙測試模型比對 |
      | `prepareRuntimeAuth` | 推論前交換權杖 |
      | `resolveUsageAuth` | 自訂用量憑證剖析 |
      | `fetchUsageSnapshot` | 自訂用量端點 |
      | `createEmbeddingProvider` | 由供應商擁有、供記憶／搜尋使用的嵌入配接器 |
      | `buildReplayPolicy` | 自訂逐字記錄重播／壓縮政策 |
      | `sanitizeReplayHistory` | 通用清理後的供應商特定重播重寫 |
      | `validateReplayTurns` | 嵌入式執行器啟動前嚴格驗證重播輪次 |
      | `onModelSelected` | 選擇後回呼（例如遙測） |

      執行階段備援說明：

      - `normalizeConfig` 會為每個供應商 ID 解析一個擁有者外掛（先處理內建供應商，再處理相符的執行階段外掛），且只呼叫該鉤子，不會掃描其他供應商。Google 自己的 `normalizeConfig` 鉤子會正規化 `google`／`google-vertex`／`google-antigravity` 設定項目；它不是獨立的核心備援。
      - 當供應商公開 `resolveConfigApiKey` 鉤子時，會使用該鉤子。Amazon Bedrock 會將 AWS 環境標記解析保留在其供應商外掛中；使用 `auth: "aws-sdk"` 設定時，執行階段驗證本身仍會使用 AWS SDK 預設鏈。
      - `resolveThinkingProfile(ctx)` 會接收所選的 `provider`、`modelId`、選用的合併後 `reasoning` 目錄提示，以及選用的合併後模型 `compat` 資訊。`compat` 只能用來選擇供應商的思考介面／設定檔。
      - `resolveSystemPromptContribution` 可讓供應商為某個模型系列注入可感知快取的系統提示指引。當行為屬於單一供應商／模型系列，且應保留穩定／動態快取分割時，請優先使用它，而非舊版的全外掛 `before_prompt_build` 鉤子。

    </Accordion>

  </Step>

  <Step title="新增額外功能（選用）">
    ### 步驟 5：新增額外功能

    供應商外掛可在文字推論之外，同時註冊嵌入、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取與網頁搜尋。OpenClaw 將此類型歸類為
    **混合功能**外掛，這也是公司外掛的建議模式
    （每個供應商使用一個外掛）。請參閱
    [內部機制：功能所有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    請在 `register(api)` 內，於現有的
    `api.registerProvider(...)` 呼叫旁註冊各項功能。只選擇所需的分頁：

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

        對於供應商 HTTP 失敗，請使用 `assertOkOrThrowProviderError(...)`，
        讓各外掛共用受限長度的錯誤主體讀取、JSON 錯誤剖析，以及
        請求 ID 後綴。
      </Tab>
      <Tab title="即時轉錄">
        建議使用 `createRealtimeTranscriptionWebSocketSession(...)`；此共用
        輔助函式會處理代理擷取、重新連線退避、關閉時清空、就緒
        交握、音訊排隊及關閉事件診斷。您的外掛
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

        透過 POST 傳送 multipart 音訊的批次 STT 提供者應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助函式會正規化上傳
        檔名，包括需要使用 M4A 樣式檔名以相容於轉錄 API 的 AAC
        上傳檔案。
      </Tab>
      <Tab title="即時語音">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        宣告 `capabilities`，讓 `talk.catalog` 能向瀏覽器及原生 Talk
        用戶端公開有效的模式、傳輸方式、音訊格式與功能旗標。當傳輸層能偵測到
        使用者正在中斷助理播放，且提供者支援截斷或清除目前的音訊回應時，
        請實作 `handleBargeIn`。
        `submitToolResult` 可在同步提交時傳回 `void`，或傳回
        `Promise<void>`，作為提供者橋接器可公開的非同步完成邊界。閘道
        中繼工作階段會等待該 promise，之後才確認最終結果或清除關聯的執行；
        提交失敗時應拒絕該 promise。
        當提供者無法遵循 `options.suppressResponse` 時，請設定
        `supportsToolResultSuppression: false`。OpenClaw 隨後會避免對
        內部強制諮詢及取消結果進行抑制，並拒絕直接提出的結果抑制請求，
        而不是在無提示的情況下啟動回應。
        `createRealtimeVoiceBridgeSession` 的使用者也可以從 `onToolCall`
        傳回 promise；同步擲回的例外與遭拒絕的 promise 都會轉送至
        工作階段的 `onError` 回呼。
        僅當提供者的 VAD 透過呼叫 `onClearAudio("barge-in")` 確認中斷時，
        才設定 `handlesInputAudioBargeIn`。未設定此旗標的提供者會使用
        OpenClaw 的本機輸入音訊備援偵測。
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

        刻意不要求憑證的本機或自行託管媒體提供者，可公開 `resolveAuth`
        並傳回 `kind: "none"`。
        對於未明確選擇加入的提供者，OpenClaw 仍會保留一般驗證閘門。
        現有提供者可繼續讀取 `req.apiKey`；新提供者應優先使用 `req.auth`。

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

        在 `contracts.embeddingProviders` 中宣告相同的 id。這是用於可重複使用之
        向量生成的一般嵌入合約，包括記憶搜尋。
        `registerMemoryEmbeddingProvider(...)` 是為現有記憶體專用配接器
        保留的已棄用相容介面。
      </Tab>
      <Tab title="影像與影片生成">
        影像與影片功能使用**模式感知**結構。影像提供者宣告必要的
        `generate` 與 `edit` 功能區塊；影片提供者則宣告 `generate`、
        `imageToVideo` 與 `videoToVideo`。如 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，
        不足以清楚公告轉換模式支援或已停用的模式。音樂生成遵循相同的
        `generate` / `edit` 模式。

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

        兩種提供者類型都必須提供 `capabilities`；`edit` 以及影片轉換區塊
        （`imageToVideo`、`videoToVideo`）一律需要明確的 `enabled` 旗標。

        當列出的模型之靜態模式或功能與提供者預設值不同時，請使用
        `catalogByModel`。此中繼資料可在不叫用提供者程式碼的情況下，
        確保 `video_generate action=list` 與模型目錄正確。
        請求期間的功能查詢與強制執行仍應由 `resolveModelCapabilities`
        和 `generateVideo` 負責；可行時，請讓兩條路徑重複使用相同的功能常數。
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

        兩種提供者類型共用相同的憑證接線結構：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 與 `createTool` 全部都是
        必要欄位。
      </Tab>
    </Tabs>

  </Step>

  <Step title="測試">
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

## 發布至 ClawHub

提供者外掛的發布方式與其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是另一個用來發布 Skills
資料夾的命令，而不是外掛套件；請勿在此使用。

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

`catalog.order` 控制目錄相對於內建提供者的合併時機：

| 順序      | 時機             | 使用情境                                     |
| --------- | ---------------- | -------------------------------------------- |
| `simple`  | 第一輪處理       | 純 API 金鑰提供者                            |
| `profile` | simple 之後      | 受驗證設定檔限制的提供者                     |
| `paired`  | profile 之後     | 合成多個相關項目                             |
| `late`    | 最後一輪處理     | 覆寫現有提供者（發生衝突時優先）             |

## 後續步驟

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果您的外掛也提供頻道
- [SDK 執行階段](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助工具（TTS、搜尋、子代理程式）
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [外掛內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - 鉤子詳細資訊與內建範例

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
