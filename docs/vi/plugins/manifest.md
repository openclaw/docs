---
read_when:
    - Bạn đang xây dựng một plugin OpenClaw
    - Bạn cần phát hành schema cấu hình Plugin hoặc gỡ lỗi xác thực Plugin
summary: Yêu cầu về manifest Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-07-20T04:28:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7eb8ad70b4f2d5bb94f45f06bb1a9c5ece6be299c0057511cb80c5a70875563f
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này trình bày **manifest plugin OpenClaw gốc**, `openclaw.plugin.json`. Đối với các bố cục gói tương thích (Codex, Claude, Cursor), xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích sử dụng tệp manifest riêng:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json`, hoặc bố cục thành phần Claude mặc định không có manifest
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw tự động phát hiện các bố cục đó nhưng không xác thực chúng theo schema `openclaw.plugin.json` bên dưới. Đối với gói tương thích, OpenClaw đọc siêu dữ liệu gói, các thư mục gốc Skills đã khai báo, thư mục gốc lệnh Claude, giá trị mặc định `settings.json` của Claude, giá trị mặc định LSP của Claude và các gói hook được hỗ trợ khi bố cục đáp ứng kỳ vọng thời gian chạy của OpenClaw.

Mọi plugin OpenClaw gốc **phải** cung cấp `openclaw.plugin.json` trong **thư mục gốc của plugin**. OpenClaw đọc tệp này để xác thực cấu hình **mà không thực thi mã plugin**. Manifest bị thiếu hoặc không hợp lệ sẽ chặn việc xác thực cấu hình và được coi là lỗi plugin.

Xem [Plugin](/vi/tools/plugin) để biết hướng dẫn đầy đủ về hệ thống plugin và [Mô hình khả năng](/vi/plugins/architecture#public-capability-model) để biết mô hình khả năng gốc cùng hướng dẫn hiện tại về khả năng tương thích bên ngoài.

## Chức năng của tệp này

`openclaw.plugin.json` là siêu dữ liệu mà OpenClaw đọc **trước khi tải mã plugin của bạn**. Mọi nội dung trong đó phải đủ nhẹ để kiểm tra mà không cần khởi động thời gian chạy của plugin.

**Sử dụng tệp này cho:**

- danh tính plugin, xác thực cấu hình và gợi ý giao diện người dùng cấu hình
- siêu dữ liệu xác thực, tích hợp ban đầu và thiết lập (bí danh, tự động bật, biến môi trường của nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt mặt phẳng điều khiển
- quyền sở hữu họ mô hình dạng viết tắt
- ảnh chụp tĩnh về quyền sở hữu khả năng (`contracts`)
- siêu dữ liệu trình chạy QA mà máy chủ `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình dành riêng cho kênh được hợp nhất vào danh mục và các bề mặt xác thực

**Không sử dụng tệp này để:** đăng ký hành vi thời gian chạy, khai báo điểm vào mã hoặc siêu dữ liệu cài đặt npm. Những nội dung đó thuộc về mã plugin và `package.json`.

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
  "description": "Plugin nhà cung cấp OpenRouter",
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
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Khóa API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Khóa API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Khóa API",
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

| Trường                               | Bắt buộc | Kiểu                         | Ý nghĩa                                                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có      | `string`                     | Id plugin chuẩn tắc. Đây là id được sử dụng trong `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Có      | `object`                     | JSON Schema nội tuyến cho cấu hình của plugin này.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | Không       | `string[]`                   | Các id plugin cũng phải được cài đặt để plugin này có hiệu lực. Quá trình khám phá vẫn cho phép tải plugin nhưng cảnh báo khi thiếu bất kỳ plugin bắt buộc nào.                                                                                                               |
| `enabledByDefault`                   | Không       | `true`                       | Đánh dấu một plugin đi kèm là được bật theo mặc định. Bỏ qua trường này hoặc đặt thành bất kỳ giá trị nào không phải `true` để plugin vẫn bị tắt theo mặc định.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | Không       | `string[]`                   | Đánh dấu một plugin đi kèm là được bật theo mặc định chỉ trên các nền tảng Node.js được liệt kê, ví dụ `["darwin"]`. Cấu hình tường minh vẫn được ưu tiên.                                                                                                                                   |
| `legacyPluginIds`                    | Không       | `string[]`                   | Các id cũ được chuẩn hóa thành id plugin chuẩn tắc này.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Không       | `string[]`                   | Các id nhà cung cấp sẽ tự động bật plugin này khi thông tin xác thực, cấu hình hoặc tham chiếu mô hình đề cập đến chúng.                                                                                                                                                                            |
| `kind`                               | Không       | `PluginKind \| PluginKind[]` | Khai báo một hoặc nhiều loại plugin độc quyền (`"memory"`, `"context-engine"`) được `plugins.slots.*` sử dụng. Plugin sở hữu cả hai vị trí sẽ khai báo cả hai loại trong cùng một mảng.                                                                                                    |
| `channels`                           | Không       | `string[]`                   | Các id kênh do plugin này sở hữu. Được dùng để khám phá và xác thực cấu hình.                                                                                                                                                                                                |
| `providers`                          | Không       | `string[]`                   | Các id nhà cung cấp do plugin này sở hữu.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | Không       | `string`                     | Đường dẫn mô-đun danh mục nhà cung cấp gọn nhẹ, tương đối với thư mục gốc của plugin, dành cho siêu dữ liệu danh mục nhà cung cấp thuộc phạm vi manifest có thể được tải mà không cần kích hoạt toàn bộ môi trường chạy plugin.                                                                                        |
| `modelSupport`                       | Không       | `object`                     | Siêu dữ liệu họ mô hình dạng viết tắt do manifest sở hữu, được dùng để tự động tải plugin trước môi trường chạy.                                                                                                                                                                                |
| `modelCatalog`                       | Không       | `object`                     | Siêu dữ liệu danh mục mô hình dạng khai báo cho các nhà cung cấp do plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho chức năng liệt kê chỉ đọc, hướng dẫn thiết lập ban đầu, bộ chọn mô hình, bí danh và ngăn hiển thị trong tương lai mà không cần tải môi trường chạy plugin.                                                |
| `modelPricing`                       | Không       | `object`                     | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng chính sách này để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp đến id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong lõi.                                                    |
| `modelIdNormalization`               | Không       | `object`                     | Quy trình dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                                                                                  |
| `providerEndpoints`                  | Không       | `object[]`                   | Siêu dữ liệu máy chủ điểm cuối/baseUrl do manifest sở hữu dành cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                                                   |
| `providerRequest`                    | Không       | `object`                     | Siêu dữ liệu gọn nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung sử dụng trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                                                     |
| `secretProviderIntegrations`         | Không       | `Record<string, object>`     | Các cấu hình đặt trước dạng khai báo cho nhà cung cấp thực thi SecretRef mà các giao diện thiết lập hoặc cài đặt có thể cung cấp mà không mã hóa cứng các tích hợp dành riêng cho nhà cung cấp trong lõi.                                                                                                                            |
| `cliBackends`                        | Không       | `string[]`                   | Các id backend suy luận CLI do plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình tường minh.                                                                                                                                                                |
| `syntheticAuthRefs`                  | Không       | `string[]`                   | Các tham chiếu nhà cung cấp hoặc backend CLI mà hook xác thực tổng hợp do plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình nguội trước khi môi trường chạy được tải.                                                                                                                                     |
| `nonSecretAuthMarkers`               | Không       | `string[]`                   | Các giá trị khóa API giữ chỗ do plugin đi kèm sở hữu, đại diện cho trạng thái thông tin xác thực cục bộ không bí mật, OAuth hoặc từ môi trường xung quanh.                                                                                                                                                       |
| `commandAliases`                     | Không       | `object[]`                   | Các tên lệnh do plugin này sở hữu, cần tạo ra chẩn đoán cấu hình và CLI có nhận biết plugin trước khi môi trường chạy được tải.                                                                                                                                                       |
| `providerUsageAuthEnvVars`           | Không       | `Record<string, string[]>`   | Thông tin xác thực nhà cung cấp chỉ dành cho mức sử dụng/thanh toán. OpenClaw sử dụng các tên này để khám phá mức sử dụng và loại bỏ dữ liệu bí mật, nhưng không bao giờ dùng cho xác thực suy luận.                                                                                                                                  |
| `providerAuthAliases`                | Không       | `Record<string, string>`     | Các id nhà cung cấp sẽ tái sử dụng một id nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                                                                                 |
| `providerAuthChoices`                | Không       | `object[]`                   | Siêu dữ liệu lựa chọn xác thực gọn nhẹ cho bộ chọn thiết lập ban đầu, phân giải nhà cung cấp ưu tiên và liên kết cờ CLI đơn giản.                                                                                                                                                              |
| `activation`                         | Không       | `object`                     | Siêu dữ liệu gọn nhẹ của trình lập kế hoạch kích hoạt để tải theo tác nhân kích hoạt từ khởi động, nhà cung cấp, lệnh, kênh, tuyến và khả năng. Chỉ là siêu dữ liệu; môi trường chạy plugin vẫn sở hữu hành vi thực tế.                                                                                              |
| `setup`                              | Không       | `object`                     | Các bộ mô tả thiết lập/hướng dẫn thiết lập ban đầu gọn nhẹ mà quá trình khám phá và các giao diện thiết lập có thể kiểm tra mà không cần tải môi trường chạy plugin.                                                                                                                                                           |
| `qaRunners`                          | Không       | `object[]`                   | Các bộ mô tả trình chạy QA gọn nhẹ được máy chủ `openclaw qa` dùng chung sử dụng trước khi môi trường chạy plugin được tải.                                                                                                                                                                             |
| `contracts`                          | Không       | `object`                     | Ảnh chụp tĩnh về quyền sở hữu khả năng cho các hook xác thực bên ngoài, embedding, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu nội dung đa phương tiện, tạo hình ảnh/video/nhạc, tìm nạp web, tìm kiếm web, nhà cung cấp worker, trích xuất tài liệu/nội dung web và quyền sở hữu công cụ. |
| `configContracts`                    | Không       | `object`                     | Hành vi cấu hình do manifest sở hữu, được các trình trợ giúp lõi chung sử dụng: phát hiện cờ nguy hiểm, đích di chuyển SecretRef và thu hẹp đường dẫn cấu hình cũ. Xem [tài liệu tham khảo configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Không       | `Record<string, object>`     | Các giá trị mặc định gọn nhẹ về hiểu nội dung đa phương tiện cho các id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Không       | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho việc tạo hình ảnh đối với các ID nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm các bí danh xác thực do nhà cung cấp sở hữu và các biện pháp bảo vệ URL cơ sở.                                                                                                         |
| `videoGenerationProviderMetadata`    | Không       | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho việc tạo video đối với các ID nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm các bí danh xác thực do nhà cung cấp sở hữu và các biện pháp bảo vệ URL cơ sở.                                                                                                         |
| `musicGenerationProviderMetadata`    | Không       | `Record<string, object>`     | Siêu dữ liệu xác thực ít tốn tài nguyên cho việc tạo nhạc đối với các ID nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm các bí danh xác thực do nhà cung cấp sở hữu và các biện pháp bảo vệ URL cơ sở.                                                                                                         |
| `toolMetadata`                       | Không       | `Record<string, object>`     | Siêu dữ liệu về khả năng sử dụng ít tốn tài nguyên cho các công cụ thuộc sở hữu của plugin được khai báo trong `contracts.tools`. Sử dụng siêu dữ liệu này khi công cụ không nên tải môi trường thời gian chạy trừ khi có bằng chứng về cấu hình, biến môi trường hoặc xác thực.                                                                                                  |
| `channelConfigs`                     | Không       | `Record<string, object>`     | Siêu dữ liệu cấu hình kênh thuộc sở hữu của tệp kê khai, được hợp nhất vào các bề mặt khám phá và xác thực trước khi môi trường thời gian chạy tải.                                                                                                                                                                 |
| `skills`                             | Không       | `string[]`                   | Các thư mục Skills cần tải, tính tương đối so với thư mục gốc của plugin.                                                                                                                                                                                                                    |
| `name`                               | Không       | `string`                     | Tên plugin dễ đọc.                                                                                                                                                                                                                                                |
| `description`                        | Không       | `string`                     | Bản tóm tắt ngắn hiển thị trên các bề mặt plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | Không       | `object`                     | Các gợi ý trình bày tùy chọn cho các bề mặt danh mục plugin. Siêu dữ liệu này không cài đặt, bật hoặc cấp độ tin cậy cho plugin.                                                                                                                                               |
| `icon`                               | Không       | `string`                     | URL hình ảnh HTTPS cho các thẻ trên chợ/danh mục. ClawHub chấp nhận mọi URL `https://` hợp lệ và dùng biểu tượng plugin mặc định khi giá trị này bị bỏ qua hoặc không hợp lệ.                                                                                                         |
| `version`                            | Không       | `string`                     | Phiên bản plugin dùng để cung cấp thông tin.                                                                                                                                                                                                                                              |
| `uiHints`                            | Không       | `Record<string, object>`     | Nhãn giao diện người dùng, văn bản giữ chỗ và gợi ý về độ nhạy cảm cho các trường cấu hình.                                                                                                                                                                                                          |

