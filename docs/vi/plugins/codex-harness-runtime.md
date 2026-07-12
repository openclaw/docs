---
read_when:
    - Bạn cần hợp đồng hỗ trợ thời gian chạy của bộ khung Codex
    - Bạn đang gỡ lỗi các công cụ Codex gốc, hook, Compaction hoặc chức năng tải phản hồi lên
    - Bạn đang thay đổi hành vi của Plugin xuyên suốt các lượt chạy của bộ khung OpenClaw và Codex
summary: Ranh giới thời gian chạy, hook, công cụ, quyền và chẩn đoán cho bộ khung Codex
title: Môi trường thực thi Codex harness
x-i18n:
    generated_at: "2026-07-12T08:06:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Hợp đồng thời gian chạy cho các lượt của bộ điều phối Codex. Để biết cách thiết lập và định tuyến, xem
[Bộ điều phối Codex](/vi/plugins/codex-harness). Để biết các trường cấu hình, xem
[Tham chiếu bộ điều phối Codex](/vi/plugins/codex-harness-reference).

## Tổng quan

Codex sở hữu vòng lặp mô hình gốc, việc tiếp tục luồng gốc, tiếp tục công cụ gốc
và Compaction gốc. OpenClaw sở hữu định tuyến kênh, tệp phiên,
phân phối thông báo hiển thị, công cụ động của OpenClaw, phê duyệt, phân phối
phương tiện và một bản sao bản ghi hội thoại bao quanh ranh giới đó.

Việc định tuyến lời nhắc tuân theo thời gian chạy đã chọn, không chỉ theo chuỗi nhà cung cấp. Một
lượt Codex gốc nhận các chỉ dẫn dành cho nhà phát triển của app-server Codex; một tuyến
tương thích OpenClaw tường minh giữ nguyên lời nhắc hệ thống OpenClaw thông thường ngay cả khi
tuyến đó sử dụng xác thực hoặc cơ chế truyền tải OpenAI theo kiểu Codex.

OpenClaw khởi tạo và tiếp tục các luồng Codex gốc với tính cách tích hợp sẵn của Codex
bị vô hiệu hóa (`personality: "none"`) để các tệp tính cách trong không gian làm việc
và danh tính tác tử OpenClaw vẫn là nguồn có thẩm quyền. Ngoài ra, Codex gốc vẫn giữ
các chỉ dẫn cơ sở/mô hình do Codex sở hữu và việc tải tài liệu dự án. Các lượt chạy OpenClaw
gọn nhẹ (ví dụ cron) vẫn ngăn tải tài liệu dự án.

Các chỉ dẫn dành cho nhà phát triển OpenClaw bao quát các mối quan tâm của thời gian chạy OpenClaw: phân phối
qua kênh nguồn, công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh bộ điều hợp và
các tệp hồ sơ không gian làm việc của tác tử đang hoạt động. Danh mục Skill và các con trỏ
`MEMORY.md` được định tuyến qua công cụ được chiếu thành các chỉ dẫn cộng tác dành cho nhà phát triển
có phạm vi theo lượt. Khi công cụ bộ nhớ không khả dụng, nội dung `BOOTSTRAP.md` đang hoạt động
và toàn bộ `MEMORY.md` sẽ chuyển sang dùng ngữ cảnh đầu vào thuần túy của lượt thay thế.

Hầu hết công cụ động của OpenClaw sử dụng không gian tên `openclaw` có thể tìm kiếm. Các công cụ
được đánh dấu `catalogMode: "direct-only"` sử dụng `openclaw_direct`, được Codex giữ
hiển thị trực tiếp với mô hình dưới dạng `DirectModelOnly` thay vì đưa vào quá trình thực thi
Chế độ mã lồng nhau.

## Liên kết luồng và thay đổi mô hình

Khi một phiên OpenClaw được gắn vào một luồng Codex hiện có, lượt
tiếp theo sẽ gửi lại mô hình đang được chọn, chính sách phê duyệt, sandbox,
bộ xét duyệt phê duyệt và cấp dịch vụ cho app-server. Việc chuyển từ
`openai/gpt-5.5` sang `openai/gpt-5.2` giữ nguyên liên kết luồng nhưng yêu cầu Codex
tiếp tục bằng mô hình mới được chọn.

