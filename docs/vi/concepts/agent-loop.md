---
read_when:
    - Bạn cần hướng dẫn chi tiết chính xác về vòng lặp tác tử hoặc các sự kiện trong vòng đời.
    - Bạn đang thay đổi hành vi xếp hàng đợi phiên, ghi bản chép lời hoặc khóa ghi phiên
summary: Vòng đời vòng lặp tác nhân, luồng và ngữ nghĩa chờ
title: Vòng lặp tác nhân
x-i18n:
    generated_at: "2026-07-20T04:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40633a772563988b38e3b1f9e7d7a69b7080bda51db28aef527c6878e7c85907
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác nhân là lượt chạy tuần tự hóa theo từng phiên, biến một tin nhắn thành
các hành động và phản hồi: tiếp nhận, tập hợp ngữ cảnh, suy luận mô hình, thực thi
công cụ, truyền phát, lưu trữ bền vững.

## Điểm vào

- RPC của Gateway: `agent` và `agent.wait`.
- CLI: `openclaw agent`.

## Trình tự chạy

1. RPC `agent` xác thực tham số, phân giải phiên (`sessionKey`/`sessionId`), lưu trữ bền vững siêu dữ liệu phiên và trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` chạy lượt: phân giải giá trị mặc định cho mô hình + chế độ suy nghĩ/chi tiết/theo vết, tải bản chụp Skills, gọi `runEmbeddedAgent` và phát một sự kiện dự phòng **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng chưa phát sự kiện đó.
3. `runEmbeddedAgent`: tuần tự hóa các lượt chạy qua hàng đợi theo từng phiên và hàng đợi toàn cục, phân giải mô hình + hồ sơ xác thực, xây dựng phiên OpenClaw, đăng ký nhận sự kiện thời gian chạy, truyền phát các phần gia tăng của trợ lý/công cụ, thực thi thời gian chờ của lượt chạy (hủy khi hết hạn) và trả về các tải trọng cùng siêu dữ liệu mức sử dụng. Đối với các lượt Codex app-server, nó cũng hủy một lượt đã được chấp nhận nếu lượt đó ngừng tạo tiến trình app-server trước một sự kiện kết thúc.
4. `subscribeEmbeddedAgentSession` bắc cầu các sự kiện thời gian chạy sang luồng `agent`: sự kiện công cụ sang `stream: "tool"`, phần gia tăng của trợ lý sang `stream: "assistant"`, sự kiện vòng đời sang `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) chờ **kết thúc/lỗi vòng đời** trên một `runId` và trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Xếp hàng và đồng thời

Các lượt chạy được tuần tự hóa theo khóa phiên (luồng phiên) và tùy chọn qua một luồng toàn cục, ngăn chặn xung đột công cụ/phiên. Các kênh nhắn tin chọn một chế độ hàng đợi (điều hướng/theo dõi/thu thập/ngắt) để đưa vào hệ thống luồng này; xem [Hàng đợi lệnh](/vi/concepts/queue).

Các thao tác ghi bản chép lời còn được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa nhận biết tiến trình và dựa trên tệp, nên có thể phát hiện các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ tiến trình khác. Theo mặc định, trình ghi chờ tối đa 60 giây (ghi đè bằng biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) trước khi báo cáo phiên đang bận.

Theo mặc định, khóa ghi phiên không thể tái nhập. Một trình trợ giúp cố ý lồng việc lấy cùng một khóa trong khi vẫn duy trì một trình ghi logic phải chủ động bật `allowReentrant: true`.

## Chuẩn bị phiên và không gian làm việc

- Không gian làm việc được phân giải và tạo; các lượt chạy trong sandbox có thể được chuyển hướng đến thư mục gốc không gian làm việc sandbox.
- Skills được tải (hoặc tái sử dụng từ bản chụp) và chèn vào môi trường cùng lời nhắc.
- Các tệp khởi động/ngữ cảnh được phân giải và chèn vào lời nhắc hệ thống.
- Khóa ghi phiên được lấy và đích bản chép lời phiên được chuẩn bị trước khi bắt đầu truyền phát. Mọi đường dẫn ghi lại, Compaction hoặc cắt ngắn bản chép lời sau đó đều phải lấy cùng khóa trước khi sửa đổi các hàng bản chép lời SQLite.