## Tham chiếu catalog

`catalog` cung cấp các gợi ý hiển thị tùy chọn cho trình duyệt plugin. Máy chủ có thể bỏ qua các gợi ý này. Chúng không bao giờ cài đặt hoặc bật plugin, đồng thời không thay đổi hành vi thời gian chạy hoặc mức độ tin cậy của plugin.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Trường      | Kiểu      | Ý nghĩa                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Liệu các bề mặt catalog có nên làm nổi bật plugin này hay không.                       |
| `order`    | `number`  | Gợi ý thứ tự hiển thị tăng dần giữa các plugin được tuyển chọn; giá trị thấp hơn xuất hiện trước. |

## Tham chiếu siêu dữ liệu nhà cung cấp tạo nội dung

Các trường siêu dữ liệu nhà cung cấp tạo nội dung mô tả các tín hiệu xác thực tĩnh cho những nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng. OpenClaw đọc các trường này trước khi thời gian chạy của nhà cung cấp được tải để các công cụ lõi có thể quyết định một nhà cung cấp tạo nội dung có khả dụng hay không mà không cần nhập mọi plugin nhà cung cấp.

Chỉ sử dụng các trường này cho những dữ kiện khai báo có chi phí thấp. Việc truyền tải, chuyển đổi yêu cầu, làm mới token, xác thực thông tin xác thực và hành vi tạo nội dung thực tế vẫn thuộc về thời gian chạy của plugin.

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

| Trường                  | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Không       | `string[]` | Các ID nhà cung cấp bổ sung cần được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo nội dung.                                                       |
| `authProviders`        | Không       | `string[]` | ID của các nhà cung cấp có hồ sơ xác thực đã cấu hình cần được tính là xác thực cho nhà cung cấp tạo nội dung này.                                                      |
| `configSignals`        | Không       | `object[]` | Các tín hiệu khả dụng chỉ dựa trên cấu hình, có chi phí thấp, dành cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể được cấu hình mà không cần hồ sơ xác thực hoặc biến môi trường.                 |
| `authSignals`          | Không       | `object[]` | Các tín hiệu xác thực tường minh. Khi có, chúng thay thế tập tín hiệu mặc định từ ID nhà cung cấp, `aliases` và `authProviders`.                     |
| `referenceAudioInputs` | Không       | `boolean`  | Chỉ dành cho tạo video. Đặt thành `true` khi nhà cung cấp chấp nhận tài nguyên âm thanh tham chiếu; nếu không, `video_generate` sẽ ẩn các tham số tham chiếu âm thanh. |

Mỗi mục `configSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Có      | `string`   | Đường dẫn dấu chấm đến đối tượng cấu hình do plugin sở hữu cần kiểm tra, ví dụ `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | Không       | `string`   | Đường dẫn dấu chấm bên trong cấu hình gốc đến đối tượng cần phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng trường này cho cấu hình dành riêng cho khả năng, chẳng hạn như `image`, `video` hoặc `music`.   |
| `overlayMapPath` | Không       | `string`   | Đường dẫn dấu chấm bên trong cấu hình gốc đến đối tượng mà từng giá trị của nó cần phủ lên đối tượng gốc. Dùng trường này cho các ánh xạ tài khoản có tên như `accounts`, trong đó bất kỳ tài khoản nào đã cấu hình đều đáp ứng điều kiện. |
| `required`       | Không       | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu dụng bắt buộc phải có giá trị đã cấu hình. Chuỗi phải khác rỗng; đối tượng và mảng không được rỗng.                                                  |
| `requiredAny`    | Không       | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu dụng mà ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                                                                    |
| `mode`           | Không       | `object`   | Điều kiện bảo vệ chế độ chuỗi tùy chọn bên trong cấu hình hiệu dụng. Dùng trường này khi khả dụng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                                                                  |

Mỗi điều kiện bảo vệ `mode` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Không       | `string`   | Đường dẫn dấu chấm bên trong cấu hình hiệu dụng. Mặc định là `mode`.                          |
| `default`    | Không       | `string`   | Giá trị chế độ sẽ sử dụng khi cấu hình bỏ qua đường dẫn.                                  |
| `allowed`    | Không       | `string[]` | Nếu có, tín hiệu chỉ đạt khi chế độ hiệu dụng là một trong các giá trị này. |
| `disallowed` | Không       | `string[]` | Nếu có, tín hiệu không đạt khi chế độ hiệu dụng là một trong các giá trị này.       |

Mỗi mục `authSignals` hỗ trợ:

| Trường             | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có      | `string` | ID nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                                                             |
| `providerBaseUrl` | Không       | `object` | Điều kiện bảo vệ tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu sử dụng URL cơ sở được cho phép. Dùng trường này khi bí danh xác thực chỉ hợp lệ với một số API nhất định. |

Mỗi điều kiện bảo vệ `providerBaseUrl` hỗ trợ:

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có      | `string`   | ID cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                                |
| `defaultBaseUrl`  | Không       | `string`   | URL cơ sở được giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Có      | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp với một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu siêu dữ liệu công cụ

`toolMetadata` sử dụng cùng các cấu trúc `configSignals` và `authSignals` như siêu dữ liệu nhà cung cấp tạo nội dung, được lập chỉ mục theo tên công cụ. `contracts.tools` khai báo quyền sở hữu. `toolMetadata` khai báo bằng chứng khả dụng có chi phí thấp để OpenClaw có thể tránh nhập thời gian chạy của plugin chỉ để hàm tạo công cụ của nó trả về `null`.

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

Các mục `toolMetadata` cũng chấp nhận `optional` (đánh dấu công cụ là không bắt buộc để kích hoạt plugin) và `replaySafe` (đánh dấu việc thực thi công cụ là an toàn để lặp lại sau một lượt mô hình chưa hoàn tất), ngoài các trường `configSignals`/`authSignals` dùng chung ở trên.

Nếu một công cụ không có `toolMetadata`, OpenClaw sẽ giữ nguyên hành vi hiện có và tải plugin sở hữu khi hợp đồng công cụ khớp với chính sách. Đối với các công cụ trên đường dẫn nóng có hàm tạo phụ thuộc vào xác thực/cấu hình, tác giả plugin nên khai báo `toolMetadata` thay vì khiến lõi nhập thời gian chạy để truy vấn.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn tiếp nhận ban đầu hoặc xác thực. OpenClaw đọc mục này trước khi thời gian chạy của nhà cung cấp được tải. Danh sách thiết lập nhà cung cấp sử dụng các lựa chọn trong manifest này, các lựa chọn thiết lập được suy ra từ bộ mô tả và siêu dữ liệu catalog cài đặt mà không cần tải thời gian chạy của nhà cung cấp.

