---
read_when:
    - Xuất bản một skill hoặc Plugin
    - Gỡ lỗi lỗi phạm vi chủ sở hữu hoặc gói
    - Thêm giao diện xuất bản, CLI hoặc hành vi backend
summary: Cách hoạt động của việc xuất bản trên ClawHub cho Skills, Plugin, chủ sở hữu, phạm vi, bản phát hành và đánh giá.
x-i18n:
    generated_at: "2026-06-27T17:15:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Xuất bản

Việc xuất bản gửi một thư mục Skills hoặc gói Plugin lên ClawHub dưới chủ sở hữu mà bạn
chọn. ClawHub kiểm tra token của bạn có thể xuất bản cho chủ sở hữu đó hay không, xác thực
metadata, tên, phiên bản, tệp và thông tin nguồn, sau đó lưu bản phát hành
và bắt đầu các kiểm tra bảo mật tự động.

Nếu xác thực thất bại, sẽ không có gì được xuất bản. Các bản phát hành mới cũng có thể chưa xuất hiện trên
các bề mặt cài đặt và tải xuống thông thường cho đến khi quá trình đánh giá hoàn tất.

## Skills

Đường dẫn xuất bản đơn giản nhất là CLI. Đăng nhập, sau đó xuất bản một thư mục Skills
cục bộ:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Dùng `--owner <handle>` khi xuất bản tới chủ sở hữu là tổ chức. Bỏ qua tùy chọn này để xuất bản với tư cách
người dùng đã xác thực. Việc xuất bản bỏ qua nội dung không thay đổi. Một Skills mới bắt đầu
ở `1.0.0`, và các thay đổi sau đó tự động xuất bản phiên bản vá tiếp theo. Chỉ truyền
`--version` khi bạn cần một phiên bản rõ ràng.