## Tập hợp lời nhắc

Lời nhắc hệ thống được xây dựng từ lời nhắc cơ sở của OpenClaw, lời nhắc Skills, ngữ cảnh khởi động và các ghi đè theo từng lượt chạy. Các giới hạn dành riêng cho mô hình và token dự phòng cho Compaction được thực thi. Xem [Lời nhắc hệ thống](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Hook

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): các tập lệnh hướng sự kiện cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: các điểm mở rộng bên trong vòng đời tác nhân/công cụ và pipeline Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi xây dựng các tệp khởi động trước khi lời nhắc hệ thống được hoàn thiện. Dùng hook này để thêm hoặc xóa các tệp ngữ cảnh khởi động.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu Hook).

Xem [Hook](/vi/automation/hooks) để biết cách thiết lập và các ví dụ.

### Hook Plugin

Các hook này chạy bên trong vòng lặp tác nhân hoặc pipeline Gateway:

| Hook                                                    | Thời điểm chạy                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Trước phiên (không có `messages`), để ghi đè nhà cung cấp/mô hình một cách xác định trước khi phân giải.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Sau khi tải phiên (có `messages`), để chèn `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi. Dùng `prependContext` cho văn bản động theo từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định thuộc không gian lời nhắc hệ thống. |
| `before_agent_reply`                                    | Sau các hành động nội tuyến, trước lệnh gọi LLM. Cho phép Plugin tiếp quản lượt và trả về phản hồi tổng hợp hoặc hoàn toàn không phản hồi.                                                                                                                                                                |
| `agent_end`                                             | Sau khi hoàn tất, cùng danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Quan sát hoặc chú thích các chu kỳ Compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Chặn và xử lý tham số/kết quả công cụ.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Sau khi chính sách cài đặt của người vận hành chạy, trên nội dung cài đặt Skills/Plugin đã được chuẩn bị, khi các hook Plugin được tải trong tiến trình hiện tại.                                                                                                                                                           |
| `tool_result_persist`                                   | Chuyển đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản chép lời phiên do OpenClaw sở hữu.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hook tin nhắn đến và đi.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Các ranh giới vòng đời phiên.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Sự kiện vòng đời Gateway.                                                                                                                                                                                                                                                                   |

Quy tắc quyết định của hook cho các lớp bảo vệ đầu ra/công cụ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các trình xử lý có mức ưu tiên thấp hơn. `{ block: false }` không thực hiện thao tác nào và không xóa một lệnh chặn trước đó.
- `before_install`: có cùng ngữ nghĩa kết thúc/không thao tác như trên. Dùng `security.installPolicy`, không dùng `before_install`, cho các quyết định cho phép/chặn cài đặt do người vận hành sở hữu và phải bao quát các đường dẫn cài đặt lẫn cập nhật qua CLI.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các trình xử lý có mức ưu tiên thấp hơn. `{ cancel: false }` không thực hiện thao tác nào và không xóa một lệnh hủy trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh các hook này. Harness Codex app-server giữ các hook Plugin của OpenClaw làm hợp đồng tương thích cho các bề mặt phản chiếu đã được lập tài liệu; hook gốc của Codex là một cơ chế Codex cấp thấp riêng biệt.

## Truyền phát

- Các phần gia tăng của trợ lý được truyền phát từ thời gian chạy tác nhân dưới dạng sự kiện `assistant`.
- Truyền phát theo khối có thể phát các phản hồi từng phần trên `text_end` hoặc `message_end`.
- Truyền phát suy luận có thể là một luồng riêng hoặc các phản hồi theo khối.
- Xem [Truyền phát](/vi/concepts/streaming) để biết hành vi chia đoạn và phản hồi theo khối.

## Thực thi công cụ

- Các sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và tải trọng hình ảnh trước khi ghi nhật ký/phát.
- Các lượt gửi bằng công cụ nhắn tin được theo dõi để ngăn xác nhận trùng lặp từ trợ lý.

## Định hình phản hồi

Các tải trọng cuối cùng được tập hợp từ văn bản của trợ lý (cùng phần suy luận tùy chọn), bản tóm tắt công cụ nội tuyến (khi bật chế độ chi tiết và được phép) và văn bản lỗi của trợ lý khi mô hình gặp lỗi.

- Token im lặng chính xác `NO_REPLY` được lọc khỏi các tải trọng gửi đi.
- Các mục trùng lặp từ công cụ nhắn tin được loại khỏi danh sách tải trọng cuối cùng.
- Nếu không còn tải trọng nào có thể hiển thị và một công cụ gặp lỗi, phản hồi lỗi công cụ dự phòng sẽ được phát, trừ khi một công cụ nhắn tin đã gửi phản hồi hiển thị cho người dùng.

## Compaction và thử lại

Compaction tự động phát các sự kiện luồng `compaction` và có thể kích hoạt thử lại. Khi thử lại, các bộ đệm trong bộ nhớ và bản tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp. Xem [Compaction](/vi/concepts/compaction).

## Luồng sự kiện

- `lifecycle`: được phát bởi `subscribeEmbeddedAgentSession` (và dưới dạng dự phòng bởi `agentCommand`).
- `assistant`: các phần gia tăng được truyền phát từ thời gian chạy tác nhân.
- `tool`: các sự kiện công cụ được truyền phát từ thời gian chạy tác nhân.

Gateway chiếu các sự kiện vòng đời và sự kiện bắt đầu/kết thúc của công cụ vào
[sổ cái kiểm toán](/vi/cli/audit) có giới hạn và chỉ chứa siêu dữ liệu. Phép chiếu này ghi lại nguồn gốc và
mã kết quả mà không sao chép lời nhắc, tin nhắn, đối số công cụ, kết quả công cụ
hoặc lỗi thô ra khỏi đường dẫn bản chép lời/thời gian chạy.

## Xử lý kênh trò chuyện

Các phần gia tăng của trợ lý được lưu vào bộ đệm thành tin nhắn `delta` của cuộc trò chuyện. Một `final` của cuộc trò chuyện được phát khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

| Thời gian chờ                                    | Mặc định                               | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Chỉ chờ; tham số `timeoutMs` sẽ ghi đè. Không dừng lượt chạy nền.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Thời gian chạy của agent (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Được thực thi bởi bộ hẹn giờ hủy của `runEmbeddedAgent`. Đặt `0` để có ngân sách chạy không giới hạn; các bộ giám sát khả năng hoạt động của luồng mô hình vẫn được áp dụng.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Bộ giám sát CLI backend không có đầu ra                   | được tính cho mỗi lượt chạy CLI mới/tiếp tục     | Tách biệt với thời gian chạy của agent. Cấu hình `agents.defaults.cliBackends.<id>.reliability.watchdog.{fresh,resume}` cho các CLI có thể không phát đầu ra trong khi làm việc. Tác vụ nền nội bộ của CLI dùng chung tiến trình con với tác vụ cha và không tiếp tục tồn tại sau khi hết thời gian chờ tổng thể của agent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Lượt agent biệt lập của Cron                         | do Cron quản lý                          | Bộ lập lịch khởi động bộ hẹn giờ riêng khi bắt đầu thực thi, hủy lượt chạy tại thời hạn đã cấu hình, sau đó thực hiện quá trình dọn dẹp có giới hạn trước khi ghi nhận việc hết thời gian chờ để một phiên con cũ không thể khiến luồng bị kẹt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Thời gian chờ khi mô hình không hoạt động                               | Đám mây 120s; tự lưu trữ 300s           | OpenClaw hủy yêu cầu mô hình khi không có đoạn phản hồi nào đến trước khi khoảng thời gian không hoạt động kết thúc. `models.providers.<id>.timeoutSeconds` kéo dài bộ giám sát không hoạt động này cho các nhà cung cấp cục bộ/tự lưu trữ chậm, nhưng vẫn bị giới hạn bởi mọi `agents.defaults.timeoutSeconds` hữu hạn thấp hơn hoặc thời gian chờ dành riêng cho lượt chạy, vì chúng chi phối toàn bộ lượt chạy của agent. Ngân sách chạy không giới hạn vẫn duy trì bộ giám sát không hoạt động theo lớp nhà cung cấp. Các lượt chạy mô hình đám mây do Cron kích hoạt mà không có thời gian chờ rõ ràng cho mô hình/agent sử dụng cùng giá trị mặc định; khi có thời gian chờ chạy Cron rõ ràng, tình trạng luồng mô hình đám mây bị ngưng trệ được giới hạn ở 60s để các mô hình dự phòng đã cấu hình vẫn có thể chạy trước thời hạn Cron bên ngoài. Các lượt chạy do Cron kích hoạt trên endpoint thực sự cục bộ (baseUrl loopback/riêng tư) vẫn giữ tùy chọn không áp dụng thời gian chờ không hoạt động cục bộ; các nhà cung cấp tự lưu trữ trên baseUrl mạng nhận bộ giám sát ngầm định 300s. Khi có thời gian chờ chạy Cron rõ ràng, tình trạng ngưng trệ cục bộ/tự lưu trữ được giới hạn ở thời gian chờ đó. Đặt `models.providers.<id>.timeoutSeconds` cho các nhà cung cấp cục bộ chậm. |
| Thời gian chờ yêu cầu HTTP của nhà cung cấp                    | `models.providers.<id>.timeoutSeconds` | Bao gồm kết nối, header, nội dung phản hồi, thời gian chờ yêu cầu SDK, xử lý hủy của guarded-fetch và bộ giám sát luồng mô hình không hoạt động cho nhà cung cấp đó. Sử dụng cho các nhà cung cấp cục bộ/tự lưu trữ chậm (ví dụ Ollama) trước khi tăng thời gian chờ chạy tổng thể của agent; duy trì thời gian chờ của agent/thời gian chạy ít nhất ở mức tương đương khi yêu cầu mô hình cần chạy lâu hơn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Chẩn đoán phiên bị kẹt

Khi bật chẩn đoán, ngưỡng tích hợp sẵn là hai phút sẽ phân loại các phiên `processing` kéo dài mà không quan sát thấy phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP:

- Các lượt chạy nhúng, lệnh gọi mô hình và lệnh gọi công cụ đang hoạt động được báo cáo là `session.long_running`. Các lệnh gọi mô hình im lặng có chủ sở hữu vẫn ở trạng thái `session.long_running` cho đến ngưỡng hủy để các nhà cung cấp chậm hoặc không truyền phát không bị gắn cờ là ngưng trệ quá sớm.
- Công việc đang hoạt động nhưng không có tiến trình gần đây được báo cáo là `session.stalled`. Các lệnh gọi mô hình có chủ sở hữu chuyển sang `session.stalled` tại hoặc sau ngưỡng hủy; hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị che giấu dưới dạng chạy lâu.
- `session.stuck` được dành riêng cho dữ liệu quản lý phiên cũ có thể khôi phục, bao gồm các phiên nhàn rỗi trong hàng đợi có hoạt động mô hình/công cụ cũ không có chủ sở hữu.

Ngưỡng hủy ít nhất là 5 phút và gấp 3 lần ngưỡng cảnh báo. Dữ liệu quản lý phiên cũ giải phóng ngay luồng phiên bị ảnh hưởng sau khi các cổng khôi phục được thông qua; các lượt chạy nhúng bị ngưng trệ chỉ được hủy và tháo cạn sau ngưỡng hủy, để công việc trong hàng đợi tiếp tục mà không cắt ngang các lượt chạy chỉ đơn thuần là chậm. Quá trình khôi phục phát ra kết quả có cấu trúc cho yêu cầu/hoàn tất; trạng thái chẩn đoán chỉ được đánh dấu là nhàn rỗi nếu cùng thế hệ xử lý vẫn còn hiện hành, và các chẩn đoán `session.stuck` lặp lại sẽ giãn dần trong khi phiên vẫn không thay đổi.

## Những trường hợp có thể kết thúc sớm

- Hết thời gian chờ của agent (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc hết thời gian chờ RPC
- Hết thời gian chờ `agent.wait` (chỉ chờ, không dừng agent)

## Liên quan

- [Công cụ](/vi/tools) - các công cụ agent khả dụng
- [Hook](/vi/automation/hooks) - các tập lệnh hướng sự kiện được kích hoạt bởi các sự kiện vòng đời của agent
- [Compaction](/vi/concepts/compaction) - cách tóm tắt các cuộc hội thoại dài
- [Phê duyệt thực thi](/vi/tools/exec-approvals) - các cổng phê duyệt cho lệnh shell
- [Suy nghĩ](/vi/tools/thinking) - cấu hình cấp độ suy nghĩ/lập luận
