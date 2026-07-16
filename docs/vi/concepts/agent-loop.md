---
read_when:
    - Bạn cần hướng dẫn chi tiết chính xác về vòng lặp tác tử hoặc các sự kiện trong vòng đời.
    - Bạn đang thay đổi cơ chế xếp hàng đợi phiên, ghi bản chép lời hoặc hành vi khóa ghi phiên
summary: Vòng đời vòng lặp tác tử, luồng và ngữ nghĩa chờ
title: Vòng lặp tác tử
x-i18n:
    generated_at: "2026-07-16T14:18:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Vòng lặp tác tử là lượt chạy tuần tự hóa theo từng phiên, chuyển một tin nhắn thành
các hành động và phản hồi: tiếp nhận, tập hợp ngữ cảnh, suy luận mô hình, thực thi
công cụ, truyền phát, lưu trữ lâu dài.

## Điểm vào

- Gateway RPC: `agent` và `agent.wait`.
- CLI: `openclaw agent`.

## Trình tự chạy

1. `agent` RPC xác thực các tham số, phân giải phiên (`sessionKey`/`sessionId`), lưu trữ lâu dài siêu dữ liệu phiên và trả về `{ runId, acceptedAt }` ngay lập tức.
2. `agentCommand` thực hiện lượt: phân giải mô hình cùng các giá trị mặc định cho suy luận/chi tiết/theo dõi, tải ảnh chụp nhanh Skills, gọi `runEmbeddedAgent` và phát một sự kiện dự phòng **kết thúc/lỗi vòng đời** nếu vòng lặp nhúng chưa phát sự kiện đó.
3. `runEmbeddedAgent`: tuần tự hóa các lượt chạy qua hàng đợi theo từng phiên và hàng đợi toàn cục, phân giải mô hình cùng hồ sơ xác thực, tạo phiên OpenClaw, đăng ký nhận các sự kiện thời gian chạy, truyền phát các phần gia tăng của trợ lý/công cụ, áp dụng thời gian chờ của lượt chạy (hủy khi hết hạn), rồi trả về các tải dữ liệu cùng siêu dữ liệu sử dụng. Đối với các lượt Codex app-server, hàm này cũng hủy một lượt đã được chấp nhận nếu lượt đó ngừng tạo tiến trình app-server trước khi có sự kiện kết thúc.
4. `subscribeEmbeddedAgentSession` kết nối các sự kiện thời gian chạy với luồng `agent`: sự kiện công cụ tới `stream: "tool"`, phần gia tăng của trợ lý tới `stream: "assistant"`, sự kiện vòng đời tới `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) chờ **kết thúc/lỗi vòng đời** trên một `runId` và trả về `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Xếp hàng và tính đồng thời

Các lượt chạy được tuần tự hóa theo từng khóa phiên (làn phiên) và có thể thông qua một làn toàn cục, qua đó ngăn xung đột công cụ/phiên. Các kênh nhắn tin chọn một chế độ hàng đợi (steer/followup/collect/interrupt) để đưa dữ liệu vào hệ thống làn này; xem [Hàng đợi lệnh](/vi/concepts/queue).

Các thao tác ghi bản chép lời còn được bảo vệ bằng khóa ghi phiên trên tệp phiên. Khóa này nhận biết tiến trình và dựa trên tệp, nên có thể phát hiện các trình ghi bỏ qua hàng đợi trong tiến trình hoặc đến từ tiến trình khác. Các trình ghi chờ tối đa `session.writeLock.acquireTimeoutMs` (mặc định `60000` ms; ghi đè bằng biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) trước khi báo phiên đang bận.

Theo mặc định, khóa ghi phiên không hỗ trợ tái nhập. Một trình trợ giúp cố ý lồng việc lấy cùng một khóa trong khi vẫn duy trì một trình ghi logic phải chủ động bật `allowReentrant: true`.

## Chuẩn bị phiên và không gian làm việc

- Không gian làm việc được phân giải và tạo; các lượt chạy trong sandbox có thể chuyển hướng tới thư mục gốc của không gian làm việc sandbox.
- Skills được tải (hoặc tái sử dụng từ ảnh chụp nhanh) và chèn vào môi trường cùng lời nhắc.
- Các tệp khởi tạo/ngữ cảnh được phân giải và chèn vào lời nhắc hệ thống.
- Khóa ghi phiên được lấy và đích bản chép lời của phiên được chuẩn bị trước khi bắt đầu truyền phát. Mọi đường dẫn ghi lại bản chép lời, Compaction hoặc cắt bớt sau đó đều phải lấy cùng khóa trước khi thay đổi các hàng bản chép lời SQLite.

## Tập hợp lời nhắc

