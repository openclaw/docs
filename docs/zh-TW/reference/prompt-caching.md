---
read_when:
    - 你想透過快取保留來降低提示詞權杖成本
    - 你需要多代理設定中的每個代理快取行為
    - 你正在一起調整心跳偵測與 cache-ttl 清理
summary: 提示快取調整選項、合併順序、供應商行為與調校模式
title: 提示快取
x-i18n:
    generated_at: "2026-06-27T19:59:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示快取表示模型提供者可以跨回合重用未變更的提示前綴（通常是 system/developer 指示與其他穩定脈絡），而不是每次都重新處理。當上游 API 直接公開這些計數器時，OpenClaw 會將提供者使用量正規化為 `cacheRead` 與 `cacheWrite`。

當即時工作階段快照缺少快取計數器時，狀態介面也可以從最近的轉錄使用量記錄中復原快取計數器，因此 `/status` 可以在部分工作階段中繼資料遺失後，繼續顯示快取列。現有的非零即時快取值仍優先於轉錄備援值。

這很重要的原因：降低 token 成本、加快回應速度，並讓長時間執行的工作階段有更可預測的效能。沒有快取時，即使大部分輸入沒有變更，重複提示也會在每一回合支付完整提示成本。

以下章節涵蓋所有會影響提示重用與 token 成本的快取相關旋鈕。

提供者參考：

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
3. `agents.list[].params`（相符的代理 ID；依鍵覆寫）

### `contextPruning.mode: "cache-ttl"`

在快取 TTL 視窗後剪除舊的工具結果脈絡，讓閒置後的請求不會重新快取過大的歷史記錄。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行為請參閱 [工作階段剪除](/zh-TW/concepts/session-pruning)。

### 心跳偵測保溫

心跳偵測可以讓快取視窗保持溫熱，並減少閒置間隔後的重複快取寫入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

每個代理的心跳偵測支援於 `agents.list[].heartbeat`。

## 提供者行為

### Anthropic（直接 API）

- 支援 `cacheRetention`。
- 使用 Anthropic API key 驗證設定檔時，若未設定，OpenClaw 會為 Anthropic 模型參照植入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 回應會公開 `cache_read_input_tokens` 與 `cache_creation_input_tokens`，因此 OpenClaw 可以顯示 `cacheRead` 與 `cacheWrite`。
- 對於原生 Anthropic 請求，`cacheRetention: "short"` 會對應到預設的 5 分鐘暫時快取，而 `cacheRetention: "long"` 只有在直接 `api.anthropic.com` 主機上才會升級到 1 小時 TTL。

### OpenAI（直接 API）

