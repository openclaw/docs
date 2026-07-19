---
read_when:
    - Bạn cần hợp đồng hỗ trợ runtime của Codex harness
    - Bạn đang gỡ lỗi các công cụ Codex gốc, hook, compaction hoặc quá trình tải phản hồi lên
    - Bạn đang thay đổi hành vi của plugin xuyên suốt các lượt chạy harness của OpenClaw và Codex
summary: Ranh giới runtime, hook, công cụ, quyền và chẩn đoán cho Codex harness
title: Runtime của bộ khung Codex
x-i18n:
    generated_at: "2026-07-19T06:08:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 516d70dee056657a06206c7ca4215f3776ccd2b027a136b5cc8fea3b11c1cd0b
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Hợp đồng runtime cho các lượt chạy Codex harness. Để biết cách thiết lập và định tuyến, xem
[Codex harness](/vi/plugins/codex-harness). Để biết các trường cấu hình, xem
[Tài liệu tham khảo Codex harness](/vi/plugins/codex-harness-reference).

## Tổng quan

Codex sở hữu vòng lặp mô hình gốc, việc tiếp tục luồng gốc, tiếp tục công cụ gốc
và Compaction gốc. OpenClaw sở hữu định tuyến kênh, tệp phiên,
phân phối thông báo hiển thị, các công cụ động của OpenClaw, phê duyệt, phân phối
phương tiện và bản sao transcript bao quanh ranh giới đó.

Việc định tuyến prompt tuân theo runtime đã chọn, không chỉ chuỗi nhà cung cấp. Một
lượt Codex gốc nhận các chỉ dẫn dành cho nhà phát triển của app-server Codex; một
tuyến tương thích OpenClaw tường minh vẫn giữ prompt hệ thống OpenClaw thông thường ngay cả khi
tuyến đó sử dụng phương thức xác thực hoặc truyền tải OpenAI theo kiểu Codex.

OpenClaw khởi tạo và tiếp tục các luồng Codex gốc với tính cách tích hợp sẵn của Codex
bị vô hiệu hóa (`personality: "none"`) để các tệp tính cách trong không gian làm việc
và danh tính tác nhân OpenClaw vẫn là nguồn có thẩm quyền. Ngoài ra, Codex gốc vẫn giữ
các chỉ dẫn cơ sở/mô hình do Codex sở hữu và việc tải tài liệu dự án. Các lượt chạy
OpenClaw nhẹ (ví dụ: cron) vẫn không tải tài liệu dự án.

Các chỉ dẫn dành cho nhà phát triển của OpenClaw bao quát những vấn đề của runtime OpenClaw: phân phối
qua kênh nguồn, các công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh bộ điều hợp và các
tệp hồ sơ không gian làm việc của tác nhân đang hoạt động. Danh mục skill và các con trỏ
`MEMORY.md` được định tuyến qua công cụ được chiếu dưới dạng chỉ dẫn cộng tác dành cho nhà phát triển
trong phạm vi lượt. Khi các công cụ bộ nhớ không khả dụng, nội dung `BOOTSTRAP.md` đang hoạt động
và toàn bộ `MEMORY.md` sẽ chuyển sang ngữ cảnh đầu vào thuần túy của lượt.

Hầu hết các công cụ động của OpenClaw sử dụng không gian tên `openclaw` có thể tìm kiếm. Các công cụ
được đánh dấu `catalogMode: "direct-only"` sử dụng `openclaw_direct`, được Codex giữ
hiển thị trực tiếp cho mô hình dưới dạng `DirectModelOnly` thay vì đưa nó vào quá trình
thực thi Code Mode lồng nhau.

## Liên kết luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào luồng Codex hiện có, lượt
tiếp theo sẽ gửi lại mô hình hiện được chọn, chính sách phê duyệt, sandbox,
trình review phê duyệt và bậc dịch vụ cho app-server. Việc chuyển từ
`openai/gpt-5.5` sang `openai/gpt-5.2` vẫn giữ liên kết luồng nhưng yêu cầu Codex
tiếp tục bằng mô hình mới được chọn.

