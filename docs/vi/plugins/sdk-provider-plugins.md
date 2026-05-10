---
read_when:
    - Bạn đang xây dựng một Plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm một máy chủ trung gian tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu về xác thực nhà cung cấp, danh mục và các móc nối thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước để xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-05-10T19:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin nhà cung cấp để thêm một nhà cung cấp mô hình
(LLM) vào OpenClaw. Sau khi hoàn tất, bạn sẽ có một nhà cung cấp với danh mục mô hình,
xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào, trước tiên hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

<Tip>
  Plugin nhà cung cấp thêm mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu mô hình
  phải chạy qua một daemon agent native sở hữu luồng, Compaction hoặc sự kiện công cụ,
  hãy ghép nhà cung cấp với một [agent harness](/vi/plugins/sdk-agent-harness)
  thay vì đưa chi tiết giao thức daemon vào core.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Package and manifest">
    ### Bước 1: Gói và manifest

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
    khi một biến thể nhà cung cấp nên dùng lại xác thực của id nhà cung cấp khác. `modelSupport`
    là tùy chọn và cho phép OpenClaw tự động tải Plugin nhà cung cấp của bạn từ các id
    mô hình viết tắt như `acme-large` trước khi có hook runtime. Nếu bạn phát hành
    nhà cung cấp trên ClawHub, các trường `openclaw.compat` và `openclaw.build` đó
    là bắt buộc trong `package.json`.

  </Step>

  <Step title="Register the provider">
    Một nhà cung cấp văn bản tối thiểu cần có `id`, `label`, `auth` và `catalog`.
    `catalog` là hook runtime/cấu hình do nhà cung cấp sở hữu; nó có thể gọi
    API nhà cung cấp trực tiếp và trả về các mục `models.providers`.

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

    `registerModelCatalogProvider` là bề mặt danh mục control-plane mới hơn
    cho UI danh sách/trợ giúp/bộ chọn. Dùng nó cho các hàng văn bản, tạo hình ảnh,
    tạo video và tạo nhạc. Giữ các lệnh gọi endpoint của nhà cung cấp và
    ánh xạ phản hồi trong Plugin; OpenClaw sở hữu hình dạng hàng dùng chung, nhãn
    nguồn và cách hiển thị trợ giúp.

    Đây là một nhà cung cấp hoạt động được. Người dùng giờ có thể
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình của họ.

    Nếu nhà cung cấp thượng nguồn dùng token điều khiển khác với OpenClaw, hãy thêm một
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
    khi vận chuyển. `output` viết lại các delta văn bản của trợ lý và văn bản cuối cùng trước khi
    OpenClaw phân tích marker điều khiển riêng hoặc gửi qua kênh.

    Với các nhà cung cấp được đóng gói sẵn chỉ đăng ký một nhà cung cấp văn bản với xác thực
    khóa API cộng với một runtime duy nhất dựa trên danh mục, hãy ưu tiên helper hẹp hơn
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
    xác thực nhà cung cấp thật. Nó có thể thực hiện khám phá riêng cho nhà cung cấp. Chỉ dùng
    `buildStaticProvider` cho các hàng ngoại tuyến an toàn để hiển thị trước khi cấu hình xác thực;
    nó không được yêu cầu thông tin xác thực hoặc tạo yêu cầu mạng.
    Hiển thị `models list --all` của OpenClaw hiện chỉ thực thi danh mục tĩnh
    cho các Plugin nhà cung cấp được đóng gói sẵn, với cấu hình rỗng, env rỗng và không có
    đường dẫn agent/workspace.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, bí danh và
    mô hình mặc định của agent trong quá trình onboarding, hãy dùng các helper preset từ
    `openclaw/plugin-sdk/provider-onboard`. Các helper hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` và
    `createModelCatalogPresetAppliers(...)`.

    Khi endpoint native của một nhà cung cấp hỗ trợ các khối usage được stream trên
    transport `openai-completions` thông thường, hãy ưu tiên các helper danh mục dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì mã hóa cứng
    các kiểm tra provider-id. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện hỗ trợ từ
    bản đồ capability của endpoint, nên các endpoint native kiểu Moonshot/DashScope vẫn
    có thể tự chọn tham gia ngay cả khi một Plugin đang dùng id nhà cung cấp tùy chỉnh.

  </Step>

  <Step title="Add dynamic model resolution">
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

    Nếu việc phân giải yêu cầu lệnh gọi mạng, hãy dùng `prepareDynamicModel` để khởi động
    bất đồng bộ - `resolveDynamicModel` sẽ chạy lại sau khi hoàn tất.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Thêm hook
    dần dần khi nhà cung cấp của bạn cần đến.

    Các builder helper dùng chung hiện bao phủ những nhóm replay/tool-compat
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

    Các nhóm replay hiện có hôm nay:

    | Họ | Nội dung được kết nối | Ví dụ đi kèm |
    | --- | --- | --- |
    | `openai-compatible` | Chính sách phát lại kiểu OpenAI dùng chung cho các transport tương thích OpenAI, bao gồm làm sạch tool-call-id, sửa thứ tự assistant-trước, và xác thực lượt Gemini chung khi transport cần | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách phát lại có nhận biết Claude được chọn theo `modelId`, để các transport thông điệp Anthropic chỉ nhận dọn dẹp thinking-block riêng cho Claude khi mô hình đã phân giải thực sự là một id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Chính sách phát lại Gemini gốc, cùng làm sạch phát lại bootstrap và chế độ reasoning-output có gắn thẻ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Làm sạch chữ ký suy nghĩ Gemini cho các mô hình Gemini chạy qua transport proxy tương thích OpenAI; không bật xác thực phát lại Gemini gốc hoặc ghi lại bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách lai cho các nhà cung cấp kết hợp bề mặt mô hình thông điệp Anthropic và tương thích OpenAI trong một Plugin; việc bỏ thinking-block chỉ dành cho Claude tùy chọn vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các họ stream hiện có hôm nay:

    | Họ | Nội dung được kết nối | Ví dụ đi kèm |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa payload suy nghĩ Gemini trên đường dẫn stream dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper suy luận Kilo trên đường dẫn stream proxy dùng chung, với `kilo/auto` và các id suy luận proxy không được hỗ trợ bỏ qua phần suy nghĩ được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ payload native-thinking nhị phân của Moonshot từ cấu hình + mức `/think` | `moonshot` |
    | `minimax-fast-mode` | Ghi lại mô hình chế độ nhanh MiniMax trên đường dẫn stream dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các wrapper OpenAI/Codex Responses gốc dùng chung: header ghi nhận nguồn, `/fast`/`serviceTier`, độ dài văn bản, tìm kiếm web Codex gốc, định dạng payload tương thích suy luận, và quản lý ngữ cảnh Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper suy luận OpenRouter cho các tuyến proxy, với việc bỏ qua mô hình không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` bật mặc định cho các nhà cung cấp như Z.AI muốn stream công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Mỗi trình dựng họ được kết hợp từ các helper công khai cấp thấp hơn được xuất từ cùng gói, bạn có thể dùng khi một nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, và các trình dựng phát lại thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Cũng xuất các helper phát lại Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và helper endpoint/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cộng với các wrapper OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper tương thích OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp prefill suy nghĩ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), và các wrapper proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, và các helper schema Gemini bên dưới (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      Một số helper stream được giữ cục bộ trong nhà cung cấp có chủ đích. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, và các trình dựng wrapper Anthropic cấp thấp hơn trong seam công khai `api.ts` / `contract-api.ts` của chính nó vì chúng mã hóa xử lý beta OAuth Claude và gating `context1m`. Plugin xAI cũng tương tự, giữ định dạng Responses xAI gốc trong `wrapStreamFn` của chính nó (bí danh `/fast`, `tool_stream` mặc định, dọn dẹp strict-tool không được hỗ trợ, loại bỏ payload suy luận riêng của xAI).

      Mẫu package-root tương tự cũng hỗ trợ `@openclaw/openai-provider` (trình dựng nhà cung cấp, helper mô hình mặc định, trình dựng nhà cung cấp realtime) và `@openclaw/openrouter-provider` (trình dựng nhà cung cấp cùng helper onboarding/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
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
      <Tab title="Custom headers">
        Đối với các nhà cung cấp cần header yêu cầu tùy chỉnh hoặc sửa đổi body:

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
        Đối với các nhà cung cấp cần header hoặc metadata yêu cầu/phiên gốc trên
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
      <Tab title="Usage and billing">
        Đối với các nhà cung cấp hiển thị dữ liệu sử dụng/thanh toán:

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
      OpenClaw gọi hook theo thứ tự này. Hầu hết nhà cung cấp chỉ dùng 2-3:
      Các trường nhà cung cấp chỉ dành cho tương thích mà OpenClaw không còn gọi, chẳng hạn như
      `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được liệt kê
      ở đây.

      | # | Hook | Khi nào dùng |
      | --- | --- | --- |
      | 1 | `catalog` | Danh mục mô hình hoặc mặc định URL cơ sở |
      | 2 | `applyConfigDefaults` | Mặc định toàn cục do nhà cung cấp sở hữu trong quá trình vật chất hóa cấu hình |
      | 3 | `normalizeModelId` | Dọn dẹp bí danh model-id legacy/preview trước khi tra cứu |
      | 4 | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung |
      | 5 | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Ghi lại tương thích streaming-usage gốc cho nhà cung cấp cấu hình |
      | 7 | `resolveConfigApiKey` | Phân giải xác thực env-marker do nhà cung cấp sở hữu |
      | 8 | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự lưu trữ hoặc dựa trên cấu hình |
      | 9 | `shouldDeferSyntheticProfileAuth` | Hạ ưu tiên placeholder hồ sơ được lưu tổng hợp phía sau xác thực env/cấu hình |
      | 10 | `resolveDynamicModel` | Chấp nhận id mô hình upstream tùy ý |
      | 11 | `prepareDynamicModel` | Lấy metadata bất đồng bộ trước khi phân giải |
      | 12 | `normalizeResolvedModel` | Ghi lại transport trước runner |
      | 13 | `contributeResolvedModelCompat` | Cờ tương thích cho mô hình vendor phía sau một transport tương thích khác |
      | 14 | `normalizeToolSchemas` | Dọn dẹp tool-schema do nhà cung cấp sở hữu trước khi đăng ký |
      | 15 | `inspectToolSchemas` | Chẩn đoán tool-schema do nhà cung cấp sở hữu |
      | 16 | `resolveReasoningOutputMode` | Hợp đồng reasoning-output có gắn thẻ so với gốc |
      | 17 | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | 18 | `createStreamFn` | Transport StreamFn hoàn toàn tùy chỉnh |
      | 19 | `wrapStreamFn` | Wrapper header/body tùy chỉnh trên đường dẫn stream bình thường |
      | 20 | `resolveTransportTurnState` | Header/metadata gốc theo từng lượt |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down phiên WS gốc |
      | 22 | `formatApiKey` | Dạng token runtime tùy chỉnh |
      | 23 | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | 24 | `buildAuthDoctorHint` | Hướng dẫn sửa xác thực |
      | 25 | `matchesContextOverflowError` | Phát hiện tràn do nhà cung cấp sở hữu |
      | 26 | `classifyFailoverReason` | Phân loại rate-limit/quá tải do nhà cung cấp sở hữu |
      | 27 | `isCacheTtlEligible` | Gating TTL bộ nhớ đệm prompt |
      | 28 | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | 29 | `augmentModelCatalog` | Hàng forward-compat tổng hợp |
      | 30 | `resolveThinkingProfile` | Bộ tùy chọn `/think` riêng theo mô hình |
      | 31 | `isBinaryThinking` | Tương thích bật/tắt suy nghĩ nhị phân |
      | 32 | `supportsXHighThinking` | Tương thích hỗ trợ suy luận `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định |
      | 34 | `isModernModelRef` | Khớp mô hình live/smoke |
      | 35 | `prepareRuntimeAuth` | Trao đổi token trước suy luận |
      | 36 | `resolveUsageAuth` | Phân tích thông tin xác thực sử dụng tùy chỉnh |
      | 37 | `fetchUsageSnapshot` | Endpoint sử dụng tùy chỉnh |
      | 38 | `createEmbeddingProvider` | Adapter embedding do nhà cung cấp sở hữu cho memory/search |
      | 39 | `buildReplayPolicy` | Chính sách phát lại/Compaction transcript tùy chỉnh |
      | 40 | `sanitizeReplayHistory` | Ghi lại phát lại riêng theo nhà cung cấp sau dọn dẹp chung |
      | 41 | `validateReplayTurns` | Xác thực nghiêm ngặt lượt phát lại trước runner nhúng |
      | 42 | `onModelSelected` | Callback sau khi chọn (ví dụ: telemetry) |

      Ghi chú dự phòng runtime:

      - `normalizeConfig` kiểm tra nhà cung cấp đã khớp trước, sau đó đến các Plugin nhà cung cấp có hook khác cho đến khi một hook thực sự thay đổi cấu hình. Nếu không có hook nhà cung cấp nào ghi lại một mục cấu hình họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google đi kèm vẫn được áp dụng.
      - `resolveConfigApiKey` dùng hook nhà cung cấp khi được hiển thị. Đường dẫn `amazon-bedrock` đi kèm cũng có resolver env-marker AWS tích hợp sẵn ở đây, dù bản thân xác thực runtime Bedrock vẫn dùng chuỗi mặc định AWS SDK.
      - `resolveSystemPromptContribution` cho phép một nhà cung cấp chèn hướng dẫn system-prompt có nhận biết bộ nhớ đệm cho một họ mô hình. Ưu tiên dùng nó thay vì `before_prompt_build` khi hành vi thuộc về một nhà cung cấp/họ mô hình và cần giữ phân tách bộ nhớ đệm ổn định/động.

      Để xem mô tả chi tiết và ví dụ thực tế, hãy xem [Nội bộ: Hook Runtime Nhà Cung Cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Bước 5: Thêm khả năng bổ sung

    Một Plugin nhà cung cấp có thể đăng ký giọng nói, phiên âm realtime,
    thoại realtime, hiểu nội dung phương tiện, tạo ảnh, tạo video, web fetch,
    và web search cùng với suy luận văn bản. OpenClaw phân loại đây là một
    Plugin **năng lực lai** - mẫu được khuyến nghị cho Plugin của công ty
    (một Plugin cho mỗi nhà cung cấp). Xem
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

        Dùng `assertOkOrThrowProviderError(...)` cho lỗi HTTP của nhà cung cấp để
        các Plugin dùng chung cơ chế đọc phần thân lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố request-id.
      </Tab>
      <Tab title="Realtime transcription">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` - helper dùng chung
        xử lý ghi lại proxy, backoff khi kết nối lại, flush khi đóng, bắt tay sẵn sàng,
        xếp hàng âm thanh, và chẩn đoán sự kiện đóng. Plugin của bạn
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

        Các nhà cung cấp STT theo lô POST âm thanh multipart nên dùng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Helper chuẩn hóa tên tệp tải lên,
        bao gồm các bản tải lên AAC cần tên tệp kiểu M4A cho
        các API phiên âm tương thích.
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

        Khai báo `capabilities` để `talk.catalog` có thể hiển thị các chế độ hợp lệ,
        transport, định dạng âm thanh và cờ tính năng cho trình khách Talk trên trình duyệt và native.
        Triển khai `handleBargeIn` khi một transport có thể phát hiện rằng
        người dùng đang ngắt phát âm thanh của trợ lý và nhà cung cấp hỗ trợ
        cắt ngắn hoặc xóa phản hồi âm thanh đang hoạt động.
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
        Năng lực video dùng cấu trúc **nhận biết chế độ**: `generate`,
        `imageToVideo`, và `videoToVideo`. Các trường tổng hợp phẳng như
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

Plugin nhà cung cấp được xuất bản giống như mọi Plugin mã ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Không dùng alias xuất bản cũ chỉ dành cho skill ở đây; các gói Plugin nên dùng
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

## Tham chiếu thứ tự catalog

`catalog.order` kiểm soát thời điểm catalog của bạn được hợp nhất tương đối với
các nhà cung cấp tích hợp sẵn:

| Thứ tự    | Khi nào       | Trường hợp sử dụng                            |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Lượt đầu      | Nhà cung cấp dùng khóa API đơn giản           |
| `profile` | Sau simple    | Nhà cung cấp bị chặn bởi hồ sơ xác thực       |
| `paired`  | Sau profile   | Tổng hợp nhiều mục liên quan                  |
| `late`    | Lượt cuối     | Ghi đè nhà cung cấp hiện có (thắng khi xung đột) |

## Các bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - nếu Plugin của bạn cũng cung cấp một kênh
- [SDK Runtime](/vi/plugins/sdk-runtime) - helper `api.runtime` (TTS, tìm kiếm, subagent)
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu import subpath đầy đủ
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) - chi tiết hook và ví dụ tích hợp sẵn

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Xây dựng Plugin kênh](/vi/plugins/sdk-channel-plugins)
