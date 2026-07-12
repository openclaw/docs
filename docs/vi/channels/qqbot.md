---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực cho QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc riêng tư với QQ Bot
summary: Thiết lập, cấu hình và sử dụng QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-07-12T07:45:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua API QQ Bot chính thức (Gateway WebSocket).
Trò chuyện riêng C2C và lượt nhắc `@` trong nhóm là các loại trò chuyện chính, hỗ trợ nội dung đa phương tiện phong phú (hình ảnh, giọng nói, video, tệp). Tin nhắn kênh guild chỉ hỗ trợ văn bản và hình ảnh từ URL từ xa; giọng nói, video, tải tệp lên và hình ảnh cục bộ/Base64 không khả dụng trong các kênh guild. Không hỗ trợ cảm xúc và luồng thảo luận ở bất kỳ đâu.

Trạng thái: plugin chính thức có thể tải xuống.

## Cài đặt

```bash
openclaw plugins install @openclaw/qqbot
```

## Thiết lập

1. Truy cập [Nền tảng mở QQ](https://q.qq.com/) và dùng ứng dụng QQ trên điện thoại quét mã QR để đăng ký / đăng nhập.
2. Nhấp vào **Create Bot** để tạo QQ bot mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

<Note>
AppSecret không được lưu dưới dạng văn bản thuần túy. Nếu rời khỏi trang mà không lưu, bạn sẽ phải tạo lại một AppSecret mới.
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

Trình hướng dẫn cũng cung cấp phương thức liên kết bằng mã QR thay cho việc nhập AppID/AppSecret theo cách thủ công: quét mã bằng ứng dụng điện thoại được liên kết với QQ Bot đích để hoàn tất liên kết. OpenClaw lưu thông tin xác thực được trả về trong phạm vi cấu hình của tài khoản.

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

Các biến môi trường của tài khoản mặc định (chỉ tài khoản cấp cao nhất):

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

AppSecret SecretRef từ môi trường:

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

- `openclaw channels add --channel qqbot --token-file ...` chỉ đặt AppSecret; `appId` phải được đặt sẵn trong cấu hình hoặc `QQBOT_APP_ID`.
- `clientSecret` chấp nhận chuỗi văn bản thuần túy, đường dẫn tệp (`clientSecretFile`) hoặc đối tượng SecretRef có cấu trúc.
- Các chuỗi đánh dấu `secretref:...` / `secretref-env:...` cũ bị từ chối đối với `clientSecret`; hãy dùng đối tượng SecretRef có cấu trúc thay thế.

### Chính sách truy cập

- `allowFrom` / `groupAllowFrom` kiểm soát ai có thể trò chuyện với bot trong ngữ cảnh C2C / nhóm. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`) kiểm soát chế độ thực thi. `dmPolicy` mặc định là `allowlist` khi `allowFrom` có một mục cụ thể (không phải ký tự đại diện), nếu không thì là `open`. `groupPolicy` mặc định là `allowlist` khi `groupAllowFrom` hoặc `allowFrom` có một mục cụ thể, nếu không thì là `open`.
- Các lệnh dấu gạch chéo có "Xác thực: danh sách cho phép" yêu cầu một mục tường minh không phải ký tự đại diện trong `allowFrom` (hoặc `groupAllowFrom` đối với lệnh gọi từ nhóm), bất kể `dmPolicy` / `groupPolicy` — xem [Lệnh dấu gạch chéo](#slash-commands).

### Thiết lập nhiều tài khoản

Chạy nhiều QQ bot trong một phiên bản OpenClaw duy nhất:

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

Mỗi tài khoản sở hữu một kết nối WebSocket, máy khách API và bộ nhớ đệm token biệt lập, được định danh bằng `appId`. Các dòng nhật ký được gắn thẻ bằng mã định danh của tài khoản sở hữu để dữ liệu chẩn đoán vẫn có thể tách biệt khi bạn chạy nhiều bot trong một Gateway.

Thêm bot thứ hai qua CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Trò chuyện nhóm

Tính năng hỗ trợ nhóm sử dụng OpenID của nhóm QQ, không dùng tên hiển thị. Thêm bot vào một nhóm, sau đó nhắc đến bot hoặc cấu hình nhóm để hoạt động mà không cần lượt nhắc.

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

`groups["*"]` đặt giá trị mặc định cho mọi nhóm; một mục `groups.GROUP_OPENID` cụ thể sẽ ghi đè các giá trị mặc định đó cho một nhóm. Cài đặt nhóm:

| Trường                | Mặc định          | Mô tả                                                                                                              |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `requireMention`      | `true`            | Yêu cầu một lượt nhắc `@` trước khi bot phản hồi.                                                                  |
| `commandLevel`        | `all`             | Các lệnh dấu gạch chéo tích hợp nào có thể chạy trong nhóm (xem bên dưới).                                         |
| `ignoreOtherMentions` | `false`           | Loại bỏ các tin nhắn nhắc đến người khác nhưng không nhắc đến bot.                                                 |
| `historyLimit`        | `50`              | Các tin nhắn gần đây không nhắc đến bot được giữ làm ngữ cảnh cho lượt có nhắc tiếp theo. `0` sẽ tắt lịch sử.      |
| `tools`               | —                 | Cho phép/từ chối công cụ cho toàn bộ nhóm.                                                                         |
| `toolsBySender`       | —                 | Ghi đè công cụ theo từng người gửi; xem [Nhóm](/vi/channels/groups#groupchannel-tool-restrictions-optional).          |
| `name`                | tiền tố openid    | Nhãn thân thiện được dùng trong nhật ký và ngữ cảnh nhóm.                                                          |
| `prompt`              | mặc định tích hợp | Lời nhắc hành vi theo từng nhóm được nối thêm vào ngữ cảnh của tác nhân.                                           |

`commandLevel` chấp nhận:

| Cấp độ  | Hành vi                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`   | Các lệnh tích hợp hiện có vẫn khả dụng. Một số lệnh vẫn bị ẩn khỏi trình đơn nhưng người dùng được ủy quyền vẫn có thể chạy chúng trong nhóm.                             |
| `safety` | `/help`, `/btw`, `/stop` vẫn hiển thị trong nhóm; các lệnh nhạy cảm (`/config`, `/tools`, `/bash`, v.v.) phải được chạy trong trò chuyện riêng.                          |
| `strict` | Chỉ cho phép các điều khiển phiên nhóm cần thiết cho chế độ vận hành nghiêm ngặt. `/stop` vẫn hoạt động để người gửi được ủy quyền có thể ngắt một lượt chạy đang hoạt động. |

Các mục `toolPolicy` cũ của QQBot đã ngừng sử dụng. Chạy `openclaw doctor --fix` để di chuyển chúng sang `tools`.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ tới `mention`; `requireMention: false` ánh xạ tới `always`. Nếu có ghi đè kích hoạt ở cấp phiên, ghi đè đó sẽ được ưu tiên hơn cấu hình.

Hàng đợi tin nhắn đến được duy trì theo từng đối tượng ngang hàng. Đối tượng ngang hàng trong nhóm có giới hạn hàng đợi lớn hơn (50 so với 20 đối với đối tượng trực tiếp), loại bỏ tin nhắn do bot tạo trước tin nhắn của con người khi đầy và hợp nhất các đợt tin nhắn nhóm thông thường thành một lượt có ghi nhận nguồn gửi. Các lệnh dấu gạch chéo chạy lần lượt, độc lập với mọi lô hợp nhất.

### Giọng nói (STT / TTS)

STT và TTS hỗ trợ cấu hình hai cấp với cơ chế dự phòng theo mức ưu tiên:

| Cài đặt | Dành riêng cho plugin                                    | Dự phòng của framework         |
| ------- | -------------------------------------------------------- | ------------------------------ |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]`  |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                 |

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

Đặt `enabled: false` trên một trong hai để tắt. Các ghi đè TTS cấp tài khoản sử dụng cùng cấu trúc với `messages.tts` và được hợp nhất sâu lên trên cấu hình TTS của kênh/toàn cục.

Theo mặc định, yêu cầu STT hết thời gian chờ sau 60 giây. STT dành riêng cho plugin sử dụng giá trị ghi đè `models.providers.<id>.timeoutSeconds` của mô hình được chọn. STT âm thanh của framework lần lượt sử dụng `tools.media.audio.models[0].timeoutSeconds`, sau đó là `tools.media.audio.timeoutSeconds`, rồi đến giá trị ghi đè của nhà cung cấp được chọn.

Các tệp đính kèm giọng nói QQ đến được cung cấp cho tác nhân dưới dạng siêu dữ liệu phương tiện âm thanh, đồng thời giữ các tệp giọng nói thô bên ngoài `MediaPaths` dùng chung. `[[audio_as_voice]]` trong phản hồi văn bản thuần túy sẽ tổng hợp TTS và gửi tin nhắn thoại QQ nguyên bản khi TTS được cấu hình.

Cũng có thể tinh chỉnh hành vi tải lên/chuyển mã âm thanh đi bằng `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                  | Mô tả                  |
| -------------------------- | ---------------------- |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm        |
| `qqbot:channel:CHANNEL_ID` | Kênh guild             |