Liên kết được giám sát là ngoại lệ. Bộ chọn mô hình OpenClaw vẫn bị khóa,
và các lần tiếp tục sẽ bỏ qua ghi đè mô hình và nhà cung cấp để Codex khôi phục mô hình
và nhà cung cấp đã được lưu của luồng chuẩn. Một điều khiển Codex gốc riêng biệt có thể
thay đổi cặp đã lưu đó, và snapshot ban đầu có thể tạo ra cảnh báo thông thường của Codex
về sự khác biệt mô hình; mô hình OpenClaw bên ngoài và chuỗi dự phòng không bao giờ
thay thế một trong hai giá trị đó.

## Giám sát và tiếp tục an toàn

Giám sát Codex là một khả năng tùy chọn của cùng Plugin `codex`. Nó phát hiện
các luồng gốc qua một kết nối riêng biệt và chỉ chiếu những phiên chưa lưu trữ
vào danh mục Gateway. Nếu không có các thiết lập kết nối `appServer` tường minh,
kết nối đó sử dụng stdio thư mục chính người dùng được quản lý, trong khi harness thông thường
vẫn thuộc phạm vi tác nhân. Việc liệt kê và đọc siêu dữ liệu là thụ động: chúng không
tiếp tục luồng, đăng ký OpenClaw nhận các sự kiện trực tiếp của luồng hoặc trả lời các
yêu cầu phê duyệt của luồng.

Đối với một phiên đã lưu hoặc đang nhàn rỗi trên máy tính Gateway, **Tiếp tục dưới dạng nhánh**
tạo một Chat thông thường bị khóa mô hình và sao chép lịch sử giới hạn của người dùng và trợ lý
qua lượt cuối cùng đã được lưu ở trạng thái kết thúc của nguồn. Lượt Chat thông thường đầu tiên
cài đặt các trình xử lý phê duyệt thực và sử dụng một nhánh rẽ gốc tạm thời
để ghim snapshot mà không ghi đè mô hình hoặc nhà cung cấp. Codex App Server sử dụng
cấu hình gốc hiện tại và trả về cặp đã chọn; nó phát cảnh báo thông thường
nếu mô hình đó khác với mô hình được ghi nhận gần nhất của nguồn.
Trên cùng kết nối giám sát, OpenClaw khởi tạo luồng Codex harness nguồn
`appServer` chuẩn theo cwd và chính sách runtime của luồng đó với
chính xác mô hình và nhà cung cấp được trả về cho lần khởi tạo ban đầu đó, chèn
lịch sử hiển thị có giới hạn và lưu trữ nhánh rẽ tạm thời. Nguồn không bao giờ
được tiếp tục. Luồng chuẩn có toàn bộ bề mặt công cụ OpenClaw harness;
lập luận, lệnh gọi công cụ và kết quả công cụ từ nguồn không được sao chép vào luồng.
Phạm vi kết nối riêng tư vẫn tồn tại qua các trạng thái liên kết đang chờ xử lý và đã cam kết, vì vậy
mọi lượt sau đó vẫn ở trên kết nối đó với cấu hình xác thực và nhà cung cấp gốc.
Việc giám sát bị vô hiệu hóa hoặc liên kết/kết nối bị sai lệch sẽ đóng an toàn
thay vì chuyển sang harness thư mục chính tác nhân thông thường.

Nguồn CLI, VS Code, Atlas hoặc ChatGPT ban đầu vẫn đủ điều kiện xuất hiện trong cả hai
danh mục. Nhánh chuẩn là một luồng Codex gốc, nhưng loại nguồn của nó là
`appServer`; các máy khách gốc có thể lọc loại nguồn đó, vì vậy không đảm bảo
nó sẽ xuất hiện trong Codex Desktop.

