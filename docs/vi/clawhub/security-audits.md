---
read_when:
    - Hiểu kết quả kiểm tra bảo mật ClawHub
    - Quyết định có nên cài đặt kỹ năng hay plugin
    - Giải thích trạng thái kiểm toán ClawHub, mức độ rủi ro hoặc các phát hiện
sidebarTitle: Security Audits
summary: Cách hiểu kết quả kiểm toán bảo mật của ClawHub trước khi cài đặt một Skills hoặc Plugin.
title: Kiểm toán bảo mật
x-i18n:
    generated_at: "2026-07-01T08:10:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Kiểm toán bảo mật

Các kiểm toán bảo mật của ClawHub giúp bạn quyết định liệu một kỹ năng hoặc tiện ích bổ trợ có đủ an toàn để cài đặt hay không. Chúng cho biết một bản phát hành làm gì, yêu cầu quyền hạn nào, và liệu có điều gì cần chú ý thêm trước khi nó có thể truy cập tệp, tài khoản, thông tin xác thực, mã hoặc dịch vụ bên ngoài hay không.

Kiểm toán là tín hiệu an toàn mạnh, nhưng không bảo đảm rằng một bản phát hành hoàn toàn không có rủi ro. Luôn dùng phán đoán của bạn trước khi cấp quyền truy cập nhạy cảm.

Xem thêm [Bảo mật](/clawhub/security), [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage), và [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation).

## Những gì cần kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy xem xét:

- trạng thái kiểm toán tổng thể
- mức rủi ro
- mọi phát hiện được liệt kê
- thông tin xác thực, quyền hoặc biến môi trường bắt buộc
- chủ sở hữu, nguồn, phiên bản, nhật ký thay đổi, lượt tải xuống, sao và các tín hiệu tin cậy khác

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái kiểm toán

Trạng thái kiểm toán cho bạn biết cách phản ứng với kết quả kiểm toán:

| Trạng thái | Ý nghĩa |
| ----------- | ------------------------------------------------------------------------- |
| `Pass` | Không tìm thấy vấn đề rõ ràng nào vượt quá mức rủi ro thấp. |
| `Review` | Đọc các phát hiện trước khi cài đặt. Bản phát hành vẫn có thể hợp lệ. |
| `Warn` | Hãy thận trọng hơn. ClawHub đã tìm thấy một mối quan ngại có tác động cao hoặc tín hiệu cảnh báo. |
| `Malicious` | Không cài đặt. |
| `Pending` | Kiểm toán chưa hoàn tất. |
| `Error` | Không thể hoàn tất kiểm toán. |

`Pass` là tín hiệu đáng yên tâm, nhưng không thay thế phán đoán của chính bạn. Điều này quan trọng nhất với các công cụ có thể xuất bản nội dung, chỉnh sửa dữ liệu, chạy lệnh, đọc tệp hoặc truy cập hệ thống production.

## Mức rủi ro

Mức rủi ro mô tả phạm vi ảnh hưởng: bản phát hành có vẻ có bao nhiêu quyền lực nếu bạn dùng nó đúng như dự định.

| Mức rủi ro | Ý nghĩa |
| ---------- | ----------------------------------------------------------------------------- |
| `Low` | Tìm thấy ít quyền hạn nhạy cảm hoặc ít tác động đến người dùng. |
| `Medium` | Bản phát hành có quyền hạn đáng kể, chẳng hạn như truy cập tài khoản hoặc thay đổi dữ liệu. |
| `High` | Bản phát hành có quyền hạn tác động cao, phát hiện nghiêm trọng hoặc tín hiệu độc hại. |

Mức rủi ro và trạng thái kiểm toán trả lời các câu hỏi khác nhau:

- Mức rủi ro hỏi: "Ở đây có bao nhiêu quyền lực?"
- Trạng thái kiểm toán hỏi: "Tôi nên làm gì với kết quả này?"

Ví dụ, một kỹ năng xuất bản có thể hiển thị `Review` với rủi ro `Medium`. Điều đó không có nghĩa là nó độc hại. Nó có nghĩa là kỹ năng này có vẻ phù hợp với mục đích, nhưng có thể hành động với quyền hạn tài khoản đáng kể.

## Phát hiện

Phát hiện giải thích lý do một kết quả kiểm toán được hiển thị. Mỗi phát hiện thường bao gồm:

- ý nghĩa của nó
- lý do nó bị gắn cờ
- nội dung kỹ năng hoặc tiện ích bổ trợ liên quan
- một khuyến nghị

Phát hiện có thể được gắn nhãn `Info`, `Low`, `Medium`, `High`, hoặc `Critical`. Các phát hiện có mức độ nghiêm trọng cao hơn đóng góp mạnh hơn vào mức rủi ro và trạng thái kiểm toán.

Các phát hiện có độ tin cậy thấp được ẩn khỏi bản tổng hợp kiểm toán công khai để trang tập trung vào bằng chứng hữu ích.

## ClawHub kiểm tra những gì

ClawHub kiểm toán các tạo tác bản phát hành đã gửi, bao gồm:

- hướng dẫn kỹ năng hoặc siêu dữ liệu tiện ích bổ trợ
- biến môi trường và quyền được khai báo
- hướng dẫn cài đặt và siêu dữ liệu gói
- các tệp đi kèm và bản kê khai tệp
- siêu dữ liệu về khả năng tương thích và năng lực

Câu hỏi chính là tính nhất quán: tên, tóm tắt, siêu dữ liệu, quyền hạn được yêu cầu và nội dung thực tế có khớp với những gì người dùng có thể kỳ vọng một cách hợp lý không?

Hành vi mạnh không tự động là xấu. Nhiều công cụ hữu ích cần thông tin xác thực, lệnh cục bộ, API nhà cung cấp hoặc cài đặt gói. Kiểm toán kiểm tra liệu quyền lực đó có được kỳ vọng, được công bố và tương xứng hay không.

Các trang tạo tác liên kết đến bản kiểm toán đầy đủ tại:

```text
/<owner>/skills/<slug>/security-audit
```

Trang kiểm toán kết hợp:

1. SkillSpector
2. VirusTotal
3. Phân tích rủi ro

## VirusTotal

ClawHub dùng VirusTotal làm đo lường từ xa về phần mềm độc hại trong ngăn xếp kiểm toán. VirusTotal là một tiêu chuẩn ngành đáng tin cậy về danh tiếng tệp và quét phần mềm độc hại, và quan hệ đối tác của chúng tôi cho phép ClawHub bổ sung thông tin tình báo bảo mật rộng hơn vào quá trình đánh giá kỹ năng và tiện ích bổ trợ.

VirusTotal đặc biệt hữu ích cho các tạo tác độc hại đã biết, kết quả khớp từ công cụ quét và tín hiệu danh tiếng bổ sung cho đánh giá có nhận thức về tác nhân của ClawHub. Khi có số lượng công cụ của nhà cung cấp, kiểm toán tóm tắt chúng bằng ngôn ngữ rõ ràng, chẳng hạn như:

```text
62/62 vendors flagged this skill as clean.
```

hoặc:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Khi ClawHub không có đo lường từ xa về số lượng nhà cung cấp để tóm tắt, kiểm toán ghi:

```text
No VirusTotal findings
```

VirusTotal vẫn là đo lường từ xa. Nó không thay thế phân tích rủi ro có nhận thức về tạo tác của chính ClawHub.

## Phân tích rủi ro

Phân tích rủi ro được vận hành nội bộ bởi ClawScan, hệ thống kiểm toán bảo mật riêng của ClawHub. Nó xem xét mỗi bản phát hành như một tạo tác hướng tới tác nhân: hướng dẫn, siêu dữ liệu, quyền được khai báo, tệp, tín hiệu năng lực, tín hiệu quét tĩnh, phát hiện của SkillSpector, đo lường từ xa của VirusTotal và ngữ cảnh do nhà xuất bản cung cấp. Tín hiệu quét tĩnh là ngữ cảnh nội bộ cho đánh giá này; chúng không phải là một phần kiểm toán công khai độc lập hay phán quyết chặn cài đặt.

Phân tích rủi ro dùng [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) làm lăng kính cho các rủi ro như chèn prompt, lạm dụng công cụ, lộ thông tin xác thực, thực thi không an toàn, đầu độc bộ nhớ hoặc ngữ cảnh, và quyền tự chủ quá mức.

ClawScan không coi một năng lực trông đáng sợ là tự động độc hại. Nó hỏi liệu năng lực đó có được công bố, phù hợp với mục đích và được hỗ trợ bởi trường hợp sử dụng đã nêu của bản phát hành hay không.
