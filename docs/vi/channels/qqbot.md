---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực cho QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc trò chuyện riêng tư với QQ Bot
summary: Thiết lập, cấu hình và sử dụng QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-07-19T05:37:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bc41f915707f1367e69eaae86ade03c742fbc8fdf6855d2b6094ce05009a903
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua API QQ Bot chính thức (Gateway WebSocket).
Trò chuyện riêng C2C và lượt nhắc `@` trong nhóm là các loại trò chuyện chính, hỗ trợ đa phương tiện phong phú
(hình ảnh, giọng nói, video, tệp). Tin nhắn kênh guild được hỗ trợ
chỉ với văn bản và hình ảnh qua URL từ xa; nội dung tải lên dạng giọng nói, video, tệp và hình ảnh
cục bộ/Base64 không khả dụng trong các kênh guild. Phản ứng và luồng thảo luận không
được hỗ trợ ở bất kỳ đâu.

Trạng thái: plugin chính thức có thể tải xuống.

## Cài đặt

```bash
openclaw plugins install @openclaw/qqbot
```

## Thiết lập

1. Truy cập [Nền tảng mở QQ](https://q.qq.com/) và quét mã QR bằng QQ trên
   điện thoại để đăng ký / đăng nhập.
2. Nhấp vào **Create Bot** để tạo một bot QQ mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

<Note>
AppSecret không được lưu dưới dạng văn bản thuần. Nếu rời khỏi trang mà không lưu, bạn sẽ phải tạo lại một AppSecret mới.
</Note>

4. Thêm kênh:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Khởi động lại Gateway.

## Độ bền dữ liệu đầu vào

Đối với các sự kiện lượt từ Gateway QQ, OpenClaw lưu trữ sự kiện thô trước khi cập nhật trình tự tiếp tục đã lưu của Gateway. Các lượt đang chờ hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại, tiếp tục được xử lý tuần tự theo từng cuộc trò chuyện và sử dụng ID sự kiện của nhà cung cấp để ngăn các mục trùng lặp trong hàng đợi khi bản ghi hoàn tất đang hoạt động hoặc được lưu giữ vẫn còn tồn tại.

Nếu quá trình tiếp nhận bền vững thất bại, OpenClaw chấm dứt socket Gateway hiện tại mà không cập nhật trình tự. Sau đó, đường dẫn kết nối lại/tiếp tục có thể yêu cầu lại sự kiện chưa được xác nhận. Việc phân phối vẫn bảo đảm ít nhất một lần qua ranh giới từ hàng đợi đến agent, vì vậy sự cố trong quá trình bàn giao có thể phát lại một lượt.

Thiết lập tương tác:

```bash
openclaw channels add
```

Trình hướng dẫn cũng cung cấp liên kết bằng mã QR như một phương án thay thế cho việc nhập AppID/AppSecret
theo cách thủ công: quét mã bằng ứng dụng điện thoại được liên kết với QQ Bot đích để hoàn tất
liên kết. OpenClaw lưu trữ thông tin xác thực được trả về trong phạm vi cấu hình
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

AppSecret dựa trên tệp:

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

AppSecret SecretRef từ biến môi trường:

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
- Các chuỗi dấu hiệu `secretref:...` / `secretref-env:...` cũ bị từ chối đối với
  `clientSecret`; hãy sử dụng đối tượng SecretRef có cấu trúc thay thế.

### Truyền trực tiếp

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // truyền theo khối: "partial" (mặc định) hoặc "off"
        nativeTransport: true, // sử dụng API stream_messages C2C chính thức của QQ cho tin nhắn trực tiếp
      },
    },
  },
}
```

- `streaming.mode: "off"` vô hiệu hóa truyền theo khối cho tài khoản.
- `streaming.nativeTransport: true` truyền trực tiếp câu trả lời C2C (tin nhắn trực tiếp) qua API
  `stream_messages` chính thức của QQ; các đích nhóm/kênh không bị ảnh hưởng.
- Các giá trị vô hướng `streaming: true|false` cũ và khóa `streaming.c2cStreamApi`
  được di chuyển sang cấu trúc này qua `openclaw doctor --fix`.
- `/bot-streaming on|off` chuyển đổi cùng cấu hình đó từ một tin nhắn trực tiếp.

### Chính sách truy cập

- `allowFrom` / `groupAllowFrom` kiểm soát ai có thể trò chuyện với bot trong ngữ cảnh C2C /
  nhóm. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  kiểm soát chế độ thực thi. `dmPolicy` mặc định là `allowlist` khi
  `allowFrom` có một mục cụ thể (không phải ký tự đại diện), nếu không thì là `open`.
  `groupPolicy` mặc định là `allowlist` khi `groupAllowFrom` hoặc
  `allowFrom` có một mục cụ thể, nếu không thì là `open`.
- Các lệnh gạch chéo "Auth: allowlist" yêu cầu một mục rõ ràng không phải ký tự đại diện trong
  `allowFrom` (hoặc `groupAllowFrom` đối với lệnh gọi trong nhóm), bất kể
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

Mỗi tài khoản sở hữu một kết nối WebSocket, ứng dụng khách API và bộ nhớ đệm token
riêng biệt, được định danh bằng `appId`. Các dòng nhật ký được gắn thẻ bằng ID tài khoản sở hữu để
dữ liệu chẩn đoán vẫn có thể phân tách khi chạy nhiều bot trong một Gateway.

Thêm bot thứ hai qua CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Trò chuyện nhóm

Tính năng hỗ trợ nhóm sử dụng OpenID nhóm QQ, không phải tên hiển thị. Thêm bot vào một
nhóm, sau đó nhắc đến bot hoặc cấu hình nhóm để chạy mà không cần lượt nhắc.

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

| Trường                 | Mặc định          | Mô tả                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Yêu cầu một lượt nhắc `@` trước khi bot trả lời.                                                     |
| `commandLevel`        | `all`            | Các lệnh gạch chéo tích hợp sẵn được phép chạy trong nhóm (xem bên dưới).                                    |
| `ignoreOtherMentions` | `false`          | Loại bỏ tin nhắn nhắc đến người khác nhưng không nhắc đến bot.                                           |
| `historyLimit`        | `50`             | Các tin nhắn gần đây không có lượt nhắc được giữ làm ngữ cảnh cho lượt được nhắc tiếp theo. `0` vô hiệu hóa lịch sử.     |
| `tools`               | —                | Cho phép/từ chối công cụ cho toàn bộ nhóm.                                                              |
| `toolsBySender`       | —                | Ghi đè công cụ theo từng người gửi; xem [Nhóm](/vi/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | tiền tố openid    | Nhãn thân thiện được sử dụng trong nhật ký và ngữ cảnh nhóm.                                                     |
| `prompt`              | mặc định tích hợp sẵn | Lời nhắc hành vi theo từng nhóm được nối vào ngữ cảnh agent.                                           |

`commandLevel` chấp nhận:

| Cấp độ    | Hành vi                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Các lệnh tích hợp sẵn hiện có vẫn khả dụng. Một số lệnh vẫn bị ẩn khỏi menu nhưng người dùng được cấp quyền vẫn có thể chạy chúng trong nhóm.                  |
| `safety` | `/help`, `/btw`, `/stop` vẫn hiển thị trong nhóm; các lệnh nhạy cảm (`/config`, `/tools`, `/bash`, v.v.) phải được chạy trong cuộc trò chuyện riêng.      |
| `strict` | Chỉ cho phép các điều khiển phiên nhóm cần thiết cho hoạt động nghiêm ngặt. `/stop` vẫn hoạt động để người gửi được cấp quyền có thể ngắt một lượt chạy đang hoạt động. |

Các mục QQBot `toolPolicy` cũ đã ngừng sử dụng. Chạy `openclaw doctor --fix` để di chuyển chúng sang `tools`.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ tới
`mention`; `requireMention: false` ánh xạ tới `always`. Giá trị ghi đè kích hoạt ở cấp phiên,
nếu có, sẽ được ưu tiên hơn cấu hình.

Hàng đợi đầu vào được tạo theo từng đối tác. Đối tác nhóm có giới hạn hàng đợi lớn hơn (50 so với 20
đối với đối tác trực tiếp), loại bỏ tin nhắn do bot tạo trước tin nhắn của con người khi đầy
và hợp nhất các đợt tin nhắn nhóm thông thường thành một lượt có thông tin nguồn gửi. Các lệnh gạch
chéo chạy lần lượt, độc lập với mọi lô hợp nhất.

### Giọng nói (STT / TTS)

STT và TTS hỗ trợ cấu hình hai cấp với cơ chế dự phòng theo mức ưu tiên:

| Cài đặt | Dành riêng cho plugin                                          | Dự phòng của framework            |
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

Đặt `enabled: false` trên một trong hai để vô hiệu hóa. Các giá trị ghi đè TTS cấp tài khoản sử dụng
cùng cấu trúc với `messages.tts` và được hợp nhất sâu trên cấu hình TTS của kênh/toàn cục.

Theo mặc định, yêu cầu STT hết thời gian chờ sau 60 giây. STT dành riêng cho plugin sử dụng
giá trị ghi đè `models.providers.<id>.timeoutSeconds` đã chọn. STT âm thanh của framework
sử dụng `tools.media.audio.models[0].timeoutSeconds`, sau đó là
`tools.media.audio.timeoutSeconds`, rồi đến giá trị ghi đè của nhà cung cấp đã chọn.

Các tệp đính kèm giọng nói QQ đầu vào được cung cấp cho agent dưới dạng siêu dữ liệu phương tiện âm thanh
trong khi không đưa các tệp giọng nói thô vào `MediaPaths` dùng chung. `[[audio_as_voice]]`
trong câu trả lời văn bản thuần sẽ tổng hợp TTS và gửi tin nhắn giọng nói QQ gốc khi
TTS đã được cấu hình.

Hành vi tải lên/chuyển mã âm thanh đầu ra cũng có thể được điều chỉnh bằng
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                     | Mô tả        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm         |
| `qqbot:channel:CHANNEL_ID` | Kênh guild      |

<Note>
Mỗi bot có một tập hợp OpenID người dùng riêng. OpenID nhận được bởi Bot A **không thể** được sử dụng để gửi tin nhắn qua Bot B.
</Note>

## Lệnh gạch chéo

Các lệnh tích hợp sẵn được chặn trước hàng đợi AI:

| Lệnh                 | Xác thực  | Phạm vi      | Mô tả                                                                           |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------- |
| `/bot-ping`          | —         | bất kỳ       | Kiểm tra độ trễ                                                                 |
| `/bot-help`          | —         | bất kỳ       | Liệt kê tất cả lệnh                                                             |
| `/bot-me`            | —         | chỉ riêng tư | Hiển thị ID người dùng QQ (openid) của người gửi để thiết lập `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | chỉ riêng tư | Hiển thị phiên bản framework OpenClaw và phiên bản plugin                       |
| `/bot-upgrade`       | —         | chỉ riêng tư | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                      |
| `/bot-approve`       | danh sách cho phép | chỉ riêng tư | Quản lý cấu hình phê duyệt thực thi lệnh (bật / tắt / luôn luôn / đặt lại / trạng thái) |
| `/bot-logs`          | danh sách cho phép | chỉ riêng tư | Xuất nhật ký Gateway gần đây dưới dạng tệp                                      |
| `/bot-clear-storage` | danh sách cho phép | chỉ riêng tư | Xóa các tệp tải xuống được lưu đệm trong thư mục phương tiện QQBot              |
| `/bot-streaming`     | danh sách cho phép | chỉ riêng tư | Bật hoặc tắt phản hồi truyền phát C2C                                           |
| `/bot-group-allways` | danh sách cho phép | chỉ riêng tư | Chuyển đổi chế độ kích hoạt nhóm mặc định (bắt buộc đề cập hoặc luôn bật)        |

