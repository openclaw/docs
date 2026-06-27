---
read_when:
    - 你需要 defineToolPlugin、definePluginEntry 或 defineChannelPluginEntry 的精確型別簽章
    - 你想了解註冊模式（完整 vs 設定 vs 命令列介面中繼資料）
    - 你正在查詢進入點選項
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 參考指南
title: 外掛進入點
x-i18n:
    generated_at: "2026-06-27T19:48:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個外掛都會匯出預設進入物件。SDK 提供用於建立它們的輔助工具。

對於已安裝的外掛，`package.json` 應在可用時將執行階段載入指向已建置的 JavaScript：

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

`extensions` 和 `setupEntry` 仍然是工作區與 git checkout 開發的有效原始碼進入點。當 OpenClaw 載入已安裝的套件時，會優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件避免在執行階段編譯 TypeScript。必須明確提供執行階段進入點：`runtimeSetupEntry` 需要 `setupEntry`，而缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 成品時，安裝/探索會失敗，而不是靜默退回到原始碼。如果已安裝的套件只宣告 TypeScript 原始碼進入點，OpenClaw 會在存在相符的已建置 `dist/*.js` 對應檔時使用它，然後才退回到 TypeScript 原始碼。

所有進入路徑都必須留在外掛套件目錄內。執行階段進入點和推斷出的已建置 JavaScript 對應檔，不會讓跳出套件目錄的 `extensions` 或 `setupEntry` 原始碼路徑變得有效。

<Tip>
  **想找逐步說明嗎？** 請參閱 [工具外掛](/zh-TW/plugins/tool-plugins)、[頻道外掛](/zh-TW/plugins/sdk-channel-plugins) 或 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `defineToolPlugin`

**匯入：** `openclaw/plugin-sdk/tool-plugin`

適用於只新增代理工具的簡單外掛。`defineToolPlugin` 讓撰寫原始碼保持精簡，從 TypeBox schema 推斷設定和工具參數型別，將普通回傳值包裝成 OpenClaw 工具結果格式，並公開靜態中繼資料，供 `openclaw plugins build` 寫入外掛 manifest。

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

- `configSchema` 是選用的。省略時，OpenClaw 會使用嚴格的空物件 schema，且產生的 manifest 仍會包含 `configSchema`。
- `execute` 會回傳普通字串或可 JSON 序列化的值。輔助工具會將它包裝成帶有 `details` 的文字工具結果。
- 工具名稱是靜態的。`openclaw plugins build` 會從宣告的工具衍生 `contracts.tools`，因此作者不需要手動重複名稱。
- 執行階段載入仍然嚴格。已安裝的外掛仍需要 `openclaw.plugin.json` 和 `package.json` 的 `openclaw.extensions`；OpenClaw 不會執行外掛程式碼來推斷缺少的 manifest 資料。

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

適用於提供者外掛、進階工具外掛、hook 外掛，以及任何**不是**訊息頻道的項目。

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

| 欄位           | 型別                                                             | 必填 | 預設值            |
| -------------- | ---------------------------------------------------------------- | ---- | ----------------- |
| `id`           | `string`                                                         | 是   | -                 |
| `name`         | `string`                                                         | 是   | -                 |
| `description`  | `string`                                                         | 是   | -                 |
| `kind`         | `string`                                                         | 否   | -                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -                 |

- `id` 必須符合你的 `openclaw.plugin.json` manifest。
- `kind` 用於獨佔插槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函式，以便延遲求值。
- OpenClaw 會在第一次存取時解析並記憶該 schema，因此昂貴的 schema 建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以頻道專用接線包裝 `definePluginEntry`。自動呼叫 `api.registerChannel({ plugin })`，公開選用的根說明命令列介面中繼資料接縫，並依註冊模式限制 `registerFull`。

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

| 欄位                  | 型別                                                             | 必填 | 預設值            |
| --------------------- | ---------------------------------------------------------------- | ---- | ----------------- |
| `id`                  | `string`                                                         | 是   | -                 |
| `name`                | `string`                                                         | 是   | -                 |
| `description`         | `string`                                                         | 是   | -                 |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -                 |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -                 |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -                 |

