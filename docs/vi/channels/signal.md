---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal qua signal-cli (daemon nguyên sinh hoặc container bbernhard), các cách thiết lập và mô hình số điện thoại
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Trạng thái: tích hợp CLI bên ngoài. Gateway giao tiếp với `signal-cli` qua HTTP — hoặc daemon native (JSON-RPC + SSE) hoặc container bbernhard/signal-cli-rest-api (REST + WebSocket).

## Điều kiện tiên quyết

- OpenClaw đã được cài đặt trên máy chủ của bạn (luồng Linux bên dưới đã được kiểm thử trên Ubuntu 24).
- Một trong các lựa chọn:
  - `signal-cli` có sẵn trên máy chủ (chế độ native), **hoặc**
  - container Docker `bbernhard/signal-cli-rest-api` (chế độ container).
- Một số điện thoại có thể nhận một tin nhắn SMS xác minh (cho đường dẫn đăng ký bằng SMS).
- Quyền truy cập trình duyệt cho captcha Signal (`signalcaptchas.org`) trong quá trình đăng ký.

## Thiết lập nhanh (người mới bắt đầu)

1. Dùng một **số Signal riêng** cho bot (khuyến nghị).
2. Cài đặt `signal-cli` (cần Java nếu bạn dùng bản dựng JVM).
3. Chọn một đường dẫn thiết lập:
   - **Đường dẫn A (liên kết QR):** `signal-cli link -n "OpenClaw"` và quét bằng Signal.
   - **Đường dẫn B (đăng ký SMS):** đăng ký một số riêng bằng captcha + xác minh SMS.
4. Cấu hình OpenClaw và khởi động lại gateway.
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

| Trường       | Mô tả                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Số điện thoại bot ở định dạng E.164 (`+15551234567`) |
| `cliPath`   | Đường dẫn tới `signal-cli` (`signal-cli` nếu nằm trong `PATH`)  |
| `dmPolicy`  | Chính sách truy cập DM (khuyến nghị `pairing`)          |
| `allowFrom` | Số điện thoại hoặc giá trị `uuid:<id>` được phép gửi DM |

## Đây là gì

- Kênh Signal thông qua `signal-cli` (không nhúng libsignal).
- Định tuyến xác định: phản hồi luôn quay lại Signal.
- DM dùng chung phiên chính của agent; nhóm được cô lập (`agent:<agentId>:signal:group:<groupId>`).

## Ghi cấu hình

Theo mặc định, Signal được phép ghi các cập nhật cấu hình do `/config set|unset` kích hoạt (yêu cầu `commands.config: true`).

Tắt bằng:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Mô hình số điện thoại (quan trọng)

- Gateway kết nối tới một **thiết bị Signal** (tài khoản `signal-cli`).
- Nếu bạn chạy bot trên **tài khoản Signal cá nhân của mình**, nó sẽ bỏ qua tin nhắn của chính bạn (bảo vệ vòng lặp).
- Để "tôi nhắn tin cho bot và nó trả lời", hãy dùng một **số bot riêng**.

## Đường dẫn thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc native).
2. Liên kết một tài khoản bot:
   - `signal-cli link -n "OpenClaw"` rồi quét QR trong Signal.
3. Cấu hình Signal và khởi động gateway.

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

## Đường dẫn thiết lập B: đăng ký số bot riêng (SMS, Linux)

Dùng cách này khi bạn muốn có một số bot riêng thay vì liên kết một tài khoản ứng dụng Signal hiện có.

1. Lấy một số có thể nhận SMS (hoặc xác minh bằng cuộc gọi cho điện thoại cố định).
   - Dùng một số bot riêng để tránh xung đột tài khoản/phiên.
2. Cài đặt `signal-cli` trên máy chủ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu bạn dùng bản dựng JVM (`signal-cli-${VERSION}.tar.gz`), hãy cài JRE 25+ trước.
Luôn cập nhật `signal-cli`; upstream lưu ý rằng các bản phát hành cũ có thể hỏng khi API máy chủ Signal thay đổi.

3. Đăng ký và xác minh số:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu cần captcha:

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn tất captcha, sao chép đích liên kết `signalcaptcha://...` từ "Open Signal".
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
   - Gửi bất kỳ tin nhắn nào tới số bot.
   - Phê duyệt mã trên máy chủ: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số bot làm liên hệ trên điện thoại để tránh "Unknown contact".

