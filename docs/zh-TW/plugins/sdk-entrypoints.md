---
read_when:
    - 您需要 definePluginEntry 或 defineChannelPluginEntry 的確切型別簽章
    - 您想了解註冊模式（完整 vs 設定 vs CLI 中繼資料）
    - 您正在查詢進入點選項
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的參考資料
title: Plugin 入口點
x-i18n:
    generated_at: "2026-05-06T09:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個 Plugin 都會匯出一個預設入口物件。SDK 提供三個 helper 來建立它們。

對於已安裝的 Plugin，`package.json` 應該在可用時將執行階段載入指向建置好的 JavaScript：

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

`extensions` 和 `setupEntry` 仍然是工作區與 git checkout 開發的有效來源入口。當 OpenClaw 載入已安裝的套件時，會優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件避免執行階段 TypeScript 編譯。必須明確提供執行階段入口：`runtimeSetupEntry` 需要 `setupEntry`，而缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 成品會讓安裝/探索失敗，而不是靜默退回來源。如果已安裝套件只宣告 TypeScript 來源入口，OpenClaw 會在存在相符的建置後 `dist/*.js` 對應檔時使用它，然後才退回 TypeScript 來源。

所有入口路徑都必須留在 Plugin 套件目錄內。執行階段入口與推斷出的建置後 JavaScript 對應檔，並不會讓逸出目錄的 `extensions` 或 `setupEntry` 來源路徑變成有效。

