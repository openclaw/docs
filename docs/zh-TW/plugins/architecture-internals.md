---
read_when:
    - 實作提供者執行階段鉤子、通道生命週期或套件包
    - 偵錯外掛載入順序或登錄狀態
    - 新增外掛功能或情境引擎外掛
summary: 外掛架構內部：載入管線、登錄檔、執行階段鉤子、HTTP 路由與參考表格
title: 外掛架構內部原理
x-i18n:
    generated_at: "2026-07-05T11:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46084f1182c08c2adfb18f1f1aebd83eb2bf8cd3430b4fdd9b79849ba0cade1d
    source_path: plugins/architecture-internals.md
    workflow: 16
---

若要了解公開能力模型、外掛形態，以及所有權/執行合約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋內部機制：載入管線、登錄表、執行階段掛鉤、閘道 HTTP 路由、匯入路徑與結構描述資料表。

## 載入管線

啟動時，OpenClaw 大致會執行以下流程：

1. 探索候選外掛根目錄
2. 讀取原生或相容套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 判定每個候選項目的啟用狀態
6. 載入已啟用的原生模組：建置好的內建模組會使用原生載入器；
   第三方本機原始碼 TypeScript 則使用緊急 Jiti 後援
7. 呼叫原生 `register(api)` 掛鉤，並將註冊項目收集到外掛登錄表
8. 將登錄表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名 — 載入器會解析存在的項目（`def.register ?? def.activate`），並在同一個時間點呼叫它。所有內建外掛都使用 `register`；新外掛請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**運作。當符合以下情況時，探索會封鎖候選項目：

- 其解析後的進入點逸出外掛根目錄
- 其路徑（或其根目錄）可由所有人寫入
- 對於非內建外掛，路徑所有權與目前 uid（或 root）不相符

可由所有人寫入的內建目錄會先嘗試就地 `chmod` 修復（npm/全域安裝可能會以 `0777` 發佈套件目錄），然後閘門會重新檢查；內建來源會完全略過所有權檢查。

被封鎖的候選項目在已知外掛 ID 時，仍會在發出的診斷中帶上該 ID（包含從原本會被拒絕的目錄內資訊清單解析出的 ID），因此參照該 ID 的設定會看到一個與路徑安全警告繫結的被封鎖外掛，而不是不相關的「未知外掛」錯誤。

### 資訊清單優先行為

資訊清單是控制平面的真實來源。OpenClaw 會用它來：

- 識別外掛
- 探索宣告的頻道/Skills/設定結構描述或套件組合能力
- 驗證 `plugins.entries.<id>.config`
- 擴充 Control UI 標籤/預留位置
- 顯示安裝/目錄中繼資料
- 保留低成本啟用與設定描述元，而不載入外掛執行階段

對於原生外掛，執行階段模組是資料平面部分。它會註冊實際行為，例如掛鉤、工具、命令或提供者流程。

選用的資訊清單 `activation` 與 `setup` 區塊會保留在控制平面上。它們只是用於啟用規劃與設定探索的中繼資料描述元；它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。即時啟用消費者會使用資訊清單的命令、頻道與提供者提示，在更廣泛的登錄表具現化之前縮小外掛載入範圍：

- 命令列介面載入會縮小到擁有所要求主要命令的外掛
- 頻道設定/外掛解析會縮小到擁有所要求頻道 ID 的外掛
- 明確提供者設定/執行階段解析會縮小到擁有所要求提供者 ID 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確啟動匯入；沒有啟動中繼資料的外掛只會透過較窄的啟用觸發條件載入

啟用規劃器同時為既有呼叫端公開僅含 ID 的 API，以及用於診斷的規劃 API。規劃項目會報告選取外掛的原因，並將明確的 `activation.*` 提示與資訊清單所有權後援分開：

| 原因（來自 `activation.*` 提示）     | 原因（來自資訊清單所有權）                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| —（掛鉤觸發沒有提示變體） | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

該原因拆分就是相容性邊界：既有外掛中繼資料會繼續運作，而新程式碼可以偵測廣泛提示或後援行為，而不變更執行階段載入語意。

要求時間的執行階段預載若要求廣泛的 `all` 範圍，仍會從設定、啟動規劃、已設定的頻道、插槽與自動啟用規則，推導出明確的有效外掛 ID 集合（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。如果該推導集合為空，OpenClaw 會保持範圍為空，而不擴大到每個可探索的外掛。

