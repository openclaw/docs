---
read_when:
    - Bạn muốn gửi số liệu về mức sử dụng mô hình, luồng tin nhắn hoặc phiên của OpenClaw đến một trình thu thập OpenTelemetry
    - Bạn đang kết nối dữ liệu truy vết, số liệu đo lường hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một hệ thống phụ trợ OTLP khác
    - Bạn cần tên chính xác của các metric, span hoặc cấu trúc thuộc tính để tạo bảng điều khiển hoặc cảnh báo
summary: Xuất dữ liệu chẩn đoán OpenClaw sang các bộ thu thập OpenTelemetry hoặc JSONL trên stdout thông qua Plugin diagnostics-otel
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T07:57:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất dữ liệu chẩn đoán thông qua plugin chính thức `diagnostics-otel`
bằng **OTLP/HTTP (protobuf)**. Nhật ký cũng có thể được ghi dưới dạng JSONL ra stdout cho
các quy trình xử lý nhật ký của vùng chứa và sandbox. Mọi bộ thu thập hoặc backend chấp nhận
OTLP/HTTP đều hoạt động mà không cần thay đổi mã. Đối với nhật ký tệp cục bộ, hãy xem
[Ghi nhật ký](/vi/logging).

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc trong tiến trình, do
  Gateway và các plugin đi kèm phát ra cho lượt chạy mô hình, luồng thông điệp, phiên, hàng đợi
  và quá trình thực thi.
- **`diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **số liệu**, **dấu vết** và **nhật ký** OpenTelemetry qua OTLP/HTTP, đồng thời có thể
  phản chiếu bản ghi nhật ký thành JSONL ra stdout.
- **Lời gọi nhà cung cấp** nhận tiêu đề W3C `traceparent` từ ngữ cảnh span
  lời gọi mô hình đáng tin cậy của OpenClaw khi phương thức truyền tải của nhà cung cấp chấp nhận
  tiêu đề tùy chỉnh. Ngữ cảnh dấu vết do plugin phát ra không được truyền tiếp.
- Các trình xuất chỉ được gắn khi cả bề mặt chẩn đoán và plugin đều
  được bật, nên theo mặc định chi phí trong tiến trình gần như bằng không.

## Bắt đầu nhanh

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

Hoặc bật plugin từ CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` chỉ hỗ trợ `http/protobuf`. Vì `traces` và `metrics` được bật theo mặc định, mọi giá trị khác (bao gồm `grpc`) sẽ hủy toàn bộ đăng ký diagnostics-otel với cảnh báo `unsupported protocol` - thao tác này cũng dừng việc xuất nhật ký ra stdout. Hãy đặt rõ `traces: false` và `metrics: false` nếu bạn chỉ muốn dùng `logsExporter: "stdout"` với một giá trị giao thức không phải OTLP.
</Note>

## Các tín hiệu được xuất

| Tín hiệu      | Nội dung                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Số liệu** | Bộ đếm/biểu đồ tần suất cho mức sử dụng token, chi phí, thời lượng lượt chạy, chuyển đổi dự phòng, mức sử dụng kỹ năng, luồng thông điệp, sự kiện Talk, làn hàng đợi, trạng thái/khôi phục phiên, thực thi công cụ, thực thi, bộ nhớ, trạng thái hoạt động và tình trạng trình xuất. |
| **Dấu vết**  | Các span cho mức sử dụng mô hình, lời gọi mô hình, vòng đời bộ khung, mức sử dụng kỹ năng, thực thi công cụ, thực thi, xử lý webhook/thông điệp, tập hợp ngữ cảnh và vòng lặp công cụ.                                                      |
| **Nhật ký**    | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP hoặc dưới dạng JSONL ra stdout khi `diagnostics.otel.logs` được bật; nội dung thân nhật ký bị ẩn trừ khi tính năng thu thập nội dung được bật rõ ràng.                          |

