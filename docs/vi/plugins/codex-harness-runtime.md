---
read_when:
    - Bạn cần hợp đồng hỗ trợ thời gian chạy của harness Codex
    - Bạn đang gỡ lỗi các công cụ Codex gốc, hook, Compaction hoặc tải lên phản hồi
    - Bạn đang thay đổi hành vi plugin trên các lượt chạy harness của OpenClaw và Codex
summary: Ranh giới runtime, hook, công cụ, quyền và chẩn đoán cho harness Codex
title: Môi trường chạy của bộ khung Codex
x-i18n:
    generated_at: "2026-07-04T20:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Trang này ghi lại hợp đồng runtime cho các lượt của Codex harness. Để thiết lập và
định tuyến, hãy bắt đầu với [Codex harness](/vi/plugins/codex-harness). Đối với các trường cấu hình,
xem [tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Tổng quan

Chế độ Codex không phải là OpenClaw với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều phần hơn
của vòng lặp mô hình native, và OpenClaw điều chỉnh các bề mặt Plugin, công cụ, phiên và
chẩn đoán quanh ranh giới đó.

OpenClaw vẫn sở hữu định tuyến kênh, tệp phiên, phân phối tin nhắn hiển thị,
công cụ động của OpenClaw, phê duyệt, phân phối phương tiện và bản sao transcript.
Codex sở hữu luồng native chuẩn, vòng lặp mô hình native, tiếp diễn công cụ native
và Compaction native.

Định tuyến prompt đi theo runtime đã chọn, không chỉ theo chuỗi nhà cung cấp. Một
lượt Codex native nhận chỉ dẫn dành cho nhà phát triển của app-server Codex, trong khi một
tuyến tương thích OpenClaw rõ ràng giữ prompt hệ thống OpenClaw bình thường ngay cả
khi nó dùng xác thực hoặc vận chuyển OpenAI kiểu Codex.

Codex native giữ các chỉ dẫn nền/mô hình do Codex sở hữu và hành vi tài liệu dự án
theo cấu hình luồng Codex đang hoạt động. OpenClaw bắt đầu và tiếp tục các luồng
Codex native với personality tích hợp của Codex bị tắt để các tệp personality
workspace và danh tính agent OpenClaw vẫn có thẩm quyền. Các lần chạy OpenClaw
nhẹ vẫn giữ cơ chế chặn tài liệu dự án hiện có của chúng. Chỉ dẫn dành cho nhà phát triển
của OpenClaw bao gồm các mối quan tâm runtime của OpenClaw như phân phối kênh nguồn,
công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh adapter và các tệp hồ sơ workspace
của agent đang hoạt động. Catalog Skills của OpenClaw và con trỏ `MEMORY.md` được định tuyến qua công cụ
được chiếu thành chỉ dẫn dành cho nhà phát triển về cộng tác theo phạm vi lượt
cho Codex native. Nội dung `BOOTSTRAP.md` đang hoạt động và cơ chế tiêm dự phòng
`MEMORY.md` đầy đủ vẫn dùng ngữ cảnh tham chiếu đầu vào lượt.

## Liên kết luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào một luồng Codex hiện có, lượt tiếp theo
gửi lại mô hình OpenAI, chính sách phê duyệt, sandbox và tầng dịch vụ hiện được chọn
cho app-server. Việc chuyển từ `openai/gpt-5.5` sang
`openai/gpt-5.2` giữ liên kết luồng nhưng yêu cầu Codex tiếp tục với
mô hình mới được chọn.

## Phản hồi hiển thị và Heartbeat

Khi một lượt trò chuyện trực tiếp/nguồn chạy qua Codex harness, phản hồi hiển thị
mặc định là tự động phân phối trợ lý cuối cùng cho các bề mặt WebChat nội bộ.
Điều này giữ Codex căn chỉnh với hợp đồng prompt của Pi harness: agent phản hồi
bình thường, và OpenClaw đăng văn bản cuối cùng vào cuộc trò chuyện nguồn. Đặt
`messages.visibleReplies: "message_tool"` khi một cuộc trò chuyện trực tiếp/nguồn nên
cố ý giữ riêng tư văn bản trợ lý cuối cùng trừ khi agent gọi
`message(action="send")`.

Các lượt Heartbeat của Codex cũng mặc định nhận `heartbeat_respond` trong catalog
công cụ OpenClaw có thể tìm kiếm, để agent có thể ghi lại liệu lần đánh thức nên
giữ im lặng hay thông báo mà không mã hóa luồng điều khiển đó trong văn bản cuối cùng.

Hướng dẫn chủ động riêng cho Heartbeat được gửi như một chỉ dẫn dành cho nhà phát triển
ở chế độ cộng tác của Codex trên chính lượt Heartbeat. Các lượt trò chuyện thông thường khôi phục
chế độ Codex Default thay vì mang triết lý Heartbeat trong prompt runtime bình thường
của chúng. Khi có `HEARTBEAT.md` không rỗng, chỉ dẫn chế độ cộng tác Heartbeat
trỏ Codex tới tệp thay vì nhúng nội dung của tệp đó.

## Ranh giới hook

Codex harness có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các harness OpenClaw và Codex.     |
| Middleware extension app-server Codex | Plugin đóng gói OpenClaw | Hành vi adapter theo từng lượt quanh công cụ động của OpenClaw.     |
| Hook native Codex                    | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ native từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex ở cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Đối với cầu nối công cụ native và quyền được hỗ trợ,
OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest` và `Stop`.

Khi phê duyệt app-server Codex được bật, nghĩa là `approvalPolicy` không phải
`"never"`, cấu hình hook native được tiêm mặc định sẽ bỏ qua `PermissionRequest` để
trình duyệt xét app-server của Codex và cầu nối phê duyệt của OpenClaw xử lý các
leo thang thực sau khi duyệt xét. Người vận hành có thể thêm rõ ràng `permission_request` vào
`nativeHookRelay.events` khi họ cần relay tương thích.

Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
điều khiển cấp Codex. Chúng không được lộ ra dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Đối với công cụ động của OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, vì vậy OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
adapter harness. Đối với công cụ native của Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng nó không thể viết lại luồng Codex
native trừ khi Codex lộ thao tác đó thông qua app-server hoặc callback hook native.

Sự kiện `PreToolUse` ở chế độ báo cáo của app-server Codex trì hoãn yêu cầu phê duyệt Plugin
tới phê duyệt app-server tương ứng. Nếu một hook `before_tool_call` của OpenClaw
trả về `requireApproval` trong khi payload native đặt chế độ phê duyệt báo cáo
(`openclaw_approval_mode` là `"report"`), relay hook native ghi lại
yêu cầu phê duyệt Plugin và không trả về quyết định native nào. Khi Codex gửi
yêu cầu phê duyệt app-server cho cùng lượt dùng công cụ, OpenClaw mở prompt
phê duyệt Plugin và ánh xạ quyết định trở lại Codex. Sự kiện `PermissionRequest`
của Codex là một đường phê duyệt riêng và vẫn có thể định tuyến qua phê duyệt OpenClaw
khi runtime được cấu hình cho cầu nối đó.

Thông báo mục của app-server Codex cũng cung cấp các quan sát `after_tool_call`
bất đồng bộ cho hoàn tất công cụ native chưa được relay `PostToolUse` native
bao phủ. Các quan sát này chỉ dành cho đo từ xa và tương thích Plugin; chúng
không thể chặn, trì hoãn hoặc biến đổi lệnh gọi công cụ native.

Các phép chiếu vòng đời Compaction và LLM đến từ thông báo app-server Codex
và trạng thái adapter OpenClaw, không phải lệnh hook Codex native.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input` và
`llm_output` của OpenClaw là quan sát cấp adapter, không phải bản chụp từng byte
của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` native của Codex được
chiếu thành sự kiện agent `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong Codex runtime v1:

| Bề mặt                                       | Hỗ trợ                                                                          | Lý do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex               | Được hỗ trợ                                                                        | Codex app-server sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                                                                                                                                                                                                                                                                                          |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác nằm ngoài runtime của mô hình.                                                                                                                                                                                                                                                                                                                                                                                    |
| Công cụ động OpenClaw                        | Được hỗ trợ                                                                        | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugin prompt và ngữ cảnh                    | Được hỗ trợ                                                                        | OpenClaw chiếu prompt/ngữ cảnh đặc thù của OpenClaw vào lượt Codex, đồng thời giữ các prompt cơ sở, mô hình và tài liệu dự án đã cấu hình do Codex sở hữu trong luồng Codex gốc. OpenClaw tắt personality tích hợp của Codex cho các luồng gốc để các tệp personality trong workspace tác tử vẫn là nguồn có thẩm quyền. Chỉ thị dành cho nhà phát triển gốc của Codex chỉ chấp nhận hướng dẫn lệnh được phạm vi hóa rõ ràng tới `codex_app_server`; các gợi ý lệnh toàn cục cũ vẫn được giữ cho các bề mặt prompt không phải Codex. |
| Vòng đời context engine                      | Được hỗ trợ                                                                        | Việc lắp ráp, nạp vào và bảo trì sau lượt chạy xung quanh các lượt Codex. Context engine không thay thế compaction gốc của Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hook công cụ động                            | Được hỗ trợ                                                                        | Middleware `before_tool_call`, `after_tool_call` và kết quả công cụ chạy xung quanh các công cụ động do OpenClaw sở hữu.                                                                                                                                                                                                                                                                                                                                                                          |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của bộ chuyển đổi                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload trung thực ở chế độ Codex.                                                                                                                                                                                                                                                                                                                                                           |
| Cổng sửa đổi câu trả lời cuối cùng                    | Được hỗ trợ qua relay hook gốc                                              | `Stop` của Codex được relay tới `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình nữa trước khi hoàn tất.                                                                                                                                                                                                                                                                                                                                                                |
| Chặn hoặc quan sát shell, patch và MCP gốc | Được hỗ trợ qua relay hook gốc                                              | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ gốc đã commit, bao gồm payload MCP trên Codex app-server `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số.                                                                                                                                                                                                                                                                               |
| Chính sách quyền gốc                      | Được hỗ trợ qua phê duyệt của Codex app-server và relay hook gốc tương thích | Yêu cầu phê duyệt của Codex app-server được định tuyến qua OpenClaw sau khi Codex review. Relay hook gốc `PermissionRequest` là tùy chọn bật cho các chế độ phê duyệt gốc vì Codex phát nó trước khi guardian review.                                                                                                                                                                                                                                                                          |
| Ghi lại quỹ đạo app-server                 | Được hỗ trợ                                                                        | OpenClaw ghi lại yêu cầu mà nó gửi tới app-server và các thông báo app-server mà nó nhận được.                                                                                                                                                                                                                                                                                                                                                                                    |

Không được hỗ trợ trong Codex runtime v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Đường hướng tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                            |
| Lịch sử transcript gốc của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên sửa đổi các phần nội bộ không được hỗ trợ. | Thêm API Codex app-server rõ ràng nếu cần can thiệp vào luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó chuyển đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu compaction gốc phong phú                     | OpenClaw có thể yêu cầu compaction gốc, nhưng không nhận được danh sách giữ/lược bỏ ổn định, chênh lệch token, tóm tắt hoàn tất hoặc payload tóm tắt.   | Cần các sự kiện compaction phong phú hơn từ Codex.                                                     |
| Can thiệp compaction                             | OpenClaw không cho phép plugin hoặc context engine phủ quyết, viết lại hoặc thay thế compaction gốc của Codex.                                             | Thêm hook trước/sau compaction của Codex nếu plugin cần phủ quyết hoặc viết lại compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte             | OpenClaw có thể ghi lại các yêu cầu và thông báo của app-server, nhưng lõi Codex xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần sự kiện truy vết yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Quyền gốc và elicitation MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và rơi tiếp về guardian riêng hoặc đường dẫn phê duyệt người dùng của nó.

Các chế độ phê duyệt của Codex app-server mặc định bỏ qua hook gốc này. Hành vi này
áp dụng khi `permission_request` được đưa vào rõ ràng trong
`nativeHookRelay.events` hoặc một runtime tương thích cài đặt nó.

Khi một operator chọn `allow-always` cho yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ dấu vân tay chính xác của provider/session/đầu vào công cụ/cwd đó trong một
cửa sổ phiên có giới hạn. Quyết định được ghi nhớ cố ý chỉ khớp chính xác:
lệnh, đối số, payload công cụ hoặc cwd thay đổi sẽ tạo một
phê duyệt mới.

Các elicitation phê duyệt công cụ Codex MCP được định tuyến qua luồng
phê duyệt plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Prompt `request_user_input` của Codex được gửi trở lại
cuộc trò chuyện gốc, và tin nhắn theo dõi tiếp theo trong hàng đợi trả lời yêu cầu
máy chủ gốc đó thay vì được điều hướng làm ngữ cảnh bổ sung. Các yêu cầu elicitation MCP khác
thất bại theo hướng đóng.

Đối với luồng phê duyệt plugin chung mang các prompt này, xem
[Yêu cầu quyền Plugin](/vi/plugins/plugin-permission-requests).

## Điều hướng hàng đợi

Điều hướng hàng đợi lượt chạy đang hoạt động ánh xạ lên `turn/steer` của Codex app-server. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn chat
ở chế độ steer trong khoảng lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer`
theo thứ tự đến.

Quá trình đánh giá Codex và các lượt Compaction thủ công có thể từ chối việc điều hướng trong cùng lượt. Trong
trường hợp đó, OpenClaw đợi lượt chạy đang hoạt động hoàn tất trước khi bắt đầu lời nhắc.
Dùng `/queue followup` hoặc `/queue collect` khi tin nhắn mặc định nên được đưa vào hàng đợi
thay vì điều hướng. Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải phản hồi Codex lên

Khi `/diagnostics [note]` được phê duyệt cho một phiên dùng harness Codex
gốc, OpenClaw cũng gọi `feedback/upload` của app-server Codex cho các luồng
Codex liên quan. Lượt tải lên yêu cầu app-server bao gồm nhật ký cho từng luồng
được liệt kê và các luồng con Codex được sinh ra khi có sẵn.

Lượt tải lên đi qua đường dẫn phản hồi bình thường của Codex tới máy chủ OpenAI. Nếu phản hồi
Codex bị tắt trong app-server đó, lệnh trả về lỗi của app-server.
Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh, id phiên OpenClaw,
id luồng Codex và các lệnh `codex resume <thread-id>` cục bộ cho những luồng
đã được gửi.

Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các id Codex đó và
không gửi phản hồi Codex. Lượt tải lên không thay thế bản xuất chẩn đoán Gateway
cục bộ. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết hành vi
phê duyệt, quyền riêng tư, gói cục bộ và trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang được gắn mà không cần toàn bộ gói chẩn đoán Gateway.

## Compaction và bản sao transcript

Khi mô hình được chọn dùng harness Codex, Compaction luồng gốc thuộc về
app-server Codex. OpenClaw không chạy Compaction kiểm tra trước cho các lượt Codex,
không thay Compaction Codex bằng Compaction của context-engine, và không
quay về tóm tắt bằng OpenClaw hoặc OpenAI công khai khi không thể bắt đầu
Compaction Codex gốc. OpenClaw giữ một bản sao transcript cho lịch sử kênh,
tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness trong tương lai.

Các yêu cầu Compaction rõ ràng, chẳng hạn như `/compact` hoặc một thao tác compact thủ công
do Plugin yêu cầu, bắt đầu Compaction Codex gốc bằng `thread/compact/start`.
OpenClaw giữ yêu cầu và lease shared-client mở cho đến khi Codex phát ra mục hoàn tất
`contextCompaction` khớp, rồi báo cáo lượt Compaction
là đã hoàn tất. Nếu lượt kết thúc đó vượt quá thời gian chờ Compaction đã cấu hình,
OpenClaw yêu cầu ngắt lượt gốc. Lease và hàng rào Compaction theo luồng
vẫn được giữ cho đến khi Codex báo cáo trạng thái kết thúc hoặc xác nhận RPC ngắt.
Nếu Codex không xác nhận trong khoảng ân hạn ngắt, OpenClaw cho
kết nối nghỉ hưu trước khi giải phóng hàng rào. Kết nối từ xa cũng tách
binding luồng khớp để công việc sau đó không thể chồng lấn một lượt từ xa chưa xác nhận.
Các lượt khác trên kết nối đã nghỉ hưu sẽ thất bại và có thể thử lại trên một client mới.
Việc đóng client, hủy yêu cầu, hoặc một lượt Compaction thất bại sẽ trả về
một thao tác thất bại.

Khi một context engine yêu cầu phép chiếu bootstrap luồng Codex, OpenClaw
chiếu tên và id lệnh gọi công cụ, hình dạng đầu vào, và nội dung kết quả công cụ đã được biên tập
vào luồng Codex mới. Nó không sao chép giá trị đối số lệnh gọi công cụ thô vào
phép chiếu đó.

Bản sao bao gồm lời nhắc của người dùng, văn bản trợ lý cuối cùng, và các bản ghi lập luận
hoặc kế hoạch Codex gọn nhẹ khi app-server phát ra chúng. OpenClaw ghi lại
thời điểm bắt đầu Compaction gốc và trạng thái kết thúc, nhưng không để lộ
bản tóm tắt Compaction mà con người đọc được hoặc danh sách có thể kiểm toán về những mục Codex
đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
ghi lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi một kết quả công cụ transcript phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn nhà cung cấp phương tiện. Hình ảnh,
video, nhạc, PDF, TTS, và hiểu phương tiện dùng các thiết lập nhà cung cấp/mô hình
tương ứng như `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, và `messages.tts`.

Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và đầu ra công cụ nhắn tin tiếp tục
đi qua đường dẫn phân phối OpenClaw bình thường. Tạo phương tiện không yêu cầu runtime cũ.
Khi Codex phát ra một mục tạo hình ảnh gốc với `savedPath`, OpenClaw
chuyển tiếp chính xác tệp đó qua đường dẫn phương tiện phản hồi bình thường ngay cả khi lượt Codex
không có văn bản trợ lý.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook Plugin](/vi/plugins/hooks)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Xuất quỹ đạo](/vi/tools/trajectory)
