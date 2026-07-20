---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một plugin
    - Bạn cần hiểu `setup-entry.ts` so với `index.ts`
    - Bạn đang định nghĩa các schema cấu hình Plugin hoặc metadata openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-07-20T04:30:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tham chiếu về đóng gói plugin (metadata `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn thực hành trình bày việc đóng gói trong ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata gói

`package.json` của bạn cần có trường `openclaw` để cho hệ thống plugin biết plugin của bạn cung cấp những gì:

<Tabs>
  <Tab title="Plugin kênh">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "Kênh của tôi",
          "blurb": "Mô tả ngắn về kênh."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin nhà cung cấp / đường cơ sở ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Việc phát hành ra bên ngoài trên ClawHub yêu cầu `compat` và `build`. Các đoạn mã phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Các tệp điểm vào (tương đối so với thư mục gốc của gói). Các mục nguồn hợp lệ để phát triển trong workspace và bản checkout git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Các tệp JavaScript đã build tương ứng với `extensions`, được ưu tiên khi OpenClaw tải một gói npm đã cài đặt. Xem [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết thứ tự phân giải nguồn/bản build.
</ParamField>
<ParamField path="setupEntry" type="string">
  Mục nhẹ chỉ dành cho thiết lập (không bắt buộc).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Tệp JavaScript đã build tương ứng với `setupEntry`. Yêu cầu `setupEntry` cũng phải được đặt.
</ParamField>
<ParamField path="plugin" type="object">
  Danh tính plugin dự phòng `{ id, label }`, được dùng khi plugin không có metadata kênh/nhà cung cấp để suy ra id hoặc nhãn.
</ParamField>
<ParamField path="channel" type="object">
  Metadata danh mục kênh cho các bề mặt thiết lập, bộ chọn, bắt đầu nhanh và trạng thái.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Các cờ hành vi khởi động.
</ParamField>
<ParamField path="compat" type="object">
  Khoảng phiên bản `pluginApi` mà plugin này hỗ trợ. Bắt buộc đối với các bản phát hành ClawHub bên ngoài.
</ParamField>

<Note>
Các id nhà cung cấp (`providers: string[]`) là metadata manifest, không phải metadata gói. Khai báo chúng trong `openclaw.plugin.json`, không phải ở đây — xem [Manifest plugin](/vi/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` là metadata gói nhẹ dùng cho việc khám phá kênh và các bề mặt thiết lập trước khi runtime được tải.

| Trường                                  | Kiểu       | Ý nghĩa                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id kênh chuẩn.                                                                |
| `label`                                | `string`   | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`   | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                   |
| `detailLabel`                          | `string`   | Nhãn chi tiết phụ cho danh mục kênh và bề mặt trạng thái phong phú hơn.       |
| `docsPath`                             | `string`   | Đường dẫn tài liệu cho các liên kết thiết lập và lựa chọn.                    |
| `docsLabel`                            | `string`   | Nhãn ghi đè dùng cho liên kết tài liệu khi cần khác với id kênh.              |
| `blurb`                                | `string`   | Mô tả ngắn cho quy trình làm quen/danh mục.                                   |
| `order`                                | `number`   | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Các bí danh tra cứu bổ sung để lựa chọn kênh.                                 |
| `preferOver`                           | `string[]` | Các id plugin/kênh có mức ưu tiên thấp hơn mà kênh này phải được xếp trên.    |
| `systemImage`                          | `string`   | Tên biểu tượng/hình ảnh hệ thống không bắt buộc cho danh mục UI kênh.         |
| `selectionDocsPrefix`                  | `string`   | Văn bản tiền tố trước liên kết tài liệu trên các bề mặt lựa chọn.             |
| `selectionDocsOmitLabel`               | `boolean`  | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong nội dung lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được nối vào nội dung lựa chọn.                        |
| `markdownCapable`                      | `boolean`  | Đánh dấu kênh có khả năng xử lý markdown để quyết định định dạng đầu ra.      |
| `exposure`                             | `object`   | Các điều khiển khả năng hiển thị của kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean`  | Cho phép kênh này tham gia luồng thiết lập bắt đầu nhanh `allowFrom` tiêu chuẩn. |
| `forceAccountBinding`                  | `boolean`  | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Ưu tiên tra cứu phiên khi phân giải các đích thông báo cho kênh này.          |

Ví dụ:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Kênh của tôi",
      "selectionLabel": "Kênh của tôi (tự lưu trữ)",
      "detailLabel": "Bot kênh của tôi",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Tích hợp trò chuyện tự lưu trữ dựa trên Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Hướng dẫn:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` hỗ trợ:

- `configured`: đưa kênh vào các bề mặt danh sách kiểu đã cấu hình/trạng thái
- `setup`: đưa kênh vào các bộ chọn thiết lập/cấu hình tương tác
- `docs`: đánh dấu kênh là hướng đến công chúng trên các bề mặt tài liệu/điều hướng

### `openclaw.install`

`openclaw.install` là metadata gói, không phải metadata manifest.

| Trường                        | Kiểu                                | Ý nghĩa                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Đặc tả ClawHub chuẩn cho quy trình cài đặt/cập nhật và cài đặt theo nhu cầu khi làm quen. |
| `npmSpec`                    | `string`                            | Đặc tả npm chuẩn cho các luồng cài đặt/cập nhật dự phòng.                        |
| `localPath`                  | `string`                            | Đường dẫn phát triển cục bộ hoặc cài đặt đi kèm.                                 |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn.                                        |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw tối thiểu được hỗ trợ, `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chuỗi toàn vẹn npm dist dự kiến, thường là `sha512-...`, cho các bản cài đặt được ghim. |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép các luồng cài đặt lại plugin đi kèm phục hồi từ những lỗi cấu hình cũ cụ thể. |
| `requiredPlatformPackages`   | `string[]`                          | Các bí danh npm dành riêng cho nền tảng bắt buộc được xác minh trong khi cài đặt npm. |

<AccordionGroup>
  <Accordion title="Hành vi làm quen">
    Quy trình làm quen tương tác sử dụng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu: nếu plugin của bạn cung cấp các lựa chọn xác thực nhà cung cấp hoặc metadata thiết lập/danh mục kênh trước khi runtime tải, quy trình làm quen có thể nhắc cài đặt qua ClawHub, npm hoặc cục bộ, cài đặt hoặc bật plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn ClawHub sử dụng `clawhubSpec` và được ưu tiên khi có; các lựa chọn npm yêu cầu metadata danh mục đáng tin cậy với `npmSpec` của registry (phiên bản chính xác và `expectedIntegrity` là các giá trị ghim không bắt buộc, được thực thi khi cài đặt/cập nhật nếu được đặt). Giữ nội dung "hiển thị gì" trong `openclaw.plugin.json` và "cách cài đặt" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu `minHostVersion` được đặt, cả quá trình cài đặt và tải registry manifest không đi kèm đều thực thi giá trị này. Các host cũ hơn bỏ qua plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Các plugin nguồn đi kèm được giả định là có cùng phiên bản với bản checkout của host.
  </Accordion>
  <Accordion title="Bản cài đặt npm được ghim">
    Đối với các bản cài đặt npm được ghim, hãy giữ phiên bản chính xác trong `npmSpec` và thêm giá trị toàn vẹn hiện vật dự kiến:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="Phạm vi allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua chung cho các cấu hình bị hỏng. Nó chỉ dành cho việc phục hồi plugin đi kèm trong phạm vi hẹp, cho phép quá trình cài đặt lại/thiết lập sửa chữa các tàn dư nâng cấp đã biết như thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` cũ cho chính plugin đó. Nếu cấu hình bị hỏng vì các lý do không liên quan, quá trình cài đặt vẫn đóng khi lỗi và yêu cầu người vận hành chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Trì hoãn tải đầy đủ

Plugin kênh có thể chọn trì hoãn tải bằng:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Khi được bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi bắt đầu lắng nghe, ngay cả đối với các kênh đã được cấu hình. Mục đầy đủ được tải sau khi Gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ mà Gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, các tuyến HTTP, các phương thức Gateway). Nếu mục nhập đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu mục nhập thiết lập/đầy đủ của bạn đăng ký các phương thức RPC của Gateway, hãy đặt chúng dưới một tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc quyền sở hữu của lõi và luôn được chuẩn hóa thành `operator.admin`.

