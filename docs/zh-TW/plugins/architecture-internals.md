---
read_when:
    - 實作提供者執行階段掛鉤、頻道生命週期或套件包
    - 偵錯外掛載入順序或登錄狀態
    - 新增外掛能力或內容引擎外掛
summary: 外掛架構內部機制：載入管線、登錄檔、執行階段鉤子、HTTP 路由與參考表
title: 外掛架構內部機制
x-i18n:
    generated_at: "2026-07-06T21:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee2b2238b7d91570cc8ebfff958553b0e1d769129060b55a76eae2e1db4f0869
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開能力模型、外掛形狀，以及所有權/執行
合約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋
內部機制：載入管線、登錄表、執行階段鉤子、閘道 HTTP
路由、匯入路徑，以及結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下動作：

1. 探索候選外掛根目錄
2. 讀取原生或相容套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項目的啟用狀態
6. 載入已啟用的原生模組：建置後的內建模組會使用原生載入器；
   第三方本機原始碼 TypeScript 會使用緊急 Jiti 後備方案
7. 呼叫原生 `register(api)` 鉤子，並將註冊項目收集到外掛登錄表
8. 將登錄表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名 — 載入器會解析存在的項目（`def.register ?? def.activate`），並在同一個時間點呼叫它。所有內建外掛都使用 `register`；新外掛請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**運作。探索會在下列情況封鎖候選項目：

- 其解析後的進入點逃逸外掛根目錄
- 其路徑（或其根目錄）可由所有使用者寫入
- 對於非內建外掛，路徑所有權與目前 uid（或 root）不相符

可由所有使用者寫入的內建目錄會先嘗試就地 `chmod` 修復
（npm/全域安裝可能會以 `0777` 發佈套件目錄），然後閘門
會重新檢查；內建來源則完全略過所有權檢查。

被封鎖的候選項目在已知時，仍會在發出的診斷中帶有其外掛 id
（包括從位於原本被拒絕目錄內的資訊清單解析出的 id），因此
參照該 id 的設定會看到一個綁定路徑安全警告的被封鎖外掛，
而不是不相關的「未知外掛」錯誤。

### 資訊清單優先行為

資訊清單是控制平面的事實來源。OpenClaw 會用它來：

- 識別外掛
- 探索已宣告的頻道/技能/設定結構描述或套件組合能力
- 驗證 `plugins.entries.<id>.config`
- 補充 Control UI 標籤/預留位置
- 顯示安裝/目錄中繼資料
- 在不載入外掛執行階段的情況下，保留低成本的啟用與設定描述元

對於原生外掛，執行階段模組是資料平面部分。它會註冊
實際行為，例如鉤子、工具、命令或提供者流程。

選用的資訊清單 `activation` 與 `setup` 區塊會留在控制平面。
它們是用於啟用規劃與設定探索的純中繼資料描述元；
它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
即時啟用消費者會使用資訊清單命令、頻道和提供者提示，在更廣泛的
登錄表實體化之前縮小外掛載入範圍：

- 命令列介面載入會縮小到擁有所要求主要命令的外掛
- 頻道設定/外掛解析會縮小到擁有所要求頻道 id 的外掛
- 明確的提供者設定/執行階段解析會縮小到擁有所要求提供者 id 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動
  匯入；沒有啟動中繼資料的外掛只會透過更窄的啟用觸發載入

啟用規劃器同時公開供既有呼叫者使用的僅 id API，以及供診斷使用的
計畫 API。計畫項目會回報外掛被選取的原因，並將明確的
`activation.*` 提示與資訊清單所有權後備方案分開：

| 原因（來自 `activation.*` 提示）     | 原因（來自資訊清單所有權）                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| —（鉤子觸發器沒有提示變體）          | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

該原因切分是相容性邊界：既有外掛中繼資料
會繼續運作，而新程式碼可以偵測廣泛提示或後備行為，
且不需變更執行階段載入語意。

要求時間的執行階段預先載入若要求廣泛的 `all` 範圍，仍會從設定、
啟動規劃、已設定頻道、插槽和自動啟用規則，推導出明確有效的外掛 id 集合
（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。
如果推導出的集合為空，OpenClaw 會保持範圍為空，而不是擴大到
每個可探索的外掛。