| Trường                 | Bắt buộc | Kiểu                                                                  | Ý nghĩa                                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Có      | `string`                                                              | ID nhà cung cấp mà lựa chọn này thuộc về.                                                                       |
| `method`              | Có      | `string`                                                              | ID phương thức xác thực để chuyển tiếp đến.                                                                            |
| `choiceId`            | Có      | `string`                                                              | ID lựa chọn xác thực ổn định được dùng trong các luồng thiết lập ban đầu và CLI.                                                   |
| `choiceLabel`         | Không       | `string`                                                              | Nhãn hiển thị cho người dùng. Nếu bị lược bỏ, OpenClaw sẽ dùng `choiceId`.                                         |
| `choiceHint`          | Không       | `string`                                                              | Văn bản trợ giúp ngắn cho trình chọn.                                                                         |
| `icon`                | Không       | URL HTTPS                                                             | Hình minh họa hiển thị bên cạnh lựa chọn này trong các ứng dụng khách thiết lập ban đầu được hỗ trợ.                                         |
| `website`             | Không       | URL HTTPS                                                             | Trang sản phẩm, đăng nhập hoặc cài đặt được các ứng dụng khách thiết lập ban đầu được hỗ trợ hiển thị.                             |
| `assistantPriority`   | Không       | `number`                                                              | Giá trị thấp hơn được sắp xếp trước trong các trình chọn tương tác do trợ lý điều khiển.                                        |
| `assistantVisibility` | Không       | `"visible"` \| `"manual-only"`                                        | Ẩn lựa chọn khỏi trình chọn của trợ lý nhưng vẫn cho phép chọn thủ công bằng CLI.                         |
| `deprecatedChoiceIds` | Không       | `string[]`                                                            | Các ID lựa chọn cũ cần chuyển hướng người dùng đến lựa chọn thay thế này.                                  |
| `groupId`             | Không       | `string`                                                              | ID nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                           |
| `groupLabel`          | Không       | `string`                                                              | Nhãn hiển thị cho người dùng của nhóm đó.                                                                         |
| `groupHint`           | Không       | `string`                                                              | Văn bản trợ giúp ngắn cho nhóm.                                                                          |
| `onboardingFeatured`  | Không       | `boolean`                                                             | Hiển thị nhóm này trong cấp nổi bật của trình chọn thiết lập ban đầu tương tác, trước mục "More...". |
| `optionKey`           | Không       | `string`                                                              | Khóa tùy chọn nội bộ cho các luồng xác thực đơn giản bằng một cờ.                                                       |
| `cliFlag`             | Không       | `string`                                                              | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                            |
| `cliOption`           | Không       | `string`                                                              | Dạng đầy đủ của tùy chọn CLI, chẳng hạn như `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | Không       | `string`                                                              | Mô tả được dùng trong phần trợ giúp CLI.                                                                             |
| `appGuidedSecret`     | Không       | `boolean`                                                             | Một bí mật được dán cùng các giá trị mặc định của nhà cung cấp là đủ để thiết lập theo hướng dẫn của ứng dụng.                              |
| `appGuidedDiscovery`  | Không       | `boolean`                                                             | Phương thức xác thực thời gian chạy tương ứng sở hữu việc khám phá cục bộ chỉ đọc thông qua `appGuidedSetup`.                 |
| `appGuidedAuth`       | Không       | `"oauth"` \| `"device-code"`                                          | Quy trình đăng nhập tương tác do nhà cung cấp sở hữu mà các ứng dụng khách thiết lập gốc có thể kết xuất theo cách chung.                        |
| `onboardingScopes`    | Không       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Các bề mặt thiết lập ban đầu mà lựa chọn này cần xuất hiện. Nếu bị lược bỏ, giá trị mặc định là `["text-inference"]`.  |

Khi `appGuidedDiscovery` là true, phương thức xác thực tương ứng của nhà cung cấp phải cung cấp
`appGuidedSetup.detect` và `appGuidedSetup.prepare`. Việc phát hiện phải ở chế độ
chỉ đọc: không đăng nhập, kéo mô hình, tải xuống hoặc ghi cấu hình. Bước chuẩn bị sẽ kiểm tra lại
chính xác mô hình đã chọn và trả về một đề xuất cấu hình; OpenClaw kiểm thử trực tiếp
đề xuất đó trong môi trường cô lập và chỉ ghi nhận sau khi thành công.

## Tham chiếu commandAliases

Sử dụng `commandAliases` khi một plugin sở hữu tên lệnh thời gian chạy mà người dùng có thể vô tình đặt vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw sử dụng siêu dữ liệu này để chẩn đoán mà không nhập mã thời gian chạy của plugin.

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

| Trường        | Bắt buộc | Kiểu              | Ý nghĩa                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Có      | `string`          | Tên lệnh thuộc về plugin này.                               |
| `kind`       | Không       | `"runtime-slash"` | Đánh dấu bí danh là một lệnh gạch chéo trong cuộc trò chuyện thay vì một lệnh CLI gốc. |
| `cliCommand` | Không       | `string`          | Lệnh CLI gốc liên quan để đề xuất cho các thao tác CLI, nếu có.  |

## Tham chiếu activation

Sử dụng `activation` khi plugin có thể khai báo với chi phí thấp những sự kiện mặt phẳng điều khiển nào cần đưa plugin vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu của trình lập kế hoạch, không phải API vòng đời. Nó không đăng ký hành vi thời gian chạy, không thay thế `register(...)` và không đảm bảo rằng mã plugin đã được thực thi. Trình lập kế hoạch kích hoạt sử dụng các trường này để thu hẹp các plugin ứng viên trước khi quay về siêu dữ liệu quyền sở hữu manifest hiện có như `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và các hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Sử dụng `providers`, `channels`, `commandAliases`, các bộ mô tả thiết lập hoặc `contracts` khi những trường đó thể hiện mối quan hệ. Sử dụng `activation` cho các gợi ý bổ sung dành cho trình lập kế hoạch mà những trường quyền sở hữu đó không thể biểu diễn. Sử dụng `cliBackends` cấp cao nhất cho các bí danh thời gian chạy CLI như `claude-cli`, `my-cli` hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho các ID bộ khung tác tử nhúng chưa có trường quyền sở hữu.

Mỗi plugin cần chủ động đặt `activation.onStartup`. Chỉ đặt thành `true` khi plugin phải chạy trong quá trình khởi động Gateway. Đặt thành `false` khi plugin không hoạt động lúc khởi động và chỉ nên tải từ các trình kích hoạt hẹp hơn. Việc lược bỏ `onStartup` không còn ngầm tải plugin khi khởi động; hãy sử dụng siêu dữ liệu kích hoạt rõ ràng cho các trình kích hoạt lúc khởi động, kênh, cấu hình, bộ khung tác tử, bộ nhớ hoặc các trình kích hoạt hẹp hơn khác.

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

| Trường              | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không       | `boolean`                                            | Kích hoạt rõ ràng khi Gateway khởi động. Mỗi plugin cần đặt trường này. `true` nhập plugin trong quá trình khởi động; `false` giữ plugin ở trạng thái tải lười khi khởi động, trừ khi một trình kích hoạt khớp khác yêu cầu tải. |
| `onProviders`      | Không       | `string[]`                                           | Các ID nhà cung cấp cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                      |
| `onAgentHarnesses` | Không       | `string[]`                                           | Các ID thời gian chạy của bộ khung tác tử nhúng cần đưa plugin này vào kế hoạch kích hoạt/tải. Sử dụng `cliBackends` cấp cao nhất cho các bí danh backend CLI.                                           |
| `onCommands`       | Không       | `string[]`                                           | Các ID lệnh cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                       |
| `onChannels`       | Không       | `string[]`                                           | Các ID kênh cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                       |
| `onRoutes`         | Không       | `string[]`                                           | Các loại tuyến cần đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                       |
| `onConfigPaths`    | Không       | `string[]`                                           | Các đường dẫn cấu hình tương đối so với gốc cần đưa plugin này vào kế hoạch khởi động/tải khi đường dẫn tồn tại và không bị vô hiệu hóa rõ ràng.                                                      |
| `onCapabilities`   | Không       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Các gợi ý khả năng rộng được dùng trong việc lập kế hoạch kích hoạt của mặt phẳng điều khiển. Ưu tiên các trường hẹp hơn khi có thể.                                                                                     |

Các thành phần đang sử dụng trực tiếp:

- Việc lập kế hoạch khởi động Gateway sử dụng `activation.onStartup` để nhập rõ ràng khi khởi động.
- Việc lập kế hoạch CLI được kích hoạt bằng lệnh sẽ dự phòng về `commandAliases[].cliCommand` hoặc `commandAliases[].name` cũ.
- Việc lập kế hoạch khởi động môi trường chạy agent sử dụng `activation.onAgentHarnesses` cho các harness nhúng và `cliBackends[]` cấp cao nhất cho các bí danh môi trường chạy CLI.
- Việc lập kế hoạch thiết lập/kênh được kích hoạt từ kênh sẽ dự phòng về quyền sở hữu `channels[]` cũ khi thiếu siêu dữ liệu kích hoạt kênh rõ ràng.
- Việc lập kế hoạch Plugin khi khởi động sử dụng `activation.onConfigPaths` cho các bề mặt cấu hình gốc không thuộc kênh, chẳng hạn như khối `browser` của Plugin trình duyệt đi kèm.
- Việc lập kế hoạch thiết lập/môi trường chạy được kích hoạt từ nhà cung cấp sẽ dự phòng về quyền sở hữu `providers[]` cũ và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu kích hoạt nhà cung cấp rõ ràng.

Thông tin chẩn đoán của bộ lập kế hoạch có thể phân biệt các gợi ý kích hoạt rõ ràng với phương án dự phòng dựa trên quyền sở hữu trong manifest. Ví dụ, `activation-command-hint` có nghĩa là `activation.onCommands` đã khớp, còn `manifest-command-alias` có nghĩa là bộ lập kế hoạch đã sử dụng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho chẩn đoán máy chủ và kiểm thử; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu mô tả quyền sở hữu chính xác nhất.

## Tham chiếu qaRunners

Sử dụng `qaRunners` khi một Plugin đóng góp một hoặc nhiều trình chạy phương thức truyền tải bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; môi trường chạy Plugin
vẫn sở hữu việc đăng ký CLI thực tế thông qua một bề mặt `runtime-api.ts`
nhẹ, xuất các `qaRunnerCliRegistrations` tương ứng. Một `adapterFactory`
tùy chọn cung cấp phương thức truyền tải cho các kịch bản QA dùng chung mà không
thay đổi trình chạy của lệnh đã đăng ký.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Chạy lane QA trực tiếp Matrix dựa trên Docker với một homeserver dùng một lần"
    }
  ]
}
```

| Trường         | Bắt buộc | Kiểu     | Ý nghĩa                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Có      | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.    |
| `description` | Không       | `string` | Văn bản trợ giúp dự phòng được sử dụng khi máy chủ dùng chung cần một lệnh giữ chỗ. |

Id `adapterFactory` phải khớp với `commandName`. Không xuất các đăng ký
cho những lệnh không có trong manifest.

## Tham chiếu thiết lập

Sử dụng `setup` khi các bề mặt thiết lập và hướng dẫn ban đầu cần siêu dữ liệu nhẹ thuộc sở hữu Plugin trước khi môi trường chạy tải.

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
            "source": "thông tin xác thực cục bộ của openai"
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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI. `setup.cliBackends` là bề mặt bộ mô tả dành riêng cho thiết lập, dùng cho các luồng mặt phẳng điều khiển/thiết lập chỉ nên sử dụng siêu dữ liệu.

Khi có, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên theo bộ mô tả dành cho việc khám phá thiết lập. Nếu bộ mô tả chỉ thu hẹp Plugin ứng viên và quá trình thiết lập vẫn cần các hook môi trường chạy phong phú hơn tại thời điểm thiết lập, hãy đặt `requiresRuntime: true` và giữ nguyên `setup-api` làm đường dẫn thực thi dự phòng.

OpenClaw đưa `setup.providers[].envVars` vào các tra cứu xác thực nhà cung cấp và biến môi trường chung. Đặt siêu dữ liệu môi trường về thiết lập và trạng thái tại đó.

Sử dụng `providerUsageAuthEnvVars` khi thông tin xác thực ở cấp thanh toán hoặc tổ chức phải kích hoạt `resolveUsageAuth` mà không trở thành thông tin xác thực suy luận. Những tên này được đưa vào cơ chế chặn dotenv của không gian làm việc, loại bỏ khỏi tiến trình con ACP, lọc bí mật trong sandbox và làm sạch bí mật trên diện rộng. Môi trường chạy của nhà cung cấp vẫn đọc và phân loại giá trị bên trong `resolveUsageAuth`.

OpenClaw cũng có thể suy ra các lựa chọn thiết lập đơn giản từ `setup.providers[].authMethods` khi không có mục thiết lập, hoặc khi `setup.requiresRuntime: false` khai báo rằng môi trường chạy thiết lập là không cần thiết. Các mục `providerAuthChoices` rõ ràng vẫn được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi hướng dẫn ban đầu và siêu dữ liệu trợ lý.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó đủ cho bề mặt thiết lập. OpenClaw coi `false` được khai báo rõ ràng là một hợp đồng chỉ dùng bộ mô tả và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` để tra cứu thiết lập. Nếu một Plugin chỉ dùng bộ mô tả vẫn cung cấp một trong các mục môi trường chạy thiết lập đó, OpenClaw sẽ báo cáo một chẩn đoán bổ sung và tiếp tục bỏ qua mục đó. Việc bỏ qua `requiresRuntime` duy trì hành vi dự phòng cũ để các Plugin hiện có đã thêm bộ mô tả mà không có cờ này không bị hỏng.

