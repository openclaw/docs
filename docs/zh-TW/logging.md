---
read_when:
    - 你需要一份適合初學者的 OpenClaw 日誌概覽
    - 你想設定日誌層級、格式或遮蔽
    - 你正在疑難排解，需要快速找到日誌
summary: 檔案日誌、主控台輸出、CLI 即時追蹤，以及控制 UI 的「日誌」分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-05-06T17:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要的日誌介面：

- **檔案日誌**（JSON 行），由 Gateway 寫入。
- **主控台輸出**，顯示於終端機與 Gateway 偵錯 UI。

控制 UI 的 **日誌** 分頁會追蹤 gateway 檔案日誌。本頁說明日誌位於何處、如何讀取日誌，以及如何設定日誌等級與格式。

## 日誌位置

預設情況下，Gateway 會在以下位置寫入輪替日誌檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主機的本地時區。

每個檔案達到 `logging.maxFileBytes`（預設：100 MB）時會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並繼續寫入新的作用中日誌，而不是抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫此設定：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何讀取日誌

### CLI：即時追蹤（建議）

使用 CLI 透過 RPC 追蹤 gateway 日誌檔：

```bash
openclaw logs --follow
```

目前有用的選項：

- `--local-time`：以你的本地時區呈現時間戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：標準 Gateway RPC 旗標
- `--expect-final`：代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）

輸出模式：

- **TTY 工作階段**：美觀、彩色、結構化的日誌行。
- **非 TTY 工作階段**：純文字。
- `--json`：以行分隔的 JSON（每行一個日誌事件）。
- `--plain`：在 TTY 工作階段中強制使用純文字。
- `--no-color`：停用 ANSI 色彩。

當你傳入明確的 `--url` 時，CLI 不會自動套用設定或環境憑證；如果目標 Gateway 需要驗證，請自行包含 `--token`。

在 JSON 模式中，CLI 會發出帶有 `type` 標記的物件：

- `meta`：串流中繼資料（檔案、游標、大小）
- `log`：已解析的日誌項目
- `notice`：截斷／輪替提示
- `raw`：未解析的日誌行

如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回答前逾時，`openclaw logs` 會自動退回到已設定的 Gateway 檔案日誌。明確的 `--url` 目標不會使用此退回機制。

如果無法連線到 Gateway，CLI 會列印簡短提示，要求執行：

```bash
openclaw doctor
```

### 控制 UI（網頁）

控制 UI 的 **日誌** 分頁會使用 `logs.tail` 追蹤同一個檔案。請參閱[控制 UI](/zh-TW/web/control-ui)了解如何開啟它。

### 僅限頻道的日誌

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日誌格式

### 檔案日誌（JSONL）

日誌檔中的每一行都是 JSON 物件。CLI 與控制 UI 會解析這些項目，以呈現結構化輸出（時間、等級、子系統、訊息）。

檔案日誌 JSONL 記錄在可用時也會包含可由機器篩選的頂層欄位：

- `hostname`：gateway 主機名稱。
- `message`：扁平化的日誌訊息文字，供全文搜尋使用。
- `agent_id`：當日誌呼叫帶有代理情境時的作用中代理 id。
- `session_id`：當日誌呼叫帶有工作階段情境時的作用中工作階段 id/鍵。
- `channel`：當日誌呼叫帶有頻道情境時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始結構化日誌引數，因此讀取編號 tslog 引數鍵的既有解析器仍可正常運作。

對話、即時語音與受管理房間活動會透過同一個檔案日誌管線發出有界的生命週期日誌記錄。這些記錄會在可用時包含事件類型、模式、傳輸、提供者，以及大小／時間測量，但會省略逐字稿文字、音訊承載、回合 id、通話 id 與提供者項目 id。

### 主控台輸出

主控台日誌具備 **TTY 感知**能力，並以可讀性為目標格式化：

- 子系統前置詞（例如 `gateway/channels/whatsapp`）
- 等級著色（info/warn/error）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 日誌

`openclaw gateway` 也具備 RPC 流量的 WebSocket 通訊協定日誌：

- 一般模式：只記錄值得注意的結果（錯誤、解析錯誤、慢速呼叫）
- `--verbose`：所有請求／回應流量
- `--ws-log auto|compact|full`：選擇詳細呈現樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定日誌

所有日誌設定都位於 `~/.openclaw/openclaw.json` 的 `logging` 底下。

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

