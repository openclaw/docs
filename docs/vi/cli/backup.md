---
read_when:
    - Bạn muốn một kho lưu trữ sao lưu hạng nhất cho trạng thái OpenClaw cục bộ
    - Bạn muốn xem trước những đường dẫn nào sẽ được bao gồm trước khi đặt lại hoặc gỡ cài đặt
summary: Tài liệu tham khảo CLI cho `openclaw backup` (tạo các tệp lưu trữ sao lưu cục bộ)
title: Sao lưu
x-i18n:
    generated_at: "2026-05-10T19:27:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Tạo một kho lưu trữ sao lưu cục bộ cho trạng thái OpenClaw, cấu hình, hồ sơ xác thực, thông tin xác thực của kênh/nhà cung cấp, phiên, và tùy chọn cả workspace.

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

- Kho lưu trữ bao gồm một tệp `manifest.json` với các đường dẫn nguồn đã phân giải và bố cục kho lưu trữ.
- Đầu ra mặc định là một kho lưu trữ `.tar.gz` có dấu thời gian trong thư mục làm việc hiện tại.
- Nếu thư mục làm việc hiện tại nằm bên trong một cây nguồn được sao lưu, OpenClaw sẽ chuyển về thư mục chính của bạn cho vị trí kho lưu trữ mặc định.
- Các tệp kho lưu trữ hiện có sẽ không bao giờ bị ghi đè.
- Các đường dẫn đầu ra bên trong cây trạng thái/workspace nguồn bị từ chối để tránh tự bao gồm.
- `openclaw backup verify <archive>` xác thực rằng kho lưu trữ chứa đúng một manifest gốc, từ chối các đường dẫn kho lưu trữ kiểu traversal, và kiểm tra rằng mọi payload được khai báo trong manifest đều tồn tại trong tarball.
- `openclaw backup create --verify` chạy xác thực đó ngay sau khi ghi kho lưu trữ.
- `openclaw backup create --only-config` chỉ sao lưu tệp cấu hình JSON đang hoạt động.

## Những gì được sao lưu

`openclaw backup create` lập kế hoạch các nguồn sao lưu từ bản cài đặt OpenClaw cục bộ của bạn:

- Thư mục trạng thái do bộ phân giải trạng thái cục bộ của OpenClaw trả về, thường là `~/.openclaw`
- Đường dẫn tệp cấu hình đang hoạt động
- Thư mục `credentials/` đã phân giải khi nó tồn tại bên ngoài thư mục trạng thái
- Các thư mục workspace được phát hiện từ cấu hình hiện tại, trừ khi bạn truyền `--no-include-workspace`

Hồ sơ xác thực model đã là một phần của thư mục trạng thái trong
`agents/<agentId>/agent/auth-profiles.json`, vì vậy chúng thường được bao phủ bởi mục
sao lưu trạng thái.

Nếu bạn dùng `--only-config`, OpenClaw bỏ qua việc phát hiện trạng thái, thư mục thông tin xác thực, và workspace, đồng thời chỉ lưu trữ đường dẫn tệp cấu hình đang hoạt động.

OpenClaw chuẩn hóa đường dẫn trước khi xây dựng kho lưu trữ. Nếu cấu hình, thư mục
thông tin xác thực, hoặc một workspace đã nằm bên trong thư mục trạng thái,
chúng sẽ không bị nhân bản thành các nguồn sao lưu cấp cao riêng biệt. Các đường dẫn bị thiếu sẽ
được bỏ qua.

Payload của kho lưu trữ lưu nội dung tệp từ các cây nguồn đó, và `manifest.json` được nhúng ghi lại các đường dẫn nguồn tuyệt đối đã phân giải cùng với bố cục kho lưu trữ được dùng cho từng tài sản.

Trong khi tạo kho lưu trữ, OpenClaw bỏ qua các tệp đột biến trực tiếp đã biết không có giá trị khôi phục, bao gồm bản ghi phiên agent đang hoạt động, nhật ký chạy Cron, nhật ký cuộn, hàng đợi giao nhận, tệp socket/pid/tạm thời trong thư mục trạng thái, và các tệp tạm thời durable-queue liên quan. Kết quả JSON bao gồm `skippedVolatileCount` để tự động hóa có thể thấy bao nhiêu tệp đã được cố ý bỏ qua.

Các tệp nguồn và manifest của Plugin đã cài đặt trong cây
`extensions/` của thư mục trạng thái được bao gồm, nhưng cây phụ thuộc `node_modules/`
lồng bên trong của chúng sẽ bị bỏ qua. Các phụ thuộc đó là tạo phẩm cài đặt có thể xây dựng lại; sau khi
khôi phục một kho lưu trữ, hãy dùng `openclaw plugins update <id>` hoặc cài đặt lại Plugin
bằng `openclaw plugins install <spec> --force` khi một Plugin đã khôi phục báo cáo
thiếu phụ thuộc.

## Hành vi khi cấu hình không hợp lệ

`openclaw backup` cố ý bỏ qua bước preflight cấu hình thông thường để vẫn có thể trợ giúp trong quá trình khôi phục. Vì việc phát hiện workspace phụ thuộc vào cấu hình hợp lệ, `openclaw backup create` giờ sẽ thất bại sớm khi tệp cấu hình tồn tại nhưng không hợp lệ và sao lưu workspace vẫn đang được bật.

Nếu bạn vẫn muốn sao lưu một phần trong tình huống đó, hãy chạy lại:

```bash
openclaw backup create --no-include-workspace
```

Cách này giữ trạng thái, cấu hình, và thư mục thông tin xác thực bên ngoài trong phạm vi, đồng thời
bỏ qua hoàn toàn việc phát hiện workspace.

Nếu bạn chỉ cần một bản sao của chính tệp cấu hình, `--only-config` cũng hoạt động khi cấu hình bị lỗi định dạng vì nó không dựa vào việc phân tích cấu hình để phát hiện workspace.

## Kích thước và hiệu năng

OpenClaw không áp đặt kích thước sao lưu tối đa tích hợp sẵn hoặc giới hạn kích thước theo từng tệp.

Các giới hạn thực tế đến từ máy cục bộ và hệ thống tệp đích:

- Dung lượng khả dụng cho việc ghi kho lưu trữ tạm thời cộng với kho lưu trữ cuối cùng
- Thời gian để duyệt các cây workspace lớn và nén chúng thành một `.tar.gz`
- Thời gian để quét lại kho lưu trữ nếu bạn dùng `openclaw backup create --verify` hoặc chạy `openclaw backup verify`
- Hành vi hệ thống tệp tại đường dẫn đích. OpenClaw ưu tiên bước xuất bản bằng hard link không ghi đè và chuyển sang sao chép độc quyền khi hard link không được hỗ trợ

Workspace lớn thường là yếu tố chính quyết định kích thước kho lưu trữ. Nếu bạn muốn một bản sao lưu nhỏ hơn hoặc nhanh hơn, hãy dùng `--no-include-workspace`.

Để có kho lưu trữ nhỏ nhất, hãy dùng `--only-config`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
