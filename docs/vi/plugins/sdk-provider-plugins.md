---
read_when:
    - Bạn đang xây dựng một Plugin nhà cung cấp mô hình mới
    - Bạn muốn thêm proxy tương thích với OpenAI hoặc LLM tùy chỉnh vào OpenClaw
    - Bạn cần hiểu cơ chế xác thực của nhà cung cấp, các danh mục và các hook thời gian chạy
sidebarTitle: Provider plugins
summary: Hướng dẫn từng bước xây dựng plugin nhà cung cấp mô hình cho OpenClaw
title: Xây dựng Plugin nhà cung cấp
x-i18n:
    generated_at: "2026-07-12T08:14:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Xây dựng Plugin nhà cung cấp để bổ sung một nhà cung cấp mô hình (LLM) vào OpenClaw: danh mục mô hình, xác thực bằng khóa API và phân giải mô hình động.

<Info>
  Bạn mới làm quen với các Plugin OpenClaw? Trước tiên, hãy đọc [Bắt đầu](/vi/plugins/building-plugins)
  để tìm hiểu cấu trúc gói và cách thiết lập tệp kê khai.
</Info>

<Tip>
  Các Plugin nhà cung cấp bổ sung mô hình vào vòng lặp suy luận thông thường của OpenClaw. Nếu
  mô hình phải chạy thông qua một tiến trình nền tác tử gốc quản lý luồng, Compaction
  hoặc sự kiện công cụ, hãy ghép nhà cung cấp với một [khung chạy
  tác tử](/vi/plugins/sdk-agent-harness) thay vì đưa chi tiết giao thức
  của tiến trình nền vào lõi.
</Tip>

## Hướng dẫn từng bước

