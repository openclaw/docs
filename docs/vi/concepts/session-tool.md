---
read_when:
    - Bạn muốn hiểu tác tử có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc khởi tạo sub-agent
    - Bạn muốn kiểm tra trạng thái của sub-agent đã được tạo
summary: Công cụ agent cho trạng thái liên phiên, truy hồi, nhắn tin và điều phối sub-agent
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-07-04T20:35:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho các tác tử công cụ để làm việc qua nhiều phiên, kiểm tra trạng thái và
điều phối các tác tử phụ.

## Công cụ hiện có

| Công cụ            | Chức năng                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, tác tử, lưu trữ, xem trước) |
| `sessions_history` | Đọc bản ghi hội thoại của một phiên cụ thể                                  |
| `sessions_send`    | Gửi tin nhắn đến phiên khác và tùy chọn chờ                                 |
| `sessions_spawn`   | Tạo một phiên tác tử phụ tách biệt cho công việc nền                        |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả theo sau từ tác tử phụ                |
| `subagents`        | Liệt kê trạng thái tác tử phụ đã tạo cho phiên này                          |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình cho từng phiên   |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính sách
cho phép/từ chối. `tools.profile: "coding"` bao gồm đầy đủ bộ điều phối phiên,
bao gồm `sessions_spawn`, `sessions_yield` và `subagents`.
`tools.profile: "messaging"` bao gồm các công cụ nhắn tin liên phiên
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng
không bao gồm tạo tác tử phụ. Để giữ hồ sơ nhắn tin và vẫn cho phép ủy quyền
gốc, hãy thêm:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Các chính sách nhóm, nhà cung cấp, sandbox và theo từng tác tử vẫn có thể loại bỏ các công cụ đó
sau giai đoạn hồ sơ. Dùng `/tools` từ phiên bị ảnh hưởng để kiểm tra
danh sách công cụ thực tế.

## Liệt kê và đọc phiên

`sessions_list` trả về các phiên cùng với khóa, agentId, loại, kênh, mô hình,
số lượng token và dấu thời gian. Lọc theo loại (`main`, `group`, `cron`, `hook`,
`node`), `label` chính xác, `agentId` chính xác, văn bản tìm kiếm hoặc độ gần đây
(`activeMinutes`). Các phiên đang hoạt động được trả về theo mặc định; truyền `archived: true`
để kiểm tra các phiên đã lưu trữ. Các hàng bao gồm trạng thái ghim và lưu trữ. Khi
bạn cần phân loại kiểu hộp thư, công cụ cũng có thể yêu cầu một
tiêu đề dẫn xuất theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối cùng hoặc các tin nhắn gần đây
có giới hạn trên mỗi hàng. Tiêu đề dẫn xuất và bản xem trước chỉ được tạo cho các phiên
mà bên gọi đã có thể thấy theo chính sách hiển thị công cụ phiên đã cấu hình, vì vậy
các phiên không liên quan vẫn bị ẩn. Khi khả năng hiển thị bị hạn chế, `sessions_list`
trả về siêu dữ liệu `visibility` tùy chọn cho biết chế độ thực tế và cảnh báo rằng
kết quả có thể bị giới hạn theo phạm vi.

`sessions_history` lấy bản ghi hội thoại cho một phiên cụ thể.
Theo mặc định, kết quả công cụ bị loại trừ -- truyền `includeTools: true` để xem chúng.
Dùng `limit` cho phần đuôi mới nhất có giới hạn. Truyền `offset: 0` khi bạn cần
siêu dữ liệu phân trang, rồi truyền các giá trị `nextOffset` được trả về để lùi trang
qua các cửa sổ bản ghi OpenClaw cũ hơn mà không đọc tệp bản ghi thô.
Các trang offset tường minh không hợp nhất các bản nhập dự phòng CLI bên ngoài; dùng
chế độ xem phần đuôi mới nhất mặc định khi bạn cần lịch sử hiển thị đã hợp nhất đó.
Chế độ xem trả về được cố ý giới hạn và lọc an toàn:

- văn bản của trợ lý được chuẩn hóa trước khi truy hồi:
  - các thẻ suy nghĩ bị loại bỏ
  - các khối khung dựng `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối tải XML lệnh gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và
    `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả các tải bị cắt ngắn
    không bao giờ đóng sạch
  - khung dựng lệnh gọi/kết quả công cụ đã hạ cấp như `[Tool Call: ...]`,
    `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII
    `<|...|>` khác và các biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML lệnh gọi công cụ MiniMax sai định dạng như `<invoke ...>` /
    `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được biên tập trước khi được trả về
- các khối văn bản dài bị cắt ngắn
- lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay thế một hàng quá lớn bằng
  `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` và siêu dữ liệu phân trang

Cả hai công cụ đều chấp nhận **khóa phiên** (như `"main"`) hoặc **ID phiên**
từ một lần gọi danh sách trước đó.

Nếu bạn cần bản ghi chính xác từng byte, hãy kiểm tra tệp bản ghi trên
đĩa thay vì xem `sessions_history` như một bản kết xuất thô.

## Gửi tin nhắn liên phiên

`sessions_send` chuyển một tin nhắn đến phiên khác và tùy chọn chờ
phản hồi:

- **Gửi rồi bỏ qua:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về
  ngay lập tức.
- **Chờ trả lời:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên trò chuyện theo phạm vi luồng, chẳng hạn như khóa Slack hoặc Discord kết thúc bằng
`:thread:<id>`, không phải là đích `sessions_send` hợp lệ. Dùng khóa phiên kênh cha
để phối hợp giữa các tác tử để các tin nhắn được định tuyến qua công cụ không xuất hiện
bên trong một luồng đang hoạt động hướng tới con người.

