---
read_when:
    - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T00:06:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf363ec2cc7100635ee6b0a7b0e7bb956521d0203b445fd38b5a75a13e8918a6
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway sở hữu các phiên đã liên kết.

## Cài đặt (khi cần)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  nhắc cài đặt Plugin WhatsApp vào lần đầu bạn chọn nó.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: dùng gói npm `@openclaw/whatsapp` khi một gói hiện hành
  đã được phát hành.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install @openclaw/whatsapp
```

Nếu npm báo gói do OpenClaw sở hữu đã bị deprecated hoặc bị thiếu, hãy dùng một
bản dựng OpenClaw đã đóng gói hiện hành hoặc một checkout cục bộ cho đến khi tuyến
gói npm bắt kịp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối cho người gửi không xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Đầy đủ mẫu cấu hình kênh và ví dụ.
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

    Yêu cầu ghép nối hết hạn sau 1 giờ. Yêu cầu đang chờ được giới hạn ở 3 yêu cầu cho mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu hóa cho thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (khuyến nghị)">
    Đây là chế độ vận hành gọn nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ ràng hơn
    - giảm khả năng nhầm lẫn khi tự trò chuyện

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
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự trò chuyện:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Khi chạy, các bảo vệ tự trò chuyện dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="Phạm vi kênh chỉ dùng WhatsApp Web">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh trò chuyện tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport của WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đến, nên một phiên thiết bị đã liên kết yên lặng không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame transport tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho một phiên vừa hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng thời gian chờ tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời lượng socket Baileys được khai báo rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` kiểm soát ping ứng dụng WhatsApp Web, `connectTimeoutMs` kiểm soát thời gian chờ bắt tay mở kết nối, và `defaultQueryTimeoutMs` kiểm soát thời gian chờ truy vấn Baileys.
- Gửi ra ngoài yêu cầu một trình lắng nghe WhatsApp đang hoạt động cho tài khoản đích.
- Trò chuyện trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport của WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng đến: các phiên thiết bị đã liên kết yên lặng vẫn hoạt động khi frame transport tiếp tục, nhưng transport bị treo sẽ buộc kết nối lại sớm hơn nhiều so với đường ngắt kết nối từ xa muộn hơn.
- Trò chuyện trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được tách biệt (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web tôn trọng các biến môi trường proxy chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến viết thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn cài đặt proxy WhatsApp riêng theo kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng ack WhatsApp sau khi phản hồi hiển thị được gửi.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đến có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không broadcast payload hook `message_received` đến các Plugin
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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin tưởng để nhận nội dung và định danh
tin nhắn WhatsApp đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy` kiểm soát quyền truy cập trò chuyện trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận các số theo kiểu E.164 (được chuẩn hóa nội bộ).

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn các mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép cặp được lưu trong allow-store của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - nếu không cấu hình allowlist, số tự liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép cặp DM `fromMe` gửi đi (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm + allowlist">
    Quyền truy cập nhóm có hai lớp:

    1. **Allowlist tư cách thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, tất cả nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như allowlist nhóm (cho phép `"*"`)

    2. **Chính sách người gửi nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp với `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ tin nhắn nhóm gửi đến

    Dự phòng allowlist người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime sẽ quay về dùng `allowFrom` khi có sẵn
    - allowlist người gửi được đánh giá trước khi kích hoạt bằng nhắc đến/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, giá trị dự phòng runtime của chính sách nhóm là `allowlist` (kèm nhật ký cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Nhắc đến + /activation">
    Theo mặc định, trả lời trong nhóm yêu cầu nhắc đến.

    Phát hiện nhắc đến bao gồm:

    - các nhắc đến WhatsApp rõ ràng đến danh tính bot
    - các mẫu regex nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi âm thoại gửi đến cho các tin nhắn nhóm đã được ủy quyền
    - phát hiện trả lời bot ngầm định (người gửi trả lời khớp với danh tính bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ đáp ứng cổng nhắc đến; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được giới hạn cho chủ sở hữu.

  </Tab>
</Tabs>

## Hành vi số cá nhân và tự trò chuyện

Khi số tự liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự trò chuyện của WhatsApp được kích hoạt:

- bỏ qua biên nhận đã đọc cho các lượt tự trò chuyện
- bỏ qua hành vi tự kích hoạt bằng JID nhắc đến vốn có thể tự ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, trả lời tự trò chuyện mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì gửi đến + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong phong bì gửi đến dùng chung.

    Nếu có trả lời được trích dẫn, ngữ cảnh được nối thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có sẵn (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).

  </Accordion>

  <Accordion title="Placeholder phương tiện và trích xuất vị trí/liên hệ">
    Tin nhắn gửi đến chỉ có phương tiện được chuẩn hóa với các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ghi âm thoại trong nhóm đã được ủy quyền được chép lời trước cổng nhắc đến khi
    nội dung chỉ là `<media:audio>`, vì vậy việc nói lời nhắc đến bot trong ghi âm thoại có thể
    kích hoạt trả lời. Nếu bản chép lời vẫn không nhắc đến bot,
    bản chép lời được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không tin cậy trong khối fenced, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Đối với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` sẽ tắt

    Dấu chèn:

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
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó quay về chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ tải trọng hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua tải trọng `audio` của Baileys với `ptt: true`, nên các máy khách WhatsApp hiển thị dưới dạng ghi chú thoại nhấn-để-nói
    - tải trọng trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích với ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM của Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus đơn âm 48 kHz trước khi gửi PTT
    - `/tts latest` gửi câu trả lời mới nhất của trợ lý dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng câu trả lời; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - phát lại GIF động được hỗ trợ qua `gifPlayback: true` khi gửi video
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi tải trọng trả lời đa phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì các máy khách WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện gửi vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện gửi đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo từng tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để nằm trong giới hạn
    - khi gửi phương tiện thất bại, dự phòng mục đầu tiên sẽ gửi cảnh báo bằng văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó câu trả lời gửi đi hiển thị phần trích dẫn tin nhắn gửi vào. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thường                      |
| `"first"`   | Chỉ trích dẫn đoạn trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi đoạn trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các câu trả lời theo lô đang xếp hàng trong khi để các câu trả lời tức thời không trích dẫn |

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

`channels.whatsapp.reactionLevel` điều khiển mức độ rộng rãi mà agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng ack | Phản ứng do agent khởi tạo | Mô tả                                                   |
| ------------- | ------------ | -------------------------- | ------------------------------------------------------- |
| `"off"`       | Không        | Không                      | Hoàn toàn không có phản ứng                             |
| `"ack"`       | Có           | Không                      | Chỉ phản ứng ack (biên nhận trước khi trả lời)          |
| `"minimal"`   | Có           | Có (thận trọng)            | Ack + phản ứng của agent với hướng dẫn thận trọng       |
| `"extensive"` | Có           | Có (khuyến khích)          | Ack + phản ứng của agent với hướng dẫn được khuyến khích |

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

WhatsApp hỗ trợ phản ứng ack tức thời khi nhận tin nhắn gửi vào qua `channels.whatsapp.ackReaction`.
Phản ứng ack được kiểm soát bởi `reactionLevel` — chúng bị chặn khi `reactionLevel` là `"off"`.

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

- được gửi ngay sau khi tin nhắn gửi vào được chấp nhận (trước khi trả lời)
- lỗi được ghi nhật ký nhưng không chặn việc gửi trả lời bình thường
- chế độ nhóm `mentions` phản ứng ở các lượt được kích hoạt bởi lượt nhắc đến; kích hoạt nhóm `always` hoạt động như đường vòng cho kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì dùng id tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

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

    Cách khắc phục:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết bị ngắt kết nối lặp lại hoặc liên tục thử kết nối lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối sau thời gian chờ tin nhắn bình thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động ở cấp ứng dụng im lặng vượt quá cửa sổ an toàn dài hơn.

    Nếu nhật ký hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
    thời gian socket Baileys trong `web.whatsapp`. Bắt đầu bằng cách rút ngắn
    `keepAliveIntervalMs` xuống thấp hơn thời gian chờ nhàn rỗi của mạng và tăng
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

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy tiêu chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng, và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe hoạt động khi gửi">
    Các lần gửi đi thất bại nhanh khi không có trình lắng nghe gateway hoạt động cho tài khoản đích.

    Hãy đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - mục allowlist `groups`
    - cổng nhắc đến (`requireMention` + mẫu nhắc đến)
    - khóa trùng lặp trong `openclaw.json` (JSON5): mục phía sau ghi đè mục phía trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun bị đánh dấu là không tương thích để vận hành gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Prompt hệ thống

WhatsApp hỗ trợ prompt hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không gộp sâu). Sau đó tra cứu prompt chạy trên một map duy nhất thu được:

1. **Prompt hệ thống theo nhóm cụ thể** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống.
2. **Prompt hệ thống wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không gộp sâu). Sau đó tra cứu prompt chạy trên một map duy nhất thu được:

1. **Prompt hệ thống theo trực tiếp cụ thể** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng prompt hệ thống.
2. **Prompt hệ thống wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn vắng mặt trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là vùng chứa ghi đè lịch sử nhẹ theo từng DM (`dms.<id>.historyLimit`). Ghi đè prompt nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi nhiều tài khoản của Telegram:** Trong Telegram, `groups` gốc được cố ý chặn cho tất cả tài khoản trong thiết lập nhiều tài khoản — ngay cả các tài khoản không định nghĩa `groups` riêng — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà nó không thuộc về. WhatsApp không áp dụng biện pháp bảo vệ này: `groups` gốc và `direct` gốc luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp nhiều tài khoản, nếu bạn muốn prompt nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa rõ ràng toàn bộ map dưới mỗi tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo từng nhóm vừa là allowlist nhóm cấp cuộc trò chuyện. Ở phạm vi gốc hoặc tài khoản, `groups["*"]` nghĩa là "tất cả nhóm được chấp nhận" cho phạm vi đó.
- Chỉ thêm wildcard nhóm `systemPrompt` khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn muốn chỉ một tập cố định các ID nhóm đủ điều kiện, đừng dùng `groups["*"]` cho mặc định prompt. Thay vào đó, lặp lại prompt trên từng mục nhóm được allowlist rõ ràng.
- Tiếp nhận nhóm và ủy quyền người gửi là các kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được điều khiển riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ cho DM. `direct["*"]` chỉ cung cấp cấu hình trò chuyện trực tiếp mặc định sau khi DM đã được chấp nhận bởi `dmPolicy` cùng với `allowFrom` hoặc quy tắc kho ghép nối.

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
- gửi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- nhiều tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, ghi đè cấp tài khoản
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