<Tip>
  **想找逐步教學嗎？** 請參閱 [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)
  或 [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

用於提供者 Plugin、工具 Plugin、Hook Plugin，以及任何**不是**
訊息通道的項目。

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

| 欄位           | 型別                                                             | 必填 | 預設值       |
| -------------- | ---------------------------------------------------------------- | ---- | ------------ |
| `id`           | `string`                                                         | 是   | -            |
| `name`         | `string`                                                         | 是   | -            |
| `description`  | `string`                                                         | 是   | -            |
| `kind`         | `string`                                                         | 否   | -            |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -            |

- `id` 必須符合你的 `openclaw.plugin.json` manifest。
- `kind` 用於專屬 slot：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函式，以便延遲求值。
- OpenClaw 會在首次存取時解析並 memoize 該 schema，因此昂貴的 schema
  builder 只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

以通道專屬 wiring 包裝 `definePluginEntry`。會自動呼叫
`api.registerChannel({ plugin })`、公開可選的 root-help CLI metadata
seam，並依 registration mode 控制 `registerFull`。

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

| 欄位                  | 型別                                                             | 必填 | 預設值       |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------ |
| `id`                  | `string`                                                         | 是   | -            |
| `name`                | `string`                                                         | 是   | -            |
| `description`         | `string`                                                         | 是   | -            |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -            |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件 schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -            |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -            |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -            |

- `setRuntime` 會在註冊期間呼叫，讓你可以儲存 runtime 參考
  （通常透過 `createPluginRuntimeStore`）。在 CLI metadata
  擷取期間會略過它。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"`，以及
  `api.registrationMode === "full"` 期間執行。
  請將它作為通道擁有的 CLI descriptor 的標準位置，讓 root help
  維持非啟動式、探索 snapshot 包含靜態命令 metadata，並讓一般 CLI
  命令註冊與完整 Plugin 載入保持相容。
- 探索註冊是非啟動式，而不是免匯入。OpenClaw 可能會評估受信任的 Plugin
  入口與通道 Plugin 模組來建立 snapshot，因此請讓頂層匯入沒有副作用，並將 socket、
  client、worker 和 service 放在僅 `"full"` 的路徑後面。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。它會在僅設定載入期間被略過。
- 與 `definePluginEntry` 一樣，`configSchema` 可以是延遲 factory，且 OpenClaw
  會在首次存取時 memoize 已解析的 schema。
- 對於 Plugin 擁有的 root CLI 命令，若你希望命令保持延遲載入但不從
  root CLI parse tree 消失，請優先使用 `api.registerCli(..., { descriptors: [...] })`。
  對於通道 Plugin，請優先從 `registerCliMetadata(...)` 註冊這些 descriptor，
  並讓 `registerFull(...)` 專注於僅執行階段的工作。
- 如果 `registerFull(...)` 也註冊 Gateway RPC 方法，請將它們放在
  Plugin 專屬前綴下。保留的核心 admin namespace（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉為
  `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，沒有
runtime 或 CLI wiring。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當通道被停用、未設定，或啟用延遲載入時，OpenClaw 會載入此項而非完整入口。
請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry) 了解這在何時重要。

實務上，請將 `defineSetupPluginEntry(...)` 搭配狹窄的 setup helper
家族使用：

- `openclaw/plugin-sdk/setup-runtime` 用於 runtime-safe 的 setup helper，例如
  import-safe setup patch adapter、lookup-note 輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的 setup proxy
- `openclaw/plugin-sdk/channel-setup` 用於 optional-install setup surface
- `openclaw/plugin-sdk/setup-tools` 用於 setup/install CLI/archive/docs helper

請將大型 SDK、CLI 註冊，以及長生命週期的執行階段 service 保留在完整
入口中。

拆分 setup 與 runtime surface 的 bundled 工作區通道，可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。該 contract 可讓 setup
入口保留 setup-safe 的 Plugin/secrets 匯出，同時仍公開 runtime setter：

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

只有當 setup flow 確實需要在完整通道入口載入前使用輕量 runtime
setter 時，才使用該 bundled contract。

## 註冊模式

`api.registrationMode` 會告訴你的 Plugin 它是如何被載入的：

| 模式              | 時機                              | 要註冊的內容                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般 Gateway 啟動                 | 所有內容                                                                                                                |
| `"discovery"`     | 唯讀能力探索                      | 通道註冊加上靜態 CLI descriptor；入口程式碼可能會載入，但略過 socket、worker、client 和 service |
| `"setup-only"`    | 停用/未設定的通道                 | 僅通道註冊                                                                                                              |
| `"setup-runtime"` | 有 runtime 可用的 setup flow      | 通道註冊加上完整入口載入前所需的輕量 runtime                                                                           |
| `"cli-metadata"`  | Root help / CLI metadata 擷取     | 僅 CLI descriptor                                                                                                       |

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

探索模式會建立非啟動式 registry snapshot。它仍可能評估 Plugin
入口與通道 Plugin 物件，讓 OpenClaw 可以註冊通道能力與靜態 CLI
descriptor。請將探索中的模組評估視為受信任但輕量：頂層不要有 network client、
subprocess、listener、database connection、background worker、credential read，
或其他即時 runtime 副作用。

請將 `"setup-runtime"` 視為一個期間：setup-only 啟動 surface 必須存在，
但不能重新進入完整的 bundled 通道 runtime。適合的項目包括通道註冊、
setup-safe HTTP route、setup-safe Gateway 方法，以及委派的 setup helper。
大型背景 service、CLI registrar，以及 provider/client SDK bootstrap
仍然屬於 `"full"`。

特別針對 CLI registrar：

- 當 registrar 擁有一個或多個 root command，且你希望 OpenClaw
  在首次呼叫時延遲載入真正的 CLI 模組，請使用 `descriptors`
- 請確保這些 descriptor 涵蓋 registrar 公開的每個 top-level command root
- descriptor command name 只能使用字母、數字、連字號與底線，且必須以字母或數字開頭；OpenClaw 會拒絕不符合該形狀的 descriptor name，並在呈現 help 前從 description 中移除 terminal control sequence
- 只有在 eager compatibility path 中才單獨使用 `commands`

## Plugin 形狀

OpenClaw 會依照已載入 Plugins 的註冊行為進行分類：

| 形態                  | 說明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種 capability 類型（例如僅 provider）            |
| **hybrid-capability** | 多種 capability 類型（例如 provider + speech）     |
| **hook-only**         | 僅有 hooks，沒有 capabilities                      |
| **non-capability**    | Tools/commands/services，但沒有 capabilities       |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態。

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 註冊 API 與 subpath 參考
- [Runtime Helpers](/zh-TW/plugins/sdk-runtime) - `api.runtime` 與 `createPluginRuntimeStore`
- [設定與 Config](/zh-TW/plugins/sdk-setup) - manifest、setup 進入點、延遲載入
- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) - 建構 `ChannelPlugin` 物件
- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) - provider 註冊與 hooks
