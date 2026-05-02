---
read_when:
    - 你想要將 OpenClaw 模型使用量、訊息流程或工作階段指標傳送到 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 您需要確切的指標名稱、跨度名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel Plugin (OTLP/HTTP) 將 OpenClaw 診斷資料匯出到任何 OpenTelemetry 收集器
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-05-02T20:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` Plugin 使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。任何接受 OTLP/HTTP 的收集器或後端都可無需變更程式碼直接運作。關於本機檔案記錄與如何讀取，請參閱 [記錄](/zh-TW/logging)。

## 運作方式

- **診斷事件** 是由 Gateway 和隨附 Plugin 針對模型執行、訊息流程、工作階段、佇列與執行所發出的結構化程序內記錄。
- **`diagnostics-otel` Plugin** 會訂閱這些事件，並透過 OTLP/HTTP 將它們匯出為 OpenTelemetry **指標**、**追蹤** 和 **記錄**。
- 當提供者傳輸接受自訂標頭時，**提供者呼叫** 會從 OpenClaw 受信任的模型呼叫 span 內容接收 W3C `traceparent` 標頭。Plugin 發出的追蹤內容不會傳播。
- 匯出器只有在診斷介面與 Plugin 都啟用時才會附加，因此預設情況下程序內成本會維持接近零。

## 快速開始

對於套裝安裝，請先安裝 Plugin：

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

你也可以從 CLI 啟用 Plugin：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前僅支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **指標**    | token 使用量、成本、執行持續時間、訊息流程、佇列 lane、工作階段狀態、執行與記憶體壓力的計數器和直方圖。                                    |
| **追蹤**    | 模型使用、模型呼叫、harness 生命週期、工具執行、exec、Webhook/訊息處理、內容組裝與工具迴圈的 span。                                         |
| **記錄**    | 當 `diagnostics.otel.logs` 啟用時，透過 OTLP 匯出的結構化 `logging.file` 記錄。                                                              |

可獨立切換 `traces`、`metrics` 和 `logs`。當 `diagnostics.otel.enabled` 為 true 時，三者預設皆啟用。

## 組態參考

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 環境變數

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，則會原樣使用。                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 當對應的 `diagnostics.otel.*Endpoint` 組態鍵未設定時使用的訊號專用端點覆寫。訊號專用組態優先於訊號專用環境變數，而訊號專用環境變數又優先於共用端點。                         |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫線路協定（目前僅採用 `http/protobuf`）。                                                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental`，以發出最新的實驗性 GenAI span 屬性 (`gen_ai.provider.name`)，而不是舊版 `gen_ai.system`。GenAI 指標無論如何都會使用有界且低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個 preload 或主機程序已註冊全域 OpenTelemetry SDK 時設為 `1`。Plugin 接著會略過自己的 NodeSDK 生命週期，但仍會接線診斷監聽器並遵循 `traces`/`metrics`/`logs`。          |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 會攜帶有界識別碼（channel、provider、model、error category、僅雜湊的 request ids），且絕不包含提示文字、回應文字、工具輸入、工具輸出或工作階段金鑰。

對外模型請求可能包含 W3C `traceparent` 標頭。該標頭只會從作用中模型呼叫的 OpenClaw 擁有診斷追蹤內容產生。既有由呼叫端提供的 `traceparent` 標頭會被取代，因此 Plugin 或自訂提供者選項無法偽造跨服務追蹤祖先關係。

只有在你的收集器與保留政策已核准可處理提示、回應、工具或系統提示文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都可獨立選擇啟用：

- `inputMessages` — 使用者提示內容。
- `outputMessages` — 模型回應內容。
- `toolInputs` — 工具引數 payload。
- `toolOutputs` — 工具結果 payload。
- `systemPrompt` — 組裝後的系統/開發者提示。

當任何子鍵啟用時，模型與工具 span 只會針對該類別取得有界且已遮蔽的 `openclaw.content.*` 屬性。

## 取樣與清除

- **追蹤：** `diagnostics.otel.sampleRate`（僅 root-span，`0.0` 會捨棄全部，`1.0` 會保留全部）。
- **指標：** `diagnostics.otel.flushIntervalMs`（最低 `1000`）。
- **記錄：** OTLP 記錄會遵循 `logging.level`（檔案記錄層級）。它們使用診斷記錄的遮蔽路徑，而非主控台格式化。高流量安裝應優先使用 OTLP 收集器取樣/篩選，而不是本機取樣。
- **檔案記錄關聯：** 當記錄呼叫攜帶有效的診斷追蹤內容時，JSONL 檔案記錄會包含頂層 `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，讓記錄處理器可將本機記錄行與匯出的 span 串接。
- **請求關聯：** Gateway HTTP 請求與 WebSocket frame 會建立內部請求追蹤範圍。該範圍內的記錄與診斷事件預設會繼承請求追蹤，而 agent 執行與模型呼叫 span 會建立為子項，因此提供者 `traceparent` 標頭會保持在同一個追蹤上。

## 匯出的指標

### 模型使用

- `openclaw.tokens`（counter，attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`）
- `openclaw.cost.usd`（counter，attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.run.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（histogram，attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `gen_ai.client.token.usage`（histogram，GenAI 語意慣例指標，attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`）
- `gen_ai.client.operation.duration`（histogram，秒，GenAI 語意慣例指標，attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（histogram，attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`，以及已分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（histogram，最終模型請求 payload 的 UTF-8 位元組大小；不含原始 payload 內容）
- `openclaw.model_call.response_bytes`（histogram，串流模型回應事件的 UTF-8 位元組大小；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（histogram，第一個串流回應事件前經過的時間）

