---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要了解 `setup-entry.ts` 與 `index.ts` 的差異
    - 你正在定義外掛設定結構描述或 package.json 的 openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述及 package.json 中繼資料
title: 外掛設定與組態
x-i18n:
    generated_at: "2026-07-20T00:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目及設定結構描述的參考資料。

<Tip>
**想找逐步指南嗎？** 操作指南會在實際情境中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest)和[供應商外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，用來告知外掛系統你的外掛提供哪些功能：

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
          "label": "我的頻道",
          "blurb": "頻道的簡短說明。"
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
在 ClawHub 對外發布需要 `compat` 和 `build`。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。適用於工作區及 Git 簽出開發的有效原始碼進入點。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` 的已建置 JavaScript 對應檔；OpenClaw 載入已安裝的 npm 套件時優先使用。原始碼／建置產物的解析順序請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。
</ParamField>
<ParamField path="setupEntry" type="string">
  僅供設定使用的輕量進入點（選用）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` 的已建置 JavaScript 對應檔。也必須設定 `setupEntry`。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` 備援外掛識別資訊，當外掛沒有可供衍生 ID 或標籤的頻道／供應商中繼資料時使用。
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
供應商 ID（`providers: string[]`）屬於資訊清單中繼資料，而非套件中繼資料。請在 `openclaw.plugin.json` 中宣告，不要在此處宣告——請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
</Note>

### `openclaw.channel`

`openclaw.channel` 是成本低廉的套件中繼資料，可在執行階段載入前供頻道探索及設定介面使用。

| 欄位                                   | 類型       | 意義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                    | `string`   | 標準頻道 ID。                                                                 |
| `label`                    | `string`   | 主要頻道標籤。                                                                |
| `selectionLabel`                    | `string`   | 需要與 `label` 不同時使用的選擇器／設定標籤。                     |
| `detailLabel`                    | `string`   | 用於資訊更豐富的頻道目錄及狀態介面的次要詳細資訊標籤。                        |
| `docsPath`                    | `string`   | 用於設定及選擇連結的文件路徑。                                                |
| `docsLabel`                    | `string`   | 需要與頻道 ID 不同時，用於文件連結的覆寫標籤。                                |
| `blurb`                    | `string`   | 簡短的初始設定／目錄說明。                                                    |
| `order`                    | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                    | `string[]` | 用於頻道選擇的額外查詢別名。                                                  |
| `preferOver`                    | `string[]` | 此頻道應優先於其上的低優先順序外掛／頻道 ID。                                 |
| `systemImage`                    | `string`   | 頻道 UI 目錄的選用圖示／系統影像名稱。                                        |
| `selectionDocsPrefix`                    | `string`   | 選擇介面中文件連結前的前置文字。                                              |
| `selectionDocsOmitLabel`                    | `boolean`  | 在選擇文字中直接顯示文件路徑，而非帶標籤的文件連結。                          |
| `selectionExtras`                    | `string[]` | 附加至選擇文字的額外短字串。                                                  |
| `markdownCapable`                    | `boolean`  | 將頻道標記為支援 Markdown，以供外送格式決策使用。                              |
| `exposure`                    | `object`   | 控制頻道在設定、已設定清單及文件介面中的可見性。                              |
| `quickstartAllowFrom`                    | `boolean`  | 讓此頻道加入標準快速入門 `allowFrom` 設定流程。                        |
| `forceAccountBinding`                    | `boolean`  | 即使只有一個帳號，也要求明確綁定帳號。                                        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時，優先使用工作階段查詢。                                |

範例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "我的頻道",
      "selectionLabel": "我的頻道（自行託管）",
      "detailLabel": "我的頻道機器人",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "以網路鉤子為基礎的自行託管聊天整合。",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "指南：",
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

- `configured`：將頻道納入已設定／狀態樣式的清單介面
- `setup`：將頻道納入互動式設定／組態選擇器
- `docs`：將頻道標記為在文件／導覽介面中對外公開

### `openclaw.install`

`openclaw.install` 是套件中繼資料，而非資訊清單中繼資料。

| 欄位                         | 類型                                | 意義                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`           | `string`                  | 用於安裝／更新及初始設定隨選安裝流程的標準 ClawHub 規格。                         |
| `npmSpec`           | `string`                  | 用於安裝／更新備援流程的標準 npm 規格。                                           |
| `localPath`           | `string`                  | 本機開發或隨附安裝路徑。                                                          |
| `defaultChoice`           | `"clawhub"` \| `"npm"` \| `"local"` | 有多個來源可用時的偏好安裝來源。                                                  |
| `minHostVersion`           | `string`                  | 支援的最低 OpenClaw 版本，`>=x.y.z` 或 `>=x.y.z-prerelease`。              |
| `expectedIntegrity`           | `string`                  | 釘選安裝預期的 npm dist 完整性字串，通常為 `sha512-...`。                   |
| `allowInvalidConfigRecovery`           | `boolean`                  | 允許隨附外掛重新安裝流程從特定的過時設定錯誤中復原。                              |
| `requiredPlatformPackages`           | `string[]`                  | npm 安裝期間驗證的必要平台特定 npm 別名。                                         |

<AccordionGroup>
  <Accordion title="初始設定行為">
    互動式初始設定會將 `openclaw.install` 用於隨選安裝介面：如果你的外掛在執行階段載入前公開供應商驗證選項或頻道設定／目錄中繼資料，初始設定便可提示使用 ClawHub、npm 或本機安裝、安裝或啟用外掛，然後繼續所選流程。ClawHub 選項使用 `clawhubSpec`，且存在時會優先採用；npm 選項需要具有登錄檔 `npmSpec` 的可信目錄中繼資料（確切版本及 `expectedIntegrity` 為選用釘選值，設定後會在安裝／更新時強制執行）。請將「要顯示什麼」保留在 `openclaw.plugin.json`，並將「如何安裝」保留在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    若已設定 `minHostVersion`，安裝及非隨附資訊清單登錄載入都會強制執行該限制。較舊的主機會略過外部外掛；無效的版本字串會遭拒絕。隨附原始碼外掛會視為與主機簽出版本一致。
  </Accordion>
  <Accordion title="釘選的 npm 安裝">
    對於釘選的 npm 安裝，請將確切版本保留在 `npmSpec` 中，並新增預期的成品完整性：

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
    `allowInvalidConfigRecovery` 並非破損設定的一般略過機制。它只用於範圍狹窄的隨附外掛復原，讓重新安裝／設定得以修復已知的升級殘留問題，例如缺少隨附外掛路徑，或同一外掛有過時的 `channels.<id>` 項目。若設定因無關原因而損壞，安裝仍會採取失敗關閉，並告知操作人員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道外掛可透過以下設定選擇延後載入：

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

啟用後，即使是已設定的頻道，OpenClaw 在開始監聽前的啟動階段也只會載入 `setupEntry`。完整進入點會在閘道開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會於閘道開始監聽前，註冊閘道所需的一切（頻道註冊、HTTP 路由、閘道方法）時，才啟用延後載入。如果完整進入點擁有必要的啟動功能，請保留預設行為。
</Warning>

如果你的設定／完整進入點會註冊閘道 RPC 方法，請將它們放在外掛專屬的前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，且一律正規化為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄中附帶 `openclaw.plugin.json`。OpenClaw 使用它在不執行外掛程式碼的情況下驗證設定。

```json
{
  "id": "my-plugin",
  "name": "我的外掛",
  "description": "為 OpenClaw 新增我的外掛功能",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "網路鉤子驗證密鑰"
      }
    }
  }
}
```

對於頻道外掛，請新增 `channels`（提供者外掛則新增 `providers`）：

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

即使外掛沒有任何設定，也必須附帶結構描述。空白結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

如需完整的結構描述參考資料，請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

## 發布至 ClawHub

Skills 與外掛套件使用不同的 ClawHub 發布命令。對於外掛套件，請使用套件專用命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` 是用於發布 Skill 資料夾的另一個命令，不是用於發布外掛套件。請參閱[發布至 ClawHub](/zh-TW/clawhub/publishing)。
</Note>

## 設定進入點

`setup-entry.ts` 是 `index.ts` 的輕量替代方案；當 OpenClaw 只需要設定介面（初始設定、設定修復、停用頻道檢查）時，便會載入它：

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入繁重的執行階段程式碼（密碼學程式庫、命令列介面註冊、背景服務）。

將設定安全匯出項目放在附屬模組中的內建工作區頻道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而非 `defineSetupPluginEntry(...)`。該內建契約也支援選用的 `runtime` 匯出項目，讓設定階段的執行階段接線保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry，而非完整進入點">
    - 頻道已停用，但需要設定／初始設定介面。
    - 頻道已啟用，但尚未設定。
    - 已啟用延後載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊的項目">
    - 頻道外掛物件（透過 `defineSetupPluginEntry`）。
    - 閘道監聽前所需的任何 HTTP 路由。
    - 啟動期間所需的任何閘道方法。

    這些啟動閘道方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含的項目">
    - 命令列介面註冊。
    - 背景服務。
    - 繁重的執行階段匯入項目（密碼學、SDK）。
    - 僅在啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 縮小設定輔助工具的匯入範圍

對於熱門的純設定路徑，如果你只需要設定介面的一部分，請優先使用範圍較窄的設定輔助工具介面，而非範圍較廣的 `plugin-sdk/setup` 統整介面：

| 匯入路徑                   | 用途                                                                                      | 主要匯出項目                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | 在 `setupEntry`／延後頻道啟動中仍可使用的設定階段執行階段輔助工具 | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | 設定／安裝命令列介面／封存／文件輔助工具                                                   | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`                                                                                                                                                                                                         |

如果你需要完整的共用設定工具箱，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等設定修補輔助工具，請使用範圍較廣的 `plugin-sdk/setup` 介面。

固定的設定精靈文案請使用 `createSetupTranslator(...)`。它會依序使用 `OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES` 和 `LANG` 中第一個非空白值，然後退回使用英文。若要明確覆寫英文文案，請設定 `OPENCLAW_LOCALE=en`。外掛專屬的設定文字應放在外掛擁有的程式碼中；共用目錄索引鍵僅用於常見設定標籤、狀態文字，以及官方內建外掛的設定文案。

設定修補配接器在匯入時仍適用於熱門路徑。其內建單一帳號提升契約介面查詢採延遲執行，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器前，提前載入內建契約介面的探索程序。

### 頻道擁有的單一帳號提升

當頻道從單一帳號的頂層設定升級至 `channels.<id>.accounts.*` 時，預設的共用行為會將提升後的帳號範圍值移至 `accounts.default`。

內建頻道可透過其設定契約介面縮小或覆寫該提升行為：

- `singleAccountKeysToMove`：應移至提升後帳號的額外頂層索引鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些索引鍵會移至提升後的帳號；共用原則／傳遞索引鍵仍保留在頻道根層級
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳號接收提升後的值

<Note>
Matrix 是目前的內建範例。如果恰好已有一個具名 Matrix 帳號，或 `defaultAccount` 指向 `Ops` 之類的現有非標準索引鍵，提升程序會保留該帳號，而非建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

外掛設定會根據資訊清單中的 JSON Schema 進行驗證。使用者可透過以下方式設定外掛：

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

你的外掛會在註冊期間以 `api.pluginConfig` 接收此設定。

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

使用 `buildChannelConfigSchema` 將 Zod 結構描述轉換成外掛擁有的設定成品所使用的 `ChannelConfigSchema` 包裝函式：

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

如果你已經使用 JSON Schema 或 TypeBox 編寫契約，請使用直接輔助工具，讓 OpenClaw 能在中繼資料路徑上略過 Zod 至 JSON Schema 的轉換：

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

對於第三方外掛，冷路徑契約仍是外掛資訊清單：請將產生的 JSON Schema 鏡像至 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定及 UI 介面無須載入執行階段程式碼，即可檢查 `channels.<id>`。

## 設定精靈

頻道外掛可為 `openclaw onboard` 提供互動式設定精靈。精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "已連線",
    unconfiguredLabel: "尚未設定",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "機器人權杖",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "要使用環境中的 MY_CHANNEL_BOT_TOKEN 嗎？",
      keepPrompt: "要保留目前的權杖嗎？",
      inputPrompt: "輸入你的機器人權杖：",
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

`ChannelSetupWizard` 也支援 `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等項目。如需完整的內建範例，請參閱 Discord 外掛的 `src/setup-core.ts`。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的私訊允許清單提示，請優先使用 `openclaw/plugin-sdk/setup` 中的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準頻道設定狀態">
    對於只有標籤、分數及選用額外行有所不同的頻道設定狀態區塊，請優先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，而非在每個外掛中自行建立相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用頻道設定介面">
    對於只應在特定情境中顯示的選用設定介面，請使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "我的頻道",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // 傳回 { setupAdapter, setupWizard }
    ```

    如果你只需要該選用安裝介面的其中一半，`plugin-sdk/channel-setup` 也會公開較低階的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用轉接器／精靈在實際寫入設定時採取封閉式失敗。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 共用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="由二進位檔支援的設定輔助工具">
    對於由二進位檔支援的設定使用者介面，請優先使用共用的委派輔助工具，而不要將相同的二進位檔／狀態銜接邏輯複製到每個頻道中：

    - `createDetectedBinaryStatus(...)`：適用於僅標籤、提示、分數和二進位檔偵測有所不同的狀態區塊
    - `createCliPathTextInput(...)`：適用於以路徑為基礎的文字輸入
    - `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`：適用於 `setupEntry` 需要延遲轉交給功能更完整且較繁重的精靈時
    - `createDelegatedTextInputShouldPrompt(...)`：適用於 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 決策時

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布至 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，單純的套件規格會從 npm 安裝；但如果名稱符合隨附或官方外掛 ID，OpenClaw 會改用該本機／官方副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 來確保來源選擇具有確定性——請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

  </Tab>
  <Tab title="僅限 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或在遷移期間需要
    直接透過 npm 安裝的路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內外掛：**放置於隨附外掛工作區樹狀結構下；建置期間會自動探索這些外掛。

<Info>
對於來源為 npm 的安裝，`openclaw plugins install` 會將套件安裝到 `~/.openclaw/npm/projects` 下每個外掛各自的專案中，並停用生命週期指令碼（`--ignore-scripts`）。請讓外掛相依性樹維持為純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動時不會安裝外掛相依套件。npm/git/ClawHub 安裝流程負責使相依套件收斂一致；本機外掛的相依套件必須已事先安裝。
</Note>

隨附套件的中繼資料是明確指定的，不會在閘道啟動時從已建置的 JavaScript 推斷。執行階段相依套件應位於擁有它們的外掛套件中；封裝版 OpenClaw 啟動時絕不會修復或鏡像外掛相依套件。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整的資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
