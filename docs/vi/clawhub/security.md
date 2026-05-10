---
read_when:
    - Tìm hiểu về kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục từ một mục niêm yết bị giữ, bị ẩn hoặc bị chặn
summary: Cơ chế tin cậy, quét, báo cáo, kháng nghị và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các mục niêm yết công khai vẫn đi qua các biện pháp kiểm soát về độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tế: giúp người dùng
kiểm tra những gì họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có kết quả dương tính giả,
và ngăn các gói lạm dụng xuất hiện trong khám phá công khai.

Xem thêm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage).

## Những gì người dùng có thể kiểm tra

Trước khi cài đặt một Skills hoặc Plugin, hãy kiểm tra mục niêm yết ClawHub của nó để biết:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và nhật ký thay đổi
- các biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho Plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và phần chẩn đoán
hiển thị cho chủ sở hữu.

Các kết quả phổ biến bao gồm:

- `clean`: không tìm thấy vấn đề chặn nào.
- `suspicious`: bản phát hành cần thận trọng hoặc xem xét.
- `malicious`: bản phát hành được xem là không an toàn.
- `pending`: các kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  có sẵn trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau theo bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc việc kiểm duyệt khôi phục bản đó.

## Skills

Hoạt động quét Skills xem xét gói Skills đã xuất bản, siêu dữ liệu, các yêu cầu đã khai báo
và các chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một Skills khai báo và
những gì có vẻ như nó thực hiện. Ví dụ, một Skills tham chiếu đến khóa API bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Các phát hiện quét dựa trên hiện vật. Hành vi nhà cung cấp được kỳ vọng, chẳng hạn như thông tin xác thực
API đã khai báo, lệnh gọi lại OAuth localhost, dọn dẹp gỡ cài đặt có phạm vi, mã hóa Basic Auth,
hoặc tải tệp do người dùng chọn lên nhà cung cấp đã nêu, được xử lý
khác với việc bí mật chuyển tiếp thông tin xác thực, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan, hoặc lạm dụng trình duyệt lén lút.

Xem [Định dạng Skills](/vi/clawhub/skill-format).

## Plugin

Các bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, các trường tương thích
và thông tin toàn vẹn hiện vật.

OpenClaw kiểm tra tính tương thích trước khi cài đặt các Plugin lưu trữ trên ClawHub. Bản ghi gói
cũng có thể hiển thị siêu dữ liệu digest để OpenClaw có thể xác minh các hiện vật
đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo
khi xem xét các bản phát hành Plugin để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- chỉ dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage)

## Báo cáo thiếu thiện chí hoặc nhãn hiệu

ClawHub sử dụng cùng một quy trình báo cáo và kiểm duyệt của nhân viên cho các đăng ký thiếu thiện chí,
mạo danh và tranh chấp liên quan đến nhãn hiệu. Các báo cáo này cần
đủ ngữ cảnh để nhân viên xác định bên khiếu nại, mục niêm yết đang tranh chấp và
hành động được yêu cầu.

Bao gồm:

- URL Skills hoặc gói ClawHub chính tắc và tên chủ sở hữu
- nhãn hiệu, dự án, công ty hoặc tên sản phẩm đang có vấn đề
- bằng chứng công khai về quyền sở hữu hoặc thẩm quyền của bên khiếu nại
- lý do chủ sở hữu hiện tại không được phép xuất bản dưới tên đó
- hành động được yêu cầu, chẳng hạn như ẩn trong khi chờ xem xét, chuyển quyền sở hữu, đổi tên,
  hoặc gỡ bỏ

Không đưa bí mật riêng tư hoặc tài liệu pháp lý nhạy cảm vào báo cáo công khai. Mở
một issue GitHub với bằng chứng không nhạy cảm và yêu cầu maintainers cung cấp lộ trình
bàn giao riêng tư khi cần.

## Kháng nghị và quét lại

Chủ sở hữu có thể yêu cầu quét lại khi họ cho rằng một Skills hoặc gói đã bị
giữ lại hoặc gắn cờ không chính xác. Người kiểm duyệt và quản trị viên nền tảng có thể yêu cầu quét lại cho bất kỳ
Skills hoặc gói nào trong khi xử lý báo cáo hoặc yêu cầu hỗ trợ:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Đối với nội dung đã được kiểm duyệt, chủ sở hữu có thể gửi kháng nghị từ các bề mặt
ClawHub hiển thị cho chủ sở hữu. Kháng nghị nên giải thích điều gì đã thay đổi hoặc vì sao
cờ đó không chính xác.

## Giữ kiểm duyệt

Khi trình quét tĩnh gắn cờ một Skills đã tải lên là độc hại, nhà xuất bản
tự động bị đặt vào trạng thái giữ kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Điều này ẩn tất cả Skills của nhà xuất bản, khiến các lần xuất bản trong tương lai
bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng tệp/dòng cho người kiểm duyệt,
nhưng tự chúng không ẩn nội dung hoặc quyết định kết luận quét công khai.
Các bản tải lên mới vẫn ở trạng thái xem xét/đang chờ cho đến khi các đánh giá VirusTotal và LLM
hoàn tất; quét tĩnh chỉ chặn ngay lập tức đối với chữ ký độc hại.
Các đánh giá LLM của ClawScan giữ lại ghi chú phù hợp với mục đích làm hướng dẫn; chúng chỉ trả về
kết luận Review/suspicious khi đánh giá có cấu trúc bao gồm một mối quan ngại trọng yếu.

Quản trị viên có thể gỡ bỏ trạng thái giữ do dương tính giả:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
Skills bị ẩn bởi trạng thái giữ ở cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Skills bị ẩn vì các lý do khác, hoặc có kết quả quét tĩnh riêng vẫn
độc hại, sẽ tiếp tục bị ẩn.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc gỡ bỏ
mục niêm yết.

Các tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem xét trạng thái
tài khoản hoặc liên hệ maintainers qua kênh hỗ trợ dự án dự kiến.

## Hướng dẫn cho nhà xuất bản

Để giảm kết quả dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và nhật ký thay đổi chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản Plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của gói
