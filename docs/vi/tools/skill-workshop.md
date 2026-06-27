---
read_when:
    - Bạn muốn tác tử tạo hoặc cập nhật một skill từ cuộc trò chuyện
    - Bạn cần xem xét, áp dụng, từ chối hoặc cách ly một bản nháp skill được tạo
    - Bạn đang cấu hình phê duyệt, quyền tự chủ, lưu trữ hoặc giới hạn của Skill Workshop
sidebarTitle: Skill Workshop
summary: Tạo và cập nhật Skills trong không gian làm việc thông qua quy trình đánh giá Skill Workshop
title: Xưởng Skills
x-i18n:
    generated_at: "2026-06-27T18:18:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop là đường dẫn có quản trị của OpenClaw để tạo và cập nhật các kỹ năng trong không gian làm việc.

Tác tử và người vận hành không ghi trực tiếp các tệp `SKILL.md` đang hoạt động thông qua đường dẫn này. Trước tiên, họ tạo một **đề xuất**. Đề xuất là một bản nháp đang chờ xử lý, chứa nội dung kỹ năng được đề xuất, liên kết mục tiêu, trạng thái bộ quét, hàm băm, siêu dữ liệu tệp hỗ trợ và siêu dữ liệu rollback. Nó chỉ trở thành kỹ năng đang hoạt động khi được áp dụng.

Skill Workshop chỉ ghi các kỹ năng trong không gian làm việc. Nó không thay đổi các kỹ năng đi kèm, Plugin, ClawHub, gốc bổ sung, được quản lý, tác tử cá nhân hoặc hệ thống.

## Cách hoạt động

- **Đề xuất trước:** nội dung kỹ năng được tạo sẽ được lưu dưới dạng `PROPOSAL.md`, không phải `SKILL.md`.
- **Áp dụng là thao tác ghi trực tiếp duy nhất:** tạo, cập nhật và chỉnh sửa không thay đổi các kỹ năng đang hoạt động.
- **Phạm vi không gian làm việc:** thao tác tạo nhắm tới gốc `skills/` của không gian làm việc. Chỉ cho phép cập nhật các kỹ năng không gian làm việc có thể ghi.
- **Không ghi đè:** thao tác tạo thất bại nếu kỹ năng mục tiêu đã tồn tại.
- **Ràng buộc bằng hàm băm:** các đề xuất cập nhật gắn với hàm băm mục tiêu hiện tại và trở nên lỗi thời nếu kỹ năng trực tiếp thay đổi trước khi áp dụng.
- **Được kiểm soát bằng bộ quét:** thao tác áp dụng chạy lại quá trình quét trước khi ghi.
- **Có thể khôi phục:** thao tác áp dụng ghi siêu dữ liệu rollback trước khi thay đổi tệp trực tiếp.
- **Bề mặt nhất quán:** chat, CLI và Gateway đều gọi cùng một dịch vụ Skill Workshop.

## Vòng đời

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Chỉ các đề xuất `pending` mới có thể được chỉnh sửa, áp dụng, từ chối hoặc cách ly.

## Chat

Yêu cầu tác tử tạo kỹ năng bạn muốn. Tác tử gọi `skill_workshop` và trả về một mã đề xuất.

Tạo:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Cập nhật một kỹ năng không gian làm việc hiện có:

```text
Update trip-planning to also check seat maps before booking.
```

Lặp lại trên một đề xuất đang chờ xử lý:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Theo mặc định, các thao tác `apply`, `reject` và `quarantine` do tác tử khởi tạo sẽ hiển thị lời nhắc phê duyệt trước khi chạy. Đặt `skills.workshop.approvalPolicy` thành `"auto"` để bỏ qua lời nhắc trong các môi trường đáng tin cậy.

## CLI

Tạo một đề xuất kỹ năng mới:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Tạo một đề xuất cập nhật cho kỹ năng không gian làm việc hiện có:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Liệt kê và kiểm tra:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Chỉnh sửa trước khi phê duyệt:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Kết thúc đề xuất:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Nội dung đề xuất

Khi đang chờ xử lý, đề xuất được lưu dưới dạng `PROPOSAL.md` với frontmatter chỉ dành cho đề xuất:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Khi áp dụng, Skill Workshop ghi `SKILL.md` đang hoạt động và xóa các trường chỉ dành cho đề xuất: `status`, `version` của đề xuất và `date` của đề xuất.

## Tệp hỗ trợ

Dùng `--proposal-dir` khi kỹ năng được đề xuất cần các tệp bên cạnh `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

Thư mục phải chứa `PROPOSAL.md`. Các tệp hỗ trợ phải nằm dưới:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop quét, băm và lưu các tệp hỗ trợ cùng với đề xuất. Chúng chỉ được ghi bên cạnh `SKILL.md` trực tiếp khi áp dụng.

Các đường dẫn tệp hỗ trợ bị từ chối bao gồm đường dẫn tuyệt đối, đoạn đường dẫn ẩn, duyệt vượt đường dẫn, đường dẫn chồng lấn, tệp thực thi từ thư mục đề xuất, văn bản không phải UTF-8, byte null và tệp nằm ngoài các thư mục hỗ trợ tiêu chuẩn.

## Công cụ tác tử

Mô hình dùng `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Tác tử phải dùng `skill_workshop` cho công việc kỹ năng được tạo. Chúng không được tạo hoặc thay đổi tệp đề xuất thông qua `write`, `edit`, `exec`, lệnh shell hoặc thao tác hệ thống tệp trực tiếp.

