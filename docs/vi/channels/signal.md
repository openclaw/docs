---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal thông qua signal-cli (JSON-RPC + SSE), các đường dẫn thiết lập và mô hình số điện thoại
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Trạng thái: tích hợp CLI bên ngoài. Gateway giao tiếp với `signal-cli` qua HTTP JSON-RPC + SSE.

## Điều kiện tiên quyết

- OpenClaw đã được cài đặt trên máy chủ của bạn (quy trình Linux bên dưới đã được kiểm thử trên Ubuntu 24).
- `signal-cli` có sẵn trên máy chủ nơi Gateway chạy.
- Một số điện thoại có thể nhận một SMS xác minh (cho đường dẫn đăng ký bằng SMS).
- Quyền truy cập trình duyệt cho captcha Signal (`signalcaptchas.org`) trong quá trình đăng ký.

## Thiết lập nhanh (người mới bắt đầu)

1. Dùng một **số Signal riêng** cho bot (khuyến nghị).
2. Cài đặt `signal-cli` (cần Java nếu bạn dùng bản dựng JVM).
3. Chọn một đường dẫn thiết lập:
   - **Đường dẫn A (liên kết QR):** `signal-cli link -n "OpenClaw"` và quét bằng Signal.
   - **Đường dẫn B (đăng ký SMS):** đăng ký một số chuyên dụng bằng captcha + xác minh SMS.
4. Cấu hình OpenClaw và khởi động lại Gateway.
5. Gửi DM đầu tiên và phê duyệt ghép nối (`openclaw pairing approve signal <CODE>`).

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

| Trường      | Mô tả                                                   |
| ----------- | ------------------------------------------------------- |
| `account`   | Số điện thoại bot ở định dạng E.164 (`+15551234567`)    |
| `cliPath`   | Đường dẫn đến `signal-cli` (`signal-cli` nếu ở `PATH`)  |
| `dmPolicy`  | Chính sách truy cập DM (khuyến nghị `pairing`)          |
| `allowFrom` | Số điện thoại hoặc giá trị `uuid:<id>` được phép gửi DM |

## Đây là gì

- Kênh Signal qua `signal-cli` (không nhúng libsignal).
- Định tuyến xác định: phản hồi luôn quay lại Signal.
- DM dùng chung phiên chính của agent; nhóm được cô lập (`agent:<agentId>:signal:group:<groupId>`).

## Ghi cấu hình

Theo mặc định, Signal được phép ghi các cập nhật cấu hình được kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`).

Tắt bằng:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Mô hình số điện thoại (quan trọng)

- Gateway kết nối đến một **thiết bị Signal** (tài khoản `signal-cli`).
- Nếu bạn chạy bot trên **tài khoản Signal cá nhân của mình**, nó sẽ bỏ qua tin nhắn của chính bạn (bảo vệ vòng lặp).
- Để "tôi nhắn tin cho bot và nó trả lời," hãy dùng một **số bot riêng**.

## Đường dẫn thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc native).
2. Liên kết một tài khoản bot:
   - `signal-cli link -n "OpenClaw"` rồi quét QR trong Signal.
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

## Đường dẫn thiết lập B: đăng ký số bot chuyên dụng (SMS, Linux)

Dùng cách này khi bạn muốn một số bot chuyên dụng thay vì liên kết tài khoản ứng dụng Signal hiện có.

1. Lấy một số có thể nhận SMS (hoặc xác minh giọng nói cho số cố định).
   - Dùng số bot chuyên dụng để tránh xung đột tài khoản/phiên.
2. Cài đặt `signal-cli` trên máy chủ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu bạn dùng bản dựng JVM (`signal-cli-${VERSION}.tar.gz`), hãy cài đặt JRE 25+ trước.
Luôn cập nhật `signal-cli`; upstream lưu ý rằng các bản phát hành cũ có thể bị lỗi khi API máy chủ Signal thay đổi.

3. Đăng ký và xác minh số:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu cần captcha:

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn tất captcha, sao chép mục tiêu liên kết `signalcaptcha://...` từ "Open Signal".
3. Chạy từ cùng IP bên ngoài với phiên trình duyệt khi có thể.
4. Chạy lại đăng ký ngay lập tức (token captcha hết hạn nhanh):

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

5. Ghép nối người gửi DM của bạn:
   - Gửi bất kỳ tin nhắn nào đến số bot.
   - Phê duyệt mã trên máy chủ: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số bot thành liên hệ trên điện thoại để tránh "Unknown contact".

<Warning>
Đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính cho số đó. Ưu tiên dùng số bot chuyên dụng, hoặc dùng chế độ liên kết QR nếu bạn cần giữ thiết lập ứng dụng điện thoại hiện có.
</Warning>

Tham chiếu upstream:

- README của `signal-cli`: `https://github.com/AsamK/signal-cli`
- Quy trình captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Quy trình liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Nếu bạn muốn tự quản lý `signal-cli` (khởi động nguội JVM chậm, khởi tạo container, hoặc CPU dùng chung), hãy chạy daemon riêng và trỏ OpenClaw đến đó:

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

Cách này bỏ qua tự động spawn và thời gian chờ khởi động bên trong OpenClaw. Với các lần khởi động chậm khi tự động spawn, hãy đặt `channels.signal.startupTimeoutMs`.

