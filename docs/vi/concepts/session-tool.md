---
read_when:
    - Bạn muốn hiểu tác tử có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc việc tạo tác nhân phụ
    - Bạn muốn kiểm tra trạng thái hoặc điều khiển các tác nhân con đã được tạo
summary: Công cụ tác nhân cho trạng thái liên phiên, truy hồi, nhắn tin và điều phối tác nhân phụ
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-05-02T10:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho tác nhân các công cụ để làm việc xuyên phiên, kiểm tra trạng thái và
điều phối các tác nhân phụ.

## Công cụ có sẵn

| Công cụ            | Chức năng                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, tác nhân, độ gần đây, xem trước) |
| `sessions_history` | Đọc bản ghi hội thoại của một phiên cụ thể                                   |
| `sessions_send`    | Gửi tin nhắn tới phiên khác và tùy chọn chờ                                  |
| `sessions_spawn`   | Sinh một phiên tác nhân phụ cô lập cho công việc nền                         |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả theo dõi từ tác nhân phụ               |
| `subagents`        | Liệt kê, điều hướng hoặc dừng các tác nhân phụ đã sinh cho phiên này         |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình theo từng phiên   |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính sách
cho phép/từ chối. `tools.profile: "coding"` bao gồm đầy đủ bộ điều phối phiên,
bao gồm `sessions_spawn`, `sessions_yield` và `subagents`.
`tools.profile: "messaging"` bao gồm các công cụ nhắn tin xuyên phiên
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng
không bao gồm việc sinh tác nhân phụ. Để giữ hồ sơ nhắn tin và vẫn cho phép
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
danh sách công cụ hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các phiên với key, agentId, loại, kênh, mô hình,
số lượng token và dấu thời gian. Lọc theo loại (`main`, `group`, `cron`, `hook`,
`node`), `label` chính xác, `agentId` chính xác, văn bản tìm kiếm hoặc độ gần đây
(`activeMinutes`). Khi cần phân loại kiểu hộp thư, công cụ này cũng có thể yêu cầu
một tiêu đề dẫn xuất theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối hoặc các
tin nhắn gần đây có giới hạn trên mỗi hàng. Tiêu đề dẫn xuất và bản xem trước chỉ được tạo cho
các phiên mà bên gọi đã có thể thấy theo chính sách hiển thị công cụ phiên đã cấu hình,
nên các phiên không liên quan vẫn bị ẩn.

`sessions_history` lấy bản ghi hội thoại cho một phiên cụ thể.
Theo mặc định, kết quả công cụ bị loại trừ -- truyền `includeTools: true` để xem chúng.
Khung nhìn trả về được cố ý giới hạn và lọc an toàn:

