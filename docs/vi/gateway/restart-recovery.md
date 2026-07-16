---
read_when:
    - Bạn muốn biết liệu việc khởi động lại Gateway có làm mất công việc đang được agent thực hiện hay không
    - Một lượt chạy tác tử đã bị gián đoạn do khởi động lại, sự cố hoặc tải lại cấu hình
    - Bạn đang gỡ lỗi quá trình tự động khôi phục phiên sau khi Gateway hoạt động trở lại
summary: 'Những gì vẫn tiếp tục sau khi Gateway khởi động lại hoặc gặp sự cố: các lượt agent bị gián đoạn tự động tiếp tục, các agent con và tác vụ nền được khôi phục, các lượt gửi đang xếp hàng được xử lý hết'
title: Khôi phục sau khi khởi động lại
x-i18n:
    generated_at: "2026-07-16T15:18:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Việc khởi động lại Gateway không làm mất trạng thái của tác nhân. Các cuộc hội thoại, bản chép lại,
tác vụ đã lên lịch, bản ghi tác vụ nền và tin nhắn gửi đi đang xếp hàng đều được lưu
trên đĩa; công việc bị gián đoạn giữa lượt sẽ được phát hiện và tiếp tục
tự động sau khi Gateway hoạt động trở lại. Không cần can thiệp thủ công
và cũng không cần cấu hình gì: tính năng khôi phục luôn được bật.

Trang này mô tả những gì được duy trì sau khi khởi động lại, cách phát hiện công việc bị gián đoạn
và quá trình tự động tiếp tục diễn ra như thế nào.

## Những gì được duy trì sau khi khởi động lại

| Trạng thái                     | Nơi lưu trữ                                  | Hành vi qua lần khởi động lại                                           |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Lịch sử hội thoại             | Cơ sở dữ liệu SQLite cho từng tác nhân      | Không thay đổi; phiên tiếp tục từ bản chép lại đã lưu                    |
| Lượt phiên chính bị gián đoạn | Hàng phiên và bản chép lại SQLite cho từng tác nhân | Tự động tiếp tục hoặc đối soát vài giây sau khi khởi động         |
| Lượt chạy tác nhân con        | SQLite (cơ sở dữ liệu trạng thái dùng chung) | Sổ đăng ký được khôi phục khi khởi động; lượt chạy bị gián đoạn được tiếp tục |
| Tác vụ nền                    | SQLite (cơ sở dữ liệu trạng thái dùng chung) | Được đối soát khi khởi động; lượt chạy mồ côi được khôi phục hoặc đánh dấu là thất lạc |
| Lượt gửi đi đang xếp hàng     | Hàng đợi gửi SQLite                         | Được xử lý sau khi khởi động lại; các phản hồi chưa gửi được sẽ được thử lại |
| Tác vụ đã lên lịch (Cron)     | Kho Cron SQLite                             | Lịch được duy trì; bộ lập lịch được kích hoạt lại khi khởi động          |
| Tiếp tục sau khi khởi động lại | Dấu hiệu khởi động lại SQLite              | Một lượt theo dõi dùng một lần được gửi đến phiên đã yêu cầu khởi động lại |

## Khởi động lại có kiểm soát sẽ chờ hoàn tất trước

Một yêu cầu khởi động lại (`openclaw gateway restart`, thay đổi cấu hình yêu cầu
khởi động lại hoặc cập nhật Gateway) không chấm dứt ngay công việc đang diễn ra. Gateway
ngừng tiếp nhận công việc mới, sau đó chờ các lượt tác nhân và
tác vụ nền đang hoạt động hoàn tất trong giới hạn thời gian chờ (mặc định là 5 phút). Vì vậy, hầu hết
các lần khởi động lại hoàn toàn không làm gián đoạn công việc.

Chỉ công việc không thể hoàn tất trong giới hạn thời gian chờ (hoặc lượt chạy bị gián đoạn
do khởi động lại cưỡng bức hay sự cố) mới bị hủy — và trước khi điều đó xảy ra, mỗi
phiên bị ảnh hưởng đều được đánh dấu để khôi phục.

## Cách phát hiện công việc bị gián đoạn

Ba cơ chế bổ trợ nhau đánh dấu các phiên có lượt chưa hoàn tất:

- **Khi tiếp nhận lượt:** đối với một lượt văn bản thông thường trong phiên chính hiện có,
  Gateway thêm tin nhắn của người dùng, đánh dấu phiên đang chạy và ghi lại
  yêu cầu quyền gửi để khôi phục của phiên trong một giao dịch SQLite trước khi thực thi mô hình hoặc hook
  `before_agent_reply`. Control UI thực hiện việc này trước khi trả về xác nhận
  `started`; quy trình điều phối kênh thực hiện khi lượt đã chuẩn bị
  tiếp nhận lượt chạy tác nhân.
  Các lệnh, tệp đính kèm, giá trị ghi đè theo lượt, lượt gửi đang chờ, gợi ý hủy
  trước đó, phiên do Plugin sở hữu và lượt có hook thực thi vẫn sử dụng
  các đường dẫn tiếp nhận chuyên biệt.
  Nếu đã cài đặt hook `before_agent_reply`, quá trình tiếp nhận cũng ghi lại giai đoạn của hook.
  Quá trình khôi phục không bao giờ phát lại hook bị gián đoạn giữa lúc gọi. Sau khi một hook chưa được xử lý
  hoàn tất, điểm kiểm tra của hook ghi lại kết quả đó, nhưng quá trình khôi phục vẫn từ chối tiếp tục
  khi hook đó còn hoạt động: điểm kiểm tra không thể chứng minh rằng cùng
  mã và cấu hình Plugin đã được tải sau khi khởi động lại. Kết quả văn bản đã xử lý và
  kết quả im lặng được ghi điểm kiểm tra riêng để hoàn tất một cách tất định.
  Các yêu cầu khôi phục bền vững do phiên bản cũ hơn ghi không có dấu hiệu
  quyền sở hữu nguồn, nên cũng chịu cùng bước kiểm tra hook theo nguyên tắc từ chối tiếp tục khi nâng cấp.
- **Khi tắt:** trong lúc chờ hoàn tất trước khi khởi động lại, mọi phiên có lượt chạy đang hoạt động
  đều được đóng dấu bằng dấu hiệu khôi phục trong kho phiên trước khi lượt chạy
  bị hủy.
- **Khi khởi động:** Gateway quét các kho phiên để tìm những phiên vẫn
  tự nhận là đang chạy nhưng không có tiến trình mới nào đang sở hữu trực tiếp. Cơ chế này phát hiện
  các sự cố nghiêm trọng và trường hợp bị chấm dứt mà không có mã tắt nào được chạy. Các tệp khóa bản chép lại
  cũ cũng được dọn dẹp cùng lúc.

## Tự động tiếp tục

Vài giây sau khi khởi động, Gateway điều phối lại từng phiên đã đánh dấu
bằng một tin nhắn hệ thống tổng hợp, cho tác nhân biết lượt trước đó đã
bị gián đoạn do khởi động lại và yêu cầu tiếp tục từ bản chép lại hiện có. Nếu
phản hồi cuối cùng đã được tạo nhưng chưa được gửi, nội dung phản hồi sẽ được đưa vào
để tác nhân có thể gửi thay vì thực hiện lại công việc. Quá trình khôi phục thử lại tối đa
3 lần với thời gian chờ tăng theo cấp số nhân. Mỗi lần thử lại đều tái sử dụng một mã định danh điều phối
bền vững, do đó lỗi kết nối không rõ kết quả không thể khởi chạy cùng một quá trình khôi phục
hai lần. Các lượt Control UI đã hoàn tất và không thể tiếp tục cũng giữ lại các
bia mộ lũy đẳng bền vững có giới hạn, cho phép hộp thư đi đang kết nối lại loại bỏ chúng mà không
thực thi lại yêu cầu.

Các phản hồi chỉ dùng công cụ nhắn tin sử dụng một mối tương quan bền vững thứ hai. Trước khi một lượt gửi cuối
trong cùng cuộc hội thoại đến được kênh, Gateway ghi lại một ý định
gửi chưa được giải quyết trên đúng phiên và lượt nguồn. Thành công đã xác nhận từ nhà cung cấp
sẽ phân giải ý định đó thành biên nhận đã gửi bền vững; lỗi đã xác nhận sẽ xóa
ý định đó. Quá trình khôi phục hoàn tất một biên nhận đã gửi mà không chạy lại công cụ. Nếu sự cố
khiến kết quả từ nhà cung cấp không xác định, quá trình khôi phục sẽ từ chối tiếp tục thay vì phát lại
một hiệu ứng bên ngoài.

Phản hồi đã gửi cũng được phản chiếu vào bản chép lại cùng với mã tin nhắn
nguồn. Các bản phản chiếu cuối sử dụng khóa biên nhận riêng biệt, vì vậy một lượt gửi tiến độ có
cùng khóa lũy đẳng của nhà cung cấp không thể che khuất dấu hiệu cuối. Các lượt gửi
tiến độ và biên nhận từ lượt cũ hơn không thể hoàn tất lượt hiện tại. Chỉ
các yêu cầu tiếp nhận kênh bền vững mới có thể khôi phục quyền thực hiện hành động tin nhắn. Lượt chạy được tiếp tục
giữ nguyên chế độ gửi nguồn và mối tương quan nguồn ban đầu, bao gồm
danh tính người yêu cầu và mọi giới hạn cùng kênh/luồng, vì vậy cùng một biên nhận
vẫn có thẩm quyền ngay cả khi xảy ra lần khởi động lại khác trong quá trình khôi phục. Một
lượt chỉ dùng công cụ nhắn tin nhưng không thể tái dựng quyền kênh sẽ bị
từ chối tiếp tục và nhận thông báo gửi lại dùng một lần.

