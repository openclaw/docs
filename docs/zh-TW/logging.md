---
read_when:
    - 你需要一份適合初學者的 OpenClaw 日誌記錄概覽
    - 你想要設定日誌層級、格式或遮蔽
    - 你正在進行疑難排解，並且需要快速找到日誌
summary: 檔案日誌、主控台輸出、CLI 尾端追蹤，以及控制 UI 的「日誌」分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-05-02T02:53:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要記錄介面：

- **檔案記錄**（JSON lines），由 Gateway 寫入。
- **主控台輸出**，顯示在終端機和 Gateway 偵錯 UI 中。

Control UI 的 **記錄** 索引標籤會追蹤 gateway 檔案記錄。本頁說明記錄存放位置、如何閱讀，以及如何設定記錄層級與格式。

## 記錄存放位置

預設情況下，Gateway 會在以下位置寫入輪替記錄檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主機的本機時區。

每個檔案達到 `logging.maxFileBytes`（預設：100 MB）時會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並改為寫入新的作用中記錄檔，而不是抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫此設定：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何閱讀記錄

### CLI：即時追蹤（建議）

使用 CLI 透過 RPC 追蹤 gateway 記錄檔：

```bash
openclaw logs --follow
```

目前實用的選項：

- `--local-time`：以你的本機時區呈現時間戳記
- `--url <url>` / `--token <token>` / `--timeout <ms>`：標準 Gateway RPC 旗標
- `--expect-final`：代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）

輸出模式：

- **TTY 工作階段**：美觀、彩色、結構化的記錄行。
- **非 TTY 工作階段**：純文字。
- `--json`：以行分隔的 JSON（每行一個記錄事件）。
- `--plain`：在 TTY 工作階段強制使用純文字。
- `--no-color`：停用 ANSI 色彩。

當你傳入明確的 `--url` 時，CLI 不會自動套用設定或環境認證；如果目標 Gateway 需要驗證，請自行包含 `--token`。

在 JSON 模式中，CLI 會發出帶有 `type` 標籤的物件：

- `meta`：串流中繼資料（檔案、游標、大小）
- `log`：已剖析的記錄項目
- `notice`：截斷／輪替提示
- `raw`：未剖析的記錄行

如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回使用已設定的 Gateway 檔案記錄。明確的 `--url` 目標不會使用此備援。

如果無法連線到 Gateway，CLI 會列印簡短提示，要求執行：

```bash
openclaw doctor
```

### Control UI（網頁）

Control UI 的 **記錄** 索引標籤會使用 `logs.tail` 追蹤同一個檔案。請參閱 [/web/control-ui](/zh-TW/web/control-ui) 了解如何開啟。

### 僅限頻道的記錄

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

## 記錄格式

### 檔案記錄（JSONL）

記錄檔中的每一行都是一個 JSON 物件。CLI 和 Control UI 會剖析這些項目，以呈現結構化輸出（時間、層級、子系統、訊息）。

檔案記錄 JSONL 紀錄在可用時也會包含可由機器篩選的頂層欄位：

- `hostname`：gateway 主機名稱。
- `message`：扁平化的記錄訊息文字，用於全文搜尋。
- `agent_id`：當記錄呼叫帶有代理內容時的作用中代理 id。
- `session_id`：當記錄呼叫帶有工作階段內容時的作用中工作階段 id/key。
- `channel`：當記錄呼叫帶有頻道內容時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始結構化記錄引數，因此讀取編號 tslog 引數鍵的既有剖析器仍可運作。

### 主控台輸出

主控台記錄具備 **TTY 感知能力**，並針對可讀性格式化：

- 子系統前置詞（例如 `gateway/channels/whatsapp`）
- 層級著色（info/warn/error）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 記錄

`openclaw gateway` 也有用於 RPC 流量的 WebSocket 通訊協定記錄：

- 一般模式：僅顯示值得注意的結果（錯誤、剖析錯誤、慢速呼叫）
- `--verbose`：所有請求／回應流量
- `--ws-log auto|compact|full`：選擇詳細呈現樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定記錄

所有記錄設定都位於 `~/.openclaw/openclaw.json` 的 `logging` 下。

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

