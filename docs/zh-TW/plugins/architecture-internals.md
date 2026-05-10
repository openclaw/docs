---
read_when:
    - 實作提供者執行階段鉤子、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或註冊表狀態
    - 新增 Plugin 能力或上下文引擎 Plugin
summary: Plugin 架構內部：載入管線、登錄表、執行階段 hooks、HTTP 路由與參考表格
title: Plugin 架構內部機制
x-i18n:
    generated_at: "2026-05-10T19:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

對於公開的能力模型、Plugin 形狀，以及所有權/執行
合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是
內部機制的參考資料：載入管線、註冊表、執行階段 hooks、
Gateway HTTP routes、匯入路徑，以及 schema 表格。

## 載入管線

啟動時，OpenClaw 大致會執行以下動作：

1. 探索候選 Plugin 根目錄
2. 讀取原生或相容 bundle manifests 與 package metadata
3. 拒絕不安全的候選項
4. 正規化 Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項是否啟用
6. 載入已啟用的原生模組：建置完成的 bundled modules 會使用原生 loader；
   第三方本機原始碼 TypeScript 會使用緊急 Jiti fallback
7. 呼叫原生 `register(api)` hooks，並將 registrations 收集到 Plugin 註冊表
8. 將註冊表公開給 commands/runtime surfaces

<Note>
`activate` 是 `register` 的 legacy alias — loader 會解析存在的那一個（`def.register ?? def.activate`），並在同一個時間點呼叫它。所有 bundled plugins 都使用 `register`；新的 plugins 請優先使用 `register`。
</Note>

安全閘門會在執行階段執行**之前**發生。當 entry 逸出 Plugin 根目錄、
路徑可被所有使用者寫入，或非 bundled plugins 的路徑所有權看起來可疑時，
候選項會被封鎖。

被封鎖的候選項仍會繫結到其 Plugin id 以供診斷。如果設定仍引用該 id，
驗證會將 Plugin 回報為存在但已封鎖，並指回 path-safety 警告，而不是
將設定 entry 視為過期。

### Manifest-first 行為

manifest 是 control-plane 的真實來源。OpenClaw 會使用它來：

- 識別 Plugin
- 探索宣告的 channels/skills/config schema 或 bundle capabilities
- 驗證 `plugins.entries.<id>.config`
- 擴充 Control UI labels/placeholders
- 顯示 install/catalog metadata
- 在不載入 Plugin runtime 的情況下保留低成本的 activation 與 setup descriptors

對於原生 plugins，runtime module 是 data-plane 部分。它會註冊
實際行為，例如 hooks、tools、commands，或 provider flows。

選用的 manifest `activation` 與 `setup` blocks 會留在 control plane。
它們是僅限 metadata 的 descriptors，用於 activation planning 與 setup discovery；
它們不會取代 runtime registration、`register(...)` 或 `setupEntry`。
第一批 live activation consumers 現在會使用 manifest command、channel 與 provider hints，
在更廣泛的 registry materialization 之前縮小 Plugin 載入範圍：

- CLI loading 會縮小到擁有所要求 primary command 的 plugins
- channel setup/plugin resolution 會縮小到擁有所要求
  channel id 的 plugins
- explicit provider setup/runtime resolution 會縮小到擁有所要求
  provider id 的 plugins
- Gateway startup planning 會使用 `activation.onStartup` 處理明確的 startup
  imports 與 startup opt-outs；沒有 startup metadata 的 plugins 只會
  透過較窄的 activation triggers 載入

要求廣泛 `all` scope 的 request-time runtime preloads，仍會從設定、startup planning、
已設定的 channels、slots，以及 auto-enable rules 推導出明確的 effective Plugin id set。
如果推導出的集合為空，OpenClaw 會載入空的 runtime registry，而不是擴大到每個可探索的
Plugin。

activation planner 同時公開 ids-only API 給現有 callers，並提供 plan API 給新的診斷。
Plan entries 會回報 Plugin 被選取的原因，將明確的 `activation.*` planner hints 與
manifest ownership fallback（例如 `providers`、`channels`、`commandAliases`、
`setup.providers`、`contracts.tools` 與 hooks）分開。這種 reason split 是相容性邊界：
現有 Plugin metadata 會繼續運作，而新程式碼可以偵測 broad hints 或 fallback behavior，
不必變更 runtime loading semantics。

