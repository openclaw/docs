---
read_when:
    - Bạn muốn tác nhân tạo hoặc cập nhật một Skills từ cuộc trò chuyện
    - Bạn cần xem xét, áp dụng, từ chối hoặc cách ly một bản nháp kỹ năng được tạo tự động
    - Bạn đang cấu hình phê duyệt, quyền tự chủ, lưu trữ hoặc giới hạn của Skill Workshop
sidebarTitle: Skill Workshop
summary: Tạo và cập nhật Skills trong không gian làm việc thông qua quy trình đánh giá của Skill Workshop
title: Xưởng Skills
x-i18n:
    generated_at: "2026-07-12T08:25:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop là quy trình được quản trị của OpenClaw để tạo và cập nhật các
Skills trong không gian làm việc. Agent và người vận hành không bao giờ ghi trực tiếp vào `SKILL.md`
thông qua quy trình này — họ tạo một **đề xuất** (bản nháp đang chờ xử lý với nội dung, liên kết
đích, trạng thái trình quét, hàm băm và siêu dữ liệu hoàn tác), chỉ trở thành
Skill đang hoạt động khi được áp dụng.

Skill Workshop chỉ ghi các Skills trong không gian làm việc. Công cụ này không bao giờ tác động đến
Skills tích hợp sẵn, Plugin, ClawHub, ngoài thư mục gốc, được quản lý, của agent cá nhân hoặc hệ thống.

## Cách hoạt động

- **Đề xuất trước:** nội dung được tạo được lưu dưới dạng `PROPOSAL.md`, không phải
  `SKILL.md`.
- **Áp dụng là thao tác ghi trực tiếp duy nhất:** tạo, cập nhật và chỉnh sửa không bao giờ thay đổi
  các Skills đang hoạt động.
- **Giới hạn trong không gian làm việc:** thao tác tạo nhắm đến thư mục gốc `skills/` của không gian làm việc; chỉ
  cho phép cập nhật các Skills có thể ghi trong không gian làm việc.
- **Không ghi đè:** thao tác tạo thất bại nếu Skill đích đã tồn tại.
- **Ràng buộc bằng hàm băm:** đề xuất cập nhật được liên kết với hàm băm hiện tại của đích và chuyển thành
  `stale` nếu Skill đang hoạt động thay đổi trước khi áp dụng.
- **Kiểm soát bằng trình quét:** thao tác áp dụng chạy lại trình quét bảo mật trước khi ghi.
- **Có thể khôi phục:** thao tác áp dụng ghi siêu dữ liệu hoàn tác trước khi tác động đến các tệp đang hoạt động.
- **Các bề mặt nhất quán:** trò chuyện, CLI và Gateway đều gọi cùng một dịch vụ.

## Vòng đời

```text
tạo/cập nhật -> đang chờ xử lý
chỉnh sửa     -> đang chờ xử lý
áp dụng       -> đã áp dụng
từ chối       -> đã từ chối
cách ly       -> đã cách ly
đích thay đổi -> lỗi thời
```

Chỉ đề xuất `pending` mới có thể được chỉnh sửa, áp dụng, từ chối hoặc cách ly.

## Quản lý vòng đời

Gateway theo dõi mức sử dụng Skills tổng hợp trong cơ sở dữ liệu trạng thái dùng chung. Mỗi
ngày một lần, Gateway xem xét các Skills do Skill Workshop tạo và áp dụng. Những Skill không được sử dụng
quá 30 ngày sẽ chuyển thành `stale`; sau 90 ngày, chúng chuyển thành `archived` và
không được đưa vào ảnh chụp Skills của agent mới. Các tệp Skill đã lưu trữ vẫn không thay đổi trên
đĩa. Các Skills được soạn thủ công không bao giờ được quản lý; chỉ các Skills được tạo từ đề xuất của Skill
Workshop mới tham gia quy trình quản lý vòng đời.

Các Skills được ghim bỏ qua các chuyển đổi vòng đời. Một Skill lỗi thời sẽ trở lại `active`
sau khi được sử dụng và lượt rà soát tiếp theo chạy. Các Skills đã lưu trữ chỉ trở lại thông qua
thao tác khôi phục rõ ràng:

Các chuyển đổi vòng đời và thao tác khôi phục áp dụng cho phiên mới; các phiên đang chạy giữ nguyên
ảnh chụp Skills hiện tại.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Tất cả lệnh quản lý đều chấp nhận `--json`. Trạng thái cũng báo cáo các ứng viên trùng lặp
một cách xác định nhưng chỉ dưới dạng gợi ý; lệnh này không bao giờ hợp nhất Skills hoặc gọi mô hình.

## Trò chuyện

