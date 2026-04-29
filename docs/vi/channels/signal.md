---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal qua signal-cli (JSON-RPC + SSE), các đường dẫn thiết lập và mô hình số điện thoại
title: Signal
x-i18n:
    generated_at: "2026-04-29T22:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Trạng thái: tích hợp CLI bên ngoài. Gateway giao tiếp với `signal-cli` qua HTTP JSON-RPC + SSE.

## Điều kiện tiên quyết

- OpenClaw đã được cài đặt trên máy chủ của bạn (quy trình Linux bên dưới đã được kiểm thử trên Ubuntu 24).
- `signal-cli` có sẵn trên máy chủ nơi Gateway chạy.
- Một số điện thoại có thể nhận một SMS xác minh (cho quy trình đăng ký bằng SMS).
- Quyền truy cập trình duyệt cho captcha Signal (`signalcaptchas.org`) trong quá trình đăng ký.

## Thiết lập nhanh (người mới bắt đầu)

1. Dùng một **số Signal riêng** cho bot (khuyến nghị).
2. Cài đặt `signal-cli` (cần Java nếu bạn dùng bản dựng JVM).
3. Chọn một cách thiết lập:
   - **Cách A (liên kết QR):** `signal-cli link -n "OpenClaw"` và quét bằng Signal.
   - **Cách B (đăng ký SMS):** đăng ký một số chuyên dụng bằng captcha + xác minh SMS.
4. Cấu hình OpenClaw và khởi động lại Gateway.
5. Gửi tin nhắn trực tiếp đầu tiên và phê duyệt ghép đôi (`openclaw pairing approve signal <CODE>`).

Cấu hình tối thiểu:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Tham chiếu trường:

| Trường      | Mô tả                                             |
| ----------- | ------------------------------------------------- |
| `account`   | Số điện thoại bot ở định dạng E.164 (`+15551234567`) |
| `cliPath`   | Đường dẫn tới `signal-cli` (`signal-cli` nếu nằm trong `PATH`) |
| `dmPolicy`  | Chính sách truy cập tin nhắn trực tiếp (khuyến nghị `pairing`) |
| `allowFrom` | Số điện thoại hoặc giá trị `uuid:<id>` được phép gửi tin nhắn trực tiếp |

## Đây là gì

- Kênh Signal qua `signal-cli` (không nhúng libsignal).
- Định tuyến xác định: phản hồi luôn quay lại Signal.
- Tin nhắn trực tiếp dùng chung phiên chính của tác tử; nhóm được cô lập (`agent:<agentId>:signal:group:<groupId>`).

## Ghi cấu hình

Theo mặc định, Signal được phép ghi các cập nhật cấu hình được kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`).

Tắt bằng:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Mô hình số điện thoại (quan trọng)

- Gateway kết nối tới một **thiết bị Signal** (tài khoản `signal-cli`).
- Nếu bạn chạy bot trên **tài khoản Signal cá nhân của mình**, nó sẽ bỏ qua tin nhắn của chính bạn (bảo vệ vòng lặp).
- Để "tôi nhắn cho bot và nó trả lời", hãy dùng một **số bot riêng**.

## Cách thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc native).
2. Liên kết một tài khoản bot:
   - `signal-cli link -n "OpenClaw"` rồi quét mã QR trong Signal.
3. Cấu hình Signal và khởi động Gateway.

Ví dụ:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Hỗ trợ nhiều tài khoản: dùng `channels.signal.accounts` với cấu hình theo từng tài khoản và `name` tùy chọn. Xem [`gateway/configuration`](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu dùng chung.

## Cách thiết lập B: đăng ký số bot chuyên dụng (SMS, Linux)

Dùng cách này khi bạn muốn một số bot chuyên dụng thay vì liên kết tài khoản ứng dụng Signal hiện có.

1. Lấy một số có thể nhận SMS (hoặc xác minh bằng giọng nói cho điện thoại cố định).
   - Dùng số bot chuyên dụng để tránh xung đột tài khoản/phiên.
2. Cài đặt `signal-cli` trên máy chủ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu bạn dùng bản dựng JVM (`signal-cli-${VERSION}.tar.gz`), hãy cài JRE 25+ trước.
Luôn cập nhật `signal-cli`; thượng nguồn lưu ý rằng các bản phát hành cũ có thể hỏng khi API máy chủ Signal thay đổi.

3. Đăng ký và xác minh số:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu cần captcha:

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn tất captcha, sao chép đích liên kết `signalcaptcha://...` từ "Open Signal".
3. Chạy từ cùng IP bên ngoài với phiên trình duyệt khi có thể.
4. Chạy lại đăng ký ngay lập tức (mã captcha hết hạn nhanh):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Cấu hình OpenClaw, khởi động lại Gateway, xác minh kênh:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Ghép đôi người gửi tin nhắn trực tiếp của bạn:
   - Gửi bất kỳ tin nhắn nào tới số bot.
   - Phê duyệt mã trên máy chủ: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số bot làm liên hệ trên điện thoại của bạn để tránh "Liên hệ không xác định".

<Warning>
Việc đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính cho số đó. Nên dùng số bot chuyên dụng, hoặc dùng chế độ liên kết QR nếu bạn cần giữ thiết lập ứng dụng điện thoại hiện có.
</Warning>

