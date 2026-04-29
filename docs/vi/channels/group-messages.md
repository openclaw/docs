---
read_when:
    - Thay đổi quy tắc nhắn tin nhóm hoặc lượt nhắc đến
summary: Hành vi và cấu hình cho việc xử lý tin nhắn nhóm WhatsApp (mentionPatterns được chia sẻ trên các bề mặt)
title: Tin nhắn nhóm
x-i18n:
    generated_at: "2026-04-29T22:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Mục tiêu: cho phép Clawd có mặt trong các nhóm WhatsApp, chỉ thức dậy khi được gọi, và giữ luồng đó tách biệt với phiên DM cá nhân.

<Note>
`agents.list[].groupChat.mentionPatterns` cũng được Telegram, Discord, Slack và iMessage sử dụng. Tài liệu này tập trung vào hành vi riêng của WhatsApp. Với các thiết lập nhiều agent, hãy đặt `agents.list[].groupChat.mentionPatterns` cho từng agent, hoặc dùng `messages.groupChat.mentionPatterns` làm phương án dự phòng toàn cục.
</Note>

## Triển khai hiện tại (2025-12-03)

- Chế độ kích hoạt: `mention` (mặc định) hoặc `always`. `mention` yêu cầu một lời gọi (WhatsApp @-mention thật qua `mentionedJids`, mẫu regex an toàn, hoặc E.164 của bot ở bất cứ đâu trong văn bản). `always` đánh thức agent trên mọi tin nhắn nhưng chỉ nên trả lời khi có thể đóng góp giá trị có ý nghĩa; nếu không, nó trả về đúng token im lặng `NO_REPLY` / `no_reply`. Có thể đặt mặc định trong cấu hình (`channels.whatsapp.groups`) và ghi đè theo từng nhóm bằng `/activation`. Khi `channels.whatsapp.groups` được đặt, nó cũng đóng vai trò là danh sách cho phép nhóm (thêm `"*"` để cho phép tất cả).
- Chính sách nhóm: `channels.whatsapp.groupPolicy` kiểm soát việc tin nhắn nhóm có được chấp nhận hay không (`open|disabled|allowlist`). `allowlist` dùng `channels.whatsapp.groupAllowFrom` (dự phòng: `channels.whatsapp.allowFrom` rõ ràng). Mặc định là `allowlist` (bị chặn cho đến khi bạn thêm người gửi).
- Phiên theo từng nhóm: khóa phiên có dạng `agent:<agentId>:whatsapp:group:<jid>` nên các lệnh như `/verbose on`, `/trace on`, hoặc `/think high` (gửi dưới dạng tin nhắn độc lập) được giới hạn trong nhóm đó; trạng thái DM cá nhân không bị ảnh hưởng. Heartbeat được bỏ qua cho các luồng nhóm.
- Chèn ngữ cảnh: các tin nhắn nhóm **chỉ đang chờ xử lý** (mặc định 50) _không_ kích hoạt một lượt chạy sẽ được đặt tiền tố dưới `[Chat messages since your last reply - for context]`, với dòng kích hoạt nằm dưới `[Current message - respond to this]`. Các tin nhắn đã có trong phiên sẽ không được chèn lại.
- Hiển thị người gửi: mỗi lô nhóm hiện kết thúc bằng `[from: Sender Name (+E164)]` để Pi biết ai đang nói.
- Tạm thời/xem một lần: chúng tôi mở gói các nội dung đó trước khi trích xuất văn bản/mention, nên các lời gọi bên trong vẫn kích hoạt.
- Prompt hệ thống nhóm: ở lượt đầu tiên của một phiên nhóm (và mỗi khi `/activation` đổi chế độ), chúng tôi chèn một đoạn ngắn vào prompt hệ thống như `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Nếu không có metadata, chúng tôi vẫn cho agent biết đây là cuộc trò chuyện nhóm.

## Ví dụ cấu hình (WhatsApp)

Thêm khối `groupChat` vào `~/.openclaw/openclaw.json` để các lời gọi bằng tên hiển thị hoạt động ngay cả khi WhatsApp loại bỏ ký tự `@` trực quan trong phần nội dung văn bản:

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

- Các regex không phân biệt chữ hoa chữ thường và dùng cùng các biện pháp bảo vệ safe-regex như các bề mặt regex cấu hình khác; mẫu không hợp lệ và lặp lồng nhau không an toàn sẽ bị bỏ qua.
- WhatsApp vẫn gửi mention chuẩn qua `mentionedJids` khi ai đó nhấn vào liên hệ, nên phương án dự phòng bằng số hiếm khi cần thiết nhưng là một lưới an toàn hữu ích.

### Lệnh kích hoạt (chỉ owner)

Dùng lệnh trò chuyện nhóm:

- `/activation mention`
- `/activation always`

Chỉ số của owner (từ `channels.whatsapp.allowFrom`, hoặc E.164 của chính bot khi chưa đặt) mới có thể thay đổi điều này. Gửi `/status` dưới dạng tin nhắn độc lập trong nhóm để xem chế độ kích hoạt hiện tại.

## Cách sử dụng

1. Thêm tài khoản WhatsApp của bạn (tài khoản đang chạy OpenClaw) vào nhóm.
2. Nói `@openclaw …` (hoặc thêm số). Chỉ những người gửi trong danh sách cho phép mới có thể kích hoạt, trừ khi bạn đặt `groupPolicy: "open"`.
3. Prompt của agent sẽ bao gồm ngữ cảnh nhóm gần đây cộng với marker `[from: …]` ở cuối để agent có thể gọi đúng người.
4. Các chỉ thị cấp phiên (`/verbose on`, `/trace on`, `/think high`, `/new` hoặc `/reset`, `/compact`) chỉ áp dụng cho phiên của nhóm đó; hãy gửi chúng dưới dạng tin nhắn độc lập để chúng được ghi nhận. Phiên DM cá nhân của bạn vẫn độc lập.

## Kiểm thử / xác minh

- Smoke thủ công:
  - Gửi một lời gọi `@openclaw` trong nhóm và xác nhận có phản hồi tham chiếu đến tên người gửi.
  - Gửi lời gọi thứ hai và xác minh khối lịch sử được đưa vào, rồi được xóa ở lượt tiếp theo.
- Kiểm tra nhật ký Gateway (chạy với `--verbose`) để xem các mục `inbound web message` hiển thị `from: <groupJid>` và hậu tố `[from: …]`.

## Những điểm cần lưu ý

- Heartbeat được cố ý bỏ qua cho nhóm để tránh phát đi thông báo ồn ào.
- Cơ chế chặn tiếng vọng dùng chuỗi lô kết hợp; nếu bạn gửi cùng một văn bản hai lần mà không có mention, chỉ tin nhắn đầu tiên sẽ nhận phản hồi.
- Các mục kho phiên sẽ xuất hiện dưới dạng `agent:<agentId>:whatsapp:group:<jid>` trong kho phiên (`~/.openclaw/agents/<agentId>/sessions/sessions.json` theo mặc định); thiếu mục chỉ có nghĩa là nhóm chưa kích hoạt lượt chạy nào.
- Chỉ báo đang nhập trong nhóm tuân theo `agents.defaults.typingMode`. Khi các phản hồi hiển thị dùng chế độ mặc định chỉ dùng công cụ tin nhắn, trạng thái đang nhập bắt đầu ngay theo mặc định để thành viên nhóm có thể thấy agent đang làm việc ngay cả khi không có phản hồi cuối tự động nào được đăng. Cấu hình chế độ đang nhập rõ ràng vẫn được ưu tiên.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm phát sóng](/vi/channels/broadcast-groups)
