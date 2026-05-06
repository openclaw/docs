---
read_when:
    - Bạn muốn gửi thông tin sử dụng mô hình OpenClaw, luồng tin nhắn hoặc chỉ số phiên đến trình thu thập OpenTelemetry
    - Bạn đang kết nối dấu vết, số liệu hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một phần phụ trợ OTLP khác
    - Bạn cần tên chính xác của các chỉ số, tên span hoặc cấu trúc thuộc tính để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất chẩn đoán OpenClaw sang bất kỳ bộ thu OpenTelemetry nào thông qua Plugin diagnostics-otel (OTLP/HTTP)
title: Xuất dữ liệu OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T10:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất diagnostics thông qua plugin chính thức `diagnostics-otel`
bằng **OTLP/HTTP (protobuf)**. Mọi collector hoặc backend chấp nhận OTLP/HTTP
đều hoạt động mà không cần thay đổi mã. Để biết log tệp cục bộ và cách đọc chúng, xem
[Logging](/vi/logging).

## Cách các phần khớp với nhau

- **Sự kiện diagnostics** là các bản ghi có cấu trúc, trong tiến trình, do
  Gateway và các plugin đi kèm phát ra cho lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi
  và exec.
- **Plugin `diagnostics-otel`** đăng ký theo dõi các sự kiện đó và xuất chúng dưới dạng
  OpenTelemetry **metrics**, **traces**, và **logs** qua OTLP/HTTP.
- **Lệnh gọi provider** nhận header W3C `traceparent` từ
  ngữ cảnh span lệnh gọi mô hình đáng tin cậy của OpenClaw khi tầng truyền tải provider chấp nhận
  header tùy chỉnh. Ngữ cảnh trace do plugin phát ra không được truyền tiếp.
- Exporter chỉ gắn vào khi cả bề mặt diagnostics và plugin đều
  được bật, nên chi phí trong tiến trình mặc định gần như bằng không.

## Bắt đầu nhanh

Với bản cài đặt đóng gói, hãy cài plugin trước:

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

Bạn cũng có thể bật plugin từ CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` hiện chỉ hỗ trợ `http/protobuf`. `grpc` bị bỏ qua.
</Note>

## Tín hiệu được xuất

| Tín hiệu     | Nội dung bên trong                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counter và histogram cho mức dùng token, chi phí, thời lượng chạy, luồng tin nhắn, sự kiện Talk, lane hàng đợi, trạng thái/khôi phục phiên, exec, và áp lực bộ nhớ. |
| **Traces**  | Span cho mức dùng mô hình, lệnh gọi mô hình, vòng đời harness, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh, và vòng lặp công cụ.              |
| **Logs**    | Bản ghi `logging.file` có cấu trúc được xuất qua OTLP khi `diagnostics.otel.logs` được bật.                                                                         |

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

| Biến                                                                                                              | Mục đích                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics`, hoặc `/v1/logs`, giá trị đó được dùng nguyên trạng.                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Ghi đè endpoint theo từng tín hiệu, dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo từng tín hiệu thắng env theo từng tín hiệu, và env theo từng tín hiệu thắng endpoint dùng chung.               |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức truyền qua mạng (hiện chỉ `http/protobuf` được tôn trọng).                                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát thuộc tính span GenAI thử nghiệm mới nhất (`gen_ai.provider.name`) thay cho `gen_ai.system` cũ. Metrics GenAI luôn dùng thuộc tính ngữ nghĩa có giới hạn và số lượng giá trị thấp bất kể vậy. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload hoặc tiến trình host khác đã đăng ký SDK OpenTelemetry toàn cục. Khi đó plugin bỏ qua vòng đời NodeSDK riêng nhưng vẫn nối listener diagnostics và tôn trọng `traces`/`metrics`/`logs`.                         |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Span mang các
định danh có giới hạn (kênh, provider, mô hình, danh mục lỗi, id yêu cầu chỉ có hash)
và không bao giờ bao gồm văn bản prompt, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, hoặc
khóa phiên.
Metrics Talk chỉ xuất metadata sự kiện có giới hạn như chế độ, tầng truyền tải,
provider, và loại sự kiện. Chúng không bao gồm transcript, payload âm thanh,
id phiên, id lượt, id cuộc gọi, id phòng, hoặc token bàn giao.

