---
read_when:
    - 實作提供者執行階段掛鉤、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或註冊表狀態
    - 新增 Plugin 功能或上下文引擎 Plugin
summary: Plugin 架構內部：載入管線、註冊表、執行階段鉤子、HTTP 路由與參考表
title: Plugin 架構內部機制
x-i18n:
    generated_at: "2026-05-03T21:36:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

關於公開能力模型、Plugin 形狀，以及擁有權/執行合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是內部機制的參考：載入管線、登錄表、執行階段掛鉤、Gateway HTTP 路由、匯入路徑，以及結構描述表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下動作：

1. 探索候選 Plugin 根目錄
2. 讀取原生或相容的 bundle manifest 與套件中繼資料
3. 拒絕不安全的候選項
4. 正規化 Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 判定每個候選項是否啟用
6. 載入已啟用的原生模組：建置後的內建 bundled 模組使用原生載入器；第三方本機來源 TypeScript 使用緊急 Jiti 備援
7. 呼叫原生 `register(api)` 掛鉤，並將註冊項目收集到 Plugin 登錄表
8. 將登錄表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名：載入器會解析存在的項目（`def.register ?? def.activate`），並在相同時間點呼叫它。所有 bundled Plugin 都使用 `register`；新的 Plugin 請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當進入點逸出 Plugin 根目錄、路徑可由所有人寫入，或非 bundled Plugin 的路徑擁有權看起來可疑時，候選項會被封鎖。

被封鎖的候選項仍會為了診斷而綁定到其 Plugin id。如果設定仍參照該 id，驗證會將該 Plugin 回報為存在但已封鎖，並指回路徑安全警告，而不是把該設定項目視為過時。

### Manifest 優先行為

Manifest 是控制平面的真實來源。OpenClaw 會用它來：

- 識別 Plugin
- 探索宣告的頻道/Skills/設定結構描述或 bundle 能力
- 驗證 `plugins.entries.<id>.config`
- 補充 Control UI 標籤/placeholder
- 顯示安裝/目錄中繼資料
- 在不載入 Plugin 執行階段的情況下，保留低成本的啟用與設定描述子

對於原生 Plugin，執行階段模組是資料平面部分。它會註冊實際行為，例如掛鉤、工具、命令或 provider 流程。

選用的 manifest `activation` 與 `setup` 區塊會留在控制平面。它們是僅含中繼資料的描述子，用於啟用規劃與設定探索；它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。第一批即時啟用消費者現在會使用 manifest 命令、頻道與 provider 提示，在更廣泛的登錄表具現化之前縮小 Plugin 載入範圍：

- CLI 載入會縮小到擁有所請求主要命令的 Plugin
- 頻道設定/Plugin 解析會縮小到擁有所請求頻道 id 的 Plugin
- 明確的 provider 設定/執行階段解析會縮小到擁有所請求 provider id 的 Plugin
- Gateway 啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入與啟動退出；沒有啟動中繼資料的 Plugin 只會透過更窄的啟用觸發器載入

請求期間的執行階段預載若要求廣泛的 `all` 範圍，仍會從設定、啟動規劃、已設定頻道、slot 與自動啟用規則衍生明確的有效 Plugin id 集合。如果該衍生集合為空，OpenClaw 會載入空的執行階段登錄表，而不是擴大到每個可探索的 Plugin。

啟用規劃器會同時公開給既有呼叫端使用的僅 ids API，以及供新診斷使用的 plan API。Plan 項目會回報 Plugin 被選取的原因，並區分明確的 `activation.*` 規劃器提示與 manifest 擁有權備援，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和掛鉤。這種原因拆分就是相容性邊界：既有 Plugin 中繼資料會持續運作，而新程式碼可以偵測廣泛提示或備援行為，且不改變執行階段載入語義。

設定探索現在會優先使用描述子擁有的 id，例如 `setup.providers` 與 `setup.cliBackends`，在退回到仍需要設定期間執行階段掛鉤的 Plugin 所用 `setup-api` 之前縮小候選 Plugin。Provider 設定清單會使用 manifest `providerAuthChoices`、由描述子衍生的設定選項，以及安裝目錄中繼資料，而不載入 provider 執行階段。明確的 `setup.requiresRuntime: false` 是僅限描述子的截止點；省略的 `requiresRuntime` 會保留舊版 `setup-api` 備援以維持相容性。如果多個已探索 Plugin 宣稱相同的正規化設定 provider 或 CLI backend id，設定查找會拒絕含糊的擁有者，而不是依賴探索順序。當設定執行階段確實執行時，登錄表診斷會回報 `setup.providers` / `setup.cliBackends` 與 setup-api 註冊的 provider 或 CLI backend 之間的偏移，但不會封鎖舊版 Plugin。