Setup discovery 現在會優先使用 descriptor-owned ids，例如 `setup.providers` 與
`setup.cliBackends`，在 fallback 到 `setup-api` 之前先縮小候選 plugins；
`setup-api` 仍供需要 setup-time runtime hooks 的 plugins 使用。Provider
setup lists 會使用 manifest `providerAuthChoices`、descriptor-derived setup
choices，以及 install-catalog metadata，而不載入 provider runtime。明確的
`setup.requiresRuntime: false` 是 descriptor-only cutoff；省略
`requiresRuntime` 會保留 legacy setup-api fallback 以維持相容性。如果有多個
已探索的 Plugin 宣稱同一個正規化後的 setup provider 或 CLI backend id，setup lookup
會拒絕這個 ambiguous owner，而不是依賴 discovery order。當 setup runtime 確實執行時，
registry diagnostics 會回報 `setup.providers` / `setup.cliBackends` 與 setup-api
註冊的 providers 或 CLI backends 之間的 drift，但不會封鎖 legacy plugins。

### Plugin 快取邊界

OpenClaw 不會在 wall-clock windows 背後快取 Plugin discovery results 或 direct manifest registry
data。安裝、manifest 編輯，以及 load-path 變更，必須在下一次明確的 metadata read 或
snapshot rebuild 時變得可見。manifest file parser 可以保留有界的 file-signature cache，
以已開啟的 manifest path、inode、size 與 timestamps 作為 key；該 cache 只會避免
重新解析未變更的 bytes，且不得快取 discovery、registry、owner 或 policy answers。

安全的 metadata fast path 是明確的 object ownership，而不是隱藏 cache。
Gateway startup hot paths 應該透過 call chain 傳遞目前的 `PluginMetadataSnapshot`、
推導出的 `PluginLookUpTable`，或明確的 manifest registry。Config validation、
startup auto-enable、Plugin bootstrap 與 provider selection 可以在這些 objects
代表目前 config 與 Plugin inventory 時重用它們。Setup lookup 仍會依需求重建 manifest
metadata，除非特定 setup path 收到明確的 manifest registry；請將其保留為 cold-path
fallback，而不是新增隱藏 lookup caches。當 input 變更時，請 rebuild 並替換 snapshot，
而不是 mutate 它或保留歷史 copies。
針對 active Plugin registry 的 views 與 bundled channel bootstrap helpers，應該從目前的
registry/root 重新計算。短生命週期 maps 可在單次 call 內用於 dedupe work 或 guard reentry；
它們不得變成 process metadata caches。

對於 Plugin loading，持久 cache layer 是 runtime loading。它可以在 code 或 installed artifacts
實際被載入時重用 loader state，例如：

- `PluginLoaderCacheState` 與 compatible active runtime registries
- 用於避免重複匯入相同 runtime surface 的 jiti/module caches 與 public-surface loader caches
- installed Plugin artifacts 的 filesystem caches
- 用於 path normalization 或 duplicate resolution 的短生命週期 per-call maps

這些 caches 是 data-plane implementation details。除非 caller 明確要求 runtime loading，
否則它們不得回答 control-plane 問題，例如「哪個 Plugin 擁有此 provider？」

不要為以下項目新增 persistent 或 wall-clock caches：

- discovery results
- direct manifest registries
- 從 installed Plugin index 重建的 manifest registries
- provider owner lookup、model suppression、provider policy，或 public-artifact
  metadata
- 任何其他 manifest-derived answer，其中變更後的 manifest、installed index，
  或 load path 應該在下一次 metadata read 時可見

從 persisted installed Plugin index rebuild manifest metadata 的 callers 會依需求重建該 registry。
installed index 是 durable source-plane state；它不是隱藏的 in-process metadata cache。

## 註冊表模型

已載入的 plugins 不會直接 mutate 隨機的 core globals。它們會註冊到
中央 Plugin 註冊表。

註冊表會追蹤：

- Plugin records（identity、source、origin、status、diagnostics）
- tools
- legacy hooks 與 typed hooks
- channels
- providers
- Gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- Plugin-owned commands

Core features 接著會從該註冊表讀取，而不是直接與 Plugin modules 溝通。
這會讓載入保持單向：

- Plugin module -> registry registration
- core runtime -> registry consumption

這種分離對可維護性很重要。這表示多數 core surfaces 只需要一個 integration point：
「讀取註冊表」，而不是「為每個 Plugin module 做 special-case」。

## 對話繫結 callbacks

繫結對話的 plugins 可以在 approval 被解析時做出反應。

