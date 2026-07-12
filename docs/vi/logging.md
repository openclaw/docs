---
read_when:
    - Bạn cần một bài tổng quan về tính năng ghi nhật ký của OpenClaw, phù hợp với người mới bắt đầu
    - Bạn muốn cấu hình mức độ ghi nhật ký, định dạng hoặc việc che giấu thông tin nhạy cảm
    - Bạn đang khắc phục sự cố và cần nhanh chóng tìm nhật ký
summary: Nhật ký tệp, đầu ra bảng điều khiển, theo dõi nhật ký bằng CLI và thẻ Nhật ký trong giao diện điều khiển
title: Ghi nhật ký
x-i18n:
    generated_at: "2026-07-12T08:03:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw có hai bề mặt nhật ký chính:

- **Nhật ký tệp** (các dòng JSON) do Gateway ghi.
- **Đầu ra bảng điều khiển** trong terminal đang chạy Gateway.

Tab **Nhật ký** của giao diện điều khiển theo dõi liên tục nhật ký tệp của Gateway. Trang này giải thích vị trí lưu trữ nhật ký, cách đọc nhật ký cũng như cách cấu hình cấp độ và định dạng nhật ký.

## Vị trí lưu trữ nhật ký

Theo mặc định, Gateway ghi một tệp nhật ký luân phiên cho mỗi ngày:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Ngày sử dụng múi giờ cục bộ của máy chủ Gateway. Khi `/tmp/openclaw` không an toàn hoặc không khả dụng (và luôn như vậy trên Windows), OpenClaw thay vào đó sử dụng thư mục `openclaw-<uid>` theo phạm vi người dùng trong thư mục tạm của hệ điều hành. Các tệp nhật ký có ngày được dọn dẹp sau 24 giờ.

Mỗi tệp được luân phiên khi lần ghi tiếp theo có thể vượt quá `logging.maxFileBytes` (mặc định: 100 MB). OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động, chẳng hạn như `openclaw-YYYY-MM-DD.1.log`, rồi tiếp tục ghi vào một nhật ký đang hoạt động mới thay vì ngừng ghi thông tin chẩn đoán.

