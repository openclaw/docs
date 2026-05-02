---
read_when:
    - 實作提供者執行階段掛鉤、通道生命週期或套件包
    - 偵錯 Plugin 載入順序或註冊表狀態
    - 新增 Plugin 能力或上下文引擎 Plugin
summary: Plugin 架構內部：載入管線、註冊表、執行階段掛鉤、HTTP 路由和參考表
title: Plugin 架構內部
x-i18n:
    generated_at: "2026-05-02T02:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

如需了解公開能力模型、Plugin 形狀與所有權/執行
合約，請參閱 [Plugin 架構](/zh-TW/plugins/architecture)。本頁是
內部機制的參考：載入管線、登錄表、runtime hooks、
Gateway HTTP routes、import paths，以及 schema tables。

## 載入管線

啟動時，OpenClaw 大致會執行以下操作：

1. 探索候選 Plugin 根目錄
2. 讀取原生或相容 bundle manifests 與 package metadata
3. 拒絕不安全的候選項
4. 正規化 Plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 決定每個候選項是否啟用
6. 載入已啟用的原生模組：建置好的 bundled modules 使用原生 loader；
   第三方本機原始碼 TypeScript 使用緊急 Jiti fallback
7. 呼叫原生 `register(api)` hooks，並將 registrations 收集到 Plugin registry
8. 將 registry 暴露給 commands/runtime surfaces

<Note>
`activate` 是 `register` 的 legacy alias — loader 會解析存在的項目（`def.register ?? def.activate`），並在同一個時間點呼叫它。所有 bundled plugins 都使用 `register`；新的 plugins 請優先使用 `register`。
</Note>

安全閘門會在 runtime 執行**之前**發生。當 entry 逃出 Plugin root、路徑可被全世界寫入，或非 bundled plugins 的路徑
所有權看起來可疑時，候選項會被封鎖。

### Manifest 優先行為

manifest 是 control-plane 的真實來源。OpenClaw 使用它來：

- 識別 Plugin
- 探索已宣告的 channels/skills/config schema 或 bundle capabilities
- 驗證 `plugins.entries.<id>.config`
- 補強 Control UI labels/placeholders
- 顯示 install/catalog metadata
- 在不載入 Plugin runtime 的情況下，保留低成本的 activation 與 setup descriptors

對於原生 plugins，runtime module 是 data-plane 部分。它會註冊
hooks、tools、commands 或 provider flows 等實際行為。

選用的 manifest `activation` 與 `setup` blocks 會保留在 control plane。
它們是僅限 metadata 的 descriptors，用於 activation planning 與 setup discovery；
它們不會取代 runtime registration、`register(...)` 或 `setupEntry`。
第一批即時 activation consumers 現在會使用 manifest command、channel 與 provider hints
在更廣泛的 registry materialization 之前縮小 Plugin 載入範圍：

- CLI 載入會縮小到擁有所請求 primary command 的 plugins
- channel setup/plugin resolution 會縮小到擁有所請求
  channel id 的 plugins
- 明確的 provider setup/runtime resolution 會縮小到擁有所請求
  provider id 的 plugins
- Gateway 啟動規劃會使用 `activation.onStartup` 處理明確的啟動
  imports 與啟動 opt-outs；沒有啟動 metadata 的 plugins 只會
  透過較窄的 activation triggers 載入

