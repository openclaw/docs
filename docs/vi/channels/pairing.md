---
read_when:
    - Thiết lập kiểm soát truy cập DM
    - Ghép nối một Node iOS/Android mới
    - Đánh giá trạng thái bảo mật của OpenClaw
summary: 'Tổng quan về ghép đôi: phê duyệt ai có thể nhắn tin trực tiếp cho bạn + Node nào có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-05-04T02:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Ghép đôi” là bước phê duyệt quyền truy cập tường minh của OpenClaw.
Nó được dùng ở hai nơi:

1. **Ghép đôi tin nhắn trực tiếp (DM)** (ai được phép trò chuyện với bot)
2. **Ghép đôi Node** (thiết bị/nút nào được phép tham gia mạng Gateway)

Ngữ cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép đôi tin nhắn trực tiếp (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi chưa biết sẽ nhận một mã ngắn và tin nhắn của họ sẽ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại trong: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ công khai khi danh sách cho phép DM hiệu lực bao gồm `"*"`.
Thiết lập và xác thực yêu cầu ký tự đại diện đó cho các cấu hình công khai-mở. Nếu trạng thái hiện có chứa `open` với các mục `allowFrom` cụ thể, thời gian chạy vẫn chỉ cho phép những người gửi đó, và các phê duyệt trong kho ghép đôi không mở rộng quyền truy cập `open`.

Mã ghép đôi:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép đôi khi một yêu cầu mới được tạo (khoảng một lần mỗi giờ cho mỗi người gửi).
- Các yêu cầu ghép đôi DM đang chờ được giới hạn mặc định ở **3 yêu cầu mỗi kênh**; các yêu cầu bổ sung bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép đôi DM cũng khởi tạo
`commands.ownerAllowFrom` cho người gửi đã được phê duyệt, chẳng hạn `telegram:123456789`.
Điều đó cung cấp cho các thiết lập lần đầu một chủ sở hữu tường minh cho các lệnh đặc quyền và lời nhắc phê duyệt exec. Sau khi đã có chủ sở hữu, các phê duyệt ghép đôi sau đó chỉ cấp quyền truy cập DM; chúng không thêm chủ sở hữu khác.

Kênh được hỗ trợ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Nhóm người gửi có thể tái sử dụng

Dùng `accessGroups` cấp cao nhất khi cùng một tập người gửi đáng tin cậy cần áp dụng cho nhiều kênh nhắn tin hoặc cho cả danh sách cho phép DM và nhóm.

Nhóm tĩnh dùng `type: "message.senders"` và được tham chiếu bằng
`accessGroup:<name>` từ danh sách cho phép của kênh:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Nhóm truy cập được ghi lại chi tiết tại đây: [Nhóm truy cập](/vi/channels/access-groups)

### Trạng thái được lưu ở đâu

Được lưu dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định dùng tệp danh sách cho phép không phạm vi theo kênh.

Hãy xem các tệp này là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho danh sách cho phép ghép đôi dùng cho quyền truy cập DM. Ủy quyền nhóm là riêng biệt.
Phê duyệt mã ghép đôi DM không tự động cho phép người gửi đó chạy lệnh nhóm hoặc điều khiển bot trong nhóm. Khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng trong `commands.ownerAllowFrom`, và việc gửi trò chuyện nhóm vẫn tuân theo danh sách cho phép nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc ghi đè theo nhóm hoặc theo chủ đề tùy kênh).
</Note>

## 2) Ghép đôi thiết bị Node (Node iOS/Android/macOS/headless)

Node kết nối tới Gateway dưới dạng **thiết bị** với `role: node`. Gateway
tạo yêu cầu ghép đôi thiết bị cần được phê duyệt.

### Ghép đôi qua Telegram (khuyến nghị cho iOS)

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép đôi thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn tin cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw iOS → Settings → Gateway.
4. Dán mã thiết lập và kết nối.
5. Quay lại Telegram: `/pair pending` (xem lại ID yêu cầu, vai trò và phạm vi), rồi phê duyệt.

Mã thiết lập là payload JSON được mã hóa base64 chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token khởi tạo ngắn hạn cho một thiết bị, dùng cho bắt tay ghép đôi ban đầu

Token khởi tạo đó mang hồ sơ khởi tạo ghép đôi tích hợp sẵn:

- token `node` chính được bàn giao giữ nguyên `scopes: []`
- mọi token `operator` được bàn giao vẫn bị giới hạn trong danh sách cho phép khởi tạo:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kiểm tra phạm vi khởi tạo có tiền tố theo vai trò, không phải một nhóm phạm vi phẳng:
  các mục phạm vi operator chỉ thỏa mãn yêu cầu operator, và các vai trò không phải operator vẫn phải yêu cầu phạm vi dưới tiền tố vai trò riêng của chúng
- việc xoay vòng/thu hồi token sau đó vẫn bị giới hạn bởi cả hợp đồng vai trò đã phê duyệt của thiết bị và phạm vi operator của phiên gọi

Hãy xử lý mã thiết lập như mật khẩu khi nó còn hiệu lực.

### Phê duyệt thiết bị Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi một phê duyệt tường minh bị từ chối vì phiên thiết bị đã ghép đôi dùng để phê duyệt được mở với phạm vi chỉ-ghép-đôi, CLI thử lại cùng yêu cầu với
`operator.admin`. Điều này cho phép một thiết bị đã ghép đôi có khả năng quản trị hiện có khôi phục một lần ghép đôi Control UI/trình duyệt mới mà không cần chỉnh sửa thủ công `devices/paired.json`. Gateway vẫn xác thực kết nối được thử lại; các token không thể xác thực với `operator.admin` vẫn bị chặn.

Nếu cùng thiết bị thử lại với chi tiết xác thực khác (ví dụ vai trò/phạm vi/khóa công khai khác), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.

<Note>
Một thiết bị đã ghép đôi không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu nhiều phạm vi hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp đang chờ mới. Dùng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tự động phê duyệt Node theo CIDR tin cậy tùy chọn

Ghép đôi thiết bị vẫn là thủ công theo mặc định. Với các mạng Node được kiểm soát chặt chẽ, bạn có thể chọn tham gia tự động phê duyệt Node lần đầu bằng CIDR tường minh hoặc IP chính xác:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Điều này chỉ áp dụng cho các yêu cầu ghép đôi `role: node` mới không có phạm vi được yêu cầu. Các máy khách operator, trình duyệt, Control UI và WebChat vẫn yêu cầu phê duyệt thủ công. Các thay đổi về vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn yêu cầu phê duyệt thủ công.

### Lưu trữ trạng thái ghép đôi Node

Được lưu dưới `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép đôi + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một kho ghép đôi riêng do Gateway sở hữu. Node WS vẫn yêu cầu ghép đôi thiết bị.
- Bản ghi ghép đôi là nguồn sự thật bền vững cho các vai trò đã phê duyệt. Token thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã phê duyệt đó; một mục token lạc ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

## Tài liệu liên quan

- Mô hình bảo mật + prompt injection: [Bảo mật](/vi/gateway/security)
- Cập nhật an toàn (chạy doctor): [Cập nhật](/vi/install/updating)
- Cấu hình kênh:
  - Telegram: [Telegram](/vi/channels/telegram)
  - WhatsApp: [WhatsApp](/vi/channels/whatsapp)
  - Signal: [Signal](/vi/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/vi/channels/bluebubbles)
  - iMessage (cũ): [iMessage](/vi/channels/imessage)
  - Discord: [Discord](/vi/channels/discord)
  - Slack: [Slack](/vi/channels/slack)