設定探索會優先使用描述元擁有的 ID，例如 `setup.providers` 和 `setup.cliBackends`，以便在後援到仍需要設定時間執行階段掛鉤的外掛所用的 `setup-api` 之前，先縮小候選外掛範圍。提供者設定清單會使用資訊清單 `providerAuthChoices`、描述元推導出的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。明確的 `setup.requiresRuntime: false` 是僅描述元的截止點；省略 `requiresRuntime` 會為了相容性保留舊版 setup-api 後援。如果探索到多個外掛宣告相同的正規化設定提供者或命令列介面後端 ID，設定查詢會拒絕模糊的擁有者，而不是仰賴探索順序。當設定執行階段確實執行時，登錄表診斷會回報 `setup.providers` / `setup.cliBackends` 與 setup-api 實際註冊的提供者或命令列介面後端之間的偏移，而不封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會在時鐘時間視窗後方快取外掛探索結果或直接資訊清單登錄資料。安裝、資訊清單編輯與載入路徑變更，必須在下一次明確中繼資料讀取或快照重建時可見。資訊清單檔案解析器會保留有界的檔案簽章快取，鍵由已開啟的資訊清單路徑加上裝置/inode、大小與 mtime/ctime 組成；該快取只會避免重新解析未變更的位元組，且不得快取探索、登錄表、擁有者或政策答案。

安全的中繼資料快速路徑是明確物件所有權，而不是隱藏快取。閘道啟動熱路徑應該沿著呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、推導出的 `PluginLookUpTable`，或明確資訊清單登錄表。設定驗證、啟動自動啟用、外掛啟動程序與提供者選取，可以在這些物件代表目前設定與外掛清單時重用它們。設定查詢仍會按需重建資訊清單中繼資料，除非特定設定路徑收到明確資訊清單登錄表；請將其保留為冷路徑後援，而不是新增隱藏查詢快取。當輸入變更時，請重建並取代快照，而不是突變它或保留歷史副本。應從目前的登錄表/根目錄重新計算作用中外掛登錄表上的檢視，以及內建頻道啟動程序輔助工具。短生命週期映射可在單次呼叫中用於去重工作或防止重入；它們不得成為程序中繼資料快取。

對於外掛載入，持久快取層是執行階段載入。當程式碼或已安裝成品確實載入時，它可以重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄表
- 用來避免重複匯入相同執行階段介面的 jiti/模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複解析的短生命週期逐次呼叫映射

這些快取是資料平面的實作細節。除非呼叫端刻意要求執行階段載入，否則它們不得回答控制平面問題，例如「哪個外掛擁有此提供者？」。

不要為以下項目新增持久或時鐘時間快取：

- 探索結果
- 直接資訊清單登錄表
- 從已安裝外掛索引重建的資訊清單登錄表
- 提供者擁有者查詢、模型抑制、提供者政策或公開成品中繼資料
- 任何其他資訊清單推導出的答案，其中變更後的資訊清單、已安裝索引或載入路徑應在下一次中繼資料讀取時可見

從持久化已安裝外掛索引重建資訊清單中繼資料的呼叫端，會按需重建該登錄表。已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄表模型

已載入的外掛不會直接突變任意核心全域狀態。它們會註冊到中央外掛登錄表（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），該登錄表會追蹤外掛記錄（身分、來源、起源、狀態、診斷），以及每種能力的陣列：工具、舊版掛鉤與具型別掛鉤、頻道、提供者、閘道 RPC 處理常式、HTTP 路由、命令列介面註冊器、背景服務、外掛擁有的命令，以及數十種更多具型別提供者家族（語音、嵌入、影像/影片/音樂生成、網頁擷取/搜尋、代理程式控具、工作階段動作等等）。

核心功能接著會從該登錄表讀取，而不是直接與外掛模組交談。這會讓載入保持單向：

- 外掛模組 -> 登錄表註冊
- 核心執行階段 -> 登錄表消費

這種分離對可維護性很重要。它表示大多數核心介面只需要一個整合點：「讀取登錄表」，而不是「對每個外掛模組做特殊處理」。

## 對話繫結回呼

繫結對話的外掛可以在核准完成時做出反應。

使用 `api.onConversationBindingResolved(...)` 在繫結要求獲得核准或拒絕後接收回呼：

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

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的已解析繫結
- `request`：原始要求摘要、分離提示、寄件者 ID 與對話中繼資料

此回呼僅供通知。它不會變更誰被允許繫結對話，而且會在核心核准處理完成後執行。

## 提供者執行階段掛鉤

提供者外掛有三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查詢：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定時間掛鉤**：`catalog`（舊版 `discovery`）加上
  `applyConfigDefaults`。
