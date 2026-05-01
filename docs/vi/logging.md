---
read_when:
    - Bạn cần một phần tổng quan thân thiện với người mới bắt đầu về ghi nhật ký trong OpenClaw
    - Bạn muốn cấu hình mức độ ghi nhật ký, định dạng hoặc việc ẩn thông tin nhạy cảm
    - Bạn đang khắc phục sự cố và cần nhanh chóng tìm nhật ký
summary: Tệp nhật ký, đầu ra bảng điều khiển, theo dõi bằng CLI, và tab Nhật ký trong Giao diện điều khiển
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-05-01T10:50:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (các dòng JSON) do Gateway ghi.
- **Đầu ra console** hiển thị trong terminal và Gateway Debug UI.

Tab **Logs** của Control UI tail tệp nhật ký Gateway. Trang này giải thích vị trí
lưu nhật ký, cách đọc chúng, và cách cấu hình cấp độ cũng như định dạng nhật ký.

## Vị trí lưu nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký xoay vòng tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày dùng múi giờ cục bộ của máy chủ gateway.

Mỗi tệp xoay vòng khi đạt `logging.maxFileBytes` (mặc định: 100 MB).
OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn
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

### CLI: tail trực tiếp (khuyến nghị)

Dùng CLI để tail tệp nhật ký gateway qua RPC:

```bash
openclaw logs --follow
```

Các tùy chọn hiện hữu hữu ích:

- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn
- `--url <url>` / `--token <token>` / `--timeout <ms>`: các cờ Gateway RPC tiêu chuẩn
- `--expect-final`: cờ chờ phản hồi cuối cùng RPC do tác tử hỗ trợ (được chấp nhận tại đây qua lớp máy khách dùng chung)

Chế độ đầu ra:

- **Phiên TTY**: các dòng nhật ký có cấu trúc, được tô màu, dễ đọc.
- **Phiên không phải TTY**: văn bản thuần.
- `--json`: JSON phân tách theo dòng (một sự kiện nhật ký mỗi dòng).
- `--plain`: buộc dùng văn bản thuần trong phiên TTY.
- `--no-color`: tắt màu ANSI.

Khi bạn truyền `--url` tường minh, CLI không tự động áp dụng cấu hình hoặc
thông tin xác thực từ môi trường; hãy tự thêm `--token` nếu Gateway đích
yêu cầu xác thực.

Ở chế độ JSON, CLI phát ra các đối tượng được gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích
- `notice`: gợi ý cắt ngắn / xoay vòng
- `raw`: dòng nhật ký chưa phân tích

Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong khi kết nối,
hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` tự động chuyển sang
tệp nhật ký Gateway đã cấu hình. Các đích `--url` tường minh không dùng
cơ chế dự phòng này.

Nếu không thể truy cập Gateway, CLI in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** của Control UI tail cùng tệp đó bằng `logs.tail`.
Xem [/web/control-ui](/vi/web/control-ui) để biết cách mở.

### Nhật ký chỉ theo kênh

Để lọc hoạt động kênh (WhatsApp/Telegram/v.v.), hãy dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và Control UI phân tích các
mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ con, thông điệp).

Các bản ghi JSONL của nhật ký tệp cũng bao gồm các trường cấp cao nhất có thể lọc bằng máy khi
có sẵn:

- `hostname`: tên máy chủ gateway.
- `message`: văn bản thông điệp nhật ký đã làm phẳng để tìm kiếm toàn văn.
- `agent_id`: id tác tử đang hoạt động khi lời gọi nhật ký mang ngữ cảnh tác tử.
- `session_id`: id/khóa phiên đang hoạt động khi lời gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lời gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ nguyên các đối số nhật ký có cấu trúc gốc cùng với các trường này
để các trình phân tích hiện có đọc khóa đối số tslog được đánh số vẫn hoạt động.

### Đầu ra console

Nhật ký console **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ con (ví dụ `gateway/channels/whatsapp`)
- Tô màu cấp độ (info/warn/error)
- Chế độ thu gọn hoặc JSON tùy chọn

Định dạng console được điều khiển bởi `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ bình thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích, lời gọi chậm)
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
- `logging.consoleLevel`: mức độ chi tiết của **console**.

