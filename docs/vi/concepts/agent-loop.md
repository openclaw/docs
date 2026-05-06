---
read_when:
    - Bạn cần hướng dẫn từng bước chính xác về vòng lặp tác nhân hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cơ chế xếp hàng phiên, thao tác ghi bản ghi hội thoại, hoặc hành vi khóa ghi phiên
summary: Vòng đời vòng lặp tác nhân, các luồng và ngữ nghĩa chờ
title: Vòng lặp tác nhân
x-i18n:
    generated_at: "2026-05-06T09:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là lần chạy "thực" đầy đủ của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → truyền phát phản hồi → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành các hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lần chạy đơn lẻ, được tuần tự hóa trên mỗi phiên, phát ra các sự kiện vòng đời và luồng
khi mô hình suy nghĩ, gọi công cụ và truyền phát đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây từ đầu đến cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (tổng quan)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + giá trị mặc định thinking/verbose/trace
   - tải ảnh chụp nhanh Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lần chạy qua hàng đợi theo phiên + toàn cục
   - phân giải mô hình + hồ sơ xác thực và dựng phiên pi
   - đăng ký theo dõi sự kiện pi và truyền phát delta của trợ lý/công cụ
   - áp đặt thời gian chờ -> hủy lần chạy nếu vượt quá
   - với lượt Codex app-server, hủy một lượt đã được chấp nhận nếu nó ngừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + siêu dữ liệu sử dụng
4. `subscribeEmbeddedPiSession` bắc cầu các sự kiện pi-agent-core sang luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta của trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lần chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn các cuộc đua công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (thu thập/điều hướng/theo dõi) nạp vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Việc ghi bản ghi hội thoại cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên nó bắt được các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác. Trình ghi bản ghi hội thoại phiên chờ tối đa `session.writeLock.acquireTimeoutMs`
  trước khi báo cáo phiên đang bận; mặc định là `60000` ms.
- Khóa ghi phiên mặc định không tái nhập. Nếu một helper cố ý lồng việc giành
  cùng khóa trong khi vẫn giữ một trình ghi logic duy nhất, nó phải chọn tham gia rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lần chạy trong sandbox có thể chuyển hướng đến gốc workspace sandbox.
- Skills được tải (hoặc dùng lại từ ảnh chụp nhanh) và được tiêm vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và tiêm vào báo cáo system prompt.
- Khóa ghi phiên được giành; `SessionManager` được mở và chuẩn bị trước khi truyền phát. Bất kỳ
  đường dẫn ghi lại bản ghi hội thoại, Compaction hoặc cắt bớt nào sau đó đều phải lấy cùng khóa trước khi mở hoặc
  biến đổi tệp bản ghi hội thoại.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt nền tảng của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các ghi đè theo lần chạy.
- Các giới hạn theo mô hình và token dự trữ cho Compaction được áp đặt.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script hướng sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng mục này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hook).

