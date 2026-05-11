---
read_when:
    - 你需要一份適合初學者的 OpenClaw 日誌記錄概覽
    - 您想設定日誌層級、格式或遮蔽
    - 你正在疑難排解，並且需要快速找到日誌
summary: 檔案記錄、主控台輸出、CLI 尾端追蹤，以及 Control UI 的記錄分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-05-11T20:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要記錄介面：

- **檔案記錄**（JSON lines），由 Gateway 寫入。
- 顯示在終端機和 Gateway 偵錯 UI 中的**主控台輸出**。

控制 UI 的**記錄**分頁會追蹤 gateway 檔案記錄。本頁說明記錄存放的位置、如何閱讀，以及如何設定記錄等級和格式。

## 記錄存放位置

預設情況下，Gateway 會在以下位置寫入輪替記錄檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主機的本機時區。

每個檔案達到 `logging.maxFileBytes`（預設：100 MB）時會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並繼續寫入新的作用中記錄，而不是抑制診斷資訊。

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

實用的目前選項：

- `--local-time`：以你的本機時區呈現時間戳記
- `--url <url>` / `--token <token>` / `--timeout <ms>`：標準 Gateway RPC 旗標
- `--expect-final`：由代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）

輸出模式：

- **TTY 工作階段**：美化、彩色、結構化的記錄行。
- **非 TTY 工作階段**：純文字。
- `--json`：以行分隔的 JSON（每行一個記錄事件）。
- `--plain`：在 TTY 工作階段中強制使用純文字。
- `--no-color`：停用 ANSI 色彩。

當你傳入明確的 `--url` 時，CLI 不會自動套用設定或環境認證；如果目標 Gateway 需要驗證，請自行包含 `--token`。

在 JSON 模式中，CLI 會發出帶有 `type` 標籤的物件：

- `meta`：串流中繼資料（檔案、游標、大小）
- `log`：已剖析的記錄項目
- `notice`：截斷 / 輪替提示
- `raw`：未剖析的記錄行

如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回使用已設定的 Gateway 檔案記錄。明確的 `--url` 目標不會使用此退回機制。

如果無法連線至 Gateway，CLI 會列印一段簡短提示，要求執行：

```bash
openclaw doctor
```

### 控制 UI（網頁）

控制 UI 的**記錄**分頁會使用 `logs.tail` 追蹤同一個檔案。請參閱[控制 UI](/zh-TW/web/control-ui) 了解如何開啟。

### 僅頻道記錄

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

## 記錄格式

### 檔案記錄（JSONL）

記錄檔中的每一行都是 JSON 物件。CLI 和控制 UI 會剖析這些項目，以呈現結構化輸出（時間、等級、子系統、訊息）。

檔案記錄 JSONL 記錄也會在可用時包含可由機器篩選的頂層欄位：

- `hostname`：gateway 主機名稱。
- `message`：供全文搜尋使用的扁平化記錄訊息文字。
- `agent_id`：當記錄呼叫帶有代理脈絡時的作用中代理 ID。
- `session_id`：當記錄呼叫帶有工作階段脈絡時的作用中工作階段 ID/鍵。
- `channel`：當記錄呼叫帶有頻道脈絡時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始的結構化記錄引數，因此讀取編號 tslog 引數鍵的既有剖析器仍可正常運作。

對話、即時語音和受管理房間活動會透過同一個檔案記錄管線發出有界的生命週期記錄。這些記錄會在可用時包含事件類型、模式、傳輸、提供者，以及大小/時間測量，但會省略逐字稿文字、音訊酬載、回合 ID、呼叫 ID 和提供者項目 ID。

### 主控台輸出

主控台記錄**會感知 TTY**，並以易讀性為目標格式化：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 等級著色（info/warn/error）
- 可選的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 記錄

`openclaw gateway` 也有用於 RPC 流量的 WebSocket 協定記錄：

- 一般模式：僅記錄值得關注的結果（錯誤、剖析錯誤、慢速呼叫）
- `--verbose`：所有請求/回應流量
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

### 記錄等級

- `logging.level`：**檔案記錄**（JSONL）等級。
- `logging.consoleLevel`：**主控台**詳細程度等級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以在單次執行中提高詳細程度，而不需要編輯 `openclaw.json`。你也可以傳入全域 CLI 選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會針對該命令覆寫環境變數。

`--verbose` 只會影響主控台輸出和 WS 記錄詳細程度；不會變更檔案記錄等級。

### 目標式模型傳輸診斷