- 受支援的近期模型會自動使用提示快取。OpenClaw 不需要注入區塊層級的快取標記。
- OpenClaw 使用 `prompt_cache_key` 讓跨回合的快取路由保持穩定。選取 `cacheRetention: "long"` 時，直接 OpenAI 主機會使用 `prompt_cache_retention: "24h"`。
- OpenAI 相容的 Completions 提供者只有在其模型設定明確設定 `compat.supportsPromptCacheKey: true` 時，才會收到 `prompt_cache_key`。長保留轉送是獨立能力：明確的 `cacheRetention: "long"` 只有在該相容項目也支援長快取保留時，才會傳送 `prompt_cache_retention: "24h"`。Mistral 等提供者可以選擇加入快取鍵，同時設定 `compat.supportsLongCacheRetention: false` 以抑制長保留欄位。`cacheRetention: "none"` 會抑制兩個欄位。
- OpenAI 回應會透過 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）公開已快取提示 token。OpenClaw 會將其對應到 `cacheRead`。
- OpenAI 不會公開獨立的快取寫入 token 計數器，因此即使提供者正在預熱快取，OpenAI 路徑上的 `cacheWrite` 仍會維持 `0`。
- OpenAI 會回傳有用的追蹤與速率限制標頭，例如 `x-request-id`、`openai-processing-ms` 與 `x-ratelimit-*`，但快取命中計算應來自使用量酬載，而不是標頭。
- 實務上，OpenAI 通常表現得像初始前綴快取，而不是 Anthropic 風格的移動式完整歷史重用。在目前的即時探測中，穩定的長前綴文字回合可能落在接近 `4864` 個已快取 token 的平台值，而工具密集或 MCP 風格的轉錄即使完全重複，通常也會在接近 `4608` 個已快取 token 處達到平台值。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支援 `cacheRetention`，方式與直接 Anthropic 相同。
- `cacheRetention: "long"` 會在 Vertex AI 端點上對應到真正的 1 小時提示快取 TTL。
- `anthropic-vertex` 的預設快取保留與直接 Anthropic 預設相同。
- Vertex 請求會透過邊界感知快取塑形進行路由，因此快取重用會與提供者實際收到的內容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`）支援明確的 `cacheRetention` 直通。
- 非 Anthropic Bedrock 模型在執行階段會被強制設定為 `cacheRetention: "none"`。

### OpenRouter 模型

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在 system/developer 提示區塊上注入 Anthropic `cache_control`，以改善提示快取重用；但只有當請求仍指向已驗證的 OpenRouter 路由時才會這麼做（預設端點上的 `openrouter`，或任何解析到 `openrouter.ai` 的提供者/base URL）。

對於 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 與 `openrouter/zai/*` 模型參照，允許使用 `contextPruning.mode: "cache-ttl"`，因為 OpenRouter 會自動處理提供者端提示快取。OpenClaw 不會將 Anthropic `cache_control` 標記注入這些請求。

DeepSeek 快取建構是盡力而為，可能需要幾秒鐘。立即後續請求仍可能顯示 `cached_tokens: 0`；請在短暫延遲後，以重複的相同前綴請求驗證，並使用 `usage.prompt_tokens_details.cached_tokens` 作為快取命中訊號。

如果你將模型重新指向任意 OpenAI 相容代理 URL，OpenClaw 會停止注入這些 OpenRouter 專用的 Anthropic 快取標記。

### 其他提供者

如果提供者不支援此快取模式，`cacheRetention` 不會有任何效果。

### Google Gemini 直接 API

- 直接 Gemini 傳輸（`api: "google-generative-ai"`）會透過上游 `cachedContentTokenCount` 回報快取命中；OpenClaw 會將其對應到 `cacheRead`。
- 當直接 Gemini 模型上設定了 `cacheRetention` 時，OpenClaw 會自動為 Google AI Studio 執行中的系統提示建立、重用並重新整理 `cachedContents` 資源。這表示你不再需要手動預先建立 cached-content 控制代碼。
- 你仍然可以在已設定的模型上，透過 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有的 Gemini cached-content 控制代碼。
- 這與 Anthropic/OpenAI 的提示前綴快取不同。對於 Gemini，OpenClaw 管理的是提供者原生的 `cachedContents` 資源，而不是將快取標記注入請求。

### Gemini 命令列介面用法

- Gemini 命令列介面 `stream-json` 輸出可以透過 `stats.cached` 顯示快取命中；OpenClaw 會將其對應到 `cacheRead`。舊版 `--output-format json` 覆寫使用相同的使用量正規化。
- 如果命令列介面省略直接的 `stats.input` 值，OpenClaw 會從 `stats.input_tokens - stats.cached` 推導輸入 token。
- 這只是使用量正規化。不表示 OpenClaw 正在為 Gemini 命令列介面建立 Anthropic/OpenAI 風格的提示快取標記。

## 系統提示快取邊界

OpenClaw 會將系統提示分成由內部快取前綴邊界分隔的**穩定前綴**與**易變後綴**。邊界上方的內容（工具定義、Skills 中繼資料、工作區檔案與其他相對靜態的脈絡）會被排序，使其跨回合保持逐位元組相同。邊界下方的內容（例如 `HEARTBEAT.md`、執行階段時間戳與其他每回合中繼資料）可以變更，而不會使已快取前綴失效。

關鍵設計選擇：

- 穩定的工作區專案脈絡檔案會排序在 `HEARTBEAT.md` 之前，因此心跳偵測變動不會破壞穩定前綴。
- 邊界會套用到 Anthropic 系列、OpenAI 系列、Google 與命令列介面傳輸塑形，因此所有受支援的提供者都能受益於相同的前綴穩定性。
- Codex Responses 與 Anthropic Vertex 請求會透過邊界感知快取塑形進行路由，因此快取重用會與提供者實際收到的內容保持一致。
- 系統提示指紋會經過正規化（空白、換行符號、hook 新增的脈絡、執行階段能力排序），因此語意未變的提示可在跨回合共享 KV/快取。

如果你在設定或工作區變更後看到非預期的 `cacheWrite` 飆升，請檢查該變更落在快取邊界上方還是下方。將易變內容移到邊界下方（或使其穩定）通常可以解決問題。

## OpenClaw 快取穩定性防護

OpenClaw 也會在請求到達提供者之前，讓多個快取敏感的酬載形狀保持決定性：

- Bundle MCP 工具目錄會在工具註冊前以決定性方式排序，因此 `listTools()` 順序變更不會造成工具區塊變動，也不會破壞提示快取前綴。
- 具有持久化圖片區塊的舊版工作階段會保留**最近 3 個已完成回合**完整不變；較舊且已處理的圖片區塊可能會替換為標記，讓圖片密集的後續請求不會持續重新傳送大型過期酬載。

## 調校模式

### 混合流量（建議預設）

在主要代理上保留長時間存活的基準線，並在突發型通知代理上停用快取：

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

### 成本優先基準線

- 設定基準線 `cacheRetention: "short"`。
- 啟用 `contextPruning.mode: "cache-ttl"`。
- 只對會受益於溫熱快取的代理，將心跳偵測保持在 TTL 以下。

## 快取診斷

OpenClaw 會為嵌入式代理執行公開專用的快取追蹤診斷。

對於一般面向使用者的診斷，當即時工作階段項目沒有這些計數器時，`/status` 與其他使用量摘要可以使用最新的轉錄使用量項目，作為 `cacheRead` / `cacheWrite` 的備援來源。

## 即時迴歸測試

OpenClaw 保留一個合併的即時快取迴歸閘門，涵蓋重複前綴、工具回合、圖片回合、MCP 風格工具轉錄，以及 Anthropic 無快取控制組。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令執行狹窄的即時閘門：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準線檔案會儲存最近觀察到的即時數字，以及測試使用的提供者專用迴歸下限。
執行器也會使用每次執行的新工作階段 ID 與提示命名空間，避免先前的快取狀態污染目前的迴歸樣本。

這些測試刻意不在各提供者之間使用相同的成功標準。

### Anthropic 即時環境預期

- 預期會透過 `cacheWrite` 明確寫入暖機資料。
- 預期在重複回合中幾乎可重用完整歷史，因為 Anthropic 快取控制會隨著對話推進快取中斷點。
- 目前的即時環境斷言仍針對穩定、工具與影像路徑使用高命中率門檻。

### OpenAI 即時環境預期

- 只預期 `cacheRead`。`cacheWrite` 維持 `0`。
- 將重複回合的快取重用視為提供者特定的平台期，而不是 Anthropic 風格的移動式完整歷史重用。
- 目前的即時環境斷言使用從 `gpt-5.4-mini` 觀察到的即時行為所推導出的保守下限檢查：
  - 穩定前綴：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 影像逐字稿：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 風格逐字稿：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新合併即時驗證結果為：

- 穩定前綴：`cacheRead=4864`，命中率 `0.966`
- 工具逐字稿：`cacheRead=4608`，命中率 `0.896`
- 影像逐字稿：`cacheRead=4864`，命中率 `0.954`
- MCP 風格逐字稿：`cacheRead=4608`，命中率 `0.891`

合併閘門近期的本機實際耗時約為 `88s`。

斷言不同的原因：

- Anthropic 會公開明確的快取中斷點，以及移動式對話歷史重用。
- OpenAI 提示快取仍對精確前綴敏感，但在即時 Responses 流量中，實際可重用前綴可能比完整提示更早達到平台期。
- 因此，用單一跨提供者百分比門檻比較 Anthropic 與 OpenAI 會造成誤判的回歸。

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

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 環境切換（一次性偵錯）

- `OPENCLAW_CACHE_TRACE=1` 會啟用快取追蹤。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 會覆寫輸出路徑。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 會切換完整訊息承載內容擷取。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 會切換提示文字擷取。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 會切換系統提示擷取。

### 要檢查的內容

- 快取追蹤事件是 JSONL，並包含像 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 這類分階段快照。
- 每回合快取權杖影響可透過一般用量介面中的 `cacheRead` 和 `cacheWrite` 看到，例如 `/usage full` 和工作階段用量摘要。
- 對 Anthropic 而言，啟用快取時預期同時出現 `cacheRead` 和 `cacheWrite`。
- 對 OpenAI 而言，快取命中時預期出現 `cacheRead`，且 `cacheWrite` 維持 `0`；OpenAI 不會發布獨立的快取寫入權杖欄位。
- 如果需要請求追蹤，請將請求 ID 與速率限制標頭和快取指標分開記錄。OpenClaw 目前的快取追蹤輸出專注於提示/工作階段形狀與標準化權杖用量，而不是原始提供者回應標頭。

## 快速疑難排解

- 大多數回合的 `cacheWrite` 偏高：檢查是否有易變的系統提示輸入，並確認模型/提供者支援你的快取設定。
- Anthropic 上的 `cacheWrite` 偏高：通常表示快取中斷點落在每次請求都會變更的內容上。
- OpenAI `cacheRead` 偏低：確認穩定前綴位於最前方、重複前綴至少有 1024 個權杖，並且應共用快取的回合重用了相同的 `prompt_cache_key`。
- `cacheRetention` 沒有效果：確認模型鍵符合 `agents.defaults.models["provider/model"]`。
- 帶有快取設定的 Bedrock Nova/Mistral 請求：預期執行階段會強制設為 `none`。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖用量與成本](/zh-TW/reference/token-use)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [閘道設定參考](/zh-TW/gateway/configuration-reference)

## 相關

- [權杖用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
