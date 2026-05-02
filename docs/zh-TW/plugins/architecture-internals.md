---
read_when:
    - 實作提供者執行階段掛鉤、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或登錄狀態
    - 新增 Plugin 能力或上下文引擎 Plugin
summary: Plugin 架構內部機制：載入管線、註冊表、執行階段鉤子、HTTP 路由與參考表
title: Plugin 架構內部機制
x-i18n:
    generated_at: "2026-05-02T20:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開能力模型、Plugin 形狀，以及擁有權/執行合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是內部機制的參考：載入管線、registry、執行階段 hooks、Gateway HTTP routes、匯入路徑，以及 schema 表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下操作：

1. 探索候選 Plugin roots
2. 讀取原生或相容 bundle manifests 與 package metadata
3. 拒絕不安全的候選項目
4. 正規化 Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項目的啟用狀態
6. 載入已啟用的原生模組：建置後的 bundled modules 使用原生 loader；
   第三方本機原始碼 TypeScript 使用緊急 Jiti fallback
7. 呼叫原生 `register(api)` hooks，並將 registrations 收集到 Plugin registry
8. 將 registry 暴露給 commands/執行階段 surfaces

<Note>
`activate` 是 `register` 的舊版別名 — loader 會解析目前存在的項目（`def.register ?? def.activate`），並在相同時間點呼叫它。所有 bundled Plugin 都使用 `register`；新 Plugin 請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當 entry 逃逸 Plugin root、path 可由全世界寫入，或 path ownership 對非 bundled Plugin 來說看起來可疑時，候選項目會被封鎖。

### Manifest-first 行為

manifest 是控制平面的真實來源。OpenClaw 使用它來：

- 識別 Plugin
- 探索宣告的 channels/skills/config schema 或 bundle capabilities
- 驗證 `plugins.entries.<id>.config`
- 補強 Control UI labels/placeholders
- 顯示 install/catalog metadata
- 在不載入 Plugin 執行階段的情況下保留低成本 activation 和 setup descriptors

對於原生 Plugin，runtime module 是 data-plane 部分。它會註冊實際行為，例如 hooks、tools、commands，或 provider flows。

選用 manifest `activation` 與 `setup` blocks 會留在控制平面。
它們是 activation planning 與 setup discovery 的純 metadata descriptors；
它們不會取代執行階段 registration、`register(...)`，或 `setupEntry`。
第一批即時 activation consumers 現在使用 manifest command、channel，以及 provider hints，
在更廣泛的 registry materialization 之前縮小 Plugin 載入範圍：

- CLI 載入會縮小到擁有所要求 primary command 的 Plugin
- channel setup/Plugin resolution 會縮小到擁有所要求
  channel id 的 Plugin
- explicit provider setup/runtime resolution 會縮小到擁有所要求
  provider id 的 Plugin
- Gateway startup planning 使用 `activation.onStartup` 進行明確 startup
  imports 和 startup opt-outs；沒有 startup metadata 的 Plugin 只會
  透過較窄的 activation triggers 載入

要求寬泛 `all` scope 的 request-time runtime preloads，仍會從 config、startup planning、已設定的 channels、slots，以及 auto-enable rules 衍生出明確的 effective Plugin id set。若該衍生集合為空，OpenClaw 會載入空的 runtime registry，而不是擴大到每個可探索的 Plugin。

