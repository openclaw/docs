---
read_when:
    - Định cấu hình riêng cho nhóm WhatsApp
    - Thay đổi chế độ kích hoạt WhatsApp (`mention` so với `always`)
    - Điều chỉnh khóa phiên nhóm WhatsApp hoặc ngữ cảnh tin nhắn đang chờ
sidebarTitle: WhatsApp groups
summary: Xử lý tin nhắn nhóm WhatsApp — kích hoạt, danh sách cho phép, phiên và chèn ngữ cảnh
title: Tin nhắn nhóm WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Đối với mô hình nhóm liên kênh (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), xem [Nhóm](/vi/channels/groups). Trang này trình bày hành vi riêng của WhatsApp nằm trên mô hình đó: kích hoạt, danh sách cho phép nhóm, khóa phiên theo từng nhóm và chèn ngữ cảnh tin nhắn đang chờ.

Mục tiêu: cho phép OpenClaw có mặt trong các nhóm WhatsApp, chỉ thức dậy khi được gọi và giữ luồng đó tách biệt với phiên DM cá nhân.

<Note>
`agents.list[].groupChat.mentionPatterns` cũng được Telegram, Discord, Slack và iMessage sử dụng. Với thiết lập nhiều agent, hãy đặt theo từng agent, hoặc dùng `messages.groupChat.mentionPatterns` làm dự phòng toàn cục.
</Note>

## Hành vi

