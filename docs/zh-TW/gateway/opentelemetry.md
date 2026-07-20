---
read_when:
    - 你想要將 OpenClaw 模型用量、訊息流或工作階段指標傳送至 OpenTelemetry 收集器
    - 你正在將追蹤、指標或日誌連接至 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 後端系統
    - 你需要確切的指標名稱、追蹤範圍名稱或屬性結構，才能建立儀表板或警示
summary: 透過 diagnostics-otel 外掛，將 OpenClaw 診斷資料匯出至 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 匯出
x-i18n:
    generated_at: "2026-07-20T00:49:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 透過官方 `diagnostics-otel` 外掛匯出診斷資料，
使用 **OTLP/HTTP (protobuf)**。記錄也可寫入為 stdout JSONL，供
容器與沙箱記錄流水線使用。任何接受
OTLP/HTTP 的收集器或後端都不需修改程式碼即可運作。關於本機檔案記錄，請參閱
[記錄](/zh-TW/logging)。

- **診斷事件**是在行程內產生的結構化記錄，由
  閘道與隨附外掛針對模型執行、訊息流程、工作階段、佇列
  及 exec 發出。
- **`diagnostics-otel`** 會訂閱這些事件，並透過 OTLP/HTTP 將其匯出為
  OpenTelemetry **指標**、**追蹤**及**記錄**，也可以
  將記錄項目鏡像輸出為 stdout JSONL。
- 當供應商傳輸支援自訂標頭時，**供應商呼叫**會從 OpenClaw
  受信任的模型呼叫 span 情境接收 W3C `traceparent` 標頭。
  外掛發出的追蹤情境不會傳播。
- 只有當診斷介面和外掛都已啟用時，匯出器才會附加，
  因此行程內成本預設維持接近零。

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
`protocol` 僅支援 `http/protobuf`。由於 `traces` 和 `metrics` 預設為啟用，任何其他值（包括 `grpc`）都會中止整個 diagnostics-otel 訂閱，並顯示 `unsupported protocol` 警告——這也會停止 stdout 記錄匯出。如果只想搭配非 OTLP 通訊協定值使用 `logsExporter: "stdout"`，請明確設定 `traces: false` 和 `metrics: false`。
</Note>

## 匯出的訊號

| 訊號        | 包含的內容                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **指標** | 權杖用量、成本、執行持續時間、容錯移轉、Skill 使用量、訊息流程、Talk 事件、佇列通道、工作階段狀態／復原、工具執行、exec、記憶體、存活狀態及匯出器健康狀態的計數器／直方圖。 |
| **追蹤**  | 模型用量、模型呼叫、執行框架生命週期、Skill 使用、工具執行、exec、網路鉤子／訊息處理、情境組合及工具迴圈的 span。                                                      |
| **記錄**    | 啟用 `diagnostics.otel.logs` 時，透過 OTLP 或 stdout JSONL 匯出的結構化 `logging.file` 記錄；除非明確啟用內容擷取，否則不會提供記錄本文。                          |

