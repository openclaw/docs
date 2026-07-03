---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal qua signal-cli (daemon gốc hoặc container bbernhard), các đường dẫn thiết lập và mô hình số
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:33:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Trạng thái: tích hợp CLI bên ngoài. Gateway giao tiếp với `signal-cli` qua HTTP — daemon gốc (JSON-RPC + SSE) hoặc container bbernhard/signal-cli-rest-api (REST + WebSocket).

## Điều kiện tiên quyết

- OpenClaw đã được cài đặt trên máy chủ của bạn (quy trình Linux bên dưới đã được kiểm thử trên Ubuntu 24).
- Một trong các lựa chọn:
  - `signal-cli` có sẵn trên máy chủ (chế độ gốc), **hoặc**
  - Container Docker `bbernhard/signal-cli-rest-api` (chế độ container).
- Một số điện thoại có thể nhận một SMS xác minh (cho luồng đăng ký bằng SMS).
- Quyền truy cập trình duyệt cho captcha Signal (`signalcaptchas.org`) trong quá trình đăng ký.

## Thiết lập nhanh (cho người mới bắt đầu)

1. Sử dụng một **số Signal riêng** cho bot (khuyến nghị).
2. Cài đặt Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Cài đặt `signal-cli` (cần Java nếu bạn dùng bản dựng JVM).
4. Chọn một cách thiết lập:
   - **Cách A (liên kết QR):** `signal-cli link -n "OpenClaw"` rồi quét bằng Signal.
   - **Cách B (đăng ký SMS):** đăng ký một số chuyên dụng bằng captcha + xác minh SMS.
5. Cấu hình OpenClaw và khởi động lại Gateway.
6. Gửi DM đầu tiên và phê duyệt ghép nối (`openclaw pairing approve signal <CODE>`).

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

| Trường       | Mô tả                                                        |
| ------------ | ------------------------------------------------------------ |
| `account`    | Số điện thoại bot theo định dạng E.164 (`+15551234567`)       |
| `cliPath`    | Đường dẫn đến `signal-cli` (`signal-cli` nếu nằm trong `PATH`) |
| `configPath` | Thư mục cấu hình signal-cli được truyền dưới dạng `--config` |
| `dmPolicy`   | Chính sách truy cập DM (khuyến nghị `pairing`)               |
| `allowFrom`  | Số điện thoại hoặc giá trị `uuid:<id>` được phép gửi DM       |

## Đây là gì

- Kênh Signal qua `signal-cli` (không nhúng libsignal).
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

- Gateway kết nối với một **thiết bị Signal** (tài khoản `signal-cli`).
- Nếu bạn chạy bot trên **tài khoản Signal cá nhân của mình**, nó sẽ bỏ qua tin nhắn của chính bạn (bảo vệ chống vòng lặp).
- Để "tôi nhắn cho bot và nó trả lời", hãy dùng một **số bot riêng**.

## Cách thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc gốc).
2. Liên kết tài khoản bot:
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

## Cách thiết lập B: đăng ký số bot chuyên dụng (SMS, Linux)

Dùng cách này khi bạn muốn có một số bot chuyên dụng thay vì liên kết tài khoản ứng dụng Signal hiện có.

1. Lấy một số có thể nhận SMS (hoặc xác minh bằng cuộc gọi thoại cho số cố định).
   - Dùng một số bot chuyên dụng để tránh xung đột tài khoản/phiên.
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
3. Khi có thể, chạy từ cùng IP bên ngoài với phiên trình duyệt.
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
   - Lưu số bot làm liên hệ trên điện thoại của bạn để tránh "Liên hệ không xác định".

<Warning>
Việc đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính cho số đó. Nên dùng một số bot chuyên dụng, hoặc dùng chế độ liên kết QR nếu bạn cần giữ thiết lập ứng dụng điện thoại hiện có.
</Warning>

Tham chiếu upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Luồng captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Luồng liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Nếu bạn muốn tự quản lý `signal-cli` (khởi động lạnh JVM chậm, khởi tạo container, hoặc CPU dùng chung), hãy chạy daemon riêng và trỏ OpenClaw đến đó:

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

Điều này bỏ qua tự động sinh tiến trình và thời gian chờ khởi động bên trong OpenClaw. Với các lần khởi động chậm khi tự động sinh tiến trình, đặt `channels.signal.startupTimeoutMs`.

## Chế độ container (bbernhard/signal-cli-rest-api)

Thay vì chạy `signal-cli` nguyên bản, bạn có thể dùng container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Container này bọc `signal-cli` phía sau một REST API và giao diện WebSocket.

Yêu cầu:

- Container **phải** chạy với `MODE=json-rpc` để nhận tin nhắn theo thời gian thực.
- Đăng ký hoặc liên kết tài khoản Signal của bạn bên trong container trước khi kết nối OpenClaw.

Ví dụ dịch vụ `docker-compose.yml`:

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

Trường `apiMode` kiểm soát giao thức mà OpenClaw sử dụng:

| Giá trị       | Hành vi                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Mặc định) Thăm dò cả hai transport; streaming xác thực việc nhận qua WebSocket của container |
| `"native"`    | Ép dùng signal-cli gốc (JSON-RPC tại `/api/v1/rpc`, SSE tại `/api/v1/events`)        |
| `"container"` | Ép dùng container bbernhard (REST tại `/v2/send`, WebSocket tại `/v1/receive/{account}`) |

Khi `apiMode` là `"auto"`, OpenClaw lưu cache chế độ đã phát hiện trong 30 giây để tránh thăm dò lặp lại. Nhận qua container chỉ được chọn cho streaming sau khi `/v1/receive/{account}` nâng cấp lên WebSocket, việc này yêu cầu `MODE=json-rpc`.

Chế độ container hỗ trợ cùng các thao tác kênh Signal như chế độ gốc khi container cung cấp các API tương ứng: gửi, nhận, tệp đính kèm, chỉ báo đang nhập, biên nhận đã đọc/đã xem, phản ứng, nhóm và văn bản có định dạng. OpenClaw chuyển các lệnh gọi RPC Signal gốc của mình thành payload REST của container, bao gồm ID nhóm `group.{base64(internal_id)}` và `text_mode: "styled"` cho văn bản có định dạng.

Ghi chú vận hành:

- Dùng `autoStart: false` với chế độ container. OpenClaw không nên sinh daemon gốc khi `apiMode: "container"` được chọn.
- Dùng `MODE=json-rpc` để nhận. `MODE=normal` có thể khiến `/v1/about` trông khỏe mạnh, nhưng `/v1/receive/{account}` không nâng cấp WebSocket, nên OpenClaw sẽ không chọn streaming nhận qua container ở chế độ `auto`.
- Đặt `apiMode: "container"` khi bạn biết `httpUrl` trỏ đến REST API của bbernhard. Đặt `apiMode: "native"` khi bạn biết nó trỏ đến JSON-RPC/SSE gốc của `signal-cli`. Dùng `"auto"` khi triển khai có thể thay đổi.
- Tải xuống tệp đính kèm trong container tuân thủ cùng giới hạn byte media như chế độ gốc. Phản hồi quá lớn bị từ chối trước khi được buffer đầy đủ khi máy chủ gửi `Content-Length`, và nếu không thì bị từ chối trong lúc streaming.

## Kiểm soát truy cập (DM + nhóm)

DM:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận được mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Ghép nối là trao đổi token mặc định cho DM Signal. Chi tiết: [Ghép nối](/vi/channels/pairing)
- Người gửi chỉ có UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát nhóm hoặc người gửi nào có thể kích hoạt phản hồi nhóm khi đặt `allowlist`; mục nhập có thể là ID nhóm Signal (thô, `group:<id>`, hoặc `signal:group:<id>`), số điện thoại người gửi, giá trị `uuid:<id>`, hoặc `*`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools`, và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` để ghi đè theo từng tài khoản trong thiết lập nhiều tài khoản.
- Việc đưa một nhóm Signal vào allowlist qua `groupAllowFrom` tự nó không tắt cổng yêu cầu nhắc đến. Một mục `channels.signal.groups["<group-id>"]` được cấu hình cụ thể sẽ xử lý mọi tin nhắn nhóm trừ khi đặt `requireMention=true`.
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.signal`, runtime sẽ quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

## Cách hoạt động (hành vi)

- Chế độ gốc: `signal-cli` chạy như một daemon; Gateway đọc sự kiện qua SSE.
- Chế độ container: Gateway gửi qua REST API và nhận qua WebSocket.
- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung.
- Phản hồi luôn được định tuyến trở lại cùng số hoặc nhóm.

## Media + giới hạn

- Văn bản gửi đi được chia thành các đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Chia đoạn theo dòng mới tùy chọn: đặt `channels.signal.chunkMode="newline"` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Hỗ trợ tệp đính kèm (base64 được lấy từ `signal-cli`).
- Tệp đính kèm ghi chú thoại dùng tên tệp `signal-cli` làm MIME dự phòng khi thiếu `contentType`, để phiên âm âm thanh vẫn có thể phân loại bản ghi nhớ thoại AAC.
- Giới hạn media mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua tải xuống media.
- Ngữ cảnh lịch sử nhóm dùng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), quay về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Đang nhập + biên nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi phản hồi đang chạy.
- **Biên nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp biên nhận đã đọc cho các DM được phép.
- Signal-cli không cung cấp biên nhận đã đọc cho nhóm.

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để Signal hiển thị vòng đời phản ứng chung
đã xếp hàng/đang suy nghĩ/công cụ/Compaction/hoàn tất/lỗi trên các lượt đến.
Signal dùng dấu thời gian của tin nhắn đến làm mục tiêu phản ứng; phản ứng nhóm
được gửi kèm id nhóm Signal cộng với người gửi ban đầu làm tác giả mục tiêu.

Phản ứng trạng thái cũng yêu cầu một phản ứng xác nhận và một
`messages.ackReactionScope` khớp (`direct`, `group-all`, `group-mentions`, hoặc `all`).
Đặt `channels.signal.reactionLevel: "off"` để tắt phản ứng trạng thái Signal.
Hành động `react` của công cụ tin nhắn vẫn nghiêm ngặt hơn: nó yêu cầu
`reactionLevel: "minimal"` hoặc `"extensive"`.

`messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau
thời gian giữ đã cấu hình. Nếu không, Signal khôi phục phản ứng xác nhận ban đầu sau
trạng thái hoàn tất/lỗi cuối cùng.

