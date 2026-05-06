---
read_when:
    - 你想要將 OpenClaw 模型使用量、訊息流程或工作階段指標傳送至 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 你需要確切的指標名稱、追蹤區段名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel Plugin（OTLP/HTTP）將 OpenClaw 診斷資料匯出到任何 OpenTelemetry 收集器
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-05-06T17:56:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` Plugin 使用 **OTLP/HTTP (protobuf)**
匯出診斷資料。任何接受 OTLP/HTTP 的 collector 或後端都可在不修改程式碼的情況下運作。若要了解本機檔案記錄以及如何讀取它們，請參閱
[記錄](/zh-TW/logging)。

## 運作方式

- **診斷事件** 是由 Gateway 和隨附 Plugin 在處理 model 執行、訊息流程、session、queue
  和 exec 時發出的結構化、程序內記錄。
- **`diagnostics-otel` Plugin** 會訂閱這些事件，並透過 OTLP/HTTP 將它們匯出為
  OpenTelemetry **metrics**、**traces** 和 **logs**。
- 當 provider 傳輸接受自訂標頭時，**Provider 呼叫** 會從 OpenClaw 的
  受信任 model-call span context 收到 W3C `traceparent` 標頭。Plugin 發出的 trace context 不會被傳播。
- 只有在診斷介面和 Plugin 都啟用時，exporter 才會附加，因此程序內成本預設會維持接近零。

## 快速開始

對於封裝安裝，請先安裝 Plugin：

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

| 訊號        | 內容                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | token 使用量、成本、執行時間、訊息流程、Talk 事件、queue lane、session 狀態/復原、exec 和記憶體壓力的計數器與直方圖。                                  |
| **Traces**  | model 使用量、model 呼叫、harness 生命週期、tool 執行、exec、webhook/訊息處理、context 組裝和 tool loop 的 span。                                      |
| **Logs**    | 啟用 `diagnostics.otel.logs` 時，透過 OTLP 匯出的結構化 `logging.file` 記錄。                                                                            |

可以獨立切換 `traces`、`metrics` 和 `logs`。當 `diagnostics.otel.enabled`
為 true 時，這三者預設都會開啟。

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，則會依原樣使用。                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 當相符的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的訊號專用 endpoint 覆寫。訊號專用設定優先於訊號專用 env，而訊號專用 env 又優先於共用 endpoint。                    |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫 wire protocol（目前只會採用 `http/protobuf`）。                                                                                                                                                                                      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 以發出最新的實驗性 GenAI span 屬性（`gen_ai.provider.name`），而不是舊版 `gen_ai.system`。無論如何，GenAI metrics 都會使用有界、低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個 preload 或 host 程序已註冊全域 OpenTelemetry SDK 時設為 `1`。Plugin 接著會略過自己的 NodeSDK 生命週期，但仍會接線診斷 listener，並遵循 `traces`/`metrics`/`logs`。   |

## 隱私與內容擷取

原始 model/tool 內容預設**不會**匯出。Span 會攜帶有界識別碼
（channel、provider、model、錯誤類別、僅雜湊的 request id），且絕不包含 prompt 文字、response 文字、tool input、tool output 或
session key。
Talk metrics 只會匯出有界事件中繼資料，例如 mode、transport、provider
和 event type。它們不會包含 transcript、audio payload、session id、turn id、call id、room id 或 handoff token。

對外 model request 可能包含 W3C `traceparent` 標頭。該標頭只會從目前作用中 model
call 的 OpenClaw 所有診斷 trace context 產生。既有的呼叫者提供 `traceparent` 標頭會被取代，因此 Plugin 或
自訂 provider option 無法偽造跨服務 trace ancestry。

只有當你的 collector 和保留政策已核准用於 prompt、response、tool 或 system-prompt
文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都需獨立選擇加入：

- `inputMessages` - 使用者 prompt 內容。
- `outputMessages` - model response 內容。
- `toolInputs` - tool argument payload。
- `toolOutputs` - tool result payload。
- `systemPrompt` - 組裝後的 system/developer prompt。

啟用任何子鍵時，model 和 tool span 只會針對該類別取得有界、已遮蔽的
`openclaw.content.*` 屬性。

## 取樣與排清

- **Traces：** `diagnostics.otel.sampleRate`（僅 root-span，`0.0` 會捨棄全部，
  `1.0` 會保留全部）。
- **Metrics：** `diagnostics.otel.flushIntervalMs`（最低 `1000`）。
- **Logs：** OTLP logs 會遵循 `logging.level`（檔案記錄層級）。它們使用
  診斷 log-record 遮蔽路徑，而不是 console 格式化。高流量
  安裝應優先使用 OTLP collector 取樣/篩選，而不是本機取樣。
- **檔案記錄關聯：** 當 log call 攜帶有效的
  診斷 trace context 時，JSONL 檔案記錄會包含頂層 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓 log processor 能將本機記錄行與
  匯出的 span 連接。
- **Request 關聯：** Gateway HTTP request 和 WebSocket frame 會建立
  內部 request trace scope。該 scope 內的 log 和診斷事件
  預設會繼承 request trace，而 agent run 和 model-call span 會
  建立為子項，讓 provider `traceparent` 標頭維持在同一個 trace 上。

## 匯出的 metrics

### Model 使用量

- `openclaw.tokens`（counter，attrs：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（counter，attrs：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（histogram，attrs：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（histogram，attrs：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（histogram，GenAI semantic-conventions metric，attrs：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（histogram，秒，GenAI semantic-conventions metric，attrs：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可選 `error.type`）
- `openclaw.model_call.duration_ms`（histogram，attrs：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（histogram，最終 model request payload 的 UTF-8 byte size；不含原始 payload 內容）
- `openclaw.model_call.response_bytes`（histogram，串流 model response event 的 UTF-8 byte size；不含原始 response 內容）
- `openclaw.model_call.time_to_first_byte_ms`（histogram，第一個串流 response event 前經過的時間）

### 訊息流程

- `openclaw.webhook.received`（counter，attrs：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（counter，attrs：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram，attrs：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（counter，attrs：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（counter，attrs：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram，attrs：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（counter，attrs：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（histogram，attrs：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### Talk

- `openclaw.talk.event`（counter，attrs：`openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（histogram，attrs：同 `openclaw.talk.event`；當 Talk event 回報 duration 時發出）
- `openclaw.talk.audio.bytes`（histogram，attrs：同 `openclaw.talk.event`；針對回報 byte length 的 Talk audio frame event 發出）