Bạn có thể ghi đè đường dẫn trong `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cách đọc nhật ký

### CLI: theo dõi trực tiếp (khuyến nghị)

Theo dõi liên tục tệp nhật ký Gateway qua RPC:

```bash
openclaw logs --follow
```

Tùy chọn:

| Cờ                  | Mặc định | Hành vi                                                                                                       |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `--follow`          | tắt      | Tiếp tục theo dõi; kết nối lại với khoảng chờ tăng dần khi bị ngắt kết nối                                    |
| `--limit <n>`       | `200`    | Số dòng tối đa mỗi lần tìm nạp                                                                                |
| `--max-bytes <n>`   | `250000` | Số byte tối đa cần đọc mỗi lần tìm nạp                                                                        |
| `--interval <ms>`   | `1000`   | Khoảng thời gian thăm dò khi đang theo dõi                                                                    |
| `--json`            | tắt      | JSON phân tách theo dòng (mỗi dòng một sự kiện)                                                               |
| `--plain`           | tắt      | Buộc sử dụng văn bản thuần túy trong các phiên TTY                                                            |
| `--no-color`        | —        | Tắt màu ANSI                                                                                                  |
| `--utc`             | tắt      | Hiển thị dấu thời gian theo UTC (mặc định là giờ cục bộ)                                                      |
| `--local-time`      | tắt      | Cách viết tương thích được chấp nhận cho thiết lập mặc định dùng giờ cục bộ; không có tác dụng nào khác        |
| `--url` / `--token` | —        | Các cờ RPC Gateway tiêu chuẩn                                                                                 |
| `--timeout <ms>`    | `30000`  | Thời gian chờ RPC Gateway                                                                                     |
| `--expect-final`    | tắt      | Cờ chờ phản hồi cuối cùng của RPC có agent hỗ trợ (được chấp nhận tại đây thông qua lớp máy khách dùng chung) |

Chế độ đầu ra:

- **Phiên TTY**: các dòng nhật ký có cấu trúc, đẹp mắt và có màu.
- **Phiên không phải TTY**: văn bản thuần túy.

Khi bạn truyền `--url` một cách tường minh, CLI không tự động áp dụng thông tin xác thực từ cấu hình hoặc môi trường; hãy tự cung cấp `--token`, nếu không lệnh gọi sẽ thất bại với thông báo `gateway url override requires explicit credentials`.

Ở chế độ JSON, CLI phát ra các đối tượng được gắn thẻ `type`:

- `meta`: siêu dữ liệu luồng (tệp, nguồn, loại nguồn, dịch vụ, con trỏ, kích thước)
- `log`: mục nhật ký đã phân tích cú pháp
- `notice`: gợi ý về việc cắt bớt / luân phiên
- `raw`: dòng nhật ký chưa phân tích cú pháp
- `error`: lỗi kết nối Gateway (được ghi vào stderr)

Nếu Gateway local loopback ngầm định yêu cầu ghép nối, đóng trong khi kết nối hoặc hết thời gian chờ trước khi `logs.tail` phản hồi, `openclaw logs` sẽ tự động chuyển sang dùng nhật ký tệp Gateway đã cấu hình. Các đích `--url` tường minh không sử dụng cơ chế dự phòng này. `openclaw logs --follow` nghiêm ngặt hơn: trên Linux, lệnh này sử dụng nhật ký Gateway user-systemd đang hoạt động theo PID khi có thể; nếu không, lệnh sẽ thử lại Gateway trực tiếp với khoảng chờ tăng dần thay vì theo dõi một tệp bên cạnh có khả năng đã lỗi thời.

Nếu không thể truy cập Gateway, CLI in một gợi ý ngắn để chạy:

```bash
openclaw doctor
```

### Giao diện điều khiển (web)

Tab **Nhật ký** của giao diện điều khiển theo dõi cùng tệp đó bằng `logs.tail`.
Xem [Giao diện điều khiển](/vi/web/control-ui) để biết cách mở giao diện.

### Nhật ký riêng cho kênh

Để lọc hoạt động của kênh (WhatsApp/Telegram/v.v.), hãy dùng:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` mặc định là `all`; `--lines <n>` (mặc định 200) và `--json` cũng khả dụng.

## Định dạng nhật ký

### Nhật ký tệp (JSONL)

Mỗi dòng trong tệp nhật ký là một đối tượng JSON. CLI và giao diện điều khiển phân tích cú pháp các mục này để hiển thị đầu ra có cấu trúc (thời gian, cấp độ, hệ thống con, thông báo).

Các bản ghi JSONL của nhật ký tệp cũng bao gồm những trường cấp cao nhất có thể lọc bằng máy sau đây khi có:

- `hostname`: tên máy chủ Gateway.
- `message`: văn bản thông báo nhật ký đã được làm phẳng để tìm kiếm toàn văn.
- `agent_id`: mã định danh agent đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh agent.
- `session_id`: mã định danh/khóa phiên đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh phiên.
- `channel`: kênh đang hoạt động khi lệnh gọi nhật ký mang ngữ cảnh kênh.

OpenClaw giữ nguyên các đối số nhật ký có cấu trúc ban đầu cùng với những trường này để các trình phân tích cú pháp hiện có đọc khóa đối số tslog được đánh số vẫn tiếp tục hoạt động.

Hoạt động trò chuyện, thoại thời gian thực và phòng được quản lý phát ra các bản ghi nhật ký vòng đời có giới hạn thông qua cùng quy trình nhật ký tệp này. Các bản ghi này bao gồm loại sự kiện, chế độ, phương tiện truyền tải, nhà cung cấp và các phép đo kích thước/thời gian khi có, nhưng loại bỏ văn bản bản chép lời, tải trọng âm thanh, mã định danh lượt, mã định danh cuộc gọi và mã định danh mục của nhà cung cấp.

### Đầu ra bảng điều khiển

Nhật ký bảng điều khiển **nhận biết TTY** và được định dạng để dễ đọc:

- Tiền tố hệ thống con (ví dụ: `gateway/channels/whatsapp`)
- Màu theo cấp độ (thông tin/cảnh báo/lỗi)
- Chế độ thu gọn hoặc JSON tùy chọn

Định dạng bảng điều khiển được điều khiển bằng `logging.consoleStyle`.

