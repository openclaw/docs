---
read_when:
    - Bạn muốn gửi số liệu về mức sử dụng mô hình, luồng tin nhắn hoặc phiên của OpenClaw đến một trình thu thập OpenTelemetry
    - Bạn đang kết nối trace, số liệu đo lường hoặc nhật ký với Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một backend OTLP khác
    - Bạn cần tên chính xác của các metric, span hoặc cấu trúc thuộc tính để xây dựng dashboard hay cảnh báo
summary: Xuất dữ liệu chẩn đoán của OpenClaw sang các collector OpenTelemetry hoặc JSONL trên stdout thông qua plugin diagnostics-otel
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-07-19T05:45:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 95f62669cd8e26cf0e5e1bfd012321efe2f514efbcab6537186d5a83b22696c5
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất dữ liệu chẩn đoán thông qua plugin `diagnostics-otel` chính thức
bằng **OTLP/HTTP (protobuf)**. Nhật ký cũng có thể được ghi dưới dạng JSONL trên stdout cho
các pipeline nhật ký của container và sandbox. Mọi collector hoặc backend chấp nhận
OTLP/HTTP đều hoạt động mà không cần thay đổi mã. Đối với nhật ký tệp cục bộ, xem
[Nhật ký](/vi/logging).

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc trong tiến trình do
  Gateway và các plugin đi kèm phát ra cho lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi
  và exec.
