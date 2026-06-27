---
read_when:
    - Bạn muốn một bảng công việc kiểu Kanban trong Giao diện điều khiển
    - Bạn đang bật hoặc tắt Plugin Workboard đi kèm
    - Bạn muốn theo dõi công việc agent đã lên kế hoạch mà không cần trình quản lý dự án bên ngoài
summary: Bảng công việc bảng điều khiển tùy chọn cho các thẻ do tác nhân sở hữu và bàn giao phiên
title: Plugin bảng công việc
x-i18n:
    generated_at: "2026-06-27T18:00:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard thêm một bảng tùy chọn kiểu Kanban vào
[Giao diện điều khiển](/vi/web/control-ui). Dùng bảng này để thu thập các thẻ công việc vừa tầm tác tử, gán
chúng cho tác tử, và theo dõi tác vụ nền, lượt chạy, và phiên bảng điều khiển
được liên kết từ một thẻ duy nhất.

Workboard được thiết kế có chủ đích là nhỏ gọn. Nó theo dõi công việc vận hành cục bộ cho một
OpenClaw Gateway; nó không thay thế GitHub Issues, Linear, Jira, hoặc
các hệ thống quản lý dự án nhóm khác.

## Trạng thái mặc định

Workboard là một Plugin được đóng gói sẵn và bị tắt theo mặc định trừ khi bạn bật nó
trong cấu hình Plugin.

Bật bằng:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Sau đó mở bảng điều khiển:

```bash
openclaw dashboard
```

Tab Workboard xuất hiện trong điều hướng bảng điều khiển. Nếu tab hiển thị
nhưng Plugin bị tắt hoặc bị chặn bởi `plugins.allow` / `plugins.deny`, chế độ xem
sẽ hiển thị trạng thái Plugin không khả dụng thay vì dữ liệu thẻ cục bộ.

## Thẻ chứa những gì

Mỗi thẻ lưu trữ:

- tiêu đề và ghi chú
- trạng thái: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked`, hoặc `done`
- mức ưu tiên: `low`, `normal`, `high`, hoặc `urgent`
- nhãn
- id tác tử tùy chọn
- tác vụ, lượt chạy, phiên, hoặc URL nguồn được liên kết tùy chọn
- siêu dữ liệu thực thi tùy chọn cho một lượt chạy Codex hoặc Claude bắt đầu từ thẻ
- siêu dữ liệu gọn cho các lần thử, bình luận, liên kết, bằng chứng, hiện vật, tự động hóa,
  tệp đính kèm, nhật ký worker, trạng thái giao thức worker, tuyên bố, chẩn đoán,
  thông báo, mẫu, trạng thái lưu trữ, và phát hiện phiên cũ
- sự kiện thẻ gần đây như thay đổi đã tạo, đã di chuyển, đã liên kết, đã nhận, Heartbeat,
  lần thử, bằng chứng, hiện vật, chẩn đoán, thông báo, điều phối, lưu trữ, cũ,
  hoặc do tác tử cập nhật

Thẻ được lưu trong trạng thái Gateway của Plugin. Chúng cục bộ trong thư mục trạng thái Gateway
và di chuyển cùng phần còn lại của trạng thái OpenClaw của Gateway đó.

Workboard giữ siêu dữ liệu gọn theo từng thẻ để người vận hành có thể thấy một thẻ đã di chuyển
qua bảng như thế nào mà không cần mở phiên được liên kết. Sự kiện, tóm tắt lần thử,
đoạn bằng chứng, liên kết liên quan, bình luận, dấu mốc lưu trữ, và dấu mốc phiên cũ
có chủ đích là siêu dữ liệu cục bộ; chúng không thay thế bản ghi phiên
hoặc lịch sử issue GitHub.

## Thực thi thẻ và tác vụ

Các thẻ chưa liên kết có thể bắt đầu công việc từ thẻ. Các lượt bắt đầu tự động dùng
đường dẫn lượt chạy tác tử có theo dõi tác vụ của Gateway, rồi Workboard liên kết tác vụ kết quả,
id lượt chạy, và khóa phiên trở lại thẻ. Việc bắt đầu sử dụng tác tử và mô hình mặc định
đã cấu hình của Gateway. Các hành động Codex và Claude là lựa chọn mô hình rõ ràng tùy chọn:

- Run Codex hoặc Run Claude bắt đầu một lượt chạy tác tử dựa trên tác vụ, gửi prompt của thẻ,
  và đánh dấu thẻ là `running`.
- Open Codex hoặc Open Claude tạo một phiên bảng điều khiển được liên kết mà không gửi
  prompt của thẻ hoặc di chuyển thẻ, để bạn có thể làm việc thủ công trong khi nó vẫn
  gắn với bảng.

Siêu dữ liệu thực thi lưu công cụ đã chọn, chế độ, tham chiếu mô hình, khóa phiên,
id lượt chạy, id tác vụ khi có, và trạng thái vòng đời trên thẻ. Các lượt thực thi Codex
dùng `openai/gpt-5.5`; các lượt thực thi Claude dùng
`anthropic/claude-sonnet-4-6`.

Mỗi lượt thực thi được liên kết cũng ghi lại một tóm tắt lần thử trên cùng bản ghi thẻ.
Tóm tắt lần thử giữ công cụ, chế độ, mô hình, id lượt chạy, dấu thời gian, trạng thái,
và số lỗi lặp lũy tiến để các lỗi lặp lại vẫn hiển thị trên bảng.

Bảng điều khiển làm mới trạng thái tác vụ từ sổ cái tác vụ Gateway và khớp
tác vụ trở lại thẻ theo id tác vụ, id lượt chạy, hoặc khóa phiên được liên kết. Nếu một tác vụ
đang xếp hàng hoặc đang chạy, vòng đời thẻ hiển thị trạng thái tác vụ đang hoạt động. Nếu tác vụ
hoàn tất, thất bại, hết thời gian, hoặc bị hủy, vòng đời thẻ chuyển về
trạng thái review hoặc blocked bằng cùng đồng bộ vòng đời như các phiên được liên kết.

## Phối hợp tác tử

Workboard cũng cung cấp các công cụ tác tử tùy chọn cho quy trình làm việc nhận biết bảng:

- `workboard_list` liệt kê các thẻ gọn cùng trạng thái nhận và chẩn đoán, với một
  bộ lọc bảng tùy chọn.
- `workboard_read` trả về một thẻ cộng với ngữ cảnh worker có giới hạn được dựng từ ghi chú,
  lần thử, bình luận, liên kết, bằng chứng, hiện vật, kết quả cha, công việc gần đây của người được gán,
  và chẩn đoán đang hoạt động.
- `workboard_create` tạo một thẻ với cha tùy chọn, tenant, Skills,
  bảng, siêu dữ liệu workspace, khóa idempotency, giới hạn runtime, và ngân sách thử lại.
- `workboard_link` liên kết một thẻ cha với một thẻ con. Các thẻ con ở trong `todo`
  cho đến khi mọi thẻ cha đạt `done`; sau đó thăng cấp điều phối chuyển chúng sang
  `ready`.
- `workboard_claim` nhận một thẻ cho tác tử gọi và chuyển các thẻ backlog, todo,
  hoặc ready sang `running`.
- `workboard_heartbeat` làm mới Heartbeat nhận việc trong các lượt chạy dài hơn.
- `workboard_release` giải phóng nhận việc sau khi hoàn tất, tạm dừng, hoặc bàn giao và
  có thể chuyển thẻ sang trạng thái tiếp theo.
- `workboard_complete` và `workboard_block` là các công cụ vòng đời có cấu trúc cho
  tóm tắt cuối, bằng chứng, hiện vật, manifest thẻ đã tạo, và lý do chặn.
  Manifest thẻ đã tạo phải tham chiếu các thẻ được liên kết ngược về
  thẻ đã hoàn tất, giúp loại các thẻ con ảo khỏi tóm tắt.
- `workboard_attachment_add`, `workboard_attachment_read`, và
  `workboard_attachment_delete` lưu tệp đính kèm thẻ nhỏ trong trạng thái SQLite của Plugin,
  lập chỉ mục chúng trên thẻ, và hiển thị chúng trong ngữ cảnh worker.
- `workboard_worker_log` và `workboard_protocol_violation` ghi lại các dòng nhật ký worker
  và chặn thẻ khi một worker tự động dừng mà không gọi
  `workboard_complete` hoặc `workboard_block`.
- `workboard_board_create`, `workboard_board_archive`, và
  `workboard_board_delete` quản lý siêu dữ liệu bảng đã lưu như tên hiển thị,
  mô tả, trạng thái lưu trữ, và workspace mặc định.
- `workboard_runs` trả về lịch sử lần thử chạy đã lưu trên một thẻ.
- `workboard_specify` biến một thẻ triage hoặc backlog thô thành một thẻ
  `todo` đã được làm rõ và ghi tóm tắt đặc tả trên thẻ.
- `workboard_decompose` tỏa một thẻ điều phối cha thành các thẻ con được liên kết,
  kế thừa siêu dữ liệu bảng và tenant, và có thể hoàn tất thẻ cha bằng một
  manifest thẻ đã tạo.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance`, và
  `workboard_notify_unsubscribe` quản lý đăng ký thông báo trong trạng thái Plugin.
  Việc đọc sự kiện an toàn khi phát lại; công cụ advance di chuyển con trỏ bền
  để bên gọi có thể tiếp tục mà không mất hoặc đọc trùng các sự kiện thẻ đã hoàn tất, thất bại, hoặc
  cũ.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock`, và `workboard_dispatch` cho phép tác tử
  kiểm tra namespace bảng, xem thống kê hàng đợi, khôi phục công việc kẹt, thêm ghi chú
  bàn giao, đính kèm tham chiếu bằng chứng hoặc hiện vật, chuyển công việc bị chặn về `todo`,
  và thúc đẩy thăng cấp phụ thuộc hoặc dọn dẹp nhận việc cũ.

Các thẻ đã được nhận sẽ từ chối đột biến bằng công cụ tác tử từ tác tử khác trừ khi bên gọi
có token nhận việc do `workboard_claim` trả về. Người vận hành bảng điều khiển vẫn dùng
bề mặt RPC Gateway bình thường và có thể khôi phục hoặc gán lại thẻ.

Workboard lưu dữ liệu bảng bền trong cơ sở dữ liệu SQLite quan hệ do Plugin sở hữu
bên dưới thư mục trạng thái OpenClaw. Bảng, thẻ, nhãn, sự kiện vòng đời,
lần thử chạy, bình luận, liên kết phụ thuộc, bằng chứng, tham chiếu hiện vật,
siêu dữ liệu và blob tệp đính kèm, chẩn đoán, thông báo, nhật ký worker,
trạng thái giao thức, và đăng ký được lưu trong các bảng Workboard thay vì
mục khóa-giá trị của Plugin. Một bản xuất thẻ vẫn giữ lại câu chuyện của bảng
mà không nhúng nội dung blob tệp đính kèm.

Các bản cài đặt đã dùng Workboard trong bản phát hành `.28` có thể chạy
`openclaw doctor --fix` để di chuyển các namespace trạng thái Plugin cũ đã phát hành
(`workboard.cards`, `workboard.boards`, và `workboard.notify`) vào
cơ sở dữ liệu quan hệ. Nếu có namespace `workboard.attachments` cũ,
doctor cũng di chuyển các blob tệp đính kèm đó.

Chẩn đoán Workboard được tính từ siêu dữ liệu thẻ cục bộ. Các kiểm tra tích hợp
gắn cờ thẻ đã gán chờ quá lâu, thẻ đang chạy không có Heartbeat gần đây,
thẻ bị chặn cần chú ý, lỗi lặp lại, thẻ done không có bằng chứng,
và thẻ đang chạy chỉ có một liên kết phiên lỏng lẻo.

Điều phối có chủ đích là cục bộ trong Gateway. Nó không sinh ra các tiến trình hệ điều hành
tùy ý; các phiên tác tử con OpenClaw bình thường vẫn sở hữu phần thực thi. Hành động
điều phối thăng cấp các thẻ đã sẵn sàng về phụ thuộc, ghi siêu dữ liệu điều phối trên
các thẻ ready, chặn nhận việc hết hạn hoặc lượt chạy quá thời gian, đánh dấu các thẻ triage
được cấu hình theo bảng là ứng viên điều phối, rồi nhận một lô nhỏ thẻ ready
và bắt đầu lượt chạy worker thông qua runtime tác tử con của Gateway. Các thẻ đã gán
dùng khóa phiên worker `agent:<id>:subagent:workboard-*`; các thẻ chưa gán
dùng khóa `subagent:workboard-*` không theo phạm vi để Gateway vẫn phân giải
tác tử mặc định đã cấu hình. Worker nhận ngữ cảnh thẻ có giới hạn cùng với token nhận việc
cần thiết để Heartbeat, hoàn tất, hoặc chặn thẻ thông qua các công cụ Workboard.

### Chọn worker điều phối

Mỗi lượt điều phối mặc định bắt đầu tối đa ba worker. Các thẻ ready được
sắp xếp theo mức ưu tiên, vị trí, và thời gian tạo, rồi được lọc để tránh
quyền sở hữu đang hoạt động bị trùng. Một lượt điều phối chỉ bắt đầu một thẻ cho một chủ sở hữu hoặc
tác tử nhất định trong cùng lượt, và bỏ qua các chủ sở hữu đã có công việc running hoặc review
trên bảng.

Thẻ đã lưu trữ, thẻ có nhận việc đang hoạt động, và thẻ không có trạng thái `ready`
không được chọn để bắt đầu worker. Chúng vẫn có thể bị ảnh hưởng bởi phần dữ liệu của
điều phối khi áp dụng nhận việc cũ, thăng cấp phụ thuộc, hoặc dọn dẹp hết thời gian.

### Prompt worker và vòng đời

Prompt worker bao gồm tiêu đề thẻ, ghi chú và ngữ cảnh có giới hạn,
bảng đã gán, và giao thức worker Workboard. Nó cũng bao gồm chủ sở hữu nhận việc
và token nhận việc để worker có thể gọi `workboard_heartbeat`,
`workboard_complete`, hoặc `workboard_block` mà không bị tác nhân khác tiếp quản
thẻ.

Khi một worker bắt đầu thành công, Workboard lưu khóa phiên, id lượt chạy,
công cụ, chế độ, nhãn mô hình, trạng thái, và nhật ký worker trên thẻ. Khóa phiên
mang tính xác định cho bảng và thẻ, giúp các lượt điều phối lặp lại định tuyến
trở lại cùng làn worker thay vì tạo các phiên không liên quan.

Nếu không thể bắt đầu worker sau khi một thẻ được nhận, Workboard chặn
thẻ, xóa nhận việc, ghi lỗi bắt đầu lượt chạy, và thêm một dòng nhật ký worker.
Lỗi đó hiển thị trong bảng điều khiển, JSON CLI, công cụ tác tử, và
chẩn đoán thẻ.

### Điểm vào điều phối

Việc bắt đầu worker cho thẻ ready có thể diễn ra từ:

- hành động điều phối trên bảng điều khiển
- `openclaw workboard dispatch`
- `/workboard dispatch` trên một kênh hỗ trợ lệnh

Cả ba điểm vào đều dùng runtime tác tử con của Gateway khi Gateway
khả dụng. CLI có thêm một phương án dự phòng cho người vận hành: nếu Gateway ngoại tuyến hoặc
không cung cấp phương thức điều phối Workboard và không có mục tiêu `--url` hoặc
`--token` rõ ràng được cung cấp, nó chạy điều phối chỉ dữ liệu trên trạng thái SQLite cục bộ.
Phương án dự phòng đó có thể thăng cấp phụ thuộc, dọn dẹp nhận việc cũ, và chặn
lượt chạy quá thời gian, nhưng không thể bắt đầu worker.

Siêu dữ liệu bảng có thể bao gồm cài đặt điều phối như `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee`, và `orchestratorProfile`.
OpenClaw ghi lại ý định điều phối và hiển thị nó trong ngữ cảnh worker; việc
đặc tả và phân rã thực tế vẫn diễn ra thông qua các công cụ Workboard bình thường.

## CLI và lệnh gạch chéo

Plugin đăng ký một lệnh CLI gốc:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` gọi Gateway đang chạy để các worker khởi động bằng cùng runtime subagent như dashboard. Nếu Gateway không khả dụng, lệnh sẽ chuyển về dispatch chỉ dữ liệu để việc nâng cấp phụ thuộc, dọn dẹp claim cũ và chặn timeout vẫn có thể chạy. Các lỗi xác thực, quyền và xác thực hợp lệ vẫn hiển thị dưới dạng lỗi lệnh, cũng như lỗi đối với các đích `--url` hoặc `--token` tường minh.