- **執行階段掛鉤**：40 多個選用掛鉤，涵蓋驗證、模型解析、串流包裝、思考層級、重播政策與使用量端點。請參閱[掛鉤順序與用法](#hook-order-and-usage)。

OpenClaw 仍擁有通用代理程式迴圈、容錯移轉、轉錄處理與工具政策。這些掛鉤是提供者特定行為的擴充介面，無需建立完整的自訂推論傳輸。

當提供者具有以環境變數為基礎的憑證，且一般 auth/status/model-picker 路徑應在不載入外掛執行階段的情況下看到時，請使用 manifest `setup.providers[].envVars`。已棄用的 `providerAuthEnvVars` 在棄用期間仍會由相容性配接器讀取，使用它的非內建外掛會收到 manifest 診斷。當某個提供者 id 應重用另一個提供者 id 的環境變數、auth profiles、config-backed auth，以及 API-key onboarding choice 時，請使用 manifest `providerAuthAliases`。當 onboarding/auth-choice 命令列介面介面需要知道提供者的 choice id、group labels，以及簡單的 one-flag auth wiring，而不載入提供者執行階段時，請使用 manifest `providerAuthChoices`。請保留提供者執行階段 `envVars`，用於面向操作者的提示，例如 onboarding labels 或 OAuth client-id/client-secret setup vars。

當 channel 具有由環境變數驅動的 auth 或 setup，且一般 shell-env fallback、config/status checks 或 setup prompts 應在不載入 channel 執行階段的情況下看到時，請使用 manifest `channelEnvVars`。

### Hook 順序與用法

對於 model/provider 外掛，OpenClaw 會大致依下列順序呼叫 hooks。
「When to use」欄是快速決策指南。
OpenClaw 不再呼叫的 compatibility-only provider fields，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，有意未列於此處。

| 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間將供應商設定發布到 `models.providers`                                | 供應商擁有目錄或基礎 URL 預設值                                                                                                  |
| `applyConfigDefaults`             | 在設定具體化期間套用供應商擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或供應商模型系列語意                                                                         |
| _(內建模型查詢)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是外掛鉤子)_                                                                                                                         |
| `normalizeModelId`                | 在查詢前正規化舊版或預覽模型 ID 別名                                                     | 供應商在標準模型解析前負責別名清理                                                                                 |
| `normalizeTransport`              | 在通用模型組裝前正規化供應商系列的 `api` / `baseUrl`                                      | 供應商負責同一傳輸系列中自訂供應商 ID 的傳輸清理                                                          |
| `normalizeConfig`                 | 在執行階段/供應商解析前正規化 `models.providers.<id>`                                           | 供應商需要應由外掛負責的設定清理；內建 Google 系列輔助工具也會支援受支援的 Google 設定項目   |
| `applyNativeStreamingUsageCompat` | 對設定供應商套用原生串流用量相容性重寫                                               | 供應商需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| `resolveConfigApiKey`             | 在載入執行階段驗證前解析設定供應商的環境標記驗證                                       | 供應商公開自己的環境標記 API 金鑰解析鉤子                                                                                |
| `resolveSyntheticAuth`            | 在不持久化明文的情況下呈現本機/自託管或設定支援的驗證                                   | 供應商可使用合成/本機憑證標記運作                                                                                 |
| `resolveExternalAuthProfiles`     | 疊加供應商擁有的外部驗證設定檔；命令列介面/應用程式擁有的憑證預設 `persistence` 為 `runtime-only` | 供應商重用外部驗證憑證，而不持久化複製的重新整理權杖；在資訊清單中宣告 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留位置降到環境/設定支援的驗證之後                                      | 供應商儲存不應取得優先權的合成預留位置設定檔                                                                 |
| `resolveDynamicModel`             | 針對尚未在本機登錄檔中的供應商擁有模型 ID 進行同步後援                                       | 供應商接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 供應商在解析未知 ID 前需要網路中繼資料                                                                                  |
| `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終重寫                                               | 供應商需要傳輸重寫，但仍使用核心傳輸                                                                             |
| `normalizeToolSchemas`            | 在嵌入式執行器看到工具結構描述前正規化它們                                                    | 供應商需要傳輸系列結構描述清理                                                                                                |
| `inspectToolSchemas`              | 在正規化後呈現供應商擁有的結構描述診斷                                                  | 供應商想要關鍵字警告，而不讓核心學習供應商特定規則                                                                 |
| `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出合約                                                              | 供應商需要標記式推理/最終輸出，而不是原生欄位                                                                         |
| `prepareExtraParams`              | 在通用串流選項包裝器前進行請求參數正規化                                              | 供應商需要預設請求參數或每個供應商的參數清理                                                                           |
| `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                   | 供應商需要自訂線路通訊協定，而不只是包裝器                                                                                     |
| `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 供應商需要請求標頭/主體/模型相容性包裝器，而不是自訂傳輸                                                          |
| `resolveTransportTurnState`       | 附加原生每回合傳輸標頭或中繼資料                                                           | 供應商希望通用傳輸送出供應商原生的回合身分                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 供應商希望通用 WS 傳輸調整工作階段標頭或後援政策                                                               |
| `formatApiKey`                    | 驗證設定檔格式器：已儲存設定檔會變成執行階段 `apiKey` 字串                                     | 供應商儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 供應商不適用共用的 OpenClaw 重新整理器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 供應商需要在重新整理失敗後提供由供應商擁有的驗證修復指引                                                                      |
| `matchesContextOverflowError`     | 供應商擁有的上下文視窗溢位比對器                                                                 | 供應商有通用啟發式會漏掉的原始溢位錯誤                                                                                |
| `classifyFailoverReason`          | 供應商擁有的容錯移轉原因分類                                                                  | 供應商可將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| `isCacheTtlEligible`              | 代理/回程供應商的提示快取政策                                                               | 供應商需要代理特定的快取 TTL 閘控                                                                                                |
| `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 供應商需要供應商特定的缺少驗證復原提示                                                                                 |
| `augmentModelCatalog`             | 在探索後附加的合成/最終目錄列（已棄用，見下方）                                  | 供應商需要 `models list` 和選擇器中的合成前向相容列                                                                     |
| `resolveThinkingProfile`          | 模型特定的 `/think` 層級集、顯示標籤和預設值                                                 | 供應商針對所選模型公開自訂思考階梯或二元標籤                                                                 |
| `isBinaryThinking`                | 開/關推理切換相容性鉤子                                                                     | 供應商只公開二元思考開/關                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 供應商只想在部分模型上啟用 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性鉤子                                                                      | 供應商擁有模型系列的預設 `/think` 政策                                                                                      |
| `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的新式模型比對器                                              | 供應商擁有即時/煙霧測試偏好的模型比對                                                                                             |
| `prepareRuntimeAuth`              | 在推論前將已設定的憑證交換為實際執行階段權杖/金鑰                       | 供應商需要權杖交換或短期請求憑證                                                                             |
| `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的用量/計費憑證                                     | 供應商需要自訂用量/配額權杖剖析或不同的用量憑證                                                               |
| `fetchUsageSnapshot`              | 驗證解析後擷取並正規化供應商特定的用量/配額快照                             | 供應商需要供應商特定的用量端點或承載剖析器                                                                           |
| `createEmbeddingProvider`         | 建立由提供者擁有的記憶/搜尋嵌入適配器                                                     | 記憶嵌入行為屬於提供者外掛                                                                                    |
| `buildReplayPolicy`               | 傳回控制提供者轉錄處理的重播政策                                        | 提供者需要自訂轉錄政策（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在一般轉錄清理後重寫重播歷史                                                        | 提供者需要共享壓縮輔助工具之外的提供者專屬重播重寫                                                             |
| `validateReplayTurns`             | 在嵌入式執行器之前進行最終重播回合驗證或重塑                                           | 提供者傳輸在一般清理後需要更嚴格的回合驗證                                                                    |
| `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為啟用狀態時，提供者需要遙測或提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的供應商外掛，接著再落到其他具備 hook 能力的供應商外掛，直到其中一個實際變更模型 ID 或傳輸/設定為止。這讓別名/相容性供應商 shim 能繼續運作，而不需要呼叫端知道哪個內建外掛負責重寫。如果沒有供應商 hook 重寫受支援的 Google 系列設定項目，內建的 Google 設定正規化器仍會套用該相容性清理。

