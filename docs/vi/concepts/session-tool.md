---
read_when:
    - Bạn muốn hiểu tác tử có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc việc tạo tác nhân phụ
    - Bạn muốn kiểm tra trạng thái hoặc điều khiển các tác nhân phụ đã được khởi tạo
summary: Công cụ tác nhân cho trạng thái xuyên phiên, truy hồi, nhắn tin và điều phối tác nhân phụ
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-05-11T20:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho tác nhân các công cụ để làm việc qua nhiều phiên, kiểm tra trạng thái và
điều phối các tác nhân con.

## Công cụ có sẵn

| Công cụ            | Chức năng                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê phiên với bộ lọc tùy chọn (loại, nhãn, tác nhân, độ gần đây, xem trước) |
| `sessions_history` | Đọc bản ghi hội thoại của một phiên cụ thể                                  |
| `sessions_send`    | Gửi tin nhắn đến một phiên khác và tùy chọn chờ                              |
| `sessions_spawn`   | Tạo một phiên tác nhân con tách biệt cho công việc nền                      |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả tiếp theo từ tác nhân con             |
| `subagents`        | Liệt kê, điều hướng hoặc hủy các tác nhân con đã tạo cho phiên này          |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình cho từng phiên   |

Các công cụ này vẫn chịu ràng buộc bởi hồ sơ công cụ đang hoạt động và chính sách
cho phép/từ chối. `tools.profile: "coding"` bao gồm toàn bộ bộ điều phối phiên,
bao gồm `sessions_spawn`, `sessions_yield` và `subagents`.
`tools.profile: "messaging"` bao gồm các công cụ nhắn tin liên phiên
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng
không bao gồm tạo tác nhân con. Để giữ hồ sơ nhắn tin và vẫn cho phép ủy quyền
gốc, hãy thêm:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Các chính sách nhóm, nhà cung cấp, sandbox và từng tác nhân vẫn có thể loại bỏ
những công cụ đó sau giai đoạn hồ sơ. Dùng `/tools` từ phiên bị ảnh hưởng để
kiểm tra danh sách công cụ có hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các phiên cùng với khóa, agentId, loại, kênh, mô hình,
số lượng token và dấu thời gian. Lọc theo loại (`main`, `group`, `cron`, `hook`,
`node`), `label` chính xác, `agentId` chính xác, văn bản tìm kiếm hoặc độ gần đây
(`activeMinutes`). Khi bạn cần phân loại kiểu hộp thư, công cụ cũng có thể yêu cầu
tiêu đề suy diễn theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối cùng hoặc
các tin nhắn gần đây có giới hạn trên từng hàng. Tiêu đề suy diễn và bản xem trước
chỉ được tạo cho các phiên mà bên gọi đã có thể thấy theo chính sách hiển thị
công cụ phiên đã cấu hình, nên các phiên không liên quan vẫn bị ẩn.

`sessions_history` lấy bản ghi hội thoại cho một phiên cụ thể.
Theo mặc định, kết quả công cụ bị loại trừ -- truyền `includeTools: true` để xem chúng.
Khung nhìn trả về được cố ý giới hạn và lọc an toàn:

- văn bản của assistant được chuẩn hóa trước khi truy xuất:
  - thẻ suy nghĩ bị loại bỏ
  - các khối giàn giáo `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối payload XML gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và
    `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả payload bị cắt cụt
    không bao giờ đóng đúng cách
  - giàn giáo gọi công cụ/kết quả đã hạ cấp như `[Tool Call: ...]`,
    `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII
    `<|...|>` khác và biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML gọi công cụ MiniMax sai định dạng như `<invoke ...>` /
    `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được biên tập trước khi trả về
- các khối văn bản dài bị cắt cụt
- lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng
  `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` và `bytes`

Cả hai công cụ chấp nhận **khóa phiên** (như `"main"`) hoặc **ID phiên**
từ một lần gọi danh sách trước đó.

Nếu bạn cần bản ghi chính xác từng byte, hãy kiểm tra tệp bản ghi trên
ổ đĩa thay vì xem `sessions_history` như một bản kết xuất thô.

## Gửi tin nhắn liên phiên

`sessions_send` gửi tin nhắn đến một phiên khác và tùy chọn chờ phản hồi:

- **Gửi rồi bỏ qua:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về
  ngay lập tức.
- **Chờ trả lời:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên trò chuyện theo phạm vi luồng, chẳng hạn khóa Slack hoặc Discord kết thúc bằng
`:thread:<id>`, không phải mục tiêu `sessions_send` hợp lệ. Dùng khóa phiên kênh cha
để phối hợp liên tác nhân, để các tin nhắn được định tuyến qua công cụ không xuất hiện
bên trong một luồng đang hướng tới người dùng.

