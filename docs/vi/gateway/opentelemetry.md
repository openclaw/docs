---
read_when:
    - Bạn muốn gửi mức sử dụng mô hình, luồng tin nhắn hoặc chỉ số phiên của OpenClaw đến một bộ thu thập OpenTelemetry
    - Bạn đang kết nối trace, metric hoặc log vào Grafana, Datadog, Honeycomb, New Relic, Tempo hoặc một backend OTLP khác
    - Bạn cần tên chỉ số, tên span hoặc cấu trúc thuộc tính chính xác để xây dựng bảng điều khiển hoặc cảnh báo
summary: Xuất chẩn đoán OpenClaw sang các bộ thu thập OpenTelemetry hoặc stdout JSONL qua Plugin diagnostics-otel
title: Xuất OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:31:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw xuất chẩn đoán thông qua Plugin chính thức `diagnostics-otel`
bằng **OTLP/HTTP (protobuf)**. Nhật ký cũng có thể được ghi dưới dạng stdout JSONL cho
các pipeline nhật ký container và sandbox. Bất kỳ collector hoặc backend nào chấp nhận
OTLP/HTTP đều hoạt động mà không cần thay đổi mã. Đối với nhật ký tệp cục bộ và cách đọc chúng,
xem [Ghi nhật ký](/vi/logging).

## Cách các thành phần kết hợp với nhau

- **Sự kiện chẩn đoán** là các bản ghi có cấu trúc, trong tiến trình, do
  Gateway và các Plugin đi kèm phát ra cho lượt chạy mô hình, luồng tin nhắn, phiên, hàng đợi,
  và exec.
- **Plugin `diagnostics-otel`** đăng ký nhận các sự kiện đó và xuất chúng dưới dạng
  **metrics**, **traces**, và **logs** của OpenTelemetry qua OTLP/HTTP. Plugin này cũng có thể
  sao chép các bản ghi nhật ký chẩn đoán ra stdout JSONL.
- **Lệnh gọi nhà cung cấp** nhận header W3C `traceparent` từ ngữ cảnh span lệnh gọi mô hình
  đáng tin cậy của OpenClaw khi transport của nhà cung cấp chấp nhận header tùy chỉnh.
  Ngữ cảnh trace do Plugin phát ra không được truyền tiếp.
- Exporter chỉ được gắn khi cả bề mặt chẩn đoán và Plugin đều
  được bật, nên chi phí trong tiến trình mặc định gần như bằng không.

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

| Tín hiệu    | Nội dung được đưa vào                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Bộ đếm và histogram cho mức dùng token, chi phí, thời lượng lượt chạy, failover, mức dùng skill, luồng tin nhắn, sự kiện Talk, lane hàng đợi, trạng thái/khôi phục phiên, thực thi công cụ, payload quá cỡ, exec, và áp lực bộ nhớ. |
| **Traces**  | Span cho mức dùng mô hình, lệnh gọi mô hình, vòng đời harness, mức dùng skill, thực thi công cụ, exec, xử lý webhook/tin nhắn, lắp ráp ngữ cảnh, và vòng lặp công cụ.                                       |
| **Logs**    | Bản ghi `logging.file` có cấu trúc được xuất qua OTLP hoặc stdout JSONL khi `diagnostics.otel.logs` được bật; phần thân nhật ký bị giữ lại trừ khi việc thu thập nội dung được bật rõ ràng.                 |

Bật/tắt `traces`, `metrics`, và `logs` độc lập. Traces và metrics
mặc định bật khi `diagnostics.otel.enabled` là true. Logs mặc định tắt và
chỉ được xuất khi `diagnostics.otel.logs` được đặt rõ ràng là `true`. Xuất nhật ký
mặc định dùng OTLP; đặt `diagnostics.otel.logsExporter` thành `stdout` để xuất JSONL trên
stdout, hoặc `both` để gửi từng bản ghi nhật ký chẩn đoán tới OTLP và stdout.

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

