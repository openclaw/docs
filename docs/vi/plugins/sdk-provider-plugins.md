---
read_when:
    - Bạn đang xây dựng một Plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm một proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu xác thực nhà cung cấp, danh mục và các hook thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước để xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-05-01T10:51:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin nhà cung cấp để thêm nhà cung cấp mô hình
(LLM) vào OpenClaw. Khi hoàn tất, bạn sẽ có một nhà cung cấp với danh mục mô hình,
xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào, trước tiên hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

<Tip>
  Plugin nhà cung cấp thêm mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu mô hình
  phải chạy qua một daemon tác tử native sở hữu luồng, compaction hoặc sự kiện công cụ,
  hãy ghép nhà cung cấp với một [khung tác tử](/vi/plugins/sdk-agent-harness)
  thay vì đặt chi tiết giao thức daemon trong core.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Gói và manifest">
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
    thông tin xác thực mà không cần tải runtime của Plugin. Thêm `providerAuthAliases`
    khi một biến thể nhà cung cấp nên dùng lại xác thực của id nhà cung cấp khác. `modelSupport`
    là tùy chọn và cho phép OpenClaw tự động tải Plugin nhà cung cấp của bạn từ các id
    mô hình dạng rút gọn như `acme-large` trước khi có hook runtime. Nếu bạn phát hành
    nhà cung cấp trên ClawHub, các trường `openclaw.compat` và `openclaw.build` đó
    là bắt buộc trong `package.json`.

  </Step>

  <Step title="Đăng ký nhà cung cấp">
    Một nhà cung cấp tối thiểu cần có `id`, `label`, `auth` và `catalog`:

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

    Đó là một nhà cung cấp hoạt động được. Người dùng giờ có thể
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình của họ.

    Nếu nhà cung cấp upstream dùng các token điều khiển khác với OpenClaw, hãy thêm một
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

    `input` ghi lại prompt hệ thống cuối cùng và nội dung tin nhắn văn bản trước khi
    truyền tải. `output` ghi lại các delta văn bản của trợ lý và văn bản cuối cùng trước khi
    OpenClaw phân tích các dấu điều khiển riêng của nó hoặc phân phối qua kênh.

    Với các nhà cung cấp đi kèm chỉ đăng ký một nhà cung cấp văn bản với xác thực bằng khóa API
    cùng một runtime duy nhất dựa trên danh mục, hãy ưu tiên helper hẹp hơn
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

    `buildProvider` là đường dẫn danh mục trực tiếp được dùng khi OpenClaw có thể phân giải
    xác thực nhà cung cấp thật. Nó có thể thực hiện khám phá riêng theo nhà cung cấp. Chỉ dùng
    `buildStaticProvider` cho các hàng ngoại tuyến an toàn để hiển thị trước khi cấu hình xác thực;
    nó không được yêu cầu thông tin xác thực hoặc gửi yêu cầu mạng.
    Hiện tại, hiển thị `models list --all` của OpenClaw chỉ thực thi danh mục tĩnh
    cho các Plugin nhà cung cấp đi kèm, với config rỗng, env rỗng và không có
    đường dẫn tác tử/không gian làm việc.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, alias và
    mô hình mặc định của tác tử trong quá trình onboarding, hãy dùng các helper preset từ
    `openclaw/plugin-sdk/provider-onboard`. Các helper hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` và
    `createModelCatalogPresetAppliers(...)`.

    Khi endpoint native của nhà cung cấp hỗ trợ các khối usage được stream trên
    transport `openai-completions` thông thường, hãy ưu tiên các helper danh mục dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì hardcode
    các kiểm tra provider-id. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện hỗ trợ từ
    bản đồ năng lực endpoint, nên các endpoint native kiểu Moonshot/DashScope vẫn
    opt in ngay cả khi một Plugin đang dùng id nhà cung cấp tùy chỉnh.

  </Step>

  <Step title="Thêm phân giải mô hình động">
    Nếu nhà cung cấp của bạn chấp nhận ID mô hình tùy ý (như proxy hoặc router),
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

    Nếu việc phân giải cần gọi mạng, hãy dùng `prepareDynamicModel` để khởi động
    bất đồng bộ — `resolveDynamicModel` sẽ chạy lại sau khi hoàn tất.

  </Step>

  <Step title="Thêm hook runtime (khi cần)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Thêm hook
    dần dần khi nhà cung cấp của bạn cần chúng.

    Các trình dựng helper dùng chung hiện đã bao phủ những nhóm replay/tương thích công cụ
    phổ biến nhất, nên Plugin thường không cần tự nối từng hook một:

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
    | `openai-compatible` | Chính sách replay kiểu OpenAI dùng chung cho các transport tương thích OpenAI, bao gồm làm sạch tool-call-id, sửa thứ tự assistant-first và xác thực lượt Gemini chung khi transport cần | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách replay có nhận biết Claude được chọn theo `modelId`, để các transport tin nhắn Anthropic chỉ nhận dọn dẹp thinking-block riêng cho Claude khi mô hình đã phân giải thực sự là id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Chính sách replay native của Gemini cùng làm sạch bootstrap replay và chế độ reasoning-output có gắn thẻ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Làm sạch thought-signature của Gemini cho các mô hình Gemini chạy qua transport proxy tương thích OpenAI; không bật xác thực replay Gemini native hoặc ghi lại bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách lai cho các nhà cung cấp trộn bề mặt mô hình dạng tin nhắn Anthropic và tương thích OpenAI trong một Plugin; việc bỏ thinking-block chỉ dành cho Claude tùy chọn vẫn giới hạn ở phía Anthropic | `minimax` |

    Các nhóm stream hiện có:

    | Họ | Nội dung được kết nối | Ví dụ đi kèm |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa payload thinking của Gemini trên đường dẫn luồng dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Trình bao lý luận Kilo trên đường dẫn luồng proxy dùng chung, với `kilo/auto` và các id lý luận proxy không được hỗ trợ sẽ bỏ qua thinking được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ payload native-thinking nhị phân của Moonshot từ cấu hình + cấp độ `/think` | `moonshot` |
    | `minimax-fast-mode` | Viết lại mô hình chế độ nhanh của MiniMax trên đường dẫn luồng dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các trình bao Responses OpenAI/Codex native dùng chung: tiêu đề phân bổ, `/fast`/`serviceTier`, độ dài chi tiết của văn bản, tìm kiếm web native của Codex, định hình payload tương thích lý luận, và quản lý ngữ cảnh Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Trình bao lý luận OpenRouter cho các tuyến proxy, với các lần bỏ qua mô hình không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Trình bao `tool_stream` bật mặc định cho các nhà cung cấp như Z.AI muốn phát luồng công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="Các seam SDK hỗ trợ bộ dựng họ">
      Mỗi bộ dựng họ được cấu thành từ các helper công khai cấp thấp hơn được xuất từ cùng package, mà bạn có thể dùng khi một nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, và các bộ dựng replay thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Cũng xuất các helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và helper endpoint/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cùng các trình bao OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), trình bao tương thích OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp prefill thinking của Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), và các trình bao proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, các helper schema Gemini bên dưới (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), và helper tương thích xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI đi kèm dùng `normalizeResolvedModel` + `contributeResolvedModelCompat` với các helper này để giữ quy tắc xAI thuộc sở hữu của nhà cung cấp.

      Một số helper luồng cố ý được giữ cục bộ trong nhà cung cấp. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, và các bộ dựng trình bao Anthropic cấp thấp hơn trong seam công khai `api.ts` / `contract-api.ts` của riêng nó vì chúng mã hóa xử lý Claude OAuth beta và gating `context1m`. Plugin xAI tương tự cũng giữ định hình xAI Responses native trong `wrapStreamFn` riêng (`/fast` aliases, `tool_stream` mặc định, dọn dẹp strict-tool không được hỗ trợ, loại bỏ payload lý luận riêng cho xAI).

      Mẫu package-root tương tự cũng hỗ trợ `@openclaw/openai-provider` (bộ dựng nhà cung cấp, helper mô hình mặc định, bộ dựng nhà cung cấp realtime) và `@openclaw/openrouter-provider` (bộ dựng nhà cung cấp cùng helper onboarding/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Trao đổi token">
        Đối với các nhà cung cấp cần trao đổi token trước mỗi lệnh gọi suy luận:

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
      <Tab title="Tiêu đề tùy chỉnh">
        Đối với các nhà cung cấp cần tiêu đề yêu cầu tùy chỉnh hoặc sửa đổi body:

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
      <Tab title="Danh tính transport native">
        Đối với các nhà cung cấp cần tiêu đề yêu cầu/phiên native hoặc metadata trên
        các transport HTTP hoặc WebSocket chung:

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
        Đối với các nhà cung cấp hiển thị dữ liệu mức sử dụng/thanh toán:

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
      OpenClaw gọi các hook theo thứ tự này. Hầu hết nhà cung cấp chỉ dùng 2-3 hook:
      Các trường nhà cung cấp chỉ để tương thích mà OpenClaw không còn gọi nữa, chẳng hạn như
      `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được liệt kê
      ở đây.

      | # | Hook | Khi nào dùng |
      | --- | --- | --- |
      | 1 | `catalog` | Danh mục mô hình hoặc giá trị mặc định URL cơ sở |
      | 2 | `applyConfigDefaults` | Giá trị mặc định toàn cục do nhà cung cấp sở hữu trong quá trình vật liệu hóa cấu hình |
      | 3 | `normalizeModelId` | Dọn dẹp alias id mô hình legacy/preview trước khi tra cứu |
      | 4 | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung |
      | 5 | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Viết lại tương thích streaming-usage native cho nhà cung cấp cấu hình |
      | 7 | `resolveConfigApiKey` | Phân giải xác thực env-marker do nhà cung cấp sở hữu |
      | 8 | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự lưu trữ hoặc được cấu hình hỗ trợ |
      | 9 | `shouldDeferSyntheticProfileAuth` | Hạ thấp placeholder hồ sơ đã lưu tổng hợp sau xác thực env/cấu hình |
      | 10 | `resolveDynamicModel` | Chấp nhận ID mô hình upstream tùy ý |
      | 11 | `prepareDynamicModel` | Lấy metadata bất đồng bộ trước khi phân giải |
      | 12 | `normalizeResolvedModel` | Viết lại transport trước runner |
      | 13 | `contributeResolvedModelCompat` | Cờ tương thích cho mô hình vendor phía sau transport tương thích khác |
      | 14 | `normalizeToolSchemas` | Dọn dẹp tool-schema do nhà cung cấp sở hữu trước khi đăng ký |
      | 15 | `inspectToolSchemas` | Chẩn đoán tool-schema do nhà cung cấp sở hữu |
      | 16 | `resolveReasoningOutputMode` | Hợp đồng đầu ra lý luận gắn thẻ so với native |
      | 17 | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | 18 | `createStreamFn` | Transport StreamFn tùy chỉnh hoàn toàn |
      | 19 | `wrapStreamFn` | Trình bao tiêu đề/body tùy chỉnh trên đường dẫn luồng bình thường |
      | 20 | `resolveTransportTurnState` | Tiêu đề/metadata native theo từng turn |
      | 21 | `resolveWebSocketSessionPolicy` | Tiêu đề phiên WS native/cool-down |
      | 22 | `formatApiKey` | Dạng token runtime tùy chỉnh |
      | 23 | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | 24 | `buildAuthDoctorHint` | Hướng dẫn sửa xác thực |
      | 25 | `matchesContextOverflowError` | Phát hiện tràn do nhà cung cấp sở hữu |
      | 26 | `classifyFailoverReason` | Phân loại giới hạn tốc độ/quá tải do nhà cung cấp sở hữu |
      | 27 | `isCacheTtlEligible` | Gating TTL bộ nhớ đệm prompt |
      | 28 | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | 29 | `augmentModelCatalog` | Hàng tương thích tiến tổng hợp |
      | 30 | `resolveThinkingProfile` | Tập tùy chọn `/think` riêng theo mô hình |
      | 31 | `isBinaryThinking` | Tương thích bật/tắt thinking nhị phân |
      | 32 | `supportsXHighThinking` | Tương thích hỗ trợ lý luận `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định |
      | 34 | `isModernModelRef` | Khớp mô hình live/smoke |
      | 35 | `prepareRuntimeAuth` | Trao đổi token trước khi suy luận |
      | 36 | `resolveUsageAuth` | Phân tích thông tin xác thực mức sử dụng tùy chỉnh |
      | 37 | `fetchUsageSnapshot` | Endpoint mức sử dụng tùy chỉnh |
      | 38 | `createEmbeddingProvider` | Adapter embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm |
      | 39 | `buildReplayPolicy` | Chính sách replay/Compaction bản ghi tùy chỉnh |
      | 40 | `sanitizeReplayHistory` | Viết lại replay riêng cho nhà cung cấp sau dọn dẹp chung |
      | 41 | `validateReplayTurns` | Xác thực turn replay nghiêm ngặt trước runner nhúng |
      | 42 | `onModelSelected` | Callback sau khi chọn (ví dụ: telemetry) |

      Ghi chú fallback runtime:

      - `normalizeConfig` kiểm tra nhà cung cấp đã khớp trước, rồi đến các Plugin nhà cung cấp khác có hook cho đến khi có một hook thật sự thay đổi cấu hình. Nếu không có hook nhà cung cấp nào viết lại một mục cấu hình thuộc họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google đi kèm vẫn được áp dụng.
      - `resolveConfigApiKey` dùng hook nhà cung cấp khi được hiển thị. Đường dẫn `amazon-bedrock` đi kèm cũng có trình phân giải env-marker AWS tích hợp ở đây, mặc dù bản thân xác thực runtime của Bedrock vẫn dùng chuỗi mặc định của AWS SDK.
      - `resolveSystemPromptContribution` cho phép nhà cung cấp chèn hướng dẫn system-prompt nhận biết bộ nhớ đệm cho một họ mô hình. Ưu tiên nó thay vì `before_prompt_build` khi hành vi thuộc về một nhà cung cấp/họ mô hình và cần giữ nguyên phần tách bộ nhớ đệm ổn định/động.

      Để xem mô tả chi tiết và ví dụ thực tế, hãy xem [Nội bộ: Hook runtime nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Thêm năng lực bổ sung (tùy chọn)">
    Một Plugin nhà cung cấp có thể đăng ký speech, transcription realtime, voice realtime, hiểu media, tạo ảnh, tạo video, fetch web,
    và tìm kiếm web cùng với suy luận văn bản. OpenClaw phân loại đây là một
    Plugin **hybrid-capability** — mẫu được khuyến nghị cho Plugin công ty
    (một Plugin cho mỗi vendor). Xem
    [Nội bộ: Sở hữu năng lực](/vi/plugins/architecture#capability-ownership-model).

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

        Dùng `assertOkOrThrowProviderError(...)` cho lỗi HTTP của provider để
        plugins dùng chung cơ chế đọc nội dung lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố request-id.
      </Tab>
      <Tab title="Phiên âm thời gian thực">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` — helper dùng chung
        xử lý ghi nhận proxy, backoff khi kết nối lại, xả dữ liệu khi đóng, bắt tay
        sẵn sàng, xếp hàng âm thanh và chẩn đoán sự kiện đóng. Plugin của bạn
        chỉ ánh xạ các sự kiện upstream.

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

        Các provider STT theo lô POST âm thanh multipart nên dùng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Helper này chuẩn hóa tên tệp tải lên,
        bao gồm các bản tải lên AAC cần tên tệp kiểu M4A cho
        API phiên âm tương thích.
      </Tab>
      <Tab title="Giọng nói thời gian thực">
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

        Triển khai `handleBargeIn` khi một transport có thể phát hiện con người đang
        ngắt phát lại của trợ lý và provider hỗ trợ cắt ngắn hoặc
        xóa phản hồi âm thanh đang hoạt động.
      </Tab>
      <Tab title="Hiểu nội dung phương tiện">
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
        Các khả năng video dùng cấu trúc **nhận biết chế độ**: `generate`,
        `imageToVideo` và `videoToVideo`. Các trường tổng hợp phẳng như
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` không
        đủ để quảng bá hỗ trợ chế độ biến đổi hoặc các chế độ bị tắt một cách rõ ràng.
        Tạo nhạc theo cùng mẫu với các khối `generate` /
        `edit` tường minh.

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

## Phát hành lên ClawHub

Provider plugins được phát hành giống như mọi Plugin mã bên ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Không dùng alias phát hành cũ chỉ dành cho skill ở đây; các gói Plugin nên dùng
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

`catalog.order` kiểm soát thời điểm danh mục của bạn được hợp nhất so với
các provider tích hợp sẵn:

| Thứ tự    | Khi nào       | Trường hợp sử dụng                             |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Lượt đầu      | Provider dùng API-key đơn giản                 |
| `profile` | Sau simple    | Provider phụ thuộc vào hồ sơ xác thực          |
| `paired`  | Sau profile   | Tổng hợp nhiều mục liên quan                   |
| `late`    | Lượt cuối     | Ghi đè provider hiện có (thắng khi xung đột)   |

## Các bước tiếp theo

- [Channel Plugins](/vi/plugins/sdk-channel-plugins) — nếu Plugin của bạn cũng cung cấp một kênh
- [SDK Runtime](/vi/plugins/sdk-runtime) — helper `api.runtime` (TTS, tìm kiếm, subagent)
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu import subpath đầy đủ
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) — chi tiết hook và ví dụ tích hợp sẵn

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugins](/vi/plugins/building-plugins)
- [Xây dựng channel plugins](/vi/plugins/sdk-channel-plugins)
