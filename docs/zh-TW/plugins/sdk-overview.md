---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想查閱 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查找特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概覽
x-i18n:
    generated_at: "2026-07-12T14:45:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化契約。本頁是**應匯入什麼**以及**可以註冊什麼**的參考資料。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若外部應用程式、指令碼、儀表板、CI 工作及 IDE 擴充功能想透過閘道執行代理程式，請改用[外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從[建置外掛](/zh-TW/plugins/building-plugins)開始。頻道請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型供應商請參閱[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理程式執行器請參閱[代理程式框架外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期鉤子則請參閱[外掛鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且獨立完備的模組。這能加快啟動速度，並避免循環相依性問題。對於頻道特定的進入點／建置輔助程式，優先使用 `openclaw/plugin-sdk/channel-core`；`openclaw/plugin-sdk/core` 則保留給範圍更廣的統合介面，以及 `buildChannelConfigSchema` 等共用輔助程式。

對於頻道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布由頻道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用的結構描述基本元件與通用建構器。OpenClaw 的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建頻道的結構描述。已淘汰的相容性匯出仍保留於 `plugin-sdk/channel-config-schema-legacy`；這兩個內建結構描述子路徑都不是新外掛應仿效的模式。

<Warning>
  請勿匯入帶有供應商或頻道品牌名稱的便利介面（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。內建外掛會在各自的 `api.ts`／`runtime-api.ts` 統合匯出中組合通用 SDK 子路徑；核心使用者應使用這些外掛本機的統合匯出，或在需求確實跨頻道時新增範圍狹窄的通用 SDK 契約。

少數內建外掛的輔助介面在有追蹤到擁有者使用情況時，仍會出現在產生的匯出對應表中。它們僅供維護內建外掛使用，不建議新第三方外掛採用這些匯入路徑。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也會保留為已淘汰的相容性外觀介面，以支援已追蹤的擁有者使用情況。請勿將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助程式與通用頻道 SDK 子路徑。
</Warning>

## 子路徑參考資料