activation planner 同時公開既有 callers 可用的 ids-only API，以及
供新 diagnostics 使用的 plan API。Plan entries 會回報 Plugin 被選取的原因，
將明確的 `activation.*` planner hints 與 manifest ownership
fallback 區分開來，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools` 與 hooks。這個 reason split 是相容性邊界：
既有的 Plugin metadata 會持續運作，而新程式碼可以偵測 broad hints
或 fallback behavior，而不需變更 runtime loading semantics。

Setup discovery 現在會優先使用 descriptor-owned ids，例如 `setup.providers` 和
`setup.cliBackends`，以在 fallback 到仍需要 setup-time runtime hooks 的 plugins 所用的
`setup-api` 之前縮小候選 plugins。Provider
setup lists 會使用 manifest `providerAuthChoices`、descriptor-derived setup
choices，以及 install-catalog metadata，而不載入 provider runtime。明確的
`setup.requiresRuntime: false` 是 descriptor-only cutoff；省略
`requiresRuntime` 會保留 legacy setup-api fallback 以維持相容性。如果有多個
探索到的 Plugin 宣告相同的正規化 setup provider 或 CLI
backend id，setup lookup 會拒絕模糊的 owner，而不是依賴
discovery order。當 setup runtime 確實執行時，registry diagnostics 會回報
`setup.providers` / `setup.cliBackends` 與由 setup-api 註冊的 providers 或 CLI
backends 之間的 drift，而不封鎖 legacy plugins。

### Plugin cache 邊界

OpenClaw 不會在 wall-clock windows 後面快取 Plugin discovery results 或 direct manifest registry
data。安裝、manifest 編輯與 load-path 變更
必須在下一次明確 metadata read 或 snapshot rebuild 時可見。
manifest file parser 可以保留有界的 file-signature cache，keyed by
已開啟的 manifest path、inode、size 與 timestamps；該 cache 只會避免
重新解析未變更的 bytes，且不得快取 discovery、registry、owner 或
policy answers。

安全的 metadata fast path 是明確的 object ownership，而不是隱藏 cache。
Gateway 啟動 hot paths 應透過 call
chain 傳遞目前的 `PluginMetadataSnapshot`、衍生的 `PluginLookUpTable`，或明確的 manifest registry。Config validation、startup auto-enable、Plugin bootstrap 與 provider
selection 可以重用這些 objects，只要它們代表目前的 config 與
Plugin inventory。Setup lookup 仍會按需重建 manifest metadata，
除非特定 setup path 收到明確的 manifest registry；請將其保留為
cold-path fallback，而不是新增隱藏的 lookup caches。當 input
變更時，請 rebuild 並取代 snapshot，而不是 mutate 它或保留
historical copies。
active Plugin registry 上的 views 與 bundled channel bootstrap helpers
應從目前的 registry/root 重新計算。短生命週期 maps 可用於
單次呼叫內的 dedupe work 或 guard reentry；它們不得成為 process
metadata caches。

對於 Plugin loading，persistent cache layer 是 runtime loading。當 code 或 installed artifacts 確實被載入時，它可以重用
loader state，例如：

- `PluginLoaderCacheState` 與相容的 active runtime registries
- 用於避免重複 importing
  相同 runtime surface 的 jiti/module caches 與 public-surface loader caches
- installed Plugin artifacts 的 filesystem caches
- 用於 path normalization 或 duplicate resolution 的短生命週期 per-call maps

這些 caches 是 data-plane implementation details。除非 caller 明確要求
runtime loading，否則它們不得回答 control-plane 問題，例如「哪個 Plugin 擁有這個 provider？」。

請勿為以下項目新增 persistent 或 wall-clock caches：

- discovery results
- direct manifest registries
- 從 installed Plugin index 重建的 manifest registries
- provider owner lookup、model suppression、provider policy 或 public-artifact
  metadata
- 任何其他 manifest-derived answer，其中 changed manifest、installed index
  或 load path 應在下一次 metadata read 時可見

從 persisted installed Plugin index 重建 manifest metadata 的 callers
會按需重建該 registry。installed index 是 durable
source-plane state；它不是隱藏的 in-process metadata cache。

## Registry model

已載入的 plugins 不會直接 mutate 隨機 core globals。它們會註冊到
central Plugin registry。

registry 會追蹤：

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

Core features 接著會從該 registry 讀取，而不是直接與 Plugin modules
溝通。這讓載入保持單向：

- Plugin module -> registry registration
- core runtime -> registry consumption

這種分離對可維護性很重要。它表示大多數 core surfaces 只需要
一個 integration point：「read the registry」，而不是「special-case every Plugin
module」。

## Conversation binding callbacks

綁定 conversation 的 plugins 可以在 approval resolved 時做出反應。

使用 `api.onConversationBindingResolved(...)`，在 bind
request 被 approved 或 denied 後接收 callback：

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
- `request`: 原始 request summary、detach hint、sender id 與
  conversation metadata

此 callback 僅用於 notification。它不會變更誰被允許 bind
conversation，且會在 core approval handling 完成後執行。

## Provider runtime hooks

Provider plugins 有三層：

- **Manifest metadata**，用於低成本的 pre-runtime lookup：
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 與 `channelEnvVars`。
- **Config-time hooks**：`catalog`（legacy `discovery`）加上
  `applyConfigDefaults`。
- **Runtime hooks**：40+ 個 optional hooks，涵蓋 auth、model resolution、
  stream wrapping、thinking levels、replay policy 與 usage endpoints。請參閱
  [Hook order and usage](#hook-order-and-usage) 下的完整清單。

OpenClaw 仍然擁有 generic agent loop、failover、transcript handling 與
tool policy。這些 hooks 是 provider-specific
behavior 的 extension surface，不需要整套自訂 inference transport。

當 provider 擁有 env-based credentials，且 generic auth/status/model-picker paths 應在不載入 Plugin runtime 的情況下看到它們時，請使用 manifest `setup.providers[].envVars`。Deprecated 的 `providerAuthEnvVars` 在 deprecation window 期間仍會由
compatibility adapter 讀取，使用它的 non-bundled plugins 會收到
manifest diagnostic。當一個 provider id 應重用另一個 provider id 的 env vars、auth profiles、
config-backed auth 與 API-key onboarding choice 時，請使用 manifest `providerAuthAliases`。當 onboarding/auth-choice CLI surfaces 應在不載入 provider runtime 的情況下知道
provider 的 choice id、group labels 與 simple one-flag auth wiring 時，請使用 manifest
`providerAuthChoices`。請將 provider runtime
`envVars` 保留給 operator-facing hints，例如 onboarding labels 或 OAuth
client-id/client-secret setup vars。

當 channel 擁有 env-driven auth 或 setup，且 generic shell-env fallback、config/status checks 或 setup prompts 應在不載入 channel runtime 的情況下看到它時，請使用 manifest `channelEnvVars`。

### Hook order and usage

對於 model/provider plugins，OpenClaw 會大致依照此順序呼叫 hooks。
「When to use」欄是快速決策指南。
OpenClaw 不再呼叫的 compatibility-only provider fields，例如
`ProviderPlugin.capabilities` 與 `suppressBuiltInModel`，刻意未列於此處。

| #   | 鉤子                              | 功能                                                                                                   | 使用時機                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在產生 `models.json` 期間，將提供者設定發布到 `models.providers`                                | 提供者擁有目錄或基礎 URL 預設值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在設定具體化期間套用提供者擁有的全域設定預設值                                      | 預設值取決於驗證模式、環境，或提供者模型系列語意                                                                         |
| --  | _(內建模型查詢)_         | OpenClaw 會先嘗試一般的登錄檔/目錄路徑                                                          | _(不是 Plugin 鉤子)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查詢前正規化舊版或預覽模型 ID 別名                                                     | 提供者在標準模型解析前擁有別名清理                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型組裝前正規化提供者系列的 `api` / `baseUrl`                                      | 提供者針對同一傳輸系列中的自訂提供者 ID 擁有傳輸清理                                                          |
| 5   | `normalizeConfig`                 | 在執行階段/提供者解析前正規化 `models.providers.<id>`                                           | 提供者需要應位於 Plugin 內的設定清理；內建 Google 系列輔助程式也會補強支援的 Google 設定項目   |
| 6   | `applyNativeStreamingUsageCompat` | 對設定提供者套用原生串流用量相容性重寫                                               | 提供者需要由端點驅動的原生串流用量中繼資料修正                                                                          |
| 7   | `resolveConfigApiKey`             | 在載入執行階段驗證前，解析設定提供者的環境標記驗證                                       | 提供者擁有由提供者管理的環境標記 API 金鑰解析；`amazon-bedrock` 這裡也有內建的 AWS 環境標記解析器                  |
| 8   | `resolveSyntheticAuth`            | 顯示本機/自架或設定支援的驗證，而不持久化明文                                   | 提供者可以使用合成/本機憑證標記運作                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 疊加提供者擁有的外部驗證設定檔；CLI/應用擁有的憑證預設 `persistence` 為 `runtime-only` | 提供者重用外部驗證憑證，而不持久化複製的重新整理權杖；請在資訊清單中宣告 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 將已儲存的合成設定檔占位符降到環境/設定支援的驗證之後                                      | 提供者儲存不應取得優先權的合成占位符設定檔                                                                 |
| 11  | `resolveDynamicModel`             | 針對尚未在本機登錄檔中的提供者擁有模型 ID，同步回退                                       | 提供者接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同步預熱，然後再次執行 `resolveDynamicModel`                                                           | 提供者在解析未知 ID 前需要網路中繼資料                                                                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式執行器使用已解析模型前進行最終重寫                                               | 提供者需要傳輸重寫，但仍使用核心傳輸                                                                             |
| 14  | `contributeResolvedModelCompat`   | 為位於另一個相容傳輸後方的供應商模型貢獻相容性旗標                                  | 提供者可在代理傳輸上識別自己的模型，而不接管該提供者                                                       |
| 15  | `normalizeToolSchemas`            | 在嵌入式執行器看到工具結構描述前先正規化                                                    | 提供者需要傳輸系列結構描述清理                                                                                                |
| 16  | `inspectToolSchemas`              | 在正規化後顯示提供者擁有的結構描述診斷                                                  | 提供者想要關鍵字警告，而不讓核心學習提供者專屬規則                                                                 |
| 17  | `resolveReasoningOutputMode`      | 選擇原生或標記式推理輸出契約                                                              | 提供者需要標記式推理/最終輸出，而非原生欄位                                                                         |
| 18  | `prepareExtraParams`              | 在通用串流選項包裝器之前正規化請求參數                                              | 提供者需要預設請求參數或按提供者清理參數                                                                           |
| 19  | `createStreamFn`                  | 以自訂傳輸完整取代一般串流路徑                                                   | 提供者需要自訂線路協定，而不只是包裝器                                                                                     |
| 20  | `wrapStreamFn`                    | 套用通用包裝器後的串流包裝器                                                              | 提供者需要請求標頭/主體/模型相容性包裝器，而不是自訂傳輸                                                          |
| 21  | `resolveTransportTurnState`       | 附加原生逐回合傳輸標頭或中繼資料                                                           | 提供者希望通用傳輸傳送提供者原生的回合身分                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 標頭或工作階段冷卻政策                                                    | 提供者希望通用 WS 傳輸調整工作階段標頭或回退政策                                                               |
| 23  | `formatApiKey`                    | 驗證設定檔格式化器：已儲存設定檔會成為執行階段 `apiKey` 字串                                     | 提供者儲存額外驗證中繼資料，並需要自訂執行階段權杖形狀                                                                    |
| 24  | `refreshOAuth`                    | 針對自訂重新整理端點或重新整理失敗政策覆寫 OAuth 重新整理                                  | 提供者不符合共用的 `pi-ai` 重新整理器                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 重新整理失敗時附加的修復提示                                                                  | 提供者在重新整理失敗後需要提供者擁有的驗證修復指引                                                                      |
| 26  | `matchesContextOverflowError`     | 提供者擁有的情境視窗溢位比對器                                                                 | 提供者有通用啟發式規則會漏掉的原始溢位錯誤                                                                                |
| 27  | `classifyFailoverReason`          | 提供者擁有的容錯移轉原因分類                                                                  | 提供者可以將原始 API/傳輸錯誤對應到速率限制/過載等                                                                          |
| 28  | `isCacheTtlEligible`              | 代理/回程提供者的提示快取政策                                                               | 提供者需要代理專屬的快取 TTL 閘控                                                                                                |
| 29  | `buildMissingAuthMessage`         | 取代通用缺少驗證復原訊息                                                      | 提供者需要提供者專屬的缺少驗證復原提示                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後附加的合成/最終目錄列                                                          | 提供者需要在 `models list` 和選擇器中加入合成的前向相容列                                                                     |
| 31  | `resolveThinkingProfile`          | 模型專屬的 `/think` 等級集、顯示標籤與預設值                                                 | 提供者為所選模型公開自訂思考階梯或二元標籤                                                                 |
| 32  | `isBinaryThinking`                | 開/關推理切換相容性鉤子                                                                     | 提供者只公開二元思考開/關                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支援相容性鉤子                                                                   | 提供者只想在模型子集上啟用 `xhigh`                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 預設 `/think` 等級相容性鉤子                                                                      | 提供者擁有模型系列的預設 `/think` 政策                                                                                      |
| 35  | `isModernModelRef`                | 用於即時設定檔篩選器和煙霧測試選擇的現代模型比對器                                              | 提供者擁有即時/煙霧測試偏好的模型比對                                                                                             |
| 36  | `prepareRuntimeAuth`              | 在推論前將已設定憑證交換為實際的執行階段權杖/金鑰                       | 提供者需要權杖交換或短期請求憑證                                                                             |
| 37  | `resolveUsageAuth`                | 解析 `/usage` 與相關狀態介面的用量/帳務憑證                                     | 供應商需要自訂用量/配額權杖解析，或不同的用量憑證                                                               |
| 38  | `fetchUsageSnapshot`              | 在身分驗證解析完成後，擷取並正規化供應商專屬的用量/配額快照                             | 供應商需要供應商專屬的用量端點或酬載解析器                                                                           |
| 39  | `createEmbeddingProvider`         | 建置由供應商擁有的嵌入配接器，用於記憶/搜尋                                                     | 記憶嵌入行為屬於供應商 Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | 傳回控制供應商逐字稿處理的重播政策                                        | 供應商需要自訂逐字稿政策（例如移除思考區塊）                                                               |
| 41  | `sanitizeReplayHistory`           | 在通用逐字稿清理後重寫重播歷史                                                        | 供應商需要超出共用 Compaction 輔助工具的供應商專屬重播重寫                                                             |
| 42  | `validateReplayTurns`             | 在嵌入式執行器之前進行最終重播輪次驗證或重塑                                           | 在通用清理後，供應商傳輸需要更嚴格的輪次驗證                                                                    |
| 43  | `onModelSelected`                 | 執行由供應商擁有的選取後副作用                                                                 | 模型變為作用中時，供應商需要遙測或由供應商擁有的狀態                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 會先檢查相符的 provider plugin，然後再逐一落到其他具備 hook 能力的 provider plugins，直到其中一個實際變更模型 ID 或傳輸/設定為止。這讓 alias/compat provider shims 能持續運作，而不需要呼叫端知道哪個 bundled plugin 擁有該 rewrite。如果沒有 provider hook rewrite 支援的 Google-family config entry，bundled Google config normalizer 仍會套用該相容性清理。

如果 provider 需要完全自訂的 wire protocol 或自訂 request executor，那屬於另一類 extension。這些 hooks 適用於仍在 OpenClaw 正常 inference loop 上執行的 provider 行為。

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

Bundled provider plugins 會結合上述 hooks，以符合各 vendor 的 catalog、auth、thinking、replay 和 usage 需求。權威 hook set 與每個 plugin 一起位於 `extensions/` 下；本頁說明的是形態，而不是鏡像該清單。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI 註冊 `catalog` 加上 `resolveDynamicModel` / `prepareDynamicModel`，以便它們能在 OpenClaw 的靜態 catalog 之前公開上游 model ids。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 將 `prepareRuntimeAuth` 或 `formatApiKey` 與 `resolveUsageAuth` + `fetchUsageSnapshot` 搭配，以自行擁有 token exchange 和 `/usage` 整合。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Shared named families（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）讓 providers 透過 `buildReplayPolicy` 選用 transcript policy，而不是讓每個 plugin 重新實作 cleanup。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 只註冊 `catalog`，並沿用 shared inference loop。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位於 Anthropic plugin 的 public `api.ts` / `contract-api.ts` seam（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）內，而不是 generic SDK 內。
  </Accordion>
</AccordionGroup>

## 執行階段 helpers

Plugins 可以透過 `api.runtime` 存取選定的 core helpers。對於 TTS：

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

- `textToSpeech` 會回傳一般 core TTS output payload，用於 file/voice-note surfaces。
- 使用 core `messages.tts` 設定和 provider selection。
- 回傳 PCM audio buffer + sample rate。Plugins 必須為 providers 重新取樣/編碼。
- 每個 provider 可選擇是否支援 `listVoices`。將它用於 vendor-owned voice pickers 或 setup flows。
- Voice listings 可包含更豐富的 metadata，例如 locale、gender 和 personality tags，以供 provider-aware pickers 使用。
- OpenAI 和 ElevenLabs 目前支援 telephony。Microsoft 不支援。

Plugins 也可以透過 `api.registerSpeechProvider(...)` 註冊 speech providers。

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

- 將 TTS policy、fallback 和 reply delivery 保留在 core。
- 使用 speech providers 處理 vendor-owned synthesis 行為。
- 舊版 Microsoft `edge` input 會 normalized 為 `microsoft` provider id。
- 偏好的 ownership model 是以公司為導向：隨著 OpenClaw 新增這些 capability contracts，一個 vendor plugin 可以擁有 text、speech、image 和未來的 media providers。

對於 image/audio/video understanding，plugins 會註冊一個 typed media-understanding provider，而不是 generic key/value bag：

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

- 將 orchestration、fallback、config 和 channel wiring 保留在 core。
- 將 vendor behavior 保留在 provider plugin。
- Additive expansion 應維持 typed：新的 optional methods、新的 optional result fields、新的 optional capabilities。
- Video generation 已遵循相同模式：
  - core 擁有 capability contract 和 runtime helper
  - vendor plugins 註冊 `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins 使用 `api.runtime.videoGeneration.*`

