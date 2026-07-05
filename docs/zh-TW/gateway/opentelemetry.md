---
read_when:
    - 你想將 OpenClaw 模型使用量、訊息流程或工作階段指標傳送到 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端
    - 你需要確切的指標名稱、span 名稱或屬性形狀，才能建立儀表板或警示。
summary: 透過 diagnostics-otel 外掛將 OpenClaw 診斷匯出到 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-07-05T11:22:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e1ade877873729a7119cde3b819d82016cf4effad72af87e3c45bbc6cc3d48e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 會透過官方 `diagnostics-otel` 外掛使用 **OTLP/HTTP (protobuf)** 匯出診斷資料。日誌也可以 stdout JSONL 寫入，以供容器與沙箱日誌管線使用。任何接受 OTLP/HTTP 的收集器或後端都可直接運作，無須變更程式碼。如需本機檔案日誌，請參閱 [記錄](/zh-TW/logging)。

- **診斷事件** 是由閘道與捆綁外掛針對模型執行、訊息流程、工作階段、佇列和 exec 發出的結構化程序內記錄。
- **`diagnostics-otel`** 會訂閱這些事件，並透過 OTLP/HTTP 將其匯出為 OpenTelemetry **指標**、**追蹤**和**日誌**，也可以將日誌記錄鏡像到 stdout JSONL。
- **供應商呼叫** 會在供應商傳輸接受自訂標頭時，從 OpenClaw 的受信任模型呼叫跨度脈絡收到 W3C `traceparent` 標頭。外掛發出的追蹤脈絡不會被傳播。
- 只有在診斷介面與外掛都啟用時，匯出器才會附加，因此預設情況下程序內成本會維持接近零。

## 快速開始

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

或從命令列介面啟用外掛：`openclaw plugins enable diagnostics-otel`。

<Note>
`protocol` 僅支援 `http/protobuf`。由於 `traces` 和 `metrics` 預設為啟用，任何其他值（包括 `grpc`）都會以 `unsupported protocol` 警告中止整個 diagnostics-otel 訂閱，這也會停止 stdout 日誌匯出。如果你只想搭配非 OTLP 協定值使用 `logsExporter: "stdout"`，請明確設定 `traces: false` 和 `metrics: false`。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **指標**    | token 使用量、成本、執行持續時間、容錯移轉、skill 使用量、訊息流程、Talk 事件、佇列通道、工作階段狀態/復原、工具執行、exec、記憶體、存活狀態和匯出器健康狀態的計數器/直方圖。 |
| **追蹤**    | 模型使用量、模型呼叫、harness 生命週期、skill 使用量、工具執行、exec、webhook/訊息處理、脈絡組裝和工具迴圈的跨度。                                                            |
| **日誌**    | 啟用 `diagnostics.otel.logs` 時，透過 OTLP 或 stdout JSONL 匯出的結構化 `logging.file` 記錄；除非明確啟用內容擷取，否則會保留日誌主體不匯出。                                    |

可獨立切換 `traces`、`metrics` 和 `logs`。當 `diagnostics.otel.enabled` 為 true 時，追蹤和指標預設開啟；日誌預設關閉，且只有在 `diagnostics.otel.logs` 明確為 `true` 時才會匯出。日誌匯出預設為 OTLP；將 `diagnostics.otel.logsExporter` 設為 `stdout` 可在 stdout 輸出 JSONL，或設為 `both` 同時輸出兩者。

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
      protocol: "http/protobuf", // grpc disables OTLP export
      serviceName: "openclaw-gateway", // unset falls back to OTEL_SERVICE_NAME, then "openclaw"
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

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 未設定設定鍵 `diagnostics.otel.endpoint` 時的備援。                                                                                                                                                                                                                                                           |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 未設定相符的 `diagnostics.otel.*Endpoint` 設定鍵時使用的訊號專用端點備援。訊號專用設定優先於訊號專用環境變數，而訊號專用環境變數又優先於共用端點。                                                                                              |
| `OTEL_SERVICE_NAME`                                                                                               | 未設定設定鍵 `diagnostics.otel.serviceName` 時的備援。預設服務名稱為 `openclaw`。                                                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 未設定 `diagnostics.otel.protocol` 時的 wire 協定備援。只有 `http/protobuf` 會啟用匯出。                                                                                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 以發出最新的 GenAI 推論跨度形狀：`{gen_ai.operation.name} {gen_ai.request.model}` 跨度名稱、`CLIENT` 跨度種類，以及以 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。GenAI 指標一律使用有界且低基數的屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個 preload 或主機程序已註冊全域 OpenTelemetry SDK 時，設定為 `1`。外掛接著會略過自己的 NodeSDK 生命週期，但仍會連接診斷監聽器，並遵循 `traces`/`metrics`/`logs`。                                                                           |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。跨度會攜帶有界識別碼（頻道、供應商、模型、錯誤類別、僅雜湊的請求 ID、工具來源、工具擁有者、skill 名稱/來源），且絕不包含提示文字、回應文字、工具輸入、工具輸出、skill 檔案路徑或工作階段金鑰。看起來像具範圍代理工作階段金鑰的值（例如以 `agent:` 開頭）會在低基數屬性上被替換為 `unknown`。OTLP 日誌記錄預設保留嚴重性、logger、程式碼位置、受信任追蹤脈絡和已清理屬性；只有在 `diagnostics.otel.captureContent` 是布林值 `true` 時，才會匯出原始日誌訊息主體。細粒度的 `captureContent.*` 子鍵永遠不會啟用日誌主體。Talk 指標只會匯出有界事件中繼資料（模式、傳輸、供應商、事件類型），不會匯出逐字稿、音訊 payload、工作階段 ID、turn ID、呼叫 ID、聊天室 ID 或交接 token。