設定探索會優先使用描述元擁有的 id，例如 `setup.providers` 與
`setup.cliBackends`，以便在退回到仍需要設定時間執行階段鉤子的
外掛 `setup-api` 之前縮小候選外掛。提供者設定清單會使用資訊清單
`providerAuthChoices`、描述元衍生的設定選項，以及安裝目錄中繼資料，
而不載入提供者執行階段。明確的 `setup.requiresRuntime: false`
是僅描述元的截斷點；省略 `requiresRuntime` 會保留舊版
setup-api 後備方案以維持相容性。如果有多個已探索外掛宣告相同的
正規化設定提供者或命令列介面後端 id，設定查找會拒絕模稜兩可的
擁有者，而不是依賴探索順序。當設定執行階段確實執行時，登錄表診斷會回報
`setup.providers` / `setup.cliBackends` 與 setup-api 實際註冊的
提供者或命令列介面後端之間的漂移，但不會封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會在牆鐘時間視窗後方快取外掛探索結果或直接資訊清單登錄表
資料。安裝、資訊清單編輯，以及載入路徑變更，必須在下一次明確中繼資料讀取
或快照重建時可見。資訊清單檔案剖析器會保留一個有界檔案簽章快取，
其鍵由已開啟的資訊清單路徑加上裝置/inode、大小，以及 mtime/ctime 組成；
該快取只會避免重新剖析未變更的位元組，且不得快取探索、登錄表、
擁有者或政策答案。

安全的中繼資料快速路徑是明確物件所有權，而不是隱藏快取。
閘道啟動熱路徑應該沿著呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、
衍生的 `PluginLookUpTable`，或明確的資訊清單登錄表。設定驗證、
啟動自動啟用、外掛啟動程序，以及提供者選擇，可以在這些物件代表目前設定與
外掛清單時重用它們。設定查找仍會依需求重建資訊清單中繼資料，
除非特定設定路徑收到明確的資訊清單登錄表；請將其保留為冷路徑後備方案，
而不是加入隱藏查找快取。當輸入變更時，請重建並取代快照，而不是修改它或
保留歷史副本。對作用中外掛登錄表的檢視與內建頻道啟動輔助程式，應從目前的
登錄表/root 重新計算。短生命週期 map 可在單次呼叫中用於去重工作或
防護重入；它們不得成為程序中繼資料快取。

對於外掛載入，持久快取層是執行階段載入。當程式碼或已安裝成品實際載入時，
它可以重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄表
- 用於避免重複匯入相同執行階段介面的 jiti/模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複解析的短生命週期逐次呼叫 map

這些快取是資料平面實作細節。它們不得回答控制平面問題，例如
「哪個外掛擁有此提供者？」除非呼叫者刻意要求執行階段載入。

不要為下列項目加入持久或牆鐘時間快取：

- 探索結果
- 直接資訊清單登錄表
- 從已安裝外掛索引重建的資訊清單登錄表
- 提供者擁有者查找、模型抑制、提供者政策，或公開成品
  中繼資料
- 任何其他資訊清單衍生答案，其中變更的資訊清單、已安裝索引，
  或載入路徑應在下一次中繼資料讀取時可見

從持久化已安裝外掛索引重建資訊清單中繼資料的呼叫者，會依需求重建該登錄表。
已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄表模型

已載入外掛不會直接修改任意核心全域。它們會註冊到中央外掛登錄表
（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），該登錄表會追蹤外掛記錄
（身分、來源、origin、狀態、診斷），以及每種能力的陣列：工具、舊版鉤子與具型別鉤子、
頻道、提供者、閘道 RPC 處理器、HTTP 路由、命令列介面註冊器、
背景服務、外掛擁有的命令，以及數十種更多具型別提供者家族
（語音、嵌入、影像/影片/音樂生成、網頁擷取/搜尋、代理程式測試框架、
工作階段動作等等）。

核心功能接著會從該登錄表讀取，而不是直接與外掛模組溝通。這讓載入保持單向：

- 外掛模組 -> 登錄表註冊
- 核心執行階段 -> 登錄表消費

這種分離對可維護性很重要。這表示多數核心介面只需要一個整合點：
「讀取登錄表」，而不是「為每個外掛模組做特殊處理」。

## 對話綁定回呼

綁定對話的外掛可以在核准被解析時做出反應。

使用 `api.onConversationBindingResolved(...)` 在綁定要求被核准或拒絕後接收回呼：

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

回呼承載欄位：

- `status`: `"approved"` 或 `"denied"`
- `decision`: `"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`: 已核准要求的已解析綁定
- `request`: 原始要求摘要、分離提示、傳送者 id，以及
  對話中繼資料

此回呼僅用於通知。它不會變更誰被允許綁定
對話，且會在核心核准處理完成後執行。

## 提供者執行階段鉤子

提供者外掛有三層：

