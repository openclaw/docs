---
read_when:
    - 你需要知道該從哪個 SDK 子路徑匯入
    - 你需要 OpenClawPluginApi 所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: 外掛 SDK 概覽
x-i18n:
    generated_at: "2026-07-22T10:41:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7d2bd239115399f412b7e4900980d21a22ef13554818d5b0be30330b42ce21a0
    source_path: plugins/sdk-overview.md
    workflow: 16
---

OpenClaw 外掛 SDK 是外掛與核心之間的型別化合約。本頁是關於**要匯入什麼**以及**可以註冊什麼**的參考資料。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的外掛作者。若外部應用程式、指令碼、儀表板、CI 工作及 IDE 擴充功能想透過閘道執行代理程式，請改用
  [外部應用程式的閘道整合](/zh-TW/gateway/external-apps)。
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

每個子路徑都是小型且自成一體的模組。如此可維持快速啟動，並避免循環相依性問題。對於頻道專用的進入點／建置輔助工具，優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣泛的傘狀介面，以及 `buildChannelConfigSchema` 等共用輔助工具。

對於頻道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布由頻道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑用於共用結構描述基元與通用建置器。OpenClaw 的內建外掛會將 `plugin-sdk/bundled-channel-config-schema` 用於保留的內建頻道結構描述。該內建結構描述子路徑並非新外掛應遵循的模式。

<Warning>
  請勿匯入帶有供應商或頻道品牌的便利介面（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建外掛會在自身的 `api.ts`／
  `runtime-api.ts` 彙總模組中組合通用 SDK 子路徑；核心取用端應使用這些外掛本機彙總模組，或在需求確實跨頻道時新增範圍明確的通用 SDK 合約。

少數內建外掛輔助介面若有受到追蹤的擁有者使用情形，仍會出現在產生的匯出對應表中。它們僅供維護內建外掛使用，不建議作為新第三方外掛的匯入路徑。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也會保留為已棄用的相容性外觀介面，以供受到追蹤的擁有者使用。請勿將這些匯入路徑複製到新外掛中；請改用注入的執行階段輔助工具與通用頻道 SDK 子路徑。
</Warning>

## 子路徑參考

