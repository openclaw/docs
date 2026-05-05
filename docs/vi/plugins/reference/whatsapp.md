---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin WhatsApp
summary: Thêm giao diện kênh WhatsApp để gửi và nhận tin nhắn OpenClaw.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

Thêm giao diện kênh WhatsApp để gửi và nhận tin nhắn OpenClaw.

## Phân phối

- Gói: `@openclaw/whatsapp`
- Phương thức cài đặt: npm; ClawHub

## Giao diện

channels: whatsapp

## Ghi chú cài đặt trên Windows

Trên Windows, Plugin WhatsApp cần Git có trong `PATH` trong quá trình cài đặt npm vì một trong các phụ thuộc Baileys/libsignal của nó được tải từ URL git. Cài đặt Git for Windows, sau đó khởi động lại shell và chạy lại lệnh cài đặt:

```powershell
winget install --id Git.Git -e
```

Portable Git cũng hoạt động nếu thư mục `bin` của nó có trong `PATH`.

## Tài liệu liên quan

- [whatsapp](/vi/channels/whatsapp)