Vì việc tra cứu thiết lập có thể thực thi mã `setup-api` thuộc sở hữu Plugin, các giá trị `setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy nhất trên toàn bộ các Plugin được phát hiện. Quyền sở hữu không rõ ràng sẽ đóng an toàn thay vì chọn bên thắng dựa trên thứ tự khám phá.

Khi môi trường chạy thiết lập thực sự được thực thi, thông tin chẩn đoán của registry thiết lập sẽ báo cáo sai lệch bộ mô tả nếu `setup-api` đăng ký một nhà cung cấp hoặc backend CLI mà các bộ mô tả trong manifest không khai báo, hoặc nếu một bộ mô tả không có đăng ký môi trường chạy tương ứng. Các chẩn đoán này mang tính bổ sung và không từ chối các Plugin cũ.

### Tham chiếu setup.providers

| Trường          | Bắt buộc | Kiểu       | Ý nghĩa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Có      | `string`   | Id nhà cung cấp được cung cấp trong quá trình thiết lập hoặc hướng dẫn ban đầu. Giữ các id đã chuẩn hóa duy nhất trên toàn hệ thống.             |
| `authMethods`  | Không       | `string[]` | Các id phương thức thiết lập/xác thực mà nhà cung cấp này hỗ trợ mà không cần tải toàn bộ môi trường chạy.                       |
| `envVars`      | Không       | `string[]` | Các biến môi trường mà bề mặt thiết lập/trạng thái chung có thể kiểm tra trước khi môi trường chạy Plugin tải.               |
| `authEvidence` | Không       | `object[]` | Các kiểm tra bằng chứng xác thực cục bộ nhẹ dành cho nhà cung cấp có thể xác thực thông qua các dấu hiệu không bí mật. |

`authEvidence` dành cho các dấu hiệu thông tin xác thực cục bộ thuộc sở hữu nhà cung cấp có thể được xác minh mà không cần tải mã môi trường chạy. Các kiểm tra này phải luôn nhẹ và cục bộ: không gọi mạng, không đọc chuỗi khóa hoặc trình quản lý bí mật, không chạy lệnh shell và không thăm dò API của nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường              | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Có      | `string`   | Hiện tại là `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Không       | `string`   | Biến môi trường chứa đường dẫn rõ ràng đến tệp thông tin xác thực.                                                           |
| `fallbackPaths`    | Không       | `string[]` | Các đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` không có hoặc trống. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không       | `string[]` | Ít nhất một biến môi trường được liệt kê phải không trống thì bằng chứng mới hợp lệ.                                    |
| `requiresAllEnv`   | Không       | `string[]` | Mọi biến môi trường được liệt kê đều phải không trống thì bằng chứng mới hợp lệ.                                           |
| `credentialMarker` | Có      | `string`   | Dấu hiệu không bí mật được trả về khi có bằng chứng.                                                       |
| `source`           | Không       | `string`   | Nhãn nguồn hiển thị cho người dùng trong đầu ra xác thực/trạng thái.                                                               |

### Các trường thiết lập

| Trường              | Bắt buộc | Kiểu       | Ý nghĩa                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Không       | `object[]` | Các bộ mô tả thiết lập nhà cung cấp được cung cấp trong quá trình thiết lập và hướng dẫn ban đầu.                                     |
| `cliBackends`      | Không       | `string[]` | Các id backend tại thời điểm thiết lập được dùng cho việc tra cứu thiết lập ưu tiên theo bộ mô tả. Giữ các id đã chuẩn hóa duy nhất trên toàn hệ thống. |
| `configMigrations` | Không       | `string[]` | Các id di chuyển cấu hình thuộc sở hữu bề mặt thiết lập của Plugin này.                                          |
| `requiresRuntime`  | Không       | `boolean`  | Liệu thiết lập có còn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                            |

## Tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình đến các gợi ý kết xuất nhỏ. Khóa có thể sử dụng dấu chấm cho các trường cấu hình lồng nhau, nhưng không đoạn đường dẫn nào được là `__proto__`, `constructor` hoặc `prototype`; quá trình thiết lập từ chối các tên đó.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Khóa API",
      "help": "Được sử dụng cho các yêu cầu OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Mỗi gợi ý trường có thể bao gồm:

| Trường         | Kiểu       | Ý nghĩa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Nhãn trường hiển thị cho người dùng.                |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                      |
| `tags`        | `string[]` | Các thẻ giao diện người dùng tùy chọn.                       |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.            |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm. |
| `placeholder` | `string`   | Văn bản giữ chỗ cho các trường nhập biểu mẫu.       |

## Tham chiếu contracts

Chỉ sử dụng `contracts` cho siêu dữ liệu quyền sở hữu khả năng tĩnh mà OpenClaw có thể đọc mà không cần nhập môi trường chạy Plugin.

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

| Trường                           | Kiểu       | Ý nghĩa                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Các id factory tiện ích mở rộng app-server Codex, hiện là `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | Các id runtime mà plugin này có thể đăng ký middleware kết quả công cụ.                                                                     |
| `trustedToolPolicies`            | `string[]` | Các id chính sách tiền công cụ đáng tin cậy cục bộ trong plugin mà một plugin đã cài đặt có thể đăng ký. Các plugin đi kèm có thể đăng ký chính sách mà không cần trường này. |
| `externalAuthProviders`          | `string[]` | Các id nhà cung cấp mà plugin này sở hữu hook hồ sơ xác thực bên ngoài.                                                                      |
| `embeddingProviders`             | `string[]` | Các id nhà cung cấp embedding tổng quát mà plugin này sở hữu để sử dụng embedding vector có thể tái sử dụng, bao gồm bộ nhớ.                                 |
| `speechProviders`                | `string[]` | Các id nhà cung cấp giọng nói mà plugin này sở hữu.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Các id nhà cung cấp phiên âm thời gian thực mà plugin này sở hữu.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Các id nhà cung cấp thoại thời gian thực mà plugin này sở hữu.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Các id nhà cung cấp embedding dành riêng cho bộ nhớ đã ngừng khuyến nghị mà plugin này sở hữu.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Các id nhà cung cấp khả năng hiểu nội dung đa phương tiện mà plugin này sở hữu.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Các id nhà cung cấp nguồn bản chép lời mà plugin này sở hữu.                                                                                     |
| `documentExtractors`             | `string[]` | Các id nhà cung cấp trình trích xuất tài liệu (ví dụ PDF) mà plugin này sở hữu.                                                                  |
| `imageGenerationProviders`       | `string[]` | Các id nhà cung cấp tạo hình ảnh mà plugin này sở hữu.                                                                                      |
| `videoGenerationProviders`       | `string[]` | Các id nhà cung cấp tạo video mà plugin này sở hữu.                                                                                      |
| `musicGenerationProviders`       | `string[]` | Các id nhà cung cấp tạo nhạc mà plugin này sở hữu.                                                                                      |
| `webContentExtractors`           | `string[]` | Các id nhà cung cấp trích xuất nội dung trang web mà plugin này sở hữu.                                                                           |
| `webFetchProviders`              | `string[]` | Các id nhà cung cấp tìm nạp web mà plugin này sở hữu.                                                                                             |
| `webSearchProviders`             | `string[]` | Các id nhà cung cấp tìm kiếm web mà plugin này sở hữu.                                                                                            |
| `workerProviders`                | `string[]` | Các id nhà cung cấp worker đám mây mà plugin này sở hữu để cấp phát và quản lý vòng đời lease dựa trên hồ sơ.                                      |
| `usageProviders`                 | `string[]` | Các id nhà cung cấp mà plugin này sở hữu hook xác thực mức sử dụng và ảnh chụp nhanh mức sử dụng.                                                             |
| `migrationProviders`             | `string[]` | Các id nhà cung cấp nhập mà plugin này sở hữu cho `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Quyền dành riêng cho các route HTTP plugin đã xác thực để điều phối các phương thức Gateway trong cùng tiến trình.                                  |
| `tools`                          | `string[]` | Tên công cụ agent mà plugin này sở hữu.                                                                                                   |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng chỉ dành cho app-server Codex đi kèm. Thay vào đó, các phép biến đổi kết quả công cụ đi kèm nên khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng `api.registerAgentToolResultMiddleware(...)`. Các plugin đã cài đặt chỉ có thể sử dụng cùng điểm nối middleware này khi được bật rõ ràng và chỉ cho các runtime mà chúng khai báo trong `contracts.agentToolResultMiddleware`.

Các plugin đã cài đặt cần tầng chính sách tiền công cụ được máy chủ tin cậy phải khai báo từng id cục bộ đã đăng ký trong `contracts.trustedToolPolicies` và được bật rõ ràng. Các plugin đi kèm tiếp tục sử dụng đường dẫn chính sách đáng tin cậy hiện có, nhưng các plugin đã cài đặt có id chính sách chưa được khai báo sẽ bị từ chối trước khi đăng ký. Các id chính sách được giới hạn phạm vi theo plugin đăng ký, vì vậy hai plugin đều có thể khai báo và đăng ký `workflow-budget`; một plugin không được đăng ký cùng một id cục bộ hai lần.

Các đăng ký `api.registerTool(...)` của runtime phải khớp với `contracts.tools`. Quá trình khám phá công cụ sử dụng danh sách này để chỉ tải các runtime plugin có thể sở hữu các công cụ được yêu cầu.

Các plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo `contracts.externalAuthProviders`; các hook xác thực bên ngoài chưa khai báo sẽ bị bỏ qua.

Các plugin nhà cung cấp triển khai cả `resolveUsageAuth` và `fetchUsageSnapshot` nên khai báo từng id nhà cung cấp được tự động phát hiện trong `contracts.usageProviders`. Quá trình khám phá mức sử dụng đọc hợp đồng này trước khi tải mã runtime, sau đó xác minh cả hai hook sau khi chỉ tải các chủ sở hữu đã khai báo.

Các nhà cung cấp embedding tổng quát nên khai báo `contracts.embeddingProviders` cho từng adapter được đăng ký bằng `api.registerEmbeddingProvider(...)`. Sử dụng hợp đồng tổng quát để tạo vector có thể tái sử dụng, bao gồm các nhà cung cấp được tìm kiếm bộ nhớ sử dụng. `contracts.memoryEmbeddingProviders` là cơ chế tương thích dành riêng cho bộ nhớ đã ngừng khuyến nghị và chỉ được duy trì trong khi các nhà cung cấp hiện có chuyển sang điểm nối nhà cung cấp embedding tổng quát.

Các nhà cung cấp worker phải khai báo từng id `api.registerWorkerProvider(...)` trong `contracts.workerProviders`. Core lưu bền vững ý định trước khi gọi `provision`; các nhà cung cấp xác thực cài đặt trước khi cấp phát bên ngoài, và các lệnh gọi lặp lại với cùng id thao tác phải tiếp nhận cùng một lease. Core cũng lưu bền vững ảnh chụp nhanh cài đặt đã xác thực đó và truyền nó cùng `leaseId` đến `inspect({ leaseId, profile })` và `destroy({ leaseId, profile })`, kể cả sau khi hồ sơ được đặt tên bị thay đổi hoặc xóa. Việc hủy có tính lũy đẳng, quá trình kiểm tra trả về hợp trạng thái đóng `active` / `destroyed` / `unknown`, và vật liệu khóa riêng SSH chỉ được tham chiếu thông qua `SecretRef`. Các điểm cuối SSH đã cấp phát cũng phải bao gồm một `hostKey` công khai từ đầu ra cấp phát đáng tin cậy với định dạng chính xác là `algorithm base64`, không có tên máy chủ hoặc chú thích, để core có thể ghim máy chủ trước khi kết nối. Các nhà cung cấp tạo ref danh tính động có thể triển khai `resolveSshIdentity({ leaseId, profile, keyRef })` có thẩm quyền; các nhà cung cấp không có triển khai này sử dụng trình phân giải bí mật tổng quát của core. Một `unknown` có thẩm quyền sẽ biến bản ghi cục bộ đang hoạt động thành bản ghi mồ côi; sau một yêu cầu hủy đã được lưu bền vững, nó xác nhận quá trình tháo dỡ.

`contracts.gatewayMethodDispatch` hiện chấp nhận `"authenticated-request"`. Đây là cổng vệ sinh API cho các route HTTP plugin gốc cố ý điều phối các phương thức mặt phẳng điều khiển Gateway trong cùng tiến trình, không phải sandbox chống lại các plugin gốc độc hại. Chỉ sử dụng nó cho các bề mặt đi kèm/dành cho người vận hành đã được xem xét kỹ và vốn đã yêu cầu xác thực HTTP của Gateway. Một route có quyền vẫn có thể truy cập được trong khi cơ chế tiếp nhận công việc gốc của Gateway bị đóng chỉ khi route đó cũng khai báo `auth: "gateway"` và `gatewayRuntimeScopeSurface: "trusted-operator"` dành riêng cho route; các route ngang hàng thông thường từ cùng plugin vẫn nằm sau ranh giới tiếp nhận. Điều này giữ cho trạng thái tạm ngưng và chức năng tiếp tục có thể truy cập mà không cấp cho toàn bộ plugin quyền bỏ qua cơ chế tiếp nhận. Giới hạn việc phân tích và định hình phản hồi bên ngoài quá trình điều phối; công việc thực chất hoặc làm thay đổi trạng thái phải đi qua quá trình điều phối phương thức Gateway, nơi sở hữu việc thực thi cơ chế tiếp nhận và phạm vi.

## Tham chiếu configContracts

Sử dụng `configContracts` cho hành vi cấu hình thuộc sở hữu của manifest mà các trình trợ giúp core tổng quát cần dùng mà không nhập runtime plugin: phát hiện cờ nguy hiểm, đích di chuyển SecretRef và thu hẹp đường dẫn cấu hình cũ.

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
          "path": "routes.*.secret",
          "expected": "string",
          "ownerKind": "route"
        }
      ]
    }
  }
}
```

