---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một Plugin
    - Bạn cần hiểu setup-entry.ts so với index.ts
    - Bạn đang định nghĩa các schema cấu hình plugin hoặc metadata openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, schema cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tài liệu tham khảo cho đóng gói Plugin (siêu dữ liệu `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn cách làm trình bày đóng gói trong ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

`package.json` của bạn cần có trường `openclaw` cho hệ thống Plugin biết Plugin của bạn cung cấp gì:

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
  <Tab title="Plugin nhà cung cấp / đường cơ sở ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
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
Nếu bạn phát hành Plugin ra bên ngoài trên ClawHub, các trường `compat` và `build` đó là bắt buộc. Các đoạn mã phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Các tệp điểm vào (tương đối với gốc gói).
</ParamField>
<ParamField path="setupEntry" type="string">
  Điểm vào nhẹ chỉ dành cho thiết lập (không bắt buộc).
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các bề mặt thiết lập, bộ chọn, khởi động nhanh và trạng thái.
</ParamField>
<ParamField path="providers" type="string[]">
  ID nhà cung cấp được Plugin này đăng ký.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Cờ hành vi khởi động.
</ParamField>

### `openclaw.channel`

`openclaw.channel` là siêu dữ liệu gói gọn nhẹ cho việc khám phá kênh và các bề mặt thiết lập trước khi runtime tải.

| Trường                                 | Kiểu      | Ý nghĩa                                                                       |
| -------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`  | ID kênh chuẩn.                                                                |
| `label`                                | `string`  | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`  | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`  | Nhãn chi tiết phụ cho danh mục kênh và bề mặt trạng thái phong phú hơn.       |
| `docsPath`                             | `string`  | Đường dẫn tài liệu cho liên kết thiết lập và lựa chọn.                        |
| `docsLabel`                            | `string`  | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với ID kênh.              |
| `blurb`                                | `string`  | Mô tả ngắn cho nhập môn/danh mục.                                             |
| `order`                                | `number`  | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho lựa chọn kênh.                                    |
| `preferOver`                           | `string[]` | ID Plugin/kênh có mức ưu tiên thấp hơn mà kênh này nên vượt lên.             |
| `systemImage`                          | `string`  | Tên biểu tượng/system-image tùy chọn cho danh mục giao diện kênh.             |
| `selectionDocsPrefix`                  | `string`  | Văn bản tiền tố trước liên kết tài liệu trong các bề mặt lựa chọn.            |
| `selectionDocsOmitLabel`               | `boolean` | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong bản sao lựa chọn. |
| `selectionExtras`                      | `string[]` | Chuỗi ngắn bổ sung được nối thêm trong bản sao lựa chọn.                      |
| `markdownCapable`                      | `boolean` | Đánh dấu kênh có khả năng markdown cho các quyết định định dạng gửi đi.       |
| `exposure`                             | `object`  | Điều khiển khả năng hiển thị kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean` | Cho phép kênh này tham gia luồng thiết lập khởi động nhanh `allowFrom` chuẩn. |
| `forceAccountBinding`                  | `boolean` | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ có một tài khoản tồn tại.  |
| `preferSessionLookupForAnnounceTarget` | `boolean` | Ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo cho kênh này.          |

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

- `configured`: đưa kênh vào các bề mặt liệt kê kiểu đã cấu hình/trạng thái
- `setup`: đưa kênh vào bộ chọn thiết lập/cấu hình tương tác
- `docs`: đánh dấu kênh là hướng công khai trong các bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh kế thừa. Ưu tiên `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu manifest.

| Trường                       | Kiểu                                | Ý nghĩa                                                                          |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Đặc tả ClawHub chuẩn cho cài đặt/cập nhật và luồng nhập môn cài đặt theo nhu cầu. |
| `npmSpec`                    | `string`                            | Đặc tả npm chuẩn cho luồng dự phòng cài đặt/cập nhật.                            |
| `localPath`                  | `string`                            | Đường dẫn phát triển cục bộ hoặc cài đặt đóng gói kèm.                           |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn khả dụng.                               |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw tối thiểu được hỗ trợ ở dạng `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chuỗi toàn vẹn npm dist dự kiến, thường là `sha512-...`, cho các bản cài đặt ghim. |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép luồng cài đặt lại Plugin đóng gói kèm khôi phục từ các lỗi cấu hình cũ cụ thể. |
| `requiredPlatformPackages`   | `string[]`                          | Bí danh npm dành riêng cho nền tảng bắt buộc được xác minh trong khi cài đặt npm. |

<AccordionGroup>
  <Accordion title="Hành vi nhập môn">
    Quy trình nhập môn tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu Plugin của bạn hiển thị lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi runtime tải, quy trình nhập môn có thể hiển thị lựa chọn đó, nhắc cài đặt bằng ClawHub, npm hoặc cục bộ, cài đặt hoặc bật Plugin, rồi tiếp tục luồng đã chọn. Lựa chọn nhập môn ClawHub dùng `clawhubSpec` và được ưu tiên khi có; lựa chọn npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` của registry; phiên bản chính xác và `expectedIntegrity` là các ghim npm tùy chọn. Nếu có `expectedIntegrity`, luồng cài đặt/cập nhật sẽ thực thi nó cho npm. Giữ siêu dữ liệu "hiển thị gì" trong `openclaw.plugin.json` và siêu dữ liệu "cài đặt như thế nào" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu `minHostVersion` được đặt, cả quá trình cài đặt và tải registry manifest không đóng gói kèm đều thực thi nó. Host cũ hơn bỏ qua Plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Plugin nguồn đóng gói kèm được giả định là đồng phiên bản với checkout host.
  </Accordion>
  <Accordion title="Cài đặt npm đã ghim">
    Với cài đặt npm đã ghim, giữ phiên bản chính xác trong `npmSpec` và thêm toàn vẹn artifact dự kiến:

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
    `allowInvalidConfigRecovery` không phải cơ chế bỏ qua chung cho cấu hình hỏng. Nó chỉ dành cho khôi phục hẹp của Plugin đóng gói kèm, để cài đặt lại/thiết lập có thể sửa các phần sót lại sau nâng cấp đã biết, như thiếu đường dẫn Plugin đóng gói kèm hoặc mục `channels.<id>` cũ cho cùng Plugin đó. Nếu cấu hình hỏng vì lý do không liên quan, cài đặt vẫn fail closed và yêu cầu người vận hành chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Trì hoãn tải đầy đủ

Plugin kênh có thể chọn tải trì hoãn bằng:

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

Khi được bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã cấu hình. Điểm vào đầy đủ tải sau khi gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ mà gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, route HTTP, phương thức gateway). Nếu điểm vào đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu điểm vào thiết lập/đầy đủ của bạn đăng ký phương thức RPC gateway, hãy giữ chúng trên tiền tố riêng cho Plugin. Các namespace quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu của lõi và luôn phân giải thành `operator.admin`.