<Warning>
Đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính cho số đó. Nên dùng một số bot riêng, hoặc dùng chế độ liên kết QR nếu bạn cần giữ thiết lập ứng dụng điện thoại hiện có.
</Warning>

Tham chiếu upstream:

- README của `signal-cli`: `https://github.com/AsamK/signal-cli`
- Luồng captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Luồng liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

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

Cách này bỏ qua tự động spawn và thời gian chờ khởi động bên trong OpenClaw. Với các lần khởi động chậm khi tự động spawn, đặt `channels.signal.startupTimeoutMs`.

## Chế độ container (bbernhard/signal-cli-rest-api)

Thay vì chạy `signal-cli` trực tiếp theo native, bạn có thể dùng container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Container này bọc `signal-cli` sau API REST và giao diện WebSocket.

Yêu cầu:

- Container **phải** chạy với `MODE=json-rpc` để nhận tin nhắn theo thời gian thực.
- Đăng ký hoặc liên kết tài khoản Signal của bạn bên trong container trước khi kết nối OpenClaw.

Ví dụ service `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Cấu hình OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Trường `apiMode` kiểm soát giao thức OpenClaw sử dụng:

| Giá trị         | Hành vi                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Mặc định) Thăm dò cả hai transport; streaming xác thực việc nhận qua WebSocket của container    |
| `"native"`    | Ép dùng signal-cli native (JSON-RPC tại `/api/v1/rpc`, SSE tại `/api/v1/events`)         |
| `"container"` | Ép dùng container bbernhard (REST tại `/v2/send`, WebSocket tại `/v1/receive/{account}`) |

Khi `apiMode` là `"auto"`, OpenClaw lưu cache chế độ đã phát hiện trong 30 giây để tránh thăm dò lặp lại. Nhận qua container chỉ được chọn cho streaming sau khi `/v1/receive/{account}` nâng cấp lên WebSocket, điều này yêu cầu `MODE=json-rpc`.

Chế độ container hỗ trợ cùng các thao tác kênh Signal như chế độ native khi container cung cấp các API tương ứng: gửi, nhận, tệp đính kèm, chỉ báo đang nhập, biên nhận đã đọc/đã xem, phản ứng, nhóm và văn bản có định dạng. OpenClaw chuyển đổi các lệnh gọi RPC Signal native của nó thành payload REST của container, bao gồm ID nhóm `group.{base64(internal_id)}` và `text_mode: "styled"` cho văn bản đã định dạng.

Ghi chú vận hành:

- Dùng `autoStart: false` với chế độ container. OpenClaw không nên spawn daemon native khi chọn `apiMode: "container"`.
- Dùng `MODE=json-rpc` để nhận. `MODE=normal` có thể làm `/v1/about` trông khỏe mạnh, nhưng `/v1/receive/{account}` không nâng cấp lên WebSocket, nên OpenClaw sẽ không chọn streaming nhận qua container trong chế độ `auto`.
- Đặt `apiMode: "container"` khi bạn biết `httpUrl` trỏ tới API REST của bbernhard. Đặt `apiMode: "native"` khi bạn biết nó trỏ tới JSON-RPC/SSE của `signal-cli` native. Dùng `"auto"` khi cách triển khai có thể thay đổi.
- Tải xuống tệp đính kèm trong chế độ container tuân thủ cùng giới hạn byte media như chế độ native. Phản hồi quá cỡ bị từ chối trước khi được buffer đầy đủ khi máy chủ gửi `Content-Length`, và bị từ chối trong khi streaming trong các trường hợp khác.

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
- `channels.signal.groupAllowFrom` kiểm soát nhóm hoặc người gửi nào có thể kích hoạt phản hồi nhóm khi đặt `allowlist`; mục nhập có thể là ID nhóm Signal (thô, `group:<id>`, hoặc `signal:group:<id>`), số điện thoại người gửi, giá trị `uuid:<id>`, hoặc `*`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools`, và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` cho ghi đè theo từng tài khoản trong thiết lập nhiều tài khoản.
- Việc đưa một nhóm Signal vào danh sách cho phép thông qua `groupAllowFrom` tự nó không tắt cổng yêu cầu nhắc tên. Một mục `channels.signal.groups["<group-id>"]` được cấu hình cụ thể sẽ xử lý mọi tin nhắn nhóm trừ khi đặt `requireMention=true`.
- Ghi chú runtime: nếu `channels.signal` hoàn toàn thiếu, runtime sẽ quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

## Cách hoạt động (hành vi)

- Chế độ native: `signal-cli` chạy như một daemon; Gateway đọc sự kiện qua SSE.
- Chế độ container: Gateway gửi qua API REST và nhận qua WebSocket.
- Tin nhắn đến được chuẩn hóa vào envelope kênh dùng chung.
- Phản hồi luôn định tuyến trở lại cùng số hoặc nhóm.

## Media + giới hạn

- Văn bản gửi đi được chia đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Chia đoạn theo dòng mới tùy chọn: đặt `channels.signal.chunkMode="newline"` để chia tại các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Hỗ trợ tệp đính kèm (base64 được lấy từ `signal-cli`).
- Tệp đính kèm ghi chú thoại dùng tên tệp của `signal-cli` làm MIME dự phòng khi thiếu `contentType`, để phiên âm âm thanh vẫn có thể phân loại bản ghi nhớ giọng nói AAC.
- Giới hạn media mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua việc tải xuống media.
- Ngữ cảnh lịch sử nhóm dùng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), rồi quay về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Đang nhập + biên nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi phản hồi đang chạy.
- **Biên nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp biên nhận đã đọc cho các DM được phép.
- Signal-cli không cung cấp biên nhận đã đọc cho nhóm.

## Phản ứng (công cụ tin nhắn)

- Sử dụng `message action=react` với `channel=signal`.
- Mục tiêu: E.164 của người gửi hoặc UUID (dùng `uuid:<id>` từ đầu ra ghép cặp; UUID trần cũng dùng được).
- `messageId` là dấu thời gian Signal của tin nhắn mà bạn đang phản ứng.
- Phản ứng trong nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

Ví dụ:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt các hành động phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` tắt phản ứng của tác nhân (công cụ tin nhắn `react` sẽ báo lỗi).
  - `minimal`/`extensive` bật phản ứng của tác nhân và đặt mức hướng dẫn.
