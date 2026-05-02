---
read_when:
    - 你想將 OpenClaw 模型使用量、訊息流程或工作階段指標傳送到 OpenTelemetry 收集器
    - 你正在將追蹤資料、指標或日誌串接到 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 你需要確切的指標名稱、追蹤區段名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel Plugin 將 OpenClaw 診斷資料匯出至任何 OpenTelemetry 收集器 (OTLP/HTTP)
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-05-02T02:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: be58bb48f06e72b5b08d21bf37c0dcc218be8e4c0030b074523794be01f2611a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 會透過隨附的 `diagnostics-otel` Plugin
使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。任何接受 OTLP/HTTP
的收集器或後端都能無須修改程式碼即可運作。如需本機檔案日誌及其讀取方式，請參閱
[日誌](/zh-TW/logging)。

## 如何串接運作

- **診斷事件**是由 Gateway 和隨附 Plugin 在處理模型執行、訊息流程、工作階段、佇列
  與 exec 時於程序內發出的結構化記錄。
- **`diagnostics-otel` Plugin**會訂閱這些事件，並將其匯出為 OpenTelemetry **指標**、**追蹤**和**日誌**，透過 OTLP/HTTP 傳送。
- 當提供者傳輸層接受自訂標頭時，**提供者呼叫**會從 OpenClaw
  受信任的模型呼叫 span 內容接收 W3C `traceparent` 標頭。Plugin 發出的追蹤內容不會被傳播。
- 只有在診斷介面與 Plugin 都已啟用時，匯出器才會附加，因此預設情況下程序內成本會維持接近零。

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

你也可以從 CLI 啟用這個 Plugin：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前只支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指標**    | 針對 token 使用量、成本、執行持續時間、訊息流程、佇列通道、工作階段狀態、exec 與記憶體壓力的計數器與直方圖。                              |
| **追蹤**    | 針對模型使用量、模型呼叫、harness 生命週期、工具執行、exec、webhook/訊息處理、內容組裝與工具迴圈的 span。                                  |
| **日誌**    | 當 `diagnostics.otel.logs` 啟用時，透過 OTLP 匯出的結構化 `logging.file` 記錄。                                                             |

可分別切換 `traces`、`metrics` 和 `logs`。當 `diagnostics.otel.enabled`
為 true 時，三者預設都會開啟。

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

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，則會原樣使用。                                                                    |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 在相符的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的訊號專屬端點覆寫。訊號專屬設定優先於訊號專屬環境變數，後者又優先於共用端點。                                     |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫傳輸協定（目前只採用 `http/protobuf`）。                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 時，會發出最新實驗性 GenAI span 屬性 (`gen_ai.provider.name`)，而不是舊版 `gen_ai.system`。GenAI 指標一律使用有界、低基數的語意屬性。      |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個 preload 或主機程序已註冊全域 OpenTelemetry SDK 時，設為 `1`。Plugin 接著會略過自己的 NodeSDK 生命週期，但仍會串接診斷監聽器，並遵循 `traces`/`metrics`/`logs`。     |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 會攜帶有界識別碼
（通道、提供者、模型、錯誤類別、僅雜湊的請求 ID），且絕不包含提示文字、回應文字、工具輸入、工具輸出或
工作階段金鑰。

對外模型請求可能會包含 W3C `traceparent` 標頭。該標頭只會由作用中模型
呼叫的 OpenClaw 所有診斷追蹤內容產生。既有呼叫端提供的 `traceparent`
標頭會被取代，因此 Plugin 或自訂提供者選項無法偽造跨服務追蹤祖先關係。

只有在你的收集器和保留政策已核准可處理提示、回應、工具或系統提示
文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都會獨立選擇啟用：

- `inputMessages` — 使用者提示內容。
- `outputMessages` — 模型回應內容。
- `toolInputs` — 工具引數 payload。
- `toolOutputs` — 工具結果 payload。
- `systemPrompt` — 組裝後的系統/開發者提示。

啟用任何子鍵時，模型與工具 span 只會針對該類別取得有界、已遮罩的
`openclaw.content.*` 屬性。

## 取樣與清空

