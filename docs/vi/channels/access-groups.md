---
read_when:
    - Cấu hình cùng một danh sách cho phép trên nhiều kênh nhắn tin
    - Chia sẻ quy tắc truy cập cho người gửi trong tin nhắn trực tiếp và nhóm
    - Rà soát kiểm soát truy cập của kênh nhắn tin
summary: Danh sách cho phép người gửi có thể tái sử dụng cho các kênh nhắn tin
title: Nhóm truy cập
x-i18n:
    generated_at: "2026-07-12T07:42:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Nhóm truy cập là các danh sách người gửi có tên mà bạn định nghĩa một lần trong `accessGroups` và tham chiếu từ danh sách cho phép của kênh bằng `accessGroup:<name>`.

Hãy sử dụng chúng khi cùng một nhóm người cần được cho phép trên nhiều kênh nhắn tin, hoặc khi một nhóm đáng tin cậy cần áp dụng cho cả việc cấp quyền người gửi trong tin nhắn trực tiếp và nhóm.

Bản thân một nhóm không cấp bất kỳ quyền nào. Nhóm chỉ có hiệu lực tại nơi một trường danh sách cho phép tham chiếu đến nó.

## Nhóm người gửi tin nhắn tĩnh

Nhóm người gửi tĩnh sử dụng `type: "message.senders"`. `members` được lập chỉ mục theo mã định danh kênh nhắn tin, cùng với `"*"` dành cho các mục được chia sẻ với mọi kênh:

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

| Khóa                       | Ý nghĩa                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `"*"`                      | Các mục dùng chung được kiểm tra cho mọi kênh nhắn tin tham chiếu đến nhóm.             |
| `discord`, `telegram`, ... | Các mục chỉ được kiểm tra khi đối chiếu với danh sách cho phép của kênh tương ứng.       |

Các mục được đối chiếu theo quy tắc `allowFrom` thông thường của kênh đích. OpenClaw không chuyển đổi mã định danh người gửi giữa các kênh: nếu Alice có một mã định danh Telegram và một mã định danh Discord, hãy liệt kê cả hai mã định danh dưới các khóa kênh tương ứng.

## Tham chiếu nhóm từ danh sách cho phép

Tham chiếu một nhóm bằng `accessGroup:<name>` ở bất kỳ nơi nào đường dẫn kênh nhắn tin hỗ trợ danh sách cho phép người gửi.

Ví dụ về danh sách cho phép tin nhắn trực tiếp:

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

Ví dụ về danh sách cho phép người gửi trong nhóm:

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
      groups: {
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

## Các đường dẫn kênh nhắn tin được hỗ trợ

Nhóm truy cập hoạt động trong các đường dẫn cấp quyền dùng chung của kênh nhắn tin:

- Danh sách cho phép người gửi tin nhắn trực tiếp, chẳng hạn như `channels.<channel>.allowFrom`
- Danh sách cho phép người gửi trong nhóm, chẳng hạn như `channels.<channel>.groupAllowFrom`
- Danh sách cho phép người gửi theo từng phòng dành riêng cho kênh, sử dụng cùng quy tắc đối chiếu người gửi (ví dụ: Google Chat `groups.<space>.users`)
- Các đường dẫn cấp quyền lệnh tái sử dụng danh sách cho phép người gửi của kênh nhắn tin

Mức hỗ trợ phụ thuộc vào việc kênh đó có được kết nối qua các trình trợ giúp cấp quyền người gửi dùng chung của OpenClaw hay không. Các kênh tích hợp hiện được hỗ trợ gồm ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo và Zalo Personal. Các nhóm `message.senders` tĩnh không phụ thuộc vào kênh, vì vậy các kênh nhắn tin mới có thể sử dụng chúng bằng cách dùng các trình trợ giúp tiếp nhận chung của SDK Plugin thay vì tự triển khai việc mở rộng danh sách cho phép.

## Đối tượng kênh Discord

Discord cũng hỗ trợ một loại nhóm truy cập động:

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

`discord.channelAudience` có nghĩa là “cho phép những người gửi tin nhắn trực tiếp trên Discord hiện có thể xem kênh máy chủ này”. OpenClaw phân giải người gửi thông qua Discord tại thời điểm cấp quyền và áp dụng các quy tắc quyền `ViewChannel` của Discord. `membership` là tùy chọn và mặc định là `canViewChannel`.

Hãy sử dụng loại này khi một kênh Discord đã là nguồn dữ liệu chuẩn cho một nhóm, chẳng hạn như `#maintainers` hoặc `#on-call`.

Yêu cầu và hành vi khi xảy ra lỗi:

- Bot cần có quyền truy cập vào máy chủ và kênh.
- Bot cần bật **Server Members Intent** trong Discord Developer Portal.
- Nhóm truy cập mặc định từ chối khi Discord trả về `Missing Access`, không thể phân giải người gửi thành thành viên của máy chủ, hoặc kênh thuộc một máy chủ khác.

Các ví dụ khác dành riêng cho Discord: [Kiểm soát truy cập Discord](/vi/channels/discord#access-control-and-routing)

## Chẩn đoán Plugin

Tác giả Plugin có thể kiểm tra trạng thái nhóm truy cập có cấu trúc mà không cần mở rộng trở lại thành một danh sách cho phép phẳng:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Kết quả báo cáo các nhóm được tham chiếu, khớp, bị thiếu, không được hỗ trợ và gặp lỗi. Hãy dùng kết quả này cho mục đích chẩn đoán hoặc kiểm thử tính tuân thủ. Chỉ sử dụng `expandAllowFromWithAccessGroups(...)` cho các đường dẫn tương thích vẫn yêu cầu một mảng `allowFrom` phẳng.

## Lưu ý bảo mật

- Nhóm truy cập là bí danh của danh sách cho phép, không phải vai trò. Bản thân chúng không tạo chủ sở hữu, phê duyệt yêu cầu ghép nối hoặc cấp quyền công cụ.
- `dmPolicy: "open"` vẫn yêu cầu `"*"` trong danh sách cho phép tin nhắn trực tiếp có hiệu lực. Tham chiếu một nhóm truy cập không đồng nghĩa với truy cập công khai.
- Tên nhóm bị thiếu sẽ mặc định bị từ chối. Nếu `allowFrom` chứa `accessGroup:operators` nhưng không có `accessGroups.operators`, mục đó không cấp quyền cho bất kỳ ai.
- Giữ mã định danh kênh ổn định. Ưu tiên mã định danh dạng số hoặc mã định danh người dùng hơn tên hiển thị khi kênh hỗ trợ cả hai.

## Khắc phục sự cố

Nếu một người gửi lẽ ra phải khớp nhưng lại bị chặn:

1. Xác nhận trường danh sách cho phép chứa chính xác tham chiếu `accessGroup:<name>`.
2. Xác nhận `accessGroups.<name>.type` là chính xác.
3. Xác nhận mã định danh người gửi được liệt kê dưới khóa kênh tương ứng hoặc dưới `"*"`.
4. Xác nhận mục đó sử dụng cú pháp danh sách cho phép thông thường của kênh.
5. Đối với đối tượng kênh Discord, xác nhận bot có thể xem kênh máy chủ và đã bật Server Members Intent.

Chạy `openclaw doctor` sau khi chỉnh sửa cấu hình kiểm soát truy cập. Lệnh này phát hiện nhiều tổ hợp danh sách cho phép và chính sách không hợp lệ trước khi chạy.
