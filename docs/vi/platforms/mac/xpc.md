---
read_when:
    - Chỉnh sửa hợp đồng IPC hoặc IPC của ứng dụng thanh menu
summary: Kiến trúc IPC trên macOS cho ứng dụng OpenClaw, phương thức truyền tải nút Gateway và PeekabooBridge
title: IPC trên macOS
x-i18n:
    generated_at: "2026-04-29T22:58:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Kiến trúc IPC macOS của OpenClaw

**Mô hình hiện tại:** một Unix socket cục bộ kết nối **dịch vụ host Node** với **ứng dụng macOS** để phê duyệt exec + `system.run`. CLI gỡ lỗi `openclaw-mac` tồn tại để kiểm tra khám phá/kết nối; hành động của agent vẫn đi qua Gateway WebSocket và `node.invoke`. Tự động hóa UI dùng PeekabooBridge.

## Mục tiêu

- Một phiên bản ứng dụng GUI duy nhất sở hữu mọi công việc liên quan đến TCC (thông báo, ghi màn hình, mic, giọng nói, AppleScript).
- Một bề mặt nhỏ cho tự động hóa: Gateway + lệnh Node, cùng với PeekabooBridge cho tự động hóa UI.
- Quyền có thể dự đoán: luôn cùng một ID bundle đã ký, được launchd khởi chạy, để cấp quyền TCC được giữ nguyên.

## Cách hoạt động

### Gateway + truyền tải Node

- Ứng dụng chạy Gateway (chế độ cục bộ) và kết nối với nó như một Node.
- Hành động của agent được thực hiện qua `node.invoke` (ví dụ: `system.run`, `system.notify`, `canvas.*`).

### Dịch vụ Node + IPC ứng dụng

- Một dịch vụ host Node không giao diện kết nối với Gateway WebSocket.
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

- Tự động hóa UI dùng một UNIX socket riêng có tên `bridge.sock` và giao thức JSON PeekabooBridge.
- Thứ tự ưu tiên host (phía client): Peekaboo.app → Claude.app → OpenClaw.app → thực thi cục bộ.
- Bảo mật: các host bridge yêu cầu TeamID được cho phép; lối thoát cùng UID chỉ dành cho DEBUG được bảo vệ bằng `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (quy ước Peekaboo).
- Xem: [Cách dùng PeekabooBridge](/vi/platforms/mac/peekaboo) để biết chi tiết.

## Luồng vận hành

- Khởi động lại/xây dựng lại: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Dừng các phiên bản hiện có
  - Swift build + package
  - Ghi/bootstrap/kickstart LaunchAgent
- Một phiên bản duy nhất: ứng dụng thoát sớm nếu một phiên bản khác có cùng ID bundle đang chạy.

## Ghi chú gia cố

- Ưu tiên yêu cầu khớp TeamID cho mọi bề mặt đặc quyền.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (chỉ DEBUG) có thể cho phép trình gọi cùng UID trong phát triển cục bộ.
- Mọi giao tiếp vẫn chỉ cục bộ; không socket mạng nào được mở.
- Lời nhắc TCC chỉ bắt nguồn từ bundle ứng dụng GUI; giữ ID bundle đã ký ổn định qua các lần xây dựng lại.
- Gia cố IPC: chế độ socket `0600`, token, kiểm tra UID ngang hàng, thử thách/phản hồi HMAC, TTL ngắn.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Luồng IPC macOS (phê duyệt exec)](/vi/tools/exec-approvals-advanced#macos-ipc-flow)