- `logging.level`：**檔案記錄**（JSONL）層級。
- `logging.consoleLevel`：**主控台** 詳細程度層級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以在不編輯 `openclaw.json` 的情況下，提高單次執行的詳細程度。你也可以傳入全域 CLI 選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會為該命令覆寫環境變數。

`--verbose` 只影響主控台輸出與 WS 記錄詳細程度；不會變更檔案記錄層級。

### 追蹤關聯

檔案記錄是 JSONL。當記錄呼叫帶有有效的診斷追蹤內容時，OpenClaw 會將追蹤欄位寫成頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部記錄處理器可以將該行與 OTEL span 和供應商 `traceparent` 傳播關聯。

Gateway HTTP 請求與 Gateway WebSocket frame 會建立內部請求追蹤範圍。在該 async 範圍內發出的記錄與診斷事件，若未傳入明確追蹤內容，會繼承請求追蹤。代理執行與模型呼叫追蹤會成為作用中請求追蹤的子項，因此本機記錄、診斷快照、OTEL span，以及受信任供應商的 `traceparent` 標頭，都能透過 `traceId` 連結，而無需記錄原始請求或模型內容。

### 模型呼叫大小與計時

模型呼叫診斷會記錄有界的請求／回應測量值，而不擷取原始提示或回應內容：

- `requestPayloadBytes`：最終模型請求承載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應事件的 UTF-8 位元組大小
- `timeToFirstByteMs`：第一個串流回應事件之前經過的時間
- `durationMs`：模型呼叫總持續時間

啟用診斷匯出時，這些欄位可供診斷快照、模型呼叫 Plugin hook，以及 OTEL 模型呼叫 span/指標使用。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：適合人類閱讀、彩色、含時間戳記。
- `compact`：更緊湊的輸出（最適合長工作階段）。
- `json`：每行 JSON（供記錄處理器使用）。

### 遮罩

OpenClaw 可以在敏感權杖進入主控台輸出、檔案記錄、OTLP 記錄紀錄、持久化工作階段逐字稿文字，或 Control UI 工具事件承載（工具開始引數、部分／最終結果承載、衍生 exec 輸出，以及修補摘要）之前進行遮罩：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用來覆寫預設集合的 regex 字串清單。自訂模式會疊加套用在 Control UI 工具承載的內建預設值之上，因此新增模式絕不會削弱已被預設值捕捉之值的遮罩。

檔案記錄與工作階段逐字稿仍維持 JSONL，但相符的秘密值會在行或訊息寫入磁碟前被遮罩。遮罩是盡力而為：它會套用於帶有文字的訊息內容和記錄字串，而非每個識別碼或二進位承載欄位。

內建預設值涵蓋常見 API 認證和付款認證欄位名稱，例如卡號、CVC/CVV、共用付款權杖，以及付款認證，前提是它們以 JSON 欄位、URL 參數、CLI 旗標或指派形式出現。

`logging.redactSensitive: "off"` 只會停用這項一般記錄／逐字稿政策。OpenClaw 仍會遮罩可能顯示給 UI 用戶端、支援套件、診斷觀察器、核准提示或代理工具的安全邊界承載。範例包括 Control UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、供應商錯誤觀察、exec 核准命令顯示，以及 Gateway WebSocket 通訊協定記錄。自訂 `logging.redactPatterns` 仍可在這些介面新增專案特定模式。

## 診斷與 OpenTelemetry

診斷是用於模型執行與訊息流程遙測（webhook、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代記錄，而是供給指標、追蹤與匯出器。不論你是否匯出，事件都會在程序內發出。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤與記錄傳送到任何 OpenTelemetry 相容的收集器或後端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標/span 名稱、環境變數，以及隱私模型位於專屬頁面：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 有目標的偵錯記錄旗標，會將額外記錄導向 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。在 `diagnostics.flags` 下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要為 Plugin 或自訂接收端啟用診斷事件，而不使用 OTLP 匯出：

```json5
{
  diagnostics: { enabled: true },
}
```

若要將 OTLP 匯出到收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線到 Gateway？** 請先執行 `openclaw doctor`。
- **記錄是空的？** 檢查 Gateway 是否正在執行，且是否正在寫入 `logging.file` 中的檔案路徑。
- **需要更多詳細資訊？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標/span 目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 有目標的偵錯記錄旗標
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前置詞，以及主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