activation planner 同時暴露 ids-only API 給現有 callers，並暴露 plan API 給新的 diagnostics。Plan entries 會回報 Plugin 被選取的原因，將明確的 `activation.*` planner hints 與 manifest ownership fallback 分開，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`，以及 hooks。這個 reason split 是相容性邊界：現有 Plugin metadata 會持續運作，同時新程式碼可以偵測寬泛 hints 或 fallback 行為，而不變更 runtime loading semantics。

Setup discovery 現在偏好 descriptor-owned ids，例如 `setup.providers` 和
`setup.cliBackends`，以便在 fallback 到仍需要 setup-time runtime hooks 的 Plugin 的
`setup-api` 之前縮小候選 Plugin。Provider setup lists 使用 manifest
`providerAuthChoices`、descriptor-derived setup choices，以及 install-catalog metadata，
而不載入 provider runtime。明確的 `setup.requiresRuntime: false` 是 descriptor-only cutoff；省略的
`requiresRuntime` 會為相容性保留舊版 setup-api fallback。如果多個探索到的 Plugin 宣告相同的正規化 setup provider 或 CLI backend id，setup lookup 會拒絕該模糊 owner，而不是依賴 discovery order。當 setup runtime 確實執行時，registry diagnostics 會回報 `setup.providers` / `setup.cliBackends` 與 setup-api 註冊的 providers 或 CLI backends 之間的 drift，而不會封鎖舊版 Plugin。

### Plugin cache 邊界

OpenClaw 不會在 wall-clock windows 後面快取 Plugin discovery results 或直接的 manifest registry data。Installs、manifest edits，以及 load-path changes 必須在下一次明確 metadata read 或 snapshot rebuild 時可見。
manifest file parser 可以保留一個 bounded file-signature cache，keyed by 已開啟 manifest path、inode、size，以及 timestamps；該 cache 只會避免重新剖析未變更的 bytes，且不得快取 discovery、registry、owner，或 policy answers。

安全的 metadata fast path 是明確物件 ownership，而不是隱藏 cache。
Gateway startup hot paths 應沿著 call chain 傳遞目前的 `PluginMetadataSnapshot`、衍生的 `PluginLookUpTable`，或明確的 manifest registry。Config validation、startup auto-enable、Plugin bootstrap，以及 provider selection 可在這些物件代表目前 config 與 Plugin inventory 時重複使用它們。Setup lookup 仍會依需求重建 manifest metadata，除非特定 setup path 收到明確的 manifest registry；請將其保留為 cold-path fallback，而不是新增隱藏 lookup caches。當輸入變更時，請重建並取代 snapshot，而不是 mutate 它或保留 historical copies。
active Plugin registry 上的 views 和 bundled channel bootstrap helpers 應從目前 registry/root 重新計算。Short-lived maps 可在單次呼叫中用於 dedupe work 或 guard reentry；它們不得變成 process metadata caches。

對於 Plugin loading，persistent cache layer 是 runtime loading。當 code 或 installed artifacts 實際載入時，它可以重複使用 loader state，例如：

- `PluginLoaderCacheState` 和相容的 active runtime registries
- jiti/module caches，以及用於避免重複匯入相同 runtime surface 的 public-surface loader caches
- installed Plugin artifacts 的 filesystem caches
- path normalization 或 duplicate resolution 的 short-lived per-call maps

這些 caches 是 data-plane implementation details。它們不得回答 control-plane questions，例如「哪個 Plugin 擁有這個 provider？」除非 caller 明確要求 runtime loading。

不要為以下項目新增 persistent 或 wall-clock caches：

- discovery results
- direct manifest registries
- 從 installed Plugin index 重建的 manifest registries
- provider owner lookup、model suppression、provider policy，或 public-artifact
  metadata
- 任何其他 manifest-derived answer，其中已變更的 manifest、installed index，
  或 load path 應在下一次 metadata read 時可見

從 persisted installed Plugin index 重建 manifest metadata 的 callers，會依需求重建該 registry。installed index 是 durable source-plane state；它不是隱藏的 in-process metadata cache。

## Registry 模型

已載入的 Plugin 不會直接 mutate 隨機 core globals。它們會註冊到中央 Plugin registry。

registry 會追蹤：

- Plugin records（identity、source、origin、status、diagnostics）
- tools
- legacy hooks 和 typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- Plugin-owned commands

Core features 接著會從該 registry 讀取，而不是直接與 Plugin modules 對話。這讓載入維持單向：

- Plugin module -> registry registration
- core runtime -> registry consumption

這種分離對可維護性很重要。這表示大多數 core surfaces 只需要一個 integration point：「讀取 registry」，而不是「為每個 Plugin module 做 special-case」。

## 對話綁定 callbacks

綁定對話的 Plugin 可以在 approval resolved 時回應。

使用 `api.onConversationBindingResolved(...)` 在 bind request 被 approved 或 denied 後接收 callback：

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

Callback payload fields：

- `status`: `"approved"` 或 `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`，或 `"deny"`
- `binding`: approved requests 的 resolved binding
- `request`: 原始 request summary、detach hint、sender id，以及
  conversation metadata

這個 callback 僅用於通知。它不會變更誰被允許 bind conversation，且會在 core approval handling 完成後執行。

## Provider runtime hooks

Provider Plugin 有三層：

- **Manifest metadata**，用於低成本 pre-runtime lookup：
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`，以及 `channelEnvVars`。
- **Config-time hooks**：`catalog`（legacy `discovery`）加上
  `applyConfigDefaults`。
