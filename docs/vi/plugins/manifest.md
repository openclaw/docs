---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành một schema cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về tệp kê khai Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Tệp kê khai Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4209b10042eaa88dca33073f3f5b8a024ee760bbe096fc2f476e12c2a874628e
    source_path: plugins/manifest.md
    workflow: 16
---

Trang này chỉ dành cho **tệp kê khai Plugin OpenClaw gốc**.

Để xem các bố cục gói tương thích, hãy xem [Gói Plugin](/vi/plugins/bundles).

Các định dạng gói tương thích dùng những tệp kê khai khác nhau:

- Gói Codex: `.codex-plugin/plugin.json`
- Gói Claude: `.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định
  không có tệp kê khai
- Gói Cursor: `.cursor-plugin/plugin.json`

OpenClaw cũng tự động phát hiện các bố cục gói đó, nhưng chúng không được xác thực
theo lược đồ `openclaw.plugin.json` được mô tả ở đây.

Đối với các gói tương thích, OpenClaw hiện đọc siêu dữ liệu gói cùng các
gốc skill đã khai báo, gốc lệnh Claude, mặc định `settings.json` của gói Claude,
mặc định LSP của gói Claude, và các gói hook được hỗ trợ khi bố cục khớp với
kỳ vọng runtime của OpenClaw.

Mọi Plugin OpenClaw gốc **phải** cung cấp một tệp `openclaw.plugin.json` trong
**gốc Plugin**. OpenClaw dùng tệp kê khai này để xác thực cấu hình
**mà không thực thi mã Plugin**. Tệp kê khai bị thiếu hoặc không hợp lệ được xem là
lỗi Plugin và sẽ chặn việc xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống Plugin: [Plugin](/vi/tools/plugin).
Để xem mô hình năng lực gốc và hướng dẫn tương thích bên ngoài hiện tại:
[Mô hình năng lực](/vi/plugins/architecture#public-capability-model).

## Tệp này làm gì

`openclaw.plugin.json` là siêu dữ liệu OpenClaw đọc **trước khi tải mã
Plugin của bạn**. Mọi nội dung bên dưới phải đủ nhẹ để kiểm tra mà không cần khởi động
runtime Plugin.

**Dùng tệp này cho:**

- danh tính Plugin, xác thực cấu hình, và gợi ý giao diện người dùng cấu hình
- siêu dữ liệu xác thực, onboarding, và thiết lập (bí danh, tự động bật, biến môi trường provider, lựa chọn xác thực)
- gợi ý kích hoạt cho các bề mặt control-plane
- quyền sở hữu rút gọn của họ mô hình
- ảnh chụp tĩnh về quyền sở hữu năng lực (`contracts`)
- siêu dữ liệu trình chạy QA mà host `openclaw qa` dùng chung có thể kiểm tra
- siêu dữ liệu cấu hình theo từng kênh được hợp nhất vào catalog và các bề mặt xác thực

**Không dùng tệp này cho:** đăng ký hành vi runtime, khai báo entrypoint mã,
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

## Tham khảo trường cấp cao nhất

| Trường                               | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                          |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có       | `string`                         | Id Plugin chính tắc. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                           |
| `configSchema`                       | Có       | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                               |
| `enabledByDefault`                   | Không    | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị không phải `true`, để giữ Plugin ở trạng thái tắt theo mặc định.                                                               |
| `legacyPluginIds`                    | Không    | `string[]`                       | Các id cũ được chuẩn hóa thành id Plugin chính tắc này.                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Không    | `string[]`                       | Các id nhà cung cấp sẽ tự động bật Plugin này khi xác thực, cấu hình, hoặc tham chiếu mô hình nhắc đến chúng.                                                                                                                    |
| `kind`                               | Không    | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                              |
| `channels`                           | Không    | `string[]`                       | Các id kênh do Plugin này sở hữu. Được dùng để khám phá và xác thực cấu hình.                                                                                                                                                    |
| `providers`                          | Không    | `string[]`                       | Các id nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | Không    | `string`                         | Đường dẫn mô-đun khám phá nhà cung cấp gọn nhẹ, tương đối với gốc Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp trong phạm vi bản kê khai có thể được tải mà không kích hoạt toàn bộ thời gian chạy của Plugin.          |
| `modelSupport`                       | Không    | `object`                         | Siêu dữ liệu họ mô hình dạng rút gọn do bản kê khai sở hữu, dùng để tự động tải Plugin trước thời gian chạy.                                                                                                                     |
| `modelCatalog`                       | Không    | `object`                         | Siêu dữ liệu danh mục mô hình khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, tiếp nhận, bộ chọn mô hình, bí danh, và chặn trong tương lai mà không tải thời gian chạy của Plugin. |
| `modelPricing`                       | Không    | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp tới id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong lõi. |
| `modelIdNormalization`               | Không    | `object`                         | Dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi thời gian chạy của nhà cung cấp tải.                                                                                                             |
| `providerEndpoints`                  | Không    | `object[]`                       | Siêu dữ liệu máy chủ endpoint/baseUrl do bản kê khai sở hữu cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi thời gian chạy của nhà cung cấp tải.                                                                     |
| `providerRequest`                    | Không    | `object`                         | Siêu dữ liệu gọn nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung dùng trước khi thời gian chạy của nhà cung cấp tải.                                                                      |
| `cliBackends`                        | Không    | `string[]`                       | Các id backend suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình tường minh.                                                                                            |
| `syntheticAuthRefs`                  | Không    | `string[]`                       | Các tham chiếu nhà cung cấp hoặc backend CLI có hook xác thực tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình lạnh trước khi thời gian chạy tải.                                                    |
| `nonSecretAuthMarkers`               | Không    | `string[]`                       | Các giá trị khóa API giữ chỗ do Plugin đi kèm sở hữu, biểu thị trạng thái thông tin xác thực cục bộ, OAuth, hoặc môi trường xung quanh không phải bí mật.                                                                       |
| `commandAliases`                     | Không    | `object[]`                       | Các tên lệnh do Plugin này sở hữu, cần tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi thời gian chạy tải.                                                                                                          |
| `providerAuthEnvVars`                | Không    | `Record<string, string[]>`       | Siêu dữ liệu env tương thích đã lỗi thời cho tra cứu xác thực/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong giai đoạn loại bỏ dần.                              |
| `providerAuthAliases`                | Không    | `Record<string, string>`         | Các id nhà cung cấp cần dùng lại một id nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình dùng chung khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                    |
| `channelEnvVars`                     | Không    | `Record<string, string[]>`       | Siêu dữ liệu env kênh gọn nhẹ mà OpenClaw có thể kiểm tra mà không cần tải mã Plugin. Dùng trường này cho thiết lập kênh dựa trên env hoặc các bề mặt xác thực mà trình trợ giúp khởi động/cấu hình chung cần thấy.            |
| `providerAuthChoices`                | Không    | `object[]`                       | Siêu dữ liệu lựa chọn xác thực gọn nhẹ cho bộ chọn tiếp nhận, phân giải nhà cung cấp ưu tiên, và nối dây cờ CLI đơn giản.                                                                                                        |
| `activation`                         | Không    | `object`                         | Siêu dữ liệu trình lập kế hoạch kích hoạt gọn nhẹ cho việc tải được kích hoạt bởi khởi động, nhà cung cấp, lệnh, kênh, tuyến, và khả năng. Chỉ là siêu dữ liệu; thời gian chạy của Plugin vẫn sở hữu hành vi thực tế.             |
| `setup`                              | Không    | `object`                         | Các mô tả thiết lập/tiếp nhận gọn nhẹ mà bề mặt khám phá và thiết lập có thể kiểm tra mà không cần tải thời gian chạy của Plugin.                                                                                                |
| `qaRunners`                          | Không    | `object[]`                       | Các mô tả trình chạy QA gọn nhẹ được máy chủ `openclaw qa` dùng chung trước khi thời gian chạy của Plugin tải.                                                                                                                   |
| `contracts`                          | Không    | `object`                         | Ảnh chụp tĩnh khả năng đi kèm cho hook xác thực bên ngoài, lời nói, phiên âm thời gian thực, giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, tìm nạp web, tìm kiếm web, và quyền sở hữu công cụ.      |
| `mediaUnderstandingProviderMetadata` | Không    | `Record<string, object>`         | Các mặc định hiểu phương tiện gọn nhẹ cho id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                           |
| `channelConfigs`                     | Không    | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do bản kê khai sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi thời gian chạy tải.                                                                                                |
| `skills`                             | Không    | `string[]`                       | Các thư mục Skills cần tải, tương đối với gốc Plugin.                                                                                                                                                                            |
| `name`                               | Không    | `string`                         | Tên Plugin dễ đọc cho con người.                                                                                                                                                                                                 |
| `description`                        | Không    | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                   |
| `version`                            | Không    | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                            |
| `uiHints`                            | Không    | `Record<string, object>`         | Nhãn UI, phần giữ chỗ, và gợi ý độ nhạy cho các trường cấu hình.                                                                                                                                                                 |

## Tham chiếu `providerAuthChoices`

Mỗi mục `providerAuthChoices` mô tả một lựa chọn tiếp nhận hoặc xác thực.
OpenClaw đọc mục này trước khi thời gian chạy của nhà cung cấp tải.
Danh sách thiết lập nhà cung cấp sử dụng các lựa chọn bản kê khai này, các lựa chọn
thiết lập suy ra từ mô tả, và siêu dữ liệu danh mục cài đặt mà không tải thời gian chạy
của nhà cung cấp.

| Trường                 | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                                      |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                                    |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để chuyển tiếp xử lý.                                                                |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng onboarding và CLI.                                      |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw dùng dự phòng `choiceId`.                                |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                                           |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp trước trong các bộ chọn tương tác do trợ lý điều khiển.                       |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                           |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ nên chuyển hướng người dùng đến lựa chọn thay thế này.                                   |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                             |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng của nhóm đó.                                                                    |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                              |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                                 |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                           |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Không    | `string`                                        | Mô tả được dùng trong trợ giúp CLI.                                                                          |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt onboarding mà lựa chọn này nên xuất hiện trong đó. Nếu bỏ qua, mặc định là `["text-inference"]`. |

## Tham chiếu commandAliases

Dùng `commandAliases` khi một plugin sở hữu tên lệnh runtime mà người dùng có thể
nhầm lẫn đặt vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw
dùng siêu dữ liệu này cho chẩn đoán mà không nhập mã runtime của plugin.

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

| Trường        | Bắt buộc | Kiểu              | Ý nghĩa                                                                      |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về plugin này.                                                |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong trò chuyện thay vì lệnh CLI gốc.    |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có.                |

## Tham chiếu activation

Dùng `activation` khi plugin có thể khai báo với chi phí thấp những sự kiện control-plane
nào nên đưa nó vào kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu cho bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký
hành vi runtime, không thay thế `register(...)`, và không cam kết rằng
mã plugin đã được thực thi. Bộ lập kế hoạch kích hoạt dùng các trường này để
thu hẹp các plugin ứng viên trước khi quay lại siêu dữ liệu quyền sở hữu manifest hiện có
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Dùng
`providers`, `channels`, `commandAliases`, bộ mô tả thiết lập, hoặc `contracts`
khi các trường đó biểu đạt mối quan hệ. Dùng `activation` cho các gợi ý bộ lập kế hoạch
bổ sung không thể biểu diễn bằng các trường quyền sở hữu đó.
Dùng `cliBackends` cấp cao nhất cho các bí danh runtime CLI như `claude-cli`,
`codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
id harness tác nhân nhúng chưa có trường quyền sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi runtime, và không
thay thế `register(...)`, `setupEntry`, hoặc các điểm vào runtime/plugin khác.
Các bên tiêu thụ hiện tại dùng nó như một gợi ý thu hẹp trước khi tải plugin rộng hơn, nên
thiếu siêu dữ liệu activation thường chỉ tốn hiệu năng; nó không nên
làm thay đổi tính đúng đắn khi các dự phòng quyền sở hữu manifest cũ vẫn còn tồn tại.

