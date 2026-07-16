---
read_when:
    - Thay đổi cách định tuyến kênh hoặc hành vi hộp thư đến
summary: Quy tắc định tuyến theo từng kênh (WhatsApp, Telegram, Discord, Slack) và ngữ cảnh dùng chung
title: Định tuyến kênh
x-i18n:
    generated_at: "2026-07-16T14:50:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kênh & định tuyến

OpenClaw định tuyến phản hồi **trở lại kênh nơi tin nhắn được gửi đến**. Mô hình
không chọn kênh; việc định tuyến mang tính xác định và do cấu hình của máy chủ
kiểm soát.

## Thuật ngữ chính

- **Kênh**: một plugin kênh đi kèm như `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` hoặc `whatsapp`, cùng với các kênh plugin đã cài đặt. `webchat` là kênh UI WebChat nội bộ và không phải là kênh gửi đi có thể cấu hình.
- **AccountId**: phiên bản tài khoản riêng cho từng kênh (khi được hỗ trợ).
- Tài khoản mặc định tùy chọn của kênh: `channels.<channel>.defaultAccount` chọn
  tài khoản được sử dụng khi đường dẫn gửi đi không chỉ định `accountId`.
  - Trong thiết lập nhiều tài khoản, hãy đặt một tài khoản mặc định rõ ràng (`defaultAccount` hoặc tài khoản có tên `default`) khi cấu hình từ hai tài khoản trở lên. Nếu không, định tuyến dự phòng có thể chọn ID tài khoản đã chuẩn hóa đầu tiên.
- **AgentId**: một không gian làm việc + kho phiên biệt lập ("bộ não").
- **SessionKey**: khóa nhóm dùng để lưu trữ ngữ cảnh và kiểm soát tính đồng thời.

## Tiền tố đích gửi đi

