---
read_when:
    - 你需要一份適合初學者的 OpenClaw 記錄功能概覽
    - 你想要設定記錄層級、格式或遮蔽處理
    - 你正在進行疑難排解，需要快速找到日誌
summary: 檔案日誌、主控台輸出、命令列介面即時追蹤，以及控制介面的「Logs」分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-07-22T10:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 82f70237c58b993888c98ac6eb0e999e10b40fe09d2f2ce7edbcf21546ff376f
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要的日誌介面：

- **檔案日誌**（JSON 行），由閘道寫入。
- 執行閘道的終端機中的**主控台輸出**。

控制介面的**日誌**分頁會持續追蹤閘道檔案日誌。本頁說明日誌的
儲存位置、讀取方式，以及如何設定日誌層級與格式。

## 日誌的儲存位置

根據預設，閘道每天寫入一個滾動日誌檔案：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用閘道主機的本機時區。當 `/tmp/openclaw` 不安全
或無法使用時（Windows 一律如此），OpenClaw 會改用作業系統暫存目錄下、使用者範圍的
`openclaw-<uid>` 目錄。帶日期的日誌檔案會在 24 小時後
遭到清除。

當下一次寫入會超過 `logging.maxFileBytes`
（預設：100 MB）時，每個檔案都會輪替。OpenClaw 會在作用中檔案旁保留最多五個
編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並改為寫入新的
作用中日誌，而不會抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫路徑：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何讀取日誌

### 命令列介面：即時追蹤（建議）

透過 RPC 持續追蹤閘道日誌檔案：

```bash
openclaw logs --follow
```

選項：

| 旗標                | 預設值  | 行為                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 關閉      | 持續追蹤；中斷連線時會以退避方式重新連線                                   |
| `--limit <n>`       | `200`    | 每次擷取的行數上限                                                                   |
| `--max-bytes <n>`   | `250000` | 每次擷取的讀取位元組數上限                                                           |
| `--interval <ms>`   | `1000`   | 持續追蹤時的輪詢間隔                                                         |
| `--json`            | 關閉      | 以行分隔的 JSON（每行一個事件）                                              |
| `--plain`           | 關閉      | 在終端介面工作階段中強制使用純文字                                                      |
| `--no-color`        | —        | 停用 ANSI 色彩                                                                   |
| `--utc`             | 關閉      | 以 UTC 顯示時間戳記（預設為本機時間）                                      |
| `--local-time`      | 關閉      | 本機時間預設值可接受的相容拼法；除此之外沒有作用       |
| `--url` / `--token` | —        | 標準閘道 RPC 旗標                                                            |
| `--timeout <ms>`    | `30000`  | 閘道 RPC 逾時                                                                   |
| `--expect-final`    | 關閉      | 由代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受） |

輸出模式：

- **終端介面工作階段**：美化、彩色的結構化日誌行。
- **非終端介面工作階段**：純文字。

當你明確傳入 `--url` 時，命令列介面不會自動套用設定或
環境認證資訊；請自行加入 `--token`，否則呼叫會失敗並顯示
`gateway url override requires explicit credentials`。

在 JSON 模式中，命令列介面會發出帶有 `type` 標記的物件：

- `meta`：串流中繼資料（檔案、來源、來源種類、服務、游標、大小）
- `log`：已剖析的日誌項目
- `notice`：截斷／輪替提示
- `raw`：未剖析的日誌行
- `error`：閘道連線失敗（寫入 stderr）

如果隱含的本機回送閘道要求配對、在連線期間關閉，
或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動改用
已設定的閘道檔案日誌。明確的 `--url` 目標不會使用
此備援機制。`openclaw logs --follow` 更為嚴格：在 Linux 上，如果可以使用依 PID 識別的作用中
使用者 systemd 閘道日誌，便會使用該日誌；否則會以退避方式重試
即時閘道，而不會追蹤可能過時的並列
檔案。

如果無法連上閘道，命令列介面會顯示簡短提示，要求執行：

```bash
openclaw doctor
```

### 控制介面（網頁）

控制介面的**日誌**分頁使用 `logs.tail` 追蹤相同的檔案。
如需開啟方式，請參閱[控制介面](/zh-TW/web/control-ui)。

### 僅限頻道的日誌

若要篩選頻道活動（WhatsApp／Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 預設為 `all`；也可使用 `--lines <n>`（預設 200）和 `--json`。