傳出模型請求可能包含 W3C `traceparent` 標頭，且僅由目前模型呼叫的 OpenClaw 擁有診斷追蹤脈絡產生。既有呼叫端提供的 `traceparent` 標頭會被替換，因此外掛或自訂供應商選項無法偽造跨服務追蹤祖先。

只有在你的收集器與保留政策已獲准處理提示、回應、工具或系統提示文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵都是獨立的：

- `inputMessages` - 使用者提示內容。
- `outputMessages` - 模型回應內容。
- `toolInputs` - 工具引數 payload。
- `toolOutputs` - 工具結果 payload。
- `systemPrompt` - 已組裝的系統/開發者提示。
- `toolDefinitions` - 模型工具名稱、描述和 schema。

啟用任何子鍵時，模型和工具跨度只會針對該類別取得有界且已遮蔽的 `openclaw.content.*` 屬性。

<Note>
布林值 `captureContent: true` 會同時啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions` 和 OTLP 日誌主體，但**不會**啟用 `systemPrompt`；如果你也需要已組裝的系統提示，請明確設定 `captureContent.systemPrompt: true`。
</Note>

內建代理 runtime 的工具執行會擷取 `toolInputs`/`toolOutputs` 內容（完成/錯誤跨度上的 `openclaw.content.tool_input`，以及完成跨度上的 `openclaw.content.tool_output`）。外部 harness 工具呼叫（Codex、Claude CLI）會發出不含內容 payload 的 `tool.execution.*` 跨度。擷取的內容會透過受信任、僅供監聽器使用的頻道傳送，且絕不放到公開診斷事件匯流排上。

## 取樣與清除

- **追蹤：** `diagnostics.otel.sampleRate` 只會在根跨度上設定 `TraceIdRatioBasedSampler`
  （`0.0` 會捨棄全部，`1.0` 會保留全部）。未設定時會使用
  OpenTelemetry SDK 預設值（永遠開啟）。
- **指標：** `diagnostics.otel.flushIntervalMs`（下限限制為
  `1000`）；未設定時會使用 SDK 的週期匯出預設值。
- **日誌：** OTLP 日誌會遵循 `logging.level`（檔案日誌層級），並使用
  診斷日誌記錄遮蔽路徑，而不是主控台格式化。高流量安裝環境應優先使用
  OTLP 收集器取樣／篩選，而不是本機取樣。當你的平台已經將 stdout/stderr
  傳送到日誌處理器，且沒有 OTLP 日誌收集器時，請設定
  `diagnostics.otel.logsExporter: "stdout"`。Stdout 記錄每行是一個 JSON 物件，
  包含 `ts`、`signal`、`service.name`、嚴重性、主體、已遮蔽屬性，以及可用時的可信追蹤
  欄位。
- **檔案日誌關聯：** 當日誌呼叫帶有有效的診斷追蹤脈絡時，JSONL 檔案日誌會包含頂層
  `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌行與
  匯出的跨度串接起來。
