---
read_when:
    - 你正在建置新的模型供應商外掛
    - 你想要將 OpenAI 相容代理或自訂 LLM 加入 OpenClaw
    - 你需要了解提供者驗證、目錄和執行階段鉤子
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建置模型提供者外掛的逐步指南
title: 建置提供者外掛
x-i18n:
    generated_at: "2026-06-27T19:48:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南逐步說明如何建構會將模型供應商（LLM）新增到 OpenClaw 的供應商外掛。完成後，你將擁有一個具備模型型錄、API 金鑰驗證，以及動態模型解析的供應商。

<Info>
  如果你之前沒有建構過任何 OpenClaw 外掛，請先閱讀
  [開始使用](/zh-TW/plugins/building-plugins)，了解基本套件結構與 manifest 設定。
</Info>

<Tip>
  供應商外掛會將模型加入 OpenClaw 的一般推論迴圈。如果模型必須透過擁有執行緒、壓縮或工具事件的原生 agent daemon 執行，請將供應商搭配 [agent harness](/zh-TW/plugins/sdk-agent-harness)，而不是把 daemon 協定細節放進核心。
</Tip>

## 逐步教學

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

    manifest 會宣告 `setup.providers[].envVars`，讓 OpenClaw 不必載入你的外掛執行階段也能偵測憑證。當某個供應商變體應該重用另一個供應商 ID 的驗證時，請加入 `providerAuthAliases`。`modelSupport` 是選用項目，可讓 OpenClaw 在執行階段 hook 存在之前，依據像 `acme-large` 這樣的簡寫模型 ID 自動載入你的供應商外掛。如果你在 ClawHub 發佈供應商，`package.json` 中必須包含這些 `openclaw.compat` 與 `openclaw.build` 欄位。

  </Step>

  <Step title="Register the provider">
    最小文字供應商需要 `id`、`label`、`auth` 與 `catalog`。`catalog` 是供應商擁有的執行階段/設定 hook；它可以呼叫即時供應商 API，並回傳 `models.providers` 項目。

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

    `registerModelCatalogProvider` 是較新的控制平面型錄介面，用於清單/說明/選擇器 UI。請將它用於文字、圖片生成、影片生成與音樂生成列。將供應商端點呼叫與回應對應保留在外掛中；OpenClaw 負責共用的列形狀、來源標籤與說明呈現。

    這就是可運作的供應商。使用者現在可以執行
    `openclaw onboard --acme-ai-api-key <key>`，並選擇
    `acme-ai/acme-large` 作為模型。

    ### 即時模型探索

    如果你的供應商公開 `/models` 風格的 API，請將供應商特定端點與列投影保留在外掛中，並使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 處理共用擷取生命週期。這個 helper 提供受保護的 HTTP 擷取、供應商驗證標頭、結構化 HTTP 錯誤、TTL 快取，以及靜態備援行為，而不需要把供應商政策放進 OpenClaw 核心。

    當即時 API 只告訴你目前有哪些供應商擁有的靜態型錄列可用時，請使用 `buildLiveModelProviderConfig`：

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

    當供應商 API 回傳較豐富的中繼資料，而外掛需要自行將列投影為 OpenClaw 模型定義時，請使用 `getCachedLiveProviderModelRows`：

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

    `run` 應維持以驗證為門檻，並在沒有可用憑證時回傳 `null`。保留離線 `staticRun` 或靜態備援，讓設定、文件、測試與選擇器介面不依賴即時網路存取。請使用適合模型清單新鮮度的 TTL、避免在請求時間輪詢檔案系統，且只有在上游回應不是 OpenAI 相容的 `{ data: [{ id, object }] }` 形狀時，才傳入供應商特定的 `readRows` / `readModelId`。

    如果上游供應商使用的控制 token 與 OpenClaw 不同，請加入小型雙向文字轉換，而不是取代串流路徑：

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

    `input` 會在傳輸前重寫最終系統提示與文字訊息內容。`output` 會在 OpenClaw 解析自己的控制標記或通道投遞之前，重寫助理文字 delta 與最終文字。

    對於只註冊一個文字供應商、使用 API 金鑰驗證，並搭配單一型錄支援執行階段的內建供應商，請優先使用較窄的
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

    `buildProvider` 是 OpenClaw 可解析真實提供者驗證時使用的即時目錄路徑。它可以執行提供者特定的探索。只有在驗證設定前可安全顯示的離線列，才使用 `buildStaticProvider`；它不得要求憑證或發出網路請求。OpenClaw 的 `models list --all` 顯示目前只會針對內建提供者外掛執行靜態目錄，且使用空設定、空環境，以及沒有代理程式／工作區路徑。

    如果你的驗證流程在導覽設定期間也需要修補 `models.providers.*`、別名，以及代理程式預設模型，請使用 `openclaw/plugin-sdk/provider-onboard` 的預設輔助工具。最窄範圍的輔助工具是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    當提供者的原生端點在一般 `openai-completions` 傳輸層上支援串流用量區塊時，請優先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄輔助工具，而不是硬編碼提供者 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 會從端點能力對應偵測支援，因此即使外掛使用自訂提供者 ID，原生 Moonshot/DashScope 風格端點仍會選擇啟用。

    上述即時探索範例涵蓋 `/models` 風格的提供者 API。請將該探索保留在 `catalog.run` 內，以可用驗證作為門檻，並讓 `staticRun` 不使用網路，以便產生離線目錄。

  </Step>

  <Step title="Add dynamic model resolution">
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

    如果解析需要網路呼叫，請使用 `prepareDynamicModel` 進行非同步暖機，完成後會再次執行 `resolveDynamicModel`。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多數提供者只需要 `catalog` + `resolveDynamicModel`。依照你的提供者需求逐步新增鉤子。

    共用輔助建構器現在涵蓋最常見的重播／工具相容系列，因此外掛通常不需要逐一手動接線每個鉤子：

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

    | 系列 | 接線內容 | 內建範例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 相容傳輸層的共用 OpenAI 風格重播政策，包括工具呼叫 ID 清理、助理優先排序修正，以及傳輸層需要時的一般 Gemini 回合驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 選擇的 Claude 感知重播政策，因此 Anthropic 訊息傳輸層只有在解析出的模型實際上是 Claude ID 時，才會取得 Claude 專用的 thinking 區塊清理 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini 重播政策加上啟動重播清理。共用系列會讓文字輸出的 Gemini 命令列介面維持標記式推理；直接的 `google` 提供者會將 `resolveReasoningOutputMode` 覆寫為 `native`，因為 Gemini API 的 thinking 會以原生 thought parts 抵達。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 針對透過 OpenAI 相容代理傳輸層執行的 Gemini 模型進行 Gemini thought-signature 清理；不會啟用原生 Gemini 重播驗證或啟動重寫 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在同一外掛中混合 Anthropic 訊息與 OpenAI 相容模型表面的提供者的混合政策；選用的僅限 Claude thinking 區塊丟棄會維持限定於 Anthropic 端 | `minimax` |

    目前可用的串流系列：

    | 系列 | 接線內容 | 內建範例 |
    | --- | --- | --- |
    | `google-thinking` | 共用串流路徑上的 Gemini thinking 承載正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共用代理串流路徑上的 Kilo 推理包裝器，且 `kilo/auto` 和不支援的代理推理 ID 會略過注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 從設定 + `/think` 等級對應 Moonshot 二進位原生 thinking 承載 | `moonshot` |
    | `minimax-fast-mode` | 共用串流路徑上的 MiniMax 快速模式模型重寫 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共用原生 OpenAI/Codex Responses 包裝器：歸因標頭、`/fast`/`serviceTier`、文字詳細程度、原生 Codex 網頁搜尋、推理相容承載塑形，以及 Responses context management | `openai` |
    | `openrouter-thinking` | 代理路由的 OpenRouter 推理包裝器，並集中處理不支援模型／`auto` 略過 | `openrouter` |
    | `tool-stream-default-on` | 適用於像 Z.AI 這類除非明確停用、否則希望工具串流的提供者的預設啟用 `tool_stream` 包裝器 | `zai` |

    <Accordion title="SDK seams powering the family builders">
      每個系列建構器都由同一套件匯出的較低階公開輔助工具組成；當提供者需要偏離常見模式時，你可以使用這些工具：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重播建構器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。也會匯出 Gemini 重播輔助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端點／模型輔助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共用 OpenAI/Codex 包裝器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 相容包裝器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking 預填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、純文字工具呼叫相容（`createPlainTextToolCallCompatWrapper`），以及共用代理／提供者包裝器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 適用於熱提供者路徑的輕量承載與事件包裝器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底層提供者結構描述輔助工具。

      對於 Gemini 系列提供者，請讓推理輸出模式與傳輸層保持一致。直接的 Google Gemini API 提供者應使用 `native` 推理輸出，讓 OpenClaw 消耗原生 thought parts，而不加入 `<think>` / `<final>` 提示指令。只輸出文字、並解析最終 JSON／文字回應的 Gemini 命令列介面風格後端，可以保留共用的 `google-gemini` 標記式合約。

      有些串流輔助工具刻意保留為提供者本機專用。`@openclaw/anthropic-provider` 將 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及較低階的 Anthropic 包裝器建構器，保留在它自己的公開 `api.ts` / `contract-api.ts` 接縫中，因為它們會編碼 Claude OAuth beta 處理和 `context1m` 門檻。xAI 外掛同樣將原生 xAI Responses 塑形保留在自己的 `wrapStreamFn` 中（`/fast` 別名、預設 `tool_stream`、不支援的 strict-tool 清理、xAI 專用推理承載移除）。

      同樣的套件根模式也支援 `@openclaw/openai-provider`（提供者建構器、預設模型輔助工具、即時提供者建構器）和 `@openclaw/openrouter-provider`（提供者建構器加上導覽設定／設定輔助工具）。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        對於每次推論呼叫前需要交換權杖的提供者：

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
        對於需要自訂請求標頭或修改主體的提供者：

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
        對於需要在一般 HTTP 或 WebSocket 傳輸層上提供原生請求／工作階段標頭或中繼資料的提供者：

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

        `resolveUsageAuth` 有三種結果。當提供者具有用量/計費憑證時，
        回傳 `{ token, accountId? }`。只有在提供者已明確處理用量
        auth、但沒有可用的用量 token，且 OpenClaw 必須略過通用
        API-key/OAuth 後援時，才回傳 `{ handled: true }`。當提供者未
        處理該請求，而 OpenClaw 應繼續使用通用後援時，回傳 `null` 或
        `undefined`。
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw 會依此順序呼叫掛鉤。大多數提供者只使用 2-3 個：
      OpenClaw 不再呼叫的僅相容性提供者欄位，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，未列在
      此處。

      | # | 掛鉤 | 使用時機 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目錄或基底 URL 預設值 |
      | 2 | `applyConfigDefaults` | 設定具體化期間由提供者擁有的全域預設值 |
      | 3 | `normalizeModelId` | 查找前清理舊版/預覽模型 ID 別名 |
      | 4 | `normalizeTransport` | 通用模型組裝前清理提供者家族的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 正規化 `models.providers.<id>` 設定 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定提供者的原生串流用量相容性重寫 |
      | 7 | `resolveConfigApiKey` | 由提供者擁有的 env-marker auth 解析 |
      | 8 | `resolveSyntheticAuth` | 本機/自託管或設定支援的合成 auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | 將合成儲存設定檔佔位符置於 env/config auth 之後 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前的非同步中繼資料擷取 |
      | 12 | `normalizeResolvedModel` | 執行器前的傳輸重寫 |
      | 13 | `normalizeToolSchemas` | 註冊前由提供者擁有的工具結構描述清理 |
      | 14 | `inspectToolSchemas` | 由提供者擁有的工具結構描述診斷 |
      | 15 | `resolveReasoningOutputMode` | 標記式與原生 reasoning-output 合約 |
      | 16 | `prepareExtraParams` | 預設請求參數 |
      | 17 | `createStreamFn` | 完全自訂的 StreamFn 傳輸 |
      | 19 | `wrapStreamFn` | 一般串流路徑上的自訂標頭/本文包裝器 |
      | 20 | `resolveTransportTurnState` | 原生每回合標頭/中繼資料 |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS 工作階段標頭/冷卻 |
      | 22 | `formatApiKey` | 自訂執行階段 token 形狀 |
      | 23 | `refreshOAuth` | 自訂 OAuth 重新整理 |
      | 24 | `buildAuthDoctorHint` | Auth 修復指引 |
      | 25 | `matchesContextOverflowError` | 由提供者擁有的溢位偵測 |
      | 26 | `classifyFailoverReason` | 由提供者擁有的速率限制/過載分類 |
      | 27 | `isCacheTtlEligible` | 提示快取 TTL 閘控 |
      | 28 | `buildMissingAuthMessage` | 自訂缺少 auth 提示 |
      | 29 | `augmentModelCatalog` | 合成前向相容列 |
      | 30 | `resolveThinkingProfile` | 模型特定的 `/think` 選項集 |
      | 31 | `isBinaryThinking` | 二元思考開/關相容性 |
      | 32 | `supportsXHighThinking` | `xhigh` 推理支援相容性 |
      | 33 | `resolveDefaultThinkingLevel` | 預設 `/think` 策略相容性 |
      | 34 | `isModernModelRef` | 即時/煙霧測試模型比對 |
      | 35 | `prepareRuntimeAuth` | 推論前 token 交換 |
      | 36 | `resolveUsageAuth` | 自訂用量憑證剖析 |
      | 37 | `fetchUsageSnapshot` | 自訂用量端點 |
      | 38 | `createEmbeddingProvider` | 由提供者擁有、用於記憶/搜尋的嵌入介面卡 |
      | 39 | `buildReplayPolicy` | 自訂逐字稿重播/壓縮策略 |
      | 40 | `sanitizeReplayHistory` | 通用清理後的提供者特定重播重寫 |
      | 41 | `validateReplayTurns` | 嵌入式執行器前的嚴格重播回合驗證 |
      | 42 | `onModelSelected` | 選擇後回呼（例如遙測） |

      執行階段後援注意事項：

      - `normalizeConfig` 會先檢查相符的提供者，然後檢查其他具備掛鉤能力的提供者外掛，直到其中一個實際變更設定為止。如果沒有提供者掛鉤重寫受支援的 Google 家族設定項目，仍會套用內建的 Google 設定正規化器。
      - `resolveConfigApiKey` 會在提供者掛鉤公開時使用它。Amazon Bedrock 將 AWS env-marker 解析保留在其提供者外掛中；當以 `auth: "aws-sdk"` 設定時，執行階段 auth 本身仍使用 AWS SDK 預設鏈。
      - `resolveThinkingProfile(ctx)` 會收到選取的 `provider`、`modelId`、選用的合併 `reasoning` 目錄提示，以及選用的合併模型 `compat` 事實。只使用 `compat` 來選取提供者的思考 UI/設定檔。
      - `resolveSystemPromptContribution` 讓提供者能為模型家族注入具快取感知的系統提示指引。當行為屬於某個提供者/模型家族，且應保留穩定/動態快取切分時，請優先使用它，而不是 `before_prompt_build`。

      如需詳細說明與真實世界範例，請參閱[內部：提供者執行階段掛鉤](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### 步驟 5：新增額外能力

    提供者外掛可以在文字推論之外，同時註冊嵌入、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、網頁擷取和網頁搜尋。OpenClaw 將此歸類為
    **混合能力**外掛，這是公司外掛（每個廠商一個外掛）的建議模式。請參閱
    [內部：能力所有權](/zh-TW/plugins/architecture#capability-ownership-model)。

    在現有的 `api.registerProvider(...)` 呼叫旁，於 `register(api)` 內註冊每項能力。
    只選擇你需要的分頁：

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

        對於提供者 HTTP 失敗，請使用 `assertOkOrThrowProviderError(...)`，讓
        外掛共享受限的錯誤本文讀取、JSON 錯誤剖析，以及
        request-id 後綴。
      </Tab>
      <Tab title="Realtime transcription">
        優先使用 `createRealtimeTranscriptionWebSocketSession(...)`，共用
        輔助函式會處理代理擷取、重新連線退避、關閉沖刷、就緒
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

        會 POST multipart 音訊的批次 STT 提供者，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。此輔助函式會正規化上傳
        檔名，包括需要 M4A 風格檔名以相容轉錄 API 的 AAC 上傳。
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

        宣告 `capabilities`，讓 `talk.catalog` 可以向瀏覽器與原生 Talk
        用戶端公開有效的模式、傳輸、音訊格式與功能旗標。當某個傳輸可以偵測到
        人類正在打斷助理播放，且供應商支援截斷或清除作用中的音訊回應時，
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

        有意不要求憑證的本機或自行託管媒體供應商，可以公開 `resolveAuth`
        並回傳 `kind: "none"`。對於未明確選擇加入的供應商，OpenClaw
        仍會保留一般的驗證閘門。既有供應商可以繼續讀取 `req.apiKey`；
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

        在 `contracts.embeddingProviders` 中宣告相同的 id。這是可重複使用向量生成的一般嵌入合約，
        包含記憶搜尋。`registerMemoryEmbeddingProvider(...)` 是為既有記憶專用配接器保留的已棄用
        相容性介面。
      </Tab>
      <Tab title="圖片與影片生成">
        影片能力使用**模式感知**的形狀：`generate`、
        `imageToVideo` 與 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，
        不足以清楚宣告轉換模式支援或已停用模式。
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

供應商外掛的發布方式與任何其他外部程式碼外掛相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

請勿在此使用舊版僅限 skill 的發布別名；外掛套件應使用
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

| 順序      | 時機          | 使用情境                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API 金鑰供應商                             |
| `profile` | simple 之後   | 受驗證設定檔限制的供應商                        |
| `paired`  | profile 之後  | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫既有供應商（衝突時勝出）                    |

## 後續步驟

- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 如果你的外掛也提供頻道
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) - `api.runtime` 輔助工具（TTS、搜尋、子代理）
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [外掛內部架構](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - 鉤子細節與內建範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [建置頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