Nối thêm `?` vào bất kỳ lệnh nào để xem hướng dẫn sử dụng (ví dụ: `/bot-upgrade ?`).

Các lệnh có "Xác thực: danh sách cho phép" còn yêu cầu openid của người gửi nằm trong
danh sách `allowFrom` tường minh, không có ký tự đại diện (`groupAllowFrom` được ưu tiên cho
các lệnh được gửi từ nhóm, nếu không có thì dùng `allowFrom`). Ký tự đại diện
`allowFrom: ["*"]` cho phép trò chuyện nhưng không cho phép các lệnh này. Khi chạy một trong các lệnh đó
bên ngoài cuộc trò chuyện riêng tư hoặc khi chưa được cấp quyền, hệ thống sẽ trả về gợi ý thay vì
âm thầm bỏ qua tin nhắn.

`/bot-me`, `/bot-version` và `/bot-upgrade` chỉ dành cho cuộc trò chuyện riêng tư nhưng không
yêu cầu danh sách cho phép — mọi người gửi C2C đều có thể chạy chúng.

Khi tính năng phê duyệt thực thi của QQ Bot sử dụng phương án dự phòng mặc định trong cùng cuộc trò chuyện, thao tác nhấp
nút phê duyệt gốc tuân theo cùng danh sách lệnh cho phép tường minh, không có ký tự đại diện. Để
chỉ cấp quyền phê duyệt mà không cấp quyền truy cập lệnh rộng hơn, hãy cấu hình
`channels.qqbot.execApprovals.approvers`. Tính năng phê duyệt thực thi gốc được bật theo
mặc định.

