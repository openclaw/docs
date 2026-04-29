---
read_when:
    - Bạn cần nhật ký gỡ lỗi có mục tiêu mà không nâng mức ghi nhật ký toàn cục
    - Bạn cần thu thập nhật ký dành riêng cho từng hệ thống con để hỗ trợ
summary: Cờ chẩn đoán cho nhật ký gỡ lỗi có mục tiêu
title: Cờ chẩn đoán
x-i18n:
    generated_at: "2026-04-29T22:41:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Cờ chẩn đoán cho phép bạn bật nhật ký gỡ lỗi có mục tiêu mà không cần bật ghi nhật ký chi tiết ở mọi nơi. Các cờ là tùy chọn bật và không có tác dụng trừ khi một hệ thống con kiểm tra chúng.

## Cách hoạt động

- Cờ là chuỗi (không phân biệt chữ hoa chữ thường).
- Bạn có thể bật cờ trong cấu hình hoặc thông qua một ghi đè bằng biến môi trường.
- Hỗ trợ ký tự đại diện:
  - `telegram.*` khớp với `telegram.http`
  - `*` bật tất cả cờ

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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Khởi động lại Gateway sau khi thay đổi cờ.

## Ghi đè bằng biến môi trường (một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tắt tất cả cờ:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Tạo tác dòng thời gian

Cờ `timeline` ghi các sự kiện thời gian có cấu trúc khi khởi động và khi chạy cho
các bộ kiểm thử QA bên ngoài:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Bạn cũng có thể bật cờ này trong cấu hình:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Đường dẫn tệp dòng thời gian vẫn lấy từ
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Khi `timeline` chỉ được bật từ
cấu hình, các khoảng thời gian tải cấu hình sớm nhất sẽ không được phát ra vì OpenClaw
chưa đọc cấu hình; các khoảng thời gian khởi động tiếp theo sử dụng cờ cấu hình.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, và
`OPENCLAW_DIAGNOSTICS=*` cũng bật dòng thời gian vì chúng bật mọi
cờ chẩn đoán. Ưu tiên `timeline` khi bạn chỉ muốn tạo tác thời gian
JSONL.

Bản ghi dòng thời gian sử dụng phong bì `openclaw.diagnostics.v1`. Sự kiện có thể bao gồm
id tiến trình, tên giai đoạn, tên khoảng thời gian, thời lượng, id Plugin, số lượng phụ thuộc,
mẫu độ trễ vòng lặp sự kiện, tên thao tác nhà cung cấp, trạng thái thoát tiến trình con,
và tên/thông báo lỗi khởi động. Hãy xem tệp dòng thời gian là các
tạo tác chẩn đoán cục bộ; xem lại chúng trước khi chia sẻ ra ngoài máy của bạn.

## Nhật ký được ghi ở đâu

Cờ phát nhật ký vào tệp nhật ký chẩn đoán chuẩn. Theo mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu bạn đặt `logging.file`, hãy dùng đường dẫn đó thay thế. Nhật ký là JSONL (mỗi dòng một đối tượng JSON). Việc biên tập vẫn áp dụng dựa trên `logging.redactSensitive`.

## Trích xuất nhật ký

Chọn tệp nhật ký mới nhất:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Lọc chẩn đoán HTTP của Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Hoặc theo dõi trong khi tái hiện:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Đối với Gateway từ xa, bạn cũng có thể dùng `openclaw logs --follow` (xem [/cli/logs](/vi/cli/logs)).

## Ghi chú

- Nếu `logging.level` được đặt cao hơn `warn`, các nhật ký này có thể bị chặn. Mặc định `info` là ổn.
- Có thể để cờ bật một cách an toàn; chúng chỉ ảnh hưởng đến dung lượng nhật ký của hệ thống con cụ thể.
- Dùng [/logging](/vi/logging) để thay đổi đích, cấp độ và biên tập nhật ký.

## Liên quan

- [Chẩn đoán Gateway](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
