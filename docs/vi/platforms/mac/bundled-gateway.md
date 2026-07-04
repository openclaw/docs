---
read_when:
    - Đóng gói OpenClaw.app
    - Gỡ lỗi dịch vụ launchd của Gateway trên macOS
    - Cài đặt CLI Gateway cho macOS
summary: Môi trường chạy Gateway trên macOS (dịch vụ launchd bên ngoài)
title: Gateway trên macOS
x-i18n:
    generated_at: "2026-07-04T06:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app không còn đóng gói Node/Bun hoặc runtime Gateway. Ứng dụng macOS
yêu cầu một bản cài đặt CLI `openclaw` **bên ngoài**, không khởi chạy Gateway như
một tiến trình con, và quản lý một dịch vụ launchd theo từng người dùng để giữ Gateway
luôn chạy (hoặc gắn vào một Gateway cục bộ hiện có nếu đã có Gateway đang chạy).

## Thiết lập tự động

Trên một máy Mac mới, chọn **Máy Mac này** trong quá trình onboarding. Ứng dụng chạy
trình cài đặt đã ký, được đóng gói sẵn trước trình hướng dẫn Gateway, cài đặt runtime Node
trong không gian người dùng và CLI `openclaw` tương ứng dưới `~/.openclaw`, sau đó cài đặt và khởi động
dịch vụ launchd theo từng người dùng. Luồng này không yêu cầu Terminal, Homebrew hoặc
quyền quản trị viên.

Ứng dụng đóng gói script cài đặt, không phải payload Node hoặc Gateway. Vì vậy,
thiết lập cần có kết nối internet để tải runtime và gói OpenClaw tương ứng.

## Khôi phục thủ công

Node 24 được khuyến nghị cho cài đặt thủ công. Node 22 LTS, hiện là `22.19+`,
cũng hoạt động. Sau đó cài đặt `openclaw` toàn cục:

```bash
npm install -g openclaw@<version>
```

Dùng **Thử lại thiết lập** sau khi thiết lập tự động thất bại. Nếu vẫn thất bại, hãy cài đặt
CLI thủ công bằng lệnh ở trên, rồi chọn **Kiểm tra lại** trong
onboarding. Node vẫn là runtime Gateway được khuyến nghị.

## Launchd (Gateway dưới dạng LaunchAgent)

Nhãn:

- `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; `com.openclaw.*` cũ có thể vẫn còn)

Vị trí plist (theo từng người dùng):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (hoặc `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Trình quản lý:

- Ứng dụng macOS sở hữu việc cài đặt/cập nhật LaunchAgent trong chế độ Cục bộ.
- CLI cũng có thể cài đặt nó: `openclaw gateway install`.

Hành vi:

- "OpenClaw Đang hoạt động" bật/tắt LaunchAgent.
- Thoát ứng dụng **không** dừng gateway (launchd giữ cho nó tiếp tục chạy).
- Nếu đã có Gateway đang chạy trên cổng đã cấu hình, ứng dụng sẽ gắn vào
  Gateway đó thay vì khởi động một Gateway mới.

Ghi log:

- stdout của launchd: `~/Library/Logs/openclaw/gateway.log` (profile dùng `gateway-<profile>.log`)
- stderr của launchd: bị chặn

## Tương thích phiên bản

Ứng dụng macOS kiểm tra phiên bản Gateway so với phiên bản của chính nó. Onboarding
tự động chạy thiết lập được quản lý khi thiếu CLI hiện có hoặc CLI đó
không tương thích. Dùng **Thử lại thiết lập** để lặp lại quá trình cài đặt hoặc **Kiểm tra lại**
sau khi sửa một CLI bên ngoài.

## Thư mục trạng thái trên macOS

Giữ trạng thái OpenClaw trên một ổ đĩa cục bộ, không đồng bộ. Tránh iCloud Drive và các
thư mục được đồng bộ qua đám mây khác vì độ trễ đồng bộ và khóa tệp có thể ảnh hưởng đến phiên,
thông tin xác thực và trạng thái Gateway.

Chỉ đặt `OPENCLAW_STATE_DIR` thành một đường dẫn cục bộ khi bạn cần ghi đè.
`openclaw doctor` cảnh báo về các đường dẫn trạng thái thường được đồng bộ qua đám mây và khuyến nghị
chuyển lại về bộ nhớ cục bộ. Xem
[biến môi trường](/vi/help/environment#path-related-env-vars) và
[Doctor](/vi/gateway/doctor).

## Gỡ lỗi kết nối ứng dụng

Dùng CLI gỡ lỗi macOS từ một source checkout để kiểm tra cùng logic bắt tay Gateway
WebSocket và khám phá mà ứng dụng sử dụng:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` chấp nhận `--url`, `--token`, `--timeout` và `--json`. `discover`
chấp nhận `--timeout`, `--json` và `--include-local`. So sánh đầu ra khám phá
với `openclaw gateway discover --json` khi bạn cần tách biệt khám phá của CLI
khỏi các vấn đề kết nối phía ứng dụng.

## Kiểm tra smoke

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

- [ứng dụng macOS](/vi/platforms/macos)
- [Runbook Gateway](/vi/gateway)