| Trường                         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Không       | `string[]` | Các đường dẫn cấu hình tương đối với gốc cho biết quá trình di chuyển tương thích lúc thiết lập của plugin này có thể áp dụng. Cho phép các lần đọc cấu hình runtime tổng quát bỏ qua mọi bề mặt thiết lập plugin khi cấu hình không bao giờ tham chiếu plugin.                 |
| `compatibilityRuntimePaths`   | Không       | `string[]` | Các đường dẫn tương thích tương đối với gốc mà plugin này có thể phục vụ trong runtime trước khi mã plugin được kích hoạt hoàn toàn. Sử dụng mục này cho các bề mặt cũ cần thu hẹp tập ứng viên đi kèm mà không nhập mọi runtime plugin tương thích. |
| `dangerousFlags`              | Không       | `object[]` | Các giá trị literal cấu hình mà `openclaw doctor` nên đánh dấu là không an toàn hoặc nguy hiểm khi được bật. Xem bên dưới.                                                                                                                                   |
| `secretInputs`                | Không       | `object`   | Các đường dẫn cấu hình bên dưới `plugins.entries.<id>.config` dành cho việc di chuyển SecretRef, kiểm tra, hiện thực hóa khi khởi động và tùy chọn cô lập chủ sở hữu runtime. Xem bên dưới.                                                                             |

Mỗi mục `dangerousFlags` hỗ trợ:

| Trường    | Bắt buộc | Kiểu                                  | Ý nghĩa                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Có      | `string`                              | Đường dẫn cấu hình phân tách bằng dấu chấm, tương đối với `plugins.entries.<id>.config`. Hỗ trợ ký tự đại diện `*` cho các phân đoạn ánh xạ/mảng. |
| `equals` | Có      | `string \| number \| boolean \| null` | Giá trị literal chính xác đánh dấu giá trị cấu hình này là nguy hiểm.                                                            |

`secretInputs` hỗ trợ:

| Trường                   | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Không       | `boolean`  | Ghi đè trạng thái bật mặc định của plugin đi kèm khi quyết định bề mặt SecretRef này có đang hoạt động hay không. Sử dụng tùy chọn này khi plugin được đi kèm nhưng bề mặt phải duy trì trạng thái không hoạt động cho đến khi được bật rõ ràng trong cấu hình.                                                                                                                                            |
| `paths`                 | Có      | `object[]` | Các đường dẫn cấu hình có dạng bí mật, mỗi đường dẫn có `path` (phân tách bằng dấu chấm, tương đối với `plugins.entries.<id>.config`, hỗ trợ ký tự đại diện `*`), `expected` tùy chọn (hiện chỉ có `"string"`) và `ownerKind` tùy chọn (hiện chỉ có `"route"`). Chủ sở hữu đã khai báo chỉ cô lập chính xác đường dẫn khớp đó khi quá trình phân giải thất bại; id chủ sở hữu là đường dẫn cấu hình đầy đủ. |

## Tham chiếu mediaUnderstandingProviderMetadata

Sử dụng `mediaUnderstandingProviderMetadata` khi nhà cung cấp khả năng hiểu nội dung đa phương tiện có các mô hình mặc định, mức ưu tiên dự phòng xác thực tự động hoặc hỗ trợ tài liệu gốc mà các trình trợ giúp lõi chung cần trước khi runtime tải. Các khóa cũng phải được khai báo trong `contracts.mediaUnderstandingProviders`.

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

| Trường                  | Kiểu                                                             | Ý nghĩa                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Các khả năng đa phương tiện do nhà cung cấp này cung cấp.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Các giá trị mặc định ánh xạ từ khả năng sang mô hình, được sử dụng khi cấu hình không chỉ định mô hình.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Số nhỏ hơn được sắp xếp trước khi tự động dự phòng nhà cung cấp dựa trên thông tin xác thực.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Các đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Các giá trị ghi đè mô hình theo từng loại tài liệu. Đặt `image: false` để tắt trích xuất dựa trên hình ảnh cho loại tài liệu đó. |

## Tham chiếu channelConfigs

Sử dụng `channelConfigs` khi plugin kênh cần siêu dữ liệu cấu hình ít tốn tài nguyên trước khi runtime tải. Quá trình khám phá thiết lập/trạng thái kênh chỉ đọc có thể sử dụng trực tiếp siêu dữ liệu này cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc khi `setup.requiresRuntime: false` khai báo rằng runtime thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest của plugin, không phải một phần cấu hình người dùng cấp cao nhất mới. Người dùng vẫn cấu hình các phiên bản kênh trong `channels.<channel-id>`. OpenClaw đọc siêu dữ liệu manifest để quyết định plugin nào sở hữu kênh đã cấu hình đó trước khi mã runtime của plugin thực thi.

Đối với plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục `channelConfigs` tương ứng. Nếu thiếu chúng, OpenClaw vẫn có thể tải plugin, nhưng lược đồ cấu hình trên đường dẫn nguội, quá trình thiết lập và các bề mặt Control UI không thể biết hình dạng tùy chọn do kênh sở hữu cho đến khi runtime của plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và `nativeSkillsAutoEnabled` có thể khai báo các giá trị mặc định `auto` tĩnh cho những phép kiểm tra cấu hình lệnh chạy trước khi runtime kênh tải. Các kênh đi kèm cũng có thể công bố cùng những giá trị mặc định đó thông qua `package.json#openclaw.channel.commands`, cùng với siêu dữ liệu danh mục kênh khác do gói sở hữu.

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
          "label": "URL máy chủ chính",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Kết nối máy chủ chính Matrix",
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

| Trường         | Kiểu                     | Ý nghĩa                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc đối với mỗi mục cấu hình kênh đã khai báo.         |
| `uiHints`     | `Record<string, object>` | Các nhãn UI/phần giữ chỗ/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.          |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi siêu dữ liệu runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả ngắn về kênh cho các bề mặt kiểm tra và danh mục.                               |
| `commands`    | `object`                 | Các giá trị mặc định tự động tĩnh cho lệnh gốc và Skills gốc trong các phép kiểm tra cấu hình trước runtime.       |
| `preferOver`  | `string[]`               | Các id plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên được ưu tiên hơn trên các bề mặt lựa chọn.    |

### Thay thế một plugin kênh khác

Sử dụng `preferOver` khi plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà plugin khác cũng có thể cung cấp. Các trường hợp phổ biến gồm id plugin đã được đổi tên, plugin độc lập thay thế plugin đi kèm hoặc một fork được duy trì vẫn giữ nguyên id kênh để tương thích cấu hình.

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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả id kênh và id plugin được ưu tiên. Nếu plugin có mức ưu tiên thấp hơn chỉ được chọn vì nó đi kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt plugin đó trong cấu hình runtime hiệu lực để một plugin duy nhất sở hữu kênh và các công cụ của kênh. Lựa chọn rõ ràng của người dùng vẫn được ưu tiên: nếu người dùng bật rõ ràng cả hai plugin (thông qua `plugins.allow` hoặc cấu hình `plugins.entries` có nội dung thực), OpenClaw sẽ giữ nguyên lựa chọn đó và báo cáo chẩn đoán trùng lặp kênh/công cụ thay vì âm thầm thay đổi tập hợp plugin được yêu cầu.

Chỉ giới hạn phạm vi `preferOver` ở các id plugin thực sự có thể cung cấp cùng một kênh. Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình người dùng.

## Tham chiếu modelSupport

Sử dụng `modelSupport` khi OpenClaw cần suy luận plugin nhà cung cấp của bạn từ các id mô hình dạng viết tắt như `gpt-5.6-sol` hoặc `claude-sonnet-4.6` trước khi runtime của plugin tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên sau:

- các tham chiếu `provider/model` rõ ràng sử dụng siêu dữ liệu manifest `providers` sở hữu chúng
- `modelPatterns` được ưu tiên hơn `modelPrefixes`
- nếu một plugin không đi kèm và một plugin đi kèm đều khớp, plugin không đi kèm được ưu tiên
- sự nhập nhằng còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định nhà cung cấp

Các trường:

| Trường           | Kiểu       | Ý nghĩa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được đối sánh bằng `startsWith` với các id mô hình dạng viết tắt.                 |
| `modelPatterns` | `string[]` | Các nguồn biểu thức chính quy được đối sánh với id mô hình dạng viết tắt sau khi loại bỏ hậu tố hồ sơ. |

Các mục `modelPatterns` được biên dịch thông qua `compileSafeRegex`, công cụ này từ chối các mẫu chứa phép lặp lồng nhau (ví dụ `(a+)+$`). Các mẫu không vượt qua phép kiểm tra an toàn sẽ bị âm thầm bỏ qua, tương tự như biểu thức chính quy không hợp lệ về cú pháp. Hãy giữ mẫu đơn giản và tránh các bộ định lượng lồng nhau.