外掛 SDK 以一組按領域分組的狹窄子路徑公開（外掛進入點、頻道、供應商、驗證、執行階段、能力、記憶，以及保留的內建外掛輔助程式）。如需按群組整理並附有連結的完整目錄，請參閱[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從公開子集產生，並扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的儲存庫本機測試／內部子路徑。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出數量。存在時間夠久且內建擴充功能的正式環境程式碼未使用的已淘汰公開子路徑，會在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中追蹤；範圍廣泛且已淘汰的重新匯出統合介面則會在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中追蹤。

## 註冊 API

`register(api)` 回呼會收到一個具有以下方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                                   |
| `api.registerWorkerProvider(...)`                | 雲端工作節點生命週期租約                                                          |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄資料列                                                    |
| `api.registerAgentHarness(...)`                  | [實驗性功能](/zh-TW/plugins/sdk-agent-harness)原生代理程式執行器（Codex、Copilot）       |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                            |
| `api.registerChannel(...)`                       | 訊息頻道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入供應商                                                        |
| `api.registerSpeechProvider(...)`                | 文字轉語音／STT 合成                                                              |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                                                              |
| `api.registerMediaUnderstandingProvider(...)`    | 影像／音訊／影片分析                                                              |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                                        |
| `api.registerImageGenerationProvider(...)`       | 影像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                          |
| `api.registerWebFetchProvider(...)`              | 網頁擷取／抓取供應商                                                              |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                                            |

工作節點供應商也必須在 `contracts.workerProviders` 中宣告其 ID。核心會在 `provision(profile, operationId)` 之前持久保存操作意圖。供應商會在外部分配之前驗證設定，並針對永久性的設定檔拒絕擲回 `WorkerProviderError`。當操作 ID 重複時，`provision` 必須採用相同的租約。
核心會將已驗證的設定檔設定與租約一併持久保存，並將該快照提供給必須具備冪等性的 `destroy({ leaseId, profile })`，以及會傳回 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。這讓供應商能在閘道重新啟動或具名設定檔遭移除後，繼續路由生命週期呼叫。SSH 端點的 `keyRef` 使用 `SecretRef`，絕不內嵌金鑰內容，並包含來自受信任佈建輸出的 `hostKey`，其格式必須恰為 `algorithm base64`，不得包含主機名稱或註解。核心會固定 `hostKey`，絕不信任首次連線取得的金鑰。產生動態 `keyRef` 的供應商可以實作 `resolveSshIdentity({ leaseId, profile, keyRef })`；若存在，此解析器具有權威性，而未提供此解析器的供應商則使用已設定的通用祕密解析器。
具有可續期租約的供應商也可以實作 `renew(leaseId)`。
`inspect` 在發生暫時性或不確定的失敗時必須擲回錯誤；只有在具權威性的不存在狀態下才傳回 `unknown`。核心會將作用中的本機記錄標示為孤立記錄；若已持久保存銷毀要求，則會將該不存在狀態視為拆除完成。

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入供應商，也必須列在外掛資訊清單的 `contracts.embeddingProviders` 中。這是供可重複使用向量生成使用的通用嵌入介面。記憶搜尋可以使用此通用供應商介面。較舊的 `api.registerMemoryEmbeddingProvider(...)` 與 `contracts.memoryEmbeddingProviders` 介面是已淘汰的相容性機制，供現有的記憶專用供應商進行遷移。

仍公開執行階段 `batchEmbed(...)` 的記憶專用供應商，會繼續使用現有的逐檔批次處理契約，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。啟用此選項後，記憶主機即可在主機批次限制範圍內，將多個已變更記憶檔案與已啟用來源的區塊，在一次 `batchEmbed(...)` 呼叫中送出。上傳 JSONL 要求檔案的批次轉接器，除了依要求數量上限拆分外，也必須在達到上傳大小上限前拆分供應商工作。供應商必須按照與 `batch.chunks` 相同的順序，為每個輸入區塊傳回一個嵌入；如果供應商預期使用檔案本機批次，或無法在較大的跨來源工作中維持輸入順序，請省略此旗標。

### 工具與命令

對於工具名稱固定且僅包含工具的簡易外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合型外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                                   | 註冊內容                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 代理程式工具（必要，或設定為 `{ optional: true }`）                                                                                    |
| `api.registerCommand(def)`             | 自訂命令（略過 LLM）                                                                                                                   |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 處理的命令；選用的 `agentTool` 中繼資料可在節點連線時，將其公開為代理程式可見的工具                              |

當代理程式需要簡短且由命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。該文字應只描述命令本身；請勿將供應商或外掛特定政策加入核心提示建構器。

引導項目可以是套用至每個提示介面的舊版字串，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "全域命令提示。",
  { text: "只在 OpenClaw 主提示中顯示此內容。", surfaces: ["openclaw_main"] },
];
```

結構化的 `surfaces` 可包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 已淘汰的別名。若刻意要讓引導套用至所有介面，請省略 `surfaces`。請勿傳入空的 `surfaces` 陣列；系統會拒絕該陣列，以免意外遺失範圍後，文字變成全域提示內容。

原生 Codex 應用程式伺服器的開發人員指示比其他提示介面更嚴格：只有明確限定於 `codex_app_server` 的引導，才會提升至該優先順序較高的通道。為了相容性，舊版字串引導和未限定範圍的結構化引導，仍可供非 Codex 提示介面使用。

節點主機命令會在已連線的節點主機上執行，而不是在閘道處理程序內執行。如果存在 `agentTool`，節點會在成功連線至閘道後發布描述元；只有當該節點保持連線，且描述元的 `command` 位於節點核准的命令介面中時，閘道才會將其提供給代理執行。設定 `agentTool.defaultPlatforms`，可將非危險命令加入預設節點命令允許清單；否則必須明確設定 `gateway.nodes.allowCommands` 或節點叫用原則。`agentTool.name` 必須符合提供者安全規範：以字母開頭、僅使用字母、數字、底線或連字號，且不得超過 64 個字元。由 MCP 支援的節點工具可以設定 `agentTool.mcp` 中繼資料，讓目錄與工具搜尋介面顯示遠端 MCP 伺服器／工具身分，但執行仍會透過公告的節點命令進行。

### 基礎架構

| 方法                                            | 註冊內容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件掛鉤                                                     |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                               |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                                |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告器                                           |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的節點功能命令列介面                      |
| `api.registerService(service)`                  | 背景服務                                                     |
| `api.registerInteractiveHandler(registration)`  | 互動式處理常式                                               |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                     |
| `api.registerMemoryPromptSupplement(builder)`   | 附加的記憶相關提示詞區段                                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加的記憶搜尋／讀取語料庫                                   |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器式託管媒體 URL 的解析器                                |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的提示詞／訊息相容性文字改寫                         |
| `api.registerConfigMigration(migrate)`          | 在載入外掛執行階段前執行的輕量設定遷移                       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測器                                 |
| `api.registerReload(registration)`              | 重新載入處理的重新啟動／熱載入／不動作設定前綴原則           |
| `api.registerNodeHostCommand(command)`          | 公開給已配對節點的命令處理常式                               |
| `api.registerNodeInvokePolicy(policy)`          | 節點叫用命令的允許清單／核准原則                             |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現項目收集器                    |

記憶提示詞補充建構器會接收選用的 `agentId`、`agentSessionKey` 和 `sandboxed` 上下文。記憶語料庫補充的 `search` 與 `get` 呼叫會接收選用的 `agentId` 和 `sandboxed` 上下文。具有代理自有儲存空間的外掛應在每次呼叫時解析該儲存空間，而不是在註冊期間擷取單一全域路徑。如果多代理操作需要代理 ID 卻未提供，應採取拒絕處理，而不是任意選擇代理。

Telegram 互動式處理常式可傳回 `{ submitText }`，在處理常式成功後，透過 Telegram 的一般代理輸入路徑路由文字。若輸入原則略過該文字或處理失敗，OpenClaw 會保留回呼按鈕，讓使用者可在阻擋條件改變後重試。此結果欄位為 Telegram 專用；其他頻道會保留各自的互動式結果合約。

### 工作流程外掛的主機掛鉤

主機掛鉤是供需要參與主機生命週期，而不只是新增提供者、頻道或工具的外掛使用的 SDK 接合面。它們是通用合約；規劃模式可以使用，核准工作流程、工作區原則閘門、背景監視器、設定精靈和 UI 伴隨外掛也可以使用。

| 方法                                                                                 | 所擁有的合約                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛擁有、與 JSON 相容，並透過閘道工作階段投射的工作階段狀態                                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 為單一工作階段注入下一次代理回合的持久性恰好一次上下文                                                                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | 受資訊清單管控、在外掛前執行的受信任工具原則，可封鎖或改寫工具參數                                                                                         |
| `api.registerToolMetadata(...)`                                                      | 不變更工具實作的工具目錄顯示中繼資料                                                                                                                       |
| `api.registerCommand(...)`                                                           | 限定範圍的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                         |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 適用於工作階段、工具、執行、設定或分頁介面的控制 UI 貢獻描述元                                                                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設／刪除／重新載入路徑上，針對外掛擁有的執行階段資源執行清理回呼                                                                                       |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監視器的已淨化事件訂閱                                                                                                                   |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在執行進入終止生命週期時清除                                                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛擁有之排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限隨附外掛、由主機居中處理的檔案附件傳送，送至作用中的直接輸出工作階段路由                                                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限隨附外掛、由排程支援的排定工作階段回合，以及依標籤進行的清理                                                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的型別化工作階段動作                                                                                                                   |

`surface: "tab"` 描述元會在控制 UI 中新增側邊欄分頁。作用中外掛的分頁描述元會在閘道 hello（`controlUiTabs`）中公告給儀表板用戶端，因此只有在外掛啟用時才會顯示該分頁。隨附外掛可為其分頁提供第一級儀表板檢視；其他外掛可以將 `path` 設為外掛 HTTP 路由（請參閱 `api.registerHttpRoute(...)`），儀表板會在沙箱化框架中呈現該路由。`icon` 是儀表板圖示名稱提示，`group` 選擇側邊欄區段（`control` 或 `agent`），`order` 用於排列外掛分頁，`requiredScopes` 則會對缺少那些操作者範圍的連線隱藏該分頁：

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "日誌簿",
  description: "以螢幕快照建構、按時間軸呈現你的一天。",
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

等效的扁平方法仍以已棄用的相容性別名形式提供給現有外掛使用。請勿新增直接呼叫 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是工作階段範圍內對閘道排程器的便利封裝。排程負責計時，並在回合執行時建立背景任務記錄；外掛 SDK 僅限制目標工作階段、外掛擁有的命名方式與清理。當工作本身需要持久性的多步驟 Task Flow 狀態時，請在排定的回合內使用 `api.runtime.tasks.managedFlows`。

這些合約刻意拆分權限：

- 外部外掛可以擁有工作階段擴充、UI 描述元、命令、工具中繼資料、下一回合注入和一般掛鉤。
- 受信任工具原則會在一般 `before_tool_call` 掛鉤之前執行，並受主機信任。隨附原則會先執行；已安裝外掛的原則必須明確啟用，並將其本機 ID 加入 `contracts.trustedToolPolicies`，之後依外掛載入順序執行。原則 ID 的範圍限定於註冊它的外掛。
- 保留命令的擁有權僅限隨附外掛。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會修改提示詞的掛鉤，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、舊版 `before_agent_start` 的提示詞欄位，以及 `enqueueNextTurnInjection`。

非規劃模式使用者的範例：

| 外掛原型                     | 使用的掛鉤                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令延續、下一輪注入、UI 描述元件                                                                                      |
| 預算／工作區政策閘門         | 受信任工具政策、工具中繼資料、工作階段投影                                                                                           |
| 背景生命週期監控器           | 執行階段生命週期清理、代理程式事件訂閱、工作階段排程器擁有權／清理、心跳偵測提示貢獻、UI 描述元件                                    |
| 設定或新手引導精靈           | 工作階段擴充、限定範圍的命令、Control UI 描述元件                                                                                    |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持為 `operator.admin`，即使外掛嘗試指派
  範圍更窄的閘道方法範圍也是如此。外掛擁有的方法應優先使用
  外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建外掛，以及已明確啟用且具備相符資訊清單合約的已安裝外掛，
  可在需要於工具執行後、執行階段將結果回傳給模型前重寫工具結果時，
  使用 `api.registerAgentToolResultMiddleware(...)`。這是適用於
  tokenjuice 等非同步輸出縮減器、受信任且與執行階段無關的介面。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["openclaw", "codex"]`。未具備該合約或未明確啟用的已安裝外掛