如果供應商需要完全自訂的 wire protocol 或自訂 request executor，那屬於另一類擴充。這些 hook 是提供給仍在 OpenClaw 一般推論迴圈上執行的供應商行為使用。

`resolveUsageAuth` 會決定 OpenClaw 應該呼叫 `fetchUsageSnapshot`，或針對用量/狀態介面退回通用憑證解析。當供應商有用量憑證時回傳 `{ token, accountId? }`；當供應商自有的用量驗證已處理該請求，且必須抑制通用 API 金鑰/OAuth fallback 時，回傳 `{ handled: true }`；當供應商未處理用量驗證時，回傳 `null` 或 `undefined`。

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

內建供應商外掛會組合上述 hook，以配合各 vendor 的型錄、驗證、思考、重播與用量需求。權威的 hook 集合位於 `extensions/` 下各外掛內；本頁說明形狀，而不是鏡像列出清單。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上 `resolveDynamicModel` / `prepareDynamicModel`，因此它們可以在 OpenClaw 的靜態型錄之前呈現上游模型 ID。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將 `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` + `fetchUsageSnapshot` 配對，以自主管理 token exchange 和 `/usage` 整合。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）讓供應商可以透過 `buildReplayPolicy` 選用轉錄紀錄政策，而不需要每個外掛都重新實作清理。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位於 Anthropic 外掛的公開 `api.ts` / `contract-api.ts` 邊界（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）內，而不是放在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## Runtime 輔助工具

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

注意事項：

- `textToSpeech` 會針對檔案/語音訊息介面回傳一般核心 TTS 輸出 payload。
- 使用核心 `messages.tts` 設定與供應商選擇。
- 回傳 PCM 音訊緩衝區 + 取樣率。外掛必須為供應商重新取樣/編碼。
- `listVoices` 對每個供應商都是選用的。將它用於 vendor 自有的語音選擇器或設定流程。
- 語音清單可以包含更豐富的 metadata，例如 locale、gender 和 personality tags，以支援具備供應商感知能力的選擇器。
- OpenAI 和 ElevenLabs 目前支援 telephony。Microsoft 不支援。

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

