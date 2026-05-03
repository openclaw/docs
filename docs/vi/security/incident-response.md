---
read_when:
    - Ứng phó với báo cáo bảo mật hoặc sự cố bảo mật nghi ngờ
    - Chuẩn bị công bố phối hợp hoặc bản phát hành bảo mật đã vá lỗi
    - Rà soát các kỳ vọng về theo dõi sau sự cố
summary: Cách OpenClaw phân loại, ứng phó và theo dõi sau các sự cố bảo mật
title: Ứng phó sự cố
x-i18n:
    generated_at: "2026-05-03T21:36:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Ứng phó sự cố

## 1. Phát hiện và phân loại

Chúng tôi theo dõi các tín hiệu bảo mật từ:

- GitHub Security Advisories (GHSA) và các báo cáo lỗ hổng riêng tư.
- Các issue/thảo luận công khai trên GitHub khi báo cáo không nhạy cảm.
- Tín hiệu tự động (ví dụ Dependabot, CodeQL, thông báo npm và quét bí mật).

Phân loại ban đầu:

1. Xác nhận thành phần, phiên bản bị ảnh hưởng và tác động đến ranh giới tin cậy.
2. Phân loại là vấn đề bảo mật hay tăng cường/không cần hành động bằng phạm vi và quy tắc ngoài phạm vi trong `SECURITY.md` của kho lưu trữ.
3. Một chủ sở hữu sự cố phản hồi tương ứng.

## 2. Đánh giá

Hướng dẫn mức độ nghiêm trọng:

- **Nghiêm trọng:** Gói/bản phát hành/kho lưu trữ bị xâm phạm, đang bị khai thác, hoặc vượt qua ranh giới tin cậy không cần xác thực với khả năng kiểm soát hoặc lộ dữ liệu có tác động cao.
- **Cao:** Vượt qua ranh giới tin cậy đã được xác minh, yêu cầu ít điều kiện tiên quyết (ví dụ hành động có tác động cao đã xác thực nhưng không được ủy quyền), hoặc lộ thông tin xác thực nhạy cảm do OpenClaw sở hữu.
- **Trung bình:** Điểm yếu bảo mật đáng kể có tác động thực tế nhưng khả năng khai thác bị giới hạn hoặc cần các điều kiện tiên quyết đáng kể.
- **Thấp:** Phát hiện tăng cường phòng thủ nhiều lớp, từ chối dịch vụ phạm vi hẹp, hoặc khoảng cách tăng cường/tương đương mà chưa chứng minh được việc vượt qua ranh giới tin cậy.

## 3. Phản hồi

1. Xác nhận đã nhận với người báo cáo (riêng tư khi nhạy cảm).
2. Tái hiện trên các bản phát hành được hỗ trợ và `main` mới nhất, sau đó triển khai và xác thực bản vá với phạm vi kiểm thử hồi quy.
3. Đối với sự cố nghiêm trọng/cao, chuẩn bị bản phát hành đã vá nhanh nhất có thể trên thực tế.
4. Đối với sự cố trung bình/thấp, vá trong luồng phát hành bình thường và ghi tài liệu hướng dẫn giảm thiểu.

## 4. Truyền thông

Chúng tôi truyền thông qua:

- GitHub Security Advisories trong kho lưu trữ bị ảnh hưởng.
- Ghi chú phát hành/mục changelog cho các phiên bản đã sửa.
- Theo dõi trực tiếp với người báo cáo về trạng thái và cách giải quyết.

Chính sách công bố:

- Sự cố nghiêm trọng/cao nên được công bố phối hợp, kèm cấp CVE khi phù hợp.
- Các phát hiện tăng cường có rủi ro thấp có thể được ghi tài liệu trong ghi chú phát hành hoặc advisories mà không có CVE, tùy theo tác động và mức độ phơi nhiễm của người dùng.

## 5. Khôi phục và theo dõi

Sau khi phát hành bản sửa:

1. Xác minh các biện pháp khắc phục trong CI và tạo tác phát hành.
2. Thực hiện một buổi rà soát ngắn sau sự cố (dòng thời gian, nguyên nhân gốc, khoảng trống phát hiện, kế hoạch phòng ngừa).
3. Thêm các tác vụ tăng cường/kiểm thử/tài liệu theo dõi và theo dõi đến khi hoàn tất.