無法註冊此中介軟體；不需要模型前工具結果時序的工作，請繼續使用
一般 OpenClaw 外掛掛鉤。舊有僅限內嵌執行器的擴充工廠註冊路徑
已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓外掛透過 mDNS/Bonjour
等本機探索傳輸方式公告作用中的閘道。啟用本機探索後，OpenClaw
會在閘道啟動期間呼叫此服務，傳入目前的閘道連接埠和非機密的 TXT
提示資料，並在閘道關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將公告的 TXT 值視為密鑰或驗證。探索僅是路由提示；
信任仍由閘道驗證和 TLS 固定負責。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：用於命令列介面說明、路由和延遲外掛命令列介面註冊的剖析階段命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於配對節點功能，請優先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝函式，
可將 `openclaw nodes canvas` 等命令明確標示為外掛擁有的節點功能。

若要讓外掛命令在一般根命令列介面路徑中維持延遲載入，請提供涵蓋
該註冊器公開之每個頂層命令根的 `descriptors`。

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
        description: "管理 Matrix 帳號、驗證、裝置和個人資料狀態",
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
        description: "從配對節點擷取或算繪畫布內容",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。
這個積極載入的相容路徑仍受支援，但不會安裝由描述元支援、
用於剖析階段延遲載入的預留命令。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 可讓外掛擁有 `claude-cli` 或 `my-cli`
等本機 AI 命令列介面後端的預設設定。

