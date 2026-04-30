---
read_when:
    - Làm việc với hành vi của kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi nhận và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:34:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu các phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  nhắc cài đặt Plugin WhatsApp trong lần đầu bạn chọn Plugin này.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có mặt.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` khi một gói hiện tại
  đã được phát hành.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Nếu npm báo gói do OpenClaw sở hữu là đã ngừng dùng hoặc bị thiếu, hãy dùng một
bản dựng OpenClaw hiện tại đã đóng gói hoặc một checkout cục bộ cho đến khi chuỗi
phát hành gói npm bắt kịp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối cho người gửi chưa biết.
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

    Yêu cầu ghép nối hết hạn sau 1 giờ. Các yêu cầu đang chờ được giới hạn ở 3 yêu cầu cho mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Metadata kênh và luồng thiết lập được tối ưu hóa cho cách thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số riêng (khuyến nghị)">
    Đây là chế độ vận hành gọn gàng nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ ràng hơn
    - ít khả năng nhầm lẫn tự chat hơn

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
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Trong runtime, các biện pháp bảo vệ tự chat dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ WhatsApp Web">
    Kênh nền tảng nhắn tin hiện dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh hiện tại của OpenClaw.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh chat tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng gửi đến, nên một phiên thiết bị đã liên kết đang yên tĩnh sẽ không bị khởi động lại chỉ vì gần đây chưa có ai gửi tin nhắn. Giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame transport tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho một phiên gần đây còn hoạt động, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời điểm socket Baileys được khai báo rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` điều khiển ping ứng dụng WhatsApp Web, `connectTimeoutMs` điều khiển timeout bắt tay mở kết nối, và `defaultQueryTimeoutMs` điều khiển timeout truy vấn Baileys.
- Gửi đi yêu cầu một listener WhatsApp đang hoạt động cho tài khoản đích.
- Chat trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng gửi đến: các phiên thiết bị đã liên kết yên tĩnh vẫn duy trì khi frame transport tiếp tục, nhưng transport bị treo sẽ buộc kết nối lại sớm hơn nhiều so với đường ngắt kết nối từ xa về sau.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web tôn trọng các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn cài đặt proxy WhatsApp riêng theo kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng ack WhatsApp sau khi một trả lời hiển thị được gửi thành công.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp gửi đến có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
mã định danh nhóm, tên người gửi, và các trường tương quan phiên. Vì lý do đó,
WhatsApp không broadcast payload hook `message_received` gửi đến cho các Plugin
trừ khi bạn chủ động opt in:

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

