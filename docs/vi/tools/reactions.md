---
read_when:
    - Xử lý phản ứng trong mọi kênh
    - Tìm hiểu sự khác biệt của phản ứng bằng biểu tượng cảm xúc giữa các nền tảng
summary: Ngữ nghĩa của công cụ bày tỏ cảm xúc trên tất cả các kênh được hỗ trợ
title: Phản ứng
x-i18n:
    generated_at: "2026-07-12T08:25:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Tác nhân thêm và xóa các phản ứng biểu tượng cảm xúc bằng hành động `react`
của công cụ `message`. Hành vi thay đổi tùy theo kênh.

## Cách hoạt động

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` là bắt buộc khi thêm phản ứng.
- Đặt `emoji` thành chuỗi rỗng (`""`) để xóa (các) phản ứng của bot trên
  những kênh hỗ trợ thao tác này.
- Đặt `remove: true` để xóa một biểu tượng cảm xúc cụ thể (yêu cầu
  `emoji` không rỗng).
- Trên các kênh có phản ứng trạng thái, việc đặt `trackToolCalls: true` cho một phản ứng cho phép
  môi trường thực thi tái sử dụng tin nhắn đã được phản ứng đó cho các phản ứng
  tiến độ công cụ tiếp theo trong cùng một lượt.

## Hành vi theo kênh

<AccordionGroup>
  <Accordion title="Discord và Slack">
    - `emoji` rỗng sẽ xóa tất cả phản ứng của bot trên tin nhắn.
    - `remove: true` chỉ xóa biểu tượng cảm xúc được chỉ định.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Chỉ hỗ trợ thêm phản ứng: `emoji` là bắt buộc và không được để trống.
    - Việc xóa phản ứng chưa được kết nối với lệnh gọi xóa; `remove: true` bị từ chối với lỗi rõ ràng thay vì âm thầm không thực hiện gì.
    - Yêu cầu bot Talk được đăng ký với tính năng `reaction` (xem [tài liệu kênh Nextcloud Talk](/vi/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` rỗng sẽ xóa các phản ứng của bot.
    - `remove: true` cũng xóa phản ứng nhưng vẫn yêu cầu `emoji` không rỗng để công cụ xác thực.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` rỗng sẽ xóa phản ứng của bot.
    - `remove: true` được ánh xạ nội bộ thành biểu tượng cảm xúc rỗng (nhưng vẫn yêu cầu `emoji` trong lệnh gọi công cụ).
    - WhatsApp có một vị trí phản ứng của bot cho mỗi tin nhắn; việc gửi phản ứng mới sẽ thay thế phản ứng hiện tại thay vì xếp chồng nhiều biểu tượng cảm xúc.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Yêu cầu `emoji` không rỗng cho cả thao tác thêm và xóa.
    - `remove: true` xóa phản ứng bằng biểu tượng cảm xúc cụ thể đó.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Sử dụng cùng hành động `react` như các kênh khác (thêm/xóa/liệt kê thông qua ID phản ứng tin nhắn), không dùng công cụ riêng.
    - Thao tác thêm yêu cầu `emoji` không rỗng (được ánh xạ thành `emoji_type` của Feishu, ví dụ: `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` yêu cầu `emoji` không rỗng và xóa phản ứng của chính bot khớp với loại biểu tượng cảm xúc đó.
    - `emoji` rỗng cùng với `clearAll: true` sẽ xóa tất cả phản ứng của bot trên tin nhắn.

  </Accordion>

  <Accordion title="Signal">
    - Thông báo phản ứng đến được kiểm soát bởi `channels.signal.reactionNotifications`: `"off"` vô hiệu hóa chúng, `"own"` (mặc định) phát sự kiện khi người dùng phản ứng với tin nhắn của bot, `"all"` phát sự kiện cho tất cả phản ứng và `"allowlist"` chỉ phát sự kiện cho những người gửi có trong `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Phản ứng gửi đi là các tapback của iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` và `question`); `emoji` phải ánh xạ đến một trong các loại này để thêm phản ứng.
    - `remove: true` không kèm loại tapback được nhận diện sẽ xóa tất cả loại tapback; nếu có loại được nhận diện thì chỉ xóa loại đó.

  </Accordion>
</AccordionGroup>

## Mức độ phản ứng

`reactionLevel` theo từng kênh giới hạn tần suất tác nhân gửi phản ứng của chính mình.
Các giá trị: `off`, `ack`, `minimal` hoặc `extensive`.

- [Thông báo phản ứng Telegram](/vi/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (mặc định là `minimal`)
- [Mức độ phản ứng WhatsApp](/vi/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (mặc định là `minimal`)
- [Phản ứng Signal](/vi/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (mặc định là `minimal`)

## Nội dung liên quan

- [Gửi từ tác nhân](/vi/tools/agent-send) - công cụ `message` có bao gồm `react`
- [Kênh](/vi/channels) - cấu hình dành riêng cho từng kênh
