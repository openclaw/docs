---
read_when:
    - Đang xử lý hành vi kênh WhatsApp/web hoặc định tuyến hộp thư
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho môi trường sản xuất qua WhatsApp Web (Baileys). Gateway sở hữu các phiên đã liên kết.

## Cài đặt (theo nhu cầu)

- Onboarding (`openclaw onboard`) và `openclaw channels add --channel whatsapp`
  sẽ nhắc cài đặt Plugin WhatsApp trong lần đầu bạn chọn kênh này.
- `openclaw channels login --channel whatsapp` cũng cung cấp luồng cài đặt khi
  Plugin chưa có.
- Kênh dev + git checkout: mặc định dùng đường dẫn Plugin cục bộ.
- Stable/Beta: cài đặt Plugin `@openclaw/whatsapp` chính thức từ ClawHub
  trước, với npm làm phương án dự phòng.
- Runtime WhatsApp được phân phối bên ngoài gói npm OpenClaw lõi để
  các phụ thuộc runtime riêng của WhatsApp nằm cùng Plugin bên ngoài.

Cài đặt thủ công vẫn khả dụng:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Chỉ dùng gói npm trần (`@openclaw/whatsapp`) khi bạn cần phương án dự phòng từ registry.
Chỉ ghim phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép đôi cho người gửi chưa xác định.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa lỗi.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/vi/gateway/configuration">
    Mẫu và ví dụ cấu hình kênh đầy đủ.
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

    Đăng nhập hiện tại dựa trên mã QR. Trong môi trường từ xa hoặc không có giao diện,
    hãy đảm bảo bạn có đường dẫn đáng tin cậy để chuyển mã QR trực tiếp đến điện thoại
    sẽ quét mã đó trước khi bắt đầu đăng nhập.

    Với một tài khoản cụ thể:

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

    Yêu cầu ghép đôi hết hạn sau 1 giờ. Số yêu cầu đang chờ được giới hạn ở 3 yêu cầu mỗi kênh.

  </Step>
</Steps>

<Note>
OpenClaw khuyến nghị chạy WhatsApp trên một số riêng khi có thể. (Siêu dữ liệu kênh và luồng thiết lập được tối ưu cho cách thiết lập đó, nhưng thiết lập bằng số cá nhân cũng được hỗ trợ.)
</Note>

<Warning>
Luồng thiết lập WhatsApp hiện tại chỉ dùng QR. QR hiển thị trong terminal, ảnh chụp màn hình,
PDF hoặc tệp đính kèm trò chuyện có thể hết hạn hoặc không đọc được trong khi được chuyển tiếp
từ máy từ xa. Với máy chủ từ xa/không giao diện, nên dùng đường dẫn bàn giao ảnh QR trực tiếp
thay vì chụp thủ công trong terminal.
</Warning>

## Gọi người yêu cầu hiện tại bằng MeowCaller (thử nghiệm)

