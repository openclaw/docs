---
read_when:
    - 實作提供者執行階段掛鉤、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或註冊表狀態
    - 新增 Plugin 能力或脈絡引擎 Plugin
summary: Plugin 架構內部：載入管線、註冊表、執行階段掛鉤、HTTP 路由與參考表格
title: Plugin 架構內部機制
x-i18n:
    generated_at: "2026-04-30T03:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開能力模型、Plugin 形狀，以及擁有權/執行
合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是
內部機制的參考：載入管線、註冊表、執行階段 hook、
Gateway HTTP 路由、匯入路徑與結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下動作：

1. 探索候選 Plugin 根目錄
2. 讀取原生或相容套件 manifest 與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化 Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 判定每個候選項目的啟用狀態
6. 載入已啟用的原生模組：已建置的 bundled 模組使用原生載入器；
   未建置的原生 Plugin 使用 jiti
7. 呼叫原生 `register(api)` hook，並將註冊內容收集到 Plugin 註冊表
8. 將註冊表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名 — 載入器會解析存在的項目（`def.register ?? def.activate`），並在同一時間點呼叫它。所有 bundled Plugin 都使用 `register`；新的 Plugin 請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當進入點逃逸 Plugin 根目錄、路徑可被全世界寫入，或非 bundled Plugin 的路徑擁有權看起來可疑時，候選項目會被封鎖。

### Manifest 優先行為

manifest 是控制平面的真相來源。OpenClaw 使用它來：

- 識別 Plugin
- 探索宣告的通道/Skills/設定結構描述或套件能力
- 驗證 `plugins.entries.<id>.config`
- 補充 Control UI 標籤/預留位置
- 顯示安裝/目錄中繼資料
- 在不載入 Plugin 執行階段的情況下，保留低成本的啟用與設定描述子

對於原生 Plugin，執行階段模組是資料平面部分。它會註冊實際行為，例如 hook、工具、命令或供應商流程。

選用的 manifest `activation` 與 `setup` 區塊會留在控制平面。
它們是用於啟用規劃與設定探索的純中繼資料描述子；
它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
第一批即時啟用消費者現在會使用 manifest 命令、通道與供應商提示，
在更廣泛的註冊表具體化之前縮小 Plugin 載入範圍：

- CLI 載入會縮小到擁有所要求主要命令的 Plugin
- 通道設定/Plugin 解析會縮小到擁有所要求
  通道 id 的 Plugin
- 明確的供應商設定/執行階段解析會縮小到擁有所要求
  供應商 id 的 Plugin
- Gateway 啟動規劃會使用 `activation.onStartup` 來處理明確的啟動
  匯入與啟動退出；隨著 OpenClaw 擺脫隱含啟動匯入，每個 Plugin
  都應宣告它，而沒有靜態能力中繼資料且沒有 `activation.onStartup`
  的 Plugin，仍會為了相容性使用已棄用的隱含啟動 sidecar fallback

