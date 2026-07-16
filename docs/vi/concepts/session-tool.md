---
read_when:
    - Bạn muốn tìm hiểu tác nhân có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc khởi tạo tác nhân phụ
    - Bạn muốn kiểm tra trạng thái của sub-agent đã được khởi tạo
summary: Các công cụ tác nhân để quản lý trạng thái giữa các phiên, truy hồi, nhắn tin và điều phối tác nhân phụ
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-07-16T15:11:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho các agent các công cụ để làm việc xuyên suốt nhiều phiên, kiểm tra trạng thái và điều phối các sub-agent.

## Các công cụ có sẵn

| Công cụ               | Chức năng                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, agent, lưu trữ, bản xem trước)  |
| `sessions_history` | Đọc bản chép lời của một phiên cụ thể                                   |
| `sessions_send`    | Gửi thông báo đến một phiên khác và tùy chọn chờ                       |
| `sessions_spawn`   | Khởi tạo một phiên sub-agent biệt lập để thực hiện công việc nền                     |
| `sessions_yield`   | Kết thúc lượt hiện tại và chờ kết quả tiếp theo từ sub-agent               |
| `subagents`        | Liệt kê trạng thái của các sub-agent đã khởi tạo cho phiên này                              |
| `session_status`   | Hiển thị thẻ kiểu `/status` và tùy chọn đặt giá trị ghi đè mô hình cho từng phiên |

Các công cụ này vẫn chịu sự điều chỉnh của hồ sơ công cụ đang hoạt động và chính sách cho phép/từ chối. `tools.profile: "coding"` bao gồm toàn bộ bộ công cụ điều phối phiên, trong đó có `sessions_spawn`, `sessions_yield` và `subagents`. `tools.profile: "messaging"` bao gồm các công cụ nhắn tin liên phiên (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) nhưng không bao gồm việc khởi tạo sub-agent. Để duy trì hồ sơ nhắn tin mà vẫn cho phép ủy quyền gốc, hãy thêm:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Các chính sách về nhóm, nhà cung cấp, sandbox và từng agent vẫn có thể loại bỏ những công cụ đó sau giai đoạn áp dụng hồ sơ. Sử dụng `/tools` từ phiên bị ảnh hưởng để kiểm tra danh sách công cụ có hiệu lực.

## Liệt kê và đọc các phiên

