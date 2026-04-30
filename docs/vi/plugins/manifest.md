---
read_when:
    - Bạn đang xây dựng một Plugin OpenClaw
    - Bạn cần phát hành schema cấu hình Plugin hoặc gỡ lỗi các lỗi xác thực Plugin
summary: Yêu cầu về bản kê khai Plugin + lược đồ JSON (xác thực cấu hình nghiêm ngặt)
title: Bản kê khai Plugin
x-i18n:
    generated_at: "2026-04-30T09:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

This page is for the **native OpenClaw plugin manifest** only.

For compatible bundle layouts, see [Plugin bundles](/vi/plugins/bundles).

Compatible bundle formats use different manifest files:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` or the default Claude component
  layout without a manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw auto-detects those bundle layouts too, but they are not validated
against the `openclaw.plugin.json` schema described here.

For compatible bundles, OpenClaw currently reads bundle metadata plus declared
skill roots, Claude command roots, Claude bundle `settings.json` defaults,
Claude bundle LSP defaults, and supported hook packs when the layout matches
OpenClaw runtime expectations.

Every native OpenClaw plugin **must** ship a `openclaw.plugin.json` file in the
**plugin root**. OpenClaw uses this manifest to validate configuration
**without executing plugin code**. Missing or invalid manifests are treated as
plugin errors and block config validation.

See the full plugin system guide: [Plugins](/vi/tools/plugin).
For the native capability model and current external-compatibility guidance:
[Capability model](/vi/plugins/architecture#public-capability-model).

## What this file does

`openclaw.plugin.json` is the metadata OpenClaw reads **before it loads your
plugin code**. Everything below must be cheap enough to inspect without booting
plugin runtime.

**Use it for:**

- plugin identity, config validation, and config UI hints
- auth, onboarding, and setup metadata (alias, auto-enable, provider env vars, auth choices)
- activation hints for control-plane surfaces
- shorthand model-family ownership
- static capability-ownership snapshots (`contracts`)
- QA runner metadata the shared `openclaw qa` host can inspect
- channel-specific config metadata merged into catalog and validation surfaces

**Do not use it for:** registering runtime behavior, declaring code entrypoints,
or npm install metadata. Those belong in your plugin code and `package.json`.

## Minimal example

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

## Rich example

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

## Top-level field reference

| Trường                                | Bắt buộc | Kiểu                             | Ý nghĩa                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Có      | `string`                         | id Plugin chuẩn. Đây là id được dùng trong `plugins.entries.<id>`.                                                                                                                                                               |
| `configSchema`                       | Có      | `object`                         | JSON Schema nội tuyến cho cấu hình của Plugin này.                                                                                                                                                                                      |
| `enabledByDefault`                   | Không       | `true`                           | Đánh dấu một Plugin đi kèm là được bật theo mặc định. Bỏ qua trường này, hoặc đặt bất kỳ giá trị không phải `true` nào, để giữ Plugin bị tắt theo mặc định.                                                                                                      |
| `legacyPluginIds`                    | Không       | `string[]`                       | Các id cũ được chuẩn hóa thành id Plugin chuẩn này.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Không       | `string[]`                       | Các id nhà cung cấp sẽ tự động bật Plugin này khi xác thực, cấu hình hoặc tham chiếu mô hình đề cập đến chúng.                                                                                                                                   |
| `kind`                               | Không       | `"memory"` \| `"context-engine"` | Khai báo một loại Plugin độc quyền được dùng bởi `plugins.slots.*`.                                                                                                                                                                      |
| `channels`                           | Không       | `string[]`                       | Các id kênh do Plugin này sở hữu. Được dùng để khám phá và xác thực cấu hình.                                                                                                                                                       |
| `providers`                          | Không       | `string[]`                       | Các id nhà cung cấp do Plugin này sở hữu.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Không       | `string`                         | Đường dẫn mô-đun khám phá nhà cung cấp gọn nhẹ, tương đối với thư mục gốc của Plugin, dành cho siêu dữ liệu danh mục nhà cung cấp trong phạm vi tệp kê khai có thể được tải mà không cần kích hoạt toàn bộ môi trường chạy của Plugin.                                             |
| `modelSupport`                       | Không       | `object`                         | Siêu dữ liệu viết tắt về họ mô hình do tệp kê khai sở hữu, được dùng để tự động tải Plugin trước môi trường chạy.                                                                                                                                       |
| `modelCatalog`                       | Không       | `object`                         | Siêu dữ liệu danh mục mô hình khai báo cho các nhà cung cấp do Plugin này sở hữu. Đây là hợp đồng mặt phẳng điều khiển cho việc liệt kê chỉ đọc, hướng dẫn thiết lập, bộ chọn mô hình, bí danh và loại bỏ trong tương lai mà không tải môi trường chạy của Plugin.       |
| `modelPricing`                       | Không       | `object`                         | Chính sách tra cứu giá bên ngoài do nhà cung cấp sở hữu. Dùng chính sách này để loại các nhà cung cấp cục bộ/tự lưu trữ khỏi danh mục giá từ xa hoặc ánh xạ tham chiếu nhà cung cấp sang id danh mục OpenRouter/LiteLLM mà không mã hóa cứng id nhà cung cấp trong lõi.           |
| `modelIdNormalization`               | Không       | `object`                         | Việc dọn dẹp bí danh/tiền tố id mô hình do nhà cung cấp sở hữu, phải chạy trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                                                         |
| `providerEndpoints`                  | Không       | `object[]`                       | Siêu dữ liệu máy chủ/baseUrl điểm cuối do tệp kê khai sở hữu cho các tuyến nhà cung cấp mà lõi phải phân loại trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                          |
| `providerRequest`                    | Không       | `object`                         | Siêu dữ liệu gọn nhẹ về họ nhà cung cấp và khả năng tương thích yêu cầu, được chính sách yêu cầu chung dùng trước khi môi trường chạy của nhà cung cấp được tải.                                                                                                            |
| `cliBackends`                        | Không       | `string[]`                       | Các id backend suy luận CLI do Plugin này sở hữu. Được dùng để tự động kích hoạt khi khởi động từ các tham chiếu cấu hình rõ ràng.                                                                                                                       |
| `syntheticAuthRefs`                  | Không       | `string[]`                       | Các tham chiếu nhà cung cấp hoặc backend CLI có hook xác thực tổng hợp do Plugin sở hữu cần được thăm dò trong quá trình khám phá mô hình lạnh trước khi môi trường chạy được tải.                                                                                            |
| `nonSecretAuthMarkers`               | Không       | `string[]`                       | Các giá trị khóa API giữ chỗ do Plugin đi kèm sở hữu, biểu thị trạng thái thông tin đăng nhập cục bộ, OAuth hoặc môi trường xung quanh không phải bí mật.                                                                                                              |
| `commandAliases`                     | Không       | `object[]`                       | Các tên lệnh do Plugin này sở hữu, cần tạo chẩn đoán cấu hình và CLI có nhận biết Plugin trước khi môi trường chạy được tải.                                                                                                              |
| `providerAuthEnvVars`                | Không       | `Record<string, string[]>`       | Siêu dữ liệu biến môi trường tương thích đã lỗi thời cho tra cứu xác thực/trạng thái nhà cung cấp. Ưu tiên `setup.providers[].envVars` cho Plugin mới; OpenClaw vẫn đọc trường này trong thời gian loại bỏ dần.                                               |
| `providerAuthAliases`                | Không       | `Record<string, string>`         | Các id nhà cung cấp nên dùng lại một id nhà cung cấp khác để tra cứu xác thực, ví dụ một nhà cung cấp lập trình chia sẻ khóa API và hồ sơ xác thực của nhà cung cấp cơ sở.                                                                        |
| `channelEnvVars`                     | Không       | `Record<string, string[]>`       | Siêu dữ liệu biến môi trường kênh gọn nhẹ mà OpenClaw có thể kiểm tra mà không tải mã Plugin. Dùng trường này cho thiết lập kênh dựa trên biến môi trường hoặc các bề mặt xác thực mà trình trợ giúp khởi động/cấu hình chung cần thấy.                                          |
| `providerAuthChoices`                | Không       | `object[]`                       | Siêu dữ liệu lựa chọn xác thực gọn nhẹ cho bộ chọn hướng dẫn thiết lập, phân giải nhà cung cấp ưu tiên và nối dây cờ CLI đơn giản.                                                                                                                     |
| `activation`                         | Không       | `object`                         | Siêu dữ liệu gọn nhẹ cho trình lập kế hoạch kích hoạt khi khởi động, nhà cung cấp, lệnh, kênh, tuyến và tải được kích hoạt theo năng lực. Chỉ là siêu dữ liệu; môi trường chạy của Plugin vẫn sở hữu hành vi thực tế.                                                     |
| `setup`                              | Không       | `object`                         | Các mô tả thiết lập/hướng dẫn thiết lập gọn nhẹ mà bề mặt khám phá và thiết lập có thể kiểm tra mà không tải môi trường chạy của Plugin.                                                                                                                  |
| `qaRunners`                          | Không       | `object[]`                       | Các mô tả bộ chạy QA gọn nhẹ được máy chủ `openclaw qa` dùng chung trước khi môi trường chạy của Plugin được tải.                                                                                                                                    |
| `contracts`                          | Không       | `object`                         | Ảnh chụp tĩnh về năng lực đi kèm cho hook xác thực bên ngoài, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo ảnh, tạo nhạc, tạo video, tìm nạp web, tìm kiếm web và quyền sở hữu công cụ. |
| `mediaUnderstandingProviderMetadata` | Không       | `Record<string, object>`         | Các mặc định gọn nhẹ về hiểu phương tiện cho id nhà cung cấp được khai báo trong `contracts.mediaUnderstandingProviders`.                                                                                                                          |
| `channelConfigs`                     | Không       | `Record<string, object>`         | Siêu dữ liệu cấu hình kênh do tệp kê khai sở hữu, được hợp nhất vào các bề mặt khám phá và xác thực trước khi môi trường chạy được tải.                                                                                                                        |
| `skills`                             | Không       | `string[]`                       | Các thư mục Skills cần tải, tương đối với thư mục gốc của Plugin.                                                                                                                                                                           |
| `name`                               | Không       | `string`                         | Tên Plugin dễ đọc cho con người.                                                                                                                                                                                                       |
| `description`                        | Không       | `string`                         | Tóm tắt ngắn hiển thị trong các bề mặt Plugin.                                                                                                                                                                                           |
| `version`                            | Không       | `string`                         | Phiên bản Plugin mang tính thông tin.                                                                                                                                                                                                     |
| `uiHints`                            | Không       | `Record<string, object>`         | Nhãn giao diện người dùng, văn bản giữ chỗ và gợi ý độ nhạy cho các trường cấu hình.                                                                                                                                                                 |

## Tham chiếu providerAuthChoices

Mỗi mục `providerAuthChoices` mô tả một lựa chọn hướng dẫn thiết lập hoặc xác thực.
OpenClaw đọc thông tin này trước khi môi trường chạy của nhà cung cấp được tải.
Danh sách thiết lập nhà cung cấp dùng các lựa chọn trong tệp kê khai này, các lựa chọn thiết lập
được suy ra từ mô tả và siêu dữ liệu danh mục cài đặt mà không tải môi trường chạy của nhà cung cấp.

| Trường                | Bắt buộc | Kiểu                                            | Ý nghĩa                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Có       | `string`                                        | Id nhà cung cấp mà lựa chọn này thuộc về.                                                               |
| `method`              | Có       | `string`                                        | Id phương thức xác thực để điều phối tới.                                                               |
| `choiceId`            | Có       | `string`                                        | Id lựa chọn xác thực ổn định được dùng bởi các luồng hướng dẫn thiết lập ban đầu và CLI.                |
| `choiceLabel`         | Không    | `string`                                        | Nhãn hiển thị cho người dùng. Nếu bỏ qua, OpenClaw dùng lại `choiceId`.                                 |
| `choiceHint`          | Không    | `string`                                        | Văn bản trợ giúp ngắn cho bộ chọn.                                                                      |
| `assistantPriority`   | Không    | `number`                                        | Giá trị thấp hơn được sắp xếp sớm hơn trong các bộ chọn tương tác do trợ lý điều khiển.                 |
| `assistantVisibility` | Không    | `"visible"` \| `"manual-only"`                  | Ẩn lựa chọn khỏi các bộ chọn của trợ lý trong khi vẫn cho phép chọn thủ công bằng CLI.                  |
| `deprecatedChoiceIds` | Không    | `string[]`                                      | Các id lựa chọn cũ cần chuyển hướng người dùng sang lựa chọn thay thế này.                              |
| `groupId`             | Không    | `string`                                        | Id nhóm tùy chọn để nhóm các lựa chọn liên quan.                                                        |
| `groupLabel`          | Không    | `string`                                        | Nhãn hiển thị cho người dùng cho nhóm đó.                                                               |
| `groupHint`           | Không    | `string`                                        | Văn bản trợ giúp ngắn cho nhóm.                                                                         |
| `optionKey`           | Không    | `string`                                        | Khóa tùy chọn nội bộ cho các luồng xác thực một cờ đơn giản.                                            |
| `cliFlag`             | Không    | `string`                                        | Tên cờ CLI, chẳng hạn như `--openrouter-api-key`.                                                       |
| `cliOption`           | Không    | `string`                                        | Dạng tùy chọn CLI đầy đủ, chẳng hạn như `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Không    | `string`                                        | Mô tả được dùng trong phần trợ giúp CLI.                                                                |
| `onboardingScopes`    | Không    | `Array<"text-inference" \| "image-generation">` | Các bề mặt hướng dẫn thiết lập ban đầu mà lựa chọn này nên xuất hiện. Nếu bỏ qua, mặc định là `["text-inference"]`. |