<Note>
Mỗi bot có một tập OpenID người dùng riêng. OpenID nhận được bởi Bot A **không thể** được dùng để gửi tin nhắn qua Bot B.
</Note>

## Lệnh dấu gạch chéo

Các lệnh tích hợp được chặn trước hàng đợi AI:

| Lệnh                 | Xác thực           | Phạm vi             | Mô tả                                                                                           |
| -------------------- | ------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                   | bất kỳ              | Kiểm tra độ trễ                                                                                 |
| `/bot-help`          | —                   | bất kỳ              | Liệt kê tất cả các lệnh                                                                         |
| `/bot-me`            | —                   | chỉ trò chuyện riêng | Hiển thị mã người dùng QQ (openid) của người gửi để thiết lập `allowFrom` / `groupAllowFrom`     |
| `/bot-version`       | —                   | chỉ trò chuyện riêng | Hiển thị phiên bản framework OpenClaw và phiên bản plugin                                        |
| `/bot-upgrade`       | —                   | chỉ trò chuyện riêng | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                                       |
| `/bot-approve`       | danh sách cho phép | chỉ trò chuyện riêng | Quản lý cấu hình phê duyệt thực thi lệnh (bật / tắt / luôn luôn / đặt lại / trạng thái)          |
| `/bot-logs`          | danh sách cho phép | chỉ trò chuyện riêng | Xuất nhật ký Gateway gần đây dưới dạng tệp                                                       |
| `/bot-clear-storage` | danh sách cho phép | chỉ trò chuyện riêng | Xóa các tệp tải xuống được lưu đệm trong thư mục phương tiện QQBot                               |
| `/bot-streaming`     | danh sách cho phép | chỉ trò chuyện riêng | Bật/tắt phản hồi truyền trực tiếp C2C                                                            |
| `/bot-group-allways` | danh sách cho phép | chỉ trò chuyện riêng | Chuyển đổi chế độ kích hoạt nhóm mặc định (yêu cầu lượt nhắc hoặc luôn bật)                      |

