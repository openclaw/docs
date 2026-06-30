---
read_when:
    - 你想要將 OpenClaw 模型用量、訊息流程或工作階段指標傳送到 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端。
    - 你需要確切的指標名稱、span 名稱或屬性形狀，才能建立儀表板或警示
summary: 透過 diagnostics-otel 外掛將 OpenClaw 診斷資料匯出至 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-06-30T13:48:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` 外掛使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。日誌也可以 stdout JSONL 寫入，供容器與沙箱日誌管線使用。任何接受 OTLP/HTTP 的收集器或後端都可不需變更程式碼直接運作。若要了解本機檔案日誌以及如何讀取，請參閱[日誌](/zh-TW/logging)。

## 如何串接運作

- **診斷事件**是由閘道與隨附外掛在行程內發出的結構化記錄，用於模型執行、訊息流程、工作階段、佇列與 exec。
- **`diagnostics-otel` 外掛**會訂閱這些事件，並透過 OTLP/HTTP 將其匯出為 OpenTelemetry **指標**、**追蹤**與**日誌**。它也可以將診斷日誌記錄鏡像輸出為 stdout JSONL。
- 當供應商傳輸支援自訂標頭時，**供應商呼叫**會從 OpenClaw 受信任的模型呼叫 span 情境收到 W3C `traceparent` 標頭。外掛發出的追蹤情境不會被傳播。
- 匯出器只有在診斷介面與外掛都啟用時才會附加，因此預設情況下，行程內成本會維持接近於零。

## 快速開始

若是封裝安裝，請先安裝外掛：

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

你也可以從命令列介面啟用外掛：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前僅支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **指標**    | 權杖用量、成本、執行持續時間、容錯移轉、skill 使用量、訊息流程、通話事件、佇列通道、工作階段狀態/復原、工具執行、過大酬載、exec 與記憶體壓力的計數器與直方圖。 |
| **追蹤**    | 模型使用量、模型呼叫、harness 生命週期、skill 使用量、工具執行、exec、網路鉤子/訊息處理、情境組裝與工具迴圈的 span。                                                            |
| **日誌**    | 當 `diagnostics.otel.logs` 啟用時，透過 OTLP 或 stdout JSONL 匯出的結構化 `logging.file` 記錄；除非明確啟用內容擷取，否則會保留不匯出日誌本文。                                |

可獨立切換 `traces`、`metrics` 與 `logs`。當 `diagnostics.otel.enabled` 為 true 時，追蹤與指標預設開啟。日誌預設關閉，且只有在 `diagnostics.otel.logs` 明確為 `true` 時才會匯出。日誌匯出預設使用 OTLP；將 `diagnostics.otel.logsExporter` 設為 `stdout` 可在 stdout 輸出 JSONL，或設為 `both` 將每筆診斷日誌記錄同時送到 OTLP 與 stdout。

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### 環境變數

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，會依原樣使用。                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 當相符的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的訊號專用端點覆寫。訊號專用設定優先於訊號專用環境變數，而訊號專用環境變數又優先於共用端點。                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫線路通訊協定（目前僅接受 `http/protobuf`）。                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 以發出最新的實驗性 GenAI 推論 span 形狀，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span 種類，以及以 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。無論如何，GenAI 指標一律使用有界、低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個預載或主機行程已註冊全域 OpenTelemetry SDK 時設為 `1`。此外掛接著會略過自身的 NodeSDK 生命週期，但仍會連接診斷監聽器並遵循 `traces`/`metrics`/`logs`。                                                                                                                    |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 會攜帶有界識別碼（頻道、供應商、模型、錯誤類別、僅雜湊的請求 id、工具來源、工具擁有者，以及 skill 名稱/來源），且絕不包含提示文字、回應文字、工具輸入、工具輸出、skill 檔案路徑或工作階段金鑰。OTLP 日誌記錄預設會保留嚴重性、記錄器、程式碼位置、受信任的追蹤情境與已清理屬性，但只有在 `diagnostics.otel.captureContent` 設為布林值 `true` 時，才會匯出原始日誌訊息本文。細項 `captureContent.*` 子鍵不會啟用日誌本文。看起來像具範圍 agent 工作階段金鑰的標籤會被替換為 `unknown`。
通話指標只會匯出有界事件中繼資料，例如模式、傳輸、供應商與事件類型。它們不包含逐字稿、音訊酬載、工作階段 id、回合 id、呼叫 id、房間 id 或交接權杖。

對外模型請求可能包含 W3C `traceparent` 標頭。該標頭只會從作用中模型呼叫的 OpenClaw 所有診斷追蹤情境產生。既有呼叫端提供的 `traceparent` 標頭會被取代，因此外掛或自訂供應商選項無法偽造跨服務追蹤祖先。

只有在你的收集器與保留政策已獲准處理提示、回應、工具或系統提示文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都需要獨立選擇加入：

- `inputMessages` - 使用者提示內容。
- `outputMessages` - 模型回應內容。
- `toolInputs` - 工具引數酬載。
- `toolOutputs` - 工具結果酬載。
- `systemPrompt` - 組裝後的系統/開發者提示。
- `toolDefinitions` - 模型工具名稱、說明與 schema。

啟用任何子鍵時，模型與工具 span 只會針對該類別取得有界、已遮蔽的 `openclaw.content.*` 屬性。只有在廣泛診斷擷取且 OTLP 日誌訊息本文也已獲准匯出時，才使用布林值 `captureContent: true`。

`toolInputs`/`toolOutputs` 內容會針對內建 agent runtime 的工具執行進行擷取（完成/錯誤 span 上的 `openclaw.content.tool_input`，以及完成 span 上的 `openclaw.content.tool_output`）。外部 harness 工具呼叫（Codex、Claude CLI）會發出沒有內容酬載的 `tool.execution.*` span。擷取的內容會在受信任、僅供監聽器使用的頻道上傳輸，且絕不會放到公開診斷事件匯流排上。

## 取樣與清除

- **追蹤：** `diagnostics.otel.sampleRate`（僅限根 span，`0.0` 會捨棄全部，
  `1.0` 會保留全部）。
- **指標：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日誌：** OTLP 日誌遵循 `logging.level`（檔案日誌層級）。它們使用
  診斷日誌記錄遮蔽路徑，而不是主控台格式化。高流量安裝應優先使用
  OTLP collector 取樣/篩選，而不是本機取樣。當你的平台已經
  將 stdout/stderr 傳送到日誌處理器，且你沒有 OTLP 日誌
  collector 時，設定 `diagnostics.otel.logsExporter: "stdout"`。
  Stdout 記錄為每行一個 JSON 物件，包含 `ts`、`signal`、
  `service.name`、嚴重性、本文、已遮蔽屬性，以及可用時受信任的追蹤欄位。
- **檔案日誌關聯：** 當日誌呼叫帶有有效的診斷追蹤內容時，JSONL 檔案日誌會包含頂層 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌行與
  匯出的 span 串接起來。
- **請求關聯：** 閘道 HTTP 請求和 WebSocket frame 會建立
  內部請求追蹤範圍。該範圍內的日誌和診斷事件
  預設會繼承請求追蹤，而 agent run 和模型呼叫 span 會
  建立為子項，讓 provider `traceparent` 標頭保持在同一個追蹤上。
- **模型呼叫關聯：** `openclaw.model.call` span 預設包含安全的 prompt
  元件大小，並在 provider 結果公開 usage 時包含每次呼叫的 token 屬性。
  `openclaw.model.usage` 仍然是用於彙總成本、內容和 channel 儀表板的 run 層級
  計量 span；當發出它的 runtime 具有受信任的追蹤內容時，它會保持在同一個診斷追蹤上。

## 匯出的指標

### 模型使用量

- `openclaw.tokens`（counter，attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`）
- `openclaw.cost.usd`（counter，attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.run.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（histogram，attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `gen_ai.client.token.usage`（histogram，GenAI 語意慣例指標，attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`）
- `gen_ai.client.operation.duration`（histogram，秒，GenAI 語意慣例指標，attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（histogram，attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（histogram，最終模型請求 payload 的 UTF-8 位元組大小；不含原始 payload 內容）
- `openclaw.model_call.response_bytes`（histogram，串流回應 chunk payload 的 UTF-8 位元組大小；高頻率文字、思考和工具呼叫 delta 僅計算增量 `delta` 位元組；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（histogram，第一個串流回應事件前經過的時間）
- `openclaw.model.failover`（counter，attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`）
- `openclaw.skill.used`（counter，attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`，選用 `openclaw.agent`，選用 `openclaw.toolName`）

### 訊息流程

- `openclaw.webhook.received`（counter，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.error`（counter，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.message.queued`（counter，attrs: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.received`（counter，attrs: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.dispatch.started`（counter，attrs: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.dispatch.completed`（counter，attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`）
- `openclaw.message.dispatch.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`）
- `openclaw.message.processed`（counter，attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.delivery.started`（counter，attrs: `openclaw.channel`, `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（histogram，attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`）