## Manifest Plugin

Mọi Plugin native phải đi kèm `openclaw.plugin.json` trong gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã Plugin.

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

Với Plugin kênh, thêm `kind` và `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Ngay cả Plugin không có cấu hình cũng phải đi kèm schema. Schema rỗng là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [Tệp kê khai Plugin](/vi/plugins/manifest) để biết tham chiếu schema đầy đủ.

## Xuất bản ClawHub

Đối với các gói plugin, hãy dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Bí danh xuất bản cũ chỉ dành cho skills là dành cho skills. Các gói Plugin phải luôn dùng `clawhub package publish`.
</Note>

## Mục thiết lập

Tệp `setup-entry.ts` là một lựa chọn thay thế gọn nhẹ cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa chữa cấu hình, kiểm tra kênh đã tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện mã hóa, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh workspace được gói kèm giữ các export an toàn cho thiết lập trong module phụ có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay vì `defineSetupPluginEntry(...)`. Hợp đồng được gói kèm đó cũng hỗ trợ export `runtime` tùy chọn để việc nối dây runtime tại thời điểm thiết lập có thể giữ gọn nhẹ và tường minh.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay cho mục đầy đủ">
    - Kênh bị tắt nhưng cần các bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa được cấu hình.
    - Tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry phải đăng ký những gì">
    - Đối tượng plugin kênh (qua `defineSetupPluginEntry`).
    - Bất kỳ route HTTP nào cần có trước khi Gateway listen.
    - Bất kỳ phương thức Gateway nào cần trong lúc khởi động.

    Các phương thức Gateway khi khởi động đó vẫn nên tránh các namespace quản trị lõi đã được dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="setupEntry KHÔNG nên bao gồm những gì">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (mã hóa, SDK).
    - Phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, hãy ưu tiên các điểm nối helper thiết lập hẹp hơn thay vì ô dù `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                    | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime tại thời điểm thiết lập vẫn khả dụng trong `setupEntry` / khởi động kênh trì hoãn | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/setup-runtime`                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper CLI/archive/docs cho thiết lập/cài đặt                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Dùng điểm nối `plugin-sdk/setup` rộng hơn khi bạn muốn toàn bộ bộ công cụ thiết lập dùng chung, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Dùng `createSetupTranslator(...)` cho nội dung cố định của trình hướng dẫn thiết lập. Nó tuân theo ngôn ngữ của trình hướng dẫn CLI (`OPENCLAW_LOCALE`, rồi các biến ngôn ngữ hệ thống) và quay về tiếng Anh. Giữ văn bản thiết lập dành riêng cho plugin trong mã do plugin sở hữu và chỉ dùng các khóa catalog dùng chung cho nhãn thiết lập chung, văn bản trạng thái và nội dung thiết lập Plugin được gói kèm chính thức.

Các adapter vá thiết lập vẫn an toàn trên đường dẫn nóng khi import. Tra cứu bề mặt hợp đồng thăng cấp một tài khoản được gói kèm của chúng là lười, nên việc import `plugin-sdk/setup-runtime` không tải sớm phần khám phá bề mặt hợp đồng được gói kèm trước khi adapter thật sự được dùng.

### Thăng cấp một tài khoản do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định là di chuyển các giá trị thuộc phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh được gói kèm có thể thu hẹp hoặc ghi đè việc thăng cấp đó thông qua bề mặt hợp đồng thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung nên được chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi các tài khoản có tên đã tồn tại, chỉ các khóa này được chuyển vào tài khoản được thăng cấp; các khóa chính sách/phân phối dùng chung vẫn ở gốc kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào sẽ nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ được gói kèm hiện tại. Nếu đúng một tài khoản Matrix có tên đã tồn tại, hoặc nếu `defaultAccount` trỏ tới một khóa không chuẩn hiện có như `Ops`, việc thăng cấp sẽ giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực theo JSON Schema trong tệp kê khai của bạn. Người dùng cấu hình plugin qua:

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

Plugin của bạn nhận cấu hình này dưới dạng `api.pluginConfig` trong khi đăng ký.

Đối với cấu hình dành riêng cho kênh, hãy dùng phần cấu hình kênh thay vào đó:

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

Dùng `buildChannelConfigSchema` để chuyển đổi schema Zod thành wrapper `ChannelConfigSchema` được dùng bởi các artifact cấu hình do plugin sở hữu:

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

Nếu bạn đã soạn hợp đồng dưới dạng JSON Schema hoặc TypeBox, hãy dùng helper trực tiếp để OpenClaw có thể bỏ qua việc chuyển đổi Zod sang JSON Schema trên các đường dẫn metadata:

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

Đối với plugin bên thứ ba, hợp đồng đường dẫn lạnh vẫn là tệp kê khai plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập và các bề mặt UI có thể kiểm tra `channels.<id>` mà không tải mã runtime.

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, và nhiều hơn nữa. Xem các gói plugin được gói kèm (ví dụ plugin Discord `src/channel.setup.ts`) để biết ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Prompt allowFrom dùng chung">
    Đối với prompt danh sách cho phép DM chỉ cần luồng tiêu chuẩn `note -> prompt -> parse -> merge -> patch`, hãy ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh tiêu chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau theo nhãn, điểm số và các dòng bổ sung tùy chọn, hãy ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự viết cùng đối tượng `status` trong từng plugin.
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

    `plugin-sdk/channel-setup` cũng cung cấp các builder cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ fail closed trên các lần ghi cấu hình thật. Chúng tái sử dụng một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig`, và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Helper thiết lập dựa trên binary">
    Đối với UI thiết lập dựa trên binary, hãy ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần nối binary/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau theo nhãn, gợi ý, điểm số và phát hiện binary
    - `createCliPathTextInput(...)` cho đầu vào văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lười đến một trình hướng dẫn đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền một quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Phát hành và cài đặt

