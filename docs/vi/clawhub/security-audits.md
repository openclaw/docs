---
read_when:
    - Tìm hiểu kết quả kiểm tra bảo mật ClawHub
    - Quyết định nên cài đặt skill hay plugin
    - Giải thích trạng thái kiểm tra, mức độ rủi ro hoặc các phát hiện của ClawHub
sidebarTitle: Security Audits
summary: Cách hiểu kết quả kiểm tra bảo mật của ClawHub trước khi cài đặt một skill hoặc plugin.
title: Kiểm tra bảo mật
x-i18n:
    generated_at: "2026-07-19T05:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Kiểm tra bảo mật

Các cuộc kiểm tra bảo mật của ClawHub giúp bạn quyết định xem một skill hoặc plugin có đủ an toàn
để cài đặt hay không. Chúng cho biết một bản phát hành làm gì, yêu cầu quyền hạn nào và
liệu có điều gì cần đặc biệt lưu ý trước khi bản phát hành có thể truy cập tệp, tài khoản,
thông tin xác thực, mã nguồn hoặc dịch vụ bên ngoài hay không.

Các cuộc kiểm tra là tín hiệu an toàn đáng tin cậy, nhưng không đảm bảo rằng một bản phát hành
hoàn toàn không có rủi ro. Luôn cân nhắc kỹ trước khi cấp quyền truy cập nhạy cảm.

Xem thêm [Bảo mật](/clawhub/security), [Quy định sử dụng chấp nhận được](/clawhub/acceptable-usage)
và [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation).

## Những điều cần kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy xem xét:

- trạng thái kiểm tra tổng thể
- mức độ rủi ro
- mọi phát hiện được liệt kê
- thông tin xác thực, quyền hoặc biến môi trường bắt buộc
- chủ sở hữu, nguồn, phiên bản, nhật ký thay đổi, lượt tải xuống, số sao và các tín hiệu tin cậy khác

Chỉ cài đặt nội dung mà bạn hiểu và tin tưởng.

## Trạng thái kiểm tra

Trạng thái kiểm tra cho biết cách phản ứng với kết quả kiểm tra:

| Trạng thái      | Ý nghĩa                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Không phát hiện vấn đề hiển thị nào có mức rủi ro cao hơn thấp.                                |
| `Review`    | Đọc các phát hiện trước khi cài đặt. Bản phát hành vẫn có thể hợp lệ. |
| `Warn`      | Hãy đặc biệt thận trọng. ClawHub đã phát hiện một vấn đề có tác động lớn hoặc tín hiệu cảnh báo. |
| `Malicious` | Không cài đặt.                                                           |
| `Pending`   | Các cuộc kiểm tra chưa hoàn tất.                                             |
| `Error`     | Không thể hoàn tất cuộc kiểm tra.                                         |

Kết quả `Pass` mang tính trấn an, nhưng không thay thế cho đánh giá của chính bạn. Điều này đặc biệt
quan trọng đối với các công cụ có thể xuất bản nội dung, chỉnh sửa dữ liệu, chạy lệnh, đọc tệp hoặc
truy cập hệ thống production.

## Mức độ rủi ro

Mức độ rủi ro mô tả phạm vi ảnh hưởng: bản phát hành dường như có bao nhiêu quyền lực nếu
bạn sử dụng đúng như dự định.

| Mức độ rủi ro | Ý nghĩa                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Phát hiện ít quyền hạn nhạy cảm hoặc tác động đến người dùng.                          |
| `Medium`   | Bản phát hành có quyền hạn đáng kể, chẳng hạn như truy cập tài khoản hoặc thay đổi dữ liệu. |
| `High`     | Bản phát hành có quyền hạn tác động lớn, phát hiện nghiêm trọng hoặc tín hiệu độc hại. |

Mức độ rủi ro và trạng thái kiểm tra trả lời các câu hỏi khác nhau:

- Mức độ rủi ro hỏi: "Có bao nhiêu quyền lực ở đây?"
- Trạng thái kiểm tra hỏi: "Tôi nên làm gì với kết quả này?"

Ví dụ: một skill xuất bản có thể hiển thị `Review` với mức rủi ro `Medium`. Điều đó
không có nghĩa là skill này độc hại. Điều đó có nghĩa là skill có vẻ phù hợp với mục đích, nhưng có thể
hành động bằng quyền hạn tài khoản đáng kể.

## Phát hiện

Các phát hiện giải thích lý do một kết quả kiểm tra được hiển thị. Mỗi phát hiện thường bao gồm:

- ý nghĩa của phát hiện
- lý do phát hiện bị gắn cờ
- nội dung skill hoặc plugin có liên quan
- một khuyến nghị

