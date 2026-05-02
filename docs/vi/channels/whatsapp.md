---
read_when:
    - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T10:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp lần đầu tiên bạn chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` khi gói hiện tại
  đã được phát hành.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Nếu npm báo gói thuộc sở hữu của OpenClaw đã bị ngừng hỗ trợ hoặc bị thiếu, hãy dùng
bản dựng OpenClaw đã đóng gói hiện tại hoặc checkout cục bộ cho đến khi chuỗi gói npm
bắt kịp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối cho người gửi không xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Cấu hình chính sách truy cập WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Liên kết WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Cho một tài khoản cụ thể:

```bash
openclaw channels login --channel whatsapp --account work
```

    Để gắn một thư mục xác thực WhatsApp Web hiện có/tùy chỉnh trước khi đăng nhập:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Khởi động gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Phê duyệt yêu cầu ghép nối đầu tiên (nếu dùng chế độ ghép nối)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép nối hết hạn sau 1 giờ. Yêu cầu đang chờ được giới hạn ở 3 yêu cầu cho mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu hóa cho cách thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số riêng (khuyến nghị)">
    Đây là chế độ vận hành gọn gàng nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ hơn
    - giảm khả năng nhầm lẫn self-chat

    Mẫu chính sách tối thiểu:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Dự phòng bằng số cá nhân">
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi runtime, các biện pháp bảo vệ self-chat dựa trên số self đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin WhatsApp Twilio riêng trong registry kênh chat tích hợp.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động vận chuyển WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào, nên một phiên thiết bị đã liên kết đang yên lặng sẽ không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu transport frame tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời điểm socket Baileys được khai báo rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` điều khiển ping ứng dụng WhatsApp Web, `connectTimeoutMs` điều khiển timeout bắt tay khi mở kết nối, và `defaultQueryTimeoutMs` điều khiển timeout truy vấn Baileys.
- Gửi đi yêu cầu listener WhatsApp đang hoạt động cho tài khoản đích.
- Chat trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động vận chuyển WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào: các phiên thiết bị đã liên kết đang yên lặng vẫn duy trì khi transport frame tiếp tục, nhưng một lần dừng vận chuyển sẽ buộc kết nối lại trước rất lâu so với đường ngắt kết nối từ xa muộn hơn.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- Vận chuyển WhatsApp Web tôn trọng biến môi trường proxy tiêu chuẩn trên máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ thay vì thiết lập proxy WhatsApp riêng theo kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw xóa phản ứng xác nhận WhatsApp sau khi một phản hồi hiển thị được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đi vào có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
mã định danh nhóm, tên người gửi, và trường tương quan phiên. Vì lý do đó,
WhatsApp không phát payload hook `message_received` đi vào cho Plugin
trừ khi bạn chủ động chọn tham gia:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Bạn có thể giới hạn lựa chọn tham gia cho một tài khoản:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Chỉ bật tùy chọn này cho các Plugin mà bạn tin tưởng để nhận nội dung và mã định danh
tin nhắn WhatsApp đi vào.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số kiểu E.164 (được chuẩn hóa nội bộ).

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - ghép nối được lưu trong allow-store của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và dự phòng người nhận heartbeat dùng đích gửi rõ ràng hoặc `allowFrom` đã cấu hình; phê duyệt ghép nối DM không mặc nhiên là người nhận cron hoặc heartbeat
    - nếu không cấu hình allowlist, số self đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối DM `fromMe` gửi đi (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + allowlist">
    Truy cập nhóm có hai lớp:

    1. **Allowlist thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, tất cả nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như allowlist nhóm (cho phép `"*"`)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ dữ liệu đi vào từ nhóm

    Dự phòng allowlist người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime dùng dự phòng `allowFrom` khi có
    - allowlist người gửi được đánh giá trước kích hoạt bằng mention/reply

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, dự phòng chính sách nhóm của runtime là `allowlist` (kèm log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Mention + /activation">
    Phản hồi nhóm mặc định yêu cầu mention.

    Phát hiện mention bao gồm:

    - mention WhatsApp rõ ràng đến danh tính bot
    - mẫu regex mention đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản ghi lời thoại voice-note đi vào cho tin nhắn nhóm đã được cho phép
    - phát hiện phản hồi đến bot ngầm định (người gửi phản hồi khớp danh tính bot)

    Lưu ý bảo mật:

    - quote/reply chỉ thỏa mãn cổng mention; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được kiểm soát bởi chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và self-chat

Khi số self đã liên kết cũng có trong `allowFrom`, biện pháp bảo vệ self-chat của WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt self-chat
- bỏ qua hành vi tự động kích hoạt mention-JID vốn có thể ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, phản hồi self-chat mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Envelope đi vào + ngữ cảnh phản hồi">
    Tin nhắn WhatsApp đi vào được bọc trong envelope đi vào dùng chung.

    Nếu có phản hồi được trích dẫn, ngữ cảnh được nối thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Trường siêu dữ liệu phản hồi cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).
    Khi đích phản hồi được trích dẫn là media có thể tải xuống, OpenClaw lưu nó qua
    kho media đi vào bình thường và hiển thị dưới dạng `MediaPath`/`MediaType` để
    agent có thể kiểm tra ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn đi vào chỉ có media được chuẩn hóa bằng placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note nhóm đã được cho phép được chép lời trước cổng mention khi
    body chỉ là `<media:audio>`, nên việc nói mention bot trong voice note có thể
    kích hoạt phản hồi. Nếu bản chép lời vẫn không mention bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Body vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được kết xuất dưới dạng siêu dữ liệu không tin cậy trong khối fenced, không phải văn bản prompt inline.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Với nhóm, tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Marker chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật theo mặc định cho tin nhắn WhatsApp đi vào đã được chấp nhận.

    Tắt toàn cục:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ghi đè theo tài khoản:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Lượt self-chat bỏ qua biên nhận đã đọc ngay cả khi được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn, và media

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), rồi chuyển sang chia đoạn an toàn theo độ dài nếu cần

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, nên ứng dụng WhatsApp hiển thị dưới dạng ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM từ Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus đơn kênh 48 kHz trước khi phân phối PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng phản hồi; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời nhiều phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện đầu vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đầu ra: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (đổi kích thước/quét chất lượng) để vừa giới hạn
    - khi gửi phương tiện thất bại, dự phòng mục đầu tiên gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó phản hồi gửi đi trích dẫn rõ tin nhắn đầu vào. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi dưới dạng tin nhắn thường                |
