---
read_when:
    - Bạn đang xây dựng một plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu xác thực nhà cung cấp, catalog và các hook runtime
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước để xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-06-27T17:57:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một plugin nhà cung cấp để thêm một nhà cung cấp mô hình
(LLM) vào OpenClaw. Khi hoàn tất, bạn sẽ có một nhà cung cấp với danh mục mô hình,
xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Nếu bạn chưa từng xây dựng plugin OpenClaw nào trước đây, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc gói
  và thiết lập manifest cơ bản.
</Info>

<Tip>
  Plugin nhà cung cấp thêm mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu mô hình
  phải chạy qua một daemon agent gốc sở hữu luồng, compaction hoặc sự kiện công cụ,
  hãy ghép nhà cung cấp với một [agent harness](/vi/plugins/sdk-agent-harness)
  thay vì đưa chi tiết giao thức daemon vào core.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Gói và manifest">
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

    Manifest khai báo `setup.providers[].envVars` để OpenClaw có thể phát hiện
    thông tin xác thực mà không cần tải runtime plugin của bạn. Thêm `providerAuthAliases`
    khi một biến thể nhà cung cấp nên dùng lại xác thực của id nhà cung cấp khác. `modelSupport`
    là tùy chọn và cho phép OpenClaw tự động tải plugin nhà cung cấp của bạn từ
    các id mô hình viết tắt như `acme-large` trước khi các hook runtime tồn tại. Nếu bạn phát hành
    nhà cung cấp trên ClawHub, các trường `openclaw.compat` và `openclaw.build` đó
    là bắt buộc trong `package.json`.

  </Step>

  <Step title="Đăng ký nhà cung cấp">
    Một nhà cung cấp văn bản tối thiểu cần có `id`, `label`, `auth` và `catalog`.
    `catalog` là hook runtime/cấu hình do nhà cung cấp sở hữu; nó có thể gọi các API
    live của nhà cung cấp và trả về các mục `models.providers`.

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
    cho giao diện list/help/picker. Dùng nó cho các hàng văn bản, tạo hình ảnh,
    tạo video và tạo nhạc. Giữ các lệnh gọi endpoint của nhà cung cấp và
    ánh xạ phản hồi trong plugin; OpenClaw sở hữu hình dạng hàng dùng chung, nhãn
    nguồn và việc render trợ giúp.

    Đó là một nhà cung cấp hoạt động được. Người dùng giờ có thể
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình của họ.

    ### Khám phá mô hình live

    Nếu nhà cung cấp của bạn cung cấp một API kiểu `/models`, hãy giữ endpoint
    dành riêng cho nhà cung cấp và phép chiếu hàng trong plugin của bạn, rồi dùng
    `openclaw/plugin-sdk/provider-catalog-live-runtime` cho vòng đời fetch dùng chung.
    Helper này cung cấp các HTTP fetch được bảo vệ, header xác thực nhà cung cấp,
    lỗi HTTP có cấu trúc, bộ nhớ đệm TTL và hành vi fallback tĩnh mà không
    đưa chính sách nhà cung cấp vào core OpenClaw.

    Dùng `buildLiveModelProviderConfig` khi API live chỉ cho bạn biết các hàng
    danh mục tĩnh do nhà cung cấp sở hữu nào hiện đang khả dụng:

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

    Dùng `getCachedLiveProviderModelRows` khi API nhà cung cấp trả về metadata
    phong phú hơn và plugin cần tự chiếu các hàng thành định nghĩa mô hình
    OpenClaw:

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

    `run` nên luôn được chặn bằng xác thực và trả về `null` khi không có thông tin xác thực
    dùng được. Giữ một `staticRun` ngoại tuyến hoặc fallback tĩnh để các bề mặt thiết lập,
    tài liệu, kiểm thử và picker không phụ thuộc vào truy cập mạng live. Dùng TTL
    phù hợp với độ mới của danh sách mô hình, tránh thăm dò hệ thống tệp tại thời điểm yêu cầu,
    và chỉ truyền `readRows` / `readModelId` dành riêng cho nhà cung cấp khi
    phản hồi upstream không có hình dạng tương thích OpenAI `{ data: [{ id, object }] }`.

    Nếu nhà cung cấp upstream dùng các token điều khiển khác OpenClaw, hãy thêm một
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

    `input` viết lại system prompt cuối cùng và nội dung tin nhắn văn bản trước
    transport. `output` viết lại các delta văn bản của assistant và văn bản cuối cùng trước khi
    OpenClaw phân tích các marker điều khiển của chính nó hoặc gửi qua kênh.

    Với các nhà cung cấp bundled chỉ đăng ký một nhà cung cấp văn bản với xác thực bằng khóa API
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

    `buildProvider` là đường dẫn catalog trực tiếp được dùng khi OpenClaw có thể phân giải xác thực nhà cung cấp thực tế. Nó có thể thực hiện khám phá riêng theo nhà cung cấp. Chỉ dùng `buildStaticProvider` cho các hàng ngoại tuyến an toàn để hiển thị trước khi cấu hình xác thực; nó không được yêu cầu thông tin xác thực hoặc thực hiện yêu cầu mạng. Màn hình `models list --all` của OpenClaw hiện chỉ thực thi catalog tĩnh cho các Plugin nhà cung cấp được đóng gói sẵn, với cấu hình rỗng, env rỗng và không có đường dẫn agent/workspace.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, bí danh và mô hình mặc định của agent trong quá trình onboarding, hãy dùng các helper preset từ `openclaw/plugin-sdk/provider-onboard`. Các helper hẹp nhất là `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)` và `createModelCatalogPresetAppliers(...)`.

    Khi endpoint gốc của nhà cung cấp hỗ trợ các khối usage được stream trên transport `openai-completions` thông thường, hãy ưu tiên các helper catalog dùng chung trong `openclaw/plugin-sdk/provider-catalog-shared` thay vì hardcode kiểm tra provider-id. `supportsNativeStreamingUsageCompat(...)` và `applyProviderNativeStreamingUsageCompat(...)` phát hiện hỗ trợ từ bản đồ capability của endpoint, vì vậy các endpoint gốc kiểu Moonshot/DashScope vẫn opt in ngay cả khi một Plugin đang dùng id nhà cung cấp tùy chỉnh.

    Các ví dụ khám phá trực tiếp ở trên bao quát API nhà cung cấp kiểu `/models`. Giữ phần khám phá đó bên trong `catalog.run`, được chặn bởi xác thực có thể dùng được, và giữ `staticRun` không dùng mạng cho việc tạo catalog ngoại tuyến.

  </Step>

  <Step title="Thêm phân giải mô hình động">
    Nếu nhà cung cấp của bạn chấp nhận ID mô hình tùy ý (như proxy hoặc router), hãy thêm `resolveDynamicModel`:

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

    Nếu việc phân giải yêu cầu một lệnh gọi mạng, hãy dùng `prepareDynamicModel` để khởi động bất đồng bộ - `resolveDynamicModel` sẽ chạy lại sau khi hoàn tất.

  </Step>

  <Step title="Thêm hook runtime (khi cần)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Thêm hook dần dần khi nhà cung cấp của bạn yêu cầu.

    Các builder helper dùng chung hiện đã bao quát các nhóm replay/tool-compat phổ biến nhất, vì vậy Plugin thường không cần nối tay từng hook một:

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

    | Nhóm | Nội dung được nối vào | Ví dụ được đóng gói sẵn |
    | --- | --- | --- |
    | `openai-compatible` | Chính sách replay kiểu OpenAI dùng chung cho các transport tương thích OpenAI, bao gồm làm sạch tool-call-id, sửa thứ tự assistant-first và xác thực lượt Gemini chung khi transport cần | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách replay nhận biết Claude được chọn theo `modelId`, để transport Anthropic-message chỉ nhận cleanup thinking-block riêng cho Claude khi mô hình đã phân giải thực sự là id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Chính sách replay Gemini gốc cộng với làm sạch bootstrap replay. Nhóm dùng chung giữ Gemini CLI xuất văn bản trên tagged reasoning; nhà cung cấp `google` trực tiếp ghi đè `resolveReasoningOutputMode` thành `native` vì thinking của Gemini API đến dưới dạng native thought parts. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Làm sạch thought-signature Gemini cho các mô hình Gemini chạy qua transport proxy tương thích OpenAI; không bật xác thực replay Gemini gốc hoặc ghi lại bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách lai cho nhà cung cấp trộn bề mặt mô hình Anthropic-message và tương thích OpenAI trong một Plugin; việc bỏ thinking-block chỉ dành cho Claude tùy chọn vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các nhóm stream hiện có:

    | Nhóm | Nội dung được nối vào | Ví dụ được đóng gói sẵn |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa payload thinking của Gemini trên đường dẫn stream dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo trên đường dẫn stream proxy dùng chung, với `kilo/auto` và các id proxy reasoning không được hỗ trợ bỏ qua thinking được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ payload native-thinking nhị phân của Moonshot từ cấu hình + mức `/think` | `moonshot` |
    | `minimax-fast-mode` | Ghi lại mô hình fast-mode của MiniMax trên đường dẫn stream dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các wrapper Responses OpenAI/Codex gốc dùng chung: header attribution, `/fast`/`serviceTier`, độ dài chi tiết văn bản, tìm kiếm web Codex gốc, tạo hình payload reasoning-compat và quản lý ngữ cảnh Responses | `openai` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter cho các route proxy, với việc bỏ qua unsupported-model/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` bật mặc định cho các nhà cung cấp như Z.AI muốn stream công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="Các seam SDK cung cấp năng lực cho family builder">
      Mỗi family builder được cấu thành từ các helper công khai cấp thấp hơn được export từ cùng package, bạn có thể dùng khi nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` và các builder replay thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Cũng export các helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và helper endpoint/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cộng với các wrapper OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper DeepSeek V4 tương thích OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), cleanup prefill thinking Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compat tool-call văn bản thuần (`createPlainTextToolCallCompatWrapper`) và các wrapper proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - các wrapper payload và event nhẹ cho đường dẫn nhà cung cấp nóng, bao gồm `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` và `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` và các helper schema nhà cung cấp nền tảng.

      Với các nhà cung cấp thuộc nhóm Gemini, hãy giữ chế độ reasoning-output khớp với transport. Nhà cung cấp Google Gemini API trực tiếp nên dùng output reasoning `native` để OpenClaw tiêu thụ native thought parts mà không thêm chỉ thị prompt `<think>` / `<final>`. Các backend kiểu Gemini CLI chỉ có văn bản, phân tích phản hồi JSON/văn bản cuối cùng, có thể giữ hợp đồng tagged `google-gemini` dùng chung.

      Một số helper stream cố ý ở lại cục bộ theo nhà cung cấp. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` và các builder wrapper Anthropic cấp thấp hơn trong seam `api.ts` / `contract-api.ts` công khai riêng vì chúng mã hóa xử lý beta Claude OAuth và gating `context1m`. Plugin xAI tương tự giữ tạo hình Responses xAI gốc trong `wrapStreamFn` riêng của nó (bí danh `/fast`, `tool_stream` mặc định, cleanup strict-tool không được hỗ trợ, loại bỏ payload reasoning riêng cho xAI).

      Mẫu package-root tương tự cũng hỗ trợ `@openclaw/openai-provider` (builder nhà cung cấp, helper mô hình mặc định, builder nhà cung cấp realtime) và `@openclaw/openrouter-provider` (builder nhà cung cấp cộng với helper onboarding/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Trao đổi token">
        Với các nhà cung cấp cần trao đổi token trước mỗi lệnh gọi inference:

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
        Với các nhà cung cấp cần header yêu cầu tùy chỉnh hoặc sửa đổi body:

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
      <Tab title="Định danh transport gốc">
        Với các nhà cung cấp cần header yêu cầu/phiên gốc hoặc metadata trên các transport HTTP hoặc WebSocket chung:

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
        Đối với các provider công bố dữ liệu mức sử dụng/thanh toán:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` có ba kết quả. Trả về `{ token, accountId? }`
        khi provider có thông tin xác thực mức sử dụng/thanh toán. Chỉ trả về
        `{ handled: true }` khi provider đã xử lý chắc chắn xác thực mức sử dụng
        nhưng không có token mức sử dụng khả dụng, và OpenClaw phải bỏ qua phương án dự phòng
        API-key/OAuth chung. Trả về `null` hoặc `undefined` khi provider
        chưa xử lý yêu cầu và OpenClaw nên tiếp tục với phương án dự phòng chung.
      </Tab>
    </Tabs>

    <Accordion title="Tất cả hook provider có sẵn">
      OpenClaw gọi các hook theo thứ tự này. Hầu hết provider chỉ dùng 2-3:
      Các trường provider chỉ dành cho tương thích mà OpenClaw không còn gọi, chẳng hạn như
      `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được liệt kê
      ở đây.

      | # | Hook | Khi nào sử dụng |
      | --- | --- | --- |
      | 1 | `catalog` | Catalog model hoặc mặc định URL cơ sở |
      | 2 | `applyConfigDefaults` | Các mặc định toàn cục do provider sở hữu trong quá trình vật chất hóa cấu hình |
      | 3 | `normalizeModelId` | Dọn dẹp alias model-id cũ/bản xem trước trước khi tra cứu |
      | 4 | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` theo họ provider trước khi lắp ráp model chung |
      | 5 | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Ghi lại tương thích streaming-usage gốc cho các provider cấu hình |
      | 7 | `resolveConfigApiKey` | Phân giải xác thực env-marker do provider sở hữu |
      | 8 | `resolveSyntheticAuth` | Xác thực tổng hợp local/tự host hoặc dựa trên cấu hình |
      | 9 | `shouldDeferSyntheticProfileAuth` | Hạ mức placeholder profile đã lưu tổng hợp xuống sau xác thực env/cấu hình |
      | 10 | `resolveDynamicModel` | Chấp nhận ID model upstream tùy ý |
      | 11 | `prepareDynamicModel` | Lấy metadata bất đồng bộ trước khi phân giải |
      | 12 | `normalizeResolvedModel` | Ghi lại transport trước runner |
      | 13 | `normalizeToolSchemas` | Dọn dẹp tool-schema do provider sở hữu trước khi đăng ký |
      | 14 | `inspectToolSchemas` | Chẩn đoán tool-schema do provider sở hữu |
      | 15 | `resolveReasoningOutputMode` | Hợp đồng reasoning-output được gắn thẻ so với gốc |
      | 16 | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | 17 | `createStreamFn` | Transport StreamFn tùy chỉnh hoàn toàn |
      | 19 | `wrapStreamFn` | Wrapper header/body tùy chỉnh trên đường dẫn stream bình thường |
      | 20 | `resolveTransportTurnState` | Header/metadata gốc theo từng lượt |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down phiên WS gốc |
      | 22 | `formatApiKey` | Hình dạng token runtime tùy chỉnh |
      | 23 | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | 24 | `buildAuthDoctorHint` | Hướng dẫn sửa xác thực |
      | 25 | `matchesContextOverflowError` | Phát hiện tràn do provider sở hữu |
      | 26 | `classifyFailoverReason` | Phân loại rate-limit/quá tải do provider sở hữu |
      | 27 | `isCacheTtlEligible` | Chặn TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | 29 | `augmentModelCatalog` | Hàng tổng hợp tương thích tiến về sau |
      | 30 | `resolveThinkingProfile` | Bộ tùy chọn `/think` theo model |
      | 31 | `isBinaryThinking` | Tương thích bật/tắt suy nghĩ nhị phân |
      | 32 | `supportsXHighThinking` | Tương thích hỗ trợ reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định |
      | 34 | `isModernModelRef` | Khớp model live/smoke |
      | 35 | `prepareRuntimeAuth` | Trao đổi token trước suy luận |
      | 36 | `resolveUsageAuth` | Phân tích thông tin xác thực mức sử dụng tùy chỉnh |
      | 37 | `fetchUsageSnapshot` | Endpoint mức sử dụng tùy chỉnh |
      | 38 | `createEmbeddingProvider` | Adapter embedding do provider sở hữu cho bộ nhớ/tìm kiếm |
      | 39 | `buildReplayPolicy` | Chính sách phát lại transcript/compaction tùy chỉnh |
      | 40 | `sanitizeReplayHistory` | Ghi lại phát lại theo provider sau bước dọn dẹp chung |
      | 41 | `validateReplayTurns` | Xác thực nghiêm ngặt lượt phát lại trước runner nhúng |
      | 42 | `onModelSelected` | Callback sau khi chọn (ví dụ: telemetry) |

      Ghi chú về phương án dự phòng runtime:

      - `normalizeConfig` kiểm tra provider khớp trước, rồi đến các provider plugin khác có hỗ trợ hook cho đến khi có một provider thật sự thay đổi cấu hình. Nếu không hook provider nào ghi lại một mục cấu hình họ Google được hỗ trợ, bộ chuẩn hóa cấu hình Google đi kèm vẫn được áp dụng.
      - `resolveConfigApiKey` dùng hook provider khi được công bố. Amazon Bedrock giữ phân giải env-marker AWS trong provider plugin của nó; bản thân xác thực runtime vẫn dùng chuỗi mặc định AWS SDK khi được cấu hình với `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` nhận `provider`, `modelId` đã chọn, gợi ý catalog `reasoning` đã hợp nhất tùy chọn, và các dữ kiện `compat` model đã hợp nhất tùy chọn. Chỉ dùng `compat` để chọn UI/profile thinking của provider.
      - `resolveSystemPromptContribution` cho phép provider chèn hướng dẫn system-prompt có nhận biết cache cho một họ model. Ưu tiên nó hơn `before_prompt_build` khi hành vi thuộc về một provider/họ model và cần giữ nguyên phần tách cache ổn định/động.

      Để xem mô tả chi tiết và ví dụ thực tế, hãy xem [Nội bộ: Hook Runtime Provider](/vi/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Thêm khả năng bổ sung (tùy chọn)">
    ### Bước 5: Thêm khả năng bổ sung

    Một provider plugin có thể đăng ký embedding, speech, phiên âm realtime,
    giọng nói realtime, hiểu media, tạo ảnh, tạo video,
    web fetch và web search cùng với suy luận văn bản. OpenClaw phân loại đây là
    plugin **hybrid-capability** - mẫu được khuyến nghị cho plugin công ty
    (mỗi vendor một plugin). Xem
    [Nội bộ: Quyền sở hữu Capability](/vi/plugins/architecture#capability-ownership-model).

    Đăng ký từng capability bên trong `register(api)` cùng với lệnh gọi
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

        Dùng `assertOkOrThrowProviderError(...)` cho lỗi HTTP provider để
        các plugin chia sẻ việc đọc phần thân lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố request-id.
      </Tab>
      <Tab title="Phiên âm realtime">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` - helper dùng chung
        xử lý ghi nhận proxy, backoff kết nối lại, xả khi đóng, bắt tay sẵn sàng,
        xếp hàng audio và chẩn đoán sự kiện đóng. Plugin của bạn
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

        Các provider STT theo batch POST audio multipart nên dùng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Helper chuẩn hóa tên tệp tải lên,
        bao gồm các bản tải lên AAC cần tên tệp kiểu M4A cho
        API phiên âm tương thích.
      </Tab>
      <Tab title="Giọng nói realtime">
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
            // Chỉ đặt tùy chọn này nếu provider chấp nhận nhiều phản hồi tool cho
            // một lệnh gọi, ví dụ phản hồi "đang xử lý" ngay lập tức theo sau là
            // kết quả cuối cùng.
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
        phương thức truyền tải, định dạng âm thanh và cờ tính năng hợp lệ cho
        các máy khách Talk trên trình duyệt và native. Triển khai `handleBargeIn` khi một phương thức truyền tải có thể phát hiện rằng
        con người đang ngắt phần phát lại của trợ lý và nhà cung cấp hỗ trợ
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

        Các nhà cung cấp phương tiện cục bộ hoặc tự lưu trữ cố ý không yêu cầu
        thông tin xác thực có thể hiển thị `resolveAuth` và trả về `kind: "none"`.
        OpenClaw vẫn giữ cổng xác thực thông thường cho các nhà cung cấp không
        chọn tham gia một cách rõ ràng. Các nhà cung cấp hiện có có thể tiếp tục đọc `req.apiKey`;
        nhà cung cấp mới nên ưu tiên `req.auth`.

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

        Khai báo cùng id trong `contracts.embeddingProviders`. Đây là
        hợp đồng nhúng tổng quát để tạo vector có thể tái sử dụng, bao gồm
        tìm kiếm bộ nhớ. `registerMemoryEmbeddingProvider(...)` là lớp tương thích đã ngừng khuyến nghị
        cho các bộ điều hợp hiện có chuyên cho bộ nhớ.
      </Tab>
      <Tab title="Image and video generation">
        Các năng lực video dùng một dạng **nhận biết theo chế độ**: `generate`,
        `imageToVideo` và `videoToVideo`. Các trường tổng hợp phẳng như
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` không
        đủ để quảng bá hỗ trợ chế độ biến đổi hoặc các chế độ bị tắt một cách rõ ràng.
        Tạo nhạc tuân theo cùng mẫu với các khối `generate` /
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

Các plugin nhà cung cấp được xuất bản giống như mọi plugin mã bên ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Không dùng bí danh xuất bản cũ chỉ dành cho skill ở đây; các gói plugin nên dùng
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
| `simple`  | Lượt đầu tiên | Nhà cung cấp API-key đơn giản                 |
| `profile` | Sau simple    | Nhà cung cấp được kiểm soát bằng hồ sơ xác thực |
| `paired`  | Sau profile   | Tổng hợp nhiều mục liên quan                  |
| `late`    | Lượt cuối     | Ghi đè nhà cung cấp hiện có (thắng khi xung đột) |

## Bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - nếu plugin của bạn cũng cung cấp một kênh
- [SDK Runtime](/vi/plugins/sdk-runtime) - trình trợ giúp `api.runtime` (TTS, tìm kiếm, subagent)
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu nhập subpath đầy đủ
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) - chi tiết hook và ví dụ tích hợp sẵn

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Xây dựng plugin kênh](/vi/plugins/sdk-channel-plugins)
