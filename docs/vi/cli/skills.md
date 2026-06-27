---
read_when:
    - Bạn muốn xem những Skills nào hiện có và sẵn sàng chạy
    - Bạn muốn tìm kiếm trên ClawHub hoặc cài đặt Skills từ ClawHub, Git hoặc các thư mục cục bộ
    - Bạn muốn xác minh một kỹ năng ClawHub bằng ClawHub
    - Bạn muốn gỡ lỗi các tệp nhị phân/env/cấu hình bị thiếu cho Skills
summary: Tham chiếu CLI cho `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:20:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Kiểm tra Skills cục bộ, tìm kiếm ClawHub, cài đặt kỹ năng từ ClawHub/Git/thư mục
cục bộ, xác minh kỹ năng ClawHub, và cập nhật các bản cài đặt được ClawHub theo dõi.

Liên quan:

- Hệ thống Skills: [Skills](/vi/tools/skills)
- Xưởng kỹ năng: [Xưởng kỹ năng](/vi/tools/skill-workshop)
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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update`, và `verify` dùng trực tiếp ClawHub. `install @owner/<slug>`
cài đặt một kỹ năng ClawHub, `install git:owner/repo[@ref]` sao chép một kỹ năng Git, và
`install ./path` sao chép một thư mục kỹ năng cục bộ. Theo mặc định, `install`, `update`,
và `verify` nhắm tới thư mục `skills/` của không gian làm việc đang hoạt động; với `--global`,
chúng nhắm tới thư mục Skills được quản lý dùng chung. `list`/`info`/`check` vẫn
kiểm tra các kỹ năng cục bộ mà không gian làm việc và cấu hình hiện tại có thể thấy.
Các lệnh dựa trên không gian làm việc phân giải không gian làm việc đích từ `--agent <id>`, rồi đến
thư mục làm việc hiện tại khi nó nằm trong một không gian làm việc tác tử đã cấu hình,
rồi đến tác tử mặc định.

Các bản cài đặt Git và thư mục cục bộ yêu cầu `SKILL.md` ở gốc nguồn. Slug
cài đặt lấy từ frontmatter `name` của `SKILL.md` khi hợp lệ, sau đó đến
thư mục nguồn hoặc tên kho lưu trữ; dùng `--as <slug>` để ghi đè. `--version`
chỉ dành cho ClawHub. Các bản cài đặt kỹ năng không hỗ trợ đặc tả gói npm hoặc
đường dẫn zip/lưu trữ, và `openclaw skills update` chỉ cập nhật các bản cài đặt được ClawHub theo dõi.

Các bản cài đặt phụ thuộc kỹ năng dựa trên Gateway được kích hoạt từ quá trình onboarding hoặc phần cài đặt Skills
dùng đường dẫn yêu cầu `skills.install` riêng.

Ghi chú:

- `search [query...]` chấp nhận truy vấn tùy chọn; bỏ qua để duyệt nguồn tìm kiếm
  ClawHub mặc định.
- `search --limit <n>` giới hạn số kết quả trả về.
- `install git:owner/repo[@ref]` cài đặt một kỹ năng Git. Tham chiếu nhánh có thể chứa
  dấu gạch chéo, chẳng hạn `git:owner/repo@feature/foo`.
- `install ./path/to/skill` cài đặt một thư mục cục bộ có gốc chứa
  `SKILL.md`.
- `install --as <slug>` ghi đè slug được suy ra cho các bản cài đặt từ Git và thư mục cục bộ.
- `install --version <version>` chỉ áp dụng cho tham chiếu kỹ năng ClawHub.
- `install --force` ghi đè thư mục kỹ năng hiện có trong không gian làm việc cho cùng
  slug.
