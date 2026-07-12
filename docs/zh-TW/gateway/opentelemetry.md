---
read_when:
    - 你想將 OpenClaw 的模型使用量、訊息流或工作階段指標傳送至 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌連接至 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端系統
    - 你需要確切的指標名稱、Span 名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel 外掛，將 OpenClaw 診斷資料匯出至 OpenTelemetry 收集器或標準輸出 JSONL
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-07-12T14:29:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` 外掛匯出診斷資料，使用 **OTLP/HTTP (protobuf)**。日誌也能以 stdout JSONL 寫出，供容器與沙箱日誌管線使用。任何接受 OTLP/HTTP 的收集器或後端皆可直接使用，無須變更程式碼。如需本機檔案日誌，請參閱[日誌記錄](/zh-TW/logging)。

- **診斷事件**是在程序內產生的結構化記錄，由閘道與內建外掛針對模型執行、訊息流程、工作階段、佇列及命令執行發出。
- **`diagnostics-otel`** 會訂閱這些事件，並透過 OTLP/HTTP 將其匯出為 OpenTelemetry **指標**、**追蹤**及**日誌**，也能將日誌記錄同步輸出至 stdout JSONL。
- 當供應商傳輸支援自訂標頭時，**供應商呼叫**會從 OpenClaw 可信任的模型呼叫 span 上下文接收 W3C `traceparent` 標頭。外掛發出的追蹤上下文不會傳播。
- 僅當診斷介面與此外掛均已啟用時，匯出器才會掛接，因此程序內成本預設維持接近零。

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

或者從命令列介面啟用外掛：`openclaw plugins enable diagnostics-otel`。

<Note>
`protocol` 僅支援 `http/protobuf`。由於 `traces` 與 `metrics` 預設為啟用，任何其他值（包括 `grpc`）都會中止整個 diagnostics-otel 訂閱並顯示 `unsupported protocol` 警告，這也會停止 stdout 日誌匯出。如果你只想搭配非 OTLP 通訊協定值使用 `logsExporter: "stdout"`，請明確設定 `traces: false` 與 `metrics: false`。
</Note>

## 匯出的訊號

| 訊號        | 包含內容                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **指標** | 用於權杖使用量、成本、執行持續時間、容錯移轉、技能使用情況、訊息流程、Talk 事件、佇列通道、工作階段狀態／復原、工具執行、命令執行、記憶體、存活狀態及匯出器健康狀態的計數器／直方圖。 |
| **追蹤**  | 用於模型使用情況、模型呼叫、測試框架生命週期、技能使用情況、工具執行、命令執行、網路鉤子／訊息處理、上下文組裝及工具迴圈的 span。                                                        |
| **日誌**    | 當 `diagnostics.otel.logs` 啟用時，透過 OTLP 或 stdout JSONL 匯出的結構化 `logging.file` 記錄；除非明確啟用內容擷取，否則不會包含日誌本文。                              |

可分別切換 `traces`、`metrics` 與 `logs`。當 `diagnostics.otel.enabled` 為 true 時，追蹤與指標預設開啟；日誌預設關閉，且僅在 `diagnostics.otel.logs` 明確設為 `true` 時才會匯出。日誌預設透過 OTLP 匯出；將 `diagnostics.otel.logsExporter` 設為 `stdout` 可在 stdout 上輸出 JSONL，設為 `both` 則同時使用兩者。

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
      protocol: "http/protobuf", // grpc 會停用 OTLP 匯出
      serviceName: "openclaw-gateway", // 未設定時會退回使用 OTEL_SERVICE_NAME，然後使用 "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // 根 span 取樣器，0.0..1.0
      flushIntervalMs: 60000, // 指標匯出間隔（最短 1000ms）
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

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 未設定 `diagnostics.otel.endpoint` 設定鍵時的備用值。                                                                                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 未設定對應的 `diagnostics.otel.*Endpoint` 設定鍵時，使用各訊號專用的端點備用值。訊號專用設定優先於訊號專用環境變數，而訊號專用環境變數又優先於共用端點。                                                                                                   |
| `OTEL_SERVICE_NAME`                                                                                               | 未設定 `diagnostics.otel.serviceName` 設定鍵時的備用值。預設服務名稱為 `openclaw`。                                                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 未設定 `diagnostics.otel.protocol` 時的線路通訊協定備用值。只有 `http/protobuf` 會啟用匯出。                                                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 可發出最新的 GenAI 推論 span 格式：span 名稱為 `{gen_ai.operation.name} {gen_ai.request.model}`、span 種類為 `CLIENT`，並使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。無論如何，GenAI 指標一律使用有界、低基數屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個預載程式或主機程序已註冊全域 OpenTelemetry SDK 時設為 `1`。此外掛之後會略過自己的 NodeSDK 生命週期，但仍會連接診斷接聽器，並遵循 `traces`／`metrics`／`logs` 設定。                                                                                 |

## 隱私權與內容擷取

原始模型／工具內容預設**不會**匯出。Span 僅攜帶有界識別碼（頻道、供應商、模型、錯誤類別、僅雜湊的要求 ID、工具來源、工具擁有者、技能名稱／來源），且絕不包含提示文字、回應文字、工具輸入、工具輸出、技能檔案路徑或工作階段金鑰。在低基數屬性中，看似具範圍的代理程式工作階段金鑰值（例如以 `agent:` 開頭）會替換為 `unknown`。OTLP 日誌記錄預設會保留嚴重性、記錄器、程式碼位置、可信任的追蹤上下文及經過清理的屬性；只有當 `diagnostics.otel.captureContent` 的布林值為 `true` 時，才會匯出原始日誌訊息本文。個別的 `captureContent.*` 子鍵絕不會啟用日誌本文。Talk 指標僅匯出有界事件中繼資料（模式、傳輸、供應商、事件類型），不包含轉錄文字、音訊承載資料、工作階段 ID、輪次 ID、呼叫 ID、房間 ID 或移交權杖。

對外模型要求可能包含 W3C `traceparent` 標頭，此標頭僅從作用中模型呼叫的 OpenClaw 自有診斷追蹤上下文產生。現有由呼叫端提供的 `traceparent` 標頭會被取代，因此外掛或自訂供應商選項無法偽造跨服務追蹤祖先關係。

只有當你的收集器與保留政策已獲准處理提示、回應、工具或系統提示文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。各子鍵彼此獨立：

- `inputMessages` - 使用者提示內容。
- `outputMessages` - 模型回應內容。
- `toolInputs` - 工具引數承載資料。
- `toolOutputs` - 工具結果承載資料。
- `systemPrompt` - 組裝後的系統／開發者提示。
- `toolDefinitions` - 模型工具的名稱、說明及結構描述。

啟用任何子鍵時，模型與工具 span 只會取得該類別經過刪減且有界的 `openclaw.content.*` 屬性。

<Note>
布林值 `captureContent: true` 會同時啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions` 及 OTLP 日誌本文，但**不會**啟用 `systemPrompt`；如果你也需要組裝後的系統提示，請明確設定 `captureContent.systemPrompt: true`。
</Note>