## Tham chiếu commandAliases

Dùng `commandAliases` khi một plugin sở hữu tên lệnh runtime mà người dùng có thể
đưa nhầm vào `plugins.allow` hoặc cố chạy như một lệnh CLI gốc. OpenClaw
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

| Trường       | Bắt buộc | Kiểu              | Ý nghĩa                                                                |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Có       | `string`          | Tên lệnh thuộc về plugin này.                                          |
| `kind`       | Không    | `"runtime-slash"` | Đánh dấu bí danh là lệnh gạch chéo trong chat thay vì lệnh CLI gốc.    |
| `cliCommand` | Không    | `string`          | Lệnh CLI gốc liên quan để gợi ý cho các thao tác CLI, nếu có tồn tại.  |

## Tham chiếu activation

Dùng `activation` khi plugin có thể khai báo với chi phí thấp những sự kiện mặt
phẳng điều khiển nào nên đưa nó vào một kế hoạch kích hoạt/tải.

Khối này là siêu dữ liệu cho bộ lập kế hoạch, không phải API vòng đời. Nó không đăng ký
hành vi runtime, không thay thế `register(...)`, và không hứa rằng
mã plugin đã thực thi. Bộ lập kế hoạch kích hoạt dùng các trường này để
thu hẹp các plugin ứng viên trước khi quay lại siêu dữ liệu sở hữu manifest hiện có
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và các hook.

Ưu tiên siêu dữ liệu hẹp nhất đã mô tả quyền sở hữu. Dùng
`providers`, `channels`, `commandAliases`, bộ mô tả thiết lập, hoặc `contracts`
khi các trường đó diễn đạt mối quan hệ. Dùng `activation` cho các gợi ý bổ sung
cho bộ lập kế hoạch mà các trường sở hữu đó không thể biểu diễn.
Dùng `cliBackends` cấp cao nhất cho các bí danh runtime CLI như `claude-cli`,
`codex-cli`, hoặc `google-gemini-cli`; `activation.onAgentHarnesses` chỉ dành cho
các id harness tác nhân nhúng chưa có trường sở hữu.

Khối này chỉ là siêu dữ liệu. Nó không đăng ký hành vi runtime, và không
thay thế `register(...)`, `setupEntry`, hoặc các điểm vào runtime/plugin khác.
Các bên tiêu thụ hiện tại dùng nó như một gợi ý thu hẹp trước khi tải plugin rộng hơn, vì vậy
thiếu siêu dữ liệu kích hoạt thường chỉ làm tốn hiệu năng; nó không nên
làm thay đổi tính đúng đắn khi các fallback sở hữu manifest kế thừa vẫn còn tồn tại.

