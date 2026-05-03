---
read_when:
    - Bạn cần hướng dẫn từng bước chính xác về vòng lặp tác tử hoặc các sự kiện vòng đời
    - Bạn đang thay đổi cơ chế xếp hàng phiên, thao tác ghi bản ghi hội thoại, hoặc hành vi khóa ghi phiên
summary: Vòng đời vòng lặp tác nhân, luồng và ngữ nghĩa chờ
title: Vòng lặp tác tử
x-i18n:
    generated_at: "2026-05-03T21:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là toàn bộ lượt chạy “thực” của một tác tử: tiếp nhận → lắp ráp ngữ cảnh → suy luận mô hình →
thực thi công cụ → truyền phát phản hồi → lưu bền. Đây là đường dẫn có thẩm quyền biến một tin nhắn
thành hành động và phản hồi cuối cùng, đồng thời giữ trạng thái phiên nhất quán.

Trong OpenClaw, một vòng lặp là một lượt chạy đơn lẻ, được tuần tự hóa cho mỗi phiên, phát ra các sự kiện vòng đời và luồng
khi mô hình suy nghĩ, gọi công cụ và truyền phát đầu ra. Tài liệu này giải thích cách vòng lặp xác thực đó
được nối dây từ đầu đến cuối.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: lệnh `agent`.

## Cách hoạt động (mức cao)

1. RPC `agent` xác thực tham số, phân giải phiên (sessionKey/sessionId), lưu bền siêu dữ liệu phiên, trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy tác tử:
   - phân giải mô hình + giá trị mặc định thinking/verbose/trace
   - tải snapshot Skills
   - gọi `runEmbeddedPiAgent` (runtime pi-agent-core)
   - phát ra **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng không phát ra một sự kiện như vậy
3. `runEmbeddedPiAgent`:
   - tuần tự hóa các lượt chạy qua hàng đợi theo từng phiên + hàng đợi toàn cục
   - phân giải mô hình + hồ sơ xác thực và tạo phiên Pi
   - đăng ký sự kiện Pi và truyền phát delta trợ lý/công cụ
   - áp dụng timeout -> hủy lượt chạy nếu vượt quá
   - với lượt Codex app-server, hủy một lượt đã được chấp nhận nếu nó ngừng tạo tiến trình app-server trước một sự kiện kết thúc
   - trả về payload + siêu dữ liệu sử dụng