### 訊息流程

- `openclaw.webhook.received`（counter，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.error`（counter，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.message.queued`（counter，attrs: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.processed`（counter，attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.delivery.started`（counter，attrs: `openclaw.channel`, `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`）

### 佇列與工作階段

- `openclaw.queue.lane.enqueue`（counter，attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter，attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram，attrs: `openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram，attrs: `openclaw.lane`）
- `openclaw.session.state`（counter，attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter，attrs: `openclaw.state`；僅針對沒有作用中工作的陳舊工作階段簿記發出）
- `openclaw.session.stuck_age_ms`（histogram，attrs: `openclaw.state`；僅針對沒有作用中工作的陳舊工作階段簿記發出）
- `openclaw.run.attempt`（counter，attrs: `openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活診斷的無進度時間門檻。當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP 執行階段進度時，`processing` 工作階段不會朝此門檻累積時間。輸入中 keepalive 不會計為進度，因此仍可偵測到靜默的模型或 harness。

OpenClaw 會依據仍可觀察到的工作來分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫仍在取得進展。
- `session.stalled`：存在作用中的工作，但作用中的執行最近沒有回報進展。
- `session.stuck`：沒有作用中工作的過期工作階段簿記。這是唯一會釋放受影響工作階段通道的存活性分類。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck` span。重複的 `session.stuck` 診斷會在工作階段保持不變時退避，因此儀表板應針對持續增加發出警示，而不是針對每個 Heartbeat tick 發出警示。如需設定旋鈕與預設值，請參閱[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

### Harness 生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、錯誤時的 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部機制（記憶體與工具迴圈）

- `openclaw.memory.heap_used_bytes`（直方圖，屬性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方圖）
- `openclaw.memory.pressure`（計數器，屬性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（計數器，屬性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方圖，屬性：`openclaw.toolName`、`openclaw.outcome`）

## 匯出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 預設為 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設為 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 錯誤時的 `openclaw.errorCategory` 與可選的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供者請求 id 的有界 SHA 雜湊；不會匯出原始 id）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、可選的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、`openclaw.messageId`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含 prompt、history、response 或 session-key 內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含迴圈訊息、params 或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型與工具 span 也可以針對你選用的特定內容類別，包含有界且經遮蔽的 `openclaw.content.*` 屬性。

## 診斷事件目錄

以下事件支援上述 metrics 與 span。Plugin 也可以不透過 OTLP 匯出而直接訂閱這些事件。

**模型用量**

- `model.usage` — token、成本、持續時間、context、提供者/模型/channel、工作階段 id。`usage` 是提供者/回合層級的成本與遙測計算；`context.used` 是目前的 prompt/context 快照，當涉及快取輸入或工具迴圈呼叫時，可能低於提供者的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：webhooks/queue/session）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — agent harness 的每次執行生命週期。包含 `harnessId`、可選的 `pluginId`、提供者/模型/channel，以及執行 id。完成時會加入 `durationMs`、`outcome`、可選的 `resultClassification`、`yieldDetected` 與 `itemLifecycle` 計數。錯誤會加入 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及可選的 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 終端結果、持續時間、目標、模式、結束碼與失敗種類。不包含命令文字與工作目錄。

## 沒有 exporter 時

你可以不執行 `diagnostics-otel`，仍讓 Plugin 或自訂 sink 可使用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

如需在不提高 `logging.level` 的情況下輸出目標式除錯內容，請使用診斷旗標。旗標不區分大小寫，且支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的 env 覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準日誌檔案（`logging.file`），且仍會由 `logging.redactSensitive` 遮蔽。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以將 `diagnostics-otel` 排除在 `plugins.allow` 之外，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [日誌](/zh-TW/logging) — 檔案日誌、主控台輸出、CLI tailing，以及 Control UI Logs 分頁
- [Gateway 日誌內部機制](/zh-TW/gateway/logging) — WS 日誌樣式、子系統前綴，以及主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式除錯日誌旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) — 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
