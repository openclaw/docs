---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra của CLI hoặc Gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Nhật ký Gateway
x-i18n:
    generated_at: "2026-07-12T07:58:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + Giao diện điều khiển + cấu hình), hãy xem [/logging](/vi/logging).

OpenClaw có hai bề mặt nhật ký:

- **Đầu ra bảng điều khiển** - nội dung bạn thấy trong terminal / Giao diện gỡ lỗi.
- **Nhật ký tệp** - các dòng JSON do trình ghi nhật ký của Gateway ghi.

Khi khởi động, Gateway ghi lại mô hình tác tử mặc định đã phân giải cùng các giá trị mặc định của chế độ có ảnh hưởng đến phiên mới:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` lấy từ tác tử mặc định, tham số mô hình hoặc giá trị mặc định toàn cục của tác tử; khi chưa đặt, nó hiển thị `medium`. `fast` lấy từ tác tử mặc định hoặc tham số `fastMode` của mô hình.

## Trình ghi nhật ký dựa trên tệp

- Tệp nhật ký luân phiên mặc định nằm trong `/tmp/openclaw/` (mỗi ngày một tệp): `openclaw-YYYY-MM-DD.log`, được xác định ngày theo múi giờ cục bộ của máy chủ Gateway. Nếu thư mục đó không an toàn hoặc không thể ghi (sai chủ sở hữu, mọi người đều có quyền ghi hoặc là liên kết tượng trưng), OpenClaw sẽ dùng đường dẫn `os.tmpdir()/openclaw-<uid>` theo phạm vi người dùng để dự phòng; trên Windows, hệ thống luôn dùng phương án dự phòng trong thư mục tạm của hệ điều hành này.
- Các tệp nhật ký đang hoạt động được luân phiên khi đạt `logging.maxFileBytes` (mặc định: 100 MB), giữ tối đa năm bản lưu trữ được đánh số (`.1` đến `.5`) và tiếp tục ghi vào một tệp đang hoạt động mới.
- Cấu hình đường dẫn và cấp độ tệp nhật ký qua `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Định dạng tệp gồm một đối tượng JSON trên mỗi dòng.

Các luồng mã trò chuyện, thoại thời gian thực và phòng được quản lý sử dụng trình ghi nhật ký tệp dùng chung cho các bản ghi vòng đời có giới hạn, phục vụ gỡ lỗi vận hành và xuất nhật ký OTLP. Văn bản bản chép lời, tải trọng âm thanh, mã định danh lượt, mã định danh cuộc gọi và mã định danh mục của nhà cung cấp không bao giờ được sao chép vào bản ghi nhật ký.

Thẻ Nhật ký trong Giao diện điều khiển theo dõi tệp này qua Gateway (`logs.tail`). CLI cũng hoạt động tương tự:

```bash
openclaw logs --follow
```

### Chi tiết so với cấp độ nhật ký

- **Nhật ký tệp** chỉ do `logging.level` kiểm soát.
- `--verbose` chỉ ảnh hưởng đến **mức độ chi tiết của bảng điều khiển** (và kiểu nhật ký WS) - tùy chọn này **không** nâng cấp độ nhật ký tệp.
- Để thu thập các chi tiết chỉ có ở chế độ chi tiết trong nhật ký tệp, hãy đặt `logging.level` thành `debug` hoặc `trace`.
- Nhật ký theo dõi cũng bao gồm các bản tóm tắt thời gian chẩn đoán cho một số đường dẫn nóng được chọn, chẳng hạn như quá trình chuẩn bị bộ tạo công cụ Plugin. Xem [/tools/plugin#slow-plugin-tool-setup](/vi/tools/plugin#slow-plugin-tool-setup).

## Thu thập đầu ra bảng điều khiển

CLI thu thập `console.log/info/warn/error/debug/trace`, ghi chúng vào nhật ký tệp và vẫn in ra stdout/stderr.

Điều chỉnh mức độ chi tiết của bảng điều khiển một cách độc lập:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; mặc định là `pretty` trên TTY, nếu không thì là `compact`)

## Che giấu dữ liệu

