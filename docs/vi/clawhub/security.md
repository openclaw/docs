---
read_when:
    - Tìm hiểu về kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục mục niêm yết bị giữ lại, bị ẩn hoặc bị chặn
summary: Hành vi tin cậy, quét, báo cáo và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:33:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các mục niêm yết công khai vẫn đi qua các cơ chế kiểm soát độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tiễn: giúp người dùng
kiểm tra nội dung họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có cảnh báo dương tính giả,
và ngăn các gói lạm dụng xuất hiện trong khám phá công khai.

Xem thêm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Những gì người dùng có thể kiểm tra

Trước khi cài đặt một skill hoặc plugin, hãy kiểm tra mục niêm yết ClawHub của nó để xem:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và nhật ký thay đổi
- biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt nếu được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và chẩn đoán
chỉ chủ sở hữu nhìn thấy.

Các kết quả thường gặp gồm:

- `clean`: không tìm thấy vấn đề chặn.
- `suspicious`: bản phát hành cần được thận trọng hoặc xem xét.
- `malicious`: bản phát hành được coi là không an toàn.
- `pending`: các kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau theo bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc kiểm duyệt khôi phục bản phát hành đó.

## Skills

Quá trình quét skill xem xét gói skill đã xuất bản, siêu dữ liệu, các yêu cầu đã khai báo
và hướng dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một skill khai báo và
những gì nó có vẻ thực hiện. Ví dụ, một skill tham chiếu đến khóa API bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Kết quả quét dựa trên artifact. Hành vi nhà cung cấp được kỳ vọng, chẳng hạn như thông tin xác thực
API đã khai báo, callback OAuth localhost, dọn dẹp gỡ cài đặt theo phạm vi, mã hóa Basic Auth
hoặc tải tệp do người dùng chọn lên nhà cung cấp đã nêu, được xử lý
khác với việc bí mật chuyển tiếp thông tin xác thực, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan hoặc lạm dụng trình duyệt lén lút.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, trường tương thích
và thông tin tính toàn vẹn của artifact.

OpenClaw kiểm tra khả năng tương thích trước khi cài đặt plugin được lưu trữ trên ClawHub. Bản ghi gói
cũng có thể hiển thị siêu dữ liệu digest để OpenClaw có thể xác minh các
artifact đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo
khi xem xét bản phát hành plugin để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo skill, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký ác ý hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage)

## Ghi chú ClawScan của nhà xuất bản

Nhà xuất bản có thể cung cấp ghi chú ClawScan tùy chọn khi xuất bản một skill hoặc
plugin. Ghi chú này cung cấp ngữ cảnh cho ClawScan về hành vi có thể trông
bất thường, chẳng hạn như truy cập mạng, truy cập host gốc hoặc thông tin xác thực
riêng theo nhà cung cấp.

## Giữ lại để kiểm duyệt

Khi trình quét tĩnh đánh dấu một skill đã tải lên là độc hại, nhà xuất bản sẽ
tự động bị đặt dưới trạng thái giữ lại để kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Điều này ẩn tất cả skill của nhà xuất bản, khiến các lần xuất bản trong tương lai
bắt đầu ở trạng thái ẩn và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại dưới dạng bằng chứng tệp/dòng cho người kiểm duyệt,
nhưng chúng không tự ẩn nội dung hoặc quyết định kết quả quét công khai.
Các bản tải lên mới vẫn ở trạng thái xem xét/đang chờ cho đến khi quá trình đánh giá LLM hoàn tất. Quét tĩnh
chỉ chặn ngay lập tức đối với chữ ký độc hại. Các lần trúng engine VirusTotal
vẫn là bằng chứng bảo mật hiển thị, nhưng phán quyết VirusTotal Code Insight/Palm
chỉ mang tính tư vấn và không tự ẩn skill. Đánh giá LLM của ClawScan
giữ các ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện đánh giá mức trung bình vẫn hiển thị trên
artifact, trong khi bộ lọc đáng ngờ được dành cho các mối quan ngại LLM có tác động cao,
phát hiện độc hại hoặc phát hiện từ engine AV đã được củng cố.

Quản trị viên có thể gỡ trạng thái giữ lại do dương tính giả:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
các skill bị ẩn bởi trạng thái giữ lại cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Các skill bị ẩn vì lý do khác, hoặc bản quét tĩnh của chính chúng vẫn
độc hại, sẽ tiếp tục bị ẩn.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc gỡ bỏ
mục niêm yết.

Tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản. Nếu đăng nhập hoặc truy cập CLI thông thường bị chặn, hãy liên hệ
security@openclaw.ai để được xem xét khôi phục.

## Hướng dẫn cho nhà xuất bản

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và nhật ký thay đổi chính xác
- khai báo biến môi trường và quyền bắt buộc
- thêm ghi chú ClawScan của nhà xuất bản khi bản phát hành có hành vi bất thường nhưng có chủ đích
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- sử dụng dry run trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi gói
