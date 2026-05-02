---
read_when:
    - Bạn muốn gửi mức sử dụng mô hình OpenClaw, luồng tin nhắn hoặc số liệu phiên đến một bộ thu thập OpenTelemetry
    - Bạn đang tích hợp dấu vết, chỉ số hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một hệ thống phụ trợ OTLP khác
    - Bạn cần tên chỉ số chính xác, tên span hoặc cấu trúc thuộc tính để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất chẩn đoán OpenClaw sang bất kỳ bộ thu thập OpenTelemetry nào thông qua Plugin diagnostics-otel (OTLP/HTTP)
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T10:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất chẩn đoán thông qua Plugin `diagnostics-otel` chính thức
bằng **OTLP/HTTP (protobuf)**. Mọi collector hoặc backend chấp nhận OTLP/HTTP
đều hoạt động mà không cần thay đổi mã. Với nhật ký tệp cục bộ và cách đọc chúng, xem
[Nhật ký](/vi/logging).

## Cách mọi thứ kết nối với nhau

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc, trong tiến trình, được phát ra bởi
  Gateway và các Plugin đi kèm cho các lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi,
  và exec.
- **Plugin `diagnostics-otel`** đăng ký theo dõi các sự kiện đó và xuất chúng dưới dạng
  **metrics**, **traces**, và **logs** của OpenTelemetry qua OTLP/HTTP.
- **Lệnh gọi nhà cung cấp** nhận header W3C `traceparent` từ ngữ cảnh span lệnh gọi mô hình
  đáng tin cậy của OpenClaw khi transport của nhà cung cấp chấp nhận header tùy chỉnh.
  Ngữ cảnh trace do Plugin phát ra không được lan truyền.
- Exporter chỉ gắn vào khi cả bề mặt chẩn đoán và Plugin đều được bật,
  nên chi phí trong tiến trình mặc định gần như bằng không.

## Bắt đầu nhanh

Với các bản cài đặt đóng gói, trước tiên hãy cài Plugin:

```bash
openclaw plugins install @openclaw/diagnostics-otel
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

Bạn cũng có thể bật Plugin từ CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` hiện chỉ hỗ trợ `http/protobuf`. `grpc` bị bỏ qua.
</Note>

## Tín hiệu được xuất

| Tín hiệu     | Nội dung bên trong                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics**  | Bộ đếm và histogram cho mức sử dụng token, chi phí, thời lượng chạy, luồng tin nhắn, lane hàng đợi, trạng thái phiên, exec, và áp lực bộ nhớ. |
| **Traces**   | Các span cho mức sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh, và vòng lặp công cụ. |
| **Logs**     | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP khi `diagnostics.otel.logs` được bật.                                             |

Bật/tắt `traces`, `metrics`, và `logs` độc lập. Cả ba mặc định bật
khi `diagnostics.otel.enabled` là true.

## Tham chiếu cấu hình

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

### Biến môi trường

| Biến                                                                                                              | Mục đích                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics`, hoặc `/v1/logs`, giá trị đó được dùng nguyên trạng.                                                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các ghi đè endpoint theo từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo tín hiệu thắng env theo tín hiệu, và env theo tín hiệu thắng endpoint dùng chung.                 |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức truyền trên dây (hiện nay chỉ `http/protobuf` được tôn trọng).                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát thuộc tính span GenAI thử nghiệm mới nhất (`gen_ai.provider.name`) thay vì `gen_ai.system` cũ. Metrics GenAI luôn dùng các thuộc tính ngữ nghĩa có giới hạn, cardinality thấp.            |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload hoặc tiến trình host khác đã đăng ký OpenTelemetry SDK toàn cục. Khi đó Plugin bỏ qua vòng đời NodeSDK riêng nhưng vẫn nối các listener chẩn đoán và tôn trọng `traces`/`metrics`/`logs`.                   |

## Quyền riêng tư và thu thập nội dung

Nội dung mô hình/công cụ thô mặc định **không** được xuất. Các span mang các
định danh có giới hạn (kênh, nhà cung cấp, mô hình, danh mục lỗi, id yêu cầu chỉ dạng hash)
và không bao giờ bao gồm văn bản prompt, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, hoặc
khóa phiên.

Yêu cầu mô hình đi ra có thể bao gồm header W3C `traceparent`. Header đó chỉ được
tạo từ ngữ cảnh trace chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình đang hoạt động.
Các header `traceparent` do caller hiện có cung cấp sẽ bị thay thế, nên Plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo quan hệ tổ tiên trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn đã được phê duyệt cho văn bản prompt, phản hồi, công cụ, hoặc system-prompt.
Mỗi khóa con được bật theo cơ chế opt-in độc lập:

- `inputMessages` — nội dung prompt của người dùng.
- `outputMessages` — nội dung phản hồi của mô hình.
- `toolInputs` — payload đối số công cụ.
- `toolOutputs` — payload kết quả công cụ.
- `systemPrompt` — prompt hệ thống/nhà phát triển đã lắp ráp.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ nhận thuộc tính
`openclaw.content.*` có giới hạn, đã biên tập cho riêng lớp đó.

## Lấy mẫu và flush

- **Traces:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` loại bỏ tất cả,
  `1.0` giữ lại tất cả).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (tối thiểu `1000`).
