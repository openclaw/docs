---
read_when:
    - 實作提供者執行階段鉤子、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或註冊表狀態
    - 新增 Plugin 能力或上下文引擎 Plugin
summary: Plugin 架構內部機制：載入管線、註冊表、執行階段掛鉤、HTTP 路由和參考表
title: Plugin 架構內部機制
x-i18n:
    generated_at: "2026-05-11T20:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開能力模型、Plugin 形態，以及所有權/執行合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是內部機制的參考：載入管線、登錄表、執行階段 hook、Gateway HTTP 路由、匯入路徑，以及 schema 表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下流程：

1. 探索候選 Plugin 根目錄
2. 讀取原生或相容 bundle 資訊清單與套件中繼資料
3. 拒絕不安全的候選項
4. 正規化 Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項是否啟用
6. 載入已啟用的原生模組：已建置的 bundled 模組使用原生載入器；
   第三方本機原始碼 TypeScript 使用緊急 Jiti fallback
7. 呼叫原生 `register(api)` hook，並將註冊收集到 Plugin 登錄表
8. 將登錄表公開給命令/執行階段介面

<Note>
`activate` 是 `register` 的舊版別名 — 載入器會解析目前存在的項目（`def.register ?? def.activate`），並在同一個時間點呼叫它。所有 bundled Plugin 都使用 `register`；新的 Plugin 請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當進入點逸出 Plugin 根目錄、路徑可被所有人寫入，或非 bundled Plugin 的路徑所有權看起來可疑時，候選項會被封鎖。

被封鎖的候選項仍會為診斷保留其 Plugin id 關聯。如果設定仍參照該 id，驗證會將該 Plugin 回報為存在但已封鎖，並指回路徑安全警告，而不是將該設定項目視為過時。

### 資訊清單優先行為

資訊清單是控制平面的事實來源。OpenClaw 會使用它來：

- 識別 Plugin
- 探索宣告的頻道/skills/設定 schema 或 bundle 能力
- 驗證 `plugins.entries.<id>.config`
- 補充 Control UI 標籤/placeholder
- 顯示安裝/catalog 中繼資料
- 在不載入 Plugin 執行階段的情況下保留低成本 activation 與設定描述器

對於原生 Plugin，執行階段模組是資料平面部分。它會註冊實際行為，例如 hook、工具、命令或 provider 流程。

選用的資訊清單 `activation` 與 `setup` 區塊會留在控制平面上。它們是 activation 規劃與設定探索的純中繼資料描述器；它們不會取代執行階段註冊、`register(...)` 或 `setupEntry`。
第一批即時 activation 消費者現在會使用資訊清單命令、頻道與 provider 提示，在更廣泛的登錄表實體化之前縮小 Plugin 載入範圍：

- CLI 載入會縮小到擁有所要求主要命令的 Plugin
- 頻道設定/Plugin 解析會縮小到擁有所要求頻道 id 的 Plugin
- 明確的 provider 設定/執行階段解析會縮小到擁有所要求 provider id 的 Plugin
- Gateway 啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入與啟動選擇退出；沒有啟動中繼資料的 Plugin 只會透過較窄的 activation 觸發器載入

要求廣泛 `all` 範圍的請求時間執行階段預載，仍會從設定、啟動規劃、已設定頻道、slot 與自動啟用規則推導出明確的有效 Plugin id 集合。如果該推導集合為空，OpenClaw 會載入空的執行階段登錄表，而不是擴大到每個可探索的 Plugin。

activation 規劃器同時公開供現有呼叫端使用的僅 ids API，以及供新診斷使用的 plan API。Plan 項目會回報 Plugin 被選取的原因，並將明確的 `activation.*` 規劃器提示，與資訊清單所有權 fallback（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與 hook）分開。這個原因區分就是相容性邊界：現有 Plugin 中繼資料會持續運作，而新程式碼可以偵測廣泛提示或 fallback 行為，而不改變執行階段載入語意。

設定探索現在會優先使用描述器擁有的 id，例如 `setup.providers` 與 `setup.cliBackends`，以便在 fallback 到仍需要設定時間執行階段 hook 的 Plugin 的 `setup-api` 之前縮小候選 Plugin。Provider 設定清單會使用資訊清單 `providerAuthChoices`、由描述器推導的設定選項，以及安裝 catalog 中繼資料，而不載入 provider 執行階段。明確的 `setup.requiresRuntime: false` 是僅描述器的截斷點；省略的 `requiresRuntime` 會為了相容性保留舊版 setup-api fallback。如果多個已探索的 Plugin 宣告相同的正規化設定 provider 或 CLI backend id，設定查詢會拒絕模稜兩可的擁有者，而不是依賴探索順序。當設定執行階段確實執行時，登錄表診斷會回報 `setup.providers` / `setup.cliBackends` 與 setup-api 註冊的 provider 或 CLI backend 之間的漂移，但不會封鎖舊版 Plugin。

### Plugin 快取邊界

