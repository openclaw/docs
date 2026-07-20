---
read_when:
    - 實作供應商執行階段掛鉤、頻道生命週期或套件包
    - 偵錯外掛載入順序或登錄狀態
    - 新增外掛功能或內容引擎外掛
summary: 外掛架構內部機制：載入流水線、登錄檔、執行階段鉤子、HTTP 路由與參照表
title: 外掛架構內部機制
x-i18n:
    generated_at: "2026-07-20T00:50:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3059dc789b8c6294f5c0305167435359cebe0b19202c496f7230eb966cf8d153
    source_path: plugins/architecture-internals.md
    workflow: 16
---

關於公開能力模型、外掛形態，以及擁有權／執行
合約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋
內部機制：載入流水線、登錄檔、執行階段掛鉤、閘道 HTTP
路由、匯入路徑及結構描述表格。

## 載入流水線

啟動時，OpenClaw 大致會執行以下作業：

1. 探索候選外掛根目錄
2. 讀取原生或相容的套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定是否啟用各候選項目
6. 載入已啟用的原生模組：建置完成的內建套件組合模組使用原生載入器；
   第三方本機原始碼 TypeScript 使用緊急 Jiti 備援方案
7. 呼叫原生 `register(api)` 掛鉤，並將註冊項目收集至外掛登錄檔
8. 向命令／執行階段介面公開登錄檔

安全閘門會在執行階段執行**之前**運作。遇到以下情況時，探索程序會封鎖候選項目：

- 其解析後的進入點逸出外掛根目錄
- 其路徑（或根目錄）可由所有人寫入
- 對於非內建外掛，路徑擁有權與目前的 uid（或 root）不符

對可由所有人寫入的內建目錄，閘門會先嘗試就地進行 `chmod` 修復
（npm／全域安裝可能會以 `0777` 提供套件目錄），然後再
重新檢查；對於內建來源，則會完全略過擁有權檢查。

若已知遭封鎖候選項目的外掛 id，發出的診斷仍會包含該 id
（包括從原本會遭拒絕之目錄內的資訊清單解析出的 id），因此參照該 id 的設定會顯示
與路徑安全警告相關聯的已封鎖外掛，而不是無關的「未知外掛」
錯誤。

### 資訊清單優先行為

資訊清單是控制平面的事實來源。OpenClaw 使用它來：

- 識別外掛
- 探索宣告的頻道／Skills／設定結構描述或套件組合能力
- 驗證 `plugins.entries.<id>.config`
- 補充控制介面的標籤／預留位置
- 顯示安裝／目錄中繼資料
- 保留低成本的啟用與設定描述元，而不載入外掛執行階段

對於原生外掛，執行階段模組是資料平面的部分。它會註冊
掛鉤、工具、命令或供應商流程等實際行為。

選用的資訊清單 `activation` 與 `setup` 區塊會保留在控制平面。
它們只是用於啟用規劃與設定探索的中繼資料描述元；
不能取代執行階段註冊、`register(...)` 或 `setupEntry`。
即時啟用取用者會使用資訊清單中的命令、頻道及供應商提示，
在進行更廣泛的登錄檔具現化之前縮小外掛載入範圍：

- 命令列介面載入會縮小至擁有所要求主要命令的外掛
- 頻道設定／外掛解析會縮小至擁有所要求
  頻道 id 的外掛
- 明確的供應商設定／執行階段解析會縮小至擁有所要求
  供應商 id 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動
  匯入；沒有啟動中繼資料的外掛僅透過範圍更窄的
  啟用觸發條件載入

啟用規劃器同時為既有呼叫端提供僅含 id 的 API，並提供用於診斷的
計畫 API。計畫項目會回報選取外掛的原因，
並區分明確的 `activation.*` 提示與資訊清單擁有權備援：

| 原因（來自 `activation.*` 提示）   | 原因（來自資訊清單擁有權）                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                        |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                  |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                            |
| —（掛鉤觸發條件沒有提示變體） | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

這種原因劃分是相容性邊界：既有外掛中繼資料
會繼續運作，而新程式碼可偵測廣泛提示或備援行為，
且無須變更執行階段載入語意。

若要求廣泛 `all` 範圍，請求時的執行階段預先載入仍會根據設定、啟動規劃、已設定的
頻道、插槽及自動啟用規則，推導出明確且實際生效的外掛 id 集合
（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。如果
推導出的集合為空，OpenClaw 會保持範圍為空，而不會將其擴大至
每個可探索的外掛。

設定探索會優先使用描述元擁有的 id，例如 `setup.providers` 與
`setup.cliBackends`，以便在退回
`setup-api` 之前縮小候選外掛範圍；後者供仍需要設定階段執行階段掛鉤的外掛使用。供應商
設定清單會使用資訊清單 `providerAuthChoices`、從描述元推導出的設定
選項，以及安裝目錄中繼資料，而不載入供應商執行階段。明確的
`setup.requiresRuntime: false` 是僅限描述元的截止點；省略
`requiresRuntime` 時，會保留舊版 setup-api 備援以維持相容性。如果
多個探索到的外掛宣稱擁有相同的正規化設定供應商或
命令列介面後端 id，設定查詢會拒絕模稜兩可的擁有者，而不依賴
探索順序。當設定執行階段確實執行時，登錄檔診斷會回報
`setup.providers`／`setup.cliBackends` 與 setup-api 實際註冊的供應商或命令列介面
後端之間的偏差，但不會封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會以實際時間視窗為依據，快取外掛探索結果或直接資訊清單登錄檔
資料。安裝、資訊清單編輯及載入路徑變更
必須在下一次明確讀取中繼資料或重建快照時顯示。
資訊清單檔案剖析器會保留有界的檔案簽章快取，其鍵值由
開啟的資訊清單路徑加上裝置／inode、大小及 mtime／ctime 組成；該快取只會
避免重新剖析未變更的位元組，不得快取探索、登錄檔、
擁有者或政策的答案。