| Biến                                                                                                              | Mục đích                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Ghi đè `diagnostics.otel.endpoint`. Nếu giá trị đã chứa `/v1/traces`, `/v1/metrics`, hoặc `/v1/logs`, giá trị đó được dùng nguyên trạng.                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Ghi đè endpoint theo từng tín hiệu, được dùng khi khóa cấu hình `diagnostics.otel.*Endpoint` tương ứng chưa được đặt. Cấu hình theo từng tín hiệu thắng env theo từng tín hiệu, và env theo từng tín hiệu thắng endpoint dùng chung.                                                                                                           |
| `OTEL_SERVICE_NAME`                                                                                               | Ghi đè `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Ghi đè giao thức truyền tải (hiện nay chỉ `http/protobuf` được tôn trọng).                                                                                                                                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Đặt thành `gen_ai_latest_experimental` để phát dạng span suy luận GenAI thử nghiệm mới nhất, bao gồm tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT`, và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Metrics GenAI luôn dùng các thuộc tính ngữ nghĩa có giới hạn và cardinality thấp.               |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Đặt thành `1` khi một preload hoặc tiến trình host khác đã đăng ký OpenTelemetry SDK toàn cục. Khi đó Plugin bỏ qua vòng đời NodeSDK của chính nó nhưng vẫn nối các listener chẩn đoán và tôn trọng `traces`/`metrics`/`logs`.                                                                                                                |

## Quyền riêng tư và thu thập nội dung

Nội dung thô của mô hình/công cụ **không** được xuất theo mặc định. Span mang các
định danh có giới hạn (kênh, nhà cung cấp, mô hình, danh mục lỗi, id yêu cầu chỉ dạng hash,
nguồn công cụ, chủ sở hữu công cụ, và tên/nguồn skill) và không bao giờ bao gồm văn bản prompt,
văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, đường dẫn tệp skill, hoặc khóa phiên.
Bản ghi nhật ký OTLP mặc định giữ lại mức độ nghiêm trọng, logger, vị trí mã, ngữ cảnh trace đáng tin cậy,
và thuộc tính đã làm sạch, nhưng phần thân thông điệp nhật ký thô chỉ được xuất
khi `diagnostics.otel.captureContent` được đặt thành boolean `true`. Các khóa con
`captureContent.*` chi tiết không bật phần thân nhật ký. Nhãn trông giống như
khóa phiên agent có phạm vi sẽ được thay bằng `unknown`.
Metrics Talk chỉ xuất metadata sự kiện có giới hạn như chế độ, transport,
nhà cung cấp, và loại sự kiện. Chúng không bao gồm bản ghi hội thoại, payload âm thanh,
id phiên, id lượt, id cuộc gọi, id phòng, hoặc token bàn giao.

Yêu cầu mô hình gửi ra ngoài có thể bao gồm header W3C `traceparent`. Header đó chỉ
được tạo từ ngữ cảnh trace chẩn đoán thuộc sở hữu OpenClaw cho lệnh gọi mô hình đang hoạt động.
Các header `traceparent` do caller cung cấp sẵn sẽ bị thay thế, nên Plugin hoặc
tùy chọn nhà cung cấp tùy chỉnh không thể giả mạo nguồn gốc trace liên dịch vụ.

Chỉ đặt `diagnostics.otel.captureContent.*` thành `true` khi collector và
chính sách lưu giữ của bạn đã được phê duyệt cho văn bản prompt, phản hồi, công cụ, hoặc system-prompt.
Mỗi khóa con được chọn bật độc lập:

- `inputMessages` - nội dung prompt của người dùng.
- `outputMessages` - nội dung phản hồi của mô hình.
- `toolInputs` - payload đối số công cụ.
- `toolOutputs` - payload kết quả công cụ.
- `systemPrompt` - prompt hệ thống/nhà phát triển đã lắp ráp.
- `toolDefinitions` - tên, mô tả, và schema của công cụ mô hình.

Khi bất kỳ khóa con nào được bật, các span mô hình và công cụ nhận thuộc tính
`openclaw.content.*` có giới hạn, đã biên tập lại chỉ cho lớp đó. Chỉ dùng boolean
`captureContent: true` cho các đợt thu thập chẩn đoán rộng khi phần thân thông điệp nhật ký OTLP
cũng được phê duyệt để xuất.

