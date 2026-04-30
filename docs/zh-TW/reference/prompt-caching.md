---
read_when:
    - 你想透過快取保留來降低提示詞的詞元成本
    - 在多代理設定中需要每個代理各自的快取行為
    - 你正在一併調整 Heartbeat 與 cache-ttl 清理
summary: 提示快取調整參數、合併順序、供應商行為與調校模式
title: 提示快取
x-i18n:
    generated_at: "2026-04-30T03:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示快取表示模型供應商可以在多輪對話中重複使用未變更的提示前綴（通常是系統/開發者指令和其他穩定脈絡），而不是每次都重新處理。OpenClaw 會在上游 API 直接公開這些計數器時，將供應商用量標準化為 `cacheRead` 和 `cacheWrite`。

當即時工作階段快照缺少快取計數器時，狀態介面也可以從最近的逐字稿用量記錄還原快取計數器，因此 `/status` 可以在部分工作階段中繼資料遺失後繼續顯示快取行。現有的非零即時快取值仍會優先於逐字稿後援值。

這很重要的原因：更低的權杖成本、更快的回應，以及長時間執行工作階段中更可預測的效能。沒有快取時，即使大部分輸入沒有變更，重複提示也會在每一輪支付完整的提示成本。

以下章節涵蓋所有會影響提示重複使用和權杖成本的快取相關旋鈕。

供應商參考：

- Anthropic 提示快取：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示快取：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 標頭與請求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 請求 ID 與錯誤：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要旋鈕

### `cacheRetention`（全域預設、模型與每個代理）

將快取保留設定為所有模型的全域預設：

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

針對每個模型覆寫：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

針對每個代理覆寫：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

設定合併順序：

1. `agents.defaults.params`（全域預設 — 套用到所有模型）
2. `agents.defaults.models["provider/model"].params`（每個模型覆寫）
3. `agents.list[].params`（符合的代理 ID；依鍵覆寫）

### `contextPruning.mode: "cache-ttl"`

在快取 TTL 視窗之後修剪舊的工具結果脈絡，讓閒置後的請求不會重新快取過大的歷史記錄。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行為請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### Heartbeat 保溫

Heartbeat 可以讓快取視窗保持溫熱，並減少閒置間隔後重複的快取寫入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

每個代理的 Heartbeat 支援於 `agents.list[].heartbeat`。

## 供應商行為

### Anthropic（直接 API）

- 支援 `cacheRetention`。
- 使用 Anthropic API 金鑰驗證設定檔時，OpenClaw 會在未設定時，為 Anthropic 模型參照植入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 回應會公開 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以顯示 `cacheRead` 和 `cacheWrite`。
- 對於原生 Anthropic 請求，`cacheRetention: "short"` 對應到預設的 5 分鐘暫時性快取，而 `cacheRetention: "long"` 只會在直接 `api.anthropic.com` 主機上升級為 1 小時 TTL。

### OpenAI（直接 API）

- 受支援的新近模型會自動進行提示快取。OpenClaw 不需要注入區塊層級的快取標記。
- OpenClaw 使用 `prompt_cache_key` 讓快取路由在多輪對話中保持穩定，且只有在直接 OpenAI 主機上選取 `cacheRetention: "long"` 時才使用 `prompt_cache_retention: "24h"`。
- OpenAI 相容的 Completions 供應商只有在其模型設定明確設定 `compat.supportsPromptCacheKey: true` 時才會收到 `prompt_cache_key`；`cacheRetention: "none"` 仍會抑制它。
- OpenAI 回應會透過 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）公開已快取的提示權杖。OpenClaw 會將其對應到 `cacheRead`。
- OpenAI 不公開單獨的快取寫入權杖計數器，因此即使供應商正在暖機快取，OpenAI 路徑上的 `cacheWrite` 仍會保持 `0`。
- OpenAI 會回傳有用的追蹤與速率限制標頭，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但快取命中統計應來自用量酬載，而不是標頭。
- 實務上，OpenAI 通常表現得像初始前綴快取，而不是 Anthropic 風格的移動式完整歷史重複使用。在目前的即時探測中，穩定的長前綴文字輪次可以接近 `4864` 已快取權杖平台期，而大量工具或 MCP 風格的逐字稿即使完全重複，通常也會在約 `4608` 已快取權杖附近形成平台期。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支援與直接 Anthropic 相同的 `cacheRetention`。
- `cacheRetention: "long"` 會在 Vertex AI 端點上對應到真正的 1 小時提示快取 TTL。
- `anthropic-vertex` 的預設快取保留與直接 Anthropic 預設相同。
- Vertex 請求會透過邊界感知的快取塑形進行路由，因此快取重複使用會與供應商實際收到的內容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`）支援明確的 `cacheRetention` 傳遞。
- 非 Anthropic Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。

### OpenRouter 模型

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在系統/開發者提示區塊上注入 Anthropic `cache_control`，以改善提示快取重複使用；但只有在請求仍然鎖定已驗證的 OpenRouter 路由時才會這麼做（其預設端點上的 `openrouter`，或任何解析為 `openrouter.ai` 的供應商/base URL）。

對於 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*` 模型參照，允許使用 `contextPruning.mode: "cache-ttl"`，因為 OpenRouter 會自動處理供應商端提示快取。OpenClaw 不會將 Anthropic `cache_control` 標記注入這些請求。