| `"first"`   | Chỉ trích dẫn đoạn phản hồi gửi đi đầu tiên                           |
| `"all"`     | Trích dẫn mọi đoạn phản hồi gửi đi                                    |
| `"batched"` | Trích dẫn các phản hồi theo lô trong hàng đợi, còn phản hồi tức thì không trích dẫn |

Mặc định là `"off"`. Ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Mức phản ứng

`channels.whatsapp.reactionLevel` điều khiển phạm vi tác nhân sử dụng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do tác nhân khởi tạo | Mô tả                                           |
| ------------- | ----------------- | ----------------------------- | ----------------------------------------------- |
| `"off"`       | Không             | Không                         | Không có phản ứng nào                          |
| `"ack"`       | Có                | Không                         | Chỉ phản ứng xác nhận (biên nhận trước trả lời) |
| `"minimal"`   | Có                | Có (thận trọng)               | Xác nhận + phản ứng của tác nhân với hướng dẫn thận trọng |
| `"extensive"` | Có                | Có (khuyến khích)             | Xác nhận + phản ứng của tác nhân với hướng dẫn khuyến khích |

Mặc định: `"minimal"`.

Ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Phản ứng xác nhận

WhatsApp hỗ trợ phản ứng xác nhận tức thì khi nhận đầu vào qua `channels.whatsapp.ackReaction`.
Phản ứng xác nhận chịu kiểm soát của `reactionLevel` — chúng bị chặn khi `reactionLevel` là `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Ghi chú hành vi:

- được gửi ngay sau khi đầu vào được chấp nhận (trước trả lời)
- lỗi được ghi nhật ký nhưng không chặn việc phân phối phản hồi bình thường
- chế độ nhóm `mentions` phản ứng ở các lượt được kích hoạt bằng đề cập; kích hoạt nhóm `always` đóng vai trò bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và giá trị mặc định">
    - id tài khoản lấy từ `channels.whatsapp.accounts`
    - lựa chọn tài khoản mặc định: `default` nếu có, nếu không thì id tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, đăng xuất trước tiên dừng trình lắng nghe WhatsApp trực tiếp cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe trực tiếp trước khi tắt hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ tác nhân bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình do kênh khởi tạo được bật theo mặc định (tắt qua `channels.whatsapp.configWrites=false`).

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Chưa liên kết (cần QR)">
    Triệu chứng: trạng thái kênh báo chưa liên kết.

    Cách khắc phục:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Đã liên kết nhưng mất kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết có các lần mất kết nối hoặc thử kết nối lại lặp lại.

    Tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn thông thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng quá cửa sổ an toàn dài hơn.

    Nếu nhật ký hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
    thời gian socket Baileys trong `web.whatsapp`. Bắt đầu bằng cách rút ngắn
    `keepAliveIntervalMs` xuống dưới thời gian chờ nhàn rỗi của mạng và tăng
    `connectTimeoutMs` trên các liên kết chậm hoặc mất gói:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Cách khắc phục:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` báo `Gateway inactive` nhưng
    `openclaw gateway status` và `openclaw channels status --probe` cho thấy
    Gateway và WhatsApp đều khỏe mạnh, hãy chạy `openclaw doctor`. Trên Linux, doctor
    cảnh báo về các mục crontab cũ vẫn gọi
    `~/.openclaw/bin/ensure-whatsapp.sh`; hãy xóa các mục lỗi thời đó bằng
    `crontab -e` vì cron có thể thiếu môi trường systemd user-bus và
    khiến script cũ đó báo sai tình trạng Gateway.

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ phía sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc ngắt kết nối TLS socket.

    Đăng nhập WhatsApp Web dùng môi trường proxy tiêu chuẩn của máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng, và `NO_PROXY`). Xác minh tiến trình Gateway kế thừa môi trường proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có trình lắng nghe Gateway hoạt động cho tài khoản đích.

    Hãy bảo đảm Gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không xuất hiện trong WhatsApp">
    Các hàng bản ghi ghi lại nội dung tác nhân đã tạo. Việc phân phối WhatsApp được kiểm tra riêng: OpenClaw chỉ xem một phản hồi tự động là đã gửi sau khi Baileys trả về id tin nhắn gửi đi cho ít nhất một lần gửi văn bản hiển thị hoặc phương tiện.

    Phản ứng xác nhận là biên nhận trước trả lời độc lập. Một phản ứng thành công không chứng minh rằng phản hồi văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra nhật ký Gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - các mục allowlist `groups`
    - cổng đề cập (`requireMention` + mẫu đề cập)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục sau ghi đè mục trước, nên chỉ giữ một `groupPolicy` cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime Gateway WhatsApp nên dùng Node. Bun bị đánh dấu là không tương thích cho vận hành Gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Prompt hệ thống