Mỗi plugin nên đặt `activation.onStartup` một cách có chủ ý khi OpenClaw chuyển
khỏi các lần nhập lúc khởi động ngầm định. Đặt thành `true` chỉ khi plugin phải
chạy trong quá trình khởi động Gateway. Đặt thành `false` khi plugin không hoạt động lúc
khởi động và chỉ nên tải từ các trình kích hoạt hẹp hơn. Việc bỏ qua `onStartup` giữ
fallback sidecar khởi động ngầm định kế thừa đã bị ngừng khuyến nghị cho các plugin không có
siêu dữ liệu năng lực tĩnh; các phiên bản tương lai có thể ngừng tải những
plugin đó lúc khởi động trừ khi chúng khai báo `activation.onStartup: true`. Báo cáo trạng thái và
tương thích của plugin cảnh báo bằng `legacy-implicit-startup-sidecar` khi plugin
vẫn dựa vào fallback đó.

Để kiểm thử di trú, đặt
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` để chỉ vô hiệu hóa
fallback đã bị ngừng khuyến nghị đó. Chế độ chọn tham gia này không chặn các plugin
`activation.onStartup: true` tường minh hoặc các plugin được tải bởi kênh, cấu hình,
agent-harness, bộ nhớ, hoặc các trình kích hoạt kích hoạt hẹp hơn khác.

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

| Trường             | Bắt buộc | Kiểu                                                 | Ý nghĩa                                                                                                                                                                                                                 |
| ------------------ | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Không    | `boolean`                                            | Kích hoạt khởi động Gateway tường minh. Mỗi plugin nên đặt trường này. `true` nhập plugin trong quá trình khởi động; `false` chọn không dùng fallback khởi động sidecar ngầm định đã bị ngừng khuyến nghị trừ khi một trình kích hoạt khớp khác yêu cầu tải. |
| `onProviders`      | Không    | `string[]`                                           | Các id nhà cung cấp nên đưa plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                                                 |
| `onAgentHarnesses` | Không    | `string[]`                                           | Các id runtime harness tác nhân nhúng nên đưa plugin này vào các kế hoạch kích hoạt/tải. Dùng `cliBackends` cấp cao nhất cho các bí danh backend CLI.                                                                  |
| `onCommands`       | Không    | `string[]`                                           | Các id lệnh nên đưa plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                                                         |
| `onChannels`       | Không    | `string[]`                                           | Các id kênh nên đưa plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                                                         |
| `onRoutes`         | Không    | `string[]`                                           | Các loại tuyến nên đưa plugin này vào các kế hoạch kích hoạt/tải.                                                                                                                                                      |
| `onConfigPaths`    | Không    | `string[]`                                           | Các đường dẫn cấu hình tương đối từ gốc nên đưa plugin này vào các kế hoạch khởi động/tải khi đường dẫn hiện diện và không bị vô hiệu hóa tường minh.                                                                 |
| `onCapabilities`   | Không    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Các gợi ý năng lực rộng được dùng bởi quá trình lập kế hoạch kích hoạt mặt phẳng điều khiển. Ưu tiên các trường hẹp hơn khi có thể.                                                                                  |

Các bên tiêu thụ trực tiếp hiện tại:

- Lập kế hoạch khởi động Gateway dùng `activation.onStartup` để nhập lúc khởi động
  tường minh và chọn không dùng fallback khởi động sidecar ngầm định đã bị ngừng khuyến nghị
- lập kế hoạch CLI do lệnh kích hoạt quay lại dùng kế thừa
  `commandAliases[].cliCommand` hoặc `commandAliases[].name`
- lập kế hoạch khởi động runtime tác nhân dùng `activation.onAgentHarnesses` cho
  các harness nhúng và `cliBackends[]` cấp cao nhất cho các bí danh runtime CLI
- lập kế hoạch thiết lập/kênh do kênh kích hoạt quay lại dùng quyền sở hữu
  `channels[]` kế thừa khi thiếu siêu dữ liệu kích hoạt kênh tường minh
- lập kế hoạch plugin khởi động dùng `activation.onConfigPaths` cho các bề mặt cấu hình gốc
  không phải kênh, chẳng hạn như khối `browser` của plugin trình duyệt đi kèm
- lập kế hoạch thiết lập/runtime do nhà cung cấp kích hoạt quay lại dùng quyền sở hữu
  `providers[]` kế thừa và `cliBackends[]` cấp cao nhất khi thiếu siêu dữ liệu
  kích hoạt nhà cung cấp tường minh

Chẩn đoán bộ lập kế hoạch có thể phân biệt các gợi ý kích hoạt tường minh với fallback
sở hữu manifest. Ví dụ, `activation-command-hint` nghĩa là
`activation.onCommands` đã khớp, trong khi `manifest-command-alias` nghĩa là
bộ lập kế hoạch đã dùng quyền sở hữu `commandAliases` thay thế. Các nhãn lý do này dành cho
chẩn đoán máy chủ và kiểm thử; tác giả plugin nên tiếp tục khai báo siêu dữ liệu
mô tả quyền sở hữu tốt nhất.

## Tham chiếu qaRunners

Dùng `qaRunners` khi một plugin đóng góp một hoặc nhiều runner truyền tải bên dưới
gốc `openclaw qa` dùng chung. Giữ siêu dữ liệu này nhẹ và tĩnh; runtime
plugin vẫn sở hữu việc đăng ký CLI thực tế thông qua một bề mặt
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

| Trường        | Bắt buộc | Kiểu     | Ý nghĩa                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Có       | `string` | Lệnh con được gắn bên dưới `openclaw qa`, ví dụ `matrix`.          |
| `description` | Không    | `string` | Văn bản trợ giúp dự phòng dùng khi host dùng chung cần lệnh stub. |

## tham chiếu setup

Dùng `setup` khi các bề mặt thiết lập và onboarding cần metadata rẻ do plugin sở hữu
trước khi runtime tải.

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
`setup.cliBackends` là bề mặt mô tả dành riêng cho thiết lập cho các luồng
control-plane/setup nên chỉ giữ ở dạng metadata.

Khi có mặt, `setup.providers` và `setup.cliBackends` là bề mặt tra cứu ưu tiên
theo mô tả trước để khám phá thiết lập. Nếu mô tả chỉ thu hẹp plugin ứng viên
và thiết lập vẫn cần các hook runtime lúc thiết lập phong phú hơn, đặt
`requiresRuntime: true` và giữ `setup-api` làm đường dẫn thực thi dự phòng.

OpenClaw cũng đưa `setup.providers[].envVars` vào xác thực provider chung và
các tra cứu biến env. `providerAuthEnvVars` vẫn được hỗ trợ qua adapter tương thích
trong giai đoạn ngừng dùng, nhưng các plugin không đi kèm vẫn dùng nó sẽ nhận
chẩn đoán manifest. Plugin mới nên đặt metadata env cho thiết lập/trạng thái
trên `setup.providers[].envVars`.

OpenClaw cũng có thể suy ra các lựa chọn thiết lập đơn giản từ
`setup.providers[].authMethods` khi không có mục thiết lập, hoặc khi
`setup.requiresRuntime: false` khai báo runtime thiết lập là không cần thiết.
Các mục `providerAuthChoices` tường minh vẫn được ưu tiên cho nhãn tùy chỉnh,
cờ CLI, phạm vi onboarding và metadata assistant.

Chỉ đặt `requiresRuntime: false` khi các mô tả đó là đủ cho bề mặt thiết lập.
OpenClaw xem `false` tường minh là hợp đồng chỉ dùng mô tả và sẽ không thực thi
`setup-api` hoặc `openclaw.setupEntry` để tra cứu thiết lập. Nếu một plugin
chỉ dùng mô tả vẫn phân phối một trong các mục runtime thiết lập đó, OpenClaw
báo chẩn đoán bổ sung và tiếp tục bỏ qua nó. `requiresRuntime` bị bỏ qua sẽ giữ
hành vi dự phòng cũ để các plugin hiện có đã thêm mô tả mà không có cờ này
không bị hỏng.

Vì tra cứu thiết lập có thể thực thi mã `setup-api` do plugin sở hữu, các giá trị
`setup.providers[].id` và `setup.cliBackends[]` đã chuẩn hóa phải duy trì duy nhất
trên toàn bộ plugin được khám phá. Quyền sở hữu mơ hồ sẽ thất bại đóng thay vì
chọn một bên thắng theo thứ tự khám phá.

Khi runtime thiết lập có thực thi, chẩn đoán registry thiết lập sẽ báo độ lệch
mô tả nếu `setup-api` đăng ký một provider hoặc backend CLI mà các mô tả manifest
không khai báo, hoặc nếu một mô tả không có đăng ký runtime khớp. Các chẩn đoán
này là bổ sung và không từ chối plugin cũ.

### tham chiếu setup.providers

| Trường         | Bắt buộc | Kiểu       | Ý nghĩa                                                                                           |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Có       | `string`   | Id provider được hiển thị trong thiết lập hoặc onboarding. Giữ các id đã chuẩn hóa duy nhất toàn cục. |
| `authMethods`  | Không    | `string[]` | Id phương thức thiết lập/xác thực mà provider này hỗ trợ mà không cần tải toàn bộ runtime.        |
| `envVars`      | Không    | `string[]` | Biến env mà các bề mặt thiết lập/trạng thái chung có thể kiểm tra trước khi runtime plugin tải.   |
| `authEvidence` | Không    | `object[]` | Kiểm tra bằng chứng xác thực cục bộ rẻ cho provider có thể xác thực qua marker không bí mật.      |

`authEvidence` dành cho các marker thông tin xác thực cục bộ do provider sở hữu
có thể được xác minh mà không cần tải mã runtime. Các kiểm tra này phải luôn rẻ
và cục bộ: không gọi mạng, không đọc keychain hoặc trình quản lý bí mật, không
chạy lệnh shell, và không probe API provider.

Các mục bằng chứng được hỗ trợ:

| Trường            | Bắt buộc | Kiểu       | Ý nghĩa                                                                                                      |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`            | Có       | `string`   | Hiện là `local-file-with-env`.                                                                               |
| `fileEnvVar`      | Không    | `string`   | Biến env chứa đường dẫn tệp thông tin xác thực tường minh.                                                   |
| `fallbackPaths`   | Không    | `string[]` | Đường dẫn tệp thông tin xác thực cục bộ được kiểm tra khi `fileEnvVar` vắng mặt hoặc rỗng. Hỗ trợ `${HOME}` và `${APPDATA}`. |
| `requiresAnyEnv`  | Không    | `string[]` | Ít nhất một biến env được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                               |
| `requiresAllEnv`  | Không    | `string[]` | Mọi biến env được liệt kê phải không rỗng trước khi bằng chứng hợp lệ.                                       |
| `credentialMarker` | Có      | `string`   | Marker không bí mật được trả về khi bằng chứng hiện diện.                                                    |
| `source`          | Không    | `string`   | Nhãn nguồn hướng người dùng cho đầu ra xác thực/trạng thái.                                                  |