Trước khi tiếp tục, Gateway kiểm tra xem phần cuối của bản chép lại có an toàn để
tiếp tục hay không. Nếu không an toàn (ví dụ: lượt kết thúc tại một yêu cầu phê duyệt đang chờ đã lỗi thời),
phiên sẽ không bị chạy lại một cách mù quáng; thay vào đó, tác nhân đăng một thông báo ngắn
yêu cầu người dùng gửi lại yêu cầu cuối cùng. Đối với WebChat, thông báo đó được
ghi trực tiếp vào lịch sử phiên để vẫn hiển thị sau khi kết nối lại.

OpenClaw cũng có thể tái dựng công việc [Chế độ mã](/vi/reference/code-mode)
chỉ đọc bị gián đoạn. Chế độ mã đánh dấu các lượt chạy này là an toàn khi khởi động lại và từ chối các
công cụ danh mục gây hiệu ứng phụ hoặc không gian tên Plugin trước khi chúng thực thi. Nếu lần khởi động lại xảy ra tại
điều khiển `wait`, Gateway mới sẽ tái dựng lượt từ bản chép lại
và buộc quá trình thực thi được tái dựng tiếp tục an toàn khi khởi động lại ngay cả khi
mô hình bỏ qua hoặc xóa cờ đó. Máy chủ lọc toàn bộ lượt được tái dựng
để chỉ cho phép các công cụ lõi chỉ đọc đã được kiểm tra và các công cụ Plugin được xác định rõ là an toàn để phát lại,
kể cả khi Chế độ mã bị tắt sau khi khởi động lại. Công việc gây hiệu ứng phụ
vẫn được bảo vệ bằng thông báo gửi lại thay vì mạo hiểm tạo thao tác ghi trùng lặp.

### Tác nhân con

Các lượt chạy tác nhân con được duy trì trong cơ sở dữ liệu trạng thái SQLite dùng chung, vì vậy
sổ đăng ký tác nhân con tồn tại qua tiến trình. Khi khởi động, sổ đăng ký được khôi phục và
các phiên tác nhân con bị gián đoạn được tiếp tục với ngữ cảnh tác vụ ban đầu.
Có hai cơ chế an toàn:

- Các lượt chạy bị gián đoạn từ hơn 2 giờ trước sẽ được hoàn tất thay vì tiếp tục, để
  một Gateway ngừng hoạt động qua đêm không làm sống lại công việc cũ.
- Phiên liên tục không thể khôi phục sẽ được tạo bia mộ với trạng thái mắc kẹt để
  quá trình khôi phục không thể lặp vô hạn.

### Tác vụ nền

[Sổ đăng ký tác vụ nền](/vi/automation/tasks) sử dụng SQLite và
được đối soát khi khởi động cũng như theo định kỳ: các kết quả bền vững do
lượt chạy đã hoàn tất ghi lại sẽ được khôi phục, còn các lượt chạy có tiến trình sở hữu đã biến mất sẽ
được đánh dấu là thất lạc sau một khoảng gia hạn thay vì treo mãi mãi.

### Khởi động lại do tác nhân yêu cầu

Khi chính tác nhân kích hoạt khởi động lại (áp dụng thay đổi cấu hình, cập nhật
Gateway hoặc yêu cầu khởi động lại rõ ràng), một dấu hiệu khởi động lại được ghi vào
SQLite trước khi tiến trình thoát. Sau khi khởi động, Gateway đăng kết quả trở lại
cuộc trò chuyện ban đầu và điều phối một lượt tiếp tục dùng một lần để
tác nhân tiếp tục chính xác từ nơi đã dừng, trên cùng kênh và luồng.

## Cơ chế an toàn và khả năng quan sát

- **Bộ ngắt vòng lặp sự cố:** 3 lần khởi động không sạch trong vòng 5 phút sẽ kích hoạt bộ ngắt,
  ngăn tự động khởi động các dịch vụ phụ ở lần khởi động tiếp theo, để một Gateway đang gặp sự cố
  không tự khuếch đại sự cố. Hệ thống phục hồi sau khi cửa sổ khởi động không sạch hết hiệu lực.
- **Số liệu:** hoạt động khôi phục được xuất qua
  [Prometheus](/vi/gateway/prometheus) dưới dạng `openclaw_session_recovery_total` và
  `openclaw_session_recovery_age_seconds`.
- **Nhật ký:** các quyết định khôi phục được ghi nhật ký trong
  các hệ thống con `main-session-restart-recovery` và `subagent-interrupted-resume`.

## Những gì không được tiếp tục

- Các phiên bị loại khỏi quá trình khôi phục phiên chính vì một chủ thể khác đã
  xử lý chúng: phiên tác nhân con (khôi phục tác nhân con), phiên Cron (bộ
  lập lịch chạy lại theo lịch) và phiên do ACP quản lý (IDE hoặc
  máy khách đang kết nối sở hữu việc tiếp tục).
- Các phiên có phần cuối bản chép lại không thể tiếp tục an toàn; các phiên này nhận
  thông báo gửi lại được mô tả ở trên thay vì được âm thầm chạy lại.
- Công việc chưa từng được tiếp nhận: các tin nhắn đến trong khoảng thời gian chờ hoàn tất
  sẽ bị từ chối với lỗi khởi động lại rõ ràng thay vì bị âm thầm xếp hàng vào một
  tiến trình đang dừng.