- **`diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **chỉ số**, **dấu vết** và **nhật ký** OpenTelemetry qua OTLP/HTTP, đồng thời có thể
  sao chép các bản ghi nhật ký sang JSONL trên stdout.
- **Lệnh gọi nhà cung cấp** nhận một header W3C `traceparent` từ
  ngữ cảnh span lệnh gọi mô hình đáng tin cậy của OpenClaw khi phương thức truyền tải của nhà cung cấp chấp nhận
  header tùy chỉnh. Ngữ cảnh dấu vết do plugin phát ra không được truyền tiếp.
- Các exporter chỉ được gắn khi cả bề mặt chẩn đoán và plugin đều
  được bật, vì vậy chi phí trong tiến trình mặc định gần bằng không.

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
`protocol` chỉ hỗ trợ `http/protobuf`. Vì `traces` và `metrics` được bật theo mặc định, mọi giá trị khác (bao gồm `grpc`) sẽ hủy toàn bộ đăng ký diagnostics-otel với cảnh báo `unsupported protocol` — điều này cũng dừng việc xuất nhật ký ra stdout. Đặt rõ `traces: false` và `metrics: false` nếu bạn chỉ muốn `logsExporter: "stdout"` với một giá trị giao thức không phải OTLP.
</Note>

## Tín hiệu được xuất

| Tín hiệu     | Nội dung chứa trong đó                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chỉ số** | Bộ đếm/biểu đồ tần suất cho mức sử dụng token, chi phí, thời lượng lượt chạy, chuyển đổi dự phòng, mức sử dụng skill, luồng tin nhắn, sự kiện Talk, lane hàng đợi, trạng thái/khôi phục phiên, thực thi công cụ, exec, bộ nhớ, tính khả dụng và tình trạng exporter. |
| **Dấu vết**  | Các span cho mức sử dụng mô hình, lệnh gọi mô hình, vòng đời harness, mức sử dụng skill, thực thi công cụ, exec, xử lý webhook/tin nhắn, tập hợp ngữ cảnh và vòng lặp công cụ.                                                      |
| **Nhật ký**    | Các bản ghi `logging.file` có cấu trúc được xuất qua OTLP hoặc JSONL trên stdout khi `diagnostics.otel.logs` được bật; nội dung phần thân nhật ký được ẩn trừ khi tính năng thu thập nội dung được bật rõ ràng.                          |

Bật hoặc tắt độc lập `traces`, `metrics` và `logs`. Dấu vết và chỉ số
được bật theo mặc định khi `diagnostics.otel.enabled` là true; nhật ký mặc định bị tắt
và chỉ được xuất khi `diagnostics.otel.logs` được đặt rõ ràng thành `true`. Việc xuất nhật ký
mặc định dùng OTLP; đặt `diagnostics.otel.logsExporter` thành `stdout` để xuất JSONL trên
stdout, hoặc `both` để dùng cả hai.

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
      serviceName: "openclaw-gateway", // nếu chưa đặt, dùng OTEL_SERVICE_NAME, sau đó là "openclaw"
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Các giá trị dự phòng endpoint theo từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo tín hiệu được ưu tiên hơn biến môi trường theo tín hiệu, và biến môi trường theo tín hiệu được ưu tiên hơn endpoint dùng chung.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Giá trị dự phòng cho `diagnostics.otel.serviceName` khi khóa cấu hình chưa được đặt. Tên dịch vụ mặc định là `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Giá trị dự phòng cho giao thức truyền dẫn khi `diagnostics.otel.protocol` chưa được đặt. Chỉ `http/protobuf` mới bật việc xuất.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát ra cấu trúc span suy luận GenAI mới nhất: tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT` và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Các chỉ số GenAI luôn sử dụng thuộc tính bị giới hạn, có cardinality thấp. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một tiến trình tải trước hoặc tiến trình máy chủ khác đã đăng ký SDK OpenTelemetry toàn cục. Khi đó, plugin bỏ qua vòng đời NodeSDK của chính nó nhưng vẫn kết nối các listener chẩn đoán và tuân theo `traces`/`metrics`/`logs`.                                                                                    |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Các span mang những
định danh bị giới hạn (kênh, nhà cung cấp, mô hình, danh mục lỗi, ID yêu cầu chỉ ở dạng hàm băm,
nguồn công cụ, chủ sở hữu công cụ, tên/nguồn skill) và không bao giờ bao gồm văn bản prompt,
văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, đường dẫn tệp skill hoặc khóa phiên.
Các giá trị trông giống khóa phiên agent có phạm vi (ví dụ bắt đầu bằng
`agent:`) được thay bằng `unknown` trên các thuộc tính có cardinality thấp. Theo mặc định, các bản ghi nhật ký
OTLP giữ lại mức độ nghiêm trọng, logger, vị trí mã, ngữ cảnh dấu vết đáng tin cậy và
các thuộc tính đã được làm sạch; phần thân thông báo nhật ký thô chỉ được xuất
khi `diagnostics.otel.captureContent` là giá trị boolean `true`. Các khóa con chi tiết
`captureContent.*` không bao giờ bật phần thân nhật ký. Chỉ số Talk chỉ xuất
siêu dữ liệu sự kiện bị giới hạn (chế độ, phương thức truyền tải, nhà cung cấp, loại sự kiện) — không có
bản chép lời, payload âm thanh, ID phiên, ID lượt, ID cuộc gọi, ID phòng hoặc
token chuyển giao.

Các yêu cầu mô hình gửi đi có thể bao gồm header W3C `traceparent` chỉ được tạo
từ ngữ cảnh dấu vết chẩn đoán do OpenClaw sở hữu cho lệnh gọi mô hình đang hoạt động.
Các header `traceparent` hiện có do bên gọi cung cấp sẽ bị thay thế, vì vậy plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo quan hệ tổ tiên dấu vết xuyên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector
và chính sách lưu giữ của bạn đã được phê duyệt cho văn bản prompt, phản hồi, công cụ hoặc
prompt hệ thống. Mỗi khóa con hoạt động độc lập:

- `inputMessages` — nội dung prompt của người dùng.
- `outputMessages` — nội dung phản hồi của mô hình.
- `toolInputs` — payload đối số công cụ.
- `toolOutputs` — payload kết quả công cụ.
- `systemPrompt` — prompt hệ thống/nhà phát triển đã tập hợp.
- `toolDefinitions` — tên, mô tả và schema công cụ của mô hình.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ sẽ nhận thuộc tính
`openclaw.content.*` bị giới hạn và đã che dữ liệu chỉ cho lớp đó.

<Note>
Giá trị boolean `captureContent: true` bật đồng thời `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` và phần thân nhật ký OTLP, nhưng **không** bật `systemPrompt` — hãy đặt rõ `captureContent.systemPrompt: true` nếu bạn cũng cần prompt hệ thống đã tập hợp.
</Note>

Nội dung `toolInputs`/`toolOutputs` được thu thập cho các lượt thực thi công cụ
của runtime agent tích hợp sẵn (`openclaw.content.tool_input` và
`gen_ai.tool.call.arguments` trên các span hoàn tất/lỗi;
`openclaw.content.tool_output` và `gen_ai.tool.call.result` trên các span hoàn tất).
Các tên `openclaw.content.*` vẫn là tên thuộc tính OpenClaw ổn định;
các bản sao `gen_ai.tool.call.*` phản ánh chúng cho trình xem dùng semconv nguyên bản.
Các lệnh gọi công cụ của harness bên ngoài (Codex, Claude CLI) phát ra
span `tool.execution.*` không có payload nội dung. Nội dung được thu thập truyền qua một
kênh đáng tin cậy, chỉ dành cho listener và không bao giờ được đặt lên bus sự kiện chẩn đoán
công khai.

## Lấy mẫu và xả dữ liệu

- **Dấu vết:** `diagnostics.otel.sampleRate` đặt một `TraceIdRatioBasedSampler`
  chỉ trên span gốc (`0.0` loại bỏ tất cả, `1.0` giữ lại tất cả). Khi không đặt, hệ thống sử dụng giá trị mặc định của SDK OpenTelemetry (luôn bật).
- **Số liệu:** `diagnostics.otel.flushIntervalMs` (được giới hạn ở mức tối thiểu là
  `1000`); khi không đặt, hệ thống sử dụng giá trị mặc định xuất định kỳ của SDK.
- **Nhật ký:** Nhật ký OTLP tuân theo `logging.level` (cấp độ nhật ký tệp) và sử dụng
  quy trình che thông tin bản ghi nhật ký chẩn đoán, không sử dụng định dạng bảng điều khiển. Các bản cài đặt có lưu lượng lớn
  nên ưu tiên lấy mẫu/lọc bằng trình thu thập OTLP thay vì lấy mẫu
  cục bộ. Đặt `diagnostics.otel.logsExporter: "stdout"` khi nền tảng của bạn
  đã chuyển stdout/stderr đến một bộ xử lý nhật ký và bạn không có trình thu thập
  nhật ký OTLP. Các bản ghi stdout là một đối tượng JSON trên mỗi dòng, gồm `ts`, `signal`,
  `service.name`, mức độ nghiêm trọng, nội dung, các thuộc tính đã che thông tin và các trường dấu vết
  đáng tin cậy khi có.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId` và `traceFlags` ở cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh
  dấu vết chẩn đoán hợp lệ, cho phép các bộ xử lý nhật ký liên kết các dòng nhật ký cục bộ với
  các span đã xuất.
