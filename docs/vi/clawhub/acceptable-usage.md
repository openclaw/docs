---
read_when:
    - Rà soát nội dung tải lên để phát hiện hành vi lạm dụng hoặc vi phạm chính sách
    - Viết tài liệu kiểm duyệt hoặc sổ tay quy trình cho người đánh giá
    - Quyết định xem có nên ẩn một kỹ năng hay cấm một người dùng
summary: 'Chính sách chợ ứng dụng: những gì ClawHub cho phép và những gì ClawHub sẽ không lưu trữ.'
x-i18n:
    generated_at: "2026-05-12T00:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Mức sử dụng được chấp nhận

Trang này mô tả các loại kỹ năng và nội dung mà ClawHub chấp nhận, cũng như các quy trình lạm dụng mà ClawHub sẽ không lưu trữ.

Các quy tắc này được thiết kế có chủ đích theo hướng thực tế. Chúng tôi quan tâm nhiều nhất đến các quy trình lạm dụng từ đầu đến cuối, không chỉ các từ khóa riêng lẻ. Nếu một kỹ năng được xây dựng để né tránh biện pháp phòng vệ, lạm dụng nền tảng, lừa đảo người khác, xâm phạm quyền riêng tư hoặc tạo điều kiện cho hành vi không có sự đồng thuận, kỹ năng đó không thuộc về ClawHub.

## Các mẫu gần đây mà chúng tôi nêu rõ là chấp nhận

- Công việc giao diện người dùng và hệ thống thiết kế sử dụng thành phần thật, token ngữ nghĩa, trạng thái có thể truy cập và luồng người dùng đã được kiểm thử.
- Cấu thành shadcn/ui sử dụng thành phần nguồn đã cài đặt, bí danh dự án và biến thể được ghi lại trong tài liệu thay vì markup dùng một lần.
- Chuyển đổi JavaScript sang TypeScript cho UI5 theo cách giữ nguyên chú thích, dùng kiểu UI5 cụ thể và giữ cho giao diện điều khiển được tạo ra có thể rà soát.
- Rà soát bảo mật phòng thủ, công cụ kiểm duyệt và prompt phát hiện lạm dụng có hiển thị bằng chứng và giữ rõ ranh giới phê duyệt của con người.
- Tự động hóa quy trình dựa trên sự đồng thuận cho tài khoản cá nhân hoặc nhóm, với thông tin xác thực rõ ràng, thiết lập minh bạch và chế độ chạy thử hoặc xem trước.
- Tài liệu, runbook di chuyển, tiện ích dành cho nhà phát triển và fixture kiểm thử được giới hạn trong phần mềm mà chúng hỗ trợ.

## Không chấp nhận

- Quy trình vượt qua bảo mật hoặc truy cập trái phép.
  - Ví dụ: vượt qua xác thực, chiếm đoạt tài khoản, vượt CAPTCHA, né tránh Cloudflare hoặc chống bot, vượt giới hạn tốc độ, thu thập dữ liệu lén lút được thiết kế để đánh bại biện pháp bảo vệ, chiếm quyền cuộc gọi trực tiếp hoặc tác tử, đánh cắp phiên có thể tái sử dụng, tự động phê duyệt luồng ghép nối cho người dùng chưa được phê duyệt.

- Lạm dụng nền tảng và né tránh lệnh cấm.
  - Ví dụ: tài khoản lén lút sau khi bị cấm, làm nóng/nuôi tài khoản, tương tác giả, nuôi karma hoặc người theo dõi, tự động hóa nhiều tài khoản, đăng bài hàng loạt, bot spam, tự động hóa marketplace hoặc mạng xã hội được xây dựng để tránh bị phát hiện.

- Gian lận, lừa đảo và quy trình tài chính gây hiểu lầm.
  - Ví dụ: chứng chỉ giả, hóa đơn giả, luồng thanh toán gây hiểu lầm, tiếp cận lừa đảo, bằng chứng xã hội giả, công cụ cho phép chi tiêu hoặc tính phí mà không có phê duyệt rõ ràng của con người và kiểm soát minh bạch, hoặc quy trình danh tính tổng hợp được xây dựng để tạo tài khoản phục vụ gian lận.