4. `subscribeEmbeddedPiSession` bắc cầu sự kiện pi-agent-core sang luồng `agent` của OpenClaw:
   - sự kiện công cụ => `stream: "tool"`
   - delta trợ lý => `stream: "assistant"`
   - sự kiện vòng đời => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` dùng `waitForAgentRun`:
   - chờ **kết thúc/lỗi vòng đời** cho `runId`
   - trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Xếp hàng + đồng thời

- Các lượt chạy được tuần tự hóa theo khóa phiên (làn phiên) và tùy chọn qua một làn toàn cục.
- Điều này ngăn race giữa công cụ/phiên và giữ lịch sử phiên nhất quán.
- Các kênh nhắn tin có thể chọn chế độ hàng đợi (thu thập/điều hướng/theo dõi) đưa vào hệ thống làn này.
  Xem [Hàng đợi lệnh](/vi/concepts/queue).
- Việc ghi bản ghi hội thoại cũng được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này
  nhận biết tiến trình và dựa trên tệp, nên bắt được các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ
  tiến trình khác. Trình ghi bản ghi hội thoại phiên chờ tối đa `session.writeLock.acquireTimeoutMs`
  trước khi báo phiên đang bận; mặc định là `60000` ms.
- Khóa ghi phiên mặc định không tái nhập. Nếu một helper cố ý lồng việc giành
  cùng một khóa trong khi vẫn giữ một trình ghi logic duy nhất, helper đó phải chọn rõ ràng bằng
  `allowReentrant: true`.

## Chuẩn bị phiên + workspace

- Workspace được phân giải và tạo; các lượt chạy sandbox có thể chuyển hướng tới gốc workspace sandbox.
- Skills được tải (hoặc dùng lại từ snapshot) và được tiêm vào env và prompt.
- Các tệp bootstrap/ngữ cảnh được phân giải và tiêm vào báo cáo prompt hệ thống.
- Khóa ghi phiên được giành; `SessionManager` được mở và chuẩn bị trước khi truyền phát. Mọi
  đường dẫn ghi lại bản ghi hội thoại, Compaction hoặc cắt ngắn về sau phải lấy cùng khóa đó trước khi mở hoặc
  thay đổi tệp bản ghi hội thoại.

## Lắp ráp prompt + prompt hệ thống

- Prompt hệ thống được tạo từ prompt cơ sở của OpenClaw, prompt Skills, ngữ cảnh bootstrap và ghi đè theo từng lượt chạy.
- Các giới hạn riêng theo mô hình và token dự trữ cho Compaction được áp dụng.
- Xem [Prompt hệ thống](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Điểm hook (nơi bạn có thể chặn)

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): script theo sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: điểm mở rộng bên trong vòng đời tác tử/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi tạo tệp bootstrap trước khi prompt hệ thống được hoàn tất.
  Dùng mục này để thêm/xóa tệp ngữ cảnh bootstrap.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hook).

Xem [Hook](/vi/automation/hooks) để biết cách thiết lập và ví dụ.

### Hook Plugin (vòng đời tác tử + Gateway)

Các hook này chạy bên trong vòng lặp tác tử hoặc pipeline Gateway:

- **`before_model_resolve`**: chạy trước phiên (không có `messages`) để ghi đè provider/mô hình một cách xác định trước khi phân giải mô hình.
- **`before_prompt_build`**: chạy sau khi tải phiên (có `messages`) để tiêm `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi prompt. Dùng `prependContext` cho văn bản động theo từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định nên nằm trong không gian prompt hệ thống.
- **`before_agent_start`**: hook tương thích cũ có thể chạy ở một trong hai pha; ưu tiên các hook rõ ràng ở trên.
- **`before_agent_reply`**: chạy sau các hành động inline và trước lệnh gọi LLM, cho phép Plugin nhận lượt và trả về phản hồi tổng hợp hoặc làm lượt im lặng hoàn toàn.
- **`agent_end`**: kiểm tra danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy sau khi hoàn tất.
- **`before_compaction` / `after_compaction`**: quan sát hoặc chú thích các chu kỳ Compaction.
- **`before_tool_call` / `after_tool_call`**: chặn tham số/kết quả công cụ.
- **`before_install`**: kiểm tra các phát hiện quét tích hợp sẵn và tùy chọn chặn cài đặt skill hoặc Plugin.
- **`tool_result_persist`**: biến đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản ghi hội thoại phiên do OpenClaw sở hữu.
- **`message_received` / `message_sending` / `message_sent`**: hook tin nhắn đến + đi.
- **`session_start` / `session_end`**: ranh giới vòng đời phiên.
- **`gateway_start` / `gateway_stop`**: sự kiện vòng đời Gateway.

Quy tắc quyết định hook cho chặn đầu ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa block trước đó.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `before_install`: `{ block: false }` là không thao tác và không xóa block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa hủy trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh các hook này theo cách khác nhau. Harness Codex app-server giữ
hook Plugin OpenClaw làm hợp đồng tương thích cho các bề mặt phản chiếu đã được tài liệu hóa,
trong khi hook native của Codex vẫn là một cơ chế Codex cấp thấp riêng biệt.

## Truyền phát + phản hồi một phần

- Delta trợ lý được truyền phát từ pi-agent-core và phát ra dưới dạng sự kiện `assistant`.
- Truyền phát khối có thể phát ra phản hồi một phần trên `text_end` hoặc `message_end`.
- Truyền phát suy luận có thể được phát ra như một luồng riêng hoặc như phản hồi khối.
- Xem [Truyền phát](/vi/concepts/streaming) để biết hành vi chia chunk và phản hồi khối.

## Thực thi công cụ + công cụ nhắn tin

- Sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát ra trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và payload hình ảnh trước khi ghi log/phát ra.
- Các lần gửi của công cụ nhắn tin được theo dõi để chặn xác nhận trợ lý bị trùng lặp.

## Định hình phản hồi + ức chế

- Payload cuối cùng được lắp ráp từ:
  - văn bản trợ lý (và suy luận tùy chọn)
  - tóm tắt công cụ inline (khi verbose + được phép)
  - văn bản lỗi trợ lý khi mô hình lỗi
- Token im lặng chính xác `NO_REPLY` / `no_reply` được lọc khỏi payload
  đi.
