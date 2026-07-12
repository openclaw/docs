---
read_when:
    - Bạn muốn xem những Skills nào hiện có và sẵn sàng chạy
    - Bạn muốn tìm kiếm trên ClawHub hoặc cài đặt Skills từ ClawHub, Git hay các thư mục cục bộ
    - Bạn muốn xác minh một skill ClawHub bằng ClawHub
    - Bạn muốn gỡ lỗi các tệp nhị phân/biến môi trường/cấu hình bị thiếu cho Skills
summary: Tài liệu tham khảo CLI cho `openclaw skills` (tìm kiếm/cài đặt/cập nhật/xác minh/liệt kê/thông tin/kiểm tra/xưởng)
title: Skills
x-i18n:
    generated_at: "2026-07-12T07:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Kiểm tra Skills cục bộ, tìm kiếm trên ClawHub, cài đặt Skills từ ClawHub/Git/thư mục cục bộ, xác minh Skills trên ClawHub và cập nhật các bản cài đặt được ClawHub theo dõi.

Liên quan:

- Hệ thống Skills: [Skills](/vi/tools/skills)
- Xưởng Skills: [Xưởng Skills](/vi/tools/skill-workshop)
- Cấu hình Skills: [Cấu hình Skills](/vi/tools/skills-config)
- Bản cài đặt ClawHub: [ClawHub](/vi/clawhub/cli)

