---
read_when:
    - Cấu hình tin nhắn kênh do bot tạo
    - Tinh chỉnh cơ chế bảo vệ chống vòng lặp giữa các bot
sidebarTitle: Bot loop protection
summary: Các giá trị mặc định bảo vệ khỏi vòng lặp bot-với-bot và các ghi đè theo kênh
title: Bảo vệ chống vòng lặp bot
x-i18n:
    generated_at: "2026-07-19T05:36:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d59d3b48dd5506e774282b880334df8970b05c4d001261ff7107e8e1678894db
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw có thể chấp nhận tin nhắn do các bot khác gửi trên những kênh hỗ trợ `allowBots`. Khi đường dẫn đó được bật, cơ chế bảo vệ khỏi vòng lặp theo cặp sẽ ngăn hai danh tính bot phản hồi lẫn nhau vô thời hạn.

Cơ chế bảo vệ được thực thi bởi trình chạy phản hồi đến của lõi. Mỗi kênh hỗ trợ ánh xạ sự kiện đến thành các thông tin chung: tài khoản hoặc phạm vi, mã định danh cuộc trò chuyện, mã định danh bot gửi và mã định danh bot nhận. Lõi theo dõi cặp bên tham gia theo cả hai hướng (A đến B và B đến A được tính là cùng một cặp), áp dụng hạn mức theo cửa sổ trượt và chặn cặp đó trong một khoảng thời gian chờ sau khi vượt quá hạn mức.

## Giá trị mặc định

Cơ chế bảo vệ khỏi vòng lặp theo cặp hoạt động bất cứ khi nào một kênh cho phép tin nhắn do bot gửi được chuyển đến bộ điều phối. Các giá trị mặc định tích hợp sẵn:

| Khóa                 | Mặc định | Ý nghĩa                                             |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | Cơ chế bảo vệ hoạt động đối với các kênh hỗ trợ.    |
| `maxEventsPerWindow` | `20`    | Số sự kiện một cặp bot có thể trao đổi trong cửa sổ. |
| `windowSeconds`      | `60`    | Độ dài cửa sổ trượt.                                |
| `cooldownSeconds`    | `60`    | Thời gian chặn sau khi cặp vượt quá hạn mức.        |

Cơ chế bảo vệ không ảnh hưởng đến tin nhắn do con người gửi, các triển khai chỉ có một bot, bộ lọc tin nhắn tự gửi hoặc các phản hồi của bot vẫn nằm trong hạn mức.

## Cấu hình giá trị mặc định dùng chung

Đặt `channels.defaults.botLoopProtection` một lần để cung cấp cùng một đường cơ sở cho mọi kênh hỗ trợ. Các kênh cũng có thể cung cấp những giá trị ghi đè có phạm vi hẹp hơn; Feishu chủ ý chỉ sử dụng đường cơ sở dùng chung này.

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

Chỉ đặt `enabled: false` khi chính sách kênh của bạn chủ ý cho phép các cuộc trò chuyện giữa bot với bot mà không tự động chặn.

## Ghi đè theo kênh, tài khoản hoặc phòng

Các kênh hỗ trợ xếp lớp cấu hình riêng lên giá trị mặc định dùng chung, theo từng khóa. Thứ tự ưu tiên, phạm vi hẹp nhất trước:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, khi kênh hỗ trợ ghi đè theo từng cuộc trò chuyện
2. `channels.<channel>.accounts.<account>.botLoopProtection`, khi kênh hỗ trợ tài khoản
3. `channels.<channel>.botLoopProtection`, khi kênh hỗ trợ giá trị mặc định cấp cao nhất
4. `channels.defaults.botLoopProtection`
5. các giá trị mặc định tích hợp sẵn

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
        secondary: {
          allowBots: true,
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Kênh được hỗ trợ

- Discord: thông tin `author.bot` gốc, được định khóa theo tài khoản Discord, kênh và cặp bot.
- Feishu: thông tin `sender_type=bot` gốc cho các tin nhắn nhóm do bot gửi đã được chấp nhận, được định khóa theo tài khoản Feishu, cuộc trò chuyện và cặp bot. Feishu chỉ sử dụng `channels.defaults.botLoopProtection`.
- Google Chat: thông tin `sender.type=BOT` gốc cho các tin nhắn do bot gửi đã được chấp nhận, được định khóa theo tài khoản, không gian và cặp bot.
- Matrix: các tài khoản bot Matrix đã cấu hình, được định khóa theo tài khoản Matrix, phòng và cặp bot đã cấu hình.
- Slack: thông tin `bot_id` gốc cho các tin nhắn do bot gửi đã được chấp nhận, được định khóa theo tài khoản Slack, kênh và cặp bot.

Các kênh không cung cấp danh tính bot gửi đến đáng tin cậy tiếp tục sử dụng bộ lọc tin nhắn tự gửi và chính sách truy cập thông thường. Các kênh đó không nên sử dụng cơ chế bảo vệ này cho đến khi có thể xác định cả hai bên tham gia trong cặp bot.

Xem [môi trường chạy SDK](/vi/plugins/sdk-runtime#reusable-runtime-utilities) để biết chi tiết triển khai Plugin.