- **資訊清單中繼資料**，用於低成本的執行前查找：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`，以及 `channelEnvVars`。
- **設定時間鉤子**：`catalog`（舊版 `discovery`）加上
  `applyConfigDefaults`。
- **執行階段鉤子**：40 多個選用鉤子，涵蓋驗證、模型解析、
  串流包裝、思考層級、重播政策，以及用量端點。請參閱
  [鉤子順序與用法](#hook-order-and-usage)。

OpenClaw 仍然擁有通用代理程式迴圈、容錯移轉、逐字稿處理，以及
工具政策。這些鉤子是提供者特定行為的擴充介面，不需要完整的
自訂推論傳輸。

使用資訊清單 `setup.providers[].envVars`，當提供者具備以環境變數為基礎的認證，而通用的驗證／狀態／模型選擇器路徑應該在不載入外掛執行階段的情況下看見這些認證時使用。已棄用的 `providerAuthEnvVars` 在棄用期間仍會由相容性配接器讀取，而使用它的非內建外掛會收到資訊清單診斷。當某個提供者 ID 應該重用另一個提供者 ID 的環境變數、驗證設定檔、以設定為基礎的驗證，以及 API 金鑰 onboarding 選項時，請使用資訊清單 `providerAuthAliases`。當 onboarding／驗證選項命令列介面介面應該在不載入提供者執行階段的情況下知道提供者的選項 ID、群組標籤，以及簡單的單旗標驗證接線時，請使用資訊清單 `providerAuthChoices`。保留提供者執行階段 `envVars` 用於面向操作者的提示，例如 onboarding 標籤或 OAuth 用戶端 ID／用戶端密鑰設定變數。

當通道具備由環境變數驅動的驗證或設定，而通用 shell 環境後援、設定／狀態檢查，或設定提示應該在不載入通道執行階段的情況下看見時，請使用資訊清單 `channelEnvVars`。

### Hook 順序與用法

對於模型／提供者外掛，OpenClaw 會以大致以下順序呼叫 hook。
「使用時機」欄是快速決策指南。
OpenClaw 不再呼叫的僅供相容性的提供者欄位，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，已刻意不列於此處。

| 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型家族語意                                                                         |
| _(內建模型查找)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是外掛鉤子)_                                                                                                                         |
| `normalizeModelId`                | 在查找前正規化舊版或預覽模型 ID 別名                                                     | 提供者在解析標準模型前負責清理別名                                                                                 |
| `normalizeTransport`              | 在通用模型組裝前正規化提供者家族的 `api` / `baseUrl`                                      | 提供者負責同一傳輸家族中自訂提供者 ID 的傳輸清理                                                          |
| `normalizeConfig`                 | 在執行階段/提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要與外掛同置的設定清理；內建 Google 家族輔助工具也會為受支援的 Google 設定項目提供備援   |
| `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性改寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| `resolveConfigApiKey`             | 在載入執行階段驗證前解析設定提供者的環境標記驗證                                       | 提供者公開自己的環境標記 API 金鑰解析鉤子                                                                                |
| `resolveSyntheticAuth`            | 顯示本機/自託管或設定支援的驗證，而不持久化明文                                   | 提供者可以使用合成/本機憑證標記運作                                                                                 |
| `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；對於命令列介面/應用程式擁有的憑證，預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；在資訊清單中宣告 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留位置降到環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先權的合成預留位置設定檔                                                                 |
| `resolveDynamicModel`             | 對尚未在本機登錄檔中的提供者擁有模型 ID 進行同步備援                                       | 提供者接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終改寫                                               | 提供者需要傳輸改寫，但仍使用核心傳輸                                                                             |
| `normalizeToolSchemas`            | 在嵌入式執行器看到工具結構描述前正規化它們                                                    | 提供者需要傳輸家族結構描述清理                                                                                                |
| `inspectToolSchemas`              | 正規化後顯示提供者擁有的結構描述診斷                                                  | 提供者需要關鍵字警告，而不讓核心學習提供者特定規則                                                                 |
| `resolveReasoningOutputMode`      | 選擇原生與標記式推理輸出合約                                                              | 提供者需要標記式推理/最終輸出，而不是原生欄位                                                                         |
| `prepareExtraParams`              | 在通用串流選項包裝器前進行請求參數正規化                                              | 提供者需要預設請求參數或每個提供者的參數清理                                                                           |
| `createStreamFn`                  | 以自訂傳輸完全取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/主體/模型相容性包裝器，而不是自訂傳輸                                                          |
| `resolveTransportTurnState`       | 附加每回合原生傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸傳送提供者原生回合身分                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或備援政策                                                               |
| `formatApiKey`                    | 驗證設定檔格式化器：已儲存設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| `refreshOAuth`                    | OAuth 重新整理覆寫，用於自訂重新整理端點或重新整理失敗政策                                  | 提供者不符合共用的 OpenClaw 重新整理器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者在重新整理失敗後需要提供者擁有的驗證修復指引                                                                      |
| `matchesContextOverflowError`     | 提供者擁有的內容視窗溢位比對器                                                                 | 提供者有通用啟發式會漏掉的原始溢位錯誤                                                                                |
| `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可以將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| `isCacheTtlEligible`              | 代理/回程提供者的提示快取政策                                                               | 提供者需要代理特定的快取 TTL 閘控                                                                                                |
| `buildMissingAuthMessage`         | 通用缺少驗證復原訊息的替代內容                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| `augmentModelCatalog`             | 在探索後附加的合成/最終目錄列（已淘汰，見下方）                                  | 提供者需要在 `models list` 和選擇器中提供合成的向前相容列                                                                     |
| `resolveThinkingProfile`          | 模型特定的 `/think` 層級組、顯示標籤和預設值                                                 | 提供者為選定模型公開自訂思考階梯或二元標籤                                                                 |
| `isBinaryThinking`                | 開/關推理切換相容性鉤子                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 提供者只希望部分模型支援 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性鉤子                                                                      | 提供者擁有模型家族的預設 `/think` 政策                                                                                      |
| `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的現代模型比對器                                              | 提供者擁有即時/煙霧測試偏好模型比對                                                                                             |
| `prepareRuntimeAuth`              | 在推論前將已設定憑證交換為實際執行階段權杖/金鑰                       | 提供者需要權杖交換或短期請求憑證                                                                             |
| `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的用量/計費憑證                                     | 提供者需要自訂用量/配額權杖剖析或不同的用量憑證                                                               |
| `fetchUsageSnapshot`              | 在驗證解析後擷取並正規化提供者特定的用量/配額快照                             | 提供者需要提供者特定的用量端點或承載剖析器                                                                           |
| `createEmbeddingProvider`         | 為記憶/搜尋建構由提供者擁有的嵌入配接器                                                     | 記憶嵌入行為屬於提供者外掛                                                                                    |
| `buildReplayPolicy`               | 傳回控制提供者逐字稿處理方式的重播政策                                        | 提供者需要自訂逐字稿政策（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷史                                                        | 提供者需要共享壓縮輔助工具之外的提供者特定重播重寫                                                             |
| `validateReplayTurns`             | 在嵌入式執行器前進行最終重播回合驗證或重塑                                           | 提供者傳輸在通用清理後需要更嚴格的回合驗證                                                                    |
| `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為作用中時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的供應商外掛，然後再落到其他具備 hook 能力的供應商外掛，直到其中一個實際變更模型 ID 或傳輸/設定。這能讓別名/相容性供應商 shim 持續運作，而不需要呼叫端知道哪個內建外掛擁有該重寫。如果沒有供應商 hook 重寫受支援的 Google-family 設定項目，內建的 Google 設定正規化器仍會套用該相容性清理。

如果供應商需要完全自訂的 wire protocol 或自訂 request executor，那屬於另一類擴充。這些 hook 適用於仍在 OpenClaw 一般推論迴圈上執行的供應商行為。

`resolveUsageAuth` 會決定 OpenClaw 應呼叫 `fetchUsageSnapshot`，或是在使用量/狀態介面回退到通用認證解析。當供應商有使用量認證時，回傳 `{ token, accountId? }`；當供應商擁有的使用量驗證已處理該請求，且必須抑制通用 API 金鑰/OAuth 回退時，回傳 `{ handled: true }`；當供應商未處理使用量驗證時，回傳 `null` 或 `undefined`。

在 manifest 的 `providerUsageAuthEnvVars` 中宣告組織或帳單認證。這讓通用探索和祕密清理介面能識別它們，而不會把它們當成推論驗證候選項。

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

內建供應商外掛會組合上述 hook，以符合各供應商的目錄、驗證、思考、重播和使用量需求。權威的 hook 集合與各外掛一起位於 `extensions/` 下；此頁說明形態，而不是鏡像完整清單。

<AccordionGroup>
  <Accordion title="直通目錄供應商">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，讓它們可以在 OpenClaw 的靜態目錄之前公開上游
    模型 ID。
  </Accordion>
  <Accordion title="OAuth 和使用量端點供應商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配對，以擁有權杖交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="重播和逐字稿清理系列">
    共用具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓供應商可透過
    `buildReplayPolicy` 選用逐字稿政策，而不是每個外掛
    重新實作清理。
  </Accordion>
  <Accordion title="僅目錄供應商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助工具">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位於
    Anthropic 外掛的公開 `api.ts` / `contract-api.ts` 介面
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位於
    通用 SDK。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

外掛可以透過 `api.runtime` 存取選定的核心輔助工具。對於 TTS：

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

注意：

- `textToSpeech` 會回傳檔案/語音備註介面的正常核心 TTS 輸出 payload。
- 使用核心 `messages.tts` 設定與供應商選擇。
- 回傳 PCM audio buffer + sample rate。外掛必須為供應商重新取樣/編碼。
- `listVoices` 對每個供應商而言是選用的。將它用於供應商擁有的語音選擇器或設定流程。
- 語音清單可包含更豐富的中繼資料，例如地區設定、性別和人格標籤，供具備供應商感知能力的選擇器使用。
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

注意：

- 將 TTS 政策、回退和回覆遞送保留在核心。
- 使用語音供應商處理供應商擁有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 偏好的擁有權模型是以公司為導向：一個供應商外掛可以擁有
  文字、語音、影像和未來媒體供應商，隨著 OpenClaw 加入這些
  能力合約。

對於影像/音訊/影片理解，外掛會註冊一個具型別的
媒體理解供應商，而不是通用 key/value bag：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意：

- 將 orchestration、回退、設定和頻道接線保留在核心。
- 將供應商行為保留在供應商外掛。
- 增量擴充應保持具型別：新的選用方法、新的選用
  結果欄位、新的選用能力。
- 影片生成已遵循相同模式：
  - 核心擁有能力合約和執行階段輔助工具
  - 供應商外掛註冊 `api.registerVideoGenerationProvider(...)`
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
或較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意：

- `api.runtime.mediaUnderstanding.*` 是影像/音訊/影片理解的偏好共用介面。
- `extractStructuredWithModel(...)` 是面向外掛的介面，用於有界的、
  供應商擁有、以影像優先的擷取。至少包含一個影像輸入；
  文字輸入是補充情境。產品外掛擁有自己的路由和
  schema，而 OpenClaw 擁有供應商/執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）和供應商回退順序。
- 當沒有產生轉錄輸出時（例如略過/不支援的輸入），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留作為相容性別名。

外掛也可以透過 `api.runtime.subagent` 啟動背景子代理執行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意：

- `provider` 和 `model` 是每次執行的選用覆寫，不是持久的 session 變更。
- OpenClaw 只會對受信任呼叫端採用這些覆寫欄位。
- 對於外掛擁有的回退執行，操作員必須使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定 canonical `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的外掛子代理執行仍可運作，但覆寫請求會被拒絕，而不是靜默回退。
- 外掛建立的子代理 session 會標記建立該 session 的外掛 ID。回退 `api.runtime.subagent.deleteSession(...)` 只能刪除這些所屬 session；任意 session 刪除仍需要管理員範圍的閘道請求。

