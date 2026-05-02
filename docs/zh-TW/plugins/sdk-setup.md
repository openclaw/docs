---
read_when:
    - 你正在為 Plugin 新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 您正在定義 Plugin 設定結構描述或 package.json 的 openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述和 package.json 中繼資料
title: Plugin 設定與組態
x-i18n:
    generated_at: "2026-05-02T21:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin 封裝（`package.json` 中繼資料）、清單（`openclaw.plugin.json`）、設定項目與設定結構描述的參考。

<Tip>
**在找逐步教學嗎？** 操作指南會在脈絡中說明封裝：[Channel plugins](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest) 與 [Provider plugins](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，用來告訴 Plugin 系統你的 Plugin 提供什麼：

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
如果你在 ClawHub 對外發布 Plugin，這些 `compat` 與 `build` 欄位是必要的。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。
</ParamField>
<ParamField path="setupEntry" type="string">
  輕量的僅設定進入點（選用）。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速開始與狀態介面的頻道目錄中繼資料。
</ParamField>
<ParamField path="providers" type="string[]">
  此 Plugin 註冊的提供者 ID。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是低成本的套件中繼資料，用於在執行階段載入前探索頻道與顯示設定介面。

| 欄位                                   | 類型       | 含義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道 ID。                                                                 |
| `label`                                | `string`   | 主要頻道標籤。                                                                |
| `selectionLabel`                       | `string`   | 當需要不同於 `label` 時，選擇器/設定標籤。                                    |
| `detailLabel`                          | `string`   | 用於更完整頻道目錄與狀態介面的次要詳細標籤。                                  |
| `docsPath`                             | `string`   | 用於設定與選取連結的文件路徑。                                                |
| `docsLabel`                            | `string`   | 當需要不同於頻道 ID 時，覆寫文件連結使用的標籤。                              |
| `blurb`                                | `string`   | 簡短的入門/目錄描述。                                                         |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                              | `string[]` | 用於頻道選取的額外查找別名。                                                  |
| `preferOver`                           | `string[]` | 此頻道應優先於哪些較低優先順序的 Plugin/頻道 ID。                            |
| `systemImage`                          | `string`   | 頻道 UI 目錄的選用圖示/系統影像名稱。                                         |
| `selectionDocsPrefix`                  | `string`   | 選取介面中文件連結前的前綴文字。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在選取文案中直接顯示文件路徑，而不是帶標籤的文件連結。                        |
| `selectionExtras`                      | `string[]` | 附加到選取文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 Markdown，以供外寄格式決策使用。                             |
| `exposure`                             | `object`   | 控制頻道在設定、已設定清單與文件介面中的可見性。                              |
| `quickstartAllowFrom`                  | `boolean`  | 將此頻道納入標準快速開始 `allowFrom` 設定流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一個帳號，也要求明確的帳號綁定。                                    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時，偏好使用工作階段查找。                                |

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

- `configured`：將頻道包含在已設定/狀態樣式的清單介面中
- `setup`：將頻道包含在互動式設定/組態選擇器中
- `docs`：將頻道標記為在文件/導覽介面中公開顯示

<Note>
`showConfigured` 與 `showInSetup` 仍作為舊版別名受到支援。建議使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是清單中繼資料。

| 欄位                         | 類型                                | 含義                                                                                |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝/更新與入門隨選安裝流程的標準 ClawHub 規格。                               |
| `npmSpec`                    | `string`                            | 用於安裝/更新後援流程的標準 npm 規格。                                              |
| `localPath`                  | `string`                            | 本機開發或隨附安裝路徑。                                                            |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 當有多個來源可用時的偏好安裝來源。                                                  |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z` 或 `>=x.y.z-prerelease`。                |
| `expectedIntegrity`          | `string`                            | 預期的 npm dist 完整性字串，通常為 `sha512-...`，用於釘選安裝。                     |
| `allowInvalidConfigRecovery` | `boolean`                           | 讓隨附 Plugin 重新安裝流程可從特定過時設定失敗中復原。                              |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    互動式入門也會使用 `openclaw.install` 來呈現隨選安裝介面。如果你的 Plugin 在執行階段載入前公開提供者驗證選項或頻道設定/目錄中繼資料，入門流程可以顯示該選項，提示使用 ClawHub、npm 或本機安裝，安裝或啟用 Plugin，然後繼續選取的流程。ClawHub 入門選項會使用 `clawhubSpec`，且存在時會優先採用；npm 選項需要可信任的目錄中繼資料並包含登錄檔 `npmSpec`；精確版本與 `expectedIntegrity` 是選用的 npm 釘選。如果存在 `expectedIntegrity`，安裝/更新流程會針對 npm 強制檢查它。請將「要顯示什麼」的中繼資料放在 `openclaw.plugin.json`，並將「如何安裝它」的中繼資料放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    如果設定了 `minHostVersion`，安裝與非隨附清單登錄載入都會強制執行它。較舊的主機會略過外部 Plugin；無效的版本字串會遭到拒絕。隨附來源 Plugin 會假定與主機 checkout 版本一致。
  </Accordion>
  <Accordion title="Pinned npm installs">
    對於釘選的 npm 安裝，請在 `npmSpec` 中保留精確版本，並加入預期的成品完整性：

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
    `allowInvalidConfigRecovery` 不是損壞設定的一般性繞過機制。它只用於狹窄的隨附 Plugin 復原情境，讓重新安裝/設定可以修復已知的升級殘留，例如缺少隨附 Plugin 路徑，或同一 Plugin 的過時 `channels.<id>` 項目。如果設定因無關原因損壞，安裝仍會以失敗關閉，並提示操作員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道 Plugin 可以使用下列設定選擇延後載入：

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

啟用後，即使是已設定的頻道，OpenClaw 在監聽前啟動階段也只會載入 `setupEntry`。完整進入點會在 Gateway 開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會於 Gateway 開始監聽前註冊它所需的一切（頻道註冊、HTTP 路由、Gateway 方法）時，才啟用延後載入。如果完整進入點擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入點會註冊 Gateway RPC 方法，請將它們放在 Plugin 專屬前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，並且一律解析為 `operator.admin`。

## Plugin 清單

每個原生 Plugin 都必須在套件根目錄隨附 `openclaw.plugin.json`。OpenClaw 會使用它在不執行 Plugin 程式碼的情況下驗證設定。

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

對於頻道 Plugin，請加入 `kind` 與 `channels`：

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

即使 Plugin 沒有設定，也必須隨附結構描述。空結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整結構描述參考請見 [Plugin manifest](/zh-TW/plugins/manifest)。

## ClawHub 發布

對於 Plugin 套件，請使用套件專屬的 ClawHub 指令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
舊版僅限 skill 的發布別名是供 skills 使用。Plugin 套件應一律使用 `clawhub package publish`。
</Note>

## 設定入口

`setup-entry.ts` 檔案是 `index.ts` 的輕量替代方案，OpenClaw 只需要設定介面時會載入它（初始設定、設定修復、停用頻道檢查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入繁重的執行階段程式碼（加密函式庫、CLI 註冊、背景服務）。

將設定安全匯出保留在 sidecar 模組中的內建工作區頻道，可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，因此設定期間的執行階段接線可以保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整入口">
    - 頻道已停用，但需要設定／初始設定介面。
    - 頻道已啟用但尚未設定。
    - 已啟用延遲載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊什麼">
    - 頻道 Plugin 物件（透過 `defineSetupPluginEntry`）。
    - Gateway listen 前需要的任何 HTTP 路由。
    - 啟動期間需要的任何 Gateway 方法。

    這些啟動 Gateway 方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含什麼">
    - CLI 註冊。
    - 背景服務。
    - 繁重的執行階段匯入（加密、SDK）。
    - 僅在啟動後才需要的 Gateway 方法。

  </Accordion>
</AccordionGroup>

### 窄範圍設定輔助匯入

對於熱門的純設定路徑，若你只需要設定介面的一部分，請優先使用窄範圍設定輔助接縫，而不是較廣的 `plugin-sdk/setup` 總括匯入：

| 匯入路徑                        | 用途                                                                                | 主要匯出                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延遲頻道啟動中保持可用的設定期間執行階段輔助工具 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 感知環境的帳號設定配接器                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 設定／安裝 CLI／封存／文件輔助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

當你需要完整共用設定工具箱時，請使用較廣的 `plugin-sdk/setup` 接縫，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具。

設定修補配接器在匯入時保持熱門路徑安全。它們內建的單帳號提升合約介面查找是惰性的，因此匯入 `plugin-sdk/setup-runtime` 不會在配接器實際使用前急切載入內建合約介面探索。

### 頻道擁有的單帳號提升

當頻道從單帳號頂層設定升級到 `channels.<id>.accounts.*` 時，預設的共用行為是將提升後的帳號範圍值移入 `accounts.default`。

內建頻道可以透過其設定合約介面縮窄或覆寫該提升：

- `singleAccountKeysToMove`：應移入提升帳號的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些鍵會移入提升帳號；共用政策／遞送鍵會保留在頻道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳號接收提升值

<Note>
Matrix 是目前的內建範例。如果剛好已存在一個具名 Matrix 帳號，或如果 `defaultAccount` 指向現有的非標準鍵（例如 `Ops`），提升會保留該帳號，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

Plugin 設定會依據 manifest 中的 JSON Schema 驗證。使用者可透過以下方式設定 Plugin：

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

使用 `buildChannelConfigSchema` 將 Zod schema 轉換為 Plugin 擁有的設定成品所使用的 `ChannelConfigSchema` 包裝器：

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

如果你已經將合約撰寫為 JSON Schema 或 TypeBox，請使用直接輔助工具，讓 OpenClaw 可在中繼資料路徑上略過 Zod 到 JSON Schema 的轉換：

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

對於第三方 Plugin，冷路徑合約仍是 Plugin manifest：將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定和 UI 介面可在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

頻道 Plugin 可為 `openclaw onboard` 提供互動式設定精靈。精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 型別支援 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整範例請參閱內建 Plugin 套件（例如 Discord Plugin 的 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的 DM allowlist 提示，請優先使用來自 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準頻道設定狀態">
    對於只因標籤、分數和選用額外行而不同的頻道設定狀態區塊，請優先使用來自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個 Plugin 中手寫相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用頻道設定介面">
    對於只應在特定情境中出現的選用設定介面，請使用來自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

    產生的選用配接器／精靈會在實際設定寫入時封閉失敗。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 之間重用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="二進位支援的設定輔助工具">
    對於二進位支援的設定 UI，請優先使用共用委派輔助工具，而不是在每個頻道中複製相同的二進位／狀態黏合程式碼：

    - `createDetectedBinaryStatus(...)` 用於只因標籤、提示、分數和二進位偵測而不同的狀態區塊
    - `createCliPathTextInput(...)` 用於路徑支援的文字輸入
    - 當 `setupEntry` 需要惰性轉發到較重的完整精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 決策時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部 Plugin：**發布到 [ClawHub](/zh-TW/tools/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在發布切換期間，裸套件規格會從 npm 安裝。

  </Tab>
  <Tab title="僅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或你在遷移期間需要
    直接 npm 安裝路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內 Plugin：** 放在隨附的 Plugin 工作區樹狀結構下，它們會在建置期間自動被探索。

**使用者可以安裝：**

```bash
openclaw plugins install <package-name>
```

<Info>
對於來源為 npm 的安裝，`openclaw plugins install` 會在停用生命週期指令碼的情況下，將套件安裝到 `~/.openclaw/npm` 下。請保持 Plugin 依賴樹為純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
Gateway 啟動不會安裝 Plugin 依賴項。npm/git/ClawHub 安裝流程負責依賴項收斂；本機 Plugin 必須已經安裝其依賴項。
</Note>

隨附套件中繼資料是明確定義的，不會在 Gateway 啟動時從已建置的 JavaScript 推斷。執行階段依賴項應屬於擁有它們的 Plugin 套件；已封裝的 OpenClaw 啟動程序絕不會修復或鏡像 Plugin 依賴項。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [Plugin manifest](/zh-TW/plugins/manifest) — 完整 manifest schema 參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