Nối thêm `?` vào bất kỳ lệnh nào để xem trợ giúp sử dụng (ví dụ `/bot-upgrade ?`).

Các lệnh "Xác thực: danh sách cho phép" còn yêu cầu openid của người gửi nằm trong danh sách `allowFrom` tường minh không có ký tự đại diện (`groupAllowFrom` được ưu tiên đối với các lệnh được gọi từ nhóm, sau đó dự phòng về `allowFrom`). Ký tự đại diện `allowFrom: ["*"]` cho phép trò chuyện nhưng không cho phép các lệnh này. Việc chạy một trong các lệnh đó bên ngoài trò chuyện riêng hoặc khi không được ủy quyền sẽ trả về gợi ý thay vì âm thầm loại bỏ tin nhắn.

`/bot-me`, `/bot-version` và `/bot-upgrade` chỉ dùng được trong cuộc trò chuyện riêng tư nhưng không
yêu cầu danh sách cho phép — bất kỳ người gửi C2C nào cũng có thể chạy chúng.

Khi phê duyệt thực thi của QQ Bot sử dụng cơ chế dự phòng mặc định trong cùng cuộc trò chuyện, các lượt nhấp vào
nút phê duyệt gốc cũng tuân theo cùng danh sách cho phép lệnh tường minh, không có ký tự đại diện. Để
cấp quyền chỉ phê duyệt mà không mở rộng quyền truy cập lệnh, hãy cấu hình
`channels.qqbot.execApprovals.approvers`. Phê duyệt thực thi gốc được bật theo
mặc định.