Tin nhắn và phản hồi theo dõi A2A được đánh dấu là dữ liệu liên phiên trong prompt
nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi.
Tác nhân nhận nên xem chúng là dữ liệu được định tuyến qua công cụ, không phải là
chỉ dẫn do người dùng cuối trực tiếp viết.

Sau khi mục tiêu phản hồi, OpenClaw có thể chạy **vòng lặp trả lời lại** trong đó
các tác nhân luân phiên nhắn tin (tối đa `session.agentToAgent.maxPingPongTurns`, phạm vi
0-20, mặc định 5). Tác nhân mục tiêu có thể trả lời
`REPLY_SKIP` để dừng sớm.

## Trạng thái và trình trợ giúp điều phối

`session_status` là công cụ tương đương `/status` gọn nhẹ cho phiên hiện tại
hoặc một phiên hiển thị khác. Nó báo cáo mức sử dụng, thời gian, trạng thái mô hình/runtime và
ngữ cảnh tác vụ nền được liên kết khi có. Giống `/status`, nó có thể điền lại
bộ đếm token/cache thưa từ mục sử dụng bản ghi mới nhất, và
`model=default` xóa ghi đè theo từng phiên. Dùng `sessionKey="current"` cho
phiên hiện tại của bên gọi; các nhãn client hiển thị như `openclaw-tui` không phải là
khóa phiên.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là
sự kiện theo dõi mà bạn đang chờ. Dùng nó sau khi tạo tác nhân con khi
bạn muốn kết quả hoàn tất đến dưới dạng tin nhắn tiếp theo thay vì xây dựng
vòng lặp thăm dò.

`subagents` là trình trợ giúp mặt phẳng điều khiển cho các tác nhân con OpenClaw
đã được tạo. Nó hỗ trợ:

- `action: "list"` để kiểm tra các lần chạy đang hoạt động/gần đây
- `action: "steer"` để gửi hướng dẫn theo dõi cho tác nhân con đang chạy
- `action: "kill"` để dừng một tác nhân con hoặc `all`

## Tạo tác nhân con

`sessions_spawn` tạo một phiên tách biệt cho tác vụ nền theo mặc định.
Nó luôn không chặn -- trả về ngay lập tức với `runId` và
`childSessionKey`.

Tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho tác nhân harness bên ngoài.
- Ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để ràng buộc lần tạo với một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để thực thi sandboxing trên phiên con.
- `context: "fork"` cho tác nhân con gốc khi tác nhân con cần bản ghi hiện tại
  của bên yêu cầu; bỏ qua hoặc dùng `context: "isolated"` cho tác nhân con sạch.
  Tác nhân con gốc gắn với luồng mặc định dùng `context: "fork"` trừ khi
  `threadBindings.defaultSpawnContext` quy định khác.

Tác nhân con lá mặc định không nhận công cụ phiên. Khi
`maxSpawnDepth >= 2`, tác nhân con điều phối ở độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để chúng
có thể quản lý tác nhân con của riêng mình. Các lần chạy lá vẫn không nhận
công cụ điều phối đệ quy.

Sau khi hoàn tất, một bước thông báo đăng kết quả lên kênh của bên yêu cầu.
Việc phân phối hoàn tất giữ nguyên định tuyến luồng/chủ đề đã ràng buộc khi có, và nếu
nguồn gốc hoàn tất chỉ xác định một kênh, OpenClaw vẫn có thể dùng lại tuyến đã lưu
của phiên bên yêu cầu (`lastChannel` / `lastTo`) để phân phối trực tiếp.

Để biết hành vi riêng của ACP, xem [Tác nhân ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Công cụ phiên được giới hạn phạm vi để hạn chế những gì tác nhân có thể thấy:

| Mức     | Phạm vi                                  |
| ------- | ---------------------------------------- |
| `self`  | Chỉ phiên hiện tại                       |
| `tree`  | Phiên hiện tại + tác nhân con đã tạo     |
| `agent` | Tất cả phiên của tác nhân này            |
| `all`   | Tất cả phiên (liên tác nhân nếu được cấu hình) |

Mặc định là `tree`. Phiên trong sandbox bị kẹp ở `tree` bất kể
cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session) -- định tuyến, vòng đời, bảo trì
- [Tác nhân ACP](/vi/tools/acp-agents) -- tạo harness bên ngoài
- [Đa tác nhân](/vi/concepts/multi-agent) -- kiến trúc đa tác nhân
- [Cấu hình Gateway](/vi/gateway/configuration) -- núm cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
