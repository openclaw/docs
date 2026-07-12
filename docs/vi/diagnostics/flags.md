---
read_when:
    - Bạn cần nhật ký gỡ lỗi có mục tiêu mà không cần tăng mức ghi nhật ký toàn cục
    - Bạn cần thu thập nhật ký dành riêng cho từng hệ thống con để phục vụ việc hỗ trợ
summary: Các cờ chẩn đoán dành cho nhật ký gỡ lỗi có mục tiêu
title: Cờ chẩn đoán
x-i18n:
    generated_at: "2026-07-12T07:53:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Cờ chẩn đoán bật ghi nhật ký bổ sung cho một hệ thống con mà không tăng
`logging.level` trên toàn cục. Cờ không có tác dụng trừ khi một hệ thống con kiểm tra nó.

## Cách hoạt động

- Cờ là các chuỗi không phân biệt chữ hoa chữ thường, được xác định từ `diagnostics.flags` trong
  cấu hình kết hợp với giá trị ghi đè của biến môi trường `OPENCLAW_DIAGNOSTICS`, sau đó được loại bỏ trùng lặp và chuyển thành chữ thường.
- `name.*` khớp với chính `name` và mọi mục bên dưới `name.` (ví dụ,
  `telegram.*` khớp với `telegram.http`).
- `*` hoặc `all` bật mọi cờ.
- Khởi động lại Gateway sau khi thay đổi `diagnostics.flags` trong cấu hình; thay đổi này không
  được tải lại tức thời.

## Các cờ đã biết

| Cờ               | Bật                                                       |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Ghi nhật ký lỗi HTTP của Telegram Bot API                 |
| `brave.http`     | Ghi nhật ký yêu cầu/phản hồi/bộ nhớ đệm của Brave Search  |
| `profiler`       | Trình phân tích hiệu năng giai đoạn trả lời và trình phân tích hiệu năng máy chủ ứng dụng Codex (cả hai) |
| `reply.profiler` | Chỉ trình phân tích hiệu năng giai đoạn trả lời           |
| `codex.profiler` | Chỉ trình phân tích hiệu năng máy chủ ứng dụng Codex      |
| `timeline`       | Tệp dòng thời gian JSONL có cấu trúc (xem bên dưới)       |