- Thu thập dữ liệu, làm giàu dữ liệu hoặc giám sát xâm phạm quyền riêng tư.
  - Ví dụ: thu thập chi tiết liên hệ ở quy mô lớn để spam, doxxing, theo dõi quấy rối, trích xuất khách hàng tiềm năng đi kèm tiếp cận không được yêu cầu, giám sát bí mật, tìm kiếm khuôn mặt hoặc đối sánh sinh trắc học được dùng khi không có sự đồng thuận rõ ràng, hoặc mua, xuất bản, tải xuống hay vận hành dữ liệu bị rò rỉ hoặc tập dữ liệu từ sự cố xâm phạm.

- Mạo danh không có sự đồng thuận hoặc thao túng danh tính gây hiểu lầm.
  - Ví dụ: hoán đổi khuôn mặt, bản sao số, persona giả, người có ảnh hưởng được nhân bản, hoặc công cụ thao túng danh tính khác được dùng để mạo danh hoặc gây hiểu lầm.

- Nội dung tình dục rõ ràng và tạo nội dung người lớn khi an toàn bị vô hiệu hóa.
  - Ví dụ: tạo hình ảnh/video/nội dung NSFW, wrapper nội dung người lớn quanh API bên thứ ba, hoặc kỹ năng có mục đích chính là nội dung tình dục rõ ràng.

- Yêu cầu thực thi bị che giấu, không an toàn hoặc gây hiểu lầm.
  - Ví dụ: lệnh cài đặt bị làm rối, `curl | sh`, yêu cầu bí mật không được khai báo, việc dùng khóa riêng tư không được khai báo, thực thi `npx @latest` từ xa mà không có khả năng rà soát rõ ràng, metadata gây hiểu lầm che giấu những gì kỹ năng thực sự cần để chạy.

## Các mẫu gần đây mà chúng tôi nêu rõ là không chấp nhận

- “Tạo tài khoản người bán lén lút sau khi bị marketplace cấm.”
- “Sửa đổi ghép nối Telegram để người dùng chưa được phê duyệt tự động nhận mã ghép nối.”
- “Nuôi tài khoản Reddit/Twitter bằng tự động hóa không thể phát hiện.”
- “Tạo chứng chỉ chuyên nghiệp hoặc hóa đơn để dùng tùy ý.”
- “Tạo nội dung NSFW khi kiểm tra an toàn bị vô hiệu hóa.”
- “Thu thập khách hàng tiềm năng, làm giàu liên hệ và triển khai tiếp cận lạnh ở quy mô lớn.”
- “Mua, xuất bản hoặc tải xuống dữ liệu bị rò rỉ hoặc tập dữ liệu từ sự cố xâm phạm.”
- “Tạo hàng loạt tài khoản email hoặc mạng xã hội bằng danh tính tổng hợp hoặc giải CAPTCHA.”

## Ghi chú cho người rà soát

- Ngữ cảnh rất quan trọng. Cùng một chủ đề có thể hợp lệ trong một bối cảnh phòng thủ hẹp hoặc dựa trên sự đồng thuận, nhưng không thể chấp nhận khi được đóng gói thành quy trình lạm dụng.
- Chúng ta nên thiên về hành động khi một kỹ năng rõ ràng được tối ưu hóa cho né tránh, lừa dối hoặc sử dụng không có sự đồng thuận.
- Việc tải lên lặp lại trong các danh mục này là căn cứ để ẩn nội dung và cấm tài khoản.

## Thực thi

- Chúng tôi có thể ẩn, gỡ bỏ hoặc xóa vĩnh viễn các kỹ năng vi phạm.
- Chúng tôi có thể thu hồi token, xóa mềm nội dung liên quan và cấm người vi phạm lặp lại hoặc nghiêm trọng.
- Chúng tôi không bảo đảm sẽ cảnh báo trước khi thực thi đối với hành vi lạm dụng rõ ràng.