Hãy yêu cầu agent tạo Skill bạn muốn; agent sẽ gọi `skill_workshop` và trả về
mã đề xuất.

### Học từ công việc gần đây

Sử dụng `/learn` để chuyển cuộc trò chuyện hiện tại hoặc các nguồn được chỉ định thành một
đề xuất Skill tuân theo tiêu chuẩn:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Khi không có yêu cầu, `/learn` đề nghị agent chắt lọc quy trình có thể tái sử dụng từ
cuộc trò chuyện hiện tại. Khi có yêu cầu, agent xem các đường dẫn, URL, ghi chú được dán
và tham chiếu cuộc trò chuyện là nguồn, đồng thời tuân thủ các yêu cầu về trọng tâm, phạm vi và
đặt tên. Agent thu thập các nguồn bằng công cụ hiện có, sau đó gọi
`skill_workshop` với `action: "create"`.

Đề xuất tạo ra vẫn ở trạng thái `pending`; `/learn` không bao giờ áp dụng đề xuất đó. Hãy xem xét và
áp dụng đề xuất thông qua quy trình phê duyệt thông thường hoặc bằng `openclaw skills workshop`.

Tạo:

```text
Tạo một Skill tên là morning-catchup để chạy quy trình hộp thư đến thứ Hai của tôi.
```

Cập nhật một Skill hiện có trong không gian làm việc:

```text
Cập nhật trip-planning để kiểm tra cả sơ đồ ghế trước khi đặt chỗ.
```

Lặp lại trên một đề xuất đang chờ xử lý:

```text
Hiển thị cho tôi đề xuất morning-catchup.
Chỉnh sửa để đề xuất đó cũng gắn cờ mọi mục được đánh dấu khẩn cấp.
Áp dụng đề xuất morning-catchup.
```

Các thao tác `apply`, `reject` và `quarantine` do agent khởi tạo mặc định sẽ hiển thị lời nhắc
phê duyệt. Đặt `skills.workshop.approvalPolicy` thành `"auto"` để bỏ qua bước này trong
môi trường đáng tin cậy.

Lời nhắc xác định mã đề xuất và Skill đích, đồng thời hiển thị phần mô tả đề xuất,
số lượng tệp hỗ trợ và kích thước nội dung. Yêu cầu phê duyệt được giới hạn thời gian
để hoàn tất trước trình giám sát công cụ của agent. Nếu không có quyết định trước khi
lời nhắc hết hạn, hành động vòng đời sẽ không chạy: đề xuất vẫn đang chờ xử lý
và không thay đổi. Hãy quyết định sau trong giao diện Skill Workshop hoặc chạy
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agent không nên
thử lại một hành động vòng đời đã hết hạn theo vòng lặp.

## CLI

```bash
# Tạo
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Bắt kịp hộp thư đến hằng ngày: phân loại, lưu trữ, làm nổi bật, soạn thảo, lập kế hoạch" \
  --proposal ./PROPOSAL.md

# Cập nhật một Skill hiện có trong không gian làm việc
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Liệt kê và kiểm tra
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Chỉnh sửa trước khi phê duyệt
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Kết thúc
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Trùng lặp"
openclaw skills workshop quarantine <proposal-id> --reason "Cần xem xét bảo mật"
```

Mọi lệnh con đều nhận `--agent <id>` (không gian làm việc đích; mặc định được suy ra từ
thư mục làm việc hiện tại, sau đó là agent mặc định) và `--json` (đầu ra có cấu trúc).
`propose-create`, `propose-update` và `revise` cũng nhận `--goal <text>` và
`--evidence <text>` để ghi lại ngữ cảnh đề xuất cùng với `--proposal`.

## Nội dung đề xuất

Trong khi đang chờ xử lý, đề xuất được lưu dưới dạng `PROPOSAL.md` với frontmatter
chỉ dành cho đề xuất:

```markdown
---
name: "morning-catchup"
description: "Bắt kịp hộp thư đến hằng ngày: phân loại, lưu trữ, làm nổi bật, soạn thảo, lập kế hoạch"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Khi áp dụng, Skill Workshop ghi `SKILL.md` đang hoạt động và xóa các trường
chỉ dành cho đề xuất: `status`, `version` của đề xuất và `date` của đề xuất.

## Tệp hỗ trợ

Sử dụng `--proposal-dir` khi Skill được đề xuất cần các tệp bên cạnh
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Tổng kết thứ Sáu: số liệu thống kê, điểm nổi bật, ba ưu tiên hàng đầu của tuần tới" \
  --proposal-dir ./weekly-update-proposal
```

Thư mục phải chứa `PROPOSAL.md`. Các tệp hỗ trợ phải nằm trong
`assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`. Skill
Workshop quét, băm và lưu chúng cùng đề xuất, sau đó chỉ ghi chúng
bên cạnh `SKILL.md` đang hoạt động khi áp dụng.

