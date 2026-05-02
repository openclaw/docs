---
read_when:
    - Thay đổi định tuyến kênh hoặc hành vi hộp thư đến
summary: Quy tắc định tuyến theo từng kênh (WhatsApp, Telegram, Discord, Slack) và ngữ cảnh dùng chung
title: Định tuyến kênh
x-i18n:
    generated_at: "2026-05-02T10:33:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kênh & định tuyến

OpenClaw định tuyến phản hồi **trở lại kênh nơi tin nhắn đến**. Mô hình
không chọn kênh; việc định tuyến là xác định và được kiểm soát bởi cấu hình
host.

## Thuật ngữ chính

- **Kênh**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, cùng các kênh Plugin. `webchat` là kênh WebChat UI nội bộ và không phải là kênh gửi đi có thể cấu hình.
- **AccountId**: phiên bản tài khoản theo từng kênh (khi được hỗ trợ).
- Tài khoản mặc định tùy chọn của kênh: `channels.<channel>.defaultAccount` chọn
  tài khoản nào được dùng khi đường dẫn gửi đi không chỉ định `accountId`.
  - Trong các thiết lập nhiều tài khoản, hãy đặt một mặc định rõ ràng (`defaultAccount` hoặc `accounts.default`) khi hai hoặc nhiều tài khoản được cấu hình. Nếu không, định tuyến dự phòng có thể chọn ID tài khoản đã chuẩn hóa đầu tiên.
- **AgentId**: một workspace + kho phiên biệt lập (“brain”).
- **SessionKey**: khóa bucket dùng để lưu ngữ cảnh và kiểm soát đồng thời.

## Tiền tố đích gửi đi

Các đích gửi đi rõ ràng có thể bao gồm tiền tố nhà cung cấp, chẳng hạn như `telegram:123` hoặc `tg:123`. Core chỉ xem tiền tố đó là gợi ý chọn kênh khi kênh đã chọn là `last` hoặc chưa được phân giải theo cách khác, và chỉ khi Plugin đã tải quảng bá tiền tố đó. Nếu bên gọi đã chọn một kênh rõ ràng, tiền tố nhà cung cấp phải khớp với kênh đó; các tổ hợp chéo kênh như gửi WhatsApp đến `telegram:123` sẽ thất bại trước bước chuẩn hóa đích riêng của Plugin.

Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn nằm trong ngữ pháp của kênh đã chọn. Tự chúng không chọn nhà cung cấp.

## Dạng khóa phiên (ví dụ)

Tin nhắn trực tiếp mặc định được gộp vào phiên **main** của agent:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

Ngay cả khi lịch sử trò chuyện tin nhắn trực tiếp được chia sẻ với main, chính sách sandbox và
công cụ dùng một khóa runtime trò chuyện trực tiếp dẫn xuất theo từng tài khoản cho DM bên ngoài
để các tin nhắn phát sinh từ kênh không bị xử lý như các lần chạy phiên main cục bộ.

Nhóm và kênh vẫn được biệt lập theo từng kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Luồng:

- Luồng Slack/Discord thêm `:thread:<threadId>` vào khóa cơ sở.
- Chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` trong khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim tuyến DM main

Khi `session.dmScope` là `main`, tin nhắn trực tiếp có thể chia sẻ một phiên main.
Để ngăn `lastRoute` của phiên bị ghi đè bởi các DM không phải chủ sở hữu,
OpenClaw suy luận một chủ sở hữu đã ghim từ `allowFrom` khi tất cả điều kiện sau đúng:

- `allowFrom` có đúng một mục không phải ký tự đại diện.
- Mục đó có thể được chuẩn hóa thành một ID người gửi cụ thể cho kênh đó.
- Người gửi DM đến không khớp với chủ sở hữu đã ghim đó.

Trong trường hợp không khớp đó, OpenClaw vẫn ghi metadata phiên đến, nhưng
bỏ qua việc cập nhật `lastRoute` của phiên main.

## Ghi nhận đầu vào được bảo vệ

Plugin kênh có thể đánh dấu một bản ghi phiên đến là `createIfMissing: false`
khi một đường dẫn được bảo vệ không được tạo phiên OpenClaw mới. Trong chế độ đó,
OpenClaw có thể cập nhật metadata và `lastRoute` cho một phiên hiện có, nhưng
không tạo mục phiên chỉ có tuyến chỉ vì đã quan sát thấy một tin nhắn.

## Quy tắc định tuyến (cách chọn agent)

Định tuyến chọn **một agent** cho mỗi tin nhắn đến:

1. **Khớp peer chính xác** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp peer cha** (kế thừa luồng).
3. **Khớp guild + vai trò** (Discord) qua `guildId` + `roles`.
4. **Khớp guild** (Discord) qua `guildId`.
5. **Khớp team** (Slack) qua `teamId`.
6. **Khớp tài khoản** (`accountId` trên kênh).
7. **Khớp kênh** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
8. **Agent mặc định** (`agents.list[].default`, nếu không thì mục danh sách đầu tiên, dự phòng về `main`).

Khi một binding bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường đã cung cấp phải khớp** để binding đó được áp dụng.

Agent được khớp xác định workspace và kho phiên nào được dùng.

## Nhóm broadcast (chạy nhiều agent)

Nhóm broadcast cho phép bạn chạy **nhiều agent** cho cùng một peer **khi OpenClaw bình thường sẽ phản hồi** (ví dụ: trong nhóm WhatsApp, sau bước cổng đề cập/kích hoạt).

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

Xem: [Nhóm broadcast](/vi/channels/broadcast-groups).

## Tổng quan cấu hình

- `agents.list`: định nghĩa agent có tên (workspace, mô hình, v.v.).
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

Kho phiên nằm dưới thư mục trạng thái (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript JSONL nằm cạnh kho

Bạn có thể ghi đè đường dẫn kho qua `session.store` và tạo mẫu `{agentId}`.

Khám phá phiên Gateway và ACP cũng quét các kho agent được lưu trên đĩa dưới
gốc `agents/` mặc định và dưới các gốc `session.store` đã tạo mẫu. Các kho được
phát hiện phải nằm bên trong gốc agent đã phân giải đó và dùng tệp
`sessions.json` thông thường. Symlink và đường dẫn ngoài gốc bị bỏ qua.

## Hành vi WebChat

WebChat gắn vào **agent đã chọn** và mặc định dùng phiên main của agent.
Vì vậy, WebChat cho phép bạn xem ngữ cảnh chéo kênh cho agent đó ở một nơi.

## Ngữ cảnh phản hồi

Phản hồi đến bao gồm:

- `ReplyToId`, `ReplyToBody`, và `ReplyToSender` khi có sẵn.
- Ngữ cảnh được trích dẫn được thêm vào `Body` dưới dạng khối `[Replying to ...]`.

Điều này nhất quán trên các kênh.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Nhóm broadcast](/vi/channels/broadcast-groups)
- [Ghép nối](/vi/channels/pairing)
