---
read_when:
    - Bạn cần hướng dẫn chính xác từng bước về vòng lặp tác nhân hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cách xếp hàng phiên, việc ghi bản ghi hội thoại hoặc hành vi khóa ghi phiên
summary: Vòng đời của vòng lặp tác tử, luồng truyền và ngữ nghĩa chờ
title: Vòng lặp tác tử
x-i18n:
    generated_at: "2026-05-05T06:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp agentic là lượt chạy “thực” đầy đủ của một agent: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → phản hồi streaming → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành các hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy duy nhất, được tuần tự hóa theo từng phiên, phát ra các sự kiện vòng đời và stream
khi mô hình suy nghĩ, gọi công cụ và stream đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây từ đầu đến cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (cấp cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy agent:
   - phân giải mô hình + mặc định thinking/verbose/trace
   - tải snapshot Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát ra sự kiện đó
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lượt chạy qua hàng đợi theo phiên + toàn cục
   - phân giải mô hình + hồ sơ xác thực và xây dựng phiên pi
   - đăng ký sự kiện pi và stream delta của assistant/công cụ
   - áp dụng timeout -> hủy lượt chạy nếu vượt quá
   - với các lượt Codex app-server, hủy một lượt đã được chấp nhận nếu nó ngừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + siêu dữ liệu usage
4. `subscribeEmbeddedPiSession` nối các sự kiện pi-agent-core sang stream `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Hàng đợi + đồng thời

- Các lượt chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn đi qua một làn toàn cục.
- Điều này ngăn race giữa công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (collect/steer/followup) đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Các thao tác ghi transcript cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên nó bắt được những writer bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác. Các writer transcript phiên chờ tối đa `session.writeLock.acquireTimeoutMs`
  trước khi báo phiên đang bận; mặc định là `60000` ms.
- Khóa ghi phiên mặc định là không tái nhập. Nếu một helper cố ý lồng việc lấy
  cùng một khóa trong khi vẫn giữ một writer logic duy nhất, nó phải bật rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lượt chạy sandbox có thể chuyển hướng đến gốc workspace sandbox.
- Skills được tải (hoặc dùng lại từ snapshot) và được chèn vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và chèn vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi streaming. Mọi
  đường dẫn ghi lại transcript, Compaction hoặc cắt ngắn sau đó phải lấy cùng khóa trước khi mở hoặc
  chỉnh sửa tệp transcript.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt cơ sở của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các ghi đè theo lượt chạy.
- Giới hạn theo mô hình và token dự trữ cho Compaction được áp dụng.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script theo sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời agent/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi xây dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng hook này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop`, và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời agent + Gateway)

Các hook này chạy bên trong vòng lặp agent hoặc pipeline Gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/model một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để chèn `prependContext`, `systemPrompt`, `prependSystemContext`, hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo từng lượt và dùng các trường system-context cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích kế thừa có thể chạy ở một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau các hành động inline và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc làm im lặng toàn bộ lượt.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra phát hiện scan tích hợp sẵn và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào transcript phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn vào + ra.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời Gateway.

Quy tắc quyết định hook cho guard gửi ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Harness có thể điều chỉnh các hook này theo cách khác. Harness Codex app-server giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt được phản chiếu đã ghi tài liệu,
trong khi hook native của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Streaming + phản hồi từng phần

- Delta assistant được stream từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Block streaming có thể phát phản hồi từng phần trên `text_end` hoặc `message_end`.
- Streaming reasoning có thể được phát dưới dạng stream riêng hoặc dưới dạng phản hồi block.
- Xem [Streaming](/vi/concepts/streaming) để biết hành vi chunking và phản hồi block.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên stream `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát.
- Các lần gửi bằng công cụ nhắn tin được theo dõi để chặn xác nhận assistant trùng lặp.

## Định hình phản hồi + chặn phản hồi

- Payload cuối cùng được lắp ráp từ:
  - văn bản assistant (và reasoning tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được phép)
  - văn bản lỗi assistant khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi payload
  gửi ra.
- Các bản sao do công cụ nhắn tin tạo ra được loại khỏi danh sách payload cuối cùng.
- Nếu không còn payload nào có thể render và một công cụ bị lỗi, phản hồi lỗi công cụ dự phòng sẽ được phát
  (trừ khi một công cụ nhắn tin đã gửi phản hồi người dùng nhìn thấy).

## Compaction + thử lại

- Auto-compaction phát sự kiện stream `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, buffer trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Stream sự kiện (hiện tại)

- `lifecycle`: được phát bởi `subscribeEmbeddedPiSession` (và làm dự phòng bởi `agentCommand`)
- `assistant`: delta được stream từ pi-agent-core
- `tool`: sự kiện công cụ được stream từ pi-agent-core

## Xử lý kênh chat

- Delta assistant được đệm vào tin nhắn chat `delta`.
- Chat `final` được phát khi **kết thúc/lỗi vòng đời**.

## Timeout

- Mặc định `agent.wait`: 30s (chỉ thời gian chờ). Tham số `timeoutMs` ghi đè.
- Runtime agent: mặc định `agents.defaults.timeoutSeconds` là 172800s (48 giờ); được áp dụng trong timer hủy của `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` cho lượt agent cô lập do cron sở hữu. Scheduler khởi động timer đó khi việc thực thi bắt đầu, hủy lượt chạy bên dưới tại deadline đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận timeout để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán liveness phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài không có phản hồi, công cụ, trạng thái, block hoặc tiến trình ACP được quan sát. Lượt chạy nhúng, lệnh gọi mô hình và lệnh gọi công cụ đang hoạt động được báo cáo là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây được báo cáo là `session.stalled`; `session.stuck` được dành cho sổ sách phiên cũ không có công việc đang hoạt động. Sổ sách phiên cũ giải phóng ngay làn phiên bị ảnh hưởng; các lượt chạy nhúng bị stalled chỉ được hủy-drain sau `diagnostics.stuckSessionAbortMs` (mặc định: ít nhất 10 phút và 5x ngưỡng cảnh báo) để công việc đang xếp hàng có thể tiếp tục mà không cắt ngang các lượt chạy chỉ đơn giản là chậm. Phục hồi phát các kết quả requested/completed có cấu trúc, và trạng thái chẩn đoán chỉ được đánh dấu idle nếu cùng thế hệ processing vẫn là hiện tại. Các chẩn đoán `session.stuck` lặp lại sẽ back off khi phiên vẫn không thay đổi.
- Timeout idle của mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ idle. `models.providers.<id>.timeoutSeconds` kéo dài watchdog idle này cho các provider local/self-hosted chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn ở 120s. Các lượt chạy do Cron kích hoạt không có timeout mô hình hoặc agent rõ ràng sẽ tắt watchdog idle và dựa vào timeout bên ngoài của cron.
- Timeout yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lần fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, timeout yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog idle stream mô hình. Dùng tùy chọn này cho các provider local/self-hosted chậm như Ollama trước khi tăng timeout runtime toàn bộ agent.

## Nơi mọi thứ có thể kết thúc sớm

- Timeout agent (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc timeout RPC
- Timeout `agent.wait` (chỉ chờ, không dừng agent)

## Liên quan

- [Công cụ](/vi/tools) — công cụ agent có sẵn
- [Hooks](/vi/automation/hooks) — script theo sự kiện được kích hoạt bởi sự kiện vòng đời agent
- [Compaction](/vi/concepts/compaction) — cách tóm tắt các cuộc trò chuyện dài
- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Thinking](/vi/tools/thinking) — cấu hình mức thinking/reasoning