Các liên kết được giám sát là ngoại lệ. Bộ chọn mô hình OpenClaw vẫn bị khóa,
và khi tiếp tục sẽ bỏ qua các giá trị ghi đè mô hình và nhà cung cấp để Codex khôi phục
mô hình và nhà cung cấp đã được lưu bền vững của luồng chuẩn. Một điều khiển Codex gốc
riêng biệt có thể thay đổi cặp đã lưu bền vững đó, và ảnh chụp nhanh ban đầu có thể tạo ra cảnh báo
khác biệt mô hình thông thường của Codex; mô hình OpenClaw bên ngoài và chuỗi dự phòng không bao giờ
thay thế bất kỳ thành phần nào trong cặp đó.

## Giám sát và tiếp tục an toàn

Giám sát Codex là một khả năng tùy chọn tham gia của cùng Plugin `codex`. Khả năng này khám phá
các luồng gốc thông qua một kết nối riêng và chỉ chiếu các phiên chưa lưu trữ
vào danh mục Gateway. Khi không có cài đặt kết nối `appServer` tường minh,
kết nối đó sử dụng stdio được quản lý trong thư mục chính của người dùng, còn bộ điều phối
thông thường vẫn có phạm vi theo tác tử. Việc liệt kê và đọc siêu dữ liệu là thụ động: chúng không
tiếp tục luồng, đăng ký OpenClaw nhận các sự kiện trực tiếp của luồng hay trả lời
các yêu cầu phê duyệt của luồng.

Đối với một phiên đã lưu hoặc đang rảnh trên máy tính Gateway, **Tiếp tục dưới dạng nhánh**
tạo một Cuộc trò chuyện thông thường bị khóa theo mô hình và sao chép lịch sử người dùng cùng trợ lý
có giới hạn đến lượt cuối cùng đã được lưu bền vững và kết thúc của nguồn. Lượt Cuộc trò chuyện
thông thường đầu tiên cài đặt các trình xử lý phê duyệt thực và sử dụng một nhánh tách gốc tạm thời
để ghim ảnh chụp nhanh mà không ghi đè mô hình hoặc nhà cung cấp. Codex App Server sử dụng
cấu hình gốc hiện tại và trả về cặp đã chọn; nó phát cảnh báo
thông thường nếu mô hình đó khác với mô hình được ghi lại gần nhất của nguồn.
Trên cùng kết nối giám sát, OpenClaw khởi tạo luồng bộ điều phối Codex chuẩn
có nguồn `appServer` trong thư mục làm việc và theo chính sách thời gian chạy của luồng đó, với
chính xác mô hình và nhà cung cấp được trả về cho lần khởi tạo ban đầu, chèn
lịch sử hiển thị có giới hạn và lưu trữ nhánh tách tạm thời. Nguồn không bao giờ
được tiếp tục. Luồng chuẩn có đầy đủ bề mặt công cụ của bộ điều phối OpenClaw;
phần suy luận, lệnh gọi công cụ và kết quả công cụ từ nguồn không được sao chép vào luồng.
Phạm vi kết nối riêng vẫn tồn tại qua các trạng thái liên kết đang chờ và đã cam kết, vì vậy
mọi lượt sau đó vẫn ở trên kết nối đó với cấu hình xác thực và nhà cung cấp
gốc. Khi giám sát bị vô hiệu hóa hoặc liên kết/kết nối bị sai lệch, hệ thống sẽ đóng an toàn
thay vì chuyển sang bộ điều phối thông thường trong thư mục chính của tác tử.

Nguồn CLI hoặc VS Code ban đầu vẫn đủ điều kiện xuất hiện trong cả hai danh mục.
Nhánh chuẩn là một luồng Codex gốc, nhưng loại nguồn của nó là `appServer`;
các máy khách gốc có thể lọc loại nguồn đó, vì vậy không đảm bảo nhánh sẽ xuất hiện trong Codex Desktop.

