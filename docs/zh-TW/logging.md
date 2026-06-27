---
read_when:
    - 你需要一份適合初學者的 OpenClaw 記錄概覽
    - 你想設定日誌層級、格式或遮蔽處理
    - 你正在疑難排解，需要快速找到記錄檔
summary: 檔案記錄、主控台輸出、命令列介面追蹤，以及 Control UI 記錄分頁
title: 日誌記錄
x-i18n:
    generated_at: "2026-06-27T19:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要的記錄介面：

- **檔案記錄**（JSON lines），由閘道寫入。
- **主控台輸出**，顯示在終端機與閘道除錯 UI 中。

Control UI 的 **記錄** 分頁會追蹤閘道檔案記錄。本頁說明記錄存放位置、如何讀取記錄，以及如何設定記錄層級與格式。

## 記錄存放位置

預設情況下，閘道會在下列位置寫入輪替記錄檔：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用閘道主機的本機時區。

每個檔案在達到 `logging.maxFileBytes`（預設：100 MB）時會輪替。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並改寫入新的作用中記錄檔，而不是抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫此設定：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何讀取記錄

### 命令列介面：即時追蹤（建議）

使用命令列介面透過 RPC 追蹤閘道記錄檔：

```bash
openclaw logs --follow
```

目前實用的選項：

- `--local-time`：以你的本機時區呈現時間戳記
- `--url <url>` / `--token <token>` / `--timeout <ms>`：標準閘道 RPC 旗標
- `--expect-final`：代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）

輸出模式：

- **TTY 工作階段**：美化、彩色、結構化的記錄行。
- **非 TTY 工作階段**：純文字。
- `--json`：以行分隔的 JSON（每行一個記錄事件）。
- `--plain`：在 TTY 工作階段中強制使用純文字。
- `--no-color`：停用 ANSI 色彩。

當你傳入明確的 `--url` 時，命令列介面不會自動套用設定或環境認證；如果目標閘道需要驗證，請自行加入 `--token`。

在 JSON 模式中，命令列介面會輸出帶有 `type` 標籤的物件：

- `meta`：串流中繼資料（檔案、游標、大小）
- `log`：已剖析的記錄項目
- `notice`：截斷 / 輪替提示
- `raw`：未剖析的記錄行

如果隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回答前逾時，`openclaw logs` 會自動退回使用已設定的閘道檔案記錄。明確的 `--url` 目標不會使用此退回機制。`openclaw logs --follow` 更嚴格：在 Linux 上，若可用，它會依 PID 使用作用中的 user-systemd 閘道 journal，否則會持續重試即時閘道，而不是追蹤可能已過期的並列檔案。

如果無法連線到閘道，命令列介面會印出簡短提示，要求執行：

```bash
openclaw doctor
```

### Control UI（網頁）

Control UI 的 **記錄** 分頁會使用 `logs.tail` 追蹤同一個檔案。請參閱 [Control UI](/zh-TW/web/control-ui) 了解如何開啟。

### 僅限頻道的記錄

若要篩選頻道活動（WhatsApp/Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

## 記錄格式

### 檔案記錄（JSONL）

記錄檔中的每一行都是 JSON 物件。命令列介面與 Control UI 會剖析這些項目，以呈現結構化輸出（時間、層級、子系統、訊息）。

檔案記錄 JSONL 記錄在可用時也會包含可由機器篩選的頂層欄位：

- `hostname`：閘道主機名稱。
- `message`：用於全文搜尋的扁平化記錄訊息文字。
- `agent_id`：當記錄呼叫帶有代理情境時的作用中代理 ID。
- `session_id`：當記錄呼叫帶有工作階段情境時的作用中工作階段 ID/鍵。
- `channel`：當記錄呼叫帶有頻道情境時的作用中頻道。

OpenClaw 會在這些欄位旁保留原始的結構化記錄引數，因此讀取編號 tslog 引數鍵的既有剖析器仍可繼續運作。

通話、即時語音與受管理房間活動會透過同一個檔案記錄管線發出有界生命週期記錄。這些記錄在可用時會包含事件類型、模式、傳輸、提供者，以及大小/時間測量，但會省略逐字稿文字、音訊酬載、回合 ID、通話 ID 與提供者項目 ID。

### 主控台輸出

主控台記錄具備 **TTY 感知**，並以可讀性為目標格式化：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 層級色彩（info/warn/error）
- 選用的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### 閘道 WebSocket 記錄

`openclaw gateway` 也提供 RPC 流量的 WebSocket 協定記錄：

- 一般模式：僅顯示值得注意的結果（錯誤、剖析錯誤、慢速呼叫）
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

- `logging.level`：**檔案記錄**（JSONL）層級。
- `logging.consoleLevel`：**主控台**詳細程度層級。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數優先於設定檔，因此你可以針對單次執行提高詳細程度，而不必編輯 `openclaw.json`。你也可以傳入全域命令列介面選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它會針對該命令覆寫環境變數。

`--verbose` 只影響主控台輸出與 WS 記錄詳細程度；它不會變更檔案記錄層級。

### 目標模型傳輸診斷

