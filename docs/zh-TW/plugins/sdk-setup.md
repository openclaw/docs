---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 你正在定義外掛設定結構描述或 package.json openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、config schemas 與 package.json 中繼資料
title: 外掛設定與組態
x-i18n:
    generated_at: "2026-07-05T11:37:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

參考外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定結構描述。

<Tip>
**正在尋找逐步教學嗎？** 操作指南會在情境中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest)與[提供者外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，用來告訴外掛系統你的外掛提供哪些功能：

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
在 ClawHub 對外發布需要 `compat` 和 `build`。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。適用於工作區與 git checkout 開發的有效原始碼進入項目。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` 對應的已建置 JavaScript 同層檔案，OpenClaw 載入已安裝的 npm 套件時優先使用。請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)了解原始碼/已建置解析順序。
</ParamField>
<ParamField path="setupEntry" type="string">
  輕量的僅設定進入項目（選用）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` 對應的已建置 JavaScript 同層檔案。也必須設定 `setupEntry`。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` 後備外掛身分，用於外掛沒有可衍生 id 或 label 的頻道/提供者中繼資料時。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速開始與狀態介面的頻道目錄中繼資料。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>
<ParamField path="compat" type="object">
  此外掛支援的 `pluginApi` 版本範圍。外部 ClawHub 發布時為必填。
</ParamField>

<Note>
提供者 id（`providers: string[]`）是資訊清單中繼資料，不是套件中繼資料。請在 `openclaw.plugin.json` 中宣告它們，而不是這裡 — 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
</Note>

### `openclaw.channel`

`openclaw.channel` 是輕量的套件中繼資料，用於執行階段載入前的頻道探索與設定介面。

| 欄位                                   | 型別       | 含義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道 id。                                                                |
| `label`                                | `string`   | 主要頻道標籤。                                                               |
| `selectionLabel`                       | `string`   | 當需要不同於 `label` 時，用於選擇器/設定的標籤。                              |
| `detailLabel`                          | `string`   | 用於更豐富頻道目錄與狀態介面的次要詳細標籤。                                 |
| `docsPath`                             | `string`   | 用於設定與選擇連結的文件路徑。                                                |
| `docsLabel`                            | `string`   | 當文件連結標籤需要不同於頻道 id 時使用的覆寫標籤。                            |
| `blurb`                                | `string`   | 簡短的導覽/目錄描述。                                                         |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                              | `string[]` | 用於頻道選擇的額外查找別名。                                                  |
| `preferOver`                           | `string[]` | 此頻道應優先於哪些較低優先度的外掛/頻道 id。                                  |
| `systemImage`                          | `string`   | 頻道 UI 目錄的選用圖示/系統圖片名稱。                                         |
| `selectionDocsPrefix`                  | `string`   | 選擇介面中文件連結前的前綴文字。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在選擇文案中直接顯示文件路徑，而不是帶標籤的文件連結。                        |
| `selectionExtras`                      | `string[]` | 附加在選擇文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 markdown，以供外送格式決策使用。                             |
| `exposure`                             | `object`   | 頻道在設定、已設定清單與文件介面中的可見性控制。                              |
| `quickstartAllowFrom`                  | `boolean`  | 讓此頻道加入標準快速開始 `allowFrom` 設定流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只有一個帳號存在，也要求明確繫結帳號。                                    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時，優先使用工作階段查找。                                |

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

- `configured`：將頻道納入已設定/狀態類型的列表介面
- `setup`：將頻道納入互動式設定/配置選擇器
- `docs`：在文件/導覽介面中將頻道標記為公開可見

<Note>
`showConfigured` 和 `showInSetup` 仍作為舊版別名受到支援。建議使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是資訊清單中繼資料。

| 欄位                         | 型別                                | 含義                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝/更新與導覽按需安裝流程的標準 ClawHub 規格。                              |
| `npmSpec`                    | `string`                            | 用於安裝/更新後備流程的標準 npm 規格。                                            |
| `localPath`                  | `string`                            | 本機開發或 bundled 安裝路徑。                                                     |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 有多個來源可用時偏好的安裝來源。                                                  |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，`>=x.y.z` 或 `>=x.y.z-prerelease`。                      |
| `expectedIntegrity`          | `string`                            | 預期的 npm dist 完整性字串，通常為 `sha512-...`，用於固定版本安裝。               |
| `allowInvalidConfigRecovery` | `boolean`                           | 允許 bundled 外掛重新安裝流程從特定過期設定失敗中復原。                           |
| `requiredPlatformPackages`   | `string[]`                          | npm 安裝期間驗證的必要平台特定 npm 別名。                                         |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    互動式導覽會使用 `openclaw.install` 來處理按需安裝介面：如果你的外掛在執行階段載入前公開提供者驗證選項或頻道設定/目錄中繼資料，導覽可以提示使用 ClawHub、npm 或本機安裝，安裝或啟用外掛，然後繼續所選流程。ClawHub 選項使用 `clawhubSpec`，且在存在時優先使用；npm 選項需要帶有註冊表 `npmSpec` 的可信目錄中繼資料（精確版本與 `expectedIntegrity` 是選用固定值，設定時會在安裝/更新時強制執行）。請將「要顯示什麼」放在 `openclaw.plugin.json`，將「如何安裝它」放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    如果設定了 `minHostVersion`，安裝與非 bundled 資訊清單註冊表載入都會強制檢查它。較舊的主機會略過外部外掛；無效版本字串會被拒絕。Bundled 原始碼外掛會被視為與主機 checkout 同版本。
  </Accordion>
  <Accordion title="Pinned npm installs">
    對於固定版本的 npm 安裝，請在 `npmSpec` 中保留精確版本，並加入預期的成品完整性：

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
    `allowInvalidConfigRecovery` 不是壞掉設定的一般性繞過方式。它只限於狹窄的 bundled 外掛復原，允許重新安裝/設定修復已知升級殘留，例如缺少 bundled 外掛路徑，或同一外掛過期的 `channels.<id>` 項目。如果設定因無關原因損壞，安裝仍會失敗關閉，並告知操作員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道外掛可以透過以下方式選擇延後載入：

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

啟用後，即使是已設定的頻道，OpenClaw 在 listen 前的啟動階段也只會載入 `setupEntry`。完整進入項目會在閘道開始 listening 後載入。

<Warning>
只有在你的 `setupEntry` 會於閘道開始 listening 前註冊閘道所需的一切內容（頻道註冊、HTTP 路由、閘道方法）時，才啟用延後載入。如果完整進入項目擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入項目會註冊閘道 RPC 方法，請將它們放在外掛專屬前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）維持由核心擁有，且一律正規化為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄中隨附 `openclaw.plugin.json`。OpenClaw 會用它在不執行外掛程式碼的情況下驗證設定。

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

對於頻道外掛，加入 `channels`（供應商外掛則加入 `providers`）：

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

即使是不含設定的外掛，也必須隨附綱要。空綱要是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整綱要參考請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

## ClawHub 發布

Skills 和外掛套件使用不同的 ClawHub 發布命令。對於外掛套件，請使用套件專用命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` 是用來發布 skill 資料夾的不同命令，不是用來發布外掛套件。請參閱[在 ClawHub 上發布](/zh-TW/clawhub/publishing)。
</Note>

## 設定進入點

`setup-entry.ts` 是 `index.ts` 的輕量替代方案，OpenClaw 會在只需要設定介面（上線導引、設定修復、停用頻道檢查）時載入它：

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程中載入繁重的執行階段程式碼（加密函式庫、命令列介面註冊、背景服務）。

將設定安全匯出保留在附屬模組中的內建工作區頻道，可以改用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，讓設定時的執行階段接線能保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整進入點">
    - 頻道已停用，但需要設定/上線導引介面。
    - 頻道已啟用但尚未設定。
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
    - 繁重的執行階段匯入（加密、SDK）。
    - 只有啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 精簡設定輔助工具匯入

對於熱門的僅設定路徑，當你只需要設定介面的一部分時，優先使用精簡的設定輔助工具接縫，而不是較寬泛的 `plugin-sdk/setup` 傘狀介面：

| 匯入路徑                        | 用途                                                                                | 主要匯出                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 設定時執行階段輔助工具，會在 `setupEntry` / 延遲頻道啟動中保持可用 | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 設定/安裝命令列介面/封存/文件輔助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

當你需要完整的共用設定工具箱，包括像 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具時，請使用較寬泛的 `plugin-sdk/setup` 接縫。

使用 `createSetupTranslator(...)` 來處理固定的設定精靈文字。它會遵循命令列介面精靈語言環境（`OPENCLAW_LOCALE`，再來是系統語言環境變數），並回退到英文。請將外掛專屬的設定文字保留在外掛擁有的程式碼中，並且只將共用目錄鍵用於常見設定標籤、狀態文字，以及官方內建外掛的設定文字。

設定修補配接器在匯入時仍保持熱門路徑安全。其內建單一帳戶提升合約介面查詢是延遲的，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器前急切載入內建合約介面探索。

### 頻道擁有的單一帳戶提升

當頻道從單一帳戶頂層設定升級到 `channels.<id>.accounts.*` 時，預設共用行為會將提升後的帳戶範圍值移到 `accounts.default`。

內建頻道可以透過其設定合約介面縮小或覆寫該提升：

- `singleAccountKeysToMove`：應移入提升帳戶的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳戶已存在時，只有這些鍵會移入提升帳戶；共用政策/傳遞鍵會留在頻道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳戶接收提升後的值

<Note>
Matrix 是目前的內建範例。如果剛好已有一個具名 Matrix 帳戶，或如果 `defaultAccount` 指向現有的非標準鍵（例如 `Ops`），提升會保留該帳戶，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定綱要

外掛設定會根據你資訊清單中的 JSON Schema 驗證。使用者透過以下方式設定外掛：

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

你的外掛在註冊期間會以 `api.pluginConfig` 接收此設定。

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

### 建立頻道設定綱要

使用 `buildChannelConfigSchema` 將 Zod 綱要轉換為外掛擁有的設定成品所使用的 `ChannelConfigSchema` 包裝器：

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

如果你已經以 JSON Schema 或 TypeBox 編寫合約，請使用直接輔助工具，讓 OpenClaw 可在中繼資料路徑上跳過 Zod 到 JSON Schema 的轉換：

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

對於第三方外掛，冷路徑合約仍然是外掛資訊清單：請將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定綱要、設定和 UI 介面能在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

頻道外掛可以為 `openclaw onboard` 提供互動式設定精靈。該精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 也支援 `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整的內建範例請參閱 Discord 外掛的 `src/setup-core.ts`。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的 DM allowlist 提示，優先使用 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準頻道設定狀態">
    對於只因標籤、分數和選用額外行而不同的頻道設定狀態區塊，優先使用 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個外掛中手寫相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用頻道設定介面">
    對於只應在特定內容中出現的選用設定介面，請使用 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

    當你只需要該選用安裝介面的一半時，`plugin-sdk/channel-setup` 也公開較低階的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用配接器／精靈在真正寫入設定時採取失敗即關閉。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 之間重複使用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="以二進位檔為後端的設定輔助工具">
    對於以二進位檔為後端的設定 UI，請優先使用共用的委派輔助工具，而不是在每個頻道中複製相同的二進位檔／狀態黏合程式碼：

    - `createDetectedBinaryStatus(...)` 用於僅依標籤、提示、分數和二進位檔偵測而變化的狀態區塊
    - `createCliPathTextInput(...)` 用於以路徑為後端的文字輸入
    - 當 `setupEntry` 需要延遲轉發至較重的完整精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 決策時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布到 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，裸套件規格會從 npm 安裝，除非名稱符合已內建或官方外掛 id，在該情況下 OpenClaw 會改用該本機／官方副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 進行確定性的來源選擇 — 請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

  </Tab>
  <Tab title="僅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或在遷移期間需要直接的 npm 安裝路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內外掛：**放在內建外掛工作區樹狀結構下；它們會在建置期間自動被發現。

<Info>
對於來自 npm 的安裝，`openclaw plugins install` 會將套件安裝到 `~/.openclaw/npm/projects` 下的每個外掛專案中，並停用生命週期指令碼（`--ignore-scripts`）。請讓外掛相依性樹保持純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動不會安裝外掛相依性。npm/git/ClawHub 安裝流程負責相依性收斂；本機外掛必須已安裝其相依性。
</Note>

內建套件中繼資料是明確的，不會在閘道啟動時從已建置的 JavaScript 推斷。執行階段相依性應屬於擁有它們的外掛套件；已封裝的 OpenClaw 啟動永遠不會修復或鏡像外掛相依性。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
