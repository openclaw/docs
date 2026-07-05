---
read_when:
    - 你需要 `defineToolPlugin`、`definePluginEntry` 或 `defineChannelPluginEntry` 的確切型別簽名
    - 你想了解註冊模式（完整 vs 設定 vs 命令列介面中繼資料）
    - 你正在查詢進入點選項
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 參考
title: 外掛進入點
x-i18n:
    generated_at: "2026-07-05T11:32:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc86fe21ccd7705aabf1873ac025c5ff7b6345da2edf2689b07d0f5e4b56e8fe
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個外掛都會匯出一個預設進入點物件。SDK 會為每種進入點形狀提供輔助函式：`defineToolPlugin`、`definePluginEntry`、`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **想找逐步指南嗎？** 請參閱 [工具外掛](/zh-TW/plugins/tool-plugins)、[頻道外掛](/zh-TW/plugins/sdk-channel-plugins) 或 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) 取得逐步指南。
</Tip>

## 套件進入點

已安裝的外掛會在 `package.json` 的 `openclaw` 欄位中同時指向原始碼和已建置的進入點：

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` 和 `setupEntry` 是原始碼進入點，用於工作區和 git checkout 開發。
- `runtimeExtensions` 和 `runtimeSetupEntry` 是已安裝套件的偏好選項：它們讓 npm 套件可略過執行階段 TypeScript 編譯。
- `runtimeExtensions` 若存在，陣列長度必須與 `extensions` 相同（進入點依位置配對）。`runtimeSetupEntry` 需要 `setupEntry`。
- 如果宣告了 `runtimeExtensions`/`runtimeSetupEntry` 成品但遺失，安裝/探索會因封裝錯誤而失敗；OpenClaw 不會靜默退回原始碼。原始碼退回（如下）僅在完全未宣告執行階段進入點時適用。
- 如果已安裝套件只宣告 TypeScript 原始碼進入點，OpenClaw 會尋找相符的已建置 `dist/*.js`（或 `.mjs`/`.cjs`）同層檔案並使用它；否則會退回 TypeScript 原始碼。
- 所有進入點路徑都必須留在外掛套件目錄內。執行階段進入點和推斷出的已建置 JS 同層檔案，不會讓跳出目錄的 `extensions` 或 `setupEntry` 原始碼路徑變得有效。

## `defineToolPlugin`

**匯入：** `openclaw/plugin-sdk/tool-plugin`

