---
read_when:
    - 你需要一份適合初學者的 OpenClaw 日誌記錄概覽
    - 您想要設定日誌層級、格式或遮蔽處理
    - 您正在進行疑難排解，需要快速找到日誌
summary: 檔案日誌、主控台輸出、命令列介面即時追蹤，以及控制介面的「日誌」分頁
title: 記錄日誌
x-i18n:
    generated_at: "2026-07-11T21:30:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw 有兩個主要的日誌介面：

- 閘道寫入的**檔案日誌**（JSON 行）。
- 執行閘道之終端機中的**主控台輸出**。

控制介面的**日誌**分頁會持續讀取閘道檔案日誌。本頁說明日誌的儲存位置、讀取方式，以及如何設定日誌層級與格式。

## 日誌的儲存位置

依預設，閘道每天寫入一個滾動日誌檔案：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用閘道主機的本地時區。當 `/tmp/openclaw` 不安全或無法使用時（Windows 上則一律如此），OpenClaw 會改用作業系統暫存目錄下、使用者範圍的 `openclaw-<uid>` 目錄。帶日期的日誌檔案會在 24 小時後清除。

當下一次寫入將超過 `logging.maxFileBytes`（預設：100 MB）時，每個檔案都會輪替。OpenClaw 會在使用中的檔案旁保留最多五個編號封存檔，例如 `openclaw-YYYY-MM-DD.1.log`，並繼續寫入新的使用中日誌，而不會抑制診斷資訊。

你可以在 `~/.openclaw/openclaw.json` 中覆寫路徑：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何讀取日誌

### 命令列介面：即時持續讀取（建議）

透過 RPC 持續讀取閘道日誌檔案：

```bash
openclaw logs --follow
```

選項：

| 旗標                | 預設值   | 行為                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 關閉     | 持續讀取；中斷連線時以退避機制重新連線                                                |
| `--limit <n>`       | `200`    | 每次擷取的最大行數                                                                    |
| `--max-bytes <n>`   | `250000` | 每次擷取讀取的最大位元組數                                                            |
| `--interval <ms>`   | `1000`   | 持續讀取時的輪詢間隔                                                                  |
| `--json`            | 關閉     | 以行分隔的 JSON（每行一個事件）                                                       |
| `--plain`           | 關閉     | 在 TTY 工作階段中強制使用純文字                                                       |
| `--no-color`        | —        | 停用 ANSI 色彩                                                                        |
| `--utc`             | 關閉     | 以 UTC 顯示時間戳記（預設為本地時間）                                                 |
| `--local-time`      | 關閉     | 為預設本地時間接受的相容拼法；除此之外沒有作用                                        |
| `--url` / `--token` | —        | 標準閘道 RPC 旗標                                                                     |
| `--timeout <ms>`    | `30000`  | 閘道 RPC 逾時                                                                         |
| `--expect-final`    | 關閉     | 由代理支援的 RPC 最終回應等待旗標（此處透過共用用戶端層接受）                         |

輸出模式：

- **TTY 工作階段**：美化、彩色且結構化的日誌行。
- **非 TTY 工作階段**：純文字。

明確傳入 `--url` 時，命令列介面不會自動套用設定或環境中的憑證；請自行包含 `--token`，否則呼叫會失敗並顯示 `gateway url override requires explicit credentials`。

在 JSON 模式中，命令列介面會輸出帶有 `type` 標記的物件：

- `meta`：串流中繼資料（檔案、來源、來源種類、服務、游標、大小）
- `log`：已剖析的日誌項目
- `notice`：截斷／輪替提示
- `raw`：未剖析的日誌行
- `error`：閘道連線失敗（寫入 stderr）

若隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動改為讀取已設定的閘道檔案日誌。明確指定的 `--url` 目標不會使用此備援機制。`openclaw logs --follow` 更為嚴格：在 Linux 上，若可用，會依 PID 使用目前使用者的 systemd 閘道日誌；否則會以退避機制重試即時閘道，而不是持續讀取旁邊可能已過期的檔案。

若無法連線至閘道，命令列介面會顯示簡短提示，要求執行：

```bash
openclaw doctor
```

### 控制介面（網頁）

控制介面的**日誌**分頁會使用 `logs.tail` 持續讀取同一個檔案。
如需開啟方式，請參閱[控制介面](/zh-TW/web/control-ui)。

### 僅限頻道的日誌

若要篩選頻道活動（WhatsApp／Telegram 等），請使用：

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 預設為 `all`；也可使用 `--lines <n>`（預設為 200）和 `--json`。

## 日誌格式

### 檔案日誌（JSONL）

日誌檔案中的每一行都是一個 JSON 物件。命令列介面和控制介面會剖析這些項目，以呈現結構化輸出（時間、層級、子系統、訊息）。