- 後端 `id` 會成為 `my-cli/gpt-5` 等模型參照中的供應商前綴。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的結構。
- 使用者設定仍然優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>`
  合併至外掛預設值之上，再執行命令列介面。
- 當後端需要在合併後進行相容性重寫時，請使用 `normalizeConfig`
  （例如正規化舊旗標結構）。
- 對於屬於命令列介面方言、依請求範圍進行的 argv 重寫，請使用
  `resolveExecutionArgs`，例如將 OpenClaw 思考層級對應至原生投入程度
  旗標。此掛鉤會接收 `ctx.executionMode`；請使用 `"side-question"`
  為暫時性的 `/btw` 呼叫新增後端原生隔離旗標。若這些旗標能可靠地
  停用原本一律啟用的命令列介面原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。
- 可針對特定執行停用所有原生工具的後端，可宣告
  `nativeToolMode: "selectable"`。受限制的呼叫會傳入空的
  `ctx.toolAvailability.native` 元組，以及精確且與主機隔離的 MCP
  允許清單；`resolveExecutionArgs` 必須在最終的全新或續接 argv 上
  強制執行這兩者。若後端無法做到，OpenClaw 會採取失敗即關閉策略。

如需端對端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一個作用中）。當主機可提供模型／供應商／模式診斷時，生命週期回呼會收到 `runtimeSettings`；對較舊的嚴格引擎，則會在不含該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶功能                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 記憶提示區段建構器                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶清除計畫解析器                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 記憶執行階段配接器                                                                                                                                                                                 |

### 已棄用的記憶嵌入配接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入配接器       |

- `registerMemoryCapability` 是建議使用的專屬記憶外掛 API。
- `registerMemoryCapability` 也可公開 `publicArtifacts.listArtifacts(...)`，
  讓伴隨外掛可透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的
  記憶成品，而不必存取特定記憶外掛的私有配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是相容舊版的專屬記憶外掛 API。
- `MemoryFlushPlan.model` 可將清除輪次固定至確切的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入供應商應使用
  `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 在遷移期間，現有的記憶專用供應商仍可繼續運作，但外掛檢查會將
  非內建外掛的這種情況回報為相容性技術債。