## Phương tiện và lưu trữ

- Phương tiện đến, đi và qua cầu nối Gateway dùng chung một thư mục gốc dữ liệu tại
  `~/.openclaw/media/qqbot` (tuân theo `OPENCLAW_HOME` khi được đặt), nhờ đó các tệp tải lên,
  tải xuống và bộ nhớ đệm chuyển mã nằm trong cùng một thư mục được bảo vệ.
- Việc gửi nội dung đa phương tiện phong phú đến các đích C2C và nhóm đi qua một đường dẫn `sendMedia`
  duy nhất. Tệp cục bộ và bộ đệm trong bộ nhớ có kích thước từ 5&nbsp;MiB trở lên sử dụng các
  điểm cuối tải lên theo từng phần của QQ; dữ liệu nhỏ hơn và nguồn URL từ xa/Base64 sử dụng
  API tải lên một lần.
- Nếu một bản nâng cấp nóng làm gián đoạn Gateway trước khi ghi xong
  `openclaw.json`, ở lần khởi động tiếp theo, Plugin sẽ khôi phục `appId` / `clientSecret`
  đã biết gần nhất cho tài khoản đó từ một bản chụp nhanh nội bộ (không bao giờ
  ghi đè một thay đổi cấu hình có chủ ý), nên không cần quét lại mã QR.

## Khắc phục sự cố

- **Gateway không khởi động / không có tin nhắn đến:** xác minh `appId` và
  `clientSecret` là chính xác và bot đã được bật trên QQ Open Platform.
  Thông tin xác thực bị thiếu sẽ hiển thị dưới dạng "QQBot chưa được cấu hình (thiếu appId hoặc
  clientSecret)".
- **Thiết lập bằng `--token-file` vẫn hiển thị chưa được cấu hình:** `--token-file` chỉ
  đặt AppSecret. `appId` vẫn phải được đặt trong cấu hình hoặc `QQBOT_APP_ID`.
- **Các phản hồi nhóm dồn dập xung đột:** khi hàng đợi của một bên ngang hàng bị đầy, hàng đợi tin nhắn đến sẽ loại bỏ
  tin nhắn do bot gửi trước tin nhắn của con người và gộp
  các đợt tin nhắn nhóm thông thường (không phải lệnh) thành một lượt có ghi rõ nguồn gửi, vì vậy
  một luồng trò chuyện dồn dập từ bot sẽ không làm gián đoạn tin nhắn của con người.
- **Tin nhắn chủ động không đến:** QQ có thể chặn tin nhắn do bot khởi tạo nếu
  người dùng không tương tác gần đây.
- **Giọng nói không được phiên âm:** hãy bảo đảm STT đã được cấu hình và có thể
  kết nối đến nhà cung cấp.

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
