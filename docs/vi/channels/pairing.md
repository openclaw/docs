---
read_when:
    - Thiết lập kiểm soát truy cập DM
    - Ghép nối một node iOS/Android mới
    - Rà soát tình trạng bảo mật của OpenClaw
summary: 'Tổng quan về ghép nối: phê duyệt ai có thể nhắn tin trực tiếp cho bạn + những nút nào có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-07-04T18:05:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Ghép nối" là bước phê duyệt truy cập rõ ràng của OpenClaw.
Nó được dùng ở hai nơi:

1. **Ghép nối DM** (ai được phép nói chuyện với bot)
2. **Ghép nối Node** (thiết bị/nút nào được phép tham gia mạng Gateway)

Bối cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép nối DM (truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ công khai khi danh sách cho phép DM hiệu lực bao gồm `"*"`.
Thiết lập và xác thực yêu cầu ký tự đại diện đó cho cấu hình mở công khai. Nếu trạng thái hiện có chứa `open` với các mục `allowFrom` cụ thể, runtime vẫn chỉ cho phép những người gửi đó, và các phê duyệt trong kho ghép nối không mở rộng quyền truy cập `open`.

Mã ghép nối:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép nối khi một yêu cầu mới được tạo (xấp xỉ mỗi giờ một lần cho mỗi người gửi).
- Các yêu cầu ghép nối DM đang chờ được giới hạn mặc định ở **3 yêu cầu mỗi kênh**; các yêu cầu bổ sung bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt một người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép nối DM cũng khởi tạo
`commands.ownerAllowFrom` thành người gửi đã được phê duyệt, chẳng hạn `telegram:123456789`.
Điều đó cung cấp cho các thiết lập lần đầu một chủ sở hữu rõ ràng cho các lệnh đặc quyền và lời nhắc phê duyệt exec. Sau khi đã có chủ sở hữu, các phê duyệt ghép nối sau đó chỉ cấp quyền truy cập DM; chúng không thêm chủ sở hữu mới.

Các kênh được hỗ trợ: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

### Nơi lưu trạng thái

Được lưu trong `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho danh sách cho phép đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp danh sách cho phép theo phạm vi của chúng.
- Tài khoản mặc định dùng tệp danh sách cho phép không có phạm vi ở cấp kênh.

Hãy xem các tệp này là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho danh sách cho phép ghép nối dành cho truy cập DM. Ủy quyền nhóm là riêng biệt.
Phê duyệt một mã ghép nối DM không tự động cho phép người gửi đó chạy lệnh nhóm
hoặc điều khiển bot trong nhóm. Khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình
riêng trong `commands.ownerAllowFrom`, và việc gửi trò chuyện nhóm vẫn tuân theo
danh sách cho phép nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc ghi đè
theo từng nhóm hoặc từng chủ đề tùy theo kênh).
</Note>

## 2) Ghép nối thiết bị Node (nút iOS/Android/macOS/headless)

Các nút kết nối tới Gateway dưới dạng **thiết bị** với `role: node`. Gateway
tạo một yêu cầu ghép nối thiết bị cần được phê duyệt.

### Ghép nối từ Giao diện điều khiển (khuyến nghị)

Dùng một phiên Giao diện điều khiển đã kết nối với quyền truy cập `operator.admin`:

1. Mở Giao diện điều khiển và chọn **Nút**.
2. Trong **Thiết bị**, nhấp **Ghép nối thiết bị di động**.
3. Trên điện thoại của bạn, mở ứng dụng OpenClaw → **Cài đặt** → **Gateway**.
4. Quét mã QR hoặc dán mã thiết lập, rồi kết nối.

Ứng dụng OpenClaw iOS và Android chính thức được phê duyệt tự động khi siêu dữ liệu mã thiết lập của chúng khớp. Nếu **Thiết bị** hiển thị một yêu cầu đang chờ (ví dụ, cho một client không chính thức hoặc siêu dữ liệu không khớp), hãy xem xét vai trò và phạm vi của nó trước khi phê duyệt.

Nút này bị vô hiệu hóa khi phiên Giao diện điều khiển hiện tại không có quyền truy cập quản trị viên. Trong trường hợp đó, hãy dùng luồng phê duyệt CLI bên dưới từ máy chủ Gateway.

### Ghép nối qua Telegram

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép nối thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng biệt (dễ sao chép/dán trong Telegram).
3. Trên điện thoại của bạn, mở ứng dụng OpenClaw iOS → Cài đặt → Gateway.
4. Quét mã QR hoặc dán mã thiết lập và kết nối.
5. Ứng dụng di động chính thức kết nối tự động. Nếu `/pair pending` hiển thị một
   yêu cầu, hãy xem xét vai trò và phạm vi của nó trước khi phê duyệt.

Mã thiết lập là một payload JSON được mã hóa base64 chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token bootstrap ngắn hạn cho một thiết bị, dùng cho bắt tay ghép nối ban đầu

Token bootstrap đó mang hồ sơ bootstrap ghép nối tích hợp:

- hồ sơ thiết lập tích hợp chỉ cho phép đường cơ sở QR/mã thiết lập mới:
  `node` cộng với một chuyển giao `operator` có giới hạn
- token `node` được chuyển giao vẫn là `scopes: []`
- token `operator` được chuyển giao bị giới hạn ở `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, và `operator.write`
- `operator.admin` không được cấp bởi bootstrap QR/mã thiết lập; nó yêu cầu một
  luồng ghép nối hoặc token operator được phê duyệt riêng
- việc xoay vòng/thu hồi token sau đó vẫn bị giới hạn bởi cả hợp đồng vai trò đã
  phê duyệt của thiết bị và các phạm vi operator của phiên gọi

Hãy xem mã thiết lập như mật khẩu khi nó còn hiệu lực.

Đối với Tailscale, công khai, hoặc ghép nối di động từ xa khác, hãy dùng Tailscale Serve/Funnel
hoặc một URL Gateway `wss://` khác. Mã thiết lập `ws://` dạng văn bản thuần chỉ được chấp nhận
cho local loopback, địa chỉ LAN riêng, máy chủ Bonjour `.local`, và máy chủ trình giả lập Android.
Địa chỉ CGNAT tailnet, tên `.ts.net`, và máy chủ công khai vẫn bị đóng trước khi phát hành QR/mã thiết lập.

### Phê duyệt thiết bị node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi một phê duyệt rõ ràng bị từ chối vì phiên thiết bị đã ghép nối dùng để phê duyệt
được mở với phạm vi chỉ-ghép-nối, CLI thử lại cùng yêu cầu với `operator.admin`.
Điều này cho phép một thiết bị đã ghép nối có khả năng quản trị hiện có khôi phục một
ghép nối Giao diện điều khiển/trình duyệt mới mà không cần chỉnh sửa `devices/paired.json` thủ công.
Gateway vẫn xác thực kết nối được thử lại; các token không thể xác thực với
`operator.admin` vẫn bị chặn.

Nếu cùng thiết bị thử lại với chi tiết xác thực khác (ví dụ vai trò/phạm vi/khóa công khai khác), yêu cầu đang chờ trước đó bị thay thế và một `requestId` mới được tạo.

<Note>
Một thiết bị đã ghép nối không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu nhiều phạm vi hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Dùng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tùy chọn tự động phê duyệt node theo CIDR đáng tin cậy

Ghép nối thiết bị vẫn là thủ công theo mặc định. Với các mạng node được kiểm soát chặt chẽ,
bạn có thể chọn tự động phê duyệt node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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
phạm vi được yêu cầu. Client operator, trình duyệt, Giao diện điều khiển, và WebChat vẫn cần
phê duyệt thủ công. Thay đổi vai trò, phạm vi, siêu dữ liệu, và khóa công khai vẫn cần
phê duyệt thủ công.

### Lưu trữ trạng thái ghép nối node

Được lưu trong `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép nối + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một
  kho ghép nối riêng do gateway sở hữu. Các node WS vẫn cần ghép nối thiết bị.
- Bản ghi ghép nối là nguồn sự thật bền vững cho các vai trò đã phê duyệt. Token
  thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã phê duyệt đó; một mục token lạc
  bên ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

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