Bạn có thể ghi đè cả hai bằng biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường có độ ưu tiên cao hơn tệp cấu hình, nên bạn có thể tăng mức độ chi tiết cho một lần chạy mà không cần sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ, `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra console và mức độ chi tiết của nhật ký WS; nó không thay đổi
cấp độ nhật ký tệp.

### Tương quan dấu vết

Nhật ký tệp là JSONL. Khi một lời gọi nhật ký mang ngữ cảnh dấu vết chẩn đoán hợp lệ,
OpenClaw ghi các trường dấu vết dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) để các bộ xử lý nhật ký bên ngoài có thể tương quan dòng đó
với các span OTEL và lan truyền `traceparent` của nhà cung cấp.

Các yêu cầu HTTP Gateway và khung WebSocket Gateway thiết lập một phạm vi dấu vết yêu cầu
nội bộ. Nhật ký và sự kiện chẩn đoán được phát ra bên trong phạm vi bất đồng bộ đó kế thừa
dấu vết yêu cầu khi chúng không truyền ngữ cảnh dấu vết tường minh. Dấu vết chạy tác tử và
lời gọi mô hình trở thành con của dấu vết yêu cầu đang hoạt động, nên nhật ký cục bộ,
ảnh chụp chẩn đoán, span OTEL, và header `traceparent` của nhà cung cấp đáng tin cậy có thể
được nối bằng `traceId` mà không ghi nhật ký nội dung yêu cầu hoặc mô hình thô.

### Kích thước và thời gian lời gọi mô hình

Chẩn đoán lời gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không
thu thập nội dung prompt hoặc phản hồi thô:

- `requestPayloadBytes`: kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước byte UTF-8 của các sự kiện phản hồi mô hình dạng stream
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi dạng stream đầu tiên
- `durationMs`: tổng thời lượng lời gọi mô hình

Các trường này khả dụng cho ảnh chụp chẩn đoán, hook Plugin lời gọi mô hình, và
span/chỉ số lời gọi mô hình OTEL khi xuất chẩn đoán được bật.

### Kiểu console

`logging.consoleStyle`:

- `pretty`: thân thiện với con người, có màu, có dấu thời gian.
- `compact`: đầu ra gọn hơn (phù hợp nhất cho phiên dài).
- `json`: JSON mỗi dòng (cho bộ xử lý nhật ký).

### Biên tập thông tin nhạy cảm

OpenClaw có thể biên tập token nhạy cảm trước khi chúng đi vào đầu ra console, nhật ký tệp,
bản ghi nhật ký OTLP, văn bản transcript phiên được lưu, hoặc payload sự kiện công cụ
Control UI (đối số bắt đầu công cụ, payload kết quả một phần/cuối cùng, đầu ra exec
dẫn xuất, và tóm tắt bản vá):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi regex để ghi đè tập mặc định. Mẫu tùy chỉnh áp dụng chồng lên các mặc định tích hợp cho payload công cụ Control UI, vì vậy việc thêm một mẫu không bao giờ làm yếu biên tập các giá trị đã được mặc định bắt được.

Nhật ký tệp và transcript phiên vẫn là JSONL, nhưng các giá trị bí mật khớp
được che trước khi dòng hoặc thông điệp được ghi ra đĩa. Biên tập là nỗ lực tối đa:
nó áp dụng cho nội dung thông điệp chứa văn bản và chuỗi nhật ký, không phải mọi
trường định danh hoặc payload nhị phân.

Các mặc định tích hợp bao phủ thông tin xác thực API phổ biến và tên trường thông tin xác thực thanh toán
như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán
khi chúng xuất hiện dưới dạng trường JSON, tham số URL, cờ CLI, hoặc phép gán.

`logging.redactSensitive: "off"` chỉ tắt chính sách chung cho nhật ký/transcript
này. OpenClaw vẫn biên tập các payload ranh giới an toàn có thể được hiển thị cho máy khách
UI, gói hỗ trợ, trình quan sát chẩn đoán, prompt phê duyệt, hoặc công cụ tác tử.
Ví dụ bao gồm sự kiện lời gọi công cụ Control UI, đầu ra `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket Gateway. `logging.redactPatterns` tùy chỉnh
vẫn có thể thêm các mẫu riêng cho dự án trên các bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, máy đọc được cho các lần chạy mô hình và
đo từ xa luồng thông điệp (webhook, xếp hàng, trạng thái phiên). Chúng **không**
thay thế nhật ký — chúng cấp dữ liệu cho chỉ số, dấu vết, và trình xuất. Sự kiện được phát ra
trong tiến trình dù bạn có xuất chúng hay không.

Hai bề mặt liền kề:

- **Xuất OpenTelemetry** — gửi chỉ số, dấu vết, và nhật ký qua OTLP/HTTP đến
  bất kỳ bộ thu thập hoặc backend tương thích OpenTelemetry nào (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh mục tín hiệu,
  tên chỉ số/span, biến môi trường, và mô hình quyền riêng tư nằm trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký gỡ lỗi mục tiêu định tuyến nhật ký bổ sung đến
  `logging.file` mà không tăng `logging.level`. Cờ không phân biệt hoa thường
  và hỗ trợ ký tự đại diện (`telegram.*`, `*`). Cấu hình dưới `diagnostics.flags`
  hoặc qua ghi đè env `OPENCLAW_DIAGNOSTICS=...`. Hướng dẫn đầy đủ:
  [Cờ chẩn đoán](/vi/diagnostics/flags).

Để bật sự kiện chẩn đoán cho plugin hoặc sink tùy chỉnh mà không xuất OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất OTLP đến bộ thu thập, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo xử lý sự cố

- **Không truy cập được Gateway?** Chạy `openclaw doctor` trước.
- **Nhật ký trống?** Kiểm tra rằng Gateway đang chạy và ghi vào đường dẫn tệp
  trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục chỉ số/span, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — các cờ nhật ký gỡ lỗi mục tiêu
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ con, và thu thập console
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ các trường `diagnostics.*`
