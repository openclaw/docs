---
read_when:
    - Bạn muốn hiểu agent có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập xuyên phiên hoặc tạo sub-agent
    - Bạn muốn kiểm tra trạng thái của tác nhân phụ đã được tạo ra
summary: Công cụ agent cho trạng thái xuyên phiên, hồi tưởng, nhắn tin và điều phối sub-agent
title: Công cụ phiên
x-i18n:
    generated_at: "2026-06-27T17:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho tác nhân các công cụ để làm việc qua nhiều phiên, kiểm tra trạng thái và
điều phối tác nhân phụ.

## Công cụ có sẵn

| Công cụ            | Chức năng                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê phiên với bộ lọc tùy chọn (loại, nhãn, tác nhân, độ gần đây, bản xem trước) |
| `sessions_history` | Đọc bản ghi hội thoại của một phiên cụ thể                                  |
| `sessions_send`    | Gửi tin nhắn đến phiên khác và tùy chọn chờ                                  |
| `sessions_spawn`   | Tạo một phiên tác nhân phụ cô lập cho công việc nền                         |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả tiếp theo từ tác nhân phụ             |
| `subagents`        | Liệt kê trạng thái tác nhân phụ đã tạo cho phiên này                        |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình theo từng phiên  |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính sách
cho phép/từ chối. `tools.profile: "coding"` bao gồm đầy đủ bộ điều phối phiên,
bao gồm `sessions_spawn`, `sessions_yield` và `subagents`.
`tools.profile: "messaging"` bao gồm các công cụ nhắn tin liên phiên
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng
không bao gồm việc tạo tác nhân phụ. Để giữ hồ sơ nhắn tin và vẫn cho phép
ủy quyền gốc, hãy thêm:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Các chính sách nhóm, nhà cung cấp, sandbox và theo từng tác nhân vẫn có thể loại bỏ những công cụ đó
sau giai đoạn hồ sơ. Dùng `/tools` từ phiên bị ảnh hưởng để kiểm tra
danh sách công cụ có hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các phiên cùng khóa, agentId, loại, kênh, mô hình,
số lượng token và dấu thời gian. Lọc theo loại (`main`, `group`, `cron`, `hook`,
`node`), `label` chính xác, `agentId` chính xác, văn bản tìm kiếm hoặc độ gần đây
(`activeMinutes`). Khi cần phân loại kiểu hộp thư, công cụ cũng có thể yêu cầu
tiêu đề suy ra theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối cùng hoặc các
tin nhắn gần đây có giới hạn trên mỗi hàng. Tiêu đề suy ra và bản xem trước chỉ được tạo cho các phiên
mà bên gọi đã có thể thấy theo chính sách hiển thị công cụ phiên đã cấu hình, vì vậy
các phiên không liên quan vẫn bị ẩn. Khi khả năng hiển thị bị hạn chế, `sessions_list`
trả về siêu dữ liệu `visibility` tùy chọn cho biết chế độ có hiệu lực và cảnh báo rằng
kết quả có thể bị giới hạn theo phạm vi.

`sessions_history` lấy bản ghi hội thoại cho một phiên cụ thể.
Theo mặc định, kết quả công cụ bị loại trừ -- truyền `includeTools: true` để xem chúng.
Chế độ xem trả về được cố ý giới hạn và lọc an toàn:

- văn bản của assistant được chuẩn hóa trước khi truy hồi:
  - các thẻ thinking bị loại bỏ
  - các khối khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối payload XML gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và
    `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả các
    payload bị cắt cụt không bao giờ đóng đúng cách
  - khung gọi công cụ/kết quả bị hạ cấp như `[Tool Call: ...]`,
    `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII
    `<|...|>` khác và các biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML gọi công cụ MiniMax không đúng định dạng như `<invoke ...>` /
    `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được che trước khi trả về
- các khối văn bản dài bị cắt cụt
- lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng
  `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` và `bytes`

Cả hai công cụ đều chấp nhận **khóa phiên** (như `"main"`) hoặc **ID phiên**
từ một lần gọi liệt kê trước đó.

Nếu bạn cần bản ghi chính xác từng byte, hãy kiểm tra tệp bản ghi trên
ổ đĩa thay vì coi `sessions_history` là bản xuất thô.

## Gửi tin nhắn liên phiên

`sessions_send` chuyển một tin nhắn đến phiên khác và tùy chọn chờ
phản hồi:

- **Gửi rồi bỏ qua:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về
  ngay lập tức.
- **Chờ trả lời:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên trò chuyện theo phạm vi luồng, như khóa Slack hoặc Discord kết thúc bằng
`:thread:<id>`, không phải là mục tiêu `sessions_send` hợp lệ. Dùng khóa phiên kênh
cha để phối hợp liên tác nhân, để các tin nhắn được định tuyến qua công cụ không xuất hiện
bên trong luồng đang hướng tới con người.

Tin nhắn và phản hồi tiếp theo A2A được đánh dấu là dữ liệu liên phiên trong
prompt nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi.
Tác nhân nhận nên coi chúng là dữ liệu được định tuyến qua công cụ, không phải là
chỉ dẫn do người dùng cuối trực tiếp viết.

Sau khi mục tiêu phản hồi, OpenClaw có thể chạy một **vòng lặp trả lời lại** trong đó
các tác nhân luân phiên gửi tin nhắn (tối đa `session.agentToAgent.maxPingPongTurns`, phạm vi
0-20, mặc định 5). Tác nhân mục tiêu có thể trả lời
`REPLY_SKIP` để dừng sớm.

## Trạng thái và trình trợ giúp điều phối

`session_status` là công cụ nhẹ tương đương `/status` cho phiên hiện tại
hoặc một phiên hiển thị khác. Nó báo cáo mức sử dụng, thời gian, trạng thái mô hình/runtime và
ngữ cảnh tác vụ nền được liên kết khi có. Giống `/status`, nó có thể điền bổ sung
các bộ đếm token/cache thưa từ mục sử dụng bản ghi mới nhất, và
`model=default` xóa ghi đè theo từng phiên. Dùng `sessionKey="current"` cho
phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là
khóa phiên.

Khi có siêu dữ liệu tuyến, `session_status` cũng bao gồm một khối JSON
`Ngữ cảnh định tuyến` hiển thị và các trường `details` có cấu trúc tương ứng. Các
trường này phân biệt khóa phiên với tuyến hiện đang xử lý
lượt chạy trực tiếp:

- `origin` là nơi phiên được tạo, hoặc nhà cung cấp suy ra từ tiền tố
  khóa phiên có thể chuyển phát khi trạng thái cũ thiếu siêu dữ liệu nguồn gốc đã lưu.
- `active` là tuyến chạy trực tiếp hiện tại. Nó chỉ được báo cáo cho phiên trực tiếp hoặc
  phiên hiện tại đang được xử lý ngay bây giờ.
- `deliveryContext` là tuyến chuyển phát được lưu trên phiên,
  mà OpenClaw có thể tái sử dụng cho lần chuyển phát sau ngay cả khi bề mặt đang hoạt động
  khác đi.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là
sự kiện tiếp theo mà bạn đang chờ. Dùng nó sau khi tạo tác nhân phụ khi
bạn muốn kết quả hoàn tất đến dưới dạng tin nhắn tiếp theo thay vì xây dựng
các vòng lặp thăm dò.

`subagents` là trình trợ giúp hiển thị cho các tác nhân phụ OpenClaw
đã được tạo. Nó hỗ trợ `action: "list"` để kiểm tra các lượt chạy đang hoạt động/gần đây.

## Tạo tác nhân phụ

`sessions_spawn` tạo một phiên cô lập cho tác vụ nền theo mặc định.
Nó luôn không chặn -- nó trả về ngay lập tức với `runId` và
`childSessionKey`. Các lượt chạy tác nhân phụ gốc nhận tác vụ được ủy quyền trong
tin nhắn `[Subagent Task]` hiển thị đầu tiên của phiên con, trong khi prompt hệ thống
chỉ mang các quy tắc runtime tác nhân phụ và ngữ cảnh định tuyến.

Tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho tác nhân harness bên ngoài.
- Ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để gắn lần tạo vào một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc sandboxing trên phiên con.
- `context: "fork"` cho tác nhân phụ gốc khi phiên con cần bản ghi của bên yêu cầu hiện tại;
  bỏ qua tùy chọn này hoặc dùng `context: "isolated"` cho một phiên con sạch.
  Tác nhân phụ gốc gắn với luồng mặc định dùng `context: "fork"` trừ khi
  `threadBindings.defaultSpawnContext` quy định khác.

Tác nhân phụ lá mặc định không nhận công cụ phiên. Khi
`maxSpawnDepth >= 2`, tác nhân phụ điều phối độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để chúng
có thể quản lý các tác nhân con của riêng mình. Các lượt chạy lá vẫn không nhận công cụ
điều phối đệ quy.

Sau khi hoàn tất, một bước thông báo sẽ đăng kết quả lên kênh của bên yêu cầu.
Việc chuyển phát hoàn tất bảo toàn định tuyến luồng/chủ đề đã gắn khi có, và nếu
nguồn gốc hoàn tất chỉ xác định một kênh thì OpenClaw vẫn có thể tái sử dụng
tuyến đã lưu của phiên bên yêu cầu (`lastChannel` / `lastTo`) để chuyển phát
trực tiếp.

Để biết hành vi riêng của ACP, xem [Tác nhân ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Công cụ phiên được giới hạn phạm vi để hạn chế những gì tác nhân có thể thấy:

| Mức     | Phạm vi                                  |
| ------- | ---------------------------------------- |
| `self`  | Chỉ phiên hiện tại                       |
| `tree`  | Phiên hiện tại + tác nhân phụ đã tạo     |
| `agent` | Tất cả phiên của tác nhân này            |
| `all`   | Tất cả phiên (liên tác nhân nếu được cấu hình) |

Mặc định là `tree`. Các phiên sandbox bị giới hạn ở `tree` bất kể
cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session) -- định tuyến, vòng đời, bảo trì
- [Tác nhân ACP](/vi/tools/acp-agents) -- tạo harness bên ngoài
- [Đa tác nhân](/vi/concepts/multi-agent) -- kiến trúc đa tác nhân
- [Cấu hình Gateway](/vi/gateway/configuration) -- các núm cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
