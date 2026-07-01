---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你需要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出
sidebarTitle: Plugin SDK overview
summary: 匯入映射、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概觀
x-i18n:
    generated_at: "2026-07-01T18:07:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化合約。本頁是**要匯入什麼**以及**可以註冊什麼**的參考。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。對於想要透過閘道執行代理程式的外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能，請改用
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

每個子路徑都是小型、自包含的模組。這可讓啟動保持快速，並避免循環相依性問題。對於通道專用的進入點/建置輔助工具，請優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣泛的總括介面，以及像 `buildChannelConfigSchema` 這類共享輔助工具。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道所擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共享的 schema 基元和通用建置器。OpenClaw 的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 schema。已棄用的相容性匯出仍保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新外掛應採用的模式。

<Warning>
  不要匯入提供者或通道品牌化的便利銜接層（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建外掛會在自己的 `api.ts` /
  `runtime-api.ts` barrel 內組合通用 SDK 子路徑；核心消費者應使用那些外掛本機 barrel，或在需求真正跨通道時新增狹窄的通用 SDK 合約。

少量內建外掛輔助銜接層在具有已追蹤的擁有者使用情況時，仍會出現在產生的匯出對映中。它們只供內建外掛維護使用，不建議作為新的第三方外掛匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也會作為已棄用的相容性 facade 保留，用於已追蹤的擁有者使用情況。不要將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助工具和通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組依領域分組的狹窄子路徑公開（外掛進入點、通道、提供者、驗證、執行階段、能力、記憶，以及保留的內建外掛輔助工具）。完整目錄（已分組並附連結）請參閱
[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會在扣除列於 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 的 repo 本機測試/內部子路徑後，從公開子集產生。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出數量。已足夠老舊且未由內建擴充功能生產程式碼使用的已棄用公開子路徑，會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用重新匯出 barrel 則追蹤於 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會接收具有以下方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                       |
| `api.registerAgentHarness(...)`                  | 實驗性低階代理程式執行器              |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                |
| `api.registerChannel(...)`                       | 訊息通道                              |
| `api.registerEmbeddingProvider(...)`             | 可重用的向量嵌入提供者                |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                  |
| `api.registerMediaUnderstandingProvider(...)`    | 圖片/音訊/影片分析                    |
| `api.registerImageGenerationProvider(...)`       | 圖片生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                              |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取提供者                 |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者也必須列在外掛 manifest 的 `contracts.embeddingProviders` 中。這是用於可重用向量生成的通用嵌入介面。記憶搜尋可以使用這個通用提供者介面。較舊的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 銜接層是相容性用途，已棄用，會在現有記憶專用提供者遷移期間保留。

仍公開執行階段 `batchEmbed(...)` 的記憶專用提供者，會維持在現有的逐檔案批次合約上，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。這個選擇加入設定可讓記憶主機在一次 `batchEmbed(...)` 呼叫中，提交來自多個髒記憶檔案和已啟用來源的區塊，最多到主機批次限制。上傳 JSONL 請求檔案的批次配接器，也必須在達到其上傳大小上限以及請求數量上限前分割提供者作業。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入區塊傳回一個嵌入；當提供者預期檔案本機批次，或無法在較大的來源範圍作業中保留輸入順序時，請省略此旗標。

### 工具與命令

對於具有固定工具名稱的簡單純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                           | 註冊內容                                      |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理程式工具（必要或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                          |

當代理程式需要簡短、由命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。請讓該文字聚焦於命令本身；不要將提供者或外掛專用政策加入核心提示建置器。

指引項目可以是舊式字串，套用到每個提示介面，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

結構化的 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。對於有意套用到所有介面的指引，請省略 `surfaces`。不要傳入空的 `surfaces` 陣列；它會被拒絕，以免意外的範圍遺失變成全域提示文字。

原生 Codex 應用程式伺服器開發者指令比其他提示介面更嚴格：只有明確限定到 `codex_app_server` 的指引才會被提升到該較高優先順序通道。為了相容性，舊式字串指引和未限定範圍的結構化指引仍可供非 Codex 提示介面使用。

### 基礎架構

| 方法                                           | 註冊內容                              |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件鉤子                              |
| `api.registerHttpRoute(params)`                | 閘道 HTTP 端點                        |
| `api.registerGatewayMethod(name, handler)`     | 閘道 RPC 方法                         |
| `api.registerGatewayDiscoveryService(service)` | 本機閘道探索宣告器                    |
| `api.registerCli(registrar, opts?)`            | 命令列介面子命令                      |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 底下的節點功能命令列介面 |
| `api.registerService(service)`                 | 背景服務                              |
| `api.registerInteractiveHandler(registration)` | 互動式處理器                          |
| `api.registerAgentToolResultMiddleware(...)`   | 執行階段工具結果中介軟體              |
| `api.registerMemoryPromptSupplement(builder)`  | 附加式記憶鄰近提示區段                |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加式記憶搜尋/讀取語料庫             |

### 工作流程外掛的主機鉤子

主機鉤子是供需要參與主機生命週期，而不只是新增提供者、通道或工具的外掛使用的 SDK 銜接層。它們是通用合約；計畫模式可以使用它們，核准工作流程、工作區政策閘門、背景監控、設定精靈和 UI 伴隨外掛也都可以使用。

| 方法                                                                                 | 所擁有的合約                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、JSON 相容的工作階段狀態，透過閘道工作階段投影                                                                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 針對單一工作階段注入下一個代理回合的持久、恰好一次的脈絡                                                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | 受清單控管的可信任前置外掛工具政策，可封鎖或重寫工具參數                                                                                                    |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不變更工具實作                                                                                                                       |
| `api.registerCommand(...)`                                                           | 具範圍的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                           |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 工作階段、工具、執行或設定介面的控制 UI 貢獻描述子                                                                                                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設、刪除、重新載入路徑上，針對外掛擁有的執行階段資源執行清理回呼                                                                                        |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 供工作流程狀態與監控使用的已清理事件訂閱                                                                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在終止執行生命週期時清除                                                                                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有的排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                                              |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建的主機媒介檔案附件傳遞，送往作用中的直接對外工作階段路由                                                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建、由排程支援的排程工作階段回合，加上以標籤為基礎的清理                                                                                              |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道派送的型別化工作階段動作                                                                                                                    |

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

等效的扁平方法仍會以已棄用的相容性別名形式提供給既有外掛。不要新增會直接呼叫 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是以工作階段為範圍、架在閘道排程器上的便利介面。排程擁有時間控制，並在回合執行時建立背景任務記錄；外掛 SDK 只限制目標工作階段、外掛擁有的命名與清理。當工作本身需要持久的多步驟 Task Flow 狀態時，請在排程回合內使用 `api.runtime.tasks.managedFlows`。

這些合約刻意拆分權限：

- 外部外掛可以擁有工作階段擴充、UI 描述子、命令、工具中繼資料、下一回合注入，以及一般鉤子。
- 可信任工具政策會在一般 `before_tool_call` 鉤子之前執行，並受主機信任。內建政策會先執行；已安裝外掛的政策需要明確啟用，並在 `contracts.trustedToolPolicies` 中列出其本機 ID，接著依外掛載入順序執行。政策 ID 的範圍限於註冊它的外掛。
- 保留命令的擁有權僅限內建。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會改變提示的鉤子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、舊版 `before_agent_start` 的提示欄位，以及 `enqueueNextTurnInjection`。

非 Plan 消費者範例：

| 外掛原型                     | 使用的鉤子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令接續、下一回合注入、UI 描述子                                                                                        |
| 預算/工作區政策閘門          | 可信任工具政策、工具中繼資料、工作階段投影                                                                                              |
| 背景生命週期監控             | 執行階段生命週期清理、代理事件訂閱、工作階段排程器擁有權/清理、心跳偵測提示貢獻、UI 描述子                                             |
| 設定或初始導覽精靈           | 工作階段擴充、具範圍命令、控制 UI 描述子                                                                                                |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）
  一律保持 `operator.admin`，即使外掛嘗試指定較窄的閘道方法範圍也是如此。
  外掛擁有的方法請優先使用外掛專屬前綴。
</Note>

<Accordion title="When to use tool-result middleware">
  內建外掛，以及已明確啟用且具備相符清單合約的已安裝外掛，在需要於工具執行後、執行階段將結果送回模型前重寫工具結果時，可以使用 `api.registerAgentToolResultMiddleware(...)`。這是供 tokenjuice 這類非同步輸出縮減器使用、可信任且不綁定執行階段的接合點。

外掛必須針對每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。沒有該合約或未明確啟用的已安裝外掛無法註冊此中介軟體；不需要前置模型工具結果時序的工作，請保留使用一般 OpenClaw 外掛鉤子。舊的僅限嵌入式執行器的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓外掛在 mDNS/Bonjour 等本機探索傳輸上發布作用中的閘道。當啟用本機探索時，OpenClaw 會在閘道啟動期間呼叫該服務，傳入目前的閘道連接埠與非機密 TXT 提示資料，並在閘道關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將發布的 TXT 值視為秘密或驗證資訊。探索只是路由提示；閘道驗證與 TLS 釘選仍負責信任。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：解析時使用的命令描述子，用於命令列介面說明、路由與延遲外掛命令列介面註冊
- `parentPath`：巢狀命令群組的選用父命令路徑，例如 `["nodes"]`

對於配對節點功能，請優先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是包在 `api.registerCli(..., { parentPath: ["nodes"] })` 外的小型包裝器，並讓 `openclaw nodes canvas` 這類命令明確成為外掛擁有的節點功能。

如果你希望外掛命令在一般根命令列介面路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。該立即相容性路徑仍受支援，但不會安裝由描述子支援、供解析時延遲載入使用的預留位置。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 可讓外掛擁有本機 AI 命令列介面後端的預設設定，例如 `claude-cli` 或 `my-cli`。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍然優先。OpenClaw 會在執行命令列介面前，將 `agents.defaults.cliBackends.<id>` 合併覆蓋到
  外掛預設值之上。
- 當後端需要在合併後進行相容性改寫時，請使用 `normalizeConfig`
  （例如正規化舊的旗標形狀）。
- 對於屬於命令列介面方言、以請求為範圍的 argv 改寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 思考層級對應到原生 effort
  旗標。此 hook 會收到 `ctx.executionMode`；使用 `"side-question"` 來為暫時性的 `/btw` 呼叫加入
  後端原生隔離旗標。如果這些旗標能可靠地為原本永遠啟用的命令列介面停用原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。

如需端對端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 獨佔插槽

| 方法                                       | 註冊內容                                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 情境引擎（一次只能有一個處於作用中）。當主機可提供模型/提供者/模式診斷時，生命週期回呼會收到 `runtimeSettings`；較舊的嚴格引擎會在沒有該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶功能                                                                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶清空計畫解析器                                                                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段轉接器                                                                                                                                                                             |

### 已棄用的記憶嵌入轉接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入轉接器       |

- `registerMemoryCapability` 是首選的獨佔記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套外掛透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶成品，
  而不是深入特定記憶外掛的私有版面配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的獨佔記憶外掛 API。
- `MemoryFlushPlan.model` 可以將清空回合固定到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的備援鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入提供者
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 在遷移期間，現有的記憶專用提供者會繼續運作，
  但外掛檢查會將這回報為非內建外掛的相容性債務。

### 事件與生命週期

| 方法                                         | 功能                   |
| -------------------------------------------- | ---------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook    |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼           |

請參閱 [外掛 hooks](/zh-TW/plugins/hooks)，了解範例、常見 hook 名稱與守衛
語意。

### Hook 決策語意

`before_install` 是外掛執行階段生命週期 hook，不是操作者安裝
政策介面。當允許/封鎖決策必須涵蓋命令列介面與閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：回傳 `{ block: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handler 就會被略過。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handler 就會被略過。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 是終止性決策。一旦任何 handler 宣告已處理派送，較低優先序的 handler 與預設模型派送路徑就會被略過。
- `message_sending`：回傳 `{ cancel: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handler 就會被略過。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（等同省略 `cancel`），而不是覆寫。
- `message_received`：當你需要傳入執行緒/主題路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道特定的額外資料。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回通道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不是依賴內部 `gateway:startup` hooks。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 id                                                                                      |
| `api.name`               | `string`                  | 顯示名稱                                                                                     |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                             |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                                             |
| `api.source`             | `string`                  | 外掛來源路徑                                                                                 |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                                           |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內執行階段快照）                                       |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專屬設定                                            |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 具範圍的記錄器（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定窗口                           |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                   |

## 內部模組慣例

在你的外掛中，請使用本機 barrel 檔案進行內部匯入：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  生產程式碼絕不要透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。內部匯入請透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑只是外部合約。
</Warning>

透過 facade 載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入點檔案）會在 OpenClaw 已執行時優先使用
作用中的執行階段設定快照。如果尚無執行階段快照，則會退回磁碟上的已解析設定檔。
封裝後的內建外掛 facade 應透過 OpenClaw 的外掛
facade 載入器載入；直接從 `dist/extensions/...` 匯入會繞過封裝安裝用於外掛擁有程式碼的 manifest
與執行階段 sidecar 檢查。

提供者外掛可以公開狹窄的外掛本機合約 barrel，前提是輔助工具刻意為提供者專用，
且尚不屬於通用 SDK 子路徑。內建範例：

- **Anthropic**：用於 Claude
  beta-header 和 `service_tier` 串流輔助工具的公開 `api.ts` / `contract-api.ts` 接縫。
- **`@openclaw/openai-provider`**：`api.ts` 匯出提供者建構器、
  預設模型輔助工具，以及即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出提供者建構器
  以及 onboarding/設定輔助工具。

<Warning>
  Extension 生產程式碼也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果輔助工具確實共用，請將它提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個
  以功能為導向的介面，而不是將兩個外掛耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與 config" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifest 與設定 schema。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="外掛內部架構" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與功能模型。
  </Card>
</CardGroup>