### các trường setup

| Trường             | Bắt buộc | Kiểu       | Ý nghĩa                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | Không    | `object[]` | Mô tả thiết lập provider được hiển thị trong thiết lập và onboarding.                         |
| `cliBackends`      | Không    | `string[]` | Id backend lúc thiết lập dùng cho tra cứu thiết lập theo mô tả trước. Giữ id đã chuẩn hóa duy nhất toàn cục. |
| `configMigrations` | Không    | `string[]` | Id di chuyển cấu hình do bề mặt thiết lập của plugin này sở hữu.                              |
| `requiresRuntime`  | Không    | `boolean`  | Thiết lập có còn cần thực thi `setup-api` sau tra cứu mô tả hay không.                        |

## tham chiếu uiHints

`uiHints` là một ánh xạ từ tên trường cấu hình đến các gợi ý render nhỏ.

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
| `label`       | `string`   | Nhãn trường hướng người dùng.            |
| `help`        | `string`   | Văn bản trợ giúp ngắn.                   |
| `tags`        | `string[]` | Thẻ UI tùy chọn.                         |
| `advanced`    | `boolean`  | Đánh dấu trường là nâng cao.             |
| `sensitive`   | `boolean`  | Đánh dấu trường là bí mật hoặc nhạy cảm. |
| `placeholder` | `string`   | Văn bản placeholder cho đầu vào biểu mẫu. |

## tham chiếu contracts

Chỉ dùng `contracts` cho metadata quyền sở hữu năng lực tĩnh mà OpenClaw có thể
đọc mà không import runtime plugin.

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
| `agentToolResultMiddleware`      | `string[]` | Id runtime mà plugin đi kèm có thể đăng ký middleware kết quả công cụ cho. |
| `externalAuthProviders`          | `string[]` | Id provider có hook hồ sơ xác thực bên ngoài do plugin này sở hữu.    |
| `speechProviders`                | `string[]` | Id provider giọng nói do plugin này sở hữu.                           |
| `realtimeTranscriptionProviders` | `string[]` | Id provider phiên âm thời gian thực do plugin này sở hữu.             |
| `realtimeVoiceProviders`         | `string[]` | Id provider giọng nói thời gian thực do plugin này sở hữu.            |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding bộ nhớ do plugin này sở hữu.                    |
| `mediaUnderstandingProviders`    | `string[]` | Id provider hiểu phương tiện do plugin này sở hữu.                    |
| `imageGenerationProviders`       | `string[]` | Id provider tạo ảnh do plugin này sở hữu.                             |
| `videoGenerationProviders`       | `string[]` | Id provider tạo video do plugin này sở hữu.                           |
| `webFetchProviders`              | `string[]` | Id provider web-fetch do plugin này sở hữu.                           |
| `webSearchProviders`             | `string[]` | Id provider web-search do plugin này sở hữu.                          |
| `migrationProviders`             | `string[]` | Id provider import do plugin này sở hữu cho `openclaw migrate`.       |
| `tools`                          | `string[]` | Tên công cụ agent do plugin này sở hữu cho kiểm tra hợp đồng đi kèm.  |

`contracts.embeddedExtensionFactories` được giữ lại cho các factory extension
chỉ dành cho máy chủ ứng dụng Codex đi kèm. Các biến đổi kết quả công cụ đi kèm
nên khai báo `contracts.agentToolResultMiddleware` và đăng ký bằng
`api.registerAgentToolResultMiddleware(...)` thay vào đó. Plugin bên ngoài không
thể đăng ký middleware kết quả công cụ vì seam này có thể viết lại đầu ra công
cụ có độ tin cậy cao trước khi mô hình thấy nó.

Các plugin provider triển khai `resolveExternalAuthProfiles` nên khai báo
`contracts.externalAuthProviders`. Plugin không có khai báo vẫn chạy qua dự phòng
tương thích đã ngừng dùng, nhưng dự phòng đó chậm hơn và sẽ bị loại bỏ sau giai
đoạn di chuyển.

Provider embedding bộ nhớ đi kèm nên khai báo
`contracts.memoryEmbeddingProviders` cho mọi id adapter mà chúng hiển thị, bao gồm
các adapter tích hợp như `local`. Các đường dẫn CLI độc lập dùng hợp đồng manifest
này để chỉ tải plugin sở hữu trước khi toàn bộ runtime Gateway đã đăng ký provider.

## tham chiếu mediaUnderstandingProviderMetadata

Sử dụng `mediaUnderstandingProviderMetadata` khi một nhà cung cấp hiểu nội dung phương tiện có
các mô hình mặc định, thứ tự ưu tiên dự phòng xác thực tự động, hoặc hỗ trợ tài liệu gốc mà
các trình trợ giúp lõi chung cần trước khi thời gian chạy được tải. Các khóa cũng phải được khai báo trong
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
| `defaultModels`        | `Record<string, string>`            | Mặc định ánh xạ khả năng sang mô hình, dùng khi cấu hình không chỉ định mô hình. |
| `autoPriority`         | `Record<string, number>`            | Số thấp hơn được sắp xếp sớm hơn cho dự phòng nhà cung cấp tự động dựa trên thông tin xác thực. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Các đầu vào tài liệu gốc được nhà cung cấp hỗ trợ.                           |

## Tham chiếu channelConfigs

