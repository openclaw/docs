---
read_when:
    - Thiết lập kiểm soát quyền truy cập DM
    - Ghép nối một Node iOS/Android mới
    - Đánh giá trạng thái bảo mật của OpenClaw
summary: 'Tổng quan về ghép đôi: phê duyệt ai có thể nhắn tin trực tiếp cho bạn + những nút nào có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-05-10T19:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

"Ghép nối" là bước phê duyệt quyền truy cập rõ ràng của OpenClaw.
Nó được dùng ở hai nơi:

1. **Ghép nối DM** (ai được phép trò chuyện với bot)
2. **Ghép nối Node** (thiết bị/Node nào được phép tham gia mạng Gateway)

Ngữ cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép nối DM (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ sẽ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi tài liệu tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ là công khai khi danh sách cho phép DM hiệu lực bao gồm `"*"`.
Thiết lập và xác thực yêu cầu wildcard đó cho các cấu hình công khai-mở. Nếu trạng thái
hiện có chứa `open` với các mục `allowFrom` cụ thể, runtime vẫn chỉ cho phép
những người gửi đó, và các phê duyệt trong kho ghép nối không mở rộng quyền truy cập `open`.

Mã ghép nối:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép nối khi một yêu cầu mới được tạo (xấp xỉ mỗi giờ một lần cho mỗi người gửi).
- Các yêu cầu ghép nối DM đang chờ được giới hạn mặc định ở **3 yêu cầu cho mỗi kênh**; các yêu cầu bổ sung sẽ bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép nối DM cũng sẽ khởi tạo
`commands.ownerAllowFrom` thành người gửi được phê duyệt, chẳng hạn `telegram:123456789`.
Điều đó cung cấp cho thiết lập lần đầu một chủ sở hữu rõ ràng cho các lệnh đặc quyền và lời nhắc
phê duyệt exec. Sau khi đã có chủ sở hữu, các phê duyệt ghép nối sau đó chỉ cấp quyền truy cập
DM; chúng không thêm chủ sở hữu nữa.

Các kênh được hỗ trợ: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Nhóm người gửi có thể tái sử dụng

Dùng `accessGroups` cấp cao nhất khi cùng một tập người gửi đáng tin cậy cần áp dụng cho
nhiều kênh nhắn tin hoặc cho cả danh sách cho phép DM và nhóm.

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

Nhóm truy cập được ghi tài liệu chi tiết tại đây: [Nhóm truy cập](/vi/channels/access-groups)

### Trạng thái được lưu ở đâu

Được lưu dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi theo tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định dùng tệp danh sách cho phép không phạm vi theo kênh.

Hãy xem các tệp này là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho danh sách cho phép ghép nối dùng cho quyền truy cập DM. Ủy quyền nhóm là riêng biệt.
Việc phê duyệt mã ghép nối DM không tự động cho phép người gửi đó chạy lệnh nhóm
hoặc điều khiển bot trong nhóm. Khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng
trong `commands.ownerAllowFrom`, và việc gửi tin nhắn trò chuyện nhóm vẫn tuân theo
danh sách cho phép nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc các ghi đè theo nhóm
hoặc theo chủ đề tùy kênh).
</Note>

## 2) Ghép nối thiết bị Node (Node iOS/Android/macOS/headless)

Node kết nối đến Gateway dưới dạng **thiết bị** với `role: node`. Gateway
tạo một yêu cầu ghép nối thiết bị cần được phê duyệt.

### Ghép nối qua Telegram (khuyến nghị cho iOS)

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép nối thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw iOS → Settings → Gateway.
4. Quét mã QR hoặc dán mã thiết lập rồi kết nối.
5. Quay lại Telegram: `/pair pending` (xem lại ID yêu cầu, vai trò và phạm vi), rồi phê duyệt.

Mã thiết lập là payload JSON được mã hóa base64, chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token khởi tạo ngắn hạn cho một thiết bị, dùng cho bắt tay ghép nối ban đầu

Token khởi tạo đó mang hồ sơ khởi tạo ghép nối tích hợp sẵn:

- token `node` chính được bàn giao vẫn là `scopes: []`
- mọi token `operator` được bàn giao vẫn bị giới hạn trong danh sách cho phép khởi tạo:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kiểm tra phạm vi khởi tạo được tiền tố theo vai trò, không phải một nhóm phạm vi phẳng:
  các mục phạm vi operator chỉ đáp ứng yêu cầu operator, và các vai trò không phải operator
  vẫn phải yêu cầu phạm vi dưới tiền tố vai trò của chính chúng
- việc xoay vòng/thu hồi token sau này vẫn bị giới hạn bởi cả hợp đồng vai trò đã phê duyệt
  của thiết bị và phạm vi operator của phiên gọi

Hãy xem mã thiết lập như mật khẩu khi nó còn hiệu lực.

Đối với Tailscale, công khai, hoặc ghép nối di động từ xa khác, hãy dùng Tailscale Serve/Funnel
hoặc một URL Gateway `wss://` khác. Mã thiết lập `ws://` văn bản thuần chỉ được chấp nhận
cho loopback, địa chỉ LAN riêng, máy chủ Bonjour `.local`, và máy chủ trình giả lập Android.
Địa chỉ CGNAT tailnet, tên `.ts.net`, và máy chủ công khai vẫn bị đóng trước khi phát hành QR/mã thiết lập.

### Phê duyệt thiết bị Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi một phê duyệt rõ ràng bị từ chối vì phiên thiết bị đã ghép nối đang phê duyệt
được mở với phạm vi chỉ ghép nối, CLI sẽ thử lại cùng yêu cầu với
`operator.admin`. Điều này cho phép một thiết bị đã ghép nối có quyền admin hiện có khôi phục một lần ghép nối
Control UI/trình duyệt mới mà không cần chỉnh sửa `devices/paired.json` thủ công. Gateway
vẫn xác thực kết nối được thử lại; các token không thể xác thực
với `operator.admin` vẫn bị chặn.

Nếu cùng thiết bị thử lại với chi tiết xác thực khác (ví dụ khóa công khai/vai trò/phạm vi
khác), yêu cầu đang chờ trước đó sẽ bị thay thế và một
`requestId` mới được tạo.

<Note>
Một thiết bị đã ghép nối không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu nhiều phạm vi hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Dùng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tùy chọn tự động phê duyệt Node theo CIDR đáng tin cậy

Ghép nối thiết bị vẫn là thủ công theo mặc định. Đối với các mạng Node được kiểm soát chặt chẽ,
bạn có thể chọn tự động phê duyệt Node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Điều này chỉ áp dụng cho các yêu cầu ghép nối `role: node` mới không có
phạm vi được yêu cầu. Máy khách operator, trình duyệt, Control UI, và WebChat vẫn cần
phê duyệt thủ công. Thay đổi vai trò, phạm vi, metadata, và khóa công khai vẫn cần
phê duyệt thủ công.

### Lưu trữ trạng thái ghép nối Node

Được lưu dưới `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép nối + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một
  kho ghép nối riêng do gateway sở hữu. Node WS vẫn cần ghép nối thiết bị.
- Bản ghi ghép nối là nguồn chân lý bền vững cho các vai trò đã phê duyệt. Token
  thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã phê duyệt đó; một mục token lạc
  nằm ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

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