Mỗi plugin nên đặt `activation.onStartup` một cách có chủ đích khi OpenClaw chuyển
ra khỏi các lần nhập khởi động ngầm định. Đặt thành `true` chỉ khi plugin phải
chạy trong quá trình khởi động Gateway. Đặt thành `false` khi plugin không hoạt động lúc
khởi động và chỉ nên tải từ các trigger hẹp hơn. Bỏ qua `onStartup` giữ
dự phòng sidecar khởi động ngầm định cũ đã ngừng khuyến nghị cho các plugin không có
siêu dữ liệu khả năng tĩnh; các phiên bản tương lai có thể ngừng tải khi khởi động những
plugin đó trừ khi chúng khai báo `activation.onStartup: true`. Báo cáo trạng thái và
tương thích của plugin cảnh báo với `legacy-implicit-startup-sidecar` khi một plugin
vẫn phụ thuộc vào dự phòng đó.

Để kiểm thử di trú, đặt
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` để chỉ tắt
dự phòng đã ngừng khuyến nghị đó. Chế độ chọn tham gia này không chặn các plugin
`activation.onStartup: true` rõ ràng hoặc plugin được tải bởi kênh, cấu hình,
agent-harness, bộ nhớ, hoặc các trigger kích hoạt hẹp hơn khác.

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

| Trường              | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt khởi động Gateway rõ ràng. Mỗi plugin nên đặt trường này. `true` nhập plugin trong khi khởi động; `false` chọn không dùng dự phòng khởi động sidecar ngầm định đã ngừng khuyến nghị trừ khi một trigger khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Các id nhà cung cấp nên đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                          |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các id runtime harness tác nhân nhúng nên đưa plugin này vào kế hoạch kích hoạt/tải. Dùng `cliBackends` cấp cao nhất cho các bí danh backend CLI.                                                                                        |
| `onCommands`       | Không    | `string[]`                                           | Các id lệnh nên đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                                  |
| `onChannels`       | Không    | `string[]`                                           | Các id kênh nên đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                                  |
| `onRoutes`         | Không    | `string[]`                                           | Các loại route nên đưa plugin này vào kế hoạch kích hoạt/tải.                                                                                                                                                                               |
| `onConfigPaths`    | Không    | `string[]`                                           | Đường dẫn cấu hình tương đối từ gốc nên đưa plugin này vào kế hoạch khởi động/tải khi đường dẫn hiện diện và không bị tắt rõ ràng.                                                                                                         |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Gợi ý khả năng rộng được dùng bởi việc lập kế hoạch kích hoạt control-plane. Ưu tiên các trường hẹp hơn khi có thể.                                                                                                                        |

Các bên tiêu thụ trực tiếp hiện tại:

- Việc lập kế hoạch khởi động Gateway dùng `activation.onStartup` để nhập khi khởi động
  rõ ràng và chọn không dùng dự phòng khởi động sidecar ngầm định đã ngừng khuyến nghị
- Việc lập kế hoạch CLI do lệnh kích hoạt quay lại dự phòng cũ
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- Việc lập kế hoạch khởi động runtime tác nhân dùng `activation.onAgentHarnesses` cho
  các harness nhúng và `cliBackends[]` cấp cao nhất cho các bí danh runtime CLI
- Việc lập kế hoạch thiết lập/kênh do kênh kích hoạt quay lại dự phòng quyền sở hữu
  `channels[]` cũ khi thiếu siêu dữ liệu kích hoạt kênh rõ ràng
- Việc lập kế hoạch plugin khởi động dùng `activation.onConfigPaths` cho các bề mặt cấu hình gốc
  không phải kênh, chẳng hạn như khối `browser` của plugin trình duyệt đi kèm
- Việc lập kế hoạch thiết lập/runtime do nhà cung cấp kích hoạt quay lại dự phòng quyền sở hữu
  `providers[]` và `cliBackends[]` cấp cao nhất cũ khi thiếu siêu dữ liệu kích hoạt nhà cung cấp
  rõ ràng

Chẩn đoán của bộ lập kế hoạch có thể phân biệt gợi ý kích hoạt rõ ràng với dự phòng
quyền sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là
bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho
chẩn đoán host và kiểm thử; tác giả plugin nên tiếp tục khai báo siêu dữ liệu
mô tả quyền sở hữu tốt nhất.

## Tham chiếu qaRunners

Dùng `qaRunners` khi một plugin đóng góp một hoặc nhiều runner vận chuyển bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này rẻ và tĩnh; runtime plugin
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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Có       | `string` | Lệnh con được gắn dưới `openclaw qa`, ví dụ `matrix`.              |
| `description` | Không    | `string` | Văn bản trợ giúp dự phòng dùng khi máy chủ dùng chung cần lệnh stub. |

## Tham chiếu setup

Dùng `setup` khi các bề mặt thiết lập và onboarding cần metadata rẻ do Plugin sở hữu
trước khi thời gian chạy tải.

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
`setup.cliBackends` là bề mặt mô tả riêng cho setup dành cho
các luồng mặt phẳng điều khiển/setup nên chỉ giữ ở dạng metadata.

Khi có mặt, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên
theo hướng descriptor-first để khám phá setup. Nếu descriptor chỉ
thu hẹp Plugin ứng viên và setup vẫn cần các hook thời gian setup phong phú hơn,
hãy đặt `requiresRuntime: true` và giữ `setup-api` làm
đường thực thi dự phòng.

OpenClaw cũng đưa `setup.providers[].envVars` vào xác thực provider chung và
các tra cứu biến môi trường. `providerAuthEnvVars` vẫn được hỗ trợ thông qua một adapter
tương thích trong giai đoạn ngừng dùng, nhưng các Plugin không được đóng gói sẵn vẫn dùng nó
sẽ nhận chẩn đoán manifest. Plugin mới nên đặt metadata môi trường setup/trạng thái
trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn setup đơn giản từ `setup.providers[].authMethods`
khi không có mục setup, hoặc khi `setup.requiresRuntime: false`
khai báo không cần thời gian chạy setup. Các mục `providerAuthChoices` tường minh vẫn
được ưu tiên cho nhãn tùy chỉnh, cờ CLI, phạm vi onboarding và metadata trợ lý.

Chỉ đặt `requiresRuntime: false` khi các descriptor đó là đủ cho bề mặt
setup. OpenClaw xem `false` tường minh là hợp đồng chỉ dùng descriptor
và sẽ không thực thi `setup-api` hoặc `openclaw.setupEntry` để tra cứu setup. Nếu
một Plugin chỉ dùng descriptor vẫn phân phối một trong các mục thời gian chạy setup đó,
OpenClaw sẽ báo cáo một chẩn đoán bổ sung và tiếp tục bỏ qua mục đó. Việc bỏ qua
`requiresRuntime` giữ hành vi dự phòng cũ để các Plugin hiện có đã thêm
descriptor mà chưa có cờ này không bị hỏng.

Vì tra cứu setup có thể thực thi mã `setup-api` do Plugin sở hữu, các giá trị
`setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải luôn duy nhất trên toàn bộ
các Plugin được phát hiện. Quyền sở hữu mơ hồ sẽ bị đóng an toàn thay vì chọn một
bên thắng dựa trên thứ tự phát hiện.

