---
read_when:
    - Lệnh ClawHub CLI hoặc lệnh registry của OpenClaw bị lỗi
    - Không thể cài đặt, phát hành hoặc cập nhật gói
summary: Khắc phục sự cố đăng nhập, cài đặt, xuất bản, cập nhật và API của ClawHub.
x-i18n:
    generated_at: "2026-07-04T03:53:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Khắc phục sự cố

## `clawhub login` mở trình duyệt nhưng không bao giờ hoàn tất

CLI khởi động một máy chủ callback cục bộ tồn tại ngắn hạn trong quá trình đăng nhập bằng trình duyệt.

- Đảm bảo trình duyệt của bạn có thể truy cập `http://127.0.0.1:<port>/callback`.
- Kiểm tra tường lửa cục bộ, VPN và quy tắc proxy nếu callback không bao giờ đến.
- Trong môi trường headless, hãy tạo một mã thông báo API trong giao diện web ClawHub rồi chạy:

```bash
clawhub login --token clh_...
```

## `whoami` hoặc `publish` trả về `Unauthorized` (401)

- Đăng nhập lại bằng `clawhub login`.
- Nếu bạn dùng đường dẫn cấu hình tùy chỉnh, hãy xác nhận `CLAWHUB_CONFIG_PATH` trỏ đến
  tệp chứa mã thông báo hiện tại của bạn.
- Nếu bạn dùng mã thông báo API, hãy xác nhận nó chưa bị thu hồi trong giao diện web.

## Tìm kiếm hoặc cài đặt trả về `Rate limit exceeded` (429)

Đọc thông tin thử lại trong phản hồi:

- `Retry-After`: số giây cần chờ trước khi thử lại.
- `RateLimit-Limit`: giới hạn áp dụng cho yêu cầu này.
- `RateLimit-Remaining`: ngân sách còn lại chính xác của bạn khi header này hiện diện. Với `429`, giá trị là `0`.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng dùng chung một IP đi ra, giới hạn IP ẩn danh có thể bị chạm ngay cả khi mỗi
người chỉ gửi một vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau độ trễ
được báo cáo.

## Tìm kiếm hoặc cài đặt thất bại sau proxy

CLI tuân theo các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một kỹ năng không xuất hiện trong tìm kiếm

- Kiểm tra đúng slug hoặc trang chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại do quét hoặc kiểm duyệt.
- Nếu bạn sở hữu kỹ năng đó, hãy đăng nhập và kiểm tra nó:

```bash
clawhub inspect @openclaw/demo
```

Chẩn đoán hiển thị với chủ sở hữu có thể giải thích trạng thái quét, upload-gate hoặc kiểm duyệt.

## Xuất bản thất bại vì thiếu metadata bắt buộc

Với kỹ năng, hãy kiểm tra frontmatter của `SKILL.md`. Các biến môi trường và
công cụ bắt buộc nên được khai báo để người dùng và bộ quét có thể hiểu gói.

Với Plugin, hãy kiểm tra metadata tương thích trong `package.json`. Các lượt xuất bản
code-plugin cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
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
- Kiểm tra URL nguồn là công khai hoặc ClawHub có thể truy cập.
- Với nguồn GitHub, dùng `owner/repo`, `owner/repo@ref` hoặc URL GitHub đầy đủ.

## Xuất bản thất bại vì namespace đã được xác nhận hoặc được giữ riêng

Nếu xuất bản thất bại vì handle chủ sở hữu, namespace tổ chức, phạm vi gói, slug kỹ năng
hoặc tên gói đã được xác nhận hoặc được giữ riêng, trước tiên hãy xác nhận rằng bạn đang
xuất bản bằng chủ sở hữu khớp với namespace. Với các gói Plugin,
tên có phạm vi như `@example-org/example-plugin` phải được xuất bản dưới chủ sở hữu
`example-org` tương ứng.

Nếu bạn tin rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu namespace hợp pháp nhưng
bạn không thể quản lý chủ sở hữu ClawHub hiện tại, hãy mở một
[vấn đề Yêu cầu xác nhận Tổ chức / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu xác nhận Tổ chức và Namespace](/clawhub/namespace-claims) để biết hướng dẫn về bằng chứng và những gì
không nên đưa vào vấn đề công khai.

## `sync` báo không tìm thấy kỹ năng nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Trỏ nó đến các thư mục gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Xem trước trước nếu bạn không chắc những gì sẽ được xuất bản:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào ClawHub biết. Chọn một cách:

- Giữ các chỉnh sửa cục bộ và bỏ qua cập nhật.
- Ghi đè bằng phiên bản đã xuất bản:

```bash
clawhub update @openclaw/demo --force
```

- Xuất bản bản sao đã chỉnh sửa của bạn dưới dạng slug mới hoặc fork.

## Cài đặt Plugin thất bại trong OpenClaw

- Dùng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để xem trạng thái quét và metadata tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng phạm vi tương thích
  mà gói công bố.
- Nếu gói bị ẩn, bị giữ lại hoặc bị chặn, có thể không cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Yêu cầu API công khai thất bại

- Tôn trọng các header thử lại `429` và cache phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng quay lại mục niêm yết ClawHub chuẩn.
- Không phản chiếu nội dung bị ẩn, riêng tư, bị giữ lại hoặc bị chặn do kiểm duyệt ra ngoài
  bề mặt API công khai.

Xem [API HTTP](/clawhub/http-api) để biết chi tiết endpoint.