Nội dung `toolInputs`/`toolOutputs` được thu thập cho các lần thực thi công cụ của runtime agent tích hợp
(`openclaw.content.tool_input` trên span hoàn tất/lỗi,
`openclaw.content.tool_output` trên span hoàn tất). Lệnh gọi công cụ của harness bên ngoài
(Codex, Claude CLI) phát span `tool.execution.*` không kèm payload nội dung.
Nội dung đã thu thập đi qua một kênh đáng tin cậy, chỉ dành cho listener và không bao giờ được đặt
trên bus sự kiện chẩn đoán công khai.

## Lấy mẫu và flush

- **Traces:** `diagnostics.otel.sampleRate` (chỉ root-span, `0.0` bỏ tất cả,
  `1.0` giữ tất cả).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (tối thiểu `1000`).
- **Logs:** Nhật ký OTLP tôn trọng `logging.level` (mức nhật ký tệp). Chúng dùng
  đường dẫn biên tập lại bản ghi nhật ký chẩn đoán, không dùng định dạng console. Các bản cài đặt
  lưu lượng cao nên ưu tiên lấy mẫu/lọc ở OTLP collector thay vì lấy mẫu cục bộ.
  Đặt `diagnostics.otel.logsExporter: "stdout"` khi nền tảng của bạn đã
  chuyển stdout/stderr tới bộ xử lý nhật ký và bạn không có collector nhật ký OTLP.
  Bản ghi stdout là một đối tượng JSON trên mỗi dòng với `ts`, `signal`,
  `service.name`, mức độ nghiêm trọng, body, thuộc tính đã biên tập lại, và các trường trace đáng tin cậy
  khi có sẵn.
- **Tương quan nhật ký tệp:** Nhật ký tệp JSONL bao gồm `traceId`,
  `spanId`, `parentSpanId`, và `traceFlags` cấp cao nhất khi lệnh gọi nhật ký mang ngữ cảnh trace chẩn đoán
  hợp lệ, cho phép bộ xử lý nhật ký nối các dòng nhật ký cục bộ với
  span đã xuất.
- **Tương quan yêu cầu:** Yêu cầu HTTP Gateway và frame WebSocket tạo một
  phạm vi trace yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán bên trong phạm vi đó
  mặc định kế thừa trace yêu cầu, trong khi các span lượt chạy agent và lệnh gọi mô hình
  được tạo làm con để header `traceparent` của nhà cung cấp vẫn ở trên cùng một trace.

## Metrics được xuất

### Mức dùng mô hình

- `openclaw.tokens` (bộ đếm, thuộc tính: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, thuộc tính: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, thuộc tính: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, chỉ số quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, giây, chỉ số quy ước ngữ nghĩa GenAI, thuộc tính: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` tùy chọn)
- `openclaw.model_call.duration_ms` (histogram, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, cùng với `openclaw.errorCategory` và `openclaw.failureKind` trên các lỗi đã phân loại)
- `openclaw.model_call.request_bytes` (histogram, kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng; không có nội dung payload thô)
- `openclaw.model_call.response_bytes` (histogram, kích thước byte UTF-8 của các payload đoạn phản hồi được truyền luồng; văn bản tần suất cao, suy nghĩ và delta lệnh gọi công cụ chỉ tính số byte `delta` tăng thêm; không có nội dung phản hồi thô)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, thời gian đã trôi qua trước sự kiện phản hồi được truyền luồng đầu tiên)
- `openclaw.model.failover` (bộ đếm, thuộc tính: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (bộ đếm, thuộc tính: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` tùy chọn, `openclaw.toolName` tùy chọn)

### Luồng thông điệp

