---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một plugin
    - Bạn cần hiểu sự khác biệt giữa setup-entry.ts và index.ts
    - Bạn đang định nghĩa các lược đồ cấu hình Plugin hoặc siêu dữ liệu openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-07-12T08:18:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tham chiếu về cách đóng gói plugin (siêu dữ liệu `package.json`), tệp kê khai (`openclaw.plugin.json`), các điểm vào thiết lập và lược đồ cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn thực hành trình bày việc đóng gói trong ngữ cảnh cụ thể: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

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
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin nhà cung cấp / cấu hình cơ sở ClawHub">
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
  Các tệp điểm vào (tương đối với thư mục gốc của gói). Đây là các điểm vào mã nguồn hợp lệ để phát triển trong không gian làm việc và bản sao làm việc git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Các tệp JavaScript đã biên dịch tương ứng với `extensions`, được ưu tiên khi OpenClaw tải một gói npm đã cài đặt. Xem [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết thứ tự phân giải giữa mã nguồn và bản đã biên dịch.
</ParamField>
<ParamField path="setupEntry" type="string">
  Điểm vào nhẹ chỉ dành cho thiết lập (không bắt buộc).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Tệp JavaScript đã biên dịch tương ứng với `setupEntry`. Đồng thời yêu cầu phải đặt `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Danh tính plugin dự phòng `{ id, label }`, được dùng khi plugin không có siêu dữ liệu kênh/nhà cung cấp để suy ra mã định danh hoặc nhãn.
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các giao diện thiết lập, bộ chọn, bắt đầu nhanh và trạng thái.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Các cờ điều khiển hành vi khởi động.
</ParamField>
<ParamField path="compat" type="object">
  Phạm vi phiên bản `pluginApi` mà plugin này hỗ trợ. Bắt buộc đối với các bản phát hành ClawHub bên ngoài.
</ParamField>

<Note>
Mã định danh nhà cung cấp (`providers: string[]`) là siêu dữ liệu tệp kê khai, không phải siêu dữ liệu gói. Khai báo chúng trong `openclaw.plugin.json`, không phải tại đây — xem [Tệp kê khai plugin](/vi/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` là siêu dữ liệu gói nhẹ dùng cho việc khám phá kênh và các giao diện thiết lập trước khi tải thời gian chạy.

| Trường                                 | Kiểu       | Ý nghĩa                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Mã định danh kênh chuẩn.                                                       |
| `label`                                | `string`   | Nhãn chính của kênh.                                                          |
| `selectionLabel`                       | `string`   | Nhãn trong bộ chọn/thiết lập khi cần khác với `label`.                        |
| `detailLabel`                          | `string`   | Nhãn chi tiết phụ cho danh mục kênh phong phú hơn và các giao diện trạng thái. |
| `docsPath`                             | `string`   | Đường dẫn tài liệu cho các liên kết thiết lập và lựa chọn.                    |
| `docsLabel`                            | `string`   | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với mã định danh kênh.    |
| `blurb`                                | `string`   | Mô tả ngắn dùng trong quá trình làm quen/danh mục.                             |
| `order`                                | `number`   | Thứ tự sắp xếp trong danh mục kênh.                                            |
| `aliases`                              | `string[]` | Các bí danh tra cứu bổ sung để lựa chọn kênh.                                 |
| `preferOver`                           | `string[]` | Các mã định danh plugin/kênh có mức ưu tiên thấp hơn mà kênh này nên xếp trên. |
| `systemImage`                          | `string`   | Tên biểu tượng/hình ảnh hệ thống không bắt buộc cho danh mục giao diện kênh.  |
| `selectionDocsPrefix`                  | `string`   | Văn bản tiền tố trước liên kết tài liệu trong giao diện lựa chọn.             |
| `selectionDocsOmitLabel`               | `boolean`  | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong nội dung lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được nối vào nội dung lựa chọn.                         |
| `markdownCapable`                      | `boolean`  | Đánh dấu kênh có khả năng xử lý markdown để quyết định định dạng gửi đi.      |
| `exposure`                             | `object`   | Điều khiển khả năng hiển thị của kênh trong thiết lập, danh sách đã cấu hình và giao diện tài liệu. |
| `quickstartAllowFrom`                  | `boolean`  | Cho phép kênh này tham gia luồng thiết lập bắt đầu nhanh `allowFrom` tiêu chuẩn. |
| `forceAccountBinding`                  | `boolean`  | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Ưu tiên tra cứu phiên khi phân giải đích thông báo cho kênh này.               |

Ví dụ:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: đưa kênh vào các giao diện danh sách kiểu đã cấu hình/trạng thái
- `setup`: đưa kênh vào các bộ chọn thiết lập/cấu hình tương tác
- `docs`: đánh dấu kênh là công khai trong các giao diện tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh cũ. Nên ưu tiên `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu tệp kê khai.

| Trường                       | Kiểu                                | Ý nghĩa                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Đặc tả ClawHub chuẩn cho các luồng cài đặt/cập nhật và cài đặt theo yêu cầu trong quá trình làm quen. |
| `npmSpec`                    | `string`                            | Đặc tả npm chuẩn cho các luồng cài đặt/cập nhật dự phòng.                         |
| `localPath`                  | `string`                            | Đường dẫn cài đặt cục bộ dùng cho phát triển hoặc gói tích hợp sẵn.               |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn.                                         |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw tối thiểu được hỗ trợ, `>=x.y.z` hoặc `>=x.y.z-prerelease`.    |
| `expectedIntegrity`          | `string`                            | Chuỗi toàn vẹn bản phân phối npm dự kiến, thường là `sha512-...`, cho các bản cài đặt được ghim. |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép các luồng cài đặt lại plugin tích hợp sẵn khôi phục từ một số lỗi cấu hình cũ cụ thể. |
| `requiredPlatformPackages`   | `string[]`                          | Các bí danh npm dành riêng cho nền tảng bắt buộc, được xác minh trong khi cài đặt npm. |

<AccordionGroup>
  <Accordion title="Hành vi làm quen">
    Quá trình làm quen tương tác sử dụng `openclaw.install` cho các giao diện cài đặt theo yêu cầu: nếu plugin của bạn cung cấp các lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi tải thời gian chạy, quá trình làm quen có thể nhắc cài đặt từ ClawHub, npm hoặc cục bộ, cài đặt hoặc bật plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn ClawHub sử dụng `clawhubSpec` và được ưu tiên khi có; các lựa chọn npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` từ registry (phiên bản chính xác và `expectedIntegrity` là các giá trị ghim không bắt buộc, được thực thi khi cài đặt/cập nhật nếu đã đặt). Hãy giữ nội dung "hiển thị gì" trong `openclaw.plugin.json` và "cài đặt như thế nào" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu đặt `minHostVersion`, cả quá trình cài đặt và tải registry tệp kê khai không tích hợp sẵn đều thực thi giá trị này. Các máy chủ cũ hơn sẽ bỏ qua plugin bên ngoài; các chuỗi phiên bản không hợp lệ sẽ bị từ chối. Plugin mã nguồn tích hợp sẵn được giả định có cùng phiên bản với bản sao làm việc của máy chủ.
  </Accordion>
  <Accordion title="Các bản cài đặt npm được ghim">
    Đối với các bản cài đặt npm được ghim, hãy giữ phiên bản chính xác trong `npmSpec` và thêm giá trị toàn vẹn dự kiến của gói tạo tác:

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
  <Accordion title="Phạm vi của allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua chung cho cấu hình bị hỏng. Cơ chế này chỉ dành cho phạm vi khôi phục hẹp của plugin tích hợp sẵn, cho phép quá trình cài đặt lại/thiết lập sửa chữa các phần dư sau nâng cấp đã biết, chẳng hạn như thiếu đường dẫn plugin tích hợp sẵn hoặc mục `channels.<id>` cũ của chính plugin đó. Nếu cấu hình bị hỏng vì lý do không liên quan, quá trình cài đặt vẫn từ chối tiếp tục và yêu cầu người vận hành chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Trì hoãn tải đầy đủ

Plugin kênh có thể chọn trì hoãn việc tải bằng cấu hình:

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

Khi được bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi bắt đầu lắng nghe, kể cả đối với các kênh đã được cấu hình. Điểm vào đầy đủ được tải sau khi Gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tính năng trì hoãn tải khi `setupEntry` đăng ký mọi thứ mà Gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, tuyến HTTP, phương thức Gateway). Nếu điểm vào đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu điểm vào thiết lập/đầy đủ của bạn đăng ký các phương thức RPC của Gateway, hãy đặt chúng dưới một tiền tố riêng cho plugin. Các không gian tên quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc quyền sở hữu của lõi và luôn được chuẩn hóa thành `operator.admin`.

