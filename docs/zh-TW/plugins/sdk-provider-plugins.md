---
read_when:
    - 您正在建置新的模型提供者 Plugin
    - 你想將 OpenAI 相容的代理或自訂 LLM 新增到 OpenClaw
    - 你需要了解提供者身分驗證、目錄與執行階段掛鉤
sidebarTitle: Provider plugins
summary: 為 OpenClaw 建置模型提供者 Plugin 的逐步指南
title: 建置提供者 Plugin
x-i18n:
    generated_at: "2026-05-06T09:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南逐步說明如何建置 Provider Plugin，將模型供應商
(LLM) 加入 OpenClaw。完成後，你會擁有一個具備模型目錄、
API 金鑰驗證，以及動態模型解析的供應商。

<Info>
  如果你之前沒有建置過任何 OpenClaw Plugin，請先閱讀
  [開始使用](/zh-TW/plugins/building-plugins)，了解基本套件
  結構與 manifest 設定。
</Info>

<Tip>
  Provider Plugin 會將模型加入 OpenClaw 的一般推論迴圈。如果模型
  必須透過擁有執行緒、Compaction 或工具
  事件的原生代理程式 daemon 執行，請將該供應商與 [代理程式框架](/zh-TW/plugins/sdk-agent-harness)
  搭配使用，而不是把 daemon 通訊協定細節放進核心。
</Tip>