安全的中繼資料快速路徑是明確的物件擁有權，而不是隱藏快取。
閘道啟動熱路徑應在呼叫鏈中傳遞目前的 `PluginMetadataSnapshot`、
推導出的 `PluginLookUpTable`，或明確的資訊清單登錄檔。
只要這些物件代表目前的設定與
外掛清單，設定驗證、啟動時自動啟用、外掛啟動程序及供應商
選取就可以重複使用它們。除非特定設定路徑收到明確的資訊清單登錄檔，
否則設定查詢仍會視需要重建資訊清單中繼資料；請將此
保留為冷路徑備援，而不是新增隱藏的查詢快取。輸入
變更時，應重建並取代快照，而不是改動快照或
保留歷史副本。應根據目前的
登錄檔／根目錄，重新計算有效外掛登錄檔的檢視及內建
頻道啟動輔助程式。在單次呼叫內使用短期映射來去除重複工作或
防止重新進入並無問題；但它們不得成為程序中繼資料快取。

對於外掛載入，持久快取層是執行階段載入。當程式碼或已安裝成品
確實載入時，它可以重複使用載入器狀態，例如：

- `PluginLoaderCacheState` 及相容的有效執行階段登錄檔
- jiti／模組快取及公開介面載入器快取，用於避免重複匯入
  相同的執行階段介面
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複項目解析的短期個別呼叫映射

這些快取是資料平面的實作細節。它們不得回答
「哪個外掛擁有此供應商？」之類的控制平面問題，除非
呼叫端刻意要求載入執行階段。

請勿為以下項目新增持久或實際時間快取：

- 探索結果
- 直接資訊清單登錄檔
- 從已安裝外掛索引重建的資訊清單登錄檔
- 供應商擁有者查詢、模型抑制、供應商政策或公開成品
  中繼資料
- 任何其他從資訊清單推導出的答案，且變更後的資訊清單、已安裝索引
  或載入路徑應在下一次讀取中繼資料時顯示

從持久化的已安裝外掛
索引重建資訊清單中繼資料的呼叫端，會視需要重建該登錄檔。已安裝索引是持久的
來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄檔模型

載入的外掛不會直接改動任意的核心全域變數。它們會註冊至
中央外掛登錄檔（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），
該登錄檔會追蹤外掛記錄（身分、來源、來源類型、狀態、診斷），
以及每項能力的陣列：工具、舊版掛鉤與具型別掛鉤、
頻道、供應商、閘道 RPC 處理常式、HTTP 路由、命令列介面註冊器、
背景服務、外掛擁有的命令，以及數十種其他具型別的供應商
類別（語音、嵌入、影像／影片／音樂生成、網頁
擷取／搜尋、代理程式框架、工作階段動作等）。

接著，核心功能會從該登錄檔讀取資料，而不是直接與外掛
模組溝通。這讓載入保持單向：

- 外掛模組 -> 登錄檔註冊
- 核心執行階段 -> 登錄檔取用

這種分離對可維護性很重要。這表示大多數核心介面只
需要一個整合點：「讀取登錄檔」，而不是「為每個
外掛模組提供特殊處理」。

## 對話繫結回呼

繫結對話的外掛可以在核准處理完成時作出反應。

使用 `api.onConversationBindingResolved(...)`，可在繫結
要求獲得核准或遭拒後接收回呼：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此外掛與對話目前已有繫結。
        console.log(event.binding?.conversationId);
        return;
      }

      // 要求遭拒；清除所有本機待處理狀態。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回呼承載資料欄位：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的已解析繫結
- `request`：原始要求摘要、卸離提示、傳送者 id 及
  對話中繼資料

此回呼僅用於通知。它不會變更誰有權繫結
對話，且會在核心核准處理完成後執行。

## 供應商執行階段掛鉤

供應商外掛分為三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查詢：
  `setup.providers[].envVars`、`providerAuthAliases`、`providerAuthChoices`
  及 `channelConfigs`。
