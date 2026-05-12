---
read_when:
    - Làm việc với phản ứng trong bất kỳ kênh nào
    - Hiểu cách các phản ứng emoji khác nhau giữa các nền tảng
summary: Ngữ nghĩa của công cụ phản ứng trên tất cả các kênh được hỗ trợ
title: Phản ứng
x-i18n:
    generated_at: "2026-05-12T01:00:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

Tác tử có thể thêm và xóa phản ứng emoji trên tin nhắn bằng công cụ `message`
với hành động `react`. Hành vi phản ứng thay đổi tùy theo kênh và phương thức truyền tải.

## Cách hoạt động

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` là bắt buộc khi thêm phản ứng.
- Đặt `emoji` thành chuỗi rỗng (`""`) để xóa phản ứng của bot.
- Đặt `remove: true` để xóa một emoji cụ thể (yêu cầu `emoji` không rỗng).
- Trên các kênh hỗ trợ phản ứng trạng thái, `trackToolCalls: true` trên một
  phản ứng cho phép runtime dùng tin nhắn đã được phản ứng đó cho các phản ứng
  tiến trình công cụ tiếp theo trong cùng lượt.

## Hành vi theo kênh

<AccordionGroup>
  <Accordion title="Discord và Slack">
    - `emoji` rỗng sẽ xóa tất cả phản ứng của bot trên tin nhắn.
    - `remove: true` chỉ xóa emoji đã chỉ định.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` rỗng sẽ xóa phản ứng của ứng dụng trên tin nhắn.
    - `remove: true` chỉ xóa emoji đã chỉ định.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` rỗng sẽ xóa phản ứng của bot.
    - `remove: true` cũng xóa phản ứng nhưng vẫn yêu cầu `emoji` không rỗng để xác thực công cụ.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` rỗng sẽ xóa phản ứng của bot.
    - `remove: true` được ánh xạ nội bộ thành emoji rỗng (vẫn yêu cầu `emoji` trong lệnh gọi công cụ).

  </Accordion>

  <Accordion title="Zalo cá nhân (zalouser)">
    - Yêu cầu `emoji` không rỗng.
    - `remove: true` xóa phản ứng emoji cụ thể đó.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Dùng công cụ `feishu_reaction` với các hành động `add`, `remove` và `list`.
    - Thêm/xóa yêu cầu `emoji_type`; xóa cũng yêu cầu `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Thông báo phản ứng đến được kiểm soát bởi `channels.signal.reactionNotifications`: `"off"` tắt chúng, `"own"` (mặc định) phát sự kiện khi người dùng phản ứng với tin nhắn của bot, và `"all"` phát sự kiện cho tất cả phản ứng.

  </Accordion>

  <Accordion title="iMessage">
    - Phản ứng gửi đi là tapback của iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` và `question`).
    - Thông báo tapback đến được kiểm soát bởi `channels.imessage.reactionNotifications`: `"off"` tắt chúng, `"own"` (mặc định) phát sự kiện khi người dùng phản ứng với tin nhắn do bot soạn, và `"all"` phát sự kiện cho tất cả tapback từ người gửi được ủy quyền.

  </Accordion>
</AccordionGroup>

## Mức độ phản ứng

Cấu hình `reactionLevel` theo từng kênh kiểm soát phạm vi tác tử dùng phản ứng. Giá trị thường là `off`, `ack`, `minimal` hoặc `extensive`.

- [Telegram reactionLevel](/vi/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/vi/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Đặt `reactionLevel` trên từng kênh để điều chỉnh mức độ chủ động của tác tử khi phản ứng với tin nhắn trên mỗi nền tảng.

## Liên quan

- [Agent Send](/vi/tools/agent-send) — công cụ `message` bao gồm `react`
- [Kênh](/vi/channels) — cấu hình dành riêng cho từng kênh