Sử dụng `channelConfigs` khi một Plugin kênh cần siêu dữ liệu cấu hình nhẹ trước khi
thời gian chạy được tải. Quy trình khám phá trạng thái/thiết lập kênh chỉ đọc có thể dùng trực tiếp
siêu dữ liệu này cho các kênh bên ngoài đã cấu hình khi không có mục thiết lập, hoặc
khi `setup.requiresRuntime: false` khai báo rằng thời gian chạy thiết lập là không cần thiết.

`channelConfigs` là siêu dữ liệu bản kê khai Plugin, không phải một phần cấu hình người dùng cấp cao nhất mới.
Người dùng vẫn cấu hình các phiên bản kênh dưới `channels.<channel-id>`.
OpenClaw đọc siêu dữ liệu bản kê khai để quyết định Plugin nào sở hữu kênh đã cấu hình đó
trước khi mã thời gian chạy của Plugin thực thi.

Đối với một Plugin kênh, `configSchema` và `channelConfigs` mô tả các
đường dẫn khác nhau:

- `configSchema` xác thực `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` xác thực `channels.<channel-id>`

Các Plugin không được đóng gói kèm có khai báo `channels[]` cũng nên khai báo các mục
`channelConfigs` tương ứng. Nếu không có chúng, OpenClaw vẫn có thể tải Plugin, nhưng
lược đồ cấu hình đường dẫn lạnh, thiết lập và các bề mặt Control UI không thể biết
hình dạng tùy chọn do kênh sở hữu cho đến khi thời gian chạy của Plugin thực thi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` và
`nativeSkillsAutoEnabled` có thể khai báo các mặc định `auto` tĩnh cho các bước kiểm tra cấu hình lệnh
chạy trước khi thời gian chạy kênh được tải. Các kênh được đóng gói kèm cũng có thể xuất bản
cùng các mặc định đó thông qua `package.json#openclaw.channel.commands` cùng với
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

Mỗi mục nhập kênh có thể bao gồm:

| Trường        | Kiểu                     | Ý nghĩa                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema cho `channels.<id>`. Bắt buộc cho mỗi mục cấu hình kênh đã khai báo.          |
| `uiHints`     | `Record<string, object>` | Nhãn/gợi ý chỗ nhập/gợi ý nhạy cảm tùy chọn cho phần cấu hình kênh đó.                    |
| `label`       | `string`                 | Nhãn kênh được hợp nhất vào bộ chọn và các bề mặt kiểm tra khi siêu dữ liệu thời gian chạy chưa sẵn sàng. |
| `description` | `string`                 | Mô tả kênh ngắn cho các bề mặt kiểm tra và danh mục.                                      |
| `commands`    | `object`                 | Các mặc định tự động tĩnh cho lệnh gốc và kỹ năng gốc để kiểm tra cấu hình trước thời gian chạy. |
| `preferOver`  | `string[]`               | Các mã định danh Plugin cũ hoặc có mức ưu tiên thấp hơn mà kênh này nên xếp trên trong các bề mặt lựa chọn. |

### Thay thế một Plugin kênh khác

Sử dụng `preferOver` khi Plugin của bạn là chủ sở hữu được ưu tiên cho một mã định danh kênh mà
một Plugin khác cũng có thể cung cấp. Các trường hợp phổ biến là mã định danh Plugin đã được đổi tên, một
Plugin độc lập thay thế một Plugin được đóng gói kèm, hoặc một nhánh rẽ được duy trì
giữ nguyên mã định danh kênh để tương thích cấu hình.

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

Khi `channels.chat` được cấu hình, OpenClaw xem xét cả mã định danh kênh và
mã định danh Plugin được ưu tiên. Nếu Plugin có mức ưu tiên thấp hơn chỉ được chọn vì
nó được đóng gói kèm hoặc được bật theo mặc định, OpenClaw sẽ tắt nó trong cấu hình
thời gian chạy hiệu dụng để một Plugin sở hữu kênh và các công cụ của kênh. Lựa chọn rõ ràng của người dùng
vẫn thắng: nếu người dùng bật rõ ràng cả hai Plugin, OpenClaw
giữ nguyên lựa chọn đó và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì
âm thầm thay đổi tập Plugin đã yêu cầu.

Giữ `preferOver` trong phạm vi các mã định danh Plugin thực sự có thể cung cấp cùng một kênh.
Đây không phải là trường ưu tiên chung và không đổi tên các khóa cấu hình người dùng.

## Tham chiếu modelSupport

Sử dụng `modelSupport` khi OpenClaw nên suy luận Plugin nhà cung cấp của bạn từ
các mã định danh mô hình viết tắt như `gpt-5.5` hoặc `claude-sonnet-4.6` trước khi thời gian chạy
của Plugin được tải.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw áp dụng thứ tự ưu tiên này:

- các tham chiếu `provider/model` rõ ràng dùng siêu dữ liệu bản kê khai `providers` sở hữu
- `modelPatterns` ưu tiên hơn `modelPrefixes`
- nếu một Plugin không được đóng gói kèm và một Plugin được đóng gói kèm đều khớp, Plugin không được đóng gói kèm
  sẽ thắng
- phần mơ hồ còn lại bị bỏ qua cho đến khi người dùng hoặc cấu hình chỉ định nhà cung cấp

Các trường:

| Trường          | Kiểu       | Ý nghĩa                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Các tiền tố được khớp bằng `startsWith` với mã định danh mô hình viết tắt.       |
| `modelPatterns` | `string[]` | Nguồn biểu thức chính quy được khớp với mã định danh mô hình viết tắt sau khi loại bỏ hậu tố hồ sơ. |

## Tham chiếu modelCatalog

Sử dụng `modelCatalog` khi OpenClaw nên biết siêu dữ liệu mô hình của nhà cung cấp trước khi
tải thời gian chạy của Plugin. Đây là nguồn do bản kê khai sở hữu cho các hàng danh mục cố định,
bí danh nhà cung cấp, quy tắc loại bỏ và chế độ khám phá. Việc làm mới khi chạy
vẫn thuộc về mã thời gian chạy của nhà cung cấp, nhưng bản kê khai cho lõi biết khi nào thời gian chạy
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
| `providers`    | `Record<string, object>`                                 | Các hàng danh mục cho mã định danh nhà cung cấp do Plugin này sở hữu. Các khóa cũng nên xuất hiện trong `providers` cấp cao nhất. |
| `aliases`      | `Record<string, object>`                                 | Bí danh nhà cung cấp nên phân giải thành một nhà cung cấp được sở hữu để lập kế hoạch danh mục hoặc loại bỏ. |
| `suppressions` | `object[]`                                               | Các hàng mô hình từ nguồn khác mà Plugin này loại bỏ vì lý do riêng của nhà cung cấp.                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Cho biết danh mục nhà cung cấp có thể được đọc từ siêu dữ liệu bản kê khai, được làm mới vào bộ nhớ đệm, hay yêu cầu thời gian chạy. |

`aliases` tham gia vào tra cứu quyền sở hữu nhà cung cấp cho lập kế hoạch danh mục mô hình.
Các đích bí danh phải là nhà cung cấp cấp cao nhất do cùng Plugin sở hữu. Khi một
danh sách được lọc theo nhà cung cấp dùng bí danh, OpenClaw có thể đọc bản kê khai sở hữu và
áp dụng các ghi đè API/URL cơ sở của bí danh mà không cần tải thời gian chạy của nhà cung cấp.
Bí danh không mở rộng các danh sách danh mục không lọc; các danh sách rộng chỉ phát ra
các hàng nhà cung cấp chính tắc sở hữu.

`suppressions` thay thế hook thời gian chạy nhà cung cấp `suppressBuiltInModel` cũ.
Các mục loại bỏ chỉ được tôn trọng khi nhà cung cấp do Plugin sở hữu hoặc
được khai báo là khóa `modelCatalog.aliases` trỏ tới một nhà cung cấp được sở hữu. Các hook
loại bỏ thời gian chạy không còn được gọi trong quá trình phân giải mô hình.

Các trường nhà cung cấp:

| Trường    | Kiểu                     | Ý nghĩa                                                             |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL cơ sở mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `api`     | `ModelApi`               | Bộ điều hợp API mặc định tùy chọn cho các mô hình trong danh mục nhà cung cấp này. |
| `headers` | `Record<string, string>` | Các tiêu đề tĩnh tùy chọn áp dụng cho danh mục nhà cung cấp này.    |
| `models`  | `object[]`               | Các hàng mô hình bắt buộc. Các hàng không có `id` sẽ bị bỏ qua.     |