- 將 TTS 政策、fallback 和回覆遞送保留在核心中。
- 使用語音供應商處理 vendor 自有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 偏好的 ownership model 以公司為導向：隨著 OpenClaw 新增這些能力契約，一個 vendor 外掛可以負責文字、語音、圖片和未來媒體供應商。

對於圖片/音訊/影片理解，外掛會註冊一個具型別的媒體理解供應商，而不是通用 key/value bag：

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

- 將 orchestration、fallback、設定和通道 wiring 保留在核心中。
- 將 vendor 行為保留在供應商外掛中。
- 加法擴充應維持具型別：新的選用方法、新的選用結果欄位、新的選用 capabilities。
- 影片生成已遵循相同模式：
  - 核心負責能力契約與 runtime 輔助工具
  - vendor 外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能/通道外掛消費 `api.runtime.videoGeneration.*`

對於媒體理解 runtime 輔助工具，外掛可以呼叫：

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

對於音訊轉錄，外掛可以使用媒體理解 runtime，或較舊的 STT alias：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是圖片/音訊/影片理解偏好的共用介面。
- `extractStructuredWithModel(...)` 是面向外掛、用於有界供應商自有 image-first extraction 的邊界。至少包含一個圖片輸入；文字輸入是補充情境。產品外掛負責自己的路由與 schema，而 OpenClaw 負責供應商/runtime 邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）與供應商 fallback 順序。
- 當沒有產生轉錄輸出時（例如略過/不支援的輸入），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 會保留作為相容性 alias。

外掛也可以透過 `api.runtime.subagent` 啟動背景 subagent 執行：

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

