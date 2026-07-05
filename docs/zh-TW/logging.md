---
read_when:
    - 您需要一份適合初學者的 OpenClaw 日誌概覽
    - 你想設定日誌層級、格式或遮蔽處理
    - 你正在疑難排解，需要快速找到日誌
summary: 檔案記錄、主控台輸出、命令列介面追蹤，以及 Control UI 記錄分頁
title: 記錄
x-i18n:
    generated_at: "2026-07-05T11:31:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要的記錄表面：

- **檔案記錄**（JSON lines）由閘道寫入。
- 執行閘道的終端中的**主控台輸出**。

Control UI 的 **Logs** 分頁會追蹤 gateway 檔案記錄。本頁說明記錄的位置、如何閱讀記錄，以及如何設定記錄層級與格式。

## 記錄的位置

預設情況下，閘道每天會寫入一個輪替記錄檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主機的本地時區。當 `/tmp/openclaw` 不安全或無法使用時（Windows 上一律如此），OpenClaw 會改用 OS 暫存目錄下、使用者範圍的 `openclaw-<uid>` 目錄。帶日期的記錄檔會在 24 小時後修剪。

當下一次寫入會超過 `logging.maxFileBytes`（預設：100 MB）時，每個檔案會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並繼續寫入新的作用中記錄，而不是抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫路徑：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何閱讀記錄

### 命令列介面：即時追蹤（建議）

透過 RPC 追蹤 gateway 記錄檔：

```bash
openclaw logs --follow
```

選項：

| 旗標                | 預設值   | 行為                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | off      | 持續追蹤；中斷連線時以退避方式重新連線                                                |
| `--limit <n>`       | `200`    | 每次擷取的最大行數                                                                    |
| `--max-bytes <n>`   | `250000` | 每次擷取可讀取的最大位元組數                                                          |
| `--interval <ms>`   | `1000`   | 追蹤時的輪詢間隔                                                                      |
| `--json`            | off      | 以行分隔的 JSON（每行一個事件）                                                       |
| `--plain`           | off      | 在 TTY 工作階段強制使用純文字                                                         |
| `--no-color`        | —        | 停用 ANSI 色彩                                                                        |
| `--utc`             | off      | 以 UTC 呈現時間戳（預設為本地時間）                                                   |
| `--local-time`      | off      | 接受的本地時間預設相容拼法；除此之外沒有其他效果                                      |
| `--url` / `--token` | —        | 標準閘道 RPC 旗標                                                                     |
| `--timeout <ms>`    | `30000`  | 閘道 RPC 逾時                                                                         |
| `--expect-final`    | off      | Agent 支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）                         |

輸出模式：

- **TTY 工作階段**：美觀、彩色、結構化的記錄行。
- **非 TTY 工作階段**：純文字。

當你傳入明確的 `--url` 時，命令列介面不會自動套用設定或環境憑證；請自行包含 `--token`，否則呼叫會因 `gateway url override requires explicit credentials` 而失敗。

在 JSON 模式中，命令列介面會發出帶有 `type` 標記的物件：

- `meta`：串流中繼資料（file、source、sourceKind、service、cursor、size）
- `log`：已剖析的記錄項目
- `notice`：截斷 / 輪替提示
- `raw`：未剖析的記錄行
- `error`：gateway 連線失敗（寫入 stderr）

如果隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回到已設定的閘道檔案記錄。明確的 `--url` 目標不會使用此退回機制。`openclaw logs --follow` 更嚴格：在 Linux 上，它會在可用時依 PID 使用作用中的使用者 systemd 閘道 journal，否則會以退避方式重試即時閘道，而不是追蹤可能已過時的並列檔案。

如果無法連線到閘道，命令列介面會列印簡短提示，要求執行：

```bash
openclaw doctor
```

### Control UI（網頁）

Control UI 的 **Logs** 分頁使用 `logs.tail` 追蹤同一個檔案。
請參閱 [Control UI](/zh-TW/web/control-ui) 了解如何開啟。