可分別切換 `traces`、`metrics` 和 `logs`。當 `diagnostics.otel.enabled` 為 true 時，追蹤和指標
預設為開啟；記錄預設為關閉，
且只有在 `diagnostics.otel.logs` 明確設為 `true` 時才會匯出。記錄匯出
預設使用 OTLP；若要在 stdout 輸出 JSONL，請將 `diagnostics.otel.logsExporter` 設為 `stdout`，
或設為 `both` 以同時使用兩者。

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
      serviceName: "openclaw-gateway", // 未設定時會依序退回使用 OTEL_SERVICE_NAME 和 "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // 根 span 取樣器，0.0..1.0
      flushIntervalMs: 60000, // 指標匯出間隔（最小 1000ms）
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 未設定組態鍵時，作為 `diagnostics.otel.endpoint` 的備用值。                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 未設定相符的 `diagnostics.otel.*Endpoint` 組態鍵時所使用的訊號專用端點備用值。訊號專用組態的優先順序高於訊號專用環境變數，後者又高於共用端點。                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 未設定組態鍵時，作為 `diagnostics.otel.serviceName` 的備用值。預設服務名稱為 `openclaw`。                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 未設定 `diagnostics.otel.protocol` 時，作為線上通訊協定的備用值。只有 `http/protobuf` 會啟用匯出。                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 設為 `gen_ai_latest_experimental` 以發出最新的 GenAI 推論 span 形式：`{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span 種類，以及使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。無論如何，GenAI 指標一律使用有界、低基數的屬性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 當另一個預載程式或主機行程已註冊全域 OpenTelemetry SDK 時，請設為 `1`。外掛接著會略過自己的 NodeSDK 生命週期，但仍會連接診斷監聽器，並遵循 `traces`/`metrics`/`logs`。                                                                                    |

## 隱私權與內容擷取

原始模型／工具內容預設**不會**匯出。Span 會攜帶有界
識別碼（頻道、供應商、模型、錯誤類別、僅雜湊的要求 ID、
工具來源、工具擁有者、Skill 名稱／來源），且絕不包含提示詞文字、
回應文字、工具輸入、工具輸出、Skill 檔案路徑或工作階段金鑰。
看似具範圍限制之代理程式工作階段金鑰的值（例如以
`agent:` 開頭）在低基數屬性上會被取代為 `unknown`。OTLP 記錄
項目預設會保留嚴重性、記錄器、程式碼位置、受信任的追蹤情境及
經過清理的屬性；只有當 `diagnostics.otel.captureContent` 是布林值 `true` 時，
才會匯出原始記錄訊息本文。個別
`captureContent.*` 子鍵絕不會啟用記錄本文。Talk 指標只匯出
有界事件中繼資料（模式、傳輸、供應商、事件類型），不包含
逐字稿、音訊承載資料、工作階段 ID、回合 ID、呼叫 ID、聊天室 ID 或
移交權杖。

對外模型要求可能包含 W3C `traceparent` 標頭，此標頭僅從
作用中模型呼叫的 OpenClaw 自有診斷追蹤情境產生。
系統會取代呼叫端原先提供的 `traceparent` 標頭，因此外掛或
自訂供應商選項無法偽造跨服務追蹤祖先關係。

只有在你的收集器及保留政策已獲核准，可處理提示詞、回應、工具或
系統提示詞文字時，才將 `diagnostics.otel.captureContent.*` 設為 `true`。
各子鍵彼此獨立：

- `inputMessages`——使用者提示詞內容。
- `outputMessages`——模型回應內容。
- `toolInputs`——工具引數承載資料。
- `toolOutputs`——工具結果承載資料。
- `systemPrompt`——組合後的系統／開發人員提示詞。
- `toolDefinitions`——模型工具名稱、說明及結構描述。

啟用任何子鍵時，模型和工具 span 只會取得該類別的有界、已遮蔽
`openclaw.content.*` 屬性。

<Note>
布林值 `captureContent: true` 會同時啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions` 及 OTLP 記錄本文，但**不會**啟用 `systemPrompt`——如果也需要組合後的系統提示詞，請明確設定 `captureContent.systemPrompt: true`。
</Note>

`toolInputs`/`toolOutputs` 內容會針對內建代理程式
執行環境的工具執行進行擷取（完成／錯誤 span 上的
`openclaw.content.tool_input` 和
`gen_ai.tool.call.arguments`；
完成 span 上的 `openclaw.content.tool_output` 和
`gen_ai.tool.call.result`）。`openclaw.content.*` 名稱仍是穩定的 OpenClaw 屬性
名稱；`gen_ai.tool.call.*` 副本會鏡像這些名稱，以供原生支援 semconv 的檢視器使用。
外部執行框架工具呼叫（Codex、Claude 命令列介面）會發出
不含內容承載資料的 `tool.execution.*` span。擷取的內容會透過
受信任、僅限監聽器的通道傳輸，且絕不會放到公開診斷事件
匯流排上。

## 取樣與排清

- **追蹤：** `diagnostics.otel.sampleRate` 僅在根跨度上設定 `TraceIdRatioBasedSampler`
  （`0.0` 會捨棄全部，`1.0` 會保留全部）。未設定時使用
  OpenTelemetry SDK 的預設值（永遠啟用）。
- **指標：** `diagnostics.otel.flushIntervalMs`（下限為
  `1000`）；未設定時使用 SDK 的週期性匯出預設值。