## 逐步解說

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

    manifest 會宣告 `providerAuthEnvVars`，讓 OpenClaw 無需載入你的 Plugin runtime
    就能偵測憑證。當某個供應商變體應重用另一個供應商 ID 的驗證時，請加入 `providerAuthAliases`。
    `modelSupport` 是選用的，可讓 OpenClaw 在 runtime hook 存在之前，
    從像 `acme-large` 這樣的簡寫模型 ID 自動載入你的 Provider Plugin。
    如果你在 ClawHub 發布該供應商，`package.json` 中必須包含那些
    `openclaw.compat` 和 `openclaw.build` 欄位。

  </Step>

  <Step title="Register the provider">
    最小供應商需要 `id`、`label`、`auth` 和 `catalog`：

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

    這就是一個可運作的供應商。使用者現在可以
    `openclaw onboard --acme-ai-api-key <key>`，並選擇
    `acme-ai/acme-large` 作為他們的模型。

    如果上游供應商使用的控制 token 與 OpenClaw 不同，請加入一個
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

    `input` 會在傳輸前改寫最終系統提示詞和文字訊息內容。
    `output` 會在 OpenClaw 解析自己的控制標記或通道傳遞之前，
    改寫助理文字 delta 與最終文字。

    對於只註冊一個採用 API 金鑰驗證、且有單一目錄支援 runtime 的文字供應商的內建供應商，
    請優先使用較窄的
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

    `buildProvider` 是 OpenClaw 能解析真實供應商驗證時使用的即時目錄路徑。
    它可以執行供應商專屬的探索。只有在驗證設定之前即可安全顯示的離線列，
    才使用 `buildStaticProvider`；它不得需要憑證或發出網路請求。
    OpenClaw 的 `models list --all` 顯示目前只會對內建 Provider Plugin 執行靜態目錄，
    並使用空設定、空環境，且不提供代理程式/工作區路徑。

    如果你的驗證流程也需要在 onboarding 期間修補 `models.providers.*`、別名，
    以及代理程式預設模型，請使用
    `openclaw/plugin-sdk/provider-onboard` 中的 preset helper。最窄的 helper 是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    當供應商的原生端點在一般 `openai-completions` 傳輸上支援串流 usage block 時，
    請優先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共用目錄 helper，
    而不是硬編碼供應商 ID 檢查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 會從
    端點能力 map 偵測支援，因此原生 Moonshot/DashScope 風格端點即使在 Plugin 使用自訂供應商 ID 時，
    仍會選擇啟用。

  </Step>

  <Step title="Add dynamic model resolution">
    如果你的供應商接受任意模型 ID（例如 proxy 或 router），
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
    預熱 - `resolveDynamicModel` 會在完成後再次執行。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多數供應商只需要 `catalog` + `resolveDynamicModel`。請依供應商需求
    逐步加入 hook。

    共用 helper builder 現在涵蓋最常見的 replay/tool-compat
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
    | `openai-compatible` | OpenAI 相容傳輸的共用 OpenAI 風格 replay 政策，包括工具呼叫 ID 清理、助理優先順序修正，以及傳輸需要時的通用 Gemini-turn 驗證 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 依 `modelId` 選擇的 Claude 感知 replay 政策，因此 Anthropic-message 傳輸只會在解析後的模型實際上是 Claude ID 時，取得 Claude 專屬的 thinking-block 清理 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini replay 政策，加上 bootstrap replay 清理與帶標記的推理輸出模式 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 透過 OpenAI 相容 proxy 傳輸執行的 Gemini 模型適用的 Gemini thought-signature 清理；不會啟用原生 Gemini replay 驗證或 bootstrap 改寫 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 適用於在一個 Plugin 中混合 Anthropic-message 與 OpenAI 相容模型介面的供應商的混合政策；選用的 Claude-only thinking-block 移除會限制在 Anthropic 端 | `minimax` |

    Available stream families today:

    | Family | What it wires in | Bundled examples |
    | --- | --- | --- |
    | `google-thinking` | Gemini thinking payload normalization on the shared stream path | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo reasoning wrapper on the shared proxy stream path, with `kilo/auto` and unsupported proxy reasoning ids skipping injected thinking | `kilocode` |
    | `moonshot-thinking` | Moonshot binary native-thinking payload mapping from config + `/think` level | `moonshot` |
    | `minimax-fast-mode` | MiniMax fast-mode model rewrite on the shared stream path | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Shared native OpenAI/Codex Responses wrappers: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, reasoning-compat payload shaping, and Responses context management | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter reasoning wrapper for proxy routes, with unsupported-model/`auto` skips handled centrally | `openrouter` |
    | `tool-stream-default-on` | Default-on `tool_stream` wrapper for providers like Z.AI that want tool streaming unless explicitly disabled | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Each family builder is composed from lower-level public helpers exported from the same package, which you can reach for when a provider needs to go off the common pattern:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, and the raw replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Also exports Gemini replay helpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) and endpoint/model helpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus the shared OpenAI/Codex wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatible wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking prefill cleanup (`createAnthropicThinkingPrefillPayloadWrapper`), and shared proxy/provider wrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, underlying Gemini schema helpers (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), and xAI compat helpers (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). The bundled xAI plugin uses `normalizeResolvedModel` + `contributeResolvedModelCompat` with these to keep xAI rules owned by the provider.

      Some stream helpers stay provider-local on purpose. `@openclaw/anthropic-provider` keeps `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, and the lower-level Anthropic wrapper builders in its own public `api.ts` / `contract-api.ts` seam because they encode Claude OAuth beta handling and `context1m` gating. The xAI plugin similarly keeps native xAI Responses shaping in its own `wrapStreamFn` (`/fast` aliases, default `tool_stream`, unsupported strict-tool cleanup, xAI-specific reasoning-payload removal).

      The same package-root pattern also backs `@openclaw/openai-provider` (provider builders, default-model helpers, realtime provider builders) and `@openclaw/openrouter-provider` (provider builder plus onboarding/config helpers).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        For providers that need a token exchange before each inference call:

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
        For providers that need custom request headers or body modifications:

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
        For providers that need native request/session headers or metadata on
        generic HTTP or WebSocket transports:

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
        For providers that expose usage/billing data:

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
      OpenClaw calls hooks in this order. Most providers only use 2-3:
      Compatibility-only provider fields that OpenClaw no longer calls, such as
      `ProviderPlugin.capabilities` and `suppressBuiltInModel`, are not listed
      here.

      | # | Hook | When to use |
      | --- | --- | --- |
      | 1 | `catalog` | Model catalog or base URL defaults |
      | 2 | `applyConfigDefaults` | Provider-owned global defaults during config materialization |
      | 3 | `normalizeModelId` | Legacy/preview model-id alias cleanup before lookup |
      | 4 | `normalizeTransport` | Provider-family `api` / `baseUrl` cleanup before generic model assembly |
      | 5 | `normalizeConfig` | Normalize `models.providers.<id>` config |
      | 6 | `applyNativeStreamingUsageCompat` | Native streaming-usage compat rewrites for config providers |
      | 7 | `resolveConfigApiKey` | Provider-owned env-marker auth resolution |
      | 8 | `resolveSyntheticAuth` | Local/self-hosted or config-backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Lower synthetic stored-profile placeholders behind env/config auth |
      | 10 | `resolveDynamicModel` | Accept arbitrary upstream model IDs |
      | 11 | `prepareDynamicModel` | Async metadata fetch before resolving |
      | 12 | `normalizeResolvedModel` | Transport rewrites before the runner |
      | 13 | `contributeResolvedModelCompat` | Compat flags for vendor models behind another compatible transport |
      | 14 | `normalizeToolSchemas` | Provider-owned tool-schema cleanup before registration |
      | 15 | `inspectToolSchemas` | Provider-owned tool-schema diagnostics |
      | 16 | `resolveReasoningOutputMode` | Tagged vs native reasoning-output contract |
      | 17 | `prepareExtraParams` | Default request params |
      | 18 | `createStreamFn` | Fully custom StreamFn transport |
      | 19 | `wrapStreamFn` | Custom headers/body wrappers on the normal stream path |
      | 20 | `resolveTransportTurnState` | Native per-turn headers/metadata |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS session headers/cool-down |
      | 22 | `formatApiKey` | Custom runtime token shape |
      | 23 | `refreshOAuth` | Custom OAuth refresh |
      | 24 | `buildAuthDoctorHint` | Auth repair guidance |
      | 25 | `matchesContextOverflowError` | Provider-owned overflow detection |
      | 26 | `classifyFailoverReason` | Provider-owned rate-limit/overload classification |
      | 27 | `isCacheTtlEligible` | Prompt cache TTL gating |
      | 28 | `buildMissingAuthMessage` | Custom missing-auth hint |
      | 29 | `augmentModelCatalog` | Synthetic forward-compat rows |
      | 30 | `resolveThinkingProfile` | Model-specific `/think` option set |
      | 31 | `isBinaryThinking` | Binary thinking on/off compatibility |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning support compatibility |
      | 33 | `resolveDefaultThinkingLevel` | Default `/think` policy compatibility |
      | 34 | `isModernModelRef` | Live/smoke model matching |
      | 35 | `prepareRuntimeAuth` | Token exchange before inference |
      | 36 | `resolveUsageAuth` | Custom usage credential parsing |
      | 37 | `fetchUsageSnapshot` | Custom usage endpoint |
      | 38 | `createEmbeddingProvider` | Provider-owned embedding adapter for memory/search |
      | 39 | `buildReplayPolicy` | Custom transcript replay/compaction policy |
      | 40 | `sanitizeReplayHistory` | Provider-specific replay rewrites after generic cleanup |
      | 41 | `validateReplayTurns` | Strict replay-turn validation before the embedded runner |
      | 42 | `onModelSelected` | Post-selection callback (e.g. telemetry) |

      Runtime fallback notes:

      - `normalizeConfig` checks the matched provider first, then other hook-capable provider plugins until one actually changes the config. If no provider hook rewrites a supported Google-family config entry, the bundled Google config normalizer still applies.
      - `resolveConfigApiKey` uses the provider hook when exposed. The bundled `amazon-bedrock` path also has a built-in AWS env-marker resolver here, even though Bedrock runtime auth itself still uses the AWS SDK default chain.
      - `resolveSystemPromptContribution` lets a provider inject cache-aware system-prompt guidance for a model family. Prefer it over `before_prompt_build` when the behavior belongs to one provider/model family and should preserve the stable/dynamic cache split.

      For detailed descriptions and real-world examples, see [Internals: Provider Runtime Hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Step 5: Add extra capabilities

    A provider plugin can register speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch,
    and web search alongside text inference. OpenClaw classifies this as a
    **hybrid-capability** plugin - the recommended pattern for company plugins
    (one plugin per vendor). See
    [Internals: Capability Ownership](/zh-TW/plugins/architecture#capability-ownership-model).

    Register each capability inside `register(api)` alongside your existing
    `api.registerProvider(...)` call. Pick only the tabs you need:

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

        針對提供者 HTTP 失敗，請使用 `assertOkOrThrowProviderError(...)`，讓
        plugins 共用有上限的錯誤本文讀取、JSON 錯誤剖析，以及
        request-id 後綴。
      </Tab>
      <Tab title="即時轉錄">
        優先使用 `createRealtimeTranscriptionWebSocketSession(...)` - 這個共用
        helper 會處理代理擷取、重新連線退避、關閉時清空、就緒
        交握、音訊佇列，以及關閉事件診斷。你的 plugin
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

        以 multipart 音訊進行 POST 的批次 STT 提供者，應使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。這個 helper 會正規化上傳
        檔名，包括需要 M4A 風格檔名才能相容於
        轉錄 API 的 AAC 上傳。
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

        宣告 `capabilities`，讓 `talk.catalog` 可以將有效模式、
        傳輸、音訊格式與功能旗標公開給瀏覽器與原生 Talk
        用戶端。當傳輸能偵測到使用者正在中斷助理播放，且提供者支援
        截斷或清除作用中的音訊回應時，請實作 `handleBargeIn`。
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
      <Tab title="圖像與影片生成">
        影片能力使用**感知模式**的形狀：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 這類扁平彙總欄位，不
        足以清楚宣告轉換模式支援或停用的模式。
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

Provider plugins 的發布方式與任何其他外部程式碼 plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

請勿在這裡使用舊版的僅限 skill 發布別名；plugin 套件應使用
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

`catalog.order` 控制你的目錄相對於內建提供者的合併時機：

| 順序      | 時機          | 使用情境                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一輪        | 一般 API key 提供者                             |
| `profile` | simple 之後   | 受 auth profiles 控制的提供者                   |
| `paired`  | profile 之後  | 合成多個相關項目                                |
| `late`    | 最後一輪      | 覆寫既有提供者（衝突時勝出）                    |

## 後續步驟

- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) - 如果你的 plugin 也提供頻道
- [SDK Runtime](/zh-TW/plugins/sdk-runtime) - `api.runtime` helpers（TTS、搜尋、subagent）
- [SDK Overview](/zh-TW/plugins/sdk-overview) - 完整 subpath import 參考
- [Plugin Internals](/zh-TW/plugins/architecture-internals#provider-runtime-hooks) - hook 詳細資料與內建範例

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [建置頻道 plugins](/zh-TW/plugins/sdk-channel-plugins)