Nguồn đang hoạt động không thể khởi tạo nhánh mới hoặc được lưu trữ; một Cuộc trò chuyện được giám sát
hiện có vẫn có thể được mở. `notLoaded` có nghĩa là không rõ trạng thái hoạt động, không phải đang rảnh;
OpenClaw chỉ cho phép lưu trữ một hàng `idle` hoặc `notLoaded` cục bộ sau khi có xác nhận tường minh
rằng không có trình chạy nào khác và đọc mới trạng thái cục bộ của tiến trình. Codex
tuần tự hóa các thao tác thay đổi luồng trong một tiến trình App Server nhưng không cung cấp
quyền thuê độc quyền xuyên tiến trình cho trình chạy hoặc chủ thể phê duyệt, vì vậy lần đọc đó không thể
chứng minh rằng một tiến trình khác không sử dụng luồng. OpenClaw chặn một chủ sở hữu
liên kết đang hoạt động đã biết đối với chính xác đích hoặc bất kỳ hậu duệ được tạo ra và chưa lưu trữ nào
do truy vấn hậu duệ phân trang của Codex trả về. Lỗi liệt kê, chu trình và
việc đạt giới hạn an toàn đều khiến hệ thống đóng an toàn. Việc lưu trữ gốc vẫn có thể tranh chấp
với một lượt mới trong tiến trình khác, vì vậy xác nhận bao gồm các máy khách không xác định và khoảng trống
giữa lần đọc trạng thái với thao tác lưu trữ. Không thể xóa một Cuộc trò chuyện được giám sát và khóa theo mô hình
khi nó đang bảo vệ liên kết gốc.

Danh mục Node ghép cặp chỉ chứa siêu dữ liệu trong bản phát hành đầu tiên. Ranh giới
gọi Node hiện tại hoạt động theo yêu cầu/phản hồi và không thể mang các sự kiện lượt tồn tại lâu dài,
yêu cầu phê duyệt hoặc đầu ra truyền phát mà một liên kết bộ điều phối Codex thực sự yêu cầu.
Vì vậy, **Tiếp tục** và **Lưu trữ** từ xa vẫn không khả dụng ngay cả khi hàng đang rảnh.

Xem [Giám sát Codex](/vi/plugins/codex-supervision) để biết cách thiết lập dành cho người vận hành và
hành vi hiển thị của giao diện điều khiển.

## Phản hồi hiển thị và Heartbeat

Theo mặc định, các lượt trò chuyện trực tiếp/từ nguồn qua bộ điều phối Codex sẽ tự động phân phối
phản hồi cuối cùng của trợ lý cho các bề mặt WebChat nội bộ, phù hợp với hợp đồng bộ điều phối Pi:
tác tử phản hồi bình thường và OpenClaw đăng văn bản cuối cùng vào
cuộc trò chuyện nguồn. Đặt `messages.visibleReplies: "message_tool"` để giữ
văn bản cuối cùng của trợ lý ở chế độ riêng tư trừ khi tác tử gọi `message(action="send")`.

Theo mặc định, các lượt Heartbeat của Codex nhận `heartbeat_respond` trong danh mục công cụ
OpenClaw có thể tìm kiếm để tác tử có thể ghi lại liệu lần đánh thức nên giữ im lặng
hay thông báo. Hướng dẫn về việc chủ động Heartbeat được gửi dưới dạng chỉ dẫn dành cho nhà phát triển
ở chế độ cộng tác của Codex, có phạm vi theo lượt Heartbeat; các lượt trò chuyện thông thường vẫn
ở chế độ Mặc định của Codex. Khi `HEARTBEAT.md` không trống, các chỉ dẫn Heartbeat
sẽ trỏ Codex đến tệp thay vì nhúng trực tiếp nội dung của tệp.

## Ranh giới hook

| Lớp                                   | Chủ sở hữu               | Mục đích                                                                      |
| ------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Khả năng tương thích sản phẩm/Plugin giữa các bộ điều phối OpenClaw và Codex. |
| Phần mềm trung gian mở rộng app-server Codex | Các Plugin đi kèm OpenClaw | Hành vi bộ điều hợp theo lượt xung quanh các công cụ động của OpenClaw.        |
| Hook gốc Codex                        | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex.          |