<Note>
`skill_workshop` là công cụ tác tử tích hợp sẵn và được bao gồm trong `tools.profile: "coding"`. Nếu một chính sách nghiêm ngặt hơn ẩn công cụ này, hãy thêm `skill_workshop` vào danh sách `tools.allow` đang hoạt động, hoặc dùng `tools.alsoAllow: ["skill_workshop"]` khi phạm vi dùng một hồ sơ không có `tools.allow` rõ ràng. Các lượt chạy trong sandbox không dựng công cụ Skill Workshop phía máy chủ, vì vậy hãy chạy các thao tác xem xét đề xuất từ phiên tác tử phía máy chủ thông thường hoặc CLI.
</Note>

## Phê duyệt và tự chủ

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

- `autonomous.enabled`: cho phép OpenClaw tạo các đề xuất đang chờ xử lý từ tín hiệu hội thoại bền vững sau các lượt thành công. Mặc định: `false`.
- `allowSymlinkTargetWrites`: cho phép thao tác áp dụng ghi qua symlink kỹ năng không gian làm việc có mục tiêu thực được liệt kê trong `skills.load.allowSymlinkTargets`. Mặc định: `false`.
- `approvalPolicy: "pending"`: yêu cầu lời nhắc phê duyệt trước khi tác tử khởi tạo `apply`, `reject` hoặc `quarantine`.
- `approvalPolicy: "auto"`: bỏ qua lời nhắc phê duyệt đó. Tác tử vẫn phải gọi hành động.
- `maxPending`: giới hạn số đề xuất đang chờ xử lý và bị cách ly cho mỗi không gian làm việc.
- `maxSkillBytes`: giới hạn kích thước thân đề xuất. Mặc định: `40000`.

Mô tả đề xuất luôn bị giới hạn ở 160 byte.

## Phương thức Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Các phương thức chỉ đọc yêu cầu `operator.read`. Các phương thức thay đổi yêu cầu `operator.admin`.

## Lưu trữ

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Thư mục trạng thái mặc định: `~/.openclaw`.

- `proposal.json`: bản ghi đề xuất chuẩn.
- `proposals.json`: chỉ mục liệt kê nhanh, có thể dựng lại từ các thư mục đề xuất.
- `PROPOSAL.md`: đề xuất kỹ năng đang chờ xử lý.
- `rollback.json`: siêu dữ liệu khôi phục được ghi trước khi thao tác áp dụng thay đổi các tệp trực tiếp.

## Giới hạn

- Mô tả: 160 byte.
- Thân đề xuất: `skills.workshop.maxSkillBytes` (mặc định 40.000).
- Tệp hỗ trợ: 64 tệp cho mỗi đề xuất.
- Kích thước tệp hỗ trợ: mỗi tệp 256 KB, tổng cộng 2 MB.
- Đề xuất đang chờ xử lý và bị cách ly: `skills.workshop.maxPending` cho mỗi không gian làm việc (mặc định 50).

## Khắc phục sự cố

| Vấn đề                                         | Cách xử lý                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Rút ngắn `description` xuống 160 byte hoặc ít hơn.                                                                                                                                                          |
| `Skill proposal content is too large`          | Rút ngắn thân đề xuất hoặc tăng `skills.workshop.maxSkillBytes`.                                                                                                                                            |
| `Target skill changed after proposal creation` | Chỉnh sửa đề xuất theo mục tiêu hiện tại, hoặc tạo một đề xuất mới.                                                                                                                                         |
| `Proposal scan failed`                         | Kiểm tra các phát hiện của bộ quét, rồi chỉnh sửa hoặc cách ly đề xuất.                                                                                                                                     |
| `untrusted symlink target`                     | Cấu hình `skills.load.allowSymlinkTargets` và chỉ bật `skills.workshop.allowSymlinkTargetWrites` cho các gốc kỹ năng dùng chung có chủ đích.                                                               |
| `Support file paths must be under one of...`   | Di chuyển các tệp hỗ trợ vào dưới `assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`.                                                                                                      |
| Đề xuất không hiển thị trong danh sách         | Kiểm tra không gian làm việc `--agent` đã chọn và `OPENCLAW_STATE_DIR`.                                                                                                                                     |
| Tác tử không thể gọi `skill_workshop`          | Kiểm tra chính sách công cụ đang hoạt động và chế độ chạy. `coding` bao gồm công cụ này; các chính sách `tools.allow` hạn chế phải liệt kê nó rõ ràng, và các lượt chạy trong sandbox phải dùng phiên tác tử phía máy chủ thông thường hoặc CLI. |

## Liên quan

- [Skills](/vi/tools/skills) về thứ tự tải, mức ưu tiên và khả năng hiển thị
- [Tạo kỹ năng](/vi/tools/creating-skills) về các kiến thức cơ bản của `SKILL.md` viết thủ công
- [Cấu hình Skills](/vi/tools/skills-config) về lược đồ `skills.workshop` đầy đủ
- [CLI Skills](/vi/cli/skills) về các lệnh `openclaw skills`