- **設定階段掛鉤**：`catalog` 加上 `applyConfigDefaults`。
- **執行階段掛鉤**：40+ 個選用掛鉤，涵蓋驗證、模型解析、
  串流包裝、思考層級、重播政策及用量端點。請參閱
  [掛鉤順序與用法](#hook-order-and-usage)。

OpenClaw 仍負責通用代理程式迴圈、容錯移轉、對話記錄處理與
工具政策。這些鉤子是供應商特定行為的擴充介面，
不需要整套自訂推論傳輸機制。

當供應商具有以環境變數為基礎的認證資訊，且通用驗證／狀態／模型選擇器路徑應在
不載入外掛執行階段的情況下查看這些資訊時，請使用資訊清單 `setup.providers[].envVars`。
當某個供應商 ID 應重用另一個供應商 ID 的環境變數、驗證設定檔、
由設定支援的驗證，以及 API 金鑰的新手引導選項時，請使用資訊清單
`providerAuthAliases`。當新手引導／驗證選擇的命令列介面
需要在不載入供應商執行階段的情況下，得知供應商的選項 ID、群組標籤，
以及簡單的單一旗標驗證接線時，請使用資訊清單
`providerAuthChoices`。供應商執行階段的
`envVars` 應保留用於面向操作人員的提示，例如新手引導標籤或 OAuth
用戶端 ID／用戶端密鑰設定變數。

請透過所屬的 `channelConfigs.<id>.schema` 與設定描述元，
描述由環境變數驅動的頻道設定與驗證。

### 鉤子順序與用法

對於模型／供應商外掛，OpenClaw 會大致依照以下順序呼叫鉤子。
「使用時機」欄是快速決策指南。
OpenClaw 已不再呼叫、僅供相容性使用的供應商欄位，例如
`ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，因此刻意不在此處
列出。

| 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布至 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型家族語意                                                                         |
| _(內建模型查詢)_         | OpenClaw 會先嘗試一般的登錄檔／目錄路徑                                                          | _(不是外掛鉤子)_                                                                                                                         |
| `normalizeModelId`                | 在查詢前正規化舊版或預覽模型 ID 別名                                                     | 提供者負責在解析標準模型前清理別名                                                                                 |
| `normalizeTransport`              | 在通用模型組裝前正規化提供者家族的 `api` / `baseUrl`                                      | 提供者負責清理相同傳輸家族中自訂提供者 ID 的傳輸設定                                                          |
| `normalizeConfig`                 | 在執行階段／提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要應置於外掛中的設定清理；內建的 Google 家族輔助工具也會為支援的 Google 設定項目提供後備處理   |
| `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者公開各自的環境標記 API 金鑰解析鉤子                                                                                |
| `resolveSyntheticAuth`            | 在不保存純文字的情況下，呈現本機／自行託管或設定支援的驗證                                   | 提供者可使用合成／本機認證資訊標記運作                                                                                 |
| `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；對命令列介面／應用程式擁有的認證資訊，預設 `persistence` 為 `runtime-only` | 提供者重複使用外部驗證認證資訊，而不保存複製的重新整理權杖；請在資訊清單中宣告 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 降低由環境／設定支援的驗證背後所儲存之合成設定檔預留位置的優先順序                                      | 提供者儲存不應取得較高優先順序的合成預留位置設定檔                                                                 |
| `resolveDynamicModel`             | 對尚未出現在本機登錄檔中的提供者擁有模型 ID 進行同步後備處理                                       | 提供者接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 非同步預熱，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| `normalizeResolvedModel`          | 在內嵌執行器使用已解析模型前進行最終重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| `normalizeToolSchemas`            | 在內嵌執行器看到工具結構描述前將其正規化                                                    | 提供者需要傳輸家族的結構描述清理                                                                                                |
| `inspectToolSchemas`              | 在正規化後呈現提供者擁有的結構描述診斷資訊                                                  | 提供者希望提供關鍵字警告，而不在核心中加入提供者特定規則                                                                 |
| `resolveReasoningOutputMode`      | 選取原生或標記式推理輸出合約                                                              | 提供者需要標記式推理／最終輸出，而非原生欄位                                                                         |
| `prepareExtraParams`              | 在通用串流選項包裝函式前進行請求參數正規化                                              | 提供者需要預設請求參數或個別提供者的參數清理                                                                           |
| `createStreamFn`                  | 以自訂傳輸完全取代一般串流路徑                                                   | 提供者需要自訂線路通訊協定，而不只是包裝函式                                                                                     |
| `wrapStreamFn`                    | 套用通用包裝函式後的串流包裝函式                                                              | 提供者需要請求標頭／本文／模型相容性包裝函式，但不需要自訂傳輸                                                          |
| `resolveTransportTurnState`       | 附加原生的每回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸傳送提供者原生的回合身分資訊                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻策略                                                    | 提供者希望通用 WS 傳輸能調整工作階段標頭或後備策略                                                               |
| `formatApiKey`                    | 驗證設定檔格式化工具：將儲存的設定檔轉換為執行階段的 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖格式                                                                    |
| `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗策略覆寫 OAuth 重新整理                                  | 提供者不適用共用的 OpenClaw 重新整理器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加修復提示                                                                  | 提供者需要在重新整理失敗後提供由提供者擁有的驗證修復指引                                                                      |
| `matchesContextOverflowError`     | 提供者擁有的內容視窗溢位比對器                                                                 | 提供者具有通用啟發法無法識別的原始溢位錯誤                                                                                |
| `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API／傳輸錯誤對應至速率限制／過載等                                                                          |
| `isCacheTtlEligible`              | 適用於代理／回程提供者的提示詞快取策略                                                               | 提供者需要代理特定的快取 TTL 閘控                                                                                                |
| `buildMissingAuthMessage`         | 取代通用的缺少驗證復原訊息                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| `augmentModelCatalog`             | 在探索後附加合成／最終目錄資料列（已淘汰，請見下文）                                  | 提供者需要在 `models list` 和選擇器中加入合成的向前相容資料列                                                                     |
| `resolveThinkingProfile`          | 模型特定的 `/think` 層級集、顯示標籤與預設值                                                 | 提供者針對所選模型公開自訂思考階梯或二元標籤                                                                 |
| `isBinaryThinking`                | 開啟／關閉推理切換相容性鉤子                                                                     | 提供者僅公開二元的思考開啟／關閉                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 提供者只希望在模型子集上啟用 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性鉤子                                                                      | 提供者負責模型家族的預設 `/think` 策略                                                                                      |
| `isModernModelRef`                | 用於即時設定檔篩選器與冒煙測試選擇的現代模型比對器                                              | 提供者負責即時／冒煙測試偏好模型的比對                                                                                             |
| `prepareRuntimeAuth`              | 在推論前一刻，將已設定的認證資訊交換為實際執行階段權杖／金鑰                       | 提供者需要權杖交換或短效請求認證資訊                                                                             |
| `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的用量／計費認證資訊                                     | 提供者需要自訂用量／配額權杖剖析，或不同的用量認證資訊                                                               |
| `fetchUsageSnapshot`              | 在解析驗證後，擷取並正規化提供者特定的用量／配額快照                             | 提供者需要提供者特定的用量端點或承載資料剖析器                                                                           |
| `createEmbeddingProvider`         | 為記憶／搜尋建置由供應商擁有的嵌入轉接器                                                     | 記憶嵌入行為應由供應商外掛負責                                                                                    |
| `buildReplayPolicy`               | 傳回控制供應商逐字記錄處理方式的重播政策                                        | 供應商需要自訂逐字記錄政策（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在通用逐字記錄清理後重寫重播歷程                                                        | 除了共用壓縮輔助工具外，供應商還需要供應商專屬的重播重寫                                                             |
| `validateReplayTurns`             | 在嵌入式執行器執行前，對最終重播輪次進行驗證或重塑                                           | 供應商傳輸在通用清理後需要更嚴格的輪次驗證                                                                    |
| `onModelSelected`                 | 執行由供應商擁有的選取後副作用                                                                 | 模型啟用時，供應商需要遙測或由供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的提供者外掛，接著依序嘗試其他支援鉤子的提供者外掛，直到其中一個實際變更模型 ID 或傳輸／設定為止。如此可讓別名／相容性提供者接合層持續運作，而不必要求呼叫端知道由哪個隨附外掛負責改寫。若沒有提供者鉤子改寫支援的 Google 系列設定項目，隨附的 Google 設定正規化器仍會套用該相容性清理。

如果提供者需要完全自訂的線路通訊協定或自訂要求執行器，則屬於另一類擴充功能。這些鉤子適用於仍在 OpenClaw 一般推論迴圈中執行的提供者行為。

`resolveUsageAuth` 會決定 OpenClaw 應呼叫 `fetchUsageSnapshot`，還是針對用量／狀態介面退回通用認證資訊解析。當提供者具有用量認證資訊時，傳回 `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用的方案中繼資料會流入 `fetchUsageSnapshot`）；當提供者擁有的用量驗證已處理要求，且必須抑制通用 API 金鑰／OAuth 後援時，傳回 `{ handled: true }`；當提供者未處理用量驗證時，則傳回 `null` 或 `undefined`。

請在資訊清單 `providerUsageAuthEnvVars` 中宣告組織或帳務認證資訊。如此可讓通用探索與秘密清除介面辨識這些資訊，而不會將其視為推論驗證候選項目。

### 提供者範例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 內建範例

隨附的提供者外掛會組合上述鉤子，以配合各廠商的目錄、驗證、思考、重播及用量需求。權威鉤子集合位於 `extensions/` 下的各外掛中；本頁旨在說明其形式，而非複製該清單。

<AccordionGroup>
  <Accordion title="直通式目錄提供者">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog`，以及
    `resolveDynamicModel`／`prepareDynamicModel`，以便在 OpenClaw 的靜態目錄之前呈現上游
    模型 ID。
  </Accordion>
  <Accordion title="OAuth 與用量端點提供者">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth`＋
    `fetchUsageSnapshot` 搭配使用，以自行負責權杖交換與 `/usage` 整合。
  </Accordion>
  <Accordion title="重播與逐字稿清理系列">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）可讓提供者透過
    `buildReplayPolicy` 選用逐字稿政策，而不必由各外掛重新實作清理功能。
  </Accordion>
  <Accordion title="僅目錄提供者">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 僅註冊 `catalog`，並使用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助工具">
    Beta 標頭、`/fast`／`serviceTier` 和 `context1m` 位於
    Anthropic 外掛的公開 `api.ts`／`contract-api.ts` 接合介面
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）內，而非
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

外掛可透過 `api.runtime` 存取特定核心輔助工具。以 TTS 為例：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

注意事項：

- `textToSpeech` 會傳回適用於檔案／語音留言介面的標準核心 TTS 輸出承載資料。
- 使用核心 `messages.tts` 設定與提供者選擇。
- 傳回 PCM 音訊緩衝區＋取樣率。外掛必須針對提供者重新取樣／編碼。
- `listVoices` 對各提供者而言皆為選用。可將其用於廠商擁有的語音選擇器或設定流程。
- 核心會將解析後的要求期限傳給提供者的 `listVoices` 鉤子；提供者專屬的逾時設定可以覆寫該期限。
- 語音清單可包含更豐富的中繼資料，例如地區設定、性別及個性標籤，以供可感知提供者的選擇器使用。
- 目前 OpenAI 和 ElevenLabs 支援電話語音。Microsoft 不支援。

外掛也可透過 `api.registerSpeechProvider(...)` 註冊語音提供者。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

注意事項：

- 將 TTS 政策、後援及回覆傳遞保留在核心中。
- 使用語音提供者處理由廠商擁有的語音合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 提供者 ID。
- 建議的擁有權模型以公司為導向：隨著 OpenClaw 新增這些能力合約，一個廠商外掛可同時擁有
  文字、語音、影像及未來的媒體提供者。

對於影像／音訊／影片理解，外掛會註冊一個具型別的媒體理解提供者，而非通用的鍵／值集合：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意事項：

- 將協調、後援、設定及頻道接線保留在核心中。
- 將廠商行為保留在提供者外掛中。
- 附加式擴充應維持具型別：新增選用方法、新增選用
  結果欄位、新增選用能力。
- 影片生成已遵循相同模式：
  - 核心擁有能力合約與執行階段輔助工具
  - 廠商外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能／頻道外掛使用 `api.runtime.videoGeneration.*`

若要使用媒體理解執行階段輔助工具，外掛可呼叫：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

針對音訊轉錄，外掛可使用媒體理解執行階段或較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是影像／音訊／影片理解的建議共用介面。
- `extractStructuredWithModel(...)` 是供外掛使用的接合介面，用於有界限且由提供者擁有、以影像為優先的擷取。請至少包含一個影像輸入；
  文字輸入是補充情境。產品外掛擁有其路由與
  結構描述，而 OpenClaw 擁有提供者／執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）及提供者後援順序。
- 未產生轉錄輸出時（例如略過／不支援的輸入），傳回 `{ text: undefined }`。

外掛也可透過 `api.runtime.subagent` 啟動背景子代理程式執行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  toolsAlsoAllow: ["my_plugin_progress"],
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意事項：

- `provider` 和 `model` 是每次執行的選用覆寫，而非永久工作階段變更。
- `toolsAlsoAllow` 接受由呼叫外掛註冊、名稱完全相符且具有唯一擁有者的工具。核心工具名稱及有歧義的名稱會遭拒絕。它會附加到一般設定檔，但操作者允許清單與拒絕規則仍具有最終決定權。
- OpenClaw 僅會為受信任的呼叫端採用這些覆寫欄位。
- 對於外掛擁有的後援執行，操作者必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任外掛的子代理程式執行仍可運作，但覆寫要求會遭拒絕，而不會無提示地退回後援行為。
- 外掛建立的子代理程式工作階段會以建立該工作階段的外掛 ID 標記。後援 `api.runtime.subagent.deleteSession(...)` 只能刪除這些由其擁有的工作階段；刪除任意工作階段仍需要具管理員範圍的閘道要求。

對於網頁搜尋，外掛可使用共用執行階段輔助工具，而不必深入代理程式工具接線：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

外掛也可透過
`api.registerWebSearchProvider(...)` 註冊網頁搜尋提供者。

注意事項：

- 將提供者選擇、認證資訊解析及共用要求語意保留在核心中。
- 使用網頁搜尋提供者處理廠商專屬的搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為但不希望依賴代理程式工具包裝器的功能／頻道外掛所適用的建議共用介面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "一隻友善的龍蝦吉祥物", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已設定的影像生成供應商鏈生成影像。
- `listProviders(...)`：列出可用的影像生成供應商及其功能。

## 閘道 HTTP 路由

外掛可以使用 `api.registerHttpRoute(...)` 公開 HTTP 端點。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由欄位：

- `path`：閘道 HTTP 伺服器下的路由路徑。
- `auth`：必填，`"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證／網路鉤子驗證。
- `match`：選填。`"exact"`（預設）或 `"prefix"`。
- `handleUpgrade`：選填，用於相同路由上的 WebSocket 升級要求處理常式。
- `replaceExisting`：選填。允許同一個外掛取代自己現有的路由註冊。
- `handler`：當路由已處理要求時傳回 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，並會導致外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非使用 `replaceExisting: true`，否則完全相同的 `path + match` 衝突會遭拒絕，且外掛不能取代另一個外掛的路由。
- 具有不同 `auth` 層級的重疊路由會遭拒絕。`exact`/`prefix` 後援鏈只能維持在相同的驗證層級。
- `auth: "plugin"` 路由**不會**自動取得操作員執行階段範圍。它們用於外掛管理的網路鉤子／簽章驗證，而非具特殊權限的閘道輔助函式呼叫。
- `auth: "gateway"` 路由會在閘道要求的執行階段範圍內執行。預設介面（`gatewayRuntimeScopeSurface: "write-default"`）刻意採取保守設定：
  - 共用密鑰持有人驗證（`gateway.auth.mode = "token"` / `"password"`）及任何非受信任 Proxy 的驗證方法都只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes`
  - 未提供明確 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端，也會保留舊有僅限 `operator.write` 的介面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端則會取得所宣告的範圍
  - 路由可以選擇啟用 `gatewayRuntimeScopeSurface: "trusted-operator"`，以便對帶有身分資訊的驗證模式一律採用 `x-openclaw-scopes`（未提供標頭時，則退回使用完整的命令列介面預設範圍集合）
- 由 `auth: "gateway"` 路由支援的沙箱化外部 Control UI 分頁，會使用僅由已驗證啟動程序簽發的短效期簽章 Cookie 授權；外掛驗證分頁則保留其直接 iframe 路徑。在掛載前，父頁面會在同一個不透明沙箱內執行由路由擁有的探測，若瀏覽器隱私權政策封鎖 Cookie，便會以封閉方式失敗。此授權會繫結至所屬外掛、相符的路由根目錄及目前的驗證世代；其由程序隨機產生的 Cookie 名稱可防止同一主機上受信任的閘道彼此覆寫，但 Cookie 絕不會隔離 TCP 連接埠。因此，閘道主機名稱是一個認證資訊邊界：請勿在該主機名稱上共同託管彼此不信任的服務，包括其他連接埠。路由分派會拒絕對另一個外掛所擁有之巢狀路由的重複使用。由於沙箱後代在 Cookie 用途上屬於跨網站，因此授權僅接受搭配 `operator.read` 的 `GET` 與 `HEAD`；異動與 WebSocket 升級仍須使用明確經閘道驗證的介面。此 Cookie 刻意不能使用 CHIPS：目前的瀏覽器會在分割區索引鍵中納入跨網站祖先位元，因此巢狀不透明沙箱框架將無法存取相同路由的資產。Cookie 需要安全內容及瀏覽器對跨網站 Cookie 的權限，因此在純 HTTP 區域網路來源或完全封鎖第三方 Cookie 的情況下，無法使用經閘道驗證的外部分頁；請使用 HTTPS/Tailscale Serve，或採用相容 Cookie 政策且受瀏覽器信任的迴路位址。
- 此授權可防止閘道持有人權杖洩露及意外重複使用路由／範圍；但不會在原生外掛之間建立安全邊界。原生外掛程式碼及其提供的 UI 內容仍屬於相同的受信任程序內外掛邊界。
- 實務規則：不要假設經閘道驗證的外掛路由隱含為管理員介面。如果你的路由需要僅限管理員的行為，請選擇啟用 `trusted-operator` 範圍介面、要求帶有身分資訊的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。
- 完成路由比對與驗證後，一般處理常式會參與閘道根工作准入。處於準備中或重新啟動中的閘道會在叫用處理常式前傳回 `503`。唯一的狹義例外是獲資訊清單授權的 `auth: "gateway"` 路由，且該路由也選擇啟用路由專用的 `trusted-operator` 介面；它會保持可連線，以免暫停控制分派無法進行，而同一外掛的一般同層路由仍位於准入邊界之後。WebSocket `handleUpgrade` 所有權使用相同的不可分割准入邊界；處理常式接受通訊端後，該通訊端後續的生命週期由外掛擁有，不受此邊界追蹤。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用範圍較窄的 SDK 子路徑，而非單體式 `openclaw/plugin-sdk` 根
彙整模組。核心子路徑：

| 子路徑                            | 用途                                      |
| ---------------------------------- | -------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | 外掛註冊基礎元件               |
| `openclaw/plugin-sdk/channel-core` | 頻道進入點／建置輔助函式                  |
| `openclaw/plugin-sdk/core`         | 通用共用輔助函式與傘型合約 |

頻道外掛可從一系列範圍較窄的接縫中選擇——`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 及 `channel-actions`。核准行為應統整至
單一 `approvalCapability` 合約，而非混用互不相關的
外掛欄位。請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助函式位於相對應且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 及 `config-mutation`，
而非範圍廣泛的 `config-runtime` 相容性彙整模組。

<Info>
`openclaw/plugin-sdk/channel-lifecycle`、小型頻道輔助門面、
`openclaw/plugin-sdk/config-runtime` 及 `openclaw/plugin-sdk/infra-runtime`
是供舊版外掛使用、現已淘汰的相容性轉接層。新程式碼應改為匯入
範圍更窄的通用基礎元件。
</Info>

儲存庫內部進入點（依各內建外掛套件根目錄）：

- `index.js` — 內建外掛進入點
- `api.js` — 輔助函式／型別彙整模組
- `runtime-api.js` — 僅限執行階段的彙整模組
- `setup-entry.js` — 設定外掛進入點

外部外掛只能匯入 `openclaw/plugin-sdk/*` 子路徑。絕不能
從核心或另一個外掛匯入其他外掛套件的 `src/*`。
透過門面載入的進入點會優先使用目前的執行階段設定快照（若存在），
然後才退回使用磁碟上已解析的設定檔。

`image-generation`、`media-understanding` 及
`speech` 等功能專用子路徑之所以存在，是因為目前的內建外掛會使用它們。它們不會
自動成為長期凍結的外部合約——依賴這些路徑時，請查閱相關的 SDK
參考頁面。

## 訊息工具結構描述

外掛應擁有頻道專用的 `describeMessageTool(...)` 結構描述
貢獻項目，用於回應、讀取及投票等非訊息基礎元件。
共用傳送呈現方式應使用通用的 `MessagePresentation` 合約，
而非供應商原生的按鈕、元件、區塊或卡片欄位。
如需瞭解合約、後援規則、供應商對應及外掛作者檢查清單，
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)。

