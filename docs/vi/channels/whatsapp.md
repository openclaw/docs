---
read_when:
    - Đang xử lý hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi tin và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu các phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt WhatsApp plugin trong lần đầu bạn chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` khi gói hiện tại
  đã được phát hành.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Nếu npm báo gói do OpenClaw sở hữu đã bị ngừng dùng hoặc bị thiếu, hãy dùng một
bản dựng OpenClaw đã đóng gói hiện tại hoặc một checkout cục bộ cho đến khi tuyến
gói npm bắt kịp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối cho người gửi không xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
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

    Yêu cầu ghép nối hết hạn sau 1 giờ. Số yêu cầu đang chờ được giới hạn ở 3 cho mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu cho thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (khuyến nghị)">
    Đây là chế độ vận hành gọn nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ hơn
    - ít khả năng nhầm lẫn với tự trò chuyện hơn

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
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự trò chuyện:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi chạy, các biện pháp bảo vệ tự trò chuyện dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh trò chuyện tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport của WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đến, nên một phiên thiết bị đã liên kết yên lặng sẽ không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một ngưỡng im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame transport tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên mới hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời điểm socket Baileys được đặt rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` kiểm soát ping ứng dụng WhatsApp Web, `connectTimeoutMs` kiểm soát timeout bắt tay mở kết nối, và `defaultQueryTimeoutMs` kiểm soát timeout truy vấn Baileys.
- Gửi đi yêu cầu một listener WhatsApp đang hoạt động cho tài khoản đích.
- Chat trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport của WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đến: phiên thiết bị đã liên kết yên lặng vẫn duy trì khi các frame transport tiếp tục, nhưng transport bị treo sẽ buộc kết nối lại rất lâu trước đường ngắt kết nối từ xa về sau.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được tách riêng (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là đích gửi đi rõ ràng bằng JID `@newsletter` gốc. Lượt gửi newsletter đi dùng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa phiên DM.
- Transport WhatsApp Web tuân theo các biến môi trường proxy chuẩn trên máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn cài đặt proxy WhatsApp riêng theo kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng ack WhatsApp sau khi một phản hồi hiển thị được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đến có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không phát payload hook `message_received` đến plugin trừ khi bạn
chọn tham gia rõ ràng:

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

Chỉ bật tùy chọn này cho plugin mà bạn tin tưởng để nhận nội dung và định danh
tin nhắn WhatsApp đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát quyền truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số theo kiểu E.164 (được chuẩn hóa nội bộ).

    `allowFrom` là danh sách kiểm soát truy cập người gửi DM. Nó không chặn lượt gửi đi rõ ràng đến JID nhóm WhatsApp hoặc JID kênh `@newsletter`.

    Ghi đè đa tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) có mức ưu tiên cao hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép nối được lưu trong kho cho phép của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và fallback người nhận Heartbeat dùng đích gửi rõ ràng hoặc `allowFrom` đã cấu hình; phê duyệt ghép nối DM không mặc nhiên là người nhận Cron hoặc Heartbeat
    - nếu không cấu hình danh sách cho phép, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối các DM `fromMe` gửi đi (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + danh sách cho phép">
    Quyền truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như danh sách cho phép nhóm (`"*"` được phép)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua danh sách cho phép người gửi
       - `allowlist`: người gửi phải khớp với `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn mọi tin nhắn đến trong nhóm

    Fallback danh sách cho phép người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime fallback sang `allowFrom` khi có
    - danh sách cho phép người gửi được đánh giá trước kích hoạt bằng nhắc đến/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, fallback chính sách nhóm runtime là `allowlist` (kèm log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Nhắc đến + /activation">
    Trả lời trong nhóm yêu cầu nhắc đến theo mặc định.

    Phát hiện nhắc đến bao gồm:

    - nhắc đến WhatsApp rõ ràng tới danh tính bot
    - mẫu regex nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bản chép lời voice note đến cho tin nhắn nhóm đã được ủy quyền
    - phát hiện trả lời bot ngầm định (người gửi trả lời khớp với danh tính bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ thỏa mãn cổng nhắc đến; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong danh sách cho phép vẫn bị chặn ngay cả khi họ trả lời tin nhắn của một người dùng nằm trong danh sách cho phép

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được giới hạn bởi chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự trò chuyện

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự trò chuyện WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt tự trò chuyện
- bỏ qua hành vi tự động kích hoạt mention-JID vốn sẽ tự ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, phản hồi tự trò chuyện mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì đến + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong phong bì đến dùng chung.

    Nếu có trả lời được trích dẫn, ngữ cảnh được thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).
    Khi đích trả lời được trích dẫn là media có thể tải xuống, OpenClaw lưu nó qua
    kho media đến thông thường và hiển thị dưới dạng `MediaPath`/`MediaType` để
    agent có thể kiểm tra hình ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn đến chỉ có media được chuẩn hóa bằng các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note nhóm đã được ủy quyền được chép lời trước cổng nhắc đến khi
    nội dung chỉ là `<media:audio>`, nên việc nói lời nhắc đến bot trong voice note có thể
    kích hoạt phản hồi. Nếu bản chép lời vẫn không nhắc đến bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được render dưới dạng siêu dữ liệu không tin cậy trong khối fenced, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` tắt

    Marker chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật theo mặc định cho tin nhắn WhatsApp đến được chấp nhận.

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

    Các lượt tự trò chuyện bỏ qua biên nhận đã đọc ngay cả khi được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Phân phối, chia đoạn và phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), rồi quay về chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, vì vậy ứng dụng WhatsApp hiển thị nó như ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi provider trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM của Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus mono 48 kHz trước khi phân phối PTT
    - `/tts latest` gửi câu trả lời mới nhất của assistant dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng câu trả lời; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - phát GIF động được hỗ trợ qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời đa phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện đến: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để vừa giới hạn
    - khi gửi phương tiện thất bại, dự phòng cho mục đầu tiên sẽ gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó các trả lời gửi đi trích dẫn rõ tin nhắn đến. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thường                      |