- **請求關聯：** 閘道 HTTP 請求和 WebSocket 框架會建立
  內部請求追蹤範圍。該範圍內的日誌和診斷事件預設會繼承請求追蹤，而代理執行和模型呼叫
  跨度會建立為子項，因此供應商 `traceparent` 標頭會留在同一個
  追蹤上。
- **模型呼叫關聯：** `openclaw.model.call` 跨度預設會包含安全的提示
  元件大小，並在供應商結果公開用量時包含每次呼叫的權杖屬性。`openclaw.model.usage`
  仍然是用於彙總成本、脈絡與頻道儀表板的執行層級
  計帳跨度，且在發出事件的執行環境具有可信追蹤脈絡時，會留在同一個診斷追蹤上。

## 匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語義慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語義慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，選用 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求承載的 UTF-8 位元組大小；不包含原始承載內容）
- `openclaw.model_call.response_bytes`（直方圖，串流回應區塊承載的 UTF-8 位元組大小；高頻文字、思考與工具呼叫差異只計算增量 `delta` 位元組；不包含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前經過的時間）
- `openclaw.model.failover`（計數器，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（計數器，屬性：`openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`，選用 `openclaw.agent`，選用 `openclaw.toolName`）

### 訊息流程

- `openclaw.webhook.received`（計數器，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（計數器，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（計數器，屬性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.received`（計數器，屬性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.started`（計數器，屬性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.completed`（計數器，屬性：`openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.dispatch.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.processed`（計數器，屬性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（計數器，屬性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### 對話

- `openclaw.talk.event`（計數器，屬性：`openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（直方圖，屬性：與 `openclaw.talk.event` 相同；在對話事件回報持續時間時發出）
- `openclaw.talk.audio.bytes`（直方圖，屬性：與 `openclaw.talk.event` 相同；針對回報位元組長度的對話音訊框架事件發出）

### 佇列與工作階段

- `openclaw.queue.lane.enqueue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.depth`（直方圖，屬性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方圖，屬性：`openclaw.lane`）
- `openclaw.session.state`（計數器，屬性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；針對可復原的過期工作階段記帳發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；針對可復原的過期工作階段記帳發出）
- `openclaw.session.turn.created`（計數器，屬性：`openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方圖，屬性：與相符的復原計數器相同）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活診斷的無進度時間門檻。當 OpenClaw
觀察到回覆、工具、狀態、區塊或 ACP 執行環境進度時，`processing` 工作階段不會朝此
門檻累計時間。輸入狀態 keepalive 不算作進度，因此靜默模型或
測試框架仍然可以被偵測到。

OpenClaw 會依據仍可觀察到的工作分類工作階段：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫
  仍在取得進度。由擁有者管理的模型呼叫若在超過
  `diagnostics.stuckSessionWarnMs` 後仍保持靜默，也會在
  `diagnostics.stuckSessionAbortMs` 前回報為長時間執行，因此緩慢或非串流模型供應商
  在可觀察中止前不會看起來像停滯的閘道工作階段。
- `session.stalled`：存在作用中的工作，但作用中的執行近期沒有回報
  進度。由擁有者管理的模型呼叫會在達到或超過 `diagnostics.stuckSessionAbortMs` 時，
  從 `session.long_running` 切換為
  `session.stalled`；沒有擁有者的過期模型／工具活動不會被視為無害的長時間執行工作。
  停滯的嵌入式執行一開始維持僅觀察，接著在
  `diagnostics.stuckSessionAbortMs` 後若沒有進度，會中止並排空，讓該通道後方排隊的回合
  可以恢復。未設定時，中止門檻預設為更安全的延長視窗，至少為 5 分鐘且為
  `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：沒有作用中工作的過期工作階段記帳，或具有過期且無擁有者模型／工具活動的閒置
  佇列工作階段。這會在復原閘門通過後立即釋放受影響的
  工作階段通道。

