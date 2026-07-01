---
read_when:
    - 你想透過快取保留來降低提示詞詞元成本
    - 你需要多代理設定中的每代理快取行為
    - 你正在一併調整心跳偵測與快取 TTL 修剪
summary: 提示快取調整項、合併順序、提供者行為與調校模式
title: 提示快取
x-i18n:
    generated_at: "2026-07-01T07:51:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示快取是指模型供應商可以跨回合重複使用未變更的提示前綴（通常是系統/開發者指示和其他穩定的上下文），而不是每次都重新處理它們。OpenClaw 會在上游 API 直接公開這些計數器時，將供應商用量正規化為 `cacheRead` 和 `cacheWrite`。

當即時工作階段快照缺少快取計數器時，狀態介面也可以從最近的逐字稿
用量記錄復原快取計數器，因此 `/status` 可以在部分工作階段中繼資料遺失後繼續
顯示快取列。既有的非零即時
快取值仍優先於逐字稿備援值。

這很重要的原因：較低的權杖成本、更快的回應，以及長時間執行工作階段中更可預測的效能。若沒有快取，即使大多數輸入沒有變更，重複提示也會在每個回合支付完整的提示成本。

以下章節涵蓋所有會影響提示重用與權杖成本的快取相關旋鈕。

供應商參考：

- Anthropic 提示快取：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示快取：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 標頭與請求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 請求 ID 與錯誤：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要旋鈕

### `cacheRetention`（全域預設、模型與個別代理）

將快取保留設定為所有模型的全域預設：

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

依模型覆寫：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

個別代理覆寫：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

設定合併順序：

1. `agents.defaults.params`（全域預設 — 套用至所有模型）
2. `agents.defaults.models["provider/model"].params`（依模型覆寫）
3. `agents.list[].params`（符合的代理 id；依鍵覆寫）

### `contextPruning.mode: "cache-ttl"`

在快取 TTL 視窗之後修剪舊的工具結果上下文，使閒置後的請求不會重新快取過大的歷史記錄。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行為請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 心跳偵測保溫

心跳偵測可以讓快取視窗保持溫熱，並減少閒置間隔後重複的快取寫入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

每個代理的心跳偵測支援於 `agents.list[].heartbeat`。

## 供應商行為

### Anthropic（直接 API）

- 支援 `cacheRetention`。
- 使用 Anthropic API 金鑰驗證設定檔時，若未設定，OpenClaw 會為 Anthropic 模型參照植入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 回應會公開 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以顯示 `cacheRead` 和 `cacheWrite`。
- 對於原生 Anthropic 請求，`cacheRetention: "short"` 會對應到預設的 5 分鐘暫時快取，而 `cacheRetention: "long"` 只會在直接 `api.anthropic.com` 主機上升級為 1 小時 TTL。

### OpenAI（直接 API）

- 支援的近期模型會自動進行提示快取。OpenClaw 不需要注入區塊層級的快取標記。
- OpenClaw 使用 `prompt_cache_key` 讓快取路由跨回合保持穩定。選取 `cacheRetention: "long"` 時，直接 OpenAI 主機會使用 `prompt_cache_retention: "24h"`。
- OpenAI 相容的 Completions 供應商只有在其模型設定明確設定 `compat.supportsPromptCacheKey: true` 時才會接收 `prompt_cache_key`。長保留轉送是一項獨立能力：明確的 `cacheRetention: "long"` 只有在該 compat 項目也支援長快取保留時，才會傳送 `prompt_cache_retention: "24h"`。Mistral 等供應商可以選擇加入快取鍵，同時設定 `compat.supportsLongCacheRetention: false` 以抑制長保留欄位。`cacheRetention: "none"` 會抑制兩個欄位。
- OpenAI 回應會透過 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）公開已快取的提示權杖。OpenClaw 會將其對應到 `cacheRead`。
- GPT-5.6 Responses 用量也可以公開 `input_tokens_details.cache_write_tokens`。OpenClaw 會將其對應到 `cacheWrite`，並以模型的快取寫入費率計價；省略該欄位的 Responses 會將 `cacheWrite` 保持為 `0`。
- OpenAI 會回傳實用的追蹤與速率限制標頭，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但快取命中計算應來自用量酬載，而不是標頭。
- 實務上，OpenAI 通常表現得像初始前綴快取，而不是 Anthropic 風格的移動式完整歷史重用。在目前的即時探測中，穩定長前綴文字回合可能落在接近 `4864` 已快取權杖的平台期，而工具密集或 MCP 風格的逐字稿即使在完全重複時，也常落在接近 `4608` 已快取權杖的平台期。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支援 `cacheRetention`，方式與直接 Anthropic 相同。
- `cacheRetention: "long"` 會對應到 Vertex AI 端點上真正的 1 小時提示快取 TTL。
- `anthropic-vertex` 的預設快取保留與直接 Anthropic 預設相同。
- Vertex 請求會透過邊界感知的快取塑形進行路由，讓快取重用與供應商實際接收的內容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`）支援明確的 `cacheRetention` 傳遞。
- 非 Anthropic Bedrock 模型會在執行階段被強制為 `cacheRetention: "none"`。

### OpenRouter 模型

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在系統/開發者提示區塊上注入 Anthropic
`cache_control`，以改善提示快取
重用，但僅限於請求仍指向已驗證的 OpenRouter 路由時
（其預設端點上的 `openrouter`，或任何解析
到 `openrouter.ai` 的供應商/base URL）。

對於 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*`
模型參照，允許 `contextPruning.mode: "cache-ttl"`，因為 OpenRouter
會自動處理供應商端提示快取。OpenClaw 不會將
Anthropic `cache_control` 標記注入那些請求。