Khi thời gian chạy setup được thực thi, chẩn đoán registry setup sẽ báo cáo sai lệch
descriptor nếu `setup-api` đăng ký một provider hoặc backend CLI mà các descriptor
manifest không khai báo, hoặc nếu một descriptor không có đăng ký thời gian chạy
tương ứng. Các chẩn đoán này là bổ sung và không từ chối Plugin cũ.

### Tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                         |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Có       | `string`   | Id provider được hiển thị trong setup hoặc onboarding. Giữ các id đã chuẩn hóa duy nhất toàn cục. |
| `authMethods`  | Không    | `string[]` | Id phương thức setup/xác thực mà provider này hỗ trợ mà không cần tải toàn bộ thời gian chạy.     |
| `envVars`      | Không    | `string[]` | Biến môi trường mà các bề mặt setup/trạng thái chung có thể kiểm tra trước khi thời gian chạy Plugin tải. |
| `authEvidence` | Không    | `object[]` | Kiểm tra bằng chứng xác thực cục bộ rẻ cho các provider có thể xác thực qua marker không bí mật. |

`authEvidence` dành cho các marker thông tin xác thực cục bộ do provider sở hữu có thể
được xác minh mà không cần tải mã thời gian chạy. Các kiểm tra này phải luôn rẻ và cục bộ:
không gọi mạng, không đọc keychain hoặc trình quản lý bí mật, không chạy lệnh shell và không
thăm dò API provider.

