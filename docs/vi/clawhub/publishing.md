---
read_when:
    - Phát hành skill hoặc plugin
    - Gỡ lỗi chủ sở hữu hoặc lỗi phạm vi gói
    - Thêm hành vi xuất bản cho giao diện người dùng, CLI hoặc backend
summary: Cách hoạt động của việc phát hành trên ClawHub đối với Skills, plugin, chủ sở hữu, phạm vi, bản phát hành và quy trình review.
x-i18n:
    generated_at: "2026-07-19T05:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 582dffaf4429e9f24d7c38f2809cc7dc05f8471e4ae2f9c6be60153cc8604e3f
    source_path: clawhub/publishing.md
    workflow: 16
---

# Xuất bản

Việc xuất bản gửi một thư mục skill hoặc gói plugin đến ClawHub dưới chủ sở hữu mà bạn
chọn. ClawHub kiểm tra xem token của bạn có thể xuất bản cho chủ sở hữu đó hay không, xác thực
siêu dữ liệu, tên, phiên bản, tệp và thông tin nguồn, sau đó lưu trữ bản phát hành
và bắt đầu các kiểm tra bảo mật tự động.

Nếu xác thực không thành công, sẽ không có nội dung nào được xuất bản. Các bản phát hành mới cũng có thể chưa xuất hiện trên
các giao diện cài đặt và tải xuống thông thường cho đến khi quá trình review hoàn tất.

## Skills

Cách xuất bản đơn giản nhất là dùng CLI. Đăng nhập, sau đó xuất bản một thư mục skill
cục bộ:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Dùng `--owner <handle>` khi xuất bản cho chủ sở hữu là một tổ chức. Bỏ qua tùy chọn này để xuất bản với tư cách
người dùng đã xác thực. Quá trình xuất bản sẽ bỏ qua nội dung không thay đổi. Một skill mới bắt đầu
tại `1.0.0`, và các thay đổi sau đó sẽ tự động xuất bản phiên bản bản vá tiếp theo. Chỉ truyền
`--version` khi bạn cần một phiên bản cụ thể.

