---
read_when:
    - Làm việc với hành vi kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho production qua WhatsApp Web (Baileys). Gateway quản lý phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp trong lần đầu bạn chọn.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có sẵn.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: cài đặt Plugin `@openclaw/whatsapp` chính thức từ ClawHub
  trước, với npm làm phương án dự phòng.
- Runtime WhatsApp được phân phối bên ngoài gói npm lõi của OpenClaw để
  các phụ thuộc runtime riêng của WhatsApp nằm cùng Plugin bên ngoài.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Chỉ dùng gói npm trần (`@openclaw/whatsapp`) khi bạn cần phương án dự phòng từ registry.
Chỉ ghim một phiên bản chính xác khi bạn cần bản cài đặt có thể tái lập.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối cho người gửi không xác định.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa lỗi.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Đăng nhập hiện tại dựa trên QR. Trong môi trường từ xa hoặc không giao diện, hãy đảm bảo bạn
    có một đường dẫn đáng tin cậy để chuyển mã QR trực tiếp đến điện thoại sẽ quét
    mã đó trước khi bắt đầu đăng nhập.

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

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép nối hết hạn sau 1 giờ. Yêu cầu đang chờ được giới hạn ở 3 yêu cầu mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Metadata kênh và luồng thiết lập được tối ưu hóa cho cách thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

<Warning>
Luồng thiết lập WhatsApp hiện tại chỉ dùng QR. QR hiển thị trong terminal, ảnh chụp màn hình,
PDF hoặc tệp đính kèm trong chat có thể hết hạn hoặc trở nên khó đọc trong khi được chuyển tiếp
từ máy từ xa. Với máy chủ từ xa/không giao diện, ưu tiên đường dẫn bàn giao ảnh QR trực tiếp
thay vì chụp thủ công từ terminal.
</Warning>

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Đây là chế độ vận hành sạch nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ ràng hơn
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

  <Accordion title="Personal-number fallback">
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Trong runtime, các biện pháp bảo vệ self-chat dựa trên số tự thân đã liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry chat-channel tích hợp sẵn.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway quản lý socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động transport WhatsApp Web, không chỉ khối lượng app-message đến, nên một phiên thiết bị đã liên kết đang yên tĩnh sẽ không bị khởi động lại chỉ vì gần đây không ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu transport frame tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên vừa hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn thông thường cho cửa sổ khôi phục đầu tiên.
- Thời lượng socket Baileys được cấu hình rõ dưới `web.whatsapp.*`: `keepAliveIntervalMs` kiểm soát ping ứng dụng WhatsApp Web, `connectTimeoutMs` kiểm soát timeout bắt tay mở kết nối, và `defaultQueryTimeoutMs` kiểm soát thời gian chờ truy vấn Baileys cộng với giới hạn thao tác gửi/presence outbound cục bộ và read-receipt inbound của OpenClaw.
- Gửi outbound yêu cầu một listener WhatsApp đang hoạt động cho tài khoản đích.
- Gửi nhóm gắn metadata mention gốc cho token `@+<digits>` và `@<digits>` trong văn bản và chú thích media khi token khớp với metadata người tham gia WhatsApp hiện tại, bao gồm cả nhóm dựa trên LID.
- Chat trạng thái và phát sóng bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động transport WhatsApp Web, không chỉ khối lượng app-message đến: phiên thiết bị đã liên kết đang yên tĩnh vẫn được giữ hoạt động khi transport frame tiếp tục, nhưng tình trạng transport đứng sẽ buộc kết nối lại sớm hơn nhiều so với đường ngắt kết nối từ xa về sau.
- Chat trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gom DM vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là đích outbound tường minh với JID `@newsletter` gốc. Gửi newsletter outbound dùng metadata phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa phiên DM.
- Transport WhatsApp Web tôn trọng các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Ưu tiên cấu hình proxy cấp máy chủ hơn cài đặt proxy WhatsApp riêng theo kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng ack WhatsApp sau khi một phản hồi hiển thị được chuyển phát.

