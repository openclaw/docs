---
read_when:
    - Bạn cần hướng dẫn chi tiết chính xác về vòng lặp tác tử hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cơ chế xếp hàng phiên, các thao tác ghi bản ghi cuộc hội thoại hoặc hành vi khóa ghi phiên
summary: Vòng đời của vòng lặp tác tử, luồng dữ liệu và ngữ nghĩa chờ
title: Vòng lặp tác tử
x-i18n:
    generated_at: "2026-05-02T10:38:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là toàn bộ lần chạy “thật” của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → phản hồi luồng → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành các hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lần chạy duy nhất, được tuần tự hóa cho mỗi phiên, phát ra các sự kiện vòng đời và luồng
khi mô hình suy nghĩ, gọi công cụ và phát luồng đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó được
đấu nối từ đầu đến cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (mức cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + mặc định thinking/verbose/trace
   - tải ảnh chụp Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lần chạy qua hàng đợi theo phiên + hàng đợi toàn cục
   - phân giải mô hình + hồ sơ xác thực và xây dựng phiên pi
   - đăng ký sự kiện pi và phát luồng delta của trợ lý/công cụ
   - áp đặt thời gian chờ -> hủy lần chạy nếu vượt quá
   - với các lượt Codex app-server, hủy một lượt đã được chấp nhận nếu lượt đó ngừng tạo tiến trình app-server trước sự kiện kết thúc
   - trả về payload + siêu dữ liệu mức dùng
4. `subscribeEmbeddedPiSession` nối sự kiện pi-agent-core sang luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lần chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn các race giữa công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (collect/steer/followup) để đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Các lần ghi bản ghi hội thoại cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên phát hiện các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác.
- Khóa ghi phiên mặc định không cho phép vào lại. Nếu một helper cố ý lồng việc lấy
  cùng khóa trong khi vẫn giữ một trình ghi logic duy nhất, helper đó phải chọn tham gia rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lần chạy sandbox có thể chuyển hướng sang gốc workspace sandbox.
- Skills được tải (hoặc tái dùng từ ảnh chụp) và đưa vào env cùng prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và đưa vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi phát luồng. Mọi
  đường dẫn ghi lại bản ghi hội thoại, compaction hoặc cắt ngắn về sau đều phải lấy cùng khóa trước khi mở hoặc
  thay đổi tệp bản ghi hội thoại.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt nền tảng của OpenClaw, prompt Skills, ngữ cảnh bootstrap và các ghi đè theo lần chạy.
- Các giới hạn theo mô hình và token dự trữ cho compaction được áp đặt.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): các tập lệnh theo sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: các điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy khi xây dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng hook này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/mô hình một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để chèn `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo lượt và các trường system-context cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích cũ có thể chạy ở một trong hai pha; ưu tiên các hook tường minh ở trên.
- **`before_agent_reply`**: chạy sau các hành động inline và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc im lặng hoàn toàn lượt đó.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lần chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra phát hiện quét tích hợp và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi hội thoại phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn đến + đi.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Quy tắc quyết định hook cho bảo vệ gửi đi/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một lệnh chặn trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là no-op và không xóa một lệnh chặn trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một lệnh hủy trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh những hook này theo cách khác. Harness Codex app-server giữ
hook Plugin của OpenClaw làm hợp đồng tương thích cho các bề mặt phản chiếu được ghi tài liệu,
trong khi hook gốc của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Phát luồng + phản hồi một phần

- Delta trợ lý được phát luồng từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Phát luồng khối có thể phát phản hồi một phần ở `text_end` hoặc `message_end`.
- Phát luồng lập luận có thể được phát ra như một luồng riêng hoặc dưới dạng phản hồi khối.
- Xem [Phát luồng](/vi/concepts/streaming) để biết hành vi chia khúc và phản hồi khối.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch theo kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Các lần gửi bằng công cụ nhắn tin được theo dõi để chặn xác nhận trợ lý trùng lặp.

## Định hình phản hồi + chặn phát

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và lập luận tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được cho phép)
  - văn bản lỗi trợ lý khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi các
  payload gửi đi.
- Các mục trùng lặp từ công cụ nhắn tin được xóa khỏi danh sách payload cuối cùng.
- Nếu không còn payload nào có thể render và một công cụ bị lỗi, một phản hồi lỗi công cụ dự phòng sẽ được phát ra
  (trừ khi một công cụ nhắn tin đã gửi phản hồi người dùng thấy được).

## Compaction + thử lại

- Auto-compaction phát sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline compaction.

## Luồng sự kiện (hiện nay)

- `lifecycle`: do `subscribeEmbeddedPiSession` phát ra (và dự phòng bởi `agentCommand`)
- `assistant`: delta được phát luồng từ pi-agent-core
- `tool`: sự kiện công cụ được phát luồng từ pi-agent-core

## Xử lý kênh trò chuyện

- Delta trợ lý được đệm vào tin nhắn chat `delta`.
- Một chat `final` được phát ra khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

- Mặc định `agent.wait`: 30 giây (chỉ là thời gian chờ). Tham số `timeoutMs` ghi đè.
- Runtime tác tử: `agents.defaults.timeoutSeconds` mặc định 172800 giây (48 giờ); được áp đặt trong bộ hẹn giờ hủy của `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` cho lượt tác tử cô lập thuộc sở hữu của cron. Bộ lập lịch bắt đầu bộ hẹn giờ đó khi thực thi bắt đầu, hủy lần chạy bên dưới tại hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận thời gian chờ để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán độ sống phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài không có phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP được quan sát. Các lần chạy nhúng đang hoạt động, lệnh gọi mô hình và lệnh gọi công cụ được báo cáo là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây được báo cáo là `session.stalled`; `session.stuck` chỉ dành cho việc ghi sổ phiên cũ không có công việc hoạt động, và chỉ đường dẫn đó giải phóng làn phiên bị ảnh hưởng để công việc khởi động đang xếp hàng có thể thoát. Các chẩn đoán `session.stuck` lặp lại sẽ giãn cách trong khi phiên vẫn không đổi.
- Thời gian chờ nhàn rỗi của mô hình: OpenClaw hủy yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` mở rộng watchdog nhàn rỗi này cho các provider cục bộ/tự lưu trữ chậm; nếu không OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn tối đa ở 120 giây. Các lần chạy do Cron kích hoạt không có thời gian chờ mô hình hoặc tác tử rõ ràng sẽ tắt watchdog nhàn rỗi và dựa vào thời gian chờ ngoài của cron.
- Thời gian chờ yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lần fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, thời gian chờ yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog nhàn rỗi luồng mô hình. Dùng mục này cho các provider cục bộ/tự lưu trữ chậm như Ollama trước khi tăng thời gian chờ runtime toàn bộ tác tử.

## Nơi mọi thứ có thể kết thúc sớm

- Thời gian chờ tác tử (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc RPC hết thời gian chờ
- `agent.wait` hết thời gian chờ (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) — các công cụ tác tử có sẵn
- [Hooks](/vi/automation/hooks) — tập lệnh theo sự kiện được kích hoạt bởi các sự kiện vòng đời tác tử
- [Compaction](/vi/concepts/compaction) — cách tóm tắt các cuộc hội thoại dài
- [Phê duyệt exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Thinking](/vi/tools/thinking) — cấu hình mức thinking/lập luận
