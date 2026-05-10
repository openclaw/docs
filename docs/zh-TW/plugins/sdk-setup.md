---
read_when:
    - 你正在為 Plugin 新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 您正在定義 Plugin 設定結構描述或 package.json 的 openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述，以及 package.json 中繼資料
title: Plugin 設定與組態
x-i18n:
    generated_at: "2026-05-10T19:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin 封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定結構描述的參考。

<Tip>
**想找逐步解說嗎？** 操作指南會在情境中說明封裝：[Channel Plugin](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest) 與 [Provider Plugin](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，用來告訴 Plugin 系統你的 Plugin 提供什麼：

<Tabs>
  <Tab title="Channel Plugin">
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
  <Tab title="Provider Plugin / ClawHub 基準">
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
如果你在 ClawHub 上對外發布 Plugin，這些 `compat` 與 `build` 欄位是必要的。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。
</ParamField>
<ParamField path="setupEntry" type="string">
  輕量的僅限設定進入點（選用）。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速開始與狀態介面的 Channel 目錄中繼資料。
</ParamField>
<ParamField path="providers" type="string[]">
  由此 Plugin 註冊的 Provider ID。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是便宜的套件中繼資料，用於執行階段載入前的 Channel 探索與設定介面。

| 欄位                                   | 類型       | 意義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準 Channel ID。                                                             |
| `label`                                | `string`   | 主要 Channel 標籤。                                                           |
| `selectionLabel`                       | `string`   | 當需要與 `label` 不同時，用於選擇器/設定的標籤。                              |
| `detailLabel`                          | `string`   | 用於更豐富的 Channel 目錄與狀態介面的次要詳細標籤。                          |
| `docsPath`                             | `string`   | 用於設定與選擇連結的文件路徑。                                                |
| `docsLabel`                            | `string`   | 當需要與 Channel ID 不同時，用於文件連結的覆寫標籤。                          |
| `blurb`                                | `string`   | 簡短的上線導覽/目錄描述。                                                     |
| `order`                                | `number`   | Channel 目錄中的排序順序。                                                    |
| `aliases`                              | `string[]` | Channel 選擇的額外查詢別名。                                                  |
| `preferOver`                           | `string[]` | 此 Channel 應優先於其上的較低優先序 Plugin/Channel ID。                       |
| `systemImage`                          | `string`   | Channel UI 目錄的選用圖示/系統圖片名稱。                                      |
| `selectionDocsPrefix`                  | `string`   | 選擇介面中文件連結前的前置文字。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在選擇文案中直接顯示文件路徑，而不是有標籤的文件連結。                       |
| `selectionExtras`                      | `string[]` | 附加在選擇文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將 Channel 標記為支援 Markdown，以供輸出格式決策使用。                       |
| `exposure`                             | `object`   | Channel 在設定、已設定清單與文件介面中的可見性控制。                         |
| `quickstartAllowFrom`                  | `boolean`  | 讓此 Channel 加入標準快速開始 `allowFrom` 設定流程。                          |
| `forceAccountBinding`                  | `boolean`  | 即使只有一個帳號存在，也要求明確的帳號繫結。                                  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此 Channel 的公告目標時，偏好使用工作階段查詢。                           |

範例：

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

`exposure` 支援：

- `configured`：將 Channel 納入已設定/狀態樣式的列出介面
- `setup`：將 Channel 納入互動式設定/組態選擇器
- `docs`：在文件/導覽介面中將 Channel 標記為公開面向

<Note>
`showConfigured` 與 `showInSetup` 仍作為舊版別名受到支援。偏好使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是資訊清單中繼資料。

| 欄位                         | 類型                                | 意義                                                                               |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝/更新與上線導覽隨需安裝流程的標準 ClawHub 規格。                          |
| `npmSpec`                    | `string`                            | 用於安裝/更新後援流程的標準 npm 規格。                                             |
| `localPath`                  | `string`                            | 本機開發或 bundled 安裝路徑。                                                      |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 當有多個來源可用時的偏好安裝來源。                                                 |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z` 或 `>=x.y.z-prerelease`。               |
| `expectedIntegrity`          | `string`                            | 預期的 npm dist 完整性字串，通常是 `sha512-...`，用於釘選安裝。                   |
| `allowInvalidConfigRecovery` | `boolean`                           | 允許 bundled Plugin 重新安裝流程從特定的過期設定失敗中復原。                      |

<AccordionGroup>
  <Accordion title="上線導覽行為">
    互動式上線導覽也會使用 `openclaw.install` 作為隨需安裝介面。如果你的 Plugin 在執行階段載入前公開 Provider 驗證選項或 Channel 設定/目錄中繼資料，上線導覽可以顯示該選項，提示使用 ClawHub、npm 或本機安裝，安裝或啟用 Plugin，然後繼續所選流程。ClawHub 上線導覽選項使用 `clawhubSpec`，且在存在時優先使用；npm 選項需要可信的目錄中繼資料與 registry `npmSpec`；精確版本與 `expectedIntegrity` 是選用的 npm 釘選。如果存在 `expectedIntegrity`，安裝/更新流程會對 npm 強制執行它。將「要顯示什麼」中繼資料放在 `openclaw.plugin.json`，並將「如何安裝它」中繼資料放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    如果設定了 `minHostVersion`，安裝與非 bundled 的資訊清單 registry 載入都會強制執行它。較舊的主機會略過外部 Plugin；無效的版本字串會被拒絕。bundled 原始碼 Plugin 會被假定為與主機 checkout 共同版本化。
  </Accordion>
  <Accordion title="釘選的 npm 安裝">
    對於釘選的 npm 安裝，請在 `npmSpec` 保留精確版本，並加入預期的成品完整性：

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
  <Accordion title="allowInvalidConfigRecovery 範圍">
    `allowInvalidConfigRecovery` 不是破損設定的一般性繞過方式。它只用於狹窄的 bundled Plugin 復原，因此重新安裝/設定可以修復已知的升級殘留，例如缺少 bundled Plugin 路徑，或同一 Plugin 的過期 `channels.<id>` 項目。如果設定因無關原因而損壞，安裝仍會關閉式失敗，並告知操作員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

Channel Plugin 可以透過下列方式選擇加入延後載入：

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

啟用後，即使是已設定的 Channel，OpenClaw 在監聽前啟動階段也只會載入 `setupEntry`。完整進入點會在 Gateway 開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會於 Gateway 開始監聽前註冊 Gateway 所需的一切（Channel 註冊、HTTP 路由、Gateway 方法）時，才啟用延後載入。如果完整進入點擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入點會註冊 Gateway RPC 方法，請將它們維持在 Plugin 專屬前綴。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，並且一律解析為 `operator.admin`。

## Plugin 資訊清單

每個原生 Plugin 都必須在套件根目錄提供 `openclaw.plugin.json`。OpenClaw 使用它在不執行 Plugin 程式碼的情況下驗證設定。

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

對於 Channel Plugin，請加入 `kind` 與 `channels`：

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

即使 Plugin 沒有設定，也必須提供結構描述。空結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

請參閱 [Plugin 資訊清單](/zh-TW/plugins/manifest) 取得完整結構描述參考。

## ClawHub 發布

對於 Plugin 套件，請使用套件專屬的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
舊版僅限 Skill 的發布別名是給 Skills 使用。Plugin 套件應一律使用 `clawhub package publish`。
</Note>

## 設定入口

`setup-entry.ts` 檔案是 `index.ts` 的輕量替代方案，OpenClaw 只需要設定介面（導入設定、設定修復、停用頻道檢查）時會載入它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入繁重的執行階段程式碼（加密程式庫、CLI 註冊、背景服務）。

若 bundled workspace 頻道將設定安全的匯出保留在 sidecar 模組中，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該 bundled contract 也支援選用的 `runtime` 匯出，讓設定時的執行階段接線保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整入口">
    - 頻道已停用，但需要設定／導入設定介面。
    - 頻道已啟用但尚未設定。
    - 延遲載入已啟用（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊什麼">
    - 頻道 Plugin 物件（透過 `defineSetupPluginEntry`）。
    - Gateway listen 前所需的任何 HTTP 路由。
    - 啟動期間所需的任何 Gateway 方法。

    這些啟動 Gateway 方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含什麼">
    - CLI 註冊。
    - 背景服務。
    - 繁重的執行階段匯入（加密、SDK）。
    - 僅在啟動後才需要的 Gateway 方法。

  </Accordion>
</AccordionGroup>

### 精準的設定輔助工具匯入

對於熱門的僅設定路徑，若只需要設定介面的一部分，請優先使用精準的設定輔助工具 seam，而不是較廣泛的 `plugin-sdk/setup` umbrella：

| 匯入路徑                        | 用途                                                                                | 主要匯出                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 設定時執行階段輔助工具，會在 `setupEntry`／延遲頻道啟動中保持可用 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已棄用的相容別名；請使用 `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 設定／安裝 CLI／封存檔／文件輔助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

當你需要完整的共用設定工具箱時，請使用較廣泛的 `plugin-sdk/setup` seam，包括像 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具。

設定修補 adapter 在匯入時保持熱門路徑安全。其 bundled 單一帳號提升的 contract-surface 查詢是惰性的，因此匯入 `plugin-sdk/setup-runtime` 不會在 adapter 實際使用前急切載入 bundled contract-surface discovery。

### 頻道擁有的單一帳號提升

當頻道從單一帳號的頂層設定升級到 `channels.<id>.accounts.*` 時，預設共用行為會將提升後的帳號範圍值移入 `accounts.default`。

Bundled 頻道可以透過其設定 contract surface 縮小或覆寫該提升行為：

- `singleAccountKeysToMove`：應移入提升帳號的額外頂層 key
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些 key 會移入提升帳號；共用 policy／delivery key 會留在頻道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個既有帳號接收提升後的值

<Note>
Matrix 是目前的 bundled 範例。如果剛好已有一個具名 Matrix 帳號，或 `defaultAccount` 指向既有的非 canonical key（例如 `Ops`），提升會保留該帳號，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

Plugin 設定會根據 manifest 中的 JSON Schema 驗證。使用者透過以下方式設定 Plugin：

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

你的 Plugin 會在註冊期間以 `api.pluginConfig` 接收此設定。

對於頻道專屬設定，請改用頻道設定區段：

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

### 建立頻道設定結構描述

使用 `buildChannelConfigSchema` 將 Zod schema 轉換為 Plugin 擁有的設定成品所使用的 `ChannelConfigSchema` wrapper：

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

如果你已經以 JSON Schema 或 TypeBox 撰寫 contract，請使用直接輔助工具，讓 OpenClaw 在 metadata 路徑上略過 Zod-to-JSON-Schema 轉換：

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

對於第三方 Plugin，冷路徑 contract 仍是 Plugin manifest：請將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定和 UI 介面可以在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

頻道 Plugin 可以為 `openclaw onboard` 提供互動式設定精靈。精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 型別支援 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整範例請參閱 bundled Plugin 套件（例如 Discord Plugin 的 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的 DM allowlist 提示，請優先使用 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準頻道設定狀態">
    對於只因 label、score 和選用額外列而不同的頻道設定狀態區塊，請優先使用 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個 Plugin 中手寫相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用頻道設定介面">
    對於只應在特定情境中出現的選用設定介面，請使用 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

    當你只需要該選用安裝介面的一半時，`plugin-sdk/channel-setup` 也提供較低階的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用 adapter／wizard 會在真實設定寫入時 fail closed。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 中重用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="二進位支援的設定輔助工具">
    對於二進位支援的設定 UI，請優先使用共用 delegated 輔助工具，而不是將相同的二進位／狀態膠合程式碼複製到每個頻道：

    - `createDetectedBinaryStatus(...)` 用於僅因 label、hint、score 和二進位偵測而不同的狀態區塊
    - `createCliPathTextInput(...)` 用於路徑支援的文字輸入
    - 當 `setupEntry` 需要惰性轉送到較重的完整精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 判斷時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部 Plugin：**發布到 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在 launch cutover 期間，裸套件 spec 會從 npm 安裝。

  </Tab>
  <Tab title="僅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件 spec">
    當套件尚未移至 ClawHub，或你在遷移期間需要
    直接 npm 安裝路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內 Plugin：**放置於內建 Plugin 工作區樹下，建置期間會自動探索到它們。

**使用者可以安裝：**

```bash
openclaw plugins install <package-name>
```

<Info>
對於 npm 來源的安裝，`openclaw plugins install` 會在停用生命週期指令碼的情況下，將套件安裝到 `~/.openclaw/npm` 下。請讓 Plugin 相依性樹保持為純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
Gateway 啟動不會安裝 Plugin 相依性。npm/git/ClawHub 安裝流程負責相依性收斂；本機 Plugin 必須已安裝其相依性。
</Note>

內建套件中繼資料是明確指定的，不會在 Gateway 啟動時從已建置的 JavaScript 推斷。執行階段相依性應位於擁有它們的 Plugin 套件中；封裝後的 OpenClaw 啟動永遠不會修復或鏡像 Plugin 相依性。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [Plugin manifest](/zh-TW/plugins/manifest) — 完整 manifest 結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
