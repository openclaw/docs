---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một Plugin
    - Bạn cần hiểu sự khác biệt giữa setup-entry.ts và index.ts
    - Bạn đang định nghĩa các schema cấu hình Plugin hoặc siêu dữ liệu openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-05-10T19:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tài liệu tham chiếu cho đóng gói Plugin (metadata `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn muốn xem hướng dẫn từng bước?** Các hướng dẫn cách làm trình bày việc đóng gói trong ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata gói

`package.json` của bạn cần có trường `openclaw` cho hệ thống Plugin biết Plugin của bạn cung cấp những gì:

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
Nếu bạn phát hành Plugin bên ngoài trên ClawHub, các trường `compat` và `build` đó là bắt buộc. Các đoạn mã phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Các tệp điểm vào (tương đối với gốc gói).
</ParamField>
<ParamField path="setupEntry" type="string">
  Điểm vào gọn nhẹ chỉ dùng cho thiết lập (tùy chọn).
</ParamField>
<ParamField path="channel" type="object">
  Metadata danh mục kênh cho các bề mặt thiết lập, bộ chọn, khởi động nhanh và trạng thái.
</ParamField>
<ParamField path="providers" type="string[]">
  Các id nhà cung cấp được Plugin này đăng ký.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Các cờ hành vi khởi động.
</ParamField>

### `openclaw.channel`

`openclaw.channel` là metadata gói nhẹ cho việc khám phá kênh và các bề mặt thiết lập trước khi runtime tải.

| Trường                                 | Kiểu      | Ý nghĩa                                                                       |
| -------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`  | Id kênh chuẩn.                                                               |
| `label`                                | `string`  | Nhãn kênh chính.                                                             |
| `selectionLabel`                       | `string`  | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`  | Nhãn chi tiết phụ cho danh mục kênh phong phú hơn và các bề mặt trạng thái.  |
| `docsPath`                             | `string`  | Đường dẫn tài liệu cho các liên kết thiết lập và lựa chọn.                    |
| `docsLabel`                            | `string`  | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với id kênh.              |
| `blurb`                                | `string`  | Mô tả ngắn cho onboarding/danh mục.                                           |
| `order`                                | `number`  | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho lựa chọn kênh.                                    |
| `preferOver`                           | `string[]` | Các id Plugin/kênh có độ ưu tiên thấp hơn mà kênh này nên xếp trên.          |
| `systemImage`                          | `string`  | Tên biểu tượng/system-image tùy chọn cho danh mục UI kênh.                   |
| `selectionDocsPrefix`                  | `string`  | Văn bản tiền tố trước liên kết tài liệu trong các bề mặt lựa chọn.            |
| `selectionDocsOmitLabel`               | `boolean` | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong bản sao lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được nối thêm trong bản sao lựa chọn.                 |
| `markdownCapable`                      | `boolean` | Đánh dấu kênh là hỗ trợ markdown cho các quyết định định dạng gửi đi.        |
| `exposure`                             | `object`  | Điều khiển hiển thị kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean` | Đưa kênh này vào luồng thiết lập khởi động nhanh `allowFrom` tiêu chuẩn.     |
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
- `setup`: đưa kênh vào các bộ chọn thiết lập/cấu hình tương tác
- `docs`: đánh dấu kênh là công khai trong các bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh cũ. Ưu tiên dùng `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là metadata gói, không phải metadata manifest.

| Trường                       | Kiểu                                | Ý nghĩa                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spec ClawHub chuẩn cho các luồng cài đặt/cập nhật và cài đặt theo nhu cầu trong onboarding. |
| `npmSpec`                    | `string`                            | Spec npm chuẩn cho các luồng dự phòng cài đặt/cập nhật.                           |
| `localPath`                  | `string`                            | Đường dẫn cài đặt cục bộ cho phát triển hoặc gói đi kèm.                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi có nhiều nguồn khả dụng.                                 |
| `minHostVersion`             | `string`                            | Phiên bản OpenClaw tối thiểu được hỗ trợ ở dạng `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chuỗi integrity dist npm kỳ vọng, thường là `sha512-...`, cho các cài đặt đã ghim. |
| `allowInvalidConfigRecovery` | `boolean`                           | Cho phép các luồng cài đặt lại Plugin đi kèm khôi phục từ những lỗi cấu hình lỗi thời cụ thể. |

<AccordionGroup>
  <Accordion title="Hành vi onboarding">
    Onboarding tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu Plugin của bạn hiển thị lựa chọn xác thực nhà cung cấp hoặc metadata thiết lập/danh mục kênh trước khi runtime tải, onboarding có thể hiển thị lựa chọn đó, nhắc cài đặt qua ClawHub, npm hoặc cục bộ, cài đặt hoặc bật Plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn onboarding ClawHub dùng `clawhubSpec` và được ưu tiên khi có; lựa chọn npm yêu cầu metadata danh mục đáng tin cậy với `npmSpec` registry; phiên bản chính xác và `expectedIntegrity` là các ghim npm tùy chọn. Nếu có `expectedIntegrity`, các luồng cài đặt/cập nhật sẽ thực thi nó cho npm. Giữ metadata "hiển thị gì" trong `openclaw.plugin.json` và metadata "cách cài đặt" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu `minHostVersion` được đặt, cả quá trình cài đặt và tải manifest-registry không đi kèm đều thực thi nó. Host cũ hơn sẽ bỏ qua Plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Plugin nguồn đi kèm được giả định là cùng phiên bản với checkout host.
  </Accordion>
  <Accordion title="Cài đặt npm đã ghim">
    Với cài đặt npm đã ghim, giữ phiên bản chính xác trong `npmSpec` và thêm integrity artifact kỳ vọng:

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
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua tổng quát cho cấu hình hỏng. Nó chỉ dành cho khôi phục hẹp của Plugin đi kèm, để cài đặt lại/thiết lập có thể sửa các phần còn sót lại sau nâng cấp đã biết như thiếu đường dẫn Plugin đi kèm hoặc mục `channels.<id>` lỗi thời cho cùng Plugin đó. Nếu cấu hình bị hỏng vì lý do không liên quan, cài đặt vẫn thất bại đóng và yêu cầu operator chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Trì hoãn tải đầy đủ

Plugin kênh có thể chọn tải trì hoãn với:

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

Khi được bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã được cấu hình. Điểm vào đầy đủ sẽ tải sau khi Gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ Gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, tuyến HTTP, phương thức Gateway). Nếu điểm vào đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu điểm vào thiết lập/đầy đủ của bạn đăng ký các phương thức RPC Gateway, hãy đặt chúng dưới tiền tố dành riêng cho Plugin. Các namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu của lõi và luôn phân giải thành `operator.admin`.

