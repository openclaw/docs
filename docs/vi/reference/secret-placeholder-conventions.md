---
read_when:
    - Viết tài liệu có chứa token, khóa API hoặc đoạn thông tin xác thực
    - Cập nhật các ví dụ có thể được công cụ phát hiện bí mật quét qua
summary: Quy ước về phần giữ chỗ an toàn trước trình quét bí mật cho tài liệu và ví dụ
title: Quy ước về phần giữ chỗ cho bí mật
x-i18n:
    generated_at: "2026-07-12T08:24:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Quy ước về phần giữ chỗ cho thông tin bí mật

Sử dụng các phần giữ chỗ dễ đọc nhưng không giống thông tin bí mật thật.

## Kiểu được khuyến nghị

- Ưu tiên các giá trị mang tính mô tả như `example-openai-key-not-real` hoặc `example-discord-bot-token`.
- Đối với các đoạn mã shell, ưu tiên `${OPENAI_API_KEY}` thay vì các chuỗi nội tuyến trông giống token.
- Đảm bảo các ví dụ rõ ràng là giả và phù hợp với mục đích cụ thể (nhà cung cấp, kênh, loại xác thực).

## Tránh các mẫu này trong tài liệu

- Văn bản đầu hoặc cuối khóa riêng tư PEM ở dạng nguyên văn.
- Các tiền tố giống thông tin xác thực đang hoạt động, ví dụ: `sk-...`, `xoxb-...`, `AKIA...`.
- Các bearer token trông như thật được sao chép từ nhật ký thời gian chạy.

## Ví dụ

```bash
# Tốt
export OPENAI_API_KEY="example-openai-key-not-real"

# Tốt hơn (khi tài liệu nói về cách kết nối biến môi trường)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
