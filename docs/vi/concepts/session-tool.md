---
read_when:
    - Bạn muốn hiểu agent có những công cụ phiên nào
    - Bạn muốn cấu hình quyền truy cập giữa các phiên hoặc khởi tạo tác nhân phụ
    - Bạn muốn kiểm tra trạng thái của sub-agent đã được khởi tạo
summary: Các công cụ tác tử để quản lý trạng thái xuyên phiên, truy hồi, nhắn tin và điều phối tác tử phụ
title: Công cụ phiên làm việc
x-i18n:
    generated_at: "2026-07-19T05:50:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1c24643d16936ea5e01797d59b11b5e72235b4a723c5b76e56618512c8ca8d3
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw cung cấp cho tác tử các công cụ để làm việc xuyên suốt các phiên, kiểm tra trạng thái và điều phối các tác tử con.

## Các công cụ có sẵn

| Công cụ                 | Chức năng                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| `sessions`           | Chỉnh sửa các cài đặt phiên hiển thị và quản lý danh mục nhóm phiên toàn cục |
| `sessions_list`      | Liệt kê các phiên với bộ lọc tùy chọn (loại, nhãn, tác tử, kho lưu trữ, bản xem trước) |
| `sessions_search`    | Tìm kiếm bản ghi hội thoại của các phiên hiển thị và trả về các đoạn trích khớp |
| `sessions_history`   | Đọc bản ghi hội thoại của một phiên cụ thể |
| `sessions_send`      | Chạy một phiên khác trên cùng Gateway và tùy chọn chờ |
| `conversations_list` | Liệt kê các địa chỉ cuộc hội thoại bên ngoài ổn định |
| `conversations_send` | Gửi đến chính xác một cuộc hội thoại bên ngoài mà không chạy phiên cục bộ |
| `conversations_turn` | Gửi đến chính xác một cuộc hội thoại bên ngoài và chờ phản hồi tương ứng |
| `sessions_spawn`     | Khởi tạo một phiên tác tử con biệt lập để làm việc trong nền |
| `sessions_yield`     | Kết thúc lượt hiện tại và chờ kết quả tiếp theo từ tác tử con |
| `subagents`          | Liệt kê hoặc hủy công việc nền trong cây phiên này |
| `session_status`     | Hiển thị thẻ kiểu `/status` và tùy chọn đặt ghi đè mô hình theo từng phiên |

Các công cụ này vẫn chịu sự chi phối của hồ sơ công cụ đang hoạt động và chính sách cho phép/từ chối. `tools.profile: "coding"` bao gồm toàn bộ bộ công cụ điều phối phiên. `tools.profile: "messaging"` bao gồm chức năng tự phục vụ phiên, khám phá, truy hồi, nhắn tin xuyên phiên, các công cụ cuộc hội thoại bên ngoài và toàn bộ vòng đời khởi tạo (`sessions_spawn`, `sessions_yield` và `subagents`). Các công cụ đề xuất tác vụ chỉ dành cho giao diện người dùng `spawn_task` và `dismiss_task` vẫn là các công cụ thuộc hồ sơ lập trình.

Các chính sách nhóm, nhà cung cấp, sandbox và theo từng tác tử vẫn có thể loại bỏ những công cụ đó sau giai đoạn hồ sơ. Sử dụng `/tools` từ phiên bị ảnh hưởng để kiểm tra danh sách công cụ có hiệu lực.

## Liệt kê và đọc phiên

