---
read_when:
    - 您想要將 OpenClaw 模型使用情況、訊息流程或工作階段指標傳送至 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 您需要確切的指標名稱、span 名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel Plugin（OTLP/HTTP）將 OpenClaw 診斷資料匯出到任何 OpenTelemetry 收集器
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-05-04T02:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` Plugin
使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。任何接受 OTLP/HTTP
的收集器或後端都能在不修改程式碼的情況下運作。如需本機檔案記錄及其讀取方式，請參閱
[記錄](/zh-TW/logging)。

## 整體如何搭配運作

- **診斷事件** 是由 Gateway 和內建 Plugin 在程序內發出的結構化記錄，
  用於模型執行、訊息流程、工作階段、佇列和 exec。
- **`diagnostics-otel` Plugin** 會訂閱這些事件，並透過 OTLP/HTTP 將它們匯出為
  OpenTelemetry **指標**、**追蹤** 和 **記錄**。
- 當提供者傳輸接受自訂標頭時，**提供者呼叫** 會從 OpenClaw
  受信任的模型呼叫 span 情境收到 W3C `traceparent` 標頭。Plugin 發出的追蹤情境不會被傳播。
- 匯出器只會在診斷介面與 Plugin 都啟用時附加，因此程序內成本預設會維持接近零。

## 快速開始

對於套件化安裝，請先安裝 Plugin：

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
`protocol` 目前只支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指標**    | token 用量、成本、執行期間、訊息流程、佇列通道、工作階段狀態、exec 和記憶體壓力的計數器與直方圖。                                        |
| **追蹤**    | 模型用量、模型呼叫、harness 生命週期、工具執行、exec、webhook/訊息處理、情境組裝，以及工具迴圈的 span。                                  |
| **記錄**    | 啟用 `diagnostics.otel.logs` 時，透過 OTLP 匯出的結構化 `logging.file` 記錄。                                                               |

可分別切換 `traces`、`metrics` 和 `logs`。當
`diagnostics.otel.enabled` 為 true 時，三者預設都會開啟。

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已經包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，會依原樣使用。                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 在對應的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的特定訊號端點覆寫。特定訊號設定優先於特定訊號環境變數，而特定訊號環境變數優先於共用端點。                        |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫線路協定（目前只採用 `http/protobuf`）。                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental`，即可發出最新的實驗性 GenAI span 屬性 (`gen_ai.provider.name`)，而不是舊版 `gen_ai.system`。無論如何，GenAI 指標一律使用有界且低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個 preload 或主機程序已註冊全域 OpenTelemetry SDK 時設為 `1`。Plugin 接著會略過自己的 NodeSDK 生命週期，但仍會接線診斷監聽器，並遵守 `traces`/`metrics`/`logs`。       |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 只攜帶有界識別符
（通道、提供者、模型、錯誤類別、僅雜湊的請求 ID），
且絕不包含提示文字、回應文字、工具輸入、工具輸出或
工作階段金鑰。

傳出的模型請求可能包含 W3C `traceparent` 標頭。該標頭只會
從作用中模型呼叫的 OpenClaw 所有診斷追蹤情境產生。
既有由呼叫端提供的 `traceparent` 標頭會被取代，因此 Plugin 或
自訂提供者選項無法偽造跨服務追蹤祖先關係。

只有在你的收集器與保留政策已核准可存放提示、回應、工具或系統提示
文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。
每個子鍵都可獨立選擇啟用：

- `inputMessages` — 使用者提示內容。
- `outputMessages` — 模型回應內容。
- `toolInputs` — 工具引數承載。
- `toolOutputs` — 工具結果承載。
- `systemPrompt` — 組裝後的系統/開發者提示。

啟用任何子鍵時，模型與工具 span 只會針對該類別取得有界且經過遮蔽的
`openclaw.content.*` 屬性。

## 取樣與排清

- **追蹤：** `diagnostics.otel.sampleRate`（僅 root span，`0.0` 丟棄全部，
  `1.0` 保留全部）。
