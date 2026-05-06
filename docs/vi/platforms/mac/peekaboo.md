---
read_when:
    - Lưu trữ PeekabooBridge trong OpenClaw.app
    - Tích hợp Peekaboo qua Swift Package Manager
    - Thay đổi giao thức/đường dẫn của PeekabooBridge
    - Lựa chọn giữa PeekabooBridge, Codex Computer Use và cua-driver MCP
summary: Tích hợp PeekabooBridge cho tự động hóa giao diện người dùng trên macOS
title: Cầu nối Peekaboo
x-i18n:
    generated_at: "2026-05-06T09:22:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw có thể lưu trữ **PeekabooBridge** dưới dạng một môi giới tự động hóa UI cục bộ, nhận biết quyền. Điều này cho phép CLI `peekaboo` điều khiển tự động hóa UI trong khi tái sử dụng các quyền TCC của ứng dụng macOS.

## Đây là gì (và không phải là gì)

- **Máy chủ**: OpenClaw.app có thể hoạt động như một máy chủ PeekabooBridge.
- **Máy khách**: dùng CLI `peekaboo` (không có bề mặt `openclaw ui ...` riêng).
- **UI**: các lớp phủ trực quan vẫn nằm trong Peekaboo.app; OpenClaw là một máy chủ môi giới mỏng.

## Mối quan hệ với Computer Use

OpenClaw có ba đường dẫn điều khiển máy tính để bàn, và chúng được chủ ý giữ riêng biệt:

- **Máy chủ PeekabooBridge**: OpenClaw.app có thể lưu trữ socket PeekabooBridge cục bộ. CLI `peekaboo` vẫn là máy khách và dùng các quyền macOS của OpenClaw.app cho các nguyên hàm tự động hóa Peekaboo như ảnh chụp màn hình, nhấp chuột, menu, hộp thoại, thao tác Dock và quản lý cửa sổ.
- **Codex Computer Use**: Plugin `codex` đi kèm chuẩn bị máy chủ ứng dụng Codex, xác minh rằng máy chủ MCP `computer-use` của Codex có sẵn, rồi cho phép Codex sở hữu các lệnh gọi công cụ điều khiển máy tính để bàn gốc trong các lượt chế độ Codex. OpenClaw không proxy các thao tác đó qua PeekabooBridge.
- **MCP `cua-driver` trực tiếp**: OpenClaw có thể đăng ký máy chủ `cua-driver mcp` upstream của TryCua như một máy chủ MCP thông thường. Điều đó cung cấp cho agent các schema riêng của trình điều khiển CUA và quy trình pid/cửa sổ/chỉ mục phần tử mà không định tuyến qua marketplace của Codex hoặc socket PeekabooBridge.

Dùng Peekaboo khi bạn muốn bề mặt tự động hóa macOS rộng và máy chủ cầu nối nhận biết quyền của OpenClaw.app. Dùng Codex Computer Use khi một agent ở chế độ Codex nên dựa vào Plugin computer-use gốc của Codex. Dùng `cua-driver mcp` trực tiếp khi bạn muốn trình điều khiển CUA được cung cấp cho bất kỳ runtime nào do OpenClaw quản lý như một máy chủ MCP thông thường.

## Bật cầu nối

Trong ứng dụng macOS:

- Cài đặt → **Bật Peekaboo Bridge**

Khi được bật, OpenClaw khởi động một máy chủ socket UNIX cục bộ. Nếu bị tắt, máy chủ sẽ dừng và `peekaboo` sẽ quay về các máy chủ khả dụng khác.

## Thứ tự khám phá máy khách

Các máy khách Peekaboo thường thử máy chủ theo thứ tự này:

1. Peekaboo.app (UX đầy đủ)
2. Claude.app (nếu đã cài đặt)
3. OpenClaw.app (môi giới mỏng)

Dùng `peekaboo bridge status --verbose` để xem máy chủ nào đang hoạt động và đường dẫn socket nào đang được dùng. Bạn có thể ghi đè bằng:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bảo mật và quyền

- Cầu nối xác thực **chữ ký mã của bên gọi**; danh sách cho phép gồm các TeamID được thực thi (TeamID của máy chủ Peekaboo + TeamID của ứng dụng OpenClaw).
- Yêu cầu hết thời gian chờ sau khoảng 10 giây.
- Nếu thiếu quyền bắt buộc, cầu nối trả về một thông báo lỗi rõ ràng thay vì khởi chạy Cài đặt hệ thống.

## Hành vi snapshot (tự động hóa)

Snapshot được lưu trong bộ nhớ và tự động hết hạn sau một khoảng thời gian ngắn. Nếu bạn cần giữ lâu hơn, hãy chụp lại từ máy khách.

## Khắc phục sự cố

- Nếu `peekaboo` báo "bridge client is not authorized", hãy đảm bảo máy khách được ký đúng cách hoặc chỉ chạy máy chủ với `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ở chế độ **gỡ lỗi**.
- Nếu không tìm thấy máy chủ nào, hãy mở một trong các ứng dụng máy chủ (Peekaboo.app hoặc OpenClaw.app) và xác nhận các quyền đã được cấp.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Quyền macOS](/vi/platforms/mac/permissions)
