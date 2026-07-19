---
read_when:
    - Bạn cần nhật ký gỡ lỗi có mục tiêu mà không tăng mức ghi nhật ký toàn cục
    - Bạn cần thu thập nhật ký dành riêng cho từng hệ thống con để phục vụ việc hỗ trợ
summary: Các cờ chẩn đoán cho nhật ký gỡ lỗi có mục tiêu
title: Cờ chẩn đoán
x-i18n:
    generated_at: "2026-07-19T05:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a54692af361edcdc82863fb9c742a9dde21ed242f38e4253b6e27edb6a74f21
    source_path: diagnostics/flags.md
    workflow: 16
---

Các cờ chẩn đoán bật ghi nhật ký bổ sung cho một hệ thống con mà không tăng
`logging.level` trên toàn cục. Một cờ không có tác dụng trừ khi có hệ thống con kiểm tra cờ đó.

## Cách hoạt động

- Các cờ là chuỗi không phân biệt chữ hoa chữ thường, được phân giải từ `diagnostics.flags` trong
  cấu hình cùng với giá trị ghi đè từ biến môi trường `OPENCLAW_DIAGNOSTICS`, sau đó loại bỏ trùng lặp và chuyển thành chữ thường.
- `name.*` khớp với chính `name` và mọi mục bên dưới `name.` (ví dụ:
  `telegram.*` khớp với `telegram.http`).
- `*` hoặc `all` bật mọi cờ.
- Khởi động lại Gateway sau khi thay đổi `diagnostics.flags` trong cấu hình; mục này không
  được tải lại nóng.

## Các cờ đã biết

| Cờ                   | Bật                                                       |
| --------------------- | --------------------------------------------------------- |
| `telegram.http`       | Ghi nhật ký lỗi HTTP của Telegram Bot API                 |
| `brave.http`          | Ghi nhật ký yêu cầu/phản hồi/bộ nhớ đệm của Brave Search  |
| `profiler`            | Trình phân tích hiệu năng giai đoạn phản hồi và trình phân tích hiệu năng Codex app-server (cả hai) |
| `reply.profiler`      | Chỉ trình phân tích hiệu năng giai đoạn phản hồi          |
| `codex.profiler`      | Chỉ trình phân tích hiệu năng Codex app-server            |
| `health`              | Chi tiết gỡ lỗi kiểm tra tình trạng/tài khoản/liên kết của Gateway |
| `ingress.timing`      | Thời gian tải phiên, chọn mô hình và danh mục mô hình     |
| `plugin.load-profile` | Thời gian tải đồng bộ mô-đun Plugin                       |
| `timeline`            | Tạo phẩm dòng thời gian JSONL có cấu trúc (xem bên dưới)  |

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

## Ghi đè bằng biến môi trường (dùng một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Các giá trị được phân tách theo dấu phẩy hoặc khoảng trắng. Giá trị đặc biệt:

| Giá trị                     | Tác dụng                                      |
| --------------------------- | --------------------------------------------- |
| `0`, `false`, `off`, `none` | Tắt mọi cờ, đồng thời ghi đè cả cấu hình       |
| `1`, `true`, `all`, `*`     | Bật mọi cờ                                    |

`OPENCLAW_DIAGNOSTICS=0` tắt các cờ từ cả biến môi trường lẫn cấu hình cho
tiến trình đó, hữu ích để tạm thời tắt tiếng một cờ phân tích hiệu năng vẫn đang bật trong cấu hình
mà không cần chỉnh sửa tệp.

## Các cờ phân tích hiệu năng

Các cờ phân tích hiệu năng kiểm soát những khoảng đo thời gian nhẹ; chúng không tạo thêm chi phí khi tắt.