具備傳送能力的外掛會透過訊息功能宣告它們可呈現的內容：

- `presentation`：用於語意呈現區塊（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）
- `delivery-pin`：用於釘選傳遞要求

核心會決定以原生方式呈現內容，或將其降級為文字。
不要從通用訊息工具公開供應商原生 UI 的逃生出口。
舊版原生結構描述的已淘汰 SDK 輔助函式仍會匯出，供現有的
第三方外掛使用，但新外掛不應使用它們。

## 頻道目標解析

頻道外掛應擁有頻道專用的目標語意。保持共用
對外主機的通用性，並使用傳訊配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前，決定標準化目標
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告知核心某個
  輸入是否應略過目錄搜尋，直接進行類 ID 解析。
- `messaging.targetResolver.reservedLiterals` 會列出該供應商中
  屬於頻道／工作階段參照的純文字詞彙。解析會先保留已設定的
  目錄項目，再拒絕保留字面值，然後在目錄未命中時以封閉方式失敗。
- `messaging.targetResolver.resolveTarget(...)` 是核心在標準化後或
  目錄未命中後，需要由供應商擁有的最終解析時所使用的外掛後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責供應商專用的工作階段
  路由建構。

建議拆分方式：

- 使用 `inferTargetChatType` 處理應在搜尋
  對等方／群組前進行的類別判斷。