## Lời nhắc phê duyệt

WhatsApp có thể hiển thị lời nhắc phê duyệt exec và Plugin bằng phản ứng `👍` / `👎`. Việc chuyển phát
được kiểm soát bởi cấu hình chuyển tiếp phê duyệt cấp cao nhất:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` và `approvals.plugin` độc lập với nhau. Bật WhatsApp làm kênh chỉ liên kết
transport; nó không gửi lời nhắc phê duyệt trừ khi nhóm phê duyệt tương ứng được bật
và định tuyến đến WhatsApp. Chế độ phiên chỉ chuyển phát phê duyệt emoji gốc cho các phê duyệt
bắt nguồn từ WhatsApp. Chế độ đích dùng pipeline chuyển tiếp dùng chung cho các đích WhatsApp
tường minh và không tạo fanout approver-DM riêng.

Phản ứng phê duyệt WhatsApp yêu cầu approver WhatsApp tường minh từ `allowFrom` hoặc `"*"`.
`defaultTo` kiểm soát các đích tin nhắn mặc định thông thường; nó không phải là approver phê duyệt. Lệnh
`/approve` thủ công vẫn đi qua đường dẫn ủy quyền người gửi WhatsApp thông thường trước khi
phân giải phê duyệt.

## Hook Plugin và quyền riêng tư

Tin nhắn inbound WhatsApp có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
mã định danh nhóm, tên người gửi và trường tương quan phiên. Vì lý do đó,
WhatsApp không phát payload hook `message_received` inbound đến các Plugin
trừ khi bạn chủ động bật:

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

Chỉ bật tùy chọn này cho các Plugin mà bạn tin cậy để nhận nội dung và mã định danh
tin nhắn inbound WhatsApp.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` kiểm soát quyền truy cập chat trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận số theo kiểu E.164 (được chuẩn hóa nội bộ).

    `allowFrom` là danh sách kiểm soát truy cập người gửi DM. Nó không chặn gửi outbound tường minh đến JID nhóm WhatsApp hoặc JID kênh `@newsletter`.

    Ghi đè đa tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép nối được lưu trong allow-store của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và phương án dự phòng người nhận Heartbeat dùng đích chuyển phát tường minh hoặc `allowFrom` đã cấu hình; phê duyệt ghép nối DM không ngầm định là người nhận cron hoặc heartbeat
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối DM outbound `fromMe` (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Group policy + allowlists">
    Quyền truy cập nhóm có hai lớp:

    1. **Allowlist thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như allowlist nhóm (`"*"` được phép)

    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ inbound nhóm

    Phương án dự phòng allowlist người gửi:

    - nếu `groupAllowFrom` chưa đặt, runtime sẽ fallback về `allowFrom` khi có
    - allowlist người gửi được đánh giá trước kích hoạt mention/reply

    Lưu ý: nếu không tồn tại khối `channels.whatsapp` nào, fallback chính sách nhóm runtime là `allowlist` (kèm warning log), ngay cả khi `channels.defaults.groupPolicy` được đặt.

  </Tab>

  <Tab title="Mentions + /activation">
    Theo mặc định, phản hồi trong nhóm yêu cầu mention.

    Phát hiện mention bao gồm:

    - mention WhatsApp tường minh đến danh tính bot
    - mẫu regex mention đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bản chép lời voice-note inbound cho tin nhắn nhóm đã được ủy quyền
    - phát hiện reply-to-bot ngầm định (người gửi reply khớp danh tính bot)

    Ghi chú bảo mật:

    - quote/reply chỉ thỏa mãn cổng mention; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được giới hạn theo owner.

  </Tab>
</Tabs>

## Liên kết ACP đã cấu hình

WhatsApp hỗ trợ liên kết ACP bền vững bằng các mục `bindings[]` cấp cao nhất:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Trò chuyện trực tiếp khớp với các số E.164 như `+15555550123`.
- Nhóm khớp với JID nhóm WhatsApp như `120363424282127706@g.us`.
- Danh sách cho phép nhóm, chính sách người gửi và cổng mention hoặc kích hoạt chạy trước khi OpenClaw đảm bảo phiên ACP đã cấu hình tồn tại.
- Một liên kết ACP đã cấu hình được khớp sẽ sở hữu tuyến. Các nhóm phát sóng WhatsApp không phân tán lượt đó đến các phiên WhatsApp thông thường.

## Hành vi số cá nhân và tự trò chuyện

Khi số tự liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự trò chuyện của WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho các lượt tự trò chuyện
- bỏ qua hành vi tự động kích hoạt theo mention-JID vốn sẽ tự ping chính bạn
- nếu `messages.responsePrefix` chưa được đặt, phản hồi tự trò chuyện mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì đầu vào + ngữ cảnh trả lời">
    Tin nhắn WhatsApp đến được bọc trong phong bì đầu vào dùng chung.

    Nếu có phản hồi được trích dẫn, ngữ cảnh được thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có sẵn (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).
    Khi mục tiêu trả lời được trích dẫn là phương tiện có thể tải xuống, OpenClaw lưu nó qua
    kho phương tiện đầu vào thông thường và hiển thị dưới dạng `MediaPath`/`MediaType` để
    agent có thể kiểm tra hình ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Phần giữ chỗ phương tiện và trích xuất vị trí/liên hệ">
    Tin nhắn đầu vào chỉ có phương tiện được chuẩn hóa bằng các phần giữ chỗ như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ghi chú thoại nhóm đã được ủy quyền được phiên âm trước cổng mention khi
    nội dung chỉ là `<media:audio>`, vì vậy việc nói mention của bot trong ghi chú thoại có thể
    kích hoạt phản hồi. Nếu bản phiên âm vẫn không mention bot, bản phiên âm
    được giữ trong lịch sử nhóm đang chờ thay vì phần giữ chỗ thô.

    Nội dung vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được kết xuất dưới dạng siêu dữ liệu không đáng tin cậy có rào chắn, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Dấu chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Biên nhận đã đọc được bật mặc định cho các tin nhắn WhatsApp đầu vào được chấp nhận.

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

## Gửi, chia đoạn và phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó chuyển sang chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện đầu ra">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - phương tiện âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, để máy khách WhatsApp kết xuất nó như ghi chú thoại push-to-talk
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn đi theo đường PTT này ngay cả khi nhà cung cấp trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra MP3/WebM của Microsoft Edge TTS, được chuyển mã bằng `ffmpeg` sang Ogg/Opus mono 48 kHz trước khi gửi PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng phản hồi; `/tts chat on|off|default` điều khiển auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - hỗ trợ phát GIF động qua `gifPlayback: true` khi gửi video
    - `forceDocument` / `asDocument` gửi hình ảnh, GIF và video đầu ra qua payload tài liệu của Baileys để tránh nén phương tiện của WhatsApp trong khi vẫn giữ tên tệp đã phân giải và loại MIME
    - chú thích được áp dụng cho mục phương tiện đầu tiên khi gửi payload trả lời đa phương tiện, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì máy khách WhatsApp không kết xuất chú thích ghi chú thoại một cách nhất quán
    - nguồn phương tiện có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu phương tiện đầu vào: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi phương tiện đầu ra: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để vừa giới hạn trừ khi `forceDocument` / `asDocument` yêu cầu gửi dạng tài liệu
    - khi gửi phương tiện thất bại, dự phòng mục đầu tiên gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó phản hồi đầu ra trích dẫn tin nhắn đầu vào một cách hiển thị. Điều khiển bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                                |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thuần                       |
| `"first"`   | Chỉ trích dẫn đoạn phản hồi đầu ra đầu tiên                           |
| `"all"`     | Trích dẫn mọi đoạn phản hồi đầu ra                                    |
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

`channels.whatsapp.reactionLevel` điều khiển mức độ rộng mà agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng Ack | Phản ứng do agent khởi tạo | Mô tả                                               |
| ------------- | ------------ | -------------------------- | --------------------------------------------------- |
| `"off"`       | Không        | Không                      | Không có phản ứng nào                               |
| `"ack"`       | Có           | Không                      | Chỉ phản ứng Ack (biên nhận trước phản hồi)         |
| `"minimal"`   | Có           | Có (thận trọng)            | Ack + phản ứng agent với hướng dẫn thận trọng       |
| `"extensive"` | Có           | Có (khuyến khích)          | Ack + phản ứng agent với hướng dẫn được khuyến khích |

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

WhatsApp hỗ trợ phản ứng ack tức thì khi nhận đầu vào qua `channels.whatsapp.ackReaction`.
Phản ứng Ack chịu cổng bởi `reactionLevel` — chúng bị chặn khi `reactionLevel` là `"off"`.

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

- được gửi ngay sau khi đầu vào được chấp nhận (trước phản hồi)
- nếu `ackReaction` có mặt mà không có `emoji`, WhatsApp dùng emoji danh tính của agent được định tuyến, dự phòng về "👀"; bỏ qua `ackReaction` hoặc đặt `emoji: ""` để không gửi phản ứng ack
- lỗi được ghi log nhưng không chặn việc gửi phản hồi bình thường
- chế độ nhóm `mentions` phản ứng trên các lượt được kích hoạt bằng mention; kích hoạt nhóm `always` đóng vai trò bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để cho phép WhatsApp thay thế phản ứng ack trong một lượt thay vì để lại emoji biên nhận tĩnh. Khi bật, OpenClaw dùng cùng khe phản ứng tin nhắn đầu vào cho các trạng thái vòng đời như xếp hàng, đang suy nghĩ, hoạt động công cụ, Compaction, hoàn tất và lỗi.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Ghi chú hành vi:

- `channels.whatsapp.ackReaction` vẫn điều khiển liệu phản ứng trạng thái có đủ điều kiện cho tin nhắn trực tiếp và nhóm hay không.
- Phản ứng trạng thái đã xếp hàng dùng cùng emoji ack hiệu lực như phản ứng ack thuần.
- WhatsApp có một khe phản ứng bot cho mỗi tin nhắn, nên cập nhật vòng đời thay thế phản ứng hiện tại tại chỗ.
- `messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau thời gian giữ hoàn tất/lỗi đã cấu hình.
- Các danh mục emoji công cụ bao gồm `tool`, `coding`, `web`, `deploy`, `build` và `concierge`.

## Đa tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và mặc định">
    - id tài khoản đến từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì id tài khoản đã cấu hình đầu tiên (đã sắp xếp)
    - id tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, đăng xuất trước tiên dừng trình lắng nghe WhatsApp trực tiếp cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe trực tiếp trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ agent bao gồm hành động phản ứng WhatsApp (`react`).
- Cổng hành động:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ghi cấu hình do kênh khởi tạo được bật mặc định (tắt qua `channels.whatsapp.configWrites=false`).

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
    Triệu chứng: tài khoản đã liên kết bị ngắt kết nối lặp lại hoặc có các lần thử kết nối lại.

    Tài khoản yên lặng có thể duy trì kết nối sau thời gian chờ tin nhắn thông thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng vượt quá cửa sổ an toàn dài hơn.

    Nếu nhật ký hiển thị lặp lại `status=408 Request Time-out Connection was lost`, hãy tinh chỉnh
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Nếu vòng lặp vẫn tiếp diễn sau khi kết nối máy chủ và thời gian đã được sửa, hãy sao lưu
    thư mục xác thực tài khoản và liên kết lại tài khoản đó:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` báo `Gateway inactive` nhưng
    `openclaw gateway status` và `openclaw channels status --probe` cho thấy
    gateway và WhatsApp vẫn khỏe mạnh, hãy chạy `openclaw doctor`. Trên Linux, doctor
    cảnh báo về các mục crontab cũ vẫn gọi
    `~/.openclaw/bin/ensure-whatsapp.sh`; hãy xóa các mục lỗi thời đó bằng
    `crontab -e` vì cron có thể thiếu môi trường user-bus của systemd và
    khiến script cũ đó báo sai tình trạng gateway.

    Nếu cần, hãy liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web sử dụng môi trường proxy tiêu chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng, và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có listener đang hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có listener gateway đang hoạt động cho tài khoản đích.

    Hãy đảm bảo gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không có trong WhatsApp">
    Các hàng bản ghi lưu lại nội dung agent đã tạo. Việc gửi qua WhatsApp được kiểm tra riêng: OpenClaw chỉ xem một phản hồi tự động là đã gửi sau khi Baileys trả về id tin nhắn gửi đi cho ít nhất một lần gửi văn bản hoặc media hiển thị.

    Phản ứng xác nhận là biên nhận độc lập trước phản hồi. Một phản ứng thành công không chứng minh rằng phản hồi văn bản hoặc media sau đó đã được WhatsApp chấp nhận.

    Kiểm tra nhật ký gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - các mục danh sách cho phép `groups`
    - cổng mention (`requireMention` + mẫu mention)
    - khóa trùng lặp trong `openclaw.json` (JSON5): mục xuất hiện sau ghi đè mục trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

    Nếu có `channels.whatsapp.groups`, WhatsApp vẫn có thể quan sát tin nhắn từ các nhóm khác, nhưng OpenClaw loại bỏ chúng trước khi định tuyến phiên. Thêm JID của nhóm vào `channels.whatsapp.groups` hoặc thêm `groups["*"]` để cho phép tất cả nhóm trong khi vẫn giữ ủy quyền người gửi dưới `groupPolicy` và `groupAllowFrom`.

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun được đánh dấu là không tương thích để vận hành gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp hỗ trợ system prompt kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp thông qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` ở gốc (không deep merge). Sau đó, tra cứu prompt chạy trên map đơn kết quả:

1. **System prompt riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng system prompt nào.
2. **System prompt wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt khỏi map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` ở gốc (không deep merge). Sau đó, tra cứu prompt chạy trên map đơn kết quả:

1. **System prompt riêng cho trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), wildcard bị chặn và không áp dụng system prompt nào.
2. **System prompt wildcard cho trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn vắng mặt khỏi map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử nhẹ cho từng DM (`dms.<id>.historyLimit`). Các ghi đè prompt nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi nhiều tài khoản của Telegram:** Trong Telegram, `groups` ở gốc bị chặn có chủ ý cho tất cả tài khoản trong thiết lập nhiều tài khoản, kể cả các tài khoản không định nghĩa `groups` riêng, để ngăn bot nhận tin nhắn nhóm từ các nhóm mà nó không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` ở gốc và `direct` ở gốc luôn được kế thừa bởi các tài khoản không định nghĩa ghi đè cấp tài khoản, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp nhiều tài khoản, nếu bạn muốn prompt nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa rõ map đầy đủ dưới mỗi tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo nhóm vừa là danh sách cho phép nhóm cấp trò chuyện. Ở phạm vi gốc hoặc tài khoản, `groups["*"]` nghĩa là "tất cả nhóm được nhận vào" cho phạm vi đó.
- Chỉ thêm `systemPrompt` nhóm wildcard khi bạn đã muốn phạm vi đó nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` cho mặc định prompt. Thay vào đó, lặp lại prompt trên từng mục nhóm được cho phép rõ ràng.
- Nhận nhóm và ủy quyền người gửi là hai kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng tự nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ cho DM. `direct["*"]` chỉ cung cấp cấu hình mặc định cho trò chuyện trực tiếp sau khi DM đã được nhận bởi `dmPolicy` cộng với `allowFrom` hoặc quy tắc kho ghép đôi.

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

- truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- gửi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- nhiều tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, ghi đè cấp tài khoản
- vận hành: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- hành vi phiên: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liên quan

- [Ghép đôi](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến nhiều agent](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
