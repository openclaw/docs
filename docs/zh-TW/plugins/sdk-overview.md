---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你需要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 您正在查找特定的 SDK 匯出
sidebarTitle: Plugin SDK overview
summary: 匯入映射、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概觀
x-i18n:
    generated_at: "2026-07-05T11:37:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00c9ba90e5bef8a08da3a32ee7178c59da7b494d856b22c70a786e2ae735d6f8
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化合約。本頁是 **要匯入什麼** 與 **可以註冊什麼** 的參考資料。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若是想要透過閘道執行代理程式的外部應用程式、指令碼、儀表板、CI 工作與 IDE 擴充功能，請改用
  [外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南？請先閱讀 [建置外掛](/zh-TW/plugins/building-plugins)。通道請使用 [通道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型提供者請使用 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請使用 [命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理程式執行器請使用 [代理程式 harness 外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期 hook 請使用 [外掛 hook](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自包含的模組。這能讓啟動保持快速，並避免循環相依問題。針對通道專用的 entry/build 輔助工具，優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣的總括介面與共享輔助工具，例如 `buildChannelConfigSchema`。

針對通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共享 schema primitives 與通用 builder。OpenClaw 的內建外掛會使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 schema。已棄用的相容性匯出仍保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新外掛應仿照的模式。

<Warning>
  請勿匯入提供者或通道品牌化的便利接縫（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建外掛會在自己的 `api.ts` /
  `runtime-api.ts` barrels 中組合通用 SDK 子路徑；核心消費者應使用那些外掛本地
  barrels，或在需求確實跨通道時新增狹窄的通用 SDK 合約。

一小組內建外掛輔助接縫在有追蹤到擁有者使用情境時，仍會出現在產生的 export
map 中。它們只為內建外掛維護而存在，不建議作為新的第三方外掛匯入路徑。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也會作為已棄用的相容性 facade 保留，用於已追蹤的擁有者使用情境。請勿將這些匯入路徑複製到新外掛中；請改用注入的 runtime 輔助工具與通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組狹窄子路徑公開，並依領域分組（外掛 entry、通道、提供者、auth、runtime、capability、memory，以及保留的內建外掛輔助工具）。完整目錄已分組並附有連結，請參閱
[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器 entrypoint 清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；package exports 會先扣除
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的 repo 本地 test/internal 子路徑，再從 public subset 產生。執行
`pnpm plugin-sdk:surface` 可稽核公開 export 數量。已夠舊且未被內建擴充功能 production code 使用的已棄用公開子路徑，會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；大型已棄用 re-export barrels 會追蹤於
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` callback 會收到一個具有下列方法的 `OpenClawPluginApi` 物件：

### Capability 註冊

| 方法                                             | 註冊內容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                                   |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄列                                                        |
| `api.registerAgentHarness(...)`                  | [實驗性](/zh-TW/plugins/sdk-agent-harness) 原生代理程式執行器（Codex、Copilot）         |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                            |
| `api.registerChannel(...)`                       | 訊息通道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可重用的向量嵌入提供者                                                            |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                                                              |
| `api.registerMediaUnderstandingProvider(...)`    | 圖片/音訊/影片分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                                        |
| `api.registerImageGenerationProvider(...)`       | 圖片生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                          |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 擷取提供者                                                             |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                                            |

以 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者也必須列在外掛 manifest 的 `contracts.embeddingProviders` 中。這是可重用向量生成的通用嵌入介面。Memory search 可使用此通用提供者介面。較舊的
`api.registerMemoryEmbeddingProvider(...)` 與
`contracts.memoryEmbeddingProviders` 接縫，是在現有記憶體專用提供者遷移期間保留的已棄用相容性。

仍公開 runtime `batchEmbed(...)` 的記憶體專用提供者，會保留在現有的每檔案批次合約上，除非其 runtime 明確設定 `sourceWideBatchEmbed: true`。此 opt-in 可讓 memory host 將多個 dirty memory files 與已啟用來源的 chunks，在 host batch 限制內提交到同一次 `batchEmbed(...)` 呼叫。會上傳 JSONL request files 的 batch adapters，除了 request-count cap，也必須在 upload-size cap 之前分割 provider jobs。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入 chunk 回傳一個 embedding；當提供者預期 file-local batches，或無法在較大的 source-wide job 中保留輸入順序時，請省略此 flag。

### 工具與命令

若是具有固定工具名稱的簡單純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。若是混合外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                            | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理程式工具（required 或 `{ optional: true }`） |
| `api.registerCommand(def)`      | 自訂命令（略過 LLM）                          |

當代理程式需要短的、由命令擁有的 routing hint 時，外掛命令可以設定 `agentPromptGuidance`。請讓該文字描述命令本身；不要將提供者或外掛專用 policy 加入核心 prompt builders。

Guidance entries 可以是 legacy strings，適用於每個 prompt surface，也可以是 structured entries：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Structured `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若刻意要 all-surface guidance，請省略 `surfaces`。不要傳入空的 `surfaces` 陣列；它會被拒絕，避免意外的 scope loss 變成全域 prompt text。

原生 Codex app-server developer instructions 比其他 prompt surfaces 更嚴格：只有明確 scoped 到 `codex_app_server` 的 guidance 會被提升到該較高優先權 lane。Legacy string guidance 與未 scoped 的 structured guidance 仍可供非 Codex prompt surfaces 使用，以維持相容性。

### 基礎設施

| 方法                                            | 註冊內容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件 hook                                                    |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP endpoint                                           |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC method                                              |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道 discovery advertiser                                |
| `api.registerCli(registrar, opts?)`             | 命令列介面 subcommand                                        |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 底下的節點 feature 命令列介面               |
| `api.registerService(service)`                  | 背景 service                                                 |
| `api.registerInteractiveHandler(registration)`  | 互動 handler                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | Runtime tool-result middleware                               |
| `api.registerMemoryPromptSupplement(builder)`   | 加成式 memory-adjacent prompt section                        |
| `api.registerMemoryCorpusSupplement(adapter)`   | 加成式 memory search/read corpus                             |
| `api.registerHostedMediaResolver(resolver)`     | Browser-style hosted media URLs 的 resolver                  |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的 prompt/message compatibility text rewrites         |
| `api.registerConfigMigration(migrate)`          | 外掛 runtime 載入前執行的輕量設定 migration                  |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的 importer                               |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定 probe                                 |
| `api.registerReload(registration)`              | reload handling 的 restart/hot/noop config-prefix policy     |
| `api.registerNodeHostCommand(command)`          | 公開給 paired nodes 的命令 handler                           |
| `api.registerNodeInvokePolicy(policy)`          | node-invoked commands 的 allowlist/approval policy            |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的 findings collector              |

### 工作流程外掛的 host hooks

Host hooks 是供需要參與主機生命週期，而不只是新增提供者、通道或工具的外掛使用的 SDK 接縫。它們是通用合約；Plan Mode 可以使用它們，核准工作流程、工作區政策閘門、背景監控、設定精靈和 UI 伴隨外掛也可以使用。

| 方法                                                                                 | 它擁有的合約                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、JSON 相容的工作階段狀態，透過閘道工作階段投射                                                                                                   |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 對單一工作階段注入下一個代理程式回合的持久、恰好一次內容                                                                                                   |
| `api.registerTrustedToolPolicy(...)`                                                 | 受資訊清單控管、可信任的前置外掛工具政策，可封鎖或重寫工具參數                                                                                             |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不變更工具實作                                                                                                                       |
| `api.registerCommand(...)`                                                           | 具範圍的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                           |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 工作階段、工具、執行或設定介面的 Control UI 貢獻描述元                                                                                                     |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設/刪除/重新載入路徑上，用於外掛擁有的執行階段資源的清理回呼                                                                                           |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監控的已清理事件訂閱                                                                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，於終端執行生命週期清除                                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有之排程器作業的清理中繼資料；不排程工作或建立任務記錄                                                                                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建的主機媒介檔案附件傳遞，送至作用中的直接對外工作階段路由                                                                                           |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建、由排程支援的已排程工作階段回合，加上以標籤為基礎的清理                                                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的型別化工作階段動作                                                                                                                   |

新的外掛程式碼請使用分組命名空間：

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

等效的扁平方法仍以已棄用的相容性別名形式提供給既有外掛。請勿新增會直接呼叫 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是工作階段範圍內對閘道排程排程器的便利封裝。排程擁有時序，並在回合執行時建立背景任務記錄；外掛 SDK 只限制目標工作階段、外掛擁有的命名和清理。當工作本身需要持久的多步驟 Task Flow 狀態時，請在已排程回合內使用 `api.runtime.tasks.managedFlows`。

這些合約刻意拆分權限：

- 外部外掛可以擁有工作階段擴充、UI 描述元、命令、工具中繼資料、下一回合注入和一般 hooks。
- 可信任工具政策會在一般 `before_tool_call` hooks 之前執行，並受主機信任。內建政策先執行；已安裝外掛的政策需要明確啟用，並在 `contracts.trustedToolPolicies` 中列出其本機 ID，然後依外掛載入順序執行。政策 ID 的範圍限定於註冊它的外掛。
- 保留命令擁有權僅限內建。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的 hooks，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、來自舊版 `before_agent_start` 的提示欄位，以及 `enqueueNextTurnInjection`。

非 Plan 消費者範例：

| 外掛原型                     | 使用的 hooks                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令延續、下一回合注入、UI 描述元                                                                                    |
| 預算/工作區政策閘門          | 可信任工具政策、工具中繼資料、工作階段投射                                                                                         |
| 背景生命週期監控             | 執行階段生命週期清理、代理程式事件訂閱、工作階段排程器擁有權/清理、心跳偵測提示貢獻、UI 描述元                                    |
| 設定或入門精靈               | 工作階段擴充、具範圍的命令、Control UI 描述元                                                                                      |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使外掛嘗試指派較窄的閘道方法範圍也是如此。外掛擁有的方法請優先使用外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建外掛和已明確啟用且具備相符資訊清單合約的已安裝外掛，若需要在工具執行後、執行階段將結果回饋給模型前重寫工具結果，可以使用 `api.registerAgentToolResultMiddleware(...)`。這是用於非特定執行階段的可信任接縫，適用於 tokenjuice 等非同步輸出縮減器。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。沒有該合約或未明確啟用的已安裝外掛無法註冊此中介軟體；不需要模型前工具結果時序的工作，請保留一般 OpenClaw 外掛 hooks。舊的僅限嵌入式 runner 的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 讓外掛可在 mDNS/Bonjour 等本機探索傳輸上公告作用中的閘道。當本機探索已啟用時，OpenClaw 會在閘道啟動期間呼叫該服務，傳入目前閘道連接埠和非機密 TXT 提示資料，並在閘道關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將公告的 TXT 值視為機密或驗證。探索是路由提示；閘道驗證和 TLS 釘選仍負責信任。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：解析時命令描述元，用於命令列介面說明、路由和延遲外掛命令列介面註冊
- `parentPath`：巢狀命令群組的選用父命令路徑，例如 `["nodes"]`

對於配對節點功能，請優先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小型封裝，並讓 `openclaw nodes canvas` 等命令成為明確的外掛擁有節點功能。

如果你希望外掛命令在一般根命令列介面路徑中維持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

巢狀命令會以 `program` 接收已解析的父命令：

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

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。該急切相容性路徑仍受支援，但不會安裝由描述元支援、用於解析時延遲載入的預留位置。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 讓外掛可擁有本機 AI 命令列介面後端的預設設定，例如 `claude-cli` 或 `my-cli`。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍然優先。OpenClaw 會在執行命令列介面前，將 `agents.defaults.cliBackends.<id>` 合併覆蓋到
  外掛預設值之上。
- 當後端需要在合併後進行相容性重寫時，請使用 `normalizeConfig`
  （例如正規化舊的旗標形狀）。
- 對於屬於命令列介面方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 思考層級對應到原生 effort
  旗標。此 hook 會收到 `ctx.executionMode`；使用 `"side-question"` 為暫時性 `/btw` 呼叫加入
  後端原生隔離旗標。如果這些旗標能可靠地為原本永遠開啟的命令列介面停用原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。

如需端對端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 情境引擎（一次只能有一個作用中）。當主機能提供模型/提供者/模式診斷時，生命週期 callback 會收到 `runtimeSettings`；較舊的 strict engines 會在沒有該 key 的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | 記憶 prompt section builder                                                                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶 flush plan resolver                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | 記憶 runtime adapter                                                                                                                                                                           |

### 已棄用的記憶嵌入 adapter

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入 adapter |

- `registerMemoryCapability` 是偏好的專屬記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓 companion 外掛可透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶 artifacts，
  而不是深入特定
  記憶外掛的私有版面配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的專屬記憶外掛 API。
- `MemoryFlushPlan.model` 可以將 flush turn 固定到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的 fallback
  chain。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入提供者
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 現有記憶專用提供者在遷移
  窗口期間會繼續運作，但外掛檢查會將這回報為
  非 bundled 外掛的相容性債務。

### 事件與生命週期

| 方法                                         | 功能                  |
| -------------------------------------------- | --------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook  |
| `api.onConversationBindingResolved(handler)` | 對話綁定 callback     |

請參閱 [外掛 hooks](/zh-TW/plugins/hooks) 以取得範例、常見 hook 名稱與 guard
語意。

### Hook 決策語意

`before_install` 是外掛 runtime 生命週期 hook，不是 operator install
policy surface。當 allow/block 決策必須涵蓋命令列介面與閘道支援的安裝或更新路徑時，請使用 `security.installPolicy`。

- `before_tool_call`：回傳 `{ block: true }` 是終止性的。一旦任何 handler 設定它，較低優先序的 handler 會被略過。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 是終止性的。一旦任何 handler 設定它，較低優先序的 handler 會被略過。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 是終止性的。一旦任何 handler 宣告 dispatch，較低優先序的 handler 和預設模型 dispatch 路徑會被略過。
- `message_sending`：回傳 `{ cancel: true }` 是終止性的。一旦任何 handler 設定它，較低優先序的 handler 會被略過。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（與省略 `cancel` 相同），而不是覆寫。
- `message_received`：需要 inbound thread/topic routing 時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給 channel-specific extras。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` routing 欄位，再退回到 channel-specific `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不是依賴內部 `gateway:startup` hooks。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。同步外部喚醒排程器時使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為 due checks 與執行的事實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                   |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 id                                                                                |
| `api.name`               | `string`                  | 顯示名稱                                                                               |
| `api.version`            | `string?`                 | 外掛版本（選填）                                                                       |
| `api.description`        | `string?`                 | 外掛描述（選填）                                                                       |
| `api.source`             | `string`                  | 外掛來源路徑                                                                           |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選填）                                                                     |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內 runtime 快照）                                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專屬設定                                      |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/zh-TW/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | 範圍化 logger（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是輕量的 full-entry 前啟動/設定窗口                    |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                             |

## 內部模組慣例

在你的外掛內，使用本機 barrel 檔案進行內部匯入：

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在 production code 中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。請透過 `./api.ts` 或
  `./runtime-api.ts` 路由內部匯入。SDK 路徑僅是外部契約。
</Warning>

透過 facade 載入的 bundled 外掛 public surfaces（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及類似的 public entry files）會在 OpenClaw 已在執行時，優先使用
作用中的 runtime 設定快照。若尚無 runtime
快照，則會退回到磁碟上解析出的設定檔。
已封裝的 bundled 外掛 facades 應透過 OpenClaw 的外掛
facade loaders 載入；直接從 `dist/extensions/...` 匯入會繞過 packaged installs 對外掛擁有程式碼使用的 manifest
與 runtime sidecar checks。

Provider 外掛可以公開狹窄的外掛本機 contract barrel，當某個
helper 有意為 provider-specific，且尚不屬於通用 SDK
subpath。Bundled 範例：

- **Anthropic**：供 Claude
  beta-header 和 `service_tier` stream helpers 使用的 public `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 匯出 provider builders、
  default-model helpers 和 realtime provider builders。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出 provider builder
  以及 onboarding/config helpers。

<Warning>
  Extension production code 也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果某個 helper 確實是共用的，請將它提升到中立的 SDK subpath，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或另一個
  以能力為導向的 surface，而不是讓兩個外掛彼此耦合。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` namespace 參考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifests 和設定 schemas。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint rules。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用 surfaces 遷移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