對於網頁搜尋，外掛可以使用共用執行階段輔助工具，而不是
深入代理工具接線：

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

注意：

- 將供應商選擇、認證解析和共用請求語義保留在核心。
- 使用網頁搜尋供應商處理供應商特定的搜尋傳輸。
- `api.runtime.webSearch.*` 是功能/頻道外掛的偏好共用介面，可在不依賴代理工具 wrapper 的情況下取得搜尋行為。

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

- `generate(...)`：使用已設定的影像生成供應商鏈生成影像。
- `listProviders(...)`：列出可用的影像生成供應商及其能力。

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
- `auth`：必要，`"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證／網路鉤子驗證。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `handleUpgrade`：同一路由上 WebSocket 升級請求的選用處理器。
- `replaceExisting`：選用。允許同一個外掛取代自己既有的路由註冊。
- `handler`：當路由已處理該請求時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，且會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非 `replaceExisting: true`，否則相同的 `path + match` 衝突會被拒絕，且一個外掛不能取代另一個外掛的路由。
- 不同 `auth` 層級的重疊路由會被拒絕。請只在相同驗證層級上保留 `exact`/`prefix` 遞落鏈。
- `auth: "plugin"` 路由不會自動接收操作者執行階段範圍。它們用於外掛管理的網路鉤子／簽章驗證，而不是具特權的閘道輔助呼叫。
- `auth: "gateway"` 路由會在閘道請求執行階段範圍內執行。預設介面（`gatewayRuntimeScopeSurface: "write-default"`）刻意保持保守：
  - shared-secret bearer 驗證（`gateway.auth.mode = "token"` / `"password"`）以及任何非可信代理驗證方法都只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes`
  - 沒有明確 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端也會保留舊有的僅 `operator.write` 介面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端會改為取得宣告的範圍
  - 路由可以選擇加入 `gatewayRuntimeScopeSurface: "trusted-operator"`，以便對帶有身分的驗證模式一律遵循 `x-openclaw-scopes`（標頭不存在時則退回完整的命令列介面預設範圍集合）