檔案日誌的 JSONL 記錄在可用時也會包含可供機器篩選的頂層欄位：

- `hostname`：閘道主機名稱。
- `message`：供全文搜尋使用的扁平化日誌訊息文字。
- `agent_id`：日誌呼叫帶有代理情境時，目前使用中的代理 ID。
- `session_id`：日誌呼叫帶有工作階段情境時，目前使用中的工作階段 ID／金鑰。
- `channel`：日誌呼叫帶有頻道情境時，目前使用中的頻道。

OpenClaw 會在這些欄位之外保留原始的結構化日誌引數，因此讀取 tslog 編號引數鍵的既有剖析器仍可繼續運作。

Talk、即時語音和受管理房間的活動會透過同一個檔案日誌管線輸出有界的生命週期日誌記錄。這些記錄會在可用時包含事件類型、模式、傳輸、提供者，以及大小／計時測量值，但會省略逐字稿文字、音訊承載資料、輪次 ID、通話 ID 和提供者項目 ID。

### 主控台輸出

主控台日誌會**感知 TTY**，並經過格式化以提高可讀性：

- 子系統前綴（例如 `gateway/channels/whatsapp`）
- 層級色彩（資訊／警告／錯誤）
- 可選的精簡或 JSON 模式

主控台格式由 `logging.consoleStyle` 控制。

### 閘道 WebSocket 日誌

`openclaw gateway` 也提供 RPC 流量的 WebSocket 通訊協定日誌：

- 一般模式：僅記錄值得關注的結果（錯誤、剖析錯誤、緩慢呼叫）
- `--verbose`：所有請求／回應流量
- `--ws-log auto|compact|full`：選擇詳細輸出的呈現樣式
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 設定日誌

所有日誌設定都位於 `~/.openclaw/openclaw.json` 的 `logging` 下。

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

- `logging.level`：**檔案日誌**（JSONL）的層級（預設：`info`）。
- `logging.consoleLevel`：**主控台**的詳細程度。

你可以透過 **`OPENCLAW_LOG_LEVEL`** 環境變數覆寫兩者（例如 `OPENCLAW_LOG_LEVEL=debug`）。環境變數的優先順序高於設定檔，因此無須編輯 `openclaw.json`，即可提高單次執行的詳細程度。你也可以傳入全域命令列介面選項 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），此選項會針對該命令覆寫環境變數。

`--verbose` 只會影響主控台輸出和 WS 日誌的詳細程度；不會變更檔案日誌層級。

### 針對性的模型傳輸診斷

偵錯提供者呼叫時，請使用針對性的環境旗標，而不是將所有日誌提高至 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用旗標：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 層級輸出請求開始、擷取回應、SDK 標頭、第一個串流事件、串流完成和傳輸錯誤。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型請求日誌中包含有界的請求承載資料摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在承載資料摘要中包含所有面向模型的工具名稱。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含經遮蔽且有大小上限的 JSON 承載資料快照。僅限偵錯期間使用；密鑰會被遮蔽，但提示詞和訊息文字仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：輸出第一個事件和串流完成的計時資訊。
- `OPENCLAW_DEBUG_SSE=peek`：另外輸出前五個經遮蔽的 SSE 事件承載資料，每個事件都有大小上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：輸出程式碼模式的模型介面診斷資訊，包括因程式碼模式擁有工具介面而隱藏原生提供者工具時的資訊。

這些旗標會透過一般的 OpenClaw 日誌系統記錄，因此 `openclaw logs --follow` 和控制介面的日誌分頁都會顯示它們。未使用這些旗標時，相同的診斷資訊仍可在 `debug` 層級取得。

無論是否設定 `OPENCLAW_DEBUG_MODEL_TRANSPORT`，`[model-fetch]` 的開始與回應中繼資料（提供者、API、模型、狀態、延遲，以及方法、URL、逾時、代理和原則等請求欄位）一律會以 `info` 層級輸出，因此即使沒有偵錯旗標，也能看見基本的模型傳輸衛生資訊。

### 追蹤關聯

檔案日誌採用 JSONL。當日誌呼叫帶有有效的診斷追蹤情境時，OpenClaw 會將追蹤欄位寫為頂層 JSON 鍵（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），讓外部日誌處理器能將該行與 OTEL 跨距及提供者的 `traceparent` 傳播建立關聯。

閘道 HTTP 請求和閘道 WebSocket 框架會建立內部請求追蹤範圍。在該非同步範圍內輸出的日誌和診斷事件，若未傳入明確的追蹤情境，就會繼承請求追蹤。代理執行和模型呼叫追蹤會成為目前請求追蹤的子項，因此本地日誌、診斷快照、OTEL 跨距和受信任提供者的 `traceparent` 標頭可以透過 `traceId` 串接，而無須記錄原始請求或模型內容。