Các đường dẫn tệp hỗ trợ bị từ chối: đường dẫn tuyệt đối, phân đoạn đường dẫn ẩn, duyệt ngược
đường dẫn, đường dẫn chồng lấn, tệp thực thi, văn bản không phải UTF-8, byte null
và đường dẫn nằm ngoài các thư mục hỗ trợ tiêu chuẩn.

## Công cụ agent

Mô hình sử dụng `skill_workshop` với một `action` bắt buộc:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Các tham số khác được áp dụng tùy theo hành động:

| Tham số                    | Được dùng bởi                                          | Ghi chú                                                               |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                          | Bắt buộc với `create`; nếu không, dùng để phân giải đề xuất đang chờ xử lý theo tên |
| `description`              | `create`, `update`, `revise`                           | Tối đa 160 byte                                                       |
| `skill_name`               | `update`                                               | Tên hoặc khóa của Skill hiện có                                      |
| `proposal_content`         | `create`, `update`, `revise`                           | Được lưu dưới dạng `PROPOSAL.md`; giới hạn bởi `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                           | Mảng `{ path, content }`                                              |
| `goal`, `evidence`         | `create`, `update`, `revise`                           | Ngữ cảnh dạng văn bản tự do                                           |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`   | Đề xuất đích                                                         |
| `reason`                   | `apply`, `reject`, `quarantine`                        | Không bắt buộc                                                        |
| `query`, `status`, `limit` | `list`                                                 | Lọc/phân trang; `limit` tối đa 50, mặc định 20                        |

Agent phải sử dụng `skill_workshop` cho công việc tạo Skill. Agent không được
tạo hoặc thay đổi tệp đề xuất thông qua `write`, `edit`, `exec`, lệnh shell
hoặc thao tác trực tiếp trên hệ thống tệp.

<Note>
`skill_workshop` là công cụ agent tích hợp sẵn và được bao gồm trong
`tools.profile: "coding"`. Nếu một chính sách nghiêm ngặt hơn ẩn công cụ này, hãy thêm
`skill_workshop` vào danh sách `tools.allow` đang hoạt động hoặc sử dụng
`tools.alsoAllow: ["skill_workshop"]` khi phạm vi sử dụng một hồ sơ không có
`tools.allow` rõ ràng. Các lượt chạy trong sandbox không khởi tạo công cụ Skill Workshop
phía máy chủ, vì vậy hãy chạy các hành động xem xét đề xuất từ một phiên agent
phía máy chủ thông thường hoặc CLI.
</Note>

## Skills được đề xuất

OpenClaw phát hiện các chỉ dẫn lâu dài như “lần tới”, “hãy nhớ” và các chỉnh sửa mang tính phản hồi
khi một lượt tương tác kết thúc, kể cả các lượt thất bại. Ở lượt tiếp theo, agent đề nghị lưu
quy trình được phát hiện gần nhất thông qua `skill_workshop`; người dùng quyết định có tạo
đề xuất hay không. Tính năng đề xuất tích hợp sẵn này không tự tạo hoặc thay đổi Skill. Hãy bật
`skills.workshop.autonomous.enabled` để trực tiếp tạo các đề xuất đang chờ xử lý.

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

| Cài đặt                    | Mặc định    | Tác dụng                                                                                                                                                                |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Trực tiếp tạo các đề xuất đang chờ xử lý thay vì đề nghị quy trình được phát hiện gần nhất ở lượt tiếp theo.                                                            |
| `allowSymlinkTargetWrites` | `false`     | Cho phép thao tác áp dụng ghi qua liên kết tượng trưng của Skill trong không gian làm việc khi đích thực của liên kết được liệt kê trong `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"pending"` | `"pending"` yêu cầu lời nhắc phê duyệt trước các thao tác `apply`, `reject` hoặc `quarantine` do agent khởi tạo. `"auto"` bỏ qua lời nhắc (agent vẫn phải gọi hành động). |
| `maxPending`               | `50`        | Giới hạn số đề xuất đang chờ xử lý và bị cách ly trên mỗi không gian làm việc (1-200).                                                                                   |
| `maxSkillBytes`            | `40000`     | Giới hạn kích thước nội dung đề xuất theo byte (1024-200000).                                                                                                           |

Tính năng thu thập tự động nhận diện các quy tắc hướng đến tương lai (ví dụ: “từ bây giờ”) và các
chỉnh sửa mang tính phản hồi (ví dụ: “đó không phải điều tôi yêu cầu”). Tính năng này nhóm các chỉ dẫn mới theo chủ đề thành tối đa
ba đề xuất mỗi lượt, định tuyến các từ vựng trùng khớp đến các Skills hiện có có thể ghi trong không gian làm việc và
chỉnh sửa đề xuất đang chờ xử lý của chính nó khi một chỉnh sửa khác nhắm đến cùng một Skill.

