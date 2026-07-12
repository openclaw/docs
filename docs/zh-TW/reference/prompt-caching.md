---
read_when:
    - 您希望透過保留快取來降低提示詞的權杖成本
    - 你需要多代理設定中的個別代理快取行為
    - 你正在同時調整心跳偵測與快取存留時間清理機制
summary: 提示快取調整選項、合併順序、供應商行為與調校模式
title: 提示詞快取
x-i18n:
    generated_at: "2026-07-11T21:45:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示快取可讓模型供應商在多個回合之間重複使用未變更的提示前綴（系統／開發者指示、工具定義及其他穩定內容），而無須在每次請求時重新處理。這可降低具有重複內容之長時間執行工作階段的權杖成本與延遲。

只要上游 API 提供相關計數器，OpenClaw 就會將供應商的用量正規化為 `cacheRead` 與 `cacheWrite`。當即時工作階段快照缺少快取計數器時，用量摘要（`/status` 及類似功能）會改用逐字記錄中最後一筆用量項目；若即時值非零，則一律優先於備援值。

供應商參考資料：

- [Anthropic 提示快取](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 提示快取](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要調整選項

### `cacheRetention`

值：`"none" | "short" | "long"`。可設定為全域預設值、各模型設定及各代理設定。

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
2. `agents.defaults.models["provider/model"].params` - 各模型的覆寫值
3. `agents.list[].params` - 依代理 ID 比對的各代理覆寫值

來源：`src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

快取 TTL 時間範圍經過後，修剪舊的工具結果內容，避免閒置後的請求再次快取過大的歷史記錄。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

如需完整行為說明，請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 心跳偵測保溫

心跳偵測可維持快取時間範圍的有效狀態，並減少閒置間隔後重複寫入快取。可進行全域設定（`agents.defaults.heartbeat`）或各代理設定（`agents.list[].heartbeat`）。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 供應商行為

### Anthropic（直接 API 與 Vertex AI）

- `anthropic` 與 `anthropic-vertex` 供應商支援 `cacheRetention`；若明確設定 `cacheRetention`，Amazon Bedrock 上的 Claude 模型及自訂 `anthropic-messages` 相容端點亦支援此設定。
- 若未設定，OpenClaw 會為直接 Anthropic 預先設定 `cacheRetention: "short"`（僅限 `anthropic` 與 `anthropic-vertex` 供應商；其他 Anthropic 系列路由需要明確值）。
- 原生 Anthropic Messages 回應會提供 `cache_read_input_tokens` 與 `cache_creation_input_tokens`，並分別對應至 `cacheRead` 與 `cacheWrite`。
- `cacheRetention: "short"` 對應至預設的 5 分鐘暫時性快取。明確設定 `cacheRetention: "long"` 時，會要求 1 小時 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）。隱含或由環境變數驅動的長期保留設定（`OPENCLAW_CACHE_RETENTION=long` 且未明確設定 `cacheRetention`），僅會在 `api.anthropic.com` 或 Vertex AI（`aiplatform.googleapis.com`／`*-aiplatform.googleapis.com`）主機上升級為 1 小時 TTL；其他主機仍使用 5 分鐘快取。

來源：`src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- 支援的近期模型會自動使用提示快取；OpenClaw 不會插入區塊層級的快取標記。
- OpenClaw 會傳送 `prompt_cache_key`，以維持多個回合之間的快取路由穩定。直接使用 `api.openai.com` 的主機會自動取得此設定。OpenAI 相容代理伺服器（oMLX、llama.cpp、自訂端點）需在模型設定中加入 `compat.supportsPromptCacheKey: true` 才會啟用；代理伺服器絕不會被自動偵測。
- 僅在選取 `cacheRetention: "long"`，且解析後的端點同時支援快取鍵與長期保留（`compat.supportsLongCacheRetention`，預設為 true；Together AI 與 Cloudflare 相容設定檔會停用）時，才會加入 `prompt_cache_retention: "24h"`。`cacheRetention: "none"` 會停用這兩個欄位。
- 快取命中會透過 `usage.prompt_tokens_details.cached_tokens`（Chat Completions）或 `input_tokens_details.cached_tokens`（Responses API）顯示，並對應至 `cacheRead`。
- Responses API 承載資料亦可提供 `input_tokens_details.cache_write_tokens`，此欄位會對應至 `cacheWrite`，並依模型的快取寫入費率計費；未包含此欄位的 Responses 承載資料會將 `cacheWrite` 維持為 `0`。OpenAI 的 Chat Completions API 並未記載或提供 `cache_write_tokens` 計數器，但 OpenClaw 仍會從中讀取 `prompt_tokens_details.cache_write_tokens`，以支援會回報獨立寫入計數的 OpenRouter 相容及 DeepSeek 類型代理伺服器。
- 實際上，OpenAI 的行為較接近初始前綴快取，而非 Anthropic 的移動式完整歷史記錄重複使用；請參閱下方的 [OpenAI 即時預期](#openai-live-expectations)。

### Amazon Bedrock

- Anthropic Claude 模型參照（`amazon-bedrock/*anthropic.claude*`，以及 AWS 系統推論設定檔前綴 `us.`／`eu.`／`global.anthropic.claude*`）支援明確傳遞 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型（例如 `amazon.nova-*`）無論設定任何 `cacheRetention` 值，執行階段都會解析為不保留快取。
- 不透明的 Bedrock 應用程式推論設定檔 ARN（不含 `claude` 的設定檔 ID）亦會解析為不保留快取，除非明確設定 `cacheRetention`，因為無法僅從 ARN 推斷模型系列。

### OpenRouter

對於 `openrouter/anthropic/*` 模型參照，OpenClaw 會在系統／開發者提示區塊中插入 Anthropic `cache_control` 標記，但僅限請求仍以經驗證的 OpenRouter 路由為目標時（使用預設端點的 `openrouter`，或任何解析至 `openrouter.ai` 的供應商／基礎 URL）。將模型重新指向任意 OpenAI 相容代理伺服器 URL 後，便會停止插入這些標記。

`openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*` 及 `openrouter/zai/*` 模型參照可使用 `contextPruning.mode: "cache-ttl"`，因為這些路由能處理供應商端提示快取，無須使用 OpenClaw 插入的標記。

來源：`extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

在 OpenRouter 上建構 DeepSeek 快取採盡力而為的方式，且可能需要數秒；緊接著發出的後續請求仍可能顯示 `cached_tokens: 0`。請短暫延遲後，以相同前綴重複提出請求進行驗證，並以 `usage.prompt_tokens_details.cached_tokens` 作為快取命中訊號。

### Google Gemini（直接 API）

- 直接 Gemini 傳輸（`api: "google-generative-ai"`）會透過上游的 `cachedContentTokenCount` 回報快取命中，並對應至 `cacheRead`。
- 符合資格的模型系列：`gemini-2.5*` 與 `gemini-3*`（不包括不符合該前綴的 Live／預覽變體，例如 `gemini-live-2.5-flash-preview`）。
- 在符合資格的模型上設定 `cacheRetention` 時，OpenClaw 會自動為系統提示建立、重複使用及重新整理 `cachedContents` 資源，不需要手動提供快取內容控制代碼。`cacheRetention: "short"` 的 TTL 為 `300s`，`"long"` 則為 `3600s`。
- 你仍可透過 `params.cachedContent`（或舊版 `params.cached_content`）傳入既有的 Gemini 快取內容控制代碼；明確提供控制代碼時，會完全略過自動快取管理路徑。
- 此機制與 Anthropic／OpenAI 提示前綴快取不同：OpenClaw 會為 Gemini 管理由供應商原生提供的 `cachedContents` 資源，而不是插入行內快取標記。

來源：`src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### 命令列介面框架供應商（Claude Code、Gemini CLI）

發出 JSONL 用量事件（`jsonlDialect: "claude-stream-json"` 或 `"gemini-stream-json"`）的命令列介面後端，會經過共用用量剖析器；該剖析器可辨識多種欄位名稱變體，包括對應至 `cacheRead` 的一般 `cached` 計數器。當命令列介面的 JSON 承載資料省略直接的輸入權杖欄位時，OpenClaw 會以 `input_tokens - cached` 推導其值。這僅是用量正規化，不會為這些由命令列介面驅動的模型建立 Anthropic／OpenAI 類型的提示快取標記。

來源：`src/agents/cli-output.ts`（`toCliUsage`）。

### 其他供應商

若供應商不支援上述任何快取模式，`cacheRetention` 不會產生任何效果。

## 系統提示快取邊界

OpenClaw 會在內部快取前綴邊界處，將系統提示分割為**穩定前綴**與**易變後綴**。邊界上方的內容（工具定義、Skills 中繼資料、工作區檔案）會經過排序，以便在多個回合之間維持位元組完全相同。邊界下方的內容（例如 `HEARTBEAT.md`、執行階段時間戳記及其他各回合中繼資料）則可變更，而不會使快取前綴失效。

主要設計選擇：

- 穩定的工作區專案內容檔案會排列在 `HEARTBEAT.md` 之前，避免心跳偵測變動破壞穩定前綴。
- 此邊界適用於 Anthropic 系列、OpenAI 系列、Google 及命令列介面傳輸的承載資料塑形，因此所有支援的供應商都能受益於相同的前綴穩定性。
- Codex Responses 與 Anthropic Vertex 請求會透過感知邊界的快取塑形進行路由，使快取重複使用與供應商實際收到的內容保持一致。
- 系統提示指紋會經過正規化（空白字元、行尾、鉤子新增的內容、執行階段能力排序），因此語意未變更的提示可在多個回合之間共用快取。

若你在設定或工作區變更後看到非預期的 `cacheWrite` 暴增，請檢查該變更位於快取邊界的上方或下方。將易變內容移至邊界下方（或使其穩定）通常可解決此問題。

## OpenClaw 快取穩定性防護

- 內建的 MCP 工具目錄會在工具註冊前進行確定性排序（先依伺服器名稱，再依工具名稱），因此 `listTools()` 順序變更不會反覆改動工具區塊並破壞提示快取前綴。
- 含有已保存圖片區塊的舊版工作階段，會完整保留**最近 3 個已完成回合**（計入所有已完成回合，而不僅是含圖片的回合）。更早且已處理的圖片區塊會被文字標記取代，避免圖片密集的後續請求持續重送龐大的過時承載資料。

## 調整模式

### 混合流量（建議預設值）

在主要代理上維持長期基準，並停用突發通知代理的快取：

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
- 僅針對能受益於熱快取的代理，將心跳偵測間隔設為低於 TTL。

## 即時迴歸測試

OpenClaw 會執行一個合併的即時快取迴歸閘門，涵蓋重複前綴、工具回合、圖片回合、MCP 類型工具逐字記錄，以及 Anthropic 無快取控制組。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令執行：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基準檔案會儲存最近一次觀察到的即時數值，以及測試用來檢查的各供應商迴歸下限。每次執行都會使用全新的個別執行工作階段 ID 與提示命名空間，避免先前的快取狀態污染目前樣本。Anthropic 與 OpenAI 採用不同的強制執行方式：Anthropic 未達下限會視為確定的迴歸（測試失敗），OpenAI 未達下限則僅進行監看（記錄為警告，但不會使執行失敗）。兩者不共用單一的跨供應商門檻。

### Anthropic 即時預期

- 預期透過 `cacheWrite` 執行明確的預熱寫入。
- 預期在重複回合中重用近乎完整的歷史記錄，因為 Anthropic 的快取控制會隨著對話推進快取中斷點。
- 穩定、工具、影像及 MCP 風格路徑的基準下限是嚴格的回歸門檻。

### OpenAI 即時環境預期

- 僅預期出現 `cacheRead`；在 Chat Completions 上，`cacheWrite` 維持為 `0`。
- 將重複回合的快取重用視為供應商特有的平臺期，而非 Anthropic 式移動的完整歷史記錄重用。
- 下限僅供監看（未達標會記錄為警告，而非測試失敗），並根據 `gpt-5.4-mini` 觀察到的即時行為推導而來：

| 情境             | `cacheRead` 下限 | 命中率下限 |
| ---------------- | ----------------: | ---------: |
| 穩定前綴         |             4,608 |       0.90 |
| 工具逐字記錄     |             4,096 |       0.85 |
| 影像逐字記錄     |             3,840 |       0.82 |
| MCP 風格逐字記錄 |             4,096 |       0.85 |

最近觀察到的基準數值（來自 `live-cache-regression-baseline.ts`）為：穩定前綴 `cacheRead=4864`、命中率 `0.966`；工具逐字記錄 `cacheRead=4608`、命中率 `0.896`；影像逐字記錄 `cacheRead=4864`、命中率 `0.954`；MCP 風格逐字記錄 `cacheRead=4608`、命中率 `0.891`。

斷言有所不同的原因：Anthropic 會公開明確的快取中斷點及隨對話移動的歷史記錄重用，而 OpenAI 在即時流量中的有效可重用前綴，可能在完整提示詞之前便進入平臺期。使用單一的跨供應商百分比門檻比較這兩家供應商，會產生誤判的回歸。

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

| 變數                                 | 效果                     |
| ------------------------------------ | ------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | 啟用快取追蹤             |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 覆寫輸出路徑             |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 切換完整訊息承載內容擷取 |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 切換提示詞文字擷取       |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 切換系統提示詞擷取       |

### 應檢查的內容

- 快取追蹤事件採用 JSONL 格式，包含 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分階段快照。
- 每回合快取權杖的影響可在一般用量介面中查看：`cacheRead` 和 `cacheWrite` 會顯示於 `/usage tokens`、`/status`、工作階段用量摘要，以及自訂 `messages.usageTemplate` 版面配置中。
- 對 Anthropic 而言，啟用快取時預期會同時出現 `cacheRead` 和 `cacheWrite`。
- 對 OpenAI 而言，快取命中時預期會出現 `cacheRead`；只有包含 `cacheWrite` 的 Responses API 承載內容才會填入該值（請參閱上方的 [OpenAI](#openai-direct-api)）。
- OpenAI 也會傳回追蹤及速率限制標頭，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`；請使用這些標頭追蹤請求，但快取命中統計仍應取自用量承載內容，而非標頭。

## 快速疑難排解

- **大多數回合的 `cacheWrite` 偏高**：檢查系統提示詞中是否有頻繁變動的輸入；確認模型／供應商支援你的快取設定。
- **Anthropic 的 `cacheWrite` 偏高**：通常表示快取中斷點落在每次請求都會變動的內容上。
- **OpenAI 的 `cacheRead` 偏低**：確認穩定前綴位於最前端、重複前綴至少有 1024 個權杖，且應共用快取的回合會重用相同的 `prompt_cache_key`。
- **`cacheRetention` 沒有效果**：確認模型鍵與 `agents.defaults.models["provider/model"]` 相符。
- **含快取設定的 Bedrock Nova 請求**：這是預期行為——這些請求在執行階段會解析為不保留快取。

相關文件：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖用量與成本](/zh-TW/reference/token-use)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [閘道設定參考](/zh-TW/gateway/configuration-reference)

## 相關內容

- [權杖用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
