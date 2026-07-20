---
read_when:
    - Bạn muốn tìm hiểu agent có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc khởi tạo tác tử phụ
    - Bạn muốn kiểm tra trạng thái của sub-agent đã được khởi tạo
summary: Các công cụ tác nhân để quản lý trạng thái liên phiên, truy hồi, nhắn tin và điều phối tác nhân phụ
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-07-20T04:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ceaf48addc9fc57afe2f6428cda03ed8b19f4efce93b13b58b7ef493a41c62fe
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho các agent các công cụ để làm việc xuyên suốt nhiều phiên, kiểm tra trạng thái và điều phối các sub-agent.

## Công cụ khả dụng

| Công cụ                 | Chức năng                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `sessions`           | Cập nhật các cài đặt phiên hiển thị và quản lý danh mục nhóm phiên toàn cục   |
| `sessions_list`      | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, agent, lưu trữ, xem trước) |
| `sessions_search`    | Tìm kiếm bản ghi các phiên hiển thị và trả về các đoạn trích khớp              |
| `sessions_history`   | Đọc bản ghi của một phiên cụ thể                                                |
| `sessions_send`      | Chạy một phiên khác trên cùng Gateway và tùy chọn chờ                           |
| `conversations_list` | Liệt kê các địa chỉ cuộc trò chuyện bên ngoài ổn định                            |
| `conversations_send` | Gửi đến chính xác một cuộc trò chuyện bên ngoài mà không chạy phiên cục bộ      |
| `conversations_turn` | Gửi đến chính xác một cuộc trò chuyện bên ngoài và chờ phản hồi tương quan       |
| `sessions_spawn`     | Khởi tạo một phiên sub-agent biệt lập cho công việc nền                          |
| `sessions_yield`     | Kết thúc lượt hiện tại và chờ kết quả tiếp theo từ sub-agent                     |
| `subagents`          | Liệt kê hoặc hủy công việc nền trong cây phiên này                               |
| `session_status`     | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình theo phiên    |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính sách cho phép/từ chối. `tools.profile: "coding"` bao gồm đầy đủ bộ công cụ điều phối phiên. `tools.profile: "messaging"` bao gồm khả năng tự phục vụ phiên, khám phá, truy hồi, nhắn tin xuyên phiên, công cụ cuộc trò chuyện bên ngoài và toàn bộ vòng đời khởi tạo (`sessions_spawn`, `sessions_yield` và `subagents`). Các công cụ đề xuất tác vụ chỉ dành cho UI là `spawn_task` và `dismiss_task` vẫn thuộc hồ sơ lập trình.

