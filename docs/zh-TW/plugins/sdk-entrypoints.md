---
read_when:
    - 你需要 `defineToolPlugin`、`definePluginEntry` 或 `defineChannelPluginEntry` 的精確型別簽章
    - 你想了解註冊模式（完整 vs 設定 vs 命令列介面中繼資料）
    - 你正在查詢進入點選項
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 參考指南
title: 外掛進入點
x-i18n:
    generated_at: "2026-07-05T01:58:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eea0981df2d977ac8eceb32a757db3e8edbb57b7a60889dd1dd6ec75e110a230
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個外掛都會匯出一個預設進入物件。SDK 提供用來建立這些物件的輔助工具。

對於已安裝的外掛，`package.json` 應在可用時，將執行階段載入指向已建置的 JavaScript：

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

`extensions` 和 `setupEntry` 仍是工作區與 git checkout 開發的有效原始碼進入點。當 OpenClaw 載入已安裝套件時，會優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件避免執行階段 TypeScript 編譯。明確的執行階段進入點是必要的：`runtimeSetupEntry` 需要 `setupEntry`，而缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 成品時，會讓安裝/探索失敗，而不是無聲地退回原始碼。如果已安裝套件只宣告 TypeScript 原始碼進入點，OpenClaw 會在存在相符的已建置 `dist/*.js` 對應檔時使用它，然後再退回 TypeScript 原始碼。

所有進入路徑都必須留在外掛套件目錄內。執行階段進入點和推斷出的已建置 JavaScript 對應檔，不會讓會跳出目錄的 `extensions` 或 `setupEntry` 原始碼路徑變得有效。

<Tip>
  **想看逐步教學嗎？** 請參閱 [工具外掛](/zh-TW/plugins/tool-plugins)、[通道外掛](/zh-TW/plugins/sdk-channel-plugins) 或 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `defineToolPlugin`

**匯入：** `openclaw/plugin-sdk/tool-plugin`

適用於只新增代理工具的簡單外掛。`defineToolPlugin` 讓撰寫來源保持精簡，從 TypeBox schema 推斷設定和工具參數型別，將純回傳值包裝成 OpenClaw 工具結果格式，並公開靜態中繼資料，讓 `openclaw plugins build` 寫入外掛 manifest。

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

- `configSchema` 是選用項。省略時，OpenClaw 會使用嚴格的空物件 schema，且產生的 manifest 仍會包含 `configSchema`。
- `execute` 會回傳純字串或可 JSON 序列化的值。輔助工具會將它包裝為帶有 `details` 的文字工具結果。
- 對於自訂工具結果，`openclaw/plugin-sdk/tool-results` 會匯出 `textResult` 和 `jsonResult`。
- 工具名稱是靜態的。`openclaw plugins build` 會從宣告的工具衍生 `contracts.tools`，因此作者不需要手動重複名稱。
- 執行階段載入維持嚴格。已安裝外掛仍需要 `openclaw.plugin.json` 和 `package.json` 的 `openclaw.extensions`；OpenClaw 不會執行外掛程式碼來推斷缺少的 manifest 資料。

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

適用於提供者外掛、進階工具外掛、hook 外掛，以及任何**不是**訊息通道的項目。

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

| 欄位 | 型別 | 必填 | 預設值 |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 是 | - |
| `name` | `string` | 是 | - |
| `description` | `string` | 是 | - |
| `kind` | `string` | 否 | - |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空物件 schema |
| `register` | `(api: OpenClawPluginApi) => void` | 是 | - |

- `id` 必須符合你的 `openclaw.plugin.json` manifest。
- `kind` 用於專屬插槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函式，以便延遲求值。
- OpenClaw 會在第一次存取時解析並記憶該 schema，因此成本高的 schema 建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以通道專用接線包裝 `definePluginEntry`。自動呼叫 `api.registerChannel({ plugin })`，公開選用的根說明命令列介面中繼資料 seam，並依註冊模式控管 `registerFull`。

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