Các phát hiện có thể được gắn nhãn `Info`, `Low`, `Medium`, `High` hoặc `Critical`. Các phát hiện có
mức độ nghiêm trọng cao hơn đóng góp nhiều hơn vào mức độ rủi ro và trạng thái kiểm tra.

Các phát hiện có độ tin cậy thấp được ẩn khỏi bản tổng hợp kiểm tra công khai để trang
tập trung vào bằng chứng hữu ích.

## Những gì ClawHub kiểm tra

ClawHub kiểm tra các tạo phẩm bản phát hành đã gửi, bao gồm:

- hướng dẫn skill hoặc siêu dữ liệu plugin
- các biến môi trường và quyền đã khai báo
- hướng dẫn cài đặt và siêu dữ liệu gói
- các tệp và bản kê tệp đi kèm
- siêu dữ liệu về khả năng tương thích và năng lực

Câu hỏi chính là tính nhất quán: tên, bản tóm tắt, siêu dữ liệu, quyền hạn được yêu cầu
và nội dung thực tế có phù hợp với những gì người dùng có thể kỳ vọng một cách hợp lý hay không?

Hành vi có quyền lực lớn không tự động là xấu. Nhiều công cụ hữu ích cần thông tin xác thực,
lệnh cục bộ, API của nhà cung cấp hoặc cài đặt gói. Cuộc kiểm tra xác định liệu quyền lực đó
có được dự kiến, công bố và cân xứng hay không.

Các trang tạo phẩm liên kết đến bản kiểm tra đầy đủ tại:

```text
/<owner>/skills/<slug>/security-audit
```

Trang kiểm tra kết hợp:

1. SkillSpector
2. VirusTotal
3. Phân tích rủi ro

## VirusTotal

ClawHub sử dụng VirusTotal làm dữ liệu đo từ xa về phần mềm độc hại trong hệ thống kiểm tra. VirusTotal là một
tiêu chuẩn ngành đáng tin cậy về danh tiếng tệp và quét phần mềm độc hại, đồng thời quan hệ
đối tác của chúng tôi cho phép ClawHub bổ sung thông tin tình báo bảo mật rộng hơn vào quá trình review skill và plugin.

VirusTotal đặc biệt hữu ích đối với các tạo phẩm độc hại đã biết, kết quả phát hiện của công cụ quét và
tín hiệu danh tiếng bổ sung cho quá trình review nhận biết tác nhân của ClawHub. Khi có
số lượng công cụ của nhà cung cấp, bản kiểm tra sẽ tóm tắt chúng bằng ngôn ngữ đơn giản, chẳng
hạn như:

```text
62/62 nhà cung cấp đã đánh dấu skill này là sạch.
```

hoặc:

```text
2/64 nhà cung cấp đã đánh dấu skill này là độc hại, 1/64 đánh dấu là đáng ngờ và 61/64 đánh dấu là sạch.
```

Khi ClawHub không có dữ liệu đo từ xa về số lượng nhà cung cấp để tóm tắt, bản kiểm tra cho biết:

```text
Không có phát hiện từ VirusTotal
```

VirusTotal vẫn chỉ là dữ liệu đo từ xa. Nó không thay thế quy trình phân tích rủi ro có nhận biết
tạo phẩm của chính ClawHub.

## Phân tích rủi ro

Phân tích rủi ro được vận hành nội bộ bởi ClawScan, hệ thống kiểm tra bảo mật riêng
của ClawHub. Hệ thống review từng bản phát hành như một tạo phẩm dành cho tác nhân: hướng dẫn,
siêu dữ liệu, quyền đã khai báo, tệp, tín hiệu năng lực, tín hiệu quét tĩnh,
phát hiện của SkillSpector, dữ liệu đo từ xa của VirusTotal và ngữ cảnh do nhà phát hành cung cấp.
Các tín hiệu quét tĩnh là ngữ cảnh nội bộ cho quá trình review này; chúng không phải là
một phần kiểm tra công khai độc lập hoặc phán quyết chặn cài đặt.

Phân tích rủi ro sử dụng
[10 rủi ro hàng đầu của OWASP đối với Agentic Skills](https://owasp.org/www-project-agentic-skills-top-10/)
làm lăng kính để xem xét các rủi ro như chèn prompt, lạm dụng công cụ, làm lộ thông tin xác thực,
thực thi không an toàn, đầu độc bộ nhớ hoặc ngữ cảnh và quyền tự chủ quá mức.

ClawScan không tự động coi một năng lực trông đáng sợ là độc hại.
Hệ thống xem xét liệu năng lực đó có được công bố, phù hợp với mục đích và được
trường hợp sử dụng đã nêu của bản phát hành hỗ trợ hay không.