- `setRuntime` 會在註冊期間呼叫，讓你可以儲存 runtime 參照（通常透過 `createPluginRuntimeStore`）。在命令列介面中繼資料擷取期間會略過它。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"` 和 `api.registrationMode === "full"` 期間執行。將它作為頻道擁有命令列介面描述子的標準位置，讓根說明保持不啟用、探索快照包含靜態命令中繼資料，且一般命令列介面命令註冊仍與完整外掛載入相容。
- 探索註冊是不啟用的，但不是免匯入的。OpenClaw 可能會評估受信任的外掛進入點和頻道外掛模組來建置快照，因此請讓頂層匯入保持無副作用，並將 socket、client、worker 和 service 放在僅限 `"full"` 的路徑之後。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。在僅設定載入期間會略過它。
- 與 `definePluginEntry` 一樣，`configSchema` 可以是延遲 factory，且 OpenClaw 會在第一次存取時記憶已解析的 schema。
- 對於外掛擁有的根命令列介面命令，若想讓命令維持延遲載入且不從根命令列介面剖析樹消失，請優先使用 `api.registerCli(..., { descriptors: [...] })`。對於成對節點功能命令，請優先使用 `api.registerNodeCliFeature(...)`，讓命令落在 `openclaw nodes` 底下。對於其他巢狀外掛命令，請加入 `parentPath`，並在傳給註冊器的 `program` 物件上註冊命令；OpenClaw 會在呼叫外掛之前將它解析到父命令。對於頻道外掛，請優先從 `registerCliMetadata(...)` 註冊這些描述子，並讓 `registerFull(...)` 專注於僅限執行階段的工作。
- 如果 `registerFull(...)` 也註冊閘道 RPC 方法，請將它們放在外掛專用前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉為 `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

適用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，不包含 runtime 或命令列介面接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當頻道停用、未設定，或啟用延遲載入時，OpenClaw 會載入它而不是完整進入點。請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)，了解何時會有影響。

實務上，請將 `defineSetupPluginEntry(...)` 與精簡的設定輔助工具家族搭配使用：

- `openclaw/plugin-sdk/setup-runtime` 用於 runtime 安全的設定輔助工具，例如 `createSetupTranslator`、匯入安全的設定修補配接器、查詢備註輸出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委派設定代理
- `openclaw/plugin-sdk/channel-setup` 用於選用安裝設定介面
- `openclaw/plugin-sdk/setup-tools` 用於設定/安裝命令列介面/封存/文件輔助工具

請將重量級 SDK、命令列介面註冊，以及長生命週期的 runtime service 放在完整進入點中。

拆分設定與 runtime 介面的內建工作區頻道，可以改用 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。該 contract 讓設定進入點保留設定安全的 plugin/secrets 匯出，同時仍公開 runtime setter：

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

只有在設定流程真正需要於完整頻道進入點載入前提供輕量 runtime setter 或設定安全閘道介面時，才使用該內建 contract。`registerSetupRuntime` 只會針對 `"setup-runtime"` 載入執行；請將它限制在僅限組態的 route 或必須在延遲完整啟用前存在的方法。

## 註冊模式

`api.registrationMode` 會告訴你的外掛它是如何被載入的：

| 模式              | 時機                              | 要註冊的內容                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般閘道啟動            | 所有內容                                                                                                              |
| `"discovery"`     | 唯讀功能探索    | 通道註冊加上靜態命令列介面描述元；進入點程式碼可以載入，但要略過 socket、worker、client 和 service |
| `"setup-only"`    | 已停用/未設定的通道     | 僅通道註冊                                                                                               |
| `"setup-runtime"` | 可用執行階段的設定流程 | 通道註冊加上完整進入點載入前所需的輕量執行階段                               |
| `"cli-metadata"`  | 根說明 / 命令列介面中繼資料擷取  | 僅命令列介面描述元                                                                                                    |

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

探索模式會建置不啟動的註冊表快照。它仍可能評估
外掛進入點與通道外掛物件，讓 OpenClaw 可以註冊通道
功能與靜態命令列介面描述元。請將探索中的模組評估視為
受信任但輕量：頂層不得有網路 client、子行程、監聽器、資料庫
連線、背景 worker、認證讀取，或其他即時執行階段副作用。

請將 `"setup-runtime"` 視為設定專用啟動介面必須存在、
且不重新進入完整 bundled 通道執行階段的窗口。適合的項目包括
通道註冊、設定安全的 HTTP 路由、設定安全的閘道方法，以及
委派的設定 helper。重量級背景 service、命令列介面註冊器，以及
provider/client SDK 啟動仍屬於 `"full"`。

特別針對命令列介面註冊器：

- 當註冊器擁有一個或多個根命令，且你希望 OpenClaw 在第一次叫用時
  延遲載入真正的命令列介面模組，請使用 `descriptors`
- 確保這些描述元涵蓋註冊器公開的每個頂層命令根
- 將描述元命令名稱限制為字母、數字、連字號和底線，
  並以字母或數字開頭；OpenClaw 會拒絕不符合此形狀的描述元名稱，
  並在轉譯說明前從描述中移除終端控制序列
- 只有在 eager 相容性路徑中才單獨使用 `commands`

## 外掛形態

OpenClaw 會依已載入外掛的註冊行為分類：

| 形態                 | 說明                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種功能類型（例如僅 provider）           |
| **hybrid-capability** | 多種功能類型（例如 provider + speech） |
| **hook-only**         | 僅 hook，沒有功能                        |
| **non-capability**    | tool/command/service，但沒有功能        |

使用 `openclaw plugins inspect <id>` 查看外掛的形態。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 註冊 API 與子路徑參考
- [執行階段 Helper](/zh-TW/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [設定與 Config](/zh-TW/plugins/sdk-setup) - manifest、設定進入點、延後載入
- [通道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置 `ChannelPlugin` 物件
- [Provider 外掛](/zh-TW/plugins/sdk-provider-plugins) - provider 註冊與 hook
