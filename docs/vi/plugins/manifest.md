---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành một lược đồ cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về manifest Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-04-29T23:00:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a529f9d4388039d76a6e351b454622b657a1ddcd4f4159f10be988568343cc2
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **tệp kê khai Plugin OpenClaw gốc**.

Để biết các bố cục gói tương thích, xem [Các gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích dùng các tệp kê khai khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có tệp kê khai
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo schema `openclaw.plugin.json` được mô tả ở đây.

Đối với các gói tương thích, OpenClaw hiện đọc siêu dữ liệu gói cùng với các gốc
skill đã khai báo, gốc lệnh Claude, giá trị mặc định `settings.json` của gói Claude,
giá trị mặc định LSP của gói Claude, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mọi Plugin OpenClaw gốc **phải** đi kèm tệp `openclaw.plugin.json` trong
**gốc Plugin**. OpenClaw dùng tệp kê khai này để xác thực cấu hình
**mà không thực thi mã Plugin**. Tệp kê khai bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và chặn việc xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugin](/vi/tools/plugin).
Đối với mô hình năng lực gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là siêu dữ liệu OpenClaw đọc **trước khi tải mã
Plugin của bạn**. Mọi nội dung bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime Plugin.

**Dùng tệp này cho:**

- danh tính Plugin, xác thực cấu hình và gợi ý giao diện cấu hình
- siêu dữ liệu xác thực, onboarding và thiết lập (bí danh, tự động bật, biến môi trường nhà cung cấp, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu họ mô hình dạng viết tắt
- ảnh chụp tĩnh về quyền sở hữu năng lực (`contracts`)
- siêu dữ liệu trình chạy QA mà host `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình riêng cho kênh được hợp nhất vào catalog và các bề mặt xác thực

**Không dùng tệp này cho:** đăng ký hành vi runtime, khai báo entrypoint mã,
hoặc siêu dữ liệu cài đặt npm. Những phần đó thuộc về mã Plugin của bạn và `package.json`.

## Ví dụ tối giản

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

| Trường                                | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                           |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | Id Plugin chính tắc. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị nào không phải `true`, để giữ Plugin bị tắt theo mặc định.                                                                        |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các id cũ được chuẩn hóa về id Plugin chính tắc này.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | Các id nhà cung cấp nên tự động bật Plugin này khi auth, config hoặc model refs nhắc đến chúng.                                                                                                                                   |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                               |
| `channels`                           | Không    | `string[]`                       | Các id kênh thuộc sở hữu của Plugin này. Được dùng cho khám phá và xác thực cấu hình.                                                                                                                                             |
| `providers`                          | Không    | `string[]`                       | Các id nhà cung cấp thuộc sở hữu của Plugin này.                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Không    | `string`                         | Đường dẫn module khám phá nhà cung cấp nhẹ, tương đối so với gốc Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp theo phạm vi manifest có thể được tải mà không kích hoạt toàn bộ thời gian chạy Plugin.                     |
| `modelSupport`                       | Không    | `object`                         | Siêu dữ liệu họ mô hình dạng rút gọn do manifest sở hữu, được dùng để tự động tải Plugin trước thời gian chạy.                                                                                                                    |
| `modelCatalog`                       | Không    | `object`                         | Siêu dữ liệu danh mục mô hình dạng khai báo cho các nhà cung cấp thuộc sở hữu của Plugin này. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, onboarding, bộ chọn mô hình, bí danh và ẩn trong tương lai mà không tải thời gian chạy Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ refs nhà cung cấp sang id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong lõi. |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi thời gian chạy nhà cung cấp được tải.                                                                                                              |
| `providerEndpoints`                  | Không    | `object[]`                       | Siêu dữ liệu host/baseUrl endpoint do manifest sở hữu cho các route nhà cung cấp mà lõi phải phân loại trước khi thời gian chạy nhà cung cấp được tải.                                                                            |
| `providerRequest`                    | Không    | `object`                         | Siêu dữ liệu họ nhà cung cấp và khả năng tương thích yêu cầu dạng nhẹ, được chính sách yêu cầu chung dùng trước khi thời gian chạy nhà cung cấp được tải.                                                                          |
| `cliBackends`                        | Không    | `string[]`                       | Các id backend suy luận CLI thuộc sở hữu của Plugin này. Được dùng để tự động kích hoạt khi khởi động từ refs cấu hình rõ ràng.                                                                                                   |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Refs nhà cung cấp hoặc backend CLI mà hook auth tổng hợp thuộc sở hữu Plugin của chúng nên được thăm dò trong quá trình khám phá mô hình lạnh trước khi thời gian chạy được tải.                                                  |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Các giá trị khóa API giữ chỗ thuộc sở hữu Plugin đi kèm, đại diện cho trạng thái thông tin xác thực cục bộ, OAuth hoặc môi trường xung quanh không phải bí mật.                                                                    |
| `commandAliases`                     | Không    | `object[]`                       | Các tên lệnh thuộc sở hữu của Plugin này, nên tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi thời gian chạy được tải.                                                                                                |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Siêu dữ liệu env tương thích đã ngừng khuyến nghị cho tra cứu auth/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn ngừng khuyến nghị.                    |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | Các id nhà cung cấp nên dùng lại id nhà cung cấp khác để tra cứu auth, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ auth của nhà cung cấp cơ sở.                                                                  |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Siêu dữ liệu env kênh dạng nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng cho thiết lập kênh theo env hoặc các bề mặt auth mà helper khởi động/cấu hình chung nên thấy.                                             |
| `providerAuthChoices`                | Không    | `object[]`                       | Siêu dữ liệu lựa chọn auth dạng nhẹ cho bộ chọn onboarding, phân giải nhà cung cấp ưu tiên và nối dây cờ CLI đơn giản.                                                                                                            |
| `activation`                         | Không    | `object`                         | Siêu dữ liệu lập kế hoạch kích hoạt dạng nhẹ cho việc tải khi khởi động, nhà cung cấp, lệnh, kênh, route và theo kích hoạt khả năng. Chỉ là siêu dữ liệu; thời gian chạy Plugin vẫn sở hữu hành vi thực tế.                       |
| `setup`                              | Không    | `object`                         | Các mô tả thiết lập/onboarding dạng nhẹ mà bề mặt khám phá và thiết lập có thể kiểm tra mà không tải thời gian chạy Plugin.                                                                                                       |
| `qaRunners`                          | Không    | `object[]`                       | Các mô tả runner QA dạng nhẹ được host `openclaw qa` dùng chung sử dụng trước khi thời gian chạy Plugin được tải.                                                                                                                 |
| `contracts`                          | Không    | `object`                         | Ảnh chụp tĩnh về khả năng đi kèm cho hook auth bên ngoài, giọng nói, phiên âm thời gian thực, giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, web-fetch, tìm kiếm web và quyền sở hữu công cụ.          |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Các mặc định hiểu phương tiện dạng nhẹ cho id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                           |
| `channelConfigs`                     | Không    | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do manifest sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi thời gian chạy được tải.                                                                                               |
| `skills`                             | Không    | `string[]`                       | Các thư mục Skills cần tải, tương đối so với gốc Plugin.                                                                                                                                                                          |
| `name`                               | Không    | `string`                         | Tên Plugin dễ đọc cho con người.                                                                                                                                                                                                 |
| `description`                        | Không    | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                    |
| `version`                            | Không    | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                            |
| `uiHints`                            | Không    | `Record<string, object>`         | Nhãn UI, placeholder và gợi ý độ nhạy cho các trường cấu hình.                                                                                                                                                                   |

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn onboarding hoặc auth.
OpenClaw đọc mục này trước khi thời gian chạy nhà cung cấp được tải.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn manifest này, các lựa chọn
thiết lập suy ra từ descriptor, và siêu dữ liệu danh mục cài đặt mà không tải
thời gian chạy nhà cung cấp.

| Trường                | Bắt buộc | Loại                                            | Ý nghĩa                                                                                                      |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Có       | `string`                                        | ID nhà cung cấp mà lựa chọn này thuộc về.                                                                    |
| `method`              | Có       | `string`                                        | ID phương thức xác thực để điều phối đến.                                                                    |
| `choiceId`            | Có       | `string`                                        | ID lựa chọn xác thực ổn định được dùng bởi các luồng thiết lập ban đầu và CLI.                               |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw sẽ dùng dự phòng `choiceId`.                              |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                                           |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.                      |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                           |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các ID lựa chọn cũ cần chuyển hướng người dùng đến lựa chọn thay thế này.                                    |
| `groupId`             | Không    | `string`                                        | ID nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                             |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng dành cho nhóm đó.                                                               |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                              |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                                 |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                           |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Không    | `string`                                        | Mô tả được dùng trong trợ giúp CLI.                                                                          |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt thiết lập ban đầu mà lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`. |

## Tham chiếu commandAliases

Dùng `commandAliases` khi một Plugin sở hữu tên lệnh thời gian chạy mà người dùng có thể
đưa nhầm vào `plugins.allow` hoặc cố chạy dưới dạng lệnh CLI gốc. OpenClaw
dùng siêu dữ liệu này để chẩn đoán mà không nhập mã thời gian chạy của Plugin.

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

| Trường       | Bắt buộc | Loại              | Ý nghĩa                                                                          |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về Plugin này.                                                    |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong trò chuyện thay vì lệnh CLI gốc.        |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để đề xuất cho các thao tác CLI, nếu có.                  |

## Tham chiếu activation

Dùng `activation` khi Plugin có thể khai báo với chi phí thấp những sự kiện mặt phẳng điều khiển
nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu của bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký
hành vi thời gian chạy, không thay thế `register(...)`, và không hứa rằng
mã Plugin đã được thực thi. Bộ lập kế hoạch kích hoạt dùng các trường này để
thu hẹp các Plugin ứng viên trước khi quay lại siêu dữ liệu quyền sở hữu tệp kê khai hiện có
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Dùng
`providers`, `channels`, `commandAliases`, bộ mô tả thiết lập, hoặc `contracts`
khi các trường đó thể hiện mối quan hệ. Dùng `activation` cho các gợi ý bổ sung
cho bộ lập kế hoạch không thể biểu diễn bằng các trường quyền sở hữu đó.
Dùng `cliBackends` cấp cao nhất cho bí danh thời gian chạy CLI như `claude-cli`,
`codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
ID bộ điều khiển tác nhân nhúng chưa có trường quyền sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi thời gian chạy, và không
thay thế `register(...)`, `setupEntry`, hoặc các điểm vào thời gian chạy/Plugin khác.
Các bộ tiêu thụ hiện tại dùng nó làm gợi ý thu hẹp trước khi tải Plugin rộng hơn, vì vậy
thiếu siêu dữ liệu kích hoạt thường chỉ tốn hiệu năng; nó không nên
thay đổi tính đúng đắn khi các cơ chế dự phòng quyền sở hữu tệp kê khai cũ vẫn còn tồn tại.

Mỗi Plugin nên đặt `activation.onStartup` một cách có chủ đích khi OpenClaw chuyển
khỏi các lần nhập khởi động ngầm định. Đặt thành `true` chỉ khi Plugin phải
chạy trong quá trình khởi động Gateway. Đặt thành `false` khi Plugin bất hoạt khi
khởi động và chỉ nên tải từ các kích hoạt hẹp hơn. Bỏ qua `onStartup` giữ
cơ chế dự phòng khởi động sidecar ngầm định cũ đã không còn được khuyến nghị cho các Plugin không có
siêu dữ liệu khả năng tĩnh; các phiên bản tương lai có thể ngừng tải khi khởi động những
Plugin đó trừ khi chúng khai báo `activation.onStartup: true`. Báo cáo trạng thái Plugin và
tính tương thích cảnh báo bằng `legacy-implicit-startup-sidecar` khi một Plugin
vẫn dựa vào cơ chế dự phòng đó.

Để kiểm thử di chuyển, đặt
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` để chỉ tắt
cơ chế dự phòng đã không còn được khuyến nghị đó. Chế độ chọn tham gia này không chặn các Plugin
`activation.onStartup: true` rõ ràng hoặc các Plugin được tải bởi kênh, cấu hình,
bộ điều khiển tác nhân, bộ nhớ, hoặc các kích hoạt hẹp hơn khác.

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

| Trường             | Bắt buộc | Loại                                                 | Ý nghĩa                                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt khởi động Gateway rõ ràng. Mỗi Plugin nên đặt trường này. `true` nhập Plugin trong khi khởi động; `false` chọn không dùng cơ chế dự phòng khởi động sidecar ngầm định đã không còn được khuyến nghị trừ khi một kích hoạt khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Các ID nhà cung cấp nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                           |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các ID thời gian chạy của bộ điều khiển tác nhân nhúng nên đưa Plugin này vào kế hoạch kích hoạt/tải. Dùng `cliBackends` cấp cao nhất cho bí danh backend CLI.                                                                              |
| `onCommands`       | Không    | `string[]`                                           | Các ID lệnh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                                  |
| `onChannels`       | Không    | `string[]`                                           | Các ID kênh nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                                  |
| `onRoutes`         | Không    | `string[]`                                           | Các loại tuyến nên đưa Plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                               |
| `onConfigPaths`    | Không    | `string[]`                                           | Các đường dẫn cấu hình tương đối từ gốc nên đưa Plugin này vào kế hoạch khởi động/tải khi đường dẫn hiện diện và không bị tắt rõ ràng.                                                                                                      |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Các gợi ý khả năng rộng được dùng bởi lập kế hoạch kích hoạt mặt phẳng điều khiển. Ưu tiên các trường hẹp hơn khi có thể.                                                                                                                   |

Các bộ tiêu thụ trực tiếp hiện tại:

- Lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho việc nhập khi khởi động
  rõ ràng và chọn không dùng cơ chế dự phòng khởi động sidecar ngầm định đã không còn được khuyến nghị
- Lập kế hoạch CLI được kích hoạt bởi lệnh quay lại cơ chế cũ
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- Lập kế hoạch khởi động thời gian chạy tác nhân dùng `activation.onAgentHarnesses` cho
  các bộ điều khiển nhúng và `cliBackends[]` cấp cao nhất cho bí danh thời gian chạy CLI
- Lập kế hoạch thiết lập/kênh được kích hoạt bởi kênh quay lại quyền sở hữu `channels[]`
  cũ khi thiếu siêu dữ liệu kích hoạt kênh rõ ràng
- Lập kế hoạch Plugin khởi động dùng `activation.onConfigPaths` cho các bề mặt cấu hình gốc
  không phải kênh như khối `browser` của Plugin trình duyệt được đóng gói
- Lập kế hoạch thiết lập/thời gian chạy được kích hoạt bởi nhà cung cấp quay lại quyền sở hữu
  `providers[]` và `cliBackends[]` cấp cao nhất cũ khi thiếu siêu dữ liệu kích hoạt nhà cung cấp
  rõ ràng

Chẩn đoán của bộ lập kế hoạch có thể phân biệt các gợi ý kích hoạt rõ ràng với cơ chế dự phòng
quyền sở hữu tệp kê khai. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, còn `manifest-command-alias` nghĩa là
bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho
chẩn đoán máy chủ và kiểm thử; tác giả Plugin nên tiếp tục khai báo siêu dữ liệu
mô tả quyền sở hữu tốt nhất.

## Tham chiếu qaRunners

Dùng `qaRunners` khi một Plugin đóng góp một hoặc nhiều trình chạy truyền tải bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; thời gian chạy Plugin
vẫn sở hữu việc đăng ký CLI thực tế thông qua một bề mặt `runtime-api.ts`
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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.          |
| `description` | Không    | `string` | Văn bản trợ giúp dự phòng được dùng khi host dùng chung cần một lệnh stub. |

## Tham chiếu setup

Dùng `setup` khi các bề mặt thiết lập và onboarding cần siêu dữ liệu giá rẻ do Plugin sở hữu trước khi runtime tải.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` cấp cao nhất vẫn hợp lệ và tiếp tục mô tả các backend suy luận CLI. `setup.cliBackends` là bề mặt bộ mô tả dành riêng cho setup cho các luồng control-plane/setup cần chỉ giữ ở dạng siêu dữ liệu.

Khi có mặt, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên, theo hướng bộ mô tả trước, để khám phá setup. Nếu bộ mô tả chỉ thu hẹp Plugin ứng viên và setup vẫn cần các hook runtime tại thời điểm setup phong phú hơn, hãy đặt `requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi dự phòng.

OpenClaw cũng đưa `setup.providers[].envVars` vào các tra cứu xác thực nhà cung cấp chung và biến môi trường. `providerAuthEnvVars` vẫn được hỗ trợ thông qua một bộ chuyển đổi tương thích trong giai đoạn ngừng dùng, nhưng các Plugin không đóng gói vẫn dùng nó sẽ nhận chẩn đoán manifest. Plugin mới nên đặt siêu dữ liệu môi trường setup/trạng thái trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods` khi không có mục setup, hoặc khi `setup.requiresRuntime: false` khai báo rằng runtime setup là không cần thiết. Các mục `providerAuthChoices` tường minh vẫn được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding và siêu dữ liệu trợ lý.

Chỉ đặt `requiresRuntime: false` khi các bộ mô tả đó đủ cho bề mặt setup. OpenClaw xem `false` tường minh là một hợp đồng chỉ dùng bộ mô tả và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` để tra cứu setup. Nếu một Plugin chỉ dùng bộ mô tả vẫn phân phối một trong các mục runtime setup đó, OpenClaw sẽ báo cáo một chẩn đoán bổ sung và tiếp tục bỏ qua mục đó. Việc bỏ qua `requiresRuntime` giữ hành vi dự phòng kế thừa để các Plugin hiện có đã thêm bộ mô tả mà không có cờ này không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị `setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải luôn là duy nhất trên các Plugin được khám phá. Quyền sở hữu mơ hồ sẽ đóng an toàn thay vì chọn một bên thắng theo thứ tự khám phá.

Khi runtime setup thực thi, chẩn đoán sổ đăng ký setup báo cáo lệch bộ mô tả nếu `setup-api` đăng ký một nhà cung cấp hoặc backend CLI mà bộ mô tả manifest không khai báo, hoặc nếu một bộ mô tả không có đăng ký runtime tương ứng. Các chẩn đoán này là bổ sung và không từ chối Plugin kế thừa.

### Tham chiếu setup.providers

| Trường        | Bắt buộc | Kiểu       | Ý nghĩa                                                                              |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Có       | `string`   | Id nhà cung cấp được lộ ra trong setup hoặc onboarding. Giữ các id đã chuẩn hóa là duy nhất toàn cục. |
| `authMethods` | Không    | `string[]` | Id phương thức setup/xác thực mà nhà cung cấp này hỗ trợ mà không cần tải runtime đầy đủ. |
| `envVars`     | Không    | `string[]` | Biến môi trường mà các bề mặt setup/trạng thái chung có thể kiểm tra trước khi runtime Plugin tải. |

### Các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                         |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Không    | `object[]` | Bộ mô tả setup nhà cung cấp được lộ ra trong setup và onboarding.                               |
| `cliBackends`      | Không    | `string[]` | Id backend tại thời điểm setup dùng cho tra cứu setup theo hướng bộ mô tả trước. Giữ các id đã chuẩn hóa là duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | Id di chuyển cấu hình do bề mặt setup của Plugin này sở hữu.                                    |
| `requiresRuntime`  | Không    | `boolean`  | Liệu setup vẫn cần thực thi `setup-api` sau tra cứu bộ mô tả hay không.                         |

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

| Trường        | Kiểu       | Ý nghĩa                                  |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Nhãn trường hiển thị cho người dùng.     |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                   |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                         |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.             |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm. |
| `placeholder` | `string`   | Văn bản placeholder cho đầu vào biểu mẫu. |

## Tham chiếu contracts

Chỉ dùng `contracts` cho siêu dữ liệu quyền sở hữu năng lực tĩnh mà OpenClaw có thể đọc mà không cần nhập runtime Plugin.

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

| Trường                           | Kiểu       | Ý nghĩa                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id factory extension máy chủ ứng dụng Codex, hiện là `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Id runtime mà một Plugin đóng gói có thể đăng ký middleware kết quả công cụ cho. |
| `externalAuthProviders`          | `string[]` | Id nhà cung cấp có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu. |
| `speechProviders`                | `string[]` | Id nhà cung cấp giọng nói do Plugin này sở hữu.                       |
| `realtimeTranscriptionProviders` | `string[]` | Id nhà cung cấp phiên âm thời gian thực do Plugin này sở hữu.         |
| `realtimeVoiceProviders`         | `string[]` | Id nhà cung cấp giọng nói thời gian thực do Plugin này sở hữu.        |
| `memoryEmbeddingProviders`       | `string[]` | Id nhà cung cấp embedding bộ nhớ do Plugin này sở hữu.                |
| `mediaUnderstandingProviders`    | `string[]` | Id nhà cung cấp hiểu phương tiện do Plugin này sở hữu.                |
| `imageGenerationProviders`       | `string[]` | Id nhà cung cấp tạo hình ảnh do Plugin này sở hữu.                    |
| `videoGenerationProviders`       | `string[]` | Id nhà cung cấp tạo video do Plugin này sở hữu.                       |
| `webFetchProviders`              | `string[]` | Id nhà cung cấp tìm nạp web do Plugin này sở hữu.                     |
| `webSearchProviders`             | `string[]` | Id nhà cung cấp tìm kiếm web do Plugin này sở hữu.                    |
| `migrationProviders`             | `string[]` | Id nhà cung cấp nhập do Plugin này sở hữu cho `openclaw migrate`.     |
| `tools`                          | `string[]` | Tên công cụ agent do Plugin này sở hữu cho kiểm tra hợp đồng đóng gói. |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory extension chỉ dành cho máy chủ ứng dụng Codex được đóng gói. Các biến đổi kết quả công cụ được đóng gói nên khai báo `contracts.agentToolResultMiddleware` và đăng ký với `api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể đăng ký middleware kết quả công cụ vì đường nối này có thể ghi lại đầu ra công cụ có độ tin cậy cao trước khi mô hình nhìn thấy nó.

Các Plugin nhà cung cấp triển khai `resolveExternalAuthProfiles` nên khai báo `contracts.externalAuthProviders`. Plugin không có khai báo vẫn chạy qua một dự phòng tương thích đã ngừng dùng, nhưng dự phòng đó chậm hơn và sẽ bị loại bỏ sau giai đoạn di chuyển.

Các nhà cung cấp embedding bộ nhớ được đóng gói nên khai báo `contracts.memoryEmbeddingProviders` cho mọi id adapter mà chúng lộ ra, bao gồm các adapter tích hợp sẵn như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest này để chỉ tải Plugin sở hữu trước khi runtime Gateway đầy đủ đã đăng ký nhà cung cấp.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu phương tiện có mô hình mặc định, mức ưu tiên dự phòng tự động xác thực, hoặc hỗ trợ tài liệu gốc mà các helper lõi chung cần trước khi runtime tải. Các khóa cũng phải được khai báo trong `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Năng lực phương tiện do nhà cung cấp này lộ ra.                              |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ năng lực tới mô hình, dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho dự phòng nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                               |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi một Plugin kênh cần siêu dữ liệu cấu hình giá rẻ trước khi runtime tải. Khám phá setup/trạng thái kênh chỉ đọc có thể dùng trực tiếp siêu dữ liệu này cho các kênh bên ngoài đã cấu hình khi không có mục setup, hoặc khi `setup.requiresRuntime: false` khai báo runtime setup là không cần thiết.

`channelConfigs` là siêu dữ liệu manifest Plugin, không phải một phần cấu hình người dùng cấp cao nhất mới. Người dùng vẫn cấu hình các phiên bản kênh trong `channels.<channel-id>`. OpenClaw đọc siêu dữ liệu manifest để quyết định Plugin nào sở hữu kênh đã cấu hình đó trước khi mã runtime Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không được đóng gói kèm khai báo `channels[]` cũng nên khai báo các mục `channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng schema cấu hình cold-path, thiết lập và các bề mặt Control UI không thể biết hình dạng tùy chọn do kênh sở hữu cho đến khi runtime của Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và `nativeSkillsAutoEnabled` có thể khai báo các mặc định `auto` tĩnh cho các kiểm tra cấu hình lệnh chạy trước khi runtime của kênh tải. Các kênh được đóng gói kèm cũng có thể công bố cùng các mặc định đó thông qua `package.json#openclaw.channel.commands` cùng với siêu dữ liệu catalog kênh khác do package sở hữu của chúng.

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

| Trường        | Kiểu                     | Ý nghĩa                                                                                          |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho mỗi mục cấu hình kênh được khai báo.               |
| `uiHints`     | `Record<string, object>` | Nhãn UI/placeholder/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                           |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi siêu dữ liệu runtime chưa sẵn sàng.  |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và catalog.                                              |
| `commands`    | `object`                 | Mặc định tự động tĩnh cho lệnh native và Skills native trong các kiểm tra cấu hình trước runtime. |
| `preferOver`  | `string[]`               | Các id Plugin cũ hoặc có độ ưu tiên thấp hơn mà kênh này nên xếp trên trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một id kênh mà một Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là id Plugin đã được đổi tên, một Plugin độc lập thay thế một Plugin được đóng gói kèm, hoặc một fork được bảo trì giữ nguyên cùng id kênh để tương thích cấu hình.

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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả id kênh và id Plugin được ưu tiên. Nếu Plugin có độ ưu tiên thấp hơn chỉ được chọn vì nó được đóng gói kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong cấu hình runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì âm thầm thay đổi tập Plugin được yêu cầu.

Giữ `preferOver` giới hạn trong các id Plugin thực sự có thể cung cấp cùng kênh. Đây không phải là trường ưu tiên chung và không đổi tên khóa cấu hình của người dùng.

## Tham chiếu modelSupport

Dùng `modelSupport` khi OpenClaw nên suy ra Plugin nhà cung cấp của bạn từ các id mô hình rút gọn như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi runtime của Plugin tải.

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
- `modelPatterns` ưu tiên hơn `modelPrefixes`
- nếu một Plugin không được đóng gói kèm và một Plugin được đóng gói kèm đều khớp, Plugin không được đóng gói kèm thắng
- phần mơ hồ còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định một nhà cung cấp

Trường:

| Trường          | Kiểu       | Ý nghĩa                                                                                     |
| --------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với id mô hình rút gọn.                              |
| `modelPatterns` | `string[]` | Nguồn regex được khớp với id mô hình rút gọn sau khi loại bỏ hậu tố hồ sơ.                  |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw nên biết siêu dữ liệu mô hình của nhà cung cấp trước khi tải runtime của Plugin. Đây là nguồn do manifest sở hữu cho các hàng catalog cố định, bí danh nhà cung cấp, quy tắc ẩn và chế độ khám phá. Việc làm mới runtime vẫn thuộc về mã runtime của nhà cung cấp, nhưng manifest cho core biết khi nào cần runtime.

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

| Trường         | Kiểu                                                     | Ý nghĩa                                                                                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Các hàng catalog cho id nhà cung cấp do Plugin này sở hữu. Khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải tới một nhà cung cấp được sở hữu cho việc lập kế hoạch catalog hoặc ẩn.   |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này ẩn vì lý do riêng của nhà cung cấp.                             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Cho biết catalog nhà cung cấp có thể được đọc từ siêu dữ liệu manifest, làm mới vào cache, hay cần runtime.  |

`aliases` tham gia vào tra cứu quyền sở hữu nhà cung cấp cho việc lập kế hoạch model-catalog. Đích bí danh phải là các nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và áp dụng ghi đè API/base URL của bí danh mà không cần tải runtime của nhà cung cấp.
Bí danh không mở rộng danh sách catalog chưa lọc; các danh sách rộng chỉ phát ra các hàng nhà cung cấp chuẩn sở hữu.

`suppressions` thay thế hook runtime nhà cung cấp `suppressBuiltInModel` cũ. Các mục ẩn chỉ được tôn trọng khi nhà cung cấp do Plugin sở hữu hoặc được khai báo là khóa `modelCatalog.aliases` trỏ tới một nhà cung cấp được sở hữu. Hook ẩn runtime không còn được gọi trong quá trình phân giải mô hình.

Trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                                  |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Base URL mặc định tùy chọn cho các mô hình trong catalog nhà cung cấp này. |
| `api`     | `ModelApi`               | Adapter API mặc định tùy chọn cho các mô hình trong catalog nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho catalog nhà cung cấp này.               |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` sẽ bị bỏ qua.          |

Trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                          |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp, không có tiền tố `provider/`.               |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                           |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                           |
| `baseUrl`       | `string`                                                       | Ghi đè base URL tùy chọn theo từng mô hình.                                      |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn theo từng mô hình.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức đầu vào mà mô hình chấp nhận.                                    |
| `reasoning`     | `boolean`                                                      | Mô hình có cung cấp hành vi reasoning hay không.                                 |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                            |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu lực tùy chọn khi khác với `contextWindow`.        |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết.                                                 |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.         |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với tương thích cấu hình mô hình OpenClaw.          |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng không được xuất hiện chút nào.               |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị cùng trạng thái không khả dụng.                          |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ theo nhà cung cấp cũ hơn mà mô hình này thay thế.          |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ theo nhà cung cấp thay thế cho các hàng đã ngừng dùng.         |
| `tags`          | `string[]`                                                     | Thẻ ổn định được các bộ chọn và bộ lọc sử dụng.                                  |

Trường ẩn:

| Trường                     | Kiểu      | Ý nghĩa                                                                                                  |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID nhà cung cấp cho hàng upstream cần ẩn. Phải thuộc sở hữu của plugin này hoặc được khai báo là bí danh thuộc sở hữu. |
| `model`                    | `string`   | ID mô hình cục bộ theo nhà cung cấp cần ẩn.                                                              |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng đã bị ẩn được yêu cầu trực tiếp.                                    |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host URL cơ sở hiệu dụng của nhà cung cấp cần có trước khi áp dụng việc ẩn.       |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` chính xác trong cấu hình nhà cung cấp cần có trước khi áp dụng việc ẩn. |

Không đặt dữ liệu chỉ dùng ở runtime trong `modelCatalog`. Chỉ dùng `static` khi các hàng manifest
đủ hoàn chỉnh để các bề mặt danh sách đã lọc theo nhà cung cấp và bộ chọn có thể bỏ qua
việc khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là các hạt giống hoặc phần bổ sung
có thể liệt kê hữu ích nhưng thao tác làm mới/cache có thể thêm nhiều hàng hơn sau đó;
các hàng refreshable tự thân không có thẩm quyền. Dùng `runtime` khi OpenClaw
phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp ID mô hình thuộc sở hữu nhà cung cấp với chi phí thấp, việc này phải
xảy ra trước khi runtime của nhà cung cấp được tải. Điều này giữ các bí danh như tên mô hình ngắn,
ID kế thừa cục bộ theo nhà cung cấp, và quy tắc tiền tố proxy trong manifest của plugin sở hữu
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

Các trường nhà cung cấp:

| Trường                               | Kiểu                    | Ý nghĩa                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Bí danh ID mô hình khớp chính xác không phân biệt hoa thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần xóa trước khi tra cứu bí danh, hữu ích cho trùng lặp provider/model kế thừa. |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi ID mô hình đã chuẩn hóa chưa chứa `/`.                               |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc tiền tố ID trần có điều kiện sau khi tra cứu bí danh, được khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung
phải biết trước khi runtime của nhà cung cấp được tải. Core vẫn sở hữu ý nghĩa của từng
`endpointClass`; manifest plugin sở hữu metadata về host và URL cơ sở.

Các trường endpoint:

| Trường                         | Kiểu      | Ý nghĩa                                                                                       |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint core đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên host chính xác ánh xạ tới lớp endpoint.                                                    |
| `hostSuffixes`                 | `string[]` | Hậu tố host ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố miền.                 |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                              |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các host toàn cục chính xác.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần tách khỏi các host khớp để phơi bày tiền tố vùng Google Vertex.                    |

## Tham chiếu providerRequest

Dùng `providerRequest` cho metadata tương thích yêu cầu với chi phí thấp mà chính sách
yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ việc viết lại payload
theo hành vi cụ thể trong các hook runtime của nhà cung cấp hoặc các helper dùng chung cho họ nhà cung cấp.

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

| Trường                | Kiểu         | Ý nghĩa                                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp dùng cho các quyết định tương thích yêu cầu chung và chẩn đoán.     |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho các helper yêu cầu dùng chung.             |
| `openAICompletions`   | `object`     | Cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.             |

## Tham chiếu modelPricing

Dùng `modelPricing` khi nhà cung cấp cần hành vi định giá ở control plane trước khi
runtime được tải. Cache định giá của Gateway đọc metadata này mà không import
mã runtime của nhà cung cấp.

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

| Trường       | Kiểu              | Ý nghĩa                                                                                           |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho nhà cung cấp cục bộ/tự host không bao giờ được fetch giá OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` vô hiệu hóa tra cứu OpenRouter cho nhà cung cấp này.       |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` vô hiệu hóa tra cứu LiteLLM cho nhà cung cấp này.             |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                              |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID nhà cung cấp trong catalog bên ngoài khi khác với ID nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem các ID mô hình chứa dấu gạch chéo là tham chiếu nhà cung cấp/mô hình lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể ID mô hình catalog bên ngoài bổ sung. `version-dots` thử ID phiên bản có dấu chấm như `claude-opus-4.6`. |

### Chỉ mục Nhà cung cấp OpenClaw

Chỉ mục Nhà cung cấp OpenClaw là metadata xem trước do OpenClaw sở hữu dành cho các nhà cung cấp
mà plugin của họ có thể chưa được cài đặt. Nó không phải là một phần của manifest plugin.
Manifest plugin vẫn là thẩm quyền của plugin đã cài đặt. Chỉ mục Nhà cung cấp là
hợp đồng dự phòng nội bộ mà các bề mặt nhà cung cấp có thể cài đặt trong tương lai và bộ chọn mô hình
trước khi cài đặt sẽ dùng khi plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. `modelCatalog` trong manifest plugin đã cài đặt.
3. Cache catalog mô hình từ thao tác làm mới tường minh.
4. Các hàng xem trước trong Chỉ mục Nhà cung cấp OpenClaw.

Chỉ mục Nhà cung cấp không được chứa bí mật, trạng thái bật, hook runtime, hoặc
dữ liệu mô hình live theo tài khoản cụ thể. Các catalog xem trước của nó dùng cùng
hình dạng hàng nhà cung cấp `modelCatalog` như manifest plugin, nhưng nên giới hạn
ở metadata hiển thị ổn định trừ khi các trường adapter runtime như `api`,
`baseUrl`, giá, hoặc cờ tương thích được chủ ý giữ đồng bộ với
manifest plugin đã cài đặt. Các nhà cung cấp có khám phá live `/models` nên
ghi các hàng đã làm mới qua đường dẫn cache catalog mô hình tường minh thay vì
để thao tác liệt kê bình thường hoặc onboarding gọi API nhà cung cấp.

Các mục trong Chỉ mục Nhà cung cấp cũng có thể mang metadata plugin có thể cài đặt cho các nhà cung cấp
có plugin đã được chuyển ra khỏi core hoặc vì lý do khác chưa được cài đặt. Metadata này
phản chiếu mẫu catalog kênh: tên gói, spec cài đặt npm,
integrity kỳ vọng, và nhãn lựa chọn xác thực chi phí thấp là đủ để hiển thị một
tùy chọn thiết lập có thể cài đặt. Sau khi plugin được cài đặt, manifest của nó thắng và
mục Chỉ mục Nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa capability cấp cao kế thừa đã bị ngừng khuyến nghị. Dùng `openclaw doctor --fix` để
chuyển `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; việc tải
manifest thông thường không còn xem các trường cấp cao đó là quyền sở hữu
capability.

## Manifest so với package.json

Hai tệp phục vụ các mục đích khác nhau:

| Tệp                    | Dùng cho                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, metadata lựa chọn xác thực, và gợi ý UI phải tồn tại trước khi mã plugin chạy                       |
| `package.json`         | Metadata npm, cài đặt phụ thuộc, và khối `openclaw` dùng cho entrypoint, chặn cài đặt, thiết lập, hoặc metadata catalog          |

Nếu bạn không chắc một phần metadata thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số metadata plugin trước runtime được cố ý đặt trong `package.json` dưới khối
`openclaw` thay vì `openclaw.plugin.json`.

Các ví dụ quan trọng:

| Trường                                                             | Ý nghĩa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Khai báo các điểm vào Plugin native. Phải nằm trong thư mục gói Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Khai báo các điểm vào runtime JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                 |
| `openclaw.setupEntry`                                             | Điểm vào nhẹ chỉ dành cho thiết lập, dùng trong onboarding, khởi động kênh bị trì hoãn, và phát hiện trạng thái kênh chỉ đọc/SecretRef. Phải nằm trong thư mục gói Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Khai báo điểm vào thiết lập JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói Plugin.                                                                |
| `openclaw.channel`                                                | Siêu dữ liệu danh mục kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                                 |
| `openclaw.channel.commands`                                       | Siêu dữ liệu tĩnh về lệnh native và mặc định tự động của kỹ năng native, được dùng bởi cấu hình, kiểm tra, và các bề mặt danh sách lệnh trước khi runtime kênh tải.                                          |
| `openclaw.channel.configuredState`                                | Siêu dữ liệu trình kiểm tra trạng thái đã cấu hình nhẹ, có thể trả lời "thiết lập chỉ bằng env đã tồn tại chưa?" mà không tải toàn bộ runtime kênh.                                         |
| `openclaw.channel.persistedAuthState`                             | Siêu dữ liệu trình kiểm tra xác thực đã lưu nhẹ, có thể trả lời "đã có thứ gì đăng nhập chưa?" mà không tải toàn bộ runtime kênh.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Gợi ý cài đặt/cập nhật cho các Plugin được đóng gói kèm và được phát hành bên ngoài.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt khả dụng.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Chuỗi toàn vẹn npm dist dự kiến như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải theo chuỗi này.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Cho phép đường dẫn phục hồi cài đặt lại Plugin đóng gói kèm trong phạm vi hẹp khi cấu hình không hợp lệ.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước Plugin kênh đầy đủ trong quá trình khởi động.                                                                                                 |

Siêu dữ liệu manifest quyết định lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách tải hoặc bật Plugin đó khi người dùng chọn một trong các
lựa chọn đó. Không chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
registry manifest. Giá trị không hợp lệ bị từ chối; giá trị mới hơn nhưng hợp lệ sẽ bỏ qua
Plugin trên host cũ hơn.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục danh mục bên ngoài chính thức
nên ghép thông số chính xác với `expectedIntegrity` để các luồng cập nhật thất bại
đóng nếu artifact npm đã tải không còn khớp với bản phát hành đã ghim.
Interactive onboarding vẫn cung cấp thông số npm registry đáng tin cậy, bao gồm tên
gói trần và dist-tag, để tương thích. Chẩn đoán danh mục có thể
phân biệt nguồn chính xác, trôi nổi, được ghim toàn vẹn, thiếu toàn vẹn, tên gói
không khớp, và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ để ghim.
Khi `expectedIntegrity` có mặt,
các luồng cài đặt/cập nhật thực thi nó; khi bị bỏ qua, phân giải registry được
ghi lại mà không có ghim toàn vẹn.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
runtime. Điểm vào thiết lập nên phơi bày siêu dữ liệu kênh cùng cấu hình,
trạng thái, và bộ điều hợp bí mật an toàn cho thiết lập; giữ client mạng, listener Gateway, và
runtime transport trong điểm vào tiện ích mở rộng chính.

Các trường điểm vào runtime không ghi đè kiểm tra ranh giới gói cho các trường
điểm vào nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể khiến một đường dẫn
`openclaw.extensions` thoát khỏi phạm vi trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` được cố ý giới hạn hẹp. Nó không
khiến mọi cấu hình hỏng tùy ý có thể cài đặt. Hiện tại nó chỉ cho phép các luồng cài đặt
phục hồi từ những lỗi nâng cấp Plugin đóng gói kèm đã cũ cụ thể, chẳng hạn như
thiếu đường dẫn Plugin đóng gói kèm hoặc mục `channels.<id>` đã cũ cho chính
Plugin đóng gói kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và hướng
người vận hành tới `openclaw doctor --fix`.

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

Dùng nó khi các luồng thiết lập, doctor, trạng thái, hoặc hiện diện chỉ đọc cần một phép thăm dò
xác thực có/không rẻ trước khi Plugin kênh đầy đủ tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật Plugin,
sửa phụ thuộc runtime, hoặc quyết định liệu runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` theo cùng hình dạng cho kiểm tra trạng thái đã cấu hình
chỉ bằng env chi phí thấp:

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
khác không phải runtime. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc
runtime kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của Plugin.

## Thứ tự ưu tiên phát hiện (id Plugin trùng lặp)

OpenClaw phát hiện Plugin từ nhiều gốc (đóng gói kèm, cài đặt toàn cục, workspace, đường dẫn được cấu hình rõ ràng chọn). Nếu hai phát hiện chia sẻ cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ; các bản trùng lặp có mức ưu tiên thấp hơn bị loại bỏ thay vì tải bên cạnh nó.

Mức ưu tiên, từ cao nhất đến thấp nhất:

1. **Được cấu hình chọn** — đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đóng gói kèm** — Plugin được phân phối cùng OpenClaw
3. **Cài đặt toàn cục** — Plugin được cài vào gốc Plugin OpenClaw toàn cục
4. **Workspace** — Plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc đã cũ của Plugin đóng gói kèm nằm trong workspace sẽ không che khuất bản build đóng gói kèm.
- Để thực sự ghi đè một Plugin đóng gói kèm bằng bản cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo mức ưu tiên thay vì dựa vào phát hiện workspace.
- Các bản trùng lặp bị loại được ghi log để Doctor và chẩn đoán khởi động có thể chỉ tới bản sao đã bị loại bỏ.

## Yêu cầu JSON Schema

- **Mọi Plugin phải phân phối một JSON Schema**, ngay cả khi nó không nhận cấu hình.
- Schema rỗng được chấp nhận (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại runtime.

## Hành vi xác thực

- Khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu đến id Plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  xác thực thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + log.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết schema `plugins.*` đầy đủ.

## Ghi chú

- Manifest là **bắt buộc đối với Plugin OpenClaw native**, bao gồm cả tải từ hệ thống tệp cục bộ. Runtime vẫn tải module Plugin riêng; manifest chỉ dành cho phát hiện + xác thực.
- Manifest native được phân tích bằng JSON5, nên comment, dấu phẩy cuối, và khóa không đặt trong dấu nháy được chấp nhận miễn là giá trị cuối cùng vẫn là object.
- Chỉ các trường manifest được tài liệu hóa mới được trình tải manifest đọc. Tránh khóa cấp cao nhất tùy chỉnh.
- `channels`, `providers`, `cliBackends`, và `skills` đều có thể bị bỏ qua khi Plugin không cần chúng.
- `providerDiscoveryEntry` phải nhẹ và không nên import mã runtime rộng; dùng nó cho siêu dữ liệu danh mục nhà cung cấp tĩnh hoặc descriptor phát hiện hẹp, không phải thực thi tại thời điểm yêu cầu.
- Loại Plugin độc quyền được chọn qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. Runtime-entry `OpenClawPluginDefinition.kind` đã bị ngừng khuyến nghị và chỉ còn là fallback tương thích cho Plugin cũ hơn.
- Siêu dữ liệu biến env (`setup.providers[].envVars`, `providerAuthEnvVars` đã bị ngừng khuyến nghị, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm tra, xác thực gửi cron, và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi coi một biến env là đã cấu hình.
- Đối với siêu dữ liệu wizard runtime cần mã nhà cung cấp, xem [Hook runtime nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào module native, hãy tài liệu hóa các bước build và mọi yêu cầu allowlist của trình quản lý gói (ví dụ, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình năng lực.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu SDK Plugin và import đường dẫn con.
  </Card>
</CardGroup>
