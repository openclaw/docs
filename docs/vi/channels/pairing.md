---
read_when:
    - Thiết lập kiểm soát quyền truy cập DM
    - Ghép nối một Node iOS/Android mới
    - Đánh giá hiện trạng bảo mật của OpenClaw
summary: 'Tổng quan về ghép đôi: phê duyệt ai có thể nhắn tin trực tiếp cho bạn + các nút nào có thể tham gia'
title: Ghép nối
x-i18n:
    generated_at: "2026-04-29T22:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

“Ghép nối” là bước phê duyệt quyền truy cập rõ ràng của OpenClaw.
Bước này được dùng ở hai nơi:

1. **Ghép nối DM** (ai được phép nói chuyện với bot)
2. **Ghép nối Node** (thiết bị/nút nào được phép tham gia mạng Gateway)

Ngữ cảnh bảo mật: [Bảo mật](/vi/gateway/security)

## 1) Ghép nối DM (quyền truy cập trò chuyện đến)

Khi một kênh được cấu hình với chính sách DM `pairing`, người gửi không xác định sẽ nhận được một mã ngắn và tin nhắn của họ **không được xử lý** cho đến khi bạn phê duyệt.

Các chính sách DM mặc định được ghi lại tại: [Bảo mật](/vi/gateway/security)

`dmPolicy: "open"` chỉ công khai khi allowlist DM hiệu lực bao gồm `"*"`.
Thiết lập và xác thực yêu cầu ký tự đại diện đó cho cấu hình public-open. Nếu trạng thái hiện có
chứa `open` với các mục `allowFrom` cụ thể, runtime vẫn chỉ cho phép
những người gửi đó, và các phê duyệt trong kho ghép nối không mở rộng quyền truy cập `open`.

Mã ghép nối:

- 8 ký tự, chữ hoa, không có ký tự dễ nhầm lẫn (`0O1I`).
- **Hết hạn sau 1 giờ**. Bot chỉ gửi tin nhắn ghép nối khi một yêu cầu mới được tạo (xấp xỉ một lần mỗi giờ cho mỗi người gửi).
- Các yêu cầu ghép nối DM đang chờ được giới hạn mặc định ở **3 yêu cầu cho mỗi kênh**; các yêu cầu bổ sung bị bỏ qua cho đến khi một yêu cầu hết hạn hoặc được phê duyệt.

### Phê duyệt một người gửi

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Nếu chưa cấu hình chủ sở hữu lệnh, việc phê duyệt mã ghép nối DM cũng khởi tạo
`commands.ownerAllowFrom` thành người gửi đã được phê duyệt, chẳng hạn `telegram:123456789`.
Điều đó cung cấp cho các thiết lập lần đầu một chủ sở hữu rõ ràng cho các lệnh đặc quyền và lời nhắc
phê duyệt thực thi. Sau khi đã có chủ sở hữu, các phê duyệt ghép nối sau này chỉ cấp quyền truy cập
DM; chúng không thêm chủ sở hữu mới.

Các kênh được hỗ trợ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Trạng thái được lưu ở đâu

Được lưu dưới `~/.openclaw/credentials/`:

- Yêu cầu đang chờ: `<channel>-pairing.json`
- Kho allowlist đã phê duyệt:
  - Tài khoản mặc định: `<channel>-allowFrom.json`
  - Tài khoản không mặc định: `<channel>-<accountId>-allowFrom.json`

Hành vi phạm vi tài khoản:

- Tài khoản không mặc định chỉ đọc/ghi tệp allowlist có phạm vi riêng của chúng.
- Tài khoản mặc định dùng tệp allowlist không có phạm vi riêng theo kênh.

Hãy xem các tệp này là nhạy cảm (chúng kiểm soát quyền truy cập vào trợ lý của bạn).

<Note>
Kho allowlist ghép nối dành cho quyền truy cập DM. Ủy quyền nhóm là riêng biệt.
Việc phê duyệt mã ghép nối DM không tự động cho phép người gửi đó chạy các lệnh nhóm
hoặc điều khiển bot trong nhóm. Khởi tạo chủ sở hữu đầu tiên là trạng thái cấu hình riêng
trong `commands.ownerAllowFrom`, và việc gửi tin nhắn trong nhóm vẫn tuân theo
allowlist nhóm của kênh (ví dụ `groupAllowFrom`, `groups`, hoặc các ghi đè theo nhóm
hoặc theo chủ đề tùy kênh).
</Note>

