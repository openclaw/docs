---
read_when:
    - Tìm hiểu về kết quả quét và kiểm duyệt của ClawHub
    - Báo cáo một skill hoặc gói
    - Khôi phục mục niêm yết bị giữ, ẩn hoặc chặn
summary: Hành vi về độ tin cậy, quét, báo cáo và kiểm duyệt của ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật + kiểm duyệt

ClawHub mở cho việc xuất bản, nhưng các mục niêm yết công khai vẫn đi qua các biện pháp kiểm soát về độ tin cậy, quét, báo cáo và kiểm duyệt. Mục tiêu mang tính thực tế: giúp người dùng kiểm tra nội dung họ cài đặt, cung cấp cho nhà xuất bản một lộ trình khôi phục khi có cảnh báo sai, và ngăn các gói lạm dụng xuất hiện trong phần khám phá công khai.

Xem thêm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage).

## Người dùng có thể kiểm tra gì

Trước khi cài đặt một skill hoặc plugin, hãy kiểm tra mục niêm yết ClawHub của nó để xem:

- chủ sở hữu và ghi nhận nguồn
- phiên bản mới nhất và changelog
- biến môi trường hoặc quyền bắt buộc
- siêu dữ liệu tương thích cho plugin
- trạng thái quét hoặc kiểm duyệt
- báo cáo, bình luận, sao, lượt tải xuống và tín hiệu cài đặt khi được hiển thị

Chỉ cài đặt nội dung bạn hiểu và tin cậy.

## Trạng thái quét

ClawHub có thể hiển thị kết quả quét hoặc kiểm duyệt trên các trang công khai và chẩn đoán chỉ chủ sở hữu nhìn thấy.

Các kết quả phổ biến gồm:

- `clean`: không tìm thấy vấn đề chặn.
- `suspicious`: bản phát hành cần thận trọng hoặc xem xét.
- `malicious`: bản phát hành được xem là không an toàn.
- `pending`: các kiểm tra chưa hoàn tất.
- `held`, `quarantined`, `revoked`, hoặc `hidden`: bản phát hành chưa hoàn toàn khả dụng trên các bề mặt cài đặt công khai.

Cách diễn đạt chính xác có thể khác nhau theo từng bề mặt, nhưng ý nghĩa thực tế là giống nhau: nếu một bản phát hành bị giữ lại hoặc bị chặn, người dùng không nên cài đặt cho đến khi chủ sở hữu giải quyết vấn đề hoặc kiểm duyệt khôi phục bản phát hành đó.

## Skills

Quá trình quét skill xem xét gói skill đã xuất bản, siêu dữ liệu, các yêu cầu đã khai báo và những chỉ dẫn đáng ngờ.

ClawHub đặc biệt chú ý đến sự không khớp giữa những gì một skill khai báo và những gì skill đó có vẻ thực hiện. Ví dụ, một skill tham chiếu đến khóa API bắt buộc nên khai báo yêu cầu đó trong `SKILL.md` để người dùng có thể thấy trước khi cài đặt.

Các phát hiện quét dựa trên artifact. Hành vi nhà cung cấp dự kiến, như thông tin xác thực API đã khai báo, callback OAuth localhost, dọn dẹp khi gỡ cài đặt theo phạm vi, mã hóa Basic Auth, hoặc tệp do người dùng chọn tải lên nhà cung cấp đã nêu, được xử lý khác với việc chuyển tiếp thông tin xác thực bị ẩn, truy cập rộng vào tệp riêng tư, đích mạng không liên quan, hoặc lạm dụng trình duyệt ẩn.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Bản phát hành Plugin bao gồm siêu dữ liệu gói, ghi nhận nguồn, các trường tương thích và thông tin tính toàn vẹn của artifact.

