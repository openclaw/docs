---
read_when:
    - Tìm hiểu kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục mục niêm yết bị giữ lại, bị ẩn hoặc bị chặn
summary: Hành vi tin cậy, quét, báo cáo và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các mục niêm yết công khai vẫn đi qua các biện pháp kiểm soát về độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tế: giúp người dùng
kiểm tra những gì họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có cảnh báo sai,
và giữ các gói lạm dụng khỏi khả năng được phát hiện công khai.

Xem thêm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage).

## Những gì người dùng có thể kiểm tra

Trước khi cài đặt một skill hoặc Plugin, hãy kiểm tra mục niêm yết ClawHub của nó để biết:

- chủ sở hữu và thông tin ghi nhận nguồn
- phiên bản mới nhất và changelog
- các biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho Plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và phần chẩn đoán
chỉ chủ sở hữu nhìn thấy.

Các kết quả phổ biến bao gồm:

- `clean`: không tìm thấy vấn đề chặn nào.
- `suspicious`: bản phát hành cần được thận trọng hoặc xem xét.
- `malicious`: bản phát hành được xem là không an toàn.
- `pending`: các bước kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau theo từng bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc kiểm duyệt khôi phục bản phát hành đó.

## Skills

Các bản quét skill xem xét gói skill đã xuất bản, siêu dữ liệu, các yêu cầu đã khai báo
và các chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một skill khai báo và
những gì nó có vẻ thực hiện. Ví dụ: một skill tham chiếu đến khóa API bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Các phát hiện quét dựa trên artifact. Hành vi provider được kỳ vọng, chẳng hạn như thông tin đăng nhập
API đã khai báo, callback OAuth localhost, dọn dẹp gỡ cài đặt theo phạm vi, mã hóa Basic Auth,
hoặc tải tệp do người dùng chọn lên provider đã nêu, được xử lý
khác với việc chuyển tiếp thông tin đăng nhập ẩn, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan, hoặc lạm dụng trình duyệt lén lút.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugins

Các bản phát hành Plugin bao gồm siêu dữ liệu gói, thông tin ghi nhận nguồn, các trường
tương thích và thông tin toàn vẹn artifact.

OpenClaw kiểm tra tính tương thích trước khi cài đặt các Plugin do ClawHub lưu trữ. Bản ghi gói
cũng có thể hiển thị siêu dữ liệu digest để OpenClaw có thể xác minh các
artifact đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config của gói đã khai báo `openclaw.environment`
khi xem xét các bản phát hành Plugin, để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin đăng nhập hoặc quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage)

## Ghi chú ClawScan của nhà xuất bản

Nhà xuất bản có thể cung cấp ghi chú ClawScan tùy chọn khi xuất bản một skill hoặc
Plugin. Ghi chú này cung cấp cho ClawScan ngữ cảnh về hành vi có thể trông
bất thường, chẳng hạn như truy cập mạng, truy cập host gốc, hoặc thông tin đăng nhập
theo provider cụ thể.

## Giữ lại để kiểm duyệt

Khi trình quét tĩnh gắn cờ một skill đã tải lên là độc hại, nhà xuất bản sẽ
tự động bị đặt dưới trạng thái giữ lại để kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Điều này ẩn tất cả Skills của nhà xuất bản, khiến các lần xuất bản sau
bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng tệp/dòng cho người kiểm duyệt,
nhưng tự chúng không ẩn nội dung hoặc quyết định phán quyết quét công khai.
Các bản tải lên mới vẫn ở trạng thái xem xét/đang chờ cho đến khi đánh giá LLM ổn định. Quét tĩnh
chỉ chặn ngay lập tức đối với chữ ký độc hại. Các lượt phát hiện từ engine VirusTotal
vẫn là bằng chứng bảo mật hiển thị, nhưng các phán quyết VirusTotal Code Insight/Palm
mang tính tư vấn và tự chúng không ẩn Skills. Đánh giá LLM của ClawScan
giữ các ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện xem xét mức trung bình vẫn hiển thị trên
artifact, trong khi bộ lọc đáng ngờ được dành cho các mối lo ngại LLM có tác động cao,
phát hiện độc hại, hoặc phát hiện AV-engine được củng cố.

Admin có thể gỡ bỏ trạng thái giữ lại do cảnh báo sai:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
Skills bị ẩn do trạng thái giữ lại cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Skills bị ẩn vì lý do khác, hoặc có bản quét tĩnh riêng vẫn
độc hại, sẽ vẫn bị ẩn.

## Cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung, hoặc xóa
mục niêm yết.

Các tài khoản đã xóa, bị cấm, hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản. Nếu đăng nhập hoặc truy cập CLI thông thường bị chặn, hãy liên hệ
security@openclaw.ai để được xem xét khôi phục.

## Hướng dẫn cho nhà xuất bản

Để giảm cảnh báo sai và cải thiện niềm tin của người dùng:

- giữ cho tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- thêm ghi chú ClawScan của nhà xuất bản khi một bản phát hành có hành vi bất thường nhưng có chủ ý
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản Plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của gói