## Tệp kê khai plugin

Mọi plugin gốc đều phải cung cấp tệp `openclaw.plugin.json` tại thư mục gốc của gói. OpenClaw sử dụng tệp này để xác thực cấu hình mà không thực thi mã của plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
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

Ngay cả plugin không có cấu hình cũng phải cung cấp một lược đồ. Lược đồ trống là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [tệp kê khai Plugin](/vi/plugins/manifest) để biết tài liệu tham khảo đầy đủ về lược đồ.

## Phát hành trên ClawHub

Các gói Skills và plugin sử dụng những lệnh phát hành ClawHub riêng biệt. Đối với gói plugin, hãy sử dụng lệnh dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` là một lệnh khác dùng để phát hành thư mục skill, không phải gói plugin. Xem [Phát hành trên ClawHub](/vi/clawhub/publishing).
</Note>

## Điểm vào thiết lập

`setup-entry.ts` là một lựa chọn thay thế gọn nhẹ cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (hướng dẫn ban đầu, sửa cấu hình, kiểm tra kênh bị vô hiệu hóa):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã thời gian chạy nặng (thư viện mật mã, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh không gian làm việc đi kèm lưu các phần xuất an toàn cho thiết lập trong mô-đun phụ có thể sử dụng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay cho `defineSetupPluginEntry(...)`. Hợp đồng đi kèm đó cũng hỗ trợ phần xuất `runtime` tùy chọn để việc kết nối thời gian chạy trong lúc thiết lập luôn gọn nhẹ và tường minh.

<AccordionGroup>
  <Accordion title="Khi OpenClaw sử dụng setupEntry thay cho điểm vào đầy đủ">
    - Kênh bị vô hiệu hóa nhưng cần các bề mặt thiết lập/hướng dẫn ban đầu.
    - Kênh được bật nhưng chưa được cấu hình.
    - Tính năng tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Những gì setupEntry phải đăng ký">
    - Đối tượng plugin kênh (thông qua `defineSetupPluginEntry`).
    - Mọi tuyến HTTP cần thiết trước khi Gateway bắt đầu lắng nghe.
    - Mọi phương thức Gateway cần thiết trong quá trình khởi động.

    Các phương thức Gateway khi khởi động đó vẫn nên tránh các không gian tên quản trị cốt lõi dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="Những gì setupEntry KHÔNG nên bao gồm">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Phần nhập thời gian chạy nặng (mật mã, SDK).
    - Các phương thức Gateway chỉ cần thiết sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Phần nhập trình trợ giúp thiết lập phạm vi hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, hãy ưu tiên các điểm nối trình trợ giúp thiết lập phạm vi hẹp thay vì điểm nối bao quát `plugin-sdk/setup` khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn nhập                      | Dùng cho                                                                                       | Các phần xuất chính                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | trình trợ giúp thời gian chạy lúc thiết lập vẫn khả dụng trong `setupEntry` / khởi động kênh trì hoãn | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | bí danh tương thích đã lỗi thời; hãy dùng `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | trình trợ giúp CLI/lưu trữ/tài liệu cho thiết lập/cài đặt                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Sử dụng điểm nối rộng hơn `plugin-sdk/setup` khi bạn muốn toàn bộ bộ công cụ thiết lập dùng chung, bao gồm các trình trợ giúp vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Sử dụng `createSetupTranslator(...)` cho nội dung cố định của trình hướng dẫn thiết lập. Hàm này tuân theo ngôn ngữ của trình hướng dẫn CLI (`OPENCLAW_LOCALE`, sau đó là các biến ngôn ngữ hệ thống) và dùng tiếng Anh làm phương án dự phòng. Giữ văn bản thiết lập dành riêng cho plugin trong mã do plugin sở hữu và chỉ dùng các khóa danh mục dùng chung cho nhãn thiết lập phổ biến, văn bản trạng thái và nội dung thiết lập của plugin chính thức đi kèm.