Plugin WhatsApp có thể hiển thị `whatsapp_call` trong các lượt agent bắt nguồn từ WhatsApp. Công cụ này
dùng [MeowCaller](https://github.com/purpshell/meowcaller) để thực hiện cuộc gọi thoại WhatsApp đến
người yêu cầu được ủy quyền hiện tại và phát một tin nhắn TTS của OpenClaw sau khi họ trả lời. Công cụ
không chấp nhận số đích, nên prompt không thể chuyển hướng cuộc gọi đến bên thứ ba.
Khả năng thử nghiệm này bị tắt theo mặc định.

<Warning>
MeowCaller đang ở trạng thái thử nghiệm, chưa có bản phát hành được gắn tag, và dùng một phiên thiết bị liên kết
whatsmeow được ghép đôi riêng. Nó không thể tái sử dụng thông tin xác thực Baileys của Plugin WhatsApp. Việc ghép đôi thêm
một thiết bị liên kết khác vào cùng tài khoản WhatsApp. Hãy quét bằng danh tính WhatsApp được OpenClaw sử dụng.
Chế độ số cá nhân/tự trò chuyện không thể tự gọi chính nó; hãy dùng một số OpenClaw chuyên dụng
để gọi số cá nhân của bạn.
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    Thêm `actions.calls: true` vào kênh WhatsApp trong `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Hợp nhất phần này vào cấu hình WhatsApp hiện có của bạn, rồi khởi động lại Gateway. Khi
    thiết lập này vắng mặt hoặc là `false`, OpenClaw không hiển thị công cụ `whatsapp_call` cho agent.

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    Bộ chuyển đổi kỳ vọng một tệp thực thi tên `meowcaller` trên `PATH` của máy chủ Gateway.
    Cho đến khi [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) được hợp nhất, hãy build
    nhánh đã được review tại commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Đảm bảo `$HOME/.local/bin` cũng nằm trên `PATH` của dịch vụ Gateway. Bản sửa đổi này cung cấp
    các lệnh `pair` tường minh và `notify` chỉ gửi. `notify` không mở micro, loa,
    thiết bị video, bộ nhận âm thanh vào, hoặc thu thập chẩn đoán. Không thay thế bằng lệnh
    `play` của CLI ví dụ.

  </Step>

  <Step title="Pair the MeowCaller linked device">

    Yêu cầu agent WhatsApp kiểm tra thiết lập cuộc gọi. Hành động trạng thái `whatsapp_call` báo cáo
    thư mục trạng thái theo tài khoản và lệnh ghép đôi. Với tài khoản mặc định:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Chạy lệnh trong một terminal tương tác. Quét QR của lệnh từ **WhatsApp > Linked devices**
    và chờ `MeowCaller linked device ready`. Sau đó lệnh thoát. Giữ `wa-voip.db`
    riêng tư; đó là phiên thiết bị liên kết của MeowCaller. Hành động trạng thái `whatsapp_call`
    trả về lệnh và shell theo tài khoản khi bạn dùng tài khoản không mặc định. Trên
    Windows, chạy lệnh PowerShell của nó; MeowCaller tạo thư mục lưu trữ.

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    Cấu hình một [nhà cung cấp TTS](/vi/tools/tts) có khả năng thoại, khởi động lại Gateway, rồi gửi một
    yêu cầu WhatsApp như `Call me and say the build finished.` Công cụ phân giải người gửi
    từ ngữ cảnh inbound đáng tin cậy, tổng hợp một tệp WAV riêng tư tạm thời, chạy MeowCaller trong một
    cửa sổ cuộc gọi có giới hạn, rồi xóa tệp âm thanh sau đó. OpenClaw truyền rõ ràng kho lưu trữ của
    tài khoản, chờ trạng thái thoát bằng không sau khi trả lời, phát lại và gác máy, đồng thời xem
    timeout hoặc thoát khác không là một lần gọi công cụ thất bại.

  </Step>
</Steps>

Giới hạn hiện tại:

- chỉ cuộc gọi âm thanh outbound một-một
- không có số đích tùy ý
- không chia sẻ xác thực với kết nối trò chuyện
- không tự gọi từ chế độ số cá nhân/tự trò chuyện
- âm thanh tổng hợp bị giới hạn ở 60 giây
- không có biên nhận nghe được ở phía thiết bị cầm tay ngoài hoàn tất trả lời/phát lại/gác máy của MeowCaller
- OpenClaw dừng tiến trình đồng hành sau một cửa sổ giới hạn 115-175 giây, bao gồm
  các pha kết nối, trả lời, phát lại và tắt của MeowCaller

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Đây là chế độ vận hành sạch nhất:

    - danh tính WhatsApp riêng cho OpenClaw
    - allowlist DM và ranh giới định tuyến rõ hơn
    - giảm khả năng nhầm lẫn tự trò chuyện

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
    Onboarding hỗ trợ chế độ số cá nhân và ghi một baseline thân thiện với tự trò chuyện:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bao gồm số cá nhân của bạn
    - `selfChatMode: true`

    Trong runtime, các biện pháp bảo vệ tự trò chuyện dựa trên số tự liên kết và `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Kênh nền tảng nhắn tin dựa trên WhatsApp Web (`Baileys`) trong kiến trúc kênh OpenClaw hiện tại.

    Không có kênh nhắn tin Twilio WhatsApp riêng trong registry kênh trò chuyện tích hợp.

  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Watchdog kết nối lại dùng hoạt động truyền tải WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng inbound, nên một phiên thiết bị liên kết yên lặng sẽ không bị khởi động lại chỉ vì gần đây không có ai gửi tin nhắn. Một giới hạn im lặng ứng dụng dài hơn vẫn buộc kết nối lại nếu các frame truyền tải tiếp tục đến nhưng không có tin nhắn ứng dụng nào được xử lý trong cửa sổ watchdog; sau một lần kết nối lại tạm thời cho phiên vừa hoạt động gần đây, kiểm tra im lặng ứng dụng đó dùng timeout tin nhắn bình thường cho cửa sổ khôi phục đầu tiên.
- Thời gian socket Baileys được khai báo tường minh dưới `web.whatsapp.*`: `keepAliveIntervalMs` kiểm soát ping ứng dụng WhatsApp Web, `connectTimeoutMs` kiểm soát timeout bắt tay mở kết nối, và `defaultQueryTimeoutMs` kiểm soát thời gian chờ truy vấn Baileys cộng với giới hạn thao tác gửi/presence outbound cục bộ và biên nhận đọc inbound của OpenClaw.
- Gửi outbound yêu cầu một listener WhatsApp đang hoạt động cho tài khoản đích.
- Gửi nhóm gắn siêu dữ liệu mention gốc cho các token `@+<digits>` và `@<digits>` trong văn bản và chú thích media khi token khớp với siêu dữ liệu người tham gia WhatsApp hiện tại, bao gồm các nhóm dùng LID.
- Trò chuyện trạng thái và broadcast bị bỏ qua (`@status`, `@broadcast`).
- Watchdog kết nối lại theo dõi hoạt động truyền tải WhatsApp Web, không chỉ khối lượng tin nhắn ứng dụng inbound: các phiên thiết bị liên kết yên lặng vẫn duy trì trong khi frame truyền tải tiếp tục, nhưng truyền tải bị ngừng sẽ buộc kết nối lại sớm hơn nhiều so với đường ngắt kết nối từ xa về sau.
- Trò chuyện trực tiếp dùng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp DM vào phiên chính của agent).
- Phiên nhóm được cô lập (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là đích outbound tường minh với JID `@newsletter` gốc của chúng. Gửi newsletter outbound dùng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa phiên DM.
- Truyền tải WhatsApp Web tôn trọng các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / các biến chữ thường tương ứng). Nên dùng cấu hình proxy cấp máy chủ thay vì thiết lập proxy WhatsApp riêng theo kênh.
- Khi `messages.removeAckAfterReply` được bật, OpenClaw xóa phản ứng ack WhatsApp sau khi phản hồi hiển thị được gửi.