Phần mô tả đề xuất luôn bị giới hạn ở 160 byte, không phụ thuộc vào
`maxSkillBytes`.

## Phương thức Gateway

| Phương thức                         | Phạm vi          |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` chỉ có trên Gateway (không có chức năng tương đương trong CLI hoặc công cụ của tác tử): phương thức này
chuyển tiếp hướng dẫn chỉnh sửa dạng văn bản tự do đến phiên trò chuyện của tác tử sở hữu
thay vì trực tiếp thay thế `PROPOSAL.md`, dành cho các giao diện người dùng yêu cầu tác tử
chỉnh sửa thay vì gửi nội dung mới theo nghĩa đen.

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
- `proposals.json`: chỉ mục liệt kê nhanh, có thể xây dựng lại từ các thư mục đề xuất.
- `PROPOSAL.md`: đề xuất kỹ năng đang chờ xử lý.
- `rollback.json`: siêu dữ liệu khôi phục được ghi trước khi áp dụng thay đổi vào các tệp đang hoạt động.

## Giới hạn

| Giới hạn                        | Giá trị                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| Mô tả                           | 160 byte                                                              |
| Nội dung đề xuất                | `skills.workshop.maxSkillBytes` (mặc định 40.000; giới hạn cứng 1 MiB) |
| Tệp hỗ trợ                      | 64 cho mỗi đề xuất                                                    |
| Kích thước tệp hỗ trợ           | Mỗi tệp 256 KiB, tổng cộng 2 MiB                                      |
| Đề xuất đang chờ + bị cách ly   | `skills.workshop.maxPending` cho mỗi không gian làm việc (mặc định 50) |

## Khắc phục sự cố

| Vấn đề                                         | Cách giải quyết                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Rút ngắn `description` xuống còn tối đa 160 byte.                                                                                                                                                               |
| `Skill proposal content is too large`          | Rút ngắn nội dung đề xuất hoặc tăng `skills.workshop.maxSkillBytes`.                                                                                                                                            |
| `Target skill changed after proposal creation` | Chỉnh sửa đề xuất dựa trên kỹ năng đích hiện tại hoặc tạo đề xuất mới.                                                                                                                                           |
| `Proposal scan failed`                         | Kiểm tra các phát hiện của trình quét, sau đó chỉnh sửa hoặc cách ly đề xuất.                                                                                                                                    |
| `untrusted symlink target`                     | Cấu hình `skills.load.allowSymlinkTargets` và chỉ bật `skills.workshop.allowSymlinkTargetWrites` cho các thư mục gốc kỹ năng dùng chung có chủ đích.                                                             |
| `Support file paths must be under one of...`   | Di chuyển các tệp hỗ trợ vào `assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`.                                                                                                                |
| Đề xuất không xuất hiện trong danh sách        | Kiểm tra không gian làm việc `--agent` đã chọn và `OPENCLAW_STATE_DIR`.                                                                                                                                          |
| Tác tử không thể gọi `skill_workshop`          | Kiểm tra chính sách công cụ và chế độ chạy đang hoạt động. `coding` bao gồm công cụ này; các chính sách `tools.allow` hạn chế phải liệt kê rõ công cụ, còn các lượt chạy trong sandbox phải dùng phiên tác tử phía máy chủ thông thường hoặc CLI. |

### Chẩn đoán chính sách công cụ

Khi tính năng thu thập tự động được bật, `openclaw doctor` chạy phép kiểm tra
`core/doctor/skill-workshop-tool-policy` cho tác tử mặc định. Nếu chính sách
ẩn `skill_workshop`, cảnh báo sẽ nêu tên lớp cấu hình loại trừ đầu tiên và
thay đổi chính xác cần thực hiện với `allow` hoặc `alsoAllow`. Các tài liệu vận hành cũ vẫn có thể dùng
`openclaw plugins inspect skill-workshop`; lệnh đó hiện giải thích rằng Skill
Workshop được tích hợp sẵn và in cùng gợi ý chính sách khi thích hợp.

## Liên quan

- [Skills](/vi/tools/skills) để tìm hiểu thứ tự tải, độ ưu tiên và khả năng hiển thị
- [Tạo kỹ năng](/vi/tools/creating-skills) để tìm hiểu kiến thức cơ bản về cách viết thủ công `SKILL.md`
- [Cấu hình Skills](/vi/tools/skills-config) để xem lược đồ `skills.workshop` đầy đủ
- [CLI Skills](/vi/cli/skills) để tìm hiểu các lệnh `openclaw skills`
