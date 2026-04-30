---
read_when:
    - 您需要一份適合初學者的 OpenClaw 日誌記錄概覽
    - 您想設定日誌層級、格式或遮蔽
    - 您正在排除問題，並需要快速找到記錄檔
summary: 檔案日誌、主控台輸出、CLI 追蹤，以及 Control UI 的日誌分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-04-30T03:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要記錄介面：

- **檔案記錄**（JSON 行），由 Gateway 寫入。
- **主控台輸出**，顯示於終端機與 Gateway 除錯 UI。

控制 UI 的 **記錄** 分頁會追蹤 gateway 檔案記錄。本頁說明記錄的位置、如何讀取記錄，以及如何設定記錄層級與格式。

## 記錄的位置

預設情況下，Gateway 會在以下位置下寫入輪替記錄檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主機的本機時區。

每個檔案在達到 `logging.maxFileBytes`（預設：100 MB）時會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並繼續寫入新的作用中記錄，而不是抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫此設定：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何讀取記錄

### CLI：即時追蹤（建議）

使用 CLI 透過 RPC 追蹤 gateway 記錄檔：

```bash
openclaw logs --follow
```

目前實用的選項：

- `--local-time`：以你的本機時區呈現時間戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：標準 Gateway RPC 旗標
- `--expect-final`：由 agent 支援的 RPC 最終回應等待旗標（這裡會透過共用用戶端層接受）

輸出模式：

- **TTY 工作階段**：美觀、彩色、結構化的記錄行。
- **非 TTY 工作階段**：純文字。
- `--json`：以行分隔的 JSON（每行一個記錄事件）。
- `--plain`：在 TTY 工作階段中強制使用純文字。
- `--no-color`：停用 ANSI 顏色。

當你傳入明確的 `--url` 時，CLI 不會自動套用設定或環境憑證；如果目標 Gateway 需要驗證，請自行包含 `--token`。

在 JSON 模式中，CLI 會輸出帶有 `type` 標籤的物件：

- `meta`：串流中繼資料（檔案、游標、大小）
- `log`：已剖析的記錄項目
- `notice`：截斷／輪替提示
- `raw`：未剖析的記錄行

如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回到已設定的 Gateway 檔案記錄。明確的 `--url` 目標不會使用此退回機制。

如果 Gateway 無法連線，CLI 會印出簡短提示，要求執行：

```bash
openclaw doctor
```

### 控制 UI（網頁）

控制 UI 的 **記錄** 分頁會使用 `logs.tail` 追蹤同一個檔案。請參閱 [/web/control-ui](/zh-TW/web/control-ui) 了解如何開啟。

### 僅限頻道的記錄

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

## 記錄格式

### 檔案記錄（JSONL）

記錄檔中的每一行都是一個 JSON 物件。CLI 和控制 UI 會剖析這些項目，以呈現結構化輸出（時間、層級、子系統、訊息）。

檔案記錄 JSONL 紀錄在可用時也會包含可供機器篩選的頂層欄位：

- `hostname`：gateway 主機名稱。
- `message`：扁平化的記錄訊息文字，用於全文搜尋。
- `agent_id`：記錄呼叫帶有 agent 上下文時的作用中 agent ID。
- `session_id`：記錄呼叫帶有工作階段上下文時的作用中工作階段 ID／鍵。
- `channel`：記錄呼叫帶有頻道上下文時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始結構化記錄引數，因此讀取編號 tslog 引數鍵的現有剖析器仍可繼續運作。

### 主控台輸出

主控台記錄具備 **TTY 感知**，並以易讀性為目標格式化：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 層級著色（info/warn/error）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 記錄

`openclaw gateway` 也提供 RPC 流量的 WebSocket 通訊協定記錄：

- 一般模式：只記錄值得注意的結果（錯誤、剖析錯誤、慢速呼叫）
- `--verbose`：所有要求／回應流量
- `--ws-log auto|compact|full`：選擇詳細呈現樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定記錄