- `openclaw.webhook.received` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, thuộc tính: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, thuộc tính: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, thuộc tính: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (bộ đếm, thuộc tính: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, thuộc tính: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Trò chuyện

- `openclaw.talk.event` (bộ đếm, thuộc tính: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, thuộc tính: giống `openclaw.talk.event`; được phát ra khi một sự kiện Trò chuyện báo cáo thời lượng)
- `openclaw.talk.audio.bytes` (histogram, thuộc tính: giống `openclaw.talk.event`; được phát ra cho các sự kiện khung âm thanh Trò chuyện báo cáo độ dài byte)

### Hàng đợi và phiên

- `openclaw.queue.lane.enqueue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (bộ đếm, thuộc tính: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, thuộc tính: `openclaw.lane` hoặc `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, thuộc tính: `openclaw.lane`)
- `openclaw.session.state` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (bộ đếm, thuộc tính: `openclaw.state`; được phát ra cho sổ sách phiên cũ có thể khôi phục)
- `openclaw.session.stuck_age_ms` (histogram, thuộc tính: `openclaw.state`; được phát ra cho sổ sách phiên cũ có thể khôi phục)
- `openclaw.session.turn.created` (bộ đếm, thuộc tính: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (bộ đếm, thuộc tính: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, thuộc tính: giống bộ đếm khôi phục tương ứng)
- `openclaw.run.attempt` (bộ đếm, thuộc tính: `openclaw.attempt`)

### Đo lường từ xa về trạng thái hoạt động của phiên

`diagnostics.stuckSessionWarnMs` là ngưỡng tuổi không có tiến triển cho chẩn đoán trạng thái hoạt động của phiên. Một phiên `processing` không tăng tuổi theo ngưỡng này trong khi OpenClaw quan sát thấy tiến trình phản hồi, công cụ, trạng thái, khối hoặc thời gian chạy ACP. Các keepalive khi đang nhập không được tính là tiến triển, nên mô hình hoặc harness im lặng vẫn có thể được phát hiện.

OpenClaw phân loại phiên theo công việc mà nó vẫn có thể quan sát:

- `session.long_running`: công việc nhúng đang hoạt động, lệnh gọi mô hình hoặc lệnh gọi công cụ vẫn đang tiến triển. Các lệnh gọi mô hình có chủ sở hữu nhưng im lặng quá `diagnostics.stuckSessionWarnMs` cũng được báo cáo là chạy lâu trước `diagnostics.stuckSessionAbortMs`, để các nhà cung cấp mô hình chậm hoặc không truyền luồng không trông giống như phiên gateway bị kẹt trong khi chúng vẫn có thể được quan sát để hủy.
- `session.stalled`: có công việc đang hoạt động, nhưng lượt chạy đang hoạt động chưa báo cáo tiến trình gần đây. Các lệnh gọi mô hình có chủ sở hữu chuyển từ `session.long_running` sang `session.stalled` tại hoặc sau `diagnostics.stuckSessionAbortMs`; hoạt động mô hình/công cụ cũ không có chủ sở hữu không được xem là công việc chạy lâu vô hại. Các lượt chạy nhúng bị kẹt ban đầu chỉ ở chế độ quan sát, sau đó hủy-xả sau `diagnostics.stuckSessionAbortMs` nếu không có tiến triển để các lượt đang xếp hàng phía sau lane có thể tiếp tục. Khi chưa đặt, ngưỡng hủy mặc định là khoảng thời gian mở rộng an toàn hơn, ít nhất 5 phút và gấp 3 lần `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: sổ sách phiên cũ không có công việc đang hoạt động, hoặc một phiên đã xếp hàng đang rỗi với hoạt động mô hình/công cụ cũ không có chủ sở hữu. Trạng thái này giải phóng ngay lane phiên bị ảnh hưởng sau khi các cổng khôi phục đạt yêu cầu.

Khôi phục phát ra các sự kiện `session.recovery.requested` và `session.recovery.completed` có cấu trúc. Trạng thái phiên chẩn đoán chỉ được đánh dấu là rỗi sau một kết quả khôi phục có thay đổi (`aborted` hoặc `released`) và chỉ khi cùng thế hệ xử lý vẫn là hiện hành.

Chỉ `session.stuck` phát ra bộ đếm `openclaw.session.stuck`, histogram `openclaw.session.stuck_age_ms` và span `openclaw.session.stuck`. Các chẩn đoán `session.stuck` lặp lại sẽ lùi nhịp trong khi phiên không thay đổi, nên dashboard nên cảnh báo trên các mức tăng kéo dài thay vì từng nhịp Heartbeat. Để xem nút cấu hình và mặc định, hãy xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics).

Cảnh báo trạng thái hoạt động cũng phát ra:

- `openclaw.liveness.warning` (bộ đếm, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, thuộc tính: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, thuộc tính: `openclaw.liveness.reason`)

### Vòng đời harness

- `openclaw.harness.duration_ms` (histogram, thuộc tính: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` trên lỗi)

