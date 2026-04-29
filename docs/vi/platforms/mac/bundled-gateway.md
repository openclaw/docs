---
read_when:
    - Đóng gói OpenClaw.app
    - Gỡ lỗi dịch vụ launchd Gateway trên macOS
    - Cài đặt Gateway CLI cho macOS
summary: Môi trường chạy Gateway trên macOS (dịch vụ launchd bên ngoài)
title: Gateway trên macOS
x-i18n:
    generated_at: "2026-04-29T22:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app không còn đóng gói kèm Node/Bun hoặc thời gian chạy Gateway. Ứng dụng macOS
yêu cầu cài đặt CLI `openclaw` **bên ngoài**, không tạo Gateway dưới dạng
tiến trình con, và quản lý dịch vụ launchd theo từng người dùng để giữ Gateway
luôn chạy (hoặc gắn vào Gateway cục bộ hiện có nếu đã có một Gateway đang chạy).

## Cài đặt CLI (bắt buộc cho chế độ cục bộ)

Node 24 là thời gian chạy mặc định trên Mac. Node 22 LTS, hiện là `22.14+`, vẫn hoạt động để tương thích. Sau đó cài đặt `openclaw` toàn cục:

```bash
npm install -g openclaw@<version>
```

Nút **Cài đặt CLI** của ứng dụng macOS chạy cùng quy trình cài đặt toàn cục mà ứng dụng
dùng nội bộ: ưu tiên npm trước, rồi pnpm, rồi bun nếu đó là trình quản lý gói duy nhất
được phát hiện. Node vẫn là thời gian chạy Gateway được khuyến nghị.

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

- “OpenClaw Đang hoạt động” bật/tắt LaunchAgent.
- Thoát ứng dụng **không** dừng Gateway (launchd giữ nó hoạt động).
- Nếu một Gateway đã chạy trên cổng đã cấu hình, ứng dụng sẽ gắn vào
  Gateway đó thay vì khởi động Gateway mới.

Ghi nhật ký:

- stdout/err của launchd: `/tmp/openclaw/openclaw-gateway.log`

## Tương thích phiên bản

Ứng dụng macOS kiểm tra phiên bản Gateway so với phiên bản của chính nó. Nếu chúng
không tương thích, hãy cập nhật CLI toàn cục để khớp với phiên bản ứng dụng.

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

- [Ứng dụng macOS](/vi/platforms/macos)
- [Runbook Gateway](/vi/gateway)