### 事件與生命週期

| 方法                                         | 功能                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤   |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼         |

如需範例、常見掛鉤名稱和防護語意，請參閱
[外掛掛鉤](/zh-TW/plugins/hooks)。

### 掛鉤決策語意

`before_install` 是外掛執行階段生命週期掛鉤，而非操作者安裝政策介面。
當允許／封鎖決策必須涵蓋命令列介面和閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：傳回 `{ block: true }` 後即為終止狀態。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_tool_call`：傳回 `{ block: false }` 會視為未作決定（等同省略 `block`），而非覆寫先前決定。
- `before_install`：傳回 `{ block: true }` 後即為終止狀態。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_install`：傳回 `{ block: false }` 會視為未作決定（等同省略 `block`），而非覆寫先前決定。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 後即為終止狀態。一旦任何處理常式接管分派，就會略過優先順序較低的處理常式與預設的模型分派路徑。
- `message_sending`：傳回 `{ cancel: true }` 後即為終止狀態。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `message_sending`：傳回 `{ cancel: false }` 會視為未作決定（等同省略 `cancel`），而非覆寫先前決定。
- `message_received`：需要路由傳入的討論串／主題時，請使用具型別的 `threadId` 欄位。`metadata` 應保留給頻道特有的額外資訊。
- `message_sending`：請先使用具型別的 `replyToId`／`threadId` 路由欄位，再退回使用頻道特有的 `metadata`。
- `gateway_start`：請使用 `ctx.config`、`ctx.workspaceDir` 與 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而非依賴內部 `gateway:startup` 掛鉤。此時排程可能仍在載入。
- `cron_reconciled`：在啟動或排程器重新載入後，重建完整的外部排程投影。它包含 `reason` 與實際生效的 `enabled` 狀態（包括 `enabled: false`），而 `ctx.getCron?.()` 會傳回完全一致的排程器。請將 `ctx.abortSignal` 傳入持久化投影作業；當該排程器快照遭取代或閘道關閉時，它會中止。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。`scheduled` 與 `removed` 事件是提交後的協調提示，而非有序的差異記錄。當工作沒有下一次喚醒時間時，排程事件不會包含 `event.nextRunAtMs`；移除事件仍會攜帶已刪除工作的快照。

