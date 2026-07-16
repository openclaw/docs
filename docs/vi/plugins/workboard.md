---
read_when:
    - Bạn muốn một bảng công việc kiểu Kanban trong giao diện điều khiển
    - Bạn đang bật hoặc tắt plugin Workboard đi kèm
    - Bạn muốn theo dõi công việc đã lên kế hoạch của tác tử mà không cần trình quản lý dự án bên ngoài
summary: Bảng công việc trên trang tổng quan tùy chọn dành cho các thẻ do agent sở hữu và việc bàn giao phiên làm việc
title: Plugin bảng công việc
x-i18n:
    generated_at: "2026-07-16T14:52:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard thêm một bảng kiểu Kanban tùy chọn vào
[Control UI](/vi/web/control-ui): các thẻ công việc có kích thước phù hợp với agent, khả năng giao cho agent,
và liên kết trở lại tác vụ, lượt chạy và phiên dashboard của thẻ.

Workboard được thiết kế nhỏ gọn: nó theo dõi công việc vận hành cục bộ cho một
OpenClaw Gateway. Nó không thay thế GitHub Issues, Linear, Jira hoặc
các hệ thống quản lý dự án nhóm khác.

## Bật Workboard

Workboard được đóng gói sẵn nhưng mặc định bị tắt:

1. Mở **Plugins** trong Control UI hoặc dùng `/settings/plugins` tương ứng với
   đường dẫn cơ sở Control UI đã cấu hình. Ví dụ, đường dẫn cơ sở `/openclaw`
   sử dụng `/openclaw/settings/plugins`.
2. Tìm **Workboard** và chọn **Enable**. Vì Workboard được tích hợp cùng
   OpenClaw nên không cần thao tác **Install**.
3. Nếu UI thông báo cần khởi động lại, hãy khởi động lại Gateway.

Tab Workboard xuất hiện trong thanh điều hướng dashboard sau khi runtime của plugin tải xong.
Khi Workboard bị tắt, tab này không xuất hiện trong thanh điều hướng. Nếu mở trực tiếp
tuyến `/workboard` khi plugin bị tắt hoặc bị chặn bởi
`plugins.allow`/`plugins.deny`, giao diện sẽ hiển thị trạng thái plugin không khả dụng thay vì dữ liệu
thẻ.

Quy trình CLI tương đương là:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Cấu hình

Workboard không có cấu hình dành riêng cho plugin. Bật/tắt Workboard bằng mục
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

| Trường      | Giá trị                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | chuỗi có định dạng tự do                                                                                      |
| `agentId`   | agent được giao, không bắt buộc                                                                                |
| tham chiếu được liên kết | tác vụ, lượt chạy, phiên hoặc URL nguồn, không bắt buộc                                                   |
| `execution` | siêu dữ liệu không bắt buộc cho lượt chạy Codex/Claude được bắt đầu từ thẻ (công cụ, chế độ, mô hình, phiên, mã lượt chạy, trạng thái) |

