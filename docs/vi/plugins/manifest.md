---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành schema cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về manifest Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **manifest Plugin OpenClaw gốc**.

Để xem các bố cục gói tương thích, hãy xem [Các gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích dùng các tệp manifest khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có manifest
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả ở đây.

Đối với các gói tương thích, OpenClaw hiện đọc siêu dữ liệu gói cùng với các
thư mục gốc Skills đã khai báo, thư mục gốc lệnh Claude, mặc định `settings.json`
của gói Claude, mặc định LSP của gói Claude và các gói hook được hỗ trợ khi bố cục
khớp với kỳ vọng runtime của OpenClaw.

Mỗi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**gốc plugin**. OpenClaw dùng manifest này để xác thực cấu hình
**mà không thực thi mã plugin**. Manifest bị thiếu hoặc không hợp lệ được xem là
lỗi plugin và chặn việc xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống plugin: [Plugin](/vi/tools/plugin).
Đối với mô hình năng lực gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là siêu dữ liệu OpenClaw đọc **trước khi tải mã
plugin của bạn**. Mọi thứ bên dưới phải đủ nhẹ để kiểm tra mà không khởi động
runtime của plugin.

**Dùng tệp này cho:**

- danh tính plugin, xác thực cấu hình và gợi ý giao diện người dùng cấu hình
- siêu dữ liệu xác thực, onboarding và thiết lập (bí danh, tự động bật, biến môi trường provider, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu họ mô hình dạng viết tắt
- ảnh chụp tĩnh về quyền sở hữu năng lực (`contracts`)
- siêu dữ liệu trình chạy QA mà máy chủ `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình dành riêng cho kênh được hợp nhất vào catalog và các bề mặt xác thực

**Không dùng tệp này cho:** đăng ký hành vi runtime, khai báo entrypoint mã,
hoặc siêu dữ liệu cài đặt npm. Những phần đó thuộc về mã plugin và `package.json` của bạn.

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

| Trường                               | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | Id Plugin chính tắc. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                  |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị nào không phải `true`, để giữ Plugin bị tắt theo mặc định.                                                                          |
| `enabledByDefaultOnPlatforms`        | Không    | `string[]`                       | Đánh dấu một Plugin đi kèm là được bật theo mặc định chỉ trên các nền tảng Node.js được liệt kê, ví dụ `["darwin"]`. Cấu hình tường minh vẫn được ưu tiên.                                                                           |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các id cũ được chuẩn hóa về id Plugin chính tắc này.                                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | Các id nhà cung cấp sẽ tự động bật Plugin này khi xác thực, cấu hình, hoặc tham chiếu mô hình nhắc đến chúng.                                                                                                                       |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Không    | `string[]`                       | Các id kênh do Plugin này sở hữu. Được dùng cho khám phá và xác thực cấu hình.                                                                                                                                                       |
| `providers`                          | Không    | `string[]`                       | Các id nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                           |
| `providerCatalogEntry`               | Không    | `string`                         | Đường dẫn module danh mục nhà cung cấp gọn nhẹ, tương đối với gốc Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp trong phạm vi manifest có thể được tải mà không cần kích hoạt toàn bộ runtime của Plugin.                    |
| `modelSupport`                       | Không    | `object`                         | Siêu dữ liệu họ mô hình dạng viết tắt do manifest sở hữu, được dùng để tự động tải Plugin trước runtime.                                                                                                                            |
| `modelCatalog`                       | Không    | `object`                         | Siêu dữ liệu danh mục mô hình khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, onboarding, bộ chọn mô hình, bí danh, và ẩn trong tương lai mà không tải runtime của Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng để loại nhà cung cấp cục bộ/tự lưu trữ khỏi các danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp tới id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong lõi. |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu và phải chạy trước khi runtime của nhà cung cấp được tải.                                                                                                                 |
| `providerEndpoints`                  | Không    | `object[]`                       | Siêu dữ liệu host/baseUrl điểm cuối do manifest sở hữu cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi runtime của nhà cung cấp được tải.                                                                                |
| `providerRequest`                    | Không    | `object`                         | Siêu dữ liệu gọn nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung dùng trước khi runtime của nhà cung cấp được tải.                                                                             |
| `cliBackends`                        | Không    | `string[]`                       | Các id backend suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình tường minh.                                                                                                |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Các tham chiếu nhà cung cấp hoặc backend CLI có hook xác thực tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình lạnh trước khi runtime được tải.                                                          |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Các giá trị khóa API placeholder do Plugin đi kèm sở hữu, đại diện cho trạng thái thông tin xác thực cục bộ, OAuth, hoặc môi trường xung quanh không phải bí mật.                                                                    |
| `commandAliases`                     | Không    | `object[]`                       | Các tên lệnh do Plugin này sở hữu, cần tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi runtime được tải.                                                                                                                |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Siêu dữ liệu env tương thích đã ngừng khuyến nghị cho tra cứu xác thực/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn ngừng khuyến nghị.                   |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | Các id nhà cung cấp nên tái sử dụng một id nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ xác thực của nhà cung cấp nền tảng.                                                  |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Siêu dữ liệu env kênh gọn nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng cho thiết lập kênh điều khiển bằng env hoặc các bề mặt xác thực mà helper khởi động/cấu hình chung cần thấy.                                  |
| `providerAuthChoices`                | Không    | `object[]`                       | Siêu dữ liệu lựa chọn xác thực gọn nhẹ cho bộ chọn onboarding, phân giải nhà cung cấp ưu tiên, và nối dây cờ CLI đơn giản.                                                                                                          |
| `activation`                         | Không    | `object`                         | Siêu dữ liệu bộ lập kế hoạch kích hoạt gọn nhẹ cho việc tải khi khởi động, theo nhà cung cấp, lệnh, kênh, tuyến, và capability. Chỉ là siêu dữ liệu; runtime của Plugin vẫn sở hữu hành vi thực tế.                                  |
| `setup`                              | Không    | `object`                         | Các mô tả thiết lập/onboarding gọn nhẹ mà bề mặt khám phá và thiết lập có thể kiểm tra mà không tải runtime của Plugin.                                                                                                             |
| `qaRunners`                          | Không    | `object[]`                       | Các mô tả trình chạy QA gọn nhẹ được host `openclaw qa` dùng chung trước khi runtime của Plugin được tải.                                                                                                                           |
| `contracts`                          | Không    | `object`                         | Ảnh chụp tĩnh quyền sở hữu capability cho hook xác thực bên ngoài, giọng nói, phiên âm thời gian thực, giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, web-fetch, tìm kiếm web, và quyền sở hữu công cụ.   |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Giá trị mặc định hiểu phương tiện gọn nhẹ cho các id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                       |
| `imageGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo ảnh gọn nhẹ cho các id nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm bí danh xác thực và guard base-url do nhà cung cấp sở hữu.                                          |
| `videoGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo video gọn nhẹ cho các id nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm bí danh xác thực và guard base-url do nhà cung cấp sở hữu.                                        |
| `musicGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo nhạc gọn nhẹ cho các id nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm bí danh xác thực và guard base-url do nhà cung cấp sở hữu.                                         |
| `toolMetadata`                       | Không    | `Record<string, object>`         | Siêu dữ liệu khả dụng gọn nhẹ cho các công cụ do Plugin sở hữu được khai báo trong `contracts.tools`. Dùng khi một công cụ không nên tải runtime trừ khi có bằng chứng cấu hình, env, hoặc xác thực.                                |
| `channelConfigs`                     | Không    | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do manifest sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi runtime được tải.                                                                                                        |
| `skills`                             | Không    | `string[]`                       | Các thư mục Skills cần tải, tương đối với gốc Plugin.                                                                                                                                                                               |
| `name`                               | Không    | `string`                         | Tên Plugin dễ đọc cho con người.                                                                                                                                                                                                    |
| `description`                        | Không    | `string`                         | Tóm tắt ngắn hiển thị trong các giao diện Plugin.                                                                                                                                                                                   |
| `version`                            | Không    | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                               |
| `uiHints`                            | Không    | `Record<string, object>`         | Nhãn UI, phần giữ chỗ và gợi ý về độ nhạy cảm cho các trường cấu hình.                                                                                                                                                              |

## Tham chiếu metadata nhà cung cấp tạo sinh

Các trường metadata của nhà cung cấp tạo sinh mô tả các tín hiệu xác thực tĩnh cho
những nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders`
tương ứng. OpenClaw đọc các trường này trước khi runtime của nhà cung cấp tải để
các công cụ lõi có thể quyết định liệu một nhà cung cấp tạo sinh có khả dụng hay
không mà không cần import mọi plugin nhà cung cấp.

Chỉ dùng các trường này cho những dữ kiện khai báo, chi phí thấp. Transport, biến
đổi yêu cầu, làm mới token, xác thực thông tin đăng nhập, và hành vi tạo sinh thực
tế vẫn nằm trong runtime của plugin.

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

Mỗi mục metadata hỗ trợ:

| Trường          | Bắt buộc | Kiểu      | Ý nghĩa                                                                                                                                    |
| --------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Không    | `string[]` | Các id nhà cung cấp bổ sung sẽ được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo sinh.                                                |
| `authProviders` | Không    | `string[]` | Các id nhà cung cấp có hồ sơ xác thực đã cấu hình sẽ được tính là xác thực cho nhà cung cấp tạo sinh này.                                   |
| `configSignals` | Không    | `object[]` | Các tín hiệu khả dụng chỉ dựa trên cấu hình, chi phí thấp, cho nhà cung cấp local hoặc tự lưu trữ có thể được cấu hình không cần hồ sơ xác thực hoặc biến môi trường. |
| `authSignals`   | Không    | `object[]` | Các tín hiệu xác thực rõ ràng. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ id nhà cung cấp, `aliases`, và `authProviders`.           |

Mỗi mục `configSignals` hỗ trợ:

| Trường        | Bắt buộc | Kiểu      | Ý nghĩa                                                                                                                                                     |
| ------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Có       | `string`  | Đường dẫn dạng dấu chấm tới đối tượng cấu hình do plugin sở hữu cần kiểm tra, ví dụ `plugins.entries.example.config`.                                       |
| `overlayPath` | Không    | `string`  | Đường dẫn dạng dấu chấm bên trong cấu hình gốc, nơi đối tượng sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng cho cấu hình theo năng lực như `image`, `video`, hoặc `music`. |
| `required`    | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực phải có giá trị đã cấu hình. Chuỗi không được rỗng; đối tượng và mảng không được rỗng.               |
| `requiredAny` | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                        |
| `mode`        | Không    | `object`  | Điều kiện chặn theo chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng khi khả dụng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                  |

Mỗi điều kiện chặn `mode` hỗ trợ:

| Trường        | Bắt buộc | Kiểu      | Ý nghĩa                                                                           |
| ------------ | -------- | --------- | --------------------------------------------------------------------------------- |
| `path`       | Không    | `string`  | Đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.          |
| `default`    | Không    | `string`  | Giá trị chế độ sẽ dùng khi cấu hình bỏ qua đường dẫn.                             |
| `allowed`    | Không    | `string[]` | Nếu có mặt, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.    |
| `disallowed` | Không    | `string[]` | Nếu có mặt, tín hiệu thất bại khi chế độ hiệu lực là một trong các giá trị này.   |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                          |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Có       | `string` | Id nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                |
| `providerBaseUrl` | Không    | `object` | Điều kiện chặn tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu dùng URL cơ sở được cho phép. Dùng khi bí danh xác thực chỉ hợp lệ cho một số API nhất định. |

Mỗi điều kiện chặn `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu      | Ý nghĩa                                                                                                                                       |
| ----------------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string`  | Id cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                      |
| `defaultBaseUrl`  | Không    | `string`  | URL cơ sở giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu metadata công cụ

`toolMetadata` dùng cùng dạng `configSignals` và `authSignals` như metadata nhà
cung cấp tạo sinh, được khóa theo tên công cụ. `contracts.tools` khai báo quyền
sở hữu. `toolMetadata` khai báo bằng chứng khả dụng chi phí thấp để OpenClaw có
thể tránh import runtime của plugin chỉ để factory công cụ của nó trả về `null`.

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
tải plugin sở hữu khi hợp đồng công cụ khớp với chính sách. Với các công cụ trên
đường nóng mà factory phụ thuộc vào xác thực/cấu hình, tác giả plugin nên khai
báo `toolMetadata` thay vì khiến lõi import runtime để hỏi.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn onboarding hoặc xác thực.
OpenClaw đọc mục này trước khi runtime của nhà cung cấp tải.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn manifest này, các lựa chọn
thiết lập dẫn xuất từ descriptor, và metadata danh mục cài đặt mà không tải
runtime của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                          |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                        |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để phân phối tới.                                                        |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng onboarding và CLI.                          |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw dùng dự phòng `choiceId`.                     |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                              |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do assistant điều khiển.       |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi các bộ chọn của assistant trong khi vẫn cho phép chọn thủ công bằng CLI.        |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ nên chuyển hướng người dùng tới lựa chọn thay thế này.                        |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                 |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng cho nhóm đó.                                                       |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                 |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                    |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn `--openrouter-api-key`.                                                   |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn `--openrouter-api-key <key>`.                               |
| `cliDescription`      | Không    | `string`                                        | Mô tả dùng trong trợ giúp CLI.                                                                  |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt onboarding mà lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`. |

## Tham chiếu commandAliases

Dùng `commandAliases` khi một Plugin sở hữu tên lệnh runtime mà người dùng có thể
đưa nhầm vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw
dùng siêu dữ liệu này cho chẩn đoán mà không nhập mã runtime của Plugin.

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

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                    |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về Plugin này.                                              |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu alias là lệnh gạch chéo trong chat thay vì lệnh CLI gốc.          |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có lệnh như vậy. |

## tham chiếu activation

Dùng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện control-plane
nào nên đưa nó vào một kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu planner, không phải API vòng đời. Nó không đăng ký
hành vi runtime, không thay thế `register(...)`, và không cam kết rằng
mã Plugin đã được thực thi. Activation planner dùng các trường này để
thu hẹp các Plugin ứng viên trước khi quay lại siêu dữ liệu quyền sở hữu manifest
hiện có như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hooks.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Dùng
`providers`, `channels`, `commandAliases`, setup descriptors, hoặc `contracts`
khi các trường đó thể hiện mối quan hệ. Dùng `activation` cho các gợi ý planner
bổ sung không thể biểu diễn bằng những trường quyền sở hữu đó.
Dùng `cliBackends` cấp cao nhất cho các alias runtime CLI như `claude-cli`,
`codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
id agent harness nhúng chưa có trường quyền sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi runtime, và không
thay thế `register(...)`, `setupEntry`, hoặc các entrypoint runtime/Plugin khác.
Các consumer hiện tại dùng nó như một gợi ý thu hẹp trước khi tải Plugin rộng hơn, nên
thiếu siêu dữ liệu activation không phải startup thường chỉ ảnh hưởng hiệu năng; nó
không nên làm thay đổi tính đúng đắn khi các fallback quyền sở hữu manifest vẫn tồn tại.

Mỗi Plugin nên đặt `activation.onStartup` một cách có chủ ý. Đặt thành `true`
chỉ khi Plugin phải chạy trong quá trình startup Gateway. Đặt thành `false` khi
Plugin bất hoạt lúc startup và chỉ nên tải từ các trigger hẹp hơn.
Việc bỏ qua `onStartup` không còn ngầm tải Plugin lúc startup; hãy dùng
siêu dữ liệu activation tường minh cho startup, channel, config, agent-harness, memory,
hoặc các trigger activation hẹp hơn khác.

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

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                   |
| ------------------ | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt startup Gateway tường minh. Mỗi Plugin nên đặt trường này. `true` nhập Plugin trong startup; `false` giữ nó lazy lúc startup trừ khi một trigger khớp khác yêu cầu tải.        |
| `onProviders`      | Không    | `string[]`                                           | Id provider nên đưa Plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                           |
| `onAgentHarnesses` | Không    | `string[]`                                           | Id runtime agent harness nhúng nên đưa Plugin này vào các kế hoạch kích hoạt/tải. Dùng `cliBackends` cấp cao nhất cho các alias backend CLI.                                             |
| `onCommands`       | Không    | `string[]`                                           | Id lệnh nên đưa Plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                               |
| `onChannels`       | Không    | `string[]`                                           | Id channel nên đưa Plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                            |
| `onRoutes`         | Không    | `string[]`                                           | Loại route nên đưa Plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                            |
| `onConfigPaths`    | Không    | `string[]`                                           | Đường dẫn config tương đối từ root nên đưa Plugin này vào các kế hoạch startup/tải khi đường dẫn hiện diện và không bị tắt tường minh.                                                   |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Gợi ý capability rộng được dùng bởi lập kế hoạch activation control-plane. Ưu tiên các trường hẹp hơn khi có thể.                                                                        |

Các consumer live hiện tại:

- Lập kế hoạch startup Gateway dùng `activation.onStartup` cho import startup
  tường minh
- lập kế hoạch CLI được kích hoạt bởi lệnh quay lại dùng legacy
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- lập kế hoạch startup agent-runtime dùng `activation.onAgentHarnesses` cho
  harness nhúng và `cliBackends[]` cấp cao nhất cho alias runtime CLI
- lập kế hoạch setup/channel được kích hoạt bởi channel quay lại dùng quyền sở hữu
  `channels[]` legacy khi thiếu siêu dữ liệu activation channel tường minh
- lập kế hoạch Plugin startup dùng `activation.onConfigPaths` cho các bề mặt
  config root không phải channel như khối `browser` của Plugin browser đi kèm
- lập kế hoạch setup/runtime được kích hoạt bởi provider quay lại dùng quyền sở hữu
  `providers[]` legacy và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu
  activation provider tường minh

Chẩn đoán planner có thể phân biệt gợi ý activation tường minh với fallback
quyền sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là
planner đã dùng quyền sở hữu `commandAliases`. Các nhãn lý do này dành cho
chẩn đoán host và kiểm thử; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu
mô tả quyền sở hữu tốt nhất.

## tham chiếu qaRunners

Dùng `qaRunners` khi một Plugin đóng góp một hoặc nhiều transport runner bên dưới
root `openclaw qa` dùng chung. Giữ siêu dữ liệu này rẻ và tĩnh; runtime Plugin
vẫn sở hữu việc đăng ký CLI thực tế thông qua một bề mặt
`runtime-api.ts` gọn nhẹ xuất `qaRunnerCliRegistrations`.

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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                               |
| ------------- | -------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.             |
| `description` | Không    | `string` | Văn bản trợ giúp fallback được dùng khi host dùng chung cần lệnh stub. |

## tham chiếu setup

Dùng `setup` khi các bề mặt setup và onboarding cần siêu dữ liệu do Plugin sở hữu
với chi phí thấp trước khi runtime tải.

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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận
CLI. `setup.cliBackends` là bề mặt descriptor dành riêng cho setup cho
các luồng control-plane/setup nên chỉ duy trì ở dạng siêu dữ liệu.

Khi hiện diện, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu
ưu tiên descriptor trước cho khám phá setup. Nếu descriptor chỉ
thu hẹp Plugin ứng viên và setup vẫn cần các hook runtime lúc setup phong phú hơn,
hãy đặt `requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi
fallback.

OpenClaw cũng đưa `setup.providers[].envVars` vào các tra cứu provider auth và
env-var chung. `providerAuthEnvVars` vẫn được hỗ trợ thông qua một adapter tương thích
trong thời gian ngừng hỗ trợ dần, nhưng các Plugin không đi kèm vẫn dùng nó
sẽ nhận chẩn đoán manifest. Plugin mới nên đặt siêu dữ liệu env setup/status
trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods`
khi không có setup entry, hoặc khi `setup.requiresRuntime: false`
khai báo runtime setup là không cần thiết. Các mục `providerAuthChoices` tường minh vẫn
được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding, và siêu dữ liệu assistant.

Chỉ đặt `requiresRuntime: false` khi các descriptor đó là đủ cho
bề mặt setup. OpenClaw coi `false` tường minh là một hợp đồng chỉ descriptor
và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` cho tra cứu setup. Nếu
một Plugin chỉ descriptor vẫn đóng gói một trong các entry runtime setup đó,
OpenClaw báo cáo một chẩn đoán bổ sung và tiếp tục bỏ qua nó. Việc bỏ qua
`requiresRuntime` giữ hành vi fallback legacy để các Plugin hiện có đã thêm
descriptor mà không có cờ này không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị
`setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải luôn duy nhất trên
các Plugin đã khám phá. Quyền sở hữu mơ hồ sẽ fail closed thay vì chọn
một bên thắng theo thứ tự khám phá.

Khi runtime setup có thực thi, chẩn đoán setup registry báo cáo sai lệch descriptor
nếu `setup-api` đăng ký provider hoặc CLI backend mà các descriptor manifest
không khai báo, hoặc nếu một descriptor không có đăng ký runtime khớp.
Các chẩn đoán này là bổ sung và không từ chối các Plugin legacy.

### tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                  |
| -------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Id provider được phơi bày trong setup hoặc onboarding. Giữ các id đã chuẩn hóa là duy nhất toàn cục.     |
| `authMethods`  | Không    | `string[]` | Id phương thức setup/auth mà provider này hỗ trợ mà không cần tải toàn bộ runtime.                       |
| `envVars`      | Không    | `string[]` | Env vars mà các bề mặt setup/status chung có thể kiểm tra trước khi runtime Plugin tải.                  |
| `authEvidence` | Không    | `object[]` | Kiểm tra bằng chứng auth cục bộ rẻ cho provider có thể xác thực thông qua marker không phải secret.      |

`authEvidence` dành cho các dấu hiệu thông tin xác thực cục bộ do nhà cung cấp sở hữu có thể được
xác minh mà không cần tải mã runtime. Các kiểm tra này phải luôn nhẹ và cục bộ:
không gọi mạng, không đọc keychain hay trình quản lý bí mật, không chạy lệnh shell, và không
thăm dò API của nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Loại       | Ý nghĩa                                                                                                           |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | Có       | `string`   | Hiện là `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Không    | `string`   | Biến môi trường chứa đường dẫn tệp thông tin xác thực rõ ràng.                                                    |
| `fallbackPaths`    | Không    | `string[]` | Các đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không    | `string[]` | Ít nhất một biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                             |
| `requiresAllEnv`   | Không    | `string[]` | Mọi biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                     |
| `credentialMarker` | Có       | `string`   | Dấu hiệu không bí mật được trả về khi bằng chứng hiện diện.                                                       |
| `source`           | Không    | `string`   | Nhãn nguồn hướng tới người dùng cho đầu ra xác thực/trạng thái.                                                   |

### Các trường setup

| Trường             | Bắt buộc | Loại       | Ý nghĩa                                                                                              |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Các bộ mô tả thiết lập nhà cung cấp được hiển thị trong quá trình thiết lập và onboarding.           |
| `cliBackends`      | Không    | `string[]` | ID backend tại thời điểm thiết lập dùng cho tra cứu thiết lập ưu tiên bộ mô tả. Giữ các ID chuẩn hóa là duy nhất trên toàn cục. |
| `configMigrations` | Không    | `string[]` | ID di chuyển cấu hình do bề mặt thiết lập của plugin này sở hữu.                                     |
| `requiresRuntime`  | Không    | `boolean`  | Liệu thiết lập vẫn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                      |

## Tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình tới các gợi ý hiển thị nhỏ.

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

| Trường        | Loại       | Ý nghĩa                                      |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Nhãn trường hướng tới người dùng.            |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                       |
| `tags`        | `string[]` | Các thẻ UI tùy chọn.                         |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.                 |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.     |
| `placeholder` | `string`   | Văn bản placeholder cho đầu vào biểu mẫu.    |

## Tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu sở hữu khả năng tĩnh mà OpenClaw có thể
đọc mà không cần nhập runtime của plugin.

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

| Trường                           | Loại       | Ý nghĩa                                                              |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory tiện ích mở rộng app-server Codex, hiện là `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime mà một plugin được gói kèm có thể đăng ký middleware kết quả công cụ cho chúng. |
| `externalAuthProviders`          | `string[]` | ID nhà cung cấp có hook hồ sơ xác thực bên ngoài do plugin này sở hữu. |
| `speechProviders`                | `string[]` | ID nhà cung cấp giọng nói do plugin này sở hữu.                      |
| `realtimeTranscriptionProviders` | `string[]` | ID nhà cung cấp phiên âm thời gian thực do plugin này sở hữu.        |
| `realtimeVoiceProviders`         | `string[]` | ID nhà cung cấp thoại thời gian thực do plugin này sở hữu.           |
| `memoryEmbeddingProviders`       | `string[]` | ID nhà cung cấp nhúng bộ nhớ do plugin này sở hữu.                   |
| `mediaUnderstandingProviders`    | `string[]` | ID nhà cung cấp hiểu phương tiện do plugin này sở hữu.               |
| `imageGenerationProviders`       | `string[]` | ID nhà cung cấp tạo hình ảnh do plugin này sở hữu.                   |
| `videoGenerationProviders`       | `string[]` | ID nhà cung cấp tạo video do plugin này sở hữu.                      |
| `webFetchProviders`              | `string[]` | ID nhà cung cấp tìm nạp web do plugin này sở hữu.                    |
| `webSearchProviders`             | `string[]` | ID nhà cung cấp tìm kiếm web do plugin này sở hữu.                   |
| `migrationProviders`             | `string[]` | ID nhà cung cấp nhập do plugin này sở hữu cho `openclaw migrate`.    |
| `tools`                          | `string[]` | Tên công cụ Agent do plugin này sở hữu.                              |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng chỉ dành cho app-server Codex
được gói kèm. Các phép biến đổi kết quả công cụ được gói kèm nên
khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể
đăng ký middleware kết quả công cụ vì seam này có thể viết lại đầu ra công cụ độ tin cậy cao
trước khi mô hình thấy nó.

Các đăng ký runtime `api.registerTool(...)` phải khớp với `contracts.tools`.
Khám phá công cụ dùng danh sách này để chỉ tải các runtime plugin có thể sở hữu
những công cụ được yêu cầu.

Các plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`. Các plugin không có khai báo vẫn chạy
qua một fallback tương thích đã lỗi thời, nhưng fallback đó chậm hơn và
sẽ bị xóa sau cửa sổ di chuyển.

Các nhà cung cấp nhúng bộ nhớ được gói kèm nên khai báo
`contracts.memoryEmbeddingProviders` cho mọi ID adapter mà chúng hiển thị, bao gồm
các adapter tích hợp sẵn như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest này
để chỉ tải plugin sở hữu trước khi toàn bộ runtime Gateway
đã đăng ký nhà cung cấp.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu phương tiện có
mô hình mặc định, mức ưu tiên fallback tự động cho xác thực, hoặc hỗ trợ tài liệu gốc mà
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

| Trường                 | Loại                                | Ý nghĩa                                                                    |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Các khả năng phương tiện do nhà cung cấp này hiển thị.                     |
| `defaultModels`        | `Record<string, string>`            | Mặc định từ khả năng tới mô hình được dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số nhỏ hơn được sắp xếp sớm hơn cho fallback nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                             |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi một plugin kênh cần siêu dữ liệu cấu hình nhẹ trước khi
runtime tải. Khám phá thiết lập/trạng thái kênh chỉ đọc có thể dùng trực tiếp siêu dữ liệu này
cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập nào khả dụng, hoặc
khi `setup.requiresRuntime: false` khai báo runtime thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest plugin, không phải một phần cấu hình người dùng cấp cao nhất mới.
Người dùng vẫn cấu hình các phiên bản kênh dưới `channels.<channel-id>`.
OpenClaw đọc siêu dữ liệu manifest để quyết định plugin nào sở hữu kênh đã cấu hình đó
trước khi mã runtime plugin thực thi.

Đối với plugin kênh, `configSchema` và `channelConfigs` mô tả các
đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các plugin không được gói kèm khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải plugin, nhưng
schema cấu hình đường dẫn lạnh, thiết lập, và các bề mặt UI Điều khiển không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi runtime plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo mặc định `auto` tĩnh cho các kiểm tra cấu hình lệnh
chạy trước khi runtime kênh tải. Các kênh được gói kèm cũng có thể xuất bản
cùng các mặc định đó qua `package.json#openclaw.channel.commands` cùng với
siêu dữ liệu danh mục kênh do gói của chúng sở hữu.

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

| Trường        | Kiểu                     | Ý nghĩa                                                                                       |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc với mỗi mục cấu hình kênh đã khai báo.              |
| `uiHints`     | `Record<string, object>` | Nhãn/trình giữ chỗ/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                         |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào bộ chọn và bề mặt kiểm tra khi siêu dữ liệu thời gian chạy chưa sẵn sàng. |
| `description` | `string`                 | Mô tả ngắn về kênh cho các bề mặt kiểm tra và danh mục.                                       |
| `commands`    | `object`                 | Lệnh gốc tĩnh và mặc định tự động của kỹ năng gốc cho các kiểm tra cấu hình trước thời gian chạy. |
| `preferOver`  | `string[]`               | ID Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên vượt lên trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một ID kênh mà
một Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là ID Plugin đã được đổi tên, một
Plugin độc lập thay thế một Plugin đi kèm, hoặc một bản fork được bảo trì vẫn
giữ cùng ID kênh để tương thích cấu hình.

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

Khi `channels.chat` được cấu hình, OpenClaw xét cả ID kênh và
ID Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì
nó được đi kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong
cấu hình thời gian chạy hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng
vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin được yêu cầu.

Giữ `preferOver` giới hạn trong các ID Plugin thật sự có thể cung cấp cùng kênh.
Đây không phải là trường ưu tiên chung và không đổi tên khóa cấu hình của người dùng.

## Tham chiếu modelSupport

Dùng `modelSupport` khi OpenClaw nên suy ra Plugin nhà cung cấp của bạn từ
các ID mô hình rút gọn như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi thời gian chạy
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

- tham chiếu `provider/model` rõ ràng dùng siêu dữ liệu manifest `providers` sở hữu
- `modelPatterns` thắng `modelPrefixes`
- nếu một Plugin không đi kèm và một Plugin đi kèm đều khớp, Plugin không đi kèm
  thắng
- phần mơ hồ còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                 |
| --------------- | ---------- | ----------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được so khớp bằng `startsWith` với ID mô hình rút gọn.      |
| `modelPatterns` | `string[]` | Nguồn regex được so khớp với ID mô hình rút gọn sau khi bỏ hậu tố hồ sơ. |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw nên biết siêu dữ liệu mô hình của nhà cung cấp trước khi
tải thời gian chạy Plugin. Đây là nguồn thuộc sở hữu manifest cho các
hàng danh mục cố định, bí danh nhà cung cấp, quy tắc ẩn, và chế độ khám phá. Làm mới thời gian chạy
vẫn thuộc về mã thời gian chạy của nhà cung cấp, nhưng manifest cho lõi biết khi nào cần
thời gian chạy.

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

| Trường         | Kiểu                                                     | Ý nghĩa                                                                                                     |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho ID nhà cung cấp do Plugin này sở hữu. Khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải tới một nhà cung cấp được sở hữu cho lập kế hoạch danh mục hoặc ẩn.       |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này ẩn vì lý do dành riêng cho nhà cung cấp.                        |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Danh mục nhà cung cấp có thể được đọc từ siêu dữ liệu manifest, làm mới vào bộ nhớ đệm, hay cần thời gian chạy. |

`aliases` tham gia vào tra cứu quyền sở hữu nhà cung cấp cho lập kế hoạch danh mục mô hình.
Đích bí danh phải là nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng phần ghi đè API/URL cơ sở của bí danh mà không tải thời gian chạy nhà cung cấp.
Bí danh không mở rộng danh sách danh mục không lọc; danh sách rộng chỉ phát ra
các hàng nhà cung cấp chuẩn sở hữu.

`suppressions` thay thế hook thời gian chạy nhà cung cấp `suppressBuiltInModel` cũ.
Các mục ẩn chỉ được tôn trọng khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ tới một nhà cung cấp được sở hữu. Hook
ẩn thời gian chạy không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                               |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL cơ sở mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ chuyển đổi API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.           |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Hàng không có `id` sẽ bị bỏ qua.           |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                 |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID mô hình cục bộ của nhà cung cấp, không có tiền tố `provider/`.       |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                  |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn cho từng mô hình.                                   |
| `baseUrl`       | `string`                                                       | Ghi đè URL cơ sở tùy chọn cho từng mô hình.                             |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn cho từng mô hình.                                  |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức đầu vào mà mô hình chấp nhận.                           |
| `reasoning`     | `boolean`                                                      | Mô hình có phơi bày hành vi suy luận hay không.                         |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                   |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh thời gian chạy hiệu lực tùy chọn khi khác với `contextWindow`. |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết.                                        |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn. |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng hoàn toàn không được xuất hiện.     |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị với trạng thái không khả dụng.                  |
| `replaces`      | `string[]`                                                     | Các ID mô hình cục bộ nhà cung cấp cũ hơn mà mô hình này thay thế.      |
| `replacedBy`    | `string`                                                       | ID mô hình cục bộ nhà cung cấp thay thế cho các hàng đã ngừng dùng.     |
| `tags`          | `string[]`                                                     | Thẻ ổn định được bộ chọn và bộ lọc sử dụng.                             |

Các trường ẩn:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                   |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID nhà cung cấp cho hàng thượng nguồn cần ẩn. Phải do Plugin này sở hữu hoặc được khai báo là bí danh được sở hữu. |
| `model`                    | `string`   | ID mô hình cục bộ của nhà cung cấp cần ẩn.                                                                |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng bị ẩn được yêu cầu trực tiếp.                                        |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host URL cơ sở hiệu lực của nhà cung cấp bắt buộc trước khi áp dụng ẩn.            |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` cấu hình nhà cung cấp chính xác bắt buộc trước khi áp dụng ẩn.       |

Không đặt dữ liệu chỉ dùng lúc thời gian chạy trong `modelCatalog`. Chỉ dùng `static` khi các hàng trong tệp kê khai đã đủ hoàn chỉnh để các bề mặt danh sách được lọc theo nhà cung cấp và bộ chọn có thể bỏ qua việc khám phá sổ đăng ký/thời gian chạy. Dùng `refreshable` khi các hàng trong tệp kê khai là các hạt giống hoặc phần bổ sung hữu ích có thể liệt kê, nhưng thao tác làm mới/bộ nhớ đệm có thể thêm nhiều hàng hơn về sau; các hàng có thể làm mới tự bản thân chúng không có thẩm quyền. Dùng `runtime` khi OpenClaw phải tải thời gian chạy của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp mã định danh mô hình chi phí thấp do nhà cung cấp sở hữu, cần diễn ra trước khi thời gian chạy của nhà cung cấp được tải. Điều này giữ các bí danh như tên mô hình ngắn, mã định danh cũ cục bộ theo nhà cung cấp, và quy tắc tiền tố proxy trong tệp kê khai Plugin sở hữu thay vì trong các bảng chọn mô hình lõi.

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

Các trường của nhà cung cấp:

| Trường                               | Kiểu                    | Ý nghĩa                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Các bí danh mã định danh mô hình chính xác, không phân biệt chữ hoa/thường. Giá trị được trả về đúng như đã ghi. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần loại bỏ trước khi tra cứu bí danh, hữu ích cho trường hợp trùng lặp nhà cung cấp/mô hình cũ. |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi mã định danh mô hình đã chuẩn hóa chưa chứa `/`.                      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc tiền tố mã định danh trần có điều kiện sau khi tra cứu bí danh, được khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho việc phân loại điểm cuối mà chính sách yêu cầu chung cần biết trước khi thời gian chạy của nhà cung cấp được tải. Lõi vẫn sở hữu ý nghĩa của từng `endpointClass`; tệp kê khai Plugin sở hữu siêu dữ liệu máy chủ và URL cơ sở.

Các trường điểm cuối:

| Trường                         | Kiểu       | Ý nghĩa                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp điểm cuối lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên máy chủ chính xác ánh xạ tới lớp điểm cuối.                                                |
| `hostSuffixes`                 | `string[]` | Hậu tố máy chủ ánh xạ tới lớp điểm cuối. Thêm tiền tố `.` để chỉ khớp hậu tố miền.             |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp điểm cuối.                            |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các máy chủ toàn cục chính xác.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các máy chủ khớp để hiển thị tiền tố vùng Google Vertex.               |

## Tham chiếu providerRequest

Dùng `providerRequest` cho siêu dữ liệu tương thích yêu cầu chi phí thấp mà chính sách yêu cầu chung cần có mà không cần tải thời gian chạy của nhà cung cấp. Giữ việc viết lại tải trọng theo hành vi cụ thể trong các hook thời gian chạy của nhà cung cấp hoặc các trình trợ giúp họ nhà cung cấp dùng chung.

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

Các trường của nhà cung cấp:

| Trường                | Kiểu         | Ý nghĩa                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp được dùng cho quyết định tương thích yêu cầu chung và chẩn đoán.  |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho các trình trợ giúp yêu cầu dùng chung.    |
| `openAICompletions`   | `object`     | Các cờ yêu cầu hoàn thành tương thích OpenAI, hiện là `supportsStreamingUsage`.         |

## Tham chiếu modelPricing

Dùng `modelPricing` khi nhà cung cấp cần hành vi định giá mặt phẳng điều khiển trước khi thời gian chạy được tải. Bộ nhớ đệm định giá của Gateway đọc siêu dữ liệu này mà không nhập mã thời gian chạy của nhà cung cấp.

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

Các trường của nhà cung cấp:

| Trường       | Kiểu              | Ý nghĩa                                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho các nhà cung cấp cục bộ/tự lưu trữ không bao giờ được lấy giá OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.             |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.                   |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                           |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Mã định danh nhà cung cấp danh mục bên ngoài khi nó khác với mã định danh nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem các mã định danh mô hình chứa dấu gạch chéo là tham chiếu nhà cung cấp/mô hình lồng nhau, hữu ích cho các nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể mã định danh mô hình danh mục bên ngoài bổ sung. `version-dots` thử các mã định danh phiên bản có dấu chấm như `claude-opus-4.6`. |

### Chỉ mục Nhà cung cấp OpenClaw

Chỉ mục Nhà cung cấp OpenClaw là siêu dữ liệu xem trước do OpenClaw sở hữu cho các nhà cung cấp mà Plugin của chúng có thể chưa được cài đặt. Nó không phải là một phần của tệp kê khai Plugin. Tệp kê khai Plugin vẫn là nguồn có thẩm quyền của Plugin đã cài đặt. Chỉ mục Nhà cung cấp là hợp đồng dự phòng nội bộ mà các bề mặt bộ chọn mô hình trước khi cài đặt và nhà cung cấp có thể cài đặt trong tương lai sẽ dùng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền danh mục:

1. Cấu hình người dùng.
2. `modelCatalog` trong tệp kê khai Plugin đã cài đặt.
3. Bộ nhớ đệm danh mục mô hình từ thao tác làm mới rõ ràng.
4. Các hàng xem trước trong Chỉ mục Nhà cung cấp OpenClaw.

Chỉ mục Nhà cung cấp không được chứa bí mật, trạng thái bật, hook thời gian chạy, hoặc dữ liệu mô hình trực tiếp dành riêng cho tài khoản. Các danh mục xem trước của nó dùng cùng dạng hàng nhà cung cấp `modelCatalog` như tệp kê khai Plugin, nhưng nên giới hạn ở siêu dữ liệu hiển thị ổn định trừ khi các trường bộ điều hợp thời gian chạy như `api`, `baseUrl`, định giá, hoặc cờ tương thích được cố ý giữ đồng bộ với tệp kê khai Plugin đã cài đặt. Các nhà cung cấp có khám phá `/models` trực tiếp nên ghi các hàng đã làm mới qua đường dẫn bộ nhớ đệm danh mục mô hình rõ ràng thay vì để việc liệt kê thông thường hoặc tiếp nhận gọi API của nhà cung cấp.

Mục trong Chỉ mục Nhà cung cấp cũng có thể mang siêu dữ liệu Plugin có thể cài đặt cho các nhà cung cấp có Plugin đã được chuyển ra khỏi lõi hoặc chưa được cài đặt vì lý do khác. Siêu dữ liệu này phản ánh mẫu danh mục kênh: tên gói, đặc tả cài đặt npm, tính toàn vẹn dự kiến, và nhãn lựa chọn xác thực chi phí thấp là đủ để hiển thị một tùy chọn thiết lập có thể cài đặt. Khi Plugin được cài đặt, tệp kê khai của nó thắng và mục trong Chỉ mục Nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa năng lực cấp cao nhất cũ không còn được khuyến nghị. Dùng `openclaw doctor --fix` để chuyển `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; quá trình tải tệp kê khai thông thường không còn xem các trường cấp cao nhất đó là quyền sở hữu năng lực.

## Tệp kê khai so với package.json

Hai tệp phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực, và gợi ý giao diện người dùng phải tồn tại trước khi mã Plugin chạy |
| `package.json`         | Siêu dữ liệu npm, cài đặt phụ thuộc, và khối `openclaw` được dùng cho điểm vào, kiểm soát điều kiện cài đặt, thiết lập, hoặc siêu dữ liệu danh mục |

Nếu bạn không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp điểm vào, hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số siêu dữ liệu Plugin trước thời gian chạy được cố ý đặt trong `package.json` dưới khối `openclaw` thay vì `openclaw.plugin.json`.
`openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng Plugin OpenClaw; Plugin gốc phải dùng `openclaw.plugin.json` cộng với các trường `package.json#openclaw` được hỗ trợ bên dưới.

Ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Khai báo các điểm vào Plugin gốc. Phải nằm trong thư mục gói Plugin.                                                                                                                             |
| `openclaw.runtimeExtensions`                                                               | Khai báo các điểm vào thời gian chạy JavaScript đã được xây dựng cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                      |
| `openclaw.setupEntry`                                                                      | Điểm vào nhẹ chỉ dành cho thiết lập, được dùng trong quá trình giới thiệu, khởi động kênh trì hoãn, và phát hiện trạng thái kênh chỉ đọc/SecretRef. Phải nằm trong thư mục gói Plugin.          |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo điểm vào thiết lập JavaScript đã được xây dựng cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại, và phải nằm trong thư mục gói Plugin.                                        |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh chi phí thấp như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                             |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu tĩnh cho lệnh gốc và mặc định tự động của kỹ năng gốc, được dùng bởi các bề mặt cấu hình, kiểm tra, và danh sách lệnh trước khi thời gian chạy của kênh được tải.                  |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu kiểm tra trạng thái đã cấu hình dạng nhẹ, có thể trả lời "thiết lập chỉ dùng env đã tồn tại chưa?" mà không cần tải toàn bộ thời gian chạy của kênh.                                |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu kiểm tra xác thực đã lưu dạng nhẹ, có thể trả lời "đã có thứ gì đăng nhập chưa?" mà không cần tải toàn bộ thời gian chạy của kênh.                                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho các Plugin được đóng gói kèm và được phát hành bên ngoài.                                                                                                              |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt khả dụng.                                                                                                                                    |
| `openclaw.install.minHostVersion`                                                          | Phiên bản máy chủ OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi toàn vẹn npm dist dự kiến như `sha512-...`; các luồng cài đặt và cập nhật xác minh tạo tác đã tải về theo chuỗi này.                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép một đường dẫn phục hồi cài đặt lại Plugin đóng gói kèm trong phạm vi hẹp khi cấu hình không hợp lệ.                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước toàn bộ Plugin kênh trong quá trình khởi động.                                                                                         |

Siêu dữ liệu manifest quyết định các lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
quá trình giới thiệu trước khi thời gian chạy tải. `package.json#openclaw.install` cho
quá trình giới thiệu biết cách tải về hoặc bật Plugin đó khi người dùng chọn một trong các
lựa chọn này. Không di chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
sổ đăng ký manifest cho các nguồn Plugin không đóng gói kèm. Giá trị không hợp lệ bị từ chối;
giá trị mới hơn nhưng hợp lệ sẽ bỏ qua các Plugin bên ngoài trên máy chủ cũ hơn. Các Plugin nguồn
được đóng gói kèm được giả định là đồng phiên bản với checkout máy chủ.

Siêu dữ liệu cài đặt theo nhu cầu chính thức nên dùng `clawhubSpec` khi Plugin được
phát hành trên ClawHub; quá trình giới thiệu xem đó là nguồn từ xa ưu tiên và
ghi lại các dữ kiện tạo tác ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án tương thích
dự phòng cho các gói chưa chuyển sang ClawHub.

Ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức
nên ghép thông số chính xác với `expectedIntegrity` để các luồng cập nhật thất bại
đóng nếu tạo tác npm đã tải về không còn khớp bản phát hành đã ghim.
Quá trình giới thiệu tương tác vẫn cung cấp các thông số npm từ sổ đăng ký đáng tin cậy, bao gồm
tên gói trần và dist-tag, để tương thích. Chẩn đoán danh mục có thể
phân biệt các nguồn chính xác, nổi, được ghim toàn vẹn, thiếu toàn vẹn, tên gói
không khớp, và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` hiện diện nhưng không có nguồn npm hợp lệ để nó ghim.
Khi `expectedIntegrity` hiện diện,
các luồng cài đặt/cập nhật thực thi nó; khi bị bỏ qua, phân giải sổ đăng ký được
ghi lại mà không có ghim toàn vẹn.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc các lần quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
thời gian chạy. Điểm vào thiết lập nên bộc lộ siêu dữ liệu kênh cùng cấu hình,
trạng thái, và bộ điều hợp bí mật an toàn cho thiết lập; giữ ứng dụng khách mạng, trình nghe Gateway, và
thời gian chạy truyền tải trong điểm vào tiện ích mở rộng chính.

Các trường điểm vào thời gian chạy không ghi đè kiểm tra ranh giới gói cho các trường
điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể làm cho một
đường dẫn `openclaw.extensions` thoát ra ngoài có thể tải được.

`openclaw.install.allowInvalidConfigRecovery` được cố ý giới hạn hẹp. Nó không
làm cho các cấu hình hỏng tùy ý trở nên có thể cài đặt. Hiện nay nó chỉ cho phép các
luồng cài đặt phục hồi từ những lỗi nâng cấp Plugin đóng gói kèm cũ cụ thể, chẳng hạn như
thiếu đường dẫn Plugin đóng gói kèm hoặc mục `channels.<id>` cũ cho chính
Plugin đóng gói kèm đó. Các lỗi cấu hình không liên quan vẫn chặn cài đặt và hướng
người vận hành đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là siêu dữ liệu gói cho một mô-đun kiểm tra nhỏ:

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

Dùng nó khi thiết lập, doctor, trạng thái, hoặc các luồng hiện diện chỉ đọc cần một phép dò
xác thực có/không chi phí thấp trước khi toàn bộ Plugin kênh tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật Plugin,
sửa chữa phụ thuộc thời gian chạy, hoặc quyết định liệu thời gian chạy của kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel toàn bộ thời gian chạy kênh.

`openclaw.channel.configuredState` có cùng dạng cho các kiểm tra đã cấu hình
chỉ dùng env chi phí thấp:

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

Dùng nó khi một kênh có thể trả lời trạng thái đã cấu hình từ env hoặc đầu vào nhỏ
khác không thuộc thời gian chạy. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc thời gian chạy
kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của Plugin.

## Thứ tự ưu tiên phát hiện (id Plugin trùng lặp)

OpenClaw phát hiện Plugin từ nhiều gốc (đóng gói kèm, cài đặt toàn cục, workspace, các đường dẫn được chọn rõ ràng trong cấu hình). Nếu hai phát hiện có cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì tải bên cạnh nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn trong cấu hình** — một đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đóng gói kèm** — các Plugin đi kèm OpenClaw
3. **Cài đặt toàn cục** — các Plugin được cài vào gốc Plugin OpenClaw toàn cục
4. **Workspace** — các Plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc cũ của Plugin đóng gói kèm nằm trong workspace sẽ không che khuất bản dựng đóng gói kèm.
- Để thực sự ghi đè một Plugin đóng gói kèm bằng bản cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo thứ tự ưu tiên thay vì dựa vào phát hiện workspace.
- Các bản trùng lặp bị loại bỏ được ghi log để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao đã bị loại.
- Ghi đè trùng lặp được chọn trong cấu hình được diễn đạt là ghi đè rõ ràng trong chẩn đoán, nhưng vẫn cảnh báo để các fork cũ và che khuất vô tình vẫn hiển thị.

## Yêu cầu JSON Schema

- **Mọi Plugin phải đi kèm một JSON Schema**, ngay cả khi nó không chấp nhận cấu hình.
- Schema rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại thời gian chạy.
- Khi mở rộng hoặc fork một Plugin đóng gói kèm với khóa cấu hình mới, hãy cập nhật `configSchema` trong `openclaw.plugin.json` của Plugin đó cùng lúc. Schema Plugin đóng gói kèm là nghiêm ngặt, nên việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi thời gian chạy Plugin tải.

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
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu các id Plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  xác thực thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **vô hiệu hóa**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + log.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết đầy đủ schema `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw native**, bao gồm cả việc tải từ hệ thống tệp cục bộ. Runtime vẫn tải module Plugin riêng; manifest chỉ dùng cho discovery + validation.
- Manifest native được phân tích bằng JSON5, nên comments, trailing commas và unquoted keys đều được chấp nhận miễn là giá trị cuối cùng vẫn là một object.
- Manifest loader chỉ đọc các trường manifest đã được ghi tài liệu. Tránh dùng các khóa top-level tùy chỉnh.
- `channels`, `providers`, `cliBackends`, và `skills` đều có thể được bỏ qua khi một Plugin không cần chúng.
- `providerCatalogEntry` phải luôn gọn nhẹ và không nên import mã runtime rộng; hãy dùng nó cho metadata catalog provider tĩnh hoặc các descriptor discovery hẹp, không dùng cho thực thi tại thời điểm request. `providerDiscoveryEntry` là cách viết legacy và vẫn hoạt động với các Plugin hiện có.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` ở runtime entry đã bị deprecated và chỉ còn là fallback tương thích cho các Plugin cũ.
- Metadata biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã deprecated, và `channelEnvVars`) chỉ mang tính khai báo. Status, audit, cron delivery validation, và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi xem một biến môi trường là đã được cấu hình.
- Với metadata wizard runtime cần mã provider, xem [Provider runtime hooks](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào native modules, hãy ghi tài liệu các bước build và mọi yêu cầu allowlist của package manager (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình capability.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu Plugin SDK và import subpath.
  </Card>
</CardGroup>
