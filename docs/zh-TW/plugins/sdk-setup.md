---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 你正在定義外掛設定結構描述或 package.json 的 OpenClaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述和 package.json 中繼資料
title: 外掛設定與配置
x-i18n:
    generated_at: "2026-07-22T10:46:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ccde36b432172f17175db9e74d0e0b7adbc50b1b047e4eaa6cbde01ef31e330e
    source_path: plugins/sdk-setup.md
    workflow: 16
---

OpenClaw 外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定結構描述的參考資料。

<Tip>
**想找逐步教學嗎？** 操作指南會在實際情境中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest)與[提供者外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要有一個 `openclaw` 欄位，用來告知外掛系統你的外掛提供哪些功能：

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
          "blurb": "頻道的簡短說明。"
        }
      }
    }
    ```
  </Tab>
  <Tab title="提供者外掛／ClawHub 基準">
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
在 ClawHub 上對外發布時，需要 `compat` 和 `build`。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。適用於工作區與 git 簽出開發的有效原始碼進入點。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` 的已建置 JavaScript 對應檔案；OpenClaw 載入已安裝的 npm 套件時會優先使用。原始碼／建置成品的解析順序請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。
</ParamField>
<ParamField path="setupEntry" type="string">
  僅供設定使用的輕量進入點（選用）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` 的已建置 JavaScript 對應檔案。也必須設定 `setupEntry`。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` 備用外掛識別資訊；當外掛沒有可用來衍生 ID 或標籤的頻道／提供者中繼資料時使用。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速入門與狀態介面的頻道目錄中繼資料。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>
<ParamField path="compat" type="object">
  此外掛支援的 `pluginApi` 版本範圍。外部 ClawHub 發布項目必須提供。
</ParamField>

<Note>
提供者 ID（`providers: string[]`）是資訊清單中繼資料，而非套件中繼資料。請在 `openclaw.plugin.json` 中宣告，而非此處；請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
</Note>

### `openclaw.channel`

`openclaw.channel` 是輕量的套件中繼資料，用於執行階段載入前的頻道探索與設定介面。

| 欄位                                   | 類型       | 意義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                     | `string`   | 標準頻道 ID。                                                         |
| `label`                     | `string`   | 主要頻道標籤。                                                        |
| `selectionLabel`                     | `string`   | 需要與 `label` 不同時使用的選擇器／設定標籤。                        |
| `detailLabel`                     | `string`   | 用於資訊更豐富的頻道目錄與狀態介面的次要詳細資料標籤。       |
| `docsPath`                     | `string`   | 設定與選擇連結所使用的文件路徑。                                      |
| `docsLabel`                     | `string`   | 文件連結的覆寫標籤；需要與頻道 ID 不同時使用。 |
| `blurb`                     | `string`   | 簡短的初始設定／目錄說明。                                         |
| `order`                     | `number`   | 頻道目錄中的排序順序。                                               |
| `aliases`                     | `string[]` | 頻道選擇的額外查詢別名。                                   |
| `preferOver`                     | `string[]` | 此頻道應優先於其上的較低優先權外掛／頻道 ID。                |
| `systemImage`                     | `string`   | 頻道 UI 目錄的選用圖示／系統影像名稱。                      |
| `selectionDocsPrefix`                     | `string`   | 選擇介面中文件連結前的前置文字。                          |
| `selectionDocsOmitLabel`                     | `boolean`  | 在選擇文案中直接顯示文件路徑，而非帶標籤的文件連結。 |
| `selectionExtras`                     | `string[]` | 附加於選擇文案中的額外短字串。                               |
| `markdownCapable`                     | `boolean`  | 將頻道標記為支援 Markdown，以供傳出格式決策使用。      |
| `exposure`                     | `object`   | 控制頻道在設定、已設定清單與文件介面中的可見性。   |
| `quickstartAllowFrom`                     | `boolean`  | 讓此頻道採用標準快速入門 `allowFrom` 設定流程。         |
| `forceAccountBinding`                     | `boolean`  | 即使僅有一個帳號，仍要求明確繫結帳號。           |
| `preferSessionLookupForAnnounceTarget`                     | `boolean`  | 解析此頻道的公告目標時，優先查詢工作階段。       |

範例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel（自行託管）",
      "detailLabel": "My Channel Bot",
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

