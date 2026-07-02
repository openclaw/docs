---
read_when:
    - Định cấu hình phòng nhóm hoặc kênh luôn bật
    - Bạn muốn agent theo dõi cuộc trò chuyện trong phòng mà không tự động đăng văn bản cuối cùng.
    - Gỡ lỗi thao tác nhập và mức sử dụng token khi không có tin nhắn phòng hiển thị
sidebarTitle: Ambient room events
summary: Cho phép các phòng nhóm được hỗ trợ cung cấp ngữ cảnh thầm lặng trừ khi agent gửi bằng công cụ nhắn tin
title: Sự kiện môi trường trong phòng
x-i18n:
    generated_at: "2026-07-02T17:39:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Sự kiện phòng nền cho phép OpenClaw xử lý cuộc trò chuyện nhóm hoặc kênh không nhắc tên như ngữ cảnh thầm lặng. Tác nhân có thể cập nhật bộ nhớ và trạng thái phiên, nhưng phòng vẫn im lặng trừ khi tác nhân gọi rõ ràng công cụ `message`.

Đối với các cuộc trò chuyện nhóm luôn bật, đây là chế độ được khuyến nghị: kết hợp `messages.groupChat.unmentionedInbound: "room_event"` với `messages.groupChat.visibleReplies: "message_tool"`. Dùng chế độ này khi tác nhân cần lắng nghe, quyết định khi nào phản hồi là hữu ích, và tránh mẫu prompt cũ là trả lời `NO_REPLY`.

Hiện được hỗ trợ: kênh máy chủ Discord, kênh Slack và kênh riêng tư Slack, DM nhiều người của Slack, và nhóm hoặc siêu nhóm Telegram. Các kênh nhóm khác giữ hành vi nhóm hiện có trừ khi trang kênh của chúng cho biết có hỗ trợ sự kiện phòng nền.

## Thiết lập được khuyến nghị

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

Sau đó cấu hình chính phòng đó là luôn bật bằng cách tắt cổng yêu cầu nhắc tên cho phòng đó. Kênh vẫn phải được cho phép bởi `groupPolicy` thông thường, danh sách cho phép phòng, và danh sách cho phép người gửi.

Sau khi lưu cấu hình, Gateway tải nóng các thiết lập `messages`. Chỉ khởi động lại khi tính năng theo dõi tệp hoặc tải lại cấu hình bị tắt.

## Những gì thay đổi

Với `messages.groupChat.unmentionedInbound: "room_event"`:

- tin nhắn nhóm hoặc kênh được phép nhưng không nhắc tên trở thành sự kiện phòng thầm lặng
- tin nhắn có nhắc tên vẫn là yêu cầu của người dùng
- lệnh văn bản và lệnh gốc vẫn là yêu cầu của người dùng
- yêu cầu hủy hoặc dừng vẫn là yêu cầu của người dùng
- tin nhắn trực tiếp vẫn là yêu cầu của người dùng

Sự kiện phòng dùng cơ chế gửi hiển thị nghiêm ngặt. Văn bản cuối cùng của trợ lý là riêng tư. Tác nhân phải gọi `message(action=send)` để đăng trong phòng.

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

Dùng cấu hình Discord theo từng kênh khi chỉ một kênh cần chạy nền:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Danh sách cho phép kênh Slack ưu tiên ID. Dùng ID kênh như `C12345678`, không dùng `#channel-name`.

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Ví dụ Telegram

Đối với nhóm Telegram, bot phải có khả năng thấy tin nhắn nhóm thông thường. Nếu `requireMention: false`, hãy tắt chế độ riêng tư BotFather hoặc dùng một thiết lập Telegram khác có gửi toàn bộ lưu lượng nhóm tới bot.

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

ID nhóm Telegram thường là số âm như `-1001234567890`. Đọc `chat.id` từ `openclaw logs --follow`, chuyển tiếp một tin nhắn nhóm tới bot trợ giúp ID, hoặc kiểm tra Bot API `getUpdates`.

## Chính sách riêng cho tác nhân

