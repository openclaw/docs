---
read_when:
    - 實作供應商執行階段掛鉤、頻道生命週期或套件組合
    - 偵錯外掛載入順序或登錄檔狀態
    - 新增外掛功能或情境引擎外掛
summary: 外掛架構內部機制：載入管線、登錄檔、執行階段鉤子、HTTP 路由與參考表格
title: 外掛架構內部機制
x-i18n:
    generated_at: "2026-07-11T21:31:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

關於公開能力模型、外掛形式，以及擁有權／執行合約，請參閱[外掛架構](/zh-TW/plugins/architecture)。本頁涵蓋內部機制：載入管線、登錄檔、執行階段鉤子、閘道 HTTP 路由、匯入路徑和結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下操作：

1. 探索候選外掛根目錄
2. 讀取原生或相容的套件組合資訊清單與套件中繼資料
3. 拒絕不安全的候選項目
4. 正規化外掛設定（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 決定是否啟用每個候選項目
6. 載入已啟用的原生模組：已建置的隨附模組使用原生載入器；第三方本機來源 TypeScript 則使用緊急備援的 Jiti
7. 呼叫原生 `register(api)` 鉤子，並將註冊項目收集至外掛登錄檔
8. 將登錄檔提供給命令／執行階段介面

<Note>
`activate` 是 `register` 的舊版別名——載入器會解析實際存在的項目（`def.register ?? def.activate`），並在相同階段呼叫它。所有隨附外掛皆使用 `register`；新外掛應優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**運作。若發生以下情況，探索程序會封鎖候選項目：

- 解析後的進入點超出外掛根目錄
- 其路徑（或根目錄）允許所有使用者寫入
- 對於非隨附外掛，路徑擁有者與目前的 uid（或 root）不符

對於允許所有使用者寫入的隨附目錄，會先嘗試就地執行 `chmod` 修復（npm／全域安裝可能會以 `0777` 權限提供套件目錄），再重新檢查閘門；對於隨附來源，則完全略過擁有權檢查。

若已知被封鎖候選項目的外掛 id，發出的診斷仍會包含該 id（包括從原本會遭拒絕的目錄內之資訊清單解析出的 id）。因此，參照該 id 的設定會看到與路徑安全警告相關聯的已封鎖外掛，而不是無關的「未知外掛」錯誤。

### 資訊清單優先行為

資訊清單是控制平面的事實來源。OpenClaw 使用它來：

- 識別外掛
- 探索宣告的頻道／Skills／設定結構描述或套件組合能力
- 驗證 `plugins.entries.<id>.config`
- 補充控制介面的標籤／預留位置
- 顯示安裝／目錄中繼資料
- 在不載入外掛執行階段的情況下，保留低成本的啟用與設定描述項

對於原生外掛，執行階段模組是資料平面的部分。它會註冊鉤子、工具、命令或供應商流程等實際行為。

選用的資訊清單 `activation` 與 `setup` 區塊會留在控制平面。它們只是用於啟用規劃與設定探索的中繼資料描述項；不會取代執行階段註冊、`register(...)` 或 `setupEntry`。即時啟用的取用端會使用資訊清單中的命令、頻道與供應商提示，在進行更廣泛的登錄檔實體化之前縮小外掛載入範圍：

- 命令列介面載入範圍會縮小至擁有所要求主要命令的外掛
- 頻道設定／外掛解析範圍會縮小至擁有所要求頻道 id 的外掛
- 明確的供應商設定／執行階段解析範圍會縮小至擁有所要求供應商 id 的外掛
- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入；沒有啟動中繼資料的外掛只會透過範圍更窄的啟用觸發條件載入

啟用規劃器同時提供僅含 id 的 API 給現有呼叫端，以及用於診斷的規劃 API。規劃項目會回報選取外掛的原因，並將明確的 `activation.*` 提示與資訊清單擁有權備援區分開來：

| 原因（來自 `activation.*` 提示）     | 原因（來自資訊清單擁有權）                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                             |
| `activation-capability-hint`         | —                                                                                             |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                        |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                  |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                             |
| —（鉤子觸發條件沒有提示變體）        | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

這項原因區分就是相容性邊界：現有外掛中繼資料可繼續運作，而新程式碼則能偵測廣泛提示或備援行為，且不會改變執行階段載入語意。

要求廣泛 `all` 範圍的請求期間執行階段預載入，仍會從設定、啟動規劃、已設定頻道、插槽及自動啟用規則，推導出一組明確且有效的外掛 id（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。如果推導出的集合為空，OpenClaw 會讓範圍保持為空，而不會擴大至所有可探索的外掛。

設定探索會優先使用描述項擁有的 id（例如 `setup.providers` 和 `setup.cliBackends`），以便先縮小候選外掛範圍，再針對仍需要設定期間執行階段鉤子的外掛，回退至 `setup-api`。供應商設定清單會使用資訊清單中的 `providerAuthChoices`、從描述項推導出的設定選項，以及安裝目錄中繼資料，而不載入供應商執行階段。明確的 `setup.requiresRuntime: false` 是僅限描述項的截止條件；若省略 `requiresRuntime`，則會保留舊版 `setup-api` 備援以維持相容性。如果多個已探索的外掛宣稱擁有相同的正規化設定供應商或命令列介面後端 id，設定查詢會拒絕模稜兩可的擁有者，而不是依賴探索順序。設定執行階段實際執行時，登錄檔診斷會回報 `setup.providers`／`setup.cliBackends` 與 `setup-api` 實際註冊的供應商或命令列介面後端之間的偏差，但不會封鎖舊版外掛。

### 外掛快取邊界

