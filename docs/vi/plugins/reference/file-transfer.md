---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin truyền tệp
summary: Tìm nạp, liệt kê và ghi tệp trên các Node đã ghép nối thông qua các lệnh Node chuyên dụng. Tránh việc đầu ra chuẩn của bash bị cắt ngắn bằng cách sử dụng base64 qua `node.invoke` cho các tệp nhị phân có dung lượng tối đa 16 MB.
title: Plugin truyền tệp
x-i18n:
    generated_at: "2026-07-12T08:09:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin truyền tệp

Tải về, liệt kê và ghi tệp trên các Node đã ghép đôi thông qua các lệnh dành riêng cho Node. Tránh việc đầu ra chuẩn của bash bị cắt ngắn bằng cách sử dụng base64 qua `node.invoke` cho các tệp nhị phân có kích thước tối đa 16 MB.

## Phân phối

- Gói: `@openclaw/file-transfer`
- Phương thức cài đặt: được tích hợp trong OpenClaw

## Bề mặt

hợp đồng: công cụ
