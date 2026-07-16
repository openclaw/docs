---
read_when:
    - Bạn muốn tác nhân tạo hoặc cập nhật một skill từ cuộc trò chuyện
    - Bạn cần xem xét, áp dụng, từ chối hoặc cách ly bản nháp Skills được tạo tự động
    - Bạn đang cấu hình phê duyệt, quyền tự chủ, lưu trữ hoặc giới hạn cho Skill Workshop
    - Bạn muốn hiểu các đề xuất tự học được xem xét ở đâu
sidebarTitle: Skill Workshop
summary: Tạo và cập nhật Skills trong không gian làm việc thông qua quy trình đánh giá của Skill Workshop
title: Xưởng Skills
x-i18n:
    generated_at: "2026-07-16T15:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop là quy trình được quản trị của OpenClaw để tạo và cập nhật các skill trong không gian làm việc. Agent và người vận hành không bao giờ ghi trực tiếp `SKILL.md` thông qua quy trình này — họ tạo một **đề xuất** (bản nháp đang chờ với nội dung, liên kết đích, trạng thái trình quét, hàm băm và siêu dữ liệu hoàn tác), và đề xuất chỉ trở thành skill đang hoạt động khi được áp dụng.

Skill Workshop chỉ ghi các skill trong không gian làm việc. Công cụ này không bao giờ tác động đến các skill được đóng gói sẵn, thuộc plugin, ClawHub, gốc bổ sung, được quản lý, của agent cá nhân hoặc của hệ thống.

## Cách hoạt động

- **Đề xuất trước:** nội dung được tạo sẽ được lưu dưới dạng `PROPOSAL.md`, không phải
  `SKILL.md`.
- **Áp dụng là thao tác ghi trực tiếp duy nhất:** thao tác tạo, cập nhật và chỉnh sửa không bao giờ thay đổi
  các skill đang hoạt động.
- **Phạm vi không gian làm việc:** thao tác tạo nhắm đến thư mục gốc `skills/` của không gian làm việc; chỉ
  được phép cập nhật các skill có thể ghi trong không gian làm việc.
- **Không ghi đè:** thao tác tạo thất bại nếu skill đích đã tồn tại.
- **Liên kết bằng hàm băm:** các đề xuất cập nhật được liên kết với hàm băm hiện tại của đích và chuyển sang
  `stale` nếu skill đang hoạt động thay đổi trước khi áp dụng.
- **Được kiểm soát bằng trình quét:** thao tác áp dụng chạy lại trình quét bảo mật trước khi ghi.
- **Có thể khôi phục:** thao tác áp dụng ghi siêu dữ liệu hoàn tác trước khi tác động đến các tệp đang hoạt động.
- **Các giao diện nhất quán:** trò chuyện, CLI và Gateway đều gọi cùng một dịch vụ.

## Vòng đời

```text
tạo/cập nhật -> đang chờ
chỉnh sửa     -> đang chờ
áp dụng       -> đã áp dụng
từ chối       -> đã từ chối
cách ly       -> đã cách ly
đích thay đổi -> lỗi thời
```

Chỉ đề xuất `pending` mới có thể được chỉnh sửa, áp dụng, từ chối hoặc cách ly.

## Quản lý vòng đời

Gateway theo dõi mức sử dụng tổng hợp của skill trong cơ sở dữ liệu trạng thái dùng chung. Mỗi
ngày một lần, hệ thống xem xét các skill được Skill Workshop tạo và áp dụng. Các skill không được sử dụng trong
hơn 30 ngày sẽ trở thành `stale`; sau 90 ngày, chúng trở thành `archived` và
không được đưa vào các bản chụp nhanh skill mới của agent. Các tệp skill đã lưu trữ không thay đổi trên
đĩa. Các skill được tạo thủ công không bao giờ được quản lý; chỉ các skill được tạo từ đề xuất của Skill
Workshop mới tham gia quy trình quản lý vòng đời.

Các skill được ghim bỏ qua các chuyển đổi vòng đời. Một skill lỗi thời trở lại `active`
sau khi được sử dụng và lần quét tiếp theo chạy. Các skill đã lưu trữ chỉ trở lại thông qua thao tác
khôi phục rõ ràng:

Các chuyển đổi vòng đời và thao tác khôi phục áp dụng cho phiên mới; các phiên đang chạy giữ nguyên
bản chụp nhanh skill hiện tại.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Mọi lệnh quản lý đều chấp nhận `--json`. Trạng thái cũng báo cáo các ứng viên trùng lặp có tính xác định
chỉ dưới dạng đề xuất; thao tác này không bao giờ hợp nhất các skill hoặc gọi mô hình.