OpenClaw 不會以實際經過時間的時間窗來快取外掛探索結果或直接的資訊清單登錄資料。安裝、資訊清單編輯及載入路徑變更，必須在下一次明確讀取中繼資料或重建快照時呈現。資訊清單檔案剖析器會保留有界的檔案簽章快取，其索引鍵由已開啟的資訊清單路徑，加上裝置／inode、大小以及 mtime／ctime 組成；此快取只用於避免重複剖析未變更的位元組，不得快取探索、登錄檔、擁有者或政策答案。

安全的中繼資料快速路徑是明確的物件擁有權，而不是隱藏快取。閘道啟動的熱門路徑應沿呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、推導出的 `PluginLookUpTable`，或明確的資訊清單登錄檔。只要這些物件仍代表目前的設定與外掛清冊，設定驗證、啟動時自動啟用、外掛啟動載入及供應商選取就能重複使用它們。除非特定設定路徑收到明確的資訊清單登錄檔，否則設定查詢仍會隨需重建資訊清單中繼資料；應將其保留為冷路徑備援，而不是新增隱藏的查詢快取。輸入變更時，應重建並取代快照，而不是變更快照或保留歷史副本。針對作用中外掛登錄檔的檢視，以及隨附頻道的啟動載入輔助程式，都應從目前的登錄檔／根目錄重新計算。單次呼叫內可使用短期對應表來消除重複工作或防止重新進入；但它們不得成為程序中繼資料快取。

對於外掛載入，持久快取層位於執行階段載入。實際載入程式碼或已安裝成品時，它可以重複使用載入器狀態，例如：

- `PluginLoaderCacheState` 及相容的作用中執行階段登錄檔
- 用於避免重複匯入相同執行階段介面的 jiti／模組快取與公開介面載入器快取
- 已安裝外掛成品的檔案系統快取
- 用於路徑正規化或重複項目解析的短期單次呼叫對應表

這些快取是資料平面的實作細節。除非呼叫端明確要求載入執行階段，否則它們不得回答「哪個外掛擁有此供應商？」等控制平面問題。

請勿針對下列項目新增持久或實際經過時間快取：

- 探索結果
- 直接的資訊清單登錄檔
- 從已安裝外掛索引重建的資訊清單登錄檔
- 供應商擁有者查詢、模型抑制、供應商政策或公開成品中繼資料
- 任何其他從資訊清單推導出的答案，且資訊清單、已安裝索引或載入路徑的變更應在下一次中繼資料讀取時呈現

從持久化的已安裝外掛索引重建資訊清單中繼資料的呼叫端，會隨需重建該登錄檔。已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄檔模型

已載入的外掛不會直接任意修改核心全域狀態。它們會註冊至中央外掛登錄檔（`src/plugins/registry-types.ts` 中的 `PluginRegistry`）。此登錄檔會追蹤外掛記錄（身分、來源、來源類型、狀態、診斷），以及每種能力的陣列：工具、舊版鉤子和具型別鉤子、頻道、供應商、閘道 RPC 處理常式、HTTP 路由、命令列介面註冊程式、背景服務、外掛擁有的命令，以及數十種其他具型別的供應商系列（語音、嵌入、影像／影片／音樂生成、網頁擷取／搜尋、代理程式執行框架、工作階段動作等）。

核心功能接著會從該登錄檔讀取資料，而不是直接與外掛模組通訊。這可讓載入保持單向：

- 外掛模組 -> 登錄檔註冊
- 核心執行階段 -> 取用登錄檔

這項分離對可維護性很重要。這表示大多數核心介面只需要一個整合點：「讀取登錄檔」，而不是「為每個外掛模組加入特殊處理」。

## 對話綁定回呼

綁定對話的外掛可以在核准結果確定時作出回應。

使用 `api.onConversationBindingResolved(...)`，可在綁定要求獲准或遭拒後接收回呼：

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

回呼承載資料欄位：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准要求的已解析綁定
- `request`：原始要求摘要、解除連結提示、傳送者 id 與對話中繼資料

此回呼僅供通知。它不會變更誰有權綁定對話，而且會在核心核准處理完成後執行。

## 供應商執行階段鉤子

供應商外掛分為三層：

- 用於低成本執行階段前查詢的**資訊清單中繼資料**：
  `setup.providers[].envVars`、已棄用的相容性項目 `providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **設定期間鉤子**：`catalog`（舊版為 `discovery`）以及 `applyConfigDefaults`。
- **執行階段鉤子**：40 多個選用鉤子，涵蓋驗證、模型解析、串流包裝、思考層級、重播政策及用量端點。請參閱[鉤子順序與用法](#hook-order-and-usage)。

OpenClaw 仍負責通用代理程式迴圈、容錯移轉、逐字記錄處理和工具政策。這些鉤子是供應商特定行為的擴充介面，無須建立完整的自訂推論傳輸。

當供應商使用環境變數型憑證，且通用驗證、狀態或模型選擇器路徑需要在不載入外掛執行階段的情況下存取這些憑證時，請使用資訊清單中的 `setup.providers[].envVars`。在淘汰過渡期內，相容性配接器仍會讀取已淘汰的 `providerAuthEnvVars`，使用此欄位的非內建外掛則會收到資訊清單診斷訊息。當某個供應商 ID 應重用另一個供應商 ID 的環境變數、驗證設定檔、設定型驗證與 API 金鑰新手引導選項時，請使用資訊清單中的 `providerAuthAliases`。當新手引導或驗證選項的命令列介面需要在不載入供應商執行階段的情況下，得知供應商的選項 ID、群組標籤，以及僅需一個旗標的簡易驗證串接方式時，請使用資訊清單中的 `providerAuthChoices`。供應商執行階段的 `envVars` 應保留給面向操作人員的提示，例如新手引導標籤，或 OAuth 用戶端 ID／用戶端密鑰設定變數。

當頻道使用環境變數驅動的驗證或設定，且通用 shell 環境變數後援、設定／狀態檢查或設定提示需要在不載入頻道執行階段的情況下存取這些資訊時，請使用資訊清單中的 `channelEnvVars`。

### 鉤子順序與用法

對於模型／供應商外掛，OpenClaw 會大致依照以下順序呼叫鉤子。
「使用時機」欄是快速決策指南。
OpenClaw 已不再呼叫、僅供相容性使用的供應商欄位（例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`）刻意未列於此處。