## Tham chiếu modelCatalog

Sử dụng `modelCatalog` khi OpenClaw cần biết siêu dữ liệu mô hình của nhà cung cấp trước khi tải runtime của plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định, bí danh nhà cung cấp, quy tắc ẩn và chế độ khám phá. Việc làm mới runtime vẫn thuộc về mã runtime của nhà cung cấp, nhưng manifest cho lõi biết khi nào cần runtime.

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
        "reason": "không khả dụng trên Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Các trường cấp cao nhất:

| Trường            | Kiểu                                                     | Ý nghĩa                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Các hàng danh mục cho những id nhà cung cấp thuộc sở hữu của plugin này. Các khóa cũng phải xuất hiện trong `providers` cấp cao nhất.       |
| `aliases`        | `Record<string, object>`                                 | Các bí danh nhà cung cấp cần phân giải thành một nhà cung cấp thuộc sở hữu để lập kế hoạch danh mục hoặc loại bỏ.              |
| `suppressions`   | `object[]`                                               | Các hàng mô hình từ một nguồn khác mà plugin này loại bỏ vì lý do dành riêng cho nhà cung cấp.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Cho biết có thể đọc danh mục nhà cung cấp từ siêu dữ liệu manifest, làm mới vào bộ nhớ đệm hay cần runtime. |
| `runtimeAugment` | `boolean`                                                | Chỉ đặt thành `true` khi runtime của nhà cung cấp phải nối thêm các hàng danh mục sau khi lập kế hoạch manifest/cấu hình.       |

`aliases` tham gia tra cứu quyền sở hữu nhà cung cấp để lập kế hoạch danh mục mô hình. Đích của bí danh phải là nhà cung cấp cấp cao nhất thuộc sở hữu của cùng một plugin. Khi danh sách được lọc theo nhà cung cấp sử dụng bí danh, OpenClaw có thể đọc manifest sở hữu và áp dụng các ghi đè API/URL cơ sở của bí danh mà không cần tải runtime của nhà cung cấp. Bí danh không mở rộng các danh sách danh mục không được lọc; danh sách rộng chỉ xuất các hàng của nhà cung cấp chính tắc sở hữu.

`suppressions` thay thế hook `suppressBuiltInModel` cũ của runtime nhà cung cấp. Các mục loại bỏ chỉ được áp dụng khi nhà cung cấp thuộc sở hữu của plugin hoặc được khai báo là khóa `modelCatalog.aliases` trỏ đến một nhà cung cấp thuộc sở hữu. Các hook loại bỏ ở runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường                 | Kiểu                     | Ý nghĩa                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL cơ sở mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Bộ chuyển đổi API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Các header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Id mô hình nhỏ tùy chọn do nhà cung cấp đề xuất cho các tác vụ tiện ích nội bộ ngắn (tiêu đề, tường thuật tiến độ). Được dùng khi `agents.defaults.utilityModel` chưa được đặt và nhà cung cấp này phục vụ mô hình chính của tác tử. |
| `models`              | `object[]`               | Các hàng mô hình bắt buộc. Những hàng không có `id` sẽ bị bỏ qua.                                                                                                                                                            |

Các trường mô hình:

| Trường              | Kiểu                                                           | Ý nghĩa                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Id mô hình cục bộ của nhà cung cấp, không có tiền tố `provider/`.                    |
| `name`             | `string`                                                       | Tên hiển thị tùy chọn.                                                      |
| `api`              | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                            |
| `baseUrl`          | `string`                                                       | Ghi đè URL cơ sở tùy chọn theo từng mô hình.                                       |
| `headers`          | `Record<string, string>`                                       | Các header tĩnh tùy chọn theo từng mô hình.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Các phương thức mà mô hình chấp nhận. Những giá trị khác sẽ bị âm thầm loại bỏ.            |
| `reasoning`        | `boolean`                                                      | Cho biết mô hình có cung cấp hành vi suy luận hay không.                               |
| `contextWindow`    | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                             |
| `contextTokens`    | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu dụng tùy chọn khi khác với `contextWindow`. |
| `maxTokens`        | `number`                                                       | Số token đầu ra tối đa khi đã biết.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Ghi đè id mô hình hoặc tham số tùy chọn theo từng mức tư duy.                    |
| `cost`             | `object`                                                       | Giá tùy chọn bằng USD trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn. |
| `compat`           | `object`                                                       | Các cờ tương thích tùy chọn khớp với khả năng tương thích của cấu hình mô hình OpenClaw.  |
| `mediaInput`       | `object`                                                       | Cấu hình đầu vào tùy chọn theo từng phương thức, hiện chỉ dành cho hình ảnh.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ loại bỏ khi hàng tuyệt đối không được xuất hiện.          |
| `statusReason`     | `string`                                                       | Lý do tùy chọn được hiển thị cùng trạng thái không khả dụng.                            |
| `replaces`         | `string[]`                                                     | Các id mô hình cục bộ cũ hơn của nhà cung cấp được mô hình này thay thế.                       |
| `replacedBy`       | `string`                                                       | Id mô hình cục bộ của nhà cung cấp dùng để thay thế các hàng đã lỗi thời.                    |
| `tags`             | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc sử dụng.                                    |

Các trường loại bỏ:

| Trường                      | Kiểu       | Ý nghĩa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id nhà cung cấp của hàng thượng nguồn cần loại bỏ. Phải thuộc sở hữu của plugin này hoặc được khai báo là một bí danh thuộc sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ của nhà cung cấp cần loại bỏ.                                                                      |
| `reason`                   | `string`   | Thông báo tùy chọn được hiển thị khi hàng đã loại bỏ được yêu cầu trực tiếp.                                     |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn gồm các host URL cơ sở hiệu dụng của nhà cung cấp, bắt buộc phải có trước khi áp dụng việc loại bỏ.               |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn gồm các giá trị `api` chính xác trong cấu hình nhà cung cấp, bắt buộc phải có trước khi áp dụng việc loại bỏ.              |

Không đưa dữ liệu chỉ dành cho runtime vào `modelCatalog`. Chỉ dùng `static` khi các hàng manifest đủ đầy đủ để những bề mặt danh sách được lọc theo nhà cung cấp và bộ chọn có thể bỏ qua việc khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là những mục khởi đầu có thể liệt kê hoặc phần bổ sung hữu ích, nhưng quá trình làm mới/bộ nhớ đệm có thể thêm nhiều hàng hơn sau đó; bản thân các hàng có thể làm mới không có tính thẩm quyền. Dùng `runtime` khi OpenClaw phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` để dọn dẹp id mô hình ít tốn kém thuộc quyền sở hữu của nhà cung cấp, việc này phải diễn ra trước khi tải runtime của nhà cung cấp. Cách này giữ các bí danh như tên mô hình ngắn, id cũ cục bộ của nhà cung cấp và quy tắc tiền tố proxy trong manifest của plugin sở hữu thay vì trong các bảng lựa chọn mô hình cốt lõi.

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

Các trường nhà cung cấp:

| Trường                                | Kiểu                    | Ý nghĩa                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Các bí danh id mô hình khớp chính xác, không phân biệt chữ hoa chữ thường. Giá trị được trả về đúng như đã viết.                  |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần xóa trước khi tra cứu bí danh, hữu ích cho trường hợp lặp nhà cung cấp/mô hình cũ.     |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi id mô hình đã chuẩn hóa chưa chứa `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Các quy tắc tiền tố có điều kiện cho id trần sau khi tra cứu bí danh, được định khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` để phân loại endpoint mà chính sách yêu cầu chung phải biết trước khi tải runtime của nhà cung cấp. Phần cốt lõi vẫn sở hữu ý nghĩa của từng `endpointClass`; manifest của plugin sở hữu siêu dữ liệu host và URL cơ sở.

Các plugin nhà cung cấp được ngoại vi hóa chính thức bị loại khỏi bản phân phối cốt lõi, vì vậy
manifest của chúng không hiển thị cho đến khi được cài đặt. `providerEndpoints` của chúng
cũng phải được phản chiếu trong `scripts/lib/official-external-provider-catalog.json` để
việc phân loại endpoint tiếp tục hoạt động khi không có plugin; một kiểm thử hợp đồng
thực thi yêu cầu phản chiếu này.

Các trường endpoint:

| Trường                          | Kiểu       | Ý nghĩa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp điểm cuối lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native` hoặc `google-vertex`.        |
| `hosts`                        | `string[]` | Các tên máy chủ chính xác ánh xạ tới lớp điểm cuối.                                                |
| `hostSuffixes`                 | `string[]` | Các hậu tố máy chủ ánh xạ tới lớp điểm cuối. Thêm tiền tố `.` để chỉ khớp theo hậu tố miền. |
| `baseUrls`                     | `string[]` | Các URL cơ sở HTTP(S) chính xác đã chuẩn hóa ánh xạ tới lớp điểm cuối.                             |
| `googleVertexRegion`           | `string`   | Khu vực Google Vertex tĩnh cho các máy chủ toàn cục chính xác.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các máy chủ khớp để lấy tiền tố khu vực Google Vertex.                 |

## Tham chiếu providerRequest

Sử dụng `providerRequest` cho siêu dữ liệu tương thích yêu cầu nhẹ mà chính sách yêu cầu chung cần dùng mà không phải tải runtime của nhà cung cấp. Giữ việc viết lại payload theo hành vi cụ thể trong các hook runtime của nhà cung cấp hoặc các trình trợ giúp dùng chung cho họ nhà cung cấp.

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

| Trường                 | Kiểu         | Ý nghĩa                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp được dùng cho các quyết định tương thích yêu cầu chung và chẩn đoán. |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn dành cho các trình trợ giúp yêu cầu dùng chung.              |
| `openAICompletions`   | `object`     | Các cờ yêu cầu hoàn thành tương thích OpenAI, hiện là `supportsStreamingUsage`.       |

## Tham chiếu secretProviderIntegrations

Sử dụng `secretProviderIntegrations` khi một plugin có thể công bố một thiết lập sẵn nhà cung cấp thực thi SecretRef có thể tái sử dụng. OpenClaw đọc siêu dữ liệu này trước khi runtime của plugin tải, lưu quyền sở hữu plugin trong `secrets.providers.<alias>.pluginIntegration` và để runtime SecretRef thực hiện việc phân giải bí mật. Các thiết lập sẵn chỉ được cung cấp cho plugin đi kèm và plugin đã cài đặt được phát hiện từ các thư mục gốc cài đặt plugin được quản lý, chẳng hạn như bản cài đặt từ git và ClawHub.

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

Khóa ánh xạ là mã định danh tích hợp. Nếu bỏ qua `providerAlias`, OpenClaw sử dụng mã định danh tích hợp làm bí danh nhà cung cấp SecretRef. Bí danh nhà cung cấp phải khớp với mẫu bí danh nhà cung cấp SecretRef thông thường, ví dụ `team-secrets` hoặc `onepassword-work`.

Khi người vận hành chọn thiết lập sẵn, OpenClaw ghi một tham chiếu nhà cung cấp như sau:

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