## Trò chuyện

Yêu cầu agent tạo skill mong muốn; agent sẽ gọi `skill_workshop` và trả về
mã đề xuất.

### Học từ công việc gần đây

Dùng `/learn` để chuyển cuộc trò chuyện hiện tại hoặc các nguồn được chỉ định thành một
đề xuất skill tuân theo tiêu chuẩn:

```text
/learn
/learn docs/runbook.md và https://example.com/guide; tập trung vào khôi phục
```

Khi không có yêu cầu, `/learn` yêu cầu agent chắt lọc quy trình có thể tái sử dụng từ
cuộc trò chuyện hiện tại. Khi có yêu cầu, agent coi các đường dẫn, URL, ghi chú được dán
và tham chiếu đến cuộc trò chuyện là nguồn, đồng thời tuân thủ các yêu cầu về trọng tâm, phạm vi và
đặt tên. Agent thu thập các nguồn bằng những công cụ hiện có, sau đó gọi
`skill_workshop` với `action: "create"`.

Đề xuất thu được vẫn ở trạng thái `pending`; `/learn` không bao giờ áp dụng đề xuất đó. Xem xét và
áp dụng đề xuất thông qua quy trình phê duyệt thông thường hoặc bằng `openclaw skills workshop`.

Tạo:

```text
Tạo một skill tên là morning-catchup để thực hiện quy trình hộp thư đến vào thứ Hai của tôi.
```

Cập nhật một skill hiện có trong không gian làm việc:

```text
Cập nhật trip-planning để kiểm tra cả sơ đồ chỗ ngồi trước khi đặt chỗ.
```

Tiếp tục chỉnh sửa một đề xuất đang chờ:

```text
Hiển thị đề xuất morning-catchup.
Chỉnh sửa để đề xuất cũng đánh dấu mọi nội dung được ghi là khẩn cấp.
Áp dụng đề xuất morning-catchup.
```

Các thao tác `apply`, `reject` và `quarantine` do agent khởi tạo sẽ chạy mà không cần thêm
lời nhắc phê duyệt theo mặc định. Đặt `skills.workshop.approvalPolicy` thành `"pending"`
để yêu cầu người vận hành phê duyệt trước các thao tác đó.

Khi cần phê duyệt, lời nhắc xác định mã đề xuất và skill
đích, đồng thời hiển thị phần mô tả đề xuất, số lượng tệp hỗ trợ và kích thước phần nội dung.
Yêu cầu phê duyệt được giới hạn để hoàn tất trước bộ giám sát công cụ của agent. Nếu không
nhận được quyết định trước khi lời nhắc hết hạn, thao tác vòng đời sẽ không chạy:
đề xuất vẫn đang chờ và không thay đổi. Hãy quyết định sau trong giao diện Skill Workshop hoặc chạy
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agent không nên
thử lại thao tác vòng đời đã hết hạn theo vòng lặp.

## CLI

```bash
# Tạo
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Theo dõi hộp thư đến hằng ngày: phân loại, lưu trữ, làm nổi bật, soạn thảo, lập kế hoạch" \
  --proposal ./PROPOSAL.md

# Cập nhật một skill hiện có trong không gian làm việc
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

Mỗi lệnh con nhận `--agent <id>` (không gian làm việc đích; mặc định được suy ra từ
thư mục làm việc hiện tại, sau đó là agent mặc định) và `--json` (đầu ra có cấu trúc).
`propose-create`, `propose-update` và `revise` cũng nhận `--goal <text>` và
`--evidence <text>` để ghi lại ngữ cảnh đề xuất cùng với `--proposal`.

## Nội dung đề xuất

Trong khi đang chờ, đề xuất được lưu dưới dạng `PROPOSAL.md` với phần thông tin đầu tệp
chỉ dành cho đề xuất:

```markdown
---
name: "morning-catchup"
description: "Theo dõi hộp thư đến hằng ngày: phân loại, lưu trữ, làm nổi bật, soạn thảo, lập kế hoạch"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Khi áp dụng, Skill Workshop ghi `SKILL.md` đang hoạt động và xóa các
trường chỉ dành cho đề xuất: `status`, `version` của đề xuất và `date` của đề xuất.

## Tệp hỗ trợ

Dùng `--proposal-dir` khi skill được đề xuất cần các tệp bên cạnh
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Tổng kết thứ Sáu: số liệu thống kê, điểm nổi bật, ba ưu tiên hàng đầu của tuần tới" \
  --proposal-dir ./weekly-update-proposal
