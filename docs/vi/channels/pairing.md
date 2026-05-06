---
read_when:
    - Thiết lập kiểm soát quyền truy cập DM
    - Ghép nối một Node iOS/Android mới
    - Đánh giá tình trạng bảo mật của OpenClaw
summary: 'Tổng quan về ghép nối: phê duyệt ai có thể nhắn tin trực tiếp cho bạn + những Node nào có thể tham gia'
title: Ghép đôi
x-i18n:
    generated_at: "2026-05-06T17:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

“Ghép cặp” là bước phê duyệt quyền truy cập rõ ràng của OpenClaw.
Nó được dùng ở hai nơi:

1. **Ghép cặp DM** (ai được phép nói chuyện với bot)
2. **Ghép cặp Node** (thiết bị/Node nào được phép tham gia mạng Gateway)

Ngữ cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép cặp DM (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ sẽ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ là công khai khi danh sách cho phép DM hiệu lực bao gồm `"*"`.
Việc thiết lập và xác thực yêu cầu ký tự đại diện đó cho các cấu hình public-open. Nếu trạng thái hiện có chứa `open` với các mục `allowFrom` cụ thể, runtime vẫn chỉ cho phép những người gửi đó, và các phê duyệt trong kho ghép cặp không mở rộng quyền truy cập `open`.

Mã ghép cặp:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép cặp khi một yêu cầu mới được tạo (xấp xỉ một lần mỗi giờ cho mỗi người gửi).
- Các yêu cầu ghép cặp DM đang chờ được giới hạn mặc định ở **3 yêu cầu mỗi kênh**; các yêu cầu bổ sung sẽ bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép cặp DM cũng khởi tạo
`commands.ownerAllowFrom` cho người gửi được phê duyệt, chẳng hạn `telegram:123456789`.
Điều đó cung cấp cho các thiết lập lần đầu một chủ sở hữu rõ ràng cho các lệnh đặc quyền và lời nhắc phê duyệt exec. Sau khi đã có chủ sở hữu, các phê duyệt ghép cặp sau này chỉ cấp quyền truy cập DM; chúng không thêm chủ sở hữu nữa.

Các kênh được hỗ trợ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Nhóm người gửi có thể tái sử dụng

Dùng `accessGroups` cấp cao nhất khi cùng một tập người gửi đáng tin cậy cần áp dụng cho nhiều kênh nhắn tin hoặc cho cả danh sách cho phép DM và nhóm.

Các nhóm tĩnh dùng `type: "message.senders"` và được tham chiếu bằng
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

### Nơi lưu trạng thái

Được lưu dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định dùng tệp danh sách cho phép không theo phạm vi nhưng theo kênh.

Hãy xem chúng là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho danh sách cho phép ghép cặp dành cho quyền truy cập DM. Ủy quyền nhóm là riêng biệt.
Phê duyệt mã ghép cặp DM không tự động cho phép người gửi đó chạy lệnh nhóm hoặc điều khiển bot trong nhóm. Việc khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng trong `commands.ownerAllowFrom`, và việc gửi đến cuộc trò chuyện nhóm vẫn tuân theo danh sách cho phép nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc ghi đè theo nhóm hoặc theo chủ đề tùy kênh).
</Note>

## 2) Ghép cặp thiết bị Node (Node iOS/Android/macOS/headless)

Node kết nối tới Gateway dưới dạng **thiết bị** với `role: node`. Gateway tạo một yêu cầu ghép cặp thiết bị cần được phê duyệt.

### Ghép cặp qua Telegram (khuyến nghị cho iOS)

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép cặp thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw iOS → Settings → Gateway.
4. Quét mã QR hoặc dán mã thiết lập và kết nối.
5. Quay lại Telegram: `/pair pending` (xem lại ID yêu cầu, vai trò và phạm vi), rồi phê duyệt.

Mã thiết lập là payload JSON được mã hóa base64 chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token bootstrap tồn tại ngắn hạn cho một thiết bị, dùng cho bắt tay ghép cặp ban đầu

Token bootstrap đó mang hồ sơ bootstrap ghép cặp dựng sẵn:

- token `node` được bàn giao chính vẫn giữ `scopes: []`
- mọi token `operator` được bàn giao vẫn bị giới hạn trong danh sách cho phép bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kiểm tra phạm vi bootstrap được đặt tiền tố theo vai trò, không phải một nhóm phạm vi phẳng:
  các mục phạm vi operator chỉ thỏa mãn yêu cầu operator, và các vai trò không phải operator vẫn phải yêu cầu phạm vi dưới tiền tố vai trò riêng của chúng
- việc xoay vòng/thu hồi token về sau vẫn bị giới hạn bởi cả hợp đồng vai trò đã phê duyệt của thiết bị và phạm vi operator của phiên gọi

Hãy xem mã thiết lập như mật khẩu trong thời gian nó còn hiệu lực.

Đối với Tailscale, công khai, hoặc ghép cặp di động từ xa khác, hãy dùng Tailscale Serve/Funnel hoặc một URL Gateway `wss://` khác. Mã thiết lập dạng văn bản thuần `ws://` chỉ được chấp nhận cho loopback, địa chỉ LAN riêng, máy chủ Bonjour `.local` và máy chủ trình giả lập Android. Địa chỉ CGNAT tailnet, tên `.ts.net` và máy chủ công khai vẫn bị đóng trước khi phát hành QR/mã thiết lập.

### Phê duyệt thiết bị Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi phê duyệt rõ ràng bị từ chối vì phiên thiết bị đã ghép cặp dùng để phê duyệt được mở với phạm vi chỉ dành cho ghép cặp, CLI thử lại cùng yêu cầu với `operator.admin`. Điều này cho phép một thiết bị đã ghép cặp có khả năng admin hiện có khôi phục một ghép cặp Control UI/trình duyệt mới mà không cần chỉnh sửa `devices/paired.json` thủ công. Gateway vẫn xác thực kết nối được thử lại; các token không thể xác thực với `operator.admin` vẫn bị chặn.

Nếu cùng một thiết bị thử lại với chi tiết xác thực khác (ví dụ vai trò/phạm vi/khóa công khai khác), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.

<Note>
Một thiết bị đã ghép cặp không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu thêm phạm vi hoặc một vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Dùng `openclaw devices list` để so sánh quyền truy cập hiện đã được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tùy chọn tự động phê duyệt Node theo CIDR đáng tin cậy

Ghép cặp thiết bị mặc định vẫn là thủ công. Với các mạng Node được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt Node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Điều này chỉ áp dụng cho các yêu cầu ghép cặp `role: node` mới, không có phạm vi được yêu cầu.
Các client Operator, trình duyệt, Control UI và WebChat vẫn yêu cầu phê duyệt thủ công. Thay đổi vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn yêu cầu phê duyệt thủ công.

### Lưu trữ trạng thái ghép cặp Node

Được lưu dưới `~/.openclaw/devices/`:

- `pending.json` (tồn tại ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép cặp + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một kho ghép cặp riêng do Gateway sở hữu. Các Node WS vẫn yêu cầu ghép cặp thiết bị.
- Bản ghi ghép cặp là nguồn sự thật bền vững cho các vai trò đã phê duyệt. Token thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã phê duyệt đó; một mục token lạc ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

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
