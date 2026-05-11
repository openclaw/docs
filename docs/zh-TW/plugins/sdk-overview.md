---
read_when:
    - 你需要知道應該從哪個 SDK 子路徑匯入
    - 你想要一份 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: Plugin SDK 概覽
x-i18n:
    generated_at: "2026-05-11T20:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK 是 Plugin 與核心之間的型別化合約。本頁是 **該匯入什麼** 以及 **可以註冊什麼** 的參考。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的 Plugin 作者。對於想要透過 Gateway 執行代理的外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能，請改用
  [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk) 和 `@openclaw/sdk` 套件。
</Note>

<Tip>
想找操作指南嗎？請從 [建置 Plugin](/zh-TW/plugins/building-plugins) 開始；若是頻道 Plugin，請使用 [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)；若是供應商 Plugin，請使用 [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins)；若是本機 AI CLI 後端，請使用 [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)；若是工具或生命週期 Hook Plugin，請使用 [Plugin Hook](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自含的模組。這能讓啟動保持快速，並避免循環相依問題。對於頻道專屬的進入點/建置輔助工具，建議使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣的傘狀介面，以及像
`buildChannelConfigSchema` 這類共用輔助工具。

對於頻道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布頻道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用 schema 基本元件和通用建置器。OpenClaw 的內建 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建頻道 schema。已棄用的相容性匯出仍保留在
`plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新 Plugin 應採用的模式。

<Warning>
  請勿匯入供應商或頻道品牌化的便利銜接層（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建 Plugin 會在自己的 `api.ts` /
  `runtime-api.ts` barrel 內組合通用 SDK 子路徑；核心消費者應使用那些 Plugin 本機 barrel，或是在需求確實跨頻道時新增狹窄的通用 SDK 合約。

一小組內建 Plugin 輔助銜接層仍會在產生的匯出對應中出現，前提是它們有被追蹤到的擁有者使用情境。它們只用於內建 Plugin 維護，不建議作為新的第三方 Plugin 匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也保留為已棄用的相容性 facade，以支援被追蹤的擁有者使用情境。請勿將這些匯入路徑複製到新 Plugin；請改用注入的執行階段輔助工具和通用頻道 SDK 子路徑。
</Warning>

## 子路徑參考

Plugin SDK 以一組依領域分組的狹窄子路徑公開（Plugin 進入點、頻道、供應商、驗證、執行階段、能力、記憶體，以及保留的內建 Plugin 輔助工具）。完整目錄已分組並附連結，請參閱
[Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從公開子集產生，並扣除列在
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中的 repo 本機測試/內部子路徑。執行
`pnpm plugin-sdk:surface` 以稽核公開匯出數量。足夠舊且未被內建擴充功能生產程式碼使用的已棄用公開子路徑會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用再匯出 barrel 會追蹤於
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到具有以下方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                      |
| `api.registerAgentHarness(...)`                  | 實驗性的低階代理執行器              |
| `api.registerCliBackend(...)`                    | 本機 CLI 推論後端                    |
| `api.registerChannel(...)`                       | 訊息頻道                              |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成               |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                 |
| `api.registerMediaUnderstandingProvider(...)`    | 圖片/音訊/影片分析                   |
| `api.registerImageGenerationProvider(...)`       | 圖像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                              |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取供應商                |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

### 工具與命令

| 方法                           | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理工具（必需或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                         |

當代理需要簡短、由命令擁有的路由提示時，Plugin 命令可以設定 `agentPromptGuidance`。請讓該文字描述命令本身；不要將供應商或 Plugin 專屬政策加入核心 prompt 建置器。

### 基礎設施

| 方法                                           | 註冊內容                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook                               |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端點                       |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                        |
| `api.registerGatewayDiscoveryService(service)` | 本機 Gateway 探索廣播器                 |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                              |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 下的 Node 功能 CLI     |
| `api.registerService(service)`                 | 背景服務                                |
| `api.registerInteractiveHandler(registration)` | 互動式處理器                            |
| `api.registerAgentToolResultMiddleware(...)`   | 執行階段工具結果中介軟體                |
| `api.registerMemoryPromptSupplement(builder)`  | 附加的記憶體相鄰 prompt 區段           |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加的記憶體搜尋/讀取語料庫            |

### 工作流程 Plugin 的主機 Hook

主機 Hook 是 SDK 銜接層，供需要參與主機生命週期，而非只新增供應商、頻道或工具的 Plugin 使用。它們是通用合約；Plan Mode 可以使用它們，核准工作流程、工作區政策閘道、背景監控器、設定精靈和 UI 伴隨 Plugin 也可以使用。

| 方法                                                                                 | 擁有的合約                                                                                                                        |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin 擁有、JSON 相容，並透過 Gateway 工作階段投影的工作階段狀態                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 針對單一工作階段，在下一個代理回合注入的持久且恰好一次的上下文                                                                  |
| `api.registerTrustedToolPolicy(...)`                                                 | 可封鎖或改寫工具參數的內建/受信任 pre-plugin 工具政策                                                                            |
| `api.registerToolMetadata(...)`                                                      | 不變更工具實作的工具目錄顯示中繼資料                                                                                            |
| `api.registerCommand(...)`                                                           | 具範圍的 Plugin 命令；命令結果可設定 `continueAgent: true`；Discord 原生命令支援 `descriptionLocalizations`                     |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 用於工作階段、工具、執行或設定介面的控制 UI 貢獻描述元                                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | reset/delete/reload 路徑上 Plugin 擁有的執行階段資源清理回呼                                                                     |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監控器的已消毒事件訂閱                                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的 Plugin 暫存狀態，會在終端執行生命週期清除                                                                            |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 擁有排程器作業的清理中繼資料；不會排程工作或建立任務記錄                                                                 |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建、由主機媒介的檔案附件傳遞，送往作用中的直接外送工作階段路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建、由 Cron 支援的已排程工作階段回合，以及以標籤為基礎的清理                                                              |
| `api.session.controls.registerSessionAction(...)`                                    | 客戶端可透過 Gateway 派送的型別化工作階段動作                                                                                   |

新 Plugin 程式碼請使用分組命名空間：

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

等效的扁平方法仍作為已棄用的相容性別名提供給既有 Plugin 使用。請勿新增會直接呼叫
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的新 Plugin 程式碼。

`scheduleSessionTurn(...)` 是 Gateway
Cron 排程器上的工作階段範圍便利封裝。Cron 擁有計時，並在該輪次執行時建立背景任務記錄；Plugin SDK 只約束目標工作階段、Plugin 擁有的命名，以及清理。當工作本身需要持久的多步驟 TaskFlow 狀態時，請在排程的輪次中使用 `api.runtime.tasks.managedFlows`。

合約刻意拆分權限：

- 外部 plugins 可以擁有工作階段擴充、UI 描述器、命令、工具中繼資料、下一輪注入，以及一般 hooks。
- 受信任的工具政策會先於一般 `before_tool_call` hooks 執行，且僅限內建，因為它們參與主機安全政策。
- 保留命令所有權僅限內建。外部 plugins 應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的 hooks，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  舊版 `before_agent_start` 的提示欄位，以及
  `enqueueNextTurnInjection`。

非 Plan 使用者範例：

| Plugin 原型                  | 使用的 hooks                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令延續、下一輪注入、UI 描述器                                                                                        |
| 預算/工作區政策閘門         | 受信任的工具政策、工具中繼資料、工作階段投影                                                                                         |
| 背景生命週期監視器           | 執行階段生命週期清理、代理事件訂閱、工作階段排程器所有權/清理、Heartbeat 提示貢獻、UI 描述器 |
| 設定或入門精靈               | 工作階段擴充、範圍化命令、控制 UI 描述器                                                                                              |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持為 `operator.admin`，即使某個 plugin 嘗試指派更窄的 gateway 方法範圍也是如此。對於
  plugin 擁有的方法，請優先使用 plugin 專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建 plugins 可以在需要於工具執行後、執行階段將結果回饋給模型前重寫工具結果時，使用 `api.registerAgentToolResultMiddleware(...)`。這是供非特定執行階段的受信任非同步輸出縮減器使用的銜接點，例如 tokenjuice。

內建 plugins 必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["pi", "codex"]`。外部 plugins
無法註冊此中介軟體；不需要模型前工具結果時機的工作，請維持使用一般 OpenClaw plugin hooks。舊的僅 Pi 內嵌
擴充工廠註冊路徑已移除。
</Accordion>

### Gateway 探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓 plugin 在本機探索傳輸（例如 mDNS/Bonjour）上公告作用中的
Gateway。當本機探索啟用時，OpenClaw 會在
Gateway 啟動期間呼叫該服務，傳入目前的 Gateway 連接埠和非機密 TXT 提示資料，並在 Gateway 關閉期間呼叫回傳的
`stop` 處理器。

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

Gateway 探索 plugins 不得將公告的 TXT 值視為機密或驗證。探索只是路由提示；Gateway 驗證和 TLS 釘選仍然擁有信任。

### CLI 註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：由註冊器擁有的明確命令名稱
- `descriptors`：用於 CLI 說明、
  路由，以及延遲 plugin CLI 註冊的解析時命令描述器
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於成對節點功能，請優先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型封裝，並讓 `openclaw nodes canvas` 這類命令明確成為 plugin 擁有的節點功能。

如果你想讓 plugin 命令在一般根 CLI 路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的
`descriptors`。

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

巢狀命令會以解析後的父命令作為 `program` 接收：

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
這個立即相容性路徑仍受支援，但它不會安裝由描述器支援、用於解析時延遲載入的預留位置。

### CLI 後端註冊

`api.registerCliBackend(...)` 可讓 plugin 擁有本機
AI CLI 後端（例如 `codex-cli`）的預設設定。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `codex-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍會優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併到
  plugin 預設值上，再執行 CLI。
- 當後端需要在合併後進行相容性重寫時，請使用 `normalizeConfig`
  （例如將舊旗標形狀正規化）。
- 對於屬於 CLI 方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 思考層級對應到原生 effort
  旗標。

如需端到端撰寫指南，請參閱
[CLI 後端 plugins](/zh-TW/plugins/cli-backend-plugins)。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次一個作用中）。`assemble()` 回呼會接收 `availableTools` 和 `citationsMode`，讓引擎能調整提示增補。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶清除計畫解析器                                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段配接器                                                                                                                                        |

### 記憶嵌入配接器

| 方法                                           | 註冊內容                                 |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中 plugin 的記憶嵌入配接器 |

- `registerMemoryCapability` 是首選的專屬記憶 plugin API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套 plugins 能透過
  `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶成品，而不是深入特定
  記憶 plugin 的私有版面。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是舊版相容的專屬記憶 plugin API。
- `MemoryFlushPlan.model` 可以將清除輪次釘選到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援
  鏈。
- `registerMemoryEmbeddingProvider` 可讓作用中的記憶 plugin 註冊一個或多個嵌入配接器 ID（例如 `openai`、`gemini`，或自訂
  plugin 定義的 ID）。
- 使用者設定（例如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`）會依據那些已註冊的
  配接器 ID 解析。

### 事件與生命週期

| 方法                                         | 作用                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook  |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼         |

請參閱 [Plugin hooks](/zh-TW/plugins/hooks)，了解範例、常見 hook 名稱，以及防護語意。

### Hook 決策語意

- `before_tool_call`：回傳 `{ block: true }` 是終止性決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（等同於省略 `block`），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 是終止性決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（等同於省略 `block`），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 是終止性決策。一旦任何處理器宣告已分派，較低優先序的處理器和預設模型分派路徑就會被略過。
- `message_sending`：回傳 `{ cancel: true }` 是終止性決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（等同於省略 `cancel`），而不是覆寫。
- `message_received`：當你需要傳入 thread/topic 路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道專屬的額外資料。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回到通道專屬的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得 gateway 擁有的啟動狀態，而不是依賴內部 `gateway:startup` hooks。
- `cron_changed`：觀察 gateway 擁有的 cron 生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

### API 物件欄位

| 欄位                     | 類型                      | 說明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | 顯示名稱                                                                                    |
| `api.version`            | `string?`                 | Plugin 版本（選用）                                                                         |
| `api.description`        | `string?`                 | Plugin 說明（選用）                                                                         |
| `api.source`             | `string`                  | Plugin 來源路徑                                                                             |
| `api.rootDir`            | `string?`                 | Plugin 根目錄（選用）                                                                       |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內 runtime 快照）                                      |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的 Plugin 專屬設定                                       |
| `api.runtime`            | `PluginRuntime`           | [Runtime 輔助工具](/zh-TW/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | 作用域 logger（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定視窗                          |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於 Plugin 根目錄的路徑                                                              |

## 內部模組慣例

在你的 Plugin 中，內部匯入請使用本機 barrel 檔案：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生產程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的 Plugin。內部匯入請透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅是外部合約。
</Warning>

透過 facade 載入的內建 Plugin 公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入點檔案）會在 OpenClaw
已執行時優先使用作用中的 runtime 設定快照。若尚無 runtime
快照，則會退回使用磁碟上解析出的設定檔。
已封裝的內建 Plugin facade 應透過 OpenClaw 的 Plugin
facade loader 載入；直接從 `dist/extensions/...` 匯入會繞過封裝安裝用於
Plugin 所屬程式碼的 manifest 與 runtime sidecar 檢查。

當輔助工具刻意為 provider 專屬，且尚不屬於通用 SDK
子路徑時，Provider Plugin 可以公開一個狹窄的 Plugin 本機合約 barrel。
內建範例：

- **Anthropic**：供 Claude
  beta-header 與 `service_tier` 串流輔助工具使用的公開 `api.ts` / `contract-api.ts` 邊界。
- **`@openclaw/openai-provider`**：`api.ts` 匯出 provider builder、
  default-model 輔助工具與 realtime provider builder。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出 provider builder
  以及 onboarding/設定輔助工具。

<Warning>
  Extension 生產程式碼也應避免匯入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某個輔助工具確實為共用項目，請將它提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個
  以能力為導向的介面，而不是把兩個 Plugin 耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 與 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifest 與設定 schema。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