使用 `api.onConversationBindingResolved(...)`，在 bind request 被 approved 或 denied
之後接收 callback：

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
- `decision`: `"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`: approved requests 的 resolved binding
- `request`: 原始 request summary、detach hint、sender id，以及
  conversation metadata

此 callback 僅供 notification。它不會改變誰被允許 bind conversation，
且會在 core approval handling 完成後執行。

## Provider runtime hooks

Provider plugins 有三層：

- **Manifest metadata**，用於低成本的 pre-runtime lookup：
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`，以及 `channelEnvVars`。
- **Config-time hooks**：`catalog`（legacy `discovery`）加上
  `applyConfigDefaults`。
- **Runtime hooks**：40+ 個選用 hooks，涵蓋 auth、model resolution、
  stream wrapping、thinking levels、replay policy，以及 usage endpoints。完整清單請見
  [Hook 順序與用法](#hook-order-and-usage)。

OpenClaw 仍擁有 generic agent loop、failover、transcript handling 與
tool policy。這些 hooks 是 provider-specific behavior 的 extension surface，
不需要完整的 custom inference transport。

當 provider 具有 env-based credentials，且 generic auth/status/model-picker paths
應該在不載入 Plugin runtime 的情況下看到它們時，請使用 manifest
`setup.providers[].envVars`。Deprecated `providerAuthEnvVars` 在 deprecation window
期間仍會由 compatibility adapter 讀取，而使用它的 non-bundled plugins 會收到
manifest diagnostic。當一個 provider id 應重用另一個 provider id 的 env vars、auth profiles、
config-backed auth，以及 API-key onboarding choice 時，請使用 manifest `providerAuthAliases`。
當 onboarding/auth-choice CLI surfaces 應該在不載入 provider runtime 的情況下知道
provider 的 choice id、group labels，以及簡單的 one-flag auth wiring 時，請使用 manifest
`providerAuthChoices`。保留 provider runtime `envVars` 給 operator-facing hints，
例如 onboarding labels 或 OAuth client-id/client-secret setup vars。

當 channel 具有 env-driven auth 或 setup，且 generic shell-env fallback、config/status checks
或 setup prompts 應該在不載入 channel runtime 的情況下看到它們時，請使用 manifest
`channelEnvVars`。

### Hook 順序與用法

對於 model/provider plugins，OpenClaw 會大致依下列順序呼叫 hooks。
「何時使用」欄是快速決策指南。
OpenClaw 不再呼叫的 compatibility-only provider fields，例如
`ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，會刻意不列在這裡。

