---
read_when:
    - Bạn muốn một bảng công việc kiểu Kanban trong giao diện điều khiển
    - Bạn đang bật hoặc tắt Plugin Workboard đi kèm
    - Bạn muốn theo dõi công việc đã lên kế hoạch của tác tử mà không cần công cụ quản lý dự án bên ngoài
summary: Bảng công việc trên trang tổng quan tùy chọn dành cho các thẻ do tác tử sở hữu và việc bàn giao phiên làm việc
title: Plugin bảng công việc
x-i18n:
    generated_at: "2026-07-12T08:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard bổ sung một bảng kiểu Kanban tùy chọn vào
[Control UI](/vi/web/control-ui): các thẻ công việc có kích thước phù hợp với agent, khả năng giao việc cho agent
và liên kết trở lại tác vụ, lượt chạy và phiên dashboard của thẻ.

Workboard được thiết kế có chủ đích để duy trì quy mô nhỏ: nó theo dõi công việc vận hành cục bộ cho một
OpenClaw Gateway. Nó không thay thế GitHub Issues, Linear, Jira hoặc
các hệ thống quản lý dự án nhóm khác.

## Bật Workboard

Workboard được đóng gói sẵn nhưng mặc định bị tắt:

1. Mở **Plugin** trong Control UI hoặc dùng `/settings/plugins` tương ứng với
   đường dẫn cơ sở đã cấu hình của Control UI. Ví dụ: đường dẫn cơ sở `/openclaw`
   sẽ dùng `/openclaw/settings/plugins`.
2. Tìm **Workboard** và chọn **Enable**. Vì Workboard được tích hợp trong
   OpenClaw nên không cần thao tác **Install**.
3. Nếu giao diện thông báo cần khởi động lại, hãy khởi động lại Gateway.

Thẻ Workboard xuất hiện trong thanh điều hướng của dashboard sau khi runtime của plugin tải xong.
Khi Workboard bị tắt, thẻ này vẫn bị ẩn khỏi thanh điều hướng. Việc mở trực tiếp
tuyến `/workboard` trong khi plugin bị tắt hoặc bị chặn bởi
`plugins.allow`/`plugins.deny` sẽ hiển thị trạng thái plugin không khả dụng thay vì dữ liệu
thẻ.

Quy trình CLI tương đương là:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Cấu hình

Workboard không có cấu hình dành riêng cho plugin. Bật hoặc tắt nó bằng mục nhập
plugin tiêu chuẩn:

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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Các trường của thẻ

| Trường          | Giá trị                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `status`        | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`      | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`        | các chuỗi có định dạng tự do                                                                                  |
| `agentId`       | agent được giao tùy chọn                                                                                      |
| tham chiếu liên kết | tác vụ, lượt chạy, phiên hoặc URL nguồn tùy chọn                                                          |
| `execution`     | siêu dữ liệu tùy chọn cho một lượt chạy Codex/Claude được bắt đầu từ thẻ (engine, chế độ, mô hình, phiên, mã lượt chạy, trạng thái) |