### 對話

- `openclaw.talk.event`（counter，attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（histogram，attrs: 與 `openclaw.talk.event` 相同；當 Talk 事件回報持續時間時發出）
- `openclaw.talk.audio.bytes`（histogram，attrs: 與 `openclaw.talk.event` 相同；針對回報位元組長度的 Talk 音訊 frame 事件發出）

### 佇列與工作階段

- `openclaw.queue.lane.enqueue`（counter，attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter，attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram，attrs: `openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram，attrs: `openclaw.lane`）
- `openclaw.session.state`（counter，attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter，attrs: `openclaw.state`；針對可復原的過時工作階段簿記發出）
- `openclaw.session.stuck_age_ms`（histogram，attrs: `openclaw.state`；針對可復原的過時工作階段簿記發出）
- `openclaw.session.turn.created`（counter，attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`）
- `openclaw.session.recovery.requested`（counter，attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`）
- `openclaw.session.recovery.completed`（counter，attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`）
- `openclaw.session.recovery.age_ms`（histogram，attrs: 與相符的 recovery counter 相同）
- `openclaw.run.attempt`（counter，attrs: `openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段
存活診斷的無進度時間閾值。當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP runtime 進度時，
`processing` 工作階段不會朝此閾值累積時間。
輸入中 keepalive 不會計為進度，因此靜默的模型或 harness 仍然可以被偵測到。

OpenClaw 依照仍可觀察到的工作來分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫仍在
  推進。保持靜默超過 `diagnostics.stuckSessionWarnMs` 的自有模型呼叫，
  在 `diagnostics.stuckSessionAbortMs` 之前也會回報為 long-running，
  讓緩慢或非串流模型 provider 在仍可觀察中止時，不會看起來像停滯的閘道工作階段。
- `session.stalled`：存在作用中工作，但作用中的 run 最近未回報
  進度。自有模型呼叫會在達到或超過 `diagnostics.stuckSessionAbortMs` 時，
  從 `session.long_running` 切換為 `session.stalled`；無擁有者的
  過時模型/工具活動不會被視為無害的長時間執行工作。
  停滯的嵌入式 run 一開始保持僅觀察，接著在
  `diagnostics.stuckSessionAbortMs` 後若沒有進度，會 abort-drain，
  讓 lane 後方排隊的 turn 可以恢復。未設定時，中止閾值預設為較安全的
  延長時間窗，至少為 5 分鐘且為
  `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：沒有作用中工作的過時工作階段簿記，或具有過時無擁有者模型/工具活動的閒置
  佇列工作階段。這會在復原 gate 通過後立即釋放
  受影響的工作階段 lane。