### Nhật ký WebSocket của Gateway

`openclaw gateway` cũng có tính năng ghi nhật ký giao thức WebSocket cho lưu lượng RPC:

- chế độ thông thường: chỉ các kết quả đáng chú ý (lỗi, lỗi phân tích cú pháp, lệnh gọi chậm)
- `--verbose`: toàn bộ lưu lượng yêu cầu/phản hồi
- `--ws-log auto|compact|full`: chọn kiểu hiển thị chi tiết
- `--compact`: bí danh của `--ws-log compact`

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

Các cấp độ: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: cấp độ **nhật ký tệp** (JSONL) (mặc định: `info`).
- `logging.consoleLevel`: cấp độ chi tiết của **bảng điều khiển**.

Bạn có thể ghi đè cả hai thông qua biến môi trường **`OPENCLAW_LOG_LEVEL`** (ví dụ: `OPENCLAW_LOG_LEVEL=debug`). Biến môi trường được ưu tiên hơn tệp cấu hình, vì vậy bạn có thể tăng mức độ chi tiết cho một lần chạy mà không cần chỉnh sửa `openclaw.json`. Bạn cũng có thể truyền tùy chọn CLI toàn cục **`--log-level <level>`** (ví dụ: `openclaw --log-level debug gateway run`), tùy chọn này ghi đè biến môi trường cho lệnh đó.

`--verbose` chỉ ảnh hưởng đến đầu ra bảng điều khiển và mức độ chi tiết của nhật ký WS; tùy chọn này không thay đổi cấp độ nhật ký tệp.

### Chẩn đoán phương tiện truyền tải mô hình có mục tiêu

Khi gỡ lỗi các lệnh gọi nhà cung cấp, hãy sử dụng các cờ môi trường có mục tiêu thay vì nâng toàn bộ nhật ký lên `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Các cờ khả dụng:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: phát sự kiện bắt đầu yêu cầu, phản hồi tìm nạp, tiêu đề SDK, sự kiện truyền phát đầu tiên, hoàn tất luồng và lỗi truyền tải ở cấp độ `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: bao gồm bản tóm tắt tải trọng yêu cầu có giới hạn trong nhật ký yêu cầu mô hình.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: bao gồm tất cả tên công cụ hướng đến mô hình trong bản tóm tắt tải trọng.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: bao gồm ảnh chụp nhanh tải trọng JSON đã che giấu và giới hạn kích thước. Chỉ sử dụng khi gỡ lỗi; các bí mật được che giấu nhưng câu lệnh nhắc và văn bản thông báo vẫn có thể xuất hiện.
- `OPENCLAW_DEBUG_SSE=events`: phát thời gian của sự kiện đầu tiên và thời điểm hoàn tất luồng.
- `OPENCLAW_DEBUG_SSE=peek`: đồng thời phát năm tải trọng sự kiện SSE đầu tiên đã che giấu, với giới hạn cho mỗi sự kiện.
- `OPENCLAW_DEBUG_CODE_MODE=1`: phát thông tin chẩn đoán bề mặt mô hình ở chế độ mã, bao gồm thời điểm các công cụ gốc của nhà cung cấp bị ẩn vì chế độ mã sở hữu bề mặt công cụ.

Các cờ này ghi thông qua cơ chế ghi nhật ký thông thường của OpenClaw, vì vậy `openclaw logs --follow` và tab Nhật ký của giao diện điều khiển sẽ hiển thị chúng. Khi không có các cờ này, cùng thông tin chẩn đoán vẫn khả dụng ở cấp độ `debug`.

Siêu dữ liệu bắt đầu và phản hồi `[model-fetch]` (nhà cung cấp, API, mô hình, trạng thái, độ trễ và các trường yêu cầu như phương thức, URL, thời gian chờ, proxy và chính sách) luôn được phát ở cấp độ `info` bất kể `OPENCLAW_DEBUG_MODEL_TRANSPORT`, nhờ đó có thể quan sát tình trạng cơ bản của phương tiện truyền tải mô hình mà không cần cờ gỡ lỗi.

### Tương quan dấu vết