Các trường mô hình:

| Trường          | Kiểu                                                           | Ý nghĩa                                                                     |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Mã định danh mô hình cục bộ theo nhà cung cấp, không có tiền tố `provider/`. |
| `name`          | `string`                                                       | Tên hiển thị tùy chọn.                                                      |
| `api`           | `ModelApi`                                                     | Ghi đè API tùy chọn theo từng mô hình.                                      |
| `baseUrl`       | `string`                                                       | Ghi đè URL cơ sở tùy chọn theo từng mô hình.                                |
| `headers`       | `Record<string, string>`                                       | Header tĩnh tùy chọn theo từng mô hình.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Các phương thức mà mô hình chấp nhận.                                       |
| `reasoning`     | `boolean`                                                      | Mô hình có cung cấp hành vi reasoning hay không.                            |
| `contextWindow` | `number`                                                       | Cửa sổ ngữ cảnh gốc của nhà cung cấp.                                       |
| `contextTokens` | `number`                                                       | Giới hạn ngữ cảnh runtime hiệu dụng tùy chọn khi khác với `contextWindow`.  |
| `maxTokens`     | `number`                                                       | Số token đầu ra tối đa khi biết được.                                       |
| `cost`          | `object`                                                       | Giá USD tùy chọn trên mỗi triệu token, bao gồm `tieredPricing` tùy chọn.    |
| `compat`        | `object`                                                       | Cờ tương thích tùy chọn khớp với cấu hình tương thích mô hình của OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Trạng thái liệt kê. Chỉ ẩn khi hàng đó hoàn toàn không được xuất hiện.      |
| `statusReason`  | `string`                                                       | Lý do tùy chọn hiển thị cùng trạng thái không khả dụng.                     |
| `replaces`      | `string[]`                                                     | Các mã định danh mô hình cục bộ theo nhà cung cấp cũ hơn mà mô hình này thay thế. |
| `replacedBy`    | `string`                                                       | Mã định danh mô hình cục bộ theo nhà cung cấp thay thế cho các hàng đã ngừng dùng. |
| `tags`          | `string[]`                                                     | Thẻ ổn định được các bộ chọn và bộ lọc sử dụng.                             |

Các trường loại bỏ:

| Trường                     | Kiểu       | Ý nghĩa                                                                                                   |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Mã định danh nhà cung cấp cho hàng upstream cần loại bỏ. Phải thuộc sở hữu của Plugin này hoặc được khai báo là bí danh thuộc sở hữu. |
| `model`                    | `string`   | Mã định danh mô hình cục bộ theo nhà cung cấp cần loại bỏ.                                                |
| `reason`                   | `string`   | Thông báo tùy chọn hiển thị khi hàng đã loại bỏ được yêu cầu trực tiếp.                                   |
| `when.baseUrlHosts`        | `string[]` | Danh sách tùy chọn các host URL cơ sở hiệu dụng bắt buộc trước khi áp dụng loại bỏ.                       |
| `when.providerConfigApiIn` | `string[]` | Danh sách tùy chọn các giá trị `api` chính xác trong cấu hình nhà cung cấp bắt buộc trước khi áp dụng loại bỏ. |

Không đặt dữ liệu chỉ dành cho runtime trong `modelCatalog`. Chỉ dùng `static` khi các hàng manifest đủ hoàn chỉnh để các bề mặt danh sách lọc theo nhà cung cấp và bộ chọn có thể bỏ qua khám phá registry/runtime. Dùng `refreshable` khi các hàng manifest là các hạt giống hoặc phần bổ sung hữu ích có thể liệt kê, nhưng việc làm mới/bộ nhớ đệm có thể thêm nhiều hàng hơn về sau; riêng các hàng refreshable không có thẩm quyền. Dùng `runtime` khi OpenClaw phải tải runtime của nhà cung cấp để biết danh sách.

## Tham chiếu modelIdNormalization

Dùng `modelIdNormalization` để dọn dẹp mã định danh mô hình thuộc sở hữu nhà cung cấp với chi phí thấp, việc này phải diễn ra trước khi runtime của nhà cung cấp được tải. Cách này giữ các bí danh như tên mô hình ngắn, mã định danh cũ cục bộ theo nhà cung cấp và quy tắc tiền tố proxy trong manifest Plugin sở hữu thay vì trong các bảng chọn mô hình của core.

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
| `aliases`                            | `Record<string,string>` | Bí danh mã định danh mô hình khớp chính xác, không phân biệt chữ hoa chữ thường. Giá trị được trả về đúng như đã viết. |
| `stripPrefixes`                      | `string[]`              | Các tiền tố cần loại bỏ trước khi tra cứu bí danh, hữu ích cho tình trạng trùng lặp provider/model cũ. |
| `prefixWhenBare`                     | `string`                | Tiền tố cần thêm khi mã định danh mô hình đã chuẩn hóa chưa chứa `/`.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Quy tắc thêm tiền tố có điều kiện cho mã định danh trần sau khi tra cứu bí danh, được khóa theo `modelPrefix` và `prefix`. |

## Tham chiếu providerEndpoints

Dùng `providerEndpoints` cho việc phân loại endpoint mà chính sách yêu cầu chung phải biết trước khi runtime của nhà cung cấp được tải. Core vẫn sở hữu ý nghĩa của từng `endpointClass`; manifest Plugin sở hữu siêu dữ liệu host và URL cơ sở.

Các trường endpoint:

| Trường                         | Kiểu       | Ý nghĩa                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Lớp endpoint core đã biết, chẳng hạn như `openrouter`, `moonshot-native`, hoặc `google-vertex`. |
| `hosts`                        | `string[]` | Tên host chính xác ánh xạ tới lớp endpoint.                                                     |
| `hostSuffixes`                 | `string[]` | Hậu tố host ánh xạ tới lớp endpoint. Thêm tiền tố `.` để chỉ khớp hậu tố miền.                  |
| `baseUrls`                     | `string[]` | URL cơ sở HTTP(S) đã chuẩn hóa chính xác ánh xạ tới lớp endpoint.                              |
| `googleVertexRegion`           | `string`   | Vùng Google Vertex tĩnh cho các host toàn cục chính xác.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Hậu tố cần loại bỏ khỏi các host khớp để lộ tiền tố vùng Google Vertex.                         |

## Tham chiếu providerRequest

Dùng `providerRequest` cho siêu dữ liệu tương thích yêu cầu với chi phí thấp mà chính sách yêu cầu chung cần mà không phải tải runtime của nhà cung cấp. Giữ việc viết lại payload theo hành vi cụ thể trong các hook runtime của nhà cung cấp hoặc các helper dùng chung theo họ nhà cung cấp.

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

| Trường                | Kiểu         | Ý nghĩa                                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `family`              | `string`     | Nhãn họ nhà cung cấp được dùng cho các quyết định tương thích yêu cầu chung và chẩn đoán. |
| `compatibilityFamily` | `"moonshot"` | Nhóm tương thích họ nhà cung cấp tùy chọn cho các helper yêu cầu dùng chung.        |
| `openAICompletions`   | `object`     | Các cờ yêu cầu completions tương thích OpenAI, hiện là `supportsStreamingUsage`.    |

## Tham chiếu modelPricing

Dùng `modelPricing` khi một nhà cung cấp cần hành vi định giá control-plane trước khi runtime được tải. Bộ nhớ đệm định giá của Gateway đọc siêu dữ liệu này mà không nhập mã runtime của nhà cung cấp.

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

| Trường       | Kiểu              | Ý nghĩa                                                                                           |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Đặt `false` cho nhà cung cấp cục bộ/tự host không bao giờ nên lấy giá OpenRouter hoặc LiteLLM.   |
| `openRouter` | `false \| object` | Ánh xạ tra cứu giá OpenRouter. `false` tắt tra cứu OpenRouter cho nhà cung cấp này.              |
| `liteLLM`    | `false \| object` | Ánh xạ tra cứu giá LiteLLM. `false` tắt tra cứu LiteLLM cho nhà cung cấp này.                    |

