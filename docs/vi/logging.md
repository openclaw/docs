---
read_when:
    - Bạn cần một phần tổng quan thân thiện với người mới bắt đầu về ghi nhật ký trong OpenClaw
    - Bạn muốn cấu hình mức log, định dạng hoặc việc che dữ liệu nhạy cảm
    - Bạn đang khắc phục sự cố và cần tìm nhật ký nhanh chóng
summary: Nhật ký tệp, đầu ra bảng điều khiển, theo dõi đuôi bằng CLI và tab Nhật ký của Control UI
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-06-27T17:39:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (JSON lines) do Gateway ghi.
- **Đầu ra console** hiển thị trong terminal và Gateway Debug UI.

Thẻ **Logs** của Control UI theo dõi tệp nhật ký gateway. Trang này giải thích nơi
lưu nhật ký, cách đọc chúng, và cách cấu hình cấp độ cũng như định dạng nhật ký.

## Nơi lưu nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký xoay vòng tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày sử dụng múi giờ cục bộ của máy chủ gateway.

Mỗi tệp xoay vòng khi đạt `logging.maxFileBytes` (mặc định: 100 MB).
OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn như
`openclaw-YYYY-MM-DD.1.log`, và tiếp tục ghi vào một nhật ký hoạt động mới thay vì
ẩn thông tin chẩn đoán.

Bạn có thể ghi đè trong `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cách đọc nhật ký

### CLI: theo dõi trực tiếp (khuyến nghị)

Dùng CLI để theo dõi tệp nhật ký gateway qua RPC:

```bash
openclaw logs --follow
```

Các tùy chọn hiện tại hữu ích:

- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn
- `--url <url>` / `--token <token>` / `--timeout <ms>`: các cờ Gateway RPC tiêu chuẩn
- `--expect-final`: cờ chờ phản hồi cuối cùng của RPC do agent hỗ trợ (được chấp nhận ở đây qua lớp client dùng chung)

Chế độ đầu ra:

- **Phiên TTY**: các dòng nhật ký có cấu trúc, đẹp, có màu.
- **Phiên không phải TTY**: văn bản thuần.
- `--json`: JSON phân tách theo dòng (mỗi sự kiện nhật ký một dòng).
- `--plain`: buộc dùng văn bản thuần trong phiên TTY.
- `--no-color`: tắt màu ANSI.

Khi bạn truyền `--url` rõ ràng, CLI không tự động áp dụng cấu hình hoặc
thông tin xác thực môi trường; hãy tự thêm `--token` nếu Gateway mục tiêu
yêu cầu xác thực.

Ở chế độ JSON, CLI phát ra các đối tượng được gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích
- `notice`: gợi ý cắt ngắn / xoay vòng
- `raw`: dòng nhật ký chưa phân tích

Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong khi kết nối,
hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` sẽ tự động
chuyển sang tệp nhật ký Gateway đã cấu hình. Các mục tiêu `--url` rõ ràng không dùng
cơ chế dự phòng này. `openclaw logs --follow` nghiêm ngặt hơn: trên Linux, nó dùng
nhật ký Gateway user-systemd đang hoạt động theo PID khi có, và nếu không thì tiếp tục thử lại
Gateway trực tiếp thay vì theo dõi một tệp đặt cạnh có thể đã cũ.

Nếu không thể truy cập Gateway, CLI in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Control UI (web)

Thẻ **Logs** của Control UI theo dõi cùng tệp bằng `logs.tail`.
Xem [Control UI](/vi/web/control-ui) để biết cách mở.

### Nhật ký chỉ dành cho kênh

Để lọc hoạt động kênh (WhatsApp/Telegram/v.v.), dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và Control UI phân tích các
mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ thống con, thông điệp).

Bản ghi JSONL của nhật ký tệp cũng bao gồm các trường cấp cao nhất có thể lọc bằng máy khi
có:

- `hostname`: tên máy chủ gateway.
- `message`: văn bản thông điệp nhật ký đã làm phẳng để tìm kiếm toàn văn.
- `agent_id`: id agent đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh agent.
- `session_id`: id/khóa phiên đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ nguyên các đối số nhật ký có cấu trúc ban đầu bên cạnh các trường này
để các bộ phân tích hiện có đọc khóa đối số tslog được đánh số vẫn tiếp tục hoạt động.

Hoạt động trò chuyện, giọng nói thời gian thực và phòng được quản lý phát ra các bản ghi nhật ký
vòng đời có giới hạn thông qua cùng pipeline nhật ký tệp này. Các bản ghi này bao gồm loại sự kiện,
chế độ, transport, nhà cung cấp, và các phép đo kích thước/thời gian khi có, nhưng bỏ qua
văn bản bản chép lời, payload âm thanh, id lượt, id cuộc gọi và id mục nhà cung cấp.

