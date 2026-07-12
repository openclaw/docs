---
read_when:
    - 你需要 `defineToolPlugin`、`definePluginEntry` 或 `defineChannelPluginEntry` 的確切型別簽章
    - 你想了解註冊模式（完整、設定或命令列介面中繼資料）
    - 你正在查詢進入點選項
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 與 defineSetupPluginEntry 參考資料
title: 外掛進入點
x-i18n:
    generated_at: "2026-07-12T14:41:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個外掛都會匯出預設進入點物件。SDK 針對每種進入點形式提供一個輔助函式：`defineToolPlugin`、`definePluginEntry`、`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **想查看操作指南嗎？**請參閱[工具外掛](/zh-TW/plugins/tool-plugins)、
  [頻道外掛](/zh-TW/plugins/sdk-channel-plugins)或
  [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)，以取得逐步指南。
</Tip>

## 套件進入點

已安裝的外掛會在 `package.json` 的 `openclaw` 欄位中同時指向原始碼與建置後的進入點：

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

- `extensions` 和 `setupEntry` 是原始碼進入點，用於工作區與 git
  簽出環境中的開發。
- 已安裝的套件會優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`：
  這讓 npm 套件可略過執行階段的 TypeScript 編譯。
- 若有 `runtimeExtensions`，其陣列長度必須與 `extensions` 相符
  （進入點依位置配對）。`runtimeSetupEntry` 必須搭配 `setupEntry`。
- 如果宣告了 `runtimeExtensions`/`runtimeSetupEntry` 成品，但該成品
  不存在，安裝／探索會因套件錯誤而失敗；OpenClaw 不會
  靜默退回原始碼。下述原始碼備援僅適用於完全未宣告
  執行階段進入點的情況。
- 如果已安裝的套件僅宣告 TypeScript 原始碼進入點，OpenClaw
  會尋找對應的建置後 `dist/*.js`（或 `.mjs`/`.cjs`）同層檔案並使用它；
  否則會退回 TypeScript 原始碼。
- 所有進入點路徑都必須位於外掛套件目錄內。執行階段
  進入點與推斷出的建置後 JS 同層檔案，不會使逸出套件目錄的 `extensions` 或
  `setupEntry` 原始碼路徑變成有效路徑。

## `defineToolPlugin`

**匯入：** `openclaw/plugin-sdk/tool-plugin`

適用於只新增代理程式工具的外掛。它可保持原始碼精簡、從 TypeBox 結構描述推斷設定
與工具參數型別、將一般回傳值包裝為
OpenClaw 工具結果格式，並公開靜態中繼資料，供
`openclaw plugins build` 寫入外掛資訊清單（`contracts.tools`、
`configSchema`）。

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

- `configSchema` 是選用項目；省略時會使用嚴格的空物件結構描述
  （產生的資訊清單仍會包含 `configSchema`）。
- `execute` 會回傳一般字串或可序列化為 JSON 的值；此輔助函式
  會將其包裝為文字工具結果，並將 `details` 設為原始的
  （未字串化）回傳值。
- 若要自訂工具結果，`openclaw/plugin-sdk/tool-results` 會匯出
  `textResult` 和 `jsonResult`。
- 工具名稱是靜態的，因此 `openclaw plugins build` 可從宣告的工具推導出
  `contracts.tools`，不必手動重複名稱。
- 執行階段載入仍維持嚴格要求：已安裝的外掛仍需具有
  `openclaw.plugin.json`，且 `package.json` 中需有 `openclaw.extensions`。OpenClaw
  絕不會執行外掛程式碼來推斷缺少的資訊清單資料。

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

適用於供應商外掛、進階工具外掛、鉤子外掛，以及任何
**不是**訊息頻道的項目。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| 欄位                      | 型別                                                             | 必要 | 預設值             |
| ------------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                      | `string`                                                         | 是   | -                  |
| `name`                    | `string`                                                         | 是   | -                  |
| `description`             | `string`                                                         | 是   | -                  |
| `kind`                    | `string`（已淘汰，見下文）                                       | 否   | -                  |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述     |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | 否   | -                  |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | 否   | -                  |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | 否   | -                  |
| `register`                | `(api: OpenClawPluginApi) => void`                               | 是   | -                  |

- `id` 必須與你的 `openclaw.plugin.json` 資訊清單相符。
- 外部工作階段目錄使用
  `openclaw/plugin-sdk/session-catalog` 和
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`。
  核心擁有 `sessions.catalog.*` 閘道方法；供應商會回傳主機、
  工作階段和正規化的逐字稿投影，而不註冊 RPC。
- `kind` 已淘汰：請改在 `openclaw.plugin.json` 資訊清單的 `kind` 欄位中，
  宣告互斥插槽（`"memory"` 或
  `"context-engine"`）。執行階段進入點的 `kind` 僅保留作為
  舊版外掛的相容性備援。
- `configSchema` 可以是函式，以進行延遲求值。OpenClaw 會在首次存取時解析並
  記憶結構描述，因此耗費資源的結構描述建構器只會執行
  一次。
- `nodeHostCommands` 描述元可以定義 `isAvailable({ config, env })`。
  回傳 `false` 會從無介面節點的閘道宣告中省略該命令及其功能。
  OpenClaw 會根據節點本機的啟動設定評估它；命令處理常式
  在被叫用時仍應驗證可用性。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以頻道專用的接線封裝 `definePluginEntry`：它會自動
呼叫 `api.registerChannel({ plugin })`、公開選用的根說明命令列介面
中繼資料接合面，並依註冊模式限制 `registerFull`。

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

| 欄位                  | 型別                                                             | 必要 | 預設值             |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                  | `string`                                                         | 是   | -                  |
| `name`                | `string`                                                         | 是   | -                  |
| `description`         | `string`                                                         | 是   | -                  |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -                  |

回呼會依註冊模式執行（完整表格請參閱
[註冊模式](#registration-mode)）：

- `setRuntime` 會在除 `"cli-metadata"` 和
  `"tool-discovery"` 之外的所有模式中執行。在此儲存執行階段參照，通常透過
  `createPluginRuntimeStore`。
- `registerCliMetadata` 會針對 `"cli-metadata"`、`"discovery"` 和
  `"full"` 執行。將它作為頻道自有命令列介面描述元的標準位置，
  讓根說明保持不啟用外掛、探索快照包含靜態
  命令中繼資料，且一般命令列介面註冊仍與完整
  外掛載入相容。
- `registerFull` 僅會針對 `"full"` 和 `"tool-discovery"` 執行。對於
  `"tool-discovery"`，它會取代頻道註冊而執行：OpenClaw
  會完全略過 `registerChannel`/`setRuntime`，只呼叫
  `registerFull`，因此頻道為獨立工具探索或執行所需的任何供應商／工具註冊
  都必須放在此處，而不能放在一般
  頻道設定之後。
- 探索註冊不會啟用外掛，但並非不需匯入：OpenClaw 可能會
  評估受信任的外掛進入點和頻道外掛模組以建立
  快照。請確保頂層匯入沒有副作用，並將通訊端、
  用戶端、背景工作程式和服務放在僅限 `"full"` 的路徑之後。
- 與 `definePluginEntry` 相同，`configSchema` 可以是延遲工廠函式；OpenClaw
  會在首次存取時記憶解析後的結構描述。

命令列介面註冊：

- 對於希望延遲載入、但不想從根命令列介面解析樹消失的外掛自有根
  命令列介面命令，請使用 `api.registerCli(..., { descriptors: [...] })`。
  描述元名稱必須由字母、數字、連字號和
  底線組成，並以字母或數字開頭；OpenClaw 會拒絕其他
  形式，並在呈現說明前移除描述中的終端機控制序列。
  請涵蓋註冊器公開的每個頂層命令根。僅使用
  `commands` 仍會採用即時載入的相容性路徑。
- 對於配對節點功能命令，請使用 `api.registerNodeCliFeature(...)`，使其
  位於 `openclaw nodes` 之下（等同於
  `registerCli(registrar, { parentPath: ["nodes"], ... })`）。
- 對於其他巢狀外掛命令，請新增 `parentPath`，並在傳遞給註冊器的
  `program` 物件上註冊命令；OpenClaw 會先將其解析為
  父命令，再呼叫外掛。
- 對於頻道外掛，請從 `registerCliMetadata`
  註冊命令列介面描述元，並讓 `registerFull` 專注於僅限執行階段的工作。
- 如果 `registerFull` 也註冊閘道 RPC 方法，請讓它們使用
  外掛專用前綴。保留的核心管理命名空間（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）一律強制設為
  `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

適用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，不含
執行階段或命令列介面接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當頻道停用、尚未設定，或啟用延後載入時，OpenClaw 會載入此檔案，
而不是完整進入點。如需瞭解此機制何時重要，請參閱
[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

請將 `defineSetupPluginEntry(...)` 與精簡的設定輔助函式系列搭配使用：

| 匯入                                | 用途                                                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | 執行階段安全的設定輔助工具：`createSetupTranslator`、可安全匯入的設定修補配接器、查詢附註輸出、`promptResolvedAllowFrom`、`splitSetupEntries`、委派設定代理 |
| `openclaw/plugin-sdk/channel-setup` | 選用安裝設定介面                                                                                                                                                                         |
| `openclaw/plugin-sdk/setup-tools`   | 設定／安裝命令列介面、封存與文件輔助工具                                                                                                                                                 |

將大型 SDK、命令列介面註冊，以及長期執行的執行階段服務保留在
完整進入點中。

將設定與執行階段介面分離的內建工作區頻道，可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。它讓設定
進入點保留設定安全的外掛／密鑰匯出，同時仍公開執行階段
設定函式：

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
        /* 設定安全的路由 */
      },
    });
  },
});
```

只有在設定流程確實需要輕量執行階段設定函式，或在完整頻道進入點載入前
需要設定安全的閘道介面時，才使用此方式。
`registerSetupRuntime` 僅在 `"setup-runtime"` 載入時執行；請將其
限制於僅處理設定的路由，或必須在延後的
完整啟用前就存在的方法。

## 註冊模式

`api.registrationMode` 會告訴你的外掛它是如何載入的：

| 模式               | 時機                                               | 要註冊的內容                                                                                                          |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 正常啟動閘道                                       | 所有內容                                                                                                              |
| `"discovery"`      | 唯讀功能探索                                       | 頻道註冊加上靜態命令列介面描述項；可載入進入點程式碼，但略過通訊端、工作程序、用戶端及服務                            |
| `"tool-discovery"` | 為列出或執行特定外掛工具而進行的限定範圍載入       | 僅註冊功能／工具；不啟用頻道                                                                                          |
| `"setup-only"`     | 已停用／未設定的頻道                               | 僅註冊頻道                                                                                                            |
| `"setup-runtime"`  | 可使用執行階段的設定流程                           | 註冊頻道，並且僅加入完整進入點載入前所需的輕量執行階段                                                               |
| `"cli-metadata"`   | 根層級說明／命令列介面中繼資料擷取                 | 僅命令列介面描述項                                                                                                    |

`defineChannelPluginEntry` 會自動處理此分流。如果你直接對頻道使用
`definePluginEntry`，請自行檢查模式，並記得
`"tool-discovery"` 會略過頻道註冊：

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
    // 僅註冊功能介面（提供者／工具），不註冊頻道。
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 僅限大型執行階段的註冊
  api.registerService(/* ... */);
}
```

