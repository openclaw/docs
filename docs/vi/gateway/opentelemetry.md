---
read_when:
    - Bạn muốn gửi mức sử dụng mô hình OpenClaw, luồng tin nhắn hoặc chỉ số phiên đến bộ thu thập OpenTelemetry
    - Bạn đang tích hợp dấu vết, chỉ số hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một backend OTLP khác
    - Bạn cần tên chỉ số, tên span hoặc cấu trúc thuộc tính chính xác để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất dữ liệu chẩn đoán OpenClaw tới bất kỳ bộ thu thập OpenTelemetry nào thông qua Plugin diagnostics-otel (OTLP/HTTP)
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-04-29T22:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất chẩn đoán thông qua Plugin `diagnostics-otel` được đóng gói kèm
bằng **OTLP/HTTP (protobuf)**. Mọi collector hoặc backend chấp nhận OTLP/HTTP
đều hoạt động mà không cần thay đổi mã. Để biết nhật ký tệp cục bộ và cách đọc chúng, xem
[Nhật ký](/vi/logging).

## Cách các phần kết nối với nhau

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc, trong tiến trình, do
  Gateway và các Plugin được đóng gói kèm phát ra cho các lần chạy mô hình, luồng tin nhắn, phiên, hàng đợi,
  và exec.
- **Plugin `diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **metrics**, **traces**, và **logs** OpenTelemetry qua OTLP/HTTP.
- **Lệnh gọi provider** nhận header W3C `traceparent` từ ngữ cảnh span lệnh gọi mô hình
  đáng tin cậy của OpenClaw khi transport của provider chấp nhận header tùy chỉnh.
  Ngữ cảnh trace do Plugin phát ra không được lan truyền.
- Exporter chỉ gắn vào khi cả bề mặt chẩn đoán và Plugin đều
  được bật, vì vậy chi phí trong tiến trình mặc định gần như bằng không.

## Bắt đầu nhanh

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

| Tín hiệu      | Nội dung bên trong                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counter và histogram cho mức sử dụng token, chi phí, thời lượng chạy, luồng tin nhắn, làn hàng đợi, trạng thái phiên, exec, và áp lực bộ nhớ.          |
| **Traces**  | Span cho mức sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh, và vòng lặp công cụ. |
| **Logs**    | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP khi `diagnostics.otel.logs` được bật.                                              |

Bật/tắt độc lập `traces`, `metrics`, và `logs`. Cả ba đều mặc định bật
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

| Biến                                                                                                          | Mục đích                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics`, hoặc `/v1/logs`, giá trị đó được dùng nguyên trạng.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các ghi đè endpoint theo tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo tín hiệu thắng env theo tín hiệu, rồi env theo tín hiệu thắng endpoint dùng chung.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức trên đường truyền (hiện chỉ `http/protobuf` được tôn trọng).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát thuộc tính span GenAI thử nghiệm mới nhất (`gen_ai.provider.name`) thay vì `gen_ai.system` cũ. Metrics GenAI luôn dùng các thuộc tính ngữ nghĩa có biên, cardinality thấp trong mọi trường hợp. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload hoặc tiến trình host khác đã đăng ký OpenTelemetry SDK toàn cục. Khi đó Plugin bỏ qua vòng đời NodeSDK riêng nhưng vẫn nối listener chẩn đoán và tôn trọng `traces`/`metrics`/`logs`.                |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Span mang các
định danh có biên (kênh, provider, mô hình, danh mục lỗi, mã định danh yêu cầu chỉ dạng hash)
và không bao giờ bao gồm văn bản prompt, văn bản phản hồi, input công cụ, output công cụ, hoặc
khóa phiên.

Yêu cầu mô hình gửi đi có thể bao gồm header W3C `traceparent`. Header đó chỉ
được tạo từ ngữ cảnh trace chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình
đang hoạt động. Các header `traceparent` hiện có do caller cung cấp sẽ bị thay thế, vì vậy Plugin hoặc
tùy chọn provider tùy chỉnh không thể giả mạo tổ tiên trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn được phê duyệt cho văn bản prompt, phản hồi, công cụ, hoặc system-prompt.
Mỗi khóa con được opt-in độc lập:

- `inputMessages` — nội dung prompt của người dùng.
- `outputMessages` — nội dung phản hồi của mô hình.
- `toolInputs` — payload đối số công cụ.
- `toolOutputs` — payload kết quả công cụ.
- `systemPrompt` — prompt hệ thống/nhà phát triển đã lắp ráp.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ nhận các thuộc tính
`openclaw.content.*` có biên, đã được biên tập lại chỉ cho lớp đó.