Các nguồn đang hoạt động không thể bắt đầu một nhánh mới hoặc được lưu trữ; một Chat được giám sát
hiện có vẫn có thể được mở. `notLoaded` có nghĩa là hoạt động chưa xác định, không phải nhàn rỗi;
OpenClaw chỉ cho phép lưu trữ một hàng `idle` hoặc `notLoaded` cục bộ sau khi xác nhận tường minh
rằng không có trình chạy nào khác và đọc trạng thái cục bộ theo tiến trình mới. Codex
tuần tự hóa các thay đổi luồng trong một tiến trình App Server nhưng không cung cấp
hợp đồng thuê độc quyền cho trình chạy hoặc chủ sở hữu phê duyệt xuyên tiến trình, vì vậy lần đọc đó không thể
chứng minh rằng một tiến trình khác không sử dụng luồng. OpenClaw chặn chủ sở hữu liên kết
được biết là đang hoạt động đối với đích chính xác hoặc bất kỳ hậu duệ được tạo ra chưa lưu trữ nào
do truy vấn hậu duệ phân trang của Codex trả về. Lỗi liệt kê, chu trình và
việc cạn giới hạn an toàn đều đóng an toàn. Thao tác lưu trữ gốc vẫn có thể xảy ra đồng thời với một lượt mới
trong tiến trình khác, vì vậy xác nhận bao quát các máy khách chưa xác định và khoảng trống giữa
lần đọc trạng thái với thao tác lưu trữ. Không thể xóa Chat được giám sát và khóa mô hình trong khi
nó bảo vệ liên kết gốc.

Các danh mục Node ghép cặp chỉ chứa siêu dữ liệu trong bản phát hành ban đầu. Ranh giới
gọi Node hiện tại là yêu cầu/phản hồi và không thể truyền các sự kiện lượt tồn tại lâu dài,
yêu cầu phê duyệt hoặc đầu ra truyền phát mà một liên kết Codex harness thực sự yêu cầu.
Do đó, **Continue** và **Archive** từ xa vẫn không khả dụng ngay cả
khi hàng đang nhàn rỗi.

Xem [Giám sát Codex](/plugins/codex-supervision) để biết cách thiết lập dành cho người vận hành và
hành vi hiển thị của Control UI.

## Phản hồi hiển thị và Heartbeat

Các lượt chat trực tiếp/từ nguồn qua Codex harness mặc định tự động phân phối
phản hồi cuối cùng của trợ lý cho các bề mặt WebChat nội bộ, phù hợp với hợp đồng Pi harness:
tác nhân phản hồi bình thường và OpenClaw đăng văn bản cuối cùng vào
cuộc hội thoại nguồn. Đặt `messages.visibleReplies: "message_tool"` để giữ
văn bản cuối cùng của trợ lý ở chế độ riêng tư trừ khi tác nhân gọi `message(action="send")`.

Các lượt Heartbeat của Codex mặc định nhận `heartbeat_respond` trong danh mục công cụ
OpenClaw có thể tìm kiếm để tác nhân có thể ghi lại liệu lần đánh thức nên giữ im lặng
hay gửi thông báo. Hướng dẫn chủ động Heartbeat được gửi dưới dạng chỉ dẫn dành cho nhà phát triển
ở chế độ cộng tác Codex trong phạm vi lượt Heartbeat; các lượt chat thông thường vẫn
ở chế độ Codex Default. Khi `HEARTBEAT.md` không trống, các chỉ dẫn Heartbeat
hướng Codex đến tệp thay vì nhúng trực tiếp nội dung của tệp.

## Ranh giới hook

