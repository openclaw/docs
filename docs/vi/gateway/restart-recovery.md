---
read_when:
    - Bạn muốn biết liệu việc khởi động lại Gateway có làm mất công việc đang được agent thực hiện hay không
    - Một lượt chạy tác tử đã bị gián đoạn do khởi động lại, sự cố hoặc tải lại cấu hình
    - Bạn đang gỡ lỗi quá trình tự động khôi phục phiên sau khi Gateway hoạt động trở lại
summary: 'Những gì vẫn tiếp tục sau khi Gateway khởi động lại hoặc gặp sự cố: các lượt xử lý của tác nhân bị gián đoạn sẽ tự động tiếp tục, các tác nhân con và tác vụ nền sẽ khôi phục, các lượt gửi đang xếp hàng sẽ được xử lý hết'
title: Khôi phục sau khi khởi động lại
x-i18n:
    generated_at: "2026-07-19T05:45:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdea30f3a90697951f4f63a06897d2c1d936e5145138b47fed7d8ebd8b7187ad
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Khởi động lại Gateway không làm mất trạng thái của tác nhân. Các cuộc hội thoại, bản ghi hội thoại,
tác vụ đã lên lịch, bản ghi tác vụ nền và tin nhắn gửi đi đang chờ đều được lưu
trên đĩa, đồng thời công việc bị gián đoạn giữa lượt sẽ được phát hiện và tiếp tục
tự động sau khi Gateway hoạt động trở lại. Khôi phục luôn được bật và
thông thường không cần can thiệp thủ công. Hoạt động khôi phục liên tục thất bại được giới hạn
và có thể cách ly một phiên cho đến khi bạn kiểm tra hoặc thay thế phiên đó.

Trang này mô tả những gì được duy trì sau khi khởi động lại, cách phát hiện công việc bị gián đoạn
và quá trình tự động tiếp tục diễn ra như thế nào.

## Những gì được duy trì sau khi khởi động lại

| Trạng thái                         | Nơi lưu trữ                                     | Hành vi qua lần khởi động lại                                                 |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Lịch sử hội thoại          | Cơ sở dữ liệu SQLite riêng cho từng tác nhân                   | Không thay đổi; các phiên tiếp tục từ bản ghi hội thoại đã lưu                 |
| Lượt phiên chính bị gián đoạn | Hàng phiên và bản ghi hội thoại SQLite riêng cho từng tác nhân | Tự động tiếp tục hoặc đối soát vài giây sau khi khởi động         |
| Các lượt chạy tác nhân phụ                 | SQLite (cơ sở dữ liệu trạng thái dùng chung)              | Sổ đăng ký được khôi phục khi khởi động; các lượt chạy bị gián đoạn được tiếp tục                     |
| Tác vụ nền              | SQLite (cơ sở dữ liệu trạng thái dùng chung)              | Được đối soát khi khởi động; các lượt chạy mất chủ được khôi phục hoặc đánh dấu là bị mất              |
| Hoạt động gửi đi đang chờ    | Hàng đợi gửi SQLite                       | Được xử lý sau khi khởi động lại; các phản hồi chưa gửi được sẽ được thử lại                  |
| Tác vụ đã lên lịch (Cron)         | Kho Cron SQLite                           | Lịch biểu được duy trì; trình lập lịch kích hoạt lại khi khởi động                        |
| Tiếp tục sau khi khởi động lại          | Dấu hiệu khởi động lại SQLite                     | Một lượt theo dõi duy nhất được gửi đến phiên đã yêu cầu khởi động lại |

## Khởi động lại có kiểm soát sẽ chờ hoàn tất trước

Một yêu cầu khởi động lại (`openclaw gateway restart`, thay đổi cấu hình yêu cầu
khởi động lại hoặc cập nhật Gateway) không kết thúc ngay công việc đang thực hiện. Gateway
ngừng tiếp nhận công việc mới, sau đó chờ các lượt tác nhân và
tác vụ nền đang hoạt động hoàn tất, tối đa trong giới hạn thời gian chờ hoàn tất (mặc định là 5 phút). Vì vậy, hầu hết
các lần khởi động lại hoàn toàn không làm gián đoạn công việc.

Chỉ công việc không thể hoàn tất trong giới hạn thời gian chờ (hoặc bất kỳ lượt chạy nào bị gián đoạn
do buộc khởi động lại hay sự cố) mới bị hủy — và trước khi điều đó xảy ra, mỗi
phiên bị ảnh hưởng sẽ được đánh dấu để khôi phục.

## Cách phát hiện công việc bị gián đoạn