Các mục bằng chứng được hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                |
| ----------------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `type`            | Có       | `string`   | Hiện là `local-file-with-env`.                                                         |
| `fileEnvVar`      | Không    | `string`   | Biến môi trường chứa đường dẫn tệp thông tin xác thực tường minh.                      |
| `fallbackPaths`   | Không    | `string[]` | Đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}`. |
| `requiresAnyEnv`  | Không    | `string[]` | Ít nhất một biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.  |
| `requiresAllEnv`  | Không    | `string[]` | Mọi biến môi trường được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.          |
| `credentialMarker` | Có      | `string`   | Marker không bí mật được trả về khi có bằng chứng.                                     |
| `source`          | Không    | `string`   | Nhãn nguồn hướng tới người dùng cho đầu ra xác thực/trạng thái.                       |

### Trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                           |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Descriptor setup provider được hiển thị trong setup và onboarding.                                |
| `cliBackends`      | Không    | `string[]` | Id backend thời gian setup dùng cho tra cứu setup descriptor-first. Giữ các id đã chuẩn hóa duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | Id di chuyển cấu hình do bề mặt setup của Plugin này sở hữu.                                      |
| `requiresRuntime`  | Không    | `boolean`  | Setup có còn cần thực thi `setup-api` sau tra cứu descriptor hay không.                           |

## Tham chiếu uiHints

`uiHints` là một map từ tên trường cấu hình tới các gợi ý hiển thị nhỏ.

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

| Trường        | Kiểu       | Ý nghĩa                                 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Nhãn trường hướng tới người dùng.       |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                  |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                        |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.            |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm. |
| `placeholder` | `string`   | Văn bản placeholder cho đầu vào biểu mẫu. |

## Tham chiếu contracts

Chỉ dùng `contracts` cho metadata quyền sở hữu năng lực tĩnh mà OpenClaw có thể
đọc mà không cần nhập thời gian chạy Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Id factory tiện ích mở rộng máy chủ ứng dụng Codex, hiện là `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Id thời gian chạy mà một Plugin được đóng gói sẵn có thể đăng ký middleware kết quả công cụ cho. |
| `externalAuthProviders`          | `string[]` | Id provider có hook hồ sơ xác thực bên ngoài do Plugin này sở hữu.    |
| `speechProviders`                | `string[]` | Id provider giọng nói do Plugin này sở hữu.                           |
| `realtimeTranscriptionProviders` | `string[]` | Id provider phiên âm thời gian thực do Plugin này sở hữu.             |
| `realtimeVoiceProviders`         | `string[]` | Id provider giọng nói thời gian thực do Plugin này sở hữu.            |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding bộ nhớ do Plugin này sở hữu.                    |
| `mediaUnderstandingProviders`    | `string[]` | Id provider hiểu nội dung phương tiện do Plugin này sở hữu.           |
| `imageGenerationProviders`       | `string[]` | Id provider tạo ảnh do Plugin này sở hữu.                             |
| `videoGenerationProviders`       | `string[]` | Id provider tạo video do Plugin này sở hữu.                           |
| `webFetchProviders`              | `string[]` | Id provider fetch web do Plugin này sở hữu.                           |
| `webSearchProviders`             | `string[]` | Id provider tìm kiếm web do Plugin này sở hữu.                        |
| `migrationProviders`             | `string[]` | Id provider nhập do Plugin này sở hữu cho `openclaw migrate`.         |
| `tools`                          | `string[]` | Tên công cụ tác tử do Plugin này sở hữu cho kiểm tra hợp đồng được đóng gói sẵn. |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory tiện ích mở rộng chỉ dành cho
máy chủ ứng dụng Codex được đóng gói sẵn. Các biến đổi kết quả công cụ được đóng gói sẵn nên
khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không thể
đăng ký middleware kết quả công cụ vì seam này có thể ghi lại đầu ra công cụ có độ tin cậy cao
trước khi mô hình nhìn thấy.

