---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你需要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查找特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概觀
x-i18n:
    generated_at: "2026-07-05T20:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aead8f60f1faf47f8a9bbdc6a889f5f3df7a264c6941119ece26bd26a55d25bf
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化合約。本頁是**要匯入什麼**以及**可以註冊什麼**的參考。

<Note>
  本頁適用於在 OpenClaw 內部使用 `openclaw/plugin-sdk/*` 的外掛作者。對於想要透過閘道執行代理的外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能，請改用
  [外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從[建置外掛](/zh-TW/plugins/building-plugins)開始。通道請使用[通道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型提供者請使用[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請使用[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理執行器請使用[代理框架外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期掛鉤請使用[外掛掛鉤](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型、自成一體的模組。這能讓啟動保持快速，並防止循環相依問題。對於通道專屬的進入點/建置輔助工具，請優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣的傘狀介面，以及像 `buildChannelConfigSchema` 這類共用輔助工具。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用的 Schema 基本元件和通用建置器。OpenClaw 內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 Schema。已棄用的相容性匯出保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 Schema 子路徑都不是新外掛應採用的模式。

<Warning>
  請勿匯入帶有提供者或通道品牌的便利接縫（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建外掛會在自己的 `api.ts` /
  `runtime-api.ts` barrel 內組合通用 SDK 子路徑；核心消費者應使用這些外掛本地
  barrel，或在需求確實跨通道時新增狹窄的通用 SDK 合約。

當少數內建外掛輔助接縫有追蹤到擁有者使用情況時，仍會出現在產生的匯出對應中。它們僅供內建外掛維護使用，不建議作為新的第三方外掛匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也會作為已棄用的相容性 facade 保留，以支援追蹤到的擁有者使用情況。請勿將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助工具與通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組依領域分組的狹窄子路徑公開（外掛進入點、通道、提供者、驗證、執行階段、能力、記憶體，以及保留的內建外掛輔助工具）。完整目錄（已分組並附連結）請參閱
[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從公開子集合產生，並扣除列在
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中的儲存庫本地測試/內部子路徑。執行
`pnpm plugin-sdk:surface` 可稽核公開匯出數量。足夠舊且未被內建擴充功能生產程式碼使用的已棄用公開子路徑，會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用重新匯出 barrel 會追蹤於
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到一個包含下列方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                                  |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄列                                                        |
| `api.registerAgentHarness(...)`                  | [實驗性](/zh-TW/plugins/sdk-agent-harness) 原生代理執行器（Codex、Copilot）             |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                            |
| `api.registerChannel(...)`                       | 訊息通道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入提供者                                                        |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                                                              |
| `api.registerMediaUnderstandingProvider(...)`    | 圖像/音訊/影片分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                                        |
| `api.registerImageGenerationProvider(...)`       | 圖像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                          |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取提供者                                                             |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                                            |

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者，也必須列在外掛 manifest 的 `contracts.embeddingProviders` 中。這是可重複使用向量生成的通用嵌入介面。記憶體搜尋可以使用這個通用提供者介面。較舊的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接縫，是既有記憶體專屬提供者遷移期間的已棄用相容性。

仍公開執行階段 `batchEmbed(...)` 的記憶體專屬提供者，會維持在既有的逐檔批次合約上，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。該選擇加入可讓記憶體主機在一次 `batchEmbed(...)` 呼叫中提交來自多個髒記憶體檔案與已啟用來源的片段，直到主機批次限制為止。會上傳 JSONL 請求檔案的批次配接器，必須在達到上傳大小上限以及請求數量上限之前拆分提供者作業。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入片段傳回一個嵌入；當提供者預期檔案本地批次，或無法在較大的來源範圍作業中保留輸入順序時，請省略此旗標。

### 工具與命令

對於具有固定工具名稱的簡單純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                            | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理工具（必要或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                          |

當代理需要簡短、命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。請讓該文字描述命令本身；不要將提供者或外掛專屬政策加入核心提示建置器。

指引項目可以是舊版字串，會套用到每個提示介面，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

結構化 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若有意提供所有介面的指引，請省略 `surfaces`。請勿傳入空的 `surfaces` 陣列；它會被拒絕，以避免意外遺失範圍而變成全域提示文字。

原生 Codex app-server 開發者指示比其他提示介面更嚴格：只有明確限定到 `codex_app_server` 的指引，才會提升到該較高優先順序的通道。為了相容性，舊版字串指引與未限定範圍的結構化指引仍可用於非 Codex 提示介面。

### 基礎架構

| 方法                                            | 註冊內容                                                 |
| ----------------------------------------------- | -------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 事件掛鉤                                                 |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                           |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                            |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告器                                       |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                         |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的節點功能命令列介面                  |
| `api.registerService(service)`                  | 背景服務                                                 |
| `api.registerInteractiveHandler(registration)`  | 互動式處理器                                             |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                 |
| `api.registerMemoryPromptSupplement(builder)`   | 附加的記憶體相鄰提示區段                                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加的記憶體搜尋/讀取語料庫                              |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器風格託管媒體 URL 的解析器                          |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的提示/訊息相容性文字改寫                        |
| `api.registerConfigMigration(migrate)`          | 外掛執行階段載入前執行的輕量設定遷移                     |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                              |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測                               |
| `api.registerReload(registration)`              | 重新載入處理的重啟/熱重新載入/無操作設定前綴政策         |
| `api.registerNodeHostCommand(command)`          | 公開給配對節點的命令處理器                               |
| `api.registerNodeInvokePolicy(policy)`          | 節點呼叫命令的允許清單/核准政策                          |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現項目收集器               |

### 工作流程外掛的主機掛鉤

主機掛鉤是供需要參與主機生命週期的外掛使用的 SDK 接縫，而不只是新增提供者、通道或工具。它們是通用合約；規劃模式可以使用它們，核准工作流程、工作區政策閘門、背景監控器、設定精靈，以及 UI 伴隨外掛也都可以使用。

| 方法                                                                                 | 其擁有的合約                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、JSON 相容的工作階段狀態，會透過閘道工作階段投射                                                                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 針對單一工作階段，在下一次代理回合中注入的持久、恰好一次內容                                                                                               |
| `api.registerTrustedToolPolicy(...)`                                                 | 受資訊清單控管的受信任前置外掛工具政策，可封鎖或重寫工具參數                                                                                               |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不變更工具實作                                                                                                                       |
| `api.registerCommand(...)`                                                           | 作用域限定的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                       |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 針對工作階段、工具、執行、設定或分頁介面的控制 UI 貢獻描述元                                                                                               |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設/刪除/重新載入路徑中，清理外掛擁有執行階段資源的回呼                                                                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 針對工作流程狀態與監控器的已清理事件訂閱                                                                                                                   |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在終端執行生命週期清除                                                                                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有的排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建的主機媒介檔案附件傳遞，傳送到作用中的直接傳出工作階段路由                                                                                         |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建、由排程支援的已排程工作階段回合，加上以標籤為基礎的清理                                                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道派送的型別化工作階段動作                                                                                                                   |

`surface: "tab"` 描述元會將側邊欄分頁新增到控制 UI。作用中外掛的分頁描述元會在閘道 hello（`controlUiTabs`）中公布給儀表板用戶端，因此只有在外掛啟用時才會顯示該分頁。內建外掛可以為其分頁提供一流的儀表板檢視；其他外掛可以將 `path` 設為外掛 HTTP 路由（請參閱 `api.registerHttpRoute(...)`），由儀表板在沙盒化框架中呈現。`icon` 是儀表板圖示名稱提示，`group` 會選擇側邊欄區段（`control` 或 `agent`），`order` 會在外掛分頁之間排序，而 `requiredScopes` 會對缺少這些操作者作用域的連線隱藏該分頁：

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

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

等效的扁平方法仍以已棄用的相容性別名形式提供給既有外掛使用。請勿新增會直接呼叫 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是閘道排程器之上的工作階段作用域便利層。排程負責時間控制，並在回合執行時建立背景任務記錄；Plugin SDK 只限制目標工作階段、外掛擁有的命名，以及清理。當工作本身需要持久的多步驟任務流程狀態時，請在已排程的回合內使用 `api.runtime.tasks.managedFlows`。

這些合約刻意分拆權限：

- 外部外掛可以擁有工作階段擴充、UI 描述元、命令、工具中繼資料、下一回合注入，以及一般掛鉤。
- 受信任工具政策會在一般 `before_tool_call` 掛鉤之前執行，且由主機信任。內建政策會先執行；已安裝外掛的政策需要明確啟用，並在 `contracts.trustedToolPolicies` 中列出其本機 ID，接著依外掛載入順序執行。政策 ID 的作用域限定在註冊外掛內。
- 保留命令所有權僅限內建外掛。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的掛鉤，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、來自舊版 `before_agent_start` 的提示欄位，以及 `enqueueNextTurnInjection`。

非規劃消費者範例：

| 外掛原型                     | 使用的掛鉤                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令延續、下一回合注入、UI 描述元                                                                                       |
| 預算/工作區政策閘門          | 受信任工具政策、工具中繼資料、工作階段投射                                                                                             |
| 背景生命週期監控器           | 執行階段生命週期清理、代理事件訂閱、工作階段排程器所有權/清理、心跳偵測提示貢獻、UI 描述元                                            |
| 設定或入門精靈               | 工作階段擴充、作用域限定命令、控制 UI 描述元                                                                                           |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律維持 `operator.admin`，即使外掛嘗試指派更窄的閘道方法作用域也是如此。外掛擁有的方法請優先使用外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建外掛，以及明確啟用且具備相符資訊清單合約的已安裝外掛，可以在需要於工具執行後、執行階段將結果回饋給模型之前重寫工具結果時，使用 `api.registerAgentToolResultMiddleware(...)`。這是供 tokenjuice 等非同步輸出縮減器使用的受信任、執行階段中立接縫。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。沒有該合約或未明確啟用的已安裝外掛無法註冊此中介軟體；不需要模型前工具結果時機的工作，請保留使用一般 OpenClaw 外掛掛鉤。舊的僅限嵌入式執行器的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓外掛在本機探索傳輸（例如 mDNS/Bonjour）上公布作用中的閘道。當本機探索啟用時，OpenClaw 會在閘道啟動期間呼叫該服務，傳入目前的閘道連接埠與非秘密 TXT 提示資料，並在閘道關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將公布的 TXT 值視為秘密或驗證。探索只是路由提示；閘道驗證與 TLS 釘選仍負責信任。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：解析時使用的命令描述元，用於命令列介面說明、路由，以及延遲外掛命令列介面註冊
- `parentPath`：巢狀命令群組的選用父命令路徑，例如 `["nodes"]`

對於配對節點功能，請優先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 之上的小型包裝器，並讓 `openclaw nodes canvas` 等命令成為明確的外掛擁有節點功能。

如果你想讓外掛命令在一般根命令列介面路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。
該立即相容路徑仍受支援，但它不會安裝以描述元為基礎的預留位置，
供解析時延遲載入使用。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 讓外掛擁有本機
AI 命令列介面後端的預設設定，例如 `claude-cli` 或 `my-cli`。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併到
  外掛預設值之上，再執行命令列介面。
- 當後端在合併後需要相容性重寫時，請使用 `normalizeConfig`
  （例如正規化舊旗標形狀）。
- 對於屬於命令列介面方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 思考層級對應到原生 effort
  旗標。此掛鉤會收到 `ctx.executionMode`；使用 `"side-question"` 來為暫時性的
  `/btw` 呼叫加入後端原生隔離旗標。如果這些旗標
  能可靠地針對原本永遠開啟的命令列介面停用原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。

如需端對端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 專用槽位

| 方法                                       | 註冊內容                                                                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 情境引擎（同一時間只會有一個啟用）。當主機可提供模型/提供者/模式診斷資訊時，生命週期回呼會收到 `runtimeSettings`；較舊的嚴格引擎會在沒有該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶排清計畫解析器                                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段轉接器                                                                                                                                                                                       |

### 已棄用的記憶嵌入轉接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 啟用外掛的記憶嵌入轉接器         |

- `registerMemoryCapability` 是偏好的專用記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套外掛透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶成品，
  而不是觸及特定記憶外掛的私有版面。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的專用記憶外掛 API。
- `MemoryFlushPlan.model` 可以將排清回合固定到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承啟用中的後援
  鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入提供者
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 既有的記憶專用提供者會在遷移期間繼續運作，
  但對於非內建外掛，外掛檢查會將此回報為相容性債務。

### 事件與生命週期

| 方法                                         | 作用                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤   |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼         |

請參閱[外掛掛鉤](/zh-TW/plugins/hooks)，取得範例、常見掛鉤名稱與防護
語義。

### 掛鉤決策語義

`before_install` 是外掛執行階段生命週期掛鉤，不是操作員安裝
政策介面。當允許/封鎖決策必須涵蓋命令列介面與閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：回傳 `{ block: true }` 會終止流程。一旦任何處理常式設定它，就會略過較低優先順序的處理常式。
- `before_tool_call`：回傳 `{ block: false }` 會視為沒有決策（等同省略 `block`），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 會終止流程。一旦任何處理常式設定它，就會略過較低優先順序的處理常式。
- `before_install`：回傳 `{ block: false }` 會視為沒有決策（等同省略 `block`），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 會終止流程。一旦任何處理常式宣告已分派，就會略過較低優先順序的處理常式與預設模型分派路徑。
- `message_sending`：回傳 `{ cancel: true }` 會終止流程。一旦任何處理常式設定它，就會略過較低優先順序的處理常式。
- `message_sending`：回傳 `{ cancel: false }` 會視為沒有決策（等同省略 `cancel`），而不是覆寫。
- `message_received`：當你需要傳入執行緒/主題路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給頻道特定的額外資料。
- `message_sending`：在退回頻道特定的 `metadata` 前，請先使用型別化的 `replyToId` / `threadId` 路由欄位。
- `gateway_start`：請使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不是依賴內部 `gateway:startup` 掛鉤。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 ID                                                                                      |
| `api.name`               | `string`                  | 顯示名稱                                                                                     |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                             |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                                             |
| `api.source`             | `string`                  | 外掛來源路徑                                                                                 |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                                           |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為啟用中的記憶體內執行階段快照）                                        |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專屬設定                                             |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 範圍化記錄器（`debug`、`info`、`warn`、`error`）                                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定期間                            |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                   |

## 內部模組慣例

在你的外掛中，請使用本機 barrel 檔案進行內部匯入：

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在正式程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。內部匯入請透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅是外部合約。
</Warning>

以 facade 載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入檔案）在 OpenClaw 已在執行時，
會優先使用啟用中的執行階段設定快照。如果還沒有執行階段
快照，它們會退回磁碟上的已解析設定檔。
封裝的內建外掛 facade 應透過 OpenClaw 的外掛
facade 載入器載入；直接從 `dist/extensions/...` 匯入會繞過資訊清單
與執行階段 sidecar 檢查，而封裝安裝會將這些檢查用於外掛擁有的程式碼。

提供者外掛可以公開狹窄的外掛本機合約 barrel，當某個
輔助工具刻意是提供者專用，且尚不屬於泛用 SDK
子路徑時。內建範例：

- **Anthropic**：Claude
  beta-header 與 `service_tier` 串流輔助工具的公開 `api.ts` / `contract-api.ts` 介面。
- **`@openclaw/openai-provider`**：`api.ts` 匯出提供者建構器、
  預設模型輔助工具，以及即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出提供者建構器
  以及入門/設定輔助工具。

<Warning>
  外掛正式程式碼也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果某個輔助工具確實是共享的，請將它提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個
  以能力為導向的介面，而不是將兩個外掛耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參照。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、資訊清單與設定結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="外掛內部" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
