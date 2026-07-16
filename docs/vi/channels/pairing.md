---
read_when:
    - Thiết lập kiểm soát truy cập tin nhắn trực tiếp
    - Ghép nối một Node iOS/Android mới
    - Đánh giá tình trạng bảo mật của OpenClaw
summary: 'Tổng quan về ghép nối: phê duyệt người có thể nhắn tin riêng cho bạn + các Node có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-07-16T14:06:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"Ghép nối" là bước phê duyệt quyền truy cập rõ ràng của OpenClaw.
Bước này được sử dụng ở hai nơi:

1. **Ghép nối DM** (ai được phép trò chuyện với bot)
2. **Ghép nối Node** (thiết bị/Node nào được phép tham gia mạng Gateway)

Bối cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép nối DM (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ ở chế độ công khai khi danh sách cho phép DM có hiệu lực bao gồm `"*"`.
Quá trình thiết lập và xác thực yêu cầu ký tự đại diện đó đối với các cấu hình mở công khai. Nếu trạng thái hiện có
chứa `open` với các mục `allowFrom` cụ thể, môi trường chạy vẫn chỉ cho phép
những người gửi đó và các phê duyệt trong kho ghép nối không mở rộng quyền truy cập `open`.

Mã ghép nối:

- 8 ký tự, viết hoa, không có ký tự dễ gây nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép nối khi một yêu cầu mới được tạo (xấp xỉ một lần mỗi giờ cho mỗi người gửi).
- Yêu cầu ghép nối DM đang chờ được giới hạn ở **3 yêu cầu cho mỗi tài khoản kênh**; các yêu cầu bổ sung sẽ bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Thêm `--notify` vào lệnh phê duyệt để thông báo cho người yêu cầu trên cùng kênh. Các kênh có nhiều tài khoản nhận `--account <id>`.

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép nối DM cũng khởi tạo
`commands.ownerAllowFrom` với người gửi được phê duyệt, chẳng hạn như `telegram:123456789`.
Điều này cung cấp cho các thiết lập lần đầu một chủ sở hữu rõ ràng đối với các lệnh đặc quyền và lời nhắc
phê duyệt thực thi. Sau khi đã có chủ sở hữu, các phê duyệt ghép nối sau đó chỉ cấp quyền truy cập
DM; chúng không thêm chủ sở hữu khác.

Các kênh được hỗ trợ (mọi Plugin kênh đã cài đặt có khai báo ghép nối; các Plugin bên ngoài như `openclaw-weixin` có thể bổ sung thêm): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Nhóm người gửi có thể tái sử dụng

Sử dụng `accessGroups` ở cấp cao nhất khi cùng một tập hợp người gửi đáng tin cậy cần áp dụng cho
nhiều kênh nhắn tin hoặc cho cả danh sách cho phép DM và nhóm.

Các nhóm tĩnh sử dụng `type: "message.senders"` và được tham chiếu bằng
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

Các nhóm truy cập được ghi lại chi tiết tại đây: [Nhóm truy cập](/vi/channels/access-groups)

### Nơi lưu trữ trạng thái

Được lưu trong cơ sở dữ liệu trạng thái SQLite dùng chung tại
`~/.openclaw/state/openclaw.sqlite`:

- các yêu cầu đang chờ trong `channel_pairing_requests`
- người gửi đã được phê duyệt trong `channel_pairing_allow_entries`

Hành vi phân phạm vi theo tài khoản:

- mỗi yêu cầu và người gửi được phê duyệt được định danh theo kênh và tài khoản
- môi trường chạy chỉ đọc các hàng SQLite chuẩn; không hợp nhất các tệp cũ

Các Gateway cũ đã ghi `<channel>-pairing.json` và
`<channel>-<accountId>-allowFrom.json` trong `~/.openclaw/credentials/`.
Quá trình di chuyển lúc khởi động và `openclaw doctor --fix` nhập các tệp đó vào SQLite và
xóa từng nguồn sau khi nhập thành công. Hãy xem cơ sở dữ liệu SQLite là dữ liệu
nhạy cảm vì các hàng này kiểm soát quyền truy cập vào trợ lý của bạn.

<Note>
Kho danh sách cho phép ghép nối dành cho quyền truy cập DM. Việc cấp quyền cho nhóm là riêng biệt.
Phê duyệt mã ghép nối DM không tự động cho phép người gửi đó chạy các lệnh nhóm
hoặc điều khiển bot trong nhóm. Việc khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng
trong `commands.ownerAllowFrom`, và việc gửi nội dung trò chuyện nhóm vẫn tuân theo
danh sách cho phép nhóm của kênh (ví dụ: `groupAllowFrom`, `groups`, hoặc các ghi đè theo nhóm
hay theo chủ đề, tùy thuộc vào kênh).
</Note>

## 2) Ghép nối thiết bị Node (Node iOS/Android/macOS/headless)

Các Node kết nối với Gateway dưới dạng **thiết bị** bằng `role: node`. Gateway
tạo một yêu cầu ghép nối thiết bị cần được phê duyệt.

### Ghép nối từ giao diện điều khiển (khuyến nghị)

Sử dụng một phiên giao diện điều khiển đã kết nối và có quyền truy cập `operator.admin`:

1. Mở giao diện điều khiển và đi tới **Settings → Devices**.
2. Trên trang **Devices**, nhấp vào **Pair mobile device**.
3. Giữ nguyên **Full access (recommended)** hoặc chọn **Limited access** để loại trừ
   các quyền điều khiển quản trị Gateway.
4. Nhấp vào **Create setup code**.
5. Trên điện thoại, mở ứng dụng OpenClaw → **Settings** → **Gateway**.
6. Quét mã QR hoặc dán mã thiết lập, sau đó kết nối.

Các ứng dụng OpenClaw chính thức dành cho iOS và Android được phê duyệt tự động khi siêu dữ liệu
mã thiết lập của chúng khớp. Nếu **Pending approval** hiển thị một yêu cầu (ví dụ:
đối với một máy khách không chính thức hoặc siêu dữ liệu không khớp), hãy xem xét vai trò và
phạm vi của yêu cầu trước khi phê duyệt.

Nút này bị vô hiệu hóa khi phiên giao diện điều khiển hiện tại không có
quyền truy cập quản trị viên. Trong trường hợp đó, hãy sử dụng quy trình phê duyệt bằng CLI bên dưới từ máy chủ Gateway.

### Ghép nối qua Telegram

Nếu sử dụng Plugin `device-pair`, bạn có thể thực hiện toàn bộ quá trình ghép nối thiết bị lần đầu từ Telegram:

1. Trong Telegram, nhắn tin cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng biệt (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw dành cho iOS → Settings → Gateway.
4. Quét mã QR (`/pair qr`) hoặc dán mã thiết lập rồi kết nối.
5. Ứng dụng di động chính thức sẽ tự động kết nối. Nếu `/pair pending` hiển thị một
   yêu cầu, hãy xem xét vai trò và phạm vi của yêu cầu trước khi phê duyệt.

Mã thiết lập là một tải trọng JSON được mã hóa base64, chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `urls`: khi có, các tuyến LAN/Tailnet theo thứ tự mà ứng dụng di động có thể thử
- `bootstrapToken`: token khởi tạo chỉ dùng một lần cho quá trình bắt tay ghép nối ban đầu; Gateway làm token này hết hạn sau 10 phút

Chạy `/pair cleanup` để vô hiệu hóa các mã thiết lập chưa dùng sau khi quá trình ghép nối hoàn tất.

Token khởi tạo đó mang hồ sơ khởi tạo ghép nối tích hợp sẵn:

- một thiết lập `wss://` bảo mật (hoặc loopback trên cùng máy chủ) mặc định dùng `node` cùng quyền truy cập `operator`
  native-mobile đầy đủ
- token `node` được chuyển giao vẫn là `scopes: []`
- token `operator` được chuyển giao mặc định bao gồm `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` và
  `operator.write`
- **Limited access** của giao diện điều khiển và `openclaw qr --limited` loại trừ
  `operator.admin` trong khi vẫn giữ các phạm vi điều hành viên khác
- thiết lập `ws://` LAN văn bản thuần tự động sử dụng cùng hồ sơ giới hạn;
  cấu hình `wss://` hoặc Tailscale Serve và tạo mã mới để có quyền truy cập đầy đủ
- việc xoay vòng/thu hồi token sau đó vẫn bị giới hạn bởi cả hợp đồng vai trò đã được phê duyệt của thiết bị
  và các phạm vi điều hành viên của phiên gọi

Hãy xem mã thiết lập như mật khẩu trong thời gian mã còn hiệu lực.

Các trang **Settings → Gateway** trên iOS và Android hiển thị quyền truy cập **Full** hoặc **Limited**.
Để nâng cấp một điện thoại có quyền giới hạn, trước tiên hãy cấu hình một tuyến `wss://`
bảo mật hoặc Tailscale Serve, sau đó tạo mã thiết lập mới có quyền truy cập đầy đủ, quét hoặc dán
mã vào trang cài đặt đó và kết nối lại.

Đối với việc ghép nối thiết bị di động qua Tailscale, mạng công khai hoặc từ xa theo cách khác, hãy sử dụng Tailscale Serve/Funnel
hoặc một URL Gateway `wss://` khác. Mã thiết lập `ws://` văn bản thuần chỉ được chấp nhận
cho loopback, địa chỉ LAN riêng, máy chủ Bonjour `.local` và máy chủ
trình giả lập Android. Các tuyến văn bản thuần không phải loopback nhận quyền truy cập giới hạn. Địa chỉ CGNAT
Tailnet, tên `.ts.net` và máy chủ công khai vẫn bị từ chối an toàn trước khi
cấp mã QR/mã thiết lập.

Đối với URL thiết lập `gateway.bind=lan`, OpenClaw phát hiện các gốc HTTPS Tailscale Serve
bền vững làm proxy cho cổng loopback của Gateway đang hoạt động và quảng bá chúng
cùng với tuyến LAN. Lệnh thiết lập chỉ thêm phương án dự phòng này
cho `lan`; `custom` và `tailnet` giữ nguyên các tuyến được quảng bá rõ ràng. Ứng dụng
iOS thăm dò các tuyến được quảng bá theo thứ tự và lưu điểm cuối đầu tiên có thể truy cập.

### Phê duyệt thiết bị Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Khi một phê duyệt rõ ràng bị từ chối vì phiên thiết bị đã ghép nối thực hiện phê duyệt
được mở với phạm vi chỉ dành cho ghép nối, CLI sẽ thử lại cùng yêu cầu bằng
`operator.admin`. Điều này cho phép một thiết bị đã ghép nối có khả năng quản trị khôi phục việc ghép nối
giao diện điều khiển/trình duyệt mới mà không cần chỉnh sửa thủ công kho ghép nối. Gateway
vẫn xác thực kết nối được thử lại; các token không thể xác thực
bằng `operator.admin` vẫn bị chặn.

Nếu cùng một thiết bị thử lại với thông tin xác thực khác (ví dụ: vai trò/phạm vi/khóa công khai khác),
yêu cầu đang chờ trước đó sẽ được thay thế và một `requestId` mới được tạo.

<Note>
Một thiết bị đã ghép nối không tự động nhận quyền truy cập rộng hơn. Nếu thiết bị kết nối lại và yêu cầu thêm phạm vi hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện tại và tạo một yêu cầu nâng cấp mới đang chờ. Sử dụng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tùy chọn tự động phê duyệt Node theo CIDR đáng tin cậy

Theo mặc định, việc ghép nối thiết bị vẫn được thực hiện thủ công. Đối với các mạng Node được kiểm soát chặt chẽ,
bạn có thể chủ động bật tự động phê duyệt Node lần đầu bằng CIDR hoặc địa chỉ IP chính xác:

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
phạm vi được yêu cầu. Máy khách điều hành viên, trình duyệt, giao diện điều khiển và WebChat vẫn yêu cầu
phê duyệt thủ công. Các thay đổi về vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn yêu cầu
phê duyệt thủ công.

### Lưu trữ trạng thái ghép nối Node

Được lưu trong cơ sở dữ liệu trạng thái SQLite dùng chung tại `~/.openclaw/state/openclaw.sqlite`:

- các yêu cầu ghép nối thiết bị đang chờ (tồn tại trong thời gian ngắn; chúng hết hạn sau 5 phút)
- thiết bị đã ghép nối + token

Các Gateway cũ lưu trạng thái này trong `~/.openclaw/devices/*.json`; các tệp đó được
nhập vào SQLite khi Gateway khởi động và được lưu trữ với hậu tố `.migrated`.

### Ghi chú

- API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) quản lý
  các phê duyệt khả năng của Node được lưu trên cùng các bản ghi thiết bị đã ghép nối. Các Node WS
  vẫn yêu cầu ghép nối thiết bị; xem [Ghép nối Node](/vi/gateway/pairing).
- Bản ghi ghép nối là nguồn sự thật lâu dài cho các vai trò đã được phê duyệt. Các
  token thiết bị đang hoạt động vẫn bị giới hạn trong tập hợp vai trò đã được phê duyệt đó; một mục token rời rạc
  nằm ngoài các vai trò đã được phê duyệt không tạo ra quyền truy cập mới.

## Tài liệu liên quan

- Mô hình bảo mật + chèn prompt: [Bảo mật](/vi/gateway/security)
- Cập nhật an toàn (chạy doctor): [Cập nhật](/vi/install/updating)
- Cấu hình kênh:
  - Telegram: [Telegram](/vi/channels/telegram)
  - WhatsApp: [WhatsApp](/vi/channels/whatsapp)
  - Signal: [Signal](/vi/channels/signal)
  - iMessage: [iMessage](/vi/channels/imessage)
  - Discord: [Discord](/vi/channels/discord)
  - Slack: [Slack](/vi/channels/slack)