Ba cơ chế bổ trợ lẫn nhau đánh dấu các phiên có lượt chưa hoàn tất:

- **Khi tiếp nhận lượt:** đối với một lượt văn bản thông thường trên phiên chính hiện có,
  Gateway nối thêm tin nhắn của người dùng, đánh dấu phiên là đang chạy và ghi lại
  xác nhận quyền gửi phục vụ khôi phục của phiên trong một giao dịch SQLite trước khi thực thi mô hình hoặc
  hook `before_agent_reply`. Control UI thực hiện việc này trước khi trả về xác nhận
  `started`; hoạt động điều phối kênh thực hiện việc này khi lượt đã chuẩn bị
  tiếp nhận lượt chạy của tác nhân.
  Các lệnh, tệp đính kèm, giá trị ghi đè theo lượt, hoạt động gửi đang chờ, gợi ý hủy trước đó,
  phiên do plugin sở hữu và các lượt có hook thực thi vẫn sử dụng
  những đường dẫn tiếp nhận chuyên biệt.
  Nếu hook `before_agent_reply` được cài đặt, quá trình tiếp nhận cũng ghi lại giai đoạn của hook.
  Hoạt động khôi phục không bao giờ phát lại một hook bị gián đoạn giữa lần gọi. Sau khi một hook chưa xử lý
  hoàn tất, điểm kiểm tra của hook sẽ ghi lại kết quả đó, nhưng hoạt động khôi phục vẫn từ chối an toàn
  khi hook đó còn hoạt động: điểm kiểm tra không thể chứng minh rằng cùng
  mã và cấu hình plugin đã được tải sau khi khởi động lại. Kết quả văn bản đã xử lý và
  kết quả im lặng được ghi điểm kiểm tra riêng để hoàn tất theo cách xác định.
  Các xác nhận quyền khôi phục bền vững do phiên bản cũ hơn ghi không có dấu hiệu
  quyền sở hữu nguồn, vì vậy chúng cũng chịu cùng bước kiểm tra hook từ chối an toàn trong quá trình nâng cấp.
- **Khi tắt:** trong lúc chờ hoàn tất để khởi động lại, mọi phiên có lượt chạy đang hoạt động
  đều được gắn dấu khôi phục trong kho phiên trước khi lượt chạy
  bị hủy.
- **Khi khởi động:** Gateway quét các kho phiên để tìm những phiên vẫn
  khai báo là đang chạy nhưng không có chủ sở hữu đang hoạt động trong tiến trình mới. Cơ chế này phát hiện
  các sự cố nghiêm trọng và lần kết thúc tiến trình mà không có mã tắt nào được chạy. Các tệp khóa
  bản ghi hội thoại đã cũ cũng được dọn dẹp cùng lúc.

## Tự động tiếp tục

Vài giây sau khi khởi động, Gateway điều phối lại từng phiên đã đánh dấu
bằng một tin nhắn hệ thống tổng hợp, thông báo cho tác nhân rằng lượt trước đó đã
bị gián đoạn do khởi động lại và yêu cầu tiếp tục từ bản ghi hội thoại hiện có. Nếu
phản hồi cuối cùng đã được tạo nhưng chưa gửi, nội dung phản hồi sẽ được đưa vào
để tác nhân có thể gửi thay vì thực hiện lại công việc.

Quá trình đối soát khi khởi động thử lại lỗi tạm thời tối đa ba lần với
thời gian chờ tăng theo cấp số nhân. Riêng mỗi chu kỳ phiên chính bị gián đoạn có
ngân sách bền vững gồm ba lần điều phối tự động có tính phí, được duy trì qua
các lần khởi động lại Gateway. OpenClaw tính một lần thử trước khi điều phối, hoàn lại khi
Gateway từ chối rõ ràng yêu cầu trước khi tiếp nhận và giữ nguyên
lần tính phí khi kết quả sau điều phối không chắc chắn để tránh phát lại công việc.
Công việc tiền cảnh đã sở hữu phiên sẽ ngăn hoạt động khôi phục tự động
cho đến khi công việc đó hoàn tất.

Sau khi ngân sách bền vững cạn kiệt, phiên sẽ được đặt bia mộ thay vì
lặp lại vô hạn. Hãy kiểm tra phiên thất bại và dùng `/new` hoặc `/reset` để bắt đầu một
phiên thay thế. `openclaw doctor --fix` có thể sửa cờ hủy đã cũ
xung đột với bia mộ, nhưng không bật lại chu kỳ khôi phục đó.

