---
read_when:
    - Bạn cần một phần tổng quan dễ hiểu cho người mới bắt đầu về tính năng ghi nhật ký của OpenClaw
    - Bạn muốn cấu hình mức nhật ký, định dạng hoặc tính năng che giấu thông tin nhạy cảm
    - Bạn đang khắc phục sự cố và cần nhanh chóng tìm nhật ký
summary: Nhật ký tệp, đầu ra bảng điều khiển, theo dõi nhật ký qua CLI và tab Nhật ký của Control UI
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-05-06T10:57:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (dòng JSON) do Gateway ghi.
- **Đầu ra bảng điều khiển** hiển thị trong terminal và Gateway Debug UI.

Thẻ **Nhật ký** của Control UI theo dõi phần cuối nhật ký tệp của gateway. Trang này giải thích nhật ký nằm ở đâu, cách đọc chúng, cũng như cách cấu hình cấp độ và định dạng nhật ký.

## Nơi lưu nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký xoay vòng tại:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày sử dụng múi giờ cục bộ của máy chủ gateway.

Mỗi tệp xoay vòng khi đạt `logging.maxFileBytes` (mặc định: 100 MB). OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn như `openclaw-YYYY-MM-DD.1.log`, và tiếp tục ghi vào một nhật ký hoạt động mới thay vì chặn thông tin chẩn đoán.

Bạn có thể ghi đè cấu hình này trong `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cách đọc nhật ký

### CLI: theo dõi trực tiếp phần cuối (khuyến nghị)

Dùng CLI để theo dõi phần cuối tệp nhật ký gateway qua RPC:

```bash
openclaw logs --follow
```

Các tùy chọn hiện có hữu ích:

- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn
- `--url <url>` / `--token <token>` / `--timeout <ms>`: các cờ Gateway RPC tiêu chuẩn
- `--expect-final`: cờ chờ phản hồi cuối của RPC dựa trên tác tử (được chấp nhận ở đây qua lớp máy khách dùng chung)

Chế độ đầu ra:

- **Phiên TTY**: dòng nhật ký có cấu trúc, đẹp, có màu.
- **Phiên không phải TTY**: văn bản thuần.
- `--json`: JSON phân tách theo dòng (một sự kiện nhật ký trên mỗi dòng).
- `--plain`: buộc dùng văn bản thuần trong phiên TTY.
- `--no-color`: tắt màu ANSI.

Khi bạn truyền `--url` rõ ràng, CLI không tự động áp dụng thông tin đăng nhập từ cấu hình hoặc môi trường; hãy tự thêm `--token` nếu Gateway đích yêu cầu xác thực.

Ở chế độ JSON, CLI phát ra các đối tượng được gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích cú pháp
- `notice`: gợi ý về cắt bớt / xoay vòng
- `raw`: dòng nhật ký chưa phân tích cú pháp

Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong khi kết nối, hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` tự động quay về nhật ký tệp Gateway đã cấu hình. Các đích `--url` rõ ràng không dùng cơ chế dự phòng này.

Nếu không thể truy cập Gateway, CLI in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Control UI (web)

Thẻ **Nhật ký** của Control UI theo dõi cùng tệp bằng `logs.tail`. Xem [Control UI](/vi/web/control-ui) để biết cách mở.

### Nhật ký chỉ theo kênh

Để lọc hoạt động kênh (WhatsApp/Telegram/v.v.), dùng:

```bash
openclaw channels logs --channel whatsapp
```

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và Control UI phân tích các mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ thống con, thông báo).

Các bản ghi JSONL của nhật ký tệp cũng bao gồm các trường cấp cao nhất có thể lọc bằng máy khi có sẵn:

- `hostname`: tên máy chủ gateway.
- `message`: văn bản thông báo nhật ký đã làm phẳng để tìm kiếm toàn văn.
- `agent_id`: id tác tử đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh tác tử.
- `session_id`: id/khóa phiên đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ lại các đối số nhật ký có cấu trúc ban đầu bên cạnh các trường này để các trình phân tích cú pháp hiện có đọc khóa đối số tslog được đánh số vẫn tiếp tục hoạt động.

Hoạt động trò chuyện, giọng nói thời gian thực và phòng được quản lý phát ra các bản ghi nhật ký vòng đời có giới hạn qua cùng pipeline nhật ký tệp này. Các bản ghi này bao gồm loại sự kiện, chế độ, phương tiện truyền tải, nhà cung cấp và các phép đo kích thước/thời gian khi có sẵn, nhưng bỏ qua văn bản bản chép lời, payload âm thanh, id lượt, id cuộc gọi và id mục nhà cung cấp.

### Đầu ra bảng điều khiển

Nhật ký bảng điều khiển **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ thống con (ví dụ `gateway/channels/whatsapp`)
- Tô màu cấp độ (info/warn/error)
- Chế độ compact hoặc JSON tùy chọn

