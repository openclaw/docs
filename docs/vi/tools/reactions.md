---
read_when:
    - Xử lý phản ứng trong bất kỳ kênh nào
    - Tìm hiểu cách phản ứng bằng emoji khác nhau giữa các nền tảng
summary: Ngữ nghĩa của công cụ phản ứng trên tất cả các kênh được hỗ trợ
title: Phản ứng
x-i18n:
    generated_at: "2026-04-29T23:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

Tác nhân có thể thêm và xóa phản ứng emoji trên tin nhắn bằng công cụ `message` với hành động `react`. Hành vi phản ứng khác nhau tùy theo kênh và phương thức truyền tải.

## Cách hoạt động

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Cần có `emoji` khi thêm phản ứng.
- Đặt `emoji` thành chuỗi rỗng (`""`) để xóa phản ứng của bot.
- Đặt `remove: true` để xóa một emoji cụ thể (yêu cầu `emoji` không rỗng).

## Hành vi theo kênh

<AccordionGroup>
  <Accordion title="Discord and Slack">
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

  <Accordion title="Zalo Personal (zalouser)">
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
</AccordionGroup>

## Mức phản ứng

Cấu hình `reactionLevel` theo kênh kiểm soát mức độ rộng rãi mà tác nhân sử dụng phản ứng. Các giá trị thường là `off`, `ack`, `minimal` hoặc `extensive`.

- [Telegram reactionLevel](/vi/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/vi/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Đặt `reactionLevel` trên từng kênh để tinh chỉnh mức độ chủ động mà tác nhân phản ứng với tin nhắn trên mỗi nền tảng.

## Liên quan

- [Agent Send](/vi/tools/agent-send) — công cụ `message` bao gồm `react`
- [Channels](/vi/channels) — cấu hình dành riêng cho kênh
