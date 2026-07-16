---
read_when:
    - Thiết lập hỗ trợ Signal
    - Gỡ lỗi gửi/nhận Signal
summary: Hỗ trợ Signal qua signal-cli (daemon gốc hoặc container bbernhard), các quy trình thiết lập và mô hình số điện thoại
title: Signal
x-i18n:
    generated_at: "2026-07-16T14:53:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal là một plugin kênh có thể tải xuống (`@openclaw/signal`). Gateway giao tiếp với `signal-cli` qua HTTP: dùng daemon gốc (JSON-RPC + SSE) hoặc container [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw không nhúng libsignal.

## Mô hình số điện thoại (hãy đọc phần này trước)

- Gateway kết nối với một **thiết bị Signal**: tài khoản `signal-cli`.
- Chạy bot trên **tài khoản Signal cá nhân của bạn** khiến bot bỏ qua tin nhắn của chính bạn (bảo vệ khỏi vòng lặp).
- Để "tôi nhắn tin cho bot và bot trả lời", hãy dùng một **số điện thoại riêng cho bot**.

## Cài đặt

```bash
openclaw plugins install @openclaw/signal
```

Thông số plugin không chỉ rõ nguồn sẽ thử ClawHub trước, sau đó dự phòng sang npm. Buộc dùng một nguồn bằng `openclaw plugins install clawhub:@openclaw/signal` hoặc `npm:@openclaw/signal`. `plugins install` đăng ký và bật plugin; không cần bước `enable` riêng. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt chung.

## Thiết lập nhanh

