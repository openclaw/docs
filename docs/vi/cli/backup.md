---
read_when:
    - Bạn muốn một kho lưu trữ sao lưu chính thức cho trạng thái OpenClaw cục bộ
    - Bạn cần một bản chụp nhanh nhỏ gọn, đã được xác minh của một cơ sở dữ liệu SQLite OpenClaw
    - Bạn muốn xem trước những đường dẫn nào sẽ được bao gồm trước khi đặt lại hoặc gỡ cài đặt
summary: Tài liệu tham khảo CLI cho `openclaw backup` (bản lưu trữ và ảnh chụp nhanh SQLite)
title: Sao lưu
x-i18n:
    generated_at: "2026-07-19T05:39:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa9444b5e57e9c6f9492e4b017be96ea8d9da88cf335fd163ea6744975fda37b
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Tạo kho lưu trữ sao lưu cục bộ cho trạng thái, cấu hình, hồ sơ xác thực, thông tin xác thực của kênh/nhà cung cấp, phiên và các không gian làm việc tùy chọn của OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## Ghi chú

- Kho lưu trữ nhúng một `manifest.json` chứa các đường dẫn nguồn đã phân giải và bố cục kho lưu trữ.
- Đầu ra mặc định là một kho lưu trữ `.tar.gz` có dấu thời gian trong thư mục làm việc hiện tại. Tên tệp có dấu thời gian sử dụng múi giờ cục bộ của máy và bao gồm độ lệch UTC. Nếu thư mục làm việc hiện tại nằm trong cây nguồn được sao lưu, OpenClaw sẽ dùng thư mục chính của bạn làm vị trí kho lưu trữ mặc định.
- Các tệp kho lưu trữ hiện có không bao giờ bị ghi đè. Các đường dẫn đầu ra bên trong cây trạng thái/không gian làm việc nguồn bị từ chối để tránh tự đưa chính chúng vào.
- `openclaw backup verify <archive>` kiểm tra rằng kho lưu trữ chứa chính xác một manifest gốc, từ chối các đường dẫn kho lưu trữ kiểu duyệt xuyên thư mục và các tệp phụ SQLite, xác nhận mọi payload được khai báo trong manifest đều tồn tại, xác thực hình dạng tệp của mọi ảnh chụp nhanh SQLite, đồng thời chạy kiểm tra toàn vẹn đầy đủ và kiểm tra vai trò trên các cơ sở dữ liệu OpenClaw chuẩn. Các schema Plugin chuyên dụng vẫn được coi là dữ liệu không trong suốt vì chúng có thể yêu cầu các khả năng SQLite do chủ sở hữu định nghĩa. `openclaw backup create --verify` chạy quy trình xác thực đó ngay sau khi ghi kho lưu trữ.
- `openclaw backup create --only-config` chỉ sao lưu tệp cấu hình JSON đang hoạt động.

## Ảnh chụp nhanh SQLite

Sử dụng `openclaw backup sqlite` khi bạn cần một sản phẩm có tính di động cho một cơ sở dữ liệu SQLite do OpenClaw sở hữu thay vì một kho lưu trữ trạng thái diện rộng.

Thao tác tạo ảnh chụp nhanh chấp nhận chính xác một nguồn được đặt tên:

| Lệnh                                                            | Cơ sở dữ liệu                     |
| --------------------------------------------------------------- | --------------------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | Trạng thái OpenClaw dùng chung    |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | Một cơ sở dữ liệu cho mỗi tác tử |

Kho chứa có một thư mục cho mỗi ảnh chụp nhanh đã được xác nhận. Mỗi thư mục ảnh chụp nhanh chứa chính xác:

- `manifest.json`
- `database.sqlite`

Quá trình tạo ảnh chụp nhanh xác minh cơ sở dữ liệu trực tiếp trước khi đọc, sử dụng `VACUUM INTO` của SQLite để thu thập trạng thái WAL đã được xác nhận vào một cơ sở dữ liệu thu gọn, xác minh lại cơ sở dữ liệu đã tạo và phát hành thư mục hoàn chỉnh mà không ghi đè các đường dẫn hiện có. Ảnh chụp nhanh toàn cục xóa các hàng hàng đợi phân phối tạm thời và thu gọn lại để payload hàng đợi đã xóa không bị giữ lại trong các trang trống.

Không sao chép các tệp `.sqlite`, `-wal`, `-shm` hoặc `-journal` đang hoạt động để làm sản phẩm có tính di động. Chỉ sao chép các thư mục ảnh chụp nhanh đã hoàn tất.

Ảnh chụp nhanh SQLite có thể chứa hồ sơ xác thực, trạng thái phiên, trạng thái Plugin và các bản ghi nhạy cảm khác. Hãy bảo vệ các kho chứa bằng cùng quyền, mã hóa, chính sách lưu giữ và giới hạn đích như thư mục trạng thái OpenClaw đang hoạt động.

### Xác minh và khôi phục

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

