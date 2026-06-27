---
read_when:
    - Triển khai PeekabooBridge trong OpenClaw.app
    - Tích hợp Peekaboo qua Swift Package Manager
    - Thay đổi giao thức/đường dẫn PeekabooBridge
    - Chọn giữa PeekabooBridge, Codex Computer Use và cua-driver MCP
summary: Tích hợp PeekabooBridge cho tự động hóa giao diện người dùng macOS
title: Cầu nối Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:42:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw có thể lưu trữ **PeekabooBridge** như một broker tự động hóa UI cục bộ, nhận biết quyền. Điều này cho phép CLI `peekaboo` điều khiển tự động hóa UI trong khi tái sử dụng các quyền TCC của ứng dụng macOS.

## Đây là gì (và không phải gì)

- **Máy chủ**: OpenClaw.app có thể hoạt động như một máy chủ PeekabooBridge.
- **Máy khách**: dùng CLI `peekaboo` (không có bề mặt `openclaw ui ...` riêng).
- **UI**: các lớp phủ trực quan vẫn nằm trong Peekaboo.app; OpenClaw là một máy chủ broker mỏng.

## Quan hệ với Computer Use

OpenClaw có ba đường điều khiển desktop, và chúng được cố ý giữ tách biệt:

- **Máy chủ PeekabooBridge**: OpenClaw.app có thể lưu trữ socket PeekabooBridge cục bộ. CLI `peekaboo` vẫn là máy khách và dùng các quyền macOS của OpenClaw.app cho các primitive tự động hóa Peekaboo như ảnh chụp màn hình, cú nhấp, menu, hộp thoại, hành động Dock và quản lý cửa sổ.
- **Codex Computer Use**: Plugin `codex` được đóng gói chuẩn bị app-server của Codex, xác minh rằng máy chủ MCP `computer-use` của Codex khả dụng, rồi để Codex sở hữu các lệnh gọi công cụ điều khiển desktop gốc trong các lượt ở chế độ Codex. OpenClaw không proxy các hành động đó qua PeekabooBridge.
- **MCP `cua-driver` trực tiếp**: OpenClaw có thể đăng ký máy chủ `cua-driver mcp` upstream của TryCua như một máy chủ MCP thông thường. Điều đó cung cấp cho các agent schema riêng của trình điều khiển CUA và quy trình pid/cửa sổ/chỉ mục phần tử mà không định tuyến qua marketplace của Codex hoặc socket PeekabooBridge.

Dùng Peekaboo khi bạn muốn bề mặt tự động hóa macOS rộng và máy chủ bridge nhận biết quyền của OpenClaw.app. Dùng Codex Computer Use khi một agent ở chế độ Codex nên dựa vào Plugin computer-use gốc của Codex. Dùng `cua-driver mcp` trực tiếp khi bạn muốn trình điều khiển CUA được phơi bày cho bất kỳ runtime nào do OpenClaw quản lý như một máy chủ MCP thông thường.

## Bật bridge

Trong ứng dụng macOS:

- Cài đặt → **Bật Peekaboo Bridge**

Khi được bật, OpenClaw khởi động một máy chủ socket UNIX cục bộ. Nếu bị tắt, máy chủ sẽ dừng và `peekaboo` sẽ quay về các máy chủ khả dụng khác.

## Thứ tự khám phá máy khách

Các máy khách Peekaboo thường thử máy chủ theo thứ tự này:

1. Peekaboo.app (UX đầy đủ)
2. Claude.app (nếu đã cài đặt)
3. OpenClaw.app (broker mỏng)

Dùng `peekaboo bridge status --verbose` để xem máy chủ nào đang hoạt động và đường dẫn socket nào đang được sử dụng. Bạn có thể ghi đè bằng:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bảo mật và quyền

- Bridge xác thực **chữ ký mã của bên gọi**; danh sách cho phép TeamID được thực thi (TeamID của máy chủ Peekaboo + TeamID của ứng dụng OpenClaw).
- Ưu tiên danh tính bridge/ứng dụng đã ký thay vì runtime `node` chung cho Accessibility. Cấp Accessibility cho `node` cho phép bất kỳ gói nào được khởi chạy bởi tệp thực thi Node đó kế thừa quyền truy cập tự động hóa GUI; xem [quyền macOS](/vi/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Yêu cầu hết thời gian chờ sau khoảng 10 giây.
- Nếu thiếu các quyền bắt buộc, bridge trả về thông báo lỗi rõ ràng thay vì mở Cài đặt hệ thống.

## Hành vi snapshot (tự động hóa)

Snapshot được lưu trong bộ nhớ và tự động hết hạn sau một khoảng thời gian ngắn. Nếu bạn cần lưu giữ lâu hơn, hãy chụp lại từ máy khách.

## Khắc phục sự cố

- Nếu `peekaboo` báo "bridge client is not authorized", hãy bảo đảm máy khách được ký đúng cách hoặc chỉ chạy máy chủ với `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` trong chế độ **debug**.
- Nếu không tìm thấy máy chủ nào, hãy mở một trong các ứng dụng máy chủ (Peekaboo.app hoặc OpenClaw.app) và xác nhận rằng quyền đã được cấp.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [quyền macOS](/vi/platforms/mac/permissions)
