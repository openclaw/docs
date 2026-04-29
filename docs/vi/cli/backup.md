---
read_when:
    - Bạn muốn một bản lưu trữ sao lưu hạng nhất cho trạng thái OpenClaw cục bộ
    - Bạn muốn xem trước các đường dẫn sẽ được bao gồm trước khi đặt lại hoặc gỡ cài đặt
summary: Tài liệu tham khảo CLI cho `openclaw backup` (tạo các kho lưu trữ sao lưu cục bộ)
title: Sao lưu
x-i18n:
    generated_at: "2026-04-29T22:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Tạo kho lưu trữ sao lưu cục bộ cho trạng thái, cấu hình, hồ sơ xác thực, thông tin xác thực kênh/nhà cung cấp, phiên và tùy chọn cả workspace của OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Ghi chú

- Kho lưu trữ bao gồm tệp `manifest.json` chứa các đường dẫn nguồn đã phân giải và bố cục kho lưu trữ.
- Đầu ra mặc định là một kho lưu trữ `.tar.gz` có dấu thời gian trong thư mục làm việc hiện tại.
- Nếu thư mục làm việc hiện tại nằm trong cây nguồn đang được sao lưu, OpenClaw sẽ dùng thư mục home của bạn làm vị trí kho lưu trữ mặc định.
- Các tệp kho lưu trữ hiện có sẽ không bao giờ bị ghi đè.
- Các đường dẫn đầu ra bên trong cây trạng thái/workspace nguồn bị từ chối để tránh tự đưa chính nó vào.
- `openclaw backup verify <archive>` xác thực rằng kho lưu trữ chứa đúng một manifest gốc, từ chối các đường dẫn kho lưu trữ kiểu traversal và kiểm tra rằng mọi payload được khai báo trong manifest đều tồn tại trong tarball.
- `openclaw backup create --verify` chạy bước xác thực đó ngay sau khi ghi kho lưu trữ.
- `openclaw backup create --only-config` chỉ sao lưu tệp cấu hình JSON đang hoạt động.

## Những gì được sao lưu

`openclaw backup create` lập kế hoạch các nguồn sao lưu từ bản cài đặt OpenClaw cục bộ của bạn:

- Thư mục trạng thái do bộ phân giải trạng thái cục bộ của OpenClaw trả về, thường là `~/.openclaw`
- Đường dẫn tệp cấu hình đang hoạt động
- Thư mục `credentials/` đã phân giải khi thư mục đó tồn tại bên ngoài thư mục trạng thái
- Các thư mục workspace được phát hiện từ cấu hình hiện tại, trừ khi bạn truyền `--no-include-workspace`

Hồ sơ xác thực mô hình đã là một phần của thư mục trạng thái dưới
`agents/<agentId>/agent/auth-profiles.json`, nên thông thường chúng được bao phủ bởi
mục sao lưu trạng thái.

Nếu bạn dùng `--only-config`, OpenClaw bỏ qua việc phát hiện trạng thái, thư mục thông tin xác thực và workspace, đồng thời chỉ lưu trữ đường dẫn tệp cấu hình đang hoạt động.

OpenClaw chuẩn hóa đường dẫn trước khi xây dựng kho lưu trữ. Nếu cấu hình, thư mục
thông tin xác thực hoặc workspace đã nằm bên trong thư mục trạng thái,
chúng sẽ không bị sao chép thành các nguồn sao lưu cấp cao nhất riêng biệt. Các đường dẫn bị thiếu sẽ
được bỏ qua.

Payload của kho lưu trữ lưu nội dung tệp từ các cây nguồn đó, và `manifest.json` được nhúng ghi lại các đường dẫn nguồn tuyệt đối đã phân giải cùng bố cục kho lưu trữ được dùng cho từng tài sản.

Các tệp nguồn và manifest của Plugin đã cài đặt bên dưới cây
`extensions/` của thư mục trạng thái được bao gồm, nhưng các cây phụ thuộc
`node_modules/` lồng bên trong sẽ bị bỏ qua. Các phụ thuộc đó là artifact cài đặt có thể dựng lại; sau khi
khôi phục một kho lưu trữ, hãy dùng `openclaw plugins update <id>` hoặc cài đặt lại Plugin
bằng `openclaw plugins install <spec> --force` khi Plugin đã khôi phục báo cáo
thiếu phụ thuộc.

## Hành vi cấu hình không hợp lệ

`openclaw backup` cố ý bỏ qua bước kiểm tra sơ bộ cấu hình thông thường để vẫn có thể hỗ trợ trong quá trình khôi phục. Vì việc phát hiện workspace phụ thuộc vào cấu hình hợp lệ, `openclaw backup create` hiện sẽ thất bại sớm khi tệp cấu hình tồn tại nhưng không hợp lệ và sao lưu workspace vẫn đang được bật.

Nếu bạn vẫn muốn sao lưu một phần trong tình huống đó, hãy chạy lại:

```bash
openclaw backup create --no-include-workspace
```

Điều đó giữ trạng thái, cấu hình và thư mục thông tin xác thực bên ngoài trong phạm vi trong khi
bỏ qua hoàn toàn việc phát hiện workspace.

Nếu bạn chỉ cần một bản sao của chính tệp cấu hình, `--only-config` cũng hoạt động khi cấu hình bị sai định dạng vì tùy chọn này không dựa vào việc phân tích cấu hình để phát hiện workspace.

## Kích thước và hiệu năng

OpenClaw không áp đặt kích thước sao lưu tối đa tích hợp sẵn hoặc giới hạn kích thước theo từng tệp.

Các giới hạn thực tế đến từ máy cục bộ và hệ thống tệp đích:

- Dung lượng còn trống cho thao tác ghi kho lưu trữ tạm thời cộng với kho lưu trữ cuối cùng
- Thời gian để duyệt các cây workspace lớn và nén chúng thành `.tar.gz`
- Thời gian để quét lại kho lưu trữ nếu bạn dùng `openclaw backup create --verify` hoặc chạy `openclaw backup verify`
- Hành vi hệ thống tệp tại đường dẫn đích. OpenClaw ưu tiên bước xuất bản bằng hard link không ghi đè và chuyển sang sao chép độc quyền khi hard link không được hỗ trợ

Các workspace lớn thường là yếu tố chính quyết định kích thước kho lưu trữ. Nếu bạn muốn bản sao lưu nhỏ hơn hoặc nhanh hơn, hãy dùng `--no-include-workspace`.

Để có kho lưu trữ nhỏ nhất, hãy dùng `--only-config`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