| #   | 掛鉤                              | 作用                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基底 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境或提供者模型家族語意                                                                         |
| --  | _(內建模型查找)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是 Plugin 掛鉤)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找前正規化舊版或預覽模型 ID 別名                                                     | 提供者在標準模型解析前負責別名清理                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前，正規化提供者家族的 `api` / `baseUrl`                                      | 提供者負責清理同一傳輸家族中自訂提供者 ID 的傳輸設定                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前，正規化 `models.providers.<id>`                                           | 提供者需要與 Plugin 一起維護的設定清理；內建的 Google 家族輔助工具也會備援支援的 Google 設定項目   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者有提供者擁有的環境標記 API 金鑰解析；`amazon-bedrock` 也在此內建 AWS 環境標記解析器                  |
| 8   | `resolveSyntheticAuth`            | 露出本機/自託管或設定支援的驗證，而不持久化明文                                   | 提供者可使用合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；CLI/應用程式擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；在 manifest 中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔佔位符降至環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先順位的合成佔位符設定檔                                                                 |
| 11  | `resolveDynamicModel`             | 對尚未在本機登錄檔中的提供者擁有模型 ID 進行同步備援                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步暖機，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最後重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `contributeResolvedModelCompat`   | 為位於另一個相容傳輸後方的供應商模型提供相容性旗標                                  | 提供者可在代理傳輸上辨識自己的模型，而不接管該提供者                                                       |
| 15  | `normalizeToolSchemas`            | 在嵌入式執行器看到工具 schema 前正規化它們                                                    | 提供者需要傳輸家族 schema 清理                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後露出提供者擁有的 schema 診斷                                                  | 提供者想要關鍵字警告，而不讓核心學習提供者特定規則                                                                 |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出合約                                                              | 提供者需要標記式推理/最終輸出，而不是原生欄位                                                                         |
| 18  | `prepareExtraParams`              | 在通用串流選項包裝器前進行請求參數正規化                                              | 提供者需要預設請求參數或個別提供者的參數清理                                                                           |
| 19  | `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 在套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/本文/模型相容性包裝器，而不是自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加原生每回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸送出提供者原生的回合身分                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻原則                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或備援原則                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式器：已儲存的設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | OAuth 重新整理覆寫，用於自訂重新整理端點或重新整理失敗原則                                  | 提供者不適合共用的 `pi-ai` 重新整理器                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者在重新整理失敗後需要提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 提供者擁有的內容視窗溢位比對器                                                                 | 提供者有通用啟發式規則會漏掉的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可將原始 API/傳輸錯誤映射為速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | 代理/回程提供者的提示快取原則                                                               | 提供者需要代理特定的快取 TTL 門控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者特定的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 在探索後附加的合成/最終目錄列                                                          | 提供者需要在 `models list` 和選擇器中加入合成的向前相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 等級集、顯示標籤和預設值                                                 | 提供者為選定模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性掛鉤                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性掛鉤                                                                   | 提供者只想在部分模型上啟用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性掛鉤                                                                      | 提供者擁有某個模型家族的預設 `/think` 原則                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的現代模型比對器                                              | 提供者擁有即時/煙霧測試偏好模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前，將已設定的憑證交換為實際的執行階段權杖/金鑰                       | 提供者需要權杖交換或短效請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的用量/帳務憑證                                     | 供應商需要自訂用量/配額權杖解析，或不同的用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在驗證解析完成後，擷取並正規化供應商特定的用量/配額快照                             | 供應商需要供應商特定的用量端點或承載資料解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 為記憶/搜尋建立供應商擁有的嵌入配接器                                                     | 記憶嵌入行為屬於供應商 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 回傳控制供應商對話記錄處理的重播原則                                        | 供應商需要自訂對話記錄原則（例如，移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用對話記錄清理後重寫重播歷程                                                        | 供應商需要超出共用 Compaction 輔助工具範圍的供應商特定重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器之前進行最終重播回合驗證或重塑                                           | 在通用清理後，供應商傳輸需要更嚴格的回合驗證                                                                    |
| 43  | `onModelSelected`                 | 執行供應商擁有的選取後副作用                                                                 | 模型啟用時，供應商需要遙測或供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查
相符的供應商 Plugin，接著繼續檢查其他具備 hook 能力的供應商 Plugin，
直到其中一個實際變更模型 ID 或傳輸/config 為止。這讓
別名/相容性供應商 shim 能持續運作，而不要求呼叫端知道哪個
內建 Plugin 擁有該重寫邏輯。如果沒有供應商 hook 重寫受支援的
Google-family config 項目，內建 Google config normalizer 仍會套用
該相容性清理。

如果供應商需要完全自訂的 wire protocol 或自訂 request executor，
那是另一類擴充。這些 hook 適用於仍在 OpenClaw 一般 inference loop
上執行的供應商行為。

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

內建供應商 Plugin 會組合上述 hook，以符合各供應商的 catalog、
auth、thinking、replay 與 usage 需求。權威的 hook 集合位於
`extensions/` 下的各 Plugin；本頁說明的是形態，而不是鏡像列出清單。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI 會註冊 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，因此它們可以在
    OpenClaw 的靜態 catalog 之前公開上游模型 ID。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 會將
    `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配對，以擁有 token exchange 和 `/usage` 整合。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共用的命名 family（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）讓供應商可透過
    `buildReplayPolicy` 選用 transcript policy，而不必讓每個 Plugin
    重新實作清理。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只註冊 `catalog`，並沿用共用 inference loop。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位於
    Anthropic Plugin 的公開 `api.ts` / `contract-api.ts` seam
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）中，而不是位於
    generic SDK。
  </Accordion>
</AccordionGroup>

## 執行階段輔助工具

Plugin 可以透過 `api.runtime` 存取選定的核心輔助工具。對於 TTS：

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

- `textToSpeech` 會回傳一般核心 TTS 輸出 payload，用於檔案/語音備註介面。
- 使用核心 `messages.tts` 設定與供應商選擇。
- 回傳 PCM 音訊 buffer + sample rate。Plugin 必須針對供應商重新取樣/編碼。
- `listVoices` 對每個供應商而言都是選用項目。請將它用於供應商擁有的語音選擇器或設定流程。
- 語音清單可包含更豐富的 metadata，例如 locale、gender 和 personality tags，以供 provider-aware picker 使用。
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

