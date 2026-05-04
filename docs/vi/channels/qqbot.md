---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực cho QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc trò chuyện riêng tư qua QQ Bot
summary: Thiết lập, cấu hình và sử dụng QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-05-04T02:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua QQ Bot API chính thức (WebSocket gateway). Plugin này hỗ trợ trò chuyện riêng C2C, @tin nhắn trong nhóm và tin nhắn kênh guild với đa phương tiện phong phú (hình ảnh, giọng nói, video, tệp).

Trạng thái: plugin có thể tải xuống. Tin nhắn trực tiếp, trò chuyện nhóm, kênh guild và đa phương tiện đều được hỗ trợ. Phản ứng và luồng không được hỗ trợ.

## Cài đặt

Cài QQ Bot trước khi thiết lập:

```bash
openclaw plugins install @openclaw/qqbot
```

## Thiết lập

1. Truy cập [QQ Open Platform](https://q.qq.com/) và quét mã QR bằng QQ trên điện thoại của bạn để đăng ký / đăng nhập.
2. Bấm **Create Bot** để tạo một QQ bot mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

> AppSecret không được lưu dưới dạng văn bản thuần — nếu bạn rời khỏi trang mà không lưu,
> bạn sẽ phải tạo lại một khóa mới.

4. Thêm kênh:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Khởi động lại Gateway.

Các đường dẫn thiết lập tương tác:

```bash
openclaw channels add
openclaw configure --section channels
```

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

Biến môi trường cho tài khoản mặc định:

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

Ghi chú:

- Dự phòng từ môi trường chỉ áp dụng cho tài khoản QQ Bot mặc định.
- `openclaw channels add --channel qqbot --token-file ...` chỉ cung cấp AppSecret; AppID phải đã được đặt trong cấu hình hoặc `QQBOT_APP_ID`.
- `clientSecret` cũng chấp nhận đầu vào SecretRef, không chỉ chuỗi văn bản thuần.
- Các chuỗi đánh dấu `secretref:/...` cũ không phải là giá trị `clientSecret` hợp lệ; hãy dùng các đối tượng SecretRef có cấu trúc như ví dụ ở trên.

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

Mỗi tài khoản khởi chạy kết nối WebSocket riêng và duy trì bộ nhớ đệm token độc lập (được cô lập theo `appId`).

Thêm bot thứ hai qua CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Trò chuyện nhóm

Hỗ trợ trò chuyện nhóm của QQ Bot dùng OpenID nhóm QQ, không dùng tên hiển thị. Thêm bot vào một nhóm, rồi nhắc đến bot hoặc cấu hình nhóm để chạy mà không cần nhắc đến.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` đặt mặc định cho mọi nhóm, còn mục `groups.GROUP_OPENID` cụ thể sẽ ghi đè các mặc định đó cho một nhóm. Cài đặt nhóm bao gồm:

- `requireMention`: yêu cầu @mention trước khi bot trả lời. Mặc định: `true`.
- `ignoreOtherMentions`: bỏ các tin nhắn nhắc đến người khác nhưng không nhắc đến bot.
- `historyLimit`: giữ các tin nhắn nhóm gần đây không phải lượt nhắc đến làm ngữ cảnh cho lượt được nhắc đến tiếp theo. Đặt `0` để tắt.
- `toolPolicy`: `full`, `restricted` hoặc `none` cho các công cụ theo phạm vi nhóm.
- `name`: nhãn thân thiện được dùng trong nhật ký và ngữ cảnh nhóm.
- `prompt`: prompt hành vi theo từng nhóm được thêm vào ngữ cảnh agent.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ tới `mention`; `requireMention: false` ánh xạ tới `always`. Ghi đè kích hoạt ở cấp phiên, khi có, sẽ thắng cấu hình.

Hàng đợi đầu vào được tách theo từng peer. Peer nhóm có giới hạn hàng đợi lớn hơn, giữ tin nhắn của người dùng trước các trao đổi do bot viết khi đầy, và hợp nhất các đợt tin nhắn nhóm thông thường thành một lượt có gán nguồn. Lệnh slash vẫn chạy lần lượt từng lệnh.

### Giọng nói (STT / TTS)

Hỗ trợ STT và TTS dùng cấu hình hai cấp với dự phòng theo thứ tự ưu tiên:

| Cài đặt | Riêng cho Plugin                                        | Dự phòng framework           |
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

Đặt `enabled: false` trên một trong hai để tắt.
Các ghi đè TTS ở cấp tài khoản dùng cùng cấu trúc với `messages.tts` và được deep-merge lên trên cấu hình TTS của kênh/toàn cục.

Tệp đính kèm giọng nói đầu vào của QQ được cung cấp cho agent dưới dạng siêu dữ liệu đa phương tiện âm thanh, đồng thời giữ các tệp giọng nói thô ngoài `MediaPaths` chung. Phản hồi văn bản thuần `[[audio_as_voice]]` sẽ tổng hợp TTS và gửi tin nhắn giọng nói QQ gốc khi TTS được cấu hình.

Hành vi tải lên/chuyển mã âm thanh đầu ra cũng có thể được tinh chỉnh bằng `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                  | Mô tả                  |
| -------------------------- | ---------------------- |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm        |
| `qqbot:channel:CHANNEL_ID` | Kênh guild             |

> Mỗi bot có tập OpenID người dùng riêng. OpenID nhận được bởi Bot A **không thể**
> được dùng để gửi tin nhắn qua Bot B.

## Lệnh slash

Các lệnh tích hợp được chặn trước hàng đợi AI:

| Lệnh           | Mô tả                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Kiểm tra độ trễ                                                                                          |
| `/bot-version` | Hiển thị phiên bản framework OpenClaw                                                                    |
| `/bot-help`    | Liệt kê tất cả lệnh                                                                                      |
| `/bot-me`      | Hiển thị ID người dùng QQ của người gửi (openid) để thiết lập `allowFrom`/`groupAllowFrom`               |
| `/bot-upgrade` | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                                               |
| `/bot-logs`    | Xuất nhật ký gateway gần đây thành tệp                                                                   |
| `/bot-approve` | Phê duyệt một hành động QQ Bot đang chờ xử lý (ví dụ: xác nhận tải lên C2C hoặc nhóm) qua luồng gốc.     |

Thêm `?` vào bất kỳ lệnh nào để xem trợ giúp sử dụng (ví dụ `/bot-upgrade ?`).

Các lệnh quản trị (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) chỉ dùng trong tin nhắn trực tiếp và yêu cầu openid của người gửi nằm trong danh sách `allowFrom` rõ ràng không dùng ký tự đại diện. Ký tự đại diện `allowFrom: ["*"]` cho phép trò chuyện nhưng không cấp quyền truy cập lệnh quản trị. Tin nhắn nhóm được so khớp với `groupAllowFrom` trước rồi dự phòng về `allowFrom`. Chạy lệnh quản trị trong nhóm sẽ trả về gợi ý thay vì âm thầm bỏ qua.

## Kiến trúc engine

QQ Bot được cung cấp dưới dạng engine độc lập bên trong plugin:

- Mỗi tài khoản sở hữu một ngăn xếp tài nguyên cô lập (kết nối WebSocket, API client, bộ nhớ đệm token, gốc lưu trữ đa phương tiện) được định danh bằng `appId`. Các tài khoản không bao giờ chia sẻ trạng thái đầu vào/đầu ra.
- Logger nhiều tài khoản gắn thẻ các dòng nhật ký với tài khoản sở hữu để chẩn đoán vẫn tách biệt khi bạn chạy nhiều bot dưới một gateway.
- Các đường dẫn đầu vào, đầu ra và cầu nối Gateway dùng chung một gốc payload đa phương tiện dưới `~/.openclaw/media`, vì vậy tải lên, tải xuống và bộ nhớ đệm chuyển mã nằm dưới một thư mục được bảo vệ thay vì cây riêng cho từng hệ con.
- Việc gửi đa phương tiện phong phú đi qua một đường dẫn `sendMedia` duy nhất cho đích C2C và nhóm. Tệp cục bộ và bộ đệm vượt ngưỡng tệp lớn dùng các endpoint tải lên theo từng đoạn của QQ, còn payload nhỏ hơn dùng media API một lần.
- Thông tin xác thực có thể được sao lưu và khôi phục như một phần của snapshot thông tin xác thực OpenClaw tiêu chuẩn; engine gắn lại ngăn xếp tài nguyên của từng tài khoản khi khôi phục mà không yêu cầu ghép cặp mã QR mới.

## Onboarding bằng mã QR

Thay cho việc dán thủ công `AppID:AppSecret`, engine hỗ trợ luồng onboarding bằng mã QR để liên kết QQ Bot với OpenClaw:

1. Chạy đường dẫn thiết lập QQ Bot (ví dụ `openclaw channels add --channel qqbot`) và chọn luồng mã QR khi được nhắc.
2. Quét mã QR được tạo bằng ứng dụng điện thoại được liên kết với QQ Bot đích.
3. Phê duyệt ghép cặp trên điện thoại. OpenClaw lưu thông tin xác thực trả về vào `credentials/` dưới phạm vi tài khoản phù hợp.

Các prompt phê duyệt do chính bot tạo ra (ví dụ các luồng "allow this action?" do QQ Bot API cung cấp) xuất hiện dưới dạng prompt OpenClaw gốc mà bạn có thể chấp nhận bằng `/bot-approve` thay vì trả lời qua client QQ thô.

## Khắc phục sự cố

- **Bot trả lời "gone to Mars":** thông tin xác thực chưa được cấu hình hoặc Gateway chưa khởi động.
- **Không có tin nhắn đầu vào:** xác minh `appId` và `clientSecret` là chính xác, đồng thời bot đã được bật trên QQ Open Platform.
- **Tự trả lời lặp lại:** OpenClaw ghi lại chỉ mục ref đầu ra của QQ dưới dạng do bot viết và bỏ qua các sự kiện đầu vào có `msgIdx` hiện tại khớp với cùng tài khoản bot đó. Điều này ngăn vòng lặp vọng lại của nền tảng trong khi vẫn cho phép người dùng trích dẫn hoặc trả lời các tin nhắn bot trước đó.
- **Thiết lập bằng `--token-file` vẫn hiển thị chưa cấu hình:** `--token-file` chỉ đặt AppSecret. Bạn vẫn cần `appId` trong cấu hình hoặc `QQBOT_APP_ID`.
- **Tin nhắn chủ động không đến:** QQ có thể chặn tin nhắn do bot khởi tạo nếu người dùng gần đây chưa tương tác.
- **Giọng nói không được chép lời:** bảo đảm STT đã được cấu hình và nhà cung cấp có thể truy cập được.

## Liên quan

- [Ghép cặp](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