## Manifest plugin

Mọi plugin gốc phải cung cấp một `openclaw.plugin.json` ở thư mục gốc của gói. OpenClaw sử dụng tệp này để xác thực cấu hình mà không thực thi mã plugin.

```json
{
  "id": "my-plugin",
  "name": "Plugin của tôi",
  "description": "Bổ sung các khả năng của Plugin của tôi vào OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Bí mật xác minh Webhook"
      }
    }
  }
}
```

Đối với plugin kênh, hãy thêm `channels` (và plugin nhà cung cấp thêm `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Ngay cả plugin không có cấu hình cũng phải cung cấp một schema. Schema trống là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [Manifest plugin](/vi/plugins/manifest) để tham khảo schema đầy đủ.

## Phát hành trên ClawHub

Các gói Skills và plugin sử dụng những lệnh phát hành ClawHub riêng biệt. Đối với gói plugin, hãy dùng lệnh dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` là một lệnh khác dùng để phát hành thư mục skill, không phải gói plugin. Xem [Phát hành trên ClawHub](/vi/clawhub/publishing).
</Note>

## Mục nhập thiết lập

`setup-entry.ts` là một phương án nhẹ hơn cho `index.ts`, được OpenClaw tải khi chỉ cần các bề mặt thiết lập (hướng dẫn ban đầu, sửa cấu hình, kiểm tra kênh bị vô hiệu hóa):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã thời gian chạy nặng (thư viện mật mã, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh không gian làm việc đi kèm giữ các phần xuất an toàn cho thiết lập trong mô-đun phụ có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay cho `defineSetupPluginEntry(...)`. Hợp đồng đi kèm đó cũng hỗ trợ một phần xuất `runtime` tùy chọn để việc kết nối thời gian chạy trong lúc thiết lập vẫn nhẹ và tường minh.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay cho mục nhập đầy đủ">
    - Kênh bị vô hiệu hóa nhưng cần các bề mặt thiết lập/hướng dẫn ban đầu.
    - Kênh được bật nhưng chưa được cấu hình.
    - Tính năng tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Những gì setupEntry phải đăng ký">
    - Đối tượng plugin kênh (thông qua `defineSetupPluginEntry`).
    - Mọi tuyến HTTP cần thiết trước khi Gateway lắng nghe.
    - Mọi phương thức Gateway cần thiết trong quá trình khởi động.

    Các phương thức Gateway lúc khởi động đó vẫn nên tránh những không gian tên quản trị lõi được dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="Những gì setupEntry KHÔNG nên bao gồm">
    - Các đăng ký CLI.
    - Các dịch vụ nền.
    - Các phần nhập thời gian chạy nặng (mật mã, SDK).
    - Các phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Các phần nhập trình trợ giúp thiết lập phạm vi hẹp

Đối với đường dẫn nóng chỉ dùng để thiết lập, hãy ưu tiên các điểm nối trình trợ giúp thiết lập phạm vi hẹp thay cho điểm nối bao quát `plugin-sdk/setup` khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn nhập             | Dùng cho                                                                                  | Các phần xuất chính                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | các trình trợ giúp thời gian chạy lúc thiết lập vẫn khả dụng trong `setupEntry` / quá trình khởi động kênh trì hoãn | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | các trình trợ giúp CLI/lưu trữ/tài liệu cho thiết lập/cài đặt                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Hãy dùng điểm nối rộng hơn `plugin-sdk/setup` khi bạn muốn bộ công cụ thiết lập dùng chung đầy đủ, bao gồm các trình trợ giúp vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Hãy dùng `createSetupTranslator(...)` cho nội dung cố định của trình hướng dẫn thiết lập. Nó dùng giá trị không trống đầu tiên từ `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` và `LANG`, theo thứ tự đó, rồi dự phòng sang tiếng Anh. Đặt `OPENCLAW_LOCALE=en` để ghi đè rõ ràng bằng tiếng Anh. Giữ văn bản thiết lập dành riêng cho plugin trong mã do plugin sở hữu và chỉ dùng các khóa danh mục dùng chung cho nhãn thiết lập chung, văn bản trạng thái và nội dung thiết lập của plugin chính thức đi kèm.

Các bộ điều hợp vá thiết lập vẫn an toàn cho đường dẫn nóng khi nhập. Việc tra cứu bề mặt hợp đồng nâng cấp tài khoản đơn đi kèm của chúng được thực hiện lười, vì vậy việc nhập `plugin-sdk/setup-runtime` không tải sớm cơ chế khám phá bề mặt hợp đồng đi kèm trước khi bộ điều hợp thực sự được sử dụng.

### Nâng cấp tài khoản đơn do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất dành cho một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định sẽ chuyển các giá trị theo phạm vi tài khoản được nâng cấp vào `accounts.default`.

Các kênh đi kèm có thể thu hẹp hoặc ghi đè việc nâng cấp đó thông qua bề mặt hợp đồng thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung cần được chuyển vào tài khoản được nâng cấp
- `namedAccountPromotionKeys`: khi đã tồn tại các tài khoản được đặt tên, chỉ những khóa này được chuyển vào tài khoản được nâng cấp; các khóa chính sách/phân phối dùng chung vẫn nằm ở thư mục gốc của kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có sẽ nhận các giá trị được nâng cấp

<Note>
Matrix là ví dụ đi kèm hiện tại. Nếu đã tồn tại chính xác một tài khoản Matrix được đặt tên, hoặc nếu `defaultAccount` trỏ đến một khóa không chuẩn hiện có như `Ops`, quá trình nâng cấp sẽ giữ nguyên tài khoản đó thay vì tạo một mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình plugin được xác thực theo JSON Schema trong manifest của bạn. Người dùng cấu hình plugin thông qua:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin của bạn nhận cấu hình này dưới dạng `api.pluginConfig` trong quá trình đăng ký.

Đối với cấu hình dành riêng cho kênh, hãy dùng phần cấu hình kênh thay thế:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Xây dựng schema cấu hình kênh

Hãy dùng `buildChannelConfigSchema` để chuyển đổi một schema Zod thành trình bao `ChannelConfigSchema` được dùng bởi các tạo tác cấu hình do plugin sở hữu:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Nếu bạn đã soạn hợp đồng dưới dạng JSON Schema hoặc TypeBox, hãy dùng trình trợ giúp trực tiếp để OpenClaw có thể bỏ qua việc chuyển đổi từ Zod sang JSON Schema trên các đường dẫn siêu dữ liệu:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Đối với plugin bên thứ ba, hợp đồng đường dẫn nguội vẫn là manifest plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để các bề mặt schema cấu hình, thiết lập và giao diện người dùng có thể kiểm tra `channels.<id>` mà không tải mã thời gian chạy.

## Trình hướng dẫn thiết lập

Plugin kênh có thể cung cấp trình hướng dẫn thiết lập tương tác cho `openclaw onboard`. Trình hướng dẫn là một đối tượng `ChannelSetupWizard` trên `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Đã kết nối",
    unconfiguredLabel: "Chưa cấu hình",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Sử dụng MY_CHANNEL_BOT_TOKEN từ môi trường?",
      keepPrompt: "Giữ token hiện tại?",
      inputPrompt: "Nhập token bot của bạn:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` cũng hỗ trợ `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` và nhiều mục khác. Xem `src/setup-core.ts` của plugin Discord để biết một ví dụ đi kèm đầy đủ.

<AccordionGroup>
  <Accordion title="Lời nhắc allowFrom dùng chung">
    Đối với lời nhắc danh sách cho phép DM chỉ cần luồng `note -> prompt -> parse -> merge -> patch` tiêu chuẩn, hãy ưu tiên các trình trợ giúp thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh tiêu chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau về nhãn, điểm số và các dòng bổ sung tùy chọn, hãy ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự tạo cùng một đối tượng `status` trong từng plugin.
  </Accordion>
  <Accordion title="Bề mặt thiết lập kênh tùy chọn">
    Đối với các bề mặt thiết lập tùy chọn chỉ nên xuất hiện trong một số ngữ cảnh nhất định, hãy dùng `createOptionalChannelSetupSurface` từ `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Kênh của tôi",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Trả về { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` cũng cung cấp các trình dựng cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ từ chối an toàn khi ghi cấu hình thực tế. Chúng tái sử dụng một thông báo yêu cầu cài đặt cho `validateInput`, `applyAccountConfig` và `finalize`, đồng thời nối thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Trình trợ giúp thiết lập dựa trên tệp nhị phân">
    Đối với giao diện thiết lập dựa trên tệp nhị phân, nên ưu tiên các trình trợ giúp ủy quyền dùng chung thay vì sao chép cùng một phần kết nối tệp nhị phân/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` dành cho các khối trạng thái chỉ khác nhau về nhãn, gợi ý, điểm số và khả năng phát hiện tệp nhị phân
    - `createCliPathTextInput(...)` dành cho các trường nhập văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp một cách trì hoãn sang trình hướng dẫn đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền một quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Phát hành và cài đặt

**Plugin bên ngoài:** phát hành lên [ClawHub](/vi/clawhub), sau đó cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Các đặc tả gói thuần túy sẽ được cài đặt từ npm trong quá trình chuyển đổi lúc khởi chạy, trừ khi tên khớp với id của Plugin đi kèm hoặc chính thức; trong trường hợp đó, OpenClaw sẽ sử dụng bản sao cục bộ/chính thức tương ứng. Sử dụng `clawhub:`, `npm:`, `git:` hoặc `npm-pack:` để lựa chọn nguồn một cách xác định — xem [Quản lý Plugin](/vi/plugins/manage-plugins).

  </Tab>
  <Tab title="Chỉ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Đặc tả gói npm">
    Sử dụng npm khi một gói chưa được chuyển sang ClawHub hoặc khi cần
    đường dẫn cài đặt trực tiếp từ npm trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong kho mã:** đặt trong cây không gian làm việc của Plugin đi kèm; chúng được tự động phát hiện trong quá trình dựng.

<Info>
Đối với các bản cài đặt có nguồn từ npm, `openclaw plugins install` cài đặt gói vào một dự án riêng cho từng Plugin trong `~/.openclaw/npm/projects`, với các tập lệnh vòng đời bị vô hiệu hóa (`--ignore-scripts`). Hãy giữ cây phần phụ thuộc của Plugin hoàn toàn bằng JS/TS và tránh các gói yêu cầu bản dựng `postinstall`.
</Info>

<Note>
Quá trình khởi động Gateway không cài đặt các phần phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub chịu trách nhiệm hội tụ phần phụ thuộc; Plugin cục bộ phải được cài đặt sẵn các phần phụ thuộc.
</Note>

Siêu dữ liệu của gói đi kèm được khai báo rõ ràng, không được suy luận từ JavaScript đã dựng khi Gateway khởi động. Các phần phụ thuộc thời gian chạy thuộc về gói Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc sao chép phần phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Tệp kê khai Plugin](/vi/plugins/manifest) — tài liệu tham khảo đầy đủ về lược đồ tệp kê khai
- [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