Bật hoặc tắt độc lập `traces`, `metrics` và `logs`. Dấu vết và số liệu
được bật theo mặc định khi `diagnostics.otel.enabled` là true; nhật ký mặc định bị tắt
và chỉ được xuất khi `diagnostics.otel.logs` được đặt rõ ràng thành `true`. Việc xuất nhật ký
mặc định dùng OTLP; đặt `diagnostics.otel.logsExporter` thành `stdout` để xuất JSONL ra
stdout hoặc `both` để xuất theo cả hai cách.

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
      protocol: "http/protobuf", // grpc vô hiệu hóa việc xuất OTLP
      serviceName: "openclaw-gateway", // nếu không đặt, dùng OTEL_SERVICE_NAME, sau đó là "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // bộ lấy mẫu span gốc, 0.0..1.0
      flushIntervalMs: 60000, // khoảng thời gian xuất số liệu (tối thiểu 1000ms)
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

### Biến môi trường

| Biến                                                                                                          | Mục đích                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Giá trị dự phòng cho `diagnostics.otel.endpoint` khi khóa cấu hình chưa được đặt.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các endpoint dự phòng dành riêng cho từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình dành riêng cho tín hiệu được ưu tiên hơn biến môi trường dành riêng cho tín hiệu, và biến đó được ưu tiên hơn endpoint dùng chung.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Giá trị dự phòng cho `diagnostics.otel.serviceName` khi khóa cấu hình chưa được đặt. Tên dịch vụ mặc định là `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Giá trị dự phòng cho giao thức truyền dẫn khi `diagnostics.otel.protocol` chưa được đặt. Chỉ `http/protobuf` mới bật việc xuất.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát ra dạng span suy luận GenAI mới nhất: tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT` và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Số liệu GenAI luôn sử dụng các thuộc tính có giới hạn và lực lượng thấp. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một tiến trình nạp trước hoặc tiến trình máy chủ khác đã đăng ký SDK OpenTelemetry toàn cục. Khi đó, plugin bỏ qua vòng đời NodeSDK của chính nó nhưng vẫn kết nối các trình lắng nghe chẩn đoán và tuân theo `traces`/`metrics`/`logs`.                                                                                    |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Các span mang những
mã định danh có giới hạn (kênh, nhà cung cấp, mô hình, loại lỗi, mã định danh yêu cầu chỉ ở dạng băm,
nguồn công cụ, chủ sở hữu công cụ, tên/nguồn kỹ năng) và không bao giờ chứa văn bản lời nhắc,
văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, đường dẫn tệp kỹ năng hoặc khóa phiên.
Các giá trị trông giống khóa phiên tác nhân có phạm vi (ví dụ bắt đầu bằng
`agent:`) được thay bằng `unknown` trong các thuộc tính có lực lượng thấp. Theo mặc định, bản ghi nhật ký
OTLP giữ lại mức độ nghiêm trọng, trình ghi nhật ký, vị trí mã, ngữ cảnh dấu vết đáng tin cậy và
các thuộc tính đã được làm sạch; thân thông điệp nhật ký thô chỉ được xuất
khi `diagnostics.otel.captureContent` là giá trị boolean `true`. Các khóa con chi tiết
`captureContent.*` không bao giờ bật thân nhật ký. Số liệu Talk chỉ xuất
siêu dữ liệu sự kiện có giới hạn (chế độ, phương thức truyền tải, nhà cung cấp, loại sự kiện) - không có
bản chép lời, tải trọng âm thanh, mã định danh phiên, mã định danh lượt, mã định danh cuộc gọi, mã định danh phòng hoặc
token chuyển giao.

Các yêu cầu gửi đến mô hình có thể bao gồm tiêu đề W3C `traceparent` chỉ được tạo
từ ngữ cảnh dấu vết chẩn đoán do OpenClaw sở hữu cho lời gọi mô hình đang hoạt động.
Các tiêu đề `traceparent` hiện có do bên gọi cung cấp sẽ bị thay thế, vì vậy plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo chuỗi nguồn gốc dấu vết liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi bộ thu thập
và chính sách lưu giữ của bạn đã được phê duyệt để xử lý văn bản lời nhắc, phản hồi, công cụ hoặc
lời nhắc hệ thống. Mỗi khóa con hoạt động độc lập:

- `inputMessages` - nội dung lời nhắc của người dùng.
- `outputMessages` - nội dung phản hồi của mô hình.
- `toolInputs` - tải trọng đối số của công cụ.
- `toolOutputs` - tải trọng kết quả của công cụ.
- `systemPrompt` - lời nhắc hệ thống/nhà phát triển đã được tập hợp.
- `toolDefinitions` - tên, mô tả và lược đồ công cụ của mô hình.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ sẽ nhận thuộc tính
`openclaw.content.*` có giới hạn và đã được biên tập chỉ dành cho lớp đó.

<Note>
Giá trị boolean `captureContent: true` bật đồng thời `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` và thân nhật ký OTLP, nhưng **không** bật `systemPrompt` - hãy đặt rõ `captureContent.systemPrompt: true` nếu bạn cũng cần lời nhắc hệ thống đã được tập hợp.
</Note>

Nội dung `toolInputs`/`toolOutputs` được thu thập cho các lần thực thi công cụ
của môi trường chạy tác nhân tích hợp sẵn (`openclaw.content.tool_input` và
`gen_ai.tool.call.arguments` trên các span hoàn tất/lỗi;
`openclaw.content.tool_output` và `gen_ai.tool.call.result` trên các span hoàn tất).
Tên `openclaw.content.*` vẫn là tên thuộc tính OpenClaw ổn định;
các bản sao `gen_ai.tool.call.*` phản chiếu chúng cho các trình xem tương thích semconv.
Các lời gọi công cụ của bộ khung bên ngoài (Codex, Claude CLI) phát ra
các span `tool.execution.*` không có tải trọng nội dung. Nội dung được thu thập truyền qua một
kênh đáng tin cậy chỉ dành cho trình lắng nghe và không bao giờ được đưa lên bus sự kiện chẩn đoán
công khai.

## Lấy mẫu và đẩy dữ liệu định kỳ

- **Dấu vết:** `diagnostics.otel.sampleRate` thiết lập một `TraceIdRatioBasedSampler`
  chỉ trên span gốc (`0.0` loại bỏ tất cả, `1.0` giữ lại tất cả). Nếu không thiết lập,
  hệ thống sử dụng giá trị mặc định của OpenTelemetry SDK (luôn bật).
- **Số liệu:** `diagnostics.otel.flushIntervalMs` (được giới hạn ở mức tối thiểu
  `1000`); nếu không thiết lập, hệ thống sử dụng giá trị xuất định kỳ mặc định của SDK.
