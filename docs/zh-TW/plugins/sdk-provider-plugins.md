---
read_when:
    - 您正在建置新的模型提供者外掛
    - 你想將 OpenAI 相容代理或自訂 LLM 新增到 OpenClaw
    - 你需要了解提供者身分驗證、目錄與執行階段掛鉤
sidebarTitle: Provider plugins
summary: 建置 OpenClaw 模型供應商外掛的逐步指南
title: 建置供應商外掛
x-i18n:
    generated_at: "2026-07-06T10:51:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7318081368f79acd46d09b07c52341977d3d7b0f5c187e428c38db2241bbdf0a
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

建置提供者外掛，將模型提供者（LLM）加入 OpenClaw：模型
目錄、API 金鑰驗證，以及動態模型解析。

<Info>
  第一次使用 OpenClaw 外掛？請先閱讀[入門](/zh-TW/plugins/building-plugins)，
  了解套件結構與 manifest 設定。
</Info>

<Tip>
  提供者外掛會將模型加入 OpenClaw 的一般推論迴圈。如果
  模型必須透過擁有執行緒、壓縮或工具事件的原生代理程式常駐程式執行，
  請將提供者搭配[代理程式
  harness](/zh-TW/plugins/sdk-agent-harness)，而不是把常駐程式協定
  細節放進核心。
</Tip>

