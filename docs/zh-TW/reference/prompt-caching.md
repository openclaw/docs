---
read_when:
    - 你想透過保留快取來降低提示詞 token 成本
    - 你需要在多代理設定中具備個別代理快取行為
    - 你正在同時調校心跳偵測與 cache-ttl 清理
summary: 提示快取調整項、合併順序、提供者行為與調校模式
title: 提示快取
x-i18n:
    generated_at: "2026-07-05T11:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示快取讓模型供應商能在多輪對話中重用未變更的提示前綴（system/developer 指令、工具定義、其他穩定脈絡），而不是每次請求都重新處理。這能降低長時間工作階段中重複脈絡的 token 成本與延遲。

只要上游 API 暴露相關計數器，OpenClaw 就會將供應商用量正規化為 `cacheRead` 與 `cacheWrite`。當即時工作階段快照缺少快取計數器時，用量摘要（`/status` 及類似項目）會回退使用最後一筆 transcript 用量項目；非零的即時值一律優先於回退值。

供應商參考資料：

- [Anthropic 提示快取](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 提示快取](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要旋鈕

### `cacheRetention`

值：`"none" | "short" | "long"`。可設定為全域預設值、每個模型，以及每個 agent。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overrides the global default for this model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overrides both defaults for this agent
```

合併順序（後者優先）：

1. `agents.defaults.params` - 所有模型的全域預設值
2. `agents.defaults.models["provider/model"].params` - 每個模型的覆寫
3. `agents.list[].params` - 每個 agent 的覆寫，依 agent id 比對

來源：`src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

在快取 TTL 視窗經過後修剪舊的工具結果脈絡，讓閒置後的請求不會重新快取過大的歷史內容。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行為請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 心跳偵測保溫

心跳偵測可以維持快取視窗溫熱，並減少閒置間隔後重複的快取寫入。可全域設定（`agents.defaults.heartbeat`）或按 agent 設定（`agents.list[].heartbeat`）。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 供應商行為

### Anthropic（直接 API 與 Vertex AI）

- `cacheRetention` 支援 `anthropic` 與 `anthropic-vertex` 供應商，也支援 `amazon-bedrock` 上的 Claude 模型，以及在明確設定 `cacheRetention` 時支援自訂 `anthropic-messages` 相容端點。
- 未設定時，OpenClaw 會為直接 Anthropic（僅 `anthropic` 與 `anthropic-vertex` 供應商；其他 Anthropic 系列路由需要明確值）種下 `cacheRetention: "short"`。
- 原生 Anthropic Messages 回應會暴露 `cache_read_input_tokens` 與 `cache_creation_input_tokens`，並映射到 `cacheRead` 與 `cacheWrite`。
- `cacheRetention: "short"` 映射到預設的 5 分鐘暫時快取。明確設定時，`cacheRetention: "long"` 會請求 1 小時 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）。隱含/環境驅動的長保留（`OPENCLAW_CACHE_RETENTION=long` 且沒有明確 `cacheRetention`）只會在 `api.anthropic.com` 或 Vertex AI（`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`）主機上升級到 1 小時 TTL；其他主機維持 5 分鐘快取。

來源：`src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- 在支援的近期模型上，提示快取是自動的；OpenClaw 不會注入區塊層級快取標記。
- OpenClaw 會傳送 `prompt_cache_key`，讓多輪對話中的快取路由保持穩定。直接 `api.openai.com` 主機會自動取得此欄位。OpenAI 相容代理（oMLX、llama.cpp、自訂端點）需要在模型設定中加入 `compat.supportsPromptCacheKey: true` 才能選用；代理永遠不會自動偵測。
- 只有在選取 `cacheRetention: "long"`，且解析後端點同時支援快取鍵與長保留（`compat.supportsLongCacheRetention`，預設為 true；Together AI 與 Cloudflare 相容設定檔會停用）時，才會加入 `prompt_cache_retention: "24h"`。`cacheRetention: "none"` 會抑制兩個欄位。
- 快取命中會透過 `usage.prompt_tokens_details.cached_tokens`（Chat Completions）或 `input_tokens_details.cached_tokens`（Responses API）呈現，並映射到 `cacheRead`。
- Responses API payload 也可以暴露 `input_tokens_details.cache_write_tokens`，映射到 `cacheWrite`，並依模型的快取寫入費率計價；省略該欄位的 Responses payload 會讓 `cacheWrite` 保持為 `0`。OpenAI 的 Chat Completions API 未記載也不發出 `cache_write_tokens` 計數器，但 OpenClaw 仍會在那裡讀取 `prompt_tokens_details.cache_write_tokens`，供回報獨立寫入計數的 OpenRouter 相容與 DeepSeek 風格代理使用。
- 實務上，OpenAI 更像初始前綴快取，而不是 Anthropic 的移動式完整歷史重用；請見下方 [OpenAI 即時預期](#openai-live-expectations)。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`，加上 AWS system inference profile 前綴 `us.`/`eu.`/`global.anthropic.claude*`）支援明確的 `cacheRetention` 透傳。
- 非 Anthropic Bedrock 模型（例如 `amazon.nova-*`）在執行階段會解析為無快取保留，不論設定了任何 `cacheRetention` 值。
- 不透明的 Bedrock application inference profile ARN（不包含 `claude` 的 profile ID）也會解析為無快取保留，除非明確設定 `cacheRetention`，因為無法僅從 ARN 推斷模型系列。

### OpenRouter

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在 system/developer 提示區塊上注入 Anthropic `cache_control` 標記，但只有在請求仍指向已驗證的 OpenRouter 路由時才會如此（預設端點上的 `openrouter`，或任何解析到 `openrouter.ai` 的供應商/base URL）。將模型改指向任意 OpenAI 相容代理 URL 會停止此注入。

`contextPruning.mode: "cache-ttl"` 允許用於 `openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*` 與 `openrouter/zai/*` 模型參照，因為這些路由可處理供應商端提示快取，不需要 OpenClaw 注入的標記。

來源：`extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter 上的 DeepSeek 快取建構是盡力而為，可能需要數秒；立即跟進的請求仍可能顯示 `cached_tokens: 0`。請在短暫延遲後，用重複的相同前綴請求驗證，並使用 `usage.prompt_tokens_details.cached_tokens` 作為快取命中訊號。

### Google Gemini（直接 API）

- 直接 Gemini transport（`api: "google-generative-ai"`）會透過上游 `cachedContentTokenCount` 回報快取命中，並映射到 `cacheRead`。
- 符合資格的模型系列：`gemini-2.5*` 與 `gemini-3*`（排除該前綴比對以外的 Live/preview 變體，例如 `gemini-live-2.5-flash-preview`）。
- 在符合資格的模型上設定 `cacheRetention` 時，OpenClaw 會自動為 system prompt 建立、重用並重新整理 `cachedContents` 資源，不需要手動 cached-content handle。TTL 對 `cacheRetention: "short"` 為 `300s`，對 `"long"` 為 `3600s`。
- 你仍可透過 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有 Gemini cached-content handle；明確 handle 會完全略過自動快取管理路徑。
- 這與 Anthropic/OpenAI 的提示前綴快取不同：OpenClaw 會為 Gemini 管理供應商原生的 `cachedContents` 資源，而不是注入行內快取標記。

來源：`src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### 命令列介面 harness 供應商（Claude Code、Gemini 命令列介面）

發出 JSONL 用量事件的命令列介面後端（`jsonlDialect: "claude-stream-json"` 或 `"gemini-stream-json"`）會經過共用用量剖析器，該剖析器可辨識多種欄位名稱變體，包括映射到 `cacheRead` 的普通 `cached` 計數器。當命令列介面的 JSON payload 省略直接 input-token 欄位時，OpenClaw 會將其推導為 `input_tokens - cached`。這只是用量正規化，不會為這些命令列介面驅動模型建立 Anthropic/OpenAI 風格的提示快取標記。

來源：`src/agents/cli-output.ts`（`toCliUsage`）。

### 其他供應商

如果供應商不支援上述任何快取模式，`cacheRetention` 不會產生效果。

## System-prompt 快取邊界

OpenClaw 會在內部快取前綴邊界，將 system prompt 分割為**穩定前綴**與**易變後綴**。邊界以上的內容（工具定義、Skills 中繼資料、工作區檔案）會排序以在多輪對話中保持位元組完全相同。邊界以下的內容（例如 `HEARTBEAT.md`、執行階段時間戳記、其他每輪中繼資料）可以變更，而不會讓已快取前綴失效。

關鍵設計選擇：

- 穩定的工作區專案脈絡檔案會排在 `HEARTBEAT.md` 之前，因此心跳偵測變動不會破壞穩定前綴。
- 此邊界會套用到 Anthropic 系列、OpenAI 系列、Google 與命令列介面 transport shaping，因此所有受支援供應商都能受益於相同的前綴穩定性。
- Codex Responses 與 Anthropic Vertex 請求會透過邊界感知的快取 shaping 路由，使快取重用與供應商實際收到的內容保持一致。
- System-prompt fingerprint 會經過正規化（空白、行尾、hook 新增脈絡、執行階段能力排序），讓語意未變的提示在多輪對話中共用快取。

如果你在設定或工作區變更後看到非預期的 `cacheWrite` 激增，請檢查變更落在快取邊界以上或以下。將易變內容移到邊界以下（或使其穩定）通常可以解決問題。

## OpenClaw 快取穩定性防護

- 綁定的 MCP 工具目錄會在工具註冊前以確定性方式排序（依 server name，再依 tool name），因此 `listTools()` 順序變更不會擾動 tools block 並破壞提示快取前綴。
- 具有持久化 image blocks 的舊版工作階段會保留**最近 3 個已完成回合**完整不變（計算所有已完成回合，而不只是含 image 的回合）。較舊且已處理的 image blocks 會替換為文字標記，因此大量 image 的後續請求不會持續重新傳送龐大的陳舊 payload。

## 調校模式

### 混合流量（建議預設）

在你的主要 agent 上保留長生命週期基準線，並在突發型 notifier agents 上停用快取：

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
- 只對受益於溫熱快取的 agents，將心跳偵測維持在你的 TTL 以下。

## 即時迴歸測試

OpenClaw 會執行一個合併的即時快取迴歸 gate，涵蓋重複前綴、工具回合、image 回合、MCP 風格工具 transcript，以及 Anthropic 無快取 control。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下方式執行：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準線檔案會儲存最近觀察到的即時數字，以及測試檢查的供應商特定迴歸下限。每次執行都使用全新的每次執行工作階段 ID 與提示命名空間，因此先前的快取狀態不會污染目前樣本。Anthropic 與 OpenAI 使用不同的執行方式：Anthropic 下限未達是硬性迴歸（測試失敗），而 OpenAI 下限未達僅供觀察（記錄為警告，不會讓執行失敗）。它們不共用單一跨供應商閾值。

### Anthropic 即時預期

- 預期會透過 `cacheWrite` 進行明確的暖機寫入。
- 預期在重複回合中幾乎完整重用歷史，因為 Anthropic 的快取控制會在對話中推進快取中斷點。
- stable、tool、image 與 MCP-style 路徑的基準下限是嚴格的回歸閘門。

### OpenAI 即時預期

- 只預期 `cacheRead`；在 Chat Completions 上 `cacheWrite` 會維持 `0`。
- 將重複回合的快取重用視為供應商特定的平台期，而不是 Anthropic 風格的移動式完整歷史重用。
- 下限僅供觀察（一旦未命中會記錄為警告，而不是測試失敗），源自 `gpt-5.4-mini` 上觀察到的即時行為：

| 情境                 | `cacheRead` 下限 | 命中率下限 |
| -------------------- | ----------------: | -------------: |
| 穩定前綴             |             4,608 |           0.90 |
| 工具逐字稿           |             4,096 |           0.85 |
| 圖片逐字稿           |             3,840 |           0.82 |
| MCP-style 逐字稿     |             4,096 |           0.85 |

最近觀察到的基準數字（來自 `live-cache-regression-baseline.ts`）落在：穩定前綴 `cacheRead=4864`、命中率 `0.966`；工具逐字稿 `cacheRead=4608`、命中率 `0.896`；圖片逐字稿 `cacheRead=4864`、命中率 `0.954`；MCP-style 逐字稿 `cacheRead=4608`、命中率 `0.891`。

斷言不同的原因：Anthropic 會公開明確的快取中斷點與移動式對話歷史重用，而 OpenAI 在即時流量中的有效可重用前綴，可能會比完整提示更早進入平台期。用單一跨供應商百分比門檻比較兩個供應商會造成誤判回歸。

## `diagnostics.cacheTrace` 設定

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

| 鍵                | 預設值                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 環境變數切換（一次性偵錯）

| 變數                                 | 效果                                 |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | 啟用快取追蹤                         |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 覆寫輸出路徑                         |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 切換完整訊息酬載擷取                 |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 切換提示文字擷取                     |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 切換系統提示擷取                     |

### 要檢查什麼

- 快取追蹤事件是 JSONL，包含像 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 這類階段性快照。
- 每回合快取 token 影響可在一般使用介面中看到：`cacheRead` 和 `cacheWrite` 會出現在 `/usage tokens`、`/status`、工作階段使用量摘要，以及自訂 `messages.usageTemplate` 版面配置中。
- 對 Anthropic 而言，快取啟用時預期會同時看到 `cacheRead` 和 `cacheWrite`。
- 對 OpenAI 而言，快取命中時預期會看到 `cacheRead`；只有在包含 `cacheWrite` 的 Responses API 酬載上才會填入它（請參閱上方的 [OpenAI](#openai-direct-api)）。
- OpenAI 也會傳回追蹤與速率限制標頭，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`；可使用這些標頭進行請求追蹤，但快取命中計算仍應來自使用量酬載，而不是標頭。

## 快速疑難排解

- **多數回合都有高 `cacheWrite`**：檢查是否有易變的系統提示輸入；確認模型/供應商支援你的快取設定。
- **Anthropic 上有高 `cacheWrite`**：通常表示快取中斷點落在每次請求都會變動的內容上。
- **OpenAI `cacheRead` 偏低**：確認穩定前綴位於最前面、重複前綴至少有 1024 個 token，且應共享快取的回合重用了相同的 `prompt_cache_key`。
- **`cacheRetention` 沒有效果**：確認模型鍵符合 `agents.defaults.models["provider/model"]`。
- **帶有快取設定的 Bedrock Nova 請求**：這是預期行為，這些請求會在執行階段解析為無快取保留。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [Token 使用量與成本](/zh-TW/reference/token-use)
- [工作階段剪枝](/zh-TW/concepts/session-pruning)
- [閘道設定參考](/zh-TW/gateway/configuration-reference)

## 相關

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