內建代理程式執行階段的工具執行會擷取 `toolInputs`／`toolOutputs` 內容（完成／錯誤 span 上的 `openclaw.content.tool_input` 與 `gen_ai.tool.call.arguments`；完成 span 上的 `openclaw.content.tool_output` 與 `gen_ai.tool.call.result`）。`openclaw.content.*` 名稱仍是穩定的 OpenClaw 屬性名稱；`gen_ai.tool.call.*` 副本則會為支援語意慣例的檢視器映射這些屬性。外部測試框架工具呼叫（Codex、Claude 命令列介面）會發出不含內容承載資料的 `tool.execution.*` span。擷取的內容會透過可信任且僅供接聽器使用的頻道傳輸，絕不會放入公開的診斷事件匯流排。

## 取樣與排清

- **追蹤：** `diagnostics.otel.sampleRate` 僅在根跨度上設定 `TraceIdRatioBasedSampler`
  （`0.0` 捨棄全部，`1.0` 保留全部）。未設定時使用
  OpenTelemetry SDK 的預設值（永遠開啟）。
- **指標：** `diagnostics.otel.flushIntervalMs`（下限為
  `1000`）；未設定時使用 SDK 的週期性匯出預設值。
- **日誌：** OTLP 日誌遵循 `logging.level`（檔案日誌層級），並使用
  診斷日誌記錄遮蔽路徑，而非主控台格式。高流量
  安裝環境應優先使用 OTLP 收集器取樣／篩選，而非本機
  取樣。當你的平台已將 stdout/stderr 傳送至日誌處理器，且沒有 OTLP 日誌
  收集器時，請設定 `diagnostics.otel.logsExporter: "stdout"`。
  Stdout 記錄每行一個 JSON 物件，其中包含 `ts`、`signal`、
  `service.name`、嚴重性、本文、經遮蔽的屬性，以及可用時可信任的追蹤
  欄位。
- **檔案日誌關聯：** 當日誌呼叫帶有有效的
  診斷追蹤內容時，JSONL 檔案日誌會包含頂層的 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌行與
  已匯出的跨度連結。
