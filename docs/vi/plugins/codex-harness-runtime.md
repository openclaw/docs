---
read_when:
    - Bạn cần hợp đồng hỗ trợ thời gian chạy của bộ khung Codex
    - Bạn đang gỡ lỗi các công cụ Codex gốc, các móc, Compaction hoặc việc tải phản hồi lên
    - Bạn đang thay đổi hành vi Plugin qua các lượt của Pi và harness Codex
summary: Ranh giới thời gian chạy, hook, công cụ, quyền và chẩn đoán cho bộ khung Codex
title: Môi trường thực thi bộ khung Codex
x-i18n:
    generated_at: "2026-05-10T19:42:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Trang này ghi lại hợp đồng runtime cho các lượt của Codex harness. Để thiết lập và
định tuyến, hãy bắt đầu với [Codex harness](/vi/plugins/codex-harness). Để xem các trường cấu hình,
hãy xem [tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Tổng quan

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình native, và OpenClaw điều chỉnh các bề mặt plugin, công cụ, phiên và
chẩn đoán của mình quanh ranh giới đó.

OpenClaw vẫn sở hữu định tuyến kênh, tệp phiên, phân phối tin nhắn hiển thị,
công cụ động của OpenClaw, phê duyệt, phân phối media và bản sao transcript.
Codex sở hữu luồng native chuẩn tắc, vòng lặp mô hình native, phần tiếp tục công cụ
native và Compaction native.

## Liên kết luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào một luồng Codex hiện có, lượt tiếp theo
sẽ gửi lại mô hình OpenAI hiện được chọn, chính sách phê duyệt, sandbox và tầng dịch vụ
đến app-server. Việc chuyển từ `openai/gpt-5.5` sang
`openai/gpt-5.2` giữ nguyên liên kết luồng nhưng yêu cầu Codex tiếp tục bằng
mô hình mới được chọn.

## Phản hồi hiển thị và Heartbeat

Khi một lượt chat nguồn chạy qua Codex harness, phản hồi hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Agent vẫn có thể kết thúc lượt Codex của nó một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối của chat trực tiếp trên
đường phân phối tự động cũ.

Các lượt Heartbeat của Codex cũng mặc định nhận `heartbeat_respond` trong danh mục công cụ OpenClaw
có thể tìm kiếm, để agent có thể ghi lại liệu lần đánh thức có nên giữ im lặng
hay thông báo mà không mã hóa luồng điều khiển đó trong văn bản cuối.

Hướng dẫn chủ động dành riêng cho Heartbeat được gửi dưới dạng chỉ dẫn developer
ở chế độ cộng tác của Codex ngay trên lượt Heartbeat đó. Các lượt chat thông thường khôi phục
chế độ Codex Default thay vì mang triết lý Heartbeat trong prompt runtime
bình thường của chúng.

## Ranh giới hook

Codex harness có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                             |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------- |
| Hook plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/plugin trên các harness PI và Codex.            |
| Middleware extension app-server Codex | Plugin đóng gói OpenClaw | Hành vi adapter theo từng lượt quanh các công cụ động của OpenClaw. |
| Hook native Codex                    | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ native từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` của dự án hoặc toàn cục Codex để định tuyến
hành vi plugin OpenClaw. Với cầu nối công cụ native và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest` và `Stop`.

Khi phê duyệt app-server của Codex được bật, nghĩa là `approvalPolicy` không phải
`"never"`, cấu hình hook native được chèn mặc định sẽ bỏ qua `PermissionRequest` để
trình duyệt xét app-server của Codex và cầu nối phê duyệt của OpenClaw xử lý các
yêu cầu nâng quyền thực sự sau khi duyệt xét. Operator có thể thêm rõ `permission_request` vào
`nativeHookRelay.events` khi họ cần relay tương thích.

Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
các điều khiển cấp Codex. Chúng không được phơi bày dưới dạng hook plugin OpenClaw trong hợp đồng
v1.

Đối với các công cụ động của OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi plugin và middleware mà nó sở hữu trong
adapter harness. Đối với các công cụ native của Codex, Codex sở hữu bản ghi công cụ chuẩn tắc.
OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể viết lại luồng Codex native
trừ khi Codex phơi bày thao tác đó thông qua app-server hoặc callback hook native.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo app-server của Codex
và trạng thái adapter OpenClaw, không phải từ lệnh hook native của Codex.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input` và
`llm_output` của OpenClaw là các quan sát cấp adapter, không phải bản chụp từng byte
của request nội bộ hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` native của Codex được
chiếu thành sự kiện agent `codex_app_server.hook` để theo dõi trajectory và gỡ lỗi.
Chúng không gọi hook plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong Codex runtime v1:

| Bề mặt                                        | Hỗ trợ                                                                           | Lý do                                                                                                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex       | Được hỗ trợ                                                                      | App-server Codex sở hữu lượt OpenAI, tiếp tục luồng native và tiếp tục công cụ native.                                                                                                                     |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                               |
| Công cụ động OpenClaw                         | Được hỗ trợ                                                                      | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường thực thi.                                                                                                                |
| Plugin prompt và ngữ cảnh                     | Được hỗ trợ                                                                      | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                                |
| Vòng đời context engine                       | Được hỗ trợ                                                                      | Việc lắp ráp, nạp, bảo trì sau lượt và điều phối Compaction của context engine chạy cho các lượt Codex.                                                                                                    |
| Hook công cụ động                             | Được hỗ trợ                                                                      | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                        |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát adapter                                           | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với các payload trung thực ở chế độ Codex.                                                                      |
| Cổng sửa đổi câu trả lời cuối                 | Được hỗ trợ thông qua relay hook native                                          | `Stop` của Codex được relay đến `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình trước khi hoàn tất.                                                                              |
| Chặn hoặc quan sát shell, patch và MCP native | Được hỗ trợ thông qua relay hook native                                          | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ native đã cam kết, bao gồm payload MCP trên app-server Codex `0.125.0` hoặc mới hơn. Có hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền native                       | Được hỗ trợ thông qua phê duyệt app-server Codex và relay hook native tương thích | Yêu cầu phê duyệt app-server Codex được định tuyến qua OpenClaw sau khi Codex duyệt xét. Relay hook native `PermissionRequest` là tùy chọn tham gia cho các chế độ phê duyệt native vì Codex phát nó trước khi guardian duyệt xét. |
| Ghi lại trajectory app-server                 | Được hỗ trợ                                                                      | OpenClaw ghi lại request đã gửi đến app-server và các thông báo app-server mà nó nhận được.                                                                                                                |

Không được hỗ trợ trong Codex runtime v1:

| Bề mặt                                              | Ranh giới V1                                                                                                                                    | Hướng tương lai                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Thay đổi đối số công cụ native                      | Hook pre-tool native của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ native của Codex.                                      | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                              |
| Lịch sử transcript native Codex có thể chỉnh sửa    | Codex sở hữu lịch sử luồng native chuẩn tắc. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên thay đổi các phần nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng native.                         |
| `tool_result_persist` cho bản ghi công cụ native Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ native Codex.                                            | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn tắc cần hỗ trợ Codex. |
| Metadata Compaction native phong phú                | OpenClaw quan sát thời điểm bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/lược bỏ ổn định, token delta hoặc payload tóm tắt. | Cần sự kiện Compaction Codex phong phú hơn.                                                  |
| Can thiệp Compaction                                | Các hook Compaction hiện tại của OpenClaw ở chế độ Codex là cấp thông báo.                                                                      | Thêm hook trước/sau Compaction của Codex nếu plugin cần phủ quyết hoặc viết lại Compaction native. |
| Ghi lại request API mô hình từng byte               | OpenClaw có thể ghi lại request và thông báo app-server, nhưng lõi Codex xây dựng request API OpenAI cuối cùng ở bên trong.                    | Cần sự kiện tracing request mô hình Codex hoặc API gỡ lỗi.                                  |

## Quyền native và elicitations MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về các quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex coi đó là không có
quyết định hook và chuyển tiếp sang đường guardian hoặc phê duyệt người dùng của chính nó.

Các chế độ phê duyệt app-server Codex mặc định bỏ qua hook native này. Hành vi này
áp dụng khi `permission_request` được đưa vào rõ ràng trong
`nativeHookRelay.events` hoặc một runtime tương thích cài đặt nó.

Khi người vận hành chọn `allow-always` cho một yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ dấu vân tay provider/session/tool input/cwd chính xác đó trong
một khoảng thời gian phiên có giới hạn. Quyết định được ghi nhớ cố ý chỉ khớp
chính xác: lệnh, đối số, payload công cụ hoặc cwd thay đổi sẽ tạo một lần phê
duyệt mới.

Các yêu cầu phê duyệt công cụ Codex MCP được định tuyến qua luồng phê duyệt
Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các prompt `request_user_input` của Codex được gửi trở lại
cuộc trò chuyện gốc, và tin nhắn tiếp theo đang xếp hàng sẽ trả lời yêu cầu máy
chủ gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu khơi gợi
MCP khác sẽ thất bại đóng.

## Điều hướng hàng đợi

Điều hướng hàng đợi khi lượt chạy đang hoạt động ánh xạ vào `turn/steer` của
Codex app-server. Với `messages.queue.mode: "steer"` mặc định, OpenClaw gom các
tin nhắn trò chuyện đang xếp hàng trong khoảng lặng đã cấu hình và gửi chúng
thành một yêu cầu `turn/steer` theo thứ tự đến. Chế độ `queue` cũ gửi các yêu
cầu `turn/steer` riêng biệt.

Các lượt đánh giá Codex và Compaction thủ công có thể từ chối điều hướng trong
cùng lượt. Trong trường hợp đó, OpenClaw dùng hàng đợi tiếp nối khi chế độ đã
chọn cho phép dự phòng. Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải lên phản hồi Codex

Khi `/diagnostics [note]` được phê duyệt cho một phiên dùng bộ khai thác Codex
gốc, OpenClaw cũng gọi `feedback/upload` của Codex app-server cho các luồng
Codex liên quan. Việc tải lên yêu cầu app-server đưa vào nhật ký cho từng luồng
được liệt kê và các luồng con Codex đã sinh ra khi có sẵn.

Việc tải lên đi qua đường phản hồi thông thường của Codex tới máy chủ OpenAI.
Nếu phản hồi Codex bị tắt trong app-server đó, lệnh sẽ trả về lỗi app-server.
Phản hồi chẩn đoán hoàn tất liệt kê các kênh, id phiên OpenClaw, id luồng
Codex và các lệnh cục bộ `codex resume <thread-id>` cho những luồng đã được gửi.

Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các id Codex đó và
không gửi phản hồi Codex. Việc tải lên không thay thế bản xuất chẩn đoán
Gateway cục bộ. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết hành vi về
phê duyệt, quyền riêng tư, gói cục bộ và trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải lên phản hồi
Codex cho luồng hiện đang gắn kèm mà không có gói chẩn đoán Gateway đầy đủ.

## Compaction và bản sao biên bản

Khi mô hình đã chọn dùng bộ khai thác Codex, việc Compaction luồng gốc được
ủy quyền cho Codex app-server. OpenClaw giữ một bản sao biên bản cho lịch sử
kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc bộ khai thác
trong tương lai.

Bản sao bao gồm prompt của người dùng, văn bản cuối cùng của trợ lý, và các bản
ghi lập luận hoặc kế hoạch nhẹ của Codex khi app-server phát ra chúng. Hiện nay,
OpenClaw chỉ ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa hiển
thị bản tóm tắt Compaction đọc được cho con người hoặc danh sách có thể kiểm
toán về những mục Codex đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn tắc, `tool_result_persist` hiện không viết lại
các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi OpenClaw đang ghi
một kết quả công cụ vào biên bản phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn nhà cung cấp
phương tiện. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện dùng các cài
đặt nhà cung cấp/mô hình khớp như `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, và `messages.tts`.

Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin tiếp
tục đi qua đường phân phối OpenClaw thông thường. Tạo phương tiện không yêu cầu
PI. Khi Codex phát ra một mục tạo hình ảnh gốc có `savedPath`, OpenClaw chuyển
tiếp đúng tệp đó qua đường phương tiện phản hồi thông thường ngay cả khi lượt
Codex không có văn bản trợ lý.

## Liên quan

- [Bộ khai thác Codex](/vi/plugins/codex-harness)
- [Tham chiếu bộ khai thác Codex](/vi/plugins/codex-harness-reference)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook Plugin](/vi/plugins/hooks)
- [Plugin bộ khai thác tác tử](/vi/plugins/sdk-agent-harness)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Xuất quỹ đạo](/vi/tools/trajectory)