Tin nhắn và phản hồi theo sau A2A được đánh dấu là dữ liệu liên phiên trong
prompt nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi.
Tác tử nhận nên xử lý chúng như dữ liệu được định tuyến qua công cụ, không phải như một
chỉ dẫn trực tiếp do người dùng cuối viết.

Sau khi đích phản hồi, OpenClaw có thể chạy một **vòng lặp trả lời lại** trong đó
các tác tử luân phiên gửi tin nhắn (tối đa `session.agentToAgent.maxPingPongTurns`, phạm vi
0-20, mặc định 5). Tác tử đích có thể trả lời
`REPLY_SKIP` để dừng sớm.

## Trợ giúp trạng thái và điều phối

`session_status` là công cụ tương đương `/status` gọn nhẹ cho phiên hiện tại
hoặc một phiên hiển thị khác. Nó báo cáo mức sử dụng, thời gian, trạng thái mô hình/runtime và
ngữ cảnh tác vụ nền đã liên kết khi có. Giống `/status`, nó có thể điền bù
các bộ đếm token/cache thưa từ mục sử dụng bản ghi mới nhất, và
`model=default` xóa ghi đè theo từng phiên. Dùng `sessionKey="current"` cho
phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là
khóa phiên.

Khi có siêu dữ liệu tuyến, `session_status` cũng bao gồm một khối JSON
`Route context` hiển thị và các trường `details` có cấu trúc tương ứng. Các
trường này phân biệt khóa phiên với tuyến hiện đang xử lý
lần chạy trực tiếp:

- `origin` là nơi phiên được tạo, hoặc nhà cung cấp được suy ra từ
  tiền tố khóa phiên có thể chuyển giao khi trạng thái cũ thiếu siêu dữ liệu nguồn gốc đã lưu.
- `active` là tuyến lần chạy trực tiếp hiện tại. Nó chỉ được báo cáo cho phiên trực tiếp hoặc
  phiên hiện tại đang được xử lý lúc này.
- `deliveryContext` là tuyến chuyển phát đã lưu trên phiên,
  mà OpenClaw có thể tái sử dụng cho lần chuyển phát sau ngay cả khi bề mặt đang hoạt động
  khác đi.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là
sự kiện theo sau mà bạn đang chờ. Dùng nó sau khi tạo tác tử phụ khi
bạn muốn kết quả hoàn thành đến dưới dạng tin nhắn tiếp theo thay vì xây dựng
các vòng lặp thăm dò.

`subagents` là trợ giúp hiển thị cho các tác tử phụ OpenClaw
đã được tạo. Nó hỗ trợ `action: "list"` để kiểm tra các lần chạy đang hoạt động/gần đây.

## Tạo tác tử phụ

`sessions_spawn` tạo một phiên tách biệt cho một tác vụ nền theo mặc định.
Nó luôn không chặn -- nó trả về ngay lập tức với `runId` và
`childSessionKey`. Các lần chạy tác tử phụ gốc nhận tác vụ được ủy quyền trong
tin nhắn `[Subagent Task]` hiển thị đầu tiên của phiên con, trong khi prompt
hệ thống chỉ mang các quy tắc runtime của tác tử phụ và ngữ cảnh định tuyến.

Tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho tác tử harness bên ngoài.
- ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để ràng buộc lần tạo với một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để thực thi sandboxing trên phiên con.
- `context: "fork"` cho tác tử phụ gốc khi phiên con cần bản ghi của
  bên yêu cầu hiện tại; bỏ qua hoặc dùng `context: "isolated"` cho một phiên con sạch.
  Tác tử phụ gốc gắn với luồng mặc định dùng `context: "fork"` trừ khi
  `threadBindings.defaultSpawnContext` quy định khác.

Tác tử phụ lá mặc định không nhận công cụ phiên. Khi
`maxSpawnDepth >= 2`, tác tử phụ điều phối ở độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để chúng
có thể quản lý các phiên con của riêng mình. Các lần chạy lá vẫn không nhận công cụ
điều phối đệ quy.

Sau khi hoàn thành, một bước thông báo đăng kết quả lên kênh của bên yêu cầu.
Việc chuyển phát hoàn thành giữ nguyên định tuyến luồng/chủ đề đã ràng buộc khi có, và nếu
nguồn gốc hoàn thành chỉ xác định một kênh, OpenClaw vẫn có thể tái sử dụng
tuyến đã lưu của phiên bên yêu cầu (`lastChannel` / `lastTo`) để chuyển phát
trực tiếp.

Để biết hành vi dành riêng cho ACP, xem [Tác tử ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Công cụ phiên được giới hạn phạm vi để hạn chế những gì tác tử có thể thấy:

| Cấp     | Phạm vi                                  |
| ------- | ---------------------------------------- |
| `self`  | Chỉ phiên hiện tại                       |
| `tree`  | Phiên hiện tại + tác tử phụ đã tạo       |
| `agent` | Tất cả phiên của tác tử này              |
| `all`   | Tất cả phiên (liên tác tử nếu được cấu hình) |

Mặc định là `tree`. Các phiên sandbox bị kẹp ở `tree` bất kể
cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session) -- định tuyến, vòng đời, bảo trì
- [Tác tử ACP](/vi/tools/acp-agents) -- tạo harness bên ngoài
- [Đa tác tử](/vi/concepts/multi-agent) -- kiến trúc đa tác tử
- [Cấu hình Gateway](/vi/gateway/configuration) -- các núm cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
