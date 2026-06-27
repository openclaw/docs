---
read_when:
    - Bạn muốn ghép nối nhanh một ứng dụng node di động với một gateway
    - Bạn cần đầu ra mã thiết lập để chia sẻ từ xa/thủ công
summary: Tham chiếu CLI cho `openclaw qr` (tạo mã QR ghép đôi di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:20:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo mã QR ghép nối di động và mã thiết lập từ cấu hình Gateway hiện tại của bạn.

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
- `--url <url>`: ghi đè URL gateway dùng trong payload
- `--public-url <url>`: ghi đè URL công khai dùng trong payload
- `--token <token>`: ghi đè token gateway mà luồng khởi động ban đầu xác thực với
- `--password <password>`: ghi đè mật khẩu gateway mà luồng khởi động ban đầu xác thực với
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc hiển thị QR ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Ghi chú

- `--token` và `--password` loại trừ lẫn nhau.
- Bản thân mã thiết lập hiện mang một `bootstrapToken` mờ, tồn tại trong thời gian ngắn, không phải token/mật khẩu gateway dùng chung.
- Quy trình bootstrap bằng mã thiết lập tích hợp trả về token `node` chính với `scopes: []` cùng với token bàn giao `operator` có giới hạn để thiết lập di động đáng tin cậy.
- Token operator được bàn giao chỉ giới hạn ở `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`; `operator.admin` và `operator.pairing` yêu cầu một luồng ghép nối operator đã được phê duyệt hoặc luồng token riêng.
- Ghép nối di động sẽ thất bại ở trạng thái đóng đối với các URL Gateway Tailscale/công khai dạng `ws://`. Địa chỉ LAN riêng và máy chủ Bonjour `.local` vẫn được hỗ trợ qua `ws://`, nhưng các tuyến di động Tailscale/công khai nên dùng Tailscale Serve/Funnel hoặc URL Gateway `wss://`.
- Với `--remote`, OpenClaw yêu cầu `gateway.remote.url` hoặc
  `gateway.tailscale.mode=serve|funnel`.
- Với `--remote`, nếu thông tin xác thực từ xa đang thực sự hoạt động được cấu hình dưới dạng SecretRefs và bạn không truyền `--token` hoặc `--password`, lệnh sẽ phân giải chúng từ snapshot Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại nhanh.
- Không có `--remote`, SecretRefs xác thực Gateway cục bộ được phân giải khi không truyền ghi đè xác thực CLI:
  - `gateway.auth.token` được phân giải khi xác thực bằng token có thể thắng (rõ ràng `gateway.auth.mode="token"` hoặc chế độ suy luận trong đó không có nguồn mật khẩu nào thắng).
  - `gateway.auth.password` được phân giải khi xác thực bằng mật khẩu có thể thắng (rõ ràng `gateway.auth.mode="password"` hoặc chế độ suy luận không có token thắng từ xác thực/môi trường).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa được đặt, quá trình phân giải mã thiết lập sẽ thất bại cho đến khi chế độ được đặt rõ ràng.
- Ghi chú về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu gateway hỗ trợ `secrets.resolve`; các gateway cũ hơn trả về lỗi phương thức không xác định.
- Sau khi quét, phê duyệt ghép nối thiết bị bằng:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép nối](/vi/cli/pairing)
