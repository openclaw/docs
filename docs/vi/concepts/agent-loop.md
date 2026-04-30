---
read_when:
    - Bạn cần một hướng dẫn từng bước chính xác về vòng lặp tác nhân hoặc các sự kiện vòng đời
    - Bạn đang thay đổi hành vi xếp hàng phiên, ghi bản ghi hội thoại hoặc khóa ghi phiên
summary: Vòng đời vòng lặp tác nhân, luồng và ngữ nghĩa chờ
title: Vòng lặp tác nhân
x-i18n:
    generated_at: "2026-04-30T18:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là toàn bộ lượt chạy “thực” của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → truyền phát phản hồi → lưu trữ bền vững. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành các hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy đơn lẻ, được tuần tự hóa theo từng phiên, phát ra các sự kiện vòng đời và luồng
khi mô hình suy nghĩ, gọi công cụ và truyền phát đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây từ đầu đến cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (mức cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu metadata phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + các mặc định thinking/verbose/trace
   - tải snapshot Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát ra **vòng đời kết thúc/lỗi** nếu vòng lặp nhúng không phát ra một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lượt chạy qua hàng đợi theo phiên + toàn cục
   - phân giải mô hình + hồ sơ xác thực và xây dựng phiên pi
   - đăng ký nhận sự kiện pi và truyền phát các delta của trợ lý/công cụ
   - áp dụng timeout -> hủy lượt chạy nếu vượt quá
   - với các lượt Codex app-server, hủy một lượt đã được chấp nhận nếu nó ngừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + metadata sử dụng
4. `subscribeEmbeddedPiSession` nối các sự kiện pi-agent-core với luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta của trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **vòng đời kết thúc/lỗi** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lượt chạy được tuần tự hóa theo từng khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn các race về công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (collect/steer/followup) để đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Các lượt ghi transcript cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên phát hiện được các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác.
- Khóa ghi phiên mặc định không tái nhập. Nếu một helper cố ý lồng việc lấy
  cùng một khóa trong khi vẫn giữ một trình ghi logic duy nhất, helper đó phải bật rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lượt chạy trong sandbox có thể chuyển hướng đến root workspace sandbox.
- Skills được tải (hoặc dùng lại từ snapshot) và được chèn vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và chèn vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi truyền phát. Mọi
  đường dẫn viết lại transcript, Compaction hoặc cắt bớt về sau đều phải lấy cùng khóa đó trước khi mở hoặc
  thay đổi tệp transcript.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt nền của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các override theo lượt chạy.
- Các giới hạn theo mô hình và token dự trữ cho Compaction được áp dụng.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script theo sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi xây dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng hook này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + Gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline Gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để override provider/model một cách tất định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để chèn `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo lượt và các trường system-context cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích kế thừa có thể chạy trong một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau inline actions và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc im lặng hoàn toàn lượt đó.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và metadata lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra các phát hiện quét tích hợp sẵn và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào transcript phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn đến + đi.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Quy tắc quyết định hook cho guard đầu ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là no-op và không xóa block trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là no-op và không xóa block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là no-op và không xóa cancel trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Harness có thể điều chỉnh các hook này theo cách khác. Harness Codex app-server giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt được mirror có tài liệu,
trong khi hook native của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Truyền phát + phản hồi một phần

- Delta của trợ lý được truyền phát từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Truyền phát block có thể phát ra phản hồi một phần ở `text_end` hoặc `message_end`.
- Truyền phát reasoning có thể được phát ra dưới dạng một luồng riêng hoặc dưới dạng phản hồi block.
- Xem [Truyền phát](/vi/concepts/streaming) để biết hành vi chia chunk và phản hồi block.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Các lượt gửi bằng công cụ nhắn tin được theo dõi để ngăn xác nhận trợ lý trùng lặp.

## Định hình phản hồi + triệt tiêu

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và reasoning tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được phép)
  - văn bản lỗi trợ lý khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi
  payload gửi đi.
- Bản trùng lặp của công cụ nhắn tin bị xóa khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể render và một công cụ bị lỗi, phản hồi lỗi công cụ dự phòng được phát ra
  (trừ khi công cụ nhắn tin đã gửi phản hồi người dùng có thể thấy).

## Compaction + thử lại

- Auto-compaction phát ra sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, buffer trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Luồng sự kiện (hiện tại)

- `lifecycle`: do `subscribeEmbeddedPiSession` phát ra (và do `agentCommand` phát ra làm dự phòng)
- `assistant`: delta được truyền phát từ pi-agent-core
- `tool`: sự kiện công cụ được truyền phát từ pi-agent-core

## Xử lý kênh chat

- Delta của trợ lý được buffer thành tin nhắn chat `delta`.
- Một chat `final` được phát ra khi **vòng đời kết thúc/lỗi**.

## Timeout

- Mặc định của `agent.wait`: 30 giây (chỉ phần chờ). Tham số `timeoutMs` override.
- Runtime tác tử: mặc định `agents.defaults.timeoutSeconds` là 172800 giây (48 giờ); được áp dụng trong timer hủy của `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` của lượt tác tử biệt lập do Cron sở hữu. Bộ lập lịch bắt đầu timer đó khi thực thi bắt đầu, hủy lượt chạy nền bên dưới tại deadline đã cấu hình, rồi chạy cleanup có giới hạn trước khi ghi nhận timeout để phiên con cũ không thể làm kẹt làn.
- Khôi phục phiên bị kẹt: khi bật diagnostics, `diagnostics.stuckSessionWarnMs` phát hiện các phiên `processing` kéo dài. Các lượt chạy nhúng đang hoạt động, thao tác phản hồi đang hoạt động và tác vụ làn phiên đang hoạt động mặc định chỉ cảnh báo; nếu diagnostics cho thấy không có công việc đang hoạt động cho phiên, watchdog sẽ nhả làn phiên bị ảnh hưởng để công việc khởi động đang xếp hàng có thể thoát.
- Timeout rỗi của mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ rỗi. `models.providers.<id>.timeoutSeconds` mở rộng watchdog rỗi này cho các provider local/tự host chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định bị giới hạn ở 120 giây. Các lượt chạy do Cron kích hoạt không có timeout mô hình hoặc tác tử rõ ràng sẽ tắt watchdog rỗi và dựa vào timeout ngoài của Cron.
- Timeout yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lượt fetch HTTP mô hình của provider đó, bao gồm connect, header, body, timeout yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog rỗi luồng mô hình. Dùng mục này cho các provider local/tự host chậm như Ollama trước khi tăng timeout runtime toàn bộ tác tử.

## Nơi mọi thứ có thể kết thúc sớm

- Timeout tác tử (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc timeout RPC
- Timeout `agent.wait` (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) — công cụ tác tử có sẵn
- [Hooks](/vi/automation/hooks) — script theo sự kiện được kích hoạt bởi các sự kiện vòng đời tác tử
- [Compaction](/vi/concepts/compaction) — cách tóm tắt các cuộc hội thoại dài
- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Thinking](/vi/tools/thinking) — cấu hình mức thinking/reasoning