- **日誌：** OTLP 日誌遵循 `logging.level`（檔案日誌層級），並使用
  診斷日誌記錄的遮蔽路徑，而非主控台格式。高流量
  安裝環境應優先使用 OTLP 收集器的取樣／篩選，而非本機
  取樣。若你的平台已將 stdout/stderr 傳送至日誌處理器，且你沒有 OTLP 日誌
  收集器，請設定 `diagnostics.otel.logsExporter: "stdout"`。
  Stdout 記錄每行為一個 JSON 物件，包含 `ts`、`signal`、
  `service.name`、嚴重性、本文、已遮蔽的屬性，以及可用時可信任的追蹤
  欄位。
- **檔案日誌關聯：** 當日誌呼叫帶有有效的診斷追蹤情境時，JSONL 檔案日誌會包含頂層的 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，讓日誌處理器能將本機日誌行與
  已匯出的跨度建立關聯。
- **請求關聯：** 閘道 HTTP 請求和 WebSocket 訊框會建立
  內部請求追蹤範圍。該範圍內的日誌和診斷事件
  預設會繼承請求追蹤，而代理程式執行和模型呼叫
  跨度則會建立為子項，使提供者的 `traceparent` 標頭維持在
  同一追蹤中。
- **模型呼叫關聯：** `openclaw.model.call` 跨度預設包含安全的提示詞
  元件大小，並在提供者結果公開用量時包含每次呼叫的權杖屬性。`openclaw.model.usage` 仍是執行層級的
  計量跨度，用於彙總成本、情境和頻道儀表板；當發出事件的執行階段具有可信任的
  追蹤情境時，它會維持在同一診斷追蹤中。

### 模型呼叫觀察單位

每個 `openclaw.model.call` 跨度都透過
`openclaw.model_call.observation_unit` 識別其生命週期所衡量的項目：

- `request` - 一個可觀察的模型／提供者請求。原生嵌入式模型
  呼叫使用此單位，而為了與較舊或外部的發出端相容，匯出器會將缺少的值視為 `request`。
- `turn` - 一個不透明的代理程式命令列介面回合，其中可能包含隱藏的模型請求、
  重試、工具作業或背景作業。Claude Code 命令列介面和 Codex app-server
  呼叫使用此單位。

這兩種單位都維持為模型呼叫跨度，讓追蹤後端能呈現模型輸入、
輸出、用量和階層。請求跨度使用由 API 衍生的 GenAI 操作
（`chat`、`generate_content` 或 `text_completion`），而回合跨度使用
`gen_ai.operation.name = invoke_agent`。兩者都會計入
`gen_ai.client.operation.duration`，其中操作名稱會將直接
請求延遲與完整回合延遲分開。OpenClaw 的 OTEL 模型呼叫
指標也包含 `openclaw.model_call.observation_unit`；Prometheus
模型呼叫指標則公開對應的 `observation_unit` 標籤。

### Claude Code 命令列介面模型呼叫精確度

Claude Code 命令列介面回合會發出一個合成的回合層級 `openclaw.model.call`
跨度。這些並非 Anthropic HTTP 請求跨度。它們使用 `openclaw.api =
claude-code`、`openclaw.model_call.observation_unit = turn`，並將
操作識別為 `gen_ai.operation.name = invoke_agent`。它們透過
`openclaw.transport` 識別 OpenClaw 的命令列介面邊界：

- `stdio` - 一次性本機 Claude Code 程序。
- `stdio-live` - 受管理的持續性 Claude stdio 工作階段中的一個回合。
- `paired-node-cli` - 委派給已配對
  節點的一次性 Claude Code 執行。

只有在程序診斷
分派器已啟用，且已附加內部或可信任的事件接聽器時，才會具現化 Claude 命令列介面診斷。
若沒有啟用可觀測性外掛或其他接聽器，Claude 命令列介面回合會略過
合成追蹤階層、內容緩衝區和診斷串流位元組
計量。啟用內容擷取時，提示詞和系統提示詞欄位
各自上限為 128 KiB；助理輸出最多可跨
200 個封裝，總上限為 128 KiB，並為最終可見的
後備回應保留 16 KiB 和一個項目。達到限制時會以標記記錄截斷。

OpenClaw 為 Claude 命令列介面回合提供與其他
代理程式執行階段相同的擁有權階層：`openclaw.harness.run`（`openclaw.harness.id = claude-cli`）
包含 `openclaw.run`，後者再包含 Claude `openclaw.model.call`
跨度。控管框架和執行跨度是合成的 OpenClaw 回合邊界，而非
Claude Code 內部階段。一次性回合和受管理的 stdio 回合使用相同的
階層；真正的新工作階段重試會在同一 OpenClaw 執行內建立另一個模型呼叫子項。