用於只新增代理工具的外掛。它讓原始碼保持精簡，從 TypeBox 結構描述推斷設定和工具參數型別，將普通回傳值包裝成 OpenClaw 工具結果格式，並公開靜態中繼資料，供 `openclaw plugins build` 寫入外掛資訊清單（`contracts.tools`、`configSchema`）。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` 是選用的；省略時會使用嚴格的空物件結構描述（產生的資訊清單仍會包含 `configSchema`）。
- `execute` 會回傳普通字串或可 JSON 序列化的值；輔助函式會將其包裝為文字工具結果，並將 `details` 設為原始（未字串化）回傳值。
- 若要使用自訂工具結果，`openclaw/plugin-sdk/tool-results` 會匯出 `textResult` 和 `jsonResult`。
- 工具名稱是靜態的，因此 `openclaw plugins build` 會從宣告的工具推導出 `contracts.tools`，不需要手動重複名稱。
- 執行階段載入保持嚴格：已安裝的外掛仍需要 `openclaw.plugin.json` 和 `package.json` 的 `openclaw.extensions`。OpenClaw 絕不會執行外掛程式碼來推斷缺漏的資訊清單資料。

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

用於提供者外掛、進階工具外掛、鉤子外掛，以及任何**不是**訊息頻道的項目。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 欄位                      | 類型                                                             | 必填 | 預設值             |
| ------------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                      | `string`                                                         | 是   | -                  |
| `name`                    | `string`                                                         | 是   | -                  |
| `description`             | `string`                                                         | 是   | -                  |
| `kind`                    | `string`（已淘汰，見下方）                                      | 否   | -                  |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述     |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | 否   | -                  |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | 否   | -                  |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | 否   | -                  |
| `register`                | `(api: OpenClawPluginApi) => void`                               | 是   | -                  |

- `id` 必須符合你的 `openclaw.plugin.json` 資訊清單。
- `kind` 已淘汰：請改在 `openclaw.plugin.json` 資訊清單的 `kind` 欄位中宣告專屬槽位（`"memory"` 或 `"context-engine"`）。執行階段進入點的 `kind` 只會作為舊版外掛的相容性退回。
- `configSchema` 可以是函式，以便延遲求值。OpenClaw 會在首次存取時解析並記憶結構描述，因此昂貴的結構描述建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以頻道專屬接線包裝 `definePluginEntry`：它會自動呼叫 `api.registerChannel({ plugin })`，公開選用的根說明命令列介面中繼資料接縫，並依註冊模式控管 `registerFull`。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 欄位                  | 類型                                                             | 必填 | 預設值             |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                  | `string`                                                         | 是   | -                  |
| `name`                | `string`                                                         | 是   | -                  |
| `description`         | `string`                                                         | 是   | -                  |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -                  |

回呼會依註冊模式執行（完整表格見[註冊模式](#registration-mode)）：

- `setRuntime` 會在除了 `"cli-metadata"` 和 `"tool-discovery"` 之外的每種模式中執行。通常透過 `createPluginRuntimeStore` 在這裡儲存執行階段參照。
- `registerCliMetadata` 會在 `"cli-metadata"`、`"discovery"` 和 `"full"` 中執行。請將它作為頻道擁有的命令列介面描述元的標準位置，讓根說明保持不啟用、探索快照包含靜態命令中繼資料，且一般命令列介面註冊與完整外掛載入保持相容。
- `registerFull` 只會在 `"full"` 和 `"tool-discovery"` 中執行。對於 `"tool-discovery"`，它會取代頻道註冊而執行：OpenClaw 會完全略過 `registerChannel`/`setRuntime`，只呼叫 `registerFull`，因此你的頻道若需要任何提供者/工具註冊來進行獨立工具探索或執行，必須放在這裡，而不是藏在一般頻道設定後面。
- 探索註冊是不啟用的，但不是免匯入：OpenClaw 可能會評估受信任的外掛進入點和頻道外掛模組來建立快照。請讓頂層匯入沒有副作用，並將 sockets、clients、workers 和 services 放在只有 `"full"` 才會走到的路徑後面。
- 和 `definePluginEntry` 一樣，`configSchema` 可以是延遲工廠；OpenClaw 會在首次存取時記憶已解析的結構描述。

命令列介面註冊：

- 對於你想要延遲載入、但不想從根命令列介面解析樹中消失的外掛自有根命令列介面命令，請使用 `api.registerCli(..., { descriptors: [...] })`。描述元名稱必須符合字母、數字、連字號和底線，並以字母或數字開頭；OpenClaw 會拒絕其他形狀，並在呈現說明前從描述中移除終端控制序列。請涵蓋註冊器公開的每個頂層命令根。單獨使用 `commands` 仍會走急切相容性路徑。
- 對於配對節點功能命令，請使用 `api.registerNodeCliFeature(...)`，讓它們落在 `openclaw nodes` 之下（等同於 `registerCli(registrar, { parentPath: ["nodes"], ... })`）。
- 對於其他巢狀外掛命令，請新增 `parentPath`，並在傳給註冊器的 `program` 物件上註冊命令；OpenClaw 會在呼叫外掛前將其解析到父命令。
- 對於頻道外掛，請從 `registerCliMetadata` 註冊命令列介面描述元，並讓 `registerFull` 專注於僅限執行階段的工作。
- 如果 `registerFull` 也註冊閘道 RPC 方法，請將它們放在外掛專屬前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律會強制轉為 `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，沒有執行階段或命令列介面接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當頻道停用、未設定，或啟用延遲載入時，OpenClaw 會載入此項目而非完整進入點。請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)了解何時重要。