Đối với các repo danh mục, hãy dùng
[workflow `skill-publish.yml` tái sử dụng được](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
của ClawHub. Nó gọi `skill publish` cho từng thư mục Skills trực tiếp dưới `root` (mặc định:
`skills`), hoặc chỉ thư mục được cung cấp dưới dạng `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Dùng `dry_run: true` để xem trước Skills mới và đã thay đổi mà không xuất bản.

## Plugin

Plugin dùng tên gói theo kiểu npm. Tên gói có phạm vi bao gồm chủ sở hữu ở
phần đầu tiên của tên:

```text
@owner/package-name
```

Phạm vi phải khớp với chủ sở hữu xuất bản đã chọn. Nếu gói của bạn có tên
`@openclaw/dronzer`, nó chỉ có thể được xuất bản dưới dạng `@openclaw`. Nếu bạn xuất bản dưới dạng
`@vintageayu`, hãy đổi tên gói thành `@vintageayu/dronzer`.

Điều này ngăn một gói tuyên bố namespace của tổ chức mà nhà xuất bản không
kiểm soát.

Nếu bạn là chủ sở hữu hợp pháp của một tổ chức, thương hiệu, phạm vi gói, handle chủ sở hữu hoặc
namespace đã được xác nhận hoặc đặt trước trên ClawHub, hãy mở một
[vấn đề Yêu cầu xác nhận Tổ chức / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu xác nhận Tổ chức và Namespace](/vi/clawhub/namespace-claims) để biết cần bao gồm những gì và cần
loại trừ những gì khỏi các vấn đề công khai.

### Trước khi xuất bản Plugin

- Chọn một chủ sở hữu khớp với phạm vi gói.
- Bao gồm `openclaw.plugin.json`. Plugin mã cũng cần `package.json` với
  `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.
- Để hiển thị biểu tượng thẻ Plugin tùy chỉnh, hãy thêm `icon` vào `openclaw.plugin.json` với
  bất kỳ URL hình ảnh HTTPS nào.
- Bao gồm repository nguồn và metadata commit chính xác, hoặc dùng CLI từ một
  checkout dựa trên GitHub để CLI có thể phát hiện chúng.
- Chạy `clawhub package validate <source>` trước khi xuất bản. Đối với các phát hiện về gói,
  manifest, import SDK hoặc artifact, xem
  [Cách sửa lỗi xác thực Plugin](/vi/clawhub/plugin-validation-fixes).
- Chạy `clawhub package publish <source> --dry-run` trước khi tạo bản phát hành.
- Dự kiến các bản phát hành mới sẽ chưa xuất hiện trên các bề mặt cài đặt công khai cho đến khi
  kiểm tra bảo mật tự động và xác minh hoàn tất.

### Xuất bản tin cậy cho gói

Xuất bản tin cậy cho gói là một thiết lập hai bước:

1. Xuất bản gói một lần thông qua `clawhub package publish` thủ công thông thường hoặc được xác thực bằng token.
   Việc này tạo hàng gói và thiết lập các quản lý gói có thể thay đổi cấu hình nhà xuất bản tin cậy của gói.
2. Một quản lý gói đặt cấu hình nhà xuất bản tin cậy của GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Sau khi cấu hình được đặt, các lần xuất bản GitHub Actions được hỗ trợ trong tương lai có thể dùng
OIDC/xuất bản tin cậy mà không lưu token ClawHub dài hạn trong
repository. Repository và tên tệp workflow đã cấu hình phải khớp với
claim OIDC của GitHub Actions. Nếu bạn cũng truyền `--environment <name>`, claim môi trường GitHub
Actions phải khớp chính xác với tên đó.

ClawHub xác minh repository GitHub đã cấu hình khi cấu hình nhà xuất bản tin cậy
được đặt. Repository công khai có thể được xác minh thông qua metadata GitHub công khai.
Repository riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào repository đó,
ví dụ thông qua một cài đặt GitHub App của ClawHub trong tương lai hoặc một
tích hợp GitHub được ủy quyền khác.

Workflow xuất bản gói tái sử dụng hiện tại hỗ trợ xuất bản tin cậy không cần secret
cho các lần xuất bản `workflow_dispatch` khi có `id-token: write`.
Các lần xuất bản thực qua tag-push vẫn cần `clawhub_token`, vì vậy hãy giữ
`CLAWHUB_TOKEN` sẵn có cho các bản phát hành bằng tag, lần xuất bản đầu tiên, gói không tin cậy
hoặc các lần xuất bản khẩn cấp.

Kiểm tra hoặc xóa cấu hình bằng:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Xóa cấu hình nhà xuất bản tin cậy là đường dẫn rollback. Nó vô hiệu hóa việc
cấp token xuất bản tin cậy trong tương lai cho đến khi một quản lý gói đặt lại cấu hình.

## Câu hỏi thường gặp

### Phạm vi gói phải khớp với chủ sở hữu đã chọn

Nếu phạm vi gói và chủ sở hữu đã chọn không khớp, ClawHub từ chối
xuất bản:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Để sửa lỗi này, hãy chọn chủ sở hữu được đặt tên bởi phạm vi gói, hoặc đổi tên
gói để phạm vi khớp với chủ sở hữu mà bạn có thể xuất bản dưới tư cách đó.

Nếu tên gói đã có phạm vi đúng nhưng gói thuộc về nhà xuất bản
sai, hãy chuyển quyền sở hữu thay vào đó:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Chỉ dùng chuyển gói hoặc Skills khi bạn có quyền quản trị đối với cả
chủ sở hữu hiện tại và nhà xuất bản đích. Chuyển gói không cho phép bạn
xuất bản vào một phạm vi mà bạn không thể quản lý.

Nếu bạn không có quyền truy cập vào chủ sở hữu hiện tại nhưng tin rằng tổ chức, dự án hoặc
thương hiệu của bạn là chủ sở hữu namespace hợp pháp, hãy mở một
[vấn đề Yêu cầu xác nhận Tổ chức / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
với bằng chứng công khai, không nhạy cảm để nhân viên đánh giá. Xem
[Yêu cầu xác nhận Tổ chức và Namespace](/vi/clawhub/namespace-claims) trước khi gửi.

Điều này bảo vệ namespace của tổ chức. Một gói có tên `@openclaw/dronzer` tuyên bố
namespace `@openclaw`, vì vậy chỉ các nhà xuất bản có quyền truy cập vào chủ sở hữu `@openclaw`
mới có thể xuất bản nó.
