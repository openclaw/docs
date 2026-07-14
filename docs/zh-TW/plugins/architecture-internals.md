---
read_when:
    - 實作供應商執行階段掛鉤、頻道生命週期或套件組合
    - 偵錯外掛載入順序或登錄檔狀態
    - 新增外掛功能或上下文引擎外掛
summary: 外掛架構內部機制：載入管線、登錄檔、執行階段鉤子、HTTP 路由與參考表格
title: 外掛架構內部原理
x-i18n:
    generated_at: "2026-07-14T13:55:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e8adc7d631a5b53d25626c9b622dc01da38a2886b45fa81f72d0e67654e64349
    source_path: plugins/architecture-internals.md
    workflow: 16
---

關於公開能力模型、外掛形式，以及擁有權／執行
契約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋
內部機制：載入管線、登錄檔、執行階段掛鉤、閘道 HTTP
路由、匯入路徑和結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下操作：

1. 探索候選外掛根目錄
2. 讀取原生或相容的套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定是否啟用各候選項目
6. 載入已啟用的原生模組：建置完成的隨附模組使用原生載入器；
   第三方本機原始碼 TypeScript 使用緊急備援的 Jiti
7. 呼叫原生 `register(api)` 掛鉤，並將註冊項目收集至外掛登錄檔
8. 將登錄檔公開給命令／執行階段介面

<Note>
`activate` 是 `register` 的舊版別名——載入器會解析實際存在的項目（`def.register ?? def.activate`），並在同一時間點呼叫它。所有隨附外掛都使用 `register`；新外掛請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**運作。發生以下情況時，探索程序會封鎖候選項目：

- 其解析後的進入點逸出外掛根目錄
- 其路徑（或根目錄）允許所有使用者寫入
- 對於非隨附外掛，路徑擁有者與目前的 uid（或 root）不符

對於允許所有使用者寫入的隨附目錄，會先嘗試就地進行 `chmod` 修復
（npm／全域安裝可能會以 `0777` 提供套件目錄），再由閘門
重新檢查；對於隨附來源，則完全略過擁有權檢查。

當已知外掛 ID 時，遭封鎖的候選項目所發出的診斷仍會包含該 ID
（包括從原本會遭拒絕之目錄內的資訊清單解析出的 ID），因此參照該 ID
的設定會看到與路徑安全警告相關聯的遭封鎖外掛，而不是無關的
「未知外掛」錯誤。

### 資訊清單優先行為

資訊清單是控制平面的唯一真實來源。OpenClaw 使用它來：

- 識別外掛
- 探索宣告的頻道／Skills／設定結構描述或套件組合能力
- 驗證 `plugins.entries.<id>.config`
- 補充控制介面的標籤／預留位置文字
- 顯示安裝／目錄中繼資料
- 保留輕量的啟用與設定描述項，而不載入外掛執行階段

對於原生外掛，執行階段模組是資料平面的部分。它會註冊
實際行為，例如掛鉤、工具、命令或提供者流程。

選用的資訊清單 `activation` 與 `setup` 區塊會保留在控制平面。
它們是用於啟用規劃與設定探索的純中繼資料描述項；
不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
即時啟用取用者會使用資訊清單中的命令、頻道與提供者提示，
在實體化更廣泛的登錄檔之前縮小外掛載入範圍：

- 命令列介面載入會縮小至擁有所要求主要命令的外掛
- 頻道設定／外掛解析會縮小至擁有所要求
  頻道 ID 的外掛
- 明確的提供者設定／執行階段解析會縮小至擁有所要求
  提供者 ID 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動
  匯入；沒有啟動中繼資料的外掛只會透過範圍較窄的
  啟用觸發條件載入

啟用規劃器同時為現有呼叫端公開僅含 ID 的 API，以及用於診斷的
規劃 API。規劃項目會回報選取外掛的原因，
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

這種原因劃分就是相容性邊界：現有外掛中繼資料
會繼續運作，而新程式碼可以偵測廣泛提示或備援行為，
且不會變更執行階段載入語意。

要求廣泛 `all` 範圍的請求期間執行階段預先載入，仍會根據設定、啟動規劃、已設定的
頻道、插槽與自動啟用規則，衍生出明確的有效外掛 ID 集合
（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。如果該
衍生集合為空，OpenClaw 會讓範圍保持為空，而不是擴大至
所有可探索的外掛。

設定探索會優先使用描述項擁有的 ID，例如 `setup.providers` 與
`setup.cliBackends`，以便在退回使用
`setup-api` 處理仍需要設定期間執行階段掛鉤的外掛之前，先縮小候選外掛範圍。提供者
設定清單會使用資訊清單的 `providerAuthChoices`、由描述項衍生的設定
選項，以及安裝目錄中繼資料，而不載入提供者執行階段。明確的
`setup.requiresRuntime: false` 是僅限描述項的截止點；省略
`requiresRuntime` 則會保留舊版設定 API 備援以維持相容性。如果
有多個已探索的外掛宣稱擁有相同的正規化設定提供者或
命令列介面後端 ID，設定查詢會拒絕模稜兩可的擁有者，而不依賴
探索順序。設定執行階段實際執行時，登錄檔診斷會回報
`setup.providers`／`setup.cliBackends` 與設定 API 實際註冊的提供者或命令列介面
後端之間的偏差，但不會封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會將外掛探索結果或直接資訊清單登錄檔
資料快取在以實際時間為準的時間窗後方。安裝、資訊清單編輯與載入路徑變更
必須在下一次明確讀取中繼資料或重建快照時顯現。
資訊清單檔案剖析器會保留有界的檔案簽章快取，其索引鍵由
已開啟的資訊清單路徑加上裝置／inode、大小及 mtime／ctime 組成；該快取只會
避免重新剖析未變更的位元組，而且不得快取探索、登錄檔、
擁有者或政策答案。