- Các bản trùng lặp của công cụ nhắn tin được xóa khỏi danh sách payload cuối cùng.
- Nếu không còn payload nào có thể render và một công cụ bị lỗi, một phản hồi lỗi công cụ dự phòng được phát ra
  (trừ khi một công cụ nhắn tin đã gửi phản hồi hiển thị cho người dùng).

## Compaction + thử lại

- Tự động Compaction phát ra sự kiện luồng `compaction` và có thể kích hoạt thử lại.
- Khi thử lại, bộ đệm trong bộ nhớ và tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp.
- Xem [Compaction](/vi/concepts/compaction) để biết pipeline Compaction.

## Luồng sự kiện (hiện nay)

- `lifecycle`: được phát ra bởi `subscribeEmbeddedPiSession` (và dưới dạng dự phòng bởi `agentCommand`)
- `assistant`: delta được truyền phát từ pi-agent-core
- `tool`: sự kiện công cụ được truyền phát từ pi-agent-core

## Xử lý kênh chat

- Delta trợ lý được đệm vào tin nhắn `delta` của chat.
- Một `final` của chat được phát ra khi **kết thúc/lỗi vòng đời**.

## Timeout

- Mặc định `agent.wait`: 30 giây (chỉ thời gian chờ). Tham số `timeoutMs` ghi đè.
- Runtime tác tử: mặc định `agents.defaults.timeoutSeconds` là 172800 giây (48 giờ); được áp dụng trong bộ hẹn giờ hủy `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` của lượt tác tử cô lập do Cron sở hữu. Bộ lập lịch bắt đầu bộ hẹn giờ đó khi thực thi bắt đầu, hủy lượt chạy nền ở hạn chót đã cấu hình, rồi chạy dọn dẹp có giới hạn trước khi ghi nhận timeout để một phiên con cũ không thể giữ làn bị kẹt.
- Chẩn đoán tính sống của phiên: khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` phân loại các phiên `processing` kéo dài không có phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP nào được quan sát. Lượt chạy nhúng đang hoạt động, lệnh gọi mô hình và lệnh gọi công cụ báo cáo là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây báo cáo là `session.stalled`; `session.stuck` được dành cho sổ sách phiên cũ không có công việc đang hoạt động. Sổ sách phiên cũ giải phóng làn phiên bị ảnh hưởng ngay lập tức; lượt chạy nhúng bị stalled chỉ được hủy-xả sau một khoảng không-tiến-trình kéo dài (ít nhất 10 phút và 5 lần ngưỡng cảnh báo) để công việc trong hàng đợi có thể tiếp tục mà không cắt ngang các lượt chạy chỉ đơn thuần chậm. Các chẩn đoán `session.stuck` lặp lại sẽ lùi dần trong khi phiên vẫn không đổi.
- Timeout nhàn rỗi mô hình: OpenClaw hủy một yêu cầu mô hình khi không có chunk phản hồi nào đến trước cửa sổ nhàn rỗi. `models.providers.<id>.timeoutSeconds` kéo dài watchdog nhàn rỗi này cho các provider local/tự host chậm; nếu không, OpenClaw dùng `agents.defaults.timeoutSeconds` khi được cấu hình, mặc định bị giới hạn ở 120 giây. Các lượt chạy do Cron kích hoạt không có timeout mô hình hoặc tác tử rõ ràng sẽ tắt watchdog nhàn rỗi và dựa vào timeout ngoài của Cron.
- Timeout yêu cầu HTTP của provider: `models.providers.<id>.timeoutSeconds` áp dụng cho các fetch HTTP mô hình của provider đó, bao gồm kết nối, header, body, timeout yêu cầu SDK, xử lý hủy guarded-fetch tổng thể và watchdog nhàn rỗi luồng mô hình. Dùng mục này cho các provider local/tự host chậm như Ollama trước khi tăng timeout runtime của toàn bộ tác tử.

## Nơi mọi thứ có thể kết thúc sớm

- Timeout tác tử (hủy)
- AbortSignal (hủy)
- Ngắt kết nối Gateway hoặc timeout RPC
- Timeout `agent.wait` (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) — các công cụ tác tử khả dụng
- [Hook](/vi/automation/hooks) — script theo sự kiện được kích hoạt bởi sự kiện vòng đời tác tử
- [Compaction](/vi/concepts/compaction) — cách các cuộc hội thoại dài được tóm tắt
- [Phê duyệt thực thi](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Suy nghĩ](/vi/tools/thinking) — cấu hình mức suy nghĩ/suy luận