- 使用 `looksLikeId` 檢查“將此項目視為明確／原生目標 ID”。
- 使用 `resolveTarget` 作為供應商專用的標準化後援，而非用於
  廣泛目錄搜尋。
- 將聊天 ID、討論串 ID、JID、控制代碼及聊天室
  ID 等供應商原生 ID 保留在 `target` 值或供應商專用參數中，而非放入通用 SDK
  欄位。

## 設定支援的目錄

從設定衍生目錄項目的外掛應將該邏輯保留在
外掛內，並重複使用
`openclaw/plugin-sdk/directory-runtime` 的共用輔助函式。

當頻道需要下列由設定支援的對等方／群組時，請使用此方式：

- 由允許清單驅動的私訊對等方
- 已設定的頻道／群組對應
- 帳號範圍的靜態目錄後援

`directory-runtime` 中的共用輔助函式僅處理通用操作：

- 查詢篩選
- 套用限制
- 去除重複項目／標準化輔助函式
- 建置 `ChannelDirectoryEntry[]`

頻道專用的帳號檢查與 ID 標準化應保留在
外掛實作中。

## 供應商目錄

供應商外掛可以使用 `registerProvider({ catalog: { run(...) { ... } } })`
定義用於推論的模型目錄。

`catalog.run(...)` 傳回的形狀與 OpenClaw 寫入
`models.providers` 的形狀相同：