## Phương tiện và lưu trữ

- Phương tiện đến, đi và qua cầu nối Gateway dùng chung một thư mục gốc tải trọng tại
  `~/.openclaw/media/qqbot` (tuân theo `OPENCLAW_HOME` khi được đặt), do đó các tệp tải lên,
  tải xuống và bộ nhớ đệm chuyển mã đều nằm trong một thư mục được bảo vệ.
- Việc phân phối đa phương tiện cho các đích C2C và nhóm đi qua một đường dẫn `sendMedia`
  duy nhất. Các tệp cục bộ và bộ đệm trong bộ nhớ có kích thước từ 5&nbsp;MiB trở lên sử dụng các
  endpoint tải lên theo từng phần của QQ; các tải trọng nhỏ hơn và nguồn URL từ xa/Base64 sử dụng
  API tải lên một lần.
- Nếu quá trình nâng cấp nóng làm gián đoạn Gateway trước khi ghi xong
  `openclaw.json`, plugin sẽ khôi phục `appId` / `clientSecret` đã biết gần nhất
  cho tài khoản đó từ một bản chụp nhanh nội bộ vào lần khởi động tiếp theo (không bao giờ
  ghi đè một thay đổi cấu hình có chủ ý), nên không cần quét lại mã QR.

## Khắc phục sự cố