## Sampling và flushing

- **Traces:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` bỏ tất cả,
  `1.0` giữ tất cả).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (tối thiểu `1000`).
- **Logs:** Nhật ký OTLP tôn trọng `logging.level` (mức nhật ký tệp). Chúng dùng
  đường dẫn biên tập lại bản ghi nhật ký chẩn đoán, không phải định dạng console. Các bản cài đặt
  có lưu lượng cao nên ưu tiên sampling/filtering ở collector OTLP hơn sampling cục bộ.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId`, và `traceFlags` ở cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh
  trace chẩn đoán hợp lệ, cho phép bộ xử lý nhật ký nối các dòng nhật ký cục bộ với
  span đã xuất.
- **Tương quan yêu cầu:** Yêu cầu HTTP Gateway và frame WebSocket tạo một
  phạm vi trace yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán bên trong phạm vi đó
  mặc định kế thừa trace yêu cầu, trong khi các span chạy agent và lệnh gọi mô hình được
  tạo làm con để header `traceparent` của provider vẫn nằm trên cùng một trace.

## Metrics được xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, giây, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, tùy chọn `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cộng thêm `openclaw.errorCategory` và `openclaw.failureKind` trên các lỗi đã phân loại)
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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` trên lỗi)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Nội bộ chẩn đoán (bộ nhớ và vòng lặp công cụ)

- `openclaw.memory.heap_used_bytes` (biểu đồ tần suất, thuộc tính: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (biểu đồ tần suất)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)

## Các khoảng theo dõi được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn dùng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn dùng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hàm băm có giới hạn dựa trên SHA của mã định danh yêu cầu từ nhà cung cấp thượng nguồn; mã định danh thô không được xuất)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung lời nhắc, lịch sử, phản hồi hoặc khóa phiên)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (không có thông điệp vòng lặp, tham số hoặc đầu ra của công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Khi việc ghi lại nội dung được bật rõ ràng, các khoảng theo dõi của mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` có giới hạn và đã được biên tập cho những lớp
nội dung cụ thể mà bạn đã chọn.

## Danh mục sự kiện chẩn đoán

Các sự kiện bên dưới hỗ trợ các số liệu và khoảng theo dõi ở trên. Plugin cũng có thể đăng ký nhận
chúng trực tiếp mà không cần xuất OTLP.

**Mức sử dụng mô hình**

- `model.usage` — mã thông báo, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  mã định danh phiên. `usage` là phần hạch toán theo nhà cung cấp/lượt cho chi phí và dữ liệu đo từ xa;
  `context.used` là ảnh chụp lời nhắc/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu trong bộ nhớ đệm hoặc các lệnh gọi vòng lặp công cụ.

**Luồng thông điệp**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhook/hàng đợi/phiên)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  vòng đời theo từng lượt chạy cho harness tác nhân. Bao gồm `harnessId`, `pluginId` tùy chọn,
  nhà cung cấp/mô hình/kênh và mã định danh lượt chạy. Khi hoàn tất, bổ sung
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`,
  và số lượng `itemLifecycle`. Lỗi bổ sung `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` — kết quả thiết bị đầu cuối, thời lượng, đích, chế độ, mã thoát
  và loại lỗi. Văn bản lệnh và thư mục làm việc không được
  bao gồm.

## Không có trình xuất

Bạn có thể giữ các sự kiện chẩn đoán sẵn dùng cho Plugin hoặc bộ nhận tùy chỉnh mà không cần
chạy `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để có đầu ra gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy dùng các
cờ chẩn đoán. Cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (ví dụ `telegram.*` hoặc
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc dưới dạng ghi đè env một lần:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra cờ đi vào tệp nhật ký tiêu chuẩn (`logging.file`) và vẫn được
biên tập bởi `logging.redactSensitive`. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Bạn cũng có thể không đưa `diagnostics-otel` vào `plugins.allow`, hoặc chạy
`openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi nhật ký](/vi/logging) — nhật ký tệp, đầu ra bảng điều khiển, theo dõi từ CLI và thẻ Nhật ký của Control UI
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con và ghi lại bảng điều khiển
- [Cờ chẩn đoán](/vi/diagnostics/flags) — cờ nhật ký gỡ lỗi có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) — công cụ gói hỗ trợ cho người vận hành (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ cho trường `diagnostics.*`