### Đầu ra console

Nhật ký console **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ thống con (ví dụ `gateway/channels/whatsapp`)
- Tô màu theo cấp độ (info/warn/error)
- Chế độ compact hoặc JSON tùy chọn

Định dạng console được điều khiển bởi `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ bình thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích, lệnh gọi chậm)
- `--verbose`: toàn bộ lưu lượng yêu cầu/phản hồi
- `--ws-log auto|compact|full`: chọn kiểu hiển thị verbose
- `--compact`: bí danh cho `--ws-log compact`

Ví dụ:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Cấu hình ghi nhật ký

Toàn bộ cấu hình ghi nhật ký nằm dưới `logging` trong `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Cấp độ nhật ký

- `logging.level`: cấp độ **nhật ký tệp** (JSONL).
- `logging.consoleLevel`: mức chi tiết của **console**.

Bạn có thể ghi đè cả hai bằng biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường được ưu tiên hơn tệp cấu hình, nên bạn có thể tăng mức chi tiết cho một lần chạy mà không cần chỉnh sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ, `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra console và mức chi tiết nhật ký WS; nó không thay đổi
cấp độ nhật ký tệp.

### Chẩn đoán transport mô hình có mục tiêu

Khi gỡ lỗi các lệnh gọi nhà cung cấp, hãy dùng các cờ môi trường có mục tiêu thay vì tăng
tất cả nhật ký lên `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Các cờ có sẵn:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: phát ra thời điểm bắt đầu yêu cầu, phản hồi fetch, header SDK,
  sự kiện streaming đầu tiên, hoàn tất luồng, và lỗi transport ở cấp độ
  `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: bao gồm tóm tắt payload yêu cầu có giới hạn
  trong nhật ký yêu cầu mô hình.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: bao gồm tất cả tên công cụ hướng tới mô hình trong
  tóm tắt payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: bao gồm ảnh chụp payload JSON đã che dữ liệu nhạy cảm và có giới hạn.
  Chỉ dùng khi gỡ lỗi; bí mật được che, nhưng prompt
  và văn bản thông điệp vẫn có thể hiện diện.
- `OPENCLAW_DEBUG_SSE=events`: phát ra thời điểm sự kiện đầu tiên và hoàn tất luồng.
- `OPENCLAW_DEBUG_SSE=peek`: cũng phát ra năm payload sự kiện SSE đầu tiên đã che dữ liệu nhạy cảm,
  giới hạn theo từng sự kiện.
- `OPENCLAW_DEBUG_CODE_MODE=1`: phát ra chẩn đoán bề mặt mô hình ở chế độ mã,
  bao gồm khi công cụ nhà cung cấp gốc bị ẩn vì chế độ mã sở hữu
  bề mặt công cụ.

Các cờ này ghi qua hệ thống ghi nhật ký OpenClaw bình thường, nên `openclaw logs --follow`
và thẻ Logs của Control UI sẽ hiển thị chúng. Nếu không có các cờ này, cùng các chẩn đoán đó
vẫn có sẵn ở cấp độ `debug`.

Siêu dữ liệu bắt đầu và phản hồi `[model-fetch]` (nhà cung cấp, API, mô hình, trạng thái,
độ trễ, và các trường yêu cầu như phương thức, URL, thời gian chờ, proxy, và chính sách)
luôn được phát ra ở cấp độ `info` bất kể
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, nên vệ sinh transport mô hình cơ bản vẫn hiển thị
mà không cần cờ debug.

### Tương quan trace

Nhật ký tệp là JSONL. Khi một lệnh gọi nhật ký mang ngữ cảnh trace chẩn đoán hợp lệ,
OpenClaw ghi các trường trace dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) để bộ xử lý nhật ký bên ngoài có thể tương quan dòng đó
với span OTEL và việc truyền `traceparent` của nhà cung cấp.

Yêu cầu HTTP của Gateway và frame WebSocket của Gateway thiết lập một phạm vi trace yêu cầu
nội bộ. Nhật ký và sự kiện chẩn đoán được phát ra bên trong phạm vi async đó kế thừa
trace yêu cầu khi chúng không truyền ngữ cảnh trace rõ ràng. Trace chạy agent và
lệnh gọi mô hình trở thành con của trace yêu cầu đang hoạt động, nên nhật ký cục bộ,
ảnh chụp chẩn đoán, span OTEL, và header `traceparent` nhà cung cấp đáng tin cậy có thể
được nối bằng `traceId` mà không ghi nội dung yêu cầu hoặc mô hình thô.

Bản ghi nhật ký vòng đời trò chuyện cũng chảy đến xuất nhật ký diagnostics-otel khi
xuất nhật ký OpenTelemetry được bật, dùng cùng các thuộc tính có giới hạn như nhật ký tệp.
Cấu hình `diagnostics.otel.logsExporter` để chọn OTLP, stdout JSONL, hoặc
cả hai đích.

### Kích thước và thời gian lệnh gọi mô hình

Chẩn đoán lệnh gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không
thu thập nội dung prompt hoặc phản hồi thô:

- `requestPayloadBytes`: kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước byte UTF-8 của các payload khối phản hồi mô hình được stream.
  Sự kiện văn bản tần suất cao, thinking, và delta lệnh gọi công cụ chỉ tính
  số byte `delta` tăng thêm thay vì toàn bộ ảnh chụp `partial`.
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi được stream đầu tiên
- `durationMs`: tổng thời lượng lệnh gọi mô hình

Các trường này có sẵn cho ảnh chụp chẩn đoán, hook Plugin lệnh gọi mô hình, và
span/metric lệnh gọi mô hình OTEL khi xuất chẩn đoán được bật.

### Kiểu console

`logging.consoleStyle`:

- `pretty`: thân thiện với con người, có màu, có dấu thời gian.
- `compact`: đầu ra gọn hơn (phù hợp nhất cho phiên dài).
- `json`: JSON mỗi dòng (dành cho bộ xử lý nhật ký).

### Che dữ liệu nhạy cảm

OpenClaw có thể che token nhạy cảm trước khi chúng đi vào đầu ra console, nhật ký tệp,
bản ghi nhật ký OTLP, văn bản bản chép lời phiên được lưu bền, hoặc payload sự kiện công cụ
Control UI (đối số bắt đầu công cụ, payload kết quả một phần/cuối cùng, đầu ra
exec dẫn xuất, và tóm tắt bản vá):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi regex để ghi đè bộ mặc định. Mẫu tùy chỉnh được áp dụng trên các mặc định tích hợp cho payload công cụ Control UI, nên việc thêm một mẫu không bao giờ làm yếu việc che các giá trị đã được mặc định bắt được.

Nhật ký tệp và bản chép lời phiên vẫn là JSONL, nhưng các giá trị bí mật khớp
được che trước khi dòng hoặc thông điệp được ghi xuống đĩa. Việc che dữ liệu nhạy cảm là nỗ lực tốt nhất:
nó áp dụng cho nội dung thông điệp có văn bản và chuỗi nhật ký, không phải mọi
trường định danh hoặc payload nhị phân.

Các mặc định tích hợp bao phủ thông tin xác thực API phổ biến và tên trường thông tin xác thực thanh toán
như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán
khi chúng xuất hiện dưới dạng trường JSON, tham số URL, cờ CLI, hoặc phép gán.

`logging.redactSensitive: "off"` chỉ tắt chính sách nhật ký/bản chép lời chung này.
OpenClaw vẫn che các payload ranh giới an toàn có thể được hiển thị cho client UI,
gói hỗ trợ, quan sát viên chẩn đoán, prompt phê duyệt, hoặc công cụ agent.
Ví dụ bao gồm sự kiện lệnh gọi công cụ Control UI, đầu ra `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket của Gateway. `logging.redactPatterns` tùy chỉnh
vẫn có thể thêm các mẫu riêng của dự án trên các bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, máy đọc được cho các lần chạy mô hình và
telemetry luồng thông điệp (webhook, xếp hàng, trạng thái phiên). Chúng **không**
thay thế nhật ký — chúng cấp dữ liệu cho metric, trace, và exporter. Sự kiện được phát ra
trong tiến trình dù bạn có xuất chúng hay không.