## 日誌格式

### 檔案日誌（JSONL）

日誌檔案中的每一行都是一個 JSON 物件。命令列介面和控制介面會剖析這些
項目，以顯示結構化輸出（時間、層級、子系統、訊息）。

檔案日誌的 JSONL 記錄在可用時也會包含可供機器篩選的頂層欄位：

- `hostname`：閘道主機名稱。
- `message`：供全文搜尋使用的扁平化日誌訊息文字。
- `agent_id`：當日誌呼叫帶有代理內容時的作用中代理 ID。
- `session_id`：當日誌呼叫帶有工作階段內容時的作用中工作階段 ID／金鑰。
- `channel`：當日誌呼叫帶有頻道內容時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始的結構化日誌引數，
讓讀取編號 tslog 引數鍵的現有剖析器繼續運作。

通話、即時語音和受管理房間的活動會透過相同的檔案日誌流水線發出有界的生命週期日誌
記錄。這些記錄在可用時包含事件類型、
模式、傳輸方式、供應商，以及大小／時間測量值，但會省略
逐字稿文字、音訊承載資料、輪次 ID、通話 ID 和供應商項目 ID。

### 主控台輸出

主控台日誌會**感知終端介面**，並以易讀性為目標進行格式化：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 層級色彩（資訊／警告／錯誤）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### 閘道 WebSocket 日誌

`openclaw gateway` 也提供用於 RPC 流量的 WebSocket 通訊協定日誌：

- 一般模式：僅記錄值得注意的結果（錯誤、剖析錯誤、緩慢呼叫）
- `--verbose`：所有要求／回應流量
- `--ws-log auto|compact|full`：選擇詳細資訊的顯示樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定日誌記錄

所有日誌設定都位於 `~/.openclaw/openclaw.json` 中的 `logging` 下。

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

### 日誌層級

層級：`silent`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`。

- `logging.level`：**檔案日誌**（JSONL）層級（預設：`info`）。
- `logging.consoleLevel`：**主控台**詳細程度層級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數的優先順序高於設定檔，因此你可以在不編輯 `openclaw.json` 的情況下，提高單次執行的詳細程度。你也可以傳入全域命令列介面選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會針對該命令覆寫環境變數。

`--verbose` 只會影響主控台輸出和 WS 日誌的詳細程度；不會變更
檔案日誌層級。

### 針對性的模型傳輸診斷

偵錯供應商呼叫時，請使用針對性的環境旗標，而不要將
所有日誌提高至 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用旗標：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 層級發出要求開始、擷取回應、SDK
  標頭、第一個串流事件、串流完成和傳輸錯誤。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型要求日誌中包含有界的要求承載資料
  摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在承載資料摘要中包含所有面向模型的工具名稱。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含已遮蔽且有大小上限的 JSON
  承載資料快照。僅限偵錯時使用；密鑰會被遮蔽，但提示詞
  和訊息文字仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：發出第一個事件和串流完成的時間資訊。
- `OPENCLAW_DEBUG_SSE=peek`：也發出前五個已遮蔽的 SSE 事件
  承載資料，且每個事件都有大小上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：發出程式碼模式的模型介面診斷資訊，
  包括原生供應商工具因程式碼模式擁有工具介面而遭到隱藏的情況。

這些旗標會透過一般的 OpenClaw 日誌記錄，因此 `openclaw logs --follow`
和控制介面的日誌分頁都會顯示它們。若未設定這些旗標，相同的診斷資訊
仍會以 `debug` 層級提供。

無論 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 為何，`[model-fetch]` 開始和回應中繼資料（供應商、API、模型、狀態、
延遲，以及方法、URL、逾時、代理和原則等要求欄位）
一律會以 `info` 層級發出，因此無須偵錯旗標
即可查看基本的模型傳輸健全性。

### 追蹤關聯

檔案日誌採用 JSONL。當日誌呼叫帶有有效的診斷追蹤內容時，
OpenClaw 會將追蹤欄位寫入頂層 JSON 鍵（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`），讓外部日誌處理器能將該行
與 OTEL span 及供應商的 `traceparent` 傳播建立關聯。

