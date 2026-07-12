---
read_when:
    - Phát hành một skill hoặc plugin
    - Gỡ lỗi quyền sở hữu hoặc lỗi phạm vi gói
    - Bổ sung giao diện người dùng, CLI hoặc hành vi phần phụ trợ cho việc phát hành
summary: Cách hoạt động của quy trình xuất bản trên ClawHub đối với Skills, plugin, chủ sở hữu, phạm vi, bản phát hành và quy trình đánh giá.
x-i18n:
    generated_at: "2026-07-12T07:45:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Xuất bản

Việc xuất bản sẽ gửi một thư mục skill hoặc gói Plugin lên ClawHub dưới chủ sở hữu mà bạn chọn. ClawHub kiểm tra xem token của bạn có quyền xuất bản cho chủ sở hữu đó hay không, xác thực siêu dữ liệu, tên, phiên bản, tệp và thông tin nguồn, sau đó lưu bản phát hành và bắt đầu các quy trình kiểm tra bảo mật tự động.

Nếu xác thực không thành công, sẽ không có nội dung nào được xuất bản. Các bản phát hành mới cũng có thể chưa xuất hiện trên các giao diện cài đặt và tải xuống thông thường cho đến khi quá trình xét duyệt hoàn tất.

## Skills

Cách xuất bản đơn giản nhất là dùng CLI. Đăng nhập, sau đó xuất bản một thư mục skill cục bộ:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Dùng `--owner <handle>` khi xuất bản dưới chủ sở hữu là một tổ chức. Bỏ qua tùy chọn này để xuất bản với tư cách người dùng đã xác thực. Quá trình xuất bản sẽ bỏ qua nội dung không thay đổi. Một skill mới bắt đầu ở phiên bản `1.0.0`, và các thay đổi sau đó sẽ tự động xuất bản phiên bản vá tiếp theo. Chỉ truyền `--version` khi bạn cần chỉ định phiên bản rõ ràng.

