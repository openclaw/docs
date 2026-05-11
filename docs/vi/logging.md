---
read_when:
    - Bạn cần một phần tổng quan dễ hiểu cho người mới bắt đầu về ghi nhật ký của OpenClaw
    - Bạn muốn cấu hình cấp độ nhật ký, định dạng hoặc cơ chế che thông tin nhạy cảm
    - Bạn đang khắc phục sự cố và cần nhanh chóng tìm nhật ký
summary: Nhật ký tệp, đầu ra console, theo dõi CLI và thẻ Nhật ký của UI điều khiển
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-05-11T20:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (các dòng JSON) được Gateway ghi.
- **Đầu ra console** hiển thị trong terminal và Giao diện gỡ lỗi Gateway.

Tab **Nhật ký** của Giao diện Control theo dõi nhật ký tệp của Gateway. Trang này giải thích nơi
lưu nhật ký, cách đọc nhật ký, và cách cấu hình cấp độ cũng như định dạng nhật ký.

## Nơi lưu nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký xoay vòng tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày sử dụng múi giờ cục bộ của máy chủ gateway.

Mỗi tệp xoay vòng khi đạt `logging.maxFileBytes` (mặc định: 100 MB).
OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn như
`openclaw-YYYY-MM-DD.1.log`, và tiếp tục ghi vào một nhật ký hoạt động mới thay vì
chặn thông tin chẩn đoán.

Bạn có thể ghi đè cấu hình này trong `~/.openclaw/openclaw.json`:

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

Các tùy chọn hiện hữu ích:

- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn
- `--url <url>` / `--token <token>` / `--timeout <ms>`: các cờ Gateway RPC tiêu chuẩn
- `--expect-final`: cờ chờ phản hồi cuối của RPC có agent hỗ trợ (được chấp nhận ở đây qua lớp client dùng chung)

Chế độ đầu ra:

- **Phiên TTY**: các dòng nhật ký có cấu trúc, đẹp mắt và có màu.
- **Phiên không phải TTY**: văn bản thuần.
- `--json`: JSON phân tách theo dòng (mỗi dòng một sự kiện nhật ký).
- `--plain`: buộc văn bản thuần trong phiên TTY.
- `--no-color`: tắt màu ANSI.

Khi bạn truyền `--url` tường minh, CLI không tự động áp dụng thông tin xác thực từ cấu hình hoặc
môi trường; hãy tự thêm `--token` nếu Gateway mục tiêu
yêu cầu xác thực.

Ở chế độ JSON, CLI phát ra các đối tượng có gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích
- `notice`: gợi ý về cắt bớt / xoay vòng
- `raw`: dòng nhật ký chưa phân tích

Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong lúc kết nối,
hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` sẽ tự động dự phòng sang
nhật ký tệp Gateway đã cấu hình. Các mục tiêu `--url` tường minh không dùng
cơ chế dự phòng này.

Nếu không thể truy cập Gateway, CLI in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Giao diện Control (web)

Tab **Nhật ký** của Giao diện Control theo dõi cùng tệp bằng `logs.tail`.
Xem [Giao diện Control](/vi/web/control-ui) để biết cách mở.

### Nhật ký chỉ dành cho kênh

Để lọc hoạt động kênh (WhatsApp/Telegram/v.v.), dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và Giao diện Control phân tích các
mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ thống con, thông báo).

Bản ghi JSONL của nhật ký tệp cũng bao gồm các trường cấp cao nhất có thể lọc bằng máy khi
có sẵn:

- `hostname`: tên máy chủ gateway.
- `message`: văn bản thông báo nhật ký đã làm phẳng để tìm kiếm toàn văn.
- `agent_id`: id agent đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh agent.
- `session_id`: id/khóa phiên đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ nguyên các đối số nhật ký có cấu trúc ban đầu bên cạnh những trường này
để các trình phân tích cú pháp hiện có đọc khóa đối số tslog được đánh số vẫn hoạt động.

Hoạt động trò chuyện, giọng nói thời gian thực và phòng được quản lý phát ra các bản ghi nhật ký
vòng đời có giới hạn thông qua cùng pipeline nhật ký tệp này. Các bản ghi này bao gồm loại sự kiện,
chế độ, transport, provider, và các phép đo kích thước/thời gian khi có sẵn, nhưng bỏ qua
văn bản transcript, payload âm thanh, id lượt, id cuộc gọi, và id mục provider.

### Đầu ra console

Nhật ký console **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ thống con (ví dụ `gateway/channels/whatsapp`)
- Tô màu cấp độ (info/warn/error)
- Chế độ compact hoặc JSON tùy chọn

Định dạng console được kiểm soát bởi `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ bình thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích cú pháp, lệnh gọi chậm)
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