安全的中繼資料快速路徑是明確的物件擁有權，而不是隱藏快取。
閘道啟動熱門路徑應透過呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、
衍生的 `PluginLookUpTable` 或明確的資訊清單登錄檔。
只要這些物件仍代表目前的設定與
外掛清單，設定驗證、啟動自動啟用、外掛啟動程序和提供者
選取即可重複使用它們。除非特定設定路徑收到明確的資訊清單登錄檔，
否則設定查詢仍會按需重建資訊清單中繼資料；請將其
保留為冷路徑備援，而不是新增隱藏的查詢快取。輸入
變更時，請重建並取代快照，而不是修改它或
保留歷史副本。應根據目前的
登錄檔／根目錄重新計算作用中外掛登錄檔的檢視，以及隨附
頻道啟動輔助程式。在單次呼叫內使用短生命週期的對應表來去除重複工作或
防止重新進入沒有問題；但它們不得成為處理程序中繼資料快取。

對於外掛載入，持久快取層是執行階段載入。當程式碼或已安裝成品
實際載入時，它可以重複使用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄檔
- 用於避免重複匯入
  相同執行階段介面的 jiti／模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複項目解析的短生命週期單次呼叫對應表

這些快取是資料平面的實作細節。除非呼叫端刻意要求載入執行階段，
否則它們不得回答「哪個外掛擁有此提供者？」之類的
控制平面問題。

請勿為以下項目新增持久或以實際時間為準的快取：

- 探索結果
- 直接資訊清單登錄檔
- 從已安裝外掛索引重建的資訊清單登錄檔
- 提供者擁有者查詢、模型抑制、提供者政策或公開成品
  中繼資料
- 任何其他衍生自資訊清單的答案，其中已變更的資訊清單、已安裝索引
  或載入路徑應在下一次讀取中繼資料時顯現

從持久化的已安裝外掛
索引重建資訊清單中繼資料的呼叫端，會按需重建該登錄檔。已安裝索引是持久的
來源平面狀態；它不是隱藏的處理程序內中繼資料快取。

## 登錄檔模型

已載入的外掛不會直接任意修改核心全域變數。它們會註冊至
中央外掛登錄檔（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），
該登錄檔會追蹤外掛記錄（身分、來源、起源、狀態、診斷），
以及每種能力的陣列：工具、舊版掛鉤與具型別掛鉤、
頻道、提供者、閘道 RPC 處理常式、HTTP 路由、命令列介面註冊器、
背景服務、外掛擁有的命令，以及數十種其他具型別的提供者
系列（語音、嵌入、影像／影片／音樂生成、網頁
擷取／搜尋、代理程式執行框架、工作階段動作等）。

接著，核心功能會從該登錄檔讀取資料，而不是直接與外掛
模組通訊。這讓載入流程保持單向：

- 外掛模組 -> 登錄檔註冊
- 核心執行階段 -> 登錄檔取用

這種分離對可維護性很重要。這表示大多數核心介面只
需要一個整合點：「讀取登錄檔」，而不是「針對每個
外掛模組進行特殊處理」。

## 對話繫結回呼

繫結對話的外掛可以在核准結果確定時做出反應。

使用 `api.onConversationBindingResolved(...)`，可在繫結
要求獲准或遭拒後接收回呼：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此外掛與對話之間現在已有繫結。
        console.log(event.binding?.conversationId);
        return;
      }

      // 要求已遭拒；清除所有本機待處理狀態。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回呼承載資料欄位：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的已解析繫結
- `request`：原始要求摘要、分離提示、傳送者 ID，以及
  對話中繼資料

此回呼僅用於通知。它不會變更誰有權繫結
對話，且會在核心核准處理完成後執行。

## 提供者執行階段掛鉤

提供者外掛分為三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查詢：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **設定階段鉤子**：`catalog`（舊版 `discovery`）以及
  `applyConfigDefaults`。
