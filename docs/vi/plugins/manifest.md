---
read_when:
    - Bạn đang xây dựng một plugin OpenClaw
    - Bạn cần phát hành lược đồ cấu hình Plugin hoặc gỡ lỗi xác thực Plugin
summary: Yêu cầu về tệp kê khai Plugin và lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-07-12T08:11:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này trình bày **tệp kê khai plugin OpenClaw gốc**, `openclaw.plugin.json`. Để biết các bố cục gói tương thích (Codex, Claude, Cursor), hãy xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích sử dụng tệp kê khai riêng:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json`, hoặc bố cục thành phần Claude mặc định không có tệp kê khai
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw tự động phát hiện các bố cục đó nhưng không xác thực chúng theo lược đồ `openclaw.plugin.json` bên dưới. Đối với một gói tương thích, OpenClaw đọc siêu dữ liệu gói, các thư mục gốc Skills đã khai báo, các thư mục gốc lệnh Claude, giá trị mặc định trong `settings.json` của Claude, giá trị mặc định LSP của Claude và các gói hook được hỗ trợ khi bố cục đáp ứng kỳ vọng thời gian chạy của OpenClaw.

Mọi Plugin OpenClaw gốc **phải** cung cấp `openclaw.plugin.json` trong **thư mục gốc của Plugin**. OpenClaw đọc tệp này để xác thực cấu hình **mà không thực thi mã Plugin**. Tệp kê khai bị thiếu hoặc không hợp lệ sẽ chặn quá trình xác thực cấu hình và được coi là lỗi Plugin.

Xem [Plugin](/vi/tools/plugin) để biết hướng dẫn đầy đủ về hệ thống Plugin và [Mô hình khả năng](/vi/plugins/architecture#public-capability-model) để biết mô hình khả năng gốc cùng hướng dẫn hiện tại về khả năng tương thích bên ngoài.

## Tệp này có tác dụng gì

`openclaw.plugin.json` là siêu dữ liệu mà OpenClaw đọc **trước khi tải mã Plugin của bạn**. Mọi nội dung trong đó phải đủ nhẹ để kiểm tra mà không cần khởi động môi trường thời gian chạy của Plugin.

**Sử dụng tệp này cho:**

- danh tính Plugin, xác thực cấu hình và gợi ý giao diện người dùng cấu hình
- siêu dữ liệu xác thực, hướng dẫn thiết lập ban đầu và thiết lập (bí danh, tự động bật, biến môi trường của nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt của mặt phẳng điều khiển
- quyền sở hữu họ mô hình dạng viết tắt
- ảnh chụp tĩnh về quyền sở hữu khả năng (`contracts`)
- siêu dữ liệu trình chạy QA mà máy chủ `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình dành riêng cho kênh được hợp nhất vào danh mục và các bề mặt xác thực

**Không sử dụng tệp này để:** đăng ký hành vi thời gian chạy, khai báo điểm vào mã hoặc siêu dữ liệu cài đặt npm. Những nội dung đó thuộc về mã Plugin và `package.json` của bạn.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

## Tham chiếu các trường cấp cao nhất