啟用規劃器會同時公開既有呼叫者使用的僅 ids API，以及
新診斷使用的計畫 API。計畫項目會回報 Plugin 被選取的原因，
並將明確的 `activation.*` 規劃器提示，與 manifest 擁有權
fallback（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools` 與 hook）分開。這個原因拆分就是相容性邊界：
既有 Plugin 中繼資料會持續運作，而新程式碼可以偵測寬泛提示
或 fallback 行為，且不改變執行階段載入語意。

設定探索現在會優先使用描述子擁有的 id，例如 `setup.providers` 與
`setup.cliBackends`，在 fallback 到 `setup-api` 之前先縮小候選 Plugin，
供仍需要設定時執行階段 hook 的 Plugin 使用。供應商設定清單會使用
manifest `providerAuthChoices`、由描述子衍生的設定選項，以及安裝目錄
中繼資料，而不載入供應商執行階段。明確的 `setup.requiresRuntime: false`
是純描述子的截止點；省略的 `requiresRuntime` 會保留舊版 setup-api
fallback 以維持相容性。如果多個已探索的 Plugin 宣告相同的正規化
設定供應商或 CLI 後端 id，設定查詢會拒絕模稜兩可的擁有者，而不是
依賴探索順序。當設定執行階段確實執行時，註冊表診斷會回報
`setup.providers` / `setup.cliBackends` 與 setup-api 所註冊的供應商或 CLI
後端之間的偏差，但不會封鎖舊版 Plugin。

### Plugin 快取邊界

OpenClaw 不會在依賴時間視窗的背後快取 Plugin 探索結果或直接 manifest 註冊表
資料。安裝、manifest 編輯與載入路徑變更，必須在下一次明確中繼資料讀取或快照重建時可見。
manifest 檔案解析器可以保留一個有界的檔案簽章快取，鍵值由已開啟的
manifest 路徑、inode、大小與時間戳記組成；該快取只會避免重新解析未變更的位元組，
而不得快取探索、註冊表、擁有者或策略答案。

安全的中繼資料快速路徑是明確的物件擁有權，而不是隱藏快取。
Gateway 啟動熱路徑應該透過呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、
衍生的 `PluginLookUpTable`，或明確的 manifest 註冊表。設定驗證、啟動自動啟用、
Plugin bootstrap 與供應商選擇可以重用這些物件，只要它們代表目前的設定與
Plugin 清單。設定查詢仍會按需重建 manifest 中繼資料，除非特定設定路徑收到
明確的 manifest 註冊表；請將它保留為冷路徑 fallback，而不是新增隱藏查詢快取。
當輸入變更時，請重建並取代快照，而不是變更它或保留歷史副本。
作用中 Plugin 註冊表的檢視，以及 bundled 通道 bootstrap 輔助工具，
應從目前的註冊表/根目錄重新計算。短生命週期的 map 可在單次呼叫內用來去重工作或防止重入；
它們不得變成程序中繼資料快取。

對於 Plugin 載入，持久快取層是執行階段載入。它可以在實際載入程式碼或已安裝成品時
重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段註冊表
- jiti/模組快取，以及用於避免重複匯入相同執行階段介面的公開介面載入器快取
- 已安裝 Plugin 成品的執行階段相依鏡像與檔案系統快取
- 用於路徑正規化或重複解析的短生命週期逐次呼叫 map

這些快取是資料平面的實作細節。它們不得回答控制平面問題，例如「哪個 Plugin 擁有這個供應商？」
除非呼叫者刻意要求執行階段載入。

不要為下列項目新增持久或依賴時間的快取：

- 探索結果
- 直接 manifest 註冊表
- 從已安裝 Plugin 索引重建的 manifest 註冊表
- 供應商擁有者查詢、模型抑制、供應商策略或公開成品中繼資料
- 任何其他由 manifest 衍生的答案，只要變更的 manifest、已安裝索引或載入路徑
  應該在下一次中繼資料讀取時可見

從持久化已安裝 Plugin 索引重建 manifest 中繼資料的呼叫者，會按需重建該註冊表。
已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 註冊表模型

已載入的 Plugin 不會直接變更隨機核心全域狀態。它們會註冊到中央 Plugin 註冊表。

註冊表會追蹤：

- Plugin 記錄（身分、來源、原點、狀態、診斷）
- 工具
- 舊版 hook 與型別化 hook
- 通道
- 供應商
- Gateway RPC 處理器
- HTTP 路由
- CLI 註冊器
- 背景服務
- Plugin 擁有的命令

接著核心功能會從該註冊表讀取，而不是直接與 Plugin 模組對話。
這讓載入保持單向：

- Plugin 模組 -> 註冊表註冊
- 核心執行階段 -> 註冊表消費

這種分離對可維護性很重要。這表示多數核心介面只需要一個整合點：「讀取註冊表」，
而不是「對每個 Plugin 模組做特殊處理」。

## 對話繫結回呼

繫結對話的 Plugin 可以在核准結果被解析時做出反應。

使用 `api.onConversationBindingResolved(...)` 在繫結要求被核准或拒絕後接收回呼：

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

回呼 payload 欄位：

- `status`: `"approved"` 或 `"denied"`
- `decision`: `"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`: 已核准要求的已解析繫結
- `request`: 原始要求摘要、detach 提示、寄件者 id 與
  對話中繼資料

此回呼僅供通知。它不會變更誰被允許繫結
對話，且會在核心核准處理完成後執行。

## 供應商執行階段 hook

供應商 Plugin 有三層：

- **Manifest 中繼資料**，用於低成本的執行階段前查詢：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定時 hook**：`catalog`（舊版 `discovery`）加上
  `applyConfigDefaults`。
