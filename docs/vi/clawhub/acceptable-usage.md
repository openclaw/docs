---
read_when:
    - Rà soát nội dung tải lên để phát hiện hành vi lạm dụng hoặc vi phạm chính sách
    - Viết tài liệu kiểm duyệt hoặc sổ tay vận hành cho người đánh giá
    - Quyết định liệu có nên ẩn một kỹ năng hay cấm một người dùng
summary: 'Chính sách Marketplace: những gì ClawHub cho phép và những gì ClawHub sẽ không lưu trữ.'
x-i18n:
    generated_at: "2026-05-11T22:19:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Cách sử dụng được chấp nhận

Trang này mô tả các loại Skills và nội dung mà ClawHub chấp nhận, cũng như các quy trình lạm dụng mà ClawHub sẽ không lưu trữ.

Các quy tắc này có chủ ý thực tế. Chúng tôi quan tâm nhiều nhất đến các quy trình lạm dụng từ đầu đến cuối, không chỉ các từ khóa riêng lẻ. Nếu một Skills được xây dựng để né tránh biện pháp phòng vệ, lạm dụng nền tảng, lừa đảo người khác, xâm phạm quyền riêng tư, hoặc tạo điều kiện cho hành vi không có sự đồng thuận, nội dung đó không thuộc về ClawHub.

## Các mẫu gần đây mà chúng tôi tuyên bố rõ là chấp nhận

- Công việc frontend và hệ thống thiết kế sử dụng thành phần thật, token ngữ nghĩa, trạng thái có thể truy cập và luồng người dùng đã được kiểm thử.
- Kết hợp shadcn/ui sử dụng các thành phần nguồn đã cài đặt, bí danh dự án và biến thể được tài liệu hóa thay vì markup dùng một lần.
- Chuyển đổi UI5 từ JavaScript sang TypeScript mà vẫn giữ nguyên chú thích, dùng các kiểu UI5 cụ thể và giữ cho giao diện điều khiển được tạo ra có thể được rà soát.
- Rà soát bảo mật phòng thủ, công cụ kiểm duyệt và prompt phát hiện lạm dụng thể hiện bằng chứng và giữ rõ ranh giới phê duyệt của con người.
- Tự động hóa quy trình dựa trên sự đồng thuận cho tài khoản cá nhân hoặc nhóm với thông tin xác thực rõ ràng, thiết lập minh bạch và chế độ chạy thử hoặc xem trước.
- Tài liệu, runbook di chuyển, tiện ích dành cho nhà phát triển và fixture kiểm thử được giới hạn trong phần mềm mà chúng hỗ trợ.

## Không chấp nhận

- Quy trình vượt qua bảo mật hoặc truy cập trái phép.
  - Ví dụ: vượt qua xác thực, chiếm đoạt tài khoản, vượt qua CAPTCHA, né tránh Cloudflare hoặc chống bot, vượt qua giới hạn tốc độ, thu thập dữ liệu lén lút được thiết kế để đánh bại các biện pháp bảo vệ, chiếm quyền cuộc gọi trực tiếp hoặc tác tử, đánh cắp phiên có thể tái sử dụng, tự động phê duyệt luồng ghép nối cho người dùng chưa được phê duyệt.

- Lạm dụng nền tảng và né tránh lệnh cấm.
  - Ví dụ: tài khoản lén lút sau khi bị cấm, làm nóng/nuôi tài khoản, tương tác giả, nuôi karma hoặc người theo dõi, tự động hóa nhiều tài khoản, đăng hàng loạt, bot spam, tự động hóa nền tảng mua bán hoặc mạng xã hội được xây dựng để tránh bị phát hiện.

- Gian lận, lừa đảo và quy trình tài chính đánh lừa.
  - Ví dụ: chứng chỉ giả, hóa đơn giả, luồng thanh toán đánh lừa, tiếp cận lừa đảo, bằng chứng xã hội giả, công cụ cho phép chi tiêu hoặc tính phí mà không có phê duyệt rõ ràng của con người và cơ chế kiểm soát minh bạch, hoặc quy trình danh tính tổng hợp được xây dựng để tạo tài khoản phục vụ gian lận.