探索模式會建立不啟用任何項目的登錄快照。它仍可能
對外掛進入點及頻道外掛物件進行求值，讓 OpenClaw 能夠
註冊頻道功能和靜態命令列介面描述項。請將探索期間的模組
求值視為可信任但應保持輕量：頂層不得有網路用戶端、
子程序、監聽器、資料庫連線、背景工作程序、
認證資訊讀取或其他即時執行階段副作用。

將 `"setup-runtime"` 視為設定專用的啟動介面必須
存在、但不可重新進入完整內建頻道執行階段的期間。適合的項目包括
頻道註冊、設定安全的 HTTP 路由、設定安全的閘道方法，
以及委派設定輔助工具。大型背景服務、命令列介面註冊器及
提供者／用戶端 SDK 啟動仍應放在 `"full"` 中。

## 外掛形態

OpenClaw 會依載入之外掛的註冊行為進行分類：

| 形態                  | 說明                                         |
| --------------------- | -------------------------------------------- |
| **plain-capability**  | 一種功能類型（例如僅提供者）                 |
| **hybrid-capability** | 多種功能類型（例如提供者 + 語音）            |
| **hook-only**         | 僅有掛鉤，沒有功能                           |
| **non-capability**    | 有工具／命令／服務，但沒有功能               |

使用 `openclaw plugins inspect <id>` 查看外掛的形態。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 註冊 API 與子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) - `api.runtime` 與 `createPluginRuntimeStore`
- [設定與組態](/zh-TW/plugins/sdk-setup) - 資訊清單、設定進入點、延後載入
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建立 `ChannelPlugin` 物件
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 提供者註冊與掛鉤