Lời nhắc hệ thống được tạo từ lời nhắc cơ sở của OpenClaw, lời nhắc Skills, ngữ cảnh khởi tạo và các giá trị ghi đè theo từng lượt chạy. Các giới hạn riêng theo mô hình và token dự trữ cho Compaction được áp dụng. Xem [Lời nhắc hệ thống](/vi/concepts/system-prompt) để biết mô hình nhìn thấy gì.

## Hook

OpenClaw có hai hệ thống hook:

- **Hook nội bộ** (hook Gateway): các tập lệnh hướng sự kiện dành cho lệnh và sự kiện vòng đời.
- **Hook Plugin**: các điểm mở rộng bên trong vòng đời tác tử/công cụ và quy trình Gateway.

### Hook nội bộ (hook Gateway)

- **`agent:bootstrap`**: chạy trong khi tạo các tệp khởi tạo, trước khi lời nhắc hệ thống được hoàn thiện. Dùng hook này để thêm hoặc xóa các tệp ngữ cảnh khởi tạo.
- **Hook lệnh**: `/new`, `/reset`, `/stop` và các sự kiện lệnh khác (xem tài liệu về Hook).

Xem [Hook](/vi/automation/hooks) để biết cách thiết lập và các ví dụ.

### Hook Plugin

Các hook này chạy bên trong vòng lặp tác tử hoặc quy trình Gateway:

| Hook                                                    | Thời điểm chạy                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Trước phiên (không có `messages`), để ghi đè nhà cung cấp/mô hình một cách xác định trước khi phân giải.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Sau khi tải phiên (có `messages`), để chèn `prependContext`, `systemPrompt`, `prependSystemContext` hoặc `appendSystemContext` trước khi gửi. Dùng `prependContext` cho văn bản động theo từng lượt và các trường ngữ cảnh hệ thống cho hướng dẫn ổn định thuộc phạm vi lời nhắc hệ thống. |
| `before_agent_start`                                    | Hook tương thích cũ có thể chạy trong một trong hai giai đoạn; ưu tiên các hook tường minh ở trên.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Sau các hành động nội tuyến, trước lệnh gọi LLM. Cho phép Plugin tiếp quản lượt và trả về phản hồi tổng hợp hoặc hoàn toàn không phản hồi.                                                                                                                                                                |
| `agent_end`                                             | Sau khi hoàn tất, với danh sách tin nhắn cuối cùng và siêu dữ liệu lượt chạy.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Quan sát hoặc chú thích các chu kỳ Compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Chặn và xử lý các tham số/kết quả công cụ.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Sau khi chính sách cài đặt của người vận hành chạy, trên nội dung cài đặt Skills/Plugin đã được chuẩn bị, khi các hook Plugin được tải trong tiến trình hiện tại.                                                                                                                                                           |
| `tool_result_persist`                                   | Chuyển đổi đồng bộ kết quả công cụ trước khi chúng được ghi vào bản chép lời phiên do OpenClaw sở hữu.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Các hook tin nhắn đến và đi.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Các ranh giới vòng đời phiên.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Các sự kiện vòng đời Gateway.                                                                                                                                                                                                                                                                   |

Quy tắc quyết định của hook dành cho các bộ bảo vệ dữ liệu đi/công cụ:

- `before_tool_call`: `{ block: true }` là kết quả kết thúc và dừng các trình xử lý có mức ưu tiên thấp hơn. `{ block: false }` không thực hiện thao tác nào và không xóa lệnh chặn trước đó.
- `before_install`: có cùng ngữ nghĩa kết thúc/không thao tác như trên. Dùng `security.installPolicy`, không dùng `before_install`, cho các quyết định cho phép/chặn cài đặt do người vận hành sở hữu mà phải bao phủ các đường dẫn cài đặt và cập nhật qua CLI.
- `message_sending`: `{ cancel: true }` là kết quả kết thúc và dừng các trình xử lý có mức ưu tiên thấp hơn. `{ cancel: false }` không thực hiện thao tác nào và không xóa lệnh hủy trước đó.

Xem [Hook Plugin](/vi/plugins/hooks) để biết API hook và chi tiết đăng ký.

Các harness có thể điều chỉnh những hook này. Harness Codex app-server giữ các hook Plugin của OpenClaw làm hợp đồng tương thích cho các bề mặt phản chiếu đã được ghi lại trong tài liệu; các hook gốc của Codex là một cơ chế Codex cấp thấp riêng biệt.

## Truyền phát

- Các phần gia tăng của trợ lý được truyền phát từ thời gian chạy tác tử dưới dạng sự kiện `assistant`.
- Truyền phát theo khối có thể phát các phản hồi từng phần trên `text_end` hoặc `message_end`.
- Truyền phát phần suy luận có thể là một luồng riêng hoặc chặn phản hồi.
- Xem [Truyền phát](/vi/concepts/streaming) để biết hành vi chia đoạn và phản hồi theo khối.