Các Plugin provider triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`. Plugin không có khai báo này vẫn chạy
qua dự phòng tương thích đã ngừng dùng, nhưng dự phòng đó chậm hơn và
sẽ bị gỡ bỏ sau giai đoạn di chuyển.

Các provider embedding bộ nhớ được đóng gói sẵn nên khai báo
`contracts.memoryEmbeddingProviders` cho mọi id adapter mà chúng hiển thị, bao gồm
các adapter tích hợp như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest này
để chỉ tải Plugin sở hữu trước khi toàn bộ thời gian chạy Gateway
đăng ký các provider.

## Tham chiếu mediaUnderstandingProviderMetadata

Dùng `mediaUnderstandingProviderMetadata` khi một provider hiểu nội dung phương tiện có
mô hình mặc định, độ ưu tiên dự phòng tự động xác thực hoặc hỗ trợ tài liệu gốc mà
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

Mỗi mục nhập nhà cung cấp có thể bao gồm:

| Trường                 | Kiểu                                | Ý nghĩa                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Các khả năng phương tiện do nhà cung cấp này cung cấp.                       |
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ khả năng sang mô hình được dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp trước để dự phòng nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Đầu vào tài liệu native được nhà cung cấp hỗ trợ.                            |

## Tham chiếu channelConfigs

Dùng `channelConfigs` khi một Plugin kênh cần metadata cấu hình nhẹ trước khi
runtime tải. Quá trình phát hiện thiết lập/trạng thái kênh chỉ đọc có thể dùng metadata này
trực tiếp cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc
khi `setup.requiresRuntime: false` khai báo rằng runtime thiết lập là không cần thiết.

`channelConfigs` là metadata manifest của Plugin, không phải một phần cấu hình người dùng
cấp cao nhất mới. Người dùng vẫn cấu hình các phiên bản kênh trong `channels.<channel-id>`.
OpenClaw đọc metadata manifest để quyết định Plugin nào sở hữu
kênh đã cấu hình đó trước khi mã runtime của Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các
đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không đi kèm khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng
schema cấu hình cold-path, thiết lập và các bề mặt Control UI không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi runtime của Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo mặc định `auto` tĩnh cho các bước kiểm tra cấu hình lệnh
chạy trước khi runtime kênh tải. Các kênh đi kèm cũng có thể xuất bản
cùng các mặc định đó qua `package.json#openclaw.channel.commands` cùng với
metadata danh mục kênh khác do gói sở hữu.

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

Mỗi mục nhập kênh có thể bao gồm:

| Trường        | Kiểu                     | Ý nghĩa                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho từng mục nhập cấu hình kênh đã khai báo.   |
| `uiHints`     | `Record<string, object>` | Nhãn UI, placeholder hoặc gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.             |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào các bề mặt chọn và kiểm tra khi metadata runtime chưa sẵn sàng. |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và danh mục.                                     |
| `commands`    | `object`                 | Mặc định tự động tĩnh cho lệnh native và skill native cho các bước kiểm tra cấu hình trước runtime. |
| `preferOver`  | `string[]`               | ID Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên xếp trên trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Dùng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một ID kênh mà
một Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là ID Plugin đã được đổi tên, một
Plugin độc lập thay thế một Plugin đi kèm, hoặc một bản fork được bảo trì
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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả ID kênh và
ID Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì
nó đi kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong cấu hình
runtime hiệu lực để một Plugin sở hữu kênh và các công cụ của kênh đó. Lựa chọn rõ ràng của người dùng
vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin đã yêu cầu.

Giữ `preferOver` trong phạm vi các ID Plugin thật sự có thể cung cấp cùng một kênh.
Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình người dùng.

## Tham chiếu modelSupport

Dùng `modelSupport` khi OpenClaw nên suy luận Plugin nhà cung cấp của bạn từ
các ID mô hình viết tắt như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi runtime của Plugin
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

- các tham chiếu `provider/model` rõ ràng dùng metadata manifest `providers` sở hữu chúng
- `modelPatterns` thắng `modelPrefixes`
- nếu một Plugin không đi kèm và một Plugin đi kèm đều khớp, Plugin không đi kèm
  sẽ thắng
- phần mơ hồ còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được so khớp bằng `startsWith` với ID mô hình viết tắt.           |
| `modelPatterns` | `string[]` | Nguồn regex được so khớp với ID mô hình viết tắt sau khi loại bỏ hậu tố hồ sơ. |

## Tham chiếu modelCatalog

Dùng `modelCatalog` khi OpenClaw nên biết metadata mô hình của nhà cung cấp trước khi
tải runtime của Plugin. Đây là nguồn do manifest sở hữu cho các hàng danh mục cố định,
bí danh nhà cung cấp, quy tắc ẩn và chế độ phát hiện. Việc làm mới runtime
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

| Trường         | Kiểu                                                     | Ý nghĩa                                                                                                    |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho ID nhà cung cấp do Plugin này sở hữu. Các khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải thành một nhà cung cấp được sở hữu để lập kế hoạch danh mục hoặc ẩn.    |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này ẩn vì lý do riêng của nhà cung cấp.                           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Cho biết danh mục nhà cung cấp có thể được đọc từ metadata manifest, được làm mới vào cache, hay yêu cầu runtime. |