- **請求關聯：** 閘道 HTTP 請求和 WebSocket 訊框會建立
  內部請求追蹤範圍。該範圍內的日誌和診斷事件
  預設會繼承請求追蹤，而代理程式執行和模型呼叫
  跨度會建立為其子項，讓提供者的 `traceparent` 標頭維持在
  同一追蹤中。
- **模型呼叫關聯：** `openclaw.model.call` 跨度預設包含安全的提示詞
  元件大小，且當提供者結果公開用量時，還包含每次呼叫的權杖屬性。
  `openclaw.model.usage` 仍是用於彙總成本、內容和頻道儀表板的執行層級
  計量跨度，且當發出事件的執行階段具有可信任的
  追蹤內容時，會維持在同一診斷追蹤中。

## 匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語意慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，選用的 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求承載資料的 UTF-8 位元組大小；不含原始承載資料內容）
- `openclaw.model_call.response_bytes`（直方圖，串流回應區塊承載資料的 UTF-8 位元組大小；高頻率文字、思考及工具呼叫差異僅計算增量 `delta` 位元組；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前經過的時間）
- `openclaw.model.failover`（計數器，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（計數器，屬性：`openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`，選用的 `openclaw.agent`、選用的 `openclaw.toolName`）

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

### Talk

- `openclaw.talk.event`（計數器，屬性：`openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（直方圖，屬性：與 `openclaw.talk.event` 相同；當 Talk 事件回報持續時間時發出）
- `openclaw.talk.audio.bytes`（直方圖，屬性：與 `openclaw.talk.event` 相同；針對回報位元組長度的 Talk 音訊訊框事件發出）

### 佇列和工作階段

- `openclaw.queue.lane.enqueue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.depth`（直方圖，屬性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方圖，屬性：`openclaw.lane`）
- `openclaw.session.state`（計數器，屬性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；針對可復原的過期工作階段簿記發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；針對可復原的過期工作階段簿記發出）
- `openclaw.session.turn.created`（計數器，屬性：`openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方圖，屬性：與相符的復原計數器相同）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段
存活診斷的無進度經過時間臨界值。當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP 執行階段
進度時，`processing` 工作階段不會朝此
臨界值累積時間。輸入中保持連線訊號不算進度，因此仍可偵測到
無輸出的模型或測試框架。

OpenClaw 會依照仍可觀察到的工作分類工作階段：

- `session.long_running`：作用中的內嵌工作、模型呼叫或工具呼叫
  仍在取得進展。由擁有者管理且靜默超過
  `diagnostics.stuckSessionWarnMs` 的模型呼叫，在達到
  `diagnostics.stuckSessionAbortMs` 前也會回報為長時間執行，因此只要仍可觀察到中止狀態，
  緩慢或非串流模型提供者就不會看起來像停滯的閘道工作階段。
