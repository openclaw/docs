---
read_when:
    - Bạn muốn một bảng công việc kiểu Kanban trong giao diện điều khiển
    - Bạn đang bật hoặc tắt plugin Workboard đi kèm
    - Bạn muốn theo dõi công việc đã lên kế hoạch của agent mà không cần công cụ quản lý dự án bên ngoài
summary: Bảng công việc dashboard tùy chọn dành cho các thẻ do agent sở hữu và bàn giao phiên làm việc
title: Plugin bảng công việc
x-i18n:
    generated_at: "2026-07-19T17:09:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38f138584fed2d052ed45798c38a342fd9fe08eddf4fef9f73c52353f4b0ded2
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard bổ sung một bảng kiểu Kanban tùy chọn vào
[UI điều khiển](/vi/web/control-ui): các thẻ công việc có kích thước phù hợp với agent, khả năng phân công cho agent
và liên kết trở lại tác vụ, lượt chạy và phiên bảng điều khiển của thẻ.

Workboard được thiết kế nhỏ gọn: nó theo dõi công việc vận hành cục bộ cho một
OpenClaw Gateway. Nó không thay thế GitHub Issues, Linear, Jira hoặc
các hệ thống quản lý dự án nhóm khác.

## Bật Workboard

Workboard được đóng gói sẵn nhưng bị tắt theo mặc định:

1. Mở **Plugins** trong UI điều khiển hoặc sử dụng `/settings/plugins` tương ứng với
   đường dẫn cơ sở đã cấu hình của UI điều khiển. Ví dụ, đường dẫn cơ sở `/openclaw`
   sử dụng `/openclaw/settings/plugins`.
2. Tìm **Workboard** và chọn **Enable**. Vì Workboard được tích hợp trong
   OpenClaw nên không cần thao tác **Install**.
3. Nếu UI thông báo cần khởi động lại, hãy khởi động lại Gateway.

Thẻ Workboard xuất hiện trong thanh điều hướng của bảng điều khiển sau khi runtime của plugin tải xong.
Khi Workboard bị tắt, thẻ này vẫn bị ẩn khỏi thanh điều hướng. Việc mở trực tiếp
tuyến `/workboard` khi plugin bị tắt hoặc bị chặn bởi
`plugins.allow`/`plugins.deny` sẽ hiển thị trạng thái plugin không khả dụng thay vì dữ liệu
thẻ.

Quy trình CLI tương đương là:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Cấu hình

Workboard không có cấu hình dành riêng cho plugin. Bật/tắt nó bằng mục nhập
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

## Trường của thẻ

| Trường      | Giá trị                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | chuỗi văn bản tự do                                                                                           |
| `agentId`   | agent được phân công, không bắt buộc                                                                          |
| tham chiếu liên kết | tác vụ, lượt chạy, phiên hoặc URL nguồn, không bắt buộc                                                       |
| `execution` | siêu dữ liệu không bắt buộc cho lượt chạy Codex/Claude được bắt đầu từ thẻ (công cụ, chế độ, mô hình, phiên, mã lượt chạy, trạng thái) |