### 日誌等級

- `logging.level`：**檔案日誌**（JSONL）等級。
- `logging.consoleLevel`：**主控台**詳細程度等級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以在不編輯 `openclaw.json` 的情況下，為單次執行提高詳細程度。你也可以傳入全域 CLI 選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會為該命令覆寫環境變數。

`--verbose` 只影響主控台輸出與 WS 日誌詳細程度；它不會變更檔案日誌等級。

### 追蹤關聯

檔案日誌是 JSONL。當日誌呼叫帶有有效的診斷追蹤情境時，OpenClaw 會將追蹤欄位寫成頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部日誌處理器可以將該行與 OTEL span 及提供者 `traceparent` 傳播關聯起來。

Gateway HTTP 請求與 Gateway WebSocket 訊框會建立內部請求追蹤範圍。在該 async 範圍內發出的日誌與診斷事件，如果未傳入明確的追蹤情境，會繼承請求追蹤。代理執行與模型呼叫追蹤會成為作用中請求追蹤的子項，因此本地日誌、診斷快照、OTEL span，以及受信任提供者的 `traceparent` 標頭，都可以透過 `traceId` 串接，而不必記錄原始請求或模型內容。

當啟用 OpenTelemetry 日誌匯出時，對話生命週期日誌記錄也會使用與檔案日誌相同的有界屬性流向 OTLP 日誌。

### 模型呼叫大小與時間

模型呼叫診斷會記錄有界的請求／回應測量值，而不擷取原始提示或回應內容：

- `requestPayloadBytes`：最終模型請求承載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應事件的 UTF-8 位元組大小
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總持續時間

當診斷匯出啟用時，這些欄位可供診斷快照、模型呼叫 Plugin hook，以及 OTEL 模型呼叫 span/指標使用。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：適合人類閱讀、彩色、帶時間戳。
- `compact`：更緊湊的輸出（最適合長時間工作階段）。
- `json`：每行一個 JSON（供日誌處理器使用）。

### 修訂

OpenClaw 可以在敏感權杖進入主控台輸出、檔案日誌、OTLP 日誌記錄、持久化工作階段逐字稿文字，或控制 UI 工具事件承載（工具開始引數、部分／最終結果承載、衍生的 exec 輸出與修補摘要）之前加以修訂：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用來覆寫預設集合的 regex 字串清單。自訂模式會套用在控制 UI 工具承載的內建預設之上，因此新增模式絕不會削弱已被預設值捕捉到的值的修訂。

檔案日誌與工作階段逐字稿會保持 JSONL，但相符的秘密值會在該行或訊息寫入磁碟前被遮蔽。修訂是盡力而為：它會套用於帶有文字的訊息內容與日誌字串，而不是每一個識別碼或二進位承載欄位。

內建預設涵蓋常見 API 憑證與付款憑證欄位名稱，例如卡號、CVC/CVV、共用付款權杖，以及當它們以 JSON 欄位、URL 參數、CLI 旗標或指派形式出現時的付款憑證。

`logging.redactSensitive: "off"` 只會停用這項一般日誌／逐字稿政策。OpenClaw 仍會修訂可顯示給 UI 用戶端、支援套件、診斷觀察者、核准提示或代理工具的安全邊界承載。範例包括控制 UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及 Gateway WebSocket 通訊協定日誌。自訂 `logging.redactPatterns` 仍可在這些介面上新增專案特定模式。

## 診斷與 OpenTelemetry

診斷是針對模型執行與訊息流程遙測（webhook、排隊、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代日誌，而是供應指標、追蹤與匯出器。無論你是否匯出它們，事件都會在處理程序內發出。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤與日誌傳送到任何 OpenTelemetry 相容的收集器或後端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標／span 名稱、環境變數與隱私模型位於專屬頁面：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 目標式偵錯日誌旗標，會將額外日誌路由到 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。可在 `diagnostics.flags` 底下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要在不使用 OTLP 匯出的情況下，為 Plugin 或自訂 sink 啟用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要匯出 OTLP 到收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線到 Gateway？** 先執行 `openclaw doctor`。
- **日誌是空的？** 檢查 Gateway 是否正在執行，且正在寫入 `logging.file` 中的檔案路徑。
- **需要更多細節？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標／span 目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式偵錯日誌旗標
- [Gateway 日誌內部機制](/zh-TW/gateway/logging) — WS 日誌樣式、子系統前置詞與主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