復原會發出結構化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。診斷工作階段狀態只會在
變更型復原結果（`aborted` 或 `released`）之後標記為 idle，且只有在
相同的 processing generation 仍為目前狀態時才會如此。

只有 `session.stuck` 會發出 `openclaw.session.stuck` counter、
`openclaw.session.stuck_age_ms` histogram，以及 `openclaw.session.stuck`
span。當工作階段維持不變時，重複的 `session.stuck` 診斷會退避，
因此儀表板應針對持續增加發出警示，而不是針對每個
心跳偵測 tick。關於設定旋鈕和預設值，請參閱
[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

存活警告也會發出：

- `openclaw.liveness.warning`（counter，attrs: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（histogram，attrs: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（histogram，attrs: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（histogram，attrs: `openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（histogram，attrs: `openclaw.liveness.reason`）

### Harness 生命週期

- `openclaw.harness.duration_ms`（histogram，attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`，錯誤時包含 `openclaw.harness.phase`）

### 工具執行

- `openclaw.tool.execution.duration_ms`（histogram，attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`，錯誤時加上 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（counter，attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`）

### Exec

- `openclaw.exec.duration_ms`（histogram，attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`）

### 診斷內部（記憶體與工具迴圈）

- `openclaw.payload.large`（counter，attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`）
- `openclaw.payload.large_bytes`（histogram，attrs: 與 `openclaw.payload.large` 相同）
- `openclaw.memory.heap_used_bytes`（histogram，attrs: `openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（histogram）
- `openclaw.memory.pressure`（counter，attrs: `openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（counter，attrs: `openclaw.toolName`, `openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（histogram，attrs: `openclaw.toolName`, `openclaw.outcome`）

## 匯出的 span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - 預設使用 `gen_ai.system`，或在選擇啟用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 預設使用 `gen_ai.system`，或在選擇啟用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 發生錯誤時包含 `openclaw.errorCategory` 和選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars`（僅安全的元件大小，不含提示文字）
  - 當模型呼叫結果帶有該個別呼叫的供應商用量時，包含 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - `openclaw.provider.request_id_hash`（上游供應商請求 ID 的有界 SHA 型雜湊；不會匯出原始 ID）
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，模型呼叫 span 會使用最新 GenAI 推論 span 名稱 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` span kind，而不是 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`, `openclaw.errorCategory`, 選用的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`（不含提示、歷史、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory`（不含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型與工具 span 也可以針對你選擇啟用的特定內容類別，包含有界且已遮蔽的 `openclaw.content.*` 屬性。

## 診斷事件目錄

以下事件支援上述指標與 span。外掛也可以在不透過 OTLP 匯出的情況下直接訂閱這些事件。

**模型用量**

- `model.usage` - token、成本、持續時間、內容脈絡、供應商/模型/通道、工作階段 ID。`usage` 是供應商/回合層級的成本與遙測計量；`context.used` 是目前的提示/內容脈絡快照，當涉及快取輸入或工具迴圈呼叫時，可能低於供應商 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：網路鉤子/佇列/工作階段）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - agent harness 的每次執行生命週期。包含 `harnessId`、選用的 `pluginId`、供應商/模型/通道，以及執行 ID。完成時會加入 `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，以及 `itemLifecycle` 計數。錯誤會加入 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、結束代碼與失敗種類。不包含命令文字與工作目錄。

## 不使用匯出器

你可以在不執行 `diagnostics-otel` 的情況下，讓外掛或自訂 sink 仍可使用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要在不提高 `logging.level` 的情況下輸出特定除錯內容，請使用診斷旗標。旗標不區分大小寫，並支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境變數覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），且仍會由 `logging.redactSensitive` 遮蔽。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以將 `diagnostics-otel` 排除在 `plugins.allow` 之外，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) - 檔案記錄、主控台輸出、命令列介面 tailing，以及 Control UI Logs 分頁
- [閘道記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前綴與主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 目標式除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整 `diagnostics.*` 欄位參考