除錯提供者呼叫時，請使用目標式環境旗標，而不是將所有記錄提高到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用旗標：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：在 `info` 層級發出請求開始、fetch 回應、SDK 標頭、第一個串流事件、串流完成，以及傳輸錯誤。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型請求記錄中包含有界請求酬載摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在酬載摘要中包含所有面向模型的工具名稱。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含已遮蔽且有上限的 JSON 酬載快照。僅在除錯時使用；秘密會被遮蔽，但提示與訊息文字仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：發出第一事件與串流完成的時間。
- `OPENCLAW_DEBUG_SSE=peek`：也發出前五個已遮蔽的 SSE 事件酬載，並對每個事件設上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：發出程式碼模式模型介面診斷，包括原生提供者工具因程式碼模式擁有工具介面而被隱藏時。

這些旗標會透過一般 OpenClaw 記錄輸出，因此 `openclaw logs --follow` 和 Control UI 記錄分頁都會顯示它們。若未設定這些旗標，相同診斷仍可在 `debug` 層級取得。

`[model-fetch]` 開始與回應中繼資料（提供者、API、模型、狀態、延遲，以及方法、URL、逾時、代理、政策等請求欄位）一律會在 `info` 層級發出，無論 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 設定為何，因此不需除錯旗標也能看見基本模型傳輸狀態。

### 追蹤關聯

檔案記錄是 JSONL。當記錄呼叫帶有有效的診斷追蹤情境時，OpenClaw 會將追蹤欄位寫成頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部記錄處理器能將該行與 OTEL span 和提供者 `traceparent` 傳播關聯起來。

閘道 HTTP 請求與閘道 WebSocket 框架會建立內部請求追蹤範圍。在該非同步範圍內發出的記錄與診斷事件，若未傳入明確追蹤情境，會繼承請求追蹤。代理執行與模型呼叫追蹤會成為作用中請求追蹤的子項，因此本機記錄、診斷快照、OTEL span，以及受信任提供者 `traceparent` 標頭，都可以透過 `traceId` 連接，而無需記錄原始請求或模型內容。

當 OpenTelemetry 記錄匯出啟用時，通話生命週期記錄也會流向 diagnostics-otel 記錄匯出，使用與檔案記錄相同的有界屬性。設定 `diagnostics.otel.logsExporter` 以選擇 OTLP、stdout JSONL，或兩個匯出目標。

### 模型呼叫大小與時間

模型呼叫診斷會記錄有界的請求/回應測量，而不擷取原始提示或回應內容：

- `requestPayloadBytes`：最終模型請求酬載的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應區塊酬載的 UTF-8 位元組大小。高頻文字、思考與工具呼叫 delta 事件只計入增量 `delta` 位元組，而不是完整 `partial` 快照。
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總時長

當診斷匯出啟用時，這些欄位可供診斷快照、模型呼叫外掛鉤子，以及 OTEL 模型呼叫 span/指標使用。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：適合人類閱讀、彩色、含時間戳記。
- `compact`：更精簡的輸出（最適合長時間工作階段）。
- `json`：每行 JSON（供記錄處理器使用）。

### 遮蔽

OpenClaw 可以在敏感權杖進入主控台輸出、檔案記錄、OTLP 記錄、持久化工作階段逐字稿文字，或 Control UI 工具事件酬載（工具啟動引數、部分/最終結果酬載、衍生 exec 輸出，以及修補摘要）之前將其遮蔽：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用於覆寫預設集合的 regex 字串清單。自訂模式會套用在 Control UI 工具酬載的內建預設之上，因此新增模式永遠不會削弱對已被預設值捕捉到的值的遮蔽。

檔案記錄與工作階段逐字稿仍維持 JSONL，但相符的秘密值會在該行或訊息寫入磁碟前被遮罩。遮蔽是盡力而為：它會套用於帶有文字的訊息內容與記錄字串，而不是每個識別碼或二進位酬載欄位。

內建預設涵蓋常見 API 認證，以及付款認證欄位名稱，例如卡號、CVC/CVV、共用付款權杖，以及付款認證，當它們以 JSON 欄位、URL 參數、命令列介面旗標或指派形式出現時都會處理。

`logging.redactSensitive: "off"` 只會停用這項一般記錄/逐字稿政策。OpenClaw 仍會遮蔽可顯示給 UI 用戶端、支援套件、診斷觀察者、核准提示或代理工具的安全邊界酬載。範例包括 Control UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及閘道 WebSocket 協定記錄。自訂 `logging.redactPatterns` 仍可在這些介面上加入專案特定模式。

## 診斷與 OpenTelemetry

診斷是用於模型執行與訊息流程遙測（網路鉤子、佇列、工作階段狀態）的結構化、機器可讀事件。它們**不會**取代記錄，而是供應指標、追蹤與匯出器。無論你是否匯出它們，事件都會在程序內發出。

兩個相鄰介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤與記錄傳送到任何 OpenTelemetry 相容的收集器或後端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標/span 名稱、環境變數與隱私模型位於專用頁面：[OpenTelemetry export](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 目標式除錯記錄旗標，會將額外記錄路由到 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。請在 `diagnostics.flags` 下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境覆寫。完整指南：[Diagnostics flags](/zh-TW/diagnostics/flags)。

若要在不使用 OTLP 匯出的情況下，為外掛或自訂匯出目標啟用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

如需將 OTLP 匯出到收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連上閘道？** 請先執行 `openclaw doctor`。
- **記錄是空的？** 檢查閘道是否正在執行，並寫入
  `logging.file` 中的檔案路徑。
- **需要更多細節？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標/span 目錄、隱私模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 針對性的偵錯記錄旗標
- [閘道記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴與主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