| 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在產生 `models.json` 期間，將供應商設定發布至 `models.providers`                                | 供應商擁有目錄或基礎 URL 預設值                                                                                                  |
| `applyConfigDefaults`             | 在設定具體化期間套用供應商所擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或供應商模型系列語意                                                                         |
| _（內建模型查詢）_         | OpenClaw 會先嘗試一般的登錄檔／目錄路徑                                                          | _（不是外掛鉤子）_                                                                                                                         |
| `normalizeModelId`                | 在查詢前正規化舊版或預覽版模型 ID 別名                                                     | 供應商負責在解析標準模型前清理別名                                                                                 |
| `normalizeTransport`              | 在一般模型組裝前正規化供應商系列的 `api`／`baseUrl`                                      | 供應商負責清理同一傳輸系列中自訂供應商 ID 的傳輸設定                                                          |
| `normalizeConfig`                 | 在執行階段／供應商解析前正規化 `models.providers.<id>`                                           | 供應商需要應由外掛負責的設定清理；內建的 Google 系列輔助工具也會為支援的 Google 設定項目提供後備處理   |
| `applyNativeStreamingUsageCompat` | 對設定供應商套用原生串流用量相容性重寫                                               | 供應商需要由端點決定的原生串流用量中繼資料修正                                                                          |
| `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定供應商的環境標記驗證                                       | 供應商公開自己的環境標記 API 金鑰解析鉤子                                                                                |
| `resolveSyntheticAuth`            | 公開本機／自行託管或由設定支援的驗證，且不持久儲存明文                                   | 供應商可使用合成／本機憑證標記運作                                                                                 |
| `resolveExternalAuthProfiles`     | 疊加供應商所擁有的外部驗證設定檔；命令列介面／應用程式所擁有憑證的預設 `persistence` 為 `runtime-only` | 供應商重用外部驗證憑證，而不持久儲存複製的重新整理權杖；需在資訊清單中宣告 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留項降至環境／設定支援的驗證之後                                      | 供應商儲存不應取得優先順序的合成預留設定檔                                                                 |
| `resolveDynamicModel`             | 對尚未位於本機登錄檔中的供應商所擁有模型 ID 提供同步後備機制                                       | 供應商接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 非同步預熱，之後再次執行 `resolveDynamicModel`                                                           | 供應商在解析未知 ID 前需要網路中繼資料                                                                                  |
| `normalizeResolvedModel`          | 內嵌執行器使用已解析模型前的最終重寫                                               | 供應商需要傳輸重寫，但仍使用核心傳輸                                                                             |
| `normalizeToolSchemas`            | 在內嵌執行器看到工具結構描述前將其正規化                                                    | 供應商需要傳輸系列的結構描述清理                                                                                                |
| `inspectToolSchemas`              | 在正規化後公開供應商所擁有的結構描述診斷                                                  | 供應商需要關鍵字警告，而不必讓核心了解供應商特定規則                                                                 |
| `resolveReasoningOutputMode`      | 選擇原生或帶標記的推理輸出契約                                                              | 供應商需要帶標記的推理／最終輸出，而非原生欄位                                                                         |
| `prepareExtraParams`              | 在一般串流選項包裝器前正規化請求參數                                              | 供應商需要預設請求參數或個別供應商的參數清理                                                                           |
| `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                   | 供應商需要自訂線路協定，而不只是包裝器                                                                                     |
| `wrapStreamFn`                    | 套用一般包裝器後的串流包裝器                                                              | 供應商需要請求標頭／本文／模型相容性包裝器，但不需要自訂傳輸                                                          |
| `resolveTransportTurnState`       | 附加每回合的原生傳輸標頭或中繼資料                                                           | 供應商希望一般傳輸傳送供應商原生的回合識別資訊                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 供應商希望一般 WebSocket 傳輸可調整工作階段標頭或後備政策                                                               |
| `formatApiKey`                    | 驗證設定檔格式化器：將已儲存設定檔轉換為執行階段 `apiKey` 字串                                     | 供應商儲存額外驗證中繼資料，且需要自訂的執行階段權杖格式                                                                    |
| `refreshOAuth`                    | 用於自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 供應商不適用共用的 OpenClaw 重新整理器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 重新整理失敗後，供應商需要由其負責的驗證修復指引                                                                      |
| `matchesContextOverflowError`     | 供應商所擁有的內容脈絡視窗溢位比對器                                                                 | 供應商的原始溢位錯誤可能無法由一般啟發式方法偵測                                                                                |
| `classifyFailoverReason`          | 供應商所擁有的容錯移轉原因分類                                                                  | 供應商可將原始 API／傳輸錯誤對應至速率限制／過載等                                                                          |
| `isCacheTtlEligible`              | 適用於代理／回程供應商的提示詞快取政策                                                               | 供應商需要代理特定的快取存留時間條件判斷                                                                                                |
| `buildMissingAuthMessage`         | 取代一般的缺少驗證修復訊息                                                      | 供應商需要供應商特定的缺少驗證修復提示                                                                                 |
| `augmentModelCatalog`             | 在探索後附加合成／最終目錄列（已棄用，請參閱下文）                                  | 供應商需要在 `models list` 和選擇器中加入合成的向前相容列                                                                     |
| `resolveThinkingProfile`          | 模型特定的 `/think` 層級集合、顯示標籤與預設值                                                 | 供應商為特定模型公開自訂的思考層級或二元標籤                                                                 |
| `isBinaryThinking`                | 開啟／關閉推理切換相容性鉤子                                                                     | 供應商僅公開二元的思考開啟／關閉                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 供應商希望僅在部分模型上使用 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性鉤子                                                                      | 供應商負責某個模型系列的預設 `/think` 政策                                                                                      |
| `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的現代模型比對器                                              | 供應商負責即時／煙霧測試的偏好模型比對                                                                                             |
| `prepareRuntimeAuth`              | 在推論前一刻，將已設定的憑證交換為實際的執行階段權杖／金鑰                       | 供應商需要權杖交換或短效請求憑證                                                                             |
| `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的用量／計費憑證                                     | 供應商需要自訂用量／配額權杖剖析，或使用不同的用量憑證                                                               |
| `fetchUsageSnapshot`              | 在解析驗證後，擷取並正規化供應商特定的用量／配額快照                             | 供應商需要供應商特定的用量端點或承載資料剖析器                                                                           |
| `createEmbeddingProvider`         | 為記憶／搜尋建立由提供者擁有的嵌入配接器                                                     | 記憶嵌入行為應由提供者外掛負責                                                                                    |
| `buildReplayPolicy`               | 傳回用於控制提供者對逐字稿處理方式的重播政策                                        | 提供者需要自訂逐字稿政策（例如移除思考區塊）                                                               |
| `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷程                                                        | 除了共用壓縮輔助工具外，提供者還需要提供者專屬的重播重寫                                                             |
| `validateReplayTurns`             | 在嵌入式執行器執行前，對重播輪次進行最終驗證或重塑                                           | 經過通用清理後，提供者傳輸層需要更嚴格的輪次驗證                                                                    |
| `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 模型啟用時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 與 `normalizeConfig` 會先檢查相符的供應商外掛，接著依序嘗試其他具備鉤子能力的供應商外掛，直到其中一個實際變更模型 ID 或傳輸／設定為止。如此可讓別名／相容性供應商墊片持續運作，而無須要求呼叫端知道是哪個內建外掛負責改寫。若沒有任何供應商鉤子改寫支援的 Google 系列設定項目，內建的 Google 設定正規化器仍會套用該相容性清理。