OpenClaw 不會在時間窗後方快取 Plugin 探索結果或直接資訊清單登錄表資料。安裝、資訊清單編輯與載入路徑變更，必須在下一次明確中繼資料讀取或 snapshot 重建時變得可見。
資訊清單檔案 parser 可以保留有界的檔案簽章快取，其 key 由已開啟的資訊清單路徑、inode、大小與時間戳組成；該快取只會避免重新解析未變更的位元組，且不得快取探索、登錄表、擁有者或政策答案。

安全的中繼資料快速路徑是明確物件所有權，而不是隱藏快取。Gateway 啟動熱路徑應該將目前的 `PluginMetadataSnapshot`、推導出的 `PluginLookUpTable`，或明確的資訊清單登錄表沿呼叫鏈傳遞。設定驗證、啟動自動啟用、Plugin bootstrap 與 provider 選取，都可以在那些物件代表目前設定與 Plugin inventory 時重用它們。設定查詢仍會按需重建資訊清單中繼資料，除非特定設定路徑收到明確的資訊清單登錄表；請將此保留為冷路徑 fallback，而不是新增隱藏查詢快取。當輸入變更時，請重建並取代 snapshot，而不是修改它或保留歷史副本。
作用中 Plugin 登錄表的 view 與 bundled 頻道 bootstrap helper 應該從目前的登錄表/根目錄重新計算。短生命週期的 map 可以在單次呼叫內用於去重工作或防止重入；它們不得變成程序中繼資料快取。

對於 Plugin 載入，持久快取層是執行階段載入。當程式碼或已安裝 artifact 確實被載入時，它可以重用載入器狀態，例如：

- `PluginLoaderCacheState` 與相容的作用中執行階段登錄表
- 用於避免重複匯入相同執行階段介面的 jiti/模組快取與公開介面載入器快取
- 已安裝 Plugin artifact 的檔案系統快取
- 用於路徑正規化或重複項解析的短生命週期每次呼叫 map

這些快取是資料平面實作細節。它們不得回答控制平面問題，例如「哪個 Plugin 擁有此 provider？」除非呼叫端刻意要求執行階段載入。

不要為下列項目新增持久或時間窗快取：

- 探索結果
- 直接資訊清單登錄表
- 從已安裝 Plugin 索引重建的資訊清單登錄表
- provider 擁有者查詢、模型抑制、provider 政策，或公開 artifact 中繼資料
- 任何其他由資訊清單推導的答案，其中變更後的資訊清單、已安裝索引或載入路徑應該在下一次中繼資料讀取時可見

從持久化已安裝 Plugin 索引重建資訊清單中繼資料的呼叫端，會按需重建該登錄表。已安裝索引是持久的來源平面狀態；它不是隱藏的程序內中繼資料快取。

## 登錄表模型

已載入的 Plugin 不會直接修改任意核心全域變數。它們會註冊到中央 Plugin 登錄表。

登錄表會追蹤：

- Plugin 記錄（身分、來源、origin、狀態、診斷）
- 工具
- 舊版 hook 與具型別 hook
- 頻道
- provider
- Gateway RPC handler
- HTTP 路由
- CLI registrar
- 背景服務
- Plugin 擁有的命令

核心功能接著會從該登錄表讀取，而不是直接與 Plugin 模組溝通。這讓載入維持單向：

- Plugin 模組 -> 登錄表註冊
- 核心執行階段 -> 登錄表消費

這種分離對可維護性很重要。它表示大多數核心介面只需要一個整合點：「讀取登錄表」，而不是「對每個 Plugin 模組做特殊處理」。

## 對話繫結 callback

繫結對話的 Plugin 可以在 approval 被解析時作出反應。

使用 `api.onConversationBindingResolved(...)`，在 bind 要求被核准或拒絕後接收 callback：

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

Callback payload 欄位：

- `status`: `"approved"` 或 `"denied"`
- `decision`: `"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`: 已核准要求的已解析繫結
- `request`: 原始要求摘要、detach 提示、sender id 與對話中繼資料

此 callback 僅供通知使用。它不會變更誰被允許繫結對話，且會在核心 approval 處理完成後執行。

## Provider 執行階段 hook

Provider Plugin 有三層：

- **資訊清單中繼資料**，用於低成本的執行階段前查詢：
  `setup.providers[].envVars`、已棄用的相容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **設定時間 hook**：`catalog`（舊版 `discovery`）加上
  `applyConfigDefaults`。