Yêu cầu mô hình đi ra có thể bao gồm header W3C `traceparent`. Header đó
chỉ được tạo từ ngữ cảnh trace diagnostics thuộc sở hữu OpenClaw cho lệnh gọi mô hình
đang hoạt động. Các header `traceparent` do caller cung cấp sẵn sẽ bị thay thế, nên plugin hoặc
tùy chọn provider tùy chỉnh không thể giả mạo quan hệ tổ tiên trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn được phê duyệt cho văn bản prompt, phản hồi, công cụ, hoặc system-prompt.
Mỗi khóa con được chọn bật độc lập:

- `inputMessages` - nội dung prompt của người dùng.
- `outputMessages` - nội dung phản hồi của mô hình.
- `toolInputs` - payload đối số công cụ.
- `toolOutputs` - payload kết quả công cụ.
- `systemPrompt` - prompt hệ thống/developer đã lắp ráp.

Khi bất kỳ khóa con nào được bật, span mô hình và công cụ nhận các thuộc tính
`openclaw.content.*` có giới hạn, đã biên tập lại chỉ cho lớp đó.

## Lấy mẫu và flush

- **Traces:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` loại bỏ tất cả,
  `1.0` giữ tất cả).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (tối thiểu `1000`).
- **Logs:** log OTLP tôn trọng `logging.level` (mức log tệp). Chúng dùng
  đường dẫn biên tập lại bản ghi log diagnostics, không dùng định dạng console. Bản cài đặt
  lưu lượng cao nên ưu tiên lấy mẫu/lọc ở OTLP collector thay vì lấy mẫu cục bộ.
- **Tương quan log tệp:** log tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId`, và `traceFlags` cấp cao nhất khi lệnh gọi log mang ngữ cảnh
  trace diagnostics hợp lệ, cho phép bộ xử lý log nối dòng log cục bộ với
  span đã xuất.
- **Tương quan yêu cầu:** yêu cầu HTTP Gateway và frame WebSocket tạo một
  phạm vi trace yêu cầu nội bộ. Log và sự kiện diagnostics bên trong phạm vi đó
  mặc định kế thừa trace yêu cầu, trong khi span lượt chạy agent và lệnh gọi mô hình
  được tạo dưới dạng con để header `traceparent` của provider vẫn nằm trên cùng trace.

## Metrics được xuất

### Mức dùng mô hình

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, giây, metric quy ước ngữ nghĩa GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, tùy chọn `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cộng thêm `openclaw.errorCategory` và `openclaw.failureKind` trên lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (histogram, kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng; không có nội dung payload thô)
- `openclaw.model_call.response_bytes` (histogram, kích thước byte UTF-8 của sự kiện phản hồi mô hình dạng stream; không có nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, thời gian đã trôi qua trước sự kiện phản hồi dạng stream đầu tiên)

### Luồng tin nhắn

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: giống `openclaw.talk.event`; được phát khi một sự kiện Talk báo cáo thời lượng)
- `openclaw.talk.audio.bytes` (histogram, attrs: giống `openclaw.talk.event`; được phát cho sự kiện frame âm thanh Talk có báo cáo độ dài byte)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, thuộc tính: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, thuộc tính: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, thuộc tính: `openclaw.state`; chỉ được phát ra cho phần ghi sổ phiên cũ không có công việc đang hoạt động)
- `openclaw.session.stuck_age_ms` (histogram, thuộc tính: `openclaw.state`; chỉ được phát ra cho phần ghi sổ phiên cũ không có công việc đang hoạt động)
- `openclaw.session.recovery.requested` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, thuộc tính: giống bộ đếm khôi phục tương ứng)
- `openclaw.run.attempt` (bộ đếm, thuộc tính: `openclaw.attempt`)

### Telemetry về tính sống của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng tuổi không có tiến triển cho chẩn đoán
tính sống của phiên. Một phiên `processing` không tăng tuổi tới ngưỡng này
trong khi OpenClaw quan sát thấy tiến triển thời gian chạy từ phản hồi, công cụ, trạng thái, khối hoặc ACP.
Các keepalive báo đang nhập không được tính là tiến triển, nên một mô hình hoặc harness im lặng
vẫn có thể được phát hiện.

OpenClaw phân loại phiên theo công việc mà nó vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi công cụ
  vẫn đang tiến triển.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy đang hoạt động chưa báo cáo
  tiến triển gần đây. Các lượt chạy nhúng bị đình trệ ban đầu vẫn chỉ quan sát, sau đó
  hủy-xả sau `diagnostics.stuckSessionAbortMs` nếu không có tiến triển để các lượt
  được xếp hàng phía sau lane có thể tiếp tục. Khi chưa đặt, ngưỡng hủy mặc định dùng
  khoảng thời gian mở rộng an toàn hơn là ít nhất 10 phút và 5 lần
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: phần ghi sổ phiên cũ không có công việc đang hoạt động. Điều này giải phóng
  lane phiên bị ảnh hưởng ngay lập tức.

Khôi phục phát ra các sự kiện `session.recovery.requested` và
`session.recovery.completed` có cấu trúc. Trạng thái phiên chẩn đoán được đánh dấu là rảnh
chỉ sau một kết quả khôi phục có thay đổi (`aborted` hoặc `released`) và chỉ khi
cùng thế hệ xử lý đó vẫn đang là hiện tại.

Chỉ `session.stuck` phát ra bộ đếm `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`.
Các chẩn đoán `session.stuck` lặp lại sẽ giãn lùi trong khi phiên vẫn
không đổi, vì vậy dashboard nên cảnh báo dựa trên mức tăng kéo dài thay vì mọi
nhịp heartbeat. Để biết nút cấu hình và giá trị mặc định, hãy xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, thuộc tính: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` khi có lỗi)

