---
read_when:
    - Bạn muốn ghép nối nhanh một ứng dụng Node trên thiết bị di động với một Gateway
    - Bạn cần đầu ra setup-code để chia sẻ từ xa/thủ công
summary: Tham chiếu CLI cho `openclaw qr` (tạo mã QR ghép nối di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:36:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo QR ghép nối di động và mã thiết lập từ cấu hình Gateway hiện tại của bạn.

## Cách sử dụng

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Tùy chọn

- `--remote`: ưu tiên `gateway.remote.url`; nếu chưa đặt, `gateway.tailscale.mode=serve|funnel` vẫn có thể cung cấp URL công khai từ xa
- `--url <url>`: ghi đè URL Gateway được dùng trong payload
- `--public-url <url>`: ghi đè URL công khai được dùng trong payload
- `--token <token>`: ghi đè token Gateway mà luồng bootstrap dùng để xác thực
- `--password <password>`: ghi đè mật khẩu Gateway mà luồng bootstrap dùng để xác thực
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc hiển thị QR bằng ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Ghi chú

- `--token` và `--password` loại trừ lẫn nhau.
- Bản thân mã thiết lập hiện mang một `bootstrapToken` ngắn hạn, không rõ nội dung, chứ không phải token/mật khẩu Gateway dùng chung.
- Bootstrap bằng mã thiết lập tích hợp sẵn trả về một token `node` chính với `scopes: []` cùng với một token bàn giao `operator` có giới hạn cho quá trình thiết lập di động đáng tin cậy.
- Token operator được bàn giao bị giới hạn ở `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`; các phạm vi thay đổi ghép nối và `operator.admin` vẫn cần một luồng ghép nối operator hoặc token được phê duyệt riêng.
- Ghép nối di động sẽ từ chối an toàn đối với các URL Gateway Tailscale/công khai dạng `ws://`. Các địa chỉ LAN riêng và máy chủ Bonjour `.local` vẫn được hỗ trợ qua `ws://`, nhưng các tuyến di động Tailscale/công khai nên dùng Tailscale Serve/Funnel hoặc URL Gateway `wss://`.
- Với `--remote`, OpenClaw yêu cầu `gateway.remote.url` hoặc
  `gateway.tailscale.mode=serve|funnel`.
- Với `--remote`, nếu thông tin xác thực từ xa đang thực sự hoạt động được cấu hình dưới dạng SecretRefs và bạn không truyền `--token` hoặc `--password`, lệnh sẽ phân giải chúng từ snapshot Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại nhanh.
- Không có `--remote`, SecretRefs xác thực Gateway cục bộ được phân giải khi không truyền ghi đè xác thực qua CLI:
  - `gateway.auth.token` được phân giải khi xác thực bằng token có thể thắng (đặt rõ `gateway.auth.mode="token"` hoặc chế độ suy luận trong đó không có nguồn mật khẩu nào thắng).
  - `gateway.auth.password` được phân giải khi xác thực bằng mật khẩu có thể thắng (đặt rõ `gateway.auth.mode="password"` hoặc chế độ suy luận không có token thắng từ xác thực/env).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa được đặt, quá trình phân giải mã thiết lập sẽ thất bại cho đến khi chế độ được đặt rõ ràng.
- Ghi chú về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu Gateway hỗ trợ `secrets.resolve`; các Gateway cũ hơn trả về lỗi phương thức không xác định.
- Sau khi quét, phê duyệt ghép nối thiết bị bằng:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép nối](/vi/cli/pairing)