WhatsApp hỗ trợ prompt hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không deep merge). Việc tra cứu prompt sau đó chạy trên một map duy nhất thu được:

1. **Prompt hệ thống riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống nào.
2. **Prompt hệ thống wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không deep merge). Việc tra cứu prompt sau đó chạy trên một map duy nhất thu được:

1. **Prompt hệ thống riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống nào.
2. **Prompt hệ thống wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là vùng ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè prompt nằm trong `direct`.
</Note>

**Khác biệt so với hành vi đa tài khoản của Telegram:** Trong Telegram, `groups` ở gốc được chủ ý chặn đối với tất cả tài khoản trong thiết lập đa tài khoản — kể cả những tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà bot không tham gia. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` ở gốc và `direct` ở gốc luôn được các tài khoản không định nghĩa ghi đè cấp tài khoản kế thừa, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp đa tài khoản, nếu bạn muốn prompt nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa rõ ràng toàn bộ bản đồ dưới từng tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là bản đồ cấu hình theo từng nhóm vừa là danh sách cho phép nhóm ở cấp chat. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` nghĩa là "tất cả nhóm đều được chấp nhận" cho phạm vi đó.
- Chỉ thêm `systemPrompt` nhóm ký tự đại diện khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` làm mặc định prompt. Thay vào đó, hãy lặp lại prompt trên từng mục nhóm được cho phép rõ ràng.
- Việc chấp nhận nhóm và ủy quyền người gửi là hai bước kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bằng `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ đối với DM. `direct["*"]` chỉ cung cấp cấu hình chat trực tiếp mặc định sau khi DM đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc các quy tắc kho ghép nối.

Ví dụ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Con trỏ tham khảo cấu hình

Tham khảo chính:

- [Tham khảo cấu hình - WhatsApp](/vi/gateway/config-channels#whatsapp)

Các trường WhatsApp có tín hiệu cao:

- truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- đa tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, các ghi đè cấp tài khoản
- vận hành: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- hành vi phiên: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