對於 media-understanding runtime helpers，plugins 可以呼叫：

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

對於 audio transcription，plugins 可以使用 media-understanding runtime 或較舊的 STT alias：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意事項：

- `api.runtime.mediaUnderstanding.*` 是 image/audio/video understanding 的偏好 shared surface。
- 使用 core media-understanding audio configuration（`tools.media.audio`）和 provider fallback order。
- 未產生 transcription output 時（例如 skipped/unsupported input），回傳 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留作為 compatibility alias。

Plugins 也可以透過 `api.runtime.subagent` 啟動 background subagent runs：

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

- `provider` 和 `model` 是每次 run 的 optional overrides，而不是 persistent session changes。
- OpenClaw 只會為 trusted callers 採用那些 override fields。
- 對於 plugin-owned fallback runs，operators 必須使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 選用加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 將 trusted plugins 限制為特定 canonical `provider/model` targets，或使用 `"*"` 明確允許任何 target。
- Untrusted plugin subagent runs 仍可運作，但 override requests 會被 rejected，而不是 silently falling back。
- Plugin-created subagent sessions 會標記 creating plugin id。Fallback `api.runtime.subagent.deleteSession(...)` 只能刪除那些 owned sessions；任意 session deletion 仍需要 admin-scoped Gateway request。

