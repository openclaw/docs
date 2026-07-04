---
read_when:
    - Lệnh CLI ClawHub hoặc lệnh registry OpenClaw bị lỗi
    - Không thể cài đặt, phát hành hoặc cập nhật gói
summary: Khắc phục sự cố đăng nhập, cài đặt, phát hành, cập nhật và API của ClawHub.
x-i18n:
    generated_at: "2026-07-04T20:33:51Z"
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
- `RateLimit-Remaining`: ngân sách còn lại chính xác của bạn khi có header này. Với `429`, giá trị là `0`.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng dùng chung một IP đi ra, giới hạn IP ẩn danh có thể bị chạm ngay cả khi mỗi
người chỉ gửi vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau khoảng trễ
được báo cáo.

## Tìm kiếm hoặc cài đặt thất bại sau proxy

CLI tuân theo các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một skill không xuất hiện trong tìm kiếm

- Kiểm tra slug chính xác hoặc trang chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại do quét hoặc kiểm duyệt.
- Nếu bạn sở hữu skill đó, hãy đăng nhập và kiểm tra:

```bash
clawhub inspect @openclaw/demo
```

Chẩn đoán hiển thị cho chủ sở hữu có thể giải thích trạng thái quét, cổng tải lên hoặc kiểm duyệt.

## Publish thất bại vì thiếu siêu dữ liệu bắt buộc

Với Skills, hãy kiểm tra frontmatter của `SKILL.md`. Các biến môi trường và
công cụ bắt buộc nên được khai báo để người dùng và trình quét có thể hiểu gói.

Với plugin, hãy kiểm tra siêu dữ liệu tương thích trong `package.json`. Các publish
code-plugin cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`.

Xem trước payload publish trước:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish thất bại do lỗi chủ sở hữu GitHub hoặc nguồn

ClawHub dùng danh tính GitHub và ghi nguồn để kết nối các gói với
nhà xuất bản của chúng.

- Đảm bảo bạn đã đăng nhập bằng tài khoản GitHub sở hữu hoặc có thể publish
  gói.
- Kiểm tra URL nguồn là công khai hoặc ClawHub có thể truy cập.
- Với nguồn GitHub, dùng `owner/repo`, `owner/repo@ref` hoặc URL GitHub đầy đủ.

## Publish thất bại vì namespace đã được xác nhận hoặc dành riêng

Nếu publish thất bại vì handle chủ sở hữu, namespace tổ chức, scope gói, slug skill
hoặc tên gói đã được xác nhận hoặc dành riêng, trước tiên hãy xác nhận rằng bạn đang
publish bằng chủ sở hữu khớp với namespace. Với gói plugin,
các tên có scope như `@example-org/example-plugin` phải được publish với chủ sở hữu
`example-org` tương ứng.

Nếu bạn tin rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu hợp pháp của namespace nhưng
bạn không thể quản lý chủ sở hữu ClawHub hiện tại, hãy mở một
[vấn đề Yêu cầu Tổ chức / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu Tổ chức và Namespace](/clawhub/namespace-claims) để biết hướng dẫn bằng chứng và nội dung
cần tránh đưa vào vấn đề công khai.

## `sync` báo không tìm thấy Skills nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Trỏ nó đến các thư mục gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Xem trước nếu bạn không chắc nội dung nào sẽ được publish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào mà ClawHub biết. Chọn một:

- Giữ chỉnh sửa cục bộ và bỏ qua bản cập nhật.
- Ghi đè bằng phiên bản đã publish:

```bash
clawhub update @openclaw/demo --force
```

- Publish bản sao đã chỉnh sửa của bạn dưới dạng slug hoặc fork mới.

## Cài đặt plugin thất bại trong OpenClaw

- Dùng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để biết trạng thái quét và siêu dữ liệu tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng dải tương thích được gói
  công bố.
- Nếu gói bị ẩn, bị giữ lại hoặc bị chặn, có thể không cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Yêu cầu API công khai thất bại

- Tuân thủ các header thử lại `429` và lưu cache phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng trở lại danh sách ClawHub chính tắc.
- Không sao chép nội dung bị ẩn, riêng tư, bị giữ lại hoặc bị chặn kiểm duyệt ra ngoài
  bề mặt API công khai.

Xem [HTTP API](/clawhub/http-api) để biết chi tiết endpoint.