<Steps>
  <Step title="Chọn một số điện thoại">
    Dùng một **số Signal riêng** cho bot (khuyến nghị).
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
    Trình hướng dẫn phát hiện xem `signal-cli` có trong `PATH` hay không và nếu thiếu sẽ đề nghị cài đặt: tải bản dựng GraalVM gốc chính thức trên Linux x86-64 hoặc cài đặt qua Homebrew trên macOS và các kiến trúc khác. Sau đó, trình hướng dẫn yêu cầu số điện thoại của bot và đường dẫn `signal-cli`.

    Đối với thiết lập không tương tác, `openclaw channels add --channel signal` cũng chấp nhận `--signal-number <e164>` cho số điện thoại của bot, cùng với `--http-host <host>` và `--http-port <port>` cho điểm cuối daemon Signal (mặc định là `127.0.0.1:8080`).

  </Step>
  <Step title="Liên kết hoặc đăng ký tài khoản">
    - **Liên kết bằng mã QR (nhanh nhất):** `signal-cli link -n "OpenClaw"`, sau đó quét bằng Signal. Xem [Phương án A](#setup-path-a-link-existing-signal-account-qr).
    - **Đăng ký bằng SMS:** dùng số riêng với captcha + xác minh qua SMS. Xem [Phương án B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Xác minh và ghép nối">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Gửi tin nhắn trực tiếp đầu tiên và phê duyệt ghép nối: `openclaw pairing approve signal <CODE>`.
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

| Trường       | Mô tả                                              |
| ------------ | ------------------------------------------------- |
| `account`    | Số điện thoại của bot ở định dạng E.164 (`+15551234567`) |
| `cliPath`    | Đường dẫn đến `signal-cli` (`signal-cli` nếu có trong `PATH`)  |
| `configPath` | Thư mục cấu hình signal-cli được truyền dưới dạng `--config`        |
| `dmPolicy`   | Chính sách truy cập tin nhắn trực tiếp (khuyến nghị `pairing`)          |
| `allowFrom`  | Các số điện thoại hoặc giá trị `uuid:<id>` được phép gửi tin nhắn trực tiếp |

Hỗ trợ nhiều tài khoản: dùng `channels.signal.accounts` với cấu hình riêng cho từng tài khoản và `name` tùy chọn. Xem [Các kênh đa tài khoản](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu dùng chung.

## Cách hoạt động

- Định tuyến xác định: câu trả lời luôn được gửi trở lại Signal.
- Tin nhắn trực tiếp dùng chung phiên chính của tác tử; các nhóm được tách biệt (`agent:<agentId>:signal:group:<groupId>`).
- Theo mặc định, Signal có thể ghi các bản cập nhật cấu hình do `/config set|unset` kích hoạt (yêu cầu `commands.config: true`). Tắt bằng `channels.signal.configWrites: false`.

## Phương án thiết lập A: liên kết tài khoản Signal hiện có (QR)

1. Cài đặt `signal-cli` (bản dựng JVM hoặc bản dựng gốc), hoặc để `openclaw channels add` cài đặt giúp bạn.
2. Liên kết tài khoản bot: `signal-cli link -n "OpenClaw"`, sau đó quét mã QR trong Signal.
3. Cấu hình Signal và khởi động Gateway.

## Phương án thiết lập B: đăng ký số riêng cho bot (SMS, Linux)

Dùng phương án này cho số riêng của bot thay vì liên kết một tài khoản ứng dụng Signal hiện có. Quy trình dưới đây đã được kiểm thử trên Ubuntu 24.

1. Chuẩn bị một số điện thoại có thể nhận SMS (hoặc xác minh bằng cuộc gọi đối với điện thoại cố định). Số riêng cho bot giúp tránh xung đột tài khoản/phiên.
2. Cài đặt `signal-cli` trên máy chủ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu dùng bản dựng JVM (`signal-cli-${VERSION}.tar.gz`), trước tiên hãy cài đặt JRE. Luôn cập nhật `signal-cli`; tài liệu thượng nguồn lưu ý rằng các bản phát hành cũ có thể ngừng hoạt động khi API máy chủ Signal thay đổi.

3. Đăng ký và xác minh số điện thoại:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu captcha là bắt buộc (cần truy cập trình duyệt để hoàn tất bước này):

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn tất captcha, sao chép đích liên kết `signalcaptcha://...` từ "Open Signal".
3. Khi có thể, hãy chạy từ cùng địa chỉ IP bên ngoài với phiên trình duyệt (token captcha hết hạn nhanh).
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

5. Ghép nối người gửi tin nhắn trực tiếp:
   - Gửi bất kỳ tin nhắn nào đến số điện thoại của bot.
   - Phê duyệt trên máy chủ: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số điện thoại của bot vào danh bạ trên điện thoại để tránh "Unknown contact".

<Warning>
Việc đăng ký tài khoản số điện thoại bằng `signal-cli` có thể hủy xác thực phiên ứng dụng Signal chính của số đó. Nên dùng một số riêng cho bot hoặc dùng chế độ liên kết bằng mã QR để giữ nguyên thiết lập ứng dụng hiện có trên điện thoại.
</Warning>

Tài liệu tham khảo thượng nguồn:

- README của `signal-cli`: `https://github.com/AsamK/signal-cli`
- Quy trình captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Quy trình liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Để tự quản lý `signal-cli` (JVM khởi động nguội chậm, khởi tạo container, CPU dùng chung), hãy chạy daemon riêng và trỏ OpenClaw đến daemon đó:

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

Cách này bỏ qua việc tự động khởi chạy và thời gian chờ khởi động của OpenClaw. Đối với quá trình khởi động tự động chậm, hãy đặt `channels.signal.startupTimeoutMs`.

## Chế độ container (bbernhard/signal-cli-rest-api)

Thay vì chạy `signal-cli` trực tiếp, hãy dùng container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), vốn bọc `signal-cli` phía sau giao diện REST + WebSocket.

Yêu cầu:

- Container **phải** chạy với `MODE=json-rpc` để nhận tin nhắn theo thời gian thực.
- Đăng ký hoặc liên kết tài khoản Signal bên trong container trước khi kết nối OpenClaw.

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

| Giá trị       | Hành vi                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Mặc định) Thăm dò cả hai phương thức truyền tải; phát trực tuyến xác thực việc nhận qua WebSocket của container    |
| `"native"`    | Buộc dùng signal-cli gốc (JSON-RPC tại `/api/v1/rpc`, SSE tại `/api/v1/events`)         |
| `"container"` | Buộc dùng container bbernhard (REST tại `/v2/send`, WebSocket tại `/v1/receive/{account}`) |

Khi `apiMode` là `"auto"`, OpenClaw lưu chế độ đã phát hiện vào bộ nhớ đệm trong 30 giây cho mỗi URL daemon để tránh thăm dò lặp lại (chế độ gốc được ưu tiên khi cả hai phương thức truyền tải đều hoạt động tốt). Việc nhận qua container chỉ được chọn để phát trực tuyến sau khi `/v1/receive/{account}` nâng cấp lên WebSocket, vốn yêu cầu `MODE=json-rpc`.

Chế độ container hỗ trợ các thao tác Signal tương tự chế độ gốc khi container cung cấp các API tương ứng: gửi, nhận, tệp đính kèm, chỉ báo đang nhập, biên nhận đã đọc/đã xem, phản ứng, nhóm và văn bản có định dạng. OpenClaw chuyển đổi các lệnh gọi RPC Signal gốc thành tải trọng REST của container, bao gồm ID nhóm `group.{base64(internal_id)}` và `text_mode: "styled"` cho văn bản có định dạng.

Lưu ý vận hành:

- Dùng `autoStart: false` với chế độ container; OpenClaw không được khởi chạy daemon gốc khi chọn `apiMode: "container"`.
- Dùng `MODE=json-rpc` để nhận. `MODE=normal` có thể khiến `/v1/about` có vẻ hoạt động tốt, nhưng `/v1/receive/{account}` sẽ không nâng cấp lên WebSocket, vì vậy OpenClaw sẽ không chọn luồng nhận qua container trong chế độ `auto`.
- Đặt `apiMode: "container"` khi `httpUrl` trỏ đến API REST bbernhard, `"native"` khi trỏ đến JSON-RPC/SSE của `signal-cli` gốc và `"auto"` khi cách triển khai có thể thay đổi.
- Việc tải tệp đính kèm trong chế độ container tuân theo cùng giới hạn byte phương tiện như chế độ gốc. Các phản hồi quá lớn bị từ chối trước khi được lưu đầy đủ vào bộ đệm khi máy chủ gửi `Content-Length`, và trong khi phát trực tuyến ở các trường hợp khác.

## Kiểm soát truy cập (tin nhắn trực tiếp + nhóm)

Tin nhắn trực tiếp:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận được mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua `openclaw pairing list signal` và `openclaw pairing approve signal <CODE>`.
- Ghép nối là cơ chế trao đổi token mặc định cho tin nhắn trực tiếp trên Signal. Chi tiết: [Ghép nối](/vi/channels/pairing)
- Người gửi chỉ có UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát những nhóm hoặc người gửi nào có thể kích hoạt phản hồi nhóm khi đặt `allowlist`; các mục có thể là ID nhóm Signal (thô, `group:<id>` hoặc `signal:group:<id>`), số điện thoại người gửi, giá trị `uuid:<id>` hoặc `*`.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm bằng `requireMention`, `tools` và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` để ghi đè theo từng tài khoản trong thiết lập đa tài khoản.
- Việc đưa một nhóm Signal vào danh sách cho phép thông qua `groupAllowFrom` không tự động tắt yêu cầu đề cập. Một mục `channels.signal.groups["<group-id>"]` được cấu hình cụ thể sẽ xử lý mọi tin nhắn nhóm trừ khi đặt `requireMention=true`.
- Với `requireMention=true`, các lượt @đề cập gốc của Signal được đối chiếu từ siêu dữ liệu đề cập có cấu trúc với số điện thoại hoặc `accountUuid` của tài khoản bot. Các `mentionPatterns` đã cấu hình vẫn là phương án dự phòng bằng văn bản thuần túy.
- Lưu ý về thời gian chạy: nếu hoàn toàn thiếu `channels.signal`, thời gian chạy sẽ dự phòng sang `groupPolicy="allowlist"` để kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

Nhóm yêu cầu đề cập với ngữ cảnh giới hạn:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Các tin nhắn nhóm được phép nhưng không đề cập đến bot sẽ không nhận được phản hồi và chỉ được giữ trong cửa sổ lịch sử chờ có giới hạn. Khi một lượt @mention gốc sau đó hoặc lượt đề cập bằng văn bản dự phòng kích hoạt bot, OpenClaw sẽ đưa ngữ cảnh gần đây đó vào và trả lời cùng nhóm. Nội dung tệp đính kèm bị bỏ qua sẽ không được tải xuống; chúng chỉ có thể xuất hiện dưới dạng phần giữ chỗ phương tiện nhỏ gọn trong ngữ cảnh chờ.

## Cách hoạt động (hành vi)

- Chế độ gốc: `signal-cli` chạy dưới dạng daemon; Gateway đọc các sự kiện qua SSE.
- Chế độ bộ chứa: Gateway gửi qua REST API và nhận qua WebSocket.
- Các tin nhắn đến được chuẩn hóa thành phong bì kênh dùng chung.
- Các câu trả lời luôn được định tuyến trở lại cùng số hoặc nhóm.
- Các câu trả lời cho tin nhắn đến bao gồm siêu dữ liệu trích dẫn gốc của Signal khi backend chấp nhận dấu thời gian và tác giả của tin nhắn đến; nếu siêu dữ liệu trích dẫn bị thiếu hoặc bị từ chối, OpenClaw sẽ gửi câu trả lời dưới dạng tin nhắn thông thường.
- Cấu hình việc sử dụng trích dẫn gốc bằng `channels.signal.replyToMode = off | first | all | batched`, hoặc `channels.signal.replyToModeByChatType.direct/group` để ghi đè theo từng loại cuộc trò chuyện. Các giá trị cấp tài khoản trong `channels.signal.accounts.<id>` được ưu tiên.

## Phương tiện + giới hạn

- Văn bản gửi đi được chia thành các đoạn theo `channels.signal.textChunkLimit` (mặc định 4000).
- Tùy chọn chia đoạn theo dòng mới: đặt `channels.signal.streaming.chunkMode="newline"` để chia tại các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- Tệp đính kèm được hỗ trợ (base64 được truy xuất từ `signal-cli`).
- Tệp đính kèm ghi chú thoại sử dụng tên tệp `signal-cli` làm MIME dự phòng khi thiếu `contentType`, để tính năng phiên âm âm thanh vẫn có thể phân loại các bản ghi nhớ thoại AAC.
- Giới hạn phương tiện mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua việc tải phương tiện xuống.
- Ngữ cảnh lịch sử nhóm sử dụng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), với phương án dự phòng là `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Chỉ báo đang nhập + xác nhận đã đọc

- **Chỉ báo đang nhập**: OpenClaw gửi tín hiệu đang nhập qua `signal-cli sendTyping` và làm mới chúng trong khi câu trả lời đang được xử lý.
- **Xác nhận đã đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp xác nhận đã đọc cho các tin nhắn trực tiếp được phép.
- `signal-cli` không cung cấp xác nhận đã đọc cho các nhóm.

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để Signal hiển thị vòng đời phản ứng dùng chung gồm đã xếp hàng/đang suy nghĩ/công cụ/Compaction/hoàn tất/lỗi trên các lượt đến. Signal sử dụng dấu thời gian của tin nhắn đến làm mục tiêu phản ứng; phản ứng nhóm được gửi với ID nhóm Signal cùng người gửi ban đầu làm tác giả mục tiêu.

Phản ứng trạng thái cũng yêu cầu một phản ứng xác nhận và `messages.ackReactionScope` tương ứng (`direct`, `group-all`, `group-mentions`, hoặc `all`). Đặt `channels.signal.reactionLevel: "off"` để tắt phản ứng trạng thái Signal.

`messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau thời gian giữ đã cấu hình. Nếu không, Signal sẽ khôi phục phản ứng xác nhận ban đầu sau trạng thái hoàn tất/lỗi cuối cùng.

## Phản ứng (công cụ tin nhắn)

Dùng `message action=react` với `channel=signal`.

- Mục tiêu: E.164 hoặc UUID của người gửi (dùng `uuid:<id>` từ đầu ra ghép nối; UUID trần cũng hoạt động).
- `messageId` là dấu thời gian Signal của tin nhắn mà bạn đang thả phản ứng.
- Phản ứng nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt thao tác phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (mặc định `minimal`).
  - `off`/`ack` tắt phản ứng của tác nhân (công cụ tin nhắn `react` báo lỗi).
  - `minimal`/`extensive` bật phản ứng của tác nhân và đặt mức hướng dẫn.
- Ghi đè theo từng tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Phản ứng phê duyệt

Các lời nhắc phê duyệt exec và Plugin của Signal sử dụng các khối định tuyến cấp cao nhất `approvals.exec` và `approvals.plugin`. Signal không có khối `channels.signal.execApprovals`.

- `👍` phê duyệt một lần.
- `👎` từ chối.
- Dùng `/approve <id> allow-always` khi một yêu cầu cung cấp tùy chọn phê duyệt lâu dài.

Việc phân giải phản ứng phê duyệt yêu cầu người phê duyệt Signal được chỉ định rõ ràng trong `channels.signal.allowFrom`, `channels.signal.defaultTo`, hoặc các trường cấp tài khoản tương ứng. Lời nhắc phê duyệt exec trực tiếp trong cùng cuộc trò chuyện vẫn có thể ẩn phương án dự phòng `/approve` cục bộ trùng lặp mà không cần người phê duyệt rõ ràng; phê duyệt nhóm không có người phê duyệt vẫn giữ phương án dự phòng cục bộ hiển thị.

## Mục tiêu gửi (CLI/cron)

- Tin nhắn trực tiếp: `signal:+15551234567` (hoặc E.164 thuần).
- Tin nhắn trực tiếp qua UUID: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu tài khoản Signal của bạn hỗ trợ).

## Bí danh

Cấu hình bí danh để có tên ổn định cho các mục tiêu Signal thường xuyên sử dụng. Bí danh chỉ là cấu hình phía OpenClaw; chúng không tạo hoặc chỉnh sửa danh bạ Signal.

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

Dùng bí danh ở bất kỳ đâu chấp nhận mục tiêu gửi Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Triển khai đã hoàn tất"
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

`openclaw directory peers list --channel signal` và `openclaw directory groups list --channel signal` liệt kê các bí danh đã cấu hình. Thư mục Signal dựa trên cấu hình; nó không truy vấn trực tiếp danh bạ Signal hoặc sửa đổi tài khoản Signal.

## Khắc phục sự cố

Trước tiên, hãy chạy chuỗi kiểm tra này:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó xác nhận trạng thái ghép nối tin nhắn trực tiếp nếu cần:

```bash
openclaw pairing list signal
```

Các lỗi thường gặp:

- Có thể kết nối daemon nhưng không có câu trả lời: xác minh cài đặt tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- Tin nhắn trực tiếp bị bỏ qua: người gửi đang chờ phê duyệt ghép nối.
- Tin nhắn nhóm bị bỏ qua: cơ chế kiểm soát người gửi/lượt đề cập của nhóm chặn việc gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal không xuất hiện trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra bổ sung:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Để xem quy trình phân loại sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc xây dựng lại máy chủ.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn muốn mở rộng quyền truy cập tin nhắn trực tiếp một cách rõ ràng.
- Xác minh SMS chỉ cần thiết cho quy trình đăng ký hoặc khôi phục, nhưng việc mất quyền kiểm soát số/tài khoản có thể làm phức tạp quá trình đăng ký lại.

## Tham chiếu cấu hình (Signal)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.apiMode`: `auto | native | container` (mặc định: tự động). Xem [Chế độ bộ chứa](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.accountUuid`: UUID tài khoản bot tùy chọn để phát hiện @mention gốc và bảo vệ khỏi vòng lặp.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.configPath`: thư mục `signal-cli --config` tùy chọn.
- `channels.signal.httpUrl`: URL daemon đầy đủ (ghi đè máy chủ/cổng).
- `channels.signal.httpHost`, `channels.signal.httpPort`: địa chỉ liên kết daemon (mặc định `127.0.0.1:8080`).
- `channels.signal.autoStart`: tự động khởi chạy daemon (mặc định true nếu chưa đặt `httpUrl`).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (tối thiểu 1000, tối đa 120000; mặc định 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua việc tải tệp đính kèm xuống.
- `channels.signal.ignoreStories`: bỏ qua tin từ daemon.
- `channels.signal.sendReadReceipts`: chuyển tiếp xác nhận đã đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: ghép nối).
- `channels.signal.allowFrom`: danh sách cho phép tin nhắn trực tiếp (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; hãy dùng ID điện thoại/UUID.
- `channels.signal.aliases`: bí danh phía OpenClaw cho mục tiêu gửi tin nhắn trực tiếp hoặc nhóm.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: danh sách cho phép).
- `channels.signal.groupAllowFrom`: danh sách cho phép nhóm; chấp nhận ID nhóm Signal (dạng thô, `group:<id>`, hoặc `signal:group:<id>`), số E.164 của người gửi, hoặc các giá trị `uuid:<id>`.
- `channels.signal.groups`: ghi đè theo từng nhóm với khóa là ID nhóm Signal (hoặc `"*"`). Các trường được hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản theo từng tài khoản của `channels.signal.groups` dành cho thiết lập nhiều tài khoản.
- `channels.signal.accounts.<id>.aliases`: bí danh theo từng tài khoản, được hợp nhất với các bí danh cấp cao nhất.
- `channels.signal.replyToMode`: chế độ trích dẫn câu trả lời gốc, `off | first | all | batched` (mặc định: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: ghi đè trích dẫn câu trả lời gốc theo từng loại cuộc trò chuyện.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: ghi đè trích dẫn câu trả lời theo từng tài khoản.
- `channels.signal.historyLimit`: số tin nhắn nhóm tối đa được đưa vào làm ngữ cảnh (0 để tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp tính theo lượt người dùng. Ghi đè theo từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự (mặc định 4000).
- `channels.signal.streaming.chunkMode`: `length` (mặc định) hoặc `newline` để chia tại các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn phương tiện đến/đi tính bằng MB (mặc định 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (mặc định `minimal`). Xem [Phản ứng](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (mặc định `own`) - thời điểm tác nhân được thông báo về phản ứng đến từ người khác.
- `channels.signal.reactionAllowlist`: những người gửi có phản ứng sẽ thông báo cho tác nhân khi `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: các điều khiển truyền phát ở chế độ khối được dùng chung giữa các kênh. Xem [Truyền phát](/vi/concepts/streaming).

Các tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (phương án dự phòng dạng văn bản thuần; các lượt @đề cập gốc của Signal được phát hiện từ siêu dữ liệu có cấu trúc khi danh tính tài khoản bot được cấu hình).
- `messages.groupChat.mentionPatterns` (phương án dự phòng toàn cục).
- `messages.responsePrefix`.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cơ chế kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
