---
read_when:
    - Bạn muốn gửi số liệu về mức sử dụng mô hình, luồng tin nhắn hoặc phiên của OpenClaw đến một bộ thu thập OpenTelemetry
    - Bạn đang kết nối dữ liệu truy vết, số liệu đo lường hoặc nhật ký với Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một backend OTLP khác
    - Bạn cần tên chính xác của các chỉ số, span hoặc cấu trúc thuộc tính để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất dữ liệu chẩn đoán OpenClaw sang các trình thu thập OpenTelemetry hoặc JSONL trên stdout thông qua plugin diagnostics-otel
title: Xuất dữ liệu OpenTelemetry
x-i18n:
    generated_at: "2026-07-20T04:38:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất dữ liệu chẩn đoán thông qua plugin `diagnostics-otel` chính thức
bằng **OTLP/HTTP (protobuf)**. Nhật ký cũng có thể được ghi dưới dạng JSONL trên stdout cho
các pipeline nhật ký của vùng chứa và sandbox. Mọi bộ thu thập hoặc backend chấp nhận
OTLP/HTTP đều hoạt động mà không cần thay đổi mã. Đối với nhật ký tệp cục bộ, xem
[Nhật ký](/vi/logging).

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc trong tiến trình, do
  Gateway và các plugin đi kèm phát ra cho lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi
  và exec.