- 將 TTS policy、fallback 和回覆傳遞保留在核心中。
- 使用 speech provider 處理由供應商擁有的 synthesis 行為。
- 舊版 Microsoft `edge` input 會 normalize 為 `microsoft` provider id。
- 偏好的 ownership model 是以公司為導向：單一供應商 Plugin 可以在
  OpenClaw 新增這些 capability contract 時，擁有文字、語音、影像和未來媒體供應商。

對於影像/音訊/影片 understanding，Plugin 會註冊一個具型別的
media-understanding provider，而不是 generic key/value bag：

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

- 將 orchestration、fallback、config 和 channel wiring 保留在核心中。
- 將供應商行為保留在供應商 Plugin 中。
- 加法式擴充應維持具型別：新的 optional methods、新的 optional
  result fields、新的 optional capabilities。
- Video generation 已遵循相同模式：
  - 核心擁有 capability contract 和 runtime helper
  - 供應商 Plugin 註冊 `api.registerVideoGenerationProvider(...)`
  - feature/channel Plugin 使用 `api.runtime.videoGeneration.*`

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

對於 audio transcription，Plugin 可以使用 media-understanding runtime
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

- `api.runtime.mediaUnderstanding.*` 是 image/audio/video understanding 的偏好共用介面。
- 使用核心 media-understanding audio 設定（`tools.media.audio`）和 provider fallback order。
- 未產生 transcription 輸出時，回傳 `{ text: undefined }`（例如略過/不支援的 input）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留為相容性 alias。

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

- `provider` 和 `model` 是每次執行的 optional override，不是持久性的 session 變更。
- OpenClaw 只會為受信任的呼叫端採用這些 override 欄位。
- 對於 Plugin 擁有的 fallback run，operator 必須以 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇啟用。
- 使用 `plugins.entries.<id>.subagent.allowedModels`，將受信任的 Plugin 限制為特定 canonical `provider/model` target，或使用 `"*"` 明確允許任何 target。
- 不受信任的 Plugin subagent run 仍會運作，但 override request 會被拒絕，而不是靜默 fallback。
- Plugin 建立的 subagent session 會標記建立它的 Plugin ID。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除這些擁有的 session；任意刪除 session 仍需要 admin-scoped Gateway request。

對於 web search，Plugin 可以使用共用 runtime helper，而不是
進入 agent tool wiring：

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

- 將 provider selection、credential resolution 和 shared request semantics 保留在核心中。
- 使用 web-search provider 處理由供應商特定的 search transport。
- `api.runtime.webSearch.*` 是需要搜尋行為且不依賴 agent tool wrapper 的 feature/channel Plugin 偏好共用介面。

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

- `generate(...)`：使用已設定的 image-generation provider chain 產生影像。
- `listProviders(...)`：列出可用的 image-generation provider 及其 capabilities。

## Gateway HTTP 路由

Plugin 可以透過 `api.registerHttpRoute(...)` 公開 HTTP endpoint。

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

- `path`：gateway HTTP server 下的 route path。
- `auth`：必要。使用 `"gateway"` 要求一般 gateway auth，或使用 `"plugin"` 進行 plugin-managed auth/webhook verification。
- `match`：選用。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選用。允許同一個 Plugin 替換自己既有的 route registration。
- `handler`：當 route 已處理 request 時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，並會造成 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 精確的 `path + match` 衝突會被拒絕，除非設定 `replaceExisting: true`，且一個 Plugin 不能取代另一個 Plugin 的路由。
- 不同 `auth` 等級的重疊路由會被拒絕。請只在相同 auth 等級上保留 `exact`/`prefix` 後續比對鏈。
- `auth: "plugin"` 路由**不會**自動接收操作員執行階段範圍。它們用於 Plugin 管理的 Webhook/簽章驗證，而不是具特權的 Gateway 輔助呼叫。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段範圍內執行，但該範圍刻意保持保守：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）會將 Plugin 路由執行階段範圍固定為 `operator.write`，即使呼叫端傳送 `x-openclaw-scopes`
  - 受信任且帶有身分的 HTTP 模式（例如 `trusted-proxy`，或私人入口上的 `gateway.auth.mode = "none"`）只有在標頭明確存在時才會採用 `x-openclaw-scopes`
  - 如果這些帶有身分的 Plugin 路由請求缺少 `x-openclaw-scopes`，執行階段範圍會退回到 `operator.write`
