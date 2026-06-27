---
read_when:
    - 實作提供者執行階段掛鉤、頻道生命週期或套件包
    - 偵錯外掛載入順序或登錄狀態
    - 新增外掛能力或情境引擎外掛
summary: 外掛架構內部：載入管線、登錄檔、執行階段掛鉤、HTTP 路由與參考表
title: 外掛架構內部
x-i18n:
    generated_at: "2026-06-27T19:33:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

如需公開能力模型、外掛形態與擁有權/執行合約，請參閱 [外掛架構](/zh-TW/plugins/architecture)。本頁是內部機制的參考：載入管線、登錄表、執行階段鉤子、閘道 HTTP 路由、匯入路徑，以及結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下操作：

1. 探索候選外掛根目錄
2. 讀取原生或相容的套件資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項目的啟用狀態
6. 載入已啟用的原生模組：已建置的內建模組使用原生載入器；
   第三方本機來源 TypeScript 使用緊急 Jiti 後備機制
7. 呼叫原生 `register(api)` 鉤子，並將註冊項目收集到外掛登錄表
8. 將登錄表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名 — 載入器會解析存在的項目（`def.register ?? def.activate`），並在同一時點呼叫它。所有內建外掛都使用 `register`；新外掛請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當進入點逸出外掛根目錄、路徑可被全世界寫入，或非內建外掛的路徑擁有權看起來可疑時，候選項目會遭到封鎖。

遭封鎖的候選項目仍會為了診斷而繫結到其外掛 id。如果設定仍參照該 id，驗證會將外掛回報為存在但遭封鎖，並指回路徑安全警告，而不是將該設定項目視為過時。

### 資訊清單優先行為

資訊清單是控制平面的真實來源。OpenClaw 會用它來：

- 識別外掛
- 探索宣告的通道/Skills/設定結構描述或套件能力
- 驗證 `plugins.entries.<id>.config`
- 補充 Control UI 標籤/預留位置
- 顯示安裝/目錄中繼資料
- 在不載入外掛執行階段的情況下，保留低成本的啟用與設定描述元

對於原生外掛，執行階段模組是資料平面部分。它會註冊實際行為，例如鉤子、工具、命令或提供者流程。

可選的資訊清單 `activation` 與 `setup` 區塊會留在控制平面上。
它們是僅含中繼資料的描述元，用於啟用規劃與設定探索；
它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
第一批即時啟用消費者現在會使用資訊清單命令、通道與提供者提示，
在更廣泛的登錄表具體化之前縮小外掛載入範圍：

- 命令列介面載入會縮小到擁有所要求主要命令的外掛
- 通道設定/外掛解析會縮小到擁有所要求
  通道 id 的外掛
- 明確的提供者設定/執行階段解析會縮小到擁有所要求
  提供者 id 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動
  匯入與啟動退出；沒有啟動中繼資料的外掛只會
  透過較窄的啟用觸發器載入

要求廣泛 `all` 範圍的請求期間執行階段預載，仍會從設定、啟動規劃、已設定通道、插槽與自動啟用規則中推導出明確的有效外掛 id 集合。如果推導出的集合為空，OpenClaw 會載入空的執行階段登錄表，而不是擴大到每個可探索的外掛。

啟用規劃器同時公開僅 id API 供既有呼叫端使用，以及規劃 API 供新的診斷使用。規劃項目會回報外掛被選取的原因，將明確的 `activation.*` 規劃器提示，與資訊清單擁有權後備來源（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與鉤子）分開。這個原因拆分就是相容性邊界：既有外掛中繼資料可持續運作，而新程式碼能偵測廣泛提示或後備行為，而不改變執行階段載入語意。

設定探索現在會優先使用描述元擁有的 id，例如 `setup.providers` 與
`setup.cliBackends`，先縮小候選外掛範圍，再回退到
`setup-api`，供仍需要設定期間執行階段鉤子的外掛使用。提供者
設定清單會使用資訊清單 `providerAuthChoices`、描述元推導出的設定
選項，以及安裝目錄中繼資料，而不載入提供者執行階段。明確的
`setup.requiresRuntime: false` 是僅限描述元的截斷點；省略的
`requiresRuntime` 會保留舊版 setup-api 後備機制以維持相容性。如果有多個
已探索外掛宣稱相同的正規化設定提供者或命令列介面後端 id，設定查找會拒絕
曖昧的擁有者，而不是依賴探索順序。當設定執行階段確實執行時，
登錄表診斷會回報 `setup.providers` / `setup.cliBackends` 與 setup-api
註冊的提供者或命令列介面後端之間的漂移，而不封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會在牆鐘時間窗口後方快取外掛探索結果或直接資訊清單登錄表資料。安裝、資訊清單編輯與載入路徑變更，必須在下一次明確的中繼資料讀取或快照重建時可見。
資訊清單檔案解析器可以保留一個有界的檔案簽章快取，以已開啟的資訊清單路徑、inode、大小與時間戳記為鍵；該快取只避免重新解析未變更的位元組，且不得快取探索、登錄表、擁有者或政策答案。