Đối với các kho lưu trữ danh mục, hãy dùng
[quy trình `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
có thể tái sử dụng của ClawHub. Quy trình này gọi `skill publish` cho từng thư mục skill trực tiếp trong `root` (mặc định:
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

Dùng `dry_run: true` để xem trước các skill mới và đã thay đổi mà không xuất bản.

## Plugin

Plugin sử dụng tên gói theo kiểu npm. Tên gói có phạm vi chứa chủ sở hữu trong
phần đầu tiên của tên:

```text
@owner/package-name
```

Phạm vi phải khớp với chủ sở hữu được chọn để xuất bản. Nếu gói của bạn có tên
`@openclaw/dronzer`, gói đó chỉ có thể được xuất bản dưới dạng `@openclaw`. Nếu bạn xuất bản với tư cách
`@vintageayu`, hãy đổi tên gói thành `@vintageayu/dronzer`.

Điều này ngăn một gói xác nhận quyền sở hữu không gian tên của một tổ chức mà nhà xuất bản
không kiểm soát.

Nếu bạn là chủ sở hữu hợp pháp của một tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu hoặc
không gian tên đã được xác nhận hoặc dành riêng trên ClawHub, hãy mở một
[vấn đề Yêu cầu quyền sở hữu tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
kèm bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu quyền sở hữu tổ chức và không gian tên](/clawhub/namespace-claims) để biết nội dung cần đưa vào và nội dung
không nên đưa vào các vấn đề công khai.

### Trước khi xuất bản Plugin

- Chọn chủ sở hữu khớp với phạm vi gói.
- Bao gồm `openclaw.plugin.json`. Các plugin mã cũng cần `package.json` với
  `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.
- Để hiển thị biểu tượng danh mục plugin tùy chỉnh trên trang chủ và các trang danh sách plugin,
  hãy thêm `icon` vào `openclaw.plugin.json` với bất kỳ URL hình ảnh HTTPS nào.
- Bao gồm kho lưu trữ nguồn và siêu dữ liệu commit chính xác, hoặc dùng CLI từ một
  bản checkout được GitHub lưu trữ để CLI có thể phát hiện chúng.
- Chạy `clawhub package validate <source>` trước khi xuất bản. Đối với các phát hiện liên quan đến gói,
  tệp kê khai, lệnh nhập SDK hoặc artifact, hãy xem
  [Cách khắc phục lỗi xác thực Plugin](/clawhub/plugin-validation-fixes).
- Chạy `clawhub package publish <source> --dry-run` trước khi tạo bản phát hành.
- Các bản phát hành mới sẽ chưa xuất hiện trên các giao diện cài đặt công khai cho đến khi các bước kiểm tra
  bảo mật tự động và xác minh hoàn tất.

### Xuất bản đáng tin cậy cho các gói

Thiết lập xuất bản đáng tin cậy cho gói gồm hai bước:

1. Xuất bản gói một lần thông qua `clawhub package publish`
   thủ công thông thường hoặc được xác thực bằng token. Việc này tạo hàng dữ liệu của gói và xác lập
   những người quản lý gói có thể thay đổi cấu hình nhà xuất bản đáng tin cậy của gói.
2. Một người quản lý gói thiết lập cấu hình nhà xuất bản đáng tin cậy của GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Sau khi cấu hình được thiết lập, các lần xuất bản được hỗ trợ từ GitHub Actions trong tương lai có thể dùng
OIDC/xuất bản đáng tin cậy mà không cần lưu token ClawHub dài hạn trong
kho lưu trữ. Kho lưu trữ và tên tệp quy trình GitHub đã cấu hình phải khớp với
khai báo OIDC của GitHub Actions. Nếu bạn cũng truyền `--environment <name>`, khai báo môi trường
GitHub Actions phải khớp chính xác với tên đó.

ClawHub xác minh kho lưu trữ GitHub đã cấu hình khi cấu hình nhà xuất bản đáng tin cậy
được thiết lập. Các kho lưu trữ công khai có thể được xác minh thông qua siêu dữ liệu GitHub công khai.
Các kho lưu trữ riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào kho lưu trữ đó,
ví dụ thông qua một lượt cài đặt GitHub App của ClawHub trong tương lai hoặc một
tích hợp GitHub được ủy quyền khác.

Quy trình xuất bản gói có thể tái sử dụng hiện tại hỗ trợ xuất bản đáng tin cậy
không cần secret cho các lần xuất bản `workflow_dispatch` khi có
`id-token: write`. Các lần xuất bản thực khi đẩy thẻ vẫn cần `clawhub_token`, vì vậy hãy giữ
`CLAWHUB_TOKEN` khả dụng cho các bản phát hành bằng thẻ, lần xuất bản đầu tiên, các gói không đáng tin cậy
hoặc các lần xuất bản khẩn cấp.

Kiểm tra hoặc xóa cấu hình bằng:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Xóa cấu hình nhà xuất bản đáng tin cậy là phương án hoàn tác. Việc này vô hiệu hóa khả năng tạo
token xuất bản đáng tin cậy trong tương lai cho đến khi người quản lý gói thiết lập lại cấu hình.

## Câu hỏi thường gặp

### Phạm vi gói phải khớp với chủ sở hữu đã chọn

Nếu phạm vi gói và chủ sở hữu đã chọn không khớp, ClawHub sẽ từ chối
lần xuất bản:

```text
Phạm vi gói "@openclaw" phải khớp với chủ sở hữu đã chọn "@vintageayu".
Hãy xuất bản với tư cách "@openclaw" hoặc đổi tên gói này thành "@vintageayu/dronzer".
```

Để khắc phục, hãy chọn chủ sở hữu được phạm vi gói chỉ định hoặc đổi tên
gói để phạm vi khớp với chủ sở hữu mà bạn có thể dùng để xuất bản.

Nếu tên gói đã có đúng phạm vi nhưng gói thuộc sở hữu của
nhà xuất bản không đúng, hãy chuyển quyền sở hữu:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Chỉ dùng tính năng chuyển gói hoặc skill khi bạn có quyền truy cập quản trị vào cả
chủ sở hữu hiện tại và nhà xuất bản đích. Việc chuyển gói không cho phép bạn
xuất bản vào một phạm vi mà bạn không thể quản lý.

Nếu bạn không có quyền truy cập vào chủ sở hữu hiện tại nhưng tin rằng tổ chức, dự án hoặc
thương hiệu của mình là chủ sở hữu hợp pháp của không gian tên, hãy mở một
[vấn đề Yêu cầu quyền sở hữu tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
kèm bằng chứng công khai, không nhạy cảm để nhân viên review. Xem
[Yêu cầu quyền sở hữu tổ chức và không gian tên](/clawhub/namespace-claims) trước khi gửi.

Điều này bảo vệ không gian tên của tổ chức. Một gói có tên `@openclaw/dronzer` xác nhận quyền sở hữu
không gian tên `@openclaw`, vì vậy chỉ những nhà xuất bản có quyền truy cập vào chủ sở hữu `@openclaw`
mới có thể xuất bản gói đó.
