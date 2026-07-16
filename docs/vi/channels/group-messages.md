---
read_when:
    - Cấu hình cụ thể cho các nhóm WhatsApp
    - Thay đổi chế độ kích hoạt WhatsApp (`mention` so với `always`)
    - Tinh chỉnh khóa phiên nhóm WhatsApp hoặc ngữ cảnh tin nhắn đang chờ xử lý
sidebarTitle: WhatsApp groups
summary: Xử lý tin nhắn nhóm WhatsApp — kích hoạt, danh sách cho phép, phiên và chèn ngữ cảnh
title: Tin nhắn nhóm WhatsApp
x-i18n:
    generated_at: "2026-07-16T14:04:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Đối với mô hình nhóm đa kênh (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), hãy xem [Nhóm](/vi/channels/groups). Trang này trình bày các hành vi dành riêng cho WhatsApp bên trên mô hình đó: kích hoạt, danh sách cho phép của nhóm, khóa phiên riêng cho từng nhóm và chèn ngữ cảnh tin nhắn đang chờ.

Mục tiêu: cho phép OpenClaw tham gia các nhóm WhatsApp, chỉ thức dậy khi được gọi và giữ luồng đó tách biệt với phiên tin nhắn trực tiếp cá nhân.

<Note>
`agents.list[].groupChat.mentionPatterns` được dùng chung với cơ chế kiểm soát bằng lượt đề cập của các kênh khác. Đối với thiết lập nhiều tác tử, hãy đặt giá trị này cho từng tác tử hoặc dùng `messages.groupChat.mentionPatterns` làm phương án dự phòng toàn cục. Nếu cả hai đều không được đặt, các mẫu sẽ được suy ra từ tên/emoji nhận dạng của tác tử.
</Note>

## Hành vi

- Chế độ kích hoạt: `mention` (mặc định) hoặc `always`. `mention` yêu cầu một lượt gọi: lượt @-đề cập thực sự trên WhatsApp (`mentionedJids`), mẫu biểu thức chính quy đã cấu hình, các chữ số E.164 của bot ở bất kỳ đâu trong văn bản hoặc phản hồi có trích dẫn một trong các tin nhắn của bot (ngoại trừ thiết lập tự trò chuyện bằng số dùng chung). `always` đánh thức tác tử với mọi tin nhắn, nhưng lời nhắc nhóm được chèn sẽ yêu cầu tác tử chỉ phản hồi khi mang lại giá trị và nếu không thì trả về chính xác token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường). Giá trị mặc định lấy từ cấu hình (`channels.whatsapp.groups` `requireMention`) và có thể được ghi đè cho từng nhóm thông qua `/activation`.
- Danh sách cho phép của nhóm: khi đặt `channels.whatsapp.groups`, chỉ các JID nhóm được liệt kê mới được chấp nhận (thêm `"*"` để cho phép tất cả); tin nhắn từ các nhóm không có trong danh sách sẽ bị loại bỏ kèm gợi ý trong nhật ký.
- Chính sách nhóm: `channels.whatsapp.groupPolicy` kiểm soát việc tin nhắn nhóm có được chấp nhận hay không (`open|disabled|allowlist`). `allowlist` sử dụng `channels.whatsapp.groupAllowFrom` (dự phòng: `channels.whatsapp.allowFrom` được đặt rõ ràng). Giá trị mặc định là `allowlist` (bị chặn cho đến khi bạn thêm người gửi).
- Phiên riêng cho từng nhóm: khóa phiên có dạng `agent:<agentId>:whatsapp:group:<jid>` (tài khoản không mặc định nối thêm `:thread:whatsapp-account-<accountId>`), vì vậy các chỉ thị như `/verbose on`, `/trace on` hoặc `/think high` (được gửi dưới dạng tin nhắn độc lập) chỉ áp dụng trong phạm vi nhóm đó; trạng thái tin nhắn trực tiếp cá nhân không bị ảnh hưởng.
- Chèn ngữ cảnh: các tin nhắn nhóm **chỉ đang chờ** (mặc định 50) _không_ kích hoạt lượt chạy được thêm tiền tố bên dưới `[Chat messages since your last reply - for context]`, còn dòng kích hoạt nằm bên dưới `[Current message - respond to this]`. Cửa sổ đang chờ được xóa sau lượt chạy; các tin nhắn đã có trong phiên sẽ không được chèn lại.
- Ghi nhận người gửi: mỗi dòng trong nhóm chứa nhãn người gửi bên trong phong bì tin nhắn, ví dụ: `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, đồng thời danh tính người gửi cùng chủ đề/thành viên nhóm được truyền kèm trong khối siêu dữ liệu hội thoại không đáng tin cậy.
- Tạm thời/chỉ xem một lần: các lớp bao được mở trước khi trích xuất văn bản/lượt đề cập, vì vậy các lượt gọi bên trong vẫn kích hoạt.
- Lời nhắc hệ thống của nhóm: lượt đầu tiên trong một phiên nhóm (và mọi lượt sau khi `/activation` thay đổi chế độ) chèn hướng dẫn kích hoạt vào lời nhắc hệ thống (`Activation: trigger-only ...` hoặc `Activation: always-on ...`, cùng với "phản hồi đúng người gửi cụ thể"). Hướng dẫn gửi liên tục cho cuộc trò chuyện nhóm ("Bạn đang ở trong một cuộc trò chuyện nhóm WhatsApp...") luôn được bao gồm.

## Ví dụ cấu hình (WhatsApp)

Cho phép các lượt gọi bằng tên hiển thị hoạt động ngay cả khi WhatsApp loại bỏ ký hiệu `@` trực quan khỏi phần nội dung văn bản:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // cửa sổ ngữ cảnh nhóm đang chờ (mặc định 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Lưu ý:

- Các biểu thức chính quy không phân biệt chữ hoa chữ thường và sử dụng cùng các biện pháp bảo vệ biểu thức chính quy an toàn như những bề mặt biểu thức chính quy khác trong cấu hình; các mẫu không hợp lệ và phép lặp lồng nhau không an toàn sẽ bị bỏ qua.
- WhatsApp vẫn gửi các lượt đề cập chuẩn thông qua `mentionedJids` khi ai đó nhấn vào liên hệ, vì vậy phương án dự phòng bằng số hiếm khi cần thiết nhưng là một lớp bảo vệ hữu ích.
- Cửa sổ ngữ cảnh đang chờ được xác định theo thứ tự `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Lệnh kích hoạt (chỉ chủ sở hữu)

