---
read_when:
    - Bạn đang xây dựng một Plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm một proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu về xác thực của nhà cung cấp, các danh mục và các hook thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước để xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng các Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-04-29T23:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin nhà cung cấp để thêm một nhà cung cấp mô hình
(LLM) vào OpenClaw. Đến cuối hướng dẫn, bạn sẽ có một nhà cung cấp với catalog mô hình,
xác thực bằng khóa API, và phân giải mô hình động.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào trước đây, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc package
  cơ bản và cách thiết lập manifest.
</Info>

<Tip>
  Plugin nhà cung cấp thêm mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu mô hình
  phải chạy qua một daemon agent native sở hữu luồng, Compaction, hoặc sự kiện công cụ,
  hãy ghép nhà cung cấp với một [khung agent](/vi/plugins/sdk-agent-harness)
  thay vì đưa chi tiết giao thức daemon vào lõi.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Package và manifest">
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
    thông tin xác thực mà không cần tải runtime Plugin của bạn. Thêm `providerAuthAliases`
    khi một biến thể nhà cung cấp cần tái sử dụng xác thực của id nhà cung cấp khác. `modelSupport`
    là tùy chọn và cho phép OpenClaw tự động tải Plugin nhà cung cấp của bạn từ các id
    mô hình dạng viết tắt như `acme-large` trước khi các hook runtime tồn tại. Nếu bạn phát hành
    nhà cung cấp trên ClawHub, các trường `openclaw.compat` và `openclaw.build` đó
    là bắt buộc trong `package.json`.

  </Step>

  <Step title="Đăng ký nhà cung cấp">
    Một nhà cung cấp tối thiểu cần có `id`, `label`, `auth`, và `catalog`:

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

    Đó là một nhà cung cấp hoạt động được. Giờ đây người dùng có thể
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
    truyền tải. `output` ghi lại các delta văn bản của assistant và văn bản cuối cùng trước khi
    OpenClaw phân tích các marker điều khiển riêng hoặc phân phối kênh.

    Với các nhà cung cấp đi kèm chỉ đăng ký một nhà cung cấp văn bản với xác thực bằng khóa API
    cộng thêm một runtime duy nhất dựa trên catalog, hãy ưu tiên helper hẹp hơn
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
    xác thực nhà cung cấp thật. Nó có thể thực hiện phát hiện riêng theo nhà cung cấp. Chỉ dùng
    `buildStaticProvider` cho các hàng ngoại tuyến an toàn để hiển thị trước khi xác thực
    được cấu hình; nó không được yêu cầu thông tin xác thực hoặc gửi yêu cầu mạng.
    Hiện tại màn hình `models list --all` của OpenClaw chỉ thực thi catalog tĩnh
    cho các Plugin nhà cung cấp đi kèm, với cấu hình rỗng, env rỗng, và không có
    đường dẫn agent/workspace.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, alias, và
    mô hình mặc định của agent trong quá trình onboarding, hãy dùng các helper preset từ
    `openclaw/plugin-sdk/provider-onboard`. Các helper hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, và
    `createModelCatalogPresetAppliers(...)`.

    Khi endpoint native của một nhà cung cấp hỗ trợ các khối usage được stream trên
    transport `openai-completions` thông thường, hãy ưu tiên các helper catalog dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì hardcode
    kiểm tra id nhà cung cấp. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện hỗ trợ từ
    bản đồ năng lực endpoint, nên các endpoint native kiểu Moonshot/DashScope vẫn
    opt in ngay cả khi một Plugin đang dùng id nhà cung cấp tùy chỉnh.

  </Step>

  <Step title="Thêm phân giải mô hình động">
    Nếu nhà cung cấp của bạn chấp nhận các ID mô hình tùy ý (như proxy hoặc router),
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

    Nếu việc phân giải cần một yêu cầu mạng, hãy dùng `prepareDynamicModel` để khởi động
    bất đồng bộ — `resolveDynamicModel` sẽ chạy lại sau khi nó hoàn tất.

  </Step>

  <Step title="Thêm hook runtime (khi cần)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Thêm hook
    dần dần theo nhu cầu của nhà cung cấp của bạn.

    Các helper builder dùng chung hiện bao phủ những nhóm replay/tương thích công cụ
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
    | `openai-compatible` | Chính sách replay kiểu OpenAI dùng chung cho các transport tương thích OpenAI, bao gồm vệ sinh tool-call-id, sửa thứ tự assistant-trước, và xác thực lượt Gemini chung khi transport cần | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách replay nhận biết Claude được chọn theo `modelId`, để các transport thông điệp Anthropic chỉ nhận dọn dẹp thinking-block riêng cho Claude khi mô hình đã phân giải thật sự là id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Chính sách replay native của Gemini cộng với vệ sinh bootstrap replay và chế độ reasoning-output được gắn thẻ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Vệ sinh thought-signature của Gemini cho các mô hình Gemini chạy qua transport proxy tương thích OpenAI; không bật xác thực replay native của Gemini hoặc ghi lại bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách hybrid cho các nhà cung cấp trộn bề mặt mô hình thông điệp Anthropic và tương thích OpenAI trong một Plugin; việc bỏ thinking-block chỉ dành cho Claude tùy chọn vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các nhóm stream hiện có:

    | Nhóm | Nội dung kết nối vào | Ví dụ đi kèm |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa payload thinking của Gemini trên đường dẫn stream dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning của Kilo trên đường dẫn proxy stream dùng chung, với `kilo/auto` và các id reasoning proxy không được hỗ trợ sẽ bỏ qua thinking được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ payload native-thinking nhị phân của Moonshot từ cấu hình + mức `/think` | `moonshot` |
    | `minimax-fast-mode` | Ghi lại model ở chế độ nhanh của MiniMax trên đường dẫn stream dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các wrapper Responses OpenAI/Codex native dùng chung: header phân bổ, `/fast`/`serviceTier`, độ chi tiết văn bản, tìm kiếm web native của Codex, định hình payload tương thích reasoning và quản lý ngữ cảnh Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning của OpenRouter cho các tuyến proxy, với việc bỏ qua model không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` bật mặc định cho các provider như Z.AI muốn stream công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="Các seam SDK hỗ trợ bộ dựng nhóm">
      Mỗi bộ dựng nhóm được kết hợp từ các helper công khai cấp thấp hơn được export từ cùng package, bạn có thể dùng đến chúng khi một provider cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` và các bộ dựng replay thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Cũng export các helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cộng với các wrapper OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper tương thích OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp phần điền sẵn thinking của Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) và các wrapper proxy/provider dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, các helper schema Gemini bên dưới (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) và helper tương thích xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI đi kèm dùng `normalizeResolvedModel` + `contributeResolvedModelCompat` cùng với các helper này để giữ quy tắc xAI do provider sở hữu.

      Một số helper stream được cố ý giữ cục bộ trong provider. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` và các bộ dựng wrapper Anthropic cấp thấp hơn trong seam công khai `api.ts` / `contract-api.ts` riêng vì chúng mã hóa xử lý Claude OAuth beta và cổng `context1m`. Plugin xAI cũng giữ phần định hình Responses native của xAI trong `wrapStreamFn` riêng (`/fast` aliases, `tool_stream` mặc định, dọn dẹp strict-tool không được hỗ trợ, gỡ bỏ payload reasoning dành riêng cho xAI).

      Mẫu package-root tương tự cũng hỗ trợ `@openclaw/openai-provider` (bộ dựng provider, helper model mặc định, bộ dựng provider realtime) và `@openclaw/openrouter-provider` (bộ dựng provider cộng với helper onboarding/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Trao đổi token">
        Với các provider cần trao đổi token trước mỗi lần gọi suy luận:

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
        Với các provider cần header yêu cầu tùy chỉnh hoặc chỉnh sửa body:

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
      <Tab title="Định danh transport native">
        Với các provider cần header hoặc metadata yêu cầu/phiên native trên
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
      <Tab title="Mức dùng và thanh toán">
        Với các provider cung cấp dữ liệu mức dùng/thanh toán:

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

    <Accordion title="Tất cả hook provider hiện có">
      OpenClaw gọi các hook theo thứ tự này. Hầu hết provider chỉ dùng 2-3 hook:
      Các trường provider chỉ dành cho tương thích mà OpenClaw không còn gọi nữa, chẳng hạn như
      `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được liệt kê
      ở đây.

      | # | Hook | Khi nào dùng |
      | --- | --- | --- |
      | 1 | `catalog` | Catalog model hoặc mặc định URL cơ sở |
      | 2 | `applyConfigDefaults` | Mặc định toàn cục do provider sở hữu trong quá trình hiện thực hóa cấu hình |
      | 3 | `normalizeModelId` | Dọn dẹp alias model-id legacy/preview trước khi tra cứu |
      | 4 | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` theo họ provider trước khi lắp ráp model chung |
      | 5 | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Ghi lại tương thích streaming-usage native cho provider cấu hình |
      | 7 | `resolveConfigApiKey` | Phân giải xác thực env-marker do provider sở hữu |
      | 8 | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự host hoặc dựa trên cấu hình |
      | 9 | `shouldDeferSyntheticProfileAuth` | Hạ độ ưu tiên placeholder hồ sơ đã lưu tổng hợp phía sau xác thực env/cấu hình |
      | 10 | `resolveDynamicModel` | Chấp nhận ID model upstream tùy ý |
      | 11 | `prepareDynamicModel` | Lấy metadata bất đồng bộ trước khi phân giải |
      | 12 | `normalizeResolvedModel` | Ghi lại transport trước runner |
      | 13 | `contributeResolvedModelCompat` | Cờ tương thích cho model vendor phía sau transport tương thích khác |
      | 14 | `normalizeToolSchemas` | Dọn dẹp tool-schema do provider sở hữu trước khi đăng ký |
      | 15 | `inspectToolSchemas` | Chẩn đoán tool-schema do provider sở hữu |
      | 16 | `resolveReasoningOutputMode` | Hợp đồng reasoning-output dạng tagged so với native |
      | 17 | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | 18 | `createStreamFn` | Transport StreamFn hoàn toàn tùy chỉnh |
      | 19 | `wrapStreamFn` | Wrapper header/body tùy chỉnh trên đường dẫn stream bình thường |
      | 20 | `resolveTransportTurnState` | Header/metadata native theo từng lượt |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down phiên WS native |
      | 22 | `formatApiKey` | Hình dạng token runtime tùy chỉnh |
      | 23 | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | 24 | `buildAuthDoctorHint` | Hướng dẫn sửa xác thực |
      | 25 | `matchesContextOverflowError` | Phát hiện tràn ngữ cảnh do provider sở hữu |
      | 26 | `classifyFailoverReason` | Phân loại giới hạn tốc độ/quá tải do provider sở hữu |
      | 27 | `isCacheTtlEligible` | Cổng TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | 29 | `augmentModelCatalog` | Hàng forward-compat tổng hợp |
      | 30 | `resolveThinkingProfile` | Tập tùy chọn `/think` theo model |
      | 31 | `isBinaryThinking` | Tương thích thinking nhị phân bật/tắt |
      | 32 | `supportsXHighThinking` | Tương thích hỗ trợ reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định |
      | 34 | `isModernModelRef` | Khớp model live/smoke |
      | 35 | `prepareRuntimeAuth` | Trao đổi token trước suy luận |
      | 36 | `resolveUsageAuth` | Phân tích thông tin xác thực mức dùng tùy chỉnh |
      | 37 | `fetchUsageSnapshot` | Endpoint mức dùng tùy chỉnh |
      | 38 | `createEmbeddingProvider` | Adapter embedding do provider sở hữu cho bộ nhớ/tìm kiếm |
      | 39 | `buildReplayPolicy` | Chính sách replay/Compaction transcript tùy chỉnh |
      | 40 | `sanitizeReplayHistory` | Ghi lại replay dành riêng cho provider sau dọn dẹp chung |
      | 41 | `validateReplayTurns` | Xác thực replay-turn nghiêm ngặt trước runner nhúng |
      | 42 | `onModelSelected` | Callback sau khi chọn (ví dụ: telemetry) |

      Ghi chú fallback runtime:

      - `normalizeConfig` kiểm tra provider đã khớp trước, sau đó đến các provider plugin khác có hook cho đến khi một hook thật sự thay đổi cấu hình. Nếu không hook provider nào ghi lại một mục cấu hình họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google đi kèm vẫn được áp dụng.
      - `resolveConfigApiKey` dùng hook provider khi được cung cấp. Đường dẫn `amazon-bedrock` đi kèm cũng có trình phân giải env-marker AWS tích hợp sẵn tại đây, dù bản thân xác thực runtime Bedrock vẫn dùng chuỗi mặc định AWS SDK.
      - `resolveSystemPromptContribution` cho phép provider chèn hướng dẫn system-prompt nhận biết cache cho một họ model. Ưu tiên dùng nó thay vì `before_prompt_build` khi hành vi thuộc về một provider/họ model và cần giữ nguyên phân tách cache ổn định/động.

      Để xem mô tả chi tiết và ví dụ thực tế, hãy xem [Nội bộ: Hook runtime provider](/vi/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Thêm năng lực bổ sung (tùy chọn)">
    Một provider plugin có thể đăng ký speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch,
    và web search cùng với suy luận văn bản. OpenClaw phân loại đây là một
    plugin **hybrid-capability** — mẫu được khuyến nghị cho plugin của công ty
    (một plugin cho mỗi vendor). Xem
    [Nội bộ: Quyền sở hữu năng lực](/vi/plugins/architecture#capability-ownership-model).

    Đăng ký từng năng lực bên trong `register(api)` cùng với lệnh gọi
    `api.registerProvider(...)` hiện có của bạn. Chỉ chọn các tab bạn cần:

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
        các plugin chia sẻ việc đọc nội dung lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố mã định danh yêu cầu.
      </Tab>
      <Tab title="Realtime transcription">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` — trình trợ giúp dùng chung
        xử lý việc ghi nhận proxy, backoff khi kết nối lại, xả dữ liệu khi đóng, bắt tay sẵn sàng,
        xếp hàng âm thanh và chẩn đoán sự kiện đóng. Plugin của bạn
        chỉ ánh xạ các sự kiện thượng nguồn.

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

        Các nhà cung cấp STT theo lô gửi âm thanh multipart bằng POST nên dùng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Trình trợ giúp chuẩn hóa tên tệp tải lên,
        bao gồm cả các bản tải lên AAC cần tên tệp kiểu M4A cho
        các API phiên âm tương thích.
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        Khả năng video dùng hình dạng **nhận biết chế độ**: `generate`,
        `imageToVideo` và `videoToVideo`. Các trường tổng hợp phẳng như
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` không
        đủ để công bố rõ ràng hỗ trợ chế độ biến đổi hoặc các chế độ bị tắt.
        Tạo nhạc cũng theo cùng mẫu này với các khối `generate` /
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
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
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

Plugin nhà cung cấp được xuất bản giống như mọi Plugin mã ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Không dùng bí danh xuất bản cũ chỉ dành cho skill ở đây; gói plugin nên dùng
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
các nhà cung cấp tích hợp sẵn:

| Thứ tự    | Khi nào       | Trường hợp sử dụng                            |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Lượt đầu      | Nhà cung cấp dùng khóa API thuần túy          |
| `profile` | Sau simple    | Nhà cung cấp bị ràng buộc bởi hồ sơ xác thực  |
| `paired`  | Sau profile   | Tổng hợp nhiều mục liên quan                  |
| `late`    | Lượt cuối     | Ghi đè nhà cung cấp hiện có (thắng khi trùng) |

## Bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — nếu plugin của bạn cũng cung cấp một kênh
- [SDK Runtime](/vi/plugins/sdk-runtime) — trình trợ giúp `api.runtime` (TTS, tìm kiếm, subagent)
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu nhập đầy đủ theo đường dẫn con
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) — chi tiết hook và ví dụ tích hợp sẵn

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Xây dựng plugin kênh](/vi/plugins/sdk-channel-plugins)
