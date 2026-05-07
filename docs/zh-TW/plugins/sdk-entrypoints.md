---
read_when:
    - 你需要 `definePluginEntry` 或 `defineChannelPluginEntry` 的精確型別簽章
    - 你想了解註冊模式（完整、設定與 CLI 中繼資料）
    - 你正在查詢入口點選項
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的參考資料
title: Plugin 入口點
x-i18n:
    generated_at: "2026-05-07T13:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個 Plugin 都會匯出一個預設入口物件。SDK 提供三個協助工具來建立它們。

對於已安裝的 Plugin，`package.json` 應在可用時將執行階段載入指向建置好的 JavaScript：

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

`extensions` 和 `setupEntry` 仍然是 workspace 與 git checkout 開發的有效來源入口。當 OpenClaw 載入已安裝的套件時，會優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件可以避免執行階段 TypeScript 編譯。明確的執行階段入口是必要的：`runtimeSetupEntry` 需要 `setupEntry`，而缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 成品時，安裝或探索會失敗，而不是無聲地退回來源。如果已安裝的套件只宣告 TypeScript 來源入口，OpenClaw 會在存在相符的建置 `dist/*.js` 對應檔時使用它，接著才退回 TypeScript 來源。

所有入口路徑都必須留在 Plugin 套件目錄內。執行階段入口和推斷出的建置 JavaScript 對應檔，不會讓逃出目錄的 `extensions` 或 `setupEntry` 來源路徑變成有效。

