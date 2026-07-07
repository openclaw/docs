---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 您正在查詢特定的 SDK 匯出項
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概覽
x-i18n:
    generated_at: "2026-07-06T21:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2c03d5321285292bfcb2d241b158e59be1a43e5b75bf5ca92a57bf63d9a791f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化契約。本頁是 **要匯入什麼** 以及 **可以註冊什麼** 的參考。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若是想透過閘道執行代理程式的外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能，請改用
  [外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從 [建置外掛](/zh-TW/plugins/building-plugins) 開始。通道請使用 [通道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型提供者請使用 [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請使用 [命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理程式執行器請使用 [代理程式 harness 外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期鉤子請使用 [外掛鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自足的模組。這能讓啟動保持快速，並避免循環相依性問題。對於通道專用的入口/建置輔助程式，優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣泛的總括介面，以及像 `buildChannelConfigSchema` 這類共用輔助程式。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用 schema 基元和通用建置器。OpenClaw 的內建外掛會使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 schema。已棄用的相容性匯出仍保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新外掛應採用的模式。

<Warning>
  不要匯入提供者或通道品牌化的便利介面（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建外掛會在自己的 `api.ts` /
  `runtime-api.ts` barrel 內組合通用 SDK 子路徑；核心消費者應該使用那些外掛本機 barrel，或在需求確實跨通道時新增狹窄的通用 SDK 契約。

一小組內建外掛輔助介面在已有追蹤到擁有者使用情況時，仍會出現在產生的匯出對應中。它們只用於內建外掛維護，不建議作為新第三方外掛的匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作為已棄用的相容性 facade 保留，以支援已追蹤的擁有者使用情況。不要將這些匯入路徑複製到新外掛；請改用注入的執行階段輔助程式和通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組依區域分組的狹窄子路徑公開（外掛入口、通道、提供者、驗證、執行階段、能力、記憶體，以及保留的內建外掛輔助程式）。完整目錄（已分組並連結）請參閱
[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器入口點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出是在扣除列於
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 的 repo 本機測試/內部子路徑後，從公開子集產生。執行
`pnpm plugin-sdk:surface` 以稽核公開匯出數量。足夠久遠且未被內建擴充功能生產程式碼使用的已棄用公開子路徑，會追蹤於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用重新匯出 barrel 會追蹤於
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到一個包含下列方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論 (LLM)                                                                    |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄列                                                        |
| `api.registerAgentHarness(...)`                  | [實驗性](/zh-TW/plugins/sdk-agent-harness) 原生代理程式執行器（Codex、Copilot）         |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                            |
| `api.registerChannel(...)`                       | 訊息通道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入提供者                                                        |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                                                              |
| `api.registerMediaUnderstandingProvider(...)`    | 影像/音訊/影片分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                                        |
| `api.registerImageGenerationProvider(...)`       | 影像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 擷取 / 抓取提供者                                                             |
| `api.registerWebSearchProvider(...)`             | Web 搜尋                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                                            |

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者，也必須列在外掛資訊清單的 `contracts.embeddingProviders` 中。這是用於可重複使用向量生成的通用嵌入介面。記憶體搜尋可以消費這個通用提供者介面。較舊的
`api.registerMemoryEmbeddingProvider(...)` 和
`contracts.memoryEmbeddingProviders` 介面是已棄用的相容性介面，供現有記憶體專用提供者遷移期間使用。

仍公開執行階段 `batchEmbed(...)` 的記憶體專用提供者，會維持既有的每檔案批次契約，除非其執行階段明確設定
`sourceWideBatchEmbed: true`。這個選擇加入項目可讓記憶體主機在一次 `batchEmbed(...)` 呼叫中提交來自多個髒記憶體檔案和已啟用來源的區塊，最多到主機批次限制。會上傳 JSONL 請求檔案的批次轉接器，必須在達到上傳大小上限以及請求數量上限之前拆分提供者作業。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入區塊傳回一個嵌入；當提供者預期檔案本機批次，或無法在較大的來源範圍作業中保留輸入順序時，請省略該旗標。

### 工具和命令

對於工具名稱固定的簡單純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                            | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理程式工具（必要或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                          |

當代理程式需要一段由命令擁有的簡短路由提示時，外掛命令可以設定 `agentPromptGuidance`。該文字應只描述命令本身；不要將提供者或外掛專用政策加入核心提示建置器。

指引項目可以是套用到每個提示介面的舊式字串，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

結構化 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若刻意要全介面指引，請省略 `surfaces`。不要傳入空的 `surfaces` 陣列；它會被拒絕，以免意外喪失作用範圍而變成全域提示文字。

原生 Codex app-server 開發者指示比其他提示介面更嚴格：只有明確作用範圍為 `codex_app_server` 的指引會被提升到該較高優先順序通道。舊式字串指引和未指定作用範圍的結構化指引，為了相容性，仍可供非 Codex 提示介面使用。

### 基礎設施

| 方法                                            | 註冊內容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件鉤子                                                     |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                               |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                                |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告器                                           |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 底下的節點功能命令列介面                    |
| `api.registerService(service)`                  | 背景服務                                                     |
| `api.registerInteractiveHandler(registration)`  | 互動處理器                                                   |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                     |
| `api.registerMemoryPromptSupplement(builder)`   | 增補性的記憶體相鄰提示區段                                   |
| `api.registerMemoryCorpusSupplement(adapter)`   | 增補性的記憶體搜尋/讀取語料庫                                |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器樣式託管媒體 URL 的解析器                              |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的提示/訊息相容性文字重寫                            |
| `api.registerConfigMigration(migrate)`          | 在外掛執行階段載入前執行的輕量設定遷移                       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測                                   |
| `api.registerReload(registration)`              | 用於重新載入處理的重啟/熱載/無動作設定前綴政策               |
| `api.registerNodeHostCommand(command)`          | 暴露給配對節點的命令處理器                                   |
| `api.registerNodeInvokePolicy(policy)`          | 節點叫用命令的允許清單/核准政策                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現項目收集器                   |

Telegram 互動處理器可以回傳 `{ submitText }`，在處理器成功後，透過
Telegram 的一般傳入代理路徑路由文字。當傳入政策略過文字或處理失敗時，OpenClaw 會保留
回呼按鈕，因此使用者可以在阻擋條件變更後重試。這個結果欄位是
Telegram 專屬；其他通道會保留各自的互動結果合約。

### 工作流程外掛的主機鉤子

主機鉤子是 SDK 接縫，供需要參與主機生命週期、而不只是新增供應商、
通道或工具的外掛使用。它們是通用合約；計畫模式可以使用它們，核准工作流程、
工作區政策閘門、背景監控程式、設定精靈和 UI 伴隨外掛也都可以使用。

| 方法                                                                                 | 擁有的合約                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、JSON 相容的工作階段狀態，透過閘道工作階段投影                                                                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 耐久且恰好一次的內容，注入到一個工作階段的下一個代理回合                                                                                                   |
| `api.registerTrustedToolPolicy(...)`                                                 | 由資訊清單控管的受信任前置外掛工具政策，可阻擋或重寫工具參數                                                                                               |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不會變更工具實作                                                                                                                     |
| `api.registerCommand(...)`                                                           | 具範圍的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                            |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 控制 UI 貢獻描述元，用於工作階段、工具、執行、設定或分頁介面                                                                                               |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設/刪除/重新載入路徑上，清理外掛擁有的執行階段資源的回呼                                                                                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態和監控程式的已清理事件訂閱                                                                                                                  |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在終端執行生命週期清除                                                                                                           |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有的排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限 bundled、由主機媒介的檔案附件傳遞，送往作用中的直接傳出工作階段路由                                                                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限 bundled、由排程支援的已排程工作階段回合，以及以標籤為基礎的清理                                                                                       |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的具型別工作階段動作                                                                                                                   |

`surface: "tab"` 描述元會把側邊欄分頁新增到控制 UI。作用中
外掛的分頁描述元會在閘道 hello (`controlUiTabs`) 中公告給儀表板用戶端，
因此分頁只會在外掛啟用時出現。Bundled 外掛可以為其分頁提供第一級
儀表板檢視；其他外掛可以將 `path` 設為外掛 HTTP 路由（請參閱
`api.registerHttpRoute(...)`），讓儀表板在沙盒框架中呈現。
`icon` 是儀表板圖示名稱提示，`group` 選擇側邊欄區段
（`control` 或 `agent`），`order` 會在外掛分頁之間排序，而 `requiredScopes`
會對缺少這些操作員範圍的連線隱藏分頁：

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

等效的扁平方法仍可作為已棄用的相容性別名提供給既有
外掛使用。請勿新增直接呼叫
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是以工作階段為範圍、建構在閘道
排程器之上的便利功能。排程負責時間安排，並在回合執行時建立背景任務記錄；
外掛 SDK 只會限制目標工作階段、外掛擁有的命名和清理。當工作本身需要
耐久的多步驟 Task Flow 狀態時，請在已排程回合內使用
`api.runtime.tasks.managedFlows`。

這些合約刻意分割權限：

- 外部外掛可以擁有工作階段擴充、UI 描述元、命令、工具
  中繼資料、下一回合注入，以及一般鉤子。
- 受信任工具政策會在一般 `before_tool_call` 鉤子之前執行，並受到
  主機信任。Bundled 政策會先執行；已安裝外掛政策需要
  明確啟用，加上其在 `contracts.trustedToolPolicies` 中的本機 ID，
  並會接著依外掛載入順序執行。政策 ID 的範圍限於註冊它的外掛。
- 保留命令擁有權僅限 bundled。外部外掛應使用自己的
  命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的鉤子，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  舊版 `before_agent_start` 的提示欄位，以及
  `enqueueNextTurnInjection`。

非計畫模式消費者範例：

| 外掛原型                     | 使用的鉤子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令延續、下一回合注入、UI 描述元                                                                                        |
| 預算/工作區政策閘門          | 受信任工具政策、工具中繼資料、工作階段投影                                                                                             |
| 背景生命週期監控程式         | 執行階段生命週期清理、代理事件訂閱、工作階段排程器擁有權/清理、心跳偵測提示貢獻、UI 描述元                                             |
| 設定或入門精靈               | 工作階段擴充、具範圍的命令、控制 UI 描述元                                                                                              |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使外掛嘗試指派較窄的
  閘道方法範圍也是如此。外掛擁有的方法請優先使用外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  Bundled 外掛和已明確啟用、且具有相符資訊清單合約的已安裝外掛，
  可以在需要於執行後、執行階段將結果送回模型前重寫工具結果時，
  使用 `api.registerAgentToolResultMiddleware(...)`。這是受信任且不綁定
  執行階段的接縫，適用於 tokenjuice 等非同步輸出縮減器。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["openclaw", "codex"]`。沒有該合約或未明確啟用的已安裝
外掛無法註冊這個中介軟體；不需要模型前工具結果時機的工作，請保留
一般 OpenClaw 外掛鉤子。舊的
僅限嵌入式執行器的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 讓外掛可以在 mDNS/Bonjour 等本機
探索傳輸上公告作用中的閘道。當本機探索啟用時，OpenClaw 會在
閘道啟動期間呼叫此服務，傳遞目前閘道連接埠和非機密 TXT 提示資料，
並在閘道關閉期間呼叫回傳的 `stop` 處理器。

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

閘道探索外掛不得將公告的 TXT 值視為秘密或
驗證。探索是路由提示；閘道驗證和 TLS 釘選仍然
負責信任。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：剖析時使用的命令描述元，用於命令列介面說明、
  路由和延遲外掛命令列介面註冊
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於成對節點功能，請優先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝器，並讓
`openclaw nodes canvas` 等命令成為明確由外掛擁有的節點功能。

如果你希望外掛命令在一般根命令列介面路徑中維持延遲載入，
請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

巢狀命令會接收已解析的父命令作為 `program`：

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
該積極相容路徑仍受支援，但不會安裝
以描述元為基礎、用於解析時延遲載入的預留項目。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 可讓外掛擁有本機
AI 命令列介面後端的預設設定，例如 `claude-cli` 或 `my-cli`。

- 後端 `id` 會成為模型參照中的供應商前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍會優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併到
  外掛預設值之上，再執行命令列介面。
- 當後端在合併後需要相容性重寫時，請使用 `normalizeConfig`
  （例如正規化舊旗標形狀）。
- 對於屬於命令列介面方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 思考層級對應到原生 effort
  旗標。此 hook 會接收 `ctx.executionMode`；使用 `"side-question"` 為短暫的 `/btw` 呼叫新增
  後端原生隔離旗標。如果這些旗標
  能可靠地停用原本永遠開啟的命令列介面的原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。

如需端對端作者指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能啟用一個）。當主機可提供模型/供應商/模式診斷時，生命週期 callback 會接收 `runtimeSettings`；較舊的嚴格引擎會在沒有該 key 的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶清除計畫解析器                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段配接器                                                                                                                                                                                 |

### 已棄用的記憶嵌入配接器

| 方法                                           | 註冊內容                   |
| ---------------------------------------------- | -------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入配接器 |

- `registerMemoryCapability` 是偏好的專屬記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套外掛透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶成品，
  而不是深入特定
  記憶外掛的私有版面配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的專屬記憶外掛 API。
- `MemoryFlushPlan.model` 可以將清除回合固定到精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的 fallback
  鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入供應商
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 現有的記憶專用供應商在遷移
  期間仍會繼續運作，但外掛檢查會將此回報為
  非內建外掛的相容性債務。

### 事件與生命週期

| 方法                                         | 作用             |
| -------------------------------------------- | ---------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook |
| `api.onConversationBindingResolved(handler)` | 對話繫結 callback |

請參閱 [外掛 hooks](/zh-TW/plugins/hooks)，了解範例、常見 hook 名稱和 guard
語意。

### Hook 決策語意

`before_install` 是外掛執行階段生命週期 hook，不是操作者安裝
政策介面。當允許/封鎖決策必須
涵蓋命令列介面與閘道支援的安裝或更新路徑時，請使用 `security.installPolicy`。

- `before_tool_call`：回傳 `{ block: true }` 為終止狀態。一旦任何 handler 設定它，就會略過較低優先順序的 handler。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 為終止狀態。一旦任何 handler 設定它，就會略過較低優先順序的 handler。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 為終止狀態。一旦任何 handler 宣告已處理派送，就會略過較低優先順序的 handler 與預設模型派送路徑。
- `message_sending`：回傳 `{ cancel: true }` 為終止狀態。一旦任何 handler 設定它，就會略過較低優先順序的 handler。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（與省略 `cancel` 相同），而不是覆寫。
- `message_received`：當你需要傳入執行緒/主題路由時，請使用型別化 `threadId` 欄位。保留 `metadata` 用於通道特定的額外資訊。
- `message_sending`：在 fallback 到通道特定 `metadata` 之前，請先使用型別化 `replyToId` / `threadId` 路由欄位。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不是依賴內部 `gateway:startup` hooks。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的唯一事實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 ID                                                                                     |
| `api.name`               | `string`                  | 顯示名稱                                                                                    |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                            |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                                            |
| `api.source`             | `string`                  | 外掛來源路徑                                                                                |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                                          |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內執行階段快照）                                      |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛特定設定                                          |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | 作用域 logger（`debug`、`info`、`warn`、`error`）                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是輕量的完整入口前啟動/設定期間                            |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                  |

## 內部模組慣例

在你的外掛內，內部匯入請使用本機 barrel 檔案：

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  絕不要在生產程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入自己的外掛。內部匯入請透過 `./api.ts` 或
  `./runtime-api.ts` 路由。SDK 路徑只作為外部合約。
</Warning>

Facade 載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及類似的公開入口檔案）在 OpenClaw 已執行時，
偏好使用作用中的執行階段設定快照。如果尚未存在執行階段
快照，它們會 fallback 到磁碟上已解析的設定檔。
封裝後的內建外掛 facade 應透過 OpenClaw 的外掛
facade 載入器載入；直接從 `dist/extensions/...` 匯入會繞過
封裝安裝用於外掛擁有程式碼的 manifest
與執行階段 sidecar 檢查。

當輔助工具刻意為供應商特定，且尚不屬於通用 SDK
子路徑時，供應商外掛可以公開狹窄的外掛本機合約 barrel。
內建範例：

- **Anthropic**：Claude beta-header 和 `service_tier` 串流輔助工具的公開 `api.ts` / `contract-api.ts` 邊界。
- **`@openclaw/openai-provider`**：`api.ts` 匯出供應商建構器、
  預設模型輔助工具，以及即時供應商建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出供應商建構器
  加上入門/設定輔助工具。

<Warning>
  擴充功能生產程式碼也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果輔助工具確實是共享的，請將其提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  以能力為導向的介面，而不是將兩個外掛耦合在一起。
</Warning>

## 相關內容

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、資訊清單與組態結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試公用程式與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用的介面遷移。
  </Card>
  <Card title="外掛內部機制" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與能力模型。
  </Card>
</CardGroup>