```

Thư mục phải chứa `PROPOSAL.md`. Các tệp hỗ trợ phải nằm trong
`assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`. Skill
Workshop quét, tính hàm băm và lưu chúng cùng đề xuất, sau đó chỉ ghi chúng
bên cạnh `SKILL.md` đang hoạt động khi áp dụng.

Các đường dẫn tệp hỗ trợ bị từ chối: đường dẫn tuyệt đối, phân đoạn đường dẫn ẩn, duyệt ngược
đường dẫn, đường dẫn chồng lấn, tệp thực thi, văn bản không phải UTF-8, byte null
và đường dẫn nằm ngoài các thư mục hỗ trợ tiêu chuẩn.

## Công cụ agent

Mô hình sử dụng `skill_workshop` với một `action` bắt buộc:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Các tham số khác được áp dụng tùy theo thao tác:

| Tham số                    | Được dùng bởi                                         | Ghi chú                                                               |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Bắt buộc đối với `create`; nếu không, phân giải đề xuất đang chờ theo tên |
| `description`              | `create`, `update`, `revise`                         | Tối đa 160 byte                                                       |
| `skill_name`               | `update`                                             | Tên hoặc khóa của skill hiện có                                      |
| `proposal_content`         | `create`, `update`, `revise`                         | Được lưu dưới dạng `PROPOSAL.md`; giới hạn bởi `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | Mảng `{ path, content }`                                              |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Ngữ cảnh văn bản tự do                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Đề xuất đích                                                         |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Không bắt buộc                                                        |
| `query`, `status`, `limit` | `list`                                               | Lọc/phân trang; `limit` tối đa 50, mặc định 20                       |

Agent phải dùng `skill_workshop` cho công việc tạo skill. Agent không được
tạo hoặc thay đổi các tệp đề xuất thông qua `write`, `edit`, `exec`, lệnh
shell hoặc thao tác trực tiếp trên hệ thống tệp.

<Note>
`skill_workshop` là công cụ agent tích hợp sẵn và được bao gồm trong
`tools.profile: "coding"`. Nếu một chính sách nghiêm ngặt hơn ẩn công cụ này, hãy thêm
`skill_workshop` vào danh sách `tools.allow` đang hoạt động hoặc dùng
`tools.alsoAllow: ["skill_workshop"]` khi phạm vi sử dụng hồ sơ không có
`tools.allow` rõ ràng. Các lượt chạy trong sandbox không khởi tạo công cụ
Skill Workshop phía máy chủ, vì vậy hãy thực hiện các thao tác xem xét đề xuất từ một phiên agent phía máy chủ thông thường
hoặc CLI.
</Note>

## Skill được đề xuất

OpenClaw phát hiện các chỉ dẫn lâu dài như “lần sau”, “hãy nhớ” và những điều chỉnh mang tính phản hồi
khi một lượt tương tác kết thúc, kể cả các lượt thất bại. Trong lượt tiếp theo, agent đề nghị lưu
quy trình được phát hiện gần nhất thông qua `skill_workshop`; người dùng quyết định có tạo
đề xuất hay không. Tính năng đề xuất tích hợp sẵn này không tự tạo hoặc thay đổi skill. Bật
`skills.workshop.autonomous.enabled` để trực tiếp tạo các đề xuất đang chờ. Trong giao diện Control
UI, thẻ Workshop cung cấp cùng tùy chọn dưới dạng nút bật/tắt **Tự học** trong tiêu đề trang và
dưới dạng nút bật trên bảng đề xuất trống.

### Quét các phiên trước đây

Control UI có thể xem xét công việc cũ hơn mà không cần bật chế độ tự học tự động.
Mở **Plugins → Workshop** và chọn **Tìm ý tưởng skill**. Quá trình quét bắt đầu với
các phiên đủ điều kiện mới nhất và xem xét một khoảng giới hạn gồm các công việc đáng kể.
Quá trình này bỏ qua các phiên cron, heartbeat, hook, agent con, ACP, do plugin sở hữu và xem xét nội bộ,
cũng như các cuộc trò chuyện có ít hơn sáu lượt mô hình.

Trình xem xét sử dụng mô hình được cấu hình của agent đã chọn và nhận một
gói bản chép lời đã che thông tin bí mật và giới hạn kích thước. Trình này áp dụng cùng một
tiêu chuẩn thận trọng như khi xem xét trải nghiệm: một mẫu khôi phục cụ thể hoặc một quy trình ổn định
có thể loại bỏ ít nhất hai lệnh gọi mô hình hoặc công cụ trong tương lai. Công việc thường lệ và các thông tin
chỉ dùng một lần không nên tạo ra đề xuất.

