---
read_when:
    - Bạn muốn nhanh chóng ghép nối ứng dụng Node trên thiết bị di động với Gateway
    - Bạn cần đầu ra mã thiết lập để chia sẻ từ xa/thủ công
summary: Tài liệu tham khảo CLI cho `openclaw qr` (tạo mã QR ghép đôi thiết bị di động + mã thiết lập)
title: QR
x-i18n:
    generated_at: "2026-07-12T07:46:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Tạo mã QR ghép nối thiết bị di động và mã thiết lập từ cấu hình Gateway hiện tại của bạn.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Các ứng dụng OpenClaw chính thức dành cho iOS và Android sẽ tự động kết nối khi siêu dữ liệu mã thiết lập của chúng khớp. Nếu một yêu cầu vẫn đang chờ xử lý (ví dụ: đối với ứng dụng khách không chính thức hoặc siêu dữ liệu không khớp), hãy xem xét và phê duyệt yêu cầu đó:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Tùy chọn

- `--remote`: ưu tiên `gateway.remote.url`; chuyển sang dùng `gateway.tailscale.mode=serve|funnel` nếu URL đó chưa được đặt. Bỏ qua `publicUrl` của Plugin `device-pair`.
- `--url <url>`: ghi đè URL Gateway được dùng trong tải trọng
- `--public-url <url>`: ghi đè URL công khai được dùng trong tải trọng
- `--token <token>`: ghi đè token Gateway mà luồng khởi tạo dùng để xác thực
- `--password <password>`: ghi đè mật khẩu Gateway mà luồng khởi tạo dùng để xác thực
- `--setup-code-only`: chỉ in mã thiết lập
- `--no-ascii`: bỏ qua việc kết xuất mã QR bằng ASCII
- `--json`: xuất JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` không bắt buộc, `auth`, `urlSource`)

`--token` và `--password` loại trừ lẫn nhau.

## Nội dung mã thiết lập

Mã thiết lập chứa một `bootstrapToken` không trong suốt, có thời hạn ngắn, chứ không phải token/mật khẩu Gateway dùng chung. Luồng khởi tạo tích hợp sẵn cấp:

- một token `node` chính với `scopes: []`
- một token bàn giao `operator` có phạm vi giới hạn ở `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`

Các phạm vi thay đổi ghép nối và `operator.admin` vẫn yêu cầu một luồng ghép nối hoặc token operator được phê duyệt riêng.

## Phân giải URL Gateway

Việc ghép nối thiết bị di động sẽ từ chối theo mặc định đối với các URL Gateway `ws://` công khai/Tailscale: hãy dùng Tailscale Serve/Funnel hoặc URL Gateway `wss://` cho các trường hợp đó. Các địa chỉ LAN riêng và máy chủ Bonjour `.local` vẫn được hỗ trợ qua `ws://` thuần túy.

Khi URL Gateway được chọn đến từ `gateway.bind=lan`, OpenClaw cũng kiểm tra các tuyến `tailscale serve status --json` được lưu bền vững. Mọi gốc Serve HTTPS chuyển tiếp đến cổng local loopback của Gateway đang hoạt động đều được đưa vào làm phương án dự phòng. Lệnh QR chỉ thêm phương án dự phòng này cho `lan`; `custom` và `tailnet` giữ nguyên các tuyến được công bố rõ ràng của chúng. Các ứng dụng khách iOS hiện tại thăm dò các tuyến được công bố theo thứ tự và lưu tuyến đầu tiên có thể truy cập; trường `url` cũ vẫn không thay đổi để phục vụ các ứng dụng khách cũ hơn.

Với `--remote`, bắt buộc phải có một trong `gateway.remote.url` hoặc `gateway.tailscale.mode=serve|funnel`.

## Phân giải xác thực (không có `--remote`)

Khi không truyền tùy chọn ghi đè xác thực CLI, các SecretRef xác thực Gateway cục bộ được phân giải như sau:

| Điều kiện                                                                                                                    | Phân giải thành                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"` hoặc chế độ được suy ra khi không có nguồn mật khẩu thắng ưu tiên                                | `gateway.auth.token`                       |
| `gateway.auth.mode="password"` hoặc chế độ được suy ra khi không có token thắng ưu tiên từ xác thực/biến môi trường           | `gateway.auth.password`                    |
| Cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRef) và chưa đặt `gateway.auth.mode`      | thất bại; hãy đặt `gateway.auth.mode` rõ ràng |

## Phân giải xác thực (`--remote`)

Nếu thông tin xác thực từ xa thực sự đang hoạt động được cấu hình dưới dạng SecretRef và không truyền `--token` hay `--password`, lệnh sẽ phân giải chúng từ bản chụp Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại ngay.

<Note>
Đường dẫn lệnh này yêu cầu Gateway hỗ trợ phương thức RPC `secrets.resolve`. Các Gateway cũ hơn trả về lỗi không xác định phương thức.
</Note>

## Liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
- [Thiết bị](/vi/cli/devices)
- [Ghép nối](/vi/cli/pairing)
