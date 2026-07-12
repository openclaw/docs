---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 您正在查找特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考資料與 SDK 架構
title: 外掛 SDK 概覽
x-i18n:
    generated_at: "2026-07-11T21:42:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的具型別契約。本頁提供**應匯入哪些項目**以及**可註冊哪些項目**的參考資訊。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若外部應用程式、指令碼、儀表板、CI 工作及 IDE 擴充功能希望透過閘道執行代理，請改用[外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從[建置外掛](/zh-TW/plugins/building-plugins)開始。頻道請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型提供者請參閱[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理執行器請參閱[代理執行框架外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期鉤子請參閱[外掛鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是精簡且自足的模組。這能加快啟動速度，並防止循環相依問題。對於頻道專用的進入點／建置輔助工具，請優先使用 `openclaw/plugin-sdk/channel-core`；`openclaw/plugin-sdk/core` 則保留給範圍更廣的統整介面，以及 `buildChannelConfigSchema` 等共用輔助工具。

對於頻道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布該頻道所擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑供共用結構描述基本元素與通用建置器使用。OpenClaw 的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 來處理保留的內建頻道結構描述。已棄用的相容性匯出仍保留於 `plugin-sdk/channel-config-schema-legacy`；這兩個內建結構描述子路徑都不是新外掛應遵循的模式。

<Warning>
  請勿匯入以提供者或頻道品牌命名的便利介面（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。內建外掛會在自身的 `api.ts`／`runtime-api.ts` 匯出彙整模組中組合通用 SDK 子路徑；核心取用端應使用這些外掛本機的匯出彙整模組，或在需求確實跨頻道時新增範圍精確的通用 SDK 契約。