- **Logs:** Nhật ký OTLP tôn trọng `logging.level` (mức nhật ký tệp). Chúng dùng
  đường dẫn biên tập bản ghi nhật ký chẩn đoán, không phải định dạng console. Các bản cài đặt
  lưu lượng cao nên ưu tiên lấy mẫu/lọc ở OTLP collector hơn lấy mẫu cục bộ.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId`, và `traceFlags` cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh
  trace chẩn đoán hợp lệ, cho phép bộ xử lý nhật ký nối các dòng nhật ký cục bộ với
  các span đã xuất.
- **Tương quan yêu cầu:** Các yêu cầu HTTP Gateway và frame WebSocket tạo một
  phạm vi trace yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán bên trong phạm vi đó
  mặc định kế thừa trace yêu cầu, trong khi span lượt chạy agent và lệnh gọi mô hình được
  tạo dưới dạng con để header `traceparent` của nhà cung cấp vẫn nằm trên cùng trace.

## Metrics được xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, giây, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, tùy chọn `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cộng với `openclaw.errorCategory` và `openclaw.failureKind` trên lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (histogram, kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng; không có nội dung payload thô)
- `openclaw.model_call.response_bytes` (histogram, kích thước byte UTF-8 của sự kiện phản hồi mô hình được stream; không có nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, thời gian đã trôi qua trước sự kiện phản hồi được stream đầu tiên)

### Luồng tin nhắn

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; chỉ phát ra cho bookkeeping phiên cũ không có công việc đang hoạt động)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; chỉ phát ra cho bookkeeping phiên cũ không có công việc đang hoạt động)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetry về trạng thái sống của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng tuổi không có tiến triển cho chẩn đoán
trạng thái sống của phiên. Một phiên `processing` không tăng tuổi về phía ngưỡng này
khi OpenClaw quan sát thấy tiến triển runtime về trả lời, công cụ, trạng thái, block, hoặc ACP.
Typing keepalive không được tính là tiến triển, nên một mô hình hoặc harness im lặng
vẫn có thể được phát hiện.

OpenClaw phân loại phiên theo công việc mà nó vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi công cụ
  vẫn đang tiến triển.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy đang hoạt động chưa báo cáo
  tiến trình gần đây.
- `session.stuck`: sổ sách phiên đã cũ và không có công việc đang hoạt động. Đây là
  phân loại trạng thái sống duy nhất giải phóng làn phiên bị ảnh hưởng.

Chỉ `session.stuck` phát ra bộ đếm `openclaw.session.stuck`, histogram
`openclaw.session.stuck_age_ms`, và span `openclaw.session.stuck`.
Các chẩn đoán `session.stuck` lặp lại sẽ lùi nhịp khi phiên vẫn
không thay đổi, nên dashboard nên cảnh báo khi có mức tăng kéo dài thay vì trên từng
nhịp heartbeat. Để biết nút cấu hình và giá trị mặc định, xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, thuộc tính: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` khi có lỗi)

### Exec

- `openclaw.exec.duration_ms` (histogram, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Nội bộ chẩn đoán (vòng lặp bộ nhớ và công cụ)

- `openclaw.memory.heap_used_bytes` (histogram, thuộc tính: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được bật
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được bật
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash dựa trên SHA có giới hạn của id yêu cầu nhà cung cấp upstream; id thô không được xuất)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi có lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` tùy chọn
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung prompt, lịch sử, phản hồi hoặc khóa phiên)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (không có thông điệp vòng lặp, tham số hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Khi tính năng ghi lại nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` có giới hạn, đã được biên tập lại cho những
lớp nội dung cụ thể mà bạn đã chọn tham gia.

## Danh mục sự kiện chẩn đoán

Các sự kiện dưới đây hỗ trợ các số liệu và span ở trên. Plugin cũng có thể đăng ký
trực tiếp các sự kiện này mà không cần xuất OTLP.

**Mức sử dụng mô hình**

- `model.usage` — token, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  id phiên. `usage` là kế toán theo nhà cung cấp/lượt cho chi phí và đo từ xa;
  `context.used` là ảnh chụp prompt/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu cache hoặc lệnh gọi vòng lặp công cụ.

**Luồng thông điệp**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhooks/queue/session)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  vòng đời theo từng lượt chạy cho harness của agent. Bao gồm `harnessId`, `pluginId`
  tùy chọn, nhà cung cấp/mô hình/kênh, và id lượt chạy. Hoàn tất sẽ thêm
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`,
  và số lượng `itemLifecycle`. Lỗi sẽ thêm `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` — kết quả cuối của terminal, thời lượng, mục tiêu, chế độ, mã thoát,
  và loại lỗi. Văn bản lệnh và thư mục làm việc không được
  bao gồm.

## Không có exporter

Bạn có thể giữ các sự kiện chẩn đoán khả dụng cho Plugin hoặc sink tùy chỉnh mà không
chạy `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để có đầu ra gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy dùng các cờ chẩn đoán.
Cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (ví dụ `telegram.*` hoặc
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc dưới dạng ghi đè env dùng một lần:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra cờ đi vào tệp nhật ký tiêu chuẩn (`logging.file`) và vẫn
được biên tập lại bởi `logging.redactSensitive`. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Bạn cũng có thể loại `diagnostics-otel` khỏi `plugins.allow`, hoặc chạy
`openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi nhật ký](/vi/logging) — nhật ký tệp, đầu ra console, tailing bằng CLI, và tab Nhật ký của Control UI
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con, và ghi lại console
- [Cờ chẩn đoán](/vi/diagnostics/flags) — cờ nhật ký gỡ lỗi có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) — công cụ gói hỗ trợ cho operator (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ cho trường `diagnostics.*`
