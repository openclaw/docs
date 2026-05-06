---
read_when:
    - Bạn muốn gửi mức sử dụng mô hình OpenClaw, luồng tin nhắn hoặc chỉ số phiên đến bộ thu thập OpenTelemetry
    - Bạn đang tích hợp dữ liệu theo dõi, chỉ số hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một phần phụ trợ OTLP khác
    - Bạn cần tên chính xác của các chỉ số, tên span hoặc cấu trúc thuộc tính để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất dữ liệu chẩn đoán của OpenClaw sang bất kỳ bộ thu OpenTelemetry nào thông qua Plugin diagnostics-otel (OTLP/HTTP)
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:14:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất chẩn đoán thông qua Plugin chính thức `diagnostics-otel`
bằng **OTLP/HTTP (protobuf)**. Bất kỳ collector hoặc backend nào chấp nhận OTLP/HTTP
đều hoạt động mà không cần thay đổi mã. Để biết nhật ký tệp cục bộ và cách đọc, xem
[Nhật ký](/vi/logging).

## Cách các phần kết nối với nhau

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc, trong tiến trình, do
  Gateway và các Plugin đi kèm phát ra cho lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi
  và exec.
- **Plugin `diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **chỉ số**, **trace** và **nhật ký** OpenTelemetry qua OTLP/HTTP.
- **Lệnh gọi nhà cung cấp** nhận header W3C `traceparent` từ ngữ cảnh span lệnh gọi mô hình
  đáng tin cậy của OpenClaw khi cơ chế truyền tải của nhà cung cấp chấp nhận
  header tùy chỉnh. Ngữ cảnh trace do Plugin phát ra không được truyền tiếp.
- Các trình xuất chỉ được gắn khi cả bề mặt chẩn đoán và Plugin đều
  được bật, nên chi phí trong tiến trình mặc định gần như bằng không.

## Bắt đầu nhanh

Đối với bản cài đặt đóng gói, hãy cài Plugin trước:

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

Bạn cũng có thể bật Plugin từ CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` hiện chỉ hỗ trợ `http/protobuf`. `grpc` bị bỏ qua.
</Note>

## Tín hiệu được xuất

| Tín hiệu     | Nội dung đưa vào                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chỉ số**   | Bộ đếm và histogram cho mức sử dụng token, chi phí, thời lượng chạy, luồng tin nhắn, làn hàng đợi, trạng thái phiên, exec và áp lực bộ nhớ.     |
| **Trace**    | Span cho mức sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh và vòng lặp công cụ. |
| **Nhật ký**  | Bản ghi `logging.file` có cấu trúc được xuất qua OTLP khi `diagnostics.otel.logs` được bật.                                                       |

Bật/tắt `traces`, `metrics` và `logs` độc lập. Cả ba mặc định bật
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

| Biến                                                                                                              | Mục đích                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics` hoặc `/v1/logs`, giá trị đó được dùng nguyên trạng.                                                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Ghi đè endpoint theo từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo tín hiệu thắng env theo tín hiệu, và env theo tín hiệu thắng endpoint dùng chung.                    |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức truyền tải (hiện nay chỉ `http/protobuf` được áp dụng).                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát thuộc tính span GenAI thử nghiệm mới nhất (`gen_ai.provider.name`) thay vì `gen_ai.system` cũ. Chỉ số GenAI luôn dùng các thuộc tính ngữ nghĩa có giới hạn và độ đa dạng thấp.          |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload hoặc tiến trình host khác đã đăng ký SDK OpenTelemetry toàn cục. Khi đó Plugin bỏ qua vòng đời NodeSDK của chính nó nhưng vẫn nối listener chẩn đoán và tôn trọng `traces`/`metrics`/`logs`.              |

## Quyền riêng tư và ghi lại nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Span mang các
định danh có giới hạn (kênh, nhà cung cấp, mô hình, danh mục lỗi, id yêu cầu chỉ ở dạng băm)
và không bao giờ bao gồm văn bản prompt, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ hoặc
khóa phiên.

Yêu cầu mô hình gửi ra ngoài có thể bao gồm header W3C `traceparent`. Header đó
chỉ được tạo từ ngữ cảnh trace chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình
đang hoạt động. Header `traceparent` do caller cung cấp sẵn sẽ bị thay thế, nên Plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo nguồn gốc trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn được phê duyệt cho văn bản prompt, phản hồi, công cụ hoặc
system-prompt. Mỗi khóa con được bật riêng:

- `inputMessages` - nội dung prompt của người dùng.
- `outputMessages` - nội dung phản hồi của mô hình.
- `toolInputs` - payload đối số công cụ.
- `toolOutputs` - payload kết quả công cụ.
- `systemPrompt` - prompt hệ thống/nhà phát triển đã lắp ráp.

Khi bất kỳ khóa con nào được bật, span mô hình và công cụ nhận các thuộc tính
`openclaw.content.*` có giới hạn và đã biên tập chỉ cho lớp đó.

## Lấy mẫu và đẩy dữ liệu

- **Trace:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` loại bỏ tất cả,
  `1.0` giữ lại tất cả).