OpenClaw không sử dụng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin. Đối với cầu nối công cụ gốc và quyền, OpenClaw chèn
cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`, `PermissionRequest`
và `Stop`.

Khi phê duyệt app-server Codex được bật (`approvalPolicy` không phải
`"never"`), cấu hình hook gốc được chèn mặc định sẽ bỏ qua `PermissionRequest`
để bộ xét duyệt app-server của Codex và cầu nối phê duyệt của OpenClaw xử lý các
yêu cầu nâng quyền thực tế sau khi xét duyệt. Thêm `permission_request` vào
`nativeHookRelay.events` để vẫn buộc sử dụng bộ chuyển tiếp tương thích. Các hook Codex khác
như `SessionStart` và `UserPromptSubmit` vẫn là các điều khiển cấp Codex;
chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Đối với các công cụ động của OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, vì vậy hành vi Plugin và phần mềm trung gian chạy trong bộ điều hợp của bộ điều phối. Đối với
công cụ gốc của Codex, Codex sở hữu bản ghi công cụ chuẩn; OpenClaw có thể sao chép
các sự kiện đã chọn nhưng không thể ghi lại luồng gốc trừ khi Codex cung cấp khả năng đó
thông qua app-server hoặc lệnh gọi lại hook gốc.

Các sự kiện `PreToolUse` ở chế độ báo cáo của app-server Codex hoãn việc phê duyệt Plugin đến
phê duyệt app-server tương ứng. Nếu hook `before_tool_call` của OpenClaw trả về
`requireApproval` trong khi tải trọng gốc đặt `openclaw_approval_mode:
"report"`, bộ chuyển tiếp hook gốc ghi lại yêu cầu phê duyệt Plugin và
không trả về quyết định gốc. Khi Codex sau đó gửi yêu cầu phê duyệt app-server
cho cùng lần sử dụng công cụ, OpenClaw mở lời nhắc phê duyệt Plugin và
ánh xạ quyết định trở lại Codex. Các sự kiện `PermissionRequest` của Codex là một
đường dẫn phê duyệt riêng và vẫn có thể định tuyến qua phê duyệt của OpenClaw khi
được cấu hình cho cầu nối đó.

Các thông báo mục của app-server Codex cũng cung cấp các quan sát `after_tool_call`
bất đồng bộ cho những lần hoàn tất công cụ gốc chưa được bộ chuyển tiếp
`PostToolUse` gốc bao quát. Các quan sát này chỉ dành cho đo từ xa/khả năng tương thích; chúng không thể
chặn, trì hoãn hoặc thay đổi lệnh gọi công cụ gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo app-server Codex
và trạng thái bộ điều hợp OpenClaw, không phải từ các lệnh hook gốc của Codex.
`before_compaction`, `after_compaction`, `llm_input` và `llm_output` là
các quan sát cấp bộ điều hợp, không phải bản ghi chính xác từng byte của yêu cầu nội bộ
hoặc tải trọng Compaction của Codex.

Các thông báo app-server gốc `hook/started` và `hook/completed` của Codex được
chiếu thành các sự kiện tác tử `codex_app_server.hook` để theo dõi tiến trình và
gỡ lỗi. Chúng không gọi các hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Được hỗ trợ trong thời gian chạy Codex v1:

| Bề mặt                                       | Mức hỗ trợ                                                                          | Lý do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex               | Được hỗ trợ                                                                        | Codex app-server sở hữu lượt OpenAI, việc tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                                                                                                                                                                                                                                                                                          |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài môi trường chạy mô hình.                                                                                                                                                                                                                                                                                                                                                                                    |
| Công cụ động của OpenClaw                        | Được hỗ trợ                                                                        | Codex yêu cầu OpenClaw thực thi các công cụ này, vì vậy OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugin lời nhắc và ngữ cảnh                    | Được hỗ trợ                                                                        | OpenClaw chiếu lời nhắc/ngữ cảnh dành riêng cho OpenClaw vào lượt Codex, đồng thời giữ lời nhắc cơ sở, mô hình và tài liệu dự án đã cấu hình do Codex sở hữu trong luồng Codex gốc. OpenClaw vô hiệu hóa tính cách tích hợp sẵn của Codex đối với các luồng gốc để các tệp tính cách trong không gian làm việc của tác tử vẫn là nguồn có thẩm quyền. Chỉ các hướng dẫn dành cho nhà phát triển Codex gốc được xác định phạm vi rõ ràng cho `codex_app_server` mới chấp nhận hướng dẫn lệnh; các gợi ý lệnh toàn cục cũ vẫn được giữ cho các bề mặt lời nhắc không phải Codex. |
| Vòng đời công cụ ngữ cảnh                      | Được hỗ trợ                                                                        | Việc tập hợp, tiếp nhận và bảo trì sau lượt chạy diễn ra xung quanh các lượt Codex. Công cụ ngữ cảnh không thay thế Compaction gốc của Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hook công cụ động                            | Được hỗ trợ                                                                        | `before_tool_call`, `after_tool_call` và phần mềm trung gian xử lý kết quả công cụ chạy xung quanh các công cụ động do OpenClaw sở hữu.                                                                                                                                                                                                                                                                                                                                                                          |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của bộ điều hợp                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` được kích hoạt với các tải dữ liệu phản ánh trung thực chế độ Codex.                                                                                                                                                                                                                                                                                                                                                           |
| Cổng sửa đổi câu trả lời cuối                    | Được hỗ trợ thông qua chuyển tiếp hook gốc                                              | `Stop` của Codex được chuyển tiếp đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                                                                                                                                                                                                                                                                                                                |
| Chặn hoặc quan sát shell, bản vá và MCP gốc | Được hỗ trợ thông qua chuyển tiếp hook gốc                                              | `PreToolUse` và `PostToolUse` của Codex được chuyển tiếp cho các bề mặt công cụ gốc đã cam kết, bao gồm tải dữ liệu MCP trên Codex app-server `0.142.0` trở lên. Có hỗ trợ chặn; không hỗ trợ viết lại đối số.                                                                                                                                                                                                                                                                               |
| Chính sách quyền gốc                      | Được hỗ trợ thông qua phê duyệt của Codex app-server và chuyển tiếp hook gốc để tương thích | Các yêu cầu phê duyệt của Codex app-server được định tuyến qua OpenClaw sau khi Codex xem xét. Việc chuyển tiếp hook gốc `PermissionRequest` phải được chủ động bật cho các chế độ phê duyệt gốc vì Codex phát hook này trước khi trình giám hộ xem xét.                                                                                                                                                                                                                                                                          |
| Ghi lại quỹ đạo app-server                 | Được hỗ trợ                                                                        | OpenClaw ghi lại yêu cầu đã gửi đến app-server và các thông báo nhận được từ app-server.                                                                                                                                                                                                                                                                                                                                                                                    |

