---
read_when:
    - 你正在建置新的模型提供者外掛
    - 你想要將 OpenAI 相容的代理或自訂 LLM 新增到 OpenClaw
    - 你需要了解提供者驗證、目錄和執行階段鉤子
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建立模型供應商外掛的逐步指南
title: 建置提供者外掛
x-i18n:
    generated_at: "2026-07-05T11:32:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 936227cf6e8d93c1a56ddf7e3e5f8613c1f430029a456d5acfdaa000ea7cdc94
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

建立 provider 外掛，將模型提供者（LLM）加入 OpenClaw：模型
目錄、API 金鑰驗證，以及動態模型解析。

<Info>
  初次接觸 OpenClaw 外掛？請先閱讀[開始使用](/zh-TW/plugins/building-plugins)，
  了解套件結構與 manifest 設定。
</Info>

<Tip>
  Provider 外掛會將模型加入 OpenClaw 的一般推論迴圈。如果
  模型必須透過擁有執行緒、壓縮或工具事件的原生代理程式常駐程式執行，
  請將 provider 搭配[代理程式框架](/zh-TW/plugins/sdk-agent-harness)，而不是把常駐程式協定
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

    `setup.providers[].envVars` 讓 OpenClaw 能在不載入你的外掛執行階段的情況下
    偵測憑證。當某個 provider 變體應該重用另一個 provider id 的驗證時，
    請加入 `providerAuthAliases`。`modelSupport` 是
    選用項目，可讓 OpenClaw 在執行階段 hooks 存在之前，依據像
    `acme-large` 這樣的簡寫模型 id 自動載入你的 provider 外掛。`package.json`
    中的 `openclaw.compat`
    和 `openclaw.build` 是發布到 ClawHub 的必要項目
    （`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`
    是兩個必填欄位；省略 `minGatewayVersion` 時會回退到
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="Register the provider">
    最小文字 provider 需要 `id`、`label`、`auth` 和 `catalog`。
    `catalog` 是 provider 擁有的執行階段/設定 hook；它可以呼叫即時
    vendor API，並回傳 `models.providers` entries。

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
    用於 list/help/picker UI，涵蓋 `text`、`voice`、`image_generation`、
    `video_generation` 和 `music_generation` rows。請將 vendor endpoint
    呼叫與回應映射保留在外掛中；OpenClaw 擁有共用 row
    shape、source labels，以及 help rendering。

    這就是一個可運作的 provider。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選取
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果你的 provider 暴露 `/models` 風格的 API，請將 provider 特定的
    endpoint 和 row 投影保留在你的外掛中，並使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 處理共用 fetch
    生命週期。這個 helper 會提供受防護的 HTTP fetch、provider-auth headers、
    結構化 HTTP errors、TTL 快取，以及靜態 fallback 行為，而不需要
    將 provider policy 放進 OpenClaw 核心。

    當即時 API 只告訴你目前可用的是哪些 provider 擁有的靜態目錄 rows 時，
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

    當 provider API 回傳更豐富的 metadata，而外掛需要自行將 rows
    投影為 OpenClaw model definitions 時，請使用
    `getCachedLiveProviderModelRows`：

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

    `run` 應保持受驗證控管，並在沒有可用憑證時回傳 `null`。
    保留離線 `staticRun` 或靜態 fallback，讓設定、文件、
    測試與選取器介面不依賴即時網路存取。使用適合模型清單新鮮度的 TTL，
    避免在請求期間輪詢檔案系統，並且只有在上游回應不是 OpenAI 相容的
    `{ data: [{ id, object }] }` shape 時，才傳入 provider 特定的
    `readRows` / `readModelId`。

    如果上游 provider 使用與 OpenClaw 不同的控制 token，請加入小型
    雙向文字轉換，而不是替換 stream path：

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

    `input` 會在傳輸前重寫最終 system prompt 和文字訊息內容。
    `output` 會在 OpenClaw 解析自身控制標記或 channel delivery 前，
    重寫 assistant 文字 deltas 和最終文字。

    對於只註冊一個文字 provider、使用 API 金鑰驗證，並搭配單一目錄支援執行階段的
    bundled providers，請優先使用範圍較窄的
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

    `buildProvider` 是 OpenClaw 能解析實際提供者驗證時使用的即時目錄路徑。它可以執行提供者專屬的探索。只有在驗證設定前可安全顯示的離線資料列，才使用 `buildStaticProvider`；它不得要求憑證或發出網路請求。OpenClaw 目前的 `models list --all` 顯示只會對內建提供者外掛執行靜態目錄，且使用空白設定、空白環境，並且沒有代理程式/工作區路徑。

    如果你的驗證流程在上線導引期間也需要修補 `models.providers.*`、別名，以及代理程式預設模型，請使用 `openclaw/plugin-sdk/provider-onboard` 的預設輔助工具。範圍最窄的輔助工具是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    當提供者的原生端點在一般 `openai-completions` 傳輸上支援串流用量區塊時，請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助工具，而不是硬編碼提供者 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應偵測支援，因此即使外掛使用自訂提供者 ID，原生 Moonshot/DashScope 風格端點仍可選擇啟用。

    上方的即時探索範例涵蓋 `/models` 風格的提供者 API。請將該探索保留在 `catalog.run` 內，並以可用驗證為門檻，同時讓 `staticRun` 不使用網路，以便產生離線目錄。

  </Step>

  <Step title="新增動態模型解析">
    如果你的提供者接受任意模型 ID（例如代理或路由器），請加入 `resolveDynamicModel`：

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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步暖機，`resolveDynamicModel` 會在完成後再次執行。

  </Step>

  <Step title="新增執行階段鉤子（視需要）">
    大多數提供者只需要 `catalog` + `resolveDynamicModel`。請依你的提供者需求逐步加入鉤子。

    共用輔助建構器現在涵蓋最常見的重放/工具相容性系列，因此外掛通常不需要逐一手動接線每個鉤子：

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

    目前可用的重放系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 相容傳輸的共用 OpenAI 風格重放政策，包括工具呼叫 ID 清理、assistant 優先排序修正，以及傳輸需要時的一般 Gemini 回合驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude 感知重放政策，因此 Anthropic 訊息傳輸只會在解析後模型實際是 Claude ID 時，取得 Claude 專屬思考區塊清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 與 `anthropic-by-model` 相同的依 Claude 模型政策，加上工具呼叫 ID 清理，以及必須保留供應商原生 ID 的傳輸所需的原生 Anthropic 工具使用 ID 保留 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | 原生 Gemini 重放政策加上啟動重放清理。共用系列會讓文字輸出 Gemini 命令列介面使用標記式 reasoning；直接的 `google` 提供者會將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 的思考會以原生 thought parts 到達。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 針對透過 OpenAI 相容代理傳輸執行的 Gemini 模型進行 Gemini thought-signature 清理；不會啟用原生 Gemini 重放驗證或啟動重寫 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 針對在同一外掛中混用 Anthropic 訊息和 OpenAI 相容模型表面的提供者的混合政策；選用的僅 Claude 思考區塊丟棄會限定在 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 接入內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共用串流路徑上的 Gemini 思考承載資料正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共用代理串流路徑上的 Kilo reasoning 包裝器，且 `kilo/auto` 和不支援的代理 reasoning ID 會略過注入的思考 | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 等級對應 Moonshot 二進位原生思考承載資料 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax fast-mode 模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共用原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、reasoning 相容承載資料塑形，以及 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 代理路由的 OpenRouter reasoning 包裝器，集中處理不支援模型/`auto` 略過 | `openrouter` |
    | `tool-stream-default-on` | 適用於 Z.AI 這類提供者的預設開啟 `tool_stream` 包裝器，除非明確停用，否則會使用工具串流 | `zai` |

    <Accordion title="支援系列建構器的 SDK 接縫">
      每個系列建構器都由同一套件匯出的較低階公開輔助工具組成；當提供者需要偏離常見模式時，你可以使用它們：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重放建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也匯出 Gemini 重放輔助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端點/模型輔助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容性（`createPlainTextToolCallCompatWrapper`），以及共用代理/提供者包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 用於熱門提供者路徑的輕量承載資料和事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層提供者結構描述輔助工具。

      對於 Gemini 系列提供者，請讓 reasoning 輸出模式與傳輸保持一致。直接的 Google Gemini API 提供者應使用 `native` reasoning 輸出，讓 OpenClaw 消耗原生 thought parts，而不加入 `<think>` / `<final>` prompt 指令。只輸出文字的 Gemini 命令列介面風格後端，若會剖析最終 JSON/文字回應，則可以保留共用的 `google-gemini` 標記式合約。

      有些串流輔助工具刻意保留在提供者本地。`@openclaw/anthropic-provider` 將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階 Anthropic 包裝器建構器保留在自己的公開 `api.ts` / `contract-api.ts` 接縫中，因為它們編碼 Claude OAuth beta 處理和 `context1m` 門檻。xAI 外掛同樣在自己的 `wrapStreamFn` 中保留原生 xAI Responses 塑形（`/fast` 別名、預設 `tool_stream`、不支援 strict-tool 清理、xAI 專屬 reasoning 承載資料移除）。

      相同的套件根模式也支援 `@openclaw/openai-provider`（提供者建構器、預設模型輔助工具、即時提供者建構器）和 `@openclaw/openrouter-provider`（提供者建構器加上上線導引/設定輔助工具）。
    </Accordion>

    <Tabs>
      <Tab title="權杖交換">
        對於需要在每次推論呼叫前進行權杖交換的提供者：

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
        對於需要自訂請求標頭或主體修改的提供者：

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
        對於需要在一般 HTTP 或 WebSocket 傳輸上提供原生請求/工作階段標頭或中繼資料的提供者：

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
        對於公開使用量/計費資料的提供者：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` 有三種結果。當提供者有使用量/計費憑證時，回傳 `{ token, accountId? }`。只有在提供者已明確處理使用量驗證、但沒有可用的使用量權杖，且 OpenClaw 必須略過通用 API 金鑰/OAuth 備援時，才回傳 `{ handled: true }`。當提供者未處理該請求且 OpenClaw 應繼續使用通用備援時，回傳 `null` 或 `undefined`。
      </Tab>
    </Tabs>

    <Accordion title="常見提供者鉤子">
      OpenClaw 會大致依照此順序呼叫模型/提供者外掛的鉤子。
      大多數提供者只會使用 2-3 個。這不是完整的 `ProviderPlugin`
      合約；如需完整且目前準確的鉤子清單與備援說明，請參閱[內部：提供者執行階段鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
      OpenClaw 不再呼叫、僅供相容性的提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列於此處。

      | 鉤子 | 使用時機 |
      | --- | --- |
      | `catalog` | 模型目錄或基底 URL 預設值 |
      | `applyConfigDefaults` | 設定具體化期間由提供者擁有的全域預設值 |
      | `normalizeModelId` | 查找前清理舊版/預覽模型 ID 別名 |
      | `normalizeTransport` | 通用模型組裝前清理提供者系列的 `api` / `baseUrl` |
      | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | `applyNativeStreamingUsageCompat` | 設定提供者的原生串流使用量相容性重寫 |
      | `resolveConfigApiKey` | 由提供者擁有的環境標記驗證解析 |
      | `resolveSyntheticAuth` | 本機/自架或設定支援的合成驗證 |
      | `resolveExternalAuthProfiles` | 為命令列介面/應用程式管理的憑證疊加由提供者擁有的外部驗證設定檔 |
      | `shouldDeferSyntheticProfileAuth` | 將合成的已儲存設定檔佔位符置於環境/設定驗證之後 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前非同步擷取中繼資料 |
      | `normalizeResolvedModel` | 執行器前的傳輸重寫 |
      | `normalizeToolSchemas` | 註冊前由提供者擁有的工具結構描述清理 |
      | `inspectToolSchemas` | 由提供者擁有的工具結構描述診斷 |
      | `resolveReasoningOutputMode` | 標記式與原生推理輸出合約 |
      | `prepareExtraParams` | 預設請求參數 |
      | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | `wrapStreamFn` | 一般串流路徑上的自訂標頭/主體包裝器 |
      | `resolveTransportTurnState` | 原生逐回合標頭/中繼資料 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭/冷卻時間 |
      | `formatApiKey` | 自訂執行階段權杖形狀 |
      | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | `buildAuthDoctorHint` | 驗證修復指引 |
      | `matchesContextOverflowError` | 由提供者擁有的溢位偵測 |
      | `classifyFailoverReason` | 由提供者擁有的速率限制/過載分類 |
      | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | `buildMissingAuthMessage` | 自訂缺少驗證提示 |
      | `augmentModelCatalog` | 合成的前向相容列（已棄用；偏好使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 特定模型的 `/think` 選項集 |
      | `isBinaryThinking` | 二元思考開/關相容性（已棄用；偏好使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支援相容性（已棄用；偏好使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 預設 `/think` 政策相容性（已棄用；偏好使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 即時/煙霧測試模型比對 |
      | `prepareRuntimeAuth` | 推論前權杖交換 |
      | `resolveUsageAuth` | 自訂使用量憑證剖析 |
      | `fetchUsageSnapshot` | 自訂使用量端點 |
      | `createEmbeddingProvider` | 由提供者擁有、用於記憶/搜尋的嵌入轉接器 |
      | `buildReplayPolicy` | 自訂逐字稿重播/壓縮政策 |
      | `sanitizeReplayHistory` | 通用清理後的提供者特定重播重寫 |
      | `validateReplayTurns` | 嵌入式執行器前的嚴格重播回合驗證 |
      | `onModelSelected` | 選取後回呼（例如遙測） |

      執行階段備援說明：

      - `normalizeConfig` 會為每個提供者 ID 解析一個擁有者外掛（先是內建提供者，接著是相符的執行階段外掛），並且只呼叫該鉤子；不會掃描其他提供者。Google 自己的 `normalizeConfig` 鉤子會正規化 `google` / `google-vertex` / `google-antigravity` 設定項目；它不是獨立的核心備援。
      - `resolveConfigApiKey` 會在公開時使用提供者鉤子。Amazon Bedrock 會將 AWS 環境標記解析保留在其提供者外掛中；當設定為 `auth: "aws-sdk"` 時，執行階段驗證本身仍使用 AWS SDK 預設鏈。
      - `resolveThinkingProfile(ctx)` 會接收選取的 `provider`、`modelId`、選用的合併後 `reasoning` 目錄提示，以及選用的合併後模型 `compat` 事實。僅使用 `compat` 來選取提供者的思考 UI/設定檔。
      - `resolveSystemPromptContribution` 讓提供者能為模型系列注入具快取感知的系統提示指引。當行為屬於單一提供者/模型系列，且應保留穩定/動態快取切分時，請優先使用它，而不是舊版的全外掛 `before_prompt_build` 鉤子。

    </Accordion>

  </Step>

  <Step title="新增額外功能（選用）">
    ### 步驟 5：新增額外功能

    提供者外掛可以在文字推論之外，註冊嵌入、語音、即時轉錄、
    即時語音、媒體理解、圖片生成、影片生成、
    網頁擷取和網頁搜尋。OpenClaw 將其分類為
    **混合功能**外掛；這是公司外掛的建議模式
    （每個供應商一個外掛）。請參閱
    [內部：功能擁有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 內，與現有的
    `api.registerProvider(...)` 呼叫一起註冊每項功能。只選擇你需要的分頁：

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
        外掛共用受限的錯誤主體讀取、JSON 錯誤剖析和
        請求 ID 後綴。
      </Tab>
      <Tab title="即時轉錄">
        偏好使用 `createRealtimeTranscriptionWebSocketSession(...)`；共用
        輔助工具會處理代理擷取、重新連線退避、關閉清空、就緒
        握手、音訊排隊，以及關閉事件診斷。你的外掛
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

        會 POST multipart 音訊的批次 STT 提供者，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助工具會正規化上傳
        檔名，包括需要 M4A 風格檔名才能相容轉錄 API 的 AAC 上傳。
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
            // 只有在提供者接受同一次呼叫的多個工具回應時才設定此項，
            // 例如先立即回傳 "working" 回應，接著再回傳
            // 最終結果。
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
        用戶端公開有效模式、傳輸、音訊格式與功能旗標。當傳輸能偵測到
        人類正在中斷助理播放，且提供者支援截斷或清除作用中的音訊回應時，
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

        有意不要求憑證的本機或自託管媒體提供者，可以公開 `resolveAuth`
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
      <Tab title="Embeddings">
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

        在 `contracts.embeddingProviders` 中宣告相同的 id。這是可重複使用向量產生的
        一般嵌入合約，包含記憶搜尋。`registerMemoryEmbeddingProvider(...)`
        是供既有記憶專用轉接器使用的已棄用相容性介面。
      </Tab>
      <Tab title="Image and video generation">
        圖像與影片功能使用**模式感知**的形狀。圖像提供者會宣告必要的
        `generate` 與 `edit` 功能區塊；影片提供者會宣告 `generate`、
        `imageToVideo` 與 `videoToVideo`。像 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，不足以清楚宣傳
        轉換模式支援或停用的模式。音樂產生也遵循相同的 `generate` /
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

        兩種提供者類型都必須有 `capabilities`；`edit` 與
        影片轉換區塊（`imageToVideo`、`videoToVideo`）一律需要明確的
        `enabled` 旗標。
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

提供者外掛的發佈方式與任何其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用於發佈 skill
資料夾的另一個命令，不是外掛套件；請勿在此使用。

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
| `simple`  | 第一輪        | 純 API 金鑰提供者                              |
| `profile` | simple 之後   | 受驗證設定檔管控的提供者                       |
| `paired`  | profile 之後  | 合成多個相關項目                               |
| `late`    | 最後一輪      | 覆寫既有提供者（衝突時勝出）                   |

## 下一步

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果你的外掛也提供頻道
- [SDK 執行階段](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助工具（TTS、搜尋、子代理）
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [外掛內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - hook 詳細資訊與內建範例

## 相關

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
