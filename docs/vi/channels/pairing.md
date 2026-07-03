---
read_when:
    - Thiết lập kiểm soát quyền truy cập DM
    - Ghép nối một nút iOS/Android mới
    - Rà soát tư thế bảo mật của OpenClaw
summary: 'Tổng quan về ghép nối: phê duyệt ai có thể nhắn DM cho bạn + những node nào có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-07-03T17:28:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

"Ghép cặp" là bước phê duyệt quyền truy cập rõ ràng của OpenClaw.
Bước này được dùng ở hai nơi:

1. **Ghép cặp DM** (ai được phép trò chuyện với bot)
2. **Ghép cặp Node** (thiết bị/node nào được phép tham gia mạng Gateway)

Bối cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép cặp DM (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi chưa xác định sẽ nhận được một mã ngắn và tin nhắn của họ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi trong tài liệu tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ là công khai khi danh sách cho phép DM hiệu dụng bao gồm `"*"`.
Thiết lập và xác thực yêu cầu ký tự đại diện đó cho các cấu hình mở công khai. Nếu trạng thái hiện có chứa `open` với các mục `allowFrom` cụ thể, runtime vẫn chỉ chấp nhận những người gửi đó, và các phê duyệt trong kho ghép cặp không mở rộng quyền truy cập `open`.

Mã ghép cặp:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép cặp khi một yêu cầu mới được tạo (khoảng một lần mỗi giờ cho mỗi người gửi).
- Các yêu cầu ghép cặp DM đang chờ được giới hạn mặc định ở **3 yêu cầu mỗi kênh**; các yêu cầu bổ sung bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép cặp DM cũng khởi tạo `commands.ownerAllowFrom` thành người gửi đã được phê duyệt, chẳng hạn như `telegram:123456789`.
Điều đó cung cấp cho các thiết lập lần đầu một chủ sở hữu rõ ràng cho các lệnh đặc quyền và lời nhắc phê duyệt exec. Sau khi đã có chủ sở hữu, các phê duyệt ghép cặp sau đó chỉ cấp quyền truy cập DM; chúng không thêm chủ sở hữu nào nữa.

Các kênh được hỗ trợ: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Nhóm người gửi có thể tái sử dụng

Dùng `accessGroups` cấp cao nhất khi cùng một tập người gửi đáng tin cậy cần áp dụng cho nhiều kênh nhắn tin hoặc cho cả danh sách cho phép DM và nhóm.

Nhóm tĩnh dùng `type: "message.senders"` và được tham chiếu bằng `accessGroup:<name>` từ danh sách cho phép của kênh:

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

Nhóm truy cập được ghi chi tiết tại đây: [Nhóm truy cập](/vi/channels/access-groups)

### Trạng thái được lưu ở đâu

Được lưu dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi theo tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định dùng tệp danh sách cho phép không theo phạm vi, ở cấp kênh.

Hãy coi các tệp này là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho danh sách cho phép ghép cặp dành cho quyền truy cập DM. Việc ủy quyền nhóm là riêng biệt.
Phê duyệt mã ghép cặp DM không tự động cho phép người gửi đó chạy lệnh nhóm hoặc điều khiển bot trong nhóm. Khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng trong `commands.ownerAllowFrom`, và việc gửi đến chat nhóm vẫn tuân theo danh sách cho phép nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc ghi đè theo từng nhóm hay từng chủ đề tùy kênh).
</Note>

## 2) Ghép cặp thiết bị Node (node iOS/Android/macOS/headless)

Các node kết nối với Gateway dưới dạng **thiết bị** với `role: node`. Gateway tạo một yêu cầu ghép cặp thiết bị cần được phê duyệt.

### Ghép cặp qua Telegram (khuyến nghị cho iOS)

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép cặp thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn tin cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw iOS → Settings → Gateway.
4. Quét mã QR hoặc dán mã thiết lập rồi kết nối.
5. Quay lại Telegram: `/pair pending` (xem lại ID yêu cầu, vai trò và phạm vi), rồi phê duyệt.