## Thực thi công cụ

- Các sự kiện bắt đầu/cập nhật/kết thúc công cụ được phát trên luồng `tool`.
- Kết quả công cụ được làm sạch về kích thước và tải dữ liệu hình ảnh trước khi ghi nhật ký/phát.
- Các lần gửi bằng công cụ nhắn tin được theo dõi để ngăn các xác nhận trùng lặp từ trợ lý.

## Định hình phản hồi

Các tải dữ liệu cuối cùng được tập hợp từ văn bản của trợ lý (cộng thêm phần suy luận tùy chọn), các bản tóm tắt công cụ nội tuyến (khi bật chế độ chi tiết và được phép) và văn bản lỗi của trợ lý khi mô hình gặp lỗi.

- Token im lặng chính xác `NO_REPLY` được lọc khỏi các tải dữ liệu đi.
- Các mục trùng lặp của công cụ nhắn tin được loại khỏi danh sách tải dữ liệu cuối cùng.
- Nếu không còn tải dữ liệu nào có thể hiển thị và một công cụ gặp lỗi, phản hồi lỗi công cụ dự phòng sẽ được phát, trừ khi công cụ nhắn tin đã gửi phản hồi mà người dùng có thể nhìn thấy.

## Compaction và thử lại

Compaction tự động phát các sự kiện luồng `compaction` và có thể kích hoạt thử lại. Khi thử lại, các bộ đệm trong bộ nhớ và bản tóm tắt công cụ được đặt lại để tránh đầu ra trùng lặp. Xem [Compaction](/vi/concepts/compaction).

## Luồng sự kiện

- `lifecycle`: do `subscribeEmbeddedAgentSession` phát (và được `agentCommand` phát làm phương án dự phòng).
- `assistant`: các phần gia tăng được truyền phát từ thời gian chạy tác tử.
- `tool`: các sự kiện công cụ được truyền phát từ thời gian chạy tác tử.

Gateway chiếu các sự kiện vòng đời và sự kiện bắt đầu/kết thúc công cụ vào
[sổ cái kiểm toán](/vi/cli/audit) có giới hạn và chỉ chứa siêu dữ liệu. Phép chiếu này ghi lại nguồn gốc và
mã kết quả mà không sao chép lời nhắc, tin nhắn, đối số công cụ, kết quả công cụ
hoặc lỗi thô ra khỏi đường dẫn bản chép lời/thời gian chạy.

## Xử lý kênh trò chuyện

Các phần gia tăng của trợ lý được lưu vào bộ đệm trong các tin nhắn trò chuyện `delta`. Một `final` trò chuyện được phát khi **kết thúc/lỗi vòng đời**.

## Thời gian chờ

