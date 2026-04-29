---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực cho QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc trò chuyện riêng với QQ Bot
summary: Thiết lập, cấu hình và sử dụng QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-04-29T22:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua QQ Bot API chính thức (WebSocket gateway). Plugin hỗ trợ trò chuyện riêng C2C, @messages trong nhóm và tin nhắn kênh guild với đa phương tiện phong phú (hình ảnh, giọng nói, video, tệp).

Trạng thái: Plugin được đóng gói kèm. Tin nhắn trực tiếp, trò chuyện nhóm, kênh guild và phương tiện đều được hỗ trợ. Phản ứng và chuỗi hội thoại không được hỗ trợ.

## Plugin được đóng gói kèm

Các bản phát hành OpenClaw hiện tại đóng gói kèm QQ Bot, nên các bản dựng đóng gói thông thường không cần bước `openclaw plugins install` riêng.

## Thiết lập

1. Truy cập [QQ Open Platform](https://q.qq.com/) và quét mã QR bằng QQ trên điện thoại của bạn để đăng ký / đăng nhập.
2. Nhấp **Create Bot** để tạo QQ bot mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

> AppSecret không được lưu ở dạng văn bản thuần túy — nếu bạn rời khỏi trang mà không lưu,
> bạn sẽ phải tạo lại một mã mới.

4. Thêm kênh:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Khởi động lại Gateway.

Đường dẫn thiết lập tương tác:

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

Ghi chú:

- Dự phòng bằng biến môi trường chỉ áp dụng cho tài khoản QQ Bot mặc định.
- `openclaw channels add --channel qqbot --token-file ...` chỉ cung cấp AppSecret; AppID phải đã được đặt trong cấu hình hoặc `QQBOT_APP_ID`.
- `clientSecret` cũng chấp nhận đầu vào SecretRef, không chỉ chuỗi văn bản thuần túy.

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

Hỗ trợ trò chuyện nhóm của QQ Bot dùng QQ group OpenID, không phải tên hiển thị. Thêm bot vào một nhóm, rồi nhắc đến bot hoặc cấu hình nhóm để chạy mà không cần nhắc đến.

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

`groups["*"]` đặt mặc định cho mọi nhóm, và một mục `groups.GROUP_OPENID` cụ thể sẽ ghi đè các mặc định đó cho một nhóm. Cài đặt nhóm bao gồm:

- `requireMention`: yêu cầu @mention trước khi bot trả lời. Mặc định: `true`.
- `ignoreOtherMentions`: bỏ qua tin nhắn nhắc đến người khác nhưng không nhắc đến bot.
- `historyLimit`: giữ các tin nhắn nhóm gần đây không nhắc đến bot làm ngữ cảnh cho lượt được nhắc đến tiếp theo. Đặt `0` để tắt.
- `toolPolicy`: `full`, `restricted` hoặc `none` cho các công cụ theo phạm vi nhóm.
- `name`: nhãn thân thiện dùng trong nhật ký và ngữ cảnh nhóm.
- `prompt`: prompt hành vi theo từng nhóm được thêm vào ngữ cảnh agent.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ tới `mention`; `requireMention: false` ánh xạ tới `always`. Ghi đè kích hoạt ở cấp phiên, nếu có, sẽ thắng cấu hình.

Hàng đợi đầu vào là theo từng peer. Peer nhóm có giới hạn hàng đợi lớn hơn, giữ tin nhắn của con người trước các trao đổi do bot tạo khi đầy, và hợp nhất các đợt tin nhắn nhóm thông thường thành một lượt có gán nguồn. Lệnh slash vẫn chạy lần lượt.

### Giọng nói (STT / TTS)

Hỗ trợ STT và TTS có cấu hình hai cấp với dự phòng theo ưu tiên:

| Cài đặt | Riêng cho Plugin                                          | Dự phòng framework            |
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
        qq-main: {
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
Ghi đè TTS cấp tài khoản dùng cùng cấu trúc với `messages.tts` và deep-merge lên cấu hình TTS của kênh/toàn cục.

Tệp đính kèm giọng nói đầu vào của QQ được cung cấp cho agent dưới dạng siêu dữ liệu phương tiện âm thanh, đồng thời giữ các tệp giọng nói thô ngoài `MediaPaths` chung. Phản hồi văn bản thuần túy `[[audio_as_voice]]` sẽ tổng hợp TTS và gửi tin nhắn thoại QQ gốc khi TTS được cấu hình.

Hành vi tải lên/chuyển mã âm thanh đầu ra cũng có thể được tinh chỉnh bằng `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                  | Mô tả                 |
| -------------------------- | --------------------- |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm       |
| `qqbot:channel:CHANNEL_ID` | Kênh guild            |

> Mỗi bot có tập OpenID người dùng riêng. OpenID nhận được bởi Bot A **không thể**
> được dùng để gửi tin nhắn qua Bot B.

## Lệnh slash

Các lệnh tích hợp bị chặn trước hàng đợi AI:

| Lệnh           | Mô tả                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Kiểm tra độ trễ                                                                                           |
| `/bot-version` | Hiển thị phiên bản framework OpenClaw                                                                      |
| `/bot-help`    | Liệt kê tất cả lệnh                                                                                       |
| `/bot-upgrade` | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                                                |
| `/bot-logs`    | Xuất nhật ký gateway gần đây dưới dạng tệp                                                                |
| `/bot-approve` | Phê duyệt một hành động QQ Bot đang chờ xử lý (ví dụ: xác nhận tải lên C2C hoặc nhóm) qua luồng gốc. |

Thêm `?` vào bất kỳ lệnh nào để xem trợ giúp sử dụng (ví dụ `/bot-upgrade ?`).

## Kiến trúc engine

QQ Bot được cung cấp dưới dạng engine tự chứa bên trong Plugin:

- Mỗi tài khoản sở hữu một ngăn xếp tài nguyên cô lập (kết nối WebSocket, API client, bộ nhớ đệm token, gốc lưu trữ phương tiện) được khóa theo `appId`. Các tài khoản không bao giờ chia sẻ trạng thái đầu vào/đầu ra.
- Logger đa tài khoản gắn thẻ các dòng nhật ký bằng tài khoản sở hữu để chẩn đoán vẫn tách biệt khi bạn chạy nhiều bot dưới một gateway.
- Các đường dẫn đầu vào, đầu ra và cầu nối gateway dùng chung một gốc payload phương tiện dưới `~/.openclaw/media`, nên tải lên, tải xuống và bộ nhớ đệm chuyển mã nằm trong một thư mục được bảo vệ thay vì cây riêng cho từng hệ con.
- Phân phối đa phương tiện phong phú đi qua một đường dẫn `sendMedia` cho mục tiêu C2C và nhóm. Tệp cục bộ và buffer vượt ngưỡng tệp lớn dùng endpoint tải lên theo khối của QQ, trong khi payload nhỏ hơn dùng media API một lần.
- Thông tin xác thực có thể được sao lưu và khôi phục như một phần của snapshot thông tin xác thực OpenClaw tiêu chuẩn; engine gắn lại ngăn xếp tài nguyên của từng tài khoản khi khôi phục mà không yêu cầu ghép cặp mã QR mới.

## Onboarding bằng mã QR

Thay vì dán `AppID:AppSecret` thủ công, engine hỗ trợ luồng onboarding bằng mã QR để liên kết QQ Bot với OpenClaw:

1. Chạy đường dẫn thiết lập QQ Bot (ví dụ `openclaw channels add --channel qqbot`) và chọn luồng mã QR khi được nhắc.
2. Quét mã QR được tạo bằng ứng dụng điện thoại gắn với QQ Bot mục tiêu.
3. Phê duyệt việc ghép cặp trên điện thoại. OpenClaw lưu thông tin xác thực được trả về vào `credentials/` dưới phạm vi tài khoản phù hợp.

Prompt phê duyệt do chính bot tạo (ví dụ các luồng "cho phép hành động này?" do QQ Bot API cung cấp) xuất hiện dưới dạng prompt OpenClaw gốc mà bạn có thể chấp nhận bằng `/bot-approve` thay vì trả lời qua QQ client thô.

## Khắc phục sự cố

- **Bot trả lời "gone to Mars":** thông tin xác thực chưa được cấu hình hoặc Gateway chưa được khởi động.
- **Không có tin nhắn đầu vào:** xác minh `appId` và `clientSecret` đúng, và bot đã được bật trên QQ Open Platform.
- **Tự trả lời lặp lại:** OpenClaw ghi chỉ mục tham chiếu đầu ra QQ là do bot tạo và bỏ qua các sự kiện đầu vào có `msgIdx` hiện tại khớp với cùng tài khoản bot đó. Điều này ngăn vòng lặp echo của nền tảng trong khi vẫn cho phép người dùng trích dẫn hoặc trả lời các tin nhắn bot trước đó.
- **Thiết lập với `--token-file` vẫn hiển thị chưa cấu hình:** `--token-file` chỉ đặt AppSecret. Bạn vẫn cần `appId` trong cấu hình hoặc `QQBOT_APP_ID`.
- **Tin nhắn chủ động không đến:** QQ có thể chặn tin nhắn do bot khởi tạo nếu người dùng chưa tương tác gần đây.
- **Giọng nói không được phiên âm:** đảm bảo STT đã được cấu hình và provider có thể truy cập được.

## Liên quan

- [Ghép cặp](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