## Kiểm soát truy cập (DM + nhóm)

DM:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận một mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Ghép nối là trao đổi token mặc định cho DM Signal. Chi tiết: [Ghép nối](/vi/channels/pairing)
- Người gửi chỉ có UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát nhóm hoặc người gửi nào có thể kích hoạt phản hồi nhóm khi đặt `allowlist`; mục nhập có thể là ID nhóm Signal (raw, `group:<id>`, hoặc `signal:group:<id>`), số điện thoại người gửi, giá trị `uuid:<id>`, hoặc `*`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools`, và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` cho ghi đè theo từng tài khoản trong thiết lập nhiều tài khoản.
- Cho phép một nhóm Signal qua `groupAllowFrom` tự nó không tắt cổng theo lượt nhắc. Một mục `channels.signal.groups["<group-id>"]` được cấu hình cụ thể sẽ xử lý mọi tin nhắn nhóm trừ khi đặt `requireMention=true`.
- Ghi chú runtime: nếu `channels.signal` hoàn toàn không có, runtime sẽ quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

## Cách hoạt động (hành vi)

- `signal-cli` chạy dưới dạng daemon; Gateway đọc sự kiện qua SSE.
- Tin nhắn đến được chuẩn hóa thành envelope kênh dùng chung.
- Phản hồi luôn định tuyến về cùng số hoặc nhóm.

## Phương tiện + giới hạn

- Văn bản gửi đi được chia đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Chia đoạn theo dòng mới tùy chọn: đặt `channels.signal.chunkMode="newline"` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Hỗ trợ tệp đính kèm (base64 được lấy từ `signal-cli`).
- Tệp đính kèm ghi chú thoại dùng tên tệp `signal-cli` làm MIME dự phòng khi thiếu `contentType`, để phiên âm âm thanh vẫn có thể phân loại ghi nhớ thoại AAC.
- Giới hạn phương tiện mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua tải phương tiện xuống.
- Ngữ cảnh lịch sử nhóm dùng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), quay về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Đang nhập + biên nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi phản hồi đang chạy.
- **Biên nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp biên nhận đã đọc cho DM được phép.
- Signal-cli không cung cấp biên nhận đã đọc cho nhóm.

## Phản ứng (công cụ tin nhắn)

- Dùng `message action=react` với `channel=signal`.
- Mục tiêu: E.164 của người gửi hoặc UUID (dùng `uuid:<id>` từ đầu ra ghép nối; UUID trần cũng hoạt động).
- `messageId` là dấu thời gian Signal của tin nhắn bạn đang phản ứng.
- Phản ứng nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

Ví dụ:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt hành động phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` tắt phản ứng của agent (công cụ tin nhắn `react` sẽ báo lỗi).
  - `minimal`/`extensive` bật phản ứng của agent và đặt mức hướng dẫn.
- Ghi đè theo từng tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Mục tiêu gửi (CLI/cron)

- DM: `signal:+15551234567` (hoặc E.164 thuần).
- DM UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu được tài khoản Signal của bạn hỗ trợ).

## Khắc phục sự cố

Chạy thang kiểm tra này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó xác nhận trạng thái ghép nối DM nếu cần:

```bash
openclaw pairing list signal
```

Lỗi thường gặp:

- Daemon truy cập được nhưng không có phản hồi: xác minh cài đặt tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- DM bị bỏ qua: người gửi đang chờ phê duyệt ghép nối.
- Tin nhắn nhóm bị bỏ qua: cổng người gửi/lượt nhắc của nhóm chặn gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal bị thiếu trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Để biết quy trình phân loại: [/channels/troubleshooting](/vi/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc dựng lại máy chủ.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn rõ ràng muốn truy cập DM rộng hơn.
- Xác minh SMS chỉ cần cho quy trình đăng ký hoặc khôi phục, nhưng mất quyền kiểm soát số/tài khoản có thể làm phức tạp việc đăng ký lại.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.httpUrl`: URL đầy đủ của tiến trình nền (ghi đè host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: địa chỉ bind của tiến trình nền (mặc định 127.0.0.1:8080).
- `channels.signal.autoStart`: tự động khởi chạy tiến trình nền (mặc định là true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (giới hạn 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua tải xuống tệp đính kèm.
- `channels.signal.ignoreStories`: bỏ qua tin từ tiến trình nền.
- `channels.signal.sendReadReceipts`: chuyển tiếp biên nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép DM (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; dùng số điện thoại/ID UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép nhóm; chấp nhận ID nhóm Signal (thô, `group:<id>`, hoặc `signal:group:<id>`), số E.164 của người gửi, hoặc giá trị `uuid:<id>`.
- `channels.signal.groups`: ghi đè theo từng nhóm, được khóa theo ID nhóm Signal (hoặc `"*"`). Các trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` cho thiết lập nhiều tài khoản.
- `channels.signal.historyLimit`: số tin nhắn nhóm tối đa cần đưa vào làm ngữ cảnh (0 để tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử DM tính theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi (ký tự).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện gửi đến/gửi đi (MB).

Tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ đề cập gốc).
- `messages.groupChat.mentionPatterns` (dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