Khi khởi động/tải lại, OpenClaw phân giải nhà cung cấp đó bằng cách tải siêu dữ liệu manifest plugin hiện tại, kiểm tra rằng plugin sở hữu đã được cài đặt và đang hoạt động, rồi hiện thực hóa lệnh thực thi từ manifest. Việc vô hiệu hóa hoặc gỡ bỏ plugin sẽ thu hồi nhà cung cấp đối với các SecretRef đang hoạt động. Người vận hành muốn có cấu hình thực thi độc lập vẫn có thể ghi trực tiếp các nhà cung cấp `command`/`args` thủ công.

Hiện chỉ hỗ trợ các thiết lập sẵn `source: "exec"`. `command` phải là `${node}`, và `args[0]` phải là một tập lệnh phân giải `./` tương đối với thư mục gốc plugin. Khi khởi động/tải lại, OpenClaw hiện thực hóa tập lệnh đó thành tệp thực thi Node hiện tại và đường dẫn tuyệt đối tới tập lệnh bên trong plugin. Các tùy chọn Node như `--require`, `--import`, `--loader`, `--env-file`, `--eval` và `--print` không thuộc hợp đồng thiết lập sẵn của manifest. Người vận hành cần các lệnh không phải Node có thể trực tiếp cấu hình nhà cung cấp thực thi độc lập thủ công.

OpenClaw suy ra `trustedDirs` cho các thiết lập sẵn trong manifest từ thư mục gốc plugin và, đối với thiết lập sẵn `${node}`, từ thư mục của tệp thực thi Node hiện tại. Các `trustedDirs` được khai báo trong manifest sẽ bị bỏ qua. Các tùy chọn nhà cung cấp thực thi khác như `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` và `allowInsecurePath` được chuyển nguyên trạng sang cấu hình nhà cung cấp thực thi SecretRef thông thường.

## Tham chiếu modelPricing

Sử dụng `modelPricing` khi một nhà cung cấp cần hành vi định giá ở mặt phẳng điều khiển trước khi runtime tải. Bộ nhớ đệm định giá của Gateway đọc siêu dữ liệu này mà không nhập mã runtime của nhà cung cấp.

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

| Trường        | Kiểu              | Ý nghĩa                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho các nhà cung cấp cục bộ/tự lưu trữ không bao giờ được tìm nạp giá từ OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` vô hiệu hóa việc tra cứu OpenRouter cho nhà cung cấp này.           |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` vô hiệu hóa việc tra cứu LiteLLM cho nhà cung cấp này.                 |

Các trường nguồn:

| Trường                      | Kiểu               | Ý nghĩa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Mã định danh nhà cung cấp danh mục bên ngoài khi khác với mã định danh nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xử lý các mã định danh mô hình chứa dấu gạch chéo như các tham chiếu nhà cung cấp/mô hình lồng nhau, hữu ích cho các nhà cung cấp proxy như OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể mã định danh mô hình bổ sung của danh mục bên ngoài. `version-dots` thử các mã định danh phiên bản có dấu chấm như `claude-opus-4.6`.            |

### Chỉ mục nhà cung cấp OpenClaw

Chỉ mục nhà cung cấp OpenClaw là siêu dữ liệu xem trước do OpenClaw sở hữu dành cho các nhà cung cấp có plugin có thể chưa được cài đặt. Đây không phải là một phần của manifest plugin. Manifest plugin vẫn là nguồn có thẩm quyền về plugin đã cài đặt. Chỉ mục nhà cung cấp là hợp đồng dự phòng nội bộ mà các bề mặt chọn mô hình trước khi cài đặt và nhà cung cấp có thể cài đặt trong tương lai sẽ sử dụng khi plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền của danh mục:

1. Cấu hình người dùng.
2. Manifest plugin đã cài đặt `modelCatalog`.
3. Bộ nhớ đệm danh mục mô hình từ lần làm mới tường minh.
4. Các hàng xem trước của Chỉ mục nhà cung cấp OpenClaw.

Chỉ mục nhà cung cấp không được chứa bí mật, trạng thái kích hoạt, hook runtime hoặc dữ liệu mô hình trực tiếp dành riêng cho tài khoản. Các danh mục xem trước của chỉ mục sử dụng cùng hình dạng hàng nhà cung cấp `modelCatalog` như manifest plugin, nhưng chỉ nên giới hạn ở siêu dữ liệu hiển thị ổn định, trừ khi các trường bộ điều hợp runtime như `api`, `baseUrl`, giá hoặc cờ tương thích được chủ ý giữ đồng bộ với manifest plugin đã cài đặt. Các nhà cung cấp có cơ chế khám phá `/models` trực tiếp nên ghi các hàng đã làm mới thông qua đường dẫn bộ nhớ đệm danh mục mô hình tường minh, thay vì để quy trình liệt kê hoặc hướng dẫn thiết lập thông thường gọi API của nhà cung cấp.

Các mục trong Chỉ mục nhà cung cấp cũng có thể chứa siêu dữ liệu plugin có thể cài đặt cho những nhà cung cấp có plugin đã được chuyển ra khỏi lõi hoặc chưa được cài đặt vì lý do khác. Siêu dữ liệu này phản chiếu mẫu danh mục kênh: tên gói, đặc tả cài đặt npm, tính toàn vẹn dự kiến và các nhãn lựa chọn xác thực nhẹ là đủ để hiển thị một tùy chọn thiết lập có thể cài đặt. Sau khi plugin được cài đặt, manifest của plugin sẽ được ưu tiên và mục Chỉ mục nhà cung cấp của nhà cung cấp đó sẽ bị bỏ qua.

`openclaw doctor --fix` di chuyển một tập nhỏ, đóng gồm các khóa năng lực manifest cấp cao nhất cũ sang `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` và `tools`. Không khóa nào trong số này (hoặc bất kỳ danh sách năng lực nào khác) còn được đọc dưới dạng trường manifest cấp cao nhất; quá trình tải manifest thông thường chỉ nhận dạng chúng bên dưới `contracts`.

## Manifest so với package.json

Hai tệp đảm nhiệm các vai trò khác nhau:

| Tệp                   | Dùng cho                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực và các gợi ý giao diện người dùng phải tồn tại trước khi mã plugin chạy                         |
| `package.json`         | Siêu dữ liệu npm, cài đặt phần phụ thuộc và khối `openclaw` được dùng cho điểm vào, kiểm soát điều kiện cài đặt, thiết lập hoặc siêu dữ liệu danh mục |

Nếu không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc sau:

- nếu OpenClaw phải biết thông tin đó trước khi tải mã plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu thông tin đó liên quan đến đóng gói, tệp điểm vào hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến quá trình khám phá

Một số siêu dữ liệu plugin trước runtime được chủ ý đặt trong `package.json` bên dưới khối `openclaw` thay vì `openclaw.plugin.json`. `openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng plugin OpenClaw; plugin gốc phải sử dụng `openclaw.plugin.json` cùng với các trường `package.json#openclaw` được hỗ trợ bên dưới.

Các ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Khai báo các điểm vào Plugin gốc. Phải nằm trong thư mục gói Plugin.                                                                                                                  |
| `openclaw.runtimeExtensions`                                                               | Khai báo các điểm vào runtime JavaScript đã được build cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                     |
| `openclaw.setupEntry`                                                                      | Điểm vào nhẹ chỉ dành cho thiết lập, được dùng trong quá trình làm quen ban đầu, khởi động kênh trì hoãn và khám phá trạng thái kênh/SecretRef chỉ đọc. Phải nằm trong thư mục gói Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo điểm vào thiết lập JavaScript đã được build cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại và phải nằm trong thư mục gói Plugin.                         |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh và nội dung lựa chọn.                                                                                            |
| `openclaw.channel.approvalFlags`                                                           | Các cờ hành vi phê duyệt khép kín có sẵn trước khi tải runtime. `native` nghĩa là kênh sở hữu giao diện phê duyệt gốc và khả năng xử lý trong cùng lượt.                |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu mặc định tự động tĩnh cho lệnh gốc và skill gốc, được cấu hình, kiểm tra và dùng trên các bề mặt danh sách lệnh trước khi runtime của kênh tải.                          |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu trình kiểm tra trạng thái đã cấu hình nhẹ, có thể trả lời “thiết lập chỉ bằng biến môi trường đã tồn tại chưa?” mà không cần tải toàn bộ runtime của kênh.              |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu trình kiểm tra xác thực được lưu bền nhẹ, có thể trả lời “đã có tài khoản nào đăng nhập chưa?” mà không cần tải toàn bộ runtime của kênh.                                |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho các Plugin đi kèm và được phát hành bên ngoài.                                                                                                             |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt.                                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | Phiên bản máy chủ OpenClaw tối thiểu được hỗ trợ, sử dụng mức sàn semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                          |
| `openclaw.compat.pluginApi`                                                                | Phạm vi API Plugin OpenClaw tối thiểu mà gói này yêu cầu, sử dụng mức sàn semver như `>=2026.5.27`.                                                                           |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi tính toàn vẹn npm dist dự kiến, chẳng hạn như `sha512-...`; các luồng cài đặt và cập nhật xác minh tạo tác đã tìm nạp dựa trên chuỗi này.                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép một đường dẫn khôi phục cài đặt lại Plugin đi kèm có phạm vi hẹp khi cấu hình không hợp lệ.                                                                                 |
| `openclaw.install.requiredPlatformPackages`                                                | Các bí danh gói npm phải được hiện thực hóa khi các ràng buộc nền tảng trong lockfile của chúng khớp với máy chủ hiện tại.                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép tải các bề mặt kênh của runtime thiết lập trước khi bắt đầu lắng nghe, sau đó trì hoãn toàn bộ Plugin kênh đã cấu hình cho đến khi kích hoạt sau khi bắt đầu lắng nghe.     |

Siêu dữ liệu manifest quyết định những lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong quá trình làm quen ban đầu trước khi runtime tải. `package.json#openclaw.install` cho quá trình làm quen ban đầu biết cách tìm nạp hoặc bật Plugin đó khi người dùng chọn một trong các lựa chọn này. Không chuyển các gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải sổ đăng ký manifest đối với các nguồn Plugin không đi kèm. Các giá trị không hợp lệ bị từ chối; các giá trị mới hơn nhưng hợp lệ khiến Plugin bên ngoài bị bỏ qua trên máy chủ cũ hơn. Các Plugin nguồn đi kèm được giả định là có cùng phiên bản với bản checkout của máy chủ.

`openclaw.install.requiredPlatformPackages` dành cho các gói npm cung cấp những tệp nhị phân gốc bắt buộc thông qua các bí danh tùy chọn dành riêng cho nền tảng. Liệt kê tên gói npm thuần cho mọi bí danh nền tảng được hỗ trợ. Trong quá trình cài đặt npm, OpenClaw chỉ xác minh bí danh đã khai báo có ràng buộc lockfile khớp với máy chủ hiện tại. Nếu npm báo thành công nhưng bỏ sót bí danh đó, OpenClaw thử lại một lần với bộ nhớ đệm mới và hoàn tác cài đặt nếu bí danh vẫn còn thiếu.

