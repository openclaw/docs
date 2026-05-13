---
read_when:
    - Tìm hiểu về kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục một mục niêm yết bị giữ lại, bị ẩn hoặc bị chặn
summary: Hành vi về độ tin cậy, quét, báo cáo và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các danh sách công khai vẫn đi qua các biện pháp kiểm soát về độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tiễn: giúp người dùng
kiểm tra nội dung họ cài đặt, cho nhà xuất bản một lộ trình khắc phục khi có cảnh báo dương tính giả,
và ngăn các gói lạm dụng khỏi khả năng được khám phá công khai.

Xem thêm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Người dùng có thể kiểm tra gì

Trước khi cài đặt một kỹ năng hoặc plugin, hãy kiểm tra danh sách ClawHub của nó để biết:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và nhật ký thay đổi
- biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và chẩn đoán
chỉ chủ sở hữu xem được.

Các kết quả phổ biến bao gồm:

- `clean`: không tìm thấy vấn đề chặn.
- `suspicious`: bản phát hành cần được thận trọng hoặc xem xét.
- `malicious`: bản phát hành được coi là không an toàn.
- `pending`: các bước kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau theo từng bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc kiểm duyệt khôi phục bản phát hành đó.

## Skills

Quá trình quét kỹ năng xem xét gói kỹ năng đã xuất bản, siêu dữ liệu, các yêu cầu
đã khai báo và những chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một kỹ năng khai báo và
những gì nó có vẻ thực hiện. Ví dụ, một kỹ năng tham chiếu đến khóa API bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Các phát hiện quét dựa trên hiện vật. Hành vi nhà cung cấp dự kiến, chẳng hạn như thông tin xác thực
API đã khai báo, callback OAuth localhost, dọn dẹp gỡ cài đặt theo phạm vi, mã hóa Basic Auth,
hoặc tệp tải lên do người dùng chọn tới nhà cung cấp đã nêu, được xử lý
khác với việc chuyển tiếp thông tin xác thực ẩn, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan, hoặc lạm dụng trình duyệt lén lút.

Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

## Plugin

Các bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, trường tương thích
và thông tin toàn vẹn hiện vật.

OpenClaw kiểm tra tính tương thích trước khi cài đặt plugin được ClawHub lưu trữ. Bản ghi gói
cũng có thể cung cấp siêu dữ liệu digest để OpenClaw có thể xác minh các hiện vật
đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo
khi xem xét các bản phát hành plugin, để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo kỹ năng, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- chỉ dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage)

## Ghi chú ClawScan của nhà xuất bản

Nhà xuất bản có thể cung cấp ghi chú ClawScan tùy chọn khi xuất bản một kỹ năng hoặc
plugin. Ghi chú này cung cấp ngữ cảnh cho ClawScan về hành vi có thể trông
bất thường, chẳng hạn như truy cập mạng, truy cập host gốc, hoặc thông tin xác thực
riêng theo nhà cung cấp.

## Giữ lại để kiểm duyệt

Khi trình quét tĩnh đánh dấu một kỹ năng đã tải lên là độc hại, nhà xuất bản sẽ
tự động bị đặt trong trạng thái giữ lại để kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Việc này ẩn tất cả kỹ năng của nhà xuất bản, khiến các lần xuất bản sau này
bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng tệp/dòng cho kiểm duyệt viên,
nhưng tự chúng không ẩn nội dung hoặc quyết định kết quả quét công khai.
Các bản tải lên mới vẫn ở trạng thái xem xét/đang chờ cho đến khi việc xem xét LLM hoàn tất. Quá trình
quét tĩnh chỉ chặn ngay lập tức đối với chữ ký độc hại. Các lượt khớp engine
VirusTotal vẫn hiển thị dưới dạng bằng chứng bảo mật, nhưng các kết luận VirusTotal Code Insight/Palm
chỉ mang tính tư vấn và tự chúng không ẩn kỹ năng. Các đánh giá LLM của ClawScan
giữ các ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện đánh giá mức trung bình vẫn hiển thị trên
hiện vật, trong khi bộ lọc đáng ngờ được dành cho các mối quan ngại LLM
có tác động cao, phát hiện độc hại, hoặc phát hiện AV-engine được chứng thực.

Quản trị viên có thể gỡ bỏ một trạng thái giữ lại dương tính giả:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
các kỹ năng bị ẩn bởi trạng thái giữ lại cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Các kỹ năng bị ẩn vì lý do khác, hoặc có kết quả quét tĩnh riêng vẫn
độc hại, sẽ tiếp tục bị ẩn.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung, hoặc xóa
danh sách.

Các tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại trạng thái
tài khoản. Nếu việc đăng nhập hoặc truy cập CLI thông thường bị chặn, hãy liên hệ
security@openclaw.ai để được xem xét khôi phục.

## Hướng dẫn cho nhà xuất bản

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và nhật ký thay đổi chính xác
- khai báo các biến môi trường và quyền bắt buộc
- thêm ghi chú ClawScan của nhà xuất bản khi một bản phát hành có hành vi bất thường nhưng có chủ ý
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc kiểm duyệt viên hỏi về hành vi của gói