外部喚醒排程器應對 `cron_changed` 事件進行防抖或合併，
接著從 `cron_reconciled` 最後擷取的排程器重新讀取完整的持久化檢視。
不要採用 `cron_changed` 情境中的排程器：來自舊排程器且已脫離的提示，
可能與稍後的重新載入重疊。

對於閘道啟動或排程器替換時載入的持久化狀態，請使用
`cron_reconciled` 作為完整快照的觸發器。僅重新熱載入外掛時不會重播此事件。
觀察處理常式會平行執行，且不等待結果的分派可能彼此重疊，因此消費端不得
依賴事件完成順序。到期檢查與執行應以 OpenClaw 為事實來源。

如需具有持久化替換、重試／退避與乾淨關閉能力的單一執行配接器，請參閱
[安全的外部排程投影](/zh-TW/plugins/hooks#safe-external-cron-projection)。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 ID                                                                                     |
| `api.name`               | `string`                  | 顯示名稱                                                                                    |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                            |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                                            |
| `api.source`             | `string`                  | 外掛來源路徑                                                                                |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                                          |
| `api.config`             | `OpenClawConfig`          | 目前的設定快照（可用時為使用中的記憶體內執行階段快照）                                      |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專用設定                                            |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 限定範圍的記錄器（`debug`、`info`、`warn`、`error`）                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前的載入模式；`"setup-runtime"` 是進入完整進入點前的輕量啟動／設定時段                     |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                  |

## 內部模組慣例

在你的外掛中，內部匯入請使用本機彙總檔案：

```text
my-plugin/
  api.ts            # 對外部消費端公開的匯出
  runtime-api.ts    # 僅供內部使用的執行階段匯出
  index.ts          # 外掛進入點
  setup-entry.ts    # 僅供設定使用的輕量進入點（選用）
```

<Warning>
  絕對不要在正式環境程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入自己的外掛。內部匯入應透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅供外部契約使用。
</Warning>

由外觀層載入的隨附外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 及類似的公開進入檔案），在 OpenClaw 已執行時，
會優先使用作用中的執行階段設定快照。如果執行階段快照尚不存在，
則退回使用磁碟上已解析的設定檔。
封裝後的隨附外掛外觀層應透過 OpenClaw 的外掛外觀層載入器載入；
直接從 `dist/extensions/...` 匯入會繞過封裝安裝對外掛所擁有程式碼執行的
資訊清單與執行階段附屬檔案檢查。

當輔助工具刻意限定於特定提供者，且尚不適合放入通用 SDK 子路徑時，
提供者外掛可以公開一個範圍精簡的外掛本機契約彙總檔案。隨附範例：

- **Anthropic**：公開的 `api.ts`／`contract-api.ts` 介面，用於 Claude
  Beta 標頭與 `service_tier` 串流輔助工具。
- **`@openclaw/openai-provider`**：`api.ts` 會匯出提供者建構器、
  預設模型輔助工具與即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 會匯出提供者建構器，
  以及新手引導／設定輔助工具。

<Warning>
  擴充功能的正式環境程式碼也應避免從 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果輔助工具確實可共用，請將其提升至中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  以能力為導向的介面，而非讓兩個外掛彼此耦合。
</Warning>

## 相關內容

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 與 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、資訊清單與設定結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試公用程式與程式碼檢查規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已淘汰的介面遷移。
  </Card>
  <Card title="外掛內部架構" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與能力模型。
  </Card>
</CardGroup>