DeepSeek 快取建構是盡力而為，可能需要幾秒鐘。立即跟進的請求仍可能顯示 `cached_tokens: 0`；請在短暫延遲後使用重複的相同前綴請求驗證，並使用 `usage.prompt_tokens_details.cached_tokens` 作為快取命中訊號。

如果你將模型重新指向任意 OpenAI 相容代理 URL，OpenClaw 會停止注入這些 OpenRouter 專用的 Anthropic 快取標記。

### 其他供應商

如果供應商不支援此快取模式，`cacheRetention` 不會有任何效果。

### Google Gemini 直接 API

- 直接 Gemini 傳輸（`api: "google-generative-ai"`）會透過上游 `cachedContentTokenCount` 回報快取命中；OpenClaw 會將其對應到 `cacheRead`。
- 當直接 Gemini 模型上設定 `cacheRetention` 時，OpenClaw 會在 Google AI Studio 執行中自動為系統提示建立、重複使用並重新整理 `cachedContents` 資源。這表示你不再需要手動預先建立 cached-content 控制代碼。
- 你仍然可以透過已設定模型上的 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有的 Gemini cached-content 控制代碼。
- 這與 Anthropic/OpenAI 提示前綴快取不同。對於 Gemini，OpenClaw 管理的是供應商原生的 `cachedContents` 資源，而不是將快取標記注入請求。

### Gemini CLI JSON 用量

- Gemini CLI JSON 輸出也可以透過 `stats.cached` 呈現快取命中；OpenClaw 會將其對應到 `cacheRead`。
- 如果 CLI 省略直接的 `stats.input` 值，OpenClaw 會從 `stats.input_tokens - stats.cached` 推導輸入權杖。
- 這只是用量標準化。這不表示 OpenClaw 正在為 Gemini CLI 建立 Anthropic/OpenAI 風格的提示快取標記。

## 系統提示快取邊界

OpenClaw 會將系統提示拆分為由內部快取前綴邊界分隔的**穩定前綴**與**易變後綴**。邊界上方的內容（工具定義、Skills 中繼資料、工作區檔案，以及其他相對靜態的脈絡）會被排序，使其在多輪對話中保持位元組完全相同。邊界下方的內容（例如 `HEARTBEAT.md`、執行階段時間戳，以及其他每輪中繼資料）可以變更，而不會使已快取前綴失效。

關鍵設計選擇：

- 穩定的工作區專案脈絡檔案會排在 `HEARTBEAT.md` 之前，因此 Heartbeat 變動不會破壞穩定前綴。
- 邊界會套用於 Anthropic 系列、OpenAI 系列、Google 和 CLI 傳輸塑形，因此所有受支援供應商都能受益於相同的前綴穩定性。
- Codex Responses 和 Anthropic Vertex 請求會透過邊界感知的快取塑形進行路由，因此快取重複使用會與供應商實際收到的內容保持一致。
- 系統提示指紋會被標準化（空白、行尾、hook 新增的脈絡、執行階段能力排序），因此語義上未變更的提示可在多輪對話中共用 KV/快取。

如果你在設定或工作區變更後看到非預期的 `cacheWrite` 尖峰，請檢查該變更落在快取邊界上方還是下方。將易變內容移到邊界下方（或使其穩定）通常可以解決此問題。

## OpenClaw 快取穩定性防護

OpenClaw 也會在請求到達供應商之前，讓多個快取敏感的酬載形狀保持決定性：

- Bundle MCP 工具目錄會在工具註冊前以決定性方式排序，因此 `listTools()` 順序變更不會造成工具區塊變動，也不會破壞提示快取前綴。
- 具有持久化影像區塊的舊版工作階段會保留**最近 3 個已完成輪次**完整不變；較舊且已處理的影像區塊可能會被標記取代，因此大量影像的跟進請求不會持續重新傳送大型陳舊酬載。

## 調校模式

### 混合流量（建議預設）

