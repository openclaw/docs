---
read_when:
    - Bạn muốn đóng góp các phát hiện bảo mật hoặc các kịch bản đe dọa
    - Rà soát hoặc cập nhật mô hình mối đe dọa
summary: Cách đóng góp cho mô hình mối đe dọa của OpenClaw
title: Đóng góp vào mô hình mối đe dọa
x-i18n:
    generated_at: "2026-07-12T08:21:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS) là một tài liệu được cập nhật liên tục. Mọi người đều được chào đón đóng góp; bạn không cần có kiến thức nền tảng về bảo mật hoặc MITRE ATLAS.

<Note>
Nội dung này dành cho việc bổ sung vào mô hình mối đe dọa, không phải để báo cáo các lỗ hổng đang tồn tại. Nếu bạn phát hiện một lỗ hổng có thể bị khai thác, hãy làm theo hướng dẫn tiết lộ có trách nhiệm trên [trang Tin cậy](https://trust.openclaw.ai).
</Note>

## Các cách đóng góp

**Thêm một mối đe dọa.** Mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues), mô tả kịch bản tấn công bằng lời của bạn. Các thông tin sau hữu ích nhưng không bắt buộc:

- Kịch bản tấn công và cách kẻ tấn công có thể khai thác.
- Những thành phần bị ảnh hưởng (CLI, Gateway, các kênh, ClawHub, máy chủ MCP, v.v.).
- Ước tính của bạn về mức độ nghiêm trọng (thấp / trung bình / cao / nghiêm trọng).
- Liên kết đến các nghiên cứu, CVE hoặc ví dụ thực tế có liên quan.

Các nhà bảo trì sẽ chỉ định ánh xạ ATLAS, mã mối đe dọa và mức độ rủi ro trong quá trình xem xét.

**Đề xuất biện pháp giảm thiểu.** Mở một issue hoặc PR có tham chiếu đến mối đe dọa. Hãy cụ thể và có tính khả thi: "giới hạn tốc độ theo từng người gửi ở mức 10 tin nhắn/phút tại Gateway" hữu ích hơn "triển khai giới hạn tốc độ."

**Đề xuất một chuỗi tấn công.** Chuỗi tấn công cho thấy cách nhiều mối đe dọa kết hợp thành một kịch bản thực tế. Hãy mô tả các bước và cách kẻ tấn công xâu chuỗi chúng; một đoạn tường thuật ngắn hiệu quả hơn một mẫu biểu chính thức.

**Sửa hoặc cải thiện nội dung hiện có.** Lỗi chính tả, nội dung làm rõ, thông tin lỗi thời, ví dụ tốt hơn: hoan nghênh các PR, không cần mở issue.

## Tham chiếu khung

Các mối đe dọa được ánh xạ tới [MITRE ATLAS](https://atlas.mitre.org/) (Bối cảnh Mối đe dọa Đối kháng dành cho Hệ thống AI), một khung dành cho các mối đe dọa đặc thù của AI/ML như chèn prompt, lạm dụng công cụ và khai thác tác nhân. Bạn không cần biết ATLAS để đóng góp; các nhà bảo trì sẽ ánh xạ nội dung gửi lên trong quá trình xem xét.

**Mã mối đe dọa.** Mỗi mối đe dọa nhận một mã như `T-EXEC-003`, do các nhà bảo trì chỉ định trong quá trình xem xét.

| Mã      | Danh mục                                      |
| ------- | --------------------------------------------- |
| RECON   | Trinh sát - thu thập thông tin                |
| ACCESS  | Truy cập ban đầu - giành quyền xâm nhập       |
| EXEC    | Thực thi - tiến hành các hành động độc hại    |
| PERSIST | Duy trì hiện diện - giữ quyền truy cập         |
| EVADE   | Né tránh phòng vệ - tránh bị phát hiện        |
| DISC    | Khám phá - tìm hiểu về môi trường             |
| EXFIL   | Đánh cắp dữ liệu - đưa dữ liệu ra ngoài       |
| IMPACT  | Tác động - gây thiệt hại hoặc gián đoạn       |

**Mức độ rủi ro.** Nếu bạn không chắc về mức độ, chỉ cần mô tả tác động; các nhà bảo trì sẽ đánh giá.

| Mức độ          | Ý nghĩa                                                              |
| --------------- | -------------------------------------------------------------------- |
| **Nghiêm trọng** | Toàn bộ hệ thống bị xâm phạm hoặc khả năng cao + tác động nghiêm trọng |
| **Cao**          | Có khả năng gây thiệt hại đáng kể hoặc khả năng trung bình + tác động nghiêm trọng |
| **Trung bình**   | Rủi ro vừa phải hoặc khả năng thấp + tác động cao                    |
| **Thấp**         | Ít có khả năng xảy ra và tác động hạn chế                            |

## Quy trình xem xét

1. **Phân loại** - các nội dung mới gửi lên được xem xét trong vòng 48 giờ.
2. **Đánh giá** - các nhà bảo trì xác minh tính khả thi, chỉ định ánh xạ ATLAS và mã mối đe dọa, đồng thời xác thực mức độ rủi ro.
3. **Hoàn thiện tài liệu** - kiểm tra định dạng và tính đầy đủ.
4. **Hợp nhất** - thêm vào mô hình mối đe dọa và phần trực quan hóa.

## Tài nguyên

- [Trang web ATLAS](https://atlas.mitre.org/)
- [Các kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Các nghiên cứu tình huống ATLAS](https://atlas.mitre.org/studies/)

## Liên hệ

- **Lỗ hổng bảo mật:** xem hướng dẫn báo cáo trên [trang Tin cậy](https://trust.openclaw.ai) hoặc gửi email đến `security@openclaw.ai`.
- **Câu hỏi về mô hình mối đe dọa:** mở một issue trên [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Trò chuyện chung:** kênh Discord `#security`.

## Ghi nhận

Những người đóng góp cho mô hình mối đe dọa được ghi nhận trong phần cảm ơn của mô hình mối đe dọa, ghi chú phát hành và bảng vinh danh bảo mật của OpenClaw đối với các đóng góp đáng kể.

## Liên quan

- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Ứng phó sự cố](/vi/security/incident-response)
- [Xác minh hình thức](/vi/security/formal-verification)
