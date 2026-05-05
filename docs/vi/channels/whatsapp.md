---
read_when:
    - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:15:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp vào lần đầu bạn chọn nó.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` trên tag bản phát hành chính thức
  hiện tại.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Dùng gói trần để theo tag bản phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Trên Windows, Plugin WhatsApp cần Git trên `PATH` trong khi cài đặt npm vì
một trong các dependency Baileys/libsignal của nó được lấy từ một URL git. Cài đặt
Git for Windows, rồi khởi động lại shell và chạy lại cài đặt:

```powershell
winget install --id Git.Git -e
```

Portable Git cũng hoạt động nếu thư mục `bin` của nó nằm trên `PATH`.

<CardGroup cols={3}>
  <Card title="Ghép đôi" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép đôi đối với người gửi chưa biết.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa lỗi.
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

  <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Phê duyệt yêu cầu ghép đôi đầu tiên (nếu dùng chế độ ghép đôi)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép đôi hết hạn sau 1 giờ. Các yêu cầu đang chờ được giới hạn ở 3 yêu cầu trên mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Metadata kênh và luồng thiết lập được tối ưu cho cách thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (được khuyến nghị)">
    Đây là chế độ vận hành gọn nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ ràng hơn
    - giảm khả năng nhầm lẫn do tự chat

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

  <Accordion title="Phương án dự phòng bằng số cá nhân">
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi chạy, các biện pháp bảo vệ tự chat dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh chat tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng inbound, nên một phiên thiết bị đã liên kết đang yên lặng sẽ không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một ngưỡng im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame transport vẫn đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời điểm socket Baileys được đặt rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` điều khiển ping ứng dụng WhatsApp Web, `connectTimeoutMs` điều khiển timeout bắt tay mở kết nối, và `defaultQueryTimeoutMs` điều khiển timeout truy vấn Baileys.
- Gửi outbound yêu cầu một listener WhatsApp đang hoạt động cho tài khoản đích.
- Gửi nhóm đính kèm metadata nhắc đến gốc cho các token `@+<digits>` và `@<digits>` trong văn bản và chú thích media khi token khớp metadata người tham gia WhatsApp hiện tại, bao gồm các nhóm dựa trên LID.
- Chat trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng inbound: phiên thiết bị đã liên kết yên lặng vẫn duy trì khi các frame transport tiếp tục, nhưng transport bị treo sẽ buộc kết nối lại trước rất lâu so với đường ngắt kết nối từ xa muộn hơn.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gom DM vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là đích outbound tường minh bằng JID `@newsletter` gốc của chúng. Gửi outbound newsletter dùng metadata phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa phiên DM.
- Transport WhatsApp Web tôn trọng các biến môi trường proxy chuẩn trên host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp host hơn cài đặt proxy WhatsApp riêng theo kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw xóa phản ứng ack của WhatsApp sau khi một phản hồi hiển thị được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn inbound WhatsApp có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không broadcast payload hook inbound `message_received` đến các Plugin
trừ khi bạn chọn tham gia rõ ràng:

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

