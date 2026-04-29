---
read_when:
    - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T22:28:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5acfebb37e16c4a3602ead7c9a4f2e16315d07612dc1e929f30fb7b1bc37761
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho sản xuất qua WhatsApp Web (Baileys). Gateway sở hữu (các) phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Quy trình khởi tạo (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp vào lần đầu bạn chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` khi gói hiện tại
  đã được phát hành.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Nếu npm báo gói do OpenClaw sở hữu đã bị ngừng hỗ trợ hoặc bị thiếu, hãy dùng
bản dựng OpenClaw đã đóng gói hiện tại hoặc một bản checkout cục bộ cho đến khi
luồng phát hành gói npm bắt kịp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối đối với người gửi chưa biết.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và các playbook sửa chữa.
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

    Yêu cầu ghép nối hết hạn sau 1 giờ. Các yêu cầu đang chờ được giới hạn ở 3 yêu cầu mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu cho thiết lập đó, nhưng các thiết lập dùng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số riêng (khuyến nghị)">
    Đây là chế độ vận hành gọn nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ ràng hơn
    - khả năng nhầm lẫn tự nhắn thấp hơn

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
    Quy trình khởi tạo hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự nhắn:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi chạy, các biện pháp bảo vệ tự nhắn dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ dùng WhatsApp Web">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin WhatsApp Twilio riêng trong registry kênh chat tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động truyền tải WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào, vì vậy một phiên thiết bị đã liên kết yên lặng sẽ không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame truyền tải tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên vừa hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng thời gian chờ tin nhắn bình thường cho cửa sổ phục hồi đầu tiên.
- Thời gian socket Baileys được cấu hình rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` kiểm soát ping ứng dụng WhatsApp Web, `connectTimeoutMs` kiểm soát thời gian chờ bắt tay mở kết nối, và `defaultQueryTimeoutMs` kiểm soát thời gian chờ truy vấn Baileys.
- Gửi ra ngoài yêu cầu có listener WhatsApp đang hoạt động cho tài khoản đích.
- Bỏ qua các cuộc trò chuyện trạng thái và broadcast (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động truyền tải WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đi vào: các phiên thiết bị đã liên kết yên lặng vẫn duy trì khi frame truyền tải tiếp tục, nhưng truyền tải bị treo sẽ buộc kết nối lại khá lâu trước đường ngắt kết nối từ xa về sau.
- Trò chuyện trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được tách biệt (`agent:<agentId>:whatsapp:group:<jid>`).
- Truyền tải WhatsApp Web tôn trọng các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn cài đặt proxy WhatsApp riêng cho kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng xác nhận WhatsApp sau khi phản hồi hiển thị đã được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đi vào có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không phát payload hook `message_received` đi vào cho Plugin
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

Bạn có thể giới hạn phạm vi bật cho một tài khoản:

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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin tưởng cho phép nhận nội dung
và định danh tin nhắn WhatsApp đi vào.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát quyền truy cập trò chuyện trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số kiểu E.164 (được chuẩn hóa nội bộ).

    Ghi đè đa tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) có quyền ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép nối được lưu trong kho cho phép của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối DM `fromMe` gửi ra ngoài (tin nhắn bạn tự gửi cho mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + allowlist">
    Truy cập nhóm có hai lớp:

    1. **Allowlist thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như allowlist nhóm (cho phép `"*"`)

    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ tin nhắn nhóm đi vào

    Dự phòng allowlist người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime quay về dùng `allowFrom` khi có
    - allowlist người gửi được đánh giá trước kích hoạt bằng nhắc đến/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, dự phòng chính sách nhóm trong runtime là `allowlist` (kèm log cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Nhắc đến + /activation">
    Phản hồi trong nhóm mặc định yêu cầu nhắc đến.

    Phát hiện nhắc đến bao gồm:

    - các nhắc đến WhatsApp tường minh tới danh tính bot
    - các mẫu regex nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi chú thoại đi vào cho tin nhắn nhóm đã được cho phép
    - phát hiện trả lời ngầm tới bot (người gửi trả lời khớp danh tính bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ đáp ứng cổng nhắc đến; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng có trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được kiểm soát theo chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự nhắn

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự nhắn của WhatsApp sẽ kích hoạt:

- bỏ qua xác nhận đã đọc cho lượt tự nhắn
- bỏ qua hành vi tự kích hoạt bằng mention-JID vốn có thể ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, phản hồi tự nhắn mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Envelope đi vào + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong envelope đi vào dùng chung.

    Nếu có trả lời được trích dẫn, ngữ cảnh được thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).

  </Accordion>

  <Accordion title="Placeholder media và trích xuất vị trí/liên hệ">
    Tin nhắn đi vào chỉ có media được chuẩn hóa với các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ghi chú thoại nhóm đã được cho phép được chép lời trước cổng nhắc đến khi
    nội dung chỉ là `<media:audio>`, vì vậy nói lời nhắc đến bot trong ghi chú thoại có thể
    kích hoạt phản hồi. Nếu bản chép lời vẫn không nhắc đến bot,
    bản chép lời được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không tin cậy trong khối fenced, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Đối với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Marker chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Xác nhận đã đọc">
    Xác nhận đã đọc được bật theo mặc định cho các tin nhắn WhatsApp đi vào được chấp nhận.

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

    Lượt tự nhắn bỏ qua xác nhận đã đọc ngay cả khi được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia khúc và media

<AccordionGroup>
  <Accordion title="Chia khúc văn bản">
    - giới hạn khúc mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), rồi quay về chia khúc an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ tải trọng hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua tải trọng Baileys `audio` với `ptt: true`, nên các ứng dụng khách WhatsApp hiển thị nó dưới dạng ghi chú thoại nhấn để nói
    - tải trọng trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM từ Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus mono 48 kHz trước khi gửi PTT
    - `/tts latest` gửi câu trả lời mới nhất của trợ lý dưới dạng một ghi chú thoại và ngăn gửi lặp lại cho cùng câu trả lời; `/tts chat on|off|default` kiểm soát auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi tải trọng trả lời nhiều phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì các ứng dụng khách WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://`, hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện nhận vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (quét thay đổi kích thước/chất lượng) để phù hợp với giới hạn
    - khi gửi phương tiện thất bại, dự phòng mục đầu tiên sẽ gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Khả năng hiển thị lỗi

`channels.whatsapp.exposeErrorText` kiểm soát việc văn bản lỗi của agent/nhà cung cấp có được gửi lại vào WhatsApp hay không. Mặc định là `true`. Đặt thành `false` để giữ lỗi im lặng trên WhatsApp trong khi vẫn giữ nguyên hành vi kênh khác.

```json5
{
  channels: {
    whatsapp: {
      exposeErrorText: false,
    },
  },
}
```

Ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<id>.exposeErrorText`.

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó các câu trả lời gửi đi hiển thị rõ phần trích dẫn tin nhắn nhận vào. Kiểm soát bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thường                      |
| `"first"`   | Chỉ trích dẫn phần trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi phần trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các câu trả lời theo lô trong hàng đợi, còn câu trả lời tức thì thì không trích dẫn |

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

`channels.whatsapp.reactionLevel` kiểm soát phạm vi agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do agent khởi tạo | Mô tả                                           |
| ------------- | ----------------- | -------------------------- | ----------------------------------------------- |
| `"off"`       | Không             | Không                      | Không có phản ứng nào                           |
| `"ack"`       | Có                | Không                      | Chỉ phản ứng xác nhận (biên nhận trước trả lời) |
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

WhatsApp hỗ trợ phản ứng xác nhận tức thì khi nhận tin nhắn đến qua `channels.whatsapp.ackReaction`.
Phản ứng xác nhận bị chặn bởi `reactionLevel` — chúng bị tắt khi `reactionLevel` là `"off"`.

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

- gửi ngay sau khi tin nhắn nhận vào được chấp nhận (trước trả lời)
- lỗi được ghi log nhưng không chặn việc gửi trả lời bình thường
- chế độ nhóm `mentions` phản ứng trong các lượt được kích hoạt bằng nhắc đến; kích hoạt nhóm `always` hoạt động như cách bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` kế thừa không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và giá trị mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì id tài khoản đã cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích kế thừa">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định kế thừa trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Trong các thư mục xác thực kế thừa, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

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

    Cách sửa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết với các lần ngắt kết nối hoặc thử kết nối lại lặp lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối sau thời gian chờ tin nhắn bình thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng vẫn im lặng quá cửa sổ an toàn dài hơn.

    Nếu log hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
    thời gian socket Baileys trong `web.whatsapp`. Bắt đầu bằng cách rút ngắn
    `keepAliveIntervalMs` xuống dưới thời gian chờ nhàn rỗi của mạng và tăng
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
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể dùng, với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe hoạt động khi gửi">
    Các lần gửi đi thất bại nhanh khi không có trình lắng nghe gateway hoạt động cho tài khoản đích.

    Đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục danh sách cho phép `groups`
    - cổng nhắc đến (`requireMention` + mẫu nhắc đến)
    - khóa trùng lặp trong `openclaw.json` (JSON5): mục sau ghi đè mục trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun bị gắn cờ là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Lời nhắc hệ thống

WhatsApp hỗ trợ lời nhắc hệ thống kiểu Telegram cho nhóm và trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không gộp sâu). Sau đó quá trình tra cứu lời nhắc chạy trên một map đơn kết quả:

1. **Lời nhắc hệ thống dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị chặn và không áp dụng lời nhắc hệ thống nào.
2. **Lời nhắc hệ thống ký tự đại diện cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không gộp sâu). Sau đó quá trình tra cứu lời nhắc chạy trên một map đơn kết quả:

1. **Lời nhắc hệ thống dành riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị chặn và không áp dụng lời nhắc hệ thống nào.
2. **Lời nhắc hệ thống ký tự đại diện cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè lời nhắc nằm trong `direct`.
</Note>

**Khác biệt so với hành vi nhiều tài khoản của Telegram:** Trong Telegram, `groups` gốc bị chặn có chủ ý cho tất cả tài khoản trong thiết lập nhiều tài khoản — kể cả các tài khoản không tự định nghĩa `groups` — để ngăn bot nhận tin nhắn nhóm cho các nhóm mà nó không thuộc về. WhatsApp không áp dụng biện pháp bảo vệ này: `groups` gốc và `direct` gốc luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp nhiều tài khoản, nếu bạn muốn lời nhắc theo từng tài khoản cho nhóm hoặc trực tiếp, hãy định nghĩa rõ map đầy đủ trong từng tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo nhóm vừa là danh sách cho phép nhóm ở cấp trò chuyện. Ở phạm vi gốc hoặc tài khoản, `groups["*"]` nghĩa là "tất cả nhóm được chấp nhận" cho phạm vi đó.
- Chỉ thêm ký tự đại diện nhóm `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập hợp cố định các ID nhóm đủ điều kiện, đừng dùng `groups["*"]` cho mặc định lời nhắc. Thay vào đó, lặp lại lời nhắc trên từng mục nhóm được đưa vào danh sách cho phép rõ ràng.
- Cho phép nhóm và ủy quyền người gửi là hai kiểm tra riêng biệt. `groups["*"]` mở rộng tập hợp các nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bằng `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có tác dụng phụ tương tự cho DM. `direct["*"]` chỉ cung cấp cấu hình trò chuyện trực tiếp mặc định sau khi DM đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc quy tắc kho ghép cặp.

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
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`, `exposeErrorText`
- nhiều tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, các ghi đè ở cấp tài khoản
- vận hành: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- hành vi phiên: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- lời nhắc: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