對於 web search，plugins 可以使用 shared runtime helper，而不是深入 agent tool wiring：

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

Plugins 也可以透過 `api.registerWebSearchProvider(...)` 註冊 web-search providers。

注意事項：

- 將 provider selection、credential resolution 和 shared request semantics 保留在 core。
- 使用 web-search providers 處理 vendor-specific search transports。
- `api.runtime.webSearch.*` 是需要 search behavior、但不依賴 agent tool wrapper 的 feature/channel plugins 的偏好 shared surface。

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

- `generate(...)`：使用已設定的 image-generation provider chain 生成影像。
- `listProviders(...)`：列出可用的 image-generation providers 及其 capabilities。

## Gateway HTTP routes

Plugins 可以透過 `api.registerHttpRoute(...)` 公開 HTTP endpoints。

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

Route fields：

- `path`：Gateway HTTP server 下的 route path。
- `auth`：必填。使用 `"gateway"` 要求一般 Gateway auth，或使用 `"plugin"` 進行 plugin-managed auth/webhook verification。
- `match`：選填。`"exact"`（預設）或 `"prefix"`。
- `replaceExisting`：選填。允許同一個 plugin 取代自己的 existing route registration。
- `handler`：當 route 已處理 request 時回傳 `true`。

注意事項：

- `api.registerHttpHandler(...)` 已移除，會導致 Plugin 載入錯誤。請改用 `api.registerHttpRoute(...)`。
- Plugin 路由必須明確宣告 `auth`。
- 除非設定 `replaceExisting: true`，否則會拒絕完全相同的 `path + match` 衝突，而且一個 Plugin 不能取代另一個 Plugin 的路由。
- 會拒絕具有不同 `auth` 層級的重疊路由。請只在相同 auth 層級上保留 `exact`/`prefix` 後援鏈。
- `auth: "plugin"` 路由**不會**自動取得操作員執行階段範圍。它們是供 Plugin 管理的 Webhook/簽章驗證使用，而不是供具特權的 Gateway 輔助呼叫使用。
- `auth: "gateway"` 路由會在 Gateway 請求執行階段範圍內執行，但該範圍刻意保持保守：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）會將 Plugin 路由執行階段範圍固定為 `operator.write`，即使呼叫端傳送 `x-openclaw-scopes` 也是如此
  - 受信任且帶有身分的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在標頭明確存在時才會遵循 `x-openclaw-scopes`
  - 如果在這些帶有身分的 Plugin 路由請求上缺少 `x-openclaw-scopes`，執行階段範圍會退回到 `operator.write`