Bạn có thể giới hạn phạm vi chọn tham gia cho một tài khoản:

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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin cậy để nhận nội dung tin nhắn
và định danh inbound WhatsApp.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` điều khiển truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số kiểu E.164 (được chuẩn hóa nội bộ).

    `allowFrom` là danh sách kiểm soát truy cập người gửi DM. Nó không chặn gửi outbound tường minh đến JID nhóm WhatsApp hoặc JID kênh `@newsletter`.

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép đôi được lưu trong kho cho phép của kênh và được gộp với `allowFrom` đã cấu hình
    - tự động hóa đã lên lịch và fallback người nhận Heartbeat dùng đích gửi rõ ràng hoặc `allowFrom` đã cấu hình; phê duyệt ghép đôi DM không mặc nhiên là người nhận Cron hoặc Heartbeat
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép đôi DM outbound `fromMe` (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + danh sách cho phép">
    Truy cập nhóm có hai lớp:

    1. **Danh sách cho phép tư cách thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện
       - nếu có `groups`, nó đóng vai trò là danh sách cho phép nhóm (cho phép `"*"`)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua danh sách cho phép người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ inbound nhóm

    Fallback danh sách cho phép người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime fallback về `allowFrom` khi có
    - danh sách cho phép người gửi được đánh giá trước kích hoạt bằng nhắc đến/trả lời

    Lưu ý: nếu hoàn toàn không có block `channels.whatsapp`, fallback chính sách nhóm runtime là `allowlist` (kèm log cảnh báo), ngay cả khi đã đặt `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Nhắc đến + /activation">
    Trả lời nhóm mặc định yêu cầu nhắc đến.

    Phát hiện nhắc đến bao gồm:

    - nhắc đến WhatsApp tường minh tới danh tính bot
    - mẫu regex nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bản chép lời voice-note inbound cho tin nhắn nhóm được ủy quyền
    - phát hiện trả lời ngầm tới bot (người gửi trả lời khớp danh tính bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ thỏa mãn cổng nhắc đến; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của một người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được chặn theo chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự chat

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự chat WhatsApp được kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt tự chat
- bỏ qua hành vi tự kích hoạt bằng JID nhắc đến vốn sẽ ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, trả lời tự chat mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Envelope inbound + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong envelope inbound dùng chung.

    Nếu có một trả lời được trích dẫn, ngữ cảnh được nối thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường metadata trả lời cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 người gửi).
    Khi mục tiêu trả lời được trích dẫn là media có thể tải xuống, OpenClaw lưu nó qua
    kho media inbound bình thường và hiển thị nó dưới dạng `MediaPath`/`MediaType` để
    agent có thể kiểm tra hình ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn inbound chỉ có media được chuẩn hóa bằng các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note nhóm được ủy quyền được chép lời trước cổng nhắc đến khi
    body chỉ là `<media:audio>`, nên việc nói lời nhắc đến bot trong voice note có thể
    kích hoạt phản hồi. Nếu bản chép lời vẫn không nhắc đến bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Body vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được render dưới dạng metadata không đáng tin cậy có rào chắn, không phải văn bản prompt inline.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Đối với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Dấu đánh dấu chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật mặc định cho các tin nhắn WhatsApp gửi vào đã được chấp nhận.

    Vô hiệu hóa toàn cục:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ghi đè theo từng tài khoản:

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

    Các lượt tự trò chuyện bỏ qua biên nhận đã đọc ngay cả khi được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Phân phối, chia đoạn và phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó dự phòng về cách chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi ra">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, để các client WhatsApp hiển thị dưới dạng ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra Microsoft Edge TTS MP3/WebM, được chuyển mã bằng `ffmpeg` sang Ogg/Opus đơn âm 48 kHz trước khi phân phối PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý thành một ghi chú thoại và ngăn gửi lặp lại cho cùng phản hồi; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời nhiều phương tiện, ngoại trừ ghi chú thoại PTT sẽ gửi âm thanh trước và văn bản hiển thị riêng vì các client WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - mức trần lưu phương tiện gửi vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - mức trần gửi phương tiện ra: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (quét đổi kích thước/chất lượng) để phù hợp với giới hạn
    - khi gửi phương tiện thất bại, dự phòng cho mục đầu tiên sẽ gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó các phản hồi gửi ra hiển thị phần trích dẫn tin nhắn gửi vào. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như một tin nhắn thường                  |
| `"first"`   | Chỉ trích dẫn đoạn phản hồi gửi ra đầu tiên                           |
| `"all"`     | Trích dẫn mọi đoạn phản hồi gửi ra                                    |
| `"batched"` | Trích dẫn các phản hồi theo lô trong hàng đợi, còn phản hồi tức thì không trích dẫn |