| Lớp                                   | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Khả năng tương thích sản phẩm/Plugin giữa OpenClaw và Codex harness. |
| Middleware mở rộng app-server Codex   | Các Plugin đi kèm OpenClaw | Hành vi bộ điều hợp theo từng lượt quanh các công cụ động của OpenClaw. |
| Hook gốc Codex                        | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không sử dụng các tệp `hooks.json` Codex ở cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin. Đối với cầu nối công cụ gốc và quyền, OpenClaw chèn
cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`, `PermissionRequest`
và `Stop`.

Khi các phê duyệt app-server Codex được bật (`approvalPolicy` không phải là
`"never"`), cấu hình hook gốc được chèn mặc định sẽ bỏ qua `PermissionRequest`
để trình review app-server của Codex và cầu nối phê duyệt của OpenClaw xử lý các
yêu cầu nâng quyền thực sự sau khi review. Thêm `permission_request` vào
`nativeHookRelay.events` để vẫn buộc sử dụng chuyển tiếp tương thích. Các hook Codex khác
như `SessionStart` và `UserPromptSubmit` vẫn là các điều khiển cấp Codex;
chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Đối với các công cụ động của OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, vì vậy hành vi Plugin và middleware chạy trong bộ điều hợp harness. Đối với
các công cụ gốc của Codex, Codex sở hữu bản ghi công cụ chuẩn; OpenClaw có thể sao chép
các sự kiện được chọn nhưng không thể ghi lại luồng gốc trừ khi Codex cung cấp khả năng đó
qua app-server hoặc callback hook gốc.

Các sự kiện `PreToolUse` ở chế độ báo cáo của app-server Codex trì hoãn việc phê duyệt Plugin cho
phê duyệt app-server tương ứng. Nếu một hook `before_tool_call` của OpenClaw trả về
`requireApproval` trong khi payload gốc đặt `openclaw_approval_mode:
"report"`, bộ chuyển tiếp hook gốc sẽ ghi lại yêu cầu phê duyệt Plugin và
không trả về quyết định gốc. Khi Codex sau đó gửi yêu cầu phê duyệt app-server
cho cùng lần sử dụng công cụ, OpenClaw mở prompt phê duyệt Plugin và
ánh xạ quyết định trở lại Codex. Các sự kiện `PermissionRequest` của Codex là một
đường dẫn phê duyệt riêng biệt và vẫn có thể định tuyến qua các phê duyệt OpenClaw khi
được cấu hình cho cầu nối đó.

Thông báo mục từ app-server Codex cũng cung cấp các quan sát `after_tool_call`
bất đồng bộ cho những lần hoàn thành công cụ gốc chưa được chuyển tiếp
`PostToolUse` gốc bao quát. Chúng chỉ dùng cho đo từ xa/khả năng tương thích; chúng không thể
chặn, trì hoãn hoặc thay đổi lệnh gọi công cụ gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo app-server Codex
và trạng thái bộ điều hợp OpenClaw, không phải từ lệnh hook gốc Codex.
`before_compaction`, `after_compaction`, `llm_input` và `llm_output` là
các quan sát cấp bộ điều hợp, không phải bản ghi từng byte của yêu cầu nội bộ
hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc của Codex được
chiếu dưới dạng sự kiện tác nhân `codex_app_server.hook` để theo dõi quỹ đạo và
gỡ lỗi. Chúng không gọi các hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong Codex runtime v1:

| Bề mặt                                       | Mức hỗ trợ                                                                          | Lý do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex               | Được hỗ trợ                                                                        | Codex app-server sở hữu lượt OpenAI, việc tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                                                                                                                                                                                                                                                                                          |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                                                                                                                                                                                                                                                                                                    |
| Công cụ động của OpenClaw                        | Được hỗ trợ                                                                        | Codex yêu cầu OpenClaw thực thi các công cụ này, vì vậy OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugin lời nhắc và ngữ cảnh                    | Được hỗ trợ                                                                        | OpenClaw chiếu lời nhắc/ngữ cảnh dành riêng cho OpenClaw vào lượt Codex, đồng thời giữ các lời nhắc cơ sở, mô hình và tài liệu dự án đã cấu hình do Codex sở hữu trong luồng Codex gốc. OpenClaw vô hiệu hóa tính cách tích hợp sẵn của Codex đối với các luồng gốc để các tệp tính cách trong không gian làm việc của tác tử vẫn có thẩm quyền. Hướng dẫn dành cho nhà phát triển Codex gốc chỉ chấp nhận hướng dẫn lệnh được giới hạn phạm vi rõ ràng trong `codex_app_server`; các gợi ý lệnh toàn cục cũ vẫn được giữ cho các bề mặt lời nhắc không phải Codex. |
| Vòng đời công cụ ngữ cảnh                      | Được hỗ trợ                                                                        | Việc tập hợp, tiếp nhận và bảo trì sau lượt chạy diễn ra xung quanh các lượt Codex. Công cụ ngữ cảnh không thay thế Compaction gốc của Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hook công cụ động                            | Được hỗ trợ                                                                        | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy xung quanh các công cụ động do OpenClaw sở hữu.                                                                                                                                                                                                                                                                                                                                                                          |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của bộ điều hợp                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` được kích hoạt với payload trung thực ở chế độ Codex.                                                                                                                                                                                                                                                                                                                                                           |
| Cổng sửa đổi câu trả lời cuối                    | Được hỗ trợ thông qua chuyển tiếp hook gốc                                              | Codex `Stop` được chuyển tiếp đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                                                                                                                                                                                                                                                                                                                |
| Chặn hoặc quan sát shell, bản vá và MCP gốc | Được hỗ trợ thông qua chuyển tiếp hook gốc                                              | Codex `PreToolUse` và `PostToolUse` được chuyển tiếp cho các bề mặt công cụ gốc đã được commit, bao gồm payload MCP trên Codex app-server `0.142.0` trở lên. Có hỗ trợ chặn; không hỗ trợ viết lại đối số.                                                                                                                                                                                                                                                                               |
| Chính sách quyền gốc                      | Được hỗ trợ thông qua phê duyệt của Codex app-server và chuyển tiếp hook gốc để tương thích | Các yêu cầu phê duyệt của Codex app-server được định tuyến qua OpenClaw sau khi Codex xem xét. Chuyển tiếp hook gốc `PermissionRequest` là tùy chọn bật đối với các chế độ phê duyệt gốc vì Codex phát nó trước khi guardian xem xét.                                                                                                                                                                                                                                                                          |
| Ghi lại quỹ đạo app-server                 | Được hỗ trợ                                                                        | OpenClaw ghi lại yêu cầu đã gửi đến app-server và các thông báo nhận được từ app-server.                                                                                                                                                                                                                                                                                                                                                                                    |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Hướng phát triển tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sửa đổi đối số công cụ gốc                       | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số của công cụ gốc Codex.                                               | Yêu cầu Codex hỗ trợ hook/lược đồ cho đầu vào công cụ thay thế.                            |
| Lịch sử bản ghi gốc Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chính tắc. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên sửa đổi các thành phần nội bộ không được hỗ trợ. | Thêm API Codex app-server rõ ràng nếu cần can thiệp vào luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc Codex | Hook đó chuyển đổi các lượt ghi bản ghi do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng việc viết lại chính tắc cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw có thể yêu cầu Compaction gốc, nhưng không nhận được danh sách giữ lại/loại bỏ ổn định, mức chênh lệch token, bản tóm tắt hoàn tất hoặc payload tóm tắt.   | Cần các sự kiện Compaction Codex phong phú hơn.                                                     |
| Can thiệp Compaction                             | OpenClaw không cho phép Plugin hoặc công cụ ngữ cảnh phủ quyết, viết lại hay thay thế Compaction gốc của Codex.                                             | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại từng byte của yêu cầu API mô hình             | OpenClaw có thể ghi lại yêu cầu và thông báo của app-server, nhưng lõi Codex tạo yêu cầu API OpenAI cuối cùng ở nội bộ.                      | Cần sự kiện theo dõi yêu cầu mô hình hoặc API gỡ lỗi của Codex.                                   |

