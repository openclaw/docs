---
read_when:
    - Bạn cần hợp đồng hỗ trợ thời gian chạy của bộ khung Codex
    - Bạn đang gỡ lỗi các công cụ Codex gốc, móc nối, Compaction hoặc việc tải phản hồi lên
    - Bạn đang thay đổi hành vi Plugin qua các lượt PI và harness Codex
summary: Ranh giới thời gian chạy, hook, công cụ, quyền và chẩn đoán cho bộ khung Codex
title: Môi trường chạy của bộ khung Codex
x-i18n:
    generated_at: "2026-05-11T20:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Trang này ghi lại hợp đồng thời gian chạy cho các lượt của bộ khung Codex. Để thiết lập và
định tuyến, hãy bắt đầu với [bộ khung Codex](/vi/plugins/codex-harness). Với các trường cấu hình,
xem [tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference).

## Tổng quan

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều phần hơn của
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin, công cụ, phiên và
chẩn đoán của mình quanh ranh giới đó.

OpenClaw vẫn sở hữu định tuyến kênh, tệp phiên, gửi tin nhắn hiển thị,
công cụ động OpenClaw, phê duyệt, gửi phương tiện và một bản sao transcript.
Codex sở hữu luồng gốc chuẩn, vòng lặp mô hình gốc, tiếp tục công cụ gốc
và Compaction gốc.

## Ràng buộc luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào một luồng Codex hiện có, lượt tiếp theo
sẽ gửi lại mô hình OpenAI đang được chọn, chính sách phê duyệt, sandbox và tầng dịch vụ
đến app-server. Việc chuyển từ `openai/gpt-5.5` sang
`openai/gpt-5.2` giữ nguyên ràng buộc luồng nhưng yêu cầu Codex tiếp tục bằng
mô hình mới được chọn.

## Phản hồi hiển thị và Heartbeat

Khi một lượt trò chuyện nguồn chạy qua bộ khung Codex, phản hồi hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Tác nhân vẫn có thể hoàn tất lượt Codex của nó một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối trong trò chuyện trực tiếp trên
đường gửi tự động cũ.

Các lượt Heartbeat của Codex cũng nhận `heartbeat_respond` trong danh mục công cụ OpenClaw
có thể tìm kiếm theo mặc định, để tác nhân có thể ghi lại việc lần đánh thức nên giữ
im lặng hay thông báo mà không mã hóa luồng điều khiển đó trong văn bản cuối.

Hướng dẫn chủ động riêng cho Heartbeat được gửi dưới dạng chỉ dẫn dành cho nhà phát triển
ở chế độ cộng tác Codex trên chính lượt Heartbeat. Các lượt trò chuyện thông thường khôi phục
chế độ Codex mặc định thay vì mang triết lý Heartbeat trong lời nhắc thời gian chạy
bình thường của chúng.

## Ranh giới hook

Bộ khung Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các bộ khung PI và Codex.          |
| Middleware tiện ích mở rộng app-server Codex | Plugin đóng gói của OpenClaw | Hành vi bộ điều hợp theo từng lượt quanh công cụ động OpenClaw.     |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp Codex `hooks.json` cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với công cụ gốc và cầu quyền được hỗ trợ,
OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest` và `Stop`.

Khi phê duyệt app-server Codex được bật, nghĩa là `approvalPolicy` không phải
`"never"`, cấu hình hook gốc được tiêm mặc định sẽ bỏ qua `PermissionRequest` để
trình duyệt xét app-server của Codex và cầu phê duyệt của OpenClaw xử lý các
leo thang thật sau khi duyệt xét. Người vận hành có thể thêm rõ `permission_request` vào
`nativeHookRelay.events` khi cần relay tương thích.

Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
các điều khiển cấp Codex. Chúng không được phơi bày dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, vì vậy OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
bộ điều hợp bộ khung. Với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể viết lại luồng Codex
gốc trừ khi Codex phơi bày thao tác đó thông qua app-server hoặc callback
hook gốc.

Thông báo mục app-server Codex cũng cung cấp các quan sát `after_tool_call` bất đồng bộ
cho các hoàn tất công cụ gốc chưa được relay `PostToolUse` gốc bao phủ.
Các quan sát này chỉ dành cho telemetry và tương thích Plugin; chúng không thể chặn,
trì hoãn hoặc biến đổi lệnh gọi công cụ gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo app-server Codex
và trạng thái bộ điều hợp OpenClaw, không phải lệnh hook gốc Codex.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input` và
`llm_output` của OpenClaw là quan sát cấp bộ điều hợp, không phải bản chụp từng byte
của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc Codex được
chiếu thành sự kiện tác nhân `codex_app_server.hook` để theo dõi quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong thời gian chạy Codex v1:

| Bề mặt                                        | Hỗ trợ                                                                           | Lý do                                                                                                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex       | Được hỗ trợ                                                                      | App-server Codex sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                          |
| Định tuyến và gửi kênh OpenClaw               | Được hỗ trợ                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác nằm ngoài thời gian chạy mô hình.                                                                                                           |
| Công cụ động OpenClaw                         | Được hỗ trợ                                                                      | Codex yêu cầu OpenClaw thực thi các công cụ này, vì vậy OpenClaw vẫn nằm trong đường thực thi.                                                                                                            |
| Plugin lời nhắc và ngữ cảnh                   | Được hỗ trợ                                                                      | OpenClaw xây dựng lớp phủ lời nhắc và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                                |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                                                                      | Tập hợp, nhập, bảo trì sau lượt và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                                      |
| Hook công cụ động                             | Được hỗ trợ                                                                      | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                       |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát của bộ điều hợp                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload trung thực của chế độ Codex.                                                                       |
| Cổng sửa đổi câu trả lời cuối                 | Được hỗ trợ thông qua relay hook gốc                                             | Codex `Stop` được relay đến `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình nữa trước khi hoàn tất.                                                                            |
| Chặn hoặc quan sát shell, bản vá và MCP gốc   | Được hỗ trợ thông qua relay hook gốc                                             | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên app-server Codex `0.125.0` trở lên. Chặn được hỗ trợ; viết lại đối số thì không.          |
| Chính sách quyền gốc                          | Được hỗ trợ thông qua phê duyệt app-server Codex và relay hook gốc tương thích   | Yêu cầu phê duyệt app-server Codex định tuyến qua OpenClaw sau khi Codex duyệt xét. Relay hook gốc `PermissionRequest` là tùy chọn cho các chế độ phê duyệt gốc vì Codex phát nó trước khi guardian duyệt xét. |
| Ghi lại quỹ đạo app-server                    | Được hỗ trợ                                                                      | OpenClaw ghi lại yêu cầu mà nó đã gửi đến app-server và các thông báo app-server mà nó nhận được.                                                                                                        |

Không được hỗ trợ trong thời gian chạy Codex v1:

| Bề mặt                                              | Ranh giới V1                                                                                                                                   | Đường hướng tương lai                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Biến đổi đối số công cụ gốc                         | Hook tiền công cụ gốc Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc Codex.                                               | Cần hỗ trợ hook/schema Codex để thay thế đầu vào công cụ.                                 |
| Lịch sử transcript gốc Codex có thể chỉnh sửa       | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu bản sao và có thể chiếu ngữ cảnh tương lai, nhưng không nên biến đổi nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                          |
| `tool_result_persist` cho bản ghi công cụ gốc Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                              | Có thể phản chiếu bản ghi đã biến đổi, nhưng viết lại chuẩn cần Codex hỗ trợ.             |
| Siêu dữ liệu Compaction gốc phong phú               | OpenClaw quan sát bắt đầu và hoàn tất Compaction, nhưng không nhận danh sách giữ/bỏ ổn định, delta token hoặc payload tóm tắt.                 | Cần sự kiện Compaction Codex phong phú hơn.                                               |
| Can thiệp Compaction                                | Các hook Compaction hiện tại của OpenClaw ở chế độ Codex là cấp thông báo.                                                                     | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại từng byte yêu cầu API mô hình               | OpenClaw có thể ghi lại yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                 | Cần sự kiện theo dõi yêu cầu mô hình Codex hoặc API gỡ lỗi.                               |

## Quyền gốc và gợi mở MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và chuyển tiếp sang đường guardian hoặc phê duyệt người dùng của chính nó.

Codex app-server mặc định bỏ qua hook gốc này trong các chế độ phê duyệt. Hành vi này
áp dụng khi `permission_request` được đưa vào rõ ràng trong
`nativeHookRelay.events` hoặc khi runtime tương thích cài đặt nó.

Khi operator chọn `allow-always` cho một yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ dấu vân tay chính xác của provider/session/tool input/cwd đó trong một
cửa sổ phiên có giới hạn. Quyết định được ghi nhớ được cố ý chỉ khớp chính xác:
lệnh, đối số, payload của tool hoặc cwd thay đổi sẽ tạo một phê duyệt
mới.

Các elicitation phê duyệt tool MCP của Codex được định tuyến qua luồng
phê duyệt Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn theo sau tiếp theo trong hàng đợi sẽ trả lời yêu cầu
server gốc đó thay vì bị điều hướng như ngữ cảnh bổ sung. Các yêu cầu elicitation MCP
khác sẽ bị từ chối đóng.

## Điều hướng hàng đợi

Điều hướng hàng đợi khi lượt đang chạy ánh xạ tới `turn/steer` của Codex app-server. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
trong khoảng lặng đã cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt.

Các lượt review Codex và Compaction thủ công có thể từ chối điều hướng trong cùng lượt. Trong trường hợp đó,
OpenClaw dùng hàng đợi theo sau khi chế độ đã chọn cho phép fallback.
Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải phản hồi Codex lên

Khi `/diagnostics [note]` được phê duyệt cho một phiên dùng harness Codex gốc,
OpenClaw cũng gọi `feedback/upload` của Codex app-server cho các thread Codex
liên quan. Lần tải lên yêu cầu app-server bao gồm log cho từng thread được liệt kê
và các subthread Codex đã được tạo khi có sẵn.

Lần tải lên đi qua đường dẫn phản hồi thông thường của Codex tới server OpenAI. Nếu phản hồi Codex
bị tắt trong app-server đó, lệnh sẽ trả về lỗi của app-server.
Phản hồi diagnostics đã hoàn tất liệt kê các kênh, id phiên OpenClaw,
id thread Codex và các lệnh cục bộ `codex resume <thread-id>` cho những thread
đã được gửi.

Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các id Codex đó và
không gửi phản hồi Codex. Lần tải lên không thay thế bản xuất diagnostics Gateway
cục bộ. Xem [Xuất diagnostics](/vi/gateway/diagnostics) để biết về
phê duyệt, quyền riêng tư, bundle cục bộ và hành vi nhóm chat.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho thread hiện đang gắn mà không cần toàn bộ bundle diagnostics Gateway.

## Compaction và bản sao transcript

Khi model đã chọn dùng harness Codex, Compaction thread gốc được
ủy quyền cho Codex app-server. OpenClaw giữ một bản sao transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi model hoặc harness trong tương lai.

Bản sao này bao gồm prompt của người dùng, văn bản assistant cuối cùng, và các bản ghi
lập luận hoặc kế hoạch Codex nhẹ khi app-server phát ra chúng. Hiện tại, OpenClaw chỉ
ghi nhận các tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa hiển thị
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về những mục Codex
đã giữ lại sau Compaction.

Vì Codex sở hữu thread gốc chuẩn, `tool_result_persist` hiện không
ghi lại các bản ghi kết quả tool gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi một kết quả tool transcript phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn provider phương tiện. Hình ảnh,
video, nhạc, PDF, TTS, và hiểu phương tiện dùng các thiết lập provider/model
tương ứng như `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, và `messages.tts`.

Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và đầu ra messaging-tool tiếp tục
đi qua đường dẫn phân phối OpenClaw thông thường. Tạo phương tiện không yêu cầu PI.
Khi Codex phát ra một mục tạo hình ảnh gốc với `savedPath`, OpenClaw
chuyển tiếp chính xác tệp đó qua đường dẫn reply-media thông thường ngay cả khi lượt Codex
không có văn bản assistant.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook Plugin](/vi/plugins/hooks)
- [Plugin harness agent](/vi/plugins/sdk-agent-harness)
- [Xuất diagnostics](/vi/gateway/diagnostics)
- [Xuất trajectory](/vi/tools/trajectory)
