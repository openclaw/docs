---
read_when:
    - Thêm hoặc thay đổi các tích hợp CLI bên ngoài
    - Gỡ lỗi bộ điều hợp RPC (signal-cli, imsg)
summary: Bộ điều hợp RPC cho các CLI bên ngoài (signal-cli, imsg) và các mẫu Gateway
title: Bộ điều hợp RPC
x-i18n:
    generated_at: "2026-05-07T01:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw tích hợp các CLI bên ngoài qua JSON-RPC. Hiện có hai mẫu được sử dụng.

## Mẫu A: daemon HTTP (signal-cli)

- `signal-cli` chạy dưới dạng daemon với JSON-RPC qua HTTP.
- Luồng sự kiện là SSE (`/api/v1/events`).
- Kiểm tra sức khỏe: `/api/v1/check`.
- OpenClaw quản lý vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/vi/channels/signal) để biết cách thiết lập và các điểm cuối.

## Mẫu B: tiến trình con stdio (cũ: imsg)

> **Lưu ý:** Đối với các thiết lập iMessage mới, hãy dùng [BlueBubbles](/vi/channels/bluebubbles) thay thế.

- OpenClaw sinh `imsg rpc` dưới dạng tiến trình con (tích hợp iMessage cũ).
- JSON-RPC được phân tách theo dòng qua stdin/stdout (một đối tượng JSON trên mỗi dòng).
- Không cần cổng TCP, không cần daemon.

Các phương thức lõi được dùng:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (thăm dò/chẩn đoán)

Xem [iMessage](/vi/channels/imessage) để biết cách thiết lập cũ và định địa chỉ (ưu tiên `chat_id`).

## Hướng dẫn adapter

- Gateway sở hữu tiến trình (khởi động/dừng gắn với vòng đời provider).
- Giữ cho các client RPC có khả năng chống lỗi: timeout, khởi động lại khi thoát.
- Ưu tiên ID ổn định (ví dụ: `chat_id`) thay vì chuỗi hiển thị.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
