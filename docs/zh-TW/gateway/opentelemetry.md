---
read_when:
    - 你想將 OpenClaw 模型使用量、訊息流程或工作階段指標傳送至 OpenTelemetry 收集器
    - 您正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 你需要確切的指標名稱、span 名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel Plugin（OTLP/HTTP），將 OpenClaw 診斷資料匯出到任何 OpenTelemetry 收集器
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-04-30T03:08:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過內建的 `diagnostics-otel` Plugin 使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。任何接受 OTLP/HTTP 的收集器或後端都可在不變更程式碼的情況下運作。如需本機檔案記錄以及如何讀取它們，請參閱 [記錄](/zh-TW/logging)。

## 如何搭配運作

- **診斷事件** 是由 Gateway 與內建 Plugin 在程序內發出的結構化記錄，用於模型執行、訊息流程、工作階段、佇列與 exec。
- **`diagnostics-otel` Plugin** 會訂閱這些事件，並透過 OTLP/HTTP 將它們匯出為 OpenTelemetry **指標**、**追蹤**與**記錄**。
- 當提供者傳輸層接受自訂標頭時，**提供者呼叫** 會從 OpenClaw 受信任的模型呼叫 span 內容接收 W3C `traceparent` 標頭。Plugin 發出的追蹤內容不會被傳播。
- 只有在診斷介面與 Plugin 都啟用時，匯出器才會附加，因此預設情況下程序內成本會保持接近零。

## 快速開始

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
`protocol` 目前只支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 其中包含的內容                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指標**    | 權杖用量、成本、執行持續時間、訊息流程、佇列 lane、工作階段狀態、exec 與記憶體壓力的計數器與直方圖。                                      |
| **追蹤**    | 模型用量、模型呼叫、harness 生命週期、工具執行、exec、webhook/訊息處理、內容組裝與工具迴圈的 span。                                      |
| **記錄**    | 啟用 `diagnostics.otel.logs` 時，透過 OTLP 匯出的結構化 `logging.file` 記錄。                                                              |

可獨立切換 `traces`、`metrics` 與 `logs`。當 `diagnostics.otel.enabled` 為 true 時，三者預設皆為開啟。

## 設定參考

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 當相符的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的訊號專屬端點覆寫。訊號專屬設定優先於訊號專屬環境變數，而訊號專屬環境變數又優先於共用端點。                      |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫線路協定（目前只會採用 `http/protobuf`）。                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 時，會發出最新的實驗性 GenAI span 屬性 (`gen_ai.provider.name`)，而不是舊版 `gen_ai.system`。GenAI 指標無論如何都會使用有界、低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個預載或主機程序已註冊全域 OpenTelemetry SDK 時設為 `1`。Plugin 接著會跳過自己的 NodeSDK 生命週期，但仍會連接診斷監聽器並遵循 `traces`/`metrics`/`logs`。              |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 會攜帶有界識別碼（channel、provider、model、錯誤類別、僅雜湊的請求 id），且絕不包含提示文字、回應文字、工具輸入、工具輸出或工作階段金鑰。

對外的模型請求可能包含 W3C `traceparent` 標頭。該標頭只會由作用中模型呼叫的 OpenClaw 擁有診斷追蹤內容產生。現有呼叫方提供的 `traceparent` 標頭會被替換，因此 Plugin 或自訂提供者選項無法偽造跨服務追蹤祖先關係。

只有在你的收集器與保留政策已核准可處理提示、回應、工具或系統提示文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都需獨立選擇啟用：

- `inputMessages` — 使用者提示內容。
- `outputMessages` — 模型回應內容。
- `toolInputs` — 工具引數 payload。
- `toolOutputs` — 工具結果 payload。
- `systemPrompt` — 組裝後的系統/開發者提示。

啟用任何子鍵時，模型與工具 span 只會針對該類別取得有界且已遮蔽的 `openclaw.content.*` 屬性。

## 取樣與排清

- **追蹤：** `diagnostics.otel.sampleRate`（僅 root-span，`0.0` 會全部捨棄，`1.0` 會全部保留）。
- **指標：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **記錄：** OTLP 記錄會遵循 `logging.level`（檔案記錄層級）。它們使用診斷記錄項目的遮蔽路徑，而非主控台格式化。高流量安裝應偏好 OTLP 收集器取樣/篩選，而不是本機取樣。
- **檔案記錄關聯：** 當記錄呼叫攜帶有效的診斷追蹤內容時，JSONL 檔案記錄會包含最上層 `traceId`、`spanId`、`parentSpanId` 與 `traceFlags`，讓記錄處理器能將本機記錄行與匯出的 span 連接起來。
- **請求關聯：** Gateway HTTP 請求與 WebSocket frame 會建立內部請求追蹤範圍。該範圍內的記錄與診斷事件預設會繼承請求追蹤，而 agent 執行與模型呼叫 span 會建立為子項，讓提供者 `traceparent` 標頭保持在同一個追蹤上。

## 匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語意慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 與 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求 payload 的 UTF-8 位元組大小；不包含原始 payload 內容）
- `openclaw.model_call.response_bytes`（直方圖，串流模型回應事件的 UTF-8 位元組大小；不包含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前經過的時間）

### 訊息流程

- `openclaw.webhook.received`（計數器，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（計數器，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（計數器，屬性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（計數器，屬性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（計數器，屬性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### 佇列與工作階段

- `openclaw.queue.lane.enqueue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.depth`（直方圖，屬性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方圖，屬性：`openclaw.lane`）
- `openclaw.session.state`（計數器，屬性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### Harness 生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，錯誤上為 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部（記憶體與工具迴圈）

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
  - 發生錯誤時包含 `openclaw.errorCategory`，以及選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供者請求 ID 的有界 SHA 雜湊；不匯出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示、歷史、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型與工具 span 也可以
包含你選用的特定內容類別的有界、已遮罩 `openclaw.content.*` 屬性。

## 診斷事件目錄

下列事件支援上述指標與 span。Plugin 也可以不透過 OTLP 匯出而直接訂閱這些事件。

**模型用量**

- `model.usage` — token、成本、持續時間、上下文、提供者/模型/頻道、
  工作階段 ID。`usage` 是提供者/回合的成本與遙測帳務；
  `context.used` 是目前的提示/上下文快照，當涉及快取輸入或工具迴圈呼叫時，
  可能低於提供者的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（彙總計數器：Webhook/佇列/工作階段）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  代理 harness 的每次執行生命週期。包含 `harnessId`、選用的
  `pluginId`、提供者/模型/頻道，以及執行 ID。完成時會加入
  `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，
  以及 `itemLifecycle` 計數。錯誤會加入 `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及
  選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 終端結果、持續時間、目標、模式、結束
  代碼，以及失敗類型。不包含命令文字與工作目錄。

## 沒有匯出器

你可以在不執行 `diagnostics-otel` 的情況下，讓診斷事件可供 Plugin 或自訂接收器使用：

```json5
{
  diagnostics: { enabled: true },
}
```

若要在不提高 `logging.level` 的情況下輸出目標式偵錯資訊，請使用診斷
旗標。旗標不區分大小寫，並支援萬用字元（例如 `telegram.*` 或
`*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），且仍會由
`logging.redactSensitive` 遮罩。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不將 `diagnostics-otel` 放入 `plugins.allow`，或執行
`openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) — 檔案記錄、主控台輸出、CLI 追蹤，以及 Control UI Logs 分頁
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴，以及主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式偵錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) — 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 欄位參考
