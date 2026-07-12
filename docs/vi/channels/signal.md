---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal thông qua signal-cli (daemon gốc hoặc container bbernhard), các phương thức thiết lập và mô hình số điện thoại
title: Signal
x-i18n:
    generated_at: "2026-07-12T07:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal là một plugin kênh có thể tải xuống (`@openclaw/signal`). Gateway giao tiếp với `signal-cli` qua HTTP: sử dụng daemon gốc (JSON-RPC + SSE) hoặc container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw không nhúng libsignal.

## Mô hình số điện thoại (hãy đọc phần này trước)

- Gateway kết nối với một **thiết bị Signal**: tài khoản `signal-cli`.
- Chạy bot trên **tài khoản Signal cá nhân của bạn** sẽ khiến bot bỏ qua tin nhắn của chính bạn (để chống lặp).
- Để có trải nghiệm "tôi nhắn tin cho bot và bot trả lời", hãy dùng một **số điện thoại riêng cho bot**.

## Cài đặt

```bash
openclaw plugins install @openclaw/signal
```

Đặc tả plugin không có tiền tố sẽ thử ClawHub trước, sau đó dự phòng sang npm. Buộc sử dụng một nguồn bằng `openclaw plugins install clawhub:@openclaw/signal` hoặc `npm:@openclaw/signal`. `plugins install` đăng ký và bật plugin; không cần bước `enable` riêng. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt chung.

## Thiết lập nhanh