安全的中繼資料快速路徑是明確的物件擁有權，而不是隱藏快取。
閘道啟動熱路徑應透過呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、推導出的 `PluginLookUpTable`，或明確的資訊清單登錄表。設定驗證、啟動自動啟用、外掛啟動程序與提供者選取，可以在這些物件代表目前設定與外掛清單時重用它們。設定查找仍會依需求重建資訊清單中繼資料，除非特定設定路徑收到明確的資訊清單登錄表；請將其保留為冷路徑後備機制，而不是新增隱藏查找快取。當輸入變更時，請重建並取代快照，而不是改動它或保留歷史副本。
作用中外掛登錄表的檢視，以及內建通道啟動輔助工具，應從目前的登錄表/根目錄重新計算。
短生命週期的對應可在單次呼叫內用來去重工作或防止重入；它們不得成為程序中繼資料快取。

對於外掛載入，持久快取層是執行階段載入。當程式碼或已安裝成品實際載入時，它可以重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄表
- 用於避免重複匯入相同執行階段介面的 jiti/模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複解析的短生命週期每次呼叫對應

這些快取是資料平面實作細節。它們不得回答控制平面問題，例如「哪個外掛擁有這個提供者？」除非呼叫端刻意要求執行階段載入。

請勿為以下項目新增持久或牆鐘快取：

- 探索結果
- 直接資訊清單登錄表
- 從已安裝外掛索引重建的資訊清單登錄表
- 提供者擁有者查找、模型抑制、提供者政策或公開成品
  中繼資料
- 任何其他從資訊清單推導出的答案，而變更後的資訊清單、已安裝索引
  或載入路徑應在下一次中繼資料讀取時可見

從持久化已安裝外掛索引重建資訊清單中繼資料的呼叫端會依需求重建該登錄表。已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄表模型

已載入的外掛不會直接改動任意核心全域變數。它們會註冊到中央外掛登錄表。

登錄表追蹤：

- 外掛記錄（身分、來源、起源、狀態、診斷）
- 工具
- 舊版鉤子與型別化鉤子
- 通道
- 提供者
- 閘道 RPC 處理常式
- HTTP 路由
- 命令列介面註冊器
- 背景服務
- 外掛擁有的命令

核心功能接著會從該登錄表讀取，而不是直接與外掛模組溝通。這會讓載入保持單向：

- 外掛模組 -> 登錄表註冊
- 核心執行階段 -> 登錄表消費

這種分離對可維護性很重要。它意味著大多數核心介面只需要一個整合點：「讀取登錄表」，而不是「為每個外掛模組做特殊處理」。

## 對話繫結回呼

繫結對話的外掛可以在核准被解析時做出反應。

使用 `api.onConversationBindingResolved(...)` 在繫結要求核准或拒絕後接收回呼：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回呼酬載欄位：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的已解析繫結
- `request`：原始要求摘要、分離提示、寄件者 id，以及
  對話中繼資料

此回呼僅供通知。它不會變更誰被允許繫結對話，且會在核心核准處理完成後執行。

## 提供者執行階段鉤子

提供者外掛有三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查找：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定期間鉤子**：`catalog`（舊版 `discovery`）加上
  `applyConfigDefaults`。