`openclaw.compat.pluginApi` được thực thi trong quá trình cài đặt gói đối với các nguồn Plugin không đi kèm. Dùng trường này cho mức sàn API SDK/runtime Plugin OpenClaw mà gói đã được build dựa trên. Trường này có thể nghiêm ngặt hơn `minHostVersion` khi một gói Plugin cần API mới hơn nhưng vẫn giữ gợi ý cài đặt thấp hơn cho các luồng khác. Theo mặc định, quá trình đồng bộ bản phát hành chính thức của OpenClaw nâng các mức sàn API Plugin chính thức hiện có lên phiên bản phát hành OpenClaw, nhưng các bản phát hành chỉ dành cho Plugin có thể giữ mức sàn thấp hơn khi gói chủ ý hỗ trợ máy chủ cũ hơn. Không chỉ dùng phiên bản gói làm hợp đồng tương thích. `peerDependencies.openclaw` vẫn là siêu dữ liệu gói npm; OpenClaw dùng hợp đồng `openclaw.compat.pluginApi` để đưa ra quyết định về khả năng tương thích khi cài đặt.

Siêu dữ liệu cài đặt theo yêu cầu chính thức nên dùng `clawhubSpec` khi Plugin được phát hành trên ClawHub; quá trình làm quen ban đầu xem đó là nguồn từ xa ưu tiên và ghi lại thông tin tạo tác ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án dự phòng tương thích cho các gói chưa chuyển sang ClawHub.

Việc ghim chính xác phiên bản npm đã nằm trong `npmSpec`, ví dụ `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức nên ghép thông số chính xác với `expectedIntegrity` để các luồng cập nhật đóng an toàn nếu tạo tác npm được tìm nạp không còn khớp với bản phát hành đã ghim. Quá trình làm quen ban đầu tương tác vẫn cung cấp các thông số npm từ sổ đăng ký đáng tin cậy, bao gồm tên gói thuần và dist-tag, để đảm bảo khả năng tương thích. Chẩn đoán danh mục có thể phân biệt nguồn lựa chọn mặc định chính xác, thả nổi, được ghim tính toàn vẹn, thiếu tính toàn vẹn, không khớp tên gói và không hợp lệ. Chẩn đoán cũng cảnh báo khi có `expectedIntegrity` nhưng không có nguồn npm hợp lệ để ghim. Khi có `expectedIntegrity`, các luồng cài đặt/cập nhật thực thi trường này; khi trường này bị bỏ qua, kết quả phân giải sổ đăng ký được ghi lại mà không có ghim tính toàn vẹn.

Các Plugin kênh nên cung cấp `openclaw.setupEntry` khi quá trình quét trạng thái, danh sách kênh hoặc SecretRef cần xác định các tài khoản đã cấu hình mà không tải toàn bộ runtime. Điểm vào thiết lập nên cung cấp siêu dữ liệu kênh cùng các bộ điều hợp cấu hình, trạng thái và bí mật an toàn cho thiết lập; giữ các máy khách mạng, trình lắng nghe Gateway và runtime truyền tải trong điểm vào tiện ích mở rộng chính.

Các trường điểm vào runtime không ghi đè việc kiểm tra ranh giới gói dành cho các trường điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể làm cho đường dẫn `openclaw.extensions` thoát ra ngoài trở thành có thể tải được.

`openclaw.install.allowInvalidConfigRecovery` có phạm vi hẹp một cách có chủ ý. Trường này không khiến mọi cấu hình bị hỏng đều có thể cài đặt. Hiện tại, trường này chỉ cho phép các luồng cài đặt khôi phục từ một số lỗi nâng cấp Plugin đi kèm đã lỗi thời cụ thể, chẳng hạn như thiếu đường dẫn Plugin đi kèm hoặc một mục `channels.<id>` đã lỗi thời cho chính Plugin đi kèm đó. Các lỗi cấu hình không liên quan vẫn chặn cài đặt và chuyển người vận hành đến `openclaw doctor --fix`.

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

Dùng trường này khi các luồng thiết lập, doctor, trạng thái hoặc kiểm tra hiện diện chỉ đọc cần một phép dò xác thực có/không với chi phí thấp trước khi toàn bộ Plugin kênh tải. Trạng thái xác thực được lưu bền không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật Plugin, sửa chữa các phần phụ thuộc runtime hoặc quyết định liệu runtime của kênh có nên tải hay không. Giá trị export đích nên là một hàm nhỏ chỉ đọc trạng thái được lưu bền; không định tuyến hàm này qua barrel runtime đầy đủ của kênh.

`openclaw.channel.configuredState` hỗ trợ các phép kiểm tra cấu hình với chi phí thấp. Ưu tiên siêu dữ liệu biến môi trường dạng khai báo khi các biến môi trường là đủ:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Dùng `env.allOf` khi mọi biến được liệt kê đều bắt buộc và `env.anyOf` khi chỉ cần bất kỳ một biến không rỗng nào. Nếu một phép kiểm tra nhỏ không thuộc runtime cần nhiều hơn siêu dữ liệu môi trường, hãy dùng `specifier` cùng `exportName` như minh họa cho `persistedAuthState`; khi có `env`, OpenClaw dùng trường này mà không tải mô-đun đó. Nếu phép kiểm tra cần phân giải cấu hình đầy đủ hoặc runtime thực của kênh, hãy giữ logic đó trong hook `config.hasConfiguredState` của Plugin.

## Thứ tự ưu tiên khám phá (id Plugin trùng lặp)

OpenClaw khám phá Plugin từ ba gốc, được kiểm tra theo thứ tự sau: các Plugin đi kèm được phân phối cùng OpenClaw, gốc cài đặt toàn cục (`~/.openclaw/extensions`) và gốc không gian làm việc hiện tại (`<workspace>/.openclaw/extensions`), cùng với mọi mục `plugins.load.paths` tường minh.

Nếu hai kết quả khám phá có cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ lại; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì được tải bên cạnh nó. Thứ tự ưu tiên từ cao xuống thấp:

1. **Được cấu hình chọn** — một đường dẫn được ghim tường minh trong `plugins.entries.<id>`
2. **Cài đặt toàn cục khớp với bản ghi cài đặt được theo dõi** — một Plugin được cài đặt qua `openclaw plugin install`/`openclaw plugin update` mà hệ thống theo dõi cài đặt của OpenClaw nhận diện cho cùng id đó, ngay cả khi id cũng thuộc về một Plugin đi kèm
3. **Đi kèm** — các Plugin được phân phối cùng OpenClaw
4. **Không gian làm việc** — các Plugin được khám phá tương đối với không gian làm việc hiện tại
5. Mọi ứng viên được khám phá khác

Hệ quả:

- Một bản sao rẽ nhánh hoặc lỗi thời của Plugin đi kèm, nằm ở trạng thái không được theo dõi trong không gian làm việc hoặc thư mục gốc toàn cục, sẽ không che khuất bản dựng đi kèm.
- Để ghi đè một Plugin đi kèm, hãy chạy `openclaw plugin install` cho id đó để bản cài đặt toàn cục được theo dõi có độ ưu tiên cao hơn bản sao đi kèm, hoặc ghim một đường dẫn cụ thể qua `plugins.entries.<id>` để đường dẫn đó được ưu tiên theo thứ tự ưu tiên do cấu hình lựa chọn.
- Các bản sao trùng lặp bị loại bỏ sẽ được ghi vào nhật ký để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao đã bị loại bỏ.
- Các ghi đè trùng lặp do cấu hình lựa chọn được mô tả là ghi đè rõ ràng trong chẩn đoán, nhưng vẫn đưa ra cảnh báo để các bản rẽ nhánh lỗi thời và trường hợp vô tình che khuất vẫn dễ nhận biết.

## Yêu cầu về JSON Schema

- **Mỗi Plugin phải cung cấp một JSON Schema**, ngay cả khi không chấp nhận cấu hình nào.
- Có thể sử dụng schema trống (ví dụ: `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực khi đọc/ghi cấu hình, không phải trong thời gian chạy.
- Khi mở rộng hoặc rẽ nhánh một Plugin đi kèm bằng các khóa cấu hình mới, hãy đồng thời cập nhật `openclaw.plugin.json` `configSchema` của Plugin đó. Schema của Plugin đi kèm được kiểm tra nghiêm ngặt, vì vậy việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi môi trường chạy của Plugin được tải.

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

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi manifest của Plugin. Nếu cùng id đó cũng xuất hiện trong `plugins.allow`, `plugins.entries` hoặc `plugins.installs` (một Plugin được tham chiếu nhưng hiện không thể được phát hiện), OpenClaw sẽ hạ cấp trường hợp này thành **cảnh báo**.
- `plugins.entries.<id>`, `plugins.allow` và `plugins.deny` tham chiếu đến id Plugin không xác định là **cảnh báo** ("mục cấu hình lỗi thời bị bỏ qua"), không phải lỗi, để việc nâng cấp và các Plugin đã bị xóa/đổi tên không ngăn Gateway khởi động.
- `plugins.slots.memory` tham chiếu đến id Plugin không xác định là **lỗi**, ngoại trừ Plugin bên ngoài chính thức `memory-lancedb` đã biết; trường hợp này chỉ đưa ra cảnh báo.
- Nếu một Plugin đã được cài đặt nhưng manifest hoặc schema bị hỏng hay bị thiếu, quá trình xác thực sẽ thất bại và Doctor sẽ báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình sẽ được giữ lại và **cảnh báo** sẽ hiển thị trong Doctor cùng nhật ký.

Xem [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration) để biết toàn bộ schema `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw gốc**, bao gồm cả các lần tải từ hệ thống tệp cục bộ. Môi trường chạy vẫn tải riêng mô-đun Plugin; manifest chỉ dùng cho việc phát hiện và xác thực.
- Manifest gốc được phân tích cú pháp bằng JSON5, do đó chấp nhận chú thích, dấu phẩy ở cuối và khóa không có dấu ngoặc kép, miễn là giá trị cuối cùng vẫn là một đối tượng.
- Trình tải manifest chỉ đọc các trường manifest đã được lập tài liệu. Tránh sử dụng khóa cấp cao nhất tùy chỉnh.
- `channels`, `providers`, `cliBackends` và `skills` đều có thể được bỏ qua khi Plugin không cần đến chúng.
- `providerCatalogEntry` phải luôn gọn nhẹ và không nên nhập mã thời gian chạy có phạm vi rộng; hãy dùng nó cho siêu dữ liệu danh mục nhà cung cấp tĩnh hoặc các bộ mô tả phát hiện có phạm vi hẹp, không dùng để thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory` (mặc định `memory-core`), `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Hãy khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` tại điểm vào thời gian chạy đã không còn được khuyến nghị và chỉ được giữ lại làm phương án dự phòng tương thích cho các Plugin cũ.
- Siêu dữ liệu biến môi trường trong `setup.providers[].envVars` chỉ mang tính khai báo. Trạng thái, kiểm tra, xác thực phân phối Cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy và kích hoạt hiệu lực của Plugin trước khi coi một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn thời gian chạy cần mã nhà cung cấp, hãy xem [hook thời gian chạy của nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào các mô-đun gốc, hãy lập tài liệu về các bước dựng và mọi yêu cầu đối với danh sách cho phép của trình quản lý gói (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu sử dụng Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình khả năng.
  </Card>
  <Card title="Tổng quan về SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tài liệu tham chiếu SDK của Plugin và các lệnh nhập đường dẫn con.
  </Card>
</CardGroup>
