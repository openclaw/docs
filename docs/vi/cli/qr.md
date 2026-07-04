---
read_when:
    - Bạn muốn ghép nối nhanh một ứng dụng node di động với Gateway
    - Bạn cần đầu ra setup-code để chia sẻ từ xa/thủ công
summary: Tham chiếu CLI cho `openclaw qr` (tạo mã QR ghép nối di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:06:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo QR ghép đôi di động và mã thiết lập từ cấu hình Gateway hiện tại của bạn.

## Cách dùng

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Tùy chọn

- `--remote`: ưu tiên `gateway.remote.url`; nếu chưa đặt, `gateway.tailscale.mode=serve|funnel` vẫn có thể cung cấp URL công khai từ xa
- `--url <url>`: ghi đè URL Gateway dùng trong payload
- `--public-url <url>`: ghi đè URL công khai dùng trong payload
- `--token <token>`: ghi đè token Gateway mà luồng bootstrap dùng để xác thực
- `--password <password>`: ghi đè mật khẩu Gateway mà luồng bootstrap dùng để xác thực
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc render QR ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Ghi chú

- `--token` và `--password` loại trừ lẫn nhau.
- Bản thân mã thiết lập hiện mang một `bootstrapToken` mờ, tồn tại ngắn hạn, không phải token/mật khẩu Gateway dùng chung.
- Bootstrap bằng mã thiết lập tích hợp sẵn trả về token `node` chính với `scopes: []` cộng với token bàn giao `operator` có giới hạn cho quá trình onboarding di động đáng tin cậy.
- Token operator được bàn giao chỉ giới hạn ở `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`; các scope thay đổi ghép đôi và `operator.admin` vẫn yêu cầu một luồng token hoặc ghép đôi operator riêng đã được phê duyệt.
- Ghép đôi di động thất bại theo hướng đóng đối với URL Gateway Tailscale/công khai dạng `ws://`. Địa chỉ LAN riêng và host Bonjour `.local` vẫn được hỗ trợ qua `ws://`, nhưng các tuyến di động Tailscale/công khai nên dùng Tailscale Serve/Funnel hoặc URL Gateway `wss://`.
- Với `--remote`, OpenClaw yêu cầu `gateway.remote.url` hoặc
  `gateway.tailscale.mode=serve|funnel`.
- Với `--remote`, nếu thông tin xác thực từ xa đang thực sự hoạt động được cấu hình dưới dạng SecretRefs và bạn không truyền `--token` hoặc `--password`, lệnh sẽ phân giải chúng từ snapshot Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại nhanh.
- Không có `--remote`, SecretRefs xác thực Gateway cục bộ được phân giải khi không truyền ghi đè xác thực qua CLI:
  - `gateway.auth.token` được phân giải khi xác thực bằng token có thể thắng (đặt rõ `gateway.auth.mode="token"` hoặc chế độ được suy luận khi không có nguồn mật khẩu nào thắng).
  - `gateway.auth.password` được phân giải khi xác thực bằng mật khẩu có thể thắng (đặt rõ `gateway.auth.mode="password"` hoặc chế độ được suy luận khi không có token thắng từ auth/env).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa đặt, việc phân giải mã thiết lập sẽ thất bại cho đến khi chế độ được đặt rõ ràng.
- Lưu ý về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu Gateway hỗ trợ `secrets.resolve`; các Gateway cũ hơn trả về lỗi phương thức không xác định.
- Ứng dụng OpenClaw chính thức cho iOS và Android tự động kết nối khi metadata
  mã thiết lập của chúng khớp. Nếu một yêu cầu vẫn đang chờ xử lý (ví dụ: với
  client không chính thức hoặc metadata không khớp), hãy xem lại và phê duyệt bằng:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép đôi](/vi/cli/pairing)