- `provider` 和 `model` 是每次執行的選用覆寫，不是持久 session 變更。
- OpenClaw 只會為受信任的呼叫端遵循這些覆寫欄位。
- 對於外掛自有的 fallback 執行，operator 必須以 `plugins.entries.<id>.subagent.allowModelOverride: true` 選用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定 canonical `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的外掛 subagent 執行仍可運作，但覆寫請求會被拒絕，而不是靜默 fallback。
- 外掛建立的 subagent sessions 會標記建立該 session 的外掛 ID。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除那些自有 sessions；任意 session 刪除仍需要 admin 範圍的閘道請求。

對於網頁搜尋，外掛可以消費共用 runtime 輔助工具，而不是深入 agent tool wiring：

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

外掛也可以透過 `api.registerWebSearchProvider(...)` 註冊網頁搜尋供應商。

注意事項：

- 將供應商選擇、憑證解析和共用 request 語意保留在核心中。
- 使用網頁搜尋供應商處理 vendor-specific 搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為但不想依賴 agent tool wrapper 的功能/通道外掛偏好的共用介面。

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
- `listProviders(...)`：列出可用的圖片生成供應商及其 capabilities。

## 閘道 HTTP 路由

外掛可以使用 `api.registerHttpRoute(...)` 暴露 HTTP endpoints。

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
- `auth`：必填，`"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證/網路鉤子驗證。
- `match`：選填。`"exact"`（預設）或 `"prefix"`。
- `handleUpgrade`：同一路由上 WebSocket 升級請求的選填處理器。
- `replaceExisting`：選填。允許同一個外掛取代自己既有的路由註冊。
- `handler`：當路由已處理請求時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，且會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非 `replaceExisting: true`，否則會拒絕完全相同的 `path + match` 衝突，且一個外掛不能取代另一個外掛的路由。
- 具有不同 `auth` 層級的重疊路由會被拒絕。僅在相同驗證層級上保留 `exact`/`prefix` 遞落鏈。
- `auth: "plugin"` 路由不會自動收到操作者執行階段範圍。它們用於外掛管理的網路鉤子/簽章驗證，而不是具特權的閘道輔助呼叫。
- `auth: "gateway"` 路由會在閘道請求執行階段範圍內執行。預設表面 (`gatewayRuntimeScopeSurface: "write-default"`) 是刻意保守的：
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) 與任何非 trusted-proxy 驗證方法都只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes`
  - 沒有明確 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端，也會保留舊版僅限 `operator.write` 的表面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端，會改為取得宣告的範圍
  - 路由可以選擇加入 `gatewayRuntimeScopeSurface: "trusted-operator"`，以便對帶有身分的驗證模式一律採用 `x-openclaw-scopes`（標頭不存在時，遞落至完整的命令列介面預設範圍集合）
- 實務規則：不要假設閘道驗證的外掛路由是隱含的管理員表面。如果你的路由需要僅限管理員的行為，請選擇加入 `trusted-operator` 範圍表面、要求帶有身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用窄範圍 SDK 子路徑，而不是單體的 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊基元                                       |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入/建置輔助工具                              |
| `openclaw/plugin-sdk/core`          | 通用共用輔助工具與傘狀合約                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述 (`OpenClawSchema`) |

頻道外掛可從一組窄範圍接縫中選用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。核准行為應整合到單一
`approvalCapability` 合約，而不是混用不相關的外掛欄位。請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於相符且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是寬範圍的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型頻道輔助 facade、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是給較舊外掛使用的已棄用相容性 shim。
新程式碼應改為匯入更窄範圍的通用基元。
</Info>

Repo 內部進入點（依每個 bundled plugin 套件根目錄）：

- `index.js` — bundled plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — 設定外掛進入點

外部外掛應只匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要從核心或另一個外掛匯入另一個外掛套件的 `src/*`。
由 facade 載入的進入點會在存在時優先使用作用中的執行階段設定快照，
然後才遞落至磁碟上已解析的設定檔。

能力專屬子路徑，例如 `image-generation`、`media-understanding`
和 `speech`，是因為 bundled plugins 目前正在使用它們。它們不會自動成為長期凍結的外部合約；依賴它們時，請查看相關 SDK
參考頁面。

## 訊息工具結構描述

外掛應擁有頻道專屬的 `describeMessageTool(...)` 結構描述貢獻，
用於反應、已讀和投票等非訊息基元。
共用傳送呈現應使用通用的 `MessagePresentation` 合約，
而不是 provider-native 按鈕、元件、區塊或卡片欄位。
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)，了解合約、
遞落規則、provider 對應，以及外掛作者檢查清單。

具備傳送能力的外掛會透過訊息能力宣告它們可以轉譯的內容：

- `presentation` 用於語意呈現區塊 (`text`、`context`、`divider`、`buttons`、`select`)
- `delivery-pin` 用於釘選傳遞請求

核心會決定要原生轉譯呈現，或將其降級為文字。
不要從通用訊息工具暴露 provider-native UI 逃生口。
舊版原生結構描述的已棄用 SDK 輔助工具仍會為既有第三方外掛匯出，
但新外掛不應使用它們。

## 頻道目標解析

頻道外掛應擁有頻道專屬的目標語意。讓共用 outbound host 保持通用，
並使用傳訊 adapter 表面處理 provider 規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前，決定標準化目標應被視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心某個輸入是否應略過目錄搜尋，直接進行類似 ID 的解析。
- `messaging.targetResolver.reservedLiterals` 會列出該 provider 的頻道/工作階段參照裸字。解析會在拒絕保留字面值前保留已設定的目錄項目，然後在目錄未命中時 fail closed。
- `messaging.targetResolver.resolveTarget(...)` 是當核心在標準化後或目錄未命中後需要最終 provider 擁有的解析時，外掛的遞落。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析後，擁有 provider 專屬的工作階段路由建構。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋 peers/groups 前發生的分類決策。
- 使用 `looksLikeId` 進行「將此視為明確/原生目標 ID」檢查。
- 使用 `resolveTarget` 進行 provider 專屬標準化遞落，而不是廣泛的目錄搜尋。
- 將 chat ids、thread ids、JIDs、handles 和 room ids 等 provider-native ID 保留在 `target` 值或 provider 專屬參數內，而不是放在通用 SDK 欄位中。

## 設定支援的目錄

從設定衍生目錄項目的外掛，應將該邏輯保留在外掛中，
並重用來自 `openclaw/plugin-sdk/directory-runtime` 的共用輔助工具。

當頻道需要設定支援的 peers/groups 時使用此方式，例如：

- allowlist 驅動的 DM peers
- 已設定的頻道/群組對應
- 帳號範圍的靜態目錄遞落

`directory-runtime` 中的共用輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重/標準化輔助工具
- 建置 `ChannelDirectoryEntry[]`

頻道專屬的帳號檢查與 ID 標準化應保留在外掛實作中。

## Provider 目錄

Provider 外掛可使用 `registerProvider({ catalog: { run(...) { ... } } })`
定義用於推論的模型目錄。

`catalog.run(...)` 會回傳與 OpenClaw 寫入 `models.providers` 相同的形狀：

- `{ provider }` 用於單一 provider 項目
- `{ providers }` 用於多個 provider 項目

當外掛擁有 provider 專屬模型 ID、base URL 預設值，或受驗證保護的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw 內建隱含 provider 的合併時機：

- `simple`：單純 API key 或環境驅動的 provider
- `profile`：驗證 profile 存在時出現的 provider
- `paired`：合成多個相關 provider 項目的 provider
- `late`：最後一輪，在其他隱含 provider 之後

較晚的 provider 會在 key 衝突時勝出，因此外掛可刻意以相同 provider id 覆寫內建 provider 項目。

外掛也可以透過 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是 list/help/picker 表面的前進路徑，並支援
`text`、`voice`、`image_generation`、`video_generation` 和 `music_generation`
列。Provider 外掛仍擁有即時 endpoint 呼叫、token exchange 與
vendor response 對應；核心擁有共用列形狀、來源標籤與
媒體工具說明格式化。媒體生成 provider 註冊會自動從 `defaultModel`、`models` 和
`capabilities` 合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名運作，但會發出棄用警告
- 如果同時註冊了 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
  並發出警告
- `augmentModelCatalog` 已棄用；bundled providers 應透過 `registerModelCatalogProvider`
  發布補充列

## 唯讀頻道檢查

如果你的外掛註冊了頻道，請優先在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證已完整實體化，並在缺少必要 secret 時快速失敗。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor/config
  修復流程等唯讀命令路徑，不應為了描述設定而需要實體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時包含憑證來源/狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要只為了回報唯讀可用性而回傳原始 token 值。回傳 `tokenStatus: "available"`（以及相符的 source 欄位）對 status 風格命令已足夠。
- 當憑證透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這能讓唯讀命令回報「已設定，但在此命令路徑中不可用」，而不是當機或誤報帳號未設定。

## 套件包

外掛目錄可包含帶有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會變成一個外掛。如果 pack 列出多個 extensions，外掛
id 會變成 `<manifestOrPackageName>/<fileBase>`（存在 manifest id 時以其為準；否則使用未加 scope 的 `package.json` name）。

如果你的外掛匯入 npm 相依套件，請在該目錄中安裝它們，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全護欄：每個 `openclaw.extensions` 項目在解析符號連結後，都必須留在外掛
目錄內。逃出套件目錄的項目會被拒絕。

安全注意事項：`openclaw plugins install` 會使用專案本機的 `npm install --omit=dev --ignore-scripts`
安裝外掛相依套件（沒有生命週期腳本，
執行階段沒有開發相依套件），並忽略繼承的全域 npm 安裝設定。
請保持外掛相依樹為「純 JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。
當 OpenClaw 需要已停用通道外掛的設定介面，或
通道外掛已啟用但仍未設定時，它會載入 `setupEntry`
而不是完整外掛入口。這能讓啟動與設定更輕量，
尤其是當你的主要外掛入口也接上工具、掛鉤或其他僅執行階段的
程式碼時。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以讓通道外掛在閘道的
監聽前啟動階段選用同一條 `setupEntry` 路徑，即使該通道已經設定完成。

只有在 `setupEntry` 完整涵蓋閘道開始監聽前必須存在的啟動介面時，
才使用這個選項。實務上，這表示設定入口
必須註冊啟動所依賴的每個通道擁有能力，例如：

- 通道註冊本身
- 任何必須在閘道開始監聽前可用的 HTTP 路由
- 任何必須在同一時間窗口內存在的閘道方法、工具或服務

如果你的完整入口仍擁有任何必要的啟動能力，請不要啟用
此旗標。讓外掛維持預設行為，並讓 OpenClaw 在啟動期間載入
完整入口。

內建通道也可以發布僅設定用的契約介面輔助工具，供核心
在完整通道執行階段載入前查詢。目前的設定
升級介面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

核心在需要將舊版單帳號通道
設定提升為 `channels.<id>.accounts.*`、且不載入完整外掛入口時使用該介面。
Matrix 是目前的內建範例：當具名帳號已存在時，它只會把驗證/啟動程序金鑰移入
具名升級帳號，並且可以保留已設定的非標準預設帳號金鑰，而不是一律建立
`accounts.default`。

這些設定修補配接器會讓內建契約介面探索保持延遲載入。匯入
時間保持輕量；升級介面只會在首次使用時載入，而不是
在模組匯入時重新進入內建通道啟動流程。

當這些啟動介面包含閘道 RPC 方法時，請將它們保留在
外掛專屬前綴下。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）維持保留，且一律解析為
`operator.admin`，即使外掛要求較窄的範圍也是如此。

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

### 通道目錄中繼資料

通道外掛可以透過 `openclaw.channel` 公告設定/探索中繼資料，並透過
`openclaw.install` 公告安裝提示。這讓核心目錄不必內建資料。

範例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（自架）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "透過 Nextcloud Talk 網路鉤子 Bot 使用自架聊天。",
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

最小範例以外的實用 `openclaw.channel` 欄位：

- `detailLabel`：用於更豐富的目錄/狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於其上的低優先級外掛/通道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面文案控制
- `markdownCapable`：將通道標記為支援 markdown，用於外送格式決策
- `exposure.configured`：設為 `false` 時，從已設定通道清單介面隱藏該通道
- `exposure.setup`：設為 `false` 時，從互動式設定/配置選擇器隱藏該通道
- `exposure.docs`：將通道標記為文件導覽介面的內部/私人通道
- `showConfigured` / `showInSetup`：仍因相容性而接受的舊版別名；建議使用 `exposure`
- `quickstartAllowFrom`：讓通道選用標準快速開始 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號存在，也要求明確帳號綁定
- `preferSessionLookupForAnnounceTarget`：解析公告目標時偏好工作階段查找

OpenClaw 也可以合併**外部通道目錄**（例如 MPM
登錄匯出）。將 JSON 檔案放在下列其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案應
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的通道目錄項目與提供者安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開
正規化的安裝來源事實。這些
正規化事實會識別 npm 規格是精確版本還是浮動
選擇器、是否存在預期的完整性中繼資料，以及是否也有可用的本機
來源路徑。當目錄/套件身分已知時，
若剖析出的 npm 套件名稱偏離該身分，正規化事實會發出警告。
當 `defaultChoice` 無效或指向不可用的來源時，
以及 npm 完整性中繼資料存在但沒有有效 npm
來源時，它們也會發出警告。消費端應將 `installSource` 視為加法式選用欄位，讓
手工建立的項目與目錄墊片不必合成它。
這讓上線設定與診斷能在不匯入外掛執行階段的情況下，說明來源平面狀態。

官方外部 npm 項目應偏好精確的 `npmSpec` 加上
`expectedIntegrity`。裸套件名稱與 dist-tag 仍可因
相容性運作，但它們會顯示來源平面警告，讓目錄能朝向
釘選且經完整性檢查的安裝前進，而不會破壞現有外掛。
當上線設定從本機目錄路徑安裝時，它會記錄一筆受管理的外掛
外掛索引項目，其 `source: "path"`，並在可能時使用工作區相對的
`sourcePath`。絕對操作載入路徑保留在
`plugins.load.paths`；安裝記錄避免將本機工作站
路徑複製到長期配置中。這讓本機開發安裝能被
來源平面診斷看見，而不會新增第二個原始檔案系統路徑揭露
介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝
來源的真相來源，並且可以在不載入外掛執行階段模組的情況下重新整理。
即使外掛資訊清單遺失或
無效，其 `installRecords` 對應仍是持久的；其 `plugins` 酬載則是可重建的資訊清單檢視。

## 情境引擎外掛

情境引擎外掛擁有用於擷取、組裝與壓縮的工作階段情境協調。
請從你的外掛使用
`api.registerContextEngine(id, factory)` 註冊它們，然後使用 `plugins.slots.contextEngine`
選取作用中的引擎。

當你的外掛需要取代或擴充預設情境
管線，而不只是新增記憶搜尋或掛鉤時使用此功能。

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

工廠 `ctx` 會公開選用的 `config`、`agentDir` 和 `workspaceDir`
值，用於建構期間初始化。

當作用中的測試框架有持久後端執行緒時，`assemble()` 可以回傳
`contextProjection`。若使用舊版逐回合投影，請省略它。當組裝後的情境應
一次注入後端執行緒，並重複使用直到 epoch 變更時，回傳
`{ mode: "thread_bootstrap", epoch }`。在引擎語意情境變更後變更
epoch，例如在引擎擁有的壓縮流程後。主機可以在 thread-bootstrap 投影中保留工具呼叫中繼資料、輸入
形狀與已遮蔽工具結果，讓新的
後端執行緒保有工具連續性，而不用複製帶有原始秘密的
酬載。

如果你的引擎**不**擁有壓縮演算法，請保留 `compact()`
實作並明確委派它：

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

當外掛需要的行為不適合目前 API 時，不要透過私有觸達繞過
外掛系統。請新增缺少的能力。

建議順序：

1. **定義核心契約。** 決定核心應擁有的共享行為：
   策略、後援、設定合併、生命週期、面向通道的語意，以及
   執行階段輔助工具形狀。
2. **新增型別化外掛註冊/執行階段介面。** 使用最小且有用的型別化
   能力介面擴充
   `OpenClawPluginApi` 和/或 `api.runtime`。
3. **接上核心 + 通道/功能消費端。** 通道與功能外掛
   應透過核心消費新能力，而不是直接匯入供應商
   實作。
4. **註冊供應商實作。** 供應商外掛接著針對該能力註冊其
   後端。
5. **新增契約涵蓋。** 新增測試，讓所有權與註冊形狀
   隨時間保持明確。

這就是 OpenClaw 如何在保持有主見的同時，不被硬編碼到單一
提供者的世界觀。請參閱[能力食譜](/zh-TW/plugins/adding-capabilities)，取得具體檔案檢查清單與完整範例。

### 能力檢查清單

新增能力時，實作通常應一起觸及這些
介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心執行器/執行階段輔助工具
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄檔接線
- 當功能/通道外掛需要使用時，`src/plugins/runtime/*` 中的外掛執行階段曝光
- `src/test-utils/plugin-registration.ts` 中的擷取/測試輔助工具
- `src/plugins/contracts/registry.ts` 中的擁有權/合約斷言
- `docs/` 中的操作員/外掛文件

如果其中一個介面缺失，通常表示該能力尚未完整整合。

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

合約測試模式（`src/plugins/contracts/registry.ts` 會公開擁有權查詢，例如 `providerContractPluginIds`；測試會斷言外掛的 `contracts.videoGenerationProviders` 清單與其實際註冊的內容相符）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這會讓規則保持簡單：

- 核心擁有能力合約 + 編排
- 廠商外掛擁有廠商實作
- 功能/通道外掛使用執行階段輔助工具
- 合約測試讓擁有權保持明確

## 相關

- [外掛架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
