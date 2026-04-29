---
read_when:
    - Thêm hoặc thay đổi các tích hợp CLI bên ngoài
    - Gỡ lỗi các bộ điều hợp RPC (signal-cli, imsg)
summary: Bộ chuyển đổi RPC cho các CLI bên ngoài (signal-cli, imsg cũ) và các mẫu Gateway
title: Bộ điều hợp RPC
x-i18n:
    generated_at: "2026-04-29T23:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw tích hợp các CLI bên ngoài thông qua JSON-RPC. Hiện nay có hai mẫu được sử dụng.

## Mẫu A: daemon HTTP (signal-cli)

- `signal-cli` chạy dưới dạng daemon với JSON-RPC qua HTTP.
- Luồng sự kiện là SSE (`/api/v1/events`).
- Kiểm tra sức khỏe: `/api/v1/check`.
- OpenClaw sở hữu vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/vi/channels/signal) để biết cách thiết lập và các endpoint.

## Mẫu B: tiến trình con stdio (cũ: imsg)

> **Lưu ý:** Với các thiết lập iMessage mới, hãy dùng [BlueBubbles](/vi/channels/bluebubbles) thay thế.

- OpenClaw sinh `imsg rpc` dưới dạng một tiến trình con (tích hợp iMessage cũ).
- JSON-RPC được phân tách theo dòng qua stdin/stdout (mỗi dòng một đối tượng JSON).
- Không cần cổng TCP, không cần daemon.

Các phương thức cốt lõi được sử dụng:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (thăm dò/chẩn đoán)

Xem [iMessage](/vi/channels/imessage) để biết cách thiết lập cũ và định địa chỉ (ưu tiên `chat_id`).

## Hướng dẫn adapter

- Gateway sở hữu tiến trình (start/stop gắn với vòng đời provider).
- Giữ cho các client RPC có khả năng phục hồi: timeout, khởi động lại khi thoát.
- Ưu tiên ID ổn định (ví dụ: `chat_id`) thay vì chuỗi hiển thị.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