將 `defineSetupPluginEntry(...)` 與狹義的設定輔助函式系列搭配使用：

| 匯入                                | 用途                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | 執行階段安全的設定輔助工具：`createSetupTranslator`、匯入安全的設定修補配接器、查找附註輸出、`promptResolvedAllowFrom`、`splitSetupEntries`、委派的設定代理 |
| `openclaw/plugin-sdk/channel-setup` | 選用安裝設定介面                                                                                                                                                                  |
| `openclaw/plugin-sdk/setup-tools`   | 設定/安裝命令列介面、封存與文件輔助工具                                                                                                                                           |

請將大型 SDK、命令列介面註冊，以及長期執行的執行階段服務保留在
完整進入點中。

拆分設定與執行階段介面的 bundled 工作區通道，則可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。它讓設定進入點保留設定安全的
外掛/secret 匯出，同時仍公開執行階段 setter：

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

只有在設定流程確實需要輕量執行階段 setter，或在完整通道進入點載入前
需要設定安全的閘道介面時，才使用此方式。
`registerSetupRuntime` 只會在 `"setup-runtime"` 載入時執行；請將它
限制在僅設定用路由，或必須在延後的完整啟用之前存在的方法。

## 註冊模式

`api.registrationMode` 會告訴你的外掛它是如何被載入的：

| 模式               | 時機                                               | 要註冊的內容                                                                                                          |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 一般閘道啟動                                       | 所有內容                                                                                                              |
| `"discovery"`      | 唯讀能力探索                                       | 通道註冊加上靜態命令列介面描述元；進入點程式碼可以載入，但略過 socket、worker、client 與服務 |
| `"tool-discovery"` | 用於列出或執行特定外掛工具的範圍載入             | 僅註冊能力/工具；不啟用通道                                                                                           |
| `"setup-only"`     | 停用/未設定的通道                                  | 僅通道註冊                                                                                                            |
| `"setup-runtime"`  | 具有可用執行階段的設定流程                        | 通道註冊加上完整進入點載入前所需的輕量執行階段                                                                       |
| `"cli-metadata"`   | 根說明 / 命令列介面中繼資料擷取                   | 僅命令列介面描述元                                                                                                    |

`defineChannelPluginEntry` 會自動處理此拆分。如果你直接對通道使用
`definePluginEntry`，請自行檢查模式，並記得
`"tool-discovery"` 會略過通道註冊：

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Register capability-only surfaces (providers/tools), no channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

探索模式會建立不啟用的 registry 快照。它仍可能評估外掛進入點和通道外掛物件，
讓 OpenClaw 可以註冊通道能力與靜態命令列介面描述元。請將探索期間的模組評估
視為受信任但輕量：頂層不得有網路 client、子行程、listener、資料庫連線、
背景 worker、憑證讀取，或其他即時執行階段副作用。

請將 `"setup-runtime"` 視為設定專用啟動介面必須存在、但不重新進入完整 bundled
通道執行階段的時段。適合的內容包括通道註冊、設定安全的 HTTP 路由、設定安全的
閘道方法，以及委派的設定輔助工具。大型背景服務、命令列介面 registrar，以及
provider/client SDK 啟動程序仍屬於 `"full"`。

## 外掛形態

OpenClaw 會依照載入外掛的註冊行為分類：

| 形態                  | 說明                                      |
| --------------------- | ----------------------------------------- |
| **plain-capability**  | 一種能力類型（例如僅 provider）          |
| **hybrid-capability** | 多種能力類型（例如 provider + speech）   |
| **hook-only**         | 只有 hook，沒有能力                       |
| **non-capability**    | 工具/指令/服務，但沒有能力                |

使用 `openclaw plugins inspect <id>` 查看外掛的形態。

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 註冊 API 與子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) - `api.runtime` 與 `createPluginRuntimeStore`
- [設定與組態](/zh-TW/plugins/sdk-setup) - manifest、設定進入點、延後載入
- [通道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建立 `ChannelPlugin` 物件
- [Provider 外掛](/zh-TW/plugins/sdk-provider-plugins) - provider 註冊與 hook