`sessions_list` trả về các phiên cùng với khóa, agentId, loại, kênh, mô hình, số lượng token và dấu thời gian. Lọc theo `kinds` (mảng; các giá trị được chấp nhận: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` chính xác, `agentId` chính xác, văn bản `search` hoặc độ gần đây (`activeMinutes`). Theo mặc định, các phiên đang hoạt động được trả về; thay vào đó, truyền `archived: true` để kiểm tra các phiên đã lưu trữ. Các hàng bao gồm trạng thái `pinned` và `archived`. Đặt `includeDerivedTitles`, `includeLastMessage` hoặc `messageLimit` (tối đa 20) khi cần phân loại theo kiểu hộp thư: tiêu đề suy ra trong phạm vi hiển thị, đoạn xem trước của thông báo cuối cùng hoặc số lượng giới hạn các thông báo gần đây trên mỗi hàng. Tiêu đề và bản xem trước suy ra chỉ được tạo cho các phiên mà bên gọi đã có thể xem theo chính sách hiển thị công cụ phiên đã cấu hình, do đó các phiên không liên quan vẫn bị ẩn. Khi khả năng hiển thị bị hạn chế, `sessions_list` trả về siêu dữ liệu `visibility` tùy chọn, cho biết chế độ có hiệu lực và cảnh báo rằng kết quả có thể bị giới hạn theo phạm vi.

`sessions_history` truy xuất bản chép lời cuộc trò chuyện của một phiên cụ thể. Theo mặc định, kết quả công cụ bị loại trừ; truyền `includeTools: true` để xem chúng. Sử dụng `limit` để lấy phần cuối mới nhất có giới hạn. Truyền `offset: 0` khi cần siêu dữ liệu phân trang, sau đó truyền các giá trị `nextOffset` được trả về để phân trang ngược qua các cửa sổ bản chép lời OpenClaw cũ hơn mà không cần đọc các tệp bản chép lời thô. Các trang có độ lệch được chỉ định rõ ràng không hợp nhất dữ liệu nhập dự phòng từ CLI bên ngoài; sử dụng chế độ xem phần cuối mới nhất mặc định (không có `offset`) khi cần lịch sử hiển thị đã hợp nhất đó.

Chế độ xem được trả về được cố ý giới hạn và lọc an toàn:

- văn bản của assistant được chuẩn hóa trước khi truy hồi:
  - các thẻ thinking bị loại bỏ
  - các khối khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối tải trọng XML gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả tải trọng bị cắt ngắn và không bao giờ đóng đúng cách
  - các khung gọi công cụ/kết quả bị hạ cấp như `[Tool Call: ...]`, `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII `<|...|>` khác và các biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML gọi công cụ MiniMax không đúng định dạng như `<invoke ...>` / `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được che trước khi trả về
- các khối văn bản dài bị cắt ngắn
- lịch sử rất lớn có thể loại bỏ các hàng cũ hơn hoặc thay thế một hàng quá lớn bằng `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` và siêu dữ liệu phân trang

Cả hai công cụ đều chấp nhận **khóa phiên** (như `"main"`) hoặc **ID phiên** từ một lần gọi danh sách trước đó.

Nếu cần bản chép lời thô chính xác, hãy kiểm tra các hàng bản chép lời SQLite trong phạm vi thay vì coi `sessions_history` là một bản kết xuất chưa lọc.

## Gửi thông báo liên phiên

`sessions_send` chuyển một thông báo đến phiên khác và tùy chọn chờ phản hồi:

- **Gửi và không chờ:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về ngay lập tức.
- **Chờ phản hồi:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên trò chuyện trong phạm vi luồng, chẳng hạn như các khóa kết thúc bằng `:thread:<id>`, không phải là mục tiêu `sessions_send` hợp lệ. Sử dụng khóa phiên kênh cha để phối hợp giữa các agent, nhờ đó thông báo được định tuyến qua công cụ không xuất hiện bên trong một luồng đang hoạt động dành cho người dùng.

Các thông báo và phản hồi tiếp nối A2A được đánh dấu là dữ liệu liên phiên trong lời nhắc nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản chép lời. Agent nhận nên coi chúng là dữ liệu được định tuyến qua công cụ, không phải là chỉ thị do người dùng cuối trực tiếp viết.

Sau khi mục tiêu phản hồi, OpenClaw có thể chạy **vòng lặp phản hồi qua lại**, trong đó các agent luân phiên gửi thông báo (tối đa `session.agentToAgent.maxPingPongTurns`, phạm vi 0-20, mặc định 5). Agent mục tiêu có thể phản hồi `REPLY_SKIP` để dừng sớm.

Truyền `watch: true` để đồng thời đăng ký bên gửi làm trình theo dõi thay đổi trạng thái của mục tiêu: khi một tác nhân khác sau đó gửi cho mục tiêu một thông báo trực tiếp từ người dùng hoặc thay đổi mục tiêu của phiên, bên gửi sẽ nhận được thông báo hệ thống trỏ đến `session_status` `changesSince`. Việc đăng ký diễn ra sau khi điều phối thành công, nhắm đến phiên thực sự đã nhận thông báo và bắt đầu tại phiên bản trạng thái hiện tại của phiên đó, vì vậy chỉ các thay đổi sau này mới tạo ra thông báo. Kết quả báo cáo `watched: true` khi đăng ký thành công. Xem [Nhận biết trạng thái phiên](/concepts/session-state).

## Trình trợ giúp trạng thái và điều phối

`session_status` là công cụ nhẹ tương đương với `/status` dành cho phiên hiện tại hoặc một phiên hiển thị khác. Công cụ này báo cáo mức sử dụng, thời gian, trạng thái mô hình/môi trường chạy và ngữ cảnh tác vụ nền được liên kết khi có. Giống như `/status`, công cụ có thể điền bổ sung các bộ đếm token/bộ nhớ đệm còn thiếu từ mục sử dụng mới nhất trong bản chép lời, và `model=default` xóa giá trị ghi đè cho từng phiên. Sử dụng `sessionKey="current"` cho phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là khóa phiên.

Khi có siêu dữ liệu định tuyến, `session_status` cũng bao gồm một khối JSON `Route context` hiển thị và các trường `details` có cấu trúc tương ứng. Các trường này phân biệt khóa phiên với tuyến hiện đang xử lý lượt chạy trực tiếp:

- `origin` là nơi phiên được tạo hoặc nhà cung cấp được suy ra từ tiền tố khóa phiên có thể phân phối khi trạng thái cũ thiếu siêu dữ liệu nguồn gốc đã lưu.
- `active` là tuyến chạy trực tiếp hiện tại. Trường này chỉ được báo cáo cho phiên trực tiếp hoặc phiên hiện tại đang được xử lý.
- `deliveryContext` là tuyến phân phối được lưu bền vững trên phiên mà OpenClaw có thể tái sử dụng cho lần phân phối sau ngay cả khi bề mặt đang hoạt động khác đi.

## Thay đổi trạng thái phiên

OpenClaw lưu giữ một nhật ký tín hiệu bền vững về các thay đổi trạng thái phiên quan trọng (thông báo trực tiếp từ người dùng đến các phiên đang được theo dõi, kết quả lượt chạy con, thay đổi mục tiêu, Compaction). Các hàng `sessions_list` và `session_status` hiển thị `stateVersion` của phiên, còn `session_status` chấp nhận `changesSince: <version>` để trả về các sự kiện có kiểu sau phiên bản đó, với `historyGap` chính xác báo hiệu khi phiên bản được yêu cầu có trước lịch sử được lưu giữ. Các trình theo dõi — tự động đối với phiên cha đã khởi tạo, rõ ràng qua `sessions_send watch: true` — nhận một thông báo trạng thái cũ đã hợp nhất khi một tác nhân khác thay đổi phiên đang được theo dõi.

Xem [Nhận biết trạng thái phiên](/concepts/session-state) để biết mô hình đầy đủ: các loại sự kiện, đăng ký trình theo dõi, giao thức thông báo chống thư rác, quy trình đối soát và các giới hạn hiện tại.

`sessions_yield` cố ý kết thúc lượt hiện tại để thông báo tiếp theo có thể là sự kiện tiếp nối mà bạn đang chờ. Sử dụng công cụ này sau khi khởi tạo các sub-agent nếu muốn kết quả hoàn thành đến dưới dạng thông báo tiếp theo thay vì xây dựng các vòng lặp thăm dò.

`subagents` là trình trợ giúp hiển thị dành cho các sub-agent OpenClaw đã được khởi tạo. Công cụ hỗ trợ `action: "list"` để kiểm tra các lượt chạy đang hoạt động/gần đây.

## Khởi tạo sub-agent

Theo mặc định, `sessions_spawn` tạo một phiên biệt lập cho tác vụ nền. Công cụ luôn không chặn; nó trả về ngay lập tức với `runId` và `childSessionKey`. Các lượt chạy sub-agent gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên của phiên con, trong khi lời nhắc hệ thống chỉ chứa các quy tắc môi trường chạy sub-agent và ngữ cảnh định tuyến.

Các tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho các agent của bộ khung bên ngoài.
- Giá trị ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để liên kết việc khởi tạo với một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc áp dụng sandbox cho phiên con.
- `context: "fork"` dành cho các sub-agent gốc khi phiên con cần bản chép lời hiện tại của người yêu cầu; bỏ qua hoặc sử dụng `context: "isolated"` để có một phiên con sạch. `context: "fork"` chỉ hợp lệ với `runtime: "subagent"`. Các sub-agent gốc liên kết với luồng mặc định sử dụng `context: "fork"` trừ khi `threadBindings.defaultSpawnContext` quy định khác.

Theo mặc định, các sub-agent lá không nhận được công cụ phiên. Khi `maxSpawnDepth >= 2`, các sub-agent điều phối ở độ sâu 1 còn nhận thêm `sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để có thể quản lý các phiên con của chính mình. Các lượt chạy lá vẫn không nhận được công cụ điều phối đệ quy.

Sau khi hoàn thành, một bước thông báo sẽ đăng kết quả lên kênh của người yêu cầu. Việc phân phối kết quả hoàn thành giữ nguyên định tuyến luồng/chủ đề đã liên kết khi có, và nếu nguồn gốc hoàn thành chỉ xác định được một kênh, OpenClaw vẫn có thể tái sử dụng tuyến đã lưu của phiên người yêu cầu (`lastChannel` / `lastTo`) để phân phối trực tiếp.

Để biết hành vi dành riêng cho ACP, hãy xem [Agent ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Các công cụ phiên được giới hạn phạm vi để hạn chế những gì agent có thể xem:

| Mức   | Phạm vi                                    |
| ------- | ---------------------------------------- |
| `self`  | Chỉ phiên hiện tại                 |
| `tree`  | Phiên hiện tại + các sub-agent đã khởi tạo     |
| `agent` | Tất cả các phiên của agent này              |
| `all`   | Tất cả các phiên (liên agent nếu được cấu hình) |

Mặc định là `tree`. Các phiên trong sandbox bị giới hạn ở `tree` bất kể cấu hình.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session): định tuyến, vòng đời, bảo trì
- [Tác tử con](/vi/tools/subagents): vòng đời và phân phối phiên con
- [Tác tử ACP](/vi/tools/acp-agents): khởi tạo bộ điều phối bên ngoài
- [Đa tác tử](/vi/concepts/multi-agent): kiến trúc đa tác tử
- [Cấu hình Gateway](/vi/gateway/configuration): các tùy chọn cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Lược bỏ phiên](/vi/concepts/session-pruning)