Bạn có thể giới hạn opt-in cho một tài khoản:

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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin cậy để nhận nội dung và mã định
danh tin nhắn WhatsApp gửi đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` điều khiển truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số kiểu E.164 (được chuẩn hóa nội bộ).

    Ghi đè đa tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép nối được lưu trong allow-store của kênh và hợp nhất với `allowFrom` đã cấu hình
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối DM `fromMe` gửi đi (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + allowlist">
    Truy cập nhóm có hai lớp:

    1. **Allowlist thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, tất cả nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như allowlist nhóm (cho phép `"*"`)

    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn tất cả tin nhắn gửi đến trong nhóm

    Dự phòng allowlist người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime quay về dùng `allowFrom` khi có
    - allowlist người gửi được đánh giá trước kích hoạt bằng nhắc tên/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, dự phòng chính sách nhóm runtime là `allowlist` (kèm log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Nhắc tên + /activation">
    Trả lời trong nhóm mặc định yêu cầu nhắc tên.

    Phát hiện nhắc tên bao gồm:

    - nhắc tên WhatsApp rõ ràng đến danh tính bot
    - các mẫu regex nhắc tên đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời voice note gửi đến cho tin nhắn nhóm đã được ủy quyền
    - phát hiện trả lời ngầm đến bot (người gửi trả lời khớp danh tính bot)

    Lưu ý bảo mật:

    - quote/trả lời chỉ thỏa mãn cổng nhắc tên; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của một người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Lệnh này được kiểm soát theo chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự chat

Khi số tự thân đã liên kết cũng có mặt trong `allowFrom`, các biện pháp bảo vệ tự chat của WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho lượt tự chat
- bỏ qua hành vi tự động kích hoạt bằng mention-JID mà nếu không sẽ ping chính bạn
- nếu `messages.responsePrefix` chưa được đặt, trả lời tự chat mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Envelope gửi đến + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong envelope gửi đến dùng chung.

    Nếu có một trả lời được trích dẫn, ngữ cảnh được thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường metadata trả lời cũng được điền khi có sẵn (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn gửi đến chỉ có media được chuẩn hóa bằng các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note nhóm đã được ủy quyền được chép lời trước cổng nhắc tên khi
    nội dung chỉ là `<media:audio>`, nên việc nói lời nhắc tên bot trong voice note có thể
    kích hoạt trả lời. Nếu bản chép lời vẫn không nhắc đến bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được render dưới dạng metadata không tin cậy trong fenced block, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Với nhóm, tin nhắn chưa xử lý có thể được buffer và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt tính năng này

    Marker chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật theo mặc định cho các tin nhắn WhatsApp gửi đến được chấp nhận.

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

    Lượt tự chat bỏ qua biên nhận đã đọc ngay cả khi được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn và media

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), rồi quay về chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, nên ứng dụng WhatsApp hiển thị dưới dạng ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi provider trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM của Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus mono 48 kHz trước khi gửi PTT
    - `/tts latest` gửi câu trả lời mới nhất của trợ lý dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng câu trả lời; `/tts chat on|off|default` kiểm soát auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời đa phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện gửi đến: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (đổi kích thước/quét chất lượng) để vừa giới hạn
    - khi gửi phương tiện thất bại, dự phòng cho mục đầu tiên sẽ gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó các câu trả lời gửi đi trích dẫn trực quan tin nhắn gửi đến. Kiểm soát bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi dưới dạng tin nhắn thường                |
| `"first"`   | Chỉ trích dẫn phần trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi phần trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các trả lời theo lô trong hàng đợi, còn trả lời tức thời thì không trích dẫn |

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

## Mức độ phản ứng

`channels.whatsapp.reactionLevel` kiểm soát phạm vi tác nhân dùng phản ứng emoji trên WhatsApp:

| Mức độ        | Phản ứng xác nhận | Phản ứng do tác nhân khởi tạo | Mô tả                                                |
| ------------- | ----------------- | ----------------------------- | ---------------------------------------------------- |
| `"off"`       | Không             | Không                         | Hoàn toàn không có phản ứng                          |
| `"ack"`       | Có                | Không                         | Chỉ phản ứng xác nhận (biên nhận trước trả lời)      |
| `"minimal"`   | Có                | Có (thận trọng)               | Xác nhận + phản ứng của tác nhân với hướng dẫn thận trọng |
| `"extensive"` | Có                | Có (được khuyến khích)        | Xác nhận + phản ứng của tác nhân với hướng dẫn khuyến khích |

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

WhatsApp hỗ trợ phản ứng xác nhận tức thời khi nhận tin nhắn gửi đến qua `channels.whatsapp.ackReaction`.
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

- được gửi ngay sau khi tin nhắn gửi đến được chấp nhận (trước trả lời)
- lỗi được ghi log nhưng không chặn việc gửi trả lời bình thường
- chế độ nhóm `mentions` phản ứng ở các lượt được kích hoạt bằng đề cập; kích hoạt nhóm `always` đóng vai trò bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - lựa chọn tài khoản mặc định: `default` nếu có, nếu không thì id tài khoản đã cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích legacy">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định legacy trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Trong các thư mục xác thực legacy, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ của tác nhân bao gồm hành động phản ứng WhatsApp (`react`).
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
    Triệu chứng: tài khoản đã liên kết với các lần ngắt kết nối hoặc thử kết nối lại lặp lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn bình thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động ở cấp ứng dụng im lặng quá cửa sổ an toàn dài hơn.

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

    Cách sửa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy tiêu chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến viết thường tương ứng, và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe đang hoạt động khi gửi">
    Các lần gửi đi thất bại nhanh khi không có trình lắng nghe gateway đang hoạt động cho tài khoản đích.

    Hãy đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Trả lời xuất hiện trong transcript nhưng không có trong WhatsApp">
    Các hàng transcript ghi lại nội dung tác nhân đã tạo. Việc gửi qua WhatsApp được kiểm tra riêng: OpenClaw chỉ xem một trả lời tự động là đã gửi sau khi Baileys trả về id tin nhắn gửi đi cho ít nhất một lần gửi văn bản hiển thị hoặc phương tiện.

    Phản ứng xác nhận là các biên nhận trước trả lời độc lập. Một phản ứng thành công không chứng minh rằng phần trả lời văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra log gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục danh sách cho phép `groups`
    - cổng đề cập (`requireMention` + mẫu đề cập)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục sau ghi đè mục trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime Gateway WhatsApp nên dùng Node. Bun bị đánh dấu là không tương thích cho hoạt động Gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Lời nhắc hệ thống

WhatsApp hỗ trợ lời nhắc hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không gộp sâu). Sau đó tra cứu lời nhắc chạy trên map đơn kết quả:

1. **Lời nhắc hệ thống riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của mục đó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng lời nhắc hệ thống nào.
2. **Lời nhắc hệ thống wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không gộp sâu). Sau đó tra cứu lời nhắc chạy trên map đơn kết quả:

1. **Lời nhắc hệ thống riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của mục đó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng lời nhắc hệ thống nào.
2. **Lời nhắc hệ thống wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn vắng mặt trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là nhóm ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè lời nhắc nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi nhiều tài khoản của Telegram:** Trong Telegram, `groups` gốc được cố ý chặn cho tất cả tài khoản trong thiết lập nhiều tài khoản — kể cả các tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm cho các nhóm mà bot không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` gốc và `direct` gốc luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp nhiều tài khoản, nếu bạn muốn lời nhắc nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa rõ map đầy đủ dưới mỗi tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là bản đồ cấu hình theo từng nhóm vừa là danh sách cho phép nhóm ở cấp cuộc trò chuyện. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` nghĩa là "tất cả nhóm đều được chấp nhận" cho phạm vi đó.
- Chỉ thêm nhóm ký tự đại diện `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập hợp ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` cho mặc định lời nhắc. Thay vào đó, hãy lặp lại lời nhắc trên từng mục nhóm được cho phép rõ ràng.
- Việc chấp nhận nhóm và ủy quyền người gửi là các bước kiểm tra riêng biệt. `groups["*"]` mở rộng tập hợp nhóm có thể đi tới xử lý nhóm, nhưng riêng nó không ủy quyền cho mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bằng `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ đối với tin nhắn trực tiếp. `direct["*"]` chỉ cung cấp cấu hình cuộc trò chuyện trực tiếp mặc định sau khi một tin nhắn trực tiếp đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc các quy tắc kho lưu trữ ghép nối.

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
- gửi đi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- nhiều tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, ghi đè ở cấp tài khoản
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
