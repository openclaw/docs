---
read_when:
    - 實作供應商執行階段鉤子、頻道生命週期或套件包
    - 偵錯外掛載入順序或登錄檔狀態
    - 新增外掛能力或上下文引擎外掛
summary: 外掛架構內部機制：載入管線、登錄檔、執行階段鉤子、HTTP 路由與參照表
title: 外掛架構內部機制
x-i18n:
    generated_at: "2026-07-12T14:40:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開能力模型、外掛形式，以及擁有權／執行合約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋內部機制：載入管線、登錄檔、執行階段掛鉤、閘道 HTTP 路由、匯入路徑與結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下步驟：

1. 探索候選外掛根目錄
2. 讀取原生或相容的套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定是否啟用每個候選項目
6. 載入已啟用的原生模組：建置完成的隨附模組使用原生載入器；
   第三方本機來源 TypeScript 則使用緊急備援的 Jiti
7. 呼叫原生 `register(api)` 掛鉤，並將登錄項目收集至外掛登錄檔
8. 將登錄檔公開給命令與執行階段介面

<Note>
`activate` 是 `register` 的舊版別名——載入器會解析存在的項目（`def.register ?? def.activate`），並在相同的時點呼叫它。所有隨附外掛都使用 `register`；新外掛請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**運作。發現程序會在下列情況封鎖候選項目：

- 其解析後的進入點逸出外掛根目錄
- 其路徑（或根目錄）可由所有使用者寫入
- 對於非隨附外掛，路徑擁有者與目前的 uid（或 root）不符

對於可由所有使用者寫入的隨附目錄，系統會先嘗試就地執行 `chmod` 修復（npm／全域安裝可能會以 `0777` 權限提供套件目錄），然後再重新檢查閘門；對於隨附來源，則會完全略過擁有權檢查。

若已知遭封鎖候選項目的外掛 id，發出的診斷資訊仍會包含該 id（包括從原本會遭拒絕之目錄內的資訊清單解析出的 id），因此參照該 id 的設定會看到與路徑安全警告關聯的遭封鎖外掛，而非不相關的「未知外掛」錯誤。

### 資訊清單優先行為

資訊清單是控制平面的真實資料來源。OpenClaw 使用它來：

- 識別外掛
- 探索已宣告的頻道／Skills／設定結構描述或套件能力
- 驗證 `plugins.entries.<id>.config`
- 擴充 Control UI 標籤／預留位置文字
- 顯示安裝／目錄中繼資料
- 無須載入外掛執行階段，即可保留低成本的啟用與設定描述元

對於原生外掛，執行階段模組是資料平面的部分。它會註冊
實際行為，例如掛鉤、工具、命令或提供者流程。

選用的資訊清單 `activation` 與 `setup` 區塊保留在控制平面上。
它們是僅含中繼資料的描述元，用於啟用規劃與設定探索；
它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
即時啟用取用者會使用資訊清單中的命令、頻道與提供者提示，
在更廣泛具現化登錄檔之前縮小外掛載入範圍：

- 命令列介面載入會將範圍縮小至擁有所要求主要命令的外掛
- 頻道設定／外掛解析會將範圍縮小至擁有所要求
  頻道 ID 的外掛
- 明確的提供者設定／執行階段解析會將範圍縮小至擁有所要求
  提供者 ID 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動
  匯入；沒有啟動中繼資料的外掛只會透過範圍更窄的
  啟用觸發條件載入

啟用規劃器同時公開僅含 ID 的 API（供現有呼叫端使用），以及
用於診斷的規劃 API。規劃項目會回報外掛獲選的原因，
並將明確的 `activation.*` 提示與資訊清單擁有權備援機制區分開來：

| 原因（來自 `activation.*` 提示）      | 原因（來自資訊清單擁有權）                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                        |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                  |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                            |
| —（鉤子觸發程序沒有提示變體）        | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

這種原因區分就是相容性邊界：現有的外掛中繼資料會繼續運作，而新程式碼則可偵測廣泛提示或備援行為，無須變更執行階段的載入語意。

要求廣泛 `all` 範圍的請求期間執行階段預載，仍會從設定、啟動規劃、已設定的頻道、插槽及自動啟用規則，衍生出明確的有效外掛 ID 集合（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。若衍生出的集合為空，OpenClaw 會讓範圍保持空白，而不會擴大至每個可探索的外掛。

設定探索會優先使用描述元擁有的 ID，例如 `setup.providers` 和
`setup.cliBackends`，以縮小候選外掛範圍，再針對仍需要設定階段執行期掛鉤的外掛，回退至
`setup-api`。提供者設定清單會使用資訊清單中的 `providerAuthChoices`、衍生自描述元的設定
選項，以及安裝目錄中繼資料，而不載入提供者執行期。明確設定
`setup.requiresRuntime: false` 時，會僅限使用描述元；省略
`requiresRuntime` 則會保留舊版 setup-api 回退機制以維持相容性。若
探索到多個外掛宣告相同的正規化設定提供者或命令列介面後端 ID，設定查詢會拒絕不明確的擁有者，而不依賴
探索順序。當設定執行期實際執行時，登錄檔診斷會回報
`setup.providers` / `setup.cliBackends` 與 setup-api 實際註冊的提供者或命令列介面
後端之間的偏差，但不會阻擋舊版外掛。

### 外掛快取邊界

