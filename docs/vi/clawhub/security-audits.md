---
read_when:
    - Tìm hiểu kết quả kiểm tra bảo mật ClawHub
    - Quyết định nên cài đặt skill hay plugin
    - Giải thích trạng thái kiểm tra ClawHub, mức độ rủi ro hoặc các phát hiện
sidebarTitle: Security Audits
summary: Cách hiểu kết quả kiểm tra bảo mật ClawHub trước khi cài đặt một kỹ năng hoặc Plugin.
title: Kiểm toán bảo mật
x-i18n:
    generated_at: "2026-07-04T20:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Kiểm tra bảo mật

Các kiểm tra bảo mật của ClawHub giúp bạn quyết định liệu một kỹ năng hoặc Plugin có đủ an toàn
để cài đặt hay không. Chúng cho biết một bản phát hành làm gì, yêu cầu quyền hạn nào và
liệu có điều gì cần chú ý thêm trước khi nó có thể truy cập tệp, tài khoản,
thông tin xác thực, mã hoặc dịch vụ bên ngoài hay không.

Kiểm tra là tín hiệu an toàn mạnh, nhưng không đảm bảo rằng một bản phát hành
hoàn toàn không có rủi ro. Luôn tự đánh giá trước khi cấp quyền truy cập nhạy cảm.

Xem thêm [Bảo mật](/clawhub/security), [Cách sử dụng được chấp nhận](/clawhub/acceptable-usage),
và [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation).

## Những gì cần kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy xem xét:

- trạng thái kiểm tra tổng thể
- mức độ rủi ro
- mọi phát hiện được liệt kê
- thông tin xác thực, quyền hoặc biến môi trường bắt buộc
- chủ sở hữu, nguồn, phiên bản, nhật ký thay đổi, lượt tải xuống, sao và các tín hiệu tin cậy khác

Chỉ cài đặt nội dung bạn hiểu và tin tưởng.

## Trạng thái kiểm tra

Trạng thái kiểm tra cho bạn biết cách phản ứng với kết quả kiểm tra:

| Trạng thái  | Ý nghĩa                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| `Pass`      | Không tìm thấy vấn đề hiển thị nào trên mức rủi ro thấp.                       |
| `Review`    | Đọc các phát hiện trước khi cài đặt. Bản phát hành vẫn có thể hợp lệ.          |
| `Warn`      | Hãy đặc biệt thận trọng. ClawHub đã phát hiện mối quan ngại có tác động cao hoặc tín hiệu cảnh báo. |
| `Malicious` | Không cài đặt.                                                                 |
| `Pending`   | Các kiểm tra chưa hoàn tất.                                                    |
| `Error`     | Không thể hoàn tất kiểm tra.                                                   |

`Pass` là tín hiệu đáng yên tâm, nhưng không thay thế cho đánh giá của chính bạn. Điều này quan trọng
nhất đối với các công cụ có thể xuất bản nội dung, chỉnh sửa dữ liệu, chạy lệnh, đọc tệp hoặc
truy cập hệ thống sản xuất.

## Mức độ rủi ro

Mức độ rủi ro mô tả phạm vi tác động: bản phát hành dường như có bao nhiêu quyền lực nếu
bạn sử dụng nó đúng mục đích.

| Mức độ rủi ro | Ý nghĩa                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `Low`         | Tìm thấy rất ít quyền hạn nhạy cảm hoặc tác động đến người dùng.              |
| `Medium`      | Bản phát hành có quyền hạn đáng kể, chẳng hạn như truy cập tài khoản hoặc thay đổi dữ liệu. |
| `High`        | Bản phát hành có quyền hạn tác động cao, phát hiện nghiêm trọng hoặc tín hiệu độc hại. |

Mức độ rủi ro và trạng thái kiểm tra trả lời các câu hỏi khác nhau:

- Mức độ rủi ro hỏi: "Ở đây có bao nhiêu quyền lực?"
- Trạng thái kiểm tra hỏi: "Tôi nên làm gì với kết quả này?"

Ví dụ, một kỹ năng xuất bản có thể hiển thị `Review` với rủi ro `Medium`. Điều đó
không có nghĩa là nó độc hại. Nó có nghĩa là kỹ năng này có vẻ phù hợp với mục đích, nhưng có thể
hành động với quyền hạn tài khoản đáng kể.

## Phát hiện

Phát hiện giải thích lý do một kết quả kiểm tra được hiển thị. Mỗi phát hiện thường bao gồm:

- ý nghĩa của nó
- lý do nó bị gắn cờ
- nội dung kỹ năng hoặc Plugin liên quan
- một khuyến nghị

Phát hiện có thể được gắn nhãn `Info`, `Low`, `Medium`, `High` hoặc `Critical`. Các phát hiện có
mức độ nghiêm trọng cao hơn đóng góp mạnh hơn vào mức độ rủi ro và trạng thái kiểm tra.

Các phát hiện có độ tin cậy thấp được ẩn khỏi bản tổng hợp kiểm tra công khai để trang
luôn tập trung vào bằng chứng hữu ích.

## ClawHub kiểm tra những gì

ClawHub kiểm tra các hiện vật bản phát hành đã gửi, bao gồm:

- hướng dẫn kỹ năng hoặc siêu dữ liệu plugin
- biến môi trường và quyền được khai báo
- hướng dẫn cài đặt và siêu dữ liệu gói
- các tệp được bao gồm và bản kê khai tệp
- siêu dữ liệu về tính tương thích và năng lực

Câu hỏi chính là tính nhất quán: tên, tóm tắt, siêu dữ liệu, quyền hạn được yêu cầu
và nội dung thực tế có khớp với những gì người dùng có thể kỳ vọng một cách hợp lý không?

Hành vi mạnh không tự động là xấu. Nhiều công cụ hữu ích cần thông tin xác thực,
lệnh cục bộ, API nhà cung cấp hoặc cài đặt gói. Quá trình kiểm tra xem xét liệu
quyền năng đó có được kỳ vọng, được công bố và tương xứng hay không.

Các trang hiện vật liên kết đến bản kiểm tra đầy đủ tại:

```text
/<owner>/skills/<slug>/security-audit
```

Trang kiểm tra kết hợp:

1. SkillSpector
2. VirusTotal
3. Phân tích rủi ro

## VirusTotal

ClawHub dùng VirusTotal làm phép đo từ xa về phần mềm độc hại trong ngăn xếp kiểm tra. VirusTotal là một
tiêu chuẩn ngành đáng tin cậy về uy tín tệp và quét phần mềm độc hại, và quan hệ
đối tác của chúng tôi cho phép ClawHub bổ sung thông tin tình báo bảo mật rộng hơn vào quá trình
đánh giá kỹ năng và plugin.

VirusTotal đặc biệt hữu ích đối với các hiện vật độc hại đã biết, các lượt phát hiện của công cụ và
tín hiệu uy tín bổ sung cho đánh giá nhận biết tác tử của ClawHub. Khi có số lượng
công cụ của nhà cung cấp, bản kiểm tra sẽ tóm tắt chúng bằng ngôn ngữ dễ hiểu, chẳng
hạn như:

```text
62/62 vendors flagged this skill as clean.
```

hoặc:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Khi ClawHub không có phép đo từ xa về số lượng nhà cung cấp để tóm tắt, bản kiểm tra ghi:

```text
No VirusTotal findings
```

VirusTotal vẫn là phép đo từ xa. Nó không thay thế phân tích rủi ro nhận biết
hiện vật của riêng ClawHub.

## Phân tích rủi ro

Phân tích rủi ro được vận hành nội bộ bởi ClawScan, hệ thống kiểm tra bảo mật
riêng của ClawHub. Hệ thống này xem xét mỗi bản phát hành như một hiện vật hướng đến tác tử: hướng dẫn,
siêu dữ liệu, quyền được khai báo, tệp, tín hiệu năng lực, tín hiệu quét tĩnh,
phát hiện của SkillSpector, phép đo từ xa của VirusTotal và ngữ cảnh do nhà phát hành cung cấp.
Tín hiệu quét tĩnh là ngữ cảnh nội bộ cho đánh giá này; chúng không phải là một
mục kiểm tra công khai độc lập hay phán quyết chặn cài đặt.

Phân tích rủi ro sử dụng
[Top 10 Skills tác tử của OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
làm lăng kính cho các rủi ro như tiêm prompt, lạm dụng công cụ, lộ thông tin xác thực,
thực thi không an toàn, đầu độc bộ nhớ hoặc ngữ cảnh, và mức tự chủ quá mức.

ClawScan không xem một năng lực trông đáng sợ là tự động độc hại.
Nó đặt câu hỏi liệu năng lực đó có được công bố, phù hợp với mục đích và được hỗ trợ bởi
trường hợp sử dụng đã nêu của bản phát hành hay không.