Đối với các kho lưu trữ danh mục, hãy dùng
[quy trình công việc `skill-publish.yml` có thể tái sử dụng của ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Quy trình này gọi `skill publish` cho từng thư mục skill trực tiếp bên dưới `root` (mặc định:
`skills`), hoặc chỉ thư mục được cung cấp qua `skill_path`.

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

## Plugins

Các Plugin sử dụng tên gói theo kiểu npm. Tên gói có phạm vi bao gồm chủ sở hữu ở phần đầu của tên:

```text
@owner/package-name
```

Phạm vi phải khớp với chủ sở hữu xuất bản đã chọn. Nếu gói của bạn có tên
`@openclaw/dronzer`, gói đó chỉ có thể được xuất bản dưới `@openclaw`. Nếu bạn xuất bản dưới
`@vintageayu`, hãy đổi tên gói thành `@vintageayu/dronzer`.

Điều này ngăn một gói chiếm dụng không gian tên của tổ chức mà nhà xuất bản không kiểm soát.

Nếu bạn là chủ sở hữu hợp pháp của một tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu hoặc không gian tên đã bị chiếm dụng hoặc được bảo lưu trên ClawHub, hãy mở một
[vấn đề Yêu cầu quyền sở hữu tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
kèm bằng chứng công khai, không nhạy cảm. Xem
[Yêu cầu quyền sở hữu tổ chức và không gian tên](/clawhub/namespace-claims) để biết nội dung cần cung cấp và nội dung không nên đưa vào các vấn đề công khai.

### Trước khi xuất bản Plugin

- Chọn chủ sở hữu khớp với phạm vi gói.
- Bao gồm `openclaw.plugin.json`. Các Plugin có mã cũng cần `package.json` với
  `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.
- Để hiển thị biểu tượng thẻ Plugin tùy chỉnh, hãy thêm `icon` vào `openclaw.plugin.json` với bất kỳ URL hình ảnh HTTPS nào.
- Bao gồm kho lưu trữ mã nguồn và siêu dữ liệu commit chính xác, hoặc sử dụng CLI từ một bản checkout được lưu trữ trên GitHub để CLI có thể phát hiện các thông tin đó.
- Chạy `clawhub package validate <source>` trước khi xuất bản. Đối với các phát hiện liên quan đến gói, manifest, lệnh nhập SDK hoặc artifact, hãy xem
  [Cách khắc phục lỗi xác thực Plugin](/clawhub/plugin-validation-fixes).
- Chạy `clawhub package publish <source> --dry-run` trước khi tạo bản phát hành.
- Dự kiến các bản phát hành mới sẽ chưa xuất hiện trên các giao diện cài đặt công khai cho đến khi quá trình kiểm tra và xác minh bảo mật tự động hoàn tất.

### Xuất bản tin cậy cho các gói

Việc thiết lập xuất bản tin cậy cho gói gồm hai bước:

1. Xuất bản gói một lần thông qua `clawhub package publish` thông thường bằng phương thức thủ công hoặc xác thực bằng token. Thao tác này tạo bản ghi gói và xác lập những người quản lý gói có thể thay đổi cấu hình nhà xuất bản tin cậy của gói.
2. Một người quản lý gói thiết lập cấu hình nhà xuất bản tin cậy của GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Sau khi thiết lập cấu hình, các lần xuất bản được hỗ trợ trong tương lai từ GitHub Actions có thể dùng OIDC/xuất bản tin cậy mà không cần lưu token ClawHub dài hạn trong kho lưu trữ. Kho lưu trữ và tên tệp quy trình công việc đã cấu hình phải khớp với claim OIDC của GitHub Actions. Nếu bạn cũng truyền `--environment <name>`, claim môi trường của GitHub Actions phải khớp chính xác với tên đó.

ClawHub xác minh kho lưu trữ GitHub đã cấu hình khi cấu hình nhà xuất bản tin cậy được thiết lập. Các kho lưu trữ công khai có thể được xác minh thông qua siêu dữ liệu GitHub công khai. Các kho lưu trữ riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào kho lưu trữ đó, chẳng hạn thông qua một bản cài đặt ClawHub GitHub App trong tương lai hoặc một tích hợp GitHub được ủy quyền khác.

Quy trình công việc xuất bản gói có thể tái sử dụng hiện tại hỗ trợ xuất bản tin cậy không cần secret đối với các lần xuất bản qua `workflow_dispatch` khi có quyền `id-token: write`. Các lần xuất bản thực sự bằng thao tác đẩy thẻ vẫn cần `clawhub_token`, vì vậy hãy duy trì `CLAWHUB_TOKEN` cho các bản phát hành bằng thẻ, lần xuất bản đầu tiên, gói không tin cậy hoặc lần xuất bản khẩn cấp.

Kiểm tra hoặc xóa cấu hình bằng:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Xóa cấu hình nhà xuất bản tin cậy là phương án hoàn tác. Thao tác này vô hiệu hóa việc tạo token xuất bản tin cậy trong tương lai cho đến khi người quản lý gói thiết lập lại cấu hình.

## Câu hỏi thường gặp

### Phạm vi gói phải khớp với chủ sở hữu đã chọn

Nếu phạm vi gói và chủ sở hữu đã chọn không khớp, ClawHub sẽ từ chối xuất bản:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Để khắc phục, hãy chọn chủ sở hữu được chỉ định bởi phạm vi gói hoặc đổi tên gói để phạm vi khớp với chủ sở hữu mà bạn có thể dùng để xuất bản.

Nếu tên gói đã có phạm vi đúng nhưng gói thuộc sở hữu của nhà xuất bản không đúng, hãy chuyển quyền sở hữu:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Chỉ sử dụng tính năng chuyển gói hoặc skill khi bạn có quyền quản trị đối với cả chủ sở hữu hiện tại và nhà xuất bản đích. Việc chuyển gói không cho phép bạn xuất bản vào một phạm vi mà bạn không thể quản lý.

Nếu bạn không có quyền truy cập vào chủ sở hữu hiện tại nhưng tin rằng tổ chức, dự án hoặc thương hiệu của mình là chủ sở hữu hợp pháp của không gian tên, hãy mở một
[vấn đề Yêu cầu quyền sở hữu tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
kèm bằng chứng công khai, không nhạy cảm để nhân viên xét duyệt. Xem
[Yêu cầu quyền sở hữu tổ chức và không gian tên](/clawhub/namespace-claims) trước khi gửi.

Điều này bảo vệ không gian tên của tổ chức. Một gói có tên `@openclaw/dronzer` chiếm dụng không gian tên
`@openclaw`, vì vậy chỉ những nhà xuất bản có quyền truy cập vào chủ sở hữu `@openclaw` mới có thể xuất bản gói đó.
