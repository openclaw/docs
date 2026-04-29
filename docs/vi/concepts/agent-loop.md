---
read_when:
    - Bạn cần hướng dẫn từng bước chính xác về vòng lặp tác nhân hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cơ chế xếp hàng phiên, việc ghi bản ghi phiên, hoặc hành vi khóa ghi phiên
summary: Vòng đời vòng lặp tác tử, luồng và ngữ nghĩa chờ
title: Vòng lặp tác nhân
x-i18n:
    generated_at: "2026-04-29T22:35:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp agentic là toàn bộ lượt chạy “thực” của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận của mô hình →
thực thi công cụ → truyền trực tuyến phản hồi → lưu bền vững. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy đơn, được tuần tự hóa theo từng phiên, phát ra các sự kiện luồng và vòng đời
khi mô hình suy nghĩ, gọi công cụ và truyền trực tuyến đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó được
kết nối đầu-cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (cấp cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền vững siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + giá trị mặc định cho suy nghĩ/chi tiết/dấu vết
   - tải ảnh chụp Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lượt chạy qua hàng đợi theo từng phiên + hàng đợi toàn cục
   - phân giải mô hình + hồ sơ xác thực và dựng phiên pi
   - đăng ký sự kiện pi và truyền trực tuyến các delta của trợ lý/công cụ
   - áp đặt thời gian chờ -> hủy lượt chạy nếu vượt quá
   - trả về payload + siêu dữ liệu sử dụng
4. `subscribeEmbeddedPiSession` bắc cầu sự kiện pi-agent-core sang luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta của trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lượt chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn tranh chấp công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (thu thập/điều hướng/theo dõi) để đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Việc ghi bản ghi hội thoại cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên phát hiện được các trình ghi đi vòng qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác.
- Theo mặc định, khóa ghi phiên không tái nhập. Nếu một helper cố ý lồng việc lấy
  cùng một khóa trong khi vẫn giữ một trình ghi logic duy nhất, nó phải chọn tham gia rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lượt chạy trong sandbox có thể được chuyển hướng tới gốc workspace sandbox.
- Skills được tải (hoặc tái sử dụng từ ảnh chụp) và tiêm vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và tiêm vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi truyền trực tuyến. Bất kỳ
  đường dẫn ghi lại bản ghi hội thoại, Compaction hoặc cắt bớt nào về sau đều phải lấy cùng khóa đó trước khi mở hoặc
  sửa đổi tệp bản ghi hội thoại.

## Lắp ráp prompt + system prompt

- System prompt được dựng từ prompt cơ sở của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các override theo từng lượt chạy.
- Các giới hạn theo mô hình và token dự trữ cho Compaction được áp đặt.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình thấy gì.

## Điểm hook (nơi bạn có thể can thiệp)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script hướng sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng để thêm/xóa các tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop`, và các sự kiện lệnh khác (xem tài liệu Hook).

Xem [Hook](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè nhà cung cấp/mô hình một cách tất định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext`, hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích cũ có thể chạy ở một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau các hành động inline và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc làm im lặng toàn bộ lượt.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn và xử lý tham số/kết quả công cụ.
- **`before_install`**: kiểm tra phát hiện quét tích hợp và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi hội thoại phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn đến + đi.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Quy tắc quyết định hook cho bảo vệ gửi đi/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa chặn trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là không thao tác và không xóa chặn trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa hủy trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh các hook này theo cách khác. Harness app-server Codex giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt phản chiếu đã được tài liệu hóa,
trong khi hook gốc Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Truyền trực tuyến + phản hồi từng phần

- Delta của trợ lý được truyền trực tuyến từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Truyền trực tuyến theo khối có thể phát phản hồi từng phần trên `text_end` hoặc `message_end`.
- Truyền trực tuyến phần suy luận có thể được phát dưới dạng một luồng riêng hoặc dưới dạng phản hồi khối.
- Xem [Truyền trực tuyến](/vi/concepts/streaming) để biết hành vi chia đoạn và phản hồi khối.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Các lần gửi của công cụ nhắn tin được theo dõi để chặn xác nhận trợ lý trùng lặp.

## Định hình + chặn phản hồi

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và phần suy luận tùy chọn)
  - tóm tắt công cụ inline (khi chi tiết + được phép)
  - văn bản lỗi trợ lý khi mô hình gặp lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi
  payload gửi đi.
- Bản sao trùng lặp của công cụ nhắn tin bị loại bỏ khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể hiển thị và một công cụ gặp lỗi, một phản hồi lỗi công cụ dự phòng được phát ra
  (trừ khi công cụ nhắn tin đã gửi phản hồi người dùng có thể thấy).

## Compaction + thử lại

- Compaction tự động phát sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Luồng sự kiện (hiện nay)

- `lifecycle`: do `subscribeEmbeddedPiSession` phát ra (và như một phương án dự phòng bởi `agentCommand`)
- `assistant`: delta truyền trực tuyến từ pi-agent-core
- `tool`: sự kiện công cụ truyền trực tuyến từ pi-agent-core

## Xử lý kênh chat

- Delta của trợ lý được đệm thành tin nhắn `delta` của chat.
- Một `final` của chat được phát khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

- Mặc định của `agent.wait`: 30 giây (chỉ phần chờ). Tham số `timeoutMs` ghi đè.
- Runtime tác tử: mặc định `agents.defaults.timeoutSeconds` là 172800 giây (48 giờ); được áp đặt trong bộ hẹn giờ hủy của `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` cho lượt tác tử cô lập do cron sở hữu. Bộ lập lịch bắt đầu bộ hẹn giờ đó khi thực thi bắt đầu, hủy lượt chạy nền ở hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận thời gian chờ để một phiên con lỗi thời không thể khiến làn bị kẹt.
- Khôi phục phiên bị kẹt: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phát hiện các phiên `processing` kéo dài. Các lượt chạy nhúng đang hoạt động, thao tác phản hồi đang hoạt động và tác vụ làn phiên đang hoạt động mặc định chỉ cảnh báo; nếu chẩn đoán cho thấy không có công việc đang hoạt động cho phiên, watchdog giải phóng làn phiên bị ảnh hưởng để công việc khởi động đang xếp hàng có thể thoát.
- Thời gian chờ nhàn rỗi của mô hình: OpenClaw hủy yêu cầu mô hình khi không có đoạn phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` mở rộng watchdog nhàn rỗi này cho các nhà cung cấp cục bộ/tự lưu trữ chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn ở 120 giây. Các lượt chạy do Cron kích hoạt không có thời gian chờ mô hình hoặc tác tử rõ ràng sẽ tắt watchdog nhàn rỗi và dựa vào thời gian chờ ngoài của cron.
- Thời gian chờ yêu cầu HTTP của nhà cung cấp: `models.providers.<id>.timeoutSeconds` áp dụng cho các lần fetch HTTP mô hình của nhà cung cấp đó, bao gồm kết nối, header, body, thời gian chờ yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog nhàn rỗi luồng mô hình. Dùng thiết lập này cho các nhà cung cấp cục bộ/tự lưu trữ chậm như Ollama trước khi tăng thời gian chờ runtime của toàn bộ tác tử.

## Những nơi có thể kết thúc sớm

- Thời gian chờ tác tử (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc RPC hết thời gian chờ
- `agent.wait` hết thời gian chờ (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) — công cụ tác tử có sẵn
- [Hook](/vi/automation/hooks) — script hướng sự kiện được kích hoạt bởi sự kiện vòng đời tác tử
- [Compaction](/vi/concepts/compaction) — cách tóm tắt các cuộc trò chuyện dài
- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Suy nghĩ](/vi/tools/thinking) — cấu hình cấp độ suy nghĩ/suy luận
