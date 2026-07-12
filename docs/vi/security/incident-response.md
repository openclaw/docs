---
read_when:
    - Ứng phó với báo cáo bảo mật hoặc sự cố bảo mật bị nghi ngờ
    - Chuẩn bị công bố phối hợp hoặc bản phát hành bảo mật đã được vá
    - Rà soát các yêu cầu theo dõi sau sự cố
summary: Cách OpenClaw phân loại, ứng phó và theo dõi các sự cố bảo mật
title: Ứng phó sự cố
x-i18n:
    generated_at: "2026-07-12T08:21:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Phát hiện và phân loại

Các tín hiệu bảo mật đến từ:

- Cảnh báo bảo mật GitHub (GHSA) và báo cáo lỗ hổng riêng tư.
- Vấn đề/thảo luận công khai trên GitHub khi báo cáo không chứa thông tin nhạy cảm.
- Tín hiệu tự động: Dependabot, CodeQL, cảnh báo npm, quét thông tin bí mật.

Phân loại ban đầu:

1. Xác nhận thành phần và phiên bản bị ảnh hưởng, cũng như tác động đến ranh giới tin cậy.
2. Phân loại là sự cố bảo mật hay trường hợp tăng cường bảo mật/không cần hành động, dựa trên các quy tắc về phạm vi và ngoài phạm vi trong `SECURITY.md`.
3. Người phụ trách sự cố phản hồi tương ứng.

## 2. Mức độ nghiêm trọng

| Mức độ   | Định nghĩa                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nghiêm trọng | Gói/bản phát hành/kho lưu trữ bị xâm phạm, đang bị khai thác chủ động hoặc ranh giới tin cậy bị vượt qua mà không cần xác thực, cho phép kiểm soát có tác động lớn hoặc làm lộ dữ liệu.         |
| Cao      | Đã xác minh việc vượt qua ranh giới tin cậy với các điều kiện tiên quyết hạn chế (ví dụ: đã xác thực nhưng thực hiện hành động có tác động lớn mà không được cấp quyền), hoặc làm lộ thông tin xác thực nhạy cảm do OpenClaw quản lý. |
| Trung bình | Điểm yếu bảo mật đáng kể có tác động thực tế nhưng khả năng khai thác bị hạn chế hoặc đòi hỏi nhiều điều kiện tiên quyết.                                                                     |
| Thấp     | Phát hiện thuộc lớp phòng vệ chiều sâu, từ chối dịch vụ trong phạm vi hẹp hoặc thiếu sót về tăng cường bảo mật/tính tương đương mà chưa chứng minh được việc vượt qua ranh giới tin cậy.        |

## 3. Ứng phó

1. Xác nhận đã nhận báo cáo với người báo cáo (trao đổi riêng khi có thông tin nhạy cảm).
2. Tái hiện trên các bản phát hành được hỗ trợ và `main` mới nhất, sau đó triển khai và xác thực bản vá với phạm vi kiểm thử hồi quy.
3. Mức nghiêm trọng/cao: chuẩn bị các bản phát hành đã vá nhanh nhất có thể trong thực tế.
4. Mức trung bình/thấp: đưa bản vá vào quy trình phát hành thông thường và ghi lại hướng dẫn giảm thiểu.

## 4. Truyền thông và công bố

Trao đổi thông qua Cảnh báo bảo mật GitHub trong kho lưu trữ bị ảnh hưởng, ghi chú phát hành/mục nhật ký thay đổi cho các phiên bản đã sửa và liên hệ trực tiếp với người báo cáo về trạng thái và kết quả xử lý.

Các sự cố mức nghiêm trọng/cao được công bố có phối hợp và cấp CVE khi phù hợp. Các phát hiện tăng cường bảo mật có rủi ro thấp có thể được ghi lại trong ghi chú phát hành hoặc cảnh báo mà không cần CVE, tùy theo tác động và mức độ ảnh hưởng đến người dùng.

## 5. Khôi phục và theo dõi

Sau khi phát hành bản sửa lỗi:

1. Xác minh các biện pháp khắc phục trong CI và các tạo phẩm phát hành.
2. Thực hiện đánh giá ngắn sau sự cố: dòng thời gian, nguyên nhân gốc rễ, thiếu sót trong phát hiện và kế hoạch phòng ngừa.
3. Bổ sung các tác vụ tăng cường bảo mật/kiểm thử/tài liệu tiếp theo và theo dõi cho đến khi hoàn tất.

## Liên quan

- [Chính sách bảo mật](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — phạm vi báo cáo và mô hình tin cậy.
- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
