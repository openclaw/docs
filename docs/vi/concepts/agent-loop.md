---
read_when:
    - Bạn cần một hướng dẫn từng bước chính xác về vòng lặp tác nhân hoặc các sự kiện vòng đời
    - Bạn đang thay đổi hành vi đưa phiên vào hàng đợi, ghi bản ghi cuộc hội thoại hoặc khóa ghi phiên
summary: Vòng đời vòng lặp tác tử, luồng và ngữ nghĩa chờ
title: Vòng lặp tác nhân
x-i18n:
    generated_at: "2026-05-02T20:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Một vòng lặp agentic là lượt chạy “thực” đầy đủ của một agent: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → trả lời dạng streaming → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành các hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy đơn, được tuần tự hóa theo từng phiên, phát ra các sự kiện vòng đời và stream
khi mô hình suy nghĩ, gọi công cụ và stream đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây đầu cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (mức cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy agent:
   - phân giải mặc định cho mô hình + thinking/verbose/trace
   - tải snapshot Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát **lifecycle end/error** nếu vòng lặp nhúng không phát một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa lượt chạy qua hàng đợi theo phiên + hàng đợi toàn cục
   - phân giải mô hình + hồ sơ xác thực và xây dựng phiên pi
   - đăng ký theo dõi sự kiện pi và stream các delta assistant/tool
   - áp dụng timeout -> hủy lượt chạy nếu vượt quá
   - với các lượt Codex app-server, hủy một lượt đã được chấp nhận nếu nó dừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + siêu dữ liệu usage
4. `subscribeEmbeddedPiSession` bắc cầu các sự kiện pi-agent-core sang stream `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **lifecycle end/error** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lượt chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Cơ chế này ngăn race giữa công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (collect/steer/followup) đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Việc ghi transcript cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên nó bắt được các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  một tiến trình khác. Các trình ghi transcript phiên chờ tối đa `session.writeLock.acquireTimeoutMs`
  trước khi báo cáo phiên đang bận; mặc định là `60000` ms.
- Khóa ghi phiên mặc định không tái nhập. Nếu một helper cố ý lồng việc lấy
  cùng một khóa trong khi vẫn giữ một trình ghi logic, nó phải chọn tham gia rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; lượt chạy sandbox có thể chuyển hướng sang gốc workspace sandbox.
- Skills được tải (hoặc dùng lại từ snapshot) và được tiêm vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và tiêm vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi streaming. Bất kỳ
  đường dẫn ghi lại transcript, Compaction hoặc cắt ngắn nào sau đó đều phải lấy cùng khóa trước khi mở hoặc
  biến đổi tệp transcript.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt cơ sở của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các override theo từng lượt chạy.
- Các giới hạn theo mô hình và token dự trữ cho Compaction được áp dụng.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình thấy gì.

## Điểm hook (nơi bạn có thể can thiệp)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script hướng sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời agent/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi xây dựng các tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng nó để thêm/xóa các tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời agent + Gateway)

Các hook này chạy bên trong vòng lặp agent hoặc pipeline Gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/model một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo từng lượt và các trường system-context cho chỉ dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích cũ có thể chạy ở một trong hai pha; ưu tiên các hook tường minh ở trên.
- **`before_agent_reply`**: chạy sau hành động inline và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc làm im lặng toàn bộ lượt.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: can thiệp vào tham số/kết quả công cụ.
- **`before_install`**: kiểm tra phát hiện scan tích hợp và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào transcript phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn đến + đi.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời Gateway.

Quy tắc quyết định hook cho guard đầu ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể thích ứng những hook này theo cách khác. Harness Codex app-server giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt mirrored đã được tài liệu hóa,
trong khi hook native của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Streaming + phản hồi từng phần

- Delta assistant được stream từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Streaming theo block có thể phát phản hồi từng phần trên `text_end` hoặc `message_end`.
- Streaming reasoning có thể được phát dưới dạng một stream riêng hoặc dưới dạng phản hồi block.
- Xem [Streaming](/vi/concepts/streaming) để biết hành vi chia chunk và phản hồi block.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc của công cụ được phát trên stream `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát.
- Lượt gửi của công cụ nhắn tin được theo dõi để ngăn xác nhận trùng lặp từ assistant.

## Định hình phản hồi + triệt tiêu

- Payload cuối cùng được lắp ráp từ:
  - văn bản assistant (và reasoning tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được phép)
  - văn bản lỗi assistant khi mô hình gặp lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi các
  payload gửi đi.
- Các bản trùng lặp của công cụ nhắn tin được xóa khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể hiển thị và một công cụ gặp lỗi, một phản hồi lỗi công cụ fallback sẽ được phát
  (trừ khi một công cụ nhắn tin đã gửi phản hồi hiển thị cho người dùng).

## Compaction + thử lại

- Auto-compaction phát các sự kiện stream `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, buffer trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Stream sự kiện (hiện nay)

- `lifecycle`: được phát bởi `subscribeEmbeddedPiSession` (và như fallback bởi `agentCommand`)
- `assistant`: delta được stream từ pi-agent-core
- `tool`: sự kiện công cụ được stream từ pi-agent-core

## Xử lý kênh chat

- Delta assistant được buffer thành tin nhắn chat `delta`.
- Một chat `final` được phát khi **lifecycle end/error**.

## Timeout

- Mặc định `agent.wait`: 30s (chỉ phần chờ). Tham số `timeoutMs` ghi đè.
- Runtime agent: mặc định `agents.defaults.timeoutSeconds` là 172800s (48 giờ); được áp dụng trong bộ hẹn giờ hủy của `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` của lượt agent cô lập thuộc sở hữu của cron. Bộ lập lịch bắt đầu bộ hẹn giờ đó khi việc thực thi bắt đầu, hủy lượt chạy bên dưới tại hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận timeout để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán liveness phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài không có phản hồi, công cụ, trạng thái, block hoặc tiến trình ACP được quan sát. Các lượt chạy nhúng đang hoạt động, lệnh gọi mô hình và lệnh gọi công cụ được báo cáo là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây được báo cáo là `session.stalled`; `session.stuck` chỉ dành cho sổ sách phiên cũ không có công việc đang hoạt động, và chỉ đường dẫn đó giải phóng làn phiên bị ảnh hưởng để công việc khởi động trong hàng đợi có thể thoát ra. Các chẩn đoán `session.stuck` lặp lại sẽ back off khi phiên vẫn không thay đổi.
- Timeout nhàn rỗi của mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` mở rộng watchdog nhàn rỗi này cho các provider cục bộ/tự host chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn ở 120s. Các lượt chạy do Cron kích hoạt không có timeout mô hình hoặc agent rõ ràng sẽ tắt watchdog nhàn rỗi và dựa vào timeout ngoài của cron.
- Timeout yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lượt fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, timeout yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog nhàn rỗi stream mô hình. Dùng mục này cho các provider cục bộ/tự host chậm như Ollama trước khi tăng timeout runtime của toàn bộ agent.

## Nơi mọi thứ có thể kết thúc sớm

- Timeout agent (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc timeout RPC
- Timeout `agent.wait` (chỉ chờ, không dừng agent)

## Liên quan

- [Công cụ](/vi/tools) — các công cụ agent có sẵn
- [Hooks](/vi/automation/hooks) — script hướng sự kiện được kích hoạt bởi sự kiện vòng đời agent
- [Compaction](/vi/concepts/compaction) — cách các cuộc trò chuyện dài được tóm tắt
- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Thinking](/vi/tools/thinking) — cấu hình mức thinking/reasoning