## Prompt phê duyệt

WhatsApp có thể hiển thị prompt phê duyệt exec và Plugin bằng phản ứng `👍` / `👎`. Việc gửi được
kiểm soát bởi cấu hình chuyển tiếp phê duyệt cấp cao nhất:

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
transport; nó không gửi prompt phê duyệt trừ khi nhóm phê duyệt tương ứng được bật
và định tuyến đến WhatsApp. Chế độ phiên chỉ gửi phê duyệt emoji gốc cho các phê duyệt
bắt nguồn từ WhatsApp. Chế độ đích dùng pipeline chuyển tiếp dùng chung cho các đích WhatsApp
tường minh và không tạo fanout DM người phê duyệt riêng.

Phản ứng phê duyệt WhatsApp yêu cầu người phê duyệt WhatsApp tường minh từ `allowFrom` hoặc `"*"`.
`defaultTo` kiểm soát các đích tin nhắn mặc định thông thường; nó không phải là người phê duyệt phê duyệt. Các lệnh
`/approve` thủ công vẫn đi qua đường dẫn ủy quyền người gửi WhatsApp bình thường trước khi
phân giải phê duyệt.

## Hook Plugin và quyền riêng tư

WhatsApp tin nhắn đến có thể chứa nội dung tin nhắn cá nhân, số điện thoại,
mã định danh nhóm, tên người gửi và các trường tương quan phiên. Vì lý do đó,
WhatsApp không phát các payload hook `message_received` đến plugin
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

