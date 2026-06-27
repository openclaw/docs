---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành một lược đồ cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về manifest Plugin + schema JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **manifest Plugin OpenClaw gốc**.

Để biết các bố cục gói tương thích, xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích sử dụng các tệp manifest khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có manifest
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả tại đây.

Đối với các gói tương thích, OpenClaw hiện đọc siêu dữ liệu gói cùng với các
gốc skill đã khai báo, gốc lệnh Claude, mặc định `settings.json` của gói Claude,
mặc định LSP của gói Claude, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mỗi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**gốc Plugin**. OpenClaw dùng manifest này để xác thực cấu hình
**mà không thực thi mã Plugin**. Manifest bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và sẽ chặn việc xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugin](/vi/tools/plugin).
Đối với mô hình năng lực gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là siêu dữ liệu mà OpenClaw đọc **trước khi tải mã
Plugin của bạn**. Mọi nội dung bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime Plugin.

**Dùng nó cho:**

- danh tính Plugin, xác thực cấu hình, và gợi ý giao diện cấu hình
- siêu dữ liệu xác thực, onboarding, và thiết lập (bí danh, tự động bật, biến môi trường provider, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu shorthand của họ mô hình
- ảnh chụp tĩnh về quyền sở hữu năng lực (`contracts`)
- siêu dữ liệu trình chạy QA mà host `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình riêng theo kênh được hợp nhất vào các bề mặt catalog và xác thực

**Không dùng nó cho:** đăng ký hành vi runtime, khai báo entrypoint mã,
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

## Tham chiếu trường cấp cao nhất

| Trường                               | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | ID Plugin chuẩn. Đây là ID được dùng trong `plugins.entries.<id>`.                                                                                                                                                                                   |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                                   |
| `requiresPlugins`                    | Không    | `string[]`                       | ID Plugin cũng phải được cài đặt để Plugin này có hiệu lực. Cơ chế khám phá vẫn giữ Plugin có thể tải được nhưng cảnh báo khi thiếu bất kỳ Plugin bắt buộc nào.                                                                                      |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị không phải `true` nào, để giữ Plugin bị tắt theo mặc định.                                                                                          |
| `enabledByDefaultOnPlatforms`        | Không    | `string[]`                       | Đánh dấu một Plugin đi kèm là được bật theo mặc định chỉ trên các nền tảng Node.js được liệt kê, ví dụ `["darwin"]`. Cấu hình tường minh vẫn được ưu tiên.                                                                                            |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các ID cũ được chuẩn hóa thành ID Plugin chuẩn này.                                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | ID nhà cung cấp sẽ tự động bật Plugin này khi xác thực, cấu hình hoặc tham chiếu mô hình đề cập đến chúng.                                                                                                                                            |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                                                      |
| `channels`                           | Không    | `string[]`                       | ID kênh do Plugin này sở hữu. Được dùng để khám phá và xác thực cấu hình.                                                                                                                                                                            |
| `providers`                          | Không    | `string[]`                       | ID nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                                                |
| `providerCatalogEntry`               | Không    | `string`                         | Đường dẫn mô-đun catalog nhà cung cấp gọn nhẹ, tương đối với gốc Plugin, cho siêu dữ liệu catalog nhà cung cấp theo phạm vi manifest có thể được tải mà không kích hoạt toàn bộ thời gian chạy Plugin.                                               |
| `modelSupport`                       | Không    | `object`                         | Siêu dữ liệu họ mô hình dạng rút gọn do manifest sở hữu, dùng để tự động tải Plugin trước thời gian chạy.                                                                                                                                             |
| `modelCatalog`                       | Không    | `object`                         | Siêu dữ liệu catalog mô hình dạng khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, hướng dẫn thiết lập, bộ chọn mô hình, bí danh và chặn trong tương lai mà không tải thời gian chạy Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng nó để loại nhà cung cấp cục bộ/tự lưu trữ khỏi catalog giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp sang ID catalog OpenRouter/LiteLLM mà không mã hóa cứng ID nhà cung cấp trong lõi. |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp bí danh/tiền tố ID mô hình do nhà cung cấp sở hữu, phải chạy trước khi thời gian chạy của nhà cung cấp tải.                                                                                                                                   |
| `providerEndpoints`                  | Không    | `object[]`                       | Siêu dữ liệu máy chủ/baseUrl endpoint do manifest sở hữu cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi thời gian chạy của nhà cung cấp tải.                                                                                             |
| `providerRequest`                    | Không    | `object`                         | Siêu dữ liệu nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung dùng trước khi thời gian chạy của nhà cung cấp tải.                                                                                                |
| `secretProviderIntegrations`         | Không    | `Record<string, object>`         | Các preset nhà cung cấp SecretRef exec dạng khai báo mà bề mặt thiết lập hoặc cài đặt có thể cung cấp mà không mã hóa cứng tích hợp dành riêng cho nhà cung cấp trong lõi.                                                                            |
| `cliBackends`                        | Không    | `string[]`                       | ID backend suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt lúc khởi động từ các tham chiếu cấu hình tường minh.                                                                                                                    |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Tham chiếu nhà cung cấp hoặc backend CLI có hook xác thực tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình khi khởi động lạnh trước khi thời gian chạy tải.                                                               |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Giá trị khóa API giữ chỗ do Plugin đi kèm sở hữu, đại diện cho trạng thái thông tin xác thực cục bộ không bí mật, OAuth hoặc thông tin xác thực môi trường.                                                                                          |
| `commandAliases`                     | Không    | `object[]`                       | Tên lệnh do Plugin này sở hữu, cần tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi thời gian chạy tải.                                                                                                                                    |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Siêu dữ liệu env tương thích đã lỗi thời cho việc tra cứu xác thực/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn ngừng hỗ trợ.                                           |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | ID nhà cung cấp nên dùng lại ID nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình chia sẻ khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                                                    |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Siêu dữ liệu env kênh nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng trường này cho bề mặt thiết lập hoặc xác thực kênh dựa trên env mà các helper khởi động/cấu hình chung cần thấy.                                                |
| `providerAuthChoices`                | Không    | `object[]`                       | Siêu dữ liệu lựa chọn xác thực nhẹ cho bộ chọn hướng dẫn thiết lập, phân giải nhà cung cấp ưu tiên và nối dây cờ CLI đơn giản.                                                                                                                       |
| `activation`                         | Không    | `object`                         | Siêu dữ liệu bộ lập kế hoạch kích hoạt nhẹ cho việc tải lúc khởi động, nhà cung cấp, lệnh, kênh, tuyến và khả năng kích hoạt theo năng lực. Chỉ là siêu dữ liệu; thời gian chạy Plugin vẫn sở hữu hành vi thực tế.                                  |
| `setup`                              | Không    | `object`                         | Bộ mô tả thiết lập/hướng dẫn thiết lập nhẹ mà cơ chế khám phá và các bề mặt thiết lập có thể kiểm tra mà không tải thời gian chạy Plugin.                                                                                                           |
| `qaRunners`                          | Không    | `object[]`                       | Bộ mô tả trình chạy QA nhẹ được máy chủ `openclaw qa` dùng chung trước khi thời gian chạy Plugin tải.                                                                                                                                                |
| `contracts`                          | Không    | `object`                         | Ảnh chụp tĩnh về quyền sở hữu năng lực cho hook xác thực bên ngoài, embedding, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, tìm nạp web, tìm kiếm web và quyền sở hữu công cụ.          |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Mặc định hiểu phương tiện nhẹ cho ID nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                                       |
| `imageGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo ảnh nhẹ cho ID nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm bí danh xác thực và bộ bảo vệ base-url do nhà cung cấp sở hữu.                                                              |
| `videoGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo video nhẹ cho ID nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm bí danh xác thực và bộ bảo vệ base-url do nhà cung cấp sở hữu.                                                            |
| `musicGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu xác thực tạo nhạc nhẹ cho ID nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm bí danh xác thực và bộ bảo vệ base-url do nhà cung cấp sở hữu.                                                            |
| `toolMetadata`                       | Không       | `Record<string, object>`         | Siêu dữ liệu về tính khả dụng có chi phí thấp cho các công cụ do Plugin sở hữu được khai báo trong `contracts.tools`. Dùng trường này khi công cụ không nên tải thời gian chạy trừ khi có bằng chứng về cấu hình, biến môi trường hoặc xác thực.                                                                       |
| `channelConfigs`                     | Không       | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do manifest sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi thời gian chạy tải.                                                                                                                                      |
| `skills`                             | Không       | `string[]`                       | Các thư mục Skills cần tải, tương đối với gốc Plugin.                                                                                                                                                                                         |
| `name`                               | Không       | `string`                         | Tên Plugin dễ đọc đối với con người.                                                                                                                                                                                                                     |
| `description`                        | Không       | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                                         |
| `icon`                               | Không       | `string`                         | URL hình ảnh HTTPS cho thẻ marketplace/catalog. ClawHub chấp nhận mọi URL `https://` hợp lệ và quay về biểu tượng Plugin mặc định khi trường này bị bỏ qua hoặc không hợp lệ.                                                                              |
| `version`                            | Không       | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                                                   |
| `uiHints`                            | Không       | `Record<string, object>`         | Nhãn UI, placeholder và gợi ý về độ nhạy cho các trường cấu hình.                                                                                                                                                                               |

## Tham chiếu siêu dữ liệu nhà cung cấp tạo sinh

Các trường siêu dữ liệu nhà cung cấp tạo sinh mô tả những tín hiệu xác thực tĩnh cho
các nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng.
OpenClaw đọc các trường này trước khi tải runtime của nhà cung cấp để các công cụ lõi có thể
quyết định liệu một nhà cung cấp tạo sinh có sẵn sàng hay không mà không cần nhập mọi
plugin nhà cung cấp.

Chỉ dùng các trường này cho những dữ kiện khai báo, chi phí thấp. Truyền tải, biến đổi
yêu cầu, làm mới token, xác thực thông tin đăng nhập và hành vi tạo sinh thực tế
nằm trong runtime của plugin.

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

| Trường                 | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                 |
| ---------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Không    | `string[]` | Các id nhà cung cấp bổ sung cần được tính là alias xác thực tĩnh cho nhà cung cấp tạo sinh.                                                            |
| `authProviders`        | Không    | `string[]` | Các id nhà cung cấp có hồ sơ xác thực đã cấu hình cần được tính là xác thực cho nhà cung cấp tạo sinh này.                                               |
| `configSignals`        | Không    | `object[]` | Các tín hiệu sẵn sàng chỉ dựa trên cấu hình, chi phí thấp, cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể được cấu hình mà không cần hồ sơ xác thực hoặc biến môi trường. |
| `authSignals`          | Không    | `object[]` | Các tín hiệu xác thực tường minh. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ id nhà cung cấp, `aliases` và `authProviders`.                    |
| `referenceAudioInputs` | Không    | `boolean`  | Chỉ dành cho tạo video. Đặt thành `true` khi nhà cung cấp chấp nhận tài nguyên âm thanh tham chiếu; nếu không `video_generate` sẽ ẩn các tham số tham chiếu âm thanh. |

Mỗi mục `configSignals` hỗ trợ:

| Trường           | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                   |
| ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Có       | `string`   | Đường dẫn dạng dấu chấm tới đối tượng cấu hình do plugin sở hữu để kiểm tra, ví dụ `plugins.entries.example.config`.                                                     |
| `overlayPath`    | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình gốc có đối tượng sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng trường này cho cấu hình theo năng lực như `image`, `video` hoặc `music`. |
| `overlayMapPath` | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình gốc có các giá trị đối tượng, mỗi giá trị sẽ phủ lên đối tượng gốc. Dùng trường này cho map tài khoản được đặt tên như `accounts`, trong đó bất kỳ tài khoản nào đã cấu hình cũng đủ điều kiện. |
| `required`       | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực phải có giá trị đã cấu hình. Chuỗi không được rỗng; đối tượng và mảng không được rỗng.                            |
| `requiredAny`    | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                      |
| `mode`           | Không    | `object`   | Bộ bảo vệ chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng trường này khi trạng thái sẵn sàng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                  |

Mỗi bộ bảo vệ `mode` hỗ trợ:

| Trường       | Bắt buộc | Kiểu       | Ý nghĩa                                                                                   |
| ------------ | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `path`       | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.                  |
| `default`    | Không    | `string`   | Giá trị chế độ dùng khi cấu hình bỏ qua đường dẫn.                                        |
| `allowed`    | Không    | `string[]` | Nếu có, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.                |
| `disallowed` | Không    | `string[]` | Nếu có, tín hiệu không đạt khi chế độ hiệu lực là một trong các giá trị này.              |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                              |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string` | Id nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                   |
| `providerBaseUrl` | Không    | `object` | Bộ bảo vệ tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu dùng URL cơ sở được phép. Dùng trường này khi alias xác thực chỉ hợp lệ cho một số API nhất định. |

Mỗi bộ bảo vệ `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                              |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string`   | Id cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                             |
| `defaultBaseUrl`  | Không    | `string`   | URL cơ sở giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                       |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp với một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu siêu dữ liệu công cụ

`toolMetadata` dùng cùng các dạng `configSignals` và `authSignals` như
siêu dữ liệu nhà cung cấp tạo sinh, được khóa theo tên công cụ. `contracts.tools` khai báo
quyền sở hữu. `toolMetadata` khai báo bằng chứng sẵn sàng chi phí thấp để OpenClaw có thể
tránh nhập runtime của plugin chỉ để factory công cụ của nó trả về `null`.

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

Nếu một công cụ không có `toolMetadata`, OpenClaw giữ nguyên hành vi hiện có và
tải plugin sở hữu khi hợp đồng công cụ khớp với chính sách. Với các công cụ trên đường dẫn nóng
có factory phụ thuộc vào xác thực/cấu hình, tác giả plugin nên khai báo
`toolMetadata` thay vì khiến lõi nhập runtime để hỏi.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn onboarding hoặc xác thực.
OpenClaw đọc mục này trước khi tải runtime của nhà cung cấp.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn trong manifest này, các lựa chọn thiết lập
suy ra từ descriptor và siêu dữ liệu danh mục cài đặt mà không cần tải runtime của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                                                  | Ý nghĩa                                                                                                                   |
| --------------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                                              | id của nhà cung cấp mà lựa chọn này thuộc về.                                                                             |
| `method`              | Có       | `string`                                                              | id phương thức xác thực để điều phối tới.                                                                                 |
| `choiceId`            | Có       | `string`                                                              | id lựa chọn xác thực ổn định được các luồng hướng dẫn khởi tạo và CLI sử dụng.                                            |
| `choiceLabel`         | Không    | `string`                                                              | Nhãn hiển thị cho người dùng. Nếu bị bỏ qua, OpenClaw sẽ dùng lại `choiceId`.                                             |
| `choiceHint`          | Không    | `string`                                                              | Văn bản trợ giúp ngắn cho bộ chọn.                                                                                        |
| `assistantPriority`   | Không    | `number`                                                              | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.                                   |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                                        | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                                        |
| `deprecatedChoiceIds` | Không    | `string[]`                                                            | Các id lựa chọn cũ nên chuyển hướng người dùng sang lựa chọn thay thế này.                                                |
| `groupId`             | Không    | `string`                                                              | id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                                          |
| `groupLabel`          | Không    | `string`                                                              | Nhãn hiển thị cho người dùng của nhóm đó.                                                                                 |
| `groupHint`           | Không    | `string`                                                              | Văn bản trợ giúp ngắn cho nhóm.                                                                                           |
| `optionKey`           | Không    | `string`                                                              | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                                              |
| `cliFlag`             | Không    | `string`                                                              | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                                         |
| `cliOption`           | Không    | `string`                                                              | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                                     |
| `cliDescription`      | Không    | `string`                                                              | Mô tả được dùng trong trợ giúp CLI.                                                                                        |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Các bề mặt hướng dẫn khởi tạo mà lựa chọn này nên xuất hiện. Nếu bị bỏ qua, mặc định là `["text-inference"]`.             |

## Tham chiếu commandAliases

Sử dụng `commandAliases` khi một Plugin sở hữu tên lệnh thời gian chạy mà người dùng có thể
nhầm lẫn đưa vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw
sử dụng siêu dữ liệu này cho chẩn đoán mà không nhập mã thời gian chạy của Plugin.

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

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                  |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Có       | `string`          | Tên lệnh thuộc về Plugin này.                                            |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong trò chuyện thay vì lệnh CLI gốc. |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có.            |

## Tham chiếu activation

Sử dụng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện mặt phẳng điều khiển
nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu cho bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký
hành vi thời gian chạy, không thay thế `register(...)`, và không hứa rằng
mã Plugin đã được thực thi. Bộ lập kế hoạch kích hoạt sử dụng các trường này để
thu hẹp các Plugin ứng viên trước khi quay lại siêu dữ liệu quyền sở hữu manifest hiện có
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Sử dụng
`providers`, `channels`, `commandAliases`, bộ mô tả thiết lập, hoặc `contracts`
khi các trường đó biểu đạt mối quan hệ. Sử dụng `activation` cho các gợi ý bổ sung
cho bộ lập kế hoạch không thể được biểu diễn bằng các trường quyền sở hữu đó.
Sử dụng `cliBackends` cấp cao nhất cho bí danh thời gian chạy CLI như `claude-cli`,
`my-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
id bộ harness tác tử nhúng chưa có trường quyền sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi thời gian chạy, và không
thay thế `register(...)`, `setupEntry`, hoặc các điểm vào thời gian chạy/Plugin khác.
Các thành phần tiêu thụ hiện tại sử dụng nó như một gợi ý thu hẹp trước khi tải Plugin rộng hơn, vì vậy
thiếu siêu dữ liệu kích hoạt không phải khi khởi động thường chỉ ảnh hưởng đến hiệu năng; nó
không nên thay đổi tính đúng đắn khi các đường dự phòng quyền sở hữu manifest vẫn tồn tại.

Mỗi Plugin nên đặt `activation.onStartup` một cách có chủ đích. Đặt thành `true`
chỉ khi Plugin phải chạy trong lúc Gateway khởi động. Đặt thành `false` khi
Plugin không hoạt động khi khởi động và chỉ nên tải từ các trình kích hoạt hẹp hơn.
Việc bỏ qua `onStartup` không còn ngầm tải Plugin khi khởi động; hãy dùng siêu dữ liệu
kích hoạt tường minh cho các trình kích hoạt khởi động, kênh, cấu hình, agent-harness, bộ nhớ, hoặc
các trình kích hoạt hẹp hơn khác.

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

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                                 |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt khởi động Gateway tường minh. Mỗi Plugin nên đặt trường này. `true` nhập Plugin trong lúc khởi động; `false` giữ nó không tải khi khởi động trừ khi một trình kích hoạt khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Các id nhà cung cấp nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                      |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các id thời gian chạy harness tác tử nhúng nên đưa Plugin này vào kế hoạch kích hoạt/tải. Sử dụng `cliBackends` cấp cao nhất cho bí danh backend CLI.                                                   |
| `onCommands`       | Không    | `string[]`                                           | Các id lệnh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                              |
| `onChannels`       | Không    | `string[]`                                           | Các id kênh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                              |
| `onRoutes`         | Không    | `string[]`                                           | Các loại tuyến nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                           |
| `onConfigPaths`    | Không    | `string[]`                                           | Các đường dẫn cấu hình tương đối với gốc nên đưa Plugin này vào kế hoạch khởi động/tải khi đường dẫn hiện diện và không bị tắt tường minh.                                                             |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Các gợi ý năng lực rộng được dùng bởi lập kế hoạch kích hoạt mặt phẳng điều khiển. Ưu tiên các trường hẹp hơn khi có thể.                                                                               |

Các thành phần tiêu thụ hiện đang hoạt động:

- Lập kế hoạch khởi động Gateway sử dụng `activation.onStartup` để nhập khi khởi động
  một cách tường minh
- Lập kế hoạch CLI do lệnh kích hoạt quay lại cơ chế cũ
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- Lập kế hoạch khởi động thời gian chạy tác tử sử dụng `activation.onAgentHarnesses` cho
  harness nhúng và `cliBackends[]` cấp cao nhất cho bí danh thời gian chạy CLI
- Lập kế hoạch thiết lập/kênh do kênh kích hoạt quay lại quyền sở hữu `channels[]`
  cũ khi thiếu siêu dữ liệu kích hoạt kênh tường minh
- Lập kế hoạch Plugin khởi động sử dụng `activation.onConfigPaths` cho các bề mặt cấu hình gốc
  không phải kênh, chẳng hạn như khối `browser` của Plugin trình duyệt được đóng gói
- Lập kế hoạch thiết lập/thời gian chạy do nhà cung cấp kích hoạt quay lại quyền sở hữu
  `providers[]` và `cliBackends[]` cấp cao nhất cũ khi thiếu siêu dữ liệu kích hoạt nhà cung cấp
  tường minh

Chẩn đoán của bộ lập kế hoạch có thể phân biệt gợi ý kích hoạt tường minh với đường dự phòng
quyền sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là
bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho
chẩn đoán và kiểm thử của host; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu
mô tả quyền sở hữu tốt nhất.

## Tham chiếu qaRunners

Sử dụng `qaRunners` khi một Plugin đóng góp một hoặc nhiều trình chạy vận chuyển bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; thời gian chạy Plugin
vẫn sở hữu việc đăng ký CLI thực tế thông qua một bề mặt
`runtime-api.ts` nhẹ xuất `qaRunnerCliRegistrations`.

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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                              |
| ------------- | -------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.            |
| `description` | Không    | `string` | Văn bản trợ giúp dự phòng dùng khi máy chủ chung cần lệnh giữ chỗ.   |

## Tham chiếu setup

Dùng `setup` khi các bề mặt thiết lập và onboarding cần siêu dữ liệu rẻ do Plugin sở hữu
trước khi môi trường chạy tải.

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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các phần phụ trợ suy luận
CLI. `setup.cliBackends` là bề mặt mô tả riêng cho thiết lập dành cho
các luồng mặt phẳng điều khiển/thiết lập chỉ nên giữ ở dạng siêu dữ liệu.

Khi có mặt, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên
bộ mô tả được khuyến nghị cho khám phá thiết lập. Nếu bộ mô tả chỉ
thu hẹp Plugin ứng viên và thiết lập vẫn cần các hook thời điểm thiết lập phong phú hơn,
đặt `requiresRuntime: true` và giữ `setup-api` làm
đường thực thi dự phòng.

OpenClaw cũng bao gồm `setup.providers[].envVars` trong xác thực nhà cung cấp chung và
các tra cứu biến môi trường. `providerAuthEnvVars` vẫn được hỗ trợ thông qua một bộ điều hợp
tương thích trong thời gian ngừng hỗ trợ, nhưng các Plugin không đi kèm vẫn dùng nó
sẽ nhận chẩn đoán manifest. Plugin mới nên đặt siêu dữ liệu môi trường thiết lập/trạng thái
trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn thiết lập đơn giản từ `setup.providers[].authMethods`
khi không có mục thiết lập nào, hoặc khi `setup.requiresRuntime: false`
khai báo không cần môi trường chạy thiết lập. Các mục `providerAuthChoices` tường minh vẫn
được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding và siêu dữ liệu trợ lý.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó là đủ cho bề mặt
thiết lập. OpenClaw xem `false` tường minh là hợp đồng chỉ dùng bộ mô tả
và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` cho tra cứu thiết lập. Nếu
một Plugin chỉ dùng bộ mô tả vẫn phát hành một trong các mục môi trường chạy thiết lập đó,
OpenClaw báo cáo chẩn đoán bổ sung và tiếp tục bỏ qua nó. Việc bỏ qua
`requiresRuntime` giữ hành vi dự phòng kế thừa để các Plugin hiện có đã thêm
bộ mô tả mà không có cờ này không bị hỏng.

Vì tra cứu thiết lập có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị
`setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy nhất trên toàn bộ
các Plugin được phát hiện. Quyền sở hữu mơ hồ sẽ lỗi theo hướng đóng an toàn thay vì chọn
một bên thắng dựa trên thứ tự khám phá.

Khi môi trường chạy thiết lập thực thi, chẩn đoán sổ đăng ký thiết lập sẽ báo cáo độ lệch bộ mô tả
nếu `setup-api` đăng ký một nhà cung cấp hoặc phần phụ trợ CLI mà các bộ mô tả
manifest không khai báo, hoặc nếu một bộ mô tả không có đăng ký môi trường chạy
tương ứng. Các chẩn đoán này là bổ sung và không từ chối Plugin kế thừa.

### Tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                              |
| -------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Mã định danh nhà cung cấp được phơi bày trong thiết lập hoặc onboarding. Giữ các mã định danh đã chuẩn hóa duy nhất toàn cục. |
| `authMethods`  | Không    | `string[]` | Mã định danh phương thức thiết lập/xác thực mà nhà cung cấp này hỗ trợ mà không cần tải toàn bộ môi trường chạy. |
| `envVars`      | Không    | `string[]` | Các biến môi trường mà bề mặt thiết lập/trạng thái chung có thể kiểm tra trước khi môi trường chạy Plugin tải. |
| `authEvidence` | Không    | `object[]` | Các kiểm tra bằng chứng xác thực cục bộ rẻ cho nhà cung cấp có thể xác thực thông qua dấu mốc không bí mật. |

`authEvidence` dành cho các dấu mốc thông tin xác thực cục bộ do nhà cung cấp sở hữu, có thể được
xác minh mà không cần tải mã môi trường chạy. Các kiểm tra này phải luôn rẻ và cục bộ:
không gọi mạng, không đọc keychain hoặc trình quản lý bí mật, không chạy lệnh shell và không
thăm dò API nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                      |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Có       | `string`   | Hiện là `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Không    | `string`   | Biến môi trường chứa đường dẫn tệp thông tin xác thực tường minh.                                            |
| `fallbackPaths`    | Không    | `string[]` | Đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc trống. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không    | `string[]` | Ít nhất một biến môi trường được liệt kê phải không trống trước khi bằng chứng hợp lệ.                       |
| `requiresAllEnv`   | Không    | `string[]` | Mọi biến môi trường được liệt kê phải không trống trước khi bằng chứng hợp lệ.                               |
| `credentialMarker` | Có       | `string`   | Dấu mốc không bí mật được trả về khi bằng chứng hiện diện.                                                   |
| `source`           | Không    | `string`   | Nhãn nguồn hướng tới người dùng cho đầu ra xác thực/trạng thái.                                              |

### Các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                         |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Bộ mô tả thiết lập nhà cung cấp được phơi bày trong thiết lập và onboarding.                    |
| `cliBackends`      | Không    | `string[]` | Mã định danh phần phụ trợ thời điểm thiết lập dùng cho tra cứu thiết lập ưu tiên bộ mô tả. Giữ mã định danh đã chuẩn hóa duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | Mã định danh di chuyển cấu hình do bề mặt thiết lập của Plugin này sở hữu.                      |
| `requiresRuntime`  | Không    | `boolean`  | Thiết lập có còn cần thực thi `setup-api` sau tra cứu bộ mô tả hay không.                       |

## Tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình tới các gợi ý kết xuất nhỏ.

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

| Trường        | Kiểu       | Ý nghĩa                                   |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Nhãn trường hướng tới người dùng.         |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                    |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                          |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.              |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.  |
| `placeholder` | `string`   | Văn bản giữ chỗ cho đầu vào biểu mẫu.     |

## Tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu quyền sở hữu năng lực tĩnh mà OpenClaw có thể
đọc mà không cần nhập môi trường chạy Plugin.

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
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Mỗi danh sách là tùy chọn:

| Trường                           | Kiểu       | Ý nghĩa                                                                                                                              |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Các id factory tiện ích mở rộng app-server Codex, hiện là `codex-app-server`.                                                        |
| `agentToolResultMiddleware`      | `string[]` | Các id runtime mà Plugin này có thể đăng ký middleware kết quả công cụ cho chúng.                                                     |
| `trustedToolPolicies`            | `string[]` | Các id chính sách trước công cụ đáng tin cậy cục bộ trong Plugin mà một Plugin đã cài đặt có thể đăng ký. Plugin đi kèm có thể đăng ký chính sách mà không cần trường này. |
| `externalAuthProviders`          | `string[]` | Các id nhà cung cấp có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.                                                           |
| `embeddingProviders`             | `string[]` | Các id nhà cung cấp embedding chung mà Plugin này sở hữu để dùng embedding vector có thể tái sử dụng, bao gồm bộ nhớ.                |
| `speechProviders`                | `string[]` | Các id nhà cung cấp giọng nói mà Plugin này sở hữu.                                                                                  |
| `realtimeTranscriptionProviders` | `string[]` | Các id nhà cung cấp phiên âm thời gian thực mà Plugin này sở hữu.                                                                    |
| `realtimeVoiceProviders`         | `string[]` | Các id nhà cung cấp giọng nói thời gian thực mà Plugin này sở hữu.                                                                   |
| `memoryEmbeddingProviders`       | `string[]` | Các id nhà cung cấp embedding dành riêng cho bộ nhớ đã lỗi thời mà Plugin này sở hữu.                                                |
| `mediaUnderstandingProviders`    | `string[]` | Các id nhà cung cấp hiểu nội dung đa phương tiện mà Plugin này sở hữu.                                                               |
| `transcriptSourceProviders`      | `string[]` | Các id nhà cung cấp nguồn bản chép lời mà Plugin này sở hữu.                                                                         |
| `imageGenerationProviders`       | `string[]` | Các id nhà cung cấp tạo hình ảnh mà Plugin này sở hữu.                                                                               |
| `videoGenerationProviders`       | `string[]` | Các id nhà cung cấp tạo video mà Plugin này sở hữu.                                                                                  |
| `webFetchProviders`              | `string[]` | Các id nhà cung cấp tìm nạp web mà Plugin này sở hữu.                                                                                |
| `webSearchProviders`             | `string[]` | Các id nhà cung cấp tìm kiếm web mà Plugin này sở hữu.                                                                               |
| `migrationProviders`             | `string[]` | Các id nhà cung cấp nhập mà Plugin này sở hữu cho `openclaw migrate`.                                                                |
| `gatewayMethodDispatch`          | `string[]` | Quyền dành riêng cho các tuyến HTTP Plugin đã xác thực gửi phương thức Gateway trong tiến trình.                                      |
| `tools`                          | `string[]` | Tên công cụ agent mà Plugin này sở hữu.                                                                                              |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng
chỉ dành cho app-server Codex đi kèm. Các biến đổi kết quả công cụ đi kèm nên
khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay thế. Plugin đã cài đặt chỉ có thể dùng
cùng điểm nối middleware này khi được bật rõ ràng và chỉ cho các runtime mà chúng
khai báo trong `contracts.agentToolResultMiddleware`.

Plugin đã cài đặt cần tầng chính sách trước công cụ được máy chủ tin cậy phải khai báo
từng id cục bộ đã đăng ký trong `contracts.trustedToolPolicies` và được bật rõ ràng.
Plugin đi kèm giữ đường dẫn chính sách đáng tin cậy hiện có, nhưng Plugin đã cài đặt
có id chính sách chưa khai báo sẽ bị từ chối trước khi đăng ký. Id chính sách
được đặt phạm vi theo Plugin đăng ký, nên hai Plugin đều có thể khai báo và
đăng ký `workflow-budget`; một Plugin duy nhất không được đăng ký cùng một id cục bộ
hai lần.

Các đăng ký runtime `api.registerTool(...)` phải khớp với `contracts.tools`.
Khám phá công cụ dùng danh sách này để chỉ tải các runtime Plugin có thể sở hữu
các công cụ được yêu cầu.

Plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`; các hook xác thực bên ngoài chưa khai báo sẽ bị bỏ qua.

Nhà cung cấp embedding chung nên khai báo `contracts.embeddingProviders` cho
từng adapter được đăng ký bằng `api.registerEmbeddingProvider(...)`. Dùng
hợp đồng chung để tạo vector có thể tái sử dụng, bao gồm các nhà cung cấp được
tìm kiếm bộ nhớ tiêu thụ. `contracts.memoryEmbeddingProviders` là khả năng tương thích
dành riêng cho bộ nhớ đã lỗi thời và chỉ còn tồn tại trong khi các nhà cung cấp hiện có
di chuyển sang điểm nối nhà cung cấp embedding chung.

`contracts.gatewayMethodDispatch` hiện chấp nhận
`"authenticated-request"`. Đây là cổng vệ sinh API cho các tuyến HTTP Plugin gốc
cố ý gửi phương thức mặt phẳng điều khiển Gateway trong tiến trình, không phải
sandbox chống lại Plugin gốc độc hại. Chỉ dùng nó cho các bề mặt đi kèm/toán tử
được rà soát chặt chẽ và đã yêu cầu xác thực HTTP Gateway.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu nội dung đa phương tiện có
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

| Trường                 | Kiểu                                | Ý nghĩa                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Các năng lực đa phương tiện do nhà cung cấp này cung cấp.                    |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ năng lực sang mô hình, dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho dự phòng nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                               |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi Plugin kênh cần siêu dữ liệu cấu hình nhẹ trước khi
runtime tải. Khám phá thiết lập/trạng thái kênh chỉ đọc có thể dùng trực tiếp
siêu dữ liệu này cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập,
hoặc khi `setup.requiresRuntime: false` khai báo rằng runtime thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest Plugin, không phải một mục cấu hình người dùng
cấp cao mới. Người dùng vẫn cấu hình các phiên bản kênh trong `channels.<channel-id>`.
OpenClaw đọc siêu dữ liệu manifest để quyết định Plugin nào sở hữu kênh đã cấu hình đó
trước khi mã runtime Plugin thực thi.

Đối với Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` khớp. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng
schema cấu hình đường dẫn lạnh, thiết lập và các bề mặt Control UI không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi runtime Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo các mặc định `auto` tĩnh cho kiểm tra cấu hình lệnh
chạy trước khi runtime kênh tải. Các kênh đi kèm cũng có thể công bố
cùng các mặc định thông qua `package.json#openclaw.channel.commands` cùng với
siêu dữ liệu danh mục kênh khác do gói sở hữu.

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

| Trường        | Kiểu                     | Ý nghĩa                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho từng mục cấu hình kênh đã khai báo.       |
| `uiHints`     | `Record<string, object>` | Nhãn/gợi ý chỗ nhập/gợi ý nhạy cảm UI tùy chọn cho phần cấu hình kênh đó.               |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi siêu dữ liệu runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và danh mục.                                    |
| `commands`    | `object`                 | Mặc định tự động tĩnh cho lệnh gốc và kỹ năng gốc dùng trong kiểm tra cấu hình trước runtime. |
| `preferOver`  | `string[]`               | Các id Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên được ưu tiên hơn trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà
Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là id Plugin đã được đổi tên,
một Plugin độc lập thay thế một Plugin đi kèm, hoặc một nhánh rẽ được duy trì
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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả id kênh và
id Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì
nó đi kèm hoặc được bật theo mặc định, OpenClaw tắt nó trong cấu hình
runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn
rõ ràng của người dùng vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin được yêu cầu.

Giữ `preferOver` trong phạm vi các id Plugin thật sự có thể cung cấp cùng một kênh.
Đây không phải là trường ưu tiên chung và không đổi tên khóa cấu hình người dùng.

## Tham chiếu modelSupport

Sử dụng `modelSupport` khi OpenClaw cần suy luận provider plugin của bạn từ
các id mô hình dạng rút gọn như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi plugin runtime
tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên này:

- các tham chiếu `provider/model` tường minh sử dụng siêu dữ liệu manifest `providers` sở hữu
- `modelPatterns` ưu tiên hơn `modelPrefixes`
- nếu một plugin không được đóng gói kèm và một plugin được đóng gói kèm đều khớp, plugin không được đóng gói kèm
  sẽ thắng
- phần mơ hồ còn lại được bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một provider

Trường:

| Trường          | Kiểu      | Ý nghĩa                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với id mô hình dạng rút gọn.            |
| `modelPatterns` | `string[]` | Nguồn regex được khớp với id mô hình dạng rút gọn sau khi xóa hậu tố hồ sơ.     |

Các mục `modelPatterns` được biên dịch thông qua `compileSafeRegex`, cơ chế này từ chối
các mẫu chứa lặp lồng nhau (ví dụ `(a+)+$`). Các mẫu không vượt qua
kiểm tra an toàn sẽ bị bỏ qua im lặng, giống như regex không hợp lệ về cú pháp.
Giữ mẫu đơn giản và tránh các lượng từ lồng nhau.

## Tham chiếu modelCatalog

Sử dụng `modelCatalog` khi OpenClaw cần biết siêu dữ liệu mô hình của provider trước khi
tải plugin runtime. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định,
bí danh provider, quy tắc chặn hiển thị và chế độ khám phá. Việc làm mới runtime
vẫn thuộc về mã runtime của provider, nhưng manifest cho core biết khi nào cần runtime.

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

| Trường           | Kiểu                                                     | Ý nghĩa                                                                                                      |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Các hàng danh mục cho id provider do plugin này sở hữu. Khóa cũng nên xuất hiện trong `providers` cấp cao.  |
| `aliases`        | `Record<string, object>`                                 | Các bí danh provider nên phân giải về một provider sở hữu để lập kế hoạch danh mục hoặc chặn hiển thị.       |
| `suppressions`   | `object[]`                                               | Các hàng mô hình từ nguồn khác mà plugin này chặn hiển thị vì lý do riêng của provider.                      |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Danh mục provider có thể được đọc từ siêu dữ liệu manifest, làm mới vào bộ nhớ đệm, hay yêu cầu runtime.    |
| `runtimeAugment` | `boolean`                                                | Chỉ đặt thành `true` khi runtime của provider phải nối thêm các hàng danh mục sau bước lập kế hoạch manifest/config. |

`aliases` tham gia vào tra cứu quyền sở hữu provider để lập kế hoạch model-catalog.
Đích bí danh phải là các provider cấp cao do cùng plugin sở hữu. Khi một danh sách
được lọc theo provider dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng các ghi đè API/base URL của bí danh mà không cần tải runtime của provider.
Bí danh không mở rộng các danh sách danh mục không được lọc; các danh sách rộng chỉ phát ra
các hàng provider chính tắc sở hữu.

`suppressions` thay thế hook runtime provider cũ `suppressBuiltInModel`.
Các mục chặn hiển thị chỉ được tôn trọng khi provider do plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ tới một provider sở hữu. Các hook
chặn hiển thị runtime không còn được gọi trong quá trình phân giải mô hình.

Trường provider:

| Trường    | Kiểu                     | Ý nghĩa                                                              |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL cơ sở mặc định tùy chọn cho các mô hình trong danh mục provider này. |
| `api`     | `ModelApi`               | Bộ chuyển đổi API mặc định tùy chọn cho các mô hình trong danh mục provider này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục provider này.              |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Hàng không có `id` sẽ bị bỏ qua.          |

Trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id mô hình cục bộ theo provider, không có tiền tố `provider/`.               |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                       |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                       |
| `baseUrl`       | `string`                                                       | Ghi đè URL cơ sở tùy chọn theo từng mô hình.                                 |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn theo từng mô hình.                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức đầu vào mà mô hình chấp nhận.                                |
| `reasoning`     | `boolean`                                                      | Mô hình có cung cấp hành vi suy luận hay không.                              |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của provider.                                            |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu dụng tùy chọn khi khác với `contextWindow`.   |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết.                                             |
| `cost`          | `object`                                                       | Giá tùy chọn bằng USD trên một triệu token, bao gồm `tieredPricing` tùy chọn. |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ chặn hiển thị khi hàng tuyệt đối không được xuất hiện. |
| `statusReason`  | `string`                                                       | Lý do tùy chọn được hiển thị với trạng thái không khả dụng.                  |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ theo provider cũ hơn mà mô hình này thay thế.          |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ theo provider thay thế cho các hàng đã ngừng khuyến nghị.  |
| `tags`          | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc sử dụng.                              |

Trường chặn hiển thị:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                  |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id provider cho hàng upstream cần chặn hiển thị. Phải do plugin này sở hữu hoặc được khai báo là bí danh sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ theo provider cần chặn hiển thị.                                                       |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng bị chặn được yêu cầu trực tiếp.                                     |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host URL cơ sở provider hiệu dụng cần có trước khi áp dụng chặn hiển thị.         |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` cấu hình provider chính xác cần có trước khi áp dụng chặn hiển thị. |

Không đưa dữ liệu chỉ dành cho runtime vào `modelCatalog`. Chỉ dùng `static` khi các hàng
manifest đủ hoàn chỉnh để các bề mặt danh sách được lọc theo provider và bộ chọn có thể bỏ qua
khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là hạt giống hoặc phần bổ sung
hữu ích có thể liệt kê, nhưng thao tác làm mới/bộ nhớ đệm có thể thêm nhiều hàng hơn về sau;
các hàng refreshable tự chúng không có tính thẩm quyền. Dùng `runtime` khi OpenClaw
phải tải runtime của provider để biết danh sách.

## Tham chiếu modelIdNormalization

Sử dụng `modelIdNormalization` cho việc dọn dẹp id mô hình rẻ, do provider sở hữu, cần
xảy ra trước khi runtime của provider tải. Điều này giữ các bí danh như tên mô hình ngắn,
id kế thừa cục bộ theo provider, và quy tắc tiền tố proxy trong manifest của plugin sở hữu
thay vì trong các bảng chọn mô hình của core.

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

Trường provider:

| Trường                               | Kiểu                    | Ý nghĩa                                                                                 |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Bí danh id mô hình khớp chính xác, không phân biệt chữ hoa chữ thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`              | Tiền tố cần xóa trước khi tra cứu bí danh, hữu ích cho trùng lặp provider/model kế thừa. |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi id mô hình đã chuẩn hóa chưa chứa `/`.                             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc tiền tố id trần có điều kiện sau tra cứu bí danh, được khóa bằng `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Sử dụng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung
phải biết trước khi runtime của provider tải. Core vẫn sở hữu ý nghĩa của từng
`endpointClass`; manifest plugin sở hữu siêu dữ liệu host và URL cơ sở.

Các trường endpoint:

| Trường                         | Kiểu       | Ý nghĩa                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên máy chủ chính xác ánh xạ tới lớp endpoint.                                                  |
| `hostSuffixes`                 | `string[]` | Hậu tố máy chủ ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp theo hậu tố miền.         |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                              |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các máy chủ toàn cục chính xác.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các máy chủ khớp để lộ tiền tố vùng Google Vertex.                     |

## Tham chiếu providerRequest

Dùng `providerRequest` cho siêu dữ liệu tương thích yêu cầu có chi phí thấp mà chính sách yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ việc viết lại payload theo hành vi cụ thể trong các hook runtime của nhà cung cấp hoặc helper dùng chung theo họ nhà cung cấp.

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

Các trường nhà cung cấp:

| Trường                | Kiểu         | Ý nghĩa                                                                                         |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp dùng cho các quyết định tương thích yêu cầu chung và chẩn đoán.           |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích theo họ nhà cung cấp tùy chọn cho các helper yêu cầu dùng chung.              |
| `openAICompletions`   | `object`     | Cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.                    |

## Tham chiếu secretProviderIntegrations

Dùng `secretProviderIntegrations` khi một Plugin có thể công bố một preset nhà cung cấp exec SecretRef có thể tái sử dụng. OpenClaw đọc siêu dữ liệu này trước khi runtime Plugin tải, lưu quyền sở hữu Plugin trong `secrets.providers.<alias>.pluginIntegration`, và để runtime SecretRef xử lý việc phân giải bí mật thực tế. Các preset chỉ được phơi bày cho Plugin đóng gói sẵn và Plugin đã cài đặt được phát hiện từ các gốc cài đặt Plugin được quản lý, chẳng hạn như cài đặt qua git và ClawHub.

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

Khóa bản đồ là id tích hợp. Nếu bỏ qua `providerAlias`, OpenClaw dùng id tích hợp làm bí danh nhà cung cấp SecretRef. Bí danh nhà cung cấp phải khớp mẫu bí danh nhà cung cấp SecretRef thông thường, ví dụ `team-secrets` hoặc `onepassword-work`.

Khi người vận hành chọn preset, OpenClaw ghi một tham chiếu nhà cung cấp như sau:

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

Khi khởi động/tải lại, OpenClaw phân giải nhà cung cấp đó bằng cách tải siêu dữ liệu manifest Plugin hiện tại, kiểm tra Plugin sở hữu đã được cài đặt và đang hoạt động, rồi hiện thực hóa lệnh exec từ manifest. Việc tắt hoặc gỡ bỏ Plugin sẽ thu hồi nhà cung cấp cho các SecretRef đang hoạt động. Người vận hành muốn cấu hình exec độc lập vẫn có thể viết trực tiếp các nhà cung cấp `command`/`args` thủ công.

Hiện chỉ hỗ trợ các preset `source: "exec"`. `command` phải là `${node}`, và `args[0]` phải là một script phân giải tương đối với gốc Plugin dạng `./`. OpenClaw hiện thực hóa nó khi khởi động/tải lại thành tệp thực thi Node hiện tại và đường dẫn script tuyệt đối bên trong Plugin. Các tùy chọn Node như `--require`, `--import`, `--loader`, `--env-file`, `--eval`, và `--print` không thuộc hợp đồng preset manifest. Người vận hành cần lệnh không phải Node có thể cấu hình trực tiếp các nhà cung cấp exec thủ công độc lập.

OpenClaw suy ra `trustedDirs` cho preset manifest từ gốc Plugin và, với các preset `${node}`, từ thư mục tệp thực thi Node hiện tại. `trustedDirs` do manifest khai báo sẽ bị bỏ qua. Các tùy chọn nhà cung cấp exec khác như `timeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, và `allowInsecurePath` được chuyển tiếp sang cấu hình nhà cung cấp exec SecretRef thông thường.

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá control-plane trước khi runtime tải. Bộ nhớ đệm định giá Gateway đọc siêu dữ liệu này mà không nhập mã runtime của nhà cung cấp.

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

Các trường nhà cung cấp:

| Trường       | Kiểu              | Ý nghĩa                                                                                                    |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho các nhà cung cấp cục bộ/tự lưu trữ không bao giờ được lấy giá từ OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.                      |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.                            |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                                    |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id nhà cung cấp catalog bên ngoài khi khác với id nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`.             |
| `passthroughProviderModel` | `boolean`          | Xem các id mô hình chứa dấu gạch chéo là ref nhà cung cấp/mô hình lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể id mô hình catalog bên ngoài bổ sung. `version-dots` thử id phiên bản dạng dấu chấm như `claude-opus-4.6`.   |

### OpenClaw Provider Index

OpenClaw Provider Index là siêu dữ liệu xem trước do OpenClaw sở hữu cho các nhà cung cấp có Plugin có thể chưa được cài đặt. Nó không phải là một phần của manifest Plugin. Manifest Plugin vẫn là nguồn thẩm quyền cho Plugin đã cài đặt. Provider Index là hợp đồng dự phòng nội bộ mà các bề mặt chọn mô hình nhà cung cấp có thể cài đặt và trước khi cài đặt trong tương lai sẽ dùng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. Manifest `modelCatalog` của Plugin đã cài đặt.
3. Bộ nhớ đệm catalog mô hình từ lần làm mới rõ ràng.
4. Các hàng xem trước của OpenClaw Provider Index.

Provider Index không được chứa bí mật, trạng thái bật, hook runtime, hoặc dữ liệu mô hình trực tiếp theo tài khoản cụ thể. Catalog xem trước của nó dùng cùng hình dạng hàng nhà cung cấp `modelCatalog` như manifest Plugin, nhưng nên giới hạn ở siêu dữ liệu hiển thị ổn định trừ khi các trường adapter runtime như `api`, `baseUrl`, định giá, hoặc cờ tương thích được cố ý giữ đồng bộ với manifest Plugin đã cài đặt. Các nhà cung cấp có khám phá `/models` trực tiếp nên ghi các hàng đã làm mới qua đường dẫn bộ nhớ đệm catalog mô hình rõ ràng thay vì để thao tác liệt kê thông thường hoặc onboarding gọi API nhà cung cấp.

Mục Provider Index cũng có thể mang siêu dữ liệu Plugin có thể cài đặt cho các nhà cung cấp có Plugin đã được chuyển ra khỏi lõi hoặc hiện chưa được cài đặt. Siêu dữ liệu này phản chiếu mẫu catalog kênh: tên gói, đặc tả cài đặt npm, tính toàn vẹn dự kiến, và các nhãn lựa chọn xác thực chi phí thấp là đủ để hiển thị một tùy chọn thiết lập có thể cài đặt. Sau khi Plugin được cài đặt, manifest của nó thắng và mục Provider Index bị bỏ qua cho nhà cung cấp đó.

Các khóa năng lực cấp cao nhất cũ đã không còn được khuyến nghị. Dùng `openclaw doctor --fix` để chuyển `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; quá trình tải manifest thông thường không còn xem các trường cấp cao nhất đó là quyền sở hữu năng lực.

## Manifest so với package.json

Hai tệp này phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực, và gợi ý UI phải tồn tại trước khi mã Plugin chạy                 |
| `package.json`         | Siêu dữ liệu npm, cài đặt phụ thuộc, và khối `openclaw` dùng cho entrypoint, kiểm soát cài đặt, thiết lập, hoặc siêu dữ liệu catalog |

Nếu bạn không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số siêu dữ liệu Plugin trước runtime có chủ ý nằm trong `package.json` dưới khối `openclaw` thay vì `openclaw.plugin.json`.
`openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng Plugin của OpenClaw; các Plugin native phải dùng `openclaw.plugin.json` cộng với các trường `package.json#openclaw` được hỗ trợ bên dưới.

Ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Khai báo các điểm vào plugin native. Phải nằm trong thư mục gói plugin.                                                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Khai báo các điểm vào runtime JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói plugin.                                                                                  |
| `openclaw.setupEntry`                                                                      | Điểm vào nhẹ chỉ dành cho thiết lập, được dùng trong thiết lập ban đầu, khởi động kênh trì hoãn, và phát hiện trạng thái kênh/SecretRef chỉ đọc. Phải nằm trong thư mục gói plugin.          |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo điểm vào thiết lập JavaScript đã build cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại, và phải nằm trong thư mục gói plugin.                                             |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                                   |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu tĩnh về lệnh native và mặc định tự động của kỹ năng native, được dùng bởi cấu hình, kiểm tra, và các bề mặt danh sách lệnh trước khi runtime kênh tải.                           |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu nhẹ cho bộ kiểm tra trạng thái đã cấu hình, có thể trả lời "thiết lập chỉ bằng env đã tồn tại chưa?" mà không tải toàn bộ runtime kênh.                                          |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu nhẹ cho bộ kiểm tra xác thực đã lưu, có thể trả lời "đã có gì đăng nhập chưa?" mà không tải toàn bộ runtime kênh.                                                                |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho plugin được đóng gói kèm và plugin được phát hành bên ngoài.                                                                                                       |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt.                                                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                                 |
| `openclaw.compat.pluginApi`                                                                | Khoảng API plugin OpenClaw tối thiểu mà gói này yêu cầu, dùng ngưỡng semver như `>=2026.5.27`.                                                                                                |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi toàn vẹn npm dist dự kiến như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải về dựa trên chuỗi này.                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép đường dẫn khôi phục cài đặt lại hẹp cho plugin đóng gói kèm khi cấu hình không hợp lệ.                                                                                               |
| `openclaw.install.requiredPlatformPackages`                                                | Các bí danh gói npm phải hiện diện khi ràng buộc nền tảng trong lockfile của chúng khớp với host hiện tại.                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép các bề mặt kênh setup-runtime tải trước khi listen, rồi trì hoãn toàn bộ plugin kênh đã cấu hình cho đến khi kích hoạt sau listen.                                                   |

Siêu dữ liệu manifest quyết định các lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
thiết lập ban đầu trước khi runtime tải. `package.json#openclaw.install` cho
thiết lập ban đầu biết cách tải hoặc bật plugin đó khi người dùng chọn một trong
các lựa chọn này. Không chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và khi tải
registry manifest cho các nguồn plugin không đóng gói kèm. Giá trị không hợp lệ bị từ chối;
giá trị mới hơn nhưng hợp lệ sẽ bỏ qua plugin bên ngoài trên host cũ hơn. Plugin nguồn
đóng gói kèm được giả định là đồng phiên bản với checkout host.

`openclaw.install.requiredPlatformPackages` dành cho các gói npm cung cấp
binary native bắt buộc thông qua các bí danh tùy chọn, theo từng nền tảng. Liệt kê
tên gói npm trần cho mọi bí danh nền tảng được hỗ trợ. Trong quá trình cài đặt npm,
OpenClaw chỉ xác minh bí danh đã khai báo có ràng buộc lockfile khớp với
host hiện tại. Nếu npm báo thành công nhưng bỏ sót bí danh đó, OpenClaw thử lại một lần
với cache mới và rollback cài đặt nếu bí danh vẫn thiếu.

`openclaw.compat.pluginApi` được thực thi trong quá trình cài đặt gói cho các nguồn
plugin không đóng gói kèm. Dùng trường này cho ngưỡng API SDK/runtime plugin OpenClaw
mà gói được build dựa trên. Trường này có thể nghiêm ngặt hơn `minHostVersion` khi một
gói plugin cần API mới hơn nhưng vẫn giữ gợi ý cài đặt thấp hơn cho các
luồng khác. Đồng bộ bản phát hành OpenClaw chính thức mặc định nâng các ngưỡng API plugin chính thức hiện có
lên phiên bản phát hành OpenClaw, nhưng các bản phát hành chỉ dành cho plugin có thể giữ
ngưỡng thấp hơn khi gói cố ý hỗ trợ host cũ hơn. Không dùng riêng
phiên bản gói làm hợp đồng tương thích. `peerDependencies.openclaw`
vẫn là siêu dữ liệu gói npm; OpenClaw dùng hợp đồng `openclaw.compat.pluginApi`
để quyết định tương thích khi cài đặt.

Siêu dữ liệu cài đặt theo yêu cầu chính thức nên dùng `clawhubSpec` khi plugin được
phát hành trên ClawHub; thiết lập ban đầu xem đó là nguồn từ xa ưu tiên và
ghi lại thông tin artifact ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án dự phòng
tương thích cho các gói chưa chuyển sang ClawHub.

Ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức
nên ghép spec chính xác với `expectedIntegrity` để các luồng cập nhật thất bại an toàn
nếu artifact npm đã tải về không còn khớp với bản phát hành đã ghim.
Thiết lập ban đầu tương tác vẫn cung cấp các spec npm registry đáng tin cậy, bao gồm tên
gói trần và dist-tag, để tương thích. Chẩn đoán danh mục có thể
phân biệt nguồn chính xác, thả nổi, ghim toàn vẹn, thiếu toàn vẹn, sai khớp tên gói,
và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ nào để ghim.
Khi `expectedIntegrity` có mặt,
các luồng cài đặt/cập nhật thực thi nó; khi bị bỏ qua, kết quả phân giải registry được
ghi lại mà không có ghim toàn vẹn.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi các lần quét trạng thái, danh sách kênh,
hoặc SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
runtime. Điểm vào thiết lập nên cung cấp siêu dữ liệu kênh cùng adapter cấu hình,
trạng thái, và bí mật an toàn cho thiết lập; giữ client mạng, listener gateway, và
runtime transport trong điểm vào extension chính.

Các trường điểm vào runtime không ghi đè kiểm tra ranh giới gói cho các trường
điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể làm cho một đường dẫn
`openclaw.extensions` thoát khỏi phạm vi trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` được cố ý giữ hẹp. Nó không
làm cho mọi cấu hình hỏng bất kỳ trở nên cài đặt được. Hiện tại nó chỉ cho phép các
luồng cài đặt khôi phục từ các lỗi nâng cấp plugin đóng gói kèm cũ cụ thể, chẳng hạn
thiếu đường dẫn plugin đóng gói kèm hoặc mục `channels.<id>` cũ cho chính
plugin đóng gói kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và hướng người vận hành
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

Dùng trường này khi các luồng thiết lập, doctor, trạng thái, hoặc hiện diện chỉ đọc cần một phép dò
xác thực có/không rẻ trước khi toàn bộ plugin kênh tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật plugin,
sửa phụ thuộc runtime, hoặc quyết định runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` dùng cùng hình dạng cho các kiểm tra đã cấu hình
chỉ bằng env, chi phí thấp:

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

Dùng trường này khi một kênh có thể trả lời trạng thái đã cấu hình từ env hoặc các
đầu vào nhỏ không thuộc runtime khác. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc
runtime kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của plugin.

## Thứ tự ưu tiên phát hiện (id plugin trùng lặp)

OpenClaw phát hiện plugin từ nhiều gốc. Để biết thứ tự quét hệ thống tệp thô,
xem [Thứ tự quét plugin](/vi/gateway/configuration-reference#plugin-scan-order).
Nếu hai phát hiện có cùng `id`, chỉ manifest có **thứ tự ưu tiên cao nhất** được giữ;
các bản trùng lặp có thứ tự ưu tiên thấp hơn bị loại bỏ thay vì tải bên cạnh nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn bởi cấu hình** — một đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đóng gói kèm** — plugin được phát hành cùng OpenClaw
3. **Cài đặt toàn cục** — plugin được cài vào gốc plugin OpenClaw toàn cục
4. **Workspace** — plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc cũ của plugin đóng gói kèm nằm trong workspace sẽ không che khuất bản build đóng gói kèm.
- Để thật sự ghi đè một plugin đóng gói kèm bằng bản cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng nhờ thứ tự ưu tiên thay vì dựa vào phát hiện workspace.
- Các lần loại bỏ bản trùng lặp được ghi log để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao bị loại.
- Ghi đè bản trùng lặp được chọn bởi cấu hình được diễn đạt là ghi đè rõ ràng trong chẩn đoán, nhưng vẫn cảnh báo để các fork cũ và che khuất ngoài ý muốn vẫn hiển thị.

## Yêu cầu JSON Schema

- **Mọi Plugin đều phải cung cấp JSON Schema**, ngay cả khi không nhận cấu hình nào.
- Lược đồ rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Lược đồ được xác thực tại thời điểm đọc/ghi cấu hình, không phải lúc chạy.
- Khi mở rộng hoặc fork một Plugin đi kèm bằng các khóa cấu hình mới, hãy cập nhật `configSchema` trong `openclaw.plugin.json` của Plugin đó cùng lúc. Lược đồ của Plugin đi kèm là nghiêm ngặt, vì vậy việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi runtime của Plugin tải.

Ví dụ mở rộng lược đồ:

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
  manifest của Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu đến các id Plugin **có thể khám phá**. Id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc lược đồ bị hỏng hoặc bị thiếu,
  quá trình xác thực sẽ thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + nhật ký.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết toàn bộ lược đồ `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw native**, bao gồm cả việc tải từ hệ thống tệp cục bộ. Runtime vẫn tải mô-đun Plugin riêng; manifest chỉ dùng cho khám phá + xác thực.
- Manifest native được phân tích bằng JSON5, nên chú thích, dấu phẩy cuối và khóa không đặt trong dấu ngoặc kép đều được chấp nhận miễn là giá trị cuối cùng vẫn là một object.
- Bộ tải manifest chỉ đọc các trường manifest đã được ghi tài liệu. Tránh các khóa cấp cao nhất tùy chỉnh.
- Có thể bỏ qua `channels`, `providers`, `cliBackends`, và `skills` khi Plugin không cần chúng.
- `providerCatalogEntry` phải luôn gọn nhẹ và không nên import mã runtime rộng; dùng nó cho siêu dữ liệu danh mục nhà cung cấp tĩnh hoặc các bộ mô tả khám phá hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` ở entry runtime đã bị loại bỏ dần và chỉ còn là fallback tương thích cho các Plugin cũ hơn.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã bị loại bỏ dần, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm toán, xác thực phân phối cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi coi một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn runtime yêu cầu mã nhà cung cấp, xem [Hook runtime của nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào mô-đun native, hãy ghi tài liệu các bước build và mọi yêu cầu allowlist của trình quản lý gói (ví dụ, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Building plugins" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Plugin architecture" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình năng lực.
  </Card>
  <Card title="SDK overview" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu SDK Plugin và import subpath.
  </Card>
</CardGroup>