- **執行階段鉤子**：40 多個選用鉤子，涵蓋驗證、模型解析、
  串流包裝、思考層級、重播政策和用量端點。請參閱
  [鉤子順序與用法](#hook-order-and-usage)。

OpenClaw 仍負責通用代理程式迴圈、容錯移轉、轉錄內容處理和
工具政策。這些鉤子是供應商特定行為的擴充介面，
無須使用完整的自訂推論傳輸。

當供應商具有以環境變數為基礎的認證資訊，且需要讓通用驗證、狀態或模型選擇器路徑在
不載入外掛執行階段的情況下識別這些資訊時，請使用資訊清單 `setup.providers[].envVars`。
在棄用期間，相容性配接器仍會讀取已棄用的 `providerAuthEnvVars`，而使用它的
非內建外掛會收到資訊清單診斷訊息。當某個供應商 ID 應重用另一個供應商 ID 的
環境變數、驗證設定檔、設定支援的驗證方式和 API 金鑰上線選項時，請使用資訊清單
`providerAuthAliases`。當上線或驗證選項的命令列介面需要在不載入供應商執行階段的情況下，
得知供應商的選項 ID、群組標籤和簡單的單一旗標驗證連接方式時，請使用資訊清單
`providerAuthChoices`。供應商執行階段的
`envVars` 應保留給面向操作人員的提示，例如上線標籤或 OAuth
用戶端 ID／用戶端密鑰設定變數。

當頻道具有由環境變數驅動的驗證或設定，且需要讓通用殼層環境變數備援、設定／狀態檢查或設定提示在
不載入頻道執行階段的情況下識別這些資訊時，請使用資訊清單 `channelEnvVars`。

### 鉤子順序與用法

對於模型／供應商外掛，OpenClaw 會大致依照以下順序呼叫鉤子。
「使用時機」欄是快速決策指南。
OpenClaw 已不再呼叫且僅供相容性使用的供應商欄位，例如
`ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，刻意未列於此處。

| 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間，將供應商設定發布至 `models.providers`                                | 供應商擁有目錄或基礎 URL 預設值                                                                                                  |
| `applyConfigDefaults`             | 在設定具體化期間套用供應商擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或供應商模型系列語意                                                                         |
| _（內建模型查詢）_         | OpenClaw 會先嘗試一般的登錄檔／目錄路徑                                                          | _（不是外掛鉤子）_                                                                                                                         |
| `normalizeModelId`                | 在查詢前正規化舊版或預覽版模型 ID 別名                                                     | 供應商在解析標準模型前負責清理別名                                                                                 |
| `normalizeTransport`              | 在一般模型組裝前正規化供應商系列的 `api`／`baseUrl`                                      | 供應商負責清理相同傳輸系列中自訂供應商 ID 的傳輸設定                                                          |
| `normalizeConfig`                 | 在執行階段／供應商解析前正規化 `models.providers.<id>`                                           | 供應商需要應歸屬於外掛的設定清理；內建的 Google 系列輔助程式也會為受支援的 Google 設定項目提供後備支援   |
| `applyNativeStreamingUsageCompat` | 將原生串流用量相容性改寫套用至設定供應商                                               | 供應商需要依端點驅動的原生串流用量中繼資料修正                                                                          |
| `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定供應商的環境標記驗證                                       | 供應商公開自身的環境標記 API 金鑰解析鉤子                                                                                |
| `resolveSyntheticAuth`            | 在不持久儲存純文字的情況下，呈現本機／自行託管或設定支援的驗證                                   | 供應商可使用合成／本機認證資訊標記運作                                                                                 |
| `resolveExternalAuthProfiles`     | 疊加供應商擁有的外部驗證設定檔；對於命令列介面／應用程式擁有的認證資訊，預設 `persistence` 為 `runtime-only` | 供應商重複使用外部驗證認證資訊，而不持久儲存複製的重新整理權杖；請在資訊清單中宣告 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 降低由環境／設定支援的驗證背後所儲存合成設定檔預留位置的優先順序                                      | 供應商儲存不應取得優先權的合成預留位置設定檔                                                                 |
| `resolveDynamicModel`             | 對尚未存在於本機登錄檔中的供應商擁有模型 ID 進行同步後備處理                                       | 供應商接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 非同步暖機，接著再次執行 `resolveDynamicModel`                                                           | 供應商在解析未知 ID 前需要網路中繼資料                                                                                  |
| `normalizeResolvedModel`          | 內嵌執行器使用已解析模型前的最終改寫                                               | 供應商需要傳輸改寫，但仍使用核心傳輸                                                                             |
| `normalizeToolSchemas`            | 在內嵌執行器看到工具結構描述前將其正規化                                                    | 供應商需要傳輸系列的結構描述清理                                                                                                |
| `inspectToolSchemas`              | 在正規化後呈現供應商擁有的結構描述診斷                                                  | 供應商希望提供關鍵字警告，而不需讓核心了解供應商特定規則                                                                 |
| `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出合約                                                              | 供應商需要標記式推理／最終輸出，而非原生欄位                                                                         |
| `prepareExtraParams`              | 在一般串流選項包裝函式前正規化要求參數                                              | 供應商需要預設要求參數或各供應商的參數清理                                                                           |
| `createStreamFn`                  | 使用自訂傳輸完全取代一般串流路徑                                                   | 供應商需要自訂線路通訊協定，而不只是包裝函式                                                                                     |
| `wrapStreamFn`                    | 套用一般包裝函式後的串流包裝函式                                                              | 供應商需要要求標頭／主體／模型相容性包裝函式，但不需要自訂傳輸                                                          |
| `resolveTransportTurnState`       | 附加原生的每回合傳輸標頭或中繼資料                                                           | 供應商希望一般傳輸能傳送供應商原生的回合識別資訊                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 供應商希望一般 WS 傳輸能調整工作階段標頭或後備政策                                                               |
| `formatApiKey`                    | 驗證設定檔格式化程式：將已儲存的設定檔轉為執行階段 `apiKey` 字串                                     | 供應商儲存額外的驗證中繼資料，並需要自訂的執行階段權杖格式                                                                    |
| `refreshOAuth`                    | 自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 供應商不適用共用的 OpenClaw 重新整理器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 供應商需要在重新整理失敗後提供由供應商擁有的驗證修復指引                                                                      |
| `matchesContextOverflowError`     | 供應商擁有的上下文視窗溢位比對器                                                                 | 供應商具有一般啟發式方法無法偵測的原始溢位錯誤                                                                                |
| `classifyFailoverReason`          | 供應商擁有的容錯移轉原因分類                                                                  | 供應商可將原始 API／傳輸錯誤對應至速率限制／過載等                                                                          |
| `isCacheTtlEligible`              | Proxy／回程供應商的提示快取政策                                                               | 供應商需要 Proxy 特定的快取 TTL 門控                                                                                                |
| `buildMissingAuthMessage`         | 取代一般的缺少驗證復原訊息                                                      | 供應商需要供應商特定的缺少驗證復原提示                                                                                 |
| `augmentModelCatalog`             | 探索後附加的合成／最終目錄列（已淘汰，請參閱下文）                                  | 供應商需要在 `models list` 和選擇器中提供合成的向前相容列                                                                     |
| `resolveThinkingProfile`          | 模型特定的 `/think` 等級集合、顯示標籤與預設值                                                 | 供應商為選定模型公開自訂思考階梯或二元標籤                                                                 |
| `isBinaryThinking`                | 開啟／關閉推理切換相容性鉤子                                                                     | 供應商僅公開二元思考開啟／關閉                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 供應商只希望在部分模型上提供 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性鉤子                                                                      | 供應商擁有模型系列的預設 `/think` 政策                                                                                      |
| `isModernModelRef`                | 即時設定檔篩選器與冒煙測試選擇所用的現代模型比對器                                              | 供應商擁有即時／冒煙測試偏好模型比對                                                                                             |
| `prepareRuntimeAuth`              | 在推論前一刻，將已設定的認證資訊交換為實際的執行階段權杖／金鑰                       | 供應商需要權杖交換或短期要求認證資訊                                                                             |
| `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面所需的用量／帳務認證資訊                                     | 供應商需要自訂用量／配額權杖剖析或不同的用量認證資訊                                                               |
| `fetchUsageSnapshot`              | 在解析驗證後，擷取並正規化供應商特定的用量／配額快照                             | 供應商需要供應商特定的用量端點或承載資料剖析器                                                                           |
| `createEmbeddingProvider`         | 為記憶／搜尋建立由供應商擁有的嵌入配接器                                                     | 記憶嵌入行為應歸屬於供應商外掛                                                                                    |
| `buildReplayPolicy`               | 傳回控制供應商逐字稿處理方式的重播原則                                        | 供應商需要自訂逐字稿原則（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷史                                                        | 供應商需要超出共用壓縮輔助程式範圍的供應商專屬重播重寫                                                             |
| `validateReplayTurns`             | 在嵌入式執行器執行前，對最終重播回合進行驗證或重新塑形                                           | 供應商傳輸層在通用清理後需要更嚴格的回合驗證                                                                    |
| `onModelSelected`                 | 執行由供應商擁有的選擇後副作用                                                                 | 模型啟用時，供應商需要遙測或由供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的
供應商外掛，接著依序嘗試其他具備掛鉤能力的供應商外掛，
直到其中一個實際變更模型 ID 或傳輸方式／設定。如此可讓
別名／相容性供應商墊片持續運作，而不需要呼叫端知道由哪個
內建外掛負責改寫。如果沒有供應商掛鉤改寫受支援的
Google 系列設定項目，內建的 Google 設定正規化器仍會套用
該相容性清理。

如果供應商需要完全自訂的線路通訊協定或自訂要求執行器，
那屬於不同類型的擴充功能。這些掛鉤適用於仍在 OpenClaw
標準推論迴圈中執行的供應商行為。

`resolveUsageAuth` 會決定 OpenClaw 應呼叫 `fetchUsageSnapshot`，還是
針對用量／狀態介面回退至通用認證資訊解析。當供應商
具有用量認證資訊時，傳回 `{ token, accountId?, subscriptionType?, rateLimitTier? }`
（選用的方案中繼資料會流入
`fetchUsageSnapshot`）；當供應商擁有的用量驗證已處理要求，且
必須抑制通用 API 金鑰／OAuth 回退時，傳回
`{ handled: true }`；當供應商未處理用量驗證時，傳回
`null` 或 `undefined`。

請在資訊清單的 `providerUsageAuthEnvVars` 中宣告組織或帳務認證資訊。
如此可讓通用探索與機密資訊清除介面辨識它們，
而不會將其列為推論驗證候選項目。

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

內建供應商外掛會組合上述掛鉤，以符合各廠商的目錄、
驗證、思考、重播及用量需求。具權威性的掛鉤集合位於
各外掛的 `extensions/` 下；本頁著重說明其形式，而非
複製該清單。

<AccordionGroup>
  <Accordion title="直通式目錄供應商">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog`，以及
    `resolveDynamicModel`／`prepareDynamicModel`，讓它們能在 OpenClaw
    靜態目錄之前顯示上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 與用量端點供應商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配對，以自行負責權杖交換與 `/usage` 整合。
  </Accordion>
  <Accordion title="重播與逐字稿清理系列">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）可讓供應商透過
    `buildReplayPolicy` 選用逐字稿政策，而不必由每個外掛
    各自重新實作清理功能。
  </Accordion>
  <Accordion title="僅提供目錄的供應商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 僅註冊 `catalog`，並使用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助工具">
    Beta 標頭、`/fast`／`serviceTier` 和 `context1m` 位於
    Anthropic 外掛的公開 `api.ts`／`contract-api.ts` 介面內
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而非
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

外掛可透過 `api.runtime` 存取選定的核心輔助工具。針對 TTS：

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

- `textToSpeech` 會針對檔案／語音備忘錄介面傳回標準核心 TTS 輸出承載資料。
- 使用核心 `messages.tts` 設定與供應商選擇。
- 傳回 PCM 音訊緩衝區與取樣率。外掛必須針對供應商重新取樣／編碼。
- `listVoices` 對每個供應商而言皆為選用。請將其用於廠商擁有的語音選擇器或設定流程。
- 核心會將解析後的要求期限傳給供應商的 `listVoices` 掛鉤；供應商特定的逾時設定可覆寫該期限。
- 語音清單可包含更豐富的中繼資料，例如地區設定、性別及個性標籤，以供能辨識供應商的選擇器使用。
- OpenAI 和 ElevenLabs 目前支援電話語音。Microsoft 不支援。

外掛也可透過 `api.registerSpeechProvider(...)` 註冊語音供應商。

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

- 將 TTS 政策、回退及回覆傳送保留在核心中。
- 使用語音供應商處理廠商擁有的語音合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 偏好的擁有權模型以公司為導向：隨著 OpenClaw 新增這些
  能力合約，一個廠商外掛可以擁有文字、語音、影像及未來的
  媒體供應商。

針對影像／音訊／影片理解，外掛會註冊一個具型別的
媒體理解供應商，而非通用的鍵／值集合：

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

- 將協調、回退、設定及頻道接線保留在核心中。
- 將廠商行為保留在供應商外掛中。
- 附加式擴充應維持型別化：新增選用方法、新增選用
  結果欄位、新增選用能力。
- 影片生成已採用相同模式：
  - 核心擁有能力合約與執行階段輔助工具
  - 廠商外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能／頻道外掛使用 `api.runtime.videoGeneration.*`

針對媒體理解執行階段輔助工具，外掛可以呼叫：

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

針對音訊轉錄，外掛可使用媒體理解執行階段，
或較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是影像／音訊／影片理解的首選
  共用介面。
- `extractStructuredWithModel(...)` 是供外掛使用的介面，用於有界限且
  由供應商擁有、以影像優先的擷取。至少須包含一個影像輸入；
  文字輸入是補充情境。產品外掛擁有其路由與結構描述，
  而 OpenClaw 擁有供應商／執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）與供應商回退順序。
- 未產生任何轉錄輸出時（例如輸入遭略過／不受支援），傳回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留為相容性別名。

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

- `provider` 和 `model` 是每次執行的選用覆寫值，不是持久性工作階段變更。
- `toolsAlsoAllow` 接受由呼叫外掛註冊、名稱完全相符且擁有權唯一的工具。核心工具名稱與有歧義的名稱會遭拒絕。它會附加至標準設定檔，但操作者的允許清單與拒絕規則仍具有最終決定權。
- OpenClaw 只會對受信任的呼叫端採用這些覆寫欄位。
- 針對外掛擁有的回退執行，操作者必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任外掛的子代理程式執行仍可運作，但覆寫要求會遭拒絕，而不會無聲回退。
- 外掛建立的子代理程式工作階段會加上建立該工作階段之外掛 ID 的標籤。回退 `api.runtime.subagent.deleteSession(...)` 只能刪除這些由其擁有的工作階段；任意刪除工作階段仍需要具有管理員範圍的閘道要求。

針對網路搜尋，外掛可使用共用執行階段輔助工具，
而不必存取代理程式工具接線：

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
`api.registerWebSearchProvider(...)` 註冊網路搜尋供應商。

注意事項：

- 將提供者選擇、認證資訊解析與共用請求語意保留在核心中。
- 針對廠商特定的搜尋傳輸使用網頁搜尋提供者。
- `api.runtime.webSearch.*` 是需要搜尋行為、但不想依賴代理工具包裝器的功能／頻道外掛之首選共用介面。

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

- `generate(...)`：使用已設定的影像生成提供者鏈生成影像。
- `listProviders(...)`：列出可用的影像生成提供者及其功能。

## 閘道 HTTP 路由

外掛可透過 `api.registerHttpRoute(...)` 公開 HTTP 端點。

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
- `handleUpgrade`：選填，用於相同路由上 WebSocket 升級請求的處理常式。
- `replaceExisting`：選填。允許同一個外掛取代自己現有的路由註冊。
- `handler`：路由已處理請求時傳回 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，並會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非使用 `replaceExisting: true`，否則完全相同的 `path + match` 衝突會遭拒絕，且一個外掛無法取代另一個外掛的路由。
- 具有不同 `auth` 層級的重疊路由會遭拒絕。請僅在相同驗證層級上保留 `exact`/`prefix` 後援鏈。
- `auth: "plugin"` 路由**不會**自動取得操作者執行階段範圍。它們用於外掛管理的網路鉤子／簽章驗證，而非具權限的閘道輔助程式呼叫。
- `auth: "gateway"` 路由會在閘道請求執行階段範圍內執行。預設介面（`gatewayRuntimeScopeSurface: "write-default"`）刻意採取保守設定：
  - 共用密鑰持有者驗證（`gateway.auth.mode = "token"` / `"password"`）及任何非受信任代理驗證方式只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes`
  - 沒有明確 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端也會保留僅限舊版 `operator.write` 的介面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端則會取得所宣告的範圍
  - 路由可選擇啟用 `gatewayRuntimeScopeSurface: "trusted-operator"`，以一律針對帶有身分的驗證模式遵循 `x-openclaw-scopes`（若缺少標頭，則改用完整的命令列介面預設範圍集合）
- 實務規則：不要假設採用閘道驗證的外掛路由會隱含提供管理員介面。如果你的路由需要僅限管理員的行為，請選擇啟用 `trusted-operator` 範圍介面、要求帶有身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。
- 完成路由比對與驗證後，一般處理常式會參與閘道根工作准入。已準備或正在重新啟動的閘道會在叫用處理常式前傳回 `503`。狹義例外是清單已授權的 `auth: "gateway"` 路由，且該路由也選擇啟用路由特定的 `trusted-operator` 介面；它仍可被存取，以免暫停控制分派陷入無法執行的狀態，而同一外掛的一般同層路由仍位於准入邊界之後。WebSocket `handleUpgrade` 所有權使用相同的不可分割准入邊界；處理常式接受通訊端後，該通訊端後續的生命週期由外掛擁有，且此邊界不會追蹤它。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用範圍較窄的 SDK 子路徑，而非單體式 `openclaw/plugin-sdk` 根
彙總匯出。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊基本元素                                   |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點／建置輔助程式                          |
| `openclaw/plugin-sdk/core`          | 通用共用輔助程式與傘狀合約                        |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

頻道外掛可從一系列範圍較窄的接合面中選擇——`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 及 `channel-actions`。核准行為應整合至
單一 `approvalCapability` 合約，而非混用互不相關的
外掛欄位。請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助程式位於相應的聚焦 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 及 `config-mutation`，
而非範圍廣泛的 `config-runtime` 相容性彙總匯出。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型頻道輔助程式門面、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
及 `openclaw/plugin-sdk/infra-runtime`，是供舊版外掛使用的
已棄用相容性轉接層。新程式碼應改為匯入範圍較窄的通用基本元素。
</Info>

儲存庫內部進入點（每個隨附外掛套件根目錄）：

- `index.js` — 隨附外掛進入點
- `api.js` — 輔助程式／型別彙總匯出
- `runtime-api.js` — 僅供執行階段使用的彙總匯出
- `setup-entry.js` — 設定外掛進入點

外部外掛應僅匯入 `openclaw/plugin-sdk/*` 子路徑。絕不可
從核心或另一個外掛匯入其他外掛套件的 `src/*`。
透過門面載入的進入點會優先使用作用中的執行階段設定快照（若有），
之後才改用磁碟上已解析的設定檔。

`image-generation`、`media-understanding`
及 `speech` 等功能特定子路徑之所以存在，是因為隨附外掛目前使用它們。它們不會
自動成為長期凍結的外部合約——依賴它們時，請查看相關的 SDK
參考頁面。

## 訊息工具結構描述

針對回應、已讀及投票等非訊息基本元素，外掛應自行負責頻道特定的 `describeMessageTool(...)` 結構描述
貢獻。
共用傳送呈現方式應使用通用 `MessagePresentation` 合約，
而非提供者原生的按鈕、元件、區塊或卡片欄位。
如需了解合約、後援規則、提供者對應及外掛作者檢查清單，
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)。

可傳送訊息的外掛透過訊息功能宣告其可呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）
- `delivery-pin` 用於置頂傳送要求

核心會決定要以原生方式呈現，或將呈現內容降級為文字。
請勿從通用訊息工具公開提供者原生 UI 的逃生通道。
用於舊版原生結構描述的已棄用 SDK 輔助程式仍會匯出，以供現有
第三方外掛使用，但新外掛不應使用它們。

## 頻道目標解析

頻道外掛應自行負責頻道特定的目標語意。請讓共用
外送主機維持通用，並透過訊息傳遞配接器介面處理提供者規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前判斷正規化目標
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告知核心某個
  輸入是否應跳過目錄搜尋，直接進行類似識別碼的解析。
- `messaging.targetResolver.reservedLiterals` 會列出對該提供者而言屬於
  頻道／工作階段參照的單獨字詞。解析程序會先保留已設定的
  目錄項目，再拒絕保留字面值，之後在目錄查詢未命中時採取封閉式失敗。
- `messaging.targetResolver.resolveTarget(...)` 是核心在正規化後或
  目錄查詢未命中後需要最終提供者自有解析時的外掛後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責建構提供者特定的工作階段
  路由。

建議分工：

- 對於應在搜尋對等端／群組前做出的類別判斷，請使用 `inferTargetChatType`。
- 對於「將此項目視為明確／原生目標識別碼」的檢查，請使用 `looksLikeId`。
- 將 `resolveTarget` 用於提供者特定的正規化後援，而非
  廣泛的目錄搜尋。
- 將聊天識別碼、討論串識別碼、JID、代稱及聊天室
  識別碼等提供者原生識別碼保留在 `target` 值或提供者特定參數中，而非通用 SDK
  欄位中。

## 設定支援的目錄

從設定衍生目錄項目的外掛應將該邏輯保留在
外掛中，並重複使用
`openclaw/plugin-sdk/directory-runtime` 的共用輔助程式。

當頻道需要下列設定支援的對等端／群組時，請使用此方式：

- 由允許清單驅動的私訊對等端
- 已設定的頻道／群組對應
- 以帳號為範圍的靜態目錄後援

`directory-runtime` 中的共用輔助程式僅處理通用作業：

- 查詢篩選
- 套用限制
- 去除重複項目／正規化輔助程式
- 建置 `ChannelDirectoryEntry[]`

頻道特定的帳號檢查與識別碼正規化應保留在
外掛實作中。

## 提供者目錄

提供者外掛可透過 `registerProvider({ catalog: { run(...) { ... } } })` 定義用於推論的模型目錄。

`catalog.run(...)` 傳回的形狀與 OpenClaw 寫入
`models.providers` 的形狀相同：

- `{ provider }` 用於單一提供者項目
- `{ providers }` 用於多個提供者項目

當外掛擁有提供者特定的模型識別碼、基底 URL
預設值或受驗證限制的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw
內建隱含提供者的合併時機：

- `simple`：純 API 金鑰或環境驅動的提供者
- `profile`：存在驗證設定檔時出現的提供者
- `paired`：合成多個相關提供者項目的提供者
- `late`：在其他隱含提供者之後進行最後一輪處理

若發生鍵值衝突，後面的提供者會勝出，因此外掛可刻意覆寫具有相同提供者識別碼的
內建提供者項目。

外掛也可以透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型資料列。這是清單／說明／選擇器介面的後續演進路徑，並支援
`text`、`voice`、`image_generation`、`video_generation` 和 `music_generation`
資料列。供應商外掛仍負責即時端點呼叫、權杖交換及
廠商回應對應；核心則負責共用資料列格式、來源標籤及
媒體工具說明格式。媒體生成供應商註冊會自動從 `defaultModel`、`models` 和
`capabilities` 合成靜態目錄資料列。

相容性：

- `discovery` 仍可作為舊版別名使用，但會發出棄用警告
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
  並發出警告
- `augmentModelCatalog` 已棄用；隨附供應商應透過 `registerModelCatalogProvider`
  發布補充資料列

## 唯讀頻道檢查

如果你的外掛註冊了頻道，建議在 `resolveAccount(...)` 之外一併實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設認證資訊
  已完全具現化，並可在缺少必要祕密時快速失敗。
- 唯讀命令路徑（例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`）以及 doctor／設定
  修復流程，不應只為了描述設定就必須具現化執行階段認證資訊。

建議的 `inspectAccount(...)` 行為：

- 僅傳回描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時納入認證資訊來源／狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要僅為了回報唯讀
  可用性而傳回原始權杖值。對於狀態類命令，傳回 `tokenStatus: "available"`（以及相符的來源
  欄位）即可。
- 當認證資訊透過 SecretRef 設定，但在目前命令路徑中
  無法使用時，請使用 `configured_unavailable`。

如此一來，唯讀命令便能回報「已設定，但在此命令
路徑中無法使用」，而不會當機或誤報帳號尚未設定。

## 套件組合包

外掛目錄可以包含具有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個外掛。如果組合包列出多個擴充功能，外掛
ID 會成為 `<manifestOrPackageName>/<fileBase>`（若有資訊清單 ID，則以其為準；
否則使用未限定範圍的 `package.json` 名稱）。

如果你的外掛匯入 npm 相依套件，請將它們安裝在該目錄中，以便
`node_modules` 可供使用（`npm install`／`pnpm install`）。

安全防護機制：每個 `openclaw.extensions` 項目在解析符號連結後，都必須位於外掛
目錄內。任何跳脫套件目錄的項目都會被拒絕。

安全性注意事項：`openclaw plugins install` 會使用專案本機的
`npm install --omit=dev --ignore-scripts` 安裝外掛相依套件（不執行生命週期指令碼，
執行階段不安裝開發相依套件），並忽略繼承的全域 npm 安裝設定。
請讓外掛相依套件樹維持「純 JS／TS」，並避免使用需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。
當 OpenClaw 需要已停用頻道外掛的設定介面，或
頻道外掛已啟用但尚未完成設定時，會載入 `setupEntry`
而非完整外掛進入點。當主要外掛進入點還會連接工具、掛鉤
或其他僅供執行階段使用的程式碼時，這可減輕啟動和設定負擔。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可讓頻道外掛在閘道開始監聽前的啟動階段中，即使頻道已完成設定，
也採用相同的 `setupEntry` 路徑。

只有當 `setupEntry` 完整涵蓋閘道開始監聽前必須存在的啟動介面時，
才可使用此選項。實務上，這表示設定進入點
必須註冊啟動所依賴的每項頻道自有功能，例如：

- 頻道註冊本身
- 閘道開始監聽前必須可用的任何 HTTP 路由
- 在相同時間範圍內必須存在的任何閘道方法、工具或服務

如果完整進入點仍負責任何必要的啟動功能，請勿啟用
此旗標。讓外掛維持預設行為，並由 OpenClaw 在
啟動期間載入完整進入點。

隨附頻道也可以發布僅供設定使用的合約介面輔助工具，讓核心
能在載入完整頻道執行階段前查詢。目前的設定
提升介面為：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要將舊版單帳號頻道設定提升為
`channels.<id>.accounts.*`，且不載入完整外掛進入點時，會使用該介面。
Matrix 是目前的隨附範例：當具名帳號已存在時，它只會將驗證／啟動載入金鑰移至
具名的已提升帳號中；它也可以保留已設定但非標準的預設帳號金鑰，而非一律建立
`accounts.default`。

這些設定修補配接器會讓隨附合約介面的探索保持延遲載入。匯入
期間維持輕量；提升介面只會在首次使用時載入，而不會在
模組匯入時重新進入隨附頻道的啟動流程。

當這些啟動介面包含閘道 RPC 方法時，請讓它們使用
外掛專屬前綴。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍為保留空間，且一律解析為
`operator.admin`，即使外掛要求較窄的範圍亦然。

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

頻道外掛可以透過 `openclaw.channel` 宣告設定／探索中繼資料，並透過
`openclaw.install` 提供安裝提示。這能讓核心目錄不含資料。

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
      "blurb": "透過 Nextcloud Talk 網路鉤子機器人進行自行託管的聊天。",
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

除了最小範例外，實用的 `openclaw.channel` 欄位包括：

- `detailLabel`：供內容較豐富的目錄／狀態介面使用的次要標籤
- `docsLabel`：覆寫文件連結文字
- `preferOver`：此目錄項目應優先於其上的低優先順序外掛／頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面的文案控制項
- `markdownCapable`：將頻道標記為支援 Markdown，以供傳出格式決策使用
- `exposure.configured`：設為 `false` 時，從已設定頻道清單介面隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定／配置選擇器隱藏該頻道
- `exposure.docs`：將頻道標記為內部／私人，以供文件導覽介面使用
- `showConfigured`／`showInSetup`：為了相容性仍接受的舊版別名；建議使用 `exposure`
- `quickstartAllowFrom`：讓頻道採用標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號，也要求明確繫結帳號
- `preferSessionLookupForAnnounceTarget`：解析公告目標時優先查詢工作階段

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM
登錄匯出）。將 JSON 檔案放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一個或多個 JSON 檔案（以逗號／分號／`PATH` 分隔）。每個檔案都應
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 金鑰的舊版別名。

產生的頻道目錄項目和供應商安裝目錄項目會在原始 `openclaw.install` 區塊旁
公開正規化的安裝來源資訊。正規化資訊會辨識 npm 規格是確切版本還是浮動
選擇器、是否具有預期的完整性中繼資料，以及本機
來源路徑是否也可用。當目錄／套件身分已知時，如果剖析出的 npm 套件名稱
偏離該身分，正規化資訊會發出警告。
當 `defaultChoice` 無效或指向不可用的來源，以及 npm 完整性中繼資料存在但沒有有效 npm
來源時，也會發出警告。使用端應將 `installSource` 視為附加的選用欄位，使
手動建立的項目和目錄相容層不必合成該欄位。
如此可讓新手上路流程和診斷說明來源層狀態，而不需
匯入外掛執行階段。

官方外部 npm 項目應優先使用確切的 `npmSpec` 加上
`expectedIntegrity`。為了相容性，僅套件名稱和 dist-tag 仍可使用，
但它們會顯示來源層警告，讓目錄能逐步轉向固定版本且經完整性檢查的安裝，
同時不破壞現有外掛。
當新手上路流程從本機目錄路徑安裝時，會記錄一個受管理的外掛
外掛索引項目，其中包含 `source: "path"`，並在可行時包含工作區相對的
`sourcePath`。絕對的作業載入路徑會保留在
`plugins.load.paths` 中；安裝記錄不會將本機工作站
路徑重複寫入長期設定。如此可讓本機開發安裝顯示於
來源層診斷中，同時不增加第二個原始檔案系統路徑揭露
介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝
來源的單一事實來源，且可在不載入外掛執行階段模組的情況下重新整理。
即使外掛資訊清單遺失或
無效，其 `installRecords` 對應仍可持久保存；其 `plugins` 承載資料則是可重建的資訊清單檢視。

## 上下文引擎外掛

上下文引擎外掛負責擷取、組裝及壓縮的工作階段上下文協調。
請從你的外掛使用 `api.registerContextEngine(id, factory)` 註冊它們，然後使用
`plugins.slots.contextEngine` 選取使用中的引擎。

當你的外掛需要取代或擴充預設上下文
管線，而不只是新增記憶搜尋或掛鉤時，請使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "無損 Claw", ownsCompaction: true },
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
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
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

工廠 `ctx` 公開可選的 `config`、`agentDir` 和 `workspaceDir`
值，用於建構時初始化。

當作用中的執行框架具有持久性後端執行緒時，`assemble()` 可以傳回 `contextProjection`。
若使用舊版的逐輪投影，請省略它。當組合後的上下文應僅注入後端執行緒一次，
並重複使用直到 epoch 變更時，請傳回 `{ mode: "thread_bootstrap", epoch }`。
在引擎的語意上下文變更後調整 epoch，例如在引擎所擁有的壓縮處理完成後。
主機可以在線程啟動投影中保留工具呼叫中繼資料、輸入形狀及經遮蔽的工具結果，
讓新建立的後端執行緒能維持工具連續性，而無須複製含有原始機密的承載資料。

如果你的引擎**不**擁有壓縮演算法，請保留 `compact()` 的實作，
並明確將其委派出去：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "我的記憶引擎",
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
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
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

## 新增功能能力

當外掛需要目前 API 無法涵蓋的行為時，不要透過私下深入存取來繞過
外掛系統。請新增缺少的功能能力。

建議順序：

1. **定義核心契約。** 決定核心應擁有的共用行為：
   政策、後援機制、設定合併、生命週期、面向頻道的語意，以及
   執行階段輔助函式的形狀。
2. **新增具型別的外掛註冊／執行階段介面。** 使用最小且實用的具型別
   功能能力介面擴充 `OpenClawPluginApi` 和／或 `api.runtime`。
3. **串接核心與頻道／功能消費端。** 頻道與功能外掛
   應透過核心使用新功能能力，而不是直接匯入特定供應商的
   實作。
4. **註冊供應商實作。** 接著由供應商外掛針對該功能能力
   註冊其後端。
5. **新增契約涵蓋範圍。** 新增測試，確保擁有權與註冊形狀
   隨時間推移仍保持明確。

這能讓 OpenClaw 維持鮮明的設計取向，同時避免將單一
供應商的世界觀硬編碼其中。如需具體的檔案檢查清單與完整範例，
請參閱[功能能力指南](/zh-TW/plugins/adding-capabilities)。

### 功能能力檢查清單

新增功能能力時，實作通常應一併涵蓋以下
介面：

- `src/<capability>/types.ts` 中的核心契約型別
- `src/<capability>/runtime.ts` 中的核心執行器／執行階段輔助函式
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄串接
- 當功能／頻道外掛需要使用該能力時，於 `src/plugins/runtime/*` 中
  公開外掛執行階段
- `src/test-utils/plugin-registration.ts` 中的擷取／測試輔助函式
- `src/plugins/contracts/registry.ts` 中的擁有權／契約斷言
- `docs/` 中的操作人員／外掛文件

如果缺少其中任何一個介面，通常表示該功能能力
尚未完成整合。

### 功能能力範本

最小模式：

```ts
// 核心契約
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// 外掛 API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 供功能／頻道外掛使用的共用執行階段輔助函式
const clip = await api.runtime.videoGeneration.generate({
  prompt: "顯示機器人走過實驗室。",
  cfg,
});
```

契約測試模式（`src/plugins/contracts/registry.ts` 公開如 `providerContractPluginIds` 等擁有權
查詢；測試會斷言外掛的 `contracts.videoGenerationProviders` 清單與其實際註冊的內容相符）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這能讓規則保持簡單：

- 核心擁有功能能力契約與協調流程
- 供應商外掛擁有供應商實作
- 功能／頻道外掛使用執行階段輔助函式
- 契約測試確保擁有權保持明確

## 相關內容

- [外掛架構](/zh-TW/plugins/architecture) — 公開功能能力模型與形狀
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