Một lần quét có thể tạo hoặc chỉnh sửa tối đa ba đề xuất đang chờ. Quá trình này không thể áp dụng,
từ chối, cách ly hoặc chỉnh sửa skill đang hoạt động. Workshop hiển thị phạm vi tích lũy,
ví dụ **Đã xem xét 20 phiên · 18 tháng 6–hôm nay · Tìm thấy 2 ý tưởng**. Chọn
**Quét công việc trước đó** để tiếp tục từ con trỏ phiên cũ nhất đã được lưu. Sau khi
toàn bộ lịch sử khả dụng đã được xử lý, thao tác sẽ trở thành **Quét công việc mới**.

Việc xem lại lịch sử được thực hiện thủ công ngay cả khi
`skills.workshop.autonomous.enabled` là `false`. Mỗi lần nhấp sẽ bắt đầu một lượt chạy mô hình,
vì vậy các điều khoản về giá và xử lý dữ liệu của nhà cung cấp sẽ được áp dụng. Con trỏ và số lượng phạm vi
được lưu trong cơ sở dữ liệu trạng thái OpenClaw dùng chung; nội dung bản ghi hội thoại không được sao chép
vào trạng thái quét.

Khi bật tính năng thu thập tự động, OpenClaw cũng có thể thực hiện một lượt xem xét thận trọng sau khi hoàn thành
công việc đáng kể, thành công và sau khi toàn bộ hệ thống tác tử chuyển sang trạng thái nhàn rỗi. Lượt xem xét độc lập đó có thể tạo hoặc
sửa đổi tối đa một đề xuất đang chờ xử lý. Lượt này không thể cập nhật một skill đang hoạt động hoặc áp dụng, từ chối hay cách ly một
đề xuất, ngay cả khi `approvalPolicy` là `"auto"`.

Xem [Tự học](/tools/self-learning) để biết chi tiết về cách bật, điều kiện đủ, quyền riêng tư và chi phí,
ngưỡng đề xuất và cách khắc phục sự cố.