Không được hỗ trợ trong môi trường chạy Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Hướng phát triển tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sửa đổi đối số công cụ gốc                       | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Yêu cầu Codex hỗ trợ hook/lược đồ để thay thế đầu vào công cụ.                            |
| Lịch sử bản chép lời gốc của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn tắc. OpenClaw sở hữu một bản sao và có thể chiếu ngữ cảnh trong tương lai, nhưng không nên sửa đổi các phần nội bộ không được hỗ trợ. | Thêm API Codex app-server rõ ràng nếu cần can thiệp vào luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó biến đổi các lần ghi bản chép lời do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể sao chép các bản ghi đã biến đổi, nhưng việc viết lại bản chuẩn tắc cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw có thể yêu cầu Compaction gốc, nhưng không nhận được danh sách ổn định về nội dung được giữ/loại bỏ, mức thay đổi token, bản tóm tắt hoàn tất hoặc tải dữ liệu tóm tắt.   | Cần các sự kiện Compaction phong phú hơn từ Codex.                                                     |
| Can thiệp vào Compaction                             | OpenClaw không cho phép Plugin hoặc công cụ ngữ cảnh phủ quyết, viết lại hay thay thế Compaction gốc của Codex.                                             | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại từng byte yêu cầu API mô hình             | OpenClaw có thể ghi lại các yêu cầu và thông báo của app-server, nhưng lõi Codex xây dựng nội bộ yêu cầu API OpenAI cuối cùng.                      | Cần sự kiện theo dõi yêu cầu mô hình hoặc API gỡ lỗi của Codex.                                   |

## Quyền gốc và yêu cầu cung cấp thông tin MCP

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách đưa ra quyết định. Kết quả không có quyết định không đồng nghĩa với cho phép: Codex
xử lý kết quả đó như không có quyết định từ hook và chuyển tiếp sang quy trình phê duyệt của
trình giám hộ hoặc người dùng.

