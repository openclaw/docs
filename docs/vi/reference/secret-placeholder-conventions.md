---
read_when:
    - Viết tài liệu có chứa token, khóa API hoặc đoạn mã thông tin xác thực
    - Đang cập nhật các ví dụ có thể được công cụ phát hiện bí mật quét
summary: Quy ước placeholder an toàn với trình quét bí mật cho tài liệu và ví dụ
title: Quy ước về phần giữ chỗ bí mật
x-i18n:
    generated_at: "2026-06-27T18:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Quy ước placeholder cho bí mật

Sử dụng placeholder mà con người có thể đọc được nhưng không giống bí mật thật.

## Kiểu khuyến nghị

- Ưu tiên các giá trị mô tả như `example-openai-key-not-real` hoặc `example-discord-bot-token`.
- Với đoạn mã shell, ưu tiên `${OPENAI_API_KEY}` thay vì chuỗi nội tuyến giống token.
- Giữ ví dụ rõ ràng là giả và giới hạn theo mục đích (nhà cung cấp, kênh, loại xác thực).

## Tránh các mẫu này trong tài liệu

- Văn bản header hoặc footer khóa riêng tư PEM nguyên văn.
- Tiền tố giống thông tin xác thực đang hoạt động, ví dụ `sk-...`, `xoxb-...`, `AKIA...`.
- Bearer token trông thực tế được sao chép từ nhật ký runtime.

## Ví dụ

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