### Exec

- `openclaw.exec.duration_ms` (histogram, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Nội bộ chẩn đoán (bộ nhớ và vòng lặp công cụ)

- `openclaw.memory.heap_used_bytes` (histogram, thuộc tính: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - Mặc định là `gen_ai.system`, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được bật
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Mặc định là `gen_ai.system`, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được bật
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash giới hạn dựa trên SHA của id yêu cầu nhà cung cấp upstream; id thô không được xuất)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung prompt, lịch sử, phản hồi hoặc khóa phiên)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (không có thông điệp vòng lặp, tham số hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Khi tính năng thu thập nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` có giới hạn và đã biên tập cho các lớp
nội dung cụ thể mà bạn đã chọn tham gia.

## Danh mục sự kiện chẩn đoán

Các sự kiện bên dưới hỗ trợ các metric và span ở trên. Plugin cũng có thể đăng ký theo dõi
chúng trực tiếp mà không cần xuất OTLP.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  id phiên. `usage` là kế toán theo nhà cung cấp/lượt cho chi phí và telemetry;
  `context.used` là ảnh chụp prompt/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu trong bộ nhớ đệm hoặc lệnh gọi vòng lặp công cụ.

**Luồng thông điệp**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhook/hàng đợi/phiên)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  vòng đời theo từng lượt chạy cho harness agent. Bao gồm `harnessId`, `pluginId` tùy chọn,
  nhà cung cấp/mô hình/kênh và id lượt chạy. Khi hoàn tất sẽ thêm
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`,
  và số lượng `itemLifecycle`. Lỗi sẽ thêm `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` - kết quả terminal, thời lượng, đích, chế độ, mã thoát,
  và loại lỗi. Văn bản lệnh và thư mục làm việc không được
  bao gồm.

## Không có exporter

Bạn có thể giữ các sự kiện chẩn đoán sẵn dùng cho Plugin hoặc sink tùy chỉnh mà không cần
chạy `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất debug có mục tiêu mà không tăng `logging.level`, hãy dùng các cờ chẩn đoán.
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

Đầu ra cờ đi tới tệp log chuẩn (`logging.file`) và vẫn được
biên tập bởi `logging.redactSensitive`. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Bạn cũng có thể để `diagnostics-otel` ngoài `plugins.allow`, hoặc chạy
`openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi log](/vi/logging) - log tệp, đầu ra console, theo dõi đuôi bằng CLI và tab Logs của Control UI
- [Nội bộ ghi log của Gateway](/vi/gateway/logging) - kiểu log WS, tiền tố hệ thống con và thu thập console
- [Cờ chẩn đoán](/vi/diagnostics/flags) - cờ debug-log có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) - công cụ support-bundle cho operator (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ cho trường `diagnostics.*`
