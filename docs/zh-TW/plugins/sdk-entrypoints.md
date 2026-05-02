---
read_when:
    - 你需要 definePluginEntry 或 defineChannelPluginEntry 的確切型別簽章
    - 你想了解註冊模式（完整、設定與 CLI 中繼資料）
    - 您正在查詢進入點選項
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 參考資料
title: Plugin 進入點
x-i18n:
    generated_at: "2026-05-02T02:56:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每個 Plugin 都會匯出一個預設入口物件。SDK 提供三個輔助函式來建立它們。

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

`extensions` 和 `setupEntry` 仍是工作區與 git checkout 開發的有效原始碼入口。當 OpenClaw 載入已安裝套件時，優先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，讓 npm 套件可避免執行階段 TypeScript 編譯。必須明確指定執行階段入口：`runtimeSetupEntry` 需要 `setupEntry`，缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 成品時，安裝/探索會失敗，而不是靜默回退到原始碼。如果已安裝套件只宣告 TypeScript 原始碼入口，OpenClaw 會在存在相符的已建置 `dist/*.js` 對應檔時使用它，然後才回退到 TypeScript 原始碼。

所有入口路徑都必須保留在 Plugin 套件目錄內。執行階段入口和推斷出的已建置 JavaScript 對應檔，不會讓逸出套件目錄的 `extensions` 或 `setupEntry` 原始碼路徑變成有效。

<Tip>
  **想找逐步教學？** 請參閱 [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins)
  或 [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) 的逐步指南。
</Tip>

## `definePluginEntry`

**匯入：** `openclaw/plugin-sdk/plugin-entry`

用於提供者 Plugin、工具 Plugin、hook Plugin，以及任何**不是**訊息通道的項目。

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

| 欄位           | 型別                                                             | 必填 | 預設值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | —                   |
| `name`         | `string`                                                         | 是   | —                   |
| `description`  | `string`                                                         | 是   | —                   |
| `kind`         | `string`                                                         | 否   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述      |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | —                   |

- `id` 必須符合你的 `openclaw.plugin.json` manifest。
- `kind` 用於獨占位置：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是延遲求值的函式。
- OpenClaw 會在第一次存取時解析並記憶該結構描述，因此昂貴的結構描述建構器只會執行一次。

## `defineChannelPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

使用通道專屬接線包裝 `definePluginEntry`。自動呼叫 `api.registerChannel({ plugin })`，公開可選的根說明 CLI 中繼資料接縫，並依註冊模式管控 `registerFull`。

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

| 欄位                  | 型別                                                             | 必填 | 預設值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | —                   |
| `name`                | `string`                                                         | 是   | —                   |
| `description`         | `string`                                                         | 是   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空物件結構描述      |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |

- `setRuntime` 會在註冊期間被呼叫，讓你可以儲存執行階段參照（通常透過 `createPluginRuntimeStore`）。它會在 CLI 中繼資料擷取期間略過。
- `registerCliMetadata` 會在 `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"` 和
  `api.registrationMode === "full"` 期間執行。
  將它作為通道擁有的 CLI 描述元的標準位置，讓根說明保持不啟動、探索快照包含靜態命令中繼資料，並讓一般 CLI 命令註冊維持與完整 Plugin 載入相容。
- 探索註冊是不啟動的，不是免匯入的。OpenClaw 可能會評估受信任的 Plugin 入口和通道 Plugin 模組以建置快照，因此請讓頂層匯入保持無副作用，並將 sockets、clients、workers 和 services 放在僅限 `"full"` 的路徑後方。
- `registerFull` 只會在 `api.registrationMode === "full"` 時執行。它會在僅設定載入期間略過。
- 與 `definePluginEntry` 一樣，`configSchema` 可以是延遲工廠，且 OpenClaw 會在第一次存取時記憶已解析的結構描述。
- 對於 Plugin 擁有的根 CLI 命令，若你希望命令維持延遲載入且不從根 CLI 解析樹消失，請優先使用 `api.registerCli(..., { descriptors: [...] })`。對於通道 Plugin，請優先從 `registerCliMetadata(...)` 註冊這些描述元，並讓 `registerFull(...)` 專注於僅限執行階段的工作。
- 如果 `registerFull(...)` 也註冊 Gateway RPC 方法，請將它們放在 Plugin 專屬前綴下。保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律會被強制轉換為 `operator.admin`。

## `defineSetupPluginEntry`

