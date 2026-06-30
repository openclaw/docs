---
read_when:
    - Bạn muốn gửi mức sử dụng mô hình OpenClaw, luồng tin nhắn hoặc chỉ số phiên đến một bộ thu OpenTelemetry
    - Bạn đang kết nối dấu vết, chỉ số hoặc nhật ký vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một backend OTLP khác
    - Bạn cần tên chỉ số, tên span hoặc cấu trúc thuộc tính chính xác để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất chẩn đoán OpenClaw sang các bộ thu thập OpenTelemetry hoặc JSONL trên stdout thông qua plugin diagnostics-otel
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất chẩn đoán thông qua Plugin `diagnostics-otel` chính thức
bằng **OTLP/HTTP (protobuf)**. Nhật ký cũng có thể được ghi dưới dạng stdout JSONL cho
các pipeline nhật ký container và sandbox. Bất kỳ collector hoặc backend nào chấp nhận
OTLP/HTTP đều hoạt động mà không cần thay đổi mã. Đối với nhật ký tệp cục bộ và cách đọc chúng,
xem [Ghi nhật ký](/vi/logging).

## Cách các thành phần kết nối với nhau

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc, trong tiến trình, do
  Gateway và các Plugin đi kèm phát ra cho các lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi,
  và exec.
- **Plugin `diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **chỉ số**, **trace**, và **nhật ký** OpenTelemetry qua OTLP/HTTP. Nó cũng có thể
  sao chép các bản ghi nhật ký chẩn đoán sang stdout JSONL.
- **Lệnh gọi provider** nhận header W3C `traceparent` từ ngữ cảnh span
  lệnh gọi mô hình đáng tin cậy của OpenClaw khi transport của provider chấp nhận header tùy chỉnh.
  Ngữ cảnh trace do Plugin phát ra không được truyền tiếp.
- Exporter chỉ được gắn khi cả bề mặt chẩn đoán và Plugin đều
  được bật, vì vậy chi phí trong tiến trình gần như bằng 0 theo mặc định.

## Bắt đầu nhanh

Đối với bản cài đặt đóng gói, trước tiên hãy cài đặt Plugin:

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

| Tín hiệu      | Nội dung bên trong                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chỉ số** | Bộ đếm và histogram cho mức sử dụng token, chi phí, thời lượng lượt chạy, chuyển đổi dự phòng, mức sử dụng skill, luồng tin nhắn, sự kiện Talk, làn hàng đợi, trạng thái/khôi phục phiên, thực thi công cụ, payload quá lớn, exec, và áp lực bộ nhớ. |
| **Trace**  | Span cho mức sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, mức sử dụng skill, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh, và vòng lặp công cụ.                                                            |
| **Nhật ký**    | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP hoặc stdout JSONL khi `diagnostics.otel.logs` được bật; nội dung nhật ký được giữ lại trừ khi việc thu thập nội dung được bật rõ ràng.                                |

Bật/tắt `traces`, `metrics`, và `logs` độc lập. Trace và chỉ số
mặc định bật khi `diagnostics.otel.enabled` là true. Nhật ký mặc định tắt và
chỉ được xuất khi `diagnostics.otel.logs` được đặt rõ ràng là `true`. Việc xuất nhật ký
mặc định dùng OTLP; đặt `diagnostics.otel.logsExporter` thành `stdout` để có JSONL trên
stdout, hoặc `both` để gửi từng bản ghi nhật ký chẩn đoán tới cả OTLP và stdout.

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

### Biến môi trường

| Biến                                                                                                          | Mục đích                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics`, hoặc `/v1/logs`, nó được dùng nguyên trạng.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các ghi đè endpoint theo tín hiệu được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo tín hiệu thắng env theo tín hiệu, và env theo tín hiệu thắng endpoint dùng chung.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức truyền dẫn (hiện nay chỉ `http/protobuf` được tôn trọng).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát ra dạng span suy luận GenAI thử nghiệm mới nhất, bao gồm tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT`, và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Chỉ số GenAI luôn dùng các thuộc tính ngữ nghĩa có giới hạn, cardinality thấp. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload khác hoặc tiến trình host đã đăng ký OpenTelemetry SDK toàn cục. Khi đó Plugin bỏ qua vòng đời NodeSDK của riêng nó nhưng vẫn nối listener chẩn đoán và tôn trọng `traces`/`metrics`/`logs`.                                                                                                                    |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Span mang các
định danh có giới hạn (kênh, provider, mô hình, danh mục lỗi, mã định danh yêu cầu chỉ dạng hash,
nguồn công cụ, chủ sở hữu công cụ, và tên/nguồn skill) và không bao giờ bao gồm văn bản prompt,
văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, đường dẫn tệp skill, hoặc khóa phiên.
Bản ghi nhật ký OTLP giữ mức độ nghiêm trọng, logger, vị trí mã, ngữ cảnh trace đáng tin cậy,
và các thuộc tính đã được làm sạch theo mặc định, nhưng phần nội dung thông điệp nhật ký thô chỉ được xuất
khi `diagnostics.otel.captureContent` được đặt thành boolean `true`. Các khóa con
`captureContent.*` chi tiết không bật nội dung nhật ký. Các nhãn trông giống như
khóa phiên tác tử có phạm vi được thay bằng `unknown`.
Chỉ số Talk chỉ xuất siêu dữ liệu sự kiện có giới hạn như chế độ, transport,
provider, và loại sự kiện. Chúng không bao gồm bản chép lời, payload âm thanh,
mã định danh phiên, mã định danh lượt, mã định danh cuộc gọi, mã định danh phòng, hoặc token chuyển giao.

Yêu cầu mô hình gửi ra có thể bao gồm header W3C `traceparent`. Header đó
chỉ được tạo từ ngữ cảnh trace chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình đang hoạt động.
Các header `traceparent` do caller cung cấp sẵn sẽ bị thay thế, vì vậy Plugin hoặc
tùy chọn provider tùy chỉnh không thể giả mạo quan hệ tổ tiên trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn được phê duyệt cho văn bản prompt, phản hồi, công cụ, hoặc system-prompt.
Mỗi khóa con là opt-in độc lập:

- `inputMessages` - nội dung prompt của người dùng.
- `outputMessages` - nội dung phản hồi của mô hình.
- `toolInputs` - payload đối số công cụ.
- `toolOutputs` - payload kết quả công cụ.
- `systemPrompt` - system/developer prompt đã lắp ráp.
- `toolDefinitions` - tên, mô tả, và schema công cụ của mô hình.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ nhận thuộc tính
`openclaw.content.*` có giới hạn, đã được biên tập cho riêng lớp đó. Chỉ dùng boolean
`captureContent: true` cho các lần thu thập chẩn đoán rộng khi phần nội dung thông điệp nhật ký
OTLP cũng được phê duyệt để xuất.

Nội dung `toolInputs`/`toolOutputs` được thu thập cho các lần thực thi công cụ của runtime tác tử tích hợp sẵn
(`openclaw.content.tool_input` trên span completed/error,
`openclaw.content.tool_output` trên span completed). Các lệnh gọi công cụ harness bên ngoài
(Codex, Claude CLI) phát ra span `tool.execution.*` mà không có payload nội dung.
Nội dung được thu thập đi qua một kênh đáng tin cậy, chỉ dành cho listener và không bao giờ được đặt
trên bus sự kiện chẩn đoán công khai.

## Lấy mẫu và flush

- **Dấu vết:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` bỏ tất cả,
  `1.0` giữ tất cả).

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được chọn sử dụng
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi các quy ước ngữ nghĩa GenAI mới nhất được chọn sử dụng
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (chỉ kích thước thành phần an toàn, không có văn bản prompt)
  - `openclaw.model_call.usage.*` và `gen_ai.usage.*` khi kết quả lệnh gọi mô hình mang thông tin sử dụng của provider cho lệnh gọi riêng lẻ đó
  - `openclaw.provider.request_id_hash` (hàm băm có giới hạn dựa trên SHA của id yêu cầu provider thượng nguồn; id thô không được xuất)
  - Với `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, các span lệnh gọi mô hình dùng tên span suy luận GenAI mới nhất `{gen_ai.operation.name} {gen_ai.request.model}` và loại span `CLIENT` thay vì `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` tùy chọn
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

Khi việc ghi lại nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` có giới hạn và đã được biên tập cho các lớp
nội dung cụ thể mà bạn đã chọn tham gia.

