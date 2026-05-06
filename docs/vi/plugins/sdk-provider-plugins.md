---
read_when:
    - Bạn đang xây dựng một Plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm một proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu xác thực nhà cung cấp, danh mục và các hook thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước về cách xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-05-06T09:24:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một provider plugin thêm một nhà cung cấp mô hình
(LLM) vào OpenClaw. Khi hoàn tất, bạn sẽ có một provider với danh mục mô hình,
xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Nếu trước đây bạn chưa từng xây dựng OpenClaw plugin nào, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc package
  cơ bản và cách thiết lập manifest.
</Info>

<Tip>
  Provider plugin thêm mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu mô hình
  phải chạy qua một daemon tác tử native sở hữu thread, compaction hoặc sự kiện công cụ,
  hãy ghép provider với một [agent harness](/vi/plugins/sdk-agent-harness)
  thay vì đưa chi tiết giao thức daemon vào core.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Package and manifest">
    ### Bước 1: Package và manifest

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

    Manifest khai báo `providerAuthEnvVars` để OpenClaw có thể phát hiện
    thông tin xác thực mà không cần tải runtime của plugin. Thêm `providerAuthAliases`
    khi một biến thể provider cần dùng lại xác thực của một id provider khác. `modelSupport`
    là tùy chọn và cho phép OpenClaw tự động tải provider plugin của bạn từ các
    id mô hình viết tắt như `acme-large` trước khi có runtime hook. Nếu bạn phát hành
    provider trên ClawHub, các trường `openclaw.compat` và `openclaw.build` đó
    là bắt buộc trong `package.json`.

  </Step>

  <Step title="Register the provider">
    Một provider tối thiểu cần có `id`, `label`, `auth` và `catalog`:

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

    Đây là một provider hoạt động được. Giờ đây người dùng có thể
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình của họ.

    Nếu provider upstream dùng token điều khiển khác với OpenClaw, hãy thêm một
    phép biến đổi văn bản hai chiều nhỏ thay vì thay thế đường dẫn stream:

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

    `input` viết lại prompt hệ thống cuối cùng và nội dung tin nhắn văn bản trước
    khi truyền tải. `output` viết lại delta văn bản của trợ lý và văn bản cuối cùng trước khi
    OpenClaw phân tích các marker điều khiển riêng của nó hoặc phân phối qua kênh.

    Với các provider đi kèm chỉ đăng ký một provider văn bản có xác thực bằng khóa API
    cùng một runtime duy nhất dựa trên catalog, hãy ưu tiên helper hẹp hơn
    `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` là đường dẫn catalog trực tiếp được dùng khi OpenClaw có thể phân giải
    xác thực provider thật. Nó có thể thực hiện discovery riêng cho provider. Chỉ dùng
    `buildStaticProvider` cho các hàng offline an toàn để hiển thị trước khi xác thực
    được cấu hình; nó không được yêu cầu thông tin xác thực hoặc thực hiện yêu cầu mạng.
    Màn hình `models list --all` của OpenClaw hiện chỉ thực thi catalog tĩnh
    cho các provider plugin đi kèm, với config rỗng, env rỗng và không có
    đường dẫn tác tử/workspace.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, alias và
    mô hình mặc định của tác tử trong quá trình onboarding, hãy dùng các helper preset từ
    `openclaw/plugin-sdk/provider-onboard`. Các helper hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` và
    `createModelCatalogPresetAppliers(...)`.

    Khi endpoint native của provider hỗ trợ block usage dạng stream trên
    transport `openai-completions` thông thường, hãy ưu tiên các helper catalog dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì hardcode
    kiểm tra id provider. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện hỗ trợ từ
    bản đồ capability của endpoint, nên các endpoint kiểu Moonshot/DashScope native vẫn
    tự bật ngay cả khi một plugin đang dùng id provider tùy chỉnh.

  </Step>

  <Step title="Add dynamic model resolution">
    Nếu provider của bạn chấp nhận ID mô hình tùy ý (như proxy hoặc router),
    hãy thêm `resolveDynamicModel`:

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

    Nếu việc phân giải cần gọi mạng, hãy dùng `prepareDynamicModel` để khởi động async
    trước - `resolveDynamicModel` sẽ chạy lại sau khi hoàn tất.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Hầu hết provider chỉ cần `catalog` + `resolveDynamicModel`. Thêm hook
    dần dần khi provider của bạn cần chúng.

    Các helper builder dùng chung hiện đã bao phủ những nhóm replay/tool-compat
    phổ biến nhất, nên plugin thường không cần tự nối từng hook một:

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

    Các nhóm replay hiện có:

    | Nhóm | Nội dung được nối vào | Ví dụ đi kèm |
    | --- | --- | --- |
    | `openai-compatible` | Chính sách replay dùng chung kiểu OpenAI cho transport tương thích OpenAI, bao gồm vệ sinh tool-call-id, sửa thứ tự assistant-first và kiểm tra Gemini-turn chung khi transport cần | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách replay nhận biết Claude được chọn theo `modelId`, để các transport tin nhắn Anthropic chỉ nhận dọn dẹp thinking-block riêng cho Claude khi mô hình đã phân giải thật sự là một id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Chính sách replay Gemini native cùng vệ sinh bootstrap replay và chế độ reasoning-output có gắn thẻ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Vệ sinh thought-signature Gemini cho các mô hình Gemini chạy qua transport proxy tương thích OpenAI; không bật kiểm tra replay Gemini native hoặc viết lại bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách hybrid cho provider kết hợp bề mặt mô hình tin nhắn Anthropic và tương thích OpenAI trong một plugin; việc loại bỏ thinking-block chỉ dành cho Claude tùy chọn vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các nhóm luồng hiện có hôm nay:

    | Nhóm | Thành phần được nối vào | Ví dụ đi kèm |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa payload suy nghĩ Gemini trên đường dẫn luồng dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper suy luận Kilo trên đường dẫn luồng proxy dùng chung, với `kilo/auto` và các id suy luận proxy không được hỗ trợ bỏ qua suy nghĩ được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ payload native-thinking nhị phân của Moonshot từ cấu hình + cấp độ `/think` | `moonshot` |
    | `minimax-fast-mode` | Viết lại mô hình chế độ nhanh MiniMax trên đường dẫn luồng dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các wrapper Responses OpenAI/Codex native dùng chung: header quy kết, `/fast`/`serviceTier`, độ chi tiết văn bản, tìm kiếm web Codex native, định dạng payload tương thích suy luận, và quản lý ngữ cảnh Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper suy luận OpenRouter cho các tuyến proxy, với việc bỏ qua mô hình không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` bật mặc định cho các nhà cung cấp như Z.AI muốn phát trực tuyến công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="Các seam SDK vận hành các bộ dựng nhóm">
      Mỗi bộ dựng nhóm được cấu thành từ các helper công khai cấp thấp hơn được xuất từ cùng gói, bạn có thể dùng khi một nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, và các bộ dựng replay thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Cũng xuất các helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và helper endpoint/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cùng các wrapper OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper tương thích OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp điền sẵn suy nghĩ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), và các wrapper proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, các helper schema Gemini nền tảng (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), và helper tương thích xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI đi kèm dùng `normalizeResolvedModel` + `contributeResolvedModelCompat` với các helper này để giữ quy tắc xAI thuộc sở hữu của nhà cung cấp.

      Một số helper luồng cố ý giữ cục bộ theo nhà cung cấp. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, và các bộ dựng wrapper Anthropic cấp thấp hơn trong seam công khai `api.ts` / `contract-api.ts` của riêng nó vì chúng mã hóa xử lý beta Claude OAuth và cổng `context1m`. Plugin xAI cũng giữ định dạng Responses xAI native trong `wrapStreamFn` của riêng nó (bí danh `/fast`, `tool_stream` mặc định, dọn dẹp strict-tool không được hỗ trợ, loại bỏ payload suy luận đặc thù xAI).

      Mẫu gốc gói tương tự cũng hỗ trợ `@openclaw/openai-provider` (bộ dựng nhà cung cấp, helper mô hình mặc định, bộ dựng nhà cung cấp realtime) và `@openclaw/openrouter-provider` (bộ dựng nhà cung cấp cùng helper onboarding/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Trao đổi token">
        Với các nhà cung cấp cần trao đổi token trước mỗi lệnh gọi suy luận:

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
      <Tab title="Header tùy chỉnh">
        Với các nhà cung cấp cần header yêu cầu tùy chỉnh hoặc chỉnh sửa body:

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
      <Tab title="Danh tính truyền tải native">
        Với các nhà cung cấp cần header yêu cầu/phiên native hoặc metadata trên
        các truyền tải HTTP hoặc WebSocket chung:

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
      <Tab title="Mức sử dụng và thanh toán">
        Với các nhà cung cấp hiển thị dữ liệu mức sử dụng/thanh toán:

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

    <Accordion title="Tất cả hook nhà cung cấp có sẵn">
      OpenClaw gọi các hook theo thứ tự này. Hầu hết nhà cung cấp chỉ dùng 2-3:
      Các trường nhà cung cấp chỉ để tương thích mà OpenClaw không còn gọi nữa,
      chẳng hạn như `ProviderPlugin.capabilities` và `suppressBuiltInModel`,
      không được liệt kê ở đây.

      | # | Hook | Khi nào dùng |
      | --- | --- | --- |
      | 1 | `catalog` | Catalog mô hình hoặc mặc định URL cơ sở |
      | 2 | `applyConfigDefaults` | Mặc định toàn cục do nhà cung cấp sở hữu trong quá trình cụ thể hóa cấu hình |
      | 3 | `normalizeModelId` | Dọn dẹp bí danh model-id legacy/preview trước khi tra cứu |
      | 4 | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` theo nhóm nhà cung cấp trước khi lắp ráp mô hình chung |
      | 5 | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Viết lại tương thích streaming-usage native cho nhà cung cấp cấu hình |
      | 7 | `resolveConfigApiKey` | Phân giải xác thực env-marker do nhà cung cấp sở hữu |
      | 8 | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự lưu trữ hoặc dựa trên cấu hình |
      | 9 | `shouldDeferSyntheticProfileAuth` | Hạ thấp placeholder hồ sơ đã lưu tổng hợp phía sau xác thực env/cấu hình |
      | 10 | `resolveDynamicModel` | Chấp nhận các ID mô hình upstream tùy ý |
      | 11 | `prepareDynamicModel` | Tải metadata bất đồng bộ trước khi phân giải |
      | 12 | `normalizeResolvedModel` | Viết lại truyền tải trước runner |
      | 13 | `contributeResolvedModelCompat` | Cờ tương thích cho mô hình nhà cung cấp phía sau một truyền tải tương thích khác |
      | 14 | `normalizeToolSchemas` | Dọn dẹp tool-schema do nhà cung cấp sở hữu trước khi đăng ký |
      | 15 | `inspectToolSchemas` | Chẩn đoán tool-schema do nhà cung cấp sở hữu |
      | 16 | `resolveReasoningOutputMode` | Hợp đồng đầu ra suy luận dạng gắn thẻ so với native |
      | 17 | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | 18 | `createStreamFn` | Truyền tải StreamFn hoàn toàn tùy chỉnh |
      | 19 | `wrapStreamFn` | Wrapper header/body tùy chỉnh trên đường dẫn luồng thông thường |
      | 20 | `resolveTransportTurnState` | Header/metadata native theo từng lượt |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down phiên WS native |
      | 22 | `formatApiKey` | Dạng token runtime tùy chỉnh |
      | 23 | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | 24 | `buildAuthDoctorHint` | Hướng dẫn sửa xác thực |
      | 25 | `matchesContextOverflowError` | Phát hiện tràn do nhà cung cấp sở hữu |
      | 26 | `classifyFailoverReason` | Phân loại giới hạn tốc độ/quá tải do nhà cung cấp sở hữu |
      | 27 | `isCacheTtlEligible` | Cổng TTL bộ nhớ đệm prompt |
      | 28 | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | 29 | `augmentModelCatalog` | Hàng forward-compat tổng hợp |
      | 30 | `resolveThinkingProfile` | Bộ tùy chọn `/think` theo mô hình |
      | 31 | `isBinaryThinking` | Tương thích bật/tắt suy nghĩ nhị phân |
      | 32 | `supportsXHighThinking` | Tương thích hỗ trợ suy luận `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định |
      | 34 | `isModernModelRef` | Khớp mô hình live/smoke |
      | 35 | `prepareRuntimeAuth` | Trao đổi token trước suy luận |
      | 36 | `resolveUsageAuth` | Phân tích thông tin xác thực mức sử dụng tùy chỉnh |
      | 37 | `fetchUsageSnapshot` | Endpoint mức sử dụng tùy chỉnh |
      | 38 | `createEmbeddingProvider` | Adapter embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm |
      | 39 | `buildReplayPolicy` | Chính sách replay/Compaction bản ghi tùy chỉnh |
      | 40 | `sanitizeReplayHistory` | Viết lại replay đặc thù nhà cung cấp sau khi dọn dẹp chung |
      | 41 | `validateReplayTurns` | Xác thực lượt replay nghiêm ngặt trước runner nhúng |
      | 42 | `onModelSelected` | Callback sau khi chọn (ví dụ: telemetry) |

      Ghi chú fallback runtime:

      - `normalizeConfig` kiểm tra nhà cung cấp khớp trước, rồi đến các Plugin nhà cung cấp khác có hook cho đến khi một hook thực sự thay đổi cấu hình. Nếu không hook nhà cung cấp nào viết lại mục cấu hình nhóm Google được hỗ trợ, bộ chuẩn hóa cấu hình Google đi kèm vẫn được áp dụng.
      - `resolveConfigApiKey` dùng hook nhà cung cấp khi được hiển thị. Đường dẫn `amazon-bedrock` đi kèm cũng có bộ phân giải env-marker AWS tích hợp ở đây, dù bản thân xác thực runtime Bedrock vẫn dùng chuỗi mặc định AWS SDK.
      - `resolveSystemPromptContribution` cho phép một nhà cung cấp chèn hướng dẫn system-prompt nhận biết bộ nhớ đệm cho một nhóm mô hình. Ưu tiên dùng nó thay vì `before_prompt_build` khi hành vi thuộc về một nhóm nhà cung cấp/mô hình và cần giữ nguyên phân tách bộ nhớ đệm ổn định/động.

      Để xem mô tả chi tiết và ví dụ thực tế, hãy xem [Nội bộ: Hook Runtime Nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Thêm năng lực bổ sung (tùy chọn)">
    ### Bước 5: Thêm năng lực bổ sung

    Một Plugin nhà cung cấp có thể đăng ký speech, phiên âm realtime, giọng nói realtime, hiểu media, tạo ảnh, tạo video, web fetch
    và tìm kiếm web bên cạnh suy luận văn bản. OpenClaw phân loại đây là một
    Plugin **hybrid-capability** - mẫu được khuyến nghị cho Plugin công ty
    (một Plugin cho mỗi nhà cung cấp). Xem
    [Nội bộ: Quyền sở hữu năng lực](/vi/plugins/architecture#capability-ownership-model).

    Đăng ký từng năng lực bên trong `register(api)` cùng với lệnh gọi
    `api.registerProvider(...)` hiện có của bạn. Chỉ chọn các tab bạn cần:

    <Tabs>
      <Tab title="Giọng nói (TTS)">
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

        Dùng `assertOkOrThrowProviderError(...)` cho các lỗi HTTP của nhà cung cấp để
        các plugin chia sẻ việc đọc thân lỗi được giới hạn, phân tích lỗi JSON và
        hậu tố request-id.
      </Tab>
      <Tab title="Phiên âm thời gian thực">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` - helper dùng chung
        xử lý ghi nhận proxy, backoff khi kết nối lại, flush khi đóng, handshake
        sẵn sàng, xếp hàng âm thanh và chẩn đoán sự kiện đóng. Plugin của bạn
        chỉ ánh xạ các sự kiện từ thượng nguồn.

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

        Các nhà cung cấp STT theo lô POST âm thanh multipart nên dùng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Helper chuẩn hóa tên tệp tải lên,
        bao gồm các bản tải lên AAC cần tên tệp kiểu M4A cho những API phiên âm
        tương thích.
      </Tab>
      <Tab title="Giọng nói thời gian thực">
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

        Khai báo `capabilities` để `talk.catalog` có thể hiển thị các chế độ,
        transport, định dạng âm thanh và cờ tính năng hợp lệ cho các client Talk
        trên trình duyệt và native. Triển khai `handleBargeIn` khi transport có
        thể phát hiện con người đang ngắt phần phát lại của trợ lý và nhà cung cấp
        hỗ trợ cắt ngắn hoặc xóa phản hồi âm thanh đang hoạt động.
      </Tab>
      <Tab title="Hiểu nội dung đa phương tiện">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Tạo hình ảnh và video">
        Khả năng video dùng một dạng **nhận biết chế độ**: `generate`,
        `imageToVideo` và `videoToVideo`. Các trường tổng hợp phẳng như
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` không đủ để
        công bố rõ ràng khả năng hỗ trợ chế độ biến đổi hoặc các chế độ bị tắt.
        Tạo nhạc cũng theo cùng mẫu với các khối `generate` /
        `edit` rõ ràng.

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
      <Tab title="Tìm nạp và tìm kiếm web">
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

  <Step title="Kiểm thử">
    ### Bước 6: Kiểm thử

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

## Xuất bản lên ClawHub

Các plugin nhà cung cấp được xuất bản giống như mọi plugin mã bên ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Đừng dùng bí danh xuất bản cũ chỉ dành cho Skills ở đây; các gói plugin nên dùng
`clawhub package publish`.

## Cấu trúc tệp

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Tham chiếu thứ tự danh mục

`catalog.order` kiểm soát thời điểm danh mục của bạn được hợp nhất so với các
nhà cung cấp tích hợp sẵn:

| Thứ tự    | Khi nào       | Trường hợp sử dụng                              |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Lượt đầu tiên | Nhà cung cấp dùng khóa API đơn giản             |
| `profile` | Sau simple    | Nhà cung cấp được kiểm soát bằng hồ sơ xác thực |
| `paired`  | Sau profile   | Tổng hợp nhiều mục liên quan                    |
| `late`    | Lượt cuối     | Ghi đè nhà cung cấp hiện có (thắng khi xung đột) |

## Bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - nếu plugin của bạn cũng cung cấp một kênh
- [Runtime SDK](/vi/plugins/sdk-runtime) - helper `api.runtime` (TTS, tìm kiếm, tác tử con)
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu đầy đủ về import đường dẫn con
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) - chi tiết hook và ví dụ được đóng gói

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Xây dựng plugin kênh](/vi/plugins/sdk-channel-plugins)