跨度會在 OpenClaw 接納已準備的命令列介面回合時開始，並只在
該回合成功或失敗後結束。對於受管理的工作階段，當 Claude 回報仍有保留結果的背景代理程式或
工作流程時，暫時性的成功結果不會結束跨度；
清空後的最終結果才會結束跨度。中止、逾時、程序失敗、
輸出／剖析失敗和其他回合失敗都會以錯誤結束同一跨度。

Claude Code 會回報每則助理訊息的用量，也可能在其終端結果中回報累計
用量。OpenClaw 回覆計量會繼續使用最後一則
助理訊息，因此現有成本語意不會改變；回合層級的模型呼叫跨度會在可用時使用終端累計用量，
包括快取讀取和快取建立權杖。

對於這些命令列介面跨度，位元組和計時欄位描述的是可觀察的 OpenClaw
命令列介面邊界：

- `openclaw.model_call.request_bytes` 是透過一次性 stdin/argv 傳送的提示詞值，
  或受管理的 stdio JSONL 使用者封裝的 UTF-8 大小。它
  並非 Claude Code 隱藏模型請求的大小。
- `openclaw.model_call.response_bytes` 是回合期間觀察到的 Claude 命令列介面 stdout 的 UTF-8 大小。
  它並非 Anthropic HTTP 回應大小。
- `openclaw.model_call.time_to_first_byte_ms` 是首次觀察到
  Claude 命令列介面 stdout 或 stderr 輸出所需的時間。它並非網路 TTFB。

啟用相符的細粒度 `captureContent` 欄位後，跨度會透過
`gen_ai.input.messages`、`gen_ai.output.messages` 和
`gen_ai.system_instructions` 匯出 OpenClaw 傳送給 Claude Code 的有效提示詞、OpenClaw 附加的系統
提示詞，以及可見的助理文字／推理／工具呼叫身分。
工具引數、不透明的思考簽章和
工具結果會從 Claude 助理封裝中省略。OpenClaw 不會聲稱能存取 Claude Code 的私人系統提示詞、隱藏的已續接或
已壓縮請求承載資料、原生內部工具結構描述、原始 Anthropic HTTP
請求、內部重試、上游請求 ID 或真實的網路 TTFB。由於
Claude Code 無法準確公開其有效的原生工具定義，
這些跨度不會填入 `gen_ai.tool.definitions`。

即使已啟用工具內容
擷取，外部 Claude 控管框架工具跨度仍僅包含中繼資料。與所有模型跨度相同，擷取的 Claude 命令列介面內容會使用
僅限可信任接聽器的路徑，以及匯出器既有的遮蔽和大小
界限；內容預設維持關閉。

## 已匯出的指標

### 模型用量

