---
read_when:
    - Chọn lộ trình thiết lập ban đầu
    - Thiết lập môi trường mới
sidebarTitle: Onboarding Overview
summary: Tổng quan về các tùy chọn và quy trình thiết lập ban đầu của OpenClaw
title: Tổng quan về quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-05-10T19:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw có hai lộ trình thiết lập ban đầu. Cả hai đều cấu hình xác thực, Gateway và
các kênh trò chuyện tùy chọn — chúng chỉ khác nhau ở cách bạn tương tác với quá trình thiết lập.

## Tôi nên dùng lộ trình nào?

|                | Thiết lập ban đầu qua CLI              | Thiết lập ban đầu qua ứng dụng macOS |
| -------------- | -------------------------------------- | ------------------------------------ |
| **Nền tảng**   | macOS, Linux, Windows (gốc hoặc WSL2)  | Chỉ macOS                            |
| **Giao diện**  | Trình hướng dẫn trong terminal         | Giao diện người dùng có hướng dẫn trong ứng dụng |
| **Phù hợp nhất cho** | Máy chủ, không giao diện, toàn quyền kiểm soát | Mac để bàn, thiết lập trực quan |
| **Tự động hóa** | `--non-interactive` cho script        | Chỉ thủ công                         |
| **Lệnh**       | `openclaw onboard`                     | Khởi chạy ứng dụng                   |

Hầu hết người dùng nên bắt đầu với **thiết lập ban đầu qua CLI** — lộ trình này hoạt động ở mọi nơi và cho
bạn nhiều quyền kiểm soát nhất.

## Thiết lập ban đầu cấu hình những gì

Bất kể bạn chọn lộ trình nào, thiết lập ban đầu sẽ thiết lập:

1. **Nhà cung cấp mô hình và xác thực** — khóa API, OAuth hoặc token thiết lập cho nhà cung cấp bạn chọn
2. **Không gian làm việc** — thư mục cho tệp agent, mẫu khởi tạo và bộ nhớ
3. **Gateway** — cổng, địa chỉ bind, chế độ xác thực
4. **Kênh** (tùy chọn) — các kênh trò chuyện tích hợp sẵn và đi kèm như
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp và nhiều kênh khác
5. **Daemon** (tùy chọn) — dịch vụ nền để Gateway tự động khởi động

## Thiết lập ban đầu qua CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Thêm `--install-daemon` để cũng cài đặt dịch vụ nền trong một bước.

Tham chiếu đầy đủ: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)

## Thiết lập ban đầu qua ứng dụng macOS

Mở ứng dụng OpenClaw. Trình hướng dẫn lần chạy đầu tiên sẽ dẫn bạn qua các bước tương tự
bằng giao diện trực quan.

Tham chiếu đầy đủ: [Thiết lập ban đầu (Ứng dụng macOS)](/vi/start/onboarding)

## Nhà cung cấp tùy chỉnh hoặc không được liệt kê

Nếu nhà cung cấp của bạn không có trong danh sách thiết lập ban đầu, hãy chọn **Nhà cung cấp tùy chỉnh** và
nhập:

- Chế độ tương thích API (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện)
- URL cơ sở và khóa API
- ID mô hình và bí danh tùy chọn

Nhiều điểm cuối tùy chỉnh có thể cùng tồn tại — mỗi điểm cuối có ID điểm cuối riêng.

## Liên quan

- [Bắt đầu](/vi/start/getting-started)
- [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference)
