---
read_when:
    - Tìm hiểu kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục sau khi mục niêm yết bị tạm giữ, ẩn hoặc chặn
summary: Hành vi về độ tin cậy, quét, báo cáo và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các danh sách công khai vẫn phải đi qua các kiểm soát về độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tế: giúp người dùng
kiểm tra những gì họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có cảnh báo dương tính giả,
và ngăn các gói lạm dụng xuất hiện trong khả năng khám phá công khai.

Xem thêm [Mức sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Người dùng có thể kiểm tra gì

Trước khi cài đặt một Skills hoặc Plugin, hãy kiểm tra danh sách ClawHub của nó để biết:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và changelog
- các biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho Plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và chẩn đoán
chỉ chủ sở hữu nhìn thấy.

Các kết quả phổ biến gồm:

- `clean`: không tìm thấy vấn đề chặn nào.
- `suspicious`: bản phát hành cần thận trọng hoặc được rà soát.
- `malicious`: bản phát hành được xem là không an toàn.
- `pending`: các kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau tùy bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc bên kiểm duyệt khôi phục bản phát hành đó.

## Skills

Quá trình quét Skills xem xét gói Skills đã xuất bản, siêu dữ liệu, các yêu cầu
đã khai báo và các chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một Skills khai báo và
những gì nó có vẻ thực hiện. Ví dụ, một Skills tham chiếu đến một API key bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Các phát hiện quét dựa trên artifact. Hành vi nhà cung cấp được mong đợi, chẳng hạn như thông tin xác thực
API đã khai báo, callback OAuth localhost, dọn dẹp gỡ cài đặt theo phạm vi, mã hóa Basic Auth,
hoặc tệp do người dùng chọn tải lên nhà cung cấp đã nêu, được xử lý
khác với việc chuyển tiếp thông tin xác thực ẩn, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan, hoặc lạm dụng trình duyệt một cách lén lút.

Xem [Định dạng Skills](/vi/clawhub/skill-format).

## Plugin

Các bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, trường tương thích
và thông tin toàn vẹn artifact.

OpenClaw kiểm tra tính tương thích trước khi cài đặt Plugin được lưu trữ trên ClawHub. Bản ghi gói
cũng có thể công khai siêu dữ liệu digest để OpenClaw có thể xác minh các artifact
đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo
khi rà soát các bản phát hành Plugin để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký ác ý hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Mức sử dụng được chấp nhận](/vi/clawhub/acceptable-usage)

## Ghi chú ClawScan của nhà xuất bản

Nhà xuất bản có thể cung cấp một ghi chú ClawScan tùy chọn khi xuất bản Skills hoặc
Plugin. Ghi chú này cung cấp ngữ cảnh cho ClawScan về hành vi có thể trông
bất thường, chẳng hạn như truy cập mạng, truy cập máy chủ native, hoặc thông tin xác thực
riêng của nhà cung cấp.

## Giữ lại để kiểm duyệt

Khi trình quét tĩnh gắn cờ một Skills đã tải lên là độc hại, nhà xuất bản sẽ
tự động bị đặt vào trạng thái giữ để kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Điều này ẩn tất cả Skills của nhà xuất bản, khiến các lần xuất bản sau
bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng tệp/dòng cho điều phối viên kiểm duyệt,
nhưng chúng không tự ẩn nội dung hoặc quyết định kết luận quét công khai.
Các lượt tải lên mới vẫn ở trạng thái rà soát/đang chờ cho đến khi quá trình rà soát LLM kết thúc. Quét tĩnh
chỉ chặn ngay lập tức đối với các chữ ký độc hại. Các lần khớp engine VirusTotal
vẫn là bằng chứng bảo mật hiển thị, nhưng kết luận VirusTotal Code Insight/Palm
chỉ mang tính tư vấn và không tự ẩn Skills. Các rà soát LLM của ClawScan
giữ lại ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện rà soát mức trung bình vẫn hiển thị trên
artifact, trong khi bộ lọc đáng ngờ được dành cho các mối lo LLM có tác động cao,
phát hiện độc hại, hoặc phát hiện được các engine AV xác nhận.

Quản trị viên có thể gỡ trạng thái giữ do dương tính giả:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
Skills bị ẩn do trạng thái giữ ở cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Skills bị ẩn vì lý do khác, hoặc có kết quả quét tĩnh riêng vẫn
độc hại, sẽ tiếp tục bị ẩn.

## Cấm và tình trạng tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung, hoặc gỡ bỏ
danh sách.

Các tài khoản đã bị xóa, bị cấm, hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau một hành động đối với tài khoản, hãy đăng nhập vào UI web để xem lại
trạng thái tài khoản. Nếu đăng nhập hoặc truy cập CLI bình thường bị chặn, hãy liên hệ
security@openclaw.ai để được xem xét khôi phục.

## Hướng dẫn cho nhà xuất bản

Để giảm cảnh báo dương tính giả và cải thiện độ tin cậy của người dùng:

- giữ cho tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- thêm ghi chú ClawScan của nhà xuất bản khi một bản phát hành có hành vi bất thường nhưng có chủ ý
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- sử dụng chạy thử trước khi xuất bản Plugin
- phản hồi rõ ràng nếu người dùng hoặc điều phối viên kiểm duyệt hỏi về hành vi của gói
