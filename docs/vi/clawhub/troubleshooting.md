---
read_when:
    - Các lệnh CLI của ClawHub hoặc lệnh sổ đăng ký OpenClaw không thành công
    - Không thể cài đặt, phát hành hoặc cập nhật gói
summary: Khắc phục sự cố đăng nhập, cài đặt, xuất bản, cập nhật và vấn đề API của ClawHub.
x-i18n:
    generated_at: "2026-07-03T00:58:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Khắc phục sự cố

## `clawhub login` mở trình duyệt nhưng không bao giờ hoàn tất

CLI khởi động một máy chủ callback cục bộ tồn tại ngắn trong quá trình đăng nhập bằng trình duyệt.

- Đảm bảo trình duyệt của bạn có thể truy cập `http://127.0.0.1:<port>/callback`.
- Kiểm tra tường lửa cục bộ, VPN và quy tắc proxy nếu callback không bao giờ đến.
- Trong môi trường không có giao diện, hãy tạo token API trong giao diện web ClawHub rồi chạy:

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
- `RateLimit-Remaining`: ngân sách chính xác còn lại của bạn khi header có mặt. Khi gặp `429`, giá trị này là `0`.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng dùng chung một IP đi ra, giới hạn IP ẩn danh có thể bị chạm tới ngay cả khi mỗi
người chỉ gửi vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau khoảng trễ
được báo cáo.

## Tìm kiếm hoặc cài đặt không thành công phía sau proxy

CLI tôn trọng các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một skill không xuất hiện trong kết quả tìm kiếm

- Kiểm tra slug chính xác hoặc trang chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại do quét hoặc kiểm duyệt.
- Nếu bạn sở hữu skill đó, hãy đăng nhập và kiểm tra:

```bash
clawhub inspect @openclaw/demo
```

Chẩn đoán hiển thị cho chủ sở hữu có thể giải thích trạng thái quét, cổng tải lên hoặc kiểm duyệt.

## Publish không thành công vì thiếu siêu dữ liệu bắt buộc

Đối với Skills, hãy kiểm tra frontmatter trong `SKILL.md`. Các biến môi trường và
công cụ bắt buộc nên được khai báo để người dùng và trình quét có thể hiểu gói.

Đối với plugin, hãy kiểm tra siêu dữ liệu tương thích trong `package.json`. Các lần publish
code-plugin cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`.

Xem trước payload publish trước:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish không thành công do lỗi chủ sở hữu GitHub hoặc nguồn

ClawHub dùng danh tính GitHub và ghi nhận nguồn để liên kết các gói với
nhà xuất bản của chúng.

- Đảm bảo bạn đã đăng nhập bằng tài khoản GitHub sở hữu hoặc có thể publish
  gói đó.
- Kiểm tra rằng URL nguồn là công khai hoặc ClawHub có thể truy cập.
- Đối với nguồn GitHub, hãy dùng `owner/repo`, `owner/repo@ref` hoặc URL GitHub đầy đủ.

## Publish không thành công vì namespace đã được xác nhận hoặc được dành riêng

Nếu publish không thành công vì handle chủ sở hữu, namespace tổ chức, scope gói, slug skill
hoặc tên gói đã được xác nhận hoặc dành riêng, trước tiên hãy xác nhận rằng bạn đang
publish bằng chủ sở hữu khớp với namespace đó. Đối với các gói plugin,
các tên có scope như `@example-org/example-plugin` phải được publish dưới
chủ sở hữu `example-org` tương ứng.

Nếu bạn cho rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu namespace hợp pháp nhưng
bạn không thể quản lý chủ sở hữu ClawHub hiện tại, hãy mở một
[vấn đề Yêu cầu xác nhận tổ chức / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu xác nhận tổ chức và Namespace](/clawhub/namespace-claims) để biết hướng dẫn về bằng chứng và những gì
cần tránh đưa vào vấn đề công khai.

## `sync` cho biết không tìm thấy skill nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Trỏ lệnh đến các gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Xem trước trước nếu bạn không chắc nội dung nào sẽ được publish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào ClawHub biết. Chọn một cách:

- Giữ các chỉnh sửa cục bộ và bỏ qua bản cập nhật.
- Ghi đè bằng phiên bản đã publish:

```bash
clawhub update @openclaw/demo --force
```

- Publish bản sao đã chỉnh sửa của bạn dưới dạng slug mới hoặc fork.

## Cài đặt plugin không thành công trong OpenClaw

- Dùng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để xem trạng thái quét và siêu dữ liệu tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng phạm vi tương thích được gói
  công bố.
- Nếu gói bị ẩn, bị giữ lại hoặc bị chặn, có thể không cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Yêu cầu API công khai không thành công

- Tôn trọng các header thử lại `429` và cache phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng quay lại danh sách ClawHub chuẩn.
- Không sao chép nội dung bị ẩn, riêng tư, bị giữ lại hoặc bị chặn do kiểm duyệt ra ngoài
  bề mặt API công khai.

Xem [HTTP API](/clawhub/http-api) để biết chi tiết endpoint.