DeepSeek 快取建構是盡力而為，可能需要幾秒鐘。立即
後續請求仍可能顯示 `cached_tokens: 0`；請在短暫延遲後以重複的
相同前綴請求驗證，並使用 `usage.prompt_tokens_details.cached_tokens`
作為快取命中訊號。

如果你將模型重新指向任意 OpenAI 相容的代理 URL，OpenClaw
會停止注入那些 OpenRouter 專屬的 Anthropic 快取標記。

### 其他供應商

如果供應商不支援此快取模式，`cacheRetention` 不會有任何效果。

### Google Gemini 直接 API

- 直接 Gemini 傳輸（`api: "google-generative-ai"`）會透過上游 `cachedContentTokenCount` 回報快取命中；OpenClaw 會將其對應到 `cacheRead`。
- 當直接 Gemini 模型上設定 `cacheRetention` 時，OpenClaw 會自動為 Google AI Studio 執行上的系統提示建立、重用並重新整理 `cachedContents` 資源。這表示你不再需要手動預先建立 cached-content 控制代碼。
- 你仍可以在已設定的模型上透過 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有的 Gemini cached-content 控制代碼。
- 這與 Anthropic/OpenAI 提示前綴快取不同。對 Gemini 而言，OpenClaw 管理的是供應商原生 `cachedContents` 資源，而不是將快取標記注入請求。

### Gemini 命令列介面用量

- Gemini 命令列介面 `stream-json` 輸出可以透過 `stats.cached` 顯示快取命中；
  OpenClaw 會將其對應到 `cacheRead`。舊版 `--output-format json` 覆寫使用
  相同的用量正規化。
- 如果命令列介面省略直接的 `stats.input` 值，OpenClaw 會從
  `stats.input_tokens - stats.cached` 推導輸入權杖。
- 這只是用量正規化。這不表示 OpenClaw 正在為 Gemini 命令列介面建立
  Anthropic/OpenAI 風格的提示快取標記。

## 系統提示快取邊界

OpenClaw 會將系統提示拆分為由內部快取前綴邊界分隔的**穩定前綴**與**易變
後綴**。邊界上方的內容（工具定義、Skills 中繼資料、工作區檔案，以及其他
相對靜態的上下文）會經過排序，使其跨回合保持位元組完全相同。
邊界下方的內容（例如 `HEARTBEAT.md`、執行階段時間戳記，以及
其他每回合中繼資料）可以變更，而不會使已快取的
前綴失效。

關鍵設計選擇：

- 穩定的工作區專案上下文檔案會排在 `HEARTBEAT.md` 之前，因此
  心跳偵測變動不會破壞穩定前綴。
- 該邊界會套用於 Anthropic 系列、OpenAI 系列、Google，以及
  命令列介面傳輸塑形，因此所有受支援的供應商都能受益於相同的前綴
  穩定性。
- Codex Responses 和 Anthropic Vertex 請求會透過
  邊界感知的快取塑形進行路由，讓快取重用與供應商
  實際接收的內容保持一致。
- 系統提示指紋會正規化（空白、行尾、
  hook 新增的上下文、執行階段能力排序），因此語意未變的
  提示會跨回合共用 KV/快取。

如果你在設定或工作區變更後看到非預期的 `cacheWrite` 尖峰，
請檢查變更落在快取邊界的上方還是下方。將
易變內容移到邊界下方（或讓它穩定）通常可以解決
問題。

## OpenClaw 快取穩定性防護

OpenClaw 也會在請求到達供應商之前，讓幾種對快取敏感的酬載形狀保持確定性：

- Bundle MCP 工具目錄會在工具
  註冊前以確定性方式排序，因此 `listTools()` 順序變更不會攪動工具區塊並
  破壞提示快取前綴。
- 具有持久化圖片區塊的舊版工作階段會保留**最近 3 個已完成
  回合**的完整內容；較舊、已處理的圖片區塊可被
  替換為標記，使圖片密集的後續請求不會持續重新傳送大型
  過期酬載。

## 調校模式

### 混合流量（建議預設）

在主要代理上保留長生命週期基準，並在爆發型通知代理上停用快取：

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 成本優先基準

