---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành lược đồ cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về tệp kê khai Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-05-02T20:46:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **manifest Plugin OpenClaw gốc**.

Để biết các bố cục bundle tương thích, xem [Các bundle Plugin](/vi/plugins/bundles).

Các định dạng bundle tương thích dùng các tệp manifest khác nhau:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục bundle đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả ở đây.

Với các bundle tương thích, OpenClaw hiện đọc metadata bundle cùng với các thư mục gốc
skill đã khai báo, thư mục gốc lệnh Claude, mặc định `settings.json` của Claude bundle,
mặc định LSP của Claude bundle, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mỗi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**thư mục gốc của Plugin**. OpenClaw dùng manifest này để xác thực cấu hình
**mà không thực thi mã Plugin**. Manifest bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và chặn việc xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugins](/vi/tools/plugin).
Để biết mô hình năng lực gốc và hướng dẫn hiện tại về khả năng tương thích bên ngoài:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là metadata mà OpenClaw đọc **trước khi tải mã
Plugin của bạn**. Mọi nội dung bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime của Plugin.

**Dùng tệp này cho:**

- định danh Plugin, xác thực cấu hình, và gợi ý UI cấu hình
- metadata xác thực, onboarding, và thiết lập (bí danh, tự động bật, biến môi trường nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu viết tắt của họ mô hình
- ảnh chụp tĩnh về quyền sở hữu năng lực (`contracts`)
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

| Trường                               | Bắt buộc | Loại                             | Ý nghĩa                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | Id Plugin chuẩn tắc. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                  |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị không phải `true` nào, để Plugin vẫn bị tắt theo mặc định.                                                                         |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các id cũ được chuẩn hóa về id Plugin chuẩn tắc này.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | Các id nhà cung cấp sẽ tự động bật Plugin này khi auth, cấu hình, hoặc tham chiếu mô hình nhắc đến chúng.                                                                                                                           |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Không    | `string[]`                       | Các id kênh do Plugin này sở hữu. Được dùng cho khám phá và xác thực cấu hình.                                                                                                                                                      |
| `providers`                          | Không    | `string[]`                       | Các id nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Không    | `string`                         | Đường dẫn mô-đun khám phá nhà cung cấp nhẹ, tương đối với gốc Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp theo phạm vi manifest có thể được tải mà không kích hoạt toàn bộ runtime của Plugin.                              |
| `modelSupport`                       | Không    | `object`                         | Siêu dữ liệu rút gọn về họ mô hình do manifest sở hữu, dùng để tự động tải Plugin trước runtime.                                                                                                                                    |
| `modelCatalog`                       | Không    | `object`                         | Siêu dữ liệu danh mục mô hình khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, onboarding, bộ chọn mô hình, bí danh, và triệt tiêu trong tương lai mà không tải runtime của Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp sang id danh mục OpenRouter/LiteLLM mà không hardcode id nhà cung cấp trong lõi. |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi runtime của nhà cung cấp tải.                                                                                                                        |
| `providerEndpoints`                  | Không    | `object[]`                       | Siêu dữ liệu host/baseUrl endpoint do manifest sở hữu cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi runtime của nhà cung cấp tải.                                                                                      |
| `providerRequest`                    | Không    | `object`                         | Siêu dữ liệu nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung dùng trước khi runtime của nhà cung cấp tải.                                                                                      |
| `cliBackends`                        | Không    | `string[]`                       | Các id backend suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình rõ ràng.                                                                                                  |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Các tham chiếu nhà cung cấp hoặc backend CLI mà hook auth tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình lạnh trước khi runtime tải.                                                                    |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Các giá trị khóa API giữ chỗ do Plugin đi kèm sở hữu, biểu thị trạng thái thông tin xác thực cục bộ không bí mật, OAuth, hoặc môi trường xung quanh.                                                                                |
| `commandAliases`                     | Không    | `object[]`                       | Các tên lệnh do Plugin này sở hữu, cần tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi runtime tải.                                                                                                                     |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Siêu dữ liệu env tương thích đã ngừng khuyến nghị cho tra cứu auth/trạng thái của nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn ngừng hỗ trợ.                       |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | Các id nhà cung cấp nên tái sử dụng một id nhà cung cấp khác để tra cứu auth, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ auth của nhà cung cấp cơ sở.                                                            |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Siêu dữ liệu env kênh nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng cho thiết lập kênh dựa trên env hoặc các bề mặt auth mà trình trợ giúp khởi động/cấu hình chung cần thấy.                                       |
| `providerAuthChoices`                | Không    | `object[]`                       | Siêu dữ liệu lựa chọn auth nhẹ cho bộ chọn onboarding, phân giải nhà cung cấp ưu tiên, và nối dây cờ CLI đơn giản.                                                                                                                  |
| `activation`                         | Không    | `object`                         | Siêu dữ liệu bộ lập kế hoạch kích hoạt nhẹ cho việc tải khi khởi động, nhà cung cấp, lệnh, kênh, tuyến, và khả năng kích hoạt theo capability. Chỉ là siêu dữ liệu; runtime của Plugin vẫn sở hữu hành vi thực tế.                  |
| `setup`                              | Không    | `object`                         | Các mô tả thiết lập/onboarding nhẹ mà các bề mặt khám phá và thiết lập có thể kiểm tra mà không tải runtime của Plugin.                                                                                                             |
| `qaRunners`                          | Không    | `object[]`                       | Các mô tả trình chạy QA nhẹ được host `openclaw qa` dùng chung trước khi runtime của Plugin tải.                                                                                                                                    |
| `contracts`                          | Không    | `object`                         | Ảnh chụp quyền sở hữu capability tĩnh cho hook auth bên ngoài, lời nói, phiên âm thời gian thực, giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, web-fetch, tìm kiếm web, và quyền sở hữu công cụ.        |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Các mặc định hiểu phương tiện nhẹ cho id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `imageGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu auth tạo ảnh nhẹ cho id nhà cung cấp được khai báo trong `contracts.imageGenerationProviders`, bao gồm bí danh auth do nhà cung cấp sở hữu và bộ bảo vệ base-url.                                                     |
| `videoGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu auth tạo video nhẹ cho id nhà cung cấp được khai báo trong `contracts.videoGenerationProviders`, bao gồm bí danh auth do nhà cung cấp sở hữu và bộ bảo vệ base-url.                                                   |
| `musicGenerationProviderMetadata`    | Không    | `Record<string, object>`         | Siêu dữ liệu auth tạo nhạc nhẹ cho id nhà cung cấp được khai báo trong `contracts.musicGenerationProviders`, bao gồm bí danh auth do nhà cung cấp sở hữu và bộ bảo vệ base-url.                                                    |
| `toolMetadata`                       | Không    | `Record<string, object>`         | Siêu dữ liệu khả dụng nhẹ cho các công cụ do Plugin sở hữu được khai báo trong `contracts.tools`. Dùng khi một công cụ không nên tải runtime trừ khi có bằng chứng cấu hình, env, hoặc auth.                                       |
| `channelConfigs`                     | Không    | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do manifest sở hữu được hợp nhất vào các bề mặt khám phá và xác thực trước khi runtime tải.                                                                                                             |
| `skills`                             | Không    | `string[]`                       | Các thư mục Skills cần tải, tương đối với gốc Plugin.                                                                                                                                                                               |
| `name`                               | Không    | `string`                         | Tên Plugin dễ đọc cho con người.                                                                                                                                                                                                    |
| `description`                        | No       | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | Phiên bản Plugin dùng cho mục đích thông tin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | Nhãn UI, phần giữ chỗ và gợi ý về độ nhạy cảm cho các trường cấu hình.                                                                                                                                                                   |

## Tham chiếu siêu dữ liệu nhà cung cấp tạo sinh

Các trường siêu dữ liệu nhà cung cấp tạo sinh mô tả các tín hiệu xác thực tĩnh cho
những nhà cung cấp được khai báo trong danh sách `contracts.*GenerationProviders` tương ứng.
OpenClaw đọc các trường này trước khi runtime của nhà cung cấp tải, để các công cụ lõi có thể
quyết định liệu một nhà cung cấp tạo sinh có khả dụng hay không mà không cần import mọi
Plugin nhà cung cấp.

Chỉ dùng các trường này cho các dữ kiện khai báo, chi phí thấp. Vận chuyển, biến đổi yêu cầu,
làm mới token, xác thực thông tin xác thực, và hành vi tạo sinh thực tế
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

| Trường          | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                            |
| --------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Không    | `string[]` | Các id nhà cung cấp bổ sung nên được tính là bí danh xác thực tĩnh cho nhà cung cấp tạo sinh.                                      |
| `authProviders` | Không    | `string[]` | Các id nhà cung cấp mà hồ sơ xác thực đã cấu hình của chúng nên được tính là xác thực cho nhà cung cấp tạo sinh này.               |
| `configSignals` | Không    | `object[]` | Các tín hiệu khả dụng chỉ dựa trên cấu hình, chi phí thấp, cho nhà cung cấp cục bộ hoặc tự lưu trữ có thể cấu hình không cần hồ sơ xác thực hoặc biến môi trường. |
| `authSignals`   | Không    | `object[]` | Các tín hiệu xác thực tường minh. Khi có mặt, chúng thay thế tập tín hiệu mặc định từ id nhà cung cấp, `aliases`, và `authProviders`. |

Mỗi mục `configSignals` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                                                             |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Có       | `string`   | Đường dẫn dấu chấm tới đối tượng cấu hình thuộc sở hữu Plugin để kiểm tra, ví dụ `plugins.entries.example.config`.                                                                  |
| `overlayPath` | Không    | `string`   | Đường dẫn dấu chấm bên trong cấu hình gốc mà đối tượng của nó sẽ phủ lên đối tượng gốc trước khi đánh giá tín hiệu. Dùng trường này cho cấu hình theo năng lực như `image`, `video`, hoặc `music`. |
| `required`    | Không    | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu lực phải có giá trị đã cấu hình. Chuỗi phải không rỗng; đối tượng và mảng không được rỗng.                                           |
| `requiredAny` | Không    | `string[]` | Các đường dẫn dấu chấm bên trong cấu hình hiệu lực, trong đó ít nhất một đường dẫn phải có giá trị đã cấu hình.                                                                      |
| `mode`        | Không    | `object`   | Bộ chặn chế độ chuỗi tùy chọn bên trong cấu hình hiệu lực. Dùng khi khả dụng chỉ dựa trên cấu hình chỉ áp dụng cho một chế độ.                                                      |

Mỗi bộ chặn `mode` hỗ trợ:

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                                 |
| ------------ | -------- | ---------- | --------------------------------------------------------------------------------------- |
| `path`       | Không    | `string`   | Đường dẫn dấu chấm bên trong cấu hình hiệu lực. Mặc định là `mode`.                     |
| `default`    | Không    | `string`   | Giá trị chế độ cần dùng khi cấu hình bỏ qua đường dẫn.                                  |
| `allowed`    | Không    | `string[]` | Nếu có mặt, tín hiệu chỉ đạt khi chế độ hiệu lực là một trong các giá trị này.          |
| `disallowed` | Không    | `string[]` | Nếu có mặt, tín hiệu thất bại khi chế độ hiệu lực là một trong các giá trị này.         |

Mỗi mục `authSignals` hỗ trợ:

| Trường            | Bắt buộc | Kiểu     | Ý nghĩa                                                                                                                                                   |
| ----------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Có       | `string` | Id nhà cung cấp cần kiểm tra trong các hồ sơ xác thực đã cấu hình.                                                                                        |
| `providerBaseUrl` | Không    | `object` | Bộ chặn tùy chọn khiến tín hiệu chỉ được tính khi nhà cung cấp đã cấu hình được tham chiếu dùng một URL cơ sở được phép. Dùng khi một bí danh xác thực chỉ hợp lệ cho một số API nhất định. |

Mỗi bộ chặn `providerBaseUrl` hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                                                          |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Có       | `string`   | Id cấu hình nhà cung cấp mà `baseUrl` của nó cần được kiểm tra.                                                                                  |
| `defaultBaseUrl`  | Không    | `string`   | URL cơ sở giả định khi cấu hình nhà cung cấp bỏ qua `baseUrl`.                                                                                   |
| `allowedBaseUrls` | Có       | `string[]` | Các URL cơ sở được phép cho tín hiệu xác thực này. Tín hiệu bị bỏ qua khi URL cơ sở đã cấu hình hoặc mặc định không khớp một trong các giá trị đã chuẩn hóa này. |

## Tham chiếu siêu dữ liệu công cụ

`toolMetadata` dùng cùng dạng `configSignals` và `authSignals` như
siêu dữ liệu nhà cung cấp tạo sinh, được khóa theo tên công cụ. `contracts.tools` khai báo
quyền sở hữu. `toolMetadata` khai báo bằng chứng khả dụng chi phí thấp để OpenClaw có thể
tránh import runtime của Plugin chỉ để factory công cụ của nó trả về `null`.

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
tải Plugin sở hữu khi hợp đồng công cụ khớp với chính sách. Với các công cụ trên đường nóng
mà factory phụ thuộc vào xác thực/cấu hình, tác giả Plugin nên khai báo
`toolMetadata` thay vì khiến lõi import runtime để hỏi.

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn onboarding hoặc xác thực.
OpenClaw đọc mục này trước khi runtime của nhà cung cấp tải.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn manifest này, các lựa chọn thiết lập
suy ra từ bộ mô tả, và siêu dữ liệu danh mục cài đặt mà không cần tải runtime của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                                |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để điều phối tới.                                                                |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng onboarding và CLI.                                  |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw dùng dự phòng `choiceId`.                            |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                                       |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.                 |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                       |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ nên chuyển hướng người dùng tới lựa chọn thay thế này.                               |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                         |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng cho nhóm đó.                                                                |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                          |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                            |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn `--openrouter-api-key`.                                                           |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Không    | `string`                                        | Mô tả được dùng trong trợ giúp CLI.                                                                      |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt onboarding mà lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`.      |

## Tham chiếu commandAliases

Sử dụng `commandAliases` khi một Plugin sở hữu tên lệnh runtime mà người dùng có thể
nhầm đưa vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw
sử dụng siêu dữ liệu này cho chẩn đoán mà không nhập mã runtime của Plugin.

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
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu alias là lệnh gạch chéo trong trò chuyện thay vì lệnh CLI gốc. |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có.           |

## Tham chiếu activation

Sử dụng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện control-plane
nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu của planner, không phải API vòng đời. Nó không đăng ký
hành vi runtime, không thay thế `register(...)`, và không cam kết rằng
mã Plugin đã được thực thi. Planner kích hoạt sử dụng các trường này để
thu hẹp các Plugin ứng viên trước khi quay lại siêu dữ liệu sở hữu manifest hiện có
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hooks.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Sử dụng
`providers`, `channels`, `commandAliases`, bộ mô tả setup, hoặc `contracts`
khi các trường đó biểu đạt mối quan hệ. Sử dụng `activation` cho các gợi ý planner
bổ sung không thể biểu diễn bằng các trường sở hữu đó.
Sử dụng `cliBackends` cấp cao nhất cho các alias runtime CLI như `claude-cli`,
`codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
id agent harness nhúng chưa có trường sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi runtime, và không
thay thế `register(...)`, `setupEntry`, hay các entrypoint runtime/Plugin khác.
Các consumer hiện tại dùng nó như một gợi ý thu hẹp trước khi tải Plugin rộng hơn, vì vậy
thiếu siêu dữ liệu activation không phải startup thường chỉ tốn hiệu năng; nó
không nên thay đổi tính đúng đắn khi các fallback sở hữu manifest vẫn tồn tại.

Mỗi Plugin nên đặt `activation.onStartup` một cách có chủ ý. Đặt là `true`
chỉ khi Plugin phải chạy trong lúc Gateway startup. Đặt là `false` khi
Plugin bất hoạt ở startup và chỉ nên tải từ các trigger hẹp hơn.
Việc bỏ qua `onStartup` không còn ngầm tải Plugin khi startup; hãy dùng siêu dữ liệu
activation rõ ràng cho startup, channel, config, agent-harness, memory, hoặc
các trigger activation hẹp khác.

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

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                         |
| ------------------ | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt Gateway startup rõ ràng. Mỗi Plugin nên đặt trường này. `true` nhập Plugin trong lúc startup; `false` giữ nó lazy khi startup trừ khi một trigger khớp khác yêu cầu tải.              |
| `onProviders`      | Không    | `string[]`                                           | Id provider nên đưa Plugin này vào kế hoạch activation/load.                                                                                                                                     |
| `onAgentHarnesses` | Không    | `string[]`                                           | Id runtime agent harness nhúng nên đưa Plugin này vào kế hoạch activation/load. Sử dụng `cliBackends` cấp cao nhất cho alias backend CLI.                                                        |
| `onCommands`       | Không    | `string[]`                                           | Id lệnh nên đưa Plugin này vào kế hoạch activation/load.                                                                                                                                         |
| `onChannels`       | Không    | `string[]`                                           | Id channel nên đưa Plugin này vào kế hoạch activation/load.                                                                                                                                      |
| `onRoutes`         | Không    | `string[]`                                           | Loại route nên đưa Plugin này vào kế hoạch activation/load.                                                                                                                                      |
| `onConfigPaths`    | Không    | `string[]`                                           | Đường dẫn config tương đối từ gốc nên đưa Plugin này vào kế hoạch startup/load khi đường dẫn hiện diện và không bị tắt rõ ràng.                                                                 |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Gợi ý capability rộng được dùng bởi lập kế hoạch activation control-plane. Ưu tiên các trường hẹp hơn khi có thể.                                                                               |

Consumer live hiện tại:

- Lập kế hoạch Gateway startup sử dụng `activation.onStartup` để nhập startup
  rõ ràng
- lập kế hoạch CLI do lệnh kích hoạt quay lại dùng legacy
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- lập kế hoạch startup agent-runtime sử dụng `activation.onAgentHarnesses` cho
  harness nhúng và `cliBackends[]` cấp cao nhất cho alias runtime CLI
- lập kế hoạch setup/channel do channel kích hoạt quay lại dùng quyền sở hữu
  `channels[]` legacy khi thiếu siêu dữ liệu channel activation rõ ràng
- lập kế hoạch Plugin startup sử dụng `activation.onConfigPaths` cho các bề mặt
  config gốc không phải channel, chẳng hạn khối `browser` của Plugin trình duyệt đi kèm
- lập kế hoạch setup/runtime do provider kích hoạt quay lại dùng quyền sở hữu
  `providers[]` legacy và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu
  provider activation rõ ràng

Chẩn đoán planner có thể phân biệt gợi ý activation rõ ràng với fallback
sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là
planner đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho
chẩn đoán host và kiểm thử; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu
mô tả tốt nhất quyền sở hữu.

## Tham chiếu qaRunners

Sử dụng `qaRunners` khi một Plugin đóng góp một hoặc nhiều transport runner bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; runtime Plugin
vẫn sở hữu việc đăng ký CLI thực tế thông qua bề mặt `runtime-api.ts`
gọn nhẹ xuất `qaRunnerCliRegistrations`.

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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                                 |
| ------------- | -------- | -------- | ----------------------------------------------------------------------- |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.               |
| `description` | Không    | `string` | Văn bản trợ giúp fallback dùng khi host dùng chung cần một lệnh stub.   |

## Tham chiếu setup

Sử dụng `setup` khi các bề mặt setup và onboarding cần siêu dữ liệu do Plugin sở hữu
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

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI.
`setup.cliBackends` là bề mặt bộ mô tả riêng cho setup dành cho các luồng
control-plane/setup cần giữ ở dạng chỉ siêu dữ liệu.

Khi hiện diện, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu
ưu tiên theo hướng descriptor-first cho khám phá setup. Nếu bộ mô tả chỉ
thu hẹp Plugin ứng viên và setup vẫn cần các hook runtime thời điểm setup
phong phú hơn, hãy đặt `requiresRuntime: true` và giữ `setup-api` làm
đường dẫn thực thi fallback.

OpenClaw cũng đưa `setup.providers[].envVars` vào các tra cứu auth provider chung và
env-var. `providerAuthEnvVars` vẫn được hỗ trợ thông qua adapter tương thích
trong thời gian deprecation window, nhưng các Plugin không đi kèm vẫn dùng nó
sẽ nhận chẩn đoán manifest. Plugin mới nên đặt siêu dữ liệu env setup/status
trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods`
khi không có setup entry, hoặc khi `setup.requiresRuntime: false`
khai báo rằng setup runtime không cần thiết. Các entry `providerAuthChoices` rõ ràng vẫn
được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding, và siêu dữ liệu assistant.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó đủ cho bề mặt
setup. OpenClaw xem `false` rõ ràng là một hợp đồng chỉ descriptor
và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` cho tra cứu setup. Nếu
một Plugin chỉ descriptor vẫn cung cấp một trong các entry runtime setup đó,
OpenClaw báo cáo một chẩn đoán bổ sung và tiếp tục bỏ qua nó. Việc bỏ qua
`requiresRuntime` giữ hành vi fallback legacy để các Plugin hiện có đã thêm
descriptor mà không có cờ này không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị
`setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải luôn là duy nhất trên
các Plugin được khám phá. Quyền sở hữu mơ hồ sẽ đóng an toàn thay vì chọn
một bên thắng dựa trên thứ tự khám phá.

Khi setup runtime thực thi, chẩn đoán registry setup báo cáo độ lệch descriptor
nếu `setup-api` đăng ký một provider hoặc backend CLI mà manifest
descriptor không khai báo, hoặc nếu một descriptor không có runtime registration
khớp. Các chẩn đoán này là bổ sung và không từ chối Plugin legacy.

### Tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                  |
| -------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Id provider được phơi bày trong setup hoặc onboarding. Giữ các id đã chuẩn hóa là duy nhất toàn cục.     |
| `authMethods`  | Không    | `string[]` | Id phương thức setup/auth mà provider này hỗ trợ mà không cần tải toàn bộ runtime.                       |
| `envVars`      | Không    | `string[]` | Env vars mà các bề mặt setup/status chung có thể kiểm tra trước khi runtime Plugin tải.                  |
| `authEvidence` | Không    | `object[]` | Kiểm tra bằng chứng auth cục bộ nhẹ cho các provider có thể xác thực thông qua marker không bí mật.      |

`authEvidence` dùng cho các dấu hiệu thông tin xác thực cục bộ do nhà cung cấp sở hữu, có thể được xác minh mà không cần tải mã runtime. Các kiểm tra này phải luôn rẻ và cục bộ: không gọi mạng, không đọc keychain hoặc trình quản lý bí mật, không chạy lệnh shell, và không thăm dò API của nhà cung cấp.

Các mục bằng chứng được hỗ trợ:

| Trường             | Bắt buộc | Loại       | Ý nghĩa                                                                                                                |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type`             | Có       | `string`   | Hiện là `local-file-with-env`.                                                                                         |
| `fileEnvVar`       | Không    | `string`   | Biến môi trường chứa đường dẫn tệp thông tin xác thực rõ ràng.                                                         |
| `fallbackPaths`    | Không    | `string[]` | Các đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`   | Không    | `string[]` | Ít nhất một biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                  |
| `requiresAllEnv`   | Không    | `string[]` | Mọi biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                          |
| `credentialMarker` | Có       | `string`   | Dấu hiệu không bí mật được trả về khi có bằng chứng.                                                                   |
| `source`           | Không    | `string`   | Nhãn nguồn hiển thị cho người dùng trong đầu ra xác thực/trạng thái.                                                   |

### Các trường setup

| Trường             | Bắt buộc | Loại       | Ý nghĩa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Bộ mô tả thiết lập nhà cung cấp được hiển thị trong quá trình thiết lập và onboarding.                   |
| `cliBackends`      | Không    | `string[]` | ID backend tại thời điểm thiết lập dùng cho tra cứu thiết lập ưu tiên bộ mô tả. Giữ ID đã chuẩn hóa là duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | ID di chuyển cấu hình thuộc bề mặt thiết lập của Plugin này.                                             |
| `requiresRuntime`  | Không    | `boolean`  | Thiết lập có còn cần thực thi `setup-api` sau khi tra cứu bộ mô tả hay không.                            |

## Tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình đến các gợi ý hiển thị nhỏ.

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
| `label`       | `string`   | Nhãn trường hiển thị cho người dùng.         |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                       |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                             |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.                 |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm.     |
| `placeholder` | `string`   | Văn bản placeholder cho đầu vào biểu mẫu.    |

## Tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu sở hữu năng lực tĩnh mà OpenClaw có thể đọc mà không cần nhập runtime của Plugin.

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

| Trường                           | Loại       | Ý nghĩa                                                                 |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory tiện ích mở rộng app-server của Codex, hiện là `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime mà một Plugin đi kèm có thể đăng ký middleware kết quả công cụ cho chúng. |
| `externalAuthProviders`          | `string[]` | ID nhà cung cấp có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.  |
| `speechProviders`                | `string[]` | ID nhà cung cấp giọng nói do Plugin này sở hữu.                         |
| `realtimeTranscriptionProviders` | `string[]` | ID nhà cung cấp phiên âm thời gian thực do Plugin này sở hữu.           |
| `realtimeVoiceProviders`         | `string[]` | ID nhà cung cấp giọng nói thời gian thực do Plugin này sở hữu.          |
| `memoryEmbeddingProviders`       | `string[]` | ID nhà cung cấp embedding bộ nhớ do Plugin này sở hữu.                  |
| `mediaUnderstandingProviders`    | `string[]` | ID nhà cung cấp hiểu phương tiện do Plugin này sở hữu.                  |
| `imageGenerationProviders`       | `string[]` | ID nhà cung cấp tạo hình ảnh do Plugin này sở hữu.                      |
| `videoGenerationProviders`       | `string[]` | ID nhà cung cấp tạo video do Plugin này sở hữu.                         |
| `webFetchProviders`              | `string[]` | ID nhà cung cấp tìm nạp web do Plugin này sở hữu.                       |
| `webSearchProviders`             | `string[]` | ID nhà cung cấp tìm kiếm web do Plugin này sở hữu.                      |
| `migrationProviders`             | `string[]` | ID nhà cung cấp nhập do Plugin này sở hữu cho `openclaw migrate`.       |
| `tools`                          | `string[]` | Tên công cụ agent do Plugin này sở hữu.                                 |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng chỉ dành cho app-server Codex đi kèm. Các biến đổi kết quả công cụ đi kèm nên khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng `api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể đăng ký middleware kết quả công cụ vì đường nối này có thể viết lại đầu ra công cụ có độ tin cậy cao trước khi mô hình nhìn thấy nó.

Các đăng ký runtime `api.registerTool(...)` phải khớp với `contracts.tools`.
Quá trình khám phá công cụ sử dụng danh sách này để chỉ tải các runtime Plugin có thể sở hữu các công cụ được yêu cầu.

Các Plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo `contracts.externalAuthProviders`. Plugin không có khai báo này vẫn chạy qua cơ chế tương thích dự phòng đã lỗi thời, nhưng cơ chế dự phòng đó chậm hơn và sẽ bị gỡ bỏ sau thời gian chuyển đổi.

Các nhà cung cấp embedding bộ nhớ được đóng gói nên khai báo `contracts.memoryEmbeddingProviders` cho mọi id adapter mà chúng cung cấp, bao gồm các adapter tích hợp sẵn như `local`. Các đường dẫn CLI độc lập sử dụng hợp đồng manifest này để chỉ tải Plugin sở hữu trước khi toàn bộ runtime Gateway đã đăng ký nhà cung cấp.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu biết phương tiện có mô hình mặc định, mức ưu tiên dự phòng tự động cho xác thực, hoặc hỗ trợ tài liệu gốc mà các helper lõi chung cần trước khi runtime tải. Các khóa cũng phải được khai báo trong `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Các năng lực phương tiện mà nhà cung cấp này cung cấp.                       |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ năng lực sang mô hình được dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho dự phòng nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                               |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi một Plugin kênh cần metadata cấu hình nhẹ trước khi runtime tải. Quá trình khám phá thiết lập/trạng thái kênh chỉ đọc có thể dùng trực tiếp metadata này cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập nào, hoặc khi `setup.requiresRuntime: false` khai báo rằng runtime thiết lập là không cần thiết.

`channelConfigs` là metadata manifest Plugin, không phải một phần cấu hình người dùng cấp cao mới. Người dùng vẫn cấu hình các instance kênh trong `channels.<channel-id>`. OpenClaw đọc metadata manifest để quyết định Plugin nào sở hữu kênh đã cấu hình đó trước khi mã runtime Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không đóng gói khai báo `channels[]` cũng nên khai báo các mục `channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng schema cấu hình đường dẫn lạnh, thiết lập và các bề mặt Control UI không thể biết hình dạng tùy chọn do kênh sở hữu cho đến khi runtime Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và `nativeSkillsAutoEnabled` có thể khai báo các mặc định `auto` tĩnh cho các kiểm tra cấu hình lệnh chạy trước khi runtime kênh tải. Các kênh được đóng gói cũng có thể xuất bản cùng các mặc định đó qua `package.json#openclaw.channel.commands` cùng với metadata danh mục kênh khác do gói sở hữu.

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

| Trường       | Kiểu                     | Ý nghĩa                                                                                          |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho mỗi mục cấu hình kênh đã khai báo.                 |
| `uiHints`     | `Record<string, object>` | Nhãn UI/placeholder/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                           |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi siêu dữ liệu runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và danh mục.                                             |
| `commands`    | `object`                 | Lệnh gốc tĩnh và giá trị mặc định tự động của kỹ năng gốc cho kiểm tra cấu hình trước runtime.  |
| `preferOver`  | `string[]`               | Các id Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên vượt lên trong các bề mặt chọn.   |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà
một Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là id Plugin đã đổi tên, một
Plugin độc lập thay thế một Plugin đóng gói sẵn, hoặc một fork được duy trì
giữ nguyên id kênh để tương thích cấu hình.

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
nó được đóng gói sẵn hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong cấu hình
runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng
vẫn được ưu tiên: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin đã được yêu cầu.

Giữ `preferOver` trong phạm vi các id Plugin thật sự có thể cung cấp cùng một kênh.
Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình của người dùng.

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

- các tham chiếu `provider/model` rõ ràng dùng siêu dữ liệu manifest `providers` sở hữu
- `modelPatterns` được ưu tiên hơn `modelPrefixes`
- nếu một Plugin không đóng gói sẵn và một Plugin đóng gói sẵn đều khớp, Plugin không đóng gói sẵn
  thắng
- phần mơ hồ còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                                 |
| --------------- | ---------- | --------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với id mô hình viết tắt.                        |
| `modelPatterns` | `string[]` | Nguồn regex được khớp với id mô hình viết tắt sau khi loại bỏ hậu tố hồ sơ.             |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw cần biết siêu dữ liệu mô hình của nhà cung cấp trước khi
tải runtime Plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định,
bí danh nhà cung cấp, quy tắc chặn hiển thị và chế độ khám phá. Việc làm mới runtime
vẫn thuộc về mã runtime của nhà cung cấp, nhưng manifest cho core biết khi nào cần runtime.

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

| Trường         | Kiểu                                                     | Ý nghĩa                                                                                                             |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho id nhà cung cấp do Plugin này sở hữu. Khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải về một nhà cung cấp sở hữu cho lập kế hoạch danh mục hoặc chặn hiển thị.         |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này chặn hiển thị vì lý do dành riêng cho nhà cung cấp.                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Danh mục nhà cung cấp có thể được đọc từ siêu dữ liệu manifest, làm mới vào bộ nhớ đệm, hay cần runtime.            |

`aliases` tham gia vào tra cứu quyền sở hữu nhà cung cấp cho lập kế hoạch danh mục mô hình.
Mục tiêu bí danh phải là các nhà cung cấp cấp cao nhất do cùng một Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng ghi đè API/base URL của bí danh mà không tải runtime nhà cung cấp.
Bí danh không mở rộng các danh sách danh mục không lọc; các danh sách rộng chỉ phát ra
các hàng nhà cung cấp chính tắc sở hữu.

`suppressions` thay thế hook `suppressBuiltInModel` runtime nhà cung cấp cũ.
Các mục chặn hiển thị chỉ được áp dụng khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ tới một nhà cung cấp sở hữu. Các hook
chặn hiển thị runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                                  |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Base URL mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ điều hợp API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.              |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` bị bỏ qua.             |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                                 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id mô hình cục bộ của nhà cung cấp, không có tiền tố `provider/`.                       |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                                  |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn cho từng mô hình.                                                   |
| `baseUrl`       | `string`                                                       | Ghi đè base URL tùy chọn cho từng mô hình.                                              |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn cho từng mô hình.                                                  |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức mà mô hình chấp nhận.                                                   |
| `reasoning`     | `boolean`                                                      | Mô hình có bộc lộ hành vi suy luận hay không.                                           |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                                   |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu lực tùy chọn khi khác với `contextWindow`.               |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết.                                                        |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.                |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình của OpenClaw.    |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ chặn hiển thị khi hàng hoàn toàn không được xuất hiện.          |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị cùng trạng thái không khả dụng.                                 |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ cũ hơn của nhà cung cấp mà mô hình này thay thế.                  |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ của nhà cung cấp thay thế cho các hàng đã ngừng khuyến nghị.          |
| `tags`          | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc dùng.                                            |

Các trường chặn hiển thị:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id nhà cung cấp cho hàng upstream cần chặn hiển thị. Phải do Plugin này sở hữu hoặc được khai báo là bí danh sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ của nhà cung cấp cần chặn hiển thị.                                                               |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng bị chặn hiển thị được yêu cầu trực tiếp.                                       |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host base URL hiệu lực của nhà cung cấp, bắt buộc có trước khi áp dụng chặn hiển thị.        |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` cấu hình nhà cung cấp chính xác, bắt buộc có trước khi áp dụng chặn hiển thị.  |

Không đặt dữ liệu chỉ dành cho runtime trong `modelCatalog`. Chỉ dùng `static` khi các hàng manifest đủ hoàn chỉnh để các bề mặt danh sách được lọc theo nhà cung cấp và bộ chọn có thể bỏ qua bước khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là các seed hoặc phần bổ sung hữu ích có thể liệt kê, nhưng refresh/cache có thể thêm nhiều hàng hơn về sau; bản thân các hàng refreshable không có tính thẩm quyền. Dùng `runtime` khi OpenClaw phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp model-id giá rẻ do nhà cung cấp sở hữu, cần diễn ra trước khi runtime của nhà cung cấp được tải. Điều này giữ các alias như tên model ngắn, id kế thừa cục bộ của nhà cung cấp, và quy tắc tiền tố proxy trong manifest Plugin sở hữu thay vì trong các bảng chọn model lõi.

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

| Trường                               | Loại                    | Ý nghĩa                                                                                          |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Các alias model-id khớp chính xác, không phân biệt chữ hoa chữ thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần loại bỏ trước khi tra cứu alias, hữu ích cho trùng lặp provider/model kế thừa.   |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi id model đã chuẩn hóa chưa chứa `/`.                                        |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc tiền tố bare-id có điều kiện sau khi tra cứu alias, được khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung phải biết trước khi runtime của nhà cung cấp được tải. Core vẫn sở hữu ý nghĩa của từng `endpointClass`; manifest Plugin sở hữu metadata máy chủ và URL cơ sở.

Trường endpoint:

| Trường                         | Loại       | Ý nghĩa                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint core đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên máy chủ chính xác ánh xạ tới lớp endpoint.                                                   |
| `hostSuffixes`                 | `string[]` | Hậu tố máy chủ ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố miền.               |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                               |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các máy chủ toàn cục chính xác.                                     |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi máy chủ khớp để hiển thị tiền tố vùng Google Vertex.                    |

## Tham chiếu providerRequest

Dùng `providerRequest` cho metadata tương thích yêu cầu giá rẻ mà chính sách yêu cầu chung cần mà không tải runtime của nhà cung cấp. Giữ việc viết lại payload theo hành vi cụ thể trong các hook runtime của nhà cung cấp hoặc helper dùng chung cho họ nhà cung cấp.

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

| Trường                | Loại         | Ý nghĩa                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp dùng cho quyết định tương thích yêu cầu chung và chẩn đoán.        |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho các helper yêu cầu dùng chung.            |
| `openAICompletions`   | `object`     | Cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.            |

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá control-plane trước khi runtime được tải. Cache định giá của Gateway đọc metadata này mà không import mã runtime của nhà cung cấp.

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

| Trường       | Loại              | Ý nghĩa                                                                                             |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho nhà cung cấp cục bộ/tự lưu trữ không bao giờ nên lấy giá OpenRouter hoặc LiteLLM.   |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.                 |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.                       |

Trường nguồn:

| Trường                     | Loại               | Ý nghĩa                                                                                                                |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id nhà cung cấp catalog bên ngoài khi khác với id nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`.         |
| `passthroughProviderModel` | `boolean`          | Xem các id model chứa dấu gạch chéo là tham chiếu nhà cung cấp/model lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Biến thể model-id catalog bên ngoài bổ sung. `version-dots` thử các id phiên bản có dấu chấm như `claude-opus-4.6`.   |

### Chỉ mục nhà cung cấp OpenClaw

Chỉ mục nhà cung cấp OpenClaw là metadata xem trước do OpenClaw sở hữu cho các nhà cung cấp mà Plugin của chúng có thể chưa được cài đặt. Nó không phải là một phần của manifest Plugin. Manifest Plugin vẫn là thẩm quyền của Plugin đã cài đặt. Chỉ mục nhà cung cấp là hợp đồng fallback nội bộ mà các bề mặt nhà cung cấp có thể cài đặt trong tương lai và bộ chọn model trước cài đặt sẽ sử dụng khi Plugin của nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. Manifest Plugin đã cài đặt `modelCatalog`.
3. Cache catalog model từ refresh rõ ràng.
4. Các hàng xem trước trong Chỉ mục nhà cung cấp OpenClaw.

Chỉ mục nhà cung cấp không được chứa bí mật, trạng thái bật, hook runtime, hoặc dữ liệu model riêng theo tài khoản trực tiếp. Catalog xem trước của nó dùng cùng hình dạng hàng nhà cung cấp `modelCatalog` như manifest Plugin, nhưng nên giới hạn ở metadata hiển thị ổn định trừ khi các trường adapter runtime như `api`, `baseUrl`, giá, hoặc cờ tương thích được cố ý giữ đồng bộ với manifest Plugin đã cài đặt. Các nhà cung cấp có khám phá `/models` trực tiếp nên ghi các hàng đã refresh qua đường dẫn cache catalog model rõ ràng thay vì để việc liệt kê hoặc onboarding thông thường gọi API nhà cung cấp.

Các mục Chỉ mục nhà cung cấp cũng có thể mang metadata Plugin có thể cài đặt cho các nhà cung cấp có Plugin đã được chuyển ra khỏi core hoặc hiện chưa được cài đặt. Metadata này phản chiếu mẫu catalog kênh: tên gói, spec cài đặt npm, integrity kỳ vọng, và nhãn lựa chọn xác thực giá rẻ là đủ để hiển thị một tùy chọn thiết lập có thể cài đặt. Khi Plugin được cài đặt, manifest của nó thắng và mục Chỉ mục nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa capability cấp cao kế thừa đã bị loại bỏ dần. Dùng `openclaw doctor --fix` để chuyển `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; việc tải manifest bình thường không còn xem các trường cấp cao đó là quyền sở hữu capability.

## Manifest so với package.json

Hai tệp phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, metadata lựa chọn xác thực, và gợi ý UI phải tồn tại trước khi mã Plugin chạy                     |
| `package.json`         | Metadata npm, cài đặt dependency, và khối `openclaw` dùng cho entrypoint, cổng cài đặt, thiết lập, hoặc metadata catalog       |

Nếu bạn không chắc một phần metadata thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số metadata Plugin trước runtime được cố ý đặt trong `package.json` dưới khối `openclaw` thay vì `openclaw.plugin.json`.
`openclaw.bundle` và `openclaw.bundle.json` không phải là hợp đồng Plugin OpenClaw; Plugin native phải dùng `openclaw.plugin.json` cộng với các trường `package.json#openclaw` được hỗ trợ bên dưới.

Ví dụ quan trọng:

| Trường                                                                                     | Ý nghĩa                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Khai báo các entrypoint Plugin gốc. Phải nằm trong thư mục gói Plugin.                                                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Khai báo các entrypoint runtime JavaScript đã được build cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                          |
| `openclaw.setupEntry`                                                                      | Entrypoint nhẹ chỉ dành cho thiết lập, được dùng trong quá trình onboarding, khởi động kênh bị trì hoãn, và phát hiện trạng thái kênh chỉ đọc/SecretRef. Phải nằm trong thư mục gói Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Khai báo entrypoint thiết lập JavaScript đã được build cho các gói đã cài đặt. Yêu cầu `setupEntry`, phải tồn tại, và phải nằm trong thư mục gói Plugin.                                     |
| `openclaw.channel`                                                                         | Siêu dữ liệu danh mục kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                                  |
| `openclaw.channel.commands`                                                                | Siêu dữ liệu tĩnh cho lệnh gốc và mặc định tự động cho skill gốc, được dùng bởi cấu hình, kiểm toán, và các bề mặt danh sách lệnh trước khi runtime kênh tải.                               |
| `openclaw.channel.configuredState`                                                         | Siêu dữ liệu kiểm tra trạng thái đã cấu hình nhẹ, có thể trả lời "thiết lập chỉ bằng env đã tồn tại chưa?" mà không tải toàn bộ runtime kênh.                                                |
| `openclaw.channel.persistedAuthState`                                                      | Siêu dữ liệu kiểm tra xác thực đã lưu nhẹ, có thể trả lời "đã có gì đăng nhập chưa?" mà không tải toàn bộ runtime kênh.                                                                      |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Gợi ý cài đặt/cập nhật cho các Plugin được đóng gói kèm và được phát hành bên ngoài.                                                                                                        |
| `openclaw.install.defaultChoice`                                                           | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt khả dụng.                                                                                                                               |
| `openclaw.install.minHostVersion`                                                          | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22` hoặc `>=2026.5.1-beta.1`.                                                                                |
| `openclaw.install.expectedIntegrity`                                                       | Chuỗi toàn vẹn npm dist dự kiến như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải dựa trên chuỗi này.                                                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Cho phép một đường dẫn khôi phục cài đặt lại Plugin đóng gói kèm trong phạm vi hẹp khi cấu hình không hợp lệ.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước Plugin kênh đầy đủ trong quá trình khởi động.                                                                                      |

Siêu dữ liệu manifest quyết định những lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách tải về hoặc bật Plugin đó khi người dùng chọn một trong các
lựa chọn đó. Không chuyển các gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
registry manifest cho các nguồn Plugin không được đóng gói kèm. Giá trị không hợp lệ bị từ chối;
giá trị mới hơn nhưng hợp lệ sẽ bỏ qua các Plugin bên ngoài trên host cũ hơn. Các Plugin nguồn
được đóng gói kèm được giả định là cùng phiên bản với checkout của host.

Siêu dữ liệu cài đặt theo nhu cầu chính thức nên dùng `clawhubSpec` khi Plugin được
phát hành trên ClawHub; onboarding xem đó là nguồn từ xa ưu tiên và
ghi lại các dữ kiện artifact ClawHub sau khi cài đặt. `npmSpec` vẫn là phương án tương thích
dự phòng cho các gói chưa chuyển sang ClawHub.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức
nên ghép các spec chính xác với `expectedIntegrity` để luồng cập nhật thất bại theo hướng đóng
nếu artifact npm đã tải không còn khớp với bản phát hành đã ghim.
Onboarding tương tác vẫn cung cấp các spec npm từ registry tin cậy, bao gồm tên gói trần
và dist-tag, để tương thích. Chẩn đoán danh mục có thể phân biệt
nguồn chính xác, trôi nổi, được ghim toàn vẹn, thiếu toàn vẹn, tên gói
không khớp, và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
có `expectedIntegrity` nhưng không có nguồn npm hợp lệ nào để ghim.
Khi có `expectedIntegrity`,
các luồng cài đặt/cập nhật sẽ thực thi nó; khi bị bỏ qua, quá trình phân giải registry được
ghi lại mà không có ghim toàn vẹn.

Các Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc các lần quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
runtime. Entry thiết lập nên phơi bày siêu dữ liệu kênh cùng với các bộ chuyển đổi cấu hình,
trạng thái, và bí mật an toàn cho thiết lập; giữ các client mạng, listener gateway, và
runtime vận chuyển trong entrypoint extension chính.

Các trường entrypoint runtime không ghi đè kiểm tra ranh giới gói cho các trường
entrypoint nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể khiến một đường dẫn
`openclaw.extensions` thoát ra ngoài trở nên có thể tải được.

`openclaw.install.allowInvalidConfigRecovery` có chủ ý rất hẹp. Nó không khiến
các cấu hình hỏng tùy ý trở nên có thể cài đặt. Hiện tại nó chỉ cho phép các luồng cài đặt
khôi phục từ các lỗi nâng cấp Plugin đóng gói kèm đã cũ cụ thể, chẳng hạn như
thiếu đường dẫn Plugin đóng gói kèm hoặc mục `channels.<id>` đã cũ cho chính
Plugin đóng gói kèm đó. Các lỗi cấu hình không liên quan vẫn chặn cài đặt và gửi người vận hành
đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là siêu dữ liệu gói cho một module kiểm tra nhỏ:

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
xác thực có/không rẻ trước khi Plugin kênh đầy đủ tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật Plugin,
sửa phụ thuộc runtime, hoặc quyết định liệu runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` có cùng hình dạng cho các kiểm tra đã cấu hình
chỉ bằng env với chi phí thấp:

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
không thuộc runtime khác. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc
runtime kênh thực, hãy giữ logic đó trong hook `config.hasConfiguredState`
của Plugin.

## Thứ tự ưu tiên phát hiện (id Plugin trùng lặp)

OpenClaw phát hiện Plugin từ nhiều gốc (đóng gói kèm, cài đặt toàn cục, workspace, đường dẫn được chọn rõ ràng trong cấu hình). Nếu hai phát hiện dùng chung cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ lại; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì tải song song với nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn trong cấu hình** — một đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đóng gói kèm** — Plugin được phát hành cùng OpenClaw
3. **Cài đặt toàn cục** — Plugin được cài vào gốc Plugin OpenClaw toàn cục
4. **Workspace** — Plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc đã cũ của Plugin đóng gói kèm nằm trong workspace sẽ không che khuất bản build đóng gói kèm.
- Để thực sự ghi đè một Plugin đóng gói kèm bằng bản cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo thứ tự ưu tiên thay vì dựa vào phát hiện workspace.
- Các bản trùng lặp bị loại bỏ được ghi log để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao đã bị loại.
- Các ghi đè trùng lặp được chọn trong cấu hình được diễn đạt là ghi đè rõ ràng trong chẩn đoán, nhưng vẫn cảnh báo để các fork đã cũ và che khuất ngoài ý muốn vẫn hiển thị.

## Yêu cầu JSON Schema

- **Mọi Plugin phải phát hành kèm JSON Schema**, ngay cả khi nó không nhận cấu hình.
- Schema rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại runtime.
- Khi mở rộng hoặc fork một Plugin đóng gói kèm với các khóa cấu hình mới, hãy cập nhật `configSchema` trong `openclaw.plugin.json` của Plugin đó cùng lúc. Schema của Plugin đóng gói kèm là nghiêm ngặt, vì vậy việc thêm `plugins.entries.<id>.config.myNewKey` vào cấu hình người dùng mà không thêm `myNewKey` vào `configSchema.properties` sẽ bị từ chối trước khi runtime Plugin tải.

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
  một manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu các id Plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  xác thực thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + log.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết đầy đủ schema `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw gốc**, bao gồm cả việc tải từ hệ thống tệp cục bộ. Runtime vẫn tải riêng mô-đun Plugin; manifest chỉ dùng cho khám phá + xác thực.
- Manifest gốc được phân tích cú pháp bằng JSON5, nên chấp nhận chú thích, dấu phẩy cuối và khóa không có dấu ngoặc kép miễn là giá trị cuối cùng vẫn là một object.
- Trình tải manifest chỉ đọc các trường manifest đã được ghi tài liệu. Tránh dùng các khóa cấp cao nhất tùy chỉnh.
- Có thể bỏ qua `channels`, `providers`, `cliBackends` và `skills` khi Plugin không cần chúng.
- `providerDiscoveryEntry` phải luôn nhẹ và không nên import mã runtime rộng; hãy dùng nó cho siêu dữ liệu danh mục provider tĩnh hoặc các descriptor khám phá hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` ở entry runtime đã ngừng được khuyến nghị và chỉ còn là phương án tương thích dự phòng cho các Plugin cũ.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã ngừng được khuyến nghị, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm tra, xác thực phân phối cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu dụng trước khi coi một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu wizard runtime cần mã provider, xem [hook runtime provider](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào các mô-đun gốc, hãy ghi tài liệu các bước build và mọi yêu cầu allowlist của trình quản lý gói (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình năng lực.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tài liệu tham khảo Plugin SDK và import subpath.
  </Card>
</CardGroup>