- **執行階段 hook**：40+ 個選用 hook，涵蓋驗證、模型解析、
  stream wrapping、thinking levels、重播策略與用量端點。請參閱
  [Hook 順序與用法](#hook-order-and-usage)下方的完整清單。

OpenClaw 仍然擁有通用代理迴圈、容錯移轉、逐字稿處理與
工具策略。這些 hook 是供應商特定行為的擴充介面，
不需要整個自訂推論傳輸。

當供應商具有以 env 為基礎的認證，且通用驗證/狀態/模型選擇器路徑應在不載入
Plugin 執行階段的情況下看到它們時，請使用 manifest `setup.providers[].envVars`。
已棄用的 `providerAuthEnvVars` 在棄用期間仍會由相容性 adapter 讀取，且使用它的
非 bundled Plugin 會收到 manifest 診斷。當一個供應商 id 應重用另一個供應商 id 的
env vars、驗證設定檔、設定支援的驗證與 API-key onboarding 選項時，請使用 manifest
`providerAuthAliases`。當 onboarding/auth-choice CLI 介面應在不載入供應商執行階段的情況下
知道供應商的選項 id、群組標籤與簡單單旗標驗證 wiring 時，請使用 manifest
`providerAuthChoices`。保留供應商執行階段
`envVars`，用於面向操作員的提示，例如 onboarding 標籤或 OAuth
client-id/client-secret 設定變數。

當通道具有 env 驅動的驗證或設定，且通用 shell-env fallback、設定/狀態檢查或設定提示
應在不載入通道執行階段的情況下看到它時，請使用 manifest `channelEnvVars`。

### Hook 順序與用法

對於模型/供應商 Plugin，OpenClaw 會大致依此順序呼叫 hook。
「何時使用」欄是快速決策指南。
相容性專用且 OpenClaw 不再呼叫的供應商欄位，例如
`ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，刻意未列在此處。

| #   | 掛鉤                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定實體化期間套用由提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型家族語意                                                                         |
| --  | _(內建模型查找)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是 Plugin 掛鉤)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找前正規化舊版或預覽模型 ID 別名                                                     | 提供者在標準模型解析前擁有別名清理                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前正規化提供者家族的 `api` / `baseUrl`                                      | 提供者擁有同一傳輸家族中自訂提供者 ID 的傳輸清理                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要與 Plugin 一起維護的設定清理；內建 Google 家族輔助工具也會支援受支援的 Google 設定項目   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流使用量相容性重寫                                               | 提供者需要由端點驅動的原生串流使用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者擁有由提供者管理的環境標記 API 金鑰解析；`amazon-bedrock` 也在此內建 AWS 環境標記解析器                  |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情況下顯示本機/自架或設定支援的驗證                                   | 提供者可搭配合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 疊加由提供者擁有的外部驗證設定檔；CLI/應用程式擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；在資訊清單中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留位置降到環境/設定支援的驗證之後                                      | 提供者儲存的合成預留位置設定檔不應取得優先權                                                                 |
| 11  | `resolveDynamicModel`             | 對尚未存在於本機登錄檔中的提供者擁有模型 ID 進行同步後援                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `contributeResolvedModelCompat`   | 為位於另一個相容傳輸後方的廠商模型提供相容性旗標                                  | 提供者可在代理傳輸上辨識自己的模型，而不接管提供者                                                       |
| 15  | `normalizeToolSchemas`            | 在嵌入式執行器看到工具結構描述前正規化它們                                                    | 提供者需要傳輸家族的結構描述清理                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後顯示由提供者擁有的結構描述診斷                                                  | 提供者想要關鍵字警告，而不讓核心學習提供者特定規則                                                                 |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出合約                                                              | 提供者需要標記式推理/最終輸出，而不是原生欄位                                                                         |
| 18  | `prepareExtraParams`              | 在通用串流選項包裝器前進行請求參數正規化                                              | 提供者需要預設請求參數或每個提供者的參數清理                                                                           |
| 19  | `createStreamFn`                  | 以自訂傳輸完全取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 在套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/本文/模型相容性包裝器，而不是自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加每輪原生傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸傳送提供者原生的輪次識別                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或後援政策                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：已儲存的設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 提供者不適用共用的 `pi-ai` 重新整理器                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者在重新整理失敗後需要由提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 由提供者擁有的脈絡視窗溢位比對器                                                                 | 提供者有通用啟發式會漏掉的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 由提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | 代理/回程提供者的提示快取政策                                                               | 提供者需要代理特定的快取 TTL 閘控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 在探索後附加合成/最終目錄列                                                          | 提供者需要 `models list` 和選擇器中的合成前向相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 等級集合、顯示標籤和預設值                                                 | 提供者為選定模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性掛鉤                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性掛鉤                                                                   | 提供者只想在部分模型上啟用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性掛鉤                                                                      | 提供者擁有模型家族的預設 `/think` 政策                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器與煙霧測試選擇的新式模型比對器                                              | 提供者擁有即時/煙霧測試偏好模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前將已設定的憑證交換為實際的執行階段權杖/金鑰                       | 提供者需要權杖交換或短期請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的使用量/計費憑證                                     | 提供者需要自訂的使用量/配額權杖解析，或不同的使用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在身分驗證解析後，擷取並正規化提供者專屬的使用量/配額快照                             | 提供者需要提供者專屬的使用量端點或酬載剖析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶/搜尋建置由提供者擁有的嵌入配接器                                                     | 記憶嵌入行為屬於提供者 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 傳回控制該提供者對話紀錄處理方式的重播原則                                        | 提供者需要自訂對話紀錄原則（例如，移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用對話紀錄清理後重寫重播歷史紀錄                                                        | 提供者需要超出共用 Compaction helper 的提供者專屬重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器之前進行最終重播輪次驗證或重塑                                           | 提供者傳輸需要在通用清理後進行更嚴格的輪次驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為作用中時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的供應商 Plugin，接著依序落到其他具備 hook 能力的供應商 Plugin，直到其中一個實際變更模型 ID 或傳輸/設定。這讓別名/相容性供應商 shim 能持續運作，而不需要呼叫端知道是哪個內建 Plugin 擁有該重寫。如果沒有供應商 hook 重寫受支援的 Google 系列設定項目，內建的 Google 設定正規化器仍會套用該相容性清理。

如果供應商需要完全自訂的線路協定或自訂請求執行器，那屬於另一類擴充。這些 hook 是供仍在 OpenClaw 一般推論迴圈上執行的供應商行為使用。

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

內建供應商 Plugin 會結合上述 hook，以符合各廠商的目錄、驗證、思考、重播和用量需求。權威的 hook 集位於 `extensions/` 下的各個 Plugin；本頁示範形態，而不是鏡像完整清單。

<AccordionGroup>
  <Accordion title="直通目錄供應商">
    OpenRouter、Kilocode、Z.AI、xAI 註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，因此它們可以在 OpenClaw 靜態目錄之前呈現上游
    模型 ID。
  </Accordion>
  <Accordion title="OAuth 和用量端點供應商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 搭配 `resolveUsageAuth` +
    `fetchUsageSnapshot`，以擁有權杖交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="重播和逐字稿清理系列">
    共用的命名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓供應商透過 `buildReplayPolicy` 選用
    逐字稿政策，而不是讓每個 Plugin
    重新實作清理。
  </Accordion>
  <Accordion title="僅目錄供應商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助工具">
    Beta 標頭、`/fast` / `serviceTier` 和 `context1m` 位於
    Anthropic Plugin 的公開 `api.ts` / `contract-api.ts` 接縫內
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是在
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

Plugin 可以透過 `api.runtime` 存取選定的核心輔助工具。以 TTS 為例：

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

- `textToSpeech` 會回傳一般核心 TTS 輸出承載，用於檔案/語音備註表面。
- 使用核心 `messages.tts` 設定和供應商選擇。
- 回傳 PCM 音訊緩衝區 + 取樣率。Plugin 必須為供應商重新取樣/編碼。
- `listVoices` 對每個供應商都是選用。可用於廠商擁有的聲音挑選器或設定流程。
- 聲音列表可以包含更豐富的中繼資料，例如語系、性別和個性標籤，以供具供應商感知能力的挑選器使用。
- OpenAI 和 ElevenLabs 目前支援電話語音。Microsoft 不支援。

Plugin 也可以透過 `api.registerSpeechProvider(...)` 註冊語音供應商。

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

- 將 TTS 政策、後援和回覆遞送保留在核心中。
- 使用語音供應商處理廠商擁有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 偏好的所有權模型是以公司為導向：隨著 OpenClaw 新增這些
  能力合約，一個廠商 Plugin 可以擁有文字、語音、影像和未來的媒體供應商。

對於影像/音訊/影片理解，Plugin 會註冊一個具型別的
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

注意：

- 將編排、後援、設定和頻道接線保留在核心中。
- 將廠商行為保留在供應商 Plugin 中。
- 加法式擴展應保持具型別：新的選用方法、新的選用
  結果欄位、新的選用能力。
- 影片生成已遵循相同模式：
  - 核心擁有能力合約和執行階段輔助工具
  - 廠商 Plugin 註冊 `api.registerVideoGenerationProvider(...)`
  - 功能/頻道 Plugin 使用 `api.runtime.videoGeneration.*`

對於媒體理解執行階段輔助工具，Plugin 可以呼叫：

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
```

對於音訊轉錄，Plugin 可以使用媒體理解執行階段
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

- `api.runtime.mediaUnderstanding.*` 是影像/音訊/影片理解的偏好共用表面。
- 使用核心媒體理解音訊設定（`tools.media.audio`）和供應商後援順序。
- 當未產生轉錄輸出時（例如略過/不支援的輸入），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作為相容性別名保留。

Plugin 也可以透過 `api.runtime.subagent` 啟動背景子代理執行：

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

- `provider` 和 `model` 是每次執行的選用覆寫，不是持久性的工作階段變更。
- OpenClaw 只會為受信任呼叫端採納這些覆寫欄位。
- 對於 Plugin 擁有的後援執行，操作員必須使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇啟用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任 Plugin 限制為特定的標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的 Plugin 子代理執行仍可運作，但覆寫請求會被拒絕，而不是靜默後援。
- Plugin 建立的子代理工作階段會標記建立該工作階段的 Plugin ID。後援 `api.runtime.subagent.deleteSession(...)` 只能刪除那些已擁有的工作階段；任意工作階段刪除仍需要具管理員範圍的 Gateway 請求。

對於網頁搜尋，Plugin 可以使用共用執行階段輔助工具，而不是
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

Plugin 也可以透過
`api.registerWebSearchProvider(...)` 註冊網頁搜尋供應商。

注意：

- 將供應商選擇、憑證解析和共用請求語意保留在核心中。
- 使用網頁搜尋供應商處理廠商專用搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為但不想依賴代理工具包裝器的功能/頻道 Plugin 的偏好共用表面。

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

## Gateway HTTP 路由

Plugin 可以使用 `api.registerHttpRoute(...)` 公開 HTTP 端點。

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

- `path`：Gateway HTTP 伺服器下的路由路徑。
- `auth`：必填。使用 `"gateway"` 要求一般 Gateway 驗證，或使用 `"plugin"` 進行 Plugin 管理的驗證/webhook 驗證。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選用。允許同一個 Plugin 取代其既有的路由註冊。
- `handler`：當路由已處理請求時回傳 `true`。

注意：

- `api.registerHttpHandler(...)` 已移除，並會導致 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 除非設定 `replaceExisting: true`，否則會拒絕完全相同的 `path + match` 衝突，而且一個 Plugin 不能取代另一個 Plugin 的路由。
- 會拒絕具有不同 `auth` 層級的重疊路由。請只在相同 auth 層級上保留 `exact`/`prefix` fallthrough 鏈。
- `auth: "plugin"` 路由**不會**自動收到 operator 執行階段 scopes。它們用於 Plugin 管理的 webhooks/簽章驗證，而不是具特權的 Gateway 輔助呼叫。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段 scope 內執行，但該 scope 是刻意保守的：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）會將 Plugin 路由執行階段 scopes 固定在 `operator.write`，即使呼叫端送出 `x-openclaw-scopes`
  - 受信任且帶有身分的 HTTP 模式（例如私人 ingress 上的 `trusted-proxy` 或 `gateway.auth.mode = "none"`）只有在明確存在該 header 時才會採用 `x-openclaw-scopes`
  - 如果這些帶有身分的 Plugin 路由請求缺少 `x-openclaw-scopes`，執行階段 scope 會回退到 `operator.write`
- 實務規則：不要假設 gateway-auth Plugin 路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求帶有身分的 auth 模式，並記錄明確的 `x-openclaw-scopes` header 合約。

## Plugin SDK 匯入路徑

撰寫新 Plugin 時，請使用窄範圍 SDK 子路徑，而不是單體式 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊 primitives                             |
| `openclaw/plugin-sdk/channel-core`  | Channel 入口/建置輔助工具                          |
| `openclaw/plugin-sdk/core`          | 通用共享輔助工具與 umbrella contract               |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`）  |

Channel Plugin 會從一組窄範圍 seam 中選用：`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 與 `channel-actions`。Approval 行為應整合到單一
`approvalCapability` 合約，而不是混用不相關的
Plugin 欄位。請參閱 [Channel plugins](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於對應且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-types`、
`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime`
與 `openclaw/plugin-sdk/infra-runtime` 是為較舊 Plugin 保留的已棄用相容性 shim。
新程式碼應改為匯入更窄範圍的通用 primitives。
</Info>

Repo 內部入口點（依每個 bundled Plugin package root）：

- `index.js` — bundled Plugin 入口
- `api.js` — 輔助工具/types barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — setup Plugin 入口

外部 Plugin 只應匯入 `openclaw/plugin-sdk/*` 子路徑。切勿從 core 或另一個 Plugin
匯入其他 Plugin package 的 `src/*`。Facade 載入的入口點會優先使用作用中的執行階段
config snapshot（如果存在），再回退到磁碟上解析出的 config 檔案。

`image-generation`、`media-understanding` 與 `speech` 等 capability 專屬子路徑存在，
是因為 bundled Plugin 目前使用它們。它們不會自動成為長期凍結的外部合約；依賴它們時，
請查閱相關 SDK 參考頁面。

## Message tool schemas

Plugin 應擁有 channel 專屬的 `describeMessageTool(...)` schema
貢獻，用於 reactions、reads 與 polls 等非訊息 primitives。
共享的傳送呈現應使用通用 `MessagePresentation` 合約，
而不是 provider 原生的 button、component、block 或 card 欄位。
請參閱 [Message Presentation](/zh-TW/plugins/message-presentation)，了解合約、
fallback 規則、provider 對應，以及 Plugin 作者檢查清單。

具備傳送能力的 Plugin 透過 message capabilities 宣告它們可以 render 的內容：

- `presentation` 用於語義化 presentation blocks（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於 pinned-delivery 請求

Core 會決定要原生 render presentation，還是將其降級為文字。
不要從通用 message tool 暴露 provider 原生 UI 逃逸出口。
用於舊版原生 schemas 的已棄用 SDK 輔助工具仍會為現有第三方 Plugin 匯出，
但新 Plugin 不應使用它們。

## Channel target resolution

Channel Plugin 應擁有 channel 專屬 target 語義。讓共享 outbound host 保持通用，
並使用 messaging adapter surface 處理 provider 規則：

- `messaging.inferTargetChatType({ to })` 會在 directory lookup 前決定 normalized target
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴 core 某個輸入是否應跳過
  directory search，直接進入 id-like resolution。
- `messaging.targetResolver.resolveTarget(...)` 是當 core 在 normalization 後或
  directory miss 後需要最終 provider 所擁有 resolution 時的 Plugin fallback。
- `messaging.resolveOutboundSessionRoute(...)` 會在 target 解析完成後，擁有 provider 專屬
  session route 建構。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋 peers/groups 前發生的 category 決策。
- 使用 `looksLikeId` 處理「將此視為明確/原生 target id」檢查。
- 使用 `resolveTarget` 作為 provider 專屬 normalization fallback，而不是用於廣泛的 directory search。
- 將 chat ids、thread ids、JIDs、handles 與 room ids 等 provider 原生 ids 保留在 `target` 值或
  provider 專屬 params 中，不要放在通用 SDK 欄位。

## Config-backed directories

從 config 衍生 directory entries 的 Plugin 應將該邏輯保留在
Plugin 中，並重用來自
`openclaw/plugin-sdk/directory-runtime` 的共享輔助工具。

當 channel 需要 config-backed peers/groups 時使用此方式，例如：

- allowlist 驅動的 DM peers
- 已設定的 channel/group maps
- account-scoped 靜態 directory fallbacks

`directory-runtime` 中的共享輔助工具只處理通用操作：

- query filtering
- limit application
- deduping/normalization helpers
- 建立 `ChannelDirectoryEntry[]`

Channel 專屬的 account inspection 與 id normalization 應留在
Plugin 實作中。

## Provider catalogs

Provider Plugin 可以使用
`registerProvider({ catalog: { run(...) { ... } } })` 定義用於 inference 的 model catalogs。

`catalog.run(...)` 會回傳 OpenClaw 寫入
`models.providers` 的相同形狀：

- `{ provider }` 用於單一 provider entry
- `{ providers }` 用於多個 provider entries

當 Plugin 擁有 provider 專屬 model ids、base URL defaults，或受 auth 保護的 model metadata 時，
請使用 `catalog`。

`catalog.order` 控制 Plugin catalog 相對於 OpenClaw 內建 implicit providers 的合併時機：

- `simple`：純 API-key 或 env 驅動的 providers
- `profile`：當 auth profiles 存在時出現的 providers
- `paired`：合成多個相關 provider entries 的 providers
- `late`：最後一輪，在其他 implicit providers 之後

後面的 providers 會在 key collision 時勝出，因此 Plugin 可以有意以相同 provider id
覆寫內建 provider entry。

相容性：

- `discovery` 仍可作為舊版 alias 使用
- 如果同時註冊了 `catalog` 與 `discovery`，OpenClaw 會使用 `catalog`

## 唯讀 channel inspection

如果你的 Plugin 註冊 channel，建議在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設 credentials
  已完整具現化，並在缺少必要 secrets 時快速失敗。
- 唯讀命令路徑，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor/config
  repair flows，不應只為了描述設定就需要具現化執行階段 credentials。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的 account state。
- 保留 `enabled` 與 `configured`。
- 相關時包含 credential source/status 欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要回傳原始 token 值就能回報唯讀可用性。回傳 `tokenStatus: "available"`（以及對應的 source
  欄位）對 status-style 命令就足夠了。
- 當 credential 透過 SecretRef 設定，但在目前命令路徑中不可用時，使用 `configured_unavailable`。

這可讓唯讀命令回報「已設定，但在此命令路徑中不可用」，而不是崩潰或誤報 account 未設定。

## Package packs

Plugin 目錄可以包含具有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個 entry 都會成為一個 Plugin。如果 pack 列出多個 extensions，Plugin id
會變成 `name/<fileBase>`。

如果你的 Plugin 匯入 npm deps，請將它們安裝在該目錄中，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` entry 在 symlink resolution 後都必須留在 Plugin
目錄內。逃離 package 目錄的 entries 會被拒絕。

安全注意事項：`openclaw plugins install` 會使用 project-local `npm install --omit=dev --ignore-scripts`
安裝 Plugin dependencies（沒有 lifecycle scripts，
執行階段沒有 dev dependencies），並忽略繼承的全域 npm install 設定。
請保持 Plugin dependency trees 為「純 JS/TS」，並避免需要
`postinstall` builds 的 packages。

選用：`openclaw.setupEntry` 可以指向輕量的 setup-only module。
當 OpenClaw 需要 disabled channel Plugin 的 setup surfaces，或
當 channel Plugin 已啟用但仍未設定時，它會載入 `setupEntry`
而不是完整 Plugin 入口。這會讓 startup 與 setup 更輕量，
尤其是當你的主要 Plugin 入口也接線 tools、hooks 或其他僅限執行階段的
程式碼時。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以讓 channel Plugin 在 Gateway 的 pre-listen startup phase 期間選擇相同的 `setupEntry`
路徑，即使該 channel 已經設定完成。

只有當 `setupEntry` 完整涵蓋 Gateway 開始 listening 前必須存在的 startup surface 時，
才使用此選項。實務上，這表示 setup entry
必須註冊 startup 依賴的每個 channel-owned capability，例如：

- channel registration 本身
- Gateway 開始 listening 前必須可用的任何 HTTP routes
- 在同一時間窗口內必須存在的任何 gateway methods、tools 或 services

如果你的完整入口仍擁有任何必要的 startup capability，請不要啟用
此 flag。讓 Plugin 保持預設行為，並讓 OpenClaw 在
startup 期間載入完整入口。

Bundled channels 也可以發布 setup-only contract-surface helpers，讓 core
能在完整 channel runtime 載入前查詢。目前的 setup
promotion surface 是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當 Core 需要在不載入完整 Plugin 入口的情況下，將舊版單一帳號頻道
設定提升為 `channels.<id>.accounts.*` 時，會使用該介面。
Matrix 是目前的內建範例：當具名帳號已經存在時，它只會將驗證/bootstrap 金鑰移入
具名提升帳號，而且可以保留已設定的非標準預設帳號金鑰，而不是一律建立
`accounts.default`。

這些設定修補配接器會讓內建合約介面探索維持延遲。匯入
時間保持輕量；提升介面只會在首次使用時載入，而不是在模組匯入時
重新進入內建頻道啟動流程。

當這些啟動介面包含 gateway RPC 方法時，請將它們保留在
Plugin 專屬前綴上。Core 管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍為保留項目，且一律解析為
`operator.admin`，即使 Plugin 要求較窄的範圍也是如此。

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

頻道 Plugin 可以透過 `openclaw.channel` 宣告設定/探索中繼資料，並透過
`openclaw.install` 宣告安裝提示。這會讓 Core 目錄不含資料。

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

在最小範例之外，有用的 `openclaw.channel` 欄位：

- `detailLabel`：用於更豐富目錄/狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於較低優先順序的 Plugin/頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面文案控制
- `markdownCapable`：將頻道標記為支援 markdown，以供外送格式決策使用
- `exposure.configured`：設為 `false` 時，從已設定頻道清單介面隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定/設定精靈選擇器隱藏該頻道
- `exposure.docs`：將頻道標記為文件導覽介面的內部/私有項目
- `showConfigured` / `showInSetup`：為了相容性仍接受的舊版別名；優先使用 `exposure`
- `quickstartAllowFrom`：讓頻道加入標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一個帳號，也要求明確帳號繫結
- `preferSessionLookupForAnnounceTarget`：解析公告目標時優先使用工作階段查找

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM
登錄匯出）。將 JSON 檔案放在下列其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案都應
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 金鑰的舊版別名。

產生的頻道目錄項目與供應商安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開
正規化的安裝來源事實。這些
正規化事實會識別 npm 規格是精確版本還是浮動
選擇器、是否存在預期的完整性中繼資料，以及本機
來源路徑是否也可用。當目錄/套件身分已知時，
如果剖析出的 npm 套件名稱偏離該身分，正規化事實會提出警告。
當 `defaultChoice` 無效或指向
不可用的來源時，以及當 npm 完整性中繼資料存在但沒有有效的 npm
來源時，它們也會提出警告。消費者應將 `installSource` 視為加法式選用欄位，讓
手工建立的項目和目錄轉接層不必合成它。
這可讓上線流程和診斷在不匯入
Plugin runtime 的情況下解釋來源平面狀態。

官方外部 npm 項目應優先使用精確的 `npmSpec` 加上
`expectedIntegrity`。裸套件名稱與 dist-tag 仍可為了
相容性運作，但它們會顯示來源平面警告，讓目錄可以在不破壞現有 Plugin 的情況下，朝向固定版本且檢查完整性的安裝前進。
當上線流程從本機目錄路徑安裝時，它會記錄一筆受管理的 Plugin
Plugin 索引項目，其中包含 `source: "path"`，並在可能時包含相對於工作區的
`sourcePath`。絕對操作載入路徑會保留在
`plugins.load.paths`；安裝記錄會避免將本機工作站
路徑重複寫入長期設定。這讓本機開發安裝對
來源平面診斷保持可見，而不會新增第二個原始檔案系統路徑揭露
介面。持久化的 `plugins/installs.json` Plugin 索引是安裝
來源真相，且可以在不載入 Plugin runtime 模組的情況下重新整理。
即使 Plugin manifest 遺失或
無效，其 `installRecords` 對應仍是持久的；其 `plugins` 陣列則是可重建的 manifest 檢視。

## 上下文引擎 Plugin

上下文引擎 Plugin 擁有工作階段上下文的擷取、組裝
與 Compaction 編排。從你的 Plugin 使用
`api.registerContextEngine(id, factory)` 註冊它們，然後用
`plugins.slots.contextEngine` 選取作用中的引擎。

當你的 Plugin 需要取代或擴充預設上下文
管線，而不只是新增記憶體搜尋或 hook 時，請使用此功能。

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
值，用於建構期間初始化。

如果你的引擎**不**擁有 Compaction 演算法，請保留 `compact()`
實作，並明確委派它：

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

當 Plugin 需要不符合目前 API 的行為時，不要透過私有深入存取
繞過 Plugin 系統。請新增缺少的能力。

建議順序：

1. 定義 Core 合約
   決定 Core 應擁有哪些共享行為：政策、fallback、設定合併、
   生命週期、面向頻道的語義，以及 runtime helper 形狀。
2. 新增型別化 Plugin 註冊/runtime 介面
   以最小可用的型別化能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接 Core + 頻道/功能消費者
   頻道與功能 Plugin 應透過 Core 消費新能力，
   而不是直接匯入供應商實作。
4. 註冊供應商實作
   接著供應商 Plugin 會針對該能力註冊其後端。
5. 新增合約覆蓋
   新增測試，讓擁有權與註冊形狀隨時間保持明確。

這就是 OpenClaw 如何在保持有主張的同時，不硬編碼到某個
供應商的世界觀。請參閱[能力 Cookbook](/zh-TW/plugins/architecture)，
取得具體檔案檢查清單與實作範例。

### 能力檢查清單

新增能力時，實作通常應一併觸及這些
介面：

- `src/<capability>/types.ts` 中的 Core 合約型別
- `src/<capability>/runtime.ts` 中的 Core runner/runtime helper
- `src/plugins/types.ts` 中的 Plugin API 註冊介面
- `src/plugins/registry.ts` 中的 Plugin registry 串接
- 當功能/頻道 Plugin 需要消費它時，`src/plugins/runtime/*` 中的 Plugin runtime 暴露
- `src/test-utils/plugin-registration.ts` 中的擷取/測試 helper
- `src/plugins/contracts/registry.ts` 中的擁有權/合約斷言
- `docs/` 中的 operator/Plugin 文件

如果缺少其中一個介面，通常表示該能力
尚未完全整合。

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

合約測試模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這讓規則保持簡單：

- Core 擁有能力合約 + 編排
- 供應商 Plugin 擁有供應商實作
- 功能/頻道 Plugin 消費 runtime helper
- 合約測試讓擁有權保持明確

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