| Thời gian chờ                                     | Mặc định                               | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Chỉ chờ; tham số `timeoutMs` sẽ ghi đè. Không dừng lượt chạy nền bên dưới.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Thời gian chạy của tác tử (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Được thực thi bằng bộ hẹn giờ hủy của `runEmbeddedAgent`. Đặt `0` để có ngân sách thời gian chạy không giới hạn; các bộ giám sát tính hoạt động của luồng mô hình vẫn được áp dụng.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Lượt tác tử cô lập của Cron                         | do cron sở hữu                          | Bộ lập lịch khởi động bộ hẹn giờ riêng khi quá trình thực thi bắt đầu, hủy lượt chạy tại thời hạn đã cấu hình, sau đó thực hiện dọn dẹp có giới hạn trước khi ghi nhận hết thời gian chờ để phiên con cũ không thể khiến luồng bị kẹt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Thời gian chờ khi mô hình không hoạt động                               | Đám mây 120s; tự lưu trữ 300s           | OpenClaw hủy yêu cầu mô hình khi không có khối phản hồi nào đến trước khi khoảng thời gian không hoạt động kết thúc. `models.providers.<id>.timeoutSeconds` kéo dài bộ giám sát không hoạt động này cho các nhà cung cấp cục bộ/tự lưu trữ chậm, nhưng vẫn bị giới hạn bởi bất kỳ `agents.defaults.timeoutSeconds` hữu hạn nào thấp hơn hoặc thời gian chờ dành riêng cho lượt chạy, vì chúng chi phối toàn bộ lượt chạy của tác tử. Ngân sách thời gian chạy không giới hạn vẫn duy trì bộ giám sát không hoạt động theo lớp nhà cung cấp. Các lượt chạy mô hình đám mây do Cron kích hoạt mà không có thời gian chờ mô hình/tác tử rõ ràng sẽ dùng cùng giá trị mặc định; khi có thời gian chờ lượt chạy cron rõ ràng, tình trạng luồng mô hình đám mây bị đình trệ được giới hạn ở 60s để các mô hình dự phòng đã cấu hình vẫn có thể chạy trước thời hạn cron bên ngoài. Các lượt chạy do Cron kích hoạt trên điểm cuối thực sự cục bộ (baseUrl vòng lặp/riêng tư) vẫn giữ tùy chọn không áp dụng thời gian chờ cục bộ; các nhà cung cấp tự lưu trữ trên baseUrl mạng nhận bộ giám sát ngầm định 300s. Khi có thời gian chờ lượt chạy cron rõ ràng, tình trạng đình trệ cục bộ/tự lưu trữ được giới hạn ở thời gian chờ đó. Đặt `models.providers.<id>.timeoutSeconds` cho các nhà cung cấp cục bộ chậm. |
| Thời gian chờ yêu cầu HTTP của nhà cung cấp                    | `models.providers.<id>.timeoutSeconds` | Bao gồm kết nối, tiêu đề, nội dung, thời gian chờ yêu cầu SDK, xử lý hủy guarded-fetch và bộ giám sát luồng mô hình không hoạt động cho nhà cung cấp đó. Hãy dùng cho các nhà cung cấp cục bộ/tự lưu trữ chậm (ví dụ Ollama) trước khi tăng thời gian chờ của toàn bộ thời gian chạy tác tử; duy trì thời gian chờ tác tử/thời gian chạy ít nhất ở mức tương đương khi yêu cầu mô hình cần chạy lâu hơn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Chẩn đoán phiên bị kẹt

Khi bật chẩn đoán, `diagnostics.stuckSessionWarnMs` (mặc định `120000` ms) phân loại các phiên `processing` kéo dài mà không quan sát thấy tiến trình phản hồi, công cụ, trạng thái, khối hoặc ACP:

- Các lượt chạy nhúng, lệnh gọi mô hình và lệnh gọi công cụ đang hoạt động được báo cáo là `session.long_running`. Các lệnh gọi mô hình im lặng có chủ sở hữu vẫn là `session.long_running` cho đến `diagnostics.stuckSessionAbortMs` để các nhà cung cấp chậm hoặc không truyền phát không bị gắn cờ là đình trệ quá sớm.
- Công việc đang hoạt động nhưng gần đây không có tiến trình được báo cáo là `session.stalled`. Các lệnh gọi mô hình có chủ sở hữu chuyển thành `session.stalled` tại hoặc sau ngưỡng hủy; hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị che giấu dưới dạng hoạt động kéo dài.
- `session.stuck` được dành riêng cho việc ghi sổ phiên cũ có thể khôi phục, bao gồm các phiên đang xếp hàng nhưng không hoạt động có hoạt động mô hình/công cụ cũ không có chủ sở hữu.

`diagnostics.stuckSessionAbortMs` mặc định tối thiểu là 5 phút và gấp 3 lần ngưỡng cảnh báo. Việc ghi sổ phiên cũ giải phóng ngay luồng phiên bị ảnh hưởng sau khi vượt qua các cổng khôi phục; các lượt chạy nhúng bị đình trệ chỉ được hủy và xả sau ngưỡng hủy, vì vậy công việc trong hàng đợi tiếp tục mà không cắt ngang các lượt chạy chỉ đơn thuần là chậm. Quá trình khôi phục phát ra các kết quả yêu cầu/hoàn tất có cấu trúc; trạng thái chẩn đoán chỉ được đánh dấu là không hoạt động nếu cùng thế hệ xử lý đó vẫn còn hiện hành, và các chẩn đoán `session.stuck` lặp lại sẽ tăng thời gian chờ khi phiên không thay đổi.

## Những trường hợp có thể kết thúc sớm

- Hết thời gian chờ tác tử (hủy)
- AbortSignal (hủy)
- Gateway ngắt kết nối hoặc hết thời gian chờ RPC
- Hết thời gian chờ `agent.wait` (chỉ chờ, không dừng tác tử)

## Liên quan

- [Công cụ](/vi/tools) - các công cụ tác tử hiện có
- [Hook](/vi/automation/hooks) - các tập lệnh hướng sự kiện được kích hoạt bởi sự kiện vòng đời của tác tử
- [Compaction](/vi/concepts/compaction) - cách các cuộc hội thoại dài được tóm tắt
- [Phê duyệt thực thi](/vi/tools/exec-approvals) - các cổng phê duyệt cho lệnh shell
- [Suy nghĩ](/vi/tools/thinking) - cấu hình cấp độ suy nghĩ/lập luận
