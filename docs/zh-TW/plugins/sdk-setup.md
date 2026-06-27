---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 你正在定義外掛設定結構描述或 package.json openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、設定結構描述，以及 package.json 中繼資料
title: 外掛設定與組態
x-i18n:
    generated_at: "2026-06-27T19:49:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定結構描述的參考。

<Tip>
**想找逐步教學？** 操作指南會在脈絡中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，告訴外掛系統你的外掛提供什麼：

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
  <Tab title="提供者外掛 / ClawHub 基準">
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
如果你在 ClawHub 上對外發布外掛，則必須提供這些 `compat` 和 `build` 欄位。標準發布片段位於 `docs/snippets/plugin-publish/`。
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
  此外掛註冊的提供者 ID。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是用於頻道探索與執行階段載入前設定介面的輕量套件中繼資料。

| 欄位                                   | 類型       | 含義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道 ID。                                                                 |
| `label`                                | `string`   | 主要頻道標籤。                                                                |
| `selectionLabel`                       | `string`   | 當應與 `label` 不同時使用的選擇器/設定標籤。                                  |
| `detailLabel`                          | `string`   | 用於更豐富頻道目錄與狀態介面的次要詳細標籤。                                  |
| `docsPath`                             | `string`   | 用於設定與選取連結的文件路徑。                                                |
| `docsLabel`                            | `string`   | 當應與頻道 ID 不同時，用於文件連結的覆寫標籤。                                |
| `blurb`                                | `string`   | 簡短的上手/目錄描述。                                                         |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                              | `string[]` | 用於頻道選取的額外查找別名。                                                  |
| `preferOver`                           | `string[]` | 此頻道應優先於其上的較低優先順序外掛/頻道 ID。                                |
| `systemImage`                          | `string`   | 用於頻道 UI 目錄的選用圖示/系統影像名稱。                                     |
| `selectionDocsPrefix`                  | `string`   | 選取介面中文件連結前的前綴文字。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在選取文案中直接顯示文件路徑，而不是帶標籤的文件連結。                        |
| `selectionExtras`                      | `string[]` | 附加到選取文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 markdown，以供傳出格式化決策使用。                           |
| `exposure`                             | `object`   | 用於設定、已設定清單與文件介面的頻道可見性控制。                              |
| `quickstartAllowFrom`                  | `boolean`  | 讓此頻道加入標準快速開始 `allowFrom` 設定流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只有一個帳戶存在，也要求明確帳戶綁定。                                    |
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

- `configured`：在已設定/狀態樣式的清單介面中包含此頻道
- `setup`：在互動式設定/配置選擇器中包含此頻道
- `docs`：在文件/導覽介面中將此頻道標記為公開面向

<Note>
`showConfigured` 和 `showInSetup` 仍作為舊版別名受到支援。建議使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是資訊清單中繼資料。