## Danh mục sự kiện chẩn đoán

Các sự kiện bên dưới hỗ trợ các metric và span ở trên. Plugin cũng có thể đăng ký
trực tiếp với chúng mà không cần xuất OTLP.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, provider/mô hình/kênh,
  id phiên. `usage` là kế toán provider/lượt cho chi phí và telemetry;
  `context.used` là ảnh chụp prompt/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của provider khi có đầu vào được lưu trong cache hoặc các lệnh gọi vòng lặp công cụ.

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
  vòng đời theo từng lần chạy cho harness agent. Bao gồm `harnessId`, `pluginId`
  tùy chọn, provider/mô hình/kênh và id lần chạy. Khi hoàn tất, thêm
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`,
  và số đếm `itemLifecycle`. Lỗi thêm `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` - kết quả cuối, thời lượng, mục tiêu, chế độ, mã thoát,
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

Để xuất gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy dùng cờ chẩn đoán.
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

Đầu ra cờ đi đến tệp log tiêu chuẩn (`logging.file`) và vẫn được
biên tập bởi `logging.redactSensitive`. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Tắt

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Bạn cũng có thể bỏ `diagnostics-otel` khỏi `plugins.allow`, hoặc chạy
`openclaw plugins disable diagnostics-otel`.

## Liên quan

- [Ghi log](/vi/logging) - log tệp, đầu ra console, theo dõi CLI, và tab Logs của Control UI
- [Nội bộ ghi log Gateway](/vi/gateway/logging) - kiểu log WS, tiền tố phân hệ, và ghi lại console
- [Cờ chẩn đoán](/vi/diagnostics/flags) - cờ debug-log có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) - công cụ support-bundle cho operator (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ trường `diagnostics.*`