若供應商需要完全自訂的線路通訊協定或自訂要求執行器，則屬於不同類型的擴充。這些鉤子適用於仍在 OpenClaw 標準推論迴圈中執行的供應商行為。

`resolveUsageAuth` 會決定 OpenClaw 應呼叫 `fetchUsageSnapshot`，還是針對用量／狀態介面回退至通用憑證解析。當供應商具有用量憑證時，傳回 `{ token, accountId?, subscriptionType?, rateLimitTier? }`（選用的方案中繼資料會傳入 `fetchUsageSnapshot`）；當供應商自行管理的用量驗證已處理要求，且必須抑制通用 API 金鑰／OAuth 回退時，傳回 `{ handled: true }`；當供應商未處理用量驗證時，則傳回 `null` 或 `undefined`。

請在資訊清單的 `providerUsageAuthEnvVars` 中宣告組織或計費憑證。這可讓通用探索與祕密清除介面辨識這些憑證，而不會將其視為推論驗證候選項目。

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

內建供應商外掛會組合上述鉤子，以配合各供應商的目錄、驗證、思考、重播與用量需求。具權威性的鉤子集合位於 `extensions/` 下的各個外掛中；本頁僅說明其形式，而非複製完整清單。

<AccordionGroup>
  <Accordion title="直通式目錄供應商">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog`，以及
    `resolveDynamicModel`／`prepareDynamicModel`，使其能在 OpenClaw
    的靜態目錄之前呈現上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 與用量端點供應商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai
    會將 `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 搭配使用，以自行管理權杖交換與 `/usage` 整合。
  </Accordion>
  <Accordion title="重播與逐字稿清理系列">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）可讓供應商透過
    `buildReplayPolicy` 選擇採用逐字稿政策，而無須由每個外掛重新實作清理。
  </Accordion>
  <Accordion title="僅提供目錄的供應商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 與
    `volcengine` 僅註冊 `catalog`，並使用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用串流輔助程式">
    Beta 標頭、`/fast`／`serviceTier` 與 `context1m` 位於 Anthropic
    外掛的公開 `api.ts`／`contract-api.ts` 接縫中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），
    而非通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 執行階段輔助程式

外掛可透過 `api.runtime` 存取特定核心輔助程式。若要使用 TTS：

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

- `textToSpeech` 會針對檔案／語音訊息介面傳回標準核心 TTS 輸出承載資料。
- 使用核心 `messages.tts` 設定與供應商選擇。
- 傳回 PCM 音訊緩衝區與取樣率。外掛必須針對供應商重新取樣／編碼。
- 每個供應商可選擇是否提供 `listVoices`。可將其用於供應商自行管理的語音選擇器或設定流程。
- 核心會將已解析的要求期限傳給供應商的 `listVoices` 鉤子；供應商專屬的逾時設定可覆寫該期限。
- 語音清單可包含更豐富的中繼資料，例如語系、性別與個性標籤，供能感知供應商的選擇器使用。
- OpenAI 與 ElevenLabs 目前支援電話語音。Microsoft 不支援。

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