- Chế độ kích hoạt: `mention` (mặc định) hoặc `always`. `mention` yêu cầu một lời gọi (WhatsApp @-mentions thật qua `mentionedJids`, mẫu regex an toàn, hoặc E.164 của bot xuất hiện ở bất kỳ đâu trong văn bản). `always` đánh thức agent với mọi tin nhắn nhưng chỉ nên trả lời khi có thể bổ sung giá trị có ý nghĩa; nếu không, nó trả về đúng token im lặng `NO_REPLY` / `no_reply`. Có thể đặt mặc định trong cấu hình (`channels.whatsapp.groups`) và ghi đè theo từng nhóm qua `/activation`. Khi `channels.whatsapp.groups` được đặt, nó cũng hoạt động như danh sách cho phép nhóm (thêm `"*"` để cho phép tất cả).
- Chính sách nhóm: `channels.whatsapp.groupPolicy` kiểm soát việc tin nhắn nhóm có được chấp nhận hay không (`open|disabled|allowlist`). `allowlist` dùng `channels.whatsapp.groupAllowFrom` (dự phòng: `channels.whatsapp.allowFrom` rõ ràng). Mặc định là `allowlist` (bị chặn cho đến khi bạn thêm người gửi).
- Phiên theo từng nhóm: khóa phiên có dạng `agent:<agentId>:whatsapp:group:<jid>` nên các lệnh như `/verbose on`, `/trace on`, hoặc `/think high` (được gửi dưới dạng tin nhắn độc lập) chỉ áp dụng cho nhóm đó; trạng thái DM cá nhân không bị ảnh hưởng. Heartbeat được bỏ qua cho các luồng nhóm.
- Chèn ngữ cảnh: tin nhắn nhóm **chỉ đang chờ** (mặc định 50) mà _không_ kích hoạt một lượt chạy sẽ được thêm tiền tố dưới `[Chat messages since your last reply - for context]`, với dòng kích hoạt nằm dưới `[Current message - respond to this]`. Những tin nhắn đã có trong phiên sẽ không được chèn lại.
- Hiển thị người gửi: mọi lô tin nhắn nhóm hiện kết thúc bằng `[from: Sender Name (+E164)]` để OpenClaw biết ai đang nói.
- Tạm thời/xem một lần: chúng tôi mở gói các loại này trước khi trích xuất văn bản/lượt nhắc, nên các lời gọi bên trong vẫn kích hoạt.
- Prompt hệ thống của nhóm: ở lượt đầu tiên của một phiên nhóm (và bất cứ khi nào `/activation` thay đổi chế độ), chúng tôi chèn một đoạn ngắn vào prompt hệ thống như `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Nếu không có metadata, chúng tôi vẫn cho agent biết đây là cuộc trò chuyện nhóm.

## Ví dụ cấu hình (WhatsApp)

Thêm một khối `groupChat` vào `~/.openclaw/openclaw.json` để các lời gọi theo tên hiển thị hoạt động ngay cả khi WhatsApp loại bỏ ký hiệu `@` trực quan trong phần thân văn bản:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Ghi chú:

- Các regex không phân biệt chữ hoa chữ thường và dùng cùng các lan can safe-regex như những bề mặt regex cấu hình khác; mẫu không hợp lệ và lặp lồng nhau không an toàn sẽ bị bỏ qua.
- WhatsApp vẫn gửi lượt nhắc chuẩn qua `mentionedJids` khi ai đó nhấn vào liên hệ, nên dự phòng bằng số hiếm khi cần đến nhưng là một lưới an toàn hữu ích.

### Lệnh kích hoạt (chỉ chủ sở hữu)

Dùng lệnh trò chuyện nhóm:

- `/activation mention`
- `/activation always`

Chỉ số của chủ sở hữu (từ `channels.whatsapp.allowFrom`, hoặc E.164 của chính bot khi chưa đặt) mới có thể thay đổi điều này. Gửi `/status` dưới dạng tin nhắn độc lập trong nhóm để xem chế độ kích hoạt hiện tại.

## Cách sử dụng

1. Thêm tài khoản WhatsApp của bạn (tài khoản đang chạy OpenClaw) vào nhóm.
2. Nói `@openclaw …` (hoặc kèm số). Chỉ người gửi trong danh sách cho phép mới có thể kích hoạt, trừ khi bạn đặt `groupPolicy: "open"`.
3. Prompt của agent sẽ bao gồm ngữ cảnh nhóm gần đây cùng marker cuối `[from: …]` để nó có thể gọi đúng người.
4. Các chỉ thị cấp phiên (`/verbose on`, `/trace on`, `/think high`, `/new` hoặc `/reset`, `/compact`) chỉ áp dụng cho phiên của nhóm đó; gửi chúng dưới dạng tin nhắn độc lập để chúng được ghi nhận. Phiên DM cá nhân của bạn vẫn độc lập.

## Kiểm thử / xác minh

- Kiểm thử smoke thủ công:
  - Gửi một lời gọi `@openclaw` trong nhóm và xác nhận có phản hồi tham chiếu đến tên người gửi.
  - Gửi lời gọi thứ hai và xác minh khối lịch sử được đưa vào rồi được xóa ở lượt tiếp theo.
- Kiểm tra nhật ký Gateway (chạy với `--verbose`) để xem các mục `inbound web message` hiển thị `from: <groupJid>` và hậu tố `[from: …]`.

## Những điểm cần lưu ý

- Heartbeat được cố ý bỏ qua cho nhóm để tránh phát thông báo gây nhiễu.
- Cơ chế chặn echo dùng chuỗi lô kết hợp; nếu bạn gửi cùng một văn bản hai lần mà không có lượt nhắc, chỉ tin nhắn đầu tiên nhận được phản hồi.
- Mục lưu trữ phiên sẽ xuất hiện dưới dạng `agent:<agentId>:whatsapp:group:<jid>` trong kho phiên (`~/.openclaw/agents/<agentId>/sessions/sessions.json` theo mặc định); thiếu mục chỉ có nghĩa là nhóm chưa kích hoạt lượt chạy nào.
- Chỉ báo đang nhập trong nhóm tuân theo `agents.defaults.typingMode`. Khi phản hồi hiển thị được chọn vào chế độ chỉ dùng message-tool, trạng thái đang nhập bắt đầu ngay theo mặc định để thành viên nhóm có thể thấy agent đang làm việc ngay cả khi không có phản hồi cuối tự động nào được đăng. Cấu hình chế độ nhập rõ ràng vẫn được ưu tiên.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm phát sóng](/vi/channels/broadcast-groups)