## 2) Ghép nối thiết bị Node (nút iOS/Android/macOS/headless)

Các Node kết nối tới Gateway dưới dạng **thiết bị** với `role: node`. Gateway
tạo một yêu cầu ghép nối thiết bị cần được phê duyệt.

### Ghép nối qua Telegram (khuyến nghị cho iOS)

Nếu bạn dùng Plugin `device-pair`, bạn có thể thực hiện ghép nối thiết bị lần đầu hoàn toàn từ Telegram:

1. Trong Telegram, nhắn cho bot của bạn: `/pair`
2. Bot trả lời bằng hai tin nhắn: một tin nhắn hướng dẫn và một tin nhắn **mã thiết lập** riêng biệt (dễ sao chép/dán trong Telegram).
3. Trên điện thoại, mở ứng dụng OpenClaw iOS → Settings → Gateway.
4. Dán mã thiết lập và kết nối.
5. Quay lại Telegram: `/pair pending` (xem lại ID yêu cầu, vai trò và phạm vi), rồi phê duyệt.

Mã thiết lập là payload JSON được mã hóa base64 chứa:

- `url`: URL WebSocket của Gateway (`ws://...` hoặc `wss://...`)
- `bootstrapToken`: token bootstrap ngắn hạn cho một thiết bị, dùng cho handshake ghép nối ban đầu

Token bootstrap đó mang hồ sơ bootstrap ghép nối tích hợp sẵn:

- token `node` được bàn giao chính vẫn là `scopes: []`
- mọi token `operator` được bàn giao vẫn bị giới hạn trong allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kiểm tra phạm vi bootstrap có tiền tố theo vai trò, không phải một nhóm phạm vi phẳng:
  các mục phạm vi operator chỉ đáp ứng yêu cầu operator, và các vai trò không phải operator
  vẫn phải yêu cầu phạm vi dưới tiền tố vai trò riêng của chúng
- việc xoay vòng/thu hồi token sau này vẫn bị giới hạn bởi cả hợp đồng vai trò đã được phê duyệt
  của thiết bị và các phạm vi operator của phiên gọi

Hãy xem mã thiết lập như mật khẩu khi nó còn hiệu lực.

### Phê duyệt một thiết bị Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Nếu cùng một thiết bị thử lại với chi tiết xác thực khác (ví dụ vai trò/phạm vi/khóa công khai
khác), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới
được tạo.

<Note>
Một thiết bị đã ghép nối sẽ không âm thầm nhận quyền truy cập rộng hơn. Nếu nó kết nối lại và yêu cầu nhiều phạm vi hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Dùng `openclaw devices list` để so sánh quyền truy cập hiện được phê duyệt với quyền truy cập mới được yêu cầu trước khi bạn phê duyệt.
</Note>

### Tùy chọn tự động phê duyệt Node theo CIDR đáng tin cậy

Ghép nối thiết bị mặc định vẫn là thủ công. Đối với các mạng Node được kiểm soát chặt chẽ,
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
phạm vi được yêu cầu. Operator, trình duyệt, Control UI và máy khách WebChat vẫn cần
phê duyệt thủ công. Các thay đổi vai trò, phạm vi, metadata và khóa công khai vẫn cần
phê duyệt thủ công.

### Lưu trữ trạng thái ghép nối Node

Được lưu dưới `~/.openclaw/devices/`:

- `pending.json` (ngắn hạn; yêu cầu đang chờ sẽ hết hạn)
- `paired.json` (thiết bị đã ghép nối + token)

### Ghi chú

- API `node.pair.*` cũ (CLI: `openclaw nodes pending|approve|reject|remove|rename`) là một
  kho ghép nối riêng do gateway sở hữu. Các Node WS vẫn cần ghép nối thiết bị.
- Bản ghi ghép nối là nguồn sự thật bền vững cho các vai trò đã được phê duyệt. Các
  token thiết bị đang hoạt động vẫn bị giới hạn trong tập vai trò đã được phê duyệt đó; một mục token lạc
  ngoài các vai trò đã phê duyệt không tạo quyền truy cập mới.

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
