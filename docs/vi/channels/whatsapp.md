---
read_when:
    - Làm việc trên hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi tin và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu các phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp trong lần đầu bạn chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` trên thẻ phát hành chính thức
  hiện tại.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Dùng gói trần để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một phiên bản
chính xác khi bạn cần một bản cài đặt có thể tái tạo.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối đối với người gửi không xác định.
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

  <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Phê duyệt yêu cầu ghép nối đầu tiên (nếu dùng chế độ ghép nối)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép nối hết hạn sau 1 giờ. Các yêu cầu đang chờ được giới hạn ở mức 3 yêu cầu cho mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu cho kiểu thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Các mẫu triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (khuyến nghị)">
    Đây là chế độ vận hành gọn nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ hơn
    - giảm khả năng nhầm lẫn khi tự nhắn với chính mình

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
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự nhắn:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi chạy, các bảo vệ tự nhắn dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ dùng WhatsApp Web">
    Kênh nền tảng nhắn tin hiện dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh hiện tại của OpenClaw.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh chat tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào, nên một phiên thiết bị đã liên kết yên lặng sẽ không bị khởi động lại chỉ vì gần đây chưa ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các transport frame vẫn tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng thời gian chờ tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời gian socket Baileys được khai báo rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` điều khiển ping ứng dụng WhatsApp Web, `connectTimeoutMs` điều khiển thời gian chờ bắt tay mở kết nối, và `defaultQueryTimeoutMs` điều khiển thời gian chờ truy vấn Baileys.
- Gửi đi yêu cầu có listener WhatsApp đang hoạt động cho tài khoản đích.
- Các cuộc chat trạng thái và phát sóng bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào: các phiên thiết bị đã liên kết yên lặng vẫn duy trì khi transport frame tiếp tục, nhưng một điểm nghẽn transport sẽ buộc kết nối lại trước rất lâu so với đường ngắt kết nối từ xa muộn hơn.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của tác tử).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là mục tiêu gửi đi tường minh với JID `@newsletter` gốc của chúng. Gửi newsletter đi dùng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa phiên DM.
- Transport WhatsApp Web tôn trọng các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn thiết lập proxy WhatsApp riêng theo kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw xóa phản ứng xác nhận WhatsApp sau khi phản hồi hiển thị đã được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đi vào có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không phát các payload hook `message_received` đi vào tới Plugin
trừ khi bạn bật rõ ràng:

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