- 將 TTS 政策、回退與回覆傳遞保留在核心中。
- 使用語音供應商處理供應商自行管理的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 供應商 ID。
- 建議的所有權模型以公司為導向：隨著 OpenClaw 新增這些能力合約，同一個供應商外掛可擁有文字、語音、影像及未來的媒體供應商。

針對影像／音訊／影片理解，外掛會註冊單一具型別的媒體理解供應商，而非通用的鍵／值集合：

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

- 將協調、回退、設定與頻道配線保留在核心中。
- 將供應商行為保留在供應商外掛中。
- 增量擴充應維持具型別：新增選用方法、新增選用結果欄位、新增選用能力。
- 影片生成已遵循相同模式：
  - 核心擁有能力合約與執行階段輔助程式
  - 供應商外掛註冊 `api.registerVideoGenerationProvider(...)`
  - 功能／頻道外掛使用 `api.runtime.videoGeneration.*`

針對媒體理解執行階段輔助程式，外掛可呼叫：

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

- `api.runtime.mediaUnderstanding.*` 是影像／音訊／影片理解的首選共用介面。
- `extractStructuredWithModel(...)` 是供外掛使用的接縫，適用於範圍受限、由供應商自行管理、以影像為優先的擷取。請至少包含一個影像輸入；文字輸入僅作為補充脈絡。產品外掛擁有其路由與結構描述，而 OpenClaw 擁有供應商／執行階段邊界。
- 使用核心媒體理解音訊設定（`tools.media.audio`）與供應商回退順序。
- 未產生轉錄輸出時（例如輸入遭略過／不受支援），傳回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 會繼續保留為相容性別名。

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

- `provider` 與 `model` 是每次執行的選用覆寫，不是永久工作階段變更。
- OpenClaw 僅針對受信任的呼叫端採用這些覆寫欄位。
- 對於外掛自行管理的回退執行，操作人員必須使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選擇啟用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任的外掛限制為特定的標準 `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任外掛的子代理程式執行仍可運作，但覆寫要求會遭拒絕，而非無聲回退。
- 外掛建立的子代理程式工作階段會標記建立者外掛 ID。回退用的 `api.runtime.subagent.deleteSession(...)` 僅能刪除這些自有工作階段；刪除任意工作階段仍需要具管理員範圍的閘道要求。

針對網路搜尋，外掛可使用共用執行階段輔助程式，而無須深入代理程式工具配線：

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

外掛也可透過 `api.registerWebSearchProvider(...)` 註冊網路搜尋供應商。

注意事項：

- 將供應商選擇、憑證解析與共用要求語意保留在核心中。
- 使用網路搜尋供應商處理供應商專屬的搜尋傳輸。
- 對於需要搜尋行為、但不希望依賴代理程式工具包裝函式的功能／頻道外掛，`api.runtime.webSearch.*` 是首選共用介面。

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

外掛可使用 `api.registerHttpRoute(...)` 公開 HTTP 端點。

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
- `auth`：必填，值為 `"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求一般閘道驗證，或使用 `"plugin"` 進行外掛管理的驗證／網路鉤子驗證。
- `match`：選填。`"exact"`（預設）或 `"prefix"`。
- `handleUpgrade`：選填，用於處理相同路由上 WebSocket 升級要求的處理常式。
- `replaceExisting`：選填。允許同一外掛取代自己現有的路由註冊。
- `handler`：路由已處理要求時傳回 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，並會造成外掛載入錯誤。請改用 `api.registerHttpRoute(...)`。
- 外掛路由必須明確宣告 `auth`。
- 除非設定 `replaceExisting: true`，否則完全相同的 `path + match` 衝突會遭拒絕，而且一個外掛不能取代另一個外掛的路由。
- 使用不同 `auth` 層級的重疊路由會遭拒絕。`exact`／`prefix` 後續比對鏈只能使用相同的驗證層級。
- `auth: "plugin"` 路由**不會**自動取得操作員執行階段範圍。這類路由用於外掛管理的網路鉤子／簽章驗證，而不是具權限的閘道輔助呼叫。
- `auth: "gateway"` 路由在閘道要求的執行階段範圍內執行。預設介面（`gatewayRuntimeScopeSurface: "write-default"`）刻意採取保守設計：
  - 共用密鑰持有人驗證（`gateway.auth.mode = "token"`／`"password"`）及任何非信任 Proxy 的驗證方法只會取得單一 `operator.write` 範圍，即使呼叫端傳送 `x-openclaw-scopes` 亦然
  - 未提供明確 `x-openclaw-scopes` 標頭的 `trusted-proxy` 呼叫端，也會維持舊有的僅限 `operator.write` 介面
  - 有傳送 `x-openclaw-scopes` 的 `trusted-proxy` 呼叫端則會取得所宣告的範圍
  - 路由可選擇採用 `gatewayRuntimeScopeSurface: "trusted-operator"`，對帶有身分的驗證模式一律遵循 `x-openclaw-scopes`（若未提供該標頭，則退回完整的命令列介面預設範圍集合）
- 實務原則：不要假設經閘道驗證的外掛路由隱含具有管理員介面。若路由需要僅限管理員的行為，請選擇採用 `trusted-operator` 範圍介面、要求帶有身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭契約。
- 完成路由比對與驗證後，一般處理常式會參與閘道根工作准入。處於準備中或重新啟動中的閘道會在叫用處理常式前傳回 `503`。唯一的狹義例外，是資訊清單授權的 `auth: "gateway"` 路由，同時也選擇採用路由專用的 `trusted-operator` 介面；該路由仍可存取，以免暫停控制分派無法進行，而同一外掛的一般同層路由仍位於准入邊界之後。WebSocket `handleUpgrade` 的擁有權採用相同的不可分割准入邊界；處理常式一旦接受通訊端，該通訊端後續的生命週期即由外掛擁有，且不受此邊界追蹤。