- `openclaw.tokens`（計數器，屬性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（計數器，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方圖，屬性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方圖，屬性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方圖，GenAI 語意慣例指標，屬性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方圖，秒，模型請求和合成代理程式回合的 GenAI 語意慣例指標；屬性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、選用的 `error.type`；回合觀察使用 `gen_ai.operation.name = invoke_agent`）
- `openclaw.model_call.duration_ms`（直方圖，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、`openclaw.model_call.observation_unit`，以及已分類錯誤上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方圖，最終模型請求承載資料的 UTF-8 位元組大小；對於 Claude Code 命令列介面，為上述可觀察的提示詞輸入／封裝；不含原始承載資料內容）
- `openclaw.model_call.response_bytes`（直方圖，串流回應區塊承載資料的 UTF-8 位元組大小；高頻文字、思考和工具呼叫差異僅計入增量 `delta` 位元組；對於 Claude Code 命令列介面，為觀察到的 stdout 位元組；不含原始回應內容）
- `openclaw.model_call.time_to_first_byte_ms`（直方圖，第一個串流回應事件前經過的時間；對於 Claude Code 命令列介面，為第一個可觀察的命令列介面輸出，而非網路 TTFB）
- `openclaw.model.failover`（計數器，屬性：`openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（計數器，屬性：`openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`、選用的 `openclaw.agent`、選用的 `openclaw.toolName`）

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

### 佇列與工作階段

- `openclaw.queue.lane.enqueue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（計數器，屬性：`openclaw.lane`）
- `openclaw.queue.depth`（直方圖，屬性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方圖，屬性：`openclaw.lane`）
- `openclaw.session.state`（計數器，屬性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（計數器，屬性：`openclaw.state`；針對可復原的過時工作階段簿記而發出）
- `openclaw.session.stuck_age_ms`（直方圖，屬性：`openclaw.state`；針對可復原的過時工作階段簿記而發出）
- `openclaw.session.turn.created`（計數器，屬性：`openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（計數器，屬性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方圖，屬性：與對應的復原計數器相同）
- `openclaw.run.attempt`（計數器，屬性：`openclaw.attempt`）

### 工作階段存活遙測

當 OpenClaw 觀察到回覆、工具、狀態、區塊或 ACP 執行階段有進度時，`processing` 工作階段不會隨時間接近內建的存活門檻。輸入中保活訊號不算進度，因此仍可偵測無聲的模型或框架。

OpenClaw 依其仍可觀察到的工作對工作階段進行分類：

- `session.long_running`：作用中的嵌入式工作、模型呼叫或工具呼叫
  仍在推進。具擁有者的無聲模型呼叫也會在內建中止門檻之前回報為長時間執行，因此當中止仍可觀察時，緩慢或非串流模型供應商不會看起來像停滯的閘道工作階段。
- `session.stalled`：存在作用中的工作，但作用中的執行最近未回報
  進度。具擁有者的模型呼叫會在達到或超過內建中止門檻時，從 `session.long_running` 切換為
  `session.stalled`；沒有擁有者的過時模型／工具活動不會被視為無害的長時間執行工作。
  停滯的嵌入式執行一開始僅供觀察，之後若達到中止門檻仍無進度，便會進行中止並排空，
  讓該通道後方排隊的輪次得以繼續。
- `session.stuck`：沒有作用中工作的過時工作階段簿記，或具有過時且
  無擁有者之模型／工具活動的閒置排隊工作階段。復原閘門通過後，這會立即釋放
  受影響的工作階段通道。

復原會發出結構化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。只有在產生變更的復原結果（`aborted` 或 `released`）之後，且
同一處理世代仍為目前世代時，診斷工作階段狀態才會標示為閒置。

只有 `session.stuck` 會發出 `openclaw.session.stuck` 計數器、
`openclaw.session.stuck_age_ms` 直方圖和 `openclaw.session.stuck`
跨度。當工作階段維持不變時，重複的 `session.stuck` 診斷會進行退避，因此儀表板應針對持續增加發出警示，而不是
針對每次心跳偵測發出警示。如需設定選項與預設值，請參閱
[設定參考](/zh-TW/gateway/configuration-reference#diagnostics)。

存活警告也會發出：

- `openclaw.liveness.warning`（計數器，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方圖，屬性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方圖，屬性：`openclaw.liveness.reason`）

### 框架生命週期

- `openclaw.harness.duration_ms`（直方圖，屬性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，發生錯誤時另有 `openclaw.harness.phase`）

### 工具執行與迴圈偵測

- `openclaw.tool.execution.duration_ms`（直方圖，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，發生錯誤時另有 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（計數器，屬性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（計數器，屬性：`openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`，選用的 `openclaw.loop.paired_tool`；偵測到重複的工具呼叫迴圈時發出）

### Exec

- `openclaw.exec.duration_ms`（直方圖，屬性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診斷內部機制（記憶體、承載資料、匯出器健全狀況）

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
  - 預設為 `gen_ai.system`，若選擇採用最新的 GenAI 語意慣例則為 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 預設為 `gen_ai.system`，若選擇採用最新的 GenAI 語意慣例則為 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、`openclaw.model_call.observation_unit`（`request` 或 `turn`）
  - `openclaw.errorCategory`、`error.type`，以及發生錯誤時選用的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（僅限安全的元件大小，不含提示文字）
  - 當結果包含該請求或彙總輪次的用量時，會有 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - 當上游供應商結果公開請求 ID 時，跨度事件 `openclaw.provider.request` 會包含屬性 `openclaw.upstreamRequestIdHash`（有界、以雜湊為基礎）；絕不匯出原始 ID
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 時，請求跨度會使用最新的 GenAI 推論跨度名稱 `{gen_ai.operation.name} {gen_ai.request.model}`。輪次跨度使用 `invoke_agent`，因為 OpenClaw 不會透過不透明的命令列介面邊界宣稱原生代理程式名稱。兩者都使用 `CLIENT` 跨度種類，而非 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 發生錯誤時：`openclaw.harness.phase`、`openclaw.errorCategory`、選用的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`gen_ai.operation.name`（`execute_tool`）、`openclaw.toolName`、`openclaw.tool.source`、選用的 `gen_ai.tool.call.id`、`openclaw.tool.owner`、`openclaw.tool.params.*`
  - 發生錯誤時選用的 `openclaw.errorCategory`/`openclaw.errorCode`，遭原則或沙箱拒絕時則有 `openclaw.deniedReason` 和 `openclaw.outcome=blocked`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不含提示、歷程記錄、回應或工作階段金鑰內容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、選用的 `openclaw.loop.paired_tool`（不含迴圈訊息、參數或工具輸出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.reason`、`openclaw.memory.rss_bytes`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.heap_total_bytes`、`openclaw.memory.external_bytes`、`openclaw.memory.array_buffers_bytes`、選用的 `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