- Các bản cài đặt và cập nhật kỹ năng ClawHub cộng đồng kiểm tra độ tin cậy trước khi tải xuống.
  Các bản phát hành lưu trữ cộng đồng có phiên bản dùng siêu dữ liệu tin cậy theo đúng bản phát hành.
  Các kỹ năng GitHub dựa trên bộ phân giải dựa vào bộ phân giải cài đặt của ClawHub để thực thi
  chính sách quét và buộc cài đặt trước khi trả về một commit đã ghim. Các bản phát hành cộng đồng độc hại hoặc
  bị chặn sẽ bị từ chối. Các bản phát hành cộng đồng rủi ro yêu cầu
  xem xét và `--acknowledge-clawhub-risk` khi một lệnh không tương tác cần
  tiếp tục sau quá trình xem xét đó. Nhà xuất bản kỹ năng ClawHub chính thức và các
  nguồn kỹ năng OpenClaw đi kèm bỏ qua lời nhắc tin cậy bản phát hành này.
- `--global` nhắm tới thư mục Skills được quản lý dùng chung và không thể kết hợp
  với `--agent <id>`.
- `--agent <id>` nhắm tới một không gian làm việc tác tử đã cấu hình và ghi đè suy luận
  thư mục làm việc hiện tại.
- `update @owner/<slug>` cập nhật một kỹ năng được theo dõi. Thêm `--global` để
  nhắm tới thư mục Skills được quản lý dùng chung thay vì không gian làm việc.
- `update --all` cập nhật các bản cài đặt ClawHub được theo dõi trong không gian làm việc đã chọn, hoặc
  trong thư mục Skills được quản lý dùng chung khi kết hợp với `--global`.
- `verify @owner/<slug>` mặc định in phong bì JSON `clawhub.skill.verify.v1` của ClawHub.
  Không có cờ `--json` vì JSON đã là mặc định.
  Slug trần vẫn được chấp nhận để tương thích khi kỹ năng đã được
  cài đặt hoặc không mơ hồ, nhưng tham chiếu có chủ sở hữu tránh nhầm lẫn
  nhà xuất bản.
- Khi ClawHub trả về nguồn gốc mã nguồn do máy chủ phân giải, JSON xác minh cũng
  bao gồm `openclaw.verifiedSourceUrl` được ghim theo commit. URL nguồn không khả dụng hoặc
  tự khai báo chỉ ở lại trong phong bì nguồn gốc thô và không được
  nâng cấp.
- `verify` dùng `.clawhub/origin.json` cho các kỹ năng ClawHub đã cài đặt, nên nó
  xác minh phiên bản đã cài đặt theo registry nguồn của nó. `--version`
  và `--tag` ghi đè bộ chọn phiên bản nhưng vẫn giữ registry đã cài đặt đó
  khi có siêu dữ liệu nguồn gốc.
- `verify --card` in Markdown Thẻ kỹ năng được tạo thay vì JSON. Lệnh
  thoát khác 0 khi ClawHub trả về `ok: false` hoặc `decision: "fail"`;
  chữ ký chưa ký chỉ mang tính thông tin trừ khi chính sách ClawHub thay đổi.
- Các gói ClawHub đã cài đặt có thể bao gồm `skill-card.md` được tạo. OpenClaw
  xem xác minh là quyết định của máy chủ ClawHub và không từ chối một
  kỹ năng đã cài đặt chỉ vì thẻ được tạo đó thay đổi
  dấu vân tay của gói.
- `check --agent <id>` kiểm tra không gian làm việc của tác tử đã chọn và báo cáo những
  kỹ năng sẵn sàng nào thật sự hiển thị với prompt hoặc bề mặt lệnh của tác tử đó.
- `list` là hành động mặc định khi không cung cấp lệnh con.
- `list`, `info`, và `check` ghi đầu ra đã kết xuất vào stdout. Với
  `--json`, điều đó nghĩa là payload máy đọc được vẫn nằm trên stdout cho pipe
  và script.

## Xưởng kỹ năng

`openclaw skills workshop` quản lý các đề xuất kỹ năng đang chờ trong
không gian làm việc đã chọn. Đề xuất chưa phải là kỹ năng hoạt động cho đến khi được áp dụng. Để biết về nơi lưu trữ đề xuất,
biện pháp bảo vệ tệp hỗ trợ, phương thức Gateway, và chính sách phê duyệt, xem
[Xưởng kỹ năng](/vi/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Skills](/vi/tools/skills)