OpenClaw che giấu các token nhạy cảm trước khi đầu ra nhật ký hoặc bản chép lời rời khỏi tiến trình. Chính sách che giấu này áp dụng tại các đích văn bản gồm bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP và bản chép lời phiên, vì vậy các giá trị bí mật khớp mẫu sẽ được che giấu trước khi các dòng JSONL hoặc thông báo được ghi vào đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng các chuỗi biểu thức chính quy (ghi đè giá trị mặc định)
  - Dùng chuỗi biểu thức chính quy thô (tự động thêm `gi`) hoặc `/pattern/flags` để tùy chỉnh cờ.
  - Các kết quả khớp được che giấu nhưng giữ lại 6 ký tự đầu + 4 ký tự cuối (với giá trị dài từ 18 ký tự trở lên); các giá trị ngắn hơn trở thành `***`.
  - Các giá trị mặc định bao quát phép gán khóa thường gặp, cờ CLI, trường JSON, tiêu đề bearer, khối PEM, tiền tố token của các nhà cung cấp phổ biến và tên trường thông tin xác thực thanh toán (số thẻ, CVC/CVV, token thanh toán dùng chung, thông tin xác thực thanh toán).

Một số ranh giới an toàn luôn che giấu dữ liệu bất kể `logging.redactSensitive`: sự kiện gọi công cụ trong Giao diện điều khiển, đầu ra công cụ `sessions_history`, bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, nội dung hiển thị lệnh phê duyệt thực thi và nhật ký giao thức WebSocket của Gateway. Các bề mặt này vẫn sử dụng `logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"` không khiến chúng xuất bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ thường (không có `--verbose`)**: chỉ in các kết quả RPC “đáng chú ý” - lỗi (`ok=false`), lời gọi chậm (ngưỡng mặc định: `>= 50ms`) và lỗi phân tích cú pháp.
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ tùy chọn chuyển đổi kiểu cho từng Gateway:

- `--ws-log auto` (mặc định): chế độ thường được tối ưu hóa; chế độ chi tiết sử dụng đầu ra rút gọn.
- `--ws-log compact`: đầu ra rút gọn (yêu cầu/phản hồi ghép cặp) khi ở chế độ chi tiết.
- `--ws-log full`: đầu ra đầy đủ cho từng khung khi ở chế độ chi tiết.
- `--compact`: bí danh của `--ws-log compact`.

```bash
# được tối ưu hóa (chỉ lỗi/chậm)
openclaw gateway

# hiển thị toàn bộ lưu lượng WS (ghép cặp)
openclaw gateway --verbose --ws-log compact

# hiển thị toàn bộ lưu lượng WS (siêu dữ liệu đầy đủ)
openclaw gateway --verbose --ws-log full
```

## Định dạng bảng điều khiển (ghi nhật ký hệ thống con)

Trình định dạng bảng điều khiển **nhận biết TTY** và in các dòng nhất quán có tiền tố. Trình ghi nhật ký hệ thống con giữ đầu ra được nhóm và dễ xem lướt:

- **Tiền tố hệ thống con** trên mỗi dòng (ví dụ: `[gateway]`, `[canvas]`, `[tailscale]`).
- **Màu hệ thống con** (ổn định theo từng hệ thống con, được băm từ tên) cùng với màu theo cấp độ.
- **Dùng màu khi đầu ra là TTY** hoặc môi trường có vẻ là terminal giàu khả năng (`TERM`/`COLORTERM`/`TERM_PROGRAM`); tuân thủ `NO_COLOR` và `FORCE_COLOR`.
- **Tiền tố hệ thống con được rút gọn**: loại bỏ phân đoạn `gateway/`, `channels/` hoặc `providers/` ở đầu, sau đó chỉ giữ tối đa 2 phân đoạn cuối còn lại (ví dụ: `channels/turn/kernel` hiển thị thành `turn/kernel`). Các hệ thống con kênh đã biết (`telegram`, `whatsapp`, `slack`, v.v.) luôn được thu gọn chỉ còn tên kênh.
- **Trình ghi nhật ký con theo hệ thống con** (tự động thêm tiền tố + trường có cấu trúc `{ subsystem }`).
- **`logRaw()`** dành cho đầu ra QR/UX (không tiền tố, không định dạng).
- **Kiểu bảng điều khiển**: `pretty` | `compact` | `json`.
- **Cấp độ nhật ký bảng điều khiển** tách biệt với cấp độ nhật ký tệp (tệp vẫn giữ đầy đủ chi tiết khi `logging.level` là `debug`/`trace`).
- **Nội dung tin nhắn WhatsApp** được ghi ở cấp `debug` (dùng `--verbose` để xem).

Điều này giữ cho nhật ký tệp ổn định, đồng thời giúp đầu ra tương tác dễ xem lướt.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics)