Mỗi lần thử lại sử dụng lại một mã định danh điều phối bền vững, vì vậy lỗi kết nối
không rõ ràng không thể khởi động cùng một hoạt động khôi phục hai lần. Các lượt Control
UI đã hoàn tất và không thể tiếp tục cũng giữ lại bia mộ lũy đẳng bền vững có giới hạn,
cho phép hộp thư đi đang kết nối lại loại bỏ chúng mà không thực thi lại yêu cầu.

Các phản hồi chỉ dùng công cụ tin nhắn sử dụng một tương quan bền vững thứ hai. Trước khi một lần gửi
kết thúc trong cùng cuộc hội thoại đến được kênh, Gateway ghi lại một ý định
gửi chưa được giải quyết trên đúng phiên và lượt nguồn. Thành công đã xác nhận từ nhà cung cấp
sẽ giải quyết ý định đó thành biên nhận đã gửi bền vững; lỗi đã xác nhận sẽ xóa
ý định đó. Hoạt động khôi phục hoàn tất một biên nhận đã gửi mà không chạy lại công cụ. Nếu sự cố
khiến kết quả từ nhà cung cấp không xác định, hoạt động khôi phục sẽ từ chối an toàn thay vì phát lại
một tác động bên ngoài.

Phản hồi đã gửi cũng được sao chép vào bản ghi hội thoại cùng mã
tin nhắn nguồn. Bản sao kết thúc sử dụng khóa biên nhận riêng biệt, vì vậy lần gửi tiến độ có
cùng khóa lũy đẳng của nhà cung cấp không thể che khuất dấu kết thúc. Các lần gửi
tiến độ và biên nhận từ lượt cũ hơn không thể hoàn tất lượt hiện tại. Chỉ
xác nhận quyền truy nhập kênh bền vững mới có thể khôi phục quyền thực hiện hành động tin nhắn. Một lượt chạy
được tiếp tục giữ nguyên chế độ gửi nguồn và tương quan nguồn ban đầu, bao gồm
danh tính người yêu cầu và mọi giới hạn cùng kênh/luồng, vì vậy cùng biên nhận
vẫn có thẩm quyền ngay cả khi xảy ra lần khởi động lại khác trong quá trình khôi phục. Một
lượt chỉ dùng công cụ tin nhắn mà không thể tái dựng quyền kênh sẽ bị
từ chối an toàn và nhận thông báo gửi lại một lần.

Trước khi tiếp tục, Gateway kiểm tra xem phần cuối bản ghi hội thoại có an toàn để
tiếp tục hay không. Nếu không an toàn (ví dụ: lượt kết thúc ở một phê duyệt đang chờ đã cũ),
phiên sẽ không bị chạy lại một cách thiếu kiểm soát; thay vào đó, tác nhân đăng một thông báo ngắn
yêu cầu người dùng gửi lại yêu cầu gần nhất. Đối với WebChat, thông báo đó được
ghi trực tiếp vào lịch sử phiên để vẫn hiển thị sau khi kết nối lại.

OpenClaw cũng có thể tái dựng công việc [Chế độ Mã](/tools/code-mode)
chỉ đọc bị gián đoạn. Chế độ Mã đánh dấu các lượt chạy này là an toàn khi khởi động lại và từ chối các
công cụ danh mục có tác dụng phụ hoặc không gian tên plugin trước khi chúng thực thi. Nếu lần khởi động lại xảy ra tại
điều khiển `wait`, Gateway mới sẽ tái dựng lượt từ bản ghi hội thoại
và buộc quá trình thực thi được tái dựng tiếp tục an toàn khi khởi động lại ngay cả khi
mô hình bỏ qua hoặc xóa cờ đó. Máy chủ lọc toàn bộ lượt được tái dựng
để chỉ cho phép các công cụ lõi chỉ đọc đã kiểm tra và công cụ plugin được xác định rõ là an toàn khi phát lại,
kể cả khi Chế độ Mã bị tắt sau khi khởi động lại. Công việc có tác dụng phụ
vẫn được bảo vệ bằng thông báo gửi lại thay vì có nguy cơ ghi trùng lặp.

### Tác nhân phụ

Các lượt chạy tác nhân phụ được duy trì trong cơ sở dữ liệu trạng thái SQLite dùng chung, vì vậy
sổ đăng ký tác nhân phụ vẫn tồn tại qua tiến trình. Khi khởi động, sổ đăng ký được khôi phục và
các phiên tác nhân phụ bị gián đoạn được tiếp tục với ngữ cảnh tác vụ ban đầu.
Có hai cơ chế an toàn:

- Các lượt chạy bị gián đoạn hơn 2 giờ trước sẽ được hoàn tất thay vì tiếp tục, để
  một Gateway ngừng hoạt động qua đêm không khôi phục công việc đã cũ.
- Một phiên liên tục không thể khôi phục sẽ được đặt bia mộ là bị kẹt để
  hoạt động khôi phục không thể lặp lại vô hạn.

### Tác vụ nền

[Sổ đăng ký tác vụ nền](/vi/automation/tasks) được hỗ trợ bởi SQLite và
được đối soát khi khởi động cũng như theo khoảng thời gian định kỳ: các kết quả bền vững do
lượt chạy đã hoàn tất ghi lại sẽ được khôi phục, còn những lượt chạy có tiến trình sở hữu đã biến mất
sẽ được đánh dấu là bị mất sau một khoảng ân hạn thay vì treo vô hạn.

### Khởi động lại do tác nhân yêu cầu

Khi chính tác nhân kích hoạt khởi động lại (áp dụng thay đổi cấu hình, cập nhật
Gateway hoặc yêu cầu khởi động lại rõ ràng), một dấu hiệu khởi động lại được ghi vào
SQLite trước khi tiến trình thoát. Sau khi khởi động, Gateway đăng kết quả trở lại
cuộc trò chuyện ban đầu và điều phối một lượt tiếp tục duy nhất để
tác nhân tiếp tục chính xác từ nơi đã dừng, trên cùng kênh và luồng.

Các cột SQLite có kiểu của dấu hiệu là nguồn có thẩm quyền cho việc xử lý khởi động lại;
giá trị `payload_json` chỉ là bản sao phục vụ phát lại/gỡ lỗi. Môi trường chạy đọc, ghi
và xóa trạng thái SQLite mà không dùng phương án dự phòng bằng tệp. Trong quá trình chuyển đổi lưu trữ, một
quá trình di chuyển trạng thái có giới hạn sẽ chạy khi khởi động và thông qua Doctor để bảo toàn
`restart-sentinel.json` đã được xác thực do tiến trình cũ để lại sau một lần cập nhật.
Quá trình di chuyển xác minh hàng có kiểu và xóa tệp nguồn trước khi quá trình
xử lý khởi động lại thông thường tiếp tục.

## Cơ chế an toàn và khả năng quan sát

- **Bộ ngắt vòng lặp sự cố:** 3 lần khởi động không sạch trong vòng 5 phút sẽ kích hoạt bộ ngắt
  nhằm ngăn các dịch vụ phụ tự động khởi động trong lần khởi động tiếp theo, để Gateway gặp sự cố
  không tự khuếch đại vấn đề. Bộ ngắt phục hồi sau khi khoảng thời gian khởi động không sạch kết thúc.
- **Ngân sách lần thử của phiên chính:** ba lần điều phối tự động có tính phí
  cho mỗi chu kỳ bị gián đoạn; khi cạn kiệt, phiên đó sẽ được đặt bia mộ cho đến khi
  được kiểm tra và thay thế.
- **Chỉ số:** hoạt động khôi phục được xuất qua
  [Prometheus](/vi/gateway/prometheus) dưới dạng `openclaw_session_recovery_total` và
  `openclaw_session_recovery_age_seconds`.
- **Nhật ký:** các quyết định khôi phục được ghi nhật ký trong các
  hệ thống con `main-session-restart-recovery` và `subagent-interrupted-resume`.

## Những gì không được tiếp tục

- Các phiên bị loại khỏi hoạt động khôi phục phiên chính vì đã có chủ sở hữu khác
  xử lý chúng: phiên tác nhân phụ (khôi phục tác nhân phụ), phiên Cron (trình
  lập lịch chạy lại theo lịch) và phiên do ACP quản lý (IDE hoặc máy khách
  được kết nối sở hữu việc tiếp tục).
- Các phiên có phần cuối bản ghi hội thoại không thể tiếp tục an toàn; những phiên này nhận
  thông báo gửi lại được mô tả ở trên thay vì âm thầm chạy lại.
- Công việc chưa từng được tiếp nhận: các tin nhắn đến trong thời gian chờ hoàn tất sẽ
  bị từ chối với lỗi khởi động lại rõ ràng thay vì âm thầm xếp hàng vào một
  tiến trình sắp kết thúc.
- Các lượt nhúng độc lập không thể tiếp quản một phiên chính đang chờ
  khôi phục sau khởi động lại vì chúng không dùng chung chủ sở hữu vòng đời của Gateway.
  Hãy chạy lượt qua Gateway hoặc đặt lại lượt tại đó bằng `/new` hoặc `/reset`.
