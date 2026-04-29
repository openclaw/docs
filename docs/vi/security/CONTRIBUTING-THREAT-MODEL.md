---
read_when:
    - Bạn muốn đóng góp các phát hiện bảo mật hoặc kịch bản mối đe dọa
    - Xem xét hoặc cập nhật mô hình mối đe dọa
summary: Cách đóng góp cho mô hình mối đe dọa của OpenClaw
title: Đóng góp cho mô hình mối đe dọa
x-i18n:
    generated_at: "2026-04-29T23:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Đóng góp cho Mô hình mối đe dọa OpenClaw

Cảm ơn bạn đã giúp OpenClaw an toàn hơn. Mô hình mối đe dọa này là một tài liệu sống và chúng tôi hoan nghênh đóng góp từ bất kỳ ai - bạn không cần phải là chuyên gia bảo mật.

## Cách đóng góp

### Thêm một mối đe dọa

Phát hiện một hướng tấn công hoặc rủi ro mà chúng tôi chưa đề cập? Hãy mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues) và mô tả bằng lời của bạn. Bạn không cần biết bất kỳ framework nào hoặc điền mọi trường - chỉ cần mô tả kịch bản.

**Nên bao gồm (nhưng không bắt buộc):**

- Kịch bản tấn công và cách nó có thể bị khai thác
- Những phần nào của OpenClaw bị ảnh hưởng (CLI, Gateway, kênh, ClawHub, máy chủ MCP, v.v.)
- Bạn nghĩ mức độ nghiêm trọng của nó như thế nào (thấp / trung bình / cao / nghiêm trọng)
- Bất kỳ liên kết nào đến nghiên cứu liên quan, CVE hoặc ví dụ thực tế

Chúng tôi sẽ xử lý việc ánh xạ ATLAS, ID mối đe dọa và đánh giá rủi ro trong quá trình rà soát. Nếu bạn muốn thêm những chi tiết đó thì rất tốt - nhưng chúng tôi không kỳ vọng điều đó.

> **Phần này dùng để thêm vào mô hình mối đe dọa, không phải để báo cáo lỗ hổng đang tồn tại.** Nếu bạn đã tìm thấy một lỗ hổng có thể khai thác, hãy xem [trang Trust](https://trust.openclaw.ai) của chúng tôi để biết hướng dẫn công bố có trách nhiệm.

### Đề xuất biện pháp giảm thiểu

Có ý tưởng về cách xử lý một mối đe dọa hiện có? Hãy mở một issue hoặc PR tham chiếu đến mối đe dọa đó. Biện pháp giảm thiểu hữu ích cần cụ thể và có thể hành động - ví dụ: "giới hạn tốc độ theo từng người gửi ở mức 10 tin nhắn/phút tại Gateway" tốt hơn "triển khai giới hạn tốc độ."

### Đề xuất chuỗi tấn công

Chuỗi tấn công cho thấy cách nhiều mối đe dọa kết hợp thành một kịch bản tấn công thực tế. Nếu bạn thấy một tổ hợp nguy hiểm, hãy mô tả các bước và cách kẻ tấn công sẽ liên kết chúng với nhau. Một phần tường thuật ngắn về cách cuộc tấn công diễn ra trong thực tế có giá trị hơn một mẫu biểu trang trọng.

### Sửa hoặc cải thiện nội dung hiện có

Lỗi chính tả, phần cần làm rõ, thông tin lỗi thời, ví dụ tốt hơn - chúng tôi hoan nghênh PR, không cần issue.

## Chúng tôi sử dụng gì

### MITRE ATLAS

Mô hình mối đe dọa này được xây dựng trên [MITRE ATLAS](https://atlas.mitre.org/) (Bối cảnh mối đe dọa đối kháng cho hệ thống AI), một framework được thiết kế riêng cho các mối đe dọa AI/ML như tiêm prompt, lạm dụng công cụ và khai thác agent. Bạn không cần biết ATLAS để đóng góp - chúng tôi ánh xạ các nội dung gửi lên vào framework trong quá trình rà soát.

### ID mối đe dọa

Mỗi mối đe dọa nhận một ID như `T-EXEC-003`. Các danh mục là:

| Mã      | Danh mục                                      |
| ------- | --------------------------------------------- |
| RECON   | Trinh sát - thu thập thông tin                |
| ACCESS  | Truy cập ban đầu - giành quyền vào hệ thống   |
| EXEC    | Thực thi - chạy các hành động độc hại         |
| PERSIST | Duy trì - duy trì quyền truy cập              |
| EVADE   | Né tránh phòng thủ - tránh bị phát hiện       |
| DISC    | Khám phá - tìm hiểu về môi trường             |
| EXFIL   | Rò rỉ dữ liệu - đánh cắp dữ liệu              |
| IMPACT  | Tác động - gây thiệt hại hoặc gián đoạn       |

ID được maintainer gán trong quá trình rà soát. Bạn không cần chọn một ID.

### Mức rủi ro

| Mức độ        | Ý nghĩa                                                            |
| ------------- | ------------------------------------------------------------------ |
| **Nghiêm trọng** | Xâm phạm toàn bộ hệ thống, hoặc khả năng cao + tác động nghiêm trọng |
| **Cao**       | Có khả năng gây thiệt hại đáng kể, hoặc khả năng trung bình + tác động nghiêm trọng |
| **Trung bình** | Rủi ro vừa phải, hoặc khả năng thấp + tác động cao                |
| **Thấp**      | Khó xảy ra và tác động hạn chế                                    |

Nếu bạn không chắc về mức rủi ro, chỉ cần mô tả tác động và chúng tôi sẽ đánh giá.

## Quy trình rà soát

1. **Phân loại** - Chúng tôi rà soát các nội dung gửi mới trong vòng 48 giờ
2. **Đánh giá** - Chúng tôi xác minh tính khả thi, gán ánh xạ ATLAS và ID mối đe dọa, xác thực mức rủi ro
3. **Tài liệu hóa** - Chúng tôi đảm bảo mọi thứ được định dạng và hoàn chỉnh
4. **Hợp nhất** - Thêm vào mô hình mối đe dọa và phần trực quan hóa

## Tài nguyên

- [Trang web ATLAS](https://atlas.mitre.org/)
- [Kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Nghiên cứu tình huống ATLAS](https://atlas.mitre.org/studies/)
- [Mô hình mối đe dọa OpenClaw](/vi/security/THREAT-MODEL-ATLAS)

## Liên hệ

- **Lỗ hổng bảo mật:** Xem [trang Trust](https://trust.openclaw.ai) của chúng tôi để biết hướng dẫn báo cáo
- **Câu hỏi về mô hình mối đe dọa:** Mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Trò chuyện chung:** Kênh Discord #security

## Ghi nhận

Những người đóng góp cho mô hình mối đe dọa được ghi nhận trong phần lời cảm ơn của mô hình mối đe dọa, ghi chú phát hành và bảng vinh danh bảo mật OpenClaw cho các đóng góp quan trọng.

## Liên quan

- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Xác minh hình thức](/vi/security/formal-verification)
