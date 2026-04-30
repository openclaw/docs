---
read_when:
    - 你需要 definePluginEntry 或 defineChannelPluginEntry 的精確型別簽章
    - 你想了解註冊模式（full、setup 與 CLI 中繼資料）
    - 正在查詢進入點選項
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的參考文件
title: Plugin 入口點
x-i18n:
    generated_at: "2026-04-30T03:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個 Plugin 都會匯出一個預設進入點物件。SDK 提供三個輔助函式用來建立它們。

對於已安裝的 Plugin，`package.json` 應在可用時將執行階段載入指向已建置的 JavaScript：

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

`extensions` 和 `setupEntry` 仍然是工作區與 git checkout 開發的有效來源進入點。當 OpenClaw 載入已安裝套件時，優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件可避免執行階段 TypeScript 編譯。如果已安裝套件只宣告 TypeScript 來源進入點，OpenClaw 會在存在相符的已建置 `dist/*.js` 對應檔時使用它，然後才退回 TypeScript 來源。

所有進入點路徑都必須留在 Plugin 套件目錄內。執行階段進入點與推斷出的已建置 JavaScript 對應檔，並不會讓逸出目錄的 `extensions` 或 `setupEntry` 來源路徑變成有效。

<Tip>
  **想找逐步指南？** 請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)
  或[提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

適用於提供者 Plugin、工具 Plugin、hook Plugin，以及任何**不是**訊息通道的項目。

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

| 欄位           | 型別                                                             | 必填 | 預設值             |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`           | `string`                                                         | 是   | —                  |
| `name`         | `string`                                                         | 是   | —                  |
| `description`  | `string`                                                         | 是   | —                  |
| `kind`         | `string`                                                         | 否   | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema      |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | —                  |

- `id` 必須與你的 `openclaw.plugin.json` manifest 相符。
- `kind` 用於互斥槽位：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函式，以便延遲求值。
- OpenClaw 會在第一次存取時解析並記憶該 schema，因此昂貴的 schema
  建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以通道專用接線包裝 `definePluginEntry`。它會自動呼叫
`api.registerChannel({ plugin })`，公開選用的根說明 CLI 中繼資料接合點，
並依註冊模式控管 `registerFull`。

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

| 欄位                  | 型別                                                             | 必填 | 預設值             |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                  | `string`                                                         | 是   | —                  |
| `name`                | `string`                                                         | 是   | —                  |
| `description`         | `string`                                                         | 是   | —                  |
| `plugin`              | `ChannelPlugin`                                                  | 是   | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema      |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | —                  |

- `setRuntime` 會在註冊期間被呼叫，讓你可以儲存執行階段參照
  （通常透過 `createPluginRuntimeStore`）。CLI 中繼資料擷取期間會略過它。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"` 和
  `api.registrationMode === "full"` 期間執行。
  請將它作為通道擁有的 CLI 描述元的標準位置，讓根說明保持非啟用狀態、
  discovery 快照包含靜態命令中繼資料，並讓一般 CLI 命令註冊維持與完整 Plugin 載入相容。
- Discovery 註冊是非啟用的，不是免匯入的。OpenClaw 可能會
  求值受信任的 Plugin 進入點與通道 Plugin 模組以建置
  快照，因此請讓頂層匯入不含副作用，並將 socket、
  client、worker 和 service 放在僅限 `"full"` 的路徑後方。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。setup-only 載入期間會略過它。
- 與 `definePluginEntry` 一樣，`configSchema` 可以是延遲 factory，OpenClaw
  會在第一次存取時記憶解析後的 schema。
- 對於 Plugin 擁有的根 CLI 命令，如果你希望命令維持延遲載入且不從
  根 CLI 解析樹中消失，請優先使用 `api.registerCli(..., { descriptors: [...] })`。
  對於通道 Plugin，請優先從 `registerCliMetadata(...)` 註冊這些描述元，
  並讓 `registerFull(...)` 專注於僅限執行階段的工作。
- 如果 `registerFull(...)` 也註冊 gateway RPC 方法，請將它們放在
  Plugin 專用前綴下。保留的核心管理命名空間（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉為
  `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

適用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，沒有
執行階段或 CLI 接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當通道停用、尚未設定，或啟用延遲載入時，OpenClaw 會載入此項而不是完整進入點。
請參閱 [Setup 與 Config](/zh-TW/plugins/sdk-setup#setup-entry)，了解此情況何時重要。

實務上，請將 `defineSetupPluginEntry(...)` 與範圍較窄的 setup 輔助函式
系列搭配使用：

- `openclaw/plugin-sdk/setup-runtime` 用於執行階段安全的 setup 輔助函式，例如
  匯入安全的 setup patch adapter、lookup-note 輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的 setup proxy
- `openclaw/plugin-sdk/channel-setup` 用於選用安裝的 setup 介面
- `openclaw/plugin-sdk/setup-tools` 用於 setup/install CLI/archive/docs 輔助函式

請將重量級 SDK、CLI 註冊，以及長期存在的執行階段 service 放在完整
進入點中。

拆分 setup 與執行階段介面的內建工作區通道，可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。該 contract 讓 setup 進入點保留
setup-safe 的 Plugin/secrets 匯出，同時仍公開執行階段 setter：

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
});
```

只有在 setup 流程真正需要在完整通道進入點載入前使用輕量執行階段
setter 時，才使用該內建 contract。

## 註冊模式

`api.registrationMode` 會告訴你的 Plugin 它是如何載入的：

| 模式              | 時機                             | 要註冊的內容                                                                                                            |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般 Gateway 啟動                | 所有內容                                                                                                                |
| `"discovery"`     | 唯讀 capability discovery        | 通道註冊加上靜態 CLI 描述元；進入點程式碼可能會載入，但需略過 socket、worker、client 和 service                         |
| `"setup-only"`    | 停用/未設定的通道                | 僅通道註冊                                                                                                              |
| `"setup-runtime"` | setup 流程且執行階段可用         | 通道註冊加上完整進入點載入前所需的輕量執行階段                                                                          |
| `"cli-metadata"`  | 根說明 / CLI 中繼資料擷取        | 僅 CLI 描述元                                                                                                           |

`defineChannelPluginEntry` 會自動處理這個分流。如果你直接對通道使用
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

Discovery 模式會建置非啟用的 registry 快照。它仍可能求值
Plugin 進入點與通道 Plugin 物件，讓 OpenClaw 可以註冊通道
capability 與靜態 CLI 描述元。請將 discovery 中的模組求值視為受信任但輕量：
頂層不要有網路 client、子程序、listener、資料庫連線、背景 worker、
credential 讀取，或其他即時執行階段副作用。

請將 `"setup-runtime"` 視為 setup-only 啟動介面必須存在、但不重新進入
完整內建通道執行階段的時段。適合的項目包括通道註冊、setup-safe HTTP route、
setup-safe Gateway 方法，以及委派的 setup 輔助函式。重量級背景 service、
CLI registrar，以及提供者/client SDK bootstrap 仍應放在 `"full"` 中。

特別針對 CLI registrar：

- 當 registrar 擁有一或多個根命令，且你希望 OpenClaw 在第一次叫用時才延遲載入真正的 CLI 模組，請使用 `descriptors`
- 確保這些描述元涵蓋 registrar 公開的每個頂層命令根
- 描述元命令名稱僅可使用字母、數字、連字號和底線，
  並以字母或數字開頭；OpenClaw 會拒絕不符合該形狀的描述元名稱，
  並在轉譯說明前從描述中移除終端控制序列
- 只有在 eager 相容路徑中才單獨使用 `commands`

## Plugin 形狀

OpenClaw 會依載入的 Plugin 註冊行為對其分類：

| 形態                  | 說明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種能力類型（例如僅供應商）                      |
| **hybrid-capability** | 多種能力類型（例如供應商 + 語音）                 |
| **hook-only**         | 只有 hooks，沒有能力                              |
| **non-capability**    | 工具/命令/服務，但沒有能力                        |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態。

## 相關內容

- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 註冊 API 和子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [設定與組態](/zh-TW/plugins/sdk-setup) — manifest、設定進入點、延遲載入
- [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins) — 建立 `ChannelPlugin` 物件
- [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins) — 供應商註冊和 hooks