復原會發出結構化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。診斷工作階段狀態只有在發生會變更狀態的復原結果
（`aborted` 或 `released`）後，且只有在同一個處理世代仍為目前世代時，
才會標記為閒置。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、
`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck`
跨度。當工作階段維持不變時，重複的 `session.stuck` 診斷會退避，因此儀表板應針對持續增加
發出警示，而不是針對每個心跳偵測節拍發出警示。關於設定旋鈕與預設值，請參閱
[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

存活警告也會發出：

- `openclaw.liveness.warning`（計數器，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方圖，屬性：`openclaw.liveness.reason`）

### 測試框架生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，錯誤時包含 `openclaw.harness.phase`）

### 工具執行與迴圈偵測

- `openclaw.tool.execution.duration_ms`（直方圖，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，以及錯誤上的 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（計數器，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（計數器，屬性：`openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`，選用 `openclaw.loop.paired_tool`；在偵測到重複的工具呼叫迴圈時發出）

### 執行

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部項目（記憶體、承載、匯出器健康狀態）

- `openclaw.payload.large`（計數器，屬性：`openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（直方圖，屬性：與 `openclaw.payload.large` 相同）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（直方圖，無屬性；程序記憶體樣本）
- `openclaw.memory.pressure`（計數器，屬性：`openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（計數器，屬性：`openclaw.diagnostic.async_queue.drop_class`；內部診斷佇列背壓捨棄）
- `openclaw.telemetry.exporter.events`（計數器，屬性：`openclaw.exporter`、`openclaw.signal`、`openclaw.status`，選用 `openclaw.reason`，選用 `openclaw.errorCategory`；匯出器生命週期／失敗自我遙測）

## 匯出的跨度

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - 預設為 `gen_ai.system`，或在選擇啟用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 預設為 `gen_ai.system`，或在選擇啟用最新 GenAI 語意慣例時使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 錯誤上的 `openclaw.errorCategory`、`error.type`，以及選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars`（僅安全的元件大小，不含提示詞文字）
  - 當模型呼叫結果帶有該次個別呼叫的供應商使用量時，會包含 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - 當上游供應商結果公開 request id 時，Span 事件 `openclaw.provider.request` 會帶有屬性 `openclaw.upstreamRequestIdHash`（有界、以雜湊為基礎）；原始 id 永遠不會匯出
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，模型呼叫 span 會使用最新 GenAI 推論 span 名稱 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` span 種類，而不是 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`, `openclaw.errorCategory`，選用的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`，選用的 `openclaw.tool.owner`, `openclaw.tool.params.*`
  - 錯誤上的選用 `openclaw.errorCategory`/`openclaw.errorCode`，以及因政策或沙箱拒絕時的 `openclaw.deniedReason` 和 `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`（不含提示詞、歷史記錄、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`，選用的 `openclaw.loop.paired_tool`（不含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`，選用的 `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

明確啟用內容擷取時，模型和工具 span 也可以針對你選擇啟用的特定內容類別，包含有界且已遮罩的 `openclaw.content.*` 屬性。

## 診斷事件目錄

下列事件支援上方的指標和 span。外掛也可以直接訂閱它們，而不需要 OTLP 匯出。

**模型使用量**

- `model.usage` - token、成本、持續時間、脈絡、供應商/模型/通道、工作階段 id。`usage` 是用於成本和遙測的供應商/回合帳務；`context.used` 是目前的提示詞/脈絡快照，當涉及快取輸入或工具迴圈呼叫時，可能低於供應商 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列和工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：網路鉤子/佇列/工作階段）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  agent harness 的每次執行生命週期。包含 `harnessId`、選用的
  `pluginId`、供應商/模型/通道，以及執行 id。完成時會加入
  `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`
  和 `itemLifecycle` 計數。錯誤會加入 `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`，以及
  選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、退出
  代碼和失敗種類。不包含命令文字和工作目錄。
- `exec.approval.followup_suppressed` - 工作階段反彈後捨棄的過期核准後續動作。
  包含 `approvalId`、`reason`
  (`session_rebound`)、`phase`（`direct_delivery` 或 `gateway_preflight`），
  以及分派器時間戳記。不包含工作階段金鑰、路由和命令文字。

## 沒有匯出器

不執行 `diagnostics-otel` 也可以讓診斷事件提供給外掛或自訂 sink 使用：

```json5
{
  diagnostics: { enabled: true },
}
```

若要輸出目標式除錯內容而不提高 `logging.level`，請使用診斷旗標。
旗標不區分大小寫，並支援萬用字元（`telegram.*` 或
`*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境變數覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），而且仍會由
`logging.redactSensitive` 遮罩。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

或將 `diagnostics-otel` 排除在 `plugins.allow` 之外，或執行
`openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) - 檔案記錄、主控台輸出、命令列介面 tail，以及 Control UI Logs 分頁
- [閘道記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前綴和主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 目標式除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - 操作者支援套件工具（與 OTEL 匯出分開）
- [組態參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整 `diagnostics.*` 欄位參考
