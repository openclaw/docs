---
read_when:
    - 你想要將 OpenClaw 模型用量、訊息流程或工作階段指標傳送到 OpenTelemetry collector
    - 你正在將追蹤、指標或日誌接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端。
    - 你需要確切的指標名稱、跨度名稱或屬性形狀，才能建立儀表板或警示
summary: 透過 diagnostics-otel 外掛將 OpenClaw 診斷資料匯出至 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-07-01T05:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` 外掛匯出診斷資料，
使用 **OTLP/HTTP (protobuf)**。日誌也可以 stdout JSONL 形式寫出，
供容器與沙箱日誌管線使用。任何接受 OTLP/HTTP 的收集器或後端，
都能在不修改程式碼的情況下運作。如需本機檔案日誌與閱讀方式，
請參閱[記錄](/zh-TW/logging)。

## 運作方式

- **診斷事件**是由閘道和內建外掛針對模型執行、訊息流程、工作階段、佇列
  與 exec 發出的結構化、程序內記錄。
- **`diagnostics-otel` 外掛**會訂閱這些事件，並透過 OTLP/HTTP 將它們匯出為
  OpenTelemetry **指標**、**追蹤**與**日誌**。它也可以將診斷日誌記錄鏡像到 stdout JSONL。
- 當提供者傳輸接受自訂標頭時，**提供者呼叫**會從 OpenClaw 受信任的
  模型呼叫 span 上下文接收 W3C `traceparent` 標頭。外掛發出的追蹤上下文不會被傳播。
- 匯出器只會在診斷介面與外掛同時啟用時附加，因此預設的程序內成本接近零。

## 快速開始

對於套裝安裝，請先安裝外掛：

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

你也可以從命令列介面啟用此外掛：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前僅支援 `http/protobuf`。`grpc` 會被忽略。
</Note>

## 匯出的訊號

| 訊號        | 內容                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **指標**    | 權杖用量、成本、執行持續時間、容錯移轉、Skills 使用量、訊息流程、Talk 事件、佇列通道、工作階段狀態/復原、工具執行、過大酬載、exec 與記憶體壓力的計數器和直方圖。 |
| **追蹤**    | 模型使用、模型呼叫、harness 生命週期、Skills 使用量、工具執行、exec、網路鉤子/訊息處理、上下文組裝與工具迴圈的 span。                                                         |
| **日誌**    | 當 `diagnostics.otel.logs` 啟用時，透過 OTLP 或 stdout JSONL 匯出的結構化 `logging.file` 記錄；除非明確啟用內容擷取，否則會保留不匯出日誌主體。                               |

可獨立切換 `traces`、`metrics` 與 `logs`。當 `diagnostics.otel.enabled` 為 true 時，
追蹤與指標預設為開啟。日誌預設為關閉，只有在 `diagnostics.otel.logs` 明確為 `true` 時才會匯出。
日誌匯出預設使用 OTLP；將 `diagnostics.otel.logsExporter` 設為 `stdout` 可在 stdout 輸出 JSONL，
或設為 `both` 將每筆診斷日誌記錄同時傳送到 OTLP 與 stdout。

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

| 變數                                                                                                              | 用途                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆寫 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，則會原樣使用。                                                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 當相符的 `diagnostics.otel.*Endpoint` 設定鍵未設定時使用的訊號專屬端點覆寫。訊號專屬設定優先於訊號專屬環境變數，而訊號專屬環境變數優先於共用端點。                                                                                                                   |
| `OTEL_SERVICE_NAME`                                                                                               | 覆寫 `diagnostics.otel.serviceName`。                                                                                                                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆寫線路協定（目前只接受 `http/protobuf`）。                                                                                                                                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 可發出最新實驗性 GenAI 推論 span 形狀，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span kind，以及使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。GenAI 指標一律使用有界、低基數的語意屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當其他 preload 或主機程序已註冊全域 OpenTelemetry SDK 時設為 `1`。此外掛接著會略過自己的 NodeSDK 生命週期，但仍會連接診斷監聽器並遵循 `traces`/`metrics`/`logs`。                                                                                                      |

## 隱私與內容擷取

原始模型/工具內容預設**不會**匯出。Span 會攜帶有界識別資訊
（頻道、提供者、模型、錯誤類別、僅雜湊的請求 ID、工具來源、工具擁有者，以及 Skills 名稱/來源），
且絕不包含提示文字、回應文字、工具輸入、工具輸出、Skills 檔案路徑或工作階段金鑰。
OTLP 日誌記錄預設保留嚴重性、logger、程式碼位置、受信任的追蹤上下文與已清理屬性，
但原始日誌訊息主體只有在 `diagnostics.otel.captureContent` 設為布林值 `true` 時才會匯出。
細粒度的 `captureContent.*` 子鍵不會啟用日誌主體。看起來像 scoped agent 工作階段金鑰的標籤
會被替換為 `unknown`。
Talk 指標只匯出有界事件中繼資料，例如模式、傳輸、提供者與事件類型。它們不包含轉錄、音訊酬載、
工作階段 ID、turn ID、呼叫 ID、房間 ID 或交接權杖。

對外模型請求可能包含 W3C `traceparent` 標頭。該標頭只會由作用中模型呼叫的 OpenClaw 所有診斷追蹤上下文產生。
既有呼叫者提供的 `traceparent` 標頭會被取代，因此外掛或自訂提供者選項無法偽造跨服務追蹤祖先。

只有當你的收集器與保留政策已核准提示、回應、工具或系統提示文字時，
才將 `diagnostics.otel.captureContent.*` 設為 `true`。每個子鍵皆獨立選擇啟用：

- `inputMessages` - 使用者提示內容。
- `outputMessages` - 模型回應內容。
- `toolInputs` - 工具引數酬載。
- `toolOutputs` - 工具結果酬載。
- `systemPrompt` - 組裝後的系統/開發者提示。
- `toolDefinitions` - 模型工具名稱、描述與 schema。

啟用任何子鍵時，模型與工具 span 只會針對該類別取得有界、已修訂的
`openclaw.content.*` 屬性。只有在廣泛診斷擷取且 OTLP 日誌訊息主體也已核准匯出時，
才使用布林值 `captureContent: true`。

`toolInputs`/`toolOutputs` 內容會針對內建 agent runtime 的工具執行進行擷取
（完成/錯誤 span 上的 `openclaw.content.tool_input`，
完成 span 上的 `openclaw.content.tool_output`）。外部 harness 工具呼叫
（Codex、Claude 命令列介面）會發出不含內容酬載的 `tool.execution.*` span。
擷取內容會透過受信任、僅限監聽器的通道傳遞，絕不會放到公開診斷事件匯流排上。

## 取樣與清送

- **追蹤：** `diagnostics.otel.sampleRate`（僅限根 span，`0.0` 會捨棄全部，
  `1.0` 會保留全部）。
- **指標：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日誌：** OTLP 日誌遵循 `logging.level`（檔案日誌層級）。它們使用
  診斷日誌記錄的遮蔽路徑，而不是主控台格式化。高流量安裝應優先使用
  OTLP collector 取樣/篩選，而不是本機取樣。
  當你的平台已將 stdout/stderr 傳送至日誌處理器，且你沒有 OTLP 日誌
  collector 時，設定 `diagnostics.otel.logsExporter: "stdout"`。
  Stdout 記錄每行是一個 JSON 物件，包含 `ts`、`signal`、
  `service.name`、嚴重性、本文、已遮蔽屬性，以及可用時受信任的追蹤欄位。
- **檔案日誌關聯：** 當日誌呼叫帶有有效的診斷追蹤內容時，JSONL 檔案日誌會包含頂層 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌行與
  匯出的 span 串接起來。
- **請求關聯：** 閘道 HTTP 請求和 WebSocket frames 會建立
  內部請求追蹤範圍。該範圍內的日誌和診斷事件
  預設會繼承請求追蹤，而 agent 執行和模型呼叫 span 會
  建立為子項，因此 provider `traceparent` headers 會維持在同一個追蹤上。
- **模型呼叫關聯：** `openclaw.model.call` span 預設包含安全的 prompt
  元件大小，且當 provider 結果公開 usage 時，會包含每次呼叫的 token 屬性。
  `openclaw.model.usage` 仍是執行層級的記帳 span，用於彙總成本、
  context 和 channel dashboard；當發出事件的 runtime 具有受信任的追蹤內容時，
  它會維持在同一個診斷追蹤上。

## 匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，GenAI 語意慣例指標，屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、選用 `error.type`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求 payload 的 UTF-8 位元組大小；不含原始 payload 內容）
- `openclaw.model_call.response_bytes`（直方圖，串流回應 chunk payload 的 UTF-8 位元組大小；高頻文字、thinking 和 tool-call delta 只計算增量 `delta` 位元組；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前經過的時間）
- `openclaw.model.failover`（計數器，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（計數器，屬性：`openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`、選用 `openclaw.agent`、選用 `openclaw.toolName`）

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
- `openclaw.talk.event.duration_ms`（直方圖，屬性：與 `openclaw.talk.event` 相同；當對話事件回報 duration 時發出）
- `openclaw.talk.audio.bytes`（直方圖，屬性：與 `openclaw.talk.event` 相同；針對回報位元組長度的對話音訊 frame 事件發出）

### 佇列與工作階段

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
- `openclaw.session.recovery.age_ms`（直方圖，屬性：與相符的 recovery 計數器相同）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

`diagnostics.stuckSessionWarnMs` 是工作階段存活診斷的無進度時間門檻。
當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP runtime 進度時，
`processing` 工作階段不會朝此門檻累積時間。
Typing keepalive 不算作進度，因此靜默的模型或 harness 仍可被偵測到。

OpenClaw 會依仍可觀察到的工作對工作階段分類：

- `session.long_running`：active embedded work、模型呼叫或工具呼叫
  仍在取得進度。受擁有的模型呼叫若靜默超過
  `diagnostics.stuckSessionWarnMs`，也會先回報為 long-running，
  直到 `diagnostics.stuckSessionAbortMs` 前，讓較慢或非串流的模型 provider
  在仍可觀察中止時，不會看起來像停滯的閘道工作階段。
- `session.stalled`：存在 active work，但 active run 最近未回報
  進度。受擁有的模型呼叫會在達到或超過 `diagnostics.stuckSessionAbortMs`
  時，從 `session.long_running` 切換為 `session.stalled`；無 owner 的
  過期模型/工具活動不會被視為無害的長時間執行工作。
  停滯的 embedded run 一開始維持 observe-only，接著在
  `diagnostics.stuckSessionAbortMs` 後若沒有進度，會 abort-drain，
  讓 lane 後方已佇列的 turn 可以恢復。未設定時，中止門檻預設為更安全的
  延長視窗，至少 5 分鐘且為 `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：沒有 active work 的過期工作階段簿記，或帶有過期無 owner
  模型/工具活動的閒置已佇列工作階段。這會在復原 gate 通過後立即釋放
  受影響的工作階段 lane。