## Bật qua cấu hình

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Nhiều cờ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Ghi đè bằng biến môi trường (một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Các giá trị được phân tách theo dấu phẩy hoặc khoảng trắng. Giá trị đặc biệt:

| Giá trị                     | Tác dụng                                      |
| --------------------------- | --------------------------------------------- |
| `0`, `false`, `off`, `none` | Tắt mọi cờ, đồng thời ghi đè cả cấu hình      |
| `1`, `true`, `all`, `*`     | Bật mọi cờ                                    |

`OPENCLAW_DIAGNOSTICS=0` tắt các cờ từ cả biến môi trường và cấu hình cho
tiến trình đó, hữu ích để tạm thời vô hiệu hóa một cờ trình phân tích hiệu năng còn bật trong cấu hình
mà không cần chỉnh sửa tệp.

## Cờ trình phân tích hiệu năng

Các cờ trình phân tích hiệu năng kiểm soát các khoảng đo thời gian nhẹ; chúng không tạo thêm chi phí khi tắt.

Bật tất cả khoảng đo được kiểm soát bởi trình phân tích hiệu năng cho một lần chạy Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Chỉ bật các khoảng đo của trình phân tích hiệu năng điều phối trả lời:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Chỉ bật các khoảng đo của trình phân tích hiệu năng khi khởi động/dùng công cụ/xử lý luồng trên máy chủ ứng dụng Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` bật cả trình phân tích hiệu năng trả lời và trình phân tích hiệu năng Codex; hãy dùng
tên cờ có phạm vi để chỉ bật một loại.

Hoặc đặt trong cấu hình:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Khởi động lại Gateway sau khi thay đổi các cờ cấu hình. Để tắt một cờ trình phân tích hiệu năng,
hãy xóa cờ đó khỏi `diagnostics.flags` rồi khởi động lại, hoặc khởi động tiến trình với
`OPENCLAW_DIAGNOSTICS=0` để ghi đè mọi cờ chẩn đoán cho lần chạy đó.

## Tệp dòng thời gian

Cờ `timeline` (bí danh: `diagnostics.timeline`) ghi các sự kiện đo thời gian khởi động
và thời gian chạy có cấu trúc dưới dạng JSONL cho các bộ kiểm thử QA bên ngoài:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Hoặc bật trong cấu hình:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Đường dẫn đầu ra luôn lấy từ `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, ngay cả
khi bản thân cờ được đặt trong cấu hình; không có khóa cấu hình cho đường dẫn này.
Khi `timeline` chỉ được bật từ cấu hình, các khoảng đo tải cấu hình sớm nhất
sẽ bị thiếu vì OpenClaw chưa đọc cấu hình; các khoảng đo khởi động tiếp theo
vẫn được ghi nhận bình thường.

`OPENCLAW_DIAGNOSTICS=1`, `=all` và `=*` cũng bật dòng thời gian vì chúng
bật mọi cờ. Nên dùng cờ `timeline` có phạm vi khi bạn chỉ cần
tệp JSONL mà không cần mọi cờ chẩn đoán khác.

Các mẫu độ trễ vòng lặp sự kiện trong dòng thời gian cần thêm một lần chủ động bật ngoài
`timeline`: đặt `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (hoặc `on`/`true`/`yes`)
ngoài việc bật dòng thời gian.

Các bản ghi dòng thời gian sử dụng lớp bao `openclaw.diagnostics.v1` và có thể bao gồm
mã tiến trình, tên giai đoạn, tên khoảng đo, thời lượng, mã định danh Plugin, số lượng
phần phụ thuộc, mẫu độ trễ vòng lặp sự kiện, tên thao tác của nhà cung cấp, trạng thái thoát
của tiến trình con và tên/thông báo lỗi khởi động. Hãy xem các tệp dòng thời gian là
tệp chẩn đoán cục bộ; kiểm tra trước khi chia sẻ ra ngoài máy của bạn.

## Vị trí lưu nhật ký

Các cờ phát sinh nhật ký vào tệp nhật ký chẩn đoán tiêu chuẩn. Theo mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu bạn đặt `logging.file`, hãy dùng đường dẫn đó. Nhật ký có định dạng JSONL (mỗi dòng là một đối tượng
JSON). Việc che giấu vẫn được áp dụng dựa trên `logging.redactSensitive`.
Xem [Ghi nhật ký](/vi/logging) để biết đầy đủ về cách xác định đường dẫn nhật ký, luân chuyển và
mô hình che giấu.

## Trích xuất nhật ký

Chọn tệp nhật ký mới nhất:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Lọc chẩn đoán HTTP của Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Lọc chẩn đoán HTTP của Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Hoặc theo dõi trực tiếp trong khi tái hiện:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Đối với Gateway từ xa, hãy dùng `openclaw logs --follow` thay thế (xem
[/cli/logs](/vi/cli/logs)).

## Lưu ý

- Nếu `logging.level` được đặt cao hơn `warn`, các nhật ký do cờ kiểm soát có thể bị
  loại bỏ. Giá trị mặc định `info` là phù hợp.
- `brave.http` ghi lại URL yêu cầu/tham số truy vấn của Brave Search, trạng thái/thời gian
  phản hồi và các sự kiện trúng/trượt/ghi bộ nhớ đệm. Nó không ghi khóa API
  (được gửi dưới dạng tiêu đề yêu cầu) hoặc nội dung phản hồi, nhưng các truy vấn tìm kiếm có thể
  chứa thông tin nhạy cảm.
- Có thể an toàn để các cờ luôn bật; chúng chỉ ảnh hưởng đến dung lượng nhật ký của
  hệ thống con cụ thể.
- Dùng [/logging](/vi/logging) để thay đổi đích lưu, cấp độ và chế độ che giấu nhật ký.

## Liên quan

- [Chẩn đoán Gateway](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