- `session.stalled`：存在作用中的工作，但作用中的執行最近未回報
  進度。由擁有者管理的模型呼叫會在達到或超過
  `diagnostics.stuckSessionAbortMs` 時，從 `session.long_running` 切換為
  `session.stalled`；沒有擁有者的過期模型／工具活動不會被視為無害的長時間執行工作。
  停滯的內嵌執行一開始僅供觀察，之後若達到
  `diagnostics.stuckSessionAbortMs` 且沒有進度，就會中止並排空，讓該通道後方排隊的
  輪次可以繼續。未設定時，中止臨界值預設為較安全的
  延長時間範圍，即至少 5 分鐘且為
  `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：沒有作用中工作的過期工作階段簿記，或具有過期且無擁有者之
  模型／工具活動的閒置排隊工作階段。復原閘門通過後，這會立即釋放
  受影響的工作階段通道。

復原會發出結構化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。只有在產生會改變狀態的復原結果
（`aborted` 或 `released`），且同一個處理世代仍為目前世代時，
診斷工作階段狀態才會標記為閒置。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、
`openclaw.session.stuck_age_ms` 直方圖和 `openclaw.session.stuck`
跨度。當工作階段維持不變時，重複的 `session.stuck` 診斷會採用退避機制，
因此儀表板應針對持續增加發出警示，而不是每次心跳偵測都發出警示。
關於設定選項和預設值，請參閱
[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

存活警告也會發出：

- `openclaw.liveness.warning`（計數器，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方圖，屬性：`openclaw.liveness.reason`）

### 測試框架生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，以及錯誤上的 `openclaw.harness.phase`）

### 工具執行和迴圈偵測

- `openclaw.tool.execution.duration_ms`（直方圖，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，以及錯誤上的 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（計數器，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（計數器，屬性：`openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`，選用的 `openclaw.loop.paired_tool`；偵測到重複的工具呼叫迴圈時發出）

### Exec

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部資訊（記憶體、承載資料、匯出器健全狀況）

- `openclaw.payload.large`（計數器，屬性：`openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（直方圖，屬性：與 `openclaw.payload.large` 相同）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（直方圖，無屬性；程序記憶體樣本）
- `openclaw.memory.pressure`（計數器，屬性：`openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（計數器，屬性：`openclaw.diagnostic.async_queue.drop_class`；內部診斷佇列因背壓而捨棄的項目）
- `openclaw.telemetry.exporter.events`（計數器，屬性：`openclaw.exporter`、`openclaw.signal`、`openclaw.status`，選用的 `openclaw.reason`、選用的 `openclaw.errorCategory`；匯出器生命週期／失敗自我遙測）

## 匯出的跨度

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 預設使用 `gen_ai.system`，選用最新的 GenAI 語意慣例時則使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設使用 `gen_ai.system`，選用最新的 GenAI 語意慣例時則使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 發生錯誤時包含 `openclaw.errorCategory`、`error.type`，以及選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（僅限安全的元件大小，不含提示詞文字）
  - 當模型呼叫結果帶有該次個別呼叫的供應商用量時，包含 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - 當上游供應商結果公開請求 ID 時，跨度事件 `openclaw.provider.request` 會包含屬性 `openclaw.upstreamRequestIdHash`（有界限、以雜湊為基礎）；絕不匯出原始 ID
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，模型呼叫跨度會使用最新的 GenAI 推論跨度名稱 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` 跨度種類，而非 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`gen_ai.operation.name`（`execute_tool`）、`openclaw.toolName`、`openclaw.tool.source`、選用的 `gen_ai.tool.call.id`、`openclaw.tool.owner`、`openclaw.tool.params.*`
  - 發生錯誤時可包含 `openclaw.errorCategory`/`openclaw.errorCode`；遭政策或沙箱拒絕時包含 `openclaw.deniedReason` 和 `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.exit_signal`、`openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不含提示詞、歷史記錄、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、選用的 `openclaw.loop.paired_tool`（不含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.reason`、`openclaw.memory.rss_bytes`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.heap_total_bytes`、`openclaw.memory.external_bytes`、`openclaw.memory.array_buffers_bytes`、選用的 `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

明確啟用內容擷取時，模型和工具跨度還可以針對你選用的特定
內容類別，包含有界限且已遮蔽的 `openclaw.content.*` 屬性。

## 診斷事件目錄

下列事件支援上述指標和跨度。外掛也可以直接訂閱這些事件，
無須透過 OTLP 匯出。

**模型用量**

- `model.usage` - 權杖、成本、持續時間、上下文、供應商／模型／頻道、
  工作階段 ID。`usage` 是供應商／回合層級的成本和遙測計量；
  `context.used` 是目前的提示詞／上下文快照；涉及快取輸入或工具迴圈
  呼叫時，其值可能低於供應商的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列和工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：網路鉤子／佇列／工作階段）

**執行框架生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  代理程式執行框架每次執行的生命週期。包含 `harnessId`、選用的
  `pluginId`、供應商／模型／頻道，以及執行 ID。完成時會新增
  `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`
  和 `itemLifecycle` 計數。錯誤會新增 `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及
  選用的 `cleanupFailed`。

**執行**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、結束
  代碼和失敗種類。不包含命令文字和工作目錄。
- `exec.approval.followup_suppressed` - 工作階段重新繫結後，捨棄過時的核准後續動作。
  包含 `approvalId`、`reason`
  （`session_rebound`）、`phase`（`direct_delivery` 或 `gateway_preflight`），
  以及分派器時間戳記。不包含工作階段金鑰、路由和命令文字。

## 不使用匯出器

不執行 `diagnostics-otel`，仍可讓外掛或自訂接收端使用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要在不提高 `logging.level` 的情況下輸出針對性的偵錯資訊，請使用診斷
旗標。旗標不區分大小寫，並支援萬用字元（`telegram.*` 或
`*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或以一次性的環境變數覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），並且仍會由
`logging.redactSensitive` 遮蔽。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

或者從 `plugins.allow` 中移除 `diagnostics-otel`，或執行
`openclaw plugins disable diagnostics-otel`。

## 相關內容

- [記錄](/zh-TW/logging) - 檔案記錄、主控台輸出、命令列介面追蹤，以及 Control UI 的 Logs 分頁
- [閘道記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前綴和主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 針對性的偵錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - 操作人員支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 欄位參考