**匯入：** `openclaw/plugin-sdk/channel-core`

用於輕量的 `setup-entry.ts` 檔案。只回傳 `{ plugin }`，不包含執行階段或 CLI 接線。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

當通道被停用、尚未設定，或啟用延遲載入時，OpenClaw 會載入這個入口而非完整入口。請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry) 了解這在何時重要。

實務上，請將 `defineSetupPluginEntry(...)` 與窄範圍設定輔助函式家族搭配使用：

- `openclaw/plugin-sdk/setup-runtime` 用於執行階段安全的設定輔助函式，例如匯入安全的設定修補轉接器、查詢備註輸出、`promptResolvedAllowFrom`、`splitSetupEntries`，以及委派設定代理
- `openclaw/plugin-sdk/channel-setup` 用於可選安裝設定介面
- `openclaw/plugin-sdk/setup-tools` 用於設定/安裝 CLI/封存/文件輔助函式

將重量級 SDK、CLI 註冊和長期存活的執行階段服務保留在完整入口中。

拆分設定與執行階段介面的內建工作區通道，可改用來自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。該契約讓設定入口可保留設定安全的 Plugin/secrets 匯出，同時仍公開執行階段 setter：

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

只有在設定流程確實需要在完整通道入口載入前取得輕量執行階段 setter 時，才使用該內建契約。

## 註冊模式

`api.registrationMode` 會告訴你的 Plugin 它是如何被載入的：

| 模式              | 時機                              | 要註冊的項目                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 一般 Gateway 啟動                 | 所有項目                                                                                                                |
| `"discovery"`     | 唯讀能力探索                      | 通道註冊加上靜態 CLI 描述元；入口程式碼可能會載入，但請略過 sockets、workers、clients 和 services                     |
| `"setup-only"`    | 已停用/未設定的通道               | 僅通道註冊                                                                                                              |
| `"setup-runtime"` | 可用執行階段的設定流程            | 通道註冊加上完整入口載入前所需的輕量執行階段                                                                            |
| `"cli-metadata"`  | 根說明 / CLI 中繼資料擷取         | 僅 CLI 描述元                                                                                                           |

`defineChannelPluginEntry` 會自動處理此拆分。如果你直接對通道使用 `definePluginEntry`，請自行檢查模式：

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

探索模式會建置不啟動的登錄快照。它仍可能評估 Plugin 入口和通道 Plugin 物件，讓 OpenClaw 可以註冊通道能力與靜態 CLI 描述元。請將探索中的模組評估視為受信任但輕量：頂層不得有網路用戶端、子程序、監聽器、資料庫連線、背景工作者、憑證讀取，或其他即時執行階段副作用。

請將 `"setup-runtime"` 視為僅設定啟動介面必須存在、且不重新進入完整內建通道執行階段的窗口。適合的項目包括通道註冊、設定安全的 HTTP 路由、設定安全的 Gateway 方法，以及委派設定輔助函式。重量級背景服務、CLI 註冊器和提供者/用戶端 SDK 啟動仍屬於 `"full"`。

針對 CLI 註冊器：

- 當註冊器擁有一個或多個根命令，且你希望 OpenClaw 在第一次叫用時延遲載入真正的 CLI 模組，請使用 `descriptors`
- 確保這些描述元涵蓋註冊器公開的每個頂層命令根
- 將描述元命令名稱限制為字母、數字、連字號和底線，並以字母或數字開頭；OpenClaw 會拒絕不符合該形狀的描述元名稱，並在呈現說明前從描述中移除終端控制序列
- 只有在急切相容路徑中才單獨使用 `commands`

## Plugin 形狀

OpenClaw 會依據已載入 Plugin 的註冊行為進行分類：

| 形態                  | 說明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一種能力類型（例如：僅提供者）                     |
| **hybrid-capability** | 多種能力類型（例如：提供者 + 語音）                |
| **hook-only**         | 只有鉤子，沒有能力                                 |
| **non-capability**    | 工具/命令/服務，但沒有能力                         |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 註冊 API 和子路徑參考
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [設定與組態](/zh-TW/plugins/sdk-setup) — manifest、設定進入點、延遲載入
- [Channel Plugin](/zh-TW/plugins/sdk-channel-plugins) — 建立 `ChannelPlugin` 物件
- [Provider Plugin](/zh-TW/plugins/sdk-provider-plugins) — 提供者註冊與鉤子