OpenClaw 不會依據實際時間間隔，快取外掛探索結果或直接的資訊清單登錄資料。安裝、資訊清單編輯和載入路徑變更，必須在下一次明確讀取中繼資料或重建快照時顯示。資訊清單檔案剖析器會保留一個有界的檔案簽章快取，其索引鍵由開啟的資訊清單路徑，加上裝置／inode、大小及 mtime／ctime 組成；該快取只會避免重新剖析未變更的位元組，不得快取探索、登錄、擁有者或原則的結果。

安全的中繼資料快速路徑是明確的物件所有權，而不是隱藏的快取。
閘道啟動熱路徑應沿著呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、
衍生的 `PluginLookUpTable`，或明確的資訊清單登錄檔。設定驗證、啟動時
自動啟用、外掛啟動程序與供應商選擇，都可在這些物件仍代表目前設定與
外掛清單時重複使用它們。設定查找仍會視需要重新建構資訊清單中繼資料，
除非特定設定路徑收到明確的資訊清單登錄檔；請將此機制保留為冷路徑備援，
而不要新增隱藏的查找快取。輸入變更時，請重建並取代快照，而不是對其進行
變動或保留歷史副本。作用中外掛登錄檔的檢視，以及內建頻道啟動輔助程式，
都應從目前的登錄檔／根目錄重新計算。短期對應表可在單次呼叫內用於去除
重複工作或防止重新進入；它們不得成為程序中繼資料快取。

針對外掛載入，持久性快取層屬於執行階段載入。當程式碼或已安裝成品確實
載入時，它可以重複使用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄檔
- 用於避免重複匯入相同執行階段介面的 jiti／模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複項目解析的短期單次呼叫對應表

這些快取是資料平面的實作細節。除非呼叫端刻意要求執行階段載入，否則它們
不得回答「哪個外掛擁有此供應商？」之類的控制平面問題。

請勿為下列項目新增持久性或依賴實際時間的快取：

- 探索結果
- 直接資訊清單登錄檔
- 從已安裝外掛索引重新建構的資訊清單登錄檔
- 供應商擁有者查找、模型抑制、供應商政策或公開成品中繼資料
- 任何其他衍生自資訊清單的答案，只要變更後的資訊清單、已安裝索引或
  載入路徑應在下一次中繼資料讀取時可見

從持久化的已安裝外掛索引重建資訊清單中繼資料的呼叫端，會視需要重新建構
該登錄檔。已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料
快取。

## 登錄檔模型

已載入的外掛不會直接變動任意的核心全域變數。它們會註冊至中央外掛登錄檔
（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），該登錄檔會追蹤
外掛記錄（身分、來源、原始位置、狀態、診斷），以及每項能力的陣列：工具、
舊版掛鉤與型別化掛鉤、頻道、供應商、閘道 RPC 處理常式、HTTP 路由、
命令列介面註冊器、背景服務、外掛自有命令，以及數十種其他型別化供應商
系列（語音、嵌入、影像／影片／音樂生成、網頁擷取／搜尋、代理程式框架、
工作階段動作等）。

接著，核心功能會從該登錄檔讀取，而不是直接與外掛模組通訊。這讓載入保持
單向：

- 外掛模組 -> 登錄檔註冊
- 核心執行階段 -> 登錄檔取用

這種分離對可維護性很重要。這表示大多數核心介面只需要一個整合點：
「讀取登錄檔」，而不是「為每個外掛模組加入特殊處理」。

## 對話繫結回呼

繫結對話的外掛可在核准結果確定時做出反應。

使用 `api.onConversationBindingResolved(...)`，在繫結要求獲核准或拒絕後
接收回呼：

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

回呼承載內容欄位：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的解析後繫結
- `request`：原始要求摘要、中斷連結提示、傳送者 ID 與對話中繼資料

此回呼僅用於通知。它不會變更誰獲准繫結對話，且會在核心核准處理完成後
執行。

## 供應商執行階段掛鉤

供應商外掛分為三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查找：
  `setup.providers[].envVars`、已淘汰的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定階段掛鉤**：`catalog`（舊版 `discovery`）以及
  `applyConfigDefaults`。