- **Gateway không khởi động / không có tin nhắn đến:** xác minh `appId` và
  `clientSecret` là chính xác và bot đã được bật trên QQ Open Platform.
  Khi thiếu thông tin xác thực, thông báo "QQBot chưa được cấu hình (thiếu appId hoặc
  clientSecret)" sẽ xuất hiện.
- **Thiết lập bằng `--token-file` vẫn hiển thị chưa được cấu hình:** `--token-file` chỉ
  đặt AppSecret. `appId` vẫn phải được đặt trong cấu hình hoặc `QQBOT_APP_ID`.
- **Các phản hồi nhóm dồn dập xung đột:** khi hàng đợi của một đối tượng ngang hàng đầy, hàng đợi đến sẽ loại bỏ
  tin nhắn do bot tạo trước tin nhắn của con người, đồng thời gộp
  các đợt tin nhắn nhóm thông thường (không phải lệnh) thành một lượt có ghi nguồn, nhờ đó
  một lượng lớn tin nhắn bot sẽ không làm tin nhắn của con người bị thiếu tài nguyên xử lý.
- **Tin nhắn chủ động không đến:** QQ có thể chặn các tin nhắn do bot khởi tạo nếu
  người dùng không tương tác gần đây.
- **Giọng nói không được chuyển thành văn bản:** đảm bảo STT đã được cấu hình và có thể
  kết nối tới nhà cung cấp.

## Liên quan

- [Ghép đôi](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