Theo mặc định, các chế độ phê duyệt của Codex app-server bỏ qua hook gốc này. Điều này
được áp dụng trừ khi `permission_request` được đưa rõ ràng vào
`nativeHookRelay.events` hoặc một môi trường chạy tương thích cài đặt hook đó.

Khi người vận hành chọn `allow-always` cho một yêu cầu quyền gốc của Codex,
OpenClaw ghi nhớ dấu vân tay chính xác của nhà cung cấp/phiên/đầu vào công cụ/cwd đó
trong một khoảng thời gian phiên có giới hạn. Quyết định được ghi nhớ
cố ý chỉ áp dụng khi khớp chính xác: bất kỳ thay đổi nào về lệnh, đối số, tải dữ liệu công cụ hoặc
cwd đều tạo ra một yêu cầu phê duyệt mới.

Các yêu cầu phê duyệt công cụ Codex MCP được định tuyến qua luồng phê duyệt Plugin của
OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là `"mcp_tool_call"`. Các lời nhắc
`request_user_input` của Codex được gửi lại cuộc trò chuyện ban đầu và
tin nhắn tiếp theo trong hàng đợi sẽ trả lời yêu cầu máy chủ gốc đó thay vì
được điều hướng thành ngữ cảnh bổ sung. Các yêu cầu cung cấp thông tin MCP khác bị từ chối theo mặc định.

Để biết luồng phê duyệt Plugin chung truyền tải các lời nhắc này, hãy xem
[Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests).

## Điều hướng hàng đợi