- **指標：** `diagnostics.otel.flushIntervalMs`（最低 `1000`）。
- **記錄：** OTLP 記錄會遵循 `logging.level`（檔案記錄層級）。它們使用
  診斷記錄資料的遮蔽路徑，而不是主控台格式化。高流量
  安裝應優先使用 OTLP 收集器取樣/篩選，而不是本機取樣。
- **檔案記錄關聯：** 當記錄呼叫帶有有效的診斷追蹤情境時，JSONL 檔案記錄會包含頂層
  `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，讓記錄處理器能將本機記錄行與
  匯出的 span 串接。
- **請求關聯：** Gateway HTTP 請求與 WebSocket frame 會建立
  內部請求追蹤範圍。該範圍內的記錄與診斷事件
  預設會繼承請求追蹤，而代理執行與模型呼叫 span 則會
  作為子項建立，因此提供者 `traceparent` 標頭會留在同一條追蹤上。

## 匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語意慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求承載的 UTF-8 位元組大小；不含原始承載內容）
- `openclaw.model_call.response_bytes`（直方圖，串流模型回應事件的 UTF-8 位元組大小；不含原始回應內容）
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
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；僅針對沒有作用中工作的過期工作階段簿記發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；僅針對沒有作用中工作的過期工作階段簿記發出）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活診斷的無進度時間閾值。
當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP runtime 進度時，
`processing` 工作階段不會朝此閾值累積時間。
輸入狀態 keepalive 不會算作進度，因此靜默的模型或 harness
仍可被偵測到。

OpenClaw 會依它仍可觀察到的工作分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫仍在進行。
- `session.stalled`：存在作用中的工作，但作用中的執行最近未回報進度。停滯的嵌入式執行一開始會維持僅觀察，接著在至少 10 分鐘且達到 5 倍 `diagnostics.stuckSessionWarnMs` 仍無進度後中止並清空，讓該通道後方排隊的回合可以恢復。
- `session.stuck`：沒有作用中工作的過期工作階段記帳。這會立即釋放受影響的工作階段通道。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck` span。重複的 `session.stuck` 診斷會在工作階段保持不變時退避，因此儀表板應針對持續增加發出警示，而不是每個 Heartbeat tick 都警示。如需設定旋鈕與預設值，請參閱[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

### Harness 生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，發生錯誤時包含 `openclaw.harness.phase`）

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
  - `openclaw.tokens.*`（輸入/輸出/快取讀取/快取寫入/總計）
  - 預設為 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設為 `gen_ai.system`，或在選用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 發生錯誤時包含 `openclaw.errorCategory` 與選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供者請求 ID 的有界 SHA 型雜湊；不會匯出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示、歷史、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型與工具 span 也可以包含你選用的特定內容類別之有界且已遮蔽的 `openclaw.content.*` 屬性。

## 診斷事件目錄

下列事件支援上述指標與 span。Plugin 也可以直接訂閱這些事件，而不需要 OTLP 匯出。

**模型用量**

- `model.usage` — token、成本、持續時間、內容、提供者/模型/頻道、工作階段 ID。`usage` 是用於成本與遙測的提供者/回合計帳；`context.used` 是目前的提示/內容快照，當涉及快取輸入或工具迴圈呼叫時，可能低於提供者的 `usage.total`。

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — 代理 harness 的每次執行生命週期。包含 `harnessId`、選用的 `pluginId`、提供者/模型/頻道，以及執行 ID。完成時會新增 `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，以及 `itemLifecycle` 計數。錯誤會新增 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及選用的 `cleanupFailed`。

**執行**

- `exec.process.completed` — 終端結果、持續時間、目標、模式、結束碼與失敗種類。不包含命令文字與工作目錄。

## 不使用匯出器

你可以不執行 `diagnostics-otel`，仍讓診斷事件可供 Plugin 或自訂接收端使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如需在不提高 `logging.level` 的情況下取得目標式除錯輸出，請使用診斷旗標。旗標不區分大小寫，並支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境覆寫：

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

你也可以將 `diagnostics-otel` 排除於 `plugins.allow` 之外，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) — 檔案記錄、主控台輸出、CLI tail，以及 Control UI 記錄分頁
- [Gateway 記錄內部機制](/zh-TW/gateway/logging) — WS 記錄樣式、子系統前綴與主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) — 目標式除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) — 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 欄位參考