| `"first"`   | Chỉ trích dẫn đoạn trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi đoạn trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các trả lời theo lô đã xếp hàng, còn trả lời tức thì không trích dẫn |

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

`channels.whatsapp.reactionLevel` điều khiển phạm vi agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do agent khởi tạo | Mô tả                                                |
| ------------- | ----------------- | -------------------------- | ---------------------------------------------------- |
| `"off"`       | Không             | Không                      | Không có phản ứng nào                                |
| `"ack"`       | Có                | Không                      | Chỉ phản ứng xác nhận (biên nhận trước trả lời)      |
| `"minimal"`   | Có                | Có (thận trọng)            | Xác nhận + phản ứng của agent với hướng dẫn thận trọng |
| `"extensive"` | Có                | Có (được khuyến khích)     | Xác nhận + phản ứng của agent với hướng dẫn khuyến khích |

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

WhatsApp hỗ trợ phản ứng xác nhận tức thì khi nhận tin nhắn đến qua `channels.whatsapp.ackReaction`.
Phản ứng xác nhận chịu sự kiểm soát của `reactionLevel` — chúng bị chặn khi `reactionLevel` là `"off"`.

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

- được gửi ngay sau khi tin nhắn đến được chấp nhận (trước trả lời)
- lỗi được ghi log nhưng không chặn phân phối trả lời bình thường
- chế độ nhóm `mentions` phản ứng trên các lượt được kích hoạt bằng lượt nhắc; kích hoạt nhóm `always` đóng vai trò bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Đa tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản lấy từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì là id tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, đăng xuất trước tiên dừng listener WhatsApp trực tiếp cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng listener trực tiếp trước khi tắt hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ agent bao gồm hành động phản ứng WhatsApp (`react`).
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

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết bị ngắt kết nối lặp lại hoặc liên tục thử kết nối lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn thông thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng vượt quá cửa sổ an toàn dài hơn.

    Nếu log hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
    thời gian socket Baileys trong `web.whatsapp`. Bắt đầu bằng cách rút ngắn
    `keepAliveIntervalMs` thấp hơn thời gian chờ nhàn rỗi của mạng và tăng
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

    Nếu `~/.openclaw/logs/whatsapp-health.log` nói `Gateway inactive` nhưng
    `openclaw gateway status` và `openclaw channels status --probe` cho thấy
    gateway và WhatsApp khỏe mạnh, hãy chạy `openclaw doctor`. Trên Linux, doctor
    cảnh báo về các mục crontab cũ vẫn gọi
    `~/.openclaw/bin/ensure-whatsapp.sh`; xóa các mục lỗi thời đó bằng
    `crontab -e` vì cron có thể thiếu môi trường systemd user-bus và
    khiến script cũ đó báo sai tình trạng gateway.

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có listener hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có listener gateway hoạt động cho tài khoản đích.

    Hãy chắc chắn gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Trả lời xuất hiện trong bản ghi nhưng không có trong WhatsApp">
    Các hàng bản ghi lưu lại nội dung agent đã tạo. Việc phân phối WhatsApp được kiểm tra riêng: OpenClaw chỉ coi một auto-reply là đã gửi sau khi Baileys trả về id tin nhắn gửi đi cho ít nhất một lần gửi văn bản hiển thị hoặc phương tiện.

    Phản ứng xác nhận là biên nhận trước trả lời độc lập. Một phản ứng thành công không chứng minh rằng trả lời văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra log gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục allowlist `groups`
    - cổng lượt nhắc (`requireMention` + mẫu lượt nhắc)
    - khóa trùng lặp trong `openclaw.json` (JSON5): mục phía sau ghi đè mục phía trước, vì vậy chỉ giữ một `groupPolicy` cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun bị đánh dấu là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp hỗ trợ system prompt kiểu Telegram cho nhóm và trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không deep merge). Sau đó tra cứu prompt chạy trên map đơn thu được:

1. **System prompt riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không có system prompt nào được áp dụng.
2. **System prompt wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không deep merge). Sau đó tra cứu prompt chạy trên map đơn thu được:

1. **System prompt riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không có system prompt nào được áp dụng.
2. **System prompt wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn vắng mặt trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè prompt nằm trong `direct`.
</Note>

**Khác biệt so với hành vi đa tài khoản của Telegram:** Trong Telegram, `groups` gốc được chủ ý tắt đối với tất cả tài khoản trong một thiết lập đa tài khoản — kể cả các tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà bot không thuộc về. WhatsApp không áp dụng biện pháp bảo vệ này: `groups` gốc và `direct` gốc luôn được các tài khoản không định nghĩa ghi đè ở cấp tài khoản kế thừa, bất kể có bao nhiêu tài khoản được cấu hình. Trong một thiết lập WhatsApp đa tài khoản, nếu bạn muốn prompt nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa rõ ràng toàn bộ map dưới mỗi tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo từng nhóm, vừa là danh sách cho phép nhóm ở cấp trò chuyện. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` có nghĩa là "tất cả nhóm được chấp nhận" cho phạm vi đó.
- Chỉ thêm wildcard group `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` làm mặc định cho prompt. Thay vào đó, hãy lặp lại prompt trên từng mục nhóm được đưa vào danh sách cho phép một cách rõ ràng.
- Việc chấp nhận nhóm và ủy quyền người gửi là hai kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền cho mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ đối với DM. `direct["*"]` chỉ cung cấp cấu hình trò chuyện trực tiếp mặc định sau khi một DM đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc các quy tắc kho ghép nối.

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

Các trường WhatsApp quan trọng:

- quyền truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- đa tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, các ghi đè ở cấp tài khoản
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
