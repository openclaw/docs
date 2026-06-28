---
read_when:
    - Chỉnh sửa hợp đồng IPC hoặc IPC của ứng dụng thanh menu
summary: Kiến trúc IPC macOS cho ứng dụng OpenClaw, truyền tải nút Gateway và PeekabooBridge
title: IPC trên macOS
x-i18n:
    generated_at: "2026-06-28T00:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Kiến trúc IPC macOS của OpenClaw

**Mô hình hiện tại:** một Unix socket cục bộ kết nối **dịch vụ máy chủ node** với **ứng dụng macOS** để phê duyệt exec + `system.run`. Một CLI gỡ lỗi `openclaw-mac` tồn tại để kiểm tra khám phá/kết nối; các hành động của agent vẫn đi qua Gateway WebSocket và `node.invoke`. Tự động hóa UI dùng PeekabooBridge.

## Mục tiêu

- Một phiên bản ứng dụng GUI duy nhất sở hữu mọi công việc liên quan đến TCC (thông báo, ghi màn hình, mic, giọng nói, AppleScript).
- Một bề mặt nhỏ cho tự động hóa: Gateway + các lệnh node, cộng với PeekabooBridge cho tự động hóa UI.
- Quyền có thể dự đoán: luôn cùng một bundle ID đã ký, được launchd khởi chạy, để các cấp quyền TCC được giữ lại.

## Cách hoạt động

### Gateway + truyền tải node

- Ứng dụng chạy Gateway (chế độ cục bộ) và kết nối với nó dưới dạng một node.
- Các hành động của agent được thực hiện qua `node.invoke` (ví dụ: `system.run`, `system.notify`, `canvas.*`).
- Các lệnh node Mac phổ biến gồm `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, và `system.notify`.
- Node báo cáo một bản đồ `permissions` để agent có thể thấy liệu quyền truy cập màn hình,
  camera, micro, giọng nói, tự động hóa, hoặc trợ năng có khả dụng hay không.

### Dịch vụ Node + IPC ứng dụng

- Một dịch vụ máy chủ node không giao diện kết nối với Gateway WebSocket.
- Các yêu cầu `system.run` được chuyển tiếp tới ứng dụng macOS qua một Unix socket cục bộ.
- Ứng dụng thực hiện exec trong ngữ cảnh UI, nhắc nếu cần, và trả về đầu ra.

Sơ đồ (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (tự động hóa UI)

- Tự động hóa UI dùng một UNIX socket riêng tên là `bridge.sock` và giao thức JSON PeekabooBridge.
- Thứ tự ưu tiên máy chủ (phía client): Peekaboo.app → Claude.app → OpenClaw.app → thực thi cục bộ.
- Bảo mật: máy chủ bridge yêu cầu TeamID được cho phép; lối thoát cùng UID chỉ dành cho DEBUG được bảo vệ bằng `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (quy ước Peekaboo).
- Xem: [Cách dùng PeekabooBridge](/vi/platforms/mac/peekaboo) để biết chi tiết.

## Luồng vận hành

- Khởi động lại/xây dựng lại: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Dừng các phiên bản hiện có
  - Swift build + package
  - Ghi/khởi tạo/kickstart LaunchAgent
- Một phiên bản duy nhất: ứng dụng thoát sớm nếu một phiên bản khác có cùng bundle ID đang chạy.

## Ghi chú gia cố bảo mật

- Ưu tiên yêu cầu TeamID khớp cho mọi bề mặt đặc quyền.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (chỉ DEBUG) có thể cho phép bên gọi cùng UID trong phát triển cục bộ.
- Toàn bộ giao tiếp vẫn chỉ ở cục bộ; không có socket mạng nào được mở.
- Lời nhắc TCC chỉ bắt nguồn từ bundle ứng dụng GUI; giữ bundle ID đã ký ổn định qua các lần xây dựng lại.
- Gia cố IPC: chế độ socket `0600`, token, kiểm tra peer-UID, thử thách/phản hồi HMAC, TTL ngắn.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Luồng IPC macOS (phê duyệt Exec)](/vi/tools/exec-approvals-advanced#macos-ipc-flow)
