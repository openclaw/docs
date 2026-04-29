---
read_when:
    - Bạn muốn hiểu tác nhân có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập liên phiên hoặc khởi tạo tác nhân phụ
    - Bạn muốn kiểm tra trạng thái hoặc điều khiển các tác nhân phụ đã được tạo
summary: Công cụ tác nhân cho trạng thái, truy hồi, nhắn tin và điều phối tác nhân con qua nhiều phiên
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-04-29T22:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho agent các công cụ để làm việc qua nhiều phiên, kiểm tra trạng thái và
điều phối các sub-agent.

## Công cụ có sẵn

| Công cụ            | Chức năng                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, agent, độ gần đây, xem trước) |
| `sessions_history` | Đọc transcript của một phiên cụ thể                                         |
| `sessions_send`    | Gửi tin nhắn đến một phiên khác và tùy chọn chờ                             |
| `sessions_spawn`   | Tạo một phiên sub-agent cô lập cho công việc nền                            |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả sub-agent tiếp theo                   |
| `subagents`        | Liệt kê, điều hướng hoặc dừng các sub-agent đã tạo cho phiên này            |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè model theo từng phiên    |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính
sách cho phép/từ chối. `tools.profile: "coding"` bao gồm đầy đủ bộ điều phối
phiên, gồm `sessions_spawn`, `sessions_yield` và `subagents`.
`tools.profile: "messaging"` bao gồm các công cụ nhắn tin liên phiên
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng
không bao gồm việc tạo sub-agent. Để giữ hồ sơ nhắn tin và vẫn cho phép
ủy quyền gốc, hãy thêm:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Các chính sách theo nhóm, nhà cung cấp, sandbox và từng agent vẫn có thể loại bỏ
các công cụ đó sau giai đoạn hồ sơ. Dùng `/tools` từ phiên bị ảnh hưởng để kiểm
tra danh sách công cụ có hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các phiên cùng khóa, agentId, loại, kênh, model,
số lượng token và dấu thời gian. Lọc theo loại (`main`, `group`, `cron`, `hook`,
`node`), `label` chính xác, `agentId` chính xác, văn bản tìm kiếm hoặc độ gần đây
(`activeMinutes`). Khi bạn cần phân loại kiểu hộp thư, nó cũng có thể yêu cầu
tiêu đề dẫn xuất theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối hoặc các
tin nhắn gần đây có giới hạn trên mỗi hàng. Tiêu đề dẫn xuất và bản xem trước
chỉ được tạo cho các phiên mà người gọi đã có thể thấy theo chính sách hiển thị
công cụ phiên đã cấu hình, nên các phiên không liên quan vẫn bị ẩn.

`sessions_history` lấy transcript cuộc trò chuyện cho một phiên cụ thể.
Theo mặc định, kết quả công cụ bị loại trừ -- truyền `includeTools: true` để xem chúng.
Khung nhìn trả về được cố ý giới hạn và lọc an toàn:

- văn bản assistant được chuẩn hóa trước khi truy hồi:
  - các thẻ suy nghĩ bị loại bỏ
  - các khối khung dựng `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối payload XML gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và
    `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả các payload bị cắt ngắn
    không bao giờ đóng đúng cách
  - khung dựng gọi công cụ/kết quả công cụ bị hạ cấp như `[Tool Call: ...]`,
    `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển model bị rò rỉ như `<|assistant|>`, các token ASCII
    `<|...|>` khác và biến thể full-width `<｜...｜>` bị loại bỏ
  - XML gọi công cụ MiniMax không đúng định dạng như `<invoke ...>` /
    `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được biên tập lại trước khi trả về
- các khối văn bản dài bị cắt ngắn
- lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng
  `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` và `bytes`

Cả hai công cụ đều chấp nhận **khóa phiên** (như `"main"`) hoặc **ID phiên**
từ một lần gọi liệt kê trước đó.

Nếu bạn cần transcript chính xác từng byte, hãy kiểm tra tệp transcript trên
đĩa thay vì xem `sessions_history` như một bản dump thô.

## Gửi tin nhắn liên phiên

`sessions_send` chuyển một tin nhắn đến phiên khác và tùy chọn chờ phản hồi:

- **Gửi rồi bỏ qua:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về
  ngay lập tức.
