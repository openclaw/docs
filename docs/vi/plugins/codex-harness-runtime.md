---
read_when:
    - Bạn cần hợp đồng hỗ trợ runtime của harness Codex
    - Bạn đang gỡ lỗi các công cụ Codex gốc, hook, Compaction hoặc quá trình tải phản hồi lên
    - Bạn đang thay đổi hành vi Plugin trên các lượt của OpenClaw và bộ harness Codex
summary: Ranh giới thời gian chạy, hook, công cụ, quyền và chẩn đoán cho harness Codex
title: Môi trường chạy của bộ harness Codex
x-i18n:
    generated_at: "2026-06-27T17:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Trang này ghi lại hợp đồng runtime cho các lượt harness Codex. Để thiết lập và
định tuyến, hãy bắt đầu với [harness Codex](/vi/plugins/codex-harness). Đối với các trường cấu hình,
xem [tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Tổng quan

Chế độ Codex không phải là OpenClaw với một lệnh gọi mô hình khác bên dưới. Codex sở hữu nhiều phần hơn của
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin, công cụ, phiên và
chẩn đoán của nó quanh ranh giới đó.

OpenClaw vẫn sở hữu định tuyến kênh, tệp phiên, phân phối thông báo hiển thị,
công cụ động của OpenClaw, phê duyệt, phân phối phương tiện và bản sao transcript.
Codex sở hữu luồng gốc chính tắc, vòng lặp mô hình gốc, tiếp tục công cụ gốc
và Compaction gốc.

Định tuyến prompt tuân theo runtime đã chọn, không chỉ chuỗi nhà cung cấp. Một
lượt Codex gốc nhận chỉ dẫn developer của app-server Codex, trong khi một
tuyến tương thích OpenClaw rõ ràng giữ prompt hệ thống OpenClaw bình thường ngay cả
khi nó dùng xác thực hoặc transport OpenAI kiểu Codex.

Codex gốc giữ các chỉ dẫn nền/mô hình do Codex sở hữu và hành vi tài liệu dự án
theo cấu hình luồng Codex đang hoạt động. OpenClaw bắt đầu và tiếp tục các
luồng Codex gốc với personality tích hợp của Codex bị tắt để các tệp
personality workspace và danh tính agent OpenClaw vẫn có thẩm quyền. Các lượt
OpenClaw nhẹ vẫn giữ cơ chế triệt tiêu tài liệu dự án hiện có. Chỉ dẫn
developer của OpenClaw bao phủ các mối quan tâm runtime của OpenClaw như phân phối
kênh nguồn, công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh adapter và các
tệp hồ sơ workspace của agent đang hoạt động. Catalog Skills của OpenClaw và các
con trỏ `MEMORY.md` được định tuyến qua công cụ được chiếu thành chỉ dẫn
developer cộng tác theo phạm vi lượt cho Codex gốc. Nội dung `BOOTSTRAP.md`
đang hoạt động và phần chèn dự phòng `MEMORY.md` đầy đủ vẫn dùng ngữ cảnh tham chiếu đầu vào của lượt.

## Ràng buộc luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào một luồng Codex hiện có, lượt tiếp theo
gửi lại mô hình OpenAI, chính sách phê duyệt, sandbox và tầng dịch vụ hiện được chọn
đến app-server. Chuyển từ `openai/gpt-5.5` sang
`openai/gpt-5.2` giữ ràng buộc luồng nhưng yêu cầu Codex tiếp tục với
mô hình mới được chọn.

## Phản hồi hiển thị và Heartbeat

Khi một lượt trò chuyện trực tiếp/nguồn chạy qua harness Codex, phản hồi hiển thị
mặc định là tự động phân phối trợ lý cuối cùng cho các bề mặt WebChat nội bộ.
Điều này giữ Codex đồng bộ với hợp đồng prompt của harness Pi: agent phản hồi
bình thường, và OpenClaw đăng văn bản cuối cùng vào cuộc trò chuyện nguồn. Đặt
`messages.visibleReplies: "message_tool"` khi một cuộc trò chuyện trực tiếp/nguồn cần
cố ý giữ văn bản trợ lý cuối cùng ở chế độ riêng tư trừ khi agent gọi
`message(action="send")`.

Các lượt Heartbeat của Codex cũng mặc định nhận `heartbeat_respond` trong catalog
công cụ OpenClaw có thể tìm kiếm, để agent có thể ghi lại liệu lần đánh thức nên giữ
im lặng hay thông báo mà không mã hóa luồng điều khiển đó trong văn bản cuối cùng.

Hướng dẫn chủ động dành riêng cho Heartbeat được gửi dưới dạng chỉ dẫn developer
chế độ cộng tác Codex ngay trên lượt Heartbeat đó. Các lượt trò chuyện thông thường khôi phục
chế độ Codex Default thay vì mang triết lý Heartbeat trong prompt runtime
bình thường của chúng. Khi tồn tại một `HEARTBEAT.md` không rỗng, các chỉ dẫn
chế độ cộng tác Heartbeat trỏ Codex đến tệp đó thay vì chèn trực tiếp nội dung của nó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu                | Mục đích                                                            |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                  | Tương thích sản phẩm/Plugin trên các harness OpenClaw và Codex.     |
| Middleware tiện ích mở rộng app-server Codex | Plugin đóng gói của OpenClaw | Hành vi adapter theo từng lượt quanh công cụ động của OpenClaw.     |
| Hook gốc Codex                       | Codex                     | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` cấp dự án hoặc toàn cục của Codex để định tuyến
hành vi Plugin OpenClaw. Đối với cầu công cụ gốc và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`.

Khi phê duyệt app-server Codex được bật, nghĩa là `approvalPolicy` không phải
`"never"`, cấu hình hook gốc mặc định được chèn sẽ bỏ qua `PermissionRequest` để
reviewer app-server của Codex và cầu phê duyệt của OpenClaw xử lý các
yêu cầu nâng quyền thực sự sau khi review. Người vận hành có thể thêm rõ ràng `permission_request` vào
`nativeHookRelay.events` khi cần relay tương thích.

Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
các điều khiển cấp Codex. Chúng không được phơi bày dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Đối với công cụ động của OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, vì vậy OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
adapter harness. Đối với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chính tắc.
OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể viết lại luồng Codex
gốc trừ khi Codex phơi bày thao tác đó qua app-server hoặc callback hook gốc.

Sự kiện `PreToolUse` ở chế độ báo cáo của app-server Codex hoãn yêu cầu phê duyệt Plugin
đến phê duyệt app-server tương ứng. Nếu một hook `before_tool_call` của OpenClaw
trả về `requireApproval` trong khi payload gốc đặt chế độ phê duyệt báo cáo
(`openclaw_approval_mode` là `"report"`), relay hook gốc ghi lại
yêu cầu phê duyệt Plugin và không trả về quyết định gốc nào. Khi Codex gửi
yêu cầu phê duyệt app-server cho cùng lần dùng công cụ đó, OpenClaw mở prompt
phê duyệt Plugin và ánh xạ quyết định trở lại Codex. Sự kiện `PermissionRequest`
của Codex là một đường phê duyệt riêng và vẫn có thể định tuyến qua phê duyệt OpenClaw
khi runtime được cấu hình cho cầu đó.

Thông báo mục của app-server Codex cũng cung cấp quan sát `after_tool_call` bất đồng bộ
cho các lần hoàn tất công cụ gốc chưa được relay `PostToolUse` gốc bao phủ.
Các quan sát này chỉ dành cho telemetry và tương thích Plugin; chúng không thể chặn,
trì hoãn hoặc thay đổi lệnh gọi công cụ gốc.

Các phép chiếu vòng đời Compaction và LLM đến từ thông báo app-server Codex
và trạng thái adapter OpenClaw, không phải lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là quan sát cấp adapter, không phải bản chụp từng byte
của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc của Codex được
chiếu thành sự kiện agent `codex_app_server.hook` để ghi trajectory và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                                                          | Lý do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex               | Được hỗ trợ                                                                        | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                                                                                                                                                                                                                                                                                          |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác nằm ngoài runtime mô hình.                                                                                                                                                                                                                                                                                                                                                                                    |
| Công cụ động OpenClaw                        | Được hỗ trợ                                                                        | Codex yêu cầu OpenClaw thực thi các công cụ này, vì vậy OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugin prompt và ngữ cảnh                    | Được hỗ trợ                                                                        | OpenClaw chiếu prompt/ngữ cảnh riêng của OpenClaw vào lượt Codex trong khi giữ các prompt cơ sở, mô hình và tài liệu dự án đã cấu hình do Codex sở hữu trong luồng Codex gốc. OpenClaw tắt personality tích hợp của Codex cho các luồng gốc để các tệp personality trong workspace của agent vẫn có thẩm quyền. Hướng dẫn developer gốc của Codex chỉ chấp nhận hướng dẫn lệnh được giới hạn phạm vi rõ ràng cho `codex_app_server`; các gợi ý lệnh toàn cục legacy vẫn được giữ cho các bề mặt prompt không phải Codex. |
| Vòng đời engine ngữ cảnh                      | Được hỗ trợ                                                                        | Việc assemble, ingest và bảo trì sau lượt chạy xung quanh các lượt Codex. Các engine ngữ cảnh không thay thế compaction gốc của Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hook công cụ động                            | Được hỗ trợ                                                                        | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy xung quanh các công cụ động do OpenClaw sở hữu.                                                                                                                                                                                                                                                                                                                                                                          |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của adapter                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload chế độ Codex trung thực.                                                                                                                                                                                                                                                                                                                                                           |
| Cổng sửa đổi câu trả lời cuối cùng                    | Được hỗ trợ thông qua relay hook gốc                                              | Codex `Stop` được relay tới `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                                                                                                                                                                                                                                                                                                                |
| Chặn hoặc quan sát shell, patch và MCP gốc | Được hỗ trợ thông qua relay hook gốc                                              | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã commit, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số.                                                                                                                                                                                                                                                                               |
| Chính sách quyền gốc                      | Được hỗ trợ thông qua phê duyệt của máy chủ ứng dụng Codex và relay hook gốc tương thích | Các yêu cầu phê duyệt của máy chủ ứng dụng Codex được định tuyến qua OpenClaw sau phần review của Codex. Relay hook gốc `PermissionRequest` là opt-in cho các chế độ phê duyệt gốc vì Codex phát ra nó trước phần review của guardian.                                                                                                                                                                                                                                                                          |
| Ghi lại quỹ đạo máy chủ ứng dụng                 | Được hỗ trợ                                                                        | OpenClaw ghi lại yêu cầu đã gửi tới máy chủ ứng dụng và các thông báo máy chủ ứng dụng nhận được.                                                                                                                                                                                                                                                                                                                                                                                    |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Đường hướng tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần Codex hỗ trợ hook/schema cho đầu vào công cụ thay thế.                            |
| Lịch sử transcript gốc của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các phần nội bộ không được hỗ trợ. | Thêm API máy chủ ứng dụng Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu compaction gốc phong phú                     | OpenClaw có thể yêu cầu compaction gốc, nhưng không nhận được danh sách giữ/bỏ ổn định, delta token, tóm tắt hoàn tất hoặc payload tóm tắt.   | Cần sự kiện compaction Codex phong phú hơn.                                                     |
| Can thiệp compaction                             | OpenClaw không cho phép Plugin hoặc engine ngữ cảnh phủ quyết, viết lại hoặc thay thế compaction Codex gốc.                                             | Thêm hook trước/sau compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại compaction gốc. |
| Ghi lại yêu cầu API mô hình chính xác từng byte             | OpenClaw có thể ghi lại các yêu cầu và thông báo máy chủ ứng dụng, nhưng lõi Codex xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần sự kiện theo dõi yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Quyền gốc và elicitation MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex coi nó là không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt người dùng của chính nó.

Các chế độ phê duyệt của máy chủ ứng dụng Codex mặc định bỏ qua hook gốc này. Hành vi này
áp dụng khi `permission_request` được đưa vào rõ ràng trong
`nativeHookRelay.events` hoặc một runtime tương thích cài đặt nó.

Khi operator chọn `allow-always` cho yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ đúng fingerprint provider/session/đầu vào công cụ/cwd đó trong một
cửa sổ phiên có giới hạn. Quyết định được ghi nhớ cố ý chỉ khớp chính xác:
lệnh, đối số, payload công cụ hoặc cwd thay đổi sẽ tạo một phê duyệt
mới.

Các elicitation phê duyệt công cụ Codex MCP được định tuyến qua luồng phê duyệt
Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các prompt Codex `request_user_input` được gửi lại về
cuộc chat khởi nguồn, và tin nhắn follow-up tiếp theo trong hàng đợi trả lời yêu cầu
máy chủ gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu elicitation MCP
khác fail closed.

Đối với luồng phê duyệt Plugin chung mang các prompt này, xem
[Yêu cầu quyền Plugin](/vi/plugins/plugin-permission-requests).

## Điều hướng hàng đợi

Điều hướng hàng đợi đang chạy ánh xạ vào `turn/steer` của máy chủ ứng dụng Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom nhóm các tin nhắn chat
chế độ steer trong cửa sổ yên lặng đã cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer`
theo thứ tự đến.

Các lượt đánh giá Codex và Compaction thủ công có thể từ chối điều hướng trong cùng lượt. Trong trường hợp đó, OpenClaw đợi lượt chạy đang hoạt động hoàn tất trước khi bắt đầu prompt. Dùng `/queue followup` hoặc `/queue collect` khi mặc định tin nhắn nên được đưa vào hàng đợi thay vì điều hướng. Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải phản hồi Codex lên

Khi `/diagnostics [note]` được phê duyệt cho một phiên dùng harness Codex gốc, OpenClaw cũng gọi Codex app-server `feedback/upload` cho các luồng Codex liên quan. Bản tải lên yêu cầu app-server bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex được tạo ra khi có.

Bản tải lên đi qua đường dẫn phản hồi Codex thông thường tới máy chủ OpenAI. Nếu phản hồi Codex bị tắt trong app-server đó, lệnh sẽ trả về lỗi app-server. Phản hồi chẩn đoán hoàn tất liệt kê các kênh, mã phiên OpenClaw, mã luồng Codex và các lệnh cục bộ `codex resume <thread-id>` cho những luồng đã được gửi.

Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các mã Codex đó và không gửi phản hồi Codex. Bản tải lên không thay thế bản xuất chẩn đoán Gateway cục bộ. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết hành vi phê duyệt, quyền riêng tư, gói cục bộ và trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên cho luồng hiện đang được gắn mà không có toàn bộ gói chẩn đoán Gateway.

## Compaction và bản sao bản ghi

Khi mô hình được chọn dùng harness Codex, Compaction luồng gốc thuộc về Codex app-server. OpenClaw không chạy Compaction kiểm tra trước cho các lượt Codex, không thay thế Compaction Codex bằng Compaction của context-engine, và không quay về tóm tắt của OpenClaw hoặc OpenAI công khai khi không thể bắt đầu Compaction Codex gốc. OpenClaw giữ một bản sao bản ghi cho lịch sử kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness trong tương lai.

Các yêu cầu Compaction rõ ràng, chẳng hạn như `/compact` hoặc thao tác compact thủ công do Plugin yêu cầu, bắt đầu Compaction Codex gốc bằng `thread/compact/start`. OpenClaw trả về sau khi bắt đầu thao tác gốc đó. Nó không đợi hoàn tất, không áp đặt thời gian chờ OpenClaw riêng, không khởi động lại Codex app-server dùng chung, hoặc ghi nhận thao tác đó là một Compaction đã hoàn tất bởi OpenClaw.

Khi một context engine yêu cầu projection khởi tạo luồng Codex, OpenClaw chiếu tên và mã tool-call, hình dạng đầu vào, và nội dung kết quả công cụ đã được biên tập vào luồng Codex mới. Nó không sao chép giá trị đối số tool-call thô vào projection đó.

Bản sao bao gồm prompt của người dùng, văn bản trợ lý cuối cùng, và các bản ghi suy luận hoặc kế hoạch Codex nhẹ khi app-server phát ra chúng. Hiện tại, OpenClaw chỉ ghi nhận các tín hiệu bắt đầu Compaction gốc rõ ràng khi nó yêu cầu Compaction. Nó không cung cấp bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm tra về những mục mà Codex đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chính thức, `tool_result_persist` hiện không ghi lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi OpenClaw đang ghi một kết quả công cụ trong bản ghi phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn nhà cung cấp phương tiện. Hình ảnh, video, nhạc, PDF, TTS, và hiểu phương tiện dùng các thiết lập nhà cung cấp/mô hình tương ứng như `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, và `messages.tts`.

Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và đầu ra công cụ nhắn tin tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường. Tạo phương tiện không yêu cầu runtime cũ. Khi Codex phát ra một mục tạo ảnh gốc có `savedPath`, OpenClaw chuyển tiếp đúng tệp đó qua đường dẫn phương tiện phản hồi thông thường ngay cả khi lượt Codex không có văn bản trợ lý.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook Plugin](/vi/plugins/hooks)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Xuất quỹ đạo](/vi/tools/trajectory)
