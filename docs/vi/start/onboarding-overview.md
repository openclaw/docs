---
read_when:
    - Chọn lộ trình thiết lập ban đầu
    - Thiết lập môi trường mới
sidebarTitle: Onboarding Overview
summary: Tổng quan về các tùy chọn và quy trình thiết lập ban đầu của OpenClaw
title: Tổng quan về quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-04-29T23:14:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw có hai lộ trình hướng dẫn thiết lập ban đầu. Cả hai đều cấu hình xác thực, Gateway và
các kênh chat tùy chọn — chúng chỉ khác nhau ở cách bạn tương tác với quá trình thiết lập.

## Tôi nên dùng lộ trình nào?

|                | Hướng dẫn thiết lập ban đầu bằng CLI        | Hướng dẫn thiết lập ban đầu bằng ứng dụng macOS |
| -------------- | ------------------------------------------- | ----------------------------------------------- |
| **Nền tảng**   | macOS, Linux, Windows (native hoặc WSL2)    | Chỉ macOS                                       |
| **Giao diện**  | Trình hướng dẫn trong Terminal              | UI có hướng dẫn trong ứng dụng                  |
| **Phù hợp nhất cho** | Máy chủ, headless, toàn quyền kiểm soát | Mac để bàn, thiết lập trực quan                 |
| **Tự động hóa** | `--non-interactive` cho script             | Chỉ thủ công                                    |
| **Lệnh**       | `openclaw onboard`                          | Khởi chạy ứng dụng                              |

Hầu hết người dùng nên bắt đầu với **hướng dẫn thiết lập ban đầu bằng CLI** — nó hoạt động ở mọi nơi và cho
bạn nhiều quyền kiểm soát nhất.

## Những gì quá trình hướng dẫn thiết lập ban đầu cấu hình

Bất kể bạn chọn lộ trình nào, quá trình hướng dẫn thiết lập ban đầu sẽ thiết lập:

1. **Nhà cung cấp mô hình và xác thực** — API key, OAuth hoặc token thiết lập cho nhà cung cấp bạn chọn
2. **Workspace** — thư mục cho tệp agent, mẫu bootstrap và bộ nhớ
3. **Gateway** — cổng, địa chỉ bind, chế độ xác thực
4. **Kênh** (tùy chọn) — các kênh chat tích hợp sẵn và đi kèm như
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp và nhiều kênh khác
5. **Daemon** (tùy chọn) — dịch vụ nền để Gateway tự động khởi động

## Hướng dẫn thiết lập ban đầu bằng CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Thêm `--install-daemon` để cũng cài đặt dịch vụ nền trong một bước.

Tài liệu tham khảo đầy đủ: [Hướng dẫn thiết lập ban đầu (CLI)](/vi/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)

## Hướng dẫn thiết lập ban đầu bằng ứng dụng macOS

Mở ứng dụng OpenClaw. Trình hướng dẫn chạy lần đầu sẽ đưa bạn qua cùng các bước
bằng giao diện trực quan.

Tài liệu tham khảo đầy đủ: [Hướng dẫn thiết lập ban đầu (Ứng dụng macOS)](/vi/start/onboarding)

## Nhà cung cấp tùy chỉnh hoặc không có trong danh sách

Nếu nhà cung cấp của bạn không có trong danh sách hướng dẫn thiết lập ban đầu, hãy chọn **Nhà cung cấp tùy chỉnh** và
nhập:

- Chế độ tương thích API (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện)
- URL cơ sở và API key
- ID mô hình và bí danh tùy chọn

Nhiều endpoint tùy chỉnh có thể cùng tồn tại — mỗi endpoint có ID endpoint riêng.

## Liên quan

- [Bắt đầu](/vi/start/getting-started)
- [Tài liệu tham khảo thiết lập CLI](/vi/start/wizard-cli-reference)
