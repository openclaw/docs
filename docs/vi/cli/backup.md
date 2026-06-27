---
read_when:
    - Bạn muốn một kho lưu trữ sao lưu hạng nhất cho trạng thái OpenClaw cục bộ
    - Bạn muốn xem trước những đường dẫn nào sẽ được bao gồm trước khi đặt lại hoặc gỡ cài đặt
summary: Tham chiếu CLI cho `openclaw backup` (tạo kho lưu trữ sao lưu cục bộ)
title: Sao lưu
x-i18n:
    generated_at: "2026-06-27T17:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Tạo một kho lưu trữ sao lưu cục bộ cho trạng thái, cấu hình, hồ sơ xác thực, thông tin xác thực kênh/nhà cung cấp, phiên, và tùy chọn cả không gian làm việc của OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Ghi chú

- Kho lưu trữ bao gồm một tệp `manifest.json` với các đường dẫn nguồn đã phân giải và bố cục kho lưu trữ.
- Đầu ra mặc định là một kho lưu trữ `.tar.gz` có dấu thời gian trong thư mục làm việc hiện tại.
- Tên tệp sao lưu có dấu thời gian sử dụng múi giờ cục bộ của máy bạn và bao gồm độ lệch UTC.
- Nếu thư mục làm việc hiện tại nằm bên trong một cây nguồn được sao lưu, OpenClaw sẽ chuyển sang dùng thư mục chính của bạn làm vị trí kho lưu trữ mặc định.
- Các tệp kho lưu trữ hiện có sẽ không bao giờ bị ghi đè.
- Các đường dẫn đầu ra bên trong cây trạng thái/không gian làm việc nguồn bị từ chối để tránh tự bao gồm chính nó.
- `openclaw backup verify <archive>` xác thực rằng kho lưu trữ chứa đúng một manifest gốc, từ chối các đường dẫn kho lưu trữ kiểu duyệt vượt thư mục, và kiểm tra rằng mọi payload được khai báo trong manifest đều tồn tại trong tarball.
- `openclaw backup create --verify` chạy xác thực đó ngay sau khi ghi kho lưu trữ.
- `openclaw backup create --only-config` chỉ sao lưu tệp cấu hình JSON đang hoạt động.

## Những gì được sao lưu

`openclaw backup create` lập kế hoạch các nguồn sao lưu từ bản cài đặt OpenClaw cục bộ của bạn:

- Thư mục trạng thái được trả về bởi bộ phân giải trạng thái cục bộ của OpenClaw, thường là `~/.openclaw`
- Đường dẫn tệp cấu hình đang hoạt động
- Thư mục `credentials/` đã phân giải khi nó tồn tại bên ngoài thư mục trạng thái
- Các thư mục không gian làm việc được phát hiện từ cấu hình hiện tại, trừ khi bạn truyền `--no-include-workspace`

Hồ sơ xác thực mô hình đã là một phần của thư mục trạng thái trong
`agents/<agentId>/agent/auth-profiles.json`, nên chúng thường được bao phủ bởi mục
sao lưu trạng thái.

Nếu bạn dùng `--only-config`, OpenClaw bỏ qua việc phát hiện trạng thái, thư mục thông tin xác thực, và không gian làm việc, đồng thời chỉ lưu trữ đường dẫn tệp cấu hình đang hoạt động.

OpenClaw chuẩn hóa đường dẫn trước khi xây dựng kho lưu trữ. Nếu cấu hình,
thư mục thông tin xác thực, hoặc một không gian làm việc đã nằm bên trong thư mục trạng thái,
chúng sẽ không bị nhân đôi thành các nguồn sao lưu cấp cao nhất riêng biệt. Các đường dẫn bị thiếu sẽ
được bỏ qua.

Payload của kho lưu trữ lưu nội dung tệp từ các cây nguồn đó, và `manifest.json` được nhúng ghi lại các đường dẫn nguồn tuyệt đối đã phân giải cùng với bố cục kho lưu trữ được dùng cho từng tài sản.

Trong khi tạo kho lưu trữ, OpenClaw bỏ qua các tệp đột biến trực tiếp đã biết không có giá trị khôi phục, bao gồm bản ghi phiên tác tử đang hoạt động, nhật ký chạy cron, nhật ký cuộn, hàng đợi phân phối, tệp socket/pid/tạm thời trong thư mục trạng thái, và các tệp tạm thời hàng đợi bền vững liên quan. Kết quả JSON bao gồm `skippedVolatileCount` để tự động hóa có thể biết bao nhiêu tệp đã được cố ý bỏ qua.

Các tệp nguồn và manifest Plugin đã cài đặt trong cây `extensions/` của thư mục trạng thái
được bao gồm, nhưng các cây phụ thuộc `node_modules/` lồng bên trong của chúng
bị bỏ qua. Những phụ thuộc đó là các tạo phẩm cài đặt có thể xây dựng lại; sau khi
khôi phục một kho lưu trữ, hãy dùng `openclaw plugins update <id>` hoặc cài đặt lại Plugin
bằng `openclaw plugins install <spec> --force` khi một Plugin đã khôi phục báo cáo
thiếu phụ thuộc.

## Hành vi cấu hình không hợp lệ

`openclaw backup` cố ý bỏ qua bước tiền kiểm cấu hình bình thường để vẫn có thể hỗ trợ trong quá trình khôi phục. Vì việc phát hiện không gian làm việc phụ thuộc vào cấu hình hợp lệ, `openclaw backup create` hiện thất bại nhanh khi tệp cấu hình tồn tại nhưng không hợp lệ và sao lưu không gian làm việc vẫn được bật.

Nếu bạn vẫn muốn sao lưu một phần trong tình huống đó, hãy chạy lại:

```bash
openclaw backup create --no-include-workspace
```

Thao tác đó giữ trạng thái, cấu hình, và thư mục thông tin xác thực bên ngoài trong phạm vi trong khi
bỏ qua hoàn toàn việc phát hiện không gian làm việc.

Nếu bạn chỉ cần một bản sao của chính tệp cấu hình, `--only-config` cũng hoạt động khi cấu hình bị sai định dạng vì nó không dựa vào việc phân tích cấu hình để phát hiện không gian làm việc.

## Kích thước và hiệu năng

OpenClaw không áp đặt kích thước sao lưu tối đa tích hợp sẵn hoặc giới hạn kích thước cho từng tệp.

Các giới hạn thực tế đến từ máy cục bộ và hệ thống tệp đích:

- Dung lượng khả dụng để ghi kho lưu trữ tạm thời cộng với kho lưu trữ cuối cùng
- Thời gian để duyệt các cây không gian làm việc lớn và nén chúng thành một `.tar.gz`
- Thời gian để quét lại kho lưu trữ nếu bạn dùng `openclaw backup create --verify` hoặc chạy `openclaw backup verify`
- Hành vi hệ thống tệp tại đường dẫn đích. OpenClaw ưu tiên bước phát hành hard-link không ghi đè và chuyển sang sao chép độc quyền khi hard link không được hỗ trợ

Các không gian làm việc lớn thường là yếu tố chính quyết định kích thước kho lưu trữ. Nếu bạn muốn bản sao lưu nhỏ hơn hoặc nhanh hơn, hãy dùng `--no-include-workspace`.

Để có kho lưu trữ nhỏ nhất, hãy dùng `--only-config`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