Chỉ bật tùy chọn này cho các plugin mà bạn tin tưởng để nhận nội dung và mã định danh
tin nhắn WhatsApp đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` kiểm soát quyền truy cập trò chuyện trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `allowFrom` chấp nhận các số theo kiểu E.164 (được chuẩn hóa nội bộ).

    `allowFrom` là danh sách kiểm soát truy cập người gửi DM. Nó không chặn các lượt gửi đi rõ ràng đến JID nhóm WhatsApp hoặc JID kênh `@newsletter`.

    Ghi đè nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `allowFrom`) được ưu tiên hơn mặc định cấp kênh cho tài khoản đó.

    Chi tiết hành vi runtime:

    - các ghép đôi được lưu bền trong allow-store của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và fallback người nhận Heartbeat dùng đích gửi rõ ràng hoặc `allowFrom` đã cấu hình; phê duyệt ghép đôi DM không mặc nhiên là người nhận Cron hoặc Heartbeat
    - nếu không cấu hình allowlist, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép đôi các DM `fromMe` gửi đi (tin nhắn bạn gửi cho chính mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Group policy + allowlists">
    Quyền truy cập nhóm có hai lớp:

    1. **Allowlist thành viên nhóm** (`channels.whatsapp.groups`)
       - nếu bỏ qua `groups`, tất cả nhóm đều đủ điều kiện
       - nếu có `groups`, nó hoạt động như một allowlist nhóm (cho phép `"*"`)

    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: bỏ qua allowlist người gửi
       - `allowlist`: người gửi phải khớp `groupAllowFrom` (hoặc `*`)
       - `disabled`: chặn toàn bộ tin nhắn nhóm đến

    Fallback allowlist người gửi:

    - nếu chưa đặt `groupAllowFrom`, runtime fallback về `allowFrom` khi có
    - allowlist người gửi được đánh giá trước khi kích hoạt bằng nhắc đến/trả lời

    Lưu ý: nếu hoàn toàn không có khối `channels.whatsapp`, fallback group-policy của runtime là `allowlist` (kèm log cảnh báo), ngay cả khi đã đặt `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Trả lời trong nhóm mặc định yêu cầu nhắc đến.

    Phát hiện nhắc đến bao gồm:

    - các lượt nhắc đến WhatsApp rõ ràng về định danh bot
    - các mẫu regex nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi chú thoại đến cho tin nhắn nhóm đã được ủy quyền
    - phát hiện trả lời-ngầm-cho-bot (người gửi trả lời khớp định danh bot)

    Lưu ý bảo mật:

    - trích dẫn/trả lời chỉ thỏa điều kiện cổng nhắc đến; nó **không** cấp quyền cho người gửi
    - với `groupPolicy: "allowlist"`, người gửi không nằm trong allowlist vẫn bị chặn ngay cả khi họ trả lời tin nhắn của một người dùng nằm trong allowlist

    Lệnh kích hoạt cấp phiên:

    - `/activation mention`
    - `/activation always`

    `activation` cập nhật trạng thái phiên (không phải cấu hình toàn cục). Nó được chặn theo chủ sở hữu.

  </Tab>
</Tabs>

## Liên kết ACP đã cấu hình

