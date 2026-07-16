---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin truyền tệp
summary: Tìm nạp, liệt kê và ghi tệp trên các Node đã ghép nối thông qua các lệnh Node chuyên dụng. Tránh tình trạng đầu ra chuẩn của bash bị cắt ngắn bằng cách sử dụng base64 qua `node.invoke` cho các tệp nhị phân có dung lượng tối đa 16 MB.
title: Plugin truyền tệp
x-i18n:
    generated_at: "2026-07-16T14:47:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin truyền tệp

Tìm nạp, liệt kê và ghi tệp trên các Node đã ghép đôi thông qua các lệnh Node chuyên dụng. Tránh việc đầu ra chuẩn của bash bị cắt ngắn bằng cách sử dụng base64 qua node.invoke cho các tệp nhị phân có dung lượng tối đa 16 MB.

## Phân phối

- Gói: `@openclaw/file-transfer`
- Phương thức cài đặt: được tích hợp trong OpenClaw

## Bề mặt

hợp đồng: `tools`