**Plugin bên ngoài:** phát hành lên [ClawHub](/vi/clawhub), rồi cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Đặc tả gói dạng trần sẽ cài đặt từ npm trong quá trình chuyển đổi khi ra mắt.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Dùng npm khi một gói chưa được chuyển sang ClawHub, hoặc khi bạn cần một
    đường dẫn cài đặt npm trực tiếp trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong repo:** đặt dưới cây workspace Plugin đi kèm và chúng sẽ được tự động phát hiện trong quá trình build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các bản cài đặt có nguồn từ npm, `openclaw plugins install` cài đặt gói vào một dự án riêng cho từng Plugin dưới `~/.openclaw/npm/projects` với các script vòng đời bị tắt. Giữ cây phụ thuộc của Plugin thuần JS/TS và tránh các gói yêu cầu build bằng `postinstall`.
</Info>

<Note>
Quá trình khởi động Gateway không cài đặt phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub chịu trách nhiệm hội tụ phụ thuộc; Plugin cục bộ phải có sẵn các phụ thuộc đã được cài đặt.
</Note>

Siêu dữ liệu gói đi kèm là tường minh, không được suy luận từ JavaScript đã build khi khởi động Gateway. Phụ thuộc runtime thuộc về gói Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc phản chiếu phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Manifest Plugin](/vi/plugins/manifest) — tham chiếu đầy đủ về schema manifest
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