- 實務規則：不要假設 gateway-auth Plugin 路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求帶有身分的 auth 模式，並記錄明確的 `x-openclaw-scopes` 標頭合約。

## Plugin SDK 匯入路徑

撰寫新 Plugin 時，請使用較窄的 SDK 子路徑，而不是整合式的 `openclaw/plugin-sdk` 根 barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊基本元件                               |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點/建置輔助工具                           |
| `openclaw/plugin-sdk/core`          | 通用共享輔助工具與總括合約                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述（`OpenClawSchema`） |

頻道 Plugin 從一系列較窄的接縫中選用：`channel-setup`、`setup-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。核准行為應整合到單一 `approvalCapability` 合約，而不是混用無關的 Plugin 欄位。請參閱[頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於對應的聚焦 `*-runtime` 子路徑下（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、`channel-activity-runtime` 等）。請優先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime` 和 `openclaw/plugin-sdk/infra-runtime` 是供舊版 Plugin 使用的已棄用相容性 shim。新程式碼應改為匯入較窄的通用基本元件。
</Info>

Repo 內部進入點（依每個隨附 Plugin 套件根目錄）：

- `index.js` — 隨附 Plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — 設定 Plugin 進入點

外部 Plugin 只應匯入 `openclaw/plugin-sdk/*` 子路徑。切勿從核心或另一個 Plugin 匯入另一個 Plugin 套件的 `src/*`。透過 Facade 載入的進入點會在存在時優先使用作用中的執行階段設定快照，然後才退回到磁碟上已解析的設定檔。

`image-generation`、`media-understanding` 和 `speech` 等能力特定子路徑存在，是因為隨附 Plugin 目前正在使用它們。它們不會自動成為長期凍結的外部合約；依賴它們時，請查看相關 SDK 參考頁面。

## 訊息工具結構描述

Plugin 應擁有頻道特定的 `describeMessageTool(...)` 結構描述貢獻，用於反應、已讀和投票等非訊息基本元件。共享的傳送呈現應使用通用 `MessagePresentation` 合約，而不是供應商原生的按鈕、元件、區塊或卡片欄位。合約、後備規則、供應商對應和 Plugin 作者檢查清單請參閱[訊息呈現](/zh-TW/plugins/message-presentation)。

可傳送的 Plugin 會透過訊息能力宣告它們可以呈現的內容：

- `presentation` 用於語意呈現區塊（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用於釘選傳送請求

核心會決定要以原生方式呈現該呈現，或將其降級為文字。不要從通用訊息工具暴露供應商原生 UI 逃生口。舊版原生結構描述的已棄用 SDK 輔助工具仍會為既有第三方 Plugin 匯出，但新 Plugin 不應使用它們。

## 頻道目標解析

頻道 Plugin 應擁有頻道特定的目標語意。請讓共享的輸出主機保持通用，並使用訊息配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查找前，決定正規化目標應被視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心輸入是否應略過目錄搜尋，直接進入類似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是 Plugin 後備機制，供核心在正規化後或目錄未命中後，需要最終由供應商擁有的解析時使用。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責供應商特定的工作階段路由建構。

建議分工：

- 使用 `inferTargetChatType` 處理應在搜尋 peers/groups 之前發生的類別決策。
- 使用 `looksLikeId` 進行「將此視為明確/原生目標 id」檢查。
- 使用 `resolveTarget` 作為供應商特定的正規化後備，而不是用於廣泛的目錄搜尋。
- 將聊天 id、討論串 id、JID、handle 和 room id 等供應商原生 id 保留在 `target` 值或供應商特定參數中，而不是放在通用 SDK 欄位。

## 設定支援的目錄

從設定衍生目錄項目的 Plugin 應將該邏輯保留在 Plugin 中，並重用 `openclaw/plugin-sdk/directory-runtime` 的共享輔助工具。

當頻道需要設定支援的 peers/groups 時使用此方式，例如：

- 由允許清單驅動的 DM peers
- 已設定的頻道/群組對應
- 帳號範圍的靜態目錄後備

`directory-runtime` 中的共享輔助工具只處理通用操作：

- 查詢篩選
- 套用限制
- 去重/正規化輔助工具
- 建置 `ChannelDirectoryEntry[]`

頻道特定的帳號檢查與 id 正規化應保留在 Plugin 實作中。

## 供應商型錄

供應商 Plugin 可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 定義用於推論的模型型錄。

`catalog.run(...)` 會傳回與 OpenClaw 寫入 `models.providers` 相同的形狀：

