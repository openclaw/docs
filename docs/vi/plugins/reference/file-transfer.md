---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin truyền tệp
summary: Tìm nạp, liệt kê và ghi tệp trên các nút đã ghép đôi thông qua các lệnh Node chuyên dụng. Bỏ qua việc cắt ngắn stdout của bash bằng cách dùng base64 qua node.invoke cho các tệp nhị phân có dung lượng tối đa 16 MB.
title: Plugin truyền tệp
x-i18n:
    generated_at: "2026-05-02T20:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plugin Truyền tệp

Lấy, liệt kê và ghi tệp trên các nút đã ghép nối thông qua các lệnh nút chuyên dụng. Tránh việc cắt ngắn stdout của bash bằng cách dùng base64 qua node.invoke cho các tệp nhị phân có dung lượng tối đa 16 MB.

## Phân phối

- Gói: `@openclaw/file-transfer`
- Tuyến cài đặt: được bao gồm trong OpenClaw

## Bề mặt

hợp đồng: công cụ