- **Nhật ký:** Nhật ký OTLP tuân theo `logging.level` (cấp độ nhật ký tệp) và sử dụng
  quy trình che dữ liệu bản ghi nhật ký chẩn đoán, không sử dụng định dạng bảng điều khiển.
  Các bản cài đặt có lưu lượng lớn nên ưu tiên lấy mẫu/lọc tại bộ thu thập OTLP thay vì
  lấy mẫu cục bộ. Đặt `diagnostics.otel.logsExporter: "stdout"` khi nền tảng của bạn
  đã chuyển stdout/stderr đến một bộ xử lý nhật ký và bạn không có bộ thu thập nhật ký
  OTLP. Mỗi bản ghi stdout là một đối tượng JSON trên mỗi dòng, gồm `ts`, `signal`,
  `service.name`, mức độ nghiêm trọng, nội dung, các thuộc tính đã được che dữ liệu và
  các trường dấu vết đáng tin cậy khi có.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`, `spanId`,
  `parentSpanId` và `traceFlags` ở cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh
  dấu vết chẩn đoán hợp lệ, cho phép các bộ xử lý nhật ký liên kết các dòng nhật ký
  cục bộ với những span đã xuất.
- **Tương quan yêu cầu:** Các yêu cầu HTTP và khung WebSocket của Gateway tạo một
  phạm vi dấu vết yêu cầu nội bộ. Theo mặc định, nhật ký và sự kiện chẩn đoán trong
  phạm vi đó kế thừa dấu vết yêu cầu, còn các span của lượt chạy tác tử và lệnh gọi
  mô hình được tạo dưới dạng span con để các tiêu đề `traceparent` của nhà cung cấp
  nằm trên cùng một dấu vết.
- **Tương quan lệnh gọi mô hình:** Theo mặc định, các span `openclaw.model.call`
  bao gồm kích thước an toàn của các thành phần lời nhắc và thuộc tính token cho từng
  lệnh gọi khi kết quả của nhà cung cấp cung cấp thông tin sử dụng.
  `openclaw.model.usage` vẫn là span tính toán ở cấp lượt chạy cho chi phí tổng hợp,
  ngữ cảnh và bảng điều khiển kênh, đồng thời duy trì trên cùng dấu vết chẩn đoán khi
  môi trường thực thi phát sự kiện có ngữ cảnh dấu vết đáng tin cậy.

## Số liệu được xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (bộ đếm, thuộc tính: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (biểu đồ tần suất, thuộc tính: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (biểu đồ tần suất, số liệu theo quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (biểu đồ tần suất, giây, số liệu theo quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` không bắt buộc)
- `openclaw.model_call.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cùng với `openclaw.errorCategory` và `openclaw.failureKind` đối với các lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (biểu đồ tần suất, kích thước tính bằng byte UTF-8 của phần tải yêu cầu mô hình cuối cùng; không chứa nội dung phần tải thô)
- `openclaw.model_call.response_bytes` (biểu đồ tần suất, kích thước tính bằng byte UTF-8 của phần tải các đoạn phản hồi truyền trực tuyến; các delta văn bản, suy luận và lệnh gọi công cụ có tần suất cao chỉ tính số byte `delta` gia tăng; không chứa nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (biểu đồ tần suất, thời gian đã trôi qua trước sự kiện phản hồi truyền trực tuyến đầu tiên)
- `openclaw.model.failover` (bộ đếm, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (bộ đếm, thuộc tính: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` không bắt buộc, `openclaw.toolName` không bắt buộc)

### Luồng tin nhắn

- `openclaw.webhook.received` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Trò chuyện