Mặc định là `"off"`. Ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` điều khiển phạm vi agent sử dụng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do agent khởi tạo | Mô tả                                           |
| ------------- | ----------------- | -------------------------- | ----------------------------------------------- |
| `"off"`       | Không             | Không                      | Không có phản ứng nào                           |
| `"ack"`       | Có                | Không                      | Chỉ phản ứng xác nhận (biên nhận trước trả lời) |
| `"minimal"`   | Có                | Có (thận trọng)            | Xác nhận + phản ứng của agent với hướng dẫn thận trọng |
| `"extensive"` | Có                | Có (được khuyến khích)     | Xác nhận + phản ứng của agent với hướng dẫn được khuyến khích |

Mặc định: `"minimal"`.

Ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp hỗ trợ phản ứng xác nhận tức thì khi nhận tin nhắn gửi vào qua `channels.whatsapp.ackReaction`.
Phản ứng xác nhận bị chặn bởi `reactionLevel` — chúng bị bỏ qua khi `reactionLevel` là `"off"`.

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

- được gửi ngay sau khi tin nhắn gửi vào được chấp nhận (trước trả lời)
- lỗi được ghi log nhưng không chặn việc phân phối phản hồi bình thường
- chế độ nhóm `mentions` phản ứng trong các lượt được kích hoạt bằng nhắc đến; kích hoạt nhóm `always` đóng vai trò bỏ qua bước kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì dùng id tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích legacy">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định legacy trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, thao tác đăng xuất trước tiên dừng listener WhatsApp trực tiếp cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng listener trực tiếp trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực legacy, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ agent bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình do kênh khởi tạo được bật mặc định (vô hiệu hóa qua `channels.whatsapp.configWrites=false`).

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

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết với các lần ngắt kết nối hoặc thử kết nối lại lặp lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối vượt quá thời gian chờ tin nhắn thông thường; watchdog
    khởi động lại khi hoạt động vận chuyển WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng vượt quá cửa sổ an toàn dài hơn.

    Nếu log hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
    thời gian socket Baileys trong `web.whatsapp`. Bắt đầu bằng cách rút ngắn
    `keepAliveIntervalMs` xuống thấp hơn thời gian chờ nhàn rỗi của mạng và tăng
    `connectTimeoutMs` trên các kết nối chậm hoặc mất gói:

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

    Nếu `~/.openclaw/logs/whatsapp-health.log` ghi `Gateway inactive` nhưng
    `openclaw gateway status` và `openclaw channels status --probe` cho thấy
    Gateway và WhatsApp vẫn khỏe mạnh, hãy chạy `openclaw doctor`. Trên Linux, doctor
    cảnh báo về các mục crontab legacy vẫn gọi
    `~/.openclaw/bin/ensure-whatsapp.sh`; hãy xóa các mục cũ đó bằng
    `crontab -e` vì cron có thể thiếu môi trường systemd user-bus và
    khiến script cũ đó báo sai tình trạng Gateway.

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy tiêu chuẩn của máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến viết thường tương ứng và `NO_PROXY`). Xác minh quy trình Gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có listener hoạt động khi gửi">
    Các lần gửi ra thất bại nhanh khi không có listener Gateway hoạt động cho tài khoản đích.

    Hãy bảo đảm Gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong transcript nhưng không có trong WhatsApp">
    Các hàng transcript ghi lại nội dung agent đã tạo. Việc phân phối WhatsApp được kiểm tra riêng: OpenClaw chỉ coi một auto-reply là đã gửi sau khi Baileys trả về id tin nhắn gửi ra cho ít nhất một lần gửi văn bản hiển thị hoặc phương tiện.

    Phản ứng xác nhận là biên nhận trước trả lời độc lập. Một phản ứng thành công không chứng minh rằng phản hồi văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra log Gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - các mục danh sách cho phép `groups`
    - cổng nhắc đến (`requireMention` + mẫu nhắc đến)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục sau ghi đè mục trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime Gateway WhatsApp nên dùng Node. Bun được đánh dấu là không tương thích cho hoạt động Gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp hỗ trợ system prompts kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không deep merge). Sau đó việc tra cứu prompt chạy trên một map duy nhất thu được:

1. **System prompt dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị bỏ qua và không áp dụng system prompt nào.
2. **System prompt ký tự đại diện nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không deep merge). Sau đó việc tra cứu prompt chạy trên một map duy nhất thu được:

1. **Prompt hệ thống dành riêng cho trò chuyện trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của mục đó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard sẽ bị chặn và không áp dụng prompt hệ thống nào.
2. **Prompt hệ thống wildcard cho trò chuyện trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Các ghi đè prompt nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi đa tài khoản của Telegram:** Trong Telegram, `groups` ở root được chủ ý chặn cho tất cả tài khoản trong thiết lập đa tài khoản — kể cả những tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà nó không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` ở root và `direct` ở root luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè ở cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp đa tài khoản, nếu bạn muốn prompt nhóm hoặc trò chuyện trực tiếp theo từng tài khoản, hãy định nghĩa rõ toàn bộ map dưới từng tài khoản thay vì dựa vào mặc định ở cấp root.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo từng nhóm vừa là allowlist nhóm ở cấp chat. Ở phạm vi root hoặc tài khoản, `groups["*"]` nghĩa là "tất cả nhóm đều được chấp nhận" cho phạm vi đó.
- Chỉ thêm wildcard nhóm `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` làm mặc định prompt. Thay vào đó, hãy lặp lại prompt trên từng mục nhóm được allowlist rõ ràng.
- Việc chấp nhận nhóm và ủy quyền người gửi là các kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền cho mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có tác dụng phụ tương tự đối với DM. `direct["*"]` chỉ cung cấp cấu hình trò chuyện trực tiếp mặc định sau khi một DM đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc các quy tắc pairing-store.

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

## Con trỏ tham chiếu cấu hình

Tham chiếu chính:

- [Tham chiếu cấu hình - WhatsApp](/vi/gateway/config-channels#whatsapp)

Các trường WhatsApp có tín hiệu cao:

- truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- gửi nhận: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
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