`aliases` tham gia vào tra cứu quyền sở hữu nhà cung cấp để lập kế hoạch model-catalog.
Mục tiêu bí danh phải là nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc manifest sở hữu và
áp dụng các ghi đè API/base URL của bí danh mà không cần tải runtime nhà cung cấp.
Bí danh không mở rộng danh sách danh mục chưa lọc; các danh sách rộng chỉ phát ra
các hàng nhà cung cấp chuẩn tắc do chủ sở hữu sở hữu.

`suppressions` thay thế hook runtime nhà cung cấp `suppressBuiltInModel` cũ.
Các mục ẩn chỉ được tôn trọng khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ đến một nhà cung cấp được sở hữu. Các hook
ẩn runtime không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ điều hợp API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Header tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.             |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` sẽ bị bỏ qua.         |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                     |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id mô hình cục bộ của nhà cung cấp, không có tiền tố `provider/`.           |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                      |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                      |
| `baseUrl`       | `string`                                                       | Ghi đè URL cơ sở tùy chọn theo từng mô hình.                                |
| `headers`       | `Record<string, string>`                                       | Các header tĩnh tùy chọn theo từng mô hình.                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức mà mô hình chấp nhận.                                       |
| `reasoning`     | `boolean`                                                      | Mô hình có cung cấp hành vi suy luận hay không.                             |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                       |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu dụng tùy chọn khi khác với `contextWindow`.  |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết được.                                       |
| `cost`          | `object`                                                       | Giá tùy chọn bằng USD trên một triệu token, bao gồm `tieredPricing` tùy chọn. |
| `compat`        | `object`                                                       | Các cờ tương thích tùy chọn khớp với khả năng tương thích cấu hình mô hình OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng hoàn toàn không được xuất hiện.         |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị cùng trạng thái không khả dụng.                     |
| `replaces`      | `string[]`                                                     | Các id mô hình cục bộ cũ hơn của nhà cung cấp mà mô hình này thay thế.      |
| `replacedBy`    | `string`                                                       | Id mô hình cục bộ của nhà cung cấp dùng để thay thế cho các hàng đã ngừng dùng. |
| `tags`          | `string[]`                                                     | Các thẻ ổn định được bộ chọn và bộ lọc sử dụng.                             |

Các trường ẩn:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                  |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id nhà cung cấp cho hàng upstream cần ẩn. Phải do Plugin này sở hữu hoặc được khai báo là alias được sở hữu. |
| `model`                    | `string`   | Id mô hình cục bộ của nhà cung cấp cần ẩn.                                                              |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng đã bị ẩn được yêu cầu trực tiếp.                                    |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host URL cơ sở hiệu dụng của nhà cung cấp cần có trước khi áp dụng việc ẩn.       |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` chính xác trong cấu hình nhà cung cấp cần có trước khi áp dụng việc ẩn. |

Không đặt dữ liệu chỉ dành cho runtime trong `modelCatalog`. Chỉ dùng `static` khi các
hàng manifest đủ hoàn chỉnh để các bề mặt danh sách và bộ chọn đã lọc theo nhà cung cấp có thể bỏ qua
việc khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là
các seed hoặc phần bổ sung có thể liệt kê hữu ích nhưng quá trình refresh/cache có thể thêm nhiều hàng hơn sau này;
các hàng refreshable tự chúng không có tính thẩm quyền. Dùng `runtime` khi OpenClaw
phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` cho việc dọn dẹp id mô hình do nhà cung cấp sở hữu với chi phí thấp, việc này phải
xảy ra trước khi runtime của nhà cung cấp tải. Cách này giữ các alias như tên mô hình ngắn,
id cũ cục bộ của nhà cung cấp và quy tắc tiền tố proxy trong manifest của Plugin
sở hữu, thay vì trong các bảng chọn mô hình của lõi.

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

| Trường                               | Kiểu                    | Ý nghĩa                                                                                  |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Các alias id mô hình chính xác, không phân biệt hoa thường. Giá trị được trả về đúng như đã ghi. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần xóa trước khi tra cứu alias, hữu ích cho trường hợp trùng lặp nhà cung cấp/mô hình cũ. |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi id mô hình đã chuẩn hóa chưa chứa `/`.                              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc tiền tố id trần có điều kiện sau khi tra cứu alias, được khóa bằng `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho phân loại endpoint mà chính sách yêu cầu chung
phải biết trước khi runtime của nhà cung cấp tải. Lõi vẫn sở hữu ý nghĩa của từng
`endpointClass`; manifest Plugin sở hữu metadata host và URL cơ sở.

Các trường endpoint:

| Trường                         | Kiểu       | Ý nghĩa                                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint lõi đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên host chính xác ánh xạ đến lớp endpoint.                                                    |
| `hostSuffixes`                 | `string[]` | Hậu tố host ánh xạ đến lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố miền.                |
| `baseUrls`                     | `string[]` | Các URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ đến lớp endpoint.                         |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các host toàn cục chính xác.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các host khớp để lộ tiền tố vùng Google Vertex.                       |

## Tham chiếu providerRequest

Dùng `providerRequest` cho metadata tương thích yêu cầu với chi phí thấp mà chính sách
yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ việc viết lại payload
đặc thù hành vi trong các hook runtime của nhà cung cấp hoặc helper dùng chung cho họ nhà cung cấp.

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

| Trường                | Kiểu         | Ý nghĩa                                                                                   |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp được các quyết định tương thích yêu cầu chung và chẩn đoán sử dụng.  |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho các helper yêu cầu dùng chung.              |
| `openAICompletions`   | `object`     | Các cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.          |

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá control-plane trước khi
runtime tải. Bộ nhớ đệm định giá Gateway đọc metadata này mà không nhập
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

Các trường của nhà cung cấp:

| Trường       | Kiểu              | Ý nghĩa                                                                                        |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho các nhà cung cấp cục bộ/tự host không bao giờ được tìm nạp giá OpenRouter hoặc LiteLLM. |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.             |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.                   |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                          |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id nhà cung cấp trong catalog bên ngoài khi khác với id nhà cung cấp OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem id mô hình chứa dấu gạch chéo là tham chiếu nhà cung cấp/mô hình lồng nhau, hữu ích cho các nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể id mô hình bổ sung trong catalog bên ngoài. `version-dots` thử các id phiên bản có dấu chấm như `claude-opus-4.6`. |

### OpenClaw Provider Index

OpenClaw Provider Index là metadata preview do OpenClaw sở hữu cho các nhà cung cấp
có Plugin có thể chưa được cài đặt. Nó không phải là một phần của manifest Plugin.
Manifest Plugin vẫn là nguồn thẩm quyền của Plugin đã cài đặt. Provider Index là
hợp đồng dự phòng nội bộ mà các bề mặt bộ chọn mô hình cho nhà cung cấp có thể cài đặt trong tương lai và trước khi cài đặt
sẽ sử dụng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. `modelCatalog` trong manifest Plugin đã cài đặt.
3. Bộ nhớ đệm catalog mô hình từ refresh rõ ràng.
4. Các hàng preview trong OpenClaw Provider Index.

Chỉ mục Nhà cung cấp không được chứa bí mật, trạng thái đã bật, hook runtime, hoặc
dữ liệu mô hình theo tài khoản trực tiếp. Các catalog xem trước của nó dùng cùng
dạng hàng nhà cung cấp `modelCatalog` như manifest plugin, nhưng nên chỉ giới hạn
ở siêu dữ liệu hiển thị ổn định, trừ khi các trường bộ chuyển đổi runtime như `api`,
`baseUrl`, giá, hoặc cờ tương thích được chủ ý giữ đồng bộ với
manifest plugin đã cài đặt. Các nhà cung cấp có khám phá `/models` trực tiếp nên
ghi các hàng đã làm mới qua đường dẫn bộ nhớ đệm catalog mô hình rõ ràng thay vì
để thao tác liệt kê thông thường hoặc onboarding gọi API của nhà cung cấp.

Các mục trong Chỉ mục Nhà cung cấp cũng có thể mang siêu dữ liệu plugin có thể cài đặt cho các nhà cung cấp
có plugin đã được chuyển ra khỏi core hoặc theo cách khác là chưa được cài đặt. Siêu dữ liệu này
phản ánh mẫu catalog kênh: tên gói, thông số cài đặt npm,
integrity dự kiến, và các nhãn lựa chọn xác thực nhẹ là đủ để hiển thị một
tùy chọn thiết lập có thể cài đặt. Sau khi plugin được cài đặt, manifest của nó sẽ thắng và
mục Chỉ mục Nhà cung cấp bị bỏ qua cho nhà cung cấp đó.

Các khóa năng lực cấp cao nhất kiểu cũ đã bị ngừng khuyến nghị. Dùng `openclaw doctor --fix` để
di chuyển `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; việc tải
manifest thông thường không còn coi các trường cấp cao nhất đó là quyền sở hữu
năng lực.

## Manifest so với package.json

Hai tệp này phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Khám phá, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực, và gợi ý UI phải tồn tại trước khi mã plugin chạy                         |
| `package.json`         | Siêu dữ liệu npm, cài đặt phụ thuộc, và khối `openclaw` dùng cho entrypoint, chặn cài đặt, thiết lập, hoặc siêu dữ liệu catalog |

Nếu bạn không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã plugin, hãy đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, hãy đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến khám phá

Một số siêu dữ liệu plugin trước runtime được chủ ý đặt trong `package.json` dưới
khối `openclaw` thay vì `openclaw.plugin.json`.

Ví dụ quan trọng:

| Trường                                                            | Ý nghĩa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Khai báo entrypoint plugin native. Phải nằm trong thư mục gói plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Khai báo entrypoint runtime JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói plugin.                                                                 |
| `openclaw.setupEntry`                                             | Entrypoint chỉ dành cho thiết lập, nhẹ, được dùng trong onboarding, khởi động kênh trì hoãn, và khám phá trạng thái kênh/SecretRef chỉ đọc. Phải nằm trong thư mục gói plugin. |
| `openclaw.runtimeSetupEntry`                                      | Khai báo entrypoint thiết lập JavaScript đã build cho các gói đã cài đặt. Phải nằm trong thư mục gói plugin.                                                                |
| `openclaw.channel`                                                | Siêu dữ liệu catalog kênh nhẹ như nhãn, đường dẫn tài liệu, bí danh, và nội dung lựa chọn.                                                                                                 |
| `openclaw.channel.commands`                                       | Siêu dữ liệu mặc định tự động cho lệnh native và skill native tĩnh, được dùng bởi cấu hình, audit, và các bề mặt danh sách lệnh trước khi runtime kênh tải.                                          |
| `openclaw.channel.configuredState`                                | Siêu dữ liệu trình kiểm tra trạng thái đã cấu hình nhẹ, có thể trả lời "thiết lập chỉ dùng env đã tồn tại chưa?" mà không tải runtime kênh đầy đủ.                                         |
| `openclaw.channel.persistedAuthState`                             | Siêu dữ liệu trình kiểm tra xác thực đã lưu nhẹ, có thể trả lời "đã có gì đăng nhập chưa?" mà không tải runtime kênh đầy đủ.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Gợi ý cài đặt/cập nhật cho plugin đi kèm và plugin phát hành bên ngoài.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Chuỗi integrity dist npm dự kiến như `sha512-...`; các luồng cài đặt và cập nhật xác minh artifact đã tải theo chuỗi này.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Cho phép đường dẫn khôi phục cài đặt lại plugin đi kèm trong phạm vi hẹp khi cấu hình không hợp lệ.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Cho phép các bề mặt kênh chỉ dành cho thiết lập tải trước plugin kênh đầy đủ trong quá trình khởi động.                                                                                                 |

Siêu dữ liệu manifest quyết định lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách tải hoặc bật plugin đó khi người dùng chọn một trong các
lựa chọn đó. Đừng di chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải
registry manifest. Giá trị không hợp lệ bị từ chối; giá trị mới hơn nhưng hợp lệ sẽ bỏ qua
plugin trên các host cũ hơn.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục catalog bên ngoài chính thức
nên ghép thông số chính xác với `expectedIntegrity` để các luồng cập nhật thất bại
đóng nếu artifact npm đã tải không còn khớp với bản phát hành đã ghim.
Onboarding tương tác vẫn cung cấp các thông số npm registry đáng tin cậy, bao gồm cả
tên gói trần và dist-tag, để tương thích. Chẩn đoán catalog có thể
phân biệt nguồn chính xác, trôi nổi, được ghim integrity, thiếu integrity, tên gói
không khớp, và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ để nó có thể ghim.
Khi `expectedIntegrity` có mặt,
các luồng cài đặt/cập nhật sẽ thực thi nó; khi bị bỏ qua, việc phân giải registry được
ghi lại mà không có ghim integrity.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải runtime đầy đủ.
Entry thiết lập nên cung cấp siêu dữ liệu kênh cùng với bộ chuyển đổi cấu hình,
trạng thái, và bí mật an toàn cho thiết lập; giữ client mạng, listener gateway, và
runtime vận chuyển trong entrypoint extension chính.

Các trường entrypoint runtime không ghi đè kiểm tra ranh giới gói cho các trường
entrypoint nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể khiến một
đường dẫn `openclaw.extensions` thoát khỏi ranh giới trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` được chủ ý giữ hẹp. Nó không
làm cho các cấu hình hỏng tùy ý trở nên có thể cài đặt. Hiện tại nó chỉ cho phép các luồng cài đặt
khôi phục từ những lỗi nâng cấp plugin đi kèm đã cũ cụ thể, chẳng hạn như
thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` đã cũ cho chính
plugin đi kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và hướng người vận hành
đến `openclaw doctor --fix`.

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

Dùng nó khi thiết lập, doctor, trạng thái, hoặc các luồng hiện diện chỉ đọc cần một phép dò xác thực
có/không nhẹ trước khi plugin kênh đầy đủ tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: đừng dùng siêu dữ liệu này để tự động bật plugin,
sửa phụ thuộc runtime, hoặc quyết định liệu runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; đừng
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` theo cùng dạng cho các kiểm tra đã cấu hình
chỉ dùng env, nhẹ:

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
không phải runtime khác. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc runtime
kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của plugin.