WhatsApp hỗ trợ liên kết ACP bền vững với các mục `bindings[]` cấp cao nhất:

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

- Trò chuyện trực tiếp khớp các số E.164 như `+15555550123`.
- Nhóm khớp các JID nhóm WhatsApp như `120363424282127706@g.us`.
- Allowlist nhóm, chính sách người gửi và cổng nhắc đến hoặc kích hoạt chạy trước khi OpenClaw bảo đảm phiên ACP đã cấu hình tồn tại.
- Một liên kết ACP đã cấu hình và khớp sẽ sở hữu tuyến. Nhóm phát rộng WhatsApp không phân tán lượt đó sang các phiên WhatsApp thông thường.

## Hành vi số cá nhân và tự trò chuyện

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ tự trò chuyện của WhatsApp sẽ kích hoạt:

- bỏ qua biên nhận đã đọc cho các lượt tự trò chuyện
- bỏ qua hành vi tự động kích hoạt mention-JID vốn sẽ ping chính bạn
- nếu chưa đặt `messages.responsePrefix`, trả lời tự trò chuyện mặc định là `[{identity.name}]` hoặc `[openclaw]`

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Tin nhắn WhatsApp đến được bọc trong phong bì tin nhắn đến dùng chung.

    Nếu có trả lời được trích dẫn, ngữ cảnh được nối thêm theo dạng này:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Các trường siêu dữ liệu trả lời cũng được điền khi có (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi).
    Khi đích trả lời được trích dẫn là media có thể tải xuống, OpenClaw lưu nó qua
    kho media đến thông thường và hiển thị nó dưới dạng `MediaPath`/`MediaType` để
    agent có thể kiểm tra hình ảnh được tham chiếu thay vì chỉ thấy
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Tin nhắn đến chỉ có media được chuẩn hóa với các placeholder như:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ghi chú thoại nhóm đã được ủy quyền được chép lời trước cổng nhắc đến khi
    phần thân chỉ là `<media:audio>`, vì vậy việc nói lời nhắc đến bot trong ghi chú thoại có thể
    kích hoạt trả lời. Nếu bản chép lời vẫn không nhắc đến bot, bản chép lời
    được giữ trong lịch sử nhóm đang chờ thay vì placeholder thô.

    Phần thân vị trí dùng văn bản tọa độ ngắn gọn. Nhãn/bình luận vị trí và chi tiết liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không tin cậy trong khối rào, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Pending group history injection">
    Đối với nhóm, các tin nhắn chưa xử lý có thể được đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` tắt

    Dấu chèn:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Biên nhận đã đọc được bật theo mặc định cho các tin nhắn WhatsApp đến được chấp nhận.

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

    Các lượt tự trò chuyện bỏ qua biên nhận đã đọc ngay cả khi đã bật toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn và media

<AccordionGroup>
  <Accordion title="Text chunking">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - chế độ `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó fallback về chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Outbound media behavior">
    - hỗ trợ payload hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - media âm thanh được gửi qua payload `audio` của Baileys với `ptt: true`, để client WhatsApp hiển thị nó như một ghi chú thoại nhấn-để-nói
    - payload trả lời giữ nguyên `audioAsVoice`; đầu ra ghi chú thoại TTS cho WhatsApp vẫn ở trên đường dẫn PTT này ngay cả khi provider trả về MP3 hoặc WebM
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus` để tương thích ghi chú thoại
    - âm thanh không phải Ogg, bao gồm đầu ra Microsoft Edge TTS MP3/WebM, được chuyển mã bằng `ffmpeg` sang Ogg/Opus mono 48 kHz trước khi gửi PTT
    - `/tts latest` gửi trả lời assistant mới nhất dưới dạng một ghi chú thoại và chặn gửi lặp lại cho cùng trả lời đó; `/tts chat on|off|default` kiểm soát auto-TTS cho cuộc trò chuyện WhatsApp hiện tại
    - phát lại GIF động được hỗ trợ qua `gifPlayback: true` trên lượt gửi video
    - `forceDocument` / `asDocument` gửi hình ảnh, GIF và video đi qua payload tài liệu của Baileys để tránh nén media của WhatsApp trong khi vẫn giữ tên tệp và loại MIME đã phân giải
    - phụ đề được áp dụng cho mục media đầu tiên khi gửi payload trả lời đa media, ngoại trừ ghi chú thoại PTT gửi âm thanh trước và văn bản hiển thị riêng vì client WhatsApp không hiển thị phụ đề ghi chú thoại một cách nhất quán
    - nguồn media có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - giới hạn lưu media đến: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - giới hạn gửi media đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản dùng `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (quét thay đổi kích thước/chất lượng) để vừa giới hạn, trừ khi `forceDocument` / `asDocument` yêu cầu gửi dưới dạng tài liệu
    - khi gửi media thất bại, fallback mục đầu tiên gửi cảnh báo văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn trả lời