Lệnh slash `/workboard` hỗ trợ cùng đường dẫn operator gọn:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` và
`/workboard dispatch`. List và show là thao tác đọc dành cho người gửi lệnh được ủy quyền. Create và dispatch yêu cầu trạng thái owner trên các bề mặt chat hoặc một client Gateway có `operator.write` hoặc `operator.admin`.

Xem [CLI Workboard](/vi/cli/workboard) để biết các cờ lệnh, đầu ra JSON, hành vi dự phòng Gateway, cách xử lý tiền tố id rõ ràng, quy tắc chọn dispatch và khắc phục sự cố.

## Đồng bộ vòng đời phiên

Thẻ có thể được liên kết với các phiên dashboard hiện có hoặc với phiên được tạo khi bạn bắt đầu làm việc từ một thẻ. Các thẻ được liên kết hiển thị vòng đời phiên ngay trong dòng: đang chạy, cũ, đã liên kết nhưng nhàn rỗi, hoàn tất, thất bại hoặc thiếu.

Nếu phiên được liên kết bị thiếu, thẻ vẫn giữ liên kết để duy trì ngữ cảnh và vẫn cung cấp điều khiển bắt đầu để bạn có thể khởi động lại công việc vào một phiên dashboard mới.
Nếu một phiên đang hoạt động được liên kết ngừng báo cáo hoạt động gần đây, Workboard đánh dấu thẻ là cũ và lưu dấu này dưới dạng metadata của thẻ cho đến khi vòng đời xóa nó.

Bạn cũng có thể ghi nhận một phiên dashboard hiện có từ tab Sessions bằng Add to Workboard. Thẻ được liên kết với phiên đó, dùng nhãn phiên hoặc prompt người dùng gần đây làm tiêu đề, và khởi tạo ghi chú từ prompt người dùng gần đây cộng với phản hồi assistant mới nhất khi có lịch sử chat.

Workboard theo dõi phiên được liên kết khi thẻ vẫn ở trạng thái công việc đang hoạt động:

- phiên được liên kết đang hoạt động -> `running`
- phiên được liên kết đã hoàn thành -> `review`
- phiên được liên kết thất bại, bị kill, timed out hoặc bị hủy -> `blocked`

Các trạng thái review thủ công được ưu tiên. Nếu bạn chuyển một thẻ sang `review`, `blocked` hoặc `done`, Workboard sẽ ngừng tự động di chuyển thẻ đó cho đến khi bạn chuyển lại về `todo` hoặc `running`.

## Quy trình dashboard

1. Mở tab Workboard trong Control UI.
2. Tạo một thẻ với tiêu đề, ghi chú, mức ưu tiên, nhãn, agent tùy chọn và phiên được liên kết tùy chọn.
3. Hoặc mở Sessions và chọn Add to Workboard cho một phiên hiện có.
4. Kéo thẻ giữa các cột hoặc focus điều khiển trạng thái gọn trên thẻ và dùng menu của nó hoặc ArrowLeft/ArrowRight.
5. Bắt đầu công việc từ thẻ để tạo hoặc dùng lại một phiên dashboard.
6. Mở phiên được liên kết từ thẻ trong khi agent làm việc.
7. Để đồng bộ vòng đời chuyển công việc đang chạy sang review hoặc blocked, rồi chuyển thẻ sang done theo cách thủ công khi được chấp nhận.

Việc bắt đầu một thẻ sử dụng các phiên Gateway bình thường. Plugin Workboard chỉ lưu metadata và liên kết của thẻ; bản ghi hội thoại, lựa chọn model và vòng đời run vẫn thuộc quyền sở hữu của hệ thống phiên thông thường.

Dùng Stop trên một thẻ được liên kết đang live để hủy run phiên đang hoạt động. Workboard đánh dấu thẻ đó là `blocked` để nó vẫn hiển thị cho bước theo dõi.

Thẻ mới có thể bắt đầu từ các mẫu Workboard cho bugfix, tài liệu, release, review PR hoặc công việc plugin. Mẫu điền sẵn tiêu đề, ghi chú, nhãn và mức ưu tiên, và id mẫu đã chọn được lưu dưới dạng metadata của thẻ.

## Quyền

Plugin đăng ký các phương thức RPC Gateway trong namespace `workboard.*`:

- `workboard.cards.list` yêu cầu `operator.read`
- `workboard.cards.export` yêu cầu `operator.read`
- `workboard.cards.diagnostics` yêu cầu `operator.read`
- `workboard.cards.diagnostics.refresh` yêu cầu `operator.write`
- thao tác đọc danh sách/lấy attachment và sự kiện thông báo yêu cầu `operator.read`
- việc nâng con trỏ thông báo yêu cầu `operator.write`
- các phương thức tạo, cập nhật, di chuyển, xóa, bình luận, liên kết, liên kết phụ thuộc, proof, artifact,
  thêm/xóa attachment, log worker, vi phạm giao thức, claim, heartbeat,
  release, hoàn thành, chặn, bỏ chặn, dispatch, bulk và archive yêu cầu
  `operator.write`

Trình duyệt được kết nối với quyền operator chỉ đọc có thể xem board nhưng không thể thay đổi thẻ.

## Cấu hình

Workboard hiện không có cấu hình riêng cho plugin. Bật hoặc tắt nó bằng mục plugin tiêu chuẩn:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Tắt lại bằng:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Khắc phục sự cố

### Tab báo Workboard không khả dụng

Kiểm tra policy plugin:

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu `plugins.allow` được cấu hình, hãy thêm `workboard` vào allowlist đó. Nếu
`plugins.deny` chứa `workboard`, hãy xóa nó trước khi bật plugin.

### Thẻ không được lưu

Xác nhận kết nối trình duyệt có quyền `operator.write`. Các phiên operator chỉ đọc có thể liệt kê thẻ nhưng không thể tạo, chỉnh sửa, di chuyển hoặc xóa chúng.

### Bắt đầu một thẻ không mở phiên mong đợi

Workboard tạo liên kết tới các phiên dashboard bình thường. Kiểm tra agent id và phiên được liên kết của thẻ, sau đó mở chế độ xem Sessions hoặc Chat để kiểm tra trạng thái run thực tế.

### Dispatch không khởi động worker

Xác nhận có ít nhất một thẻ `ready` không có claim đang hoạt động:

```bash
openclaw workboard list --status ready
```

Nếu CLI báo dispatch chỉ dữ liệu, hãy khởi động hoặc khởi động lại Gateway rồi thử lại.
Dispatch chỉ dữ liệu cập nhật trạng thái board cục bộ nhưng không thể khởi động các run worker subagent.

Thẻ cũng có thể bị bỏ qua khi một thẻ khác của cùng owner hoặc agent đang chạy hoặc đang chờ review. Hoàn thành, chặn hoặc release công việc đang hoạt động đó trước khi dispatch thêm công việc cho cùng owner.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [CLI Workboard](/vi/cli/workboard)
- [Plugins](/vi/tools/plugin)
- [Quản lý plugin](/vi/plugins/manage-plugins)
- [Sessions](/vi/concepts/session)