Việc điều hướng hàng đợi trong lượt chạy đang hoạt động ánh xạ tới `turn/steer` của Codex app-server. Với
`messages.queue.mode: "steer"` mặc định, OpenClaw gom nhóm các tin nhắn trò chuyện
ở chế độ điều hướng trong khoảng thời gian yên lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer`
theo thứ tự đến.

Các lượt xem xét của Codex và Compaction thủ công có thể từ chối việc điều hướng trong cùng lượt. Trong
trường hợp đó, OpenClaw chờ lượt chạy đang hoạt động hoàn tất trước khi bắt đầu
lời nhắc. Dùng `/queue followup` hoặc `/queue collect` khi các tin nhắn cần được đưa vào hàng đợi
theo mặc định thay vì điều hướng. Xem [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tải phản hồi Codex lên

Khi `/diagnostics [note]` được phê duyệt cho một phiên trên bộ điều phối Codex
gốc, OpenClaw cũng gọi `feedback/upload` của Codex app-server cho các
luồng Codex liên quan, bao gồm nhật ký của từng luồng được liệt kê và các
luồng con Codex được tạo ra khi có sẵn.

Nội dung tải lên đi qua luồng phản hồi thông thường của Codex đến các máy chủ OpenAI. Nếu
phản hồi Codex bị vô hiệu hóa trong app-server đó, lệnh sẽ trả về lỗi của
app-server. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
ID phiên OpenClaw, ID luồng Codex và các lệnh `codex resume <thread-id>`
cục bộ cho những luồng đã được gửi.

Nếu bạn từ chối hoặc bỏ qua yêu cầu phê duyệt, OpenClaw không in các ID Codex đó
và không gửi phản hồi Codex. Việc tải lên không thay thế bản xuất chẩn đoán
Gateway cục bộ. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết về
việc phê duyệt, quyền riêng tư, gói cục bộ và hành vi trong cuộc trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn muốn tải phản hồi Codex lên
cho luồng hiện đang được đính kèm mà không cần toàn bộ gói chẩn đoán
Gateway.

## Compaction và bản sao bản chép lời

Khi mô hình được chọn sử dụng bộ điều phối Codex, việc Compaction luồng gốc
thuộc về Codex app-server. OpenClaw không chạy Compaction kiểm tra trước cho
các lượt Codex, không thay Compaction của Codex bằng Compaction của công cụ ngữ cảnh, cũng không
chuyển sang sử dụng tính năng tóm tắt của OpenClaw hoặc OpenAI công khai khi không thể
bắt đầu Compaction gốc. OpenClaw duy trì một bản sao bản chép lời cho lịch sử kênh, tìm kiếm,
`/new`, `/reset` và việc chuyển đổi mô hình hoặc bộ điều phối trong tương lai.

Các yêu cầu Compaction rõ ràng, chẳng hạn như `/compact` hoặc thao tác Compaction thủ công
do Plugin yêu cầu, sẽ bắt đầu Compaction Codex gốc bằng `thread/compact/start`.
OpenClaw giữ yêu cầu và quyền thuê máy khách dùng chung ở trạng thái mở cho đến khi Codex phát ra
mục hoàn tất `contextCompaction` tương ứng, sau đó báo cáo lượt Compaction
là đã hoàn tất. Nếu lượt kết thúc đó vượt quá thời gian chờ Compaction
đã cấu hình, OpenClaw yêu cầu ngắt lượt theo cơ chế gốc. Quyền thuê và rào chắn
Compaction theo từng luồng vẫn được giữ cho đến khi Codex báo cáo trạng thái kết thúc hoặc xác nhận
RPC ngắt. Nếu Codex không xác nhận trong khoảng thời gian gia hạn
ngắt, OpenClaw cho kết nối ngừng hoạt động trước khi giải phóng rào chắn. Các kết nối
từ xa cũng tách liên kết luồng tương ứng để công việc sau đó không thể
chồng lấp với một lượt từ xa chưa được xác nhận. Các lượt khác trên kết nối đã ngừng hoạt động sẽ thất bại
và có thể thử lại trên một máy khách mới. Việc đóng máy khách, hủy yêu cầu hoặc một
lượt Compaction thất bại sẽ trả về một thao tác thất bại. Compaction tự động khi
ngữ cảnh chịu áp lực là nhiệm vụ của Codex; OpenClaw chỉ bắt đầu Compaction gốc cho các
tác nhân kích hoạt được yêu cầu thủ công.

Khi công cụ ngữ cảnh yêu cầu phép chiếu khởi tạo luồng Codex, OpenClaw
chiếu tên và ID của lệnh gọi công cụ, hình dạng đầu vào và nội dung kết quả công cụ
đã che thông tin nhạy cảm vào luồng Codex mới. Nó không sao chép các giá trị đối số
thô của lệnh gọi công cụ vào phép chiếu đó.

Bản sao bao gồm lời nhắc của người dùng, văn bản cuối cùng của trợ lý và các bản ghi
suy luận hoặc kế hoạch Codex dạng nhẹ khi app-server phát ra chúng. OpenClaw
ghi lại thời điểm bắt đầu Compaction gốc và trạng thái kết thúc, nhưng không
cung cấp bản tóm tắt Compaction mà con người có thể đọc hoặc danh sách có thể kiểm tra về những
mục mà Codex đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chính thức, `tool_result_persist` không
ghi lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi OpenClaw
ghi kết quả công cụ vào bản chép lời phiên do OpenClaw sở hữu.

## Phương tiện và phân phối

OpenClaw tiếp tục sở hữu việc phân phối phương tiện và lựa chọn nhà cung cấp phương tiện. Việc tạo hình ảnh,
video, nhạc, PDF, TTS và hiểu nội dung phương tiện sử dụng các thiết lập nhà cung cấp/mô hình
tương ứng như `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` và `messages.tts`.

Văn bản, hình ảnh, video, nhạc, TTS, yêu cầu phê duyệt và đầu ra của công cụ nhắn tin tiếp tục
đi qua luồng phân phối OpenClaw thông thường; việc tạo phương tiện không yêu cầu
môi trường thực thi cũ. Khi Codex phát ra một mục tạo hình ảnh gốc có
`savedPath`, OpenClaw chuyển tiếp chính xác tệp đó qua luồng phương tiện phản hồi
thông thường ngay cả khi lượt Codex không có văn bản trợ lý.

## Liên quan

- [Bộ điều phối Codex](/vi/plugins/codex-harness)
- [Tài liệu tham khảo về bộ điều phối Codex](/vi/plugins/codex-harness-reference)
- [Giám sát Codex](/vi/plugins/codex-supervision)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Hook của Plugin](/vi/plugins/hooks)
- [Plugin bộ điều phối tác nhân](/vi/plugins/sdk-agent-harness)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Xuất quỹ đạo](/vi/tools/trajectory)