OpenClaw kiểm tra tính tương thích trước khi cài đặt các plugin được lưu trữ trên ClawHub. Bản ghi gói cũng có thể hiển thị siêu dữ liệu digest để OpenClaw có thể xác minh artifact đã tải xuống. ClawScan bao gồm siêu dữ liệu env/config `openclaw.environment` của gói đã khai báo khi xem xét bản phát hành plugin để các yêu cầu runtime đã khai báo được so sánh với hành vi quan sát được.

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo skill, gói và bình luận.

Báo cáo nên cụ thể và có thể xử lý. Việc lạm dụng báo cáo cũng có thể dẫn đến hành động đối với tài khoản.

Ví dụ báo cáo:

- siêu dữ liệu gây hiểu lầm
- yêu cầu thông tin xác thực hoặc quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- bình luận lừa đảo hoặc mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage)

## Ghi chú ClawScan của nhà xuất bản

Nhà xuất bản có thể cung cấp ghi chú ClawScan tùy chọn khi xuất bản một skill hoặc plugin. Ghi chú này cung cấp cho ClawScan ngữ cảnh về hành vi có thể trông bất thường, chẳng hạn như truy cập mạng, truy cập native host, hoặc thông tin xác thực dành riêng cho nhà cung cấp.

## Tạm giữ kiểm duyệt

Khi trình quét tĩnh gắn cờ một skill đã tải lên là độc hại, nhà xuất bản sẽ tự động bị đặt dưới trạng thái tạm giữ kiểm duyệt (`requiresModerationAt` được đặt trên người dùng). Điều này ẩn tất cả skill của nhà xuất bản, khiến các lần xuất bản trong tương lai bắt đầu ở trạng thái ẩn, và tạo một mục nhật ký kiểm toán `user.moderation.auto`.

Các phát hiện tĩnh đáng ngờ được giữ lại làm bằng chứng tệp/dòng cho người kiểm duyệt, nhưng riêng chúng không ẩn nội dung hoặc quyết định kết luận quét công khai. Các nội dung tải lên mới vẫn ở trạng thái xem xét/chờ xử lý cho đến khi quá trình xem xét LLM hoàn tất. Quét tĩnh chỉ chặn ngay lập tức đối với chữ ký độc hại. Các lượt khớp engine VirusTotal vẫn hiển thị dưới dạng bằng chứng bảo mật, nhưng verdict của VirusTotal Code Insight/Palm chỉ mang tính tư vấn và tự chúng không ẩn skill. Các bài xem xét ClawScan LLM giữ lại ghi chú phù hợp với mục đích làm hướng dẫn. Các phát hiện xem xét mức trung bình vẫn hiển thị trên artifact, còn bộ lọc đáng ngờ được dành cho các quan ngại LLM có tác động cao, phát hiện độc hại, hoặc phát hiện từ AV-engine đã được xác corroborate.

Quản trị viên có thể gỡ trạng thái tạm giữ do cảnh báo sai:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Thao tác này xóa `requiresModerationAt` và `requiresModerationReason`, khôi phục các skill bị ẩn bởi trạng thái tạm giữ cấp người dùng, và ghi một mục nhật ký kiểm toán `user.moderation.lift`. Các skill bị ẩn vì lý do khác, hoặc bản quét tĩnh của chính skill vẫn là độc hại, sẽ tiếp tục bị ẩn.

## Lệnh cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Hành vi lạm dụng nghiêm trọng có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung, hoặc gỡ bỏ mục niêm yết.

Tài khoản đã xóa, bị cấm, hoặc bị vô hiệu hóa không thể sử dụng token API ClawHub. Nếu xác thực CLI bắt đầu thất bại sau một hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại trạng thái tài khoản. Nếu đăng nhập hoặc truy cập CLI bình thường bị chặn, hãy liên hệ security@openclaw.ai để được xem xét khôi phục.

## Hướng dẫn dành cho nhà xuất bản

Để giảm cảnh báo sai và cải thiện độ tin cậy của người dùng:

- giữ tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- thêm ghi chú ClawScan của nhà xuất bản khi bản phát hành có hành vi bất thường nhưng có chủ đích
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của gói