## Phê duyệt và quyền tự chủ

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Cài đặt                    | Mặc định  | Tác dụng                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Tạo các đề xuất đang chờ xử lý từ những chỉnh sửa rõ ràng và, sau một khoảng trì hoãn khi nhàn rỗi, từ công việc đáng kể đã hoàn thành có khả năng phục hồi để tái sử dụng hoặc tiết kiệm đáng kể cho quy trình khứ hồi.   |
| `allowSymlinkTargetWrites` | `false`  | Cho phép thao tác áp dụng ghi thông qua các liên kết tượng trưng của skill trong không gian làm việc khi đích thực của chúng được liệt kê trong `skills.load.allowSymlinkTargets`.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` bỏ qua một lời nhắc bổ sung đối với thao tác `apply`, `reject` hoặc `quarantine` do tác tử khởi tạo (tác tử vẫn phải gọi hành động đó). `"pending"` yêu cầu phê duyệt. |
| `maxPending`               | `50`     | Giới hạn số đề xuất đang chờ xử lý và bị cách ly trên mỗi không gian làm việc (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Giới hạn kích thước phần nội dung đề xuất tính bằng byte (1024-200000).                                                                                                                     |

Tính năng thu thập tự động nhận diện các quy tắc cho tương lai (ví dụ: “từ giờ trở đi”) và các
chỉnh sửa mang tính phản hồi (ví dụ: “đó không phải là điều tôi yêu cầu”). Tính năng này nhóm các hướng dẫn mới theo chủ đề thành tối đa
ba đề xuất mỗi lượt, định tuyến các kết quả khớp từ vựng đến các skill hiện có có thể ghi trong không gian làm việc và
sửa đổi đề xuất đang chờ xử lý của chính nó khi một chỉnh sửa khác nhắm đến cùng skill.

Đối với công việc đáng kể được hoàn thành thành công mà không có chỉnh sửa rõ ràng, một lượt chạy độc lập của
mô hình đã chọn sẽ quyết định liệu tiến trình đã hoàn thành có vượt qua ngưỡng đề xuất thận trọng hay không. Mô hình
tiền cảnh không được nhắc học trước khi phản hồi. Trình xem xét nền giữ nguyên lượt chạy
tiền cảnh làm nguồn gốc của đề xuất, không thể truy cập các công cụ tác tử chung và không thể đưa ra quyết định
về vòng đời. Việc xem xét chỉ bắt đầu khi môi trường chạy tiền cảnh báo cáo cả mô hình đã phân giải chính xác
và rằng `skill_workshop` thực sự khả dụng. Do đó, chính sách công cụ hạn chế hoặc không xác định sẽ
từ chối theo mặc định và không tạo đề xuất nào.

Xem [Tự học](/tools/self-learning) để biết đầy đủ hành vi xem xét tự động và mô hình
an toàn.

Phần mô tả đề xuất luôn bị giới hạn ở 160 byte, độc lập với
`maxSkillBytes`.

## Các phương thức Gateway

| Phương thức                             | Phạm vi            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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

`requestRevision` chỉ dành cho Gateway (không có phương thức tương đương trong CLI hoặc công cụ tác tử): phương thức này
chuyển tiếp các hướng dẫn sửa đổi dạng văn bản tự do đến phiên trò chuyện của tác tử sở hữu
thay vì thay thế trực tiếp `PROPOSAL.md`, dành cho các giao diện người dùng yêu cầu tác tử
sửa đổi thay vì gửi nội dung mới theo nghĩa đen.

`historyStatus` và `historyScan` là các phương thức hỗ trợ Giao diện điều khiển. `historyScan`
chấp nhận `direction: "older" | "newer"`; phương thức này luôn để kết quả ở trạng thái đề xuất
đang chờ xử lý.

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
- `PROPOSAL.md`: đề xuất skill đang chờ xử lý.
- `rollback.json`: siêu dữ liệu khôi phục được ghi trước khi thao tác áp dụng thay đổi các tệp đang hoạt động.

## Giới hạn

| Giới hạn                           | Giá trị                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Mô tả                     | 160 byte                                                            |
| Nội dung đề xuất                   | `skills.workshop.maxSkillBytes` (mặc định 40,000; giới hạn cứng 1 MiB) |
| Tệp hỗ trợ                   | 64 tệp trên mỗi đề xuất                                                      |
| Kích thước tệp hỗ trợ               | 256 KiB mỗi tệp, tổng cộng 2 MiB                                            |
| Đề xuất đang chờ xử lý + bị cách ly | `skills.workshop.maxPending` trên mỗi không gian làm việc (mặc định 50)              |

## Khắc phục sự cố

| Sự cố                                        | Cách giải quyết                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Rút ngắn `description` xuống còn 160 byte trở xuống.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Rút ngắn nội dung đề xuất hoặc tăng `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Sửa đổi đề xuất theo mục tiêu hiện tại hoặc tạo một đề xuất mới.                                                                                                                                   |
| `Proposal scan failed`                         | Kiểm tra các phát hiện của trình quét, sau đó sửa đổi hoặc cách ly đề xuất.                                                                                                                                           |
| `untrusted symlink target`                     | Cấu hình `skills.load.allowSymlinkTargets` và chỉ bật `skills.workshop.allowSymlinkTargetWrites` cho các thư mục gốc skill dùng chung có chủ đích.                                                                  |
| `Support file paths must be under one of...`   | Di chuyển các tệp hỗ trợ vào `assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`.                                                                                                                |
| Đề xuất không xuất hiện trong danh sách                 | Kiểm tra không gian làm việc `--agent` đã chọn và `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Tác tử không thể gọi `skill_workshop`             | Kiểm tra chính sách công cụ và chế độ chạy đang hoạt động. `coding` bao gồm công cụ này; các chính sách `tools.allow` hạn chế phải liệt kê rõ công cụ đó, còn các lượt chạy trong sandbox phải sử dụng một phiên tác tử phía máy chủ thông thường hoặc CLI. |

### Chẩn đoán chính sách công cụ

Khi tính năng thu thập tự động được bật, `openclaw doctor` chạy bước kiểm tra
`core/doctor/skill-workshop-tool-policy` cho tác tử mặc định. Nếu chính sách
ẩn `skill_workshop`, cảnh báo sẽ nêu tên lớp cấu hình loại trừ đầu tiên và
thay đổi chính xác cần thực hiện đối với `allow` hoặc `alsoAllow`. Các sổ tay vận hành cũ hơn vẫn có thể sử dụng
`openclaw plugins inspect skill-workshop`; lệnh đó hiện giải thích rằng Skill
Workshop được tích hợp sẵn và hiển thị cùng gợi ý chính sách khi áp dụng.

## Liên quan

- [Skills](/vi/tools/skills) để biết thứ tự tải, mức ưu tiên và khả năng hiển thị
- [Tự học](/tools/self-learning) để biết các đề xuất skill thận trọng sau lượt chạy
- [Tạo skill](/vi/tools/creating-skills) để biết những kiến thức cơ bản về `SKILL.md`
  được viết thủ công
- [Cấu hình Skills](/vi/tools/skills-config) để biết toàn bộ lược đồ `skills.workshop`
- [CLI Skills](/vi/cli/skills) để biết các lệnh `openclaw skills`
