---
read_when:
    - 你想要建置一個只新增 agent 工具的簡單 OpenClaw 外掛
    - 您想使用 defineToolPlugin，而不是手寫外掛資訊清單中繼資料
    - 你需要為僅工具型外掛建立腳手架、產生、驗證、測試或發布
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 和 openclaw plugins init/build/validate 建置簡單的型別化代理工具
title: 工具外掛
x-i18n:
    generated_at: "2026-07-05T11:39:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` 會建置一個只新增代理可呼叫工具的外掛：沒有
頻道、模型提供者、hook、服務或設定後端。它會產生 OpenClaw 需要的
manifest metadata，以便在不載入外掛執行階段程式碼的情況下探索工具。

若是提供者、頻道、hook、服務或混合能力外掛，請改從
[建置外掛](/zh-TW/plugins/building-plugins)、[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)，
或[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)開始。

## 需求

- 節點 22.19+、節點 23.11+，或節點 24+。
- TypeScript ESM 套件輸出。
- `dependencies` 中有 `typebox`（不只是 `devDependencies` - 產生的
  外掛會在執行階段匯入它）。
- `openclaw >=2026.5.17`，第一個匯出
  `openclaw/plugin-sdk/tool-plugin` 的版本。
- 一個會發布 `dist/`、`openclaw.plugin.json` 和
  `package.json` 的套件根目錄。

## 快速開始

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` 會建立：

| 檔案                   | 用途                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 含有一個 `echo` 工具的 `defineToolPlugin` 入口                     |
| `src/index.test.ts`    | 斷言工具清單的 metadata 測試                             |
| `tsconfig.json`        | NodeNext TypeScript 輸出到 `dist/`                             |
| `vitest.config.ts`     | 用於 `src/**/*.test.ts` 的 Vitest 設定                              |
| `package.json`         | 腳本、執行階段相依套件、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 為初始工具產生的 manifest metadata                  |

`npm run plugin:build` 會執行 `npm run build` (tsc)，然後執行
`openclaw plugins build --entry ./dist/index.js`。`npm run plugin:validate`
會重新建置並執行 `openclaw plugins validate --entry ./dist/index.js`。
驗證成功會印出：

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` 選項：

| 旗標                 | 預設值            | 效果                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 輸出目錄                       |
| `--name <name>`      | 標題式大小寫的 `<id>` | 顯示名稱                           |
| `--type <type>`      | `tool`             | 建立類型：`tool` 或 `provider`    |
| `--force`            | 關閉                | 覆寫既有的輸出目錄 |

## 撰寫工具

`defineToolPlugin` 會接收外掛身分、選用的設定 schema，以及
靜態工具清單。參數與設定型別會從 TypeBox schema 推斷。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

工具名稱是穩定的 API。請選擇唯一、小寫，且足夠具體的名稱，
以避免與核心工具或其他外掛衝突。

## 選用與 factory 工具

當使用者應該在工具傳送給模型前明確加入允許清單時，設定 `optional: true`。
`openclaw plugins build` 會寫入對應的
`toolMetadata.<tool>.optional` manifest 項目，因此 OpenClaw 可以在不載入
外掛執行階段程式碼的情況下知道該工具是選用的。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

當工具需要執行階段工具內容才能建立時，使用 `factory` - 例如針對特定執行
選擇退出、檢查沙盒狀態，或繫結執行階段 helper。即使具體工具是在
執行階段建置，metadata 仍會保持靜態。

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Factory 仍會預先宣告固定的工具名稱。當外掛會動態計算工具名稱，或將工具
與 hook、服務、提供者或命令結合時，請直接使用 `definePluginEntry`。

## 回傳值

`defineToolPlugin` 會將一般回傳值包裝成 OpenClaw 工具結果格式：

- 當模型應該看到完全相同的文字時，回傳字串。
- 當你希望模型看到格式化 JSON，且希望 OpenClaw 將原始值保留在
  `details` 中時，回傳 JSON 相容值。

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

當你需要自訂 `AgentToolResult`，或想重用既有的
`api.registerTool` 實作時，請使用 factory 工具。

## 設定

`configSchema` 是選用的。省略它時，OpenClaw 會套用嚴格的空物件
schema；產生的 manifest 仍會包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