- **執行階段掛鉤**：40 多個選用掛鉤，涵蓋驗證、模型解析、串流包裝、
  思考層級、重播政策與用量端點。請參閱
  [掛鉤順序與用法](#hook-order-and-usage)。

OpenClaw 仍負責通用代理程式迴圈、容錯移轉、逐字稿處理與工具政策。這些
掛鉤是供應商特定行為的擴充介面，無須建立一整套自訂推論傳輸機制。

當供應商具有以環境變數為基礎的認證資訊，且通用驗證／狀態／模型選擇器路徑應能在不載入外掛執行階段的情況下取得這些資訊時，請使用資訊清單中的 `setup.providers[].envVars`。在淘汰期間，相容性配接器仍會讀取已棄用的 `providerAuthEnvVars`，而使用它的非內建外掛會收到資訊清單診斷訊息。當某個供應商 ID 應重用另一個供應商 ID 的環境變數、驗證設定檔、設定支援的驗證，以及 API 金鑰初始設定選項時，請使用資訊清單中的 `providerAuthAliases`。當初始設定／驗證選項的命令列介面介面需要在不載入供應商執行階段的情況下，得知供應商的選項 ID、群組標籤，以及簡單的單一旗標驗證接線方式時，請使用資訊清單中的 `providerAuthChoices`。供應商執行階段的
`envVars` 應保留用於面向操作人員的提示，例如初始設定標籤，或 OAuth
用戶端 ID／用戶端密碼設定變數。

當頻道具有環境變數驅動的驗證或設定，且通用 Shell 環境變數備援、設定／狀態檢查或設定提示應能在不載入頻道執行階段的情況下取得這些資訊時，請使用資訊清單中的 `channelEnvVars`。

### 鉤子順序與用法

對於模型／供應商外掛，OpenClaw 大致會依照以下順序呼叫鉤子。
「使用時機」欄是快速決策指南。
此處刻意未列出 OpenClaw 不再呼叫、僅供相容性使用的供應商欄位，例如
`ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

| Hook                              | 功能                                                                                                           | 使用時機                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間，將供應商設定發布至 `models.providers`                                               | 供應商擁有目錄或基礎 URL 預設值                                                                                                               |
| `applyConfigDefaults`             | 在具體化設定期間，套用供應商擁有的全域設定預設值                                                               | 預設值取決於驗證模式、環境或供應商模型系列的語意                                                                                              |
| _(內建模型查詢)_                  | OpenClaw 會先嘗試一般的登錄檔／目錄路徑                                                                        | _(不是外掛 Hook)_                                                                                                                             |
| `normalizeModelId`                | 在查詢前正規化舊版或預覽版模型 ID 別名                                                                         | 供應商負責在解析正式模型前清理別名                                                                                                            |
| `normalizeTransport`              | 在通用模型組裝前正規化供應商系列的 `api`／`baseUrl`                                                            | 供應商負責清理同一傳輸系列中自訂供應商 ID 的傳輸設定                                                                                          |
| `normalizeConfig`                 | 在解析執行階段／供應商前正規化 `models.providers.<id>`                                                         | 供應商需要應由外掛負責的設定清理；隨附的 Google 系列輔助工具也會為支援的 Google 設定項目提供後援                                               |
| `applyNativeStreamingUsageCompat` | 對設定供應商套用原生串流用量相容性重寫                                                                         | 供應商需要修正由端點驅動的原生串流用量中繼資料                                                                                                |
| `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定供應商的環境標記驗證                                                             | 供應商公開各自的環境標記 API 金鑰解析 Hook                                                                                                    |
| `resolveSyntheticAuth`            | 公開本機／自行託管或由設定提供的驗證，而不持久化純文字                                                         | 供應商可使用合成／本機認證資訊標記運作                                                                                                        |
| `resolveExternalAuthProfiles`     | 疊加供應商擁有的外部驗證設定檔；命令列介面／應用程式所擁有認證資訊的預設 `persistence` 為 `runtime-only`       | 供應商重複使用外部驗證認證資訊，而不持久化複製的重新整理權杖；請在資訊清單中宣告 `contracts.externalAuthProviders`                              |
| `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留位置置於環境／設定支援的驗證之後                                                       | 供應商儲存不應取得優先權的合成預留位置設定檔                                                                                                  |
| `resolveDynamicModel`             | 對尚未列於本機登錄檔的供應商自有模型 ID 提供同步後援                                                           | 供應商接受任意上游模型 ID                                                                                                                     |
| `prepareDynamicModel`             | 非同步預熱，接著再次執行 `resolveDynamicModel`                                                                 | 供應商在解析未知 ID 前需要網路中繼資料                                                                                                        |
| `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終重寫                                                                     | 供應商需要傳輸重寫，但仍使用核心傳輸                                                                                                          |
| `normalizeToolSchemas`            | 在嵌入式執行器取得工具結構描述前將其正規化                                                                     | 供應商需要清理傳輸系列的結構描述                                                                                                              |
| `inspectToolSchemas`              | 在正規化後顯示供應商擁有的結構描述診斷                                                                         | 供應商希望提供關鍵字警告，而不必讓核心了解供應商特定規則                                                                                      |
| `resolveReasoningOutputMode`      | 選擇原生或帶標記的推理輸出合約                                                                                  | 供應商需要帶標記的推理／最終輸出，而非原生欄位                                                                                                |
| `prepareExtraParams`              | 在通用串流選項包裝函式前正規化要求參數                                                                         | 供應商需要預設要求參數或個別供應商的參數清理                                                                                                  |
| `createStreamFn`                  | 使用自訂傳輸完整取代一般串流路徑                                                                                | 供應商需要自訂線路通訊協定，而非僅使用包裝函式                                                                                                |
| `wrapStreamFn`                    | 在套用通用包裝函式後使用的串流包裝函式                                                                         | 供應商需要要求標頭／主體／模型相容性包裝函式，而不需要自訂傳輸                                                                                |
| `resolveTransportTurnState`       | 附加原生的每回合傳輸標頭或中繼資料                                                                              | 供應商希望通用傳輸傳送供應商原生的回合識別資訊                                                                                                |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                                       | 供應商希望通用 WS 傳輸能調整工作階段標頭或後援政策                                                                                            |
| `formatApiKey`                    | 驗證設定檔格式化工具：將已儲存的設定檔轉換為執行階段 `apiKey` 字串                                             | 供應商儲存額外的驗證中繼資料，且需要自訂執行階段權杖格式                                                                                      |
| `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策覆寫 OAuth 重新整理                                                      | 供應商不適用共用的 OpenClaw 重新整理工具                                                                                                      |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                              | 重新整理失敗後，供應商需要由自身提供驗證修復指引                                                                                              |
| `matchesContextOverflowError`     | 由供應商擁有的上下文視窗溢位比對器                                                                              | 供應商具有通用啟發式方法無法偵測的原始溢位錯誤                                                                                                |
| `classifyFailoverReason`          | 由供應商擁有的容錯移轉原因分類                                                                                  | 供應商可將原始 API／傳輸錯誤對應至速率限制／過載等原因                                                                                        |
| `isCacheTtlEligible`              | 代理／回程供應商的提示詞快取政策                                                                                | 供應商需要代理特定的快取 TTL 條件控管                                                                                                         |
| `buildMissingAuthMessage`         | 取代通用的缺少驗證復原訊息                                                                                      | 供應商需要供應商特定的缺少驗證復原提示                                                                                                        |
| `augmentModelCatalog`             | 在探索後附加的合成／最終目錄資料列（已棄用，請見下文）                                                        | 供應商需要在 `models list` 和選擇器中加入合成的向前相容資料列                                                                                  |
| `resolveThinkingProfile`          | 模型特定的 `/think` 層級集合、顯示標籤和預設值                                                                 | 供應商為所選模型公開自訂思考層級或二元標籤                                                                                                    |
| `isBinaryThinking`                | 開啟／關閉推理切換相容性 Hook                                                                                   | 供應商僅公開二元思考開啟／關閉功能                                                                                                            |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性 Hook                                                                                     | 供應商只希望在部分模型上提供 `xhigh`                                                                                                          |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性 Hook                                                                                   | 供應商負責某個模型系列的預設 `/think` 政策                                                                                                    |
| `isModernModelRef`                | 用於即時設定檔篩選與冒煙測試選擇的現代模型比對器                                                               | 供應商負責即時／冒煙測試的偏好模型比對                                                                                                        |
| `prepareRuntimeAuth`              | 在推論前，將已設定的認證資訊兌換為實際的執行階段權杖／金鑰                                                     | 供應商需要權杖交換或短效要求認證資訊                                                                                                          |
| `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的用量／帳務認證資訊                                                               | 供應商需要自訂用量／配額權杖剖析，或使用不同的用量認證資訊                                                                                    |
| `fetchUsageSnapshot`              | 解析驗證後，擷取並正規化供應商特定的用量／配額快照                                                             | 供應商需要供應商特定的用量端點或承載資料剖析器                                                                                                |
| `createEmbeddingProvider`         | 為記憶／搜尋建置由供應商擁有的嵌入轉接器                                                     | 記憶嵌入行為應由供應商外掛負責                                                                                    |
| `buildReplayPolicy`               | 傳回控制供應商對逐字稿處理方式的重播原則                                        | 供應商需要自訂的逐字稿原則（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷程                                                        | 除了共用的壓縮輔助工具外，供應商還需要供應商特定的重播重寫                                                             |
| `validateReplayTurns`             | 在進入內嵌執行器前，對重播輪次進行最終驗證或重塑                                           | 經過通用清理後，供應商傳輸層需要更嚴格的輪次驗證                                                                    |
| `onModelSelected`                 | 執行由供應商擁有的選取後副作用                                                                 | 當模型啟用時，供應商需要遙測或由供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的提供者外掛，再依序嘗試其他具備掛鉤能力的提供者外掛，直到其中一個實際變更模型 ID、傳輸方式或設定。如此可讓別名／相容性提供者轉接層持續運作，而不需要呼叫端知道由哪個隨附外掛負責改寫。若沒有任何提供者掛鉤改寫支援的 Google 系列設定項目，隨附的 Google 設定正規化器仍會套用該相容性清理。

如果提供者需要完全自訂的線路通訊協定或自訂要求執行器，則屬於另一類擴充功能。這些掛鉤適用於仍在 OpenClaw 一般推論迴圈中執行的提供者行為。

`resolveUsageAuth` 決定 OpenClaw 應呼叫 `fetchUsageSnapshot`，還是針對用量／狀態介面退回使用通用認證資訊解析。當提供者具有用量認證資訊時，回傳 `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用的方案中繼資料會傳入 `fetchUsageSnapshot`）；當提供者自有的用量驗證已處理要求，且必須抑制通用 API 金鑰／OAuth 備援時，回傳 `{ handled: true }`；當提供者未處理用量驗證時，回傳 `null` 或 `undefined`。

請在資訊清單的 `providerUsageAuthEnvVars` 中宣告組織或帳務認證資訊。這可讓通用探索與機密清理介面辨識這些資訊，而不會將其視為推論驗證的候選項目。

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

隨附的提供者外掛會組合上述掛鉤，以配合各供應商的目錄、驗證、思考、重播和用量需求。具權威性的掛鉤集合位於 `extensions/` 下的各個外掛中；本頁僅說明其形式，而非複製完整清單。

<AccordionGroup>
  <Accordion title="直通式目錄提供者">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog`，以及
    `resolveDynamicModel`／`prepareDynamicModel`，讓它們能在 OpenClaw
    的靜態目錄之前呈現上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 與用量端點提供者">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai
    會將 `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 搭配使用，以自行負責權杖交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="重播與逐字稿清理系列">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓提供者可透過
    `buildReplayPolicy` 選擇啟用逐字稿政策，而不必由每個外掛重新實作清理功能。
  </Accordion>
  <Accordion title="僅目錄提供者">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助程式">
    Beta 標頭、`/fast`／`serviceTier` 和 `context1m` 位於
    Anthropic 外掛的公開 `api.ts`／`contract-api.ts` 介面中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），
    而非通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 執行階段輔助程式

外掛可透過 `api.runtime` 存取特定的核心輔助程式。以 TTS 為例：

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

- `textToSpeech` 會針對檔案／語音留言介面回傳一般的核心 TTS 輸出承載資料。
- 使用核心 `messages.tts` 設定與提供者選擇。
- 回傳 PCM 音訊緩衝區與取樣率。外掛必須針對提供者重新取樣／編碼。
- `listVoices` 對每個提供者而言皆為選用。可用於供應商自有的語音選擇器或設定流程。
- 核心會將已解析的要求截止時間傳給提供者的 `listVoices` 掛鉤；提供者專用的逾時設定可覆寫此值。
- 語音清單可包含更豐富的中繼資料，例如地區設定、性別和個性標籤，以供能辨識提供者的選擇器使用。
- OpenAI 和 ElevenLabs 目前支援電話語音。Microsoft 不支援。

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

- 將 TTS 政策、備援和回覆傳遞保留在核心中。
- 使用語音提供者處理由供應商自有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 提供者 ID。
- 建議的所有權模型以公司為導向：隨著 OpenClaw 新增這些能力合約，一個供應商外掛可擁有文字、語音、影像，以及未來的媒體提供者。

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

- 將協調、備援、設定和頻道接線保留在核心中。
- 將供應商行為保留在提供者外掛中。
- 增量擴充應維持型別化：新增選用方法、新增選用結果欄位、新增選用能力。
- 影片生成已遵循相同模式：
  - 核心擁有能力合約和執行階段輔助程式
  - 供應商外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能／頻道外掛使用 `api.runtime.videoGeneration.*`

外掛可呼叫下列媒體理解執行階段輔助程式：

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

對於音訊轉錄，外掛可使用媒體理解執行階段或較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是影像／音訊／影片理解的首選共用介面。
- `extractStructuredWithModel(...)` 是提供給外掛使用的介面，用於有界限、由提供者自有且以影像為優先的擷取。請包含至少一個影像輸入；文字輸入是補充情境。產品外掛擁有其路由和結構描述，而 OpenClaw 擁有提供者／執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）和提供者備援順序。
- 未產生轉錄輸出時（例如略過／不支援的輸入），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留為相容性別名。

外掛也可透過 `api.runtime.subagent` 啟動背景子代理程式執行：

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

- `provider` 和 `model` 是每次執行的選用覆寫，不是永久性的工作階段變更。
- OpenClaw 僅對受信任的呼叫端採用這些覆寫欄位。
- 對於外掛自有的備援執行，操作人員必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選擇啟用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的外掛子代理程式執行仍可運作，但覆寫要求會遭拒，而非無提示地退回。
- 外掛建立的子代理程式工作階段會加上建立該工作階段之外掛 ID 的標籤。備援的 `api.runtime.subagent.deleteSession(...)` 僅可刪除這些自有工作階段；刪除任意工作階段仍需具管理員範圍的閘道要求。

對於網頁搜尋，外掛可使用共用執行階段輔助程式，而不必存取代理程式工具接線：

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

外掛也可透過 `api.registerWebSearchProvider(...)` 註冊網頁搜尋提供者。

注意事項：

- 將提供者選擇、認證資訊解析和共用要求語意保留在核心中。
- 使用網頁搜尋提供者處理由供應商專用的搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為、但不想依賴代理程式工具包裝函式之功能／頻道外掛的首選共用介面。

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
- `listProviders(...)`：列出可用的影像生成提供者及其能力。

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
- `auth`：必填，為 `"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證／網路鉤子驗證。
- `match`：選填。`"exact"`（預設）或 `"prefix"`。
- `handleUpgrade`：選填，用於相同路由上 WebSocket 升級要求的處理常式。
- `replaceExisting`：選填。允許同一個外掛取代自己現有的路由註冊。
- `handler`：當路由已處理要求時傳回 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，並會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非設定 `replaceExisting: true`，否則完全相同的 `path + match` 衝突會遭拒絕，且一個外掛無法取代另一個外掛的路由。
- 使用不同 `auth` 層級的重疊路由會遭拒絕。`exact`／`prefix` 後援鏈只能使用相同的驗證層級。
- `auth: "plugin"` 路由**不會**自動取得操作員執行階段範圍。這些路由用於外掛管理的網路鉤子／簽章驗證，而非具特殊權限的閘道輔助程式呼叫。
- `auth: "gateway"` 路由會在閘道要求執行階段範圍中執行。預設介面（`gatewayRuntimeScopeSurface: "write-default"`）刻意採取保守設計：
  - 共用密鑰持有人驗證（`gateway.auth.mode = "token"`／`"password"`）及任何非受信任 Proxy 的驗證方法只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes`
  - 未明確提供 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端也會保留僅有 `operator.write` 的舊有介面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端則會改為取得所宣告的範圍
  - 路由可選擇加入 `gatewayRuntimeScopeSurface: "trusted-operator"`，以一律遵循具有身分資訊之驗證模式的 `x-openclaw-scopes`（未提供標頭時，後援至完整的命令列介面預設範圍集合）
- 實務規則：不要假設使用閘道驗證的外掛路由隱含為管理員介面。如果你的路由需要僅限管理員的行為，請選擇加入 `trusted-operator` 範圍介面、要求具有身分資訊的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。
- 路由比對與驗證完成後，一般處理常式會參與閘道根工作准入。處於準備中或重新啟動中的閘道會在叫用處理常式前傳回 `503`。狹義例外是由資訊清單授權的 `auth: "gateway"` 路由，且該路由也選擇加入路由專屬的 `trusted-operator` 介面；它會保持可存取，使暫停控制分派不致無法執行，而相同外掛的一般同層路由仍會位於准入邊界之後。WebSocket `handleUpgrade` 的所有權使用相同的不可分割准入邊界；處理常式接受通訊端後，該通訊端後續的生命週期由外掛擁有，且不受此邊界追蹤。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用精簡的 SDK 子路徑，而非單體式的 `openclaw/plugin-sdk` 根
彙整模組。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊基本元件                                   |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點／建置輔助程式                          |
| `openclaw/plugin-sdk/core`          | 通用共用輔助程式與統整合約                        |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

頻道外掛可從一組精簡介面中選用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。核准行為應整合至單一
`approvalCapability` 合約，而非混用不相關的外掛欄位。請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助程式位於相對應的聚焦 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而非廣泛的 `config-runtime` 相容性彙整模組。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型頻道輔助程式 Facade、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是供舊版外掛使用的已淘汰
相容性轉接層。新程式碼應改為匯入更精簡的通用基本元件。
</Info>

儲存庫內部進入點（各隨附外掛套件根目錄）：

- `index.js` — 隨附外掛進入點
- `api.js` — 輔助程式／型別彙整模組
- `runtime-api.js` — 僅限執行階段的彙整模組
- `setup-entry.js` — 設定外掛進入點

外部外掛應只匯入 `openclaw/plugin-sdk/*` 子路徑。絕對不要從核心或另一個外掛
匯入其他外掛套件的 `src/*`。透過 Facade 載入的進入點會優先使用作用中的執行階段
設定快照（若存在），接著才後援至磁碟上解析出的設定檔。

`image-generation`、`media-understanding` 和 `speech` 等功能專屬子路徑
之所以存在，是因為隨附外掛目前正在使用它們。它們不會自動成為長期凍結的外部
合約——依賴這些子路徑時，請查閱相關的 SDK 參考頁面。

## 訊息工具結構描述

對於回應、已讀和投票等非訊息基本元件，外掛應擁有頻道專屬的
`describeMessageTool(...)` 結構描述貢獻。共用傳送呈現方式應使用通用的
`MessagePresentation` 合約，而非供應商原生的按鈕、元件、區塊或卡片欄位。
如需瞭解合約、後援規則、供應商對應及外掛作者檢查清單，請參閱
[訊息呈現](/zh-TW/plugins/message-presentation)。

具備傳送能力的外掛會透過訊息功能宣告其可呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）
- `delivery-pin` 用於釘選傳遞要求

核心決定要以原生方式呈現內容，還是降級為文字。請勿從通用訊息工具公開
供應商原生 UI 的規避出口。舊有原生結構描述的已淘汰 SDK 輔助程式仍會為現有
第三方外掛匯出，但新外掛不應使用它們。

## 頻道目標解析

頻道外掛應擁有頻道專屬的目標語意。請讓共用輸出主機保持通用，並使用傳訊
配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前，決定標準化目標
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告知核心輸入是否
  應略過目錄搜尋，直接進行類似 ID 的解析。
- `messaging.targetResolver.reservedLiterals` 會列出該供應商用作
  頻道／工作階段參照的純文字。解析會在拒絕保留字面值前保留已設定的
  目錄項目，接著在目錄未命中時採取封閉式失敗。
- 當核心在標準化後或目錄未命中後，需要最後一次由供應商擁有的解析時，
  `messaging.targetResolver.resolveTarget(...)` 就是外掛後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責建構
  供應商專屬的工作階段路由。

建議的拆分方式：

- 對於應在搜尋對等端／群組之前進行的類別判定，請使用 `inferTargetChatType`。
- 對於「將此視為明確／原生目標 ID」的檢查，請使用 `looksLikeId`。
- 對於供應商特定的正規化備援，請使用 `resolveTarget`，不要用於廣泛的目錄搜尋。
- 將聊天 ID、討論串 ID、JID、控制代碼及聊天室 ID 等供應商原生 ID 保留在 `target` 值或供應商特定參數中，不要放在通用 SDK 欄位中。

## 設定支援的目錄

從設定衍生目錄項目的外掛，應將該邏輯保留在外掛內，並重複使用 `openclaw/plugin-sdk/directory-runtime` 中的共用輔助工具。

當頻道需要以下由設定支援的對等端／群組時，請使用此方式：

- 由允許清單驅動的私訊對等端
- 已設定的頻道／群組對應表
- 帳號範圍的靜態目錄備援

`directory-runtime` 中的共用輔助工具僅處理通用操作：

- 查詢篩選
- 套用限制
- 去重／正規化輔助工具
- 建立 `ChannelDirectoryEntry[]`

頻道特定的帳號檢查及 ID 正規化應保留在外掛實作中。

## 供應商目錄

供應商外掛可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 定義用於推論的模型目錄。

`catalog.run(...)` 會傳回與 OpenClaw 寫入 `models.providers` 相同的結構：

- 單一供應商項目使用 `{ provider }`
- 多個供應商項目使用 `{ providers }`

當外掛擁有供應商特定的模型 ID、基礎 URL 預設值，或需要通過驗證才能取得的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw 內建隱含供應商的合併時機：

- `simple`：純 API 金鑰或環境變數驅動的供應商
- `profile`：存在驗證設定檔時才會出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：在其他隱含供應商之後的最後一輪

鍵發生衝突時，較後的供應商優先，因此外掛可以刻意覆寫具有相同供應商 ID 的內建供應商項目。

外掛也可以透過 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型資料列。這是清單／說明／選擇器介面的後續發展路徑，並支援 `text`、`voice`、`image_generation`、`video_generation` 及 `music_generation` 資料列。供應商外掛仍負責即時端點呼叫、權杖交換及廠商回應對應；核心則負責通用資料列結構、來源標籤及媒體工具說明格式。媒體生成供應商註冊會根據 `defaultModel`、`models` 及 `capabilities` 自動合成靜態目錄資料列。

相容性：

- `discovery` 仍可作為舊版別名使用，但會發出棄用警告
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog` 並發出警告
- `augmentModelCatalog` 已棄用；隨附供應商應透過 `registerModelCatalogProvider` 發布補充資料列

## 唯讀頻道檢查

如果你的外掛註冊了頻道，建議在 `resolveAccount(...)` 之外一併實作 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設認證資訊已完全具體化，並在缺少必要機密時快速失敗。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 等唯讀命令路徑，以及 doctor／設定修復流程，不應僅為了描述設定就需要具體化執行階段認證資訊。

建議的 `inspectAccount(...)` 行為：

- 僅傳回描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時包含認證資訊來源／狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 若只是要回報唯讀可用性，不需要傳回原始權杖值。對於狀態類命令，傳回 `tokenStatus: "available"`（以及相符的來源欄位）就已足夠。
- 當認證資訊透過 SecretRef 設定，但在目前的命令路徑中無法使用時，請使用 `configured_unavailable`。

如此一來，唯讀命令便能回報「已設定，但在此命令路徑中無法使用」，而不會當機或將帳號誤報為未設定。

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

每個項目都會成為一個外掛。若組合包列出多個擴充項目，外掛 ID 會變成 `<manifestOrPackageName>/<fileBase>`（若有資訊清單 ID，則以其為準；否則使用未限定範圍的 `package.json` 名稱）。

若你的外掛匯入 npm 相依套件，請將它們安裝在該目錄中，讓 `node_modules` 可供使用（`npm install` / `pnpm install`）。

安全防護措施：解析符號連結後，每個 `openclaw.extensions` 項目都必須位於外掛目錄內。任何逸出套件目錄的項目都會被拒絕。

安全注意事項：`openclaw plugins install` 會使用專案本機的 `npm install --omit=dev --ignore-scripts` 安裝外掛相依套件（不執行生命週期指令碼，執行階段也不包含開發相依套件），並忽略繼承的全域 npm 安裝設定。請讓外掛相依樹維持為「純 JS/TS」，並避免使用需要 `postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量、僅供設定使用的模組。當 OpenClaw 需要已停用頻道外掛的設定介面，或頻道外掛已啟用但仍未設定時，它會載入 `setupEntry`，而不是完整的外掛進入點。若你的主要外掛進入點也會連接工具、掛鉤或其他僅供執行階段使用的程式碼，這可讓啟動與設定流程更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可讓頻道外掛在閘道開始接聽前的啟動階段中採用相同的 `setupEntry` 路徑，即使該頻道已完成設定也一樣。

只有在 `setupEntry` 完整涵蓋閘道開始接聽前必須存在的啟動介面時，才應使用此選項。實務上，這表示設定進入點必須註冊啟動所依賴的每項頻道自有功能，例如：

- 頻道註冊本身
- 閘道開始接聽前必須可用的任何 HTTP 路由
- 同一時段內必須存在的任何閘道方法、工具或服務

如果完整進入點仍擁有任何必要的啟動功能，請勿啟用此旗標。讓外掛維持預設行為，並由 OpenClaw 在啟動期間載入完整進入點。

內建頻道也可以發布僅供設定使用的契約介面輔助函式，供核心在載入完整頻道執行階段前查詢。目前的設定提升介面為：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要將舊版單一帳號頻道設定提升至 `channels.<id>.accounts.*`，又不想載入完整外掛進入點時，會使用該介面。Matrix 是目前的內建範例：當具名帳號已存在時，它只會將驗證／啟動程序金鑰移入具名的提升帳號，且可以保留已設定但非標準的預設帳號金鑰，而不一定總是建立 `accounts.default`。

這些設定修補配接器可讓內建契約介面的探索維持延遲載入。匯入時保持輕量；提升介面只會在首次使用時載入，而不會在模組匯入時重新進入內建頻道啟動流程。

當這些啟動介面包含閘道 RPC 方法時，請將它們置於外掛專屬前綴之下。核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍為保留範圍，且一律解析為 `operator.admin`，即使外掛要求較窄的範圍也是如此。

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

頻道外掛可以透過 `openclaw.channel` 公告設定／探索中繼資料，並透過 `openclaw.install` 公告安裝提示。如此可讓核心目錄不含資料。

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

除了最小範例之外，實用的 `openclaw.channel` 欄位還包括：

- `detailLabel`：供資訊更豐富的目錄／狀態介面使用的次要標籤
- `docsLabel`：覆寫文件連結文字
- `preferOver`：此目錄項目應優先於哪些較低優先順序的外掛／頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選取介面的文案控制項
- `markdownCapable`：將頻道標記為支援 Markdown，以供外送格式決策使用
- `exposure.configured`：設為 `false` 時，在已設定頻道的清單介面中隱藏該頻道
- `exposure.setup`：設為 `false` 時，在互動式設定／配置選擇器中隱藏該頻道
- `exposure.docs`：將該頻道標記為文件導覽介面中的內部／私人頻道
- `showConfigured` / `showInSetup`：為了相容性仍接受的舊版別名；建議使用 `exposure`
- `quickstartAllowFrom`：選擇讓該頻道使用標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使僅存在一個帳號，也要求明確繫結帳號
- `preferSessionLookupForAnnounceTarget`：解析公告目標時優先查詢工作階段

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM 登錄匯出檔）。將 JSON 檔案放置於下列其中一個位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一個或多個 JSON 檔案（以逗號、分號或 `PATH` 分隔）。每個檔案都應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的頻道目錄項目和供應商安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開正規化後的安裝來源資訊。正規化資訊會識別 npm 規格是精確版本還是浮動選擇器、是否具有預期的完整性中繼資料，以及本機來源路徑是否也可用。當目錄／套件身分已知時，若剖析出的 npm 套件名稱偏離該身分，正規化資訊會發出警告。當 `defaultChoice` 無效或指向不可用的來源，以及 npm 完整性中繼資料存在但沒有有效的 npm 來源時，也會發出警告。使用端應將 `installSource` 視為附加的選用欄位，如此手動建立的項目和目錄相容層便不必合成該欄位。
如此一來，導入流程與診斷便能在不匯入外掛執行階段的情況下，說明來源層狀態。

官方外部 npm 項目應優先使用精確的 `npmSpec` 加上 `expectedIntegrity`。為了相容性，僅含套件名稱和發行標籤的形式仍可使用，但會顯示來源層警告，讓目錄能逐步轉向釘選且經過完整性檢查的安裝方式，而不會破壞現有外掛。當導入流程從本機目錄路徑安裝時，它會記錄一個受管理的外掛外掛索引項目，其中包含 `source: "path"`，並在可行時使用工作區相對的 `sourcePath`。絕對操作載入路徑仍保留在 `plugins.load.paths` 中；安裝記錄會避免將本機工作站路徑重複寫入長期設定。這可讓來源層診斷看見本機開發安裝，而不會增加第二個原始檔案系統路徑揭露介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝來源的唯一事實來源，且可在不載入外掛執行階段模組的情況下重新整理。即使外掛資訊清單遺失或無效，其 `installRecords` 對應仍會持久保存；其 `plugins` 承載資料則是可重建的資訊清單檢視。

## 上下文引擎外掛

上下文引擎外掛負責工作階段上下文的擷取、組裝和壓縮協調。請在你的外掛中使用 `api.registerContextEngine(id, factory)` 註冊，再透過 `plugins.slots.contextEngine` 選取作用中的引擎。

當你的外掛需要取代或擴充預設上下文管線，而不只是新增記憶搜尋或掛鉤時，請使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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

工廠函式的 `ctx` 會公開選用的 `config`、`agentDir` 和 `workspaceDir` 值，供建構階段初始化使用。

當作用中的控管框架具有持久化後端執行緒時，`assemble()` 可以傳回 `contextProjection`。若使用舊版的每回合投影，請省略此欄位。當組裝後的上下文應只注入後端執行緒一次，並重複使用直到 epoch 改變時，請傳回 `{ mode: "thread_bootstrap", epoch }`。當引擎的語意上下文改變後（例如引擎自有的壓縮流程完成後），請變更 epoch。主機可以在執行緒啟動投影中保留工具呼叫中繼資料、輸入形狀及經遮蔽的工具結果，讓新後端執行緒可維持工具連續性，而不必複製含有原始機密的承載資料。

如果你的引擎**不**擁有壓縮演算法，請保留 `compact()` 的實作並明確委派它：

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

## 新增功能

當外掛需要的行為不符合目前的 API 時，請勿透過私下存取內部實作來繞過
外掛系統。請新增缺少的功能。

建議順序：

1. **定義核心合約。** 決定核心應負責哪些共用行為：
   政策、備援、設定合併、生命週期、面向頻道的語意，以及
   執行階段輔助函式的形式。
2. **新增型別化的外掛註冊／執行階段介面。** 使用最小且實用的型別化
   功能介面擴充 `OpenClawPluginApi` 和／或 `api.runtime`。
3. **串接核心與頻道／功能使用端。** 頻道與功能外掛
   應透過核心使用新功能，而非直接匯入供應商
   實作。
4. **註冊供應商實作。** 接著由供應商外掛針對該功能註冊其
   後端。
5. **新增合約涵蓋範圍。** 新增測試，確保擁有權與註冊形式
   能隨時間持續保持明確。

OpenClaw 正是透過這種方式維持明確立場，同時不會硬編碼成單一
供應商的世界觀。具體的檔案檢查清單與完整範例，請參閱[功能實作手冊](/zh-TW/plugins/adding-capabilities)。

### 功能檢查清單

新增功能時，實作通常應一併涵蓋以下
介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心執行器／執行階段輔助函式
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄串接
- 當功能／頻道外掛需要使用時，在 `src/plugins/runtime/*` 中公開
  外掛執行階段介面
- `src/test-utils/plugin-registration.ts` 中的擷取／測試輔助函式
- `src/plugins/contracts/registry.ts` 中的擁有權／合約斷言
- `docs/` 中的操作人員／外掛文件

若缺少上述任一介面，通常表示該功能
尚未完整整合。

### 功能範本

最小模式：

```ts
// 核心合約
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

合約測試模式（`src/plugins/contracts/registry.ts` 會公開擁有權
查詢，例如 `providerContractPluginIds`；測試會斷言外掛的
`contracts.videoGenerationProviders` 清單與其實際註冊的內容一致）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這能讓規則保持簡單：

- 核心負責功能合約與協調
- 供應商外掛負責供應商實作
- 功能／頻道外掛使用執行階段輔助函式
- 合約測試確保擁有權明確

## 相關內容

- [外掛架構](/zh-TW/plugins/architecture) — 公開功能模型與形式
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