## 逐步說明

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

    `setup.providers[].envVars` 讓 OpenClaw 不必載入你的外掛執行階段，
    就能偵測憑證。當某個提供者變體應重用另一個提供者 ID 的驗證時，
    請加入 `providerAuthAliases`。`modelSupport` 是選用項目，可讓 OpenClaw
    在執行階段 hook 存在之前，從像 `acme-large` 這樣的簡寫模型 ID
    自動載入你的提供者外掛。`package.json` 中的 `openclaw.compat`
    和 `openclaw.build` 是發布到 ClawHub 的必要項目
    （`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`
    是兩個必要欄位；省略 `minGatewayVersion` 時，會回退到
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="Register the provider">
    最小文字提供者需要 `id`、`label`、`auth` 和 `catalog`。
    `catalog` 是提供者擁有的執行階段/設定 hook；它可以呼叫即時
    廠商 API，並回傳 `models.providers` 項目。

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
    用於清單/說明/選擇器 UI，涵蓋 `text`、`voice`、`image_generation`、
    `video_generation` 和 `music_generation` 列。請將廠商端點呼叫
    與回應對應保留在外掛中；OpenClaw 擁有共用列形狀、
    來源標籤和說明呈現。

    這就是可運作的提供者。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選取
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果你的提供者公開 `/models` 風格的 API，請將提供者專屬
    端點與列投影保留在外掛中，並使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 來處理共用擷取
    生命週期。這個輔助工具提供受保護的 HTTP 擷取、提供者驗證標頭、
    結構化 HTTP 錯誤、TTL 快取和靜態回退行為，而不必把
    提供者政策放進 OpenClaw 核心。

    當即時 API 只告訴你目前可用的提供者自有靜態目錄列時，
    使用 `buildLiveModelProviderConfig`：

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

    當提供者 API 回傳更豐富的中繼資料，且外掛需要自行將列投影成
    OpenClaw 模型定義時，使用 `getCachedLiveProviderModelRows`：

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

    `run` 應保持由驗證控管，並在沒有可用憑證時回傳 `null`。
    保留離線 `staticRun` 或靜態回退，讓設定、文件、測試和選擇器介面
    不依賴即時網路存取。使用適合模型清單新鮮度的 TTL，
    避免請求期間的檔案系統輪詢，且只有在上游回應不是 OpenAI 相容的
    `{ data: [{ id, object }] }` 形狀時，才傳入提供者專屬的
    `readRows` / `readModelId`。

    如果上游提供者使用的控制 token 與 OpenClaw 不同，請加入小型
    雙向文字轉換，而不是替換串流路徑：

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

    `input` 會在傳輸前重寫最終系統提示和文字訊息內容。
    `output` 會在 OpenClaw 解析自己的控制標記或傳遞到頻道之前，
    重寫助理文字 delta 和最終文字。

    對於只註冊一個文字提供者、使用 API 金鑰驗證且搭配單一
    目錄支援執行階段的內建提供者，請優先使用範圍較窄的
    `defineSingleProviderPluginEntry(...)` 輔助工具：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型提供者",
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

    `buildProvider` 是 OpenClaw 能解析真實提供者驗證資訊時使用的即時目錄路徑。它可以執行提供者特定的探索。只將 `buildStaticProvider` 用於在設定驗證前可安全顯示的離線列；它不得需要憑證或發出網路請求。OpenClaw 的 `models list --all` 顯示目前只會針對內建提供者外掛執行靜態目錄，且使用空白設定、空白環境，以及沒有代理程式/工作區路徑。

    如果你的驗證流程在導覽設定期間也需要修補 `models.providers.*`、別名，以及代理程式預設模型，請使用 `openclaw/plugin-sdk/provider-onboard` 的預設輔助工具。範圍最窄的輔助工具是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    當提供者的原生端點在一般 `openai-completions` 傳輸上支援串流用量區塊時，請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助工具，而不是硬編碼提供者 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應偵測支援，因此即使外掛使用自訂提供者 ID，原生 Moonshot/DashScope 風格端點仍會選擇加入。

    上方的即時探索範例涵蓋 `/models` 風格的提供者 API。請將該探索保留在 `catalog.run` 內，以可用的驗證資訊作為閘門，並保持 `staticRun` 不使用網路，以產生離線目錄。

  </Step>

  <Step title="新增動態模型解析">
    如果你的提供者接受任意模型 ID（例如代理或路由器），請新增 `resolveDynamicModel`：

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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步暖身 - `resolveDynamicModel` 會在完成後再次執行。

  </Step>

  <Step title="新增執行階段鉤子（視需要）">
    多數提供者只需要 `catalog` + `resolveDynamicModel`。請依你的提供者需求逐步新增鉤子。

    共用輔助建構器現在涵蓋最常見的重播/工具相容系列，因此外掛通常不需要逐一手動連接每個鉤子：

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

    | 系列 | 連接內容 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | 針對 OpenAI 相容傳輸的共用 OpenAI 風格重播政策，包括工具呼叫 ID 清理、助理優先排序修正，以及傳輸需要時的通用 Gemini 回合驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude 感知重播政策，因此 Anthropic 訊息傳輸只會在解析後的模型實際上是 Claude ID 時取得 Claude 特定的思考區塊清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 與 `anthropic-by-model` 相同的依 Claude 模型政策，加上工具呼叫 ID 清理，以及針對必須保留廠商原生 ID 的傳輸保留原生 Anthropic 工具使用 ID | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | 原生 Gemini 重播政策加上啟動重播清理。共用系列讓文字輸出 Gemini 命令列介面維持標記式推理；直接的 `google` 提供者會將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 思考會以原生 thought parts 送達。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 針對透過 OpenAI 相容代理傳輸執行的 Gemini 模型進行 Gemini thought-signature 清理；不啟用原生 Gemini 重播驗證或啟動重寫 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 供在一個外掛中混合 Anthropic 訊息與 OpenAI 相容模型表面的提供者使用的混合政策；選用的僅限 Claude 思考區塊丟棄會保持限定於 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 連接內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共用串流路徑上的 Gemini 思考酬載正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共用代理串流路徑上的 Kilo 推理包裝器，且 `kilo/auto` 與不支援的代理推理 ID 會略過注入式思考 | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 層級對應 Moonshot 二進位原生思考酬載 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共用原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容酬載塑形，以及 Responses 脈絡管理 | `openai` |
    | `openrouter-thinking` | 代理路由的 OpenRouter 推理包裝器，不支援模型/`auto` 略過會集中處理 | `openrouter` |
    | `tool-stream-default-on` | 針對像 Z.AI 這類除非明確停用否則想要工具串流的提供者，預設啟用的 `tool_stream` 包裝器 | `zai` |

    <Accordion title="支援系列建構器的 SDK 邊界">
      每個系列建構器都由同一套件匯出的較低階公開輔助工具組成，當提供者需要偏離常見模式時可以使用：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也匯出 Gemini 重播輔助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）與端點/模型輔助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容（`createPlainTextToolCallCompatWrapper`），以及共用代理/提供者包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 用於熱門提供者路徑的輕量酬載與事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層提供者結構描述輔助工具。

      對於 Gemini 系列提供者，請讓推理輸出模式與傳輸保持一致。直接的 Google Gemini API 提供者應使用 `native` 推理輸出，讓 OpenClaw 消耗原生 thought parts，而不新增 `<think>` / `<final>` 提示指令。僅文字的 Gemini 命令列介面風格後端若會解析最終 JSON/文字回應，可以保留共用的 `google-gemini` 標記式合約。

      有些串流輔助工具刻意保持提供者本地。`@openclaw/anthropic-provider` 會將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階 Anthropic 包裝器建構器保留在自己的公開 `api.ts` / `contract-api.ts` 邊界中，因為它們編碼 Claude OAuth beta 處理與 `context1m` 閘門。xAI 外掛同樣在自己的 `wrapStreamFn` 中保留原生 xAI Responses 塑形（`/fast` 別名、預設 `tool_stream`、不支援 strict-tool 清理、xAI 特定推理酬載移除）。

      相同的套件根模式也支援 `@openclaw/openai-provider`（提供者建構器、預設模型輔助工具、即時提供者建構器）與 `@openclaw/openrouter-provider`（提供者建構器加上導覽設定/設定輔助工具）。
    </Accordion>

    <Tabs>
      <Tab title="權杖交換">
        對於需要在每次推論呼叫前交換權杖的提供者：

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
        對於需要自訂請求標頭或本文修改的提供者：

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

        `resolveUsageAuth` 有三種結果。當提供者具有用量/計費憑證時，回傳 `{ token, accountId? }`。只有在提供者已明確處理用量驗證，但沒有可用的用量權杖，且 OpenClaw 必須略過通用 API 金鑰/OAuth 後援時，才回傳 `{ handled: true }`。當提供者未處理該請求，且 OpenClaw 應繼續使用通用後援時，回傳 `null` 或 `undefined`。

        在 `contracts.usageProviders` 中宣告提供者 ID。當該 manifest
        contract 與**兩個** hook 都存在時，OpenClaw 會自動將該提供者納入用量收集，而不載入無關的提供者
        外掛。無需更新核心 allowlist。
        `fetchUsageSnapshot` 會回傳共享的提供者中立形狀：

        - `plan`：提供者回報的訂閱或金鑰標籤
        - `windows`：以已使用百分比表示的可重設配額視窗
        - `billing`：具型別的 `balance`、`spend` 或 `budget` 項目；`unit` 可以是
          ISO 貨幣，或提供者單位，例如 `credits`
        - `summary`：不適合放入這些結構化欄位的精簡提供者特定脈絡

        保持貨幣語意精確。除非上游 contract 如此說明，否則提供者點數不是 USD。僅實作
        `fetchUsageSnapshot` 的外掛仍可供明確/合成呼叫者使用，但不會被自動探索，因為 OpenClaw 無法解析其用量憑證。
      </Tab>
    </Tabs>

    <Accordion title="常見提供者 hook">
      OpenClaw 對 model/provider 外掛大致依照以下順序呼叫 hook。
      多數提供者只使用 2-3 個。這不是完整的 `ProviderPlugin`
      contract - 請參閱[內部：提供者執行階段
      Hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)，以取得完整且目前準確的 hook 清單與後援註記。
      OpenClaw 不再呼叫的僅相容性提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列於此處。

      | Hook | 使用時機 |
      | --- | --- |
      | `catalog` | 模型目錄或基底 URL 預設值 |
      | `applyConfigDefaults` | config materialization 期間由提供者擁有的全域預設值 |
      | `normalizeModelId` | 查找前清理舊版/預覽 model-id 別名 |
      | `normalizeTransport` | 通用模型組裝前清理提供者家族 `api` / `baseUrl` |
      | `normalizeConfig` | 正規化 `models.providers.<id>` config |
      | `applyNativeStreamingUsageCompat` | config providers 的原生串流用量相容性重寫 |
      | `resolveConfigApiKey` | 提供者擁有的 env-marker auth 解析 |
      | `resolveSyntheticAuth` | 本機/自託管或 config-backed 合成 auth |
      | `resolveExternalAuthProfiles` | 為命令列介面/應用程式管理憑證疊加提供者擁有的外部 auth profiles |
      | `shouldDeferSyntheticProfileAuth` | 將合成 stored-profile placeholders 降到 env/config auth 後面 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | `normalizeResolvedModel` | runner 前的傳輸重寫 |
      | `normalizeToolSchemas` | 註冊前由提供者擁有的 tool-schema 清理 |
      | `inspectToolSchemas` | 由提供者擁有的 tool-schema 診斷 |
      | `resolveReasoningOutputMode` | 標記式與原生 reasoning-output contract |
      | `prepareExtraParams` | 預設請求參數 |
      | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | `wrapStreamFn` | 一般串流路徑上的自訂 headers/body wrappers |
      | `resolveTransportTurnState` | 原生每回合 headers/metadata |
      | `resolveWebSocketSessionPolicy` | 原生 WS session headers/cool-down |
      | `formatApiKey` | 自訂執行階段 token 形狀 |
      | `refreshOAuth` | 自訂 OAuth refresh |
      | `buildAuthDoctorHint` | auth 修復指引 |
      | `matchesContextOverflowError` | 提供者擁有的 overflow 偵測 |
      | `classifyFailoverReason` | 提供者擁有的 rate-limit/overload 分類 |
      | `isCacheTtlEligible` | Prompt cache TTL 閘控 |
      | `buildMissingAuthMessage` | 自訂 missing-auth 提示 |
      | `augmentModelCatalog` | 合成 forward-compat rows（已棄用 - 請優先使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定 `/think` option set |
      | `isBinaryThinking` | 二元思考開/關相容性（已棄用 - 請優先使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` reasoning 支援相容性（已棄用 - 請優先使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 預設 `/think` policy 相容性（已棄用 - 請優先使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | live/smoke model matching |
      | `prepareRuntimeAuth` | 推論前的 token exchange |
      | `resolveUsageAuth` | 自訂用量憑證解析 |
      | `fetchUsageSnapshot` | 自訂用量 endpoint |
      | `createEmbeddingProvider` | 由提供者擁有、用於 memory/search 的 embedding adapter |
      | `buildReplayPolicy` | 自訂 transcript replay/壓縮 policy |
      | `sanitizeReplayHistory` | 通用清理後的提供者特定 replay 重寫 |
      | `validateReplayTurns` | embedded runner 前的嚴格 replay-turn 驗證 |
      | `onModelSelected` | 選取後 callback（例如 telemetry） |

      執行階段後援註記：

      - `normalizeConfig` 會為每個提供者 ID 解析一個擁有它的外掛（先是 bundled providers，再是相符的 runtime plugin），並且只呼叫該 hook - 不會掃描其他提供者。Google 自己的 `normalizeConfig` hook 會正規化 `google` / `google-vertex` / `google-antigravity` config entries；它不是獨立的核心後援。
      - `resolveConfigApiKey` 會在公開時使用提供者 hook。Amazon Bedrock 將 AWS env-marker resolution 保留在其提供者外掛中；runtime auth 本身在設定為 `auth: "aws-sdk"` 時仍使用 AWS SDK default chain。
      - `resolveThinkingProfile(ctx)` 會接收選取的 `provider`、`modelId`、可選的合併 `reasoning` catalog hint，以及可選的合併模型 `compat` facts。僅使用 `compat` 來選擇提供者的 thinking UI/profile。
      - `resolveSystemPromptContribution` 讓提供者能為模型家族注入具 cache-awareness 的 system-prompt guidance。當行為屬於單一 provider/model family 且應保留 stable/dynamic cache split 時，請優先使用它，而不是舊版 plugin-wide `before_prompt_build` hook。

    </Accordion>

  </Step>

  <Step title="新增額外能力（選用）">
    ### 步驟 5：新增額外能力

    提供者外掛可以在文字推論旁註冊 embeddings、speech、realtime transcription、
    realtime voice、media understanding、image generation、video generation、
    web fetch 與 web search。OpenClaw 將此分類為
    **hybrid-capability** 外掛 - 這是公司外掛的建議模式
    （每個供應商一個外掛）。請參閱
    [內部：能力擁有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，於現有的
    `api.registerProvider(...)` 呼叫旁註冊每項能力。只選擇你需要的分頁：

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

        使用 `assertOkOrThrowProviderError(...)` 處理提供者 HTTP 失敗，讓
        外掛共用有上限的錯誤本文讀取、JSON 錯誤解析，以及
        request-id suffixes。
      </Tab>
      <Tab title="即時轉錄">
        優先使用 `createRealtimeTranscriptionWebSocketSession(...)` - 這個共享
        helper 會處理 proxy capture、reconnect backoff、close flushing、ready
        handshakes、audio queueing，以及 close-event diagnostics。你的外掛
        只需對應上游 events。

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

        批次 STT 提供者若會 POST multipart 音訊，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助函式會正規化上傳
        檔名，包括需要 M4A 風格檔名以相容轉錄 API 的 AAC 上傳。
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
        用戶端公開有效模式、傳輸、音訊格式與功能旗標。當傳輸可偵測到
        使用者正在中斷助理播放，且提供者支援截斷或清除作用中的音訊回應時，
        請實作 `handleBargeIn`。
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

        本機或自架、且刻意不需要憑證的媒體提供者，可以公開 `resolveAuth`
        並回傳 `kind: "none"`。對於未明確選擇加入的提供者，OpenClaw
        仍會保留一般驗證閘門。既有提供者可以繼續讀取 `req.apiKey`；
        新提供者應優先使用 `req.auth`。

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

        在 `contracts.embeddingProviders` 中宣告相同 id。這是可重複使用
        向量產生的一般嵌入合約，包括記憶搜尋。
        `registerMemoryEmbeddingProvider(...)` 是為既有記憶專用配接器保留的
        已棄用相容性。
      </Tab>
      <Tab title="圖片與影片生成">
        圖片與影片能力使用**模式感知**形狀。圖片提供者會宣告必要的
        `generate` 與 `edit` 能力區塊；影片提供者會宣告 `generate`、
        `imageToVideo` 與 `videoToVideo`。像 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，不足以乾淨地
        宣告轉換模式支援或已停用模式。音樂生成也遵循相同的 `generate` /
        `edit` 模式。

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

        兩種提供者類型都必須有 `capabilities`；`edit` 和影片轉換區塊
        (`imageToVideo`, `videoToVideo`) 一律需要明確的 `enabled` 旗標。
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

        兩種提供者類型共用相同的憑證接線形狀：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 與 `createTool` 全部都是
        必要項目。
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

## 發布到 ClawHub

提供者外掛的發布方式與任何其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用來發布 skill
資料夾的不同命令，不是外掛套件，請勿在這裡使用。

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

| 順序      | 時機          | 使用案例                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API 金鑰提供者                             |
| `profile` | simple 之後   | 以驗證設定檔作為閘門的提供者                   |
| `paired`  | profile 之後  | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫既有提供者（衝突時勝出）                   |

## 後續步驟

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果你的外掛也提供頻道
- [SDK 執行階段](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助函式（TTS、搜尋、子代理）
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [外掛內部](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - hook 詳細資訊與內建範例

## 相關

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
