---
read_when:
    - Cấu hình các phòng nhóm hoặc kênh luôn bật
    - Bạn muốn tác tử theo dõi cuộc trò chuyện trong phòng mà không tự động đăng văn bản cuối cùng
    - Gỡ lỗi trạng thái đang nhập và mức sử dụng token khi không có tin nhắn nào hiển thị trong phòng
sidebarTitle: Ambient room events
summary: Cho phép các phòng nhóm được hỗ trợ cung cấp ngữ cảnh thụ động, trừ khi tác nhân gửi tin bằng công cụ nhắn tin
title: Sự kiện phòng xung quanh
x-i18n:
    generated_at: "2026-07-12T07:42:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Các sự kiện phòng xung quanh cho phép OpenClaw xử lý nội dung trò chuyện trong nhóm hoặc kênh không đề cập đến tác nhân như ngữ cảnh thụ động. Tác nhân có thể cập nhật bộ nhớ và trạng thái phiên, nhưng phòng vẫn im lặng trừ khi tác nhân gọi rõ ràng công cụ `message`.

Đối với các cuộc trò chuyện nhóm luôn hoạt động, hãy kết hợp `messages.groupChat.unmentionedInbound: "room_event"` với `messages.groupChat.visibleReplies: "message_tool"`. Tác nhân lắng nghe, quyết định khi nào việc trả lời là hữu ích và không còn cần mẫu lời nhắc cũ là phản hồi `NO_REPLY`.

Hiện được hỗ trợ: các kênh máy chủ Discord, các kênh và kênh riêng tư Slack, tin nhắn trực tiếp nhiều người trên Slack, cùng các nhóm hoặc siêu nhóm Telegram. Các kênh nhóm khác giữ nguyên hành vi nhóm hiện có, trừ khi trang của kênh đó cho biết chúng hỗ trợ sự kiện phòng xung quanh.

## Thiết lập đề xuất

Đặt hành vi trò chuyện nhóm toàn cục:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Sau đó, đặt phòng ở chế độ luôn hoạt động bằng cách tắt cơ chế yêu cầu đề cập cho phòng đó. Phòng vẫn phải vượt qua `groupPolicy`, danh sách cho phép phòng và danh sách cho phép người gửi thông thường.

Sau khi lưu cấu hình, Gateway áp dụng nóng các thiết lập `messages`. Chỉ khởi động lại khi tính năng theo dõi tệp hoặc tải lại cấu hình bị tắt (`gateway.reload.mode: "off"`).

## Những thay đổi

Với `messages.groupChat.unmentionedInbound: "room_event"`:

- các tin nhắn nhóm hoặc kênh được phép nhưng không đề cập sẽ trở thành sự kiện phòng thụ động
- các tin nhắn có đề cập vẫn là yêu cầu của người dùng
- các lệnh điều khiển dạng văn bản và lệnh gốc vẫn là yêu cầu của người dùng
- các yêu cầu hủy hoặc dừng vẫn là yêu cầu của người dùng
- tin nhắn trực tiếp vẫn là yêu cầu của người dùng

Sự kiện phòng sử dụng cơ chế gửi hiển thị nghiêm ngặt. Văn bản cuối cùng của trợ lý được giữ riêng tư. Tác nhân phải gọi `message(action=send)` để đăng trong phòng.

Các phản ứng trạng thái nhập liệu và vòng đời vẫn bị ẩn đối với sự kiện phòng. Ngoại lệ xác nhận rõ ràng duy nhất là `messages.ackReactionScope: "all"`, tùy chọn này gửi phản ứng xác nhận đã cấu hình; hãy dùng phạm vi hẹp hơn hoặc `"off"` khi phòng phải hoàn toàn im lặng.

## Ví dụ Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Hãy dùng cấu hình Discord theo từng kênh khi chỉ một kênh cần hoạt động ở chế độ xung quanh. Với `groupPolicy: "allowlist"`, việc liệt kê kênh là thao tác cho phép kênh đó (`enabled: false` vô hiệu hóa một mục):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Ví dụ Slack

Danh sách cho phép kênh Slack ưu tiên ID. Hãy dùng ID kênh như `C12345678`, không dùng `#channel-name`. Việc liệt kê kênh trong `channels.slack.channels` là thao tác cho phép kênh đó (`enabled: false` vô hiệu hóa một mục):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Ví dụ Telegram

Đối với các nhóm Telegram, bot phải có khả năng xem tin nhắn nhóm thông thường. Nếu `requireMention: false`, hãy tắt chế độ riêng tư của BotFather hoặc dùng một thiết lập Telegram khác có thể chuyển toàn bộ lưu lượng nhóm đến bot.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

ID nhóm Telegram thường là số âm như `-1001234567890`. Đọc `chat.id` từ `openclaw logs --follow`, chuyển tiếp tin nhắn nhóm đến một bot hỗ trợ tra cứu ID hoặc kiểm tra `getUpdates` của Bot API.