### Plugin 快取邊界

OpenClaw 不會在以牆上時鐘時間為基準的時間窗後方，快取 Plugin 探索結果或直接 manifest 登錄表資料。安裝、manifest 編輯與載入路徑變更，必須在下一次明確中繼資料讀取或 snapshot 重建時可見。Manifest 檔案解析器可以保留有界的檔案簽章快取，以開啟的 manifest 路徑、inode、大小與時間戳記作為 key；該快取只會避免重新解析未變更的位元組，且不得快取探索、登錄表、擁有者或策略答案。

安全的中繼資料快速路徑是明確物件擁有權，而不是隱藏快取。Gateway 啟動熱路徑應該透過呼叫鏈傳遞目前的 `PluginMetadataSnapshot`、衍生的 `PluginLookUpTable`，或明確的 manifest 登錄表。設定驗證、啟動自動啟用、Plugin bootstrap 與 provider 選擇，可以在這些物件代表目前設定與 Plugin inventory 時重用它們。設定查找仍會視需要重建 manifest 中繼資料，除非特定設定路徑收到明確的 manifest 登錄表；請將它保留為冷路徑備援，而不是新增隱藏查找快取。當輸入變更時，請重建並替換 snapshot，而不是改動它或保留歷史副本。
作用中 Plugin 登錄表上的檢視與 bundled 頻道 bootstrap helper 應該從目前的登錄表/根目錄重新計算。短生命週期 map 在單次呼叫內用於去重工作或防止重入是可以的；它們不得變成程序中繼資料快取。

對於 Plugin 載入，持久快取層是執行階段載入。當程式碼或已安裝成品確實被載入時，它可以重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄表
- 用來避免重複匯入相同執行階段介面的 jiti/module 快取與公開介面載入器快取
- 已安裝 Plugin 成品的檔案系統快取
- 用於路徑正規化或重複項解析的短生命週期每次呼叫 map

這些快取是資料平面實作細節。它們不得回答控制平面問題，例如「哪個 Plugin 擁有這個 provider？」除非呼叫端刻意要求執行階段載入。

不要為以下項目新增持久或牆上時鐘快取：

- 探索結果
- 直接 manifest 登錄表
- 從已安裝 Plugin index 重建的 manifest 登錄表
- provider 擁有者查找、模型抑制、provider 策略，或公開成品中繼資料
- 任何其他由 manifest 衍生的答案，其中已變更的 manifest、已安裝 index 或載入路徑應在下一次中繼資料讀取時可見

從持久化已安裝 Plugin index 重建 manifest 中繼資料的呼叫端，會視需要重建該登錄表。已安裝 index 是持久來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄表模型

已載入的 Plugin 不會直接改動隨機核心全域。它們會註冊到中央 Plugin 登錄表。

登錄表會追蹤：

- Plugin records（身分、來源、原點、狀態、診斷）
- 工具
- 舊版掛鉤與型別化掛鉤
- 頻道
- providers
- Gateway RPC 處理器
- HTTP 路由
- CLI registrar
- 背景服務
- Plugin 擁有的命令

核心功能接著會從該登錄表讀取，而不是直接與 Plugin 模組溝通。這會讓載入維持單向：

- Plugin 模組 -> 登錄表註冊
- 核心執行階段 -> 登錄表消費

這種分離對可維護性很重要。它表示多數核心介面只需要一個整合點：「讀取登錄表」，而不是「為每個 Plugin 模組做特殊處理」。

## 對話綁定回呼

綁定對話的 Plugin 可以在核准完成時做出反應。

使用 `api.onConversationBindingResolved(...)` 在綁定請求獲准或拒絕後接收回呼：

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

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已核准請求的已解析綁定
- `request`：原始請求摘要、detach 提示、sender id 與對話中繼資料

此回呼僅供通知。它不會改變誰被允許綁定對話，且會在核心核准處理完成後執行。

## Provider 執行階段掛鉤

Provider Plugin 有三層：

