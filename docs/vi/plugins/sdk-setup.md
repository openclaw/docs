---
read_when:
    - Bạn đang thêm một trình hướng dẫn thiết lập vào một Plugin
    - Cần hiểu sự khác biệt giữa setup-entry.ts và index.ts
    - Bạn đang định nghĩa các schema cấu hình Plugin hoặc metadata openclaw trong package.json
sidebarTitle: Setup and config
summary: Trình hướng dẫn thiết lập, setup-entry.ts, lược đồ cấu hình và siêu dữ liệu package.json
title: Thiết lập và cấu hình Plugin
x-i18n:
    generated_at: "2026-05-02T10:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Tham chiếu cho việc đóng gói plugin (siêu dữ liệu `package.json`), manifest (`openclaw.plugin.json`), mục thiết lập và schema cấu hình.

<Tip>
**Bạn đang tìm hướng dẫn từng bước?** Các hướng dẫn cách làm trình bày việc đóng gói theo ngữ cảnh: [Plugin kênh](/vi/plugins/sdk-channel-plugins#step-1-package-and-manifest) và [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Siêu dữ liệu gói

`package.json` của bạn cần có trường `openclaw` cho hệ thống plugin biết plugin của bạn cung cấp gì:

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
Nếu bạn phát hành plugin ra bên ngoài trên ClawHub, các trường `compat` và `build` đó là bắt buộc. Các đoạn lệnh phát hành chuẩn nằm trong `docs/snippets/plugin-publish/`.
</Note>

### Các trường `openclaw`

<ParamField path="extensions" type="string[]">
  Các tệp điểm vào (tương đối với gốc gói).
</ParamField>
<ParamField path="setupEntry" type="string">
  Điểm vào nhẹ chỉ dùng cho thiết lập (không bắt buộc).
</ParamField>
<ParamField path="channel" type="object">
  Siêu dữ liệu danh mục kênh cho các bề mặt thiết lập, bộ chọn, quickstart và trạng thái.
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

`openclaw.channel` là siêu dữ liệu gói nhẹ cho việc khám phá kênh và các bề mặt thiết lập trước khi runtime tải.

| Trường                                 | Kiểu      | Ý nghĩa                                                                       |
| -------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`  | ID kênh chuẩn.                                                                |
| `label`                                | `string`  | Nhãn kênh chính.                                                              |
| `selectionLabel`                       | `string`  | Nhãn bộ chọn/thiết lập khi cần khác với `label`.                              |
| `detailLabel`                          | `string`  | Nhãn chi tiết phụ cho danh mục kênh phong phú hơn và các bề mặt trạng thái.   |
| `docsPath`                             | `string`  | Đường dẫn tài liệu cho liên kết thiết lập và chọn.                            |
| `docsLabel`                            | `string`  | Ghi đè nhãn dùng cho liên kết tài liệu khi cần khác với ID kênh.              |
| `blurb`                                | `string`  | Mô tả ngắn cho onboarding/danh mục.                                           |
| `order`                                | `number`  | Thứ tự sắp xếp trong danh mục kênh.                                           |
| `aliases`                              | `string[]` | Bí danh tra cứu bổ sung cho lựa chọn kênh.                                    |
| `preferOver`                           | `string[]` | ID plugin/kênh có mức ưu tiên thấp hơn mà kênh này nên xếp trên.              |
| `systemImage`                          | `string`  | Tên biểu tượng/system-image tùy chọn cho danh mục giao diện kênh.             |
| `selectionDocsPrefix`                  | `string`  | Văn bản tiền tố trước liên kết tài liệu trong các bề mặt lựa chọn.            |
| `selectionDocsOmitLabel`               | `boolean` | Hiển thị trực tiếp đường dẫn tài liệu thay vì liên kết tài liệu có nhãn trong bản sao lựa chọn. |
| `selectionExtras`                      | `string[]` | Chuỗi ngắn bổ sung được thêm vào bản sao lựa chọn.                            |
| `markdownCapable`                      | `boolean` | Đánh dấu kênh là hỗ trợ markdown cho các quyết định định dạng gửi đi.         |
| `exposure`                             | `object`  | Điều khiển khả năng hiển thị kênh cho thiết lập, danh sách đã cấu hình và bề mặt tài liệu. |
| `quickstartAllowFrom`                  | `boolean` | Đưa kênh này vào luồng thiết lập quickstart `allowFrom` tiêu chuẩn.           |
| `forceAccountBinding`                  | `boolean` | Yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ có một tài khoản.          |
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
- `docs`: đánh dấu kênh là hướng tới công chúng trong các bề mặt tài liệu/điều hướng

<Note>
`showConfigured` và `showInSetup` vẫn được hỗ trợ dưới dạng bí danh cũ. Nên dùng `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` là siêu dữ liệu gói, không phải siêu dữ liệu manifest.

| Trường                       | Kiểu                 | Ý nghĩa                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Đặc tả npm chuẩn cho các luồng cài đặt/cập nhật.                                 |
| `localPath`                  | `string`             | Đường dẫn phát triển cục bộ hoặc cài đặt đi kèm.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Nguồn cài đặt ưu tiên khi cả hai đều khả dụng.                                   |
| `minHostVersion`             | `string`             | Phiên bản OpenClaw tối thiểu được hỗ trợ theo dạng `>=x.y.z` hoặc `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Chuỗi toàn vẹn npm dist kỳ vọng, thường là `sha512-...`, cho các bản cài đặt ghim. |
| `allowInvalidConfigRecovery` | `boolean`            | Cho phép các luồng cài đặt lại plugin đi kèm khôi phục từ những lỗi cấu hình cũ cụ thể. |

<AccordionGroup>
  <Accordion title="Hành vi onboarding">
    Onboarding tương tác cũng dùng `openclaw.install` cho các bề mặt cài đặt theo nhu cầu. Nếu plugin của bạn hiển thị lựa chọn xác thực nhà cung cấp hoặc siêu dữ liệu thiết lập/danh mục kênh trước khi runtime tải, onboarding có thể hiển thị lựa chọn đó, nhắc chọn cài đặt qua npm hay cục bộ, cài đặt hoặc bật plugin, rồi tiếp tục luồng đã chọn. Các lựa chọn onboarding npm yêu cầu siêu dữ liệu danh mục đáng tin cậy với `npmSpec` trong registry; phiên bản chính xác và `expectedIntegrity` là các ghim tùy chọn. Nếu có `expectedIntegrity`, các luồng cài đặt/cập nhật sẽ thực thi kiểm tra đó. Giữ siêu dữ liệu "cần hiển thị gì" trong `openclaw.plugin.json` và siêu dữ liệu "cách cài đặt" trong `package.json`.
  </Accordion>
  <Accordion title="Thực thi minHostVersion">
    Nếu đặt `minHostVersion`, cả cài đặt và tải manifest-registry không đi kèm đều thực thi trường này. Host cũ hơn bỏ qua plugin bên ngoài; chuỗi phiên bản không hợp lệ bị từ chối. Plugin nguồn đi kèm được giả định là đồng phiên bản với bản checkout host.
  </Accordion>
  <Accordion title="Cài đặt npm được ghim">
    Với các bản cài đặt npm được ghim, giữ phiên bản chính xác trong `npmSpec` và thêm độ toàn vẹn artifact kỳ vọng:

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
    `allowInvalidConfigRecovery` không phải là đường tắt chung cho cấu hình hỏng. Nó chỉ dành cho phục hồi plugin đi kèm trong phạm vi hẹp, để cài đặt lại/thiết lập có thể sửa các phần tồn dư nâng cấp đã biết như thiếu đường dẫn plugin đi kèm hoặc mục `channels.<id>` cũ cho chính plugin đó. Nếu cấu hình hỏng vì lý do không liên quan, cài đặt vẫn đóng khi lỗi và yêu cầu người vận hành chạy `openclaw doctor --fix`.
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

Khi bật, OpenClaw chỉ tải `setupEntry` trong giai đoạn khởi động trước khi lắng nghe, ngay cả với các kênh đã được cấu hình. Điểm vào đầy đủ tải sau khi gateway bắt đầu lắng nghe.

<Warning>
Chỉ bật tải trì hoãn khi `setupEntry` của bạn đăng ký mọi thứ gateway cần trước khi bắt đầu lắng nghe (đăng ký kênh, tuyến HTTP, phương thức gateway). Nếu điểm vào đầy đủ sở hữu các khả năng khởi động bắt buộc, hãy giữ hành vi mặc định.
</Warning>

Nếu mục thiết lập/đầy đủ của bạn đăng ký phương thức RPC gateway, hãy giữ chúng trên tiền tố dành riêng cho plugin. Các namespace quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn thuộc sở hữu lõi và luôn phân giải thành `operator.admin`.

## Manifest plugin

Mọi plugin gốc phải gửi kèm `openclaw.plugin.json` trong gốc gói. OpenClaw dùng tệp này để xác thực cấu hình mà không thực thi mã plugin.

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

Ngay cả plugin không có cấu hình cũng phải gửi kèm một schema. Schema rỗng là hợp lệ:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Xem [Manifest plugin](/vi/plugins/manifest) để biết tham chiếu schema đầy đủ.

## Phát hành ClawHub

Đối với gói plugin, dùng lệnh ClawHub dành riêng cho gói:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Bí danh phát hành cũ chỉ dành cho kỹ năng. Gói plugin phải luôn dùng `clawhub package publish`.
</Note>

## Mục thiết lập

Tệp `setup-entry.ts` là một phương án nhẹ hơn thay cho `index.ts` mà OpenClaw tải khi chỉ cần các bề mặt thiết lập (onboarding, sửa cấu hình, kiểm tra kênh bị tắt).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Điều này tránh tải mã runtime nặng (thư viện crypto, đăng ký CLI, dịch vụ nền) trong các luồng thiết lập.

Các kênh trong workspace đi kèm giữ các export an toàn cho thiết lập trong module sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ `openclaw/plugin-sdk/channel-entry-contract` thay vì `defineSetupPluginEntry(...)`. Hợp đồng đi kèm đó cũng hỗ trợ export `runtime` tùy chọn để phần nối dây runtime lúc thiết lập vẫn nhẹ và rõ ràng.

<AccordionGroup>
  <Accordion title="Khi OpenClaw dùng setupEntry thay vì entry đầy đủ">
    - Kênh bị tắt nhưng cần các bề mặt thiết lập/onboarding.
    - Kênh được bật nhưng chưa cấu hình.
    - Tải trì hoãn được bật (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry phải đăng ký những gì">
    - Đối tượng Plugin kênh (thông qua `defineSetupPluginEntry`).
    - Bất kỳ route HTTP nào cần trước khi Gateway lắng nghe.
    - Bất kỳ phương thức Gateway nào cần trong lúc khởi động.

    Các phương thức Gateway lúc khởi động đó vẫn nên tránh các namespace quản trị lõi dành riêng như `config.*` hoặc `update.*`.

  </Accordion>
  <Accordion title="setupEntry KHÔNG nên bao gồm những gì">
    - Đăng ký CLI.
    - Dịch vụ nền.
    - Import runtime nặng (crypto, SDK).
    - Phương thức Gateway chỉ cần sau khi khởi động.

  </Accordion>
</AccordionGroup>

### Import helper thiết lập hẹp

Đối với các đường dẫn nóng chỉ dành cho thiết lập, ưu tiên các seam helper thiết lập hẹp thay vì ô chung `plugin-sdk/setup` rộng hơn khi bạn chỉ cần một phần của bề mặt thiết lập:

| Đường dẫn import                  | Dùng cho                                                                                  | Export chính                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime lúc thiết lập vẫn khả dụng trong `setupEntry` / khởi động kênh trì hoãn    | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter thiết lập tài khoản nhận biết môi trường                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/lưu trữ/tài liệu cho thiết lập/cài đặt                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Dùng seam `plugin-sdk/setup` rộng hơn khi bạn muốn toàn bộ bộ công cụ thiết lập dùng chung, bao gồm các helper vá cấu hình như `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Các adapter vá thiết lập vẫn an toàn cho hot path khi import. Lookup bề mặt hợp đồng thăng cấp tài khoản đơn đi kèm của chúng là lazy, vì vậy import `plugin-sdk/setup-runtime` sẽ không tải sớm phần khám phá bề mặt hợp đồng đi kèm trước khi adapter thực sự được dùng.

### Thăng cấp tài khoản đơn do kênh sở hữu

Khi một kênh nâng cấp từ cấu hình cấp cao nhất dạng tài khoản đơn lên `channels.<id>.accounts.*`, hành vi dùng chung mặc định là chuyển các giá trị trong phạm vi tài khoản được thăng cấp vào `accounts.default`.

Các kênh đi kèm có thể thu hẹp hoặc ghi đè quá trình thăng cấp đó thông qua bề mặt hợp đồng thiết lập của chúng:

- `singleAccountKeysToMove`: các khóa cấp cao nhất bổ sung nên được chuyển vào tài khoản được thăng cấp
- `namedAccountPromotionKeys`: khi các tài khoản có tên đã tồn tại, chỉ các khóa này được chuyển vào tài khoản được thăng cấp; các khóa chính sách/phân phối dùng chung vẫn ở root của kênh
- `resolveSingleAccountPromotionTarget(...)`: chọn tài khoản hiện có nào nhận các giá trị được thăng cấp

<Note>
Matrix là ví dụ đi kèm hiện tại. Nếu đúng một tài khoản Matrix có tên đã tồn tại, hoặc nếu `defaultAccount` trỏ đến một khóa phi chuẩn hiện có như `Ops`, quá trình thăng cấp giữ nguyên tài khoản đó thay vì tạo mục `accounts.default` mới.
</Note>

## Schema cấu hình

Cấu hình Plugin được xác thực theo JSON Schema trong manifest của bạn. Người dùng cấu hình Plugin thông qua:

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

Plugin của bạn nhận cấu hình này dưới dạng `api.pluginConfig` trong lúc đăng ký.

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

Dùng `buildChannelConfigSchema` để chuyển đổi schema Zod thành wrapper `ChannelConfigSchema` được dùng bởi các artifact cấu hình do Plugin sở hữu:

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

Đối với Plugin bên thứ ba, hợp đồng cold path vẫn là manifest Plugin: phản chiếu JSON Schema đã tạo vào `openclaw.plugin.json#channelConfigs` để schema cấu hình, thiết lập và các bề mặt UI có thể kiểm tra `channels.<id>` mà không cần tải mã runtime.

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

Kiểu `ChannelSetupWizard` hỗ trợ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, và nhiều hơn nữa. Xem các gói Plugin đi kèm (ví dụ Plugin Discord `src/channel.setup.ts`) để có ví dụ đầy đủ.

<AccordionGroup>
  <Accordion title="Prompt allowFrom dùng chung">
    Đối với các prompt allowlist DM chỉ cần luồng chuẩn `note -> prompt -> parse -> merge -> patch`, ưu tiên các helper thiết lập dùng chung từ `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, và `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Trạng thái thiết lập kênh chuẩn">
    Đối với các khối trạng thái thiết lập kênh chỉ khác nhau theo nhãn, điểm số và các dòng bổ sung tùy chọn, ưu tiên `createStandardChannelSetupStatus(...)` từ `openclaw/plugin-sdk/setup` thay vì tự viết lại cùng một đối tượng `status` trong từng Plugin.
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

    `plugin-sdk/channel-setup` cũng expose các builder cấp thấp hơn `createOptionalChannelSetupAdapter(...)` và `createOptionalChannelSetupWizard(...)` khi bạn chỉ cần một nửa của bề mặt cài đặt tùy chọn đó.

    Adapter/trình hướng dẫn tùy chọn được tạo sẽ fail closed khi ghi cấu hình thật. Chúng tái sử dụng một thông báo yêu cầu cài đặt trên `validateInput`, `applyAccountConfig`, và `finalize`, đồng thời thêm liên kết tài liệu khi `docsPath` được đặt.

  </Accordion>
  <Accordion title="Helper thiết lập dựa trên binary">
    Đối với UI thiết lập dựa trên binary, ưu tiên các helper ủy quyền dùng chung thay vì sao chép cùng phần keo binary/trạng thái vào mọi kênh:

    - `createDetectedBinaryStatus(...)` cho các khối trạng thái chỉ khác nhau theo nhãn, gợi ý, điểm số và phát hiện binary
    - `createCliPathTextInput(...)` cho input văn bản dựa trên đường dẫn
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, và `createDelegatedResolveConfigured(...)` khi `setupEntry` cần chuyển tiếp lazy đến một trình hướng dẫn đầy đủ nặng hơn
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
  <Tab title="Đặc tả gói npm">
    Dùng npm khi một gói chưa chuyển sang ClawHub, hoặc khi bạn cần một
    đường dẫn cài đặt npm trực tiếp trong quá trình di chuyển:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin trong repo:** đặt dưới cây workspace Plugin đi kèm và chúng sẽ tự động được phát hiện trong lúc build.

**Người dùng có thể cài đặt:**

```bash
openclaw plugins install <package-name>
```

<Info>
Đối với các cài đặt có nguồn từ npm, `openclaw plugins install` cài gói dưới `~/.openclaw/npm` với lifecycle scripts bị tắt. Giữ cây dependency của Plugin thuần JS/TS và tránh các gói yêu cầu build `postinstall`.
</Info>

<Note>
Khởi động Gateway không cài đặt dependency của Plugin. Các luồng cài đặt npm/git/ClawHub sở hữu việc hội tụ dependency; Plugin cục bộ phải có sẵn dependency đã được cài đặt.
</Note>

Siêu dữ liệu gói đi kèm là tường minh, không được suy luận từ JavaScript đã build khi Gateway khởi động. Các phụ thuộc runtime thuộc về gói Plugin sở hữu chúng; quá trình khởi động OpenClaw đã đóng gói không bao giờ sửa chữa hoặc sao chép các phụ thuộc của Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn bắt đầu từng bước
- [Tệp kê khai Plugin](/vi/plugins/manifest) — tài liệu tham chiếu schema manifest đầy đủ
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — `definePluginEntry` và `defineChannelPluginEntry`
