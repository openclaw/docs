---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một Plugin
    - Bạn cần hiểu setup-entry.ts so với index.ts
    - Bạn đang định nghĩa các lược đồ cấu hình Plugin hoặc siêu dữ liệu openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-07-04T15:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tham chiếu cho đóng gói plugin (siêu dữ liệu `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn cách làm trình bày đóng gói trong ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

`package.json` của bạn cần có trường `openclaw` để cho hệ thống plugin biết plugin của bạn cung cấp những gì:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
Nếu bạn phát hành plugin bên ngoài trên ClawHub, các trường `compat` và `build` đó là bắt buộc. Các đoạn mã phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Các tệp điểm vào (tương đối với gốc gói).
</ParamField>
<ParamField path="setupEntry" type="string">
  Mục chỉ dành cho thiết lập, gọn nhẹ (không bắt buộc).
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các bề mặt thiết lập, bộ chọn, khởi động nhanh và trạng thái.
</ParamField>
<ParamField path="providers" type="string[]">
  Mã định danh nhà cung cấp được plugin này đăng ký.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Cờ hành vi khởi động.
</ParamField>

### `openclaw.channel`

`openclaw.channel` là siêu dữ liệu gói nhẹ cho việc phát hiện kênh và các bề mặt thiết lập trước khi thời gian chạy tải.

| Trường                                 | Kiểu      | Ý nghĩa                                                                       |
| -------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`  | Mã định danh kênh chuẩn.                                                      |
| `label`                                | `string`  | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`  | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`  | Nhãn chi tiết phụ cho danh mục kênh và bề mặt trạng thái phong phú hơn.       |
| `docsPath`                             | `string`  | Đường dẫn tài liệu cho liên kết thiết lập và lựa chọn.                        |
| `docsLabel`                            | `string`  | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với mã định danh kênh.    |
| `blurb`                                | `string`  | Mô tả ngắn cho onboarding/danh mục.                                           |
| `order`                                | `number`  | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho lựa chọn kênh.                                    |
| `preferOver`                           | `string[]` | Mã định danh plugin/kênh có mức ưu tiên thấp hơn mà kênh này nên xếp trên.   |
| `systemImage`                          | `string`  | Tên biểu tượng/hình ảnh hệ thống tùy chọn cho danh mục giao diện kênh.        |
| `selectionDocsPrefix`                  | `string`  | Văn bản tiền tố trước liên kết tài liệu trong bề mặt lựa chọn.                |
| `selectionDocsOmitLabel`               | `boolean` | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong bản sao lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được thêm vào bản sao lựa chọn.                        |
| `markdownCapable`                      | `boolean` | Đánh dấu kênh là hỗ trợ markdown cho các quyết định định dạng gửi đi.         |
| `exposure`                             | `object`  | Điều khiển khả năng hiển thị kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean` | Đưa kênh này vào luồng thiết lập khởi động nhanh `allowFrom` tiêu chuẩn.      |
| `forceAccountBinding`                  | `boolean` | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản.     |
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
- `setup`: đưa kênh vào các bộ chọn thiết lập/cấu hình tương tác
- `docs`: đánh dấu kênh là hướng ra công chúng trong bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh cũ. Ưu tiên dùng `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu manifest.

| Trường                       | Kiểu                                | Ý nghĩa                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Đặc tả ClawHub chuẩn cho cài đặt/cập nhật và các luồng onboarding cài đặt theo nhu cầu. |
| `npmSpec`                    | `string`                            | Đặc tả npm chuẩn cho các luồng dự phòng cài đặt/cập nhật.                         |
| `localPath`                  | `string`                            | Đường dẫn cài đặt phát triển cục bộ hoặc đi kèm.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn khả dụng.                                |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw được hỗ trợ tối thiểu ở dạng `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chuỗi toàn vẹn dist npm dự kiến, thường là `sha512-...`, cho các bản cài đặt được ghim. |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép các luồng cài đặt lại plugin đi kèm khôi phục từ những lỗi cấu hình cũ cụ thể. |
| `requiredPlatformPackages`   | `string[]`                          | Các bí danh npm theo nền tảng bắt buộc được xác minh trong quá trình cài đặt npm.  |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Onboarding tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu plugin của bạn hiển thị các lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi thời gian chạy tải, onboarding có thể hiển thị lựa chọn đó, nhắc chọn cài đặt từ ClawHub, npm hoặc cục bộ, cài đặt hoặc bật plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn onboarding ClawHub dùng `clawhubSpec` và được ưu tiên khi có; lựa chọn npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` của registry; phiên bản chính xác và `expectedIntegrity` là các ghim npm tùy chọn. Nếu có `expectedIntegrity`, các luồng cài đặt/cập nhật sẽ thực thi nó cho npm. Giữ siêu dữ liệu "hiển thị gì" trong `openclaw.plugin.json` và siêu dữ liệu "cài đặt như thế nào" trong `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Nếu đặt `minHostVersion`, cả cài đặt và tải registry manifest không đi kèm đều thực thi trường này. Máy chủ cũ hơn bỏ qua plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Plugin nguồn đi kèm được giả định là cùng phiên bản với checkout máy chủ.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Với các bản cài đặt npm được ghim, giữ phiên bản chính xác trong `npmSpec` và thêm tính toàn vẹn artifact dự kiến:

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua chung cho cấu hình hỏng. Nó chỉ dành cho khôi phục plugin đi kèm trong phạm vi hẹp, để cài đặt lại/thiết lập có thể sửa các phần sót lại sau nâng cấp đã biết, như thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` cũ cho cùng plugin đó. Nếu cấu hình hỏng vì lý do không liên quan, cài đặt vẫn đóng khi lỗi và yêu cầu người vận hành chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Tải đầy đủ trì hoãn

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

Khi bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã được cấu hình. Mục đầy đủ sẽ tải sau khi gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, tuyến HTTP, phương thức gateway). Nếu mục đầy đủ sở hữu các năng lực khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu mục thiết lập/đầy đủ của bạn đăng ký các phương thức RPC gateway, hãy giữ chúng trên một tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu lõi và luôn phân giải thành `operator.admin`.