- `openclaw.talk.event` (bộ đếm, thuộc tính: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát khi một sự kiện Trò chuyện báo cáo thời lượng)
- `openclaw.talk.audio.bytes` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát cho các sự kiện khung âm thanh Trò chuyện có báo cáo độ dài byte)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.depth` (biểu đồ tần suất, thuộc tính: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (biểu đồ tần suất, thuộc tính: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, thuộc tính: `openclaw.state`; được phát cho dữ liệu theo dõi phiên đã cũ nhưng có thể khôi phục)
- `openclaw.session.stuck_age_ms` (biểu đồ tần suất, thuộc tính: `openclaw.state`; được phát cho dữ liệu theo dõi phiên đã cũ nhưng có thể khôi phục)
- `openclaw.session.turn.created` (bộ đếm, thuộc tính: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (biểu đồ tần suất, thuộc tính: giống bộ đếm khôi phục tương ứng)
- `openclaw.run.attempt` (bộ đếm, thuộc tính: `openclaw.attempt`)

### Dữ liệu đo từ xa về tình trạng hoạt động của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng thời gian không có tiến triển dùng cho chẩn đoán
tình trạng hoạt động của phiên. Một phiên `processing` không tiến gần đến ngưỡng này
khi OpenClaw quan sát thấy tiến triển về phản hồi, công cụ, trạng thái, khối hoặc môi trường
thực thi ACP. Các tín hiệu duy trì trạng thái đang nhập không được tính là tiến triển, vì vậy
mô hình hoặc bộ điều phối im lặng vẫn có thể được phát hiện.

OpenClaw phân loại phiên theo công việc mà hệ thống vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi
  công cụ vẫn đang tiến triển. Các lệnh gọi mô hình có chủ sở hữu nhưng vẫn im lặng quá
  `diagnostics.stuckSessionWarnMs` cũng được báo cáo là đang chạy lâu trước
  `diagnostics.stuckSessionAbortMs`, để các nhà cung cấp mô hình chậm hoặc không truyền
  trực tuyến không bị xem như các phiên Gateway bị đình trệ khi vẫn có thể quan sát việc hủy.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy hiện tại không báo cáo
  tiến triển gần đây. Các lệnh gọi mô hình có chủ sở hữu chuyển từ `session.long_running`
  sang `session.stalled` tại hoặc sau `diagnostics.stuckSessionAbortMs`; hoạt động mô hình/
  công cụ đã cũ và không có chủ sở hữu không được xem là công việc chạy lâu vô hại.
  Ban đầu, các lượt chạy nhúng bị đình trệ chỉ được quan sát, sau đó chuyển sang hủy và
  tháo cạn sau `diagnostics.stuckSessionAbortMs` nếu không có tiến triển, để các lượt đang
  xếp hàng phía sau làn có thể tiếp tục. Khi không thiết lập, ngưỡng hủy mặc định là khoảng
  thời gian mở rộng an toàn hơn, ít nhất 5 phút và gấp 3 lần
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: dữ liệu theo dõi phiên đã cũ nhưng không có công việc đang hoạt động,
  hoặc một phiên xếp hàng đang nhàn rỗi có hoạt động mô hình/công cụ đã cũ và không có
  chủ sở hữu. Điều này giải phóng làn phiên bị ảnh hưởng ngay sau khi vượt qua các cổng
  khôi phục.

Quá trình khôi phục phát các sự kiện có cấu trúc `session.recovery.requested` và
`session.recovery.completed`. Trạng thái phiên chẩn đoán chỉ được đánh dấu là nhàn rỗi
sau một kết quả khôi phục có thay đổi trạng thái (`aborted` hoặc `released`) và chỉ khi
cùng thế hệ xử lý đó vẫn còn hiện hành.

Chỉ `session.stuck` phát bộ đếm `openclaw.session.stuck`, biểu đồ tần suất
`openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`. Các chẩn đoán
`session.stuck` lặp lại sẽ giãn dần khi phiên không thay đổi, vì vậy bảng điều khiển nên
cảnh báo theo mức tăng kéo dài thay vì theo mỗi nhịp Heartbeat. Để biết tùy chọn cấu hình
và các giá trị mặc định, hãy xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

Cảnh báo tình trạng hoạt động cũng phát:

- `openclaw.liveness.warning` (bộ đếm, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (biểu đồ tần suất, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (biểu đồ tần suất, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (biểu đồ tần suất, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (biểu đồ tần suất, thuộc tính: `openclaw.liveness.reason`)

### Vòng đời bộ điều phối

- `openclaw.harness.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` khi có lỗi)

### Thực thi công cụ và phát hiện vòng lặp

- `openclaw.tool.execution.duration_ms` (biểu đồ tần suất, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, cùng với `openclaw.errorCategory` khi có lỗi)
- `openclaw.tool.execution.blocked` (bộ đếm, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` không bắt buộc; được phát khi phát hiện một vòng lặp lệnh gọi công cụ lặp đi lặp lại)

### Thực thi lệnh

- `openclaw.exec.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Thành phần nội bộ của chẩn đoán (bộ nhớ, phần tải, tình trạng bộ xuất)

- `openclaw.payload.large` (bộ đếm, thuộc tính: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (biểu đồ tần suất, thuộc tính: giống `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (các biểu đồ tần suất, không có thuộc tính; mẫu bộ nhớ tiến trình)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (bộ đếm, thuộc tính: `openclaw.diagnostic.async_queue.drop_class`; số mục bị loại bỏ do áp lực ngược của hàng đợi chẩn đoán nội bộ)
- `openclaw.telemetry.exporter.events` (bộ đếm, thuộc tính: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` không bắt buộc, `openclaw.errorCategory` không bắt buộc; dữ liệu tự đo từ xa về vòng đời/lỗi của bộ xuất)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - Mặc định là `gen_ai.system`, hoặc `gen_ai.provider.name` khi chọn sử dụng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Mặc định là `gen_ai.system`, hoặc `gen_ai.provider.name` khi chọn sử dụng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (chỉ kích thước an toàn của các thành phần, không có văn bản lời nhắc)
  - `openclaw.model_call.usage.*` và `gen_ai.usage.*` khi kết quả lệnh gọi mô hình chứa dữ liệu sử dụng từ nhà cung cấp cho lệnh gọi riêng lẻ đó
  - Sự kiện span `openclaw.provider.request` với thuộc tính `openclaw.upstreamRequestIdHash` (có giới hạn, dựa trên hàm băm) khi kết quả từ nhà cung cấp thượng nguồn cung cấp mã định danh yêu cầu; mã định danh thô không bao giờ được xuất
  - Với `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, các span lệnh gọi mô hình sử dụng tên span suy luận GenAI mới nhất `{gen_ai.operation.name} {gen_ai.request.model}` và loại span `CLIENT` thay cho `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi có lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` tùy chọn
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` tùy chọn, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` tùy chọn khi có lỗi; `openclaw.deniedReason` và `openclaw.outcome=blocked` khi bị chính sách hoặc hộp cát từ chối
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung lời nhắc, lịch sử, phản hồi hoặc khóa phiên)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` tùy chọn (không có thông báo vòng lặp, tham số hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` tùy chọn