- văn bản assistant được chuẩn hóa trước khi truy xuất:
  - các thẻ suy nghĩ bị loại bỏ
  - các khối khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối payload XML lệnh gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và
    `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả payload bị cắt ngắn
    chưa bao giờ đóng sạch
  - khung lệnh gọi/kết quả công cụ bị hạ cấp như `[Tool Call: ...]`,
    `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII
    `<|...|>` khác và biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML lệnh gọi công cụ MiniMax sai định dạng như `<invoke ...>` /
    `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được biên tập ẩn trước khi trả về
- các khối văn bản dài bị cắt ngắn
- lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng
  `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` và `bytes`

Cả hai công cụ đều chấp nhận **key phiên** (như `"main"`) hoặc **ID phiên**
từ một lệnh liệt kê trước đó.

Nếu bạn cần bản ghi chính xác từng byte, hãy kiểm tra tệp bản ghi trên
đĩa thay vì xem `sessions_history` như một bản kết xuất thô.

## Gửi tin nhắn xuyên phiên

`sessions_send` chuyển một tin nhắn tới phiên khác và tùy chọn chờ
phản hồi:

- **Gửi rồi bỏ qua:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về
  ngay lập tức.
- **Chờ trả lời:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên chat theo phạm vi luồng, chẳng hạn các key Slack hoặc Discord kết thúc bằng
`:thread:<id>`, không phải là đích `sessions_send` hợp lệ. Dùng key phiên kênh cha
để phối hợp liên tác nhân, để tin nhắn được định tuyến qua công cụ không xuất hiện
bên trong một luồng đang hướng tới người dùng.

Tin nhắn và phản hồi theo dõi A2A được đánh dấu là dữ liệu liên phiên trong prompt
nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi.
Tác nhân nhận nên xử lý chúng như dữ liệu được định tuyến qua công cụ, không phải như
chỉ dẫn trực tiếp do người dùng cuối viết.

Sau khi đích phản hồi, OpenClaw có thể chạy **vòng lặp trả lời lại** trong đó
các tác nhân luân phiên gửi tin nhắn (tối đa 5 lượt). Tác nhân đích có thể trả lời
`REPLY_SKIP` để dừng sớm.

## Trạng thái và trình trợ giúp điều phối

`session_status` là công cụ tương đương `/status` nhẹ cho phiên hiện tại
hoặc một phiên hiển thị khác. Nó báo cáo mức sử dụng, thời gian, trạng thái mô hình/runtime và
ngữ cảnh tác vụ nền được liên kết khi có. Giống `/status`, nó có thể điền ngược
bộ đếm token/cache thưa từ mục sử dụng mới nhất trong bản ghi, và
`model=default` xóa ghi đè theo từng phiên. Dùng `sessionKey="current"` cho
phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là
key phiên.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là
sự kiện theo dõi mà bạn đang chờ. Dùng nó sau khi sinh tác nhân phụ khi
bạn muốn kết quả hoàn tất đến dưới dạng tin nhắn tiếp theo thay vì xây dựng
vòng lặp thăm dò.

`subagents` là trình trợ giúp mặt phẳng điều khiển cho các tác nhân phụ OpenClaw
đã được sinh. Nó hỗ trợ:

- `action: "list"` để kiểm tra các lượt chạy đang hoạt động/gần đây
- `action: "steer"` để gửi hướng dẫn theo dõi tới một tiến trình con đang chạy
- `action: "kill"` để dừng một tiến trình con hoặc `all`

## Sinh tác nhân phụ

`sessions_spawn` mặc định tạo một phiên cô lập cho tác vụ nền.
Nó luôn không chặn -- nó trả về ngay với `runId` và
`childSessionKey`.

Tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho tác nhân harness bên ngoài.
- Ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để gắn lượt sinh với một luồng chat (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc sandboxing trên tiến trình con.
- `context: "fork"` cho tác nhân phụ gốc khi tiến trình con cần bản ghi của bên yêu cầu hiện tại;
  bỏ qua hoặc dùng `context: "isolated"` cho một tiến trình con sạch.
  Tác nhân phụ gốc gắn với luồng mặc định dùng `context: "fork"` trừ khi
  `threadBindings.defaultSpawnContext` quy định khác.

Tác nhân phụ lá mặc định không nhận công cụ phiên. Khi
`maxSpawnDepth >= 2`, tác nhân phụ điều phối độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để chúng
có thể quản lý tiến trình con của riêng mình. Các lượt chạy lá vẫn không nhận công cụ
điều phối đệ quy.

Sau khi hoàn tất, bước thông báo đăng kết quả lên kênh của bên yêu cầu.
Việc chuyển phát hoàn tất bảo toàn định tuyến luồng/chủ đề đã gắn khi có, và nếu
nguồn hoàn tất chỉ xác định một kênh, OpenClaw vẫn có thể tái sử dụng
tuyến đã lưu của phiên yêu cầu (`lastChannel` / `lastTo`) để chuyển phát trực tiếp.

Để biết hành vi riêng của ACP, xem [Tác nhân ACP](/vi/tools/acp-agents).

## Hiển thị

Công cụ phiên được giới hạn phạm vi để hạn chế những gì tác nhân có thể thấy:

| Cấp độ  | Phạm vi                                  |
| ------- | ---------------------------------------- |
| `self`  | Chỉ phiên hiện tại                       |
| `tree`  | Phiên hiện tại + tác nhân phụ đã sinh    |
| `agent` | Tất cả phiên cho tác nhân này            |
| `all`   | Tất cả phiên (xuyên tác nhân nếu đã cấu hình) |

Mặc định là `tree`. Các phiên trong sandbox bị kẹp về `tree` bất kể
cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session) -- định tuyến, vòng đời, bảo trì
- [Tác nhân ACP](/vi/tools/acp-agents) -- sinh harness bên ngoài
- [Đa tác nhân](/vi/concepts/multi-agent) -- kiến trúc đa tác nhân
- [Cấu hình Gateway](/vi/gateway/configuration) -- nút cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
