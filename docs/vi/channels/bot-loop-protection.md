---
read_when:
    - Cấu hình tin nhắn kênh do bot tạo
    - Điều chỉnh cơ chế bảo vệ vòng lặp giữa các bot
sidebarTitle: Bot loop protection
summary: Mặc định bảo vệ vòng lặp bot-với-bot và ghi đè kênh
title: Bảo vệ vòng lặp bot
x-i18n:
    generated_at: "2026-06-27T17:09:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Bảo vệ chống vòng lặp bot

OpenClaw có thể chấp nhận tin nhắn do bot khác viết trên các kênh hỗ trợ `allowBots`.
Khi đường dẫn đó được bật, cơ chế bảo vệ vòng lặp theo cặp ngăn hai danh tính bot
trả lời lẫn nhau vô thời hạn.

Bộ bảo vệ được thực thi bởi trình chạy trả lời đến của lõi. Mỗi kênh hỗ trợ
ánh xạ sự kiện đến của riêng mình thành các dữ kiện chung: tài khoản hoặc phạm vi, id cuộc trò chuyện,
id bot gửi và id bot nhận. Sau đó lõi theo dõi cặp người tham gia theo cả hai
hướng, áp dụng ngân sách cửa sổ trượt và chặn cặp đó trong thời gian
hạ nhiệt sau khi vượt quá ngân sách.

## Mặc định

Bảo vệ chống vòng lặp theo cặp hoạt động khi một kênh cho phép tin nhắn do bot tạo đi tới
điều phối. Các mặc định tích hợp là:

- `maxEventsPerWindow: 20` - một cặp bot có thể trao đổi 20 sự kiện trong cửa sổ
- `windowSeconds: 60` - độ dài cửa sổ trượt
- `cooldownSeconds: 60` - thời gian chặn sau khi cặp vượt quá ngân sách

Bộ bảo vệ không ảnh hưởng đến tin nhắn thông thường do con người tạo, triển khai một bot,
lọc tin nhắn tự gửi, hoặc các trả lời bot một lần vẫn nằm dưới ngân sách.

## Cấu hình mặc định dùng chung

Đặt `channels.defaults.botLoopProtection` một lần để cung cấp cho mọi kênh hỗ trợ
cùng một đường cơ sở. Ghi đè theo kênh và tài khoản vẫn có thể tinh chỉnh từng
bề mặt riêng lẻ.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Chỉ đặt `enabled: false` khi chính sách kênh của bạn cố ý cho phép
các cuộc trò chuyện bot với bot mà không có cơ chế chặn tự động.

## Ghi đè theo kênh hoặc tài khoản

Các kênh hỗ trợ xếp lớp cấu hình riêng lên trên mặc định dùng chung. Thứ tự ưu tiên là:

- `channels.<channel>.<room-or-space>.botLoopProtection`, khi kênh hỗ trợ ghi đè theo cuộc trò chuyện
- `channels.<channel>.accounts.<account>.botLoopProtection`, khi kênh hỗ trợ tài khoản
- `channels.<channel>.botLoopProtection`, khi kênh hỗ trợ mặc định cấp cao nhất
- `channels.defaults.botLoopProtection`
- mặc định tích hợp

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## Hỗ trợ kênh

- Discord: dữ kiện `author.bot` gốc, được lập khóa theo tài khoản Discord, kênh và cặp bot.
- Slack: dữ kiện `bot_id` gốc cho tin nhắn do bot tạo được chấp nhận, được lập khóa theo tài khoản Slack, kênh và cặp bot.
- Matrix: tài khoản bot Matrix đã cấu hình, được lập khóa theo tài khoản Matrix, phòng và cặp bot đã cấu hình.
- Google Chat: dữ kiện `sender.type=BOT` gốc cho tin nhắn do bot tạo được chấp nhận, được lập khóa theo tài khoản, không gian và cặp bot.

Các kênh không cung cấp danh tính bot đến đáng tin cậy sẽ tiếp tục sử dụng
bộ lọc tin nhắn tự gửi và chính sách truy cập thông thường của chúng. Chúng không nên tham gia
bộ bảo vệ này cho đến khi có thể xác định cả hai bên tham gia trong cặp bot.

Xem [SDK runtime](/vi/plugins/sdk-runtime#reusable-runtime-utilities) để biết chi tiết triển khai
Plugin.
