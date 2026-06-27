---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想要一份 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查找特定的 SDK 匯出
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概觀
x-i18n:
    generated_at: "2026-06-27T19:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化合約。本頁是**要匯入什麼**以及**可以註冊什麼**的參考。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若是想透過閘道執行代理的外部應用程式、指令碼、儀表板、CI 作業與 IDE 擴充功能，請改用
  [外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從[建置外掛](/zh-TW/plugins/building-plugins)開始；通道外掛請使用[通道外掛](/zh-TW/plugins/sdk-channel-plugins)，提供者外掛請使用[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請使用[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，工具或生命週期鉤子外掛請使用[外掛鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自含的模組。這能保持啟動快速，並避免循環依賴問題。對於通道專屬的進入點/建置輔助工具，優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣泛的總括介面與共享輔助工具，例如 `buildChannelConfigSchema`。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共享的 schema 基礎元件與通用建置器。OpenClaw 的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 schema。已棄用的相容性匯出保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新外掛應採用的模式。

<Warning>
  請勿匯入提供者或通道品牌化的便利銜接介面（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。內建外掛會在其自己的 `api.ts` / `runtime-api.ts` barrel 內組合通用 SDK 子路徑；核心消費者應使用那些外掛本機 barrel，或在需求確實跨通道時新增狹窄的通用 SDK 合約。

少量內建外掛輔助銜接介面在已有追蹤的擁有者使用情境下，仍會出現在產生的匯出對應中。它們僅供內建外掛維護使用，不建議作為新的第三方外掛匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也會作為已棄用的相容性 facade 保留，以支援已追蹤的擁有者使用情境。請勿將這些匯入路徑複製到新外掛；請改用注入的執行階段輔助工具和通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組依領域分組的狹窄子路徑公開（外掛進入點、通道、提供者、驗證、執行階段、能力、記憶，以及保留的內建外掛輔助工具）。完整目錄已分組並附上連結，請參閱[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的 repo 本機測試/內部子路徑後，從公開子集產生。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出數量。已棄用、足夠舊且未被內建擴充功能正式程式碼使用的公開子路徑，會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用重新匯出 barrel 會追蹤於 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到一個含有以下方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論 (LLM)                        |
| `api.registerAgentHarness(...)`                  | 實驗性低階代理執行器                  |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                |
| `api.registerChannel(...)`                       | 訊息通道                              |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入提供者            |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                  |
| `api.registerMediaUnderstandingProvider(...)`    | 圖像/音訊/影片分析                    |
| `api.registerImageGenerationProvider(...)`       | 圖像產生                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂產生                              |
| `api.registerVideoGenerationProvider(...)`       | 影片產生                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取提供者                 |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者，也必須列於外掛 manifest 的 `contracts.embeddingProviders`。這是用於可重複使用向量產生的通用嵌入介面。記憶搜尋可以使用此通用提供者介面。較舊的 `api.registerMemoryEmbeddingProvider(...)` 與 `contracts.memoryEmbeddingProviders` 銜接介面，會在現有記憶專屬提供者遷移期間作為已棄用的相容性保留。

仍公開執行階段 `batchEmbed(...)` 的記憶專屬提供者，會維持在既有的逐檔批次合約上，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。這個選擇加入可讓記憶主機在一次 `batchEmbed(...)` 呼叫中提交來自多個已變更記憶檔案與已啟用來源的片段，最多達主機批次限制。上傳 JSONL 請求檔的批次適配器，也必須在達到上傳大小上限與請求數量上限前分割提供者作業。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入片段回傳一個嵌入；當提供者預期檔案本機批次，或無法在較大的來源範圍作業中保留輸入順序時，請省略此旗標。

### 工具與命令

對於具有固定工具名稱的簡單純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                            | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理工具（必要或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自訂命令（略過 LLM）                          |

當代理需要簡短、由命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。讓該文字聚焦於命令本身；不要將提供者或外掛專屬政策加入核心提示建置器。

指引項目可以是舊式字串，套用於每個提示介面；也可以是結構化項目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

結構化的 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若刻意要套用於所有介面，請省略 `surfaces`。不要傳入空的 `surfaces` 陣列；它會被拒絕，以免意外遺失作用範圍而變成全域提示文字。

原生 Codex app-server 開發者指示比其他提示介面更嚴格：只有明確限定於 `codex_app_server` 的指引會被提升至該較高優先序通道。舊式字串指引與未限定範圍的結構化指引，為了相容性仍可用於非 Codex 提示介面。

### 基礎設施

| 方法                                           | 註冊內容                              |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件鉤子                              |
| `api.registerHttpRoute(params)`                | 閘道 HTTP 端點                        |
| `api.registerGatewayMethod(name, handler)`     | 閘道 RPC 方法                         |
| `api.registerGatewayDiscoveryService(service)` | 本機閘道探索廣告器                    |
| `api.registerCli(registrar, opts?)`            | 命令列介面子命令                      |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 下的節點功能命令列介面 |
| `api.registerService(service)`                 | 背景服務                              |
| `api.registerInteractiveHandler(registration)` | 互動式處理器                          |
| `api.registerAgentToolResultMiddleware(...)`   | 執行階段工具結果中介軟體              |
| `api.registerMemoryPromptSupplement(builder)`  | 加成式記憶相鄰提示區段                |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加成式記憶搜尋/讀取語料庫             |

### 工作流程外掛的主機鉤子

主機鉤子是供需要參與主機生命週期，而不是只新增提供者、通道或工具的外掛使用的 SDK 銜接介面。它們是通用合約；Plan Mode 可以使用它們，核准工作流程、工作區政策閘、背景監控、設定精靈和 UI 伴隨外掛也可以使用。

| 方法                                                                                 | 其擁有的合約                                                                                                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、與 JSON 相容的工作階段狀態，透過閘道工作階段投影                                                                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久、精確一次的內容，注入至單一工作階段的下一個 agent 回合                                                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | 受 manifest 閘控、受信任的外掛前工具政策，可封鎖或重寫工具參數                                                                    |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不變更工具實作                                                                                              |
| `api.registerCommand(...)`                                                           | 具範圍的外掛命令；命令結果可設定 `continueAgent: true`；Discord 原生命令支援 `descriptionLocalizations`                           |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 工作階段、工具、執行或設定介面的控制 UI 貢獻描述元                                                                                |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設/刪除/重新載入路徑上，清理外掛擁有的執行階段資源的回呼                                                                      |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監控的已清理事件訂閱                                                                                            |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在終止執行生命週期時清除                                                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                      |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建、由主機中介的檔案附件傳遞，傳送至作用中的直接對外工作階段路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建、由排程支援的已排程工作階段回合，以及以標籤為基礎的清理                                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的型別化工作階段動作                                                                                          |

新外掛程式碼請使用分組命名空間：

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

等效的扁平方法仍可作為已棄用的相容性別名，供既有外掛使用。請勿新增會直接呼叫
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是閘道排程器之上的工作階段範圍便利方法。排程負責計時，並在回合執行時建立背景任務記錄；Plugin SDK 僅限制目標工作階段、外掛擁有的命名，以及清理。當工作本身需要持久的多步驟任務流程狀態時，請在已排程回合內使用 `api.runtime.tasks.managedFlows`。

這些合約刻意拆分權限：

- 外部外掛可以擁有工作階段擴充、UI 描述元、命令、工具中繼資料、下一回合注入，以及一般 hook。
- 受信任工具政策會先於一般 `before_tool_call` hook 執行，並受主機信任。內建政策會先執行；已安裝外掛的政策需要明確啟用，加上其在 `contracts.trustedToolPolicies` 中的 local id，並依外掛載入順序接著執行。政策 id 的範圍限定於註冊該政策的外掛。
- 保留命令擁有權僅限內建外掛。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更 prompt 的 hook，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、來自舊版 `before_agent_start` 的 prompt 欄位，以及 `enqueueNextTurnInjection`。

非 Plan 消費者範例：

| 外掛原型                     | 使用的 hook                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 核准工作流程                 | 工作階段擴充、命令接續、下一回合注入、UI 描述元                                                                                     |
| 預算/工作區政策閘門          | 受信任工具政策、工具中繼資料、工作階段投影                                                                                          |
| 背景生命週期監控             | 執行階段生命週期清理、agent 事件訂閱、工作階段排程器擁有權/清理、心跳偵測 prompt 貢獻、UI 描述元                                    |
| 設定或入門精靈               | 工作階段擴充、具範圍的命令、控制 UI 描述元                                                                                           |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律保持 `operator.admin`，即使外掛嘗試指派較窄的閘道方法範圍也是如此。外掛擁有的方法請優先使用外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建外掛，以及已明確啟用且具有相符 manifest 合約的已安裝外掛，可以在需要於工具執行後、執行階段將結果回饋給模型前重寫工具結果時，使用 `api.registerAgentToolResultMiddleware(...)`。這是用於非同步輸出 reducer（例如 tokenjuice）的受信任、執行階段中立接縫。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。沒有該合約或未明確啟用的已安裝外掛，不能註冊此中介軟體；不需要模型前工具結果時序的工作，請保留使用一般 OpenClaw 外掛 hook。舊的僅限嵌入式 runner 的擴充 factory 註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 讓外掛可在本機探索傳輸（例如 mDNS/Bonjour）上公布作用中的閘道。當本機探索啟用時，OpenClaw 會在閘道啟動期間呼叫該服務，傳遞目前的閘道連接埠與非秘密 TXT 提示資料，並在閘道關閉期間呼叫回傳的 `stop` 處理常式。

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

閘道探索外掛不得將公布的 TXT 值視為秘密或驗證。探索是路由提示；信任仍由閘道驗證與 TLS pinning 擁有。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：用於命令列介面說明、路由與延遲外掛命令列介面註冊的剖析時命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如 `["nodes"]`

對於成對節點功能，請優先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝器，並讓像 `openclaw nodes canvas` 這樣的命令成為明確由外掛擁有的節點功能。

若希望外掛命令在一般根命令列介面路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

巢狀命令會收到已解析的父命令作為 `program`：

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

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。該 eager 相容性路徑仍受支援，但它不會安裝由描述元支援、用於剖析時延遲載入的 placeholder。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 讓外掛擁有本機 AI 命令列介面後端（例如 `claude-cli` 或 `my-cli`）的預設設定。

- 後端 `id` 會成為模型參照中的 provider 前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍優先。OpenClaw 會在執行命令列介面前，將 `agents.defaults.cliBackends.<id>` 合併覆蓋到外掛預設值之上。
- 當後端需要在合併後進行相容性重寫時（例如正規化舊旗標形狀），請使用 `normalizeConfig`。
- 對於屬於命令列介面方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，例如將 OpenClaw thinking 等級對應到原生 effort 旗標。此 hook 會收到 `ctx.executionMode`；使用 `"side-question"` 可為暫時性的 `/btw` 呼叫加入後端原生隔離旗標。若這些旗標能可靠地為原本永遠啟用的命令列介面停用原生工具，也請宣告 `sideQuestionToolMode: "disabled"`。

如需端到端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 專屬槽位

| 方法                                       | 其註冊內容                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一個處於啟用狀態）。當主機可提供模型/提供者/模式診斷資訊時，生命週期回呼會接收 `runtimeSettings`；較舊的嚴格引擎會在沒有該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶清除計畫解析器                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段配接器                                                                                                                                                                                 |

### 已淘汰的記憶嵌入配接器

| 方法                                           | 其註冊內容                         |
| ---------------------------------------------- | ---------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 啟用中外掛的記憶嵌入配接器         |

- `registerMemoryCapability` 是首選的獨占記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套外掛可透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶成品，
  而不必深入特定記憶外掛的私有版面配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的獨占記憶外掛 API。
- `MemoryFlushPlan.model` 可將清除回合固定到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承啟用中的備援鏈。
- `registerMemoryEmbeddingProvider` 已淘汰。新的嵌入提供者
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 現有的記憶專用提供者會在遷移期間繼續運作，
  但外掛檢查會將此回報為非內建外掛的相容性債務。

### 事件與生命週期

| 方法                                         | 其作用                 |
| -------------------------------------------- | ---------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤     |
| `api.onConversationBindingResolved(handler)` | 對話綁定回呼           |

請參閱[外掛掛鉤](/zh-TW/plugins/hooks)，了解範例、常見掛鉤名稱和防護語意。

### 掛鉤決策語意

`before_install` 是外掛執行階段生命週期掛鉤，不是操作員安裝
政策介面。當允許/封鎖決策必須涵蓋命令列介面與閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：傳回 `{ block: true }` 代表終止。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `before_tool_call`：傳回 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `before_install`：傳回 `{ block: true }` 代表終止。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `before_install`：傳回 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 代表終止。一旦任何處理常式宣告已處理派送，較低優先順序的處理常式和預設模型派送路徑就會被略過。
- `message_sending`：傳回 `{ cancel: true }` 代表終止。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `message_sending`：傳回 `{ cancel: false }` 會被視為沒有決策（與省略 `cancel` 相同），而不是覆寫。
- `message_received`：需要傳入執行緒/主題路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道特定的額外資訊。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回到通道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不是依賴內部 `gateway:startup` 掛鉤。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

### API 物件欄位

| 欄位                     | 類型                      | 說明                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 id                                                                                   |
| `api.name`               | `string`                  | 顯示名稱                                                                                  |
| `api.version`            | `string?`                 | 外掛版本（選填）                                                                          |
| `api.description`        | `string?`                 | 外掛說明（選填）                                                                          |
| `api.source`             | `string`                  | 外掛來源路徑                                                                              |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選填）                                                                        |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為啟用中的記憶體內執行階段快照）                                    |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛特定設定                                         |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | 範圍化記錄器（`debug`、`info`、`warn`、`error`）                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定期間                        |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                |

## 內部模組慣例

在你的外掛內，使用本機 barrel 檔案進行內部匯入：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在正式環境程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。請透過 `./api.ts` 或
  `./runtime-api.ts` 路由內部匯入。SDK 路徑僅是外部契約。
</Warning>

透過 facade 載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 和類似的公開進入檔案），在 OpenClaw 已執行時，
會優先使用啟用中的執行階段設定快照。如果尚無執行階段快照，
它們會退回到磁碟上已解析的設定檔。
已封裝的內建外掛 facade 應透過 OpenClaw 的外掛
facade 載入器載入；直接從 `dist/extensions/...` 匯入會繞過
已封裝安裝用於外掛擁有程式碼的 manifest 與執行階段 sidecar 檢查。

提供者外掛可以公開狹窄的外掛本機契約 barrel，適用於某個輔助工具刻意
限定於提供者、且尚不屬於通用 SDK 子路徑的情況。內建範例：

- **Anthropic**：用於 Claude
  beta-header 和 `service_tier` 串流輔助工具的公開 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 匯出提供者建構器、
  預設模型輔助工具和即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出提供者建構器
  以及 onboarding/設定輔助工具。

<Warning>
  Extension 正式環境程式碼也應避免
  `openclaw/plugin-sdk/<other-plugin>` 匯入。如果某個輔助工具確實是共用的，
  請將它提升到中立的 SDK 子路徑，例如 `openclaw/plugin-sdk/speech`、
  `.../provider-model-shared` 或另一個以能力為導向的介面，而不是將兩個外掛耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifest 和設定 schema。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具和 lint 規則。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已淘汰介面遷移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