Bạn có thể giới hạn việc bật này cho một tài khoản:

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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin cậy để nhận nội dung và định danh
tin nhắn WhatsApp đi vào.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` điều khiển quyền truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số theo kiểu E.164 (được chuẩn hóa nội bộ).

    `allowFrom` là danh sách kiểm soát truy cập người gửi DM. Nó không chặn các lượt gửi đi tường minh tới JID nhóm WhatsApp hoặc JID kênh `@newsletter`.

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép nối được lưu trong allow-store của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa đã lên lịch và dự phòng người nhận Heartbeat dùng các mục tiêu gửi tường minh hoặc `allowFrom` đã cấu hình; phê duyệt ghép nối DM không ngầm trở thành người nhận Cron hoặc Heartbeat
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối các DM `fromMe` gửi đi (tin nhắn bạn tự gửi cho mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + danh sách cho phép">
    Truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như danh sách cho phép nhóm (`"*"` được cho phép)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua danh sách cho phép người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ nội dung nhóm đi vào

    Dự phòng danh sách cho phép người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime sẽ dự phòng về `allowFrom` khi có
    - danh sách cho phép người gửi được đánh giá trước kích hoạt bằng nhắc tên/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, dự phòng chính sách nhóm runtime là `allowlist` (kèm log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` đã được đặt.

  </Tab>

  <Tab title="Nhắc tên + /activation">
    Trả lời trong nhóm mặc định yêu cầu nhắc tên.

    Phát hiện nhắc tên bao gồm:

    - nhắc tên WhatsApp tường minh tới danh tính bot
    - các mẫu regex nhắc tên đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi âm thoại đi vào cho tin nhắn nhóm đã được ủy quyền
    - phát hiện trả lời ngầm tới bot (người gửi trả lời khớp danh tính bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ đáp ứng cổng nhắc tên; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong danh sách cho phép vẫn bị chặn ngay cả khi họ trả lời tin nhắn của một người dùng nằm trong danh sách cho phép

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Việc này được giới hạn theo chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự nhắn

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự nhắn WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho các lượt tự nhắn
- bỏ qua hành vi tự động kích hoạt mention-JID vốn sẽ ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, trả lời tự nhắn mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì đi vào + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong phong bì đi vào dùng chung.

    Nếu có trả lời được trích dẫn, ngữ cảnh được nối thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).
    Khi mục tiêu trả lời được trích dẫn là media có thể tải xuống, OpenClaw lưu nó qua
    kho media đi vào bình thường và phơi bày dưới dạng `MediaPath`/`MediaType` để
    tác tử có thể kiểm tra hình ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn chỉ có media đi vào được chuẩn hóa bằng các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ghi âm thoại nhóm đã được ủy quyền được chép lời trước cổng nhắc tên khi
    phần nội dung chỉ là `<media:audio>`, nên việc nói lời nhắc tên bot trong ghi âm thoại có thể
    kích hoạt trả lời. Nếu bản chép lời vẫn không nhắc tên bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được render dưới dạng siêu dữ liệu không tin cậy có rào mã, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Đối với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Dấu chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật mặc định cho các tin nhắn WhatsApp đi vào được chấp nhận.

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

    Các lượt tự trò chuyện bỏ qua biên nhận đã đọc ngay cả khi được bật ở phạm vi toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn và phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó quay về chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, nên ứng dụng WhatsApp hiển thị nó như ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM từ Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus đơn âm 48 kHz trước khi gửi PTT
    - `/tts latest` gửi câu trả lời mới nhất của trợ lý dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng câu trả lời; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời nhiều phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện nhận vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để vừa giới hạn
    - khi gửi phương tiện thất bại, dự phòng cho mục đầu tiên gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó các trả lời gửi đi hiển thị phần trích dẫn tin nhắn nhận vào. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thuần                       |
| `"first"`   | Chỉ trích dẫn đoạn trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi đoạn trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các trả lời theo lô trong hàng đợi, còn trả lời tức thời thì không trích dẫn |

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

`channels.whatsapp.reactionLevel` điều khiển mức độ rộng mà agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do agent khởi tạo | Mô tả                                                |
| ------------- | ----------------- | -------------------------- | ---------------------------------------------------- |
| `"off"`       | Không             | Không                      | Hoàn toàn không có phản ứng                          |
| `"ack"`       | Có                | Không                      | Chỉ phản ứng xác nhận (biên nhận trước trả lời)      |
| `"minimal"`   | Có                | Có (thận trọng)            | Xác nhận + phản ứng của agent với hướng dẫn thận trọng |
| `"extensive"` | Có                | Có (khuyến khích)          | Xác nhận + phản ứng của agent với hướng dẫn khuyến khích |

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

WhatsApp hỗ trợ phản ứng xác nhận ngay khi nhận tin đến qua `channels.whatsapp.ackReaction`.
Phản ứng xác nhận được kiểm soát bởi `reactionLevel` — chúng bị chặn khi `reactionLevel` là `"off"`.

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

