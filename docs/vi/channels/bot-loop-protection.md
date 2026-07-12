---
read_when:
    - Cấu hình tin nhắn trong kênh do bot tạo
    - Tinh chỉnh cơ chế bảo vệ chống vòng lặp giữa các bot
sidebarTitle: Bot loop protection
summary: Các thiết lập mặc định bảo vệ vòng lặp giữa các bot và tùy chỉnh theo kênh
title: Bảo vệ chống vòng lặp bot
x-i18n:
    generated_at: "2026-07-12T07:38:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw có thể chấp nhận tin nhắn do các bot khác gửi trên những kênh hỗ trợ `allowBots`. Khi đường xử lý này được bật, cơ chế bảo vệ vòng lặp theo cặp sẽ ngăn hai danh tính bot liên tục trả lời lẫn nhau vô thời hạn.

Cơ chế bảo vệ được thực thi bởi trình chạy phản hồi đầu vào cốt lõi. Mỗi kênh hỗ trợ ánh xạ sự kiện đầu vào thành các thông tin chung: tài khoản hoặc phạm vi, mã định danh cuộc trò chuyện, mã định danh bot gửi và mã định danh bot nhận. Phần lõi theo dõi cặp bên tham gia theo cả hai chiều (A đến B và B đến A được tính là cùng một cặp), áp dụng hạn mức theo cửa sổ trượt và chặn cặp đó trong thời gian tạm ngưng sau khi vượt quá hạn mức.

## Giá trị mặc định

Cơ chế bảo vệ vòng lặp theo cặp hoạt động bất cứ khi nào một kênh cho phép tin nhắn do bot gửi được chuyển đến bộ điều phối. Các giá trị mặc định tích hợp:

| Khóa                 | Mặc định | Ý nghĩa                                                     |
| -------------------- | -------- | ----------------------------------------------------------- |
| `enabled`            | `true`   | Bật cơ chế bảo vệ cho các kênh hỗ trợ tính năng này.         |
| `maxEventsPerWindow` | `20`     | Số sự kiện một cặp bot có thể trao đổi trong cửa sổ.         |
| `windowSeconds`      | `60`     | Độ dài cửa sổ trượt.                                        |
| `cooldownSeconds`    | `60`     | Thời gian chặn sau khi cặp bot vượt quá hạn mức.             |

Cơ chế bảo vệ không ảnh hưởng đến tin nhắn do con người gửi, các triển khai chỉ có một bot, việc lọc tin nhắn tự gửi hoặc phản hồi của bot vẫn nằm trong hạn mức.

## Cấu hình các giá trị mặc định dùng chung

Đặt `channels.defaults.botLoopProtection` một lần để cung cấp cùng một cấu hình cơ sở cho mọi kênh hỗ trợ. Các cấu hình ghi đè theo kênh, tài khoản và phòng vẫn có thể tinh chỉnh từng phạm vi riêng lẻ.

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

Chỉ đặt `enabled: false` khi chính sách kênh của bạn chủ ý cho phép các cuộc trò chuyện giữa các bot mà không tự động chặn.

## Ghi đè theo kênh, tài khoản hoặc phòng

Các kênh hỗ trợ áp dụng cấu hình riêng lên giá trị mặc định dùng chung theo từng khóa. Thứ tự ưu tiên, từ phạm vi hẹp nhất:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, khi kênh hỗ trợ ghi đè theo từng cuộc trò chuyện
2. `channels.<channel>.accounts.<account>.botLoopProtection`, khi kênh hỗ trợ tài khoản
3. `channels.<channel>.botLoopProtection`, khi kênh hỗ trợ giá trị mặc định cấp cao nhất
4. `channels.defaults.botLoopProtection`
5. các giá trị mặc định tích hợp

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
          allowBots: "mentions",
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

- Discord: thông tin `author.bot` gốc, được phân loại theo tài khoản Discord, kênh và cặp bot.
- Google Chat: thông tin `sender.type=BOT` gốc cho các tin nhắn do bot gửi đã được chấp nhận, được phân loại theo tài khoản, không gian và cặp bot.
- Matrix: các tài khoản bot Matrix đã cấu hình, được phân loại theo tài khoản Matrix, phòng và cặp bot đã cấu hình.
- Slack: thông tin `bot_id` gốc cho các tin nhắn do bot gửi đã được chấp nhận, được phân loại theo tài khoản Slack, kênh và cặp bot.

Các kênh không cung cấp danh tính bot đầu vào đáng tin cậy tiếp tục sử dụng các bộ lọc thông thường về tin nhắn tự gửi và chính sách truy cập. Các kênh này không nên bật cơ chế bảo vệ này cho đến khi có thể xác định cả hai bên tham gia trong cặp bot.

Xem [môi trường chạy SDK](/vi/plugins/sdk-runtime#reusable-runtime-utilities) để biết chi tiết triển khai Plugin.
