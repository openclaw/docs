---
read_when:
    - Các lệnh CLI của ClawHub hoặc lệnh registry của OpenClaw không thực thi được
    - Không thể cài đặt, phát hành hoặc cập nhật gói này
summary: Khắc phục sự cố đăng nhập, cài đặt, phát hành, cập nhật và API của ClawHub.
x-i18n:
    generated_at: "2026-07-12T07:46:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Khắc phục sự cố

## `clawhub login` mở trình duyệt nhưng không bao giờ hoàn tất

CLI khởi động một máy chủ callback cục bộ tồn tại trong thời gian ngắn khi đăng nhập qua trình duyệt.

- Đảm bảo trình duyệt của bạn có thể truy cập `http://127.0.0.1:<port>/callback`.
- Kiểm tra các quy tắc tường lửa cục bộ, VPN và proxy nếu callback không bao giờ đến.
- Trong môi trường không giao diện, hãy tạo mã thông báo API trong giao diện web ClawHub và chạy:

```bash
clawhub login --token clh_...
```

## `whoami` hoặc `publish` trả về `Unauthorized` (401)

- Đăng nhập lại bằng `clawhub login`.
- Nếu bạn sử dụng đường dẫn cấu hình tùy chỉnh, hãy xác nhận `CLAWHUB_CONFIG_PATH` trỏ đến
  tệp chứa mã thông báo hiện tại của bạn.
- Nếu bạn sử dụng mã thông báo API, hãy xác nhận mã đó chưa bị thu hồi trong giao diện web.

## Tìm kiếm hoặc cài đặt trả về `Rate limit exceeded` (429)

Đọc thông tin thử lại trong phản hồi:

- `Retry-After`: số giây cần chờ trước khi thử lại.
- `RateLimit-Limit`: giới hạn được áp dụng cho yêu cầu này.
- `RateLimit-Remaining`: hạn mức còn lại chính xác của bạn khi tiêu đề này xuất hiện. Với `429`, giá trị là `0`.
- `RateLimit-Reset` hoặc `X-RateLimit-Reset`: thời điểm đặt lại.

Nếu nhiều người dùng chia sẻ một IP đầu ra, giới hạn IP ẩn danh có thể bị chạm đến ngay cả khi mỗi
người chỉ gửi một vài yêu cầu. Hãy đăng nhập khi có thể và thử lại sau khoảng thời gian
được báo cáo.

## Tìm kiếm hoặc cài đặt thất bại khi dùng proxy

CLI tuân theo các biến proxy tiêu chuẩn:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Các tên được hỗ trợ bao gồm `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` và
`http_proxy`.

## Một skill không xuất hiện trong kết quả tìm kiếm

- Kiểm tra slug chính xác hoặc trang của chủ sở hữu nếu bạn biết.
- Xác nhận bản phát hành là công khai và không bị giữ lại để quét hoặc kiểm duyệt.
- Nếu bạn sở hữu skill, hãy đăng nhập và kiểm tra:

```bash
clawhub inspect @openclaw/demo
```

Thông tin chẩn đoán chỉ chủ sở hữu nhìn thấy có thể giải thích trạng thái quét, cổng kiểm tra tải lên hoặc kiểm duyệt.

## Đăng tải thất bại vì thiếu siêu dữ liệu bắt buộc

Đối với skill, hãy kiểm tra frontmatter của `SKILL.md`. Các biến môi trường và
công cụ bắt buộc cần được khai báo để người dùng và trình quét có thể hiểu gói.

Đối với plugin, hãy kiểm tra siêu dữ liệu tương thích trong `package.json`. Việc đăng tải plugin mã
cần các trường tương thích OpenClaw như `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`.

Trước tiên, hãy xem trước payload đăng tải:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Đăng tải thất bại do lỗi chủ sở hữu hoặc nguồn GitHub

ClawHub sử dụng danh tính GitHub và thông tin quy nguồn để liên kết các gói với
nhà phát hành của chúng.

- Đảm bảo bạn đã đăng nhập bằng tài khoản GitHub sở hữu hoặc có thể đăng tải
  gói.
- Kiểm tra URL nguồn là công khai hoặc ClawHub có thể truy cập.
- Đối với nguồn GitHub, hãy sử dụng `owner/repo`, `owner/repo@ref` hoặc URL GitHub đầy đủ.

## Đăng tải thất bại vì không gian tên đã được xác nhận quyền sở hữu hoặc được dành riêng

Nếu quá trình đăng tải thất bại vì định danh chủ sở hữu, không gian tên tổ chức, phạm vi gói, slug của skill
hoặc tên gói đã được xác nhận quyền sở hữu hoặc dành riêng, trước tiên hãy xác nhận rằng bạn đang
đăng tải bằng chủ sở hữu khớp với không gian tên. Đối với các gói plugin,
các tên có phạm vi như `@example-org/example-plugin` phải được đăng tải với chủ sở hữu
`example-org` tương ứng.

Nếu bạn cho rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu hợp pháp của không gian tên nhưng
không thể quản lý chủ sở hữu ClawHub hiện tại, hãy mở một
[vấn đề Yêu cầu quyền sở hữu tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
kèm bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu quyền sở hữu tổ chức và không gian tên](/clawhub/namespace-claims) để biết hướng dẫn về bằng chứng và những nội dung
không nên đưa vào vấn đề công khai.

## `sync` cho biết không tìm thấy skill nào

`sync` tìm các thư mục chứa `SKILL.md` hoặc `skill.md`.

Hãy trỏ nó đến các thư mục gốc bạn muốn quét:

```bash
clawhub sync --root /path/to/skills
```

Hãy xem trước nếu bạn không chắc nội dung nào sẽ được đăng tải:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` từ chối vì có thay đổi cục bộ

Các tệp cục bộ không khớp với bất kỳ phiên bản nào mà ClawHub biết. Hãy chọn một phương án:

- Giữ các chỉnh sửa cục bộ và bỏ qua bản cập nhật.
- Ghi đè bằng phiên bản đã đăng tải:

```bash
clawhub update @openclaw/demo --force
```

- Đăng tải bản sao đã chỉnh sửa của bạn dưới dạng slug mới hoặc bản phân nhánh.

## Cài đặt plugin thất bại trong OpenClaw

- Sử dụng nguồn ClawHub tường minh:

```bash
openclaw plugins install clawhub:<package>
```

- Kiểm tra trang chi tiết gói để biết trạng thái quét và siêu dữ liệu tương thích.
- Xác nhận phiên bản OpenClaw của bạn đáp ứng phạm vi tương thích được công bố
  của gói.
- Nếu gói bị ẩn, giữ lại hoặc chặn, gói có thể không cài đặt được cho đến khi
  chủ sở hữu giải quyết vấn đề.

## Các yêu cầu API công khai thất bại

- Tuân thủ các tiêu đề thử lại của `429` và lưu vào bộ nhớ đệm các phản hồi danh sách/tìm kiếm công khai.
- Liên kết người dùng trở lại danh mục ClawHub chính thức.
- Không sao chép nội dung bị ẩn, riêng tư, giữ lại hoặc bị kiểm duyệt chặn ra ngoài
  bề mặt API công khai.

Xem [API HTTP](/clawhub/http-api) để biết chi tiết về các điểm cuối.