- được gửi ngay sau khi tin nhận vào được chấp nhận (trước trả lời)
- lỗi được ghi log nhưng không chặn gửi trả lời bình thường
- chế độ nhóm `mentions` phản ứng trên các lượt được kích hoạt bởi lượt nhắc đến; kích hoạt nhóm `always` hoạt động như cơ chế bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - lựa chọn tài khoản mặc định: `default` nếu có, nếu không thì là id tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di trú cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, đăng xuất trước tiên dừng trình lắng nghe WhatsApp đang chạy cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe đang chạy trước khi tắt hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ của agent bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình do kênh khởi tạo được bật theo mặc định (tắt qua `channels.whatsapp.configWrites=false`).

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Chưa liên kết (cần QR)">
    Triệu chứng: trạng thái kênh báo chưa liên kết.

    Cách sửa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết bị ngắt kết nối lặp lại hoặc liên tục cố kết nối lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn bình thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng quá cửa sổ an toàn dài hơn.

    Nếu log hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
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

    Cách sửa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` báo `Gateway inactive` nhưng
    `openclaw gateway status` và `openclaw channels status --probe` cho thấy
    gateway và WhatsApp đều khỏe mạnh, hãy chạy `openclaw doctor`. Trên Linux, doctor
    cảnh báo về các mục crontab cũ vẫn gọi
    `~/.openclaw/bin/ensure-whatsapp.sh`; xóa các mục lỗi thời đó bằng
    `crontab -e` vì cron có thể thiếu môi trường user-bus của systemd và
    khiến script cũ đó báo sai tình trạng sức khỏe gateway.

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc socket TLS bị ngắt kết nối.

    Đăng nhập WhatsApp Web dùng môi trường proxy tiêu chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng, và `NO_PROXY`). Xác minh tiến trình gateway kế thừa proxy env và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có trình lắng nghe gateway đang hoạt động cho tài khoản đích.

    Hãy đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Trả lời xuất hiện trong transcript nhưng không có trong WhatsApp">
    Các hàng transcript ghi lại nội dung agent đã tạo. Việc gửi đến WhatsApp được kiểm tra riêng: OpenClaw chỉ xem một auto-reply là đã gửi sau khi Baileys trả về id tin nhắn gửi đi cho ít nhất một lần gửi văn bản hiển thị hoặc phương tiện.

    Phản ứng xác nhận là biên nhận trước trả lời độc lập. Một phản ứng thành công không chứng minh rằng phần trả lời văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra log gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - các mục danh sách cho phép `groups`
    - cổng nhắc đến (`requireMention` + mẫu nhắc đến)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục phía sau ghi đè mục phía trước, nên chỉ giữ một `groupPolicy` cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun được gắn cờ là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Prompt hệ thống

WhatsApp hỗ trợ prompt hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Phân cấp phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không gộp sâu). Sau đó, tra cứu prompt chạy trên một map duy nhất thu được:

1. **Prompt hệ thống dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống nào.
2. **Prompt hệ thống wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Phân cấp phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không gộp sâu). Sau đó, tra cứu prompt chạy trên một map duy nhất thu được:

1. **Prompt hệ thống dành riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống nào.
2. **Prompt hệ thống wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử gọn nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè prompt nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi đa tài khoản của Telegram:** Trong Telegram, `groups` cấp gốc được chủ ý loại bỏ đối với tất cả tài khoản trong thiết lập đa tài khoản — kể cả các tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà bot không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` cấp gốc và `direct` cấp gốc luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè ở cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp đa tài khoản, nếu bạn muốn lời nhắc nhóm hoặc trực tiếp riêng cho từng tài khoản, hãy định nghĩa rõ ràng toàn bộ ánh xạ trong từng tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là ánh xạ cấu hình theo từng nhóm vừa là danh sách cho phép nhóm ở cấp trò chuyện. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` có nghĩa là "tất cả nhóm đều được chấp nhận" cho phạm vi đó.
- Chỉ thêm ký tự đại diện nhóm `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập cố định các ID nhóm đủ điều kiện, đừng dùng `groups["*"]` làm mặc định lời nhắc. Thay vào đó, hãy lặp lại lời nhắc trên từng mục nhóm được cho phép rõ ràng.
- Việc chấp nhận nhóm và ủy quyền người gửi là hai bước kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ đối với tin nhắn trực tiếp. `direct["*"]` chỉ cung cấp cấu hình trò chuyện trực tiếp mặc định sau khi một tin nhắn trực tiếp đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc các quy tắc kho ghép nối.

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

## Các mục tham khảo cấu hình

Tài liệu tham khảo chính:

- [Tài liệu tham khảo cấu hình - WhatsApp](/vi/gateway/config-channels#whatsapp)

Các trường WhatsApp quan trọng:

- truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- đa tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, các ghi đè cấp tài khoản
- vận hành: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- hành vi phiên: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- lời nhắc: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