Khi tính năng thu thập nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` đã được biên tập và giới hạn cho những
lớp nội dung cụ thể mà bạn đã chọn sử dụng.

## Danh mục sự kiện chẩn đoán

Các sự kiện bên dưới làm cơ sở cho những số liệu và span ở trên. Các Plugin cũng có thể
đăng ký nhận trực tiếp các sự kiện này mà không cần xuất qua OTLP.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  mã định danh phiên. `usage` là dữ liệu hạch toán theo nhà cung cấp/lượt cho chi phí và phép đo từ xa;
  `context.used` là ảnh chụp nhanh lời nhắc/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu đệm hoặc các lệnh gọi trong vòng lặp công cụ.

**Luồng thông báo**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (các bộ đếm tổng hợp: webhook/hàng đợi/phiên)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  vòng đời theo từng lượt chạy của harness tác tử. Bao gồm `harnessId`, `pluginId`
  tùy chọn, nhà cung cấp/mô hình/kênh và mã định danh lượt chạy. Khi hoàn tất, bổ sung
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`
  và các số đếm `itemLifecycle`. Khi có lỗi, bổ sung `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` và
  `cleanupFailed` tùy chọn.

**Thực thi**

- `exec.process.completed` - kết quả cuối của tiến trình, thời lượng, đích, chế độ, mã
  thoát và loại lỗi. Văn bản lệnh và thư mục làm việc không được
  bao gồm.
- `exec.approval.followup_suppressed` - lượt theo dõi phê duyệt đã cũ bị loại bỏ
  sau khi một phiên được liên kết lại. Bao gồm `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` hoặc `gateway_preflight`)
  và dấu thời gian của bộ điều phối. Khóa phiên, tuyến và văn bản lệnh
  không được bao gồm.

## Không có trình xuất

Duy trì khả năng cung cấp các sự kiện chẩn đoán cho Plugin hoặc đích nhận tùy chỉnh mà không cần chạy
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để có đầu ra gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy sử dụng các cờ chẩn đoán.
Các cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (`telegram.*` hoặc
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc dùng biến môi trường ghi đè một lần:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra của cờ được ghi vào tệp nhật ký tiêu chuẩn (`logging.file`) và vẫn được
biên tập theo `logging.redactSensitive`. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Hoặc không đưa `diagnostics-otel` vào `plugins.allow`, hoặc chạy
`openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi nhật ký](/vi/logging) - nhật ký tệp, đầu ra bảng điều khiển, theo dõi bằng CLI và thẻ Logs trong Control UI
- [Cơ chế ghi nhật ký nội bộ của Gateway](/vi/gateway/logging) - kiểu nhật ký WS, tiền tố hệ thống con và thu thập đầu ra bảng điều khiển
- [Cờ chẩn đoán](/vi/diagnostics/flags) - các cờ nhật ký gỡ lỗi có mục tiêu
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics) - công cụ gói hỗ trợ dành cho người vận hành (tách biệt với xuất OTEL)
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tài liệu tham chiếu đầy đủ cho các trường `diagnostics.*`