偵錯提供者呼叫時，請使用目標式環境旗標，而不是將所有記錄提高到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用旗標：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 等級發出請求開始、fetch 回應、SDK 標頭、第一個串流事件、串流完成和傳輸錯誤。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型請求記錄中包含有界的請求酬載摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在酬載摘要中包含所有面向模型的工具名稱。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含已遮罩且有上限的 JSON 酬載快照。僅在偵錯期間使用；秘密會被遮罩，但提示和訊息文字仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：發出第一事件和串流完成時間。
- `OPENCLAW_DEBUG_SSE=peek`：另外發出前五個已遮罩的 SSE 事件酬載，並對每個事件設上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：發出程式碼模式模型介面診斷，包括原生提供者工具因程式碼模式擁有工具介面而被隱藏的情況。

這些旗標會透過一般 OpenClaw 記錄輸出，因此 `openclaw logs --follow` 和控制 UI 的記錄分頁都會顯示它們。未使用旗標時，相同診斷仍可在 `debug` 等級取得。

### 追蹤關聯

檔案記錄是 JSONL。當記錄呼叫帶有有效的診斷追蹤脈絡時，OpenClaw 會將追蹤欄位寫為頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部記錄處理器可以將該行與 OTEL span 和提供者 `traceparent` 傳播關聯起來。

Gateway HTTP 請求和 Gateway WebSocket 框架會建立內部請求追蹤作用域。在該 async 作用域內發出的記錄和診斷事件，若未傳入明確追蹤脈絡，會繼承請求追蹤。代理執行和模型呼叫追蹤會成為作用中請求追蹤的子項，因此本機記錄、診斷快照、OTEL span，以及受信任提供者的 `traceparent` 標頭，都可以透過 `traceId` 串接，而不需要記錄原始請求或模型內容。

啟用 OpenTelemetry 記錄匯出時，對話生命週期記錄也會使用與檔案記錄相同的有界屬性流向 OTLP 記錄。

### 模型呼叫大小和時間

模型呼叫診斷會記錄有界的請求/回應測量，而不擷取原始提示或回應內容：

- `requestPayloadBytes`：最終模型請求酬載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應事件的 UTF-8 位元組大小
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總持續時間

啟用診斷匯出時，診斷快照、模型呼叫 Plugin hook，以及 OTEL 模型呼叫 span/指標都可以使用這些欄位。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：對人友善、彩色、含時間戳記。
- `compact`：更緊湊的輸出（最適合長時間工作階段）。
- `json`：每行一個 JSON（供記錄處理器使用）。

### 遮罩

OpenClaw 可以在敏感權杖進入主控台輸出、檔案記錄、OTLP 記錄、持久化工作階段逐字稿文字，或控制 UI 工具事件酬載（工具啟動引數、部分/最終結果酬載、衍生 exec 輸出和修補摘要）之前將其遮罩：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用於覆寫預設集合的 regex 字串清單。自訂模式會套用在控制 UI 工具酬載的內建預設之上，因此新增模式永遠不會削弱已被預設捕捉到的值的遮罩。

檔案記錄和工作階段逐字稿會維持 JSONL，但相符的秘密值會在該行或訊息寫入磁碟前被遮罩。遮罩是盡力而為：它會套用到帶有文字的訊息內容和記錄字串，而不是每一個識別碼或二進位酬載欄位。

內建預設會涵蓋常見的 API 認證，以及付款認證欄位名稱，例如卡號、CVC/CVV、共用付款權杖和付款認證，當它們以 JSON 欄位、URL 參數、CLI 旗標或指派形式出現時都會處理。

`logging.redactSensitive: "off"` 只會停用這個一般記錄/逐字稿政策。OpenClaw 仍會遮罩可顯示給 UI 用戶端、支援套件、診斷觀察者、核准提示或代理工具的安全邊界酬載。範例包括控制 UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及 Gateway WebSocket 協定記錄。自訂 `logging.redactPatterns` 仍可在這些介面上新增專案特定模式。

## 診斷和 OpenTelemetry

診斷是用於模型執行和訊息流遙測（webhook、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代記錄，而是供給指標、追蹤和匯出器。無論是否匯出，事件都會在程序內發出。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤和記錄傳送到任何 OpenTelemetry 相容的收集器或後端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標/span 名稱、環境變數和隱私模型位於專用頁面：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 目標式偵錯記錄旗標，可將額外記錄路由到 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。在 `diagnostics.flags` 底下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要在不使用 OTLP 匯出的情況下，為 Plugin 或自訂接收端啟用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要匯出 OTLP 到收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線至 Gateway？** 先執行 `openclaw doctor`。
- **記錄是空的？** 檢查 Gateway 是否正在執行，並且正在寫入 `logging.file` 中的檔案路徑。
- **需要更多細節？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關內容

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標/span 目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式偵錯記錄旗標
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴和主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