Nhật ký tệp có định dạng JSONL. Khi một lệnh gọi nhật ký mang ngữ cảnh dấu vết chẩn đoán hợp lệ, OpenClaw ghi các trường dấu vết dưới dạng khóa JSON cấp cao nhất (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) để các bộ xử lý nhật ký bên ngoài có thể liên kết dòng đó với các span OTEL và việc truyền tiếp `traceparent` của nhà cung cấp.

Các yêu cầu HTTP của Gateway và khung WebSocket của Gateway thiết lập một phạm vi dấu vết yêu cầu nội bộ. Nhật ký và sự kiện chẩn đoán được phát bên trong phạm vi bất đồng bộ đó sẽ kế thừa dấu vết yêu cầu khi chúng không truyền ngữ cảnh dấu vết tường minh. Dấu vết lượt chạy agent và lệnh gọi mô hình trở thành phần tử con của dấu vết yêu cầu đang hoạt động, nhờ đó có thể liên kết nhật ký cục bộ, ảnh chụp nhanh chẩn đoán, span OTEL và tiêu đề `traceparent` đáng tin cậy của nhà cung cấp bằng `traceId` mà không ghi nội dung thô của yêu cầu hoặc mô hình vào nhật ký.

Các bản ghi nhật ký vòng đời trò chuyện cũng được chuyển đến tính năng xuất nhật ký diagnostics-otel khi bật xuất nhật ký OpenTelemetry, sử dụng cùng các thuộc tính có giới hạn như nhật ký tệp. Cấu hình `diagnostics.otel.logsExporter` để chọn OTLP, JSONL stdout hoặc cả hai đích.

### Kích thước và thời gian lệnh gọi mô hình

Thông tin chẩn đoán lệnh gọi mô hình ghi lại các phép đo yêu cầu/phản hồi có giới hạn mà không thu thập nội dung thô của câu lệnh nhắc hoặc phản hồi:

- `requestPayloadBytes`: kích thước theo byte UTF-8 của tải trọng yêu cầu mô hình cuối cùng
- `responseStreamBytes`: kích thước theo byte UTF-8 của tải trọng các đoạn phản hồi mô hình được truyền phát. Các sự kiện delta văn bản, suy luận và lệnh gọi công cụ có tần suất cao chỉ tính số byte `delta` tăng thêm thay vì toàn bộ ảnh chụp nhanh `partial`.
- `timeToFirstByteMs`: thời gian đã trôi qua trước sự kiện phản hồi được truyền phát đầu tiên
- `durationMs`: tổng thời lượng lệnh gọi mô hình

Các trường này khả dụng cho ảnh chụp nhanh chẩn đoán, hook Plugin lệnh gọi mô hình và span/chỉ số lệnh gọi mô hình OTEL khi bật xuất dữ liệu chẩn đoán.

### Kiểu bảng điều khiển

`logging.consoleStyle`:

- `pretty`: thân thiện với người dùng, có màu và dấu thời gian.
- `compact`: đầu ra cô đọng hơn (phù hợp nhất cho các phiên dài).
- `json`: JSON trên mỗi dòng (dành cho bộ xử lý nhật ký).

### Che giấu

OpenClaw có thể che giấu các token nhạy cảm trước khi chúng xuất hiện trong đầu ra bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP, văn bản bản chép lời phiên được lưu trữ hoặc tải trọng sự kiện công cụ của giao diện điều khiển (đối số bắt đầu công cụ, tải trọng kết quả một phần/cuối cùng, đầu ra thực thi được suy ra và bản tóm tắt bản vá):

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: danh sách chuỗi biểu thức chính quy thay thế tập hợp mặc định cho đầu ra nhật ký/bản chép lời. Đối với tải trọng công cụ của giao diện điều khiển, các mẫu tùy chỉnh được áp dụng bổ sung cho các giá trị mặc định tích hợp sẵn, vì vậy việc thêm một mẫu không bao giờ làm suy yếu khả năng che giấu các giá trị đã được các giá trị mặc định phát hiện.

Nhật ký tệp và bản chép lời phiên vẫn ở định dạng JSONL, nhưng các giá trị bí mật khớp mẫu được che trước khi dòng hoặc thông báo được ghi vào đĩa. Việc che giấu được thực hiện theo khả năng tốt nhất: cơ chế này áp dụng cho nội dung thông báo chứa văn bản và chuỗi nhật ký, không áp dụng cho mọi trường mã định danh hoặc tải trọng nhị phân.