閘道 HTTP 要求和閘道 WebSocket 訊框會建立內部要求
追蹤範圍。在該非同步範圍內發出的日誌和診斷事件若未傳入明確的追蹤內容，
就會繼承要求追蹤。代理執行和
模型呼叫追蹤會成為作用中要求追蹤的子項，因此本機日誌、
診斷快照、OTEL span 和受信任供應商的 `traceparent` 標頭可透過
`traceId` 串聯，而無須記錄原始要求或模型內容。

啟用 OpenTelemetry 日誌匯出時，通話生命週期日誌記錄也會流向 diagnostics-otel 日誌匯出，
並使用與檔案日誌相同的有界屬性。
設定 `diagnostics.otel.logsExporter` 以選擇 OTLP、stdout JSONL 或
兩種接收端。

### 模型呼叫大小與時間

模型呼叫診斷會記錄有界的要求／回應測量值，而不會
擷取原始提示詞或回應內容：

- `requestPayloadBytes`：最終模型要求承載資料的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應區塊
  承載資料的 UTF-8 位元組大小。高頻率的文字、思考和工具呼叫差異事件
  只會計算增量 `delta` 位元組，而非完整的 `partial` 快照。
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫的總持續時間

啟用診斷匯出時，診斷快照、模型呼叫外掛鉤子和
OTEL 模型呼叫 span／指標都可使用這些欄位。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：易於閱讀、彩色，並附帶時間戳記。
- `compact`：更精簡的輸出（最適合長時間工作階段）。
- `json`：每行一個 JSON（供日誌處理器使用）。

### 遮蔽

OpenClaw 可在敏感權杖出現在主控台輸出、檔案日誌、
OTLP 日誌記錄、持久化工作階段逐字稿文字或 Control UI 工具
事件承載內容（工具啟動引數、部分／最終結果承載內容、衍生的
exec 輸出及修補摘要）之前遮蔽它們：

- 敏感值遮蔽一律啟用。
- `logging.redactPatterns`：正規表示式字串清單，用於取代日誌／逐字稿輸出的預設集合。對於 Control UI 工具承載內容，自訂模式會疊加於內建預設值之上，因此新增模式絕不會削弱對預設值已偵測到之值的遮蔽。

檔案日誌與工作階段逐字稿仍採用 JSONL，但相符的機密值會在
該行或訊息寫入磁碟前被遮蔽。遮蔽會盡力執行：
它適用於含文字的訊息內容與日誌字串，而非每個
識別碼或二進位承載內容欄位。

內建預設值涵蓋常見的 API 認證資訊與付款認證資訊欄位
名稱，例如卡號、CVC/CVV、共用付款權杖及付款認證資訊，
前提是它們以 JSON 欄位、URL 參數、命令列介面旗標或指派形式出現。

OpenClaw 也會遮蔽顯示給 UI 用戶端、支援套件、
診斷觀察器、核准提示或代理工具的安全邊界承載內容。自訂
`logging.redactPatterns` 可在這些介面上新增專案特定模式。

## 診斷與 OpenTelemetry

診斷是針對模型執行及
訊息流程遙測（網路鉤子、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**
取代日誌，而是提供資料給指標、追蹤及匯出器。事件預設會在
處理程序內發出（將 `diagnostics.enabled: false` 設為關閉它們）；
匯出事件則是另一項獨立設定。

兩個相鄰的介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤及日誌傳送至
  任何與 OpenTelemetry 相容的收集器或後端（Datadog、Grafana、
  Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、
  指標／跨度名稱、環境變數及隱私權模型請參閱專屬頁面：
  [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 將額外日誌導向
  `logging.file`，而不提高 `logging.level` 的針對性偵錯日誌旗標。旗標不區分大小寫，
  且支援萬用字元（`telegram.*`、`*`）。請在 `diagnostics.flags` 下設定，
  或透過 `OPENCLAW_DIAGNOSTICS=...` 環境變數覆寫。完整指南：
  [診斷旗標](/zh-TW/diagnostics/flags)。

若要將 OTLP 匯出至收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線至閘道？** 請先執行 `openclaw doctor`。
- **日誌是空的？** 請確認閘道正在執行，並寫入
  `logging.file` 中的檔案路徑。
- **需要更多詳細資訊？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關內容

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標／跨度目錄、隱私權模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 針對性偵錯日誌旗標
- [閘道日誌內部機制](/zh-TW/gateway/logging) — WS 日誌樣式、子系統前綴及主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