- **Tương quan yêu cầu:** Các yêu cầu HTTP và khung WebSocket của Gateway tạo
  một phạm vi dấu vết yêu cầu nội bộ. Theo mặc định, nhật ký và sự kiện chẩn đoán bên trong
  phạm vi đó kế thừa dấu vết yêu cầu, còn các span lần chạy tác tử và lệnh gọi mô hình
  được tạo dưới dạng span con để các tiêu đề `traceparent` của nhà cung cấp vẫn nằm trên
  cùng một dấu vết.
- **Tương quan lệnh gọi mô hình:** Các span `openclaw.model.call` mặc định bao gồm kích thước
  an toàn của các thành phần lời nhắc và thuộc tính token theo từng lệnh gọi khi kết quả từ nhà cung cấp
  cung cấp dữ liệu sử dụng. `openclaw.model.usage` vẫn là span kế toán
  cấp lần chạy dành cho các bảng điều khiển chi phí tổng hợp, ngữ cảnh và kênh, đồng thời
  vẫn nằm trên cùng dấu vết chẩn đoán khi runtime phát có ngữ cảnh dấu vết
  đáng tin cậy.

### Đơn vị quan sát lệnh gọi mô hình

Mỗi span `openclaw.model.call` xác định vòng đời của nó đo lường điều gì thông qua
`openclaw.model_call.observation_unit`:

- `request` - một yêu cầu mô hình/nhà cung cấp có thể quan sát. Các lệnh gọi mô hình nhúng
  gốc sử dụng đơn vị này và trình xuất coi giá trị bị thiếu là `request` để
  tương thích với các trình phát cũ hơn hoặc bên ngoài.
- `turn` - một lượt CLI tác tử không minh bạch có thể chứa các yêu cầu mô hình ẩn,
  lần thử lại, thao tác công cụ hoặc tác vụ nền. Các lệnh gọi Claude Code CLI và máy chủ ứng dụng Codex
  sử dụng đơn vị này.

Cả hai đơn vị vẫn là các span lệnh gọi mô hình để phần phụ trợ dấu vết có thể hiển thị đầu vào,
đầu ra, mức sử dụng và hệ thống phân cấp của mô hình. Các span yêu cầu sử dụng thao tác GenAI bắt nguồn từ API
(`chat`, `generate_content` hoặc `text_completion`), còn các span lượt sử dụng
`gen_ai.operation.name = invoke_agent`. Cả hai đều đóng góp vào
`gen_ai.client.operation.duration`, trong đó tên thao tác giúp phân tách độ trễ của yêu cầu trực tiếp
khỏi độ trễ toàn lượt. Các số liệu lệnh gọi mô hình OTEL của OpenClaw
cũng bao gồm `openclaw.model_call.observation_unit`; các số liệu lệnh gọi mô hình
Prometheus cung cấp nhãn `observation_unit` tương đương.

### Độ trung thực của lệnh gọi mô hình Claude Code CLI

Các lượt Claude Code CLI phát một span `openclaw.model.call` tổng hợp
duy nhất ở cấp lượt. Đây không phải là các span yêu cầu HTTP Anthropic. Chúng sử dụng `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` và xác định
thao tác là `gen_ai.operation.name = invoke_agent`. Chúng xác định
ranh giới CLI của OpenClaw thông qua
`openclaw.transport`:

- `stdio` - tiến trình Claude Code cục bộ chạy một lần.
- `stdio-live` - một lượt trên phiên stdio Claude liên tục được quản lý.
- `paired-node-cli` - lần thực thi Claude Code một lần được ủy quyền cho một
  Node đã ghép nối.

Chẩn đoán Claude CLI chỉ được khởi tạo khi bộ điều phối chẩn đoán
tiến trình được bật và có một trình nghe sự kiện nội bộ hoặc đáng tin cậy được đính kèm.
Khi không có Plugin quan sát hoặc trình nghe nào khác đang hoạt động, các lượt Claude CLI sẽ bỏ qua
hệ thống phân cấp dấu vết tổng hợp, bộ đệm nội dung và việc tính toán byte luồng
chẩn đoán. Khi tính năng thu thập nội dung được bật, các trường lời nhắc và lời nhắc hệ thống
được giới hạn ở 128 KiB mỗi trường; đầu ra của trợ lý được giới hạn ở 128 KiB trên tối đa
200 phong bì, trong đó dành riêng 16 KiB và một mục cho phản hồi dự phòng hiển thị
cuối cùng. Một dấu đánh dấu ghi nhận việc cắt bớt khi đạt đến giới hạn.