Các chính sách theo nhóm, nhà cung cấp, sandbox và từng agent vẫn có thể loại bỏ các công cụ đó sau giai đoạn áp dụng hồ sơ. Dùng `/tools` từ phiên bị ảnh hưởng để kiểm tra danh sách công cụ có hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các hàng khám phá cô đọng: khóa phiên, agent, loại, kênh, các trường nhãn/tiêu đề/xem trước, quan hệ cha và con, lần cập nhật gần nhất, trạng thái lưu trữ/ghim, phiên bản trạng thái, mô hình, số lượng token ngữ cảnh/tổng, trạng thái chạy và việc lần chạy gần nhất có bị hủy hay không. Lọc theo `kinds` (mảng; các giá trị được chấp nhận: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` chính xác, `agentId` chính xác, văn bản `search` hoặc độ gần đây (`activeMinutes`). Theo mặc định, các phiên đang hoạt động được trả về; truyền `archived: true` để kiểm tra các phiên đã lưu trữ. Đặt `includeDerivedTitles`, `includeLastMessage` hoặc `messageLimit` (giới hạn tối đa 20) khi cần phân loại kiểu hộp thư: tiêu đề suy ra trong phạm vi hiển thị, đoạn xem trước tin nhắn cuối hoặc các tin nhắn gần đây có giới hạn trên mỗi hàng. Thông tin định tuyến gửi, ID phiên nội bộ, thời gian/cài đặt theo từng lần chạy, ước tính chi phí và đường dẫn bản ghi được chủ ý lược bỏ; dùng `session_status`, các công cụ cuộc trò chuyện và `sessions_history` cho những chi tiết riêng theo chủ sở hữu đó. Tiêu đề và nội dung xem trước suy ra chỉ được tạo cho các phiên mà bên gọi đã có thể nhìn thấy theo chính sách hiển thị của công cụ phiên đã cấu hình, vì vậy các phiên không liên quan vẫn bị ẩn. Khi khả năng hiển thị bị hạn chế, `sessions_list` trả về siêu dữ liệu `visibility` tùy chọn, cho biết chế độ có hiệu lực và cảnh báo rằng kết quả có thể bị giới hạn theo phạm vi.

`sessions_history` truy xuất bản ghi cuộc trò chuyện của một phiên cụ thể. Theo mặc định, kết quả công cụ bị loại trừ; truyền `includeTools: true` để xem chúng. Dùng `limit` để lấy phần cuối mới nhất có giới hạn. Truyền `offset: 0` khi cần siêu dữ liệu phân trang, sau đó truyền các giá trị `nextOffset` được trả về để lùi qua các cửa sổ bản ghi OpenClaw cũ hơn mà không cần đọc tệp bản ghi thô. Các trang có độ lệch tường minh không hợp nhất dữ liệu nhập dự phòng từ CLI bên ngoài; dùng chế độ xem phần cuối mới nhất mặc định (không có `offset`) khi cần lịch sử hiển thị đã hợp nhất đó.

Chế độ xem được trả về được chủ ý giới hạn và lọc an toàn:

- văn bản của assistant được chuẩn hóa trước khi truy hồi:
  - các thẻ thinking bị loại bỏ
  - các khối khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối tải XML lời gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả tải bị cắt ngắn và không bao giờ đóng đúng cách
  - các khung lời gọi/kết quả công cụ đã hạ cấp như `[Tool Call: ...]`, `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII `<|...|>` khác và các biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML lời gọi công cụ MiniMax không hợp lệ như `<invoke ...>` / `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được che trước khi trả về
- các khối văn bản dài bị cắt ngắn
- lịch sử rất lớn có thể loại bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` và siêu dữ liệu phân trang

Dùng **khóa phiên** được trả về (như `"main"`) với `sessions_history`, `sessions_send` và `session_status`. Các công cụ đích đó cũng có thể phân giải một ID phiên đã biết, nhưng `sessions_list` không cung cấp ID nội bộ.

Nếu cần bản ghi thô chính xác, hãy kiểm tra các hàng bản ghi SQLite trong phạm vi thay vì coi `sessions_history` là dữ liệu kết xuất không được lọc.

Dùng [`sessions_search`](/vi/concepts/session-search) để truy hồi toàn văn chính xác trên văn bản bản ghi hiển thị của người dùng và assistant. Kết quả bao gồm `sessionKey` cho lời gọi `sessions_history` tiếp theo; cơ chế lọc theo khả năng hiển thị, che đoạn trích và giới hạn đầu ra khớp với ranh giới lịch sử.

## Quản lý cài đặt và nhóm phiên

Công cụ `sessions` có giới hạn theo chủ sở hữu cung cấp hai bề mặt tự phục vụ có giới hạn:

- `action: "patch"` thay đổi phiên hiện tại theo mặc định hoặc một phiên hiển thị khác được chọn bằng `sessionKey`. Công cụ này có thể đặt nhãn, biểu tượng thanh bên, trạng thái ghim/lưu trữ, mô hình và mức độ suy luận. Công cụ không cung cấp các thao tác đặt lại, xóa hoặc compact.
- `group_list`, `group_set`, `group_rename` và `group_delete` quản lý danh mục nhóm phiên toàn cục có thứ tự. `group_set` thay thế danh sách tên có thứ tự thay vì cập nhật một mục.

Bản cập nhật mô hình do agent chọn vẫn có thể hoàn tác cho đến khi lựa chọn đó hoàn tất một lần chạy thành công. Nếu mô hình đã chọn chắc chắn không thể dùng được do lỗi xác thực, thanh toán hoặc không tìm thấy mô hình, OpenClaw sẽ khôi phục mô hình trước đó và ghi một ghi chú hệ thống hiển thị. Các lỗi tạm thời về giới hạn tốc độ, quá tải, hết thời gian chờ, mạng và máy chủ không hoàn tác lựa chọn.

## Phiên và cuộc trò chuyện

Một **phiên** là ngữ cảnh mô hình cục bộ. Một **cuộc trò chuyện** là một địa chỉ bên ngoài chính xác, chẳng hạn như một đối tác, kênh hoặc luồng. Hai khái niệm này được liên kết nhưng không thể hoán đổi cho nhau: tin nhắn trực tiếp có thể dùng chung một phiên `main` trong khi vẫn giữ các địa chỉ cuộc trò chuyện riêng biệt.

`conversations_list` trả về các giá trị `conversationRef` không rõ nghĩa đối với agent đang hoạt động. Khi có `channel` tường minh, Gateway cũng làm mới các địa chỉ từ thư mục cục bộ của kênh đó, chẳng hạn như các đối tác Reef đã được phê duyệt; dùng `query` để tìm một đối tác cụ thể ngoài trang kết quả hiện tại. Quá trình khám phá lập danh mục địa chỉ mà không tạo phiên ngữ cảnh mô hình; phiên nền chỉ được tạo khi việc gửi hoặc ngữ cảnh đến cần đến. Việc khám phá và gửi cuộc trò chuyện chỉ dành cho chủ sở hữu vì chúng sử dụng thông tin xác thực kênh của Gateway. Dùng `conversations_send` để gửi không chờ phản hồi. Dùng `conversations_turn` khi phản hồi từ xa thuộc về lượt mô hình hiện tại: Gateway dành riêng một ID tin nhắn vận chuyển, lưu bền vững một thao tác gửi và ý định hàng đợi trước I/O vận chuyển, rồi trả về phản hồi tương quan từ công cụ thay vì bắt đầu lượt agent cục bộ thứ hai. Các thao tác gửi nằm ngoài bản ghi mô hình; phản hồi được ghi nhận chỉ được giữ lại như một hiện vật phụ trong khi kết quả công cụ sở hữu ngữ cảnh mô hình. Nếu Gateway khởi động lại sau khi đưa vào hàng đợi, việc gửi có thể phục hồi nhưng phản hồi đến sau sẽ theo cơ chế phân phối đầu vào thông thường vì trình chờ cục bộ theo tiến trình đã mất. Các tin nhắn đến không được yêu cầu luôn tiếp tục qua đường dẫn phân phối kênh thông thường.

Dùng công cụ `message` dùng chung khi đã có đích kênh thô tường minh hoặc cần một thao tác riêng theo kênh. Tham chiếu cuộc trò chuyện thuộc phạm vi agent đang hoạt động và phải được lấy thông qua `conversations_list`, không được tạo từ khóa phiên.

Trong Chế độ mã, các công cụ cuộc trò chuyện tái sử dụng chính xác hợp đồng đầu ra Gateway của chúng. Một ô `exec` duy nhất có thể liệt kê địa chỉ, chọn một `conversationRef` được trả về và gọi `conversations_send` hoặc `conversations_turn`; chính sách công cụ và phê duyệt thông thường vẫn áp dụng cho các lời gọi lồng nhau.

## Gửi tin nhắn xuyên phiên

`sessions_send` chạy một phiên khác trên cùng Gateway và tùy chọn chờ phản hồi. `sessionKey`, `label` hoặc `agentId` của công cụ chọn ngữ cảnh mô hình cục bộ, không phải đích bên ngoài. Phản hồi thu được vẫn có thể được thông báo thông qua ngữ cảnh gửi đã thiết lập của bên yêu cầu hoặc đích; hành vi hiện có đó không thay đổi. Để gửi chính xác ra bên ngoài, hãy dùng công cụ cuộc trò chuyện hoặc `message` với kênh và đích tường minh.

- **Gửi không chờ phản hồi:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về ngay.
- **Chờ phản hồi:** đặt thời gian chờ và nhận phản hồi trực tiếp.

Các phiên trò chuyện trong phạm vi luồng, chẳng hạn như khóa kết thúc bằng `:thread:<id>`, không phải là đích `sessions_send` hợp lệ. Dùng khóa phiên của kênh cha để phối hợp liên agent nhằm tránh các tin nhắn được định tuyến bằng công cụ xuất hiện trong một luồng đang hoạt động dành cho người dùng.

Tin nhắn và phản hồi tiếp theo A2A được đánh dấu là dữ liệu liên phiên trong lời nhắc nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi. Agent nhận phải coi chúng là dữ liệu được định tuyến bằng công cụ, không phải chỉ dẫn do người dùng cuối trực tiếp đưa ra.

Sau khi đích phản hồi, OpenClaw có thể chạy một **vòng lặp phản hồi ngược**, trong đó các agent luân phiên gửi tin nhắn cho đến giới hạn tích hợp sẵn. Agent đích có thể phản hồi `REPLY_SKIP` để dừng sớm.

Truyền `watch: true` để đồng thời đăng ký bên gửi làm trình theo dõi thay đổi trạng thái của đích: khi một tác nhân khác sau đó gửi trực tiếp một tin nhắn của con người đến đích hoặc thay đổi mục tiêu của đích, bên gửi sẽ nhận được thông báo hệ thống trỏ đến `session_status` `changesSince`. Việc đăng ký diễn ra sau khi gửi thành công, nhắm đến phiên thực sự nhận tin nhắn và bắt đầu tại phiên bản trạng thái hiện tại của phiên đó, vì vậy chỉ các thay đổi sau này mới tạo thông báo. Kết quả báo cáo `watched: true` khi đăng ký thành công. Xem [Nhận biết trạng thái phiên](/vi/concepts/session-state).

## Trình trợ giúp trạng thái và điều phối

`session_status` là công cụ nhẹ tương đương `/status` cho phiên hiện tại hoặc một phiên hiển thị khác. Công cụ báo cáo mức sử dụng, thời gian, trạng thái mô hình/môi trường chạy và ngữ cảnh tác vụ nền được liên kết nếu có. Giống như `/status`, công cụ có thể bổ sung các bộ đếm token/bộ nhớ đệm còn thiếu từ mục sử dụng mới nhất trong bản ghi, còn `model=default` xóa ghi đè theo phiên. Dùng `sessionKey="current"` cho phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là khóa phiên.

Khi có siêu dữ liệu tuyến, `session_status` cũng bao gồm một khối JSON `Route context` hiển thị và các trường `details` có cấu trúc tương ứng. Các trường này phân biệt rõ khóa phiên với tuyến hiện đang xử lý lượt chạy trực tiếp:

- `origin` là nơi phiên được tạo, hoặc nhà cung cấp được suy ra từ tiền tố khóa phiên có thể phân phối khi trạng thái cũ không có siêu dữ liệu nguồn gốc đã lưu.
- `active` là tuyến của lượt chạy trực tiếp hiện tại. Tuyến này chỉ được báo cáo cho phiên trực tiếp hoặc phiên hiện tại đang được xử lý.
- `deliveryContext` là tuyến phân phối được duy trì lâu dài và lưu trên phiên, OpenClaw có thể tái sử dụng tuyến này cho lần phân phối sau ngay cả khi bề mặt đang hoạt động khác đi.

## Thay đổi trạng thái phiên

OpenClaw lưu giữ một nhật ký tín hiệu bền vững về các thay đổi quan trọng đối với trạng thái phiên (tin nhắn trực tiếp của con người đến các phiên được theo dõi, kết quả lượt chạy con, thay đổi mục tiêu, Compaction). Các hàng `sessions_list` và `session_status` cung cấp `stateVersion` của phiên, còn `session_status` chấp nhận `changesSince: <version>` để trả về các sự kiện có kiểu sau phiên bản đó, với tín hiệu `historyGap` chính xác khi phiên bản được yêu cầu có trước lịch sử còn được lưu giữ. Các trình theo dõi — tự động theo dõi phiên cha khi tạo, hoặc theo dõi rõ ràng bằng `sessions_send watch: true` — nhận một thông báo trạng thái cũ đã được gộp khi một tác nhân khác thay đổi phiên đang được theo dõi.

Các sự kiện thay đổi trạng thái lược bỏ ID phiên/tác nhân lặp lại và chỉ cung cấp các trường tải trọng hữu ích cho mô hình (`outcome`, `channel` hoặc `turns`). Bản tóm tắt sự kiện cùng các mã định danh tác nhân/lượt chạy vẫn có sẵn để đối soát.

Xem [Nhận biết trạng thái phiên](/vi/concepts/session-state) để biết mô hình đầy đủ: các loại sự kiện, đăng ký trình theo dõi, giao thức thông báo chống thư rác, luồng đối soát và các giới hạn hiện tại.

`sessions_yield` cố ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là sự kiện tiếp nối mà bạn đang chờ. Hãy dùng tùy chọn này sau khi tạo các tác nhân phụ nếu bạn muốn kết quả hoàn thành xuất hiện dưới dạng tin nhắn tiếp theo thay vì xây dựng các vòng lặp thăm dò.

`subagents` là chế độ xem cây phiên bao quát các lượt chạy tác nhân phụ gốc và sổ cái tác vụ nền dùng chung. `action: "list"` báo cáo các tác nhân phụ đang hoạt động/gần đây cùng các tác vụ ACP, CLI/phương tiện và Cron theo phạm vi. `action: "cancel"` chấp nhận một `taskId` được trả về và chỉ có thể dừng công việc bên trong cây phiên do bên gọi kiểm soát; tác nhân phụ lá không thể hủy tác vụ của phiên khác.

## Tạo tác nhân phụ

Theo mặc định, `sessions_spawn` tạo một phiên biệt lập cho tác vụ nền. Thao tác này luôn không chặn; nó trả về ngay lập tức với một `runId` và `childSessionKey`. Các lượt chạy tác nhân phụ gốc nhận tác vụ được ủy quyền trong tin nhắn `[Subagent Task]` hiển thị đầu tiên của phiên con, còn lời nhắc hệ thống chỉ mang các quy tắc thời gian chạy của tác nhân phụ và ngữ cảnh định tuyến.

Các tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` dành cho tác nhân của bộ khung bên ngoài.
- Ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để liên kết lần tạo với một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc áp dụng cơ chế hộp cát cho phiên con.
- `context: "fork"` dành cho tác nhân phụ gốc khi phiên con cần bản chép lại của người yêu cầu hiện tại; bỏ qua tùy chọn này hoặc dùng `context: "isolated"` để tạo một phiên con sạch. `context: "fork"` chỉ hợp lệ với `runtime: "subagent"`. Theo mặc định, tác nhân phụ gốc được liên kết với luồng sử dụng `context: "fork"`, trừ khi `threadBindings.defaultSpawnContext` quy định khác.
- `visible: true` để tạo một phiên bảng điều khiển lâu dài thay vì một phiên tác nhân phụ ẩn. Các lần tạo hiển thị hỗ trợ mô hình được chỉ định rõ ràng, thư mục làm việc, bản phân nhánh bản chép lại của cùng tác nhân và một [cây làm việc được quản lý](/vi/concepts/managed-worktrees) tùy chọn; xem [Tác nhân phụ](/vi/tools/subagents#tool-parameters) để biết chính xác các giới hạn tương thích.

Theo mặc định, tác nhân phụ lá không nhận được công cụ phiên. Khi `maxSpawnDepth >= 2`, tác nhân phụ điều phối cấp độ 1 còn nhận được `sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để có thể quản lý các tác nhân con của chính mình. Các lượt chạy lá vẫn không nhận được công cụ điều phối đệ quy.

Sau khi hoàn tất, một bước thông báo sẽ đăng kết quả lên kênh của người yêu cầu. Việc phân phối kết quả hoàn thành duy trì định tuyến luồng/chủ đề đã liên kết khi có sẵn, và nếu nguồn hoàn thành chỉ xác định một kênh, OpenClaw vẫn có thể tái sử dụng tuyến đã lưu của phiên người yêu cầu (`lastChannel` / `lastTo`) để phân phối trực tiếp.

Để biết hành vi dành riêng cho ACP, xem [Tác nhân ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Các công cụ phiên được giới hạn phạm vi để hạn chế những gì tác nhân có thể thấy:

| Cấp độ   | Phạm vi                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | Chỉ phiên hiện tại                                   |
| `tree`  | Phiên hiện tại + các phiên đã tạo; thao tác đọc bao gồm các nhóm cùng tác nhân đang được theo dõi |
| `agent` | Tất cả phiên của tác nhân này                                |
| `all`   | Tất cả phiên (giữa các tác nhân nếu được cấu hình)                   |

Mặc định là `tree`. Các phiên trong hộp cát bị giới hạn ở `tree` bất kể cấu hình.
Với `session.dmScope: "main"` mặc định, hoạt động nhóm khiến các phiên nhóm
cùng tác nhân đang được theo dõi có thể được đọc từ phiên chính.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session): định tuyến, vòng đời, bảo trì
- [Tác nhân phụ](/vi/tools/subagents): vòng đời và phân phối của phiên con
- [Tác nhân ACP](/vi/tools/acp-agents): tạo bộ khung bên ngoài
- [Đa tác nhân](/vi/concepts/multi-agent): kiến trúc đa tác nhân
- [Cấu hình Gateway](/vi/gateway/configuration): các tùy chọn cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Lược bớt phiên](/vi/concepts/session-pruning)