外掛 SDK 會以一組依領域分組的精簡子路徑公開（外掛進入點、頻道、供應商、驗證、執行階段、能力、記憶，以及保留的內建外掛輔助工具）。如需經過分組且附有連結的完整目錄，請參閱
[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；型別化的公開匯出會排除
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的內部子路徑。該清單中的正式環境進入點會保留僅限 JavaScript 的主機執行階段匯出，以供個別發布的官方外掛使用，而僅供測試的進入點則維持不匯出。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出的數量。已存在足夠時間且未由內建擴充功能正式環境程式碼使用的已棄用公開子路徑，會在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中追蹤；範圍廣泛且已棄用的重新匯出彙總模組則在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中追蹤。

## 註冊 API

`register(api)` 回呼會接收一個 `OpenClawPluginApi` 物件，其中包含以下方法：

為工作階段提供外部團隊聊天介面的外掛，可以註冊由
`openclaw/plugin-sdk/session-discussion` 匯出的單一全程序供應商。其 `info({ sessionKey })` 方法會回報討論是否無法使用、已可開啟或已開啟；`open({ sessionKey })` 會建立或解析該討論，並傳回其嵌入網址與外部網址。註冊另一個供應商會取代目前的供應商。

### 能力註冊

| 方法                                           | 註冊內容                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                                                              |
| `api.registerWorkerProvider(...)`                | 雲端工作程式生命週期租約                                                     |
| `api.registerModelCatalogProvider(...)`          | 文字與媒體生成的模型目錄資料列                                  |
| `api.registerAgentHarness(...)`                  | [實驗性功能](/zh-TW/plugins/sdk-agent-harness)原生代理程式執行器（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | 本機命令列介面推論後端                                                       |
| `api.registerChannel(...)`                       | 訊息頻道                                                                 |
| `api.registerEmbeddingProvider(...)`             | 可重複使用的向量嵌入供應商                                                |
| `api.registerSpeechProvider(...)`                | 文字轉語音／STT 合成                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | 影像／音訊／影片分析                                                        |
| `api.registerTranscriptSourceProvider(...)`      | 即時或匯入的會議逐字稿來源                                        |
| `api.registerImageGenerationProvider(...)`       | 影像生成                                                                  |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                                                                  |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                                                                  |
| `api.registerWebFetchProvider(...)`              | 網頁擷取／抓取供應商                                                       |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                                                                        |
| `api.registerCompactionProvider(...)`            | 可插拔的逐字稿壓縮後端                                           |

工作程式供應商也必須在 `contracts.workerProviders` 中宣告其 ID。
核心會在 `provision(profile, operationId)` 之前持久保存意圖。供應商會在外部分配前驗證設定，並在永久拒絕設定檔時擲回 `WorkerProviderError`。當作業 ID 重複時，`provision` 必須採用相同的租約。
核心會連同租約持久保存已驗證的設定檔設定，並將該快照提供給必須具備冪等性的 `destroy({ leaseId, profile })`，以及會傳回 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。如此一來，供應商便能在閘道重新啟動或具名設定檔遭移除後，路由生命週期呼叫。SSH 端點會對 `keyRef` 使用 `SecretRef`，絕不直接內嵌金鑰內容，並包含來自受信任佈建輸出的 `hostKey`，且其內容必須恰為 `algorithm base64`，不含主機名稱或註解。核心會固定 `hostKey`，絕不信任首次連線取得的金鑰。產生動態 `keyRef` 的供應商可以實作 `resolveSshIdentity({ leaseId, profile, keyRef })`；若存在，該解析器即為權威來源，而未提供它的供應商則會使用已設定的通用密鑰解析器。
具備可續期租約的供應商也可以實作 `renew(leaseId)`。
`inspect` 必須在暫時性或無法判定的失敗時擲回錯誤；只有在確認不存在時才能傳回 `unknown`。核心會將作用中的本機記錄標記為孤立，或在已持久保存銷毀要求後，將不存在視為拆除完成。

使用 `api.registerEmbeddingProvider(...)` 註冊的嵌入供應商，也必須列於外掛資訊清單的 `contracts.embeddingProviders` 中。這是供可重複使用向量生成使用的通用嵌入介面。記憶搜尋可以使用此通用供應商介面。在現有記憶專用供應商進行移轉期間，較舊的 `api.registerMemoryEmbeddingProvider(...)` 與 `contracts.memoryEmbeddingProviders` 介面會作為已棄用的相容性介面。

仍公開執行階段 `batchEmbed(...)` 的記憶專用供應商，會維持使用現有的逐檔批次處理合約，除非其執行階段明確設定 `sourceWideBatchEmbed: true`。此選擇啟用項目可讓記憶主機在主機批次限制內，於一次 `batchEmbed(...)` 呼叫中提交來自多個已變更記憶檔案及已啟用來源的區塊。上傳 JSONL 要求檔案的批次轉接器，除了要求數量上限外，也必須在達到上傳大小上限前拆分供應商工作。供應商必須依照與 `batch.chunks` 相同的順序，為每個輸入區塊傳回一個嵌入；若供應商預期逐檔批次，或無法在較大的跨來源工作中維持輸入順序，請省略此旗標。

### 工具與命令

對於工具名稱固定且僅包含簡單工具的外掛，請使用 [`defineToolPlugin`](/zh-TW/plugins/tool-plugins)。對於混合型外掛或完全動態的工具註冊，請直接使用 `api.registerTool(...)`。

| 方法                                 | 註冊內容                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 代理程式工具（必要或 `{ optional: true }`）                                                                                            |
| `api.registerCommand(def)`             | 自訂命令（略過 LLM）                                                                                                        |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 處理的命令；選用的 `agentTool` 中繼資料可在節點連線時將其公開為代理程式可見的工具 |

當代理程式需要簡短且由命令擁有的路由提示時，外掛命令可以設定 `agentPromptGuidance`。該文字應只描述命令本身；請勿將供應商或外掛專用政策加入核心提示建置器。

指引項目可以是套用於每個提示介面的舊版字串，或是結構化項目：

```ts
agentPromptGuidance: [
  "全域命令提示。",
  { text: "僅在主要 OpenClaw 提示中顯示此內容。", surfaces: ["openclaw_main"] },
];
```

結構化的 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已棄用別名。若刻意要將指引套用至所有介面，請省略 `surfaces`。請勿傳入空的 `surfaces` 陣列；系統會拒絕它，以免意外遺失範圍時使文字成為全域提示內容。

原生 Codex 應用程式伺服器的開發人員指示比其他提示介面更嚴格：只有明確限定於 `codex_app_server` 的指引，才會提升至該較高優先順序的管道。為了維持相容性，舊版字串指引與未限定範圍的結構化指引仍可用於非 Codex 提示介面。

節點主機命令會在已連線的節點主機上執行，而不是在閘道程序內執行。如果存在 `agentTool`，節點會在成功連線至閘道後發布描述元；只有當該節點保持連線，且描述元的 `command` 位於節點已核准的命令介面中時，閘道才會將其提供給代理程式執行。設定 `agentTool.defaultPlatforms`，可將非危險命令加入預設節點命令允許清單；否則必須明確設定 `gateway.nodes.commands.allow` 或節點叫用原則。`agentTool.name` 必須符合供應商安全規範：以字母開頭，只能使用字母、數字、底線或連字號，且不得超過 64 個字元。由 MCP 支援的節點工具可設定 `agentTool.mcp` 中繼資料，讓目錄與工具搜尋介面顯示遠端 MCP 伺服器／工具身分，但執行仍會透過公告的節點命令進行。

### 基礎架構

| 方法                                          | 註冊內容                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 事件掛鉤                                                             |
| `api.registerHttpRoute(params)`                 | 閘道 HTTP 端點                                                  |
| `api.registerGatewayMethod(name, handler)`      | 閘道 RPC 方法                                                     |
| `api.registerGatewayDiscoveryService(service)`  | 本機閘道探索公告器                                     |
| `api.registerCli(registrar, opts?)`             | 命令列介面子命令                                                         |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的節點功能命令列介面                                |
| `api.registerService(service)`                  | 背景服務                                                     |
| `api.registerInteractiveHandler(registration)`  | 互動式處理常式                                                    |
| `api.registerAgentToolResultMiddleware(...)`    | 執行階段工具結果中介軟體                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 可附加的記憶體相鄰提示詞區段                                |
| `api.registerMemoryPromptPreparation(prepare)`  | 記憶體相鄰提示詞區段的非同步準備                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | 可附加的記憶體搜尋／讀取語料庫                                     |
| `api.registerHostedMediaResolver(resolver)`     | 瀏覽器式託管媒體 URL 的解析器                           |
| `api.registerMcpServerConnectionResolver(...)`  | 靜態伺服器名稱的逐請求者 MCP 傳輸（`url`/`headers`） |
| `api.registerTextTransforms(transforms)`        | 外掛擁有的提示詞／訊息相容性文字重寫                |
| `api.registerConfigMigration(migrate)`          | 在載入外掛執行階段前執行的輕量設定遷移           |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的匯入器                                        |
| `api.registerAutoEnableProbe(probe)`            | 可自動啟用此外掛的設定探測器                          |
| `api.registerReload(registration)`              | 重新載入處理所用的重新啟動／熱重新載入／無操作設定前綴原則              |
| `api.registerNodeHostCommand(command)`          | 提供給已配對節點的命令處理常式                                |
| `api.registerNodeInvokePolicy(policy)`          | 節點叫用命令的允許清單／核准原則                    |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的發現項目收集器                       |

#### 確認回應後的網路鉤子工作

在處理完成前先確認請求的網路鉤子路由，必須將該分離工作移至其自身受追蹤的准入根節點：

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`網路鉤子分派失敗：${String(error)}`);
});
```

HTTP 請求仍處於已准入狀態時，以同步方式呼叫 `runDetachedWebhookWork(...)`。此輔助函式會立即保留獨立根節點，然後在下一個微任務中啟動回呼，讓請求處理常式可以先寫入確認回應。傳回的 Promise 會採用回呼結果；呼叫端仍須負責處理拒絕。如此可確保確認回應後的佇列工作獲得接受，並讓重新啟動或暫停排空作業等待其完成。若處理常式會等待所有處理完成後才傳回，則不需要此輔助函式。

#### 以請求者為範圍的 MCP 連線

在 `mcp.servers` 或套件組合資訊清單中，保持 MCP 伺服器的**身分**（名稱、工具篩選器）為靜態。可選擇註冊連線解析器，讓每位受信任的訊息請求者各自取得專屬傳輸：

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId 受到主機信任；切勿在此捏造傳送者身分。
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // 本次執行略過此伺服器
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

契約注意事項：

- 解析器內容僅包含受信任的主機身分（`requesterSenderId`、可選的 `agentAccountId`／`messageChannel`）。未來可附加新增其他受信任欄位（例如排程／子代理程式使用者內容）。
- 一個伺服器名稱僅由一個外掛擁有：若另一個外掛針對相同 `serverName` 重複註冊 `registerMcpServerConnectionResolver`，系統會拒絕並產生錯誤診斷（第一次註冊者優先），因此連線擁有權絕不取決於外掛載入順序。
- 工具名稱衍生自完整的已宣告伺服器集合，因此部分解析絕不會導致安全伺服器名稱在不同請求者或輪次間改變。核心不會驗證不同請求者端點是否提供相同的工具結構描述；解析器必須將每位請求者指向相同的邏輯服務，否則工具結構描述（以及提示詞快取穩定性）會因請求者而異。
- 沒有受信任 `requesterSenderId` 的執行（排程、子代理程式、心跳偵測、公用閘道）絕不會具現化以請求者為範圍的伺服器。不存在共用的後援連線。
- 每部伺服器的 `resolve` 上限為 10 秒；逾時或擲回錯誤時，該伺服器會從本次執行中略過，但不會導致靜態 MCP 失敗。
- 每位請求者的已解析連線最多每 5 分鐘重新驗證一次：輪替會使用新的認證資訊重建傳輸，而 `null` 結果則會撤銷連線（即使在工作階段中途，也會處置快取的執行階段）。因此，已撤銷或輪替的認證資訊最多仍可能繼續使用 5 分鐘。
- 已解析的 `headers` 絕不會寫入記錄或持久保存；核心只會保留暫時性的記憶體內鍵控摘要（程序本機 HMAC），以偵測認證資訊輪替，並向記錄／偵錯擷取遮蔽登錄檔註冊已解析標頭／URL 中的認證資訊值。
- 以請求者為範圍的伺服器不會建立 MCP App 檢視：檢視的存續時間超過經請求者驗證的執行，而閘道檢視邊界沒有請求者身分，因此這些伺服器的應用程式預覽會保持封閉失敗。工具結果不受影響。
- 沒有解析器的靜態伺服器會保留現有的工作階段範圍生命週期。
- **執行框架傳遞規則：**以請求者為範圍的伺服器絕不會進入執行框架原生 MCP 用戶端設定（Codex 執行緒 `mcp_servers`、命令列介面 `-c mcp_servers=…` 或任何其他工作階段共用的 MCP 投影）。執行框架會改以執行範圍工具傳遞它們：
  - 內嵌執行器：工作階段 MCP 執行階段 + 套件組合工具（靜態 + 範圍限定）。
  - Codex 應用程式伺服器：透過 `materializeRequesterScopedMcpToolsForHarnessRun` 提供動態工具（僅限範圍限定工具；靜態伺服器仍使用 Codex 的原生 MCP 用戶端）。
- 範圍限定工具的**規格**在該工作階段第一次成功解析後即保持穩定，因此共用執行緒的執行框架（Codex）不會在傳送者變更時輪替執行緒。在任何請求者完成解析前，不會公告任何範圍限定規格。
- 共用執行緒執行框架上的未驗證請求者仍會看到已公告的範圍限定工具；呼叫其中任何工具時，會為該請求者傳回清楚的未連線工具錯誤。OpenClaw 絕不會改用其他請求者的認證資訊。

記憶體提示詞補充建構器會收到可選的 `agentId`、`agentSessionKey` 和 `sandboxed` 內容。記憶體語料庫補充的 `search` 和 `get` 呼叫會收到可選的 `agentId` 和 `sandboxed` 內容。使用代理程式所擁有儲存空間的外掛，應在每次呼叫時解析該儲存空間，而不是在註冊期間擷取單一全域路徑。若多代理程式操作需要代理程式 ID 但未提供，應保持封閉失敗，而不是任意選擇一個代理程式。

當提示詞文字依賴非同步外掛狀態時，請使用 `registerMemoryPromptPreparation(...)`。回呼會在每次完整代理程式提示詞前執行一次，並接收與同步記憶體提示詞建構器相同的工具、代理程式、工作階段和沙箱內容。載入持久化狀態前，先驗證目前的儲存空間擁有者執行個體，然後只傳回本次執行所需的行。OpenClaw 會凍結這些行，並將不可變結果交給同步提示詞組裝程序。持久化、不可分割替換，以及移除擁有者時的刪除作業，應留在所屬外掛內；不要從提示詞建構器輪詢或讀取檔案。

Telegram 互動式處理常式可以傳回 `{ submitText }`，在處理常式成功後，透過 Telegram 的一般入站代理程式路徑路由文字。當入站原則略過文字或處理失敗時，OpenClaw 會保留回呼按鈕，讓使用者可在阻擋條件改變後重試。此結果欄位為 Telegram 專用；其他頻道會保留各自的互動式結果契約。

### 工作流程外掛的主機掛鉤

主機掛鉤是提供給需參與主機生命週期，而不只是新增供應商、頻道或工具之外掛使用的 SDK 接合面。這些是通用契約；規劃模式可以使用，核准工作流程、工作區原則閘門、背景監視器、設定精靈和 UI 輔助外掛也同樣可以使用。

| 方法                                                                               | 其負責的契約                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 由外掛擁有、與 JSON 相容的工作階段狀態，透過閘道工作階段進行投影                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久且恰好一次的內容，注入某個工作階段的下一次代理回合                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | 受資訊清單控管、可信任且在外掛前執行的工具政策，可封鎖或重寫工具參數                                                                        |
| `api.registerToolMetadata(...)`                                                      | 工具目錄顯示中繼資料，不變更工具實作                                                                                     |
| `api.registerCommand(...)`                                                           | 有範圍限制的外掛命令；命令結果可設定 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支援 `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 工作階段、工具、執行、設定或分頁介面的控制介面貢獻描述元                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重設、刪除或重新載入路徑中，用於外掛所擁有執行階段資源的清理回呼                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用於工作流程狀態與監視器的已清理事件訂閱                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次執行的外掛暫存狀態，在終止執行生命週期時清除                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 外掛所擁有排程器工作的清理中繼資料；不會排程工作或建立任務記錄                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 僅限內建外掛，由主機介導，將檔案附件傳送至作用中的直接外送工作階段路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 僅限內建外掛，由排程支援的已排程工作階段回合，以及以標籤為基礎的清理                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 用戶端可透過閘道分派的具型別工作階段動作                                                                                             |