OpenClaw cung cấp cho các lượt Claude CLI cùng hệ thống phân cấp quyền sở hữu mà các
runtime tác tử khác sử dụng: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
chứa `openclaw.run`, và mục này chứa span `openclaw.model.call`
của Claude. Các span bộ khung và lần chạy là ranh giới lượt tổng hợp của OpenClaw, không phải
các giai đoạn nội bộ của Claude Code. Các lượt chạy một lần và stdio được quản lý sử dụng cùng
hệ thống phân cấp; một lần thử lại phiên mới thực sự sẽ tạo một span con lệnh gọi mô hình khác bên trong
cùng một lần chạy OpenClaw.

Span bắt đầu khi OpenClaw tiếp nhận lượt CLI đã chuẩn bị và chỉ kết thúc sau khi
lượt đó thành công hoặc thất bại. Đối với các phiên được quản lý, kết quả thành công tạm thời
không kết thúc span khi Claude báo cáo các tác tử hoặc quy trình nền đang giữ kết quả;
kết quả cuối cùng sau khi xả hàng đợi mới kết thúc span. Hủy bỏ, hết thời gian chờ, lỗi tiến trình,
lỗi đầu ra/phân tích cú pháp và các lỗi lượt khác kết thúc cùng span đó với trạng thái lỗi.

Claude Code báo cáo mức sử dụng theo từng thông điệp của trợ lý và cũng có thể báo cáo mức sử dụng
tích lũy trong kết quả cuối. Việc tính toán phản hồi của OpenClaw tiếp tục sử dụng
thông điệp cuối cùng của trợ lý để ngữ nghĩa chi phí hiện có không thay đổi; span lệnh gọi mô hình
cấp lượt sử dụng mức sử dụng tích lũy cuối cùng khi có,
bao gồm token đọc bộ nhớ đệm và tạo bộ nhớ đệm.

Đối với các span CLI này, các trường byte và thời gian mô tả ranh giới CLI OpenClaw
có thể quan sát:

- `openclaw.model_call.request_bytes` là kích thước UTF-8 của giá trị lời nhắc
  được gửi qua stdin/argv chạy một lần hoặc phong bì người dùng JSONL của stdio được quản lý. Đây
  không phải là kích thước yêu cầu mô hình ẩn của Claude Code.
- `openclaw.model_call.response_bytes` là kích thước UTF-8 của stdout Claude CLI
  được quan sát trong lượt. Đây không phải là kích thước phản hồi HTTP Anthropic.
- `openclaw.model_call.time_to_first_byte_ms` là thời gian cho đến đầu ra stdout hoặc stderr
  đầu tiên có thể quan sát từ Claude CLI. Đây không phải là TTFB mạng.

Khi bật các trường `captureContent` chi tiết tương ứng, span sẽ xuất
lời nhắc thực tế mà OpenClaw gửi đến Claude Code, lời nhắc hệ thống do OpenClaw nối thêm
và văn bản/suy luận/danh tính lệnh gọi công cụ hiển thị của trợ lý thông qua
`gen_ai.input.messages`, `gen_ai.output.messages` và
`gen_ai.system_instructions`. Các đối số công cụ, chữ ký suy nghĩ không minh bạch và
kết quả công cụ bị loại khỏi phong bì trợ lý Claude. OpenClaw không
tuyên bố có quyền truy cập vào lời nhắc hệ thống riêng tư của Claude Code, tải trọng yêu cầu ẩn được tiếp tục hoặc
Compaction, lược đồ công cụ nội bộ gốc, yêu cầu HTTP Anthropic thô,
các lần thử lại nội bộ, mã định danh yêu cầu ngược dòng hoặc TTFB mạng thực. Vì
Claude Code không cung cấp chính xác các định nghĩa công cụ gốc thực tế,
các span này không điền `gen_ai.tool.definitions`.