<Steps>
  <Step title="Chọn một số điện thoại">
    Sử dụng một **số Signal riêng** cho bot (khuyến nghị).
  </Step>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Chạy quy trình thiết lập có hướng dẫn">
    ```bash
    openclaw channels add
    ```
    Trình hướng dẫn phát hiện xem `signal-cli` có nằm trong `PATH` hay không và khi thiếu, sẽ đề nghị cài đặt: tải xuống bản dựng GraalVM gốc chính thức trên Linux x86-64 hoặc cài đặt qua Homebrew trên macOS và các kiến trúc khác. Sau đó, trình hướng dẫn yêu cầu nhập số điện thoại của bot và đường dẫn `signal-cli`.
  </Step>
  <Step title="Liên kết hoặc đăng ký tài khoản">
    - **Liên kết bằng mã QR (nhanh nhất):** `signal-cli link -n "OpenClaw"`, sau đó quét bằng Signal. Xem [Phương án A](#setup-path-a-link-existing-signal-account-qr).
    - **Đăng ký qua SMS:** số điện thoại riêng cùng captcha + xác minh SMS. Xem [Phương án B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Xác minh và ghép cặp">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Gửi tin nhắn trực tiếp đầu tiên và phê duyệt ghép cặp: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| Trường       | Mô tả                                                       |
| ------------ | ----------------------------------------------------------- |
| `account`    | Số điện thoại bot ở định dạng E.164 (`+15551234567`)        |
| `cliPath`    | Đường dẫn đến `signal-cli` (`signal-cli` nếu có trong `PATH`) |
| `configPath` | Thư mục cấu hình signal-cli được truyền dưới dạng `--config` |
| `dmPolicy`   | Chính sách truy cập tin nhắn trực tiếp (khuyến nghị `pairing`) |
| `allowFrom`  | Các số điện thoại hoặc giá trị `uuid:<id>` được phép gửi tin nhắn trực tiếp |

Hỗ trợ nhiều tài khoản: sử dụng `channels.signal.accounts` với cấu hình riêng cho từng tài khoản và `name` tùy chọn. Xem [Kênh nhiều tài khoản](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu dùng chung.

## Chức năng

- Định tuyến xác định: câu trả lời luôn được gửi trở lại Signal.
- Các tin nhắn trực tiếp dùng chung phiên chính của tác nhân; các nhóm được tách biệt (`agent:<agentId>:signal:group:<groupId>`).
- Theo mặc định, Signal có thể ghi các cập nhật cấu hình được kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`). Tắt bằng `channels.signal.configWrites: false`.

## Phương án thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc bản dựng gốc), hoặc để `openclaw channels add` cài đặt giúp bạn.
2. Liên kết tài khoản bot: `signal-cli link -n "OpenClaw"`, sau đó quét mã QR trong Signal.
3. Cấu hình Signal và khởi động Gateway.

## Phương án thiết lập B: đăng ký số điện thoại riêng cho bot (SMS, Linux)

Sử dụng phương án này cho một số điện thoại riêng của bot thay vì liên kết tài khoản ứng dụng Signal hiện có. Quy trình dưới đây đã được kiểm thử trên Ubuntu 24.

1. Chuẩn bị một số điện thoại có thể nhận SMS (hoặc xác minh bằng cuộc gọi thoại đối với điện thoại cố định). Số điện thoại riêng cho bot giúp tránh xung đột tài khoản/phiên.
2. Cài đặt `signal-cli` trên máy chủ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu sử dụng bản dựng JVM (`signal-cli-${VERSION}.tar.gz`), hãy cài đặt JRE trước. Duy trì `signal-cli` ở phiên bản mới nhất; dự án nguồn lưu ý rằng các bản phát hành cũ có thể ngừng hoạt động khi API máy chủ Signal thay đổi.

3. Đăng ký và xác minh số điện thoại:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu yêu cầu captcha (cần quyền truy cập trình duyệt để hoàn thành bước này):

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn thành captcha, sao chép đích liên kết `signalcaptcha://...` từ "Open Signal".
3. Khi có thể, hãy chạy từ cùng địa chỉ IP bên ngoài với phiên trình duyệt (mã thông báo captcha hết hạn nhanh chóng).
4. Đăng ký và xác minh ngay lập tức:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Cấu hình OpenClaw, khởi động lại Gateway và xác minh kênh:

```bash
# Nếu bạn chạy Gateway dưới dạng dịch vụ systemd của người dùng:
systemctl --user restart openclaw-gateway.service

# Sau đó xác minh:
openclaw doctor
openclaw channels status --probe
```

5. Ghép cặp người gửi tin nhắn trực tiếp:
   - Gửi một tin nhắn bất kỳ đến số điện thoại của bot.
   - Phê duyệt trên máy chủ: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số điện thoại của bot làm liên hệ trên điện thoại để tránh "Unknown contact".

<Warning>
Việc đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính của số điện thoại đó. Nên sử dụng một số điện thoại riêng cho bot hoặc dùng chế độ liên kết bằng mã QR để giữ nguyên thiết lập ứng dụng hiện có trên điện thoại.
</Warning>

Tài liệu tham khảo từ dự án nguồn:

- README của `signal-cli`: `https://github.com/AsamK/signal-cli`
- Quy trình captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Quy trình liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Để tự quản lý `signal-cli` (khởi động nguội JVM chậm, khởi tạo container, CPU dùng chung), hãy chạy daemon riêng biệt và trỏ OpenClaw đến daemon đó:

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

Điều này bỏ qua việc tự động khởi chạy tiến trình và khoảng chờ khởi động của OpenClaw. Đối với các lần khởi động tự động chậm, hãy đặt `channels.signal.startupTimeoutMs`.

## Chế độ container (bbernhard/signal-cli-rest-api)

Thay vì chạy `signal-cli` theo cách gốc, hãy sử dụng container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), cung cấp một giao diện REST + WebSocket bao quanh `signal-cli`.

Yêu cầu:

- Container **phải** chạy với `MODE=json-rpc` để nhận tin nhắn theo thời gian thực.
- Đăng ký hoặc liên kết tài khoản Signal của bạn bên trong container trước khi kết nối OpenClaw.

Ví dụ về dịch vụ `docker-compose.yml`:

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
      apiMode: "container", // hoặc "auto" để tự động phát hiện
    },
  },
}
```

`apiMode` kiểm soát giao thức mà OpenClaw sử dụng:

| Giá trị       | Hành vi                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| `"auto"`      | (Mặc định) Thăm dò cả hai phương thức truyền tải; luồng truyền trực tiếp xác thực khả năng nhận qua WebSocket của container |
| `"native"`    | Buộc dùng signal-cli gốc (JSON-RPC tại `/api/v1/rpc`, SSE tại `/api/v1/events`)             |
| `"container"` | Buộc dùng container bbernhard (REST tại `/v2/send`, WebSocket tại `/v1/receive/{account}`)  |

Khi `apiMode` là `"auto"`, OpenClaw lưu chế độ đã phát hiện vào bộ nhớ đệm trong 30 giây cho mỗi URL daemon để tránh thăm dò lặp lại (chế độ gốc được ưu tiên khi cả hai phương thức truyền tải đều hoạt động tốt). Việc nhận qua container chỉ được chọn cho luồng truyền trực tiếp sau khi `/v1/receive/{account}` nâng cấp lên WebSocket, yêu cầu `MODE=json-rpc`.

Chế độ container hỗ trợ các thao tác Signal giống chế độ gốc khi container cung cấp các API tương ứng: gửi, nhận, tệp đính kèm, chỉ báo đang nhập, biên nhận đã đọc/đã xem, phản ứng, nhóm và văn bản có kiểu định dạng. OpenClaw chuyển đổi các lệnh gọi RPC Signal gốc thành tải trọng REST của container, bao gồm ID nhóm `group.{base64(internal_id)}` và `text_mode: "styled"` cho văn bản được định dạng.

Lưu ý vận hành:

- Sử dụng `autoStart: false` với chế độ container; OpenClaw không nên khởi chạy daemon gốc khi chọn `apiMode: "container"`.
- Sử dụng `MODE=json-rpc` để nhận tin nhắn. `MODE=normal` có thể khiến `/v1/about` trông như đang hoạt động tốt, nhưng `/v1/receive/{account}` sẽ không nâng cấp lên WebSocket, vì vậy OpenClaw sẽ không chọn luồng nhận qua container ở chế độ `auto`.
- Đặt `apiMode: "container"` khi `httpUrl` trỏ đến API REST bbernhard, `"native"` khi trỏ đến JSON-RPC/SSE của `signal-cli` gốc và `"auto"` khi phương thức triển khai có thể thay đổi.
- Việc tải xuống tệp đính kèm ở chế độ container tuân theo cùng giới hạn byte phương tiện như chế độ gốc. Các phản hồi quá lớn bị từ chối trước khi được lưu toàn bộ vào bộ đệm khi máy chủ gửi `Content-Length`; nếu không, chúng bị từ chối trong quá trình truyền trực tiếp.

## Kiểm soát truy cập (tin nhắn trực tiếp + nhóm)

Tin nhắn trực tiếp:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận được mã ghép cặp; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua `openclaw pairing list signal` và `openclaw pairing approve signal <CODE>`.
- Ghép cặp là phương thức trao đổi mã thông báo mặc định cho tin nhắn trực tiếp Signal. Chi tiết: [Ghép cặp](/vi/channels/pairing)
- Người gửi chỉ có UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát những nhóm hoặc người gửi nào có thể kích hoạt phản hồi nhóm khi đặt `allowlist`; mục nhập có thể là ID nhóm Signal (dạng thô, `group:<id>` hoặc `signal:group:<id>`), số điện thoại người gửi, giá trị `uuid:<id>` hoặc `*`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools` và `toolsBySender`.
- Sử dụng `channels.signal.accounts.<id>.groups` để ghi đè theo từng tài khoản trong thiết lập nhiều tài khoản.
- Việc đưa một nhóm vào danh sách cho phép thông qua `groupAllowFrom` không tự động tắt yêu cầu đề cập. Một mục `channels.signal.groups["<group-id>"]` được cấu hình cụ thể sẽ xử lý mọi tin nhắn nhóm trừ khi `requireMention: true` được đặt rõ ràng.
- Lưu ý khi chạy: nếu hoàn toàn không có `channels.signal`, hệ thống khi chạy sẽ dự phòng sang `groupPolicy="allowlist"` để kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