## Thứ tự ưu tiên khám phá (id plugin trùng lặp)

OpenClaw khám phá plugin từ nhiều gốc (đi kèm, cài đặt toàn cục, workspace, các đường dẫn được cấu hình rõ ràng chọn). Nếu hai khám phá dùng chung cùng một `id`, chỉ manifest có **độ ưu tiên cao nhất** được giữ lại; các bản trùng lặp có độ ưu tiên thấp hơn bị loại bỏ thay vì tải bên cạnh nó.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được cấu hình chọn** — đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đi kèm** — plugin được phân phối cùng OpenClaw
3. **Cài đặt toàn cục** — plugin được cài vào gốc plugin OpenClaw toàn cục
4. **Workspace** — plugin được khám phá tương đối với workspace hiện tại

Hệ quả:

- Một bản sao fork hoặc đã cũ của plugin đi kèm nằm trong workspace sẽ không che khuất bản build đi kèm.
- Để thật sự ghi đè plugin đi kèm bằng bản cục bộ, hãy ghim nó qua `plugins.entries.<id>` để nó thắng theo độ ưu tiên thay vì dựa vào khám phá workspace.
- Các lần loại bỏ bản trùng lặp được ghi log để Doctor và chẩn đoán khởi động có thể chỉ đến bản sao đã bị loại bỏ.

## Yêu cầu JSON Schema

- **Mọi plugin đều phải phân phối một JSON Schema**, ngay cả khi nó không nhận cấu hình.
- Schema rỗng được chấp nhận (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực vào thời điểm đọc/ghi cấu hình, không phải trong runtime.

## Hành vi xác thực

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi
  một manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu đến các id Plugin **có thể phát hiện**. Các id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  quá trình xác thực sẽ thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình sẽ được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + nhật ký.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết schema `plugins.*` đầy đủ.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw gốc**, bao gồm cả việc tải từ hệ thống tệp cục bộ. Runtime vẫn tải mô-đun Plugin riêng; manifest chỉ dùng cho phát hiện + xác thực.
- Manifest gốc được phân tích bằng JSON5, nên các chú thích, dấu phẩy thừa ở cuối và khóa không đặt trong dấu ngoặc kép đều được chấp nhận miễn là giá trị cuối cùng vẫn là một đối tượng.
- Chỉ các trường manifest được tài liệu hóa mới được trình tải manifest đọc. Tránh dùng khóa cấp cao nhất tùy chỉnh.
- Có thể bỏ qua `channels`, `providers`, `cliBackends`, và `skills` khi Plugin không cần chúng.
- `providerDiscoveryEntry` phải luôn nhẹ và không nên import mã runtime rộng; hãy dùng nó cho siêu dữ liệu catalog nhà cung cấp tĩnh hoặc các mô tả phát hiện hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` của entry runtime đã bị phản đối và chỉ còn được giữ làm phương án tương thích dự phòng cho các Plugin cũ hơn.
- Siêu dữ liệu biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã bị phản đối, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm tra, xác thực gửi Cron, và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi coi một biến môi trường là đã được cấu hình.
- Đối với siêu dữ liệu trình hướng dẫn runtime yêu cầu mã nhà cung cấp, xem [hook runtime của nhà cung cấp](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào mô-đun gốc, hãy tài liệu hóa các bước build và mọi yêu cầu allowlist của trình quản lý gói (ví dụ: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