## Phản ứng (công cụ tin nhắn)

- Dùng `message action=react` với `channel=signal`.
- Mục tiêu: E.164 hoặc UUID của người gửi (dùng `uuid:<id>` từ đầu ra ghép nối; UUID trần cũng hoạt động).
- `messageId` là dấu thời gian Signal cho tin nhắn mà bạn đang phản ứng.
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

## Phản ứng phê duyệt

Lời nhắc phê duyệt exec và Plugin của Signal dùng các khối định tuyến cấp cao nhất
`approvals.exec` và `approvals.plugin`. Signal không có khối
`channels.signal.execApprovals`.

- `👍` phê duyệt một lần.
- `👎` từ chối.
- Dùng `/approve <id> allow-always` khi một yêu cầu cung cấp phê duyệt lâu dài.

Việc phân giải phản ứng phê duyệt yêu cầu người phê duyệt Signal rõ ràng từ
`channels.signal.allowFrom`, `channels.signal.defaultTo`, hoặc các trường cấp tài khoản khớp.
Các lời nhắc phê duyệt exec trực tiếp trong cùng cuộc trò chuyện vẫn có thể ẩn phương án dự phòng `/approve` cục bộ trùng lặp
mà không cần người phê duyệt rõ ràng; phê duyệt nhóm không có người phê duyệt vẫn giữ phương án dự phòng cục bộ hiển thị.

## Mục tiêu gửi (CLI/cron)

- DM: `signal:+15551234567` (hoặc E.164 thuần).
- DM UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu tài khoản Signal của bạn hỗ trợ).

## Bí danh

Cấu hình bí danh khi bạn muốn tên ổn định cho các mục tiêu Signal định kỳ.
Bí danh chỉ là cấu hình phía OpenClaw; chúng không tạo hoặc chỉnh sửa liên hệ Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Dùng bí danh ở bất cứ nơi nào chấp nhận mục tiêu gửi Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Bí danh theo từng tài khoản kế thừa bí danh cấp cao nhất và có thể thêm hoặc ghi đè tên:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` và
`openclaw directory groups list --channel signal` liệt kê các bí danh đã cấu hình. Thư mục
Signal dựa trên cấu hình; nó không truy vấn trực tiếp liên hệ Signal hoặc
thay đổi tài khoản Signal.

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

- Daemon truy cập được nhưng không có phản hồi: xác minh thiết lập tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- DM bị bỏ qua: người gửi đang chờ phê duyệt ghép nối.
- Tin nhắn nhóm bị bỏ qua: cơ chế chặn theo người gửi nhóm/đề cập chặn việc gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal bị thiếu trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Đối với luồng phân loại: [/channels/troubleshooting](/vi/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc dựng lại máy chủ.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn rõ ràng muốn quyền truy cập DM rộng hơn.
- Xác minh SMS chỉ cần cho luồng đăng ký hoặc khôi phục, nhưng mất quyền kiểm soát số/tài khoản có thể làm phức tạp việc đăng ký lại.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.apiMode`: `auto | native | container` (mặc định: auto). Xem [Chế độ container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.configPath`: thư mục `signal-cli --config` tùy chọn.
- `channels.signal.httpUrl`: URL daemon đầy đủ (ghi đè host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind daemon (mặc định 127.0.0.1:8080).
- `channels.signal.autoStart`: tự động sinh daemon (mặc định true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (giới hạn 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua tải xuống tệp đính kèm.
- `channels.signal.ignoreStories`: bỏ qua story từ daemon.
- `channels.signal.sendReadReceipts`: chuyển tiếp biên nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép DM (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; dùng id điện thoại/UUID.
- `channels.signal.aliases`: bí danh phía OpenClaw cho mục tiêu gửi DM hoặc nhóm.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép nhóm; chấp nhận ID nhóm Signal (thô, `group:<id>`, hoặc `signal:group:<id>`), số E.164 của người gửi, hoặc giá trị `uuid:<id>`.
- `channels.signal.groups`: ghi đè theo từng nhóm, khóa theo id nhóm Signal (hoặc `"*"`). Trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` cho thiết lập nhiều tài khoản.
- `channels.signal.accounts.<id>.aliases`: bí danh theo từng tài khoản, được hợp nhất với bí danh cấp cao nhất.
- `channels.signal.historyLimit`: số tin nhắn nhóm tối đa đưa vào làm ngữ cảnh (0 để tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử DM theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi (ký tự).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện đến/đi (MB).

Tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ đề cập gốc).
- `messages.groupChat.mentionPatterns` (phương án dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế chặn theo đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
