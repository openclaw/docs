---
read_when:
    - Bạn đang xây dựng một plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu cơ chế xác thực của nhà cung cấp, các danh mục và các hook thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước xây dựng Plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng các plugin nhà cung cấp
x-i18n:
    generated_at: "2026-07-19T05:56:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Xây dựng Plugin nhà cung cấp để thêm một nhà cung cấp mô hình (LLM) vào OpenClaw: danh mục mô hình, xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Bạn mới làm quen với các Plugin OpenClaw? Trước tiên, hãy đọc [Bắt đầu](/vi/plugins/building-plugins)
  để tìm hiểu cấu trúc gói và cách thiết lập manifest.
</Info>

<Tip>
  Plugin nhà cung cấp thêm các mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu
  mô hình phải chạy qua một daemon tác nhân gốc quản lý các luồng, Compaction
  hoặc sự kiện công cụ, hãy ghép nhà cung cấp với một [harness tác
  nhân](/vi/plugins/sdk-agent-harness) thay vì đưa chi tiết giao thức daemon
  vào lõi.
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
      "description": "Nhà cung cấp mô hình Acme AI",
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
          "choiceLabel": "Khóa API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Khóa API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` cho phép OpenClaw phát hiện thông tin xác thực mà không
    cần tải runtime Plugin của bạn. Thêm `providerAuthAliases` khi một biến thể nhà cung cấp
    cần dùng lại thông tin xác thực của id nhà cung cấp khác. `modelSupport` là
    tùy chọn và cho phép OpenClaw tự động tải Plugin nhà cung cấp của bạn từ
    id mô hình dạng viết tắt như `acme-large` trước khi có các hook runtime. `openclaw.compat`
    và `openclaw.build` trong `package.json` là bắt buộc để phát hành trên ClawHub
    (`openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`
    là hai trường bắt buộc; `minGatewayVersion` sẽ dùng
    `openclaw.install.minHostVersion` làm giá trị dự phòng khi bị lược bỏ).

  </Step>

  <Step title="Đăng ký nhà cung cấp">
    Một nhà cung cấp văn bản tối thiểu cần `id`, `label`, `auth` và `catalog`.
    `catalog` là hook runtime/cấu hình do nhà cung cấp sở hữu; hook này có thể gọi
    API trực tiếp của nhà cung cấp và trả về các mục `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Nhà cung cấp mô hình Acme AI",
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
              label: "Khóa API Acme AI",
              hint: "Khóa API từ bảng điều khiển Acme AI của bạn",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Nhập khóa API Acme AI của bạn",
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

    `registerModelCatalogProvider` là bề mặt danh mục mặt phẳng điều khiển mới hơn
    dành cho giao diện người dùng danh sách/trợ giúp/trình chọn, bao gồm các hàng `text`, `voice`, `image_generation`,
    `video_generation` và `music_generation`. Giữ các lệnh gọi điểm cuối của nhà cung cấp
    và việc ánh xạ phản hồi trong Plugin; OpenClaw quản lý hình dạng hàng dùng chung,
    nhãn nguồn và cách hiển thị trợ giúp.

    Như vậy là đã có một nhà cung cấp hoạt động được. Giờ đây, người dùng có thể chạy
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình.

    ### Khám phá mô hình trực tiếp

    Nếu nhà cung cấp cung cấp API kiểu `/models`, hãy giữ điểm cuối
    riêng của nhà cung cấp và phép chiếu hàng trong Plugin, đồng thời sử dụng
    `openclaw/plugin-sdk/provider-catalog-live-runtime` cho vòng đời tìm nạp
    dùng chung. Trình trợ giúp cung cấp các yêu cầu tìm nạp HTTP có kiểm soát, tiêu đề xác thực của nhà cung cấp,
    lỗi HTTP có cấu trúc, bộ nhớ đệm TTL và hành vi dự phòng tĩnh mà không
    đưa chính sách nhà cung cấp vào lõi OpenClaw.

    Sử dụng `buildLiveModelProviderConfig` khi API trực tiếp chỉ cho biết
    những hàng danh mục tĩnh do nhà cung cấp sở hữu nào hiện đang khả dụng:

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

    Sử dụng `getCachedLiveProviderModelRows` khi API nhà cung cấp trả về siêu dữ liệu
    phong phú hơn và Plugin cần tự chiếu các hàng thành định nghĩa mô hình
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

    `run` phải tiếp tục được kiểm soát bằng xác thực và trả về `null` khi không có
    thông tin xác thực khả dụng. Duy trì `staticRun` ngoại tuyến hoặc phương án dự phòng tĩnh để quá trình thiết lập, tài liệu,
    kiểm thử và các bề mặt trình chọn không phụ thuộc vào quyền truy cập mạng trực tiếp. Sử dụng TTL
    phù hợp với độ mới của danh sách mô hình, tránh thăm dò hệ thống tệp tại thời điểm yêu cầu
    và chỉ truyền `readRows` / `readModelId` dành riêng cho nhà cung cấp khi
    phản hồi thượng nguồn không có hình dạng `{ data: [{ id, object }] }`
    tương thích với OpenAI.

    Nếu nhà cung cấp thượng nguồn sử dụng các token điều khiển khác OpenClaw, hãy thêm một
    phép biến đổi văn bản hai chiều nhỏ thay vì thay thế đường dẫn luồng:

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

    `input` viết lại lời nhắc hệ thống cuối cùng và nội dung tin nhắn văn bản trước khi
    truyền tải. `output` viết lại các phần gia tăng văn bản của trợ lý và văn bản cuối cùng trước khi
    OpenClaw phân tích các dấu điều khiển của chính nó hoặc chuyển đến kênh.

    Đối với các nhà cung cấp đi kèm chỉ đăng ký một nhà cung cấp văn bản có xác thực
    bằng khóa API cùng một runtime duy nhất dựa trên danh mục, nên ưu tiên trình trợ giúp
    `defineSingleProviderPluginEntry(...)` có phạm vi hẹp hơn:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Nhà cung cấp mô hình Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Khóa API Acme AI",
            hint: "Khóa API từ bảng điều khiển Acme AI của bạn",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Nhập khóa API Acme AI của bạn",
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

    `buildProvider` là đường dẫn danh mục trực tiếp được dùng khi OpenClaw có thể phân giải thông tin xác thực thực tế
    của nhà cung cấp. Đường dẫn này có thể thực hiện việc khám phá dành riêng cho nhà cung cấp. Chỉ dùng
    `buildStaticProvider` cho các hàng ngoại tuyến có thể hiển thị an toàn trước khi cấu hình
    xác thực; đường dẫn này không được yêu cầu thông tin xác thực hoặc thực hiện yêu cầu mạng.
    Phần hiển thị `models list --all` của OpenClaw hiện chỉ thực thi các danh mục tĩnh
    cho các plugin nhà cung cấp được đóng gói, với cấu hình trống, môi trường trống và không có
    đường dẫn tác nhân/không gian làm việc.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, các bí danh và
    mô hình mặc định của tác nhân trong quá trình thiết lập ban đầu, hãy dùng các trình trợ giúp cấu hình sẵn từ
    `openclaw/plugin-sdk/provider-onboard`. Các trình trợ giúp có phạm vi hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` và
    `createModelCatalogPresetAppliers(...)`.

    Khi điểm cuối gốc của nhà cung cấp hỗ trợ các khối mức sử dụng dạng luồng trên
    phương thức truyền tải `openai-completions` thông thường, hãy ưu tiên các trình trợ giúp danh mục dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì mã hóa cứng
    các bước kiểm tra mã định danh nhà cung cấp. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện khả năng hỗ trợ từ
    bản đồ năng lực của điểm cuối, vì vậy các điểm cuối gốc kiểu Moonshot/DashScope vẫn
    có thể chủ động bật tính năng ngay cả khi plugin đang dùng mã định danh nhà cung cấp tùy chỉnh.

    Các ví dụ khám phá trực tiếp ở trên áp dụng cho API nhà cung cấp kiểu `/models`. Hãy giữ
    hoạt động khám phá đó bên trong `catalog.run`, chỉ cho phép khi có thông tin xác thực khả dụng, và giữ
    `staticRun` không sử dụng mạng để tạo danh mục ngoại tuyến.

  </Step>

  <Step title="Thêm khả năng phân giải mô hình động">
    Nếu nhà cung cấp của bạn chấp nhận mã định danh mô hình tùy ý (như proxy hoặc bộ định tuyến),
    hãy thêm `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, nhãn, xác thực, danh mục ở trên

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

    Nếu việc phân giải yêu cầu một lệnh gọi mạng, hãy dùng `prepareDynamicModel` để khởi động
    bất đồng bộ - `resolveDynamicModel` sẽ chạy lại sau khi quá trình này hoàn tất.

  </Step>

  <Step title="Thêm các hook thời gian chạy (khi cần)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Hãy thêm các hook
    từng bước theo yêu cầu của nhà cung cấp.

    Các trình tạo trợ giúp dùng chung hiện hỗ trợ những nhóm tương thích phát lại/công cụ
    phổ biến nhất, vì vậy plugin thường không cần tự kết nối từng hook một:

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

    Các nhóm phát lại hiện có:

    | Nhóm | Thành phần được kết nối | Ví dụ được đóng gói |
    | --- | --- | --- |
    | `openai-compatible` | Chính sách phát lại kiểu OpenAI dùng chung cho các phương thức truyền tải tương thích với OpenAI, bao gồm làm sạch mã định danh lệnh gọi công cụ, sửa thứ tự ưu tiên trợ lý trước và xác thực lượt Gemini chung khi phương thức truyền tải yêu cầu | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách phát lại nhận biết Claude do `modelId` chọn, để các phương thức truyền tải thông điệp Anthropic chỉ nhận thao tác dọn dẹp khối suy luận dành riêng cho Claude khi mô hình đã phân giải thực sự là một mã định danh Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Cùng chính sách Claude-theo-mô-hình như `anthropic-by-model`, cộng thêm việc làm sạch mã định danh lệnh gọi công cụ và bảo toàn mã định danh sử dụng công cụ gốc của Anthropic cho các phương thức truyền tải phải giữ mã định danh gốc của nhà cung cấp | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Chính sách phát lại Gemini gốc cùng với việc làm sạch phát lại khởi động. Nhóm dùng chung giữ Gemini CLI đầu ra văn bản ở chế độ suy luận có thẻ; nhà cung cấp `google` trực tiếp ghi đè `resolveReasoningOutputMode` thành `native` vì suy luận của API Gemini được truyền đến dưới dạng các phần suy nghĩ gốc. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Làm sạch chữ ký suy nghĩ Gemini cho các mô hình Gemini chạy qua phương thức truyền tải proxy tương thích với OpenAI; không bật xác thực phát lại Gemini gốc hoặc ghi lại dữ liệu khởi động | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách kết hợp dành cho nhà cung cấp trộn lẫn các bề mặt mô hình thông điệp Anthropic và tương thích với OpenAI trong một plugin; thao tác loại bỏ khối suy luận tùy chọn chỉ dành cho Claude vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các nhóm luồng hiện có:

    | Nhóm | Thành phần được kết nối | Ví dụ được đóng gói |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa tải trọng suy luận Gemini trên đường dẫn luồng dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Trình bao suy luận Kilo trên đường dẫn luồng proxy dùng chung, trong đó `kilo-auto/balanced` và các mã định danh suy luận proxy không được hỗ trợ sẽ bỏ qua phần suy luận được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ tải trọng suy luận gốc nhị phân Moonshot từ cấu hình + cấp độ `/think` | `moonshot` |
    | `minimax-fast-mode` | Ghi lại mô hình chế độ nhanh MiniMax trên đường dẫn luồng dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các trình bao Responses OpenAI/Codex gốc dùng chung: tiêu đề ghi công, `/fast`/`serviceTier`, độ chi tiết văn bản, tìm kiếm web Codex gốc, định hình tải trọng tương thích suy luận và quản lý ngữ cảnh Responses | `openai` |
    | `openrouter-thinking` | Trình bao suy luận OpenRouter cho các tuyến proxy, với việc bỏ qua mô hình không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Trình bao `tool_stream` được bật mặc định cho các nhà cung cấp như Z.AI muốn truyền phát công cụ trừ khi bị vô hiệu hóa rõ ràng | `zai` |

    <Accordion title="Các seam SDK hỗ trợ trình tạo nhóm">
      Mỗi trình tạo nhóm được cấu thành từ các trình trợ giúp công khai cấp thấp hơn được xuất từ cùng gói, bạn có thể dùng chúng khi nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` và các trình tạo phát lại thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Đồng thời xuất các trình trợ giúp phát lại Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và các trình trợ giúp điểm cuối/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cùng các trình bao OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), trình bao tương thích với OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp phần điền trước suy luận của Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), khả năng tương thích lệnh gọi công cụ dạng văn bản thuần (`createPlainTextToolCallCompatWrapper`) và các trình bao proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - các trình bao tải trọng và sự kiện nhẹ cho đường dẫn nhà cung cấp nóng, bao gồm `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` và `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` và các trình trợ giúp lược đồ nhà cung cấp nền tảng.

      Đối với các nhà cung cấp thuộc nhóm Gemini, hãy giữ chế độ đầu ra suy luận phù hợp với
      phương thức truyền tải. Các nhà cung cấp API Google Gemini trực tiếp nên dùng đầu ra suy luận
      `native` để OpenClaw sử dụng các phần suy nghĩ gốc mà không thêm
      chỉ thị lời nhắc `<think>` / `<final>`. Các backend kiểu Gemini CLI chỉ có văn bản
      phân tích phản hồi JSON/văn bản cuối cùng có thể tiếp tục dùng hợp đồng có thẻ
      `google-gemini` dùng chung.

      Một số trình trợ giúp luồng được giữ cục bộ trong nhà cung cấp theo chủ ý. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` và các trình tạo trình bao Anthropic cấp thấp hơn trong seam `api.ts` / `contract-api.ts` công khai riêng vì chúng mã hóa việc xử lý Claude OAuth beta và kiểm soát `context1m`. Tương tự, plugin xAI giữ việc định hình Responses xAI gốc trong `wrapStreamFn` riêng (các bí danh `/fast`, `tool_stream` mặc định, dọn dẹp công cụ nghiêm ngặt không được hỗ trợ, loại bỏ tải trọng suy luận dành riêng cho xAI).

      Mẫu gốc gói tương tự cũng hỗ trợ `@openclaw/openai-provider` (các trình tạo nhà cung cấp, trình trợ giúp mô hình mặc định, trình tạo nhà cung cấp thời gian thực) và `@openclaw/openrouter-provider` (trình tạo nhà cung cấp cùng các trình trợ giúp thiết lập ban đầu/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Trao đổi token">
        Dành cho các nhà cung cấp cần trao đổi token trước mỗi lệnh gọi suy luận:

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
        Dành cho các nhà cung cấp cần tiêu đề yêu cầu tùy chỉnh hoặc sửa đổi nội dung:

        ```typescript
        // wrapStreamFn trả về một StreamFn được dẫn xuất từ ctx.streamFn
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
      <Tab title="Danh tính phương thức truyền tải gốc">
        Dành cho các nhà cung cấp cần tiêu đề hoặc siêu dữ liệu yêu cầu/phiên gốc trên
        phương thức truyền tải HTTP hoặc WebSocket chung:

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
        Dành cho các nhà cung cấp cung cấp dữ liệu mức sử dụng/thanh toán:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` có ba kết quả. Trả về
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` khi
        nhà cung cấp có thông tin xác thực sử dụng/thanh toán (các trường tùy chọn chuyển
        siêu dữ liệu gói không bí mật từ hồ sơ đã phân giải vào
        `fetchUsageSnapshot`). Chỉ trả về
        `{ handled: true }` khi nhà cung cấp chắc chắn đã xử lý việc xác thực sử dụng
        nhưng không có token sử dụng khả dụng, và OpenClaw phải bỏ qua cơ chế dự phòng
        khóa API/OAuth chung. Trả về `null` hoặc `undefined` khi nhà cung cấp
        không xử lý yêu cầu và OpenClaw nên tiếp tục với cơ chế dự phòng chung.

        Khai báo ID nhà cung cấp trong `contracts.usageProviders`. Khi hợp đồng
        manifest đó và **cả hai** hook đều hiện diện, OpenClaw tự động đưa
        nhà cung cấp vào quá trình thu thập mức sử dụng mà không tải các Plugin
        nhà cung cấp không liên quan. Không cần cập nhật danh sách cho phép của lõi.
        `fetchUsageSnapshot` trả về cấu trúc dùng chung, trung lập với nhà cung cấp:

        - `plan`: nhãn gói đăng ký hoặc khóa do nhà cung cấp báo cáo
        - `windows`: các khoảng hạn mức có thể đặt lại dưới dạng phần trăm đã sử dụng
        - `billing`: các mục `balance`, `spend` hoặc `budget` có kiểu; `unit` có thể là
          một đơn vị tiền tệ ISO hoặc đơn vị của nhà cung cấp như `credits`
        - `summary`: ngữ cảnh nhỏ gọn dành riêng cho nhà cung cấp không phù hợp với
          các trường có cấu trúc đó

        Giữ nguyên chính xác ngữ nghĩa tiền tệ. Tín dụng của nhà cung cấp không phải là USD trừ khi
        hợp đồng thượng nguồn quy định như vậy. Một Plugin chỉ triển khai
        `fetchUsageSnapshot` vẫn khả dụng cho các bên gọi tường minh/tổng hợp nhưng
        không được tự động phát hiện, vì OpenClaw không thể phân giải thông tin xác thực sử dụng của Plugin đó.
      </Tab>
    </Tabs>

    <Accordion title="Các hook nhà cung cấp phổ biến">
      OpenClaw gọi các hook theo thứ tự gần đúng sau đây đối với các Plugin mô hình/nhà cung cấp.
      Hầu hết nhà cung cấp chỉ sử dụng 2-3 hook. Đây không phải là toàn bộ hợp đồng
      `ProviderPlugin` - xem [Nội bộ: Hook thời gian chạy của nhà cung cấp
      ](/vi/plugins/architecture-internals#provider-runtime-hooks) để biết
      danh sách hook đầy đủ, chính xác ở thời điểm hiện tại và các lưu ý về cơ chế dự phòng.
      Các trường nhà cung cấp chỉ dành cho tương thích mà OpenClaw không còn gọi, chẳng hạn như
      `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được liệt kê
      tại đây.

      | Hook | Khi nào sử dụng |
      | --- | --- |
      | `catalog` | Danh mục mô hình hoặc giá trị mặc định của URL cơ sở |
      | `applyConfigDefaults` | Giá trị mặc định toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình |
      | `normalizeModelId` | Dọn dẹp bí danh ID mô hình cũ/xem trước trước khi tra cứu |
      | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung |
      | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Viết lại tương thích mức sử dụng luồng gốc cho các nhà cung cấp cấu hình |
      | `resolveConfigApiKey` | Phân giải xác thực bằng dấu môi trường do nhà cung cấp sở hữu |
      | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự lưu trữ hoặc dựa trên cấu hình |
      | `resolveExternalAuthProfiles` | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu cho thông tin xác thực do CLI/ứng dụng quản lý |
      | `shouldDeferSyntheticProfileAuth` | Hạ các phần giữ chỗ hồ sơ được lưu tổng hợp xuống sau xác thực bằng môi trường/cấu hình |
      | `resolveDynamicModel` | Chấp nhận ID mô hình thượng nguồn tùy ý |
      | `prepareDynamicModel` | Tìm nạp siêu dữ liệu bất đồng bộ trước khi phân giải |
      | `normalizeResolvedModel` | Viết lại phương thức truyền tải trước trình chạy |
      | `normalizeToolSchemas` | Dọn dẹp lược đồ công cụ do nhà cung cấp sở hữu trước khi đăng ký |
      | `inspectToolSchemas` | Chẩn đoán lược đồ công cụ do nhà cung cấp sở hữu |
      | `resolveReasoningOutputMode` | Hợp đồng đầu ra suy luận có gắn thẻ so với gốc |
      | `prepareExtraParams` | Tham số yêu cầu mặc định |
      | `createStreamFn` | Phương thức truyền tải StreamFn hoàn toàn tùy chỉnh |
      | `wrapStreamFn` | Trình bao bọc header/body tùy chỉnh trên đường dẫn luồng thông thường |
      | `resolveTransportTurnState` | Header/siêu dữ liệu gốc cho mỗi lượt |
      | `resolveWebSocketSessionPolicy` | Header phiên WS/thời gian chờ gốc |
      | `formatApiKey` | Cấu trúc token thời gian chạy tùy chỉnh |
      | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | `buildAuthDoctorHint` | Hướng dẫn sửa chữa xác thực |
      | `matchesContextOverflowError` | Phát hiện tràn do nhà cung cấp sở hữu |
      | `classifyFailoverReason` | Phân loại giới hạn tốc độ/quá tải do nhà cung cấp sở hữu |
      | `isCacheTtlEligible` | Kiểm soát TTL bộ nhớ đệm prompt |
      | `buildMissingAuthMessage` | Gợi ý thiếu xác thực tùy chỉnh |
      | `augmentModelCatalog` | Các hàng tương thích chuyển tiếp tổng hợp (đã lỗi thời - ưu tiên `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Tập tùy chọn `/think` dành riêng cho mô hình |
      | `isBinaryThinking` | Tương thích bật/tắt tư duy nhị phân (đã lỗi thời - ưu tiên `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Tương thích hỗ trợ suy luận `xhigh` (đã lỗi thời - ưu tiên `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Tương thích chính sách `/think` mặc định (đã lỗi thời - ưu tiên `resolveThinkingProfile`) |
      | `isModernModelRef` | Đối sánh mô hình trực tiếp/kiểm thử nhanh |
      | `prepareRuntimeAuth` | Trao đổi token trước khi suy luận |
      | `resolveUsageAuth` | Phân tích thông tin xác thực sử dụng tùy chỉnh |
      | `fetchUsageSnapshot` | Điểm cuối mức sử dụng tùy chỉnh |
      | `createEmbeddingProvider` | Bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm |
      | `buildReplayPolicy` | Chính sách phát lại bản ghi/Compaction tùy chỉnh |
      | `sanitizeReplayHistory` | Viết lại phát lại dành riêng cho nhà cung cấp sau khi dọn dẹp chung |
      | `validateReplayTurns` | Xác thực nghiêm ngặt lượt phát lại trước trình chạy nhúng |
      | `onModelSelected` | Callback sau khi lựa chọn (ví dụ: đo từ xa) |

      Lưu ý về cơ chế dự phòng thời gian chạy:

      - `normalizeConfig` phân giải một Plugin sở hữu cho mỗi ID nhà cung cấp (nhà cung cấp đi kèm trước, sau đó đến Plugin thời gian chạy khớp) và chỉ gọi hook đó - không quét qua các nhà cung cấp khác. Hook `normalizeConfig` riêng của Google là thành phần chuẩn hóa các mục cấu hình `google` / `google-vertex` / `google-antigravity`; đây không phải là cơ chế dự phòng lõi riêng biệt.
      - `resolveConfigApiKey` sử dụng hook nhà cung cấp khi được cung cấp. Amazon Bedrock giữ việc phân giải dấu môi trường AWS trong Plugin nhà cung cấp của mình; bản thân xác thực thời gian chạy vẫn sử dụng chuỗi mặc định của AWS SDK khi được cấu hình với `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` nhận `provider`, `modelId` đã chọn, gợi ý danh mục `reasoning` đã hợp nhất tùy chọn và các dữ kiện mô hình `compat` đã hợp nhất tùy chọn. Chỉ sử dụng `compat` để chọn giao diện/hồ sơ tư duy của nhà cung cấp.
      - `resolveSystemPromptContribution` cho phép nhà cung cấp chèn hướng dẫn prompt hệ thống có nhận biết bộ nhớ đệm cho một họ mô hình. Ưu tiên hook này thay vì hook `before_prompt_build` cũ áp dụng cho toàn Plugin khi hành vi thuộc về một họ nhà cung cấp/mô hình và cần duy trì sự phân tách bộ nhớ đệm ổn định/động.

    </Accordion>

  </Step>

  <Step title="Thêm các khả năng bổ sung (tùy chọn)">
    ### Bước 5: Thêm các khả năng bổ sung

    Một Plugin nhà cung cấp có thể đăng ký embedding, giọng nói, phiên âm thời gian thực,
    thoại thời gian thực, hiểu nội dung đa phương tiện, tạo hình ảnh, tạo video,
    tìm nạp web và tìm kiếm web cùng với suy luận văn bản. OpenClaw phân loại đây là một
    Plugin **khả năng lai** - mẫu được khuyến nghị cho các Plugin của công ty
    (một Plugin cho mỗi nhà cung cấp). Xem
    [Nội bộ: Quyền sở hữu khả năng](/vi/plugins/architecture#capability-ownership-model).

    Đăng ký từng khả năng bên trong `register(api)` cùng với lời gọi
    `api.registerProvider(...)` hiện có. Chỉ chọn các tab bạn cần:

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

        Sử dụng `assertOkOrThrowProviderError(...)` cho các lỗi HTTP của nhà cung cấp để
        các Plugin dùng chung cơ chế đọc body lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố ID yêu cầu.
      </Tab>
      <Tab title="Phiên âm thời gian thực">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` - trình trợ giúp dùng chung
        xử lý việc thu nhận proxy, thời gian chờ kết nối lại, đẩy dữ liệu khi đóng, quy trình bắt tay
        sẵn sàng, xếp hàng âm thanh và chẩn đoán sự kiện đóng. Plugin của bạn
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

        Các nhà cung cấp STT theo lô POST âm thanh multipart nên sử dụng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Trình trợ giúp chuẩn hóa tên tệp tải lên,
        bao gồm các bản tải lên AAC cần tên tệp kiểu M4A để tương thích với
        các API phiên âm.
      </Tab>
      <Tab title="Giọng nói thời gian thực">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Giọng nói thời gian thực Acme",
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
            // Chỉ đặt tùy chọn này nếu nhà cung cấp chấp nhận nhiều phản hồi công cụ cho
            // một lệnh gọi, ví dụ một phản hồi "đang xử lý" ngay lập tức, sau đó là
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

        Khai báo `capabilities` để `talk.catalog` có thể cung cấp các chế độ,
        phương thức truyền tải, định dạng âm thanh và cờ tính năng hợp lệ cho các ứng dụng
        Talk trên trình duyệt và nền tảng gốc. Triển khai `handleBargeIn` khi một phương thức truyền tải có thể phát hiện
        người dùng đang ngắt phần phát lại của trợ lý và nhà cung cấp hỗ trợ
        cắt ngắn hoặc xóa phản hồi âm thanh đang hoạt động.
        `submitToolResult` có thể trả về `void` để gửi đồng bộ hoặc một
        `Promise<void>` cho ranh giới hoàn tất bất đồng bộ mà cầu nối
        nhà cung cấp có thể cung cấp. Các phiên chuyển tiếp Gateway chờ promise đó trước khi
        xác nhận kết quả cuối cùng hoặc xóa lượt chạy được liên kết; hãy từ chối promise khi
        việc gửi thất bại.
        Đặt `supportsToolResultSuppression: false` khi nhà cung cấp không thể
        tuân thủ `options.suppressResponse`. Khi đó, OpenClaw tránh áp dụng cơ chế chặn cho
        các kết quả buộc tham vấn nội bộ và hủy, đồng thời từ chối trực tiếp
        các yêu cầu chặn kết quả thay vì âm thầm bắt đầu một phản hồi.
        Các bên sử dụng `createRealtimeVoiceBridgeSession` cũng có thể trả về một
        promise từ `onToolCall`; các lỗi ném đồng bộ và lần từ chối được chuyển
        đến callback `onError` của phiên.
        Chỉ đặt `handlesInputAudioBargeIn` khi VAD của nhà cung cấp xác nhận một
        lần gián đoạn bằng cách gọi `onClearAudio("barge-in")`. Các nhà cung cấp không đặt
        cờ này sẽ sử dụng cơ chế phát hiện dự phòng âm thanh đầu vào cục bộ của OpenClaw.
      </Tab>
      <Tab title="Hiểu nội dung đa phương tiện">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Ảnh chụp về..." }),
          transcribeAudio: async (req) => ({ text: "Bản phiên âm..." }),
        });
        ```

        Các nhà cung cấp đa phương tiện cục bộ hoặc tự lưu trữ chủ ý không yêu cầu
        thông tin xác thực có thể cung cấp `resolveAuth` và trả về `kind: "none"`.
        OpenClaw vẫn duy trì cổng xác thực thông thường cho các nhà cung cấp không
        lựa chọn tham gia một cách rõ ràng. Các nhà cung cấp hiện có có thể tiếp tục đọc `req.apiKey`;
        các nhà cung cấp mới nên ưu tiên `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "Plugin local-audio không xác thực",
          }),
          transcribeAudio: async (req) => ({ text: "Bản phiên âm..." }),
        });
        ```
      </Tab>
      <Tab title="Embedding">
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

        Khai báo cùng một id trong `contracts.embeddingProviders`. Đây là
        hợp đồng embedding tổng quát để tạo vectơ có thể tái sử dụng, bao gồm
        tìm kiếm bộ nhớ. `registerMemoryEmbeddingProvider(...)` là khả năng tương thích đã lỗi thời
        dành cho các bộ điều hợp hiện có dành riêng cho bộ nhớ.
      </Tab>
      <Tab title="Tạo hình ảnh và video">
        Các khả năng hình ảnh và video sử dụng cấu trúc **nhận biết chế độ**. Các nhà cung cấp
        hình ảnh khai báo các khối khả năng bắt buộc `generate` và `edit`;
        các nhà cung cấp video khai báo `generate`, `imageToVideo` và
        `videoToVideo`. Các trường tổng hợp phẳng như `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` không đủ để công bố
        rõ ràng khả năng hỗ trợ chế độ chuyển đổi hoặc các chế độ bị vô hiệu hóa. Việc tạo nhạc
        tuân theo cùng mẫu `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Hình ảnh Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Video Acme",
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

        `capabilities` là bắt buộc đối với cả hai loại nhà cung cấp; `edit` và các
        khối chuyển đổi video (`imageToVideo`, `videoToVideo`) luôn cần một
        cờ `enabled` rõ ràng.

        Sử dụng `catalogByModel` khi các chế độ hoặc khả năng tĩnh của mô hình được liệt kê
        khác với giá trị mặc định của nhà cung cấp. Siêu dữ liệu này giúp
        `video_generate action=list` và các danh mục mô hình luôn chính xác mà không
        gọi mã của nhà cung cấp. Việc tra cứu và thực thi khả năng tại thời điểm yêu cầu
        vẫn thuộc về `resolveModelCapabilities` và `generateVideo`; hãy tái sử dụng
        cùng một hằng số khả năng cho cả hai đường dẫn khi có thể.
      </Tab>
      <Tab title="Tìm nạp và tìm kiếm trên web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Tìm nạp Acme",
          hint: "Tìm nạp các trang thông qua phần phụ trợ kết xuất của Acme.",
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
            description: "Tìm nạp một trang thông qua Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Tìm kiếm Acme",
          hint: "Tìm kiếm trên web thông qua phần phụ trợ tìm kiếm của Acme.",
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
            description: "Tìm kiếm trên web thông qua Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Cả hai loại nhà cung cấp đều dùng chung cấu trúc kết nối thông tin xác thực:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` và `createTool` đều
        là bắt buộc.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Kiểm thử">
    ### Bước 6: Kiểm thử

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Xuất đối tượng cấu hình nhà cung cấp từ index.ts hoặc một tệp chuyên biệt
    import { acmeProvider } from "./provider.js";

    describe("nhà cung cấp acme-ai", () => {
      it("phân giải các mô hình động", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("trả về danh mục khi có khóa", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("trả về danh mục null khi không có khóa", async () => {
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

Các Plugin nhà cung cấp được xuất bản giống như mọi Plugin mã bên ngoài khác:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` là một lệnh khác dùng để xuất bản thư mục skill,
không phải gói Plugin — không sử dụng lệnh đó ở đây.

## Cấu trúc tệp

```
<bundled-plugin-root>/acme-ai/
├── package.json              # siêu dữ liệu openclaw.providers
├── openclaw.plugin.json      # Tệp kê khai với siêu dữ liệu xác thực nhà cung cấp
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Kiểm thử
    └── usage.ts              # Điểm cuối mức sử dụng (tùy chọn)
```

## Tham chiếu thứ tự danh mục

`catalog.order` kiểm soát thời điểm danh mục của bạn được hợp nhất so với các
nhà cung cấp tích hợp sẵn:

| Thứ tự     | Thời điểm          | Trường hợp sử dụng                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Lượt đầu tiên    | Nhà cung cấp dùng khóa API thuần túy                         |
| `profile` | Sau loại đơn giản  | Nhà cung cấp bị giới hạn bởi hồ sơ xác thực                |
| `paired`  | Sau hồ sơ | Tổng hợp nhiều mục liên quan             |
| `late`    | Lượt cuối cùng     | Ghi đè nhà cung cấp hiện có (thắng khi xung đột) |

## Các bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - nếu Plugin của bạn cũng cung cấp một kênh
- [Runtime SDK](/vi/plugins/sdk-runtime) - các trình trợ giúp `api.runtime` (TTS, tìm kiếm, tác tử phụ)
- [Tổng quan về SDK](/vi/plugins/sdk-overview) - tài liệu tham khảo đầy đủ về nhập đường dẫn con
- [Nội bộ Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) - chi tiết hook và các ví dụ đi kèm

## Liên quan

- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Xây dựng Plugin kênh](/vi/plugins/sdk-channel-plugins)