- `{ provider }` 用於單一供應商項目
- `{ providers }` 用於多個供應商項目

當 Plugin 擁有供應商特定模型 id、base URL 預設值或受 auth 控制的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制 Plugin 型錄相對於 OpenClaw 內建隱含供應商的合併時機：

- `simple`：一般 API key 或由 env 驅動的供應商
- `profile`：auth profile 存在時出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：最後一輪，在其他隱含供應商之後

較晚的供應商在 key 衝突時勝出，因此 Plugin 可以有意使用相同供應商 id 覆寫內建供應商項目。

Plugin 也可以透過 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 發布唯讀模型列。這是 list/help/picker 介面的前進路徑，並支援 `text`、`image_generation`、`video_generation` 和 `music_generation` 列。供應商 Plugin 仍擁有即時端點呼叫、token 交換和廠商回應對應；核心擁有通用列形狀、來源標籤和媒體工具說明格式。媒體生成供應商註冊會自動從 `defaultModel`、`models` 和 `capabilities` 合成靜態型錄列。

相容性：

- `discovery` 仍可作為舊版別名使用，但會發出棄用警告
- 如果同時註冊 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`
- `augmentModelCatalog` 已棄用；隨附供應商應透過 `registerModelCatalogProvider` 發布補充列

## 唯讀頻道檢查

如果你的 Plugin 註冊了頻道，建議在 `resolveAccount(...)` 旁一併實作 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設認證已完整具現化，並可在缺少必要祕密時快速失敗。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor/config 修復流程等唯讀命令路徑，不應為了描述設定而需要具現化執行階段認證。

建議的 `inspectAccount(...)` 行為：

- 只傳回描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時包含認證來源/狀態欄位，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要為了報告唯讀可用性而傳回原始 token 值。傳回 `tokenStatus: "available"`（以及對應的來源欄位）就足以供狀態類命令使用。
- 當認證是透過 SecretRef 設定，但在目前命令路徑中不可用時，請使用 `configured_unavailable`。

這可讓唯讀命令回報「已設定，但在此命令路徑中不可用」，而不是當機或誤報帳號未設定。

## 套件包

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

每個項目都會成為一個 Plugin。如果套件包列出多個 extensions，Plugin id 會變成 `name/<fileBase>`。

如果你的 Plugin 匯入 npm deps，請在該目錄中安裝它們，讓 `node_modules` 可用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在符號連結解析後，都必須留在 Plugin 目錄內。逃出套件目錄的項目會被拒絕。

安全注意事項：`openclaw plugins install` 會使用專案本機的 `npm install --omit=dev --ignore-scripts` 安裝 Plugin 相依套件（無生命週期 scripts，執行階段無 dev dependencies），並忽略繼承的全域 npm install 設定。請保持 Plugin 相依樹為「純 JS/TS」，並避免需要 `postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。當 OpenClaw 需要已停用頻道 Plugin 的設定介面，或當頻道 Plugin 已啟用但仍未設定時，它會載入 `setupEntry`，而不是完整的 Plugin 進入點。當你的主要 Plugin 進入點也連接工具、hook 或其他僅限執行階段的程式碼時，這可讓啟動與設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以讓頻道 Plugin 選擇在 Gateway 的 listen 前啟動階段使用相同的 `setupEntry` 路徑，即使該頻道已經設定完成。

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

頻道 plugins 可透過 `openclaw.channel` 宣告設定/探索中繼資料，並透過
`openclaw.install` 宣告安裝提示。這會讓核心目錄不含資料。

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

最小範例以外實用的 `openclaw.channel` 欄位：

- `detailLabel`：用於更豐富的目錄/狀態介面的次要標籤
- `docsLabel`：覆寫文件連結的連結文字
- `preferOver`：此目錄項目應優先於較低優先序的 plugin/頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選擇介面的文案控制
- `markdownCapable`：將頻道標記為支援 markdown，以供外送格式決策使用
- `exposure.configured`：設為 `false` 時，從已設定頻道清單介面隱藏該頻道
- `exposure.setup`：設為 `false` 時，從互動式設定/配置選擇器隱藏該頻道
- `exposure.docs`：將頻道標記為文件導覽介面中的內部/私有頻道
- `showConfigured` / `showInSetup`：為了相容性仍接受的舊別名；偏好使用 `exposure`
- `quickstartAllowFrom`：讓頻道加入標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一個帳戶，也要求明確帳戶綁定
- `preferSessionLookupForAnnounceTarget`：解析公告目標時偏好使用工作階段查找

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM registry 匯出）。將 JSON
檔案放在以下其中一個位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案都應包含
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊別名。