Mã thiết lập là một tải JSON được mã hóa base64, chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token khởi tạo ngắn hạn cho một thiết bị, dùng cho bắt tay ghép cặp ban đầu

Token khởi tạo đó mang hồ sơ khởi tạo ghép cặp tích hợp sẵn:

- hồ sơ thiết lập tích hợp sẵn chỉ cho phép đường cơ sở QR/mã thiết lập mới:
  `node` cộng với bàn giao `operator` có giới hạn
- token `node` được bàn giao vẫn giữ `scopes: []`
- token `operator` được bàn giao bị giới hạn ở `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, và `operator.write`
- `operator.admin` không được cấp bởi khởi tạo QR/mã thiết lập; nó yêu cầu một luồng ghép cặp hoặc token operator được phê duyệt riêng
- việc xoay vòng/thu hồi token sau đó vẫn bị giới hạn bởi cả hợp đồng vai trò đã phê duyệt của thiết bị và phạm vi operator của phiên người gọi

Hãy coi mã thiết lập như mật khẩu trong khi nó còn hiệu lực.

Đối với Tailscale, công khai, hoặc ghép cặp di động từ xa khác, hãy dùng Tailscale Serve/Funnel hoặc một URL Gateway `wss://` khác. Mã thiết lập `ws://` dạng văn bản thuần chỉ được chấp nhận cho loopback, địa chỉ LAN riêng, máy chủ Bonjour `.local`, và máy chủ trình giả lập Android. Địa chỉ CGNAT tailnet, tên `.ts.net`, và máy chủ công khai vẫn bị đóng lỗi trước khi phát hành QR/mã thiết lập.

### Phê duyệt thiết bị node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi một phê duyệt rõ ràng bị từ chối vì phiên thiết bị đã ghép cặp đang phê duyệt được mở với phạm vi chỉ dành cho ghép cặp, CLI thử lại cùng yêu cầu với `operator.admin`. Điều này cho phép một thiết bị đã ghép cặp có khả năng admin hiện có khôi phục một ghép cặp Control UI/trình duyệt mới mà không cần tự tay chỉnh sửa `devices/paired.json`. Gateway vẫn xác thực kết nối được thử lại; token không thể xác thực với `operator.admin` vẫn bị chặn.

Nếu cùng một thiết bị thử lại với chi tiết xác thực khác (ví dụ vai trò/phạm vi/khóa công khai khác), yêu cầu đang chờ trước đó bị thay thế và một `requestId` mới được tạo.

<Note>
Một thiết bị đã được ghép cặp không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu thêm phạm vi hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Dùng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tự động phê duyệt node theo CIDR tin cậy tùy chọn

Ghép cặp thiết bị mặc định vẫn là thủ công. Đối với các mạng node được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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
Ứng dụng khách operator, trình duyệt, Control UI, và WebChat vẫn yêu cầu phê duyệt thủ công. Thay đổi về vai trò, phạm vi, metadata, và khóa công khai vẫn yêu cầu phê duyệt thủ công.

### Lưu trữ trạng thái ghép cặp Node

Được lưu dưới `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép cặp + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một kho ghép cặp riêng do Gateway sở hữu. Các node WS vẫn yêu cầu ghép cặp thiết bị.
- Bản ghi ghép cặp là nguồn sự thật bền vững cho các vai trò đã phê duyệt. Token thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã phê duyệt đó; một mục token lạc ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

## Tài liệu liên quan

- Mô hình bảo mật + prompt injection: [Bảo mật](/vi/gateway/security)
- Cập nhật an toàn (chạy doctor): [Cập nhật](/vi/install/updating)
- Cấu hình kênh:
  - Telegram: [Telegram](/vi/channels/telegram)
  - WhatsApp: [WhatsApp](/vi/channels/whatsapp)
  - Signal: [Signal](/vi/channels/signal)
  - iMessage: [iMessage](/vi/channels/imessage)
  - Discord: [Discord](/vi/channels/discord)
  - Slack: [Slack](/vi/channels/slack)
