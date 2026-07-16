---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực cho QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc riêng tư qua QQ Bot
summary: Thiết lập, cấu hình và sử dụng QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-07-16T14:04:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua API QQ Bot chính thức (Gateway WebSocket).
Trò chuyện riêng C2C và lượt đề cập `@` trong nhóm là các loại trò chuyện chính, hỗ trợ nội dung đa phương tiện phong phú
(hình ảnh, giọng nói, video, tệp). Tin nhắn kênh guild chỉ hỗ trợ
văn bản và hình ảnh qua URL từ xa; nội dung tải lên dạng giọng nói, video, tệp và hình ảnh
cục bộ/Base64 không khả dụng trong các kênh guild. Phản ứng và luồng thảo luận không được
hỗ trợ ở bất kỳ đâu.

Trạng thái: plugin chính thức có thể tải xuống.

## Cài đặt

```bash
openclaw plugins install @openclaw/qqbot
```

## Thiết lập

1. Truy cập [Nền tảng mở QQ](https://q.qq.com/) và dùng QQ trên điện thoại quét mã QR để
   đăng ký / đăng nhập.
2. Nhấp vào **Create Bot** để tạo bot QQ mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

<Note>
AppSecret không được lưu dưới dạng văn bản thuần. Nếu rời khỏi trang mà không lưu, bạn sẽ phải tạo lại một AppSecret mới.
</Note>

4. Thêm kênh:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Khởi động lại Gateway.

Thiết lập tương tác:

```bash
openclaw channels add
```

Trình hướng dẫn cũng cung cấp tùy chọn liên kết bằng mã QR thay cho việc nhập AppID/AppSecret
thủ công: quét mã bằng ứng dụng điện thoại được liên kết với QQ Bot đích để hoàn tất
việc liên kết. OpenClaw lưu thông tin xác thực được trả về trong phạm vi cấu hình
của tài khoản.

## Cấu hình

Cấu hình tối thiểu:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Biến môi trường của tài khoản mặc định (chỉ tài khoản cấp cao nhất):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret được lưu trong tệp:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret dạng SecretRef từ môi trường:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Lưu ý:

- `openclaw channels add --channel qqbot --token-file ...` chỉ đặt AppSecret;
  `appId` phải được đặt sẵn trong cấu hình hoặc `QQBOT_APP_ID`.
- `clientSecret` chấp nhận chuỗi văn bản thuần, đường dẫn tệp (`clientSecretFile`)
  hoặc đối tượng SecretRef có cấu trúc.
- Các chuỗi đánh dấu `secretref:...` / `secretref-env:...` cũ bị từ chối đối với
  `clientSecret`; hãy dùng đối tượng SecretRef có cấu trúc thay thế.

### Truyền phát

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // truyền phát theo khối: "partial" (mặc định) hoặc "off"
        nativeTransport: true, // dùng API stream_messages C2C chính thức của QQ cho tin nhắn riêng
      },
    },
  },
}
```

- `streaming.mode: "off"` vô hiệu hóa truyền phát theo khối cho tài khoản.
- `streaming.nativeTransport: true` truyền phát câu trả lời C2C (tin nhắn riêng) qua
  API `stream_messages` chính thức của QQ; các đích nhóm/kênh không bị ảnh hưởng.
- Các giá trị vô hướng `streaming: true|false` cũ và khóa `streaming.c2cStreamApi`
  được di chuyển sang cấu trúc này thông qua `openclaw doctor --fix`.
- `/bot-streaming on|off` chuyển đổi cùng cấu hình này từ một tin nhắn riêng.

### Chính sách truy cập

- `allowFrom` / `groupAllowFrom` kiểm soát ai có thể trò chuyện với bot trong ngữ cảnh C2C /
  nhóm. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  kiểm soát chế độ thực thi. `dmPolicy` mặc định là `allowlist` khi
  `allowFrom` có một mục cụ thể (không phải ký tự đại diện), nếu không thì là `open`.
  `groupPolicy` mặc định là `allowlist` khi `groupAllowFrom` hoặc
  `allowFrom` có một mục cụ thể, nếu không thì là `open`.
- Các lệnh gạch chéo "Xác thực: danh sách cho phép" yêu cầu một mục không phải ký tự đại diện được chỉ định rõ trong
  `allowFrom` (hoặc `groupAllowFrom` đối với lời gọi từ nhóm), bất kể
  `dmPolicy` / `groupPolicy` — xem [Lệnh gạch chéo](#slash-commands).

### Thiết lập nhiều tài khoản

Chạy nhiều bot QQ trong một phiên bản OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Mỗi tài khoản sở hữu một kết nối WebSocket, máy khách API và bộ nhớ đệm token
biệt lập, được định danh bằng `appId`. Các dòng nhật ký được gắn mã định danh tài khoản sở hữu để
dữ liệu chẩn đoán luôn có thể tách biệt khi chạy nhiều bot trong một Gateway.

Thêm bot thứ hai qua CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Trò chuyện nhóm

Tính năng hỗ trợ nhóm sử dụng OpenID nhóm QQ, không dùng tên hiển thị. Thêm bot vào một
nhóm, sau đó đề cập đến bot hoặc cấu hình nhóm để chạy mà không cần đề cập.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` đặt giá trị mặc định cho mọi nhóm; một mục `groups.GROUP_OPENID`
cụ thể sẽ ghi đè các giá trị mặc định đó cho một nhóm. Cài đặt nhóm:

| Trường                | Mặc định         | Mô tả                                                                                             |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Yêu cầu đề cập `@` trước khi bot trả lời.                                                     |
| `commandLevel`        | `all`            | Các lệnh gạch chéo tích hợp nào có thể chạy trong nhóm (xem bên dưới).                                    |
| `ignoreOtherMentions` | `false`          | Loại bỏ tin nhắn đề cập đến người khác nhưng không đề cập đến bot.                                           |
| `historyLimit`        | `50`             | Các tin nhắn gần đây không đề cập đến bot được giữ làm ngữ cảnh cho lượt có đề cập tiếp theo. `0` vô hiệu hóa lịch sử.     |
| `tools`               | —                | Cho phép/từ chối công cụ cho toàn bộ nhóm.                                                              |
| `toolsBySender`       | —                | Ghi đè công cụ theo từng người gửi; xem [Nhóm](/vi/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | tiền tố openid    | Nhãn thân thiện được dùng trong nhật ký và ngữ cảnh nhóm.                                                     |
| `prompt`              | mặc định tích hợp | Lời nhắc hành vi theo nhóm được nối thêm vào ngữ cảnh tác tử.                                           |

`commandLevel` chấp nhận:

| Cấp độ   | Hành vi                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Các lệnh tích hợp hiện có vẫn khả dụng. Một số lệnh vẫn bị ẩn khỏi menu nhưng người dùng được ủy quyền vẫn có thể chạy chúng trong nhóm.                  |
| `safety` | `/help`, `/btw`, `/stop` vẫn hiển thị trong nhóm; các lệnh nhạy cảm (`/config`, `/tools`, `/bash`, v.v.) phải được chạy trong trò chuyện riêng.      |
| `strict` | Chỉ cho phép các điều khiển phiên nhóm cần thiết cho chế độ vận hành nghiêm ngặt. `/stop` vẫn hoạt động để người gửi được ủy quyền có thể ngắt một lượt chạy đang hoạt động. |

Các mục QQBot `toolPolicy` cũ đã ngừng sử dụng. Chạy `openclaw doctor --fix` để di chuyển chúng sang `tools`.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ tới
`mention`; `requireMention: false` ánh xạ tới `always`. Nếu có, giá trị ghi đè kích hoạt
ở cấp phiên sẽ được ưu tiên hơn cấu hình.

Hàng đợi đầu vào được phân chia theo từng đối tác. Đối tác nhóm có giới hạn hàng đợi lớn hơn (50 so với 20
đối với đối tác trực tiếp), loại bỏ tin nhắn do bot tạo trước tin nhắn của con người khi đầy,
và hợp nhất các đợt tin nhắn nhóm thông thường thành một lượt có ghi nguồn gửi. Các lệnh gạch chéo
chạy lần lượt, độc lập với mọi lô hợp nhất.

### Giọng nói (STT / TTS)

STT và TTS hỗ trợ cấu hình hai cấp với cơ chế dự phòng theo mức ưu tiên:

| Cài đặt | Dành riêng cho Plugin                                    | Dự phòng của framework         |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Đặt `enabled: false` cho một trong hai để vô hiệu hóa. Giá trị ghi đè TTS ở cấp tài khoản sử dụng
cùng cấu trúc với `messages.tts` và được hợp nhất sâu lên cấu hình TTS của kênh/toàn cục.

Yêu cầu STT mặc định hết thời gian chờ sau 60 giây. STT dành riêng cho Plugin sử dụng
giá trị ghi đè `models.providers.<id>.timeoutSeconds` đã chọn. STT âm thanh của framework
sử dụng `tools.media.audio.models[0].timeoutSeconds`, sau đó
`tools.media.audio.timeoutSeconds`, rồi đến giá trị ghi đè của nhà cung cấp đã chọn.

Tệp đính kèm giọng nói QQ đầu vào được cung cấp cho tác tử dưới dạng siêu dữ liệu phương tiện âm thanh,
đồng thời giữ các tệp giọng nói thô ngoài `MediaPaths` dùng chung. `[[audio_as_voice]]`
trong câu trả lời văn bản thuần sẽ tổng hợp TTS và gửi tin nhắn giọng nói QQ gốc khi
TTS đã được cấu hình.

Hành vi tải lên/chuyển mã âm thanh đầu ra cũng có thể được tinh chỉnh bằng
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                  | Mô tả                 |
| -------------------------- | --------------------- |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm        |
| `qqbot:channel:CHANNEL_ID` | Kênh guild             |

<Note>
Mỗi bot có tập hợp OpenID người dùng riêng. OpenID nhận được bởi Bot A **không thể** được dùng để gửi tin nhắn qua Bot B.
</Note>

## Lệnh gạch chéo

Các lệnh tích hợp được chặn trước hàng đợi AI:

| Lệnh                 | Xác thực  | Phạm vi      | Mô tả                                                                           |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------- |
| `/bot-ping`          | —         | bất kỳ       | Kiểm tra độ trễ                                                                 |
| `/bot-help`          | —         | bất kỳ       | Liệt kê tất cả lệnh                                                             |
| `/bot-me`            | —         | chỉ riêng tư | Hiển thị ID người dùng QQ (openid) của người gửi để thiết lập `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | chỉ riêng tư | Hiển thị phiên bản framework OpenClaw và phiên bản plugin                       |
| `/bot-upgrade`       | —         | chỉ riêng tư | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                      |
| `/bot-approve`       | danh sách cho phép | chỉ riêng tư | Quản lý cấu hình phê duyệt thực thi lệnh (bật / tắt / luôn luôn / đặt lại / trạng thái) |
| `/bot-logs`          | danh sách cho phép | chỉ riêng tư | Xuất nhật ký Gateway gần đây thành tệp                                          |
| `/bot-clear-storage` | danh sách cho phép | chỉ riêng tư | Xóa các tệp tải xuống đã lưu vào bộ nhớ đệm trong thư mục phương tiện QQBot     |
| `/bot-streaming`     | danh sách cho phép | chỉ riêng tư | Bật hoặc tắt phản hồi truyền trực tuyến C2C                                     |
| `/bot-group-allways` | danh sách cho phép | chỉ riêng tư | Chuyển đổi chế độ kích hoạt nhóm mặc định (yêu cầu đề cập hoặc luôn bật)         |

Nối `?` vào bất kỳ lệnh nào để xem trợ giúp sử dụng (ví dụ: `/bot-upgrade ?`).

Các lệnh có "Xác thực: danh sách cho phép" còn yêu cầu openid của người gửi nằm trong
danh sách `allowFrom` tường minh, không chứa ký tự đại diện (`groupAllowFrom` được ưu tiên cho
các lệnh được gửi từ nhóm, nếu không có thì dùng `allowFrom`). Ký tự đại diện
`allowFrom: ["*"]` cho phép trò chuyện nhưng không cho phép các lệnh này. Khi chạy một trong các lệnh đó
ngoài cuộc trò chuyện riêng tư hoặc khi chưa được cấp quyền, hệ thống sẽ trả về gợi ý thay vì
âm thầm bỏ qua tin nhắn.

`/bot-me`, `/bot-version` và `/bot-upgrade` chỉ dùng trong trò chuyện riêng tư nhưng không
yêu cầu danh sách cho phép — bất kỳ người gửi C2C nào cũng có thể chạy chúng.

Khi phê duyệt thực thi của QQ Bot sử dụng cơ chế dự phòng mặc định trong cùng cuộc trò chuyện, thao tác nhấp vào
nút phê duyệt gốc tuân theo cùng danh sách lệnh cho phép tường minh, không chứa ký tự đại diện. Để
chỉ cấp quyền phê duyệt mà không cấp quyền truy cập lệnh rộng hơn, hãy cấu hình
`channels.qqbot.execApprovals.approvers`. Phê duyệt thực thi gốc được bật theo
mặc định.

## Phương tiện và lưu trữ

- Phương tiện đầu vào, đầu ra và cầu nối Gateway dùng chung một thư mục gốc tải trọng tại
  `~/.openclaw/media/qqbot` (tuân theo `OPENCLAW_HOME` khi được thiết lập), nhờ đó nội dung tải lên,
  tải xuống và bộ nhớ đệm chuyển mã đều nằm trong một thư mục được bảo vệ.
- Việc phân phối đa phương tiện cho các đích C2C và nhóm đi qua một đường dẫn `sendMedia`
  duy nhất. Các tệp cục bộ và bộ đệm trong bộ nhớ có kích thước từ 5&nbsp;MiB trở lên sử dụng các
  điểm cuối tải lên theo từng phần của QQ; tải trọng nhỏ hơn và nguồn URL từ xa/Base64 sử dụng
  API tải lên một lần.
- Nếu nâng cấp nóng làm gián đoạn Gateway trước khi ghi xong
  `openclaw.json`, plugin sẽ khôi phục `appId` / `clientSecret` đã biết gần nhất
  cho tài khoản đó từ ảnh chụp nhanh nội bộ vào lần khởi động tiếp theo (không bao giờ
  ghi đè một thay đổi cấu hình có chủ ý), vì vậy không cần quét lại mã QR.

## Khắc phục sự cố

- **Gateway không khởi động / không có tin nhắn đầu vào:** hãy xác minh `appId` và
  `clientSecret` là chính xác và bot đã được bật trên QQ Open Platform.
  Khi thiếu thông tin xác thực, thông báo "QQBot chưa được cấu hình (thiếu appId hoặc
  clientSecret)" sẽ xuất hiện.
- **Thiết lập bằng `--token-file` vẫn hiển thị chưa được cấu hình:** `--token-file` chỉ
  thiết lập AppSecret. `appId` vẫn phải được thiết lập trong cấu hình hoặc `QQBOT_APP_ID`.
- **Các phản hồi nhóm dồn dập xung đột:** khi hàng đợi của một đối tượng ngang hàng bị đầy, hàng đợi đầu vào sẽ loại bỏ
  các tin nhắn do bot tạo trước tin nhắn của con người, đồng thời gộp
  các đợt tin nhắn nhóm thông thường (không phải lệnh) thành một lượt có ghi rõ nguồn gửi, nhờ đó
  lượng lớn nội dung trò chuyện của bot sẽ không làm các tin nhắn của con người bị thiếu tài nguyên xử lý.
- **Tin nhắn chủ động không đến:** QQ có thể chặn các tin nhắn do bot khởi tạo nếu
  người dùng không tương tác gần đây.
- **Giọng nói không được chuyển thành văn bản:** hãy đảm bảo STT đã được cấu hình và có thể
  kết nối với nhà cung cấp.

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