| Trường                               | Bắt buộc | Kiểu                         | Ý nghĩa                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                     | ID Plugin chuẩn. Đây là ID được dùng trong `plugins.entries.<id>`.                                                                                                                                                                                                                           |
| `configSchema`                       | Có       | `object`                     | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                                                                           |
| `requiresPlugins`                    | Không    | `string[]`                   | Các ID Plugin cũng phải được cài đặt để Plugin này có hiệu lực. Quá trình khám phá vẫn cho phép tải Plugin nhưng sẽ cảnh báo khi thiếu bất kỳ Plugin bắt buộc nào.                                                                                                                            |
| `enabledByDefault`                   | Không    | `true`                       | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này hoặc đặt thành bất kỳ giá trị nào khác `true` để Plugin vẫn bị tắt theo mặc định.                                                                                                                                     |
| `enabledByDefaultOnPlatforms`        | Không    | `string[]`                   | Đánh dấu một Plugin đi kèm là chỉ được bật theo mặc định trên các nền tảng Node.js được liệt kê, ví dụ `["darwin"]`. Cấu hình tường minh vẫn được ưu tiên.                                                                                                                                     |
| `legacyPluginIds`                    | Không    | `string[]`                   | Các ID cũ được chuẩn hóa thành ID Plugin chuẩn này.                                                                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                   | Các ID nhà cung cấp sẽ tự động bật Plugin này khi thông tin xác thực, cấu hình hoặc tham chiếu mô hình đề cập đến chúng.                                                                                                                                                                      |
| `kind`                               | Không    | `PluginKind \| PluginKind[]` | Khai báo một hoặc nhiều loại Plugin độc quyền (`"memory"`, `"context-engine"`) được `plugins.slots.*` sử dụng. Plugin sở hữu cả hai vị trí sẽ khai báo cả hai loại trong một mảng.                                                                                                             |
| `channels`                           | Không    | `string[]`                   | Các ID kênh do Plugin này sở hữu. Được dùng cho quá trình khám phá và xác thực cấu hình.                                                                                                                                                                                                      |
| `providers`                          | Không    | `string[]`                   | Các ID nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                                                                                     |
| `providerCatalogEntry`               | Không    | `string`                     | Đường dẫn mô-đun danh mục nhà cung cấp nhẹ, tương đối so với thư mục gốc của Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp thuộc phạm vi manifest có thể được tải mà không cần kích hoạt toàn bộ môi trường chạy của Plugin.                                                             |
| `modelSupport`                       | Không    | `object`                     | Siêu dữ liệu viết tắt về họ mô hình do manifest sở hữu, được dùng để tự động tải Plugin trước môi trường chạy.                                                                                                                                                                                |
| `modelCatalog`                       | Không    | `object`                     | Siêu dữ liệu danh mục mô hình dạng khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, quy trình làm quen, bộ chọn mô hình, bí danh và cơ chế ẩn trong tương lai mà không cần tải môi trường chạy của Plugin.                      |
| `modelPricing`                       | Không    | `object`                     | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng chính sách này để loại trừ các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp tới ID danh mục OpenRouter/LiteLLM mà không mã hóa cứng ID nhà cung cấp trong lõi.                        |
| `modelIdNormalization`               | Không    | `object`                     | Quy tắc dọn dẹp bí danh/tiền tố ID mô hình do nhà cung cấp sở hữu, phải chạy trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                                                             |
| `providerEndpoints`                  | Không    | `object[]`                   | Siêu dữ liệu máy chủ/baseUrl của điểm cuối do manifest sở hữu dành cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                      |
| `providerRequest`                    | Không    | `object`                     | Siêu dữ liệu nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung sử dụng trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                               |
| `secretProviderIntegrations`         | Không    | `Record<string, object>`     | Các thiết lập sẵn nhà cung cấp thực thi SecretRef dạng khai báo mà giao diện thiết lập hoặc cài đặt có thể cung cấp mà không cần mã hóa cứng các tích hợp riêng theo nhà cung cấp trong lõi.                                                                                                   |
| `cliBackends`                        | Không    | `string[]`                   | Các ID phần phụ trợ suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình tường minh.                                                                                                                                                     |
| `syntheticAuthRefs`                  | Không    | `string[]`                   | Các tham chiếu nhà cung cấp hoặc phần phụ trợ CLI có móc xác thực tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình nguội trước khi môi trường chạy được tải.                                                                                                        |
| `nonSecretAuthMarkers`               | Không    | `string[]`                   | Các giá trị khóa API giữ chỗ do Plugin đi kèm sở hữu, đại diện cho trạng thái thông tin xác thực cục bộ, OAuth hoặc từ môi trường và không phải là bí mật.                                                                                                                                    |
| `commandAliases`                     | Không    | `object[]`                   | Các tên lệnh do Plugin này sở hữu, cần tạo ra chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi môi trường chạy được tải.                                                                                                                                                               |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`   | Siêu dữ liệu biến môi trường tương thích đã lỗi thời dành cho việc tra cứu xác thực/trạng thái nhà cung cấp. Với Plugin mới, ưu tiên `setup.providers[].envVars`; OpenClaw vẫn đọc trường này trong thời gian ngừng hỗ trợ dần.                                                                  |
| `providerUsageAuthEnvVars`           | Không    | `Record<string, string[]>`   | Thông tin xác thực nhà cung cấp chỉ dành cho mức sử dụng/thanh toán. OpenClaw sử dụng các tên này để khám phá mức sử dụng và loại bỏ bí mật, nhưng không bao giờ dùng chúng để xác thực suy luận.                                                                                               |
| `providerAuthAliases`                | Không    | `Record<string, string>`     | Các ID nhà cung cấp cần tái sử dụng một ID nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                                                                                |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`   | Siêu dữ liệu biến môi trường kênh nhẹ mà OpenClaw có thể kiểm tra mà không cần tải mã Plugin. Dùng trường này cho giao diện thiết lập hoặc xác thực kênh dựa trên biến môi trường mà các trình hỗ trợ khởi động/cấu hình chung cần thấy.                                                         |
| `providerAuthChoices`                | Không    | `object[]`                   | Siêu dữ liệu nhẹ về lựa chọn xác thực dành cho bộ chọn trong quy trình làm quen, phân giải nhà cung cấp ưu tiên và kết nối cờ CLI đơn giản.                                                                                                                                                   |
| `activation`                         | Không    | `object`                     | Siêu dữ liệu nhẹ của bộ lập kế hoạch kích hoạt dành cho việc tải được kích hoạt bởi khởi động, nhà cung cấp, lệnh, kênh, tuyến và khả năng. Chỉ là siêu dữ liệu; môi trường chạy của Plugin vẫn sở hữu hành vi thực tế.                                                                          |
| `setup`                              | Không    | `object`                     | Các bộ mô tả nhẹ về thiết lập/quy trình làm quen mà quá trình khám phá và các giao diện thiết lập có thể kiểm tra mà không cần tải môi trường chạy của Plugin.                                                                                                                                |
| `qaRunners`                          | Không    | `object[]`                   | Các bộ mô tả nhẹ về trình chạy QA được máy chủ `openclaw qa` dùng chung sử dụng trước khi môi trường chạy của Plugin được tải.                                                                                                                                                                |
| `contracts`                          | Không    | `object`                     | Bản chụp tĩnh về quyền sở hữu khả năng đối với móc xác thực bên ngoài, embedding, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu nội dung đa phương tiện, tạo hình ảnh/video/nhạc, truy xuất web, tìm kiếm web, nhà cung cấp worker, trích xuất tài liệu/nội dung web và quyền sở hữu công cụ. |
| `configContracts`                    | Không    | `object`                     | Hành vi cấu hình do manifest sở hữu và được các trình hỗ trợ lõi chung sử dụng: phát hiện cờ nguy hiểm, đích di chuyển SecretRef và thu hẹp đường dẫn cấu hình cũ. Xem [tài liệu tham khảo configContracts](#configcontracts-reference).                                                        |
| `mediaUnderstandingProviderMetadata` | Không     | `Record<string, object>`     | Các giá trị mặc định ít tốn tài nguyên cho khả năng hiểu nội dung đa phương tiện của những mã định danh nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Không     | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho khả năng tạo hình ảnh của những mã định danh nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm bí danh xác thực do nhà cung cấp sở hữu và các cơ chế bảo vệ URL cơ sở.                                                                                                         |
| `videoGenerationProviderMetadata`    | Không     | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho khả năng tạo video của những mã định danh nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm bí danh xác thực do nhà cung cấp sở hữu và các cơ chế bảo vệ URL cơ sở.                                                                                                         |
| `musicGenerationProviderMetadata`    | Không     | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho khả năng tạo nhạc của những mã định danh nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm bí danh xác thực do nhà cung cấp sở hữu và các cơ chế bảo vệ URL cơ sở.                                                                                                         |
| `toolMetadata`                       | Không     | `Record<string, object>`     | Siêu dữ liệu về tính khả dụng ít tốn tài nguyên cho các công cụ thuộc sở hữu của plugin được khai báo trong `contracts.tools`. Sử dụng siêu dữ liệu này khi không nên tải thời gian chạy của công cụ trừ khi có bằng chứng về cấu hình, biến môi trường hoặc xác thực.                                                                                                  |
| `channelConfigs`                     | Không     | `Record<string, object>`     | Siêu dữ liệu cấu hình kênh thuộc sở hữu của tệp kê khai, được hợp nhất vào các bề mặt khám phá và xác thực trước khi tải thời gian chạy.                                                                                                                                                                 |
| `skills`                             | Không     | `string[]`                   | Các thư mục Skills cần tải, tính tương đối so với thư mục gốc của plugin.                                                                                                                                                                                                                    |
| `name`                               | Không     | `string`                     | Tên plugin dễ đọc đối với con người.                                                                                                                                                                                                                                                |
| `description`                        | Không     | `string`                     | Bản tóm tắt ngắn hiển thị trên các bề mặt plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | Không     | `object`                     | Các gợi ý trình bày tùy chọn cho bề mặt danh mục plugin. Siêu dữ liệu này không cài đặt, bật hoặc cấp quyền tin cậy cho plugin.                                                                                                                                               |
| `icon`                               | Không     | `string`                     | URL hình ảnh HTTPS dành cho các thẻ trên chợ ứng dụng/danh mục. ClawHub chấp nhận mọi URL `https://` hợp lệ và dùng biểu tượng plugin mặc định khi giá trị này bị bỏ qua hoặc không hợp lệ.                                                                                                         |
| `version`                            | Không     | `string`                     | Phiên bản plugin mang tính thông tin.                                                                                                                                                                                                                                              |
| `uiHints`                            | Không     | `Record<string, object>`     | Nhãn giao diện người dùng, văn bản giữ chỗ và gợi ý về mức độ nhạy cảm cho các trường cấu hình.                                                                                                                                                                                                          |

## tham chiếu catalog

`catalog` cung cấp các gợi ý hiển thị tùy chọn cho trình duyệt Plugin. Máy chủ có thể bỏ qua các gợi ý này. Chúng không bao giờ cài đặt hoặc bật Plugin, cũng không thay đổi hành vi khi chạy hay mức độ tin cậy của Plugin.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Trường     | Kiểu      | Ý nghĩa                                                                    |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Các bề mặt catalog có nên làm nổi bật Plugin này hay không.                |
| `order`    | `number`  | Gợi ý thứ tự hiển thị tăng dần giữa các Plugin được tuyển chọn; giá trị thấp hơn xuất hiện trước. |

## tham chiếu siêu dữ liệu nhà cung cấp tạo nội dung

Các trường siêu dữ liệu nhà cung cấp tạo nội dung mô tả những tín hiệu xác thực tĩnh cho các nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng. OpenClaw đọc các trường này trước khi môi trường chạy của nhà cung cấp được tải, để các công cụ lõi có thể xác định một nhà cung cấp tạo nội dung có khả dụng hay không mà không cần nhập mọi Plugin nhà cung cấp.

Chỉ sử dụng các trường này cho những thông tin khai báo đơn giản, ít tốn tài nguyên. Cơ chế truyền tải, biến đổi yêu cầu, làm mới token, xác thực thông tin xác thực và hành vi tạo nội dung thực tế vẫn thuộc môi trường chạy của Plugin.

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

| Trường                 | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                             |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Không    | `string[]` | Các mã định danh nhà cung cấp bổ sung cần được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo nội dung.                                          |
| `authProviders`        | Không    | `string[]` | Mã định danh của các nhà cung cấp có hồ sơ xác thực đã cấu hình cần được tính là xác thực cho nhà cung cấp tạo nội dung này.                         |
| `configSignals`        | Không    | `object[]` | Các tín hiệu khả dụng chỉ dựa trên cấu hình, ít tốn tài nguyên, dành cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể được cấu hình mà không cần hồ sơ xác thực hay biến môi trường. |
| `authSignals`          | Không    | `object[]` | Các tín hiệu xác thực tường minh. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ mã định danh nhà cung cấp, `aliases` và `authProviders`.        |
| `referenceAudioInputs` | Không    | `boolean`  | Chỉ dành cho tạo video. Đặt thành `true` khi nhà cung cấp chấp nhận tài nguyên âm thanh tham chiếu; nếu không, `video_generate` sẽ ẩn các tham số tham chiếu âm thanh. |

Mỗi mục `configSignals` hỗ trợ:

| Trường           | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                   |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Có       | `string`   | Đường dẫn dấu chấm đến đối tượng cấu hình thuộc sở hữu của Plugin cần kiểm tra, ví dụ `plugins.entries.example.config`.                                                                    |
| `overlayPath`    | Không    | `string`   | Đường dẫn dấu chấm bên trong cấu hình gốc, có đối tượng sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng cho cấu hình theo chức năng như `image`, `video` hoặc `music`.           |
| `overlayMapPath` | Không    | `string`   | Đường dẫn dấu chấm bên trong cấu hình gốc, trong đó từng giá trị đối tượng sẽ phủ lên đối tượng gốc. Dùng cho ánh xạ tài khoản có tên như `accounts`, khi bất kỳ tài khoản đã cấu hình nào cũng đủ điều kiện. |
| `required`       | Không    | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu lực phải có giá trị đã cấu hình. Chuỗi phải khác rỗng; đối tượng và mảng không được rỗng.                                                    |
| `requiredAny`    | Không    | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                                             |
| `mode`           | Không    | `object`   | Điều kiện bảo vệ chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng khi khả năng sẵn có chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                                             |

Mỗi điều kiện bảo vệ `mode` hỗ trợ:

| Trường       | Bắt buộc | Kiểu       | Ý nghĩa                                                                                 |
| ------------ | -------- | ---------- | --------------------------------------------------------------------------------------- |
| `path`       | Không    | `string`   | Đường dẫn dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.                     |
| `default`    | Không    | `string`   | Giá trị chế độ được dùng khi cấu hình bỏ qua đường dẫn.                                 |
| `allowed`    | Không    | `string[]` | Nếu có mặt, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.           |
| `disallowed` | Không    | `string[]` | Nếu có mặt, tín hiệu không đạt khi chế độ hiệu lực là một trong các giá trị này.         |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                                                        |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Có       | `string` | Mã định danh nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                                   |
| `providerBaseUrl` | Không    | `object` | Điều kiện bảo vệ tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu sử dụng URL cơ sở được cho phép. Dùng khi bí danh xác thực chỉ hợp lệ với một số API nhất định. |

Mỗi điều kiện bảo vệ `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                               |
| ----------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string`   | Mã định danh cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                     |
| `defaultBaseUrl`  | Không    | `string`   | URL cơ sở được giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                    |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp với một trong các giá trị đã chuẩn hóa này. |

## tham chiếu siêu dữ liệu công cụ

`toolMetadata` sử dụng cùng cấu trúc `configSignals` và `authSignals` như siêu dữ liệu nhà cung cấp tạo nội dung, với khóa là tên công cụ. `contracts.tools` khai báo quyền sở hữu. `toolMetadata` khai báo bằng chứng khả dụng đơn giản, ít tốn tài nguyên, để OpenClaw có thể tránh nhập môi trường chạy của Plugin chỉ để hàm tạo công cụ trả về `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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

Ngoài các trường `configSignals`/`authSignals` dùng chung ở trên, các mục `toolMetadata` còn chấp nhận `optional` (đánh dấu công cụ là không bắt buộc để kích hoạt Plugin) và `replaySafe` (đánh dấu việc thực thi công cụ là an toàn để lặp lại sau một lượt mô hình chưa hoàn tất).

Nếu một công cụ không có `toolMetadata`, OpenClaw giữ nguyên hành vi hiện có và tải Plugin sở hữu khi hợp đồng công cụ phù hợp với chính sách. Đối với các công cụ trên đường dẫn nóng có hàm tạo phụ thuộc vào xác thực/cấu hình, tác giả Plugin nên khai báo `toolMetadata` thay vì khiến lõi nhập môi trường chạy để truy vấn.

## tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn trong quá trình thiết lập ban đầu hoặc xác thực. OpenClaw đọc mục này trước khi môi trường chạy của nhà cung cấp được tải. Danh sách thiết lập nhà cung cấp sử dụng các lựa chọn trong tệp kê khai này, các lựa chọn thiết lập được suy ra từ bộ mô tả và siêu dữ liệu catalog cài đặt mà không cần tải môi trường chạy của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                                                  | Ý nghĩa                                                                                                                     |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                                              | ID nhà cung cấp mà lựa chọn này thuộc về.                                                                                   |
| `method`              | Có       | `string`                                                              | ID phương thức xác thực để điều phối đến.                                                                                   |
| `choiceId`            | Có       | `string`                                                              | ID lựa chọn xác thực ổn định được dùng trong các luồng hướng dẫn ban đầu và CLI.                                            |
| `choiceLabel`         | Không    | `string`                                                              | Nhãn hiển thị cho người dùng. Nếu bị lược bỏ, OpenClaw sẽ dùng `choiceId` làm phương án dự phòng.                           |
| `choiceHint`          | Không    | `string`                                                              | Văn bản trợ giúp ngắn cho bộ chọn.                                                                                          |
| `assistantPriority`   | Không    | `number`                                                              | Giá trị thấp hơn được sắp xếp trước trong các bộ chọn tương tác do trợ lý điều khiển.                                       |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                                        | Ẩn lựa chọn khỏi các bộ chọn của trợ lý nhưng vẫn cho phép chọn thủ công qua CLI.                                           |
| `deprecatedChoiceIds` | Không    | `string[]`                                                            | Các ID lựa chọn cũ cần chuyển hướng người dùng đến lựa chọn thay thế này.                                                   |
| `groupId`             | Không    | `string`                                                              | ID nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                                            |
| `groupLabel`          | Không    | `string`                                                              | Nhãn hiển thị cho người dùng của nhóm đó.                                                                                   |
| `groupHint`           | Không    | `string`                                                              | Văn bản trợ giúp ngắn cho nhóm.                                                                                             |
| `onboardingFeatured`  | Không    | `boolean`                                                             | Hiển thị nhóm này ở tầng nổi bật của bộ chọn hướng dẫn ban đầu tương tác, trước mục "Thêm...".                              |
| `optionKey`           | Không    | `string`                                                              | Khóa tùy chọn nội bộ cho các luồng xác thực đơn giản chỉ dùng một cờ.                                                       |
| `cliFlag`             | Không    | `string`                                                              | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                                           |
| `cliOption`           | Không    | `string`                                                              | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                                       |
| `cliDescription`      | Không    | `string`                                                              | Mô tả được dùng trong phần trợ giúp CLI.                                                                                    |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Các bề mặt hướng dẫn ban đầu mà lựa chọn này cần xuất hiện. Nếu bị lược bỏ, giá trị mặc định là `["text-inference"]`.      |

## Tham chiếu `commandAliases`

Dùng `commandAliases` khi một plugin sở hữu tên lệnh thời gian chạy mà người dùng có thể nhầm lẫn đưa vào `plugins.allow` hoặc cố chạy dưới dạng lệnh CLI gốc. OpenClaw dùng siêu dữ liệu này cho mục đích chẩn đoán mà không cần nhập mã thời gian chạy của plugin.

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

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                                 |
| ------------ | -------- | ----------------- | --------------------------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về plugin này.                                                           |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong cuộc trò chuyện thay vì lệnh CLI gốc.         |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để đề xuất cho các thao tác CLI, nếu có.                         |

## Tham chiếu `activation`

Dùng `activation` khi plugin có thể khai báo với chi phí thấp những sự kiện thuộc mặt phẳng điều khiển nào cần đưa plugin đó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu cho bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký hành vi thời gian chạy, không thay thế `register(...)` và không đảm bảo rằng mã plugin đã được thực thi. Bộ lập kế hoạch kích hoạt dùng các trường này để thu hẹp danh sách plugin ứng viên trước khi quay về dùng siêu dữ liệu quyền sở hữu hiện có trong manifest như `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và các hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Dùng `providers`, `channels`, `commandAliases`, các bộ mô tả thiết lập hoặc `contracts` khi những trường đó biểu đạt được mối quan hệ. Dùng `activation` cho các gợi ý bổ sung dành cho bộ lập kế hoạch mà những trường quyền sở hữu đó không thể biểu diễn. Dùng `cliBackends` cấp cao nhất cho các bí danh thời gian chạy CLI như `claude-cli`, `my-cli` hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho các ID khung chạy tác tử nhúng chưa có trường quyền sở hữu tương ứng.

Mỗi plugin nên chủ động đặt `activation.onStartup`. Chỉ đặt thành `true` khi plugin phải chạy trong quá trình khởi động Gateway. Đặt thành `false` khi plugin không hoạt động lúc khởi động và chỉ nên tải từ các điều kiện kích hoạt hẹp hơn. Việc bỏ qua `onStartup` không còn khiến plugin được tải ngầm khi khởi động; hãy dùng siêu dữ liệu kích hoạt tường minh cho các điều kiện kích hoạt khi khởi động, theo kênh, theo cấu hình, theo khung chạy tác tử, theo bộ nhớ hoặc các điều kiện hẹp hơn khác.

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

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                                    |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt tường minh khi khởi động Gateway. Mỗi plugin nên đặt trường này. `true` nhập plugin trong quá trình khởi động; `false` giữ plugin ở trạng thái tải lười khi khởi động, trừ khi điều kiện khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Các ID nhà cung cấp cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                         |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các ID thời gian chạy của khung chạy tác tử nhúng cần đưa plugin này vào kế hoạch kích hoạt/tải. Dùng `cliBackends` cấp cao nhất cho các bí danh phần phụ trợ CLI.                                          |
| `onCommands`       | Không    | `string[]`                                           | Các ID lệnh cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                  |
| `onChannels`       | Không    | `string[]`                                           | Các ID kênh cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                  |
| `onRoutes`         | Không    | `string[]`                                           | Các loại tuyến cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                              |
| `onConfigPaths`    | Không    | `string[]`                                           | Các đường dẫn cấu hình tương đối với thư mục gốc cần đưa plugin này vào kế hoạch khởi động/tải khi đường dẫn tồn tại và không bị vô hiệu hóa tường minh.                                                    |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Các gợi ý khả năng tổng quát được dùng khi lập kế hoạch kích hoạt thuộc mặt phẳng điều khiển. Khi có thể, hãy ưu tiên các trường hẹp hơn.                                                                    |

Các thành phần đang sử dụng trực tiếp:

- Việc lập kế hoạch khởi động Gateway dùng `activation.onStartup` để nhập tường minh khi khởi động.
- Việc lập kế hoạch CLI được kích hoạt bởi lệnh sẽ quay về dùng `commandAliases[].cliCommand` hoặc `commandAliases[].name` cũ.
- Việc lập kế hoạch khởi động thời gian chạy tác tử dùng `activation.onAgentHarnesses` cho các khung chạy nhúng và `cliBackends[]` cấp cao nhất cho các bí danh thời gian chạy CLI.
- Việc lập kế hoạch thiết lập/kênh được kích hoạt bởi kênh sẽ quay về dùng quyền sở hữu `channels[]` cũ khi thiếu siêu dữ liệu kích hoạt kênh tường minh.
- Việc lập kế hoạch plugin khi khởi động dùng `activation.onConfigPaths` cho các bề mặt cấu hình gốc không thuộc kênh, chẳng hạn như khối `browser` của plugin trình duyệt đi kèm.
- Việc lập kế hoạch thiết lập/thời gian chạy được kích hoạt bởi nhà cung cấp sẽ quay về dùng quyền sở hữu `providers[]` cũ và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu kích hoạt nhà cung cấp tường minh.

Chẩn đoán của bộ lập kế hoạch có thể phân biệt các gợi ý kích hoạt tường minh với phương án dự phòng dựa trên quyền sở hữu trong manifest. Ví dụ, `activation-command-hint` nghĩa là `activation.onCommands` đã khớp, còn `manifest-command-alias` nghĩa là bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases`. Các nhãn lý do này dành cho hoạt động chẩn đoán của máy chủ và kiểm thử; tác giả plugin nên tiếp tục khai báo siêu dữ liệu mô tả quyền sở hữu chính xác nhất.

## Tham chiếu `qaRunners`

Dùng `qaRunners` khi một plugin đóng góp một hoặc nhiều trình chạy phương thức truyền tải bên dưới
lệnh gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này gọn nhẹ và tĩnh; thời gian chạy
của plugin vẫn sở hữu việc đăng ký CLI thực tế thông qua bề mặt
`runtime-api.ts` gọn nhẹ, xuất các `qaRunnerCliRegistrations` tương ứng. Một
`adapterFactory` tùy chọn cung cấp phương thức truyền tải cho các kịch bản QA dùng chung mà không
thay đổi trình chạy của lệnh đã đăng ký.

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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                                                         |
| ------------- | -------- | -------- | ----------------------------------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.                                       |
| `description` | Không    | `string` | Văn bản trợ giúp dự phòng được dùng khi máy chủ dùng chung cần một lệnh giả lập.                |

Id `adapterFactory` phải khớp với `commandName`. Không xuất các đăng ký
cho những lệnh không có trong manifest.

## tham chiếu setup

Sử dụng `setup` khi các bề mặt thiết lập và hướng dẫn ban đầu cần siêu dữ liệu chi phí thấp do plugin sở hữu trước khi runtime tải.

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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI. `setup.cliBackends` là bề mặt bộ mô tả dành riêng cho thiết lập đối với các luồng mặt phẳng điều khiển/thiết lập chỉ nên sử dụng siêu dữ liệu.

Khi có mặt, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên theo hướng bộ mô tả cho việc khám phá thiết lập. Nếu bộ mô tả chỉ thu hẹp plugin ứng viên và quá trình thiết lập vẫn cần các hook runtime phong phú hơn tại thời điểm thiết lập, hãy đặt `requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi dự phòng.

OpenClaw cũng đưa `setup.providers[].envVars` vào các phép tra cứu biến môi trường và xác thực nhà cung cấp dùng chung. `providerAuthEnvVars` vẫn được hỗ trợ thông qua bộ điều hợp tương thích trong thời gian ngừng hỗ trợ dần, nhưng các plugin không được đóng gói vẫn sử dụng nó sẽ nhận được chẩn đoán manifest. Các plugin mới nên đặt siêu dữ liệu biến môi trường cho thiết lập/trạng thái tại `setup.providers[].envVars`.

Sử dụng `providerUsageAuthEnvVars` khi thông tin xác thực ở cấp thanh toán hoặc tổ chức phải kích hoạt `resolveUsageAuth` mà không trở thành thông tin xác thực suy luận. Những tên này được đưa vào cơ chế chặn dotenv của workspace, loại bỏ khỏi tiến trình con ACP, lọc bí mật trong sandbox và làm sạch bí mật trên diện rộng. Runtime của nhà cung cấp vẫn đọc và phân loại giá trị bên trong `resolveUsageAuth`.

OpenClaw cũng có thể suy ra các lựa chọn thiết lập đơn giản từ `setup.providers[].authMethods` khi không có mục nhập thiết lập, hoặc khi `setup.requiresRuntime: false` khai báo rằng runtime thiết lập là không cần thiết. Các mục nhập `providerAuthChoices` tường minh vẫn được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi hướng dẫn ban đầu và siêu dữ liệu trợ lý.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó đủ cho bề mặt thiết lập. OpenClaw coi giá trị `false` tường minh là hợp đồng chỉ dùng bộ mô tả và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` để tra cứu thiết lập. Nếu một plugin chỉ dùng bộ mô tả vẫn phân phối một trong các mục nhập runtime thiết lập đó, OpenClaw sẽ báo chẩn đoán bổ sung và tiếp tục bỏ qua mục nhập. Việc bỏ qua `requiresRuntime` duy trì hành vi dự phòng cũ để các plugin hiện có đã thêm bộ mô tả mà không có cờ này không bị hỏng.

Vì việc tra cứu thiết lập có thể thực thi mã `setup-api` do plugin sở hữu, các giá trị `setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy nhất trong tất cả plugin được phát hiện. Quyền sở hữu không rõ ràng sẽ đóng khi lỗi thay vì chọn một bên thắng dựa trên thứ tự phát hiện.

Khi runtime thiết lập được thực thi, chẩn đoán sổ đăng ký thiết lập sẽ báo độ lệch bộ mô tả nếu `setup-api` đăng ký một nhà cung cấp hoặc backend CLI mà bộ mô tả manifest không khai báo, hoặc nếu một bộ mô tả không có đăng ký runtime tương ứng. Các chẩn đoán này mang tính bổ sung và không từ chối plugin cũ.

### tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                    |
| -------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `id`           | Có      | `string`   | Id nhà cung cấp được hiển thị trong quá trình thiết lập hoặc hướng dẫn ban đầu. Giữ các id đã chuẩn hóa duy nhất trên toàn cục. |
| `authMethods`  | Không   | `string[]` | Các id phương thức thiết lập/xác thực mà nhà cung cấp này hỗ trợ mà không cần tải toàn bộ runtime.         |
| `envVars`      | Không   | `string[]` | Các biến môi trường mà bề mặt thiết lập/trạng thái dùng chung có thể kiểm tra trước khi runtime plugin tải. |
| `authEvidence` | Không   | `object[]` | Các phép kiểm tra bằng chứng xác thực cục bộ chi phí thấp cho nhà cung cấp có thể xác thực qua dấu hiệu không bí mật. |

`authEvidence` dành cho các dấu hiệu thông tin xác thực cục bộ do nhà cung cấp sở hữu, có thể được xác minh mà không cần tải mã runtime. Những phép kiểm tra này phải có chi phí thấp và chỉ thực hiện cục bộ: không gọi mạng, không đọc chuỗi khóa hoặc trình quản lý bí mật, không chạy lệnh shell và không thăm dò API nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                           |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | Có      | `string`   | Hiện tại là `local-file-with-env`.                                                                                |
| `fileEnvVar`       | Không   | `string`   | Biến môi trường chứa đường dẫn tệp thông tin xác thực tường minh.                                                 |
| `fallbackPaths`    | Không   | `string[]` | Các đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` không có hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không   | `string[]` | Ít nhất một biến môi trường được liệt kê phải không rỗng thì bằng chứng mới hợp lệ.                               |
| `requiresAllEnv`   | Không   | `string[]` | Mọi biến môi trường được liệt kê đều phải không rỗng thì bằng chứng mới hợp lệ.                                  |
| `credentialMarker` | Có      | `string`   | Dấu hiệu không bí mật được trả về khi có bằng chứng.                                                              |
| `source`           | Không   | `string`   | Nhãn nguồn hiển thị cho người dùng trong đầu ra xác thực/trạng thái.                                              |

### các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Không   | `object[]` | Các bộ mô tả thiết lập nhà cung cấp được hiển thị trong quá trình thiết lập và hướng dẫn ban đầu.        |
| `cliBackends`      | Không   | `string[]` | Các id backend tại thời điểm thiết lập dùng cho tra cứu thiết lập theo hướng bộ mô tả. Giữ các id đã chuẩn hóa duy nhất trên toàn cục. |
| `configMigrations` | Không   | `string[]` | Các id di chuyển cấu hình thuộc sở hữu của bề mặt thiết lập của plugin này.                              |
| `requiresRuntime`  | Không   | `boolean`  | Liệu thiết lập có còn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                        |

## tham chiếu uiHints

`uiHints` là ánh xạ từ tên trường cấu hình đến các gợi ý kết xuất nhỏ. Khóa có thể dùng dấu chấm cho các trường cấu hình lồng nhau, nhưng không đoạn đường dẫn nào được là `__proto__`, `constructor` hoặc `prototype`; quá trình thiết lập sẽ từ chối các tên đó.

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
| `label`       | `string`   | Nhãn trường hiển thị cho người dùng.         |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                       |
| `tags`        | `string[]` | Các thẻ giao diện người dùng tùy chọn.       |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.                 |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.     |
| `placeholder` | `string`   | Văn bản giữ chỗ cho các trường nhập biểu mẫu. |

## tham chiếu contracts

Chỉ sử dụng `contracts` cho siêu dữ liệu quyền sở hữu khả năng tĩnh mà OpenClaw có thể đọc mà không cần nhập runtime của plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Mỗi danh sách đều là tùy chọn:

| Trường                            | Kiểu       | Ý nghĩa                                                                                                                                |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Các mã định danh factory tiện ích mở rộng app-server của Codex, hiện là `codex-app-server`.                                           |
| `agentToolResultMiddleware`      | `string[]` | Các mã định danh runtime mà Plugin này có thể đăng ký middleware kết quả công cụ.                                                     |
| `trustedToolPolicies`            | `string[]` | Các mã định danh chính sách tin cậy cục bộ trước khi chạy công cụ mà một Plugin đã cài đặt có thể đăng ký. Các Plugin đi kèm có thể đăng ký chính sách mà không cần trường này. |
| `externalAuthProviders`          | `string[]` | Các mã định danh nhà cung cấp có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.                                                  |
| `embeddingProviders`             | `string[]` | Các mã định danh nhà cung cấp embedding chung do Plugin này sở hữu để tái sử dụng cho việc tạo embedding vectơ, bao gồm cả bộ nhớ.    |
| `speechProviders`                | `string[]` | Các mã định danh nhà cung cấp giọng nói do Plugin này sở hữu.                                                                         |
| `realtimeTranscriptionProviders` | `string[]` | Các mã định danh nhà cung cấp phiên âm theo thời gian thực do Plugin này sở hữu.                                                      |
| `realtimeVoiceProviders`         | `string[]` | Các mã định danh nhà cung cấp giọng nói theo thời gian thực do Plugin này sở hữu.                                                     |
| `memoryEmbeddingProviders`       | `string[]` | Các mã định danh nhà cung cấp embedding dành riêng cho bộ nhớ đã lỗi thời do Plugin này sở hữu.                                      |
| `mediaUnderstandingProviders`    | `string[]` | Các mã định danh nhà cung cấp hiểu nội dung đa phương tiện do Plugin này sở hữu.                                                     |
| `transcriptSourceProviders`      | `string[]` | Các mã định danh nhà cung cấp nguồn bản chép lời do Plugin này sở hữu.                                                               |
| `documentExtractors`             | `string[]` | Các mã định danh nhà cung cấp trích xuất tài liệu (ví dụ: PDF) do Plugin này sở hữu.                                                  |
| `imageGenerationProviders`       | `string[]` | Các mã định danh nhà cung cấp tạo hình ảnh do Plugin này sở hữu.                                                                     |
| `videoGenerationProviders`       | `string[]` | Các mã định danh nhà cung cấp tạo video do Plugin này sở hữu.                                                                        |
| `musicGenerationProviders`       | `string[]` | Các mã định danh nhà cung cấp tạo nhạc do Plugin này sở hữu.                                                                         |
| `webContentExtractors`           | `string[]` | Các mã định danh nhà cung cấp trích xuất nội dung trang web do Plugin này sở hữu.                                                    |
| `webFetchProviders`              | `string[]` | Các mã định danh nhà cung cấp tìm nạp web do Plugin này sở hữu.                                                                      |
| `webSearchProviders`             | `string[]` | Các mã định danh nhà cung cấp tìm kiếm web do Plugin này sở hữu.                                                                     |
| `workerProviders`                | `string[]` | Các mã định danh nhà cung cấp worker đám mây do Plugin này sở hữu để cấp phát và quản lý vòng đời hợp đồng thuê dựa trên hồ sơ.       |
| `usageProviders`                 | `string[]` | Các mã định danh nhà cung cấp có hook xác thực mức sử dụng và ảnh chụp mức sử dụng do Plugin này sở hữu.                             |
| `migrationProviders`             | `string[]` | Các mã định danh nhà cung cấp nhập dữ liệu do Plugin này sở hữu cho `openclaw migrate`.                                               |
| `gatewayMethodDispatch`          | `string[]` | Quyền dành riêng cho các tuyến HTTP Plugin đã xác thực có điều phối phương thức Gateway trong cùng tiến trình.                        |
| `tools`                          | `string[]` | Tên các công cụ agent do Plugin này sở hữu.                                                                                           |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng chỉ dành cho app-server Codex đi kèm. Thay vào đó, các phép biến đổi kết quả công cụ đi kèm nên khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng `api.registerAgentToolResultMiddleware(...)`. Các Plugin đã cài đặt chỉ có thể sử dụng cùng điểm nối middleware này khi được bật rõ ràng và chỉ cho các runtime mà chúng khai báo trong `contracts.agentToolResultMiddleware`.

Các Plugin đã cài đặt cần tầng chính sách tin cậy của máy chủ trước khi chạy công cụ phải khai báo từng mã định danh cục bộ đã đăng ký trong `contracts.trustedToolPolicies` và được bật rõ ràng. Các Plugin đi kèm tiếp tục sử dụng đường dẫn chính sách tin cậy hiện có, nhưng những Plugin đã cài đặt có mã định danh chính sách chưa khai báo sẽ bị từ chối trước khi đăng ký. Mã định danh chính sách có phạm vi theo Plugin đăng ký, vì vậy hai Plugin đều có thể khai báo và đăng ký `workflow-budget`; một Plugin không thể đăng ký cùng một mã định danh cục bộ hai lần.

Các đăng ký `api.registerTool(...)` trong runtime phải khớp với `contracts.tools`. Quá trình khám phá công cụ sử dụng danh sách này để chỉ tải các runtime Plugin có thể sở hữu những công cụ được yêu cầu.

Các Plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo `contracts.externalAuthProviders`; các hook xác thực bên ngoài chưa khai báo sẽ bị bỏ qua.

Các Plugin nhà cung cấp triển khai cả `resolveUsageAuth` và `fetchUsageSnapshot` nên khai báo từng mã định danh nhà cung cấp được tự động phát hiện trong `contracts.usageProviders`. Quá trình khám phá mức sử dụng đọc hợp đồng này trước khi tải mã runtime, sau đó xác minh cả hai hook sau khi chỉ tải các chủ sở hữu đã khai báo.

Các nhà cung cấp embedding chung nên khai báo `contracts.embeddingProviders` cho từng bộ chuyển đổi được đăng ký bằng `api.registerEmbeddingProvider(...)`. Sử dụng hợp đồng chung cho việc tạo vectơ có thể tái sử dụng, bao gồm các nhà cung cấp được tìm kiếm bộ nhớ sử dụng. `contracts.memoryEmbeddingProviders` là khả năng tương thích dành riêng cho embedding bộ nhớ đã lỗi thời và chỉ được duy trì trong khi các nhà cung cấp hiện có chuyển sang điểm nối nhà cung cấp embedding chung.

Các nhà cung cấp worker phải khai báo từng mã định danh `api.registerWorkerProvider(...)` trong `contracts.workerProviders`. Lõi lưu ý định bền vững trước khi gọi `provision`; các nhà cung cấp xác thực cài đặt của họ trước khi cấp phát bên ngoài, và các lệnh gọi lặp lại với cùng mã định danh thao tác phải tiếp nhận cùng một hợp đồng thuê. Lõi cũng lưu ảnh chụp cài đặt đã xác thực đó và truyền nó cùng `leaseId` đến `inspect({ leaseId, profile })` và `destroy({ leaseId, profile })`, kể cả sau khi hồ sơ có tên được thay đổi hoặc xóa. Việc hủy có tính lũy đẳng, thao tác kiểm tra trả về hợp đóng gồm các trạng thái `active` / `destroyed` / `unknown`, và vật liệu khóa riêng SSH chỉ được tham chiếu thông qua `SecretRef`. Các điểm cuối SSH được cấp phát cũng phải bao gồm một `hostKey` công khai từ đầu ra cấp phát đáng tin cậy, có định dạng chính xác là `algorithm base64`, không có tên máy chủ hoặc chú thích, để lõi có thể ghim máy chủ trước khi kết nối. Các nhà cung cấp tạo tham chiếu danh tính động có thể triển khai `resolveSshIdentity({ leaseId, profile, keyRef })` có thẩm quyền; các nhà cung cấp không triển khai phương thức này sẽ sử dụng bộ phân giải bí mật chung của lõi. Kết quả `unknown` có thẩm quyền sẽ khiến một bản ghi cục bộ đang hoạt động trở thành mồ côi; sau một yêu cầu hủy đã được lưu, kết quả này xác nhận quá trình tháo dỡ.

`contracts.gatewayMethodDispatch` hiện chấp nhận `"authenticated-request"`. Đây là cổng kiểm soát vệ sinh API cho các tuyến HTTP Plugin gốc cố ý điều phối các phương thức mặt phẳng điều khiển Gateway trong cùng tiến trình, không phải môi trường cách ly chống lại Plugin gốc độc hại. Chỉ sử dụng nó cho các bề mặt đi kèm/dành cho người vận hành đã được xem xét chặt chẽ và vốn đã yêu cầu xác thực HTTP của Gateway. Một tuyến có quyền vẫn có thể truy cập được khi việc tiếp nhận công việc gốc của Gateway bị đóng chỉ khi tuyến đó cũng khai báo `auth: "gateway"` và `gatewayRuntimeScopeSurface: "trusted-operator"` dành riêng cho tuyến; các tuyến cùng cấp thông thường của cùng Plugin vẫn nằm sau ranh giới tiếp nhận. Điều này giúp trạng thái tạm ngưng và chức năng tiếp tục vẫn có thể truy cập mà không cấp quyền bỏ qua tiếp nhận cho toàn bộ Plugin. Giữ việc phân tích cú pháp và định hình phản hồi ở phạm vi giới hạn bên ngoài quá trình điều phối; công việc quan trọng hoặc có thay đổi trạng thái phải đi qua cơ chế điều phối phương thức Gateway, nơi sở hữu việc thực thi quy tắc tiếp nhận và phạm vi.

## Tham chiếu configContracts

Sử dụng `configContracts` cho hành vi cấu hình do manifest sở hữu mà các trình trợ giúp lõi chung cần dùng nhưng không phải nhập runtime Plugin: phát hiện cờ nguy hiểm, đích di chuyển `SecretRef` và thu hẹp đường dẫn cấu hình cũ.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Trường                         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Không       | `string[]` | Các đường dẫn cấu hình tương đối từ gốc cho biết có thể áp dụng các phép di chuyển tương thích trong lúc thiết lập của Plugin này. Cho phép các lượt đọc cấu hình runtime chung bỏ qua mọi bề mặt thiết lập Plugin khi cấu hình không bao giờ tham chiếu đến Plugin đó. |
| `compatibilityRuntimePaths`   | Không       | `string[]` | Các đường dẫn tương thích tương đối từ gốc mà Plugin này có thể phục vụ trong runtime trước khi mã Plugin kích hoạt hoàn toàn. Sử dụng trường này cho các bề mặt cũ cần thu hẹp tập ứng viên đi kèm mà không phải nhập mọi runtime Plugin tương thích. |
| `dangerousFlags`              | Không       | `object[]` | Các giá trị cấu hình dạng literal mà `openclaw doctor` nên gắn cờ là không an toàn hoặc nguy hiểm khi được bật. Xem bên dưới.                                                                                                                                   |
| `secretInputs`                | Không       | `object`   | Các đường dẫn cấu hình dưới `plugins.entries.<id>.config` mà sổ đăng ký đích di chuyển/kiểm tra `SecretRef` nên coi là các chuỗi có dạng bí mật. Xem bên dưới.                                                                                  |

Mỗi mục `dangerousFlags` hỗ trợ:

| Trường    | Bắt buộc | Kiểu                                  | Ý nghĩa                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Có      | `string`                              | Đường dẫn cấu hình phân tách bằng dấu chấm, tương đối với `plugins.entries.<id>.config`. Hỗ trợ ký tự đại diện `*` cho các đoạn ánh xạ/mảng. |
| `equals` | Có      | `string \| number \| boolean \| null` | Giá trị literal chính xác đánh dấu giá trị cấu hình này là nguy hiểm.                                                            |

`secretInputs` hỗ trợ:

| Trường                  | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                                                                 |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Không    | `boolean`  | Ghi đè trạng thái bật mặc định của Plugin đi kèm khi xác định bề mặt SecretRef này có đang hoạt động hay không. Sử dụng khi Plugin được đi kèm nhưng bề mặt phải duy trì không hoạt động cho đến khi được bật rõ ràng trong cấu hình. |
| `paths`                 | Có       | `object[]` | Các đường dẫn cấu hình có dạng secret, mỗi đường dẫn gồm `path` (phân tách bằng dấu chấm, tương đối với `plugins.entries.<id>.config`, hỗ trợ ký tự đại diện `*`) và `expected` tùy chọn (hiện chỉ hỗ trợ `"string"`).                 |

## Tham chiếu mediaUnderstandingProviderMetadata

Sử dụng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp khả năng hiểu phương tiện có các mô hình mặc định, mức ưu tiên dự phòng xác thực tự động hoặc khả năng hỗ trợ tài liệu gốc mà các trình trợ giúp lõi dùng chung cần trước khi thời gian chạy được tải. Các khóa cũng phải được khai báo trong `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Mỗi mục nhà cung cấp có thể bao gồm:

| Trường                 | Kiểu                                                             | Ý nghĩa                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Các khả năng phương tiện do nhà cung cấp này cung cấp.                                                                           |
| `defaultModels`        | `Record<string, string>`                                         | Các giá trị mặc định ánh xạ từ khả năng đến mô hình, được dùng khi cấu hình không chỉ định mô hình.                              |
| `autoPriority`         | `Record<string, number>`                                         | Số nhỏ hơn được xếp trước khi tự động dự phòng nhà cung cấp dựa trên thông tin xác thực.                                          |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Các đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                                                                                |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Ghi đè mô hình theo từng loại tài liệu. Đặt `image: false` để tắt trích xuất dựa trên hình ảnh cho loại tài liệu đó.              |

## Tham chiếu channelConfigs

Sử dụng `channelConfigs` khi Plugin kênh cần siêu dữ liệu cấu hình nhẹ trước khi thời gian chạy được tải. Việc khám phá thiết lập/trạng thái kênh ở chế độ chỉ đọc có thể sử dụng trực tiếp siêu dữ liệu này cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc khi `setup.requiresRuntime: false` khai báo rằng thời gian chạy thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu trong manifest của Plugin, không phải một phần cấu hình cấp cao nhất mới dành cho người dùng. Người dùng vẫn cấu hình các phiên bản kênh trong `channels.<channel-id>`. OpenClaw đọc siêu dữ liệu manifest để xác định Plugin nào sở hữu kênh đã cấu hình đó trước khi mã thời gian chạy của Plugin thực thi.

Đối với Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục `channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng lược đồ cấu hình trên đường dẫn nguội, bề mặt thiết lập và Control UI không thể biết hình dạng tùy chọn thuộc sở hữu của kênh cho đến khi thời gian chạy của Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và `nativeSkillsAutoEnabled` có thể khai báo các giá trị mặc định `auto` tĩnh cho những lần kiểm tra cấu hình lệnh chạy trước khi thời gian chạy của kênh được tải. Các kênh đi kèm cũng có thể công bố cùng các giá trị mặc định thông qua `package.json#openclaw.channel.commands` cùng với siêu dữ liệu danh mục kênh khác do gói sở hữu.

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

| Trường        | Kiểu                     | Ý nghĩa                                                                                                                               |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Lược đồ JSON cho `channels.<id>`. Bắt buộc đối với mỗi mục cấu hình kênh được khai báo.                                               |
| `uiHints`     | `Record<string, object>` | Các nhãn/chỗ dành sẵn/gợi ý về dữ liệu nhạy cảm tùy chọn trên giao diện người dùng cho phần cấu hình kênh đó.                         |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt bộ chọn và kiểm tra khi siêu dữ liệu thời gian chạy chưa sẵn sàng.                             |
| `description` | `string`                 | Mô tả ngắn về kênh cho các bề mặt kiểm tra và danh mục.                                                                                |
| `commands`    | `object`                 | Các giá trị tự động mặc định tĩnh cho lệnh gốc và skill gốc, dùng trong kiểm tra cấu hình trước thời gian chạy.                       |
| `preferOver`  | `string[]`               | Các mã định danh Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên được ưu tiên hơn trên các bề mặt lựa chọn.                    |

### Thay thế một Plugin kênh khác

Sử dụng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một mã định danh kênh mà Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến gồm mã định danh Plugin đã được đổi tên, một Plugin độc lập thay thế Plugin đi kèm, hoặc một bản phân nhánh được duy trì vẫn giữ nguyên mã định danh kênh để tương thích cấu hình.

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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả mã định danh kênh và mã định danh Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì nó được đi kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt Plugin đó trong cấu hình thời gian chạy hiệu lực để một Plugin duy nhất sở hữu kênh và các công cụ của kênh. Lựa chọn rõ ràng của người dùng vẫn được ưu tiên: nếu người dùng bật rõ ràng cả hai Plugin (thông qua `plugins.allow` hoặc một cấu hình `plugins.entries` có nội dung thực), OpenClaw giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì âm thầm thay đổi tập hợp Plugin được yêu cầu.

Chỉ dùng `preferOver` cho các mã định danh Plugin thực sự có thể cung cấp cùng một kênh. Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình của người dùng.

## Tham chiếu modelSupport

Sử dụng `modelSupport` khi OpenClaw cần suy luận Plugin nhà cung cấp của bạn từ các mã định danh mô hình dạng rút gọn như `gpt-5.6-sol` hoặc `claude-sonnet-4.6` trước khi thời gian chạy của Plugin được tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên sau:

- các tham chiếu `provider/model` rõ ràng sử dụng siêu dữ liệu manifest `providers` của chủ sở hữu
- `modelPatterns` được ưu tiên hơn `modelPrefixes`
- nếu một Plugin không đi kèm và một Plugin đi kèm đều khớp, Plugin không đi kèm được ưu tiên
- sự mơ hồ còn lại được bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Các tiền tố được đối chiếu bằng `startsWith` với mã định danh mô hình dạng rút gọn.                          |
| `modelPatterns` | `string[]` | Các nguồn biểu thức chính quy được đối chiếu với mã định danh mô hình dạng rút gọn sau khi loại bỏ hậu tố hồ sơ. |

Các mục `modelPatterns` được biên dịch thông qua `compileSafeRegex`, hàm này từ chối những mẫu chứa phép lặp lồng nhau (ví dụ `(a+)+$`). Các mẫu không vượt qua kiểm tra an toàn sẽ bị âm thầm bỏ qua, tương tự biểu thức chính quy không hợp lệ về cú pháp. Hãy giữ các mẫu đơn giản và tránh các bộ định lượng lồng nhau.

## Tham chiếu modelCatalog

Sử dụng `modelCatalog` khi OpenClaw cần biết siêu dữ liệu mô hình của nhà cung cấp trước khi tải thời gian chạy của Plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định, bí danh nhà cung cấp, quy tắc ẩn và chế độ khám phá. Việc làm mới khi chạy vẫn thuộc về mã thời gian chạy của nhà cung cấp, nhưng manifest cho lõi biết khi nào cần thời gian chạy.

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

| Trường           | Kiểu                                                     | Ý nghĩa                                                                                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Các hàng danh mục cho những mã định danh nhà cung cấp do plugin này sở hữu. Các khóa cũng phải xuất hiện trong `providers` cấp cao nhất. |
| `aliases`        | `Record<string, object>`                                 | Các bí danh nhà cung cấp cần được phân giải thành một nhà cung cấp thuộc sở hữu để lập kế hoạch danh mục hoặc loại trừ. |
| `suppressions`   | `object[]`                                               | Các hàng mô hình từ nguồn khác mà plugin này loại trừ vì lý do riêng của nhà cung cấp.                              |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Cho biết có thể đọc danh mục nhà cung cấp từ siêu dữ liệu manifest, làm mới vào bộ nhớ đệm hay cần runtime.           |
| `runtimeAugment` | `boolean`                                                | Chỉ đặt thành `true` khi runtime của nhà cung cấp phải nối thêm các hàng danh mục sau khi lập kế hoạch manifest/cấu hình. |

`aliases` tham gia vào việc tra cứu quyền sở hữu nhà cung cấp để lập kế hoạch danh mục mô hình. Đích của bí danh phải là nhà cung cấp cấp cao nhất do cùng một plugin sở hữu. Khi danh sách được lọc theo nhà cung cấp sử dụng bí danh, OpenClaw có thể đọc manifest sở hữu và áp dụng các giá trị ghi đè API/URL cơ sở của bí danh mà không cần tải runtime của nhà cung cấp. Bí danh không mở rộng các danh sách danh mục chưa lọc; danh sách tổng quát chỉ xuất các hàng của nhà cung cấp chuẩn sở hữu.

`suppressions` thay thế hook `suppressBuiltInModel` cũ trong runtime của nhà cung cấp. Các mục loại trừ chỉ được áp dụng khi nhà cung cấp thuộc sở hữu của plugin hoặc được khai báo là một khóa `modelCatalog.aliases` trỏ đến nhà cung cấp thuộc sở hữu. Các hook loại trừ trong runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường của nhà cung cấp:

| Trường                | Kiểu                     | Ý nghĩa                                                                                                                                                                                                                                 |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL cơ sở mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này.                                                                                                                                                             |
| `api`                 | `ModelApi`               | Bộ điều hợp API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này.                                                                                                                                                       |
| `headers`             | `Record<string, string>` | Các tiêu đề tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.                                                                                                                                                                        |
| `defaultUtilityModel` | `string`                 | Mã định danh mô hình nhỏ tùy chọn do nhà cung cấp đề xuất cho các tác vụ tiện ích nội bộ ngắn (tiêu đề, tường thuật tiến độ). Được dùng khi chưa đặt `agents.defaults.utilityModel` và nhà cung cấp này phục vụ mô hình chính của tác nhân. |
| `models`              | `object[]`               | Các hàng mô hình bắt buộc. Những hàng không có `id` sẽ bị bỏ qua.                                                                                                                                                                       |

Các trường của mô hình:

| Trường             | Kiểu                                                           | Ý nghĩa                                                                                     |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Mã định danh mô hình cục bộ của nhà cung cấp, không có tiền tố `provider/`.                  |
| `name`             | `string`                                                       | Tên hiển thị tùy chọn.                                                                      |
| `api`              | `ModelApi`                                                     | Giá trị ghi đè API tùy chọn cho từng mô hình.                                               |
| `baseUrl`          | `string`                                                       | Giá trị ghi đè URL cơ sở tùy chọn cho từng mô hình.                                         |
| `headers`          | `Record<string, string>`                                       | Các tiêu đề tĩnh tùy chọn cho từng mô hình.                                                 |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Các phương thức đầu vào mà mô hình chấp nhận. Những giá trị khác sẽ bị loại bỏ mà không báo. |
| `reasoning`        | `boolean`                                                      | Mô hình có cung cấp hành vi suy luận hay không.                                             |
| `contextWindow`    | `number`                                                       | Cửa sổ ngữ cảnh nguyên bản của nhà cung cấp.                                                |
| `contextTokens`    | `number`                                                       | Giới hạn ngữ cảnh hiệu dụng tùy chọn trong runtime khi khác với `contextWindow`.             |
| `maxTokens`        | `number`                                                       | Số token đầu ra tối đa khi đã biết.                                                         |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Các giá trị ghi đè mã định danh mô hình hoặc tham số tùy chọn theo từng mức độ suy nghĩ.     |
| `cost`             | `object`                                                       | Giá tùy chọn bằng USD trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.                |
| `compat`           | `object`                                                       | Các cờ tương thích tùy chọn khớp với khả năng tương thích của cấu hình mô hình OpenClaw.     |
| `mediaInput`       | `object`                                                       | Cấu hình đầu vào tùy chọn theo từng phương thức, hiện chỉ dành cho hình ảnh.                 |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái trong danh sách. Chỉ loại trừ khi hàng hoàn toàn không được phép xuất hiện.       |
| `statusReason`     | `string`                                                       | Lý do tùy chọn được hiển thị cùng trạng thái không khả dụng.                                |
| `replaces`         | `string[]`                                                     | Các mã định danh mô hình cục bộ cũ hơn của nhà cung cấp mà mô hình này thay thế.             |
| `replacedBy`       | `string`                                                       | Mã định danh mô hình cục bộ thay thế của nhà cung cấp dành cho các hàng đã lỗi thời.         |
| `tags`             | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc sử dụng.                                             |

Các trường loại trừ:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                                  |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Mã định danh nhà cung cấp của hàng nguồn cần loại trừ. Phải thuộc sở hữu của plugin này hoặc được khai báo là bí danh thuộc sở hữu. |
| `model`                    | `string`   | Mã định danh mô hình cục bộ của nhà cung cấp cần loại trừ.                                                               |
| `reason`                   | `string`   | Thông báo tùy chọn được hiển thị khi hàng đã loại trừ được yêu cầu trực tiếp.                                             |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn gồm các máy chủ URL cơ sở hiệu dụng của nhà cung cấp, bắt buộc phải khớp trước khi áp dụng loại trừ.   |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn gồm các giá trị `api` chính xác trong cấu hình nhà cung cấp, bắt buộc phải khớp trước khi áp dụng loại trừ. |

Không đưa dữ liệu chỉ có trong runtime vào `modelCatalog`. Chỉ sử dụng `static` khi các hàng manifest đủ hoàn chỉnh để danh sách được lọc theo nhà cung cấp và các bề mặt bộ chọn có thể bỏ qua việc khám phá registry/runtime. Sử dụng `refreshable` khi các hàng manifest là dữ liệu khởi tạo có thể liệt kê hoặc phần bổ sung hữu ích, nhưng quá trình làm mới/bộ nhớ đệm có thể thêm nhiều hàng hơn sau đó; bản thân các hàng có thể làm mới không phải là nguồn có thẩm quyền. Sử dụng `runtime` khi OpenClaw phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Sử dụng `modelIdNormalization` để dọn dẹp mã định danh mô hình ít tốn tài nguyên, thuộc quyền sở hữu của nhà cung cấp và phải diễn ra trước khi runtime của nhà cung cấp được tải. Điều này giữ các bí danh như tên mô hình ngắn, mã định danh cũ cục bộ của nhà cung cấp và quy tắc tiền tố proxy trong manifest của plugin sở hữu thay vì trong các bảng lựa chọn mô hình cốt lõi.

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

| Trường                               | Kiểu                    | Ý nghĩa                                                                                              |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Các bí danh chính xác của mã định danh mô hình, không phân biệt chữ hoa chữ thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần xóa trước khi tra cứu bí danh, hữu ích khi nhà cung cấp/mô hình cũ bị lặp.            |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi mã định danh mô hình đã chuẩn hóa chưa chứa `/`.                                |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Các quy tắc tiền tố có điều kiện cho mã định danh trần sau khi tra cứu bí danh, được lập khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Sử dụng `providerEndpoints` để phân loại điểm cuối mà chính sách yêu cầu chung phải biết trước khi runtime của nhà cung cấp được tải. Phần cốt lõi vẫn sở hữu ý nghĩa của từng `endpointClass`; manifest của plugin sở hữu siêu dữ liệu máy chủ và URL cơ sở.

Các plugin nhà cung cấp được chính thức đưa ra bên ngoài bị loại khỏi bản phân phối cốt lõi, vì vậy
manifest của chúng không hiển thị cho đến khi được cài đặt. `providerEndpoints` của chúng
cũng phải được phản chiếu trong `scripts/lib/official-external-provider-catalog.json` để
việc phân loại điểm cuối tiếp tục hoạt động khi không có plugin; một kiểm thử hợp đồng
thực thi yêu cầu phản chiếu này.

Các trường điểm cuối:

| Trường                         | Kiểu       | Ý nghĩa                                                                                               |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp điểm cuối lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native` hoặc `google-vertex`.        |
| `hosts`                        | `string[]` | Các tên máy chủ chính xác ánh xạ tới lớp điểm cuối.                                                   |
| `hostSuffixes`                 | `string[]` | Các hậu tố máy chủ ánh xạ tới lớp điểm cuối. Thêm tiền tố `.` để chỉ khớp hậu tố miền.                |
| `baseUrls`                     | `string[]` | Các URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp điểm cuối.                                |
| `googleVertexRegion`           | `string`   | Khu vực Google Vertex tĩnh dành cho các máy chủ toàn cục khớp chính xác.                              |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các máy chủ khớp để lấy ra tiền tố khu vực Google Vertex.                     |

## Tham chiếu providerRequest

Dùng `providerRequest` cho siêu dữ liệu tương thích yêu cầu có chi phí thấp mà chính sách yêu cầu chung cần dùng nhưng không phải tải môi trường chạy của nhà cung cấp. Giữ việc viết lại tải trọng theo hành vi cụ thể trong các hook môi trường chạy của nhà cung cấp hoặc các trình trợ giúp dùng chung cho họ nhà cung cấp.

```json
{
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

| Trường                | Kiểu         | Ý nghĩa                                                                                                    |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp được dùng cho các quyết định tương thích yêu cầu chung và chẩn đoán.                  |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn dành cho các trình trợ giúp yêu cầu dùng chung.                  |
| `openAICompletions`   | `object`     | Các cờ yêu cầu hoàn thành tương thích với OpenAI, hiện gồm `supportsStreamingUsage`.                       |

## Tham chiếu secretProviderIntegrations

Dùng `secretProviderIntegrations` khi một plugin có thể công bố cấu hình đặt trước của nhà cung cấp thực thi SecretRef có thể tái sử dụng. OpenClaw đọc siêu dữ liệu này trước khi môi trường chạy của plugin được tải, lưu quyền sở hữu plugin trong `secrets.providers.<alias>.pluginIntegration` và để việc phân giải bí mật thực tế cho môi trường chạy SecretRef. Cấu hình đặt trước chỉ được cung cấp cho các plugin đi kèm và các plugin đã cài đặt được phát hiện từ các thư mục gốc cài đặt plugin được quản lý, chẳng hạn như bản cài đặt từ git và ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

Khóa của ánh xạ là mã định danh tích hợp. Nếu bỏ qua `providerAlias`, OpenClaw dùng mã định danh tích hợp làm bí danh nhà cung cấp SecretRef. Bí danh nhà cung cấp phải khớp mẫu bí danh nhà cung cấp SecretRef thông thường, ví dụ `team-secrets` hoặc `onepassword-work`.

Khi người vận hành chọn cấu hình đặt trước, OpenClaw ghi một tham chiếu nhà cung cấp như sau:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Khi khởi động/tải lại, OpenClaw phân giải nhà cung cấp đó bằng cách tải siêu dữ liệu manifest plugin hiện tại, kiểm tra plugin sở hữu đã được cài đặt và đang hoạt động, rồi hiện thực hóa lệnh thực thi từ manifest. Việc vô hiệu hóa hoặc xóa plugin sẽ thu hồi nhà cung cấp đối với các SecretRef đang hoạt động. Người vận hành muốn cấu hình thực thi độc lập vẫn có thể ghi trực tiếp các nhà cung cấp `command`/`args` thủ công.

Hiện chỉ hỗ trợ các cấu hình đặt trước `source: "exec"`. `command` phải là `${node}` và `args[0]` phải là tập lệnh phân giải bắt đầu bằng `./`, có đường dẫn tương đối so với thư mục gốc plugin. Khi khởi động/tải lại, OpenClaw hiện thực hóa nó thành tệp thực thi Node hiện tại và đường dẫn tuyệt đối của tập lệnh bên trong plugin. Các tùy chọn Node như `--require`, `--import`, `--loader`, `--env-file`, `--eval` và `--print` không thuộc hợp đồng cấu hình đặt trước của manifest. Người vận hành cần lệnh không phải Node có thể trực tiếp cấu hình các nhà cung cấp thực thi thủ công độc lập.

OpenClaw suy ra `trustedDirs` cho các cấu hình đặt trước trong manifest từ thư mục gốc plugin và, đối với cấu hình đặt trước `${node}`, từ thư mục chứa tệp thực thi Node hiện tại. Các `trustedDirs` được khai báo trong manifest sẽ bị bỏ qua. Các tùy chọn khác của nhà cung cấp thực thi như `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` và `allowInsecurePath` được chuyển tiếp tới cấu hình nhà cung cấp thực thi SecretRef thông thường.

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá ở mặt phẳng điều khiển trước khi môi trường chạy được tải. Bộ nhớ đệm định giá của Gateway đọc siêu dữ liệu này mà không nhập mã môi trường chạy của nhà cung cấp.

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

| Trường       | Kiểu              | Ý nghĩa                                                                                                                |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt là `false` cho các nhà cung cấp cục bộ/tự lưu trữ không bao giờ được lấy giá từ OpenRouter hoặc LiteLLM.           |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` vô hiệu hóa việc tra cứu OpenRouter cho nhà cung cấp này.                        |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` vô hiệu hóa việc tra cứu LiteLLM cho nhà cung cấp này.                              |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                                          |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Mã định danh nhà cung cấp trong danh mục bên ngoài khi khác với mã định danh nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem các mã định danh mô hình chứa dấu gạch chéo là tham chiếu nhà cung cấp/mô hình lồng nhau, hữu ích cho các nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể bổ sung của mã định danh mô hình trong danh mục bên ngoài. `version-dots` thử các mã định danh phiên bản có dấu chấm như `claude-opus-4.6`. |

### Chỉ mục nhà cung cấp OpenClaw

Chỉ mục nhà cung cấp OpenClaw là siêu dữ liệu xem trước do OpenClaw sở hữu dành cho các nhà cung cấp có plugin có thể chưa được cài đặt. Nó không thuộc manifest plugin. Manifest plugin vẫn là nguồn có thẩm quyền đối với plugin đã cài đặt. Chỉ mục nhà cung cấp là hợp đồng dự phòng nội bộ mà các giao diện chọn mô hình trước khi cài đặt và nhà cung cấp có thể cài đặt trong tương lai sẽ sử dụng khi plugin của nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền của danh mục:

1. Cấu hình người dùng.
2. `modelCatalog` trong manifest plugin đã cài đặt.
3. Bộ nhớ đệm danh mục mô hình từ lần làm mới tường minh.
4. Các hàng xem trước trong Chỉ mục nhà cung cấp OpenClaw.

Chỉ mục nhà cung cấp không được chứa bí mật, trạng thái kích hoạt, hook môi trường chạy hoặc dữ liệu mô hình trực tiếp dành riêng cho tài khoản. Các danh mục xem trước của nó dùng cùng cấu trúc hàng nhà cung cấp `modelCatalog` như manifest plugin, nhưng chỉ nên giới hạn ở siêu dữ liệu hiển thị ổn định, trừ khi các trường bộ điều hợp môi trường chạy như `api`, `baseUrl`, giá hoặc cờ tương thích được chủ ý giữ đồng bộ với manifest plugin đã cài đặt. Các nhà cung cấp có cơ chế khám phá `/models` trực tiếp nên ghi các hàng đã làm mới qua đường dẫn bộ nhớ đệm danh mục mô hình tường minh thay vì để thao tác liệt kê hoặc hướng dẫn thiết lập thông thường gọi API của nhà cung cấp.

Các mục trong Chỉ mục nhà cung cấp cũng có thể chứa siêu dữ liệu plugin có thể cài đặt cho các nhà cung cấp có plugin đã được chuyển ra khỏi lõi hoặc chưa được cài đặt vì lý do khác. Siêu dữ liệu này phản ánh mẫu danh mục kênh: tên gói, đặc tả cài đặt npm, tính toàn vẹn dự kiến và các nhãn lựa chọn xác thực có chi phí thấp là đủ để hiển thị một tùy chọn thiết lập có thể cài đặt. Sau khi plugin được cài đặt, manifest của nó được ưu tiên và mục Chỉ mục nhà cung cấp của nhà cung cấp đó bị bỏ qua.

`openclaw doctor --fix` di chuyển một tập hợp nhỏ, khép kín các khóa khả năng manifest cấp cao nhất cũ vào `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` và `tools`. Không khóa nào trong số này — hoặc bất kỳ danh sách khả năng nào khác — còn được đọc dưới dạng trường manifest cấp cao nhất; quá trình tải manifest thông thường chỉ nhận diện chúng bên dưới `contracts`.

## Manifest so với package.json

Hai tệp phục vụ các mục đích khác nhau:

| Tệp                    | Dùng cho                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực và gợi ý giao diện người dùng phải tồn tại trước khi mã plugin chạy                     |
| `package.json`         | Siêu dữ liệu npm, cài đặt phần phụ thuộc và khối `openclaw` dùng cho điểm vào, điều kiện cài đặt, thiết lập hoặc siêu dữ liệu danh mục               |

Nếu bạn không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc sau:

- nếu OpenClaw phải biết nó trước khi tải mã plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp điểm vào hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến việc khám phá

Một số siêu dữ liệu plugin trước môi trường chạy được chủ ý đặt trong `package.json` bên dưới khối `openclaw` thay vì trong `openclaw.plugin.json`. `openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng plugin OpenClaw; plugin gốc phải dùng `openclaw.plugin.json` cùng với các trường `package.json#openclaw` được hỗ trợ bên dưới.

Các ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Khai báo các điểm vào Plugin gốc. Phải nằm trong thư mục gói Plugin.                                                                                                                                                 |
| `openclaw.runtimeExtensions`                                                               | Khai báo các điểm vào runtime JavaScript đã được dựng cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                                                     |
| `openclaw.setupEntry`                                                                      | Điểm vào gọn nhẹ chỉ dành cho thiết lập, được dùng trong quá trình hướng dẫn ban đầu, khởi động kênh trì hoãn và khám phá trạng thái kênh/SecretRef chỉ đọc. Phải nằm trong thư mục gói Plugin.                         |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo điểm vào thiết lập JavaScript đã được dựng cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại và phải nằm trong thư mục gói Plugin.                                                                  |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh ít tốn tài nguyên, chẳng hạn như nhãn, đường dẫn tài liệu, bí danh và nội dung lựa chọn.                                                                                                   |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu tĩnh về lệnh gốc và giá trị mặc định tự động của skill gốc, được cấu hình, kiểm tra và các bề mặt danh sách lệnh sử dụng trước khi runtime của kênh tải.                                                 |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu của bộ kiểm tra trạng thái đã cấu hình gọn nhẹ, có thể trả lời “thiết lập chỉ qua biến môi trường đã tồn tại chưa?” mà không cần tải toàn bộ runtime của kênh.                                            |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu của bộ kiểm tra trạng thái xác thực đã lưu gọn nhẹ, có thể trả lời “đã có tài khoản nào đăng nhập chưa?” mà không cần tải toàn bộ runtime của kênh.                                                       |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho các Plugin đi kèm và được phát hành bên ngoài.                                                                                                                                             |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt.                                                                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | Phiên bản máy chủ OpenClaw tối thiểu được hỗ trợ, sử dụng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                                                   |
| `openclaw.compat.pluginApi`                                                                | Phạm vi API Plugin OpenClaw tối thiểu mà gói này yêu cầu, sử dụng ngưỡng semver như `>=2026.5.27`.                                                                                                                    |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi tính toàn vẹn dist npm dự kiến, chẳng hạn như `sha512-...`; luồng cài đặt và cập nhật xác minh hiện vật đã tải về dựa trên chuỗi này.                                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép một đường dẫn khôi phục cài đặt lại Plugin đi kèm có phạm vi hẹp khi cấu hình không hợp lệ.                                                                                                                 |
| `openclaw.install.requiredPlatformPackages`                                                | Các bí danh gói npm phải được hiện thực hóa khi ràng buộc nền tảng trong lockfile của chúng khớp với máy chủ hiện tại.                                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép các bề mặt kênh của runtime thiết lập tải trước khi bắt đầu lắng nghe, sau đó trì hoãn toàn bộ Plugin kênh đã cấu hình cho đến khi kích hoạt sau khi bắt đầu lắng nghe.                                       |

Siêu dữ liệu manifest quyết định các lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong quá trình hướng dẫn ban đầu trước khi runtime tải. `package.json#openclaw.install` cho quá trình hướng dẫn ban đầu biết cách tải về hoặc bật Plugin đó khi người dùng chọn một trong các lựa chọn này. Không chuyển các gợi ý cài đặt sang `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải sổ đăng ký manifest đối với các nguồn Plugin không đi kèm. Giá trị không hợp lệ sẽ bị từ chối; giá trị hợp lệ nhưng mới hơn sẽ khiến các Plugin bên ngoài bị bỏ qua trên các máy chủ cũ hơn. Các Plugin nguồn đi kèm được giả định là có cùng phiên bản với bản checkout của máy chủ.

`openclaw.install.requiredPlatformPackages` dành cho các gói npm cung cấp tệp nhị phân gốc bắt buộc thông qua các bí danh tùy chọn dành riêng cho từng nền tảng. Liệt kê tên gói npm thuần cho mọi bí danh nền tảng được hỗ trợ. Trong quá trình cài đặt npm, OpenClaw chỉ xác minh bí danh đã khai báo có ràng buộc trong lockfile khớp với máy chủ hiện tại. Nếu npm báo thành công nhưng bỏ sót bí danh đó, OpenClaw thử lại một lần với bộ nhớ đệm mới và hoàn tác cài đặt nếu bí danh vẫn còn thiếu.

`openclaw.compat.pluginApi` được thực thi trong quá trình cài đặt gói đối với các nguồn Plugin không đi kèm. Sử dụng trường này cho ngưỡng API SDK/runtime Plugin OpenClaw mà gói được dựng dựa trên. Trường này có thể nghiêm ngặt hơn `minHostVersion` khi một gói Plugin cần API mới hơn nhưng vẫn giữ gợi ý cài đặt thấp hơn cho các luồng khác. Theo mặc định, quy trình đồng bộ bản phát hành chính thức của OpenClaw nâng các ngưỡng API Plugin chính thức hiện có lên phiên bản phát hành OpenClaw, nhưng các bản phát hành chỉ dành cho Plugin có thể giữ ngưỡng thấp hơn khi gói chủ ý hỗ trợ các máy chủ cũ hơn. Không chỉ sử dụng phiên bản gói làm hợp đồng tương thích. `peerDependencies.openclaw` vẫn là siêu dữ liệu gói npm; OpenClaw sử dụng hợp đồng `openclaw.compat.pluginApi` để đưa ra quyết định về khả năng tương thích khi cài đặt.

Siêu dữ liệu cài đặt theo nhu cầu chính thức nên sử dụng `clawhubSpec` khi Plugin được phát hành trên ClawHub; quá trình hướng dẫn ban đầu coi đó là nguồn từ xa ưu tiên và ghi lại thông tin hiện vật ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án dự phòng tương thích cho các gói chưa chuyển sang ClawHub.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức nên ghép thông số chính xác với `expectedIntegrity` để luồng cập nhật đóng an toàn nếu hiện vật npm đã tải về không còn khớp với bản phát hành được ghim. Quá trình hướng dẫn ban đầu tương tác vẫn cung cấp các thông số npm từ sổ đăng ký đáng tin cậy, bao gồm tên gói thuần và dist-tag, nhằm bảo đảm khả năng tương thích. Chẩn đoán danh mục có thể phân biệt các nguồn chính xác, thả nổi, được ghim tính toàn vẹn, thiếu tính toàn vẹn, không khớp tên gói và lựa chọn mặc định không hợp lệ. Chẩn đoán cũng cảnh báo khi có `expectedIntegrity` nhưng không có nguồn npm hợp lệ để ghim. Khi có `expectedIntegrity`, luồng cài đặt/cập nhật sẽ thực thi trường này; khi bị bỏ qua, kết quả phân giải sổ đăng ký được ghi lại mà không ghim tính toàn vẹn.

Các Plugin kênh nên cung cấp `openclaw.setupEntry` khi việc quét trạng thái, danh sách kênh hoặc SecretRef cần xác định các tài khoản đã cấu hình mà không tải toàn bộ runtime. Điểm vào thiết lập nên cung cấp siêu dữ liệu kênh cùng các bộ điều hợp cấu hình, trạng thái và bí mật an toàn cho thiết lập; giữ các máy khách mạng, trình lắng nghe Gateway và runtime truyền tải trong điểm vào tiện ích mở rộng chính.

Các trường điểm vào runtime không ghi đè kiểm tra ranh giới gói đối với các trường điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể khiến một đường dẫn `openclaw.extensions` thoát ra ngoài ranh giới trở nên có thể tải được.

`openclaw.install.allowInvalidConfigRecovery` có phạm vi hẹp theo chủ ý. Trường này không làm cho mọi cấu hình hỏng tùy ý đều có thể cài đặt. Hiện tại, nó chỉ cho phép các luồng cài đặt khôi phục từ một số lỗi nâng cấp Plugin đi kèm đã lỗi thời cụ thể, chẳng hạn như thiếu đường dẫn Plugin đi kèm hoặc mục `channels.<id>` đã lỗi thời cho chính Plugin đi kèm đó. Các lỗi cấu hình không liên quan vẫn chặn cài đặt và hướng người vận hành đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là siêu dữ liệu gói dành cho một mô-đun kiểm tra rất nhỏ:

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

Sử dụng trường này khi các luồng thiết lập, doctor, trạng thái hoặc kiểm tra hiện diện chỉ đọc cần một phép thăm dò xác thực có/không ít tốn tài nguyên trước khi toàn bộ Plugin kênh tải. Trạng thái xác thực đã lưu không phải là trạng thái kênh đã cấu hình: không sử dụng siêu dữ liệu này để tự động bật Plugin, sửa chữa các phần phụ thuộc runtime hoặc quyết định liệu runtime của kênh có nên tải hay không. Giá trị export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không định tuyến hàm này qua barrel của toàn bộ runtime kênh.

`openclaw.channel.configuredState` tuân theo cùng cấu trúc cho các phép kiểm tra trạng thái đã cấu hình chỉ qua biến môi trường với chi phí thấp:

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

Sử dụng trường này khi một kênh có thể xác định trạng thái đã cấu hình từ biến môi trường hoặc các đầu vào nhỏ khác không thuộc runtime. Nếu phép kiểm tra cần phân giải toàn bộ cấu hình hoặc runtime kênh thực, hãy giữ logic đó trong hook `config.hasConfiguredState` của Plugin.

## Thứ tự ưu tiên khám phá (id Plugin trùng lặp)

OpenClaw khám phá Plugin từ ba thư mục gốc, được kiểm tra theo thứ tự sau: các Plugin đi kèm OpenClaw, thư mục gốc cài đặt toàn cục (`~/.openclaw/extensions`) và thư mục gốc của không gian làm việc hiện tại (`<workspace>/.openclaw/extensions`), cùng với mọi mục `plugins.load.paths` được chỉ định rõ ràng.

Nếu hai kết quả khám phá có cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ lại; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì được tải song song. Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn bằng cấu hình** — một đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Bản cài đặt toàn cục khớp với bản ghi cài đặt được theo dõi** — một Plugin được cài đặt qua `openclaw plugin install`/`openclaw plugin update` mà cơ chế theo dõi cài đặt của OpenClaw nhận diện cho cùng id đó, ngay cả khi id này cũng thuộc về một Plugin đi kèm
3. **Đi kèm** — các Plugin được phân phối cùng OpenClaw
4. **Không gian làm việc** — các Plugin được khám phá tương đối với không gian làm việc hiện tại
5. Mọi ứng viên được khám phá khác

Hệ quả:

- Một bản fork hoặc bản sao lỗi thời của Plugin đi kèm nằm ngoài theo dõi trong không gian làm việc hoặc thư mục gốc toàn cục sẽ không che khuất bản dựng đi kèm.
- Để ghi đè một Plugin đi kèm, hãy chạy `openclaw plugin install` cho id đó để bản cài đặt toàn cục được theo dõi có mức ưu tiên cao hơn bản đi kèm, hoặc ghim một đường dẫn cụ thể qua `plugins.entries.<id>` để đường dẫn đó thắng nhờ mức ưu tiên được chọn bằng cấu hình.
- Việc loại bỏ bản trùng lặp được ghi nhật ký để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao đã bị loại bỏ.
- Các trường hợp ghi đè bản trùng lặp được chọn bằng cấu hình được mô tả là ghi đè rõ ràng trong chẩn đoán, nhưng vẫn hiển thị cảnh báo để các bản fork lỗi thời và trường hợp che khuất ngoài ý muốn tiếp tục được nhận biết.

## Yêu cầu về JSON Schema

- **Mỗi plugin phải cung cấp một JSON Schema**, ngay cả khi không chấp nhận cấu hình nào.
- Có thể sử dụng schema rỗng (ví dụ: `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực khi đọc/ghi cấu hình, không phải trong thời gian chạy.
- Khi mở rộng hoặc phân nhánh một plugin đi kèm bằng các khóa cấu hình mới, hãy đồng thời cập nhật `configSchema` trong `openclaw.plugin.json` của plugin đó. Schema của plugin đi kèm được kiểm tra nghiêm ngặt, vì vậy việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi môi trường chạy của plugin được tải.

Ví dụ về phần mở rộng schema:

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

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi mã định danh kênh được khai báo trong tệp kê khai của plugin. Nếu cùng mã định danh đó cũng xuất hiện trong `plugins.allow`, `plugins.entries` hoặc `plugins.installs` (một plugin được tham chiếu nhưng hiện không thể được phát hiện), OpenClaw sẽ hạ mức này xuống thành **cảnh báo**.
- `plugins.entries.<id>`, `plugins.allow` và `plugins.deny` tham chiếu đến mã định danh plugin không xác định sẽ tạo **cảnh báo** ("mục cấu hình lỗi thời bị bỏ qua"), không phải lỗi, để quá trình nâng cấp và các plugin đã bị xóa/đổi tên không ngăn Gateway khởi động.
- `plugins.slots.memory` tham chiếu đến mã định danh plugin không xác định là **lỗi**, ngoại trừ plugin bên ngoài chính thức `memory-lancedb` đã biết, trường hợp này chỉ tạo cảnh báo.
- Nếu một plugin đã được cài đặt nhưng có tệp kê khai hoặc schema bị hỏng hay bị thiếu, quá trình xác thực sẽ thất bại và Doctor sẽ báo cáo lỗi plugin.
- Nếu cấu hình plugin tồn tại nhưng plugin bị **vô hiệu hóa**, cấu hình vẫn được giữ lại và một **cảnh báo** sẽ xuất hiện trong Doctor và nhật ký.

Xem [Tài liệu tham khảo cấu hình](/vi/gateway/configuration) để biết toàn bộ schema `plugins.*`.

## Lưu ý

- Tệp kê khai là **bắt buộc đối với các plugin OpenClaw gốc**, bao gồm cả các plugin được tải từ hệ thống tệp cục bộ. Môi trường chạy vẫn tải riêng mô-đun plugin; tệp kê khai chỉ phục vụ việc phát hiện và xác thực.
- Tệp kê khai gốc được phân tích bằng JSON5, vì vậy chấp nhận chú thích, dấu phẩy cuối và khóa không đặt trong dấu ngoặc kép, miễn là giá trị cuối cùng vẫn là một đối tượng.
- Trình tải tệp kê khai chỉ đọc các trường tệp kê khai đã được lập tài liệu. Tránh sử dụng các khóa cấp cao nhất tùy chỉnh.
- Có thể bỏ qua `channels`, `providers`, `cliBackends` và `skills` nếu plugin không cần đến chúng.
- `providerCatalogEntry` phải luôn gọn nhẹ và không nên nhập mã môi trường chạy có phạm vi rộng; hãy dùng trường này cho siêu dữ liệu danh mục nhà cung cấp tĩnh hoặc các bộ mô tả phát hiện có phạm vi hẹp, không dùng để thực thi trong thời gian xử lý yêu cầu.
- Các loại plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory` (mặc định là `memory-core`), `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định là `legacy`).
- Khai báo loại plugin độc quyền trong tệp kê khai này. `OpenClawPluginDefinition.kind` tại điểm vào môi trường chạy đã bị ngừng khuyến nghị và chỉ còn được giữ làm cơ chế dự phòng tương thích cho các plugin cũ.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã bị ngừng khuyến nghị và `channelEnvVars`) chỉ mang tính khai báo. Các bề mặt chỉ đọc như trạng thái, kiểm tra, xác thực phân phối cron và những bề mặt khác vẫn áp dụng chính sách tin cậy và kích hoạt hiệu lực của plugin trước khi coi một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn trong thời gian chạy cần mã nhà cung cấp, hãy xem [Hook môi trường chạy của nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu plugin của bạn phụ thuộc vào các mô-đun gốc, hãy lập tài liệu về các bước xây dựng và mọi yêu cầu đối với danh sách cho phép của trình quản lý gói (ví dụ: `allow-build-scripts` của pnpm + `pnpm rebuild <package>`).

## Nội dung liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu sử dụng plugin.
  </Card>
  <Card title="Kiến trúc plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình khả năng.
  </Card>
  <Card title="Tổng quan về SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tài liệu tham khảo SDK của plugin và cách nhập từ đường dẫn con.
  </Card>
</CardGroup>