## Manifest Plugin

Mọi Plugin native phải cung cấp `openclaw.plugin.json` trong gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã Plugin.

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

Với Plugin kênh, hãy thêm `kind` và `channels`:

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

Ngay cả Plugin không có cấu hình cũng phải cung cấp schema. Schema rỗng là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [Manifest Plugin](/vi/plugins/manifest) để biết tài liệu tham chiếu schema đầy đủ.

## Phát hành ClawHub

Với các gói Plugin, dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Bí danh phát hành cũ chỉ dành cho skill là dành cho skills. Các gói Plugin luôn nên dùng `clawhub package publish`.
</Note>

## Mục nhập thiết lập

Tệp `setup-entry.ts` là một lựa chọn thay thế nhẹ cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa cấu hình, kiểm tra kênh bị tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện mã hóa, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh workspace được đóng gói giữ các export an toàn cho thiết lập trong module phụ có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay cho `defineSetupPluginEntry(...)`. Hợp đồng được đóng gói đó cũng hỗ trợ export `runtime` tùy chọn để wiring runtime lúc thiết lập có thể luôn nhẹ và rõ ràng.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Kênh bị tắt nhưng cần các bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa cấu hình.
    - Tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Đối tượng Plugin kênh (qua `defineSetupPluginEntry`).
    - Mọi route HTTP cần thiết trước khi gateway listen.
    - Mọi phương thức Gateway cần trong lúc khởi động.

    Các phương thức Gateway lúc khởi động đó vẫn nên tránh các namespace quản trị lõi dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (crypto, SDK).
    - Phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, ưu tiên các seam helper thiết lập hẹp thay vì umbrella `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                  | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime lúc thiết lập vẫn có trong `setupEntry` / khởi động kênh trì hoãn          | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | bí danh tương thích đã lỗi thời; dùng `plugin-sdk/setup-runtime`                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/cài đặt/lưu trữ/tài liệu cho thiết lập                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Dùng seam `plugin-sdk/setup` rộng hơn khi bạn muốn toàn bộ hộp công cụ thiết lập dùng chung, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Các adapter vá thiết lập vẫn an toàn trên đường dẫn nóng khi import. Tra cứu bề mặt hợp đồng thăng cấp một tài khoản được đóng gói của chúng là lazy, nên việc import `plugin-sdk/setup-runtime` không tải háo hức việc khám phá bề mặt hợp đồng được đóng gói trước khi adapter thật sự được dùng.

### Thăng cấp một tài khoản do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định là di chuyển các giá trị phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh được đóng gói có thể thu hẹp hoặc ghi đè việc thăng cấp đó qua bề mặt hợp đồng thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung nên được di chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi các tài khoản có tên đã tồn tại, chỉ các khóa này được di chuyển vào tài khoản được thăng cấp; các khóa chính sách/phân phối dùng chung vẫn ở gốc kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ được đóng gói hiện tại. Nếu đúng một tài khoản Matrix có tên đã tồn tại, hoặc nếu `defaultAccount` trỏ tới một khóa không chuẩn hiện có như `Ops`, việc thăng cấp giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực với JSON Schema trong manifest của bạn. Người dùng cấu hình plugin qua:

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

Đối với plugin bên thứ ba, hợp đồng đường dẫn lạnh vẫn là manifest plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập và các bề mặt UI có thể kiểm tra `channels.<id>` mà không cần tải mã runtime.

## Trình hướng dẫn thiết lập

Plugin kênh có thể cung cấp trình hướng dẫn thiết lập tương tác cho `openclaw onboard`. Trình hướng dẫn là đối tượng `ChannelSetupWizard` trên `ChannelPlugin`:

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` và nhiều hơn nữa. Xem các gói plugin được đóng gói (ví dụ Plugin Discord `src/channel.setup.ts`) để có ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Đối với lời nhắc danh sách cho phép DM chỉ cần luồng chuẩn `note -> prompt -> parse -> merge -> patch`, ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau theo nhãn, điểm số và các dòng bổ sung tùy chọn, ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự viết cùng đối tượng `status` trong từng plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
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

    `plugin-sdk/channel-setup` cũng cung cấp các builder cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ fail closed trên các thao tác ghi cấu hình thật. Chúng tái sử dụng một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig` và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Đối với UI thiết lập dựa trên binary, ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần glue binary/trạng thái vào từng kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau theo nhãn, gợi ý, điểm số và phát hiện binary
    - `createCliPathTextInput(...)` cho input văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lazy tới một trình hướng dẫn đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Phát hành và cài đặt

**Plugin bên ngoài:** phát hành lên [ClawHub](/vi/clawhub), rồi cài đặt:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Các package spec trần cài đặt từ npm trong giai đoạn chuyển đổi ra mắt.

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

**Plugin trong repo:** đặt dưới cây workspace Plugin đi kèm và chúng sẽ tự động được phát hiện trong quá trình build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các lượt cài đặt từ nguồn npm, `openclaw plugins install` cài đặt package dưới `~/.openclaw/npm` với các script vòng đời bị tắt. Hãy giữ cây phụ thuộc của Plugin thuần JS/TS và tránh các package yêu cầu build bằng `postinstall`.
</Info>

<Note>
Quá trình khởi động Gateway không cài đặt phụ thuộc của Plugin. Các luồng cài đặt npm/git/ClawHub chịu trách nhiệm đảm bảo phụ thuộc nhất quán; Plugin cục bộ phải được cài đặt sẵn các phụ thuộc của chúng.
</Note>

Siêu dữ liệu package đi kèm là tường minh, không được suy luận từ JavaScript đã build khi Gateway khởi động. Các phụ thuộc runtime thuộc về package Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc phản chiếu các phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Manifest Plugin](/vi/plugins/manifest) — tài liệu tham khảo đầy đủ về schema manifest
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