- **執行階段鉤子**：40 多個可選鉤子，涵蓋驗證、模型解析、
  串流包裝、思考層級、重播政策與用量端點。請參閱
  [鉤子順序與用法](#hook-order-and-usage)下的完整清單。

OpenClaw 仍擁有通用代理迴圈、容錯移轉、逐字稿處理與工具政策。
這些鉤子是提供者特定行為的擴充介面，無需整個自訂推論傳輸。

當提供者有環境變數型認證，而通用驗證/狀態/模型選擇器路徑應在不載入外掛執行階段的情況下看見它們時，請使用資訊清單 `setup.providers[].envVars`。已棄用的 `providerAuthEnvVars` 在棄用窗口期間仍會由相容性配接器讀取，且使用它的非內建外掛會收到資訊清單診斷。當一個提供者 id 應重用另一個提供者 id 的環境變數、驗證設定檔、設定支援的驗證與 API 金鑰導入選項時，請使用資訊清單 `providerAuthAliases`。當導入/驗證選項命令列介面介面應在不載入提供者執行階段的情況下知道提供者的選項 id、群組標籤與簡單單旗標驗證接線時，請使用資訊清單 `providerAuthChoices`。保留提供者執行階段
`envVars` 給面向操作員的提示，例如導入標籤或 OAuth
client-id/client-secret 設定變數。

當通道有環境驅動的驗證或設定，而通用 shell-env 後備、設定/狀態檢查或設定提示應在不載入通道執行階段的情況下看見它時，請使用資訊清單 `channelEnvVars`。

### 鉤子順序與用法

對於模型/提供者外掛，OpenClaw 會大致依以下順序呼叫鉤子。
「何時使用」欄是快速決策指南。
OpenClaw 不再呼叫的僅相容性提供者欄位，例如
`ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，有意不列在此處。

| #   | Hook                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 時，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型系列語意                                                                         |
| --  | _(內建模型查詢)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是外掛 hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查詢前正規化舊版或預覽模型 ID 別名                                                     | 提供者在標準模型解析前擁有別名清理                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前正規化提供者系列的 `api` / `baseUrl`                                      | 提供者擁有同一傳輸系列中自訂提供者 ID 的傳輸清理                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要應與外掛同住的設定清理；內建 Google 系列輔助工具也會補強支援的 Google 設定項目   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者公開自己的環境標記 API 金鑰解析 hook                                                                                |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情況下呈現本機/自架或設定支援的驗證                                   | 提供者可使用合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 覆蓋提供者擁有的外部驗證設定檔；CLI/應用程式擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；在 manifest 中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔佔位符降到環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先權的合成佔位符設定檔                                                                 |
| 11  | `resolveDynamicModel`             | 針對尚未在本機登錄檔中的提供者擁有模型 ID 進行同步後備                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 提供者需要網路中繼資料才能解析未知 ID                                                                                  |
| 13  | `normalizeResolvedModel`          | 在內嵌執行器使用已解析模型前進行最後重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `normalizeToolSchemas`            | 在內嵌執行器看到工具 schema 前正規化它們                                                    | 提供者需要傳輸系列 schema 清理                                                                                                |
| 15  | `inspectToolSchemas`              | 在正規化後呈現提供者擁有的 schema 診斷                                                  | 提供者想要關鍵字警告，而不讓核心學習提供者特定規則                                                                 |
| 16  | `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出合約                                                              | 提供者需要標記式推理/最終輸出，而非原生欄位                                                                         |
| 17  | `prepareExtraParams`              | 在通用串流選項包裝器前正規化請求參數                                              | 提供者需要預設請求參數或按提供者清理參數                                                                           |
| 18  | `createStreamFn`                  | 以自訂傳輸完全取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/主體/模型相容性包裝器，而非自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加原生每回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸送出提供者原生的回合身分                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或後備政策                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：已儲存的設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | 用於自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 提供者不適合共用的 OpenClaw 重新整理器                                                                                          |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者需要在重新整理失敗後提供由提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 提供者擁有的上下文視窗溢位比對器                                                                 | 提供者有通用啟發式會漏掉的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul 提供者的提示快取政策                                                               | 提供者需要 Proxy 特定的快取 TTL 閘控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後附加的合成/最終目錄列                                                          | 提供者需要 `models list` 和選擇器中的合成向前相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 層級集合、顯示標籤和預設值                                                 | 提供者為選定模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性 hook                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性 hook                                                                   | 提供者只想在模型子集上啟用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性 hook                                                                      | 提供者擁有模型系列的預設 `/think` 政策                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的現代模型比對器                                              | 提供者擁有即時/煙霧測試偏好模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前，將已設定的憑證交換為實際執行階段權杖/金鑰                       | 提供者需要權杖交換或短效請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的用量/計費憑證                                     | 提供者需要自訂用量/配額權杖剖析，或不同的用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在驗證已解析後，擷取並正規化供應商特定的用量/配額快照                             | 供應商需要供應商特定的用量端點或酬載解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶/搜尋建置由供應商擁有的嵌入配接器                                                     | 記憶嵌入行為屬於供應商外掛                                                                                    |
| 40  | `buildReplayPolicy`               | 回傳控制供應商逐字稿處理的重播政策                                        | 供應商需要自訂逐字稿政策（例如，移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷史                                                        | 供應商需要超出共享壓縮輔助工具的供應商特定重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器之前進行最終的重播回合驗證或重塑                                           | 供應商傳輸在通用清理後需要更嚴格的回合驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由供應商擁有的選擇後副作用                                                                 | 當模型變為作用中時，供應商需要遙測或供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查
相符的供應商外掛，接著再依序落到其他具備鉤子能力的供應商外掛，
直到其中一個實際變更模型 ID 或傳輸/設定。這能讓
別名/相容性供應商 shim 持續運作，而不需要呼叫端知道哪個
內建外掛負責改寫。如果沒有供應商鉤子改寫受支援的
Google 系列設定項目，內建 Google 設定正規化器仍會套用
該相容性清理。

如果供應商需要完全自訂的線路協定或自訂請求執行器，
那屬於另一類擴充。這些鉤子是給仍在 OpenClaw 一般推論迴圈上執行的
供應商行為使用。

`resolveUsageAuth` 會決定 OpenClaw 應該呼叫 `fetchUsageSnapshot`，
還是回退到用量/狀態介面的通用憑證解析。當供應商有用量憑證時，
回傳 `{ token, accountId? }`；當供應商擁有的用量驗證已處理請求，
且必須抑制通用 API 金鑰/OAuth 回退時，回傳 `{ handled: true }`；
當供應商未處理用量驗證時，回傳 `null` 或 `undefined`。

### 供應商範例

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

內建供應商外掛會組合上述鉤子，以符合各廠商的目錄、
驗證、思考、重播和用量需求。權威鉤子集合位於
`extensions/` 底下各外掛內；此頁示範形狀，而不是鏡像列出清單。

<AccordionGroup>
  <Accordion title="直通目錄供應商">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，讓它們可以在
    OpenClaw 靜態目錄之前呈現上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 和用量端點供應商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 搭配 `resolveUsageAuth` +
    `fetchUsageSnapshot`，以擁有權杖交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="重播和對話記錄清理系列">
    共享的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓供應商可以透過
    `buildReplayPolicy` 選擇加入對話記錄政策，而不是讓每個外掛
    重新實作清理。
  </Accordion>
  <Accordion title="僅目錄供應商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共享推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助工具">
    Beta 標頭、`/fast` / `serviceTier` 和 `context1m` 位於
    Anthropic 外掛的公開 `api.ts` / `contract-api.ts` 邊界內
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位於
    通用 SDK。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

外掛可以透過 `api.runtime` 存取選定的核心輔助工具。以 TTS 為例：

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

- `textToSpeech` 會回傳檔案/語音備註介面的標準核心 TTS 輸出承載。
- 使用核心 `messages.tts` 設定和供應商選擇。
- 回傳 PCM 音訊緩衝區 + 取樣率。外掛必須為供應商重新取樣/編碼。
- `listVoices` 依供應商而定是選用功能。可將它用於廠商擁有的語音選擇器或設定流程。
- 語音清單可以包含更豐富的中繼資料，例如語系、性別和個性標籤，以供具供應商感知能力的選擇器使用。
- OpenAI 和 ElevenLabs 目前支援電話語音。Microsoft 不支援。

外掛也可以透過 `api.registerSpeechProvider(...)` 註冊語音供應商。

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

- 將 TTS 政策、回退和回覆傳遞保留在核心。
- 使用語音供應商處理廠商擁有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 偏好的擁有權模型是以公司為導向：一個廠商外掛可以擁有
  文字、語音、圖片，以及 OpenClaw 未來新增這些能力合約時的媒體供應商。

對於圖片/音訊/影片理解，外掛會註冊一個具型別的
媒體理解供應商，而不是通用鍵/值包：

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

- 將協調、回退、設定和頻道接線保留在核心。
- 將廠商行為保留在供應商外掛。
- 增量擴展應保持具型別：新的選用方法、新的選用
  結果欄位、新的選用能力。
- 影片生成已經遵循相同模式：
  - 核心擁有能力合約和執行階段輔助工具
  - 廠商外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能/頻道外掛使用 `api.runtime.videoGeneration.*`

對於媒體理解執行階段輔助工具，外掛可以呼叫：

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
  model: "gpt-5.5",
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

對於音訊轉錄，外掛可以使用媒體理解執行階段，
或使用較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是圖片/音訊/影片理解的
  偏好共享介面。
- `extractStructuredWithModel(...)` 是面向外掛的邊界，用於受限的
  供應商擁有、以圖片為優先的擷取。至少包含一個圖片輸入；
  文字輸入是補充脈絡。
  產品外掛擁有其路由和結構描述，而 OpenClaw 擁有
  供應商/執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）和供應商回退順序。
- 未產生轉錄輸出時（例如略過/不支援的輸入），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 會保留為相容性別名。

外掛也可以透過 `api.runtime.subagent` 啟動背景子代理程式執行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意事項：

- `provider` 和 `model` 是每次執行的選用覆寫，而不是持久工作階段變更。
- OpenClaw 只會為受信任呼叫端採用這些覆寫欄位。
- 對於外掛擁有的回退執行，操作員必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的外掛子代理程式執行仍可運作，但覆寫請求會被拒絕，而不是靜默回退。
- 外掛建立的子代理程式工作階段會以建立外掛 ID 標記。回退 `api.runtime.subagent.deleteSession(...)` 只能刪除這些擁有的工作階段；任意工作階段刪除仍需要具管理員範圍的閘道請求。

對於網頁搜尋，外掛可以使用共享執行階段輔助工具，而不是
深入代理程式工具接線：

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

外掛也可以透過
`api.registerWebSearchProvider(...)` 註冊網頁搜尋供應商。

注意事項：

- 將供應商選擇、憑證解析和共享請求語意保留在核心。
- 使用網頁搜尋供應商處理廠商特定的搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為、但不依賴代理程式工具包裝器的功能/頻道外掛之偏好共享介面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已設定的圖片生成供應商鏈生成圖片。
- `listProviders(...)`：列出可用的圖片生成供應商及其能力。

## 閘道 HTTP 路由

外掛可以透過 `api.registerHttpRoute(...)` 公開 HTTP 端點。

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
- `auth`：必要。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證/網路鉤子驗證。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選用。允許同一個外掛取代自己現有的路由註冊。
- `handler`：當路由已處理請求時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，且會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 精確的 `path + match` 衝突會被拒絕，除非設定 `replaceExisting: true`，且一個外掛不能取代另一個外掛的路由。
- 不同 `auth` 等級的重疊路由會被拒絕。請只在相同驗證等級上保留 `exact`/`prefix` 後援鏈。
- `auth: "plugin"` 路由**不會**自動取得操作者執行階段範圍。它們用於外掛管理的網路鉤子/簽章驗證，而不是具特權的 Gateway 輔助呼叫。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段範圍內執行，但該範圍刻意保守：
  - shared-secret bearer 驗證（`gateway.auth.mode = "token"` / `"password"`）會將外掛路由執行階段範圍固定在 `operator.write`，即使呼叫端送出 `x-openclaw-scopes`
  - 具受信任身分的 HTTP 模式（例如私有 ingress 上的 `trusted-proxy` 或 `gateway.auth.mode = "none"`）只有在明確提供 `x-openclaw-scopes` 標頭時才會採用它
  - 如果這些具身分的外掛路由請求缺少 `x-openclaw-scopes`，執行階段範圍會退回 `operator.write`
- 實務規則：不要假設經閘道驗證的外掛路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求具身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭契約。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用窄範圍 SDK 子路徑，而不是單體的 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊原語                                       |
| `openclaw/plugin-sdk/channel-core`  | Channel 進入點/建置輔助工具                       |
| `openclaw/plugin-sdk/core`          | 通用共享輔助工具與 umbrella 契約                   |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

Channel 外掛會從一系列窄範圍接縫中選用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。核准行為應整合到單一
`approvalCapability` 契約，而不是混用不相關的外掛欄位。請參閱 [Channel 外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於對應且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型 channel 輔助 facade、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是供舊版外掛使用的已棄用相容性 shim。
新程式碼應改為匯入更窄範圍的通用原語。
</Info>

Repo 內部進入點（每個 bundled plugin 套件根目錄）：

- `index.js` — bundled plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — setup 外掛進入點

外部外掛應只匯入 `openclaw/plugin-sdk/*` 子路徑。切勿從核心或另一個外掛匯入另一個外掛套件的 `src/*`。
以 facade 載入的進入點在存在有效的執行階段設定快照時會優先使用它，接著才退回磁碟上的已解析設定檔。

能力專屬子路徑（例如 `image-generation`、`media-understanding` 和 `speech`）存在，是因為 bundled plugins 目前使用它們。它們不會自動成為長期凍結的外部契約；依賴它們時，請查看相關的 SDK 參考頁面。

## 訊息工具結構描述

外掛應擁有 channel 專屬的 `describeMessageTool(...)` 結構描述貢獻，用於反應、讀取和投票等非訊息原語。
共享傳送呈現應使用通用 `MessagePresentation` 契約，而不是供應商原生的按鈕、元件、區塊或卡片欄位。
請參閱 [訊息呈現](/zh-TW/plugins/message-presentation) 了解契約、後援規則、供應商對應和外掛作者檢查清單。

具傳送能力的外掛透過訊息能力宣告它們可以呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於釘選傳送請求

核心會決定要以原生方式呈現內容，或將其降級為文字。
不要從通用訊息工具暴露供應商原生 UI escape hatch。
供舊版原生結構描述使用的已棄用 SDK 輔助工具仍會為現有第三方外掛匯出，但新外掛不應使用它們。

## Channel 目標解析

Channel 外掛應擁有 channel 專屬的目標語意。請讓共享 outbound host 保持通用，並使用 messaging adapter 介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前決定正規化目標應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告知核心某個輸入是否應跳過目錄搜尋，直接進行類似 id 的解析。
- `messaging.targetResolver.reservedLiterals` 列出對該供應商而言是 channel/session 參照的裸字。解析會在拒絕保留字面值前保留已設定的目錄項目，接著在目錄未命中時 fail closed。
- `messaging.targetResolver.resolveTarget(...)` 是當核心在正規化後或目錄未命中後需要最終由供應商擁有的解析時使用的外掛後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析後擁有供應商專屬的 session route 建構。

建議切分方式：

- 使用 `inferTargetChatType` 處理應在搜尋 peers/groups 前發生的類別決策。
- 使用 `looksLikeId` 進行「將此視為明確/原生目標 id」檢查。
- 使用 `resolveTarget` 作為供應商專屬的正規化後援，而不是廣泛的目錄搜尋。
- 將 chat ids、thread ids、JIDs、handles 和 room ids 等供應商原生 id 保留在 `target` 值或供應商專屬參數中，而不是通用 SDK 欄位中。

## 以設定支援的目錄

從設定衍生目錄項目的外掛，應將該邏輯保留在外掛中，並重用
`openclaw/plugin-sdk/directory-runtime` 的共享輔助工具。

當 channel 需要以設定支援的 peers/groups 時使用此方式，例如：

- allowlist 驅動的 DM peers
- 已設定的 channel/group maps
- 帳號範圍的靜態目錄後援

`directory-runtime` 中的共享輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重/正規化輔助工具
- 建置 `ChannelDirectoryEntry[]`

Channel 專屬的帳號檢查與 id 正規化應留在外掛實作中。

## 供應商目錄

供應商外掛可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 定義推論用的模型目錄。

`catalog.run(...)` 會回傳 OpenClaw 寫入 `models.providers` 的相同形狀：

- `{ provider }` 用於一個供應商項目
- `{ providers }` 用於多個供應商項目

當外掛擁有供應商專屬模型 id、base URL 預設值或需驗證的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw 內建隱含供應商的合併時機：

- `simple`：一般 API key 或 env 驅動的供應商
- `profile`：存在驗證設定檔時出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：最後一輪，在其他隱含供應商之後

較晚的供應商會在 key 衝突時勝出，因此外掛可以刻意用相同的供應商 id 覆寫內建供應商項目。

外掛也可以透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是 list/help/picker 介面的未來路徑，並支援
`text`、`image_generation`、`video_generation` 和 `music_generation` 列。
供應商外掛仍擁有即時端點呼叫、token 交換和供應商回應對應；核心擁有共通列形狀、來源標籤和媒體工具說明格式。媒體生成供應商註冊會自動從 `defaultModel`、`models` 和 `capabilities` 合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名運作，但會發出棄用警告
- 如果同時註冊了 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
- `augmentModelCatalog` 已棄用；bundled providers 應透過 `registerModelCatalogProvider` 發布補充列

## 唯讀 channel 檢查

如果你的外掛註冊 channel，建議在 `resolveAccount(...)` 旁同時實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證已完整具體化，且在缺少必要秘密時快速失敗。
- 唯讀命令路徑（例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 和 doctor/config
  修復流程）不應只為了描述設定就需要具體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時包含憑證來源/狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要為了回報唯讀可用性而回傳原始 token 值。對 status-style 命令而言，回傳 `tokenStatus: "available"`（以及相符的來源欄位）就足夠。
- 當憑證透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這能讓唯讀命令回報「已設定但在此命令路徑中不可用」，而不是當機或誤報帳號未設定。

## 套件包

外掛目錄可以包含一個帶有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個外掛。如果套件包列出多個 extensions，外掛 id
會變成 `name/<fileBase>`。

如果你的外掛匯入 npm deps，請在該目錄中安裝它們，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全護欄：每個 `openclaw.extensions` 項目在 symlink 解析後都必須留在外掛
目錄內。逃出套件目錄的項目會被拒絕。

Security note: `openclaw plugins install` installs plugin dependencies with a
project-local `npm install --omit=dev --ignore-scripts` (no lifecycle scripts,
no dev dependencies at runtime), ignoring inherited global npm install settings.
Keep plugin dependency trees "pure JS/TS" and avoid packages that require
`postinstall` builds.

Optional: `openclaw.setupEntry` can point at a lightweight setup-only module.
When OpenClaw needs setup surfaces for a disabled channel plugin, or
when a channel plugin is enabled but still unconfigured, it loads `setupEntry`
instead of the full plugin entry. This keeps startup and setup lighter
when your main plugin entry also wires tools, hooks, or other runtime-only
code.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
can opt a channel plugin into the same `setupEntry` path during the gateway's
pre-listen startup phase, even when the channel is already configured.

Use this only when `setupEntry` fully covers the startup surface that must exist
before the gateway starts listening. In practice, that means the setup entry
must register every channel-owned capability that startup depends on, such as:

- channel registration itself
- any HTTP routes that must be available before the gateway starts listening
- any gateway methods, tools, or services that must exist during that same window

If your full entry still owns any required startup capability, do not enable
this flag. Keep the plugin on the default behavior and let OpenClaw load the
full entry during startup.

Bundled channels can also publish setup-only contract-surface helpers that core
can consult before the full channel runtime is loaded. The current setup
promotion surface is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core uses that surface when it needs to promote a legacy single-account channel
config into `channels.<id>.accounts.*` without loading the full plugin entry.
Matrix is the current bundled example: it moves only auth/bootstrap keys into a
named promoted account when named accounts already exist, and it can preserve a
configured non-canonical default-account key instead of always creating
`accounts.default`.

Those setup patch adapters keep bundled contract-surface discovery lazy. Import
time stays light; the promotion surface is loaded only on first use instead of
re-entering bundled channel startup on module import.

When those startup surfaces include gateway RPC methods, keep them on a
plugin-specific prefix. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) remain reserved and always resolve
to `operator.admin`, even if a plugin requests a narrower scope.

Example:

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

### Channel catalog metadata

Channel plugins can advertise setup/discovery metadata via `openclaw.channel` and
install hints via `openclaw.install`. This keeps the core catalog data-free.

Example:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

Useful `openclaw.channel` fields beyond the minimal example:

- `detailLabel`: secondary label for richer catalog/status surfaces
- `docsLabel`: override link text for the docs link
- `preferOver`: lower-priority plugin/channel ids this catalog entry should outrank
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface copy controls
- `markdownCapable`: marks the channel as markdown-capable for outbound formatting decisions
- `exposure.configured`: hide the channel from configured-channel listing surfaces when set to `false`
- `exposure.setup`: hide the channel from interactive setup/configure pickers when set to `false`
- `exposure.docs`: mark the channel as internal/private for docs navigation surfaces
- `showConfigured` / `showInSetup`: legacy aliases still accepted for compatibility; prefer `exposure`
- `quickstartAllowFrom`: opt the channel into the standard quickstart `allowFrom` flow
- `forceAccountBinding`: require explicit account binding even when only one account exists
- `preferSessionLookupForAnnounceTarget`: prefer session lookup when resolving announce targets

OpenClaw can also merge **external channel catalogs** (for example, an MPM
registry export). Drop a JSON file at one of:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Or point `OPENCLAW_PLUGIN_CATALOG_PATHS` (or `OPENCLAW_MPM_CATALOG_PATHS`) at
one or more JSON files (comma/semicolon/`PATH`-delimited). Each file should
contain `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. The parser also accepts `"packages"` or `"plugins"` as legacy aliases for the `"entries"` key.

Generated channel catalog entries and provider install catalog entries expose
normalized install-source facts next to the raw `openclaw.install` block. The
normalized facts identify whether the npm spec is an exact version or floating
selector, whether expected integrity metadata is present, and whether a local
source path is also available. When the catalog/package identity is known, the
normalized facts warn if the parsed npm package name drifts from that identity.
They also warn when `defaultChoice` is invalid or points at a source that is
not available, and when npm integrity metadata is present without a valid npm
source. Consumers should treat `installSource` as an additive optional field so
hand-built entries and catalog shims do not have to synthesize it.
This lets onboarding and diagnostics explain source-plane state without
importing plugin runtime.

Official external npm entries should prefer an exact `npmSpec` plus
`expectedIntegrity`. Bare package names and dist-tags still work for
compatibility, but they surface source-plane warnings so the catalog can move
toward pinned, integrity-checked installs without breaking existing plugins.
When onboarding installs from a local catalog path, it records a managed plugin
plugin index entry with `source: "path"` and a workspace-relative
`sourcePath` when possible. The absolute operational load path stays in
`plugins.load.paths`; the install record avoids duplicating local workstation
paths into long-lived config. This keeps local development installs visible to
source-plane diagnostics without adding a second raw filesystem-path disclosure
surface. The persisted `installed_plugin_index` SQLite row is the install
source of truth and can be refreshed without loading plugin runtime modules.
Its `installRecords` map is durable even when a plugin manifest is missing or
invalid; its `plugins` payload is a rebuildable manifest view.

## Context engine plugins

Context engine plugins own session context orchestration for ingest, assembly,
and compaction. Register them from your plugin with
`api.registerContextEngine(id, factory)`, then select the active engine with
`plugins.slots.contextEngine`.

Use this when your plugin needs to replace or extend the default context
pipeline rather than just add memory search or hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

The factory `ctx` exposes optional `config`, `agentDir`, and `workspaceDir`
values for construction-time initialization.

`assemble()` may return `contextProjection` when the active harness has a
persistent backend thread. Omit it for legacy per-turn projection. Return
`{ mode: "thread_bootstrap", epoch }` when the assembled context should be
injected once into a backend thread and reused until the epoch changes. Change
the epoch after the engine's semantic context changes, such as after an
engine-owned compaction pass. Hosts may preserve tool-call metadata, input
shape, and redacted tool results in a thread-bootstrap projection so fresh
backend threads retain tool continuity without copying raw secret-bearing
payloads.

If your engine does **not** own the compaction algorithm, keep `compact()`
implemented and delegate it explicitly:

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adding a new capability

When a plugin needs behavior that does not fit the current API, do not bypass
the plugin system with a private reach-in. Add the missing capability.

Recommended sequence:

1. define the core contract
   Decide what shared behavior core should own: policy, fallback, config merge,
   lifecycle, channel-facing semantics, and runtime helper shape.
2. add typed plugin registration/runtime surfaces
   Extend `OpenClawPluginApi` and/or `api.runtime` with the smallest useful
   typed capability surface.
3. wire core + channel/feature consumers
   Channels and feature plugins should consume the new capability through core,
   not by importing a vendor implementation directly.
4. register vendor implementations
   Vendor plugins then register their backends against the capability.
5. add contract coverage
   Add tests so ownership and registration shape stay explicit over time.

This is how OpenClaw stays opinionated without becoming hardcoded to one
provider's worldview. See the [Capability Cookbook](/zh-TW/plugins/adding-capabilities)
for a concrete file checklist and worked example.

### Capability checklist

When you add a new capability, the implementation should usually touch these
surfaces together:

- core contract types in `src/<capability>/types.ts`
- core runner/runtime helper in `src/<capability>/runtime.ts`
- plugin API registration surface in `src/plugins/types.ts`
- plugin registry wiring in `src/plugins/registry.ts`
- plugin runtime exposure in `src/plugins/runtime/*` when feature/channel
  plugins need to consume it
- capture/test helpers in `src/test-utils/plugin-registration.ts`
- ownership/contract assertions in `src/plugins/contracts/registry.ts`
- operator/plugin docs in `docs/`

If one of those surfaces is missing, that is usually a sign the capability is
not fully integrated yet.

### Capability template

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

合約測試模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這讓規則保持簡單：

- 核心擁有能力合約與協調編排
- 供應商外掛擁有供應商實作
- 功能/通道外掛使用執行階段輔助工具
- 合約測試讓所有權保持明確

## 相關

- [外掛架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
