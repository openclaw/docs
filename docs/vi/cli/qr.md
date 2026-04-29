---
read_when:
    - Bạn muốn nhanh chóng ghép nối ứng dụng Node trên di động với Gateway
    - Bạn cần đầu ra của setup-code để chia sẻ từ xa/thủ công
summary: Tài liệu tham khảo CLI cho `openclaw qr` (tạo QR ghép nối di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-04-29T22:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo mã QR ghép nối di động và mã thiết lập từ cấu hình Gateway hiện tại của bạn.

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
- `--url <url>`: ghi đè URL gateway dùng trong payload
- `--public-url <url>`: ghi đè URL công khai dùng trong payload
- `--token <token>`: ghi đè token gateway mà luồng bootstrap dùng để xác thực
- `--password <password>`: ghi đè mật khẩu gateway mà luồng bootstrap dùng để xác thực
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc render QR ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Ghi chú

- `--token` và `--password` loại trừ lẫn nhau.
- Bản thân mã thiết lập hiện mang một `bootstrapToken` mờ, tồn tại ngắn hạn, không phải token/mật khẩu gateway dùng chung.
- Trong luồng bootstrap nút/người vận hành tích hợp sẵn, token nút chính vẫn được đặt với `scopes: []`.
- Nếu bước bàn giao bootstrap cũng phát hành token người vận hành, token đó vẫn bị giới hạn trong danh sách cho phép bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Kiểm tra phạm vi bootstrap có tiền tố vai trò. Danh sách cho phép người vận hành đó chỉ thỏa mãn các yêu cầu của người vận hành; các vai trò không phải người vận hành vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.
- Ghép nối di động sẽ đóng khi gặp URL Gateway Tailscale/công khai dạng `ws://`. LAN riêng dạng `ws://` vẫn được hỗ trợ, nhưng các tuyến di động Tailscale/công khai nên dùng Tailscale Serve/Funnel hoặc URL Gateway dạng `wss://`.
- Với `--remote`, OpenClaw yêu cầu `gateway.remote.url` hoặc
  `gateway.tailscale.mode=serve|funnel`.
- Với `--remote`, nếu thông tin xác thực từ xa đang hoạt động hiệu lực được cấu hình dưới dạng SecretRefs và bạn không truyền `--token` hoặc `--password`, lệnh sẽ phân giải chúng từ snapshot Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại nhanh.
- Không có `--remote`, SecretRefs xác thực Gateway cục bộ được phân giải khi không truyền ghi đè xác thực qua CLI:
  - `gateway.auth.token` phân giải khi xác thực token có thể thắng (`gateway.auth.mode="token"` rõ ràng hoặc chế độ suy luận khi không có nguồn mật khẩu nào thắng).
  - `gateway.auth.password` phân giải khi xác thực mật khẩu có thể thắng (`gateway.auth.mode="password"` rõ ràng hoặc chế độ suy luận không có token thắng từ xác thực/env).
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs) và `gateway.auth.mode` chưa đặt, việc phân giải mã thiết lập sẽ thất bại cho đến khi mode được đặt rõ ràng.
- Ghi chú về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu Gateway hỗ trợ `secrets.resolve`; các gateway cũ hơn trả về lỗi phương thức không xác định.
- Sau khi quét, phê duyệt ghép nối thiết bị bằng:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép nối](/vi/cli/pairing)