Xem [Hook](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + Gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline Gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/model một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo lượt và các trường system-context cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích kế thừa có thể chạy ở một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau hành động nội tuyến và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc làm im lặng toàn bộ lượt.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lần chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra phát hiện quét tích hợp và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi hội thoại phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn vào + ra.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời Gateway.

Quy tắc quyết định hook cho bộ bảo vệ gửi ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa chặn trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là không thao tác và không xóa chặn trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa hủy trước đó.

Xem [hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh các hook này theo cách khác. Harness Codex app-server giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt được phản chiếu đã ghi tài liệu,
trong khi hook gốc Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Truyền phát + phản hồi từng phần

- Delta của trợ lý được truyền phát từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Truyền phát khối có thể phát phản hồi từng phần trên `text_end` hoặc `message_end`.
- Truyền phát suy luận có thể được phát như một luồng riêng hoặc dưới dạng phản hồi khối.
- Xem [Truyền phát](/vi/concepts/streaming) để biết hành vi chia khúc và phản hồi khối.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch theo kích thước và payload hình ảnh trước khi ghi log/phát.
- Các lần gửi bằng công cụ nhắn tin được theo dõi để ngăn xác nhận trợ lý trùng lặp.

## Định dạng phản hồi + triệt tiêu

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và suy luận tùy chọn)
  - tóm tắt công cụ nội tuyến (khi verbose + được phép)
  - văn bản lỗi trợ lý khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi payload
  gửi ra.
- Các bản trùng lặp của công cụ nhắn tin được xóa khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể render và một công cụ bị lỗi, một phản hồi lỗi công cụ dự phòng được phát
  (trừ khi công cụ nhắn tin đã gửi một phản hồi hiển thị cho người dùng).

## Compaction + thử lại

- Auto-compaction phát sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Luồng sự kiện (hiện nay)

- `lifecycle`: được phát bởi `subscribeEmbeddedPiSession` (và dưới dạng dự phòng bởi `agentCommand`)
- `assistant`: delta truyền phát từ pi-agent-core
- `tool`: sự kiện công cụ truyền phát từ pi-agent-core

## Xử lý kênh chat

- Delta của trợ lý được đệm thành tin nhắn chat `delta`.
- Chat `final` được phát khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

- Mặc định của `agent.wait`: 30 giây (chỉ phần chờ). Tham số `timeoutMs` ghi đè.
- Runtime tác tử: mặc định `agents.defaults.timeoutSeconds` là 172800 giây (48 giờ); được áp đặt trong bộ hẹn giờ hủy `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` của lượt tác tử cô lập do cron sở hữu. Bộ lập lịch khởi động bộ hẹn giờ đó khi bắt đầu thực thi, hủy lần chạy bên dưới ở hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận thời gian chờ để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán độ sống phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài mà không quan sát thấy phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP. Các lần chạy nhúng, lệnh gọi mô hình và lệnh gọi công cụ đang hoạt động được báo cáo là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây được báo cáo là `session.stalled`; `session.stuck` được dành cho sổ sách phiên cũ không có công việc đang hoạt động. Sổ sách phiên cũ giải phóng làn phiên bị ảnh hưởng ngay lập tức; các lần chạy nhúng bị đình trệ chỉ được hủy-xả sau `diagnostics.stuckSessionAbortMs` (mặc định: ít nhất 10 phút và gấp 5 lần ngưỡng cảnh báo) để công việc trong hàng đợi có thể tiếp tục mà không cắt ngang các lần chạy chỉ chậm. Khôi phục phát các kết quả requested/completed có cấu trúc, và trạng thái chẩn đoán chỉ được đánh dấu rảnh nếu cùng thế hệ xử lý vẫn còn hiện hành. Các chẩn đoán `session.stuck` lặp lại sẽ lùi dần trong khi phiên vẫn không đổi.
- Thời gian chờ nhàn rỗi của mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` mở rộng bộ canh chừng nhàn rỗi này cho các provider cục bộ/tự lưu trữ chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn ở 120 giây. Các lần chạy do Cron kích hoạt không có thời gian chờ mô hình hoặc tác tử rõ ràng sẽ tắt bộ canh chừng nhàn rỗi và dựa vào thời gian chờ ngoài của cron.
- Thời gian chờ yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lần fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, thời gian chờ yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và bộ canh chừng nhàn rỗi luồng mô hình. Dùng mục này cho các provider cục bộ/tự lưu trữ chậm như Ollama trước khi tăng thời gian chờ runtime của toàn bộ tác tử.

## Nơi mọi thứ có thể kết thúc sớm

- Thời gian chờ tác tử (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc thời gian chờ RPC
- Thời gian chờ `agent.wait` (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) — công cụ tác tử có sẵn
- [Hook](/vi/automation/hooks) — script hướng sự kiện được kích hoạt bởi sự kiện vòng đời tác tử
- [Compaction](/vi/concepts/compaction) — cách các cuộc trò chuyện dài được tóm tắt
- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Thinking](/vi/tools/thinking) — cấu hình cấp độ thinking/reasoning