明確啟用內容擷取後，模型和工具跨度也可
針對你選擇加入的特定內容類別，包含有界且經過遮蔽處理的 `openclaw.content.*` 屬性。

## 診斷事件目錄

下列事件支援上述指標與跨度，或可供外掛直接
訂閱。`run.progress` 和 `run.execution_phase` 是僅供直接使用的
生命週期訊號；diagnostics-otel 外掛不會將其匯出為
獨立的 OTLP 訊號。事件種類與 `run.execution_phase.phase` 值採
累加方式擴充。TypeScript 使用者應保留預設分支，不應假設
任一聯集會永久窮舉所有情況。

**模型用量**

- `model.usage`－權杖、成本、持續時間、上下文、供應商／模型／頻道、
  工作階段 ID。`usage` 是用於成本與遙測的供應商／輪次統計；
  `context.used` 是目前的提示／上下文快照，在涉及快取輸入或工具迴圈呼叫時，可能低於
  供應商的 `usage.total`。

**訊息流程**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**佇列與工作階段**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase`（公開、與工作階段關聯的嵌入式執行器啟動里程碑）
- `diagnostic.heartbeat`（彙總計數器：網路鉤子／佇列／工作階段）

**框架生命週期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error`－
  代理程式框架的每次執行生命週期。包含 `harnessId`、選用的
  `pluginId`、供應商／模型／頻道及執行 ID。完成時會新增
  `durationMs`、`outcome`、選用的 `resultClassification`、`yieldDetected`
  和 `itemLifecycle` 計數。錯誤時會新增 `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及
  選用的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 終端結果、持續時間、目標、模式、結束
  代碼及失敗類型。不包含命令文字與工作目錄。
- `exec.approval.followup_suppressed` - 工作階段重新繫結後，捨棄過期的核准後續處理。
  包含 `approvalId`、`reason`
  （`session_rebound`）、`phase`（`direct_delivery` 或 `gateway_preflight`）
  及分派器時間戳記。不包含工作階段金鑰、路由與命令文字。

## 不使用匯出器

無須執行 `diagnostics-otel`，即可讓外掛或自訂接收端使用診斷事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要輸出特定偵錯資訊而不提高 `logging.level`，請使用診斷
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

旗標輸出會寫入標準記錄檔（`logging.file`），且仍會由
`logging.redactSensitive` 遮蔽敏感資訊。完整指南：
[診斷旗標](/zh-TW/diagnostics/flags)。

## 停用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

或者不要在 `plugins.allow` 中加入 `diagnostics-otel`，或執行
`openclaw plugins disable diagnostics-otel`。

## 相關內容

- [記錄](/zh-TW/logging) - 檔案記錄、主控台輸出、命令列介面尾端追蹤，以及控制介面的「記錄」分頁
- [閘道記錄內部機制](/zh-TW/gateway/logging) - WS 記錄樣式、子系統前置詞與主控台擷取
- [診斷旗標](/zh-TW/diagnostics/flags) - 特定偵錯記錄旗標
- [診斷匯出](/zh-TW/gateway/diagnostics) - 運作人員支援套件工具（與 OTEL 匯出分開）
- [設定參考](/zh-TW/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 欄位參考