- **Chờ trả lời:** đặt thời gian chờ và nhận phản hồi nội tuyến.

Tin nhắn và phản hồi tiếp theo A2A được đánh dấu là dữ liệu liên phiên trong
prompt nhận (`[Inter-session message ... isUser=false]`) và trong provenance
transcript. Agent nhận nên xem chúng là dữ liệu được định tuyến qua công cụ,
không phải là chỉ thị trực tiếp do người dùng cuối soạn.

Sau khi đích phản hồi, OpenClaw có thể chạy một **vòng trả lời ngược** trong đó
các agent luân phiên nhắn tin (tối đa 5 lượt). Agent đích có thể trả lời
`REPLY_SKIP` để dừng sớm.

## Trạng thái và trình trợ giúp điều phối

`session_status` là công cụ nhẹ tương đương `/status` cho phiên hiện tại
hoặc một phiên hiển thị khác. Nó báo cáo mức sử dụng, thời gian, trạng thái
model/runtime và ngữ cảnh tác vụ nền được liên kết khi có. Giống `/status`, nó có thể điền ngược
các bộ đếm token/cache thưa từ mục sử dụng transcript mới nhất, và
`model=default` xóa ghi đè theo từng phiên. Dùng `sessionKey="current"` cho
phiên hiện tại của người gọi; các nhãn client hiển thị như `openclaw-tui` không
phải là khóa phiên.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là
sự kiện tiếp theo mà bạn đang chờ. Dùng nó sau khi tạo sub-agent khi bạn muốn
kết quả hoàn tất đến dưới dạng tin nhắn tiếp theo thay vì xây dựng vòng lặp thăm dò.

`subagents` là trình trợ giúp mặt phẳng điều khiển cho các sub-agent OpenClaw
đã được tạo. Nó hỗ trợ:

- `action: "list"` để kiểm tra các lần chạy đang hoạt động/gần đây
- `action: "steer"` để gửi hướng dẫn tiếp theo đến một child đang chạy
- `action: "kill"` để dừng một child hoặc `all`

## Tạo sub-agent

`sessions_spawn` mặc định tạo một phiên cô lập cho tác vụ nền.
Nó luôn không chặn -- trả về ngay với `runId` và
`childSessionKey`.

Tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho agent harness bên ngoài.
- ghi đè `model` và `thinking` cho phiên child.
- `thread: true` để liên kết lần tạo với một luồng chat (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc sandboxing trên child.
- `context: "fork"` cho sub-agent gốc khi child cần transcript người yêu cầu hiện tại; bỏ qua hoặc dùng `context: "isolated"` cho child sạch.

Các sub-agent lá mặc định không nhận công cụ phiên. Khi
`maxSpawnDepth >= 2`, sub-agent điều phối ở độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để chúng
có thể quản lý child của chính mình. Các lần chạy lá vẫn không nhận công cụ
điều phối đệ quy.

Sau khi hoàn tất, một bước thông báo đăng kết quả lên kênh của người yêu cầu.
Việc chuyển phát hoàn tất giữ nguyên định tuyến thread/topic đã liên kết khi có, và nếu
nguồn hoàn tất chỉ nhận diện một kênh, OpenClaw vẫn có thể dùng lại tuyến đã lưu
của phiên người yêu cầu (`lastChannel` / `lastTo`) để chuyển phát trực tiếp.

Để biết hành vi riêng của ACP, xem [ACP Agents](/vi/tools/acp-agents).

## Khả năng hiển thị

Công cụ phiên được đặt phạm vi để giới hạn những gì agent có thể thấy:

| Cấp     | Phạm vi                                 |
| ------- | --------------------------------------- |
| `self`  | Chỉ phiên hiện tại                      |
| `tree`  | Phiên hiện tại + sub-agent đã tạo       |
| `agent` | Tất cả phiên cho agent này              |
| `all`   | Tất cả phiên (liên agent nếu được cấu hình) |

Mặc định là `tree`. Các phiên sandboxed bị kẹp ở `tree` bất kể cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session) -- định tuyến, vòng đời, bảo trì
- [ACP Agents](/vi/tools/acp-agents) -- tạo harness bên ngoài
- [Đa agent](/vi/concepts/multi-agent) -- kiến trúc đa agent
- [Cấu hình Gateway](/vi/gateway/configuration) -- núm cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