WhatsApp hỗ trợ trích dẫn trả lời gốc, trong đó trả lời gửi đi trích dẫn tin nhắn đến một cách hiển thị. Kiểm soát bằng `channels.whatsapp.replyToMode`.

| Giá trị     | Hành vi                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Không bao giờ trích dẫn; gửi như tin nhắn thường                      |
| `"first"`   | Chỉ trích dẫn đoạn trả lời gửi đi đầu tiên                            |
| `"all"`     | Trích dẫn mọi đoạn trả lời gửi đi                                     |
| `"batched"` | Trích dẫn các trả lời theo lô trong hàng đợi, còn trả lời tức thời không được trích dẫn |

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

`channels.whatsapp.reactionLevel` kiểm soát mức độ rộng rãi agent dùng phản ứng emoji trên WhatsApp:

| Mức           | Phản ứng xác nhận | Phản ứng do agent khởi tạo | Mô tả                                             |
| ------------- | ----------------- | -------------------------- | ------------------------------------------------- |
| `"off"`       | Không             | Không                      | Hoàn toàn không có phản ứng                       |
| `"ack"`       | Có                | Không                      | Chỉ phản ứng xác nhận (biên nhận trước trả lời)   |
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

WhatsApp hỗ trợ phản ứng xác nhận tức thời khi nhận tin nhắn đến qua `channels.whatsapp.ackReaction`.
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

Ghi chú về hành vi:

- được gửi ngay sau khi tin nhắn đến được chấp nhận (trước phản hồi)
- nếu có `ackReaction` nhưng không có `emoji`, WhatsApp dùng emoji danh tính của tác tử được định tuyến, dự phòng về "👀"; bỏ qua `ackReaction` hoặc đặt `emoji: ""` để không gửi phản ứng xác nhận
- lỗi được ghi log nhưng không chặn việc gửi phản hồi thông thường
- chế độ nhóm `mentions` phản ứng trên các lượt được kích hoạt bằng lượt nhắc đến; kích hoạt nhóm `always` đóng vai trò bỏ qua kiểm tra này
- WhatsApp dùng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không được dùng ở đây)

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để cho phép WhatsApp thay thế phản ứng xác nhận trong một lượt thay vì giữ nguyên emoji biên nhận tĩnh. Khi bật, OpenClaw dùng cùng một vị trí phản ứng của tin nhắn đến cho các trạng thái vòng đời như đã xếp hàng, đang suy nghĩ, hoạt động công cụ, Compaction, hoàn tất và lỗi.

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

Ghi chú về hành vi:

- `channels.whatsapp.ackReaction` vẫn kiểm soát liệu phản ứng trạng thái có đủ điều kiện cho tin nhắn trực tiếp và nhóm hay không.
- Phản ứng trạng thái đã xếp hàng dùng cùng emoji xác nhận hiệu lực như phản ứng xác nhận thông thường.
- WhatsApp có một vị trí phản ứng bot cho mỗi tin nhắn, vì vậy các cập nhật vòng đời thay thế phản ứng hiện tại tại chỗ.
- `messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau thời gian giữ hoàn tất/lỗi đã cấu hình.
- Các danh mục emoji công cụ bao gồm `tool`, `coding`, `web`, `deploy`, `build` và `concierge`.

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Chọn tài khoản và giá trị mặc định">
    - ID tài khoản đến từ `channels.whatsapp.accounts`
    - chọn tài khoản mặc định: `default` nếu có, nếu không thì dùng ID tài khoản được cấu hình đầu tiên (đã sắp xếp)
    - ID tài khoản được chuẩn hóa nội bộ để tra cứu

  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và khả năng tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - tệp sao lưu: `creds.json.bak`
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp cho tài khoản đó.

    Khi có thể truy cập Gateway, đăng xuất trước tiên dừng trình lắng nghe WhatsApp đang chạy cho tài khoản đã chọn để phiên đã liên kết không tiếp tục nhận tin nhắn cho đến lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe đang chạy trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và ghi cấu hình

- Hỗ trợ công cụ tác tử bao gồm hành động phản ứng WhatsApp (`react`).
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
    Triệu chứng: tài khoản đã liên kết bị ngắt kết nối lặp lại hoặc thử kết nối lại nhiều lần.

    Tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn thông thường; watchdog
    khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng, hoặc
    hoạt động cấp ứng dụng im lặng vượt quá cửa sổ an toàn dài hơn.

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

    Cách khắc phục:

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
    `~/.openclaw/bin/ensure-whatsapp.sh`; xóa các mục cũ đó bằng
    `crontab -e` vì cron có thể thiếu môi trường user-bus của systemd và
    khiến script cũ đó báo sai tình trạng Gateway.

    Nếu cần, liên kết lại bằng `channels login`.

  </Accordion>

  <Accordion title="Đăng nhập QR hết thời gian chờ sau proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể dùng được với `status=408 Request Time-out` hoặc ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web dùng môi trường proxy chuẩn của máy chủ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến chữ thường tương ứng và `NO_PROXY`). Xác minh tiến trình gateway kế thừa env proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe hoạt động khi gửi">
    Gửi đi thất bại nhanh khi không có trình lắng nghe gateway hoạt động cho tài khoản đích.

    Hãy bảo đảm gateway đang chạy và tài khoản đã được liên kết.

  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không có trong WhatsApp">
    Các hàng bản ghi lưu những gì tác tử đã tạo. Việc gửi qua WhatsApp được kiểm tra riêng: OpenClaw chỉ xem một phản hồi tự động là đã gửi sau khi Baileys trả về ID tin nhắn gửi đi cho ít nhất một lần gửi văn bản hoặc phương tiện hiển thị.

    Phản ứng xác nhận là biên nhận trước phản hồi độc lập. Một phản ứng thành công không chứng minh rằng phản hồi văn bản hoặc phương tiện sau đó đã được WhatsApp chấp nhận.

    Kiểm tra log gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự này:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - các mục danh sách cho phép `groups`
    - cổng nhắc đến (`requireMention` + mẫu nhắc đến)
    - khóa trùng lặp trong `openclaw.json` (JSON5): các mục sau ghi đè mục trước, vì vậy hãy giữ một `groupPolicy` duy nhất cho mỗi phạm vi

    Nếu có `channels.whatsapp.groups`, WhatsApp vẫn có thể quan sát tin nhắn từ các nhóm khác, nhưng OpenClaw loại bỏ chúng trước khi định tuyến phiên. Thêm JID nhóm vào `channels.whatsapp.groups` hoặc thêm `groups["*"]` để chấp nhận tất cả nhóm trong khi vẫn giữ ủy quyền người gửi dưới `groupPolicy` và `groupAllowFrom`.

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Runtime gateway WhatsApp nên dùng Node. Bun được đánh dấu là không tương thích cho hoạt động gateway WhatsApp/Telegram ổn định.
  </Accordion>
</AccordionGroup>

## Prompt hệ thống

WhatsApp hỗ trợ prompt hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp qua các map `groups` và `direct`.

Thứ bậc phân giải cho tin nhắn nhóm:

Map `groups` hiệu lực được xác định trước: nếu tài khoản định nghĩa `groups` riêng, nó thay thế hoàn toàn map `groups` gốc (không gộp sâu). Sau đó tra cứu prompt chạy trên map đơn kết quả:

1. **Prompt hệ thống theo nhóm** (`groups["<groupId>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị chặn và không áp dụng prompt hệ thống.
2. **Prompt hệ thống ký tự đại diện nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

Thứ bậc phân giải cho tin nhắn trực tiếp:

Map `direct` hiệu lực được xác định trước: nếu tài khoản định nghĩa `direct` riêng, nó thay thế hoàn toàn map `direct` gốc (không gộp sâu). Sau đó tra cứu prompt chạy trên map đơn kết quả:

1. **Prompt hệ thống theo tin nhắn trực tiếp** (`direct["<peerId>"].systemPrompt`): được dùng khi mục peer cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị chặn và không áp dụng prompt hệ thống.
2. **Prompt hệ thống ký tự đại diện tin nhắn trực tiếp** (`direct["*"].systemPrompt`): được dùng khi mục peer cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

<Note>
`dms` vẫn là bucket ghi đè lịch sử nhẹ cho từng DM (`dms.<id>.historyLimit`). Ghi đè prompt nằm dưới `direct`.
</Note>

**Khác biệt so với hành vi nhiều tài khoản của Telegram:** Trong Telegram, `groups` gốc được chủ ý chặn cho tất cả tài khoản trong thiết lập nhiều tài khoản — ngay cả các tài khoản không định nghĩa `groups` riêng — để ngăn bot nhận tin nhắn nhóm từ các nhóm mà nó không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ này: `groups` gốc và `direct` gốc luôn được các tài khoản không định nghĩa ghi đè cấp tài khoản kế thừa, bất kể có bao nhiêu tài khoản được cấu hình. Trong thiết lập WhatsApp nhiều tài khoản, nếu bạn muốn prompt nhóm hoặc trực tiếp theo từng tài khoản, hãy định nghĩa đầy đủ map dưới từng tài khoản thay vì dựa vào mặc định cấp gốc.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là map cấu hình theo nhóm vừa là danh sách cho phép nhóm ở cấp trò chuyện. Ở phạm vi gốc hoặc tài khoản, `groups["*"]` nghĩa là "tất cả nhóm được chấp nhận" cho phạm vi đó.
- Chỉ thêm `systemPrompt` nhóm ký tự đại diện khi bạn đã muốn phạm vi đó chấp nhận tất cả nhóm. Nếu bạn vẫn chỉ muốn một tập ID nhóm cố định đủ điều kiện, đừng dùng `groups["*"]` cho mặc định prompt. Thay vào đó, lặp lại prompt trên từng mục nhóm được cho phép rõ ràng.
- Chấp nhận nhóm và ủy quyền người gửi là các kiểm tra riêng biệt. `groups["*"]` mở rộng tập nhóm có thể đi tới xử lý nhóm, nhưng bản thân nó không ủy quyền mọi người gửi trong các nhóm đó. Quyền truy cập của người gửi vẫn được kiểm soát riêng bởi `channels.whatsapp.groupPolicy` và `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` không có cùng tác dụng phụ đối với DM. `direct["*"]` chỉ cung cấp cấu hình cuộc trò chuyện trực tiếp mặc định sau khi một DM đã được chấp nhận bởi `dmPolicy` cộng với `allowFrom` hoặc quy tắc kho ghép cặp.

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
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- đa tài khoản: `accounts.<id>.enabled`, `accounts.<id>.authDir`, các ghi đè ở cấp tài khoản
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
