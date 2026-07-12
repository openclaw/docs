---
read_when:
    - 你想建立一個只新增代理工具的簡單 OpenClaw 外掛
    - 你想要使用 defineToolPlugin，而不是手動編寫外掛資訊清單中繼資料
    - 您需要建置骨架、產生、驗證、測試或發布僅含工具的外掛
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 與 openclaw plugins init/build/validate 建置簡單的型別化代理工具
title: 工具外掛
x-i18n:
    generated_at: "2026-07-11T21:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` 會建立只新增可供代理呼叫之工具的外掛：不包含
頻道、模型提供者、掛鉤、服務或設定後端。它會產生 OpenClaw 所需的
資訊清單中繼資料，讓 OpenClaw 無須載入外掛執行階段程式碼即可探索工具。

若要建立提供者、頻道、掛鉤、服務或混合功能外掛，請改從
[建置外掛](/zh-TW/plugins/building-plugins)、[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)
或[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)開始。

## 需求

- Node 22.19+、Node 23.11+ 或 Node 24+。
- TypeScript ESM 套件輸出。
- `dependencies` 中必須包含 `typebox`（不能只放在 `devDependencies` 中，因為產生的
  外掛會在執行階段匯入它）。
- `openclaw >=2026.5.17`，這是第一個匯出
  `openclaw/plugin-sdk/tool-plugin` 的版本。
- 套件根目錄必須發布 `dist/`、`openclaw.plugin.json` 和
  `package.json`。

## 快速開始

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` 會建立以下基本架構：

| 檔案                   | 用途                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 包含一個 `echo` 工具的 `defineToolPlugin` 進入點                     |
| `src/index.test.ts`    | 驗證工具清單的中繼資料測試                             |
| `tsconfig.json`        | 輸出至 `dist/` 的 NodeNext TypeScript 設定                             |
| `vitest.config.ts`     | 適用於 `src/**/*.test.ts` 的 Vitest 設定                              |
| `package.json`         | 指令碼、執行階段相依套件、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 初始工具的已產生資訊清單中繼資料                  |

`npm run plugin:build` 會先執行 `npm run build`（tsc），再執行
`openclaw plugins build --entry ./dist/index.js`。`npm run plugin:validate`
會重新建置並執行 `openclaw plugins validate --entry ./dist/index.js`。
驗證成功時會顯示：

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` 選項：

| 旗標                 | 預設值            | 效果                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 輸出目錄                       |
| `--name <name>`      | 首字母大寫格式的 `<id>` | 顯示名稱                           |
| `--type <type>`      | `tool`             | 基本架構類型：`tool` 或 `provider`    |
| `--force`            | 關閉                | 覆寫現有的輸出目錄 |

## 撰寫工具

`defineToolPlugin` 接受外掛識別資訊、選用的設定結構描述，以及
靜態工具清單。參數與設定型別會從
TypeBox 結構描述推斷。

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

工具名稱是穩定的 API。請選用唯一、全小寫且
足夠明確的名稱，以避免與核心工具或其他外掛發生衝突。

## 選用工具與工廠工具

當使用者應先明確將工具加入允許清單，才將其傳送給模型時，請設定 `optional: true`。
`openclaw plugins build` 會寫入對應的
`toolMetadata.<tool>.optional` 資訊清單項目，讓 OpenClaw 無須載入外掛執行階段程式碼，
即可得知該工具是選用工具。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

當工具必須先取得執行階段工具脈絡才能建立時，請使用 `factory`，例如針對特定執行選擇不建立、
檢查沙箱狀態，或繫結執行階段輔助函式。即使具體工具是在
執行階段建立，中繼資料仍保持靜態。

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

工廠仍需事先宣告固定的工具名稱。當外掛會動態計算工具名稱，或將工具
與掛鉤、服務、提供者或命令結合時，請直接使用 `definePluginEntry`。

## 傳回值

`defineToolPlugin` 會將一般傳回值包裝成 OpenClaw 工具結果
格式：

- 當模型應看到完全相同的文字時，傳回字串。
- 當你希望模型看到格式化的 JSON，
  且 OpenClaw 在 `details` 中保留原始值時，傳回與 JSON 相容的值。

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

當你需要自訂 `AgentToolResult`，或想重複使用現有的
`api.registerTool` 實作時，請使用工廠工具。

## 設定

`configSchema` 為選用項目。省略時，OpenClaw 會套用嚴格的空物件
結構描述；產生的資訊清單仍會包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