## Quyền gốc và yêu cầu cung cấp thông tin MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách đưa ra quyết định. Kết quả không có quyết định không phải là cho phép: Codex
coi đó là hook không đưa ra quyết định và chuyển sang guardian của chính nó hoặc đường dẫn
phê duyệt của người dùng.

Các chế độ phê duyệt của Codex app-server mặc định bỏ qua hook gốc này. Điều này
áp dụng trừ khi `permission_request` được đưa vào rõ ràng trong
`nativeHookRelay.events` hoặc một runtime tương thích cài đặt hook đó.

Khi người vận hành chọn `allow-always` cho một yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ chính xác dấu vân tay đầu vào nhà cung cấp/phiên/công cụ/cwd đó
trong một khoảng thời gian phiên hữu hạn. Quyết định được ghi nhớ
cố ý chỉ khớp chính xác: lệnh, đối số, payload công cụ hoặc
cwd thay đổi sẽ tạo một yêu cầu phê duyệt mới.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là `"mcp_tool_call"`. Codex
`request_user_input` đăng ký một câu hỏi Gateway trung lập với nhà cung cấp cho
phiên khởi tạo. Control UI hiển thị thẻ câu hỏi Gateway, và một
lựa chọn duy nhất không chứa bí mật sử dụng các nút kênh có kiểu khi kênh hỗ trợ
chúng. Các lần nhấn nút, câu trả lời trong Control UI và phản hồi văn bản thuần tiếp theo trong hàng đợi đều
giải quyết cùng một bản ghi Gateway trước khi OpenClaw trả về câu trả lời của app-server.
Cơ chế tự động giải quyết và việc hủy lần thử của Codex giới hạn thời gian chờ và hủy bản ghi.
Các câu hỏi bí mật hoàn toàn đi theo đường dẫn trả lời bằng văn bản có cảnh báo. Các yêu cầu
cung cấp thông tin MCP khác đều bị từ chối an toàn.