Định dạng bảng điều khiển được kiểm soát bởi `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ bình thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích cú pháp, lệnh gọi chậm)
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

Toàn bộ cấu hình ghi nhật ký nằm trong `logging` tại `~/.openclaw/openclaw.json`.

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

Bạn có thể ghi đè cả hai qua biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường được ưu tiên hơn tệp cấu hình, vì vậy bạn có thể tăng độ chi tiết cho một lần chạy mà không cần chỉnh sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra bảng điều khiển và độ chi tiết nhật ký WS; nó không thay đổi cấp độ nhật ký tệp.

### Tương quan vết

Nhật ký tệp là JSONL. Khi một lệnh gọi nhật ký mang ngữ cảnh vết chẩn đoán hợp lệ, OpenClaw ghi các trường vết dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) để bộ xử lý nhật ký bên ngoài có thể tương quan dòng đó với OTEL span và việc lan truyền `traceparent` của nhà cung cấp.

Yêu cầu HTTP Gateway và khung WebSocket Gateway thiết lập một phạm vi vết yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán được phát ra bên trong phạm vi bất đồng bộ đó kế thừa vết yêu cầu khi chúng không truyền ngữ cảnh vết rõ ràng. Vết chạy tác tử và lệnh gọi mô hình trở thành con của vết yêu cầu đang hoạt động, vì vậy nhật ký cục bộ, ảnh chụp chẩn đoán, OTEL span và header `traceparent` nhà cung cấp đáng tin cậy có thể được nối bằng `traceId` mà không ghi nhật ký nội dung yêu cầu hoặc mô hình thô.

Các bản ghi nhật ký vòng đời trò chuyện cũng chảy đến nhật ký OTLP khi bật xuất nhật ký OpenTelemetry, dùng cùng các thuộc tính có giới hạn như nhật ký tệp.

### Kích thước và thời gian lệnh gọi mô hình

Chẩn đoán lệnh gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không thu thập nội dung prompt hoặc phản hồi thô:

- `requestPayloadBytes`: kích thước byte UTF-8 của payload yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước byte UTF-8 của các sự kiện phản hồi mô hình được stream
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi được stream đầu tiên
- `durationMs`: tổng thời lượng lệnh gọi mô hình

Các trường này có sẵn cho ảnh chụp chẩn đoán, hook Plugin lệnh gọi mô hình, và OTEL span/chỉ số lệnh gọi mô hình khi bật xuất chẩn đoán.

### Kiểu bảng điều khiển

`logging.consoleStyle`:

- `pretty`: thân thiện với con người, có màu, có dấu thời gian.
- `compact`: đầu ra gọn hơn (tốt nhất cho phiên dài).
- `json`: JSON trên mỗi dòng (cho bộ xử lý nhật ký).

### Biên tập ẩn

OpenClaw có thể biên tập ẩn token nhạy cảm trước khi chúng xuất hiện trong đầu ra bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP, văn bản bản chép lời phiên được lưu bền, hoặc payload sự kiện công cụ của Control UI (đối số bắt đầu công cụ, payload kết quả từng phần/cuối cùng, đầu ra exec dẫn xuất và tóm tắt bản vá):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi regex để ghi đè bộ mặc định. Mẫu tùy chỉnh được áp dụng bên trên các mặc định tích hợp cho payload công cụ Control UI, vì vậy thêm một mẫu sẽ không bao giờ làm yếu việc biên tập ẩn các giá trị đã được mặc định bắt được.

Nhật ký tệp và bản chép lời phiên vẫn là JSONL, nhưng các giá trị bí mật khớp mẫu được che trước khi dòng hoặc thông báo được ghi ra đĩa. Biên tập ẩn là nỗ lực tối đa: nó áp dụng cho nội dung thông báo có văn bản và chuỗi nhật ký, không phải mọi trường định danh hoặc payload nhị phân.

Các mặc định tích hợp bao phủ thông tin xác thực API phổ biến và tên trường thông tin xác thực thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung và thông tin xác thực thanh toán khi chúng xuất hiện dưới dạng trường JSON, tham số URL, cờ CLI hoặc phép gán.

`logging.redactSensitive: "off"` chỉ tắt chính sách nhật ký/bản chép lời chung này. OpenClaw vẫn biên tập ẩn các payload ranh giới an toàn có thể được hiển thị cho máy khách UI, gói hỗ trợ, trình quan sát chẩn đoán, prompt phê duyệt hoặc công cụ tác tử. Ví dụ bao gồm sự kiện lệnh gọi công cụ của Control UI, đầu ra `sessions_history`, bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec và nhật ký giao thức WebSocket Gateway. `logging.redactPatterns` tùy chỉnh vẫn có thể thêm các mẫu riêng của dự án trên những bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, máy có thể đọc được cho các lượt chạy mô hình và đo từ xa luồng thông báo (webhook, xếp hàng, trạng thái phiên). Chúng **không** thay thế nhật ký — chúng cung cấp dữ liệu cho chỉ số, vết và trình xuất. Sự kiện được phát ra trong tiến trình dù bạn có xuất chúng hay không.

Hai bề mặt liền kề:

- **Xuất OpenTelemetry** — gửi chỉ số, vết và nhật ký qua OTLP/HTTP đến bất kỳ bộ thu thập hoặc backend tương thích OpenTelemetry nào (Grafana, Datadog, Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh mục tín hiệu, tên chỉ số/span, biến môi trường và mô hình quyền riêng tư nằm trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký gỡ lỗi nhắm mục tiêu định tuyến nhật ký bổ sung đến `logging.file` mà không tăng `logging.level`. Cờ không phân biệt chữ hoa/thường và hỗ trợ ký tự đại diện (`telegram.*`, `*`). Cấu hình trong `diagnostics.flags` hoặc qua ghi đè env `OPENCLAW_DIAGNOSTICS=...`. Hướng dẫn đầy đủ:
  [Cờ chẩn đoán](/vi/diagnostics/flags).

Để bật sự kiện chẩn đoán cho Plugin hoặc sink tùy chỉnh mà không xuất OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Để xuất OTLP đến bộ thu thập, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo khắc phục sự cố

- **Không thể truy cập Gateway?** Trước tiên hãy chạy `openclaw doctor`.
- **Nhật ký trống?** Kiểm tra Gateway đang chạy và đang ghi vào đường dẫn tệp trong `logging.file`.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục chỉ số/span, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — các cờ nhật ký gỡ lỗi nhắm mục tiêu
- [Nội bộ ghi nhật ký Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con và chụp bảng điều khiển
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ cho trường `diagnostics.*`