使用 `configSchema` 時，第二個 `execute` 引數的型別會由它推斷：

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

OpenClaw 會從閘道設定中的外掛項目讀取外掛設定。請勿
在原始碼或文件範例中寫死密鑰；請依照外掛的安全模型使用設定、環境
變數或 SecretRefs。

## 產生的中繼資料

OpenClaw 必須先讀取外掛資訊清單，才能匯入外掛執行階段程式碼。
`defineToolPlugin` 會公開此用途的靜態中繼資料，而
`openclaw plugins build` 會將其寫入套件。變更外掛 ID、名稱、說明、設定結構描述、
啟用方式或工具名稱後，請重新執行產生器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

單一工具外掛產生的資訊清單：

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

`contracts.tools` 是重要的探索契約：它會告訴 OpenClaw 每個工具由哪個
外掛擁有，而無須載入所有已安裝外掛的執行階段。過時的資訊清單可能導致工具
未出現在探索結果中，或將註冊錯誤歸咎於錯誤的外掛。

## 套件中繼資料

`openclaw plugins build` 也會讓 `package.json` 與所選的執行階段
進入點保持一致：

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

請發布建置完成的 JavaScript（`./dist/index.js`），而不是 TypeScript 原始碼進入點。
原始碼進入點僅適用於工作區內的本機開發。

## 在 CI 中驗證

當產生的中繼資料過時時，`plugins build --check` 會直接失敗而不重寫檔案：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 會檢查：

- `openclaw.plugin.json` 是否存在，並通過一般資訊清單載入器。
- 目前的進入點是否匯出 `defineToolPlugin` 中繼資料。
- 產生的資訊清單欄位是否與進入點中繼資料相符。
- `contracts.tools` 是否與宣告的工具名稱相符。
- `package.json` 是否讓 `openclaw.extensions` 指向所選的執行階段進入點。

## 在本機安裝及檢查

從另一個 OpenClaw 簽出目錄或已安裝的命令列介面安裝套件路徑：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

若要進行封裝後的冒煙測試，請先封裝並安裝 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安裝後，請重新啟動或重新載入閘道，並要求代理使用該
工具。如果工具不可見，請先檢查外掛執行階段和有效的
工具目錄，再變更程式碼（請參閱[疑難排解](#troubleshooting)）。

## 發布

套件準備完成後，請透過 ClawHub 發布。`clawhub package publish`
接受一個來源：本機資料夾、GitHub 儲存庫（`owner/repo[@ref]`）或
tarball URL。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

使用明確的 ClawHub 定位字串安裝：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在啟動切換期間，不帶前綴的 npm 套件規格仍會從 npm 安裝，但
ClawHub 是 OpenClaw 外掛的首選探索與散布介面。
關於擁有者範圍和發布審查，請參閱 [ClawHub 發布](/zh-TW/clawhub/publishing)。

## 疑難排解

### `plugin entry not found: ./dist/index.js`

所選的進入點檔案不存在。請執行 `npm run build`，然後重新執行
`openclaw plugins build --entry ./dist/index.js` 或
`openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

進入點未匯出由 `defineToolPlugin` 建立的值。請確認
模組的預設匯出是 `defineToolPlugin(...)` 的結果，或使用 `--entry`
傳入正確的進入點。

### `openclaw.plugin.json generated metadata is stale`

資訊清單已不再與進入點中繼資料相符。請執行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

請同時提交 `openclaw.plugin.json` 和 `package.json` 的變更。

### `package.json openclaw.extensions must include ./dist/index.js`

套件中繼資料指向不同的執行階段進入點。請執行
`openclaw plugins build --entry ./dist/index.js`，讓產生器將
套件中繼資料與你預計發布的進入點對齊。

### `Cannot find package 'typebox'`

建置後的外掛會在執行階段匯入 `typebox`。請將它保留在 `dependencies` 中，
重新安裝、重新建置，然後再次執行驗證。

### 安裝後未顯示工具

請依序檢查以下項目：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 的 `contracts.tools` 包含預期的工具名稱。
4. `package.json` 包含 `openclaw.extensions: ["./dist/index.js"]`。
5. 安裝外掛後，已重新啟動或重新載入閘道。

## 另請參閱

- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛命令列介面](/zh-TW/cli/plugins)
- [ClawHub 發布](/zh-TW/clawhub/publishing)
