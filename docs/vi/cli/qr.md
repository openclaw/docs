---
read_when:
    - Bạn muốn nhanh chóng ghép nối một ứng dụng Node trên thiết bị di động với Gateway
    - Bạn cần đầu ra mã thiết lập để chia sẻ từ xa/thủ công
summary: Tài liệu tham khảo CLI cho `openclaw qr` (tạo mã QR ghép đôi thiết bị di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-07-16T15:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo mã QR ghép nối di động và mã thiết lập từ cấu hình Gateway hiện tại.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Các ứng dụng OpenClaw chính thức dành cho iOS và Android sẽ tự động kết nối khi siêu dữ liệu mã thiết lập của chúng khớp nhau. Nếu một yêu cầu vẫn đang chờ xử lý (ví dụ: đối với ứng dụng khách không chính thức hoặc siêu dữ liệu không khớp), hãy xem xét và phê duyệt yêu cầu đó:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Tùy chọn

- `--remote`: ưu tiên `gateway.remote.url`; dùng `gateway.tailscale.mode=serve|funnel` làm phương án dự phòng nếu URL đó chưa được đặt. Bỏ qua `device-pair` Plugin `publicUrl`.
- `--url <url>`: ghi đè URL Gateway được dùng trong tải trọng
- `--public-url <url>`: ghi đè URL công khai được dùng trong tải trọng
- `--token <token>`: ghi đè token Gateway mà luồng khởi tạo dùng để xác thực
- `--password <password>`: ghi đè mật khẩu Gateway mà luồng khởi tạo dùng để xác thực
- `--limited`: loại bỏ quyền truy cập quản trị Gateway khỏi token người vận hành được bàn giao
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc kết xuất mã QR bằng ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` tùy chọn, `auth`, `access`, `accessDowngraded` tùy chọn, `urlSource`)

`--token` và `--password` loại trừ lẫn nhau.

## Nội dung mã thiết lập

Mã thiết lập chứa một `bootstrapToken` không rõ nội dung, có thời hạn ngắn, chứ không phải token/mật khẩu Gateway dùng chung. Đối với điểm cuối `wss://` (hoặc loopback cùng máy chủ), luồng khởi tạo mặc định cấp:

- một token `node` chính với `scopes: []`
- một token bàn giao `operator` đầy đủ dành cho thiết bị di động gốc với `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`

Sử dụng `--limited` để giữ nguyên token node nhưng loại bỏ `operator.admin` khỏi nội dung bàn giao cho người vận hành. Phạm vi thay đổi ghép nối không bao giờ được bàn giao qua mã thiết lập.

Thiết lập `ws://` qua mạng LAN dạng văn bản thuần vẫn khả dụng, nhưng OpenClaw tự động sử dụng hồ sơ giới hạn vì người quan sát mạng có thể thu thập và tranh quyền sử dụng token bearer khởi tạo. Hãy cấu hình `wss://` hoặc Tailscale Serve, sau đó tạo mã mới để có toàn quyền truy cập.

## Phân giải URL Gateway

Ghép nối di động sẽ đóng an toàn đối với các URL Gateway `ws://` công khai/Tailscale: hãy sử dụng Tailscale Serve/Funnel hoặc URL Gateway `wss://` cho các trường hợp đó. Các địa chỉ LAN riêng tư và máy chủ Bonjour `.local` vẫn được hỗ trợ qua `ws://` dạng văn bản thuần, với quyền truy cập hạn chế của người vận hành như mô tả ở trên.

Khi URL Gateway đã chọn đến từ `gateway.bind=lan`, OpenClaw cũng kiểm tra các tuyến `tailscale serve status --json` bền vững. Mọi gốc HTTPS Serve ủy quyền đến cổng loopback của Gateway đang hoạt động đều được đưa vào làm phương án dự phòng. Lệnh QR chỉ thêm phương án dự phòng này cho `lan`; `custom` và `tailnet` giữ nguyên các tuyến được quảng bá rõ ràng của chúng. Các ứng dụng khách iOS hiện tại thăm dò các tuyến được quảng bá theo thứ tự và lưu tuyến đầu tiên có thể truy cập; trường `url` cũ không thay đổi để hỗ trợ các ứng dụng khách cũ hơn.

Với `--remote`, bắt buộc phải có một trong `gateway.remote.url` hoặc `gateway.tailscale.mode=serve|funnel`.

## Phân giải xác thực (không có `--remote`)

Khi không truyền tham số ghi đè xác thực CLI, các SecretRef xác thực Gateway cục bộ được phân giải như sau:

| Điều kiện                                                                                                                    | Phân giải thành                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, hoặc chế độ suy luận không có nguồn mật khẩu ưu tiên nào                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, hoặc chế độ suy luận không có token ưu tiên nào từ xác thực/biến môi trường                                         | `gateway.auth.password`                   |
| Cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRef) và `gateway.auth.mode` chưa được đặt | thất bại; đặt `gateway.auth.mode` một cách rõ ràng |

## Phân giải xác thực (`--remote`)

Nếu thông tin xác thực từ xa đang có hiệu lực được cấu hình dưới dạng SecretRef và không truyền cả `--token` lẫn `--password`, lệnh sẽ phân giải chúng từ ảnh chụp nhanh Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại ngay.

<Note>
Đường dẫn lệnh này yêu cầu Gateway hỗ trợ phương thức RPC `secrets.resolve`. Các Gateway cũ hơn trả về lỗi không xác định phương thức.
</Note>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Thiết bị](/vi/cli/devices)
- [Ghép nối](/vi/cli/pairing)