- `{ provider }` 用於單一提供者項目
- `{ providers }` 用於多個提供者項目

當外掛擁有提供者專屬的模型 ID、基礎 URL
預設值或受驗證限制的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw
內建隱含提供者的合併時機：

- `simple`：純 API 金鑰或由環境變數驅動的提供者
- `profile`：存在驗證設定檔時顯示的提供者
- `paired`：合成多個相關提供者項目的提供者
- `late`：在其他隱含提供者之後的最後一輪

發生鍵衝突時，較後的提供者優先，因此外掛可刻意覆寫具有相同提供者 ID 的
內建提供者項目。

外掛也可透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是清單／說明／選擇器介面的未來標準路徑，並支援
`text`、`voice`、`image_generation`、`video_generation` 及 `music_generation`
列。提供者外掛仍負責即時端點呼叫、權杖交換及
供應商回應對應；核心負責通用列形狀、來源標籤及
媒體工具說明格式。媒體產生提供者註冊會根據 `defaultModel`、`models` 及
`capabilities` 自動合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名使用，但會發出淘汰警告
- 若同時註冊 `catalog` 與 `discovery`，OpenClaw 會使用 `catalog`
  並發出警告
- `augmentModelCatalog` 已淘汰；隨附的提供者應透過
  `registerModelCatalogProvider` 發布補充列

