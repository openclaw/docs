---
read_when:
    - 你想透過快取保留來降低提示詞的權杖成本
    - 你需要在多代理設定中使用各代理獨立的快取行為
    - 你正在同時調整心跳偵測與快取存留時間清理機制
summary: 提示快取調整項目、合併順序、供應商行為與調校模式
title: 提示快取
x-i18n:
    generated_at: "2026-07-21T09:09:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9201ebc262f00311a512788e8aa2bf2091b6f31ad160b54925cceb2b74c7155
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示詞快取可讓模型供應商在不同輪次間重複使用未變更的提示詞前綴（系統／開發者指示、工具定義及其他穩定的上下文），而不必在每次請求時重新處理。對於上下文重複的長時間執行工作階段，這能降低權杖成本與延遲。

只要上游 API 有提供這些計數器，OpenClaw 就會將供應商用量正規化為 `cacheRead` 和 `cacheWrite`。當即時工作階段快照缺少快取計數器時，用量摘要（`/status` 及類似項目）會回退使用逐字稿中最後一筆用量項目；只要即時值非零，一律優先於回退值。

供應商參考資料：

- [Anthropic 提示詞快取](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 提示詞快取](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要調整項目

### `cacheRetention`

值：`"none" | "short" | "long"`。可設定為全域預設值、個別模型設定及個別代理設定。
`"standard"` 不是別名；若要使用供應商的預設快取時間範圍，請使用 `"short"`。無效值會被忽略並顯示警告。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # 覆寫此模型的全域預設值
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # 覆寫此代理的兩項預設值
```

合併順序（後者優先）：

1. `agents.defaults.params` - 所有模型的全域預設值
2. `agents.defaults.models["provider/model"].params` - 個別模型覆寫
3. `agents.list[].params` - 個別代理覆寫，依代理 ID 比對

來源：`src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

在快取 TTL 時間範圍經過後，修剪舊的工具結果上下文，讓閒置後的請求不會再次快取過大的歷史記錄。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行為請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 心跳偵測保溫

心跳偵測可讓快取時間範圍保持活躍，並減少閒置一段時間後重複寫入快取的情況。可進行全域設定（`agents.defaults.heartbeat`）或個別代理設定（`agents.list[].heartbeat`）。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 供應商行為

### Anthropic（直接 API 與 Vertex AI）

- `cacheRetention` 支援 `anthropic` 和 `anthropic-vertex` 供應商，也支援 `amazon-bedrock` 上的 Claude 模型，以及明確設定 `cacheRetention` 時的自訂 `anthropic-messages` 相容端點。
- 未設定時，OpenClaw 會為直接 Anthropic 植入 `cacheRetention: "short"`（僅限 `anthropic` 和 `anthropic-vertex` 供應商；其他 Anthropic 系列路由需要明確值）。
- 原生 Anthropic Messages 回應會提供 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，並分別對應至 `cacheRead` 和 `cacheWrite`。
- `cacheRetention: "short"` 對應至預設的 5 分鐘暫時性快取。明確設定 `cacheRetention: "long"` 時，會要求 1 小時 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）。隱含／由環境驅動的長時間保留（`OPENCLAW_CACHE_RETENTION=long`，且沒有明確的 `cacheRetention`）僅會在 `api.anthropic.com` 或 Vertex AI（`aiplatform.googleapis.com`／`*-aiplatform.googleapis.com`）主機上升級為 1 小時 TTL；其他主機會維持 5 分鐘快取。

來源：`packages/ai/src/transports/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- 支援的近期模型會自動使用提示詞快取；OpenClaw 不會插入區塊層級的快取標記。
- OpenClaw 會傳送 `prompt_cache_key`，讓各輪次間的快取路由保持穩定。直接 `api.openai.com` 主機會自動取得此設定。OpenAI 相容代理（oMLX、llama.cpp、自訂端點）需要在模型設定中加入 `compat.supportsPromptCacheKey: true` 才會啟用，此功能絕不會針對代理自動偵測。
- 只有在選取 `cacheRetention: "long"`，且解析後的端點同時支援快取金鑰和長時間保留（`compat.supportsLongCacheRetention`，預設為 true；Together AI 和 Cloudflare 相容設定檔會將其停用）時，才會加入 `prompt_cache_retention: "24h"`。`cacheRetention: "none"` 會抑制這兩個欄位。
- 快取命中會透過 `usage.prompt_tokens_details.cached_tokens`（Chat Completions）或 `input_tokens_details.cached_tokens`（Responses API）呈現，並對應至 `cacheRead`。
- Responses API 承載資料也可能提供 `input_tokens_details.cache_write_tokens`，其會對應至 `cacheWrite`，並按模型的快取寫入費率計價；若 Responses 承載資料省略此欄位，`cacheWrite` 會維持為 `0`。OpenAI 的 Chat Completions API 並未記載或提供 `cache_write_tokens` 計數器，但 OpenClaw 仍會在該處讀取 `prompt_tokens_details.cache_write_tokens`，以支援會回報獨立寫入計數的 OpenRouter 相容和 DeepSeek 類型代理。
- 實務上，OpenAI 的行為比較接近初始前綴快取，而非 Anthropic 的移動式完整歷史記錄重複使用；請參閱下方的 [OpenAI 即時預期](#openai-live-expectations)。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`，加上 AWS 系統推論設定檔前綴 `us.`／`eu.`／`global.anthropic.claude*`）支援明確傳遞 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型（例如 `amazon.nova-*`）在執行階段會解析為不保留快取，不受任何已設定的 `cacheRetention` 值影響。
- 不透明的 Bedrock 應用程式推論設定檔 ARN（設定檔 ID 不含 `claude`）也會解析為不保留快取，除非明確設定 `cacheRetention`，因為無法僅從 ARN 推斷模型系列。

### OpenRouter

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在系統／開發者提示詞區塊插入 Anthropic `cache_control` 標記，但僅限請求仍以經驗證的 OpenRouter 路由為目標時（預設端點上的 `openrouter`，或任何解析至 `openrouter.ai` 的供應商／基底 URL）。若將模型重新指向任意 OpenAI 相容代理 URL，便會停止插入此標記。

`contextPruning.mode: "cache-ttl"` 可用於 `openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*` 和 `openrouter/zai/*` 模型參照，因為這些路由可在供應商端處理提示詞快取，不需要 OpenClaw 插入標記。

來源：`extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter 上的 DeepSeek 快取建立採盡力而為方式，可能需要幾秒鐘；緊接著提出的後續請求仍可能顯示 `cached_tokens: 0`。請稍候片刻後以相同前綴重複請求，並使用 `usage.prompt_tokens_details.cached_tokens` 作為快取命中訊號進行驗證。

### Google Gemini（直接 API）

- 直接 Gemini 傳輸（`api: "google-generative-ai"`）會透過上游 `cachedContentTokenCount` 回報快取命中，並對應至 `cacheRead`。
- 符合資格的模型系列：`gemini-2.5*` 和 `gemini-3*`（不包含不符合該前綴比對的 Live／預覽變體，例如 `gemini-live-2.5-flash-preview`）。
- 在符合資格的模型上設定 `cacheRetention` 時，OpenClaw 會針對系統提示詞自動建立、重複使用及重新整理 `cachedContents` 資源，不需要手動提供快取內容控制代碼。`cacheRetention: "short"` 的 TTL 為 `300s`，而 `"long"` 的 TTL 為 `3600s`。
- 你仍可透過 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有的 Gemini 快取內容控制代碼；明確提供控制代碼會完全略過自動快取管理路徑。
- 此機制與 Anthropic／OpenAI 的提示詞前綴快取不同：OpenClaw 會為 Gemini 管理供應商原生的 `cachedContents` 資源，而不是插入行內快取標記。

來源：`src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### 命令列介面測試框架供應商（Claude Code、Gemini CLI）

會發出 JSONL 用量事件（`jsonlDialect: "claude-stream-json"` 或 `"gemini-stream-json"`）的命令列介面後端會經過共用的用量剖析器。該剖析器可辨識多種欄位名稱變體，包括對應至 `cacheRead` 的純 `cached` 計數器。當命令列介面的 JSON 承載資料省略直接輸入權杖欄位時，OpenClaw 會將其推導為 `input_tokens - cached`。這僅是用量正規化，不會為這些由命令列介面驅動的模型建立 Anthropic／OpenAI 類型的提示詞快取標記。

來源：`src/agents/cli-output.ts`（`toCliUsage`）。

### 其他供應商

如果供應商不支援上述任何快取模式，`cacheRetention` 不會產生作用。

## 系統提示詞快取邊界

OpenClaw 會在內部快取前綴邊界，將系統提示詞分割為**穩定前綴**與**易變後綴**。邊界上方的內容（工具定義、Skills 中繼資料、工作區檔案）會經過排序，以便在不同輪次間維持位元組完全相同。邊界下方的內容（例如 `HEARTBEAT.md`、執行階段時間戳記及其他個別輪次中繼資料）可以變更，而不會使快取前綴失效。

主要設計選擇：

- 穩定的工作區專案上下文檔案會排在 `HEARTBEAT.md` 之前，因此心跳偵測造成的變動不會破壞穩定前綴。
- 此邊界適用於 Anthropic 系列、OpenAI 系列、Google 及命令列介面傳輸的資料塑形，讓所有支援的供應商都能受益於相同的前綴穩定性。
- Codex Responses 和 Anthropic Vertex 請求會透過能感知邊界的快取資料塑形進行路由，讓快取重複使用與供應商實際收到的內容保持一致。
- 系統提示詞指紋會經過正規化（空白、行尾、掛鉤新增的上下文、執行階段能力順序），讓語意未變的提示詞可在各輪次間共用快取。

如果在設定或工作區變更後發現非預期的 `cacheWrite` 暴增，請檢查變更位於快取邊界上方或下方。將易變內容移至邊界下方（或使其穩定）通常即可解決問題。

## OpenClaw 快取穩定性防護

- 隨附的 MCP 工具目錄會在工具註冊前以確定性方式排序（先依伺服器名稱，再依工具名稱），因此 `listTools()` 順序變更不會反覆改動工具區塊並破壞提示詞快取前綴。
- 具有持久化圖片區塊的舊版工作階段會完整保留**最近 3 個已完成輪次**（計入所有已完成輪次，而非只計入包含圖片的輪次）。較舊且已處理的圖片區塊會替換為文字標記，讓含有大量圖片的後續請求不會持續重新傳送龐大的過時承載資料。

## 調校模式

### 混合流量（建議的預設值）

在主要代理上維持長效基準，並在突發型通知代理上停用快取：

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

- 設定基準 `cacheRetention: "short"`。
- 啟用 `contextPruning.mode: "cache-ttl"`。
- 僅針對可受益於暖快取的代理，將心跳偵測間隔維持在 TTL 以下。

## 即時迴歸測試

OpenClaw 會執行一個合併的即時快取迴歸閘門，涵蓋重複前綴、工具輪次、圖片輪次、MCP 類型的工具逐字稿，以及 Anthropic 無快取控制組。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下指令執行：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準檔案會儲存最近觀察到的即時數值，以及測試用來比對的供應商特定迴歸下限。每次執行都會使用全新的單次執行工作階段 ID 與提示命名空間，因此先前的快取狀態不會污染目前的樣本。Anthropic 與 OpenAI 採用不同的強制方式：Anthropic 未達下限屬於嚴重迴歸（測試失敗），而 OpenAI 未達下限則僅供監看（記錄為警告，不會導致執行失敗）。兩者不共用單一的跨供應商門檻。

### Anthropic 即時預期

- 預期透過 `cacheWrite` 明確寫入暖機資料。
- 預期重複回合可重複使用近乎完整的歷程記錄，因為 Anthropic 的快取控制會隨對話推進快取中斷點。
- 穩定、工具、圖片及 MCP 風格管道的基準下限是強制迴歸閘門。

### OpenAI 即時預期

- 僅預期 `cacheRead`；在 Chat Completions 上，`cacheWrite` 會維持為 `0`。
- 將重複回合的快取重複使用視為供應商特定的平台期，而不是 Anthropic 風格的移動式完整歷程記錄重複使用。
- 下限僅供監看（未達時記錄為警告，而不是測試失敗），並依據在 `gpt-5.4-mini` 上觀察到的即時行為得出：

| 情境                 | `cacheRead` 下限 | 命中率下限 |
| -------------------- | ----------------: | -------------: |
| 穩定前綴             |             4,608 |           0.90 |
| 工具逐字記錄         |             4,096 |           0.85 |
| 圖片逐字記錄         |             3,840 |           0.82 |
| MCP 風格逐字記錄     |             4,096 |           0.85 |

最近觀察到的基準數值（來自 `live-cache-regression-baseline.ts`）為：穩定前綴 `cacheRead=4864`，命中率 `0.966`；工具逐字記錄 `cacheRead=4608`，命中率 `0.896`；圖片逐字記錄 `cacheRead=4864`，命中率 `0.954`；MCP 風格逐字記錄 `cacheRead=4608`，命中率 `0.891`。

斷言不同的原因：Anthropic 會公開明確的快取中斷點，並可隨對話推進重複使用歷程記錄；而 OpenAI 在即時流量中的有效可重複使用前綴，可能在完整提示之前便達到平台期。使用單一跨供應商百分比門檻比較兩個供應商，會產生誤判的迴歸。

## `diagnostics.cacheTrace` 設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 選用
    includeMessages: false # 預設為 true
    includePrompt: false # 預設為 true
    includeSystem: false # 預設為 true
```

預設值：

| 鍵                | 預設值                                       |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 環境變數切換開關（單次偵錯）

| 變數                                 | 效果                                 |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | 啟用快取追蹤                         |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 覆寫輸出路徑                         |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 切換完整訊息承載資料擷取             |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 切換提示文字擷取                     |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 切換系統提示擷取                     |

### 檢查項目

- 快取追蹤事件採用 JSONL 格式，並包含如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分階段快照。
- 每回合的快取權杖影響可在一般用量介面中查看：`cacheRead` 和 `cacheWrite` 會顯示於 `/usage tokens`、`/status`、工作階段用量摘要及自訂 `messages.usageTemplate` 版面配置中。
- 對 Anthropic 而言，啟用快取時應同時出現 `cacheRead` 和 `cacheWrite`。
- 對 OpenAI 而言，快取命中時應出現 `cacheRead`；只有在 Responses API 承載資料包含 `cacheWrite` 時才會填入該值（請參閱上方的 [OpenAI](#openai-direct-api)）。
- OpenAI 也會傳回 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*` 等追蹤與速率限制標頭；請使用這些標頭追蹤請求，但快取命中統計仍應取自用量承載資料，而不是標頭。

## 快速疑難排解

- **大多數回合的 `cacheWrite` 偏高**：檢查系統提示中是否包含易變動的輸入；確認模型／供應商支援你的快取設定。
- **Anthropic 的 `cacheWrite` 偏高**：通常表示快取中斷點落在每次請求都會變更的內容上。
- **OpenAI 的 `cacheRead` 偏低**：確認穩定前綴位於最前面、重複前綴至少有 1024 個權杖，且應共用快取的回合會重複使用相同的 `prompt_cache_key`。
- **`cacheRetention` 未產生效果**：確認模型鍵符合 `agents.defaults.models["provider/model"]`。
- **含快取設定的 Bedrock Nova 請求**：這是預期行為——這些請求在執行階段會解析為不保留快取。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖用量與成本](/zh-TW/reference/token-use)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [閘道設定參考](/zh-TW/gateway/configuration-reference)

## 相關內容

- [權杖用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