## Manifest plugin

Mọi plugin native phải kèm theo `openclaw.plugin.json` trong gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã plugin.

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

Với plugin kênh, thêm `kind` và `channels`:

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

Ngay cả các Plugin không có cấu hình cũng phải phát hành kèm schema. Schema rỗng là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [manifest Plugin](/vi/plugins/manifest) để biết tham chiếu schema đầy đủ.

## Xuất bản lên ClawHub

Đối với các gói Plugin, hãy dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias xuất bản cũ chỉ dành cho skill là dành cho skills. Các gói Plugin phải luôn dùng `clawhub package publish`.
</Note>

## Mục nhập thiết lập

Tệp `setup-entry.ts` là lựa chọn thay thế nhẹ hơn cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa cấu hình, kiểm tra kênh bị tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện mã hóa, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh workspace được đóng gói sẵn giữ export an toàn cho thiết lập trong các module sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay vì `defineSetupPluginEntry(...)`. Contract được đóng gói đó cũng hỗ trợ export `runtime` tùy chọn để wiring runtime ở thời điểm thiết lập có thể vẫn nhẹ và tường minh.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay vì mục nhập đầy đủ">
    - Kênh bị tắt nhưng cần các bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa được cấu hình.
    - Tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry phải đăng ký những gì">
    - Đối tượng Plugin kênh (qua `defineSetupPluginEntry`).
    - Bất kỳ route HTTP nào cần trước khi Gateway lắng nghe.
    - Bất kỳ phương thức Gateway nào cần trong quá trình khởi động.

    Các phương thức Gateway khi khởi động đó vẫn nên tránh các namespace quản trị lõi được dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="setupEntry KHÔNG nên bao gồm những gì">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (crypto, SDK).
    - Các phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập phạm vi hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, hãy ưu tiên các điểm nối helper thiết lập phạm vi hẹp hơn thay vì umbrella `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                   | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime ở thời điểm thiết lập vẫn khả dụng trong `setupEntry` / khởi động kênh trì hoãn | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/setup-runtime`                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper CLI/cài đặt/lưu trữ/tài liệu cho thiết lập                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Dùng điểm nối `plugin-sdk/setup` rộng hơn khi bạn muốn bộ công cụ thiết lập dùng chung đầy đủ, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Dùng `createSetupTranslator(...)` cho nội dung wizard thiết lập cố định. Nó tuân theo
locale của wizard CLI (`OPENCLAW_LOCALE`, rồi đến các biến locale hệ thống) và fallback
về tiếng Anh. Giữ văn bản thiết lập dành riêng cho Plugin trong mã do Plugin sở hữu và chỉ dùng
khóa catalog dùng chung cho nhãn thiết lập phổ biến, văn bản trạng thái, và nội dung thiết lập
Plugin đóng gói chính thức.

