---
read_when:
    - Bạn cần một phần tổng quan thân thiện với người mới bắt đầu về việc ghi nhật ký của OpenClaw
    - Bạn muốn cấu hình cấp độ nhật ký, định dạng hoặc ẩn dữ liệu nhạy cảm
    - Bạn đang khắc phục sự cố và cần nhanh chóng tìm nhật ký
summary: Nhật ký tệp, đầu ra bảng điều khiển, theo dõi qua CLI và thẻ Nhật ký của Giao diện điều khiển
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-04-29T22:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (dòng JSON) do Gateway ghi.
- **Đầu ra bảng điều khiển** hiển thị trong terminal và Giao diện gỡ lỗi Gateway.

Thẻ **Nhật ký** của Giao diện điều khiển theo dõi nhật ký tệp của Gateway. Trang này giải thích nơi
lưu nhật ký, cách đọc chúng, và cách cấu hình cấp độ cũng như định dạng nhật ký.

## Nơi lưu nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký xoay vòng tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày sử dụng múi giờ cục bộ của máy chủ gateway.

Mỗi tệp được xoay vòng khi đạt `logging.maxFileBytes` (mặc định: 100 MB).
OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn như
`openclaw-YYYY-MM-DD.1.log`, và tiếp tục ghi vào một nhật ký hoạt động mới thay vì
chặn thông tin chẩn đoán.

Bạn có thể ghi đè thiết lập này trong `~/.openclaw/openclaw.json`:

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
- `--url <url>` / `--token <token>` / `--timeout <ms>`: các cờ RPC Gateway chuẩn
- `--expect-final`: cờ chờ phản hồi cuối cùng của RPC do tác tử hỗ trợ (được chấp nhận ở đây qua lớp máy khách dùng chung)

Chế độ đầu ra:

- **Phiên TTY**: các dòng nhật ký đẹp, có màu, có cấu trúc.
- **Phiên không phải TTY**: văn bản thuần.
- `--json`: JSON phân tách theo dòng (mỗi sự kiện nhật ký một dòng).
- `--plain`: buộc dùng văn bản thuần trong phiên TTY.
- `--no-color`: tắt màu ANSI.

Khi bạn truyền `--url` rõ ràng, CLI không tự động áp dụng cấu hình hoặc
thông tin xác thực từ môi trường; hãy tự thêm `--token` nếu Gateway đích
yêu cầu xác thực.

Ở chế độ JSON, CLI phát ra các đối tượng được gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích
- `notice`: gợi ý cắt ngắn / xoay vòng
- `raw`: dòng nhật ký chưa phân tích

Nếu Gateway local loopback ngầm định yêu cầu ghép nối, đóng trong khi kết nối,
hoặc hết thời gian trước khi `logs.tail` trả lời, `openclaw logs` sẽ tự động dự phòng sang
nhật ký tệp Gateway đã cấu hình. Các đích `--url` rõ ràng không sử dụng
cơ chế dự phòng này.

Nếu không thể truy cập Gateway, CLI sẽ in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Giao diện điều khiển (web)

Thẻ **Nhật ký** của Giao diện điều khiển theo dõi cùng tệp bằng `logs.tail`.
Xem [/web/control-ui](/vi/web/control-ui) để biết cách mở.

### Nhật ký chỉ theo kênh

Để lọc hoạt động kênh (WhatsApp/Telegram/v.v.), dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và Giao diện điều khiển phân tích các
mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ con, thông điệp).

Các bản ghi JSONL của nhật ký tệp cũng bao gồm các trường cấp cao nhất có thể lọc bằng máy khi
có sẵn:

- `hostname`: tên máy chủ gateway.
- `message`: văn bản thông điệp nhật ký đã làm phẳng để tìm kiếm toàn văn.
- `agent_id`: id tác tử đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh tác tử.
- `session_id`: id/khóa phiên đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ nguyên các đối số nhật ký có cấu trúc ban đầu bên cạnh những trường này
để các trình phân tích hiện có đọc khóa đối số tslog được đánh số vẫn tiếp tục hoạt động.

### Đầu ra bảng điều khiển

Nhật ký bảng điều khiển **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ con (ví dụ: `gateway/channels/whatsapp`)
- Tô màu cấp độ (info/warn/error)
- Chế độ gọn hoặc JSON tùy chọn