Đối với luồng phê duyệt Plugin chung truyền tải các lời nhắc này, hãy xem
[Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests).

## Điều hướng hàng đợi

Cơ chế điều hướng hàng đợi khi lượt chạy đang hoạt động ánh xạ tới `turn/steer` của app-server Codex. Với
`messages.queue.mode: "steer"` mặc định, OpenClaw gom các tin nhắn trò chuyện ở chế độ điều hướng
trong khoảng thời gian chờ đã cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer`
theo thứ tự đến.

Các lượt review Codex và Compaction thủ công có thể từ chối điều hướng trong cùng lượt. Trong
trường hợp đó, OpenClaw chờ lượt chạy đang hoạt động hoàn tất trước khi bắt đầu
prompt. Sử dụng `/queue followup` hoặc `/queue collect` khi các tin nhắn nên được đưa vào hàng đợi
theo mặc định thay vì được điều hướng. Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải phản hồi Codex lên

Khi `/diagnostics [note]` được phê duyệt cho một phiên trên harness Codex
gốc, OpenClaw cũng gọi `feedback/upload` của app-server Codex cho các luồng
Codex liên quan, bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex
được tạo ra khi có sẵn.

Nội dung tải lên đi qua luồng phản hồi thông thường của Codex tới các máy chủ OpenAI. Nếu
phản hồi Codex bị vô hiệu hóa trong app-server đó, lệnh sẽ trả về
lỗi app-server. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex và các lệnh `codex resume <thread-id>`
cục bộ cho những luồng đã được gửi.

Nếu bạn từ chối hoặc bỏ qua yêu cầu phê duyệt, OpenClaw không in các id Codex đó
và không gửi phản hồi Codex. Việc tải lên không thay thế bản xuất
chẩn đoán Gateway cục bộ. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết
hành vi phê duyệt, quyền riêng tư, gói cục bộ và trò chuyện nhóm.

Chỉ sử dụng `/codex diagnostics [note]` khi bạn muốn tải phản hồi Codex lên
cho luồng hiện đang được đính kèm mà không cần toàn bộ gói chẩn đoán
Gateway.

## Compaction và bản sao bản chép lời

Khi mô hình được chọn sử dụng harness Codex, việc Compaction luồng gốc
thuộc về app-server Codex. OpenClaw không chạy Compaction kiểm tra trước cho
các lượt Codex, không thay thế Compaction Codex bằng Compaction của công cụ ngữ cảnh, cũng không
chuyển dự phòng sang tính năng tóm tắt của OpenClaw hoặc OpenAI công khai khi không thể
bắt đầu Compaction gốc. OpenClaw duy trì một bản sao bản chép lời cho lịch sử kênh, tìm kiếm,
`/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai.