## Chính sách dành riêng cho tác nhân

Hãy dùng ghi đè tác nhân khi nhiều tác nhân dùng chung một phòng nhưng chỉ một tác nhân nên coi nội dung trò chuyện không đề cập là ngữ cảnh xung quanh:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Giá trị `agents.list[].groupChat.unmentionedInbound` dành riêng cho tác nhân sẽ ghi đè `messages.groupChat.unmentionedInbound` đối với tác nhân đó.

## Chế độ trả lời hiển thị

`messages.groupChat.visibleReplies` mặc định là `"automatic"` đối với các yêu cầu người dùng thông thường trong nhóm hoặc kênh. Hãy giữ giá trị mặc định đó khi văn bản cuối cùng của trợ lý cần được đăng công khai mà không cần gọi rõ ràng công cụ tin nhắn.

Đối với các phòng xung quanh luôn hoạt động, `messages.groupChat.visibleReplies: "message_tool"` vẫn được khuyến nghị, đặc biệt khi dùng các mô hình thế hệ mới nhất có khả năng gọi công cụ đáng tin cậy như GPT-5.6 Sol. Thiết lập này cho phép tác nhân quyết định khi nào cần lên tiếng bằng cách gọi công cụ tin nhắn. Nếu mô hình trả về văn bản cuối cùng mà không gọi công cụ, OpenClaw sẽ giữ văn bản cuối cùng đó ở chế độ riêng tư và ghi nhật ký siêu dữ liệu về việc gửi bị chặn.

Sự kiện phòng vẫn tuân thủ nghiêm ngặt ngay cả khi các yêu cầu nhóm khác dùng trả lời tự động. Các sự kiện phòng xung quanh không đề cập luôn yêu cầu `message(action=send)` để tạo đầu ra hiển thị.

## Lịch sử

`messages.groupChat.historyLimit` đặt giá trị mặc định toàn cục cho lịch sử nhóm (50 khi không được đặt; phải là số nguyên dương). Các kênh có thể ghi đè giá trị này bằng `channels.<channel>.historyLimit`, và một số kênh cũng hỗ trợ giới hạn lịch sử theo từng tài khoản. Đặt `historyLimit: 0` ở cấp kênh để tắt ngữ cảnh lịch sử nhóm cho kênh đó.

Các kênh hỗ trợ sự kiện phòng giữ lại những tin nhắn phòng xung quanh gần đây làm ngữ cảnh. Telegram duy trì một cửa sổ cuộn luôn hoạt động cho từng nhóm, được giới hạn bởi `historyLimit`; các lượt yêu cầu của người dùng chọn những mục sau phản hồi gần nhất đã ghi nhận của bot, còn các lượt sự kiện phòng nhận toàn bộ cửa sổ gần đây để mô hình có thể thấy các bài đăng gần đây của chính nó. Khóa chế độ Telegram đã ngừng sử dụng `includeGroupHistoryContext` được `openclaw doctor --fix` loại bỏ.

## Khắc phục sự cố

Nếu phòng hiển thị trạng thái đang nhập hoặc mức sử dụng token nhưng không có tin nhắn hiển thị:

1. Xác nhận phòng được danh sách cho phép của kênh và danh sách cho phép người gửi chấp thuận.
2. Xác nhận `requireMention: false` được đặt ở đúng cấp phòng mong muốn.
3. Kiểm tra xem `messages.groupChat.unmentionedInbound` hoặc giá trị ghi đè của tác nhân có phải là `"room_event"` hay không.
4. Kiểm tra nhật ký để tìm siêu dữ liệu về tải trọng cuối cùng bị chặn hoặc `didSendViaMessagingTool: false`.
5. Đối với các yêu cầu nhóm thông thường, hãy giữ hoặc khôi phục `messages.groupChat.visibleReplies: "automatic"` nếu bạn muốn các phản hồi cuối cùng được đăng tự động. Đối với các phòng xung quanh dùng `message_tool`, hãy sử dụng mô hình hoặc môi trường chạy có khả năng gọi công cụ đáng tin cậy.

Nếu các phòng xung quanh trên Telegram hoàn toàn không kích hoạt, hãy kiểm tra chế độ riêng tư của BotFather và xác minh Gateway đang nhận được các tin nhắn nhóm thông thường.

Nếu các phòng xung quanh trên Slack không kích hoạt, hãy xác minh khóa kênh là ID kênh Slack và ứng dụng có phạm vi quyền lịch sử dành cho loại phòng đó: `channels:history` (công khai), `groups:history` (riêng tư) hoặc `mpim:history` (tin nhắn trực tiếp nhiều người).

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Discord](/vi/channels/discord)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Tham chiếu cấu hình kênh](/vi/gateway/config-channels)
