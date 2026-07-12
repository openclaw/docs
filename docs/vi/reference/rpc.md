---
read_when:
    - Thêm hoặc thay đổi các tích hợp CLI bên ngoài
    - Gỡ lỗi các bộ điều hợp RPC (signal-cli, imsg)
summary: Bộ điều hợp RPC cho các CLI bên ngoài (signal-cli, imsg) và các mẫu Gateway
title: Bộ điều hợp RPC
x-i18n:
    generated_at: "2026-07-12T08:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw tích hợp các CLI bên ngoài thông qua JSON-RPC. Hiện nay có hai mẫu được sử dụng.

## Mẫu A: Tiến trình nền HTTP (signal-cli)

- `signal-cli` chạy dưới dạng tiến trình nền với JSON-RPC qua HTTP.
- Luồng sự kiện sử dụng SSE (`/api/v1/events`).
- Điểm kiểm tra tình trạng: `/api/v1/check`.
- OpenClaw quản lý vòng đời khi `channels.signal.autoStart=true`.

Xem [Signal](/vi/channels/signal) để biết cách thiết lập và các điểm cuối.

## Mẫu B: Tiến trình con stdio (imsg)

- OpenClaw khởi chạy `imsg rpc` dưới dạng tiến trình con cho [iMessage](/vi/channels/imessage).
- JSON-RPC được phân tách theo dòng qua stdin/stdout (mỗi dòng là một đối tượng JSON).
- Không cần cổng TCP hay tiến trình nền.

Các phương thức cốt lõi được sử dụng:

- `watch.subscribe` → thông báo (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (thăm dò/chẩn đoán)

Xem [iMessage](/vi/channels/imessage) để biết cách thiết lập và định địa chỉ (ưu tiên `chat_id` hơn chuỗi hiển thị).

## Hướng dẫn về bộ chuyển đổi

- Gateway quản lý tiến trình (việc khởi động/dừng gắn với vòng đời của nhà cung cấp).
- Duy trì khả năng phục hồi của các máy khách RPC: đặt thời gian chờ, khởi động lại khi tiến trình thoát.
- Ưu tiên mã định danh ổn định (ví dụ: `chat_id`) hơn chuỗi hiển thị.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