Các bộ điều hợp vá thiết lập vẫn an toàn cho đường dẫn nóng khi nhập. Việc tra cứu bề mặt hợp đồng thăng cấp tài khoản đơn đi kèm của chúng được thực hiện trì hoãn, vì vậy việc nhập `plugin-sdk/setup-runtime` không tải ngay quá trình khám phá bề mặt hợp đồng đi kèm trước khi bộ điều hợp thực sự được sử dụng.

### Thăng cấp tài khoản đơn do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất dành cho một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định sẽ chuyển các giá trị trong phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh đi kèm có thể thu hẹp hoặc ghi đè quá trình thăng cấp đó thông qua bề mặt hợp đồng thiết lập của mình:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung cần được chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi các tài khoản có tên đã tồn tại, chỉ những khóa này được chuyển vào tài khoản được thăng cấp; các khóa chính sách/phân phối dùng chung vẫn nằm ở thư mục gốc của kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có sẽ nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ đi kèm hiện tại. Nếu đã tồn tại chính xác một tài khoản Matrix có tên, hoặc nếu `defaultAccount` trỏ đến một khóa phi chuẩn hiện có như `Ops`, quá trình thăng cấp sẽ giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Lược đồ cấu hình

Cấu hình plugin được xác thực dựa trên JSON Schema trong tệp kê khai của bạn. Người dùng cấu hình plugin thông qua:

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

Đối với cấu hình dành riêng cho kênh, hãy sử dụng phần cấu hình kênh:

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

### Xây dựng lược đồ cấu hình kênh

Sử dụng `buildChannelConfigSchema` để chuyển đổi lược đồ Zod thành trình bao `ChannelConfigSchema` được dùng bởi các cấu phần cấu hình do plugin sở hữu:

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