- Thu thập dữ liệu, làm giàu dữ liệu hoặc giám sát xâm phạm quyền riêng tư.
  - Ví dụ: thu thập chi tiết liên hệ ở quy mô lớn để spam, doxxing, rình rập, trích xuất khách hàng tiềm năng đi kèm tiếp cận không được yêu cầu, giám sát bí mật, tìm kiếm khuôn mặt hoặc đối sánh sinh trắc học được dùng khi không có sự đồng thuận rõ ràng, hoặc mua, xuất bản, tải xuống, hay vận hành dữ liệu bị rò rỉ hoặc tập dữ liệu từ sự cố xâm nhập.

- Mạo danh không có sự đồng thuận hoặc thao túng danh tính đánh lừa.
  - Ví dụ: hoán đổi khuôn mặt, bản sao số, nhân vật giả, influencer được sao chép, hoặc công cụ thao túng danh tính khác được dùng để mạo danh hoặc gây hiểu lầm.

- Nội dung tình dục rõ ràng và tạo nội dung người lớn với cơ chế an toàn bị vô hiệu hóa.
  - Ví dụ: tạo hình ảnh/video/nội dung NSFW, wrapper nội dung người lớn quanh API bên thứ ba, hoặc Skills có mục đích chính là nội dung tình dục rõ ràng.

- Yêu cầu thực thi bị ẩn, không an toàn hoặc gây hiểu lầm.
  - Ví dụ: lệnh cài đặt bị làm rối, `curl | sh`, yêu cầu bí mật không được khai báo, sử dụng khóa riêng không được khai báo, thực thi `npx @latest` từ xa mà không có khả năng rà soát rõ ràng, metadata gây hiểu lầm nhằm che giấu những gì Skills thật sự cần để chạy.

## Các mẫu gần đây mà chúng tôi tuyên bố rõ là không chấp nhận

- “Tạo tài khoản người bán lén lút sau khi bị cấm trên nền tảng mua bán.”
- “Sửa đổi ghép nối Telegram để người dùng chưa được phê duyệt tự động nhận mã ghép nối.”
- “Nuôi tài khoản Reddit/Twitter bằng tự động hóa không thể bị phát hiện.”
- “Tạo chứng chỉ chuyên nghiệp hoặc hóa đơn để sử dụng tùy ý.”
- “Tạo nội dung NSFW với kiểm tra an toàn bị vô hiệu hóa.”
- “Thu thập khách hàng tiềm năng, làm giàu thông tin liên hệ và triển khai tiếp cận lạnh ở quy mô lớn.”
- “Mua, xuất bản hoặc tải xuống dữ liệu bị rò rỉ hoặc tập dữ liệu từ sự cố xâm nhập.”
- “Tạo hàng loạt tài khoản email hoặc mạng xã hội bằng danh tính tổng hợp hoặc giải CAPTCHA.”

## Ghi chú cho người rà soát

- Ngữ cảnh có ý nghĩa quan trọng. Cùng một chủ đề có thể hợp lệ trong bối cảnh phòng thủ hẹp hoặc dựa trên sự đồng thuận, và không thể chấp nhận khi được đóng gói như một quy trình lạm dụng.
- Chúng ta nên thiên về hành động khi một Skills rõ ràng được tối ưu hóa cho việc né tránh, đánh lừa hoặc sử dụng không có sự đồng thuận.
- Tải lên lặp lại trong các danh mục này là căn cứ để ẩn nội dung và cấm tài khoản.

## Thực thi

- Chúng tôi có thể ẩn, xóa hoặc xóa vĩnh viễn Skills vi phạm.
- Chúng tôi có thể thu hồi token, xóa mềm nội dung liên quan và cấm người vi phạm lặp lại hoặc nghiêm trọng.
- Chúng tôi không đảm bảo thực thi theo hướng cảnh báo trước đối với hành vi lạm dụng rõ ràng.