Các span công cụ bộ khung Claude bên ngoài vẫn chỉ chứa siêu dữ liệu ngay cả khi tính năng thu thập
nội dung công cụ được bật. Cũng như mọi span mô hình, nội dung Claude CLI được thu thập sử dụng
quy trình chỉ dành cho trình nghe đáng tin cậy cùng các giới hạn che thông tin và kích thước hiện có
của trình xuất; nội dung mặc định vẫn bị tắt.

## Số liệu được xuất

### Mức sử dụng mô hình

- `openclaw.tokens` (bộ đếm, thuộc tính: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (biểu đồ tần suất, thuộc tính: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (biểu đồ tần suất, số liệu theo quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (biểu đồ tần suất, giây, số liệu theo quy ước ngữ nghĩa GenAI dành cho các yêu cầu mô hình và lượt tác tử tổng hợp; thuộc tính: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` tùy chọn; các quan sát lượt sử dụng `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit`, cùng với `openclaw.errorCategory` và `openclaw.failureKind` trên các lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (biểu đồ tần suất, kích thước byte UTF-8 của tải trọng yêu cầu mô hình cuối cùng; đối với Claude Code CLI, là đầu vào/phong bì lời nhắc có thể quan sát được mô tả ở trên; không chứa nội dung tải trọng thô)
- `openclaw.model_call.response_bytes` (biểu đồ tần suất, kích thước byte UTF-8 của tải trọng các đoạn phản hồi truyền trực tuyến; các phần chênh lệch văn bản, suy nghĩ và lệnh gọi công cụ có tần suất cao chỉ tính các byte `delta` gia tăng; đối với Claude Code CLI, là các byte stdout được quan sát; không chứa nội dung phản hồi thô)
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

### Talk

- `openclaw.talk.event` (bộ đếm, thuộc tính: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát khi một sự kiện Talk báo cáo thời lượng)
- `openclaw.talk.audio.bytes` (biểu đồ tần suất, thuộc tính: giống `openclaw.talk.event`; được phát cho các sự kiện khung âm thanh Talk báo cáo độ dài byte)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.depth` (biểu đồ tần suất, thuộc tính: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (biểu đồ tần suất, thuộc tính: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, thuộc tính: `openclaw.state`; được phát cho hoạt động ghi sổ phiên cũ có thể khôi phục)
- `openclaw.session.stuck_age_ms` (biểu đồ tần suất, thuộc tính: `openclaw.state`; được phát cho hoạt động ghi sổ phiên cũ có thể khôi phục)
- `openclaw.session.turn.created` (bộ đếm, thuộc tính: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (biểu đồ tần suất, thuộc tính: giống bộ đếm khôi phục tương ứng)
- `openclaw.run.attempt` (bộ đếm, thuộc tính: `openclaw.attempt`)

### Phép đo từ xa về tính hoạt động của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng thời gian không có tiến triển dùng để chẩn đoán
tính hoạt động của phiên. Phiên `processing` không tiến gần đến ngưỡng này
khi OpenClaw quan sát thấy tiến triển của phản hồi, công cụ, trạng thái, khối hoặc
môi trường chạy ACP. Tín hiệu duy trì trạng thái đang nhập không được tính là tiến triển,
vì vậy vẫn có thể phát hiện mô hình hoặc bộ điều phối không phát tín hiệu.

OpenClaw phân loại phiên theo công việc mà hệ thống vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi công cụ
  vẫn đang tiến triển. Các lệnh gọi mô hình có chủ sở hữu nhưng không phát tín hiệu sau
  `diagnostics.stuckSessionWarnMs` cũng được báo cáo là chạy lâu trước
  `diagnostics.stuckSessionAbortMs`, để các nhà cung cấp mô hình chậm hoặc không truyền phát
  không bị xem như phiên gateway đình trệ khi vẫn có thể quan sát việc hủy.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy hiện tại không báo cáo
  tiến triển gần đây. Các lệnh gọi mô hình có chủ sở hữu chuyển từ `session.long_running` sang
  `session.stalled` tại hoặc sau `diagnostics.stuckSessionAbortMs`; hoạt động
  mô hình/công cụ cũ không có chủ sở hữu không được xem là công việc chạy lâu vô hại.
  Ban đầu, các lượt chạy nhúng bị đình trệ chỉ được quan sát, sau đó bị hủy và chờ tháo cạn
  sau `diagnostics.stuckSessionAbortMs` mà không có tiến triển, để các lượt đang xếp hàng phía sau
  làn có thể tiếp tục. Khi không được đặt, ngưỡng hủy mặc định sử dụng khoảng thời gian
  kéo dài an toàn hơn, ít nhất là 5 phút và gấp 3 lần
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: hoạt động ghi sổ phiên cũ không có công việc đang hoạt động, hoặc một phiên
  xếp hàng đang rảnh với hoạt động mô hình/công cụ cũ không có chủ sở hữu. Thao tác này giải phóng
  làn phiên bị ảnh hưởng ngay sau khi các cổng khôi phục được thông qua.

Quá trình khôi phục phát các sự kiện có cấu trúc `session.recovery.requested` và
`session.recovery.completed`. Trạng thái phiên chẩn đoán chỉ được đánh dấu là rảnh
sau một kết quả khôi phục có thay đổi trạng thái (`aborted` hoặc `released`) và chỉ khi
cùng một thế hệ xử lý vẫn còn hiện hành.

Chỉ `session.stuck` phát bộ đếm `openclaw.session.stuck`, biểu đồ tần suất
`openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`.
Các chẩn đoán `session.stuck` lặp lại sẽ giãn dần trong khi phiên không thay đổi,
vì vậy bảng điều khiển nên cảnh báo khi có mức tăng kéo dài thay vì
ở mỗi nhịp Heartbeat. Để biết tùy chọn cấu hình và các giá trị mặc định, hãy xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

Cảnh báo về tính hoạt động cũng phát:

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
- `openclaw.tool.loop` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` không bắt buộc; được phát khi phát hiện vòng lặp gọi công cụ lặp đi lặp lại)

### Exec

- `openclaw.exec.duration_ms` (biểu đồ tần suất, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Thành phần nội bộ của chẩn đoán (bộ nhớ, tải trọng, tình trạng trình xuất)

- `openclaw.payload.large` (bộ đếm, thuộc tính: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (biểu đồ tần suất, thuộc tính: giống `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (các biểu đồ tần suất, không có thuộc tính; các mẫu bộ nhớ tiến trình)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (bộ đếm, thuộc tính: `openclaw.diagnostic.async_queue.drop_class`; các lượt loại bỏ do áp lực ngược trong hàng đợi chẩn đoán nội bộ)
- `openclaw.telemetry.exporter.events` (bộ đếm, thuộc tính: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` không bắt buộc, `openclaw.errorCategory` không bắt buộc; phép đo từ xa tự giám sát vòng đời/lỗi của trình xuất)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (đầu vào/đầu ra/đọc bộ nhớ đệm/ghi bộ nhớ đệm/tổng)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn sử dụng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi chọn sử dụng các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` hoặc `turn`)
  - `openclaw.errorCategory`, `error.type` và `openclaw.failureKind` không bắt buộc khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (chỉ kích thước thành phần an toàn, không có văn bản lời nhắc)
  - `openclaw.model_call.usage.*` và `gen_ai.usage.*` khi kết quả chứa mức sử dụng cho yêu cầu đó hoặc lượt tổng hợp
  - Sự kiện span `openclaw.provider.request` với thuộc tính `openclaw.upstreamRequestIdHash` (có giới hạn, dựa trên hàm băm) khi kết quả của nhà cung cấp thượng nguồn cung cấp mã định danh yêu cầu; mã định danh thô không bao giờ được xuất
  - Với `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, các span yêu cầu sử dụng tên span suy luận GenAI mới nhất `{gen_ai.operation.name} {gen_ai.request.model}`. Các span lượt sử dụng `invoke_agent` vì OpenClaw không khẳng định một tên tác tử gốc từ ranh giới CLI không trong suốt. Cả hai sử dụng loại span `CLIENT` thay vì `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Khi hoàn tất: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Khi có lỗi: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` không bắt buộc
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` không bắt buộc, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` không bắt buộc khi có lỗi, `openclaw.deniedReason` và `openclaw.outcome=blocked` khi bị chính sách hoặc hộp cát từ chối
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` không bắt buộc (không có thông báo vòng lặp, tham số hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` không bắt buộc

Khi tính năng thu thập nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm các thuộc tính `openclaw.content.*` đã biên tập và có giới hạn cho những
lớp nội dung cụ thể mà bạn đã chọn.

## Danh mục sự kiện chẩn đoán

Các sự kiện dưới đây hỗ trợ các chỉ số và span ở trên hoặc có sẵn để Plugin
đăng ký trực tiếp. `run.progress` và `run.execution_phase` là các tín hiệu vòng đời
chỉ dành cho truy cập trực tiếp; Plugin diagnostics-otel không xuất chúng dưới dạng
tín hiệu OTLP độc lập. Các loại sự kiện và giá trị `run.execution_phase.phase` có tính
bổ sung. Người dùng TypeScript nên giữ các nhánh mặc định thay vì giả định
một trong hai union sẽ luôn bao quát đầy đủ.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, nhà cung cấp/mô hình/kênh,
  mã định danh phiên. `usage` là số liệu hạch toán của nhà cung cấp/lượt cho chi phí và phép đo từ xa;
  `context.used` là ảnh chụp nhanh lời nhắc/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của nhà cung cấp khi có đầu vào được lưu vào bộ nhớ đệm hoặc các lệnh gọi trong vòng lặp công cụ.

**Luồng thông báo**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (các mốc khởi động công khai, tương quan với phiên của trình chạy nhúng)
- `diagnostic.heartbeat` (các bộ đếm tổng hợp: webhook/hàng đợi/phiên)

**Vòng đời bộ điều phối**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  vòng đời theo từng lượt chạy cho bộ khung tác tử. Bao gồm `harnessId`, tùy chọn
  `pluginId`, nhà cung cấp/mô hình/kênh và id lượt chạy. Khi hoàn tất, bổ sung
  số lượng `durationMs`, `outcome`, tùy chọn `resultClassification`, `yieldDetected`
  và `itemLifecycle`. Khi xảy ra lỗi, bổ sung `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` và
  tùy chọn `cleanupFailed`.

**Thực thi**

- `exec.process.completed` - kết quả cuối của terminal, thời lượng, đích, chế độ, mã
  thoát và loại lỗi. Văn bản lệnh và thư mục làm việc không được
  bao gồm.
- `exec.approval.followup_suppressed` - lượt theo dõi phê duyệt đã cũ bị loại bỏ
  sau khi phiên được liên kết lại. Bao gồm `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` hoặc `gateway_preflight`)
  và dấu thời gian của bộ điều phối. Khóa phiên, tuyến và văn bản lệnh
  không được bao gồm.

## Không có trình xuất

Duy trì khả năng cung cấp các sự kiện chẩn đoán cho Plugin hoặc đích tùy chỉnh mà không cần chạy
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất thông tin gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy sử dụng các cờ
chẩn đoán. Các cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (`telegram.*` hoặc
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Hoặc ghi đè biến môi trường một lần:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Đầu ra của cờ được ghi vào tệp nhật ký tiêu chuẩn (`logging.file`) và vẫn được
`logging.redactSensitive` che dữ liệu nhạy cảm. Hướng dẫn đầy đủ:
[Cờ chẩn đoán](/vi/diagnostics/flags).

## Vô hiệu hóa

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
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ về trường `diagnostics.*`