| 欄位                         | 類型                                | 含義                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝/更新與上手按需安裝流程的標準 ClawHub 規格。                             |
| `npmSpec`                    | `string`                            | 用於安裝/更新備援流程的標準 npm 規格。                                            |
| `localPath`                  | `string`                            | 本機開發或隨附安裝路徑。                                                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 當有多個來源可用時的偏好安裝來源。                                                |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z` 或 `>=x.y.z-prerelease`。              |
| `expectedIntegrity`          | `string`                            | 預期的 npm 發行完整性字串，通常為 `sha512-...`，用於釘選安裝。                   |
| `allowInvalidConfigRecovery` | `boolean`                           | 允許隨附外掛重新安裝流程從特定過期設定失敗中復原。                                |
| `requiredPlatformPackages`   | `string[]`                          | npm 安裝期間驗證的必要平台特定 npm 別名。                                         |

<AccordionGroup>
  <Accordion title="上手行為">
    互動式上手也會針對按需安裝介面使用 `openclaw.install`。如果你的外掛在執行階段載入前公開提供者驗證選項或頻道設定/目錄中繼資料，上手流程就能顯示該選項、提示使用 ClawHub、npm 或本機安裝、安裝或啟用外掛，然後繼續所選流程。ClawHub 上手選項使用 `clawhubSpec`，且存在時會優先使用；npm 選項需要受信任的目錄中繼資料，並包含註冊表 `npmSpec`；精確版本與 `expectedIntegrity` 是選用的 npm 釘選項。如果存在 `expectedIntegrity`，安裝/更新流程會針對 npm 強制執行它。請將「要顯示什麼」的中繼資料放在 `openclaw.plugin.json` 中，並將「如何安裝它」的中繼資料放在 `package.json` 中。
  </Accordion>
  <Accordion title="minHostVersion 強制執行">
    如果設定了 `minHostVersion`，安裝與非隨附資訊清單註冊表載入都會強制執行它。較舊的主機會略過外部外掛；無效的版本字串會被拒絕。隨附原始碼外掛會被假定為與主機 checkout 同版本。
  </Accordion>
  <Accordion title="釘選 npm 安裝">
    對於釘選 npm 安裝，請在 `npmSpec` 中保留精確版本，並加入預期的成品完整性：

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
    `allowInvalidConfigRecovery` 不是破損設定的一般繞過方式。它只用於狹窄的隨附外掛復原，因此重新安裝/設定可以修復已知升級殘留，例如缺少隨附外掛路徑，或同一外掛的過期 `channels.<id>` 項目。如果設定因無關原因而破損，安裝仍會以失敗關閉，並告知操作員執行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延後完整載入

頻道外掛可以透過以下方式選擇加入延後載入：

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

啟用後，即使是已設定的頻道，OpenClaw 在監聽前啟動階段也只會載入 `setupEntry`。完整進入點會在閘道開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會註冊閘道開始監聽前所需的一切（頻道註冊、HTTP 路由、閘道方法）時，才啟用延後載入。如果完整進入點擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入點註冊閘道 RPC 方法，請將它們保留在外掛特定前綴上。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，並且一律解析為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄提供 `openclaw.plugin.json`。OpenClaw 會使用它在不執行外掛程式碼的情況下驗證設定。

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

對於頻道外掛，請加入 `kind` 和 `channels`：

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

即使外掛沒有設定，也必須提供結構描述。空結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整的結構描述參考請見 [外掛資訊清單](/zh-TW/plugins/manifest)。

## ClawHub 發布

外掛套件請使用套件專用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
舊版僅限 skill 的發布別名是供 skills 使用。外掛套件應一律使用 `clawhub package publish`。
</Note>

## 設定進入點

`setup-entry.ts` 檔案是 `index.ts` 的輕量替代方案，供 OpenClaw 只需要設定介面時載入（上線導引、設定修復、停用通道檢查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程中載入沉重的執行階段程式碼（加密函式庫、命令列介面註冊、背景服務）。

在 sidecar 模組中保留設定安全匯出的內建工作區通道，可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，讓設定期間的執行階段接線保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整進入點">
    - 通道已停用，但需要設定/上線導引介面。
    - 通道已啟用但尚未設定。
    - 已啟用延遲載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊什麼">
    - 通道外掛物件（透過 `defineSetupPluginEntry`）。
    - 閘道開始監聽前所需的任何 HTTP 路由。
    - 啟動期間所需的任何閘道方法。

    這些啟動用閘道方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含什麼">
    - 命令列介面註冊。
    - 背景服務。
    - 沉重的執行階段匯入（加密、SDK）。
    - 只有啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 窄範圍設定輔助工具匯入

對於設定專用的熱路徑，當你只需要設定介面的一部分時，請優先使用窄範圍的設定輔助工具接縫，而不是較廣泛的 `plugin-sdk/setup` 總括匯入：

| 匯入路徑                           | 用途                                                                                      | 主要匯出                                                                                                                                                                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延遲通道啟動中仍可用的設定期間執行階段輔助工具                          | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已淘汰的相容性別名；請使用 `plugin-sdk/setup-runtime`                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 設定/安裝命令列介面/封存/文件輔助工具                                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

當你需要完整的共用設定工具箱時，請使用較廣泛的 `plugin-sdk/setup` 接縫，包括像 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具。

固定的設定精靈文案請使用 `createSetupTranslator(...)`。它會遵循
命令列介面精靈的地區設定（`OPENCLAW_LOCALE`，接著是系統地區設定變數），並在沒有符合項目時
退回英文。請將外掛專屬設定文字保留在外掛擁有的程式碼中，並只對常見設定標籤、狀態文字和官方
內建外掛設定文案使用共用目錄鍵。

設定修補配接器在匯入時保持熱路徑安全。其內建單一帳號提升合約介面查找是延遲的，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器前急切載入內建合約介面探索。

### 通道擁有的單一帳號提升

當通道從單一帳號的頂層設定升級到 `channels.<id>.accounts.*` 時，預設共用行為會將提升後的帳號範圍值移到 `accounts.default`。

內建通道可以透過其設定合約介面縮小或覆寫該提升：

- `singleAccountKeysToMove`：應移入提升帳號的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些鍵會移入提升帳號；共用政策/遞送鍵會留在通道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個既有帳號接收提升後的值

<Note>
Matrix 是目前的內建範例。如果剛好已有一個具名 Matrix 帳號，或如果 `defaultAccount` 指向既有的非標準鍵（例如 `Ops`），提升會保留該帳號，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

外掛設定會依照資訊清單中的 JSON Schema 進行驗證。使用者透過以下方式設定外掛：

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

外掛會在註冊期間以 `api.pluginConfig` 收到此設定。

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

### 建立通道設定結構描述

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

如果你已將合約撰寫為 JSON Schema 或 TypeBox，請使用直接輔助工具，讓 OpenClaw 可以在中繼資料路徑上略過 Zod 到 JSON Schema 的轉換：

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

對第三方外掛而言，冷路徑合約仍是外掛資訊清單：請將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定流程和 UI 介面可在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

## 設定精靈

通道外掛可以為 `openclaw onboard` 提供互動式設定精靈。精靈是 `ChannelPlugin` 上的 `ChannelSetupWizard` 物件：

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

`ChannelSetupWizard` 型別支援 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等項目。完整範例請參閱內建外掛套件（例如 Discord 外掛 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的 DM 允許清單提示，請優先使用來自 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準通道設定狀態">
    對於只因標籤、分數和選用額外行而不同的通道設定狀態區塊，請優先使用來自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個外掛中手寫相同的 `status` 物件。
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

    產生的選用配接器/精靈會對真實設定寫入採取關閉失敗。它們在 `validateInput`、`applyAccountConfig` 和 `finalize` 中重用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="二進位支援的設定輔助工具">
    對於二進位支援的設定 UI，請優先使用共用委派輔助工具，而不是把相同的二進位/狀態黏合程式碼複製到每個通道中：

    - `createDetectedBinaryStatus(...)`：用於只因標籤、提示、分數和二進位偵測而不同的狀態區塊
    - `createCliPathTextInput(...)`：用於路徑支援的文字輸入
    - `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`：當 `setupEntry` 需要延遲轉送到較重的完整精靈時使用
    - `createDelegatedTextInputShouldPrompt(...)`：當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 判斷時使用

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布到 [ClawHub](/zh-TW/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，裸套件規格會從 npm 安裝。

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

**儲存庫內外掛：**放在內建外掛工作區樹狀結構下，建置時就會自動探索。

**使用者可以安裝：**

```bash
openclaw plugins install <package-name>
```

<Info>
針對來源為 npm 的安裝，`openclaw plugins install` 會將套件安裝到 `~/.openclaw/npm/projects` 下每個外掛各自的專案，並停用生命週期指令碼。請保持外掛相依樹為純 JS/TS，並避免需要 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動不會安裝外掛相依項。npm/git/ClawHub 安裝流程負責相依項收斂；本機外掛必須已經安裝其相依項。
</Note>

內建套件中繼資料是明確指定的，不是在閘道啟動時從建置後的 JavaScript 推斷。執行階段相依項應放在擁有它們的外掛套件中；封裝後的 OpenClaw 啟動永遠不會修復或鏡像外掛相依項。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