<Tip>
  **想找逐步教學嗎？** 請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)
  或[提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

適用於提供者 Plugin、工具 Plugin、Hook Plugin，以及任何**不是**訊息通道的項目。

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

| 欄位           | 類型                                                             | 必填 | 預設值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | -                   |
| `name`         | `string`                                                         | 是   | -                   |
| `description`  | `string`                                                         | 是   | -                   |
| `kind`         | `string`                                                         | 否   | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema       |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -                   |

- `id` 必須符合你的 `openclaw.plugin.json` manifest。
- `kind` 用於專屬 slot：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是用於延遲求值的函式。
- OpenClaw 會在第一次存取時解析並記憶該 schema，因此昂貴的 schema 建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

使用通道專屬 wiring 包裝 `definePluginEntry`。它會自動呼叫 `api.registerChannel({ plugin })`、公開可選的 root-help CLI metadata seam，並依註冊模式 gate `registerFull`。

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

| 欄位                  | 類型                                                             | 必填 | 預設值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | -                   |
| `name`                | `string`                                                         | 是   | -                   |
| `description`         | `string`                                                         | 是   | -                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema       |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -                   |

- `setRuntime` 會在註冊期間呼叫，讓你可以儲存 runtime 參考（通常透過 `createPluginRuntimeStore`）。CLI metadata 擷取期間會略過它。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"` 和 `api.registrationMode === "full"` 期間執行。請將它作為通道擁有的 CLI descriptor 的標準位置，讓 root help 保持不啟用、探索 snapshot 包含靜態指令 metadata，並讓一般 CLI 指令註冊維持與完整 Plugin 載入相容。
- 探索註冊是不啟用的，但不是免匯入的。OpenClaw 可能會評估受信任的 Plugin 入口和通道 Plugin 模組來建置 snapshot，因此請保持頂層匯入沒有副作用，並將 socket、client、worker 和 service 放在只限 `"full"` 的路徑後方。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。setup-only 載入期間會略過它。
- 如同 `definePluginEntry`，`configSchema` 可以是延遲 factory，OpenClaw 會在第一次存取時記憶解析後的 schema。
- 對於 Plugin 擁有的 root CLI 指令，若你希望指令保持延遲載入且不從 root CLI parse tree 消失，請優先使用 `api.registerCli(..., { descriptors: [...] })`。對於成對節點功能指令，請優先使用 `api.registerNodeCliFeature(...)`，讓指令落在 `openclaw nodes` 底下。對於其他巢狀 Plugin 指令，加入 `parentPath`，並在傳給 registrar 的 `program` 物件上註冊指令；OpenClaw 會在呼叫 Plugin 前將它解析到父指令。對於通道 Plugin，請優先從 `registerCliMetadata(...)` 註冊這些 descriptor，並讓 `registerFull(...)` 專注於僅限 runtime 的工作。
- 如果 `registerFull(...)` 也註冊 Gateway RPC 方法，請將它們放在 Plugin 專屬前綴下。保留的核心 admin 命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉為 `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

適用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，沒有 runtime 或 CLI wiring。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當通道被停用、尚未設定，或啟用延遲載入時，OpenClaw 會載入此項而不是完整入口。請參閱 [Setup 和 Config](/zh-TW/plugins/sdk-setup#setup-entry) 了解這何時重要。

實務上，請將 `defineSetupPluginEntry(...)` 搭配範圍較窄的 setup 協助工具系列使用：

- `openclaw/plugin-sdk/setup-runtime` 用於 runtime-safe setup 協助工具，例如 import-safe setup patch adapter、lookup-note output、`promptResolvedAllowFrom`、`splitSetupEntries`，以及委派式 setup proxy
- `openclaw/plugin-sdk/channel-setup` 用於 optional-install setup surface
- `openclaw/plugin-sdk/setup-tools` 用於 setup/install CLI/archive/docs 協助工具

請將重型 SDK、CLI 註冊和長期存在的 runtime service 保留在完整入口中。

分離 setup 與 runtime surface 的內建 workspace 通道，也可以改用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。該 contract 讓 setup 入口可以保留 setup-safe Plugin/secrets 匯出，同時仍然公開 runtime setter：

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

只有在 setup flow 確實需要在完整通道入口載入前使用輕量 runtime setter 時，才使用該內建 contract。

## 註冊模式

`api.registrationMode` 會告訴你的 Plugin 它是如何被載入的：

| 模式              | 時機                              | 要註冊的內容                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般 Gateway 啟動                 | 所有內容                                                                                                                |
| `"discovery"`     | 唯讀能力探索                      | 通道註冊加上靜態 CLI descriptor；入口程式碼可能會載入，但略過 socket、worker、client 和 service                         |
| `"setup-only"`    | 停用或未設定的通道                | 僅通道註冊                                                                                                              |
| `"setup-runtime"` | 可用 runtime 的 setup flow        | 通道註冊加上完整入口載入前所需的輕量 runtime                                                                            |
| `"cli-metadata"`  | Root help / CLI metadata 擷取     | 僅 CLI descriptor                                                                                                       |

`defineChannelPluginEntry` 會自動處理這個分流。如果你直接對通道使用 `definePluginEntry`，請自行檢查模式：

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

探索模式會建置不啟用的 registry snapshot。它仍可能評估 Plugin 入口和通道 Plugin 物件，讓 OpenClaw 可以註冊通道能力與靜態 CLI descriptor。請將探索中的模組評估視為受信任但輕量：頂層不要有網路 client、子行程、listener、資料庫連線、背景 worker、憑證讀取或其他 live runtime 副作用。

請將 `"setup-runtime"` 視為 setup-only 啟動 surface 必須存在、但不重新進入完整內建通道 runtime 的時段。合適的項目包括通道註冊、setup-safe HTTP route、setup-safe Gateway method，以及委派式 setup 協助工具。重型背景 service、CLI registrar 和提供者/client SDK bootstrap 仍屬於 `"full"`。

特別是對 CLI registrar：

- 當 registrar 擁有一個或多個根命令，且你希望 OpenClaw 在第一次呼叫時延遲載入真正的 CLI 模組時，請使用 `descriptors`
- 確認這些 descriptor 涵蓋 registrar 公開的每個頂層命令根
- descriptor 命令名稱請僅使用字母、數字、連字號和底線，並以字母或數字開頭；OpenClaw 會拒絕不符合此格式的 descriptor 名稱，並在呈現說明前從描述中移除終端控制序列
- 只有在積極載入的相容性路徑中才單獨使用 `commands`

## Plugin 形態

OpenClaw 會依照載入的 Plugin 註冊行為進行分類：

| 形態                  | 描述                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種能力類型（例如僅提供者）                      |
| **hybrid-capability** | 多種能力類型（例如提供者 + 語音）                 |
| **hook-only**         | 只有 hook，沒有能力                               |
| **non-capability**    | 工具/命令/服務，但沒有能力                        |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態。

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 註冊 API 與子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) - `api.runtime` 與 `createPluginRuntimeStore`
- [設定與組態](/zh-TW/plugins/sdk-setup) - manifest、設定進入點、延遲載入
- [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) - 建立 `ChannelPlugin` 物件
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) - 提供者註冊與 hook