- **追蹤：**`diagnostics.otel.sampleRate`（僅 root span，`0.0` 會丟棄全部，
  `1.0` 會保留全部）。
- **指標：**`diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日誌：**OTLP 日誌會遵循 `logging.level`（檔案日誌層級）。它們使用
  診斷日誌記錄遮罩路徑，而非主控台格式化。高流量安裝應優先使用 OTLP 收集器取樣/篩選，而不是本機取樣。
- **檔案日誌關聯：**當日誌呼叫帶有有效的診斷追蹤內容時，JSONL 檔案日誌會包含頂層 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌列與
  匯出的 span 串接。
- **請求關聯：**Gateway HTTP 請求與 WebSocket frame 會建立
  內部請求追蹤範圍。該範圍內的日誌與診斷事件預設會繼承請求追蹤，而代理程式執行與模型呼叫 span
  會建立為子項，讓提供者 `traceparent` 標頭留在同一個追蹤中。

## 匯出的指標

### 模型使用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語意慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求 payload 的 UTF-8 位元組大小；不含原始 payload 內容）
- `openclaw.model_call.response_bytes`（直方圖，串流模型回應事件的 UTF-8 位元組大小；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前的經過時間）

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
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；只會針對沒有作用中工作的過時工作階段 bookkeeping 發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；只會針對沒有作用中工作的過時工作階段 bookkeeping 發出）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活診斷的無進度時間門檻。當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP 執行階段進度時，`processing` 工作階段不會朝此門檻累積時間。
輸入中 keepalive 不會計為進度，因此沉默的模型或 harness 仍可被偵測到。

OpenClaw 會依它仍能觀察到的工作來分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫仍在取得進展。
- `session.stalled`：存在作用中的工作，但作用中的執行最近未回報進展。
- `session.stuck`：過時的工作階段記錄，且沒有作用中的工作。這是唯一會釋放受影響工作階段通道的存活性分類。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck` span。當工作階段維持不變時，重複的 `session.stuck` 診斷會退避，因此儀表板應針對持續增加發出警示，而不是對每個 Heartbeat 計時點發出警示。如需設定旋鈕與預設值，請參閱[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

### Harness 生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，錯誤時包含 `openclaw.harness.phase`）

### 執行

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
  - 預設為 `gen_ai.system`，或在選擇使用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設為 `gen_ai.system`，或在選擇使用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 錯誤時包含 `openclaw.errorCategory` 和選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游供應商請求 ID 的有界 SHA 雜湊；不會匯出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不含提示、歷史、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型和工具 span 也可以包含你已選擇加入之特定內容類別的有界、已遮蔽 `openclaw.content.*` 屬性。

## 診斷事件目錄

以下事件支援上方的指標與 span。Plugin 也可以不透過 OTLP 匯出而直接訂閱這些事件。

**模型用量**

- `model.usage` — 權杖、成本、持續時間、內容、供應商/模型/頻道、工作階段 ID。`usage` 是供應商/回合層級的成本與遙測計算；`context.used` 是目前的提示/內容快照，當涉及快取輸入或工具迴圈呼叫時，可能低於供應商的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：Webhook/佇列/工作階段）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — agent harness 的每次執行生命週期。包含 `harnessId`、選用的 `pluginId`、供應商/模型/頻道，以及執行 ID。完成時會新增 `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，以及 `itemLifecycle` 計數。錯誤時會新增 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及選用的 `cleanupFailed`。

**執行**

- `exec.process.completed` — 終端結果、持續時間、目標、模式、退出碼與失敗種類。不包含命令文字和工作目錄。

## 沒有匯出器時

你可以在不執行 `diagnostics-otel` 的情況下，讓診斷事件可供 Plugin 或自訂接收端使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如需有針對性的除錯輸出，而不提高 `logging.level`，請使用診斷旗標。旗標不分大小寫，並支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），並且仍會由 `logging.redactSensitive` 遮蔽。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不將 `diagnostics-otel` 加入 `plugins.allow`，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) — 檔案記錄、主控台輸出、CLI tailing，以及 Control UI Logs 分頁
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴與主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) — 有針對性的除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) — 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