<Steps>
  <Step title="Gói và tệp kê khai">
    ### Bước 1: Gói và tệp kê khai

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

    `setup.providers[].envVars` cho phép OpenClaw phát hiện thông tin xác thực mà không cần
    tải môi trường chạy Plugin của bạn. Thêm `providerAuthAliases` khi một biến thể
    nhà cung cấp cần tái sử dụng thông tin xác thực của một mã định danh nhà cung cấp khác. `modelSupport` là
    tùy chọn và cho phép OpenClaw tự động tải Plugin nhà cung cấp của bạn từ các mã định danh
    mô hình dạng rút gọn như `acme-large` trước khi có các móc môi trường chạy. `openclaw.compat`
    và `openclaw.build` trong `package.json` là bắt buộc để phát hành lên ClawHub
    (`openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`
    là hai trường bắt buộc; `minGatewayVersion` sẽ dùng
    `openclaw.install.minHostVersion` làm giá trị dự phòng nếu bị bỏ qua).

  </Step>

  <Step title="Đăng ký nhà cung cấp">
    Một nhà cung cấp văn bản tối thiểu cần có `id`, `label`, `auth` và `catalog`.
    `catalog` là móc cấu hình/môi trường chạy do nhà cung cấp sở hữu; móc này có thể gọi các
    API trực tiếp của nhà cung cấp và trả về các mục `models.providers`.

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

    `registerModelCatalogProvider` là bề mặt danh mục mới hơn của lớp điều khiển
    dành cho giao diện danh sách/trợ giúp/bộ chọn, bao gồm các hàng `text`, `voice`, `image_generation`,
    `video_generation` và `music_generation`. Hãy giữ các lệnh gọi điểm cuối
    của nhà cung cấp và việc ánh xạ phản hồi trong Plugin; OpenClaw quản lý cấu trúc hàng
    dùng chung, nhãn nguồn và cách hiển thị trợ giúp.

    Như vậy là đã có một nhà cung cấp hoạt động được. Giờ đây, người dùng có thể chạy
    `openclaw onboard --acme-ai-api-key <key>` và chọn
    `acme-ai/acme-large` làm mô hình của mình.

    ### Khám phá mô hình trực tiếp

    Nếu nhà cung cấp của bạn cung cấp một API kiểu `/models`, hãy giữ điểm cuối dành riêng
    cho nhà cung cấp và phép chiếu hàng trong Plugin của bạn, đồng thời sử dụng
    `openclaw/plugin-sdk/provider-catalog-live-runtime` cho vòng đời tìm nạp
    dùng chung. Trình trợ giúp cung cấp các yêu cầu tìm nạp HTTP được bảo vệ, tiêu đề xác thực nhà cung cấp,
    lỗi HTTP có cấu trúc, bộ nhớ đệm TTL và hành vi dự phòng tĩnh mà không
    đưa chính sách nhà cung cấp vào lõi OpenClaw.

    Sử dụng `buildLiveModelProviderConfig` khi API trực tiếp chỉ cho bạn biết những
    hàng danh mục tĩnh do nhà cung cấp sở hữu nào hiện đang khả dụng:

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

    Sử dụng `getCachedLiveProviderModelRows` khi API của nhà cung cấp trả về siêu dữ liệu
    phong phú hơn và Plugin cần tự chiếu các hàng thành định nghĩa mô hình
    của OpenClaw:

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

    `run` phải tiếp tục được kiểm soát bằng xác thực và trả về `null` khi không có thông tin xác thực
    khả dụng. Duy trì một `staticRun` ngoại tuyến hoặc phương án dự phòng tĩnh để quá trình thiết lập, tài liệu,
    kiểm thử và các bề mặt bộ chọn không phụ thuộc vào quyền truy cập mạng trực tiếp. Sử dụng TTL
    phù hợp với độ mới của danh sách mô hình, tránh thăm dò hệ thống tệp tại thời điểm yêu cầu
    và chỉ truyền `readRows` / `readModelId` dành riêng cho nhà cung cấp khi
    phản hồi từ thượng nguồn không có cấu trúc tương thích với OpenAI `{ data: [{ id, object }] }`.

    Nếu nhà cung cấp thượng nguồn sử dụng các mã điều khiển khác với OpenClaw, hãy thêm một
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

    `input` ghi lại lời nhắc hệ thống cuối cùng và nội dung tin nhắn văn bản trước khi
    truyền tải. `output` ghi lại các phần thay đổi văn bản của trợ lý và văn bản cuối cùng trước khi
    OpenClaw phân tích các dấu điều khiển của chính nó hoặc phân phối tới kênh.

    Đối với các nhà cung cấp đi kèm chỉ đăng ký một nhà cung cấp văn bản với xác thực
    bằng khóa API cùng một môi trường chạy duy nhất dựa trên danh mục, hãy ưu tiên trình trợ giúp
    `defineSingleProviderPluginEntry(...)` có phạm vi hẹp hơn:

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

    `buildProvider` là đường dẫn danh mục trực tiếp được sử dụng khi OpenClaw có thể phân giải thông tin xác thực thực tế
    của nhà cung cấp. Hàm này có thể thực hiện việc khám phá dành riêng cho nhà cung cấp. Chỉ sử dụng
    `buildStaticProvider` cho các hàng ngoại tuyến có thể hiển thị an toàn trước khi cấu hình
    xác thực; hàm này không được yêu cầu thông tin xác thực hoặc thực hiện yêu cầu mạng.
    Hiện tại, phần hiển thị `models list --all` của OpenClaw chỉ thực thi các danh mục tĩnh
    cho các Plugin nhà cung cấp được đóng gói, với cấu hình trống, môi trường trống và không có
    đường dẫn tác nhân/không gian làm việc.

    Nếu luồng xác thực của bạn cũng cần vá `models.providers.*`, bí danh và
    mô hình mặc định của tác nhân trong quá trình thiết lập ban đầu, hãy sử dụng các trình trợ giúp cài đặt sẵn từ
    `openclaw/plugin-sdk/provider-onboard`. Các trình trợ giúp có phạm vi hẹp nhất là
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` và
    `createModelCatalogPresetAppliers(...)`.

    Khi điểm cuối gốc của nhà cung cấp hỗ trợ các khối mức sử dụng được truyền phát trên
    cơ chế truyền tải `openai-completions` thông thường, hãy ưu tiên các trình trợ giúp danh mục dùng chung trong
    `openclaw/plugin-sdk/provider-catalog-shared` thay vì mã hóa cứng
    các phép kiểm tra mã định danh nhà cung cấp. `supportsNativeStreamingUsageCompat(...)` và
    `applyProviderNativeStreamingUsageCompat(...)` phát hiện khả năng hỗ trợ từ
    bản đồ khả năng của điểm cuối, nhờ đó các điểm cuối gốc kiểu Moonshot/DashScope vẫn
    có thể chủ động bật tính năng này ngay cả khi Plugin đang sử dụng mã định danh nhà cung cấp tùy chỉnh.

    Các ví dụ khám phá trực tiếp ở trên áp dụng cho API nhà cung cấp kiểu `/models`. Hãy giữ
    logic khám phá đó bên trong `catalog.run`, chỉ cho phép chạy khi có xác thực khả dụng, đồng thời giữ
    `staticRun` không sử dụng mạng để tạo danh mục ngoại tuyến.

  </Step>

  <Step title="Add dynamic model resolution">
    Nếu nhà cung cấp của bạn chấp nhận mã định danh mô hình tùy ý (chẳng hạn như proxy hoặc bộ định tuyến),
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

    Nếu việc phân giải yêu cầu gọi mạng, hãy sử dụng `prepareDynamicModel` để khởi động bất đồng bộ
    — `resolveDynamicModel` sẽ chạy lại sau khi quá trình đó hoàn tất.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Hầu hết nhà cung cấp chỉ cần `catalog` + `resolveDynamicModel`. Hãy thêm các hook
    từng bước khi nhà cung cấp của bạn yêu cầu.

    Các trình dựng trợ giúp dùng chung hiện hỗ trợ những nhóm tương thích phát lại/công cụ phổ biến nhất,
    vì vậy các Plugin thường không cần tự nối từng hook một:

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

    | Nhóm | Thành phần được nối vào | Ví dụ được đóng gói |
    | --- | --- | --- |
    | `openai-compatible` | Chính sách phát lại kiểu OpenAI dùng chung dành cho các cơ chế truyền tải tương thích với OpenAI, bao gồm làm sạch mã định danh lệnh gọi công cụ, sửa thứ tự ưu tiên trợ lý và xác thực lượt Gemini chung khi cơ chế truyền tải yêu cầu | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Chính sách phát lại có nhận biết Claude được chọn theo `modelId`, nhờ đó các cơ chế truyền tải tin nhắn Anthropic chỉ thực hiện dọn dẹp khối suy luận dành riêng cho Claude khi mô hình đã phân giải thực sự là mã định danh Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Cùng chính sách Claude theo mô hình như `anthropic-by-model`, cộng thêm làm sạch mã định danh lệnh gọi công cụ và giữ nguyên mã định danh sử dụng công cụ gốc của Anthropic cho các cơ chế truyền tải phải bảo toàn mã định danh gốc của nhà cung cấp | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Chính sách phát lại gốc của Gemini cùng với việc làm sạch phát lại khởi động. Nhóm dùng chung giữ Gemini CLI đầu ra văn bản ở chế độ suy luận có thẻ; nhà cung cấp trực tiếp `google` ghi đè `resolveReasoningOutputMode` thành `native` vì suy luận của Gemini API được trả về dưới dạng các phần suy nghĩ gốc. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Làm sạch chữ ký suy nghĩ Gemini cho các mô hình Gemini chạy qua cơ chế truyền tải proxy tương thích với OpenAI; không bật xác thực phát lại Gemini gốc hoặc ghi lại dữ liệu khởi động | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Chính sách kết hợp dành cho các nhà cung cấp trộn lẫn bề mặt mô hình tin nhắn Anthropic và tương thích với OpenAI trong một Plugin; việc loại bỏ khối suy luận tùy chọn chỉ dành cho Claude vẫn được giới hạn ở phía Anthropic | `minimax` |

    Các nhóm luồng hiện có:

    | Nhóm | Thành phần được nối vào | Ví dụ được đóng gói |
    | --- | --- | --- |
    | `google-thinking` | Chuẩn hóa tải trọng suy luận Gemini trên đường dẫn luồng dùng chung | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Trình bao bọc suy luận Kilo trên đường dẫn luồng proxy dùng chung, trong đó `kilo/auto` và các mã định danh suy luận proxy không được hỗ trợ sẽ bỏ qua suy luận được chèn | `kilocode` |
    | `moonshot-thinking` | Ánh xạ tải trọng suy luận gốc nhị phân của Moonshot từ cấu hình + cấp độ `/think` | `moonshot` |
    | `minimax-fast-mode` | Ghi lại mô hình ở chế độ nhanh MiniMax trên đường dẫn luồng dùng chung | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Các trình bao bọc Responses gốc dùng chung của OpenAI/Codex: tiêu đề ghi nguồn, `/fast`/`serviceTier`, mức độ chi tiết văn bản, tìm kiếm web gốc của Codex, định hình tải trọng tương thích suy luận và quản lý ngữ cảnh Responses | `openai` |
    | `openrouter-thinking` | Trình bao bọc suy luận OpenRouter cho các tuyến proxy, với việc bỏ qua mô hình không được hỗ trợ/`auto` được xử lý tập trung | `openrouter` |
    | `tool-stream-default-on` | Trình bao bọc `tool_stream` mặc định bật dành cho các nhà cung cấp như Z.AI muốn truyền phát công cụ trừ khi bị tắt rõ ràng | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Mỗi trình dựng nhóm được cấu thành từ các trình trợ giúp công khai cấp thấp hơn được xuất từ cùng một gói, bạn có thể sử dụng chúng khi nhà cung cấp cần đi lệch khỏi mẫu chung:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` và các trình dựng phát lại thô (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Đồng thời xuất các trình trợ giúp phát lại Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) và các trình trợ giúp điểm cuối/mô hình (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, cùng các trình bao bọc OpenAI/Codex dùng chung (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), trình bao bọc tương thích với OpenAI của DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dọn dẹp phần điền trước suy luận Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), tương thích lệnh gọi công cụ văn bản thuần túy (`createPlainTextToolCallCompatWrapper`) và các trình bao bọc proxy/nhà cung cấp dùng chung (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — các trình bao bọc tải trọng và sự kiện gọn nhẹ dành cho đường dẫn nóng của nhà cung cấp, bao gồm `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` và `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` và các trình trợ giúp lược đồ nhà cung cấp nền tảng.

      Đối với các nhà cung cấp thuộc nhóm Gemini, hãy giữ chế độ đầu ra suy luận phù hợp với
      cơ chế truyền tải. Các nhà cung cấp Google Gemini API trực tiếp nên sử dụng đầu ra suy luận
      `native` để OpenClaw sử dụng các phần suy nghĩ gốc mà không thêm
      chỉ thị lời nhắc `<think>` / `<final>`. Các phần phụ trợ kiểu Gemini CLI chỉ có văn bản,
      phân tích phản hồi JSON/văn bản cuối cùng, có thể tiếp tục sử dụng hợp đồng có thẻ
      `google-gemini` dùng chung.

      Một số trình trợ giúp luồng được giữ cục bộ trong nhà cung cấp có chủ đích. `@openclaw/anthropic-provider` giữ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` và các trình dựng trình bao bọc Anthropic cấp thấp hơn trong bề mặt công khai `api.ts` / `contract-api.ts` riêng vì chúng mã hóa việc xử lý OAuth beta của Claude và điều kiện bật `context1m`. Tương tự, Plugin xAI giữ việc định hình Responses gốc của xAI trong `wrapStreamFn` riêng (`/fast` aliases, `tool_stream` mặc định, dọn dẹp công cụ nghiêm ngặt không được hỗ trợ, loại bỏ tải trọng suy luận dành riêng cho xAI).

      Mẫu gốc gói tương tự cũng hỗ trợ `@openclaw/openai-provider` (các trình dựng nhà cung cấp, trình trợ giúp mô hình mặc định, trình dựng nhà cung cấp thời gian thực) và `@openclaw/openrouter-provider` (trình dựng nhà cung cấp cùng các trình trợ giúp thiết lập ban đầu/cấu hình).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Đối với các nhà cung cấp cần trao đổi mã thông báo trước mỗi lệnh gọi suy luận:

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
        Đối với các nhà cung cấp cần tiêu đề yêu cầu tùy chỉnh hoặc sửa đổi phần thân:

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
        Đối với các nhà cung cấp cần tiêu đề hoặc siêu dữ liệu yêu cầu/phiên gốc trên
        các cơ chế truyền tải HTTP hoặc WebSocket chung:

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
        Đối với các nhà cung cấp cung cấp dữ liệu về mức sử dụng/thanh toán:

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
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` khi nhà
        cung cấp có thông tin xác thực cho mức sử dụng/thanh toán (các trường tùy chọn
        chuyển siêu dữ liệu gói không bí mật từ hồ sơ đã phân giải vào
        `fetchUsageSnapshot`). Chỉ trả về
        `{ handled: true }` khi nhà cung cấp đã xử lý dứt khoát việc xác thực mức sử dụng
        nhưng không có token mức sử dụng khả dụng, và OpenClaw phải bỏ qua cơ chế dự phòng
        khóa API/OAuth chung. Trả về `null` hoặc `undefined` khi nhà cung cấp không
        xử lý yêu cầu và OpenClaw nên tiếp tục với cơ chế dự phòng chung.

        Khai báo mã định danh nhà cung cấp trong `contracts.usageProviders`. Khi hợp đồng
        manifest đó và **cả hai** hook đều hiện diện, OpenClaw tự động đưa
        nhà cung cấp vào quá trình thu thập mức sử dụng mà không tải các
        plugin nhà cung cấp không liên quan. Không cần cập nhật danh sách cho phép trong lõi.
        `fetchUsageSnapshot` trả về cấu trúc dùng chung, trung lập với nhà cung cấp:

        - `plan`: nhãn gói đăng ký hoặc khóa do nhà cung cấp báo cáo
        - `windows`: các khoảng hạn ngạch có thể đặt lại dưới dạng tỷ lệ phần trăm đã sử dụng
        - `billing`: các mục `balance`, `spend` hoặc `budget` có kiểu; `unit` có thể là
          một loại tiền tệ ISO hoặc đơn vị của nhà cung cấp như `credits`
        - `summary`: ngữ cảnh ngắn gọn dành riêng cho nhà cung cấp không phù hợp với các
          trường có cấu trúc đó

        Giữ chính xác ngữ nghĩa tiền tệ. Tín dụng của nhà cung cấp không phải là USD trừ khi
        hợp đồng thượng nguồn quy định như vậy. Một plugin chỉ triển khai
        `fetchUsageSnapshot` vẫn khả dụng cho các bên gọi tường minh/tổng hợp nhưng
        không được tự động phát hiện, vì OpenClaw không thể phân giải thông tin xác thực mức sử dụng của nó.
      </Tab>
    </Tabs>

    <Accordion title="Các hook nhà cung cấp phổ biến">
      OpenClaw gọi các hook gần như theo thứ tự này đối với các plugin mô hình/nhà cung cấp.
      Hầu hết nhà cung cấp chỉ sử dụng 2-3 hook. Đây không phải là toàn bộ hợp đồng
      `ProviderPlugin` - xem [Nội bộ: Các hook thời gian chạy của nhà cung cấp
      ](/vi/plugins/architecture-internals#provider-runtime-hooks) để biết danh sách hook
      đầy đủ, chính xác ở thời điểm hiện tại và các ghi chú về cơ chế dự phòng.
      Các trường nhà cung cấp chỉ dành cho khả năng tương thích mà OpenClaw không còn gọi,
      chẳng hạn như `ProviderPlugin.capabilities` và `suppressBuiltInModel`, không được
      liệt kê ở đây.

      | Hook | Khi nào nên sử dụng |
      | --- | --- |
      | `catalog` | Danh mục mô hình hoặc giá trị mặc định của URL cơ sở |
      | `applyConfigDefaults` | Các giá trị mặc định toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình |
      | `normalizeModelId` | Dọn dẹp bí danh mã định danh mô hình cũ/xem trước trước khi tra cứu |
      | `normalizeTransport` | Dọn dẹp `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung |
      | `normalizeConfig` | Chuẩn hóa cấu hình `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Chuyển đổi tương thích mức sử dụng truyền phát gốc cho các nhà cung cấp cấu hình |
      | `resolveConfigApiKey` | Phân giải xác thực bằng dấu hiệu biến môi trường do nhà cung cấp sở hữu |
      | `resolveSyntheticAuth` | Xác thực tổng hợp cục bộ/tự lưu trữ hoặc dựa trên cấu hình |
      | `resolveExternalAuthProfiles` | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu cho thông tin xác thực được CLI/ứng dụng quản lý |
      | `shouldDeferSyntheticProfileAuth` | Hạ mức ưu tiên các phần giữ chỗ hồ sơ tổng hợp đã lưu xuống sau xác thực bằng biến môi trường/cấu hình |
      | `resolveDynamicModel` | Chấp nhận mã định danh mô hình thượng nguồn tùy ý |
      | `prepareDynamicModel` | Tìm nạp siêu dữ liệu bất đồng bộ trước khi phân giải |
      | `normalizeResolvedModel` | Chuyển đổi lớp truyền tải trước trình chạy |
      | `normalizeToolSchemas` | Dọn dẹp lược đồ công cụ do nhà cung cấp sở hữu trước khi đăng ký |
      | `inspectToolSchemas` | Chẩn đoán lược đồ công cụ do nhà cung cấp sở hữu |
      | `resolveReasoningOutputMode` | Hợp đồng đầu ra suy luận được gắn thẻ so với gốc |
      | `prepareExtraParams` | Các tham số yêu cầu mặc định |
      | `createStreamFn` | Lớp truyền tải StreamFn tùy chỉnh hoàn toàn |
      | `wrapStreamFn` | Trình bao bọc tiêu đề/nội dung tùy chỉnh trên đường truyền phát thông thường |
      | `resolveTransportTurnState` | Tiêu đề/siêu dữ liệu gốc cho mỗi lượt |
      | `resolveWebSocketSessionPolicy` | Tiêu đề/thời gian chờ phiên WS gốc |
      | `formatApiKey` | Cấu trúc token thời gian chạy tùy chỉnh |
      | `refreshOAuth` | Làm mới OAuth tùy chỉnh |
      | `buildAuthDoctorHint` | Hướng dẫn sửa chữa xác thực |
      | `matchesContextOverflowError` | Phát hiện tràn do nhà cung cấp sở hữu |
      | `classifyFailoverReason` | Phân loại giới hạn tốc độ/quá tải do nhà cung cấp sở hữu |
      | `isCacheTtlEligible` | Kiểm soát TTL của bộ nhớ đệm lời nhắc |
      | `buildMissingAuthMessage` | Gợi ý tùy chỉnh khi thiếu xác thực |
      | `augmentModelCatalog` | Các hàng tương thích xuôi tổng hợp (đã ngừng khuyến nghị - ưu tiên `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Tập tùy chọn `/think` dành riêng cho mô hình |
      | `isBinaryThinking` | Khả năng tương thích bật/tắt tư duy nhị phân (đã ngừng khuyến nghị - ưu tiên `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Khả năng tương thích hỗ trợ suy luận `xhigh` (đã ngừng khuyến nghị - ưu tiên `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Khả năng tương thích chính sách `/think` mặc định (đã ngừng khuyến nghị - ưu tiên `resolveThinkingProfile`) |
      | `isModernModelRef` | Khớp mô hình trực tiếp/kiểm tra nhanh |
      | `prepareRuntimeAuth` | Trao đổi token trước khi suy luận |
      | `resolveUsageAuth` | Phân tích thông tin xác thực mức sử dụng tùy chỉnh |
      | `fetchUsageSnapshot` | Điểm cuối mức sử dụng tùy chỉnh |
      | `createEmbeddingProvider` | Bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm |
      | `buildReplayPolicy` | Chính sách phát lại/Compaction bản ghi tùy chỉnh |
      | `sanitizeReplayHistory` | Chuyển đổi phát lại dành riêng cho nhà cung cấp sau khi dọn dẹp chung |
      | `validateReplayTurns` | Xác thực nghiêm ngặt các lượt phát lại trước trình chạy nhúng |
      | `onModelSelected` | Lệnh gọi lại sau khi chọn (ví dụ: phép đo từ xa) |

      Ghi chú về cơ chế dự phòng thời gian chạy:

      - `normalizeConfig` phân giải một plugin sở hữu cho mỗi mã định danh nhà cung cấp (các nhà cung cấp đi kèm trước, sau đó là plugin thời gian chạy khớp) và chỉ gọi hook đó - không quét qua các nhà cung cấp khác. Hook `normalizeConfig` riêng của Google là thành phần chuẩn hóa các mục cấu hình `google` / `google-vertex` / `google-antigravity`; đây không phải là một cơ chế dự phòng lõi riêng biệt.
      - `resolveConfigApiKey` sử dụng hook của nhà cung cấp khi được cung cấp. Amazon Bedrock giữ việc phân giải dấu hiệu biến môi trường AWS trong plugin nhà cung cấp của mình; bản thân xác thực thời gian chạy vẫn sử dụng chuỗi mặc định của AWS SDK khi được cấu hình với `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` nhận `provider`, `modelId` đã chọn, gợi ý danh mục `reasoning` đã hợp nhất tùy chọn và các thông tin `compat` của mô hình đã hợp nhất tùy chọn. Chỉ sử dụng `compat` để chọn giao diện/hồ sơ tư duy của nhà cung cấp.
      - `resolveSystemPromptContribution` cho phép nhà cung cấp chèn hướng dẫn lời nhắc hệ thống nhận biết bộ nhớ đệm cho một họ mô hình. Ưu tiên nó thay cho hook `before_prompt_build` cũ áp dụng cho toàn plugin khi hành vi thuộc về một họ nhà cung cấp/mô hình và cần duy trì sự phân tách bộ nhớ đệm ổn định/động.

    </Accordion>

  </Step>

  <Step title="Thêm các khả năng bổ sung (tùy chọn)">
    ### Bước 5: Thêm các khả năng bổ sung

    Plugin nhà cung cấp có thể đăng ký embedding, giọng nói, phiên âm thời gian thực,
    thoại thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video,
    tìm nạp web và tìm kiếm web bên cạnh suy luận văn bản. OpenClaw phân loại đây là một
    plugin **khả năng kết hợp** - mẫu được khuyến nghị cho plugin của công ty
    (mỗi nhà cung cấp một plugin). Xem
    [Nội bộ: Quyền sở hữu khả năng](/vi/plugins/architecture#capability-ownership-model).

    Đăng ký từng khả năng bên trong `register(api)` cùng với lệnh gọi
    `api.registerProvider(...)` hiện có. Chỉ chọn các thẻ bạn cần:

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
        các plugin dùng chung cơ chế đọc nội dung lỗi có giới hạn, phân tích lỗi JSON và
        hậu tố mã định danh yêu cầu.
      </Tab>
      <Tab title="Phiên âm thời gian thực">
        Ưu tiên `createRealtimeTranscriptionWebSocketSession(...)` - trình trợ giúp dùng chung
        xử lý việc ghi nhận proxy, thời gian chờ kết nối lại, đẩy dữ liệu khi đóng, bắt tay
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

        Các nhà cung cấp STT theo lô gửi âm thanh multipart bằng POST nên sử dụng
        `buildAudioTranscriptionFormData(...)` từ
        `openclaw/plugin-sdk/provider-http`. Hàm hỗ trợ này chuẩn hóa tên tệp
        tải lên, bao gồm các bản tải lên AAC cần tên tệp kiểu M4A để tương thích
        với các API phiên âm.
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
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Chỉ đặt giá trị này nếu nhà cung cấp chấp nhận nhiều phản hồi công cụ cho
            // một lệnh gọi, ví dụ phản hồi "đang xử lý" ngay lập tức, sau đó là
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
        phương thức truyền tải, định dạng âm thanh và cờ tính năng hợp lệ cho
        các ứng dụng Talk trên trình duyệt và ứng dụng gốc. Triển khai
        `handleBargeIn` khi phương thức truyền tải có thể phát hiện người dùng
        đang ngắt phần phát lại của trợ lý và nhà cung cấp hỗ trợ cắt ngắn hoặc
        xóa phản hồi âm thanh đang hoạt động.
        `submitToolResult` có thể trả về `void` để gửi đồng bộ hoặc
        `Promise<void>` làm ranh giới hoàn tất bất đồng bộ mà cầu nối nhà cung
        cấp có thể cung cấp. Các phiên chuyển tiếp Gateway chờ promise đó trước
        khi xác nhận kết quả cuối cùng hoặc xóa lượt chạy được liên kết; hãy từ
        chối promise khi việc gửi thất bại.
        Đặt `supportsToolResultSuppression: false` khi nhà cung cấp không thể
        tuân thủ `options.suppressResponse`. Khi đó, OpenClaw tránh việc chặn
        phản hồi đối với các kết quả tham vấn bắt buộc nội bộ và kết quả hủy,
        đồng thời từ chối các yêu cầu kết quả bị chặn trực tiếp thay vì âm thầm
        bắt đầu một phản hồi.
        Tương tự, bên sử dụng `createRealtimeVoiceBridgeSession` có thể trả về
        một promise từ `onToolCall`; các ngoại lệ đồng bộ và promise bị từ chối
        được chuyển đến callback `onError` của phiên.
        Chỉ đặt `handlesInputAudioBargeIn` khi VAD của nhà cung cấp xác nhận một
        lần ngắt bằng cách gọi `onClearAudio("barge-in")`. Các nhà cung cấp bỏ
        qua cờ này sẽ sử dụng cơ chế phát hiện dự phòng cục bộ của OpenClaw cho
        âm thanh đầu vào.
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

        Các nhà cung cấp đa phương tiện cục bộ hoặc tự lưu trữ được thiết kế
        để không yêu cầu thông tin xác thực có thể cung cấp `resolveAuth` và
        trả về `kind: "none"`.
        OpenClaw vẫn duy trì cổng xác thực thông thường đối với các nhà cung cấp
        không chủ động chọn tham gia. Các nhà cung cấp hiện có có thể tiếp tục
        đọc `req.apiKey`; các nhà cung cấp mới nên ưu tiên `req.auth`.

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
      <Tab title="Nhúng">
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

        Khai báo cùng một mã định danh trong `contracts.embeddingProviders`.
        Đây là hợp đồng nhúng tổng quát để tạo vectơ có thể tái sử dụng, bao gồm
        cả tìm kiếm bộ nhớ. `registerMemoryEmbeddingProvider(...)` là khả năng
        tương thích đã ngừng khuyến nghị dành cho các bộ điều hợp chuyên biệt
        cho bộ nhớ hiện có.
      </Tab>
      <Tab title="Tạo hình ảnh và video">
        Các khả năng hình ảnh và video sử dụng cấu trúc **nhận biết chế độ**.
        Nhà cung cấp hình ảnh khai báo các khối khả năng `generate` và `edit`
        bắt buộc; nhà cung cấp video khai báo `generate`, `imageToVideo` và
        `videoToVideo`. Các trường tổng hợp phẳng như `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` không đủ để công bố rõ ràng
        khả năng hỗ trợ chế độ chuyển đổi hoặc các chế độ bị vô hiệu hóa. Tính
        năng tạo nhạc tuân theo cùng mẫu `generate` / `edit`.

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

        `capabilities` là bắt buộc đối với cả hai loại nhà cung cấp; `edit` và
        các khối chuyển đổi video (`imageToVideo`, `videoToVideo`) luôn cần cờ
        `enabled` tường minh.

        Sử dụng `catalogByModel` khi các chế độ hoặc khả năng tĩnh của một mô
        hình được liệt kê khác với giá trị mặc định của nhà cung cấp. Siêu dữ
        liệu này giúp `video_generate action=list` và danh mục mô hình luôn
        chính xác mà không cần gọi mã của nhà cung cấp. Việc tra cứu và thực
        thi khả năng tại thời điểm yêu cầu vẫn thuộc về
        `resolveModelCapabilities` và `generateVideo`; khi có thể, hãy tái sử
        dụng cùng một hằng số khả năng cho cả hai đường dẫn.
      </Tab>
      <Tab title="Tìm nạp và tìm kiếm trên web">
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

        Cả hai loại nhà cung cấp dùng chung cấu trúc kết nối thông tin xác thực:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` và `createTool` đều là bắt
        buộc.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Kiểm thử">
    ### Bước 6: Kiểm thử

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Xuất đối tượng cấu hình nhà cung cấp từ index.ts hoặc một tệp riêng
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

Plugin nhà cung cấp được xuất bản giống như mọi Plugin mã bên ngoài khác:

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
├── openclaw.plugin.json      # Tệp kê khai có siêu dữ liệu xác thực nhà cung cấp
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Kiểm thử
    └── usage.ts              # Điểm cuối sử dụng (tùy chọn)
```

## Tham chiếu thứ tự danh mục

`catalog.order` kiểm soát thời điểm danh mục của bạn được hợp nhất tương đối
với các nhà cung cấp tích hợp sẵn:

| Thứ tự    | Thời điểm       | Trường hợp sử dụng                                      |
| --------- | ---------------- | ------------------------------------------------------- |
| `simple`  | Lượt đầu tiên    | Các nhà cung cấp dùng khóa API thông thường             |
| `profile` | Sau simple       | Các nhà cung cấp yêu cầu hồ sơ xác thực                  |
| `paired`  | Sau profile      | Tổng hợp nhiều mục nhập có liên quan                     |
| `late`    | Lượt cuối cùng   | Ghi đè các nhà cung cấp hiện có (ưu tiên khi xung đột)   |

## Các bước tiếp theo

- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - nếu plugin của bạn cũng cung cấp một kênh
- [Môi trường chạy SDK](/vi/plugins/sdk-runtime) - các trình trợ giúp `api.runtime` (TTS, tìm kiếm, tác tử con)
- [Tổng quan về SDK](/vi/plugins/sdk-overview) - tài liệu tham chiếu đầy đủ về nhập đường dẫn con
- [Cơ chế nội bộ của Plugin](/vi/plugins/architecture-internals#provider-runtime-hooks) - chi tiết về hook và các ví dụ được đóng gói

## Nội dung liên quan

- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Xây dựng plugin kênh](/vi/plugins/sdk-channel-plugins)