- 實務規則：不要假設 gateway-auth Plugin 路由是隱含的管理員介面。如果你的路由需要僅限管理員的行為，請要求帶有身分的 auth 模式，並記錄明確的 `x-openclaw-scopes` 標頭契約。

## Plugin SDK 匯入路徑

撰寫新的 Plugin 時，請使用較窄的 SDK 子路徑，而不是單體的 `openclaw/plugin-sdk` 根
barrel。核心子路徑：

| 子路徑                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 註冊基元                                   |
| `openclaw/plugin-sdk/channel-core`  | 頻道進入點/建置輔助工具                           |
| `openclaw/plugin-sdk/core`          | 泛用共享輔助工具與總括契約                        |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

頻道 Plugin 會從一系列較窄的接合面中選用 — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, 和 `channel-actions`。核准行為應整合到單一
`approvalCapability` 契約，而不是混用無關的 Plugin 欄位。請參閱
[頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。

執行階段與設定輔助工具位於相符且聚焦的 `*-runtime` 子路徑之下
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` 等）。請優先使用 `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, 和 `config-mutation`，
而不是寬泛的 `config-runtime` 相容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
和 `openclaw/plugin-sdk/infra-runtime` 是供較舊 Plugin 使用的已棄用相容性 shim。
新程式碼應改為匯入較窄的泛用基元。
</Info>

Repo 內部進入點（依每個內建 Plugin 套件根目錄）：

- `index.js` — 內建 Plugin 進入點
- `api.js` — 輔助工具/型別 barrel
- `runtime-api.js` — 僅限執行階段的 barrel
- `setup-entry.js` — 設定 Plugin 進入點

外部 Plugin 只應匯入 `openclaw/plugin-sdk/*` 子路徑。絕不要
從核心或另一個 Plugin 匯入另一個 Plugin 套件的 `src/*`。
由 facade 載入的進入點會在存在作用中執行階段設定快照時優先使用它，
然後再退回使用磁碟上解析後的設定檔。

`image-generation`, `media-understanding`,
和 `speech` 等能力專屬子路徑存在，是因為內建 Plugin 目前正在使用它們。它們並非
自動成為長期凍結的外部契約 — 依賴它們時，請查看相關的 SDK
參考頁面。

## 訊息工具 schema

Plugin 應自行擁有頻道專屬的 `describeMessageTool(...)` schema
貢獻，用於回應、已讀和投票等非訊息基元。
共享傳送呈現應使用泛用的 `MessagePresentation` 契約，
而不是供應商原生的按鈕、元件、區塊或卡片欄位。
請參閱[訊息呈現](/zh-TW/plugins/message-presentation)，了解契約、
後援規則、供應商對應，以及 Plugin 作者檢查清單。

具備傳送能力的 Plugin 會透過訊息能力宣告它們能呈現的內容：

- `presentation` 用於語意呈現區塊（`text`, `context`, `divider`, `buttons`, `select`）
- `delivery-pin` 用於置頂傳遞請求

核心會決定要以原生方式呈現該 presentation，或降級為文字。
不要從泛用訊息工具暴露供應商原生 UI 的逃逸出口。
供舊版原生 schema 使用的已棄用 SDK 輔助工具仍會為現有
第三方 Plugin 匯出，但新的 Plugin 不應使用它們。

## 頻道目標解析

頻道 Plugin 應自行擁有頻道專屬的目標語意。請讓共享的
外寄主機保持泛用，並使用訊息配接器介面處理供應商規則：

- `messaging.inferTargetChatType({ to })` 會在目錄查詢前，決定正規化後的目標
  應視為 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 會告訴核心，某個
  輸入是否應跳過目錄搜尋，直接進入類似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是當核心在正規化後或
  目錄未命中後需要最終由供應商擁有的解析時，使用的 Plugin 後援。
- `messaging.resolveOutboundSessionRoute(...)` 會在目標解析完成後，負責供應商專屬的工作階段
  路由建構。

建議拆分：

- 使用 `inferTargetChatType` 處理應在搜尋對等方/群組前發生的類別決策。
- 使用 `looksLikeId` 檢查「將此視為明確/原生目標 id」。
- 使用 `resolveTarget` 處理供應商專屬的正規化後援，而不是
  廣泛的目錄搜尋。
- 將 chat ids、thread ids、JIDs、handles 和 room
  ids 等供應商原生 id 保留在 `target` 值或供應商專屬參數中，而不是放在泛用 SDK
  欄位中。

## 設定支援的目錄

從設定衍生目錄項目的 Plugin，應將該邏輯保留在
Plugin 中，並重用
`openclaw/plugin-sdk/directory-runtime` 提供的共享輔助工具。

當頻道需要設定支援的對等方/群組時使用，例如：

- 由 allowlist 驅動的 DM 對等方
- 已設定的頻道/群組對應
- 帳號範圍的靜態目錄後援

`directory-runtime` 中的共享輔助工具只處理泛用操作：

- 查詢篩選
- 套用限制
- 去重/正規化輔助工具
- 建立 `ChannelDirectoryEntry[]`

頻道專屬的帳號檢查與 id 正規化應保留在
Plugin 實作中。

## 供應商 catalog

供應商 Plugin 可以使用
`registerProvider({ catalog: { run(...) { ... } } })` 定義推論用模型 catalog。

`catalog.run(...)` 會回傳與 OpenClaw 寫入
`models.providers` 相同的形狀：

- `{ provider }` 用於一個供應商項目
- `{ providers }` 用於多個供應商項目

當 Plugin 擁有供應商專屬模型 id、基底 URL
預設值，或受 auth 控制的模型中繼資料時，請使用 `catalog`。

`catalog.order` 控制 Plugin 的 catalog 相對於 OpenClaw
內建隱含供應商的合併時機：

- `simple`：普通 API-key 或 env 驅動的供應商
- `profile`：存在 auth profile 時出現的供應商
- `paired`：合成多個相關供應商項目的供應商
- `late`：最後一輪，在其他隱含供應商之後

鍵衝突時後面的供應商會勝出，因此 Plugin 可以刻意用相同供應商 id
覆寫內建供應商項目。

相容性：

- `discovery` 仍可作為舊版別名運作
- 如果同時註冊了 `catalog` 和 `discovery`，OpenClaw 會使用 `catalog`

## 唯讀頻道檢查

如果你的 Plugin 註冊了頻道，請優先在 `resolveAccount(...)` 旁實作
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是執行階段路徑。它可以假設憑證
  已完整具體化，並在缺少必要 secret 時快速失敗。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor/config
  修復流程等唯讀命令路徑，不應只為了
  描述設定就需要具體化執行階段憑證。

建議的 `inspectAccount(...)` 行為：

- 只回傳描述性的帳號狀態。
- 保留 `enabled` 和 `configured`。
- 在相關時納入憑證來源/狀態欄位，例如：
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 你不需要只為了回報唯讀
  可用性就回傳原始 token 值。對於狀態類命令，回傳 `tokenStatus: "available"`（以及相符的來源
  欄位）就足夠了。
- 當憑證透過 SecretRef 設定，但在目前命令路徑中
  不可用時，請使用 `configured_unavailable`。

這讓唯讀命令可以回報「已設定但在此命令
路徑中不可用」，而不是當機或誤報帳號未設定。

## 套件包

Plugin 目錄可以包含一個帶有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每個項目都會成為一個 Plugin。如果套件包列出多個 extensions，Plugin id
會變成 `name/<fileBase>`。

如果你的 Plugin 匯入 npm deps，請將它們安裝在該目錄中，讓
`node_modules` 可用（`npm install` / `pnpm install`）。

安全防護：每個 `openclaw.extensions` 項目在 symlink 解析後，都必須留在 Plugin
目錄內。逃出套件目錄的項目會被拒絕。

安全注意事項：`openclaw plugins install` 會使用
專案本機的 `npm install --omit=dev --ignore-scripts` 安裝 Plugin 相依性（無生命週期腳本、
執行階段無 dev 相依性），並忽略繼承的全域 npm 安裝設定。
請保持 Plugin 相依性樹為「pure JS/TS」，並避免需要
`postinstall` 建置的套件。

選用：`openclaw.setupEntry` 可以指向輕量的僅設定模組。
當 OpenClaw 需要停用頻道 Plugin 的設定介面，或
頻道 Plugin 已啟用但仍未設定時，它會載入 `setupEntry`
而不是完整 Plugin 進入點。當你的主要 Plugin 進入點也會接線工具、hook 或其他僅限執行階段的
程式碼時，這能讓啟動和設定更輕量。

選用：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以讓頻道 Plugin 在 gateway 的
pre-listen 啟動階段選擇使用相同的 `setupEntry` 路徑，即使該頻道已設定也是如此。

只有在 `setupEntry` 完全涵蓋 Gateway 開始監聽前必須存在的啟動介面時，才使用此選項。
實務上，這表示 setup entry 必須註冊每個啟動相依的頻道擁有能力，例如：

- 頻道註冊本身
- Gateway 開始監聽前必須可用的任何 HTTP 路由
- 在同一時間窗內必須存在的任何 gateway 方法、工具或服務

如果你的完整進入點仍擁有任何必要的啟動能力，請不要啟用
此旗標。請讓 Plugin 維持預設行為，並讓 OpenClaw 在
啟動期間載入完整進入點。

內建頻道也可以發布僅設定的契約介面輔助工具，讓核心
能在完整頻道執行階段載入前查詢。目前的設定
提升介面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core 會在需要將舊版單一帳戶頻道設定提升為 `channels.<id>.accounts.*`，且不載入完整 Plugin 進入點時使用該介面。Matrix 是目前的內建範例：當具名帳戶已存在時，它只會將驗證/啟動鍵移入具名提升帳戶，並且可保留已設定的非標準預設帳戶鍵，而不是一律建立 `accounts.default`。

這些設定修補配接器會讓內建合約介面探索保持延遲。匯入時間維持輕量；提升介面只會在首次使用時載入，而不是在模組匯入時重新進入內建頻道啟動流程。

當這些啟動介面包含 Gateway RPC 方法時，請將它們放在 Plugin 專屬前綴下。Core 管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）維持保留，且永遠解析為 `operator.admin`，即使 Plugin 要求較窄的範圍也一樣。

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

頻道 Plugin 可以透過 `openclaw.channel` 宣告設定/探索中繼資料，並透過 `openclaw.install` 宣告安裝提示。這會讓 Core 目錄不含資料。

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
- `preferOver`：此目錄項目應優先於其上的較低優先序 Plugin/頻道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選取介面的文案控制
- `markdownCapable`：將頻道標記為支援 Markdown，以供輸出格式決策使用
- `exposure.configured`：設為 `false` 時，將頻道從已設定頻道清單介面隱藏
- `exposure.setup`：設為 `false` 時，將頻道從互動式設定/配置選擇器隱藏
- `exposure.docs`：將頻道標記為文件導覽介面的內部/私有項目
- `showConfigured` / `showInSetup`：仍為相容性接受的舊版別名；偏好使用 `exposure`
- `quickstartAllowFrom`：讓頻道加入標準快速入門 `allowFrom` 流程
- `forceAccountBinding`：即使只有一個帳戶存在，也要求明確帳戶繫結
- `preferSessionLookupForAnnounceTarget`：解析公告目標時偏好工作階段查找

OpenClaw 也可以合併**外部頻道目錄**（例如 MPM 登錄匯出）。將 JSON 檔案放在下列其中一處：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或將 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一個或多個 JSON 檔案（以逗號/分號/`PATH` 分隔）。每個檔案應包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作為 `"entries"` 鍵的舊版別名。

產生的頻道目錄項目與 Provider 安裝目錄項目，會在原始 `openclaw.install` 區塊旁公開正規化的安裝來源事實。正規化事實會識別 npm 規格是精確版本還是浮動選取器、預期完整性中繼資料是否存在，以及本機來源路徑是否也可用。當目錄/套件身分已知時，如果解析後的 npm 套件名稱偏離該身分，正規化事實會發出警告。它們也會在 `defaultChoice` 無效或指向不可用來源時，以及 npm 完整性中繼資料存在但沒有有效 npm 來源時發出警告。消費者應將 `installSource` 視為加成的選用欄位，讓手動建立的項目與目錄銜接層不必合成它。這可讓導覽設定與診斷在不匯入 Plugin 執行階段的情況下說明來源平面狀態。

官方外部 npm 項目應偏好精確的 `npmSpec` 加上 `expectedIntegrity`。裸套件名稱與 dist-tags 仍可為相容性運作，但它們會顯示來源平面警告，讓目錄可朝向釘選且經完整性檢查的安裝前進，而不破壞既有 Plugin。當導覽設定從本機目錄路徑安裝時，它會記錄一個受管理的 Plugin 索引項目，其中包含 `source: "path"`，並在可能時使用工作區相對的 `sourcePath`。絕對作業載入路徑會保留在 `plugins.load.paths`；安裝記錄會避免將本機工作站路徑重複寫入長期設定。這讓本機開發安裝可供來源平面診斷檢視，而不增加第二個原始檔案系統路徑揭露介面。持久化的 `plugins/installs.json` Plugin 索引是安裝來源事實依據，並且可在不載入 Plugin 執行階段模組的情況下重新整理。即使 Plugin manifest 遺失或無效，其 `installRecords` 對應也會保持耐久；其 `plugins` 陣列則是可重建的 manifest 檢視。

## 情境引擎 Plugin

情境引擎 Plugin 擁有工作階段情境協調，負責擷取、組裝與 Compaction。使用 `api.registerContextEngine(id, factory)` 從你的 Plugin 註冊它們，然後用 `plugins.slots.contextEngine` 選取作用中的引擎。

當你的 Plugin 需要取代或擴充預設情境管線，而不只是加入記憶搜尋或 hook 時，請使用此功能。

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

Factory `ctx` 會公開選用的 `config`、`agentDir` 與 `workspaceDir` 值，用於建構期間初始化。

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

## 新增能力

當 Plugin 需要目前 API 無法涵蓋的行為時，不要以私有伸入方式繞過 Plugin 系統。請新增缺少的能力。

建議順序：

1. 定義 Core 合約
   決定 Core 應擁有哪些共享行為：政策、後援、設定合併、生命週期、面向頻道的語意，以及執行階段輔助工具形狀。
2. 新增型別化 Plugin 註冊/執行階段介面
   使用最小且有用的型別化能力介面擴充 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 串接 Core + 頻道/功能消費者
   頻道與功能 Plugin 應透過 Core 消費新能力，而不是直接匯入供應商實作。
4. 註冊供應商實作
   供應商 Plugin 接著針對能力註冊其後端。
5. 新增合約涵蓋
   加入測試，讓所有權與註冊形狀隨時間保持明確。

這就是 OpenClaw 如何維持有主見，而不硬編碼成單一 Provider 世界觀的方式。請參閱[能力食譜](/zh-TW/plugins/architecture)，取得具體檔案檢查清單與完整範例。

### 能力檢查清單

新增能力時，實作通常應一起觸及這些介面：

- `src/<capability>/types.ts` 中的 Core 合約型別
- `src/<capability>/runtime.ts` 中的 Core runner/執行階段輔助工具
- `src/plugins/types.ts` 中的 Plugin API 註冊介面
- `src/plugins/registry.ts` 中的 Plugin 登錄串接
- 當功能/頻道 Plugin 需要消費它時，`src/plugins/runtime/*` 中的 Plugin 執行階段公開
- `src/test-utils/plugin-registration.ts` 中的擷取/測試輔助工具
- `src/plugins/contracts/registry.ts` 中的所有權/合約斷言
- `docs/` 中的 operator/Plugin 文件

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

合約測試模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

這會讓規則保持簡單：

- Core 擁有能力合約 + 協調
- 供應商 Plugin 擁有供應商實作
- 功能/頻道 Plugin 消費執行階段輔助工具
- 合約測試讓所有權保持明確

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 公開能力模型與形狀
- [Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