當少數內建外掛輔助介面具有持續追蹤的擁有者使用情形時，它們仍會出現在產生的匯出對應表中。這些介面僅供維護內建外掛使用，不建議新第三方外掛將其作為匯入路徑。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也會保留為已棄用的相容性門面，以支援持續追蹤的擁有者使用情形。請勿將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助工具及通用頻道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 會以一組按領域分類的精簡子路徑公開（外掛進入點、頻道、提供者、驗證、執行階段、能力、記憶，以及保留的內建外掛輔助工具）。如需依類別整理並附有連結的完整目錄，請參閱[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；從公開子集扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中所列的儲存庫本機測試／內部子路徑後，便會產生套件匯出。執行 `pnpm plugin-sdk:surface` 可稽核公開匯出數量。年代足夠久且未由內建擴充功能正式環境程式碼使用的已棄用公開子路徑，記錄於 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；範圍廣泛的已棄用重新匯出彙整模組則記錄於 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到具有下列方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 註冊內容                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                                     |
| `api.registerWorkerProvider(...)`                | 雲端工作節點生命週期租約                                                            |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄資料列                                                      |
| `api.registerAgentHarness(...)`                  | [實驗性](/zh-TW/plugins/sdk-agent-harness)原生代理執行器（Codex、Copilot）                 |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                              |
| `api.registerChannel(...)`                       | 訊息頻道                                                                            |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入提供者                                                          |
| `api.registerSpeechProvider(...)`                | 文字轉語音／STT 合成                                                                |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                                        |
| `api.registerRealtimeVoiceProvider(...)`         | 雙向即時語音工作階段                                                                |
| `api.registerMediaUnderstandingProvider(...)`    | 影像／音訊／影片分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                                          |
| `api.registerImageGenerationProvider(...)`       | 影像生成                                                                            |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                            |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                            |
| `api.registerWebFetchProvider(...)`              | 網頁擷取／抓取提供者                                                                |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                            |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                                              |

工作節點提供者也必須在 `contracts.workerProviders` 中宣告其 ID。核心會先保存持久意圖，再呼叫 `provision(profile, operationId)`。提供者必須在配置外部資源前驗證設定，並針對永久性的設定檔拒絕拋出 `WorkerProviderError`。當作業 ID 重複時，`provision` 必須採用相同的租約。
核心會將已驗證的設定檔設定與租約一併保存，並將該快照提供給必須具備冪等性的 `destroy({ leaseId, profile })`，以及回傳 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。如此一來，提供者便能在閘道重新啟動或具名設定檔遭移除後，繼續路由生命週期呼叫。SSH 端點的 `keyRef` 使用 `SecretRef`，絕不內嵌金鑰內容；此外，端點還須包含來自受信任配置輸出的 `hostKey`，其格式必須恰為 `algorithm base64`，不得包含主機名稱或註解。核心會固定 `hostKey`，絕不信任首次連線提供的金鑰。若提供者會產生動態 `keyRef`，則可實作 `resolveSshIdentity({ leaseId, profile, keyRef })`；若有此解析器，便以其結果為準；未實作此解析器的提供者則使用已設定的通用機密解析器。
具有可續期租約的提供者也可實作 `renew(leaseId)`。
發生暫時性或無法判定的失敗時，`inspect` 必須拋出錯誤；只有在具權威性的確認不存在時才回傳 `unknown`。核心會將仍處於啟用狀態的本機記錄標記為孤立記錄；若先前已保存銷毀要求，則將不存在視為拆除完成。

透過 `api.registerEmbeddingProvider(...)` 註冊的嵌入提供者也必須列於外掛資訊清單的 `contracts.embeddingProviders`。這是用於產生可重複使用向量的通用嵌入介面。記憶搜尋可取用此通用提供者介面。較舊的 `api.registerMemoryEmbeddingProvider(...)` 與 `contracts.memoryEmbeddingProviders` 介面屬於已棄用的相容性機制，供現有的記憶專用提供者遷移期間使用。

仍公開執行階段 `batchEmbed(...)` 的記憶專用提供者，會繼續使用現有的逐檔批次契約，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。選擇啟用此設定後，記憶主機即可在主機批次限制內，將來自多個已變更記憶檔案及已啟用來源的區塊，透過單次 `batchEmbed(...)` 呼叫提交。上傳 JSONL 要求檔案的批次配接器，除了要求數量上限外，也必須在達到上傳大小上限前分割提供者工作。提供者必須依照與 `batch.chunks` 相同的順序，為每個輸入區塊回傳一個嵌入；若提供者預期逐檔批次，或無法在較大型、涵蓋整個來源的工作中維持輸入順序，請省略此旗標。

### 工具與命令

對於工具名稱固定且僅包含工具的簡單外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合型外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                                   | 註冊內容                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 代理工具（必要，或設為 `{ optional: true }`）                                                                                     |
| `api.registerCommand(def)`             | 自訂命令（略過 LLM）                                                                                                              |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 處理的命令；選用的 `agentTool` 中繼資料可在節點已連線時，將其公開為代理可見的工具                           |

當代理需要簡短且由命令本身擁有的路由提示時，外掛命令可設定 `agentPromptGuidance`。該文字應僅描述命令本身；請勿將提供者或外掛專用政策加入核心提示詞建置器。

指引項目可以是套用於所有提示詞介面的舊式字串，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

結構化的 `surfaces` 可包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若有意讓指引套用於所有介面，請省略 `surfaces`。請勿傳入空的 `surfaces` 陣列；系統會拒絕此設定，避免意外遺失範圍限制後，文字反而成為全域提示詞。

原生 Codex 應用程式伺服器的開發者指示比其他提示詞介面更嚴格：只有明確限定於 `codex_app_server` 的指引，才會提升至該較高優先順序的通道。為維持相容性，舊式字串指引與未限定範圍的結構化指引仍可供非 Codex 提示詞介面使用。

節點主機命令會在已連線的節點主機上執行，而不是在閘道程序內執行。如果存在 `agentTool`，節點會在成功連線至閘道後發布描述元；只有在該節點保持連線，且描述元的 `command` 位於節點核准的命令介面中時，閘道才會將其提供給代理執行。設定 `agentTool.defaultPlatforms`，可將非危險命令納入預設節點命令允許清單；否則必須明確設定 `gateway.nodes.allowCommands` 或節點叫用原則。`agentTool.name` 必須符合提供者的安全要求：以字母開頭、僅使用字母、數字、底線或連字號，且不超過 64 個字元。以 MCP 為後端的節點工具可以設定 `agentTool.mcp` 中繼資料，讓目錄與工具搜尋介面顯示遠端 MCP 伺服器／工具身分，但執行仍會透過所公告的節點命令進行。

### 基礎架構

| 方法                                            | 註冊內容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件鉤子                                                     |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                               |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                                |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告服務                                         |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的節點功能命令列介面                      |
| `api.registerService(service)`                  | 背景服務                                                     |
| `api.registerInteractiveHandler(registration)`  | 互動處理常式                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                     |
| `api.registerMemoryPromptSupplement(builder)`   | 附加的記憶相關提示詞區段                                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加的記憶搜尋／讀取語料庫                                   |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器式託管媒體 URL 的解析器                                |
| `api.registerTextTransforms(transforms)`        | 外掛自有的提示詞／訊息相容性文字改寫                         |
| `api.registerConfigMigration(migrate)`          | 在載入外掛執行階段前執行的輕量設定遷移                       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測器                                 |
| `api.registerReload(registration)`              | 用於處理重新載入的重新啟動／熱重載／不操作設定前綴原則       |
| `api.registerNodeHostCommand(command)`          | 向已配對節點公開的命令處理常式                               |
| `api.registerNodeInvokePolicy(policy)`          | 節點叫用命令的允許清單／核准原則                             |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現事項收集器                   |

記憶提示詞補充建構器會收到選用的 `agentId`、`agentSessionKey` 與 `sandboxed` 上下文。記憶語料庫補充的 `search` 與 `get` 呼叫會收到選用的 `agentId` 與 `sandboxed` 上下文。具有代理自有儲存空間的外掛，應在每次呼叫時解析該儲存空間，而不是在註冊期間擷取單一全域路徑。若多代理作業需要代理 ID 但未提供，應採取封閉式失敗，而不是任意選擇一個代理。

Telegram 互動處理常式可以傳回 `{ submitText }`，在處理常式成功後，透過 Telegram 的一般傳入代理路徑路由文字。當傳入原則略過文字或處理失敗時，OpenClaw 會保留回呼按鈕，讓使用者能在阻擋條件改變後重試。此結果欄位為 Telegram 專用；其他頻道維持各自的互動結果契約。

### 工作流程外掛的主機鉤子

主機鉤子是提供給需要參與主機生命週期，而非僅新增提供者、頻道或工具之外掛的 SDK 接合介面。它們是通用契約；計畫模式可以使用它們，核准工作流程、工作區原則閘門、背景監視器、設定精靈與使用者介面輔助外掛也同樣可以使用。

| 方法                                                                                 | 所屬契約                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 外掛自有、與 JSON 相容，並透過閘道工作階段投影的工作階段狀態                                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 注入單一工作階段下一個代理回合的持久、恰好一次上下文                                                                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | 由資訊清單管控、在外掛前執行且受信任的工具原則，可阻擋或改寫工具參數                                                                                       |
| `api.registerToolMetadata(...)`                                                      | 不變更工具實作的工具目錄顯示中繼資料                                                                                                                       |
| `api.registerCommand(...)`                                                           | 有作用域的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations`                         |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 工作階段、工具、執行、設定或分頁介面的控制使用者介面貢獻描述元                                                                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設／刪除／重新載入路徑上，清理外掛自有執行階段資源的回呼                                                                                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監視器的淨化事件訂閱                                                                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在執行進入終止生命週期時清除                                                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛自有排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                                                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限隨附外掛：由主機居中，將檔案附件傳送至作用中的直接傳出工作階段路由                                                                                       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限隨附外掛：以排程為後端的排定工作階段回合，以及依標籤清理                                                                                               |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的具型別工作階段動作                                                                                                                   |

`surface: "tab"` 描述元會在控制使用者介面中新增側邊欄分頁。已啟用外掛的分頁描述元會在閘道問候訊息（`controlUiTabs`）中公告給儀表板用戶端，因此該分頁只會在外掛啟用時顯示。隨附外掛可為其分頁提供第一級儀表板檢視；其他外掛可將 `path` 設為外掛 HTTP 路由（請參閱 `api.registerHttpRoute(...)`），由儀表板在沙箱框架中呈現。`icon` 是儀表板圖示名稱提示，`group` 選擇側邊欄區段（`control` 或 `agent`），`order` 決定外掛分頁之間的排序，而 `requiredScopes` 會對缺少這些操作者作用域的連線隱藏該分頁：

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

對等的扁平方法仍可作為既有外掛的已棄用相容性別名使用。請勿新增直接呼叫 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是以閘道排程器為基礎、限定工作階段作用域的便利介面。排程負責掌控時間，並在回合執行時建立背景任務記錄；外掛 SDK 僅限制目標工作階段、外掛自有命名與清理。若排定回合中的工作本身需要持久的多步驟 Task Flow 狀態，請使用 `api.runtime.tasks.managedFlows`。

這些契約刻意劃分權限：

- 外部外掛可擁有工作階段擴充、使用者介面描述元、命令、工具中繼資料、下一回合注入及一般鉤子。
- 受信任工具原則會在一般 `before_tool_call` 鉤子之前執行，且受主機信任。隨附原則最先執行；已安裝外掛的原則需要明確啟用，並將其本機 ID 加入 `contracts.trustedToolPolicies`，之後再依外掛載入順序執行。原則 ID 的作用域限於註冊該原則的外掛。
- 保留命令的所有權僅限隨附外掛。外部外掛應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用修改提示詞的鉤子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、舊版 `before_agent_start` 的提示詞欄位，以及 `enqueueNextTurnInjection`。

非計畫模式使用者的範例：

| 外掛原型                     | 使用的掛鉤                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                 | 工作階段擴充、命令接續、下一輪注入、使用者介面描述元                                                                                   |
| 預算／工作區政策閘門         | 受信任工具政策、工具中繼資料、工作階段投影                                                                                             |
| 背景生命週期監控器           | 執行階段生命週期清理、代理程式事件訂閱、工作階段排程器擁有權／清理、心跳偵測提示貢獻、使用者介面描述元                                  |
| 設定或初始設定精靈           | 工作階段擴充、具範圍的命令、控制介面描述元                                                                                             |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持為 `operator.admin`，即使外掛嘗試指派範圍更窄的
  閘道方法範圍亦然。外掛擁有的方法應優先使用外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  當隨附外掛與明確啟用且資訊清單合約相符的已安裝外掛，需要在工具執行後、
  執行階段將結果回饋給模型前改寫工具結果時，可以使用
  `api.registerAgentToolResultMiddleware(...)`。這是供 tokenjuice 等非同步
  輸出歸約器使用的受信任、與執行階段無關的接合點。

外掛必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["openclaw", "codex"]`。未具備該合約或未明確啟用的已安裝外掛，
無法註冊此中介軟體；不需要在模型處理前介入工具結果時序的工作，請繼續
使用一般的 OpenClaw 外掛掛鉤。舊有僅限內嵌執行器的擴充工廠註冊路徑
已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 讓外掛可透過 mDNS/Bonjour
等本機探索傳輸公告作用中的閘道。啟用本機探索時，OpenClaw 會在閘道啟動
期間呼叫此服務，傳入目前的閘道連接埠與非機密的 TXT 提示資料，並在閘道
關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將公告的 TXT 值視為機密或驗證資訊。探索僅是路由提示；
信任仍由閘道驗證與 TLS 固定負責。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊器擁有的明確命令名稱
- `descriptors`：用於命令列介面說明、路由及延遲外掛命令列介面註冊的
  剖析階段命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如 `["nodes"]`

對於配對節點功能，請優先使用
`api.registerNodeCliFeature(registrar, opts?)`。這是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝器，可明確指出
`openclaw nodes canvas` 等命令是由外掛擁有的節點功能。

若要讓外掛命令在一般根命令列介面路徑中維持延遲載入，請提供
`descriptors`，涵蓋該註冊器公開的每個頂層命令根。

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

只有在不需要延遲根命令列介面註冊時，才單獨使用 `commands`。這條立即載入的
相容性路徑仍受支援，但不會安裝由描述元支援、供剖析階段延遲載入使用的
預留位置。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 讓外掛可擁有 `claude-cli` 或 `my-cli`
等本機 AI 命令列介面後端的預設設定。

- 後端 `id` 會成為 `my-cli/gpt-5` 等模型參照中的提供者前綴。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的結構。
- 使用者設定仍具有優先權。OpenClaw 會先將
  `agents.defaults.cliBackends.<id>` 合併覆蓋於外掛預設值，再執行命令列介面。
- 當後端需要在合併後進行相容性改寫時（例如正規化舊旗標結構），請使用
  `normalizeConfig`。
- 對於屬於命令列介面方言的請求範圍 argv 改寫，請使用
  `resolveExecutionArgs`，例如將 OpenClaw 的思考層級對應至原生投入程度旗標。
  此掛鉤會接收 `ctx.executionMode`；請使用 `"side-question"` 為暫時性的
  `/btw` 呼叫加入後端原生隔離旗標。若這些旗標能可靠地停用原本總是啟用的
  命令列介面原生工具，也請宣告 `sideQuestionToolMode: "disabled"`。
- 可在特定執行中停用所有原生工具的後端，可以宣告
  `nativeToolMode: "selectable"`。受限制的呼叫會傳入空的
  `ctx.toolAvailability.native` 元組，以及精確且由主機隔離的 MCP 允許清單；
  `resolveExecutionArgs` 必須在最終全新或續接的 argv 上強制執行兩者。
  若後端無法做到，OpenClaw 會採取封閉式失敗。

如需端對端的編寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 獨佔插槽

| 方法                                       | 註冊內容                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能啟用一個）。當主機可提供模型／提供者／模式診斷資訊時，生命週期回呼會收到 `runtimeSettings`；較舊的嚴格引擎會在不含該鍵的情況下重試。                                             |
| `api.registerMemoryCapability(capability)` | 統一記憶體能力                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 記憶體提示區段建構器                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶體清除計畫解析器                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 記憶體執行階段配接器                                                                                                                                                                                 |

### 已棄用的記憶體嵌入配接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶體嵌入配接器     |

- `registerMemoryCapability` 是建議使用的獨佔記憶體外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓配套外掛透過 `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶體成品，
  而不需存取特定記憶體外掛的私有配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 與
  `registerMemoryRuntime` 是具舊版相容性的獨佔記憶體外掛 API。
- `MemoryFlushPlan.model` 可將清除輪次固定至確切的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入提供者應使用
  `api.registerEmbeddingProvider(...)` 與 `contracts.embeddingProviders`。
- 現有的記憶體專用提供者在遷移期間仍可繼續運作，但對非隨附外掛而言，
  外掛檢查會將此項報告為相容性債務。

### 事件與生命週期

| 方法                                         | 功能                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤   |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼         |

如需範例、常見掛鉤名稱及防護語意，請參閱
[外掛掛鉤](/zh-TW/plugins/hooks)。

### 掛鉤決策語意

`before_install` 是外掛執行階段生命週期掛鉤，而非操作員安裝政策介面。
當允許／封鎖決策必須涵蓋命令列介面與閘道支援的安裝或更新路徑時，請使用
`security.installPolicy`。

- `before_tool_call`：回傳 `{ block: true }` 會終止處理。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_tool_call`：回傳 `{ block: false }` 會視為未做決定（等同省略 `block`），而非覆寫先前的決定。
- `before_install`：回傳 `{ block: true }` 會終止處理。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_install`：回傳 `{ block: false }` 會視為未做決定（等同省略 `block`），而非覆寫先前的決定。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 會終止處理。一旦任何處理常式接管分派，就會略過優先順序較低的處理常式與預設模型分派路徑。
- `message_sending`：回傳 `{ cancel: true }` 會終止處理。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `message_sending`：回傳 `{ cancel: false }` 會視為未做決定（等同省略 `cancel`），而非覆寫先前的決定。
- `message_received`：需要路由傳入的討論串／主題時，請使用具型別的 `threadId` 欄位。`metadata` 應保留給頻道特有的額外資料。
- `message_sending`：優先使用具型別的 `replyToId`／`threadId` 路由欄位，再退回使用頻道特有的 `metadata`。
- `gateway_start`：請使用 `ctx.config`、`ctx.workspaceDir` 與 `ctx.getCron?.()` 取得閘道擁有的啟動狀態，而不要依賴內部 `gateway:startup` 鉤子。此時排程可能仍在載入。
- `cron_reconciled`：在啟動或排程器重新載入後，重建完整的外部排程投影。它包含 `reason` 與實際生效的 `enabled` 狀態（包括 `enabled: false`），而 `ctx.getCron?.()` 會回傳完成協調後的確切排程器。請將 `ctx.abortSignal` 傳入持久化投影作業；當該排程器快照被取代或閘道關閉時，它會中止作業。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。`scheduled` 與 `removed` 事件是提交後的協調提示，而非有序的差異記錄。若工作沒有下一次喚醒時間，排程事件的 `event.nextRunAtMs` 將不存在；移除事件仍會攜帶已刪除工作的快照。

外部喚醒排程器應對 `cron_changed` 事件進行防抖或合併，
然後從 `cron_reconciled` 最後擷取的排程器重新讀取完整的持久化檢視。
請勿採用 `cron_changed` 上下文中的排程器：來自較舊排程器的分離提示，
可能會與後續重新載入重疊。

對於在閘道啟動或排程器替換時載入的持久化狀態，請使用
`cron_reconciled` 作為完整快照觸發條件。僅重新載入外掛時不會重播此事件。
觀察處理常式會平行執行，而即發即棄的分派可能彼此重疊，因此消費端不得
依賴事件完成順序。到期檢查與執行應以 OpenClaw 為唯一真實來源。

如需具備持久化替換、重試／退避與乾淨關閉功能的單次執行轉接器，
請參閱[安全的外部排程投影](/zh-TW/plugins/hooks#safe-external-cron-projection)。

### API 物件欄位

| 欄位                     | 類型                      | 說明                                                                                          |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛識別碼                                                                                    |
| `api.name`               | `string`                  | 顯示名稱                                                                                      |
| `api.version`            | `string?`                 | 外掛版本（選填）                                                                              |
| `api.description`        | `string?`                 | 外掛說明（選填）                                                                              |
| `api.source`             | `string`                  | 外掛來源路徑                                                                                  |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選填）                                                                            |
| `api.config`             | `OpenClawConfig`          | 目前的設定快照（若可用，則為作用中的記憶體內執行階段快照）                                    |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專屬設定                                              |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 限定範圍的記錄器（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前的載入模式；`"setup-runtime"` 是完整進入點載入前的輕量啟動／設定時段                       |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                                    |

## 內部模組慣例

在外掛內部，請使用本機彙總檔案進行內部匯入：

```text
my-plugin/
  api.ts            # 提供給外部使用者的公開匯出
  runtime-api.ts    # 僅供內部使用的執行階段匯出
  index.ts          # 外掛進入點
  setup-entry.ts    # 僅供設定使用的輕量進入點（選填）
```

<Warning>
  在正式環境程式碼中，絕不可透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入自己的外掛。內部匯入應透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅供外部契約使用。
</Warning>

透過外觀載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 及類似的公開進入檔案）會在 OpenClaw
已執行時，優先使用作用中的執行階段設定快照。若執行階段快照尚不存在，
則會退回使用磁碟上已解析的設定檔。封裝後的內建外掛外觀應透過 OpenClaw
的外掛外觀載入器載入；直接從 `dist/extensions/...` 匯入會略過封裝安裝
用於外掛自有程式碼的資訊清單與執行階段附屬檔案檢查。

當輔助工具刻意僅供特定供應商使用，且尚不適合置於通用 SDK 子路徑時，
供應商外掛可以公開範圍狹窄的外掛本機契約彙總介面。內建範例：

- **Anthropic**：公開的 `api.ts`／`contract-api.ts` 接合介面，用於 Claude
  測試版標頭與 `service_tier` 串流輔助工具。
- **`@openclaw/openai-provider`**：`api.ts` 匯出供應商建構器、
  預設模型輔助工具與即時供應商建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出供應商建構器，
  以及初始設定／組態輔助工具。

<Warning>
  擴充功能的正式環境程式碼也應避免從 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果輔助工具確實共用，請將它提升至中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  以能力為導向的介面，而非將兩個外掛耦合在一起。
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
    封裝、資訊清單與組態結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試公用工具與程式碼檢查規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用的介面遷移。
  </Card>
  <Card title="外掛內部架構" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與能力模型。
  </Card>
</CardGroup>