Bật tất cả khoảng đo được kiểm soát bởi trình phân tích hiệu năng cho một lần chạy Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Chỉ bật các khoảng phân tích hiệu năng điều phối phản hồi:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Chỉ bật các khoảng phân tích hiệu năng khởi động/công cụ/luồng của Codex app-server:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` bật cả trình phân tích hiệu năng phản hồi lẫn trình phân tích hiệu năng Codex; hãy dùng
tên cờ theo phạm vi để chỉ bật một trình.

Hoặc đặt trong cấu hình:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Khởi động lại Gateway sau khi thay đổi các cờ cấu hình. Để tắt một cờ phân tích hiệu năng,
hãy xóa cờ đó khỏi `diagnostics.flags` rồi khởi động lại, hoặc khởi động tiến trình với
`OPENCLAW_DIAGNOSTICS=0` để ghi đè mọi cờ chẩn đoán cho lần chạy đó.

## Tạo phẩm dòng thời gian

Cờ `timeline` (bí danh: `diagnostics.timeline`) ghi các sự kiện đo thời gian khi khởi động
và trong lúc chạy dưới dạng JSONL có cấu trúc, dành cho các bộ kiểm thử QA bên ngoài:

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
khi chính cờ đó được đặt trong cấu hình; không có khóa cấu hình nào cho đường dẫn này.
Khi `timeline` chỉ được bật từ cấu hình, các khoảng tải cấu hình sớm nhất
sẽ bị thiếu vì OpenClaw chưa đọc cấu hình; những khoảng khởi động sau đó
vẫn được ghi lại bình thường.

`OPENCLAW_DIAGNOSTICS=1`, `=all` và `=*` cũng bật dòng thời gian vì chúng
bật mọi cờ. Ưu tiên cờ theo phạm vi `timeline` khi bạn chỉ muốn
tạo phẩm JSONL mà không muốn bật mọi cờ chẩn đoán khác.

Các mẫu độ trễ vòng lặp sự kiện trong dòng thời gian cần thêm một tùy chọn bật ngoài
`timeline`: đặt `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (hoặc `on`/`true`/`yes`) bên cạnh
việc bật dòng thời gian.

Các bản ghi dòng thời gian sử dụng vỏ bọc `openclaw.diagnostics.v1` và có thể bao gồm
ID tiến trình, tên giai đoạn, tên khoảng, thời lượng, ID Plugin, số lượng phần phụ thuộc,
mẫu độ trễ vòng lặp sự kiện, tên thao tác của nhà cung cấp, trạng thái thoát của tiến trình con
và tên/thông báo lỗi khởi động. Hãy xem các tệp dòng thời gian là tạo phẩm chẩn đoán
cục bộ; kiểm tra trước khi chia sẻ chúng ra ngoài máy của bạn.

## Nhật ký được lưu ở đâu

Các cờ phát nhật ký vào tệp nhật ký chẩn đoán tiêu chuẩn. Theo mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu bạn đặt `logging.file`, hãy sử dụng đường dẫn đó thay thế. Nhật ký ở định dạng JSONL (mỗi dòng là một đối tượng JSON).
Việc che dữ liệu vẫn áp dụng dựa trên `logging.redactSensitive`.
Xem [Ghi nhật ký](/vi/logging) để biết đầy đủ cách phân giải đường dẫn nhật ký, xoay vòng và
mô hình che dữ liệu.

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

Đối với các Gateway từ xa, hãy dùng `openclaw logs --follow` thay thế (xem
[/cli/logs](/vi/cli/logs)).

## Ghi chú

- Nếu `logging.level` được đặt cao hơn `warn`, nhật ký được kiểm soát bằng cờ có thể bị
  chặn. Giá trị mặc định `info` là phù hợp.
- `brave.http` ghi nhật ký URL yêu cầu/tham số truy vấn, trạng thái/thời gian
  phản hồi và các sự kiện trúng/trượt/ghi bộ nhớ đệm của Brave Search. Cờ này không ghi khóa API
  (được gửi dưới dạng tiêu đề yêu cầu) hoặc nội dung phản hồi, nhưng các truy vấn tìm kiếm có thể
  chứa thông tin nhạy cảm.
- Có thể để các cờ luôn bật một cách an toàn; chúng chỉ ảnh hưởng đến dung lượng nhật ký của
  hệ thống con cụ thể.
- Dùng [/logging](/vi/logging) để thay đổi đích, cấp độ và cách che dữ liệu của nhật ký.

## Liên quan

- [Chẩn đoán Gateway](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
