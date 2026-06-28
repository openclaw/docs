---
read_when:
    - Đóng gói OpenClaw.app
    - Gỡ lỗi dịch vụ launchd của Gateway trên macOS
    - Cài đặt CLI Gateway cho macOS
summary: Thời gian chạy Gateway trên macOS (dịch vụ launchd bên ngoài)
title: Gateway trên macOS
x-i18n:
    generated_at: "2026-06-28T00:12:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app không còn đóng gói Node/Bun hoặc runtime Gateway. Ứng dụng macOS
yêu cầu cài đặt CLI `openclaw` **bên ngoài**, không sinh Gateway dưới dạng
tiến trình con, và quản lý một dịch vụ launchd theo từng người dùng để giữ Gateway
đang chạy (hoặc gắn vào một Gateway cục bộ hiện có nếu đã có một Gateway đang chạy).

## Cài đặt CLI (bắt buộc cho chế độ cục bộ)

Node 24 là runtime mặc định trên Mac. Node 22 LTS, hiện là `22.19+`, vẫn hoạt động để tương thích. Sau đó cài đặt `openclaw` toàn cục:

```bash
npm install -g openclaw@<version>
```

Nút **Cài đặt CLI** của ứng dụng macOS chạy cùng luồng cài đặt toàn cục mà ứng dụng
dùng nội bộ: ưu tiên npm trước, sau đó pnpm, rồi bun nếu đó là trình quản lý gói
duy nhất được phát hiện. Node vẫn là runtime Gateway được khuyến nghị.

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

- "OpenClaw Active" bật/tắt LaunchAgent.
- Thoát ứng dụng **không** dừng gateway (launchd giữ nó hoạt động).
- Nếu một Gateway đã chạy trên cổng đã cấu hình, ứng dụng sẽ gắn vào
  đó thay vì khởi động một Gateway mới.

Ghi nhật ký:

- stdout của launchd: `~/Library/Logs/openclaw/gateway.log` (hồ sơ dùng `gateway-<profile>.log`)
- stderr của launchd: bị tắt

## Khả năng tương thích phiên bản

Ứng dụng macOS kiểm tra phiên bản gateway với phiên bản của chính nó. Nếu chúng
không tương thích, hãy cập nhật CLI toàn cục để khớp với phiên bản ứng dụng.

## Thư mục trạng thái trên macOS

Giữ trạng thái OpenClaw trên ổ đĩa cục bộ, không đồng bộ. Tránh iCloud Drive và các
thư mục đồng bộ qua đám mây khác vì độ trễ đồng bộ và khóa tệp có thể ảnh hưởng đến phiên,
thông tin xác thực, và trạng thái Gateway.

Chỉ đặt `OPENCLAW_STATE_DIR` thành đường dẫn cục bộ khi bạn cần ghi đè.
`openclaw doctor` cảnh báo về các đường dẫn trạng thái thường đồng bộ qua đám mây và khuyến nghị
chuyển lại về lưu trữ cục bộ. Xem
[biến môi trường](/vi/help/environment#path-related-env-vars) và
[Doctor](/vi/gateway/doctor).

## Gỡ lỗi kết nối ứng dụng

Dùng CLI gỡ lỗi macOS từ một checkout mã nguồn để thực thi cùng logic bắt tay
WebSocket Gateway và khám phá mà ứng dụng sử dụng:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` chấp nhận `--url`, `--token`, `--timeout`, và `--json`. `discover`
chấp nhận `--timeout`, `--json`, và `--include-local`. So sánh đầu ra khám phá
với `openclaw gateway discover --json` khi bạn cần tách khám phá của CLI
khỏi các vấn đề kết nối phía ứng dụng.

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

- [ứng dụng macOS](/vi/platforms/macos)
- [runbook Gateway](/vi/gateway)
