---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: Plugin SDK 概述
x-i18n:
    generated_at: "2026-05-07T13:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK 是 Plugin 與核心之間的型別化契約。本頁是
**要匯入什麼**與**可以註冊什麼**的參考。

<Note>
  本頁適用於在 OpenClaw 內部使用 `openclaw/plugin-sdk/*` 的 Plugin 作者。
  對於想要透過 Gateway 執行代理的外部應用程式、腳本、儀表板、CI 作業與 IDE 擴充功能，
  請改用 [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk) 和 `@openclaw/sdk` 套件。
</Note>

<Tip>
正在尋找操作指南嗎？請從[建置 Plugin](/zh-TW/plugins/building-plugins) 開始；通道 Plugin 請使用[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)，供應器 Plugin 請使用[供應器 Plugin](/zh-TW/plugins/sdk-provider-plugins)，本機 AI CLI 後端請使用 [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)，工具或生命週期鉤子 Plugin 請使用 [Plugin 鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自包含的模組。這可讓啟動保持快速，並
避免循環相依問題。對於通道特定的進入點/建置輔助工具，
優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給
較廣的總括介面，以及 `buildChannelConfigSchema` 等共用輔助工具。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。
`plugin-sdk/channel-config-schema` 子路徑適用於共用結構描述基元與通用建構器。
OpenClaw 的內建 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` 來保留
內建通道結構描述。已棄用的相容性匯出仍保留在
`plugin-sdk/channel-config-schema-legacy`；這兩個內建結構描述子路徑都不是新 Plugin 的模式。

<Warning>
  請勿匯入供應器或通道品牌化的便利銜接介面（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建 Plugin 會在自己的 `api.ts` / `runtime-api.ts` 桶式匯出中組合通用 SDK 子路徑；
  核心消費者應使用這些 Plugin 本機桶式匯出，或在需求確實跨通道時新增狹窄的通用 SDK 契約。

少量內建 Plugin 輔助銜接介面在具有追蹤到的擁有者使用情況時，仍會出現在產生的匯出映射中。
它們僅供內建 Plugin 維護使用，不建議作為新第三方 Plugin 的匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也保留為
已棄用的相容性外觀，用於追蹤到的擁有者使用情況。請勿將這些匯入路徑複製到新 Plugin；
請改用注入的執行階段輔助工具和通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

Plugin SDK 會以一組依領域分組的狹窄子路徑公開（Plugin 進入點、
通道、供應器、驗證、執行階段、能力、記憶體，以及保留的內建 Plugin 輔助工具）。
完整目錄已分組並連結，請參閱
[Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

產生的 200 多個子路徑清單位於 `scripts/lib/plugin-sdk-entrypoints.json`。

## 註冊 API

`register(api)` 回呼會收到含有下列方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論 (LLM)                        |
| `api.registerAgentHarness(...)`                  | 實驗性的低階代理執行器               |
| `api.registerCliBackend(...)`                    | 本機 CLI 推論後端                     |
| `api.registerChannel(...)`                       | 訊息通道                              |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                  |
| `api.registerMediaUnderstandingProvider(...)`    | 影像/音訊/影片分析                    |
| `api.registerImageGenerationProvider(...)`       | 影像產生                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂產生                              |
| `api.registerVideoGenerationProvider(...)`       | 影片產生                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取供應器                 |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

### 工具與命令

| 方法                           | 註冊內容                                      |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理工具（必填或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自訂命令（略過 LLM）                          |

當代理需要簡短、由命令擁有的路由提示時，Plugin 命令可以設定 `agentPromptGuidance`。
請讓該文字描述命令本身；不要將供應器或 Plugin 特定政策加入核心提示建構器。

### 基礎設施

| 方法                                           | 註冊內容                               |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件鉤子                               |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端點                      |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                       |
| `api.registerGatewayDiscoveryService(service)` | 本機 Gateway 探索公告器                |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                              |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 底下的 Node 功能 CLI   |
| `api.registerService(service)`                 | 背景服務                               |
| `api.registerInteractiveHandler(registration)` | 互動式處理常式                         |
| `api.registerAgentToolResultMiddleware(...)`   | 執行階段工具結果中介軟體               |
| `api.registerMemoryPromptSupplement(builder)`  | 附加式記憶體相鄰提示區段               |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加式記憶體搜尋/讀取語料庫            |

### 工作流程 Plugin 的主機鉤子

主機鉤子是供需要參與主機生命週期，而不只是新增供應器、通道或工具的 Plugin 使用的 SDK 銜接介面。
它們是通用契約；Plan Mode 可以使用它們，核准工作流程、工作區政策閘門、背景監控程式、設定精靈與 UI 輔助 Plugin 也可以使用。

| 方法                                                                     | 擁有的契約                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin 擁有、JSON 相容的工作階段狀態，透過 Gateway 工作階段投射                                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | 持久、恰好一次的上下文，注入一個工作階段的下一個代理回合                                                                            |
| `api.registerTrustedToolPolicy(...)`                                     | 內建/受信任的前置 Plugin 工具政策，可封鎖或重寫工具參數                                                                             |
| `api.registerToolMetadata(...)`                                          | 工具目錄顯示中繼資料，不變更工具實作                                                                                                |
| `api.registerCommand(...)`                                               | 作用域 Plugin 命令；命令結果可設定 `continueAgent: true`；Discord 原生命令支援 `descriptionLocalizations`                          |
| `api.registerControlUiDescriptor(...)`                                   | 工作階段、工具、執行或設定介面的 Control UI 貢獻描述元                                                                              |
| `api.registerRuntimeLifecycle(...)`                                      | 重設/刪除/重新載入路徑上，Plugin 擁有的執行階段資源清理回呼                                                                         |
| `api.registerAgentEventSubscription(...)`                                | 用於工作流程狀態與監控程式的已清理事件訂閱                                                                                          |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次執行的 Plugin 暫存狀態，會在終端執行生命週期中清除                                                                              |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin 擁有的工作階段排程器作業記錄，具備確定性清理                                                                                |

這些契約刻意拆分權限：

- 外部 Plugin 可以擁有工作階段擴充、UI 描述元、命令、工具中繼資料、下一回合注入，以及一般鉤子。
- 受信任工具政策會在一般 `before_tool_call` 鉤子之前執行，且僅限內建，因為它們會參與主機安全政策。
- 保留命令擁有權僅限內建。外部 Plugin 應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的鉤子，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  舊版 `before_agent_start` 的提示欄位，以及
  `enqueueNextTurnInjection`。

非 Plan 消費者範例：

| Plugin 原型                 | 使用的鉤子                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 核准工作流程                | 工作階段擴充、命令延續、下一回合注入、UI 描述元                                                                                      |
| 預算/工作區政策閘門         | 受信任工具政策、工具中繼資料、工作階段投射                                                                                           |
| 背景生命週期監控程式        | 執行階段生命週期清理、代理事件訂閱、工作階段排程器擁有權/清理、heartbeat 提示貢獻、UI 描述元                                       |
| 設定或上線精靈              | 工作階段擴充、作用域命令、Control UI 描述元                                                                                          |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律保持 `operator.admin`，即使 Plugin 嘗試指派
  較狹窄的 Gateway 方法作用域也一樣。Plugin 擁有的方法請優先使用 Plugin 特定前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  當內建 Plugin 需要在執行後、且執行階段將工具結果回饋給模型之前重寫工具結果時，
  可以使用 `api.registerAgentToolResultMiddleware(...)`。這是受信任且執行階段中立的銜接介面，
  適用於 tokenjuice 等非同步輸出縮減器。

隨附 Plugin 必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["pi", "codex"]`。外部 Plugin
無法註冊此中介軟體；對於不需要模型前工具結果時序的工作，請保留一般的 OpenClaw Plugin hook。
舊的僅限 Pi 的嵌入式
擴充功能工廠註冊路徑已移除。
</Accordion>

### Gateway 探索註冊

`api.registerGatewayDiscoveryService(...)` 讓 Plugin 可在 mDNS/Bonjour 等本機探索傳輸上宣告作用中的
Gateway。啟用本機探索時，OpenClaw 會在 Gateway 啟動期間呼叫該
服務，傳入目前的 Gateway 連接埠和非機密 TXT 提示資料，並在 Gateway 關閉期間呼叫傳回的
`stop` 處理常式。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 探索 Plugin 不得將宣告的 TXT 值視為秘密或
驗證。探索只是路由提示；Gateway 驗證和 TLS 釘選仍然
負責信任。

### CLI 註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：解析時命令描述元，用於 CLI 說明、
  路由，以及延遲 Plugin CLI 註冊
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於配對節點功能，偏好使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 之上的小型包裝器，並讓
`openclaw nodes canvas` 這類命令明確成為 Plugin 擁有的節點功能。

如果你希望 Plugin 命令在一般根 CLI 路徑中保持延遲載入，
請提供涵蓋該註冊器公開之每個頂層命令根的 `descriptors`。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

巢狀命令會以 `program` 接收解析後的父命令：

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在不需要延遲根 CLI 註冊時，才單獨使用 `commands`。
此急切相容路徑仍受支援，但不會為解析時延遲載入安裝
由描述元支援的預留位置。

### CLI 後端註冊

`api.registerCliBackend(...)` 讓 Plugin 擁有本機
AI CLI 後端的預設設定，例如 `codex-cli`。

- 後端 `id` 會成為模型參照中的供應商前綴，例如 `codex-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍優先。OpenClaw 會在執行 CLI 前，將 `agents.defaults.cliBackends.<id>` 合併到
  Plugin 預設值之上。
- 當後端在合併後需要相容性改寫時使用 `normalizeConfig`
  （例如正規化舊的旗標形狀）。
- 對於屬於 CLI 方言的請求範圍 argv 改寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw thinking 等級對應到原生 effort
  旗標。

如需端到端撰寫指南，請參閱
[CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine（一次只能有一個作用中）。`assemble()` 回呼會接收 `availableTools` 和 `citationsMode`，讓引擎可調整 prompt 補充內容。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | 記憶 prompt 區段建構器                                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶 flush 計畫解析器                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段配接器                                                                                                                                        |

### 記憶嵌入配接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中 Plugin 的記憶嵌入配接器 |

- `registerMemoryCapability` 是偏好的專屬記憶 Plugin API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓伴隨 Plugin 透過
  `openclaw/plugin-sdk/memory-host-core` 消耗匯出的記憶成品，而不是進入特定
  記憶 Plugin 的私有版面配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是具舊版相容性的專屬記憶 Plugin API。
- `MemoryFlushPlan.model` 可將 flush 回合釘選到確切的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援
  鏈。
- `registerMemoryEmbeddingProvider` 讓作用中的記憶 Plugin 註冊一個
  或多個嵌入配接器 id（例如 `openai`、`gemini`，或自訂的
  Plugin 定義 id）。
- 使用者設定，例如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`，會依據那些已註冊的
  配接器 id 解析。

### 事件與生命週期

| 方法                                         | 功能                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼         |

範例、常見 hook 名稱和 guard 語意，請參閱 [Plugin hook](/zh-TW/plugins/hooks)。

### Hook 決策語意

- `before_tool_call`：傳回 `{ block: true }` 會終止流程。一旦任何處理常式設定它，較低優先序的處理常式會被略過。
- `before_tool_call`：傳回 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `before_install`：傳回 `{ block: true }` 會終止流程。一旦任何處理常式設定它，較低優先序的處理常式會被略過。
- `before_install`：傳回 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 會終止流程。一旦任何處理常式宣告 dispatch，較低優先序的處理常式和預設模型 dispatch 路徑會被略過。
- `message_sending`：傳回 `{ cancel: true }` 會終止流程。一旦任何處理常式設定它，較低優先序的處理常式會被略過。
- `message_sending`：傳回 `{ cancel: false }` 會被視為沒有決策（等同省略 `cancel`），而不是覆寫。
- `message_received`：當你需要傳入 thread/topic 路由時，請使用型別化 `threadId` 欄位。將 `metadata` 保留給頻道特定的額外資料。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回到頻道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得 gateway 擁有的啟動狀態，而不是依賴內部 `gateway:startup` hook。
- `cron_changed`：觀察 gateway 擁有的 cron 生命週期變更。同步外部喚醒排程器時使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 成為到期檢查與執行的事實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin id                                                                                  |
| `api.name`               | `string`                  | 顯示名稱                                                                                   |
| `api.version`            | `string?`                 | Plugin 版本（選用）                                                                        |
| `api.description`        | `string?`                 | Plugin 描述（選用）                                                                        |
| `api.source`             | `string`                  | Plugin 來源路徑                                                                            |
| `api.rootDir`            | `string?`                 | Plugin 根目錄（選用）                                                                      |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內執行階段快照）                                     |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的 Plugin 特定設定                                      |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | 具範圍的 logger（`debug`、`info`、`warn`、`error`）                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定時段                         |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於 Plugin 根目錄的路徑                                                             |

## 內部模組慣例

在你的 Plugin 中，使用本機 barrel 檔案進行內部匯入：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  絕不要在正式程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的 Plugin。請透過 `./api.ts` 或
  `./runtime-api.ts` 路由內部匯入。SDK 路徑只屬於外部合約。
</Warning>

由 facade 載入的隨附 Plugin 公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入檔案）在 OpenClaw 已執行時，偏好使用
作用中的執行階段設定快照。如果尚無執行階段
快照，則退回到磁碟上解析出的設定檔。
封裝的隨附 Plugin facade 應透過 OpenClaw 的 Plugin
facade 載入器載入；從 `dist/extensions/...` 直接匯入會繞過封裝安裝用於 Plugin 擁有程式碼的 manifest
和 runtime sidecar 檢查。

Provider Plugin 可在輔助工具刻意屬於特定供應商，且尚不適合放入通用 SDK 子路徑時，公開一個範圍狹窄、Plugin 本地的合約 barrel。內建範例：

- **Anthropic**：公開 `api.ts` / `contract-api.ts` seam，用於 Claude
  beta-header 與 `service_tier` 串流輔助工具。
- **`@openclaw/openai-provider`**：`api.ts` 匯出供應商建構器、
  預設模型輔助工具，以及即時供應商建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出供應商建構器，
  以及 onboarding/config 輔助工具。

<Warning>
  擴充功能的正式環境程式碼也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果某個輔助工具確實是共用的，請將它提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個
  以能力為導向的介面，而不是將兩個 Plugin 耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 與 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifest 與組態 schema。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="Plugin 內部" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