Quá trình xác minh kiểm tra hình dạng manifest nghiêm ngặt, kích thước và SHA-256 của sản phẩm, tính toàn vẹn SQLite, khóa ngoại, phiên bản schema, vai trò và chủ sở hữu cơ sở dữ liệu, cũng như các định nghĩa chỉ mục do OpenClaw sở hữu.

Quá trình xác minh kiểm tra một bản sao riêng tư được ghim theo nội dung để các tình trạng tương tranh về tên đường dẫn không thể tráo đổi các byte mà SQLite kiểm tra. Theo mặc định, bản sao tạm thời đó được tạo bên cạnh kho chứa ảnh chụp nhanh và bị xóa trước khi lệnh trả về. Thư mục gốc dàn dựng và chuỗi thư mục tổ tiên của nó phải ngăn người dùng khác thay thế thư mục đó. Các thư mục gốc POSIX phải thuộc sở hữu của người dùng hiện tại và không cho phép nhóm/mọi người ghi; các thư mục tổ tiên có sticky bit như `/tmp` được chấp nhận đối với thư mục con do người dùng sở hữu. Các quyền ACL của macOS khiến khu vực dàn dựng bị lộ hoặc có thể bị thay thế sẽ bị từ chối. Các thư mục gốc và thư mục tổ tiên trên Windows phải thuộc sở hữu của người dùng hiện tại hoặc một chủ thể hệ điều hành đáng tin cậy, với ACL từ chối quyền truy cập dàn dựng không đáng tin cậy. Đối với điểm gắn kết chỉ đọc hoặc ổ chia sẻ mạng, hãy truyền `--scratch <existing-private-directory>` trên bộ lưu trữ có các biện pháp kiểm soát mã hóa và đích tương đương.

Quá trình tạo ảnh chụp nhanh áp dụng cùng các kiểm tra về chủ sở hữu, ACL, thư mục tổ tiên và danh tính đường dẫn cho kho chứa trước khi dàn dựng hoặc phát hành các byte cơ sở dữ liệu.

Quá trình khôi phục lặp lại việc xác minh và chỉ ghi vào một đích mới. Thao tác này từ chối đích, tệp phụ `-wal`, `-shm` hoặc `-journal` hiện có và không bao giờ thay thế tại chỗ một cơ sở dữ liệu OpenClaw đang hoạt động. Thư mục cha của đích có cùng các yêu cầu bảo mật đường dẫn như vùng tạm xác minh. Việc kích hoạt cơ sở dữ liệu đã khôi phục vẫn là một bước ngoại tuyến rõ ràng do người vận hành thực hiện.

Kho chứa ảnh chụp nhanh là các thư mục cục bộ. Việc lập lịch, tải lên, lưu giữ, tạo gói WAL tăng dần, chuyển đổi dự phòng và khôi phục khi khởi động được chủ ý đặt ngoài phạm vi của lệnh này.

## Nội dung được sao lưu

`openclaw backup create` lập kế hoạch các nguồn từ bản cài đặt OpenClaw cục bộ của bạn:

- Thư mục trạng thái (thường là `~/.openclaw`)
- Đường dẫn tệp cấu hình đang hoạt động
- Thư mục `credentials/` đã phân giải khi thư mục này tồn tại bên ngoài thư mục trạng thái
- Các thư mục không gian làm việc được phát hiện từ cấu hình hiện tại, trừ khi bạn truyền `--no-include-workspace`

Hồ sơ xác thực và trạng thái thời gian chạy khác của từng tác tử nằm trong SQLite bên dưới thư mục trạng thái (`agents/<agentId>/agent/openclaw-agent.sqlite`), vì vậy chúng tự động được bao gồm trong mục sao lưu trạng thái.

`--only-config` bỏ qua việc phát hiện trạng thái, thư mục thông tin xác thực và không gian làm việc, đồng thời chỉ lưu trữ đường dẫn tệp cấu hình đang hoạt động.

OpenClaw chuẩn hóa các đường dẫn trước khi tạo kho lưu trữ: nếu cấu hình, thư mục thông tin xác thực hoặc một không gian làm việc đã nằm bên trong thư mục trạng thái, chúng sẽ không bị sao chép thành các nguồn sao lưu cấp cao nhất riêng biệt. Các đường dẫn bị thiếu sẽ được bỏ qua.

Trong quá trình tạo kho lưu trữ, OpenClaw loại trừ các đường dẫn có hoạt động thay đổi trực tiếp đã biết trước khi `tar` đọc chúng. Điều này tránh tình trạng tương tranh giữa kích thước đã ghi nhận của tệp và các lần ghi đồng thời. Bộ lọc áp dụng các quy tắc tương đối với trạng thái sau đây dưới mỗi thư mục trạng thái được sao lưu:

| Phạm vi tương đối với trạng thái                  | Hậu tố tệp bị bỏ qua                     |
| ------------------------------------------------- | ---------------------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`  |
| `agents/<agentId>/sessions/**`                                | `.jsonl`, `.log`  |
| `cron/runs/**`                                | `.jsonl`, `.log`  |
| `logs/**`                                | `.jsonl`, `.log`  |
| `delivery-queue/**`                                | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                                | `.json`, `.delivered`, `.tmp` |
| Mọi đường dẫn dưới thư mục trạng thái được sao lưu | `.sock`, `.pid`, `.tmp` |

Các quy tắc này không lọc các tệp không gian làm việc bên ngoài thư mục trạng thái. Chúng cũng bỏ qua các tệp bản chép lời và nhật ký đã hoàn tất khớp với bảng, vì vậy hãy lưu giữ riêng các bản ghi đó khi cần. `skippedVolatileCount` trong kết quả JSON báo cáo số lượng tệp đã được chủ ý bỏ qua.

Các cơ sở dữ liệu SQLite bên dưới thư mục trạng thái được thu gọn bằng `VACUUM INTO` để phần dữ liệu còn sót lại trong các trang đã xóa không đi vào kho lưu trữ, đồng thời các tệp WAL/SHM đang hoạt động không bị sao chép. Một cơ sở dữ liệu do Plugin sở hữu yêu cầu các khả năng SQLite do chủ sở hữu định nghĩa nhưng không có sẵn sẽ đóng an toàn thay vì chuyển sang sao chép trang thô. Các tệp SQLite được đưa vào thông qua sao lưu không gian làm việc được sao chép như tệp không gian làm việc và không thuộc phạm vi đảm bảo thu gọn.

Các tệp nguồn và manifest của Plugin đã cài đặt bên dưới cây `extensions/` của thư mục trạng thái được bao gồm, nhưng các cây phụ thuộc `node_modules/` lồng bên trong bị bỏ qua vì là sản phẩm cài đặt có thể tạo lại. Sau khi khôi phục kho lưu trữ, hãy sử dụng `openclaw plugins update <id>` hoặc cài đặt lại bằng `openclaw plugins install <spec> --force` nếu một Plugin đã khôi phục báo cáo thiếu phần phụ thuộc.

Các thư mục gốc thời gian chạy do trình cài đặt quản lý và có thể tạo lại bên dưới thư mục trạng thái cũng bị bỏ qua: `dev/`, `git/`, `npm/`, `npm-runtime/` cũ và `tools/`. Chúng chứa các bản checkout được quản lý, cây gói và thời gian chạy đã tải xuống thay vì trạng thái người dùng có thẩm quyền; hãy cài đặt lại hoặc cập nhật thời gian chạy hay Plugin tương ứng sau khi khôi phục. Một tệp cấu hình, thư mục thông tin xác thực hoặc không gian làm việc được cấu hình rõ ràng bên trong một trong các thư mục gốc này vẫn được bao gồm.

## Hành vi khi cấu hình không hợp lệ

`openclaw backup` bỏ qua bước kiểm tra trước cấu hình thông thường để vẫn có thể hỗ trợ trong quá trình phục hồi. Việc phát hiện không gian làm việc phụ thuộc vào cấu hình hợp lệ, vì vậy `openclaw backup create` sẽ thất bại ngay khi tệp cấu hình tồn tại nhưng không hợp lệ và tính năng sao lưu không gian làm việc vẫn được bật.

Để sao lưu một phần trong tình huống đó, hãy chạy lại với `--no-include-workspace`: tùy chọn này vẫn bao gồm trạng thái, cấu hình và thư mục thông tin xác thực bên ngoài trong phạm vi, đồng thời bỏ qua hoàn toàn việc phát hiện không gian làm việc.

`--only-config` cũng hoạt động khi cấu hình sai định dạng vì tùy chọn này không phân tích cấu hình để phát hiện không gian làm việc.

## Kích thước và hiệu năng

OpenClaw không áp dụng kích thước sao lưu tối đa hoặc giới hạn kích thước theo tệp tích hợp sẵn. Một thao tác ghi kho lưu trữ không tạo ra dữ liệu trong năm phút sẽ thất bại và xóa tệp tạm thời chưa hoàn tất thay vì treo vô thời hạn. Các giới hạn thực tế khác đến từ:

- Dung lượng khả dụng cho việc ghi kho lưu trữ tạm thời cùng với kho lưu trữ cuối cùng
- Thời gian duyệt các cây không gian làm việc lớn và nén chúng thành một `.tar.gz`
- Thời gian quét lại kho lưu trữ bằng `--verify` hoặc `openclaw backup verify`
- Hành vi của hệ thống tệp đích: OpenClaw ưu tiên bước phát hành bằng liên kết cứng không ghi đè và chuyển sang sao chép độc quyền khi liên kết cứng không được hỗ trợ

Các không gian làm việc lớn thường là yếu tố chính quyết định kích thước kho lưu trữ. Sử dụng `--no-include-workspace` để có bản sao lưu nhỏ hơn/nhanh hơn hoặc `--only-config` để có kho lưu trữ nhỏ nhất.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