- **執行階段 hook**：40 多個選用 hook，涵蓋 auth、模型解析、
  stream wrapping、thinking levels、replay policy 與 usage endpoints。請參閱
  [Hook 順序與用法](#hook-order-and-usage) 下方的完整清單。

OpenClaw 仍擁有通用 agent loop、failover、transcript 處理與工具政策。這些 hook 是 provider 特定行為的擴充介面，不需要整個自訂 inference transport。

當 provider 有以 env 為基礎的 credentials，且通用 auth/status/model-picker 路徑應該在不載入 Plugin 執行階段的情況下看到它們時，請使用資訊清單 `setup.providers[].envVars`。在棄用期間，相容性 adapter 仍會讀取已棄用的 `providerAuthEnvVars`，使用它的非 bundled Plugin 會收到資訊清單診斷。當某個 provider id 應該重用另一個 provider id 的 env vars、auth profiles、設定支援的 auth 與 API key onboarding 選項時，請使用資訊清單 `providerAuthAliases`。當 onboarding/auth-choice CLI 介面應該在不載入 provider 執行階段的情況下知道 provider 的 choice id、group labels 與簡單單旗標 auth wiring 時，請使用資訊清單 `providerAuthChoices`。Provider 執行階段 `envVars` 請保留給 operator-facing 提示，例如 onboarding labels 或 OAuth client-id/client-secret 設定變數。

當頻道有 env 驅動的 auth 或設定，且通用 shell-env fallback、config/status 檢查或設定 prompt 應該在不載入頻道執行階段的情況下看到它們時，請使用資訊清單 `channelEnvVars`。

### Hook 順序與用法

對於模型/provider Plugin，OpenClaw 會大致按照此順序呼叫 hook。
「使用時機」欄是快速決策指南。
OpenClaw 不再呼叫的僅相容性 provider 欄位，例如 `ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，刻意未列於此處。

| #   | Hook                              | 功能                                                                                                           | 使用時機                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 時，將提供者設定發布到 `models.providers`                                                 | 提供者擁有 catalog 或 base URL 預設值                                                                                                         |
| 2   | `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                                                 | 預設值取決於驗證模式、環境，或提供者模型家族語意                                                                                              |
| --  | _(內建模型查詢)_                  | OpenClaw 會先嘗試一般的註冊表/catalog 路徑                                                                    | _(不是 Plugin hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | 在查詢前正規化舊版或預覽版 model-id 別名                                                                       | 提供者在標準模型解析前擁有別名清理                                                                                                            |
| 4   | `normalizeTransport`              | 在通用模型組裝前正規化提供者家族的 `api` / `baseUrl`                                                          | 提供者擁有同一傳輸家族中自訂提供者 ID 的傳輸清理                                                                                              |
| 5   | `normalizeConfig`                 | 在 runtime/提供者解析前正規化 `models.providers.<id>`                                                          | 提供者需要應與 Plugin 一起存在的設定清理；內建 Google 家族輔助工具也會補強支援的 Google 設定項目                                             |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生 streaming-usage 相容性重寫                                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                                                |
| 7   | `resolveConfigApiKey`             | 在載入 runtime 驗證前，為設定提供者解析 env-marker 驗證                                                       | 提供者擁有由提供者管理的 env-marker API-key 解析；`amazon-bedrock` 也在這裡有內建 AWS env-marker 解析器                                      |
| 8   | `resolveSyntheticAuth`            | 顯示本機/自架或設定支援的驗證，而不持久化明文                                                                  | 提供者可使用合成/本機憑證標記運作                                                                                                             |
| 9   | `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；CLI/app 擁有的憑證預設 `persistence` 為 `runtime-only`                         | 提供者重用外部驗證憑證，而不持久化複製的 refresh token；在 manifest 中宣告 `contracts.externalAuthProviders`                                |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔 placeholder 排在 env/設定支援的驗證之後                                                   | 提供者儲存不應取得優先權的合成 placeholder 設定檔                                                                                             |
| 11  | `resolveDynamicModel`             | 對尚未在本機註冊表中的提供者擁有模型 ID 提供同步 fallback                                                      | 提供者接受任意上游模型 ID                                                                                                                     |
| 12  | `prepareDynamicModel`             | 非同步預熱，之後再次執行 `resolveDynamicModel`                                                                 | 提供者在解析未知 ID 前需要網路中繼資料                                                                                                        |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用已解析模型前的最終重寫                                                                     | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                                                          |
| 14  | `contributeResolvedModelCompat`   | 為另一個相容傳輸後方的廠商模型貢獻相容性旗標                                                                   | 提供者可辨識 proxy 傳輸上的自身模型，而不接管該提供者                                                                                         |
| 15  | `normalizeToolSchemas`            | 在嵌入式 runner 看到工具 schema 前正規化它們                                                                   | 提供者需要傳輸家族 schema 清理                                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後顯示提供者擁有的 schema 診斷                                                                         | 提供者想要關鍵字警告，而不把提供者特定規則教給核心                                                                                            |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或標記式 reasoning-output 契約                                                                         | 提供者需要標記式推理/最終輸出，而不是原生欄位                                                                                                 |
| 18  | `prepareExtraParams`              | 在通用串流選項 wrapper 前正規化請求參數                                                                        | 提供者需要預設請求參數或每個提供者的參數清理                                                                                                  |
| 19  | `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                                                 | 提供者需要自訂 wire protocol，而不只是 wrapper                                                                                                |
| 20  | `wrapStreamFn`                    | 套用通用 wrapper 後的串流 wrapper                                                                              | 提供者需要請求標頭/本文/模型相容性 wrapper，而不是自訂傳輸                                                                                    |
| 21  | `resolveTransportTurnState`       | 附加原生每回合傳輸標頭或中繼資料                                                                               | 提供者希望通用傳輸傳送提供者原生的回合識別                                                                                                    |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或 session cool-down 政策                                                               | 提供者希望通用 WS 傳輸調整 session 標頭或 fallback 政策                                                                                       |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：已儲存設定檔會成為 runtime `apiKey` 字串                                                   | 提供者儲存額外驗證中繼資料，並需要自訂 runtime token 形狀                                                                                     |
| 24  | `refreshOAuth`                    | 針對自訂 refresh 端點或 refresh-failure 政策的 OAuth refresh 覆寫                                             | 提供者不符合共用的 `pi-ai` refresher                                                                                                          |
| 25  | `buildAuthDoctorHint`             | OAuth refresh 失敗時附加的修復提示                                                                             | 提供者在 refresh 失敗後需要提供者擁有的驗證修復指引                                                                                           |
| 26  | `matchesContextOverflowError`     | 提供者擁有的 context-window overflow matcher                                                                   | 提供者有通用啟發式會漏掉的原始 overflow 錯誤                                                                                                  |
| 27  | `classifyFailoverReason`          | 提供者擁有的 failover 原因分類                                                                                 | 提供者可將原始 API/傳輸錯誤對應到 rate-limit/overload 等                                                                                      |
| 28  | `isCacheTtlEligible`              | proxy/backhaul 提供者的 prompt-cache 政策                                                                      | 提供者需要 proxy 特定的 cache TTL gate                                                                                                        |
| 29  | `buildMissingAuthMessage`         | 取代通用 missing-auth 復原訊息                                                                                 | 提供者需要提供者特定的 missing-auth 復原提示                                                                                                  |
| 30  | `augmentModelCatalog`             | 在探索後附加的合成/最終 catalog 列                                                                             | 提供者需要在 `models list` 和選擇器中的合成 forward-compat 列                                                                                 |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 等級組、顯示標籤與預設值                                                                   | 提供者為選定模型公開自訂 thinking 階梯或二元標籤                                                                                              |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性 hook                                                                                       | 提供者只公開二元 thinking 開/關                                                                                                               |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性 hook                                                                                    | 提供者只想在部分模型上啟用 `xhigh`                                                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性 hook                                                                                  | 提供者擁有某個模型家族的預設 `/think` 政策                                                                                                    |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器與 smoke 選擇的現代模型 matcher                                                            | 提供者擁有即時/smoke 偏好模型 matching                                                                                                        |
| 36  | `prepareRuntimeAuth`              | 在 inference 前，將已設定的憑證交換為實際 runtime token/key                                                    | 提供者需要 token exchange 或短效請求憑證                                                                                                      |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的用量/帳務憑證                                     | 提供者需要自訂用量/配額權杖解析，或不同的用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在 auth 解析完成後，擷取並正規化提供者特定的用量/配額快照                             | 提供者需要提供者特定的用量端點或酬載解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶/搜尋建構由提供者擁有的嵌入轉接器                                                     | 記憶嵌入行為屬於提供者 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 傳回控制提供者逐字稿處理的重播政策                                        | 提供者需要自訂逐字稿政策（例如，移除 thinking 區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷程                                                        | 提供者需要超出共用 Compaction 輔助工具範圍的提供者特定重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器執行前，進行最終重播回合驗證或重塑                                           | 提供者傳輸在通用清理後需要更嚴格的回合驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為作用中時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的 provider plugin，接著依序落到其他支援 hook 的 provider plugin，直到其中一個實際變更 model id 或 transport/config。這能讓 alias/compat provider shim 持續運作，而不需要呼叫端知道是哪個內建 plugin 擁有該 rewrite。如果沒有 provider hook rewrite 受支援的 Google-family config entry，內建的 Google config normalizer 仍會套用該相容性清理。

如果 provider 需要完全自訂的 wire protocol 或自訂 request executor，那屬於另一類 extension。這些 hook 適用於仍在 OpenClaw 一般 inference loop 上執行的 provider 行為。

### Provider 範例

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

內建 provider plugin 會結合上述 hook，以配合各 vendor 的 catalog、auth、thinking、replay 與 usage 需求。權威的 hook set 位於 `extensions/` 下各 plugin 中；本頁示範的是形狀，而不是鏡像複製清單。

<AccordionGroup>
  <Accordion title="直通式 catalog provider">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，讓它們能在 OpenClaw 的靜態 catalog 之前呈現上游
    model id。
  </Accordion>
  <Accordion title="OAuth 與 usage endpoint provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 搭配 `resolveUsageAuth` +
    `fetchUsageSnapshot`，以擁有 token exchange 和 `/usage` 整合。
  </Accordion>
  <Accordion title="Replay 與 transcript 清理 family">
    共用的具名 family（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓 provider 能透過
    `buildReplayPolicy` 選用 transcript policy，而不是每個 plugin 都重新實作清理。
  </Accordion>
  <Accordion title="僅 catalog 的 provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並使用共用 inference loop。
  </Accordion>
  <Accordion title="Anthropic 專用 stream helper">
    Beta header、`/fast` / `serviceTier` 與 `context1m` 位於
    Anthropic plugin 的公開 `api.ts` / `contract-api.ts` seam
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是在
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin 可以透過 `api.runtime` 存取選定的核心 helper。以 TTS 為例：

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

- `textToSpeech` 會回傳一般核心 TTS output payload，供 file/voice-note surface 使用。
- 使用核心 `messages.tts` configuration 和 provider selection。
- 回傳 PCM audio buffer + sample rate。Plugin 必須為 provider 重新取樣/編碼。
- `listVoices` 依 provider 而定是 optional。可用於 vendor 擁有的 voice picker 或 setup flow。
- Voice listing 可以包含更豐富的 metadata，例如 locale、gender 與 personality tag，以供 provider-aware picker 使用。
- OpenAI 和 ElevenLabs 目前支援 telephony。Microsoft 不支援。

Plugin 也可以透過 `api.registerSpeechProvider(...)` 註冊 speech provider。

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

- 將 TTS policy、fallback 和 reply delivery 保留在核心。
- 使用 speech provider 處理 vendor 擁有的 synthesis 行為。
- 舊版 Microsoft `edge` input 會 normalize 為 `microsoft` provider id。
- 偏好的 ownership model 是以公司為導向：一個 vendor plugin 可以在 OpenClaw 新增這些
  capability contract 時，擁有 text、speech、image 與未來的 media provider。

對於 image/audio/video understanding，plugin 會註冊一個 typed
media-understanding provider，而不是通用 key/value bag：

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

- 將 orchestration、fallback、config 與 channel wiring 保留在核心。
- 將 vendor 行為保留在 provider plugin。
- Additive expansion 應維持 typed：新的 optional method、新的 optional
  result field、新的 optional capability。
- Video generation 已遵循相同模式：
  - 核心擁有 capability contract 和 runtime helper
  - vendor plugin 註冊 `api.registerVideoGenerationProvider(...)`
  - feature/channel plugin 使用 `api.runtime.videoGeneration.*`

對於 media-understanding runtime helper，plugin 可以呼叫：

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

對於 audio transcription，plugin 可以使用 media-understanding runtime
或較舊的 STT alias：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是 image/audio/video understanding
  偏好的共用 surface。
- `extractStructuredWithModel(...)` 是面向 plugin 的 seam，用於 bounded
  provider-owned image-first extraction。至少包含一個 image input；
  text input 是補充 context。
  product plugin 擁有其 route 與 schema，而 OpenClaw 擁有
  provider/runtime boundary。
- 使用核心 media-understanding audio configuration（`tools.media.audio`）和 provider fallback order。
- 當沒有產生 transcription output 時（例如 skipped/unsupported input），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留為 compatibility alias。

Plugin 也可以透過 `api.runtime.subagent` 啟動 background subagent run：

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

- `provider` 和 `model` 是每次 run 的 optional override，不是 persistent session change。
- OpenClaw 只會對受信任的 caller 採用這些 override field。
- 對於 plugin-owned fallback run，operator 必須以 `plugins.entries.<id>.subagent.allowModelOverride: true` 選用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任 plugin 限制到特定 canonical `provider/model` target，或使用 `"*"` 明確允許任何 target。
- Untrusted plugin subagent run 仍可運作，但 override request 會被拒絕，而不是 silently falling back。
- Plugin 建立的 subagent session 會以建立它的 plugin id 標記。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除這些 owned session；任意 session deletion 仍需要 admin-scoped Gateway request。

對於 web search，plugin 可以使用共用 runtime helper，而不是進入 agent tool wiring：

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
`api.registerWebSearchProvider(...)` 註冊 web-search provider。

注意事項：

- 將 provider selection、credential resolution 與 shared request semantics 保留在核心。
- 使用 web-search provider 處理 vendor-specific search transport。
- `api.runtime.webSearch.*` 是需要 search 行為但不想依賴 agent tool wrapper 的 feature/channel plugin 偏好的共用 surface。

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

- `generate(...)`：使用 configured image-generation provider chain 產生 image。
- `listProviders(...)`：列出可用的 image-generation provider 及其 capability。

## Gateway HTTP route

Plugin 可以透過 `api.registerHttpRoute(...)` 暴露 HTTP endpoint。

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

Route field：

- `path`：Gateway HTTP server 下的 route path。
- `auth`：必填。使用 `"gateway"` 要求一般 Gateway auth，或使用 `"plugin"` 進行 plugin-managed auth/webhook verification。
- `match`：optional。`"exact"`（default）或 `"prefix"`。
- `replaceExisting`：optional。允許同一個 plugin 取代自己的既有 route registration。
- `handler`：當 route 已處理 request 時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，且會造成 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 除非設定 `replaceExisting: true`，否則會拒絕完全相同的 `path + match` 衝突，而且一個 Plugin 不能取代另一個 Plugin 的路由。
- 會拒絕具有不同 `auth` 層級的重疊路由。請只在相同的 auth 層級上保留 `exact`/`prefix` 後援鏈。
- `auth: "plugin"` 路由**不會**自動收到操作者執行階段範圍。這些路由是供 Plugin 管理的 Webhook/簽章驗證使用，不是供具特權的 Gateway 輔助呼叫使用。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段範圍內執行，但該範圍刻意保守：
  - 共用密鑰 bearer auth（`gateway.auth.mode = "token"` / `"password"`）會讓 Plugin 路由執行階段範圍固定在 `operator.write`，即使呼叫者送出 `x-openclaw-scopes` 也是如此
  - 受信任、帶有身分的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在標頭明確存在時，才會採用 `x-openclaw-scopes`
  - 如果這些帶有身分的 Plugin 路由請求缺少 `x-openclaw-scopes`，執行階段範圍會退回 `operator.write`
- 實務規則：不要假設 gateway-auth Plugin 路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求帶有身分的 auth 模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## Plugin SDK 匯入路徑

撰寫新 Plugin 時，請使用較窄的 SDK 子路徑，而不是單體的 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊基元                                   |
| `openclaw/plugin-sdk/channel-core`  | 通道進入點/建置輔助工具                           |
| `openclaw/plugin-sdk/core`          | 通用共用輔助工具與總括合約                        |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

通道 Plugin 可從一組較窄的接縫中選用 — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` 和 `channel-actions`。核准行為應整合到單一
`approvalCapability` 合約上，而不是混用無關的 Plugin 欄位。
請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於相符且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` 等）。請優先使用 `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
和 `openclaw/plugin-sdk/infra-runtime` 是提供給舊版 Plugin 的已棄用相容性 shim。
新程式碼應改為匯入較窄的通用基元。
</Info>

儲存庫內部進入點（以每個隨附 Plugin 套件根目錄為準）：

- `index.js` — 隨附 Plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — 設定 Plugin 進入點

外部 Plugin 應只匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要從核心或另一個 Plugin
匯入另一個 Plugin 套件的 `src/*`。透過 facade 載入的進入點會在存在作用中的執行階段設定快照時優先使用它，
然後才退回磁碟上的已解析設定檔。

能力專用子路徑（例如 `image-generation`, `media-understanding`,
和 `speech`）之所以存在，是因為隨附 Plugin 目前使用它們。它們不會自動成為長期凍結的外部合約 — 依賴它們時，請查看相關的 SDK
參考頁面。

## 訊息工具結構描述

Plugin 應擁有通道專用的 `describeMessageTool(...)` 結構描述貢獻，
用於反應、已讀和投票等非訊息基元。共用傳送呈現應使用通用的 `MessagePresentation` 合約，
而不是提供者原生的按鈕、元件、區塊或卡片欄位。
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)，了解合約、
後援規則、提供者對應和 Plugin 作者檢查清單。

具備傳送能力的 Plugin 會透過訊息能力宣告它們可以呈現的內容：

- `presentation` 用於語意呈現區塊（`text`, `context`, `divider`, `buttons`, `select`）
- `delivery-pin` 用於釘選傳送請求

核心會決定要以原生方式呈現，或降級為文字。
不要從通用訊息工具暴露提供者原生 UI 逃生通道。
舊版原生結構描述的已棄用 SDK 輔助工具仍會匯出，以供現有第三方 Plugin 使用，
但新的 Plugin 不應使用它們。

## 通道目標解析

通道 Plugin 應擁有通道專用的目標語意。請讓共用傳出主機保持通用，
並使用訊息傳遞配接器介面處理提供者規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查找前決定正規化目標
  應被視為 `direct`、`group` 還是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心某個輸入
  是否應略過目錄搜尋，直接進入類似 ID 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是核心在正規化後或目錄未命中後，
  需要最終由提供者擁有的解析時使用的 Plugin 後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析後，負責提供者專用的工作階段
  路由建構。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋對等端/群組前發生的分類決策。
- 使用 `looksLikeId` 進行「將此視為明確/原生目標 ID」檢查。
- 使用 `resolveTarget` 作為提供者專用正規化後援，而不是用於寬泛的目錄搜尋。
- 將提供者原生 ID（例如聊天 ID、執行緒 ID、JID、控制代碼和房間 ID）保留在 `target` 值或提供者專用參數中，
  不要放在通用 SDK 欄位中。

## 由設定支援的目錄

從設定衍生目錄項目的 Plugin，應將該邏輯保留在
Plugin 內，並重複使用
`openclaw/plugin-sdk/directory-runtime` 的共用輔助工具。

當通道需要由設定支援的對等端/群組時，請使用此方式，例如：

- 由允許清單驅動的 DM 對等端
- 已設定的通道/群組對應
- 以帳號為範圍的靜態目錄後援

`directory-runtime` 中的共用輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重/正規化輔助工具
- 建立 `ChannelDirectoryEntry[]`

通道專用帳號檢查和 ID 正規化應留在
Plugin 實作中。

## 提供者目錄

提供者 Plugin 可透過
`registerProvider({ catalog: { run(...) { ... } } })` 定義推論用的模型目錄。

`catalog.run(...)` 會回傳與 OpenClaw 寫入
`models.providers` 相同的形狀：

- `{ provider }` 用於單一提供者項目
- `{ providers }` 用於多個提供者項目

當 Plugin 擁有提供者專用模型 ID、基礎 URL
預設值，或受 auth 保護的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制 Plugin 目錄相對於 OpenClaw
內建隱含提供者的合併時機：

- `simple`：普通 API 金鑰或由環境驅動的提供者
- `profile`：當 auth 設定檔存在時出現的提供者
- `paired`：合成多個相關提供者項目的提供者
- `late`：最後一道處理，在其他隱含提供者之後

較晚的提供者會在鍵值衝突時勝出，因此 Plugin 可有意以相同提供者 ID 覆寫
內建提供者項目。

Plugin 也可以透過
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是清單/說明/選擇器介面的前進路徑，並支援
`text`, `image_generation`, `video_generation` 和 `music_generation` 列。
提供者 Plugin 仍擁有即時端點呼叫、權杖交換和供應商
回應對應；核心擁有共用列形狀、來源標籤和媒體工具
說明格式。媒體生成提供者註冊會自動從 `defaultModel`, `models` 和 `capabilities`
合成靜態目錄列。

相容性：

- `discovery` 仍可作為舊版別名運作，但會發出棄用警告
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
- `augmentModelCatalog` 已棄用；隨附提供者應透過 `registerModelCatalogProvider` 發布
  補充列

## 唯讀通道檢查

如果你的 Plugin 註冊通道，建議在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設認證資料
  已完整具體化，並且可在缺少必要秘密時快速失敗。
- 唯讀命令路徑，例如 `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`，以及 doctor/設定
  修復流程，不應只是為了描述設定就需要具體化執行階段認證資料。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 視需要包含認證資料來源/狀態欄位，例如：
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 你不需要為了回報唯讀可用性而回傳原始權杖值。
  回傳 `tokenStatus: "available"`（以及相符的來源欄位）就足以供狀態類命令使用。
- 當認證資料透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這讓唯讀命令可以回報「已設定，但在此命令路徑中不可用」，
而不是當機或誤報帳號未設定。

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

每個項目都會成為一個 Plugin。如果套件包列出多個 extensions，Plugin ID
會變成 `name/<fileBase>`。

如果你的 Plugin 匯入 npm 相依套件，請在該目錄中安裝它們，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在符號連結解析後，都必須保留在 Plugin
目錄內。逃出套件目錄的項目會被拒絕。

安全注意事項：`openclaw plugins install` 會使用專案本機的
`npm install --omit=dev --ignore-scripts` 安裝 Plugin 相依套件（無生命週期指令碼，
執行階段無開發相依套件），並忽略繼承的全域 npm 安裝設定。
請保持 Plugin 相依樹為「純 JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可指向輕量的僅限設定模組。
當 OpenClaw 需要已停用通道 Plugin 的設定介面，或
當通道 Plugin 已啟用但尚未設定時，它會載入 `setupEntry`
而不是完整的 Plugin 進入點。當你的主要 Plugin 進入點也連接工具、hook 或其他僅限執行階段的
程式碼時，這可讓啟動和設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可讓通道 Plugin 在 gateway 的
listen 前啟動階段選擇使用相同的 `setupEntry` 路徑，即使該通道已完成設定也是如此。

只有在 `setupEntry` 完全涵蓋 Gateway 開始監聽前必須存在的啟動介面時，才使用這個選項。實務上，這表示 setup entry 必須註冊啟動所依賴的每個通道所擁有的能力，例如：

- 通道註冊本身
- Gateway 開始監聽前必須可用的任何 HTTP 路由
- 同一時間窗口內必須存在的任何 Gateway 方法、工具或服務

如果你的完整 entry 仍擁有任何必要的啟動能力，請不要啟用此旗標。讓 Plugin 保持預設行為，並讓 OpenClaw 在啟動期間載入完整 entry。

內建通道也可以發布僅限 setup 的契約介面輔助工具，供核心在完整通道執行階段載入前查詢。目前的 setup 提升介面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

當核心需要在不載入完整 Plugin entry 的情況下，將舊版單一帳號通道設定提升為 `channels.<id>.accounts.*` 時，會使用該介面。Matrix 是目前的內建範例：當具名帳號已存在時，它只會將 auth/bootstrap 鍵移入具名提升帳號，而且可以保留已設定的非標準預設帳號鍵，而不是一律建立 `accounts.default`。

這些 setup patch adapter 讓內建契約介面探索保持延遲。匯入時間保持輕量；提升介面只會在首次使用時載入，而不是在模組匯入時重新進入內建通道啟動流程。

當這些啟動介面包含 Gateway RPC 方法時，請讓它們使用 Plugin 專用前綴。核心 admin 命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，且一律解析為 `operator.admin`，即使 Plugin 要求較窄的範圍也一樣。

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

通道 Plugin 可以透過 `openclaw.channel` 宣告 setup/discovery 中繼資料，並透過 `openclaw.install` 宣告安裝提示。這讓核心目錄不需要內建資料。

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

- `detailLabel`：用於更豐富目錄/狀態介面的次要標籤
- `docsLabel`：覆寫文件連結文字
- `preferOver`：此目錄項目應優先於其上的較低優先權 Plugin/通道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面的文字控制
- `markdownCapable`：將通道標示為支援 markdown，以供輸出格式決策使用
- `exposure.configured`：設定為 `false` 時，從已設定通道清單介面中隱藏該通道
- `exposure.setup`：設定為 `false` 時，從互動式 setup/configure 選擇器中隱藏該通道
- `exposure.docs`：將通道標示為文件導覽介面的內部/私有項目
- `showConfigured` / `showInSetup`：為相容性仍接受的舊版別名；建議使用 `exposure`
- `quickstartAllowFrom`：讓通道加入標準 quickstart `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號存在，也要求明確帳號繫結
- `preferSessionLookupForAnnounceTarget`：解析 announce target 時優先使用 session lookup

OpenClaw 也可以合併**外部通道目錄**（例如 MPM registry export）。將 JSON 檔案放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案都應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的通道目錄項目與 provider 安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開標準化的安裝來源事實。標準化事實會識別 npm spec 是精確版本還是浮動選擇器、預期完整性中繼資料是否存在，以及本機來源路徑是否也可用。當目錄/套件身分已知時，如果解析出的 npm 套件名稱偏離該身分，標準化事實會發出警告。當 `defaultChoice` 無效或指向不可用的來源，以及 npm 完整性中繼資料存在但沒有有效 npm 來源時，它們也會發出警告。消費者應將 `installSource` 視為加成的選用欄位，因此手工建立的項目與目錄 shim 不必合成它。
這讓 onboarding 與診斷能在不匯入 Plugin 執行階段的情況下，說明來源平面的狀態。

官方外部 npm 項目應優先使用精確的 `npmSpec` 加上 `expectedIntegrity`。裸套件名稱與 dist-tags 仍可為相容性運作，但它們會顯示來源平面警告，讓目錄可以朝固定版本、完整性檢查的安裝移動，而不破壞既有 Plugin。
當 onboarding 從本機目錄路徑安裝時，它會記錄一個受管理的 Plugin 索引項目，其中包含 `source: "path"`，並在可能時包含相對於工作區的 `sourcePath`。絕對的操作載入路徑仍保留在 `plugins.load.paths`；安裝記錄會避免將本機工作站路徑重複寫入長期設定。這讓本機開發安裝能被來源平面診斷看見，而不增加第二個原始檔案系統路徑揭露介面。持久化的 `plugins/installs.json` Plugin 索引是安裝來源的真實來源，且可在不載入 Plugin 執行階段模組的情況下重新整理。即使 Plugin manifest 遺失或無效，其 `installRecords` map 仍是持久的；其 `plugins` 陣列則是可重建的 manifest 檢視。

## Context engine Plugin

Context engine Plugin 擁有 ingest、assembly 與 Compaction 的 session context 編排。使用 `api.registerContextEngine(id, factory)` 從你的 Plugin 註冊它們，然後使用 `plugins.slots.contextEngine` 選擇作用中的 engine。

當你的 Plugin 需要取代或擴充預設 context pipeline，而不只是加入 memory search 或 hook 時，請使用此方式。

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

factory `ctx` 會公開選用的 `config`、`agentDir` 與 `workspaceDir` 值，以供建構期間初始化使用。

如果你的 engine **不**擁有 Compaction 演算法，請保留 `compact()` 實作，並明確委派它：

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

當 Plugin 需要目前 API 不適合的行為時，不要透過私有 reach-in 繞過 Plugin 系統。請加入缺少的能力。

建議順序：

1. 定義核心契約
   決定核心應擁有哪些共享行為：政策、fallback、設定合併、生命週期、面向通道的語意，以及執行階段輔助工具形狀。
2. 加入型別化的 Plugin 註冊/執行階段介面
   以最小實用的型別化能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接核心 + 通道/功能消費者
   通道與功能 Plugin 應透過核心消費新能力，而不是直接匯入 vendor 實作。
4. 註冊 vendor 實作
   然後由 vendor Plugin 針對該能力註冊其後端。
5. 加入契約覆蓋
   加入測試，讓所有權與註冊形狀能隨時間保持明確。

這就是 OpenClaw 保持有主見、但不硬編碼為單一 provider 世界觀的方式。請參閱 [Capability Cookbook](/zh-TW/plugins/adding-capabilities)，取得具體檔案檢查清單與完整範例。

### 能力檢查清單

新增能力時，實作通常應一起觸及這些介面：

- `src/<capability>/types.ts` 中的核心契約型別
- `src/<capability>/runtime.ts` 中的核心 runner/執行階段輔助工具
- `src/plugins/types.ts` 中的 Plugin API 註冊介面
- `src/plugins/registry.ts` 中的 Plugin registry 串接
- 當功能/通道 Plugin 需要消費它時，`src/plugins/runtime/*` 中的 Plugin 執行階段公開
- `src/test-utils/plugin-registration.ts` 中的 capture/test 輔助工具
- `src/plugins/contracts/registry.ts` 中的所有權/契約斷言
- `docs/` 中的 operator/Plugin 文件

如果缺少其中一個介面，通常表示該能力尚未完全整合。

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

契約測試模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這讓規則保持簡單：

- 核心擁有能力契約 + 編排
- vendor Plugin 擁有 vendor 實作
- 功能/通道 Plugin 消費執行階段輔助工具
- 契約測試讓所有權保持明確

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [Plugin SDK subpaths](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK setup](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