## 外掛 SDK 匯入路徑

撰寫新外掛時，請使用範圍較窄的 SDK 子路徑，而非單體式的 `openclaw/plugin-sdk` 根彙整匯出。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 外掛註冊基礎元件                                   |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點／建置輔助工具                           |
| `openclaw/plugin-sdk/core`          | 通用共用輔助工具與傘狀契約                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

頻道外掛應從一系列範圍較窄的介面中選用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 與 `channel-actions`。核准行為應整合至單一
`approvalCapability` 契約，而不是混用互不相關的外掛欄位。
請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於相對應且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation`，
而非廣泛的 `config-runtime` 相容性彙整匯出。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型頻道輔助門面、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
與 `openclaw/plugin-sdk/infra-runtime` 是供舊版外掛使用、現已淘汰的相容性
轉接層。新程式碼應改為匯入範圍更窄的通用基礎元件。
</Info>

儲存庫內部進入點（以各內建外掛套件根目錄為準）：

- `index.js` — 內建外掛進入點
- `api.js` — 輔助工具／型別彙整匯出
- `runtime-api.js` — 僅限執行階段的彙整匯出
- `setup-entry.js` — 設定外掛進入點

外部外掛只能匯入 `openclaw/plugin-sdk/*` 子路徑。核心或其他外掛絕不可
匯入另一個外掛套件的 `src/*`。透過門面載入的進入點會在現有作用中
執行階段設定快照存在時優先使用該快照，否則退回磁碟上解析出的設定檔。

`image-generation`、`media-understanding` 與 `speech` 等特定功能子路徑之所以
存在，是因為內建外掛目前正在使用它們。它們不會自動成為長期固定的外部
契約；依賴這些子路徑時，請查閱相關的 SDK 參考頁面。

## 訊息工具結構描述

對於回應、讀取及投票等非訊息基礎元件，外掛應擁有頻道專屬的
`describeMessageTool(...)` 結構描述擴充項目。共用傳送呈現應使用通用的
`MessagePresentation` 契約，而不是供應商原生的按鈕、元件、區塊或卡片欄位。
有關契約、退回規則、供應商對應及外掛作者檢查清單，請參閱
[訊息呈現](/zh-TW/plugins/message-presentation)。

具備傳送能力的外掛透過訊息功能宣告其可呈現的內容：

- `presentation`：用於語意呈現區塊（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）
- `delivery-pin`：用於置頂傳送要求

核心決定要以原生方式呈現內容，或將其降級為文字。請勿從通用訊息工具
公開供應商原生 UI 的逃生通道。舊版原生結構描述所用的已淘汰 SDK
輔助工具仍會匯出，以供現有第三方外掛使用，但新外掛不應使用它們。

## 頻道目標解析

頻道外掛應擁有頻道專屬的目標語意。共用輸出主機應保持通用，並使用訊息
配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在查詢目錄前，判斷正規化目標
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告知核心輸入是否
  應略過目錄搜尋，直接進行類似 ID 的解析。
- `messaging.targetResolver.reservedLiterals` 列出對該供應商而言屬於
  頻道／工作階段參照的單獨詞彙。解析會先保留已設定的目錄項目，再拒絕
  保留字面值，接著在目錄未命中時以封閉方式失敗。
- `messaging.targetResolver.resolveTarget(...)` 是核心在正規化後或目錄
  未命中後，需要由供應商擁有的最終解析時所使用的外掛退回機制。
- `messaging.resolveOutboundSessionRoute(...)` 在目標解析完成後，負責建構
  供應商專屬的工作階段路由。

建議的職責劃分：

- 使用 `inferTargetChatType` 處理應在搜尋對等端／群組前完成的類別判斷。
- 使用 `looksLikeId` 檢查「將此項視為明確／原生目標 ID」。
- 使用 `resolveTarget` 處理供應商專屬的正規化退回機制，而非廣泛的目錄搜尋。
- 將聊天 ID、討論串 ID、JID、控制代碼及聊天室 ID 等供應商原生 ID
  保留在 `target` 值或供應商專屬參數中，而非通用 SDK 欄位中。

## 設定支援的目錄

從設定衍生目錄項目的外掛，應將該邏輯保留在外掛中，並重複使用
`openclaw/plugin-sdk/directory-runtime` 的共用輔助工具。

當頻道需要由設定支援的對等端／群組時，請使用此機制，例如：

- 由允許清單驅動的私訊對等端
- 已設定的頻道／群組對應
- 帳號範圍的靜態目錄退回機制

`directory-runtime` 中的共用輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重／正規化輔助工具
- 建置 `ChannelDirectoryEntry[]`

頻道專屬的帳號檢查與 ID 正規化應保留在外掛實作中。

## 供應商目錄

供應商外掛可使用
`registerProvider({ catalog: { run(...) { ... } } })`
定義用於推論的模型目錄。

`catalog.run(...)` 傳回的形狀與 OpenClaw 寫入
`models.providers` 的形狀相同：

- `{ provider }`：單一供應商項目
- `{ providers }`：多個供應商項目

當外掛擁有供應商專屬的模型 ID、基礎 URL 預設值或受驗證限制的模型
中繼資料時，請使用 `catalog`。

`catalog.order` 控制外掛目錄相對於 OpenClaw 內建隱含供應商的合併時機：

- `simple`：純 API 金鑰或由環境驅動的供應商
- `profile`：驗證設定檔存在時才出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：在其他隱含供應商之後進行的最後一次處理

發生鍵值衝突時，較後面的供應商會優先，因此外掛可刻意使用相同的供應商
ID 覆寫內建供應商項目。

外掛也可透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是清單／說明／選擇器介面的後續發展方向，並支援
`text`、`voice`、`image_generation`、`video_generation` 與 `music_generation`
列。供應商外掛仍負責即時端點呼叫、權杖交換及廠商回應對應；核心則負責
通用列形狀、來源標籤與媒體工具說明格式。媒體產生供應商註冊會根據
`defaultModel`、`models` 與 `capabilities` 自動合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名使用，但會發出淘汰警告
- 若同時註冊 `catalog` 與 `discovery`，OpenClaw 會使用 `catalog`
  並發出警告
- `augmentModelCatalog` 已淘汰；內建供應商應透過
  `registerModelCatalogProvider` 發布補充列

## 唯讀頻道檢查

若外掛註冊了頻道，建議在 `resolveAccount(...)` 之外，同時實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證已完整具體化，
  並在缺少必要密鑰時立即失敗。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 等唯讀命令路徑，
  以及診斷／設定修復流程，不應僅為描述設定就必須具體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 僅傳回描述性的帳戶狀態。
- 保留 `enabled` 與 `configured`。
- 適用時，請包含憑證來源／狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 若只是報告唯讀可用性，無須傳回原始權杖值。對於狀態類命令，傳回 `tokenStatus: "available"`（以及對應的來源欄位）即可。
- 當憑證透過 SecretRef 設定，但在目前的命令路徑中不可用時，請使用 `configured_unavailable`。

如此一來，唯讀命令便可報告「已設定，但在此命令路徑中不可用」，而不會當機或誤報帳戶尚未設定。

## 套件組

外掛目錄可包含一個具有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個外掛。如果套件組列出多個擴充項目，外掛 ID 會變成 `<manifestOrPackageName>/<fileBase>`（若有資訊清單 ID，則以它為準；否則使用不含範圍的 `package.json` 名稱）。

如果你的外掛匯入 npm 相依套件，請在該目錄中安裝它們，讓 `node_modules` 可供使用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在解析符號連結後，都必須位於外掛目錄內。任何逸出套件目錄的項目都會遭到拒絕。

安全性注意事項：`openclaw plugins install` 會使用專案本機的 `npm install --omit=dev --ignore-scripts` 安裝外掛相依套件（不執行生命週期指令碼，執行階段也不包含開發相依套件），並忽略繼承的全域 npm 安裝設定。外掛的相依套件樹應保持為「純 JS/TS」，並避免使用需要 `postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可指向輕量的僅限設定模組。當 OpenClaw 需要已停用頻道外掛的設定介面，或頻道外掛已啟用但仍未設定時，它會載入 `setupEntry`，而不是完整的外掛進入點。若主要外掛進入點還會連接工具、掛鉤或其他僅供執行階段使用的程式碼，這可讓啟動與設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可讓頻道外掛在閘道開始監聽前的啟動階段使用相同的 `setupEntry` 路徑，即使該頻道已完成設定亦然。

僅當 `setupEntry` 完整涵蓋閘道開始監聽前必須存在的啟動介面時，才使用此選項。實務上，這表示設定進入點必須註冊啟動所依賴的每項頻道所屬能力，例如：

- 頻道註冊本身
- 閘道開始監聽前必須可用的任何 HTTP 路由
- 在同一時段內必須存在的任何閘道方法、工具或服務

如果完整進入點仍擁有任何必要的啟動能力，請勿啟用此旗標。讓外掛維持預設行為，並由 OpenClaw 在啟動期間載入完整進入點。

隨附頻道也可發布僅限設定的契約介面輔助程式，讓核心在載入完整頻道執行階段前查詢。目前的設定提升介面為：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要將舊版單一帳戶頻道設定提升至 `channels.<id>.accounts.*`，且不想載入完整外掛進入點時，便會使用此介面。Matrix 是目前的隨附範例：當具名帳戶已存在時，它只會將驗證／啟動載入鍵移至具名的提升帳戶中；此外，它也能保留已設定但非標準的預設帳戶鍵，而非一律建立 `accounts.default`。

這些設定修補轉接器可讓隨附契約介面的探索維持延遲載入。匯入時保持輕量；提升介面只會在首次使用時載入，而不會在模組匯入時重新進入隨附頻道的啟動流程。

當這些啟動介面包含閘道 RPC 方法時，請將其置於外掛專屬前綴下。核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍為保留範圍，且一律解析為 `operator.admin`，即使外掛要求更窄的範圍亦然。

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

頻道外掛可透過 `openclaw.channel` 宣告設定／探索中繼資料，並透過 `openclaw.install` 宣告安裝提示。如此可讓核心目錄不含資料。

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

除最小範例外，其他實用的 `openclaw.channel` 欄位：

- `detailLabel`：用於資訊更豐富的目錄／狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於哪些較低優先級的外掛／頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面的文案控制項
- `markdownCapable`：將頻道標記為支援 Markdown，以供外送格式決策使用
- `exposure.configured`：設為 `false` 時，從已設定頻道的列表介面中隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定／配置選擇器中隱藏該頻道
- `exposure.docs`：將頻道標記為文件導覽介面中的內部／私人頻道
- `showConfigured` / `showInSetup`：為了相容性仍接受的舊版別名；請優先使用 `exposure`
- `quickstartAllowFrom`：讓頻道採用標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳戶，也要求明確綁定帳戶
- `preferSessionLookupForAnnounceTarget`：解析公告目標時優先查詢工作階段

OpenClaw 也可合併**外部頻道目錄**（例如 MPM 登錄檔匯出）。請將 JSON 檔案放置於下列其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一或多個 JSON 檔案（以逗號、分號或 `PATH` 分隔）。每個檔案應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。剖析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的頻道目錄項目與提供者安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開正規化的安裝來源資訊。正規化資訊會識別 npm 規格是確切版本還是浮動選取器、是否存在預期的完整性中繼資料，以及本機來源路徑是否亦可使用。已知目錄／套件識別資訊時，如果剖析出的 npm 套件名稱偏離該識別資訊，正規化資訊便會發出警告。若 `defaultChoice` 無效或指向不可用的來源，或 npm 完整性中繼資料存在但沒有有效的 npm 來源，也會發出警告。使用者應將 `installSource` 視為可選的附加欄位，如此手動建立的項目與目錄相容層便不必合成它。
這讓新手引導與診斷無須匯入外掛執行階段，就能說明來源層狀態。

官方外部 npm 項目應優先使用確切的 `npmSpec` 加上 `expectedIntegrity`。為了相容性，僅有套件名稱與 dist-tag 仍然有效，但它們會顯示來源層警告，讓目錄可逐步轉向鎖定版本並檢查完整性的安裝方式，而不會破壞現有外掛。當新手引導從本機目錄路徑安裝時，會記錄一筆 `source: "path"` 的受管理外掛索引項目，並在可行時使用工作區相對的 `sourcePath`。絕對作業載入路徑仍保留於 `plugins.load.paths`；安裝記錄則避免將本機工作站路徑重複寫入長期設定。如此可讓來源層診斷看見本機開發安裝，而不會增加第二個原始檔案系統路徑揭露介面。持久化的 `installed_plugin_index` SQLite 資料表是安裝來源的唯一真實依據，且可在不載入外掛執行階段模組的情況下重新整理。即使外掛資訊清單遺失或無效，其 `installRecords` 對應仍可持久保存；其 `plugins` 承載內容則是可重建的資訊清單檢視。

## 上下文引擎外掛

上下文引擎外掛負責擷取、組裝與壓縮的工作階段上下文協調。請在外掛中使用 `api.registerContextEngine(id, factory)` 註冊，然後透過 `plugins.slots.contextEngine` 選取作用中的引擎。

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

工廠函式的 `ctx` 會公開選用的 `config`、`agentDir` 與 `workspaceDir` 值，供建構階段初始化使用。

當作用中的執行框架具有持久化後端執行緒時，`assemble()` 可傳回 `contextProjection`。舊版的每回合投影則省略此欄位。當組裝後的上下文應注入後端執行緒一次，並持續重複使用直到 epoch 變更時，請傳回 `{ mode: "thread_bootstrap", epoch }`。引擎的語意上下文變更後（例如引擎自行完成一次壓縮流程後），請變更 epoch。主機可在線程啟動投影中保留工具呼叫中繼資料、輸入形狀與經遮蔽的工具結果，使新的後端執行緒無須複製含有原始秘密資訊的承載內容，也能延續工具操作。

如果你的引擎**不**擁有壓縮演算法，請保留 `compact()` 的實作，並明確委派它：

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

當外掛需要目前 API 無法涵蓋的行為時，請勿以私下存取內部實作的方式繞過外掛系統。請新增缺少的功能。

建議順序：

1. **定義核心契約。** 決定核心應負責哪些共用行為：政策、後援機制、設定合併、生命週期、面向頻道的語意，以及執行階段輔助函式的形式。
2. **新增具型別的外掛註冊／執行階段介面。** 以最小且實用的具型別功能介面擴充 `OpenClawPluginApi` 及／或 `api.runtime`。
3. **連接核心與頻道／功能使用端。** 頻道與功能外掛應透過核心使用新功能，而不是直接匯入供應商實作。
4. **註冊供應商實作。** 接著由供應商外掛將其後端註冊至此功能。
5. **新增契約涵蓋測試。** 新增測試，讓所有權與註冊形式隨時間持續保持明確。

這種做法讓 OpenClaw 能維持明確的設計立場，而不會硬編碼成單一供應商的世界觀。具體的檔案檢查清單與完整範例，請參閱[功能實作指南](/zh-TW/plugins/adding-capabilities)。

### 功能檢查清單

新增功能時，實作通常應同時涵蓋下列介面：

- `src/<capability>/types.ts` 中的核心契約型別
- `src/<capability>/runtime.ts` 中的核心執行器／執行階段輔助函式
- `src/plugins/types.ts` 中的外掛 API 註冊介面
- `src/plugins/registry.ts` 中的外掛登錄連接
- 當功能／頻道外掛需要使用此功能時，於 `src/plugins/runtime/*` 中提供外掛執行階段介面
- `src/test-utils/plugin-registration.ts` 中的擷取／測試輔助函式
- `src/plugins/contracts/registry.ts` 中的所有權／契約斷言
- `docs/` 中的操作者／外掛文件

如果缺少其中任何一個介面，通常表示此功能尚未完整整合。

### 功能範本

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

契約測試模式（`src/plugins/contracts/registry.ts` 會公開 `providerContractPluginIds` 等所有權查詢；測試會斷言外掛的 `contracts.videoGenerationProviders` 清單與其實際註冊內容相符）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

這能讓規則保持簡單：

- 核心負責功能契約與協調流程
- 供應商外掛負責供應商實作
- 功能／頻道外掛使用執行階段輔助函式
- 契約測試確保所有權明確

## 相關內容

- [外掛架構](/zh-TW/plugins/architecture) — 公開功能模型與形式
- [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