### Queue 與 session

- `openclaw.queue.lane.enqueue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.depth`（直方圖，屬性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方圖，屬性：`openclaw.lane`）
- `openclaw.session.state`（計數器，屬性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；只會在沒有作用中工作的過期工作階段簿記中發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；只會在沒有作用中工作的過期工作階段簿記中發出）
- `openclaw.session.recovery.requested`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方圖，屬性：與相符的復原計數器相同）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活性遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活性診斷的無進度時間閾值。當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP 執行階段進度時，`processing` 工作階段不會朝此閾值累積時間。輸入狀態 keepalive 不計為進度，因此靜默的模型或測試工具仍可被偵測到。

OpenClaw 會依仍可觀察到的工作來分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫仍在取得進度。
- `session.stalled`：存在作用中工作，但作用中的執行最近沒有回報進度。停滯的嵌入式執行一開始會維持僅觀察，接著在經過 `diagnostics.stuckSessionAbortMs` 且沒有進度後中止並清空，讓同一 lane 後方排隊的 turn 可以繼續。未設定時，中止閾值預設為較安全的延長視窗，至少為 10 分鐘且為 `diagnostics.stuckSessionWarnMs` 的 5 倍。
- `session.stuck`：沒有作用中工作的過期工作階段簿記。這會立即釋放受影響的工作階段 lane。

復原會發出結構化的 `session.recovery.requested` 和 `session.recovery.completed` 事件。診斷工作階段狀態只有在發生變更型復原結果（`aborted` 或 `released`）後，且相同的處理世代仍為目前世代時，才會標記為閒置。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck` span。當工作階段保持不變時，重複的 `session.stuck` 診斷會退避，因此儀表板應針對持續增加發出警示，而不是針對每個 Heartbeat tick 發出警示。如需設定旋鈕與預設值，請參閱[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

### 測試工具生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，錯誤時為 `openclaw.harness.phase`）

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
  - 預設使用 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設使用 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 錯誤時包含 `openclaw.errorCategory` 和選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游 provider 請求 ID 的有界 SHA 型雜湊；不會匯出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含 prompt、history、response 或 session-key 內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型與工具 span 也可以包含你選用之特定內容類別的有界、已遮蔽 `openclaw.content.*` 屬性。

## 診斷事件目錄

以下事件支援上方的指標和 span。Plugin 也可以不透過 OTLP 匯出而直接訂閱它們。

**模型用量**

- `model.usage` - token、成本、持續時間、context、provider/model/channel、工作階段 ID。`usage` 是 provider/turn 的成本與遙測計量；`context.used` 是目前的 prompt/context 快照，在涉及快取輸入或工具迴圈呼叫時，可能低於 provider `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：Webhook/queue/session）

**測試工具生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - agent 測試工具的每次執行生命週期。包含 `harnessId`、選用的 `pluginId`、provider/model/channel，以及執行 ID。完成時會加入 `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，以及 `itemLifecycle` 計數。錯誤時會加入 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、結束碼，以及失敗種類。不包含命令文字與工作目錄。

## 沒有 exporter 時

你可以在不執行 `diagnostics-otel` 的情況下，讓診斷事件可供 Plugin 或自訂接收端使用：

```json5
{
  diagnostics: { enabled: true },
}
```

若要在不提高 `logging.level` 的情況下輸出目標式除錯內容，請使用診斷旗標。旗標不區分大小寫，並支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的 env 覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），且仍會由 `logging.redactSensitive` 遮蔽。完整指南：[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以將 `diagnostics-otel` 排除在 `plugins.allow` 之外，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) - 檔案記錄、控制台輸出、CLI tailing，以及 Control UI Logs 分頁
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前綴，以及控制台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 目標式除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - operator support-bundle 工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 欄位參考
