---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành một schema cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về bản kê khai Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-05-02T10:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **tệp manifest Plugin OpenClaw gốc**.

Để xem các bố cục gói tương thích, hãy xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích dùng các tệp manifest khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có manifest
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả ở đây.

Đối với các gói tương thích, OpenClaw hiện đọc metadata của gói cùng với các thư mục gốc
Skills đã khai báo, thư mục gốc lệnh Claude, mặc định `settings.json` của gói Claude,
mặc định LSP của gói Claude, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mọi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**thư mục gốc Plugin**. OpenClaw dùng manifest này để xác thực cấu hình
**mà không thực thi mã Plugin**. Manifest bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và chặn xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugin](/vi/tools/plugin).
Đối với mô hình capability gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình capability](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là metadata mà OpenClaw đọc **trước khi tải mã
Plugin của bạn**. Mọi nội dung bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime Plugin.

**Dùng tệp này cho:**

- danh tính Plugin, xác thực cấu hình, và gợi ý giao diện người dùng cấu hình
- metadata xác thực, onboarding, và thiết lập (bí danh, tự động bật, biến môi trường nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu họ mô hình dạng rút gọn
- ảnh chụp tĩnh quyền sở hữu capability (`contracts`)
- metadata trình chạy QA mà host `openclaw qa` dùng chung có thể kiểm tra
- metadata cấu hình theo kênh được hợp nhất vào catalog và các bề mặt xác thực

**Không dùng tệp này cho:** đăng ký hành vi runtime, khai báo entrypoint mã,
hoặc metadata cài đặt npm. Những phần đó thuộc về mã Plugin của bạn và `package.json`.

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

| Trường                                | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có      | `string`                         | Id Plugin chuẩn. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                                 |
| `configSchema`                       | Có      | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                        |
| `enabledByDefault`                   | Không       | `true`                           | Đánh dấu một Plugin tích hợp sẵn là được bật theo mặc định. Bỏ qua mục này, hoặc đặt bất kỳ giá trị nào không phải `true`, để giữ Plugin bị tắt theo mặc định.                                                                                                        |
| `legacyPluginIds`                    | Không       | `string[]`                       | Các id cũ được chuẩn hóa về id Plugin chuẩn này.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Không       | `string[]`                       | Các id nhà cung cấp nên tự động bật Plugin này khi xác thực, cấu hình hoặc tham chiếu mô hình nhắc đến chúng.                                                                                                                                     |
| `kind`                               | Không       | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được `plugins.slots.*` sử dụng.                                                                                                                                                                        |
| `channels`                           | Không       | `string[]`                       | Các id kênh thuộc sở hữu của Plugin này. Được dùng cho khám phá và xác thực cấu hình.                                                                                                                                                         |
| `providers`                          | Không       | `string[]`                       | Các id nhà cung cấp thuộc sở hữu của Plugin này.                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Không       | `string`                         | Đường dẫn mô-đun khám phá nhà cung cấp nhẹ, tương đối với gốc Plugin, dành cho metadata danh mục nhà cung cấp trong phạm vi manifest có thể được tải mà không kích hoạt toàn bộ runtime của Plugin.                                               |
| `modelSupport`                       | Không       | `object`                         | Metadata họ mô hình dạng rút gọn do manifest sở hữu, được dùng để tự động tải Plugin trước runtime.                                                                                                                                         |
| `modelCatalog`                       | Không       | `object`                         | Metadata danh mục mô hình khai báo cho các nhà cung cấp thuộc sở hữu của Plugin này. Đây là hợp đồng control-plane cho việc liệt kê chỉ đọc, onboarding, bộ chọn mô hình, alias và chặn trong tương lai mà không cần tải runtime của Plugin.         |
| `modelPricing`                       | Không       | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng mục này để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp tới id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong core.             |
| `modelIdNormalization`               | Không       | `object`                         | Dọn dẹp alias/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi runtime của nhà cung cấp tải.                                                                                                                                           |
| `providerEndpoints`                  | Không       | `object[]`                       | Metadata host/baseUrl endpoint do manifest sở hữu cho các route nhà cung cấp mà core phải phân loại trước khi runtime của nhà cung cấp tải.                                                                                                            |
| `providerRequest`                    | Không       | `object`                         | Metadata nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung sử dụng trước khi runtime của nhà cung cấp tải.                                                                                                              |
| `cliBackends`                        | Không       | `string[]`                       | Các id backend suy luận CLI thuộc sở hữu của Plugin này. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình tường minh.                                                                                                                         |
| `syntheticAuthRefs`                  | Không       | `string[]`                       | Các tham chiếu nhà cung cấp hoặc backend CLI có hook xác thực tổng hợp do Plugin sở hữu nên được thăm dò trong quá trình khám phá mô hình lạnh trước khi runtime tải.                                                                                              |
| `nonSecretAuthMarkers`               | Không       | `string[]`                       | Các giá trị khóa API placeholder thuộc sở hữu của Plugin tích hợp sẵn, đại diện cho trạng thái thông tin xác thực cục bộ, OAuth hoặc ambient không bí mật.                                                                                                                |
| `commandAliases`                     | Không       | `object[]`                       | Tên lệnh thuộc sở hữu của Plugin này nên tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi runtime tải.                                                                                                                |
| `providerAuthEnvVars`                | Không       | `Record<string, string[]>`       | Metadata env tương thích đã ngừng khuyến nghị cho tra cứu xác thực/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc mục này trong giai đoạn ngừng khuyến nghị.                                                 |
| `providerAuthAliases`                | Không       | `Record<string, string>`         | Các id nhà cung cấp nên dùng lại một id nhà cung cấp khác cho tra cứu xác thực, ví dụ một nhà cung cấp lập trình chia sẻ khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                                          |
| `channelEnvVars`                     | Không       | `Record<string, string[]>`       | Metadata env kênh nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng mục này cho thiết lập kênh dựa trên env hoặc các bề mặt xác thực mà helper khởi động/cấu hình chung nên thấy.                                            |
| `providerAuthChoices`                | Không       | `object[]`                       | Metadata lựa chọn xác thực nhẹ cho bộ chọn onboarding, phân giải nhà cung cấp ưu tiên và nối dây cờ CLI đơn giản.                                                                                                                       |
| `activation`                         | Không       | `object`                         | Metadata nhẹ của bộ lập kế hoạch kích hoạt cho việc tải khi khởi động, nhà cung cấp, lệnh, kênh, route và kích hoạt theo capability. Chỉ là metadata; runtime của Plugin vẫn sở hữu hành vi thực tế.                                                       |
| `setup`                              | Không       | `object`                         | Bộ mô tả thiết lập/onboarding nhẹ mà các bề mặt khám phá và thiết lập có thể kiểm tra mà không tải runtime của Plugin.                                                                                                                    |
| `qaRunners`                          | Không       | `object[]`                       | Bộ mô tả QA runner nhẹ được host `openclaw qa` dùng chung sử dụng trước khi runtime của Plugin tải.                                                                                                                                      |
| `contracts`                          | Không       | `object`                         | Ảnh chụp tĩnh về quyền sở hữu capability cho hook xác thực bên ngoài, speech, phiên âm thời gian thực, giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, web-fetch, tìm kiếm web và quyền sở hữu công cụ. |
| `mediaUnderstandingProviderMetadata` | Không       | `Record<string, object>`         | Giá trị mặc định nhẹ cho hiểu phương tiện đối với các id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                            |
| `imageGenerationProviderMetadata`    | Không       | `Record<string, object>`         | Metadata xác thực nhẹ cho tạo ảnh đối với các id nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm alias xác thực và guard base-url do nhà cung cấp sở hữu.                                                                  |
| `videoGenerationProviderMetadata`    | Không       | `Record<string, object>`         | Metadata xác thực nhẹ cho tạo video đối với các id nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm alias xác thực và guard base-url do nhà cung cấp sở hữu.                                                                  |
| `musicGenerationProviderMetadata`    | Không       | `Record<string, object>`         | Metadata xác thực nhẹ cho tạo nhạc đối với các id nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm alias xác thực và guard base-url do nhà cung cấp sở hữu.                                                                  |
| `toolMetadata`                       | Không       | `Record<string, object>`         | Metadata tính khả dụng nhẹ cho các công cụ thuộc sở hữu của Plugin được khai báo trong `contracts.tools`. Dùng mục này khi một công cụ không nên tải runtime trừ khi có bằng chứng cấu hình, env hoặc xác thực.                                                           |
| `channelConfigs`                     | Không       | `Record<string, object>`         | Metadata cấu hình kênh do manifest sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi runtime tải.                                                                                                                          |
| `skills`                             | Không       | `string[]`                       | Các thư mục Skills để tải, tương đối với gốc Plugin.                                                                                                                                                                             |
| `name`                               | Không       | `string`                         | Tên Plugin dễ đọc với con người.                                                                                                                                                                                                         |
| `description`                        | Không       | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                             |
| `version`                            | Không       | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                                       |
| `uiHints`                            | Không       | `Record<string, object>`         | Nhãn UI, phần giữ chỗ và gợi ý về độ nhạy cho các trường cấu hình.                                                                                                                                                                   |

## Tham chiếu siêu dữ liệu nhà cung cấp tạo sinh

Các trường siêu dữ liệu nhà cung cấp tạo sinh mô tả các tín hiệu xác thực tĩnh cho
các nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng.
OpenClaw đọc các trường này trước khi runtime của nhà cung cấp tải để các công cụ lõi có thể
quyết định liệu một nhà cung cấp tạo sinh có sẵn sàng hay không mà không cần nhập mọi
Plugin nhà cung cấp.

Chỉ dùng các trường này cho các sự kiện khai báo, chi phí thấp. Vận chuyển, biến đổi yêu cầu,
làm mới token, xác thực thông tin đăng nhập và hành vi tạo sinh thực tế
vẫn nằm trong runtime của Plugin.

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

| Trường          | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                        |
| --------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Không    | `string[]` | Các id nhà cung cấp bổ sung sẽ được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo sinh.                                  |
| `authProviders` | Không    | `string[]` | Các id nhà cung cấp mà hồ sơ xác thực đã cấu hình của chúng sẽ được tính là xác thực cho nhà cung cấp tạo sinh này.           |
| `configSignals` | Không    | `object[]` | Các tín hiệu sẵn sàng chỉ dựa trên cấu hình, chi phí thấp, cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể cấu hình không cần hồ sơ xác thực hoặc biến môi trường. |
| `authSignals`   | Không    | `object[]` | Các tín hiệu xác thực rõ ràng. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ id nhà cung cấp, `aliases` và `authProviders`. |

Mỗi mục `configSignals` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                                |
| ------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Có       | `string`   | Đường dẫn dạng dấu chấm đến đối tượng cấu hình do Plugin sở hữu cần kiểm tra, ví dụ `plugins.entries.example.config`.                                                                 |
| `overlayPath` | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình gốc mà đối tượng của nó sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng cho cấu hình theo năng lực như `image`, `video` hoặc `music`. |
| `required`    | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực bắt buộc phải có giá trị đã cấu hình. Chuỗi không được rỗng; đối tượng và mảng không được rỗng.                              |
| `requiredAny` | Không    | `string[]` | Các đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                                  |
| `mode`        | Không    | `object`   | Bộ chặn chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng khi trạng thái sẵn sàng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                                            |

Mỗi bộ chặn `mode` hỗ trợ:

| Trường       | Bắt buộc | Kiểu       | Ý nghĩa                                                                                  |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------------- |
| `path`       | Không    | `string`   | Đường dẫn dạng dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.                |
| `default`    | Không    | `string`   | Giá trị chế độ dùng khi cấu hình bỏ qua đường dẫn.                                      |
| `allowed`    | Không    | `string[]` | Nếu có mặt, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.          |
| `disallowed` | Không    | `string[]` | Nếu có mặt, tín hiệu không đạt khi chế độ hiệu lực là một trong các giá trị này.        |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                                         |
| ----------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string` | Id nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                              |
| `providerBaseUrl` | Không    | `object` | Bộ chặn tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu dùng URL cơ sở được phép. Dùng khi một bí danh xác thực chỉ hợp lệ cho một số API nhất định. |

Mỗi bộ chặn `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                             |
| ----------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string`   | Id cấu hình nhà cung cấp có `baseUrl` cần được kiểm tra.                                                                                            |
| `defaultBaseUrl`  | Không    | `string`   | URL cơ sở giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                      |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp với một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu siêu dữ liệu công cụ

`toolMetadata` dùng cùng dạng `configSignals` và `authSignals` như
siêu dữ liệu nhà cung cấp tạo sinh, được khóa theo tên công cụ. `contracts.tools` khai báo
quyền sở hữu. `toolMetadata` khai báo bằng chứng sẵn sàng chi phí thấp để OpenClaw có thể
tránh nhập runtime của Plugin chỉ để factory công cụ của nó trả về `null`.

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
tải Plugin sở hữu khi hợp đồng công cụ khớp chính sách. Với các công cụ trên đường dẫn nóng
mà factory phụ thuộc vào xác thực/cấu hình, tác giả Plugin nên khai báo
`toolMetadata` thay vì khiến lõi nhập runtime để hỏi.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn onboarding hoặc xác thực.
OpenClaw đọc mục này trước khi runtime của nhà cung cấp tải.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn manifest này, lựa chọn thiết lập suy ra từ descriptor,
và siêu dữ liệu danh mục cài đặt mà không tải runtime của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                         |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để điều phối đến.                                                         |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng onboarding và CLI.                           |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hướng tới người dùng. Nếu bỏ qua, OpenClaw dùng dự phòng `choiceId`.                         |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                               |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.           |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ nên chuyển hướng người dùng đến lựa chọn thay thế này.                         |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                  |
| `groupLabel`          | Không    | `string`                                        | Nhãn hướng tới người dùng cho nhóm đó.                                                           |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                  |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực đơn giản dùng một cờ.                                |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn `--openrouter-api-key`.                                                     |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | Không    | `string`                                        | Mô tả dùng trong trợ giúp CLI.                                                                    |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt onboarding nơi lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`. |

## Tham chiếu commandAliases

Sử dụng `commandAliases` khi một Plugin sở hữu tên lệnh thời gian chạy mà người dùng có thể nhầm lẫn đặt vào `plugins.allow` hoặc cố chạy dưới dạng lệnh CLI gốc. OpenClaw sử dụng siêu dữ liệu này cho chẩn đoán mà không nhập mã thời gian chạy của Plugin.

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

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về Plugin này.                                           |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong chat thay vì lệnh CLI gốc.     |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có tồn tại.   |

## tham chiếu activation

Sử dụng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện mặt phẳng điều khiển nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu của bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký hành vi thời gian chạy, không thay thế `register(...)`, và không hứa rằng mã Plugin đã được thực thi. Bộ lập kế hoạch kích hoạt sử dụng các trường này để thu hẹp các Plugin ứng viên trước khi quay lại siêu dữ liệu sở hữu manifest hiện có như `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, và các hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Sử dụng `providers`, `channels`, `commandAliases`, bộ mô tả setup, hoặc `contracts` khi các trường đó diễn đạt được mối quan hệ. Sử dụng `activation` cho các gợi ý bổ sung cho bộ lập kế hoạch mà các trường sở hữu đó không thể biểu diễn.
Sử dụng `cliBackends` cấp cao nhất cho các bí danh thời gian chạy CLI như `claude-cli`, `codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho các id harness tác tử nhúng chưa có trường sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi thời gian chạy, và không thay thế `register(...)`, `setupEntry`, hoặc các điểm vào thời gian chạy/Plugin khác. Các bên tiêu thụ hiện tại dùng nó như một gợi ý thu hẹp trước khi tải Plugin rộng hơn, vì vậy việc thiếu siêu dữ liệu kích hoạt không thuộc startup thường chỉ làm tốn hiệu năng; nó không nên làm thay đổi tính đúng đắn khi các fallback sở hữu manifest vẫn còn tồn tại.

Mọi Plugin nên đặt `activation.onStartup` một cách có chủ đích. Đặt thành `true` chỉ khi Plugin phải chạy trong quá trình khởi động Gateway. Đặt thành `false` khi Plugin không hoạt động lúc startup và chỉ nên tải từ các kích hoạt hẹp hơn. Việc bỏ qua `onStartup` không còn tự động tải Plugin lúc startup; hãy dùng siêu dữ liệu kích hoạt tường minh cho startup, kênh, cấu hình, agent-harness, bộ nhớ, hoặc các kích hoạt hẹp hơn khác.

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
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt startup Gateway tường minh. Mọi Plugin nên đặt trường này. `true` nhập Plugin trong lúc startup; `false` giữ Plugin lười tải lúc startup trừ khi một kích hoạt khớp khác yêu cầu tải.         |
| `onProviders`      | Không    | `string[]`                                           | Các id nhà cung cấp nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                      |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các id thời gian chạy harness tác tử nhúng nên đưa Plugin này vào kế hoạch kích hoạt/tải. Sử dụng `cliBackends` cấp cao nhất cho các bí danh backend CLI.                                               |
| `onCommands`       | Không    | `string[]`                                           | Các id lệnh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                              |
| `onChannels`       | Không    | `string[]`                                           | Các id kênh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                              |
| `onRoutes`         | Không    | `string[]`                                           | Các loại tuyến nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                           |
| `onConfigPaths`    | Không    | `string[]`                                           | Các đường dẫn cấu hình tương đối từ gốc nên đưa Plugin này vào kế hoạch startup/tải khi đường dẫn hiện diện và không bị vô hiệu hóa tường minh.                                                         |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Gợi ý năng lực rộng được dùng bởi lập kế hoạch kích hoạt mặt phẳng điều khiển. Ưu tiên các trường hẹp hơn khi có thể.                                                                                  |

Các bên tiêu thụ trực tiếp hiện tại:

- lập kế hoạch startup Gateway sử dụng `activation.onStartup` để nhập lúc startup một cách tường minh
- lập kế hoạch CLI do lệnh kích hoạt quay lại `commandAliases[].cliCommand` hoặc `commandAliases[].name` kiểu cũ
- lập kế hoạch startup agent-runtime sử dụng `activation.onAgentHarnesses` cho các harness nhúng và `cliBackends[]` cấp cao nhất cho các bí danh thời gian chạy CLI
- lập kế hoạch setup/kênh do kênh kích hoạt quay lại quyền sở hữu `channels[]` kiểu cũ khi thiếu siêu dữ liệu kích hoạt kênh tường minh
- lập kế hoạch Plugin startup sử dụng `activation.onConfigPaths` cho các bề mặt cấu hình gốc không phải kênh, chẳng hạn khối `browser` của Plugin trình duyệt đi kèm
- lập kế hoạch setup/thời gian chạy do nhà cung cấp kích hoạt quay lại quyền sở hữu `providers[]` kiểu cũ và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu kích hoạt nhà cung cấp tường minh

Chẩn đoán của bộ lập kế hoạch có thể phân biệt gợi ý kích hoạt tường minh với fallback sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là `activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho chẩn đoán host và kiểm thử; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu mô tả quyền sở hữu tốt nhất.

## tham chiếu qaRunners

Sử dụng `qaRunners` khi một Plugin đóng góp một hoặc nhiều runner vận chuyển bên dưới gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; thời gian chạy Plugin vẫn sở hữu việc đăng ký CLI thực tế thông qua bề mặt `runtime-api.ts` nhẹ xuất `qaRunnerCliRegistrations`.

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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                                            |
| ------------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.                          |
| `description` | Không    | `string` | Văn bản trợ giúp fallback dùng khi host dùng chung cần một lệnh stub.              |

## tham chiếu setup

Sử dụng `setup` khi các bề mặt setup và onboarding cần siêu dữ liệu do Plugin sở hữu với chi phí thấp trước khi thời gian chạy tải.

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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI. `setup.cliBackends` là bề mặt mô tả dành riêng cho setup cho các luồng mặt phẳng điều khiển/setup nên giữ ở dạng chỉ siêu dữ liệu.

Khi hiện diện, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên theo mô tả trước cho phát hiện setup. Nếu bộ mô tả chỉ thu hẹp Plugin ứng viên và setup vẫn cần các hook thời gian setup phong phú hơn, hãy đặt `requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi fallback.

OpenClaw cũng đưa `setup.providers[].envVars` vào các tra cứu xác thực nhà cung cấp và biến môi trường chung. `providerAuthEnvVars` vẫn được hỗ trợ thông qua bộ chuyển đổi tương thích trong thời gian ngừng dùng dần, nhưng các Plugin không đi kèm vẫn dùng nó sẽ nhận chẩn đoán manifest. Plugin mới nên đặt siêu dữ liệu môi trường cho setup/trạng thái trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods` khi không có mục setup, hoặc khi `setup.requiresRuntime: false` khai báo thời gian chạy setup là không cần thiết. Các mục `providerAuthChoices` tường minh vẫn được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding, và siêu dữ liệu trợ lý.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó đủ cho bề mặt setup. OpenClaw coi `false` tường minh là một hợp đồng chỉ dùng bộ mô tả và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` cho tra cứu setup. Nếu một Plugin chỉ dùng bộ mô tả vẫn gửi kèm một trong các mục thời gian chạy setup đó, OpenClaw báo cáo chẩn đoán bổ sung và tiếp tục bỏ qua nó. `requiresRuntime` bị bỏ qua sẽ giữ hành vi fallback kiểu cũ để các Plugin hiện có đã thêm bộ mô tả nhưng chưa thêm cờ không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị `setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy nhất trên toàn bộ các Plugin được phát hiện. Quyền sở hữu mơ hồ sẽ thất bại đóng thay vì chọn người thắng dựa trên thứ tự phát hiện.

Khi thời gian chạy setup thực thi, chẩn đoán registry setup sẽ báo cáo lệch bộ mô tả nếu `setup-api` đăng ký một nhà cung cấp hoặc backend CLI mà bộ mô tả manifest không khai báo, hoặc nếu một bộ mô tả không có đăng ký thời gian chạy tương ứng. Các chẩn đoán này là bổ sung và không từ chối các Plugin kiểu cũ.

### tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                 |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Id nhà cung cấp được hiển thị trong setup hoặc onboarding. Giữ các id đã chuẩn hóa là duy nhất toàn cục. |
| `authMethods`  | Không    | `string[]` | Id phương thức setup/xác thực mà nhà cung cấp này hỗ trợ mà không cần tải toàn bộ thời gian chạy.        |
| `envVars`      | Không    | `string[]` | Các biến môi trường mà bề mặt setup/trạng thái chung có thể kiểm tra trước khi thời gian chạy Plugin tải. |
| `authEvidence` | Không    | `object[]` | Các kiểm tra bằng chứng xác thực cục bộ nhẹ cho nhà cung cấp có thể xác thực qua các marker không bí mật. |

`authEvidence` dành cho các dấu hiệu thông tin xác thực cục bộ do provider sở hữu, có thể được
xác minh mà không cần tải mã thời gian chạy. Các kiểm tra này phải luôn rẻ và cục bộ:
không gọi mạng, không đọc keychain hoặc secret-manager, không chạy lệnh shell, và không
thăm dò API của provider.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                             |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Có       | `string`   | Hiện là `local-file-with-env`.                                                                                      |
| `fileEnvVar`       | Không    | `string`   | Biến env chứa đường dẫn tệp thông tin xác thực tường minh.                                                          |
| `fallbackPaths`    | Không    | `string[]` | Đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không    | `string[]` | Ít nhất một biến env được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                      |
| `requiresAllEnv`   | Không    | `string[]` | Mọi biến env được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                             |
| `credentialMarker` | Có       | `string`   | Dấu hiệu không bí mật được trả về khi có bằng chứng.                                                                |
| `source`           | Không    | `string`   | Nhãn nguồn hiển thị cho người dùng trong đầu ra xác thực/trạng thái.                                                |

### Các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                               |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Bộ mô tả thiết lập provider được hiển thị trong quá trình thiết lập và onboarding.                    |
| `cliBackends`      | Không    | `string[]` | ID backend tại thời điểm thiết lập dùng cho tra cứu thiết lập ưu tiên bộ mô tả. Giữ các ID đã chuẩn hóa là duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | ID di chuyển cấu hình do bề mặt thiết lập của Plugin này sở hữu.                                      |
| `requiresRuntime`  | Không    | `boolean`  | Thiết lập có còn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                         |

## Tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình đến các gợi ý kết xuất nhỏ.

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
| `label`       | `string`   | Nhãn trường hiển thị cho người dùng.      |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                    |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                          |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.              |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.  |
| `placeholder` | `string`   | Văn bản giữ chỗ cho đầu vào biểu mẫu.     |

## Tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu quyền sở hữu capability tĩnh mà OpenClaw có thể
đọc mà không cần nhập thời gian chạy của Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | ID factory extension app-server Codex, hiện là `codex-app-server`.       |
| `agentToolResultMiddleware`      | `string[]` | ID thời gian chạy mà một Plugin đi kèm có thể đăng ký middleware kết quả công cụ cho. |
| `externalAuthProviders`          | `string[]` | ID provider có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.       |
| `speechProviders`                | `string[]` | ID provider giọng nói do Plugin này sở hữu.                              |
| `realtimeTranscriptionProviders` | `string[]` | ID provider phiên âm thời gian thực do Plugin này sở hữu.                |
| `realtimeVoiceProviders`         | `string[]` | ID provider thoại thời gian thực do Plugin này sở hữu.                   |
| `memoryEmbeddingProviders`       | `string[]` | ID provider embedding bộ nhớ do Plugin này sở hữu.                       |
| `mediaUnderstandingProviders`    | `string[]` | ID provider hiểu phương tiện do Plugin này sở hữu.                       |
| `imageGenerationProviders`       | `string[]` | ID provider tạo ảnh do Plugin này sở hữu.                                |
| `videoGenerationProviders`       | `string[]` | ID provider tạo video do Plugin này sở hữu.                              |
| `webFetchProviders`              | `string[]` | ID provider tìm nạp web do Plugin này sở hữu.                            |
| `webSearchProviders`             | `string[]` | ID provider tìm kiếm web do Plugin này sở hữu.                           |
| `migrationProviders`             | `string[]` | ID provider nhập mà Plugin này sở hữu cho `openclaw migrate`.            |
| `tools`                          | `string[]` | Tên công cụ agent do Plugin này sở hữu.                                  |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory extension chỉ dành cho
app-server Codex đi kèm. Các phép biến đổi kết quả công cụ đi kèm nên
khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể
đăng ký middleware kết quả công cụ vì seam này có thể viết lại đầu ra công cụ có độ tin cậy cao
trước khi mô hình nhìn thấy.

Các đăng ký `api.registerTool(...)` tại thời gian chạy phải khớp với `contracts.tools`.
Khám phá công cụ dùng danh sách này để chỉ tải các thời gian chạy Plugin có thể sở hữu
các công cụ được yêu cầu.

Các Plugin provider triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`. Các Plugin không có khai báo vẫn chạy
qua fallback tương thích đã lỗi thời, nhưng fallback đó chậm hơn và
sẽ bị gỡ bỏ sau cửa sổ di chuyển.

Các provider embedding bộ nhớ đi kèm nên khai báo
`contracts.memoryEmbeddingProviders` cho mọi ID adapter mà chúng hiển thị, bao gồm
các adapter tích hợp như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest này
để chỉ tải Plugin sở hữu trước khi toàn bộ thời gian chạy Gateway đã
đăng ký provider.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một provider hiểu phương tiện có
mô hình mặc định, mức ưu tiên fallback tự động xác thực, hoặc hỗ trợ tài liệu gốc mà
các helper lõi chung cần trước khi thời gian chạy tải. Các khóa cũng phải được khai báo trong
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

Mỗi mục provider có thể bao gồm:

| Trường                 | Kiểu                                | Ý nghĩa                                                                             |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability phương tiện do provider này hiển thị.                                    |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ capability sang mô hình được dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho fallback provider tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được provider hỗ trợ.                                           |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi một Plugin kênh cần siêu dữ liệu cấu hình rẻ trước khi
thời gian chạy tải. Khám phá thiết lập/trạng thái kênh chỉ đọc có thể dùng trực tiếp siêu dữ liệu này
cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc
khi `setup.requiresRuntime: false` khai báo rằng thời gian chạy thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest Plugin, không phải một phần cấu hình người dùng cấp cao mới.
Người dùng vẫn cấu hình các phiên bản kênh dưới `channels.<channel-id>`.
OpenClaw đọc siêu dữ liệu manifest để quyết định Plugin nào sở hữu kênh đã cấu hình đó
trước khi mã thời gian chạy Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng
lược đồ cấu hình đường dẫn lạnh, thiết lập, và các bề mặt Control UI không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi thời gian chạy Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo các mặc định `auto` tĩnh cho kiểm tra cấu hình lệnh
chạy trước khi thời gian chạy kênh tải. Các kênh đi kèm cũng có thể xuất bản
cùng các mặc định thông qua `package.json#openclaw.channel.commands` cùng với
siêu dữ liệu danh mục kênh khác do package sở hữu.

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
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho từng mục cấu hình kênh đã khai báo.         |
| `uiHints`     | `Record<string, object>` | Nhãn UI/placeholder/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                    |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi metadata runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và danh mục.                                      |
| `commands`    | `object`                 | Lệnh native tĩnh và mặc định tự động của native skill cho kiểm tra cấu hình trước runtime. |
| `preferOver`  | `string[]`               | Các id Plugin cũ hoặc có độ ưu tiên thấp hơn mà kênh này nên xếp trên trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà
Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là id Plugin được đổi tên, một
Plugin độc lập thay thế một Plugin đi kèm, hoặc một fork được bảo trì
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
id Plugin được ưu tiên. Nếu Plugin có độ ưu tiên thấp hơn chỉ được chọn vì
nó đi kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong cấu hình
runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng
vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo cáo chẩn đoán trùng lặp kênh/công cụ thay vì
âm thầm thay đổi tập Plugin được yêu cầu.

Giữ `preferOver` giới hạn trong các id Plugin thực sự có thể cung cấp cùng kênh.
Đây không phải là trường ưu tiên tổng quát và không đổi tên các khóa cấu hình của người dùng.

## Tham chiếu modelSupport

Dùng `modelSupport` khi OpenClaw cần suy luận Plugin nhà cung cấp của bạn từ
các id mô hình viết tắt như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi runtime
Plugin tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên này:

- các tham chiếu `provider/model` rõ ràng dùng metadata manifest `providers` sở hữu
- `modelPatterns` thắng `modelPrefixes`
- nếu một Plugin không đi kèm và một Plugin đi kèm cùng khớp, Plugin không đi kèm
  thắng
- độ mơ hồ còn lại được bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                           |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với id mô hình viết tắt.                  |
| `modelPatterns` | `string[]` | Nguồn regex được khớp với id mô hình viết tắt sau khi loại bỏ hậu tố hồ sơ.       |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw cần biết metadata mô hình của nhà cung cấp trước khi
tải runtime Plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định,
bí danh nhà cung cấp, quy tắc ẩn và chế độ khám phá. Làm mới runtime
vẫn thuộc về mã runtime của nhà cung cấp, nhưng manifest cho core biết khi nào runtime
là bắt buộc.

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
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho id nhà cung cấp do Plugin này sở hữu. Khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải thành một nhà cung cấp sở hữu để lập kế hoạch danh mục hoặc ẩn.          |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này ẩn vì lý do riêng theo nhà cung cấp.                           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Liệu danh mục nhà cung cấp có thể được đọc từ metadata manifest, được làm mới vào cache, hay yêu cầu runtime. |

`aliases` tham gia tra cứu quyền sở hữu nhà cung cấp cho việc lập kế hoạch model-catalog.
Mục tiêu bí danh phải là các nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng ghi đè API/base URL của bí danh mà không tải runtime nhà cung cấp.
Bí danh không mở rộng danh sách danh mục chưa lọc; danh sách rộng chỉ phát ra các hàng
nhà cung cấp chuẩn sở hữu.

`suppressions` thay thế hook runtime nhà cung cấp cũ `suppressBuiltInModel`.
Các mục ẩn chỉ được tôn trọng khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ tới một nhà cung cấp sở hữu. Các hook
ẩn runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                               |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ điều hợp API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.           |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` sẽ bị bỏ qua.       |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                       |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp, không có tiền tố `provider/`.            |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                        |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                        |
| `baseUrl`       | `string`                                                       | Ghi đè base URL tùy chọn theo từng mô hình.                                   |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn theo từng mô hình.                                       |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các modality mà mô hình chấp nhận.                                            |
| `reasoning`     | `boolean`                                                      | Liệu mô hình có bộc lộ hành vi reasoning hay không.                           |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh native của nhà cung cấp.                                      |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu lực tùy chọn khi khác với `contextWindow`.     |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết.                                              |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.      |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng tuyệt đối không được xuất hiện.           |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị cùng trạng thái không khả dụng.                       |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ theo nhà cung cấp cũ hơn mà mô hình này thay thế.       |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp thay thế cho các hàng bị ngừng dùng.      |
| `tags`          | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc sử dụng.                               |

Các trường ẩn:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                   |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id nhà cung cấp cho hàng upstream cần ẩn. Phải do Plugin này sở hữu hoặc được khai báo là bí danh sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ theo nhà cung cấp cần ẩn.                                                               |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng bị ẩn được yêu cầu trực tiếp.                                        |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host base URL nhà cung cấp hiệu lực bắt buộc trước khi việc ẩn được áp dụng.       |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` trong provider-config chính xác bắt buộc trước khi việc ẩn được áp dụng. |

Không đặt dữ liệu chỉ dành cho runtime trong `modelCatalog`. Chỉ dùng `static` khi các
hàng manifest đủ hoàn chỉnh để các bề mặt danh sách và bộ chọn đã lọc theo nhà
cung cấp có thể bỏ qua việc khám phá registry/runtime. Dùng `refreshable` khi
các hàng manifest là các seed có thể liệt kê hoặc phần bổ sung hữu ích nhưng
refresh/cache có thể thêm nhiều hàng hơn sau đó; bản thân các hàng refreshable
không có thẩm quyền. Dùng `runtime` khi OpenClaw phải tải runtime của nhà cung
cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp model-id do nhà cung cấp sở hữu với
chi phí thấp, cần xảy ra trước khi runtime của nhà cung cấp tải. Điều này giữ
các alias như tên model ngắn, id cũ cục bộ của nhà cung cấp, và quy tắc tiền tố
proxy trong manifest của Plugin sở hữu thay vì trong các bảng chọn model của lõi.

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

| Trường                               | Kiểu                   | Ý nghĩa                                                                                   |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias model-id khớp chính xác, không phân biệt hoa thường. Giá trị được trả về như đã viết. |
| `stripPrefixes`                      | `string[]`             | Tiền tố cần loại bỏ trước khi tra cứu alias, hữu ích cho việc trùng lặp nhà cung cấp/model cũ. |
| `prefixWhenBare`                     | `string`               | Tiền tố cần thêm khi id model đã chuẩn hóa chưa chứa `/`.                                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`             | Quy tắc tiền tố bare-id có điều kiện sau khi tra cứu alias, khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung phải
biết trước khi runtime của nhà cung cấp tải. Lõi vẫn sở hữu ý nghĩa của mỗi
`endpointClass`; manifest của Plugin sở hữu metadata về host và URL cơ sở.

Trường endpoint:

| Trường                         | Kiểu       | Ý nghĩa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên host chính xác ánh xạ tới lớp endpoint.                                               |
| `hostSuffixes`                 | `string[]` | Hậu tố host ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố miền.            |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                        |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các host toàn cục chính xác.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các host khớp để lộ tiền tố vùng Google Vertex.                  |

## Tham chiếu providerRequest

Dùng `providerRequest` cho metadata tương thích yêu cầu với chi phí thấp mà
chính sách yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ việc
viết lại payload theo hành vi cụ thể trong hook runtime của nhà cung cấp hoặc
helper dùng chung cho họ nhà cung cấp.

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

| Trường                | Kiểu         | Ý nghĩa                                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp dùng cho quyết định tương thích yêu cầu chung và chẩn đoán.    |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho helper yêu cầu dùng chung.            |
| `openAICompletions`   | `object`     | Cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.        |

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá control-plane trước
khi runtime tải. Cache định giá của Gateway đọc metadata này mà không import mã
runtime của nhà cung cấp.

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

| Trường       | Kiểu              | Ý nghĩa                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho các nhà cung cấp cục bộ/tự host không bao giờ nên lấy định giá OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu định giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.     |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu định giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.           |

Trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Id nhà cung cấp catalog bên ngoài khi khác với id nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem id model có dấu gạch chéo là tham chiếu nhà cung cấp/model lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Biến thể model-id catalog bên ngoài bổ sung. `version-dots` thử id phiên bản có dấu chấm như `claude-opus-4.6`. |

### Chỉ mục nhà cung cấp OpenClaw

Chỉ mục nhà cung cấp OpenClaw là metadata xem trước do OpenClaw sở hữu cho các
nhà cung cấp mà Plugin của chúng có thể chưa được cài đặt. Nó không phải là một
phần của manifest Plugin. Manifest Plugin vẫn là nguồn có thẩm quyền của Plugin
đã cài đặt. Chỉ mục nhà cung cấp là hợp đồng dự phòng nội bộ mà các bề mặt bộ
chọn model trước khi cài đặt và nhà cung cấp có thể cài đặt trong tương lai sẽ
sử dụng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. Manifest Plugin đã cài đặt `modelCatalog`.
3. Cache catalog model từ refresh rõ ràng.
4. Các hàng xem trước trong Chỉ mục nhà cung cấp OpenClaw.

Chỉ mục nhà cung cấp không được chứa secret, trạng thái đã bật, hook runtime,
hoặc dữ liệu model theo tài khoản trực tiếp. Catalog xem trước của nó dùng cùng
hình dạng hàng nhà cung cấp `modelCatalog` như manifest Plugin, nhưng nên giới
hạn ở metadata hiển thị ổn định trừ khi các trường adapter runtime như `api`,
`baseUrl`, định giá, hoặc cờ tương thích được cố ý giữ đồng bộ với manifest
Plugin đã cài đặt. Các nhà cung cấp có khám phá `/models` trực tiếp nên ghi các
hàng đã refresh thông qua đường dẫn cache catalog model rõ ràng thay vì để việc
liệt kê thông thường hoặc onboarding gọi API của nhà cung cấp.

Mục Chỉ mục nhà cung cấp cũng có thể mang metadata Plugin có thể cài đặt cho các
nhà cung cấp có Plugin đã được chuyển ra khỏi lõi hoặc hiện chưa được cài đặt.
Metadata này phản chiếu mẫu catalog kênh: tên package, spec cài đặt npm, tính
toàn vẹn mong đợi, và nhãn lựa chọn auth nhẹ là đủ để hiển thị một tùy chọn
thiết lập có thể cài đặt. Sau khi Plugin được cài đặt, manifest của nó thắng và
mục Chỉ mục nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa capability cấp cao nhất cũ đã bị loại bỏ. Dùng `openclaw doctor --fix`
để chuyển `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; việc tải
manifest thông thường không còn xem các trường cấp cao nhất đó là quyền sở hữu
capability.

## Manifest so với package.json

Hai tệp này phục vụ các công việc khác nhau:

| Tệp                    | Dùng cho                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, metadata lựa chọn auth, và gợi ý UI phải tồn tại trước khi mã Plugin chạy                           |
| `package.json`         | Metadata npm, cài đặt dependency, và khối `openclaw` dùng cho entrypoint, cổng cài đặt, thiết lập, hoặc metadata catalog          |

Nếu bạn không chắc một phần metadata thuộc về đâu, dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số metadata Plugin trước runtime cố ý nằm trong `package.json` dưới khối
`openclaw` thay vì `openclaw.plugin.json`.

Ví dụ quan trọng:

| Trường                                                            | Ý nghĩa                                                                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Khai báo các điểm vào plugin gốc. Phải nằm trong thư mục gói plugin.                                                                                                                         |
| `openclaw.runtimeExtensions`                                      | Khai báo các điểm vào runtime JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói plugin.                                                                                |
| `openclaw.setupEntry`                                             | Điểm vào nhẹ chỉ dành cho thiết lập, dùng trong onboarding, khởi động kênh bị trì hoãn, và khám phá trạng thái kênh/SecretRef chỉ đọc. Phải nằm trong thư mục gói plugin.                 |
| `openclaw.runtimeSetupEntry`                                      | Khai báo điểm vào thiết lập JavaScript đã build cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại, và phải nằm trong thư mục gói plugin.                                          |
| `openclaw.channel`                                                | Metadata danh mục kênh chi phí thấp như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                            |
| `openclaw.channel.commands`                                       | Metadata lệnh gốc tĩnh và mặc định tự động cho kỹ năng gốc, được dùng bởi các bề mặt cấu hình, kiểm tra, và danh sách lệnh trước khi runtime kênh tải.                                    |
| `openclaw.channel.configuredState`                                | Metadata kiểm tra trạng thái đã cấu hình nhẹ có thể trả lời "thiết lập chỉ dùng env đã tồn tại chưa?" mà không cần tải toàn bộ runtime kênh.                                               |
| `openclaw.channel.persistedAuthState`                             | Metadata kiểm tra auth đã lưu nhẹ có thể trả lời "đã có thứ gì đăng nhập chưa?" mà không cần tải toàn bộ runtime kênh.                                                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Gợi ý cài đặt/cập nhật cho các plugin được đóng gói kèm và được phát hành bên ngoài.                                                                                                         |
| `openclaw.install.defaultChoice`                                  | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt khả dụng.                                                                                                                              |
| `openclaw.install.minHostVersion`                                 | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                              |
| `openclaw.install.expectedIntegrity`                              | Chuỗi toàn vẹn npm dist kỳ vọng như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải về theo chuỗi này.                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Cho phép một đường dẫn khôi phục cài đặt lại plugin đóng gói kèm trong phạm vi hẹp khi cấu hình không hợp lệ.                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước plugin kênh đầy đủ trong khi khởi động.                                                                                           |

Metadata manifest quyết định các lựa chọn provider/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách tải về hoặc bật plugin đó khi người dùng chọn một trong các
lựa chọn đó. Không chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
registry manifest cho các nguồn plugin không được đóng gói kèm. Giá trị không hợp lệ bị từ chối;
các giá trị mới hơn nhưng hợp lệ sẽ bỏ qua plugin bên ngoài trên host cũ hơn. Các plugin nguồn
được đóng gói kèm được giả định là cùng phiên bản với checkout host.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức
nên ghép spec chính xác với `expectedIntegrity` để các luồng cập nhật fail
closed nếu artifact npm đã tải về không còn khớp với bản phát hành đã ghim.
Onboarding tương tác vẫn cung cấp các spec npm registry đáng tin cậy, bao gồm tên
gói trần và dist-tag, để tương thích. Chẩn đoán danh mục có thể
phân biệt nguồn chính xác, trôi nổi, được ghim toàn vẹn, thiếu toàn vẹn, không khớp tên gói,
và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ nào để ghim.
Khi `expectedIntegrity` có mặt,
các luồng cài đặt/cập nhật thực thi nó; khi bị bỏ qua, kết quả phân giải registry được
ghi lại mà không có ghim toàn vẹn.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
runtime. Điểm vào thiết lập nên phơi bày metadata kênh cùng cấu hình,
trạng thái, và adapter secrets an toàn cho thiết lập; giữ network client, Gateway listener, và
transport runtime trong điểm vào tiện ích mở rộng chính.

Các trường điểm vào runtime không ghi đè kiểm tra ranh giới gói cho các trường
điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể làm cho
đường dẫn `openclaw.extensions` thoát ra ngoài trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` cố ý có phạm vi hẹp. Nó
không làm cho các cấu hình hỏng tùy ý có thể cài đặt. Hiện tại nó chỉ cho phép các luồng cài đặt
khôi phục từ các lỗi nâng cấp plugin đóng gói kèm cũ cụ thể, chẳng hạn như
thiếu đường dẫn plugin đóng gói kèm hoặc mục `channels.<id>` cũ cho chính
plugin đóng gói kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và gửi operator
đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là metadata gói cho một module kiểm tra rất nhỏ:

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

Dùng nó khi các luồng thiết lập, doctor, trạng thái, hoặc hiện diện chỉ đọc cần một phép thăm dò
auth có/không chi phí thấp trước khi plugin kênh đầy đủ tải. Trạng thái auth đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng metadata này để tự động bật plugin,
sửa chữa phụ thuộc runtime, hoặc quyết định liệu runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` tuân theo cùng hình dạng cho các kiểm tra đã cấu hình chỉ dùng env
chi phí thấp:

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
kênh thực, hãy giữ logic đó trong hook `config.hasConfiguredState`
của plugin.

## Thứ tự ưu tiên khám phá (id plugin trùng lặp)

OpenClaw khám phá plugin từ nhiều root (đóng gói kèm, cài đặt toàn cục, workspace, đường dẫn được chọn rõ trong cấu hình). Nếu hai khám phá chia sẻ cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ lại; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì tải bên cạnh nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn trong cấu hình** — một đường dẫn được ghim rõ trong `plugins.entries.<id>`
2. **Đóng gói kèm** — các plugin đi kèm OpenClaw
3. **Cài đặt toàn cục** — các plugin được cài vào root plugin OpenClaw toàn cục
4. **Workspace** — các plugin được khám phá tương đối với workspace hiện tại

Hệ quả:

- Một bản fork hoặc bản cũ của plugin đóng gói kèm nằm trong workspace sẽ không che khuất bản build đóng gói kèm.
- Để thực sự ghi đè plugin đóng gói kèm bằng một plugin cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo thứ tự ưu tiên thay vì dựa vào khám phá workspace.
- Các lần loại bỏ trùng lặp được ghi log để Doctor và chẩn đoán khởi động có thể chỉ đến bản sao bị loại bỏ.
- Ghi đè trùng lặp được chọn trong cấu hình được diễn đạt như ghi đè rõ ràng trong chẩn đoán, nhưng vẫn cảnh báo để các fork cũ và việc che khuất vô tình vẫn hiển thị.

## Yêu cầu JSON Schema

- **Mỗi plugin phải đi kèm một JSON Schema**, ngay cả khi nó không nhận cấu hình.
- Schema rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực khi đọc/ghi cấu hình, không phải tại runtime.
- Khi mở rộng hoặc fork plugin đóng gói kèm với khóa cấu hình mới, hãy cập nhật `configSchema` trong `openclaw.plugin.json` của plugin đó cùng lúc. Schema plugin đóng gói kèm là nghiêm ngặt, nên việc thêm `plugins.entries.<id>.config.myNewKey` trong cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi runtime plugin tải.

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
  một manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu các id plugin **có thể khám phá**. Id không xác định là **lỗi**.
- Nếu một plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  xác thực thất bại và Doctor báo lỗi plugin.
- Nếu cấu hình plugin tồn tại nhưng plugin bị **tắt**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + log.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết đầy đủ schema `plugins.*`.

## Ghi chú

- Tệp kê khai là **bắt buộc đối với các Plugin OpenClaw gốc**, bao gồm cả các lượt tải từ hệ thống tệp cục bộ. Runtime vẫn tải riêng mô-đun Plugin; tệp kê khai chỉ dùng để khám phá + xác thực.
- Tệp kê khai gốc được phân tích bằng JSON5, nên bình luận, dấu phẩy cuối và khóa không đặt trong dấu ngoặc kép được chấp nhận miễn là giá trị cuối cùng vẫn là một đối tượng.
- Trình tải tệp kê khai chỉ đọc các trường tệp kê khai đã được ghi lại trong tài liệu. Tránh dùng khóa cấp cao nhất tùy chỉnh.
- Có thể bỏ qua `channels`, `providers`, `cliBackends` và `skills` khi một Plugin không cần đến chúng.
- `providerDiscoveryEntry` phải luôn nhẹ và không nên nhập mã runtime phạm vi rộng; hãy dùng nó cho siêu dữ liệu danh mục nhà cung cấp tĩnh hoặc các bộ mô tả khám phá hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định là `legacy`).
- Khai báo loại Plugin độc quyền trong tệp kê khai này. `OpenClawPluginDefinition.kind` của điểm vào runtime đã lỗi thời và chỉ còn được giữ lại làm cơ chế dự phòng tương thích cho các Plugin cũ hơn.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã lỗi thời và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm tra, xác thực phân phối Cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi xem một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn runtime yêu cầu mã nhà cung cấp, xem [hook runtime của nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào mô-đun gốc, hãy ghi lại các bước build và mọi yêu cầu về danh sách cho phép của trình quản lý gói (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình năng lực.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu SDK Plugin và nhập subpath.
  </Card>
</CardGroup>