- `configured`：在已設定／狀態類型的清單介面中包含此頻道
- `setup`：在互動式設定／組態選擇器中包含此頻道
- `docs`：在文件／導覽介面中將此頻道標記為公開顯示

### `openclaw.install`

`openclaw.install` 是套件中繼資料，而非資訊清單中繼資料。

| 欄位                         | 類型                                | 意義                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`           | `string`                            | 用於安裝／更新與初始設定隨需安裝流程的標準 ClawHub 規格。 |
| `npmSpec`           | `string`                            | 用於安裝／更新備用流程的標準 npm 規格。                             |
| `localPath`           | `string`                            | 本機開發或隨附安裝路徑。                                        |
| `defaultChoice`           | `"clawhub"` \| `"npm"` \| `"local"` | 有多個來源可用時的首選安裝來源。                     |
| `minHostVersion`           | `string`                            | 支援的最低 OpenClaw 版本，即 `>=x.y.z` 或 `>=x.y.z-prerelease`。            |
| `expectedIntegrity`           | `string`                            | 固定版本安裝所預期的 npm dist 完整性字串，通常為 `sha512-...`。    |
| `allowInvalidConfigRecovery`           | `boolean`                           | 讓隨附外掛的重新安裝流程可從特定的過時設定失敗中復原。  |
| `requiredPlatformPackages`           | `string[]`                          | npm 安裝期間驗證的必要平台專用 npm 別名。               |

<AccordionGroup>
  <Accordion title="初始設定行為">
    互動式初始設定會在隨需安裝介面中使用 `openclaw.install`：如果你的外掛在執行階段載入前公開提供者驗證選項或頻道設定／目錄中繼資料，初始設定便可提示使用者從 ClawHub、npm 或本機安裝，安裝或啟用外掛，然後繼續所選流程。ClawHub 選項使用 `clawhubSpec`，若有提供則優先採用；npm 選項需要可信任的目錄中繼資料，其中包含登錄檔 `npmSpec`（確切版本與 `expectedIntegrity` 是選用的固定值；若已設定，安裝／更新時會強制套用）。請將「要顯示什麼」放在 `openclaw.plugin.json`，並將「如何安裝」放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    若已設定 `minHostVersion`，安裝與非隨附資訊清單登錄載入都會強制執行此限制。較舊的主機會略過外部外掛；無效的版本字串會遭拒絕。隨附的原始碼外掛視為與主機簽出版本相同。
  </Accordion>
  <Accordion title="固定版本的 npm 安裝">
    對於固定版本的 npm 安裝，請將確切版本保留在 `npmSpec` 中，並加入預期的成品完整性值：

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
    `allowInvalidConfigRecovery` 並非用來繞過損壞設定的一般機制。它僅供狹義的隨附外掛復原使用，讓重新安裝／設定可以修復已知的升級殘留問題，例如缺少隨附外掛路徑，或該外掛本身具有過時的 `channels.<id>` 項目。如果設定因無關原因而損壞，安裝仍會採取封閉式失敗，並指示操作人員執行 `openclaw doctor --fix`。
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

啟用後，即使是已設定的頻道，OpenClaw 在開始監聽前的啟動階段也只會載入 `setupEntry`。完整進入點會在閘道開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會於閘道開始監聽前註冊其所需的一切（頻道註冊、HTTP 路由、閘道方法）時，才啟用延遲載入。如果完整進入點擁有啟動時必要的功能，請保留預設行為。
</Warning>

如果你的設定／完整進入點會註冊閘道 RPC 方法，請將它們置於外掛專屬的前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，且一律正規化為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄提供 `openclaw.plugin.json`。OpenClaw 會使用它，在不執行外掛程式碼的情況下驗證設定。

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

即使外掛沒有設定，也必須提供結構描述。空的結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整的結構描述參考資料請見[外掛資訊清單](/zh-TW/plugins/manifest)。

## 發布至 ClawHub

Skills 與外掛套件使用不同的 ClawHub 發布命令。對於外掛套件，請使用套件專用命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` 是用於發布 Skill 資料夾的另一個命令，並非用於外掛套件。請參閱[發布至 ClawHub](/zh-TW/clawhub/publishing)。
</Note>

## 設定進入點

`setup-entry.ts` 是 `index.ts` 的輕量替代方案，當 OpenClaw 只需要設定介面（初始設定、設定修復、檢查已停用的頻道）時便會載入它：

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入沉重的執行階段程式碼（加密函式庫、命令列介面註冊、背景服務）。