Bạn có thể ghi đè cả hai bằng biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường được ưu tiên hơn tệp cấu hình, nên bạn có thể tăng mức chi tiết cho một lần chạy mà không cần sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ, `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra console và mức chi tiết nhật ký WS; nó không thay đổi
cấp độ nhật ký tệp.

### Chẩn đoán transport mô hình có mục tiêu

Khi gỡ lỗi các lệnh gọi provider, dùng các cờ môi trường có mục tiêu thay vì nâng
toàn bộ nhật ký lên `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Các cờ có sẵn:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: phát ra bắt đầu yêu cầu, phản hồi fetch, header
  SDK, sự kiện streaming đầu tiên, hoàn tất luồng, và lỗi transport ở
  cấp `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: bao gồm bản tóm tắt payload yêu cầu có giới hạn
  trong nhật ký yêu cầu mô hình.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: bao gồm tất cả tên công cụ hướng tới mô hình trong
  phần tóm tắt payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: bao gồm ảnh chụp payload JSON đã biên tập và
  giới hạn kích thước. Chỉ dùng khi gỡ lỗi; bí mật được biên tập nhưng prompt
  và văn bản tin nhắn vẫn có thể hiện diện.
- `OPENCLAW_DEBUG_SSE=events`: phát ra thời gian của sự kiện đầu tiên và hoàn tất luồng.
- `OPENCLAW_DEBUG_SSE=peek`: cũng phát ra năm payload sự kiện SSE đầu tiên đã biên tập,
  có giới hạn cho mỗi sự kiện.
- `OPENCLAW_DEBUG_CODE_MODE=1`: phát ra chẩn đoán bề mặt mô hình của chế độ code,
  bao gồm khi các công cụ provider gốc bị ẩn vì chế độ code sở hữu
  bề mặt công cụ.

Các cờ này ghi nhật ký qua cơ chế ghi nhật ký OpenClaw bình thường, nên `openclaw logs --follow`
và tab Nhật ký của Giao diện Control sẽ hiển thị chúng. Nếu không có các cờ này, cùng các chẩn đoán
vẫn có sẵn ở cấp `debug`.

### Tương quan trace

Nhật ký tệp là JSONL. Khi một lệnh gọi nhật ký mang ngữ cảnh trace chẩn đoán hợp lệ,
OpenClaw ghi các trường trace dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) để các bộ xử lý nhật ký bên ngoài có thể tương quan dòng đó
với span OTEL và lan truyền `traceparent` của provider.

Yêu cầu HTTP Gateway và khung Gateway WebSocket thiết lập phạm vi trace yêu cầu nội bộ.
Nhật ký và sự kiện chẩn đoán phát ra bên trong phạm vi async đó kế thừa
trace yêu cầu khi chúng không truyền ngữ cảnh trace tường minh. Trace chạy agent và
lệnh gọi mô hình trở thành con của trace yêu cầu đang hoạt động, nên nhật ký cục bộ,
ảnh chụp chẩn đoán, span OTEL, và header `traceparent` của provider đáng tin cậy có thể
được nối bằng `traceId` mà không ghi nội dung yêu cầu thô hoặc nội dung mô hình.

Bản ghi nhật ký vòng đời trò chuyện cũng chảy tới nhật ký OTLP khi bật xuất nhật ký OpenTelemetry,
dùng cùng các thuộc tính có giới hạn như nhật ký tệp.

### Kích thước và thời gian lệnh gọi mô hình

Chẩn đoán lệnh gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không
thu thập prompt thô hoặc nội dung phản hồi:

- `requestPayloadBytes`: kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước byte UTF-8 của các sự kiện phản hồi mô hình được stream
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi được stream đầu tiên
- `durationMs`: tổng thời lượng lệnh gọi mô hình

Các trường này có sẵn cho ảnh chụp chẩn đoán, hook Plugin lệnh gọi mô hình, và
span/metric lệnh gọi mô hình OTEL khi bật xuất chẩn đoán.

### Kiểu console

`logging.consoleStyle`:

- `pretty`: thân thiện với người dùng, có màu, có dấu thời gian.
- `compact`: đầu ra gọn hơn (phù hợp nhất cho phiên dài).
- `json`: JSON mỗi dòng (dành cho bộ xử lý nhật ký).

### Biên tập dữ liệu nhạy cảm

OpenClaw có thể biên tập token nhạy cảm trước khi chúng đi vào đầu ra console, nhật ký tệp,
bản ghi nhật ký OTLP, văn bản transcript phiên được lưu, hoặc payload sự kiện công cụ của
Giao diện Control (đối số khởi động công cụ, payload kết quả một phần/cuối cùng, đầu ra
exec dẫn xuất, và tóm tắt patch):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi regex để ghi đè tập mặc định. Mẫu tùy chỉnh áp dụng bên trên các mặc định tích hợp sẵn cho payload công cụ của Giao diện Control, nên thêm một mẫu sẽ không bao giờ làm yếu việc biên tập các giá trị đã được mặc định bắt được.

Nhật ký tệp và transcript phiên vẫn là JSONL, nhưng các giá trị bí mật khớp mẫu được
che trước khi dòng hoặc thông báo được ghi xuống đĩa. Biên tập dữ liệu nhạy cảm là nỗ lực tốt nhất:
nó áp dụng cho nội dung tin nhắn mang văn bản và chuỗi nhật ký, không phải mọi
định danh hoặc trường payload nhị phân.

Các mặc định tích hợp bao phủ thông tin xác thực API phổ biến và tên trường thông tin xác thực thanh toán
như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán
khi chúng xuất hiện dưới dạng trường JSON, tham số URL, cờ CLI, hoặc phép gán.

`logging.redactSensitive: "off"` chỉ tắt chính sách nhật ký/transcript chung này.
OpenClaw vẫn biên tập các payload ranh giới an toàn có thể được hiển thị cho client UI,
gói hỗ trợ, trình quan sát chẩn đoán, prompt phê duyệt, hoặc công cụ agent.
Ví dụ gồm sự kiện gọi công cụ của Giao diện Control, đầu ra `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi provider, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức Gateway WebSocket. `logging.redactPatterns` tùy chỉnh
vẫn có thể thêm các mẫu riêng cho dự án trên các bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, máy có thể đọc được cho lần chạy mô hình và
telemetry luồng tin nhắn (Webhook, xếp hàng, trạng thái phiên). Chúng **không**
thay thế nhật ký — chúng cấp dữ liệu cho metric, trace và exporter. Sự kiện được phát ra
trong tiến trình dù bạn có xuất chúng hay không.

Hai bề mặt liền kề:

- **Xuất OpenTelemetry** — gửi metric, trace, và nhật ký qua OTLP/HTTP tới
  bất kỳ collector hoặc backend tương thích OpenTelemetry nào (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh mục tín hiệu,
  tên metric/span, biến môi trường, và mô hình quyền riêng tư nằm trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký gỡ lỗi có mục tiêu, định tuyến nhật ký bổ sung tới
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

Để xuất OTLP tới collector, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo khắc phục sự cố

- **Không thể truy cập Gateway?** Trước tiên hãy chạy `openclaw doctor`.
- **Nhật ký trống?** Kiểm tra Gateway đang chạy và đang ghi vào đường dẫn tệp
  trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục metric/span, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — cờ nhật ký gỡ lỗi có mục tiêu
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con, và thu thập console
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ trường `diagnostics.*`
