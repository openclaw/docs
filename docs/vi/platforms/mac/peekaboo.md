---
read_when:
    - Lưu trữ PeekabooBridge trong OpenClaw.app
    - Tích hợp Peekaboo qua Swift Package Manager
    - Thay đổi giao thức/đường dẫn PeekabooBridge
    - Lựa chọn giữa PeekabooBridge, Codex Computer Use và cua-driver MCP
summary: Tích hợp PeekabooBridge để tự động hóa giao diện người dùng macOS
title: Cầu nối Peekaboo
x-i18n:
    generated_at: "2026-07-16T14:50:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw có thể lưu trữ **PeekabooBridge** như một trình môi giới tự động hóa giao diện người dùng cục bộ, có nhận biết quyền (`PeekabooBridgeHostCoordinator`, dựa trên gói Swift `steipete/Peekaboo`). Điều này cho phép CLI `peekaboo` điều khiển quá trình tự động hóa giao diện người dùng trong khi tái sử dụng các quyền TCC của ứng dụng macOS.

## Đây là gì (và không phải là gì)

- **Máy chủ**: OpenClaw.app có thể hoạt động như một máy chủ PeekabooBridge.
- **Máy khách**: CLI `peekaboo` (không có giao diện `openclaw ui ...` riêng).
- **Giao diện người dùng**: các lớp phủ trực quan vẫn nằm trong Peekaboo.app; OpenClaw là một máy chủ môi giới gọn nhẹ.

## Mối quan hệ với các phương thức điều khiển máy tính khác

OpenClaw có bốn phương thức điều khiển máy tính được chủ ý duy trì riêng biệt:

- **Máy chủ PeekabooBridge**: OpenClaw.app lưu trữ socket PeekabooBridge cục bộ. CLI `peekaboo` là máy khách và sử dụng các quyền macOS của OpenClaw.app để chụp ảnh màn hình, nhấp chuột, thao tác với menu, hộp thoại và Dock, cũng như quản lý cửa sổ.
- **Sử dụng máy tính do tác nhân điều khiển (`computer.act`)**: công cụ `computer` tích hợp sẵn của tác nhân Gateway chụp ảnh màn hình qua `screen.snapshot` và điều khiển con trỏ cùng bàn phím thông qua lệnh node nguy hiểm `computer.act`. Một node macOS thực thi `computer.act` trong tiến trình bằng các dịch vụ tự động hóa Peekaboo nhúng mà cầu nối này cung cấp cùng với các primitive CoreGraphics có phạm vi hẹp, mà không đi qua socket PeekabooBridge hoặc CLI `peekaboo`. Xem [Sử dụng máy tính](/vi/nodes/computer-use).
- **Sử dụng máy tính của Codex**: Plugin `codex` đi kèm kiểm tra và có thể cài đặt Plugin MCP `computer-use` của Codex (`extensions/codex/src/app-server/computer-use.ts`), sau đó cho phép Codex sở hữu các lệnh gọi công cụ điều khiển máy tính gốc trong các lượt ở chế độ Codex. OpenClaw không chuyển tiếp các thao tác đó qua PeekabooBridge.
- **MCP `cua-driver` trực tiếp**: OpenClaw có thể đăng ký máy chủ `cua-driver mcp` thượng nguồn của TryCua như một máy chủ MCP thông thường, cung cấp cho các tác nhân các schema riêng của trình điều khiển CUA và quy trình làm việc pid/cửa sổ/chỉ mục phần tử mà không định tuyến qua marketplace Codex hoặc socket PeekabooBridge.

Sử dụng Peekaboo để có phạm vi tự động hóa macOS rộng thông qua máy chủ cầu nối có nhận biết quyền của OpenClaw.app. Sử dụng tính năng sử dụng máy tính do tác nhân điều khiển khi tác nhân Gateway cần quan sát và điều khiển máy tính thông qua một lệnh node `computer.act` thống nhất mà bất kỳ mô hình thị giác nào cũng có thể điều khiển. Sử dụng tính năng Sử dụng máy tính của Codex khi một tác nhân ở chế độ Codex cần dựa vào Plugin gốc của Codex. Sử dụng `cua-driver mcp` trực tiếp để cung cấp trình điều khiển CUA cho bất kỳ runtime nào do OpenClaw quản lý dưới dạng một máy chủ MCP thông thường.

## Bật cầu nối

Trong ứng dụng macOS: **Settings -> Enable Peekaboo Bridge**. Nút chuyển này yêu cầu **Allow Computer Control** phải được bật vì cả hai đều cấp quyền tự động hóa giao diện người dùng cục bộ; khi Computer Control bị tắt, nút chuyển bị vô hiệu hóa và máy chủ không chạy. Để điều khiển Peekaboo mà không cần Computer Control, hãy chạy ứng dụng Mac riêng của Peekaboo làm máy chủ.

Khi được bật (và Computer Control đang bật), OpenClaw khởi động một máy chủ socket UNIX cục bộ tại `~/Library/Application Support/OpenClaw/<socket-name>`. Nếu bị tắt, máy chủ sẽ dừng và `peekaboo` chuyển sang các máy chủ khả dụng khác. Bộ điều phối cũng duy trì các liên kết tượng trưng socket cũ (`clawdbot`, `clawdis`, `moltbot` trong Application Support) trỏ đến socket hiện tại cho các bản cài đặt `peekaboo` cũ hơn.

## Thứ tự khám phá máy chủ của máy khách

Các máy khách Peekaboo thường thử các máy chủ theo thứ tự sau:

1. Peekaboo.app (trải nghiệm người dùng đầy đủ)
2. Claude.app (nếu đã cài đặt)
3. OpenClaw.app (trình môi giới gọn nhẹ)

Sử dụng `peekaboo bridge status --verbose` để xem máy chủ nào đang hoạt động và đường dẫn socket nào đang được sử dụng. Ghi đè bằng:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bảo mật và quyền

- Cầu nối xác thực **chữ ký mã của bên gọi**; danh sách cho phép gồm các TeamID được thực thi (TeamID của máy chủ Peekaboo cùng với TeamID riêng của ứng dụng đang chạy).
- Nên ưu tiên danh tính cầu nối/ứng dụng đã ký thay vì runtime `node` chung cho quyền Accessibility. Việc cấp quyền Accessibility cho `node` cho phép bất kỳ gói nào được khởi chạy bởi tệp thực thi Node đó kế thừa quyền truy cập tự động hóa GUI; xem [quyền macOS](/vi/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Các yêu cầu hết thời gian chờ sau 10 giây (`requestTimeoutSec: 10`).
- Nếu thiếu các quyền bắt buộc, cầu nối sẽ trả về thông báo lỗi rõ ràng thay vì khởi chạy System Settings.

## Hành vi của ảnh chụp nhanh (tự động hóa)

Ảnh chụp nhanh được lưu trong bộ nhớ với thời hạn hiệu lực 10 phút và giới hạn 50 ảnh chụp nhanh (`InMemorySnapshotManager`); các artifact không bị xóa khi dọn dẹp. Nếu cần lưu giữ lâu hơn, hãy chụp lại từ máy khách.

## Khắc phục sự cố

- Nếu `peekaboo` báo cáo "máy khách cầu nối không được ủy quyền", hãy đảm bảo máy khách được ký đúng cách hoặc chỉ chạy máy chủ với `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ở chế độ **debug**.
- Nếu không tìm thấy máy chủ nào, hãy mở một trong các ứng dụng máy chủ (Peekaboo.app hoặc OpenClaw.app) và xác nhận rằng các quyền đã được cấp.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Quyền macOS](/vi/platforms/mac/permissions)
