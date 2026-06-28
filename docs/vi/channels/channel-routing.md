---
read_when:
    - Thay đổi định tuyến kênh hoặc hành vi hộp thư đến
summary: Quy tắc định tuyến theo từng kênh (WhatsApp, Telegram, Discord, Slack) và ngữ cảnh dùng chung
title: Định tuyến kênh
x-i18n:
    generated_at: "2026-05-06T09:02:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kênh & định tuyến

OpenClaw định tuyến câu trả lời **trở lại kênh nơi tin nhắn xuất phát**. Mô hình không chọn kênh; việc định tuyến là xác định và được kiểm soát bởi cấu hình host.

## Thuật ngữ chính

- **Kênh**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, cùng các kênh Plugin. `webchat` là kênh WebChat UI nội bộ và không phải là kênh gửi ra có thể cấu hình.
- **AccountId**: phiên bản tài khoản theo từng kênh (khi được hỗ trợ).
- Tài khoản mặc định tùy chọn của kênh: `channels.<channel>.defaultAccount` chọn tài khoản được dùng khi một đường dẫn gửi ra không chỉ định `accountId`.
  - Trong các thiết lập nhiều tài khoản, hãy đặt mặc định rõ ràng (`defaultAccount` hoặc `accounts.default`) khi có hai tài khoản trở lên được cấu hình. Nếu không, định tuyến dự phòng có thể chọn ID tài khoản đã chuẩn hóa đầu tiên.
- **AgentId**: một workspace + kho phiên biệt lập ("bộ não").
- **SessionKey**: khóa bucket dùng để lưu ngữ cảnh và kiểm soát đồng thời.

## Tiền tố đích gửi ra

Đích gửi ra rõ ràng có thể bao gồm tiền tố nhà cung cấp, chẳng hạn như `telegram:123` hoặc `tg:123`. Lõi chỉ xem tiền tố đó là gợi ý chọn kênh khi kênh được chọn là `last` hoặc chưa được phân giải theo cách khác, và chỉ khi Plugin đã tải quảng bá tiền tố đó. Nếu bên gọi đã chọn một kênh rõ ràng, tiền tố nhà cung cấp phải khớp với kênh đó; các tổ hợp xuyên kênh như gửi WhatsApp tới `telegram:123` sẽ thất bại trước bước chuẩn hóa đích riêng của Plugin.

Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, và `sms:<number>` nằm trong ngữ pháp của kênh đã chọn. Chúng không tự chọn nhà cung cấp.

## Hình dạng khóa phiên (ví dụ)

Tin nhắn trực tiếp mặc định được gom vào phiên **main** của tác tử:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

Ngay cả khi lịch sử hội thoại tin nhắn trực tiếp được chia sẻ với main, chính sách sandbox và công cụ vẫn dùng một khóa runtime chat trực tiếp theo tài khoản được dẫn xuất cho DM bên ngoài, để các tin nhắn bắt nguồn từ kênh không bị xử lý như các lần chạy phiên main cục bộ.

Nhóm và kênh vẫn được biệt lập theo từng kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Luồng:

- Luồng Slack/Discord nối thêm `:thread:<threadId>` vào khóa cơ sở.
- Chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` vào khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim tuyến DM chính

Khi `session.dmScope` là `main`, tin nhắn trực tiếp có thể chia sẻ một phiên main. Để ngăn `lastRoute` của phiên bị ghi đè bởi DM không phải chủ sở hữu, OpenClaw suy ra một chủ sở hữu được ghim từ `allowFrom` khi tất cả điều kiện sau đúng:

- `allowFrom` có đúng một mục không phải ký tự đại diện.
- Mục đó có thể được chuẩn hóa thành ID người gửi cụ thể cho kênh đó.
- Người gửi DM đến không khớp với chủ sở hữu được ghim đó.

Trong trường hợp không khớp đó, OpenClaw vẫn ghi lại siêu dữ liệu phiên đến, nhưng bỏ qua việc cập nhật `lastRoute` của phiên main.

## Ghi nhận lượt đến được bảo vệ

Plugin kênh có thể đánh dấu một bản ghi phiên đến là `createIfMissing: false` khi một đường dẫn được bảo vệ không được tạo phiên OpenClaw mới. Ở chế độ đó, OpenClaw có thể cập nhật siêu dữ liệu và `lastRoute` cho một phiên hiện có, nhưng không tạo mục phiên chỉ có tuyến chỉ vì quan sát thấy một tin nhắn.

## Quy tắc định tuyến (cách chọn tác tử)

Định tuyến chọn **một tác tử** cho mỗi tin nhắn đến:

1. **Khớp peer chính xác** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp peer cha** (kế thừa luồng).
3. **Khớp guild + vai trò** (Discord) qua `guildId` + `roles`.
4. **Khớp guild** (Discord) qua `guildId`.
5. **Khớp team** (Slack) qua `teamId`.
6. **Khớp tài khoản** (`accountId` trên kênh).
7. **Khớp kênh** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
8. **Tác tử mặc định** (`agents.list[].default`, nếu không có thì mục đầu tiên trong danh sách, dự phòng là `main`).

Khi một binding bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường được cung cấp phải khớp** để binding đó được áp dụng.

Tác tử được khớp xác định workspace và kho phiên được sử dụng.

## Nhóm phát sóng (chạy nhiều tác tử)

Nhóm phát sóng cho phép bạn chạy **nhiều tác tử** cho cùng một peer **khi OpenClaw thường sẽ trả lời** (ví dụ: trong nhóm WhatsApp, sau cổng nhắc đến/kích hoạt).

Cấu hình:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Xem: [Nhóm phát sóng](/vi/channels/broadcast-groups).

## Tổng quan cấu hình

- `agents.list`: định nghĩa tác tử được đặt tên (workspace, model, v.v.).
- `bindings`: ánh xạ kênh/tài khoản/peer đến thành tác tử.

Ví dụ:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Lưu trữ phiên

Kho phiên nằm dưới thư mục trạng thái (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi JSONL nằm cùng nơi với kho

Bạn có thể ghi đè đường dẫn kho qua `session.store` và tạo mẫu `{agentId}`.

Khám phá phiên Gateway và ACP cũng quét các kho tác tử dựa trên ổ đĩa dưới gốc `agents/` mặc định và dưới các gốc `session.store` được tạo mẫu. Các kho được phát hiện phải nằm trong gốc tác tử đã phân giải đó và dùng tệp `sessions.json` thông thường. Symlink và đường dẫn nằm ngoài gốc sẽ bị bỏ qua.

## Hành vi WebChat

WebChat gắn vào **tác tử được chọn** và mặc định dùng phiên main của tác tử. Vì vậy, WebChat cho phép bạn xem ngữ cảnh xuyên kênh của tác tử đó ở một nơi.

## Ngữ cảnh trả lời

Câu trả lời đến bao gồm:

- `ReplyToId`, `ReplyToBody`, và `ReplyToSender` khi có.
- Ngữ cảnh được trích dẫn được nối vào `Body` dưới dạng khối `[Replying to ...]`.

Điều này nhất quán trên các kênh.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Ghép đôi](/vi/channels/pairing)