`surface: "tab"` 描述元會在控制介面的側邊欄新增分頁。作用中
外掛的分頁描述元會在閘道 hello（`controlUiTabs`）中公告給儀表板
用戶端，因此只有啟用外掛時才會顯示該分頁。
內建外掛可為其分頁提供第一方儀表板檢視；其他
外掛可將 `path` 設為外掛 HTTP 路由（請參閱
`api.registerHttpRoute(...)`），儀表板會在沙箱框架中呈現該路由。
`icon` 是儀表板圖示名稱提示，`group` 選擇側邊欄區段
（`control` 或 `agent`），`order` 決定外掛分頁之間的排序，而 `requiredScopes`
會對缺少這些操作員範圍的連線隱藏分頁：

若是受閘道保護的外部分頁，請在同一外掛的 `auth: "gateway"`
HTTP 路由下註冊描述元 `path`。完成認證啟動後，瀏覽器會取得
僅限該外掛與路由根目錄、短效且為 HttpOnly 的授權，讓
沙箱框架無須將閘道持有人權杖複製到其 URL
或 JavaScript 中即可載入。外部分頁作用中時，以及在導覽或瀏覽器恢復後掛載該分頁前，
已認證的父頁面會更新此授權。它也會
在掛載前從相同的不透明沙箱探測授權，因此
封鎖 Cookie 的瀏覽器隱私模式會安全地拒絕存取，並顯示無法使用的面板。
框架授權僅接受 `GET` 和 `HEAD`，且一律攜帶
`operator.read`；`requiredScopes` 控制分頁可見性，但絕不擴大
Cookie 授權範圍。變更操作仍須透過明確經閘道認證的父頁面或
持有人介面進行。外部分頁需要 HTTPS/Tailscale Serve 或
瀏覽器信任的回送來源；區域網路主機上的純 HTTP 會顯示
安全內容錯誤，而不會掛載無法認證的面板。
完全封鎖第三方 Cookie 也會讓受閘道保護的分頁無法使用。
如同所有原生外掛介面，框架仍位於已安裝
外掛的信任邊界內；OpenClaw 不會將已安裝的外掛視為彼此
隔離的瀏覽器安全主體。
Cookie 授權使用瀏覽器的主機名稱邊界，而非連接埠邊界。請勿
在閘道主機名稱上共同託管彼此不信任的服務，即使使用不同
連接埠亦然。
由外掛管理認證的分頁會保留其直接 iframe 行為，且不會
要求或需要此閘道授權。

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "日誌",
  description: "以螢幕快照建構，將你的一天呈現為時間軸。",
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