### 僅限頻道的記錄

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 預設為 `all`；也可使用 `--lines <n>`（預設 200）與 `--json`。

## 記錄格式

### 檔案記錄（JSONL）

記錄檔中的每一行都是 JSON 物件。命令列介面與 Control UI 會剖析這些項目，以呈現結構化輸出（時間、層級、子系統、訊息）。

檔案記錄 JSONL 記錄在可用時也會包含可由機器篩選的最上層欄位：

- `hostname`：gateway 主機名稱。
- `message`：展平的記錄訊息文字，用於全文搜尋。
- `agent_id`：當記錄呼叫攜帶 agent 上下文時的作用中 agent id。
- `session_id`：當記錄呼叫攜帶工作階段上下文時的作用中工作階段 id/key。
- `channel`：當記錄呼叫攜帶頻道上下文時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始的結構化記錄引數，因此讀取編號 tslog 引數鍵的現有剖析器仍可運作。

Talk、即時語音與受管房間活動會透過同一個檔案記錄管線發出有界生命週期記錄。這些記錄在可用時包含事件類型、模式、傳輸、提供者，以及大小/時間測量，但會省略轉錄文字、音訊承載、turn id、call id 與提供者 item id。

### 主控台輸出

主控台記錄具備 **TTY 感知**，並格式化以提升可讀性：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 層級色彩（info/warn/error）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### 閘道 WebSocket 記錄

`openclaw gateway` 也有用於 RPC 流量的 WebSocket 通訊協定記錄：

- 一般模式：只記錄值得注意的結果（錯誤、剖析錯誤、慢速呼叫）
- `--verbose`：所有請求/回應流量
- `--ws-log auto|compact|full`：選擇詳細輸出的呈現樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定記錄

所有記錄設定都位於 `~/.openclaw/openclaw.json` 的 `logging` 之下。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 記錄層級

