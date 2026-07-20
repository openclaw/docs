---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想查閱 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查找特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概覽
x-i18n:
    generated_at: "2026-07-20T00:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 75fd5dc3cfb7b7594e2fd3d5f577e3e6ff16146d34621f80edc88147acb5f762
    source_path: plugins/sdk-overview.md
    workflow: 16
---

外掛 SDK 是外掛與核心之間的型別化合約。本頁是關於**要匯入什麼**以及**可以註冊什麼**的參考資料。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。對於想要透過閘道執行代理程式的外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能，請改用[外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
</Note>

<Tip>
想找操作指南嗎？請從[建置外掛](/zh-TW/plugins/building-plugins)開始。頻道請使用[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)，模型供應商請使用[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)，本機 AI 命令列介面後端請使用[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)，原生代理程式執行器請使用[代理程式框架外掛](/zh-TW/plugins/sdk-agent-harness)，工具或生命週期鉤子請使用[外掛鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自包含的模組。這可加快啟動速度，並避免循環相依性問題。對於頻道專屬的進入點／建置輔助工具，優先使用 `openclaw/plugin-sdk/channel-core`；`openclaw/plugin-sdk/core` 則保留給範圍較廣的統整介面，以及 `buildChannelConfigSchema` 等共用輔助工具。

對於頻道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布由頻道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用結構描述基本元件與通用建構器。OpenClaw 的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` 處理保留的內建頻道結構描述。該內建結構描述子路徑並不是新外掛應仿效的模式。

<Warning>
  請勿匯入帶有供應商或頻道品牌名稱的便利介面（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。內建外掛會在自己的 `api.ts`／`runtime-api.ts` 彙整模組中組合通用 SDK 子路徑；核心使用者應使用這些外掛本機彙整模組，或在需求確實跨頻道時新增範圍狹窄的通用 SDK 合約。

少數內建外掛輔助介面在有追蹤到擁有者使用情況時，仍會出現在產生的匯出對應表中。它們僅供維護內建外掛使用，不建議新第三方外掛使用這些匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也保留為已棄用的相容性門面，以供追蹤到的擁有者使用。請勿將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助工具與通用頻道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 以一組依領域分組的精簡子路徑公開（外掛進入點、頻道、供應商、驗證、執行階段、功能、記憶，以及保留的內建外掛輔助工具）。如需已分組並附有連結的完整目錄，請參閱[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；從公開集合扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的儲存庫本機測試／內部子路徑後，會產生套件匯出項目。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出項目的數量。已達一定年限且未由內建擴充功能正式環境程式碼使用的已棄用公開子路徑，會在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中追蹤；範圍廣泛的已棄用重新匯出彙整模組則在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中追蹤。

## 註冊 API

`register(api)` 回呼會收到一個具有下列方法的 `OpenClawPluginApi` 物件：

為工作階段提供外部團隊聊天介面的外掛，可以註冊由 `openclaw/plugin-sdk/session-discussion` 匯出的單一全處理程序供應商。其 `info({ sessionKey })` 方法會回報討論是無法使用、可供開啟，還是已開啟；`open({ sessionKey })` 會建立或解析討論，並傳回其內嵌網址與外部網址。註冊另一個供應商會取代目前的供應商。

### 功能註冊

| 方法                                           | 註冊內容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                              |
| `api.registerWorkerProvider(...)`                | 雲端工作節點生命週期租約                                                     |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄資料列                                  |
| `api.registerAgentHarness(...)`                  | [實驗性](/zh-TW/plugins/sdk-agent-harness)原生代理程式執行器（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                       |
| `api.registerChannel(...)`                       | 訊息頻道                                                                 |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入供應商                                                |
| `api.registerSpeechProvider(...)`                | 文字轉語音／STT 合成                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | 雙向即時語音工作階段                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | 影像／音訊／視訊分析                                                        |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                        |
| `api.registerImageGenerationProvider(...)`       | 影像生成                                                                  |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                  |
| `api.registerVideoGenerationProvider(...)`       | 視訊生成                                                                  |
| `api.registerWebFetchProvider(...)`              | 網頁擷取／抓取供應商                                                       |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                        |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                           |

工作節點供應商也必須在 `contracts.workerProviders` 中宣告其 ID。核心會在 `provision(profile, operationId)` 之前持久保存意圖。供應商會在進行外部分配前驗證設定，若設定檔遭永久拒絕，則擲回 `WorkerProviderError`。當作業 ID 重複時，`provision` 必須採用相同的租約。
核心會連同租約持久保存已驗證的設定檔設定，並將該快照提供給必須具備冪等性的 `destroy({ leaseId, profile })`，以及會傳回 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。這可讓供應商在閘道重新啟動或具名設定檔遭移除後，仍能路由生命週期呼叫。SSH 端點會為 `keyRef` 使用 `SecretRef`，絕不內嵌金鑰內容，並包含來自受信任佈建輸出的 `hostKey`，其格式必須恰好為 `algorithm base64`，不得包含主機名稱或註解。核心會釘選 `hostKey`，絕不信任首次連線取得的金鑰。若供應商會產生動態 `keyRef`，則可實作 `resolveSshIdentity({ leaseId, profile, keyRef })`；若有提供，該解析器即為權威來源，而未提供的供應商則使用已設定的通用密鑰解析器。
具有可續期租約的供應商也可以實作 `renew(leaseId)`。
`inspect` 在發生暫時性或不確定的失敗時必須擲回錯誤；只有在權威確認不存在時才傳回 `unknown`。核心會將作用中的本機記錄標記為孤立，或在已持久保存銷毀要求後，將不存在視為拆除完成。

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入供應商，也必須列在外掛資訊清單的 `contracts.embeddingProviders` 中。這是可重複使用向量生成的通用嵌入介面。記憶搜尋可以使用此通用供應商介面。在現有的記憶體專屬供應商進行移轉期間，較舊的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 介面是已棄用的相容性介面。

仍公開執行階段 `batchEmbed(...)` 的記憶體專屬供應商，除非其執行階段明確設定 `sourceWideBatchEmbed: true`，否則會維持現有的逐檔批次處理合約。選擇啟用後，記憶體主機可在單次 `batchEmbed(...)` 呼叫中提交來自多個已變更記憶體檔案與已啟用來源的區塊，上限為主機的批次限制。上傳 JSONL 要求檔案的批次配接器，除了要求數量上限外，也必須在達到上傳大小上限之前拆分供應商作業。供應商必須依照與 `batch.chunks` 相同的順序，為每個輸入區塊傳回一個嵌入；若供應商預期逐檔批次，或無法在範圍更大的來源層級作業中維持輸入順序，請省略該旗標。

### 工具與命令

對於工具名稱固定的簡易純工具外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合型外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                                 | 註冊內容                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 代理程式工具（必要或 `{ optional: true }`）                                                                                            |
| `api.registerCommand(def)`             | 自訂命令（略過 LLM）                                                                                                        |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 處理的命令；選用的 `agentTool` 中繼資料可在節點連線期間，將其公開為代理程式可見的工具 |

當代理程式需要簡短且由命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。該文字應只描述命令本身；請勿將供應商或外掛專屬政策加入核心提示詞建構器。

指引項目可以是套用至所有提示詞介面的舊式字串，也可以是結構化項目：

```ts
agentPromptGuidance: [
  "全域命令提示。",
  { text: "僅在 OpenClaw 主提示詞中顯示此內容。", surfaces: ["openclaw_main"] },
];
```

結構化 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若刻意要讓指引套用至所有介面，請省略 `surfaces`。請勿傳入空的 `surfaces` 陣列；系統會拒絕該陣列，以避免意外遺失範圍設定而使內容成為全域提示詞文字。

原生 Codex 應用程式伺服器的開發人員指示比其他提示詞介面更嚴格：只有明確限定於 `codex_app_server` 的指引，才會提升至該較高優先順序的通道。為維持相容性，舊式字串指引與未限定範圍的結構化指引仍可供非 Codex 提示詞介面使用。

節點主機命令會在已連線的節點主機上執行，而不是在閘道程序內執行。如果存在 `agentTool`，節點會在成功連線至閘道後發布描述元；只有當該節點保持連線，且描述元的 `command` 位於節點已核准的命令介面中時，閘道才會將其提供給代理程式執行。設定 `agentTool.defaultPlatforms`，即可將非危險命令加入預設節點命令允許清單；否則必須明確設定 `gateway.nodes.allowCommands` 或節點叫用原則。`agentTool.name` 必須符合提供者安全要求：以字母開頭、僅使用字母、數字、底線或連字號，且長度不得超過 64 個字元。以 MCP 為後端的節點工具可設定 `agentTool.mcp` 中繼資料，讓目錄與工具搜尋介面顯示遠端 MCP 伺服器／工具身分，但執行仍會經由公告的節點命令進行。

### 基礎架構

| 方法                                            | 註冊內容                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 事件掛鉤                                                               |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                                         |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                                          |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告器                                                     |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                                       |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的節點功能命令列介面                                |
| `api.registerService(service)`                  | 背景服務                                                               |
| `api.registerInteractiveHandler(registration)`  | 互動式處理常式                                                         |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                               |
| `api.registerMemoryPromptSupplement(builder)`   | 可附加的記憶相鄰提示詞區段                                             |
| `api.registerMemoryPromptPreparation(prepare)`  | 記憶相鄰提示詞區段的非同步準備                                         |
| `api.registerMemoryCorpusSupplement(adapter)`   | 可附加的記憶搜尋／讀取語料庫                                           |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器式託管媒體 URL 的解析器                                          |
| `api.registerMcpServerConnectionResolver(...)`  | 靜態伺服器名稱的每請求者 MCP 傳輸（`url`/`headers`） |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的提示詞／訊息相容性文字重寫                                  |
| `api.registerConfigMigration(migrate)`          | 外掛執行階段載入前執行的輕量設定遷移                                  |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                                             |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測                                             |
| `api.registerReload(registration)`              | 重新載入處理的重新啟動／熱重新載入／無操作設定前綴原則                |
| `api.registerNodeHostCommand(command)`          | 提供給已配對節點的命令處理常式                                         |
| `api.registerNodeInvokePolicy(policy)`          | 節點叫用命令的允許清單／核准原則                                       |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現項目收集器                              |

#### 確認回應後的網路鉤子工作

在處理完成前就確認請求的網路鉤子路由，必須將該分離工作移至其自身受追蹤的准入根：

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`網路鉤子分派失敗：${String(error)}`);
});
```

HTTP 請求仍處於准入狀態時，以同步方式呼叫 `runDetachedWebhookWork(...)`。此輔助函式會立即保留獨立的根，接著在下一個微任務中啟動回呼，讓請求處理常式可先寫入確認回應。傳回的 Promise 會採用回呼結果；呼叫端仍須負責處理拒絕。如此可讓確認回應後的佇列工作獲得接受，並使重新啟動或暫停排空等待該工作完成。在傳回前等待所有處理完成的處理常式不需要此輔助函式。

#### 請求者範圍的 MCP 連線

在 `mcp.servers` 或套件組合資訊清單中保持 MCP 伺服器**身分**（名稱、工具篩選器）為靜態。可選擇註冊連線解析器，讓每位受信任的訊息請求者取得各自的傳輸：

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId 由主機信任；絕不可在此虛構傳送者身分。
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // 在目前執行中省略此伺服器
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

契約注意事項：

- 解析器內容僅攜帶受信任的主機身分（`requesterSenderId`、可選的 `agentAccountId`／`messageChannel`）。未來可透過附加方式加入其他受信任欄位（例如排程／子代理程式使用者內容）。
- 一個伺服器名稱僅由一個外掛擁有：若另一個外掛針對相同的 `serverName` 重複註冊 `registerMcpServerConnectionResolver`，系統會以錯誤診斷拒絕（首次註冊者優先），因此連線擁有權絕不依賴外掛載入順序。
- 工具名稱會從完整宣告的伺服器集合衍生，因此部分解析絕不會造成安全伺服器名稱在不同請求者或執行回合間改變。核心不會驗證不同請求者端點是否提供相同的工具結構描述；解析器必須將每位請求者導向相同的邏輯服務，否則工具結構描述（以及提示詞快取穩定性）會因請求者而異。
- 缺少受信任 `requesterSenderId` 的執行（排程、子代理程式、心跳偵測、公開閘道）絕不會實體化請求者範圍的伺服器。不存在共用的備援連線。
- 每個伺服器的 `resolve` 上限為 10 秒；逾時或擲回錯誤時，會在該次執行中省略該伺服器，而不會導致靜態 MCP 失敗。
- 每位請求者的已解析連線最多每 5 分鐘重新驗證一次：輪替時會使用新的認證資訊重建傳輸，而 `null` 結果會撤銷該連線（即使在工作階段進行期間，也會處置快取的執行階段）。因此，已撤銷或輪替的認證資訊可能仍會繼續使用最多 5 分鐘。
- 已解析的 `headers` 絕不會記錄或持久保存；核心僅保留暫時的記憶體內鍵控摘要（程序本機 HMAC）來偵測認證資訊輪替，並向記錄／偵錯擷取遮蔽登錄註冊已解析的標頭／URL 認證資訊值。
- 請求者範圍的伺服器不會建立 MCP App 檢視：檢視的存續時間會超過請求者驗證身分的執行，而閘道檢視邊界不具請求者身分，因此這些伺服器的應用程式預覽會維持故障關閉。工具結果不受影響。
- 沒有解析器的靜態伺服器會保留現有的工作階段範圍生命週期。
- **執行框架傳遞規則：**請求者範圍的伺服器絕不會進入執行框架原生 MCP 用戶端設定（Codex 執行緒 `mcp_servers`、命令列介面 `-c mcp_servers=…`，或任何其他工作階段共用的 MCP 投影）。執行框架改以執行範圍工具傳遞它們：
  - 內嵌執行器：工作階段 MCP 執行階段 + 套件組合工具（靜態 + 範圍限定）。
  - Codex 應用程式伺服器：透過 `materializeRequesterScopedMcpToolsForHarnessRun` 提供動態工具（僅限範圍限定；靜態伺服器仍使用 Codex 的原生 MCP 用戶端）。
- 範圍限定工具的**規格**會在該工作階段首次成功解析後保持穩定，因此共用執行緒的執行框架（Codex）不會在傳送者變更時輪替執行緒。在任何請求者完成解析前，不會公告任何範圍限定規格。
- 共用執行緒執行框架上的未驗證請求者仍會看到已公告的範圍限定工具；呼叫其中任一工具時，會針對該請求者傳回明確的未連線工具錯誤。OpenClaw 絕不會改用其他請求者的認證資訊。

記憶提示詞補充建構器會接收可選的 `agentId`、`agentSessionKey` 與 `sandboxed` 內容。記憶語料庫補充的 `search` 與 `get` 呼叫會接收可選的 `agentId` 與 `sandboxed` 內容。具有代理程式擁有儲存空間的外掛，應在每次呼叫時解析該儲存空間，而不是在註冊期間擷取單一全域路徑。如果多代理程式操作需要代理程式 ID 卻未提供，應採取故障關閉，而不是任意選擇代理程式。

當提示詞文字取決於非同步外掛狀態時，請使用 `registerMemoryPromptPreparation(...)`。回呼會在每次完整代理程式提示詞之前執行一次，並接收與同步記憶提示詞建構器相同的工具、代理程式、工作階段及沙箱內容。載入持久化狀態前，請先驗證目前的儲存空間擁有者執行個體，然後僅傳回該次執行所需的行。OpenClaw 會凍結這些行，並將不可變結果交給同步提示詞組裝。持久化、不可分割替換及擁有者移除時的刪除作業應保留在擁有該資料的外掛內；不要從提示詞建構器輪詢或讀取檔案。

Telegram 互動式處理常式可傳回 `{ submitText }`，在處理常式成功後，透過 Telegram 的一般傳入代理程式路徑傳送文字。當傳入原則略過該文字或處理失敗時，OpenClaw 會保留回呼按鈕，讓使用者可在阻擋條件改變後重試。此結果欄位專屬於 Telegram；其他頻道會保留各自的互動式結果契約。

### 工作流程外掛的主機掛鉤

主機掛鉤是 SDK 接合面，供需要參與主機生命週期，而不只是新增提供者、頻道或工具的外掛使用。它們是通用契約；規劃模式可以使用，核准工作流程、工作區原則閘門、背景監視器、設定精靈及 UI 伴隨外掛也同樣可以使用。

| 方法                                                                               | 其負責的契約                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 由外掛擁有、與 JSON 相容，並透過閘道工作階段投影的工作階段狀態                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 注入單一工作階段下一個代理程式回合的持久性恰好一次內容                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | 受資訊清單管控、可信任且在外掛工具之前執行的政策，可封鎖或重寫工具參數                                                                        |
| `api.registerToolMetadata(...)`                                                      | 不變更工具實作的工具目錄顯示中繼資料                                                                                     |
| `api.registerCommand(...)`                                                           | 有範圍限制的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 適用於工作階段、工具、執行、設定或分頁介面的控制介面貢獻描述元                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設、刪除或重新載入路徑中，清理外掛所擁有執行階段資源的回呼                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監視器的已清理事件訂閱                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，會在執行進入終止生命週期時清除                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛所擁有排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建外掛、由主機介導，將檔案附件傳送至目前直接外送工作階段路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建外掛、由排程支援的排程工作階段回合，以及基於標籤的清理                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的型別化工作階段動作                                                                                             |

`surface: "tab"` 描述元會在控制介面新增側邊欄分頁。作用中
外掛的分頁描述元會在閘道 hello（`controlUiTabs`）中公告給儀表板
用戶端，因此只有在外掛啟用時才會顯示該分頁。
內建外掛可為其分頁提供一級儀表板檢視；其他
外掛可將 `path` 設為外掛 HTTP 路由（請參閱
`api.registerHttpRoute(...)`），由儀表板在沙箱化框架中呈現。
`icon` 是儀表板圖示名稱提示，`group` 用於選擇側邊欄區段
（`control` 或 `agent`），`order` 用於排列外掛分頁，而 `requiredScopes`
會對缺少這些操作者範圍的連線隱藏該分頁：

若是受閘道保護的外部分頁，請在同一外掛的
`auth: "gateway"` HTTP 路由下註冊描述元 `path`。完成已驗證的啟動程序後，瀏覽器會取得
範圍限定於該外掛及路由根目錄、短效且為 HttpOnly 的授權，讓
沙箱化框架無須將閘道持有人權杖複製到其 URL
或 JavaScript 中即可載入。已驗證的父頁面會在外部分頁
作用中時續期授權，並在導覽或瀏覽器恢復後掛載分頁之前續期。它也會
在掛載前從相同的不透明沙箱探測授權，因此若瀏覽器
隱私模式封鎖 Cookie，便會以關閉方式失敗並顯示無法使用的面板。
框架授權僅接受 `GET` 和 `HEAD`，且一律包含
`operator.read`；`requiredScopes` 控制分頁可見性，但絕不會擴大
Cookie 授權範圍。變更操作仍須透過明確經閘道驗證的父頁面或
持有人介面執行。外部分頁需要 HTTPS/Tailscale Serve 或
瀏覽器信任的迴路位址來源；區域網路主機上的純 HTTP 會顯示
安全內容錯誤，而不會掛載無法驗證的面板。
完整封鎖第三方 Cookie 也會使受閘道保護的分頁無法使用。
如同所有原生外掛介面，框架仍位於已安裝
外掛的信任邊界內；OpenClaw 不會將已安裝的外掛視為彼此
隔離的瀏覽器安全性主體。
Cookie 授權使用瀏覽器的主機名稱邊界，而非連接埠邊界。即使使用其他
連接埠，也不要在閘道主機名稱上共同託管彼此不信任的服務。
由外掛管理驗證的分頁會保留其直接 iframe 行為，且不會
要求或需要此閘道授權。

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

等效的扁平方法仍會保留，作為現有外掛已棄用的相容性
別名。請勿新增會直接呼叫
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是以工作階段為範圍、包裝閘道
排程器的便利功能。排程負責時機，並在回合執行時建立背景任務記錄；
外掛 SDK 僅限制目標工作階段、外掛所擁有的命名
與清理。若工作本身需要持久的多步驟任務流程狀態，請在排程
回合內使用 `api.runtime.tasks.managedFlows`。

這些契約刻意拆分權限：

- 外部外掛可擁有工作階段擴充功能、介面描述元、命令、工具
  中繼資料、下一回合注入項目，以及一般掛鉤。
- 可信任工具政策會在一般 `before_tool_call` 掛鉤之前執行，且受
  主機信任。內建政策會先執行；已安裝外掛的政策需要
  明確啟用，且其本機 ID 必須列於
  `contracts.trustedToolPolicies`，之後再依外掛載入順序執行。政策 ID
  的範圍限於註冊該政策的外掛。
- 保留命令的所有權僅限內建外掛。外部外掛應使用其
  自有命令名稱或別名。
- `allowPromptInjection=false` 會停用會修改提示詞的掛鉤，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`
  和 `enqueueNextTurnInjection`。

非 Plan 使用者的範例：

| 外掛原型             | 使用的掛鉤                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程            | 工作階段擴充功能、命令接續、下一回合注入、介面描述元                                                            |
| 預算／工作區政策閘門 | 可信任工具政策、工具中繼資料、工作階段投影                                                                                 |
| 背景生命週期監視器 | 執行階段生命週期清理、代理程式事件訂閱、工作階段排程器所有權／清理、心跳偵測提示詞貢獻、介面描述元 |
| 設定或初始設定精靈   | 工作階段擴充功能、有範圍限制的命令、控制介面描述元                                                                              |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使外掛嘗試指派
  更窄的閘道方法範圍亦然。外掛所擁有的方法應優先使用
  外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  當內建外掛及已明確啟用、且具有相符
  資訊清單契約的已安裝外掛，需要在工具執行後、執行階段
  將結果回饋給模型前重寫工具結果時，可以使用 `api.registerAgentToolResultMiddleware(...)`。
  這是供 tokenjuice 等非同步輸出歸納器使用、受信任且與執行階段無關的
  介接點。

外掛必須為每個目標
執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。缺少該
契約或未明確啟用的已安裝外掛無法註冊此中介軟體；不需要在模型前處理工具結果
時機的工作，請繼續使用一般 OpenClaw 外掛掛鉤。舊有
僅限內嵌執行器的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓外掛在 mDNS/Bonjour 等本機探索
傳輸上公告作用中的閘道。啟用本機探索時，OpenClaw 會在
閘道啟動期間呼叫該服務，傳入目前的閘道連接埠與非機密 TXT 提示資料，並在
閘道關閉期間呼叫傳回的 `stop` 處理常式。

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

閘道探索外掛不得將公告的 TXT 值視為機密或
驗證資訊。探索只是路由提示；閘道驗證與 TLS 固定仍然
負責信任。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩類命令中繼資料：

- `commands`：由註冊者擁有的明確命令名稱
- `descriptors`：用於命令列介面說明、
  路由及延遲外掛命令列介面註冊的剖析階段命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於已配對節點功能，請優先使用
`api.registerNodeCliFeature(registrar, opts?)`。這是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝，
可將 `openclaw nodes canvas` 等命令明確標示為
外掛所擁有的節點功能。

若要讓外掛命令在一般根命令列介面路徑中維持延遲載入，
請提供涵蓋該註冊者公開之每個頂層命令根的 `descriptors`。

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

巢狀命令會接收解析完成的父命令作為 `program`：

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

只有在不需要延遲註冊根命令列介面時，才單獨使用 `commands`。
此預先載入的相容性路徑仍受支援，但不會安裝
由描述元支援、可在解析時延遲載入的預留項目。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 可讓外掛擁有本機
AI 命令列介面後端（例如 `claude-cli` 或 `my-cli`）的預設設定。

- 後端 `id` 會成為模型參照（例如 `my-cli/gpt-5`）中的提供者前綴。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的結構。
- 使用者設定仍具有優先權。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併至
  外掛預設值之上，再執行命令列介面。
- 當後端在合併後需要進行相容性重寫時，請使用 `normalizeConfig`
  （例如將舊的旗標結構正規化）。
- 對於屬於命令列介面方言、以請求為範圍的 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 的思考層級對應至原生的投入程度旗標。
  此掛鉤會接收 `ctx.executionMode`；對於暫時性的 `/btw` 呼叫，請使用 `"side-question"`
  加入後端原生的隔離旗標。如果這些旗標能可靠地停用原本一律啟用的命令列介面原生工具，
  也請宣告 `sideQuestionToolMode: "disabled"`。
- 對於後端擁有的啟動環境或暫時性
  驗證／設定橋接，請使用 `prepareExecution`。其 `ctx.contextTokenBudget` 是為該次執行選定的有效權杖
  限制，因此支援原生壓縮的後端可對齊自己的閾值，而無須在核心加入提供者專屬分支。
- 能針對特定執行停用所有原生工具的後端，可宣告
  `nativeToolMode: "selectable"`。受限制的呼叫會傳入空的
  `ctx.toolAvailability.native` 元組，以及精確且與主機隔離的 MCP 允許清單；
  `resolveExecutionArgs` 必須在最終全新或續接的 argv 上強制執行兩者。
  如果後端無法做到，OpenClaw 會採取封閉式失敗。

如需端對端撰寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 獨佔插槽

| 方法                                     | 註冊內容                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能啟用一個）。當主機可提供模型／提供者／模式診斷時，生命週期回呼會收到 `runtimeSettings`；較舊的嚴格引擎則會在不含該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                          |

### 已淘汰的記憶嵌入配接器

| 方法                                         | 註冊內容                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入配接器 |

- `registerMemoryCapability` 是獨佔的記憶外掛 API。
- `registerMemoryCapability` 也可公開 `publicArtifacts.listArtifacts(...)`
  以供主機管理的匯出使用。列舉這些已宣告成品的配套外掛，在有專門的公開消費者
  API 之前，仍會使用保留的
  `openclaw/plugin-sdk/memory-host-core` 外觀所提供的 `listActiveMemoryPublicArtifacts(...)`；它們不得存取其他外掛的私有配置。
- `MemoryFlushPlan.model` 可將清除回合固定至精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的備援鏈。
- `registerMemoryEmbeddingProvider` 已淘汰。新的嵌入提供者
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 現有的記憶專用提供者在遷移期間仍可繼續運作，
  但外掛檢查會將非內建外掛的此情況回報為相容性債務。

### 事件與生命週期

| 方法                                       | 功能                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤          |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼 |

如需範例、常見掛鉤名稱及防護
語意，請參閱[外掛掛鉤](/zh-TW/plugins/hooks)。

### 掛鉤決策語意

`before_install` 是外掛執行階段的生命週期掛鉤，而不是操作者安裝
原則介面。當允許／封鎖決策必須涵蓋命令列介面及閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：傳回 `{ block: true }` 即為終止決策。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_tool_call`：傳回 `{ block: false }` 會視為未作決策（等同省略 `block`），而非覆寫。
- `before_install`：傳回 `{ block: true }` 即為終止決策。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `before_install`：傳回 `{ block: false }` 會視為未作決策（等同省略 `block`），而非覆寫。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 即為終止決策。一旦任何處理常式接管分派，就會略過優先順序較低的處理常式及預設模型分派路徑。
- `message_sending`：傳回 `{ cancel: true }` 即為終止決策。一旦任何處理常式設定此值，就會略過優先順序較低的處理常式。
- `message_sending`：傳回 `{ cancel: false }` 會視為未作決策（等同省略 `cancel`），而非覆寫。
- `message_received`：需要進行傳入討論串／主題路由時，請使用型別化的 `threadId` 欄位。頻道專屬的額外資料則繼續使用 `metadata`。
- `message_sending`：請先使用型別化的 `replyToId`／`threadId` 路由欄位，再退回使用頻道專屬的 `metadata`。
- `gateway_start`：對於閘道擁有的啟動狀態，請使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而非依賴內部 `gateway:startup` 掛鉤。此時排程可能仍在載入。
- `cron_reconciled`：在啟動或排程器重新載入後，重建完整的外部排程投影。它包含 `reason` 和有效的 `enabled` 狀態（包括 `enabled: false`），而 `ctx.getCron?.()` 會傳回精確且已協調的排程器。將 `ctx.abortSignal` 傳入持久投影工作；當該排程器快照遭取代或閘道關閉時，它會中止。
- `cron_changed`：觀察閘道擁有的排程生命週期變更。`scheduled` 和 `removed` 事件是提交後的協調提示，而不是有序的差異記錄。當工作沒有下一次喚醒時間時，排程事件的 `event.nextRunAtMs` 不會存在；移除事件仍會攜帶已刪除工作的快照。

外部喚醒排程器應對 `cron_changed` 事件進行防彈跳或合併，
然後從 `cron_reconciled` 最後擷取的排程器重新讀取完整的持久檢視。
不要採用 `cron_changed` 上下文中的排程器：來自較舊排程器的
分離提示可能會與稍後的重新載入重疊。

對於在閘道啟動或排程器替換時載入的持久狀態，請使用 `cron_reconciled`
作為完整快照觸發器。外掛專屬的熱重新載入不會重播此觸發器。
觀察處理常式會平行執行，而射後不理的分派可能會重疊，因此消費者不得依賴事件完成順序。
到期檢查與執行應以 OpenClaw 為真實資料來源。

如需具備持久替換、重試／退避及乾淨
關閉功能的單航次配接器，請參閱[安全的外部排程投影](/zh-TW/plugins/hooks#safe-external-cron-projection)。

### API 物件欄位

| 欄位                    | 型別                      | 說明                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 ID                                                                                   |
| `api.name`               | `string`                  | 顯示名稱                                                                                |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                   |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                               |
| `api.source`             | `string`                  | 外掛來源路徑                                                                          |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                            |
| `api.config`             | `OpenClawConfig`          | 目前的設定快照（可用時為作用中的記憶體內執行階段快照）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛專屬設定                                   |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 限定範圍的記錄器（`debug`、`info`、`warn`、`error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前的載入模式；`"setup-runtime"` 是進入完整進入點前的輕量啟動／設定時段 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                        |

## 內部模組慣例

在你的外掛中，內部匯入請使用本機 barrel 檔案：

```text
my-plugin/
  api.ts            # 供外部消費者使用的公開匯出
  runtime-api.ts    # 僅供內部使用的執行階段匯出
  index.ts          # 外掛進入點
  setup-entry.ts    # 僅供設定使用的輕量進入點（選用）
```

<Warning>
  絕對不要在正式環境程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。內部匯入應透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅供外部契約使用。
</Warning>

透過 facade 載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入點檔案）在 OpenClaw 已執行時，會優先使用
作用中執行階段的設定快照。若執行階段快照尚不存在，則會改用磁碟上已解析的設定檔。
封裝後的內建外掛 facade 應透過 OpenClaw 的外掛 facade 載入器載入；直接從
`dist/extensions/...` 匯入，會略過封裝安裝針對外掛自有程式碼所使用的資訊清單
與執行階段 sidecar 檢查。

當某個輔助工具刻意限定於特定供應商，且尚不適合放入通用 SDK 子路徑時，
供應商外掛可以公開範圍有限的外掛本機契約 barrel。內建範例：

- **Anthropic**：公開的 `api.ts` / `contract-api.ts` 銜接介面，用於 Claude
  beta 標頭與 `service_tier` 串流輔助工具。
- **`@openclaw/openai-provider`**：`api.ts` 會匯出供應商建構器、
  預設模型輔助工具，以及即時供應商建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 會匯出供應商建構器，
  以及新手引導／設定輔助工具。

<Warning>
  擴充功能的正式環境程式碼也應避免從 `openclaw/plugin-sdk/<other-plugin>`
  匯入。若某個輔助工具確實共用，請將其提升至中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  以功能為導向的介面，而不要讓兩個外掛彼此耦合。
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
    測試公用工具與 lint 規則。
  </Card>
  <Card title="SDK 移轉" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用的介面移轉。
  </Card>
  <Card title="外掛內部機制" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與功能模型。
  </Card>
</CardGroup>