有 `configSchema` 時，第二個 `execute` 引數會依據它取得型別：

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw 會從閘道設定中的外掛項目讀取外掛設定。不要在來源或文件範例中
硬編碼密鑰；請依照外掛的安全模型使用設定、環境變數或 SecretRefs。

## 產生的 metadata

OpenClaw 必須在匯入外掛執行階段程式碼之前讀取外掛 manifest。
`defineToolPlugin` 會為此公開靜態 metadata，而
`openclaw plugins build` 會將其寫入套件。在變更外掛 id、名稱、描述、
設定 schema、啟用方式或工具名稱後，請重新執行產生器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

單一工具外掛產生的 manifest：

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` 是重要的探索合約：它會告訴 OpenClaw 每個工具由哪個
外掛擁有，而不需要載入每個已安裝外掛的執行階段。過期的 manifest 可能
導致工具從探索中消失，或讓註冊錯誤被歸咎於錯誤的外掛。

## 套件 metadata

`openclaw plugins build` 也會將 `package.json` 對齊所選的執行階段
入口：

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

發布已建置的 JavaScript (`./dist/index.js`)，而不是 TypeScript 來源入口。
來源入口只適用於工作區本機開發。

## 在 CI 中驗證

`plugins build --check` 會在產生的 metadata 過期時失敗，且不會重寫檔案：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 會檢查：

- `openclaw.plugin.json` 存在，且可通過一般 manifest loader。
- 目前入口會匯出 `defineToolPlugin` metadata。
- 產生的 manifest 欄位符合入口 metadata。
- `contracts.tools` 符合宣告的工具名稱。
- `package.json` 會將 `openclaw.extensions` 指向所選的執行階段入口。

## 在本機安裝與檢查

從另一個 OpenClaw checkout 或已安裝的命令列介面，安裝套件路徑：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

若要進行封裝後的 smoke test，請先打包再安裝 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安裝後，重新啟動或重新載入閘道，並請代理使用該工具。如果工具不可見，
請先檢查外掛執行階段和有效的工具目錄，再變更程式碼
（請參閱[疑難排解](#troubleshooting)）。

## 發布

套件準備就緒後，透過 ClawHub 發布。`clawhub package publish` 會接收
來源：本機資料夾、GitHub repo (`owner/repo[@ref]`)，或 tarball URL。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

使用明確的 ClawHub locator 安裝：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在啟動切換期間，裸 npm 套件 spec 仍會從 npm 安裝，但 ClawHub 是
OpenClaw 外掛偏好的探索與發行介面。請參閱 [ClawHub 發布](/zh-TW/clawhub/publishing)
以了解 owner scope 與發布審查。

## 疑難排解

### `plugin entry not found: ./dist/index.js`

所選入口檔案不存在。執行 `npm run build`，然後重新執行
`openclaw plugins build --entry ./dist/index.js` 或
`openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

入口未匯出由 `defineToolPlugin` 建立的值。確認模組的 default export 是
`defineToolPlugin(...)` 結果，或使用 `--entry` 傳入正確入口。

### `openclaw.plugin.json generated metadata is stale`

manifest 不再符合入口 metadata。執行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

提交 `openclaw.plugin.json` 和 `package.json` 兩者的變更。

### `package.json openclaw.extensions must include ./dist/index.js`

套件 metadata 指向不同的執行階段入口。執行
`openclaw plugins build --entry ./dist/index.js`，讓產生器將套件 metadata
對齊你打算發布的入口。

### `Cannot find package 'typebox'`

已建置的外掛會在執行階段匯入 `typebox`。請將它保留在 `dependencies` 中，
重新安裝、重新建置，並重新執行驗證。

### 安裝後工具未出現

依序檢查以下項目：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 具有包含預期工具名稱的 `contracts.tools`。
4. `package.json` 具有 `openclaw.extensions: ["./dist/index.js"]`。
5. 安裝外掛後，已重新啟動或重新載入閘道。

## 另請參閱

- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛清單](/zh-TW/plugins/manifest)
- [外掛命令列介面](/zh-TW/cli/plugins)
- [ClawHub 發布](/zh-TW/clawhub/publishing)