- **Manifest 中繼資料**，用於低成本的執行階段前查找：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定期間掛鉤**：`catalog`（舊版 `discovery`）加上 `applyConfigDefaults`。
- **執行階段掛鉤**：40 多個選用掛鉤，涵蓋 auth、模型解析、串流包裝、思考層級、重放策略與用量端點。完整清單請參閱[掛鉤順序與用法](#hook-order-and-usage)。

OpenClaw 仍擁有通用 agent 迴圈、failover、transcript 處理與工具策略。這些掛鉤是 provider 特定行為的擴充介面，不需要整個自訂推論傳輸。

當 provider 具有環境變數式憑證，且通用 auth/status/model-picker 路徑應該在不載入 Plugin 執行階段的情況下看見它們時，請使用 manifest `setup.providers[].envVars`。已棄用的 `providerAuthEnvVars` 在棄用期間仍會由相容性 adapter 讀取，使用它的非 bundled Plugin 會收到 manifest 診斷。當某個 provider id 應重用另一個 provider id 的 env vars、auth profiles、設定支援的 auth，以及 API-key onboarding 選項時，請使用 manifest `providerAuthAliases`。當 onboarding/auth-choice CLI 介面應該在不載入 provider 執行階段的情況下知道 provider 的選項 id、群組標籤與簡單的單一旗標 auth wiring 時，請使用 manifest `providerAuthChoices`。Provider 執行階段 `envVars` 請保留給面向操作者的提示，例如 onboarding 標籤或 OAuth client-id/client-secret 設定變數。

當頻道具有環境變數驅動的 auth 或設定，且通用 shell-env 備援、設定/狀態檢查或設定提示應該在不載入頻道執行階段的情況下看見它們時，請使用 manifest `channelEnvVars`。

### 掛鉤順序與用法

對於模型/provider Plugin，OpenClaw 會依大致以下順序呼叫掛鉤。
「何時使用」欄是快速決策指南。
OpenClaw 已不再呼叫的僅相容性 provider 欄位，例如 `ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，刻意未列在此處。

| #   | 鉤子                              | 作用                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定具體化期間，套用由提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境，或提供者模型家族語意                                                                         |
| --  | _(內建模型查找)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是 Plugin 鉤子)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找前正規化舊版或預覽模型 ID 別名                                                     | 提供者在解析標準模型前，擁有別名清理邏輯                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前，正規化提供者家族的 `api` / `baseUrl`                                      | 提供者擁有同一傳輸家族中自訂提供者 ID 的傳輸清理邏輯                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前，正規化 `models.providers.<id>`                                           | 提供者需要應與 Plugin 同放的設定清理；內建的 Google 家族輔助工具也會作為支援 Google 設定項目的後備   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者有由提供者擁有的環境標記 API 金鑰解析；`amazon-bedrock` 也在此處有內建 AWS 環境標記解析器                  |
| 8   | `resolveSyntheticAuth`            | 顯示本機/自行託管或由設定支援的驗證，而不持久化明文                                   | 提供者可使用合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 疊加由提供者擁有的外部驗證設定檔；CLI/應用程式擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；在資訊清單中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔預留位置降到環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先權的合成預留位置設定檔                                                                 |
| 11  | `resolveDynamicModel`             | 針對本機登錄檔尚未包含、由提供者擁有的模型 ID 進行同步後備                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步預熱，然後再次執行 `resolveDynamicModel`                                                           | 提供者需要網路中繼資料才能解析未知 ID                                                                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `contributeResolvedModelCompat`   | 為另一個相容傳輸背後的供應商模型提供相容性旗標                                  | 提供者在代理傳輸上辨識自己的模型，而不接管該提供者                                                       |
| 15  | `normalizeToolSchemas`            | 在嵌入式執行器看到工具結構描述前將其正規化                                                    | 提供者需要傳輸家族結構描述清理                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後顯示由提供者擁有的結構描述診斷                                                  | 提供者想要關鍵字警告，而不把提供者專屬規則教給核心                                                                 |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出契約                                                              | 提供者需要標記式推理/最終輸出，而不是原生欄位                                                                         |
| 18  | `prepareExtraParams`              | 在通用串流選項包裝器前，進行請求參數正規化                                              | 提供者需要預設請求參數或逐提供者參數清理                                                                           |
| 19  | `createStreamFn`                  | 以自訂傳輸完全取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/主體/模型相容性包裝器，而不需要自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加原生逐回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸送出提供者原生的回合身分                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或後備政策                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：已儲存設定檔會變成執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，且需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 提供者不符合共用的 `pi-ai` 重新整理器                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者需要在重新整理失敗後提供由提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 由提供者擁有的內容視窗溢位比對器                                                                 | 提供者有通用啟發式方法會漏掉的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 由提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API/傳輸錯誤對應為速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | 代理/回程提供者的提示快取政策                                                               | 提供者需要代理專屬的快取 TTL 閘控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者專屬的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 在探索後附加的合成/最終目錄列                                                          | 提供者需要在 `models list` 和選擇器中加入合成的向前相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 特定模型的 `/think` 等級集合、顯示標籤與預設值                                                 | 提供者針對所選模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性鉤子                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 提供者只想在部分模型上啟用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性鉤子                                                                      | 提供者擁有模型家族的預設 `/think` 政策                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器與煙霧測試選擇的現代模型比對器                                              | 提供者擁有即時/煙霧測試偏好模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前，將已設定的憑證交換為實際的執行階段權杖/金鑰                       | 提供者需要權杖交換或短效請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的使用量/計費認證資訊                                     | 提供者需要自訂使用量/配額權杖解析，或不同的使用量認證資訊                                                               |
| 38  | `fetchUsageSnapshot`              | 在身分驗證解析後，擷取並正規化提供者特定的使用量/配額快照                             | 提供者需要提供者特定的使用量端點或酬載解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶體/搜尋建構由提供者擁有的嵌入配接器                                                     | 記憶體嵌入行為屬於提供者 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 傳回控制提供者逐字稿處理的重播政策                                        | 提供者需要自訂逐字稿政策（例如移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在一般逐字稿清理後重寫重播歷史                                                        | 提供者需要超出共用 Compaction 輔助工具之外的提供者特定重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器前進行最終重播回合驗證或重塑                                           | 提供者傳輸層在一般清理後需要更嚴格的回合驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為作用中時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的提供者 Plugin，接著依序落到其他具備 hook 能力的提供者 Plugin，直到其中一個實際變更模型 ID 或 transport/config。這能讓別名/相容性提供者 shim 持續運作，而不要求呼叫端知道哪個內建 Plugin 擁有該 rewrite。若沒有提供者 hook rewrite 支援的 Google 系列設定項目，內建 Google 設定 normalizer 仍會套用該相容性清理。

如果提供者需要完全自訂的 wire protocol 或自訂請求執行器，那屬於另一類 extension。這些 hook 用於仍在 OpenClaw 一般推論迴圈上執行的提供者行為。

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

內建提供者 Plugin 會組合上述 hook，以符合各廠商的目錄、驗證、thinking、重播和用量需求。權威的 hook 集合位於 `extensions/` 底下各自的 Plugin；本頁示範的是形態，而不是鏡像完整清單。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上 `resolveDynamicModel` / `prepareDynamicModel`，因此它們可以在 OpenClaw 靜態目錄之前公開上游模型 ID。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將 `prepareRuntimeAuth` 或 `formatApiKey` 搭配 `resolveUsageAuth` + `fetchUsageSnapshot`，以擁有權杖交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共用的具名系列（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）讓提供者可透過 `buildReplayPolicy` 選用轉錄稿政策，而不必讓每個 Plugin 重新實作清理。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta 標頭、`/fast` / `serviceTier` 和 `context1m` 位於 Anthropic Plugin 的公開 `api.ts` / `contract-api.ts` seam（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）內，而不是位於通用 SDK。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

Plugin 可以透過 `api.runtime` 存取選定的核心輔助工具。以 TTS 來說：

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

- `textToSpeech` 會回傳一般核心 TTS 輸出 payload，供檔案/語音筆記介面使用。
- 使用核心 `messages.tts` 設定和提供者選擇。
- 回傳 PCM 音訊 buffer + 取樣率。Plugin 必須為提供者重新取樣/編碼。
- `listVoices` 對每個提供者而言是選用的。可將其用於廠商擁有的語音選擇器或設定流程。
- 語音清單可以包含更豐富的中繼資料，例如 locale、gender 和 personality tag，供可感知提供者的選擇器使用。
- OpenAI 和 ElevenLabs 目前支援 telephony。Microsoft 不支援。

Plugin 也可以透過 `api.registerSpeechProvider(...)` 註冊語音提供者。

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
- 將語音提供者用於廠商擁有的合成行為。
- 舊版 Microsoft `edge` 輸入會 normalize 為 `microsoft` 提供者 ID。
- 偏好的擁有權模型以公司為導向：一個廠商 Plugin 可以隨著 OpenClaw 新增這些能力合約，而擁有文字、語音、圖片和未來的媒體提供者。

對於圖片/音訊/影片理解，Plugin 會註冊一個具型別的媒體理解提供者，而不是通用 key/value bag：

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

- 將 orchestration、fallback、設定和頻道 wiring 保留在核心中。
- 將廠商行為保留在提供者 Plugin 中。
- 加法式擴充應維持具型別：新的選用方法、新的選用結果欄位、新的選用能力。
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

對於音訊轉錄，Plugin 可以使用媒體理解執行階段，或較舊的 STT 別名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是圖片/音訊/影片理解的偏好共用介面。
- 使用核心媒體理解音訊設定（`tools.media.audio`）和提供者 fallback 順序。
- 當未產生任何轉錄輸出時（例如略過/不支援的輸入），會回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 會保留作為相容性別名。

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

注意事項：

- `provider` 和 `model` 是每次執行的選用 override，而不是持久 session 變更。
- OpenClaw 只會對受信任呼叫端採用這些 override 欄位。
- 對於 Plugin 擁有的 fallback 執行，操作者必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇啟用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任 Plugin 限制到特定 canonical `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的 Plugin 子代理執行仍可運作，但 override 請求會被拒絕，而不是靜默 fallback。
- Plugin 建立的子代理 session 會以建立它的 Plugin ID 標記。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除這些擁有的 session；任意 session 刪除仍需要 admin-scoped Gateway 請求。

對於網頁搜尋，Plugin 可以使用共用執行階段輔助工具，而不是深入 agent tool wiring：

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

Plugin 也可以透過 `api.registerWebSearchProvider(...)` 註冊網頁搜尋提供者。

注意事項：

- 將提供者選擇、憑證解析和共用請求語意保留在核心中。
- 將網頁搜尋提供者用於廠商特定的搜尋 transport。
- `api.runtime.webSearch.*` 是需要搜尋行為、但不依賴 agent tool wrapper 的功能/頻道 Plugin 的偏好共用介面。

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

- `generate(...)`：使用已設定的圖片生成提供者鏈生成圖片。
- `listProviders(...)`：列出可用的圖片生成提供者及其能力。

## Gateway HTTP 路由

Plugin 可以透過 `api.registerHttpRoute(...)` 公開 HTTP 端點。

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
- `auth`：必填。使用 `"gateway"` 要求一般 Gateway 驗證，或使用 `"plugin"` 進行 Plugin 管理的驗證/Webhook 驗證。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選用。允許同一個 Plugin 取代自己現有的路由註冊。
- `handler`：當路由已處理請求時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，且會造成 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 精確的 `path + match` 衝突會被拒絕，除非設定 `replaceExisting: true`，且一個 Plugin 不能取代另一個 Plugin 的路由。
- 具有不同 `auth` 層級的重疊路由會被拒絕。僅在相同 auth 層級上保留 `exact`/`prefix` 穿透鏈。
- `auth: "plugin"` 路由**不會**自動取得操作者執行階段範圍。它們用於 Plugin 管理的 Webhook/簽章驗證，而不是具特殊權限的 Gateway 輔助呼叫。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段範圍內執行，但該範圍刻意保持保守：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）會將 Plugin 路由的執行階段範圍固定為 `operator.write`，即使呼叫端傳送 `x-openclaw-scopes`
  - 可信的具身分 HTTP 模式（例如私人入口上的 `trusted-proxy` 或 `gateway.auth.mode = "none"`）只有在明確存在該標頭時，才會採用 `x-openclaw-scopes`
  - 如果這些具身分的 Plugin 路由請求缺少 `x-openclaw-scopes`，執行階段範圍會退回到 `operator.write`
- 實務規則：不要假設 Gateway 驗證的 Plugin 路由是隱含的管理介面。如果你的路由需要僅限管理員的行為，請要求具身分的驗證模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## Plugin SDK 匯入路徑

撰寫新的 Plugin 時，請使用精簡的 SDK 子路徑，而不是單體式 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊基礎元件                               |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點/建置輔助工具                           |
| `openclaw/plugin-sdk/core`          | 通用共享輔助工具與總括合約                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

頻道 Plugin 可從一組精簡銜接面中選擇：`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。核准行為應統一到單一
`approvalCapability` 合約，而不是混用彼此無關的
Plugin 欄位。請參閱[頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於相符且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請優先使用 `config-types`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是供較舊 Plugin 使用的已棄用相容性轉接層。
新程式碼應改為匯入更精簡的通用基礎元件。
</Info>

Repo 內部進入點（每個隨附 Plugin 套件根目錄）：

- `index.js` — 隨附 Plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — 設定 Plugin 進入點

外部 Plugin 只應匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要從核心或另一個 Plugin
匯入另一個 Plugin 套件的 `src/*`。由 facade 載入的進入點會在存在時優先使用作用中的執行階段設定快照，
然後才退回到磁碟上已解析的設定檔。

能力專用子路徑，例如 `image-generation`、`media-understanding`
和 `speech`，之所以存在，是因為隨附 Plugin 目前使用它們。它們不會
自動成為長期凍結的外部合約；依賴它們時，請查看相關 SDK
參考頁面。

## 訊息工具 schema

Plugin 應自行負責頻道專屬的 `describeMessageTool(...)` schema
貢獻，用於回應、已讀和投票等非訊息基礎元件。
共享傳送呈現應使用通用 `MessagePresentation` 合約，
而不是提供者原生的按鈕、元件、區塊或卡片欄位。
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)，了解合約、
後備規則、提供者對應和 Plugin 作者檢查清單。

可傳送的 Plugin 會透過訊息能力宣告它們能呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於釘選遞送請求

核心會決定要以原生方式呈現該呈現，或降級為文字。
不要從通用訊息工具暴露提供者原生 UI 逃生出口。
舊版原生 schema 的已棄用 SDK 輔助工具仍會匯出，以供既有
第三方 Plugin 使用，但新的 Plugin 不應使用它們。

## 頻道目標解析

頻道 Plugin 應自行負責頻道專屬的目標語意。讓共享
輸出主機保持通用，並使用訊息配接器介面處理提供者規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前，決定正規化目標
  應被視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心某個
  輸入是否應跳過目錄搜尋，直接進入類似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是當核心在正規化後或
  目錄未命中後需要最終由提供者負責的解析時，Plugin 的後備方式。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析後，負責提供者專屬的工作階段
  路由建構。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋對等項目/群組之前發生的分類決策。
- 使用 `looksLikeId` 處理「將此視為明確/原生目標 id」檢查。
- 使用 `resolveTarget` 處理提供者專屬的正規化後備，而不是廣泛的
  目錄搜尋。
- 將聊天 id、thread id、JID、handle 和 room id 等提供者原生 id
  放在 `target` 值或提供者專屬參數中，而不是通用 SDK
  欄位中。

## 設定支援的目錄

從設定衍生目錄項目的 Plugin 應將該邏輯保留在
Plugin 中，並重用來自
`openclaw/plugin-sdk/directory-runtime` 的共享輔助工具。

當頻道需要設定支援的對等項目/群組時使用此方式，例如：

- allowlist 驅動的 DM 對等項目
- 已設定的頻道/群組對應
- 帳戶範圍的靜態目錄後備

`directory-runtime` 中的共享輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重/正規化輔助工具
- 建立 `ChannelDirectoryEntry[]`

頻道專屬的帳戶檢查與 id 正規化應保留在
Plugin 實作中。

## 提供者 catalog

提供者 Plugin 可以使用
`registerProvider({ catalog: { run(...) { ... } } })` 定義用於推論的模型 catalog。

`catalog.run(...)` 會回傳與 OpenClaw 寫入
`models.providers` 相同的形狀：

- `{ provider }` 用於單一提供者項目
- `{ providers }` 用於多個提供者項目

當 Plugin 擁有提供者專屬模型 id、基底 URL
預設值或受驗證控管的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制 Plugin 的 catalog 相對於 OpenClaw
內建隱含提供者的合併時機：

- `simple`：單純 API 金鑰或 env 驅動的提供者
- `profile`：當驗證設定檔存在時出現的提供者
- `paired`：合成多個相關提供者項目的提供者
- `late`：最後一輪，在其他隱含提供者之後

較晚的提供者會在鍵衝突時勝出，因此 Plugin 可以刻意以相同提供者 id
覆寫內建提供者項目。

相容性：

- `discovery` 仍可作為舊版別名運作
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`

## 唯讀頻道檢查

如果你的 Plugin 註冊了頻道，請優先在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證
  已完整具體化，並可在缺少必要 secret 時快速失敗。
- 唯讀命令路徑，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor/config
  修復流程，不應只為了描述設定而需要具體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 僅回傳描述性的帳戶狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時包含憑證來源/狀態欄位，例如：
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 你不需要為了回報唯讀可用性而回傳原始 token 值。
  回傳 `tokenStatus: "available"`（以及相符的來源
  欄位）對狀態類命令已經足夠。
- 當憑證透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這可讓唯讀命令回報「已設定，但在此命令
路徑中不可用」，而不是當機或誤報帳戶未設定。

## 套件包

Plugin 目錄可以包含帶有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個 Plugin。如果該套件包列出多個 extension，Plugin id
會變成 `name/<fileBase>`。

如果你的 Plugin 匯入 npm 相依套件，請將它們安裝在該目錄中，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在解析 symlink 後，都必須留在 Plugin
目錄內。逃出套件目錄的項目會被
拒絕。

安全注意事項：`openclaw plugins install` 會使用
專案本機的 `npm install --omit=dev --ignore-scripts` 安裝 Plugin 相依套件（無 lifecycle scripts，
執行階段無 dev dependencies），並忽略繼承的全域 npm install 設定。
請讓 Plugin 相依樹保持「純 JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。
當 OpenClaw 需要已停用頻道 Plugin 的設定介面，或
當頻道 Plugin 已啟用但仍未設定時，它會載入 `setupEntry`
而不是完整的 Plugin 進入點。當你的主要 Plugin 進入點也會接線工具、hook 或其他僅限執行階段的
程式碼時，這可讓啟動和設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可讓頻道 Plugin 在 Gateway 的
listen 前啟動階段選擇採用相同的 `setupEntry` 路徑，即使該頻道已設定。

只有在 `setupEntry` 完整涵蓋 Gateway 開始 listen
之前必須存在的啟動介面時，才使用此選項。實務上，這表示設定進入點
必須註冊啟動所依賴的每個頻道擁有能力，例如：

- 頻道註冊本身
- Gateway 開始 listen 前必須可用的任何 HTTP 路由
- 在同一時間窗口中必須存在的任何 Gateway 方法、工具或服務

如果你的完整進入點仍擁有任何必要的啟動能力，請不要啟用
此旗標。讓 Plugin 保持預設行為，並讓 OpenClaw 在
啟動期間載入完整進入點。

隨附頻道也可以發布僅設定的合約介面輔助工具，供核心
在完整頻道執行階段載入前查詢。目前的設定
提升介面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core 在需要將舊版單帳戶通道設定提升為 `channels.<id>.accounts.*`，且不載入完整 Plugin 入口時，會使用這個介面。Matrix 是目前的內建範例：當命名帳戶已存在時，它只會將 auth/bootstrap key 移入具名提升帳戶，並且可以保留已設定的非標準預設帳戶 key，而不是一律建立 `accounts.default`。

這些 setup patch adapter 會讓內建合約介面的探索保持惰性。匯入時間維持輕量；promotion 介面只會在第一次使用時載入，而不是在模組匯入時重新進入內建通道啟動流程。

當這些啟動介面包含 Gateway RPC 方法時，請將它們放在 Plugin 專屬前綴下。core admin 命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，且一律解析為 `operator.admin`，即使某個 Plugin 要求更窄的 scope 也一樣。

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

### 通道 catalog metadata

通道 Plugin 可以透過 `openclaw.channel` 公告 setup/discovery metadata，並透過 `openclaw.install` 公告安裝提示。這會讓 core catalog 不需要內建資料。

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

除了最小範例之外，實用的 `openclaw.channel` 欄位：

- `detailLabel`：較豐富 catalog/status 介面的次要標籤
- `docsLabel`：覆寫文件連結文字
- `preferOver`：此 catalog entry 應優先於哪些較低優先順序的 Plugin/通道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選取介面的文案控制
- `markdownCapable`：將通道標記為支援 Markdown，用於外送格式決策
- `exposure.configured`：設為 `false` 時，從已設定通道清單介面隱藏此通道
- `exposure.setup`：設為 `false` 時，從互動式 setup/configure 選擇器隱藏此通道
- `exposure.docs`：將通道標記為文件導覽介面的 internal/private 項目
- `showConfigured` / `showInSetup`：為相容性仍接受的舊版 alias；建議使用 `exposure`
- `quickstartAllowFrom`：讓通道加入標準 quickstart `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳戶，也要求明確的帳戶綁定
- `preferSessionLookupForAnnounceTarget`：解析 announce target 時偏好使用 session lookup

OpenClaw 也可以合併**外部通道 catalog**（例如 MPM registry export）。將 JSON 檔放在下列任一路徑：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一個或多個 JSON 檔（以逗號、分號或 `PATH` 分隔）。每個檔案應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。parser 也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` key 的舊版 alias。

產生的通道 catalog entry 和 provider install catalog entry 會在原始 `openclaw.install` 區塊旁公開正規化的 install-source 事實。正規化事實會識別 npm spec 是確切版本或浮動 selector、是否存在預期的 integrity metadata，以及是否也有可用的本機來源路徑。當 catalog/package 身分已知時，如果解析出的 npm package 名稱偏離該身分，正規化事實會發出警告。當 `defaultChoice` 無效或指向不可用來源時，以及存在 npm integrity metadata 但沒有有效 npm source 時，也會發出警告。消費端應將 `installSource` 視為加成的選用欄位，這樣手工建立的 entry 和 catalog shim 就不必合成它。這讓 onboarding 與 diagnostics 可以說明 source-plane 狀態，而不需要匯入 Plugin runtime。

官方外部 npm entry 應偏好使用確切的 `npmSpec` 加上 `expectedIntegrity`。裸 package 名稱和 dist-tag 仍可為了相容性運作，但它們會顯示 source-plane 警告，讓 catalog 能逐步走向 pinned、integrity-checked 的安裝方式，而不破壞既有 Plugin。當 onboarding 從本機 catalog 路徑安裝時，它會記錄一筆 managed Plugin Plugin index entry，並在可行時使用 `source: "path"` 和 workspace-relative 的 `sourcePath`。絕對操作載入路徑仍留在 `plugins.load.paths`；安裝記錄會避免將本機工作站路徑複製到長期設定中。這讓本機開發安裝能被 source-plane diagnostics 看見，而不新增第二個原始檔案系統路徑揭露介面。持久化的 `plugins/installs.json` Plugin index 是安裝來源的事實來源，並且可以在不載入 Plugin runtime 模組的情況下重新整理。即使 Plugin manifest 遺失或無效，其 `installRecords` map 仍是持久的；其 `plugins` array 則是可重建的 manifest view。

## Context engine Plugin

Context engine Plugin 擁有 session context 的 ingest、assembly 與 Compaction orchestration。請從你的 Plugin 使用 `api.registerContextEngine(id, factory)` 註冊它們，然後用 `plugins.slots.contextEngine` 選取作用中的 engine。

當你的 Plugin 需要取代或擴充預設 context pipeline，而不只是新增 memory search 或 hook 時，請使用這個方式。

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

factory `ctx` 會公開選用的 `config`、`agentDir` 和 `workspaceDir` 值，以供建構時初始化。

如果你的 engine **不**擁有 Compaction 演算法，請保留 `compact()` 實作並明確委派它：

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

## 新增 capability

當某個 Plugin 需要的行為不適合目前 API 時，不要用 private reach-in 繞過 Plugin 系統。請新增缺少的 capability。

建議順序：

1. 定義 core contract
   決定 core 應擁有哪些 shared behavior：policy、fallback、config merge、lifecycle、面向通道的語意，以及 runtime helper shape。
2. 新增型別化的 Plugin registration/runtime 介面
   以最小但有用的型別化 capability surface 擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接 core + channel/feature 消費端
   Channel 和 feature Plugin 應透過 core 使用新的 capability，而不是直接匯入 vendor implementation。
4. 註冊 vendor implementation
   Vendor Plugin 接著針對該 capability 註冊自己的 backend。
5. 新增 contract coverage
   新增測試，讓 ownership 和 registration shape 隨時間保持明確。

這就是 OpenClaw 保持有主見、卻不硬編碼成單一 provider 世界觀的方式。請參閱 [Capability Cookbook](/zh-TW/plugins/architecture)，取得具體的檔案 checklist 和 worked example。

### Capability checklist

當你新增 capability 時，實作通常應一併觸及這些介面：

- `src/<capability>/types.ts` 中的 core contract type
- `src/<capability>/runtime.ts` 中的 core runner/runtime helper
- `src/plugins/types.ts` 中的 Plugin API registration surface
- `src/plugins/registry.ts` 中的 Plugin registry wiring
- 當 feature/channel Plugin 需要消費它時，`src/plugins/runtime/*` 中的 Plugin runtime exposure
- `src/test-utils/plugin-registration.ts` 中的 capture/test helper
- `src/plugins/contracts/registry.ts` 中的 ownership/contract assertion
- `docs/` 中的 operator/Plugin 文件

如果缺少其中一個介面，通常代表該 capability 尚未完整整合。

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

Contract test pattern：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這會讓規則保持簡單：

- core 擁有 capability contract + orchestration
- vendor Plugin 擁有 vendor implementation
- feature/channel Plugin 消費 runtime helper
- contract test 讓 ownership 保持明確

## 相關

- [Plugin architecture](/zh-TW/plugins/architecture) — 公開 capability model 與 shape
- [Plugin SDK subpaths](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK setup](/zh-TW/plugins/sdk-setup)
- [Building plugins](/zh-TW/plugins/building-plugins)
