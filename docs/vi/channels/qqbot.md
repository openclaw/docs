---
read_when:
    - Bạn muốn kết nối OpenClaw với QQ
    - Bạn cần thiết lập thông tin xác thực QQ Bot
    - Bạn muốn hỗ trợ trò chuyện nhóm hoặc riêng tư cho QQ Bot
summary: Thiết lập, cấu hình và cách sử dụng QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-06-27T17:11:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot kết nối với OpenClaw qua QQ Bot API chính thức (WebSocket gateway). Plugin hỗ trợ trò chuyện riêng C2C, @messages trong nhóm, và tin nhắn kênh guild với đa phương tiện phong phú (hình ảnh, thoại, video, tệp).

Trạng thái: Plugin có thể tải xuống. Tin nhắn trực tiếp, trò chuyện nhóm, kênh guild và phương tiện được hỗ trợ. Reaction và thread không được hỗ trợ.

## Cài đặt

Cài đặt QQ Bot trước khi thiết lập:

```bash
openclaw plugins install @openclaw/qqbot
```

## Thiết lập

1. Truy cập [QQ Open Platform](https://q.qq.com/) và quét mã QR bằng QQ trên điện thoại của bạn để đăng ký / đăng nhập.
2. Nhấp vào **Create Bot** để tạo bot QQ mới.
3. Tìm **AppID** và **AppSecret** trên trang cài đặt của bot rồi sao chép chúng.

> AppSecret không được lưu dưới dạng văn bản thuần túy — nếu bạn rời khỏi trang mà không lưu,
> bạn sẽ phải tạo lại một AppSecret mới.

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

AppSecret Env SecretRef:

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

- Fallback môi trường chỉ áp dụng cho tài khoản QQ Bot mặc định.
- `openclaw channels add --channel qqbot --token-file ...` chỉ cung cấp AppSecret; AppID phải đã được đặt trong cấu hình hoặc `QQBOT_APP_ID`.
- `clientSecret` cũng chấp nhận đầu vào SecretRef, không chỉ chuỗi văn bản thuần túy.
- Các chuỗi đánh dấu `secretref:/...` cũ không phải là giá trị `clientSecret` hợp lệ;
  hãy dùng các đối tượng SecretRef có cấu trúc như ví dụ ở trên.

### Thiết lập nhiều tài khoản

Chạy nhiều bot QQ trong một phiên bản OpenClaw duy nhất:

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

Hỗ trợ trò chuyện nhóm của QQ Bot dùng OpenID nhóm QQ, không dùng tên hiển thị. Thêm bot vào một nhóm, rồi nhắc đến nó hoặc cấu hình nhóm để chạy mà không cần nhắc đến.

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

`groups["*"]` đặt mặc định cho mọi nhóm, và một mục
`groups.GROUP_OPENID` cụ thể sẽ ghi đè các mặc định đó cho một nhóm. Cài đặt nhóm bao gồm:

- `requireMention`: yêu cầu @mention trước khi bot trả lời. Mặc định: `true`.
- `commandLevel`: kiểm soát những lệnh slash tích hợp nào có thể chạy trong nhóm.
  Mặc định: `all`, giữ nguyên hành vi nhóm QQBot đã có trước đó khi bỏ qua cài đặt này.
- `ignoreOtherMentions`: bỏ qua tin nhắn nhắc đến người khác nhưng không nhắc đến bot.
- `historyLimit`: giữ các tin nhắn nhóm gần đây không có nhắc đến làm ngữ cảnh cho lượt được nhắc đến tiếp theo. Đặt `0` để tắt.
- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: các ghi đè công cụ nhóm theo từng người gửi; xem [Nhóm](/vi/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: nhãn thân thiện dùng trong log và ngữ cảnh nhóm.
- `prompt`: prompt hành vi theo từng nhóm được thêm vào ngữ cảnh agent.

`commandLevel` chấp nhận:

- `all`: giữ các lệnh tích hợp được nhận diện ở trạng thái khả dụng như trước. Một số lệnh có thể
  vẫn bị ẩn khỏi menu, nhưng người dùng được ủy quyền vẫn có thể chạy chúng trong nhóm.
- `safety`: cho phép các lệnh cộng tác phổ biến như `/help`, `/btw`, và
  `/stop`; yêu cầu người dùng chạy các lệnh nhạy cảm như `/config`, `/tools`, và
  `/bash` trong trò chuyện riêng.
- `strict`: chỉ cho phép các điều khiển phiên nhóm cần thiết cho hoạt động nhóm nghiêm ngặt. `/stop` vẫn giữ tính khẩn cấp để người gửi được ủy quyền có thể ngắt một lần chạy đang hoạt động.

Các mục `toolPolicy` cũ của QQBot đã bị ngừng dùng. Chạy `openclaw doctor --fix` để di chuyển chúng sang `tools`.

Các chế độ kích hoạt là `mention` và `always`. `requireMention: true` ánh xạ sang
`mention`; `requireMention: false` ánh xạ sang `always`. Ghi đè kích hoạt ở cấp phiên,
nếu có, sẽ thắng cấu hình.

Hàng đợi đầu vào là theo từng peer. Peer nhóm có giới hạn hàng đợi lớn hơn, giữ tin nhắn
của con người trước các đoạn trò chuyện do bot tạo khi đầy, và gộp các đợt tin nhắn
nhóm bình thường thành một lượt có gán nguồn. Lệnh slash vẫn chạy lần lượt từng lệnh.

### Thoại (STT / TTS)

STT và TTS hỗ trợ cấu hình hai cấp với fallback ưu tiên:

| Cài đặt | Riêng cho Plugin                                        | Fallback framework            |
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
Các ghi đè TTS cấp tài khoản dùng cùng cấu trúc với `messages.tts` và deep-merge
lên trên cấu hình TTS cấp kênh/toàn cục.

Tệp đính kèm thoại QQ đầu vào được hiển thị cho agent dưới dạng metadata phương tiện âm thanh trong khi
giữ các tệp thoại thô khỏi `MediaPaths` chung. Các phản hồi văn bản thuần túy `[[audio_as_voice]]`
sẽ tổng hợp TTS và gửi tin nhắn thoại QQ gốc khi TTS được cấu hình.

Hành vi tải lên/chuyển mã âm thanh đầu ra cũng có thể được tinh chỉnh bằng
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Định dạng đích

| Định dạng                  | Mô tả                |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Trò chuyện riêng (C2C) |
| `qqbot:group:GROUP_OPENID` | Trò chuyện nhóm      |
| `qqbot:channel:CHANNEL_ID` | Kênh guild           |

> Mỗi bot có tập OpenID người dùng riêng. Một OpenID nhận được bởi Bot A **không thể**
> được dùng để gửi tin nhắn qua Bot B.

## Lệnh slash

Các lệnh tích hợp được chặn trước hàng đợi AI:

| Lệnh           | Mô tả                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Kiểm tra độ trễ                                                                                            |
| `/bot-version` | Hiển thị phiên bản framework OpenClaw                                                                      |
| `/bot-help`    | Liệt kê tất cả lệnh                                                                                        |
| `/bot-me`      | Hiển thị ID người dùng QQ của người gửi (openid) cho thiết lập `allowFrom`/`groupAllowFrom`                |
| `/bot-upgrade` | Hiển thị liên kết hướng dẫn nâng cấp QQBot                                                                 |
| `/bot-logs`    | Xuất log gateway gần đây dưới dạng tệp                                                                     |
| `/bot-approve` | Phê duyệt một hành động QQ Bot đang chờ xử lý (ví dụ, xác nhận tải lên C2C hoặc nhóm) qua luồng gốc. |

Thêm `?` vào bất kỳ lệnh nào để xem trợ giúp sử dụng (ví dụ `/bot-upgrade ?`).

Các lệnh quản trị (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) chỉ dùng trong tin nhắn trực tiếp và yêu cầu openid của người gửi nằm trong danh sách `allowFrom` rõ ràng, không có ký tự đại diện. Ký tự đại diện `allowFrom: ["*"]` cho phép trò chuyện nhưng không cấp quyền truy cập lệnh quản trị. Tin nhắn nhóm được khớp với `groupAllowFrom` trước rồi fallback về `allowFrom`. Chạy lệnh quản trị trong nhóm sẽ trả về gợi ý thay vì âm thầm bỏ qua.

Khi phê duyệt exec của QQ Bot dùng fallback cùng cuộc trò chuyện mặc định, lượt nhấp
nút phê duyệt gốc tuân theo cùng danh sách cho phép lệnh rõ ràng không có ký tự đại diện. Để cấp
quyền chỉ phê duyệt mà không có quyền lệnh rộng hơn, hãy cấu hình
`channels.qqbot.execApprovals.approvers`.

## Kiến trúc engine

QQ Bot được phân phối dưới dạng engine khép kín bên trong Plugin:

- Mỗi tài khoản sở hữu một ngăn xếp tài nguyên cô lập (kết nối WebSocket, API client, bộ nhớ đệm token, gốc lưu trữ phương tiện) được khóa theo `appId`. Các tài khoản không bao giờ chia sẻ trạng thái đầu vào/đầu ra.
- Logger nhiều tài khoản gắn thẻ các dòng log bằng tài khoản sở hữu để chẩn đoán luôn tách biệt khi bạn chạy nhiều bot dưới một gateway.
- Các đường dẫn đầu vào, đầu ra, và cầu nối gateway chia sẻ một gốc payload phương tiện duy nhất dưới `~/.openclaw/media`, để các tải lên, tải xuống, và bộ nhớ đệm chuyển mã nằm dưới một thư mục được bảo vệ thay vì cây theo từng hệ thống con.
- Phân phối đa phương tiện phong phú đi qua một đường dẫn `sendMedia` duy nhất cho đích C2C và nhóm. Tệp cục bộ và bộ đệm vượt ngưỡng tệp lớn dùng endpoint tải lên theo khối của QQ, trong khi payload nhỏ hơn dùng API phương tiện một lần.
- Thông tin xác thực có thể được sao lưu và khôi phục như một phần của snapshot thông tin xác thực OpenClaw tiêu chuẩn; engine gắn lại ngăn xếp tài nguyên của từng tài khoản khi khôi phục mà không yêu cầu cặp mã QR mới.

## Onboarding bằng mã QR

Thay cho việc dán `AppID:AppSecret` thủ công, engine hỗ trợ luồng onboarding bằng mã QR để liên kết QQ Bot với OpenClaw:

1. Chạy đường dẫn thiết lập QQ Bot (ví dụ `openclaw channels add --channel qqbot`) và chọn luồng mã QR khi được nhắc.
2. Quét mã QR đã tạo bằng ứng dụng điện thoại được liên kết với QQ Bot mục tiêu.
3. Phê duyệt ghép cặp trên điện thoại. OpenClaw lưu thông tin xác thực được trả về vào `credentials/` trong phạm vi tài khoản đúng.

Các prompt phê duyệt do chính bot tạo ra (ví dụ, các luồng "cho phép hành động này?" được QQ Bot API cung cấp) hiển thị dưới dạng prompt OpenClaw gốc mà bạn có thể chấp nhận bằng `/bot-approve` thay vì trả lời qua client QQ thô.

## Khắc phục sự cố

- **Bot trả lời "gone to Mars":** thông tin xác thực chưa được cấu hình hoặc Gateway chưa được khởi động.
- **Không có tin nhắn đến:** xác minh `appId` và `clientSecret` là chính xác, và
  bot đã được bật trên QQ Open Platform.
- **Tự trả lời lặp lại:** OpenClaw ghi nhận các chỉ mục tham chiếu gửi đi của QQ là
  do bot tạo và bỏ qua các sự kiện đến có `msgIdx` hiện tại khớp với
  cùng tài khoản bot đó. Điều này ngăn các vòng lặp echo của nền tảng trong khi vẫn cho phép người dùng
  trích dẫn hoặc trả lời các tin nhắn bot trước đó.
- **Thiết lập với `--token-file` vẫn hiển thị chưa cấu hình:** `--token-file` chỉ đặt
  AppSecret. Bạn vẫn cần `appId` trong cấu hình hoặc `QQBOT_APP_ID`.
- **Tin nhắn chủ động không đến:** QQ có thể chặn các tin nhắn do bot khởi tạo nếu
  người dùng chưa tương tác gần đây.
- **Giọng nói không được chép lời:** đảm bảo STT đã được cấu hình và nhà cung cấp có thể truy cập được.

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