`sessions_list` trả về các hàng khám phá trọng tâm: khóa phiên, tác tử, loại, kênh, các trường nhãn/tiêu đề/bản xem trước, quan hệ cha và con, lần cập nhật cuối, trạng thái lưu trữ/ghim, phiên bản trạng thái, mô hình, số lượng token ngữ cảnh/tổng, trạng thái chạy và liệu lần chạy cuối có bị hủy hay không. Lọc theo `kinds` (mảng; các giá trị được chấp nhận: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` chính xác, `agentId` chính xác, văn bản `search` hoặc độ gần đây (`activeMinutes`). Theo mặc định, các phiên đang hoạt động được trả về; truyền `archived: true` để thay vào đó kiểm tra các phiên đã lưu trữ. Đặt `includeDerivedTitles`, `includeLastMessage` hoặc `messageLimit` (giới hạn tối đa là 20) khi cần phân loại theo kiểu hộp thư: tiêu đề dẫn xuất giới hạn theo phạm vi hiển thị, đoạn xem trước tin nhắn cuối hoặc các tin nhắn gần đây có giới hạn trên mỗi hàng. Thông tin định tuyến phân phối, ID phiên nội bộ, thời gian/cài đặt theo từng lần chạy, ước tính chi phí và đường dẫn bản ghi hội thoại được chủ ý lược bỏ; sử dụng `session_status`, các công cụ cuộc hội thoại và `sessions_history` để xem các chi tiết dành riêng cho chủ sở hữu đó. Tiêu đề và bản xem trước dẫn xuất chỉ được tạo cho các phiên mà bên gọi đã có thể thấy theo chính sách hiển thị công cụ phiên đã cấu hình, vì vậy các phiên không liên quan vẫn bị ẩn. Khi khả năng hiển thị bị hạn chế, `sessions_list` trả về siêu dữ liệu `visibility` tùy chọn, cho biết chế độ có hiệu lực và cảnh báo rằng kết quả có thể bị giới hạn theo phạm vi.

`sessions_history` truy xuất bản ghi hội thoại của một phiên cụ thể. Theo mặc định, kết quả công cụ bị loại trừ; truyền `includeTools: true` để xem chúng. Sử dụng `limit` cho phần đuôi mới nhất có giới hạn. Truyền `offset: 0` khi cần siêu dữ liệu phân trang, sau đó truyền các giá trị `nextOffset` được trả về để lùi qua các cửa sổ bản ghi hội thoại OpenClaw cũ hơn mà không cần đọc các tệp bản ghi thô. Các trang có độ lệch rõ ràng không hợp nhất dữ liệu nhập dự phòng từ CLI bên ngoài; sử dụng chế độ xem phần đuôi mới nhất mặc định (không có `offset`) khi cần lịch sử hiển thị đã hợp nhất đó.

Chế độ xem được trả về được chủ ý giới hạn và lọc an toàn:

- văn bản của tác tử được chuẩn hóa trước khi truy hồi:
  - các thẻ suy luận bị loại bỏ
  - các khối khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ
  - các khối tải trọng XML gọi công cụ dạng văn bản thuần như `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` và `<function_calls>...</function_calls>` bị loại bỏ, bao gồm cả tải trọng bị cắt cụt và không bao giờ đóng đúng cách
  - các khối khung gọi công cụ/kết quả bị hạ cấp như `[Tool Call: ...]`, `[Tool Result ...]` và `[Historical context ...]` bị loại bỏ
  - các token điều khiển mô hình bị rò rỉ như `<|assistant|>`, các token ASCII `<|...|>` khác và các biến thể toàn chiều rộng `<｜...｜>` bị loại bỏ
  - XML gọi công cụ MiniMax không hợp lệ như `<invoke ...>` / `</minimax:tool_call>` bị loại bỏ
- văn bản giống thông tin xác thực/token được che trước khi trả về
- các khối văn bản dài bị cắt cụt
- lịch sử rất lớn có thể loại bỏ các hàng cũ hơn hoặc thay thế một hàng quá lớn bằng `[sessions_history omitted: message too large]`
- công cụ báo cáo các cờ tóm tắt như `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` và siêu dữ liệu phân trang

Sử dụng **khóa phiên** được trả về (chẳng hạn như `"main"`) với `sessions_history`, `sessions_send` và `session_status`. Các công cụ đích đó cũng có thể phân giải một ID phiên đã biết, nhưng `sessions_list` không hiển thị các ID nội bộ.

Nếu cần bản ghi thô chính xác, hãy kiểm tra các hàng bản ghi hội thoại SQLite trong phạm vi thay vì coi `sessions_history` là một bản kết xuất chưa lọc.

Sử dụng [`sessions_search`](/vi/concepts/session-search) để truy hồi toàn văn chính xác trên văn bản bản ghi hội thoại hiển thị của người dùng và tác tử. Kết quả của công cụ này bao gồm một `sessionKey` cho lần gọi `sessions_history` tiếp theo; bộ lọc khả năng hiển thị, việc che đoạn trích và giới hạn đầu ra khớp với ranh giới lịch sử.

## Quản lý cài đặt và nhóm phiên

Công cụ `sessions` có cổng kiểm soát dành cho chủ sở hữu cung cấp hai bề mặt tự phục vụ có giới hạn:

- `action: "patch"` thay đổi phiên hiện tại theo mặc định hoặc một phiên hiển thị khác được chọn bằng `sessionKey`. Công cụ này có thể đặt nhãn, biểu tượng thanh bên, trạng thái ghim/lưu trữ, mô hình và mức độ suy luận. Công cụ này không cung cấp các thao tác đặt lại, xóa hoặc thu gọn.
- `group_list`, `group_set`, `group_rename` và `group_delete` quản lý danh mục nhóm phiên toàn cục có thứ tự. `group_set` thay thế danh sách tên có thứ tự thay vì chỉnh sửa một mục.

Bản chỉnh sửa mô hình do tác tử chọn vẫn có thể hoàn tác cho đến khi lựa chọn đó hoàn tất một lần chạy thành công. Nếu mô hình được chọn chắc chắn không thể sử dụng do lỗi xác thực, thanh toán hoặc không tìm thấy mô hình, OpenClaw sẽ khôi phục mô hình trước đó và ghi một ghi chú hệ thống hiển thị. Các lỗi tạm thời về giới hạn tốc độ, quá tải, hết thời gian, mạng và máy chủ không hoàn tác lựa chọn.

## Phiên và cuộc hội thoại

**Phiên** là ngữ cảnh mô hình cục bộ. **Cuộc hội thoại** là một địa chỉ bên ngoài chính xác, chẳng hạn như một đối tác, kênh hoặc luồng. Hai đối tượng này được liên kết nhưng không thể dùng thay thế cho nhau: các tin nhắn trực tiếp có thể dùng chung một phiên `main` trong khi vẫn giữ các địa chỉ cuộc hội thoại riêng biệt.

`conversations_list` trả về các giá trị `conversationRef` không trong suốt cho tác tử đang hoạt động. Khi có `channel` rõ ràng, Gateway cũng làm mới các địa chỉ từ thư mục cục bộ của kênh đó, chẳng hạn như các đối tác Reef đã được phê duyệt; sử dụng `query` để tìm một đối tác cụ thể ngoài trang kết quả hiện tại. Quá trình khám phá lập danh mục địa chỉ mà không tạo phiên ngữ cảnh mô hình; phiên hỗ trợ chỉ được tạo khi việc phân phối hoặc ngữ cảnh đến cần đến. Chức năng khám phá và phân phối cuộc hội thoại chỉ dành cho chủ sở hữu vì chúng sử dụng thông tin xác thực kênh của Gateway. Sử dụng `conversations_send` để phân phối theo kiểu gửi rồi quên. Sử dụng `conversations_turn` khi phản hồi từ xa thuộc về lượt mô hình hiện tại: Gateway dành riêng một ID tin nhắn vận chuyển, lưu giữ thao tác phân phối và ý định hàng đợi trước I/O vận chuyển, đồng thời trả về phản hồi tương ứng từ công cụ thay vì bắt đầu lượt tác tử cục bộ thứ hai. Các thao tác phân phối tồn tại bên ngoài bản ghi hội thoại mô hình; một phản hồi được thu thập chỉ được giữ lại dưới dạng hiện vật phụ trong khi kết quả công cụ sở hữu ngữ cảnh mô hình. Nếu Gateway khởi động lại sau khi đưa vào hàng đợi, việc phân phối có thể khôi phục nhưng phản hồi sau đó sẽ đi theo quy trình điều phối đầu vào thông thường vì trình chờ cục bộ của tiến trình đã không còn. Các tin nhắn đến không được yêu cầu luôn tiếp tục qua đường dẫn điều phối kênh thông thường.

Sử dụng công cụ `message` dùng chung khi đã có đích kênh thô rõ ràng hoặc cần một thao tác dành riêng cho kênh. Tham chiếu cuộc hội thoại được giới hạn trong phạm vi tác tử đang hoạt động và phải được lấy thông qua `conversations_list`, không được tạo từ khóa phiên.

Trong Chế độ mã, các công cụ cuộc hội thoại tái sử dụng chính xác hợp đồng đầu ra Gateway của chúng. Một ô `exec` duy nhất có thể liệt kê các địa chỉ, chọn một `conversationRef` được trả về và gọi `conversations_send` hoặc `conversations_turn`; chính sách công cụ và phê duyệt thông thường vẫn áp dụng cho các lệnh gọi lồng nhau.

## Gửi tin nhắn xuyên phiên

`sessions_send` chạy một phiên khác trên cùng Gateway và tùy chọn chờ phản hồi. `sessionKey`, `label` hoặc `agentId` của công cụ này chọn ngữ cảnh mô hình cục bộ, không phải đích bên ngoài. Phản hồi kết quả vẫn có thể được thông báo thông qua ngữ cảnh phân phối đã thiết lập của bên yêu cầu hoặc đích; hành vi hiện có đó không thay đổi. Để phân phối chính xác ra bên ngoài, hãy sử dụng một công cụ cuộc hội thoại hoặc `message` với kênh và đích rõ ràng.

- **Gửi rồi quên:** đặt `timeoutSeconds: 0` để đưa vào hàng đợi và trả về ngay lập tức.
- **Chờ phản hồi:** đặt thời gian chờ và nhận phản hồi nội tuyến.

Các phiên trò chuyện giới hạn theo luồng, chẳng hạn như các khóa kết thúc bằng `:thread:<id>`, không phải là đích `sessions_send` hợp lệ. Sử dụng khóa phiên kênh cha để phối hợp giữa các tác tử, nhờ đó các tin nhắn được định tuyến bằng công cụ không xuất hiện trong một luồng đang hoạt động hướng đến con người.

Tin nhắn và phản hồi tiếp theo A2A được đánh dấu là dữ liệu liên phiên trong lời nhắc tiếp nhận (`[Inter-session message ... isUser=false]`) và trong nguồn gốc bản ghi hội thoại. Tác tử tiếp nhận phải coi chúng là dữ liệu được định tuyến bằng công cụ, không phải là chỉ thị trực tiếp do người dùng cuối viết.

Sau khi đích phản hồi, OpenClaw có thể chạy một **vòng lặp phản hồi ngược** trong đó các tác tử luân phiên gửi tin nhắn (tối đa `session.agentToAgent.maxPingPongTurns`, phạm vi 0-20, mặc định 5). Tác tử đích có thể phản hồi `REPLY_SKIP` để dừng sớm.

Truyền `watch: true` để đồng thời đăng ký bên gửi làm trình theo dõi thay đổi trạng thái của đích: khi một tác nhân khác sau đó gửi cho đích một tin nhắn trực tiếp từ con người hoặc thay đổi mục tiêu của đích, bên gửi sẽ nhận được thông báo hệ thống trỏ đến `session_status` `changesSince`. Việc đăng ký diễn ra sau khi điều phối thành công, nhắm đến phiên thực sự nhận được tin nhắn và bắt đầu tại phiên bản trạng thái hiện tại của phiên đó, vì vậy chỉ các thay đổi sau này mới tạo ra thông báo. Kết quả báo cáo `watched: true` khi đăng ký thành công. Xem [Nhận biết trạng thái phiên](/vi/concepts/session-state).

## Trình trợ giúp trạng thái và điều phối

`session_status` là công cụ nhẹ tương đương với `/status` dành cho phiên hiện tại hoặc một phiên hiển thị khác. Công cụ này báo cáo mức sử dụng, thời gian, trạng thái mô hình/runtime và ngữ cảnh tác vụ nền được liên kết nếu có. Giống như `/status`, công cụ có thể bổ sung các bộ đếm token/bộ nhớ đệm còn thiếu từ mục sử dụng mới nhất trong bản ghi, còn `model=default` sẽ xóa giá trị ghi đè theo từng phiên. Dùng `sessionKey="current"` cho phiên hiện tại của bên gọi; các nhãn máy khách hiển thị như `openclaw-tui` không phải là khóa phiên.

Khi có siêu dữ liệu tuyến, `session_status` cũng bao gồm một khối JSON `Route context` hiển thị và các trường `details` có cấu trúc tương ứng. Các trường này giúp phân biệt khóa phiên với tuyến hiện đang xử lý lượt chạy trực tiếp:

- `origin` là nơi phiên được tạo, hoặc là nhà cung cấp được suy ra từ tiền tố khóa phiên có thể phân phối khi trạng thái cũ không có siêu dữ liệu nguồn gốc đã lưu.
- `active` là tuyến của lượt chạy trực tiếp hiện tại. Trường này chỉ được báo cáo cho phiên trực tiếp hoặc phiên hiện tại đang được xử lý.
- `deliveryContext` là tuyến phân phối được duy trì trên phiên, OpenClaw có thể tái sử dụng tuyến này để phân phối sau đó ngay cả khi bề mặt đang hoạt động khác đi.

## Thay đổi trạng thái phiên

OpenClaw lưu giữ nhật ký tín hiệu bền vững về các thay đổi quan trọng của trạng thái phiên (tin nhắn trực tiếp của người dùng đến các phiên được theo dõi, kết quả lượt chạy con, thay đổi mục tiêu, Compaction). Các hàng `sessions_list` và `session_status` cung cấp `stateVersion` của phiên, còn `session_status` chấp nhận `changesSince: <version>` để trả về các sự kiện có kiểu sau phiên bản đó, với tín hiệu `historyGap` chính xác khi phiên bản được yêu cầu có trước phần lịch sử còn được lưu giữ. Các trình theo dõi — tự động đối với phiên cha tạo tác vụ, rõ ràng qua `sessions_send watch: true` — nhận một thông báo trạng thái lỗi thời đã hợp nhất khi một tác nhân khác thay đổi phiên đang được theo dõi.

Các sự kiện thay đổi trạng thái lược bỏ ID phiên/tác nhân lặp lại và chỉ cung cấp các trường tải trọng hữu ích cho mô hình (`outcome`, `channel` hoặc `turns`). Bản tóm tắt sự kiện cùng các mã định danh tác nhân/lượt chạy vẫn có sẵn để đối soát.

Xem [Nhận biết trạng thái phiên](/vi/concepts/session-state) để tìm hiểu mô hình đầy đủ: các loại sự kiện, đăng ký trình theo dõi, giao thức thông báo chống thư rác, luồng đối soát và các giới hạn hiện tại.

`sessions_yield` chủ ý kết thúc lượt hiện tại để tin nhắn tiếp theo có thể là sự kiện tiếp nối mà bạn đang chờ. Dùng công cụ này sau khi tạo các tác nhân phụ nếu muốn kết quả hoàn tất xuất hiện dưới dạng tin nhắn tiếp theo thay vì xây dựng các vòng lặp thăm dò.

`subagents` là chế độ xem cây phiên dành cho các lượt chạy tác nhân phụ gốc và sổ cái tác vụ nền dùng chung. `action: "list"` báo cáo các tác nhân phụ đang hoạt động/gần đây cùng các tác vụ ACP, CLI/phương tiện và Cron trong phạm vi. `action: "cancel"` chấp nhận một `taskId` được trả về và chỉ có thể dừng công việc bên trong cây phiên do bên gọi kiểm soát; tác nhân phụ lá không thể hủy tác vụ của phiên khác.

## Tạo tác nhân phụ

Theo mặc định, `sessions_spawn` tạo một phiên biệt lập cho tác vụ nền. Công cụ này luôn không chặn; nó trả về ngay lập tức một `runId` và `childSessionKey`. Các lượt chạy tác nhân phụ gốc nhận tác vụ được ủy quyền trong tin nhắn `[Subagent Task]` hiển thị đầu tiên của phiên con, trong khi lời nhắc hệ thống chỉ chứa các quy tắc runtime của tác nhân phụ và ngữ cảnh định tuyến.

Các tùy chọn chính:

- `runtime: "subagent"` (mặc định) hoặc `"acp"` cho các tác nhân của bộ điều phối bên ngoài.
- Ghi đè `model` và `thinking` cho phiên con.
- `thread: true` để liên kết lần tạo với một luồng trò chuyện (Discord, Slack, v.v.).
- `sandbox: "require"` để bắt buộc áp dụng hộp cát cho phiên con.
- `context: "fork"` dành cho tác nhân phụ gốc khi phiên con cần bản ghi của người yêu cầu hiện tại; bỏ qua tùy chọn này hoặc dùng `context: "isolated"` để có một phiên con sạch. `context: "fork"` chỉ hợp lệ với `runtime: "subagent"`. Theo mặc định, tác nhân phụ gốc được liên kết với luồng dùng `context: "fork"`, trừ khi `threadBindings.defaultSpawnContext` quy định khác.
- `visible: true` để tạo một phiên bảng điều khiển bền vững thay vì phiên tác nhân phụ ẩn. Các lần tạo hiển thị hỗ trợ mô hình chỉ định rõ ràng, thư mục làm việc, phân nhánh bản ghi của cùng tác nhân và một [cây làm việc được quản lý](/vi/concepts/managed-worktrees) tùy chọn; xem [Tác nhân phụ](/vi/tools/subagents#tool-parameters) để biết chính xác các giới hạn tương thích.

Theo mặc định, tác nhân phụ lá không nhận được công cụ phiên. Khi `maxSpawnDepth >= 2`, các tác nhân phụ điều phối ở độ sâu 1 còn nhận được `sessions_spawn`, `subagents`, `sessions_list` và `sessions_history` để có thể quản lý các phiên con của riêng chúng. Các lượt chạy lá vẫn không nhận được công cụ điều phối đệ quy.

Sau khi hoàn tất, một bước thông báo sẽ đăng kết quả lên kênh của người yêu cầu. Việc phân phối kết quả hoàn tất bảo toàn định tuyến luồng/chủ đề đã liên kết khi có thể; nếu nguồn gốc hoàn tất chỉ xác định được một kênh, OpenClaw vẫn có thể tái sử dụng tuyến đã lưu của phiên người yêu cầu (`lastChannel` / `lastTo`) để phân phối trực tiếp.

Để biết hành vi dành riêng cho ACP, xem [Tác nhân ACP](/vi/tools/acp-agents).

## Khả năng hiển thị

Các công cụ phiên được giới hạn phạm vi để kiểm soát những gì tác nhân có thể thấy:

| Cấp độ   | Phạm vi                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | Chỉ phiên hiện tại                                   |
| `tree`  | Phiên hiện tại + các phiên đã tạo; thao tác đọc bao gồm các nhóm cùng tác nhân được theo dõi |
| `agent` | Tất cả phiên của tác nhân này                                |
| `all`   | Tất cả phiên (giữa các tác nhân nếu được cấu hình)                   |

Mặc định là `tree`. Các phiên trong hộp cát bị giới hạn ở `tree` bất kể cấu hình.
Với `session.dmScope: "main"` mặc định, hoạt động nhóm cho phép phiên chính đọc các phiên nhóm cùng tác nhân được theo dõi.

## Đọc thêm

- [Quản lý phiên](/vi/concepts/session): định tuyến, vòng đời, bảo trì
- [Tác nhân phụ](/vi/tools/subagents): vòng đời và phân phối của phiên con
- [Tác nhân ACP](/vi/tools/acp-agents): tạo tác nhân trong bộ điều phối bên ngoài
- [Đa tác nhân](/vi/concepts/multi-agent): kiến trúc đa tác nhân
- [Cấu hình Gateway](/vi/gateway/configuration): các tùy chọn cấu hình công cụ phiên

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
