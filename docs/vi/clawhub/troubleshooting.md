---
read_when:
    - Lệnh CLI của ClawHub hoặc lệnh registry của OpenClaw không thành công
    - Không thể cài đặt, phát hành hoặc cập nhật gói
summary: Khắc phục sự cố đăng nhập, cài đặt, xuất bản, cập nhật và API của ClawHub.
x-i18n:
    generated_at: "2026-07-02T08:26:47Z"
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
- Trong môi trường không có giao diện, hãy tạo một token API trong giao diện web ClawHub và chạy:

```bash
clawhub login --token clh_...
```

## `whoami` hoặc `publish` trả về `Unauthorized` (401)

- Đăng nhập lại bằng `clawhub login`.
- Nếu bạn dùng đường dẫn cấu hình tùy chỉnh, hãy xác nhận `CLAWHUB_CONFIG_PATH` trỏ đến
  tệp chứa token hiện tại của bạn.
- Nếu bạn dùng token API, hãy xác nhận token đó chưa bị thu hồi trong giao diện web.

## Tìm kiếm hoặc cài đặt trả về `Rate limit exceeded` (429)

Đọc thông tin thử lại trong phản hồi:

- `Retry-After`: số giây cần chờ trước khi thử lại.
- `RateLimit-Limit`: giới hạn được áp dụng cho yêu cầu này.
- `RateLimit-Remaining`: ngân sách còn lại chính xác của bạn khi header xuất hiện. Trên `429`, giá trị này là `0`.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng dùng chung một IP egress, giới hạn IP ẩn danh có thể bị chạm tới ngay cả khi mỗi
người chỉ gửi vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau độ trễ
được báo cáo.

## Tìm kiếm hoặc cài đặt thất bại phía sau proxy

CLI tuân theo các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một Skills không xuất hiện trong tìm kiếm

- Kiểm tra slug chính xác hoặc trang chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại bởi quét hoặc kiểm duyệt.
- Nếu bạn sở hữu Skills đó, hãy đăng nhập và kiểm tra:

```bash
clawhub inspect @openclaw/demo
```

Chẩn đoán hiển thị cho chủ sở hữu có thể giải thích trạng thái quét, cổng tải lên hoặc kiểm duyệt.

## Phát hành thất bại vì thiếu siêu dữ liệu bắt buộc

Đối với Skills, hãy kiểm tra frontmatter của `SKILL.md`. Các biến môi trường và
công cụ bắt buộc nên được khai báo để người dùng và bộ quét có thể hiểu gói.

Đối với Plugin, hãy kiểm tra siêu dữ liệu tương thích trong `package.json`. Các lượt phát hành code-plugin
cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`.

Xem trước payload phát hành trước:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Phát hành thất bại do lỗi chủ sở hữu GitHub hoặc nguồn

ClawHub dùng danh tính GitHub và thông tin ghi nhận nguồn để kết nối gói với
nhà phát hành của chúng.

- Đảm bảo bạn đã đăng nhập bằng tài khoản GitHub sở hữu hoặc có thể phát hành
  gói.
- Kiểm tra URL nguồn là công khai hoặc ClawHub có thể truy cập được.
- Đối với nguồn GitHub, dùng `owner/repo`, `owner/repo@ref` hoặc URL GitHub đầy đủ.

## Phát hành thất bại vì một namespace đã được xác nhận hoặc dành riêng

Nếu phát hành thất bại vì handle chủ sở hữu, namespace tổ chức, phạm vi gói, slug Skills
hoặc tên gói đã được xác nhận hoặc dành riêng, trước tiên hãy xác nhận rằng bạn đang
phát hành bằng chủ sở hữu khớp với namespace. Đối với gói Plugin,
các tên có phạm vi như `@example-org/example-plugin` phải được phát hành dưới
chủ sở hữu `example-org` tương ứng.

Nếu bạn tin rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu namespace hợp pháp nhưng
bạn không thể quản lý chủ sở hữu ClawHub hiện tại, hãy mở một
[vấn đề xác nhận tổ chức / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm. Xem
[Xác nhận tổ chức và namespace](/clawhub/namespace-claims) để biết hướng dẫn về bằng chứng và những gì
cần tránh đưa vào vấn đề công khai.

## `sync` báo không tìm thấy Skills nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Trỏ nó đến các gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Xem trước trước nếu bạn không chắc nội dung nào sẽ được phát hành:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào ClawHub biết. Chọn một cách:

- Giữ các chỉnh sửa cục bộ và bỏ qua bản cập nhật.
- Ghi đè bằng phiên bản đã phát hành:

```bash
clawhub update @openclaw/demo --force
```

- Phát hành bản sao đã chỉnh sửa của bạn dưới dạng slug mới hoặc fork.

## Cài đặt Plugin thất bại trong OpenClaw

- Dùng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để xem trạng thái quét và siêu dữ liệu tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng phạm vi tương thích mà gói
  công bố.
- Nếu gói bị ẩn, bị giữ lại hoặc bị chặn, gói có thể chưa cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Yêu cầu API công khai thất bại

- Tuân thủ header thử lại `429` và lưu cache phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng quay lại danh sách ClawHub chính tắc.
- Không sao chép nội dung bị ẩn, riêng tư, bị giữ lại hoặc bị chặn kiểm duyệt ra ngoài
  bề mặt API công khai.

Xem [API HTTP](/clawhub/http-api) để biết chi tiết endpoint.