所有記錄設定都位於 `~/.openclaw/openclaw.json` 的 `logging` 底下。

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

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以在不編輯 `openclaw.json` 的情況下，為單次執行提高詳細程度。你也可以傳入全域 CLI 選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會為該命令覆寫環境變數。

`--verbose` 只會影響主控台輸出與 WS 記錄詳細程度；不會變更檔案記錄層級。

### 追蹤關聯

檔案記錄是 JSONL。當記錄呼叫帶有有效的診斷追蹤上下文時，OpenClaw 會將追蹤欄位寫成頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部記錄處理器能將該行與 OTEL span 和提供者 `traceparent` 傳播關聯起來。

Gateway HTTP 要求和 Gateway WebSocket frame 會建立內部要求追蹤作用域。在該非同步作用域內發出的記錄與診斷事件，若未傳入明確追蹤上下文，會繼承要求追蹤。Agent 執行與模型呼叫追蹤會成為作用中要求追蹤的子項，因此本機記錄、診斷快照、OTEL span，以及受信任提供者的 `traceparent` 標頭，可以在不記錄原始要求或模型內容的情況下，透過 `traceId` 串接。

### 模型呼叫大小與計時

模型呼叫診斷會記錄有界限的要求／回應測量值，而不擷取原始提示詞或回應內容：

- `requestPayloadBytes`：最終模型要求酬載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應事件的 UTF-8 位元組大小
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總時長

當診斷匯出啟用時，這些欄位可供診斷快照、模型呼叫 Plugin hook，以及 OTEL 模型呼叫 span／指標使用。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：適合人類閱讀、彩色、含時間戳。
- `compact`：更精簡的輸出（最適合長工作階段）。
- `json`：每行 JSON（供記錄處理器使用）。

### 修訂

OpenClaw 可以在敏感權杖進入主控台輸出、檔案記錄、OTLP 記錄紀錄、持久化工作階段文字記錄，或控制 UI 工具事件酬載（工具啟動引數、部分／最終結果酬載、衍生的 exec 輸出，以及 patch 摘要）前將其修訂：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用來覆寫預設集合的 regex 字串清單。自訂模式會套用在控制 UI 工具酬載的內建預設值之上，因此新增模式絕不會削弱已被預設值捕捉之值的修訂。

檔案記錄和工作階段文字記錄仍維持 JSONL，但相符的祕密值會在行或訊息寫入磁碟前被遮罩。修訂是盡力而為：它會套用於帶有文字的訊息內容與記錄字串，而不是每個識別碼或二進位酬載欄位。

`logging.redactSensitive: "off"` 只會停用此一般記錄／文字記錄政策。OpenClaw 仍會修訂可顯示給 UI 用戶端、支援套件、診斷觀察器、核准提示或 agent 工具的安全邊界酬載。範例包括控制 UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及 Gateway WebSocket 通訊協定記錄。自訂 `logging.redactPatterns` 仍可在這些介面上新增專案特定模式。

## 診斷與 OpenTelemetry

診斷是針對模型執行與訊息流程遙測（webhook、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代記錄，而是供應指標、追蹤與匯出器。無論你是否匯出事件，事件都會在處理程序內發出。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤和記錄傳送到任何 OpenTelemetry 相容的 collector 或後端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標／span 名稱、環境變數與隱私模型位於專屬頁面：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 目標式除錯記錄旗標，可將額外記錄路由到 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。可在 `diagnostics.flags` 下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫設定。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要在不進行 OTLP 匯出的情況下，為 Plugin 或自訂 sink 啟用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要匯出 OTLP 到 collector，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **Gateway 無法連線？** 請先執行 `openclaw doctor`。
- **記錄為空？** 請檢查 Gateway 是否正在執行，並寫入 `logging.file` 中的檔案路徑。
- **需要更多細節？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標／span 目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式除錯記錄旗標
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴，以及主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