### Thực thi công cụ

- `openclaw.tool.execution.duration_ms` (histogram, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, cùng với `openclaw.errorCategory` trên lỗi)
- `openclaw.tool.execution.blocked` (bộ đếm, thuộc tính: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, thuộc tính: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Nội bộ chẩn đoán (bộ nhớ và vòng lặp công cụ)

- `openclaw.payload.large` (bộ đếm, thuộc tính: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, thuộc tính: giống `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, thuộc tính: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (bộ đếm, thuộc tính: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (bộ đếm, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, thuộc tính: `openclaw.toolName`, `openclaw.outcome`)

## Các span được xuất

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi bật các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` theo mặc định, hoặc `gen_ai.provider.name` khi bật các quy ước ngữ nghĩa GenAI mới nhất
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` và `openclaw.failureKind` tùy chọn khi có lỗi
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (mã băm có giới hạn dựa trên SHA của id yêu cầu provider thượng nguồn; id thô không được xuất)
  - Với `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, các span lệnh gọi mô hình dùng tên span suy luận GenAI mới nhất `{gen_ai.operation.name} {gen_ai.request.model}` và loại span `CLIENT` thay vì `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (không có nội dung lời nhắc, lịch sử, phản hồi hoặc khóa phiên)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (không có thông báo vòng lặp, tham số hoặc đầu ra công cụ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Khi tính năng ghi lại nội dung được bật rõ ràng, các span mô hình và công cụ cũng có thể
bao gồm thuộc tính `openclaw.content.*` có giới hạn và đã được biên tập cho các lớp
nội dung cụ thể mà bạn đã chọn tham gia.

## Danh mục sự kiện chẩn đoán

Các sự kiện dưới đây hỗ trợ các chỉ số và span ở trên. Các Plugin cũng có thể đăng ký
trực tiếp vào chúng mà không cần xuất OTLP.

**Mức sử dụng mô hình**

- `model.usage` - token, chi phí, thời lượng, ngữ cảnh, provider/mô hình/kênh,
  id phiên. `usage` là kế toán theo provider/lượt cho chi phí và đo từ xa;
  `context.used` là ảnh chụp lời nhắc/ngữ cảnh hiện tại và có thể thấp hơn
  `usage.total` của provider khi có đầu vào được lưu trong bộ nhớ đệm hoặc lệnh gọi vòng lặp công cụ.

**Luồng thông báo**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Hàng đợi và phiên**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (bộ đếm tổng hợp: webhooks/hàng đợi/phiên)

**Vòng đời harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  vòng đời theo từng lần chạy cho harness agent. Bao gồm `harnessId`, `pluginId` tùy chọn,
  provider/mô hình/kênh và id lần chạy. Khi hoàn tất, thêm
  `durationMs`, `outcome`, `resultClassification` tùy chọn, `yieldDetected`,
  và số lượng `itemLifecycle`. Lỗi thêm `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, và
  `cleanupFailed` tùy chọn.

**Exec**

- `exec.process.completed` - kết quả cuối, thời lượng, đích, chế độ, mã thoát,
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

Để có đầu ra gỡ lỗi có mục tiêu mà không tăng `logging.level`, hãy dùng cờ chẩn đoán.
Cờ không phân biệt chữ hoa chữ thường và hỗ trợ ký tự đại diện (ví dụ: `telegram.*` hoặc
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

Đầu ra cờ đi vào tệp nhật ký chuẩn (`logging.file`) và vẫn được
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

- [Ghi nhật ký](/vi/logging) - nhật ký tệp, đầu ra console, theo dõi đuôi bằng CLI và tab Nhật ký trong Control UI
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) - kiểu nhật ký WS, tiền tố phân hệ và ghi lại console
- [Cờ chẩn đoán](/vi/diagnostics/flags) - cờ nhật ký gỡ lỗi có mục tiêu
- [Xuất chẩn đoán](/vi/gateway/diagnostics) - công cụ gói hỗ trợ cho operator (tách biệt với xuất OTEL)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) - tham chiếu đầy đủ trường `diagnostics.*`
