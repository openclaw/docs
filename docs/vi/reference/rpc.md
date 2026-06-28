---
read_when:
    - Thêm hoặc thay đổi các tích hợp CLI bên ngoài
    - Gỡ lỗi các bộ điều hợp RPC (signal-cli, imsg)
summary: Bộ điều hợp RPC cho các CLI bên ngoài (signal-cli, imsg) và các mẫu Gateway
title: Bộ điều hợp RPC
x-i18n:
    generated_at: "2026-05-10T19:50:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw tích hợp các CLI bên ngoài qua JSON-RPC. Hiện nay có hai mẫu được sử dụng.

## Mẫu A: trình nền HTTP (signal-cli)

- `signal-cli` chạy như một trình nền với JSON-RPC qua HTTP.
- Luồng sự kiện là SSE (`/api/v1/events`).
- Kiểm tra tình trạng: `/api/v1/check`.
- OpenClaw sở hữu vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/vi/channels/signal) để biết cách thiết lập và các endpoint.

## Mẫu B: tiến trình con stdio (imsg)

- OpenClaw sinh `imsg rpc` như một tiến trình con cho [iMessage](/vi/channels/imessage).
- JSON-RPC được phân tách theo dòng qua stdin/stdout (một đối tượng JSON trên mỗi dòng).
- Không cần cổng TCP, không cần trình nền.

Các phương thức lõi được dùng:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (thăm dò/chẩn đoán)

Xem [iMessage](/vi/channels/imessage) để biết cách thiết lập kế thừa và định địa chỉ (ưu tiên `chat_id`).

## Hướng dẫn adapter

- Gateway sở hữu tiến trình (bắt đầu/dừng gắn với vòng đời nhà cung cấp).
- Giữ cho các máy khách RPC bền bỉ: thời gian chờ, khởi động lại khi thoát.
- Ưu tiên ID ổn định (ví dụ: `chat_id`) hơn chuỗi hiển thị.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