Nếu bạn đã viết hợp đồng dưới dạng JSON Schema hoặc TypeBox, hãy dùng trình trợ giúp trực tiếp để OpenClaw có thể bỏ qua việc chuyển đổi Zod sang JSON Schema trên các đường dẫn siêu dữ liệu:

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

Đối với plugin của bên thứ ba, hợp đồng đường dẫn lạnh vẫn là tệp kê khai plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để các bề mặt lược đồ cấu hình, thiết lập và giao diện người dùng có thể kiểm tra `channels.<id>` mà không cần tải mã thời gian chạy.

## Trình hướng dẫn thiết lập

Plugin kênh có thể cung cấp trình hướng dẫn thiết lập tương tác cho `openclaw onboard`. Trình hướng dẫn là một đối tượng `ChannelSetupWizard` trên `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

`ChannelSetupWizard` cũng hỗ trợ `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` và nhiều mục khác. Xem `src/setup-core.ts` của plugin Discord để tham khảo ví dụ đi kèm đầy đủ.

<AccordionGroup>
  <Accordion title="Lời nhắc allowFrom dùng chung">
    Đối với lời nhắc danh sách cho phép DM chỉ cần luồng `note -> prompt -> parse -> merge -> patch` tiêu chuẩn, hãy ưu tiên các trình trợ giúp thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh tiêu chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau về nhãn, điểm số và các dòng bổ sung tùy chọn, hãy ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự xây dựng cùng một đối tượng `status` trong mỗi plugin.
  </Accordion>
  <Accordion title="Bề mặt thiết lập kênh tùy chọn">
    Đối với các bề mặt thiết lập tùy chọn chỉ nên xuất hiện trong một số ngữ cảnh nhất định, hãy dùng `createOptionalChannelSetupSurface` từ `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` cũng cung cấp các trình dựng cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ từ chối an toàn khi thực sự ghi cấu hình. Chúng dùng lại một thông báo yêu cầu cài đặt cho `validateInput`, `applyAccountConfig` và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Trình trợ giúp thiết lập dựa trên tệp nhị phân">
    Đối với giao diện thiết lập dựa trên tệp nhị phân, hãy ưu tiên các trình trợ giúp ủy quyền dùng chung thay vì sao chép cùng một mã kết nối tệp nhị phân/trạng thái vào từng kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau về nhãn, gợi ý, điểm số và khả năng phát hiện tệp nhị phân
    - `createCliPathTextInput(...)` cho các trường nhập văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp đến một trình hướng dẫn đầy đủ, nặng hơn theo cách tải lười
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Phát hành và cài đặt

**Plugin bên ngoài:** phát hành lên [ClawHub](/vi/clawhub), sau đó cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Đặc tả gói thuần túy sẽ cài đặt từ npm trong quá trình chuyển đổi lúc khởi chạy, trừ khi tên khớp với mã định danh của một Plugin tích hợp sẵn hoặc chính thức; trong trường hợp đó, OpenClaw sẽ dùng bản sao cục bộ/chính thức tương ứng. Hãy dùng `clawhub:`, `npm:`, `git:` hoặc `npm-pack:` để chọn nguồn một cách xác định — xem [Quản lý Plugin](/vi/plugins/manage-plugins).

  </Tab>
  <Tab title="Chỉ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Đặc tả gói npm">
    Dùng npm khi một gói chưa được chuyển sang ClawHub hoặc khi bạn cần
    đường dẫn cài đặt npm trực tiếp trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong kho mã:** đặt trong cây không gian làm việc Plugin tích hợp sẵn; chúng được tự động phát hiện trong quá trình dựng.

<Info>
Đối với các bản cài đặt có nguồn từ npm, `openclaw plugins install` cài đặt gói vào một dự án riêng cho từng Plugin trong `~/.openclaw/npm/projects` với các tập lệnh vòng đời bị vô hiệu hóa (`--ignore-scripts`). Hãy giữ cây phần phụ thuộc của Plugin ở dạng JS/TS thuần túy và tránh các gói yêu cầu dựng bằng `postinstall`.
</Info>

<Note>
Việc khởi động Gateway không cài đặt các phần phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub chịu trách nhiệm hội tụ phần phụ thuộc; các Plugin cục bộ phải được cài đặt sẵn phần phụ thuộc.
</Note>

Siêu dữ liệu gói tích hợp sẵn được khai báo tường minh, không được suy luận từ JavaScript đã dựng khi Gateway khởi động. Các phần phụ thuộc thời gian chạy thuộc về gói Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc sao chép phần phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Tệp kê khai Plugin](/vi/plugins/manifest) — tài liệu tham chiếu đầy đủ về lược đồ tệp kê khai
- [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