- **Chỉ số:** `diagnostics.otel.flushIntervalMs` (tối thiểu `1000`).
- **Nhật ký:** Nhật ký OTLP tôn trọng `logging.level` (mức nhật ký tệp). Chúng dùng
  đường dẫn biên tập bản ghi nhật ký chẩn đoán, không dùng định dạng console. Bản cài đặt
  lưu lượng lớn nên ưu tiên lấy mẫu/lọc ở collector OTLP thay vì lấy mẫu cục bộ.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId` và `traceFlags` cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh
  trace chẩn đoán hợp lệ, cho phép bộ xử lý nhật ký nối các dòng nhật ký cục bộ với
  span đã xuất.
- **Tương quan yêu cầu:** Yêu cầu HTTP Gateway và frame WebSocket tạo một
  phạm vi trace yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán trong phạm vi đó
  mặc định kế thừa trace yêu cầu, trong khi span lượt chạy tác nhân và lệnh gọi mô hình
  được tạo làm con để header `traceparent` của nhà cung cấp vẫn nằm trên cùng trace.

## Chỉ số được xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (bộ đếm, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (bộ đếm, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, chỉ số quy ước ngữ nghĩa GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, giây, chỉ số quy ước ngữ nghĩa GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, tùy chọn `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cộng thêm `openclaw.errorCategory` và `openclaw.failureKind` trên lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (histogram, kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng; không có nội dung payload thô)
- `openclaw.model_call.response_bytes` (histogram, kích thước byte UTF-8 của sự kiện phản hồi mô hình được stream; không có nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, thời gian đã trôi qua trước sự kiện phản hồi được stream đầu tiên)

### Luồng tin nhắn