產生的頻道目錄項目和供應商安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開
標準化的安裝來源事實。標準化事實會識別 npm 規格是精確版本還是浮動
選擇器、預期的 integrity 中繼資料是否存在，以及本機來源路徑是否也可用。
當目錄/套件身分已知時，如果解析出的 npm 套件名稱偏離該身分，標準化事實會提出警告。
當 `defaultChoice` 無效或指向不可用來源，以及存在 npm integrity 中繼資料但沒有有效 npm
來源時，也會提出警告。消費端應將 `installSource` 視為加成的選用欄位，讓手工建立的項目和目錄 shim
不必合成它。這讓 onboarding 和診斷可以在不匯入 plugin runtime 的情況下說明來源平面狀態。

官方外部 npm 項目應偏好精確的 `npmSpec` 加上
`expectedIntegrity`。裸套件名稱和 dist-tags 為了相容性仍可運作，
但它們會顯示來源平面警告，讓目錄能朝向已釘選、已檢查 integrity 的安裝前進，而不破壞現有 plugins。
當 onboarding 從本機目錄路徑安裝時，會記錄一個 managed plugin
plugin 索引項目，其中 `source: "path"`，並在可能時使用相對於工作區的
`sourcePath`。絕對的操作載入路徑仍保留在
`plugins.load.paths`；安裝記錄會避免將本機工作站路徑重複寫入長期設定。
這讓本機開發安裝能被來源平面診斷看見，而不增加第二個原始檔案系統路徑揭露介面。
持久化的 `plugins/installs.json` plugin 索引是安裝來源的真實來源，且可在不載入 plugin runtime 模組的情況下重新整理。
即使 plugin manifest 遺失或無效，其 `installRecords` map 也會持久保留；其 `plugins` array 是可重建的 manifest 檢視。

## 上下文引擎 plugins

上下文引擎 plugins 擁有用於擷取、組裝和 Compaction 的工作階段上下文協調。
從你的 plugin 使用 `api.registerContextEngine(id, factory)` 註冊它們，
然後以 `plugins.slots.contextEngine` 選取作用中的引擎。

當你的 plugin 需要取代或擴充預設上下文管線，而不只是新增記憶搜尋或 hooks 時，請使用此功能。

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

如果你的引擎**不**擁有 Compaction 演算法，請保持 `compact()`
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

當 plugin 需要的行為不符合目前 API 時，不要用私有的向內存取繞過
plugin 系統。請新增缺少的能力。

建議順序：

1. 定義核心合約
   決定核心應擁有哪些共享行為：政策、fallback、設定合併、
   lifecycle、面向頻道的語意，以及 runtime helper 形狀。
2. 新增型別化的 plugin 註冊/runtime 介面
   以最小且有用的型別化能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接核心 + 頻道/功能消費端
   頻道和功能 plugins 應透過核心消費新能力，
   而不是直接匯入供應商實作。
4. 註冊供應商實作
   接著供應商 plugins 針對該能力註冊其後端。
5. 新增合約涵蓋
   新增測試，讓所有權和註冊形狀隨時間保持明確。

這就是 OpenClaw 保持有主見而不被硬編碼到單一供應商世界觀的方式。
請參閱 [能力 Cookbook](/zh-TW/plugins/adding-capabilities)，了解具體檔案檢查清單和完整範例。

### 能力檢查清單

新增能力時，實作通常應同時觸及這些介面：

- `src/<capability>/types.ts` 中的核心合約型別
- `src/<capability>/runtime.ts` 中的核心 runner/runtime helper
- `src/plugins/types.ts` 中的 plugin API 註冊介面
- `src/plugins/registry.ts` 中的 plugin registry 串接
- 當功能/頻道 plugins 需要消費時，`src/plugins/runtime/*` 中的 plugin runtime 曝露
- `src/test-utils/plugin-registration.ts` 中的捕捉/測試 helper
- `src/plugins/contracts/registry.ts` 中的所有權/合約斷言
- `docs/` 中的 operator/plugin 文件

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

合約測試模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這讓規則保持簡單：

- 核心擁有能力合約 + 協調
- 供應商 plugins 擁有供應商實作
- 功能/頻道 plugins 消費 runtime helpers
- 合約測試讓所有權保持明確

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 公開能力模型和形狀
- [Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
