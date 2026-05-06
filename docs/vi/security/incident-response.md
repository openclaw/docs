---
read_when:
    - Ứng phó với báo cáo bảo mật hoặc sự cố bảo mật nghi ngờ
    - Chuẩn bị công bố phối hợp hoặc bản phát hành bảo mật đã vá lỗi
    - Xem xét các kỳ vọng về hoạt động theo dõi sau sự cố
summary: Cách OpenClaw phân loại, ứng phó và theo dõi sau các sự cố bảo mật
title: Ứng phó sự cố
x-i18n:
    generated_at: "2026-05-06T09:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Phát hiện và phân loại

Chúng tôi giám sát các tín hiệu bảo mật từ:

- GitHub Security Advisories (GHSA) và báo cáo lỗ hổng riêng tư.
- Issue/thảo luận GitHub công khai khi báo cáo không nhạy cảm.
- Tín hiệu tự động (ví dụ Dependabot, CodeQL, khuyến cáo npm và quét bí mật).

Phân loại ban đầu:

1. Xác nhận thành phần, phiên bản bị ảnh hưởng và tác động đến ranh giới tin cậy.
2. Phân loại là vấn đề bảo mật hay gia cố/không cần hành động bằng cách dùng phạm vi và quy tắc ngoài phạm vi trong `SECURITY.md` của kho lưu trữ.
3. Chủ sở hữu sự cố phản hồi tương ứng.

## 2. Đánh giá

Hướng dẫn mức độ nghiêm trọng:

- **Nghiêm trọng:** Xâm phạm gói/bản phát hành/kho lưu trữ, đang bị khai thác, hoặc vượt qua ranh giới tin cậy không cần xác thực với khả năng kiểm soát hoặc lộ dữ liệu có tác động cao.
- **Cao:** Vượt qua ranh giới tin cậy đã được xác minh và yêu cầu ít điều kiện tiên quyết (ví dụ hành động có tác động cao đã xác thực nhưng không được ủy quyền), hoặc lộ thông tin xác thực nhạy cảm do OpenClaw sở hữu.
- **Trung bình:** Điểm yếu bảo mật đáng kể có tác động thực tế nhưng khả năng khai thác bị giới hạn hoặc cần nhiều điều kiện tiên quyết đáng kể.
- **Thấp:** Phát hiện theo hướng phòng thủ nhiều lớp, từ chối dịch vụ trong phạm vi hẹp, hoặc khoảng cách gia cố/tương đương mà chưa chứng minh được việc vượt qua ranh giới tin cậy.

## 3. Phản hồi

1. Xác nhận đã nhận báo cáo với người báo cáo (riêng tư khi nhạy cảm).
2. Tái hiện trên các bản phát hành được hỗ trợ và `main` mới nhất, sau đó triển khai và xác thực bản vá với phạm vi kiểm thử hồi quy.
3. Đối với sự cố nghiêm trọng/cao, chuẩn bị bản phát hành đã vá nhanh nhất có thể trong thực tế.
4. Đối với sự cố trung bình/thấp, vá trong luồng phát hành thông thường và ghi lại hướng dẫn giảm thiểu.

## 4. Trao đổi

Chúng tôi trao đổi qua:

- GitHub Security Advisories trong kho lưu trữ bị ảnh hưởng.
- Ghi chú phát hành/mục nhật ký thay đổi cho các phiên bản đã sửa.
- Theo dõi trực tiếp với người báo cáo về trạng thái và cách giải quyết.

Chính sách tiết lộ:

- Sự cố nghiêm trọng/cao nên được tiết lộ có phối hợp, kèm việc cấp CVE khi phù hợp.
- Các phát hiện gia cố rủi ro thấp có thể được ghi lại trong ghi chú phát hành hoặc khuyến cáo mà không cần CVE, tùy theo tác động và mức độ phơi nhiễm của người dùng.

## 5. Khôi phục và theo dõi

Sau khi phát hành bản sửa:

1. Xác minh biện pháp khắc phục trong CI và hiện vật phát hành.
2. Thực hiện một bài đánh giá ngắn sau sự cố (dòng thời gian, nguyên nhân gốc rễ, khoảng trống phát hiện, kế hoạch phòng ngừa).
3. Thêm các tác vụ theo dõi về gia cố/kiểm thử/tài liệu và theo dõi đến khi hoàn tất.