| 欄位 | 型別 | 必填 | 預設值 |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 是 | - |
| `name` | `string` | 是 | - |
| `description` | `string` | 是 | - |
| `plugin` | `ChannelPlugin` | 是 | - |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空物件 schema |
| `setRuntime` | `(runtime: PluginRuntime) => void` | 否 | - |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void` | 否 | - |
| `registerFull` | `(api: OpenClawPluginApi) => void` | 否 | - |

- `setRuntime` 會在註冊期間呼叫，讓你可以儲存執行階段參照（通常透過 `createPluginRuntimeStore`）。在擷取命令列介面中繼資料期間會跳過它。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"` 和 `api.registrationMode === "full"` 期間執行。請將它用作通道擁有的命令列介面描述元的標準位置，讓根說明保持不啟動，探索快照包含靜態命令中繼資料，且一般命令列介面命令註冊仍相容於完整外掛載入。
- 探索註冊是不啟動的，但不是免匯入的。OpenClaw 可能會評估受信任的外掛進入點和通道外掛模組來建置快照，因此請讓頂層匯入不含副作用，並將 socket、client、worker 和 service 放在僅限 `"full"` 的路徑後方。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。在僅 setup 載入期間會跳過它。
- 如同 `definePluginEntry`，`configSchema` 可以是延遲 factory，且 OpenClaw 會在第一次存取時記憶已解析的 schema。
- 對於外掛擁有的根命令列介面命令，當你希望命令保持延遲載入但不從根命令列介面解析樹消失時，請優先使用 `api.registerCli(..., { descriptors: [...] })`。對於成對節點功能命令，請優先使用 `api.registerNodeCliFeature(...)`，讓命令落在 `openclaw nodes` 底下。對於其他巢狀外掛命令，請加入 `parentPath`，並在傳給註冊器的 `program` 物件上註冊命令；OpenClaw 會在呼叫外掛前，將它解析為父命令。對於通道外掛，請優先從 `registerCliMetadata(...)` 註冊這些描述元，並讓 `registerFull(...)` 聚焦於僅限執行階段的工作。
- 如果 `registerFull(...)` 也註冊閘道 RPC 方法，請將它們保留在外掛專用前綴上。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉為 `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

適用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，不含執行階段或命令列介面接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw 會在通道停用、未設定，或啟用延遲載入時載入此項，而不是完整進入點。請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)，了解這在何時重要。

實務上，請將 `defineSetupPluginEntry(...)` 與範圍狹窄的 setup 輔助工具系列搭配：

- `openclaw/plugin-sdk/setup-runtime`：用於執行階段安全的 setup 輔助工具，例如 `createSetupTranslator`、匯入安全的 setup patch adapter、lookup-note 輸出、`promptResolvedAllowFrom`、`splitSetupEntries`，以及委派式 setup proxy
- `openclaw/plugin-sdk/channel-setup`：用於選用安裝的 setup 介面
- `openclaw/plugin-sdk/setup-tools`：用於 setup/安裝命令列介面/archive/docs 輔助工具

將大型 SDK、命令列介面註冊，以及長時間存活的執行階段服務保留在完整進入點中。

拆分 setup 與執行階段介面的 bundled 工作區通道，則可改用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。該 contract 讓 setup 進入點保留 setup 安全的外掛/secret 匯出，同時仍公開執行階段 setter：

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

只有在 setup 流程確實需要輕量執行階段 setter，或在完整通道進入點載入前需要 setup 安全的閘道介面時，才使用該 bundled contract。`registerSetupRuntime` 只會針對 `"setup-runtime"` 載入執行；請將它限制在僅設定路由，或必須在延遲完整啟動前存在的方法。

## 註冊模式

`api.registrationMode` 會告訴你的外掛它是如何被載入的：

| 模式              | 使用時機                              | 要註冊的內容                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般閘道啟動            | 全部                                                                                                              |
| `"discovery"`     | 唯讀功能探索    | 通道註冊加上靜態命令列介面描述項；進入程式碼可以載入，但略過通訊端、工作程式、用戶端和服務 |
| `"setup-only"`    | 已停用/未設定的通道     | 僅通道註冊                                                                                               |
| `"setup-runtime"` | 可用執行階段的設定流程 | 通道註冊加上完整進入點載入前所需的輕量執行階段                               |
| `"cli-metadata"`  | 根說明 / 命令列介面中繼資料擷取  | 僅命令列介面描述項                                                                                                    |

`defineChannelPluginEntry` 會自動處理這個拆分。如果你直接對通道使用
`definePluginEntry`，請自行檢查模式：

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

探索模式會建立不啟用的登錄快照。它仍可能評估
外掛進入點和通道外掛物件，讓 OpenClaw 能註冊通道
功能與靜態命令列介面描述項。請將探索期間的模組評估視為
可信但輕量：頂層不得有網路用戶端、子程序、監聽器、資料庫
連線、背景工作程式、憑證讀取，或其他即時執行階段副作用。

請將 `"setup-runtime"` 視為設定專用啟動介面必須存在、但不重新進入
完整內建通道執行階段的窗口。適合的項目包括
通道註冊、設定安全的 HTTP 路由、設定安全的閘道方法，以及
委派的設定輔助工具。繁重的背景服務、命令列介面註冊器，以及
提供者/用戶端 SDK 啟動仍屬於 `"full"`。

特別是命令列介面註冊器：

- 當註冊器擁有一或多個根命令，且你希望 OpenClaw 在第一次叫用時
  延遲載入真正的命令列介面模組，請使用 `descriptors`
- 請確保這些描述項涵蓋註冊器公開的每個頂層命令根
- 描述項命令名稱只使用字母、數字、連字號和底線，
  並以字母或數字開頭；OpenClaw 會拒絕不符合
  這個形狀的描述項名稱，並在呈現說明前從描述中移除終端控制序列
- 只有在急切載入的相容路徑中，才單獨使用 `commands`

## 外掛形態

OpenClaw 會依據載入外掛的註冊行為進行分類：

| 形態                 | 描述                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種功能類型（例如僅提供者）           |
| **hybrid-capability** | 多種功能類型（例如提供者 + 語音） |
| **hook-only**         | 只有鉤子，沒有功能                        |
| **non-capability**    | 工具/命令/服務，但沒有功能        |

使用 `openclaw plugins inspect <id>` 查看外掛的形態。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 註冊 API 和子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [設定與配置](/zh-TW/plugins/sdk-setup) - manifest、設定進入點、延後載入
- [通道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建構 `ChannelPlugin` 物件
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 提供者註冊與鉤子
