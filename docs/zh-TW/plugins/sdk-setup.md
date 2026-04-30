---
read_when:
    - 你正在為 Plugin 新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 你正在定義 Plugin 設定結構描述或 package.json 的 openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述，以及 package.json 中繼資料
title: Plugin 設定與組態
x-i18n:
    generated_at: "2026-04-30T03:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin 封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定架構的參考。

<Tip>
**想找逐步教學嗎？** 操作指南會在情境中說明封裝：[Channel plugins](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest) 與 [Provider plugins](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
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
如果你在 ClawHub 上對外發布 Plugin，這些 `compat` 與 `build` 欄位是必填的。標準發布片段位於 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 欄位

<ParamField path="extensions" type="string[]">
  進入點檔案（相對於套件根目錄）。
</ParamField>
<ParamField path="setupEntry" type="string">
  輕量的僅設定用進入點（選用）。
</ParamField>
<ParamField path="channel" type="object">
  用於設定、選擇器、快速入門與狀態介面的頻道目錄中繼資料。
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

`openclaw.channel` 是在執行階段載入前，用於頻道探索與設定介面的輕量套件中繼資料。

| 欄位                                  | 類型       | 意義                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道 id。                                                         |
| `label`                                | `string`   | 主要頻道標籤。                                                        |
| `selectionLabel`                       | `string`   | 當需要不同於 `label` 時，用於選擇器/設定的標籤。                        |
| `detailLabel`                          | `string`   | 用於更豐富的頻道目錄和狀態介面的次要詳細標籤。       |
| `docsPath`                             | `string`   | 用於設定與選擇連結的文件路徑。                                      |
| `docsLabel`                            | `string`   | 當需要不同於頻道 id 時，用於文件連結的覆寫標籤。 |
| `blurb`                                | `string`   | 簡短的上手/目錄說明。                                         |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                               |
| `aliases`                              | `string[]` | 用於頻道選擇的額外查找別名。                                   |
| `preferOver`                           | `string[]` | 此頻道應優先於其上的低優先順序 Plugin/頻道 id。                |
| `systemImage`                          | `string`   | 頻道 UI 目錄的可選圖示/系統影像名稱。                      |
| `selectionDocsPrefix`                  | `string`   | 選擇介面中文件連結前的前綴文字。                          |
| `selectionDocsOmitLabel`               | `boolean`  | 在選擇文案中直接顯示文件路徑，而非帶標籤的文件連結。 |
| `selectionExtras`                      | `string[]` | 附加到選擇文案中的額外短字串。                               |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 markdown，用於輸出格式化決策。      |
| `exposure`                             | `object`   | 用於設定、已設定清單和文件介面的頻道可見性控制。   |
| `quickstartAllowFrom`                  | `boolean`  | 讓此頻道加入標準快速開始 `allowFrom` 設定流程。         |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一個帳戶，也要求明確綁定帳戶。           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時，優先使用工作階段查找。       |

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

- `configured`：將頻道納入已設定/狀態樣式的清單介面
- `setup`：將頻道納入互動式設定/配置選擇器
- `docs`：將頻道標記為文件/導覽介面中的公開項目

<Note>
`showConfigured` 和 `showInSetup` 仍作為舊版別名支援。建議使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是 manifest 中繼資料。

| 欄位                        | 類型                 | 意義                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 用於安裝/更新流程的標準 npm 規格。                                     |
| `localPath`                  | `string`             | 本機開發或 bundled 安裝路徑。                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | 當兩者都可用時偏好的安裝來源。                                |
| `minHostVersion`             | `string`             | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z`。                        |
| `expectedIntegrity`          | `string`             | 預期的 npm dist 完整性字串，通常為 `sha512-...`，用於釘選安裝。   |
| `allowInvalidConfigRecovery` | `boolean`            | 允許 bundled-plugin 重新安裝流程從特定過期設定失敗中復原。 |

<AccordionGroup>
  <Accordion title="上手行為">
    互動式上手流程也會將 `openclaw.install` 用於按需安裝介面。如果你的 Plugin 在 runtime 載入前公開提供者驗證選項或頻道設定/目錄中繼資料，上手流程可以顯示該選項、提示選擇 npm 或本機安裝、安裝或啟用 Plugin，然後繼續所選流程。Npm 上手選項需要帶有 registry `npmSpec` 的受信任目錄中繼資料；精確版本和 `expectedIntegrity` 是可選釘選。如果存在 `expectedIntegrity`，安裝/更新流程會強制執行它。將「要顯示什麼」的中繼資料放在 `openclaw.plugin.json`，並將「如何安裝它」的中繼資料放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    如果設定了 `minHostVersion`，安裝和 manifest-registry 載入都會強制執行它。較舊的 host 會略過 Plugin；無效的版本字串會被拒絕。
  </Accordion>
  <Accordion title="釘選 npm 安裝">
    對於釘選 npm 安裝，請在 `npmSpec` 中保留精確版本，並新增預期的成品完整性：

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
    `allowInvalidConfigRecovery` 不是破損設定的一般性繞過機制。它只用於範圍狹窄的內建 Plugin 復原，因此重新安裝/設定可以修復已知的升級殘留項，例如缺少的內建 Plugin 路徑，或同一個 Plugin 的過時 `channels.<id>` 項目。如果設定因無關原因而損壞，安裝仍會封閉失敗，並告知操作員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道 Plugin 可以透過以下方式選擇加入延後載入：

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
只有在你的 `setupEntry` 會註冊 Gateway 開始監聽前所需的一切內容時，才啟用延後載入（頻道註冊、HTTP 路由、Gateway 方法）。如果完整進入點擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入點會註冊 Gateway RPC 方法，請將它們保留在 Plugin 專屬前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，並且一律解析為 `operator.admin`。

## Plugin 清單

每個原生 Plugin 都必須在套件根目錄提供 `openclaw.plugin.json`。OpenClaw 會使用它在不執行 Plugin 程式碼的情況下驗證設定。

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

對於頻道 Plugin，請新增 `kind` 和 `channels`：

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

即使沒有設定的 Plugin 也必須提供 schema。空 schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

請參閱 [Plugin 清單](/zh-TW/plugins/manifest) 以取得完整的 schema 參考。

## ClawHub 發佈

對於 Plugin 套件，請使用套件專屬的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
舊版僅限 skill 的發佈別名是給 skills 使用的。Plugin 套件應一律使用 `clawhub package publish`。
</Note>

## 設定進入點

`setup-entry.ts` 檔案是 `index.ts` 的輕量替代方案，OpenClaw 會在只需要設定介面時載入它（新手引導、設定修復、停用頻道檢查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入繁重的執行階段程式碼（加密函式庫、CLI 註冊、背景服務）。

將設定安全匯出保留在 sidecar 模組中的內建工作區通道，可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，讓設定期間的執行階段接線能保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整進入點">
    - 通道已停用，但需要設定/導入介面。
    - 通道已啟用但尚未設定。
    - 已啟用延後載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊的內容">
    - 通道 Plugin 物件（透過 `defineSetupPluginEntry`）。
    - Gateway listen 之前所需的任何 HTTP 路由。
    - 啟動期間所需的任何 Gateway 方法。

    這些啟動 Gateway 方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含的內容">
    - CLI 註冊。
    - 背景服務。
    - 繁重的執行階段匯入（加密、SDK）。
    - 僅在啟動後才需要的 Gateway 方法。

  </Accordion>
</AccordionGroup>

### 狹窄的設定輔助工具匯入

對於熱門的僅設定路徑，當你只需要設定介面的一部分時，請優先使用狹窄的設定輔助工具接縫，而不是較廣泛的 `plugin-sdk/setup` 總括匯入：

| 匯入路徑                        | 用途                                                                                | 主要匯出                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 設定期間的執行階段輔助工具，會在 `setupEntry` / 延後通道啟動中保持可用 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 感知環境的帳戶設定配接器                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 設定/安裝 CLI/封存/文件輔助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

當你需要完整的共用設定工具箱，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具時，請使用較廣泛的 `plugin-sdk/setup` 接縫。

設定修補配接器在匯入時會保持熱門路徑安全。其內建單帳戶提升合約介面查找是延遲的，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器之前，急切載入內建合約介面探索。

### 通道擁有的單帳戶提升

當通道從單帳戶頂層設定升級為 `channels.<id>.accounts.*` 時，預設共用行為是將提升後的帳戶範圍值移入 `accounts.default`。

內建通道可以透過其設定合約介面縮小或覆寫該提升：

- `singleAccountKeysToMove`：應移入提升帳戶的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳戶已存在時，只有這些鍵會移入提升帳戶；共用政策/遞送鍵會保留在通道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳戶接收提升值

<Note>
Matrix 是目前的內建範例。如果剛好已存在一個具名 Matrix 帳戶，或 `defaultAccount` 指向現有的非標準鍵，例如 `Ops`，提升會保留該帳戶，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定 schema

Plugin 設定會根據 manifest 中的 JSON Schema 進行驗證。使用者可透過以下方式設定 Plugin：

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

對於通道專屬設定，請改用通道設定區段：

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

### 建立通道設定 schema

使用 `buildChannelConfigSchema` 將 Zod schema 轉換為 Plugin 擁有的設定成品所使用的 `ChannelConfigSchema` 包裝：

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

對於第三方 Plugin，冷路徑合約仍是 Plugin manifest：將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定 schema、設定流程和 UI 介面可以在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

通道 Plugin 可以為 `openclaw onboard` 提供互動式設定精靈。精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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
  <Accordion title="標準通道設定狀態">
    對於只因標籤、分數和選用額外行而有所不同的通道設定狀態區塊，請優先使用來自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個 Plugin 中手寫相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用通道設定介面">
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

    產生的選用配接器/精靈會在實際設定寫入時封閉失敗。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 中重用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="二進位支援的設定輔助工具">
    對於二進位支援的設定 UI，請優先使用共用委派輔助工具，而不是將相同的二進位/狀態黏合程式碼複製到每個通道：

    - `createDetectedBinaryStatus(...)` 用於只因標籤、提示、分數和二進位偵測而有所不同的狀態區塊
    - `createCliPathTextInput(...)` 用於以路徑支援的文字輸入
    - 當 `setupEntry` 需要延遲轉送到較重的完整精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 判斷時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發佈和安裝

**外部 Plugin：**發佈到 [ClawHub](/zh-TW/tools/clawhub)，然後安裝：

<Tabs>
  <Tab title="自動（先 ClawHub 再 npm）">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw 會先嘗試 ClawHub，並自動退回到 npm。

  </Tab>
  <Tab title="僅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或在遷移期間需要
    直接 npm 安裝路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內 Plugin：**放在內建 Plugin 工作區樹下，它們會在建置期間自動被探索。

**使用者可以安裝：**

```bash
openclaw plugins install <package-name>
```

<Info>
對於來自 npm 的安裝，`openclaw plugins install` 會執行專案本機的 `npm install --ignore-scripts`（沒有生命週期 scripts），並忽略繼承的全域 npm 安裝設定。請保持 Plugin 相依樹為純 JS/TS，並避免需要 `postinstall` 建置的套件。
</Info>

<Note>
OpenClaw 擁有的隨附 Plugin 是唯一的啟動修復例外：當封裝安裝根據 Plugin 設定、舊版頻道設定，或其隨附且預設啟用的資訊清單，看到其中一個 Plugin 已啟用時，啟動程序會在匯入前安裝該 Plugin 缺少的執行階段依賴項。操作人員可以使用 `openclaw plugins deps` 檢查或修復該階段。第三方 Plugin 不應依賴啟動安裝；請繼續使用明確的 Plugin 安裝程式。
</Note>

隨附套件層級執行階段依賴項是明確的中繼資料，而不是在 Gateway 啟動時從建置後的 JavaScript 推斷而來。如果共享的 OpenClaw 根依賴項必須可在外部隨附 Plugin 執行階段鏡像中使用，請在根套件資訊清單的 `openclaw.bundle.mirroredRootRuntimeDependencies` 中宣告它。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [Plugin 資訊清單](/zh-TW/plugins/manifest) — 完整資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