## Lệnh

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` và `verify` sử dụng ClawHub trực tiếp. `install @owner/<slug>` cài đặt một Skill từ ClawHub, `install git:owner/repo[@ref]` sao chép một Skill từ Git và `install ./path` sao chép một thư mục Skill cục bộ. Theo mặc định, `install`, `update` và `verify` nhắm đến thư mục `skills/` của không gian làm việc đang hoạt động; khi dùng `--global`, chúng nhắm đến thư mục Skills được quản lý dùng chung. `list`/`info`/`check` vẫn kiểm tra các Skills cục bộ hiển thị với không gian làm việc và cấu hình hiện tại. Các lệnh dựa trên không gian làm việc phân giải không gian làm việc đích từ `--agent <id>`, sau đó là thư mục làm việc hiện tại nếu thư mục đó nằm trong một không gian làm việc của tác tử đã cấu hình, rồi đến tác tử mặc định.

Các bản cài đặt từ Git và thư mục cục bộ yêu cầu `SKILL.md` tại thư mục gốc của nguồn. Slug cài đặt được lấy từ trường `name` trong frontmatter của `SKILL.md` nếu hợp lệ, sau đó là tên thư mục nguồn hoặc kho lưu trữ; dùng `--as <slug>` để ghi đè. `--version` chỉ dành cho ClawHub. Bản cài đặt Skill không hỗ trợ đặc tả gói npm hoặc đường dẫn zip/kho lưu trữ và `openclaw skills update` chỉ cập nhật các bản cài đặt được ClawHub theo dõi.

Các bản cài đặt phần phụ thuộc của Skill dựa trên Gateway được kích hoạt từ quá trình thiết lập ban đầu hoặc phần cài đặt Skills sẽ sử dụng đường dẫn yêu cầu `skills.install` riêng.

Lưu ý:

| Cờ/hành vi                       | Mô tả                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Truy vấn không bắt buộc; bỏ qua để duyệt nguồn cấp tìm kiếm ClawHub mặc định.                                                                                                                                                                                                                                                                              |
| `search --limit <n>`             | Giới hạn số kết quả trả về.                                                                                                                                                                                                                                                                                                                               |
| `install git:owner/repo[@ref]`   | Cài đặt một Skill từ Git. Tham chiếu nhánh có thể chứa dấu gạch chéo, chẳng hạn như `git:owner/repo@feature/foo`.                                                                                                                                                                                                                                           |
| `install ./path/to/skill`        | Cài đặt một thư mục cục bộ có thư mục gốc chứa `SKILL.md`.                                                                                                                                                                                                                                                                                                 |
| `install --as <slug>`            | Ghi đè slug được suy ra cho các bản cài đặt từ Git và thư mục cục bộ.                                                                                                                                                                                                                                                                                      |
| `install --version <version>`    | Chỉ áp dụng cho tham chiếu Skill trên ClawHub.                                                                                                                                                                                                                                                                                                             |
| `install --force`                | Ghi đè thư mục Skill hiện có trong không gian làm việc đối với cùng một slug.                                                                                                                                                                                                                                                                              |
| `install/update --force-install` | Cài đặt một Skill ClawHub dựa trên GitHub đang chờ xử lý trước khi quá trình quét của ClawHub hoàn tất.                                                                                                                                                                                                                                                     |
| `--global`                       | Nhắm đến thư mục Skills được quản lý dùng chung; không thể kết hợp với `--agent <id>`.                                                                                                                                                                                                                                                                     |
| `--agent <id>`                   | Nhắm đến một không gian làm việc của tác tử đã cấu hình; ghi đè việc suy luận từ thư mục làm việc hiện tại.                                                                                                                                                                                                                                                |
| `update @owner/<slug>`           | Cập nhật một Skill được theo dõi. Thêm `--global` để nhắm đến thư mục Skills được quản lý dùng chung thay vì không gian làm việc.                                                                                                                                                                                                                           |
| `update --all`                   | Cập nhật các bản cài đặt ClawHub được theo dõi trong không gian làm việc đã chọn hoặc trong thư mục Skills được quản lý dùng chung khi có `--global`.                                                                                                                                                                                                       |
| `verify @owner/<slug>`           | Theo mặc định, in ra phong bì JSON `clawhub.skill.verify.v1` của ClawHub. Không có cờ `--json` vì JSON đã là định dạng mặc định. Slug không kèm chủ sở hữu được chấp nhận để tương thích khi Skill đã được cài đặt hoặc không gây nhầm lẫn; tham chiếu có chủ sở hữu giúp tránh nhập nhằng về nhà phát hành.                                                        |
| Nguồn gốc của `verify`           | Khi ClawHub trả về nguồn gốc mã nguồn do máy chủ phân giải, JSON xác minh cũng bao gồm `openclaw.verifiedSourceUrl` được cố định vào một commit. URL nguồn không khả dụng hoặc do chính bên phát hành khai báo chỉ được giữ trong phong bì nguồn gốc thô và không được nâng cấp.                                                                                 |
| Bộ chọn phiên bản của `verify`   | `verify` sử dụng `.clawhub/origin.json` cho các Skills ClawHub đã cài đặt, vì vậy nó xác minh phiên bản đã cài đặt với registry nơi phiên bản đó bắt nguồn. `--version` và `--tag` ghi đè bộ chọn phiên bản nhưng vẫn giữ registry đã cài đặt đó khi có siêu dữ liệu nguồn gốc.                                                                                   |
| `verify --card`                  | In Markdown Thẻ Skill đã tạo thay vì JSON. Thoát với mã khác 0 khi ClawHub trả về `ok: false` hoặc `decision: "fail"`; chữ ký chưa được ký chỉ mang tính cung cấp thông tin, trừ khi chính sách ClawHub thay đổi.                                                                                                                                                 |
| Dấu vân tay Thẻ Skill            | Các gói ClawHub đã cài đặt có thể bao gồm `skill-card.md` được tạo tự động. OpenClaw coi việc xác minh là quyết định của máy chủ ClawHub và không từ chối một Skill đã cài đặt chỉ vì thẻ được tạo đó làm thay đổi dấu vân tay của gói.                                                                                                                         |
| `check --agent <id>`             | Kiểm tra không gian làm việc của tác tử đã chọn và báo cáo những Skills sẵn sàng nào thực sự hiển thị trên bề mặt lời nhắc hoặc lệnh của tác tử đó.                                                                                                                                                                                                         |
| `list`                           | Hành động mặc định khi không cung cấp lệnh con.                                                                                                                                                                                                                                                                                                            |
| Đầu ra `list`/`info`/`check`     | Đầu ra đã kết xuất được gửi đến stdout. Khi dùng `--json`, tải trọng dành cho máy đọc vẫn nằm trên stdout để dùng với đường ống và tập lệnh.                                                                                                                                                                                                                |

Các bản cài đặt và cập nhật Skill cộng đồng trên ClawHub kiểm tra mức độ tin cậy trước khi tải xuống. Các bản phát hành kho lưu trữ cộng đồng có phiên bản sử dụng siêu dữ liệu tin cậy của chính xác bản phát hành đó. Các Skills GitHub dựa trên trình phân giải phụ thuộc vào trình phân giải cài đặt của ClawHub để thực thi chính sách quét và cài đặt cưỡng bức trước khi trả về một commit đã cố định; dùng `--force-install` để cài đặt một Skill dựa trên GitHub đang chờ xử lý trước khi quá trình quét hoàn tất. Các bản phát hành cộng đồng độc hại hoặc bị chặn sẽ bị từ chối. Các bản phát hành cộng đồng có rủi ro yêu cầu xem xét và cần `--acknowledge-clawhub-risk` khi một lệnh không tương tác cần tiếp tục sau quá trình xem xét đó. Các nhà phát hành Skill ClawHub chính thức và nguồn Skill đi kèm OpenClaw bỏ qua lời nhắc về độ tin cậy của bản phát hành này.

## Xưởng Skills

`openclaw skills workshop` quản lý các đề xuất Skill đang chờ xử lý trong không gian làm việc đã chọn. Các đề xuất chưa phải là Skills đang hoạt động cho đến khi được áp dụng. Để biết về lưu trữ đề xuất, biện pháp bảo vệ tệp hỗ trợ, các phương thức Gateway và chính sách phê duyệt, hãy xem [Xưởng Skills](/vi/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Danh sách kiểm tra QA có thể lặp lại" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Danh sách kiểm tra QA có thể lặp lại" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Trùng lặp"
openclaw skills workshop quarantine <proposal-id> --reason "Cần xem xét bảo mật"
```

`propose-create`, `propose-update` và `revise` cũng chấp nhận `--goal <text>`
và `--evidence <text>` để ghi lại động lực của đề xuất và các ghi chú hỗ trợ
cùng với nội dung `--proposal`/`--proposal-dir`.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Skills](/vi/tools/skills)
