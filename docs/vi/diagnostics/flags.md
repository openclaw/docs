---
read_when:
    - Bạn cần nhật ký gỡ lỗi có mục tiêu mà không tăng mức ghi nhật ký toàn cục
    - Bạn cần thu thập nhật ký dành riêng cho hệ thống con để hỗ trợ
summary: Cờ chẩn đoán cho nhật ký gỡ lỗi có mục tiêu
title: Các cờ chẩn đoán
x-i18n:
    generated_at: "2026-06-27T17:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Cờ chẩn đoán cho phép bạn bật các nhật ký gỡ lỗi có mục tiêu mà không cần bật ghi nhật ký chi tiết ở mọi nơi. Các cờ là tùy chọn bật và không có hiệu lực trừ khi một hệ thống con kiểm tra chúng.

## Cách hoạt động

- Cờ là chuỗi (không phân biệt chữ hoa chữ thường).
- Bạn có thể bật cờ trong cấu hình hoặc thông qua một ghi đè env.
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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Khởi động lại Gateway sau khi thay đổi cờ.

## Ghi đè env (một lần)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tắt tất cả cờ:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` là một ghi đè tắt ở cấp tiến trình: nó tắt
các cờ từ cả env và cấu hình cho tiến trình đó.

## Cờ profiling

Cờ profiler bật các khoảng đo thời gian có mục tiêu mà không nâng cấp độ
ghi nhật ký toàn cục. Chúng bị tắt theo mặc định.

Bật tất cả các span được kiểm soát bởi profiler cho một lần chạy Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Chỉ bật các span profiler điều phối phản hồi:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Chỉ bật các span profiler khởi động app-server/công cụ/luồng của Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Bật cờ profiler từ cấu hình:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Khởi động lại Gateway sau khi thay đổi cờ cấu hình. Để tắt một cờ profiler,
hãy xóa nó khỏi `diagnostics.flags` và khởi động lại. Để tạm thời tắt mọi
cờ chẩn đoán ngay cả khi cấu hình bật cờ profiler, hãy khởi động tiến trình với:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artifact timeline

Cờ `timeline` ghi các sự kiện đo thời gian khởi động và thời gian chạy có cấu trúc cho
các harness QA bên ngoài:

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

Đường dẫn tệp timeline vẫn đến từ
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Khi `timeline` chỉ được bật từ
cấu hình, các span tải cấu hình sớm nhất không được phát ra vì OpenClaw chưa
đọc cấu hình; các span khởi động tiếp theo sử dụng cờ cấu hình.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, và
`OPENCLAW_DIAGNOSTICS=*` cũng bật timeline vì chúng bật mọi
cờ chẩn đoán. Ưu tiên `timeline` khi bạn chỉ muốn artifact đo thời gian
JSONL.

Bản ghi timeline sử dụng envelope `openclaw.diagnostics.v1`. Sự kiện có thể bao gồm
id tiến trình, tên pha, tên span, thời lượng, id Plugin, số lượng dependency,
mẫu độ trễ event-loop, tên thao tác provider, trạng thái thoát của tiến trình con,
và tên/thông báo lỗi khởi động. Hãy xem các tệp timeline là artifact chẩn đoán
cục bộ; rà soát chúng trước khi chia sẻ ra ngoài máy của bạn.

## Nhật ký được ghi ở đâu

Cờ phát nhật ký vào tệp nhật ký chẩn đoán tiêu chuẩn. Theo mặc định:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Nếu bạn đặt `logging.file`, hãy dùng đường dẫn đó thay thế. Nhật ký là JSONL (một đối tượng JSON trên mỗi dòng). Việc biên tập vẫn áp dụng dựa trên `logging.redactSensitive`.

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

Hoặc tail trong khi tái hiện:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Đối với Gateway từ xa, bạn cũng có thể dùng `openclaw logs --follow` (xem [/cli/logs](/vi/cli/logs)).

## Ghi chú

- Nếu `logging.level` được đặt cao hơn `warn`, các nhật ký này có thể bị chặn. Mặc định `info` là ổn.
- `brave.http` ghi nhật ký URL/tham số truy vấn yêu cầu Brave Search, trạng thái/thời gian phản hồi, và các sự kiện cache hit/miss/write. Nó không ghi nhật ký khóa API hoặc phần thân phản hồi, nhưng truy vấn tìm kiếm có thể nhạy cảm.
- Có thể để cờ luôn bật; chúng chỉ ảnh hưởng đến dung lượng nhật ký cho hệ thống con cụ thể.
- Dùng [/logging](/vi/logging) để thay đổi đích, cấp độ, và biên tập nhật ký.

## Liên quan

- [Chẩn đoán Gateway](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