- `openclaw.webhook.received` (bộ đếm, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (bộ đếm, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (bộ đếm, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (bộ đếm, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (bộ đếm, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, attrs: `openclaw.state`; chỉ phát cho sổ sách phiên cũ không có công việc đang hoạt động)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; chỉ phát cho sổ sách phiên cũ không có công việc đang hoạt động)
- `openclaw.run.attempt` (bộ đếm, attrs: `openclaw.attempt`)

### Đo lường trạng thái sống của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng tuổi không có tiến triển cho chẩn đoán
trạng thái sống của phiên. Một phiên `processing` không tăng tuổi đến ngưỡng này
trong khi OpenClaw quan sát được tiến triển reply, tool, status, block hoặc runtime ACP.
Typing keepalive không được tính là tiến triển, nên một mô hình hoặc harness im lặng vẫn có thể
được phát hiện.

OpenClaw phân loại phiên theo công việc mà nó vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi model hoặc lệnh gọi công cụ vẫn đang tiến triển.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy hiện tại chưa báo cáo tiến trình gần đây. Các lượt chạy nhúng bị đình trệ ban đầu vẫn chỉ quan sát, sau đó hủy-xả sau `diagnostics.stuckSessionAbortMs` mà không có tiến trình để các lượt đang xếp hàng phía sau lane có thể tiếp tục. Khi chưa đặt, ngưỡng hủy mặc định là cửa sổ mở rộng an toàn hơn, ít nhất 10 phút và gấp 5 lần `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: bookkeeping phiên đã lỗi thời mà không có công việc đang hoạt động. Trạng thái này giải phóng lane phiên bị ảnh hưởng ngay lập tức.

Khôi phục phát ra các sự kiện `session.recovery.requested` và `session.recovery.completed` có cấu trúc. Trạng thái phiên chẩn đoán chỉ được đánh dấu idle sau một kết quả khôi phục có thay đổi (`aborted` hoặc `released`) và chỉ khi cùng thế hệ xử lý vẫn đang hiện hành.

Chỉ `session.stuck` phát ra bộ đếm `openclaw.session.stuck`, histogram `openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`. Các chẩn đoán `session.stuck` lặp lại sẽ back off trong khi phiên vẫn không đổi, vì vậy dashboard nên cảnh báo khi mức tăng kéo dài thay vì mọi tick heartbeat. Để biết núm cấu hình và mặc định, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` khi có lỗi)

### Thực thi

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Nội bộ chẩn đoán (bộ nhớ và vòng lặp công cụ)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được chọn dùng
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được chọn dùng
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash dựa trên SHA có giới hạn của id yêu cầu provider upstream; id thô không được xuất)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi có lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` tùy chọn
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung prompt, history, response hoặc session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (không có thông báo vòng lặp, params hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Khi thu thập nội dung được bật rõ ràng, các span model và công cụ cũng có thể bao gồm các thuộc tính `openclaw.content.*` có giới hạn và đã biên tập cho các lớp nội dung cụ thể mà bạn đã chọn dùng.

## Danh mục sự kiện chẩn đoán

Các sự kiện dưới đây hỗ trợ các metric và span ở trên. Plugin cũng có thể đăng ký trực tiếp vào chúng mà không cần xuất OTLP.

**Mức sử dụng model**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, provider/model/channel, id phiên. `usage` là phần hạch toán theo provider/lượt cho chi phí và telemetry; `context.used` là snapshot prompt/ngữ cảnh hiện tại và có thể thấp hơn `usage.total` của provider khi có input được cache hoặc các lệnh gọi vòng lặp công cụ.

**Luồng thông báo**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhooks/queue/session)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - vòng đời theo từng lượt chạy cho agent harness. Bao gồm `harnessId`, `pluginId` tùy chọn, provider/model/channel và run id. Khi hoàn tất, bổ sung `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected` và số đếm `itemLifecycle`. Lỗi bổ sung `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` và `cleanupFailed` tùy chọn.

**Thực thi**

- `exec.process.completed` - kết quả terminal, thời lượng, target, mode, exit code và loại lỗi. Văn bản lệnh và thư mục làm việc không được bao gồm.

## Không có exporter

Bạn có thể giữ các sự kiện chẩn đoán khả dụng cho Plugin hoặc sink tùy chỉnh mà không chạy `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để có đầu ra gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy dùng các cờ chẩn đoán. Cờ không phân biệt chữ hoa chữ thường và hỗ trợ wildcard (ví dụ: `telegram.*` hoặc `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc dưới dạng ghi đè env dùng một lần:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra cờ đi tới tệp log tiêu chuẩn (`logging.file`) và vẫn được biên tập bởi `logging.redactSensitive`. Hướng dẫn đầy đủ: [Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Bạn cũng có thể bỏ `diagnostics-otel` khỏi `plugins.allow`, hoặc chạy `openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi log](/vi/logging) - log tệp, đầu ra console, tailing qua CLI và tab Logs của Control UI
- [Nội bộ ghi log Gateway](/vi/gateway/logging) - kiểu log WS, tiền tố subsystem và thu thập console
- [Cờ chẩn đoán](/vi/diagnostics/flags) - cờ debug-log có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) - công cụ support-bundle cho operator (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ cho trường `diagnostics.*`
