---
read_when:
    - Cấu hình cùng một danh sách cho phép trên nhiều kênh nhắn tin
    - Chia sẻ quy tắc truy cập của người gửi DM và nhóm
    - Đánh giá kiểm soát truy cập kênh tin nhắn
summary: Danh sách cho phép người gửi có thể tái sử dụng cho các kênh nhắn tin
title: Nhóm truy cập
x-i18n:
    generated_at: "2026-05-02T10:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Nhóm truy cập là danh sách người gửi được đặt tên mà bạn định nghĩa một lần và tham chiếu từ danh sách cho phép của kênh bằng `accessGroup:<name>`.

Dùng chúng khi cùng một nhóm người cần được cho phép trên nhiều kênh tin nhắn, hoặc khi một tập hợp đáng tin cậy cần áp dụng cho cả DM và ủy quyền người gửi trong nhóm.

Nhóm truy cập không tự cấp quyền truy cập. Một nhóm chỉ có ý nghĩa khi một trường danh sách cho phép tham chiếu đến nó.

## Nhóm người gửi tin nhắn tĩnh

Nhóm người gửi tĩnh dùng `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Danh sách thành viên được khóa theo id kênh tin nhắn:

| Khóa       | Ý nghĩa                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Các mục dùng chung được kiểm tra cho mọi kênh tin nhắn tham chiếu đến nhóm. |
| `discord`  | Các mục chỉ được kiểm tra cho khớp danh sách cho phép Discord.          |
| `telegram` | Các mục chỉ được kiểm tra cho khớp danh sách cho phép Telegram.         |
| `whatsapp` | Các mục chỉ được kiểm tra cho khớp danh sách cho phép WhatsApp.         |

Các mục được khớp bằng các quy tắc `allowFrom` thông thường của kênh đích. OpenClaw không chuyển đổi id người gửi giữa các kênh. Nếu Alice có một id Telegram và một id Discord, hãy liệt kê cả hai id dưới các khóa phù hợp.

## Tham chiếu nhóm từ danh sách cho phép

Tham chiếu một nhóm bằng `accessGroup:<name>` ở bất kỳ đâu đường dẫn kênh tin nhắn hỗ trợ danh sách cho phép người gửi.

Ví dụ danh sách cho phép DM:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Ví dụ danh sách cho phép người gửi trong nhóm:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Bạn có thể kết hợp nhóm và các mục trực tiếp:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Đường dẫn kênh tin nhắn được hỗ trợ

Nhóm truy cập có sẵn trong các đường dẫn ủy quyền kênh tin nhắn dùng chung, bao gồm:

- danh sách cho phép người gửi DM như `channels.<channel>.allowFrom`
- danh sách cho phép người gửi trong nhóm như `channels.<channel>.groupAllowFrom`
- danh sách cho phép người gửi theo từng phòng, riêng cho từng kênh, sử dụng cùng các quy tắc khớp người gửi
- đường dẫn ủy quyền lệnh tái sử dụng danh sách cho phép người gửi của kênh tin nhắn

Hỗ trợ kênh phụ thuộc vào việc kênh đó có được nối qua các trình trợ giúp ủy quyền người gửi dùng chung của OpenClaw hay không. Hỗ trợ tích hợp hiện tại bao gồm Discord, Google Chat, Nostr, WhatsApp, Zalo và Zalo Personal. Nhóm `message.senders` tĩnh được thiết kế để không phụ thuộc vào kênh, vì vậy các kênh tin nhắn mới nên hỗ trợ chúng bằng cách dùng các trình trợ giúp plugin SDK dùng chung thay vì mở rộng danh sách cho phép tùy chỉnh.

## Đối tượng kênh Discord

Discord cũng hỗ trợ một kiểu nhóm truy cập động:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` nghĩa là "cho phép người gửi DM Discord hiện có thể xem kênh guild này." OpenClaw phân giải người gửi qua Discord tại thời điểm ủy quyền và áp dụng các quy tắc quyền `ViewChannel` của Discord.

Dùng kiểu này khi một kênh Discord đã là nguồn sự thật cho một đội, chẳng hạn như `#maintainers` hoặc `#on-call`.

Yêu cầu và hành vi khi lỗi:

- Bot cần quyền truy cập vào guild và kênh.
- Bot cần **Server Members Intent** trong Discord Developer Portal.
- Nhóm truy cập từ chối an toàn khi Discord trả về `Missing Access`, người gửi không thể được phân giải là thành viên guild, hoặc kênh thuộc về một guild khác.

Ví dụ riêng cho Discord khác: [Kiểm soát truy cập Discord](/vi/channels/discord#access-control-and-routing)

## Ghi chú bảo mật

- Nhóm truy cập là bí danh danh sách cho phép, không phải vai trò. Chúng không tạo chủ sở hữu, phê duyệt yêu cầu ghép nối, hoặc tự cấp quyền công cụ.
- `dmPolicy: "open"` vẫn yêu cầu `"*"` trong danh sách cho phép DM hiệu dụng. Tham chiếu một nhóm truy cập không giống với truy cập công khai.
- Tên nhóm bị thiếu sẽ bị từ chối an toàn. Nếu `allowFrom` chứa `accessGroup:operators` và không có `accessGroups.operators`, mục đó không ủy quyền cho ai.
- Giữ id kênh ổn định. Ưu tiên id số/người dùng thay vì tên hiển thị khi kênh hỗ trợ cả hai.

## Khắc phục sự cố

Nếu một người gửi đáng lẽ phải khớp nhưng bị chặn:

1. Xác nhận trường danh sách cho phép chứa tham chiếu `accessGroup:<name>` chính xác.
2. Xác nhận `accessGroups.<name>.type` là đúng.
3. Xác nhận id người gửi được liệt kê dưới khóa kênh khớp, hoặc dưới `"*"`.
4. Xác nhận mục dùng cú pháp danh sách cho phép thông thường của kênh đó.
5. Với đối tượng kênh Discord, xác nhận bot có thể thấy kênh guild và đã bật Server Members Intent.

Chạy `openclaw doctor` sau khi chỉnh sửa cấu hình kiểm soát truy cập. Lệnh này phát hiện nhiều tổ hợp danh sách cho phép và chính sách không hợp lệ trước thời gian chạy.
