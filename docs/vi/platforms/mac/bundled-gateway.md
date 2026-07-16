---
read_when:
    - Đóng gói OpenClaw.app
    - Gỡ lỗi dịch vụ Gateway launchd trên macOS
    - Cài đặt CLI Gateway cho macOS
summary: Môi trường chạy Gateway trên macOS (dịch vụ launchd bên ngoài)
title: Gateway trên macOS
x-i18n:
    generated_at: "2026-07-16T15:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app không đóng gói kèm Node hoặc runtime Gateway. Ứng dụng macOS
yêu cầu bản cài đặt CLI `openclaw` **bên ngoài**, không khởi chạy Gateway dưới dạng
tiến trình con và quản lý một dịch vụ launchd riêng cho từng người dùng để duy trì Gateway
hoạt động (hoặc kết nối với một Gateway cục bộ đang chạy).

## Thiết lập tự động

Trên máy Mac mới, chọn **This Mac** trong quá trình làm quen ban đầu. Ứng dụng chạy
tập lệnh cài đặt đã ký và được đóng gói kèm trước trình hướng dẫn Gateway: tập lệnh cài đặt
runtime Node trong không gian người dùng và CLI `openclaw` tương ứng vào `~/.openclaw`,
sau đó cài đặt và khởi động dịch vụ launchd riêng cho người dùng. Quy trình này không cần
Terminal, Homebrew hoặc quyền quản trị viên.

Ứng dụng chỉ đóng gói kèm tập lệnh cài đặt, không bao gồm gói tải Node hoặc Gateway;
quá trình thiết lập cần kết nối Internet để tải runtime và gói
OpenClaw tương ứng.

## Khôi phục thủ công

Khuyến nghị Node 24.15+ khi cài đặt thủ công; Node 22.22.3+ cũng hoạt động. Cài đặt
`openclaw` ở phạm vi toàn cục:

```bash
npm install -g openclaw@<version>
```

Sử dụng **Retry setup** sau khi thiết lập tự động không thành công. Nếu vẫn thất bại,
hãy cài đặt CLI thủ công bằng lệnh trên, sau đó chọn **Check again**
trong quá trình làm quen ban đầu.

## Launchd (Gateway dưới dạng LaunchAgent)

Nhãn: `ai.openclaw.gateway` (hồ sơ mặc định), hoặc `ai.openclaw.<profile>`
cho hồ sơ có tên.

Vị trí plist (riêng cho từng người dùng): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(hoặc `ai.openclaw.<profile>.plist`).

Ứng dụng macOS quản lý việc cài đặt/cập nhật LaunchAgent cho hồ sơ mặc định ở
chế độ Local. CLI cũng có thể cài đặt trực tiếp: `openclaw gateway install`
(các hồ sơ có tên được chọn thông qua biến môi trường `OPENCLAW_PROFILE`).

Hành vi:

- "OpenClaw Active" bật/tắt LaunchAgent.
- Thoát ứng dụng **không** dừng Gateway (launchd duy trì Gateway hoạt động).
- Nếu một Gateway đã chạy trên cổng đã cấu hình, ứng dụng sẽ kết nối với
  Gateway đó thay vì khởi động một Gateway mới.

Ghi nhật ký:

- stdout của launchd: `~/Library/Logs/openclaw/gateway.log` (các hồ sơ sử dụng
  `gateway-<profile>.log`)
- stderr của launchd: bị loại bỏ
- Nếu máy chủ lặp lại `EADDRINUSE` hoặc khởi động lại nhanh nhiều lần, hãy kiểm tra
  các LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` trùng lặp và giải pháp tạm thời
  cho dấu mốc launchd trong
  [khắc phục sự cố Gateway](/vi/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Khả năng tương thích phiên bản

Ứng dụng macOS kiểm tra phiên bản Gateway so với phiên bản của chính ứng dụng. Quá trình làm quen ban đầu
tự động chạy thiết lập được quản lý khi CLI hiện có bị thiếu hoặc
không tương thích. Sử dụng **Retry setup** để lặp lại quá trình cài đặt hoặc **Check again**
sau khi sửa chữa CLI bên ngoài.

## Thư mục trạng thái trên macOS

Giữ trạng thái OpenClaw trên ổ đĩa cục bộ không đồng bộ hóa. Tránh iCloud Drive và các
thư mục đồng bộ hóa đám mây khác; độ trễ đồng bộ hóa và khóa tệp có thể ảnh hưởng đến phiên,
thông tin xác thực và trạng thái Gateway.

Chỉ đặt `OPENCLAW_STATE_DIR` thành một đường dẫn cục bộ khi cần ghi đè.
`openclaw doctor` cảnh báo về các đường dẫn trạng thái thường được đồng bộ hóa qua đám mây và khuyến nghị
chuyển về bộ nhớ cục bộ. Xem
[các biến môi trường](/vi/help/environment#path-related-env-vars) và
[Doctor](/vi/gateway/doctor).

## Gỡ lỗi kết nối ứng dụng

Sử dụng CLI gỡ lỗi macOS từ bản sao mã nguồn để thực hiện cùng quy trình bắt tay
WebSocket Gateway và logic khám phá mà ứng dụng sử dụng:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` chấp nhận `--url`, `--token`, `--timeout`, `--probe` và `--json`
(cùng các tùy chọn ghi đè danh tính máy khách; chạy với `--help` để xem danh sách đầy đủ).
`discover` chấp nhận `--timeout`, `--json` và `--include-local`. So sánh
kết quả khám phá với `openclaw gateway discover --json` khi cần
phân biệt sự cố khám phá của CLI với sự cố kết nối phía ứng dụng.

## Kiểm tra nhanh

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Sau đó:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Cẩm nang vận hành Gateway](/vi/gateway)