Các giá trị mặc định tích hợp sẵn bao quát những thông tin xác thực API và tên
trường thông tin xác thực thanh toán phổ biến như số thẻ, CVC/CVV, token thanh
toán dùng chung và thông tin xác thực thanh toán khi chúng xuất hiện dưới dạng
trường JSON, tham số URL, cờ CLI hoặc phép gán.

`logging.redactSensitive: "off"` chỉ vô hiệu hóa chính sách chung này đối với
nhật ký/bản ghi hội thoại. OpenClaw vẫn che dữ liệu tải trọng tại ranh giới an
toàn có thể được hiển thị cho các ứng dụng khách UI, gói hỗ trợ, trình quan sát
chẩn đoán, lời nhắc phê duyệt hoặc công cụ của tác tử. Ví dụ bao gồm các sự kiện
gọi công cụ của UI điều khiển, đầu ra `sessions_history`, bản xuất hỗ trợ chẩn
đoán, quan sát lỗi của nhà cung cấp, phần hiển thị lệnh phê duyệt thực thi và
nhật ký giao thức WebSocket của Gateway. `logging.redactPatterns` tùy chỉnh vẫn
có thể bổ sung các mẫu dành riêng cho dự án trên những bề mặt đó.

## Chẩn đoán và OpenTelemetry

Chẩn đoán là các sự kiện có cấu trúc, có thể đọc bằng máy dành cho các lượt chạy
mô hình và dữ liệu đo từ xa của luồng tin nhắn (webhook, xếp hàng, trạng thái
phiên). Chúng **không** thay thế nhật ký — chúng cung cấp dữ liệu cho chỉ số,
dấu vết và trình xuất. Theo mặc định, các sự kiện được phát trong tiến trình
(đặt `diagnostics.enabled: false` để tắt); việc xuất chúng được cấu hình riêng.

Hai bề mặt liên quan:

- **Xuất OpenTelemetry** — gửi chỉ số, dấu vết và nhật ký qua OTLP/HTTP đến
  bất kỳ bộ thu thập hoặc hệ thống phụ trợ nào tương thích với OpenTelemetry
  (Datadog, Grafana, Honeycomb, New Relic, Tempo, v.v.). Cấu hình đầy đủ, danh
  mục tín hiệu, tên chỉ số/khoảng, biến môi trường và mô hình quyền riêng tư nằm
  trên một trang riêng:
  [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- **Cờ chẩn đoán** — các cờ nhật ký gỡ lỗi có mục tiêu, chuyển nhật ký bổ sung
  đến `logging.file` mà không tăng `logging.level`. Các cờ không phân biệt chữ
  hoa chữ thường và hỗ trợ ký tự đại diện (`telegram.*`, `*`). Cấu hình trong
  `diagnostics.flags` hoặc qua giá trị ghi đè của biến môi trường
  `OPENCLAW_DIAGNOSTICS=...`. Hướng dẫn đầy đủ:
  [Cờ chẩn đoán](/vi/diagnostics/flags).

Để xuất OTLP đến một bộ thu thập, hãy xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Mẹo khắc phục sự cố

- **Không thể truy cập Gateway?** Trước tiên, hãy chạy `openclaw doctor`.
- **Nhật ký trống?** Hãy kiểm tra xem Gateway có đang chạy và ghi vào đường dẫn
  tệp trong `logging.file` hay không.
- **Cần thêm chi tiết?** Đặt `logging.level` thành `debug` hoặc `trace` rồi thử lại.

## Liên quan

- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — xuất OTLP/HTTP, danh mục chỉ số/khoảng, mô hình quyền riêng tư
- [Cờ chẩn đoán](/vi/diagnostics/flags) — các cờ nhật ký gỡ lỗi có mục tiêu
- [Nội bộ hệ thống ghi nhật ký của Gateway](/vi/gateway/logging) — kiểu nhật ký WS, tiền tố hệ thống con và thu thập đầu ra bảng điều khiển
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#diagnostics) — tham chiếu đầy đủ cho các trường `diagnostics.*`