復原會發出結構化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。只有在 mutating recovery outcome
（`aborted` 或 `released`）之後，且只有當相同的 processing generation
仍為目前狀態時，診斷工作階段狀態才會標記為 idle。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、
`openclaw.session.stuck_age_ms` 直方圖，以及 `openclaw.session.stuck`
span。當工作階段保持不變時，重複的 `session.stuck` 診斷會退避，
因此 dashboard 應針對持續增加發出警示，而不是針對每個心跳偵測 tick。
關於設定旋鈕與預設值，請參閱
[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

存活警告也會發出：

- `openclaw.liveness.warning`（計數器，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方圖，屬性：`openclaw.liveness.reason`）

### 執行框架生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、錯誤上的 `openclaw.harness.phase`）

### 工具執行

- `openclaw.tool.execution.duration_ms`（直方圖，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，以及錯誤上的 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（計數器，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）

### 執行

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部（記憶體與工具迴圈）

- `openclaw.payload.large`（計數器，屬性：`openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（直方圖，屬性：與 `openclaw.payload.large` 相同）
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
  - 發生錯誤時的 `openclaw.errorCategory`，以及選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（僅限安全的元件大小，不包含提示文字）
  - 當模型呼叫結果帶有該個別呼叫的提供者用量時，使用 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - `openclaw.provider.request_id_hash`（上游提供者請求 ID 的有界 SHA 型雜湊；不匯出原始 ID）
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，模型呼叫 span 會使用最新的 GenAI 推論 span 名稱 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` span kind，而不是 `openclaw.model.call`。
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示、歷史、回應或 session-key 內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

明確啟用內容擷取時，模型和工具 span 也可以針對你選用的特定內容類別，包含有界且已遮罩的 `openclaw.content.*` 屬性。

## 診斷事件目錄

以下事件支援上方的指標和 span。外掛也可以不透過 OTLP 匯出而直接訂閱它們。

**模型用量**

- `model.usage` - token、成本、持續時間、上下文、提供者/模型/頻道、session ID。`usage` 是提供者/回合層級的成本與遙測統計；`context.used` 是目前的提示/上下文快照，當涉及快取輸入或工具迴圈呼叫時，可能低於提供者的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與 session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（彙總計數器：網路鉤子/佇列/session）

**Harness 生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - agent harness 的每次執行生命週期。包含 `harnessId`、選用的 `pluginId`、提供者/模型/頻道，以及執行 ID。完成時會加入 `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`，以及 `itemLifecycle` 計數。錯誤會加入 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、退出碼與失敗種類。不包含命令文字和工作目錄。
- `exec.approval.followup_suppressed` - session rebound 後丟棄過期的核准後續動作。包含 `approvalId`、`reason`（`session_rebound`）、`phase`（`direct_delivery` 或 `gateway_preflight`），以及 dispatcher 時間戳記。不包含 session key、路由和命令文字。

## 不使用 exporter

你可以在不執行 `diagnostics-otel` 的情況下，讓診斷事件可供外掛或自訂 sink 使用：

```json5
{
  diagnostics: { enabled: true },
}
```

若要在不提高 `logging.level` 的情況下輸出指定除錯資訊，請使用診斷旗標。旗標不區分大小寫，並支援萬用字元（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作為一次性的環境變數覆寫：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

旗標輸出會寫入標準記錄檔（`logging.file`），且仍會由 `logging.redactSensitive` 遮罩。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不將 `diagnostics-otel` 放入 `plugins.allow`，或執行 `openclaw plugins disable diagnostics-otel`。

## 相關

- [記錄](/zh-TW/logging) - 檔案記錄、主控台輸出、命令列介面 tail，以及控制介面記錄分頁
- [閘道記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前綴與主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 指定目標的除錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - 操作者支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 欄位參考