- **`diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **chỉ số**, **dấu vết** và **nhật ký** OpenTelemetry qua OTLP/HTTP, đồng thời có thể
  phản chiếu các bản ghi nhật ký sang JSONL trên stdout.
- **Lệnh gọi nhà cung cấp** nhận tiêu đề W3C `traceparent` từ ngữ cảnh
  span gọi mô hình đáng tin cậy của OpenClaw khi phương thức truyền tải của nhà cung cấp chấp nhận
  tiêu đề tùy chỉnh. Ngữ cảnh dấu vết do plugin phát ra không được truyền tiếp.
- Các trình xuất chỉ được đính kèm khi cả bề mặt chẩn đoán và plugin đều
  được bật, nên chi phí trong tiến trình mặc định gần bằng không.

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
`protocol` chỉ hỗ trợ `http/protobuf`. Vì `traces` và `metrics` được bật theo mặc định, mọi giá trị khác (bao gồm `grpc`) sẽ hủy toàn bộ đăng ký diagnostics-otel kèm cảnh báo `unsupported protocol` — điều này cũng dừng việc xuất nhật ký ra stdout. Hãy đặt rõ ràng `traces: false` và `metrics: false` nếu bạn chỉ muốn `logsExporter: "stdout"` với một giá trị giao thức không phải OTLP.
</Note>

## Các tín hiệu được xuất

| Tín hiệu      | Nội dung                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chỉ số** | Bộ đếm/biểu đồ tần suất cho mức sử dụng token, chi phí, thời lượng chạy, chuyển đổi dự phòng, mức sử dụng kỹ năng, luồng tin nhắn, sự kiện Talk, làn hàng đợi, trạng thái/khôi phục phiên, thực thi công cụ, exec, bộ nhớ, khả năng hoạt động và tình trạng trình xuất. |
| **Dấu vết**  | Các span cho việc sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, mức sử dụng kỹ năng, thực thi công cụ, exec, xử lý webhook/tin nhắn, tập hợp ngữ cảnh và vòng lặp công cụ.                                                      |
| **Nhật ký**    | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP hoặc JSONL trên stdout khi `diagnostics.otel.logs` được bật; nội dung nhật ký được giữ lại trừ khi tính năng thu thập nội dung được bật rõ ràng.                          |

Bật/tắt độc lập `traces`, `metrics` và `logs`. Dấu vết và chỉ số
được bật theo mặc định khi `diagnostics.otel.enabled` là true; nhật ký mặc định bị tắt
và chỉ được xuất khi `diagnostics.otel.logs` được đặt rõ ràng thành `true`. Việc xuất nhật ký
mặc định sử dụng OTLP; đặt `diagnostics.otel.logsExporter` thành `stdout` để xuất JSONL trên
stdout, hoặc `both` để xuất cả hai.

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
      logsExporter: "otlp", // otlp | stdout | cả hai
      sampleRate: 0.2, // bộ lấy mẫu span gốc, 0.0..1.0
      flushIntervalMs: 60000, // khoảng thời gian xuất chỉ số (tối thiểu 1000ms)
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các endpoint dự phòng dành riêng cho từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình dành riêng cho tín hiệu được ưu tiên hơn biến môi trường dành riêng cho tín hiệu, và biến này được ưu tiên hơn endpoint dùng chung.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Giá trị dự phòng cho `diagnostics.otel.serviceName` khi khóa cấu hình chưa được đặt. Tên dịch vụ mặc định là `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Giá trị dự phòng cho giao thức truyền trên dây khi `diagnostics.otel.protocol` chưa được đặt. Chỉ `http/protobuf` mới bật việc xuất.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát ra cấu trúc span suy luận GenAI mới nhất: tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT` và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Các chỉ số GenAI luôn sử dụng thuộc tính bị giới hạn với lực lượng thấp bất kể cài đặt này. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một tiến trình tải trước hoặc tiến trình máy chủ khác đã đăng ký OpenTelemetry SDK toàn cục. Khi đó, plugin bỏ qua vòng đời NodeSDK riêng nhưng vẫn nối các trình lắng nghe chẩn đoán và tuân thủ `traces`/`metrics`/`logs`.                                                                                    |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Các span mang những
định danh bị giới hạn (kênh, nhà cung cấp, mô hình, loại lỗi, mã định danh yêu cầu chỉ ở dạng băm,
nguồn công cụ, chủ sở hữu công cụ, tên/nguồn kỹ năng) và không bao giờ bao gồm văn bản prompt,
văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, đường dẫn tệp kỹ năng hoặc khóa phiên.
Các giá trị trông giống khóa phiên tác nhân có phạm vi (ví dụ bắt đầu bằng
`agent:`) được thay thế bằng `unknown` trên các thuộc tính có lực lượng thấp. Theo mặc định, bản ghi nhật ký OTLP
giữ lại mức độ nghiêm trọng, trình ghi nhật ký, vị trí mã, ngữ cảnh dấu vết đáng tin cậy và
các thuộc tính đã được làm sạch; nội dung thông báo nhật ký thô chỉ được xuất
khi `diagnostics.otel.captureContent` là giá trị boolean `true`. Các khóa con chi tiết
`captureContent.*` không bao giờ bật nội dung nhật ký. Chỉ số Talk chỉ xuất
siêu dữ liệu sự kiện bị giới hạn (chế độ, phương thức truyền tải, nhà cung cấp, loại sự kiện) — không có
bản chép lời, tải trọng âm thanh, mã định danh phiên, mã định danh lượt, mã định danh cuộc gọi, mã định danh phòng hoặc
token bàn giao.

Các yêu cầu mô hình gửi đi có thể bao gồm tiêu đề W3C `traceparent` chỉ được tạo
từ ngữ cảnh dấu vết chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình đang hoạt động.
Các tiêu đề `traceparent` hiện có do bên gọi cung cấp sẽ bị thay thế, nên plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo quan hệ tổ tiên dấu vết giữa các dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi bộ thu thập
và chính sách lưu giữ của bạn được phê duyệt cho văn bản prompt, phản hồi, công cụ hoặc
prompt hệ thống. Mỗi khóa con hoạt động độc lập:

- `inputMessages` — nội dung prompt của người dùng.
- `outputMessages` — nội dung phản hồi của mô hình.
- `toolInputs` — tải trọng đối số công cụ.
- `toolOutputs` — tải trọng kết quả công cụ.
- `systemPrompt` — prompt hệ thống/nhà phát triển đã tập hợp.
- `toolDefinitions` — tên, mô tả và lược đồ công cụ của mô hình.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ sẽ nhận các thuộc tính
`openclaw.content.*` bị giới hạn và đã biên tập chỉ cho lớp đó.

<Note>
Giá trị boolean `captureContent: true` bật đồng thời `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` và nội dung nhật ký OTLP, nhưng **không** bật `systemPrompt` — hãy đặt rõ ràng `captureContent.systemPrompt: true` nếu bạn cũng cần prompt hệ thống đã tập hợp.
</Note>

Nội dung `toolInputs`/`toolOutputs` được thu thập cho các lần thực thi công cụ
của runtime tác nhân tích hợp sẵn (`openclaw.content.tool_input` và
`gen_ai.tool.call.arguments` trên các span hoàn tất/lỗi;
`openclaw.content.tool_output` và `gen_ai.tool.call.result` trên các span
hoàn tất). Các tên `openclaw.content.*` vẫn là tên thuộc tính OpenClaw ổn định;
các bản sao `gen_ai.tool.call.*` phản chiếu chúng cho các trình xem tương thích semconv gốc.
Các lệnh gọi công cụ harness bên ngoài (Codex, Claude CLI) phát ra
span `tool.execution.*` mà không có tải trọng nội dung. Nội dung được thu thập truyền qua một
kênh đáng tin cậy chỉ dành cho trình lắng nghe và không bao giờ được đưa lên bus sự kiện chẩn đoán
công khai.

## Lấy mẫu và xả

- **Dấu vết:** `diagnostics.otel.sampleRate` đặt một `TraceIdRatioBasedSampler`
  chỉ trên span gốc (`0.0` loại bỏ tất cả, `1.0` giữ lại tất cả). Khi không đặt, hệ thống dùng giá trị mặc định của
  OpenTelemetry SDK (luôn bật).
- **Chỉ số:** `diagnostics.otel.flushIntervalMs` (được giới hạn ở mức tối thiểu là
  `1000`); khi không đặt, hệ thống dùng giá trị xuất định kỳ mặc định của SDK.
- **Nhật ký:** Nhật ký OTLP tuân theo `logging.level` (mức nhật ký tệp) và sử dụng
  quy trình biên tập bản ghi nhật ký chẩn đoán, không dùng định dạng bảng điều khiển. Các bản cài đặt có lưu lượng lớn
  nên ưu tiên lấy mẫu/lọc tại bộ thu thập OTLP thay vì lấy mẫu
  cục bộ. Đặt `diagnostics.otel.logsExporter: "stdout"` khi nền tảng của bạn
  đã chuyển stdout/stderr đến một bộ xử lý nhật ký và bạn không có bộ thu thập
  nhật ký OTLP. Mỗi bản ghi stdout là một đối tượng JSON trên mỗi dòng, với `ts`, `signal`,
  `service.name`, mức độ nghiêm trọng, nội dung, các thuộc tính đã biên tập và các trường dấu vết
  đáng tin cậy khi có.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm các trường cấp cao nhất `traceId`,
  `spanId`, `parentSpanId` và `traceFlags` khi lệnh gọi nhật ký mang ngữ cảnh
  dấu vết chẩn đoán hợp lệ, cho phép các bộ xử lý nhật ký kết nối các dòng nhật ký cục bộ với
  các span đã xuất.
- **Tương quan yêu cầu:** Các yêu cầu HTTP và khung WebSocket của Gateway tạo
  một phạm vi dấu vết yêu cầu nội bộ. Theo mặc định, nhật ký và sự kiện chẩn đoán trong
  phạm vi đó kế thừa dấu vết yêu cầu, còn các span lượt chạy tác nhân và lệnh gọi mô hình
  được tạo dưới dạng span con để các tiêu đề `traceparent` của nhà cung cấp vẫn nằm trên
  cùng một dấu vết.
- **Tương quan lệnh gọi mô hình:** Các span `openclaw.model.call` mặc định bao gồm kích thước
  an toàn của các thành phần lời nhắc và các thuộc tính token theo từng lệnh gọi khi kết quả của nhà cung cấp
  cung cấp dữ liệu sử dụng. `openclaw.model.usage` vẫn là span
  tính toán ở cấp lượt chạy cho các bảng điều khiển tổng hợp về chi phí, ngữ cảnh và kênh, đồng thời
  vẫn nằm trên cùng một dấu vết chẩn đoán khi runtime phát có ngữ cảnh dấu vết
  đáng tin cậy.

### Đơn vị quan sát lệnh gọi mô hình

Mỗi span `openclaw.model.call` xác định vòng đời của nó đo lường điều gì thông qua
`openclaw.model_call.observation_unit`:

- `request` - một yêu cầu mô hình/nhà cung cấp có thể quan sát. Các lệnh gọi mô hình nhúng gốc
  sử dụng đơn vị này và các trình xuất coi giá trị bị thiếu là `request` để
  tương thích với các bộ phát cũ hơn hoặc bên ngoài.
- `turn` - một lượt CLI tác nhân không trong suốt, có thể chứa các yêu cầu mô hình ẩn,
  lần thử lại, công việc công cụ hoặc công việc nền. Các lệnh gọi Claude Code CLI và máy chủ ứng dụng Codex
  sử dụng đơn vị này.

Cả hai đơn vị vẫn là span lệnh gọi mô hình để các phần phụ trợ dấu vết có thể hiển thị đầu vào,
đầu ra, dữ liệu sử dụng và hệ thống phân cấp của mô hình. Span yêu cầu sử dụng thao tác GenAI bắt nguồn từ API
(`chat`, `generate_content` hoặc `text_completion`), còn span lượt sử dụng
`gen_ai.operation.name = invoke_agent`. Cả hai đều đóng góp vào
`gen_ai.client.operation.duration`, trong đó tên thao tác giúp tách độ trễ của yêu cầu trực tiếp
khỏi độ trễ của toàn bộ lượt. Các chỉ số lệnh gọi mô hình OTEL của OpenClaw cũng bao gồm `openclaw.model_call.observation_unit`; các chỉ số
lệnh gọi mô hình Prometheus cung cấp nhãn `observation_unit` tương đương.

### Độ trung thực của lệnh gọi mô hình Claude Code CLI

Các lượt Claude Code CLI phát một span tổng hợp `openclaw.model.call`
ở cấp lượt. Đây không phải là các span yêu cầu HTTP Anthropic. Chúng sử dụng `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` và xác định
thao tác là `gen_ai.operation.name = invoke_agent`. Chúng xác định
ranh giới CLI của OpenClaw thông qua
`openclaw.transport`:

- `stdio` - một tiến trình Claude Code cục bộ chạy một lần.
- `stdio-live` - một lượt trong phiên Claude stdio liên tục được quản lý.
- `paired-node-cli` - một lần thực thi Claude Code được ủy quyền cho một
  node đã ghép đôi.

Chẩn đoán Claude CLI chỉ được khởi tạo khi bộ điều phối chẩn đoán
của tiến trình được bật và có một trình lắng nghe sự kiện nội bộ hoặc đáng tin cậy được gắn.
Khi không có plugin khả năng quan sát hoặc trình lắng nghe nào khác hoạt động, các lượt Claude CLI bỏ qua
hệ thống phân cấp dấu vết tổng hợp, bộ đệm nội dung và việc tính toán byte luồng
chẩn đoán. Khi bật ghi nội dung, mỗi trường lời nhắc và lời nhắc hệ thống
được giới hạn ở 128 KiB; đầu ra của trợ lý được giới hạn ở 128 KiB trên tối đa
200 phong bì, trong đó dành riêng 16 KiB và một mục cho phản hồi dự phòng
hiển thị cuối cùng. Một dấu mốc ghi nhận việc cắt bớt khi đạt đến giới hạn.

OpenClaw cung cấp cho các lượt Claude CLI cùng hệ thống phân cấp quyền sở hữu được các
runtime tác nhân khác sử dụng: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
chứa `openclaw.run`, và span này chứa span Claude `openclaw.model.call`.
Các span bộ khung và lượt chạy là ranh giới lượt tổng hợp của OpenClaw, không phải
các giai đoạn nội bộ của Claude Code. Các lượt chạy một lần và stdio được quản lý sử dụng cùng
hệ thống phân cấp; một lần thử lại thực sự với phiên mới sẽ tạo thêm một lệnh gọi mô hình con trong
cùng lượt chạy OpenClaw.

Span bắt đầu khi OpenClaw tiếp nhận lượt CLI đã chuẩn bị và chỉ kết thúc sau khi
lượt đó thành công hoặc thất bại. Đối với các phiên được quản lý, kết quả thành công tạm thời
không kết thúc span khi Claude báo cáo các tác nhân nền hoặc
quy trình công việc đang giữ kết quả; kết quả cuối cùng sau khi xả hàng đợi mới kết thúc span. Hủy bỏ, hết thời gian chờ, lỗi tiến trình,
lỗi đầu ra/phân tích cú pháp và các lỗi lượt khác đều kết thúc cùng span đó với trạng thái lỗi.

Claude Code báo cáo dữ liệu sử dụng theo từng thông điệp của trợ lý và cũng có thể báo cáo dữ liệu sử dụng
tích lũy trong kết quả cuối. Việc tính toán phản hồi của OpenClaw tiếp tục sử dụng
thông điệp cuối cùng của trợ lý để ngữ nghĩa chi phí hiện có không thay đổi; span lệnh gọi mô hình
ở cấp lượt sử dụng dữ liệu sử dụng tích lũy cuối cùng khi có,
bao gồm các token đọc bộ nhớ đệm và tạo bộ nhớ đệm.

Đối với các span CLI này, trường byte và thời gian mô tả ranh giới CLI OpenClaw
có thể quan sát:

- `openclaw.model_call.request_bytes` là kích thước UTF-8 của giá trị lời nhắc
  được gửi qua stdin/argv một lần, hoặc phong bì người dùng JSONL của stdio được quản lý. Đây
  không phải là kích thước yêu cầu mô hình ẩn của Claude Code.
- `openclaw.model_call.response_bytes` là kích thước UTF-8 của stdout Claude CLI
  được quan sát trong lượt. Đây không phải là kích thước phản hồi HTTP Anthropic.
- `openclaw.model_call.time_to_first_byte_ms` là thời gian đến đầu ra stdout hoặc stderr
  Claude CLI đầu tiên có thể quan sát. Đây không phải là TTFB mạng.

Khi bật các trường chi tiết `captureContent` tương ứng, span sẽ xuất
lời nhắc hiệu lực mà OpenClaw gửi đến Claude Code, lời nhắc hệ thống do OpenClaw nối thêm,
cùng văn bản/suy luận/danh tính lệnh gọi công cụ hiển thị của trợ lý thông qua
`gen_ai.input.messages`, `gen_ai.output.messages` và
`gen_ai.system_instructions`. Các đối số công cụ, chữ ký suy nghĩ không trong suốt và
kết quả công cụ bị loại khỏi phong bì trợ lý Claude. OpenClaw không
tuyên bố có quyền truy cập vào lời nhắc hệ thống riêng tư của Claude Code, tải trọng yêu cầu ẩn được tiếp tục hoặc
Compaction, lược đồ công cụ nội bộ gốc, yêu cầu HTTP Anthropic thô,
các lần thử lại nội bộ, ID yêu cầu thượng nguồn hoặc TTFB mạng thực. Vì
Claude Code không cung cấp chính xác các định nghĩa công cụ gốc hiệu lực,
các span này không điền `gen_ai.tool.definitions`.

Các span công cụ của bộ khung Claude bên ngoài vẫn chỉ chứa siêu dữ liệu ngay cả khi bật
ghi nội dung công cụ. Cũng như mọi span mô hình, nội dung Claude CLI được ghi
sử dụng đường dẫn chỉ dành cho trình lắng nghe đáng tin cậy cùng các giới hạn biên tập và kích thước
hiện có của trình xuất; nội dung mặc định vẫn tắt.

## Chỉ số đã xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (bộ đếm, thuộc tính: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (biểu đồ tần suất, thuộc tính: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (biểu đồ tần suất, chỉ số quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (biểu đồ tần suất, giây, chỉ số quy ước ngữ nghĩa GenAI cho các yêu cầu mô hình và lượt tác nhân tổng hợp; thuộc tính: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` tùy chọn; các quan sát lượt sử dụng `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit`, cộng thêm `openclaw.errorCategory` và `openclaw.failureKind` trên các lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (biểu đồ tần suất, kích thước byte UTF-8 của tải trọng yêu cầu mô hình cuối cùng; đối với Claude Code CLI, là đầu vào/phong bì lời nhắc có thể quan sát được mô tả ở trên; không có nội dung tải trọng thô)
- `openclaw.model_call.response_bytes` (biểu đồ tần suất, kích thước byte UTF-8 của tải trọng các đoạn phản hồi truyền trực tuyến; các phần chênh lệch văn bản, suy nghĩ và lệnh gọi công cụ tần suất cao chỉ tính các byte `delta` gia tăng; đối với Claude Code CLI, là số byte stdout quan sát được; không có nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (biểu đồ tần suất, thời gian đã trôi qua trước sự kiện phản hồi truyền trực tuyến đầu tiên; đối với Claude Code CLI, là đầu ra CLI đầu tiên có thể quan sát thay vì TTFB mạng)
- `openclaw.model.failover` (bộ đếm, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (bộ đếm, thuộc tính: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` tùy chọn, `openclaw.toolName` tùy chọn)

### Luồng thông điệp

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

### Thoại

- `openclaw.talk.event` (bộ đếm, thuộc tính: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát khi một sự kiện Thoại báo cáo thời lượng)
- `openclaw.talk.audio.bytes` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát cho các sự kiện khung âm thanh Thoại có báo cáo độ dài byte)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, thuộc tính: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, thuộc tính: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, thuộc tính: `openclaw.state`; được phát cho việc quản lý sổ sách phiên cũ có thể khôi phục)
- `openclaw.session.stuck_age_ms` (histogram, thuộc tính: `openclaw.state`; được phát cho việc quản lý sổ sách phiên cũ có thể khôi phục)
- `openclaw.session.turn.created` (bộ đếm, thuộc tính: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, thuộc tính: giống bộ đếm khôi phục tương ứng)
- `openclaw.run.attempt` (bộ đếm, thuộc tính: `openclaw.attempt`)

### Phép đo từ xa về trạng thái hoạt động của phiên

Phiên `processing` không tiến dần đến ngưỡng trạng thái hoạt động tích hợp sẵn trong khi OpenClaw quan sát thấy tiến trình phản hồi, công cụ, trạng thái, khối hoặc thời gian chạy ACP. Các tín hiệu duy trì trạng thái đang nhập không được tính là tiến trình, vì vậy vẫn có thể phát hiện mô hình hoặc harness im lặng.

OpenClaw phân loại phiên theo công việc mà hệ thống vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi công cụ
  vẫn đang tiến triển. Các lệnh gọi mô hình im lặng có chủ sở hữu cũng được báo cáo là chạy lâu trước ngưỡng hủy tích hợp sẵn, vì vậy nhà cung cấp mô hình chậm hoặc không truyền phát không bị xem như phiên Gateway đình trệ khi vẫn có thể quan sát việc hủy.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy hiện tại chưa báo cáo
  tiến trình gần đây. Các lệnh gọi mô hình có chủ sở hữu chuyển từ `session.long_running` sang
  `session.stalled` tại hoặc sau ngưỡng hủy tích hợp sẵn; hoạt động
  mô hình/công cụ cũ không có chủ sở hữu không được coi là công việc chạy lâu vô hại.
  Các lượt chạy nhúng đình trệ ban đầu chỉ được quan sát, sau đó chuyển sang hủy và tháo cạn sau
  ngưỡng hủy nếu không có tiến trình, để các lượt đã xếp hàng phía sau làn có thể tiếp tục.
- `session.stuck`: việc quản lý sổ sách phiên cũ không có công việc đang hoạt động, hoặc một phiên
  đã xếp hàng nhưng đang nhàn rỗi với hoạt động mô hình/công cụ cũ không có chủ sở hữu. Điều này giải phóng
  làn phiên bị ảnh hưởng ngay sau khi vượt qua các cổng khôi phục.

Quá trình khôi phục phát các sự kiện `session.recovery.requested` và
`session.recovery.completed` có cấu trúc. Trạng thái phiên chẩn đoán chỉ được đánh dấu là nhàn rỗi
sau một kết quả khôi phục có thay đổi trạng thái (`aborted` hoặc `released`) và chỉ khi
cùng thế hệ xử lý đó vẫn còn hiện hành.

Chỉ `session.stuck` phát bộ đếm `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`.
Các chẩn đoán `session.stuck` lặp lại sẽ giãn dần trong khi phiên không thay đổi,
vì vậy bảng điều khiển nên cảnh báo khi mức tăng kéo dài thay vì
ở mỗi nhịp Heartbeat. Để biết tùy chọn cấu hình và các giá trị mặc định, hãy xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

Cảnh báo trạng thái hoạt động cũng phát:

- `openclaw.liveness.warning` (bộ đếm, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, thuộc tính: `openclaw.liveness.reason`)

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, thuộc tính: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` khi có lỗi)

### Thực thi công cụ và phát hiện vòng lặp

- `openclaw.tool.execution.duration_ms` (histogram, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, cùng với `openclaw.errorCategory` khi có lỗi)
- `openclaw.tool.execution.blocked` (bộ đếm, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` tùy chọn; được phát khi phát hiện vòng lặp gọi công cụ lặp đi lặp lại)

### Exec

- `openclaw.exec.duration_ms` (histogram, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Thành phần nội bộ của chẩn đoán (bộ nhớ, tải trọng, tình trạng trình xuất)

- `openclaw.payload.large` (bộ đếm, thuộc tính: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, thuộc tính: giống `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (các histogram, không có thuộc tính; mẫu bộ nhớ tiến trình)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (bộ đếm, thuộc tính: `openclaw.diagnostic.async_queue.drop_class`; các lượt loại bỏ do áp lực ngược của hàng đợi chẩn đoán nội bộ)
- `openclaw.telemetry.exporter.events` (bộ đếm, thuộc tính: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` tùy chọn, `openclaw.errorCategory` tùy chọn; phép đo từ xa tự thân về vòng đời/lỗi của trình xuất)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn dùng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn dùng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` hoặc `turn`)
  - `openclaw.errorCategory`, `error.type` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (chỉ kích thước thành phần an toàn, không có văn bản lời nhắc)
  - `openclaw.model_call.usage.*` và `gen_ai.usage.*` khi kết quả chứa dữ liệu sử dụng cho yêu cầu hoặc lượt tổng hợp đó
  - Sự kiện span `openclaw.provider.request` với thuộc tính `openclaw.upstreamRequestIdHash` (có giới hạn, dựa trên hàm băm) khi kết quả của nhà cung cấp thượng nguồn cung cấp id yêu cầu; id thô không bao giờ được xuất
  - Với `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, span yêu cầu sử dụng tên span suy luận GenAI mới nhất `{gen_ai.operation.name} {gen_ai.request.model}`. Span lượt sử dụng `invoke_agent` vì OpenClaw không tuyên bố tên tác nhân gốc từ ranh giới CLI không trong suốt. Cả hai sử dụng loại span `CLIENT` thay vì `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi có lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` tùy chọn
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` tùy chọn, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` tùy chọn khi có lỗi, `openclaw.deniedReason` và `openclaw.outcome=blocked` khi bị chính sách hoặc sandbox từ chối
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
bao gồm các thuộc tính `openclaw.content.*` có giới hạn và đã che thông tin nhạy cảm cho những
lớp nội dung cụ thể mà bạn đã chọn.

## Danh mục sự kiện chẩn đoán

Các sự kiện bên dưới hỗ trợ các chỉ số và span nêu trên hoặc có sẵn để Plugin
đăng ký trực tiếp. `run.progress` và `run.execution_phase` là các tín hiệu vòng đời
chỉ dùng trực tiếp; Plugin diagnostics-otel không xuất chúng dưới dạng
tín hiệu OTLP độc lập. Các loại sự kiện và giá trị `run.execution_phase.phase` có tính
bổ sung. Thành phần sử dụng TypeScript nên giữ các nhánh mặc định thay vì giả định
một trong hai union sẽ luôn đầy đủ.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  id phiên. `usage` là dữ liệu hạch toán theo nhà cung cấp/lượt cho chi phí và phép đo từ xa;
  `context.used` là ảnh chụp lời nhắc/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu vào bộ nhớ đệm hoặc lệnh gọi trong vòng lặp công cụ.

**Luồng thông báo**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (các mốc khởi động trình chạy nhúng công khai, có tương quan với phiên)
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhook/hàng đợi/phiên)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  vòng đời theo từng lượt chạy của harness tác nhân. Bao gồm `harnessId`, `pluginId`
  tùy chọn, nhà cung cấp/mô hình/kênh và id lượt chạy. Khi hoàn tất sẽ thêm
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`
  và số lượng `itemLifecycle`. Khi có lỗi sẽ thêm `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` - kết quả terminal, thời lượng, đích, chế độ, mã
  thoát và loại lỗi. Nội dung lệnh và thư mục làm việc không được
  bao gồm.
- `exec.approval.followup_suppressed` - lượt theo dõi phê duyệt đã lỗi thời bị loại bỏ
  sau khi phiên được liên kết lại. Bao gồm `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` hoặc `gateway_preflight`)
  và dấu thời gian của bộ điều phối. Khóa phiên, tuyến và nội dung lệnh
  không được bao gồm.

## Không có trình xuất

Duy trì khả năng cung cấp các sự kiện chẩn đoán cho plugin hoặc đích thu thập tùy chỉnh mà không chạy
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất thông tin gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy sử dụng các cờ chẩn đoán.
Cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (`telegram.*` hoặc
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc ghi đè một lần bằng biến môi trường:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra của cờ được ghi vào tệp nhật ký tiêu chuẩn (`logging.file`) và vẫn được
`logging.redactSensitive` che thông tin nhạy cảm. Hướng dẫn đầy đủ:
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
- [Cờ chẩn đoán](/vi/diagnostics/flags) - cờ nhật ký gỡ lỗi có mục tiêu
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics) - công cụ gói hỗ trợ dành cho người vận hành (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ cho trường `diagnostics.*`