Các thẻ cũng chứa siêu dữ liệu cô đọng về các lần thử, bình luận, liên kết, bằng chứng,
thành phần tạo tác, cài đặt tự động hóa, tệp đính kèm, nhật ký worker, trạng thái giao thức
worker, quyền tiếp nhận, thông tin chẩn đoán, thông báo, mã mẫu, trạng thái lưu trữ và
khả năng phát hiện phiên cũ, cùng danh sách sự kiện gần đây (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Siêu dữ liệu này cho phép
người vận hành xem thẻ đã di chuyển qua bảng như thế nào mà không cần mở phiên
được liên kết; đây là ngữ cảnh vận hành cục bộ, không thay thế bản ghi
phiên hoặc lịch sử issue GitHub.

Plugin và UI điều khiển sử dụng chung một hợp đồng thẻ Workboard. Do đó, các lần làm mới bảng điều khiển
giữ nguyên nguồn gốc và thẩm quyền của không gian làm việc, trạng thái tiếp nhận, các thao tác
chẩn đoán và số thứ tự thông báo, thay vì tạo một bản sao thu nhỏ
chỉ dành cho UI của thẻ. Các loại chẩn đoán, mức độ nghiêm trọng của chẩn đoán và
loại thông báo chưa xác định sẽ bị bỏ qua cho đến khi cả hai bề mặt hỗ trợ chúng; chúng không bao giờ
bị viết lại thành một trạng thái hợp lệ khác.

Bảng điều khiển đang mở cập nhật từ các sự kiện vô hiệu hóa `plugin.workboard.changed`. Mỗi
sự kiện chỉ chứa epoch và bản sửa đổi của kho lưu trữ; sau đó UI đọc lại các thẻ chính tắc
thông qua RPC `operator.read` thông thường. Nhiều bản sửa đổi được hợp nhất thành
một lần đọc tiếp theo. Workboard trì hoãn lần đọc đó khi thẻ đang được kéo,
chỉnh sửa hoặc ghi, rồi tiếp tục sau khi tương tác cục bộ hoàn tất. Mỗi lần
kết nối lại luôn thực hiện tải lại dữ liệu chính tắc. Không có hoạt động thăm dò toàn bộ thẻ
định kỳ và **Refresh** vẫn khả dụng để khôi phục thủ công.

Khi có nhiều bảng, thanh công cụ bao gồm bộ lọc **Board** dựa trên
siêu dữ liệu bảng được duy trì, thay vì chỉ dựa trên các thẻ hiện đang hiển thị. Vì vậy, các bảng trống
và đã lưu trữ vẫn có thể được chọn. Các thẻ không có mã bảng rõ ràng
thuộc về bảng `default` chính tắc. Bảng được chọn được lưu
trong tham số truy vấn `?board=`, nên URL Workboard đã lọc có thể được đánh dấu
hoặc chia sẻ; chọn **All boards** sẽ xóa tham số này.

Các thẻ được lưu trữ trong trạng thái Gateway riêng của plugin và di chuyển cùng với phần còn lại của
trạng thái OpenClaw thuộc Gateway đó (xem [Lưu trữ](#storage)).

## Bắt đầu công việc từ một thẻ

Các thẻ chưa liên kết có thể bắt đầu công việc trực tiếp:

- **Run Codex** / **Run Claude** bắt đầu một lượt chạy agent được theo dõi bằng tác vụ với
  công cụ được chỉ định rõ ràng, gửi lời nhắc của thẻ và đánh dấu thẻ là `running`. Các lượt chạy Codex
  sử dụng `openai/gpt-5.6-sol`; các lượt chạy Claude sử dụng `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** tạo một phiên bảng điều khiển được liên kết mà không
  gửi lời nhắc của thẻ hoặc di chuyển thẻ, dành cho công việc thủ công vẫn được
  gắn với bảng.

Các lượt bắt đầu tự động sử dụng đường dẫn lượt chạy agent được Gateway theo dõi bằng tác vụ (agent
và mô hình mặc định, trừ khi Codex/Claude được chọn rõ ràng); sau đó Workboard liên kết
tác vụ, mã lượt chạy và khóa phiên thu được trở lại thẻ. Mỗi lượt thực thi
được liên kết cũng ghi lại phần tóm tắt lần thử (công cụ, chế độ, mô hình, mã lượt chạy,
dấu thời gian, trạng thái, số lần thất bại liên tiếp) để các lỗi lặp lại luôn hiển thị.

Bảng điều khiển làm mới trạng thái tác vụ từ sổ cái tác vụ của Gateway, đối chiếu
tác vụ với thẻ theo mã tác vụ, mã lượt chạy hoặc khóa phiên được liên kết. Một tác vụ
đang xếp hàng/đang chạy giữ cho vòng đời của thẻ hoạt động; một tác vụ đã hoàn tất, thất bại, hết thời gian chờ hoặc
bị hủy sẽ chuyển thẻ về phía `review` hoặc `blocked` theo cùng quy tắc đồng bộ
như các phiên được liên kết (xem [Đồng bộ vòng đời phiên](#session-lifecycle-sync)).

## Công cụ agent

| Công cụ                                                                                                                                             | Mục đích                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Liệt kê các thẻ thu gọn cùng trạng thái xác nhận/chẩn đoán; có thể lọc theo bảng.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Trả về một thẻ cùng ngữ cảnh giới hạn của worker (ghi chú, lần thử, bình luận, liên kết, bằng chứng, hiện vật, kết quả của thẻ cha, công việc gần đây của người được giao, chẩn đoán đang hoạt động).                               |
| `workboard_create`                                                                                                                               | Tạo thẻ với các thẻ cha, tenant, kỹ năng, bảng, siêu dữ liệu workspace, khóa idempotency, giới hạn thời gian chạy và ngân sách thử lại tùy chọn.                                                             |
| `workboard_link`                                                                                                                                 | Liên kết thẻ cha với thẻ con. Các thẻ con vẫn ở trạng thái `todo` cho đến khi mọi thẻ cha đạt `done`, sau đó quá trình nâng cấp khi điều phối sẽ chuyển chúng sang `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Xác nhận thẻ cho agent gọi; chuyển `backlog`/`todo`/`ready` sang `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Làm mới Heartbeat của xác nhận trong quá trình chạy dài hơn.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Giải phóng xác nhận sau khi hoàn tất, tạm dừng hoặc bàn giao; có thể chuyển thẻ sang trạng thái tiếp theo.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Các công cụ vòng đời có cấu trúc dành cho bản tóm tắt cuối cùng, bằng chứng, hiện vật và manifest thẻ đã tạo (phải tham chiếu các thẻ được liên kết ngược về thẻ đã hoàn tất) hoặc lý do bị chặn.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Lưu các tệp đính kèm nhỏ của thẻ trong trạng thái SQLite của plugin, lập chỉ mục trên thẻ và hiển thị trong ngữ cảnh worker.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Ghi lại các dòng nhật ký của worker và chặn thẻ khi một worker tự động dừng mà không gọi `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Quản lý siêu dữ liệu bảng được lưu bền vững (tên hiển thị, mô tả, trạng thái lưu trữ, workspace mặc định).                                                                                            |
| `workboard_runs`                                                                                                                                 | Trả về lịch sử các lần thử chạy được lưu bền vững của một thẻ.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Chuyển một thẻ phân loại/backlog sơ bộ thành thẻ `todo` đã được làm rõ; ghi lại bản tóm tắt đặc tả trên thẻ.                                                                                      |
| `workboard_decompose`                                                                                                                            | Phân tách một thẻ điều phối cha thành các thẻ con được liên kết, kế thừa siêu dữ liệu bảng/tenant; có thể hoàn tất thẻ cha bằng manifest thẻ đã tạo.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Quản lý đăng ký nhận thông báo. Việc đọc sự kiện an toàn khi phát lại; `advance` di chuyển con trỏ bền vững để bên gọi có thể tiếp tục mà không bỏ sót hoặc đọc trùng các sự kiện thẻ đã hoàn tất/thất bại/lỗi thời. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Kiểm tra namespace của bảng và thống kê hàng đợi.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Khôi phục hoặc bàn giao công việc bị kẹt.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Thêm ghi chú bàn giao hoặc đính kèm tham chiếu bằng chứng/hiện vật.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Chuyển công việc bị chặn trở lại `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Chuyển thẻ sang trạng thái khác; thẻ đã được xác nhận yêu cầu phạm vi xác nhận agent của bên gọi.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Thúc đẩy việc nâng cấp phụ thuộc hoặc dọn dẹp xác nhận lỗi thời mà không khởi chạy worker; việc khởi chạy worker sử dụng điều phối qua Gateway hoặc lệnh gạch chéo.                                                        |

Trạng thái bằng chứng là kết quả do worker báo cáo, không phải xác minh độc lập. Một mục
`passed` có nghĩa là worker báo cáo lệnh hoặc bước kiểm tra của mình đã thành công; các bên sử dụng cần
cổng chất lượng độc lập nên kiểm tra lệnh, URL hoặc hiện vật được đính kèm và
chạy trình xác minh riêng. `workboard_proof` trả về `proofId` của bản ghi mới. Khi
`workboard_complete` báo cáo trạng thái kết thúc của chính bằng chứng đó, hãy truyền `proofId` để
bản ghi đang chờ được giải quyết tại chỗ mà không mất danh tính hoặc dấu thời gian. Bằng chứng
đã có cùng trạng thái kết thúc sẽ được tái sử dụng mà không thay đổi. Bằng chứng hoàn tất không có
`proofId` vẫn chỉ cho phép nối thêm, vì vậy lần thử lại sau này không thể ghi đè lịch sử cũ chỉ vì
lệnh hoặc ghi chú của nó giống hệt nhau.

Các thẻ đã được xác nhận từ chối thao tác bằng công cụ agent từ các agent khác, trừ khi bên gọi
giữ token xác nhận do `workboard_claim` trả về. Mọi thẻ được trả về bởi
công cụ agent hoặc lệnh gọi RPC của Gateway đều che `metadata.claim.token` thành `[redacted]`
(bản thân token chỉ được trả về một lần, ở cấp cao nhất, và chỉ từ `workboard_claim`),
để người vận hành dashboard và các agent khác có thể kiểm tra trạng thái xác nhận mà không bao giờ
thấy token có thể sử dụng. Việc khôi phục được thực hiện thông qua
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, những thao tác này không
yêu cầu token.

## Điều phối

Điều phối diễn ra cục bộ trong Gateway: không tạo các tiến trình hệ điều hành tùy ý. Các phiên
subagent thông thường của OpenClaw vẫn chịu trách nhiệm thực thi. Một lượt điều phối:

1. Nâng cấp các thẻ có phụ thuộc đã sẵn sàng.
2. Ghi lại siêu dữ liệu điều phối trên các thẻ sẵn sàng.
3. Chặn các xác nhận đã hết hạn hoặc lượt chạy quá thời gian.
4. Đánh dấu các thẻ phân loại do bảng cấu hình làm ứng viên điều phối.
5. Xác nhận một lô nhỏ các thẻ sẵn sàng và bắt đầu lượt chạy worker thông qua
   runtime subagent của Gateway.

Worker nhận ngữ cảnh thẻ giới hạn cùng token xác nhận cần thiết để gửi Heartbeat,
hoàn tất hoặc chặn thẻ thông qua các công cụ Workboard.

Đường dẫn workspace tuân theo quyền hệ thống tệp hiện có của bên gọi. Máy khách Gateway
có `operator.write` có thể sử dụng các workspace của agent đã cấu hình;
máy khách `operator.admin` có thể sử dụng các checkout khác trên máy chủ. Công cụ agent trong sandbox sử dụng
quyền truy cập workspace của sandbox, còn công cụ chỉ dành cho workspace không nằm trong sandbox sử dụng
thư mục gốc workspace đã cấu hình. Workboard ghi lại quyền đó khi một workspace
được chỉ định và lấy phần giao với quyền hiện tại của bên gọi một lần nữa khi điều phối,
vì vậy thẻ được lưu bền vững không thể mở rộng quyền truy cập của bên gọi sau này. Các thẻ cũ có
workspace máy chủ rõ ràng nhưng không ghi lại quyền phải lưu lại workspace đó
trước khi điều phối toàn máy chủ; các thẻ không có đường dẫn máy chủ sẽ tiếp nhận
quyền của bên gọi hiện tại khi được điều phối lần đầu.

Điều phối gắn với workspace chỉ chấp nhận một thư mục hoặc checkout Git khi
thư mục gốc kho lưu trữ của nó khớp chính xác với workspace của agent đích. Yêu cầu worktree
được thu hẹp vào thư mục đó và lưu bền vững dưới dạng workspace thư mục, để
máy chủ không hiện thực hóa checkout hoặc thực thi mã thiết lập kho lưu trữ. Worker
đích phải sử dụng sandbox Docker có thể ghi, không dùng chung cho chính xác
workspace đó, không có thực thi nâng quyền, các ghi đè thực thi máy chủ/node được lưu bền vững hoặc
các công cụ plugin và MCP chưa được phân loại. Workboard liệt kê các công cụ đã đăng ký
thay vì tin cậy tiền tố `workboard_*`, và việc điều phối từ chối một container Docker đang hoạt động
có hàm băm mount/cấu hình trực tiếp đã lỗi thời. Điều phối báo cáo
chính sách đích không tương thích thay vì khởi động một worker ít bị giới hạn hơn.
Điều phối toàn máy chủ có thể nhắm đến các checkout cục bộ khác và giữ nguyên quy trình thiết lập
worktree được quản lý thông thường.

Quyền workspace không tạo ra mô hình quyền vòng đời thẻ thứ hai.
Các bên gọi có thể thay đổi thẻ Workboard có thể di chuyển chúng theo cách thủ công qua cùng
các trạng thái trên mọi bề mặt; quyền truy cập workspace chỉ đọc chỉ ngăn việc
điều phối worker cần quyền ghi.

### Lựa chọn worker

Mỗi lượt chạy bắt đầu **tối đa 3 worker theo mặc định**. Các thẻ sẵn sàng được sắp xếp theo
mức ưu tiên, sau đó là vị trí, rồi thời điểm tạo. Một lượt chạy chỉ bắt đầu một thẻ cho mỗi
chủ sở hữu/agent và bỏ qua các chủ sở hữu đã có công việc đang chạy hoặc đang được review trên
bảng. Các thẻ đã lưu trữ, thẻ có claim đang hoạt động và thẻ không ở trạng thái `ready`
không bao giờ được chọn để khởi động worker (chúng vẫn có thể chịu tác động từ
phía dữ liệu của quá trình điều phối: dọn dẹp claim cũ, thăng cấp phần phụ thuộc, dọn dẹp
do hết thời gian chờ).

Khóa phiên được xác định tất định theo từng bảng/thẻ, vì vậy các lần điều phối lặp lại sẽ định tuyến
về cùng một làn worker thay vì tạo các phiên không liên quan:

- Thẻ đã được giao: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Thẻ chưa được giao: `subagent:workboard-<boardId>-<cardId>` (Gateway phân giải
  agent mặc định đã cấu hình)

Nếu không thể khởi động worker sau khi một thẻ được claim, Workboard sẽ chặn
thẻ, xóa claim, ghi lại lỗi khởi động lượt chạy và thêm một dòng nhật ký
worker — hiển thị trong bảng điều khiển, JSON của CLI, công cụ agent và phần
chẩn đoán thẻ.

### Điểm truy cập

- Thao tác điều phối trên bảng điều khiển
- `openclaw workboard dispatch`
- `/workboard dispatch` trên một kênh hỗ trợ lệnh

Cả ba đều sử dụng runtime subagent của Gateway khi Gateway khả dụng. CLI
có một cơ chế dự phòng dành cho người vận hành: nếu lệnh gọi Gateway thất bại do
lỗi kết nối/không khả dụng (hoặc lỗi `unknown method` đối với các
Gateway cũ hơn), đồng thời không có đích `--url`/`--token` rõ ràng và không áp dụng
Gateway từ xa đã cấu hình (`OPENCLAW_GATEWAY_URL` hoặc `gateway.mode: remote`), CLI sẽ chạy
quá trình điều phối chỉ dữ liệu đối với trạng thái SQLite cục bộ — có thể thăng cấp các phần phụ thuộc,
dọn dẹp claim cũ và chặn các lượt chạy hết thời gian chờ, nhưng không thể khởi động worker. Các lỗi
xác thực, quyền và xác thực dữ liệu từ một Gateway có thể truy cập không được coi
là không khả dụng; chúng xuất hiện dưới dạng lỗi lệnh, tương tự mọi lỗi Gateway
khi đã cung cấp đích `--url`/`--token` rõ ràng.

Siêu dữ liệu bảng có thể đặt `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` và `orchestratorProfile`. OpenClaw ghi lại ý định này và
đưa nó vào ngữ cảnh worker; quá trình đặc tả/phân rã thực tế vẫn được thực hiện
thông qua các công cụ Workboard thông thường.

## CLI và lệnh gạch chéo

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Đầu ra văn bản `list` ẩn các thẻ đã lưu trữ theo mặc định (`--include-archived`
ghi đè hành vi này); `--json` luôn bao gồm các thẻ đã lưu trữ, phù hợp với hợp đồng đầy đủ về thẻ
được các tập lệnh hiện có sử dụng. `show` và `move` chấp nhận một tiền tố id
không mơ hồ. `list`, `create`, `show` và `move` luôn đọc/ghi trực tiếp
trạng thái plugin cục bộ. Chỉ `dispatch` gọi Gateway đang chạy, với cơ chế dự phòng
được mô tả ở trên.

Xem [CLI Workboard](/vi/cli/workboard) để biết đầy đủ các cờ, đầu ra JSON, hành vi dự phòng
của Gateway, cách xử lý tiền tố id, quy tắc lựa chọn khi điều phối và
cách khắc phục sự cố.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` và `/workboard dispatch` phản ánh
CLI. Liệt kê và hiển thị là các thao tác đọc dành cho mọi người gửi lệnh được ủy quyền.
Tạo, di chuyển và điều phối yêu cầu trạng thái chủ sở hữu trên các giao diện trò chuyện hoặc một ứng dụng
khách Gateway có `operator.write`/`operator.admin`. Các thao tác di chuyển thủ công của người vận hành sử dụng
cùng hành vi ghi đè claim như thao tác kéo và thả trên bảng điều khiển. Quyền truy cập worktree
của chúng vẫn tuân theo cùng ranh giới không gian làm việc được mô tả ở trên.

## Đồng bộ vòng đời phiên

Các thẻ có thể liên kết với một phiên bảng điều khiển hiện có hoặc một phiên được tạo khi bạn
bắt đầu công việc từ thẻ. Các thẻ được liên kết hiển thị trực tiếp vòng đời phiên:
đang chạy, cũ, đã liên kết nhưng không hoạt động, hoàn tất, thất bại hoặc thiếu. Bạn cũng có thể ghi nhận một
phiên hiện có từ thẻ Sessions bằng **Add to Workboard**; thẻ
liên kết với phiên đó, sử dụng nhãn phiên hoặc lời nhắc gần đây của người dùng làm tiêu đề,
đồng thời điền ghi chú ban đầu từ lời nhắc gần đây của người dùng cùng phản hồi mới nhất của trợ lý
khi có.

Nếu phiên được liên kết bị thiếu, thẻ vẫn giữ liên kết để cung cấp ngữ cảnh và
vẫn cung cấp các điều khiển bắt đầu nhằm khởi động lại trong một phiên mới. Nếu một phiên
được liên kết đang hoạt động ngừng báo cáo hoạt động gần đây, Workboard đánh dấu thẻ là
`stale` và lưu trạng thái đó dưới dạng siêu dữ liệu cho đến khi vòng đời xóa nó.

Khi một thẻ đang ở trạng thái công việc hoạt động, Workboard sẽ theo dõi phiên được liên kết:

| Trạng thái phiên được liên kết          | Trạng thái thẻ |
| --------------------------------------- | -------------- |
| đang hoạt động                          | `running`   |
| đã hoàn tất                             | `review`    |
| thất bại, bị dừng, hết thời gian chờ hoặc bị hủy bỏ | `blocked`   |

**Trạng thái review thủ công được ưu tiên.** Việc di chuyển một thẻ sang `review`, `blocked` hoặc `done`
sẽ dừng tự động đồng bộ cho thẻ đó cho đến khi bạn chuyển thẻ trở lại `todo` hoặc `running`.

Việc bắt đầu một thẻ sử dụng các phiên Gateway thông thường; Workboard chỉ lưu siêu dữ liệu
và liên kết của thẻ. Bản chép lời cuộc trò chuyện, lựa chọn mô hình và vòng đời
lượt chạy vẫn do hệ thống phiên thông thường quản lý. Sử dụng **Stop** trên một thẻ được liên kết
đang hoạt động để hủy lượt chạy hiện tại — Workboard đánh dấu thẻ đó là `blocked` để
thẻ vẫn hiển thị cho việc xử lý tiếp theo.

Các thẻ mới có thể bắt đầu từ các mẫu Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Mẫu điền sẵn tiêu đề, ghi chú, nhãn và mức ưu tiên;
id mẫu được lưu dưới dạng siêu dữ liệu thẻ.

## Quy trình làm việc trên bảng điều khiển

1. Mở thẻ Workboard trong Control UI.
2. Tạo một thẻ với tiêu đề, ghi chú, mức ưu tiên, nhãn, agent tùy chọn và
   phiên được liên kết tùy chọn — hoặc mở Sessions và chọn **Add to Workboard**
   cho một phiên hiện có.
3. Kéo thẻ giữa các cột hoặc đưa tiêu điểm vào điều khiển trạng thái thu gọn của thẻ rồi sử dụng
   menu hay ArrowLeft/ArrowRight. Trong khi kéo, thẻ nguồn mờ đi và
   các cột có thể thả sẽ có đường viền.
4. Bắt đầu công việc từ thẻ để tạo hoặc tái sử dụng một phiên bảng điều khiển.
5. Mở phiên được liên kết từ thẻ trong khi agent làm việc.
6. Để quá trình đồng bộ vòng đời chuyển công việc đang chạy sang `review`/`blocked`, sau đó
   di chuyển thủ công thẻ sang `done` khi được chấp nhận.

## Chẩn đoán

Thông tin chẩn đoán được tính từ siêu dữ liệu thẻ cục bộ. Các kiểm tra tích hợp sẵn gắn cờ:

| Loại                        | Điều kiện                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Thẻ `todo`/`backlog`/`ready` đã được giao nhưng không được cập nhật trong hơn 1 giờ.             |
| `running_without_heartbeat` | Thẻ `running` không có Heartbeat claim hoặc cập nhật thực thi trong hơn 20 phút. |
| `blocked_too_long`          | Thẻ `blocked` không được cập nhật trong hơn 24 giờ.                                   |
| `repeated_failures`         | Số lần thất bại được theo dõi của thẻ đạt 2 trở lên.                                |
| `missing_proof`             | Thẻ `done` không có bằng chứng, tạo tác hoặc tệp đính kèm.                          |
| `orphaned_session`          | Thẻ `running` có `sessionKey` nhưng không có siêu dữ liệu `execution`.                |

## Quyền

Các phương thức RPC của Gateway nằm dưới `workboard.*`:

| Phạm vi          | Phương thức                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, liệt kê/lấy tệp đính kèm, đọc sự kiện thông báo, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, tạo/cập nhật/di chuyển/xóa/bình luận/liên kết/linkDependency/bằng chứng/tạo tác, thêm/xóa tệp đính kèm, nhật ký worker, vi phạm giao thức, claim/Heartbeat/phát hành/thăng cấp/giao lại/claim lại/hoàn tất/chặn/bỏ chặn, `cards.dispatch`, `cards.bulk`, lưu trữ, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, đăng ký/xóa/chuyển tiếp thông báo |

Không phương thức RPC nào yêu cầu `operator.admin`. Các trình duyệt được kết nối với quyền
người vận hành chỉ đọc có thể kiểm tra bảng nhưng không thể thay đổi thẻ. Phạm vi quản trị
mở rộng các đường dẫn máy chủ Workboard được chấp nhận; nó không thay đổi các phương thức khả dụng.

## Lưu trữ

Workboard lưu dữ liệu lâu bền trong một cơ sở dữ liệu SQLite quan hệ do plugin sở hữu
nằm trong thư mục trạng thái OpenClaw: bảng, thẻ, nhãn, sự kiện vòng đời,
lần thử chạy, bình luận, liên kết phần phụ thuộc, bằng chứng, tham chiếu tạo tác,
siêu dữ liệu và blob của tệp đính kèm, thông tin chẩn đoán, thông báo, nhật ký worker,
trạng thái giao thức và đăng ký đều nằm trong các bảng Workboard (không phải
mục khóa-giá trị của plugin). Tệp xuất thẻ giữ nguyên diễn tiến của bảng
mà không nhúng nội dung blob của tệp đính kèm.

Các bản cài đặt đã sử dụng Workboard trong bản phát hành `.28` có thể chạy
`openclaw doctor --fix` để di chuyển các không gian tên trạng thái plugin cũ đã phát hành
(`workboard.cards`, `workboard.boards`, `workboard.notify` và, nếu có,
`workboard.attachments`) vào cơ sở dữ liệu quan hệ.

## Khắc phục sự cố

**Thẻ cho biết Workboard không khả dụng**

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu `plugins.allow` đã được cấu hình, hãy thêm `workboard` vào đó. Nếu `plugins.deny`
chứa `workboard`, hãy xóa mục đó trước khi bật plugin.

**Không lưu được thẻ**

Xác nhận kết nối trình duyệt có quyền truy cập `operator.write`. Các phiên người vận hành
chỉ đọc có thể liệt kê thẻ nhưng không thể tạo, chỉnh sửa, di chuyển hoặc xóa chúng.

**Việc bắt đầu một thẻ không mở đúng phiên mong đợi**

Kiểm tra id agent và phiên được liên kết của thẻ, sau đó mở Sessions hoặc Chat để
kiểm tra trạng thái lượt chạy thực tế.

**Quá trình điều phối không khởi động worker**

Xác nhận có ít nhất một thẻ `ready` không có claim đang hoạt động:

```bash
openclaw workboard list --status ready
```

Nếu CLI báo cáo quá trình điều phối chỉ dữ liệu, hãy khởi động hoặc khởi động lại Gateway rồi
thử lại — quá trình điều phối chỉ dữ liệu cập nhật trạng thái bảng cục bộ nhưng không thể khởi động
các lượt chạy worker subagent. Thẻ cũng có thể bị bỏ qua khi một thẻ khác của cùng
chủ sở hữu hoặc agent đang chạy hoặc đang chờ review; hãy hoàn tất,
chặn hoặc giải phóng công việc đang hoạt động đó trước khi điều phối thêm công việc cho cùng
chủ sở hữu.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [CLI Workboard](/vi/cli/workboard)
- [Plugin](/vi/tools/plugin)
- [Quản lý plugin](/vi/plugins/manage-plugins)
- [Phiên](/vi/concepts/session)