在主要代理上保留長生命週期基準，並在突發型通知代理上停用快取：

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

- 將基準 `cacheRetention: "short"`。
- 啟用 `contextPruning.mode: "cache-ttl"`。
- 只為會受益於溫熱快取的代理，將 Heartbeat 保持在你的 TTL 以下。

## 快取診斷

OpenClaw 會為嵌入式代理執行公開專用的快取追蹤診斷。

對於一般面向使用者的診斷，當即時工作階段項目沒有那些計數器時，`/status` 和其他用量摘要可以使用最新的逐字稿用量項目作為 `cacheRead` / `cacheWrite` 的後援來源。

## 即時回歸測試

OpenClaw 保留一個合併的即時快取回歸閘門，用於重複前綴、工具輪次、影像輪次、MCP 風格工具逐字稿，以及 Anthropic 無快取控制組。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下指令執行狹窄的即時閘門：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準檔案會儲存最近觀察到的即時數字，以及測試使用的供應商專用回歸下限。
執行器也會使用每次執行的新工作階段 ID 和提示命名空間，因此先前的快取狀態不會污染目前的回歸樣本。

這些測試刻意不在各供應商之間使用相同的成功標準。

### Anthropic 即時預期

- 預期透過 `cacheWrite` 進行明確的暖機寫入。
- 預期在重複輪次上接近完整歷史重複使用，因為 Anthropic 快取控制會在對話中推進快取中斷點。
- 目前的即時斷言仍會對穩定、工具和影像路徑使用高命中率門檻。

### OpenAI 即時預期

- 只預期 `cacheRead`。`cacheWrite` 會維持 `0`。
- 將重複回合的快取重用視為供應商特定的平台期，而不是 Anthropic 風格的移動式完整歷史重用。
- 目前的即時斷言使用從 `gpt-5.4-mini` 觀察到的即時行為所推導出的保守下限檢查：
  - 穩定前綴：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 圖片逐字稿：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 風格逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新合併即時驗證結果為：

- 穩定前綴：`cacheRead=4864`，命中率 `0.966`
- 工具逐字稿：`cacheRead=4608`，命中率 `0.896`
- 圖片逐字稿：`cacheRead=4864`，命中率 `0.954`
- MCP 風格逐字稿：`cacheRead=4608`，命中率 `0.891`

合併閘門最近的本機實際執行時間約為 `88s`。

斷言不同的原因：

- Anthropic 會公開明確的快取中斷點，以及移動式對話歷史重用。
- OpenAI 提示快取仍然對精確前綴敏感，但在即時 Responses 流量中，實際可重用前綴可能會比完整提示更早到達平台期。
- 因此，用單一跨供應商百分比門檻來比較 Anthropic 和 OpenAI，會造成誤判的迴歸。

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

### 環境變數切換（一次性偵錯）

- `OPENCLAW_CACHE_TRACE=1` 會啟用快取追蹤。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 會覆寫輸出路徑。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 會切換完整訊息負載擷取。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 會切換提示文字擷取。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 會切換系統提示擷取。

### 要檢查的內容

- 快取追蹤事件是 JSONL，並包含像 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 這類分階段快照。
- 每回合快取 token 影響可透過一般使用量介面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和工作階段使用量摘要）。
- 對於 Anthropic，快取作用中時會同時預期 `cacheRead` 和 `cacheWrite`。
- 對於 OpenAI，快取命中時會預期 `cacheRead`，且 `cacheWrite` 維持 `0`；OpenAI 不會發布單獨的快取寫入 token 欄位。
- 如果你需要請求追蹤，請將請求 ID 和速率限制標頭與快取指標分開記錄。OpenClaw 目前的快取追蹤輸出著重於提示/工作階段形狀和正規化的 token 使用量，而不是原始供應商回應標頭。

## 快速疑難排解

- 大多數回合的 `cacheWrite` 偏高：檢查是否有易變的系統提示輸入，並確認模型/供應商支援你的快取設定。
- Anthropic 上的 `cacheWrite` 偏高：通常表示快取中斷點落在每次請求都會變更的內容上。
- OpenAI `cacheRead` 偏低：確認穩定前綴位於最前方、重複前綴至少有 1024 個 token，且應共用快取的回合會重用相同的 `prompt_cache_key`。
- `cacheRetention` 沒有效果：確認模型鍵符合 `agents.defaults.models["provider/model"]`。
- 帶有快取設定的 Bedrock Nova/Mistral 請求：預期執行階段會強制為 `none`。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [Token 使用量與成本](/zh-TW/reference/token-use)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [Gateway 設定參考](/zh-TW/gateway/configuration-reference)

## 相關

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