對等的扁平方法仍可作為現有外掛已棄用的相容性
別名使用。請勿新增直接呼叫
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的外掛程式碼。

`scheduleSessionTurn(...)` 是建構於閘道
排程器之上的工作階段範圍便利功能。排程負責計時，並在
回合執行時建立背景任務記錄；外掛 SDK 僅限制目標工作階段、外掛所擁有的
命名與清理。若工作本身需要持久的多步驟 Task Flow 狀態，請在已排程
回合中使用 `api.runtime.tasks.managedFlows`。

這些契約刻意分割權限：

- 外部外掛可擁有工作階段擴充功能、介面描述元、命令、工具
  中繼資料、下一回合注入和一般掛鉤。
- 可信任工具政策會在一般 `before_tool_call` 掛鉤之前執行，並受
  主機信任。內建政策最先執行；已安裝外掛的政策必須
  明確啟用，並將其本機 ID 列於
  `contracts.trustedToolPolicies` 中，接著依外掛載入順序執行。政策 ID
  的範圍限於註冊該政策的外掛。
- 保留命令的擁有權僅限內建外掛。外部外掛應使用自己的
  命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示詞的掛鉤，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`
  和 `enqueueNextTurnInjection`。

非 Plan 使用者範例：

| 外掛原型             | 使用的掛鉤                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程            | 工作階段擴充功能、命令接續、下一回合注入、介面描述元                                                            |
| 預算／工作區政策閘門 | 可信任工具政策、工具中繼資料、工作階段投影                                                                                 |
| 背景生命週期監視器 | 執行階段生命週期清理、代理事件訂閱、工作階段排程器擁有權／清理、心跳偵測提示詞貢獻、介面描述元 |
| 設定或新手引導精靈   | 工作階段擴充功能、有範圍限制的命令、控制介面描述元                                                                              |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使外掛嘗試指派
  更狹窄的閘道方法範圍亦然。外掛擁有的方法應優先使用
  外掛專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建外掛，以及已明確啟用且具有相符
  資訊清單契約的已安裝外掛，可在需要於工具執行後、執行階段
  將結果傳回模型前重寫工具結果時，使用 `api.registerAgentToolResultMiddleware(...)`。
  這是適用於 tokenjuice 等非同步輸出歸納器、受信任且不依賴執行階段的
  接合點。

外掛必須為每個目標
執行階段宣告 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。沒有該
契約或未明確啟用的已安裝外掛無法註冊此中介軟體；對於不需要在模型前處理工具結果
時機的工作，請繼續使用一般 OpenClaw 外掛掛鉤。舊有
僅限內嵌執行器的擴充工廠註冊路徑已移除。
</Accordion>

### 閘道探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓外掛透過 mDNS/Bonjour 等本機探索傳輸方式，
公告作用中的閘道。啟用本機探索時，OpenClaw 會在
閘道啟動期間呼叫該服務、傳入目前的閘道連接埠與非機密 TXT 提示資料，
並在閘道關閉期間呼叫傳回的
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

閘道探索外掛不得將公告的 TXT 值視為機密或
認證。探索僅是路由提示；信任仍由閘道認證和 TLS 固定
負責。

### 命令列介面註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：註冊者擁有的明確命令名稱
- `descriptors`：用於命令列介面說明、
  路由和延遲外掛命令列介面註冊的剖析階段命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於配對節點功能，優先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝函式，可將
`openclaw nodes canvas` 等命令明確定義為外掛擁有的節點功能。

若要讓外掛命令在一般根命令列介面路徑中維持延遲載入，
請提供涵蓋該註冊者所公開之每個頂層命令根的 `descriptors`。

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

巢狀命令會接收解析後的父命令作為 `program`：

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
該立即載入的相容性路徑仍受支援，但不會安裝
由描述元支援、可於剖析期間延遲載入的預留位置。

### 命令列介面後端註冊

`api.registerCliBackend(...)` 可讓外掛擁有本機
AI 命令列介面後端的預設設定，例如 `claude-cli` 或 `my-cli`。

- 後端 `id` 會成為模型參照中的供應商前綴，例如 `my-cli/gpt-5`。
- 後端 `config` 是具權威性的命令配接器：argv、環境、
  剖析器、工作階段、影像及可靠性行為都位於外掛程式碼中。
- 使用者透過模型參照或模型範圍的 `agentRuntime.id` 選取後端；
  `openclaw.json` 不會重寫配接器。
- 當已註冊的靜態欄位需要可感知執行階段的
  正規化流程時，請使用 `normalizeConfig`。
- 對於屬於命令列介面方言的請求範圍 argv 重寫，請使用 `resolveExecutionArgs`，
  例如將 OpenClaw 的思考層級對應至原生的 effort
  旗標。此鉤子會接收 `ctx.executionMode`；請使用 `"side-question"`，為暫時性的
  `/btw` 呼叫新增後端原生的隔離旗標。若這些旗標
  能可靠地停用原本一律啟用的命令列介面之原生工具，也請宣告
  `sideQuestionToolMode: "disabled"`。
- 對於後端擁有的啟動環境或暫時性
  驗證／設定橋接，請使用 `prepareExecution`。其 `ctx.contextTokenBudget` 是該次執行
  所選取的有效權杖限制，因此原生壓縮後端可以對齊自己的
  閾值，而不需要供應商特定的核心分支。
- 能針對特定執行停用所有原生工具的後端，可以宣告
  `nativeToolMode: "selectable"`。受限制的呼叫會傳入精確的
  `ctx.toolAvailability.native` 清單，以及精確且與主機隔離的 MCP 允許清單；
  `resolveExecutionArgs` 必須在最終的全新或恢復 argv 上強制執行兩者。
  若要接受執行階段上限（例如排程 `toolsAllow`），後端也必須
  實作 `resolveRuntimeToolAvailability`；若後端無法轉譯或強制執行 MCP
  上限，OpenClaw 會停用所有原生工具並採取失敗即關閉策略。

如需端對端的編寫指南，請參閱
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。

### 獨佔插槽

| 方法                                     | 註冊內容                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次僅能啟用一個）。當主機可提供模型／供應商／模式診斷資訊時，生命週期回呼會接收 `runtimeSettings`；較舊的嚴格引擎會在不含該鍵的情況下重試。 |
| `api.registerMemoryCapability(capability)` | 統一記憶能力                                                                                                                                                                          |

### 已棄用的記憶嵌入配接器

| 方法                                         | 註冊內容                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中外掛的記憶嵌入配接器 |

- `registerMemoryCapability` 是獨佔的記憶外掛 API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  供主機管理匯出。列舉這些已宣告成品的搭配外掛仍會使用保留的
  `openclaw/plugin-sdk/memory-host-core` 外觀所提供的 `listActiveMemoryPublicArtifacts(...)`，
  直到出現專用的公開消費端 API；它們不得深入存取其他外掛的私有配置。
- `MemoryFlushPlan.model` 可將排清回合固定至精確的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的備援鏈。
- `registerMemoryEmbeddingProvider` 已棄用。新的嵌入供應商
  應使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 現有的記憶專用供應商在遷移期間仍可運作，
  但外掛檢查會將非內建外掛的這種情況回報為相容性技術債。

### 事件與生命週期

| 方法                                       | 功能                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期鉤子          |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼 |

如需範例、常用鉤子名稱及防護語意，請參閱[外掛鉤子](/zh-TW/plugins/hooks)。

### 鉤子決策語意

`before_install` 是外掛執行階段的生命週期鉤子，而不是操作者的安裝
政策介面。當允許／封鎖決策必須涵蓋命令列介面與由閘道支援的安裝或更新路徑時，
請使用 `security.installPolicy`。

- `before_tool_call`：傳回 `{ block: true }` 即為終止決策。任何處理常式一旦設定此值，就會略過較低優先順序的處理常式。
- `before_tool_call`：傳回 `{ block: false }` 會視為未做決策（等同省略 `block`），而不是覆寫。
- `before_install`：傳回 `{ block: true }` 即為終止決策。任何處理常式一旦設定此值，就會略過較低優先順序的處理常式。
- `before_install`：傳回 `{ block: false }` 會視為未做決策（等同省略 `block`），而不是覆寫。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 即為終止決策。任何處理常式一旦接管分派，就會略過較低優先順序的處理常式及預設模型分派路徑。
- `message_sending`：傳回 `{ cancel: true }` 即為終止決策。任何處理常式一旦設定此值，就會略過較低優先順序的處理常式。
- `message_sending`：傳回 `{ cancel: false }` 會視為未做決策（等同省略 `cancel`），而不是覆寫。
- `message_received`：需要路由傳入的討論串／主題時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給頻道特有的額外資訊。
- `message_sending`：請先使用型別化的 `replyToId`／`threadId` 路由欄位，再退回使用頻道特有的 `metadata`。
- `gateway_start`：對於閘道擁有的啟動狀態，請使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而不要依賴內部的 `gateway:startup` 鉤子。此時排程可能仍在載入。
- `cron_reconciled`：在啟動或排程器重新載入後，重建完整的外部排程投影。它包含 `reason` 和有效的 `enabled` 狀態（包括 `enabled: false`），而 `ctx.getCron?.()` 則傳回精確且已協調的排程器。請將 `ctx.abortSignal` 傳入持久投影工作；當該排程器快照被取代或閘道關閉時，它會中止。
- `cron_changed`：觀察由閘道擁有的排程生命週期變更。`scheduled` 和 `removed` 事件是提交後的協調提示，而不是有序的差異記錄。若工作沒有下一次喚醒，已排程事件的 `event.nextRunAtMs` 會缺省；移除事件仍會攜帶已刪除工作的快照。

外部喚醒排程器應對 `cron_changed` 事件進行防彈跳或合併，
然後從 `cron_reconciled` 最後擷取的排程器重新讀取完整的持久檢視。
不要採用 `cron_changed` 上下文中的排程器：來自較舊排程器的
分離提示可能會與後續的重新載入重疊。

請使用 `cron_reconciled`，作為在閘道啟動或排程器替換時載入持久狀態的
完整快照觸發條件。僅重新熱載入外掛時不會重播此條件。
觀察處理常式會平行執行，而即發即忘的分派可能重疊，因此消費端
不得依賴事件完成順序。請讓 OpenClaw 繼續作為到期檢查與執行的事實來源。

如需具備持久替換、重試／退避及正常關閉功能的單次執行配接器，請參閱
[安全的外部排程投影](/zh-TW/plugins/hooks#safe-external-cron-projection)。

### API 物件欄位

| 欄位                    | 類型                      | 說明                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 外掛 ID                                                                                   |
| `api.name`               | `string`                  | 顯示名稱                                                                                |
| `api.version`            | `string?`                 | 外掛版本（選用）                                                                   |
| `api.description`        | `string?`                 | 外掛說明（選用）                                                               |
| `api.source`             | `string`                  | 外掛來源路徑                                                                          |
| `api.rootDir`            | `string?`                 | 外掛根目錄（選用）                                                            |
| `api.config`             | `OpenClawConfig`          | 目前的設定快照（若可用，則為作用中的記憶體內執行階段快照）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的外掛特定設定                                   |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 有範圍的記錄器（`debug`、`info`、`warn`、`error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前的載入模式；`"setup-runtime"` 是完整進入點啟動前的輕量啟動／設定時段 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於外掛根目錄的路徑                                                        |