Các yêu cầu Compaction rõ ràng, chẳng hạn như `/compact` hoặc thao tác
Compaction thủ công do Plugin yêu cầu, bắt đầu Compaction Codex gốc bằng `thread/compact/start`.
OpenClaw giữ yêu cầu và quyền thuê máy khách dùng chung mở cho đến khi Codex phát ra
mục hoàn tất `contextCompaction` tương ứng, sau đó báo cáo lượt
Compaction là đã hoàn tất. Nếu lượt kết thúc đó vượt quá thời gian chờ Compaction
đã cấu hình, OpenClaw yêu cầu ngắt lượt gốc. Quyền thuê và hàng rào
Compaction theo luồng vẫn được giữ cho đến khi Codex báo cáo trạng thái kết thúc hoặc xác nhận
RPC ngắt. Nếu Codex không xác nhận trong khoảng thời gian gia hạn
ngắt, OpenClaw ngừng sử dụng kết nối trước khi giải phóng hàng rào. Các kết nối
từ xa cũng tách liên kết luồng tương ứng để công việc sau đó không thể
chồng lấn với một lượt từ xa chưa được xác nhận. Các lượt khác trên một kết nối đã ngừng sử dụng sẽ thất bại
và có thể thử lại trên một máy khách mới. Việc đóng máy khách, hủy yêu cầu hoặc một
lượt Compaction thất bại sẽ trả về một thao tác thất bại. Compaction tự động do áp lực ngữ cảnh
là nhiệm vụ của Codex; OpenClaw chỉ bắt đầu Compaction gốc cho các trình kích hoạt
được yêu cầu thủ công.

Khi một công cụ ngữ cảnh yêu cầu phép chiếu khởi tạo luồng Codex, OpenClaw
chiếu tên và id lệnh gọi công cụ, hình dạng đầu vào và nội dung kết quả công cụ
đã biên tập vào luồng Codex mới. Hệ thống không sao chép các giá trị đối số lệnh gọi công cụ
thô vào phép chiếu đó.

Bản sao bao gồm prompt của người dùng, văn bản cuối cùng của trợ lý và các bản ghi
suy luận hoặc kế hoạch Codex tinh gọn khi app-server phát ra chúng. OpenClaw
ghi lại thời điểm bắt đầu và trạng thái kết thúc của Compaction gốc, nhưng không
cung cấp bản tóm tắt Compaction mà con người có thể đọc được hoặc danh sách có thể kiểm tra về những
mục Codex đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` không
ghi lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi OpenClaw
ghi kết quả công cụ bản chép lời phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn nhà cung cấp phương tiện. Hình ảnh,
video, âm nhạc, PDF, TTS và khả năng hiểu phương tiện sử dụng các cài đặt nhà cung cấp/mô hình
tương ứng như `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` và `messages.tts`.

Văn bản, hình ảnh, video, âm nhạc, TTS, phê duyệt và đầu ra của công cụ nhắn tin tiếp tục
đi qua luồng phân phối OpenClaw thông thường; việc tạo phương tiện không yêu cầu
runtime cũ. Khi Codex phát ra một mục tạo hình ảnh gốc với
`savedPath`, OpenClaw chuyển tiếp chính xác tệp đó qua đường dẫn phương tiện phản hồi
thông thường ngay cả khi lượt Codex không có văn bản của trợ lý.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Giám sát Codex](/plugins/codex-supervision)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook Plugin](/vi/plugins/hooks)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Xuất quỹ đạo](/vi/tools/trajectory)
