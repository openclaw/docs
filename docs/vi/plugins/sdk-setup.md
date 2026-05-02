---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một Plugin
    - Bạn cần hiểu setup-entry.ts so với index.ts
    - Bạn đang định nghĩa các schema cấu hình Plugin hoặc metadata openclaw trong package.json
sidebarTitle: Setup and config
summary: Các trình hướng dẫn thiết lập, setup-entry.ts, các lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-05-02T20:57:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tài liệu tham khảo về đóng gói plugin (siêu dữ liệu `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và lược đồ cấu hình.

<Tip>
**Đang tìm hướng dẫn từng bước?** Các hướng dẫn cách làm trình bày việc đóng gói theo ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

`package.json` của bạn cần một trường `openclaw` cho hệ thống plugin biết plugin của bạn cung cấp những gì:

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
Nếu bạn phát hành plugin ra bên ngoài trên ClawHub, các trường `compat` và `build` đó là bắt buộc. Các đoạn mã phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Tệp điểm vào (tương đối với gốc gói).
</ParamField>
<ParamField path="setupEntry" type="string">
  Điểm vào nhẹ chỉ dành cho thiết lập (không bắt buộc).
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các bề mặt thiết lập, bộ chọn, khởi động nhanh và trạng thái.
</ParamField>
<ParamField path="providers" type="string[]">
  ID nhà cung cấp được plugin này đăng ký.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Cờ hành vi khởi động.
</ParamField>

### `openclaw.channel`

`openclaw.channel` là siêu dữ liệu gói nhẹ dành cho phát hiện kênh và các bề mặt thiết lập trước khi runtime tải.

| Trường                                 | Loại       | Ý nghĩa                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID kênh chuẩn.                                                                |
| `label`                                | `string`   | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`   | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`   | Nhãn chi tiết phụ cho danh mục kênh phong phú hơn và các bề mặt trạng thái.   |
| `docsPath`                             | `string`   | Đường dẫn tài liệu cho liên kết thiết lập và lựa chọn.                        |
| `docsLabel`                            | `string`   | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với ID kênh.              |
| `blurb`                                | `string`   | Mô tả ngắn cho onboarding/danh mục.                                           |
| `order`                                | `number`   | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho việc chọn kênh.                                   |
| `preferOver`                           | `string[]` | ID plugin/kênh có độ ưu tiên thấp hơn mà kênh này nên xếp trên.               |
| `systemImage`                          | `string`   | Tên biểu tượng/system-image tùy chọn cho danh mục giao diện kênh.             |
| `selectionDocsPrefix`                  | `string`   | Văn bản tiền tố trước liên kết tài liệu trong các bề mặt lựa chọn.            |
| `selectionDocsOmitLabel`               | `boolean`  | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong nội dung lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được nối thêm trong nội dung lựa chọn.                 |
| `markdownCapable`                      | `boolean`  | Đánh dấu kênh là hỗ trợ markdown cho các quyết định định dạng gửi đi.         |
| `exposure`                             | `object`   | Điều khiển khả năng hiển thị kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean`  | Cho phép kênh này tham gia luồng thiết lập khởi động nhanh `allowFrom` chuẩn. |
| `forceAccountBinding`                  | `boolean`  | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ có một tài khoản tồn tại.  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo cho kênh này.          |

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
- `docs`: đánh dấu kênh là công khai trong các bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh kế thừa. Ưu tiên dùng `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu manifest.

| Trường                       | Loại                                | Ý nghĩa                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Đặc tả ClawHub chuẩn cho luồng cài đặt/cập nhật và cài đặt theo nhu cầu khi onboarding. |
| `npmSpec`                    | `string`                            | Đặc tả npm chuẩn cho luồng dự phòng cài đặt/cập nhật.                             |
| `localPath`                  | `string`                            | Đường dẫn phát triển cục bộ hoặc cài đặt đi kèm.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn khả dụng.                                |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw được hỗ trợ tối thiểu ở dạng `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chuỗi toàn vẹn npm dist dự kiến, thường là `sha512-...`, cho cài đặt được ghim.   |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép luồng cài đặt lại plugin đi kèm khôi phục từ các lỗi cấu hình cũ cụ thể. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Onboarding tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu plugin của bạn hiển thị lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi runtime tải, onboarding có thể hiển thị lựa chọn đó, nhắc cài đặt bằng ClawHub, npm hoặc cục bộ, cài đặt hoặc bật plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn onboarding ClawHub dùng `clawhubSpec` và được ưu tiên khi có; lựa chọn npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` trong registry; phiên bản chính xác và `expectedIntegrity` là các ghim npm tùy chọn. Nếu có `expectedIntegrity`, luồng cài đặt/cập nhật sẽ thực thi nó cho npm. Giữ siêu dữ liệu "hiển thị gì" trong `openclaw.plugin.json` và siêu dữ liệu "cài đặt như thế nào" trong `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Nếu đặt `minHostVersion`, cả cài đặt và quá trình tải manifest-registry không đi kèm đều thực thi nó. Host cũ hơn bỏ qua plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Plugin nguồn đi kèm được giả định là đồng phiên bản với checkout của host.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Với cài đặt npm được ghim, giữ phiên bản chính xác trong `npmSpec` và thêm tính toàn vẹn artifact dự kiến:

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
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua chung cho cấu hình hỏng. Nó chỉ dành cho khôi phục plugin đi kèm trong phạm vi hẹp, để cài đặt lại/thiết lập có thể sửa các phần còn sót lại sau nâng cấp đã biết, như thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` cũ cho chính plugin đó. Nếu cấu hình hỏng vì lý do không liên quan, quá trình cài đặt vẫn thất bại đóng và yêu cầu người vận hành chạy `openclaw doctor --fix`.
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

Khi bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã được cấu hình. Điểm vào đầy đủ sẽ tải sau khi gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, tuyến HTTP, phương thức gateway). Nếu điểm vào đầy đủ sở hữu các năng lực khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu mục thiết lập/đầy đủ của bạn đăng ký phương thức RPC gateway, hãy giữ chúng dưới tiền tố dành riêng cho plugin. Các namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu của lõi và luôn phân giải thành `operator.admin`.

## Manifest plugin

Mọi plugin gốc phải cung cấp một `openclaw.plugin.json` ở gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã plugin.

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

Đối với plugin kênh, thêm `kind` và `channels`:

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

Xem [Manifest plugin](/vi/plugins/manifest) để biết tham chiếu lược đồ đầy đủ.

## Phát hành ClawHub

Đối với các gói plugin, hãy dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Bí danh xuất bản cũ chỉ dành cho skill là dành cho skills. Các gói Plugin phải luôn dùng `clawhub package publish`.
</Note>

## Mục nhập thiết lập

Tệp `setup-entry.ts` là một phương án thay thế nhẹ cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa cấu hình, kiểm tra kênh bị tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện mã hóa, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh workspace được đóng gói giữ các export an toàn cho thiết lập trong module phụ có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay vì `defineSetupPluginEntry(...)`. Hợp đồng đóng gói đó cũng hỗ trợ export `runtime` tùy chọn để phần nối dây runtime lúc thiết lập có thể luôn nhẹ và tường minh.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay vì mục nhập đầy đủ">
    - Kênh bị tắt nhưng cần các bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa được cấu hình.
    - Tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry phải đăng ký những gì">
    - Đối tượng Plugin kênh (thông qua `defineSetupPluginEntry`).
    - Mọi tuyến HTTP cần thiết trước khi gateway listen.
    - Mọi phương thức gateway cần trong quá trình khởi động.

    Những phương thức gateway lúc khởi động đó vẫn nên tránh các không gian tên quản trị lõi dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="setupEntry KHÔNG nên bao gồm những gì">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (mã hóa, SDK).
    - Phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, ưu tiên các seam helper thiết lập hẹp thay vì umbrella `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                  | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime lúc thiết lập vẫn có sẵn trong `setupEntry` / khởi động kênh trì hoãn      | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter thiết lập tài khoản nhận biết môi trường                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/kho lưu trữ/tài liệu cho thiết lập/cài đặt                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Dùng seam `plugin-sdk/setup` rộng hơn khi bạn muốn toàn bộ bộ công cụ thiết lập dùng chung, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Các adapter vá thiết lập vẫn an toàn cho đường dẫn nóng khi import. Phần tra cứu bề mặt hợp đồng thăng cấp tài khoản đơn được đóng gói của chúng là lazy, nên việc import `plugin-sdk/setup-runtime` không tải sớm phần phát hiện bề mặt hợp đồng đóng gói trước khi adapter thật sự được dùng.

### Thăng cấp tài khoản đơn do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất tài khoản đơn lên `channels.<id>.accounts.*`, hành vi dùng chung mặc định là chuyển các giá trị theo phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh được đóng gói có thể thu hẹp hoặc ghi đè việc thăng cấp đó thông qua bề mặt hợp đồng thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung cần chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi tài khoản được đặt tên đã tồn tại, chỉ các khóa này chuyển vào tài khoản được thăng cấp; các khóa chính sách/phân phối dùng chung vẫn ở gốc kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ được đóng gói hiện tại. Nếu đúng một tài khoản Matrix được đặt tên đã tồn tại, hoặc nếu `defaultAccount` trỏ đến một khóa hiện có không chuẩn như `Ops`, việc thăng cấp giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực theo JSON Schema trong manifest của bạn. Người dùng cấu hình plugin qua:

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

Dùng `buildChannelConfigSchema` để chuyển schema Zod thành wrapper `ChannelConfigSchema` được dùng bởi các artifact cấu hình do plugin sở hữu:

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

Nếu bạn đã viết hợp đồng dưới dạng JSON Schema hoặc TypeBox, hãy dùng helper trực tiếp để OpenClaw có thể bỏ qua chuyển đổi Zod sang JSON Schema trên các đường dẫn metadata:

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

Đối với plugin bên thứ ba, hợp đồng đường dẫn lạnh vẫn là manifest plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập và bề mặt UI có thể kiểm tra `channels.<id>` mà không tải mã runtime.

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, và nhiều hơn nữa. Xem các gói plugin được đóng gói (ví dụ Plugin Discord `src/channel.setup.ts`) để có ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Prompt allowFrom dùng chung">
    Đối với prompt danh sách cho phép DM chỉ cần luồng chuẩn `note -> prompt -> parse -> merge -> patch`, ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau theo nhãn, điểm và các dòng bổ sung tùy chọn, ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự viết cùng đối tượng `status` trong từng plugin.
  </Accordion>
  <Accordion title="Bề mặt thiết lập kênh tùy chọn">
    Đối với các bề mặt thiết lập tùy chọn chỉ nên xuất hiện trong một số ngữ cảnh nhất định, dùng `createOptionalChannelSetupSurface` từ `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` cũng phơi bày các builder cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ fail closed trên các lần ghi cấu hình thật. Chúng dùng lại một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig`, và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Helper thiết lập dựa trên binary">
    Đối với UI thiết lập dựa trên binary, ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần nối binary/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau theo nhãn, gợi ý, điểm và phát hiện binary
    - `createCliPathTextInput(...)` cho input văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lazy đến trình hướng dẫn đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Xuất bản và cài đặt

**Plugin bên ngoài:** xuất bản lên [ClawHub](/vi/tools/clawhub), sau đó cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Package spec trần sẽ cài từ npm trong giai đoạn chuyển đổi khởi chạy.

  </Tab>
  <Tab title="Chỉ ClawHub">
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

**Plugin trong repo:** đặt dưới cây workspace Plugin đi kèm và chúng sẽ được tự động phát hiện trong quá trình build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các bản cài đặt có nguồn từ npm, `openclaw plugins install` cài đặt package dưới `~/.openclaw/npm` với các script vòng đời bị tắt. Giữ cây phụ thuộc của Plugin thuần JS/TS và tránh các package yêu cầu build `postinstall`.
</Info>

<Note>
Quá trình khởi động Gateway không cài đặt phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub tự đảm nhiệm việc hội tụ phụ thuộc; Plugin cục bộ phải có sẵn các phụ thuộc đã được cài đặt.
</Note>

Metadata của package đi kèm là tường minh, không được suy luận từ JavaScript đã build khi khởi động Gateway. Phụ thuộc runtime thuộc về package Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc sao chép phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Manifest Plugin](/vi/plugins/manifest) — tham chiếu schema manifest đầy đủ
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