## 內部模組慣例

在你的外掛內，請使用本機桶狀檔案進行內部匯入：

```text
my-plugin/
  api.ts            # 提供給外部消費端的公開匯出
  runtime-api.ts    # 僅供內部使用的執行階段匯出
  index.ts          # 外掛進入點
  setup-entry.ts    # 僅供設定使用的輕量進入點（選用）
```

<Warning>
  切勿在正式環境程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的外掛。內部匯入應透過 `./api.ts` 或
  `./runtime-api.ts`。SDK 路徑僅供外部合約使用。
</Warning>

透過外觀載入的內建外掛公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入點檔案）在 OpenClaw 已執行時，優先使用
作用中的執行階段設定快照。如果尚無執行階段
快照，則會回退至磁碟上已解析的設定檔。
封裝後的內建外掛外觀應透過 OpenClaw 的外掛
外觀載入器載入；直接從 `dist/extensions/...` 匯入會略過封裝安裝用於外掛所擁有程式碼的資訊清單
與執行階段附屬檔案檢查。

當輔助程式是刻意針對特定提供者，且尚不適合放入通用 SDK
子路徑時，提供者外掛可以公開範圍有限的外掛本機合約匯出入口。
內建範例：

- **Anthropic**：供 Claude
  Beta 標頭與 `service_tier` 串流輔助程式使用的公開 `api.ts` / `contract-api.ts` 介面。
- **`@openclaw/openai-provider`**：`api.ts` 會匯出提供者建構器、
  預設模型輔助程式與即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 會匯出提供者建構器
  以及新手引導／設定輔助程式。

<Warning>
  擴充功能的正式環境程式碼也應避免從 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果某個輔助程式確實共用，請將其提升至中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  以功能為導向的介面，而非將兩個外掛耦合在一起。
</Warning>

## 相關內容

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 與 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助程式" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、資訊清單與設定結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試公用程式與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已淘汰的介面遷移。
  </Card>
  <Card title="外掛內部機制" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與功能模型。
  </Card>
</CardGroup>
