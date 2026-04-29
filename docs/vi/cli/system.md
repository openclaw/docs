---
read_when:
    - Bạn muốn đưa một sự kiện hệ thống vào hàng đợi mà không tạo công việc Cron
    - Bạn cần bật hoặc tắt Heartbeat
    - Bạn muốn kiểm tra các mục hiện diện của hệ thống
summary: Tham chiếu CLI cho `openclaw system` (sự kiện hệ thống, Heartbeat, trạng thái hiện diện)
title: Hệ thống
x-i18n:
    generated_at: "2026-04-29T22:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Các trình trợ giúp cấp hệ thống cho Gateway: đưa sự kiện hệ thống vào hàng đợi, điều khiển Heartbeat,
và xem trạng thái hiện diện.

Tất cả lệnh con `system` sử dụng Gateway RPC và chấp nhận các cờ máy khách dùng chung:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Các lệnh thường dùng

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Đưa một sự kiện hệ thống vào hàng đợi trên phiên **main**. Heartbeat tiếp theo sẽ chèn
sự kiện đó dưới dạng một dòng `System:` trong prompt. Dùng `--mode now` để kích hoạt Heartbeat
ngay lập tức; `next-heartbeat` chờ lần kích hoạt theo lịch tiếp theo.

Cờ:

- `--text <text>`: văn bản sự kiện hệ thống bắt buộc.
- `--mode <mode>`: `now` hoặc `next-heartbeat` (mặc định).
- `--json`: đầu ra cho máy đọc.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## `system heartbeat last|enable|disable`

Điều khiển Heartbeat:

- `last`: hiển thị sự kiện Heartbeat gần nhất.
- `enable`: bật lại Heartbeat (dùng tùy chọn này nếu chúng đã bị tắt).
- `disable`: tạm dừng Heartbeat.

Cờ:

- `--json`: đầu ra cho máy đọc.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## `system presence`

Liệt kê các mục trạng thái hiện diện hệ thống hiện tại mà Gateway biết đến (node,
phiên bản, và các dòng trạng thái tương tự).

Cờ:

- `--json`: đầu ra cho máy đọc.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## Ghi chú

- Yêu cầu một Gateway đang chạy có thể truy cập được bằng cấu hình hiện tại của bạn (cục bộ hoặc từ xa).
- Sự kiện hệ thống là tạm thời và không được lưu giữ qua các lần khởi động lại.

## Liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