## Cách hoạt động (hành vi)

- Chế độ gốc: `signal-cli` chạy dưới dạng daemon; Gateway đọc sự kiện qua SSE.
- Chế độ container: Gateway gửi qua API REST và nhận qua WebSocket.
- Tin nhắn đến được chuẩn hóa thành phong bì kênh dùng chung.
- Câu trả lời luôn được định tuyến trở lại cùng số điện thoại hoặc nhóm.
- Câu trả lời cho tin nhắn đến bao gồm siêu dữ liệu trích dẫn gốc của Signal khi phần phụ trợ chấp nhận dấu thời gian và tác giả của tin nhắn đến; nếu thiếu hoặc từ chối siêu dữ liệu trích dẫn, OpenClaw gửi câu trả lời dưới dạng tin nhắn thông thường.
- Cấu hình việc sử dụng trích dẫn gốc bằng `channels.signal.replyToMode = off | first | all | batched` hoặc `channels.signal.replyToModeByChatType.direct/group` để ghi đè theo từng loại cuộc trò chuyện. Các giá trị cấp tài khoản trong `channels.signal.accounts.<id>` được ưu tiên.

## Phương tiện + giới hạn

- Văn bản gửi đi được chia thành các đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Tùy chọn chia đoạn theo dòng mới: đặt `channels.signal.chunkMode="newline"` để tách tại các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Có hỗ trợ tệp đính kèm (dữ liệu base64 được lấy từ `signal-cli`).
- Tệp đính kèm ghi chú thoại sử dụng tên tệp từ `signal-cli` làm MIME dự phòng khi thiếu `contentType`, để quá trình chuyển âm thanh thành văn bản vẫn có thể phân loại bản ghi nhớ thoại AAC.
- Giới hạn phương tiện mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Sử dụng `channels.signal.ignoreAttachments` để bỏ qua việc tải xuống phương tiện.
- Ngữ cảnh lịch sử nhóm sử dụng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), với giá trị dự phòng là `messages.groupChat.historyLimit`. Đặt thành `0` để tắt (mặc định 50).