Các trường nguồn:

| Trường                     | Kiểu               | Ý nghĩa                                                                                                          |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Mã định danh nhà cung cấp trong catalog bên ngoài khi khác với mã định danh nhà cung cấp của OpenClaw, ví dụ `z-ai` cho nhà cung cấp `zai`. |
| `passthroughProviderModel` | `boolean`          | Xem các mã định danh mô hình chứa dấu gạch chéo là tham chiếu provider/model lồng nhau, hữu ích cho nhà cung cấp proxy như OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Các biến thể mã định danh mô hình catalog bên ngoài bổ sung. `version-dots` thử các mã định danh phiên bản có dấu chấm như `claude-opus-4.6`. |

### Chỉ mục Nhà cung cấp OpenClaw

Chỉ mục Nhà cung cấp OpenClaw là siêu dữ liệu preview do OpenClaw sở hữu cho các nhà cung cấp mà Plugin của chúng có thể chưa được cài đặt. Nó không phải là một phần của manifest Plugin. Manifest Plugin vẫn là nguồn có thẩm quyền của Plugin đã cài đặt. Chỉ mục Nhà cung cấp là hợp đồng dự phòng nội bộ mà các bề mặt bộ chọn mô hình nhà cung cấp có thể cài đặt trong tương lai và trước khi cài đặt sẽ sử dụng khi Plugin nhà cung cấp chưa được cài đặt.

Thứ tự thẩm quyền catalog:

1. Cấu hình người dùng.
2. `modelCatalog` của manifest Plugin đã cài đặt.
3. Bộ nhớ đệm catalog mô hình từ thao tác làm mới rõ ràng.
4. Các hàng preview trong Chỉ mục Nhà cung cấp OpenClaw.

Chỉ mục Nhà cung cấp không được chứa bí mật, trạng thái bật, hook runtime, hoặc
dữ liệu mô hình theo tài khoản trực tiếp. Catalog xem trước của nó dùng cùng
hình dạng hàng nhà cung cấp `modelCatalog` như manifest của Plugin, nhưng chỉ nên giới hạn
ở siêu dữ liệu hiển thị ổn định, trừ khi các trường adapter runtime như `api`,
`baseUrl`, giá, hoặc cờ tương thích được chủ ý giữ đồng bộ với
manifest Plugin đã cài đặt. Các nhà cung cấp có cơ chế phát hiện `/models` trực tiếp nên
ghi các hàng đã làm mới qua đường dẫn bộ nhớ đệm catalog mô hình rõ ràng thay vì
khiến việc liệt kê thông thường hoặc onboarding gọi API của nhà cung cấp.

Các mục trong Chỉ mục Nhà cung cấp cũng có thể mang siêu dữ liệu Plugin có thể cài đặt cho các nhà cung cấp
có Plugin đã được chuyển ra khỏi lõi hoặc vì lý do khác chưa được cài đặt. Siêu dữ liệu này
phản chiếu mẫu catalog kênh: tên package, đặc tả cài đặt npm,
integrity kỳ vọng, và nhãn lựa chọn xác thực nhẹ là đủ để hiển thị một
tùy chọn thiết lập có thể cài đặt. Khi Plugin đã được cài đặt, manifest của nó thắng và
mục Chỉ mục Nhà cung cấp sẽ bị bỏ qua cho nhà cung cấp đó.

Các khóa capability cấp cao kiểu cũ đã bị ngừng khuyến nghị. Dùng `openclaw doctor --fix` để
chuyển `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, và `webSearchProviders` vào dưới `contracts`; việc tải
manifest thông thường không còn xem các trường cấp cao đó là quyền sở hữu
capability.

## Manifest so với package.json

Hai tệp phục vụ các nhiệm vụ khác nhau:

| Tệp                    | Dùng cho                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Phát hiện, xác thực cấu hình, siêu dữ liệu lựa chọn xác thực, và gợi ý UI phải tồn tại trước khi mã Plugin chạy                  |
| `package.json`         | Siêu dữ liệu npm, cài đặt dependency, và khối `openclaw` dùng cho entrypoint, chặn cài đặt, thiết lập, hoặc siêu dữ liệu catalog |

Nếu bạn không chắc một phần siêu dữ liệu thuộc về đâu, hãy dùng quy tắc này:

- nếu OpenClaw phải biết nó trước khi tải mã Plugin, đặt nó trong `openclaw.plugin.json`
- nếu nó liên quan đến đóng gói, tệp entry, hoặc hành vi cài đặt npm, đặt nó trong `package.json`

### Các trường package.json ảnh hưởng đến phát hiện

Một số siêu dữ liệu Plugin trước runtime được chủ ý đặt trong `package.json` dưới khối
`openclaw` thay vì `openclaw.plugin.json`.

Các ví dụ quan trọng:

| Trường                                                            | Ý nghĩa                                                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Khai báo entrypoint Plugin native. Phải nằm trong thư mục package Plugin.                                                                                                            |
| `openclaw.runtimeExtensions`                                      | Khai báo entrypoint runtime JavaScript đã build cho các package đã cài đặt. Phải nằm trong thư mục package Plugin.                                                                  |
| `openclaw.setupEntry`                                             | Entrypoint chỉ thiết lập nhẹ dùng trong onboarding, khởi động kênh trì hoãn, và phát hiện trạng thái kênh chỉ đọc/SecretRef. Phải nằm trong thư mục package Plugin.                 |
| `openclaw.runtimeSetupEntry`                                      | Khai báo entrypoint thiết lập JavaScript đã build cho các package đã cài đặt. Phải nằm trong thư mục package Plugin.                                                                |
| `openclaw.channel`                                                | Siêu dữ liệu catalog kênh nhẹ như nhãn, đường dẫn tài liệu, alias, và bản sao lựa chọn.                                                                                              |
| `openclaw.channel.commands`                                       | Siêu dữ liệu tự mặc định lệnh native và skill native tĩnh được dùng bởi cấu hình, kiểm tra, và bề mặt danh sách lệnh trước khi runtime kênh tải.                                    |
| `openclaw.channel.configuredState`                                | Siêu dữ liệu bộ kiểm tra trạng thái đã cấu hình nhẹ có thể trả lời "thiết lập chỉ dùng env đã tồn tại chưa?" mà không tải toàn bộ runtime kênh.                                     |
| `openclaw.channel.persistedAuthState`                             | Siêu dữ liệu bộ kiểm tra xác thực đã lưu nhẹ có thể trả lời "đã có gì đăng nhập chưa?" mà không tải toàn bộ runtime kênh.                                                          |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Gợi ý cài đặt/cập nhật cho Plugin đi kèm và Plugin được phát hành bên ngoài.                                                                                                        |
| `openclaw.install.defaultChoice`                                  | Đường dẫn cài đặt ưu tiên khi có nhiều nguồn cài đặt.                                                                                                                               |
| `openclaw.install.minHostVersion`                                 | Phiên bản host OpenClaw tối thiểu được hỗ trợ, dùng ngưỡng semver như `>=2026.3.22`.                                                                                                |
| `openclaw.install.expectedIntegrity`                              | Chuỗi integrity dist npm kỳ vọng như `sha512-...`; luồng cài đặt và cập nhật xác minh artifact đã tải so với chuỗi này.                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Cho phép đường dẫn khôi phục cài đặt lại Plugin đi kèm ở phạm vi hẹp khi cấu hình không hợp lệ.                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Cho phép các bề mặt kênh chỉ thiết lập tải trước toàn bộ Plugin kênh trong quá trình khởi động.                                                                                    |

Siêu dữ liệu manifest quyết định những lựa chọn nhà cung cấp/kênh/thiết lập nào xuất hiện trong
onboarding trước khi runtime tải. `package.json#openclaw.install` cho
onboarding biết cách tải về hoặc bật Plugin đó khi người dùng chọn một trong các
lựa chọn đó. Không chuyển gợi ý cài đặt vào `openclaw.plugin.json`.

`openclaw.install.minHostVersion` được thực thi trong quá trình cài đặt và tải registry
manifest. Giá trị không hợp lệ bị từ chối; giá trị mới hơn nhưng hợp lệ sẽ bỏ qua
Plugin trên host cũ hơn.