將設定安全匯出項目放在附屬模組中的內建工作區頻道，可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而非 `defineSetupPluginEntry(...)`。該內建契約也支援選用的 `runtime` 匯出項目，讓設定時的執行階段接線維持輕量且明確。

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

    這些啟動時的閘道方法仍應避開保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含的內容">
    - 命令列介面註冊。
    - 背景服務。
    - 沉重的執行階段匯入項目（加密、SDK）。
    - 僅在啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 精簡的設定輔助程式匯入

對於設定專用的熱門路徑，若只需要部分設定介面，請優先使用精簡的設定輔助程式接縫，而非較廣泛的 `plugin-sdk/setup` 統整介面：

| 匯入路徑                | 用途                                                                                | 主要匯出項目                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | 在 `setupEntry`／延遲頻道啟動期間仍可使用的設定時執行階段輔助程式 | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | 設定／安裝命令列介面／封存／文件輔助程式                                                    | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`                                                                                                                                                                                                         |

若需要完整的共用設定工具箱，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等設定修補輔助程式，請使用較廣泛的 `plugin-sdk/setup` 接縫。

固定的設定精靈文案請使用 `createSetupTranslator(...)`。它會依序使用 `OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES` 與 `LANG` 中第一個非空白值，之後才退回英文。若要明確覆寫英文，請設定 `OPENCLAW_LOCALE=en`。將外掛專屬的設定文字保留在外掛擁有的程式碼中，並且只將共用目錄鍵用於一般設定標籤、狀態文字，以及官方內建外掛的設定文案。

設定修補配接器在匯入時仍可安全用於熱門路徑。其內建單一帳號提升契約介面的查詢採延遲執行，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器前，提前載入內建契約介面的探索程序。

### 頻道擁有的設定輸入欄位

`ChannelSetupInput` 是設定呼叫端與頻道外掛共用的通用封套。其永久具型別的欄位為 `name`、`token`、`tokenFile`、`useEnv`、`allowFrom` 與 `defaultTo`。執行階段輸入物件仍可包含其他由外掛擁有的鍵，但共用型別不會宣告索引簽章。每個外掛都必須宣告並縮限自己的設定欄位，或在配接器邊界使用外掛擁有的結構描述加以驗證：

```typescript
import type { ChannelSetupAdapter, ChannelSetupInput } from "openclaw/plugin-sdk/channel-setup";

type AcmeSetupInput = ChannelSetupInput & {
  workspaceId?: string;
  webhookUrl?: string;
};

export const acmeSetupAdapter: ChannelSetupAdapter = {
  applyAccountConfig: ({ cfg, input }) => {
    const setupInput = input as AcmeSetupInput;
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        acme: {
          token: setupInput.token,
          workspaceId: setupInput.workspaceId,
          webhookUrl: setupInput.webhookUrl,
        },
      },
    };
  },
};
```

先前直接在 `ChannelSetupInput` 上宣告的頻道專屬欄位，為了外部原始碼相容性，暫時仍保有型別。這些欄位已淘汰。2026-07-22 對 426 個已發布、位於樹外的頻道外掛進行登錄檔掃描，移除了 21 個沒有讀取端的欄位，並保留了 22 個已知有讀取端的欄位。每個保留欄位都會在沒有任何已發布外掛讀取後立即刪除；不需要版本界線。新的外掛與內建外掛不得依賴此層；請在本機宣告其擁有的欄位。

### 頻道擁有的單一帳號提升

當頻道從單一帳號的頂層設定升級為 `channels.<id>.accounts.*` 時，預設共用行為會將提升後的帳號範圍值移至 `accounts.default`。

每個頻道外掛都可透過其設定配接器擴充或縮限該提升行為：

- `singleAccountKeysToMove`：應移入提升後帳號的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些鍵會移入提升後的帳號；共用原則／傳遞鍵仍保留在頻道根層級
- `resolveSingleAccountPromotionTarget(...)`：選擇由哪個現有帳號接收提升後的值

`singleAccountKeysToMove` 的存在表示提升契約已完整。即使它是空陣列，也請宣告此欄位，以選擇不進行舊版鍵提升。省略此欄位的配接器會為已發布的外掛保留一個有讀取端依據的預先宣告提升層。2026-07-22 的登錄檔掃描移除了 23 個沒有已發布相依項目的鍵，並保留了六個通用鍵及僅供設定使用的 `rooms` 鍵。每個保留鍵都會在其已發布的讀取端遷移至宣告後立即刪除；不需要版本界線。

當 doctor 必須從輕量的內建設定成品載入這些宣告時，請在外掛套件資訊清單中宣告 `openclaw.setupFeatures.configPromotion: true`。僅供設定使用的外掛介面與完整頻道外掛必須公開相同的宣告。

使用已解析的外掛呼叫 `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，請將其設定配接器以 `setupSurface` 傳入。呼叫端提供的設定介面優先於已載入與內建的查詢，這可讓具範圍限制或僅供設定使用的外掛不依賴全域註冊。