Các đích gửi đi rõ ràng có thể bao gồm tiền tố nhà cung cấp, chẳng hạn như `telegram:123` hoặc `tg:123`. Lõi chỉ coi tiền tố đó là gợi ý chọn kênh khi kênh được chọn là `last` hoặc chưa được phân giải, và chỉ khi plugin đã tải công bố tiền tố đó. Nếu bên gọi đã chọn một kênh rõ ràng, tiền tố nhà cung cấp phải khớp với kênh đó; các tổ hợp chéo kênh như gửi WhatsApp đến `telegram:123` sẽ thất bại trước bước chuẩn hóa đích dành riêng cho plugin.

Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` và `sms:<number>` vẫn nằm trong ngữ pháp của kênh đã chọn. Bản thân chúng không chọn nhà cung cấp.

## Dạng khóa phiên (ví dụ)

Theo mặc định, tin nhắn trực tiếp được gộp vào phiên **chính** của agent:

- `agent:<agentId>:<mainKey>` (mặc định: `agent:main:main`)

`session.dmScope` kiểm soát việc gộp DM: `main` (mặc định) dùng chung một phiên
chính, trong khi `per-peer`, `per-channel-peer` và `per-account-channel-peer`
giữ các DM trong những phiên riêng biệt. Một liên kết định tuyến có thể ghi đè phạm vi cho
các đối tác ngang hàng khớp với nó thông qua `bindings[].session.dmScope`.

Ngay cả khi lịch sử hội thoại tin nhắn trực tiếp được dùng chung với phiên chính, sandbox và
chính sách công cụ vẫn sử dụng khóa thời gian chạy trò chuyện trực tiếp riêng theo từng tài khoản được dẫn xuất cho các DM bên ngoài
để các tin nhắn bắt nguồn từ kênh không bị xử lý như các lượt chạy phiên chính cục bộ.

Các nhóm và kênh vẫn được tách biệt theo từng kênh:

- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Kênh/phòng: `agent:<agentId>:<channel>:channel:<id>`

Luồng:

- Các luồng Slack/Discord nối thêm `:thread:<threadId>` vào khóa cơ sở.
- Các chủ đề diễn đàn Telegram nhúng `:topic:<topicId>` vào khóa nhóm.

Ví dụ:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ghim tuyến DM chính

Khi `session.dmScope` là `main`, các tin nhắn trực tiếp có thể dùng chung một phiên chính.
Để ngăn `lastRoute` của phiên bị DM không phải của chủ sở hữu ghi đè,
OpenClaw suy ra một chủ sở hữu được ghim từ `allowFrom` khi tất cả các điều kiện sau đều đúng:

- `allowFrom` có chính xác một mục không phải ký tự đại diện.
- Mục đó có thể được chuẩn hóa thành ID người gửi cụ thể cho kênh đó.
- Người gửi DM đến không khớp với chủ sở hữu được ghim đó.

Trong trường hợp không khớp này, OpenClaw vẫn ghi lại siêu dữ liệu phiên đến, nhưng
bỏ qua việc cập nhật `lastRoute` của phiên chính.

## Ghi nhận tin nhắn đến có bảo vệ

Plugin kênh có thể đánh dấu một bản ghi phiên đến là `createIfMissing: false`
khi đường dẫn có bảo vệ không được tạo phiên OpenClaw mới. Ở chế độ đó,
OpenClaw có thể cập nhật siêu dữ liệu và `lastRoute` cho một phiên hiện có, nhưng
không tạo mục phiên chỉ phục vụ định tuyến chỉ vì quan sát thấy một tin nhắn.

## Quy tắc định tuyến (cách chọn agent)

Định tuyến chọn **một agent** cho mỗi tin nhắn đến:

1. **Khớp chính xác đối tác ngang hàng** (`bindings` với `peer.kind` + `peer.id`).
2. **Khớp đối tác ngang hàng cha** (kế thừa luồng).
3. **Khớp ký tự đại diện đối tác ngang hàng** (`peer.id: "*"` cho một loại đối tác ngang hàng).
4. **Khớp máy chủ + vai trò** (Discord) thông qua `guildId` + `roles`.
5. **Khớp máy chủ** (Discord) thông qua `guildId`.
6. **Khớp nhóm** (Slack) thông qua `teamId`.
7. **Khớp tài khoản** (`accountId` trên kênh).
8. **Khớp kênh** (bất kỳ tài khoản nào trên kênh đó, `accountId: "*"`).
9. **Agent mặc định** (`agents.list[].default`, nếu không thì mục đầu tiên trong danh sách, dự phòng về `main`).

Khi một liên kết bao gồm nhiều trường khớp (`peer`, `guildId`, `teamId`, `roles`), **tất cả các trường được cung cấp phải khớp** thì liên kết đó mới được áp dụng.

Agent khớp xác định không gian làm việc và kho phiên được sử dụng.

## Nhóm phát rộng (chạy nhiều agent)

Nhóm phát rộng cho phép bạn chạy **nhiều agent** cho cùng một đối tác ngang hàng **khi OpenClaw thông thường sẽ phản hồi** (ví dụ: trong nhóm WhatsApp, sau khi vượt qua bước kiểm soát lượt đề cập/kích hoạt).

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

- `agents.list`: các định nghĩa agent có tên (không gian làm việc, mô hình, v.v.).
- `bindings`: ánh xạ các kênh/tài khoản/đối tác ngang hàng đến với agent.

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

Các hàng phiên thời gian chạy nằm trong cơ sở dữ liệu SQLite của từng agent bên dưới thư mục
trạng thái (mặc định `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Các bản cài đặt cũ hơn có thể chứa tệp JSONL bản chép lời cũ và kho hàng `sessions.json`
bên dưới `~/.openclaw/agents/<agentId>/sessions/`. Quá trình khởi động Gateway và
`openclaw doctor --fix` tự động nhập các hàng/lịch sử cũ đang hoạt động vào SQLite.
Sử dụng `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` và trình tự xác thực
[Doctor](/vi/cli/doctor#session-sqlite-migration) khi bạn cần
bằng chứng di chuyển rõ ràng.
Bạn vẫn có thể chọn đường dẫn kho cũ thông qua khuôn mẫu `session.store` và `{agentId}`
cho quy trình di chuyển và bảo trì ngoại tuyến.

Hoạt động khám phá phiên của Gateway và ACP cũng quét các kho agent trên đĩa bên dưới
gốc `agents/` mặc định và bên dưới các gốc `session.store` được tạo theo khuôn mẫu. Các kho được phát hiện
phải nằm trong gốc agent đã phân giải đó và sử dụng một tệp `sessions.json`
cũ thông thường. Các liên kết tượng trưng và đường dẫn ngoài gốc sẽ bị bỏ qua.

## Hành vi của WebChat

WebChat gắn với **agent đã chọn** và mặc định dùng phiên chính của agent.
Nhờ đó, WebChat cho phép bạn xem ngữ cảnh chéo kênh của agent đó tại một nơi.

## Ngữ cảnh phản hồi

Các phản hồi đến bao gồm:

- `ReplyToId`, `ReplyToBody` và `ReplyToSender` khi có.
- Ngữ cảnh được trích dẫn được nối vào `Body` dưới dạng khối `[Replying to ...]`.

Hành vi này nhất quán trên tất cả các kênh.

## Liên quan

- [Nhóm](/vi/channels/groups)
- [Nhóm phát rộng](/vi/channels/broadcast-groups)
- [Ghép nối](/vi/channels/pairing)