啟用 OpenTelemetry 日誌匯出時，Talk 生命週期日誌記錄也會流向 diagnostics-otel 日誌匯出，並使用與檔案日誌相同的有界屬性。設定 `diagnostics.otel.logsExporter` 以選擇 OTLP、stdout JSONL 或同時使用兩個接收端。

### 模型呼叫大小與計時

模型呼叫診斷會記錄有界的請求／回應測量值，而不擷取原始提示詞或回應內容：

- `requestPayloadBytes`：最終模型請求承載資料的 UTF-8 位元組大小
- `responseStreamBytes`：串流模型回應區塊承載資料的 UTF-8 位元組大小。高頻文字、思考和工具呼叫差異事件只計算遞增的 `delta` 位元組，而非完整的 `partial` 快照。
- `timeToFirstByteMs`：第一個串流回應事件前經過的時間
- `durationMs`：模型呼叫總持續時間

啟用診斷匯出時，診斷快照、模型呼叫外掛鉤點，以及 OTEL 模型呼叫跨距／指標都能使用這些欄位。

### 主控台樣式

`logging.consoleStyle`：

- `pretty`：易於閱讀、帶有色彩與時間戳記。
- `compact`：更緊湊的輸出（最適合長時間工作階段）。
- `json`：每行一個 JSON（供日誌處理器使用）。

### 遮蔽

OpenClaw 可以在敏感權杖進入主控台輸出、檔案日誌、OTLP 日誌記錄、持久化工作階段逐字稿文字或控制介面工具事件承載資料（工具啟動引數、部分／最終結果承載資料、衍生的執行輸出和修補摘要）之前加以遮蔽：

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：用於取代日誌／逐字稿輸出預設集合的規則運算式字串清單。對於控制介面工具承載資料，自訂模式會套用在內建預設值之上，因此新增模式絕不會削弱對已被預設值偵測之數值的遮蔽。

檔案日誌和工作階段逐字稿仍維持 JSONL 格式，但相符的密鑰值會在線路或訊息寫入磁碟前加以遮蔽。遮蔽僅以盡力而為的方式進行：它適用於包含文字的訊息內容和日誌字串，而非每個識別碼或二進位承載資料欄位。

內建預設值涵蓋常見的 API 憑證與付款憑證欄位名稱，例如卡號、CVC/CVV、共用付款權杖及付款憑證；這些名稱可能以 JSON 欄位、URL 參數、命令列介面旗標或指派值的形式出現。

`logging.redactSensitive: "off"` 只會停用這項一般記錄檔／逐字稿政策。OpenClaw 仍會遮蔽可能顯示給使用者介面用戶端、支援套件、診斷觀察器、核准提示或代理工具的安全邊界承載資料。例如 Control UI 工具呼叫事件、`sessions_history` 輸出、診斷支援匯出、供應商錯誤觀察結果、執行核准命令顯示，以及閘道 WebSocket 通訊協定記錄。自訂 `logging.redactPatterns` 仍可在這些介面上加入專案特定的模式。

## 診斷與 OpenTelemetry

診斷是針對模型執行與訊息流程遙測（網路鉤子、佇列處理、工作階段狀態）所產生的結構化、機器可讀事件。它們**不會**取代記錄檔，而是提供資料給指標、追蹤與匯出器。事件預設會在處理程序內發出（設定 `diagnostics.enabled: false` 可將其關閉）；匯出事件則是另一項獨立功能。

兩個相鄰的介面：

- **OpenTelemetry 匯出** — 透過 OTLP/HTTP 將指標、追蹤與記錄傳送至任何與 OpenTelemetry 相容的收集器或後端（Datadog、Grafana、Honeycomb、New Relic、Tempo 等）。完整設定、訊號目錄、指標／跨度名稱、環境變數與隱私權模型請參閱專頁：[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- **診斷旗標** — 針對特定目標的偵錯記錄旗標，可將額外記錄導向 `logging.file`，而不提高 `logging.level`。旗標不區分大小寫，並支援萬用字元（`telegram.*`、`*`）。請在 `diagnostics.flags` 下設定，或透過 `OPENCLAW_DIAGNOSTICS=...` 環境變數覆寫。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

若要將 OTLP 匯出至收集器，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 疑難排解提示

- **無法連線至閘道？** 請先執行 `openclaw doctor`。
- **記錄檔是空的？** 請確認閘道正在執行，並寫入 `logging.file` 中指定的檔案路徑。
- **需要更多詳細資訊？** 將 `logging.level` 設為 `debug` 或 `trace`，然後重試。

## 相關內容

- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — OTLP/HTTP 匯出、指標／跨度目錄、隱私權模型
- [診斷旗標](/zh-TW/diagnostics/flags) — 針對特定目標的偵錯記錄旗標
- [閘道記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前置詞與主控台擷取
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