Các thẻ cũng chứa siêu dữ liệu cô đọng về lần thử, bình luận, liên kết, bằng chứng,
tạo phẩm, cài đặt tự động hóa, tệp đính kèm, nhật ký worker, trạng thái giao thức
worker, yêu cầu quyền xử lý, chẩn đoán, thông báo, mã mẫu, trạng thái lưu trữ và
phát hiện phiên cũ, cùng với danh sách sự kiện gần đây (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Siêu dữ liệu này cho phép
người vận hành xem thẻ đã di chuyển qua bảng như thế nào mà không cần mở
phiên được liên kết; đây là ngữ cảnh vận hành cục bộ, không thay thế bản ghi
phiên hoặc lịch sử issue trên GitHub.

Plugin và Control UI sử dụng chung một hợp đồng thẻ Workboard. Vì vậy, các lần làm mới dashboard
sẽ giữ nguyên nguồn gốc và thẩm quyền của không gian làm việc, trạng thái yêu cầu quyền xử lý, các thao tác
chẩn đoán và số thứ tự thông báo thay vì ánh xạ thành một bản sao thẻ nhỏ hơn
chỉ dành cho UI. Các loại chẩn đoán, mức độ nghiêm trọng của chẩn đoán và
loại thông báo chưa xác định sẽ bị bỏ qua cho đến khi cả hai bề mặt hỗ trợ chúng; chúng không bao giờ
bị ghi lại thành một trạng thái hợp lệ khác.

Dashboard đang mở cập nhật từ các sự kiện vô hiệu hóa `plugin.workboard.changed`. Mỗi
sự kiện chỉ chứa một epoch và revision của kho lưu trữ; sau đó UI đọc lại các thẻ chuẩn
thông qua RPC `operator.read` thông thường. Nhiều revision được hợp nhất thành
một lần đọc tiếp theo. Workboard trì hoãn lần đọc đó khi một thẻ đang được kéo,
chỉnh sửa hoặc ghi, rồi tiếp tục sau khi tương tác cục bộ hoàn tất. Khi
kết nối lại, hệ thống luôn thực hiện tải lại dữ liệu chuẩn. Không có cơ chế thăm dò toàn bộ thẻ
định kỳ và **Refresh** vẫn khả dụng để khôi phục thủ công.

Khi có nhiều hơn một bảng, thanh công cụ bao gồm bộ lọc **Board** dựa trên
siêu dữ liệu bảng được lưu bền vững thay vì chỉ dựa trên các thẻ hiện đang hiển thị. Do đó,
các bảng trống và đã lưu trữ vẫn có thể được chọn. Các thẻ không có mã
bảng rõ ràng thuộc về bảng `default` chuẩn. Bảng đã chọn được lưu
trong tham số truy vấn `?board=`, vì vậy URL Workboard đã lọc có thể được đánh dấu trang
hoặc chia sẻ; chọn **All boards** sẽ xóa tham số này.

Các thẻ được lưu trong trạng thái Gateway riêng của plugin và di chuyển cùng phần còn lại của
trạng thái OpenClaw thuộc Gateway đó (xem [Lưu trữ](#storage)).

## Bắt đầu công việc từ một thẻ

Các thẻ chưa liên kết có thể trực tiếp bắt đầu công việc:

- **Run Codex** / **Run Claude** bắt đầu một lượt chạy agent được theo dõi bằng tác vụ với
  công cụ được chỉ định rõ ràng, gửi prompt của thẻ và đánh dấu thẻ là `running`. Các lượt chạy Codex
  sử dụng `openai/gpt-5.6-sol`; các lượt chạy Claude sử dụng `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** tạo một phiên dashboard được liên kết mà không
  gửi prompt của thẻ hoặc di chuyển thẻ, dành cho công việc thủ công vẫn
  được gắn với bảng.

Các lần bắt đầu tự động sử dụng đường dẫn lượt chạy agent được theo dõi bằng tác vụ của Gateway (agent
và mô hình mặc định, trừ khi Codex/Claude được chọn rõ ràng); sau đó Workboard liên kết
tác vụ, mã lượt chạy và khóa phiên thu được trở lại thẻ. Mỗi lượt thực thi được liên kết
cũng ghi lại một bản tóm tắt lần thử (công cụ, chế độ, mô hình, mã lượt chạy,
dấu thời gian, trạng thái, số lần thất bại liên tiếp) để các lỗi lặp lại luôn hiển thị.

Dashboard làm mới trạng thái tác vụ từ sổ cái tác vụ của Gateway, đối chiếu
tác vụ với thẻ theo mã tác vụ, mã lượt chạy hoặc khóa phiên được liên kết. Một tác vụ
đang xếp hàng/đang chạy duy trì vòng đời hoạt động của thẻ; một tác vụ đã hoàn tất,
thất bại, hết thời gian chờ hoặc bị hủy sẽ chuyển thẻ về phía `review` hoặc `blocked` theo cùng quy tắc
đồng bộ như các phiên được liên kết (xem [Đồng bộ vòng đời phiên](#session-lifecycle-sync)).

## Công cụ agent

| Công cụ                                                                                                                                           | Mục đích                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Liệt kê các thẻ thu gọn cùng trạng thái yêu cầu quyền sở hữu/chẩn đoán; có thể lọc theo bảng.                                                                                             |
| `workboard_read`                                                                                                                                 | Trả về một thẻ cùng ngữ cảnh worker có giới hạn (ghi chú, lần thử, bình luận, liên kết, bằng chứng, hiện vật, kết quả của thẻ cha, công việc gần đây của người được giao, chẩn đoán đang hoạt động). |
| `workboard_create`                                                                                                                               | Tạo thẻ với các thẻ cha, tenant, kỹ năng, bảng, siêu dữ liệu không gian làm việc, khóa idempotency, giới hạn thời gian chạy và ngân sách thử lại tùy chọn.                                  |
| `workboard_link`                                                                                                                                 | Liên kết thẻ cha với thẻ con. Thẻ con vẫn ở trạng thái `todo` cho đến khi mọi thẻ cha đạt `done`, sau đó quá trình thăng cấp khi điều phối sẽ chuyển chúng sang `ready`. |
| `workboard_claim`                                                                                                                                | Yêu cầu quyền sở hữu thẻ cho agent gọi; chuyển `backlog`/`todo`/`ready` sang `running`.                                                          |
| `workboard_heartbeat`                                                                                                                            | Làm mới Heartbeat của yêu cầu quyền sở hữu trong một lượt chạy dài hơn.                                                                                                                    |
| `workboard_release`                                                                                                                              | Giải phóng yêu cầu quyền sở hữu sau khi hoàn tất, tạm dừng hoặc bàn giao; có thể chuyển thẻ sang trạng thái tiếp theo.                                                                     |
| `workboard_complete` / `workboard_block`                                                                                                         | Các công cụ vòng đời có cấu trúc dành cho bản tóm tắt cuối cùng, bằng chứng, hiện vật và bản kê khai thẻ đã tạo (phải tham chiếu các thẻ được liên kết ngược về thẻ đã hoàn tất) hoặc lý do bị chặn. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Lưu các tệp đính kèm nhỏ của thẻ trong trạng thái SQLite của Plugin, lập chỉ mục trên thẻ và hiển thị trong ngữ cảnh worker.                                                              |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Ghi lại các dòng nhật ký worker và chặn thẻ khi worker tự động dừng mà không gọi `workboard_complete`/`workboard_block`.                                                                   |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Quản lý siêu dữ liệu bảng được lưu bền vững (tên hiển thị, mô tả, trạng thái lưu trữ, không gian làm việc mặc định).                                                                       |
| `workboard_runs`                                                                                                                                 | Trả về lịch sử các lần thử chạy được lưu bền vững của một thẻ.                                                                                                                            |
| `workboard_specify`                                                                                                                              | Chuyển một thẻ phân loại/backlog sơ bộ thành thẻ `todo` đã được làm rõ; ghi lại bản tóm tắt đặc tả trên thẻ.                                                                  |
| `workboard_decompose`                                                                                                                            | Tách một thẻ điều phối cha thành các thẻ con được liên kết, kế thừa siêu dữ liệu bảng/tenant; có thể hoàn tất thẻ cha bằng bản kê khai thẻ đã tạo.                                        |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Quản lý đăng ký nhận thông báo. Việc đọc sự kiện an toàn khi phát lại; `advance` di chuyển con trỏ bền vững để bên gọi tiếp tục mà không bỏ sót hoặc đọc hai lần các sự kiện thẻ đã hoàn tất/thất bại/cũ. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Kiểm tra không gian tên của bảng và số liệu thống kê hàng đợi.                                                                                                                            |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Khôi phục hoặc bàn giao công việc bị kẹt.                                                                                                                                                 |
| `workboard_comment` / `workboard_proof`                                                                                                          | Thêm ghi chú bàn giao hoặc đính kèm tham chiếu đến bằng chứng/hiện vật.                                                                                                                   |
| `workboard_unblock`                                                                                                                              | Chuyển công việc bị chặn trở lại `todo`.                                                                                                                                      |
| `workboard_move`                                                                                                                                 | Chuyển thẻ sang trạng thái khác; thẻ đã được yêu cầu quyền sở hữu đòi hỏi phạm vi yêu cầu quyền sở hữu của agent gọi.                                                                     |
| `workboard_dispatch`                                                                                                                             | Thúc đẩy việc thăng cấp phần phụ thuộc hoặc dọn dẹp yêu cầu quyền sở hữu cũ mà không khởi chạy worker; việc khởi chạy worker sử dụng Gateway hoặc cơ chế điều phối bằng lệnh gạch chéo.   |

Các thẻ đã được yêu cầu quyền sở hữu sẽ từ chối thao tác sửa đổi bằng công cụ agent từ các agent khác, trừ khi bên gọi
nắm giữ token yêu cầu quyền sở hữu do `workboard_claim` trả về. Mọi thẻ được trả về bởi
công cụ agent hoặc lệnh gọi RPC của Gateway đều che `metadata.claim.token` thành `[redacted]`
(bản thân token chỉ được trả về một lần ở cấp cao nhất và chỉ từ `workboard_claim`),
để người vận hành bảng điều khiển và các agent khác có thể kiểm tra trạng thái yêu cầu quyền sở hữu mà không bao giờ
thấy token có thể sử dụng. Quá trình khôi phục đi qua
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, các thao tác này không
yêu cầu token.

## Điều phối

Việc điều phối diễn ra cục bộ trong Gateway: nó không tạo các tiến trình hệ điều hành tùy ý. Các phiên
subagent OpenClaw thông thường vẫn chịu trách nhiệm thực thi. Một lượt điều phối:

1. Thăng cấp các thẻ có phần phụ thuộc đã sẵn sàng.
2. Ghi siêu dữ liệu điều phối trên các thẻ đã sẵn sàng.
3. Chặn các yêu cầu quyền sở hữu đã hết hạn hoặc các lượt chạy quá thời gian.
4. Đánh dấu các thẻ phân loại do bảng cấu hình làm ứng viên điều phối.
5. Yêu cầu quyền sở hữu một lô nhỏ các thẻ đã sẵn sàng và bắt đầu các lượt chạy worker thông qua
   runtime subagent của Gateway.

Worker nhận ngữ cảnh thẻ có giới hạn cùng token yêu cầu quyền sở hữu cần thiết để gửi Heartbeat,
hoàn tất hoặc chặn thẻ thông qua các công cụ Workboard.

Đường dẫn không gian làm việc tuân theo quyền hệ thống tệp hiện có của bên gọi. Các máy khách Gateway
có `operator.write` có thể sử dụng không gian làm việc của agent đã cấu hình;
máy khách `operator.admin` có thể sử dụng các bản checkout khác trên máy chủ. Công cụ agent trong sandbox sử dụng
quyền truy cập không gian làm việc của sandbox, còn các công cụ chỉ dành cho không gian làm việc không nằm trong sandbox sử dụng
thư mục gốc không gian làm việc đã cấu hình. Workboard ghi lại quyền đó khi một không gian làm việc được
gán và lấy giao của quyền này với quyền hiện tại của bên gọi một lần nữa khi điều phối,
do đó một thẻ được lưu bền vững không thể mở rộng quyền truy cập của bên gọi sau này. Các thẻ cũ có
không gian làm việc máy chủ được chỉ định rõ ràng nhưng không có quyền đã ghi nhận phải được lưu lại
không gian làm việc đó trước khi điều phối toàn máy chủ; các thẻ không có đường dẫn máy chủ sẽ tiếp nhận
quyền của bên gọi hiện tại khi được điều phối lần đầu.

Điều phối gắn với không gian làm việc chỉ chấp nhận một thư mục hoặc bản checkout Git khi
thư mục gốc kho lưu trữ của nó khớp chính xác với không gian làm việc của agent đích. Yêu cầu worktree
được thu hẹp vào thư mục đó và được lưu bền vững dưới dạng không gian làm việc thư mục, vì vậy
máy chủ không hiện thực hóa bản checkout hoặc thực thi mã thiết lập kho lưu trữ. Worker
đích phải sử dụng sandbox Docker có thể ghi, không dùng chung cho đúng không gian làm việc
đó, không có thực thi nâng quyền, ghi đè thực thi host/node được lưu bền vững hoặc
các công cụ Plugin và MCP chưa được phân loại. Workboard liệt kê các công cụ đã đăng ký
thay vì tin tưởng tiền tố `workboard_*`, và quá trình điều phối từ chối container Docker đang hoạt động
có hàm băm mount/cấu hình thực tế đã cũ. Quá trình điều phối báo cáo
chính sách đích không tương thích thay vì khởi động một worker ít bị giới hạn hơn.
Điều phối toàn máy chủ có thể nhắm đến các bản checkout cục bộ khác và duy trì quy trình thiết lập
worktree được quản lý thông thường.

Quyền không gian làm việc không tạo ra mô hình quyền vòng đời thẻ thứ hai.
Các bên gọi được phép sửa đổi thẻ Workboard có thể tự chuyển chúng qua cùng các
trạng thái trên mọi bề mặt; quyền truy cập không gian làm việc chỉ đọc chỉ ngăn việc
điều phối worker cần quyền ghi.

### Lựa chọn worker

Mỗi lượt khởi động **tối đa 3 worker theo mặc định**. Các thẻ đã sẵn sàng được sắp xếp theo
mức độ ưu tiên, sau đó là vị trí, rồi đến thời điểm tạo. Mỗi lượt chỉ khởi động một thẻ cho mỗi
chủ sở hữu/agent và bỏ qua các chủ sở hữu đã có công việc đang chạy hoặc đang được đánh giá trên
bảng. Các thẻ đã lưu trữ, thẻ có yêu cầu quyền sở hữu đang hoạt động và thẻ không ở trạng thái `ready`
không bao giờ được chọn để khởi động worker (chúng vẫn có thể chịu ảnh hưởng từ
phía dữ liệu của quá trình điều phối: dọn dẹp yêu cầu quyền sở hữu cũ, thăng cấp phần phụ thuộc, dọn dẹp
quá thời gian).

Khóa phiên có tính xác định theo từng bảng/thẻ, vì vậy các lần điều phối lặp lại sẽ định tuyến
trở lại cùng một làn worker thay vì tạo các phiên không liên quan:

- Thẻ đã được giao: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Thẻ chưa được giao: `subagent:workboard-<boardId>-<cardId>` (Gateway phân giải
  agent mặc định đã cấu hình)

Nếu không thể khởi động worker sau khi một thẻ đã được yêu cầu quyền sở hữu, Workboard sẽ chặn
thẻ, xóa yêu cầu quyền sở hữu, ghi lại lỗi khởi động lượt chạy và nối thêm một dòng
nhật ký worker — hiển thị trong bảng điều khiển, JSON của CLI, công cụ agent và phần
chẩn đoán thẻ.

### Điểm vào

- Hành động điều phối trên bảng điều khiển
- `openclaw workboard dispatch`
- `/workboard dispatch` trên một kênh hỗ trợ lệnh

Cả ba đều sử dụng môi trường thực thi tác tử con của Gateway khi Gateway khả dụng. CLI
có một phương án dự phòng dành cho người vận hành: nếu lệnh gọi Gateway thất bại với lỗi
kết nối/không khả dụng (hoặc lỗi `unknown method` đối với các
Gateway cũ hơn), đồng thời không áp dụng đích `--url`/`--token` rõ ràng nào và không có Gateway
từ xa nào được cấu hình (`OPENCLAW_GATEWAY_URL` hoặc `gateway.mode: remote`), CLI sẽ chạy
điều phối chỉ dữ liệu dựa trên trạng thái SQLite cục bộ — có thể thúc đẩy các phần phụ thuộc,
dọn dẹp các yêu cầu quyền sở hữu đã cũ và chặn các lượt chạy hết thời gian chờ, nhưng không thể khởi động worker. Các lỗi xác thực,
quyền và xác thực dữ liệu từ một Gateway có thể truy cập không được coi là
không khả dụng; chúng được hiển thị dưới dạng lỗi lệnh, tương tự như mọi lỗi Gateway
khi đã cung cấp đích `--url`/`--token` rõ ràng.

Siêu dữ liệu bảng có thể đặt `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` và `orchestratorProfile`. OpenClaw ghi lại ý định này và
hiển thị nó trong ngữ cảnh worker; quá trình đặc tả/phân rã thực tế vẫn chạy
thông qua các công cụ Workboard thông thường.

## CLI và lệnh dấu gạch chéo

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Đầu ra văn bản `list` mặc định ẩn các thẻ đã lưu trữ (`--include-archived`
ghi đè hành vi này); `--json` luôn bao gồm các thẻ đã lưu trữ, phù hợp với hợp đồng
thẻ đầy đủ mà các tập lệnh hiện có sử dụng. `show` và `move` chấp nhận tiền tố id
không mơ hồ. `list`, `create`, `show` và `move` luôn đọc/ghi trực tiếp
trạng thái Plugin cục bộ. Chỉ `dispatch` gọi Gateway đang chạy, với phương án dự phòng
được mô tả ở trên.

Xem [CLI Workboard](/vi/cli/workboard) để biết đầy đủ các cờ, đầu ra JSON, hành vi dự phòng
của Gateway, cách xử lý tiền tố id, quy tắc lựa chọn điều phối và
cách khắc phục sự cố.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` và `/workboard dispatch` phản ánh
CLI. Liệt kê và hiển thị là các thao tác đọc dành cho mọi người gửi lệnh được ủy quyền.
Tạo, di chuyển và điều phối yêu cầu trạng thái chủ sở hữu trên các bề mặt trò chuyện, hoặc một máy khách Gateway
có `operator.write`/`operator.admin`. Các thao tác di chuyển thủ công của người vận hành sử dụng
cùng hành vi ghi đè yêu cầu quyền sở hữu như thao tác kéo và thả trên bảng điều khiển. Quyền truy cập cây làm việc của chúng
vẫn tuân theo cùng ranh giới không gian làm việc được mô tả ở trên.

## Đồng bộ vòng đời phiên

Thẻ có thể liên kết với một phiên bảng điều khiển hiện có hoặc một phiên được tạo khi bạn
bắt đầu công việc từ thẻ. Các thẻ được liên kết hiển thị trực tiếp vòng đời phiên:
đang chạy, cũ, đã liên kết nhưng không hoạt động, hoàn tất, thất bại hoặc bị thiếu. Bạn cũng có thể ghi nhận một
phiên hiện có từ thẻ Sessions bằng **Add to Workboard**; thẻ
liên kết với phiên đó, sử dụng nhãn phiên hoặc lời nhắc gần đây của người dùng làm tiêu đề,
đồng thời khởi tạo ghi chú từ lời nhắc gần đây của người dùng cùng với phản hồi mới nhất của trợ lý
khi có.

Nếu phiên được liên kết bị thiếu, thẻ vẫn giữ liên kết để cung cấp ngữ cảnh và
vẫn cung cấp các nút điều khiển bắt đầu để khởi động lại trong một phiên mới. Nếu một
phiên được liên kết đang hoạt động ngừng báo cáo hoạt động gần đây, Workboard đánh dấu thẻ là
`stale` và lưu trạng thái đó dưới dạng siêu dữ liệu cho đến khi vòng đời xóa nó.

Khi một thẻ đang ở trạng thái công việc hoạt động, Workboard theo dõi phiên được liên kết:

| Trạng thái phiên được liên kết         | Trạng thái thẻ |
| ------------------------------------- | ----------- |
| đang hoạt động                        | `running`   |
| đã hoàn tất                           | `review`    |
| thất bại, bị kết thúc, hết thời gian chờ hoặc bị hủy | `blocked`   |

**Trạng thái xem xét thủ công được ưu tiên.** Việc di chuyển một thẻ sang `review`, `blocked` hoặc `done`
sẽ dừng tự động đồng bộ cho thẻ đó cho đến khi bạn chuyển nó trở lại `todo` hoặc `running`.

Việc bắt đầu một thẻ sử dụng các phiên Gateway thông thường; Workboard chỉ lưu trữ siêu dữ liệu
và liên kết của thẻ. Bản chép lại cuộc hội thoại, lựa chọn mô hình và vòng đời
lượt chạy vẫn do hệ thống phiên thông thường quản lý. Sử dụng **Stop** trên một
thẻ được liên kết đang hoạt động để hủy lượt chạy hiện tại — Workboard đánh dấu thẻ đó là `blocked` để
thẻ vẫn hiển thị cho việc theo dõi tiếp theo.

Các thẻ mới có thể bắt đầu từ các mẫu Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Mẫu điền sẵn tiêu đề, ghi chú, nhãn và mức ưu tiên;
id mẫu được lưu dưới dạng siêu dữ liệu thẻ.

## Quy trình làm việc trên bảng điều khiển

1. Mở thẻ Workboard trong Control UI.
2. Tạo một thẻ với tiêu đề, ghi chú, mức ưu tiên, nhãn, tác tử tùy chọn và
   phiên được liên kết tùy chọn — hoặc mở Sessions và chọn **Add to Workboard**
   cho một phiên hiện có.
3. Kéo thẻ giữa các cột, hoặc đưa tiêu điểm vào bộ điều khiển trạng thái thu gọn của thẻ và sử dụng
   trình đơn hoặc ArrowLeft/ArrowRight. Trong khi kéo, thẻ nguồn sẽ mờ đi và
   các cột có thể thả sẽ có đường viền.
4. Bắt đầu công việc từ thẻ để tạo hoặc tái sử dụng một phiên bảng điều khiển.
5. Mở phiên được liên kết từ thẻ trong khi tác tử làm việc.
6. Để tính năng đồng bộ vòng đời chuyển công việc đang chạy sang `review`/`blocked`, sau đó tự
   chuyển thẻ sang `done` khi được chấp nhận.

## Chẩn đoán

Chẩn đoán được tính toán từ siêu dữ liệu thẻ cục bộ. Các kiểm tra tích hợp sẵn gắn cờ:

| Loại                        | Điều kiện                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Thẻ `todo`/`backlog`/`ready` đã được phân công nhưng không được cập nhật trong hơn 1 giờ.             |
| `running_without_heartbeat` | Thẻ `running` không có Heartbeat của yêu cầu quyền sở hữu hoặc bản cập nhật thực thi trong hơn 20 phút. |
| `blocked_too_long`          | Thẻ `blocked` không được cập nhật trong hơn 24 giờ.                                   |
| `repeated_failures`         | Số lần thất bại được theo dõi của thẻ đạt 2 trở lên.                                |
| `missing_proof`             | Thẻ `done` không có bằng chứng, sản phẩm đầu ra hoặc tệp đính kèm.                          |
| `orphaned_session`          | Thẻ `running` có `sessionKey` nhưng không có siêu dữ liệu `execution`.                |

## Quyền

Các phương thức RPC của Gateway nằm trong `workboard.*`:

| Phạm vi            | Phương thức                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, liệt kê/lấy tệp đính kèm, đọc sự kiện thông báo, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, tạo/cập nhật/di chuyển/xóa/bình luận/liên kết/linkDependency/bằng chứng/sản phẩm đầu ra, thêm/xóa tệp đính kèm, nhật ký worker, vi phạm giao thức, yêu cầu quyền sở hữu/Heartbeat/giải phóng/thúc đẩy/phân công lại/thu hồi/hoàn tất/chặn/bỏ chặn, `cards.dispatch`, `cards.bulk`, lưu trữ, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, đăng ký/xóa/chuyển tiếp thông báo |

Không phương thức RPC nào yêu cầu `operator.admin`. Các trình duyệt được kết nối với quyền truy cập
người vận hành chỉ đọc có thể kiểm tra bảng nhưng không thể sửa đổi thẻ. Phạm vi quản trị viên
mở rộng các đường dẫn máy chủ Workboard được chấp nhận; nó không thay đổi các phương thức khả dụng.

## Lưu trữ

Workboard lưu dữ liệu bền vững trong cơ sở dữ liệu SQLite quan hệ do Plugin sở hữu
nằm trong thư mục trạng thái OpenClaw: bảng, thẻ, nhãn, sự kiện vòng đời,
lần thử chạy, bình luận, liên kết phụ thuộc, bằng chứng, tham chiếu sản phẩm đầu ra,
siêu dữ liệu và blob của tệp đính kèm, chẩn đoán, thông báo, nhật ký worker,
trạng thái giao thức và đăng ký đều nằm trong các bảng Workboard (không phải
các mục khóa-giá trị của Plugin). Bản xuất thẻ giữ nguyên tường thuật của bảng
mà không nhúng nội dung blob của tệp đính kèm.

Các bản cài đặt đã sử dụng Workboard trong bản phát hành `.28` có thể chạy
`openclaw doctor --fix` để di chuyển các không gian tên trạng thái Plugin cũ đã được phát hành
(`workboard.cards`, `workboard.boards`, `workboard.notify` và, nếu có,
`workboard.attachments`) vào cơ sở dữ liệu quan hệ.

## Khắc phục sự cố

**Thẻ hiển thị Workboard không khả dụng**

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu `plugins.allow` được cấu hình, hãy thêm `workboard` vào đó. Nếu `plugins.deny`
chứa `workboard`, hãy xóa mục đó trước khi bật Plugin.

**Không lưu được thẻ**

Xác nhận kết nối trình duyệt có quyền truy cập `operator.write`. Các phiên người vận hành
chỉ đọc có thể liệt kê thẻ nhưng không thể tạo, chỉnh sửa, di chuyển hoặc xóa chúng.

**Việc bắt đầu một thẻ không mở phiên dự kiến**

Kiểm tra id tác tử và phiên được liên kết của thẻ, sau đó mở Sessions hoặc Chat để
kiểm tra trạng thái lượt chạy thực tế.

**Điều phối không khởi động worker**

Xác nhận có ít nhất một thẻ `ready` không có yêu cầu quyền sở hữu đang hoạt động:

```bash
openclaw workboard list --status ready
```

Nếu CLI báo cáo điều phối chỉ dữ liệu, hãy khởi động hoặc khởi động lại Gateway rồi
thử lại — điều phối chỉ dữ liệu cập nhật trạng thái bảng cục bộ nhưng không thể khởi động
các lượt chạy worker tác tử con. Thẻ cũng có thể bị bỏ qua khi một thẻ khác của
cùng chủ sở hữu hoặc tác tử đã đang chạy hoặc đang chờ xem xét; hãy hoàn tất,
chặn hoặc giải phóng công việc đang hoạt động đó trước khi điều phối thêm cho cùng
chủ sở hữu.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [CLI Workboard](/vi/cli/workboard)
- [Plugin](/vi/tools/plugin)
- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Phiên](/vi/concepts/session)