- 將基準設定為 `cacheRetention: "short"`。
- 啟用 `contextPruning.mode: "cache-ttl"`。
- 只對受益於溫熱快取的代理，將心跳偵測保持低於你的 TTL。

## 快取診斷

OpenClaw 會為嵌入式代理執行公開專用的快取追蹤診斷。

對於一般面向使用者的診斷，當即時工作階段項目沒有那些計數器時，`/status` 和其他用量摘要可以使用
最新的逐字稿用量項目作為 `cacheRead` /
`cacheWrite` 的備援來源。

## 即時回歸測試

OpenClaw 保留一個合併的即時快取回歸閘門，涵蓋重複前綴、工具回合、圖片回合、MCP 風格工具逐字稿，以及 Anthropic 無快取控制組。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令執行狹窄的即時閘門：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準檔案會儲存最近一次觀察到的即時數據，以及測試所使用的供應商特定迴歸下限。
執行器也會使用每次執行全新的工作階段 ID 與提示命名空間，避免先前的快取狀態污染目前的迴歸樣本。

這些測試刻意不在不同供應商之間使用相同的成功標準。

### Anthropic 即時預期

- 預期透過 `cacheWrite` 進行明確的暖機寫入。
- 預期在重複回合中近乎完整地重用歷史，因為 Anthropic 快取控制會沿著對話推進快取斷點。
- 目前即時斷言仍對穩定、工具與影像路徑使用高命中率門檻。

### OpenAI 即時預期

- 只預期 `cacheRead`。`cacheWrite` 仍為 `0`。
- 將重複回合的快取重用視為供應商特定的平台期，而不是 Anthropic 風格的移動式完整歷史重用。
- 目前即時斷言使用由 `gpt-5.4-mini` 觀察到的即時行為推導出的保守下限檢查：
  - 穩定前綴：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 影像逐字稿：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 風格逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的全新合併即時驗證結果為：

- 穩定前綴：`cacheRead=4864`，命中率 `0.966`
- 工具逐字稿：`cacheRead=4608`，命中率 `0.896`
- 影像逐字稿：`cacheRead=4864`，命中率 `0.954`
- MCP 風格逐字稿：`cacheRead=4608`，命中率 `0.891`

最近合併閘門在本機的實際耗時約為 `88s`。

斷言不同的原因：

- Anthropic 暴露明確的快取斷點，以及移動式的對話歷史重用。
- OpenAI 提示快取仍對精確前綴敏感，但在即時 Responses 流量中，有效可重用前綴可能比完整提示更早進入平台期。
- 因此，用單一跨供應商百分比門檻比較 Anthropic 與 OpenAI 會造成誤判迴歸。

### `diagnostics.cacheTrace` 設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

預設值：

- `filePath`：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`：`true`
- `includePrompt`：`true`
- `includeSystem`：`true`

### 環境切換（一次性偵錯）

- `OPENCLAW_CACHE_TRACE=1` 啟用快取追蹤。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 覆寫輸出路徑。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切換完整訊息承載內容擷取。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切換提示文字擷取。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切換系統提示擷取。

### 要檢查的內容

- 快取追蹤事件是 JSONL，並包含像 `session:loaded`、`prompt:before`、`stream:context` 與 `session:after` 這類階段性快照。
- 每回合快取權杖影響可透過一般使用量介面中的 `cacheRead` 與 `cacheWrite` 查看（例如 `/usage full` 與工作階段使用量摘要）。
- 對 Anthropic 而言，啟用快取時應預期同時出現 `cacheRead` 與 `cacheWrite`。
- 對 OpenAI 而言，快取命中時應預期出現 `cacheRead`。GPT-5.6 Responses 在寫入提示片段時也可能回報 `cacheWrite`；其他省略寫入計數器的 Responses 承載內容會將其保持為 `0`。
- 如果你需要請求追蹤，請將請求 ID 與速率限制標頭和快取指標分開記錄。OpenClaw 目前的快取追蹤輸出著重於提示/工作階段形狀與正規化權杖使用量，而不是原始供應商回應標頭。

## 快速疑難排解

- 多數回合出現高 `cacheWrite`：檢查是否有易變的系統提示輸入，並確認模型/供應商支援你的快取設定。
- Anthropic 出現高 `cacheWrite`：通常表示快取斷點落在每次請求都會變更的內容上。
- OpenAI `cacheRead` 偏低：確認穩定前綴位於最前面、重複前綴至少有 1024 個權杖，且應共享快取的回合重用了相同的 `prompt_cache_key`。
- `cacheRetention` 沒有效果：確認模型鍵符合 `agents.defaults.models["provider/model"]`。
- 含快取設定的 Bedrock Nova/Mistral 請求：預期執行階段會強制設為 `none`。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖使用量與費用](/zh-TW/reference/token-use)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [閘道設定參考](/zh-TW/gateway/configuration-reference)

## 相關

- [權杖使用量與費用](/zh-TW/reference/token-use)
- [API 使用量與費用](/zh-TW/reference/api-usage-costs)