Hai bề mặt liền kề:

- **Xuất OpenTelemetry** — gửi metric, trace, và nhật ký qua OTLP/HTTP đến
  bất kỳ collector hoặc backend tương thích OpenTelemetry nào (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh mục tín hiệu,
  tên metric/span, biến môi trường, và mô hình quyền riêng tư nằm trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký debug có mục tiêu, định tuyến nhật ký bổ sung đến
  `logging.file` mà không tăng `logging.level`. Các cờ không phân biệt chữ hoa/thường
  và hỗ trợ ký tự đại diện (`telegram.*`, `*`). Cấu hình dưới `diagnostics.flags`
  hoặc qua ghi đè môi trường `OPENCLAW_DIAGNOSTICS=...`. Hướng dẫn đầy đủ:
  [Cờ chẩn đoán](/vi/diagnostics/flags).

Để bật sự kiện chẩn đoán cho Plugin hoặc đích tùy chỉnh mà không xuất OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất OTLP sang collector, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo khắc phục sự cố

- **Không truy cập được Gateway?** Chạy `openclaw doctor` trước.
- **Nhật ký trống?** Kiểm tra rằng Gateway đang chạy và ghi vào đường dẫn tệp
  trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục metric/span, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — cờ nhật ký gỡ lỗi có mục tiêu
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con và thu thập console
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ cho trường `diagnostics.*`
