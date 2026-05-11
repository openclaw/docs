---
read_when:
    - Tìm hiểu kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một kỹ năng hoặc gói
    - Khôi phục khi mục niêm yết bị giữ, bị ẩn hoặc bị chặn
summary: Hành vi về tin cậy, quét, báo cáo, kháng nghị và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + Kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các danh sách công khai vẫn đi qua các biện pháp kiểm soát về độ tin cậy,
quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tế: giúp người dùng
kiểm tra những gì họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có kết quả dương tính giả,
và ngăn các gói lạm dụng xuất hiện trong phần khám phá công khai.

Xem thêm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Những gì người dùng có thể kiểm tra

Trước khi cài đặt một skill hoặc plugin, hãy kiểm tra danh sách ClawHub của nó để biết:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và nhật ký thay đổi
- biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và phần chẩn đoán
chỉ chủ sở hữu thấy được.

Các kết quả phổ biến bao gồm:

- `clean`: không tìm thấy vấn đề chặn nào.
- `suspicious`: bản phát hành cần được thận trọng hoặc xem xét.
- `malicious`: bản phát hành được xem là không an toàn.
- `pending`: các bước kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn
  khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau tùy bề mặt, nhưng ý nghĩa thực tế là như nhau: nếu một
bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết
vấn đề hoặc bộ phận kiểm duyệt khôi phục nó.

## Skills

Quá trình quét skill xem xét gói skill đã xuất bản, siêu dữ liệu, các yêu cầu đã khai báo
và các chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một skill khai báo và
những gì nó có vẻ thực hiện. Ví dụ, một skill tham chiếu đến khóa API bắt buộc
nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi
cài đặt.

Các phát hiện quét dựa trên hiện vật. Hành vi dự kiến của nhà cung cấp, chẳng hạn như thông tin xác thực
API đã khai báo, callback OAuth localhost, dọn dẹp gỡ cài đặt theo phạm vi, mã hóa Basic Auth
hoặc tệp do người dùng chọn tải lên nhà cung cấp đã nêu, được xử lý
khác với việc chuyển tiếp thông tin xác thực ẩn, truy cập rộng vào tệp riêng tư,
đích mạng không liên quan hoặc lạm dụng trình duyệt ngầm.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Các bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, trường tương thích
và thông tin tính toàn vẹn hiện vật.

OpenClaw kiểm tra tính tương thích trước khi cài đặt các plugin được lưu trữ trên ClawHub. Bản ghi gói
cũng có thể hiển thị siêu dữ liệu digest để OpenClaw có thể xác minh các
hiện vật đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo
khi xem xét các bản phát hành plugin để các yêu cầu runtime đã khai báo được
so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, gói và bình luận.

Báo cáo nên cụ thể và có thể hành động. Lạm dụng việc báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký với ý đồ xấu hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage)

## Báo cáo về ý đồ xấu hoặc nhãn hiệu

ClawHub sử dụng cùng một quy trình báo cáo và kiểm duyệt của nhân viên cho các trường hợp đăng ký
với ý đồ xấu, mạo danh và tranh chấp liên quan đến nhãn hiệu. Các báo cáo này cần
đủ ngữ cảnh để nhân viên xác định bên khiếu nại, danh sách bị tranh chấp và
hành động được yêu cầu.

Bao gồm:

- URL skill hoặc gói ClawHub chính tắc và định danh chủ sở hữu
- nhãn hiệu, dự án, công ty hoặc tên sản phẩm liên quan
- bằng chứng công khai về quyền sở hữu hoặc thẩm quyền của bên khiếu nại
- lý do chủ sở hữu hiện tại không được ủy quyền để xuất bản dưới tên đó
- hành động được yêu cầu, chẳng hạn như ẩn trong khi chờ xem xét, chuyển quyền sở hữu, đổi tên,
  hoặc xóa

Không đưa bí mật riêng tư hoặc tài liệu pháp lý nhạy cảm vào báo cáo công khai. Mở
một issue GitHub với bằng chứng không nhạy cảm và yêu cầu maintainers cung cấp lộ trình
bàn giao riêng tư khi cần.

## Khiếu nại và quét lại

Chủ sở hữu có thể yêu cầu quét lại khi họ tin rằng một skill hoặc gói đã bị
giữ lại hoặc gắn cờ không chính xác. Người kiểm duyệt nền tảng và quản trị viên có thể yêu cầu quét lại cho bất kỳ
skill hoặc gói nào trong khi xử lý báo cáo hoặc yêu cầu hỗ trợ:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Đối với nội dung đã được kiểm duyệt, chủ sở hữu có thể gửi khiếu nại từ các
bề mặt ClawHub chỉ chủ sở hữu thấy được. Khiếu nại nên giải thích điều gì đã thay đổi hoặc vì sao
cờ là không chính xác.

## Giữ để kiểm duyệt

Khi trình quét tĩnh gắn cờ một skill đã tải lên là độc hại, nhà xuất bản sẽ
tự động bị đặt trong trạng thái giữ để kiểm duyệt (`requiresModerationAt` được đặt trên
người dùng). Điều này ẩn tất cả Skills của nhà xuất bản, khiến các lần xuất bản trong tương lai
bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng theo tệp/dòng cho người kiểm duyệt,
nhưng chúng không tự ẩn nội dung hoặc quyết định kết luận quét công khai.
Các bản tải lên mới vẫn ở trạng thái xem xét/đang chờ cho đến khi quá trình xem xét LLM hoàn tất. Quét tĩnh
chỉ chặn ngay lập tức đối với chữ ký độc hại. Các kết quả trúng từ engine VirusTotal
vẫn là bằng chứng bảo mật hiển thị, nhưng kết luận VirusTotal Code Insight/Palm
chỉ mang tính tư vấn và không tự ẩn Skills. Các đánh giá LLM của ClawScan
giữ lại ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện đánh giá mức trung bình vẫn hiển thị trên
hiện vật, trong khi bộ lọc đáng ngờ được dành cho các mối lo ngại LLM có tác động lớn,
phát hiện độc hại hoặc phát hiện AV-engine được chứng thực.

Quản trị viên có thể gỡ trạng thái giữ do dương tính giả:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục
Skills bị ẩn bởi trạng thái giữ ở cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`.
Skills bị ẩn vì lý do khác, hoặc bản quét tĩnh riêng của chúng vẫn
độc hại, sẽ tiếp tục bị ẩn.

## Cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng
có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc xóa
danh sách.

Các tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản hoặc liên hệ maintainers qua kênh hỗ trợ dự án dự kiến.

## Hướng dẫn cho nhà xuất bản

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ cho tên, tóm tắt, thẻ và nhật ký thay đổi chính xác
- khai báo biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của gói