Việc ghim phiên bản npm chính xác đã nằm trong `npmSpec`, ví dụ
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Các mục catalog bên ngoài chính thức
nên ghép đặc tả chính xác với `expectedIntegrity` để luồng cập nhật thất bại
đóng nếu artifact npm đã tải không còn khớp với bản phát hành đã ghim.
Onboarding tương tác vẫn cung cấp đặc tả npm từ registry tin cậy, bao gồm tên
package trần và dist-tag, để tương thích. Chẩn đoán catalog có thể
phân biệt nguồn chính xác, trôi nổi, ghim integrity, thiếu integrity, không khớp tên package,
và lựa chọn mặc định không hợp lệ. Chúng cũng cảnh báo khi
`expectedIntegrity` có mặt nhưng không có nguồn npm hợp lệ để nó ghim.
Khi `expectedIntegrity` có mặt,
luồng cài đặt/cập nhật sẽ thực thi nó; khi bị bỏ qua, kết quả phân giải registry được
ghi lại mà không có ghim integrity.

Plugin kênh nên cung cấp `openclaw.setupEntry` khi trạng thái, danh sách kênh,
hoặc quét SecretRef cần nhận diện tài khoản đã cấu hình mà không tải toàn bộ
runtime. Entry thiết lập nên phơi bày siêu dữ liệu kênh cùng adapter cấu hình,
trạng thái, và bí mật an toàn cho thiết lập; giữ client mạng, listener Gateway, và
runtime transport trong entrypoint extension chính.

Các trường entrypoint runtime không ghi đè kiểm tra ranh giới package cho các trường
entrypoint nguồn. Ví dụ, `openclaw.runtimeExtensions` không thể khiến một
đường dẫn `openclaw.extensions` thoát ra ngoài trở nên có thể tải.

`openclaw.install.allowInvalidConfigRecovery` được chủ ý giữ hẹp. Nó không
khiến các cấu hình hỏng tùy ý trở nên có thể cài đặt. Hiện nay nó chỉ cho phép luồng cài đặt
khôi phục từ những lỗi nâng cấp Plugin đi kèm cũ cụ thể, như
thiếu đường dẫn Plugin đi kèm hoặc một mục `channels.<id>` cũ cho chính
Plugin đi kèm đó. Lỗi cấu hình không liên quan vẫn chặn cài đặt và đưa operator
đến `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` là siêu dữ liệu package cho một module kiểm tra nhỏ:

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

Dùng nó khi thiết lập, doctor, trạng thái, hoặc luồng hiện diện chỉ đọc cần một
probe xác thực có/không nhẹ trước khi toàn bộ Plugin kênh tải. Trạng thái xác thực đã lưu
không phải là trạng thái kênh đã cấu hình: không dùng siêu dữ liệu này để tự động bật Plugin,
sửa dependency runtime, hoặc quyết định liệu runtime kênh có nên tải hay không.
Export đích nên là một hàm nhỏ chỉ đọc trạng thái đã lưu; không
định tuyến nó qua barrel runtime kênh đầy đủ.

`openclaw.channel.configuredState` theo cùng hình dạng cho kiểm tra đã cấu hình chỉ dùng env
nhẹ:

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
không phải runtime khác. Nếu kiểm tra cần phân giải cấu hình đầy đủ hoặc
runtime kênh thật, hãy giữ logic đó trong hook `config.hasConfiguredState`
của Plugin.

## Thứ tự ưu tiên phát hiện (id Plugin trùng lặp)

OpenClaw phát hiện Plugin từ nhiều gốc (đi kèm, cài đặt toàn cục, workspace, đường dẫn được chọn rõ ràng trong cấu hình). Nếu hai phát hiện dùng cùng `id`, chỉ manifest có **mức ưu tiên cao nhất** được giữ lại; các bản trùng lặp ưu tiên thấp hơn bị loại bỏ thay vì tải song song.

Thứ tự ưu tiên, từ cao nhất đến thấp nhất:

1. **Được chọn trong cấu hình** — một đường dẫn được ghim rõ ràng trong `plugins.entries.<id>`
2. **Đi kèm** — Plugin được phát hành cùng OpenClaw
3. **Cài đặt toàn cục** — Plugin được cài vào gốc Plugin OpenClaw toàn cục
4. **Workspace** — Plugin được phát hiện tương đối với workspace hiện tại

Hệ quả:

- Một bản fork hoặc bản cũ của Plugin đi kèm nằm trong workspace sẽ không che khuất bản build đi kèm.
- Để thật sự ghi đè một Plugin đi kèm bằng bản cục bộ, ghim nó qua `plugins.entries.<id>` để nó thắng theo thứ tự ưu tiên thay vì dựa vào phát hiện workspace.
- Các lần loại bỏ bản trùng lặp được ghi log để Doctor và chẩn đoán khởi động có thể chỉ ra bản sao bị loại.

## Yêu cầu JSON Schema

- **Mọi Plugin phải phát hành kèm một JSON Schema**, ngay cả khi nó không nhận cấu hình.
- Schema rỗng là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại runtime.

## Hành vi xác thực

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi
  manifest của Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*`
  phải tham chiếu đến id Plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một Plugin đã được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc bị thiếu,
  quá trình xác thực sẽ thất bại và Doctor báo cáo lỗi Plugin.
- Nếu cấu hình Plugin tồn tại nhưng Plugin bị **tắt**, cấu hình sẽ được giữ lại và
  một **cảnh báo** được hiển thị trong Doctor + nhật ký.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration) để biết đầy đủ schema `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc đối với các Plugin OpenClaw native**, bao gồm cả tải từ hệ thống tệp cục bộ. Runtime vẫn tải module Plugin riêng; manifest chỉ dùng cho phát hiện + xác thực.
- Manifest native được phân tích bằng JSON5, vì vậy comment, dấu phẩy cuối và khóa không đặt trong dấu ngoặc kép được chấp nhận miễn là giá trị cuối cùng vẫn là một object.
- Trình tải manifest chỉ đọc các trường manifest đã được tài liệu hóa. Tránh các khóa cấp cao nhất tùy chỉnh.
- `channels`, `providers`, `cliBackends`, và `skills` đều có thể được bỏ qua khi Plugin không cần chúng.
- `providerDiscoveryEntry` phải luôn gọn nhẹ và không nên import mã runtime rộng; dùng nó cho metadata danh mục provider tĩnh hoặc descriptor phát hiện hẹp, không dùng cho thực thi tại thời điểm yêu cầu.
- Các loại Plugin độc quyền được chọn thông qua `plugins.slots.*`: `kind: "memory"` qua `plugins.slots.memory`, `kind: "context-engine"` qua `plugins.slots.contextEngine` (mặc định `legacy`).
- Khai báo loại Plugin độc quyền trong manifest này. `OpenClawPluginDefinition.kind` của entry runtime đã bị loại bỏ dần và chỉ còn là fallback tương thích cho các Plugin cũ hơn.
- Metadata biến môi trường (`setup.providers[].envVars`, `providerAuthEnvVars` đã bị loại bỏ dần, và `channelEnvVars`) chỉ mang tính khai báo. Trạng thái, kiểm tra audit, xác thực phân phối cron và các bề mặt chỉ đọc khác vẫn áp dụng chính sách tin cậy Plugin và kích hoạt hiệu lực trước khi coi một biến môi trường là đã được cấu hình.
- Đối với metadata wizard runtime yêu cầu mã provider, xem [hook runtime provider](/vi/plugins/architecture-internals#provider-runtime-hooks).
- Nếu Plugin của bạn phụ thuộc vào module native, hãy tài liệu hóa các bước build và mọi yêu cầu allowlist của trình quản lý gói (ví dụ: `allow-build-scripts` của pnpm + `pnpm rebuild <package>`).

## Liên quan

<CardGroup cols={3}>
  <Card title="Xây dựng Plugin" href="/vi/plugins/building-plugins" icon="rocket">
    Bắt đầu với Plugin.
  </Card>
  <Card title="Kiến trúc Plugin" href="/vi/plugins/architecture" icon="diagram-project">
    Kiến trúc nội bộ và mô hình capability.
  </Card>
  <Card title="Tổng quan SDK" href="/vi/plugins/sdk-overview" icon="book">
    Tham chiếu SDK Plugin và import subpath.
  </Card>
</CardGroup>
