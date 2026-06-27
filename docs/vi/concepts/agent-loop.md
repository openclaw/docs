---
read_when:
    - Bạn cần hướng dẫn chi tiết chính xác về vòng lặp agent hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cơ chế xếp hàng phiên, ghi bản ghi cuộc hội thoại, hoặc hành vi khóa ghi phiên
summary: Vòng đời vòng lặp tác nhân, luồng dữ liệu và ngữ nghĩa chờ
title: Vòng lặp tác tử
x-i18n:
    generated_at: "2026-06-27T17:21:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là lượt chạy "thực" đầy đủ của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → phát trực tuyến phản hồi → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy đơn lẻ, được tuần tự hóa theo từng phiên, phát ra các sự kiện vòng đời và luồng
khi mô hình suy nghĩ, gọi công cụ và phát trực tuyến đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây từ đầu đến cuối.

## Điểm vào

- RPC Gateway: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (cấp cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + mặc định thinking/verbose/trace
   - tải ảnh chụp nhanh Skills
   - gọi `runEmbeddedAgent` (runtime tác tử OpenClaw)
   - phát **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát sự kiện đó
3. `runEmbeddedAgent`:
   - tuần tự hóa các lượt chạy qua hàng đợi theo từng phiên + toàn cục
   - phân giải mô hình + hồ sơ xác thực và xây dựng phiên OpenClaw
   - đăng ký sự kiện runtime và phát trực tuyến delta của trợ lý/công cụ
   - áp dụng thời gian chờ -> hủy lượt chạy nếu vượt quá
   - với lượt Codex app-server, hủy một lượt đã được chấp nhận nếu lượt đó ngừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + siêu dữ liệu sử dụng
4. `subscribeEmbeddedAgentSession` bắc cầu sự kiện runtime tác tử sang luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta của trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lượt chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn tranh chấp công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (steer/followup/collect/interrupt) để đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Việc ghi bản ghi phiên cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên nó bắt được các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác. Trình ghi bản ghi phiên chờ tối đa `session.writeLock.acquireTimeoutMs`
  trước khi báo phiên đang bận; mặc định là `60000` ms.
- Khóa ghi phiên mặc định không tái nhập. Nếu một helper cố ý lồng việc lấy
  cùng khóa trong khi vẫn giữ một trình ghi logic duy nhất, nó phải chọn tham gia rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lượt chạy sandbox có thể chuyển hướng đến gốc workspace sandbox.
- Skills được tải (hoặc tái sử dụng từ ảnh chụp nhanh) và tiêm vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và tiêm vào báo cáo system prompt.
- Khóa ghi phiên được lấy; `SessionManager` được mở và chuẩn bị trước khi phát trực tuyến. Bất kỳ
  đường dẫn viết lại bản ghi, Compaction hoặc cắt ngắn nào về sau đều phải lấy cùng khóa trước khi mở hoặc
  chỉnh sửa tệp bản ghi.

## Lắp ráp prompt + system prompt

- System prompt được xây dựng từ prompt cơ sở của OpenClaw, prompt Skills, ngữ cảnh bootstrap và ghi đè theo từng lượt chạy.
- Giới hạn theo mô hình và token dự trữ cho Compaction được áp dụng.
- Xem [System prompt](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script hướng sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi xây dựng tệp bootstrap trước khi system prompt được hoàn tất.
  Dùng hook này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hooks).

Xem [Hooks](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/mô hình một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định nên nằm trong không gian system prompt.
- **`before_agent_start`**: hook tương thích cũ có thể chạy ở một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau hành động inline và trước lời gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc tắt tiếng hoàn toàn lượt đó.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra vật liệu cài đặt skill hoặc Plugin đã staging sau khi chính sách cài đặt của operator chạy, khi hook Plugin được tải trong tiến trình OpenClaw hiện tại.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn vào + ra.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời gateway.

Quy tắc quyết định hook cho bảo vệ gửi ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là no-op và không xóa block trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là no-op và không xóa block trước đó.
- Dùng `security.installPolicy`, không phải `before_install`, cho quyết định cho phép/chặn cài đặt do operator sở hữu cần bao phủ các đường dẫn cài đặt và cập nhật CLI.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là no-op và không xóa cancel trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Harness có thể điều chỉnh các hook này theo cách khác. Harness Codex app-server giữ
hook Plugin của OpenClaw làm hợp đồng tương thích cho các bề mặt được mirror có tài liệu,
trong khi hook native của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Phát trực tuyến + phản hồi một phần

- Delta của trợ lý được phát trực tuyến từ runtime tác tử và phát ra dưới dạng sự kiện `assistant`.
- Phát trực tuyến block có thể phát phản hồi một phần ở `text_end` hoặc `message_end`.
- Phát trực tuyến suy luận có thể được phát dưới dạng một luồng riêng hoặc dưới dạng phản hồi block.
- Xem [Phát trực tuyến](/vi/concepts/streaming) để biết hành vi chia chunk và phản hồi block.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Lượt gửi của công cụ nhắn tin được theo dõi để chặn xác nhận trùng lặp từ trợ lý.

## Định hình phản hồi + chặn gửi

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và suy luận tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được phép)
  - văn bản lỗi trợ lý khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi payload
  gửi ra.
- Bản sao công cụ nhắn tin trùng lặp được loại khỏi danh sách payload cuối cùng.
- Nếu không còn payload có thể render và một công cụ bị lỗi, phản hồi lỗi công cụ dự phòng sẽ được phát
  (trừ khi một công cụ nhắn tin đã gửi phản hồi hiển thị cho người dùng).

## Compaction + thử lại

- Auto-compaction phát sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Luồng sự kiện (hiện nay)

- `lifecycle`: được phát bởi `subscribeEmbeddedAgentSession` (và dưới dạng dự phòng bởi `agentCommand`)
- `assistant`: delta được phát trực tuyến từ runtime tác tử
- `tool`: sự kiện công cụ được phát trực tuyến từ runtime tác tử

## Xử lý kênh chat

- Delta của trợ lý được đệm thành tin nhắn chat `delta`.
- Một chat `final` được phát khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

- Mặc định `agent.wait`: 30 giây (chỉ thời gian chờ). Tham số `timeoutMs` ghi đè.
- Runtime tác tử: mặc định `agents.defaults.timeoutSeconds` là 172800 giây (48 giờ); được áp dụng trong bộ hẹn giờ hủy của `runEmbeddedAgent`.
- Runtime Cron: `timeoutSeconds` cho lượt tác tử cô lập thuộc sở hữu của cron. Bộ lập lịch khởi động bộ hẹn giờ đó khi bắt đầu thực thi, hủy lượt chạy bên dưới tại hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận thời gian chờ để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán độ sống phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài không có phản hồi, công cụ, trạng thái, block hoặc tiến trình ACP được quan sát. Các lượt chạy nhúng, lời gọi mô hình và lời gọi công cụ đang hoạt động báo cáo là `session.long_running`; các lời gọi mô hình im lặng có chủ sở hữu cũng vẫn là `session.long_running` cho đến `diagnostics.stuckSessionAbortMs` để provider chậm hoặc không phát trực tuyến không bị báo là đình trệ quá sớm. Công việc đang hoạt động nhưng không có tiến trình gần đây báo cáo là `session.stalled`; lời gọi mô hình có chủ sở hữu chuyển sang `session.stalled` tại hoặc sau ngưỡng hủy, và hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị ẩn dưới dạng đang chạy lâu. `session.stuck` được dành cho sổ sách phiên cũ có thể khôi phục, bao gồm các phiên đang xếp hàng nhàn rỗi có hoạt động mô hình/công cụ cũ không có chủ sở hữu. Sổ sách phiên cũ giải phóng làn phiên bị ảnh hưởng ngay sau khi các cổng khôi phục vượt qua; các lượt chạy nhúng bị đình trệ chỉ được hủy-xả sau `diagnostics.stuckSessionAbortMs` (mặc định: ít nhất 5 phút và gấp 3 lần ngưỡng cảnh báo) để công việc đang xếp hàng có thể tiếp tục mà không cắt ngang các lượt chạy chỉ đơn thuần là chậm. Khôi phục phát kết quả requested/completed có cấu trúc, và trạng thái chẩn đoán chỉ được đánh dấu nhàn rỗi nếu cùng thế hệ processing vẫn là hiện tại. Các chẩn đoán `session.stuck` lặp lại sẽ back off trong khi phiên vẫn không đổi.
- Thời gian chờ nhàn rỗi của mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` mở rộng watchdog nhàn rỗi này cho provider cục bộ/tự host chậm, nhưng vẫn bị giới hạn bởi bất kỳ `agents.defaults.timeoutSeconds` thấp hơn hoặc thời gian chờ riêng của lượt chạy vì các giá trị đó kiểm soát toàn bộ lượt chạy tác tử. Nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định giới hạn ở 120 giây. Các lượt chạy mô hình đám mây do Cron kích hoạt không có thời gian chờ mô hình hoặc tác tử rõ ràng dùng cùng watchdog nhàn rỗi mặc định; với thời gian chờ lượt chạy cron rõ ràng, tình trạng đình trệ luồng mô hình đám mây được giới hạn ở 60 giây để fallback mô hình đã cấu hình có thể chạy trước hạn chót cron bên ngoài. Các lượt chạy mô hình cục bộ hoặc tự host do Cron kích hoạt tắt watchdog ngầm định trừ khi cấu hình thời gian chờ rõ ràng, và thời gian chờ lượt chạy cron rõ ràng vẫn là cửa sổ nhàn rỗi cho provider cục bộ/tự host, vì vậy provider cục bộ chậm nên đặt `models.providers.<id>.timeoutSeconds`.
- Thời gian chờ yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các lượt fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, thời gian chờ yêu cầu SDK, xử lý hủy guarded-fetch toàn phần và watchdog nhàn rỗi luồng mô hình. Dùng giá trị này cho provider cục bộ/tự host chậm như Ollama trước khi tăng thời gian chờ toàn bộ runtime tác tử, và giữ thời gian chờ tác tử/runtime ít nhất cao bằng khi yêu cầu mô hình cần chạy lâu hơn.

## Nơi mọi thứ có thể kết thúc sớm

- Thời gian chờ của tác nhân (hủy bỏ)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc RPC hết thời gian chờ
- `agent.wait` hết thời gian chờ (chỉ chờ, không dừng tác nhân)

## Liên quan

- [Công cụ](/vi/tools) — các công cụ tác nhân có sẵn
- [Hooks](/vi/automation/hooks) — các tập lệnh theo sự kiện được kích hoạt bởi sự kiện vòng đời của tác nhân
- [Compaction](/vi/concepts/compaction) — cách tóm tắt các cuộc trò chuyện dài
- [Phê duyệt thực thi](/vi/tools/exec-approvals) — cổng phê duyệt cho các lệnh shell
- [Suy nghĩ](/vi/tools/thinking) — cấu hình cấp độ suy nghĩ/lập luận