## Chỉ báo đang nhập + xác nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi đang tạo phản hồi.
- **Xác nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp xác nhận đã đọc cho các tin nhắn trực tiếp được cho phép.
- `signal-cli` không cung cấp xác nhận đã đọc cho nhóm.

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để Signal hiển thị vòng đời phản ứng dùng chung gồm đã xếp hàng/đang suy nghĩ/công cụ/compaction/hoàn tất/lỗi cho các lượt đến. Signal sử dụng dấu thời gian của tin nhắn đến làm đích phản ứng; phản ứng nhóm được gửi bằng ID nhóm Signal cùng với người gửi ban đầu làm tác giả đích.

Phản ứng trạng thái cũng yêu cầu một phản ứng xác nhận và `messages.ackReactionScope` tương ứng (`direct`, `group-all`, `group-mentions` hoặc `all`). Đặt `channels.signal.reactionLevel: "off"` để tắt phản ứng trạng thái Signal.

`messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau thời gian giữ đã cấu hình. Nếu không, Signal khôi phục phản ứng xác nhận ban đầu sau trạng thái hoàn tất/lỗi cuối cùng.

## Phản ứng (công cụ tin nhắn)

Sử dụng `message action=react` với `channel=signal`.

- Đích: E.164 hoặc UUID của người gửi (sử dụng `uuid:<id>` từ đầu ra ghép đôi; UUID trần cũng hoạt động).
- `messageId` là dấu thời gian Signal của tin nhắn mà bạn đang phản ứng.
- Phản ứng nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt hành động phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (mặc định `minimal`).
  - `off`/`ack` tắt phản ứng của tác nhân (công cụ tin nhắn `react` báo lỗi).
  - `minimal`/`extensive` bật phản ứng của tác nhân và thiết lập mức hướng dẫn.
- Ghi đè theo từng tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Phản ứng phê duyệt

Lời nhắc phê duyệt thực thi và Plugin trên Signal sử dụng các khối định tuyến cấp cao nhất `approvals.exec` và `approvals.plugin`. Signal không có khối `channels.signal.execApprovals`.

- `👍` phê duyệt một lần.
- `👎` từ chối.
- Sử dụng `/approve <id> allow-always` khi yêu cầu cung cấp tùy chọn phê duyệt vĩnh viễn.

Việc xử lý phản ứng phê duyệt yêu cầu người phê duyệt Signal được chỉ định rõ trong `channels.signal.allowFrom`, `channels.signal.defaultTo` hoặc các trường tương ứng ở cấp tài khoản. Lời nhắc phê duyệt thực thi trực tiếp trong cùng cuộc trò chuyện vẫn có thể ẩn phương án dự phòng `/approve` cục bộ trùng lặp mà không cần người phê duyệt rõ ràng; phê duyệt nhóm không có người phê duyệt vẫn hiển thị phương án dự phòng cục bộ.

## Đích gửi (CLI/cron)

- Tin nhắn trực tiếp: `signal:+15551234567` (hoặc E.164 thuần).
- Tin nhắn trực tiếp qua UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu tài khoản Signal của bạn hỗ trợ).

## Bí danh

Cấu hình bí danh để đặt tên ổn định cho các đích Signal được sử dụng định kỳ. Bí danh chỉ là cấu hình phía OpenClaw; chúng không tạo hoặc chỉnh sửa liên hệ Signal.

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

Sử dụng bí danh ở bất kỳ nơi nào chấp nhận đích gửi Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Bí danh theo từng tài khoản kế thừa các bí danh cấp cao nhất và có thể thêm hoặc ghi đè tên:

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

`openclaw directory peers list --channel signal` và `openclaw directory groups list --channel signal` liệt kê các bí danh đã cấu hình. Thư mục Signal dựa trên cấu hình; nó không truy vấn trực tiếp liên hệ Signal hoặc sửa đổi tài khoản Signal.

## Khắc phục sự cố

Trước tiên, hãy chạy chuỗi lệnh sau:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó, xác nhận trạng thái ghép đôi tin nhắn trực tiếp nếu cần:

```bash
openclaw pairing list signal
```

Các lỗi thường gặp:

- Có thể truy cập trình nền nhưng không có phản hồi: xác minh cài đặt tài khoản/trình nền (`httpUrl`, `account`) và chế độ nhận.
- Tin nhắn trực tiếp bị bỏ qua: người gửi đang chờ phê duyệt ghép đôi.
- Tin nhắn nhóm bị bỏ qua: cơ chế kiểm soát người gửi/lượt đề cập của nhóm chặn việc gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Không có Signal trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Để xem quy trình phân loại sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

## Lưu ý bảo mật

- `signal-cli` lưu trữ khóa tài khoản cục bộ (thường tại `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc xây dựng lại máy chủ.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn chủ động muốn quyền truy cập tin nhắn trực tiếp rộng hơn.
- Chỉ cần xác minh SMS cho quy trình đăng ký hoặc khôi phục, nhưng việc mất quyền kiểm soát số điện thoại/tài khoản có thể khiến quá trình đăng ký lại trở nên phức tạp.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt quá trình khởi động kênh.
- `channels.signal.apiMode`: `auto | native | container` (mặc định: auto). Xem [Chế độ vùng chứa](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.configPath`: thư mục `signal-cli --config` tùy chọn.
- `channels.signal.httpUrl`: URL đầy đủ của trình nền (ghi đè máy chủ/cổng).
- `channels.signal.httpHost`, `channels.signal.httpPort`: địa chỉ liên kết của trình nền (mặc định `127.0.0.1:8080`).
- `channels.signal.autoStart`: tự động khởi chạy trình nền (mặc định true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng mili giây (tối thiểu 1000, tối đa 120000; mặc định 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua việc tải xuống tệp đính kèm.
- `channels.signal.ignoreStories`: bỏ qua tin từ trình nền.
- `channels.signal.sendReadReceipts`: chuyển tiếp xác nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép tin nhắn trực tiếp (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; hãy sử dụng ID điện thoại/UUID.
- `channels.signal.aliases`: bí danh phía OpenClaw cho đích gửi tin nhắn trực tiếp hoặc nhóm.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép của nhóm; chấp nhận ID nhóm Signal (dạng thô, `group:<id>` hoặc `signal:group:<id>`), số E.164 của người gửi hoặc giá trị `uuid:<id>`.
- `channels.signal.groups`: ghi đè theo từng nhóm, được lập khóa bằng ID nhóm Signal (hoặc `"*"`). Các trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` dành cho cấu hình nhiều tài khoản.
- `channels.signal.accounts.<id>.aliases`: bí danh theo từng tài khoản, được hợp nhất với bí danh cấp cao nhất.
- `channels.signal.replyToMode`: chế độ trích dẫn trả lời gốc, `off | first | all | batched` (mặc định: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: ghi đè trích dẫn trả lời gốc theo loại cuộc trò chuyện.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: ghi đè trích dẫn trả lời theo từng tài khoản.
- `channels.signal.historyLimit`: số lượng tin nhắn nhóm tối đa được đưa vào ngữ cảnh (0 để tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp tính theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi tính theo ký tự (mặc định 4000).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để tách tại các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện đến/đi tính bằng MB (mặc định 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (mặc định `minimal`). Xem [Phản ứng](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (mặc định `own`) - thời điểm tác nhân được thông báo về phản ứng đến từ người khác.
- `channels.signal.reactionAllowlist`: những người gửi có phản ứng sẽ thông báo cho tác nhân khi `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: các điều khiển truyền phát ở chế độ khối được dùng chung giữa các kênh. Xem [Truyền phát](/vi/concepts/streaming).

Các tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ lượt đề cập gốc).
- `messages.groupChat.mentionPatterns` (giá trị dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan về các kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) - quy trình xác thực và ghép đôi tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cơ chế kiểm soát lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
