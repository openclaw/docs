---
read_when:
    - Chỉnh sửa các hợp đồng IPC hoặc IPC của ứng dụng thanh menu
summary: Kiến trúc IPC trên macOS cho ứng dụng OpenClaw, giao thức truyền tải Node của Gateway và PeekabooBridge
title: IPC trên macOS
x-i18n:
    generated_at: "2026-07-12T08:08:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Kiến trúc IPC của OpenClaw trên macOS

Một socket Unix cục bộ kết nối dịch vụ máy chủ Node với ứng dụng macOS để phê duyệt việc thực thi và `system.run`. CLI gỡ lỗi `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) được cung cấp để kiểm tra khả năng phát hiện/kết nối; các hành động của tác tử vẫn đi qua WebSocket của Gateway và `node.invoke`. Luồng `computer.act` dựa trên Node chạy tính năng tự động hóa Peekaboo nhúng ngay trong tiến trình; các ứng dụng khách Peekaboo độc lập sử dụng PeekabooBridge.

## Mục tiêu

- Một phiên bản ứng dụng GUI duy nhất sở hữu toàn bộ công việc liên quan đến TCC (thông báo, ghi màn hình, micrô, giọng nói, AppleScript).
- Một bề mặt nhỏ gọn dành cho tự động hóa: Gateway + các lệnh Node, `computer.act` trong tiến trình, cùng với PeekabooBridge dành cho các ứng dụng khách tự động hóa giao diện người dùng độc lập.
- Quyền có thể dự đoán: luôn dùng cùng một ID gói đã ký, được launchd khởi chạy, để các quyền TCC được duy trì.

## Cách hoạt động

### Gateway + cơ chế truyền tải Node

- Ứng dụng chạy Gateway (chế độ cục bộ) và kết nối với Gateway dưới dạng một Node.
- Các hành động của tác tử được thực hiện qua `node.invoke` (ví dụ: `system.run`, `system.notify`, `canvas.*`).
- Các lệnh Node bao gồm `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` và `system.notify`.
- Node báo cáo một ánh xạ `permissions` để các tác tử có thể biết liệu quyền truy cập màn hình, camera, micrô, giọng nói, tự động hóa hoặc trợ năng có khả dụng hay không.

### Dịch vụ Node + IPC của ứng dụng

- Một dịch vụ máy chủ Node không giao diện kết nối với WebSocket của Gateway.
- Các yêu cầu `system.run` được chuyển tiếp đến ứng dụng macOS qua một socket Unix cục bộ (`ExecApprovalsSocket.swift`).
- Ứng dụng thực hiện lệnh trong ngữ cảnh giao diện người dùng, nhắc xác nhận nếu cần và trả về đầu ra.

Sơ đồ (SCI):

```text
Tác tử -> Gateway -> Dịch vụ Node (WS)
                         |  IPC (UDS + mã thông báo + HMAC + TTL)
                         v
                     Ứng dụng Mac (UI + TCC + system.run)
```

### PeekabooBridge (tự động hóa giao diện người dùng)

- Công cụ `computer` tích hợp sẵn của tác tử **không** sử dụng socket này. Một Node macOS đã ghép đôi thực hiện `computer.act` trong tiến trình ứng dụng bằng các dịch vụ Peekaboo nhúng.
- Tính năng tự động hóa giao diện người dùng sử dụng một socket UNIX riêng (`~/Library/Application Support/OpenClaw/<socket>`) và giao thức JSON của PeekabooBridge.
- Thứ tự ưu tiên máy chủ (phía ứng dụng khách): Peekaboo.app -> Claude.app -> OpenClaw.app -> thực thi cục bộ.
- Bảo mật: các máy chủ cầu nối yêu cầu TeamID nằm trong danh sách cho phép (`PeekabooBridgeHostCoordinator` đi kèm cho phép một nhóm cố định cùng nhóm ký của chính ứng dụng); một lối thoát chỉ dành cho DEBUG để chấp nhận cùng UID được bảo vệ bằng `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (quy ước của Peekaboo).
- Xem: [Cách sử dụng PeekabooBridge](/vi/platforms/mac/peekaboo) để biết chi tiết.

## Luồng vận hành

- Khởi động lại/biên dịch lại: `scripts/restart-mac.sh` dừng các phiên bản hiện có, biên dịch lại bằng Swift, đóng gói lại và khởi chạy lại. Tập lệnh tự động phát hiện danh tính ký khả dụng và chuyển sang `--no-sign` nếu không tìm thấy; truyền `--sign` để bắt buộc ký (sẽ thất bại nếu không có khóa) hoặc `--no-sign` để bắt buộc dùng luồng không ký. Biến `SIGN_IDENTITY` được đặt trong môi trường sẽ bị bỏ đặt trên luồng có ký, để cơ chế tự động phát hiện danh tính của chính `scripts/codesign-mac-app.sh` chọn chứng chỉ.
- Một phiên bản duy nhất: ứng dụng kiểm tra `NSWorkspace.runningApplications` để tìm ID gói trùng lặp và thoát nếu phát hiện nhiều hơn một phiên bản (`isDuplicateInstance()` trong `MenuBar.swift`).

## Ghi chú tăng cường bảo mật

- Ưu tiên yêu cầu TeamID khớp trên tất cả các bề mặt đặc quyền.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (chỉ dành cho DEBUG) có thể cho phép các bên gọi cùng UID phục vụ phát triển cục bộ.
- Toàn bộ giao tiếp chỉ diễn ra cục bộ; không có socket mạng nào được mở ra bên ngoài.
- Lời nhắc TCC chỉ bắt nguồn từ gói ứng dụng GUI; hãy giữ ổn định ID gói đã ký giữa các lần biên dịch lại.
- Tăng cường bảo mật cho socket phê duyệt thực thi: chế độ tệp `0600`, mã thông báo dùng chung, kiểm tra UID của bên ngang hàng (`getpeereid`), cơ chế thử thách/phản hồi HMAC-SHA256 và TTL ngắn cho các yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Luồng IPC trên macOS (Phê duyệt thực thi)](/vi/tools/exec-approvals-advanced#macos-ipc-flow)