Định dạng bảng điều khiển được điều khiển bởi `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ bình thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích, lệnh gọi chậm)
- `--verbose`: toàn bộ lưu lượng yêu cầu/phản hồi
- `--ws-log auto|compact|full`: chọn kiểu hiển thị chi tiết
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
- `logging.consoleLevel`: cấp độ chi tiết của **bảng điều khiển**.

Bạn có thể ghi đè cả hai bằng biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ: `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường được ưu tiên hơn tệp cấu hình, nên bạn có thể tăng độ chi tiết cho một lần chạy mà không cần sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ: `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra bảng điều khiển và độ chi tiết nhật ký WS; nó không thay đổi
cấp độ nhật ký tệp.

### Tương quan dấu vết

Nhật ký tệp là JSONL. Khi một lệnh gọi nhật ký mang ngữ cảnh dấu vết chẩn đoán hợp lệ,
OpenClaw ghi các trường dấu vết dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) để các bộ xử lý nhật ký bên ngoài có thể tương quan dòng đó
với các span OTEL và truyền lan `traceparent` của nhà cung cấp.

Các yêu cầu HTTP Gateway và khung WebSocket Gateway thiết lập một phạm vi dấu vết yêu cầu
nội bộ. Nhật ký và sự kiện chẩn đoán được phát ra bên trong phạm vi bất đồng bộ đó sẽ kế thừa
dấu vết yêu cầu khi chúng không truyền ngữ cảnh dấu vết rõ ràng. Dấu vết chạy tác tử và
lệnh gọi mô hình trở thành con của dấu vết yêu cầu đang hoạt động, nhờ đó nhật ký cục bộ,
ảnh chụp chẩn đoán, span OTEL, và tiêu đề `traceparent` đáng tin cậy của nhà cung cấp có thể
được ghép bằng `traceId` mà không ghi nhật ký nội dung yêu cầu thô hoặc nội dung mô hình.

### Kích thước và thời gian lệnh gọi mô hình

Chẩn đoán lệnh gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không
thu thập nội dung prompt hoặc phản hồi thô:

- `requestPayloadBytes`: kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước byte UTF-8 của các sự kiện phản hồi mô hình được truyền luồng
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi truyền luồng đầu tiên
- `durationMs`: tổng thời lượng lệnh gọi mô hình

Các trường này có sẵn cho ảnh chụp chẩn đoán, hook Plugin lệnh gọi mô hình, và
span/chỉ số lệnh gọi mô hình OTEL khi xuất chẩn đoán được bật.

### Kiểu bảng điều khiển

`logging.consoleStyle`:

- `pretty`: thân thiện với con người, có màu, có dấu thời gian.
- `compact`: đầu ra gọn hơn (phù hợp nhất cho phiên dài).
- `json`: JSON mỗi dòng (cho bộ xử lý nhật ký).

### Che giấu dữ liệu nhạy cảm

OpenClaw có thể che giấu token nhạy cảm trước khi chúng đi vào đầu ra bảng điều khiển, nhật ký tệp,
bản ghi nhật ký OTLP, văn bản bản ghi phiên được lưu bền, hoặc payload sự kiện công cụ của Giao diện điều khiển
(đối số bắt đầu công cụ, payload kết quả một phần/cuối cùng, đầu ra exec dẫn xuất, và tóm tắt bản vá):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi regex để ghi đè tập mặc định. Mẫu tùy chỉnh được áp dụng trên các mặc định tích hợp cho payload công cụ của Giao diện điều khiển, vì vậy việc thêm một mẫu không bao giờ làm yếu việc che giấu các giá trị đã được mặc định bắt được.

Nhật ký tệp và bản ghi phiên vẫn ở dạng JSONL, nhưng các giá trị bí mật khớp
sẽ được che trước khi dòng hoặc thông điệp được ghi vào đĩa. Việc che giấu là nỗ lực tối đa:
nó áp dụng cho nội dung thông điệp có văn bản và chuỗi nhật ký, không phải mọi
định danh hoặc trường payload nhị phân.

`logging.redactSensitive: "off"` chỉ tắt chính sách nhật ký/bản ghi chung này.
OpenClaw vẫn che giấu các payload thuộc ranh giới an toàn có thể được hiển thị cho máy khách UI,
gói hỗ trợ, trình quan sát chẩn đoán, prompt phê duyệt, hoặc công cụ tác tử.
Ví dụ bao gồm sự kiện lệnh gọi công cụ của Giao diện điều khiển, đầu ra `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket Gateway. `logging.redactPatterns` tùy chỉnh
vẫn có thể thêm các mẫu riêng cho dự án trên những bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, máy đọc được cho lượt chạy mô hình và
đo từ xa luồng thông điệp (webhook, xếp hàng, trạng thái phiên). Chúng **không**
thay thế nhật ký — chúng cung cấp dữ liệu cho chỉ số, dấu vết, và bộ xuất. Sự kiện được phát ra
trong tiến trình dù bạn có xuất chúng hay không.

Hai bề mặt liền kề:

- **Xuất OpenTelemetry** — gửi chỉ số, dấu vết, và nhật ký qua OTLP/HTTP đến
  bất kỳ collector hoặc backend tương thích OpenTelemetry nào (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh mục tín hiệu,
  tên chỉ số/span, biến môi trường, và mô hình quyền riêng tư nằm trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký gỡ lỗi có mục tiêu định tuyến nhật ký bổ sung đến
  `logging.file` mà không tăng `logging.level`. Cờ không phân biệt chữ hoa chữ thường
  và hỗ trợ ký tự đại diện (`telegram.*`, `*`). Cấu hình dưới `diagnostics.flags`
  hoặc qua ghi đè môi trường `OPENCLAW_DIAGNOSTICS=...`. Hướng dẫn đầy đủ:
  [Cờ chẩn đoán](/vi/diagnostics/flags).

Để bật sự kiện chẩn đoán cho Plugin hoặc sink tùy chỉnh mà không xuất OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất OTLP đến collector, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo khắc phục sự cố

- **Không truy cập được Gateway?** Chạy `openclaw doctor` trước.
- **Nhật ký trống?** Kiểm tra rằng Gateway đang chạy và đang ghi vào đường dẫn tệp
  trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục chỉ số/span, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — các cờ nhật ký gỡ lỗi có mục tiêu
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ con, và thu thập bảng điều khiển
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ trường `diagnostics.*`