<Note>
Matrix 是目前的內建範例。如果恰好已有一個具名 Matrix 帳號，或 `defaultAccount` 指向現有的非標準鍵（例如 `Ops`），提升作業會保留該帳號，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

外掛設定會依照資訊清單中的 JSON Schema 進行驗證。使用者可透過以下方式設定外掛：

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

### 建構頻道設定結構描述

使用 `buildChannelConfigSchema` 將 Zod 結構描述轉換為外掛擁有的設定成品所使用的 `ChannelConfigSchema` 包裝器：

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

如果你已使用 JSON Schema 或 TypeBox 撰寫契約，請使用直接輔助程式，讓 OpenClaw 可在中繼資料路徑上略過 Zod 至 JSON Schema 的轉換：

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

對於第三方外掛，冷路徑契約仍是外掛資訊清單：請將產生的 JSON Schema 鏡像至 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定流程與 UI 介面可在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

Channel 外掛可為 `openclaw onboard` 提供互動式設定精靈。此精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 也支援 `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等功能。如需完整的內建範例，請參閱 Discord 外掛的 `src/setup-core.ts`。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需標準 `note -> prompt -> parse -> merge -> patch` 流程的私訊允許清單提示，優先使用 `openclaw/plugin-sdk/setup` 中的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準 Channel 設定狀態">
    對於僅標籤、分數與選用額外行不同的 Channel 設定狀態區塊，優先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，不要在每個外掛中手動建立相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用 Channel 設定介面">
    對於只應在特定情境中顯示的選用設定介面，請使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "我的 Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // 傳回 { setupAdapter, setupWizard }
    ```

    當你只需要該選用安裝介面的其中一半時，`plugin-sdk/channel-setup` 也會公開較低階的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用轉接器／精靈會在實際寫入設定時採取失敗關閉策略。它們在 `validateInput`、`applyAccountConfig` 和 `finalize` 中重複使用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="以二進位檔為後端的設定輔助工具">
    對於以二進位檔為後端的設定 UI，優先使用共用的委派輔助工具，不要將相同的二進位檔／狀態黏合程式碼複製到每個 Channel：

    - `createDetectedBinaryStatus(...)`：適用於僅標籤、提示、分數與二進位檔偵測不同的狀態區塊
    - `createCliPathTextInput(...)`：適用於以路徑為後端的文字輸入
    - `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`：適用於 `setupEntry` 需要延遲轉送至較大型完整精靈時
    - `createDelegatedTextInputShouldPrompt(...)`：適用於 `setupEntry` 只需委派 `textInputs[*].shouldPrompt` 決策時

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布至 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，單純的套件規格會從 npm 安裝；若名稱符合內建或官方外掛 ID，OpenClaw 則會改用該本機／官方副本。若要確定性地選擇來源，請使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`，詳情請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

  </Tab>
  <Tab title="僅限 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或在移轉期間需要
    直接從 npm 安裝的路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內外掛：**放置於內建外掛工作區樹狀目錄下；建置時會自動探索這些外掛。

<Info>
對於來源為 npm 的安裝，`openclaw plugins install` 會將套件安裝至 `~/.openclaw/npm/projects` 下每個外掛各自的專案，並停用生命週期指令碼（`--ignore-scripts`）。外掛相依性樹應保持為純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動時不會安裝外掛相依性。npm/git/ClawHub 安裝流程負責使相依性收斂；本機外掛必須已安裝其相依性。
</Note>

內建套件中繼資料是明確定義的，不會在閘道啟動時從已建置的 JavaScript 推斷。執行階段相依性應屬於擁有它們的外掛套件；封裝版 OpenClaw 啟動時絕不會修復或鏡像外掛相依性。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整的資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
