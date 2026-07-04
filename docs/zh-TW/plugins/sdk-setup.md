---
read_when:
    - 你正在為外掛新增設定精靈
    - 你需要了解 setup-entry.ts 與 index.ts 的差異
    - 你正在定義外掛設定結構描述或 package.json 的 openclaw 中繼資料
sidebarTitle: Setup and config
summary: 設定精靈、setup-entry.ts、config schemas，以及 package.json metadata
title: 外掛設定與組態
x-i18n:
    generated_at: "2026-07-04T15:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

外掛封裝（`package.json` 中繼資料）、資訊清單（`openclaw.plugin.json`）、設定項目與設定結構描述的參考。

<Tip>
**在尋找逐步指南嗎？** 操作指南會在脈絡中說明封裝：[頻道外掛](/zh-TW/plugins/sdk-channel-plugins#step-1-package-and-manifest) 與 [供應商外掛](/zh-TW/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 套件中繼資料

你的 `package.json` 需要一個 `openclaw` 欄位，用來告訴外掛系統你的外掛提供什麼：

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
如果你在 ClawHub 上對外發布外掛，這些 `compat` 與 `build` 欄位是必要的。標準發布片段位於 `docs/snippets/plugin-publish/`。
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
  此外掛註冊的供應商 ID。
</ParamField>
<ParamField path="install" type="object">
  安裝提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  啟動行為旗標。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是便宜的套件中繼資料，用於執行階段載入前的頻道探索與設定介面。

| 欄位                                   | 類型       | 含義                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 標準頻道 ID。                                                                 |
| `label`                                | `string`   | 主要頻道標籤。                                                                |
| `selectionLabel`                       | `string`   | 當需要不同於 `label` 時使用的選擇器/設定標籤。                                |
| `detailLabel`                          | `string`   | 用於更豐富頻道目錄與狀態介面的次要詳細標籤。                                  |
| `docsPath`                             | `string`   | 用於設定與選擇連結的文件路徑。                                                |
| `docsLabel`                            | `string`   | 當需要不同於頻道 ID 時，用於文件連結的覆寫標籤。                              |
| `blurb`                                | `string`   | 簡短的入門/目錄描述。                                                         |
| `order`                                | `number`   | 頻道目錄中的排序順序。                                                        |
| `aliases`                              | `string[]` | 用於頻道選擇的額外查找別名。                                                  |
| `preferOver`                           | `string[]` | 此頻道應優先於其上的較低優先序外掛/頻道 ID。                                  |
| `systemImage`                          | `string`   | 頻道 UI 目錄的選用圖示/系統影像名稱。                                         |
| `selectionDocsPrefix`                  | `string`   | 選擇介面中文件連結前的前置文字。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在選擇文案中直接顯示文件路徑，而不是帶標籤的文件連結。                        |
| `selectionExtras`                      | `string[]` | 附加在選擇文案中的額外短字串。                                                |
| `markdownCapable`                      | `boolean`  | 將頻道標記為支援 Markdown，用於輸出格式決策。                                 |
| `exposure`                             | `object`   | 用於設定、已設定清單與文件介面的頻道可見性控制。                              |
| `quickstartAllowFrom`                  | `boolean`  | 讓此頻道加入標準快速開始 `allowFrom` 設定流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只有一個帳戶存在，也要求明確的帳戶綁定。                                  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此頻道的公告目標時偏好使用工作階段查找。                                  |

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
- `docs`：將頻道標記為文件/導覽介面中的公開頻道

<Note>
`showConfigured` 與 `showInSetup` 仍作為舊版別名受到支援。偏好使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是套件中繼資料，不是資訊清單中繼資料。

| 欄位                         | 類型                                | 含義                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用於安裝/更新與入門隨需安裝流程的標準 ClawHub 規格。                              |
| `npmSpec`                    | `string`                            | 用於安裝/更新備援流程的標準 npm 規格。                                            |
| `localPath`                  | `string`                            | 本機開發或內建安裝路徑。                                                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 當有多個來源可用時的偏好安裝來源。                                                |
| `minHostVersion`             | `string`                            | 支援的最低 OpenClaw 版本，格式為 `>=x.y.z` 或 `>=x.y.z-prerelease`。               |
| `expectedIntegrity`          | `string`                            | 預期的 npm 發行完整性字串，通常是 `sha512-...`，用於釘選安裝。                    |
| `allowInvalidConfigRecovery` | `boolean`                           | 允許內建外掛重新安裝流程從特定過時設定失敗中復原。                                |
| `requiredPlatformPackages`   | `string[]`                          | npm 安裝期間驗證的必要平台特定 npm 別名。                                         |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    互動式入門也會使用 `openclaw.install` 來提供隨需安裝介面。如果你的外掛在執行階段載入前公開供應商驗證選項或頻道設定/目錄中繼資料，入門流程可以顯示該選項，提示使用 ClawHub、npm 或本機安裝，安裝或啟用外掛，然後繼續所選流程。ClawHub 入門選項使用 `clawhubSpec`，且存在時會優先使用；npm 選項需要受信任的目錄中繼資料，其中包含登錄檔 `npmSpec`；精確版本與 `expectedIntegrity` 是選用的 npm 釘選。如果存在 `expectedIntegrity`，安裝/更新流程會對 npm 強制執行它。將「要顯示什麼」的中繼資料放在 `openclaw.plugin.json`，將「如何安裝它」的中繼資料放在 `package.json`。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    如果設定了 `minHostVersion`，安裝與非內建資訊清單登錄載入都會強制執行它。較舊的主機會略過外部外掛；無效的版本字串會被拒絕。內建原始碼外掛會被假定為與主機 checkout 共同版本化。
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
    `allowInvalidConfigRecovery` 不是破損設定的一般性繞過方式。它只用於狹窄的內建外掛復原，因此重新安裝/設定可以修復已知的升級殘留，例如缺少內建外掛路徑，或同一外掛的過時 `channels.<id>` 項目。如果設定因無關原因而破損，安裝仍會以關閉方式失敗，並告知操作員執行 `openclaw doctor --fix`。
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

啟用後，即使對於已設定的頻道，OpenClaw 在監聽前啟動階段也只會載入 `setupEntry`。完整進入點會在閘道開始監聽後載入。

<Warning>
只有在你的 `setupEntry` 會註冊閘道開始監聽前所需的一切（頻道註冊、HTTP 路由、閘道方法）時，才啟用延後載入。如果完整進入點擁有必要的啟動能力，請保留預設行為。
</Warning>

如果你的設定/完整進入點註冊閘道 RPC 方法，請將它們放在外掛特定前綴上。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心擁有，且一律解析為 `operator.admin`。

## 外掛資訊清單

每個原生外掛都必須在套件根目錄中隨附 `openclaw.plugin.json`。OpenClaw 使用它在不執行外掛程式碼的情況下驗證設定。

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

對於頻道外掛，請加入 `kind` 與 `channels`：

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

即使沒有設定的外掛也必須隨附結構描述。空結構描述是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整結構描述參考請見[外掛清單](/zh-TW/plugins/manifest)。

## ClawHub 發布

對於外掛套件，請使用套件專用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
舊版僅限 skill 的發布別名是給 skills 使用的。外掛套件應一律使用 `clawhub package publish`。
</Note>

## 設定入口

`setup-entry.ts` 檔案是 `index.ts` 的輕量替代方案，OpenClaw 只需要設定介面（入門設定、設定修復、已停用通道檢查）時會載入它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

這可避免在設定流程期間載入繁重的執行階段程式碼（加密函式庫、命令列介面註冊、背景服務）。

將設定安全匯出保留在 sidecar 模組中的內建工作區通道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。該內建合約也支援選用的 `runtime` 匯出，讓設定期間的執行階段接線保持輕量且明確。

<AccordionGroup>
  <Accordion title="OpenClaw 何時使用 setupEntry 而不是完整入口">
    - 通道已停用，但需要設定/入門設定介面。
    - 通道已啟用但尚未設定。
    - 已啟用延後載入（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必須註冊什麼">
    - 通道外掛物件（透過 `defineSetupPluginEntry`）。
    - 閘道 listen 前所需的任何 HTTP 路由。
    - 啟動期間所需的任何閘道方法。

    這些啟動閘道方法仍應避免使用保留的核心管理命名空間，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不應包含什麼">
    - 命令列介面註冊。
    - 背景服務。
    - 繁重的執行階段匯入（加密、SDK）。
    - 僅在啟動後才需要的閘道方法。

  </Accordion>
</AccordionGroup>

### 窄範圍設定輔助匯入

對於熱門的純設定路徑，當你只需要設定介面的一部分時，請優先使用窄範圍設定輔助接縫，而不是較廣的 `plugin-sdk/setup` umbrella：

| 匯入路徑                           | 用途                                                                                      | 主要匯出                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延後通道啟動中仍可用的設定期間執行階段輔助工具                         | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime`                                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 設定/安裝命令列介面/封存/文件輔助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

當你需要完整的共用設定工具箱時，請使用較廣的 `plugin-sdk/setup` 接縫，包括像 `moveSingleAccountChannelSectionToDefaultAccount(...)` 這類設定修補輔助工具。

使用 `createSetupTranslator(...)` 來處理固定的設定精靈文案。它會遵循命令列介面精靈語系（`OPENCLAW_LOCALE`，接著是系統語系變數），並在找不到時退回英文。將外掛專屬設定文字保留在外掛擁有的程式碼中，並且只對常見設定標籤、狀態文字與官方內建外掛設定文案使用共用目錄鍵。

設定修補配接器在匯入時保持熱門路徑安全。其內建單一帳號升級合約介面查找是惰性的，因此匯入 `plugin-sdk/setup-runtime` 不會在實際使用配接器之前急切載入內建合約介面探索。

### 通道擁有的單一帳號升級

當通道從單一帳號的頂層設定升級到 `channels.<id>.accounts.*` 時，預設的共用行為是將已升級的帳號範圍值移到 `accounts.default`。

內建通道可以透過其設定合約介面縮小或覆寫該升級：

- `singleAccountKeysToMove`：應移入已升級帳號的額外頂層鍵
- `namedAccountPromotionKeys`：當具名帳號已存在時，只有這些鍵會移入已升級帳號；共用政策/傳遞鍵會留在通道根層
- `resolveSingleAccountPromotionTarget(...)`：選擇哪個現有帳號接收已升級的值

<Note>
Matrix 是目前的內建範例。如果剛好已存在一個具名 Matrix 帳號，或如果 `defaultAccount` 指向現有的非標準鍵，例如 `Ops`，升級會保留該帳號，而不是建立新的 `accounts.default` 項目。
</Note>

## 設定結構描述

外掛設定會根據清單中的 JSON Schema 進行驗證。使用者透過以下方式設定外掛：

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

如果你已經用 JSON Schema 或 TypeBox 撰寫合約，請使用直接輔助工具，讓 OpenClaw 可以在中繼資料路徑上略過 Zod 到 JSON Schema 的轉換：

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

對於第三方外掛，冷路徑合約仍然是外掛清單：將產生的 JSON Schema 鏡像到 `openclaw.plugin.json#channelConfigs`，讓設定結構描述、設定與 UI 介面可以在不載入執行階段程式碼的情況下檢查 `channels.<id>`。

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

`ChannelSetupWizard` 型別支援 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整範例請見內建外掛套件（例如 Discord 外掛 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共用 allowFrom 提示">
    對於只需要標準 `note -> prompt -> parse -> merge -> patch` 流程的 DM allowlist 提示，請優先使用 `openclaw/plugin-sdk/setup` 的共用設定輔助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準通道設定狀態">
    對於只會依標籤、分數與選用額外行而變動的通道設定狀態區塊，請優先使用 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每個外掛中手寫相同的 `status` 物件。
  </Accordion>
  <Accordion title="選用通道設定介面">
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

    當你只需要該選用安裝介面的一半時，`plugin-sdk/channel-setup` 也公開較低階的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 建構器。

    產生的選用配接器/精靈會對真實設定寫入採取 fail closed。它們會在 `validateInput`、`applyAccountConfig` 和 `finalize` 之間重用同一則需要安裝的訊息，並在設定 `docsPath` 時附加文件連結。

  </Accordion>
  <Accordion title="二進位支援的設定輔助工具">
    對於二進位支援的設定 UI，請優先使用共用的委派輔助工具，而不是將相同的二進位/狀態黏合程式碼複製到每個通道中：

    - `createDetectedBinaryStatus(...)` 用於僅依標籤、提示、分數與二進位檔偵測而變化的狀態區塊
    - `createCliPathTextInput(...)` 用於以路徑為後端的文字輸入
    - 當 `setupEntry` 需要延遲轉送至較重的完整精靈時，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 當 `setupEntry` 只需要委派 `textInputs[*].shouldPrompt` 決策時，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 發布與安裝

**外部外掛：**發布到 [ClawHub](/clawhub)，然後安裝：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在啟動切換期間，裸套件規格會從 npm 安裝。

  </Tab>
  <Tab title="僅限 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 套件規格">
    當套件尚未移至 ClawHub，或你在遷移期間需要直接的 npm 安裝路徑時，請使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**儲存庫內外掛：**放在隨附外掛工作區樹狀結構下，建置期間會自動探索。

**使用者可以安裝：**

```bash
openclaw plugins install <package-name>
```

<Info>
對於來源為 npm 的安裝，`openclaw plugins install` 會將套件安裝到 `~/.openclaw/npm/projects` 下每個外掛各自的專案中，並停用生命週期指令碼。請保持外掛依賴樹為純 JS/TS，並避免使用需要 `postinstall` 建置的套件。
</Info>

<Note>
閘道啟動不會安裝外掛依賴。npm/git/ClawHub 安裝流程負責依賴收斂；本機外掛必須已經安裝其依賴。
</Note>

隨附套件中繼資料是明確指定的，不會在閘道啟動時從已建置的 JavaScript 推斷。執行階段依賴應屬於擁有它們的外掛套件；封裝後的 OpenClaw 啟動程序永遠不會修復或鏡像外掛依賴。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins) — 逐步入門指南
- [外掛資訊清單](/zh-TW/plugins/manifest) — 完整資訊清單結構描述參考
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