Các thẻ cũng chứa siêu dữ liệu cô đọng về các lần thử, bình luận, liên kết, bằng chứng,
tạo tác, cài đặt tự động hóa, tệp đính kèm, nhật ký worker, trạng thái giao thức
worker, yêu cầu nhận việc, thông tin chẩn đoán, thông báo, mã mẫu, trạng thái lưu trữ và
phát hiện phiên lỗi thời, cùng danh sách sự kiện gần đây (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Siêu dữ liệu này cho phép
người vận hành xem thẻ đã di chuyển qua bảng như thế nào mà không cần mở phiên
được liên kết; đây là ngữ cảnh vận hành cục bộ, không thay thế bản ghi nội dung
phiên hoặc lịch sử GitHub issue.

Các thẻ được lưu trong trạng thái Gateway riêng của plugin và di chuyển cùng phần còn lại của
trạng thái OpenClaw trên Gateway đó (xem [Lưu trữ](#storage)).

## Bắt đầu công việc từ thẻ

Các thẻ chưa liên kết có thể bắt đầu công việc trực tiếp:

- **Run Codex** / **Run Claude** bắt đầu một lượt chạy agent có theo dõi tác vụ với
  engine được chỉ định rõ, gửi prompt của thẻ và đánh dấu thẻ là `running`. Các lượt chạy Codex
  dùng `openai/gpt-5.6-sol`; các lượt chạy Claude dùng `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** tạo một phiên dashboard được liên kết mà không
  gửi prompt của thẻ hoặc di chuyển thẻ, dành cho công việc thủ công vẫn
  được gắn với bảng.

Các lần bắt đầu tự động sử dụng đường dẫn chạy agent có theo dõi tác vụ của Gateway (agent
và mô hình mặc định, trừ khi Codex/Claude được chọn rõ ràng); sau đó Workboard liên kết
tác vụ, mã lượt chạy và khóa phiên thu được trở lại thẻ. Mỗi lần thực thi được liên kết
cũng ghi lại bản tóm tắt lần thử (engine, chế độ, mô hình, mã lượt chạy,
dấu thời gian, trạng thái, số lần thất bại tích lũy) để các lỗi lặp lại luôn hiển thị.

Dashboard làm mới trạng thái tác vụ từ sổ cái tác vụ của Gateway, đối chiếu
tác vụ với thẻ theo mã tác vụ, mã lượt chạy hoặc khóa phiên được liên kết. Một tác vụ đang chờ/đang chạy
giữ vòng đời của thẻ ở trạng thái hoạt động; tác vụ đã hoàn tất, thất bại, hết thời gian chờ hoặc
bị hủy sẽ chuyển thẻ về phía `review` hoặc `blocked` bằng cùng quy tắc đồng bộ
như các phiên được liên kết (xem [Đồng bộ vòng đời phiên](#session-lifecycle-sync)).

## Công cụ dành cho agent

| Công cụ                                                                                                                                          | Mục đích                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Liệt kê các thẻ thu gọn cùng trạng thái nhận việc/chẩn đoán; có thể lọc theo bảng.                                                                                                                                        |
| `workboard_read`                                                                                                                                 | Trả về một thẻ cùng ngữ cảnh worker có giới hạn (ghi chú, lần thử, bình luận, liên kết, bằng chứng, hiện vật, kết quả của thẻ cha, công việc gần đây của người được giao, chẩn đoán đang hoạt động).                       |
| `workboard_create`                                                                                                                               | Tạo thẻ với các thẻ cha, đối tượng thuê, Skills, bảng, siêu dữ liệu không gian làm việc, khóa chống trùng lặp, giới hạn thời gian chạy và ngân sách thử lại tùy chọn.                                                     |
| `workboard_link`                                                                                                                                 | Liên kết thẻ cha với thẻ con. Thẻ con giữ trạng thái `todo` cho đến khi mọi thẻ cha đạt `done`, sau đó quá trình nâng cấp khi điều phối chuyển chúng sang `ready`.                                                       |
| `workboard_claim`                                                                                                                                | Nhận một thẻ cho tác nhân gọi; chuyển `backlog`/`todo`/`ready` sang `running`.                                                                                                                                            |
| `workboard_heartbeat`                                                                                                                            | Làm mới Heartbeat nhận việc trong một lượt chạy dài hơn.                                                                                                                                                                  |
| `workboard_release`                                                                                                                              | Nhả quyền nhận việc sau khi hoàn tất, tạm dừng hoặc bàn giao; có thể chuyển thẻ sang trạng thái tiếp theo.                                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Các công cụ vòng đời có cấu trúc dành cho bản tóm tắt cuối cùng, bằng chứng, hiện vật và bản kê khai thẻ đã tạo (phải tham chiếu các thẻ được liên kết ngược về thẻ đã hoàn tất), hoặc lý do bị chặn.                       |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Lưu các tệp đính kèm nhỏ của thẻ trong trạng thái SQLite của Plugin, lập chỉ mục trên thẻ và hiển thị trong ngữ cảnh worker.                                                                                              |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Ghi lại các dòng nhật ký worker và chặn thẻ khi worker tự động dừng mà không gọi `workboard_complete`/`workboard_block`.                                                                                                  |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Quản lý siêu dữ liệu bảng được lưu bền vững (tên hiển thị, mô tả, trạng thái lưu trữ, không gian làm việc mặc định).                                                                                                       |
| `workboard_runs`                                                                                                                                 | Trả về lịch sử các lần chạy thử được lưu bền vững của một thẻ.                                                                                                                                                            |
| `workboard_specify`                                                                                                                              | Chuyển một thẻ phân loại nhanh/danh sách tồn đọng sơ bộ thành thẻ `todo` đã được làm rõ; ghi bản tóm tắt đặc tả vào thẻ.                                                                                                  |
| `workboard_decompose`                                                                                                                            | Phân tách một thẻ điều phối cha thành các thẻ con được liên kết, kế thừa siêu dữ liệu bảng/đối tượng thuê; có thể hoàn tất thẻ cha bằng bản kê khai thẻ đã tạo.                                                            |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Quản lý đăng ký thông báo. Việc đọc sự kiện an toàn khi phát lại; `advance` di chuyển con trỏ bền vững để bên gọi tiếp tục mà không bỏ sót hoặc đọc trùng các sự kiện thẻ đã hoàn tất/thất bại/quá hạn.                    |
| `workboard_boards` / `workboard_stats`                                                                                                           | Kiểm tra không gian tên bảng và số liệu thống kê hàng đợi.                                                                                                                                                                |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Khôi phục hoặc bàn giao công việc bị mắc kẹt.                                                                                                                                                                             |
| `workboard_comment` / `workboard_proof`                                                                                                          | Thêm ghi chú bàn giao hoặc đính kèm tham chiếu bằng chứng/hiện vật.                                                                                                                                                       |
| `workboard_unblock`                                                                                                                              | Chuyển công việc bị chặn trở lại `todo`.                                                                                                                                                                                  |
| `workboard_dispatch`                                                                                                                             | Thúc đẩy việc nâng cấp phụ thuộc hoặc dọn dẹp quyền nhận việc quá hạn.                                                                                                                                                    |

Các thẻ đã được nhận sẽ từ chối thao tác thay đổi bằng công cụ tác nhân từ các tác nhân khác, trừ khi bên gọi
nắm giữ mã thông báo nhận việc do `workboard_claim` trả về. Mọi thẻ được trả về bởi
công cụ tác nhân hoặc lời gọi RPC của Gateway đều che `metadata.claim.token` thành `[redacted]`
(bản thân mã thông báo chỉ được trả về một lần ở cấp cao nhất và chỉ từ `workboard_claim`),
để người vận hành bảng điều khiển và các tác nhân khác có thể kiểm tra trạng thái nhận việc mà không bao giờ
nhìn thấy mã thông báo có thể sử dụng. Việc khôi phục được thực hiện thông qua
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, vốn không
yêu cầu mã thông báo.

## Điều phối

Việc điều phối diễn ra cục bộ trong Gateway: không khởi chạy các tiến trình hệ điều hành tùy ý. Các phiên
tác nhân con OpenClaw thông thường vẫn chịu trách nhiệm thực thi. Một lượt điều phối:

1. Nâng cấp các thẻ đã sẵn sàng về phụ thuộc.
2. Ghi siêu dữ liệu điều phối vào các thẻ sẵn sàng.
3. Chặn các quyền nhận việc đã hết hạn hoặc các lượt chạy quá thời gian.
4. Đánh dấu các thẻ phân loại nhanh được cấu hình theo bảng là ứng viên điều phối.
5. Nhận một lô nhỏ các thẻ sẵn sàng và bắt đầu lượt chạy worker thông qua
   môi trường chạy tác nhân con của Gateway.

Worker nhận ngữ cảnh thẻ có giới hạn cùng mã thông báo nhận việc cần thiết để gửi Heartbeat,
hoàn tất hoặc chặn thẻ thông qua các công cụ Workboard.

### Lựa chọn worker

Theo mặc định, mỗi lượt bắt đầu **tối đa 3 worker**. Các thẻ sẵn sàng được sắp xếp theo
độ ưu tiên, sau đó là vị trí, rồi đến thời điểm tạo. Một lượt chỉ bắt đầu một thẻ cho mỗi
chủ sở hữu/tác nhân và bỏ qua các chủ sở hữu đã có công việc đang chạy hoặc đang được xem xét trên
bảng. Các thẻ đã lưu trữ, thẻ có quyền nhận việc đang hoạt động và thẻ không ở trạng thái `ready`
không bao giờ được chọn để khởi động worker (chúng vẫn có thể chịu tác động từ
phía dữ liệu của quá trình điều phối: dọn dẹp quyền nhận việc quá hạn, nâng cấp phụ thuộc, dọn dẹp
quá thời gian).

Khóa phiên mang tính xác định theo từng bảng/thẻ, vì vậy các lần điều phối lặp lại sẽ định tuyến
trở lại cùng một luồng worker thay vì tạo các phiên không liên quan:

- Thẻ đã được giao: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Thẻ chưa được giao: `subagent:workboard-<boardId>-<cardId>` (Gateway phân giải
  tác nhân mặc định đã cấu hình)

Nếu không thể khởi động worker sau khi thẻ đã được nhận, Workboard sẽ chặn
thẻ, xóa quyền nhận việc, ghi lại lỗi khởi động lượt chạy và thêm một dòng nhật ký
worker — hiển thị trong bảng điều khiển, JSON của CLI, công cụ tác nhân và phần
chẩn đoán thẻ.

### Điểm vào

- Thao tác điều phối trên bảng điều khiển
- `openclaw workboard dispatch`
- `/workboard dispatch` trên một kênh hỗ trợ lệnh

Cả ba đều sử dụng môi trường chạy tác nhân con của Gateway khi Gateway khả dụng. CLI
có một phương án dự phòng dành cho người vận hành: nếu lời gọi Gateway thất bại với lỗi
kết nối/không khả dụng (hoặc lỗi `unknown method` đối với các
Gateway cũ hơn), đồng thời không áp dụng đích `--url`/`--token` tường minh và không có Gateway
từ xa đã cấu hình (`OPENCLAW_GATEWAY_URL` hoặc `gateway.mode: remote`), CLI sẽ chạy
điều phối chỉ dành cho dữ liệu trên trạng thái SQLite cục bộ — có thể nâng cấp các phụ thuộc,
dọn dẹp quyền nhận việc quá hạn và chặn các lượt chạy quá thời gian, nhưng không thể khởi động worker. Các lỗi xác thực,
quyền và xác thực dữ liệu từ một Gateway có thể truy cập không được coi là
không khả dụng; chúng được hiển thị dưới dạng lỗi lệnh, tương tự mọi lỗi Gateway
khi đã cung cấp đích `--url`/`--token` tường minh.

Siêu dữ liệu bảng có thể đặt `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` và `orchestratorProfile`. OpenClaw ghi lại ý định này và
hiển thị nó trong ngữ cảnh worker; quá trình đặc tả/phân tách thực tế vẫn chạy
thông qua các công cụ Workboard thông thường.

## CLI và lệnh gạch chéo

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Đầu ra văn bản của `list` mặc định ẩn các thẻ đã lưu trữ (`--include-archived`
ghi đè hành vi này); `--json` luôn bao gồm các thẻ đã lưu trữ, phù hợp với hợp đồng
thẻ đầy đủ được các tập lệnh hiện có sử dụng. `show` chấp nhận tiền tố mã định danh không mơ hồ.
`list`, `create` và `show` luôn đọc/ghi trực tiếp trạng thái Plugin cục bộ.
Chỉ `dispatch` gọi Gateway đang chạy, với phương án dự phòng được mô tả ở trên.

Xem [CLI Workboard](/vi/cli/workboard) để biết đầy đủ các cờ, đầu ra JSON, hành vi dự phòng
của Gateway, cách xử lý tiền tố mã định danh, quy tắc lựa chọn khi điều phối và
cách khắc phục sự cố.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
và `/workboard dispatch` phản ánh tương ứng CLI. Liệt kê và hiển thị là các thao tác đọc
dành cho mọi người gửi lệnh được ủy quyền. Tạo và điều phối yêu cầu trạng thái chủ sở hữu trên
các bề mặt trò chuyện, hoặc một máy khách Gateway có `operator.write`/`operator.admin`.

## Đồng bộ vòng đời phiên

Các thẻ có thể liên kết với một phiên bảng điều khiển hiện có hoặc một phiên được tạo khi bạn bắt đầu công việc từ thẻ. Các thẻ đã liên kết hiển thị trực tiếp vòng đời của phiên: đang chạy, cũ, đã liên kết nhưng không hoạt động, hoàn tất, thất bại hoặc bị thiếu. Bạn cũng có thể lấy một phiên hiện có từ tab Phiên bằng **Thêm vào Bảng công việc**; thẻ sẽ liên kết với phiên đó, dùng nhãn phiên hoặc lời nhắc gần đây của người dùng làm tiêu đề, đồng thời điền sẵn ghi chú từ lời nhắc gần đây của người dùng cùng với phản hồi mới nhất của trợ lý nếu có.

Nếu phiên đã liên kết bị mất, thẻ vẫn giữ liên kết để cung cấp ngữ cảnh và tiếp tục cung cấp các điều khiển bắt đầu nhằm khởi động lại trong một phiên mới. Nếu một phiên đang hoạt động đã liên kết ngừng báo cáo hoạt động gần đây, Bảng công việc đánh dấu thẻ là `stale` và lưu trạng thái đó dưới dạng siêu dữ liệu cho đến khi vòng đời xóa trạng thái này.

Khi thẻ đang ở trạng thái công việc hoạt động, Bảng công việc sẽ theo dõi phiên đã liên kết:

| Trạng thái phiên đã liên kết          | Trạng thái thẻ |
| ------------------------------------- | -------------- |
| đang hoạt động                        | `running`      |
| đã hoàn tất                           | `review`       |
| thất bại, bị dừng, hết thời gian hoặc bị hủy bỏ | `blocked` |

**Trạng thái xem xét thủ công được ưu tiên.** Việc chuyển thẻ sang `review`, `blocked` hoặc `done` sẽ dừng đồng bộ hóa tự động cho thẻ đó cho đến khi bạn chuyển thẻ trở lại `todo` hoặc `running`.

Việc bắt đầu một thẻ sử dụng các phiên Gateway thông thường; Bảng công việc chỉ lưu siêu dữ liệu và liên kết của thẻ. Bản chép lại cuộc trò chuyện, lựa chọn mô hình và vòng đời lần chạy vẫn do hệ thống phiên thông thường quản lý. Sử dụng **Dừng** trên một thẻ đang hoạt động đã liên kết để hủy bỏ lần chạy hiện tại — Bảng công việc đánh dấu thẻ đó là `blocked` để thẻ vẫn hiển thị cho việc xử lý tiếp theo.

Các thẻ mới có thể bắt đầu từ các mẫu Bảng công việc (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). Các mẫu điền sẵn tiêu đề, ghi chú, nhãn và mức ưu tiên; mã định danh mẫu được lưu dưới dạng siêu dữ liệu của thẻ.

## Quy trình làm việc trên bảng điều khiển

1. Mở tab Bảng công việc trong Giao diện điều khiển.
2. Tạo một thẻ với tiêu đề, ghi chú, mức ưu tiên, nhãn, tác nhân tùy chọn và phiên liên kết tùy chọn — hoặc mở Phiên và chọn **Thêm vào Bảng công việc** cho một phiên hiện có.
3. Kéo thẻ giữa các cột hoặc đặt tiêu điểm vào điều khiển trạng thái thu gọn của thẻ và sử dụng trình đơn hoặc ArrowLeft/ArrowRight.
4. Bắt đầu công việc từ thẻ để tạo hoặc tái sử dụng một phiên bảng điều khiển.
5. Mở phiên đã liên kết từ thẻ trong khi tác nhân làm việc.
6. Để đồng bộ hóa vòng đời chuyển công việc đang chạy sang `review`/`blocked`, sau đó tự chuyển thẻ sang `done` khi đã được chấp nhận.

## Chẩn đoán

Thông tin chẩn đoán được tính toán từ siêu dữ liệu thẻ cục bộ. Các kiểm tra tích hợp sẵn sẽ gắn cờ:

| Loại                        | Điều kiện                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Thẻ `todo`/`backlog`/`ready` đã được giao nhưng không được cập nhật trong hơn 1 giờ. |
| `running_without_heartbeat` | Thẻ `running` không có Heartbeat nhận việc hoặc cập nhật thực thi trong hơn 20 phút. |
| `blocked_too_long`          | Thẻ `blocked` không được cập nhật trong hơn 24 giờ. |
| `repeated_failures`         | Số lần thất bại được theo dõi của thẻ đạt từ 2 trở lên. |
| `missing_proof`             | Thẻ `done` không có bằng chứng, hiện vật hoặc tệp đính kèm. |
| `orphaned_session`          | Thẻ `running` có `sessionKey` nhưng không có siêu dữ liệu `execution`. |

## Quyền

Các phương thức RPC của Gateway nằm trong `workboard.*`:

| Phạm vi         | Phương thức                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, liệt kê/lấy tệp đính kèm, đọc sự kiện thông báo, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, tạo/cập nhật/di chuyển/xóa/bình luận/liên kết/liên kết phần phụ thuộc/bằng chứng/hiện vật, thêm/xóa tệp đính kèm, nhật ký worker, vi phạm giao thức, nhận việc/Heartbeat/giải phóng/thăng cấp/giao lại/thu hồi/hoàn tất/chặn/bỏ chặn, `cards.dispatch`, `cards.bulk`, lưu trữ, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, đăng ký/xóa/chuyển tiếp thông báo |

Không có phương thức RPC nào yêu cầu `operator.admin`. Các trình duyệt được kết nối với quyền truy cập người vận hành chỉ đọc có thể xem bảng nhưng không thể thay đổi thẻ.

## Lưu trữ

Bảng công việc lưu dữ liệu lâu dài trong cơ sở dữ liệu SQLite quan hệ do Plugin sở hữu bên dưới thư mục trạng thái OpenClaw: bảng, thẻ, nhãn, sự kiện vòng đời, lần thử chạy, bình luận, liên kết phần phụ thuộc, bằng chứng, tham chiếu hiện vật, siêu dữ liệu và dữ liệu nhị phân của tệp đính kèm, chẩn đoán, thông báo, nhật ký worker, trạng thái giao thức và đăng ký đều nằm trong các bảng của Bảng công việc (không phải các mục khóa-giá trị của Plugin). Bản xuất thẻ giữ nguyên nội dung diễn giải của bảng mà không nhúng trực tiếp nội dung dữ liệu nhị phân của tệp đính kèm.

Các bản cài đặt đã sử dụng Bảng công việc trong bản phát hành `.28` có thể chạy `openclaw doctor --fix` để di chuyển các không gian tên trạng thái Plugin cũ đã phát hành (`workboard.cards`, `workboard.boards`, `workboard.notify` và `workboard.attachments` nếu có) sang cơ sở dữ liệu quan hệ.

## Khắc phục sự cố

**Tab cho biết Bảng công việc không khả dụng**

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu `plugins.allow` đã được cấu hình, hãy thêm `workboard` vào đó. Nếu `plugins.deny` chứa `workboard`, hãy xóa mục này trước khi bật Plugin.

**Không thể lưu thẻ**

Xác nhận kết nối trình duyệt có quyền truy cập `operator.write`. Các phiên người vận hành chỉ đọc có thể liệt kê thẻ nhưng không thể tạo, chỉnh sửa, di chuyển hoặc xóa chúng.

**Việc bắt đầu một thẻ không mở đúng phiên dự kiến**

Kiểm tra mã định danh tác nhân và phiên đã liên kết của thẻ, sau đó mở Phiên hoặc Trò chuyện để kiểm tra trạng thái chạy thực tế.

**Việc điều phối không khởi động worker**

Xác nhận có ít nhất một thẻ `ready` không có lượt nhận việc đang hoạt động:

```bash
openclaw workboard list --status ready
```

Nếu CLI báo cáo điều phối chỉ dữ liệu, hãy khởi động hoặc khởi động lại Gateway rồi thử lại — điều phối chỉ dữ liệu cập nhật trạng thái bảng cục bộ nhưng không thể bắt đầu các lần chạy worker của tác nhân con. Thẻ cũng có thể bị bỏ qua khi một thẻ khác của cùng chủ sở hữu hoặc tác nhân đang chạy hoặc đang chờ xem xét; hãy hoàn tất, chặn hoặc giải phóng công việc đang hoạt động đó trước khi điều phối thêm công việc cho cùng chủ sở hữu.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui)
- [CLI Bảng công việc](/vi/cli/workboard)
- [Plugin](/vi/tools/plugin)
- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Phiên](/vi/concepts/session)
