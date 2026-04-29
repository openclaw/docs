---
read_when:
    - Bạn đang thêm trình hướng dẫn thiết lập vào một Plugin
    - Bạn cần hiểu setup-entry.ts so với index.ts
    - Bạn đang định nghĩa các lược đồ cấu hình Plugin hoặc siêu dữ liệu openclaw trong package.json
sidebarTitle: Setup and config
summary: Các trình hướng dẫn thiết lập, setup-entry.ts, các lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-04-29T23:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92f470a5c7e8fe06b9244a737de80c0509b26aa983d05e60dd1689cc628fc90d
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tài liệu tham khảo cho đóng gói Plugin (siêu dữ liệu `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn thực hành trình bày đóng gói trong ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

`package.json` của bạn cần một trường `openclaw` cho hệ thống Plugin biết Plugin của bạn cung cấp gì:

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
  Điểm vào nhẹ chỉ dành cho thiết lập (tùy chọn).
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các bề mặt thiết lập, bộ chọn, khởi động nhanh và trạng thái.
</ParamField>
<ParamField path="providers" type="string[]">
  ID nhà cung cấp do Plugin này đăng ký.
</ParamField>
<ParamField path="install" type="object">
  Gợi ý cài đặt: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Cờ hành vi khởi động.
</ParamField>

### `openclaw.channel`

`openclaw.channel` là siêu dữ liệu gói nhẹ cho việc khám phá kênh và các bề mặt thiết lập trước khi runtime tải.

| Trường                                 | Kiểu      | Ý nghĩa                                                                        |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`  | ID kênh chuẩn.                                                                |
| `label`                                | `string`  | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`  | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`  | Nhãn chi tiết phụ cho danh mục kênh phong phú hơn và các bề mặt trạng thái.   |
| `docsPath`                             | `string`  | Đường dẫn tài liệu cho các liên kết thiết lập và lựa chọn.                    |
| `docsLabel`                            | `string`  | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với ID kênh.              |
| `blurb`                                | `string`  | Mô tả ngắn cho onboarding/danh mục.                                           |
| `order`                                | `number`  | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho lựa chọn kênh.                                    |
| `preferOver`                           | `string[]` | ID Plugin/kênh có mức ưu tiên thấp hơn mà kênh này nên xếp trên.              |
| `systemImage`                          | `string`  | Tên biểu tượng/system-image tùy chọn cho danh mục giao diện kênh.             |
| `selectionDocsPrefix`                  | `string`  | Văn bản tiền tố trước liên kết tài liệu trong các bề mặt lựa chọn.            |
| `selectionDocsOmitLabel`               | `boolean` | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong nội dung lựa chọn. |
| `selectionExtras`                      | `string[]` | Các chuỗi ngắn bổ sung được nối vào nội dung lựa chọn.                        |
| `markdownCapable`                      | `boolean` | Đánh dấu kênh là có khả năng dùng markdown cho quyết định định dạng gửi ra.   |
| `exposure`                             | `object`  | Điều khiển khả năng hiển thị của kênh cho các bề mặt thiết lập, danh sách đã cấu hình và tài liệu. |
| `quickstartAllowFrom`                  | `boolean` | Đưa kênh này vào luồng thiết lập `allowFrom` khởi động nhanh chuẩn.           |
| `forceAccountBinding`                  | `boolean` | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản.      |
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
- `docs`: đánh dấu kênh là hướng tới công khai trong các bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh kế thừa. Ưu tiên dùng `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu manifest.

| Trường                       | Kiểu                 | Ý nghĩa                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Đặc tả npm chuẩn cho các luồng cài đặt/cập nhật.                                |
| `localPath`                  | `string`             | Đường dẫn phát triển cục bộ hoặc cài đặt đi kèm.                                |
| `defaultChoice`              | `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi cả hai đều khả dụng.                                  |
| `minHostVersion`             | `string`             | Phiên bản OpenClaw tối thiểu được hỗ trợ ở dạng `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Chuỗi toàn vẹn dist npm mong đợi, thường là `sha512-...`, cho các bản cài đặt được ghim. |
| `allowInvalidConfigRecovery` | `boolean`            | Cho phép luồng cài đặt lại Plugin đi kèm khôi phục từ các lỗi cấu hình cũ cụ thể. |

<AccordionGroup>
  <Accordion title="Hành vi onboarding">
    Onboarding tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu Plugin của bạn hiển thị lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi runtime tải, onboarding có thể hiển thị lựa chọn đó, nhắc chọn cài đặt npm hay cục bộ, cài đặt hoặc bật Plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn onboarding bằng npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` trong registry; phiên bản chính xác và `expectedIntegrity` là các ghim tùy chọn. Nếu có `expectedIntegrity`, các luồng cài đặt/cập nhật sẽ thực thi nó. Giữ siêu dữ liệu "hiển thị gì" trong `openclaw.plugin.json` và siêu dữ liệu "cách cài đặt nó" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu `minHostVersion` được đặt, cả quá trình cài đặt và tải manifest-registry đều thực thi nó. Máy chủ cũ hơn sẽ bỏ qua Plugin; chuỗi phiên bản không hợp lệ bị từ chối.
  </Accordion>
  <Accordion title="Cài đặt npm được ghim">
    Với cài đặt npm được ghim, hãy giữ phiên bản chính xác trong `npmSpec` và thêm tính toàn vẹn artifact mong đợi:

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
    `allowInvalidConfigRecovery` không phải là cơ chế bỏ qua chung cho cấu hình hỏng. Nó chỉ dành cho khôi phục Plugin đi kèm trong phạm vi hẹp, để cài đặt lại/thiết lập có thể sửa các phần sót lại sau nâng cấp đã biết như thiếu đường dẫn Plugin đi kèm hoặc mục `channels.<id>` cũ cho cùng Plugin đó. Nếu cấu hình bị hỏng vì lý do không liên quan, cài đặt vẫn thất bại đóng và yêu cầu người vận hành chạy `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Hoãn tải đầy đủ

Plugin kênh có thể chọn tải hoãn với:

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

Khi bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã được cấu hình. Điểm vào đầy đủ sẽ tải sau khi Gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải hoãn khi `setupEntry` của bạn đăng ký mọi thứ Gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, route HTTP, phương thức Gateway). Nếu điểm vào đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu điểm vào thiết lập/đầy đủ của bạn đăng ký phương thức RPC Gateway, hãy giữ chúng dưới một tiền tố dành riêng cho Plugin. Các namespace quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu của lõi và luôn phân giải thành `operator.admin`.

## Manifest Plugin

Mọi Plugin native phải cung cấp một `openclaw.plugin.json` ở gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã Plugin.

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

Ngay cả Plugin không có cấu hình cũng phải cung cấp schema. Schema trống là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [Manifest Plugin](/vi/plugins/manifest) để biết tài liệu tham khảo schema đầy đủ.

## Phát hành ClawHub

Với các gói Plugin, hãy dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Bí danh phát hành kế thừa chỉ dành cho Skills. Các gói Plugin luôn nên dùng `clawhub package publish`.
</Note>

## Điểm vào thiết lập

Tệp `setup-entry.ts` là lựa chọn thay thế nhẹ cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa chữa cấu hình, kiểm tra kênh bị tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện mật mã, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh workspace được đóng gói giữ export an toàn cho thiết lập trong các mô-đun sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay vì `defineSetupPluginEntry(...)`. Contract được đóng gói đó cũng hỗ trợ export `runtime` tùy chọn để phần nối dây runtime lúc thiết lập có thể vẫn nhẹ và rõ ràng.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay vì entry đầy đủ">
    - Kênh bị tắt nhưng cần bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa cấu hình.
    - Đã bật tải trì hoãn (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry phải đăng ký gì">
    - Đối tượng Plugin kênh (qua `defineSetupPluginEntry`).
    - Mọi tuyến HTTP cần thiết trước khi gateway lắng nghe.
    - Mọi phương thức gateway cần trong quá trình khởi động.

    Các phương thức gateway lúc khởi động đó vẫn nên tránh các namespace quản trị lõi được dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="setupEntry KHÔNG nên bao gồm gì">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (mật mã, SDK).
    - Phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, hãy ưu tiên các seam helper thiết lập hẹp thay vì umbrella `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                   | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime lúc thiết lập vẫn có sẵn trong `setupEntry` / khởi động kênh trì hoãn      | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter thiết lập tài khoản nhận biết môi trường                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper thiết lập/cài đặt CLI/lưu trữ/tài liệu                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Dùng seam `plugin-sdk/setup` rộng hơn khi bạn muốn toàn bộ bộ công cụ thiết lập dùng chung, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Các adapter vá thiết lập vẫn an toàn cho đường dẫn nóng khi import. Phần tra cứu bề mặt contract thăng hạng một tài khoản được đóng gói của chúng là lazy, nên việc import `plugin-sdk/setup-runtime` không tải ngay phần khám phá bề mặt contract được đóng gói trước khi adapter thực sự được dùng.

### Thăng hạng một tài khoản do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất một tài khoản sang `channels.<id>.accounts.*`, hành vi dùng chung mặc định là chuyển các giá trị theo phạm vi tài khoản được thăng hạng vào `accounts.default`.

Các kênh được đóng gói có thể thu hẹp hoặc ghi đè việc thăng hạng đó thông qua bề mặt contract thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung nên được chuyển vào tài khoản được thăng hạng
- `namedAccountPromotionKeys`: khi tài khoản có tên đã tồn tại, chỉ các khóa này được chuyển vào tài khoản được thăng hạng; các khóa chính sách/phân phối dùng chung vẫn ở gốc kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào nhận các giá trị được thăng hạng

<Note>
Matrix là ví dụ được đóng gói hiện tại. Nếu đúng một tài khoản Matrix có tên đã tồn tại, hoặc nếu `defaultAccount` trỏ tới một khóa không chuẩn hiện có như `Ops`, việc thăng hạng giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực theo JSON Schema trong manifest của bạn. Người dùng cấu hình Plugin qua:

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

Đối với Plugin bên thứ ba, contract đường dẫn lạnh vẫn là manifest Plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập và các bề mặt UI có thể kiểm tra `channels.<id>` mà không cần tải mã runtime.

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` và nhiều phần khác. Xem các gói Plugin được đóng gói (ví dụ Plugin Discord `src/channel.setup.ts`) để có ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Prompt allowFrom dùng chung">
    Đối với các prompt danh sách cho phép DM chỉ cần luồng chuẩn `note -> prompt -> parse -> merge -> patch`, hãy ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau ở nhãn, điểm số và các dòng bổ sung tùy chọn, hãy ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự viết cùng đối tượng `status` trong từng Plugin.
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

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ fail closed đối với các thao tác ghi cấu hình thật. Chúng tái sử dụng một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig` và `finalize`, đồng thời nối thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Helper thiết lập dựa trên binary">
    Đối với UI thiết lập dựa trên binary, hãy ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần nối binary/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau ở nhãn, gợi ý, điểm số và phát hiện binary
    - `createCliPathTextInput(...)` cho input văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lazy tới một trình hướng dẫn đầy đủ nặng hơn
    - `createDelegatedTextInputShouldPrompt(...)` khi `setupEntry` chỉ cần ủy quyền quyết định `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Xuất bản và cài đặt

**Plugin bên ngoài:** xuất bản lên [ClawHub](/vi/tools/clawhub), rồi cài đặt:

<Tabs>
  <Tab title="Tự động (ClawHub rồi npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw thử ClawHub trước và tự động fallback sang npm.

  </Tab>
  <Tab title="Chỉ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spec gói npm">
    Dùng npm khi một gói chưa chuyển sang ClawHub, hoặc khi bạn cần một
    đường dẫn cài đặt npm trực tiếp trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong repo:** đặt dưới cây workspace Plugin được đóng gói và chúng sẽ tự động được phát hiện trong quá trình build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các bản cài đặt lấy từ npm, `openclaw plugins install` chạy `npm install --ignore-scripts` cục bộ theo dự án (không có script lifecycle), bỏ qua các thiết lập cài đặt npm toàn cục được kế thừa. Hãy giữ cây phụ thuộc Plugin thuần JS/TS và tránh các gói yêu cầu build `postinstall`.
</Info>

<Note>
Plugin đi kèm do OpenClaw sở hữu là ngoại lệ sửa chữa khi khởi động duy nhất: khi một bản cài đặt đóng gói thấy một Plugin được bật bởi cấu hình Plugin, cấu hình kênh cũ, hoặc manifest đi kèm được bật mặc định của Plugin đó, quá trình khởi động sẽ cài đặt các phụ thuộc thời gian chạy còn thiếu của Plugin đó trước khi nhập. Plugin bên thứ ba không nên dựa vào cài đặt khi khởi động; hãy tiếp tục dùng trình cài đặt Plugin tường minh.
</Note>

Các phụ thuộc thời gian chạy cấp gói đi kèm là siêu dữ liệu tường minh, không được suy ra từ JavaScript đã build khi Gateway khởi động. Nếu một phụ thuộc gốc dùng chung của OpenClaw phải khả dụng bên trong bản sao môi trường chạy Plugin đi kèm bên ngoài, hãy khai báo phụ thuộc đó trong `openclaw.bundle.mirroredRootRuntimeDependencies` trong manifest gói gốc.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Manifest Plugin](/vi/plugins/manifest) — tham chiếu đầy đủ về schema manifest
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