Tham chiếu thượng nguồn:

- README của `signal-cli`: `https://github.com/AsamK/signal-cli`
- Quy trình captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Quy trình liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Nếu bạn muốn tự quản lý `signal-cli` (khởi động nguội JVM chậm, khởi tạo container, hoặc CPU dùng chung), hãy chạy daemon riêng và trỏ OpenClaw tới đó:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Cách này bỏ qua tự sinh tiến trình và thời gian chờ khởi động bên trong OpenClaw. Với các lần khởi động chậm khi tự sinh tiến trình, đặt `channels.signal.startupTimeoutMs`.

## Kiểm soát truy cập (tin nhắn trực tiếp + nhóm)

Tin nhắn trực tiếp:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận được mã ghép đôi; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Ghép đôi là trao đổi mã thông báo mặc định cho tin nhắn trực tiếp Signal. Chi tiết: [Ghép đôi](/vi/channels/pairing)
- Người gửi chỉ có UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi đặt `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools`, và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` cho ghi đè theo tài khoản trong thiết lập nhiều tài khoản.
- Ghi chú runtime: nếu `channels.signal` hoàn toàn bị thiếu, runtime sẽ dự phòng về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

## Cách hoạt động (hành vi)

- `signal-cli` chạy dưới dạng daemon; Gateway đọc sự kiện qua SSE.
- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung.
- Phản hồi luôn định tuyến về cùng số hoặc nhóm.

## Phương tiện + giới hạn

- Văn bản gửi đi được chia thành đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Chia đoạn theo dòng mới tùy chọn: đặt `channels.signal.chunkMode="newline"` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Hỗ trợ tệp đính kèm (base64 được lấy từ `signal-cli`).
- Tệp đính kèm ghi chú thoại dùng tên tệp `signal-cli` làm dự phòng MIME khi thiếu `contentType`, nên phiên âm âm thanh vẫn có thể phân loại bản ghi nhớ giọng nói AAC.
- Giới hạn phương tiện mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua tải xuống phương tiện.
- Ngữ cảnh lịch sử nhóm dùng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), dự phòng về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Đang nhập + biên nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi phản hồi đang chạy.
- **Biên nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp biên nhận đã đọc cho các tin nhắn trực tiếp được phép.
- Signal-cli không cung cấp biên nhận đã đọc cho nhóm.

## Phản ứng (công cụ tin nhắn)

- Dùng `message action=react` với `channel=signal`.
- Đích: E.164 hoặc UUID của người gửi (dùng `uuid:<id>` từ đầu ra ghép đôi; UUID trần cũng hoạt động).
- `messageId` là dấu thời gian Signal cho tin nhắn bạn đang phản ứng.
- Phản ứng trong nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

Ví dụ:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt hành động phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` tắt phản ứng của tác tử (công cụ tin nhắn `react` sẽ báo lỗi).
  - `minimal`/`extensive` bật phản ứng của tác tử và đặt mức hướng dẫn.
- Ghi đè theo tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Đích gửi (CLI/cron)

- Tin nhắn trực tiếp: `signal:+15551234567` (hoặc E.164 thuần).
- Tin nhắn trực tiếp UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu tài khoản Signal của bạn hỗ trợ).

## Khắc phục sự cố

Chạy chuỗi bước này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó xác nhận trạng thái ghép đôi tin nhắn trực tiếp nếu cần:

```bash
openclaw pairing list signal
```

Lỗi thường gặp:

- Daemon truy cập được nhưng không có phản hồi: xác minh thiết lập tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- Tin nhắn trực tiếp bị bỏ qua: người gửi đang chờ phê duyệt ghép đôi.
- Tin nhắn nhóm bị bỏ qua: cổng chặn theo người gửi/nhắc đến của nhóm đang chặn gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal bị thiếu trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Quy trình phân loại sự cố: [/channels/troubleshooting](/vi/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc dựng lại máy chủ.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn rõ ràng muốn quyền truy cập tin nhắn trực tiếp rộng hơn.
- Chỉ cần xác minh SMS cho quy trình đăng ký hoặc khôi phục, nhưng mất quyền kiểm soát số/tài khoản có thể làm phức tạp việc đăng ký lại.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.httpUrl`: URL daemon đầy đủ (ghi đè host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind daemon (mặc định 127.0.0.1:8080).
- `channels.signal.autoStart`: tự động spawn daemon (mặc định true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (giới hạn 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua tải xuống tệp đính kèm.
- `channels.signal.ignoreStories`: bỏ qua story từ daemon.
- `channels.signal.sendReadReceipts`: chuyển tiếp biên nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép DM (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; hãy dùng số điện thoại/mã định danh UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép người gửi trong nhóm.
- `channels.signal.groups`: ghi đè theo từng nhóm, được khóa theo id nhóm Signal (hoặc `"*"`). Các trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` cho thiết lập nhiều tài khoản.
- `channels.signal.historyLimit`: số tin nhắn nhóm tối đa để đưa vào làm ngữ cảnh (0 để tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử DM theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi (ký tự).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện gửi đến/gửi đi (MB).

Tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ mention gốc).
- `messages.groupChat.mentionPatterns` (phương án dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát mention
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