Sử dụng lệnh trò chuyện nhóm:

- `/activation mention`
- `/activation always`

Chỉ các số của chủ sở hữu (từ `channels.whatsapp.allowFrom` hoặc số E.164 của chính bot khi chưa đặt) mới có thể thay đổi chế độ này; `/activation` từ bất kỳ ai khác sẽ bị bỏ qua và chỉ được lưu làm ngữ cảnh. Gửi `/status` dưới dạng tin nhắn độc lập trong nhóm để xem chế độ kích hoạt hiện tại.

## Cách sử dụng

1. Thêm tài khoản WhatsApp của bạn (tài khoản đang chạy OpenClaw) vào nhóm.
2. Gửi `@openclaw ...` (hoặc thêm số vào nội dung). Chỉ người gửi trong danh sách cho phép mới có thể kích hoạt tác tử, trừ khi bạn đặt `groupPolicy: "open"`.
3. Lời nhắc của tác tử bao gồm ngữ cảnh nhóm đang chờ cùng các dòng có nhãn người gửi để tác tử có thể phản hồi đúng người.
4. Các chỉ thị phiên (`/verbose on`, `/trace on`, `/think high`, `/new` hoặc `/reset`, `/compact`) chỉ áp dụng cho phiên của nhóm đó; hãy gửi chúng dưới dạng tin nhắn độc lập để chúng được ghi nhận. Phiên tin nhắn trực tiếp cá nhân của bạn vẫn độc lập.

## Kiểm thử / xác minh

- Kiểm thử nhanh thủ công:
  - Gửi một lượt gọi `@openclaw` trong nhóm và xác nhận có phản hồi đề cập đến tên người gửi.
  - Gửi lượt gọi thứ hai và xác minh khối lịch sử được bao gồm, sau đó được xóa ở lượt tiếp theo.
- Kiểm tra nhật ký Gateway (chạy với `--verbose`) để tìm các mục `inbound web message` hiển thị `from: <groupJid>` và phần nội dung có nhãn người gửi.

## Các điểm cần lưu ý

- Heartbeat chạy trong phiên chính của tác tử; các phiên nhóm không bao giờ nhận lượt chạy Heartbeat.
- Cơ chế ngăn phản hồi dội nhớ lời nhắc kết hợp (lịch sử + tin nhắn hiện tại) cho từng phiên để các tin nhắn do chính bot gửi không kích hoạt lại bot; một lô lặp lại giống hệt có thể bị bỏ qua vì được coi là phản hồi dội.
- Các mục trong kho phiên xuất hiện dưới dạng `agent:<agentId>:whatsapp:group:<jid>` trong kho phiên SQLite của từng tác tử; mục bị thiếu chỉ có nghĩa là nhóm chưa kích hoạt lượt chạy nào.
- Chỉ báo đang nhập tuân theo `session.typingMode` / `agents.defaults.typingMode`. Khi phản hồi hiển thị được chọn dùng chế độ chỉ sử dụng công cụ tin nhắn, theo mặc định chỉ báo đang nhập sẽ bắt đầu ngay lập tức để các thành viên nhóm có thể thấy tác tử đang làm việc ngay cả khi không có phản hồi cuối cùng tự động nào được đăng. Cấu hình chế độ nhập được đặt rõ ràng vẫn được ưu tiên.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm phát sóng](/vi/channels/broadcast-groups)