Dùng ghi đè tác nhân khi nhiều tác nhân dùng chung cùng một phòng nhưng chỉ một tác nhân nên xem cuộc trò chuyện không nhắc tên là ngữ cảnh nền:

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

Giá trị `agents.list[].groupChat.unmentionedInbound` riêng cho tác nhân ghi đè `messages.groupChat.unmentionedInbound` cho tác nhân đó.

## Chế độ phản hồi hiển thị

`messages.groupChat.visibleReplies` mặc định là `"automatic"` cho các yêu cầu người dùng nhóm/kênh thông thường. Giữ mặc định đó khi bạn muốn văn bản cuối cùng của trợ lý được đăng hiển thị mà không cần một lệnh gọi công cụ nhắn tin rõ ràng.

Đối với các phòng luôn bật chạy nền, `messages.groupChat.visibleReplies: "message_tool"` vẫn được khuyến nghị, đặc biệt với các mô hình thế hệ mới nhất, đáng tin cậy khi dùng công cụ như GPT 5.5. Chế độ này cho phép tác nhân quyết định khi nào nói bằng cách gọi công cụ nhắn tin. Nếu mô hình trả về văn bản cuối cùng mà không gọi công cụ, OpenClaw giữ văn bản cuối cùng đó ở chế độ riêng tư và ghi nhật ký siêu dữ liệu gửi bị chặn.

Sự kiện phòng vẫn nghiêm ngặt ngay cả khi các yêu cầu nhóm khác dùng phản hồi tự động. Sự kiện phòng nền không nhắc tên vẫn yêu cầu `message(action=send)` để có đầu ra hiển thị.

## Lịch sử

`messages.groupChat.historyLimit` kiểm soát mặc định lịch sử nhóm toàn cục. Kênh có thể ghi đè bằng `channels.<channel>.historyLimit`, và một số kênh cũng hỗ trợ giới hạn lịch sử theo từng tài khoản.

Đặt `historyLimit: 0` để tắt ngữ cảnh lịch sử nhóm.

Các kênh sự kiện phòng được hỗ trợ giữ các tin nhắn phòng nền gần đây làm ngữ cảnh. Telegram giữ một cửa sổ cuốn theo từng nhóm luôn bật, bị giới hạn bởi `historyLimit`; lượt yêu cầu của người dùng chọn các mục sau phản hồi đã ghi nhận cuối cùng của bot, trong khi lượt sự kiện phòng nhận toàn bộ cửa sổ gần đây để mô hình có thể thấy các bài đăng gần đây của chính nó. Khóa chế độ Telegram đã ngừng dùng `includeGroupHistoryContext` được xóa bởi `openclaw doctor --fix`.

## Khắc phục sự cố

Nếu phòng hiển thị trạng thái đang nhập hoặc mức dùng token nhưng không có tin nhắn hiển thị:

1. Xác nhận phòng được cho phép bởi danh sách cho phép kênh và danh sách cho phép người gửi.
2. Xác nhận `requireMention: false` được đặt ở cấp phòng bạn mong đợi.
3. Kiểm tra xem `messages.groupChat.unmentionedInbound` hoặc ghi đè tác nhân có phải là `"room_event"` không.
4. Kiểm tra nhật ký để tìm siêu dữ liệu payload cuối cùng bị chặn hoặc `didSendViaMessagingTool: false`.
5. Đối với các yêu cầu nhóm thông thường, giữ hoặc khôi phục `messages.groupChat.visibleReplies: "automatic"` nếu bạn muốn phản hồi cuối cùng được đăng tự động. Đối với phòng nền dùng `message_tool`, hãy dùng mô hình/runtime gọi công cụ một cách đáng tin cậy.

Nếu phòng nền Telegram hoàn toàn không kích hoạt, hãy kiểm tra chế độ riêng tư BotFather và xác minh Gateway đang nhận tin nhắn nhóm thông thường.

Nếu phòng nền Slack không kích hoạt, hãy xác minh khóa kênh là ID kênh Slack và ứng dụng có phạm vi bắt buộc `channels:history` hoặc `groups:history` cho loại phòng đó.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Discord](/vi/channels/discord)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Tham chiếu cấu hình kênh](/vi/gateway/config-channels)