Các adapter vá thiết lập vẫn an toàn cho đường dẫn nóng khi import. Việc tra cứu bề mặt contract thăng cấp tài khoản đơn được đóng gói của chúng là lazy, nên import `plugin-sdk/setup-runtime` không tải háo hức quá trình khám phá bề mặt contract được đóng gói trước khi adapter thực sự được dùng.

### Thăng cấp tài khoản đơn do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định là chuyển các giá trị phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh được đóng gói có thể thu hẹp hoặc ghi đè việc thăng cấp đó thông qua bề mặt contract thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung nên được chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi các tài khoản có tên đã tồn tại, chỉ các khóa này được chuyển vào tài khoản được thăng cấp; các khóa policy/delivery dùng chung vẫn ở root của kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ được đóng gói hiện tại. Nếu đúng một tài khoản Matrix có tên đã tồn tại, hoặc nếu `defaultAccount` trỏ tới một khóa không chuẩn hiện có như `Ops`, việc thăng cấp giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực dựa trên JSON Schema trong manifest của bạn. Người dùng cấu hình Plugin qua:

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

Dùng `buildChannelConfigSchema` để chuyển schema Zod thành wrapper `ChannelConfigSchema` được dùng bởi các artifact cấu hình do Plugin sở hữu:

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

Nếu bạn đã viết contract dưới dạng JSON Schema hoặc TypeBox, hãy dùng helper trực tiếp để OpenClaw có thể bỏ qua chuyển đổi Zod sang JSON Schema trên các đường dẫn metadata:

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

Đối với Plugin bên thứ ba, contract đường dẫn lạnh vẫn là manifest Plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập, và bề mặt UI có thể kiểm tra `channels.<id>` mà không tải mã runtime.

## Wizard thiết lập

Plugin kênh có thể cung cấp wizard thiết lập tương tác cho `openclaw onboard`. Wizard là một đối tượng `ChannelSetupWizard` trên `ChannelPlugin`:

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, và nhiều hơn nữa. Xem các gói Plugin được đóng gói sẵn (ví dụ Plugin Discord `src/channel.setup.ts`) để biết ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Prompt allowFrom dùng chung">
    Đối với prompt danh sách cho phép DM chỉ cần luồng chuẩn `note -> prompt -> parse -> merge -> patch`, hãy ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau theo nhãn, điểm số, và các dòng bổ sung tùy chọn, hãy ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự tạo cùng đối tượng `status` trong từng Plugin.
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

    `plugin-sdk/channel-setup` cũng expose các builder cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/wizard tùy chọn được tạo sẽ đóng kín khi ghi cấu hình thật. Chúng tái sử dụng một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig`, và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Helper thiết lập dựa trên binary">
    Đối với UI thiết lập dựa trên binary, hãy ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần gắn kết binary/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau về nhãn, gợi ý, điểm số và phát hiện binary
    - `createCliPathTextInput(...)` cho các ô nhập văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lười sang một wizard đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Xuất bản và cài đặt

**Plugin bên ngoài:** xuất bản lên [ClawHub](/clawhub), rồi cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Các đặc tả gói trần sẽ cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Dùng npm khi một gói chưa chuyển sang ClawHub, hoặc khi bạn cần một
    đường dẫn cài đặt npm trực tiếp trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong repo:** đặt dưới cây workspace Plugin được đóng gói kèm và chúng sẽ tự động được phát hiện trong quá trình build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các bản cài đặt có nguồn từ npm, `openclaw plugins install` cài đặt gói vào một project riêng cho từng Plugin dưới `~/.openclaw/npm/projects` với lifecycle scripts bị tắt. Giữ cây phụ thuộc của Plugin thuần JS/TS và tránh các gói yêu cầu build bằng `postinstall`.
</Info>

<Note>
Quá trình khởi động Gateway không cài đặt phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub chịu trách nhiệm hội tụ phụ thuộc; Plugin cục bộ phải đã được cài đặt sẵn các phụ thuộc của chúng.
</Note>

Siêu dữ liệu gói đóng kèm là tường minh, không được suy luận từ JavaScript đã build khi gateway khởi động. Các phụ thuộc runtime thuộc về gói Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc phản chiếu phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Tệp kê khai Plugin](/vi/plugins/manifest) — tài liệu tham khảo đầy đủ về schema tệp kê khai
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