## 唯讀頻道檢查

若你的外掛註冊了頻道，建議在實作
`resolveAccount(...)` 的同時實作 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設認證資訊
  已完全具體化，並可在缺少必要祕密資訊時快速失敗。
- 唯讀命令路徑（例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`）以及 doctor／設定
  修復流程，不應只為了描述設定就需要具體化執行階段認證資訊。

建議的 `inspectAccount(...)` 行為：

- 僅傳回描述性的帳號狀態。
- 保留 `enabled` 與 `configured`。
- 在相關時包含認證資訊來源／狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要只為了回報唯讀可用性而傳回原始權杖值。
  對狀態類命令而言，傳回 `tokenStatus: "available"`（以及對應的來源
  欄位）即可。
- 當認證資訊透過 SecretRef 設定，但在目前命令路徑中
  無法使用時，請使用 `configured_unavailable`。

如此一來，唯讀命令便可回報「已設定，但在此命令
路徑中無法使用」，而不是當機或誤報帳號尚未設定。

## 套件包

外掛目錄可包含具有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個外掛。若套件包列出多個擴充功能，外掛
ID 會變成 `<manifestOrPackageName>/<fileBase>`（若有資訊清單 ID，則以其為準；
否則使用未限定範圍的 `package.json` 名稱）。

若你的外掛匯入 npm 相依套件，請將它們安裝在該目錄中，以便
使用 `node_modules`（`npm install`／`pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在解析符號連結後都必須位於外掛
目錄內。任何逸出套件目錄的項目都會遭到拒絕。

安全性注意事項：`openclaw plugins install` 會使用專案本機的
`npm install --omit=dev --ignore-scripts` 安裝外掛相依套件（不執行生命週期指令碼，
執行階段不安裝開發相依套件），並忽略繼承的全域 npm 安裝設定。
請讓外掛相依套件樹保持「純 JS/TS」，並避免使用需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可指向輕量、僅供設定使用的模組。
當 OpenClaw 需要已停用頻道外掛的設定介面，
或頻道外掛已啟用但尚未設定時，會載入 `setupEntry`
而非完整外掛進入點。若主要外掛進入點也會連接工具、掛鉤或其他僅限執行階段的
程式碼，這可減輕啟動與設定負擔。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可讓頻道外掛在閘道開始接聽前的啟動階段中，即使頻道已完成設定，
仍選擇使用相同的 `setupEntry` 路徑。

僅當 `setupEntry` 完整涵蓋閘道開始接聽前必須存在的啟動介面時，
才使用此選項。實際上，這表示設定進入點
必須註冊啟動所依賴的每項頻道自有功能，例如：

- 頻道註冊本身
- 閘道開始接聽前必須可用的任何 HTTP 路由
- 同一時間範圍內必須存在的任何閘道方法、工具或服務

若完整進入點仍擁有任何必要的啟動功能，請勿啟用
此旗標。讓外掛維持預設行為，並讓 OpenClaw 在
啟動期間載入完整進入點。

隨附頻道也可發布僅供設定使用的合約介面輔助程式，讓核心
能在完整頻道執行階段載入前查詢。目前的設定
提升介面為：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要在不載入完整外掛進入點的情況下，將舊版單一帳號頻道
設定提升至 `channels.<id>.accounts.*` 時，會使用該介面。
Matrix 是目前的隨附範例：若具名帳號已存在，它只會將驗證／啟動程序金鑰移入
具名的提升帳號；它也能保留已設定但非標準的預設帳號金鑰，而不是一律建立
`accounts.default`。

這些設定修補配接器讓隨附合約介面的探索維持延遲載入。匯入
時仍保持輕量；提升介面只會在首次使用時載入，而不會
在模組匯入時重新進入隨附頻道的啟動流程。

當這些啟動介面包含閘道 RPC 方法時，請讓它們使用
外掛專屬前綴。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍屬保留範圍，且即使外掛要求較窄的範圍，
也一律解析為 `operator.admin`。

範例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 頻道目錄中繼資料

頻道外掛可透過 `openclaw.channel` 公告設定／探索中繼資料，並透過
`openclaw.install` 公告安裝提示。這可讓核心目錄不包含資料。

範例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（自行託管）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "透過 Nextcloud Talk 網路鉤子機器人提供自行託管的聊天功能。",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

除了最小範例外，實用的 `openclaw.channel` 欄位還包括：

- `detailLabel`：用於更豐富目錄／狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的文字
- `preferOver`：此目錄項目應優先於其顯示的低優先級外掛／頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面的文案控制
- `markdownCapable`：將頻道標記為支援 Markdown，以用於輸出格式決策
- `exposure.configured`：設為 `false` 時，從已設定頻道的清單介面隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定／組態選擇器隱藏該頻道
- `exposure.docs`：將頻道標記為文件導覽介面的內部／私人頻道
- `quickstartAllowFrom`：讓頻道選擇採用標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號，也要求明確繫結帳號
- `preferSessionLookupForAnnounceTarget`：解析公告目標時優先使用工作階段查詢

