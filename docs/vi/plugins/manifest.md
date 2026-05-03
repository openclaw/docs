---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành schema cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Manifest Plugin + yêu cầu về lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-05-03T21:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **tệp kê khai Plugin OpenClaw gốc**.

Để biết các bố cục gói tương thích, xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích dùng các tệp kê khai khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có tệp kê khai
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả ở đây.

Đối với các gói tương thích, OpenClaw hiện đọc siêu dữ liệu gói cùng với các
gốc skill đã khai báo, gốc lệnh Claude, mặc định `settings.json` của gói Claude,
mặc định LSP của gói Claude, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mọi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**gốc Plugin**. OpenClaw dùng tệp kê khai này để xác thực cấu hình
**mà không thực thi mã Plugin**. Tệp kê khai bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và chặn xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugin](/vi/tools/plugin).
Đối với mô hình năng lực gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là siêu dữ liệu mà OpenClaw đọc **trước khi tải
mã Plugin của bạn**. Mọi thứ bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime Plugin.

**Dùng tệp này cho:**

- danh tính Plugin, xác thực cấu hình, và gợi ý giao diện cấu hình
- siêu dữ liệu xác thực, onboarding, và thiết lập (bí danh, tự động bật, biến môi trường nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt mặt phẳng điều khiển
- quyền sở hữu họ mô hình dạng viết tắt
- ảnh chụp nhanh quyền sở hữu năng lực tĩnh (`contracts`)
- siêu dữ liệu trình chạy QA mà host `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình theo kênh được hợp nhất vào catalog và các bề mặt xác thực

**Không dùng tệp này cho:** đăng ký hành vi runtime, khai báo điểm vào mã,
hoặc siêu dữ liệu cài đặt npm. Những phần đó thuộc về mã Plugin của bạn và `package.json`.

## Ví dụ tối thiểu

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Ví dụ đầy đủ

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Tham chiếu trường cấp cao nhất

| Trường                              | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | Id Plugin chuẩn. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                                  |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                  |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị nào không phải `true`, để giữ Plugin bị tắt theo mặc định.                                                                        |
| `enabledByDefaultOnPlatforms`        | Không    | `string[]`                       | Đánh dấu một Plugin đi kèm là được bật theo mặc định chỉ trên các nền tảng Node.js được liệt kê, ví dụ `["darwin"]`. Cấu hình tường minh vẫn được ưu tiên.                                                                         |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các id cũ được chuẩn hóa thành id Plugin chuẩn này.                                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | Các id provider nên tự động bật Plugin này khi auth, config hoặc model refs nhắc đến chúng.                                                                                                                                         |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Không    | `string[]`                       | Các id kênh thuộc sở hữu của Plugin này. Được dùng cho khám phá và xác thực cấu hình.                                                                                                                                               |
| `providers`                          | Không    | `string[]`                       | Các id provider thuộc sở hữu của Plugin này.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | Không    | `string`                         | Đường dẫn module khám phá provider gọn nhẹ, tương đối với thư mục gốc của Plugin, cho metadata danh mục provider theo phạm vi manifest có thể được tải mà không kích hoạt toàn bộ runtime của Plugin.                              |
| `modelSupport`                       | Không    | `object`                         | Metadata họ model dạng rút gọn do manifest sở hữu, được dùng để tự động tải Plugin trước runtime.                                                                                                                                   |
| `modelCatalog`                       | Không    | `object`                         | Metadata danh mục model khai báo cho các provider thuộc sở hữu của Plugin này. Đây là hợp đồng control-plane cho việc liệt kê chỉ đọc, onboarding, bộ chọn model, alias và suppression trong tương lai mà không tải runtime Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do provider sở hữu. Dùng để loại provider local/tự host khỏi danh mục giá từ xa hoặc ánh xạ provider refs tới id danh mục OpenRouter/LiteLLM mà không hardcode id provider trong lõi.             |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp alias/tiền tố model-id do provider sở hữu, phải chạy trước khi runtime provider tải.                                                                                                                                        |
| `providerEndpoints`                  | Không    | `object[]`                       | Metadata endpoint host/baseUrl do manifest sở hữu cho các route provider mà lõi phải phân loại trước khi runtime provider tải.                                                                                                      |
| `providerRequest`                    | Không    | `object`                         | Metadata gọn nhẹ về họ provider và khả năng tương thích request được dùng bởi chính sách request chung trước khi runtime provider tải.                                                                                              |
| `cliBackends`                        | Không    | `string[]`                       | Các id backend suy luận CLI thuộc sở hữu của Plugin này. Được dùng để tự động kích hoạt khi khởi động từ các config refs tường minh.                                                                                                |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Các refs provider hoặc backend CLI mà hook auth tổng hợp thuộc sở hữu Plugin của chúng nên được thăm dò trong quá trình khám phá model lạnh trước khi runtime tải.                                                                  |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Các giá trị khóa API placeholder thuộc sở hữu Plugin đi kèm, đại diện cho trạng thái thông tin xác thực local, OAuth hoặc ambient không bí mật.                                                                                    |
| `commandAliases`                     | Không    | `object[]`                       | Các tên lệnh thuộc sở hữu của Plugin này, nên tạo chẩn đoán cấu hình và CLI nhận biết Plugin trước khi runtime tải.                                                                                                                 |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Metadata env tương thích đã lỗi thời cho tra cứu auth/trạng thái provider. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn ngừng hỗ trợ.                                           |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | Các id provider nên dùng lại một id provider khác để tra cứu auth, ví dụ một provider coding chia sẻ khóa API và auth profiles của provider cơ sở.                                                                                  |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Metadata env kênh gọn nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng trường này cho thiết lập kênh dựa trên env hoặc các bề mặt auth mà helper khởi động/cấu hình chung cần thấy.                                   |
| `providerAuthChoices`                | Không    | `object[]`                       | Metadata lựa chọn auth gọn nhẹ cho bộ chọn onboarding, phân giải provider ưu tiên và wiring flag CLI đơn giản.                                                                                                                      |
| `activation`                         | Không    | `object`                         | Metadata gọn nhẹ cho planner kích hoạt khi khởi động, provider, lệnh, kênh, route và tải được kích hoạt bởi capability. Chỉ là metadata; runtime Plugin vẫn sở hữu hành vi thực tế.                                                |
| `setup`                              | Không    | `object`                         | Descriptor thiết lập/onboarding gọn nhẹ mà các bề mặt khám phá và thiết lập có thể kiểm tra mà không tải runtime Plugin.                                                                                                           |
| `qaRunners`                          | Không    | `object[]`                       | Descriptor runner QA gọn nhẹ được host `openclaw qa` dùng chung sử dụng trước khi runtime Plugin tải.                                                                                                                               |
| `contracts`                          | Không    | `object`                         | Snapshot quyền sở hữu capability tĩnh cho hook auth bên ngoài, speech, phiên âm realtime, giọng nói realtime, hiểu media, tạo ảnh, tạo nhạc, tạo video, web-fetch, tìm kiếm web và quyền sở hữu tool.                            |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Giá trị mặc định hiểu media gọn nhẹ cho các id provider được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                |
| `imageGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Metadata auth tạo ảnh gọn nhẹ cho các id provider được khai báo trong `contracts.imageGenerationProviders`, bao gồm alias auth và guard base-url do provider sở hữu.                                                               |
| `videoGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Metadata auth tạo video gọn nhẹ cho các id provider được khai báo trong `contracts.videoGenerationProviders`, bao gồm alias auth và guard base-url do provider sở hữu.                                                            |
| `musicGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Metadata auth tạo nhạc gọn nhẹ cho các id provider được khai báo trong `contracts.musicGenerationProviders`, bao gồm alias auth và guard base-url do provider sở hữu.                                                             |
| `toolMetadata`                       | Không    | `Record<string, object>`         | Metadata tính khả dụng gọn nhẹ cho các tool thuộc sở hữu Plugin được khai báo trong `contracts.tools`. Dùng khi tool không nên tải runtime trừ khi có bằng chứng về config, env hoặc auth.                                        |
| `channelConfigs`                     | Không    | `Record<string, object>`         | Metadata cấu hình kênh do manifest sở hữu được hợp nhất vào các bề mặt khám phá và xác thực trước khi runtime tải.                                                                                                                 |
| `skills`                             | Không    | `string[]`                       | Các thư mục Skill cần tải, tương đối với thư mục gốc của Plugin.                                                                                                                                                                    |
| `name`                               | Không       | `string`                         | Tên Plugin dễ đọc cho người dùng.                                                                                                                                                                                                         |
| `description`                        | Không       | `string`                         | Tóm tắt ngắn hiển thị trên các giao diện Plugin.                                                                                                                                                                                             |
| `version`                            | Không       | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                                       |
| `uiHints`                            | Không       | `Record<string, object>`         | Nhãn UI, văn bản giữ chỗ và gợi ý về độ nhạy cho các trường cấu hình.                                                                                                                                                                   |

## Tham chiếu siêu dữ liệu nhà cung cấp tạo sinh

Các trường siêu dữ liệu của nhà cung cấp tạo sinh mô tả tín hiệu xác thực tĩnh cho
các nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng.
OpenClaw đọc các trường này trước khi runtime của nhà cung cấp tải để các công cụ lõi có thể
quyết định liệu một nhà cung cấp tạo sinh có sẵn sàng hay không mà không cần nhập mọi
plugin nhà cung cấp.

Chỉ dùng các trường này cho các dữ kiện khai báo, chi phí thấp. Cơ chế truyền tải, biến đổi
yêu cầu, làm mới token, xác thực thông tin xác thực và hành vi tạo sinh thực tế
vẫn nằm trong runtime của plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Mỗi mục siêu dữ liệu hỗ trợ:

| Trường          | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                              |
| --------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Không    | `string[]` | Các id nhà cung cấp bổ sung nên được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo sinh.                                        |
| `authProviders` | Không    | `string[]` | Các id nhà cung cấp có hồ sơ xác thực đã cấu hình nên được tính là xác thực cho nhà cung cấp tạo sinh này.                           |
| `configSignals` | Không    | `object[]` | Tín hiệu sẵn sàng chỉ dựa trên cấu hình, chi phí thấp, cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể được cấu hình mà không cần hồ sơ xác thực hoặc biến môi trường. |
| `authSignals`   | Không    | `object[]` | Tín hiệu xác thực rõ ràng. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ id nhà cung cấp, `aliases` và `authProviders`.         |

Mỗi mục `configSignals` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                              |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | Có       | `string`   | Đường dẫn dạng dấu chấm tới đối tượng cấu hình do plugin sở hữu cần kiểm tra, ví dụ `plugins.entries.example.config`.                                                              |
| `overlayPath` | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình gốc mà đối tượng của nó sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng trường này cho cấu hình theo năng lực như `image`, `video` hoặc `music`. |
| `required`    | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực phải có giá trị đã cấu hình. Chuỗi phải không rỗng; đối tượng và mảng không được rỗng.                                      |
| `requiredAny` | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                                |
| `mode`        | Không    | `object`   | Bộ gác chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng trường này khi trạng thái sẵn sàng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                                 |

Mỗi bộ gác `mode` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                                  |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------------- |
| `path`       | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.                 |
| `default`    | Không    | `string`   | Giá trị chế độ dùng khi cấu hình bỏ qua đường dẫn.                                       |
| `allowed`    | Không    | `string[]` | Nếu có mặt, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.           |
| `disallowed` | Không    | `string[]` | Nếu có mặt, tín hiệu không đạt khi chế độ hiệu lực là một trong các giá trị này.         |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                                                  |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Có       | `string` | Id nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                                       |
| `providerBaseUrl` | Không    | `object` | Bộ gác tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu dùng URL cơ sở được cho phép. Dùng trường này khi một bí danh xác thực chỉ hợp lệ cho một số API nhất định. |

Mỗi bộ gác `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                           |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string`   | Id cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                          |
| `defaultBaseUrl`  | Không    | `string`   | URL cơ sở giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                    |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được cho phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu siêu dữ liệu công cụ

`toolMetadata` dùng cùng hình dạng `configSignals` và `authSignals` như
siêu dữ liệu nhà cung cấp tạo sinh, được định khóa theo tên công cụ. `contracts.tools` khai báo
quyền sở hữu. `toolMetadata` khai báo bằng chứng sẵn sàng chi phí thấp để OpenClaw có thể
tránh nhập runtime của plugin chỉ để factory công cụ của plugin đó trả về `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Nếu một công cụ không có `toolMetadata`, OpenClaw giữ nguyên hành vi hiện có và
tải plugin sở hữu khi hợp đồng công cụ khớp với chính sách. Với các công cụ trên đường nóng
mà factory phụ thuộc vào xác thực/cấu hình, tác giả plugin nên khai báo
`toolMetadata` thay vì khiến lõi nhập runtime để hỏi.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn khởi tạo hoặc xác thực.
OpenClaw đọc mục này trước khi runtime của nhà cung cấp tải.
Các danh sách thiết lập nhà cung cấp dùng các lựa chọn manifest này, lựa chọn thiết lập
suy ra từ descriptor và siêu dữ liệu danh mục cài đặt mà không tải runtime của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                               |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để dispatch tới.                                                                |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng khởi tạo và CLI.                                   |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw dùng lại `choiceId`.                                 |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                                      |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.                 |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                      |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ nên chuyển hướng người dùng tới lựa chọn thay thế này.                               |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                        |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng của nhóm đó.                                                               |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                         |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực đơn giản dùng một cờ.                                       |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                       |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Không    | `string`                                        | Mô tả dùng trong phần trợ giúp CLI.                                                                     |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt khởi tạo mà lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`.        |

## Tham chiếu commandAliases

Sử dụng `commandAliases` khi một Plugin sở hữu tên lệnh runtime mà người dùng có thể nhầm lẫn đưa vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw sử dụng metadata này cho chẩn đoán mà không import mã runtime của Plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                      |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về Plugin này.                                                |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu alias là lệnh gạch chéo trong trò chuyện thay vì lệnh CLI gốc.      |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có.                |

## tham chiếu activation

Sử dụng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện control-plane nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là metadata cho bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký hành vi runtime, không thay thế `register(...)`, và không cam kết rằng mã Plugin đã được thực thi. Bộ lập kế hoạch kích hoạt sử dụng các trường này để thu hẹp các Plugin ứng viên trước khi quay về metadata sở hữu manifest hiện có như `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, và hook.

Ưu tiên metadata hẹp nhất đã mô tả quyền sở hữu. Sử dụng `providers`, `channels`, `commandAliases`, mô tả setup, hoặc `contracts` khi các trường đó biểu đạt mối quan hệ. Sử dụng `activation` cho các gợi ý bổ sung cho bộ lập kế hoạch không thể biểu diễn bằng các trường sở hữu đó.
Sử dụng `cliBackends` cấp cao nhất cho alias runtime CLI như `claude-cli`, `codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho các id harness tác tử nhúng chưa có trường sở hữu.

Khối này chỉ là metadata. Nó không đăng ký hành vi runtime, và không thay thế `register(...)`, `setupEntry`, hoặc các entrypoint runtime/Plugin khác. Các bên tiêu thụ hiện tại dùng nó làm gợi ý thu hẹp trước khi tải Plugin rộng hơn, vì vậy việc thiếu metadata kích hoạt không phải lúc khởi động thường chỉ tốn hiệu năng; nó không nên thay đổi tính đúng đắn khi các fallback sở hữu manifest vẫn tồn tại.

Mọi Plugin nên đặt `activation.onStartup` một cách có chủ đích. Đặt thành `true` chỉ khi Plugin phải chạy trong lúc khởi động Gateway. Đặt thành `false` khi Plugin không hoạt động lúc khởi động và chỉ nên tải từ các trigger hẹp hơn. Việc bỏ qua `onStartup` không còn khiến Plugin được tải lúc khởi động một cách ngầm định; hãy dùng metadata kích hoạt tường minh cho khởi động, kênh, cấu hình, agent-harness, bộ nhớ, hoặc các trigger kích hoạt hẹp hơn khác.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                       |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt khởi động Gateway tường minh. Mọi Plugin nên đặt trường này. `true` import Plugin trong lúc khởi động; `false` giữ nó lazy khi khởi động trừ khi một trigger khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Id provider nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                    |
| `onAgentHarnesses` | Không    | `string[]`                                           | Id runtime harness tác tử nhúng nên đưa Plugin này vào kế hoạch kích hoạt/tải. Sử dụng `cliBackends` cấp cao nhất cho alias backend CLI.                                                       |
| `onCommands`       | Không    | `string[]`                                           | Id lệnh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                        |
| `onChannels`       | Không    | `string[]`                                           | Id kênh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                        |
| `onRoutes`         | Không    | `string[]`                                           | Loại route nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                     |
| `onConfigPaths`    | Không    | `string[]`                                           | Đường dẫn cấu hình tương đối từ gốc nên đưa Plugin này vào kế hoạch khởi động/tải khi đường dẫn hiện diện và không bị vô hiệu hóa tường minh.                                                 |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Gợi ý capability rộng được dùng bởi lập kế hoạch kích hoạt control-plane. Ưu tiên các trường hẹp hơn khi có thể.                                                                              |

Các bên tiêu thụ live hiện tại:

- Lập kế hoạch khởi động Gateway sử dụng `activation.onStartup` cho import khởi động tường minh
- lập kế hoạch CLI do lệnh kích hoạt quay về `commandAliases[].cliCommand` hoặc `commandAliases[].name` cũ
- lập kế hoạch khởi động agent-runtime sử dụng `activation.onAgentHarnesses` cho harness nhúng và `cliBackends[]` cấp cao nhất cho alias runtime CLI
- lập kế hoạch setup/kênh do kênh kích hoạt quay về quyền sở hữu `channels[]` cũ khi thiếu metadata kích hoạt kênh tường minh
- lập kế hoạch Plugin khởi động sử dụng `activation.onConfigPaths` cho các bề mặt cấu hình gốc không phải kênh như khối `browser` của Plugin trình duyệt đi kèm
- lập kế hoạch setup/runtime do provider kích hoạt quay về quyền sở hữu `providers[]` và `cliBackends[]` cấp cao nhất cũ khi thiếu metadata kích hoạt provider tường minh

Chẩn đoán của bộ lập kế hoạch có thể phân biệt gợi ý kích hoạt tường minh với fallback sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là `activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho chẩn đoán host và kiểm thử; tác giả Plugin nên tiếp tục khai báo metadata mô tả quyền sở hữu tốt nhất.

## tham chiếu qaRunners

Sử dụng `qaRunners` khi một Plugin đóng góp một hoặc nhiều runner truyền tải bên dưới gốc `openclaw qa` dùng chung. Giữ metadata này rẻ và tĩnh; runtime Plugin vẫn sở hữu việc đăng ký CLI thực tế thông qua bề mặt `runtime-api.ts` nhẹ xuất `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                                       |
| ------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Subcommand được gắn bên dưới `openclaw qa`, ví dụ `matrix`.                   |
| `description` | Không    | `string` | Văn bản trợ giúp fallback dùng khi host dùng chung cần một lệnh stub.         |

## tham chiếu setup

Sử dụng `setup` khi các bề mặt setup và onboarding cần metadata do Plugin sở hữu với chi phí thấp trước khi runtime tải.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI. `setup.cliBackends` là bề mặt mô tả riêng cho setup dành cho các luồng control-plane/setup nên chỉ duy trì ở dạng metadata.

Khi hiện diện, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên theo mô tả trước cho khám phá setup. Nếu mô tả chỉ thu hẹp Plugin ứng viên và setup vẫn cần các hook runtime phong phú hơn trong thời điểm setup, hãy đặt `requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi fallback.

OpenClaw cũng đưa `setup.providers[].envVars` vào các tra cứu auth provider và biến môi trường chung. `providerAuthEnvVars` vẫn được hỗ trợ thông qua bộ chuyển đổi tương thích trong giai đoạn ngừng sử dụng, nhưng các Plugin không đi kèm vẫn dùng nó sẽ nhận chẩn đoán manifest. Plugin mới nên đặt metadata môi trường setup/trạng thái trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods` khi không có entry setup, hoặc khi `setup.requiresRuntime: false` khai báo runtime setup là không cần thiết. Các entry `providerAuthChoices` tường minh vẫn được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding, và metadata trợ lý.

Đặt `requiresRuntime: false` chỉ khi các mô tả đó đủ cho bề mặt setup. OpenClaw xem `false` tường minh là hợp đồng chỉ dùng mô tả và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` cho tra cứu setup. Nếu một Plugin chỉ dùng mô tả vẫn gửi kèm một trong các entry runtime setup đó, OpenClaw báo cáo chẩn đoán bổ sung và tiếp tục bỏ qua nó. `requiresRuntime` bị bỏ qua sẽ giữ hành vi fallback cũ để các Plugin hiện có đã thêm mô tả mà không có cờ này không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị `setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy trì duy nhất trên toàn bộ các Plugin được phát hiện. Quyền sở hữu mơ hồ sẽ thất bại đóng thay vì chọn một bên thắng dựa trên thứ tự khám phá.

Khi runtime setup thực thi, chẩn đoán registry setup sẽ báo cáo độ lệch mô tả nếu `setup-api` đăng ký một provider hoặc backend CLI mà mô tả manifest không khai báo, hoặc nếu một mô tả không có đăng ký runtime khớp. Các chẩn đoán này là bổ sung và không từ chối Plugin cũ.

### tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                         |
| -------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Id provider được hiển thị trong setup hoặc onboarding. Giữ id đã chuẩn hóa duy nhất toàn cục.   |
| `authMethods`  | Không    | `string[]` | Id phương thức setup/auth mà provider này hỗ trợ mà không tải toàn bộ runtime.                   |
| `envVars`      | Không    | `string[]` | Biến môi trường mà các bề mặt setup/trạng thái chung có thể kiểm tra trước khi runtime Plugin tải. |
| `authEvidence` | Không    | `object[]` | Kiểm tra bằng chứng auth cục bộ nhẹ cho provider có thể xác thực thông qua dấu hiệu không bí mật. |

`authEvidence` dùng cho các dấu hiệu thông tin đăng nhập cục bộ do nhà cung cấp sở hữu, có thể
được xác minh mà không cần tải mã runtime. Các kiểm tra này phải luôn nhẹ và cục bộ:
không gọi mạng, không đọc keychain hoặc trình quản lý bí mật, không chạy lệnh shell, và không
thăm dò API của nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                             |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Có       | `string`   | Hiện là `local-file-with-env`.                                                                                      |
| `fileEnvVar`       | Không    | `string`   | Biến môi trường chứa đường dẫn tệp thông tin đăng nhập rõ ràng.                                                     |
| `fallbackPaths`    | Không    | `string[]` | Đường dẫn tệp thông tin đăng nhập cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không    | `string[]` | Ít nhất một biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                              |
| `requiresAllEnv`   | Không    | `string[]` | Mọi biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                      |
| `credentialMarker` | Có       | `string`   | Dấu hiệu không bí mật được trả về khi bằng chứng hiện diện.                                                         |
| `source`           | Không    | `string`   | Nhãn nguồn hướng tới người dùng cho đầu ra xác thực/trạng thái.                                                     |

### các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Bộ mô tả thiết lập nhà cung cấp được hiển thị trong quá trình thiết lập và onboarding.                   |
| `cliBackends`      | Không    | `string[]` | Id backend tại thời điểm thiết lập dùng cho tra cứu thiết lập ưu tiên bộ mô tả. Giữ các id đã chuẩn hóa là duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | Id di chuyển cấu hình do bề mặt thiết lập của Plugin này sở hữu.                                        |
| `requiresRuntime`  | Không    | `boolean`  | Thiết lập có còn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                           |

## tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình sang các gợi ý kết xuất nhỏ.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Mỗi gợi ý trường có thể bao gồm:

| Trường        | Kiểu       | Ý nghĩa                                      |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Nhãn trường hướng tới người dùng.            |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                       |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                             |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.                 |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.     |
| `placeholder` | `string`   | Văn bản giữ chỗ cho đầu vào biểu mẫu.        |

## tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu sở hữu năng lực tĩnh mà OpenClaw có thể
đọc mà không cần nhập runtime của Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Mỗi danh sách là tùy chọn:

| Trường                           | Kiểu       | Ý nghĩa                                                                  |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Id factory extension app-server của Codex, hiện là `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | Id runtime mà một Plugin đi kèm có thể đăng ký middleware kết quả công cụ cho. |
| `externalAuthProviders`          | `string[]` | Id nhà cung cấp có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.   |
| `speechProviders`                | `string[]` | Id nhà cung cấp giọng nói do Plugin này sở hữu.                          |
| `realtimeTranscriptionProviders` | `string[]` | Id nhà cung cấp phiên âm thời gian thực do Plugin này sở hữu.            |
| `realtimeVoiceProviders`         | `string[]` | Id nhà cung cấp thoại thời gian thực do Plugin này sở hữu.               |
| `memoryEmbeddingProviders`       | `string[]` | Id nhà cung cấp nhúng bộ nhớ do Plugin này sở hữu.                       |
| `mediaUnderstandingProviders`    | `string[]` | Id nhà cung cấp hiểu phương tiện do Plugin này sở hữu.                   |
| `imageGenerationProviders`       | `string[]` | Id nhà cung cấp tạo hình ảnh do Plugin này sở hữu.                       |
| `videoGenerationProviders`       | `string[]` | Id nhà cung cấp tạo video do Plugin này sở hữu.                          |
| `webFetchProviders`              | `string[]` | Id nhà cung cấp tìm nạp web do Plugin này sở hữu.                        |
| `webSearchProviders`             | `string[]` | Id nhà cung cấp tìm kiếm web do Plugin này sở hữu.                       |
| `migrationProviders`             | `string[]` | Id nhà cung cấp nhập do Plugin này sở hữu cho `openclaw migrate`.        |
| `tools`                          | `string[]` | Tên công cụ agent do Plugin này sở hữu.                                  |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory extension
chỉ dành cho app-server của Codex đi kèm. Các biến đổi kết quả công cụ đi kèm nên
khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể
đăng ký middleware kết quả công cụ vì seam này có thể viết lại đầu ra công cụ có độ tin cậy cao
trước khi mô hình nhìn thấy.

Các đăng ký `api.registerTool(...)` ở runtime phải khớp với `contracts.tools`.
Khám phá công cụ dùng danh sách này để chỉ tải runtime của những Plugin có thể sở hữu
các công cụ được yêu cầu.

Các Plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`. Plugin không có khai báo vẫn chạy
qua cơ chế tương thích dự phòng đã lỗi thời, nhưng cơ chế đó chậm hơn và
sẽ bị loại bỏ sau giai đoạn di chuyển.

Các nhà cung cấp nhúng bộ nhớ đi kèm nên khai báo
`contracts.memoryEmbeddingProviders` cho mọi id adapter mà họ hiển thị, bao gồm
các adapter tích hợp như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest
này để chỉ tải Plugin sở hữu trước khi toàn bộ runtime Gateway đã
đăng ký nhà cung cấp.

## tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu phương tiện có
mô hình mặc định, mức ưu tiên dự phòng tự động xác thực, hoặc hỗ trợ tài liệu gốc mà
các helper lõi chung cần trước khi runtime tải. Các khóa cũng phải được khai báo trong
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Mỗi mục nhà cung cấp có thể bao gồm:

| Trường                 | Kiểu                                | Ý nghĩa                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Năng lực phương tiện do nhà cung cấp này hiển thị.                       |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ năng lực sang mô hình được dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho dự phòng nhà cung cấp tự động dựa trên thông tin đăng nhập. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                           |

## tham chiếu channelConfigs

Dùng `channelConfigs` khi một Plugin kênh cần siêu dữ liệu cấu hình nhẹ trước khi
runtime tải. Khám phá thiết lập/trạng thái kênh chỉ đọc có thể dùng siêu dữ liệu này
trực tiếp cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc
khi `setup.requiresRuntime: false` khai báo runtime thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest của Plugin, không phải một mục cấu hình người dùng
cấp cao mới. Người dùng vẫn cấu hình các phiên bản kênh dưới `channels.<channel-id>`.
OpenClaw đọc siêu dữ liệu manifest để quyết định Plugin nào sở hữu kênh đã cấu hình đó
trước khi mã runtime của Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng
lược đồ cấu hình đường dẫn lạnh, thiết lập, và các bề mặt Control UI không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi runtime của Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo mặc định `auto` tĩnh cho các kiểm tra cấu hình lệnh
chạy trước khi runtime kênh tải. Các kênh đi kèm cũng có thể công bố
cùng các mặc định qua `package.json#openclaw.channel.commands` cùng với
siêu dữ liệu danh mục kênh do package sở hữu khác của chúng.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Mỗi mục kênh có thể bao gồm:

| Trường        | Kiểu                     | Ý nghĩa                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho mỗi mục cấu hình kênh đã khai báo.         |
| `uiHints`     | `Record<string, object>` | Nhãn UI/trình giữ chỗ/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                 |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt bộ chọn và kiểm tra khi siêu dữ liệu runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả ngắn về kênh cho các bề mặt kiểm tra và danh mục.                                  |
| `commands`    | `object`                 | Lệnh native tĩnh và mặc định tự động Skills native cho kiểm tra cấu hình trước runtime.   |
| `preferOver`  | `string[]`               | Các id Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên được ưu tiên hơn trong các bề mặt chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà
Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là id Plugin đã được đổi tên, một
Plugin độc lập thay thế một Plugin được đóng gói sẵn, hoặc một fork được duy trì
giữ cùng id kênh để tương thích cấu hình.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Khi `channels.chat` được cấu hình, OpenClaw xét cả id kênh và
id Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì
nó được đóng gói sẵn hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong
cấu hình runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng
vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin đã yêu cầu.

Giữ `preferOver` trong phạm vi các id Plugin thật sự có thể cung cấp cùng kênh.
Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình của người dùng.

## Tham chiếu modelSupport

Dùng `modelSupport` khi OpenClaw cần suy luận Plugin nhà cung cấp của bạn từ
các id mô hình viết tắt như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi runtime
Plugin được tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên này:

- các tham chiếu `provider/model` rõ ràng dùng siêu dữ liệu manifest `providers` sở hữu
- `modelPatterns` thắng `modelPrefixes`
- nếu một Plugin không đóng gói sẵn và một Plugin đóng gói sẵn đều khớp, Plugin không đóng gói sẵn
  thắng
- phần mơ hồ còn lại được bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với id mô hình viết tắt.                |
| `modelPatterns` | `string[]` | Nguồn regex được khớp với id mô hình viết tắt sau khi loại bỏ hậu tố hồ sơ.    |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw cần biết siêu dữ liệu mô hình của nhà cung cấp trước khi
tải runtime Plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục
cố định, bí danh nhà cung cấp, quy tắc ẩn, và chế độ khám phá. Làm mới runtime
vẫn thuộc về mã runtime nhà cung cấp, nhưng manifest cho core biết khi nào cần runtime.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Các trường cấp cao nhất:

| Trường         | Kiểu                                                     | Ý nghĩa                                                                                                   |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho id nhà cung cấp do Plugin này sở hữu. Các khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải về một nhà cung cấp sở hữu để lập kế hoạch danh mục hoặc ẩn.          |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này ẩn vì lý do riêng của nhà cung cấp.                         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Danh mục nhà cung cấp có thể được đọc từ siêu dữ liệu manifest, được làm mới vào bộ đệm, hay cần runtime. |

`aliases` tham gia tra cứu quyền sở hữu nhà cung cấp để lập kế hoạch danh mục mô hình.
Mục tiêu bí danh phải là nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng ghi đè API/base URL của bí danh mà không tải runtime nhà cung cấp.
Bí danh không mở rộng các danh sách danh mục không lọc; các danh sách rộng chỉ phát ra
các hàng nhà cung cấp chuẩn sở hữu.

`suppressions` thay thế hook runtime nhà cung cấp `suppressBuiltInModel` cũ.
Các mục ẩn chỉ được tuân thủ khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ đến một nhà cung cấp sở hữu. Các hook
ẩn runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                               |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ chuyển đổi API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.           |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` sẽ bị bỏ qua.       |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                        |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp, không có tiền tố `provider/`.             |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                         |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn cho từng mô hình.                                          |
| `baseUrl`       | `string`                                                       | Ghi đè base URL tùy chọn cho từng mô hình.                                     |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn cho từng mô hình.                                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức đầu vào mà mô hình chấp nhận.                                  |
| `reasoning`     | `boolean`                                                      | Mô hình có bộc lộ hành vi suy luận hay không.                                  |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh native của nhà cung cấp.                                       |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu lực tùy chọn khi khác với `contextWindow`.      |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết được.                                          |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.       |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng hoàn toàn không được xuất hiện.            |
| `statusReason`  | `string`                                                       | Lý do tùy chọn được hiển thị cùng trạng thái không khả dụng.                   |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ theo nhà cung cấp cũ hơn mà mô hình này thay thế.        |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp thay thế cho các hàng đã lỗi thời.         |
| `tags`          | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc dùng.                                   |

Các trường ẩn:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                  |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id nhà cung cấp cho hàng upstream cần ẩn. Phải do Plugin này sở hữu hoặc được khai báo là bí danh sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ theo nhà cung cấp cần ẩn.                                                              |
| `reason`                   | `string`   | Thông báo tùy chọn được hiển thị khi hàng bị ẩn được yêu cầu trực tiếp.                                  |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host base URL nhà cung cấp hiệu lực bắt buộc trước khi áp dụng ẩn.                |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` cấu hình nhà cung cấp chính xác bắt buộc trước khi áp dụng ẩn.      |

Không đặt dữ liệu chỉ dùng lúc runtime trong `modelCatalog`. Chỉ dùng `static` khi các hàng manifest đủ hoàn chỉnh để các bề mặt danh sách đã lọc theo nhà cung cấp và trình chọn có thể bỏ qua bước khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là seed có thể liệt kê hoặc phần bổ sung hữu ích nhưng refresh/cache có thể thêm nhiều hàng hơn sau đó; các hàng refreshable tự chúng không có tính thẩm quyền. Dùng `runtime` khi OpenClaw phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp model-id chi phí thấp do nhà cung cấp sở hữu, cần diễn ra trước khi runtime của nhà cung cấp được tải. Điều này giữ các bí danh như tên model ngắn, id cũ cục bộ của nhà cung cấp, và quy tắc tiền tố proxy trong manifest của Plugin sở hữu thay vì trong các bảng chọn model của core.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Trường của nhà cung cấp:

| Trường                               | Kiểu                   | Ý nghĩa                                                                                  |
| ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Bí danh model-id khớp chính xác, không phân biệt chữ hoa/thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`             | Các tiền tố cần loại bỏ trước khi tra cứu bí danh, hữu ích cho trùng lặp provider/model kiểu cũ. |
| `prefixWhenBare`                     | `string`               | Tiền tố cần thêm khi model id đã chuẩn hóa chưa chứa `/`.                                |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`             | Quy tắc tiền tố bare-id có điều kiện sau khi tra cứu bí danh, được khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung phải biết trước khi runtime của nhà cung cấp được tải. Core vẫn sở hữu ý nghĩa của từng `endpointClass`; manifest của Plugin sở hữu metadata host và URL cơ sở.

Trường endpoint:

| Trường                         | Kiểu       | Ý nghĩa                                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint core đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên host chính xác ánh xạ tới lớp endpoint.                                                    |
| `hostSuffixes`                 | `string[]` | Hậu tố host ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố domain.              |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                             |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho host global chính xác.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi host khớp để lộ tiền tố vùng Google Vertex.                           |

## Tham chiếu providerRequest

Dùng `providerRequest` cho metadata tương thích yêu cầu chi phí thấp mà chính sách yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ phần viết lại payload theo hành vi cụ thể trong hook runtime của nhà cung cấp hoặc helper dùng chung cho họ nhà cung cấp.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Trường của nhà cung cấp:

| Trường                | Kiểu         | Ý nghĩa                                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp dùng cho quyết định tương thích yêu cầu chung và chẩn đoán.        |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho helper yêu cầu dùng chung.                 |
| `openAICompletions`   | `object`     | Cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.             |

## Tham chiếu modelPricing

Dùng `modelPricing` khi nhà cung cấp cần hành vi định giá ở control plane trước khi runtime được tải. Cache định giá của Gateway đọc metadata này mà không import mã runtime của nhà cung cấp.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Trường của nhà cung cấp:

| Trường       | Kiểu              | Ý nghĩa                                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho nhà cung cấp cục bộ/tự host, không bao giờ được fetch định giá OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu định giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.        |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu định giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.              |

Trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                           |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id nhà cung cấp catalog bên ngoài khi khác với id nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`.     |
| `passthroughProviderModel` | `boolean`          | Xem model id chứa dấu gạch chéo là tham chiếu provider/model lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Biến thể model-id catalog bên ngoài bổ sung. `version-dots` thử id phiên bản có dấu chấm như `claude-opus-4.6`.   |

### Chỉ mục Nhà cung cấp OpenClaw

Chỉ mục Nhà cung cấp OpenClaw là metadata xem trước do OpenClaw sở hữu cho các nhà cung cấp có Plugin có thể chưa được cài đặt. Nó không phải là một phần của manifest Plugin. Manifest Plugin vẫn là nguồn thẩm quyền của Plugin đã cài đặt. Chỉ mục Nhà cung cấp là hợp đồng dự phòng nội bộ mà các bề mặt nhà cung cấp có thể cài đặt trong tương lai và trình chọn model trước khi cài đặt sẽ dùng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. Manifest Plugin đã cài đặt `modelCatalog`.
3. Cache catalog model từ refresh rõ ràng.
4. Các hàng xem trước của Chỉ mục Nhà cung cấp OpenClaw.

Chỉ mục Nhà cung cấp không được chứa secret, trạng thái bật, hook runtime, hoặc dữ liệu model riêng theo tài khoản live. Catalog xem trước của nó dùng cùng hình dạng hàng nhà cung cấp `modelCatalog` như manifest Plugin, nhưng nên giới hạn ở metadata hiển thị ổn định trừ khi các trường adapter runtime như `api`, `baseUrl`, định giá, hoặc cờ tương thích được cố ý giữ đồng bộ với manifest Plugin đã cài đặt. Nhà cung cấp có khám phá live `/models` nên ghi các hàng đã refresh qua đường dẫn cache catalog model rõ ràng thay vì khiến việc liệt kê thông thường hoặc onboarding gọi API nhà cung cấp.

Mục trong Chỉ mục Nhà cung cấp cũng có thể mang metadata Plugin có thể cài đặt cho các nhà cung cấp có Plugin đã được chuyển ra khỏi core hoặc hiện chưa được cài đặt. Metadata này phản chiếu mẫu catalog kênh: tên package, npm install spec, integrity dự kiến, và nhãn lựa chọn auth chi phí thấp là đủ để hiển thị tùy chọn thiết lập có thể cài đặt. Khi Plugin đã được cài đặt, manifest của nó thắng và mục Chỉ mục Nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa capability cấp cao kiểu cũ đã bị ngừng khuyến nghị. Dùng `openclaw doctor --fix` để chuyển `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; quá trình tải manifest thông thường không còn xem các trường cấp cao đó là quyền sở hữu capability.

## Manifest so với package.json

Hai tệp phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, metadata lựa chọn auth, và gợi ý UI phải tồn tại trước khi mã Plugin chạy                           |
| `package.json`         | Metadata npm, cài đặt dependency, và khối `openclaw` dùng cho entrypoint, cổng chặn cài đặt, thiết lập, hoặc metadata catalog    |

Nếu bạn không chắc một phần metadata thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số metadata Plugin trước runtime được chủ ý đặt trong `package.json` dưới khối `openclaw` thay vì `openclaw.plugin.json`. `openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng Plugin OpenClaw; Plugin native phải dùng `openclaw.plugin.json` cùng các trường `package.json#openclaw` được hỗ trợ bên dưới.

Ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Khai báo các entrypoint plugin gốc. Phải nằm bên trong thư mục gói plugin.                                                                                                                 |
| `openclaw.runtimeExtensions`                                                               | Khai báo các entrypoint runtime JavaScript đã build cho các gói đã cài đặt. Phải nằm bên trong thư mục gói plugin.                                                                         |
| `openclaw.setupEntry`                                                                      | Entrypoint nhẹ chỉ dành cho thiết lập, được dùng trong onboarding, khởi động kênh bị trì hoãn, và phát hiện trạng thái kênh chỉ đọc/SecretRef. Phải nằm bên trong thư mục gói plugin.      |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo entrypoint thiết lập JavaScript đã build cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại, và phải nằm bên trong thư mục gói plugin.                                   |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                                |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu tĩnh về lệnh gốc và mặc định tự động cho kỹ năng gốc, được dùng bởi các bề mặt cấu hình, kiểm tra, và danh sách lệnh trước khi runtime kênh tải.                              |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu trình kiểm tra trạng thái đã cấu hình dạng nhẹ, có thể trả lời "thiết lập chỉ dùng env đã tồn tại chưa?" mà không cần tải toàn bộ runtime kênh.                                |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu trình kiểm tra xác thực đã lưu dạng nhẹ, có thể trả lời "đã có gì đăng nhập chưa?" mà không cần tải toàn bộ runtime kênh.                                                     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho các plugin đi kèm và plugin được phát hành bên ngoài.                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt khả dụng.                                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                              |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi integrity npm dist mong đợi như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải về theo chuỗi này.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép một đường dẫn khôi phục cài đặt lại hẹp cho plugin đi kèm khi cấu hình không hợp lệ.                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước plugin kênh đầy đủ trong quá trình khởi động.                                                                                    |

Siêu dữ liệu manifest quyết định các lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách lấy hoặc bật plugin đó khi người dùng chọn một trong các
lựa chọn đó. Không di chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
registry manifest cho các nguồn plugin không đi kèm. Giá trị không hợp lệ bị từ chối;
giá trị mới hơn nhưng hợp lệ sẽ bỏ qua plugin bên ngoài trên host cũ hơn. Các plugin nguồn
đi kèm được giả định là cùng phiên bản với checkout host.

Siêu dữ liệu cài đặt theo nhu cầu chính thức nên dùng `clawhubSpec` khi plugin được
phát hành trên ClawHub; onboarding xem đó là nguồn từ xa ưu tiên và
ghi lại thông tin artifact ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án tương thích
dự phòng cho các gói chưa chuyển sang ClawHub.

Việc ghim chính xác phiên bản npm đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục catalog bên ngoài chính thức
nên ghép spec chính xác với `expectedIntegrity` để các luồng cập nhật thất bại
theo hướng đóng nếu artifact npm đã lấy không còn khớp với bản phát hành đã ghim.
Onboarding tương tác vẫn cung cấp các spec npm registry đáng tin cậy, bao gồm tên
gói trần và dist-tag, để tương thích. Chẩn đoán catalog có thể
phân biệt nguồn chính xác, thả nổi, được ghim integrity, thiếu integrity, tên gói
không khớp, và default-choice không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ nào để nó có thể ghim.
Khi `expectedIntegrity` có mặt,
các luồng cài đặt/cập nhật thực thi nó; khi bị bỏ qua, kết quả phân giải registry được
ghi lại mà không có ghim integrity.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi các lượt quét trạng thái, danh sách kênh,
hoặc SecretRef cần xác định tài khoản đã cấu hình mà không tải toàn bộ
runtime. Entry thiết lập nên phơi bày siêu dữ liệu kênh cùng các adapter cấu hình,
trạng thái, và bí mật an toàn cho thiết lập; giữ network client, gateway listener, và
runtime transport trong entrypoint extension chính.

Các trường entrypoint runtime không ghi đè kiểm tra ranh giới gói cho các trường
entrypoint nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể làm cho một
đường dẫn `openclaw.extensions` thoát ra ngoài trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` được cố ý giới hạn hẹp. Nó không
làm cho các cấu hình hỏng tùy ý có thể cài đặt được. Hiện tại nó chỉ cho phép các luồng cài đặt
khôi phục từ những lỗi nâng cấp plugin đi kèm cũ cụ thể, chẳng hạn như
thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` cũ cho chính
plugin đi kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và gửi người vận hành
đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là siêu dữ liệu gói cho một module kiểm tra
nhỏ:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Dùng nó khi các luồng thiết lập, doctor, trạng thái, hoặc hiện diện chỉ đọc cần một phép dò
xác thực có/không nhẹ trước khi plugin kênh đầy đủ tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật plugin,
sửa phụ thuộc runtime, hoặc quyết định runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` dùng cùng hình dạng cho các kiểm tra đã cấu hình
chỉ dùng env dạng nhẹ:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Dùng nó khi một kênh có thể trả lời trạng thái đã cấu hình từ env hoặc các đầu vào nhỏ
không thuộc runtime khác. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc runtime
kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của plugin.

## Thứ tự ưu tiên phát hiện (id plugin trùng lặp)

OpenClaw phát hiện plugin từ nhiều gốc (đi kèm, cài đặt toàn cục, workspace, đường dẫn được chọn rõ ràng trong cấu hình). Nếu hai phát hiện có cùng `id`, chỉ manifest có **độ ưu tiên cao nhất** được giữ lại; các bản trùng lặp có độ ưu tiên thấp hơn bị loại bỏ thay vì được tải bên cạnh nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn trong cấu hình** — đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đi kèm** — plugin được phát hành cùng OpenClaw
3. **Cài đặt toàn cục** — plugin được cài vào gốc plugin OpenClaw toàn cục
4. **Workspace** — plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc cũ của plugin đi kèm nằm trong workspace sẽ không che khuất bản build đi kèm.
- Để thật sự ghi đè một plugin đi kèm bằng một plugin cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo thứ tự ưu tiên thay vì dựa vào phát hiện workspace.
- Các lần loại bỏ trùng lặp được ghi log để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao đã bị loại.
- Ghi đè trùng lặp được chọn trong cấu hình được diễn đạt như ghi đè rõ ràng trong chẩn đoán, nhưng vẫn cảnh báo để các fork cũ và che khuất ngoài ý muốn vẫn hiển thị.

## Yêu cầu JSON Schema

- **Mọi plugin phải đi kèm một JSON Schema**, ngay cả khi nó không nhận cấu hình nào.
- Schema rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại runtime.
- Khi mở rộng hoặc fork một plugin đi kèm bằng khóa cấu hình mới, hãy cập nhật `configSchema` trong `openclaw.plugin.json` của plugin đó cùng lúc. Schema plugin đi kèm là nghiêm ngặt, nên việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi runtime plugin tải.

Ví dụ mở rộng schema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Hành vi xác thực

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu các id plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một plugin được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  xác thực thất bại và Doctor báo lỗi plugin.
- Nếu cấu hình plugin tồn tại nhưng plugin bị **tắt**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + log.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết schema `plugins.*` đầy đủ.

## Ghi chú

- Tệp kê khai là **bắt buộc đối với Plugin OpenClaw gốc**, bao gồm cả các lần tải từ hệ thống tệp cục bộ. Runtime vẫn tải mô-đun Plugin riêng; tệp kê khai chỉ dùng để khám phá + xác thực.
- Tệp kê khai gốc được phân tích cú pháp bằng JSON5, vì vậy chú thích, dấu phẩy cuối và khóa không đặt trong dấu nháy đều được chấp nhận miễn là giá trị cuối cùng vẫn là một đối tượng.
- Trình tải tệp kê khai chỉ đọc các trường tệp kê khai đã được ghi trong tài liệu. Tránh dùng các khóa cấp cao nhất tùy chỉnh.
- `channels`, `providers`, `cliBackends`, và `skills` đều có thể được bỏ qua khi Plugin không cần đến chúng.
- `providerDiscoveryEntry` phải luôn gọn nhẹ và không nên nhập mã runtime rộng; hãy dùng nó cho siêu dữ liệu danh mục provider tĩnh hoặc các bộ mô tả khám phá hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định là `legacy`).
- Khai báo loại Plugin độc quyền trong tệp kê khai này. `OpenClawPluginDefinition.kind` trong mục runtime đã không còn được khuyến nghị dùng và chỉ còn là phương án dự phòng tương thích cho các Plugin cũ hơn.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã không còn được khuyến nghị dùng, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm toán, xác thực phân phối cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi xem một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn runtime yêu cầu mã provider, xem [hook runtime của provider](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào các mô-đun gốc, hãy ghi lại các bước build và mọi yêu cầu danh sách cho phép của trình quản lý gói (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình năng lực.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu SDK Plugin và các import theo đường dẫn con.
  </Card>
</CardGroup>
