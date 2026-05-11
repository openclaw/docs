---
read_when:
    - Các lệnh ClawHub CLI hoặc registry của OpenClaw không thành công
    - Không thể cài đặt, xuất bản hoặc cập nhật một gói
summary: Khắc phục sự cố đăng nhập, cài đặt, xuất bản, đồng bộ hóa, cập nhật và API của ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Khắc phục sự cố

## `clawhub login` mở trình duyệt nhưng không bao giờ hoàn tất

CLI khởi động một máy chủ callback cục bộ tồn tại trong thời gian ngắn trong quá trình đăng nhập bằng trình duyệt.

- Đảm bảo trình duyệt của bạn có thể truy cập `http://127.0.0.1:<port>/callback`.
- Kiểm tra tường lửa cục bộ, VPN và quy tắc proxy nếu callback không bao giờ đến.
- Trong môi trường headless, hãy tạo một API token trong giao diện web ClawHub và chạy:

```bash
clawhub login --token clh_...
```

## `whoami` hoặc `publish` trả về `Unauthorized` (401)

- Đăng nhập lại bằng `clawhub login`.
- Nếu bạn dùng đường dẫn cấu hình tùy chỉnh, hãy xác nhận `CLAWHUB_CONFIG_PATH` trỏ đến
  tệp chứa token hiện tại của bạn.
- Nếu bạn dùng API token, hãy xác nhận token đó chưa bị thu hồi trong giao diện web.

## Tìm kiếm hoặc cài đặt trả về `Rate limit exceeded` (429)

Đọc thông tin thử lại trong phản hồi:

- `Retry-After`: số giây cần chờ trước khi thử lại.
- `RateLimit-Remaining` và `RateLimit-Limit`: ngân sách hiện tại của bạn.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng dùng chung một IP đầu ra, giới hạn IP ẩn danh có thể bị chạm tới ngay cả khi mỗi
người chỉ gửi vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau độ trễ được
báo cáo.

## Tìm kiếm hoặc cài đặt thất bại phía sau proxy

CLI tuân theo các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một kỹ năng không xuất hiện trong tìm kiếm

- Kiểm tra slug chính xác hoặc trang chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại do quét hoặc kiểm duyệt.
- Nếu bạn sở hữu kỹ năng đó, hãy đăng nhập và kiểm tra:

```bash
clawhub inspect <skill-slug>
```

Chẩn đoán chỉ chủ sở hữu thấy được có thể giải thích trạng thái quét, cổng tải lên hoặc kiểm duyệt.

## Xuất bản thất bại vì thiếu siêu dữ liệu bắt buộc

Đối với kỹ năng, hãy kiểm tra frontmatter của `SKILL.md`. Các biến môi trường và
công cụ bắt buộc nên được khai báo để người dùng và trình quét có thể hiểu gói.

Đối với Plugin, hãy kiểm tra siêu dữ liệu tương thích trong `package.json`. Các lần xuất bản code-plugin
cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`.

Xem trước payload xuất bản trước:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Xuất bản thất bại do lỗi chủ sở hữu GitHub hoặc nguồn

ClawHub dùng danh tính GitHub và ghi nhận nguồn để kết nối các gói với
nhà xuất bản của chúng.

- Đảm bảo bạn đã đăng nhập bằng tài khoản GitHub sở hữu hoặc có thể xuất bản
  gói.
- Kiểm tra rằng URL nguồn là công khai hoặc ClawHub có thể truy cập.
- Đối với nguồn GitHub, dùng `owner/repo`, `owner/repo@ref`, hoặc URL GitHub đầy đủ.

## `sync` báo không tìm thấy kỹ năng nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Trỏ nó đến các gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Xem trước trước nếu bạn không chắc nội dung nào sẽ được xuất bản:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào ClawHub biết. Chọn một cách:

- Giữ các chỉnh sửa cục bộ và bỏ qua cập nhật.
- Ghi đè bằng phiên bản đã xuất bản:

```bash
clawhub update <slug> --force
```

- Xuất bản bản sao đã chỉnh sửa của bạn dưới dạng slug mới hoặc fork.

## Cài đặt Plugin thất bại trong OpenClaw

- Dùng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để xem trạng thái quét và siêu dữ liệu tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng phạm vi tương thích mà gói
  công bố.
- Nếu gói bị ẩn, bị giữ lại hoặc bị chặn, có thể không cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Yêu cầu API công khai thất bại

- Tôn trọng các header thử lại `429` và lưu cache phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng trở lại danh sách ClawHub chuẩn.
- Không sao chép nội dung bị ẩn, riêng tư, bị giữ lại hoặc bị chặn do kiểm duyệt ra ngoài
  bề mặt API công khai.

Xem [HTTP API](/vi/clawhub/http-api) để biết chi tiết endpoint.