OpenClaw 也可合併**外部頻道目錄**（例如 MPM
登錄匯出檔）。請將 JSON 檔案放在下列其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一或多個 JSON 檔案（以逗號／分號／`PATH` 分隔）。每個檔案都應
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的頻道目錄項目與提供者安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開
正規化的安裝來源資訊。
正規化資訊會指出 npm 規格是精確版本還是浮動選擇器、
是否具有預期的完整性中繼資料，以及是否也有本機
來源路徑可用。已知目錄／套件身分時，若剖析出的 npm 套件名稱偏離該身分，
正規化資訊會發出警告。
若 `defaultChoice` 無效或指向無法使用的來源，以及 npm 完整性中繼資料存在但沒有有效的 npm
來源時，也會發出警告。消費端應將 `installSource` 視為可附加的選用欄位，
如此手動建立的項目與目錄轉接層就不必合成該欄位。
這讓新手引導與診斷無須匯入外掛執行階段，
即可說明來源層狀態。

官方外部 npm 項目應優先使用精確的 `npmSpec` 加上
`expectedIntegrity`。為了相容性，仍可使用裸套件名稱與 dist-tag，
但它們會顯示來源層警告，讓目錄能逐步轉向固定版本且經完整性檢查的安裝，
而不致破壞現有外掛。
當新手引導從本機目錄路徑安裝時，會記錄一個受管理的外掛
外掛索引項目，其中包含 `source: "path"`，並在可行時包含工作區相對的
`sourcePath`。絕對操作載入路徑會保留在
`plugins.load.paths` 中；安裝記錄不會將本機工作站
路徑重複寫入長期設定。這能讓來源層診斷看見本機開發安裝，
同時不會增加第二個原始檔案系統路徑揭露
介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝
來源的真實依據，且無須載入外掛執行階段模組即可重新整理。
即使外掛資訊清單遺失或
無效，其 `installRecords` 對應仍會持久保存；其 `plugins` 承載內容則是可重新建置的資訊清單檢視。

## 上下文引擎外掛

上下文引擎外掛負責擷取、組裝及壓縮的工作階段上下文協調。
請從你的外掛使用 `api.registerContextEngine(id, factory)` 註冊，
再透過 `plugins.slots.contextEngine` 選擇使用中的引擎。

當你的外掛需要取代或擴充預設上下文
流水線，而不只是新增記憶搜尋或掛鉤時，請使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

工廠 `ctx` 公開選用的 `config`、`agentDir` 和 `workspaceDir`
值，供建構時初始化使用。

主機會在呼叫非舊版引擎的 `assemble()` 前，完成已註冊的非同步記憶提示準備。當 `assemble()` 處於作用中時，`buildMemorySystemPromptAddition(...)` 會維持同步，並讀取該不可變的執行快照。
請將提供的工具與引用內容原封不動地傳遞下去，確保快照不會跨越執行邊界。

當作用中的框架具有持久性後端執行緒時，`assemble()` 可以傳回 `contextProjection`。若使用舊版的逐回合投影，請省略它。當組裝後的內容應僅注入後端執行緒一次，並重複使用至紀元變更為止時，請傳回 `{ mode: "thread_bootstrap", epoch }`。在引擎的語意內容變更後調整紀元，例如在引擎自有的壓縮程序執行後。主機可以在線程啟動投影中保留工具呼叫中繼資料、輸入形狀及經遮蔽的工具結果，讓新的後端執行緒能維持工具連續性，而不必複製含有原始機密的承載資料。

如果你的引擎**不**擁有壓縮演算法，請保留 `compact()`
的實作，並明確委派它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 新增能力

當外掛需要的行為無法套用目前的 API 時，請勿透過私有的內部存取來繞過外掛系統。請新增缺少的能力。

建議順序：

1. **定義核心合約。** 決定核心應擁有的共用行為：
   原則、備援、設定合併、生命週期、面向頻道的語意，以及
   執行階段輔助工具的形狀。
2. **新增具型別的外掛註冊／執行階段介面。** 使用最小且實用的具型別能力介面，擴充
   `OpenClawPluginApi` 和／或 `api.runtime`。
3. **串接核心與頻道／功能使用端。** 頻道和功能外掛
   應透過核心使用新能力，而不是直接匯入供應商實作。
4. **註冊供應商實作。** 接著由供應商外掛針對該能力註冊其
   後端。
5. **新增合約涵蓋範圍。** 新增測試，使擁有權和註冊形狀
   能隨時間持續保持明確。

OpenClaw 正是透過這種方式維持明確主張，同時避免將單一
提供者的世界觀硬編碼其中。具體的檔案檢查清單和完整範例，請參閱[能力操作指南](/zh-TW/plugins/adding-capabilities)。

### 能力檢查清單

新增能力時，實作通常應一併涵蓋以下
介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心執行器／執行階段輔助工具
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄串接
- 當功能／頻道外掛需要使用該能力時，在 `src/plugins/runtime/*` 中公開外掛執行階段
- `src/test-utils/plugin-registration.ts` 中的擷取／測試輔助工具
- `src/plugins/contracts/registry.ts` 中的擁有權／合約斷言
- `docs/` 中的操作人員／外掛文件

如果缺少其中任何一個介面，通常表示該能力
尚未完整整合。

### 能力範本

最小模式：

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

合約測試模式（`src/plugins/contracts/registry.ts` 公開如 `providerContractPluginIds` 等擁有權查詢；測試會斷言外掛的
`contracts.videoGenerationProviders` 清單與它實際註冊的項目相符）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這能讓規則保持簡單：

- 核心擁有能力合約與協調流程
- 供應商外掛擁有供應商實作
- 功能／頻道外掛使用執行階段輔助工具
- 合約測試讓擁有權維持明確

## 相關內容

- [外掛架構](/zh-TW/plugins/architecture) — 公開的能力模型與形狀
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