- Ghi đè theo từng tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Mục tiêu gửi (CLI/cron)

- Tin nhắn trực tiếp: `signal:+15551234567` (hoặc E.164 thuần).
- Tin nhắn trực tiếp UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu tài khoản Signal của bạn hỗ trợ).

## Khắc phục sự cố

Chạy thang kiểm tra này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó xác nhận trạng thái ghép cặp tin nhắn trực tiếp nếu cần:

```bash
openclaw pairing list signal
```

Lỗi thường gặp:

- Daemon truy cập được nhưng không có phản hồi: xác minh thiết lập tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- Tin nhắn trực tiếp bị bỏ qua: người gửi đang chờ phê duyệt ghép cặp.
- Tin nhắn nhóm bị bỏ qua: cổng kiểm soát theo người gửi/nhắc đến trong nhóm chặn việc gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal thiếu trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Luồng phân loại sự cố: [/channels/troubleshooting](/vi/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển máy chủ hoặc dựng lại.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn thật sự muốn quyền truy cập tin nhắn trực tiếp rộng hơn.
- Xác minh SMS chỉ cần cho luồng đăng ký hoặc khôi phục, nhưng mất quyền kiểm soát số/tài khoản có thể làm việc đăng ký lại phức tạp hơn.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.apiMode`: `auto | native | container` (mặc định: auto). Xem [Chế độ container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.httpUrl`: URL daemon đầy đủ (ghi đè host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: liên kết daemon (mặc định 127.0.0.1:8080).
- `channels.signal.autoStart`: tự động sinh daemon (mặc định true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (giới hạn 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua tải xuống tệp đính kèm.
- `channels.signal.ignoreStories`: bỏ qua tin từ daemon.
- `channels.signal.sendReadReceipts`: chuyển tiếp biên nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép tin nhắn trực tiếp (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; dùng ID điện thoại/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép nhóm; chấp nhận ID nhóm Signal (thô, `group:<id>`, hoặc `signal:group:<id>`), số E.164 của người gửi, hoặc giá trị `uuid:<id>`.
- `channels.signal.groups`: ghi đè theo từng nhóm, khóa theo ID nhóm Signal (hoặc `"*"`). Trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` cho thiết lập nhiều tài khoản.
- `channels.signal.historyLimit`: số tin nhắn nhóm tối đa đưa vào làm ngữ cảnh (0 tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi (ký tự).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện gửi đến/gửi đi (MB).

Tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ nhắc đến gốc).
- `messages.groupChat.mentionPatterns` (dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép cặp](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép cặp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
