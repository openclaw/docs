---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要瞭解 setup-entry.ts 與 index.ts 之間的差異
    - 你正在定義外掛設定結構描述或 package.json 的 OpenClaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述與 package.json 中繼資料
title: 外掛設定與組態
x-i18n:
    generated_at: "2026-07-11T21:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定進入點及設定結構描述的參考資料。

<Tip>
**想找逐步教學嗎？** 操作指南會在實際情境中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest)與[供應商外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要包含 `openclaw` 欄位，用來告知外掛系統你的外掛提供哪些功能：

<Tabs>
  <Tab title="頻道外掛">
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
  <Tab title="供應商外掛／ClawHub 基準">
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
在 ClawHub 上對外發布時，必須提供 `compat` 和 `build`。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。適用於工作區及 Git 簽出開發的有效原始碼進入點。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  與 `extensions` 對應的已建置 JavaScript 檔案；OpenClaw 載入已安裝的 npm 套件時會優先使用。原始碼／建置產物的解析順序請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。
</ParamField>
<ParamField path="setupEntry" type="string">
  僅用於設定的輕量進入點（選用）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  與 `setupEntry` 對應的已建置 JavaScript 檔案。也必須設定 `setupEntry`。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` 備用外掛識別資訊，當外掛沒有可用來推導識別碼或標籤的頻道／供應商中繼資料時使用。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速入門及狀態介面的頻道目錄中繼資料。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>
<ParamField path="compat" type="object">
  此外掛支援的 `pluginApi` 版本範圍。對外發布至 ClawHub 時為必填。
</ParamField>

<Note>
供應商識別碼（`providers: string[]`）屬於資訊清單中繼資料，而非套件中繼資料。請在 `openclaw.plugin.json` 中宣告，而不是在此處宣告——請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
</Note>

### `openclaw.channel`

`openclaw.channel` 是低成本的套件中繼資料，可在載入執行階段之前，用於頻道探索及設定介面。

| 欄位                                   | 類型       | 含義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道識別碼。                                                              |
| `label`                                | `string`   | 主要頻道標籤。                                                                |
| `selectionLabel`                       | `string`   | 需要與 `label` 不同時使用的選擇器／設定標籤。                                 |
| `detailLabel`                          | `string`   | 用於內容更豐富的頻道目錄及狀態介面的次要詳細資料標籤。                        |
| `docsPath`                             | `string`   | 設定及選擇連結所用的文件路徑。                                                |
| `docsLabel`                            | `string`   | 文件連結標籤需要與頻道識別碼不同時使用的覆寫值。                              |
| `blurb`                                | `string`   | 簡短的初始設定／目錄說明。                                                    |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                              | `string[]` | 用於選擇頻道的額外查詢別名。                                                  |
| `preferOver`                           | `string[]` | 此頻道應優先於哪些較低優先權的外掛／頻道識別碼。                              |
| `systemImage`                          | `string`   | 頻道使用者介面目錄的選用圖示／系統影像名稱。                                 |
| `selectionDocsPrefix`                  | `string`   | 選擇介面中文件連結之前的前綴文字。                                            |
| `selectionDocsOmitLabel`               | `boolean`  | 在選擇文案中直接顯示文件路徑，而不顯示帶標籤的文件連結。                      |
| `selectionExtras`                      | `string[]` | 附加到選擇文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 Markdown，以供傳出格式決策使用。                             |
| `exposure`                             | `object`   | 控制頻道在設定、已設定清單及文件介面中的可見性。                              |
| `quickstartAllowFrom`                  | `boolean`  | 讓此頻道採用標準快速入門的 `allowFrom` 設定流程。                             |
| `forceAccountBinding`                  | `boolean`  | 即使只有一個帳戶，也要求明確繫結帳戶。                                        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時，優先查詢工作階段。                                    |

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

- `configured`：將頻道納入已設定／狀態類型的清單介面
- `setup`：將頻道納入互動式設定／配置選擇器
- `docs`：在文件／導覽介面中將頻道標記為公開顯示

<Note>
`showConfigured` 和 `showInSetup` 仍作為舊版別名受到支援。請優先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，而非資訊清單中繼資料。

| 欄位                         | 類型                                | 含義                                                                             |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝／更新及初始設定隨需安裝流程的標準 ClawHub 規格。                       |
| `npmSpec`                    | `string`                            | 用於安裝／更新備用流程的標準 npm 規格。                                         |
| `localPath`                  | `string`                            | 本機開發或隨附安裝路徑。                                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 有多個來源可用時的偏好安裝來源。                                                |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z` 或 `>=x.y.z-prerelease`。            |
| `expectedIntegrity`          | `string`                            | 鎖定版本安裝所預期的 npm 發行完整性字串，通常為 `sha512-...`。                  |
| `allowInvalidConfigRecovery` | `boolean`                           | 允許隨附外掛重新安裝流程從特定的過時設定失敗中復原。                            |
| `requiredPlatformPackages`   | `string[]`                          | npm 安裝期間會驗證的必要平台特定 npm 別名。                                     |

<AccordionGroup>
  <Accordion title="初始設定行為">
    互動式初始設定會將 `openclaw.install` 用於隨需安裝介面：如果你的外掛在載入執行階段之前公開供應商驗證選項或頻道設定／目錄中繼資料，初始設定可以提示使用者選擇從 ClawHub、npm 或本機安裝，安裝或啟用外掛，然後繼續執行所選流程。ClawHub 選項使用 `clawhubSpec`，並會在存在時優先採用；npm 選項需要受信任的目錄中繼資料，且其中須有登錄檔的 `npmSpec`（確切版本和 `expectedIntegrity` 是選用的鎖定值，設定後會在安裝／更新時強制執行）。請將「要顯示的內容」放在 `openclaw.plugin.json`，並將「如何安裝」放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    若設定了 `minHostVersion`，安裝及非隨附的資訊清單登錄載入都會強制執行此限制。較舊的主程式會略過外部外掛；無效的版本字串會遭到拒絕。隨附的原始碼外掛會假定與主程式簽出版本一致。
  </Accordion>
  <Accordion title="鎖定版本的 npm 安裝">
    對於鎖定版本的 npm 安裝，請在 `npmSpec` 中保留確切版本，並新增預期的成品完整性：

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
  <Accordion title="allowInvalidConfigRecovery 的範圍">
    `allowInvalidConfigRecovery` 並非針對損壞設定的一般性繞過機制。它僅用於範圍有限的隨附外掛復原，讓重新安裝／設定能夠修復已知的升級殘留問題，例如缺少隨附外掛路徑，或同一外掛存在過時的 `channels.<id>` 項目。如果設定因無關原因而損壞，安裝仍會採取封閉式失敗，並告知操作人員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道外掛可使用下列設定選擇延後載入：

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

啟用後，即使頻道已設定，OpenClaw 在開始監聽前的啟動階段也只會載入 `setupEntry`。完整進入點會在閘道開始監聽後載入。

<Warning>
只有當你的 `setupEntry` 會註冊閘道開始監聽前所需的一切內容（頻道註冊、HTTP 路由、閘道方法）時，才啟用延後載入。如果必要的啟動能力由完整進入點負責，請保留預設行為。
</Warning>

如果你的設定／完整進入點會註冊閘道 RPC 方法，請將它們置於外掛專屬的前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，且一律正規化為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄提供 `openclaw.plugin.json`。OpenClaw 使用此檔案在不執行外掛程式碼的情況下驗證設定。

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

對於頻道外掛，請新增 `channels`（供應商外掛則新增 `providers`）：

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

即使外掛沒有任何設定，也必須提供結構描述。空的結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整的結構描述參考資料請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

## 發佈至 ClawHub

Skills 與外掛套件使用不同的 ClawHub 發佈命令。對於外掛套件，請使用套件專用命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` 是用於發佈技能資料夾的另一個命令，並非用於發佈外掛套件。請參閱[在 ClawHub 上發佈](/zh-TW/clawhub/publishing)。
</Note>

## 設定進入點

`setup-entry.ts` 是 `index.ts` 的輕量替代方案，OpenClaw 僅需要設定介面（初始設定、設定修復、停用頻道檢查）時會載入此檔案：

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程中載入繁重的執行階段程式碼（密碼學函式庫、命令列介面註冊、背景服務）。

將設定安全匯出保留在附屬模組中的內建工作區頻道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而非 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，讓設定期間的執行階段接線維持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而非完整進入點">
    - 頻道已停用，但需要設定／初始設定介面。
    - 頻道已啟用，但尚未設定。
    - 已啟用延遲載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊的內容">
    - 頻道外掛物件（透過 `defineSetupPluginEntry`）。
    - 閘道開始監聽前所需的任何 HTTP 路由。
    - 啟動期間所需的任何閘道方法。

    這些啟動閘道方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含的內容">
    - 命令列介面註冊。
    - 背景服務。
    - 繁重的執行階段匯入（密碼學、SDK）。
    - 僅在啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 精簡的設定輔助工具匯入

對於設定專用的熱路徑，如果只需要部分設定介面，應優先使用精簡的設定輔助工具介面，而非範圍較廣的 `plugin-sdk/setup` 統整介面：

| 匯入路徑                           | 用途                                                                                      | 主要匯出                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry`／延遲頻道啟動中仍可使用的設定期間執行階段輔助工具                         | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime`                                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 設定／安裝的命令列介面、封存檔與文件輔助工具                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

如果需要完整的共用設定工具箱，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等設定修補輔助工具，請使用範圍較廣的 `plugin-sdk/setup` 介面。

固定的設定精靈文字請使用 `createSetupTranslator(...)`。它會遵循命令列介面精靈的地區設定（先使用 `OPENCLAW_LOCALE`，再使用系統地區設定變數），並在無法使用時回退至英文。請將外掛專用的設定文字保留在外掛自身的程式碼中，且僅將共用目錄鍵用於一般設定標籤、狀態文字及官方內建外掛的設定文字。

設定修補配接器在匯入時維持熱路徑安全。其內建單一帳號提升合約介面查詢採用延遲方式，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器前，提早載入內建合約介面的探索作業。

### 頻道擁有的單一帳號提升

當頻道從單一帳號的頂層設定升級至 `channels.<id>.accounts.*` 時，預設的共用行為會將提升後的帳號範圍值移至 `accounts.default`。

內建頻道可透過其設定合約介面縮小或覆寫此提升行為：

- `singleAccountKeysToMove`：應移入提升後帳號的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些鍵會移入提升後的帳號；共用政策／傳遞鍵會保留在頻道根層級
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳號接收提升後的值

<Note>
Matrix 是目前的內建範例。如果恰好已有一個具名 Matrix 帳號，或 `defaultAccount` 指向現有的非標準鍵（例如 `Ops`），提升程序會保留該帳號，而不會建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

外掛設定會依據資訊清單中的 JSON Schema 進行驗證。使用者可透過以下方式設定外掛：

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

外掛會在註冊期間透過 `api.pluginConfig` 接收此設定。

對於頻道專用設定，請改用頻道設定區段：

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

使用 `buildChannelConfigSchema` 將 Zod 結構描述轉換成外掛所擁有之設定成品使用的 `ChannelConfigSchema` 包裝器：

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

如果已使用 JSON Schema 或 TypeBox 撰寫合約，請使用直接輔助工具，讓 OpenClaw 可在中繼資料路徑中略過 Zod 至 JSON Schema 的轉換：

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

對於第三方外掛，冷路徑合約仍是外掛資訊清單：請將產生的 JSON Schema 同步至 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定流程及使用者介面無須載入執行階段程式碼，即可檢查 `channels.<id>`。

## 設定精靈

頻道外掛可為 `openclaw onboard` 提供互動式設定精靈。此精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 也支援 `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等功能。完整的內建範例請參閱 Discord 外掛的 `src/setup-core.ts`。

<AccordionGroup>
  <Accordion title="共用的 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的私訊允許清單提示，應優先使用 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 及 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準頻道設定狀態">
    對於僅在標籤、分數及選用額外文字行方面有所不同的頻道設定狀態區塊，應優先使用 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個外掛中自行建立相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用的頻道設定介面">
    對於只應在特定情境中顯示的選用設定介面，請使用 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

    如果只需要該選用安裝介面的其中一部分，`plugin-sdk/channel-setup` 也提供較低階的 `createOptionalChannelSetupAdapter(...)` 與 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用轉接器／精靈會在實際寫入設定時採取失敗關閉策略。它們在 `validateInput`、`applyAccountConfig` 與 `finalize` 中重複使用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="由二進位檔支援的設定輔助工具">
    對於由二進位檔支援的設定介面，請優先使用共用的委派輔助工具，而不要將相同的二進位檔／狀態黏合邏輯複製到每個頻道中：

    - `createDetectedBinaryStatus(...)`：用於僅標籤、提示、分數與二進位檔偵測有所不同的狀態區塊
    - `createCliPathTextInput(...)`：用於以路徑為基礎的文字輸入
    - 當 `setupEntry` 需要延遲轉交給功能較完整且負擔較重的精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 與 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 僅需委派 `textInputs[*].shouldPrompt` 決策時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布至 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，單純的套件規格會從 npm 安裝；但若名稱符合隨附或官方外掛 ID，OpenClaw 會改用該本機／官方版本。請使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 來確定性地選擇來源——請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

  </Tab>
  <Tab title="僅限 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    若套件尚未移至 ClawHub，或遷移期間需要直接透過 npm 安裝，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內外掛：**放置於隨附外掛工作區樹狀結構下；建置期間會自動探索這些外掛。

<Info>
對於來源為 npm 的安裝，`openclaw plugins install` 會將套件安裝到 `~/.openclaw/npm/projects` 下每個外掛各自的專案中，並停用生命週期指令碼（`--ignore-scripts`）。請讓外掛相依性樹維持為純 JS/TS，並避免使用需要透過 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動時不會安裝外掛相依套件。npm／git／ClawHub 安裝流程負責使相依套件收斂一致；本機外掛必須事先安裝其相依套件。
</Note>

隨附套件的中繼資料是明確指定的，不會在閘道啟動時根據已建置的 JavaScript 推斷。執行階段相依套件應放在擁有它們的外掛套件中；封裝版 OpenClaw 啟動時絕不會修復或鏡像外掛相依套件。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整的資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 與 `defineChannelPluginEntry`