- **Runtime hooks**：40+ 個 optional hooks，涵蓋 auth、model resolution、
  stream wrapping、thinking levels、replay policy，以及 usage endpoints。請參閱
  [Hook 順序與用法](#hook-order-and-usage) 下方的完整列表。

OpenClaw 仍擁有 generic agent loop、failover、transcript handling，以及
tool policy。這些 hooks 是 provider-specific behavior 的 extension surface，
無需整個 custom inference transport。

當 provider 具有 env-based credentials，且 generic auth/status/model-picker paths 應在不載入 Plugin runtime 的情況下看見它們時，請使用 manifest `setup.providers[].envVars`。Deprecated `providerAuthEnvVars` 在 deprecation window 期間仍會由 compatibility adapter 讀取，而使用它的 non-bundled Plugin 會收到 manifest diagnostic。當一個 provider id 應重用另一個 provider id 的 env vars、auth profiles、config-backed auth，以及 API-key onboarding choice 時，請使用 manifest `providerAuthAliases`。當 onboarding/auth-choice CLI surfaces 應在不載入 provider runtime 的情況下知道 provider 的 choice id、group labels，以及 simple one-flag auth wiring 時，請使用 manifest `providerAuthChoices`。Provider runtime
`envVars` 請保留給 operator-facing hints，例如 onboarding labels 或 OAuth
client-id/client-secret setup vars。

當 channel 有 env-driven auth 或 setup，且 generic shell-env fallback、config/status checks，或 setup prompts 應在不載入 channel runtime 的情況下看見它們時，請使用 manifest `channelEnvVars`。

### Hook 順序與用法

對於 model/provider Plugin，OpenClaw 會大致依以下順序呼叫 hooks。
「何時使用」欄是快速決策指南。
Compatibility-only provider fields，例如 OpenClaw 不再呼叫的
`ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，刻意未列於此處。

| #   | 掛鉤                              | 作用                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型系列語意                                                                         |
| --  | _(內建模型查找)_         | OpenClaw 會先嘗試一般的註冊表/目錄路徑                                                          | _(不是 Plugin 掛鉤)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找前正規化舊版或預覽模型 ID 別名                                                     | 提供者在標準模型解析前負責清理別名                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前正規化提供者系列的 `api` / `baseUrl`                                      | 提供者負責清理同一傳輸系列中自訂提供者 ID 的傳輸設定                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要與 Plugin 一起維護的設定清理；內建 Google 系列輔助程式也會補強支援的 Google 設定項目   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者有提供者擁有的環境標記 API 金鑰解析；`amazon-bedrock` 在此也有內建 AWS 環境標記解析器                  |
| 8   | `resolveSyntheticAuth`            | 顯示本機/自託管或設定支援的驗證，而不保存明文                                   | 提供者可使用合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；CLI/app 擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不保存複製的重新整理權杖；在 manifest 中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將儲存的合成設定檔預留位置排在環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先權的合成預留位置設定檔                                                                 |
| 11  | `resolveDynamicModel`             | 對尚未在本機註冊表中的提供者擁有模型 ID 進行同步備援                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| 13  | `normalizeResolvedModel`          | 嵌入式執行器使用已解析模型前的最終重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `contributeResolvedModelCompat`   | 為另一個相容傳輸背後的供應商模型貢獻相容性旗標                                  | 提供者在代理傳輸上辨識自己的模型，而不接管提供者                                                       |
| 15  | `normalizeToolSchemas`            | 在嵌入式執行器看到工具 schema 前正規化它們                                                    | 提供者需要傳輸系列 schema 清理                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後顯示提供者擁有的 schema 診斷                                                  | 提供者想要關鍵字警告，而不讓核心學習提供者特定規則                                                                 |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或帶標記的推理輸出契約                                                              | 提供者需要帶標記的推理/最終輸出，而不是原生欄位                                                                         |
| 18  | `prepareExtraParams`              | 在通用串流選項包裝器前進行請求參數正規化                                              | 提供者需要預設請求參數或每個提供者的參數清理                                                                           |
| 19  | `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/主體/模型相容性包裝器，而不是自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加原生每回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸傳送提供者原生回合身分                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或備援政策                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：儲存的設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，且需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策的 OAuth 重新整理覆寫                                  | 提供者不符合共用的 `pi-ai` 重新整理器                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者需要重新整理失敗後由提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 提供者擁有的情境視窗溢位比對器                                                                 | 提供者有通用啟發式規則會遺漏的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | 代理/回程提供者的提示快取政策                                                               | 提供者需要代理特定的快取 TTL 閘控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後附加的合成/最終目錄列                                                          | 提供者需要在 `models list` 和選擇器中加入合成前向相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 層級集合、顯示標籤和預設值                                                 | 提供者為選定模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性掛鉤                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性掛鉤                                                                   | 提供者只想讓部分模型使用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 層級相容性掛鉤                                                                      | 提供者擁有某個模型系列的預設 `/think` 政策                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器和 smoke 選擇的現代模型比對器                                              | 提供者擁有即時/smoke 偏好模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前將已設定的憑證交換成實際執行階段權杖/金鑰                       | 提供者需要權杖交換或短期請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 和相關狀態介面的使用量/帳務憑證                                     | 提供者需要自訂使用量/配額權杖解析，或不同的使用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在驗證解析後，擷取並正規化提供者特定的使用量/配額快照                             | 提供者需要提供者特定的使用量端點或酬載解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶/搜尋建置由提供者擁有的嵌入介面卡                                                     | 記憶嵌入行為屬於提供者 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 傳回控制提供者對話記錄處理方式的重放政策                                        | 提供者需要自訂對話記錄政策（例如移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用對話記錄清理後重寫重放歷程                                                        | 提供者需要超出共用 Compaction 輔助工具的提供者特定重放重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器之前，執行最終的重放輪次驗證或重塑                                           | 提供者傳輸層在通用清理後需要更嚴格的輪次驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由提供者擁有的選取後副作用                                                                 | 當模型變為啟用時，提供者需要遙測或由提供者擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查
相符的提供者 Plugin，接著再依序落到其他具備 hook 能力的提供者 Plugin，
直到其中一個實際變更模型 ID 或傳輸/設定。這能讓
別名/相容性提供者 shim 持續運作，而不需要呼叫端知道是哪個
內建 Plugin 負責該重寫。如果沒有提供者 hook 重寫受支援的
Google 系列設定項目，內建的 Google 設定正規化器仍會套用
該相容性清理。

如果提供者需要完全自訂的 wire protocol 或自訂 request executor，
那是另一類 extension。這些 hook 適用於仍在 OpenClaw 一般推論迴圈上
執行的提供者行為。

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

內建提供者 Plugin 會組合上述 hook，以符合各供應商的型錄、
驗證、thinking、重播和使用量需求。權威的 hook 集合位於
`extensions/` 下的各個 Plugin；本頁示範的是形態，而不是
鏡像該清單。

<AccordionGroup>
  <Accordion title="直通型錄提供者">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，讓它們可以在
    OpenClaw 的靜態型錄之前揭露上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 和使用量端點提供者">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配對，以擁有 token 交換和 `/usage` 整合。
  </Accordion>
  <Accordion title="重播和 transcript 清理系列">
    共用的命名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓提供者透過
    `buildReplayPolicy` 選用 transcript 政策，而不是讓每個 Plugin
    重新實作清理。
  </Accordion>
  <Accordion title="僅型錄提供者">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共用推論迴圈。
  </Accordion>
  <Accordion title="Anthropic 專用 stream helper">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位於
    Anthropic Plugin 的公開 `api.ts` / `contract-api.ts` seam
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）中，而不是位於
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin 可以透過 `api.runtime` 存取選定的核心 helper。對於 TTS：

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

備註：

- `textToSpeech` 會回傳一般核心 TTS 輸出 payload，用於檔案/語音備註介面。
- 使用核心 `messages.tts` 設定和提供者選擇。
- 回傳 PCM 音訊 buffer + sample rate。Plugin 必須為提供者進行重新取樣/編碼。
- `listVoices` 對每個提供者而言是選用的。將它用於供應商擁有的語音選擇器或設定流程。
- 語音清單可以包含更豐富的中繼資料，例如地區設定、性別和 personality tags，以支援提供者感知的選擇器。
- OpenAI 和 ElevenLabs 目前支援電話語音。Microsoft 不支援。

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

備註：

- 將 TTS 政策、fallback 和回覆傳遞保留在核心中。
- 使用 speech provider 來處理供應商擁有的合成行為。
- 舊版 Microsoft `edge` 輸入會正規化為 `microsoft` 提供者 ID。
- 偏好的擁有權模型以公司為導向：隨著 OpenClaw 加入這些
  capability contract，一個供應商 Plugin 可以擁有文字、語音、影像和未來的媒體提供者。

對於影像/音訊/影片理解，Plugin 會註冊一個具型別的
media-understanding provider，而不是通用的 key/value bag：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

備註：

- 將 orchestration、fallback、設定和 channel wiring 保留在核心中。
- 將供應商行為保留在提供者 Plugin 中。
- 加法擴充應維持具型別：新的選用方法、新的選用
  結果欄位、新的選用 capability。
- 影片生成已遵循相同模式：
  - 核心擁有 capability contract 和 runtime helper
  - 供應商 Plugin 註冊 `api.registerVideoGenerationProvider(...)`
  - 功能/channel Plugin 使用 `api.runtime.videoGeneration.*`

對於 media-understanding runtime helper，Plugin 可以呼叫：

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

對於音訊轉錄，Plugin 可以使用 media-understanding runtime
或較舊的 STT alias：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

備註：

- `api.runtime.mediaUnderstanding.*` 是影像/音訊/影片理解的偏好共用介面。
- 使用核心 media-understanding 音訊設定（`tools.media.audio`）和提供者 fallback 順序。
- 未產生轉錄輸出時會回傳 `{ text: undefined }`（例如略過/不支援的輸入）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作為相容性 alias 保留。

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

備註：

- `provider` 和 `model` 是每次執行的選用 override，不是持久性 session 變更。
- OpenClaw 只會對受信任的呼叫端採用這些 override 欄位。
- 對於 Plugin 擁有的 fallback 執行，operator 必須透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 選用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將受信任 Plugin 限制為特定 canonical `provider/model` 目標，或使用 `"*"` 明確允許任何目標。
- 不受信任的 Plugin 子代理執行仍可運作，但 override request 會被拒絕，而不是靜默 fallback。
- Plugin 建立的子代理 session 會標記建立它的 Plugin ID。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除那些所擁有的 session；任意 session 刪除仍需要 admin-scoped Gateway request。

對於網頁搜尋，Plugin 可以使用共用 runtime helper，而不是
深入 agent tool wiring：

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

備註：

- 將提供者選擇、credential resolution 和共用 request semantics 保留在核心中。
- 使用 web-search provider 處理供應商特定的搜尋傳輸。
- `api.runtime.webSearch.*` 是需要搜尋行為、但不想依賴 agent tool wrapper 的功能/channel Plugin 的偏好共用介面。

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

- `generate(...)`：使用已設定的影像生成提供者鏈產生影像。
- `listProviders(...)`：列出可用的影像生成提供者及其 capability。

## Gateway HTTP 路由

Plugin 可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端點。

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

- `path`：Gateway HTTP server 下的路由路徑。
- `auth`：必填。使用 `"gateway"` 要求一般 Gateway auth，或使用 `"plugin"` 進行 Plugin 管理的驗證/webhook 驗證。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選用。允許同一個 Plugin 取代它自己既有的路由註冊。
- `handler`：當路由已處理 request 時回傳 `true`。

備註：

- `api.registerHttpHandler(...)` 已移除，並會造成 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 精確的 `path + match` 衝突會被拒絕，除非設定 `replaceExisting: true`，而且一個 Plugin 不能取代另一個 Plugin 的路由。
- 不同 `auth` 層級的重疊路由會被拒絕。請只在相同 auth 層級上保留 `exact`/`prefix` fallback 鏈。
- `auth: "plugin"` 路由**不會**自動取得 operator 執行階段 scopes。它們是用於 Plugin 管理的 Webhook/簽章驗證，而不是具特殊權限的 Gateway helper 呼叫。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段 scope 內執行，但該 scope 刻意保持保守：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）會將 Plugin 路由執行階段 scopes 固定為 `operator.write`，即使呼叫端傳送 `x-openclaw-scopes`
  - 受信任且帶有身分的 HTTP 模式（例如私有 ingress 上的 `trusted-proxy` 或 `gateway.auth.mode = "none"`）只有在明確存在 `x-openclaw-scopes` 標頭時才會採用它
  - 如果這些帶有身分的 Plugin 路由請求缺少 `x-openclaw-scopes`，執行階段 scope 會退回到 `operator.write`
- 實務規則：不要假設 gateway-auth Plugin 路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求帶有身分的 auth 模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## Plugin SDK 匯入路徑

撰寫新 Plugin 時，請使用範圍較窄的 SDK 子路徑，而不是單體的 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊 primitives                            |
| `openclaw/plugin-sdk/channel-core`  | Channel entry/build helpers                        |
| `openclaw/plugin-sdk/core`          | 通用共享 helpers 與 umbrella contract              |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

Channel Plugin 可從一系列範圍較窄的 seam 中選擇 — `channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 以及 `channel-actions`。核准行為應整併到單一
`approvalCapability` 合約，而不是混用不相關的 Plugin 欄位。請參閱 [Channel Plugin](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定 helpers 位於相符且聚焦的 `*-runtime` 子路徑下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。請偏好使用 `config-types`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是供舊版 Plugin 使用的已棄用相容 shim。
新程式碼應改為匯入更窄的通用 primitives。
</Info>

Repo 內部進入點（依每個 bundled Plugin 套件根目錄）：

- `index.js` — bundled Plugin 進入點
- `api.js` — helper/types barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — setup Plugin 進入點

外部 Plugin 應只匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要從 core 或另一個 Plugin
匯入其他 Plugin 套件的 `src/*`。
Facade 載入的進入點在存在 active runtime config snapshot 時會優先使用它，
然後才退回到磁碟上解析後的設定檔。

像 `image-generation`、`media-understanding` 和 `speech` 這類能力專屬子路徑之所以存在，
是因為 bundled Plugin 目前使用它們。它們不會自動成為長期凍結的外部合約 — 依賴它們時，
請查看相關的 SDK 參考頁面。

## 訊息工具 schema

Plugin 應擁有 channel 專屬的 `describeMessageTool(...)` schema
貢獻，用於 reactions、reads 和 polls 等非訊息 primitives。
共享的傳送呈現應使用通用 `MessagePresentation` 合約，而不是 provider 原生的 button、
component、block 或 card 欄位。
請參閱 [訊息呈現](/zh-TW/plugins/message-presentation)，了解合約、fallback 規則、provider 對應和 Plugin 作者檢查清單。

具備傳送能力的 Plugin 會透過訊息能力宣告它們能呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於 pinned-delivery 請求

Core 會決定要以原生方式呈現 presentation，或將其降級為文字。
不要從通用訊息工具暴露 provider 原生 UI escape hatch。
舊版原生 schema 的已棄用 SDK helpers 仍會為既有第三方 Plugin 匯出，
但新的 Plugin 不應使用它們。

## Channel 目標解析

Channel Plugin 應擁有 channel 專屬的目標語意。請保持共享 outbound host 的通用性，
並使用 messaging adapter 介面處理 provider 規則：

- `messaging.inferTargetChatType({ to })` 會在 directory 查找前，決定正規化後的目標應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴 core，某個輸入是否應略過 directory search，直接進入類似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是 core 在正規化後或 directory miss 後需要最終 provider 擁有解析時的 Plugin fallback。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責 provider 專屬的 session route 建構。

建議切分方式：

- 使用 `inferTargetChatType` 處理搜尋 peers/groups 前應發生的分類決策。
- 使用 `looksLikeId` 檢查「將此視為明確/原生目標 id」。
- 使用 `resolveTarget` 處理 provider 專屬的正規化 fallback，而不是廣泛的 directory search。
- 將 chat ids、thread ids、JIDs、handles 和 room ids 等 provider 原生 ids 保留在 `target` 值或 provider 專屬 params 內，而不是放在通用 SDK 欄位中。

## 設定支援的 directories

從設定衍生 directory entries 的 Plugin 應將該邏輯保留在 Plugin 中，並重用
`openclaw/plugin-sdk/directory-runtime` 的共享 helpers。

當 channel 需要設定支援的 peers/groups 時使用此方式，例如：

- allowlist 驅動的 DM peers
- 已設定的 channel/group maps
- 帳號範圍的靜態 directory fallback

`directory-runtime` 中的共享 helpers 只處理通用操作：

- 查詢篩選
- limit 套用
- deduping/normalization helpers
- 建構 `ChannelDirectoryEntry[]`

Channel 專屬的帳號檢查與 id 正規化應留在 Plugin 實作中。

## Provider catalogs

Provider Plugin 可以使用 `registerProvider({ catalog: { run(...) { ... } } })`
定義用於推論的 model catalogs。

`catalog.run(...)` 會回傳 OpenClaw 寫入 `models.providers` 的相同形狀：

- `{ provider }` 用於單一 provider entry
- `{ providers }` 用於多個 provider entries

當 Plugin 擁有 provider 專屬 model ids、base URL 預設值，或受 auth 限制的 model metadata 時，請使用 `catalog`。

`catalog.order` 會控制 Plugin 的 catalog 相對於 OpenClaw 內建 implicit providers 的合併時機：

- `simple`：純 API-key 或 env 驅動的 providers
- `profile`：auth profiles 存在時出現的 providers
- `paired`：合成多個相關 provider entries 的 providers
- `late`：最後一輪，在其他 implicit providers 之後

後面的 providers 在 key collision 時會勝出，因此 Plugin 可以刻意以相同的 provider id 覆寫內建 provider entry。

相容性：

- `discovery` 仍可作為舊版 alias 使用
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`

## 唯讀 channel 檢查

如果你的 Plugin 註冊 channel，請偏好在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設 credentials 已完整具體化，並且在必要 secrets 缺少時快速失敗。
- 像 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor/config 修復流程等唯讀命令路徑，不應只為了描述設定就需要具體化執行階段 credentials。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 相關時包含 credential 來源/狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要只為了回報唯讀可用性而回傳原始 token 值。回傳 `tokenStatus: "available"`（以及相符的來源欄位）對 status 類命令就足夠。
- 當 credential 透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這讓唯讀命令能回報「已設定但在此命令路徑中不可用」，而不是當機或誤報帳號未設定。

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

如果你的 Plugin 匯入 npm deps，請在該目錄安裝它們，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全 guardrail：每個 `openclaw.extensions` entry 在 symlink resolution 後都必須留在 Plugin
目錄內。逸出套件目錄的 entries 會被拒絕。

安全注意事項：`openclaw plugins install` 會使用 project-local
`npm install --omit=dev --ignore-scripts` 安裝 Plugin 相依項（沒有 lifecycle scripts，
執行階段沒有 dev dependencies），並忽略繼承的全域 npm install 設定。
請保持 Plugin dependency trees 為「純 JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的 setup-only 模組。
當 OpenClaw 需要停用的 channel Plugin 的 setup surfaces，或
channel Plugin 已啟用但仍未設定時，它會載入 `setupEntry`
而不是完整 Plugin entry。當你的主要 Plugin entry 也會接線 tools、hooks 或其他僅限執行階段的
code 時，這會讓啟動與 setup 更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以讓 channel Plugin 在 gateway 的 pre-listen 啟動階段選擇使用相同的 `setupEntry` 路徑，
即使該 channel 已經設定完成。

只有在 `setupEntry` 完整涵蓋 gateway 開始監聽前必須存在的 startup surface 時，才使用此選項。
實務上，這表示 setup entry 必須註冊 startup 依賴的每個 channel-owned capability，例如：

- channel 註冊本身
- gateway 開始監聽前必須可用的任何 HTTP routes
- 在相同時間窗口內必須存在的任何 gateway methods、tools 或 services

如果你的完整 entry 仍擁有任何必要 startup capability，請不要啟用此 flag。
請保留 Plugin 的預設行為，讓 OpenClaw 在啟動期間載入完整 entry。

Bundled channels 也可以發布 setup-only contract-surface helpers，供 core
在完整 channel runtime 載入前查詢。目前的 setup promotion surface 是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

核心在需要將舊版單一帳號通道設定提升為 `channels.<id>.accounts.*`，且不載入完整 Plugin 進入點時，會使用該介面。Matrix 是目前的內建範例：當具名帳號已存在時，它只會把驗證/啟動設定鍵移到具名提升帳號中，並且可以保留已設定的非標準預設帳號鍵，而不是一律建立 `accounts.default`。

這些設定修補適配器會讓內建合約介面探索保持延遲。匯入時間維持輕量；提升介面只會在首次使用時載入，而不是在模組匯入時重新進入內建通道啟動流程。

當這些啟動介面包含 Gateway RPC 方法時，請將它們保留在 Plugin 專屬前綴下。核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍為保留項，且一律解析為 `operator.admin`，即使 Plugin 要求較窄的範圍也是如此。

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

通道 Plugin 可以透過 `openclaw.channel` 宣告設定/探索中繼資料，並透過 `openclaw.install` 宣告安裝提示。這會讓核心目錄不含資料。

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

- `detailLabel`：用於更豐富目錄/狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於的較低優先序 Plugin/通道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選取介面的文案控制
- `markdownCapable`：將通道標記為支援 Markdown，以供輸出格式決策使用
- `exposure.configured`：設為 `false` 時，從已設定通道清單介面隱藏該通道
- `exposure.setup`：設為 `false` 時，從互動式設定/設定選擇器隱藏該通道
- `exposure.docs`：將通道標記為文件導覽介面的內部/私人項目
- `showConfigured` / `showInSetup`：為相容性仍接受的舊版別名；偏好使用 `exposure`
- `quickstartAllowFrom`：讓通道加入標準快速開始 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳號存在，也要求明確帳號繫結
- `preferSessionLookupForAnnounceTarget`：解析公告目標時偏好工作階段查詢

OpenClaw 也可以合併**外部通道目錄**（例如 MPM 登錄匯出）。將 JSON 檔案放在下列任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的通道目錄項目和提供者安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開正規化的安裝來源事實。正規化事實會識別 npm 規格是精確版本還是浮動選擇器、是否存在預期的完整性中繼資料，以及本機來源路徑是否也可用。當目錄/套件身分已知時，如果解析出的 npm 套件名稱偏離該身分，正規化事實會發出警告。當 `defaultChoice` 無效或指向不可用的來源時，以及 npm 完整性中繼資料存在但沒有有效 npm 來源時，它們也會發出警告。消費者應將 `installSource` 視為附加的選用欄位，讓手工建立的項目和目錄相容層不需要合成它。這可讓入門流程和診斷說明來源平面狀態，而不必匯入 Plugin 執行階段。

官方外部 npm 項目應偏好精確的 `npmSpec` 加上 `expectedIntegrity`。裸套件名稱和 dist-tag 仍可為了相容性運作，但它們會顯示來源平面警告，讓目錄可以朝向釘選且經完整性檢查的安裝移動，而不破壞現有 Plugin。當入門流程從本機目錄路徑安裝時，會記錄一個受管理的 Plugin Plugin 索引項目，帶有 `source: "path"`，並在可行時包含工作區相對的 `sourcePath`。絕對的操作載入路徑仍保留在 `plugins.load.paths`；安裝記錄會避免將本機工作站路徑複製到長期設定中。這讓本機開發安裝可被來源平面診斷看見，同時不新增第二個原始檔案系統路徑揭露介面。持久化的 `plugins/installs.json` Plugin 索引是安裝來源的真實來源，且可在不載入 Plugin 執行階段模組的情況下重新整理。即使 Plugin manifest 遺失或無效，其 `installRecords` 對應仍是持久的；其 `plugins` 陣列則是可重建的 manifest 檢視。

## 脈絡引擎 Plugin

脈絡引擎 Plugin 擁有用於擷取、組裝和 Compaction 的工作階段脈絡協調。請從你的 Plugin 使用 `api.registerContextEngine(id, factory)` 註冊它們，然後使用 `plugins.slots.contextEngine` 選取作用中的引擎。

當你的 Plugin 需要取代或擴充預設脈絡管線，而不只是新增記憶搜尋或 hook 時，請使用這項能力。

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

工廠 `ctx` 會公開選用的 `config`、`agentDir` 和 `workspaceDir` 值，用於建構時初始化。

如果你的引擎**不**擁有 Compaction 演算法，請保留 `compact()` 實作並明確委派它：

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

## 新增新能力

當 Plugin 需要的行為不符合目前 API 時，不要用私有觸及方式繞過 Plugin 系統。請新增缺少的能力。

建議順序：

1. 定義核心合約
   決定核心應擁有哪些共享行為：政策、備援、設定合併、生命週期、面向通道的語意，以及執行階段輔助器形狀。
2. 新增具型別的 Plugin 註冊/執行階段介面
   以最小可用的具型別能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接核心 + 通道/功能消費者
   通道與功能 Plugin 應透過核心消費新能力，而不是直接匯入供應商實作。
4. 註冊供應商實作
   接著供應商 Plugin 針對該能力註冊其後端。
5. 新增合約涵蓋
   新增測試，讓所有權和註冊形狀能隨時間保持明確。

這就是 OpenClaw 保持有主見，而不會硬編碼到某個提供者世界觀的方式。請參閱[能力食譜](/zh-TW/plugins/architecture)，了解具體檔案檢查清單和完整範例。

### 能力檢查清單

新增新能力時，實作通常應一起觸及這些介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心執行器/執行階段輔助器
- `src/plugins/types.ts` 中的 Plugin API 註冊介面
- `src/plugins/registry.ts` 中的 Plugin 登錄串接
- 當功能/通道 Plugin 需要消費它時，`src/plugins/runtime/*` 中的 Plugin 執行階段公開
- `src/test-utils/plugin-registration.ts` 中的擷取/測試輔助器
- `src/plugins/contracts/registry.ts` 中的所有權/合約斷言
- `docs/` 中的操作員/Plugin 文件

如果其中某個介面缺失，通常表示該能力尚未完全整合。

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

這會讓規則保持簡單：

- 核心擁有能力合約 + 協調
- 供應商 Plugin 擁有供應商實作
- 功能/通道 Plugin 消費執行階段輔助器
- 合約測試讓所有權保持明確

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 公開能力模型和形狀
- [Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
