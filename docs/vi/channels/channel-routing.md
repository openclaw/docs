---
read_when:
    - Thay đổi định tuyến kênh hoặc hành vi hộp thư đến
summary: Quy tắc định tuyến theo từng kênh (WhatsApp, Telegram, Discord, Slack) và ngữ cảnh chung
title: Định tuyến kênh
x-i18n:
    generated_at: "2026-04-29T22:24:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kênh và định tuyến

OpenClaw định tuyến câu trả lời **trở lại kênh nơi tin nhắn bắt nguồn**. Mô hình không chọn kênh; việc định tuyến có tính xác định và được kiểm soát bởi cấu hình máy chủ.

## Thuật ngữ chính

- **Kênh**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, cùng các kênh Plugin. `webchat` là kênh giao diện WebChat nội bộ và không phải là kênh gửi đi có thể cấu hình.
- **AccountId**: phiên bản tài khoản theo từng kênh (khi được hỗ trợ).
- Tài khoản mặc định tùy chọn của kênh: `channels.<channel>.defaultAccount` chọn tài khoản được dùng khi một đường dẫn gửi đi không chỉ định `accountId`.
  - Trong thiết lập nhiều tài khoản, hãy đặt mặc định tường minh (`defaultAccount` hoặc `accounts.default`) khi cấu hình từ hai tài khoản trở lên. Nếu không, định tuyến dự phòng có thể chọn ID tài khoản đã chuẩn hóa đầu tiên.
- **AgentId**: một workspace + kho phiên tách biệt (“bộ não”).
- **SessionKey**: khóa nhóm được dùng để lưu ngữ cảnh và kiểm soát đồng thời.

## Dạng khóa phiên (ví dụ)

Theo mặc định, tin nhắn trực tiếp được gộp vào phiên **main** của agent:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

Ngay cả khi lịch sử hội thoại tin nhắn trực tiếp được chia sẻ với main, chính sách sandbox và công cụ vẫn dùng khóa runtime trò chuyện trực tiếp theo từng tài khoản được dẫn xuất cho DM bên ngoài, để các tin nhắn bắt nguồn từ kênh không bị xử lý như các lượt chạy phiên main cục bộ.

Nhóm và kênh vẫn được cô lập theo từng kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Luồng:

- Luồng Slack/Discord thêm `:thread:<threadId>` vào khóa cơ sở.
- Chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` trong khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim tuyến DM main

Khi `session.dmScope` là `main`, tin nhắn trực tiếp có thể chia sẻ một phiên main. Để ngăn `lastRoute` của phiên bị DM không phải chủ sở hữu ghi đè, OpenClaw suy ra một chủ sở hữu được ghim từ `allowFrom` khi tất cả điều kiện sau đúng:

- `allowFrom` có đúng một mục không phải ký tự đại diện.
- Mục đó có thể được chuẩn hóa thành ID người gửi cụ thể cho kênh đó.
- Người gửi DM đến không khớp với chủ sở hữu được ghim đó.

Trong trường hợp không khớp đó, OpenClaw vẫn ghi lại siêu dữ liệu phiên đến, nhưng bỏ qua việc cập nhật `lastRoute` của phiên main.

## Ghi nhận đầu vào có bảo vệ

Plugin kênh có thể đánh dấu một bản ghi phiên đến là `createIfMissing: false` khi một đường dẫn có bảo vệ không được tạo phiên OpenClaw mới. Ở chế độ đó, OpenClaw có thể cập nhật siêu dữ liệu và `lastRoute` cho phiên hiện có, nhưng không tạo mục phiên chỉ có tuyến chỉ vì đã quan sát thấy một tin nhắn.

## Quy tắc định tuyến (cách chọn agent)

Định tuyến chọn **một agent** cho mỗi tin nhắn đến:

1. **Khớp peer chính xác** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp peer cha** (kế thừa luồng).
3. **Khớp guild + vai trò** (Discord) qua `guildId` + `roles`.
4. **Khớp guild** (Discord) qua `guildId`.
5. **Khớp nhóm** (Slack) qua `teamId`.
6. **Khớp tài khoản** (`accountId` trên kênh).
7. **Khớp kênh** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
8. **Agent mặc định** (`agents.list[].default`, nếu không thì mục đầu tiên trong danh sách, dự phòng về `main`).

Khi một binding bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường được cung cấp phải khớp** để binding đó được áp dụng.

Agent khớp sẽ xác định workspace và kho phiên được sử dụng.

## Nhóm phát rộng (chạy nhiều agent)

Nhóm phát rộng cho phép bạn chạy **nhiều agent** cho cùng một peer **khi OpenClaw thường sẽ trả lời** (ví dụ: trong nhóm WhatsApp, sau cổng nhắc đến/kích hoạt).

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

Xem: [Nhóm phát rộng](/vi/channels/broadcast-groups).

## Tổng quan cấu hình

- `agents.list`: định nghĩa agent được đặt tên (workspace, mô hình, v.v.).
- `bindings`: ánh xạ các kênh/tài khoản/peer đến vào agent.

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

Kho phiên nằm trong thư mục trạng thái (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript JSONL nằm cạnh kho

Bạn có thể ghi đè đường dẫn kho qua `session.store` và mẫu `{agentId}`.

Việc khám phá phiên của Gateway và ACP cũng quét các kho agent dựa trên đĩa dưới gốc `agents/` mặc định và dưới các gốc `session.store` theo mẫu. Các kho được khám phá phải nằm bên trong gốc agent đã phân giải đó và dùng tệp `sessions.json` thông thường. Symlink và đường dẫn ngoài gốc bị bỏ qua.

## Hành vi WebChat

WebChat gắn với **agent đã chọn** và mặc định dùng phiên main của agent. Vì vậy, WebChat cho phép bạn xem ngữ cảnh xuyên kênh cho agent đó ở một nơi.

## Ngữ cảnh trả lời

Câu trả lời đến bao gồm:

- `ReplyToId`, `ReplyToBody`, và `ReplyToSender` khi có sẵn.
- Ngữ cảnh được trích dẫn được thêm vào `Body` dưới dạng khối `[Replying to ...]`.

Điều này nhất quán trên các kênh.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Nhóm phát rộng](/vi/channels/broadcast-groups)
- [Ghép nối](/vi/channels/pairing)