層級：`silent`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`。

- `logging.level`：**檔案記錄**（JSONL）層級（預設：`info`）。
- `logging.consoleLevel`：**主控台**詳細程度層級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以針對單次執行提高詳細程度，而不必編輯 `openclaw.json`。你也可以傳入全域命令列介面選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），這會針對該命令覆寫環境變數。

`--verbose` 只影響主控台輸出與 WS 記錄詳細程度；不會變更檔案記錄層級。

### 目標式模型傳輸診斷

偵錯提供者呼叫時，請使用目標式環境旗標，而不是將所有記錄提高到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用旗標：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 層級發出請求開始、fetch 回應、SDK 標頭、第一個串流事件、串流完成與傳輸錯誤。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型請求記錄中包含有界的請求承載摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在承載摘要中包含所有面向模型的工具名稱。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含已遮罩且有上限的 JSON 承載快照。僅在偵錯時使用；密鑰會被遮罩，但提示與訊息文字仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：發出首個事件與串流完成的時間資訊。
- `OPENCLAW_DEBUG_SSE=peek`：另外發出前五個已遮罩的 SSE 事件承載，並對每個事件設有上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：發出程式碼模式的模型表面診斷，包括當原生提供者工具因程式碼模式擁有工具表面而被隱藏時。

這些旗標會透過一般 OpenClaw 記錄輸出，因此 `openclaw logs --follow` 與 Control UI Logs 分頁都會顯示它們。若未使用這些旗標，相同診斷仍可在 `debug` 層級取得。

`[model-fetch]` 開始與回應中繼資料（提供者、API、模型、狀態、延遲，以及 method、URL、timeout、proxy、policy 等請求欄位）一律會以 `info` 層級發出，不受 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 影響，因此即使沒有偵錯旗標，也能看到基本的模型傳輸衛生狀態。

### 追蹤關聯

檔案記錄是 JSONL。當記錄呼叫攜帶有效的診斷追蹤上下文時，OpenClaw 會將追蹤欄位寫為最上層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部記錄處理器能將該行與 OTEL span 及提供者 `traceparent` 傳播關聯起來。

閘道 HTTP 請求與閘道 WebSocket frame 會建立內部請求追蹤範圍。在該非同步範圍內發出的記錄與診斷事件，若未傳入明確的追蹤上下文，會繼承請求追蹤。Agent 執行與模型呼叫追蹤會成為作用中請求追蹤的子項，因此本地記錄、診斷快照、OTEL span 與可信提供者 `traceparent` 標頭可以透過 `traceId` 串接，而無需記錄原始請求或模型內容。

當 OpenTelemetry 記錄匯出啟用時，Talk 生命週期記錄也會使用與檔案記錄相同的有界屬性流向 diagnostics-otel 記錄匯出。設定 `diagnostics.otel.logsExporter` 以選擇 OTLP、stdout JSONL，或兩個接收端。

### 模型呼叫大小與時間

模型呼叫診斷會記錄有界的請求/回應測量，而不擷取原始提示或回應內容：

- `requestPayloadBytes`：最終模型請求承載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應區塊承載的 UTF-8 位元組大小。高頻文字、思考與工具呼叫 delta 事件只計算增量 `delta` 位元組，而不是完整的 `partial` 快照。
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總持續時間

當診斷匯出啟用時，這些欄位可供診斷快照、模型呼叫外掛 hook，以及 OTEL 模型呼叫 span/metrics 使用。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：易讀、彩色，含時間戳。
- `compact`：更緊湊的輸出（最適合長時間工作階段）。
- `json`：每行 JSON（供記錄處理器使用）。

### 遮罩

OpenClaw 可以在敏感 token 進入主控台輸出、檔案記錄、OTLP 記錄、持久化的工作階段轉錄文字，或 Control UI 工具事件承載（工具啟動引數、部分/最終結果承載、衍生的 exec 輸出與 patch 摘要）前進行遮罩：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：regex 字串清單，會取代記錄/轉錄輸出的預設集合。對於 Control UI 工具承載，自訂模式會套用在內建預設之上，因此新增模式永遠不會削弱已被預設捕捉到的值之遮罩。

檔案記錄與工作階段轉錄會保持 JSONL，但相符的密鑰值會在該行或訊息寫入磁碟前被遮蔽。遮罩是盡力而為：它會套用於帶有文字的訊息內容與記錄字串，而不是每個識別碼或二進位承載欄位。

內建預設值涵蓋常見的 API 認證資料與付款認證欄位名稱，例如卡號、CVC/CVV、共用付款權杖，以及付款認證資料，當它們以 JSON 欄位、URL 參數、命令列介面旗標或指定值形式出現時皆適用。

`logging.redactSensitive: "off"` 只會停用這項一般的日誌/轉錄政策。OpenClaw 仍會遮蔽可顯示給 UI 用戶端、支援套件、診斷觀察者、核准提示或代理工具的安全邊界酬載。範例包括 Control UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、供應商錯誤觀察、exec 核准命令顯示，以及閘道 WebSocket 通訊協定日誌。自訂 `logging.redactPatterns` 仍可在這些介面上新增專案專屬模式。

## 診斷與 OpenTelemetry

診斷是用於模型執行與訊息流程遙測（網路鉤子、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代日誌 — 它們會提供給指標、追蹤與匯出器。事件預設會在處理程序內發出（設定 `diagnostics.enabled: false` 可關閉）；匯出事件則是另一回事。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤與日誌傳送到任何與 OpenTelemetry 相容的收集器或後端（Datadog、Grafana、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標/跨度名稱、環境變數與隱私模型都位於專用頁面：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 目標式偵錯日誌旗標，會將額外日誌路由至 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。請在 `diagnostics.flags` 下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要將 OTLP 匯出到收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線到閘道？** 請先執行 `openclaw doctor`。
- **日誌是空的？** 請確認閘道正在執行，且正在寫入 `logging.file` 中的檔案路徑。
- **需要更多細節？** 將 `logging.level` 設為 `debug` 或 `trace` 後重試。

## 相關

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標/跨度目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式偵錯日誌旗標
- [閘道日誌內部機制](/zh-TW/gateway/logging) — WS 日誌樣式、子系統前綴與主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