- 實務規則：不要假設閘道驗證的外掛路由就是隱含管理員介面。如果你的路由需要僅限管理員的行為，請選擇加入 `trusted-operator` 範圍介面、要求帶有身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用較窄的 SDK 子路徑，而不是單體式的 `openclaw/plugin-sdk` 根
彙整匯出。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊基元                                      |
| `openclaw/plugin-sdk/channel-core`  | 通道進入點／建置輔助工具                          |
| `openclaw/plugin-sdk/core`          | 通用共享輔助工具與總括合約                        |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`）  |

通道外掛會從一組較窄的接縫中選用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 與 `channel-actions`。核准行為應整併到單一
`approvalCapability` 合約，而不是混用不相關的外掛欄位。請參閱[通道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於對應的聚焦 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性彙整匯出。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型通道輔助 facade、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
以及 `openclaw/plugin-sdk/infra-runtime` 是為舊外掛保留的已棄用相容性 shim。
新程式碼應改為匯入較窄的通用基元。
</Info>

儲存庫內部進入點（依各內建外掛套件根目錄）：

- `index.js` — 內建外掛進入點
- `api.js` — 輔助工具／型別彙整匯出
- `runtime-api.js` — 僅限執行階段的彙整匯出
- `setup-entry.js` — 設定外掛進入點

外部外掛應只匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要從核心或另一個外掛
匯入其他外掛套件的 `src/*`。由 facade 載入的進入點會在存在時優先使用有效的
執行階段設定快照，然後才退回磁碟上解析出的設定檔。

如 `image-generation`、`media-understanding` 與 `speech` 這類能力專屬子路徑，
是因為目前內建外掛正在使用它們。它們不會自動成為長期凍結的外部合約；
依賴它們時，請查看相關 SDK 參考頁面。

## 訊息工具 schema

外掛應負責通道專屬的 `describeMessageTool(...)` schema 貢獻，用於反應、已讀與投票等非訊息基元。
共享傳送呈現應使用通用的 `MessagePresentation` 合約，
而不是供應商原生的按鈕、元件、區塊或卡片欄位。
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)以了解合約、
遞落規則、供應商對應，以及外掛作者檢查清單。

具傳送能力的外掛會透過訊息能力宣告它們能呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於釘選傳遞請求

核心會決定要原生呈現該呈現內容，或將其降級為文字。
不要從通用訊息工具暴露供應商原生 UI 逃生口。
舊版原生 schema 的已棄用 SDK 輔助工具仍會為既有第三方外掛匯出，
但新外掛不應使用它們。

## 通道目標解析

通道外掛應負責通道專屬的目標語意。請讓共享的輸出主機保持通用，並使用訊息配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查找前，決定正規化後的目標應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心某個輸入是否應跳過目錄搜尋，直接進行類似 id 的解析。
- `messaging.targetResolver.reservedLiterals` 會列出該供應商的通道／工作階段參照裸字。解析會先保留已設定的目錄項目，再拒絕保留字面值，然後在目錄未命中時失敗關閉。
- `messaging.targetResolver.resolveTarget(...)` 是外掛遞落，用於核心在正規化後或目錄未命中後，需要最終由供應商負責的解析時。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責建構供應商專屬的工作階段路由。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋對等方／群組前發生的分類決策。
- 使用 `looksLikeId` 檢查「將此視為明確／原生目標 id」。
- 使用 `resolveTarget` 作為供應商專屬正規化遞落，而不是用於廣泛的目錄搜尋。
- 將聊天 id、討論串 id、JID、帳號代稱與房間 id 等供應商原生 id 保留在 `target` 值或供應商專屬參數中，而不是放在通用 SDK 欄位裡。

## 設定支援的目錄

從設定衍生目錄項目的外掛，應將該邏輯保留在外掛中，並重用
`openclaw/plugin-sdk/directory-runtime` 的共享輔助工具。

當通道需要由設定支援的對等方／群組時，請使用此做法，例如：

- 由 allowlist 驅動的私訊對等方
- 已設定的通道／群組對應
- 帳號範圍的靜態目錄遞落

`directory-runtime` 中的共享輔助工具只處理通用操作：

- 查詢篩選
- 限制套用
- 去重／正規化輔助工具
- 建立 `ChannelDirectoryEntry[]`

通道專屬的帳號檢查與 id 正規化應留在外掛實作中。

## 供應商目錄

供應商外掛可以透過
`registerProvider({ catalog: { run(...) { ... } } })`
定義用於推論的模型目錄。

`catalog.run(...)` 會回傳與 OpenClaw 寫入
`models.providers` 相同的形狀：

- `{ provider }` 用於單一供應商項目
- `{ providers }` 用於多個供應商項目

當外掛負責供應商專屬模型 id、基底 URL 預設值，或受驗證保護的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw 內建隱含供應商的合併時機：

- `simple`：純 API key 或由環境驅動的供應商
- `profile`：驗證設定檔存在時出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：最後一輪，在其他隱含供應商之後

後面的供應商會在 key 衝突時勝出，因此外掛可以有意以相同供應商 id 覆寫內建供應商項目。

外掛也可以透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是清單／說明／挑選器介面的前進路徑，並支援
`text`、`voice`、`image_generation`、`video_generation` 與 `music_generation`
列。供應商外掛仍負責即時端點呼叫、權杖交換與
供應商回應對應；核心負責通用列形狀、來源標籤與
媒體工具說明格式。媒體生成供應商註冊會從 `defaultModel`、`models` 與
`capabilities` 自動合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名運作，但會發出棄用警告
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
  並發出警告
- `augmentModelCatalog` 已棄用；內建供應商應透過 `registerModelCatalogProvider`
  發布補充列

## 唯讀通道檢查

如果你的外掛註冊了通道，建議在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證已完整具體化，並可在必要密鑰缺失時快速失敗。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor／設定
  修復流程等唯讀命令路徑，不應只是為了描述設定就需要具體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 與 `configured`。
- 在相關時包含憑證來源／狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要只為了回報唯讀可用性而回傳原始權杖值。回傳 `tokenStatus: "available"`（以及對應的來源欄位）對狀態類命令就已足夠。
- 當憑證透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這讓唯讀命令可以回報「已設定，但在此命令路徑中不可用」，而不是當機或誤報帳號未設定。

## 套件包

外掛目錄可以包含帶有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個外掛。如果該套件包列出多個 extension，外掛
id 會變成 `<manifestOrPackageName>/<fileBase>`（manifest id 存在時優先；否則使用未加 scope 的 `package.json` 名稱）。

如果你的外掛匯入 npm 相依套件，請在該目錄中安裝它們，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全護欄：每個 `openclaw.extensions` 項目在符號連結解析後，都必須保留在外掛
目錄內。逃逸出套件目錄的項目會被拒絕。

安全注意事項：`openclaw plugins install` 會使用專案本機的 `npm install --omit=dev --ignore-scripts`
安裝外掛相依套件（沒有生命週期腳本，
執行階段沒有開發相依套件），並忽略繼承的全域 npm 安裝設定。
請讓外掛相依套件樹保持「純 JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。
當 OpenClaw 需要已停用頻道外掛的設定介面，或
當某個頻道外掛已啟用但尚未設定時，它會載入 `setupEntry`
而不是完整外掛進入點。當你的主要外掛進入點也會接線工具、鉤子或其他僅限執行階段的
程式碼時，這能讓啟動和設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以讓頻道外掛在閘道的監聽前啟動階段，也選用相同的 `setupEntry`
路徑，即使該頻道已經設定完成。

只有在 `setupEntry` 完整涵蓋閘道開始監聽前必須存在的啟動介面時，
才使用此選項。實務上，這表示設定進入點
必須註冊啟動所依賴的每個頻道所擁有能力，例如：

- 頻道註冊本身
- 任何必須在閘道開始監聽前可用的 HTTP 路由
- 任何必須在同一時間窗口中存在的閘道方法、工具或服務

如果你的完整進入點仍擁有任何必要的啟動能力，請不要啟用
此旗標。讓外掛保持預設行為，並讓 OpenClaw 在啟動期間載入
完整進入點。

內建頻道也可以發布僅設定的合約介面輔助工具，讓核心
在載入完整頻道執行階段前查詢。目前的設定
升級介面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要在不載入完整外掛進入點的情況下，將舊版單一帳號頻道
設定升級到 `channels.<id>.accounts.*` 時，會使用該介面。
Matrix 是目前的內建範例：當具名帳號已存在時，它只會將 auth/bootstrap 鍵移入
具名升級帳號，並且可以保留已設定的非標準預設帳號鍵，而不是一律建立
`accounts.default`。

這些設定修補配接器讓內建合約介面探索保持延遲。匯入
時間保持輕量；升級介面只會在首次使用時載入，而不是在模組匯入時
重新進入內建頻道啟動。

當這些啟動介面包含閘道 RPC 方法時，請將它們保留在
外掛專屬前綴上。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍保留使用，並且一律解析
為 `operator.admin`，即使外掛請求較窄的範圍也是如此。

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

頻道外掛可以透過 `openclaw.channel` 宣告設定/探索中繼資料，並
透過 `openclaw.install` 宣告安裝提示。這能讓核心目錄不攜帶資料。

範例：

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

除了最小範例之外，實用的 `openclaw.channel` 欄位包括：

- `detailLabel`：較豐富的目錄/狀態介面所用的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於其上的較低優先級外掛/頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選取介面的文案控制
- `markdownCapable`：將頻道標記為支援 markdown，以供傳出格式化決策使用
- `exposure.configured`：設為 `false` 時，從已設定頻道清單介面隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定/組態選擇器隱藏該頻道
- `exposure.docs`：將頻道標記為文件導覽介面的內部/私人頻道
- `showConfigured` / `showInSetup`：為相容性仍接受的舊版別名；偏好使用 `exposure`
- `quickstartAllowFrom`：讓頻道選用標準 quickstart `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號存在，也要求明確帳號繫結
- `preferSessionLookupForAnnounceTarget`：解析公告目標時偏好工作階段查找

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM
registry 匯出）。將 JSON 檔案放在以下其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案應
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的頻道目錄項目和提供者安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開
正規化的安裝來源事實。
正規化事實會識別 npm spec 是精確版本還是浮動
選擇器、是否存在預期完整性中繼資料，以及是否也有本機
來源路徑可用。當目錄/套件身分已知時，若剖析出的 npm 套件名稱偏離該身分，
正規化事實會發出警告。
當 `defaultChoice` 無效或指向不可用的來源，以及 npm 完整性中繼資料存在但沒有有效 npm
來源時，也會發出警告。消費端應將 `installSource` 視為加成的選用欄位，讓
手工建立的項目和目錄 shim 不必合成它。
這讓 onboarding 和診斷能在不匯入外掛執行階段的情況下說明來源平面狀態。

官方外部 npm 項目應偏好精確的 `npmSpec` 加上
`expectedIntegrity`。裸套件名稱和 dist-tag 仍可為
相容性運作，但它們會顯示來源平面警告，讓目錄可以朝向
固定版本、完整性檢查的安裝移動，而不破壞現有外掛。
當 onboarding 從本機目錄路徑安裝時，會記錄受管理外掛
外掛索引項目，其中 `source: "path"`，並在可能時使用相對於工作區的
`sourcePath`。絕對操作載入路徑仍保留在
`plugins.load.paths`；安裝記錄會避免將本機工作站
路徑重複寫入長期組態。這讓本機開發安裝對
來源平面診斷可見，而不增加第二個原始檔案系統路徑揭露
介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝
來源真相，且可在不載入外掛執行階段模組的情況下重新整理。
即使外掛 manifest 缺失或無效，其 `installRecords` 對應也會保持持久；
其 `plugins` 酬載則是可重建的 manifest 檢視。

## 情境引擎外掛

情境引擎外掛擁有用於攝取、組裝和壓縮的工作階段情境協調。
從你的外掛使用 `api.registerContextEngine(id, factory)` 註冊它們，
然後用 `plugins.slots.contextEngine` 選取啟用中的引擎。

當你的外掛需要取代或擴充預設情境管線，而不只是新增記憶搜尋或鉤子時，
請使用此功能。

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

factory `ctx` 會公開選用的 `config`、`agentDir` 和 `workspaceDir`
值，用於建構時初始化。

當啟用中的 harness 具有持久後端執行緒時，`assemble()` 可以回傳 `contextProjection`。
若為舊版每回合投影，請省略它。當組裝後的情境應
一次性注入後端執行緒，並在 epoch 變更前重複使用時，回傳
`{ mode: "thread_bootstrap", epoch }`。在引擎的語義情境變更後變更
epoch，例如在引擎擁有的壓縮階段之後。Host 可以在 thread-bootstrap 投影中保留工具呼叫中繼資料、輸入
形狀和已遮蔽的工具結果，讓新的
後端執行緒維持工具連續性，而不複製帶有原始祕密的
酬載。

如果你的引擎**不**擁有壓縮演算法，請保持 `compact()`
已實作並明確委派它：

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

## 新增能力

當外掛需要的行為不符合目前 API 時，請不要用私人 reach-in 繞過
外掛系統。請新增缺少的能力。

建議順序：

1. **定義核心合約。** 決定核心應擁有哪些共享行為：
   policy、fallback、config merge、lifecycle、channel-facing semantics，以及
   runtime helper shape。
2. **新增具型別的外掛註冊/執行階段介面。** 使用最小且有用的具型別
   能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. **接線核心 + 頻道/功能消費端。** 頻道和功能外掛
   應透過核心消費新能力，而不是直接匯入供應商
   實作。
4. **註冊供應商實作。** 接著由供應商外掛針對該能力註冊其
   後端。
5. **新增合約覆蓋。** 新增測試，讓擁有權和註冊形狀
   隨時間保持明確。

這就是 OpenClaw 如何在保持有主見的同時，不變成硬編碼到單一
提供者世界觀。請參閱 [能力 Cookbook](/zh-TW/plugins/adding-capabilities)
以取得具體檔案檢查清單和完整範例。

### 能力檢查清單

當你新增能力時，實作通常應一起觸及這些
介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心執行器/執行階段輔助工具
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄連接
- 當功能/通道外掛需要取用時，`src/plugins/runtime/*` 中的外掛執行階段暴露
- `src/test-utils/plugin-registration.ts` 中的擷取/測試輔助工具
- `src/plugins/contracts/registry.ts` 中的所有權/合約斷言
- `docs/` 中的操作員/外掛文件

如果缺少其中任一介面，通常表示該能力尚未完全整合。

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

合約測試模式（`src/plugins/contracts/registry.ts` 會暴露所有權查找，例如 `providerContractPluginIds`；測試會斷言外掛的 `contracts.videoGenerationProviders` 清單符合其實際註冊的內容）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這讓規則保持簡單：

- 核心擁有能力合約 + 編排
- 供應商外掛擁有供應商實作
- 功能/通道外掛取用執行階段輔助工具
- 合約測試讓所有權保持明確

## 相關

- [外掛架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
